# Design: where the last hour before sleep comes from

This card puts two things next to each other: when the phone was in use in the evening, and the night that followed. This page records what was looked into before building it (20 November 2026), what the card does with the data that exists today, and what the Android app and the integration have to add for the full version.

## The question

"How long was I on my phone in the last hour before I fell asleep" needs two facts with a time of day on them:

1. **When sleep began and ended**, per night, for the last 7 nights on the timeline and the last 30 for the comparison.
2. **When the phone was in use**, to a few minutes, for the same evenings. A total per day is not enough: an hour of screen time at lunch and an hour at midnight are the same number.

## What exists today

### Sleep

| Source | What it has | Good enough |
| --- | --- | --- |
| Life Dashboard integration, `last_sleep_asleep` | `start`, `end`, `night` and `asleep_minutes` as attributes of the newest main night. Only `stages` is kept out of the recorder, so the sensor's history holds one row per night with its start and end | Yes, for as far back as the recorder goes |
| Life Dashboard long-term statistics, `sleep_asleep` | Hours asleep per wake date, for years | No start time, so no "last hour"; not used |
| Official Android Companion app | `health_connect_sleep_start` and `health_connect_sleep_end` (timestamps), and `health_connect_sleep_duration` with the lists `stageTypes`, `stageStartTimes`, `stageEndTimes` (2026.11.1 or newer) | Yes, from their history |
| A bed sensor, Sleep as Android, a helper | A binary sensor or `input_boolean` that is on while asleep | Yes, from its history |
| iPhone, through Life Dashboard | Apple Health sleep, the same `last_sleep_asleep` | Yes for sleep; see below for the screen |

Sleep is solved with existing sensors. The limit is the recorder: Home Assistant keeps 10 days of states unless `purge_keep_days` is higher, so 7 nights always work and 30 nights only on an instance that keeps 30 days.

### Screen

| Source | What it has | Good enough |
| --- | --- | --- |
| Official Android Companion app, `binary_sensor.<phone>_interactive` | On while the device is interactive, usually the screen. The app reports it as soon as the state changes (documented under the power sensors, next to the advice to feed it to `history_stats`). Disabled until you switch it on under Manage sensors | Yes: its history is the screen's on and off times to the second. It says when, not which apps, and it counts a lit lock screen as use |
| Life Dashboard integration, `screen_time_today` | The day's total, the apps of the day (`apps`, `top_apps`), per app `week_minutes`. No time of day anywhere. The Android app builds the total from `UsageStatsManager.queryEvents` (resume and pause per activity, in `ScreenTimeSessions.aggregate`), so it has the times, but it adds them up per day before sending | Only as an estimate: see below |
| Life Dashboard payload, `last_used` per app | The last moment each app was used that day. The integration does not expose it | No: one moment per app, no duration |
| Life Dashboard long-term statistics, `screen_time` | Hours per day | No time of day; not used |
| `history_stats` over the interactive sensor | Today's screen time as a number that grows while the screen is on | Yes, but the interactive sensor itself is the better pick |
| Family Link, Family Safety | A day total | Only as an estimate, and coarse |
| iPhone | Nothing. iOS has no API that lets an app read screen time and send it anywhere, and the iOS Companion app has no screen sensor | No. This card is for Android phones |

### An estimate from the day total

The history of `screen_time_today` is a staircase: every sync that carries a higher total adds a step. A step of 20 minutes between the sync of 22:07 and the sync of 23:07 means 20 minutes of use somewhere in that hour. That is enough for an estimate, with three corrections the card makes:

- **A value that did not change leaves no row**, so the step before it would look as wide as the whole quiet period. The card reads `last_screen_time_sync` of the same phone, which moves on every sync, and starts each step at the sync before it. For a sensor without one, a step is at most as wide as the usual gap between updates.
- **The last part of the day never shows on the sensor**: the first sync after the day boundary already reports the new day. The card reads `screen_time_yesterday` of the same phone; its value minus the last total seen before the boundary is what was used in between, and that is placed before the boundary (midnight, or the hour in `last_reset`).
- **A phone that did not sync during the night** reports the late evening in the morning, in a step that spans the whole night. The card takes the time asleep out of such a step when the rest can hold its minutes, so the evening's minutes land in the evening.

Inside a step the minutes are spread evenly. With the default sync of once an hour the last hour before sleep is covered by one or two steps, so the number is a rough one; on the sample data (hourly syncs, none at night) it is off by a few minutes on average and by ten to fifteen on a bad night. Setting the screen time sync to every 15 minutes in the app makes it much closer. The card marks every such number with `~`, draws the steps as shaded bands instead of solid marks, and says "estimated" in the label, the legend and the footer.

### Conclusion

| | Without a new app release | Precise |
| --- | --- | --- |
| Sleep start and end | Yes | Yes |
| Screen on and off | Yes, with the Companion app's interactive sensor | To the second |
| Phone in use, from Life Dashboard alone | Yes, as an estimate from the day total | Rough, as good as the sync interval |
| Which apps in the last hour | No | Needs the app to send use per time slot |
| 30 nights | Only with 30 days in the recorder | Needs the integration to keep the slots itself |

## What the card does now

The card takes a `sleep_entity` and a `screen_entity` and works out what each one is:

- Sleep: a sensor whose attributes carry the night (`start` and `end`, a `stages` list, or the Companion app's parallel lists; other names with `start_attribute` and `end_attribute`), a timestamp sensor for the bedtime with a `wake_entity` for the wake-up, or anything that is on while asleep. One night per evening, sessions under two hours left out.
- Screen: anything that is on while the screen is on gives exact marks; a number gives the estimate above; a sensor with a `slots` attribute gives exact marks with apps (next section).

Everything becomes one shape inside the card, a block: so many minutes of screen somewhere between two instants. The minutes of the last hour are the parts of the blocks inside it. That is why the precise source is only another entity to pick: the drawing, the hero numbers and the comparison do not know where the blocks came from.

It reads the history through `history/history_during_period`, at most once per ten minutes and again when a new night arrives: 31 days when the comparison is on, 8 otherwise. A night that the screen history does not reach back to shows a dash, never zero. A screen that read "on" for more than six hours on end is taken as a lost connection and left out.

### The comparison, and what it does not say

The last 30 nights are split in two: evenings with less than the threshold (15 minutes) of screen in the last hour, and the others. For each group the card shows how many nights, the average time of falling asleep and the average time asleep, as a small table. It shows only when both groups have at least five nights, and says so until then.

It is a description of the user's own nights. The card never says one caused the other, never gives advice, and has no score. Late evenings and short nights go together for many reasons, and a late night with the phone is as likely a late night for another reason. The line under the table says it: "What your nights looked like, not what caused it."

## The full version: use per time slot from the app

### Android app

The app already reads `UsageStatsManager.queryEvents` per day and pairs resume and pause events per activity in `ScreenTimeSessions.aggregate`. It closes each session into a per-package sum. For slots the same closed sessions are also cut at each quarter of an hour.

Proposed addition to each day in the screen time payload:

```json
{
  "date": "2026-11-19",
  "total_screen_time_minutes": 196,
  "apps": [],
  "slot_minutes": 15,
  "slots": [
    { "start": "2026-11-19T23:15:00+01:00", "minutes": 12.4,
      "apps": [ { "package": "com.google.android.youtube", "minutes": 9.1 },
                { "package": "com.whatsapp", "minutes": 3.3 } ] }
  ]
}
```

- Only slots with use are sent. `start` is an instant with its offset, so a day boundary other than midnight and a change of time zone need no special case.
- The app filter (**Apps to send**) applies to the slots exactly as it does to the day: an app that is not sent is in no slot.
- Minutes with one decimal: whole minutes per slot would lose every short session, which is most of what happens in the last hour.
- Today and yesterday on every sync; all seven days on the first sync after the update and on **Send history**. A heavy day is about 40 slots, so two days add a few kilobytes to a payload.
- Work: one function next to `aggregate` with unit tests in `ScreenTimeSessionsTest`, the payload in `ScreenTimeSyncManager`, a protocol test vector, the demo data, and a line in the data safety texts if the stores ask for it. No new permission: usage access covers it. Size: small to medium, one release.

### Integration

- `payload.py` reads `slots` and drops rows that are not a time and a number, like it does for apps. An older integration reads only the keys it knows, so the app can ship first; a protocol vector with slots should confirm that before the app release.
- A store per phone, like the app list: the slots of the last 31 days, pruned on every write.
- A sensor on the phone's device, working name `screen_time_timeline`, with the newest slot's time as its state and three attributes kept out of the recorder: `slot_minutes`, `since` (the instant the slots start, so an evening without use reads as zero and not as missing) and `slots` in the shape above, with `name` added per app.
- To keep the state small: the last eight days in full, with apps, and for the older days up to 31 only the totals of the slots in the three hours before each main night, which the integration knows from its sleep ledger. That is roughly 30 to 50 KB on a heavy phone. If that proves too much for a state, the fallback is a websocket command that returns the slots of a period, and a second loader in the card.
- For automations, a sensor `screen_before_sleep` (minutes in the last hour before the newest main night, with a long-term statistic per night) is the natural next step, and would give the comparison more than 30 nights. Not needed for the card.
- Work: parsing, store, sensor, tests, the entities page and the protocol vectors. Size: medium, one release.

### Card

Nothing new to build: the card reads `slots`, `slot_minutes` and `since` today (`blocksFromSlots`, covered by the tests and by `docs/apps-dark.png`), shows the apps of the last hour as chips, and stops calling the number an estimate. When the integration has the sensor, the README and the editor's first guess change, and the apps get the icons and brand colors of the screen time cards.

## Open points

- The interactive sensor counts a lit screen, also on the lock screen or while a video plays untouched. The app's slots count an app in the foreground. The two can differ by a few minutes an evening; the labels say "screen on" and "on the phone" for that reason.
- A second device (a tablet in bed) is not seen. One card reads one screen sensor; adding up several is a later option.
- Time asleep comes from the watch or the phone and is as good as that source; the card takes the start of the session as "fell asleep".
- The sample screenshots show 30 nights, which needs 30 days in the recorder for the sources that exist today.
