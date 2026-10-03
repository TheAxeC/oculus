# Brief: T1d, the test sweep of `tests/views/`, `tests/shell/`, `tests/ui/` and `tests/themes/`

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged, its test rule at `:57` above all, with its last three sentences (a test runs in well under a second or is tagged slow; a behaviour is tested at the lowest level that reaches the defect, a pure function before a rendered view, and a view is rendered in a test only for what no function below it decides; a behaviour is tested once there, a higher-level test existing only for the wiring, one case per wire), `:61` (a behaviour that needs a DOM is seen at the look; an assertion over source text, over a label alone or over a constant proves nothing and is not written), `:64` (a test waits on a signal, never on a fixed sleep or a wall-clock margin) and `:65` (an effect's timing is tested in a `*.client.test.ts` file). The configuration lists no other standards page, and no ADR touches this step.

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

## What is on the tree (read on main at 1e14d279)

- The step line, `plan.md:227`, rests on the rulings Z350, Z351, Z354, Z363, Z365 and Z367, each a line of `plan.md`'s Rulings ending "(the user).". Z363: the sweep may cut harder than one test per behaviour. Z367: four sweeps run side by side; T1a (the tiers) follows all four.
- The step line's counts were read before X3c landed. The four folders now hold 194 test files and 51,995 lines in all `.ts` files (`find tests/views tests/shell tests/ui tests/themes -name '*.test.ts' | wc -l`; the same with `-name '*.ts' -exec cat {} + | wc -l`); corrected in `plan.md` at this /spec. By folder (test files / lines): views 109 / 34,946; shell 32 / 7,447; ui 52 / 9,470; themes 1 / 132. Subfolders: views/academic 5 / 1,181, boards 12 / 4,894, feeds 4 / 1,950, personal 4 / 994, sessions 9 / 3,655, shared 18 / 2,360, sources 35 / 12,995, structure 6 / 1,515, system 12 / 4,131, whole 4 / 1,271; shell/commands 1 / 78, fixtures 0 / 18, keys 8 / 2,330, panes 17 / 3,102, rail 3 / 651, status 1 / 297; ui/controls 19 / 3,548, display 3 / 326, forms 6 / 549, frame 7 / 966, menu 6 / 590, tabs 2 / 209, theme 3 / 1,310, tree 4 / 918. Files directly in a top folder: `shell/context-guard.test.ts`, `shell/workbench.test.ts`, `ui/html.test.ts`, `ui/primitives.test.ts`, `themes/derive.test.ts`. Ten of the test files are `*.client.test.ts`.
- Four files carry the slow tag as `// @module-tag slow: <reason>`, each with the reason "its cases time out or fail on a loaded machine": `shell/workbench.test.ts`, `ui/controls/editor/kit/theme.test.ts`, `ui/theme/colours.test.ts`, `views/whole/chips.test.ts` (`grep -rl "@module-tag slow" tests/views tests/shell tests/ui tests/themes`). No test there uses a per-test or describe tag (`grep -rn "{ tags: \[" ...` prints nothing).
- 468 tests are titled as audits (`grep -rn "it('audits\|it(\"audits" tests/views tests/shell tests/ui tests/themes | wc -l`), the most in `views/sources/repositories/menus/repositories-menu.test.ts` (36), `views/sessions/terminal-menu.test.ts` (31), `views/sources/files/menu/files-menu.test.ts` (30), `views/sessions/terminal.test.ts` (29), `views/sources/files/menu/row-actions.test.ts` (26), `views/shared/commands/commands-menu.test.ts` (18), `views/sources/files/sections/sections.test.ts` (16).
- 47 files read the text of a file under `src/` (`grep -rl "readFileSync\|existsSync" <folders> | xargs grep -l "src/lib\|'src/\|\"src/" | wc -l`), among them `views/personal/memories.test.ts:221` (the source of `Memories.svelte`), `views/personal/calendar.test.ts:226-296` (the style rules of `Calendar.svelte`, and `existsSync` of a deleted partial), and the tree-wide checks of `views/whole/` (`tinted.test.ts`, `chips.test.ts`, `type-scale.test.ts`, `sanitise.test.ts`), which read every view's source and fail on a view that breaks a rule of how it draws.
- No test in these folders starts a process or opens a socket (`grep -rln "spawn\|execFile\|execSync\|createServer\|\.listen(" ...` prints nothing); one arms a timer of 1 ms or more, `ui/controls/editor/kit/paint.test.ts` (`grep -rln "setTimeout([^,]*, *[1-9]" ...`). `shell/workbench.test.ts` imports every view inside one case under the 5 s timeout (`orchestrator-state.md`, "Verification, every package").
- The largest files: `views/boards/projects.test.ts` 888, `shell/workbench.test.ts` 874, `views/sessions/terminal.test.ts` 866, `ui/primitives.test.ts` 852, `views/sources/repositories/repositories.test.ts` 845, `views/sources/source.test.ts` 791. A `.ts` file may not pass 900 lines (`tests/checks/tree/size.test.ts:28`).
- A folder may hold at most 10 items (`tests/checks/tree/`). At 10 now: `tests/views`, `tests/ui`, `views/sessions`, `views/boards`, `views/sources`, `views/sources/repositories`, `views/sources/files`, `shell/panes`, `ui/frame`, `ui/menu`. A fold that adds a file to one of them breaks the rule.
- Vitest is 4.1.11; the tag `slow` is declared in `vite.config.ts:35`. On `it` the tag is `it('name', { tags: ['slow'], timeout: 5000 }, fn)`; `describe(name, { tags: ['slow'] }, fn)` tags every test inside; `it.each(rows)('name %s', { tags: ['slow'] }, fn)` loses the `%s` from its titles, so a slow table takes its tag on its describe (probed for T1c on main).
- Helper modules here imported from other test folders (`grep -rn "from '\.[./]*/\(views\|shell\|ui\|themes\)/" tests` outside these folders): `ui/controls/editor/monaco-diff.ts` (by `tests/server/git/diff-patch.test.ts` and two files of `tests/state`), `views/system/workbench/workbench-fixture.ts`, `shell/fixtures/Alpha.svelte`, `shell/rail/rail-fixture.ts`, `shell/rail/shipped-rail.ts`, `views/shared/real-text.ts` (two files of `tests/state`), `ui/menu/GroupContexts.svelte` (by `tests/fixtures/client.ts`).
- Comments outside these folders name a file in them: 41 in `tests/state`, 13 in `tests/checks`, 6 in `tests/server`, 3 in `tests/data`, 1 in `tests/routes`, and 7 in `src/lib` (`ui/html.ts:24`, `ui/tabs/TabFace.svelte:70`, `ui/controls/editor/kit/colours.ts:12`, `state/shared/words/tones.ts:5`, `state/system/deposit.svelte.ts:134`, `state/sessions/changes.svelte.ts:62`, `state/sessions/transcript.svelte.ts:225`) (`grep -rn "tests/\(views\|shell\|ui\|themes\)/" src tests --include='*.ts' --include='*.svelte'`, outside the four folders).
- `tests/checks/tree/allow-duplication.txt` (128 lines): the entries naming a file of these folders are lines 64, 70-74, 76, 77, 79, 85-87, 89-100, 103, 104, 111-128 (`grep -n "tests/\(views\|shell\|ui\|themes\)/" tests/checks/tree/allow-duplication.txt`). Some of them pair a `tests/state` file, which T1b's sweep may also make stale. `duplication.test.ts` fails on an entry whose clone is no longer shared (`:597-606`) and on a new clone among `tests/` (`:304`).
- Sentences that describe the slow tier only by its file form: `vite.config.ts:31-35`, `README.md:15`, `HELP.md:342`, `agents/spec.md:56`; T1c's report proposes their rewrite.
- The steps in flight: T1c writes `tests/server/` and lines 37-63 of `allow-duplication.txt`; T1b, being prepared, writes `tests/state/` and lines 30 and 65-110 of it.
- No ADR folder exists (`ls tools/oculus/docs` prints `diagrams` alone), so no ADR touches the step.

## What to build

The sweep reads every file under `tools/oculus/tests/views/`, `tests/shell/`, `tests/ui/` and `tests/themes/`, slow-tagged files included, test by test, and applies the rules below.

1. **Delete** each test that breaks `agents/spec.md:57` or `:61`:
   - a test of behaviour whose failure costs nothing, the costs being the rule's list: lost or corrupted work, a write to the wrong file, a broken start or install, a wrong configuration or input accepted, or a view, key or command the user relies on that stops working;
   - a test of a constant, a label or catalog string, stylesheet text, a type, a pass-through or re-export, or markup the look covers (a rule between menu groups, a class, a colour, a size);
   - an assertion over one component's source text (`spec.md:61`): which calls, names or style rules it holds, or that a deleted file stays deleted;
   - a test that cannot fail on its own fixture, or that still passes with its behaviour taken out, judged by reading what the code does on that path;
   - a test whose outcome another case already gives through the same branch of the code (Z363): the case at the lowest level that reaches the branch stays (a pure function before a rendered view), and among cases at one level the one that reaches the most of the branch;
   - a rendered-view test of a behaviour a function below the view decides and a test of `tests/state/` or `tests/data/` already holds, unless it is the one case of the wiring between the two.
2. **Fold** cases of one outcome that differ only in their input into rows of one table, one test per outcome. Each row has a short name as its first column, and the table's title prints that name, so the verbose output names every row in full.
3. **Tag** each test that cannot run well under a second as slow, by its cause and by its time (Decision 1): the whole file with `// @module-tag slow: <reason>` as the last line of the head comment when every test left in it is slow; otherwise a slow describe with `describe(name, { tags: ['slow'] }, fn)`, and a slow single test with `{ tags: ['slow'] }` as its second argument, a numeric timeout moving into that object as `timeout`. A slow table takes its tag on its describe. A cold-start cost that one test pays for the rest of the file (an import of every view, the editor kit) moves into a `beforeAll`. A file already tagged whose tests are all quick after the sweep loses the tag, and a file tagged for "time out or fail on a loaded machine" is re-measured under Decision 1 and keeps the tag only where it holds.
4. **Keep** every other test. No assertion of a kept test is loosened, widened or rewritten except to fold it into a table under item 2. A kept test's title is corrected when it is false, and the word "audits" leaves the title of a kept test. A kept test's setup may lose what the test does not use, its assertions unchanged. A wall-clock margin in a kept test breaks `spec.md:64`: the wait moves to a signal or a fake clock. A file the sweep changes keeps main's formatting and comment wrapping on every line no item changes.
5. **Comments and helpers.** Every comment in these folders that names a deleted or renamed test is corrected, in the files the sweep changes and in those it does not, and each file it changes has its head comment say once what the file tests after the sweep, opening with its layer label (`spec.md:49`). A `// Revert:` comment that names a change the test does not catch is corrected or deleted with its test. A file left with no test is deleted, and a describe or a `beforeAll` left with no test is deleted. A helper module imported from outside these folders keeps every export (Decision 2); a helper nothing imports any more is deleted (a `.svelte` probe or harness included).
6. **The duplication allow list.** Each entry of `tests/checks/tree/allow-duplication.txt` at the lines listed above that the sweep makes stale (its clone no longer shared) is removed; a fold that makes a new clone among `tests/` is changed until `duplication.test.ts` passes, never listed.
7. **The report** (path below) lists every test deleted, folded, retitled or tagged, file by file. Each removal names the behaviour it guarded and the kept test that still holds it, or why it guarded none. Each fold lists the old case titles against the table's rows. Each test tagged by time gives its five times (Decision 1). The report gives the line count and test-file count of each subfolder before and after, the time of `npx vitest run tests/views tests/shell tests/ui tests/themes --tagsFilter '!slow'` before any change and after the last, with the load average beside each, and a section "Doc text" (below).
8. **Doc text.** Every sentence outside the step's paths that the sweep makes false, with the line as `grep -n` prints it and its replacement, which the orchestrator applies at landing: the comments outside these folders that name a deleted test file, the seven source comments of `src/lib` listed above that name a test, and any sentence on the slow tier's form that T1c's proposal leaves false.

## Cases

Read on the unchanged tree; the builder's first task is to reread each and confirm the verdict or hand it back.

- `views/personal/memories.test.ts:202`: an answer naming one picture twice is read as a failed read with `image_name_repeated`; a wall drawing one tile for two files would hide a picture. Verdict: keep, retitled without "audits".
- `views/personal/memories.test.ts:222-281` ("the wall as it is written"): every case asserts strings of `Memories.svelte`'s source (`writes: { addMemory }`, no `fetch(`, `column-width:`, `refused.push(`, the index of `tooLarge(` before `await encoded(`, `box?.querySelector(`). Verdict: delete each (`spec.md:61`); the case at `:251` that renders the view with a failed read is kept.
- `views/personal/calendar.test.ts:225`, `:248`, `:277`: assertions over the style rules of `Calendar.svelte`. Verdict: delete (stylesheet text; the look covers them). `:296` asserts that `Agenda.svelte` does not exist. Verdict: delete (nothing a user relies on).
- `views/sources/repositories/menus/repositories-menu.test.ts:80`: the items each row group offers; a missing Stage or Discard is a command the user relies on. Verdict: keep, retitled. `:107`: no Discard or Ignore while a write is in flight, which keeps a second write off the repository. Verdict: keep, retitled. `:124`: a rule between the groups. Verdict: delete (markup the look covers). `:130` (Compare with Workspace on a linked worktree only) and `:147` (no menu on the merge group, so no stage or discard is offered on a conflict): keep, retitled.
- `views/whole/tinted.test.ts` and the other tree-wide checks of `views/whole/`: they read every view's source and fail when a view draws text straight onto a wallpaper without asking for the tint, or breaks another drawing rule the look cannot sweep across every view. Verdict: kept as checks (Decision 5); their own cases of the source parse (`tinted.test.ts:340-400`, titled as audits) are judged under items 1 and 2, cases of one outcome folded, and each kept one retitled without "audits".
- `shell/workbench.test.ts`: tagged slow as a file because one case imports every view under the 5 s timeout. Verdict: the import moves into a `beforeAll` (item 3), and each test is re-measured under Decision 1; the file keeps its file tag only if every test left is slow.
- A helper imported from outside these folders, such as `ui/controls/editor/monaco-diff.ts` (imported by `tests/server/git/diff-patch.test.ts` and two files of `tests/state`): every export kept.
- A deletion that makes an entry of `allow-duplication.txt` stale: the entry removed, `npm run test:checks` green.
- A fold of several cases into a table: the report lists each old title against its row, each row's expectation the one the deleted case asserted, the verbose run prints each row's name, and the table's run passes.

The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted: each verdict checked by reading the test and the code it reaches. This is a judgment step over tests: no new test is written for it, and no prototype script stands in for the reading. When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any file, and hands back the first run and that case, with the rule and the result it gives.

## Paths this step writes

- `tools/oculus/tests/views/` (every file under it, files deleted included)
- `tools/oculus/tests/shell/` (every file under it, files deleted included)
- `tools/oculus/tests/ui/` (every file under it, files deleted included)
- `tools/oculus/tests/themes/` (every file under it, files deleted included)
- `tools/oculus/tests/checks/tree/allow-duplication.txt` lines 64, 70-74, 76, 77, 79, 85-87, 89-100, 103, 104, 111-128 (the entries that name a file of these folders)
- `tools/oculus/.scratch/migration/agents/reviews/T1d-report.md`, written in the worktree's copy of the ledger

The step writes these paths and nothing else. T1b (`tests/state/`), T1c (`tests/server/`) and T1e (`tests/routes/`, `tests/data/`, `tests/checks/`, `tests/fixtures/`) sweep the other folders; a sentence of theirs or of `src/` that the sweep makes false goes into the report's "Doc text". A helper of `tests/fixtures/` that the sweep leaves unused is named in the report for T1e, not deleted.

## Decisions taken in this brief (each reversible, none silent)

1. **Slow, by cause and by time.** A test is slow when it starts a real process, awaits a real timer of 1 ms or more, or opens a socket, in its body, in a hook it runs under, or at the load of its module; a zero-delay yield (`setTimeout(0)`, `setImmediate`, a resolved promise) is no timer. Any other test is slow when the minimum of its times over five verbose runs of its own file (`npx vitest run <file> --reporter=verbose`) is 100 ms or more; the report gives the five times and the load average of each run. The minimum is used because load only ever adds time.
2. **Shared helpers.** A helper module here that a file outside these folders imports keeps every export, so the other sweeps' files still compile; only a helper nothing anywhere imports is deleted.
3. **Per-test and describe tags.** The test and describe forms are used where a file mixes quick and slow tests, so its quick tests stay in `npm test`; a head comment states the file's tagging rule once.
4. **Rendered views.** A test that renders a view stays only for what no function below the view decides (what the view draws from its state, a refusal sentence it chooses, the wiring of a press to its call, one case per wire); a rendered test of an outcome a state or data function decides goes when that function's own test holds it.
5. **Tree-wide checks stay.** A check of `views/whole/` that reads the source of every view and fails on a view that breaks a drawing rule (text on a wallpaper with no tint, a type size outside the scale, unsanitised HTML) guards a defect a user sees in a view the look may never open; `spec.md:61` is about testing one behaviour by its own source text. Its parse cases are judged under items 1 and 2.

## Libraries checked

No new dependency: the step changes tests only, with the test runner the tree has.

The builder adds no dependency this brief does not name. A library the builder finds that would cover its work is reported, not installed.

## Read, with sections or line ranges

1. `tools/oculus/.scratch/migration/agents/spec.md` whole, `:49` and `:56-66` above all: the layer label and the test rule the sweep applies.
2. Every file under the four folders, and for each test the `src/` code it reaches, as far as needed to judge items 1 to 4.
3. `tools/oculus/vite.config.ts:30-70`: the projects (the `client` project for `*.client.test.ts`) and the declared tag.
4. `tools/oculus/tests/checks/tree/duplication.test.ts` and `allow-duplication.txt`: how a stale or a new clone fails.

## What it must do

- Read every file, one at a time; never delete by a pattern over names, and never by the word "audits" alone.
- Never read, open, grep or hash `tools/oculus/config/local.yml`; every grep over `config/` uses `--exclude=local.yml`. Never touch ports 8787 or 8790.
- Every test that touches a temporary folder keeps doing so under the system temporary folder, as it does today.

## Conventions

The rules file's conventions: ASCII only, one line per Markdown paragraph, comments that say what and why with no history (no step id, no date, no "was"), no comment naming a deleted test. Prettier and eslint pass on every changed file.

## Verify before you report

Run from the worktree's `tools/oculus`, each must hold:

1. The plan's verify list, run once after the last change, with `npm run diagrams` before it, through the `land` skill's `templates/checks.sh` from the root of the checkout it checks, as `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, prints `$ <command>` and the output of each command, then `checks: 7 commands passed`, and exits 0; the lines it prints are what the report quotes. While working, run only the files you change (`npx vitest run <file>`), as `spec.md:25` says.
2. Each file the sweep changed that holds a slow tag, run alone with `npx vitest run <file> --tagsFilter slow`, passes.
3. Each file the sweep changed, run with `npx vitest run <file> --tagsFilter '!slow' --reporter=verbose`, holds no quick test with a cause of Decision 1 and no quick test whose minimum over its five runs is 100 ms or more; the report quotes the slowest line of each with the load average.
4. `grep -rn "it('audits\|it(\"audits" tests/views tests/shell tests/ui tests/themes` prints nothing.
5. Every fold's table run passes after the change, and the report quotes the run and its title-to-row list.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/T1d-report.md` in the worktree's copy of the ledger. First line: anything NOT done, or "Everything in the brief is done". Then the open items of the state file, verbatim, which hold only what the user must rule on. Then the cases' first run: each case of "Cases" with its verdict on the unchanged tree, and each case the brief's rules got wrong with the rule, the result and the orchestrator's ruling. Then the DONE / NOT DONE table with the checks above and their output verbatim, the number of full-list runs, the line and file counts per subfolder before and after, and the two timings with their load averages. Then the removals, folds, retitles and tags file by file (item 7). Then "Doc text" (item 8). Then every judgment call the brief left open, and anything in the brief that was wrong or impossible, with the evidence.
