# O127 landing

Roadmap entry: the cockpit-to-oculus migration. Step O127, a card shows the year a paper appeared. Next: none; the plan holds no unticked step.

## Open items

None.

## Steps 1

The runner's agent listing showed none of O127's agents running: the builder a09c9fb8b3606ecfe, the brief check ad6df2830a9462837 and the reviewers a8e6e45d7bcf15b6b and a86efa7addc7ea610 had each sent their completion notice.

## Not done

Nothing in the brief is left undone. Not seen on the look: a lane card's year, since no oculus lane holds a done project (settled by the case run C9), and the Person and Listing pages, which draw the same `ProjectCard`.

## What landed

The whole range from base 0e374c303 (the builder's work, repair round 1 carrying ruling 642 (a), wip commit 3f201f110) plus one fix at landing in code, 11 paths. The project board card and the Focus lane card draw a year tag (the calendar glyph and the number, tip "Year: 2025") after the chips of the facts row, from the manifest's `year`, only at a stage that carries both `terminal` and `public`. `normalise.ts` reads `year` as a whole number from a number or a text of the digits 0 to 9 alone; a fraction, a negative number, a value past the largest safe integer and any other text read as none. The Settings help of the flags `terminal` and `public` and `docs/HELP.md` say what the two flags decide together.

The cherry-pick met O126's `docs/HELP.md:295` beside this step's line 296, resolved by taking O126's Groups paragraph and this step's Focus paragraph whole.

Verification in the gate, `npm run diagrams && npm run docs:palette && npm run test:quick` with the fix: `test:quick: 183.3 s; every command passed`; the staged diffs of main and the gate are equal under `cmp`. The verify list equals the page's commands. No A/B: the configuration names no bench.

Fixes at landing: Behaviour 1 and Proof 2 of the review over round 1 (`normalise.ts`: a text of digits goes through the same `wholeNumber` shape as a number, so a value past the largest safe integer reads as none; the row 'a text of 20 digits, past the largest safe integer, as none' failed on the round's code with `expected 100000000000000000000 to be undefined` and passes after the fix, 13 passed); Spec 1 (`agents/guarded.md` G32 names "reads a manifest's year given as %s", every row); Proof 1 and Standards 1 (the builder's report names every reader of `project.year`, the stale count and the DONE row corrected).

Visible beyond the cards, by ruling 642 (a): a year given as a text of digits now reaches the boards' year filter, the board item, the manifest form's value and the website entry's `pub_date`, and a fraction or negative year reaches none of them; over the hub's 127 manifests every year reads the same before and after (the reviewer's run).

The look (scratch server on 8797 from the gate, scratch HOME with a copy of the hub's `.oculus` without `local.yml` and four manifests copied in): on the Archive board HCCNet-FL (accepted, 2026) draws the calendar tag "2026" after its form and before its code status, its tip "Year: 2026"; Flow-based Network IDS (published, 2016) draws "2016"; Algebraic Subtyping (stopped) draws none; on the Projects board RAW-PLS (submitted) draws none; the HCCNet-FL project page's card draws "2026"; no console error. The server is stopped.

## Usage

Builder a09c9fb8b3606ecfe: first run 185001 tokens, 76 tool uses, 9 min 12 s; round 1 255599 tokens, 53 tool uses, 9 min 47 s. Brief check ad6df2830a9462837: 184411 tokens, 66 tool uses, 8 min 47 s. Reviewer a8e6e45d7bcf15b6b: 165569 tokens, 33 tool uses, 6 min 16 s. Reviewer over round 1 a86efa7addc7ea610: 193537 tokens, 44 tool uses, 9 min 40 s. All claude-opus-5-5. The first report did not pass its bar: one repair round.

## Next

None in this plan: every step is ticked or removed.
