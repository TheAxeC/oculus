# Q56 repair round 1

Close all five findings from `Q56-refuter.md` in the existing Q56 worktree. This is the step's one repair round.

1. Remove the four Q56 additions from `bin/size-allow.txt`. Split `src/lib/state/fs.svelte.ts`, `tests/state/fs.test.ts`, `tests/views/files.test.ts` and `tests/browser/files.spec.ts` by cohesive concern where needed so every size check passes without a new exemption. Keep every existing assertion and behaviour; do not weaken the size limit or move cases into an allow list.
2. Add a test that holds a `files` subscriber's send unresolved, publishes a bookmark event, publishes a root event before the first send completes, then proves both facts reach the page and the bookmarks reread. The test must fail when pending `files` messages use latest-only replacement.
3. Correct the changed-file line count in the round report from the final tree. Every count in the report comes from `wc -l` after the last edit.
4. Give `tests/server/watch/bookmarks.test.ts` the required opening `Layer 4, test` head comment, with the file's purpose and no history.
5. Register or implement a merge for pending `files` messages so a later root event retains an earlier `bookmarks: true` marker and retains the root fact as well. Keep the existing `files` channel and payload unless the written public shape cannot express the fix; do not add a new channel or config key. Prove the exact backpressure ordering from item 2.
6. Run the brief's full verification list on the expanded worktree, including the whole node suite, both named Playwright commands, and every revert check. A blocked or unproven revert is not a pass. The final report opens with what is not done, carries a DONE / NOT DONE row for each item above, quotes each command's output, lists every changed path and final line count, and carries the updated HELP.md and DESIGN.md text for landing.
