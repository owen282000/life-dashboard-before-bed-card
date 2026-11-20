// Sample data for the harness and the node tests: thirty made-up nights of one made-up
// phone, as the history Home Assistant would hold for each kind of sensor the card reads.
// Nothing in here was measured on a person.

const MIN = 60000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** The harness and the tests run at this moment: Friday 20 November 2026, 09:30 at UTC+1. */
export const NOW = Date.UTC(2026, 10, 20, 8, 30);
export const TIME_ZONE = "Etc/GMT-1";
const OFFSET = HOUR;

export const IDS = {
  sleep: "sensor.sams_pixel_last_sleep_asleep",
  interactive: "binary_sensor.sams_pixel_interactive",
  counter: "sensor.sams_pixel_screen_time_today",
  yesterday: "sensor.sams_pixel_screen_time_yesterday",
  sync: "sensor.sams_pixel_last_screen_time_sync",
  slots: "sensor.sams_pixel_screen_time_timeline",
  bedtime: "sensor.sams_pixel_health_connect_sleep_start",
  wake: "sensor.sams_pixel_health_connect_sleep_end",
  inBed: "binary_sensor.bedroom_bed_occupied",
};

const APPS = [
  ["com.google.android.youtube", "YouTube", 1.7],
  ["com.reddit.frontpage", "Reddit", 1.4],
  ["com.whatsapp", "WhatsApp", 1],
  ["com.instagram.android", "Instagram", 0.8],
  ["com.android.chrome", "Chrome", 0.7],
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function iso(ms) {
  const local = new Date(ms + OFFSET).toISOString().slice(0, 19);
  return `${local}+01:00`;
}

/**
 * Thirty evenings, oldest first. Each has the night that followed ({ start, end, asleep })
 * and the phone's use as segments ({ from, to, app }), with `pre` minutes of it in the last
 * hour before sleep.
 */
export function buildNights(count = 30, seed = 4711) {
  const random = mulberry32(seed);
  const pick = () => {
    const total = APPS.reduce((sum, app) => sum + app[2], 0);
    let at = random() * total;
    for (const app of APPS) { at -= app[2]; if (at <= 0) return app; }
    return APPS[0];
  };
  const today = Math.floor((NOW + OFFSET) / DAY) * DAY - OFFSET;
  const nights = [];
  for (let back = count; back >= 1; back -= 1) {
    const midnight = today - back * DAY;
    const pre = Math.round(3 + random() ** 1.3 * 50);
    const start = midnight + 21 * HOUR + Math.round(105 + random() * 70 + pre * 0.7) * MIN;
    const end = start + Math.round(8 * 60 + 5 - pre * 1.05 + (random() - 0.5) * 50) * MIN;
    const segments = [];
    const add = (from, minutes) => segments.push({ from, to: from + Math.round(minutes * 60) * 1000, app: pick() });
    // The day: a handful of sessions between nine and nine.
    for (let at = midnight + 9 * HOUR + random() * 40 * MIN; at < midnight + 20.5 * HOUR;) {
      const length = 4 + random() * 22;
      add(at, length);
      at += length * MIN + (25 + random() * 110) * MIN;
    }
    // The evening before the last hour.
    for (let at = midnight + 21 * HOUR + random() * 15 * MIN; at < start - 80 * MIN;) {
      const length = 4 + random() * 18;
      if (at + length * MIN > start - 62 * MIN) break;
      add(at, length);
      at += length * MIN + (8 + random() * 30) * MIN;
    }
    // The last hour: `pre` minutes in a few sessions.
    let left = pre;
    let at = start - 59 * MIN;
    while (left > 0.5) {
      const length = Math.min(left, 3 + random() * 16);
      const slack = Math.max(0, (start - MIN - at) / MIN - left);
      at += random() * slack * 0.5 * MIN;
      add(at, length);
      at += length * MIN;
      left -= length;
    }
    if (random() < 0.25) add(start + (200 + random() * 120) * MIN, 2 + random() * 3);
    add(end + 3 * MIN, 6 + random() * 10);
    nights.push({ start, end, asleep: Math.round(((end - start) / MIN) * 0.93), pre, segments, midnight });
  }
  return nights;
}

/** The whole minutes of use between two instants. */
function used(segments, from, to) {
  let total = 0;
  for (const segment of segments) total += Math.max(0, Math.min(segment.to, to) - Math.max(segment.from, from));
  return total / MIN;
}

/** The compressed history rows Home Assistant returns, per entity. */
export function buildHistory(nights) {
  const segments = nights.flatMap((night) => night.segments).sort((a, b) => a.from - b.from);
  const rows = Object.fromEntries(Object.values(IDS).map((id) => [id, []]));
  const push = (id, at, state, attributes) => rows[id].push({ s: String(state), lu: at / 1000, ...(attributes ? { a: attributes } : {}) });

  const first = nights[0]?.midnight ?? NOW;
  push(IDS.interactive, first, "off");
  for (const segment of segments) {
    push(IDS.interactive, segment.from, "on");
    push(IDS.interactive, segment.to, "off");
  }

  for (const night of nights) {
    // The watch syncs a little after waking up.
    const at = night.end + 25 * MIN;
    push(IDS.sleep, at, (night.asleep / 60).toFixed(3), {
      night: iso(night.end).slice(0, 10), start: iso(night.start), end: iso(night.end),
      asleep_minutes: night.asleep, unit_of_measurement: "h", device_class: "duration",
    });
    push(IDS.bedtime, at, new Date(night.start).toISOString());
    push(IDS.wake, at, new Date(night.end).toISOString());
    push(IDS.inBed, night.start - 12 * MIN, "on");
    push(IDS.inBed, night.end + 4 * MIN, "off");
  }

  // The app syncs once an hour while the phone is awake, and not during the night.
  let held = null;
  for (let day = first; day < NOW; day += DAY) {
    let reported = false;
    for (let hour = 7; hour <= 23; hour += 1) {
      const at = day + hour * HOUR + 7 * MIN;
      if (at > NOW) break;
      const asleep = nights.some((night) => at > night.start && at < night.end);
      if (asleep) continue;
      push(IDS.sync, at, new Date(at).toISOString());
      // The first sync of a day also carries the finished total of the day before.
      if (!reported) push(IDS.yesterday, at + 400, (Math.floor(used(segments, day - DAY, day)) / 60).toFixed(4));
      reported = true;
      const value = (Math.floor(used(segments, day, at)) / 60).toFixed(4);
      if (value !== held) push(IDS.counter, at + 400, value);
      held = value;
    }
  }
  return rows;
}

/** The `slots` the app could send: minutes per quarter of an hour, with the apps. */
export function buildSlots(nights, slotMinutes = 15) {
  const length = slotMinutes * MIN;
  const slots = new Map();
  for (const segment of nights.flatMap((night) => night.segments)) {
    for (let at = Math.floor(segment.from / length) * length; at < segment.to; at += length) {
      const minutes = (Math.min(segment.to, at + length) - Math.max(segment.from, at)) / MIN;
      const slot = slots.get(at) ?? { minutes: 0, apps: new Map() };
      slot.minutes += minutes;
      slot.apps.set(segment.app[0], { name: segment.app[1], minutes: (slot.apps.get(segment.app[0])?.minutes ?? 0) + minutes });
      slots.set(at, slot);
    }
  }
  return [...slots.entries()].sort((a, b) => a[0] - b[0]).map(([at, slot]) => ({
    start: iso(at),
    minutes: Math.round(slot.minutes * 10) / 10,
    apps: [...slot.apps.entries()].map(([pkg, app]) => ({ package: pkg, name: app.name, minutes: Math.round(app.minutes * 10) / 10 })),
  }));
}

/**
 * A fake `hass` for one phone. `keepDays` is how far back the recorder goes, `count` how
 * many nights exist at all; `language` and `timeFormat` set the profile.
 */
export function makeHass({ count = 30, keepDays = 31, language = "en-GB", timeFormat = "language", dark = false, seed } = {}) {
  const nights = buildNights(count, seed);
  const rows = buildHistory(nights);
  const last = nights[nights.length - 1];
  const state = (id, value, attributes = {}) => ({
    entity_id: id, state: String(value), attributes, last_updated: new Date(NOW - 5 * MIN).toISOString(),
  });
  const latest = (id) => rows[id][rows[id].length - 1] ?? { s: "unknown" };
  const states = {
    [IDS.sleep]: state(IDS.sleep, latest(IDS.sleep).s, latest(IDS.sleep).a),
    [IDS.interactive]: state(IDS.interactive, "off", { friendly_name: "Sam's Pixel Interactive" }),
    [IDS.counter]: state(IDS.counter, latest(IDS.counter).s, { unit_of_measurement: "h", device_class: "duration" }),
    [IDS.yesterday]: state(IDS.yesterday, latest(IDS.yesterday).s, { unit_of_measurement: "h", device_class: "duration" }),
    [IDS.sync]: state(IDS.sync, latest(IDS.sync).s, { device_class: "timestamp" }),
    [IDS.slots]: state(IDS.slots, "ok", { slot_minutes: 15, since: iso(nights[0]?.midnight ?? NOW), slots: buildSlots(nights) }),
    [IDS.bedtime]: state(IDS.bedtime, last ? new Date(last.start).toISOString() : "unknown", { device_class: "timestamp" }),
    [IDS.wake]: state(IDS.wake, last ? new Date(last.end).toISOString() : "unknown", { device_class: "timestamp" }),
    [IDS.inBed]: state(IDS.inBed, "off", { device_class: "occupancy" }),
  };
  const entity = (id, key) => ({ entity_id: id, device_id: "phone", platform: "life_dashboard", translation_key: key });
  const calls = [];
  return {
    states,
    entities: {
      [IDS.sleep]: entity(IDS.sleep, "last_sleep_asleep"),
      [IDS.counter]: entity(IDS.counter, "screen_time_today"),
      [IDS.yesterday]: entity(IDS.yesterday, "screen_time_yesterday"),
      [IDS.sync]: entity(IDS.sync, "last_screen_time_sync"),
    },
    language,
    locale: { language, time_format: timeFormat, time_zone: "server" },
    config: { time_zone: TIME_ZONE },
    themes: { darkMode: dark },
    calls,
    async callWS(message) {
      calls.push(message);
      if (message.type !== "history/history_during_period") throw new Error(`unexpected ${message.type}`);
      const from = Math.max(Date.parse(message.start_time), NOW - keepDays * DAY);
      const out = {};
      for (const id of message.entity_ids) {
        const all = rows[id] ?? [];
        const kept = all.filter((row) => row.lu * 1000 >= from)
          .map((row) => (message.no_attributes ? { s: row.s, lu: row.lu } : row));
        // Like Home Assistant: the state at the start of the period comes first.
        const before = all.filter((row) => row.lu * 1000 < from).pop();
        if (before && keepDays >= 31) kept.unshift({ ...before, lu: from / 1000 });
        if (kept.length) out[id] = kept;
      }
      return out;
    },
    sample: nights,
  };
}
