# X3f, round 0: the ruling on case 33

Ruled by the orchestrator in automode (Z429), from the builder's first run.

Case 33 ("A file removed before the press's read returns: the cannot-open line, no kept empty tab") stands as written. The rule that gives it:

1. `readKind` (`src/lib/state/sources/fs.svelte.ts:548-560`) tells a 404 from every other refusal: a 404 answers a kind `missing` (a new member of `FileType` in `src/lib/state/sources/explorer/file-type.ts`), and any other refusal or failed read answers the name's kind as today.
2. `tabOf` (`src/lib/views/shared/explorer/opening.ts:39-48`) sends a `missing` kind to the `source` tab, which draws `source.cannot_open` with Retry, as it does for a text file that is gone. A double click keeps that tab; Retry reads again and opens what the file is once it is back.
3. `src/lib/state/sources/fs.svelte.ts`, `src/lib/state/sources/explorer/file-type.ts` and `src/lib/views/shared/explorer/RootedTree.svelte` (line 70, the forwarding of the press time to `openRow`) join "Paths this step writes".

On the builder's other points: the press time passed from `pressing.ts` through `Tree.svelte`'s `onopen` to `openRow` as an optional third argument is accepted; the layer staying until the pointer is released is accepted, and the report says that the cancelled `pointerdown` withholding Monaco's word selection is left to the look at landing; the layer drawn only while the armed tab is a preview tab is accepted; each file view calling `useTabActions()` with the cleanup registered in `tab-actions.svelte.ts` is accepted.
