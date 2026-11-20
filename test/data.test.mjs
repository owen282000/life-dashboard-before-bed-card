import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  MIN_GROUP,
  VERSION,
  appsIn,
  axisFor,
  axisTicks,
  blockPieces,
  blocksFromCounter,
  blocksFromOnOff,
  blocksFromSlots,
  clockMinutes,
  compareNights,
  eveningKey,
  formatClock,
  formatDuration,
  formatMinutes,
  formatSinceNoon,
  guessEntities,
  historyRows,
  loadModel,
  localMidnight,
  localeSettings,
  minutesIn,
  missingStrings,
  nightOf,
  nightsFromAttributes,
  nightsFromOnOff,
  nightsFromTimestamps,
  onPeriods,
  screenKind,
  sinceNoon,
  sleepKind,
  toInstant,
  translate,
  withScreen,
  without,
} from "../dist/life-dashboard-before-bed-card.js";
import { IDS, NOW, TIME_ZONE, buildNights, makeHass } from "./fixtures.mjs";

const MIN = 60000;
const HOUR = 60 * MIN;
const at = (text) => Date.parse(text);
const TZ = "Europe/Amsterdam";

test("toInstant reads ISO strings, epoch seconds and epoch milliseconds", () => {
  assert.equal(toInstant("2026-11-19T23:30:00+01:00"), Date.UTC(2026, 10, 19, 22, 30));
  assert.equal(toInstant(1795127400), 1795127400000);
  assert.equal(toInstant(1795127400000), 1795127400000);
  assert.equal(toInstant("unavailable"), null);
  assert.equal(toInstant(""), null);
  assert.equal(toInstant(undefined), null);
  assert.equal(toInstant(Number.NaN), null);
});

test("the clock follows the time zone, and noon is where an evening starts counting", () => {
  assert.equal(clockMinutes(at("2026-11-19T22:30:00Z"), TZ), 23 * 60 + 30);
  assert.equal(sinceNoon(at("2026-11-19T22:30:00Z"), TZ), 11 * 60 + 30);
  assert.equal(sinceNoon(at("2026-11-19T23:30:00Z"), TZ), 12 * 60 + 30);
  assert.equal(sinceNoon(at("2026-11-19T11:00:00Z"), TZ), 0);
  assert.equal(localMidnight(at("2026-11-19T22:30:40Z"), TZ), at("2026-11-18T23:00:00Z"));
});

test("a night before and after midnight belong to the same evening", () => {
  assert.equal(eveningKey(at("2026-11-19T23:30:00+01:00"), TZ), "2026-11-19");
  assert.equal(eveningKey(at("2026-11-20T00:40:00+01:00"), TZ), "2026-11-19");
  assert.equal(eveningKey(at("2026-11-20T22:10:00+01:00"), TZ), "2026-11-20");
});

test("historyRows reads compressed rows and state objects, oldest first", () => {
  const rows = historyRows([
    { s: "on", lu: 200 },
    { s: "off", lu: 100, a: { x: 1 } },
    { state: "on", last_updated: "1970-01-01T00:05:00Z", attributes: { y: 2 } },
    { s: 5, lu: 400 },
    null,
    { s: "on" },
  ]);
  assert.deepEqual(rows.map((row) => [row.at, row.state]), [[100000, "off"], [200000, "on"], [300000, "on"]]);
  assert.deepEqual(rows[0].attributes, { x: 1 });
  assert.deepEqual(historyRows(undefined), []);
});

test("nightOf reads Life Dashboard's start and end, with the minutes asleep", () => {
  const night = nightOf({ start: "2026-11-19T23:41:00+01:00", end: "2026-11-20T07:12:00+01:00", asleep_minutes: 421 });
  assert.equal(night.start, at("2026-11-19T22:41:00Z"));
  assert.equal(night.end, at("2026-11-20T06:12:00Z"));
  assert.equal(night.asleep, 421);
});

test("nightOf reads a stages list and the Companion app's parallel lists", () => {
  const stages = nightOf({ stages: [
    { stage: "light", start: "2026-11-19T23:00:00Z", end: "2026-11-20T02:00:00Z" },
    { stage: "deep", start: "2026-11-20T02:00:00Z", end: "2026-11-20T06:00:00Z" },
  ] });
  assert.equal(stages.end - stages.start, 7 * HOUR);
  assert.equal(stages.asleep, 420);
  const lists = nightOf({
    stageTypes: ["light", "rem"],
    stageStartTimes: ["2026-11-19T23:00:00Z", "2026-11-20T03:00:00Z"],
    stageEndTimes: ["2026-11-20T03:00:00Z", "2026-11-20T05:30:00Z"],
  });
  assert.equal(lists.end - lists.start, 6.5 * HOUR);
});

test("nightOf takes other attribute names, and refuses what is not a night", () => {
  assert.equal(nightOf({ bedtime: "2026-11-19T23:00:00Z", wakeup: "2026-11-20T06:00:00Z" }), null);
  assert.ok(nightOf({ bedtime: "2026-11-19T23:00:00Z", wakeup: "2026-11-20T06:00:00Z" }, { start: "bedtime", end: "wakeup" }));
  assert.equal(nightOf({ start: "2026-11-20T13:00:00Z", end: "2026-11-20T13:40:00Z" }), null, "a nap");
  assert.equal(nightOf({ start: "2026-11-20T06:00:00Z", end: "2026-11-19T23:00:00Z" }), null, "backwards");
  assert.equal(nightOf({ start: "2026-11-17T06:00:00Z", end: "2026-11-19T23:00:00Z" }), null, "two days");
  assert.equal(nightOf({ start: "<img>", end: {} }), null);
  assert.equal(nightOf(null), null);
});

test("a night that is reported again replaces the earlier report", () => {
  const row = (start, end, minutes) => ({ at: 0, state: "1", attributes: { start, end, asleep_minutes: minutes } });
  const nights = nightsFromAttributes([
    row("2026-11-18T23:00:00+01:00", "2026-11-19T07:00:00+01:00", 440),
    row("2026-11-19T23:30:00+01:00", "2026-11-20T05:00:00+01:00", 300),
    row("2026-11-19T23:30:00+01:00", "2026-11-20T07:10:00+01:00", 425),
    { at: 0, state: "unknown", attributes: {} },
  ], TZ);
  assert.equal(nights.length, 2);
  assert.equal(nights[1].asleep, 425);
});

test("an on/off sleep sensor gives nights, joins a short gap and leaves out naps and a running night", () => {
  const rows = historyRows([
    { s: "off", lu: at("2026-11-18T12:00:00Z") / 1000 },
    { s: "on", lu: at("2026-11-18T22:00:00Z") / 1000 },
    { s: "off", lu: at("2026-11-19T02:00:00Z") / 1000 },
    { s: "on", lu: at("2026-11-19T02:10:00Z") / 1000 },
    { s: "off", lu: at("2026-11-19T06:00:00Z") / 1000 },
    { s: "on", lu: at("2026-11-19T13:00:00Z") / 1000 },
    { s: "off", lu: at("2026-11-19T13:30:00Z") / 1000 },
    { s: "on", lu: at("2026-11-19T22:30:00Z") / 1000 },
  ]);
  const nights = nightsFromOnOff(rows, at("2026-11-20T03:00:00Z"), TZ);
  assert.equal(nights.length, 1);
  assert.equal(nights[0].end - nights[0].start, 8 * HOUR);
});

test("two timestamp sensors pair each bedtime with the wake-up after it", () => {
  const stamp = (text, lu) => ({ at: lu, state: text, attributes: {} });
  const nights = nightsFromTimestamps(
    [stamp("2026-11-18T22:00:00Z", 1), stamp("2026-11-19T22:30:00Z", 2), stamp("unknown", 3)],
    [stamp("2026-11-19T06:00:00Z", 1), stamp("2026-11-20T05:45:00Z", 2)],
    TZ,
  );
  assert.deepEqual(nights.map((night) => (night.end - night.start) / MIN), [480, 435]);
  assert.deepEqual(nightsFromTimestamps([stamp("2026-11-18T22:00:00Z", 1)], [], TZ), []);
});

test("on periods close at a change, at unavailable and at now", () => {
  const rows = [
    { at: 0, state: "off" }, { at: 10, state: "on" }, { at: 15, state: "on" }, { at: 30, state: "off" },
    { at: 40, state: "on" }, { at: 50, state: "unavailable" }, { at: 70, state: "on" },
  ];
  assert.deepEqual(onPeriods(rows, 100), [[10, 30], [40, 50], [70, 100]]);
});

test("a screen that stayed on for hours is a lost connection, not use", () => {
  const rows = [{ at: 0, state: "on" }, { at: 20 * MIN, state: "off" }, { at: HOUR, state: "on" }];
  const blocks = blocksFromOnOff(rows, 12 * HOUR);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].minutes, 20);
  assert.equal(blocks[0].exact, true);
});

test("minutesIn counts the part of a block inside the window", () => {
  const blocks = [
    { from: 0, to: 30 * MIN, minutes: 30, exact: true },
    { from: 50 * MIN, to: 70 * MIN, minutes: 20, exact: true },
    { from: 2 * HOUR, to: 3 * HOUR, minutes: 15, exact: false },
  ];
  assert.equal(minutesIn(blocks, 20 * MIN, 60 * MIN), 20);
  assert.equal(minutesIn(blocks, 2 * HOUR, 2.5 * HOUR), 7.5);
  assert.equal(minutesIn(blocks, 4 * HOUR, 5 * HOUR), 0);
});

test("a counter gives a block per rise, and the sync before it is where the block starts", () => {
  const rows = [
    { at: 0, state: "1.0" },
    { at: 4 * HOUR, state: "1.5" },
    { at: 5 * HOUR, state: "1.5" },
    { at: 6 * HOUR, state: "1.75" },
  ];
  const plain = blocksFromCounter(rows, 60);
  assert.deepEqual(plain.map((block) => [block.from / HOUR, block.to / HOUR, Math.round(block.minutes)]), [[2, 4, 30], [5, 6, 15]]);
  assert.equal(plain[0].exact, false);
  const ticked = blocksFromCounter(rows, 60, [0, HOUR, 2 * HOUR, 3 * HOUR, 4 * HOUR, 5 * HOUR, 6 * HOUR]);
  assert.deepEqual(ticked.map((block) => [block.from / HOUR, block.to / HOUR]), [[3, 4], [5, 6]]);
});

test("a block is never shorter than its minutes", () => {
  const blocks = blocksFromCounter([{ at: 0, state: "0" }, { at: 10 * MIN, state: "45" }], 1);
  assert.equal(blocks[0].to - blocks[0].from, 45 * MIN);
});

test("a counter that starts over keeps the evening: the final total fills the gap before midnight", () => {
  const midnight = at("2026-11-20T00:00:00+01:00");
  const rows = [
    { at: midnight - 2 * HOUR, state: "100" },
    { at: midnight - HOUR, state: "120" },
    { at: midnight + 7 * HOUR, state: "10" },
  ];
  const ticks = [midnight - 2 * HOUR, midnight - HOUR, midnight + 7 * HOUR];
  const without_ = blocksFromCounter(rows, 1, ticks);
  assert.deepEqual(without_.map((block) => Math.round(block.minutes)), [20, 10]);
  const blocks = blocksFromCounter(rows, 1, ticks, {
    finals: [{ at: midnight + 7 * HOUR + 500, state: "155" }],
    boundary: () => midnight,
  });
  assert.deepEqual(blocks.map((block) => [block.from - midnight, block.to - midnight, Math.round(block.minutes)]), [
    [-2 * HOUR, -HOUR, 20],
    [-HOUR, 0, 35],
    [0, 7 * HOUR, 10],
  ]);
});

test("an estimate leaves out the time asleep when the rest can hold its minutes", () => {
  const block = { from: 0, to: 10 * HOUR, minutes: 30, exact: false };
  const asleep = [[HOUR, 9 * HOUR]];
  assert.deepEqual(blockPieces(block, asleep), [[0, HOUR], [9 * HOUR, 10 * HOUR]]);
  assert.equal(minutesIn([block], 0, HOUR, asleep), 15);
  assert.equal(minutesIn([block], 0, HOUR), 3);
  // 121 minutes do not fit in the two hours awake, so the whole span counts again.
  assert.deepEqual(blockPieces({ ...block, minutes: 121 }, asleep), [[0, 10 * HOUR]]);
  assert.deepEqual(blockPieces({ ...block, exact: true }, asleep), [[0, 10 * HOUR]]);
  assert.deepEqual(without(0, 10, [[2, 4], [8, 12]]), [[0, 2], [4, 8]]);
});

test("slots become exact blocks with their apps, and bad rows are skipped", () => {
  const blocks = blocksFromSlots([
    { start: "2026-11-19T22:15:00+01:00", minutes: 12, apps: [{ package: "com.whatsapp", name: "WhatsApp", minutes: 7 }, { package: "a.b", minutes: 5 }] },
    { start: "2026-11-19T22:00:00+01:00", minutes: 40 },
    { start: "nope", minutes: 3 },
    { start: "2026-11-19T22:30:00+01:00", minutes: -1 },
    { start: "2026-11-19T22:45:00+01:00", minutes: 5, apps: { "c.d": { name: "<b>", minutes: 5 }, "e.f": 2, "g.h": "x" } },
    null,
  ]);
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].minutes, 15, "never more than the slot is long");
  assert.equal(blocks[1].apps.length, 2);
  assert.deepEqual(blocks[2].apps.map((app) => app.package), ["c.d", "e.f"]);
  assert.deepEqual(blocksFromSlots("x"), []);
  const start = at("2026-11-19T22:20:00+01:00");
  const apps = appsIn(blocks, start, start + HOUR);
  const whatsapp = apps.find((app) => app.package === "com.whatsapp");
  assert.ok(Math.abs(whatsapp.minutes - 7 * (10 / 15)) < 0.01);
  assert.equal(apps[0].name, "<b>", "most used first");
});

test("a night before the screen history began has no number, not zero", () => {
  const nights = [
    { start: 10 * HOUR, end: 18 * HOUR, asleep: 470 },
    { start: 34 * HOUR, end: 42 * HOUR, asleep: 470 },
  ];
  const blocks = [{ from: 33.5 * HOUR, to: 33.75 * HOUR, minutes: 15, exact: true }];
  const out = withScreen(nights, blocks, { window: 60, coveredFrom: 20 * HOUR });
  assert.equal(out[0].before, null);
  assert.equal(out[1].before, 15);
  assert.equal(withScreen(nights, blocks, { coveredFrom: null })[1].before, null);
});

test("the comparison waits until both groups have enough nights", () => {
  const night = (before, startHour, asleep) => ({ start: at("2026-11-10T00:00:00Z") + startHour * HOUR, end: 0, asleep, before });
  const calm = Array.from({ length: 5 }, () => night(5, 22, 460));
  const busy = Array.from({ length: 4 }, () => night(40, 23, 420));
  const waiting = compareNights([...calm, ...busy, night(null, 23, 400)], 15, "UTC");
  assert.equal(waiting.ready, false);
  assert.equal(waiting.busy.nights, 4);
  const ready = compareNights([...calm, ...busy, night(15, 23, 420)], 15, "UTC");
  assert.equal(ready.ready, true);
  assert.equal(ready.calm.fellAsleep, 10 * 60);
  assert.equal(ready.busy.fellAsleep, 11 * 60);
  assert.equal(ready.calm.asleep, 460);
  assert.equal(MIN_GROUP, 5);
});

test("the axis holds every night with its window, on whole hours", () => {
  const nights = [
    { start: at("2026-11-18T22:10:00Z"), end: at("2026-11-19T06:05:00Z") },
    { start: at("2026-11-19T23:40:00Z"), end: at("2026-11-20T07:20:00Z") },
  ];
  const axis = axisFor(nights, 60, "UTC");
  assert.deepEqual(axis, { from: 8 * 60, to: 20 * 60 });
  assert.deepEqual(axisTicks(axis), [480, 660, 840, 1020, 1200]);
  assert.deepEqual(axisFor([], 60, "UTC"), { from: 540, to: 1260 });
});

test("kinds follow the domain, the device class and the slots attribute", () => {
  assert.equal(sleepKind("binary_sensor.bed", {}), "onoff");
  assert.equal(sleepKind("input_boolean.asleep", {}), "onoff");
  assert.equal(sleepKind("sensor.sleep_start", { attributes: { device_class: "timestamp" } }), "timestamp");
  assert.equal(sleepKind("sensor.last_sleep", { attributes: {} }), "attributes");
  assert.equal(screenKind("binary_sensor.phone_interactive", {}), "onoff");
  assert.equal(screenKind("sensor.screen_time_today", { attributes: {} }), "counter");
  assert.equal(screenKind("sensor.timeline", { attributes: { slots: [] } }), "slots");
});

test("durations, minutes and clock times follow the language and the time format", () => {
  assert.equal(formatDuration(432, "en"), "7h 12m");
  assert.equal(formatDuration(23, "en"), "23m");
  assert.equal(formatDuration(Number.NaN, "en"), "");
  assert.equal(formatMinutes(60, "en"), "60 min");
  const h24 = { language: "en-GB", timeZone: "UTC", hour12: false };
  const h12 = { language: "en-US", timeZone: "UTC", hour12: true };
  assert.equal(formatClock(at("2026-11-19T23:41:00Z"), h24), "23:41");
  assert.match(formatClock(at("2026-11-19T23:41:00Z"), h12), /^11:41\sPM$/);
  assert.equal(formatSinceNoon(9 * 60, h24, true), "21:00");
  assert.match(formatSinceNoon(9 * 60, h12, true), /^9\sPM$/);
  assert.equal(formatSinceNoon(12 * 60 + 30, h24), "00:30");
  assert.equal(localeSettings({ locale: { language: "nl", time_format: "12", time_zone: "server" }, config: { time_zone: TZ } }).hour12, true);
  assert.equal(localeSettings({ locale: { language: "en-US", time_format: "24" } }).hour12, false);
  assert.equal(localeSettings({ locale: { language: "nl", time_format: "language", time_zone: "local" } }).timeZone, undefined);
});

test("every language has every string, and none has a dash that reads as machine-written", () => {
  assert.deepEqual(missingStrings(), []);
  assert.equal(translate("nl-NL", "title"), "Voor het slapen");
  assert.equal(translate("xx", "title"), "Before bed");
  assert.equal(translate("en", "cmpNights", { n: 12 }), "12 nights");
  const source = readFileSync(new URL("../dist/life-dashboard-before-bed-card.js", import.meta.url), "utf8");
  const dashes = [0x2013, 0x2014].map((code) => String.fromCharCode(code));
  assert.equal(dashes.some((dash) => source.includes(dash)), false);
});

test("the version is the one in package.json", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(VERSION, pkg.version);
});

test("the picker's first guess prefers Life Dashboard's night and the phone's screen sensor", () => {
  const hass = makeHass();
  assert.deepEqual(guessEntities(hass), { sleep_entity: IDS.sleep, screen_entity: IDS.interactive });
  assert.deepEqual(guessEntities({ states: { "sensor.x_health_connect_sleep_duration": {}, "sensor.y_screen_time_today": {} } }),
    { sleep_entity: "sensor.x_health_connect_sleep_duration", screen_entity: "sensor.y_screen_time_today" });
  assert.deepEqual(guessEntities({}), { sleep_entity: "", screen_entity: "" });
});

// ---------------------------------------------------------------- the whole model

const truth = buildNights().map((night) => night.pre);

test("a screen on/off sensor gives the minutes of the last hour to the minute", async () => {
  const hass = makeHass();
  const model = await loadModel(hass, { sleep_entity: IDS.sleep, screen_entity: IDS.interactive }, NOW);
  assert.equal(model.kind, "onoff");
  assert.equal(model.exact, true);
  assert.equal(model.nights.length, 30);
  assert.equal(model.shown.length, 7);
  model.nights.forEach((night, index) => assert.ok(Math.abs(night.before - truth[index]) <= 1, `night ${index}`));
  assert.equal(model.comparison.ready, true);
  assert.equal(model.comparison.calm.nights + model.comparison.busy.nights, 30);
  assert.equal(hass.calls.length, 2);
  assert.equal(hass.calls[0].no_attributes, false);
  assert.equal(hass.calls[1].minimal_response, true);
  assert.equal(hass.calls.every((call) => call.significant_changes_only === false), true);
});

test("the day total gives an estimate that stays near the truth with hourly syncs", async () => {
  const hass = makeHass();
  const model = await loadModel(hass, { sleep_entity: IDS.sleep, screen_entity: IDS.counter }, NOW);
  assert.equal(model.kind, "counter");
  assert.equal(model.exact, false);
  assert.deepEqual(hass.calls[1].entity_ids, [IDS.counter, IDS.sync, IDS.yesterday]);
  const errors = model.nights.map((night, index) => Math.abs(night.before - truth[index]));
  const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
  assert.ok(mean < 8, `mean error ${mean.toFixed(1)} min`);
  assert.ok(model.nights.every((night) => night.before <= 60));
});

test("slots from the app give the minutes and the apps of the last hour", async () => {
  const hass = makeHass();
  const model = await loadModel(hass, { sleep_entity: IDS.sleep, screen_entity: IDS.slots }, NOW);
  assert.equal(model.kind, "slots");
  assert.equal(model.exact, true);
  assert.deepEqual(hass.calls[1], undefined, "no screen history is read");
  model.nights.forEach((night, index) => assert.ok(Math.abs(night.before - truth[index]) <= 6, `night ${index}`));
  const last = model.shown[model.shown.length - 1];
  assert.ok(last.apps.length >= 2);
  assert.ok(Math.abs(last.apps.reduce((sum, app) => sum + app.minutes, 0) - last.before) < 2);
});

test("bedtime and wake-up sensors, and a bed sensor, give the same nights", async () => {
  const hass = makeHass();
  const stamps = await loadModel(hass, { sleep_entity: IDS.bedtime, wake_entity: IDS.wake, screen_entity: IDS.interactive }, NOW);
  assert.equal(stamps.nights.length, 30);
  stamps.nights.forEach((night, index) => assert.ok(Math.abs(night.before - truth[index]) <= 1));
  const bed = await loadModel(hass, { sleep_entity: IDS.inBed, screen_entity: IDS.interactive }, NOW);
  assert.equal(bed.nights.length, 30);
  const alone = await loadModel(hass, { sleep_entity: IDS.bedtime, screen_entity: IDS.interactive }, NOW);
  assert.equal(alone.nights.length, 0, "a bedtime without a wake-up is not a night");
});

test("with ten days in the recorder the timeline is full and the comparison waits", async () => {
  const hass = makeHass({ keepDays: 10 });
  const model = await loadModel(hass, { sleep_entity: IDS.sleep, screen_entity: IDS.interactive }, NOW);
  assert.equal(model.shown.length, 7);
  assert.ok(model.nights.length <= 11);
  assert.ok(model.shown.every((night) => night.before !== null));
  assert.equal(model.comparison.ready, false);
});

test("the options set the window, the nights shown and the comparison", async () => {
  const hass = makeHass();
  const model = await loadModel(hass, {
    sleep_entity: IDS.sleep, screen_entity: IDS.interactive, window: 30, nights: 5, compare: false, threshold: 10,
  }, NOW);
  assert.equal(model.window, 30);
  assert.equal(model.shown.length, 5);
  assert.equal(model.comparison, null);
  assert.ok(model.shown.every((night) => night.before <= 30));
  assert.ok(Date.parse(hass.calls[0].start_time) > NOW - 8 * 24 * HOUR, "only the days it shows are read");
  const wild = await loadModel(hass, { sleep_entity: IDS.sleep, screen_entity: IDS.interactive, window: "x", nights: 99 }, NOW);
  assert.equal(wild.window, 60);
  assert.equal(wild.shown.length, 14);
});

test("the sample runs in a zone without daylight saving", () => {
  assert.equal(TIME_ZONE, "Etc/GMT-1");
});
