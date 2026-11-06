# O155 landing

Position: roadmap entry "migration" (the oculus migration plan), step O155, the deck order. Next: the landing of O157 (a slide laid out from its content), then O150 (the hub's portfolio deck), whose wait on O155 ends here.

Open items: none.

## The check of Steps 1

The builder a2c4de66431970038, the brief check af5bb92a343ab966d and both reviewers (a01664c3d86b25a7b, ad5773f9238f2e526) had reported and finished; the runner's agent listing showed none of them, only O157's reviewer, which has since finished.

## NOT DONE

- The hub commit of `~/workspace/research-hub/deck/present.yml`, the line `sort: folder` removed from the `more` group: on disk, uncommitted, waiting on Axel's word.
- Not looked at: an order before and after that differs in the research hub's deck, since the Overview under the filter in force showed one discovered deck per category. The fixture deck `talks/order` and its table rows carry that case.

## What landed

O155 on main from base 8a157c780, the whole range (wip commit debc43e7d), 50 paths without renames, on top of 7088cd384 with no conflict.

- `src/lib/data/shapes/boards/order.ts` holds the board order (`stageRank`, `BOARD_SORT`, `compareProjects`, no pin) and the deck order (`DeckOrder`, `deckOrderOf`, the categories resolved once).
- A group that discovers decks places them category by category in `deck_order`, inside a category by the row's `sort:` and then the board's order, then the decks of no category by folder. A deck reads no pin.
- `deck_order` is in `config/catalogs/vocab.yml` and its options file (`control: list`), merged whole, and named in `HUB_LIST`, `OWN_HUB_KEYS`, `config-folder.test.ts` and `docs/data-map.md`.
- A key no row of a hub's `categories:` holds is the finding `findings.config.deck_order_unknown`, for every hub.
- The group key `sort:` is gone from the reader, the schema, the Edit Rule form, the docs and the tests. G32, G124 and G126 carry the wording.

## What was found

- The builder's first report did not pass its bar: the review found seven points, which repair round 1 closed.
- The review over round 1 found every item holding and every case met but C20, the look.
- Fix at landing, one: the `groups.ts:8-10` head comment now says the decks of a category go by the row's `sort:` "and then the board's order, stage then title, with no pin read".
- Recorded, no change: a related run whose two red rows the builder's report left unnamed (the reviewer's rerun passed), and verify runs beyond the round brief's one run.
- The hub check: a grep of every deck file of the workspace's hubs found one group `sort:`, `research-hub/deck/present.yml:19`, removed on disk.

## Verification

- Gate at 7088cd384 with the range and the fix, no other test process at its start: `npm run diagrams && npm run docs:palette && npm run test:quick` printed "test:quick: 400.5 s; every command passed" (50 changed files, 228 test files, svelte-check 584 FILES 0 ERRORS 0 WARNINGS).
- `npm run diagrams` left nothing to change. `npm run build` exited 0.
- Main's diff equals the gate's under `cmp` (SAME, 50 files).
- Not covered: tests that reach no changed file within the import depth.
- No A/B (no `bench:`).

## The look (scratch server on 8797)

- Settings, Primary hub, search `deck_order`: Boards and audit, Vocabulary, Deck order, its help saying a deck reads no pin, and 7 entries: publications, other-outputs, in-review, in-flight, released, idea, dead-ends (C20).
- The Overview of the research hub deck: the `more` group's six named decks first, then the discovered decks, the accepted HCCNet-FL (publications) before the in-review deck (C20).
- The `more` group's Edit Rule form: find, tiers, stages, forms and status chips, no sort control; closed with Cancel (C13).
- The scratch `.oculus` equals its backup, the copy's deck file is restored and the server is stopped.

## Agents

- Builder a2c4de66431970038, claude-opus-5-5:
  - first build: 331510 tokens, 350 tool uses, 54.8 min;
  - round 1: 152217 tokens, 103 tool uses, 24.5 min.
- Brief check af5bb92a343ab966d, claude-opus-5-5: 260942 tokens, 105 tool uses, 16.7 min.
- Reviewer a01664c3d86b25a7b, claude-opus-5-5: 250112 tokens, 75 tool uses, 18.7 min.
- Reviewer over round 1 ad5773f9238f2e526, claude-opus-5-5: 203404 tokens, 56 tool uses, 13.1 min.
