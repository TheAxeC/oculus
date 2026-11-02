O117 review. Two false sentences in comments the step rewrote (item 5, S1 and S2) and two report-form findings; everything else checked holds.

## Verification lines

`npm run test:quick`, from the worktree root, logged to /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O117-quick.log, exit 0:

```
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      ASCII gate (1.4 s)
ok      svelte-kit sync (3.4 s)
ok      eslint (2.8 s)
ok      svelte-check (10.8 s): 1793624758315 COMPLETED 580 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (38.4 s): Duration  25.22s (transform 40.57s, setup 0ms, import 87.46s, tests 8.82s, environment 466ms)
ok      vitest slow (44.5 s): Duration  30.93s (transform 22.96s, setup 0ms, import 37.70s, tests 22.54s, environment 1ms)
ok      vitest checks (68.0 s): Duration  54.65s (transform 15.78s, setup 0ms, import 38.69s, tests 123.33s, environment 3ms)
test:quick: 71.5 s; every command passed
```

`grep -rn --exclude=local.yml 'transcript_font_px\|ranscriptFont' src config docs` prints the reader and getter (`appearance.ts:177,178,213,227,235,626,628`), the store (`ui.svelte.ts:11,48,162,184,348,349,450,451,543,561`), the views (`TranscriptBody.svelte:27,73,107`, `terminal-list.ts:163,173`, `TerminalFontTools.svelte:11,21,24,30`), the row (`config/options/appearance.yml:79`) and the commented line (`config/defaults/appearance.yml:82`). It prints no line for the row's help, which holds neither name. The report says so in its Verify 2 row. `grep -n 'Text size of a terminal tab' config/options/appearance.yml` prints line 82.

Other commands the report quotes, run in the same form:
- `grep -n 'function writeTerminalSize' src/lib/state/workbench/ui.svelte.ts`: `436:    function writeTerminalSize(key: string, size: number | null): void {`
- `grep -rn --exclude=local.yml -i 'never below\|never draws below\|down to the size\|clamped to 6' src config docs`: one line, `src/lib/state/life/present.ts:197`, about another thing.
- `grep -rn 'transcript_larger\|transcript_reset\|transcript_smaller' src config`: the three catalog lines at `terminal.yml:81-83` and `TerminalFontTools.svelte:37,43,49`.
- `sh utils/unused-exports.sh` against `O117-base/unused-exports.txt` by `diff`: no line, exit 0.
- `node -e "console.log(12.345-1, Math.round((12.345-1)*100)/100)"`: `11.345 11.35`.
- The report's case program, retyped from the report into my scratchpad, with `node --experimental-strip-types --no-warnings`: output identical to the report's, line for line.
- `wc -l` of the 11 changed files: the same as the report's table. All `file:line` citations I checked resolve.
- `diff -rq --exclude=local.yml` against the base copy over src, tests, utils and config: the 10 paths on the write list under those folders; tests and utils show none. `docs/HELP.md` shows in `git status --short`. Worktree and main copies of `O117-report.md` and `O117-cases.md` are equal under `cmp`.

Two probes of my own in the scratchpad (`cases/reader.mjs`, `cases/store.mjs`), which wrote nothing to the worktree:
- reader, printing font_px, transcript key, options: `absent key 12.5 null {"copyOnSelection":true,"cursorStyle":"bar"}`, `11 10.5 11 ...`, `3 10.5 6 ...`, `100 null 40 ...`, `word 10.5 null ...`, `no map null null {}`.
- store, with fake writes: `case 3 first 11`, `case 3 second 10 grid null`, `case 4 low 6`, `case 4 high 40`, `reset held null`, `case 12 13.4`, `grid rounded 10.7 transcript 13.4`. The writes logged are the transcript key's 11, 10, 6, 40, its reset, 13.4, `terminal.font_px` 10.7, two resets of `terminal.font_px`, then `noWorkspace` twice for a write and a reset on the unsaved workspace.

Breach of the safety list by me: several of my greps over `config/` did not carry `--exclude=local.yml`. They are the report's `grep -rn ... src config` in its quoted form, greps over `config/text`, and two with the glob `config/options/*.yml` (one on the worktree, one on the base copy). The globbed ones scanned `config/options/local.yml`, and one printed a line of it, the help of a session cache option, so it is an options catalog. `config/local.yml` itself was not reached: `test -e` says it is absent from the worktree and from the base copy. No hub `.oculus/local.yml` was read.

## Item verdicts

1. The key: holds. `terminalPxShape` (`appearance.ts:204`) serves both keys through `boundedTerminalPx` (`:199`); getter `:626`; row at `config/options/appearance.yml:79-85` with the named heading, section, control and bounds; help says the three things and no clamp; only a commented line at `config/defaults/appearance.yml:82`, in the form of the `opacity` line at `:87`. Reader probe: an absent key reads null and leaves the other terminal keys read.
2. The ui store: holds. `transcriptFont` `ui.svelte.ts:348`, `setTranscriptFont` `:450`, the clamp and reset once in `writeTerminalSize` `:436-442`, through `writeOption` and `resetOption`. Store probe confirms.
3. The size in force: holds. `transcriptFontSize` `terminal-list.ts:163`; `transcriptZoom` `:171-176` has no grid read and no floor; undefined gives NaN gives zoom 1; `TranscriptBody.svelte:107` reads the store, the effect at `:125-127` follows it.
4. The buttons: holds. Required `reading` prop passed at `Terminal.svelte:337`, `TerminalBar.svelte:108`; `TerminalFontTools.svelte:27-33` keeps the guard; three literal `t()` per branch; `Terminal.svelte:375` unchanged.
5. Comments and pages: violated, findings S1 and S2. The other listed paragraphs read true, and `docs/HELP.md:459`, the `font_px` help and the defaults comment match the brief.

Ruling in `O117-cases.md`: point 1 holds (`ui.svelte.ts:441`, bounds then rounding, both keys; store probe). Point 2 holds (report lines 217, numbers reproduced). Point 3 holds (report cites `:41-43`, which is the getter at `tab-session.svelte.ts:41-43`).

## Case verdicts

1. font_px 16, no key: met by read. `transcriptFontSize(null, scale)` has no reader of font_px. Drawn px on the look.
2. font_px 10.5, key 11: met by read. `chosen` is 11, no floor at `terminal-list.ts:171-176`. Drawn px on the look.
3. Smaller twice from no key: met. Store probe 11 then 10, grid null. The press itself on the look.
4. Smaller at 6, larger at 40: met. Store probe; the same-value write answers changed 0 refused none.
5. Reset on each view: met. `setFont(null)` picks one key; program output keeps the other key.
6. Reset with no key in any file: met. Program `{"changed":0,"refused":[]}`; `tell` is silent on that answer (`writes.svelte.ts:125`).
7. font_px 14, Live, smaller: met by read. The branch writes font_px; the zoom has no reader of it.
8. Two tabs: not verifiable. The read agrees (each tab's own `session.reading`). A look with two tabs settles it, as the brief's look names.
9. Transcript with no terminal: met by read. `reading` needs a target only; the bar is always drawn (`Terminal.svelte:365`).
10. Key of 3, 100 or a word: met. Program output; `merged undefined` reads null, so `--fs-sm`.
11. Key 13 at 1.2: met by read. Size 13 unscaled, zoom `size / (bodyFontPx() * scale)`. Drawn px on the look.
12. Smaller at 1.2: met. `13.399999999999999 -> 13.4`, store probe 13.4, file holds 13.4.
13. Settings view: not verifiable. Write-path refusal reproduced for 3, 100 and `large`, and the row exists. A look at the view with a value of 3, and a reset, settles it.
14. A write refused or a workspace unsaved: met. `ui.svelte.ts:260-272` read; store probe logged `noWorkspace` for both.
15. Theme change with no key: not verifiable. Read agrees (observer at `TranscriptBody.svelte:127`, `body.rice` token at `themes.css:53`). A theme switch on the look settles it.

## Spec

None. All 15 cases have a first read, every path is on the write list, no dependency and no script in the diff, and the premises I checked reproduce on the base copy (`ui.svelte.ts` reader and setter, `terminalFontPx:607`, the `terminalFont` readers, the three words at `:78-80`, `terminal.opacity` row with no default key, `config-reset.ts:122,132`, the empty tests grep).

## Proof

None.

## Standards

S1. `src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte:3-4`:
```
// what the tab shows: smaller and larger by one CSS pixel from the size in force, and back to
// the configured size.
```
The comment was rewritten by the step and is listed in item 5. On Transcript, reset takes the key out, and the key has no default, so no configured size stands behind it. Failure scenario: Transcript showing, key set in the workspace file, no other layer sets it; reset leaves the transcript on `--fs-sm`, which the comment does not say. spec.md:72.

S2. `src/lib/state/workbench/ui.svelte.ts:10-13`:
```
// `text_size`, `rice`, `wallpaper.show`, `crt.on`, `code_theme`, `terminal.font_px` and
// `terminal.transcript_font_px` options of the appearance defaults and the `status_bar` and
// `editor.suggest_details` options of the behavior defaults, as the open workspace file sets them
// or oculus's defaults hold them.
```
Listed in item 5. The diff adds a key that oculus's defaults do not hold: `config/defaults/appearance.yml:82` is a comment. Failure scenario: no file sets the key; `transcriptFont()` answers null and the transcript follows `--fs-sm`, where the sentence says a value comes from the defaults. spec.md:72.

S3. Report, Judgment call 1 ("The grep for one to reuse: ...") gives results with no command, and `scaledFontPx`, `transcriptFontSize` and `writeTerminalSize` have no grep quoted. spec.md:89 asks for the grep quoted before a helper is written. Failure scenario: a reader cannot rerun the search behind `boundedTerminalPx`. My own greps (`function clamp\|function bounded\|const clamp`, and the rounding form) find no helper that replaces any of them, so no code changes on this count.

## Behaviour

B1. Report line 214: "The help of `terminal.font_px` no longer speaks of the transcript." The diff also drops "a value is clamped to 6 to 40" and adds "while a grid shows" to the same help, both as the brief asks, and neither is stated with before and after. Failure scenario: the orchestrator's look at the Settings row reads text the report does not describe.

## Declined to judge

- The report's `git diff -U0 src config` form was not run, since it has no base. I ran `git diff 1b3683bd4 -U0 src config` over added comment lines for the same words plus package ids and dates: no hit.
- `npm run diagrams`, quoted as run once with no tracked path changed: not run, since it writes into the worktree. `git status --short` after my quick run lists the 11 changed paths and the two untracked ledger files, as the report's table says.
- The report's counts of its own runs (one list, no whole-suite command): the builder's transcript is not among my reads.
- The "Tree" results of the first read were judged against the base copy's code by reading only. No program was run on the base copy.
- Everything that needs a press or a drawn page: the look at landing named in the brief, the button names on each view, and the zoom value on the page.

Usage: a4d3abba3ff0e32d3, claude-opus-5-5, 173025 tokens, 21 tool uses, 8 min 20 s

## Repair round 1, refuted

The four findings of round 1 are closed, and each closure reproduces. Two new findings, neither a repair of code behaviour: one doc comment made false by the diff (S1 under Standards) and one sentence of the report (P1 under Proof). Everything else holds.

### Verification lines

`npm run test:quick`, from the worktree root, logged to /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/r1/quick.log, exit 0:

```
test:quick: 14 changed file(s), from git since HEAD
test:quick: 35 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (2.9 s)
ok      svelte-check (10.9 s): 1793625578221 COMPLETED 580 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (41.6 s): Duration  28.74s (transform 47.49s, setup 0ms, import 101.75s, tests 9.50s, environment 454ms)
ok      vitest slow (47.7 s): Duration  34.58s (transform 28.79s, setup 0ms, import 45.34s, tests 25.98s, environment 1ms)
ok      vitest checks (68.4 s): Duration  55.19s (transform 16.63s, setup 0ms, import 38.86s, tests 132.27s, environment 3ms)
test:quick: 71.1 s; every command passed
```

`grep -rn --exclude=local.yml 'transcript_font_px\|ranscriptFont' src config docs`:

```
src/lib/state/shared/words/appearance.ts:177:let terminal: { fontPx: number | null; transcriptFontPx: number | null; options: TerminalOptions } =
src/lib/state/shared/words/appearance.ts:178:    { fontPx: null, transcriptFontPx: null, options: {} };
src/lib/state/shared/words/appearance.ts:213:        transcript_font_px: terminalPxShape,
src/lib/state/shared/words/appearance.ts:227:        return { fontPx: node.font_px, transcriptFontPx: node.transcript_font_px, options };
src/lib/state/shared/words/appearance.ts:235:            transcriptFontPx: null,
src/lib/state/shared/words/appearance.ts:626:export function transcriptFontPx(): number | null {
src/lib/state/shared/words/appearance.ts:628:    return terminal.transcriptFontPx;
src/lib/state/workbench/ui.svelte.ts:11:// `terminal.transcript_font_px` options of the appearance defaults and the `status_bar` and
src/lib/state/workbench/ui.svelte.ts:13:// or oculus's defaults hold them, with `terminal.transcript_font_px` in the workspace file alone,
src/lib/state/workbench/ui.svelte.ts:49:    transcriptFontPx,
src/lib/state/workbench/ui.svelte.ts:163:    transcriptFont: () => number | null;
src/lib/state/workbench/ui.svelte.ts:185:    setTranscriptFont: (size: number | null) => void;
src/lib/state/workbench/ui.svelte.ts:349:    function transcriptFont(): number | null {
src/lib/state/workbench/ui.svelte.ts:350:        return held('terminal.transcript_font_px', transcriptFontPx());
src/lib/state/workbench/ui.svelte.ts:451:    function setTranscriptFont(size: number | null): void {
src/lib/state/workbench/ui.svelte.ts:452:        writeTerminalSize('terminal.transcript_font_px', size);
src/lib/state/workbench/ui.svelte.ts:544:        transcriptFont,
src/lib/state/workbench/ui.svelte.ts:562:        setTranscriptFont,
src/lib/views/sessions/terminal/terminal-list.ts:163:export function transcriptFontSize(chosen: number | null, scale: number): number | undefined {
src/lib/views/sessions/terminal/terminal-list.ts:173:    const size = transcriptFontSize(chosen, scale) ?? Number.NaN;
src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte:27:    // The turns draw at the size of the `terminal.transcript_font_px` option, or at `--fs-sm` where
src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte:73:        ui: { textScale, transcriptFont }
src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte:107:        return transcriptZoom(transcriptFont(), textScale() ?? 1);
src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte:13:    import { gridFontSize, transcriptFontSize } from '../terminal-list';
src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte:23:        ui: { setTerminalFont, setTranscriptFont, terminalFont, textScale, transcriptFont }
src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte:26:    const setFont = $derived(reading ? setTranscriptFont : setTerminalFont);
src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte:32:            ? transcriptFontSize(transcriptFont(), scale)
config/defaults/appearance.yml:82:  # transcript_font_px: 14    # text size of a terminal tab's transcript in CSS pixels; left out, it follows the theme's `--fs-sm` token
config/options/appearance.yml:79:    terminal.transcript_font_px:
```

As the report says, the grep prints the row and not its help, which holds neither name. `grep -n 'Text size of' config/options/appearance.yml` prints the help at `:82` ("Text size of a terminal tab's transcript in CSS pixels. Leaving the key out follows the theme's --fs-sm token. The text size buttons of a terminal tab write this key while the Transcript shows.").

### The round's delta

`diff -u` of every path of `files.txt` against the snapshot prints two hunks and nothing else: the head comment of `src/lib/state/workbench/ui.svelte.ts` and the head comment of `src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte`. `git status --short` lists the 11 files of `files.txt` and three untracked `.scratch` files. `O117-cases.md` and `O117-round-1.md` are equal to the main checkout's under `cmp`, and the report is the builder's. So no check was removed, no test or code line changed, and no fix reaches beyond its finding.

Closures, each rerun:

- S1 closed. `TerminalFontTools.svelte:2-8` says what the round's brief asked. Line widths 97 98 100 93 97 99 11, by `awk`. No next word would fit on any line, so the rewrap is full. `comment-width.test.ts` passes.
- S2 closed, and the added sentence is true:
  - `sed -n 703,783p src/lib/data/helpers/hub-names.ts | grep -c terminal` prints 0.
  - A scratch program prints `hubFileOf undefined` and `place {"layer":"workspace",...,"at":"settings.terminal.transcript_font_px"}` with hub and workspace given (`placeOf`, `config-place.ts`), and `place no workspace null` with no workspace.
  - `defaults alone undefined 12.5`: no default.
  - `hub file 15 undefined 12.5` with the finding "key terminal is not one the hub's settings file takes; it is not applied": a hub file does not set it.
  - The workspace layer's head comment agrees, so the workspace file is the one source.
  - Widths 94 88 92 98 98 99 94 100 99 99 42, as the report says.
- S3 closed. Rerun over `O117-base`, each new name greps to 0 lines (4 of 4). The four block greps with `cut -c1-130` match the report for `boundedTerminalPx`, `scaledFontPx` and `writeTerminalSize`. The `transcriptFontSize` block matches in content, except that the report's `TranscriptBody.svelte:107` line runs to 133 columns against the stated cut at 130, and its trailing spaces are trimmed. See P1 for the one sentence that does not hold.
- B1 closed. `grep -c -F` of the base's help text and of the present help text in the report prints 1 and 1.
- The builder's scoped time-out is as it says:
  - `grep -n testTimeout vite.config.ts` prints nothing, so vitest's default limit applies.
  - My run of `npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts --reporter=dot` exits 1: ` FAIL  |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment`, `Error: Test timed out in 5000ms.`, `Tests  1 failed | 7 passed (8)`.
  - The same files with `--testTimeout 0 --hookTimeout 0 --configLoader runner --reporter=verbose` exit 0: `|unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment 7530ms`, `Test Files  2 passed (2)`, `Tests  8 passed (8)`.
  - `tests/tiers/quick.mjs:285` is `const flags = ['--testTimeout', '0', '--hookTimeout', '0', ...loader];`. `quick.log:36` lists `tests/checks/source/history.test.ts: scans the source text of a changed file`, and `vitest checks` is ok.
  - The report's "as the list's lines below show" points the wrong way: the lines are above, at report lines 116-124.

Other reruns:

- `sh utils/unused-exports.sh` against `O117-base/unused-exports.txt` by `diff`: no line, exit 0.
- `diff -rq --exclude=local.yml` against the base copy: the 10 write-list paths under `src` and `config`; `tests` and `utils` show none.
- `LC_ALL=C grep -n '[^ -~]'` over the 11 files and the report: only the accented names at `config/defaults/appearance.yml:32,39,40,53,141,171,172,195`, lines the diff does not touch; the ASCII gate is ok.
- History words over added comment lines of `git diff 1b3683bd4 -U0 src config docs`: no hit, exit 1.
- `wc -l` of the 11 files equals the report's table. Every `file:line` I checked resolves: `ui.svelte.ts:240,254,277,349,437,451`, `appearance.ts:181,199,204,213,626`, `terminal-list.ts:163,164,171-176`, `TerminalFontTools.svelte:26,29-35,39,45,51,54`, `TranscriptBody.svelte:127-131`, `Terminal.svelte:337`, `TerminalBar.svelte:108`, `tab-session.svelte.ts:41-43`, `client/writes.svelte.ts:125`, `themes.css:53`, `config/options/appearance.yml:75,79,82`.
- The report's case program, taken from report lines 34-76 and run with `node --experimental-strip-types --no-warnings`: output equal to report lines 82-108 under `diff`.
- Scratch probes printed:
  - Reader: `absent key 12.5 null ...`, `11 10.5 11 ...`, `3 10.5 6 ...`, `100 null 40 ...`, `word 10.5 null ...`, `no map null null {}`.
  - Store: `case 3 first 11`, `case 3 second 10 grid null`, `case 4 low 6`, `case 4 high 40`, `reset held null`, `case 12 13.4`, `grid rounded 10.7 transcript 13.4`, and the log ends `["noWorkspace"],["noWorkspace"]`.
  - `terminal-list.ts` with stubbed tokens of `--fs-sm` 12 and `--fs-md` 13: `case 1 size 12 zoom 0.9230769230769231 grid 16`, `case 2 size 11 zoom 0.8461538461538461`, `case 11 size 13 zoom 0.8333333333333334`, `case 12 size 14.399999999999999 less one 13.399999999999999`, `case 15 token 11 size 11 zoom 0.8461538461538461`, `no tokens size undefined zoom 1`.

### Item verdicts

1. The key: holds. `terminalPxShape` `appearance.ts:204` serves both keys through `boundedTerminalPx` `:199`; getter `:626`; row `config/options/appearance.yml:79-85`; help says the three things and no clamp; only a commented line at `config/defaults/appearance.yml:82`.
2. The ui store: holds. `transcriptFont` `ui.svelte.ts:349`, `setTranscriptFont` `:451`, the clamp and reset once in `writeTerminalSize` `:437`. The round-0 ruling's rounding is after the bounds, for both keys.
3. The size in force: holds. `transcriptFontSize` `terminal-list.ts:163`, `transcriptZoom` `:171-176` has no grid read and no floor, no size gives zoom 1, `TranscriptBody.svelte:107` reads the store.
4. The buttons: holds. Required prop through `Terminal.svelte:337` and `TerminalBar.svelte:108`, the guard kept at `TerminalFontTools.svelte:34`, three literal `t()` per branch, `Terminal.svelte:375` unchanged.
5. Comments and pages: holds. Every paragraph the brief lists now reads true, the two of S1 and S2 of the first review included. A paragraph the brief does not list is S1 below.

Ruling in `O117-cases.md`: points 1 to 3 hold (store probe, report's before and after, `tab-session.svelte.ts:41-43`).

### Case verdicts

1. font_px 16, no key: met. Size 12, grid 16, in the stubbed run.
2. font_px 10.5, key 11: met. Size 11, zoom 11/13, no floor.
3. Smaller twice from no key: met. Store probe 11, 10, grid null; the press path by read at `TerminalFontTools.svelte:29-35`.
4. Smaller at 6, larger at 40: met. Store probe 6 and 40; a same-value write answers `{"changed":0,"refused":[]}`.
5. Reset on each view: met. Program output keeps the other key each way; `setFont(null)` picks one.
6. Reset with no key in any file: met. `{"changed":0,"refused":[]}`, and `tell` is silent on it (`client/writes.svelte.ts:125`).
7. font_px 14, Live, smaller: met by read. The branch writes `font_px`, and the transcript's size has no reader of it.
8. Two tabs: not verifiable. The read agrees, each tab having its own `session.reading`. A look with two tabs settles it, as the brief's look names.
9. Transcript with no terminal: met by read. `reading` needs a target only (`tab-session.svelte.ts:41-43`).
10. Key of 3, 100 or a word: met. Program output `merged undefined` with the finding naming `settings.terminal.transcript_font_px`; the size then falls to `--fs-sm`.
11. Key 13 at 1.2: met. Size 13, zoom equal to 13/(13*1.2) in the stubbed run.
12. Smaller at 1.2: met. `13.399999999999999` goes to 13.4 in the store probe and the file holds 13.4; a set key is used as given.
13. Settings view: not verifiable. The write path refuses 3, 100 and `large` and the row exists. A look at the view with a value of 3, and a reset, settles it.
14. A write refused or a workspace unsaved: met. `ui.svelte.ts:254-282` read; the store probe logs `noWorkspace` for both.
15. Theme change with no key: not verifiable. A token of 11 gives size 11, and the observer reads agree (`TranscriptBody.svelte:127-128`). A theme switch on the look settles that the observer fires.

### Spec

None.

### Proof

P1. Report line 262: "`clamp` in `layout/model.ts` is the one numeric helper". The report's own output at lines 249-259 also lists `clampMax` (`src/lib/data/helpers/search/query.ts:113`) and `clamped` (`src/lib/shell/commands/debug/DebugToolbar.svelte:55`), both numeric. Neither replaces `boundedTerminalPx`: `clampMax` floors and answers the cap for an invalid value, and the toolbar's is a local bound on the window's width. So no code changes. Failure scenario: a reader of the S3 closure takes it that one candidate stood, where three did and two were never weighed. One sentence of the report.

### Standards

S1. `src/lib/state/workbench/ui.svelte.ts:276`:
```
/** Take an option out of the open workspace file, so oculus's value is in force again. */
```
At the base the function's one caller was the `terminal.font_px` reset (`git show 1b3683bd4:src/lib/state/workbench/ui.svelte.ts | grep -n resetOption` prints lines 270 and 424). The diff gives it the transcript key through `writeTerminalSize` (`:439`), and that key has no oculus value (`defaults alone undefined`). This is the same defect the round's rulings closed in S1 and S2 of the first review, one screen down in the same file. Failure scenario: Transcript showing, key set, reset; no value of oculus's is in force, and the transcript falls to `--fs-sm`. spec.md:72. One sentence of a comment; no code line.

### Behaviour

None.

### Declined to judge

- The report's counts of its own runs (twice for the list, `npm run diagrams` before each, no whole-suite command): the builder's transcript is not among my reads. `git status --short` after my quick run lists the same 14 lines as before it.
- `npm run diagrams`: not run, since it writes into the worktree.
- The repaired report's text from before the round: no snapshot of it, so its changes were judged as the file stands.
- Everything that needs a press or a drawn page: the look at landing named in the brief, the button names on each view, the zoom on the page, and the Settings row. The stubbed runs use tokens I set, so they prove the arithmetic and no drawn size.
- The refusal words "oculus's value stands" for a key with no default: a shared catalog sentence, as for `terminal.opacity`, and the brief names that row form as accepted.
- The engine's own `loadConfig`, which the case program and my hub probe call, reads the options folder. Those programs printed nothing of a `local.yml`, and every grep of mine over `config` carried `--exclude=local.yml`.

Usage: a3511a27e18159a8f, claude-opus-5-5, 195850 tokens, 29 tool uses, 7 min 58 s

## Closed

- First run S1, S2, S3, B1: closed in repair round 1, each closure reproduced by the run over the round.
- Round 1 S1, `ui.svelte.ts:276`: fixed at landing, one sentence of a comment.
- Round 1 P1, a sentence of the report: fixed at landing in `O117-report.md`.
