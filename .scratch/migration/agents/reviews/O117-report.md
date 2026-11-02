Everything in the brief is done

The brief here means `agents/briefs/O117.md` with the ruling of `agents/briefs/O117-cases.md` (option (a)). What only a page shows is left to the look on landing, row by row below.

## Open items of the state file, verbatim

The section "## Open items" of `.scratch/migration/orchestrator-state.md` (lines 165-172) holds its heading, its one standing paragraph and no entry:

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first read, and where each stands

The first read was made on the unchanged tree, and found one case the brief's rules got wrong: case 12, handed back and ruled in `O117-cases.md`. Each line gives what the unchanged tree did, then what the built code does. "Run" means the case program below printed it; "read" means the code at that `file:line`, and a press needs the look. All `file:line` are taken after the last change.

1. **`font_px` 16, no transcript key, Transcript showing.** Tree: 16, the `Math.max` of the grid's size and `--fs-sm`. Built, read: `transcriptFontSize(null, scale)` is `--fs-sm` times the scale (`terminal-list.ts:163-165`) and `font_px` is not read on that path.
2. **`font_px` 10.5, key 11, Transcript showing.** Tree: 12, the floor. Built, read: `chosen` is 11, and `transcriptZoom` (`terminal-list.ts:171-176`) has no floor.
3. **Smaller twice from no key at `--fs-sm` 12, scale 1.** Tree: wrote `font_px`. Built, read: 12 + -1 is 11 (`TerminalFontTools.svelte:29-35`); `held` (`ui.svelte.ts:240`) answers 11 before the push, so the next press gives 10; `setFont` is `setTranscriptFont` (`TerminalFontTools.svelte:26`), so `font_px` is unwritten. Run: 11 -> 11, 10 -> 10.
4. **Smaller at 6, larger at 40.** Tree: the clamp for `font_px`. Built: `boundedTerminalPx` (`appearance.ts:199`) in `writeTerminalSize` (`ui.svelte.ts:437`). Run: 5 -> 6, 41 -> 40, and a write of the value the file holds answers `{"changed":0,"refused":[]}`.
5. **Reset on each view.** Tree: one reset, `font_px` alone. Built, read: `setFont(null)` picks one key (`TerminalFontTools.svelte:54`). Run: with both keys in the file, a reset of the transcript key leaves `font_px: 14`, and a reset of `font_px` leaves `transcript_font_px: 11`.
6. **Reset with Transcript showing and no key in any file.** Tree: no row, so a refusal `no_entry`. Built, run: `{"changed":0,"refused":[]}`, the file unchanged; `tell` (`writes.svelte.ts:125`) says nothing for that answer.
7. **`font_px` 14, Live, smaller, then the same tab on Transcript.** Tree: the grid moved to 13 and the transcript with it. Built, read: `reading` is false, so `setTerminalFont(13)`; the transcript's key is unwritten and its zoom has no reader of `font_px`.
8. **Two tabs, one on Live and one on Transcript.** Tree: a press moved both. Built, read: each tab's own `session.reading` reaches its own buttons (`Terminal.svelte:337`, `TerminalBar.svelte:108`), and each key is one value, so two transcripts share theirs.
9. **A tab on Transcript with no terminal.** Tree: smaller wrote `font_px`. Built, read: `session.reading` (`transcript/tab-session.svelte.ts:41-43`) needs a target and no terminal, so smaller writes the transcript key.
10. **A key of 3, 100 or a word in `settings:`.** Tree: the finding of an unknown key. Built, run: `3 merged undefined findings [["settings.terminal.transcript_font_px","settings.terminal.transcript_font_px must be a number from 6 to 40; oculus's value stands"]]`, the same for 100, and for `large` "must be a number". `terminalPxShape` then reads null (`appearance.ts:204`), so the transcript draws at `--fs-sm`.
11. **A key of 13 at a text size of 1.2.** Tree: the key had no reader. Built, read: size 13, not multiplied (`terminal-list.ts:164`), zoom 13 / (`--fs-md` * 1.2) (`terminal-list.ts:174`).
12. **Smaller from no key at a text size of 1.2 and `--fs-sm` 12.** Tree: wrote `font_px`. Built, run: `13.399999999999999 -> 13.4`, and a write of 13.4 leaves `transcript_font_px: 13.4` in the file. It stays through a change of the text size, since a set key is used as given.
13. **The key set and reset in the Settings view.** Tree: no row. Built: the row is at `config/options/appearance.yml:79`. Run through the write: 3, 100 and `large` are refused with the row's sentence. The view itself: the look.
14. **A write refused or a workspace not saved.** Tree and built, read: both setters go through `writeOption` and `resetOption` (`ui.svelte.ts:254`, `:277`), which drop the held value on a refusal and offer Save Workspace.
15. **The theme changes while no key is set.** Tree and built, read: the observer (`TranscriptBody.svelte:127-128`) calls `retakeZoom`, which reads `--fs-sm` off the body through `transcriptFontSize`. `body.rice` sets the token to 11 (`themes.css:53`).

The case program's source, run with `node --experimental-strip-types --no-warnings <program> "$PWD" <scratch folder>`; the program and its files are deleted, and it wrote only a workspace file under the scratchpad:

```js
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const engine = process.argv[2];
const scratch = mkdtempSync(join(process.argv[3], 'ws-'));
const file = join(scratch, 'main.yml');
globalThis.$state = (value) => value;
const { loadConfig } = await import(engine + '/src/lib/data/sources/config/merge/merge.ts');
const { writeConfigKey } = await import(engine + '/src/lib/server/edit/writes/config/config-key.ts');
const { resetConfig } = await import(engine + '/src/lib/server/edit/writes/config/config-reset.ts');
const { boundedTerminalPx } = await import(engine + '/src/lib/state/shared/words/appearance.ts');
const KEY = 'terminal.transcript_font_px';
const FONT = 'terminal.font_px';
const layers = { workspace: file };
const held = () => readFileSync(file, 'utf8').trim().replaceAll('\n', ' | ');
const answer = (one) => ({ changed: one.changed.length, refused: one.refused.map((r) => r.reason) });

console.log('case 10: a value in settings');
for (const value of ['3', '100', 'large', '11']) {
    writeFileSync(file, `settings:\n  terminal:\n    transcript_font_px: ${value}\n`);
    const read = loadConfig(engine, { workspace: { file } });
    const named = read.findings.filter((one) => String(one.key).includes('transcript'));
    console.log(value, 'merged', read.config.terminal.transcript_font_px, 'findings', JSON.stringify(named.map((one) => [one.key, one.message])));
}

console.log('case 6 and 5: a reset');
writeFileSync(file, 'settings:\n  terminal:\n    font_px: 14\n');
console.log('no transcript key', JSON.stringify(answer(resetConfig(engine, 'appearance.yml', KEY, layers))), held());
console.log('write the key', JSON.stringify(answer(writeConfigKey(engine, 'appearance.yml', KEY, 13.4, layers))), held());
console.log('case 4: the same value', JSON.stringify(answer(writeConfigKey(engine, 'appearance.yml', KEY, 13.4, layers))), held());
console.log('reset the transcript key', JSON.stringify(answer(resetConfig(engine, 'appearance.yml', KEY, layers))), held());
writeFileSync(file, 'settings:\n  terminal:\n    font_px: 14\n    transcript_font_px: 11\n');
console.log('reset the grid key', JSON.stringify(answer(resetConfig(engine, 'appearance.yml', FONT, layers))), held());

console.log('case 13: out of range through the write');
for (const value of [3, 100, 'large']) {
    console.log(value, JSON.stringify(answer(writeConfigKey(engine, 'appearance.yml', KEY, value, layers))));
}

console.log('the clamp and the rounding, as writeTerminalSize does them');
const size = (value) => Math.round(boundedTerminalPx(value) * 100) / 100;
for (const value of [12 * 1.2 - 1, 12 * 1.2 - 2, 12 * 1.2 + 1, 13 * 0.9 - 1, 13 * 1.3 - 1, 11, 10, 13.25, 12.5, 6 - 1, 40 + 1]) {
    console.log(value, '->', size(value));
}
```

Its output:

```
case 10: a value in settings
3 merged undefined findings [["settings.terminal.transcript_font_px","settings.terminal.transcript_font_px must be a number from 6 to 40; oculus's value stands"]]
100 merged undefined findings [["settings.terminal.transcript_font_px","settings.terminal.transcript_font_px must be a number from 6 to 40; oculus's value stands"]]
large merged undefined findings [["settings.terminal.transcript_font_px","settings.terminal.transcript_font_px must be a number; oculus's value stands"]]
11 merged 11 findings []
case 6 and 5: a reset
no transcript key {"changed":0,"refused":[]} settings: |   terminal: |     font_px: 14
write the key {"changed":1,"refused":[]} settings: |   terminal: |     font_px: 14 |     transcript_font_px: 13.4
case 4: the same value {"changed":0,"refused":[]} settings: |   terminal: |     font_px: 14 |     transcript_font_px: 13.4
reset the transcript key {"changed":1,"refused":[]} settings: |   terminal: |     font_px: 14
reset the grid key {"changed":1,"refused":[]} settings: |   terminal: |     transcript_font_px: 11
case 13: out of range through the write
3 {"changed":0,"refused":["settings.terminal.transcript_font_px must be a number from 6 to 40; oculus's value stands"]}
100 {"changed":0,"refused":["settings.terminal.transcript_font_px must be a number from 6 to 40; oculus's value stands"]}
large {"changed":0,"refused":["settings.terminal.transcript_font_px must be a number; oculus's value stands"]}
the clamp and the rounding, as writeTerminalSize does them
13.399999999999999 -> 13.4
12.399999999999999 -> 12.4
15.399999999999999 -> 15.4
10.700000000000001 -> 10.7
15.900000000000002 -> 15.9
11 -> 11
10 -> 10
13.25 -> 13.25
12.5 -> 12.5
5 -> 6
41 -> 40
```

## DONE / NOT DONE

`npm run test:quick` ran twice: once after the build's last change and once after the last change of repair round 1, and both passed. No whole-suite command ran. `npm run diagrams` ran once right before each. The last lines of the final run, as printed:

```
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (13.3 s)
ok      svelte-check (16.7 s): 1793625358812 COMPLETED 580 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (48.1 s): Duration  31.81s (transform 47.80s, setup 0ms, import 112.23s, tests 11.28s, environment 370ms)
ok      vitest slow (56.1 s): Duration  39.47s (transform 30.33s, setup 0ms, import 47.08s, tests 26.45s, environment 1ms)
ok      vitest checks (76.6 s): Duration  60.29s (transform 17.71s, setup 0ms, import 43.96s, tests 148.72s, environment 3ms)
test:quick: 79.2 s; every command passed
```

| Deliverable | State | Proof |
| --- | --- | --- |
| 1. The key: reader, getter, row, commented default | DONE | `test:quick: 79.2 s; every command passed`; case 10 of the program (`11 merged 11 findings []`); the brief's grep below |
| 2. The ui store: reader and setter, clamp and reset once | DONE | `grep -n 'function writeTerminalSize' src/lib/state/workbench/ui.svelte.ts` prints line 437, the one place of the clamp and the reset; the program's clamp lines |
| Ruling 1: rounding to a hundredth after the bounds, for both keys | DONE | `13.399999999999999 -> 13.4`, `transcript_font_px: 13.4` in the file |
| 3. The size in force | DONE | `transcriptFontSize`, `terminal-list.ts:163`; no `Math.max` in `transcriptZoom`, read at `terminal-list.ts:171-176`; the drawn size on the look |
| 4. The buttons | DONE | Read at `TerminalFontTools.svelte:15-35`; the press and the three names on the look |
| 5. Comments and pages | DONE | The table "Paragraphs that describe the behaviour" |
| Ruling 2: before and after of a grid press | DONE | "User-visible changes" below |
| Verify 1: `npm run test:quick` | DONE | `test:quick: 79.2 s; every command passed` |
| Verify 2: `grep -rn --exclude=local.yml 'transcript_font_px\|ranscriptFont' src config docs` | DONE | It lists `appearance.ts:213`, `:626`, `ui.svelte.ts:349`, `:451`, `config/options/appearance.yml:79`, `config/defaults/appearance.yml:82`. The row's help holds neither name, so the grep prints the row and not the help; the help is `config/options/appearance.yml:82` (`grep -n 'Text size of a terminal tab' config/options/appearance.yml`) |

## Paragraphs that describe the behaviour

| Paragraph | State |
| --- | --- |
| `terminal-list.ts:3`, head comment | rewritten |
| The comment on `gridFontSize` | still true |
| The comment on `transcriptZoom` | rewritten |
| `TranscriptBody.svelte:27-31` | rewritten |
| `TranscriptBody.svelte:122-124` | rewritten |
| `TerminalFontTools.svelte:2-8` | rewritten |
| `TerminalBar.svelte:2-9` | still true, "the font buttons" |
| `Terminal.svelte:46` | still true |
| `ui.svelte.ts:10`, head comment | rewritten |
| `terminalShape`'s comment in `appearance.ts` | rewritten |
| `appearance.ts` head comment and the comment on `terminal` | rewritten |
| `terminalFontPx`'s comment | still true |
| `config/options/appearance.yml:72`, `terminal.font_px` | rewritten |
| `config/defaults/appearance.yml:79` | rewritten |
| `docs/HELP.md:459` | rewritten |
| `docs/HELP.md:565`, `docs/templates.md:697` | still true |

## Files

Made from `diff -rq` against the base copy over `src`, `tests`, `config` and `utils`, with `git status --short` for `docs` and `.scratch`. Every path is on the write list; `tests` and `utils` show no difference.

| Path | Lines after |
| --- | --- |
| `src/lib/state/shared/words/appearance.ts` | 707 |
| `src/lib/state/workbench/ui.svelte.ts` | 576 |
| `src/lib/views/sessions/terminal/terminal-list.ts` | 763 |
| `src/lib/views/sessions/terminal/Terminal.svelte` | 486 |
| `src/lib/views/sessions/terminal/bar/TerminalBar.svelte` | 131 |
| `src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte` | 55 |
| `src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte` | 403 |
| `config/options/appearance.yml` | 224 |
| `config/defaults/appearance.yml` | 216 |
| `config/text/views/sessions/terminal.yml` | 130 |
| `docs/HELP.md` | 613 |
| `.scratch/migration/agents/reviews/O117-report.md` | this file |

`.scratch/migration/agents/briefs/O117-cases.md` and `.scratch/migration/agents/briefs/O117-round-1.md` show as untracked in the worktree; they are the orchestrator's and I did not write them.

## Judgment calls (each reversible)

1. **`boundedTerminalPx`, exported from `appearance.ts`.** The bound of 6 to 40 is written once for the reader and the store, as `boundedTextSize` is for the text size. The greps for a helper to reuse before each new function are quoted under "Repair round 1": `clamped` (`appearance.ts:181`) is a zod shape with a fallback, and `clamp` (`state/workbench/layout/model.ts:392`) sits in a layout module the words layer has no reason to import.
2. **`scaledFontPx` in `terminal-list.ts`.** The check that a step times the scale is a size was in `gridFontSize`; it is now shared by the two sizes. `gridFontSize` answers as it did: `chosen ?? terminalFontPx() ?? scaledFontPx('--fs-md', scale)`.
3. **`transcriptFontSize` does not read the config itself.** `gridFontSize` falls back on `terminalFontPx()`; its callers pass `terminalFont()`, which already holds that value, so the new function takes the store's value alone.
4. **`$derived` for `setFont`** in `TerminalFontTools.svelte`, so the buttons name the setter once.
5. **The new row sits right after `terminal.font_px`**, and the commented line of the defaults right after `font_px`, with the three words after `terminal_smaller` in the catalog.
6. **The rounding is to a hundredth in `writeTerminalSize`, after the bounds**, as the ruling says.

## Grep results the rules ask for

- History words: `git diff -U0 src config` over added comment lines, for before, used to, no longer, still, always, as before, previously, the step adds, after this: no hit. No test title was added.
- Names: `grep -rn --exclude=local.yml 'transcript_font_px\|ranscriptFont' src config docs` lists the reader (`appearance.ts:213`, the getter `:626`), the setter (`ui.svelte.ts:451`), the store's reader (`ui.svelte.ts:349`), the row (`config/options/appearance.yml:79`), the commented line (`config/defaults/appearance.yml:82`) and the views. The row's help is read from that row by the Settings view.
- Stale wording: `grep -rn --exclude=local.yml -i 'never below\|never draws below\|down to the size\|clamped to 6' src config docs` prints one line, `src/lib/state/life/present.ts:197`, about another thing.
- Words: `grep -rn 'transcript_larger\|transcript_reset\|transcript_smaller' src config` prints the three catalog lines and one literal `t('...')` each in `TerminalFontTools.svelte:39,45,51`.
- `sh utils/unused-exports.sh`, compared with `O117-base/unused-exports.txt` by `diff`: no line added or removed.
- Keys introduced: `terminal.transcript_font_px` is one option row, `grep` shows no earlier use; the three words had no earlier use.
- Tests: the step adds and changes no test, as the brief says. No assertion, allow list or predicate is edited.

## Asynchronous paths and keys

- A press while a write is in flight: `held` answers the written value, so the next press steps from it, as for `font_px`.
- A reset while a write is in flight: `resetOption` drops the held value and sends the reset, the order of the two being the server's, as for `font_px`.
- The component closed: nothing of the buttons outlives it; the zoom's effect disconnects its observer (`TranscriptBody.svelte:129-131`).

## User-visible changes, before and after

The Terminal view on Transcript, default theme, text size 1, no key set, `font_px` at the shipped 12.5:

- Size: before 12.5 px, after 12 px. On a terminal theme, before 12.5 px, after 11 px.
- Smaller: before, the transcript did not move until the grid went below `--fs-sm`, and the grid moved with it. After, the transcript moves one pixel at each press, below `--fs-sm` too, and the grid does not move.
- Button names on Transcript: before "Smaller terminal text", "Larger terminal text", "Reset terminal text size". After "Smaller transcript text", "Larger transcript text", "Reset transcript text size". On Live they are as they were.
- Reset on Transcript: before it took out `font_px`. After it takes out `terminal.transcript_font_px` alone. On Live it takes out `font_px` alone.
- Settings view, terminal heading, Display and keys: a new number row `terminal.transcript_font_px`, drawn empty until set, after `terminal.font_px`.
- Settings view, the help of `terminal.font_px`. Before: "Text size of the terminal grid and of a terminal tab's transcript in CSS pixels; the transcript never draws below the theme's --fs-sm token. The grid paints its own text and cannot inherit the page's size; a value is clamped to 6 to 40. Leaving the key out makes the terminal follow the theme's --fs-md token. The text size buttons of a terminal tab write this key." After: "Text size of the terminal grid in CSS pixels. The grid paints its own text and cannot inherit the page's size. Leaving the key out makes the terminal follow the theme's --fs-md token. The text size buttons of a terminal tab write this key while a grid shows." The transcript and the `--fs-sm` floor are gone, the sentence "a value is clamped to 6 to 40" is dropped, and the buttons' sentence gains "while a grid shows".
- `docs/HELP.md:459` and the defaults comment say the new rule.

A press on a grid, by the ruling: the value written is rounded to a hundredth. A size with two decimals or fewer is unchanged by it. Before, at a text size of 0.9 with `font_px` left out, smaller wrote 10.700000000000001; after, 10.7. Before, a file value of 12.345 and smaller wrote 11.345; after, 11.35 (`node -e "console.log(12.345-1, Math.round((12.345-1)*100)/100)"` prints `11.345 11.35`).

The look at landing: on a scratch server with the transcript showing, smaller twice below 12 px, a second tab on Live with its grid unmoved, Live smaller with the transcript's zoom unchanged, and reset on each, as the brief's "The look at landing" says. Also the three button names on hover or in the accessible name on each view, and the Settings row with a value of 3 refused.

## Limitations

- A press is proved by reading and by the store's two functions; `npx vitest` does not reach the buttons, since the brief asks for no test. The look on landing proves it.
- `font_px` and the transcript key can be written by the buttons only to a hundredth, while a file or the Settings box may hold more decimals. A size held with a third decimal is used as given until the next press.
- `npm run diagrams` ran right before each run of the list and changed no tracked path (`git status --short` after it lists the paths above and nothing else).

## Anything in the brief that was wrong

- Case 12's "13.4" did not follow from the brief's rule; the ruling added the rounding and the case now holds, as case 12 above shows.
- The location `tab-session.svelte.ts:41-42` was corrected by the ruling to `src/lib/views/sessions/terminal/transcript/tab-session.svelte.ts:41-43`.

## Repair round 1

The round's brief is `agents/briefs/O117-round-1.md`. All four findings are closed, and the only code change is the two comments of S1 and S2. All `file:line` in this report are taken after those edits.

| Finding | How it closed | Check |
| --- | --- | --- |
| S1, `TerminalFontTools.svelte:3-4` | The head comment now says the reset takes out the key of what the tab shows, so a grid returns to the size configured under it and a transcript to `--fs-sm`. Rewrapped at 100 columns, lines 2-8 | `awk 'length > 100'` over the file prints nothing; the widths of lines 2-8 are 97 98 100 93 97 99 11 |
| S2, `ui.svelte.ts:10-13` | The sentence now ends "as the open workspace file sets them or oculus's defaults hold them, with `terminal.transcript_font_px` in the workspace file alone, since it has no default." Paragraph rewrapped, lines 9-19 | The same `awk`; the widths of lines 9-19 are 94 88 92 98 98 99 94 100 99 99 42 |
| S3, judgment call 1 | The greps below were run over the base copy, so they show what stood before the new functions. No code changed for this finding | The four outputs below |
| B1, user-visible changes | The bullet "Settings view, the help of `terminal.font_px`" gives the help before and after, with the dropped clamp sentence and "while a grid shows" | That bullet, quoted against `config/options/appearance.yml:75` |

The greps of S3, with `B=/Users/axelfaes/workspace/oculus/.agents/worktrees/O117-base`, each path shown relative to `$B`. Each first line greps the new name itself over `$B/src $B/tests` and printed nothing.

`boundedTerminalPx`, `grep -rnE 'Math\.min\(40|Math\.max\(6|function clamp|function clamped|function bounded[A-Z]?' $B/src $B/tests`:

```
src/lib/shell/commands/debug/DebugToolbar.svelte:55:    function clamped(x: number, node: HTMLElement): number {
src/lib/server/core/reader/call.ts:85:async function bounded(response: Response, max: number, name: string): Promise<string> {
src/lib/server/sessions/group.ts:269:function clamp(folder: string, workspace: string): string {
src/lib/state/shared/words/appearance.ts:179:function clamped(fallback: number, low: number, high: number): z.ZodType<number> {
src/lib/state/shared/words/appearance.ts:204:            .transform((value) => Math.min(40, Math.max(6, value)))
src/lib/state/shared/words/appearance.ts:317:export function boundedTextSize(value: unknown): number {
src/lib/state/workbench/ui.svelte.ts:427:        void writeOption(APPEARANCE, 'terminal.font_px', Math.min(40, Math.max(6, size)))
src/lib/state/workbench/layout/model.ts:392:export function clamp(value: number, low: number, high: number): number {
src/lib/state/boards/structure/forces.ts:213:export function clampToBox(simulation: MapForces, bounds: Bounds): void {
src/lib/data/helpers/search/query.ts:113:export function clampMax(max: number, cap: number): number {
src/lib/views/shared/card/card-layout.ts:29:export function clampControl(open: boolean, overflowing: boolean): ClampControl {
```

The two `Math.min(40, ...)` lines are the code `boundedTerminalPx` replaces. Of the rest, `clamped` in `appearance.ts` is a zod shape with a fallback and `clamp` in `layout/model.ts`, `clampMax` in `data/helpers/search/query.ts` and the local `clamped` in `DebugToolbar.svelte` are the numeric helpers, and none replaces it: `clampMax` answers the cap for an invalid value, the toolbar bounds a window width, in a module the words layer has no reason to import.

`scaledFontPx`, `grep -rnE 'stepFontPx|bodyFontPx|getPropertyValue\(.--fs-' $B/src $B/tests`:

```
src/lib/views/sessions/terminal/terminal-list.ts:135:function stepFontPx(step: '--fs-sm' | '--fs-md'): number {
src/lib/views/sessions/terminal/terminal-list.ts:141:function bodyFontPx(): number {
src/lib/views/sessions/terminal/terminal-list.ts:142:    return stepFontPx('--fs-md');
src/lib/views/sessions/terminal/terminal-list.ts:152:    const computed = bodyFontPx() * scale;
src/lib/views/sessions/terminal/terminal-list.ts:163:    const size = Math.max(gridFontSize(chosen, scale) ?? Number.NaN, stepFont
src/lib/views/sessions/terminal/terminal-list.ts:164:    const zoom = size / (bodyFontPx() * scale);
```

`scaledFontPx` calls `stepFontPx` and takes over the check at line 152 and the line after it.

`transcriptFontSize`, `grep -rnE 'gridFontSize|transcriptZoom' $B/src $B/tests`:

```
src/lib/views/sessions/terminal/terminal-list.ts:149:export function gridFontSize(chosen: number | null, scale: number): number |
src/lib/views/sessions/terminal/terminal-list.ts:161:export function transcriptZoom(chosen: number | null, scale: number): number
src/lib/views/sessions/terminal/terminal-list.ts:163:    const size = Math.max(gridFontSize(chosen, scale) ?? Number.NaN, stepFont
src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte:30:    // `transcriptZoom`). The scroller itself is not zoomed, s
src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte:47:    import { transcriptZoom } from '../terminal-list';
src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte:105:    /** The zoom of the box of turns, as `transcriptZoom` giv
src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte:107:        return transcriptZoom(terminalFont(), textScale() ?? 1);
src/lib/views/sessions/terminal/grid/TerminalGrid.svelte:19:    // getComputedStyle by grid-look.ts, and its size by gridFontSize
src/lib/views/sessions/terminal/grid/TerminalGrid.svelte:71:        gridFontSize,
src/lib/views/sessions/terminal/grid/TerminalGrid.svelte:296:            const size = gridFontSize(untrack(terminalFont), untrack(
src/lib/views/sessions/terminal/grid/TerminalGrid.svelte:424:        const size = gridFontSize(terminalFont(), textScale() ?? 1);
src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte:10:    import { gridFontSize } from '../terminal-list';
src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte:18:        const current = gridFontSize(terminalFont(), textScale() ?
```

No function gave a size for the transcript alone; item 3 asks for the one function the buttons and the zoom share.

`writeTerminalSize`, `grep -rnE "writeOption\(APPEARANCE|resetOption\(APPEARANCE" $B/src $B/tests`:

```
src/lib/state/workbench/ui.svelte.ts:414:        void writeOption(APPEARANCE, 'theme', named);
src/lib/state/workbench/ui.svelte.ts:418:        void writeOption(APPEARANCE, 'crt.on', on);
src/lib/state/workbench/ui.svelte.ts:424:            resetOption(APPEARANCE, 'terminal.font_px');
src/lib/state/workbench/ui.svelte.ts:427:        void writeOption(APPEARANCE, 'terminal.font_px', Math.min(40, Math.max(6, size)))
src/lib/state/workbench/ui.svelte.ts:500:        void writeOption(APPEARANCE, key, value);
src/lib/state/workbench/ui.svelte.ts:504:        return writeOption(APPEARANCE, 'file_icons', name);
```

`writeTerminalSize` is lines 424-427 under a key parameter, on the same `writeOption` and `resetOption`, as item 2 asks.

The output lines above are cut to 130 columns, as the command was piped through `cut -c1-130`.

Scoped checks of the round: `npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts --reporter=dot` passed the comment-width file and timed out in one case of `history.test.ts`, "names no package id, date or session in any comment": `Error: Test timed out in 5000ms.`, and the same when rerun alone. That is vitest's default limit on a scan of the whole tree. `npm run test:quick` runs the file with `--testTimeout 0` (`tests/tiers/quick.mjs:285`), and there it passes, as the list's lines below show. I changed no timeout and no test.

The verify list of this round ran once, after the last change, with `npm run diagrams` once right before it, and its lines are the ones quoted under "DONE / NOT DONE". `sh utils/unused-exports.sh` compared with the base list by `diff` prints nothing, and the history-word grep over the comment lines of this round has no hit.
