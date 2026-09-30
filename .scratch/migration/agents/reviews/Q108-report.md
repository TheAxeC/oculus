Everything in the brief is done. Cases 9 and 10 are looks the orchestrator takes on TEST; I took no screenshot and opened no browser. The cases the brief's rules got wrong: none, every case's first run matched its stated result.

## Open items of the state file

Verbatim from the worktree's `.scratch/migration/orchestrator-state.md` (`awk 'NR>=103' ... ` up to the next `## ` heading):

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z103, the 42 shapes E2 named in the unbuilt apps design (raised 2026-09-30 19:05 at E2's landing). E2's brief (`agents/briefs/E2.md:101`) says Axel reads them at the landing and rules before any build step is booked. They are the two tables of `agents/reviews/E2-report.md`, section "Shapes named in this step": rows 1 to 17 are the brief's decisions, rows 18 to 42 shapes the builder chose because a builder of the apps needs them, each with the alternative considered. One of them touches the rule that `config/local.yml` holds a secret: row 36, a machine app may name any root the file browser shows in `open({ file })`, the root `engine` included, so it can put `config/local.yml` on screen in a source tab (it never receives the file's text; `DESIGN.md` line 313). (a) All 42 as written. For: the section stands as landed; against: an app can put the file that holds the calendar link on screen, in front of anyone watching the screen. (b) Row 36 changed to every root but `engine`, the other 41 as written; the change is one clause of `DESIGN.md` line 313 and row 36 of the report, made by the build step's `/spec` or as a fix now. For: no app can bring `config/local.yml` or any engine file into view; against: a machine app cannot open an engine file for the reader, which no ruling asked for. (c) You name the rows to change after reading the list; each change is a text fix to line numbers the report gives. Recommended (b), with (c) for anything else you want changed after reading. The lazy option is (a).

## The cases' first run on the unchanged tree

The unchanged tree is main's `zones.ts` (120 lines, `wc -l` printed 120 after the patch's removed lines were put back by hand) and main's `Jobs.svelte` (bare `<p>{t('hpc.no_jobs')}</p>` and the head comment without the added sentence), with the tests in their final form. Command: `npx vitest run tests/ui/controls/editor/zones.test.ts tests/views/system/hpc.test.ts --reporter=verbose`, which printed `Tests  6 failed | 34 passed (40)`. The changed text was put back afterwards.

| Case | Test title (file) | First run on the unchanged tree |
|---|---|---|
| 1 | keeps a bar out of sight and asks for no room while the editor holds no model (zones.test.ts) | passes; an audit of preserved behaviour, because the faithful fake's `changeViewZones` does nothing without a model |
| 2 | makes the room of a bar placed before the model once the model is set | fails: `expected [] to deeply equal [ [ 1, 28 ] ]` |
| 3 | makes the room of every bar again when the model is replaced, and takes each away with its bar | fails: `expected [] to deeply equal [ [ 1, 28 ], [ 5, 28 ] ]` (after the replacement) |
| 4 | reaches a bar with no model change once the bars are taken out of the editor | fails: `expected +0 to be 1` (`fake.subscriptions.disposed()`, main never subscribes) |
| 5 | gives a bar of no height the height of a line | passes; an audit of preserved behaviour |
| 6 | draws the empty queue line through the empty primitive, and only for an empty queue (hpc.test.ts) | fails: `expected -1 to be greater than -1` (no `class="empty"` in the body, the words are in a bare `<p>`) |
| 7 | marks the drop in the one pane whose page and path the drop names (workbench.test.ts) | old form `matchAll(/class="mark[^"]*"/g)` fails: `AssertionError: expected [ ...(4) ] to have a length of 1 but got 4`, `Tests  1 failed \| 52 skipped (53)` |
| 8 | the five kit tests | `old-*.test.ts` copies of the five files with their imports at the old depth, run with `npx vitest run` on the unchanged `kit/` sources: `Test Files  5 passed (5)`, `Tests  31 passed (31)`; the copies were removed after the run |
| 11 | keeps a bar through a null model and gives it a new zone for the next one | fails: `expected '54px' to be '-1000px'` (the bar stays at its drawn top after `model(null)`) |
| 12 | makes one zone for a bar, not one per model change, when the model changes twice before a draw | fails: `expected [] to deeply equal [ [ 1, 28 ] ]` |
| 13 | takes a bar away that holds a widget and no zone without asking the editor to remove a zone | passes; an audit of preserved behaviour |
| 14 | makes the room of a bar placed on an editor that already holds a model at once | passes; an audit of preserved behaviour |

Cases 9 and 10 are looks at landing; no first run applies.

Case 7's three runs, each with `npx vitest run tests/shell/workbench.test.ts -t "marks the drop in the one pane"` (the file is slow-tagged, so it runs by name):

1. Old form on the tree, red: `AssertionError: expected [ ...(4) ] to have a length of 1 but got 4`, `Tests  1 failed | 52 skipped (53)`.
2. New form (`/class="mark[^"]*" aria-hidden="true"/g`, with its two-line comment), green: `Tests  1 passed | 52 skipped (53)`.
3. New form with the strip's drop mark taken out of `src/lib/ui/tabs/Tabs.svelte`, red: `AssertionError: expected [] to have a length of 1 but got +0`, `Tests  1 failed | 52 skipped (53)`. The mark the rendered case reaches is the trailing one at line 269 (`{#if dropIndex !== null && dropIndex >= tabs.length}`); taking out the one at line 252 leaves the case green (`Tests  1 passed`), so the case does not reach it. `Tabs.svelte` is put back: `cmp` of the saved copy against the file printed no difference, and `grep -n 'class="mark" aria-hidden' src/lib/ui/tabs/Tabs.svelte` prints lines 252 and 269.

## DONE / NOT DONE

| Item | Status | Proof |
|---|---|---|
| 1. `zones.ts`: `room`, `onDidChangeModel` in `mount`, disposal in `unmount` | DONE | `zones.test.ts` cases 2, 3, 4, 11, 12 fail on the unchanged tree (table above) and pass after: `npx vitest run tests/ui/controls/editor ...` printed `Test Files  12 passed (12)`, `Tests  160 passed (160)` |
| 2. `zones.test.ts` with a faithful fake, cases 1 to 5 and 11 to 14, head comment names what it does not cover | DONE | same run; the fake's `changeViewZones` returns while `model === null` and its `model(next)` clears the zones, in `tests/ui/controls/editor/zones.test.ts` |
| 3. `Jobs.svelte` through `Empty`, case 6 in `hpc.test.ts` | DONE | case 6 fails on the unchanged tree, passes after |
| 4. `workbench.test.ts` drop-mark count (case 7) | DONE | three runs above |
| 5. Five kit tests in `tests/ui/controls/editor/kit/`, `colours.ts:12` and `colours.test.ts:611` name the new path (case 8) | DONE | `ls tests/ui/controls/editor/kit` prints grammars.test.ts look.test.ts paint.test.ts platform.test.ts theme.test.ts; `sh utils/folder-check.sh` exit 0; `ls tests/ui/controls/editor \| wc -l` prints 7 |
| 6. `docs/diagrams/` regenerated | DONE | `npm run diagrams` run last before the list; `grep` shows `"folder views/system to layer ui" [label="87"` (`layer-views.dot:39`) and `"views to ui" [label="577"` (`layers.dot:72`) |
| Verify 1, the list | DONE | quoted below |
| Verify 2, the four test groups | DONE | `Test Files  12 passed (12)`, `Tests  160 passed (160)` |
| Verify 3 | DONE | `folder-check exit 0`, `7` |
| Verify 4 | DONE | first-run table; moved kit tests and cases 1, 5, 13, 14 pass on both trees and are audits |
| Cases 9 and 10 | NOT DONE by me; the orchestrator's looks at landing | they are the orchestrator's by the brief |

The list, `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` after `npm run diagrams`, exit 0, with its `$` lines and result lines:

```
$ npm test
 Test Files  349 passed | 19 skipped (368)
      Tests  5329 passed | 563 skipped (5892)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790789894360 COMPLETED 2473 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 11.88s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The ASCII gate of spec.md line 88 over `src tests config` printed nothing. Over `bin` too it is the same form, but `bin` does not exist in this tree, so `find` reports `bfs: error: bin: No such file or directory` and checks the rest.

## Files with line counts (`wc -l`)

- `src/lib/ui/controls/editor/zones.ts` 142 (main: 120)
- `tests/ui/controls/editor/zones.test.ts` 255 (new)
- `tests/ui/controls/editor/kit/look.test.ts` 36, `platform.test.ts` 24, `grammars.test.ts` 46, `paint.test.ts` 314, `theme.test.ts` 188 (moved; `grammars.test.ts` has its import wrapped by Prettier)
- `src/lib/views/system/hpc/Jobs.svelte` 126
- `tests/views/system/hpc.test.ts` 429, `tests/shell/workbench.test.ts` 848
- `src/lib/ui/controls/editor/kit/colours.ts` line 12 and `tests/ui/theme/colours.test.ts` line 611: one path changed in each
- `docs/diagrams/layer-views.dot`, `layer-views.svg`, `layers.dot`, `layers.svg`: as `npm run diagrams` writes them
- removed: `tests/ui/controls/editor/look.test.ts`, `platform.test.ts`, `grammars.test.ts`, `paint.test.ts`, `theme.test.ts`

## Judgment calls

1. `zones.ts` keeps the patch's logic and differs from it in two places: `place` no longer sets `node.style.top = OUT_OF_SIGHT` because `room` sets it on every call, and the comment on `room` says what it does (no zone without a model, zones dropped with the model, widgets kept); the file head gains two lines saying the zone is made again for every model. Under cases 1 to 5 and 11 to 14 it gave the results the brief states, so nothing in it needed fixing.
2. Case 4 asserts the dispose count (`fake.subscriptions.disposed()` is 1) and that the editor holds no subscription after `unmount`, and no precondition that one is held, so the failing assertion on the unchanged tree is the dispose one, as the brief says.
3. Case 3 draws the two zones separately (`fake.draw(54, 1)`, `fake.draw(180, 5)`) so each bar is shown at its own zone's top; `draw(top, after?)` draws every zone when `after` is left out.
4. `theme.test.ts:160-178` in `colours.test.ts` line 611: the old text said `158-176`, which was already two lines short of the test; the new range is the comment at line 160 through the test's closing `});` at line 178 (`sed -n 178p` printed `    });`).
5. Case 6 draws the job case with the existing `payload` (status `ok`, one job) and asserts `<table` is present and `class="empty"` is absent, with the reason comment above the absence (`tests/checks/tree/negatives.test.ts` and `comment-width.test.ts` pass).
6. The kit tests were run on the unchanged tree from temporary `old-*.test.ts` copies of the five files at the old depth in `tests/ui/controls/editor/`, removed after the run (`ls tests/ui/controls/editor` afterwards prints chords.test.ts gutter.test.ts kit monaco-diff.ts monaco-sources.ts tab-out.test.ts zones.test.ts).

## User-visible changes, before and after (the looks read against these)

- Merge editor (Sources, Repositories, a file with conflicts opened in a tab): before, each conflict's Accept bar stays at `top: -1000px`, out of sight, because every side's `Editor` starts with `model: null` and its view zone is never made when the model comes; after, each bar is drawn above its conflict's first line in its own room, in both sides, and stays there when the file changes (model, null, next model).
- Live HPC with an empty queue and the cluster answering: before, the line "No jobs in the queue for you right now." is a bare `<p>` with no padding and the page's default colour; after, it is drawn by `Empty` as the fetching line is (10px vertical padding, muted colour, `--fs-md`; in the terminal look, a `# ` prefix and the mono `--fs-xs`).

## Things in the brief that were wrong or impossible

Nothing was impossible. One sentence of the brief did not hold as written: case 7 says to remove "the `<span class="mark" aria-hidden="true">` at the line the rendered case reaches"; the case reaches line 269, not line 252, as the two scratch runs above show (252 removed: `Tests  1 passed`; 269 removed: red).

## Limits of what passed

- Monaco itself drawing a zone and calling `onDomNodeTop` is not covered by any test; the look on TEST covers it (cases 9 and 10), and I took neither.
- The merge editor's model-change path (`Editor.svelte:281-288`) is covered only through the fake editor's `model(null)` then `model({})`, as the brief states.
