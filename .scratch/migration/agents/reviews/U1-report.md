Everything in the brief is done. Two things are not fully settled. (1) Three changes a reader can see go beyond what the brief names, and the orchestrator may reverse them: a new `glyph:` key on every theme row of `config/appearance.yml`, a new `badgeMark` field on view registrations, and the hover text of the Settings "Glyphs" toggle. They are listed under judgment calls. (2) `node bin/revert-check.mjs` reports 0 unproven over every test file this step changed, but its exit status is 1. The cause is 464 cases in those files that were already on main and carry no machine-readable revert. Every case this step added or edited carries a directive and is red under it, with one exception: the templated type-scale case, whose table row I edited.

## DONE / NOT DONE

| # | Item | Command | Output (verbatim) |
|---|---|---|---|
| 1 | Node suite | `npx vitest run --reporter=dot` | `Test Files  292 passed (292)` / `Tests  4617 passed (4617)`. One earlier run had a timing failure in `tests/checks/tree/scratch.test.ts` ("is swept by every file under tests that takes one", 6113ms, while the checks ran together). Rerun alone: `Tests  9 passed (9)`. The final full run above is green. |
| 2 | Type check | `npm run check` | `COMPLETED 1331 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | Build | `npm run build` | `build exit 0` |
| 4 | Format | `npm run format:check` | `All matched files use Prettier code style!` |
| 5 | Lint | `npm run lint` | `lint exit 0` |
| 6 | ASCII gate (new form, no glyphs.yml exemption) | the perl command with `! -name local.yml` | prints nothing (`wc -l` of its output: `0`) |
| 6b | glyphs.yml is ASCII | `LC_ALL=C grep -c '[^ -~]' config/catalogs/glyphs.yml` | `0` |
| 7 | Size and folders | `sh bin/size-check.sh`; `sh bin/folder-check.sh` | `size exit 0`; `folder exit 0` |
| 8 | No tokens | `grep -rn "{G\." config src` | no output (exit 1) |
| 9 | Browser suite | `npm run build` then `npx playwright test` | `333 passed (7.4m)`, `pw exit 0`. Port 8792 was free (`lsof` printed nothing). An earlier run had 6 failures: 4 were lane lookups that my first LaneHead markup broke, 1 was my new case, and 1 was `unsaved-forms.spec.ts:342` (a save timeout, timing). The final whole-suite run above passes all of them, the timing case included. |
| 10 | Revert check | `node bin/revert-check.mjs <35 changed test files>` | `127 reverts, 0 unproven, 464 unchecked`. Follow-up runs on files that got more directives: `6 reverts, 0 unproven, 10 unchecked` and `17 reverts, 0 unproven, 76 unchecked`. Every case this step added or changed is `red`, except `type-scale.test.ts :: sets every local role in ${file}` (templated, table data edited). The unchecked cases were on main with prose or no reverts. |
| 11 | Temp dirs | `ls -d $TMPDIR/oculus-* \| wc -l` | `7015` before, `7015` after |

Old ASCII gate command, for the ledger: `... $(find src tests bin config -type f ! -name glyphs.yml)` becomes `... $(find src tests bin config -type f ! -name local.yml)`. No check in the tree exempted glyphs.yml from an ASCII rule (`grep -rln "x7E\|non-ASCII\|\[^ -~\]" tests bin src eslint.config.js` found none). The only exemption was the verification command itself. `glyphReaders` in config-folder.test still skips glyphs.yml, because its values are stand-ins and not reader names.

## What was built

- **`config/catalogs/glyphs.yml`**: one map, `glyphs:`, of 136 names, each with its ASCII stand-in. Each name keeps the stand-in its character had (decision 2). `bang` stays `"!"`. The `ascii:` map is gone.
- **`spark_blocks`** is removed from both `glyphs.yml` and `icons.yml`, since the sparkline is now SVG and nothing reads the name. `icons.yml` is outside the brief's path list; the config-folder test requires the two files to hold the same keys.
- **`text.ts`**:
  - `glyph(name)` returns the stand-in in both modes and throws on an unknown name.
  - `resolveGlyphTokens`, `asciiOf`, `setAscii` and the `ascii` map are gone.
  - `bracketedGlyph` is true only in the ASCII mode.
  - `GlyphMode` is `'icon' | 'ascii'`.
- **`Glyph.svelte`** draws the icon in the icon mode and the stand-in in the ASCII mode. A name with no drawing gets an empty box, never text. It reads `glyph(name)` in both modes, so an unknown name throws in both. The box carries `data-glyph={name}`.
- **Server finding**: `iconFindings` adds `findings.config.glyph_not_ascii` ("glyph {0} has no stand-in of printable ASCII") for a value that is not a non-empty printable ASCII string.
- **Page data**: `asciiCatalog` is removed from `catalogs.ts` and `config.ts`, and the page and socket loads no longer carry `ascii`.
- **The 28 tokens are gone**:
  - Theme rows: new `glyph:` key; Menu items and the current-theme value draw a `Glyph`.
  - Update tray note: `<Glyph name="info" />` beside the note.
  - Source save error: `SourceDraft.failed` is set when a save is refused, and the bar draws `<Glyph name="cross" />` beside the message.
  - Radar intro: new partial `views/feeds/radar/RadarIntro.svelte`. The words are five catalog keys (`intro_lead`, `intro_preempt`, `intro_cite`, `intro_adjacent`, `intro_sparks`). The Glyphs sit beside the HTML, and each legend dot is drawn in the hue `radar_buckets` gives that glyph.
  - HPC pill: `ToolButton glyph="hpc"`.
  - Focus columns: `LaneHead` takes an optional `glyph`; Band passes `focus.funding_glyph`, `jobs_glyph` and `teaching_glyph`.
- **Sparkline**: `sparkBars(counts)` returns heights in eighths, `SPARK_STEPS = [0, 1, 2, 3, 5, 6, 7]`, which are the ramp's block heights. `Ribbon.svelte` draws one `<rect>` per month with `fill="currentColor"`.
- **Mark badge hover**: `badgeOf` says `lookup(registration.badgeMark)`. LinkedIn names `views.linkedin_badge_mark: post overdue`.
- **Tests**:
  - Node cases for a name without an icon, the theme in force, the Update tray note, the refused save, the radar legend, the HPC pill, the Focus columns, the SVG bars, the mark words, and the ASCII mode.
  - Browser cases in `tests/browser/shell/icons.spec.ts` for the Settings theme menu and the Focus columns. They read `textContent` under light and mocha and find nothing outside printable ASCII. Their reverts are YAML `\u25d0` and `\u25c6`.

## Judgment calls (each reversible)

1. **`glyph:` per theme row in `config/appearance.yml`** is a new config key. The alternative was to derive the glyph from the `rice` class.
2. **`badgeMark` registration field and the words "post overdue"**: a mark with no `badgeMark` throws through `lookup('')`.
3. **Radar intro split into five keys.** The legend dots are coloured with the bucket hues from `radar_buckets`, because a line icon has no colour of its own; before this step the emoji carried their own colour. The `white` bucket resolves to `--c-grey-txt`.
4. **Sparkline colour**: the bars use `currentColor` inside `.spark .bars`, whose colour stays `--accent-txt`, the colour the block characters had. The brief says "text colour"; say if it should be `--txt`.
5. **Mode rename `'unicode'` to `'icon'`**, which is internal. The saved ui key `unicode`, `setUnicode` and the "Glyphs" label are kept. The toggle's hover changed (see below).
6. **`chipGlyph` removed** from `tones.ts`: no src reader, and it put a glyph into text.
7. **`data-glyph={name}` on every glyph box.** Node tests now read the glyph by name, since the icon mode draws no character to match on.
8. **LaneHead markup** is now `.lane-title` holding the Glyph plus `.lane-name` holding only the words. This keeps the browser specs' `^Label$` lane lookups working.
9. **`config/text/views/system/config.yml` `desc_glyphs` reworded**, outside the brief's path list, because the old text became false.
10. **`tests/checks/source/html-sites.test.ts:267` still uses `'radar.intro_head'`** inside a sample string handed to `isTrustedArgument`. It is parser input, not a catalog read, so it is left as is.

## Limitations

- The Focus browser case always asserts the Funding column. It checks Jobs and Teaching only when the demo hub draws them; which of those two the demo draws is not verified.
- In the ASCII mode the bracket rule and the stand-ins behave as before. Stand-ins of four characters (`[><]`, `[::]`) still overflow the 3ch box, as they did on main.

## Changes a reader sees (view, state, before, after)

- **Settings theme menu** (Views and Settings page, Theme menu open, light theme):
  - Before: each item was a character plus words, e.g. `◐ light`, `◆ mocha`; a menu item's accessible name included the character.
  - After: a sun-moon or square-terminal line icon, then the words `light` / `mocha`; accessible name `mocha`.
  - Under mocha (ASCII): `(o) light` / `<> mocha` as before.
  - The current-theme value beside the menu now draws the icon too.
- **Focus, Funding / Jobs / Teaching column headers**: before `🪙 Funding`, `🎓 Job applications`, `🏫 Teaching & supervision` as characters; after the Lucide coin / scout / teaching icons in the header's text colour, then the words. Under mocha the stand-ins `($)`, `[^]`, `[T]`.
- **Lit Watch intro**: before, emoji inline (telescope, red / green / white / purple dots). After, a telescope icon and circle icons tinted red, green, grey and purple. The words and the tail line are unchanged.
- **Focus HPC pill** (with a queue): before `🖥 1 HPC job running…`; after a monitor icon beside `1 HPC job running…`.
- **Update tray, inbox row note**: before `ℹ Gmail triage…`; after the info icon beside the words.
- **Source tab, refused save**: before `❌ <error>`; after the cross icon beside `<error>`, removed by the next message.
- **Venues deadline line** (terminal themes only): before block characters (which stayed Unicode even in the ASCII mode); after 12 SVG bars at the same heights, in the accent colour.
- **ASCII mode**: the stand-ins are unchanged.
- **LinkedIn rail or tab badge hover when overdue**: before `LinkedIn !`; after `LinkedIn post overdue`.
- **Settings Glyphs toggle hover**: before "Keep the real glyphs on a terminal theme instead of their ASCII stand-ins."; after "Keep the icons on a terminal theme instead of their ASCII stand-ins."
- **Config view, glyphs.yml description**: before "The glyph vocabulary, one character per name, and the ASCII stand-in a terminal theme draws instead."; after "The glyph vocabulary: each name with the ASCII stand-in a terminal theme draws in place of its icon."
- **A glyph name with no icon row**: before, drawn as its character; after, an empty box plus the config finding.

## Files changed (line counts from `wc -l`)

Config:
- `config/catalogs/glyphs.yml` 150
- `config/catalogs/icons.yml` 149
- `config/appearance.yml` 61
- `config/text/ui.yml` 55
- `config/text/app.yml` 65
- `config/text/findings.yml` 99
- `config/text/views/feeds/radar.yml` 30
- `config/text/views/feeds/linkedin.yml` 29
- `config/text/views/system/hpc.yml` 68
- `config/text/views/system/config.yml` 24
- `config/text/views/boards/focus.yml` 134

Source:
- `src/lib/state/words/text.ts` 103
- `glyphmode.svelte.ts` 27
- `appearance.ts` 199
- `tones.ts` 205
- `src/lib/ui/controls/Glyph.svelte` 72
- `src/lib/shell/Workbench.svelte` 342
- `src/lib/shell/rail/UpdateTray.svelte` 263
- `src/lib/state/workbench/ui.svelte.ts` 345
- `src/lib/state/client/socket.svelte.ts` 241
- `src/lib/state/sessions/source.svelte.ts` 310
- `src/lib/state/sources/venues.ts` 168
- `src/lib/data/sources/config.ts` 75
- `src/lib/data/sources/config/catalogs.ts` 198
- `src/lib/views/registry.ts` 167
- `views/feeds/linkedin/Linkedin.svelte` 291
- `views/feeds/radar/Radar.svelte` 190
- `views/feeds/radar/RadarIntro.svelte` 68 (new)
- `views/sources/venues/Ribbon.svelte` 235
- `views/sources/source/Source.svelte` 193
- `views/boards/focus/CommandCenterView.svelte` 278
- `views/boards/focus/Band.svelte` 284
- `views/boards/focus/lanes/LaneHead.svelte` 69
- `views/system/workbench/Appearance.svelte` 154
- `src/routes/+page.ts` 29
- `src/routes/+page.server.ts` 38

Tests:
- `checks/source/text` 127
- `checks/source/keys` 477
- `checks/config/config-folder` 637
- `ui/controls/glyph` 161
- `ui/theme` 211
- `ui/primitives` 860
- `ui/tree/tree` 244
- `ui/controls/tag` 118
- `shell/rail/activity-rail` 119
- `shell/rail/rail` 189
- `shell/rail/rail-config` 138
- `shell/keys/palette` 227
- `shell/workbench` 847
- `state/words/tones` 260
- `state/client/generation` 170
- `state/sources/venues` 232
- `state/workbench/rail-badges` 443
- `routes/page` 119
- `views/sources/venues` 482
- `views/whole/type-scale` 300
- `views/feeds/inbox` 339
- `views/feeds/leads` 501
- `views/feeds/radar` 316
- `views/boards/focus` 587
- `views/sessions/sessions` 865
- `views/sources/file` 346
- `views/sources/source` 546
- `views/shared/card/card-docs` 231
- `views/sources/files/files` 892
- `views/system/workbench/settings` 130
- `browser/shell/icons.spec` 146
- `browser/shell/settings.spec` 167
- `browser/shell/appearance.spec` 71 (revert line numbers only)
- `browser/sources/show-in-files.spec` 467 (its revert now sets a non-ASCII stand-in)
- `browser/boards/focus-look.spec` 412

The largest file is 892 lines; the largest component is Linkedin at 291.

Name grep: `grep -rnw "asciiCatalog\|setAscii\|asciiOf\|resolveGlyphTokens\|sparkline\|spark_blocks\|chipGlyph\|intro_head\|note_prefix\|x_prefix" src tests config bin HELP.md DESIGN.md README.md` returns only `tests/checks/source/html-sites.test.ts:267` (see judgment call 10).

## Doc text (current `grep -n` lines, then their replacements)

**DESIGN.md:75.** Only the last sentence changes. It now reads:

> `tests/checks/source/keys.test.ts` fails on a `t()` key that does not exist, so a typo is caught before it renders blank, and `tests/checks/config/config-folder.test.ts` fails on a glyph name nothing reads and on an ASCII stand-in for a character no glyph name holds.

Replacement:

> `tests/checks/source/keys.test.ts` fails on a `t()` key that does not exist, so a typo is caught before it renders blank, and `tests/checks/config/config-folder.test.ts` fails on a glyph name nothing reads, on a glyph name whose stand-in is not printable ASCII, and on a glyph name with no icon.

**DESIGN.md:197.** Current:

> The glyph vocabulary has an ASCII half, `glyphs.yml`'s `ascii:` map, keyed by the character. A terminal theme draws it unless the viewer asks for the real glyphs, and there no icon is drawn at all. The swap is a lookup where a glyph renders, in `ui/controls/Glyph.svelte` and in `ui/controls/Chip.svelte`'s bracket rule, and never a pass over the document.

Replacement:

> The glyph vocabulary is `glyphs.yml`'s one `glyphs:` map, each name with the ASCII stand-in a terminal theme draws in place of its icon; every value is printable ASCII, and `iconFindings` reports one that is not. A terminal theme draws the stand-ins unless the viewer asks for the icons, and there no icon is drawn at all. The swap is a lookup where a glyph renders, in `ui/controls/Glyph.svelte` and in `ui/controls/Chip.svelte`'s bracket rule, and never a pass over the document. No string under `config/` carries a glyph: a text that shows one draws a `Glyph` beside its words, a mark badge's hover says what the mark means in the words its registration's `badgeMark` names, and the Venues deadline line is SVG bars. In the icon mode a name with no drawing is an empty box, never text.

**HELP.md:163.** Current:

> `| `catalogs/glyphs.yml` | The glyph vocabulary, one character per name, and the ASCII stand-in a terminal theme draws instead. |`

Replacement:

> `| `catalogs/glyphs.yml` | The glyph vocabulary: each name with the ASCII stand-in a terminal theme draws in place of its icon. |`

**The ASCII gate.** No line of DESIGN.md or HELP.md states the glyphs.yml exemption. DESIGN.md:221 ("ASCII only in every authored file. Glyphs come from `catalogs/glyphs.yml`...") stays true and needs no change.

# Repair round 1

All twelve findings are fixed. Two points need your eye:
- **Item 12 conflicts with the tree.** The sparkline is not visible on every theme. It is still visible on terminal themes only, and the evidence is under item 12.
- **The revert check exits 1.** The only cause is 601 unchecked cases that were already on main; there are 0 unproven. Every case this round added or changed is red under its revert.

The `glyph:` key on theme rows stays, pending Axel's answer. If he wants it gone, the finding module and the fallback code below come out with it.

## Each finding

**1. Sparkline colour.** `Ribbon.svelte:167` is now `color: var(--ink-txt, var(--ink));`, the text pair. The old value was the accent. New case: `tests/views/sources/venues.test.ts` "paints the density bars in the text colour, which the bars take through currentColor". It is red under `Ribbon.svelte:167 => color: var(--accent-txt, var(--accent));`.

**2. Theme `glyph:` validation.**
- New module `src/lib/data/sources/config/themes.ts` has `themeFindings(engine, config)`. It is wired into `server/core/context.ts` and `server/watch/portfolio.ts` next to `iconFindings`.
- It writes findings to `config/appearance.yml` at key `themes[i]`:
  - `findings.appearance.glyph`: "the theme {0} names no glyph; it is offered with its words alone". Used for an empty, missing or non-string glyph.
  - `glyph_unknown`: "the theme {0} names a glyph glyphs.yml does not hold; it is offered with its words alone".
  - `repeated`: "a second theme row names {0}; only the first is offered".
- On the client:
  - `themes()` in `state/words/appearance.ts` gives an unusable glyph as `''`, so the menu entry and the theme-in-force value draw the words alone.
  - `setAppearance` drops a repeated theme name and keeps the first row. Svelte refuses two menu items with the same key, so a repeat would otherwise break the menu.
- Own-key checks: `text.ts` `glyph()` and `hasGlyph()`, `themes.ts` and `setAppearance` all check own keys (`Object.hasOwn`). A name like `constructor` is therefore unknown, not answered by the object prototype.
- Cases, each red under its revert:
  - `config.test.ts`: empty/missing, unknown including `constructor`, repeated, and a case that the shipped list gives none.
  - `theme.test.ts`: empty/missing/unknown drawn with words alone; a theme named twice is offered once.
  - `settings.test.ts`: an unknown glyph draws words alone and does not throw.

**3. `badgeMark` missing.**
- `registry.ts` `badgeOf` no longer throws for a mark badge without `badgeMark`. Its hover is the view's own name.
- New case in `rail-badges.test.ts`, "hovers a mark whose registration names no words by the view name, and does not throw". It is red under `registry.ts:108 => const words = marked ? lookup(means ?? '') : text;`.
- The existing case "names its words in every registration that can draw one" remains the check over the registered views.

**4. Radar intro keys hold words only.**
- Keys now: `intro_lead`, `intro_preempt: pre-emption`, `intro_cite: cite/baseline`, `intro_adjacent: adjacent`, `intro_cross: plus cross-pollination`, `intro_sparks`, `intro_tracked: '{0} tracked'`, `intro_sweep: last sweep <b>{0}</b>`, `intro_refresh`.
- `intro_tail` is gone.
- The separators come from `RadarIntro.svelte`'s style: `.legend::before/::after { content: '-' }` and `.item + .item::before { content: '|' }`.
- New case "draws the intro separators from its markup, so every intro line holds words alone" checks every `radar.intro_*` value for `|` or a leading or trailing `-`. It is red under `radar.yml:16 => intro_preempt: pre-emption |`.
- The legend icons are still tinted with each bucket's hue from `radar_buckets`: red, green, grey for `white`, and purple.

**5. Rename.**
- Store: `icons()` / `setIcons()`, and the saved field `icons`.
- Catalog: `ui.icons: Icons` and `ui.icons_title`.
- Glyph name: `unicode` becomes `icons` in `glyphs.yml` and `icons.yml`.
- `GlyphMode` is `'icon' | 'ascii'`.
- A saved `unicode` field with no `icons` field is read once. `loadUi` then writes it back at once under `icons` and drops `unicode`; `ui.svelte.ts:248-249`.
- Cases in `ui.test.ts`, both red:
  - "reads a choice saved under the older field name when no icons field is saved", under `:235 => icons: held.icons === true,`.
  - "writes a choice read under the older field name back under icons at once", under `:248 => if (false)`.
- `grep -rn unicode src tests config` now hits only the migration lines and two unrelated LaTeX log strings.
- The store method `setIcons` has the same name as `text.ts`'s `setIcons`, which installs the drawings. They live on different objects and neither file imports both.

**6. Stand-in width.**
- `changes: "[><]"` becomes `"+/-"` and `events: "[::]"` becomes `"(e)"`. Those were the only two stand-ins over three characters.
- New check in `tests/checks/config/config-folder.test.ts`, "holds every stand-in to three characters, the box a terminal theme draws it in". It is red under `glyphs.yml:66 => changes: "[><]"`.
- The server finding now uses `/^[\x20-\x7E]{1,3}$/`, worded "glyph {0} has no stand-in of one to three printable ASCII characters". Its case adds a `wide: '[><]'` row.
- The `Glyph.svelte` comment now names that check.

**7. Venue indexing marks.**
- New `src/lib/data/snapshot/indexing.ts`. It reads a leading check mark (U+2705, U+2714 or U+2713) as `yes` and a cross (U+274C, U+2716 or U+2717) as `no`. It accepts an optional U+FE0F and keeps the rest of the words. The patterns are written as `\u` escapes, so the file is ASCII.
- `normalise.ts` `venue()` fills `wos` / `wosMark` and `scopus` / `scopusMark`. The `Venue` type in `model-entities.ts` gains `wosMark` and `scopusMark`.
- `VenueCard.svelte` draws the `check` or `cross` glyph before the words, for example the check icon then "WoS SCIE", or the cross icon then "Scopus".
- The hub file is not edited.
- Cases, all red:
  - `normalise.test.ts` "reads a leading check or cross of an indexing field as its mark, and keeps the words", under `normalise.ts:331 => wos: str(entry.wos),`.
  - `views/sources/venues.test.ts` "draws a yes as the check glyph and a no as the cross glyph beside the words", under `VenueCard.svelte:88 => return { label };`.
  - Browser `icons.spec.ts` "a Venues card draws a check or cross of the registry as its icon and no character". It writes `wos: "\u2705 SCIE"` and `scopus: "\u274c"` into the run's copy of `demo/registries/venues.yml` and restores the file after. Red under the normalise revert.
- KaTeX, the terminal (xterm) and Markdown drawn from hub files carry their own content and are unchanged.

**8. Final revert-check line**, run over the 43 test files that differ from the main checkout (list: `cmp` of every `tests/**/*.ts` against `tools/oculus` on main):

`183 reverts, 0 unproven, 601 unchecked`

Every case added or changed this round appears as `red`.

**9. Focus browser case.**
- The demo hub draws no Jobs column. `demo/applications/applications.yml` holds only `applied` and `declined`, and `collectionLanes` takes `status: active`.
- The case now appends one `status: active` application to the run's copy and restores it in `finally`.
- It asserts all three columns under light and mocha, with no `continue`.

**10. Theme-menu browser case** gains a second directive on component code, `Appearance.svelte:35 => glyph: undefined,`. Both of its directives are red.

**11.** The `appearance.ts` doc comment is rewritten into full lines. The Doc text section below adds DESIGN.md:234 and every line items 1 to 7 make false.

**12. Before and after for the reader.**
- **Sparkline: the coordinator's premise does not match the tree.**
  - `Ribbon.svelte:155` is `.spark { display: none; }` and `:179-180` is `:global(body.rice) .spark { display: flex; }`. This rule predates the step, so the line is visible under terminal themes only, before and after.
  - The markup is in the DOM on every theme.
  - Before: block characters drawn in the accent colour, under terminal themes, and still Unicode in the ASCII mode.
  - After: 12 SVG bars in the ink text colour at the same heights.
- **HPC pill accessible name:** before "<monitor emoji> 1 HPC job running"; after "1 HPC job running". The icon is `aria-hidden`.
- **Theme items' accessible names:** before e.g. "◆ mocha"; after "mocha". The browser case `getByRole('menuitem', { name: 'mocha', exact: true })` passes.
- **Other changes a reader sees this round:**
  - The toggle reads "Icons" instead of "Glyphs".
  - The radar intro shows the same sentence, with CSS separators.
  - Venue cards show icons for the marks.
  - The Changes glyph shows `+/-` and Events shows `(e)` in terminal themes.

## Verification

| # | Command | Output |
|---|---|---|
| 1 | `npx vitest run --reporter=dot` | `Test Files  292 passed (292)` / `Tests  4632 passed (4632)`. One run this round had `tests/server/machine/hpc/ssh.test.ts` fail on timing; alone it gave `Tests  13 passed (13)`, and the final run is green. |
| 2 | `npm run check` | `COMPLETED 1333 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | `npm run build` | `build exit 0` |
| 4 | `npm run format:check` | `All matched files use Prettier code style!` |
| 5 | `npm run lint` | `lint exit 0` |
| 6 | perl ASCII gate (`! -name local.yml`) | no output (`wc -l` 0) |
| 6b | `LC_ALL=C grep -c '[^ -~]' config/catalogs/glyphs.yml` | `0` |
| 7 | `sh bin/size-check.sh`; `sh bin/folder-check.sh` | `size exit 0`; `folder exit 0` |
| 8 | `grep -rn "{G\." config src` | no output, `grep exit 1` |
| 9 | `lsof -iTCP:8792 -sTCP:LISTEN` (empty), `npm run build`, `npx playwright test` | `334 passed (7.7m)`. The one `✘` line, `files-forms.spec.ts:631`, is a case marked `test.fail()` (its source line 634) and counts as passed. |
| 10 | `node bin/revert-check.mjs <43 changed test files>` | `183 reverts, 0 unproven, 601 unchecked` |
| 11 | `ls -d $TMPDIR/oculus-* \| wc -l` | `7015` before and after |

## Files changed this round (line counts from `wc -l`)

New:
- `src/lib/data/sources/config/themes.ts` 64
- `src/lib/data/snapshot/indexing.ts` 27

Changed source:
- `src/lib/views/sources/venues/Ribbon.svelte` 236
- `src/lib/data/sources/config.ts` 76
- `src/lib/server/core/context.ts` 357
- `src/lib/server/watch/portfolio.ts` 395
- `src/lib/state/words/text.ts` 114
- `src/lib/state/words/appearance.ts` 204
- `src/lib/views/registry.ts` 171
- `src/lib/views/feeds/radar/RadarIntro.svelte` 104
- `src/lib/state/workbench/ui.svelte.ts` 350
- `src/lib/shell/Workbench.svelte` 342
- `src/lib/views/system/workbench/Appearance.svelte` 154
- `src/lib/ui/controls/Glyph.svelte` 73
- `src/lib/data/sources/config/catalogs.ts` 202
- `src/lib/data/snapshot/normalise.ts` 849
- `src/lib/data/model/model-entities.ts` 679
- `src/lib/views/sources/venues/VenueCard.svelte` 264

Changed config:
- `config/catalogs/glyphs.yml` 150
- `config/catalogs/icons.yml` 149
- `config/text/ui.yml` 55
- `config/text/findings.yml` 103
- `config/text/views/feeds/radar.yml` 33

Tests:
- `checks/config/config.test.ts` 679
- `checks/config/config-folder.test.ts` 646
- `ui/theme.test.ts` 248
- `views/system/workbench/settings.test.ts` 149
- `state/workbench/rail-badges.test.ts` 458
- `state/workbench/ui.test.ts` 457
- `views/feeds/radar.test.ts` 340
- `views/sources/venues.test.ts` 516
- `data/snapshot/normalise.test.ts` 636
- `browser/shell/icons.spec.ts` 190
- `browser/shell/settings.spec.ts` 167
- `checks/source/keys.test.ts` 477
- `checks/source/text.test.ts` 127
- `ui/primitives.test.ts` 860
- `ui/controls/tag.test.ts` 118
- `state/client/generation.test.ts` 170

Tests where only revert line numbers moved:
- `server/core/context.test.ts` 325
- `server/watch/portfolio.test.ts` 892
- `browser/workbench/unsaved-forms.spec.ts` 680
- `browser/sources/source.spec.ts` 332
- `browser/sources/files-forms.spec.ts` 657

## Doc text (revised, in full)

**DESIGN.md:75.** Current, in full:

> The tracked files under `config/` and `config/catalogs/` are the interface described as data, one concern to a file, and they are treated alike; `config/local.yml` sits with them and is the machine's own, read by `loadLocal` and never merged. What the portfolio reads in `sources.yml` (the tier scan paths, the registry and collection files, the document and feed paths); words and their colours in `catalogs/vocab.yml` (the palette, the research `domains`, the status legend and palette, the focus lanes, the venue tiers, the venue and dataset theme words with their labels, the radar buckets); how things are arranged in `layout.yml` (the rail's pages and their arrangements, the view catalogue's groups, the board chrome, the tab rollups, the live badges, which title a surface draws); thresholds and horizons in `behavior.yml`; the UI theme list, the wallpaper and the CRT default in `appearance.yml`; the glyph vocabulary in `catalogs/glyphs.yml` and the icon each of its names is drawn as in `catalogs/icons.yml`; every user-facing string in the catalog fragments under `config/text/`, read through `t("group.key")` on the client and, for the data layer's findings and the audit's, through `findingText` of `data/helpers/finding-text.ts` on the server; the edit form in `catalogs/manifest-schema.yml`; the tool's own identity in `catalogs/meta.yml`. `loadConfig` merges every file's top-level keys into one map and reports a key two files define, so a key moves between files without a reader noticing and no key sits in two. No component contains a literal user-facing string, a raw colour, or a literal glyph. `tests/checks/source/keys.test.ts` fails on a `t()` key that does not exist, so a typo is caught before it renders blank, and `tests/checks/config/config-folder.test.ts` fails on a glyph name nothing reads and on an ASCII stand-in for a character no glyph name holds.

Replacement: the same paragraph with two changes.
- "the UI theme list, the wallpaper and the CRT default in `appearance.yml`" becomes "the UI theme list with each theme's glyph, the wallpaper and the CRT default in `appearance.yml`".
- The last sentence becomes: "`tests/checks/source/keys.test.ts` fails on a `t()` key that does not exist, so a typo is caught before it renders blank, and `tests/checks/config/config-folder.test.ts` fails on a glyph name nothing reads, on a glyph name whose stand-in is not one to three printable ASCII characters, and on a glyph name with no icon."

**DESIGN.md:197.** Current:

> The glyph vocabulary has an ASCII half, `glyphs.yml`'s `ascii:` map, keyed by the character. A terminal theme draws it unless the viewer asks for the real glyphs, and there no icon is drawn at all. The swap is a lookup where a glyph renders, in `ui/controls/Glyph.svelte` and in `ui/controls/Chip.svelte`'s bracket rule, and never a pass over the document.

Replacement:

> The glyph vocabulary is `glyphs.yml`'s one `glyphs:` map, each name with the ASCII stand-in a terminal theme draws in place of its icon: one to three printable ASCII characters, which `iconFindings` reports a value for not being and the three-character box of `ui/controls/Glyph.svelte` fits. A terminal theme draws the stand-ins unless the viewer turns Icons on (the ui store's `icons`; a browser that saved the older `unicode` field has it read once and written back as `icons`), and there no icon is drawn at all. The swap is a lookup where a glyph renders, in `ui/controls/Glyph.svelte` and in `ui/controls/Chip.svelte`'s bracket rule, and never a pass over the document. No string under `config/` carries a glyph: a text that shows one draws a `Glyph` beside its words, with any separator drawn by the markup; a mark badge's hover says what the mark means in the words its registration's `badgeMark` names, or the view's name where it names none; the Venues deadline line is SVG bars in the text colour; a check or cross that opens a venue's `wos:` or `scopus:` in `registries/venues.yml` is read as a yes or a no by `data/snapshot/indexing.ts` and drawn as the `check` or `cross` glyph. A theme row's `glyph:` that is missing, empty or not a glyph name, and a row repeating a theme's name, are findings of `data/sources/config/themes.ts`; the picker draws such a row with its words alone and offers a repeated name once. In the icon mode a name with no drawing is an empty box, never text. KaTeX, the terminal and Markdown drawn from hub files carry their own content.

**DESIGN.md:234.** Current:

> - Configuration: one concern per file (`sources`, `vocab`, `layout`, `behavior`, `appearance`, `meta`, `glyphs`, `text`, `manifest-schema`), the research domains' colours keyed `domains`, the UI theme list in `appearance.yml` as data rather than catalog strings. Appearance: VS Code Dark Modern and Light Modern as two more themes, the wallpaper behind the panels, the glyph or ASCII toggle.

Replacement:

> - Configuration: one concern per file (`sources`, `vocab`, `layout`, `behavior`, `appearance`, `meta`, `glyphs`, `text`, `manifest-schema`), the research domains' colours keyed `domains`, the UI theme list in `appearance.yml` as data rather than catalog strings. Appearance: VS Code Dark Modern and Light Modern as two more themes, the wallpaper behind the panels, the icon or ASCII toggle.

**HELP.md:17.** Current:

> Under the page buttons sit the bookmarks, the reader's own from `~/.oculus/bookmarks.yml`, which the Files view adds and takes away, each opened as a tab of its own. At the foot of the rail are Search, which opens the palette, and Update, which opens the update tray, each drawn with its name under its glyph. The button of the page on screen is filled with a tint of the accent. The list above the foot scrolls on its own, and a fade at its top or bottom edge says more entries are past it. The appearance controls (Theme, the Text row of smaller, reset and larger, CRT, Wallpaper where the theme has one, and Glyphs) are in the Settings view.

Replacement: the same paragraph ending "... CRT, Wallpaper where the theme has one, and Icons) are in the Settings view."

**HELP.md:85.** Current:

> | `venues` | Venues | The venue catalogue with its tiers, deadlines and concentration warning. A venue whose `link` is a path of the hub opens that file in a tab of its own and carries Show in Files. |

Replacement:

> | `venues` | Venues | The venue catalogue with its tiers, deadlines and concentration warning. A `wos:` or `scopus:` that opens with a check or a cross is drawn as the check or cross icon before its words. A venue whose `link` is a path of the hub opens that file in a tab of its own and carries Show in Files. |

**HELP.md:122.** Current:

> | `settings` | Settings | The theme, text size, CRT, wallpaper and glyphs, and the rail list, edited and saved to `config/layout.yml`. |

Replacement:

> | `settings` | Settings | The theme, text size, CRT, wallpaper and icons, and the rail list, edited and saved to `config/layout.yml`. |

**HELP.md:161.** Current:

> | `appearance.yml` | The UI theme list, the wallpaper behind the panels, the Memories wall's folder, the CRT default and the terminal text size. |

Replacement:

> | `appearance.yml` | The UI theme list with the glyph each theme is offered under, the wallpaper behind the panels, the Memories wall's folder, the CRT default and the terminal text size. |

**HELP.md:163.** Current:

> | `catalogs/glyphs.yml` | The glyph vocabulary, one character per name, and the ASCII stand-in a terminal theme draws instead. |

Replacement:

> | `catalogs/glyphs.yml` | The glyph vocabulary: each name with the ASCII stand-in, one to three characters, that a terminal theme draws in place of its icon. |
