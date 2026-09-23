Verification, run from /Users/axelfaes/workspace/research-hub/.agents/worktrees/U1/tools/oculus with Node v24.21.0:

- 11 before: `ls -d $TMPDIR/oculus-* | wc -l` -> `7015`
- 1: `npx vitest run --reporter=dot` -> `Test Files  1 failed | 291 passed (292)` / `Tests  1 failed | 4616 passed (4617)`. The failure is tests/checks/tree/scratch.test.ts "is swept by every file under tests that takes one". Rerun alone: `npx vitest run tests/checks/tree/scratch.test.ts` -> `Tests  9 passed (9)`. This is the same load-timing failure the report names. I did not read the failure message from the full run.
- 2: `npm run check` -> `COMPLETED 1331 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- 3: `npm run build` -> exit 0 (run twice)
- 4: `npm run format:check` -> `All matched files use Prettier code style!`
- 5: `npm run lint` -> exit 0
- 6: the perl ASCII gate with `! -name local.yml` -> printed nothing, exit 0. `LC_ALL=C grep -c '[^ -~]' config/catalogs/glyphs.yml` -> `0`
- 7: `sh bin/size-check.sh` -> exit 0; `sh bin/folder-check.sh` -> exit 0
- 8: `grep -rn "{G\." config src` -> no output, exit 1
- 9: `lsof -iTCP:8792 -sTCP:LISTEN` -> nothing listening. `npm run build`, then `npx playwright test` -> `333 passed (8.6m)`, exit 0
- 10: `git diff a7769781 --name-only --relative -- tests | xargs node bin/revert-check.mjs` (35 files) -> `132 reverts, 0 unproven, 459 unchecked`, exit 1. I intersected every `it(`/`test(` title the diff adds with that output, and none of them is anything but `red`.
- 11 after: `ls -d $TMPDIR/oculus-* | wc -l` -> `7015`
- `git status --short`: 69 modified files and one untracked file, `src/lib/views/feeds/radar/RadarIntro.svelte`.
- glyphs.yml content: a python comparison of the base `glyphs:`/`ascii:` maps with the new map gives 137 -> 136 names. `spark_blocks` is dropped and nothing is added. Every name keeps the stand-in its old character had. `bang` had no `ascii:` entry and is now `"!"`.

## Spec

1. The sparkline colour differs from the brief. Brief item 4 says "drawn as SVG bars in the text colour". `src/lib/views/sources/venues/Ribbon.svelte` keeps the accent colour:
   ```
   .spark .bars {
       height: 1em;
       color: var(--accent-txt, var(--accent));
   ```
   The report lists this as judgment call 4 and asks. The brief had already settled it, so this is a deviation, not an open choice.

2. The new `glyph:` key on the theme rows of `config/appearance.yml` is not validated.
   - It is a user-visible config key the brief did not name (disclosed).
   - Rows now look like `- { name: light, class: "", glyph: theme_base, label: "light" }`.
   - `setAppearance` (`src/lib/state/words/appearance.ts:127`, `glyph: stringAt(row, 'glyph') ?? ''`) accepts any string, and no config finding checks it against `glyphs:`.
   - A row naming an unknown glyph reaches `Glyph.svelte:31` `const standIn = glyph(name);`, and `glyph()` throws (`text.ts`: `throw new Error(\`glyph not in config/catalogs/glyphs.yml: ...\`)`). So a typo in `appearance.yml` breaks the Settings view and the theme menu instead of producing a finding.
   - The rail's entries get a `glyph_unknown` finding for the same mistake (`src/lib/data/sources/config/rail.ts:23`).
   - The only check is `tests/ui/theme.test.ts` (`expect(entry.glyph in GLYPHS, entry.name).toBe(true)`), which runs over the shipped file only. The spec rule "every id or key a package introduces is exercised empty, duplicated, and colliding" is not met for this key.
   - The alternative the report names (derive the glyph from the `rice` class) would need no new key.

3. `badgeMark` has the same failure mode.
   - `src/lib/views/registry.ts`: `const said = text === '' && mark !== '' ? lookup(registration.badgeMark ?? '') : text;`
   - A registration that draws a mark without naming `badgeMark` throws inside `badgeOf`, so the rail or a tab strip fails to render.
   - Before this step it never threw. It is guarded only by the test over the registered views (`rail-badges.test.ts`, "names its words in every registration that can draw one").
   - The field and the words "post overdue" (`config/text/views/feeds/linkedin.yml`, `linkedin_badge_mark`) are user-visible choices, disclosed.

4. The Lit Watch legend is tinted, which goes beyond the brief.
   - `RadarIntro.svelte` colours each legend icon with the hue of the matching `radar_buckets` row: `color: var(--c-${toneOf(bucket.color)}-txt)`. This is disclosed (judgment call 3), and `white` becomes grey.
   - The intro sentence is split into five catalog keys, with the separators inside the values: `intro_preempt: pre-emption |`, `intro_cite: cite/baseline |`. A key holding a trailing `|` is a layout fragment, not words.

5. The mode rename stops halfway.
   - `GlyphMode` is now `'icon' | 'ascii'`.
   - The saved ui field `unicode`, the store's `unicode()`/`setUnicode()`, the catalog keys `ui.unicode`/`ui.unicode_title`, and the glyph name `unicode` all keep the old name, and the control's label is still "Glyphs".
   - Under Axel's "as little unicode as possible", the setting that picks icons over stand-ins is still called `unicode` throughout. Disclosed as judgment call 5. Keeping the saved key avoids a migration, but the code-level names could have followed.

6. Removing `spark_blocks` from `icons.yml` (outside the path list) is needed: the config-folder test holds the two key sets equal. No finding.

7. The LaneHead markup (`.lane-title` wrapping `<Glyph>` and `.lane-name`) keeps the browser selectors `.lane-name` resolving. No finding.

## Proof

1. The revert-check counts in the report are not the ones my run gives.
   - The report quotes `127 reverts, 0 unproven, 464 unchecked` plus two partial follow-up runs.
   - My single run over the same 35 files gives `132 reverts, 0 unproven, 459 unchecked`.
   - The report's figure is from an earlier state of the files. The final state was never quoted.

2. The Focus browser case is conditional.
   - In `tests/browser/shell/icons.spec.ts`, "the Focus board draws its column glyphs as icons...", Jobs and Teaching are skipped when not drawn: `if ((await column(key).count()) === 0) continue;`.
   - Only Funding is asserted unconditionally, and the report admits it did not check which columns the demo hub draws.
   - The node case `tests/views/boards/focus.test.ts` "draws each column glyph before the column words" does cover all three.

3. The theme-menu browser case's named revert does not revert this step's code. It is `config/appearance.yml:10 => ... label: "\u25d0 light"`, which injects a character into the config. It proves the `textContent` assertion, not that the component draws a Glyph. That part is carried by `toHaveCount(drawn)` on `.glyph svg` and by the node case in `settings.test.ts` (revert `Appearance.svelte:68 => delete`, red).

4. Loosened checks: none found.
   - The ASCII gate lost its `glyphs.yml` exemption.
   - `config-folder.test.ts:85` still skips `glyphs.yml` in `glyphReaders`, which is the reader-name check, not an ASCII rule.
   - `grep -rn "glyphs.yml" bin eslint.config.js tests/checks` shows no other exemption.

5. `tests/ui/controls/glyph.test.ts` "puts every icon through the icon filter" asserts over source text (`expect(source).toContain('{@html sanitiseSvg(drawn.svg)}')`). Under the spec that is an audit, not coverage. It was already on main in that form; the diff only moved the string.

## Standards

1. A comment the diff edited stays false. `src/lib/ui/controls/Glyph.svelte`:
   ```
   /* A terminal palette draws the ASCII stand-in of config/catalogs/glyphs.yml instead of the
      icon, and a stand-in is up to three characters wide, so the box holds three of the theme's
      own face. */
   :global(body.rice) .glyph { width: 3ch; }
   ```
   A python check over glyphs.yml lists two four-character stand-ins: `changes: "[><]"` and `events: "[::]"`. The report names the overflow as a limitation instead of fixing the box or the stand-ins. The spec treats that as a limit stated instead of a defect fixed.

2. The "Doc text" section omits DESIGN.md:234: "Appearance: VS Code Dark Modern and Light Modern as two more themes, the wallpaper behind the panels, the glyph or ASCII toggle." The toggle is now icon or ASCII. The report's replacements for DESIGN.md:75, DESIGN.md:197 and HELP.md:163 match what `grep -n` prints now.

3. `src/lib/state/words/appearance.ts` has a doc comment hand-broken mid-sentence into a short line:
   ```
    * `glyph` draws its words alone. A key the config
    * does not hold installs as an empty list, ...
   ```

4. Non-ASCII in the tree: the perl gate prints nothing. `LC_ALL=C grep -rlP '[^\x00-\x7F]'` over the worktree (excluding node_modules, build and test output) finds only `config/present.yml:255` "Linköping", which the gate allows.

5. Other routes by which non-ASCII still reaches the page after this step:
   - **Hub data drawn verbatim.** `registries/venues.yml` carries `wos: "✅ SCIE"`, `scopus: "✅"` and `wos: "❌"`: 93 check marks and 2 crosses (`LC_ALL=C grep -rhoP '[^\x00-\x7F]' feeds registries projects/*/*/project.yml | sort | uniq -c`). `src/lib/views/sources/venues/VenueCard.svelte:72-73` draws them through `t('venues.wos', venue.wos)` and `t('venues.scopus', venue.scopus)`. These are emoji on the Venues cards. The fix is in the hub file or in the normalise step (`src/lib/data/snapshot/normalise.ts:328-329`), outside this step's paths.
   - **KaTeX, in `build/client/_app/immutable/nodes/2.*.js`.** It renders math symbols, and in math text mode it turns `--`/`---` into en and em dashes. This is content-driven math, not UI.
   - **The terminal (xterm).** It draws whatever the PTY prints, such as the Claude CLI's own glyphs. The DEC line-drawing charset table is in `chunks/ScmBfeDI.js`.
   - **Hub Markdown rendered through `marked`.** It carries whatever the hub files hold. No `smartypants` or typographer option is set (`grep -rn "typographer|smartypants" src` finds nothing).
   - Nothing else found:
     - CSS `content:` values are only `''`, `'['`, `']'` and `'# '`.
     - No non-ASCII HTML entity appears in config or src.
     - No `toLocale*String` or `Intl` formatting reaches the page.
     - The title and favicon are ASCII.
     - `src/lib/server/machine/usage/refresh.ts:114` `\u276f` is a matcher over terminal output, not drawn.

## Behaviour

1. The report's before and after for the sparkline is wrong in one place. It says "Venues deadline line (terminal themes only)". The block characters were drawn on every theme before, and the SVG bars are drawn on every theme now, so the change is visible under light and dark too. The icon-theme before and after (block glyphs in the accent colour, now 12 SVG rects in the accent colour) is not stated.

2. Accessible names change:
   - The HPC pill's name loses its leading character: before "<char> 1 HPC job running", after "1 HPC job running".
   - The theme menu items' names change the same way. The report mentions the menu but not the pill's name.

3. No empty box appears where an icon should be in the shipped config. `config-folder.test.ts` "names one icon for every glyph and for nothing but a glyph" holds the key sets equal, and the whole browser suite passed.

4. Four-character stand-ins still overflow the 3ch box on terminal themes (see Standards 1).

## Not checked

- I did not look at any view on screen: no Chrome look on the TEST page.
- I did not check which Focus band columns (Jobs, Teaching) the demo hub draws.
- The full-run failure message of scratch.test.ts; I only saw it pass alone.
- I did not check how `glyph:` or `badgeMark` behave on a hand-edited config at runtime. The throw is read from `Glyph.svelte:31` and `text.ts` `glyph()`, not run.

## Usage

Not measured.
