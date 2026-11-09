# Step O176 refuter report (on .agents/worktrees/migration-O176 and the hub worktree .agents/worktrees/migration-O176, base f5e4fa700 oculus, 76cf0c5f9 hub)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number. A finding in a file keeps its `file:line`. A character outside the rules file's set in a quoted line is written by its name in angle brackets.

## Verification (rerun by the reviewer)

```
C1, C3: node with the source of c1c3.mjs quoted in the report, read from stdin, argument the hub worktree, from the oculus worktree
C1 active/linfoot-estimator | slide 1 | engine_shapes.png | exists true
C1 active/sandpile-operator | slide 1 | rollout.png | exists true
C1 archive/published/2021/source-localization | slide 1 | sparsity-acc-spread_norm.png | exists true
C1 archive/published/2022/block-term-tensor-regression | slide 1 | image10.png | exists true
C1 archive/published/2022/extended-bttr-note | slide 1 | ebttr_fig.jpeg | exists true
C1 archive/published/2025/go-bttr | slide 1 | gobttr.jpeg | exists true
C1 archive/published/2026/dongho-ecg-clustering | slide 1 | dongho_silhouette.png | exists true
C1 manuscripts/bttn-incident-af | slide 1 | pipeline_overview.png | exists true
C1 manuscripts/clinical-hccnet | slide 1 | sequences_by_horizon.png | exists true
C1 manuscripts/dries-bttr-ecg | slide 1 | forest_auroc.png | exists true
C1 manuscripts/hccnet-revision | slide 1 | figure_outline.png | exists true
C1 manuscripts/meseret-cirrhosis | slide 1 | fig_simulation.png | exists true
C1 manuscripts/meseret-cirrhosis | slide 2 | meseret_landmark.png | exists true
C1 manuscripts/raw-pls | slide 1 | fig2_results.png | exists true
C1 manuscripts/ward-bttr-crosssubject | slide 1 | pipeline_flowchart.png | exists true
decks: 93; figure lines: 15; two-slide decks: 13
faults: 0

C9: node with the source of c9.mjs quoted in the report, read from stdin, argument the hub worktree
lines repeated across decks: 36 (each a spec label, a tag text, a status value, an author list, a venue string, or one of three shared sub titles; the same list as the report's table)

C2, from the hub worktree: grep -rl --include=main.md '^equation' projects | wc -l
13
C2, from the hub worktree: git diff 76cf0c5f9 -U0 | grep -E '^[-+]equation'
two lines, both bt-operator-theory
C2, from the oculus worktree: OCULUS_TEST_HUB=<hub worktree> npx vitest run tests/checks/config/integrity.test.ts -t "deck|equation|portfolio"
Test Files  1 passed (1)
Tests  7 passed | 7 skipped (14)

Character set of the report, from the oculus worktree: LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' .scratch/migration/agents/reviews/O176-report.md
prints nothing
Character set of the decks, from the hub worktree: find projects -path '*/present/*' \( -name '*.md' -o -name '*.yml' \) -print0 | xargs -0 env LC_ALL=C grep -n '[^ -~]'
four lines, each the place name Link<o-umlaut>ping: ideas/modality-dropping-btf/present/main.md:10, ideas/hccnet-fl-sweden/present/main.md:4, :11, :19

From the hub worktree: git status --short
24 paths, all " M", all projects/<deck>/present/main.md of the path list; none outside
From the oculus worktree: git status --short
?? .scratch/migration/agents/reviews/O176-report.md

From the oculus worktree, TMPDIR unset: npm run test:quick
test:quick: 1 changed file(s), from git since HEAD
test:quick: 0 test file(s)
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.7 s)
ok      svelte-check (10.1 s): ... 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 13.0 s; every command passed
(no verify-exit= line is printed, as the report says; 1 changed file against the report's 0 is the report itself, now on disk)

Commands the report quotes as evidence:
git diff 76cf0c5f9 --stat, hub worktree: 24 files changed, 70 insertions(+), 32 deletions(-) (the report's totals)
grep -n 'mu_{\\mathrm{band}}' projects/manuscripts/bt-operator-theory/present/main.md: one hit, line 19, the corollary line (the report's line)
cmp manuscript/figures/fig_landmark.png present/meseret_landmark.png, meseret-cirrhosis: exit 0
pdfinfo icfp-src-abstract/manuscript/main.pdf: Pages: 3
pdftotext -layout archive/published/2016/bachelor-network-ids/manuscript/main.pdf: Table 11.15, RBF kernel SVM, CTU-dataset, Binary F-score Standard 0.0455 (the report's value)
pdftotext -layout archive/published/2018/masters-algebraic-subtyping/manuscript/main.pdf, lines 3563-3567: 222.74 261.47, 282.74 471.07, 27387.71 1177.23, 6402.66 753.47, 109.26 155.10 (the report's values)
pdftotext -layout hcc-modality-poster/manuscript/main.pdf: 92 lines, "~240 ~37 15.4%" on line 72. The report's lines 140-144 and 187 are those of plain pdftotext without -layout (140 "~37", 142 "HCC-POSITIVE", 144 "15.4%", 187 "~240"). The fact stands; no decision rests on the line number.
```

Premises of the brief, reproduced: 93 decks, 13 equations, 13 two-slide decks; the snapshot holds 95 `main.md`, 27 `figure:` lines in 19 decks; each of the 12 figures kept off is one snapshot line, no current line, one file on disk (grep over both trees). `ls docs/adr` in the oculus worktree prints nothing, so no ADR governs the step.

Panel lines against the snapshot, by a comparison of `grep -h "figure: <name>"` over the two trees: engine_shapes, sparsity-acc-spread_norm, image10, dongho_silhouette and pipeline_overview differ, each as the report's correction states; the other ten are byte-equal.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. 15 panels at the places the item gives (C1 rerun); the other 12 at none, files on disk. Captions and explanations read against the sources: linfoot README.md:71 and archive main.tex:262-263, with the image giving 12 negative and 8 at L at least 0.4 with |r| under 0.25; sandpile code/README.md:16; source-localization main.tex:178-179 with both balls at 1.0 on the image; block-term bare_jrnl.tex:820-824; extended-bttr main.tex:102-103, :141-145; go-bttr main.tex:122, :130-131 and the image; dongho main.tex:550-555; bttn main.tex:85, :90; clinical-hccnet main.tex:284-294; dries main.tex:150-151, README.md:22 and the image; hccnet-revision architecture.tex:10; meseret main.tex:299-300, :326-327; raw-pls main.tex:445, :475-480 and the image; ward body.tex:266-275 and the image.
- 2: holds. 13 decks; the only `equation` diff lines are bt-operator-theory's.
- 3: holds. Five second-slide titles read; hccnet-revision, meseret, ward and raw-pls are the noun-clause form the brief itself counts as a statement (its premise names meseret's slide 1, a noun clause, a statement); bttd is a question on both.
- 4: holds. The three chips, sources read: bt-operator-theory CLAUDE.md:6, raw-pls main.tex:625-630 and :651, bttn main.tex:307, :312-319.
- 5: violated, Spec 5. Every listed fact stands on its deck at a source line that reads as the report says; the report's list of facts left off gives one reason for a group of decks.
- 6: violated, Spec 1 and Spec 2. The `mu_band` form, ordering, oracle, $L=1$, `Depth` and `Proportional regime` lines follow README.md:83. The two headlines do not hold under the test named in the findings.
- 7: holds. Per-slide counts from the case-run program; each kept second slide exceeds four specs or four list items together, or is one the item names; meseret's holds the equation and `meseret_landmark`.
- 8: violated, Spec 3. The other lines changed (bachelor-network-ids, faithful-interpretability-position, florank-personalization, physics-tensor-hcc) are read and hold.
- 9: violated, Spec 2 and Spec 3. No spaced hyphen standing in for a dash on a changed line.

Cases of the brief's "Cases":

- C1: met, program rerun, 15 lines, each file exists; per-figure source read as under item 1.
- C2: met, 13, two `equation` diff lines, integrity test 7 passed.
- C3: met, `faults: 0`, every deck one or two slides.
- C4: met, by reading the five titles against their `-` lines.
- C5: met, by reading, sources as under item 4.
- C6: met, every listed fact on a slide and in its source: clinical-hccnet main.tex:142, :322; fed-multicellular main.tex:438-442, :447-450; raw-pls main.tex:541-542; dries main.tex:135, :155, :216, README.md:41; bttd main.tex:329-331, :405; covert main.tex:139, :687-690; ecg-readable main.tex:262; hcc-modality-poster poster text; ward README.md:37, body.tex:947.
- C7: met as the case is written: the grep hits only the corollary line; ratio $L$ on line 18 and nowhere $RL$ as the free-profile result; the lines named read against README.md:83. The domain missing from the headline is Spec 1.
- C8: partial. The per-deck table exists and each row's changed lines are correct; its number locations do not all point at the number on the slide, Proof 1, and rest on a script no ruling approves, Spec 4.
- C9: met, program rerun, 36 lines, none a hook, headline, method or result line.
- C10: not verifiable here. The orchestrator's drawing of every deck of the hub worktree on a scratch server, listing each slide that raises "Slide too tall", and the look at landing settle it.
- C11: met, by reading the per-slide counts against item 7's limits.

## 1. Spec

1. `projects/manuscripts/bt-operator-theory/present/main.md:23`: "headline: 'CP''s excess risk exceeds the free-profile block-term''s by a factor tending to $L$'"; what is wrong: the rewrite dropped the target class the old headline carried ("On disjoint-band targets") and put none in its place. The separation holds on band-structured targets (line 15 of the same deck; manuscript main.tex:339 gives the block-term squared bias on a target only approximately band-structured, and the report leaves that trade-off off as a detail number). Item 5's test applies: without it a reader takes the headline as wider than the source states it. Failure scenario: `docs/decks.md` "The order" draws `headline` alone in a summary row, so a reader of the portfolio summary reads an unconditional statement that CP is worse by a factor $L$ on any target. Verdict: item 6 violated.

2. `projects/manuscripts/bt-operator-theory/present/main.md:45`: "headline: 'The synthetic checks match the theory; the gap is an inductive-bias result'", with `:34` "plain: 'The numbers match the theory; the advantage is an inductive bias.'"; what is wrong: both lines now stand beside the rewritten free-profile equation, and the sources do not say the checks match that form. `code/synthetic_separation.py:29-30` builds the block-term class as "dimension d_BT = mu_band * K", the form README.md:83 corrects to a corollary, and `project.yml:22` lists "rerun the scripts" as still to do after the correction. The one check the slide quotes, L-gating at full overlap, agrees with both forms; the chip names four scripts. Failure scenario: a reader sees $R(L-1)K$ and "the synthetic checks match the theory" on one slide and takes the corrected theorem as verified, which no source states. Item 9: no statement or claim the sources do not make. Verdict: items 6 and 9 violated.

3. `projects/ideas/ssm-longitudinal/present/main.md:5`: "hook: 'HCCNet''s Transformer pads irregular follow-up to fixed steps; a state-space model uses the actual $\Delta t$ between scans.'", with `:20` "'Counts only if the continuous-time SSM beats the HCCNet baseline.'"; what is wrong: this deck is one of the 59, reported "No change". The hook states a fault of another project's model, which item 9 forbids; naming HCCNet is allowed as what the project builds on, stating its fault is not. It is the kind of line the step rewrote in physics-tensor-hcc for the stated reason "The before line stated a fault of a paper and named another project's result", and the report's judgment calls list this deck only as naming a model it replaces. The manuscript of the named model also reads otherwise: `manuscripts/hccnet-revision/manuscript/sections/3_methodology/b_architecture.tex:21` replaces the sequence position with the elapsed time. Failure scenario: a reader of the deck takes it as fact that HCCNet discards the scan intervals, which its own paper does not do. Verdict: items 8 and 9 violated.

4. `.scratch/migration/agents/reviews/O176-report.md:521-532` and `:701`: "The two read-only shell searches of the C8 table are commands of `grep`, `sed` and `cut` in a loop, printing to a log in `.agents/scratch/`"; what is wrong: a script written for the step that the brief does not build. The brief's "Paths this step writes" allows only the case-run programs C1, C3 and C9 name, and any other script needs the user's approval quoted from a line of `plan.md`'s Rulings. A grep of `plan.md` for lines naming O176 and a script or a search prints none. The report names it and offers to redo the table by hand, which does not close it under the skill's "Finding dispositions": it goes to the user as an open item and nothing it produced is used until the user rules. Failure scenario: the C8 table's number column, the output of this script, is accepted as the proof of "no change" for the 54 decks left unchanged. Verdict: C8 partial.

5. `.scratch/migration/agents/reviews/O176-report.md:652`: "sandpile-operator, engram, glassbox, hccnet-fl, covert-applied, phd-thesis, block-term-tensor-regression, go-bttr, fbttr-strategies, abduction, loewner, fed-faithful-ecg, clinical-ai-eval-artifacts, xsub-ecog-framework | the cut lines the refuter names | detail or a plan; each deck's limit lines stand"; what is wrong: item 5 asks for every listed fact left off with why. This row gives one reason for 14 decks and names no fact of any of them, although the O151 refuter's section names facts for several (hccnet-fl's heterogeneity axes, FedSL 0.402 against 0.701; block-term's significance and non-difference lines; glassbox's dead ends; phd-thesis's Granger precision). Failure scenario: the orchestrator reads the table as the test having been applied per fact, and a fact that limits a headline in one of these decks stays off unseen. Verdict: item 5 violated.

## 2. Proof

1. `.scratch/migration/agents/reviews/O176-report.md:564` and `:711`: the pfl-ms-npj row, "10=T:18 11=T:18 ... 27=T:22 ... 32=T:23 ... 42=T:25", with the limitation "the location is of the digits only"; what is wrong: C8 asks for "the source file and line of each number on the slide". `pdftotext -layout` of the deck's `manuscript/main.pdf` shows T:18, T:22, T:23 and T:25 are author-affiliation lines, so the digits are superscripts; the slide's "32 country clients", "42-input MLP" and "27% longer" are not at those lines. The report states the limit in place of fixing it, which the rules file names a shortcut. The decision that rests on it: the "No change" verdict of each deck in the table. Failure scenario: a reader following the citation to confirm "32 country clients" lands on an author list, and a wrong number on such a slide would have passed the same search. Verdict: C8 partial.

## 3. Standards

none

## 4. Behaviour

none

## Declined to judge

- The fit of every slide at 16:9, C10: the orchestrator's measured fit and the look; a read cannot settle it.
- The 59 decks, line by line: read whole were faithful-block-term-layer, http2-web-performance, pfl-ms-npj, hccnet-pathology, concept-bottleneck-hcc, serial-ecg-af, cirrhosis-digital-twin, ssm-longitudinal, plus the four changed by item 8 and source-localization. For the others I ran one read-only sweep of each deck's numbers of two characters or more against its README, manifest and manuscript text; it printed only values the report traces by rounding or from the render (bachelor-network-ids, icfp-src-poster, masters-algebraic-subtyping, pfl-ms-npj) and old-charges' 1390, which stands as "c.1390". The sweep shows a number exists in the source, not that it means what the slide says; those decks' meaning was not read.
- icfp-src-poster's chart values from a render of `manuscript/main.pdf`: rendering writes an image file, and this review edits no file; `pdftoppm` output read as an image would settle it.
- Images not opened: ebttr_fig, dongho_silhouette, fig_simulation, figure_outline, image10; their panels were read against the manuscript text only.
- The report's two shell searches were not rerun in their own form: they need a per-deck `$src` list the report does not give, and they are the subject of Spec 4.
- The report's `git diff -U0` and `git diff --numstat`, which name no base, were not run in that form; `git diff 76cf0c5f9 -U0` and `git diff 76cf0c5f9 --stat` were, and give the same totals and the same `equation` lines. The report's claim that `git status --short` from the oculus worktree printed nothing before the report was written cannot be reproduced now that the report exists. One `git status --short` of mine was run through `git -C <hub worktree>`.
- Whether the facts of the O151 refuter's list that the report leaves off individually meet item 5's test: read for ward, ecg-readable, hccnet-fl and bt-operator-theory, with bt-operator-theory's raised in Spec 1; the rest is a reading of what the row in Spec 5 should enumerate first.

Usage: a1215ab627588ef2f, claude-opus-5-5, 324381 tokens, 44 tool uses, 523 s

## Closed

- Spec 1, Spec 2, Spec 3 and Spec 5: repair round 1 (`agents/briefs/O176-round-1.md`).
- Spec 4 and Proof 1: the table of C8 is made again by reading in repair round 1, with nothing the two shell searches printed; Spec 4 is raised as open item 736.

## Repair round 1, refuted

Review of O176 (the decks repaired after O151), over repair round 1, whole diff since base 76cf0c5f9. Nothing was changed.

Open against the step: items 2, 6, 7 and 9 are violated, C2 is partial. Spec 1 and Spec 2 are the ones that matter: round item 1 said nothing leaves a slide unless it moves to the other slide, and text left slides for good. C10 is not verifiable here and is the session's measurement at landing.

VERDICT PER ITEM (brief)

- Item 1: holds. 15 figures on slides by C1, the round moved them where the text left no room; the 12 others stand on no slide. Captions read against sources (sandpile code/README.md:16, README.md:27; source-localization main.tex:179; block-term bare_jrnl.tex:824; meseret main.tex:300).
- Item 2: violated (Spec 3).
- Item 3: holds.
- Item 4: holds. bt-operator-theory 'Checks' chip; raw-pls 'representation moves 3%' main.tex:630, :651; bttn main.tex:307, :317-319.
- Item 5: holds. The facts stand on the decks. Rows sampled and true: loewner :15, :16, :18-20; fed-faithful :13, :15, :18; clinical-ai-eval :18; xsub :14, :18; hccnet-fl :18; covert-applied README.md:34 (24x, 8x); block-term :19; sandpile :20.
- Item 6: violated, minor (Spec 4). The headline closure holds: 'On band-structured targets' (bt-operator-theory main.tex:53, :373).
- Item 7: violated (Spec 1, Spec 2, Proof 1).
- Item 8: holds. C8 was remade; author-line citations are gone. Sampled in place and meaning, all correct: pfl-ms-npj T:72, :115, :232, :252, :353-354, :488, :549, :563; concept-bottleneck-hcc R:11, :22; serial-ecg-af R:3, :11, :21, Y:17; proprioception-exoskeleton T:13, :23-27, :98, :124, :138, :180.
- Item 9: violated (Spec 4, Spec 5).

VERDICT PER ROUND ITEM

- Round 1, every slide fits: violated on "nothing is taken off a slide to make room unless it moves to the deck's other slide" (Spec 1, Spec 2, Proof 1). The 22 listed slides are each addressed (the report's 22 lines equal the round brief's list). Figures moved as ruled. Fit itself is declined below.
- Round 2, bt-operator-theory headline: holds.
- Round 3, bt-operator-theory synthetic checks: violated, minor (Spec 4). The class is now stated correctly: all four scripts check the band-constrained class (code/synthetic_separation.py:29-30, four_format_ordering.py docstring, proportional_regime.py d_BT = mu_band*K, depth_amplification.py profile on its band only).
- Round 4, ssm-longitudinal hook: holds. Hook from its README "What it is and why", :20 from "Next" items 1-2; no fault of HCCNet is stated; 'fixed-step Transformer' stands only as an ablation arm.
- Round 5, C8 table: holds, by the sampling above and a read-only sweep of slide numbers against each table row (59 rows; 23 decks have digits absent from their row, all digits of names or labels such as CODE-15, BEAST 2, 2 Hz, $L=1$, 3D, or rounded forms).
- Round 6, facts left off: holds. One row per fact for the 14 decks.

Rulings of "O176 decks": 13 equations stay and none is restored; 15 figures restored and 12 left off; a second slide by need; projects/active/novel-math-primitives and projects/ideas/ecg-af-fair are not in git status. All hold.

VERDICT PER CASE

- C1: met.
- C2: partial (Spec 3). 13 equations and the integrity test pass; eight equation diff lines stand against "only bt-operator-theory".
- C3: met. 74 decks of one slide, 19 of two, none other.
- C4: met.
- C5: met.
- C6: met.
- C7: met as written ($\mu_{\mathrm{band}}$ stands only at bt-operator-theory present/main.md:19, the corollary line).
- C8: met by sampling (see Round 5).
- C9: met. 36 lines repeat across decks: spec labels, tag text, status values, author lists, venue strings, three shared sub titles; no hook, headline, method or result line.
- C10: not verifiable (see Declined).
- C11: met by reading, except meseret-cirrhosis (Spec 1).

CHECKS RERUN

- C1, C3: source lines 110-191 of O176-report.md through `node --no-warnings --input-type=module - <hub worktree>` from the oculus worktree: 15 C1 lines, each "exists true"; decks: 93; figure lines: 15; two-slide decks: 19; faults: 0.
- C9: report lines 197-258, same way: lines repeated across decks: 36.
- C2, hub worktree: `grep -rl --include=main.md '^equation' projects | wc -l`: 13. `git diff 76cf0c5f9 -U0 | grep -E '^[-+]equation'`: eight lines (bt-operator-theory, hccnet-revision, meseret-cirrhosis, raw-pls, one - and one + each).
- C2, oculus worktree: `OCULUS_TEST_HUB=<hub worktree> npx vitest run tests/checks/config/integrity.test.ts -t "deck|equation|portfolio"`: Test Files 1 passed (1); Tests 7 passed | 7 skipped (14).
- `npm run test:quick`, TMPDIR unset: ok ASCII gate; ok svelte-kit sync; ok svelte-check 591 FILES 0 ERRORS 0 WARNINGS; every command passed. It selected 0 test files (3 changed files, none a test), so it covers no deck content. The report's 56.8 s and "verify-exit=0" are not what this command printed here (13.3 s, no such line); no decision rests on either.
- Character set, report: LC_ALL=C perl gate, 0 lines. Decks: four lines, the place name Link<o-umlaut>ping (modality-dropping-btf:10; hccnet-fl-sweden:4, :11, :19).
- `git status --short`, hub worktree: 25 paths, all " M", all */present/main.md. Oculus worktree: 3 untracked ledger files (briefs/O176-round-1.md, reviews/O176-refuter.md, reviews/O176-report.md).
- katex.renderToString with throwOnError:true on the three gathered equations, displayMode true and false: all parse.

SPEC

Spec 1. projects/manuscripts/meseret-cirrhosis/present/main.md:1-20 (first slide; lines `sub:`, `hook:`, `eli5:` removed). O176-report.md:851 says "removed; carried by the title and the first two results", :785 says "Nothing was dropped to hide it".
What is wrong: the round brief says "nothing is taken off a slide to make room unless it moves to the deck's other slide" and "nothing is dropped to hide it". No line of the deck carries "A patient still alive at the last visit is not a negative case; models that respect this track each patient's true risk" or "Give patients a time-resolved risk of dying and of receiving a transplant" (sources: manuscript/main.tex:39, :45), nor the paper's title line in `sub`. It is the only deck among all projects/**/present/main.md whose first slide has no sub, hook or eli5 (read-only glob). The report's first line still estimates the slide at about 40 lines against 37, and the disclosure at :735 names only second-slide `sub` and `eli5` rows, so this removal is not covered by it.
Failure scenario: a reader of the slide never learns why a status label is wrong for censored data, and the slide may still run over.

Spec 2. Second-slide `sub` and `eli5` removed in bttn-incident-af, dries-bttr-ecg, ward-bttr-crosssubject, raw-pls, clinical-hccnet and linfoot-estimator (sub and eli5), hccnet-revision (eli5). O176-report.md:735 discloses them and says the brief's sentence "could be read to cover them".
What is wrong: the brief forbids removal without a move, and for slides over by 10% or less it says "every fact, number and qualifier kept". Concretely, projects/manuscripts/bttn-incident-af/present/main.md:29-41: `sub` 'Occlusion on held-out MIMIC-IV data, external cohorts and dead ends' is gone; O176-report.md:809 says "title and result lines of slide 2 carry it", yet no line of slide 2 says held-out (source: manuscript/main.tex:328 "in held-out inputs", :333 "on held-out MIMIC-IV data").
Failure scenario: a reader cannot tell the occlusion map was read on held-out data.

Spec 3. projects/manuscripts/hccnet-revision/present/main.md:39, meseret-cirrhosis/present/main.md:37, raw-pls/present/main.md:38: `equation: '\begin{gathered}...'`, the separator `, \quad` dropped in two. O176-report.md:736: "could be read to forbid it; no term changed".
What is wrong: brief item 2 says "Equations stay as they are" and C2 expected only bt-operator-theory's diff lines; no item or round item asks for this. Terms are unchanged and KaTeX parses them (rerun).
Failure scenario: three equations of the deck are reformatted against a stated rule of the step, and C2's check no longer holds as written.

Spec 4 (minor, fixable at landing). projects/manuscripts/bt-operator-theory/present/main.md:34 'The scripts check the band-constrained form; the free-profile rerun is still to do.', :43 headline with the same words, :30 'Four self-contained synthetics check the paper''s Gaussian model on the band-constrained block-term class.'
What is wrong: project.yml `next:` says "rerun the scripts" after correcting Theorem 1; no source says "free-profile rerun" or that the rerun will check the free-profile class. Line :30 names the Gaussian model as the thing checked, where CLAUDE.md and the `reproduced` note say the scripts reproduce the paper's synthetic numbers "from the paper's own Gaussian model".
Failure scenario: a reader takes as stated that a free-profile check is planned, and takes the Gaussian model as what is verified.

Spec 5. projects/active/linfoot-estimator/present/main.md:14 `{ label: 'Backbone bias ratio', value: '2.13 to 1.65' }`, moved by the round from slide 2 to slide 1 (O176-report.md:845 "unchanged, on slide 1").
What is wrong: README.md:61 calls it "fine to broad ratio" (rms bias of finest bin against broadest bin, 60k-example model against 480k-example model, in the closed Phase 3 operator-backbone gate, README.md:52-63). The term is not the source's, and on slide 1 no line mentions a backbone; the explaining line 'an operator backbone, not built' stands on slide 2, :39.
Failure scenario: a reader takes it as a bias improvement of the presented estimator's backbone.

Spec 6 (minor). projects/manuscripts/ward-bttr-crosssubject/present/main.md:14 chip 'Cursor cohort, n = 4' moved to slide 1 while its limit 'Cursor cohort: no significance claim, one patient goes the other way.' stays at :36 on slide 2; body.tex:838-840 states them together.
Failure scenario: a reader of slide 1 reads 76.7% against 7.9% with no limit beside it.

PROOF

Proof 1. O176-report.md:787 "Each after states the same fact as its before", with :809 and :851 "carried by". Not reproduced for bttn-incident-af's "held-out" and meseret-cirrhosis's eli5 and sub (Spec 1, Spec 2). The decision resting on it is whether the removals are lossless, which is what round item 1 required. Failure scenario: the removals are accepted as lossless and the facts stay off.

STANDARDS

none

BEHAVIOUR

none

DECLINED TO JUDGE

- Fit of every slide at 16:9 (C10): the session's measurement on a scratch server at landing. By reading, the figure-with-equation second slides (bttn-incident-af, hccnet-revision, meseret-cirrhosis, raw-pls, ward-bttr-crosssubject, linfoot-estimator) are not plainly over-long. meseret-cirrhosis slide 1 is over by the builder's estimate, not by a measurement.
- 59 unchanged-content decks: read whole only for ssm-longitudinal and those the round changed; meaning sampled in four (pfl-ms-npj, concept-bottleneck-hcc, serial-ecg-af, proprioception-exoskeleton); the others by the digit sweep only.
- icfp-src-poster chart values and the images themselves: no render and no image opened; ebttr_fig, gobttr, image10, dongho_silhouette, fig_simulation and figure_outline were read against text only.
- The report's `git diff -U0` and `--numstat` with no base were run only as `git diff 76cf0c5f9`.
- linfoot-estimator "runs in progress": read against the worktree's README.md:253 and plan. The main checkout holds uncommitted holdout results (results/holdout/, results/holdout_comparison.md), which are not a committed source and were not used to judge the line; if they are final at landing, that line is stale.

Usage: a99b12ed7f73ef95a, claude-opus-5-5, 101002 tokens, 56 tool uses, 773 s

### Closed (repair round 1, refuted)

Every finding was fixed at landing in the hub worktree; none was sent to the builder.

- Spec 1 (meseret): the first slide's `sub`, `hook` and `eli5` restored from the base; both figures in the second slide's `panels`. Seen at the look.
- Spec 2 (second-slide `sub` and `eli5` removed): each was checked against what the deck still carries; bttn's second hook says held-out.
- Spec 3 (equations): hccnet-revision, raw-pls and meseret restored to the base. `git diff 76cf0c5f9 -U0 | grep -E '^[-+]equation'` prints only bt-operator-theory's pair, which follows its README.
- Spec 4 (bt-operator-theory): hook, plain line and headline say the rerun after correcting Theorem 1 is still to do; the free-profile tie stands on the second slide.
- Spec 5 (linfoot label): the fact reads "gate: fine to broad bias ratio 2.13 at 60k examples, 1.65 at 480k" in the second slide's Closed line.
- Spec 6 (ward): the cursor chip carries "no significance claim, one patient goes the other way".
- Proof 1: follows Spec 1 and Spec 2, closed with them.
