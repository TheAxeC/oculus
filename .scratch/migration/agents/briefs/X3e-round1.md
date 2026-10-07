# X3e round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md`, the step's brief `agents/briefs/X3e.md` and its cases ruling when one exists, which stay in force except where this file says otherwise. This round is built on the worktree `.agents/worktrees/X3e` as round 0 left it (`git diff e1a75b8e1 | shasum` begins `9c96cab3ae20`, 201 paths in `git status --short`, when the round was sent). The review is `agents/reviews/X3e-refuter.md`; read it whole before you change anything. Run no git command of any kind, in the worktree or anywhere else. A shortcut is a finding.

## What to change

1. **A root drag from another tree is refused there (Spec S1, Standards T2; item A1, case 10).** `src/lib/views/shared/explorer/tree/control/dragging.svelte.ts:163-182` reads `carried` per instance, so another Files tab's tree, whose `carried` is empty, draws the drop line and answers `dropEffect = 'move'` for a root dragged from the first tab. A tree that did not start the drag answers `dropEffect = 'none'` and draws nothing, over a row and below the last row, as item A1 says; the head comment at :12-13 then says what the code does. The drag state that tells the two apart is held per drag by the tree that started it, not at module scope (item 2).

2. **No file-scope mutable for the list drag (Proof P1; items A3 to A5).** `src/lib/views/sources/files/sections/list-drag.svelte.ts:30-31` holds `let active` at module scope, shared by every `createListDrag` instance and every Files tab. The item a drag carries is held per instance, and a drag that ends without `dragend` (its source removed mid-drag) leaves nothing that a later drag is read against.

3. **The new tests are rows of the named guarded tests (Spec S2).** spec.md says a test exists only as the test of one entry of `agents/guarded.md`, named there by file and title, one test per unit with one row per input. Fold each test the review lists into the test its entry names, as rows:
   - `tests/routes/edit/roots.test.ts`, its four new tests, into G8's and G9's named tests;
   - `tests/server/files/workspaces.test.ts`, its new test, into G31's;
   - `tests/server/files/notes.test.ts`, its two tests, into G31's named test "refuses a write over an order file it cannot read, leaving it", under that title;
   - `tests/server/git/git-write.test.ts`, the renamed test, back under G33's title with the new inputs as rows;
   - `tests/server/git/refs/detached.test.ts`, its new test, into G33's.

   Where a row cannot join a named test because the unit differs, the report names it with the entry and the title it needs, and the orchestrator writes `agents/guarded.md` at landing; you do not edit `agents/guarded.md`. G41's `failureText` in `git-routes.ts` is now `failureLine` in `src/lib/server/core/git/failure.ts` (Spec S3); the report names it and the orchestrator updates G41 at landing.

4. **Case 26 (Spec S4), ruled.** A missing notes folder holds no note, so an order over it names no note and is refused `no-such-note` (item A4's rule); that is the expected result, and case 26's "made, then written" holds for the order file only, as CASE 26b shows. The report states case 26 as ruled here, with both quoted lines.

5. **The head pill names the checked-out branch (Behaviour B2, ruling Z711).** On HEAD's graph row, the head pill (`head` glyph, first among the row's pills) names the checked-out branch, and carries the short hash only while HEAD is detached. The other branch names on that row stay grouped as item D7 says. The report gives the before and after of the row on a branch and detached.

6. **Each open tab's folder listing (Behaviour B1; item C3).** `gone()` (`src/lib/state/sources/fs.svelte.ts:491-499`) asks the EVERYTHING listing of every open tab's folder. When a listing of that folder in any form is already held and holds the file's name, the tab is not gone and no request is sent; only a folder with no listing that answers the question, or one whose listing lacks the name, is read with everything shown. The report states, before and after, the number of listing requests a page with tabs on files in N folders sends at load, counted by a quoted run.

7. **A doc comment back on its constant (Standards T1).** `src/lib/state/sessions/source.svelte.ts:165-170`: the "One token per page lifetime" comment sits directly above `LIFETIME` again, and `HEAD_STAGES` keeps its own.

8. **The report names every path outside the write list with its reason (Spec S5).** The 35 paths the review lists, each with the item that needs it. `src/lib/state/sources/explorer/disk.ts` is placed in a folder the brief says X3e adds nothing to, which reaches 10 items once D15's `pdf-place.ts` is counted: move it to a folder the brief allows, or name why it belongs there. Add the one-line entries section G asks for D27-3 and Q88c-22.

## Cases (first run on the round-0 tree in the worktree, then after)

1. Two Files tabs; drag `ordo` from tab 1 over `cathedra` in tab 2 and below tab 2's last row: tab 2 answers `dropEffect` none and holds no line (a quoted run of the drag controller with two instances; round 0 answers move and sets the line).
2. A list drag started and its source removed with no `dragend`, then a drag in another list: read against no stale item (a quoted run with two `createListDrag` instances; round 0 shares `active`).
3. Every test the review lists runs as a row of its entry's named test, and passes; `grep -c` of each title in `agents/guarded.md` the report names.
4. HEAD's graph row on branch `main`: the head pill reads the head glyph and `main`; detached at a commit: the head glyph and the 8-character hash (a quoted run of the pill builder; round 0 shows the hash on a branch).
5. A page with tabs on 3 files in 3 folders whose listings are loaded, and on 1 file in a folder never listed: listing requests at load, round 0 against after (a quoted run with the request counted).
6. `source.svelte.ts`: the comment line directly above `const LIFETIME`.

The browser parts (case 1's line and cursor on screen, the head pill drawn) are looked at by the orchestrator on TEST at landing.

## Paths this round writes

- every path items 1 to 7 name, and the test files item 3 names
- a new folder for `disk.ts` only if item 8 moves it, and its importers
- `tools/oculus/docs/*.md`, `tools/oculus/DESIGN.md` and `tools/oculus/HELP.md`, only where this round makes a sentence false
- `tools/oculus/docs/diagrams/*`, as `npm run diagrams` rewrites them
- `tools/oculus/.scratch/migration/agents/reviews/X3e-report.md`

## Verify before you report

The brief's "Verify before you report", every check, from `tools/oculus` in the worktree, with `--testTimeout 0 --hookTimeout 0` where the machine's load ends a run on its timeout, saying so. Verify 4 runs each listed file alone. While working, run only the test files that cover what you change; after the round's last change, run the full verify list and quote its final lines; a red line in a file you touched is fixed before hand-back.

Rewrite the report whole for the state after this round. Copy the open items from the state file at the moment you write it. Every finding of the review gets a line saying what changed for it, with the file and line.
