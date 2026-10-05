# D38, round 0: the cases ruling

The builder's first run (agents/reviews/D38-report.md) found that the brief's PubMed author clause finds nothing. Each ruling below stays inside the brief's scope.

1. Cases 18 and 21, "What to build" item 2: PubMed's author clause is `<author>[au]` without quotes, with `"`, `[`, `]`, `(` and `)` removed from the value first. The venue clause stays quoted (`"<venue>"[ta]`). The builder's live counts are the evidence: `Faes[au]` 840 and `"Faes"[au]` 0; `tensor regression AND Faes[au]` 3 and the quoted form 0. Cases 18 and 21 are rerun with the unquoted clause and the report quotes the counts. Not chosen: sending PubMed no author filter (the lazy option, which leaves the source unfiltered).
2. Item 2's OpenAlex `select=` adds `locations`, which decision 7 reads to link a preprint to its published version.
3. Case 55: `startEntries` in `src/lib/server/edit/entry-edit/entries.ts` accepts a radar file whose list is `entries: []` and appends to it; `appendEntry` follows. The file joins the write list.
4. No `.agents/worktrees/D38-base` exists: the builder's own copy of the unchanged tree in its scratchpad stands as the base for `diff -rq`. The unused-exports comparison is `sh utils/unused-exports.sh` run on that unchanged copy.
5. Case 58: the documented samples stand as fixtures. The Scopus sample's added `openaccessFlag` is marked in the fixture and in the report as added by hand.
