# D55, the cases the builder's report asks a ruling on

The orchestrator's rulings on the cases D55's report names under "Cases the brief's rules got wrong" and "Anything in the brief that was wrong or impossible". Each stays inside the step's part.

1. Case 12a. A manifest field write of a `keymap` field and a `feed-field` write keep refusing a list of maps of scalars, as they do on the base (`edit/writes/manifest.ts:128-131`, `bodies.ts:78-84`, `edit/feeds.ts:46-50`): no form control sends such a value and no feed field holds one, so a widened body would be a wire shape nothing sends. The widened `fieldValueShape` is taken by the writers that share it (`setFields`, the entry writes, `lead-add` over a `metalist` field), each written in the file's form and re-read. Case 12a is met by those writes and by the two routes' refusals with their existing sentences, quoted. Not chosen: widening `FeedFieldWrite.value` and the manifest route (a wire shape with no sender).
2. Case 19a, its second part. `rebuild` (`server/root/watch/portfolio.ts:636`) builds every hub in one synchronous pass, so no build of a hub finishes after a newer one and nothing is dropped. The case is met by the rebuild run the report quotes; no code is written for a stale build.
3. Item 8, "paste". `pasteItems` (`server/files/fs/ops.ts:570`) does not call `privateFolders`; the brief's word was wrong. The six callers are the ones `git grep -n "privateFolders(" -- src` lists, and each takes every hub. Paste keeps its behaviour on the base.
4. Item 4, `content/images.ts`. It serves the wallpaper and memories folders of the first hub's settings and names no record, so it stays unchanged.
5. Item 6, the session override. It writes the machine's overrides file, keyed by a folder path, so no hub routing applies.
