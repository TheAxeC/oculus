# O151 repair round 1

Read with `agents/spec.md`, `agents/briefs/O151.md` and `agents/reviews/O151-refuter.md`. O151 is built inline, so the orchestrating session carries this round out itself, in the research hub, with Write and Edit for every file it changes. The findings are numbered as the refuter report gives them; each ruling says what changes.

## Rulings

1. Spec 1, C1 to C9 first runs. The first run of every case on the unchanged hub is taken from HEAD and quoted in the report before the result table. HEAD's `projects/` is exported into the scratchpad with `git archive HEAD projects | tar -x -C <scratchpad>/O151-head`, and C1, C2, C6, C7 and C9 are run there as the brief gives them. C8's first run is `git status --short projects deck` with the step's paths named apart. C5's first run is the 25 existing decks as HEAD holds them, opened on the scratch server on 8797 on a hub copy whose `present/` folders are HEAD's, each slide's Too tall state recorded, the copy put back from `<scratchpad>/O151-look-backup` after.
2. Spec 2, decision 1. A deck is one `main.md` with one slide, split only where that slide is Too tall at text scale 1 in the default theme, into as few slides as fit. Each of the 41 rich new decks and each of the 16 existing decks that the step split goes back to one `main.md` holding every value the split files hold, with `order: [main.md]`. Each is measured on the scratch server; a slide that is Too tall is split into the fewest slides that fit, a figure kept on one slide with its explanation wherever the two fit together. An existing deck whose slide was not Too tall at HEAD keeps its HEAD form, changed only by item 2 of the brief and by this round's rulings.
3. Spec 3. Every number of the 70 new decks keeps the interval its source gives it, the comparator's included: `fbttr-strategies`, `extended-bttr-note`, `block-term-tensor-regression` and `abduction` as the finding names them, and each other new deck's comparator numbers read against its source and given their intervals where the source states one.
4. Spec 4. A manifest-only slide's `results` come only from the manifest's own `results`. `algebraic-subtyping` and `individual-reference-intervals` lose their `results` (neither manifest has one), and `connectivity-motor-imagery` loses the `outcome` sentence from its results.
5. Spec 5. `connectivity-motor-imagery` and `abduction-bci-meeting-2021` state the simulated estimate as the manuscript gives it (`manuscript/main.tex:150-156` against the truth at `:138-144`), every coefficient that differs from the truth included, or the coefficient claim is cut whole; no slide quotes only the coefficients that match.
6. Spec 6. `cirrhosis-digital-twin`'s idea slide carries nothing of the PIHC proposal: its `desc` says what the idea is from the manifest's `title` alone ("a digital twin for cardiovascular and liver outcomes in cirrhosis", with Maureen Guichelaar of MST hepatology), and no aim of the proposal (prediction across organs, treatment comparison).
7. Spec 7. `compare.py`, `sync.sh` and the in-page frame-height JavaScript are closed under the standing ruling "Unapproved builder scripts": the breach is recorded in the report and the booking, and nothing they produce is the evidence for a claim of this round. The comparison of Proof 1 is made with `git diff HEAD --` of each existing deck once ruling 2 has put it back in one file, and by reading where a deck stays split.
8. Proof 1. The report's "Nothing lost in a split" row compares each existing deck with HEAD (ruling 7) and the new decks with their one-file form, and says which.
9. Proof 2. The report's place for erp-signatures' "16 participants" reads `README.md:22`.
10. Proof 3. The report states that `modulation-lmp-bci/manuscript/main.pdf` equals the abstract its manifest's `publication.url` names (`cmp` against `side-projects/theaxec.github.io/publications/abstracts/Abstract.Eva.CalvoMerino.pdf` prints nothing), so its numbers are that abstract's; the slide stays.
11. Standards 1. No slide of the 70 new decks uses a negation contrast ("not X", "not only X", "rather than X" set against a positive): the five places the finding names, and every other place a grep of the new decks for `not only`, `, not `, `rather than` and `instead of` finds, each judged by reading and rewritten to state the thing directly.
12. Standards 2, the idea slide. `brecht-fl-partitioning`'s slide is an idea slide, so its `desc` says what the project would show, never what it shows. Whether the deck may stand in the portfolio deck at all is open item 695 (a rule clash), which this round does not decide.
13. Standards 3. `btfno`'s `notes` keep the `<i>` markup of the body at HEAD (`<i>dynamical</i>`, `<i>learned progression operator</i>`).
14. Behaviour 1. A figure's explanation stands on the slide that draws its figure wherever the two fit together (ruling 2). Where they do not fit, the explanation's slide names the figure it explains in its first words, with no "left" or "right" that points at nothing on screen, and the report states the before and after.

## Verify before you report

The brief's checks again: the integrity test, the enumeration, the character-set check of C9 and the key read of C7, and the look of C4 and C5 on the scratch server on 8797, the hub copy refreshed from the hub and put back from `<scratchpad>/O151-look-backup` after. The plan's whole verify list runs once, at landing on main.

## Paths this round writes

- every file under the `present/` folder of the 95 research projects of the hub
- `.scratch/migration/agents/reviews/O151-report.md` (the round's section)
