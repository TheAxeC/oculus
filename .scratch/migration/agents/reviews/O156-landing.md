# O156 landing

Position: roadmap entry "migration" (the oculus migration plan), step O156, one deck reader. Next: /spec O155 (the deck order), then O157 (a slide laid out from its content).

Open items: none.

## The check of Steps 1

The builder a40eb11d096ea1851 and both reviewers (a883220b1e4e27a9e, a54c252e660a2e7eb) had reported and finished; the runner's agent listing shows no subagent running.

## NOT DONE

- Not looked at: a slide drawing another hub's domain (C2, C17), since no project of this hub names a key only another hub holds. It rests on the rows of `tests/data/hubs/decks.test.ts` and both reviews.

## What landed

O156 on main from base a2385d834, the whole range (wip commit ed1a43705), 30 paths without renames, on top of O154 with no conflict.

- One module reads a deck folder for both the snapshot build and the deck route: `deckProject` and `deckReader` in `src/lib/data/sources/documents/decks.ts`.
- Neither read raises a finding on a project's domain. The manifest schema check checks a manifest's `domain:` once, over every hub's keys. `findings.deck.domain_unknown` is gone.
- The readers' tests are one table, `tests/data/hubs/decks.test.ts`, which replaces `deck-facts.test.ts`.
- The comments, `docs/decks.md`, `docs/HELP.md`, the diagrams and G32 say so.

## What was found

- Premise correction: the brief missed the manifest schema check, so the first build raised a second finding for the same `domain:` line. Repair round 1 removed it.
- The builder's first report did not pass its bar: item 6 was violated, and the round closed it with three more points.
- The case-run probe, written by a heredoc, and a stopped verify-list run are recorded under "Unapproved builder scripts".
- Fix at landing, one: the `decks.test.ts:327-334` assertion over the deleted catalog words, deleted. The row check pins every `domain` finding.

## Verification

- Gate at 73f90f843 with the range and the fix: the second run of `npm run diagrams && npm run docs:palette && npm run test:quick` printed "test:quick: 289.6 s; every command passed" (30 changed files, 248 test files, svelte-check 584 FILES 0 ERRORS 0 WARNINGS).
- The first run, with the look server beside it, had failed only on two 20 s timeouts.
- `npm run build` exited 0.
- `OCULUS_TEST_HUB` integrity cases on the real hub: 14 passed.
- Main's diff equals the gate's under `cmp` (SAME, 30 files).
- Not covered: tests that reach no changed file within the import depth.
- Timing, six alternating runs of `hub-portfolio.test.ts` and `self.test.ts`:
  - 74.13 s with the step against 74.41 s without, difference -0.28 s, standard error 4.06 s.
  - Timeouts on 2 of 6 base runs and 1 of 6 step runs, so they come from the load.
- No A/B (no `bench:`).

## The look (scratch server on 8797)

The Findings view lists 164 findings, as before the step, and a search for "domain" lists none (C10). The scratch `.oculus` equals its backup and the server is stopped.

## Agents

- Builder a40eb11d096ea1851, claude-opus-5-5:
  - first build: 349930 tokens, 197 tool uses, 45.2 min;
  - round 1: 162067 tokens, 81 tool uses, 21.2 min.
- Brief check a7ae7433adbc605b5, claude-opus-5-5: 201464 tokens, 68 tool uses, 10.3 min.
- Reviewer a883220b1e4e27a9e, claude-opus-5-5: 243008 tokens, 80 tool uses, 17.5 min.
- Reviewer over round 1 a54c252e660a2e7eb, claude-opus-5-5: 212136 tokens, 49 tool uses, 17.5 min.
