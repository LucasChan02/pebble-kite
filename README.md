# pebble-kite-rev

A maintained revision of [pebble-kite](https://github.com/CometDog/pebble-kite), the
unofficial Pebble front end for [Kagi News](https://help.kagi.com/kagi/news/).

It shows the Kagi News daily brief on a Pebble: browse categories, read the day's stories,
and drill into background, perspectives, questions, timeline and sources. Each source opens
as a QR code a phone can scan. The phone fetches and caches everything; the watch only
renders.

## About this revision

Forked from `c2df0f4` (v1.27.2). The headline change is a fix. Clay expands a checkbox
group onto sequential message keys, so `UserCategories` at `10000` overlapped
`UserSections` at `10200` once Kagi's category list passed 200 entries, leaving the tail of
the list, including `World`, permanently selected.

Configuration is now read by key name rather than by offset, the key bands are re-spaced
with a build-time overlap guard, and saving no longer breaks when the network is down.
Appearance follows the origin project; only the menu icon palette differs.

## Building

```sh
npm ci
npm run build
pebble build
```

Versions are pinned in `.tool-versions` and `.pebble-versions`. The Pebble manifest accepts
`MAJOR[.MINOR[.PATCH]]` only, so a version cannot carry a suffix.

## Licence

GPLv3, see `LICENSE`; asset and trademark terms are in `LICENSE-NOTICE`. This is a modified
version of pebble-kite under GPLv3 §5(a); original authorship and copyright remain with the
origin author.
