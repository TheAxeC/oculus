# D72 landing

Position: oculus/migration, step D72 (collection entries as records of their own), the 353rd of 357 steps ticked in plan.md. Next: /spec D74 (the shell and source-control fixes), then D73, Q72 and O33.

## Open items

None.

## Check of Steps 1

ListAgents before the landing listed no agent of this session running: neither D72's builder (a321adcdf457b200a) nor its brief check (a8e7f3738fcbe9974) nor its reviewers (aa2b5f3bc2f7eb249, aad2c8c24c24034e1).

## NOT DONE

Item 1 of the brief for the two feeds: the page of a lead and of a Lit Watch paper shows the editor alone, without the entry's card. Placed in D74 as part 12 (Z867), since the two cards move out of their views with the Leads view's hand-off to Applications. Also placed in D74: the refusal words of the server's edit layer from the catalog (Z865, part 10), and the entry pages right after a write (Z866, part 11): the old value shown after Save until the hub data is read again, a page opened by Add saying the entry is missing until then, and an undo's History row labelled by the kind it reverses.

## What landed

The booking in plan.md under D72 ("Booked 2026-10-13: collection entries as records of their own"), 160 paths, +9,464 -3,363 against main, the ledger left out: a page and an editor for every entry of a collection or registry file, Add and Delete with the referrers named, People, Organisations and Resources as collections, the career file's editor through the `career` write, every field of the two feeds editable, `:task-add`, and `docs/palette.md` generated from the palette table.

## What was found

- The review over round 1: Findings 1, 2, 4 and 5 fixed at landing; Finding 3 to D74 (Z865); Findings 6, 7 and 8 corrected in the booking (`agents/reviews/D72-refuter.md`, Closed).
- The look: the palette's entry results opened an empty Entry tab, fixed at landing in `src/lib/shell/keys/palette-open.ts`; the rest as NOT DONE says.
- The gate: format, lint, a comment past the hundredth column and the integrity test's list of personal types (commit 1d2133f72 set twelve projects to `finished`), each fixed; a git-write row timed out under load and passed alone (11 of 11).

## Verification

In the gate worktree at main's head with the step and the fixes, `npm run diagrams && npm run test:landing`: ASCII, lint, format, `npm test`, check, build and `test:slow` passed; `test:checks` failed on the comment width alone, and after the rewrap `npm run test:checks` gave 18 files and 267 tests passed. Main's staged change equals the gate's (`git diff --cached --binary | shasum` 4d2e8bacf98d0efa641c8443ecb224a1a909433b in both).

## Usage, bar and fixes

Builder a321adcdf457b200a (claude-sonnet-5-5): 363,670 tokens, 808 tool uses, 149.4 min to the pause; 121,628 tokens, 27 tool uses, 19.4 min after the resume; round 1 341,716 tokens, 124 tool uses, 93.3 min. Brief check a8e7f3738fcbe9974 (claude-opus-5-5): 244,227 tokens, 106 tool uses, 11.7 min. Reviewer aa2b5f3bc2f7eb249 (claude-opus-5-5): 110,671 tokens, 119 tool uses, 22.3 min. Reviewer over round 1 aad2c8c24c24034e1 (claude-opus-5-5): 295,542 tokens, 82 tool uses, 28.3 min. The first report did not pass its bar; one repair round. Fixes at landing: 11.

## Next

/spec D74 with parts 10 to 12 on the new base, its brief check and dispatch; then D73, Q72, O33.
