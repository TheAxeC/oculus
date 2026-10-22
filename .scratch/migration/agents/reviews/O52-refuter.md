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

## Repair round 1, refuted

All commands below were run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O52`, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. No ADR folder exists (`docs/adr` is absent per the brief); no ADR touches the step.

### Verification lines

1. `npm run test:quick`, exit 0:
```
test:quick: 16 changed file(s), from git since HEAD
test:quick: 9 test file(s), 9 essential
ok      prettier (31.6 s): All matched files use Prettier code style!
ok      ASCII gate (35.8 s)
ok      svelte-kit sync (51.1 s)
ok      vitest (63.6 s): Duration  39.71s (transform 61.42s, setup 0ms, import 77.61s, tests 24.03s, environment 32.56s)
ok      eslint (66.4 s)
ok      svelte-check (68.6 s): 1792678614950 COMPLETED 534 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 120.0 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
```
2. The ASCII gate of `spec.md` over `config/text/views/boards/focus.yml`, `FoldHead.svelte`, `CommandCenterView.svelte`, `Tasks.svelte` and `career/CareerPanel.svelte` printed nothing: `ascii exit=0`. `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O52-report.md` printed nothing.
3. C1 and C2 greps (`F=src/lib/views/boards/focus`):
```
src/lib/views/boards/focus/career/CareerPanel.svelte:113:        <FoldHead
src/lib/views/boards/focus/CommandCenterView.svelte:141:        <FoldHead
src/lib/views/boards/focus/Tasks.svelte:77:        <FoldHead
c1a exit=0
c1b exit=1
c1c exit=1
c2 exit=1
```
4. The report's evidence, rerun:
- `grep -n "beforematch" node_modules/svelte/elements.d.ts`:
```
451:<tab>'on:beforematch'?: EventHandler<Event, T> | undefined | null;
452:<tab>onbeforematch?: EventHandler<Event, T> | undefined | null;
453:<tab>onbeforematchcapture?: EventHandler<Event, T> | undefined | null;
```
  `grep -n "until-found" node_modules/svelte/elements.d.ts`: `772:<tab>hidden?: boolean | 'until-found' | '' | undefined | null;`. `node_modules/svelte/package.json`: `"version": "5.57.1"`. The report's claim reproduces.
- `compile(src, { generate: 'client' })` of `CareerPanel.svelte`, lines matching `beforematch|'hidden'`:
```
$.template_effect(() => $.set_attribute(div, 'hidden', $.get(unfolded) ? false : 'until-found'));
$.event('beforematch', div, () => $.set(unfolded, true));
```
  The server compile gives ``$$renderer.push(`<!----> <div class="body svelte-wccrs8"${$.attr('hidden', unfolded ? false : 'until-found')}>`);``, and `warnings []`. The listener claim reproduces.
- `node_modules/svelte/src/internal/client/dom/elements/attributes.js` around lines 181-195: `if (attributes[attribute] === (attributes[attribute] = value)) return;`, then `value == null` gives `removeAttribute`, a non-string value with a setter gives `element[attribute] = value`, and otherwise `setAttribute`. `'until-found'` goes through `setAttribute`, and `false` goes through the `hidden` property, which removes the attribute. The report's reading reproduces.
- `awk` widths of `FoldHead.svelte:69-70`: `69: 98`, `70: 38`. Reproduces.
- The history-word grep over `CareerPanel.svelte:18-23` hits only line 21 (`beforematch`, an event name). Over `FoldHead.svelte:69-70` it prints nothing (exit 1). Reproduces.
- The `cmp` of `src/lib/server/content/wallpaper.ts` and `EntryForm.svelte` against the base copy printed `wallpaper-same` and `entryform-same`. `git status --short` lists neither.
- `wc -l`: `CareerPanel.svelte` 410 and `FoldHead.svelte` 99. Reproduces.
- `.scratch/migration/agents/guarded.md:3`: "Views have no entry: the look on TEST covers them." Reproduces.
- WebFetch of https://developer.chrome.com/docs/css-ui/hidden-until-found: the four sentences the report quotes are on the page. The same page also says "`hidden=until-found` element itself will still have a box." and "CSS properties such as border and explicit size will still affect the rendering." (see B1 below).

The round delta, from `diff -u` of each `files.txt` path in the snapshot against the worktree: only `career/CareerPanel.svelte` (the head comment's last paragraph at lines 18-23, and the body `div` at lines 120-124) and `FoldHead.svelte:69-70` changed. The other eleven paths printed exit 0. `git status --short` lists no changed path outside `files.txt` except `.scratch/migration/agents/briefs/O52.md` (`diff` against the main checkout's copy printed `SAME_AS_MAIN`), the untracked `briefs/O52-round1.md` (same as main) and the untracked `reviews/O52-report.md`.

### Verdicts, step brief, whole diff since the base

- Item 1, `FoldHead.svelte`: holds. Lines 37-56 hold the markup and lines 58-98 the geometry, including `.words` with the four ellipsis properties and `.end` with `flex: 0 0 auto`. The head comment is at lines 2-13.
- Item 2, the command center: holds (`CommandCenterView.svelte:114-116` and `:141-148`; `.head`, `.head > b` and `.pill` are removed).
- Item 3, Tasks: holds (`Tasks.svelte:77-83`; `.head` and `.head > b` are removed).
- Item 4, the career banner: holds. It is `<section class="career" data-surface>` at line 112 with `padding: 4px 8px` and `FoldHead` first, the body is mounted and hidden, and the `summary` rules are gone. The folded box now differs from the command center's: see Behaviour B1.
- Item 5, same x and one row height: holds by reading for the row (22 px) and the x positions. The folded career box's total height does not match the command center's (Behaviour B1).
- Item 6, `focus.career_heading`: holds (`focus.yml:10`, read at `CareerPanel.svelte:116`).
- C1: met (greps above).
- C2: met (the C2 grep exits 1, and the three boxes carry `padding: 4px 8px`).
- C3: met by reading. The proof is the look on landing.
- C4: met by reading for the row. The proof is the look on landing.
- C5: met by reading.
- C6: met by reading.
- C7: met (`CareerPanel.svelte:111`, `{#if career !== null}`).
- C8: met (`data-surface` at line 112, `body.wall` rules at 276 and 281).
- C9: met by reading. The body stays mounted under `hidden="until-found"`.

### Verdicts, round brief

- Item 1, B2: holds. The body carries `hidden={unfolded ? false : 'until-found'}` and `onbeforematch={() => (unfolded = true)}`. The compiled output adds a real `beforematch` listener and sets the attribute to `until-found` while folded, on the server and the client. There is no cast, and svelte-check reports 0 errors. The round brief's premise that the element types do not list `beforematch` is false (`elements.d.ts:452`), so the typed attribute meets the requirement the attachment or action was named for: a real listener and no cast hiding a type error. The change introduces Behaviour B1.
- Item 2, S1: holds (`FoldHead.svelte:69-70`, 98 and 38 columns).
- Item 3, B1: violated (Proof P1, Behaviour B1). The 32 px "after" figure the report states is false under item 1's `hidden="until-found"`.
- Case 1 (C9 read again): met by reading.
- Case 2 (a find in the folded panel): met by reading for the listener. The proof is the look on landing. No test is due (`guarded.md:3`).
- Case 3 (fold again): met by reading. Svelte's cached value is `false` after an unfold, so the fold sets `'until-found'` again.

### 1. Spec

none

### 2. Proof

- **P1. The report's B1 height figures are false after the round's own B2 change.**
  - Place: `.scratch/migration/agents/reviews/O52-report.md`, "### B1: the folded career box's height".
  - Quoted: "It is 32 px after (1 + 4 + 22 + 4 + 1: border, padding, the 22 px row, padding, border). That is the same as the command center's folded box, so everything under the banner moves 4 px down while it is folded."
  - What is wrong: the sum leaves out the folded body. Under `hidden="until-found"`, the body's `padding: 4px 0 0` (`CareerPanel.svelte:288-290`) is still drawn (see B1). By reading, the folded box is 1 + 4 + 22 + 4 + 4 + 1 = 36 px. That is 4 px taller than the command center's folded box and 8 px taller than before the step.
  - Failure scenario: the look on TEST measures the folded career box against the report's 32 px and the command center's box. It finds 36 px and a 4 px band under the row, and the report's before and after cannot be used to read the look. This is round item 3, violated.
- **P2. The round-0 rows of the report now describe the old body.** The DONE row 4, the C9 row and judgment call 5 still read `<div class="body" hidden={!unfolded}>` (line 119) and "the form `TabView.svelte:48` uses". After round 1 the body is at lines 120-124 with `hidden="until-found"`. The appended section states the change, but the earlier rows are not marked as replaced. Failure scenario: a reader of the DONE table takes plain `hidden` as the state of the tree.

### 3. Standards

none. The two comments changed this round are wrapped at 100 columns (`CareerPanel.svelte:18-23` at 98, 98, 100, 99, 97 and 77 columns, and `FoldHead.svelte:69-70`). They carry no history word, and they are ASCII.

### 4. Behaviour

- **B1. The folded career box gains a 4 px empty band under its heading row.**
  - Place: `src/lib/views/boards/focus/career/CareerPanel.svelte:120-124` together with `:286-290`.
  - Quoted:
    ```
            <div
                class="body"
                hidden={unfolded ? false : 'until-found'}
                onbeforematch={() => (unfolded = true)}
            >
    ...
        .body {
            padding: 4px 0 0;
        }
    ```
  - What is wrong: the HTML rendering stylesheet maps the two states differently. `[hidden]:not([hidden=until-found i]):not(embed)` gets `display: none`, and `[hidden=until-found i]:not(embed)` gets `content-visibility: hidden` (WebFetch of html.spec.whatwg.org/multipage/rendering.html). MDN's hidden page says that elements in this state "generate boxes", "participate in page layout", and have "their margin, borders, padding, and background ... rendered". The Chrome page the report cites says the element "will still have a box". So while the banner is folded, the body is a box of zero content height with its 4 px top padding still drawn.
  - Failure scenario: open the Focus board on a hub with a career file and leave the banner folded (the default). The career box is 36 px high, and its 22 px row stands 4 px from the top edge and 8 px from the bottom. The command center's folded box is 32 px with 4 px on each side, so the two headings no longer look alike in their boxes. Before round 1, with plain `hidden` and `display: none`, the body drew nothing. The report's before and after does not state this (it states 32 px).
  - Verdict named: round item 3 violated. The step's item 4 and item 5 hold for the row but not for the box, and ruling Focus headings (career heading aligned with the command center's) is met for x and row height but not for the folded box.
  - Fix in scope, judged by reading: take the 4 px off the body while it is hidden, for example `.body:not([hidden]) { padding-top: 4px; }` or the same spacing as a margin on the body's first child inside the contained box. Either keeps the find-in-page reveal, since the body stays `display: block`, and the folded box returns to 32 px.

### Declined to judge

- **The live find-in-page reveal on TEST and in the desktop app.** I started no page. Whether the Electron window offers find-in-page at all is not verified; the round-0 refuter found no find key binding in `config` or `src`. That is for the look on landing.
- **The 36 px figure is by reading the CSS and the cited specifications, not measured.** The look on TEST settles it.
- **Whether any of the 16 changed files in test:quick's selection differ from `git status`.** The selection is the tool's own git read. The full `diff -rq` of the base copy against the worktree over `src`, `config`, `tests` and `utils` did not finish within 120 s and was stopped. The changed set rests on `git status --short` and the two `cmp` runs.
- **The report's test:quick timing (143.0 s).** Not reproduced. My one run took 120.0 s, also over the 45 s limit, with every command passing.

Reviewer usage: a71c9aeb58e432ce4, claude-opus-5-5, 140872 tokens, 30 tool uses, 7 min 39 s
