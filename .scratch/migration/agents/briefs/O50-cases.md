# O50, the ruling on the builder's hand-back of C14 (round 0)

1. C14 and the `OPTION_SOURCES` row of item 2 are held. The reference index reads no workspace file, so the row alone does not make a rename rewrite `settings.self`; whether the index is widened to read the open workspace file's `settings:` is Axel's ruling (open item 227 in `orchestrator-state.md`). Do not add the row, and do not build the widening. Write in the report, as the first line's NOT done part, "C14 and the `OPTION_SOURCES` row wait for Axel's ruling on open item 227", and give C14's first run as you found it.
2. Every other part of the brief is built now: items 1 to 8 and cases C1 to C13, with "Verify before you report" run in full after your last change.
3. The judgment call on `root === undefined` inline in `editors/sources.ts` and `config-sources.ts` stands: it is the tree's own idiom, and `options.ts` is outside the write list.
