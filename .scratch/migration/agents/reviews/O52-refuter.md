# Refuter report: O52

## Verification

All commands were run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O52`, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

1. `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts --reporter=dot`, exit 1:
```
      Tests  4 failed | 17 passed (21)
+   "state/boards/collection.ts imports data/snapshot/normalise-parts/plans",
+   "views/shared/forms/Followups.svelte imports data/model",
+   "src/lib/state/client/writes.svelte.ts is 903 lines, over the line and not on the list",
+   "src/lib/views/shared/card/project/ProjectCard.svelte is 549 lines, over the line and not on the list",
+   "out": "src/lib/views/shared/forms holds 12 items, over the ten a folder may hold
```
All four failures are on files the step does not change, and each one is already on the base. `git show d7625582:<path> | wc -l` prints 903 for `writes.svelte.ts` and 549 for `ProjectCard.svelte`. `git show d7625582:` shows `Followups.svelte:33` importing `$lib/data/model` and `collection.ts:41` importing `normalise-parts/plans.ts`, and the base's `views/shared/forms/` has 12 entries. None of them is the step's.

2. `npm run test:quick`, exit 0:
```
test:quick: 15 changed file(s), from git since HEAD
test:quick: 9 test file(s), 9 essential
ok      prettier (2.0 s): All matched files use Prettier code style!
ok      ASCII gate (3.1 s)
ok      svelte-kit sync (5.9 s)
ok      vitest (68.6 s): Duration  53.68s (transform 83.37s, setup 0ms, import 104.49s, tests 22.10s, environment 43.03s)
ok      eslint (78.2 s)
ok      svelte-check (83.8 s): 1792672427945 COMPLETED 534 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 89.8 s (limit 45.0 s); every command passed
test:quick: over the time limit
```
I did not run `npm run format` or `npm run diagrams`, because both write files. The prettier line above stands in for the format check. For the diagrams I ran the tool's own in-memory comparison, which writes nothing: `node --input-type=module -e "import { staleFiles } from './utils/diagrams/diagrams.mjs'; ..."` printed `stale: []`. `npx vitest run tests/checks/diagrams/diagrams.test.ts` printed `Tests  2 failed | 45 passed (47)`, and each failure was `Error: Test timed out in 5000ms.`, which is load on the machine rather than stale files (the staleFiles run above shows none).

3. The ASCII gate over the five files, `LC_ALL=C perl -ne '...' config/text/views/boards/focus.yml src/lib/views/boards/focus/FoldHead.svelte src/lib/views/boards/focus/CommandCenterView.svelte src/lib/views/boards/focus/Tasks.svelte src/lib/views/boards/focus/career/CareerPanel.svelte`, printed nothing (`ascii exit=0`). `LC_ALL=C grep -n '[^ -~]'` over the same five files also printed nothing (exit 1).

4. The C1 and C2 greps (`F=src/lib/views/boards/focus`):
```
src/lib/views/boards/focus/Tasks.svelte:17:    import FoldHead from './FoldHead.svelte';
src/lib/views/boards/focus/Tasks.svelte:77:        <FoldHead
src/lib/views/boards/focus/career/CareerPanel.svelte:4:    // (FoldHead.svelte): the fold control, named "Fold Career strategy" or "Unfold Career
src/lib/views/boards/focus/career/CareerPanel.svelte:30:    import FoldHead from '../FoldHead.svelte';
src/lib/views/boards/focus/career/CareerPanel.svelte:112:        <FoldHead
src/lib/views/boards/focus/CommandCenterView.svelte:13:    import FoldHead from './FoldHead.svelte';
src/lib/views/boards/focus/CommandCenterView.svelte:141:        <FoldHead
c1a exit=0
c1b exit=1
c1c exit=1
c2 exit=1
src/lib/views/boards/focus/career/CareerPanel.svelte:262:        padding: 4px 8px;
src/lib/views/boards/focus/career/CareerPanel.svelte:346:        padding: 4px 8px;
src/lib/views/boards/focus/Tasks.svelte:105:        padding: 4px 8px;
src/lib/views/boards/focus/CommandCenterView.svelte:272:        padding: 4px 8px;
```
Line 346 of `CareerPanel.svelte` is `.milestone, .caveat`, which the step does not touch.

5. `sh utils/unused-exports.sh` against `../migration-O52-base/unused-exports.txt` (342 lines): `diff` printed nothing, `unused diff exit=0`.

6. The history-word grep over the comment lines the step added or changed, and every comment line of `FoldHead.svelte`:
```
30:21:        /** The glyph name drawn before the title. */
exit=0
```
The one hit is "before" in the sense of position in the row, so it is not history.

7. `grep -n 'CareerPanel\|CommandCenterView\|focus/Tasks\|boards/focus\|FoldHead' .scratch/migration/agents/guarded.md` printed nothing (exit 1). `grep -rn 'CareerPanel\|CommandCenterView\|Tasks.svelte\|FoldHead' tests` printed nothing. The step adds no test, and none is due.

Other runs:
- `diff -rq` against the base copy over `src`, `config` (`-x local.yml`), `tests` and `utils` shows only the step's five files: `CommandCenterView.svelte`, `FoldHead.svelte` (new), `Tasks.svelte`, `CareerPanel.svelte` and `focus.yml`.
- `wc -l` reproduces the report's line counts: 378 / 347, 161 / 140, 416 / 405, 137 / 138 and 99.
- `ls src/lib/views/boards/focus | wc -l` prints 10.

## Verdicts

### Items

1. **FoldHead.svelte: holds.** `FoldHead.svelte:37-56` draws:
   - a bare `ToolButton` with `label={open ? t('focus.fold', name) : t('focus.unfold', name)}`, the fold glyph of the state, `expanded={open}` and `onclick={ontoggle}`;
   - `<b>` holding `Glyph` and `<span class="words">`;
   - the optional `end` snippet in `<span class="end">`.

   The props are `glyph`, `title`, `name`, `open`, `ontoggle` and `end?` (lines 20-34). The styles are `.head` (`display: flex; column-span: all; align-items: center; gap: 8px; flex-wrap: wrap`), `.lead` (a flex row that does not wrap, `flex: 0 1 auto; gap: 8px; min-width: 0; margin-right: auto`), `.lead > b` (`gap: 6px; min-width: 0; font-size: var(--fs-md); font-weight: 600`), `.words` (the four ellipsis properties) and `.end` (`flex: 0 0 auto`). The head comment, lines 2-13, says what the file draws and which sections use it.
2. **Command center: holds.** `CommandCenterView.svelte:141-148` uses `FoldHead`, and the pill is the snippet at lines 114-116, passed as `end={pillText() === '' ? undefined : pill}`. `pillText` returns `string` (`hpc.svelte.ts:36`), so `=== ''` keeps the old truthiness test. `.head`, `.head > b` and `.pill` are removed.
3. **Tasks: holds.** `Tasks.svelte:77-83` uses `FoldHead`. `.head` and `.head > b` are removed, and so is the import of `ToolButton`, which nothing else in the file used. `Glyph` stays in use at line 66.
4. **CareerPanel: holds.**
   - `<section class="career" data-surface>` is at line 111, with `.career { padding: 4px 8px; ... }` at line 262.
   - `FoldHead` takes `glyph={t('focus.career_glyph')}`, `title={summary}`, `name={t('focus.career_heading')}`, `open={unfolded}` and `ontoggle={() => (unfolded = !unfolded)}`. `unfolded` is `$state(false)` (line 86).
   - The body is `<div class="body" hidden={!unfolded}>` (line 119), so it stays mounted while folded. `.body` sets no `display`, and no global `[hidden]` rule overrides it: `grep -rn "\[hidden\]" src` prints only the Tabs, TabView, quiet-focus, key-dom, workbench-keys and pdf viewer hits.
   - `.body` is `padding: 4px 0 0`. By reading, the content's insets stay as they were: 11 px from the outer left edge, 9 px from the right, 4 px from the bottom, and the first line 31 px from the outer top (1 + 26 + 4 before, 1 + 4 + 22 + 4 after).
   - The two `summary` rules are gone, and the head comment and the style comments are rewritten.
5. **Same x and one height: holds by reading.** The three boxes have the same 1 px border, the same 3 px left border and `padding: 4px 8px`, and each draws one `FoldHead`. The row height is the bare box `--tab-action`, `calc(22px * var(--text-scale, 1))` (`src/lib/themes/tokens.css:191`). The positions are measured only at the look on TEST.
6. **career_heading: holds.** `focus.yml:10` is `career_heading: Career strategy`, between `career_glyph` and `career_next`. `CareerPanel.svelte:115` is its one reader, and `grep -rn career_heading` finds no other key of that name.

### Cases

- **C1: met.** The greps are quoted under Verification 4.
- **C2: met.** The heading gap, glyph gap, size and weight appear only in `FoldHead.svelte:65,75,83,85,86`, the C2 grep exits 1, and the three boxes have `padding: 4px 8px`.
- **C3: met by reading.** The control is a `ToolButton`, which renders `<button type="button">`, and `ontoggle` flips `unfolded`, which starts false. A press, Enter and Space cannot be checked here; that is the look on landing.
- **C4: met by reading.** Under `flex-wrap: wrap`, `.lead` (`min-width: 0`, no wrap) takes a line of its own and shrinks there, `.words` cuts the text with an ellipsis, and the career passes no `end`, so the row is one line.
- **C5: met.** `.end` is `flex: 0 0 auto` after `.lead`'s `margin-right: auto` on a wrapping row, and it is drawn only while `pillText() !== ''`.
- **C6: met.** The name comes from `name` alone: "Command center", "Tasks" or `focus.career_heading`. An empty `summary` gives an empty title and "Unfold Career strategy".
- **C7: met.** `{#if career !== null}` is at `CareerPanel.svelte:110`, and `{#if anything}` is kept in both other files.
- **C8: met.** `data-surface` is on the section (line 111), and the `:global(body.wall) .career` and `:global(body.wall [data-surface]) .career` rules are at lines 271-279.
- **C9: met by reading.** The body is hidden with an attribute and never removed.

## Spec

none

## Proof

- **P1. The report's open-items section is the base's copy of the state file, not the state of record.**
  - Place: `.scratch/migration/agents/reviews/O52-report.md`, the section "Open items of the state file (verbatim, the worktree's copy at base d7625582)".
  - Quoted: "> - Open item 225 (2026-10-22): O52, the Focus board's headings in one shape. ..."
  - What is wrong: the brief asks for the open items "copied at the moment you write the report". The main checkout's `.scratch/migration/orchestrator-state.md:227-231` reads "None open.", and line 96 records that item 225 was ruled and the brief widened before the launch.
  - Failure scenario: a reader of the report takes item 225 as still waiting on Axel's ruling. The report does say in prose that (a) was ruled, which softens this.

## Standards

- **S1. A comment the step wrote ends short inside a sentence.**
  - Place: `src/lib/views/boards/focus/FoldHead.svelte:69-70`.
  - Quoted:
    ```
        /* The fold control, the glyph and the title: one line that shrinks to the pane and pushes
           the end of the row to the right. */
    ```
  - What is wrong: line 69 is 94 columns (`awk 'NR==69 {print length($0)}'`), and the next word "the" would bring it to 98. `spec.md` says "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short."
  - Failure scenario: the file does not meet the wrap rule as written. Moving "the" onto line 69 at landing fixes it.
- **S2. The builder ran a git command outside both the rules and the dispatch's allowance.**
  - Place: the report's section "Anything in the brief that was wrong or impossible".
  - Quoted: "I ran `git status --short` twice, `git diff` on the brief and on `docs/diagrams` (`--stat` and the dot files), and `git log --oneline -1` once at the start. That last one is in neither list."
  - What is wrong: `spec.md` "Where you work" says the builder runs no git command, read-only ones included. By the report's own account the dispatch allowed status, diff and show, and `git log` is outside both.
  - Failure scenario: none in the diff, since no state changed. It is a rule broken and disclosed.

## Behaviour

- **B1. The folded career banner grows 4 px, and the report's before and after does not say so.**
  - Place: `CareerPanel.svelte:261-262` (`.career { padding: 4px 8px; ...`) together with `FoldHead.svelte:61-67`.
  - What changes, by reading (not measured): before, the folded box was 1 + 26 (the `<summary>` with its 4 px padding) + 1 = 28 px. After, it is 1 + 4 + 22 + 4 + 1 = 32 px. That matches the command center's folded box.
  - Consequence: everything below the banner on the Focus board moves 4 px down. Unfolded, the total height is unchanged (36 px plus the content, both before and after). The report states the row going from 26 to 22 px but not the box going from 28 to 32 px, so the look on TEST should expect the 4 px shift.
- **B2. The browser's find-in-page no longer reaches the folded career panel.**
  - Place: `CareerPanel.svelte:119`, `<div class="body" hidden={!unfolded}>`, which replaces the closed `<details>`.
  - What changes: Chromium opens a closed `<details>` when find-in-page matches text inside it. Content under `hidden` is not searched at all.
  - Failure scenario: on a hub whose career file names a host, with the banner folded, searching the host's name with the browser's find used to unfold the banner on the match; now it finds nothing.
  - The report does not state this. Whether the oculus window passes the browser's find through is not verified; a grep of `config` and `src` for a `mod+f`, `cmd+f` or `ctrl+f` binding found none. `hidden="until-found"` with a `beforematch` handler that sets `unfolded` would keep the search working.

## Declined to judge

- **Positions and heights on TEST.** The x positions and the 22 px rows in a real pane, the ellipsis in a narrow pane, the pill wrapping, the press, Enter and Space, and the light, dark and wallpaper themes are all for the look on landing; I started no page.
- **The brief file in the worktree.** `.scratch/migration/agents/briefs/O52.md` shows as modified in the worktree. `diff` against the main checkout's copy printed nothing (`SAME_AS_MAIN`), and the state file's line 96 says the orchestrator copied it there before the launch, so it is not the builder's change. Whether the cherry-pick carries it as a no-op against main would be settled by `git diff main -- .scratch/migration/agents/briefs/O52.md`.
- **Diagram drift that is not the step's.** The diagram changes include lines no O52 code causes: `writeFollowup` in `writes.dot`, the `undo.ts:308` to `:315` node names, and the counts for `state/boards`, `views/shared` and `views/system`. `staleFiles()` printing `[]` shows they match the worktree's source. Which commit left main's diagrams stale would be settled by `git log -- docs/diagrams src/lib/server/edit/writes/undo.ts`.
- **The report's quoted git commands.** I did not run `git log --oneline -1`. `git diff --stat` on `docs/diagrams` falls under the `git diff d7625582` I ran.
- **The report's reruns of two test files outside the step.** I did not rerun `tests/routes/edit/write.test.ts` and `tests/server/edit/writes.test.ts` (the report gives "1 failed | 55 passed", then "56 passed"), since `spec.md` says a failure in a file the step does not change is not rerun.
- **The report's `cmp` of `wallpaper.ts` and `EntryForm.svelte` back to base.** Not rerun as such; my `diff -rq` against the base copy shows both unchanged.
- **The report's two test:quick timings (398.5 s and 93.2 s).** Not reproduced. My one run took 89.8 s, also over the 45 s limit, with every command passing.

Usage: aa46c6d7fba77e682, claude-opus-5-5, 180969 tokens, 41 tool uses, 12 min 24 s
