# Changelog

All notable changes to this card are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-20

### Added

- First version: the last nights on one timeline, each with the time asleep, the screen time around it and the last hour before sleep marked, and the minutes of screen in that hour
- Sleep from Life Dashboard's last sleep sensor, the official Android Companion app's Health Connect sensors, a pair of bedtime and wake-up timestamps, or any sensor that is on while asleep
- Screen time from a screen on/off sensor such as the Companion app's interactive sensor, to the minute, or as an estimate from a sensor that counts the day's screen time, such as Life Dashboard's screen time today or `history_stats`
- A `slots` attribute with minutes per quarter of an hour and per app is read too, for the apps of the last hour; no released app sends it yet
- The last 30 nights side by side, calm evenings against the others, shown only when both groups have five nights
- Tap a night to see its numbers, empty states for missing sensors and missing history, a visual editor, and eleven languages
