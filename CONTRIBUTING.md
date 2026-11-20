# Contributing

Thanks for your interest in improving the Life Dashboard Before Bed card.

## Getting started

The card is one JavaScript file with no dependencies and no build step: `dist/life-dashboard-before-bed-card.js`.

```sh
npm test
node test/render.mjs /tmp/before-bed-card
```

`npm test` runs the data logic under Node. `test/render.mjs` needs Google Chrome: it opens the fake Home Assistant in `test/harness.html`, runs the browser checks in a light and a dark theme, and writes screenshots to the folder you give it. The README's pictures are the first of those, copied into `docs/`.

[docs/design.md](docs/design.md) explains where the numbers come from, how the estimate works, and what the phone app and the integration still have to send.

## What a change should keep

- One file, no dependencies, no build step.
- Every value that comes from a sensor is set as text or escaped.
- A sensor that is missing, unavailable or malformed shows an empty state, never a broken card.
- A night without screen history shows no number, never zero.
- An estimate says it is one, in the number, the legend and the footer.
- No medical claims: the card shows what the nights looked like and never says what caused it or what to do.
- Identity is never color alone: the legend, the shapes and the row labels carry it too.
- Sample data only in fixtures and screenshots, never someone's real phone use or sleep.

## Commits and pull requests

Commit messages and pull request titles follow `type: Sentence with a capital`, such as `fix: Keep the hour ticks inside the plot`. Add a line under `## [Unreleased]` in `CHANGELOG.md` when a user would notice the change.

## Releasing

Versions are strict semver (`X.Y.Z`) and live in four places that must agree: `VERSION` in `dist/life-dashboard-before-bed-card.js`, `version` in `package.json`, the section in `CHANGELOG.md`, and the git tag, which is the version without a prefix. A GitHub release on the tag is what the Marketplace offers to users.

The Marketplace installs `life-dashboard-before-bed-card.js` from the release, and its download count is the install count. The `Release file` workflow runs the tests and attaches the file when a release is published, and fails when the versions do not match the tag. For an older release without the file, run the workflow by hand with that tag.

## Where things belong

The card only draws. Sensors and statistics are in the [integration](https://github.com/owen282000/life-dashboard-ha), and syncing is in the phone apps.
