# pebble-kite-rev

A maintained revision of **[pebble-kite](https://github.com/CometDog/pebble-kite)** — the
unofficial Pebble front end for [Kagi News](https://help.kagi.com/kagi/news/).

This revision is a derivative work. It keeps the origin project's design, layout and
artwork, and changes the configuration plumbing, the build tooling and the menu icon
palette.

## Provenance and ownership

| Role          | Project                                                         |
| :------------ | :-------------------------------------------------------------- |
| Original work | [CometDog/pebble-kite](https://github.com/CometDog/pebble-kite) |
| This revision | `pebble-kite-rev`                                               |
| Branch point  | `c2df0f4`, released as v1.27.2                                  |

**The original authorship, copyright and licence are unchanged.** This revision claims no
ownership of the origin project. Copyright in the original work remains with its author;
`LICENSE` is the unmodified GNU General Public License v3.0, and `LICENSE-NOTICE` is
unmodified and still governs the Kagi trademarks and assets.

The app is built on the work of others too:

- Kagi News, and the news content it serves — Kagi, Inc.
- TypeScript integration patterns — [`jccit/PebbleKit.ts`](https://github.com/jccit/PebbleKit.ts)
- Build research — [`C-D-Lewis/pebble-dev`](https://github.com/C-D-Lewis/pebble-dev/commit/6fc00db08b10b87c9656d4386f94ea004cdfdceb)

### Notice of modification

This is a modified version of pebble-kite, as required by GPLv3 §5(a). Modifications were
made on 23 November 2026 by the maintainers of this revision and are listed below.

## What the app does

A watch app for the Kagi News daily brief. It browses categories, lists the day's stories,
and drills into each story's background, highlights, perspectives, questions, timeline and
sources. Each source can be shown as a QR code, so a phone can open the full article. The
phone side fetches and caches everything; the watch renders it and never touches the
network itself.

## Changes from the origin project

Twenty files differ from the branch point: eighteen text files, plus the two menu icon
images. The changes are mostly subtractive — `src/ts-config/config.ts` (198 lines) is gone
and `src/ts/index.ts` shrinks from 551 to 443 lines — because the fix removed a whole class
of offset arithmetic rather than adding to it.

### 1. Category selections could not be unticked — fixed

This is the reason the revision exists.

Clay expands a checkbox group onto sequential AppMessage keys, so a group's ID is also a
claim on the IDs that follow it. `UserCategories` sat at `10000` with room for 200 options.
Kagi's category list has since grown past that, so the tail of the list spilled into
`UserSections` at `10200`. Sections are serialised second and won the shared keys, which
made these categories permanently selected and impossible to clear:

| Category index | Key           | Overwritten by                |
| :------------- | :------------ | :---------------------------- |
| 200 – 209      | 10200 – 10209 | the ten section toggles       |
| 210 – 214      | 10210 – 10214 | the last five section toggles |

Index 214 is **World**, and 200–209 are a run of `USA | …` categories. Because saving
re-asserted them, each attempt to remove them silently re-added them.

### 2. Configuration is read by name, not by numeric offset

`clay.getSettings(response, false)` returns settings keyed by `messageKey` _name_, wrapped
in `{ value }`. The handler now reads that directly, so the configuration can no longer be
corrupted by the numeric layout. This removed every hard-coded key offset and shortened
`src/ts/index.ts` from 551 to 443 lines.

A key that is absent falls back to the built-in default; a key that is present but empty is
respected as "the user cleared every box".

### 3. Message-key bands re-spaced, with a build-time guard

`scripts/message-keys.js` now declares every configuration band as a base ID plus the
number of option slots it needs:

| Setting                           | Range       | Slots |
| :-------------------------------- | :---------- | ----: |
| `UserCategories`                  | 11000–11999 |  1000 |
| `UserSections`                    | 12000–12099 |   100 |
| `AdditionalFeeds`                 | 12100–12199 |   100 |
| `UserTimelinePins`                | 12200–12299 |   100 |
| `ClearCacheOnSave`                | 12300–12399 |   100 |
| languages, stories, size, toggles | 12400–12405 |     1 |

`UserCategories` reserves 1000 slots against the 215 in use. `scripts/generate-message-keys.mjs`
now **refuses to run** if any two bands overlap, if a name is declared twice, or if a
configuration band reaches into the protocol band. Protocol keys keep their existing IDs
(10501–10537), so the watch↔phone wire format is unchanged.

### 4. Saving is no longer lost when the network is unavailable

The old handler awaited a cache refresh _before_ its `try` block, so any network failure
aborted the whole handler before the configuration was written. The configuration is now
persisted first, and cache clearing runs afterwards inside its own guard.

### 5. A failing category can no longer strand the watch

Category stories were fetched with an unguarded `Promise.all`, so one failing request
rejected the whole update, `update_categories` was never sent, and the watch remained on the
splash screen indefinitely. Failures are now isolated per category, empty categories are
skipped, and `update_categories` is always sent.

### 6. Smaller corrections

- The `OnThisDay` exclusion compared against translated display names, so it never matched.
  It now compares `categoryId`, which is stable across languages.
- `MAX_HANDLERS` was 15 while 16 handlers were registered, so `tension_index_update` was
  silently dropped and the tension index never reached the watch. Raised to 24.
- `src/ts-config/config.ts`, an unused duplicate of `src/ts/clayConfig.ts`, was deleted.
- `api.ts` no longer imports `handlers`, removing a circular dependency the bundler warned
  about.
- `cache.ts` reads the version from `package.json` rather than the lockfile.
- Section and feed option lists are declared once and shared with the Clay form.

### 7. Menu icon palette

The icon is redrawn in a different palette; the artwork itself is untouched. Every pixel
keeps its original position and alpha, so the shape, stroke weight and negative space are
identical to upstream — only the colour assignment differs.

| Element      | Origin project | This revision |
| :----------- | :------------- | :------------ |
| Strokes      | `#000000`      | `#0E4C57`     |
| Paper        | `#FFFFFF`      | `#F0FBFB`     |
| Badge accent | `#FFAAAA`      | `#4FD1C5`     |

`resources/icons/menu_icon~bw.png` carries the original black-and-white artwork, so the
black-and-white platforms (Diorite and Flint) are unchanged. Everything else that affects
appearance — layout, fonts, colours, and the splash screen — is exactly as upstream.

### 8. Continuous integration

The workflow previously built only on an exact `Bump version X.Y.Z` commit, so nothing else
was ever verified. It now typechecks and builds on every push to `main`, publishes the
`.pbw` as a per-run artefact, and only tags or releases on a version-bump commit. A new
guard fails the run if `package.json` and the commit subject disagree about the version.

## Behaviour differences you will notice

- The previously stuck categories — `World` and the `USA | …` block — can now be toggled.
- "On This Day" no longer appears in the category list, as originally intended.
- Categories with no stories for the day no longer occupy a slot; this matches what the
  settings page already promised.
- Everything else, including the layout, fonts, colours and splash screen, is as upstream.

No migration is required. Clay stores its defaults keyed by message key _name_, so re-spacing
the numeric bands does not invalidate an existing selection.

## Building

```sh
npm ci
npm run build          # type-checked bundle in src/ts-build
pebble build           # .pbw in build/
```

Toolchain versions are pinned in `.tool-versions` (Node 23.7.0) and `.pebble-versions`
(pebble-tool 5.0.38, SDK 4.9.169).

## Versioning

The Pebble manifest accepts `MAJOR`, `MAJOR.MINOR` or `MAJOR.MINOR.PATCH` **only**. A suffix
such as `1.27.2-test.1` is rejected outright:

> App versions must be of the format MAJOR or MAJOR.MINOR or MAJOR.MINOR.PATCH.

Test builds therefore keep the released version number and are distinguished by the CI
artefact name (`kagi-news-<version>-<run number>`). To cut a release, bump `package.json`
and use exactly `Bump version X.Y.Z` as the commit subject.

## Continuous integration on a fork

GitHub disables workflows on forks. Enable them once under the **Actions** tab, and set
**Settings → Actions → General → Workflow permissions** to _Read and write_ so the release
step can create tags.

## Design notes inherited from the origin project

These observations are the original author's, kept because they explain why the code is
shaped the way it is:

> I write new code in chaos where I throw the first thing I can think of at the wall as fast
> as possible until it works then iterate on that over and over until it looks the way I want
> it to while still working.

The three acknowledged oddities are an apparently unnecessary dispatch queue over the
phone→watch bridge, overlapping data-management and navigation abstractions, and three
different file-structure patterns across the code base. The stated goals are a single generic
UI view driven by position, the smallest practical memory and dispatch footprint, support
back to Aplite, and quick adoption of new Kagi API responses.

## Known limits

- The watch displays at most 20 categories (`MAX_ITEMS` in `data_manager.c` and the twenty
  `STRING_CATEGORY_A`–`T` slots). Selecting more than 20 silently truncates. This is an
  upstream design limit, unchanged here.
- The tension index explanation text is assembled on the watch from localised fragments.

## Licence

GNU General Public License v3.0 — see `LICENSE`. Asset and trademark terms are in
`LICENSE-NOTICE`.
