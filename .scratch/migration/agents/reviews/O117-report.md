Everything in the brief is done

The brief here means `agents/briefs/O117.md` with the ruling of `agents/briefs/O117-cases.md` (option (a)). What only a page shows is left to the look on landing, row by row below.

## Open items of the state file, verbatim

The section "## Open items" of `.scratch/migration/orchestrator-state.md` (lines 165-172) holds its heading, its one standing paragraph and no entry:

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first read, and where each stands

The first read was made on the unchanged tree, and found one case the brief's rules got wrong: case 12, handed back and ruled in `O117-cases.md`. Each line gives what the unchanged tree did, then what the built code does. "Run" means the case program below printed it; "read" means the code at that `file:line`, and a press needs the look. All `file:line` are taken after the last change.

1. **`font_px` 16, no transcript key, Transcript showing.** Tree: 16, the `Math.max` of the grid's size and `--fs-sm`. Built, read: `transcriptFontSize(null, scale)` is `--fs-sm` times the scale (`terminal-list.ts:163-165`) and `font_px` is not read on that path.
2. **`font_px` 10.5, key 11, Transcript showing.** Tree: 12, the floor. Built, read: `chosen` is 11, and `transcriptZoom` (`terminal-list.ts:171-176`) has no floor.
3. **Smaller twice from no key at `--fs-sm` 12, scale 1.** Tree: wrote `font_px`. Built, read: 12 + -1 is 11 (`TerminalFontTools.svelte:27-33`); `held` (`ui.svelte.ts:239`) answers 11 before the push, so the next press gives 10; `setFont` is `setTranscriptFont` (`TerminalFontTools.svelte:24`), so `font_px` is unwritten. Run: 11 -> 11, 10 -> 10.
4. **Smaller at 6, larger at 40.** Tree: the clamp for `font_px`. Built: `boundedTerminalPx` (`appearance.ts:199`) in `writeTerminalSize` (`ui.svelte.ts:436`). Run: 5 -> 6, 41 -> 40, and a write of the value the file holds answers `{"changed":0,"refused":[]}`.
5. **Reset on each view.** Tree: one reset, `font_px` alone. Built, read: `setFont(null)` picks one key (`TerminalFontTools.svelte:52`). Run: with both keys in the file, a reset of the transcript key leaves `font_px: 14`, and a reset of `font_px` leaves `transcript_font_px: 11`.
6. **Reset with Transcript showing and no key in any file.** Tree: no row, so a refusal `no_entry`. Built, run: `{"changed":0,"refused":[]}`, the file unchanged; `tell` (`writes.svelte.ts:125`) says nothing for that answer.
7. **`font_px` 14, Live, smaller, then the same tab on Transcript.** Tree: the grid moved to 13 and the transcript with it. Built, read: `reading` is false, so `setTerminalFont(13)`; the transcript's key is unwritten and its zoom has no reader of `font_px`.
8. **Two tabs, one on Live and one on Transcript.** Tree: a press moved both. Built, read: each tab's own `session.reading` reaches its own buttons (`Terminal.svelte:337`, `TerminalBar.svelte:108`), and each key is one value, so two transcripts share theirs.
9. **A tab on Transcript with no terminal.** Tree: smaller wrote `font_px`. Built, read: `session.reading` (`transcript/tab-session.svelte.ts:41-43`) needs a target and no terminal, so smaller writes the transcript key.
10. **A key of 3, 100 or a word in `settings:`.** Tree: the finding of an unknown key. Built, run: `3 merged undefined findings [["settings.terminal.transcript_font_px","settings.terminal.transcript_font_px must be a number from 6 to 40; oculus's value stands"]]`, the same for 100, and for `large` "must be a number". `terminalPxShape` then reads null (`appearance.ts:204`), so the transcript draws at `--fs-sm`.
11. **A key of 13 at a text size of 1.2.** Tree: the key had no reader. Built, read: size 13, not multiplied (`terminal-list.ts:164`), zoom 13 / (`--fs-md` * 1.2) (`terminal-list.ts:174`).
12. **Smaller from no key at a text size of 1.2 and `--fs-sm` 12.** Tree: wrote `font_px`. Built, run: `13.399999999999999 -> 13.4`, and a write of 13.4 leaves `transcript_font_px: 13.4` in the file. It stays through a change of the text size, since a set key is used as given.
13. **The key set and reset in the Settings view.** Tree: no row. Built: the row is at `config/options/appearance.yml:79`. Run through the write: 3, 100 and `large` are refused with the row's sentence. The view itself: the look.
14. **A write refused or a workspace not saved.** Tree and built, read: both setters go through `writeOption` and `resetOption` (`ui.svelte.ts:253`, `:276`), which drop the held value on a refusal and offer Save Workspace.
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

`npm run test:quick` ran once, after the last change, and passed; no whole-suite command ran. `npm run diagrams` ran once right before it. Its last lines, as printed:

```
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (2.7 s)
ok      eslint (18.2 s)
ok      svelte-check (48.8 s): 1793624597935 COMPLETED 580 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (67.9 s): Duration  47.16s (transform 42.13s, setup 0ms, import 67.70s, tests 37.59s, environment 1ms)
ok      vitest (74.1 s): Duration  54.01s (transform 139.18s, setup 0ms, import 201.87s, tests 7.09s, environment 1.43s)
ok      vitest checks (94.0 s): Duration  74.03s (transform 20.26s, setup 0ms, import 51.13s, tests 182.14s, environment 4ms)
test:quick: 96.8 s; every command passed
```

| Deliverable | State | Proof |
| --- | --- | --- |
| 1. The key: reader, getter, row, commented default | DONE | `test:quick: 96.8 s; every command passed`; case 10 of the program (`11 merged 11 findings []`); the brief's grep below |
| 2. The ui store: reader and setter, clamp and reset once | DONE | `grep -n 'function writeTerminalSize' src/lib/state/workbench/ui.svelte.ts` prints line 436, the one place of the clamp and the reset; the program's clamp lines |
| Ruling 1: rounding to a hundredth after the bounds, for both keys | DONE | `13.399999999999999 -> 13.4`, `transcript_font_px: 13.4` in the file |
| 3. The size in force | DONE | `transcriptFontSize`, `terminal-list.ts:163`; no `Math.max` in `transcriptZoom`, read at `terminal-list.ts:171-176`; the drawn size on the look |
| 4. The buttons | DONE | Read at `TerminalFontTools.svelte:13-33`; the press and the three names on the look |
| 5. Comments and pages | DONE | The table "Paragraphs that describe the behaviour" |
| Ruling 2: before and after of a grid press | DONE | "User-visible changes" below |
| Verify 1: `npm run test:quick` | DONE | `test:quick: 96.8 s; every command passed` |
| Verify 2: `grep -rn --exclude=local.yml 'transcript_font_px\|ranscriptFont' src config docs` | DONE | It lists `appearance.ts:213`, `:626`, `ui.svelte.ts:348`, `:450`, `config/options/appearance.yml:79`, `config/defaults/appearance.yml:82`. The row's help holds neither name, so the grep prints the row and not the help; the help is `config/options/appearance.yml:82` (`grep -n 'Text size of a terminal tab' config/options/appearance.yml`) |

## Paragraphs that describe the behaviour

| Paragraph | State |
| --- | --- |
| `terminal-list.ts:3`, head comment | rewritten |
| The comment on `gridFontSize` | still true |
| The comment on `transcriptZoom` | rewritten |
| `TranscriptBody.svelte:27-31` | rewritten |
| `TranscriptBody.svelte:122-124` | rewritten |
| `TerminalFontTools.svelte:2-6` | rewritten |
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
| `src/lib/state/workbench/ui.svelte.ts` | 575 |
| `src/lib/views/sessions/terminal/terminal-list.ts` | 763 |
| `src/lib/views/sessions/terminal/Terminal.svelte` | 486 |
| `src/lib/views/sessions/terminal/bar/TerminalBar.svelte` | 131 |
| `src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte` | 53 |
| `src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte` | 403 |
| `config/options/appearance.yml` | 224 |
| `config/defaults/appearance.yml` | 216 |
| `config/text/views/sessions/terminal.yml` | 130 |
| `docs/HELP.md` | 613 |
| `.scratch/migration/agents/reviews/O117-report.md` | this file |

`.scratch/migration/agents/briefs/O117-cases.md` shows as untracked in the worktree; it is the orchestrator's ruling and I did not write it.

## Judgment calls (each reversible)

1. **`boundedTerminalPx`, exported from `appearance.ts`.** The bound of 6 to 40 is written once for the reader and the store, as `boundedTextSize` is for the text size. The grep for one to reuse: `clamped` (`appearance.ts:181`) is a zod shape with a fallback, and `clamp` (`state/workbench/layout/model.ts:392`) sits in a layout module the words layer has no reason to import.
2. **`scaledFontPx` in `terminal-list.ts`.** The check that a step times the scale is a size was in `gridFontSize`; it is now shared by the two sizes. `gridFontSize` answers as it did: `chosen ?? terminalFontPx() ?? scaledFontPx('--fs-md', scale)`.
3. **`transcriptFontSize` does not read the config itself.** `gridFontSize` falls back on `terminalFontPx()`; its callers pass `terminalFont()`, which already holds that value, so the new function takes the store's value alone.
4. **`$derived` for `setFont`** in `TerminalFontTools.svelte`, so the buttons name the setter once.
5. **The new row sits right after `terminal.font_px`**, and the commented line of the defaults right after `font_px`, with the three words after `terminal_smaller` in the catalog.
6. **The rounding is to a hundredth in `writeTerminalSize`, after the bounds**, as the ruling says.

## Grep results the rules ask for

- History words: `git diff -U0 src config` over added comment lines, for before, used to, no longer, still, always, as before, previously, the step adds, after this: no hit. No test title was added.
- Names: `grep -rn --exclude=local.yml 'transcript_font_px\|ranscriptFont' src config docs` lists the reader (`appearance.ts:213`, the getter `:626`), the setter (`ui.svelte.ts:450`), the store's reader (`ui.svelte.ts:348`), the row (`config/options/appearance.yml:79`), the commented line (`config/defaults/appearance.yml:82`) and the views. The row's help is read from that row by the Settings view.
- Stale wording: `grep -rn --exclude=local.yml -i 'never below\|never draws below\|down to the size\|clamped to 6' src config docs` prints one line, `src/lib/state/life/present.ts:197`, about another thing.
- Words: `grep -rn 'transcript_larger\|transcript_reset\|transcript_smaller' src config` prints the three catalog lines and one literal `t('...')` each in `TerminalFontTools.svelte:37,43,49`.
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
- Settings view, terminal heading, Display and keys: a new number row `terminal.transcript_font_px`, drawn empty until set, after `terminal.font_px`. The help of `terminal.font_px` no longer speaks of the transcript.
- `docs/HELP.md:459` and the defaults comment say the new rule.

A press on a grid, by the ruling: the value written is rounded to a hundredth. A size with two decimals or fewer is unchanged by it. Before, at a text size of 0.9 with `font_px` left out, smaller wrote 10.700000000000001; after, 10.7. Before, a file value of 12.345 and smaller wrote 11.345; after, 11.35 (`node -e "console.log(12.345-1, Math.round((12.345-1)*100)/100)"` prints `11.345 11.35`).

The look at landing: on a scratch server with the transcript showing, smaller twice below 12 px, a second tab on Live with its grid unmoved, Live smaller with the transcript's zoom unchanged, and reset on each, as the brief's "The look at landing" says. Also the three button names on hover or in the accessible name on each view, and the Settings row with a value of 3 refused.

## Limitations

- A press is proved by reading and by the store's two functions; `npx vitest` does not reach the buttons, since the brief asks for no test. The look on landing proves it.
- `font_px` and the transcript key can be written by the buttons only to a hundredth, while a file or the Settings box may hold more decimals. A size held with a third decimal is used as given until the next press.
- `npm run diagrams` ran once, right before the list, and changed no tracked path (`git status --short` after it lists the paths above and nothing else).

## Anything in the brief that was wrong

- Case 12's "13.4" did not follow from the brief's rule; the ruling added the rounding and the case now holds, as case 12 above shows.
- The location `tab-session.svelte.ts:41-42` was corrected by the ruling to `src/lib/views/sessions/terminal/transcript/tab-session.svelte.ts:41-43`.
