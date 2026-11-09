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
