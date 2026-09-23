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
