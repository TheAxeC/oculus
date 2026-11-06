# O155, repair round 1

The findings of `agents/reviews/O155-refuter.md`, each with its ruling. The brief `agents/briefs/O155.md` stands. The paths are the brief's, those the diff already changes, and those the items name.

Every file edit in this round is made with Edit or Write (`spec.md`, "What every package obeys"): no program of your own, inline or in a file, that changes a file or prints text you then copy into one, and no heredoc or redirect that changes a file. A changed test row of a behaviour this round changes is run first on the worktree before the code change, and its failing lines are quoted. Run the unit test files your change touches while you work, and the brief's "Verify before you report" once, at the end of the round; no other run of the list, no start of it that you stop, and no whole-suite command. Diagnosis is banned; a cause is found by reading the code. No breakage or mutation testing of any kind. A shortcut is a finding: a narrower reading of a ruling, or work inside it called outside it, is done or handed back with the reason before the report.

1. Spec 1, the categories resolved once. `deckOrderOf` (`order.ts:78-85`) gives the categories in the order a deck places them, resolved once (`deckCategories` run there, the field named for what it holds), and `inDeckOrder` (`groups.ts:135-157`) reads that resolved list instead of resolving it on every call. The doc comments of `DeckOrder`, `DeckContext.order` and `inDeckOrder` say what they hold.
2. Standards 4, one rule. `tests/data/sources/present.test.ts:32-39` (`orderOf`) goes: the rows build their order with `deckOrderOf` from `order.ts`.
3. Standards 3, test titles. The titles of `present.test.ts:740-786` (and any other title or describe the step added) drop the brief's case ids (`C1:`, `C12d:` and the like) and say the behaviour alone; G32's Test line still names the describe.
4. Standards 5. `Ordered` in `order.ts:14` is no longer exported if nothing outside the file imports it (`grep -rnw Ordered src tests`).
5. Standards 1 and 2, rewrapping. The head comment of `in-place.ts` around `:20` is rewrapped as a whole paragraph at 100 columns, no line ending short mid-sentence; `docs/templates.md:469-472` is rewrapped so no line passes 100 columns, the words kept.
6. Standards 7, no pin in a deck. `docs/decks.md:128`, `docs/HELP.md:337`, `config/catalogs/vocab.yml:279`, the help of `config/options/catalogs/vocab.yml:347` and `docs/templates.md:556-558` each say that a deck reads no pin: inside a category by the row's `sort:` and the board's own order, a pinned project placed as any other.
7. Proof 1 and Behaviour 1, the report. The report's first run of C12a and C17 quotes each row's failing assertion line as printed on the unchanged tree, from your record; if your record does not hold them, say so in those words. The report's "What the look should show" adds that the deck order also orders a discovering group's slides (`{ slides: <group> }`), its summary rows and its grid cards in the pane, the presenter screen, the audience window and the PDF, with one fixture or hub case where the order before and after differs, by its deck and slide.

Closed, not sent:

- Standards 6 (a start of the verify list stopped before it printed): recorded at landing; this round runs the list once, at its end.
- Declined to judge, other hubs holding a group `sort:`: the landing checks every hub of the workspace for a group `sort:` before it lands, by grep, and removes the research hub's line 19 then.

Report: rewrite `.scratch/migration/agents/reviews/O155-report.md` in the worktree's copy of the ledger to its final form, with each ruling above marked done with the check that shows it, the changed rows' failing lines before the fix where a row's behaviour changes, and the verify lines of the end of the round.
