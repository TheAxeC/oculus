# D76 round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/D76.md`, which stay in force except where this file says otherwise. This round is built on the worktree `.agents/worktrees/D76` as round 0 left it (`git diff f4ed47774 | shasum` begins `9452011957a9`, 143 paths in `git status --short`, when the round was sent). The review is `agents/reviews/D76-refuter.md`; read it whole before you change anything. Run no git command of any kind, read-only ones included, in the worktree or anywhere else. A shortcut is a finding. This is the step's one repair round: what it leaves undone is not sent back again.

## What to change

1. **Rename on a link renames the note (Spec 1, Standards 2, Behaviour 3; Part 2, case 15).** F2 on `[[Kickoff]]` in a note's source tab, with a new name typed, now shows `lsp_edit_structure` and changes nothing, because `answerWiki` (`src/lib/server/machine/lsp/adapters/markdown/own/wiki.ts:234-238`) answers a `{kind:'rename', oldUri, newUri}` entry and the page's edit plan (`src/lib/state/system/machine/lsp/edits.ts:218-222`) refuses every entry without `textDocument`. The page applies a resource rename whose `oldUri` is a note in a hub's notes folder (and whose `newUri` is in the same folder) through the same note rename the Notes tree uses (`ops.svelte.ts` asking `moving` in `explorer/notes/note-moves.ts`), which plans and writes the link rewrites; the text edits the server sent for the links are then not applied a second time. Every other create, rename or delete entry is still refused with `lsp_edit_structure`, as today. The comments at `wiki.ts:15-16`, `servers.ts:24` and `kit/lsp/transport/edits.ts:21` then say what the code does.

2. **A scope inside `.oculus` other than the notes folder searches nothing (Spec 2; Part 6).** `searchedPaths` (`src/lib/data/helpers/search/query.ts:229-233`) searches `./.oculus` and `./.oculus/workspaces` as they are when `place.notes` is false. Any scope whose first segment is the state folder and that is not the notes folder or a folder under it searches nothing, whether the hub has a notes folder or not; the view says so the way it says an empty scope today.

3. **The search from a tag finds exactly what the Tags section counts, and no regex search gains `--multiline` (Spec 3, Behaviour 1; Part 8, case 38).** Remove `spansLines` and every `--multiline` the step added, in Search and in Replace (`query.ts:169/177`, `matchArgs`, `fileArgs`); a regex search runs as it did on the base. `tagPattern` (`note-index.ts`) holds no `\n`. The search a press on a tag opens keeps only the hits the tag index counts, matched by file and line, so a `#plan` inside a code fence, link text or front matter outside `tags:` is neither counted nor listed, and a note counted through its front-matter `tags:` list is listed at that line. The doc comment of `tagPattern` then says this.

4. **The server's name rule holds for the first note of a hub with no notes folder (Spec 4, Standards 2; Part 1).** `inNotesFolder` (`src/lib/server/files/fs/notes.ts:315-329`) treats a missing notes folder as not inside. Compare against the notes folder's would-be path, the real path of the hub's `.oculus` joined with `notes`, so a create of `notes/<name>.md` under `.oculus` follows the name rule on the server whether the folder exists yet or not. The `ops.ts:45` head comment and the `noteLanding` doc at `notes.ts:314` are then true.

5. **A run that checks the sanitiser (Proof 1; case 42).** The G5 rows in `tests/ui/html.test.ts` run in the `unit` project (`environment: 'node'`), where DOMPurify's `sanitize` is not defined and `sanitise` hands the text back. Move the math and link rows into a `tests/**/*.client.test.ts` file, which the `client` project of `vite.config.ts` runs with `./tests/ui/frame/client-runtime.ts`, so the run shows `MATH_PROFILE` and `PROFILE` keeping the slot spans and stripping `style`. The rows stay under G5's named test, by title; if the unit differs so they cannot, the report names the entry and title they need and the orchestrator writes `agents/guarded.md` at landing.

6. **An embed is valid HTML (Behaviour 4).** An embed `![[...]]` alone on its line renders as a block, never inside a `<p>`; an embed inside a line of text renders as a `<span>` with the same class. The report quotes the rendered HTML of both.

7. **Comments rewrapped at 100 columns (Standards 1):** `src/lib/server/files/workspace/paths.ts:2`, `src/lib/server/machine/lsp/held/answers.ts:3`, `src/lib/server/machine/lsp/relay/relay-route.ts:6`, `src/lib/server/machine/lsp/relay/relay-server.ts:3`, `src/lib/server/files/fs/lsp-edit.ts:14`.

Not sent back, and changed by nothing in this round: the KaTeX `errorColor` of the TeX view and the Math Preview (the orchestrator looks at it at landing), the module-level `let loading` in `views/shared/latex/math.ts:51`, Proof 2 to 4 (process notes; this round's run of case 3 uses `  Kickoff  ` and case 6's run states what it stubs), and Standards 3 and 4 (booked at landing).

## Cases (first run on the round-0 tree in the worktree, then after)

1. F2 on `[[Kickoff]]` in `A.md`'s source tab, new name `Launch`: round 0 shows `lsp_edit_structure`; after, `Kickoff.md` is `Launch.md` and every `[[Kickoff]]` in the hub's notes reads `[[Launch]]`, each written once (a quoted run of the page's edit plan with the server's answer).
2. A rename entry whose `oldUri` is not a note (a `.ts` file), and a `create` entry: refused with `lsp_edit_structure`, before and after.
3. `searchedPaths` with no notes folder, scopes `.oculus`, `.oculus/workspaces` and `.oculus/notes`: round 0 `["./.oculus"]`, `["./.oculus/workspaces"]`; after, nothing for the first two. With a notes folder, the same scopes: nothing, nothing, the notes folder.
4. A regex search `a\nb` and a Replace with a regex: the ripgrep arguments hold no `--multiline`, after.
5. `A.md` with `#plan` in prose, `B.md` with `#plan` only in a code fence, `C.md` with `tags: [plan]`: the Tags section counts `plan 2`, and the search a press on `plan` opens lists `A.md` and `C.md` only (round 0 lists `B.md` too).
6. A create of `.oculus/notes/<bad name>.md` in a hub with no `.oculus/notes`: round 0 lands it as named; after, the server answers the name rule as it does when the folder exists.
7. The G5 rows run in the `client` project: a quoted run showing `style` stripped and the slot spans kept.
8. `![[Kickoff]]` alone on its line and `see ![[Kickoff]] here`: the rendered HTML, round 0 against after.
9. The five comments: the first line of each, after, at most 100 columns and filled.

Page-only parts (case 1 on screen, case 8 drawn) are looked at by the orchestrator on TEST at landing.

## Paths this round writes

- every path items 1 to 7 name, and the test files the cases need
- `src/lib/state/system/machine/lsp/` and `src/lib/ui/controls/editor/kit/lsp/transport/`, for item 1
- the Search view's files under `src/lib/views/` that read `searchedPaths` or the tag search, for items 2 and 3
- `src/lib/data/prose/` for item 6
- `tools/oculus/docs/*.md`, `tools/oculus/DESIGN.md` and `tools/oculus/HELP.md`, only where this round makes a sentence false
- `tools/oculus/docs/diagrams/*`, as `npm run diagrams` rewrites them
- `tools/oculus/.scratch/migration/agents/reviews/D76-report.md`

## Verify before you report

The brief's "Verify before you report", every check, from `tools/oculus` in the worktree, with `--testTimeout 0 --hookTimeout 0` where the machine's load ends a run on its timeout, saying so. While working, run only the test files that cover what you change; after the round's last change, run the full verify list once and quote its final lines; a red line in a file you touched is fixed and that command rerun alone, then the full list once more. The report states the number of full-list runs.

Rewrite the report whole for the state after this round. Copy the open items from the state file at the moment you write it. Every finding of the review gets a line saying what changed for it, with the file and line.
