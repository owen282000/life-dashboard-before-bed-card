# Getting help

GitHub shows this page when you open a new issue. Most questions have a faster answer than waiting for a reply.

## Setting it up

The [README](../README.md#install) covers installing through the Marketplace and the card's options.

## The card stays empty

The card needs two sensors: one that knows when you slept and one that knows when the screen was on. "No nights yet" means the sleep sensor has no night with a start and an end in its history; a row with a dash means the screen sensor's history does not reach back to that evening. Home Assistant keeps ten days of history unless `purge_keep_days` says otherwise. An iPhone has no screen sensor: iOS has no API for it.

## Still stuck, or want to ask something

[Discussions](https://github.com/owen282000/life-dashboard-ha/discussions) of the integration is the place for questions, setup help and ideas. No GitHub account? The [feedback board](https://owen282000.com/life-dashboard/feedback/) needs none. Everything on it is public, so leave out health data, logs and webhook URLs.

## Reporting a bug

If something is genuinely broken, open an [issue](https://github.com/owen282000/life-dashboard-before-bed-card/issues/new/choose).

Security problems go through [private advisories](https://github.com/owen282000/life-dashboard-before-bed-card/security/advisories/new), not public issues.
