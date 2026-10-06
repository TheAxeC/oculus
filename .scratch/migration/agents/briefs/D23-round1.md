# D23, repair round 1

The refuter's report is `agents/reviews/D23-refuter.md`. Each finding below has its ruling; change nothing else. Run no git command, not even `git status`: spec.md:32 forbids it. Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D23`. Your paths are the brief's, widened by this round where an item names a file. Do no breakage testing: never remove or revert code to watch a test fail. Rewrite the report `tools/oculus/.scratch/migration/agents/reviews/D23-report.md` whole for the state after this round. Copy the open items from the state file at the moment you write it. Add a "Repair round 1" section that names each item below, what changed, and for a changed behaviour the test that covers it, with its failing run on the code before this round's change (in `.agents/worktrees/D23-base` or a scratch copy of the worktree as it stood before the round), never by removing code from the worktree.

The rulings this round applies are Z657 to Z661 in `plan.md`.

## Spec

1. S1, the cases' first run. Give each case its first run on the unchanged tree, in `.agents/worktrees/D23-base` (write only scratch files there, under a folder of your own, and name them): case 57's terminal half (the existing token refusal) and case 47's pyright probe (pyright started directly with the brief's initialize, no D23 code) as runs, with their output quoted; cases 10, 21 and 44 by reading the base code that gives their result, with the file and line. Every other case: one line saying what the base has nothing to run against, by case. Put this section before the result table.
2. S3 and B2, case 45 (Z657). A changed `lsp` key ends every held server, the linger timer of each cleared. A server whose owner page has documents open starts again at once under the new folder and gets those documents again; every other server, an orphan in its linger and a `not_found` or blocked one included, starts on its next document. DESIGN.md:250's rebuild clause reads: "; `lsp` the language servers, each ended, one a page has documents open in started again at once under the new folder and the others on their next document". The lifetime table gets the rows: a changed key with an open document restarts once; with only a lingering orphan, no process afterwards.
3. S4, the dictated texts. DESIGN.md:158 and :420 carry the brief's dictated text exactly (brief lines 356 to 362); where a later item of this round changes a sentence the brief dictated, the report says so with the before and after.
4. S5, the token gate. The socket hands `canWrite(sink)` to the Terminals and to the relay when it builds them, as the brief's shape says, and each calls it per message; no boolean argument.
5. S6, paths outside the list. The report names each of the ten paths the review lists (`ui/tree/TreeItem.svelte`, `ui/tree/item-props.ts`, `ui/controls/editor/commands.ts`, `views/shared/prose/source-options.ts`, `views/sources/files/Files.svelte`, `views/sources/repositories/diff/Diff.svelte`, `views/sources/source/save/tab-save.svelte.ts`, `shell/status/SourceItems.svelte`, `shell/keys/WorkspaceRows.svelte`, `state/shared/stores/shapes.ts`) with the reason the step needs it.
6. Case 46 (Z658). Keep the double percent-encoding of a root key that holds `/`. DESIGN.md:438's address sentence states it: `oculus-file:///<root key>/<path>`, the root key percent-encoded twice so a `/` in it stays one segment.
7. Case 47 (Z659). No code change. The report gives the reviewer's figures and your own run's beside the brief's 320.0 MB, which the brief got wrong: pyright alone peaks at 513 MB (2 s sampling) and 553 MB (500 ms), through the relay 532 MB and 562 MB.
8. S2, the wire (Z660). `approve` (page to relay) and `legend` (relay to page) are part of the vocabulary; the DESIGN.md sentence that lists the `lsp:` channel's oculus messages names both, each with one clause of what it carries.

## Proof

9. P1: the report's first line states what is done and what is not, after this round.
10. P2: case 7 has no ruling slot; the brief decides file order, as built.
11. P3: judgment call 2 says `lsp_folder` is one of UV-2's codes, as the brief lists it.

## Standards

12. St1, tests no guarded entry names (spec.md:57). Fold each kept outcome into the one table of its unit's entry (G2's `uris.test.ts` table, G13's `cpp-file.test.ts` table, G7's `servers.test.ts`, G31's `choices.test.ts`, the relay entry's table) and name it in "Lines for agents/guarded.md"; delete the rest. Delete `overlap.test.ts`.
13. St2: G36's Code line names `src/lib/server/machine/lsp/held.ts` beside `process.ts` and `relay.ts`.
14. St3: `lifetime.test.ts` is one table; a row carries a `steps` function that advances its own clock.
15. St4 (Z661): a localhost socket is not a network wait; `relay.test.ts` and `channel.test.ts` stay untagged. No change.

## Behaviour

16. B1, a root that stops being served (Z661). When a served root goes away, the relay sends a `state` frame `failed` with a new code `root_gone` for each server it ended under that root, and the status item shows it in words from the config text (`config/text/`, beside the other codes). When the root is served again, a tab still open under it is served again without being closed and reopened: the page re-sends `didOpen` for its open documents under that root when that root's state leaves `root_gone`. A test row in the relay's table: root removed, a `failed`/`root_gone` frame; root served again with the tab open, hover answers.
17. B3, Find All Implementations. `oculus.lsp.implementations` is offered only when the answering server's capabilities hold `implementationProvider`; on a Python tab it is not in the menu or the palette.

## Verify before you report

Run every check of the brief's "Verify before you report", item 1 from `tools/oculus` with the state file path `.scratch/migration/orchestrator-state.md` (the brief's "from the root of the checkout" is wrong for this repository). Run the unit test files your change touches while you work, and the verify list once, after the round's last change. Quote each output.
