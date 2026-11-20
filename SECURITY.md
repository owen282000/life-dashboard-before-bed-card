# Security policy

The card runs in your browser. It reads the state of the sensors you chose and asks your own Home Assistant for their history, and makes no other requests. A sensor's state and attributes are treated as untrusted: every value is set as text or escaped before it reaches the page.

## Supported versions

Only the latest release receives security fixes.

| Version | Supported |
| ------- | --------- |
| Latest release | Yes |
| Older versions | No |

## Reporting a vulnerability

Please report security problems through a [private advisory](https://github.com/owen282000/life-dashboard-before-bed-card/security/advisories/new), not a public issue. Include what you did, what happened and the version. You'll get an answer as soon as I can, and credit when it's fixed, if you'd like that.

## Scope

In scope: this card, including a sensor value that could run script or break out of the page. Out of scope: Home Assistant itself, the Life Dashboard integration and the phone apps, each of which has its own repository and policy.
