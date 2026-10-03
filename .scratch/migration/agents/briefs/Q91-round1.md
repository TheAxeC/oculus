# Q91, repair round 1

The refuter's report is `agents/reviews/Q91-refuter.md`. Each finding below has its ruling; change nothing else. Run no git command at all (`agents/spec.md`, "Where you work"). Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q91`, product under `tools/oculus`. Write the round's report as a section "Repair round 1" appended to `tools/oculus/.scratch/migration/agents/reviews/Q91-report.md` in the worktree.

## Behaviour

1. B1, `expandOneNote` (`yaml-edit.ts:579-616`) drops comments. Carry every comment in the replaced span over, so the module's contract (everything else copied through untouched) holds: a comment after `followup:` stays on the key's line, a comment line before the item stays above the first key, and a comment after a value stays after that value. A comment the rewrite cannot place (one inside a multi-line value) makes the write refuse with a reason, nothing written. One test per placement and one for the refusal, each quoted failing on the current tree.
2. B2: for a project with no follow-up note, the "Follow-up: not until" date is read-only while the note's text is empty, with a line from the text catalog saying a date needs a note; a typed date can no longer count as a change Save cannot write. A test: no note, the date field not writable and the line drawn; a note typed, the date writable.
3. B3: an editor write that expands a bare note or a one-note list into a map records the text it replaced, and its undo puts that text back when the file still holds what the write left, so the file returns to its own shape byte for byte; any other undo goes through the value write as now. Assert the whole file after the undo in `undo-removed.test.ts` (`toBe` over the text) for a bare note and a one-note list, each quoted failing on the current tree.

## Spec

4. SP1: name in the report's judgment calls the split of the tree's wiring into `rooted-tree.svelte.ts`, `RootedTree.svelte` and `ProjectTree.svelte`, and the three further moves (`control/tab-actions.ts`, `control/bookmark-actions.ts`, `Outside.svelte`), each with its reason.
5. SP2: the report's file table marks each path outside "Paths this step writes" with its reason (`server/edit/writes/manifest.ts` with the `currentOf` change, `restore.ts`, `follow.ts` with the Files view's selection now following too, `manifest-draft.ts`, `shapes.ts`, `fs.ts`, `shell.ts`), and carries the line counts itself, taken with `wc -l` after your last change.
6. SP3: `config/text/views/boards/editor.yml`'s `followup_several` says the notes are edited on the Focus board or in the project's `project.yml`.
7. SP4: the card record's key keeps the encoded project id; DESIGN.md's paragraph says the id is percent-encoded, and the report lists the key shape as a decision.

## Proof

8. P1, C9: replace the waiting-on half of the test with one that reads a manifest text holding `waiting-on: stephanie` through the reader and normalise into the form's values, and checks the finding `validate.ts` reports for it; quote it failing with normalise reading the bare word as a list, on a scratch copy.
9. P2, C23: give each C23 test a run with its behaviour removed, quoted red; add a test where a listing answers after the card closed while the selection changes, and nothing is written into the cleared record.

## Standards

10. S1: `CardDocs.svelte:13-17`'s head comment says what the finder does now, with no comparison to an earlier state, and the path reads `state/sources/explorer/view/card-tree.ts`.
11. S2: `ProjectTree.svelte:52-56` takes the project's absolute folder from `folderOf(project)` (`state/client/selectors.svelte.ts:78`), the existing helper.
12. S3: split `yaml-edit.ts` so it ends more than 20 lines under its cap of 900 after this round's changes, the part moved a file with one concern, named in the report with its line count.

## Verify before you report

Run the brief's verify list through `checks.sh` once, after your last change, from `tools/oculus` in the worktree, and quote its printed lines. A failure in a test file this round does not change, a timeout included, is that one file rerun alone with `npx vitest run <file>` and both runs quoted; the whole list is not run again for it. A failure in a file this round changed is fixed, that file rerun alone, then the list runs once more. Then the brief's gate 2 grep.
