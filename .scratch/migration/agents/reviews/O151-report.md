# O151 report, a deck for every research project and the facts strip

The round 2 items are built; the compromises in what was built stand first in "# Round 2" at the end of this file, and that section holds where an earlier section differs from it, since rows above it state rounds 0 and 1. C9 is the orchestrator's.

## Open items of the state file, verbatim

The section `## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)` of `.scratch/migration/orchestrator-state.md:204-206` holds no entry, only its rule: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## The rulings this step was built under (round 0, `.scratch/migration/agents/briefs/O151-cases.md`)

1. Item 1 is read as Reading B: no cross-reference, "see also" or comparison with another project, and no framing through a student project; a method, model or paper the project's own manuscript or manifest names as what it builds on, applies, extends, proves a theorem about or compiles is named as those sources state it. The covert pair never name or describe each other, and covert-theory's deck uses the name COVERT only where its own manuscript does.
2. No second slide of `kind: equation`.
3. The dot is `0.75em` of the strip's value size: 9 px at the design size, 8.25 px under `body.rice`, listed below as a reversible decision.
4. One-word tag texts and spec labels that name a kind count as facts true of each deck, listed; sentences are never repeated.
5. `integrity.test.ts` is not changed; the time of the deck row and the load average are reported on each run.

## The cases' first run (unchanged trees)

Every run quoted in this report was made from inside the oculus worktree, with every program, output and temporary folder in `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/.agents/scratch/` and `TMPDIR` set to it; that folder is deleted before hand-back, so each program's source is quoted whole in the appendix at the end of this report. `research.txt` there holds the 95 manifest paths, from `cd <hub worktree> && grep -l -x 'tier: research' $(find projects -name project.yml -not -path '*/.agents/*') | sort` (95 lines).

The unchanged hub was rebuilt for this run as `.agents/scratch/hub-base2`: `rsync -a --prune-empty-dirs --exclude='.agents/' --exclude='.git' --exclude='*/present/***' --include='*/' --include='project.yml' --include='.oculus/***' --include='deck/***' --exclude='*' <hub worktree>/ hub-base2/`, then each of the 25 non-empty `present/` folders of the hub base copy `/Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base` copied in (`find projects -type d -name present ! -empty`: 25; `-empty`: 70). It holds the manifests, the hub's `.oculus/` and `deck/` folders and the 25 base decks, and no README or manuscript; the hub worktree has no `present/` folder outside the 95 (`find . -type d -name present`, 95 lines, all in the research list).

- C5: `node c5.mjs hub-base2 research.txt` printed "folders with present.yml: 25 of 95"; 70 lines read "NO present.yml (no present/ folder)". All 25 decks hold 1 slide. "FIRST SLIDE NOT kind: project" on fed-faithful-ecg and ecg-readable-substrate (`kind text`, "keys: (none); body") and on the nine idea stubs btd-autoencoder, clinical-ai-eval-artifacts, ecg-af-fair, fl-privacy-auditing, florank-personalization, hccnet-fl-sweden, hccnet-pathology, quantum-tensor-fl, ssm-longitudinal (`kind idea; UNTITLED`, "keys: desc"). "SHAPE: extra: not a project key" on btfno and covert-applied; "SHAPE: results: not a list of text" on bttn-incident-af. No control character. The program checks the required keys only where the project folder holds a README or a manuscript, which `hub-base2` does not; read from the base decks, dongho-ecg-clustering, dries-bttr-ecg, hccnet-revision, meseret-cirrhosis and ward-bttr-crosssubject have no `eli5` (their key lists above, from the same run, show it absent).
- C6: from the oculus worktree root, `OCULUS_TEST_HUB=.agents/scratch/hub-base2 TMPDIR=.agents/scratch npx vitest run tests/checks/config/integrity.test.ts -t "deck|equation|portfolio" --reporter=verbose` printed "Tests 7 passed | 7 skipped (14)"; the real-hub rows: "reads a deck out of every project that has a present/ folder, with no finding 1513ms", "reads an equation out of every slide that writes one, as LaTeX that typesets 311ms", "reads the portfolio deck with every named deck found 61ms". `uptime` load averages before 4.89 7.30 7.24, after 5.79 7.41 7.28.
- C8, by reading the base copy `/Users/axelfaes/workspace/oculus/.agents/worktrees/O151-base`: values `font-size: var(--slide-fs-small)` (`Facts.svelte:165`), `--slide-design-small: 18px` (`slide.css:21`, 17px under rice at `:68`), labels `--fact-label: 0.72em` (`Facts.svelte:158`, used at `:222`), the dot `--dot-size: 0.5em` (`:161`). At the frame's factor 1: values 18 px and labels 12.96 px at text size 1; 17 and 12.24 under rice; 27 and 19.44 at 1.5; 12.6 and 9.072 at 0.7; 28.8 and 20.736 at 1.6; the dot 9 px. C8's values were not met.
- C10: `node c10.mjs hub-base2 research.txt` printed "lines repeated across decks: 15": "Measured" (tag.text, 8 decks), "Validating" (btfno, raw-pls), the spec labels Cohort, Data, Eval, Model (3 decks each), Backbone, Input, Metric, Temporal (2 each), the BT-FNO equation in bt-operator-theory and btfno, and the body headings "## In plain words (ELI5)", "## Key results", "## The idea / method", "## Why it matters / what's next" in fed-faithful-ecg and ecg-readable-substrate.
- C1: clinical-ai-eval-artifacts was one `kind: idea` slide, desc 'Meta-science: many federated and clinical-AI gains are evaluation artifacts; a corrected protocol', no number.
- C2: phd-thesis had no `present/` folder, no README.md, `manuscript/thesis.tex` with 17 included files, and a manifest with `outcome:` and `publication.abstract:`.
- C3: ms-lipid-handshake and algebraic-subtyping had no deck; raw-pls was one project slide with 6 specs and 5 panels, naming no dead target of its CLAUDE.md.
- C4: `grep -n -i covert` hit covert-theory `main.md:7` ("sub: COVERT, the convergence + privacy-utility guarantee") and covert-applied `main.md:7`, `:8`, `:43`, `:48`; covert-applied's `:48` compared it with HCCNet-FL.
- C7: the decks the step replaces were not traced, as the brief says. C9 is the orchestrator's.

## DONE / NOT DONE

All runs below are the runs of repair round 1, made after the round's last change, from the oculus worktree, with `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/.agents/scratch` except `npm run test:quick`, which ran with both unset. The programs were recreated in that folder from the appendix, unchanged.

| Item | State | Check and its output as printed |
|---|---|---|
| 1. A deck for every one of the 95 research projects, from the project's own sources | DONE | `node c5.mjs <hub worktree> research.txt`: "folders with present.yml: 95 of 95"; `grep -c -E 'DECK FAULTS/NO present/does not parse/REQUIRED KEYS ABSENT/SHAPE:/FIRST SLIDE NOT/CONTROL CHARACTER/SLIDE COUNT OUT' c5.txt` (the bars written as slashes here): 0. `diff -rq` per folder against the hub base copy (`sh diffrq.sh research.txt`): 95 folders, 0 "Only in base", 70 new decks (70 `main.md` and 70 `present.yml` only in the worktree), 25 replaced (25 `main.md` and 25 `present.yml` differ). Covert pair: see C4 under per deck. Hub `git status --short`: 143 lines (53 ` M`, 90 `??`); `grep -v '/present/'` of it prints 11 lines, the 11 `README.md` files of round 1 ruling 2 (3 ` M`: glassbox-decision-pipelines, btfno, ecg-readable-substrate; 8 `??`: abstract-bci-meeting-2021, fbttr-strategies, fermat, go-bttr, abduction, hcc-modality-poster, connectivity-motor-imagery, chi-household-survival); the other 132 are inside the 95 `present/` folders. |
| 2. Every slide right | DONE except the measured fit, which is C9, the orchestrator's | Slide counts from `c5.txt`: 45 decks of 1 slide, 50 of 2; second slides 33 `columns` and 17 `project`; `grep -c 'kind equation' c5.txt`: 0. `node fit.mjs <hub worktree> research.txt`: "slides: 145; slides over a fit rule: 0; slides with an equation key: 43". C6 (below): the deck, equation and portfolio rows pass with the floor `REAL_FLOORS = { decks: 14, equations: 13 }` (`integrity.test.ts:46`). `node c10.mjs`: "lines repeated across decks: 53", each listed below with the fact it states. Hub ASCII gate (the brief's command): only accented letters in names, five lines (St<e acute>phanie in linfoot `main.md:11`; Link<o diaeresis>ping in modality-dropping-btf `main.md:10` and hccnet-fl-sweden `main.md:4`, `:11`, `:19`). `node prose.mjs`: "hits: 20", each read: the 13 "spaced hyphen" hits are minus signs inside `equation` values or inline math (for example loewner `v - \eta`, linfoot `\sqrt{1 - e^{-2I(X;Y)}}`), and the 7 "first letter" hits, in 5 decks (phd-thesis 2, source-localization 2, block-term-tensor-regression, extended-bttr-note, abduction), are sentences that begin with a method name written lower-case first (eBTTR, eLORETA, mPSTD); no "no full stop", "double hyphen" or "filler word" hit. Every figure 23 of 23 `identical` (the `cmp -s` loop of `figcmp.sh`, run over the 23 pairs of "Figures copied": "23 identical"). Doubled apostrophes in a markdown body: an `awk` pass over the 95 `main.md` that prints every body line holding `''` printed nothing. |
| 3. The facts strip drawn below the slide's text | DONE | Read: `slide.css:27-30` declare `--slide-design-facts: 12px`, `--slide-design-facts-label: 10px` and `--slide-fs-facts`, `--slide-fs-facts-label` as each times `--text-scale` without the slide's fit factor; `:78-79` give 11px and 9px under `body.rice .slide-frame`; `Facts.svelte:162` `--dot-size: 0.75em`, the value and label `font-size` from the two new sizes, `--fact-label` gone (`git diff df5a42a49 -- Facts.svelte`). `git diff -U0` of `Slide.svelte`: one hunk, `@@ -33,10 +33,10 @@`. C8 below. Oculus ASCII gate over the three files: prints nothing (grep exit 1). |
| Verify 1: `npm run diagrams`, then `npm run test:quick` | DONE | `npm run diagrams`: exit 0, and `git status --short docs` printed nothing. `env -u TMPDIR -u GIT_CEILING_DIRECTORIES npm run test:quick`: exit 0, "test:quick: 11 changed file(s), from git since HEAD", "test:quick: 9 test file(s)", "ok prettier (0.8 s)", "ok ASCII gate (0.9 s)", "ok svelte-kit sync (2.9 s)", "ok eslint (2.4 s)", "ok svelte-check (9.0 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", "ok vitest checks (40.8 s)", "test:quick: 43.9 s; every command passed". It does not cover tests that reach no changed file within the import depth, as its own last line says. |
| Verify 2: ASCII gates | DONE | As in rows 2 and 3. |
| Verify 3: unused exports | DONE | `sh utils/unused-exports.sh` (333 lines) against `O151-base/unused-exports.txt`: `diff` prints nothing, exit 0. |
| Verify 4: paths | DONE, with seven paths that are not this step's | `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O151.md df5a42a49` printed `.scratch/migration/agents/briefs/O151-cases.md`, `.scratch/migration/agents/briefs/O151-round1.md`, `.scratch/migration/agents/briefs/O151.md`, `.scratch/migration/agents/guarded.md`, `.scratch/migration/agents/reviews/O151-refuter.md`, `.scratch/migration/agents/reviews/O151-source-check.md`, `.scratch/migration/agents/spec.md`. These are the ledger files the orchestrator copied into the worktree; this builder edits none of them, its only ledger file being `O151-report.md`. Hub `git status` and `diff -rq`: row 1. |
| Verify 5: C5, C6, C10 with sources and output | DONE | Outputs below and in the appendix; sources in the appendix. C6 after round 1's last change: `OCULUS_TEST_HUB=<hub worktree> TMPDIR=<scratch> npx vitest run tests/checks/config/integrity.test.ts -t "deck\|equation\|portfolio" --reporter=verbose`: exit 0, "Tests 7 passed \| 7 skipped (14)"; real hub: "reads a deck out of every project that has a present/ folder, with no finding 2399ms", "reads an equation out of every slide that writes one, as LaTeX that typesets 1201ms", "reads the portfolio deck with every named deck found 223ms"; `uptime` load averages before 5.98 8.46 9.82, after 6.95 8.59 9.85. `node katex.mjs`: "equations: 43; throwing: 0". |
| Verify 6: prose rule | DONE | Row 2 for the program's hits; the phrasing kept on purpose is under judgment calls. |
| C8 | DONE | Values 12 px and labels 10 px at text size 1; 11 and 9 under rice; 18 and 15 at 1.5; 8.4 and 7 at 0.7; 19.2 and 16 at 1.6; the dot 0.75 x 12 = 9 px at text size 1 (8.25 px under rice), by reading the lines in row 3. |
| C9 | Not the builder's | The orchestrator's measured fit and the look. |

## Per deck

### projects/ideas/clinical-ai-eval-artifacts (C1, replaced), 1 slide

- Files before (base copy): `present.yml`, `main.md`. After: the same two, both rewritten (`diff -rq`). No figure.

- Sources read: `README.md` 1-24, `project.yml` 1-19. No manuscript, no CLAUDE.md, no results file named.
- Manuscript root: none; the README is the first source.
- Numbers: "three studies already in hand" and "three in-hand studies" from `README.md:11` ("Synthesised from three existing pieces") (README, order 2); "at least one public benchmark" from `README.md:15` (README).
- The three in-hand studies are named by what they are and not by project: two of them are student studies, and the README itself (`:17`) says the paper is not framed as resting on them (ruling 1, no framing through a student project).
- No disagreement between sources.

### projects/archive/phd/phd-thesis (C2), 2 slides

- Sources read: `manuscript/thesis.tex` 1-193 and every file it includes: `chapters/preface/preface.tex` 1-19, `abstract/abstract.tex` 1-10, `abstractnl/abstractnl.tex` 1-11, `introduction/introduction.tex` 1-163, `chapter-2/chapter-2.tex` 1-336, `chapter-3/chapter-3.tex` 1-374, `chapter-4/chapter-4.tex` 1-561, `chapter-5/chapter-5.tex` 1-359, `conclusion/conclusion.tex` 1-109, `appendix-1` 1-194, `appendix-2` 1-37, `appendix-3` 1-73, `curriculum/curriculum.tex` 1-321, `publications/publications.tex` 1-33, `acknowledgement/acknowledgement.tex` 1-19; `project.yml` 1-31. `chapter-6.tex` is commented out (`thesis.tex:171`) and was not used. No README, no CLAUDE.md.
- Manuscript root: `manuscript/thesis.tex`, the file that includes the chapters; `main.pdf` and `thesis.pdf` beside it are its builds.
- Numbers, all from the manuscript (order 1): "February 2023" `thesis.tex:49` ("Februari 2023"); promotor `thesis.tex:36`; four papers `introduction.tex:131-136`, `publications.tex:7-33`; "3 subjects" `chapter-4.tex:296`; "8 bands", "10 time bins" `chapter-5.tex:217-218`; journals `chapter-2.tex:7`, `chapter-3.tex:7`, `chapter-4.tex:7`, `chapter-5.tex:7`; BTTR mean r 0.64 / 0.46 / 0.67 `chapter-4.tex:386`, `:408`, `:430`; AM 0.42 / 0.36 / 0.46 `:388`, `:410`, `:432`; about 3 min and about 14 h `chapter-4.tex:369`; about 5 min `chapter-5.tex:276`; middle finger 0.38 to 0.49 `chapter-5.tex:287-288`; spatial spread 113.16 and 199.47 `chapter-2.tex:186`; correlation 0.9234 and 0.9537 `chapter-2.tex:143`; 1.05 s and 68.05 s from 1.0459 and 68.0538 `chapter-2.tex:168-169`; precision 0.71 and 0.37 `chapter-3.tex:290`, `:294`; LightGBM 0.493 `chapter-4.tex:416`, its lead on subject 2 `:377`; repetition drop `introduction.tex:115`; 4 gestures and 5 patients `conclusion.tex:42`; r above 0.70 `conclusion.tex:73`; abduction not attempted `conclusion.tex:98`.
- Disagreement inside the manuscript: `introduction.tex:115` says BTTR reached "up to 90% Pearson correlation", while the BTTR tables (`chapter-4.tex:386-430`) top out at 0.77 per finger. The slides take the table numbers.
- The four papers and their methods are named because the thesis compiles them (ruling 1).

### projects/archive/failed/ms-lipid-handshake (C3), 2 slides

- Sources read: `README.md` 1-108, `project.yml` 1-15. No manuscript, no CLAUDE.md. The README says the numbers are committed in `code/results/` (`README.md:18`), a folder of 17 files, and states every number it relies on itself; the slides take the README's numbers (order 2).
- Manuscript root: none (never written up).
- Numbers (README, order 2): 632k nuclei, 156 samples `README.md:28`; 65 paired samples across 43 donors `:28`; slope -0.061, LRT p = 0.732 `:29`; rho -0.346, p = 0.005 `:31`; CI [-0.746, 0.143] `:32`; p < 0.05 criterion `:36`; Absinta 66k, Jakel 18k nuclei `:40`; RMSE 0.499 / 0.507 / 0.704 `:46-48`; uptake p = 0.013 `:56`; myelin p = 8.6e-7 `:65`; r = 0.252, CI [-0.900, 0.954], p = 0.258 `:67`; sweep `:69`; 5432 cells, slope -0.235, p = 0.0013, 40 genes, p = 0.15 `:71`; +0.30 / p = 0.002 and +0.003 / p = 0.27 `:73`. Headline "slope -0.06, p = 0.73" rounds `:29`, as the manifest `outcome:` (`project.yml:11`) and `README.md:78` write it.
- No disagreement: the manifest's CI [-0.75, 0.14] (`project.yml:11`) is the README's [-0.746, 0.143] rounded.
- Equation: the README's model `rebuild ~ export + stage + (1 | donor)` (`README.md:38`) written in LaTeX.
- Figure: `code/figures/within_cohort_macnair.png`, read: its title carries the slope -0.06 and p = 0.732 of `README.md:29`.

### projects/archive/stopped/algebraic-subtyping (C3), 1 slide

- Sources read: `project.yml` 1-12, the project's only source (no manuscript, no README, no CLAUDE.md). The folder's `todo.md` is not a source of item 1; it was opened, and nothing of it is on the slide.
- Manuscript root: none; the manifest gives `eli5` and `outcome`, and no `publication.abstract` or `results:`.
- Numbers (manifest, order 3): "2018" from `project.yml:10` ("Master's thesis (KU Leuven 2018)").
- Left out under ruling 1: the outcome's note that the Master's thesis and the CW708 report are published separately (`project.yml:10`) points at two other projects of the hub, a cross-reference the ruling removes; the slide says what came out here, no standalone paper.

### projects/manuscripts/raw-pls (C3, replaced), 2 slides

- Sources read: `manuscript/main.tex` 1-826 (no `\input`), `README.md` 1-94, `RESULTS.md` 1-85 (named by `CLAUDE.md:3` and `README.md:9`), `project.yml` 1-53, `CLAUDE.md` 1-26 (facts only).
- Manuscript root: `manuscript/main.tex`, `\journal{Pattern Recognition}` (`:14`), the text under review (`project.yml:17`); `manuscript/submitted-media-2026-10-22/main.tex` is the earlier MedIA submission and `supplementary.tex` holds the proofs only, so neither is the root.
- Numbers (manuscript, order 1): n=1181 `main.tex:395`, n=368 `:399`; K=16, S=5, J=25 `:429-430`; 4000 voxels, four channels `:406-408`; rank 6, $\lambda$ 0.1 `:339-340`; structural 0.086, CI [0.069, 0.105], -0.267, +0.354, p 1.8e-15 `:456-458`; DeepSets -0.337, Set Transformer -0.007 `:456-457`; grade 0.935, 0.834, +0.101, p 7.6e-10, DeepSets 0.890, Set Transformer 0.734 `:486-489`; AUPRC 0.975, prevalence 0.793 `:489-490`, `:518`; radiomics margins +0.030, +0.053, +0.039, +0.012 `:561-564`; 120 lesions `:626`, 3% at $\eta$ 0.427 `:630`; 4.2e-16 and 1.40 `:618-619`; seven regimes `:602-604`; synthetic 0.67 `:445`; guarantees `:139-141`; equation `:271-274`. Dead ends from the README and its results file (order 2): MGMT AUC 0.50 against 0.53 `RESULTS.md:15`, `README.md:32`; survival -0.087 against -0.049 `RESULTS.md:36`, `README.md:33`; empirical consistency flat in three attempts `README.md:34`, `RESULTS.md:81`, `CLAUDE.md:11`; four external datasets with no clean win `README.md:88-93`.
- Disagreements: (1) the standard deviations: `project.yml:24` gives struct +/- 0.023 and `:25` grade +/- 0.010, the manuscript `main.tex:456` +/- 0.029 and `:486` +/- 0.005 (`README.md:80` records the recomputation); the slides give the manuscript's CI and no SD. (2) The learning rate: `CLAUDE.md:18` says lr=0.005, `main.tex:339` and `:431` say 0.003. (3) `CLAUDE.md:6` says "NOT submitted", `project.yml:17` and `README.md:7` say submitted to Pattern Recognition; the slide follows the manifest and README since the manuscript does not state it. (4) `RESULTS.md:76` writes "the more registration, the WORSE", which `README.md:7` retires and `main.tex:575` replaces with "Registration is not intrinsically counterproductive"; the manuscript's own figure `fig3_registration.png` (= `present/registration_baseline.png`, `cmp` equal) still carries "more registration HURTS more", so that figure is kept on disk and not drawn. (5) The reproduction note `project.yml:20` gives grade AUC 0.932 on the rebuilt cache against 0.935; the slides take 0.935.
- Files before (base copy): `present.yml`, `main.md`, `eq_rawpls.png`, `rawpls.png`, `rawpls_method.png`, `registration_baseline.png`, `saliency_ortho.png`, `saliency_patients.png`, `synthetic_upgrades.png`. After: the same nine files plus `fig2_results.png`. Kept and drawn: `synthetic_upgrades.png` (`cmp`-equal to `manuscript/figures/fig5_synthetic_upgrades.png`, the current Figure 5). Kept and not drawn: `eq_rawpls.png` (the equation is front matter now), `rawpls.png` and `rawpls_method.png` (from the first synthetic go/no-go, numbers no longer the manuscript's), `registration_baseline.png` (disagreement 4), `saliency_ortho.png` and `saliency_patients.png` (one panel per slide, and the interpretability is a supporting claim `main.tex:679-680`).

### projects/manuscripts/covert-theory (C4, replaced), 2 slides

- Sources read: `manuscript/main.tex` 1-1022 (single file, no `\input`), `README.md` 1-67, `project.yml` 1-48, `CLAUDE.md` 1-27 (facts only). No results file is named; the SYN-1 numbers are the manuscript's macros.
- Manuscript root: `manuscript/main.tex`, the only `.tex` of the folder, IEEEtran journal class (`:1`), submitted to IEEE TSP (`project.yml:21-22`).
- Numbers and claims (manuscript, order 1): no-go `main.tex:276-282`; gradient-error constant free of $\prod_n I_n$ `:319-324`; the equation and (a)/(b) `:338-349`; dimension-free excess risk `:401-420`; party-count independence `:457-468`; order-optimal in $(c,\varepsilon)$ `:589-611`; generic floor constant `:675-676`; no rate to the floor, whole-sequence only at $\sigma=0$ `:687-692`; factor recovery not claimed `:138-139`; "first" claim `:73-75`; SYN-1 1.00, 1.03, 0.97, 1.1, 20 seeds `:28-32`, `:714-743`; 100x `:719`, `:743`.
- C4: `grep -n -i covert` over `present/main.md` and `present/present.yml` prints nothing (exit 1); `grep -c -i covert manuscript/main.tex` prints 0, so the deck uses the name nowhere. Left out under ruling 1: the README's description of the applied paper and its author list (`README.md:3`, `:7`), the go/no-go probe that compares against the applied method and P3LS (`README.md:31`), the multilinear-accuracy dead end, which is about the applied paper (`README.md:39`), and the AAAI energy going to BT-FNO (`README.md:37`, `CLAUDE.md:10`). The dead ends that belong to this paper are on slide 2: the $(c,\varepsilon)$-only scope (`README.md:38`) and the generic floor with no separation (`README.md:37`).
- Disagreements: (1) the validation figure's caption says the excess risk is flat across a "$1000\times$ range" (`main.tex:768`, and its plotted coordinates run 1e2 to 1e5, `:763`), while the text, the table and `README.md:29` say a $100\times$ increase (`:719`, `:743`); the slide takes the text and table. (2) The old deck's tag text "TMLR" names a venue `README.md:40` records as dropped; `project.yml:15` names IEEE TSP.
- Files before (base copy): `present.yml`, `main.md`, `eq_coverttheory.png`. After: the same three. `eq_coverttheory.png` is kept on disk and not drawn (the equation is front matter); the manuscript has no image figure (its one figure is pgfplots, `main.tex:750-770`), so no panel is drawn.

### projects/manuscripts/covert-applied (C4, replaced), 2 slides

- Sources read: `manuscript/main.tex` 1-1090 (single file, no `\input`), `README.md` 1-69, `project.yml` 1-49, `CLAUDE.md` 1-26 (facts only). No separate results file; the numbers are the manuscript's result macros (`main.tex:40-136`).
- Manuscript root: `manuscript/main.tex`, elsarticle (`:1`), the Neurocomputing submission (`:4`, `project.yml:15`).
- Numbers (manuscript, order 1): 5,000 inpatients, 14.1%, 3 parties `main.tex:46-50`; 400 studies, 163 patients, 17 positives, 2 parties `:51-52`, `:115-118`; MIMIC 0.745 / centralized 0.745 / P3LS 0.743 / concat 0.745 / single 0.721 `:55-65`; HCC 0.585 / P3LS 0.549 / single 0.572 `:67-76`; TOST +0.0014 [+0.0001, +0.0026] `:120-123`; +0.036 [+0.019, +0.053] `:868-869`; +0.024 `:872`; 87%, 0.20 vs 4.8 MB, 24x `:81-86`; rank 0.745 at L=1..4 `:98-101`; 38.1 MB `:109-112`; 0.95 vs 0.34 `:127-128`; DP 0.748 at 0.23, 0.711 at 4.8, 0.669 `:130-134`, `:762-767`; no-go `:524-535`; equation `:471-475`; single-source limitation `:995-997`. From the README (order 2), where the manuscript gives no figure: concat ties with p = 0.31 `README.md:42`; HCC single-party gap p = 0.64 `README.md:21`; the logistic link `README.md:43`.
- C4: `grep -n -i 'covert\|theory\|private coupled\|PCD\|TSP\|HCCNet-FL'` over the deck hits only `main.md:3`, `main.md:45` and `present.yml:2`, each the project's own name COVERT, which its manuscript uses throughout. The old `extra:` block comparing it with HCCNet-FL is gone (ruling 1). Left out under ruling 1: `README.md:3` and `CLAUDE.md:6` on the sibling paper, and `README.md:21` "matches HCCNet".
- Disagreements: (1) `CLAUDE.md:6` names IEEE J-BHI and says the manuscript holds placeholder numbers (0.887 / 0.828) against measured 0.783 / 0.635; the manuscript holds 0.745 / 0.585 (`main.tex:55`, `:67`), and `README.md:7` calls those the from-scratch values. (2) `README.md:3` says submitted to AIIM; `README.md:69` and `project.yml:15` say desk-rejected there and submitted to Neurocomputing. (3) `CLAUDE.md` gives the DP sensitivity under replace-one-party adjacency and an IEEEtran build; the manuscript uses replace-one-patient adjacency (`main.tex:749-750`) and elsarticle (`:1`). (4) The manuscript's own abstract says "an order of magnitude" (`:185`) for the measured 24x (`:86`); the slide gives 24x.
- Files before (base copy): `present.yml`, `main.md`, `eq_covert.png`. After: the same three. `eq_covert.png` is kept on disk and not drawn. The manuscript's four figures are PDFs (`manuscript/figures/*.pdf`) and the folder holds no png/jpg/svg (`find . -name '*.png' -o -name '*.svg' -o -name '*.jpg'` outside `present/` prints nothing), so no panel is drawn.

### projects/ideas/adapter-format-theory, 1 slide (new)

- Sources read: `README.md` 1-54, `project.yml` 1-23. No manuscript, no CLAUDE.md, no results file.
- Manuscript root: none (`README.md:19`: no code, no runs, no manuscript).
- Facts (README, order 2): four formats `README.md:3`; gate and null `:51`, `project.yml:17`; open slots `:9-13`, `project.yml:19-20`; FacT, AdaLoRA, NOAH `:25-27`; Khavari and Rabusseau 2021 `:28`; venue JMLR `:3`, `project.yml:15`; stage de-risking `project.yml:2`. No number is on the slide beyond the 2021 year of that paper.
- Left out under ruling 1: the README's naming of three other hub projects (`README.md:3`, `:7`, `:19`, `:45`, `:53`; `project.yml:11`, `:22`). The method it carries over is described ("a format risk ordering proved for spectral operators", from `project.yml:16`) without naming the project.
- No tag: the sources state no evidence yet.
- No disagreement.

### projects/ideas/asthma-geo-tensor, 1 slide (new)

- Sources read: `README.md` 1-25, `project.yml` 1-16. No manuscript, no CLAUDE.md.
- Manuscript root: none.
- Facts (README, order 2): exposures and tensor `README.md:7`, `:11`; novelty unverified `:11`; no data `:15`; the gate `:21`; stage nascent `project.yml:3`. No number.
- No tag: no evidence yet. No disagreement.

### projects/ideas/attention-scoped-instructions, 1 slide (new)

- Sources read: `README.md` 1-82, `project.yml` 1-23. No manuscript, no CLAUDE.md.
- Manuscript root: none (`README.md:31`).
- Facts (README, order 2): the mechanism `README.md:21`, the theorem `:21`, `project.yml:17`; four candidates `:19-27`; d 0.63 `:11`; 36.2% `:13`; occupied work `:37-47`; the kill-check and the fallback to candidate 4 `:76`, `project.yml:15`; stage scoping `project.yml:2`; venue ICML `:13`. The README calls the entry "holding" (`:3`) and the manifest "paused" (`project.yml:12`); the slide says paused, the two words state one status.
- No tag. No disagreement.

### projects/ideas/block-term-nca, 1 slide (new)

- Sources read: `README.md` 1-57, `project.yml` 1-20. No manuscript, no CLAUDE.md.
- Manuscript root: none (`README.md:30`).
- Facts (README, order 2): block structure `README.md:9`; gate systems `:54`, `project.yml:15`; ISLES24 and 87 patients `:39`; baselines `:50`; CP-rank at most $RL$ `:34`; six searches `:43`; the stop rule `:54`. 
- Left out under ruling 1: the comparison with the sandpile-operator project (`README.md:35`) and the related projects of `project.yml:9`.
- No tag. No disagreement.

### projects/ideas/brecht-fl-partitioning, 1 slide (new)

- Sources read: `README.md` 1-23, `project.yml` 1-17. The thesis PDF in `notes/thesis/` (`README.md:7`) is outside item 1's source list (no `manuscript/` folder) and was not opened; the README states the results it relies on.
- Manuscript root: none.
- Numbers (README, order 2): six partitioners `README.md:7`; $\alpha$ = 0.1, classes S and F `:11`; about 83% `:12`; matching the centralized baseline `:13`; one dataset and FedAvg as limits `:21`; novelty unverified `:17`.
- Authorship from `lead` and the manifest: the project is a Hasselt master's thesis co-supervised by Axel (`project.yml:13`, `README.md:7`); the slide says so in a spec, which states what the project is. Left out under ruling 1: the folding into clinical-ai-eval-artifacts (`README.md:3`, `:17`, `:21`; `project.yml:9`, `:12`, `:14`, `:16`) and the other evidence panels named at `README.md:17`.
- Tag `measured` "Thesis results": the README reports measured outcomes (`:11-13`).
- No disagreement.

### projects/ideas/btd-autoencoder (replaced), 1 slide

- Sources read: `README.md` 1-28, `project.yml` 1-17. No manuscript, no CLAUDE.md.
- Manuscript root: none.
- Facts (README, order 2): about 90% zeros `README.md:11`; NB likelihood `:11`, `project.yml:13`; three deliverables `:12-14`; N <= 10, 5 to 8 donors, 100+ (lupus 115, COVID 83) `:16`; standalone methods paper after the downstream handshake was disproved `:7`; novelty unverified `:22`.
- Left out under ruling 1: the links to fed-multicellular-immune, the MS Lipid Handshake by name, HCCNet pretraining, the go-bttr line and the "Meseret" evaluation ethos (`README.md:7`, `:11`, `:16`, `:22`), the last also a student framing.
- Files before (base copy): `present.yml`, `main.md`. After: the same two. No figure.
- No tag. No disagreement.

### projects/ideas/cirrhosis-digital-twin, 2 slides (new)

- Sources read: `README.md` 1-50, `project.yml` 1-21. The proposal `notes/PIHC2025-TECH_Guichelaar-final.docx` is outside item 1's sources and was not opened.
- Manuscript root: none.
- Facts (README, order 2): lead Maureen Guichelaar and Axel `project.yml:7`, `README.md:3`; scoping, grant not chosen `project.yml:2`, `:13`; about 400 patients `README.md:16`, `:34`; the three method candidates `:26-28`, `project.yml:18-20`; no data requested `:34`; the proposal names no treatment-effect method `:24`; the unverified "unexplored" claim `:30`. Second slide, the proposal as the README records it: title and voucher type `README.md:13`; applicants and that Axel was not one `:14`; test case `:15`; data and the prospective 250 `:16`; method and evaluation `:17`; outcomes and the 12-month milestone `:18`; budget and follow-up funding `:19`; outcome of the submission not stated `:20`.
- Second slide: a columns slide, the proposal against its plan. The README says the proposal was shared in confidence and is kept within this project (`README.md:3`); the deck lives in the project's own `present/` folder, and item 2's "nothing is hidden" puts the README's record of it on the slide. The proposal file itself is not a source and was not opened.
- Left out under ruling 1: the HCCNet and clinical-hccnet references (`README.md:28`, `:34`; `project.yml:10`, `:20`), the visit-series Transformer being described without the project name, and the MSc thesis link (`project.yml:21`, `README.md:50`), a student project. The Grant routes spec carries the funding options (`README.md:36-43`).
- No tag. No disagreement.

### projects/ideas/concept-bottleneck-hcc, 1 slide (new)

- Sources read: `README.md` 1-25, `project.yml` 1-19.
- Manuscript root: none.
- Numbers (README, order 2): 925 studies, 258 patients, 37 positives, horizons `README.md:11`; concepts and composition `:15`; the premise check, 685, 174, 104 of 963 and no feature fields `:22`; PubMed only `:22`; concept lossiness `:21`; stage nascent `project.yml:2`, exploring `:12`.
- Left out under ruling 1: HCCNet and hccnet-pathology as named comparators (`README.md:3`, `:7`, `:21`; `project.yml:12`, `:15`, `:18`), written instead as "a deep 3D-SSL baseline on the same cohort"; the BTTN comparison (`:7`); the paths into other projects' folders (`:22`).
- Disagreement (inside the README): `README.md:11` says LI-RADS is "annotated per visit" and the concept layer "trains without new labelling", while the premise check at `README.md:22` finds no LI-RADS feature fields; the slide states the premise check. The counts 925 studies (`:11`) and 963 observations (`:22`) are different units and are both given as the README gives them.
- No tag.

### projects/ideas/conformal-tensor-factors, 1 slide (new)

- Sources read: `README.md` 1-23, `project.yml` 1-20.
- Manuscript root: none.
- Facts (README, order 2): the gauge problem `README.md:7`; two routes `:15`; disjoint literatures `:15`; one more targeted pass `:19`; the first number `project.yml:10`; the tightness condition `:21`; laptop `:11`; stage de-risking `project.yml:2`.
- Left out under ruling 1: the named testbed projects and the "upgrades every existing block-term paper" list (`README.md:3`, `:11`, `:20`; `project.yml:10`, `:19`), written as "an existing block-term model".
- No tag. No disagreement.

### projects/ideas/ecg-af-fair (replaced), 1 slide

- Sources read: `README.md` 1-42, `project.yml` 1-23.
- Manuscript root: none.
- Numbers (README, order 2): Gruwez 2023 AUROC 0.87, AUPRC 0.48 `README.md:11`; 494,042 ECGs, 142,310 patients, 8.9%, 8 leads, 53.1% serial, no event date, exact training set `:29`; FAIR Grand Challenge 2 `:7`; candidates `:18-19`; split by patient `:29`; lead hook and novelty open `:3`, `:35-36`; stage exploring `project.yml:2`. The external precedent Gruwez 2023 is named because the manifest names it as the baseline to beat (`project.yml:10`, `:16-17`); it is not a hub project.
- Left out under ruling 1: dries-bttr-ecg, HCCNet-FL, FBTTR and serial-ecg-af (`README.md:18`, `:15`, `:25`, `:29`, `:37`; `project.yml:11`, `:18`), the first also a student project.
- Disagreement: `README.md:11` reports the precedent trained on "494,042 SR-ECGs / 142,310 patients" and the inventory measures the same counts (`:29`); the manifest `next:` (`project.yml:18`) gives "494k ECGs / 142k patients", the same numbers rounded. No conflict.
- Files before (base copy): `present.yml`, `main.md`. After: the same two. No figure. No tag.

### projects/ideas/faithful-interpretability-position, 1 slide (new)

- Sources read: `README.md` 1-33, `project.yml` 1-18.
- Manuscript root: none.
- Facts (README, order 2): thesis `README.md:7`; sections `:11-16`; JMSS 2024 and the 2025 review `:20`; held and why `:24`; revisit trigger `:26`; stage nascent `project.yml:2`.
- Left out under ruling 1: the named evidence projects (BTTN, dries BTTR, COVERT, the ECG certificate, `README.md:7`, `:24`, `:26`, `:31`) and the roadmap links to conformal-tensor-factors and pathology-tensor-mil (`:16`), written as "the program's own measured faithfulness work".
- No tag. No disagreement.

### projects/ideas/fed-duplication-limits, 1 slide (new)

- Sources read: `README.md` 1-54, `project.yml` 1-24.
- Manuscript root: none.
- Numbers (README, order 2): ProToken 98.62%, TraceFL 99% `README.md:21`; source inference, unlearning, sharding `:22-27`; data `:39-41`; the gate and its stop rule `:51`; the achievability constraint `:15`, `project.yml:23`; stage de-risking `project.yml:2`.
- Left out under ruling 1: the shared engram instrument (`README.md:3`, `:19`, `:39`, `:52`; `project.yml:11`, `:24`).
- No tag. No disagreement.

### projects/ideas/fed-neural-operators, 1 slide (new)

- Sources read: `README.md` 1-23, `project.yml` 1-19.
- Manuscript root: none.
- Facts (README, order 2): the two differentiators `README.md:3`, `:7`; testbed `:11`; aggregation and optional DP `:15`; the two claims `:15`; Fed-DeepONet `:15`, `project.yml:12`; the real-only rule `:21`; stage nascent `project.yml:2`.
- Left out under ruling 1: BT-FNO, bt-operator-theory, covert-theory, covert-applied, strokeop and harmonop (`README.md:3`, `:11`, `:15`, `:23`; `project.yml:9`, `:12`, `:19`). The manifest names BT-FNO as the operator line it marries (`project.yml:12`); the slide describes that model ("block-term / Fourier neural operator") instead of naming the project.
- No tag. No disagreement.

### projects/ideas/fedbtd, 1 slide (new; stopped)

- Sources read: `README.md` 1-49, `project.yml` 1-14.
- Manuscript root: none.
- Facts (README, order 2): the indeterminacy `README.md:7`; method steps `:27`; pre-emption by FedRot-LoRA `:3`, `:13`, `project.yml:11`; TRIP and FedPAR matching `:17`; below the top-tier bar `:3`; stage stopped `project.yml:2`.
- Left out under ruling 1: FBTTR as the naive baseline it would supersede, covert-theory and covert-applied, HCCNet-FL, FERMAT and the source-imaging paper (`README.md:9`, `:20`, `:29`, `:31`), all named in the README only, not in the manifest.
- Disagreement: the manifest says "PAUSED" (`project.yml:11`, `:13`) and the README "PARKED" (`:3`) while `stage:` is `stopped` (`project.yml:2`); the slide uses the stage value.
- No tag.

### projects/ideas/federated-protocol-agents, 1 slide (new)

- Sources read: `README.md` 1-73, `project.yml` 1-19.
- Manuscript root: none.
- Facts (README, order 2): mechanism `README.md:9`; aggregates exchanged `:9`, `:11`; only a novelty check, unfinished `:17`, `:67`; partly occupied and the table `:25-35`; the OMOP baseline `:37`; the 5% against 15% risk `:43`; the bar `:49-52`; the gate `:68`; stage nascent `project.yml:3`.
- Left out under ruling 1: the real-site route through hccnet-fl-sweden (`README.md:63`, `project.yml:10`).
- No tag. No disagreement.

### projects/ideas/fedlink, 1 slide (new)

- Sources read: `README.md` 1-74, `project.yml` 1-19.
- Manuscript root: none.
- Numbers (README, order 2): PoDP 114 links, 45 labs, 10 countries `README.md:24`; MIBiG 3.0 about 1,002 compounds, 68 categories `:26`; NPOmix `:46`; coupled tensor and local strain factors `:35`; 21 sources, 25 verified `:39`; the gate `:71-72`; activity scope `:66`; stage scoping `project.yml:2`.
- Left out under ruling 1: FBTTR, COVERT, FedBTD and "the federated multicellular-tensor work" (`README.md:3`, `:35`, `:37`, `:64`). The Stage spec says "side project", as `project.yml:11` does, although the manifest's tier is research (`:3`).
- Disagreement: `README.md:24` gives "~4,853 MS samples, 2,600+ genomic sources" for PoDP while `README.md:46` and `:71` give 1,040 paired samples; these count different things (all registered samples against the paired ones NPOmix trained on). The slide gives neither.
- No tag.

### projects/ideas/fl-privacy-auditing, 1 slide (replaced)

- Sources read: `README.md` 1-22, `project.yml` 1-17.
- Manuscript root: none.
- Facts (README, order 2): the attacks and the certificate `README.md:3`; own models as targets, no new private data, reusable membership-inference code `:11`; the battery and the mapping to the guarantee `:15`; primitives well studied, novelty check first `:17`; stage nascent `project.yml:2`, gate `:11`.
- Left out under ruling 1: COVERT, HCCNet-FL and the federated multicellular work by name (`README.md:7`, `:11`, `:15`, `project.yml:13`), and the comparison with a collaborator's applied FL (`README.md:7`).
- Before: `main.md`, `present.yml` (from O151-hub-base). After: `main.md`, `present.yml`. No figures before or after.
- No tag. No disagreement.

### projects/ideas/florank-personalization, 1 slide (replaced)

- Sources read: `README.md` 1-37, `project.yml` 1-19, `notes/ectrims2025-florank-poster.pdf` read whole with pdftotext (one page).
- Manuscript root: none. The poster is the collaborators' work and is used only for the seed's numbers, attributed on the slide as theirs.
- Numbers: seed equation `README.md:9`; F1 0.4864 against 0.4496, AUC-PR 0.4997 against 0.4030 `README.md:9` and the poster's Conclusion; 26k patients, 146 centers `README.md:9`, `:30`, poster Aim ("over 26,000"); three phases `README.md:9`; Branch A `:15`, `project.yml:16`; Branch B and rank-(1,1) `README.md:17`; no block-term adapter, FacT, FedRot-LoRA `:17`, `:23`; win conditions `:21`; open check `:23`, `:35`; stage scoping `project.yml:2`.
- HCCNet is named because the manifest names the federated HCCNet backbone as what Branch A builds on (`project.yml:6`, `:16`), under ruling 1.
- Left out under ruling 1: bt-fno, COVERT, FedBTD (`README.md:17`), the federated multicellular concept and elixir-fl4e (`:5`), HCCNet-FL and FL-Sweden (`:15`), adapter-format-theory (`:25`, `project.yml:9`).
- Before: `main.md`, `present.yml`. After: `main.md`, `present.yml`. No figures before or after.
- Disagreement: none in value. The poster gives SDs (F1 0.4864 +/- 0.0123, AUC-PR 0.4997 +/- 0.0044, LoRA F1 0.4496 +/- 0.0013, FedAVG AUC-PR 0.4030 +/- 0.0059) that the README leaves out; results item 1 gives them with the means.
- No tag (the measured numbers are the collaborators', not this project's).

### projects/ideas/harmonop, 1 slide (new)

- Sources read: `README.md` 1-23, `project.yml` 1-19.
- Manuscript root: none.
- Facts (README, order 2): the operator reframing `README.md:3`, `:7`; the datasets `:11`; operator family and objective `:15`; the three evaluations and the baselines `:15`; GAN, style-transfer and ComBat dominate, operator framing empty `:15`; the gate and the positive condition `:19-20`; venue `:3`, `:23` (manifest `venue: tmi`, `project.yml:12`); stage nascent `project.yml:2`.
- Left out under ruling 1: btfno named as the source of the block-term operator (`README.md:15`, written generically as "a block-term operator"), and the downstream lines HCCNet, raw-PLS, StrokeOp (`README.md:3`, `project.yml:19`).
- No tag. No disagreement: the manifest's `venue: tmi` and the README's "IEEE TMI / Medical Image Analysis" agree; the slide gives the README's pair.

### projects/ideas/hccnet-fl-sweden, 1 slide (replaced)

- Sources read: `README.md` 1-41, `project.yml` 1-20.
- Manuscript root: none.
- Numbers and facts (README, order 2): the two sites `README.md:3`, `:7`; no pooling, GDPR `:7`; the lead hook `:16`; the alternatives `:17-18`; vendors and field strengths `:20`; baselines `:24`; Twente 963 exams, 243 fine-tune, 37 HCC+ `:30`; Link<o diaeresis>ping to confirm, critical path `:31`, `:37`; novelty check pending `:3`, `:40`; gate `:41`; open questions `:36`, `:38`; stage nascent `project.yml:2`.
- HCCNet is named because the manifest names it as what the project builds on (`project.yml:14`), under ruling 1.
- Left out under ruling 1: the comparison with the simulated-silo federation paper hccnet-fl and its method name (`README.md:3`, `:7`, `:9`, `:26`, `:39`; `project.yml:14`), modality-dropping-btf as the mechanism's home (`README.md:16`, `project.yml:17`), and hccnet-revision, hccnet-pathology, FBTTR and COVERT (`README.md:26`). The intersection baseline is written as "federation on the modality intersection".
- The collaborator key `ekstedt` (`project.yml:20`) is given as the partner hospital, which is how the README names the partner (`README.md:3`).
- Before: `main.md`, `present.yml` (deck title "HCCNet-FL Network (Sweden)"). After: `main.md`, `present.yml` (deck title the manifest's `short`, "HCCNet FL Sweden"). No figures before or after.
- The accented letter in "Link<o diaeresis>ping" is kept on the slide, as in the sources.
- No tag. No disagreement.

### projects/ideas/hccnet-pathology, 2 slides (replaced)

- Sources read: `README.md` 1-48, `project.yml` 1-19, `notes/figures/architecture_v3.png` viewed whole.
- Manuscript root: none.
- Numbers (README, order 2): 963 exams, 243 patients, 37 HCC+ `README.md:25`, `:37`; about 9M against 12.4M `:7`, `:25`; P(HCC within 3 years) and the bands `:23`; the four nets and their inputs `:16-19`; physics anchors `:18-19`, `:27`; stages 2 and 3 `:21`, `:23`; staged training `:25`; the central risk `:41`; the gate `:27`, `:42`; composition claim and pending check `:29`, `:44`; stage scoping `project.yml:2`.
- HCCNet and HCCNet-F are named because the manifest's title names HCCNet as the line it builds on (`project.yml:6`) and the README gives HCCNet-F as the baseline it supersedes (`README.md:29`, `:31`), under ruling 1.
- Left out under ruling 1: hccnet-revision and hccnet-fl by name (`README.md:7`, `:33`, `project.yml:19`), the clinicians named at `README.md:27`, `:33`, and the brain-cancer-MRI idea (`:33`, `:37`).
- Disagreement: the monolith's size is "~12.4M params" at `README.md:7` and `:25` and "12-22M-param monolith" at `:27`. The slide gives 12.4M, the figure the architecture comparison uses.
- Figure: `architecture_v3.png` (1200x1679) is not drawn. It is a tall design diagram whose per-visit scores and "P(HCC within 3 years) = 0.34" are illustrative values, which on a slide read as results, and at 720 px high its text is not legible.
- Slide 2 (columns): baselines and ablations `README.md:31`; pathology-label options `:41`; 37 positives and the horizon `:43`, `:45`; the six efficiency proposals, marked "proposed, none measured" as the README marks them, `:46`. Venue spec `:48`. The 9M figure moved from a spec into method item 1.
- Before: `main.md`, `present.yml`. After: `main.md`, `present.yml`. No figures before or after.
- No tag.

### projects/ideas/modality-dropping-btf, 1 slide (new)

- Sources read: `README.md` 1-44, `project.yml` 1-19.
- Manuscript root: none.
- Facts (README, order 2): the bet `README.md:3`, `:9`; the blocks over modality subsets `:14`; mode dropping, no imputation `:15`; subset-wise averaging `:16`; the residual head and its pre-emption `:17`; the identifiability hypothesis and the caution about earlier separation claims `:19`; the closest work `:24-27`; the data `:36`; gates 1 and 2 `:40-41`; the cited scan `:3`; stage nascent `project.yml:2`.
- Left out under ruling 1: Federated-BTTR as the line it extends (`README.md:3`, `:28`, `:30`; named only in the README), hccnet-fl-sweden, hccnet-fl and fedbtd (`README.md:7`, `:36`, `:44`, `project.yml:15`).
- Venue spec: the J-BHI and MedIA/TMI split by framing, `README.md:3`, `:44`.
- No tag. No disagreement.

### projects/ideas/multiway-biosignal-fm, 2 slides (new)

- Sources read: `README.md` 1-54, `project.yml` 1-21.
- Manuscript root: none; "No code, no runs, no manuscript" `README.md:19`.
- Numbers and facts (README, order 2): 39 EEG and 31 ECG models swept, none factorized `README.md:7`, `:3`; the objective as the contribution `:11`, `:40`, `:50`; montage transfer `:13`; Ma et al. and 0.16B `:25`; Multilinear MoE `:26`; BTT `:27`; TPA to 1.5B `:28`; B[FM]$^2$ and MST `:31`; CP-rank at most $RL$ `:32`, `project.yml:20`; candidate datasets `:36`; search blind spot and the two unopened papers `:46`; gates `:51-52`; the 100M band and scale risk `project.yml:21`; stage scoping `project.yml:2`.
- Left out under ruling 1: bt-operator-theory as the source of the CP-rank bound (`README.md:32`, `project.yml:20`; the bound is stated as a fact), ecg-readable-substrate as the source of the datasets and harness (`README.md:36`), and the related keys of `project.yml:9`.
- Slide 2 "Already taken": item 1 holds block-term attention, Multilinear MoE and TPA; item 2 holds Axial Neural Networks, MG-TFNO and the amortized LL1 work (`README.md:29`, `:30`, `:42`).
- No tag. No disagreement.

### projects/ideas/neurosde, 1 slide (new)

- Sources read: `README.md` 1-25, `project.yml` 1-20.
- Manuscript root: none.
- Facts (README, order 2): the shared latent SDE and thin maps `README.md:3`, `:17`; electrode grids and the deterministic approaches `:9`; 9 subjects, no HPC `:3`, `:13`; variational inference and transfer `:17`; the comparison on correlation and calibration `:17`; the cited check `:17`; gate, both conditions `:22-23`; confirm the closest preprints first `:21`; venue `:3`, `:25`; stage nascent `project.yml:2`.
- Left out under ruling 1: the ward paper and xsub-ecog-framework, by name and as the baseline's source (`README.md:5`, `:9`, `:17`, `:21`, `:23`; `project.yml:9`, `:12`, `:15`). The baseline is written as "a deterministic latent-alignment or seq2seq baseline". The fold-back outcome of `README.md:5`, `:23` names another hub project and is left out; the slide keeps the condition that both gate parts must hold.
- The BCI-IV-4 subset is in the Data spec and the Stanford gesture and motor-imagery paradigms in results item 4 (`README.md:13`).
- Disagreement: the manifest's `venue: jne` (`project.yml:13`) names one venue; the README lists three (`README.md:3`, `:25`). The slide gives the README's three.
- No tag.

### projects/ideas/old-charges-stemmatology, 2 slides (new)

- Sources read: `README.md` 1-80, `project.yml` 1-23. The two lit-check reports in `notes/history/` were not read; the README summarizes them and the deck takes nothing from them.
- Manuscript root: none; "No code, no runs and no manuscript" `README.md:3`.
- Numbers and facts (README, order 2): c.1390 to the 18th century `README.md:3`; about 130 copies, Begemann 1888 `:7`, `project.yml:14`; what a tree adds `:11-14`; Hughan 1872, 20 manuscripts `:37`, `:73`; 131 entries `:36`, `:43`; Heinrichi benchmark `:59`; the pipeline `:49-53`; the gate `:20`, `:73`; novelty not verified absent and the sources not searched `:67`; contamination-aware model, novelty not checked `project.yml:21`; FactGrid 7,607 of about 10.1 million cells `:24`; about 75,000 pages `:25`; hand families contested `:26`; no TEI corpus `:43`, rights `:36`, `project.yml:15`; 32 to 131 versions `:43`; 330 years, 13 to 15 lost witnesses, deliberate alterations, contamination unmeasured `:63`; stage scoping `project.yml:3`, pilot-gated `:12`.
- Slide 2: the prior art item (Monarchia, the Heinrichi Neighbour-Joining scores, contamination out of scope, `README.md:57-62`) and the second-paper item on the printed exposures (`project.yml:22`).
- No tag. No disagreement in values; the README itself records that the version counts differ by source (`README.md:43`), and slide 2 states that range.

### projects/ideas/paleogenomics-tensor, 1 slide (new)

- Sources read: `README.md` 1-23, `project.yml` 1-16.
- Manuscript root: none.
- Facts (README, order 2): three-way data and the bet `README.md:3`, `:7`; PCA and ADMIXTURE `:7`; federation without raw genotypes `:3`, `:7`; novelty unverified, active area `:11`; Allen Ancient DNA Resource as a candidate `:15`, `:20`; the gate `:21`; stage nascent `project.yml:3`, speculative `:12`.
- No tag. No disagreement. Nothing left out under ruling 1.

### projects/ideas/pathology-tensor-mil, 1 slide (new)

- Sources read: `README.md` 1-23, `project.yml` 1-19.
- Manuscript root: none.
- Facts (README, order 2): attention maps imprecise and untested `README.md:3`, `:7`; the grid tensor and the rank-$(L,L,1)$ block as spatial map times feature signature `:7`, `project.yml:17`; ablation test `:7`; CAMELYON16/17 and TCGA-LIHC `:11`; UNI or CONCH `:11`, `project.yml:15`; pipeline and baselines `:15`; low-rank MIL and SMMILe `:15`, `:19`; the gate `:21`; first number `project.yml:10`; stage de-risking `project.yml:2`.
- Equation: the first part is the README's tensor (`README.md:7`); the second is the standard form of a rank-$(L,L,1)$ block-term decomposition, $A_r B_r^\top$ the rank-$L$ spatial map and $c_r$ the feature signature, which is the README's "low-rank spatial map times a feature signature vector" written out. It is a judgment call, listed below.
- BTTN is named because the manifest names its faithfulness methodology as what this ports (`project.yml:18`) and BTTN's manifest has Axel as lead (`projects/manuscripts/bttn-incident-af/project.yml:7`), under ruling 1.
- Left out under ruling 1: dries-bttr-ecg as provenance (`README.md:15`), a student project.
- Venue spec `README.md:23`; the Data spec names both CAMELYON16/17 and TCGA-LIHC (`README.md:11`, `:20`).
- No tag. No disagreement.

### projects/ideas/physics-tensor-hcc, 1 slide (new)

- Sources read: `README.md` 1-23, `project.yml` 1-17.
- Manuscript root: none.
- Numbers and facts (README, order 2): naive fusion adds little, 37 positives, four b-values `README.md:7`; IVIM and Dixon equations `:7`; the named-mode tensor `:7`; 925 studies, 258 patients, 37 HCC+ and the horizons `:11`; LI-RADS anchor `:11`; stages `:15`; the IVIM landscape `:15`; range check first `:19`; the low bar and the gate `:21`; venue `:23`; stage nascent `project.yml:2`.
- HCCNet is named because the manifest names HCCNet's fusion weakness as what the project fixes and its naive fusion as the baseline (`project.yml:12`, `:13`, `:17`), under ruling 1.
- Left out under ruling 1: hccnet-revision, hccnet-pathology, modality-dropping-btf and raw-pls (`README.md:3`, `:15`, `project.yml:17`).
- Note: this README counts the cohort as 925 studies and 258 patients (`README.md:11`); the hccnet-pathology README counts 963 exams and 243 patients for fine-tuning (`projects/ideas/hccnet-pathology/README.md:37`). Each deck follows its own README; the difference is between two projects' sources and is not resolved here.
- No tag. No disagreement within the project's own sources.

### projects/ideas/quantum-tensor-fl, 1 slide (replaced)

- Sources read: `README.md` 1-19, `project.yml` 1-16.
- Manuscript root: none.
- Facts (README, order 2): one paper, A or G, capped, lowest priority `README.md:3`; crowded field, the bar `:7`; branches `:12-13`, `project.yml:15-16`; check first `:17`; simulators suffice `:18`; positive over a classical baseline `:19`; stage nascent `project.yml:2`.
- Left out under ruling 1: COVERT as a possible connection (`README.md:17`, `project.yml:13`). The Stage spec carries the cap of one paper and "opportunistic or post-tenure" (`README.md:3`, `:7`, `project.yml:11`).
- Before: `main.md`, `present.yml`. After: `main.md`, `present.yml`. No figures before or after.
- No tag. No disagreement.

### projects/ideas/serial-ecg-af, 1 slide (new)

- Sources read: `README.md` 1-23, `project.yml` 1-22.
- Manuscript root: none.
- Numbers (README, order 2): single-ECG ceiling, BTTN 0.762 provisional, Attia 0.87, Raghunath 0.85 `README.md:3`; state against trajectory `:7`; Sun et al. JAHA 2024 `:7`, `:15`; 104,008 patients with 2 or more recordings, 638,683 pairs `:11` (manifest "638k", `project.yml:14`); the substrate factors `:7`, `project.yml:21`; the coupling and benchmarks `:15`, `:20`; outcome join not done `project.yml:11`, `README.md:19`; gate `:21`; stage exploring `project.yml:2`.
- BTTN is named because the manifest names the BTTN line as what this extends and single-ECG BTTN as the baseline (`project.yml:11`, `:14`, `:17`), and BTTN's manifest has Axel as lead, under ruling 1. Its 0.762 is quoted as the README gives it, marked provisional.
- Left out under ruling 1: dries-bttr-ecg (`README.md:3`, `:15`), a student project. Results item 4 carries the collaborator (`project.yml:22`, the key `vandervoort`, written as the surname) and the Gruwez cohort check (`project.yml:17`); method item 1 carries the CODE-15 and PTB-XL reproduction (`project.yml:21`).
- No tag. No disagreement.

### projects/ideas/ssm-longitudinal, 1 slide (replaced)

- Sources read: `README.md` 1-22, `project.yml` 1-19.
- Manuscript root: none.
- Facts (README, order 2): fixed-step padding and the $\Delta t$-conditioned SSM `README.md:3`, `:7`; data in hand, no collaborator gate `:11`; encoder kept, transition parameterised by $\Delta t$ `:15`, `project.yml:17`; endpoints and splits `:15`; ablations `:15`, `project.yml:18`; the gate `:19-20`; venue `:3`, `:22`; stage nascent `project.yml:2`.
- HCCNet is named because the manifest names it as what the project replaces a part of and as the baseline (`project.yml:12`, `:14`, `:15`), under ruling 1.
- Left out under ruling 1: hccnet-revision, hccnet-fl and hccnet-fl-sweden (`README.md:11`, `:15`, `project.yml:9`), and with them the Link<o diaeresis>ping data reached through hccnet-fl (`README.md:11`). Results item 4 carries the foundation-model backbone role (`README.md:3`, `:7`, `project.yml:19`), the generalization to EHR and wearables and the Flanders positioning (`README.md:7`).
- Before: `main.md`, `present.yml`. After: `main.md`, `present.yml`. No figures before or after.
- No tag. No disagreement.

### projects/ideas/strokeop, 1 slide (new)

- Sources read: `README.md` 1-23, `project.yml` 1-22.
- Manuscript root: none.
- Facts (README, order 2): the reframing, control and prior `README.md:3`, `:15`; CNN limits and counterfactuals, 3h against 6h `:7`; ISLES24 pairing `:11`; backbone family `:15`; metrics `:15`; tumor-growth saturation and the stroke gap `:15`; first number `project.yml:11`; gate and scaling `:20-21`; venue `project.yml:15` (`media`), `README.md:3`, `:23`; stage de-risking `project.yml:2`.
- Left out under ruling 1: BT-FNO and the operator-theory line as what it builds on (`README.md:3`, `:15`, `project.yml:22`; the manifest names it as reused expertise, and the slide writes "a block-term operator"), and the HCCNet comparison (`README.md:3`).
- Disagreement: the manifest's venue is `media` (`project.yml:15`); the README gives "Medical Image Analysis / IEEE TMI" (`README.md:3`, `:23`). The two agree on Medical Image Analysis, which the slide gives.
- No tag.

### projects/ideas/xsub-ecog-framework, 1 slide (new)

- Sources read: `README.md` 1-27, `project.yml` 1-20; `projects/manuscripts/ward-bttr-crosssubject/project.yml:6-8` for its lead and supervisor only.
- Manuscript root: none; "Not started; needs new runs" `README.md:3`.
- Facts (README, order 2): the mechanism `README.md:9`; foundation models not interpretable, mostly not motor `:13`; one task so far `:3`; BCI-IV-4, 3 subjects `:19`; directions `:15`, `project.yml:17-19`; the gate `:23-25`; fresh check and the works to distinguish `:13`; the 2-task, 1-dataset target `:9`; venue `:27`, `project.yml:13`; stage nascent `project.yml:2`.
- Ruling 1 conflict, resolved toward no student framing: the manifest names the ward paper-1 method as what this generalizes (`project.yml:12`, `:14`, `:15`), which ruling 1 would let the deck name; that project's lead is a student with Axel as supervisor (`ward-bttr-crosssubject/project.yml:7-8`), so naming it frames this project through a student project. The slide describes the mechanism itself and says it is "shown so far on one finger-flexion task", with no name, author or venue of that paper. This is listed under judgment calls.
- The Venue spec carries the fallback venues and that authorship is open (`README.md:27`). Left out under ruling 1: the Neurocomputing placement of the earlier paper and its authorship (`README.md:27`), and the script names of that project (`:23`).
- No tag. No disagreement.

### projects/ideas/engram, 2 slides (new; the base held an empty `present/` folder)

- Sources read: `README.md` 1-240, `project.yml` 1-39, `CLAUDE.md` 1-70 for facts only (it adds none the slides use), and the text of `code/docs/diagrams/grid.svg` plus the sizes of the four diagrams.
- Manuscript root: none; "No manuscript" `project.yml:14`.
- Numbers (README, order 2): the motive and AMNESIA's finding `README.md:9`, `:92`; the chain `:17-22`; the localiser and the canary-relative position `:19`, `:90`, `:166`; ablation as a curve `:175`; baselines and the SVD bar `:21`, `:182`; erasure and retention `:189`; models 12M to 299M, muP `:88`, `:147`; corpora `:80-84`; grid `:88`; nine stages, 102 tests, one canary, one seed `:34`, `:36`; $\log_2 N$ ceiling, 8 of 16 at 8192, 0.06 bits `:37-38`; dose-response `:38`; 25.8 to 26.8 against 12.0 to 12.5 `:39`; under 0.3 bits `:40`; saturation dead end `:73`, `:238`; deduplication `:74`; 190 MB, 158 GB, 48 GB `:75`, and 32 MB `project.yml:25`; PMC-Patients one summary per patient `:76`; normal fit unverified, half the cells `:138`, `project.yml:30`; free-text arm not monotone `:133`; 27 GB projection `:128`; MLP freezing 100% to 19% against 69% `project.yml:27`; stage exploring `project.yml:3`.
- Tag `measured`, text "Instrument": every number on the slides is a measured instrument number, and the README says none is a research finding (`README.md:34`); the first results line repeats that.
- Possible disagreement, not settled by the sources: the dose-response (3.2, 15.8, 21.3, 25.8 bits, `README.md:38`, `project.yml:22`) does not match the table's cross-patient fitted column (4.98, 15.95, 25.27, 26.81, `README.md:48-51`). The dose-response line names no placement, and the 25.8 to 26.8 range at `:39` fits the dose-response being the within-patient arm, but no line says so. The slide gives the prose figures and does not quote the table.
- Figures: none drawn. `grid.svg` is 1516x133 pt, `pipeline.svg` 377x752 pt, and `blocks.svg` and `provenance.svg` draw the engine's model and index; none reads at slide size or shows the research question.
- Slide 1 results item 1 carries the throughput table (`README.md:36`, `:53-63`). Slide 2 column 1 carries the decided-against list (`README.md:228-240`) and the open off-chain items (`:203-226`); column 2 item 2 carries the 27 GB projection and item 4 the fallback paper (`README.md:182`). The two removed off-chain items (continuous integration and the documentation site, `:193-202`) are work removed from the repository, and are not on the slides.
- Nothing left out under ruling 1 (bt-operator-theory and btfno appear only in `related:`, `project.yml:10`).

### projects/active/eeg-saad-challenge, 2 slides (new)

- Sources read: `README.md` 1-69, `project.yml` 1-33, `CLAUDE.md` 1-7 for facts only (it repeats README rules), `code/README.md` listed (14 lines, no results).
- Manuscript root: none; "No manuscript unless the entry finishes top five" `README.md:3`.
- Facts (README, order 2): the cross-dataset framing `README.md:7`; rules `:13-17`; scoring and the per-switch score `:21-25`; training sets, languages, systems `:35-41`; 64 of 255 channels `:43`; blind test sets `:45`; KUL 2.1 and the SynAmps record `:31`; baselines and the organizers' prior `:51-53`; direction against envelope and the gaze confound `:55`; dates `:69`, `project.yml:22`, `:24`; planned decoder, change-point detection, montage map `project.yml:31-33`; no results, first number `project.yml:29`; stage exploring `project.yml:2`, not registered `project.yml:26`.
- Left out under ruling 1: multiway-biosignal-fm and xsub-ecog-framework (`README.md:9`, `project.yml:11-13`, `:31`).
- State note: the sources record "Not registered, no data staged, no code" as of 2026-09-10 (`project.yml:26`) and the development phase ends 2026-11-08 (`README.md:69`). The slide states the sources; whether registration has happened since is not in any file read.
- No tag. No disagreement.

### projects/active/linfoot-estimator, 2 slides (new)

- Sources read: `README.md` 1-331 (lines 200-331 read in 700- to 1200-character cuts per line, the full text of the cut lines not read), `project.yml` 1-28, `plan.md` lines 25-35 and 83-91 by grep, the results files `code/results/family_bootstrap_parampl0z.md` 1-20 and `code/results/parampl0z_shipped_seed.md` by grep; `engine_shapes.png` and `parampl0z_overview.png` viewed whole.
- Manuscript root: none. The brief says the article draft is archived under `manuscript/archive/` and the current text is `README.md` and `manuscript/work/`; `manuscript/work/` holds outlines, blueprints and audit records (listed with `ls -R`), and no manuscript text the slides draw on. No `.tex` was read as the manuscript.
- Numbers: the estimand `README.md:9`; v1's raw-scale input and two positive families `:11`; rank input and D4 `:21`; label engine `:69`; ParamPL0z's starts, gate and logit correction from `parampl0z_overview.png` and `README.md:251`; 0.0548 against 0.0714 `project.yml:17` and `family_bootstrap_parampl0z.md:15`; none of 26 groups `project.yml:17` (not traced to a results line); $2.38 \times 10^{-7}$ against 1.00 `project.yml:18`, `parampl0z_shipped_seed.md:250` for the shipped seed; 0.0491 to 0.0554 against 0.6028 to 0.6029 `project.yml:19` (the shipped-seed report gives 0.0489 and 0.0505 for two of the reversed grids, `parampl0z_shipped_seed.md:28`, `:30`; the manifest's range is not traced to a line); Table 1 within 0.0063 in 24 cells `README.md:106`, `project.yml:20`; operator gate 2.13 to 1.65 `:56-63`, `:300`; prior reallocation within 0.001 of 0.062 `:288-290`; six levers and 1.8 percent `:296`; MIST 0.33 nats `:298`; 17 against 18 bins `:114`, `:244`; twin script on surrogate pairs `:207`; credit `project.yml:25`, `README.md:31`; stage exploring `project.yml:3`; next step `project.yml:22`.
- Authorship: the spec states the manifest's `lead: [van-den-berg]` with Axel as coauthor (`project.yml:11`, `:28`, `:25`). The README records a proposed author order with Axel Faes first, "to be agreed with her" (`README.md:205`, `:219`); the slide does not state an order.
- Disagreement: the manifest gives the paired difference as $-0.0166$ $[-0.0203, -0.0130]$ (`project.yml:17`); `family_bootstrap_parampl0z.md:15` gives $+0.0166$ $[+0.0129, +0.0203]$, published minus ParamPL0z. The sign is the file's stated convention ("comparator minus parampl0z", line 3), the lower end differs by 0.0001. The slide follows the manifest, since the README gives no ParamPL0z figure and the results file is named in `plan.md` rather than in the README.
- Tag `mixed`, "Measured, with a proved invariance": marginal invariance under rank input is a theorem (`README.md:112`), the rest measured.
- Figure copied: `code/results/engine_shapes.png -> present/engine_shapes.png` (named in `README.md:71`, `:325`). `parampl0z_overview.png` (2148x1968) is not drawn: it is dense and a second panel would need a second project slide, while slide 2 carries the closed routes.
- Slide 2 column 2 carries the prior-work item (MIST, InfoNet, InfoAtlas, ALICE, `README.md:272`) and the classical panel of the August estimator (`README.md:274`); the Stage spec carries the venue (`project.yml:26`). Left out: the plan's decisions D1 to D38 and the batch job mechanics (`README.md:211-271`, `plan.md`), which record how the work is run.
- Nothing left out under ruling 1.

### projects/active/loewner, 2 slides (new)

- Sources read: `README.md` 1-150 and 343-348 (lines 151-342 are the audit's reference list and provenance, read by heading only), `project.yml` 1-29.
- Manuscript root: none; "no implementation, experimental result, manuscript or selected venue" `README.md:3`.
- Facts (README, order 2): the research question `README.md:9`; first task `:9`; 26 sources `:3`, `project.yml:23`; compute ceiling `:17`; the layer and the correction step `:41-54` (equation from `:49`); noise risk `:51`, `:56`; open deliverable and nothing derived `:58`; occupied directions `:13`; unsupported claims `:23-27`; pilot design `:78-92`; metric `:98-104`; Loewner divided-difference precedent `:133`; first number `project.yml:26`; stage scoping `project.yml:2`.
- Left out under ruling 1: novel-math-primitives (`project.yml:11`). Slide 2 column 1 item 4 carries the assumptions (`README.md:60-74`) and column 2 item 4 the unresolved comparisons (`:141-149`).
- No tag. No disagreement.

### projects/active/novel-math-primitives, 2 slides (new)

- Sources read: `README.md` 1-131 (lines 60-112, the superseded Q1 to Q3 scan, read by heading only, since `README.md:7` says the corrections override it), `project.yml` 1-20. `DETAIL.md`, `DEEP-DIVE.md`, `FAV.md` and `NEW.md` were not read: the README names the first two as applied angles and deeper treatment, not results.
- Manuscript root: none; "no code or manuscript" `project.yml:11`.
- Facts (README, order 2): the "unused" rule and the four-step framing `README.md:3`, `project.yml:20`; the sweep `:7`; corrections `:10-17`; about 24 survivors and the ranking `:19-46`; the top four `:23-26`; cup-length separation `:55`; imaging and geometry heavily mined `:115`, `:124`; re-verify `:131`, `project.yml:19`; gate `project.yml:11`, `:15`; stage exploring `project.yml:3`, chip `parked` `:10`.
- Left out under ruling 1: the sandpile-operator spin-out (`project.yml:17`) and the COVERT / HCCNet-FL fit of row 11 (`README.md:33`).
- Disagreement: the README's Next (`README.md:131`) names graph magnitude among the strongest first candidates, while the same README records graph magnitude as refuted (`:10`); the manifest's next (`project.yml:15`) names chip-firing, Cayley-Menger, Bose-Mesner, Dunkl and the Edgeworth head. The slides follow the post-sweep ranking and the manifest, and list graph magnitude as refuted.
- No tag.

### projects/active/sandpile-operator, 2 slides (new)

- Sources read: `README.md` 1-49, `project.yml` 1-22, `code/results/metrics.json` (the results file `code/paper.py` writes, `README.md:27`), `HANDOFF.md` 1-66 in 300-character cuts (it repeats the README); `rollout.png` viewed whole.
- Manuscript root: none; "no manuscript yet" `project.yml:13`.
- Numbers (README, order 2, checked against `metrics.json`): rollout MSE 0.003, 0.233, 0.169 `README.md:23-25` (`metrics.json` 0.00302, 0.23320, 0.16924); IoU 0.95, 0.82, 0.47 (0.948, 0.822, 0.467); wall leakage 0 for both operators, CNN "leaks" (`metrics.json` 2.254); about 77x `:27`; the step and the equation `:43`; $\tau \to 0$ `:7`; baselines `:43`; caveats `:31-33`; HCC 87 patients `:39`; run_all.sh local only `:47`; deep-equilibrium plan `:49`; two minutes on CPU `:19`; stage exploring `project.yml:3`.
- Tag `measured`, "Synthetic stage 0".
- Figure copied: `code/results/figures/rollout.png -> present/rollout.png` (named in `README.md:27`).
- Left out under ruling 1: the tensor-PLS line named for registration ideas (`README.md:48`).
- No disagreement.

### projects/archive/failed/faithful-block-term-layer, 2 slides (new)

- Sources read: `notes/derivations/faithfulness-guarantee.tex` 1-126 (the project's one derivation, no inputs), `README.md` 1-49, `project.yml` 1-12.
- Manuscript root: `notes/derivations/faithfulness-guarantee.tex`, the only document of the project; the README says "The whole project is one formal derivation" (`README.md:17`). It is a working derivation, not a manuscript (its author line, `:15`), and is taken first in number precedence because nothing else ranks above it.
- Facts (derivation, order 1): setup and equation `faithfulness-guarantee.tex:29-37`; P1 holds, known principle `:47-63`; P2 fails `:75-88`; $O(r_f r_l)$ and the temporal head `:91-101`; the trade-off verdict `:112-116`. README (order 2): the bet `README.md:7`; the fallback and its owners `:30-31`; the opposite-direction landmine `:32`; partial bound `:33`; no data `:39`; outcome `project.yml:11`; stage failed `project.yml:5`.
- Tag `proof`, "Derivation".
- BTTN is named because the manifest names it as what the project was built on (`project.yml:10`), and BTTN's manifest has Axel as lead.
- Left out under ruling 1: bttn-incident-af and btfno by name and the authorship line of the applied paper (`README.md:3`, `:11`, `:49`), and the reuse of the jacobian-coupled-blockterm-dp shell (`:11`).
- No disagreement.

### projects/archive/failed/fed-faithful-ecg, 2 slides (replaced)

- Sources read: `README.md` 1-73 in 700-character cuts, `project.yml` 1-13, `code/README.md` 15-21, `code/results/fed_faithfulness/summary.md` 1-14 (the real run), `code/results/pilot_mechanism/summary.md` 1-23 (the synthetic pilot), `CLAUDE.md` for facts only.
- Manuscript root: none; "No claimable ECG result yet" `README.md:21`.
- Numbers, real run (results file, order 2): centralized 0.824 / 0.1619 / 0.244, fedavg 0.838 / 0.1778 / 0.468, aligned 0.834 / 0.1073 / 0.341, fedprox 0.788 / 0.1189 / 0.613 (AUROC, comprehensiveness, consistency) `fed_faithfulness/summary.md:8-11`, matching `README.md:5`; likely cause and the synthetic overstatement `README.md:5`; two silos at 100 Hz `README.md:5`; metrics `code/README.md:19`; patient-grouped non-IID split and the four arms `code/README.md:20`; shift-add backbone `README.md:3`; reconstruction term `code/README.md:18`; gauge ambiguity `README.md:17`; no-go and framing dropped `README.md:3`, `project.yml:13`; stage failed `project.yml:2`.
- Numbers, synthetic pilot (results file, order 2): 0.849 / 0.940 / 4.00, 0.812 / 0.585 / 2.00, 0.819 / 0.670 / 3.00 `pilot_mechanism/summary.md:7-9`; 4 clients, 3 seeds `README.md:23`; dead ends `README.md:39-40`. The slide labels the pilot synthetic, as `pilot_mechanism/summary.md:3` and `CLAUDE.md` require.
- Disagreement: the README pilot table (`README.md:27-29`: 0.85 / 0.95 / 4 of 4 / +0.25; 0.81 / 0.56 / 0-3 / +0.13; 0.83 / 0.70 / 2-4 / +0.20) does not match the committed pilot summary (`pilot_mechanism/summary.md:7-9`: 0.849 / 0.940 / 4.00 / +0.2555; 0.812 / 0.585 / 2.00 / +0.1423; 0.819 / 0.670 / 3.00 / +0.1895). Purity 0.95 against 0.940, 0.56 against 0.585, and the coverage ranges against the means differ. The slide uses the results file. FedProx appears only in the results file.
- Tag `measured`, "Real-run go/no-go".
- Left out under ruling 1: ecg-readable-substrate by name as the home of the carried-forward loaders (`README.md:3`, `project.yml:9`), written as "later ECG work"; the portfolio-distinctness paragraph naming other hub projects (`README.md:65`).
- Before: `main.md`, `present.yml`. After: `main.md`, `present.yml`. No figures before or after.

### projects/archive/failed/jacobian-coupled-blockterm-dp, 2 slides (new; the base held an empty `present/` folder, which git does not carry, so the folder was made in the worktree)

- Sources read: `notes/derivations/coupled-floor-setup.tex` 1-109 (no inputs), `README.md` 1-86, `project.yml` 1-12, `code/README.md` 1-40. No results file exists: the probes print their tables to stdout (`README.md:15`, `code/README.md`), and the README tables are the record. No figure exists in the project.
- Manuscript root: `notes/derivations/coupled-floor-setup.tex`, the only document, a working derivation ("NOTHING here is verified", `:18`). It holds no numbers; it gives the model and the equation.
- Facts (derivation, order 1): the deflation cause `coupled-floor-setup.tex:24-27`; $t_{r,i}$, $G$ `:34-39`; whitened release `:44-51`; non-block-diagonal proposition `:66-75`. README (order 2): floor definition, 12 seeds, raw floor about 14 and 22, 16-18% lower below $\rho$ 0.3, 58 to 67 times `README.md:17-37`; utility gate `:39`; matched-$\rho$ table, 16 seeds, the $\rho$ confound, 3% rank-1 edge `:41-52`; rank sweep and 0.988 `:54-64`; root cause `:70`; the within-block direction left `:72`, `:86`; synthetic data `:76`; outcome `project.yml:11`; stage failed `project.yml:5`.
- Tag `mixed`, "Derivation and probes".
- COVERT is named because the manifest names it as the parent model (`project.yml:10`). P3LS is an external method.
- Left out under ruling 1: the hub projects covert-applied and covert-theory by id (`README.md:82`) and btfno (`README.md:86`).
- No disagreement.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/stopped/connectivity-motor-imagery, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.tex` 1-177 (no `\input`), `manuscript/main.pdf` 6 pages through `pdftotext -layout` (numbers match the tex), `manuscript/main.doc` (a copy of `main.tex` without the commented paragraph at `main.tex:51`, by `diff`), `manuscript/main.bib` entry at `:108-118`, `project.yml` 1-15, both figures viewed whole. No README exists.
- Manuscript root: `manuscript/main.tex`, the only manuscript, with `main.pdf` as its build.
- Facts (manuscript, order 1): authors `main.tex:21-23`; mixing and directed dependencies `:46`; Causal Graph Process and its fit `:66-83`; TCDF `:89-91`; the $\lambda_3 \lVert A - \mu \rVert_1$ term `:100-107`; node selection `:112-116`; simulation pipeline `:122`, `:135`; ground truth `:137-145` from Omidvarnia et al. 2011 (`main.bib:108-111`); 500 noisy sources, SNR 0.9, New York Head Model `:149`; recovered coefficients `:151-159`; empty sections `:56-62`, `:162-164`. Manifest: outcome, abstract at the 8th International BCI Meeting 2021 `project.yml:12`; stage stopped `:5`; motor-imagery target `:11`.
- The slide's "within 0.07" and "come back smaller" are read off `main.tex:140-142` against `:154-156`; the manuscript itself says only "can accurately estimate" (`:149`).
- Defect in the source, shown on slide 2 as printed: the recovered $x_1$ equation lists $x_2(n-1)$ twice, 0.14 and 0.2 (`main.tex:154`). The two equation labels `eq1` and `eq2` are each defined twice (`:68`, `:137`; `:78`, `:102`, `:151`), so the PDF's cross-references point at the wrong equations; the caption of `figs/simulation.png` repeats the TCDF caption (`:126`).
- Tag `measured`, "One simulation".
- Figures not drawn: `figs/tcdf-arch.png` is the TCDF architecture diagram of the cited framework (`:91`, `:95`) and `figs/simulation.png` the simulation-pipeline diagram (`:122`); neither shows a result of this project, and the coefficients on slide 2 are the result.
- Left out under ruling 1: abstract-bci-meeting-2021 as a hub project (`project.yml:9`) and connectivity-iris (`project.yml:12`); the meeting itself is named as the venue.
- No disagreement between manuscript and manifest.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2016/bachelor-network-ids, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf`, 145 pages, whole through `pdftotext -layout` (front matter, chapters 1-13, bibliography pp. 109-114 with the dataset sources [96] and [97], appendices A-D), `project.yml` 1-28. No README, no tex.
- Manuscript root: `manuscript/main.pdf`, the thesis itself.
- Numbers (thesis, order 1), printed page numbers: degree, University of Hasselt, June 2016 p. 1 (title page); flows and attack classes pp. 20-21; feature sets p. 76; learners pp. 76-77; 10 runs, baselines pp. 79-80; random baseline binary F 0.4653 Table 11.1 p. 82; KNN 0.9500, 0.9857 Table 11.3 p. 84; 0.9631, 0.9924 Table 11.4 p. 85; Canberra 0.9151, Euclidean 0.9917 Table 11.6 p. 87; real-world 0.7633 on 11072646 flows Table 11.7 p. 87; decision tree 0.9074 Table 11.8 p. 89, 0.0155 and every EDM flow flagged Table 11.10 p. 90; naive Bayes Tables 11.11-11.12 pp. 92-93; linear SVM pp. 94-96; RBF SVM 0.0455 Table 11.15 p. 98; neural network 0.0 Table 11.17 p. 101; one-class SVM Table 11.19 p. 103; K-means p. 76; binary training 0.9859, 0.9926 Tables 12.1-12.2 p. 106; conclusion p. 107; datasets pp. 72-75; scikit-learn p. 71.
- Disagreement: `project.yml:15` says "Bachelor's thesis, KU Leuven 2016"; the thesis title page says University of Hasselt (p. 1), and `project.yml:17` (`venue: uhasselt-thesis`) agrees with the thesis. The slide uses the thesis. The manifest result line (`project.yml:14`) agrees with the thesis.
- Tag `measured`, "Thesis evaluation".
- No figure: the thesis figures are learning curves and borrowed diagrams inside the PDF, and no image file exists in the project.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2017/icfp-src-abstract, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf`, 3 pages, whole through `pdftotext -layout`; `project.yml` 1-21.
- Manuscript root: `manuscript/main.pdf`, the abstract itself.
- Facts (abstract, order 1): authors and advisor role p. 1; Eff's inferred types and the rebuild after each pass p. 1; row-polymorphic choice and linear type checking p. 1; Links calculus, Figures 3-4 (terms, types, dirty type $A!\Delta$) p. 2; N-Queens result, Figure 5, and "very error-prone" p. 2; metatheory and planned integration p. 2. Venue `project.yml:13`, `:18`.
- Tag `design`, "Proposal".
- One slide: the abstract has one result and one proposal, and the slide carries both.
- No figure: Figure 5 exists only inside the PDF.
- Left out under ruling 1: nothing; the manifest names no other hub project.
- No disagreement.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2017/icfp-src-poster, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf`, 1 page; text through `pdftotext -layout` (which reports a damaged xref and recovers), and the page rendered to PNG in the scratchpad with `pdftoppm` (whole page at 40 dpi, the chart region at 80 dpi) to read the chart values; `project.yml` 1-22.
- Manuscript root: `manuscript/main.pdf`, the poster itself.
- Numbers (poster, order 1): the loop-variant bars (Basic 100; Opt 78.5, 74.3, 56, 34; Pure 35.4, 37.4, 62.3, 85; PureOpt 2.4, 2, 5.5, 3.3; Native 2.3, 1.9, 3.8, 2.3) and the N-Queens curves read from the rendered chart, "Background: Optimisations" panel; term rewrite rules, purity-aware compilation and the free-monad note, same panel; function specialisation, "Research Problem" panel; edge cases, "Preliminary results"; authors and advisor, header. "Within about 10%" and "near 180%" are read off the N-Queens plot (Eff(PureOpt) between about 90 and 108, HandlersInAction peak about 180 at size 9), not printed values.
- Tag `mixed`, "Benchmarks and design".
- No figure: the chart exists only inside the PDF; a PNG rendered from it would be a new file made by a program, which the brief does not allow into `present/`.
- Left out under ruling 1: the companion abstract named in `project.yml:10`, `:14`.
- No disagreement.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2018/masters-algebraic-subtyping, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf`, 99 pages, through `pdftotext -layout`: front matter, Dutch summary, chapters 1-3 and 6-8 in full, chapters 4-5 as their prose and rule lines, appendices A-C at the level of each proof case, appendix D (poster); `project.yml` 1-25.
- Manuscript root: `manuscript/main.pdf`, the thesis itself.
- Facts and numbers (thesis, order 1), printed page numbers: degree, promotor and advisor title page; research questions p. 2; results p. 3; Eff fragility and function specialisation pp. 17-18; dirts and types, Figure 3.2 p. 21; lattice equations Figures 3.4-3.5 p. 23; properties pp. 25-27; polar types and biunification pp. 33-40; type-&-effect automata pp. 49-54; 2700 lines p. 55; Figure 6.6 (Interp 222.74 / 261.47, Loop 282.74 / 471.07, Parser 27387.71 / 1177.23, Queens 6402.66 / 753.47, Range 109.26 / 155.10, 10,000 iterations) pp. 61-62; Loop program types Figures 6.9-6.11 p. 64; the union-typed program Figure 6.8 p. 63; simplification not implemented and proofs less rigorous p. 69; future work p. 70.
- The poster in Appendix D (p. 83) prints a second benchmark table (Interpreter 1.550 / 1.740, Loop 1.285 / 2.859, Parser 171.887 / 11.791, N-Queens 35.377 / 5.362, Range 0.642 / 1.058) with no unit, and "~2900 loc" against the 2700 lines of p. 55. The slide uses Figure 6.6 and p. 55, the thesis body. Recorded as a disagreement inside the manuscript; the two tables agree on which benchmarks EffCore wins.
- Tag `mixed`, "Proofs and benchmarks".
- Dolan's algebraic subtyping is named because the thesis and the manifest name it as what the work extends (`project.yml:12`).
- Left out under ruling 1: algebraic-subtyping and algebraic-effects-compilation (`project.yml:10`, `:14`).
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2018/masters-eeg-infotheory, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf`, 62 pages, whole through `pdftotext -layout` (title page, abstract, chapters 1-9, bibliography, filing card); `project.yml` 1-26. The project has no README and no results file.
- Manuscript root: `manuscript/main.pdf`, the thesis itself.
- Numbers (thesis, order 1), printed page numbers: degree, supervisor, mentor title page and filing card p. 54; main conclusion p. 3; 128 electrodes p. 25; 600 Dutch nouns p. 25; sLORETA and 15,000 dipoles p. 26; 75% of maximum activity, regions over 3 cm2, four regions p. 27; 13 subjects, 3404 trials, 340 samples, 4 regions, results consistent across regions p. 29; bins converging near 100 p. 30; Freedman-Diaconis 90, 90 chosen p. 30; mutual information with rest far below rest entropy p. 31; 60% to 70% shared p. 32; three-way term -1 bit, $I(\mathrm{Abs},\mathrm{Con})$ between 2 and 3 bits, equation 6.1 p. 33; synergy p. 34; 262 trials per subject, about 3 per bin, 10/40/80/100 trials p. 35; 10 trials leave most bins empty p. 35, 80 and 100 trials clear p. 36; joint-entropy implementation pp. 43-45; directed information, open-source package, Granger causality, total and dual total correlation pp. 47-48.
- Inside the manuscript: the introduction (p. 1) lists directed information among the methods the thesis takes, and the analysis never computes it; chapter 8 (p. 47) lists it as future work. The slide follows chapter 8. The introduction (p. 3) and conclusion (p. 49) call the processing in the common region "quite different" and "differed"; p. 32 measures 60% to 70% shared. The slide gives the measured split.
- Wording: `project.yml:14` and `:19` say "Advanced Master's thesis"; the title page says "Master of Science in Artificial Intelligence, option Engineering and Computer Science". The spec uses the title page. No number disagrees.
- Tag `measured`, "Source-space analysis".
- No figure: the thesis figures exist only inside the PDF, and the project holds no image file.
- Left out under ruling 1: connectivity-iris (`project.yml:10`, `:14`).
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2021/abstract-bci-meeting-2021, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.tex` 1-64 (whole; it inputs no file), `manuscript/main.pdf` 1 page (whole, through `pdftotext -layout`, same text as the source), `project.yml` 1-26. The project has no README. `admin/` (speech, slides, video) is outside the source list of the brief and was not used.
- Manuscript root: `manuscript/main.tex`, the abstract's only source file, and the PDF built from it.
- Numbers (abstract, order 1): method `main.tex:32`; simulation chain and the Omidvarnia et al. pattern `main.tex:35`; ground truth `main.tex:40-42`; 500 noise sources, SNR 0.9 twice, New York Head Model, "accurately estimate" `main.tex:47`; recovered coefficients `main.tex:52-54`. Authors `main.tex:18-20`; venue `project.yml:23`.
- Defect in the source, carried onto the slide as printed: `main.tex:52` lists the lag-1 term from $x_2$ into $x_1$ twice (0.14 and 0.2).
- Wording: `project.yml:15` says the method "recovers the ground-truth directed connectivity pattern"; the abstract (`main.tex:47`) calls the results preliminary, and its printed estimate misses the lag-2 self-terms and adds one link. The slide prints the coefficients and calls the result preliminary.
- One slide: the abstract has one simulation, and its truth and estimate fit the results list.
- Tag `measured`, "Simulated network".
- No figure: the abstract has none.
- Left out under ruling 1: connectivity-motor-imagery (`project.yml:10`, `:16`). The external pattern source (Omidvarnia et al. 2011) and the Temporal Causal Discovery Framework are named as the abstract cites them.
- Repeated lines it shares with another deck: the sub line (the manifest title, which `project.yml:11` gives to both this project and connectivity-motor-imagery) and the Authors spec value (the same three authors on both); both are facts true of both decks.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2021/source-localization, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.tex` 1-544 (whole; it inputs no file, and lines 360-541 are a commented-out supplement, read for the parameter values only), `manuscript/main.pdf` (10 pages, the published article carrying 066014; its table values checked against the source with `pdftotext` and `grep`), `project.yml` 1-31. The project has no README. `main_latest.tex` is `main.tex` with revision highlighting (`diff` shows only `\hl{}` and one `\sout{}` sentence, the abstract's goal sentence); `submitted/jne-iop.pdf` is the first submission and `submitted/main_revised.pdf` the revision, both earlier than the article; `appendix.tex` is the supplement.
- Manuscript root: `manuscript/main.tex`, the source of the published `main.pdf`.
- Numbers (manuscript, order 1): pipeline `main.tex:64-75`; SSBL from BC-VARETA `main.tex:56`, `:62`; simulation, 3 dipoles, 500 noise sources, 108 electrodes `main.tex:81`, `:93`; correlations `table:res:noise` `main.tex:155-157` and `table:res:configurations` `main.tex:168-171`; timing `table:res:timing` `main.tex:191-194`; spread `table:res:size:mediod` `main.tex:211-214`; $\kappa$ 0.12 and Pareto `main.tex:148`, `:234`; $\kappa \approx 0.08$ `main.tex:179`, `:260`; 300 localizations, Cuban set `main.tex:260`, `:341`; subject ay ERD/ERS, BC-VARETA and LCMV `main.tex:287`; LCMV correlation `main.tex:148`, `:182`; mislocated but correlated `main.tex:337`. Venue and DOI `project.yml:15`, `:19`.
- Disagreement: `project.yml:14` names the second real set the "Berlin connectivity challenge", and so does the introduction (`main.tex:58`); the methods (`main.tex:136`) use BCI Competition III Dataset IVa, and the Berlin challenge supplies the New York Head Model of the simulation (`main.tex:95`). The slide uses the methods.
- Defects in the source, not carried onto the slide: the second block of `table:coordinates` gives Close Superficial and Far Superficial the same coordinates (`main.tex:113-114`); the trade-off figure's legend labels the red curve "eLORETA - Correlation" and the blue ball "Average", where the caption (`main.tex:179`) calls them the complement of the spread and eLORETA's average correlation. The panel's caption follows the manuscript caption.
- Equation: the slide writes Algorithm 1 (`main.tex:67-70`) as one composition; the manuscript has no displayed equation for the method.
- Tag `measured`, "Simulation and two EEG sets".
- Figure: `sparsity-acc-spread_norm.png`, copied from `manuscript/figs/`. The other figures are brain maps whose reading needs the four-way comparison the slides give in words.
- Left out under ruling 1: nothing; the manifest names no other hub project.
- Before: empty `present/`. After: `main.md`, `present.yml`, `sparsity-acc-spread_norm.png`.

### projects/archive/published/2021/volga-finger-trajectories, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf`, 1 page, whole through `pdftotext -layout` (32 compacted lines); `project.yml` 1-23. The project has no README and no LaTeX source.
- Manuscript root: `manuscript/main.pdf`, the abstract itself.
- Numbers (abstract, order 1), compacted text lines: authors 2; missing finger control 13-14; BTTR, multiway structure 14-16; deflation, automatic parameters 17-18; three fingers, sensorimotor ECoG, data glove 19-21; 0.37, 0.87, 0.78 Pearson 22-23. Venue `project.yml:14`, `:20`.
- No equation: the abstract gives none.
- One slide: the abstract has one result.
- Tag `measured`, "One subject" (the abstract says "a subject's sensorimotor cortex").
- No figure: the abstract has none.
- Left out under ruling 1: block-term-tensor-regression (`project.yml:10`).
- No disagreement.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2022/block-term-tensor-regression, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/bare_jrnl.tex` 354-1133 (the document body, whole; lines 1-353 are the IEEEtran template preamble and comments, and the file inputs no other file), `manuscript/main.pdf` (12 pages; `cmp` shows it is byte-identical to `FINAL_VERSION.PDF`; thirteen numbers and phrases checked against the source with `pdftotext` and `grep -c`, each found in both), `project.yml` 1-28. The project has no README. `admin/old/` holds earlier drafts and the review, and `notes/` one unrelated PDF; neither is a source the brief lists.
- Manuscript root: `manuscript/bare_jrnl.tex`, the source of the final PDF.
- Numbers (manuscript, order 1): authors, equal contribution `bare_jrnl.tex:374-389`; motivation `:497-499`; mPSTD `:563`; ACE and BIC `:597-611`; ACCoS `:645-668`; BTTR model `:699-710`; gBTTR `:714-716`; tensor build, 8 bands, 10 Hz, 1 s before onset, 62/48/64 channels `:773`; data `:769`; cross-validation of $K$, Wilcoxon `:782-784`; synthetic $C1 = 1$ against 0.81 `:810`; BTTR against gBTTR and HOPLS `:836-840`; 3 min, 8 min, 14 h, $K$ still cross-validated `:842`; ring finger excluded `:846`; significance against LSTM and AM/RF/LARS `:848`; LightGBM `:850`; subject tables `:859-867`, `:881-889`, `:903-911`. Venue and DOI `project.yml:16`, `:20`.
- The manifest's numbers (`project.yml:15`) match the tables. The manifest's results line leaves out the LightGBM and SVM-rbf rows, where LightGBM beats ACE-BTTR on subject 2 (0.493 against 0.46) and is level on subject 3 (0.6775 against 0.67); the second slide states both.
- Defects in the source, not carried onto the slides: `:850` lists the thumb among the fingers subject 3 decodes better and among those it decodes worse (Table `results-subj-3` puts the thumb at 0.73 against 0.82, so the "better" list should read middle, ring and pinky); Algorithm `mptsd` (`:552`) initialises with HOOI and the text (`:563`) with HOSVD; the predicted-flexion caption (`:824`) gives time in ms while the figure's axis reads seconds. The slide says "a sparse Tucker decomposition" and does not name the initialisation.
- Equation: the BTTR model of `:703-708`, with the residuals written once outside each sum (the source puts $\underline{\mathbf{E}}_k$ and $\mathbf{f}_k$ inside the sums).
- Tag `measured`, "Synthetic and BCI Competition IV".
- Figure: `image10.png` (predicted ring-finger flexion), copied from `manuscript/figs/`.
- Left out under ruling 1: extended-bttr-note (`project.yml:10`) and the eBTTR and Go-BTTR follow-ups named in `project.yml:16`. HOPLS, PSTD, LightGBM and the competition winner are named as the manuscript names them.
- Before: empty `present/`. After: `main.md`, `present.yml`, `image10.png`.

### projects/archive/published/2022/connectivity-iris, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf`, 20 pages, whole. Its text layer carries the peer-review draft under the final text, so `pdftotext` returns two interleaved copies; every page was read through `pdftotext` page by page, and pages 3, 10-12 and 15-19 were also rendered to PNG in the scratchpad with `pdftoppm` and read as images where the text layer was unreadable (the equations, the F1 rankings, Table 2, Figure 12, the discussion and the conclusion). `project.yml` 1-28. The project has no README and no LaTeX source; `admin/` holds the cover letter.
- Manuscript root: `manuscript/main.pdf`, the published article (Appl. Sci. 2022, 12, 2889).
- Numbers (article, order 1), printed page numbers: motivation p. 1-2; simulation, 1500 steps, 108 electrodes p. 3-4; moving sender, 1004 iterations p. 4; pink noise, SNR 0.9 twice, eLORETA $\gamma = 0.01$ p. 5-6; NNGC p. 6; LSTM-NUE p. 7; TRGC, order 2, conservative, FDR $\alpha = 0.05$ p. 9; Conv2D with three predictors 0.13 and 0.40 p. 11; median sensitivities p. 11-12; precision 0.58, two false positives, F1 rankings p. 12; 1048 s, Figure 12 p. 15; Table 2 and the Ground Truth 2 tests p. 15-16; variability and "counterintuitive" p. 16; slowest methods, NUE p. 17; real EEG as the next step p. 18; conclusion p. 18-19. Authors and equal contribution p. 1; venue `project.yml:15`.
- Disagreements: `project.yml:14` says the LSTM "competes with established estimators (Granger causality, partial directed coherence)"; the article compares with TRGC only (p. 9) and names partial directed coherence only as a known method (p. 1), and TRGC leads the networks on sensitivity in Ground Truth 1 and on precision in Ground Truth 2 (pp. 12, 16). The slides follow the article. `project.yml:11` and the article's abstract call LSTM-NUE robust to dipole location; the slides give its measured scores beside TRGC's.
- Defect in the source, not carried onto the slides: the caption of Figure 8 (p. 11), a precision figure, reads "Sensitivity Ranking".
- Equation: the NNGC score of p. 6. The ground-truth system (p. 3) was not used: its printed form drops the lag on $X_1$ and $X_2$ in two terms, and the two branches of $c_{12}$ do not meet at $t = L/2$.
- Tag `measured`, "Two simulated ground truths".
- No figure: the article's figures exist only inside the PDF.
- Under ruling 1: the funding note (p. 19) says the second author did the work as part of her master's thesis; the deck names her as the equal-contribution coauthor the article lists and does not mention the thesis. The manifest names no related hub project.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2022/extended-bttr-note, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.tex` 1-443 (whole; it inputs no file), `manuscript/supp.tex` 1-84 (whole, the supplement), `manuscript/main.pdf` (8 pages, the published article carrying J. Neural Eng. 19 (2022) 066011, read through `pdftotext`; its tables and runtime sentence match the source), `project.yml` 1-37. `manuscript/ebttr.pdf` (10 pages) is the submitted preprint layout of the same source. The project has no README. `manuscript/figs/` is a copy of the BTTR paper's figure folder (`cmp` on `image10.png`), used by no `\includegraphics` of this source except `figs/av/`.
- Manuscript root: `manuscript/main.tex` with `supp.tex`, the sources of the published article and its supplement.
- Numbers (manuscript, order 1): authors `main.tex:29`; BTTR's scalar limit `:64`; eBTTR algorithm and model `:110-148`; ACE, mPSTD, HOOI, BIC `:161-219`; dataset, 62/48/64 electrodes `:237`; 37 ms glove lag `:239`; 61/46/63 curated channels, 8 bands, 10 bins `:245-247`; 5-fold cross-validation of $K$ `:295`; ring finger excluded `:301`; middle-finger significance `:303`; 3 min, 14 h, 5 min `:305`; avatar replays, coactivations likely not encoded `:307`; tables `:316-323`, `:337-344`, `:358-365`; non-cued accuracies `supp.tex:34-38`, `:53-57`, `:72-76` (ranges per subject computed with `grep -oE` and `awk` over those rows: eBTTR 0.43-0.82, 0.34-0.75, 0.51-0.83; BTTR 0.01-0.62, 0.01-0.33, 0.12-0.43). Venue `project.yml:16`.
- Disagreement inside the manuscript: the abstract (`main.tex:38`) says eBTTR outperforms multilinear approaches; the tables show it level with BTTR and HOPLS except on the middle finger of subjects 1 and 2, and BTTR ahead on subject 3's average (0.67 against 0.66, `:358-359`). The slides give the table values; `project.yml:15` ("on par with BTTR") agrees with the tables.
- Equation: the response model of `main.tex:144` with the weight column of `:148`.
- Tag `measured`, "Three ECoG subjects".
- Figure: `ebttr_fig.jpeg` (the eBTTR scheme), copied from `manuscript/`. The avatar stills (`figs/av/`) read only side by side, five to a figure.
- Ruling 1: BTTR, HOPLS and the competition decoders are named as the manuscript names them (BTTR is the method the manuscript extends, `main.tex:60`). Left out: the Go-BTTR follow-up named in `project.yml:16`, and the block-term-tensor-regression project as a hub cross-reference (`project.yml:10`).
- Before: empty `present/`. After: `main.md`, `present.yml`, `ebttr_fig.jpeg`.

### projects/archive/published/2025/fbttr-strategies, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/latex/main.tex` 1-602 (whole; it inputs no file), `manuscript/main.pdf` (8 pages; `cmp` shows it is byte-identical to `manuscript/fllm.pdf`; nine numbers and phrases checked against the source with `pdftotext` and `grep -c`, each found), `project.yml` 1-29. The project has no README. `admin/` holds the copyright receipt and a submission PDF, neither a source the brief lists.
- Manuscript root: `manuscript/latex/main.tex`, the source of the published PDF.
- Numbers (manuscript, order 1): authors `main.tex:31`, `:49`; FedAvg aggregation step `:213`; component-count agreement, median, under 5% of rounds `:184`; ACE local, server picks the count, horizontal FL `:188`; $\tau$ in [90, 100], SNR in [1, 50] `:300`; five clients of 40 s from the test blocks, 61/46/63 channels `:389`; 8 bands, 10 bins `:391`; paired t-tests, Holm-Bonferroni `:417`; HOPLS significance, FBTTR against eBTTR means `:423`; 5 min, 3 min, 14 h `:427`; 2-5 MB, simulated communication, one workstation `:429`; subject tables `:445-452`, `:468-475`, `:489-496`; strategy tables `:516-524`, `:538-546`, `:560-568`; FedYogi and FedProx readings `:576-578`; no privacy mechanism `:594`; figure caption `:435`. Venue `project.yml:15`, `:22`.
- Disagreements: `project.yml:26` (the abstract) names FedAdam as an evaluated strategy; the manuscript abstract (`main.tex:64`) names FedAvg and FedYogi and the body tests FedAvg, FedAdagrad, FedYogi and FedProx, with no FedAdam run. `project.yml:14` says FedAvg "matches or beats centralized BTTR (subject-3 thumb 0.76 +/- 0.05 vs 0.71 +/- 0.05)"; the 0.71 is the eBTTR row of `main.tex:490`, and the rows labelled "Centralized BTTR" in the strategy tables (`:524`, `:546`, `:568`) repeat the eBTTR rows of `:446`, `:469`, `:490` value for value. The slides call the comparison FBTTR against eBTTR and state the relabelling.
- Defects in the source: `:389` builds the five clients from the five test blocks, while `:387` puts the last 200 s aside for testing and `:417` runs the statistics over those same five blocks; the second slide states that the clients are the test blocks. The caption of Figure `model` (`:435`) reads the colour as Pearson correlation, while the figure's colour bar runs past -5 and up to 20; the slide's explain line says so. The `:425` reading of "smooth transitions across blocks" is not carried onto the slides.
- Equation: the FedAvg step of `:213`, with the sum's index written out.
- Tag `measured`, "Intra-subject federation".
- Figure: `model.png` (subject 1 block parameters), copied from `manuscript/latex/`. `fbttr.png` in the same folder is used by no `\includegraphics` of the source.
- Ruling 1: BTTR, eBTTR, HOPLS and the comparison decoders are named as the manuscript names them. Two further authors appear only in commented-out lines (`:36-47`) and are not named. The manifest names no related hub project.
- Before: empty `present/`. After: `main.md`, `present.yml`, `model.png`.

### projects/archive/published/2025/fermat, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `admin/conference/main_work.tex` 1-546 (whole, comments included; it inputs no file), `admin/2025316733.pdf` (8 pages, "Certified by IEEE PDFExpress", read through `pdftotext`; seventeen numbers and phrases of the source checked with `grep -c`, each found), `project.yml` 1-34. The project has no README. Also opened to settle the root: `manuscript/main.pdf` (15 pages, arXiv:2412.06815v1, 2 Dec 2024), `manuscript/latex/main_work.tex` (its source, title "Federated Block-Term Tensor Regression for decentralised data analysis in healthcare"), `manuscript/latex/main.tex` (byte-identical by `cmp` to `2022/extended-bttr-note/manuscript/main.tex`, the eBTTR article), `admin/conference/submission_axel_faes.pdf` (the submitted version, titled "... for Heart Disease Prediction").
- Manuscript root: `admin/conference/main_work.tex`. The manifest's title (`project.yml:10`), DOI (`:19`) and venue (`:18`, `:23`) name the FLTA 2025 paper; this file carries that title (`:32`) and its numbers match the IEEE-certified PDF. `manuscript/` holds the arXiv preprint, which `project.yml:15` calls the extended version. Its heart-disease table differs from the root's (corrected in round 1, see "Ruling 6" under "Round 1"): the root's "Hybrid Experiment FBTTR" row and its "Local Experiment FBTTR" client rows (AUC 0.89, 0.92, 0.64, 0.68, `admin/conference/main_work.tex:480-485`) are absent from the arXiv table (`manuscript/latex/main_work.tex:494-511`, `manuscript/main.pdf` Table 5), whose only client rows are the FL4E local rows (AUC 0.842, 0.882, 0.546, 0.542), which the root also carries (`admin/conference/main_work.tex:497-500`).
- Numbers (manuscript, order 1): authors `main_work.tex:34-49`; abstract `:60-72`; federated ACE, shared dimensions `:160-168`; FedAvg step `:199` in Algorithm `fbttr` (`:182-209`); BIC `:276-284`; ECoG data, 62/48/64 electrodes `:316`; 61/46/63 channels, 8 bands, 10 bins `:320`; 5-fold cross-validation, Wilcoxon `:341`; HOPLS and eBTTR significance `:347`; 5 min against 3 min `:351`; ECoG tables `:365-372`, `:388-395`, `:409-416`; FL4E datasets, 740 records, 4 centres, 1,088 patients, 6 centres `:425`; FL4E scenarios `:427-435`; client classes `:456-460`; accuracy gap not significant `:464`; TCGA significance text `:468-470`; heart table `:478-501`; TCGA table `:511-530`; no privacy mechanism `:539`. Venue `project.yml:23`.
- Disagreements: the abstract (`:63`) says FBTTR "surpasses ... centralized BTTR" on Fed-Heart-Disease and cites 0.872 against 0.812; the 0.812 is the centralized FL4E logistic regression (`:501`, model named at `:425`), and centralized BTTR has 0.874 and 0.783 (`:479`). `project.yml:26` (the arXiv abstract) says the same; `project.yml:14` gives both numbers correctly; `project.yml:11` ("matches or beats centralized BTTR") holds for TCGA and for the AUC level on heart disease. The slides give each comparison with its own baseline. The abstract and `project.yml:14` call the subject 3 thumb comparison "centralized"; the table row is eBTTR (`:410`), which the slides name.
- Disagreements inside the manuscript: `:468` says FBTTR outperforms every FL4E strategy and the hybrid runs on TCGA, while the hybrid FedAdagrad row reads 0.776 against FBTTR's 0.775 (`:520`, `:511`); `:468` calls the FedAdagrad and FedProx comparisons non-significant, while the table bolds fully federated FedAvg and FedProx (`:514`, `:517`) and leaves FedAdagrad and FedYogi plain (`:515-516`); `:447` says most heart comparisons are significant, while the heart table bolds six accuracy cells and no AUC (`:478-501`). The slides state the 0.776 and the bolding.
- Gap in the source: the ECoG case (`:313-422`) does not say how the recordings were split into clients; the second slide says so.
- Equation: the FedAvg step of Algorithm `fbttr`, with the sum's index written out.
- Tag `measured`, "ECoG and two clinical datasets".
- No figure: the root uses `image1.png`, the BTTR breakdown of the earlier BTTR article, and `model.png`, byte-identical by `cmp` to the fbttr-strategies figure already on that deck.
- Ruling 1: BTTR, eBTTR, HOPLS, FL4E and Flamby are named as the manuscript names them (FL4E is the framework whose baselines the paper runs, `:427`). The Stage spec carries the extended arXiv version 2412.06815 (`project.yml:15`); the manifest's "naive FBTTR line" names another hub project and is left out under ruling 1.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2025/go-bttr, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.tex` 1-401 (whole, comments included; it inputs no file), `manuscript/main.pdf` (15 pages, the published article, J. Neural Eng. 22 026065, read through `pdftotext`; eight numbers and phrases of the source checked with `grep -c`, each found, and the Utrecht table checked row by row), `project.yml` 1-28. The project has no README. Also opened to settle the root: `manuscript/source/main.tex` (`diff` shows it differs from `main.tex` in the `\hl` macro and the abstract's results and significance paragraphs), `manuscript/go_bttr_manuscript.pdf` and `admin/draft_axel_faes.pdf` (12 pages each, the earlier title "Decoding Sign Language Finger Movements ..."), `admin/highlighted-main.pdf` (the revision with highlights).
- Manuscript root: `manuscript/main.tex`. It carries the published title (`:29`) and the published abstract: "0.719" occurs twice in `main.pdf` and "Subject 5, Dataset 1" not at all, as in `main.tex` and unlike `source/main.tex`.
- Numbers (manuscript, order 1): authors `main.tex:31`; abstract `:39-45`; motivation and eBTTR's lapse `:63`; Utrecht patients, subject 1 excluded `:68`, table `:76-85`; task, 4 gestures, 6 s `:89`; Leuven patients `:102-113`, `:117`; tasks, 26 letters `:119`; BTTR, eBTTR and Go-BTTR grouping `:122`; CGP model `:150-161`; 16 features, 15 gamma bands 60-130 Hz, LMP, 10 bins `:180-183`; 5-fold cross-validation, 60/20/20 split `:197`; Wilcoxon, five test blocks `:199`; threshold 0.08, 95% `:205`; Utrecht table and averages `:226-247`; eBTTR lapse, Utrecht `:263`; Leuven task 1 and lapse `:306`, table `:315-317`; Leuven task 2 significance `:337`; epidural against subdural `:339`; Leuven task 2 table and averages `:350-371`; training times `:389`. Venue and DOI `project.yml:15`, `:19`.
- Disagreements: `project.yml:14` says "ASL alphabet (Utrecht, 5 pts)"; five patients were recorded and four analysed (`main.tex:68`, `:217`); the slides say 4 analysed. `project.yml:26` is the abstract of `source/main.tex` (subject 5 pinky 0.82) rather than the published abstract (the averages); both sets of numbers match the tables, and the slides carry both. The abstract (`:45`) and `project.yml:15` call Go-BTTR computationally efficient, while `:389` gives it the longest training time of the three methods; the slides give the times.
- Defects in the source: the Utrecht table (`:226-244`, also in the published PDF) gives subjects 2, 4 and 5 identical values for every finger and method, with only subject 3 different; the second slide states it. The connectivity caption (`:214`) names subject 1, whom `:68` excludes, while the text (`:205`) names subject 2. The caption of Figure `finger_blocks_3` (`:267`) names subject 2 and the text (`:263`) subject 3. `:183` speaks of "each of the 8 band-pass filtered ECoG signals" after `:182` defines 16 features. `:339` cites "Figures 6 and 8" by fixed number. The CGP display (`:151-159`) writes the model's first line and its expansion as one chain of equalities; the slide's equation is the model of `:153-156` written once.
- Equation: the Causal Graph Process of `:153-156`.
- Tag `measured`, "Two sign-language ECoG datasets".
- Figure: `gobttr.jpeg` (the Go-BTTR scheme), copied from `manuscript/figs/`.
- Ruling 1: BTTR, eBTTR, HOPLS, the CGP (cited as `mei2016signal`) and the Utrecht dataset are named as the manuscript names them (eBTTR is the method Go-BTTR extends, `:63`). No hub project is named. The authors spec gives the first two and the last of the eight authors of `:31`, with the count.
- Before: empty `present/`. After: `main.md`, `present.yml`, `gobttr.jpeg`.

### projects/archive/published/2026/abduction, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.tex` 1-317 (whole, comments included; it inputs no file), `manuscript/main.pdf` (12 pages, read through `pdftotext`; eleven numbers and phrases of the source checked with `grep -c`, each found), `project.yml` 1-27. The project has no README. `manuscript/supp.tex` is byte-identical by `cmp` to the eBTTR article's supplement (`2022/extended-bttr-note/manuscript/supp.tex`) and is input by nothing; `manuscript/abduction/` holds rebuttal drafts and glove pictures, `admin/` the response, cover letter and a review patch; none is a source the brief lists.
- Manuscript root: `manuscript/main.tex`, the source of `main.pdf` and of the title in `project.yml:10`.
- Numbers (manuscript, order 1): authors `main.tex:35`; venue `:49`; patients and grids `:88-99`, `:103`; tasks, 150 trials, 26 letters, 120 trials, 480 s `:125`; eBTTR model `:160-167`; 16 features, 15 gamma bands 60-130 Hz, LMP, 10 bins `:170`; one model per task, 5-fold cross-validation `:181`; Wilcoxon over five test blocks `:183`; re-implemented baselines `:187-199`; thumb weakest, glove explanation `:209`; significance claim `:211`; chance level, 90th percentile `:213`; epidural explanation `:215`; flexion table `:229-231`; abduction table `:246-260`; cross-task `:271`, table `:280-281`; "on par" reading `:295`; limits `:299`. Venue `project.yml:15`, `:22`.
- Disagreements inside the manuscript: `:211` says eBTTR significantly outperforms the other methods for all finger pairs, while the abduction table (`:248-260`) leaves 12 of its 40 baseline cells unbolded (counted per row with `grep -o textbf`), 10 of them CNN and LSTM, with LSTM equal to eBTTR on subject 1 index-middle (0.32, `:246`, `:252`); `:209` and `:293` attribute the weak thumb result to the glove having no dedicated thumb abduction sensor, while the glove figure (`dataglove.png`, `:106`, viewed) lists sensor 2 as "Thumb-index finger abduction"; the caption of Figure `raw_signal` (`:219`) names the thumb-index pair, while the plot legend (viewed) names index-middle abduction; `:295` calls the letters-to-single-finger transfer on par, while `:281` against `:229` gives 0.27 against 0.45 for the index. The slides state each.
- The manifest (`project.yml:11`, `:14`, `:25`) gives no numbers; it says abduction is decoded with precision comparable to flexion, which the slides give with the numbers and the thumb exception the manuscript states.
- Equation: the eBTTR model of `:162-163`, with the residuals written once outside the sums (the source writes $\underline{\mathbf{E}}_k$ and $\mathbf{F}_k$ inside them) and the last factor as $\mathbf{P}_k^{(N)}$ (the source writes $(n)$).
- Tag `measured`, "Two epidural ECoG patients".
- Figure: `raw_signal.png` (predicted and recorded abduction with the features of one electrode), copied from `manuscript/`.
- Ruling 1: eBTTR, BTTR, the five baselines and the HD-sEMG study of Hu et al. are named as the manuscript names them; the slides name eBTTR and the baselines only. Method item 1 names Bleichner et al. 2016 and its 4 gestures, as `main.tex:205` does. The sign-language decoder of another hub project is left out under ruling 1.
- Before: empty `present/`. After: `main.md`, `present.yml`, `raw_signal.png`.

### projects/archive/published/2026/dongho-ecg-clustering, 2 slides (replaced)

- Sources read: `manuscript/main.tex` 1-840 (whole; it inputs no file), `manuscript/main.pdf` (24 pages, the marked revision built from it; "0.265", "0.549" and "434.713" found with `pdftotext` and `grep -c`), `README.md` 1-123, `CLAUDE.md` 1-27 (facts only; `AGENTS.md` is a symlink to it), `project.yml` 1-49. The README names `code/results/*.csv` as the source of its numbers; every number on the slides comes from the manuscript, so no CSV was needed. `manuscript/figures/fig1_ari_heatmap.pdf` and `fig2_silhouette_trap.pdf` were rendered to PNG in the scratchpad with `pdftoppm` to compare them with the deck's existing PNGs.
- Manuscript root: `manuscript/main.tex`, the accepted revision (`project.yml:21`); `submitted-2026-06-30/` holds the first submission.
- Numbers (manuscript, order 1): authors `main.tex:54-55`; cohort 2,542, 1,282/1,260, majority 0.504 `:198-199`; MIT-BIH 3,000 beats, 47 records `:210-211`; representations, lead II, 1992-d `:219-256`; clusterers `:271-291`; ceilings and probes `:307-311`; ten seeds, Wilcoxon `:311-312`; 9:1 subsample `:318`; ARI definition `:330`; federation, ten sites, Dirichlet `:380-393`; Table 1 and intervals `:413-432`; out-of-fold axis 0.160 to 0.549, 0.000 to 0.001 `:521-524`; silhouette 0.81, 0.28 `:550-554`; scaler means `:577-580`; MIT-BIH 0.783, 0.127, 0.927, 0.049 `:589-608`; imbalance 0.265 and 0.063 `:622-623`; federation retention, worst draw 0.455, three draws at 0.132 or below `:632-637`, Table `:652-655`; cost `:703-707`; native-rate check 0.896 and 0.909 `:775`; limits `:779-796`. Authors and supervisor `project.yml:8-9`, `:43`; stage and venue `:2`, `:15`, `:21`.
- Disagreements: `project.yml:26` and `README.md:28` give the imbalance result as AMI 0.214 against 0.143 (one draw at seed 0); the manuscript (`main.tex:622-624`) gives the ten-seed means, ARI 0.265 against 0.063 and AMI 0.245 against 0.148; the slide carries the manuscript's ARI. `project.yml:6` titles the paper "... on PTB-XL", while `main.tex:51-52` ends at "arrhythmia structure"; the sub line follows the manuscript. `README.md:29` gives the MIT-BIH conv-AE as ARI 0.11 (its $k$-means value, `main.tex:607`); the slide gives its best, 0.127. `README.md:7` and `CLAUDE.md:27` say there was no external peer review, while `README.md:67` and `project.yml:21` record acceptance after a major revision; the slides state only the acceptance. `README.md:3` still gives the revision as due on 2026-10-02.
- Equation: the ARI definition of `main.tex:330`. The earlier deck's equation had $1$ in the denominator where the manuscript has $\max \mathrm{RI}$.
- Tag `measured`, "Two public ECG databases".
- Figure: `dongho_silhouette.png`, kept from the earlier deck; it shows the same points as the manuscript's `fig2_silhouette_trap.pdf` (compared by rendering both), in an earlier style.
- Ruling 1 and the student rule: the manuscript frames the study as a re-examination of a master's project (`main.tex:104-111`, `:556`, `:734-738`), and `README.md:3`, `:15` name it as the first author's MSc thesis; the slides do not mention it and describe the silhouette trap on the benchmark's own numbers. Authorship follows the manifest: `lead: [dongho]`, `supervisors: [axel-faes]`, authors "Dongho Chun, Axel Faes". HuBERT-ECG, ECGFounder and the closest benchmark's finding are named only through the two models the manuscript tests.
- Before (5 files): `main.md` (1 slide; it led with "simple hand-crafted rhythm features beat billion-parameter foundation models" and an LDA recovery of 0.92 from HuBERT-ECG, which `README.md:24`, `:42` record as overturned), `present.yml`, `dongho.png`, `dongho_silhouette.png`, `eq_dongho.png`. After (5 files): `main.md` and `present.yml` rewritten; the three PNGs kept unchanged, `dongho_silhouette.png` drawn on slide 2, `dongho.png` (the ARI heatmap, same values as Table 1) and `eq_dongho.png` (a rendered equation image) not drawn.

### projects/archive/published/2026/erp-signatures, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `README.md` 1-40, `project.yml` 1-30. The project has no CLAUDE.md and no results file named by the README.
- Manuscript root: none read. The paper exists only as Word files (`manuscript/main.docx`, `manuscript/main_revised.docx`); item 1 names a `.tex` or a PDF as the manuscript, so the Word files were not opened and the README stands first in the order. This is listed under "wrong or impossible in the brief".
- Numbers (README, order 2): nine variants, three stimulus types, three task structures, UCR 36 doing 4 of 9, Leuven 16 of 23, Maribor 16 of 72, whole-scalp cluster tests on N2 and P3 `README.md:7`; 16 per variant `:22`; independent-groups comparison, conservative `:24`; 8-participant re-check as a smoke test `:28`. Fronto-central clusters for words against pictures `project.yml:28-29` (abstract, order 3); task structure mattering less `:16`. Authorship `project.yml:19-20`, `:24`; venue and stage `:17`, `:19`.
- Disagreements: the third author is "Yide Li" in `project.yml:24` and "Yang Li" in `README.md:3`; the spec gives "Y. Li".
- No equation: the sources give none.
- Tag `measured`, "Nine N-Back variants".
- No figure: the sources hold none outside the Word files.
- Ruling 1: the README names the earlier midline-only analysis by its authors (`README.md:7`) and mentions an internship report (`:22`); the README is not the manuscript, so the slide describes the earlier analysis without naming it and leaves the internship report out. Authorship follows `lead` and `outcome`: equal first authorship of Pergher and Faes.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2026/glassbox-decision-pipelines, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.tex` 1-169 (whole; it inputs no file), `manuscript/main.pdf` (8 pages; "0.160", "28 of 28" and "0.755" found with `pdftotext` and `grep -c`), `README.md` 1-128, `project.yml` 1-47. The project has no CLAUDE.md. The README names `results/*.json` as the record behind the tables; every number on the slides is in the manuscript or stated in the README, so no JSON was needed.
- Manuscript root: `manuscript/main.tex`, the camera-ready (`README.md:96`).
- Numbers (manuscript, order 1): task, cohorts, 14,000 and 65,000, 12.9% and 4.3% `main.tex:49`; named-feature model, 165 features, six encoders, same head `:52`; corruptions `:55`; DeLong, TOST at 0.02, five fits `:58`; clean equivalence p = 0.017 and 0.010 `:63`; severe EMG 0.754, 0.812 to 0.614, MIMIC +0.010 sign flip `:66`; Table 1 `:80-86`; lead dropout 0.677, 0.750, 0.745, 0.788 `:91`; age lift 48 cells, ranges, HuBERT-ECG, ECG-FM, xECG gains, age alone 0.755, 28 of 28 `:94`, Table 2 `:106-113`; transport 0.772, 0.755, 0.753, 0.687 `:123`; limits `:157`. README (order 2): the clean transport edge +0.017 not sign-stable `README.md:26`, `:36`; dead ends `:88-91`; 0.160 measured as 0.15917 `:105`. Venue `project.yml:29`, `:42`.
- Disagreements: the manuscript prints the largest age gain as 0.160 in five places; `README.md:105` gives the measured value 0.15917 (HuBERT-ECG, CODE-15, lead dropout), which rounds to 0.159. The slides keep the manuscript's 0.160 by the precedence order and state the measured 0.159 among the limits. `project.yml:34` ("by up to +0.160") follows the manuscript. The manuscript does not say that the clean MIMIC-to-CODE-15 transport edge changes sign across fits (`main.tex:123` reports it without a stability check); `README.md:26`, `:36` say it does; the slide states the README's finding.
- No equation: the manuscript has no displayed equation.
- Tag `measured`, "MIMIC-IV-ECG and CODE-15".
- No figure: the manuscript has none (`README.md:50`), and the talk figures in `admin/talk/` are not a source the brief lists.
- Ruling 1: the six encoders, the datasets and the age-from-ECG citation are named as the manuscript names them. `project.yml:11` relates the project to ecg-readable-substrate and `README.md:22`, `:69`, `:75` name it; the slides do not. The README's superseded submitted thesis (`:24-26`) appears on slide 2 only as the measured unequal-input numbers the manuscript itself reports, labelled as such.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2026/hcc-modality-poster, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (one A0 page, read whole as `pdftotext -layout` text and as a 40 dpi render in the scratchpad), `project.yml` 1-23. The project has no README, no CLAUDE.md and no `.tex`.
- Manuscript root: `manuscript/main.pdf`, the poster itself, the only paper form the project holds. Line numbers below are lines of `pdftotext -layout main.pdf -`.
- Numbers (poster, order 1): DINO heads frozen, shared backbone, Transformer for longitudinal modelling `:12-13`; same weights, 4 independent forward passes `:27`; 4-6 layers, pre-LN `:40`; table rows 0.718/0.720/0.705/0.734, 0.795/0.690/0.670/0.772, 0.729/0.731/0.714/0.787, 0.808/0.753/0.738/0.844 `:54-61`; single-group bars DWI 0.808 `:54`, DCE 0.780 `:55`, T1-IOP 0.753 `:58`, T2W 0.738 `:60`, all four 0.844 `:63`; 5 folds x 3 seeds `:64`; single-centre retrospective cohort `:69`; about 240, about 37, 15.4% `:72`; removal costs 0.058 `:75`, 0.044 `:77`, 0.028 `:78`, 0.020 `:80`; within-group contrastive views `:77-78`; +0.072 `:76` and +0.053 `:81`; DWI and DCE contribute most `:82`. Venue, authors and stage `project.yml:5`, `:14`, `:19`.
- Disagreements: none between the poster and the manifest. Within the poster, +0.072 is 0.844 - 0.772 and +0.053 is 0.787 - 0.734, and 37 of 240 is 15.4%; all agree.
- No equation: the poster gives none (the $\sqrt{t}$ positional encoding is named in the method list).
- Tag `measured`, "Multi-modal liver MRI".
- No figure: the project holds the architecture diagram and charts only inside the PDF; a render of a PDF is not copied into `present/`.
- Judgment: the poster's single-group chart does not say which design its bars come from; the slide states that its DWI, T1-IOP, T2W and all-four values equal the pretrained encoder-head row, and states among the limits that DCE alone appears only in that chart.
- Ruling 1: `project.yml:10` relates the project to hccnet-revision; the slides do not name it. Authorship follows `lead: [axel-faes]` and `publication.authors`.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/archive/published/2026/hccnet-fl, 2 slides (replaced)

- Sources read: `manuscript/main.tex` 1-85 and every file it inputs, whole: `sections/0_abstract.tex` 1, `1_introduction.tex` 1-15, `2_related_work.tex` 1-14, `3_method.tex` 1-91, `4_setup.tex` 1-39, `5_results.tex` 1-43, `6_discussion.tex` 1-7, `7_conclusion.tex` 1 (`8_acknowledgment.tex` 1 is commented out at `main.tex:79-80`, read anyway), and `tables/descriptives.tex` 1-18, `main_results.tex` 1-22, `ablation_split.tex` 1-16, `ablation_stage.tex` 1-16, `label_skew.tex` 1-18, `cadence.tex` 1-16, `modality.tex` 1-15, `communication.tex` 1-15; `manuscript/main.pdf` (8 pages; 17 lines with 0.713, 0.724, 0.566, 0.574, 55.2 or 0.640 found with `pdftotext` and `grep -c`, so it matches the `.tex`); `README.md` 1-49; `CLAUDE.md` 1-23 (facts only; `AGENTS.md` is a symlink to it); `project.yml` 1-43.
- Manuscript root: `manuscript/main.tex`, the accepted FLTA paper (`README.md:3`); `admin/submission/` and `notes/history/` hold PDFs the brief does not list as sources.
- Numbers (manuscript, order 1): cohort 963, 243, 804, 37 `4_setup.tex:3`, `descriptives.tex:15`; patient-level silos, K = 5, 5-fold CV `4_setup.tex:5`; R = 60, E = 1 `:29`; Pico 22.0M, backbone 13.8M `:33`; 2.6 of 5 silos evaluable `:39`; Stage A and B `3_method.tex:47-64`; equation `3_method.tex:53-56`; AUPRC 0.713, 0.724, 0.677, 0.744, 0.628 `main_results.tex:12-19`, $\Delta$ 0.036, CI [0.011, 0.061], p = 0.006 `5_results.tex:5`; ECE 0.118 to 0.074 `:5`; inverted 0.574 `ablation_split.tex:12`; 0.402 and 0.701 `ablation_stage.tex:10-11`; label skew 0.713 to 0.671, 0.628 to 0.503, worst silo 0.566, 0.274, 0.280 `label_skew.tex:13-15`; cadence 0.718, 0.694, 0.671, 0.641, 0.583, 0.547, 0.601 `cadence.tex:10-13`; modality worst silo 0.351, 0.408, 0.489 `modality.tex:10-12`; 88.0 MB, 55.2 MB, 5.28 GB and 3.31 GB (37%) `communication.tex:10-11`, `5_results.tex:41`; field strength not an axis `4_setup.tex:3`; parameters in the clear `6_discussion.tex:7`. README (order 2): independent re-implementation run on a synthetic cohort, numbers not re-run `README.md:7`, `:25`. Venue and stage `project.yml:3`, `:39`; authors `:38`.
- Disagreements: (1) `tables/label_skew.tex:3` says its $\alpha=\infty$ column is the partition of the main table, yet its FedRep value is 0.640 (`:14`) where `main_results.tex:14` gives 0.661; FedAvg and CAF agree. The slides use neither FedRep value at $\alpha=\infty$. (2) `5_results.tex:5`, the abstract and `1_introduction.tex:14` say CAF significantly outperforms FedBN; `6_discussion.tex:1` says it "matches" the strongest baseline and `7_conclusion.tex:1` says "at the accuracy of the strongest baseline". The slides give the measured gap and its test. (3) `4_setup.tex:33` gives HCCNet-Compact as 16.5M parameters; `README.md:25` gives "Compact 12.4M" for its forked re-implementation. The slides do not use the Compact model. (4) `project.yml:20` gives "37-55% less communication", which agrees with `communication.tex`.
- Equation: the sample-weighted backbone aggregation of `3_method.tex:54`.
- Tag `measured`, "Simulated silos from one cohort".
- No figure drawn: the manuscript's only figure is TikZ code (`3_method.tex:20-43`), and the project holds no image file.
- Ruling 1: HCCNet is named because the manuscript names it as what CAF builds on (`3_method.tex:3`); FedAvg, FedProx, FedBN and FedRep are named as the baselines the manuscript compares. `project.yml:10` relates the project to hccnet-revision and hccnet-fl-sweden; the slides name neither project.
- Before (3 files): `main.md` (1 slide with a panel holding `diagram_html`; it claimed "~97% of the centralized AUPRC", a 13.8M / 8.2M split and "-37% comms", which the manuscript does not state in that form), `present.yml` (title "Training one liver-cancer model across hospitals - sharing only the backbone"), `eq_hccnetfl.png`. After (3 files): `main.md` and `present.yml` rewritten (title "HCCNet-FL", the manifest `short`); `eq_hccnetfl.png` kept unchanged (`cmp` against the base copy) and not drawn, since the equation field carries the aggregation.

### projects/coauthor/active/flkit, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `README.md` 1-17, `project.yml` 1-27. The folder holds nothing else: no manuscript, no CLAUDE.md, no results file.
- Manuscript root: none; the paper is the lead author's and the hub does not hold it (`README.md:9`, `project.yml:13`).
- Numbers and facts (README, order 2; manifest, order 3): toolkit contents and the onboarding framing `README.md:5`, `project.yml:15`; lead and shared first author `README.md:5`, `project.yml:22`; ten authors `project.yml:22`; submitted to JMIR `README.md:13`, `project.yml:3`, `:23`; GitHub repository `project.yml:11`; evaluation not held `README.md:9`.
- Disagreements: `project.yml:17` says "In preparation, submitted to JMIR", while `project.yml:3` and `README.md:13` say submitted and under review; the slide gives "submitted".
- No equation, no figure: the sources give none.
- Tag `design`, "Onboarding toolkit".
- Authorship: `lead: [pirmani]`; the slide names the lead author and the group and calls A. Faes a coauthor, as `README.md:5` does.
- Ruling 1: `project.yml:9` relates the project to fl-kit-elixir-federated-learning-kit; the slide does not name it.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/published/2016/chi-household-survival, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (4 pages, the CHI EA extended abstract, read whole with `pdftotext`), `project.yml` 1-30. The folder holds nothing else.
- Manuscript root: `manuscript/main.pdf`, the only paper form held. Line numbers are lines of `pdftotext -layout main.pdf -`.
- Facts (abstract, order 1): four objects and their effects, the abstract and the object list (page 1-2, mousetrap `:99`); the proposed objects not implemented (page 3); calibration by two rigid bodies `:145`; Unity in .NET/C# and the short-throw projector `:155-169`; Android Wear scoreboard `:181`; student project for a university course `:144`. Manifest (order 3): authors and shared first authorship `project.yml:14`, `:19`; venue and pages `:20`; still used as a teaching example `:29`.
- Disagreements: none on content. The manifest's `publication.url` (`project.yml:22`) names a file "purpose-centric-sgc.pdf"; it is a website path and is not on the slide.
- No equation; no figure: the sources give no equation, and the figures exist only inside the PDF.
- Tag `design`, "Game prototype". No numbers: the abstract reports none, and the slide says no user study is reported.
- Authorship: `lead: [brent-berghmans]`; the spec gives the author order with the shared first authorship of `project.yml:14`.
- Ruling 1: `project.yml:10` relates it to chi-purpose-centric; the slide does not name it. The hook names RoomAlive and iCon with the paper's contrast (`main.pdf` page 1, related work); PlayAnywhere, a tabletop system the paper cites as background, is not on the slide.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/published/2016/chi-purpose-centric, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (7 pages, read whole with `pdftotext`), `project.yml` 1-23. The folder holds nothing else.
- Manuscript root: `manuscript/main.pdf`, the only paper form held. Line numbers are lines of `pdftotext -layout main.pdf -`.
- Facts (paper, order 1): the bottle-cap example of affordance mapping `:74`, `:83`; Household Survival as the tower-defence testbed `:92`; iCon `:95`; the mop or broom, pedestal fan, vacuum cleaner and K'nex mousetrap (page 3, Figure 3); bottles, mugs, pen clicker, iron and hair dryer `:171-183`; no formal evaluation `:197`; informal demonstrations `:214`; later studies of usability, learnability and immersion (Conclusion and Future Work, page 6). Manifest (order 3): authors `project.yml:19`, venue and pages `:20`.
- Disagreements: `project.yml:14` and `:20` place the paper in the Student Game Competition, while `project.yml:22` names the file "purpose-centric-lbw.pdf"; the PDF names no track. The slide follows `outcome` and `book`.
- No equation; no figure: the sources give no equation, and the figures exist only inside the PDF.
- Tag `design`, "Interaction concept".
- Authorship: `lead: [kashyap-todi]`; the spec gives the author order of `project.yml:19`.
- Ruling 1: the paper itself names its testbed game "Household Survival" (`:92`), so the spec names it as the paper does; the slide does not refer to the hub's chi-household-survival project (`project.yml:10`). iCon is named because the paper names it as the approach it contrasts with.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/published/2017/algebraic-effects-compilation, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (34 pages: two report cover pages and the 32-page paper with appendices A to C, read whole with `pdftotext`; page 1:22 rendered at 90 dpi in the scratchpad to read the bar labels of Figure 14), `project.yml` 1-31. The folder holds nothing else.
- Manuscript root: `manuscript/main.pdf`, the CW708 report. Places are given as the paper's page numbers (1:N).
- Numbers and facts (paper, order 1): rewrite rules and Theorem 4.1 (Section 4.1, 1:9-1:10); specialisation rule, the equation on the slide (1:10), and the generalised rule, a selective CPS transform (1:11-1:12); termination by not re-specialising (1:12-1:13); basic translation and Theorem 5.1 (Section 5, 1:13-1:15); purity-aware translation and Theorem 6.2 (Section 6, 1:16-1:17); higher-order functions labelled impure (Section 7.3, 1:19); machine (Section 8, 1:21); 25x-50x and 1x-1.5x, handlers and free monad eliminated, OCaml 4.02.2 (Section 8.1, 1:21); Figure 14 bar values (1:22, read from the render: 100, 78.5, 35.4, 2.4, 2.3; 100, 74.3, 37.4, 2, 1.9; 100, 56, 62.3, 5.5, 3.8; 100, 34, 85, 3.3, 2.3); bytecode, Links 20 times slower, Eff fastest, 25-30% faster than Multicore OCaml (Section 8.2, 1:22); nested handlers as future work (Section 10, 1:24). Manifest (order 3): authors `project.yml:23`, report number and date `:13`, `:24`, code deposited `:19-21`.
- Disagreements: none. The manifest's 25x-50x, 1x-1.5x and 25-30% (`project.yml:12`) match the paper. Figure 14's ratios agree with the text: 100/3.8 = 26 and 100/1.9 = 53 for basic against hand-written; 2.4/2.3, 2/1.9, 5.5/3.8 and 3.3/2.3 lie between 1.04 and 1.45.
- Equation: the function-specialisation rewrite of 1:10. It renders with KaTeX (`node -e` with `katex.renderToString(..., {throwOnError: true})` returned 5349 characters).
- Tag `mixed`, "Compiler and benchmarks": three soundness and type-preservation theorems with proofs, and measured benchmarks.
- No figure: the paper's charts exist only inside the PDF.
- Authorship: `lead: [matija-pretnar]`; the spec gives the author order of `project.yml:23`.
- Ruling 1: Eff, OCaml, Multicore OCaml, Handlers in Action, Eff Directly in OCaml, DelimCC and Links are named as the paper names them as its language, target and compared systems. No hub project is named.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/published/2017/http2-best-practices, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (13 pages, read whole with `pdftotext`), `project.yml` 1-27. The folder holds nothing else.
- Manuscript root: `manuscript/main.pdf`, the WEBIST 2017 paper. Places are given as section numbers of the paper.
- Numbers and facts (paper, order 1): contradictory earlier studies and single-tool setups (Section 2); Speeder components, Docker, the default NGINX + Chrome + Webpagetest + dynamic model setup, two Dell PowerEdge R420 machines and "all tests are equally influenced" (Section 3, Table 1); dynamic model levels NoLoss to VeryPoor (Section 3); 10 to 100 page loads per point, at least five runs (Section 4); 380 icons, sprite two to five times faster, near par (4.1.1); tipping points 30-40 CSS files and about 100 JS files (4.1.2); Chrome and Firefox render blocking (4.1.3, Table 3); 14 KB initial window, Apache for Push since NGINX lacked it, the Apache priority bug and the late font (4.2); sharding over 50% for large files, HPACK 25% to 50% (4.3, Table 4); nine websites and no definitive conclusions (Section 5); implementation causes and the single TCP connection (Sections 6-7); the four contribution statements (Section 1). Manifest (order 3): authors `project.yml:20`, venue `:21`.
- Disagreements: none. `project.yml:12` and the abstract at `:26` say the same as the paper's Sections 1 and 7.
- No equation, no figure: the paper gives no equation, and its charts exist only inside the PDF.
- Tag `measured`, "Emulated network measurements".
- Authorship: `lead: [robin-marx]`; the spec gives the author order of `project.yml:20`.
- Ruling 1: Speeder is the paper's own framework; the tools and browsers are named as the paper names them. `project.yml` names no related project, and the HTTP/2 paper of 2018 is not named on the slides.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/published/2018/http2-web-performance, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (25 pages, read whole with `pdftotext`), `project.yml` 1-27. The folder holds nothing else.
- Manuscript root: `manuscript/main.pdf`, the extended WEBIST paper. Places are given as section numbers of the paper.
- Numbers and facts (paper, order 1): four aspects (abstract, Section 1); Speeder extended with H2O, Chrome v60, Firefox v54 and H2Vis (Section 3, Table 1); dynamic model, loadEventEnd and SpeedIndex (Section 3); 30 large images, almost 80% slower with loss for HTTP/2 while HTTP/1 is similar (4.2); JS applied in chunks of 50 to 300 files (4.3); Round Robin and FCFS in H2O, Round Robin worse for SpeedIndex on Poor, Service Worker and async/defer findings (5.2); Push on one example page, full evaluation out of scope (6.2); HPACK factor of more than five for 400 small files, too low to matter for one page load (7.2, Table 2); corpus A of 9 pages, corpus B of 40 pages from Alexa and Moz, at least 10 and 20 loads, medians, light against heavy pages under Poor, disagreement with live-internet studies, corpus A too small to find causes (Section 8); several connections help HTTP/2 on bad networks (Section 9); three figures marked "Image taken from our previous work" (`grep -c` on the text gives 3). Manifest (order 3): authors `project.yml:20`, venue and pages `:21`.
- Disagreements: none on content. The PDF carries no page numbers or venue line; the pages 87-114 and the 2018 venue come from `project.yml:13`, `:21`.
- No equation, no figure: the paper gives no equation, and its charts exist only inside the PDF.
- Tag `measured`, "Synthetic and real page loads".
- Authorship: `lead: [robin-marx]`; the spec gives the author order of `project.yml:20`.
- Ruling 1: the paper builds on the authors' Speeder framework and earlier WEBIST 2017 paper ([18]); the slides name Speeder, as the paper does, and refer to "the authors' earlier paper" without naming the hub's http2-best-practices project. Sentences on this deck differ from the http2-best-practices deck; the shared facts (the 14 KB window, the Apache priority bug) are left off this deck.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/published/2023/coordinated-fingers-ecnr, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (one page, the ECNR abstract, read whole with `pdftotext`; 40 non-empty lines), `project.yml` 1-23. The folder holds nothing else.
- Manuscript root: `manuscript/main.pdf`. Line numbers are lines of the non-empty `pdftotext` output.
- Numbers (abstract, order 1): four healthy participants, eight movements, 62 electrodes, data glove `:19-23`; 8-30 Hz power, grasp against pinches at 80%, single fingers just above 50% `:24-29`; MRCP in 0.3-3 Hz from -0.5 s, not separable, one literature report differs `:30-35`; onset detection and feature engineering `:35-39`. Manifest (order 3): authors `project.yml:19`, venue `:20`.
- Disagreements: the manifest title (`project.yml:11`) reads "Its Implication", the abstract (`:2`) "Its Implications"; the sub-title follows the abstract.
- No equation, no figure: the abstract has neither.
- Tag `measured`, "Four-participant EEG study".
- Authorship: `lead: [qiang-sun]`; the spec gives the author order of `project.yml:19`.
- Ruling 1: `project.yml:10` relates it to proprioception-exoskeleton; the slide does not name it. The earlier MRCP report is mentioned without a name, as the abstract does.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/published/2023/ecog-frequency-features, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (12 pages, the published J. Neural Eng. article, read whole with `pdftotext`; the supplement is not in the folder), `project.yml` 1-27. The folder holds nothing else.
- Manuscript root: `manuscript/main.pdf`. Places are given as section numbers of the article.
- Numbers (article, order 1): nine participants, 38-64 electrodes (2.1); LMP and seven bands, delta 0-5 Hz to HGB 100-200 Hz, 20 Hz (2.3); OLS, one-second window of 20 taps, up to 10 channels, 3-fold cross-validation, 45 values per feature (2.4); equation (4) with $c$ and $th$ (2.4); LMP best for dynamics, HGB best for events, paired t-tests (3.1); 1.5 Hz and 3.5 Hz cut-offs (2.3, 3.1); 0.4 and 0.46 for participant 9 (Figure 5 caption); 0.5 against 0.45 and lower rest variance (3.2); 250 ms, window length, spatial spread for thumb and index (3.3); co-activation, imperfect event detection, 60-100 Hz and above 100 Hz, inconclusive repetition check (Section 4). Manifest (order 3): authors `project.yml:21`, venue and DOI `:15`, `:18`.
- Disagreements: none. `project.yml:14` gives 0.45 to 0.50, as the article does.
- Equation: the article's equation (4).
- Tag `measured`, "Stanford ECoG, nine participants".
- No figure: the article's figures exist only inside the PDF.
- Authorship: `lead: [eva-calvo-merino]`; the spec gives the author order of `project.yml:21`.
- Ruling 1: Liang and Bougrain's whole-spectrum decoder is named because the article names it as the comparison it replicates (2.6). No hub project is named.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/published/2023/modulation-lmp-bci, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (one page, the BCI Meeting abstract, read whole with `pdftotext`; 43 non-empty lines), `project.yml` 1-22. The folder holds nothing else.
- Manuscript root: `manuscript/main.pdf`. Line numbers are lines of the non-empty `pdftotext` output.
- Numbers (abstract, order 1): two Block-Term Tensor Regression models, LMP below 3.5 Hz and high gamma above 60 Hz `:12-15`; equation (1) `:16-21`; $C$ and threshold by cross-validation `:22-23`; BCI Competition IV Dataset 4, correlation 0.56 `:24-25`; participant 1 rest variance 0.011 against 0.03 `:26-27`; discussion `:29-30`. Manifest (order 3): authors `project.yml:18`, venue `:19`.
- Disagreements: the abstract's title (`:1-2`) is "High-gamma band event detection improves stability of finger trajectories decoded from ECoG-LMP activity"; `project.yml:10` gives "Modulation of LMPs using the gamma band increases the stability of finger trajectories decoded from ECoG". The sub-title follows the abstract; the deck title keeps the manifest `short`.
- Equation: the abstract's equation (1), with the threshold written as in the abstract. It renders with KaTeX (7301 characters, `throwOnError: true`).
- Tag `measured`, "BCI Competition IV ECoG".
- No figure: Figure 1 exists only inside the PDF.
- Authorship: `lead: [eva-calvo-merino]`; the spec gives the author order of `project.yml:18`.
- Ruling 1: Block-Term Tensor Regression is named because the abstract names it, with its reference, as the model it trains; the compared decoder is called "the multiband block-term decoder" as the abstract describes it. No hub project is named.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/published/2024/highgamma-event-detection, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (one page, the abstract as printed in the meeting proceedings, read whole with `pdftotext`; 63 non-empty lines), `project.yml` 1-22. The folder holds nothing else.
- Manuscript root: `manuscript/main.pdf`. Line numbers are lines of the non-empty `pdftotext` output.
- Numbers (abstract, order 1): proceedings of the 10th International Brain-Computer Interface Meeting 2023, DOI 10.3217/978-3-85125-962-9-23 `:1-11`; two block-term tensor regression models below 3.5 Hz and above 60 Hz `:23-26`; equation (1) `:27-32`; $C$ and threshold by cross-validation `:33-34`; Dataset 4, 0.56 `:35-36`; subject 1, 0.011 against 0.03 `:37-38`; discussion `:40-41`. Manifest (order 3): authors `project.yml:18`.
- Disagreements: (1) `project.yml:12`, `:13`, `:19` place the abstract at the International BCI Meeting 2024; the PDF is the 2023 proceedings of the 10th International BCI Meeting (`:2-11`). The venue spec follows the PDF. (2) This PDF and `modulation-lmp-bci/manuscript/main.pdf` carry the same abstract text (title, methods, 0.56, 0.011 against 0.03, references; read side by side), differing only in the proceedings frame (`md5` differs: b8e76fec... against 7d4caabd...). Two hub projects therefore hold one abstract under two manifests with different titles, years and venues. This is listed under "wrong or impossible in the brief"; the manifests are outside the path list and were not changed.
- Equation: the abstract's equation (1) in its full form with $f(\cdot)$. It renders with KaTeX (9862 characters, `throwOnError: true`).
- Tag `measured`, "ECoG finger decoding abstract".
- No figure: Figure 1 exists only inside the PDF.
- Authorship: `lead: [eva-calvo-merino]`; the spec gives the author order of `project.yml:18`.
- Ruling 1: block-term tensor regression is named as the abstract names it. The slide does not name the modulation-lmp-bci project. Its sentences differ from that deck's; the shared lines (`comm -12` of the two `main.md` files) are the sub-title, which is the title printed on both PDFs, and the Authors and Stage specs, facts true of both.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/published/2025/editorial-bigdata-ai-ms, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (3 pages, the published editorial, read whole with `pdftotext`; 203 non-empty lines), `README.md` 1-9, `project.yml` 1-27. `manuscript/working-document-editorial.docx` was not opened: it is a Word working draft, and item 1 names the `.tex` or the PDF as the manuscript.
- Manuscript root: `manuscript/main.pdf`, the published article. Line numbers are lines of the non-empty `pdftotext` output.
- Facts (editorial, order 1): authors and citation `:15-23`; MS heterogeneity and the Topic's aim `:49-61`; CLAIMS, treatment regimens, volumetry in clinically isolated syndrome `:63-81`; trustworthy ML, PROMs, EHDS, DARWIN-EU, OHDSI, EBRAINS, ELIXIR `:83-107`; MRI `:110-117`; digital monitoring `:119-131`; conclusion with the open issues `:133-141`; biomarker review, most papers in the past four years `:147-154`. README (order 2): no experiment pipeline `README.md:5`.
- Disagreements: (1) `project.yml:9` titles it "Editorial introduction 'The use of big data and AI in MS'"; the article (`:20-22`) is "Editorial: Use of big data and artificial intelligence in multiple sclerosis". The sub-title follows the article. (2) `project.yml:20` lists the authors as "Liesbet Peeters, Axel Faes, et al."; the article (`:23`) and `README.md:3` give exactly three: Peeters, Faes, Hartung. The spec follows the article.
- No equation, no figure: the editorial has neither.
- Tag `design`, "Editorial": an editorial reports no measurement, proof or method; of the four classes, `design` is the one that does not claim data. Listed as a judgment call.
- Authorship: `lead: [peeters]`; the spec gives the three authors of the article.
- Ruling 1: the articles of the Topic are described by their content; their authors are not named. CLAIMS and the European initiatives are named as the editorial names them. No hub project is named.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/published/2025/pfl-ms-npj, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (15 pages, npj Digital Medicine 8:478, read whole with `pdftotext`; 2126 non-empty lines, page 10 also rendered with `pdftoppm -r 110` to read Algorithm 1), `project.yml` 1-29. The folder holds nothing else (no README).
- Manuscript root: `manuscript/main.pdf`, the published article. Line numbers are lines of the non-empty `pdftotext` output.
- Numbers (article, order 1): Table 1 ROC-AUC and AUC-PR `:324-361` (adaptive FedProx 0.8398 $\pm$ 0.0019 and 0.5346 `:333`, `:336`; fine-tuned FedProx 0.8375 `:332`; baseline FedProx 0.7834 and 0.4081 `:334`, `:337`; centralized 0.8092 and 0.4605 `:360-361`); Table 2 times, FedProx 217.51 against 171.77 min, FedAdam 225.69 against 236.08 `:371-385`; local weighted 0.7983 `:768-769`; leads per country 11, 6, 5, 3, 0 `:782-784`; federated beats local in five of the top six `:797-798`; Spearman $-0.503$, $p = 0.010$ `:799`, $-0.761$ `:808`; six countries hold 82% `:1069`; 146 centres `:1003`; 283,115 episodes from 26,246 patients `:1045-1046`; 32 country clients `:1054`; 60/20/20 `:1061`; 42-input MLP `:1269`; 5 layers of 512, up to 5 extension layers of 64, 350 rounds, 32 clients, 10 repeats `:1279-1284`; extension thresholds 25000 and 2000 `:1456-1462`; only non-extension layers aggregated `:1464-1465`; fine-tuning `:1581-1585`; weighted client-side evaluation `:1622-1639`; limits: simulation `:964-967`, weighted averaging `:979-981`, calibration `:841-851`; fine-tuning by client size `:956-960`. Manifest (order 3): authors `project.yml:23` (73 names, A. Faes sixth, counted with a Python split of that line), venue and DOI `:19-20`.
- Disagreements: (1) `project.yml:28` (the manifest abstract) gives FedAdam 0.7919 $\pm$ 0.0031; the article gives 0.7920 (`:144`, `:357`). The manifest abstract is a different text from the published abstract (`:32-44`). (2) Inside the article, the text says FedAdam's adaptive version took "a 4% increase in training time" (`:282-283`); Table 2 gives 225.69 against 236.08 min (`:383-385`), a 4% decrease. (3) The text says FedAdam's 236 min is "about 23% more than FedProx" (`:146-147`); Table 2 gives 236.08 against 171.77 min, 37% more (23% is the ratio to FedAVG's 192.66). (4) Table 3's weighted federated row gives 0.7835 (`:737`); Table 1 gives 0.7834 for baseline FedProx (`:334`). The slide uses Table 1's values and the timing from Table 2.
- Equation: the FedAVG example of Algorithm 1 (page 10), the aggregation over the non-extension layers, with the primes written as `''` inside the single-quoted YAML. It renders with KaTeX (11309 characters, `throwOnError: true`).
- Tag `measured`, "Personalized federated learning".
- No figure: Figures 1 to 5 exist only inside the PDF.
- Second slide: a columns slide, "Where personalization helps, and what the comparison leaves open", with the client-size results and the limits the article states.
- Authorship: `lead: [pirmani]`, `outcome` "Co-author (middle)" (`project.yml:16`, `:18`); the Authors spec abbreviates the 73 names of `project.yml:23`, and the last line of slide 2 states the lead and A. Faes's position.
- Ruling 1: FedAVG, FedProx, FedAdagrad, FedYogi and FedAdam are named as the compared strategies the article names; the episode definition the article takes from De Brouwer et al. (`:1015-1016`) is described without the citation. No hub project is named.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/published/2025/proprioception-exoskeleton, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.pdf` (7 pages, the authors' pdfTeX build of the ICORR paper, read whole with `pdftotext`; 569 non-empty lines), `project.yml` 1-32. The folder holds nothing else (no README).
- Manuscript root: `manuscript/main.pdf`, the only manuscript file. Line numbers are lines of the non-empty `pdftotext` output.
- Numbers (paper, order 1): 25 subjects, 12 male and 13 female `:98-99`; 62 electrodes, 1000 Hz `:110-115`; three modalities and three finger tasks `:120-123`; ERSP equation (1) `:175-201`; alpha 8-13 Hz and beta 13-30 Hz `:202-203`; four FgMDM models, 1-s segments, 4-40 Hz `:210-228`; 10 $\times$ 5-fold cross-validation `:233-235`; ANOVA with Bonferroni `:239-245`; Table I p-values, PM and IPM against IM significant, IPM against PM n.s. `:276-333`, `:343-347`; 0.80 $\pm$ 0.07, 0.72 $\pm$ 0.10, 0.61 $\pm$ 0.09, 0.73 $\pm$ 0.08 `:15-21`, `:353-360`; "slightly above the chance level" `:357`; subjects found refraining from imagery hard `:455-459`. Manifest (order 3): venue ICORR 2025 `project.yml:15`, `:21`; authors `:20`.
- Disagreements: none in the numbers. The PDF prints no venue or DOI (`pdfinfo`: "LaTeX with hyperref", created 2025-02-21), so the venue spec rests on the manifest alone. The manifest writes "Marc Van Hulle" (`project.yml:20`); the paper writes "Marc M. Van Hulle" (`:4`); the spec follows the paper.
- Equation: the paper's ERSP equation (1). It renders with KaTeX (9331 characters, `throwOnError: true`).
- Tag `measured`, "EEG with a hand exoskeleton".
- No figure: Figures 1 to 5 exist only inside the PDF.
- Authorship: `lead: [qiang-sun]`, `outcome` "Co-author." (`project.yml:15-16`); the Authors spec gives the paper's order with Q. Sun first.
- Ruling 1: FgMDM is named as the classifier the paper uses. The paper's own references to earlier finger-regression work (`:459-463`) are left out. No hub project is named.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/coauthor/stopped/individual-reference-intervals, 1 slide (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `project.yml` 1-14, the only file in the project (`find` lists it alone besides `present/`).
- Manuscript root: none; the project has no manuscript, README or results file.
- Facts (manifest, order 3): title `project.yml:8`; idea, events and the bet `:9`; 2024 `:10`; abandoned, IEEE JBHI target, "Do, Faes, et al.", not pursued to a full paper `:11`; `lead: [do]` `:13`.
- Disagreements: none (one source).
- No equation, no figure: the manifest gives neither.
- Tag `design`, "Stopped idea": no measurement exists.
- Authorship: the Authors spec writes the author line of `project.yml:11` as given, with the lead's surname only, because the manifest gives no first name or initial; the Role spec gives "Co-author" from the same line.
- Before: empty `present/`. After: `main.md`, `present.yml`. No figures.

### projects/manuscripts/bt-operator-theory, 2 slides (replaced)

- Sources read: `manuscript/main.tex` 1-730 (no `\input`; four `\includegraphics` of PDF figures, `:601`, `:616`, `:625`, `:634`), `manuscript/references.bib` entry `faes_btfno_companion` `:122-127`, `README.md` 1-89, `code/README.md` (the results file `README.md:28-32` names), `CLAUDE.md` 1-15 (facts only), `project.yml` 1-51. `notes/derivations/` and `notes/history/` are derivation notes and were not used, per item 1.
- Manuscript root: `manuscript/main.tex`, the only `.tex` with `\documentclass`.
- Numbers (manuscript, order 1): containment lemma `main.tex:101-112`; metric lemma `:164-177`; frequency dimensions $RLK$ and $\mu_{\mathrm{band}}K$ `:268`; Theorem 1 and its display `:349-361`; explicit $\kappa$ `:688-703`; ordering theorem `:478-495`; 2.93 and 5.43 against 3 and 6 `:612`; proportional ratio about 60 near the threshold and 6.42 `:621`; divergence and double-descent avoidance `:412-421`; L-gating [1.0, 1.99, 2.79, 4.34] `:608`; 10.15 against 12 at $K=16$ `:606`, finite-$K$ remark `:516-523`; depth gap $92D$ through $D=4$, saturation at 4 `:630`; companion table 0.0178, 0.0120, 33%, tie `:644-657`; sign, direction, gating, $L>1$, constants not claimed `:659-666`; minimax caveat `:684`; approximate bands `:337-344`. Manifest (order 3): code URL `project.yml:38`, venue `:15`, stage `:3`.
- Disagreements: (1) Theorem 1 states the excess-risk ratio tends to $RL$ for soft bands with coherence $\mu_{\mathrm{band}}$ (`main.tex:361`, `:365`), while the ordering theorem gives $RL/\mu_{\mathrm{band}}$ for the same pair (`:490`) and the soft-band dimension is $\mu_{\mathrm{band}}K$ (`:316-320`). The slide writes $RL/\mu_{\mathrm{band}}$, with $RL$ for disjoint bands. (2) The manuscript's header comment names Neural Networks as primary and TNNLS as alternate (`main.tex:2`); `project.yml:15`, `:47` and `README.md:3`, `:85` name JMLR. The Target spec follows the manifest and README, since the header comment is not text of the paper (judgment call). (3) `README.md:3` calls the manuscript 25 pages; `README.md:19` and `project.yml:14`, `:16` say 28. (4) `README.md:47` speaks of "two verification scripts"; `README.md:28-32`, `code/README.md` and `main.tex` give four. (5) `project.yml:19` places the ratio of about 60 "near the n=d_CP=48 threshold"; the manuscript gives it at $n=40$ (`main.tex:621`). (6) The replaced deck gave generalization gaps 0.029, 0.019 and 0.012 and a 5-family benchmark headline; the manuscript gives 0.0178 and 0.0120 (`:652`), and the old values appear in none of the sources read.
- Equation: Theorem 1's displayed separation with its overlap-proof lower bound (`main.tex:359`). It renders with KaTeX (7818 characters, `throwOnError: true`).
- Tag `proof`, "Generalization theory".
- Second slide: a columns slide with the self-contained synthetics and the scope the paper states.
- No figure drawn: the four manuscript figures exist only as PDF (`manuscript/figures/`, `code/figures/`), and the project holds no image file outside `present/` (`find` for png, jpg, jpeg, svg, gif, webp).
- Ruling 1: the companion empirical study is named as the manuscript names it (`main.tex:49`, `:75`, `:642`) and its PDEBench numbers are restated as the manuscript restates them; the hub project that holds that study is not named. Massart's oracle inequality, De Lathauwer's rank-$(L,L,1)$ decomposition and the Cohen and Khrulkov separations are not named on the slides.
- Before: `eq_btfno.png`, `main.md`, `present.yml`. After: the same three; `eq_btfno.png` is kept unchanged (`cmp` against the base copy) and is not drawn, since it is a rendered equation.

### projects/manuscripts/btfno, 2 slides (replaced)

- Sources read: `manuscript/main.tex` 1-323 (no `\input`; figures `:267`, `:278`, `:289`), `README.md` 1-105, `RESULTS.md` 1-126 (the results file `README.md:5` and `project.yml:42` name), `CLAUDE.md` 1-22 (facts only), `project.yml` 1-50. `manuscript/supplement.tex` is a separate document with its own `\documentclass` (a supplement on its own) and was not used; `ReproducibilityChecklist.tex`, `reviews/` (the review PDF; the slide's review points come from `README.md:74-80`), `notes/` and `admin/` were not used.
- Manuscript root: `manuscript/main.tex`, the paper; `supplement.tex` is not input by it.
- Numbers (manuscript, order 1): kernel equation (2) `main.tex:85-90`; CP and Tucker limits `:92`; single einsum `:94-99`; MoBTE-SM shared plus routed softmax `:103-111`; Theorem 1, gap $\Theta(\sigma^2R(L-1)K/n)$, ratio $\to L$, zero at $L=1$ `:129-137`; five families and two-frame input `:181`; matched dof, 3 seeds, Welch tests `:183`; 8 experts `:202`; Table 2 (0.0558, 0.0507, 0.0472, 0.0394 at 668k, +16.6%, +29.4%) `:223-229`; gaps 0.0120 against 0.0178, train 0.0259 against 0.0286, $p=0.015$ `:236`; all compressible flow 31%, $p=0.0005$ `:236`; single family 0.0083 against 0.0085, $p=0.44$ `:236`; test-error $p=0.053$ and $0.082$ `:236`; diversity curves 0%, +4.4%, +13.5%, +14.7% and $-0.5$%, +4.3%, +12.7%, +8.5% `:274`; frequency total variation 0.715, 0.797, 0.924, a correlate `:285`, `:290`; $L=1$ gap 0.0119 to 0.0160 against 0.0179, 11% residual, $p=0.040$ `:300`. README (order 2): rejection in Phase 1 and the review points `README.md:74-80`; the two code-against-paper defects `README.md:86`; private repository `README.md:87`. Manifest (order 3): authors `project.yml:45`, code URL `:35`, venue `:18`, ratings `:14`.
- Disagreements: (1) Diversity scaling: the manuscript gives +4.4%, +13.5%, +14.7% for three to five families (`main.tex:274`); `README.md:19` and `RESULTS.md:10-13` give +7.0%, +15.2%, +14.8% (committed JSON of job 528686), `README.md:28` gives +5.1%, +13.8%, +15.1% (the from-scratch rerun), and `project.yml:23` gives +15% at five. The slide uses the manuscript. (2) Framing of the same result: `project.yml:23` and `README.md:19` call it a diversity-scaling law driven by bandwidth diversity; the manuscript says the scaling is generic to mixing, shared by CP experts (`main.tex:272-274`). The slide follows the manuscript. (3) All-compressible-flow gaps: manuscript CP 0.0493, BT 0.0334, block-term expert 0.0173 (`main.tex:255-257`); `README.md:20` and `RESULTS.md:48` give 0.0496, 0.0335, 0.0175. (4) MoBTE-SM five-family test error: 0.0406 in the manuscript (`main.tex:251`), 0.0405 in `README.md:20` and `RESULTS.md:24`. (5) `README.md:5` and `:54` say there is no manuscript yet; `manuscript/main.tex` exists and `README.md:3` names it. (6) The theorem counts a free frequency profile over all $K$ modes (`main.tex:90`, `:126`) while `README.md:86` records that the trained experts factorize the profile across the two frequency axes; the slide states this as an open defect. (7) The replaced deck's headline "MoBTE -60% error vs CP (6-PDE)" is the synthetic result `README.md:42` and `RESULTS.md:79-81` restrict to private history, and its backbone spec (C=32) differs from the manuscript's hidden width 48 (`main.tex:195`).
- Equation: the block-term kernel, Eq. (2) (`main.tex:86-88`). It renders with KaTeX (7720 characters, `throwOnError: true`).
- Tag `mixed`, "Measured with a theorem".
- Second slide: a project slide with one panel and four results: the generic diversity scaling, the $L=1$ residual, the AAAI rejection with what the reviews ask, and the two code-against-paper defects (dead ends shown, per "nothing hidden").
- Figure: `manuscript/figures/fig_mechanism.png` copied to `present/fig_mechanism.png` with `cp` (`cmp` equal) and drawn on slide 2. The manuscript's other figures are PDF.
- Ruling 1: CP, Tucker, PDEBench, MoE-POT, NESTOR, MPP and AM-FNO are named as the manuscript and README name them (baselines and requested comparisons). The replaced deck's "Why this could matter for HCCNet" block named another hub line and is gone; the sibling theory project is not named.
- Before: `btfno.png`, `btfno_blocks.png`, `eq_btfno.png`, `main.md`, `present.yml`. After: those five plus `fig_mechanism.png`. `btfno.png`, `btfno_blocks.png` and `eq_btfno.png` are kept unchanged (`cmp` against the base copies) and are not drawn: `btfno_blocks.png` carries the panel titles "smooth & band-localized" and "better super-res" that `README.md:100` records as wrong and that the manuscript figure replaced; `btfno.png` matches no manuscript figure (its `md5` differs from every image in `notes/` and `manuscript/figures/`); `eq_btfno.png` is a rendered equation.

### projects/manuscripts/bttd-source-eeg, 2 slides (replaced)

- Sources read: `manuscript/main.tex` 1-500 (no `\input`; four PNG figures `:317`, `:335`, `:352`, `:360`), `README.md` 1-63, `CLAUDE.md` 1-30 (facts only), `project.yml` 1-48. `manuscript/highlights.tex` is a journal content element and `admin/` holds the cover letter and submission package; neither was used, per item 1. The README names CSV result files under `code/results/`; their numbers are quoted in `README.md` and `main.tex`, and the slides use the manuscript's.
- Manuscript root: `manuscript/main.tex`, the only `.tex` with `\documentclass` in `manuscript/`.
- Numbers (manuscript, order 1): model Eq. (1) `main.tex:146-162`; $L_r=2$ `:176`; greedy deflation as in BTTR, ALS and ISTA `:171-176`; baselines `:205-211`; forwards, 64 channels, $N=402$, BEM $N=2052$, New York head 171 electrodes `:213-218`; 500 noise dipoles, $\lambda=0.5$, $\mu=0.1$ `:220-240`; 8 seeds and Wilcoxon `:253-254`; 0.93 $\pm$ 0.09 and 13.4 $\pm$ 4.2 mm against 14.5, 17.4, 21.8 `:264-266`; Table 1 (MNE 0.98, sLORETA 0.98, eLORETA 0.99; Champagne 1.00 and 0.1 mm) `:297-302`; correlated sources, LCMV 17 to 53 mm and AUC 1.00 to 0.73, components 17 to 18 mm and 0.93 to 0.90 `:326-331`; real data contralateral, flat before onset `:344-348`; $p=0.055$ `:387`; BEM 22.1 against 26.8 mm, New York head 23 to 33 against 17 to 22 `:388-391`; non-phase-locked 0.16 $\pm$ 0.07 against 0.85 $\pm$ 0.05 `:398-399`; hand-set block count and deep sources `:403-405`. README (order 2): top-$K$ recovery 1.6 of 3, worst of the methods `README.md:31`; lateral-occipital peaks `README.md:23` (and the figure's panel titles). Manifest (order 3): authors `project.yml:41`, venue `:13-14`, code URL `:33`.
- Disagreements: (1) Correlated sources: the manuscript gives LCMV's spatial spread rising from 17 to 53 mm (`main.tex:327`); `README.md:21` and `project.yml:25` give LCMV's DLE rising from 7 to 38 mm. The slide follows the manuscript. (2) `README.md:3` and `:7` still describe the paper as submit-ready with no external review and Journal of Neuroscience Methods "chosen"; `project.yml:13`, `:21` and `README.md:53` say it was resubmitted on 2026-11-04 and is under review. The venue spec follows the manifest. (3) The multi-source recovery result (1.6 of 3) is in the README only; the manuscript makes no recovery claim (`README.md:31`), and the slide shows it as a dead end.
- Equation: the model, Eq. (1) (`main.tex:149-150`). It renders with KaTeX (4910 characters, `throwOnError: true`).
- Tag `measured`, "EEG source imaging".
- Second slide: a project slide with one panel (the real-data check) and four results: correlated sources, the phase-locked limit, the retracted recovery claim and the remaining limits.
- Figures: `manuscript/figures/fig2_source_maps.png` and `manuscript/figures/real_contralateral.png` copied to `present/` with `cp`, one at a time (`cmp` equal each), and drawn on slides 1 and 2.
- Ruling 1: BTTR is named because the manuscript names it as the algorithm the estimator follows (`main.tex:86-87`, `:171`); MNE, sLORETA, eLORETA, LCMV, Champagne and CP are the manuscript's baselines. The related hub project of `project.yml:10` is not named.
- Before: `bttdeeg.png`, `bttdeeg_correlated.png`, `eq_bttdeeg.png`, `main.md`, `present.yml`. After: those five plus `fig2_source_maps.png` and `real_contralateral.png`. The three base images are kept unchanged (`cmp` against the base copies) and are not drawn: `bttdeeg.png` and `bttdeeg_correlated.png` are earlier renders of Figures 1 and 2 (their `md5` differs from the manuscript files, and `README.md:61` records that the manuscript figures were redrawn without in-figure titles); `eq_bttdeeg.png` is a rendered equation.

### projects/manuscripts/bttn-incident-af, 2 slides (replaced)

- Sources read: `manuscript/main.tex` 1-410 (no `\input`; seven PNG figures `:89`, `:159`, `:278`, `:332`, `:341`, `:343`, `:353`), `README.md` 1-81, `RESULTS.md` 1-144 (the results file `README.md:23` names), `CLAUDE.md` (facts only), `project.yml` 1-51. `admin/` (the submission package with the cover letter) and `notes/history/` were not used, per item 1. `RESULTS.md:3` states that every number in it is on the provisional ECG-report labels and superseded; it was used only for the dead-end list, which `README.md:38-46` repeats.
- Manuscript root: `manuscript/main.tex`, the only `.tex` in `manuscript/`.
- Numbers (manuscript, order 1): title `main.tex:30`; journal `:23`; abstract 0.747, 0.734, 0.760, 0.778 [0.767, 0.789], +0.019 [+0.014, +0.024], 0.794, 97.6% `:40`; 30-day blanking `:95`, `:99`; $n=9{,}275$ and 4.25% `:103`; tensor $F\approx 21$, $T=40$, $L=12$ `:134-137`; block factors and kernels 3, 7, 15 `:140`; $K=12$, $r_f=3$, $r_l=2$, ensemble 3, 5 folds `:186-189`, `:202-203`; fusion $\eta=\eta_{\mathrm{ECG}}+\mathbf{w}^{\top}\mathbf{c}$, zero-initialized `:153`; Cox loss `:166-168`, batch 512 `:170`; SimCLR on about 30k tensors `:174`; Table 1 `:234-240`; clinical utility 20.7-fold, Brier 0.039, NNM 7.7 at top 5% `:274`; probe 0.701 against 0.718, label-blind 0.973 `:286`, `:296-300`; intervention $-0.086$ at ten `:305`; ablation 0.729, 0.729, 0.728 `:307`, `:317-319`; substrate near 2 Hz, 4 to 8 Hz, leads I, II, V1, V5 `:328`; non-replicating rise toward onset `:337`; CODE-15 and PTB-XL 0.829, 0.980, 0.983 `:349`; Raghunath 0.85 and Jabbour 0.77, in-distribution caveat `:364`, `:378`; competing risks awaiting date of death `:170`, `:378`, `:405`. README (order 2): dead ends 0.675, 0.620, 0.61, 0.731 against 0.754, 0.744 against 0.758 `README.md:38-45`. Manifest (order 3): short `project.yml:6`, authors `:44`, venue `:15`, `:45`, code URL `:35`.
- Disagreements: (1) Block-structure ablation: the manuscript gives AUROC 0.729, 0.728, 0.729 and faithfulness 0.959, 0.926, 0.966 for block-term, CP and full-rank (`main.tex:317-319`; `project.yml:25` agrees on AUROC); `README.md:28` gives 0.719, 0.731, 0.720 and 0.976, 0.923, 0.977; `RESULTS.md:95-97` gives 0.752, 0.760, 0.753 and 0.943, 0.895, 0.953 (provisional). The slide follows the manuscript. (2) Label-blind control: `README.md:27` gives a probe AUROC of 0.692, which is 0.964 of the full 0.718; the manuscript gives a recovery of 0.973 (`main.tex:299`). The slide follows the manuscript. (3) Substrate: `project.yml:26` calls the 4 to 8 Hz band an f-wave band; the manuscript avoids that term because the inputs are in sinus rhythm (`main.tex:328`); `README.md:29` gives a 6-8 Hz band with lead V1 and `README.md:30` gives V1, V5 and I as the leads shared with CODE-15, where the manuscript gives V1 first with I and II shared (`main.tex:349`). The slide follows the manuscript. (4) `README.md:5` says submission preparation is active and `README.md:77` says `code_availability: none`; `project.yml:2`, `:16` record the submission on 2026-10-22 and `project.yml:33` records the code as deposited. (5) The replaced deck's numbers (0.762 against 0.749, the ladder 0.628 to 0.762, C-index 0.725 against 0.649, 18.9% against 1.3%, $n=13{,}090$) are the provisional-label results of `RESULTS.md:10-46`, which `README.md:23` and `CLAUDE.md` mark as superseded.
- Equation: the Cox partial negative log-likelihood (`main.tex:166-168`), with `\left(`/`\right)` written as `\Big(`/`\Big)` and the `\!\!` spacing dropped. It renders with KaTeX (9139 characters, `throwOnError: true`).
- Tag `measured`, "Incident AF from one ECG".
- Second slide: a project slide with one panel (the substrate map) and four results: the position against the published models, the label-blind control and the tied ablation, the limits of the external validation and of competing risks, and the dead ends from `README.md:38-46` and the non-replicating trajectory of `main.tex:337` (nothing hidden).
- Figures: `manuscript/figures/pipeline_overview.png` and `manuscript/figures/bttn_interpret.png` copied to `present/` with `cp`, one at a time (`cmp` equal each), and drawn on slides 1 and 2.
- Ruling 1: BTTR is named because the manuscript names block-term regression as the model BTTN generalizes and uses it as a baseline (`main.tex:214`, `:382`); Raghunath et al. and Jabbour et al. are the comparators the manuscript names (`:364`). The related hub project of `project.yml:10` is not named, and nothing from its CLAUDE.md note on authorship history is on the slides.
- Before: `eq_incidentaf.png`, `incidentaf_arch.png`, `incidentaf.png`, `main.md`, `present.yml`. After: those five plus `pipeline_overview.png` and `bttn_interpret.png`. The three base images are kept unchanged (`cmp` against the base copies) and are not drawn: `incidentaf_arch.png` and `incidentaf.png` match no manuscript figure (`md5` differs from all seven) and carry the provisional framing; `eq_incidentaf.png` is a rendered equation.

### projects/manuscripts/clinical-hccnet, 2 slides (new; the base held an empty `present/` folder, made in the worktree)

- Sources read: `manuscript/main.tex` 1-323 (no `\input`; three PDF figures `:93`, `:240`, `:283`), `manuscript/EVIDENCE.md` and `code/results/EVIDENCE.md` (identical by `cmp`; the results file `README.md:17` and `project.yml:12` name) lines 11-31, `README.md` 1-75, `project.yml` 1-29. The `.docx` copies in `manuscript/word/` and `manuscript/sources/`, `admin/draft/` (circulation drafts and a supplement), `admin/reviews/patches/` and `notes/history/` were not used, per item 1. `code/results/material/` is coauthor-only material (`README.md:31`) and was not used.
- Manuscript root: `manuscript/main.tex`, the only `.tex` in `manuscript/`.
- Numbers (manuscript, order 1): title `main.tex:22`; authors and equal contribution `:39`, `:50`; single centre, 2011 to 2022 `:87`; 243 of 318, 37 HCC (15.2%) `:89`; 947 examinations `:59`, `:147`; left-lobe region of interest, CNN plus Transformer, DINO and order pre-training, no clinical data `:116-118`; 58 held-out patients, encoder size chosen on them, fusion of DW, T1 IOP and T2 `:122`; development patients in the whole-cohort values `:124`; Firth regression `:126`; BCLC 0 13 and A 16, curative treatment 27 `:192`, `:206-207`; fusion 0.966, 0.893, 0.829 with intervals `:236`; held-out 0.899, 0.881, 0.929 with HCC counts `:245`; odds ratios 12.96, 5.19, 3.34 `:247`; per-sequence AUROCs `:251`, `:262-276`; DCE 0.690 and 0.433 `:296`; limitations `:300`; laboratory-marker models `:75`. EVIDENCE.md (order 2) agrees with every fusion and odds-ratio number (`EVIDENCE.md:11-12`, `:31`). README (order 2): subgroups removed `README.md:3`; dead ends `README.md:51-53`. Manifest (order 3): short `project.yml:2`, venue `:7`, `:18`, author list `:25`.
- Disagreements: (1) `project.yml:17` says the venue is unconfirmed; `project.yml:7`, `:18` and `README.md:3` name JHEP Reports. The venue spec follows `:7` and `:18`. No number disagrees across the manuscript, EVIDENCE.md, README and manifest.
- Equation: none. The manuscript has no displayed equation; the fusion model is defined in words (`main.tex:122`), and no equation was written for the slide.
- Tag `measured`, "HCC risk from surveillance MRI".
- Second slide: a project slide with one panel (per-sequence AUROC) and four results: that the whole-cohort values include the training patients and that the encoder sizes were chosen on the held-out patients, the limitations of `main.tex:300`, the removed subgroup results and the dead ends.
- Figures: `manuscript/figures/fusion_over_time.png` and `manuscript/figures/sequences_by_horizon.png` copied to `present/` with `cp`, one at a time (`cmp` equal each), and drawn on slides 1 and 2. The manuscript includes the PDF versions; these PNGs are written by the project's own `code/figures.py:48`, `:75` beside each PDF and are identical to `code/figures/` (`cmp`).
- Ruling 1: no student framing (the slides carry neither the manifest's `eli5` history nor the `outcome` note on who started the work); authorship is the manifest's `publication.authors` with the equal-first mark (`project.yml:25`). The related hub project (`project.yml:13`, named in `README.md:3`) is not named; the slides describe the model as the manuscript does, and the manuscript cites a technical report for it (`main.tex:116`).
- Before: an empty `present/` in the base. After: `main.md`, `present.yml`, `fusion_over_time.png`, `sequences_by_horizon.png`.

### projects/manuscripts/dries-bttr-ecg, 2 slides (replaced)

- Sources read: `manuscript/main.tex` 1-282 (no `\input`; two PNG figures `:150`, `:224`), `README.md` 1-81 (it names the CSV result files under `code/results/`, whose numbers it quotes; the slides use the manuscript's), `CLAUDE.md` (facts only), `project.yml` 1-49. `admin/` (cover letter, response letter, submission package, editor letter), `manuscript/patches/` and `notes/thesis/` were not used, per item 1.
- Manuscript root: `manuscript/main.tex`, the only `.tex` in `manuscript/`.
- Numbers (manuscript, order 1): title `main.tex:31`; authors `:33`; cohorts, 31 days, median 5 days `:83`; 1:3 matching, age alone 0.500, ten draws `:85`; median beat, 65 samples, 12 leads `:89`; BTTR, $\pm 1$ target, rank-$(L_2,L_3,1)$, $K=8$ `:93`; baselines `:95-101`; protocols and pooled bootstrap `:105-107`; P1 AUROCs `:129-135`, `:155`; seed-0 draw best for BTTR on AFIB `:105`, `:151`; paired differences `:170-180`, `:185`; RR pseudo-leads 0.471 and 0.548 `:187`; alignment 0.490, 0.457, +0.107, +0.186 `:191`, `:204-211`; CNN near chance both ways `:216`; $r=0.857$ `:229`; weight fractions `:231`; scope `:247`; block-map caption `:225`. README (order 2): about 18 variants `README.md:37`; retracted single-seed 0.667 against 0.509 `README.md:38`; unmatched controls, age alone about 0.75 `README.md:41`. Manifest (order 3): short `project.yml:2`, venue and state `:14-15`, authors `:43`, code URL `:35`.
- Disagreements: (1) `README.md:54` lists paired CIs above zero against clinical features on the primary cohort as a claim; in the manuscript's primary ten-draw comparison that CI includes zero (`main.tex:172`, `:185`), and only the secondary seed-0 comparison excludes zero (`:172`, fourth column). The slide follows the primary comparison. (2) `project.yml:20` says the foundation model falls to chance; the manuscript gives the tuned HuBERT-ECG probe 0.548 and 0.606 and the fixed probe 0.488 and 0.537 (`main.tex:131`, `:134`). The slide gives the paired results. (3) `README.md:3` says the revision is in progress; `README.md:61` and `project.yml:14`, `:22` say it was resubmitted on 2026-11-05. (4) The replaced deck's numbers (0.718 against 0.631, $p=0.002$, $r=0.88$, aligned 0.715 against 0.434) and its "matches or beats every baseline" caption are from the unmatched design that `README.md:7`, `:40-41` mark as superseded.
- Equation: none. The manuscript has no displayed equation; BTTR's blocks are defined in words (`main.tex:93`), and no equation was written for the slide. The replaced deck's equation came from no source read.
- Tag `measured`, "AF in sinus rhythm, public data".
- Second slide: a project slide with one panel (the eight block maps) and four results: the scope of `main.tex:247`, the CNN in the ablation, the unmatched-control finding and the dead ends of `README.md:37-38` with the RR pseudo-lead result of `main.tex:187`.
- Figures: `manuscript/figures/forest_auroc.png` and `manuscript/figures/interpret_afsr_afibonly_blocks.png` copied to `present/` with `cp` (`cmp` equal each), and drawn on slides 1 and 2.
- Ruling 1: authorship is the manifest's (`project.yml:7`, `:43`): D. Cornelissen, A. Faes. No student framing: the slides carry nothing from the author biography (`main.tex:278`), the README's origin paragraph (`README.md:13`) or `notes/thesis/`. BTTR is the manuscript's own method with its citation (`main.tex:66`, `:93`); Attia et al. and HuBERT-ECG are the baselines the manuscript names. The related hub project of `project.yml:11` is not named.
- Before: `dries_forest.png`, `dries.png`, `eq_driesptb.png`, `main.md`, `present.yml`. After: those five plus `forest_auroc.png` and `interpret_afsr_afibonly_blocks.png`. The three base images are kept unchanged (`cmp` against the base copies) and are not drawn: `dries_forest.png` and `dries.png` match neither manuscript figure (`md5` differs) and show the superseded unmatched design; `eq_driesptb.png` is a rendered equation.

### projects/manuscripts/ecg-readable-substrate, 2 slides (replaced)

- Sources read: `manuscript/main.tex` 1-293 (no `\input`; two PDF figures `:112`, `:119`; `:288` onward is the inline bibliography), `README.md` 1-109, `code/results/age_equal.json` (the results file `README.md:90` names; read with `python3 -c "import json ..."`), `CLAUDE.md` (facts only), `project.yml` 1-46. `admin/` (submission package) and `TODO.md` were not used.
- Manuscript root: `manuscript/main.tex`, the only `.tex` in `manuscript/`.
- Numbers (manuscript, order 1): title `main.tex:11`; single author `:13`; cohorts 14,000 and 20,000, prevalence 0.129 and 0.141 `:64`; splits `:66`; six encoders `:71`; best of two probes `:75`; 231 and 235 NeuroKit features from 891 `:80`; certificate at $\delta=0.9$ `:90`; TOST $M=0.01$, Bonferroni over 12 `:101`; Table I, 0.811 and 0.773, 7 wins and 5 ties `:125`, `:136-147`; transfer on 227 features, ECGFounder $-0.048$ and $-0.013$, ECG-FM 0.685 and 0.615, ECG-JEPA $+0.013$, ST-MEM $+0.010$ including zero `:155-157`, `:170-178`; calibration slope 1.02 and 1.01 `:184`; waveform-only 0.781, age-only 0.749, increments $+0.062$ and $+0.105$ `:192-194`; clean-FM increment $+0.013$ and $+0.002$ `:202`; certificate median 1, coverage 0.96, age in 100% `:205`; limitations `:262-264`. Results file (order 2): equal-input tallies 5/1/6 within cohorts and 2/1/3, 2/2/2 in transfer, and the per-encoder margins (`age_equal.json` keys `summary`, `within.*.fms[].delta_age`, `transfer.*.fms[].verdict_cov`; quoted also at `README.md:90`). README (order 2): dead ends `README.md:77-79`. Manifest (order 3): short `project.yml:2`, venue `:22-23`, author `:39`, code URL `:14`.
- Disagreements: (1) The equal-input rerun (`README.md:90`, `age_equal.json`) gives 5 wins, 1 tie and 6 losses where the manuscript's Table I gives 7, 5 and 0 (`main.tex:125`), and `README.md:90` records that the headline "does not hold at equal input"; the manuscript was submitted on 2026-10-24 (`project.yml:25`) without this analysis. The first slide states the published comparison with the words "whose probes do not see age" in the headline, and the second slide shows the equal-input result (nothing hidden). This is a fact Axel needs about a paper under review, and I raise it as an open item in this report. (2) `project.yml:24`, `:31-33` and the public deposit description `project.yml:17` still state the 7/5/0 claim; `README.md:103` records that this is deliberate until the headline is decided. (3) `README.md:4` and `:105` still give IEEE JBHI as the target; `project.yml:22-25` and `README.md:4` (first sentence) record the CBM submission. (4) The replaced deck described the abandoned "certified readable substrate" direction with "Key results: In progress", which `README.md:6` marks as superseded.
- Equation: none. The manuscript has no displayed equation, and no equation was written for the slide.
- Tag `measured`, "Named features against ECG foundation models".
- Second slide: a columns slide, the equal-input comparison against the limits and dead ends.
- No figure drawn: the two manuscript figures are PDF only (`manuscript/figs/`), and `find` for png, svg and jpg over the project returns nothing.
- Ruling 1: the six encoders are the manuscript's baselines and are named as it names them. The related hub project of `project.yml:9` and the sibling workshop paper named at `README.md:90` are not named.
- Before: `main.md`, `present.yml` (deck title "A Certificate, Not Just an Explanation, for ECG AI"). After: the same two files, rewritten; the deck title is now the manifest short "Readable-FM-ECG".

### projects/manuscripts/fed-multicellular-immune, 2 slides (replaced)

- Sources read: `manuscript/main.tex` 27-640 (no `\input`; five PDF figures `:146`, `:359`, `:408`, `:477`, `:543`), `README.md` 1-87 (it names `code/results/*.md`, whose numbers it quotes; the slides use the manuscript's and, for dead ends, the README's), `CLAUDE.md` (facts only), `project.yml` 1-50. `manuscript/main_maryam.text` is a coauthor's line-edit kept as a record (`README.md:68`), not the manuscript, and was not used; `admin/` (submission package and cover letter) was not used.
- Manuscript root: `manuscript/main.tex`, the only `.tex` in `manuscript/`.
- Numbers (manuscript, order 1): title `main.tex:27-28`; authors `:30-32`; abstract `:49-55`; tensor, $K=10$, $G=1500$ `:156-180`; federated estimator and stacked SVD `:184-205`; the bound `:198-200`; incomplete panels, Gram sum equal to centralized `:229-242`; attack over 30 splits, four release objects `:280-291`; seven atlases `:294-311`; lupus 0.958, ISG 0.998 `:337-340`; $\Delta$AUC 0.000 [$-0.004$, +0.012], correlation 0.967, label-free 0.960 `:347-350`; COVID sites 61, 45, 11 and correlation 0.989 `:366-370`; incomplete 1.000 and fixed-feature PCA `:375-385`; MIA 0.906, 0.609, 1.000 `:388-394`; ancestry 0.81, sex 0.65, 0.98 at 20 donors per site `:397-404`; lung 0.959 against 0.910, +0.049 [+0.006, +0.101], federated 0.981 `:426-432`; liver 0.975, $p=0.005$, 16 donors with 6 controls `:434-444`; parity gaps `:446-451`; centering 0.957 against 0.861 `:470-471`, `:494-495`; secure aggregation does not implement the stack `:271-275`, `:590-591`; DP needs about $10^3$ donors `:605-611`. README (order 2): DP correlation 0.029 `README.md:40`; gene-mode stitch 0.654 `README.md:41`. Manifest (order 3): short `project.yml:2`, venue `:14-15`, `:44`, authors `:43`, code URL `:35`.
- Disagreements: (1) `project.yml:20` and the replaced deck say the stacked-SVD merge closely approximates or (deck) "provably" and "exactly" equals pooling under secure aggregation; the manuscript gives an approximation bounded by the omitted local spectra and states that additive secure aggregation does not compute the stack (`main.tex:196-204`, `:271-275`); `README.md:70-71` records the correction. The slides follow the manuscript. (2) `project.yml:27` reads "NB additive secure aggregation does NOT compute the stacked SVD", consistent with the manuscript; the replaced deck's spec "Privacy: secure aggregation" is the superseded claim. (3) `README.md:27` labels the merged-subspace attack "(secure agg)", which the manuscript no longer claims (`main.tex:388-394`). No number disagrees between the manuscript, README and manifest.
- Equation: the merge error bound (`main.tex:198-200`), with `\textstyle` dropped. It renders with KaTeX (8404 characters, `throwOnError: true`).
- Tag `measured`, "Federated single-cell programs".
- Second slide: a columns slide, the cross-tissue map against the limits and dead ends.
- No figure drawn: the five manuscript figures are PDF only, and `find` for png, svg and jpg over the project finds only the three base images in `present/`.
- Ruling 1: scITD is named in the method as the manuscript names it as the centralized base (`main.tex:77-80`, `:175`); the slides keep to "tensor decomposition" and do not need the name. The related hub project of `project.yml:10` and the coupled-tensor line named at `README.md:64` and `:85` are not named.
- Before: `eq_immune.png`, `fedimmune.png`, `immune_schematic.png`, `main.md`, `present.yml`. After: the same five; the three images are kept unchanged (`cmp` against the base copies) and are not drawn: they have no manuscript counterpart (the manuscript figures are PDF), the replaced deck's captions for `fedimmune.png` and `immune_schematic.png` describe the secure-aggregation claim that `README.md:70` and `:79` record as corrected and redrawn, and `eq_immune.png` is a rendered equation.

### projects/manuscripts/hccnet-revision, 2 slides (replaced)

- Sources read: `manuscript/main.tex` 1-202 with its inputs `sections/abstract/abstract.tex` 1-7, `sections/3_methodology/b_architecture.tex` 1-36, `c_variants.tex` 1-10, `d_pretraining.tex` 1-15, `sections/4_experiments/a_data.tex` 1-3, `c_evaluation.tex` 1-8, `d_results.tex` 1-31, `sections/5_discussion/discussion.tex` 1-18, `sections/6_conclusion/conclusion.tex` and `ack.tex`, `tables/results_finetune.tex` 9-37, `tables/results_base_vs_pre.tex` 9-22, `tables/results_pretrain_ablation.tex` 9-19, `figures/architecture.tex`, `figures/calibration.tex`; `README.md` 1-166 (it names `manuscript/tables/*.tex` as its results source); `CLAUDE.md` 1-34 (facts only); `project.yml` 1-46. The `tables/*_original.tex` files are superseded tables kept beside the live ones (`README.md:47`) and were read only to trace the replaced deck's numbers.
- Manuscript root: `manuscript/main.tex`, the file `CLAUDE.md:25` builds; it inputs every section above (`main.tex:97-182`).
- Numbers (manuscript, order 1): title `main.tex:45`; authors and equal first authorship `:67-80`; elapsed time to the reference examination, set from dates only `b_architecture.tex:20-25`; the encoding `:27-32`; five variants and 12.4M to 72.4M parameters `c_variants.tex:2-10`; DINO with series of one contrast as augmentations `d_pretraining.tex:8`; sequence-order prediction `:10`; 963 examinations, 2011 to 2022, Medisch Spectrum Twente `a_data.tex:1`; 243 patients, 37 with HCC `:3`; ten seeded models per fold `c_evaluation.tex:1`; DW-MRI mean 0.614 and 0.901 `abstract.tex:5`, `d_results.tex:5` (the mean of the five DW rows of `results_finetune.tex:13-17`, recomputed: 3.070/5 and 4.504/5); HCCNet-T 0.725 $\pm$ 0.103 and 0.936 $\pm$ 0.026 `results_finetune.tex:17`; average gains +106.6% and +25.5% (DW), +48.9% and +14.9% (DCE), +52.3% and +22.4% (IOP and T2) `d_results.tex:15`; +147.1% from 0.294 to 0.725 `results_base_vs_pre.tex:17`, `discussion.tex:8`; ECE reductions 56.0%, 37.0%, 12.1% `d_results.tex:21`; fusion 0.588 and 0.894 against 0.587 and 0.891, all within one SD `:25`; ablation 0.672, 0.588, 0.310, 0.308 `:29`, `results_pretrain_ablation.tex:11-14`; single cohort and external validation needed `discussion.tex:18`. Manifest (order 3): short `project.yml:2`, venue and status `:13-14`, authors `:39`, code URL `:28`.
- Disagreements: (1) the replaced deck's numbers (Pico AUROC 0.936 $\pm$ 0.013, AUPRC 0.744, ablation 0.309 to 0.701 to 0.744, "+136% AUPRC") come from the superseded `tables/*_original.tex` (`results_base_vs_pre_original.tex:15`, `results_pretrain_ablation_original.tex:11-12`); the live tables give the numbers on the slides. (2) The replaced deck and `README.md:81` give a $\sqrt{\Delta t}$ encoding; the manuscript encodes plain $\Delta t$ in years (`b_architecture.tex:27-32`) and `README.md:108` records that the square-root encoding was dropped. The slides follow the manuscript. (3) `README.md:31` says the numbers are pending a from-scratch re-run; `README.md:35` and `:43` say they are final. (4) `project.yml:19` calls 0.901 / 0.614 the "strongest config"; the manuscript gives it as the mean over the five variants, and the strongest variant is HCCNet-T at 0.936 / 0.725. (5) `README.md:31` lists the authors as Axel Faes and Jakob Nolte first; `main.tex:67-69` and `project.yml:39` put Jakob Nolte first, and the slide follows the manifest. (6) `CLAUDE.md:31` keeps an open flag that across-contrast sampling is still in the code; `README.md:77` records it fixed in code. The slides make no claim about the code.
- Equation: the time-based positional encoding (`b_architecture.tex:27-32`), written with $\Delta t$ for $\boldsymbol{\Delta}\textbf{t}^p_i$. It renders with KaTeX (7301 characters, `throwOnError: true`).
- Tags `measured`: "Longitudinal MRI prognosis" and "Ablation and calibration".
- Second slide: a project slide with the ablation, calibration, fusion and the single-centre limit, and the calibration figure.
- Figures copied: `figure_outline.png` (the manuscript's architecture figure, `figures/architecture.tex:4`) and `calibration.png` (`figures/calibration.tex:4`, written by `code/paper_figs.py` per `README.md:112`); the third manuscript figure, `cumulative_gain.png`, is not drawn (one panel per slide).
- Ruling 1: DINO and ConvNeXt are named as the manuscript names them as what HCCNet adapts (`d_pretraining.tex:8`, `c_variants.tex:10`). The related hub projects of `project.yml:9` and the clinical atlas that `README.md` describes in another project are not named. Jakob Nolte appears only as an author.
- Before: `eq_hccnet.png`, `hccnet_arch.png`, `hccnet.png`, `main.md`, `present.yml`. After: those five plus `figure_outline.png` and `calibration.png`; the three base images are kept unchanged (`cmp` against the base copies) and are not drawn: none matches a manuscript figure (`cmp` against every PNG in `manuscript/figures/`), `hccnet_arch.png`'s replaced caption describes the square-root encoding the manuscript does not use, `hccnet.png`'s caption describes three modalities and the superseded numbers, and `eq_hccnet.png` is a rendered equation.

### projects/manuscripts/meseret-cirrhosis, 2 slides (replaced)

- Sources read: `manuscript/main.tex` 17-388 (no `\input`; four figures `:167`, `:299`, `:326`, `:339`), `README.md` 1-59 (it names `code/results/*.csv` as its source; every number on the slides is in the manuscript), `CLAUDE.md` 1-10 (facts only), `project.yml` 1-50. `manuscript/supplementary.tex` was not used on its own; `admin/` (cover letter, highlights, submission package) was not used.
- Manuscript root: `manuscript/main.tex`, the file `CLAUDE.md:8` builds; `supplementary.tex` is a separate document.
- Numbers (manuscript, order 1): title `main.tex:17`; authors `:20`; cohort 418 with 232, 161, 25 `:78`; simulation design, Weibull hazards, 416 complete cases `:125`; seven models `:92`; classification baseline `:98`; C range 0.806 to 0.833 and Mayo IBS 0.143 `:173`, table `:184-190`; complexity +0.008, +0.014, +0.046 and $n$ 8873 `:200`; endpoint C 0.822 [0.799, 0.843] and F1 0.007 to 0.180 `:219`; Fine-Gray 0.842 and 0.807 `:265`; HRs 1.36, 0.74 and SHRs 1.52, 0.32 `:273`; Spearman 0.56, 0.59, 0.91, 0.92, 0.90 `:295`; F1 0.14 to 0.25 `:31`; serial cohort 312 and 1945 `:116`; landmark 0.87 to 0.64, 0.89 to 0.78, $\Delta$C +0.139 [+0.116, +0.162] `:305`; Cox and Fine-Gray match Mayo net benefit `:335`; SUPPORT 508, 0.823 to 0.558 `:345`; 25 events and prothrombin $p=0.002$ `:358`. Manifest (order 3): short `project.yml:2`, venue `:13`, `:44`, authors `:43`, code URL `:35`.
- Disagreements: (1) the replaced deck gives the classification framing as "F1 ~0.21"; `README.md:55` records that the unsourced 0.21 was replaced by the paper's own baseline, transplant F1 0.007 to 0.180 (`main.tex:219`). (2) The replaced deck's headline "Death C 0.833" is the Mayo score's Harrell C, not a death-endpoint model; the cause-specific Cox death endpoint is 0.826 (`main.tex:219`). (3) `project.yml:18` says the benchmark "is graded the wrong way"; the manuscript narrows the claim to tree-ensemble classifiers scored by F1, since multinomial logistic regression recovers the risk (`main.tex:295`, `README.md:47`). The slides follow the manuscript. No number disagrees between the manuscript, README and manifest.
- Equation: the simulation's cause-specific Weibull cumulative hazard (`main.tex:125`), with the cause index written out. It renders with KaTeX (6697 characters, `throwOnError: true`).
- Tags `measured`: "Competing-risks reformulation" and "Ceiling and dynamic value".
- Second slide: a project slide with the seven-model ceiling, the landmark result, the sample-size pattern and the limits, and the landmark figure.
- Figures: `fig_simulation.png` copied (`main.tex:299`); `meseret_landmark.png` is the base image, kept and drawn, and `cmp` shows it is byte-identical to `manuscript/figures/fig_landmark.png` (`main.tex:326`).
- Ruling 1: the authors are written as `project.yml:43` gives them, with no framing of the first author's role; the replaced deck's sub-title naming the first author by first name is gone. Cited works are not named.
- Before: `eq_meseret.png`, `meseret_landmark.png`, `meseret.png`, `main.md`, `present.yml`. After: those five plus `fig_simulation.png`; the three base images are kept unchanged (`cmp` against the base copies). `meseret.png` is not drawn: it matches no manuscript figure and its replaced caption carries the unsourced F1 0.21; `eq_meseret.png` is a rendered equation and is not drawn.

### projects/manuscripts/ward-bttr-crosssubject, 2 slides (replaced)

- Sources read: `manuscript/main.tex` 1-106 with its one input `body.tex` 1-1013 (figures `:265`, `:641`, `:1003`); `README.md` 1-89 (it names `code/results/ward_*.csv`, whose numbers it quotes; the slides use the manuscript's, and the README's only for dead ends); `CLAUDE.md` 1-27 (facts only); `project.yml` 1-48. `main_2col.tex` and `body_2col.tex` are the two-column build of the same text and were not used; `supplementary.tex` was not used on its own; `manuscript/submitted-2026-07-03/` is an archived draft and was not used; `admin/` (response letter, cover letter, reviews, biographies) was not used.
- Manuscript root: `manuscript/main.tex`, the review build `CLAUDE.md:25` names first and the build the submission pack is made from (`README.md:69`).
- Numbers (manuscript, order 1): title and authors `main.tex:49-53`; factorization `body.tex:300`; alignment equation `:365`; 24 bands, 2 to 300 Hz `:326`; correlation filter and $R=4$, $D=20$ `:342-361`; TCN `:427`; label use in both regimes `:450-460`; 0.566 $\pm$ 0.084 `:15`, `:579`; 0.550 over nine `:592`; 6 of 7, +0.05, $p=0.078$ `:600-604`; four to five minutes, 80 to 90% of 5.6 minutes `:617`; 0.530 (SD 0.157) against 0.554 `:656`; ridge 0.380 against 0.336 `:662`; ablation 0.371, 0.162, 0.042, 0.037, 0.071 and $p=0.016$ `:695-711`, `:772-777`; random-init head 0.319 `:733`, `:783`; nonlinear head 0.353 to 0.517, 7 of 7 `:745`; cursor cohort 76.7%, 7.9%, 72.1%, 8.2%, $n=4$, rh against the pattern `:808-818`; 6 of 12 coverage `:947`; forward maps and their bound `:395-401`, `:1003-1010`. README (order 2, dead ends only): ridge 0.354 against BTTR 0.156 `README.md:37`; AJILE12 near zero `:46`; scalp EEG 0.4023 against 0.4108 `:47`. Manifest (order 3): short `project.yml:2`, venue `:14`, `:42`, authors `:41`, code URL `:33`.
- Disagreements: (1) the replaced deck's mechanism "BTTR deflation, LOSO transfer" and headline "$\rho$ 0.084 to 0.49 fix | ~10 x faster": BTTR is a dropped decoder (`CLAUDE.md:12`, `README.md:13`), the 0.08 to 0.49 recovery is a private diagnostic outside the manuscript (`README.md:29`), and the manuscript gives four to five minutes against ten to thirty across protocols, 80 to 90% of the calibration set (`body.tex:617`), with no tenfold figure. (2) `README.md:23`, `CLAUDE.md:10` and `project.yml:26` call the seventh patient tied; the manuscript puts it marginally below (0.412 against 0.433, `body.tex:600`). The slide states 6 of 7 and does not characterize the seventh. (3) `CLAUDE.md:27` gives the review build as 34 pp; `project.yml:13` and `README.md:3` give 44 pp. (4) `main.tex` sets `\journal{Neurocomputing}`; the venue is Neural Networks (`project.yml:14`, `README.md:69`). (5) `README.md:26` gives the source-count curve as 0.520 to 0.560; the manuscript and `README.md:21` give the single-seed 0.476 to 0.525 (`body.tex:608-611`). Not on the slides. (6) The replaced deck's `method_overview.png` differs from `manuscript/figures/method_overview.png` (`cmp`), the manuscript's revised flowchart.
- Equation: the factorization and the alignment (`body.tex:300`, `:365`), on one line. It renders with KaTeX (5552 characters, `throwOnError: true`).
- Tags `measured`: "Cross-subject ECoG transfer" and "Ablation and replication".
- Second slide: a project slide with the ablation, the alignment heads, the replication, the coverage limit and the dead ends from `README.md`, and the forward-map figure.
- Figures: the manuscript's `method_overview.png` is copied as `pipeline_flowchart.png`, because the base `present/method_overview.png` is a different, older image that is kept; `finger_spatial_maps.png` and `calibration_curve.png` are base images byte-identical to the manuscript's (`cmp`); `finger_spatial_maps.png` is drawn and `calibration_curve.png` is kept and not drawn (one panel per slide).
- Ruling 1: CORTEG and Euclidean Alignment are named as the manuscript names them as the comparators (`body.tex:579`, `:656`, `:776`); BTTR is named only as the dead end `README.md:37` records for this project. The related hub project of `project.yml:10` and the thesis origin at `README.md:13` and `:57` are not named. The authors are written as `project.yml:41` gives them; the replaced deck's sub-title naming the first author by first name is gone.
- Before: `calibration_curve.png`, `finger_spatial_maps.png`, `method_overview.png`, `main.md`, `present.yml`. After: those five plus `pipeline_flowchart.png`; the three base images are kept unchanged (`cmp` against the base copies). `method_overview.png` is not drawn because the manuscript's current flowchart replaced it.

## The 25 replaced decks, files before and after

Before from the hub base copy, after from the hub worktree (`ls` of each `present/` folder); "drawn" is a figure a slide names (`grep "figure: <name>" main.md`). Every file of the base copy is still in its folder (`diff -rq`: 0 "Only in base").

- archive/failed/fed-faithful-ecg: before `main.md`, `present.yml`; after the same two.
- archive/published/2026/dongho-ecg-clustering: before `dongho_silhouette.png`, `dongho.png`, `eq_dongho.png`, `main.md`, `present.yml`; after the same five. Drawn: `dongho_silhouette.png`; kept, not drawn: `dongho.png`, `eq_dongho.png`.
- archive/published/2026/hccnet-fl: before `eq_hccnetfl.png`, `main.md`, `present.yml`; after the same three. Kept, not drawn: `eq_hccnetfl.png`.
- ideas/btd-autoencoder, ideas/clinical-ai-eval-artifacts, ideas/ecg-af-fair, ideas/fl-privacy-auditing, ideas/florank-personalization, ideas/hccnet-fl-sweden, ideas/hccnet-pathology, ideas/quantum-tensor-fl, ideas/ssm-longitudinal, manuscripts/ecg-readable-substrate: before `main.md`, `present.yml`; after the same two, each.
- manuscripts/bt-operator-theory: before `eq_btfno.png`, `main.md`, `present.yml`; after the same three. Kept, not drawn: `eq_btfno.png`.
- manuscripts/btfno: before `btfno_blocks.png`, `btfno.png`, `eq_btfno.png`, `main.md`, `present.yml`; after those plus `fig_mechanism.png`. Drawn: `fig_mechanism.png`; kept, not drawn: `btfno_blocks.png`, `btfno.png`, `eq_btfno.png`.
- manuscripts/bttd-source-eeg: before `bttdeeg_correlated.png`, `bttdeeg.png`, `eq_bttdeeg.png`, `main.md`, `present.yml`; after those plus `fig2_source_maps.png`, `real_contralateral.png`. Drawn: the two new ones; kept, not drawn: the three base images.
- manuscripts/bttn-incident-af: before `eq_incidentaf.png`, `incidentaf_arch.png`, `incidentaf.png`, `main.md`, `present.yml`; after those plus `bttn_interpret.png`, `pipeline_overview.png`. Drawn: the two new ones; kept, not drawn: the three base images.
- manuscripts/covert-applied: before `eq_covert.png`, `main.md`, `present.yml`; after the same three. Kept, not drawn: `eq_covert.png`.
- manuscripts/covert-theory: before `eq_coverttheory.png`, `main.md`, `present.yml`; after the same three. Kept, not drawn: `eq_coverttheory.png`.
- manuscripts/dries-bttr-ecg: before `dries_forest.png`, `dries.png`, `eq_driesptb.png`, `main.md`, `present.yml`; after those plus `forest_auroc.png`, `interpret_afsr_afibonly_blocks.png`. Drawn: the two new ones; kept, not drawn: the three base images.
- manuscripts/fed-multicellular-immune: before `eq_immune.png`, `fedimmune.png`, `immune_schematic.png`, `main.md`, `present.yml`; after the same five. Kept, not drawn: the three images.
- manuscripts/hccnet-revision: before `eq_hccnet.png`, `hccnet_arch.png`, `hccnet.png`, `main.md`, `present.yml`; after those plus `calibration.png`, `figure_outline.png`. Drawn: the two new ones; kept, not drawn: the three base images.
- manuscripts/meseret-cirrhosis: before `eq_meseret.png`, `main.md`, `meseret_landmark.png`, `meseret.png`, `present.yml`; after those plus `fig_simulation.png`. Drawn: `fig_simulation.png`, `meseret_landmark.png`; kept, not drawn: `eq_meseret.png`, `meseret.png`.
- manuscripts/raw-pls: before `eq_rawpls.png`, `main.md`, `present.yml`, `rawpls_method.png`, `rawpls.png`, `registration_baseline.png`, `saliency_ortho.png`, `saliency_patients.png`, `synthetic_upgrades.png`; after those plus `fig2_results.png`. Drawn: `fig2_results.png`, `synthetic_upgrades.png`; kept, not drawn: the other six images.
- manuscripts/ward-bttr-crosssubject: before `calibration_curve.png`, `finger_spatial_maps.png`, `main.md`, `method_overview.png`, `present.yml`; after those plus `pipeline_flowchart.png`. Drawn: `finger_spatial_maps.png`, `pipeline_flowchart.png`; kept, not drawn: `calibration_curve.png`, `method_overview.png`.

## Figures copied

23 figures, each copied with one `cp` of one file (read from this step's transcript: 22 single `cp` commands and one shell loop over two names for dries-bttr-ecg, one `cp` per pass; the two clinical-hccnet figures were copied twice from the same sources). `sh figcmp.sh` printed `identical` for all 23 and `DIFFERS` for none; the set of images only in the worktree (`diff -rq`, 23) equals this list (`diff` of the two lists printed nothing). Paths under `projects/`, source then target:

- active/linfoot-estimator/code/results/engine_shapes.png to active/linfoot-estimator/present/engine_shapes.png
- active/sandpile-operator/code/results/figures/rollout.png to active/sandpile-operator/present/rollout.png
- archive/failed/ms-lipid-handshake/code/figures/within_cohort_macnair.png to archive/failed/ms-lipid-handshake/present/within_cohort_macnair.png
- archive/published/2021/source-localization/manuscript/figs/sparsity-acc-spread_norm.png to archive/published/2021/source-localization/present/sparsity-acc-spread_norm.png
- archive/published/2022/block-term-tensor-regression/manuscript/figs/image10.png to archive/published/2022/block-term-tensor-regression/present/image10.png
- archive/published/2022/extended-bttr-note/manuscript/ebttr_fig.jpeg to archive/published/2022/extended-bttr-note/present/ebttr_fig.jpeg
- archive/published/2025/fbttr-strategies/manuscript/latex/model.png to archive/published/2025/fbttr-strategies/present/model.png
- archive/published/2025/go-bttr/manuscript/figs/gobttr.jpeg to archive/published/2025/go-bttr/present/gobttr.jpeg
- archive/published/2026/abduction/manuscript/raw_signal.png to archive/published/2026/abduction/present/raw_signal.png
- manuscripts/btfno/manuscript/figures/fig_mechanism.png to manuscripts/btfno/present/fig_mechanism.png
- manuscripts/bttd-source-eeg/manuscript/figures/fig2_source_maps.png to manuscripts/bttd-source-eeg/present/fig2_source_maps.png
- manuscripts/bttd-source-eeg/manuscript/figures/real_contralateral.png to manuscripts/bttd-source-eeg/present/real_contralateral.png
- manuscripts/bttn-incident-af/manuscript/figures/bttn_interpret.png to manuscripts/bttn-incident-af/present/bttn_interpret.png
- manuscripts/bttn-incident-af/manuscript/figures/pipeline_overview.png to manuscripts/bttn-incident-af/present/pipeline_overview.png
- manuscripts/clinical-hccnet/manuscript/figures/fusion_over_time.png to manuscripts/clinical-hccnet/present/fusion_over_time.png
- manuscripts/clinical-hccnet/manuscript/figures/sequences_by_horizon.png to manuscripts/clinical-hccnet/present/sequences_by_horizon.png
- manuscripts/dries-bttr-ecg/manuscript/figures/forest_auroc.png to manuscripts/dries-bttr-ecg/present/forest_auroc.png
- manuscripts/dries-bttr-ecg/manuscript/figures/interpret_afsr_afibonly_blocks.png to manuscripts/dries-bttr-ecg/present/interpret_afsr_afibonly_blocks.png
- manuscripts/hccnet-revision/manuscript/figures/calibration.png to manuscripts/hccnet-revision/present/calibration.png
- manuscripts/hccnet-revision/manuscript/figures/figure_outline.png to manuscripts/hccnet-revision/present/figure_outline.png
- manuscripts/meseret-cirrhosis/manuscript/figures/fig_simulation.png to manuscripts/meseret-cirrhosis/present/fig_simulation.png
- manuscripts/raw-pls/manuscript/figures/fig2_results.png to manuscripts/raw-pls/present/fig2_results.png
- manuscripts/ward-bttr-crosssubject/manuscript/figures/method_overview.png to manuscripts/ward-bttr-crosssubject/present/pipeline_flowchart.png

## Slide-text lines repeated across decks

`node c10.mjs <hub worktree> research.txt` printed "lines repeated across decks: 53". The lines, in its order, with the fact each states:

- Spec labels that name a kind of fact (ruling 4), true of each deck that uses them: "Stage" (77 decks), "Venue" (54), "Authors" (42), "Data" (35), "Code" (13), "Cohort" (9), "Outcome" (4), "Baselines", "Compute", "Degree", "Form", "Target" (3 each), "Ablation", "Baseline", "Benchmark", "Cohorts", "Corpora", "Horizons", "Input", "Lead", "Pairs", "Supervision", "Tensor", "Training" (2 each).
- "|||" (33 decks): the column break of a `columns` slide, which `docs/decks.md` requires; it is markup, drawn as no text.
- Stage values, one-word or two-word states each true of every deck that carries it: "published" (28), "nascent, gate pending" (9: federated-protocol-agents, fl-privacy-auditing, harmonop, hccnet-fl-sweden, modality-dropping-btf, neurosde, physics-tensor-hcc, ssm-longitudinal, xsub-ecog-framework), "accepted" (3: dongho-ecg-clustering, erp-signatures, hccnet-fl), "failed" (3: faithful-block-term-layer, fed-faithful-ecg, jacobian-coupled-blockterm-dp), "stopped" (3: connectivity-motor-imagery, individual-reference-intervals, fedbtd), "de-risking" (2: pathology-tensor-mil, strokeop), "de-risking, gate pending" (2: adapter-format-theory, fed-duplication-limits), "nascent, exploring" (2: concept-bottleneck-hcc, fed-neural-operators), "nascent, speculative" (2: asthma-geo-tensor, paleogenomics-tensor), "scoping, gate pending" (2: hccnet-pathology, multiway-biosignal-fm).
- Body headings that name a kind of column: "### Limits" (4 after round 1: connectivity-iris, hccnet-fl, http2-best-practices, ecog-frequency-features), "### Limits and dead ends" (2: ecg-readable-substrate, fed-multicellular-immune), "### Open" (2: masters-algebraic-subtyping, masters-eeg-infotheory).
- Author lists, each the true authorship of both or all papers: "A. Faes" (glassbox-decision-pipelines, bt-operator-theory, ecg-readable-substrate), "A. Faes, M. Amir Haeri" (btfno, bttd-source-eeg, fed-multicellular-immune), "E. Calvo Merino, A. Faes, M.M. Van Hulle" (ecog-frequency-features, modulation-lmp-bci, highgamma-event-detection), "A. Faes, M. Fahimi Hnazaee, M. Van Hulle" (abstract-bci-meeting-2021, connectivity-motor-imagery), "A. Faes, M.M.J. Guichelaar, D.E. Bouman, S.M. van den Berg, M. Amir Haeri" (hcc-modality-poster, hccnet-fl).
- Paper titles shared by two records of one work: "Causal Graphical Modelling of Functional Connectivity from Reconstructed EEG Sources" (abstract-bci-meeting-2021 and connectivity-motor-imagery, `sub`), "High-gamma band event detection improves stability of finger trajectories decoded from ECoG-LMP activity" (modulation-lmp-bci and highgamma-event-detection, `sub`; the two PDFs carry this title, see the per-deck parts and "wrong or impossible"), "Towards a Core Language with Row-Based Effects for Optimised Compilation" (icfp-src-abstract and icfp-src-poster, `sub`).
- Venue values true of both decks: "ICFP 2017 Student Research Competition" (icfp-src-abstract, icfp-src-poster), "JMLR" (adapter-format-theory, bt-operator-theory), "Comput. Biol. Med., under review" (ecg-readable-substrate, meseret-cirrhosis), "Medical Image Analysis or IEEE TMI" (hccnet-pathology, physics-tensor-hcc).
- "BCI Competition IV dataset 4, 3 subjects" (extended-bttr-note and xsub-ecog-framework, `specs.value`): the dataset each uses.
- "Measured" (ms-lipid-handshake and phd-thesis, `tag.text`): a one-word tag text (ruling 4), true of both.
- The FedAvg aggregation `W^{(t)} = \frac{1}{\sum_k N_k} \sum_{k=1}^{K} N_k\, \Delta W_k^{(t-1)}` (fbttr-strategies and fermat, `equation`): the aggregation both papers state.

No sentence is repeated.

## Files with line counts, from `diff -rq` against each base copy

Hub: `sh diffrq.sh research.txt` printed, for the 95 folders, 0 "Only in base", 163 "Only in" the worktree (70 `main.md`, 70 `present.yml`, 23 images) and 50 "differ" (25 `main.md`, 25 `present.yml`). Per folder (state; `wc -l` of each text file now in it; images new to it):

- active/eeg-saad-challenge: new; main.md 48, present.yml 4
- active/linfoot-estimator: new; main.md 52, present.yml 4; new image engine_shapes.png
- active/loewner: new; main.md 49, present.yml 4
- active/novel-math-primitives: new; main.md 44, present.yml 4
- active/sandpile-operator: new; main.md 50, present.yml 4; new image rollout.png
- archive/failed/faithful-block-term-layer: new; main.md 47, present.yml 4
- archive/failed/fed-faithful-ecg: replaced; main.md 48, present.yml 4
- archive/failed/jacobian-coupled-blockterm-dp: new; main.md 49, present.yml 4
- archive/failed/ms-lipid-handshake: new; main.md 38, present.yml 4; new image within_cohort_macnair.png
- archive/phd/phd-thesis: new; main.md 44, present.yml 4
- archive/published/2016/bachelor-network-ids: new; main.md 48, present.yml 4
- archive/published/2017/icfp-src-abstract: new; main.md 26, present.yml 4
- archive/published/2017/icfp-src-poster: new; main.md 26, present.yml 4
- archive/published/2018/masters-algebraic-subtyping: new; main.md 49, present.yml 4
- archive/published/2018/masters-eeg-infotheory: new; main.md 49, present.yml 4
- archive/published/2021/abstract-bci-meeting-2021: new; main.md 27, present.yml 4
- archive/published/2021/source-localization: new; main.md 40, present.yml 4; new image sparsity-acc-spread_norm.png
- archive/published/2021/volga-finger-trajectories: new; main.md 25, present.yml 4
- archive/published/2022/block-term-tensor-regression: new; main.md 41, present.yml 4; new image image10.png
- archive/published/2022/connectivity-iris: new; main.md 50, present.yml 4
- archive/published/2022/extended-bttr-note: new; main.md 41, present.yml 4; new image ebttr_fig.jpeg
- archive/published/2025/fbttr-strategies: new; main.md 41, present.yml 4; new image model.png
- archive/published/2025/fermat: new; main.md 50, present.yml 4
- archive/published/2025/go-bttr: new; main.md 41, present.yml 4; new image gobttr.jpeg
- archive/published/2026/abduction: new; main.md 41, present.yml 4; new image raw_signal.png
- archive/published/2026/dongho-ecg-clustering: replaced; main.md 41, present.yml 4
- archive/published/2026/erp-signatures: new; main.md 27, present.yml 4
- archive/published/2026/glassbox-decision-pipelines: new; main.md 49, present.yml 4
- archive/published/2026/hcc-modality-poster: new; main.md 48, present.yml 4
- archive/published/2026/hccnet-fl: replaced; main.md 50, present.yml 4
- archive/stopped/algebraic-subtyping: new; main.md 16, present.yml 4
- archive/stopped/connectivity-motor-imagery: new; main.md 47, present.yml 4
- coauthor/active/flkit: new; main.md 25, present.yml 4
- coauthor/published/2016/chi-household-survival: new; main.md 27, present.yml 4
- coauthor/published/2016/chi-purpose-centric: new; main.md 26, present.yml 4
- coauthor/published/2017/algebraic-effects-compilation: new; main.md 50, present.yml 4
- coauthor/published/2017/http2-best-practices: new; main.md 49, present.yml 4
- coauthor/published/2018/http2-web-performance: new; main.md 49, present.yml 4
- coauthor/published/2023/coordinated-fingers-ecnr: new; main.md 27, present.yml 4
- coauthor/published/2023/ecog-frequency-features: new; main.md 50, present.yml 4
- coauthor/published/2023/modulation-lmp-bci: new; main.md 26, present.yml 4
- coauthor/published/2024/highgamma-event-detection: new; main.md 27, present.yml 4
- coauthor/published/2025/editorial-bigdata-ai-ms: new; main.md 26, present.yml 4
- coauthor/published/2025/pfl-ms-npj: new; main.md 48, present.yml 4
- coauthor/published/2025/proprioception-exoskeleton: new; main.md 27, present.yml 4
- coauthor/stopped/individual-reference-intervals: new; main.md 23, present.yml 4
- ideas/adapter-format-theory: new; main.md 24, present.yml 4
- ideas/asthma-geo-tensor: new; main.md 21, present.yml 4
- ideas/attention-scoped-instructions: new; main.md 24, present.yml 4
- ideas/block-term-nca: new; main.md 24, present.yml 4
- ideas/brecht-fl-partitioning: new; main.md 25, present.yml 4
- ideas/btd-autoencoder: replaced; main.md 24, present.yml 4
- ideas/cirrhosis-digital-twin: new; main.md 45, present.yml 4
- ideas/clinical-ai-eval-artifacts: replaced; main.md 23, present.yml 4
- ideas/concept-bottleneck-hcc: new; main.md 24, present.yml 4
- ideas/conformal-tensor-factors: new; main.md 23, present.yml 4
- ideas/ecg-af-fair: replaced; main.md 25, present.yml 4
- ideas/engram: new; main.md 49, present.yml 4
- ideas/faithful-interpretability-position: new; main.md 23, present.yml 4
- ideas/fed-duplication-limits: new; main.md 23, present.yml 4
- ideas/fed-neural-operators: new; main.md 23, present.yml 4
- ideas/fedbtd: new; main.md 22, present.yml 4
- ideas/federated-protocol-agents: new; main.md 23, present.yml 4
- ideas/fedlink: new; main.md 25, present.yml 4
- ideas/fl-privacy-auditing: replaced; main.md 23, present.yml 4
- ideas/florank-personalization: replaced; main.md 27, present.yml 4
- ideas/harmonop: new; main.md 25, present.yml 4
- ideas/hccnet-fl-sweden: replaced; main.md 25, present.yml 4
- ideas/hccnet-pathology: replaced; main.md 48, present.yml 4
- ideas/modality-dropping-btf: new; main.md 26, present.yml 4
- ideas/multiway-biosignal-fm: new; main.md 46, present.yml 4
- ideas/neurosde: new; main.md 26, present.yml 4
- ideas/old-charges-stemmatology: new; main.md 48, present.yml 4
- ideas/paleogenomics-tensor: new; main.md 23, present.yml 4
- ideas/pathology-tensor-mil: new; main.md 26, present.yml 4
- ideas/physics-tensor-hcc: new; main.md 25, present.yml 4
- ideas/quantum-tensor-fl: replaced; main.md 24, present.yml 4
- ideas/serial-ecg-af: new; main.md 26, present.yml 4
- ideas/ssm-longitudinal: replaced; main.md 25, present.yml 4
- ideas/strokeop: new; main.md 24, present.yml 4
- ideas/xsub-ecog-framework: new; main.md 24, present.yml 4
- manuscripts/bt-operator-theory: replaced; main.md 48, present.yml 4
- manuscripts/btfno: replaced; main.md 41, present.yml 4; new image fig_mechanism.png
- manuscripts/bttd-source-eeg: replaced; main.md 43, present.yml 4; new images fig2_source_maps.png, real_contralateral.png
- manuscripts/bttn-incident-af: replaced; main.md 43, present.yml 4; new images bttn_interpret.png, pipeline_overview.png
- manuscripts/clinical-hccnet: new; main.md 42, present.yml 4; new images fusion_over_time.png, sequences_by_horizon.png
- manuscripts/covert-applied: replaced; main.md 49, present.yml 4
- manuscripts/covert-theory: replaced; main.md 49, present.yml 4
- manuscripts/dries-bttr-ecg: replaced; main.md 42, present.yml 4; new images forest_auroc.png, interpret_afsr_afibonly_blocks.png
- manuscripts/ecg-readable-substrate: replaced; main.md 48, present.yml 4
- manuscripts/fed-multicellular-immune: replaced; main.md 48, present.yml 4
- manuscripts/hccnet-revision: replaced; main.md 50, present.yml 4; new images calibration.png, figure_outline.png
- manuscripts/meseret-cirrhosis: replaced; main.md 48, present.yml 4; new image fig_simulation.png
- manuscripts/raw-pls: replaced; main.md 42, present.yml 4; new image fig2_results.png
- manuscripts/ward-bttr-crosssubject: replaced; main.md 50, present.yml 4; new image pipeline_flowchart.png

Oculus, against the base commit (`git diff --stat df5a42a49 -- . ':!.scratch'`): `src/lib/themes/slide.css` 19 lines changed (+15 -4), `src/lib/views/academic/present/Slide.svelte` 20 (+10 -10), `src/lib/views/academic/present/parts/project/Facts.svelte` 27 (+14 -13); 3 files, 39 insertions, 27 deletions. The report is this file.

## Judgment calls the brief left open

- The dot: `0.75em` of the strip's value size, 9 px at the design size and 8.25 px under rice (ruling 3). Reversible in one line, `Facts.svelte:162`.
- Base images in a replaced deck are kept and not drawn where they do not show the current result (listed above per deck); none was deleted.
- ward-bttr-crosssubject: the manuscript's `method_overview.png` differs from the base `present/method_overview.png`, so it is copied as `pipeline_flowchart.png` and the base image is kept unchanged.
- External methods and papers named under ruling 1 as the project's own manuscript or manifest names them (for example CORTEG and Euclidean Alignment in ward-bttr-crosssubject, DINO and ConvNeXt where a manuscript uses them, BTTR only as the dead end a README records, Bleichner et al. 2016 in abduction, RoomAlive and iCon in chi-household-survival).
- Phrasing kept on purpose against the prose rule's dislike of contrast, each because it states the fact literally: phd-thesis headline "in minutes instead of hours" (the measured speed-up), strokeop eli5 "3 hours instead of 6" (the counterfactual the model answers), jacobian-coupled-blockterm-dp and icfp-src-poster "in place of" (one object replacing another), algebraic-effects-compilation "let in place of bind" (the translation), linfoot "fall rather than rise" (the shape of a dependence), chi-household-survival "whereas" (the paper's own contrast with RoomAlive and iCon). The title "Measured, not asserted: ..." of faithful-interpretability-position is the project's own title in its manifest and is kept as written.
- The editorial (editorial-bigdata-ai-ms) carries the tag class `design`, since it reports no measurement.
- Repeated headings ("### Limits", "### Limits and dead ends", "### Open") name a kind of column, listed above.
- serial-ecg-af: the manifest's collaborator key `vandervoort` is written as the surname "Vandervoort"; the full name lives in the hub's people file, outside item 1's sources.
- fedlink's Stage spec says "side project", as its `status.line` does, although its `tier` is research.
- Left out as work mechanics, not project facts: linfoot's plan decisions D1 to D38 and batch job mechanics, engram's two off-chain items removed from the repository (continuous integration and the documentation site), hccnet-pathology's list of novelty-check queries (the slide says the check is pending), PlayAnywhere in chi-household-survival (background the paper cites, not a contrast it draws).
- Second slides: 33 `columns` and 17 `project` slides with panels or lists, chosen per deck for what reads better; no deck has more than two slides.

## User-visible changes, before and after

- The facts strip below a project slide. Before: values in the slide's small type, 18 px at text size 1 (17 under rice), labels at 0.72 of that (12.96 px), the dot 0.5em (9 px). After: values 12 px, labels 10 px (11 and 9 under rice), each times the text size and outside the slide's fit factor; the dot 0.75em, still 9 px at text size 1 (8.25 px under rice). At text size 1.5 the values and labels are 18 and 15 px, at 0.7 8.4 and 7 px, at 1.6 19.2 and 16 px.
- Decks: 95 of 95 research projects now have one (before: 25 of 95, C5 first run). 70 are new; 25 replace the old ones, including the 9 idea stubs (`kind: idea`, one `desc` line each) and the two `kind: text` decks. 45 decks have one slide and 50 have two.
- 23 figures are added to `present/` folders; no figure is removed or changed.
- The C10 repeated lines go from 15 to 53, every one a label, a state, an author list, a shared title, a venue, a dataset, the column break or the FedAvg equation, as listed above.

## Wrong or impossible in the brief, with the evidence

- Verify item 1 cannot print "every command passed" while `TMPDIR` points inside a git checkout, which the correction requires (`.agents/scratch/` inside the oculus worktree; the hub worktree is a git checkout too). Evidence: the DONE table's verify-1 row (`size.test.ts:198`, `folder-check.sh:16-17`, the two isolated runs, 1 failed against 10 passed with `GIT_CEILING_DIRECTORIES`).
- erp-signatures holds its paper only as Word files (`manuscript/main.docx`, `manuscript/main_revised.docx`); item 1 names a `.tex` file or a PDF as the manuscript, so the README stands first in the order for that deck (its per-deck part).
- editorial-bigdata-ai-ms: `manuscript/working-document-editorial.docx` was not opened, as a Word working draft outside item 1's sources; the published PDF was read whole (its per-deck part).
- highgamma-event-detection and modulation-lmp-bci: the two manuscript PDFs carry the same title, and the manifests place one abstract at a different meeting year than its PDF (their per-deck parts); both decks follow the PDFs.
- `utils/outside-paths.mjs` lists four plan files written by the orchestrator, not by this step (`O151-cases.md`, `O151.md`, `guarded.md`, `spec.md`; verify-4 row).
- Item 2's second-slide option "or `equation`" is overruled by ruling 2: no second slide is `kind: equation` (`grep -c 'kind equation' c5.txt`: 0).
- ecg-readable-substrate: the submitted manuscript and the manifest still give the 7 wins, 5 ties and 0 losses headline (`project.yml:24`, `:31`), while `README.md:90` records that at equal input it is 5 / 1 / 6 and that the headline does not hold. The deck shows both, with the equal-input run on slide 2. Changing the manuscript or the manifest is outside this step's paths.

## The hub's root instruction file

The hub worktree's root `CLAUDE.md` was never opened by this builder: no Read call and no command of this step's transcript names the hub's root `CLAUDE.md`, `AGENTS.md` or `README.md` (`node rootreads.mjs <transcript>` printed only "done"). Its text reached the session only as an automatic system reminder that the harness attaches when a file in that worktree is read; the decks take no fact from it.

## Files written in the session scratchpad

The correction of this round bars the session scratchpad. Before it, this step wrote these entries in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/`. The list is taken from this step's own commands: the scratchpad entries newer than the transcript's first message (`find . -maxdepth 1 -newer <ref>`, 176 entries, most of them other agents'), kept where the entry's name or the stem of its name appears in one of this step's tool calls (`node sp-attr.mjs`), with `look-8797.log` and `looks/` removed (their names matched only a later `ls`, and `looks/` holds 633344 files no command of this step made) and `sl-main.txt`, `sl-main_revised.txt` added (written by a `for` loop as `$S/sl-$n.txt`). Nothing there was written, moved or deleted after the correction arrived.

- Case-run programs: `c5.mjs`, `c10.mjs`, `fit.mjs`, `prose.mjs`, `diffrq.sh`, `figcmp.sh` (copied unchanged into `.agents/scratch/` and run again from there for this report).
- Their outputs and other check outputs: `c5-first.txt`, `c5-final.txt`, `c10-first.txt`, `c10-final.txt`, `c6-first.txt`, `c6-first-b.txt`, `diffrq.txt`, `diffrq-compact.txt`, `figcmp.txt`, `hub-status.txt`, `unused-now.txt`, `testquick.log`, `diagrams.log`, `only-imgs.txt`, `log-imgs.txt`, `one.txt`.
- Lists: `research.txt`, `research-projects.txt`, `status-projects.txt` (the research projects), `base-decks.txt` (the 25 replaced decks), `done.log` (decks finished, in order), `figures-copied.log` (each figure copied, source and target).
- Text extracted from a project's PDF or `.tex` for reading (`pdftotext`, or `cat -n` of thesis chapters): `abd.txt`, `algebraic-effects-compilation.txt`, `algebraic-effects-compilation.nb.txt`, `bnids.txt`, `bnids2.txt`, `bn_app.txt`, `bn_c5.txt`, `bttr-bare.txt`, `bttr-main.txt`, `ch4.txt`, `ch5.txt`, `chi-household-survival.txt`, `chi-purpose-centric.txt`, `cmi.txt`, `coordinated-fingers-ecnr.txt`, `coordinated-fingers-ecnr.nb.txt`, `eb-ebttr.txt`, `eb-main.txt`, `eb-main2.txt`, `ecog-frequency-features.txt`, `ecog-frequency-features.nb.txt`, `editorial.txt`, `editorial.nb.txt`, `fa.txt`, `fb.txt`, `fc.txt`, `fermat-pub.txt`, `gobttr-pub.txt`, `hccposter.layout.txt`, `highgamma.txt`, `highgamma.nb.txt`, `http2-best-practices.txt`, `http2-best-practices.nb.txt`, `http2-web-performance.txt`, `http2-web-performance.nb.txt`, `icfp-abstract.txt`, `icfp-poster.txt`, `iris.txt`, `iris2.txt`, `iris3.txt`, `iris-pages.txt`, `iris-raw.txt`, `modulation-lmp-bci.txt`, `modulation-lmp-bci.nb.txt`, `ms-algebraic-subtyping.txt`, `ms-algebraic-subtyping.2.txt`, `ms-eeg-infotheory.txt`, `ms-eeg-infotheory.2.txt`, `msa.txt`, `msa45.txt`, `mse.txt`, `pfl.txt`, `pfl.nb.txt`, `prop.txt`, `prop.nb.txt`, `sl-jne-iop.txt`, `sl-main.txt`, `sl-main_revised.txt`, `volga.txt`, `volga2.txt`.
- Page renders to look at a figure or a PDF page (`pdftoppm`): `aeff-24.png`, `dongho-fig1-1.png`, `dongho-fig2-1.png`, `hccposter-1.png`, `hccres-1.png`, `pfl_p-10.png`, `iris-png/` (9 files), `poster-img/` (2 files).
- Not attributed, not verified: `node-compile-cache/` (made 23:39:52, the minute of this step's first program runs with `TMPDIR` set to the scratchpad) and the temporary folders `oculus-code-themes-hub-*`, `oculus-hub-*`, `oculus-lab-*`, `oculus-workspace-state-*` (made 00:01 to 00:11, when no test run of this step is recorded); either may come from a run of this step or of another agent sharing the scratchpad.

## Appendix: the case-run programs

All lived in `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/.agents/scratch/`, each run from there with `TMPDIR` set to it and its output redirected by the shell into the same folder; none writes a file. The folder is deleted before hand-back.

`c5.mjs` (C5):

```js
// Case-run program for O151 case C5. Prints, per research project's present/ folder, the slide
// count, each slide's kind and title, the keys present, any value holding a control character and
// any key whose value is not the shape docs/decks.md gives. Writes nothing.
// Usage: node c5.mjs <hub root> <file listing the project.yml paths>
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { parse } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/node_modules/yaml/dist/index.js';
import { splitSlides } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/src/lib/data/sources/deck/split.ts';

const [hub, list] = process.argv.slice(2);
const manifests = readFileSync(list, 'utf8').split('\n').filter(Boolean);
const KINDS = ['title', 'section', 'text', 'image', 'columns', 'equation', 'code', 'closing', 'project', 'idea'];
const CLASSES = ['measured', 'design', 'proof', 'mixed'];
const FIGS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
const TEXT_KEYS = ['title', 'desc', 'sub', 'hook', 'mechanism', 'headline', 'equation', 'notes', 'legend', 'kicker', 'contact', 'foot'];
const PROJECT_KEYS = ['kind', 'notes', 'title', 'sub', 'hook', 'tag', 'eli5', 'equation', 'specs', 'panels', 'method', 'results', 'mechanism', 'headline'];
const REQUIRED = ['title', 'hook', 'eli5', 'method', 'results', 'headline'];

const isMap = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';

function controls(value, path, out) {
    if (typeof value === 'string') {
        if (/[\x00-\x09\x0b-\x1f\x7f]/.test(value)) out.push(path);
    } else if (Array.isArray(value)) value.forEach((v, i) => controls(v, `${path}[${i}]`, out));
    else if (isMap(value)) for (const [k, v] of Object.entries(value)) controls(v, `${path}.${k}`, out);
}

function shapeFaults(meta, folder) {
    const faults = [];
    const kind = meta.kind ?? 'text';
    if (!KINDS.includes(kind)) faults.push(`kind=${kind}`);
    for (const key of Object.keys(meta)) {
        const v = meta[key];
        if (kind === 'project' && !PROJECT_KEYS.includes(key)) faults.push(`${key}: not a project key`);
        if (key === 'kind') continue;
        if (TEXT_KEYS.includes(key) && !isText(v)) faults.push(`${key}: not text`);
        if (key === 'tag' && !(isMap(v) && CLASSES.includes(v.class) && isText(v.text))) faults.push('tag: not { class, text } with a known class');
        if (key === 'eli5' && !(isMap(v) && isText(v.purpose) && isText(v.plain))) faults.push('eli5: not { purpose, plain }');
        if (key === 'specs' && !(Array.isArray(v) && v.every((s) => isMap(s) && isText(s.label) && isText(s.value)))) faults.push('specs: not a list of { label, value }');
        if ((key === 'method' || key === 'results') && !(Array.isArray(v) && v.length > 0 && v.every(isText))) faults.push(`${key}: not a list of text`);
        if (key === 'panels') {
            if (!Array.isArray(v)) faults.push('panels: not a list');
            else v.forEach((p, i) => {
                if (!isMap(p)) return faults.push(`panels[${i}]: not a map`);
                for (const pk of Object.keys(p)) if (!['figure', 'diagram_html', 'caption', 'explain'].includes(pk)) faults.push(`panels[${i}].${pk}: unknown`);
                for (const pk of ['figure', 'diagram_html', 'caption', 'explain']) if (pk in p && !isText(p[pk])) faults.push(`panels[${i}].${pk}: not text`);
                if (isText(p.figure)) {
                    if (!FIGS.includes(extname(p.figure).toLowerCase())) faults.push(`panels[${i}].figure: not an image kind`);
                    if (!existsSync(join(folder, p.figure))) faults.push(`panels[${i}].figure: missing in folder`);
                }
            });
        }
        if (key === 'equation' && isText(v) && /\.(png|jpe?g|svg|webp)\s*$/i.test(v)) faults.push('equation: names an image');
    }
    return faults;
}

function titleOf(slide) {
    const meta = slide.meta ?? {};
    if (isText(meta.title)) return `title: ${meta.title}`;
    const first = slide.body.split('\n').find((l) => l.trim() !== '');
    if (first && /^# /.test(first)) return `heading: ${first.slice(2)}`;
    return 'UNTITLED';
}

let decks = 0;
for (const manifest of manifests) {
    const project = dirname(manifest);
    const folder = join(hub, project, 'present');
    const hasSources = existsSync(join(hub, project, 'README.md')) || existsSync(join(hub, project, 'manuscript'));
    if (!existsSync(join(folder, 'present.yml'))) {
        console.log(`${project}: NO present.yml${existsSync(folder) ? ` (folder holds ${readdirSync(folder).join(' ')})` : ' (no present/ folder)'}`);
        continue;
    }
    decks += 1;
    const lines = [];
    let deck;
    try { deck = parse(readFileSync(join(folder, 'present.yml'), 'utf8')); } catch (e) { console.log(`${project}: present.yml does not parse`); continue; }
    const faults = [];
    if (!isMap(deck) || !isMap(deck.deck) || !isText(deck.deck.title)) faults.push('deck.title: not text');
    if (!isMap(deck) || !Array.isArray(deck.order) || deck.order.length === 0) faults.push('order: not a list');
    const files = (deck?.order ?? []).filter((e) => typeof e === 'string');
    let count = 0;
    files.forEach((file) => {
        if (!existsSync(join(folder, file))) { faults.push(`order: ${file} missing`); return; }
        const cut = splitSlides(readFileSync(join(folder, file), 'utf8'));
        if (cut.unreadable) faults.push(`${file}: front matter does not parse`);
        cut.slides.forEach((slide) => {
            count += 1;
            const meta = slide.meta ?? {};
            const kind = meta.kind ?? 'text';
            const ctl = [];
            controls(meta, 'front', ctl);
            const keys = Object.keys(meta).filter((k) => k !== 'kind');
            const shape = shapeFaults(meta, folder);
            const need = count === 1 && hasSources ? REQUIRED.filter((k) => !(k in meta)) : [];
            lines.push(`  slide ${count}: kind ${kind}; ${titleOf(slide)}`);
            lines.push(`    keys: ${keys.join(', ') || '(none)'}${slide.body.trim() ? '; body' : ''}`);
            if (count === 1 && kind !== 'project') lines.push('    FIRST SLIDE NOT kind: project');
            if (need.length) lines.push(`    REQUIRED KEYS ABSENT: ${need.join(', ')}`);
            if (ctl.length) lines.push(`    CONTROL CHARACTER in: ${ctl.join(', ')}`);
            if (shape.length) lines.push(`    SHAPE: ${shape.join('; ')}`);
        });
    });
    const verdict = count >= 1 && count <= 2 ? '' : ' SLIDE COUNT OUT OF 1-2';
    console.log(`${project}: ${count} slide(s), deck.title ${JSON.stringify(deck?.deck?.title)}, order ${JSON.stringify(deck?.order)}${verdict}${faults.length ? `; DECK FAULTS: ${faults.join('; ')}` : ''}`);
    for (const line of lines) console.log(line);
}
console.log(`folders with present.yml: ${decks} of ${manifests.length}`);
```

The required-key check runs only for a project folder that holds a `README.md` or a `manuscript/`; 93 of the 95 do, and the two that do not (algebraic-subtyping, individual-reference-intervals) were read: each first slide holds `title`, `hook`, `eli5`, `method`, `results` and `headline` (`grep -o -E '^(title|hook|eli5|method|results|headline):'`, 6 each).

`c10.mjs` (C10):

```js
// Case-run program for O151 case C10. Prints every line of slide text found in more than one
// research project's deck, with the decks that hold it. A slide-text line is a text value of a
// slide's front matter (every key but kind, tag.class and panels' figure, a list's items and a
// map's values each a line of their own) and each non-blank line of a slide's body. Writes nothing.
// Usage: node c10.mjs <hub root> <file listing the project.yml paths>
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/node_modules/yaml/dist/index.js';
import { splitSlides } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/src/lib/data/sources/deck/split.ts';

const [hub, list] = process.argv.slice(2);
const manifests = readFileSync(list, 'utf8').split('\n').filter(Boolean);
const seen = new Map();

function add(line, where, project) {
    const text = line.trim();
    if (text === '') return;
    if (!seen.has(text)) seen.set(text, new Map());
    seen.get(text).set(project, where);
}

function leaves(value, path, project) {
    if (typeof value === 'string') add(value, path, project);
    else if (typeof value === 'number') add(String(value), path, project);
    else if (Array.isArray(value)) value.forEach((v) => leaves(v, path, project));
    else if (value && typeof value === 'object')
        for (const [k, v] of Object.entries(value)) {
            if (k === 'kind' || (path === 'tag' && k === 'class') || k === 'figure') continue;
            leaves(v, path ? `${path}.${k}` : k, project);
        }
}

for (const manifest of manifests) {
    const project = dirname(manifest);
    const folder = join(hub, project, 'present');
    if (!existsSync(join(folder, 'present.yml'))) continue;
    const deck = parse(readFileSync(join(folder, 'present.yml'), 'utf8'));
    add(String(deck?.deck?.title ?? ''), 'deck.title', project);
    for (const file of (deck?.order ?? []).filter((e) => typeof e === 'string')) {
        if (!existsSync(join(folder, file))) continue;
        for (const slide of splitSlides(readFileSync(join(folder, file), 'utf8')).slides) {
            leaves(slide.meta ?? {}, '', project);
            for (const line of slide.body.split('\n')) add(line, 'body', project);
        }
    }
}

let repeated = 0;
for (const [text, where] of [...seen].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))) {
    if (where.size < 2) continue;
    repeated += 1;
    console.log(`${JSON.stringify(text)} in ${where.size} decks:`);
    for (const [project, key] of where) console.log(`    ${project} (${key})`);
}
console.log(`lines repeated across decks: ${repeated}`);
```

`fit.mjs` (the fit rules):

```js
// Case-run program for O151's fit rules: prints every slide whose method or results list has more
// than four items, whose specs exceed four chips, whose panels exceed one, or whose body has a list
// run of more than four items; also counts slides with an equation. Writes nothing.
// Usage: node fit.mjs <hub root> <file listing the project.yml paths>
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/node_modules/yaml/dist/index.js';
import { splitSlides } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/src/lib/data/sources/deck/split.ts';

const [hub, list] = process.argv.slice(2);
let over = 0;
let equations = 0;
let slides = 0;
for (const manifest of readFileSync(list, 'utf8').split('\n').filter(Boolean)) {
    const folder = join(hub, dirname(manifest), 'present');
    const deck = parse(readFileSync(join(folder, 'present.yml'), 'utf8'));
    for (const file of deck.order) {
        const cut = splitSlides(readFileSync(join(folder, file), 'utf8'));
        cut.slides.forEach((slide, i) => {
            slides += 1;
            const m = slide.meta ?? {};
            const out = [];
            for (const k of ['method', 'results']) if (Array.isArray(m[k]) && m[k].length > 4) out.push(`${k} ${m[k].length}`);
            if (Array.isArray(m.specs) && m.specs.length > 4) out.push(`specs ${m.specs.length}`);
            if (Array.isArray(m.panels) && m.panels.length > 1) out.push(`panels ${m.panels.length}`);
            if (typeof m.equation === 'string' && m.equation.trim()) equations += 1;
            let run = 0;
            let maxRun = 0;
            for (const line of slide.body.split('\n')) {
                if (/^\s*[-*] /.test(line)) { run += 1; maxRun = Math.max(maxRun, run); }
                else if (line.trim() !== '') run = 0;
            }
            if (maxRun > 4) out.push(`body list run ${maxRun}`);
            if (out.length) { over += 1; console.log(`${dirname(manifest)} slide ${i + 1}: ${out.join(', ')}`); }
        });
    }
}
console.log(`slides: ${slides}; slides over a fit rule: ${over}; slides with an equation key: ${equations}`);
```

`prose.mjs` (the prose rule's mechanical hits; every hit is read):

```js
// Case-run program for O151's prose rule: prints every method or results item, eli5 text, hook and
// panel explain that does not start with a capital letter (or a digit, a quote or $) or does not end
// with a full stop, and every slide text holding a spaced hyphen, a double hyphen or a listed filler
// word. Writes nothing; the reading of each hit is the builder's.
// Usage: node prose.mjs <hub root> <file listing the project.yml paths>
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/node_modules/yaml/dist/index.js';
import { splitSlides } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/src/lib/data/sources/deck/split.ts';

const [hub, list] = process.argv.slice(2);
const FILLER = /\b(leverage|leverages|comprehensive|crucial|showcase|moreover|seamless|seamlessly|delve|pivotal|game-changer|unlock|unlocks|robustly)\b/i;
const starts = (s) => /^[A-Z0-9"'$(\\*<]/.test(s.trim());
const ends = (s) => /[.?!]['")*]*$/.test(s.trim());
let hits = 0;
const say = (where, why, text) => { hits += 1; console.log(`${where}: ${why}: ${text.slice(0, 160)}`); };
for (const manifest of readFileSync(list, 'utf8').split('\n').filter(Boolean)) {
    const project = dirname(manifest);
    const folder = join(hub, project, 'present');
    const deck = parse(readFileSync(join(folder, 'present.yml'), 'utf8'));
    for (const file of deck.order) {
        splitSlides(readFileSync(join(folder, file), 'utf8')).slides.forEach((slide, i) => {
            const m = slide.meta ?? {};
            const where = `${project} s${i + 1}`;
            const sentences = [];
            for (const k of ['method', 'results']) if (Array.isArray(m[k])) m[k].forEach((t, j) => sentences.push([`${k}[${j}]`, t]));
            if (m.eli5) for (const k of ['purpose', 'plain']) if (typeof m.eli5[k] === 'string') sentences.push([`eli5.${k}`, m.eli5[k]]);
            if (typeof m.hook === 'string') sentences.push(['hook', m.hook]);
            if (Array.isArray(m.panels)) m.panels.forEach((p, j) => { if (typeof p.explain === 'string') sentences.push([`panels[${j}].explain`, p.explain]); });
            for (const [k, t] of sentences) {
                if (!starts(t)) say(where, `${k} first letter`, t);
                if (!ends(t)) say(where, `${k} no full stop`, t);
            }
            const all = [JSON.stringify(m), slide.body].join('\n');
            for (const line of all.split(/\\n|\n/)) {
                if (/\s-\s/.test(line.replace(/^\s*- /, ''))) say(where, 'spaced hyphen', line.trim());
                if (/[^-]--[^-]/.test(line) && !/^---/.test(line.trim())) say(where, 'double hyphen', line.trim());
                if (FILLER.test(line)) say(where, 'filler word', line.trim());
            }
        });
    }
}
console.log(`hits: ${hits}`);
```

`katex.mjs` (the equation lengths quoted in the per-deck parts; "equations: 43; throwing: 0"):

```js
// Case-run program: renders every slide's equation key with KaTeX, throwOnError true, and prints
// the project, the slide, and the length of the markup in inline and display mode. Writes nothing.
// Usage: node katex.mjs <hub root> <file listing the project.yml paths>
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/node_modules/yaml/dist/index.js';
import katex from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/node_modules/katex/dist/katex.mjs';
import { splitSlides } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/src/lib/data/sources/deck/split.ts';
const [hub, list] = process.argv.slice(2);
let n = 0, bad = 0;
for (const manifest of readFileSync(list, 'utf8').split('\n').filter(Boolean)) {
    const folder = join(hub, dirname(manifest), 'present');
    const deck = parse(readFileSync(join(folder, 'present.yml'), 'utf8'));
    for (const file of deck.order) splitSlides(readFileSync(join(folder, file), 'utf8')).slides.forEach((s, i) => {
        const eq = s.meta?.equation;
        if (typeof eq !== 'string' || !eq.trim()) return;
        n += 1;
        try {
            const a = katex.renderToString(eq, { throwOnError: true }).length;
            const b = katex.renderToString(eq, { throwOnError: true, displayMode: true }).length;
            console.log(`${dirname(manifest)} s${i + 1}: inline ${a}, display ${b}`);
        } catch (e) { bad += 1; console.log(`${dirname(manifest)} s${i + 1}: THROWS ${e.message.slice(0, 120)}`); }
    });
}
console.log(`equations: ${n}; throwing: ${bad}`);
```

Every "renders with KaTeX (N characters)" in the per-deck parts is the inline length this run printed for that deck (13 of 13 compared, all equal).

`diffrq.sh` (verify 4):

```sh
#!/bin/sh
# Case-run program for O151 verify item 4: for each of the 95 present/ folders, runs diff -rq against
# the hub base copy and prints each line, then the line counts of the text files now in the folder.
# Writes nothing. Usage: sh diffrq.sh <research.txt>
H=/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O151
B=/Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base
while read -r m; do
    f="$(dirname "$m")/present"
    echo "== $f"
    if [ -d "$B/$f" ]; then
        diff -rq "$H/$f" "$B/$f" | sed "s|$H/||g; s|$B/|base:|g"
    else
        echo "base: no folder"
    fi
    for t in "$H/$f"/*.md "$H/$f"/*.yml; do
        [ -f "$t" ] && printf '   %s %s\n' "$(wc -l < "$t" | tr -d ' ')" "$(basename "$t")"
    done
done < "$1"
```

`figcmp.sh` (the figures): a `while read -r src dst` loop over the 23 pairs listed under "Figures copied", printing `identical | src | dst` when `cmp -s "$H/$src" "$H/$dst"` succeeds and `DIFFERS | src | dst` otherwise, with `H=/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O151/projects`.

`mywrites.mjs` and `rootreads.mjs` read this step's transcript (`/Users/axelfaes/.claude-backup/projects/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/subagents/agent-a69da2be8a76365d5.jsonl`): the first lists the `file_path` of every Write and Edit call (4 oculus files, 190 hub `present/` files, and the six scratchpad programs written before the correction); the second prints any tool call whose input names the hub's root `CLAUDE.md`, `AGENTS.md` or `README.md` (it printed none). `sp-attr.mjs` gives, for each scratchpad entry newer than the transcript's first message, whether its name or its stem appears in a tool call of this step.

## Appendix: C5 output, per folder

The per-folder lines of `node c5.mjs <hub worktree> research.txt` (prefix `projects/` dropped); the per-slide lines under them carry no fault marker (count 0, DONE table row 1):

```
active/eeg-saad-challenge: 2 slide(s), deck.title "EEG-sAAD", order ["main.md"]
active/linfoot-estimator: 2 slide(s), deck.title "Linfoot Estimator", order ["main.md"]
active/loewner: 2 slide(s), deck.title "Loewner", order ["main.md"]
active/novel-math-primitives: 2 slide(s), deck.title "Math-Primitives", order ["main.md"]
active/sandpile-operator: 2 slide(s), deck.title "Sandpile-Op", order ["main.md"]
archive/failed/faithful-block-term-layer: 2 slide(s), deck.title "Faithful BT Layer", order ["main.md"]
archive/failed/fed-faithful-ecg: 2 slide(s), deck.title "Fed-Faithful ECG", order ["main.md"]
archive/failed/jacobian-coupled-blockterm-dp: 2 slide(s), deck.title "Jacobian-Coupled BT-DP", order ["main.md"]
archive/failed/ms-lipid-handshake: 2 slide(s), deck.title "MS Lipid Handshake", order ["main.md"]
archive/phd/phd-thesis: 2 slide(s), deck.title "PhD Thesis", order ["main.md"]
archive/published/2016/bachelor-network-ids: 2 slide(s), deck.title "Flow-based Network IDS (BSc)", order ["main.md"]
archive/published/2017/icfp-src-abstract: 1 slide(s), deck.title "Row-Based Effects Core Language (abstract)", order ["main.md"]
archive/published/2017/icfp-src-poster: 1 slide(s), deck.title "Row-Based Effects Core Language (poster)", order ["main.md"]
archive/published/2018/masters-algebraic-subtyping: 2 slide(s), deck.title "Algebraic Subtyping (MSc)", order ["main.md"]
archive/published/2018/masters-eeg-infotheory: 2 slide(s), deck.title "EEG Info-Theoretic Connectivity (MSc)", order ["main.md"]
archive/published/2021/abstract-bci-meeting-2021: 1 slide(s), deck.title "BCI Connectivity (abstract)", order ["main.md"]
archive/published/2021/source-localization: 2 slide(s), deck.title "eLORETA Source Reduction", order ["main.md"]
archive/published/2021/volga-finger-trajectories: 1 slide(s), deck.title "Finger Trajectories (Volga abstract)", order ["main.md"]
archive/published/2022/block-term-tensor-regression: 2 slide(s), deck.title "BTTR Finger Decoding", order ["main.md"]
archive/published/2022/connectivity-iris: 2 slide(s), deck.title "NN Connectivity", order ["main.md"]
archive/published/2022/extended-bttr-note: 2 slide(s), deck.title "BTTR Coactivation", order ["main.md"]
archive/published/2025/fbttr-strategies: 2 slide(s), deck.title "FBTTR Strategies", order ["main.md"]
archive/published/2025/fermat: 2 slide(s), deck.title "FERMAT", order ["main.md"]
archive/published/2025/go-bttr: 2 slide(s), deck.title "Sign-Language ECoG", order ["main.md"]
archive/published/2026/abduction: 2 slide(s), deck.title "Finger Abduction", order ["main.md"]
archive/published/2026/dongho-ecg-clustering: 2 slide(s), deck.title "ECG-Repr", order ["main.md"]
archive/published/2026/erp-signatures: 1 slide(s), deck.title "ERP Signatures", order ["main.md"]
archive/published/2026/glassbox-decision-pipelines: 2 slide(s), deck.title "Robust-XAI-ECG", order ["main.md"]
archive/published/2026/hcc-modality-poster: 2 slide(s), deck.title "Modality-Specific HCC Encoding (poster)", order ["main.md"]
archive/published/2026/hccnet-fl: 2 slide(s), deck.title "HCCNet-FL", order ["main.md"]
archive/stopped/algebraic-subtyping: 1 slide(s), deck.title "Algebraic Subtyping", order ["main.md"]
archive/stopped/connectivity-motor-imagery: 2 slide(s), deck.title "Motor-Imagery Connectivity", order ["main.md"]
coauthor/active/flkit: 1 slide(s), deck.title "FLKit", order ["main.md"]
coauthor/published/2016/chi-household-survival: 1 slide(s), deck.title "Household Survival (abstract)", order ["main.md"]
coauthor/published/2016/chi-purpose-centric: 1 slide(s), deck.title "Objects as Game Controllers (abstract)", order ["main.md"]
coauthor/published/2017/algebraic-effects-compilation: 2 slide(s), deck.title "Algebraic Effects Compilation", order ["main.md"]
coauthor/published/2017/http2-best-practices: 2 slide(s), deck.title "HTTP/2 Best Practices", order ["main.md"]
coauthor/published/2018/http2-web-performance: 2 slide(s), deck.title "HTTP/2 Web Performance", order ["main.md"]
coauthor/published/2023/coordinated-fingers-ecnr: 1 slide(s), deck.title "Coordinated Fingers from HD-EEG (abstract)", order ["main.md"]
coauthor/published/2023/ecog-frequency-features: 2 slide(s), deck.title "ECoG Frequency Features", order ["main.md"]
coauthor/published/2023/modulation-lmp-bci: 1 slide(s), deck.title "LMP Gamma Modulation (abstract)", order ["main.md"]
coauthor/published/2024/highgamma-event-detection: 1 slide(s), deck.title "High-Gamma Event Detection (abstract)", order ["main.md"]
coauthor/published/2025/editorial-bigdata-ai-ms: 1 slide(s), deck.title "MS Big-Data Editorial", order ["main.md"]
coauthor/published/2025/pfl-ms-npj: 2 slide(s), deck.title "PFL-MS", order ["main.md"]
coauthor/published/2025/proprioception-exoskeleton: 1 slide(s), deck.title "Proprioception EEG", order ["main.md"]
coauthor/stopped/individual-reference-intervals: 1 slide(s), deck.title "Reference Intervals", order ["main.md"]
ideas/adapter-format-theory: 1 slide(s), deck.title "Format Theory", order ["main.md"]
ideas/asthma-geo-tensor: 1 slide(s), deck.title "Asthma-Geo", order ["main.md"]
ideas/attention-scoped-instructions: 1 slide(s), deck.title "Scoped Instructions", order ["main.md"]
ideas/block-term-nca: 1 slide(s), deck.title "Block-term NCA", order ["main.md"]
ideas/brecht-fl-partitioning: 1 slide(s), deck.title "FL Partitioning", order ["main.md"]
ideas/btd-autoencoder: 1 slide(s), deck.title "BTD Autoencoder", order ["main.md"]
ideas/cirrhosis-digital-twin: 2 slide(s), deck.title "Cirrhosis iDT", order ["main.md"]
ideas/clinical-ai-eval-artifacts: 1 slide(s), deck.title "Eval Artifacts", order ["main.md"]
ideas/concept-bottleneck-hcc: 1 slide(s), deck.title "Concept-Bottleneck HCC", order ["main.md"]
ideas/conformal-tensor-factors: 1 slide(s), deck.title "Conformal Tensor", order ["main.md"]
ideas/ecg-af-fair: 1 slide(s), deck.title "ECG-AF (FAIR)", order ["main.md"]
ideas/engram: 2 slide(s), deck.title "Engram", order ["main.md"]
ideas/faithful-interpretability-position: 1 slide(s), deck.title "Faithful-Interp Position", order ["main.md"]
ideas/fed-duplication-limits: 1 slide(s), deck.title "FL Duplication", order ["main.md"]
ideas/fed-neural-operators: 1 slide(s), deck.title "Fed Neural Operators", order ["main.md"]
ideas/fedbtd: 1 slide(s), deck.title "FedBTD", order ["main.md"]
ideas/federated-protocol-agents: 1 slide(s), deck.title "Protocol Agents", order ["main.md"]
ideas/fedlink: 1 slide(s), deck.title "FedLink", order ["main.md"]
ideas/fl-privacy-auditing: 1 slide(s), deck.title "FL Privacy Audit", order ["main.md"]
ideas/florank-personalization: 1 slide(s), deck.title "FLoRank Personalization", order ["main.md"]
ideas/harmonop: 1 slide(s), deck.title "HarmonOp", order ["main.md"]
ideas/hccnet-fl-sweden: 1 slide(s), deck.title "HCCNet FL Sweden", order ["main.md"]
ideas/hccnet-pathology: 2 slide(s), deck.title "HCCNet Pathology", order ["main.md"]
ideas/modality-dropping-btf: 1 slide(s), deck.title "Modality-Dropping BTF", order ["main.md"]
ideas/multiway-biosignal-fm: 2 slide(s), deck.title "Multiway FM", order ["main.md"]
ideas/neurosde: 1 slide(s), deck.title "NeuroSDE", order ["main.md"]
ideas/old-charges-stemmatology: 2 slide(s), deck.title "Old Charges", order ["main.md"]
ideas/paleogenomics-tensor: 1 slide(s), deck.title "Paleo-Tensor", order ["main.md"]
ideas/pathology-tensor-mil: 1 slide(s), deck.title "Pathology Tensor-MIL", order ["main.md"]
ideas/physics-tensor-hcc: 1 slide(s), deck.title "Physics-Tensor HCC", order ["main.md"]
ideas/quantum-tensor-fl: 1 slide(s), deck.title "Quantum Tensor/FL", order ["main.md"]
ideas/serial-ecg-af: 1 slide(s), deck.title "Serial-ECG AF", order ["main.md"]
ideas/ssm-longitudinal: 1 slide(s), deck.title "SSM Longitudinal", order ["main.md"]
ideas/strokeop: 1 slide(s), deck.title "StrokeOp", order ["main.md"]
ideas/xsub-ecog-framework: 1 slide(s), deck.title "XSub-ECoG", order ["main.md"]
manuscripts/bt-operator-theory: 2 slide(s), deck.title "BT-Op-Theory", order ["main.md"]
manuscripts/btfno: 2 slide(s), deck.title "BT-FNO", order ["main.md"]
manuscripts/bttd-source-eeg: 2 slide(s), deck.title "LF-BTD", order ["main.md"]
manuscripts/bttn-incident-af: 2 slide(s), deck.title "BTTN", order ["main.md"]
manuscripts/clinical-hccnet: 2 slide(s), deck.title "Clin-HCCNet", order ["main.md"]
manuscripts/covert-applied: 2 slide(s), deck.title "COVERT", order ["main.md"]
manuscripts/covert-theory: 2 slide(s), deck.title "Private Coupled Descent", order ["main.md"]
manuscripts/dries-bttr-ecg: 2 slide(s), deck.title "BTTR-AF", order ["main.md"]
manuscripts/ecg-readable-substrate: 2 slide(s), deck.title "Readable-FM-ECG", order ["main.md"]
manuscripts/fed-multicellular-immune: 2 slide(s), deck.title "Fed-Multicellular", order ["main.md"]
manuscripts/hccnet-revision: 2 slide(s), deck.title "HCCNet", order ["main.md"]
manuscripts/meseret-cirrhosis: 2 slide(s), deck.title "Cirrhosis-CR", order ["main.md"]
manuscripts/raw-pls: 2 slide(s), deck.title "RAW-PLS", order ["main.md"]
manuscripts/ward-bttr-crosssubject: 2 slide(s), deck.title "BSA-ECoG", order ["main.md"]
folders with present.yml: 95 of 95
```

The C10 output's 53 lines and their decks are listed in full under "Slide-text lines repeated across decks", except the deck lists of the spec labels and of "|||" and "published", which name every deck that uses the label (77 for "Stage") and are summarised by their counts.

# Round 1

## Ruling 1: every statement removed or replaced, per deck

Each entry gives the deck line as it stood before this round, then the words that stand now ("removed" where nothing replaces it).

### archive/published/2025/go-bttr

- Line 11, "M.M. Van Hulle (8 authors)": now "M.M. Van Hulle" (the count is not in the sources).
- Line 13, "Utrecht (4 analysed) and Leuven (2) ECoG patients": now "Utrecht (subjects 2 to 5) and Leuven (2) ECoG patients" (`main.tex:217`).
- Line 17, "links above 0.08 (95% reconstruction) join fingers.": now "links above 0.08 join fingers, the threshold at which CGP reconstructs the signal with at least 95% accuracy." (`main.tex:205`).
- Line 22, "Utrecht, 4 ASL letters, 4 patients: mean r ...": now "Utrecht, 4 ASL letters, subjects 2 to 5: mean r ..." (`main.tex:247`).
- Line 24, "eBTTR or BTTR falls significantly below Go-BTTR on five subject-finger pairs.": now "eBTTR is significantly lower for subject 1's middle finger and pinky, BTTR for subject 2's index, ring and pinky." (`main.tex:337`).
- Line 27, headline "Best mean finger correlation on both datasets, with BTTR's single-finger stability": now "Best on co-activated fingers, on par with BTTR on single fingers" (`project.yml` results, abstract).
- Line 32, title "How Go-BTTR assigns its blocks, and the caveats in the reported tables": now "How Go-BTTR assigns its blocks".
- Line 33, hook "...while BTTR and Go-BTTR stay stable; Go-BTTR pays for the graph step in training time.": now "As blocks are added, eBTTR's index-finger correlation shows lapses in both datasets, while BTTR and Go-BTTR remain stable." (`main.tex:263, 306`); the training times stay as the paper gives them on line 37.
- Line 39, "In the Utrecht table, subjects 2, 4 and 5 carry identical values for every finger and method; only subject 3 differs.": removed.
- Line 40, "Utrecht subject 1 is excluded for lacking M1 coverage, so 4 of the 5 recorded patients are analysed.": now "Utrecht subject 1 is excluded because no electrode covered M1." (`main.tex:68`).

### archive/published/2026/abduction

- Line 5, hook "ECoG finger decoding has dealt with flexion; two patients with epidural grids performed single-finger flexions, ...": now "ECoG finger decoding has focused on flexion; two patients with epidural grids performed cued single-finger flexions (subject 1 only), ..." (`main.tex:62, 125`).
- Line 13, "2 patients, epidural ECoG, 14-sensor data glove": now "2 patients, epidural ECoG, 5DT 14 Ultra data glove" (`main.tex:125`).
- Line 17, "the 26 sign letters (both; Bleichner et al. 2016 used 4 gestures)": now "the 26 sign letters (both; beyond the 4 gestures of the Utrecht experiment of Bleichner et al. 2016)" (`main.tex:205`).
- Line 23, "Flexion for reference: single fingers 0.12 to 0.45 (subject 1); sign letters 0.12 to 0.42 and 0.32 to 0.49.": now "Single-finger flexion for reference, subject 1, thumb to pinky: 0.31, 0.45, 0.12, 0.23, 0.16." (Table `results-subj-1-kul-1`, `main.tex:229`).
- Line 24, "eBTTR beats chance on every pair and AM, RF and LARS on most; CNN and LSTM are level on several pairs (LSTM 0.32 on subject 1 index-middle).": now "eBTTR is significantly above chance on every finger pair, and better than or on par with the non-linear decoders, deep learning ones included." (`main.tex:213, 297`).
- Line 25, "Cross-task, subject 1: trained on single fingers and tested on the letters, r falls to 0.08 to 0.22.": now "Cross-task, subject 1: the model trained on single fingers and tested on the letters is significantly lower than the one trained on the letters." (`main.tex:271`).
- Line 27, headline "Abduction decoded about as well as flexion, except for the thumb": now "Abduction decoded with accuracy comparable to flexion, except for the thumb" (`main.tex:309`).
- Line 32, title "What the abduction decoding shows, and where it is weak": now "Abduction decoding per finger pair".
- Line 33, hook "The thumb-index pair is the weakest for both patients; the paper puts this down to the glove lacking a thumb abduction sensor, while its own sensor figure lists a thumb-index abduction sensor.": now "Thumb abduction has the lowest decoding accuracy for both subjects; the paper expects this is due to the difficulty of gauging thumb abduction against flexion with the data glove." (`main.tex:209`, hedge kept).
- Line 35, panel caption "Predicted and recorded index-middle abduction, ..." and explain "The plot legend names the index-middle pair; the manuscript caption names the thumb-index pair of subject 2 in task 2.": caption now "Predicted and recorded abduction, with the LMP and low- and high-gamma amplitude of one electrode", explain now "The figure relates the raw recording, the glove ground truth, the extracted features and the predicted trajectory; y-axis in arbitrary units, x-axis in ms." (`main.tex:205, 219`).
- Line 37, "The text reports eBTTR significantly ahead of every method on every pair; the table leaves 12 of the 40 baseline cells unmarked, 10 of them CNN and LSTM.": now "Subject 2 shows overall stronger abduction correlations, especially for the middle-ring and ring-pinky pairs." (`main.tex:209`).
- Line 38, "Trained on the letters and tested on single fingers, subject 1 reaches 0.07 to 0.28; the paper reads this as on par.": now "Trained on the letters and tested on single fingers, the decoder seemed to perform on par, which the paper reads as a call for all-finger decoders such as eBTTR." (`main.tex:295`, hedge kept).
- Line 39, "...the epidural grids, whose signals are weaker than subdural ones.": now "...the epidural grids, whose recordings have lower signal amplitudes than subdural ones." (`main.tex:215`).
- Line 40, "Limits: two facial-pain patients with somatomotor implants, one of whom did no single-finger task.": now "Limits the paper states: two facial-pain patients with somatomotor implants; more recordings from subdural hand-motor grids would help." (`main.tex:299`).

### archive/published/2025/fbttr-strategies

- Line 25, "AM, RF, LARS, CNN and LSTM stay lower on every subject mean; the best of them, LSTM, reaches 0.54, 0.39 and 0.62.": now "FBTTR outperforms the non-multilinear models AM, RF, LARS, CNN and LSTM." (`manuscript/latex/main.tex:586`).
- Line 27, headline "Federated BTTR on par with eBTTR for all three subjects": now "Federated BTTR on par with, or slightly better than, eBTTR" (`main.tex:423`).
- Line 32, title "Which aggregation strategy to use, and what the comparison leaves open": now "Which aggregation strategy to use".
- Line 35, explain "The manuscript reads the colour as Pearson correlation; its colour bar runs past -5 and up to 20.": now "The paper reads the smooth transitions across blocks for each finger as FedAvg yielding stable parameters without large fluctuations." (`main.tex:425`).
- Line 37, "...0.68/0.67/0.65/0.68; only FedYogi falls significantly.": now ends at "0.68/0.67/0.65/0.68.", followed by a new line "FedAvg performs comparably or better; FedYogi shows slightly reduced performance, FedProx nearly matches FedAvg, FedAdagrad sits in between." (`main.tex:576-580`).
- Line 39, "The rows labelled centralized BTTR in the strategy tables carry the eBTTR numbers of the main tables.": removed.
- Line 40, "Limits: the clients are the five 40 s test blocks of one subject, no privacy mechanism is added, and communication is simulated on one workstation.": now "Limits the paper states: synchronisation overhead, possible degradation on highly heterogeneous data, and no privacy-preserving mechanism yet." (`main.tex:588, 594`).

### archive/published/2025/fermat

Every number kept comes from the FLTA paper the manifest names, `admin/conference/main_work.tex`.

- Line 24, "FL4E logistic regression on the same data: best federated AUC 0.846 (FedAvg, FedProx), centralized 0.812.": now "FBTTR outperforms the FL4E fully federated, hybrid and centralized runs on Fed-Heart-Disease in absolute numbers, most comparisons significant." (`main_work.tex:447`).
- Line 25, "...a significant gain; the hybrid FL4E FedAdagrad run reaches 0.776.": now ends at "...a significant gain." (`main_work.tex:470`).
- Line 33, heading "The clinical case studies and what they leave open": now "The clinical case studies".
- Line 37, "Centres are uneven: 164/139, ...": now "Class imbalance across the four clients: 164/139, ..." (`main_work.tex:449-460`).
- Line 38, "Alone, the two small centres reach accuracy 0.63 and 0.72 with FBTTR, both significantly below the federated model.": now "The hybrid FBTTR run is on par with the fully federated model and significantly outperforms the local runs of the smaller clients (accuracy 0.63 and 0.72)." (`main_work.tex:466, 484-485`).
- Line 39, "The two large centres score higher alone (AUC 0.89 and 0.92) than the federated model (0.872).": now "The paper suggests that smaller clients with imbalanced data may benefit more from joining federation than from working alone." (`main_work.tex:449`, hedge kept).
- Line 40, "The hybrid FBTTR run returns the fully federated numbers exactly, 0.872 and 0.772.": removed.
- Line 44, heading "Fed-TCGA-BRCA and the limits": now "Fed-TCGA-BRCA, and the limits the paper states".
- Line 46, "FL4E hybrid runs spread from C-index 0.439 (FedProx) to 0.776 (FedAdagrad).": now "FBTTR performs significantly better than centralized BTTR, which the paper reads as FBTTR leveraging the federated data." (`main_work.tex:470`).
- Line 47, "The text calls FBTTR's lead over FedAdagrad and FedProx non-significant; the table marks FedAvg and FedProx as significant.": now "FBTTR implements only the FedAvg equivalent; FL4E's FedOpt and FedProx runs serve as the comparison." (`main_work.tex:435`).
- Line 48, "The ECoG case does not say how the recordings were split into clients.": now "Limits: overhead of model synchronisation and possible degradation with highly heterogeneous data." (`main_work.tex:539`).
- Line 49, "No privacy mechanism is added on top of federation.": now "No specific privacy-preserving mechanism is part of this work." (`main_work.tex:539`).

### archive/published/2026/hcc-modality-poster

- Line 23, "With encoder heads, pretraining lifts every single-group score; with naive concatenation it lowers T1-IOP (0.720 to 0.690) and T2W (0.705 to 0.670).": now "Encoder heads mitigate the pretraining disparity: every group benefits from DINO pretrained per group; with naive concatenation the poster marks T1-IOP (0.720 to 0.690) and T2W (0.705 to 0.670) as degrading." (poster Key finding 1, and the Results table's red marking, checked on the render `hccposter-1.png`).
- Line 32, heading "Single sequence groups and limits": now "Single sequence groups, cohort and training" (the poster states no limits).
- Line 36, "Single-group chart: DWI 0.808, DCE 0.780, T1-IOP 0.753, T2W 0.738, all four 0.844; its DWI, T1-IOP, T2W and all-four values equal the pretrained encoder-head row.": now "Training with one group only: DWI 0.808, DCE 0.780, T1-IOP 0.753, T2W 0.738; all four combined 0.844.", followed by the poster's "Multi-modal fusion provides a further gain over any single group." (Single Modality panel).
- Line 38, "Naive concatenation without and with pretraining: DWI 0.718 and 0.795, T1-IOP 0.720 and 0.690, T2W 0.705 and 0.670.": removed to keep the column at four items; the T1-IOP and T2W values stay on slide 1.
- Line 43, heading "Limits": now "Cohort and training".
- Line 45, "One retrospective cohort from one centre: about 240 patients, about 37 of them HCC-positive.": now "Retrospective single-centre cohort from Medisch Spectrum Twente: about 240 patients, about 37 of them HCC-positive." (Dataset panel).
- Line 46, "AUROC is averaged over 5 folds and 3 seeds; the poster gives no intervals.": now "AUROC over 5 folds and 3 seeds." (Results caption).
- Line 47, "The design comparison has single-group scores for DWI, T1-IOP and T2W only; DCE alone appears only in the single-group chart.": now two lines from the Training Strategy panel, "Stage 1: each encoder head is pretrained with DINO on its group, then frozen." and "Stage 2: backbone and Transformer trained supervised on P(HCC); stage 3: the full system end to end, all parameters unfrozen."

### archive/stopped/connectivity-motor-imagery

- Line 22, "The lag-1 self-terms and the two links into $x_2$ come back within 0.07 of the truth.": now "The New York Head Model serves as the forward model from brain sources to the scalp." (`manuscript/main.tex:149`).
- Line 23, "The lag-2 terms come back smaller, and a spurious lag-2 link from $x_3$ to $x_1$ appears.": now "The draft reads these preliminary results as showing that the method can accurately estimate simulated connectivity patterns." (`main.tex:149`).
- Line 24, "Granger causality, information theory and the discussion are empty headings in the draft.": now "Its conclusion: the work shows the applicability of the Temporal Causal Discovery Framework on source-reconstructed scalp EEG." (`main.tex:168`).
- Line 44, "$x_1$: own lags 0.5 and $-0.4$; from $x_2$ at lag 1, listed twice as 0.14 and 0.2; from $x_3$ at lag 2, 0.14.": now "$x_1$: own lags 0.5 and $-0.4$; terms $0.14\,x_2(n-1)$, $0.14\,x_3(n-2)$ and $0.2\,x_2(n-1)$." (the draft's equation, `main.tex:154`).

### archive/published/2021/abstract-bci-meeting-2021

- Line 22, "Lag-1 self-terms return as 0.5, 0.77 and 0.8 against 0.5, 0.7 and 0.8; links into $x_2$ as 0.18 and 0.31 against 0.2 and 0.25.": now "Estimated $x_1$: own lags 0.5 and $-0.4$; terms $0.14\,x_2(n-1)$, $0.14\,x_3(n-2)$ and $0.2\,x_2(n-1)$." (`manuscript/main.tex:52`).
- Line 23, "Lag-2 self-terms shrink to $-0.4$ and $-0.28$ from $-0.7$ and $-0.5$.": now "Estimated $x_2$: own lags 0.77 and $-0.28$, from $x_1$ 0.18 and from $x_3$ 0.31; estimated $x_3$: own lag 0.8." (`main.tex:53-54`).
- Line 24, "The estimate adds a lag-2 term from $x_3$ into $x_1$ and prints the lag-1 term from $x_2$ twice, as 0.14 and 0.2, against 0.25.": now "The abstract reads these preliminary results as showing that the method can accurately estimate simulated connectivity patterns." (`main.tex:47`).

### coauthor/published/2016/chi-household-survival

- Line 5, hook "...; room-sized RoomAlive uses instrumented controllers and iCon maps objects to generic actions, whereas here each object acts in the game the way it acts in a home.": now "...; in RoomAlive players use touch, instrumented pointing devices or standard controllers, and iCon does not consider an object's real-life purpose, while here each object's virtual attributes represent its real-world function." (the paper's Related Work and Introduction, `pdftotext manuscript/main.pdf` lines 85-86, 105-121).
- Line 24, "No user study is reported; the game, built as a university course project, is still used as a teaching example in university courses.": now "Developed as a student project for a university-level course; it is still used in university courses as a teaching example." (Acknowledgements; `project.yml:31`).

### coauthor/published/2018/http2-web-performance

- Line 9, plain "...the other new features help a little, and much of the slowness comes from browser and server bugs.": now "...the other new features matter less, and most of the slowness seems to come from immature browser and server software." (Discussion: "almost all of the encountered problems ... seem to be due to inefficient implementations"; hedge kept).
- Line 23, "HPACK cuts header bytes by more than a factor of five for 400 small files, too little to change a single page load.": now "HPACK cuts header bytes by more than a factor of five for 400 JS files, arguably too little to change a single page load." (Sect. 7, case (c) "400 complex JS files", "arguably too low"; hedge kept).
- Line 24, "...light pages load alike over HTTPS/1.1 and HTTP/2...": now "...light pages have similar SpeedIndex over HTTPS/1.1 and HTTP/2..." (Fig. 8 and its text).
- Line 26, headline "The single TCP connection dominates HTTP/2 performance; the other features help little": now "The single TCP connection has the biggest impact on HTTP/2 performance; the other features matter less" (Conclusion: "by-and-large the biggest performance impact"; Discussion: "do not seem to have as large an impact").
- Line 32, heading "Implementation problems and limits": now "Implementation problems and scope".
- Line 43, heading "Limits": now "Scope and related work".
- Line 46, "All networks are emulated, and the results disagree with studies that load pages over the live internet.": now "Networks are emulated; the paper cannot confirm the more positive HTTP/2 results of work that loads pages directly over the internet." (Sect. 8: "We are unable to confirm their findings").
- Line 48, "Three of the figures are reused from the authors' earlier paper.": now "The QUIC protocol, on UDP, might help HTTP/2 overcome its single-connection problems." (Conclusion; hedge kept).

### manuscripts/ecg-readable-substrate

- Line 39, "Transfer becomes 2 wins, 1 tie, 3 losses (MIMIC to CODE-15) and 2, 2, 2 (CODE-15 to MIMIC); the submitted manuscript does not report this run.": now "... and 2, 2, 2 (CODE-15 to MIMIC) with age and sex given to the encoders." (`README.md:90`).

### manuscripts/clinical-hccnet

- Line 24, "...; 29 were at BCLC stage 0 or A at diagnosis and 27 received curative treatment.": now "...; at diagnosis 13 were at BCLC stage 0 and 16 at stage A, and 27 received curative treatment." (`manuscript/main.tex:192`).
- Line 26, explain "...; the intervals widen as the number of HCC falls to 10.": now "...; at 3 years, 72 patients with 10 HCC." (`main.tex:294`).
- Line 33, title "Per sequence, and what the cohort cannot yet show": now "Per sequence, and the limitations".
- Line 34, hook "Diffusion-weighted and T1 in- and out-of-phase MRI hold up at every horizon; the contrast-enhanced sequence falls to 0.690 at 2 years and 0.433 at 3 years, so the prediction does not rest on contrast.": now "In this cohort the prediction did not rest on the contrast-enhanced sequence: T1 contrast-enhanced MRI on its own reached an AUROC of 0.690 at 2 years and 0.433 at 3 years." (`main.tex:296`).

### archive/published/2021/volga-finger-trajectories

- Line 21, "The thumb is predicted far less well than the other two fingers.": now "The abstract credits the automatic choice of parameters with increased flexibility and interpretability." (`manuscript/main.pdf`, "As the parameters are determined in a fully automatic manner, the model offers increased flexibility and interpretability").

### archive/published/2022/extended-bttr-note

- Line 23, "The gain sits in the middle finger: 0.49 against 0.38 (subject 1) and 0.33 against 0.27 (subject 2), both significant.": now "eBTTR and BTTR differ significantly in the middle finger of subjects 1 and 2: 0.49 against 0.38 and 0.33 against 0.27." (`main.tex:303`).
- Line 24, "Subject 3 shows no gain; BTTR edges eBTTR, 0.67 against 0.66.": now "On the cued-finger average, AM, RF, LARS, CNN and LSTM are all marked significantly different from eBTTR for every subject." (the bold Avg. cells of the three result tables, `manuscript/main.tex:315-369`; this statement moved here from slide 2).
- Line 33, hook "Non-cued fingers move with the cued one through tendon anatomy and shared motor neurons; eBTTR predicts those movements, where BTTR, trained per cued finger, barely does.": now "Non-cued fingers move with the cued one, in part through hand and forearm tendon anatomy and the divergent connections from cortical to spinal motor neurons; the paper reports eBTTR predicting these coactivations as well as the cued trajectories." (`main.tex:38, 307`).
- Line 37, "Non-cued fingers, supplement: eBTTR r 0.43 to 0.82, 0.34 to 0.75 and 0.51 to 0.83 per subject; BTTR 0.01 to 0.62, 0.01 to 0.33 and 0.12 to 0.43.": now "The supplement gives eBTTR and BTTR accuracies for every non-cued finger and notes a significant difference between them; subject 1, thumb cued: index 0.72 against 0.05." (`manuscript/supp.tex`, Table `results-subj-1-unintended` and its caption).
- Line 38, "...following joint movements better than...": now "...decoding joint movements better than..." (`main.tex:307`).
- Line 39, "On cued-finger averages eBTTR beats amplitude modulation, RF, LARS, CNN and LSTM significantly for every subject.": moved to slide 1 (line 24) in the wording above; replaced here by "Coactivations are present in the glove data but most likely not encoded by the ECoG." (`main.tex:307`).
- Line 40, "Coactivations are most likely not encoded in the ECoG, so whether to decode them at all stays open.": now "The paper still renders them: the outcome looks more natural and could add sensory information when approaching an object." (`main.tex:307`).

### ideas/old-charges-stemmatology

- Line 35, "...FactGrid fills 7,607 of about 10.1 million cells, too sparse for a multiway analysis.": now "...FactGrid fills 7,607 of about 10.1 million cells, and the data cannot carry a multiway analysis." (`README.md:24`).
- Line 38, "Prior art: phylogenetic stemmata of Dante's Monarchia (21 witnesses) agree with the traditional ones; ...; simultaneous contamination stays out of scope in the Bayesian and automatic work.": now "Prior art: phylogenetic stemmata of Dante's Monarchia (20 manuscripts plus the editio princeps) agree closely with the traditional ones; ...; McCollum and Turnbull 2024 leave simultaneous contamination out of scope." (`README.md:57, 61`).
- Line 45, "Counts of known versions range from 32 (Hughan 1872) to 131 depending on source and what is counted.": now "Counts of known versions differ by source and by what is counted: 32 (Hughan 1872), about 115 (Knoop and Jones 1941), 131 entries on old-charges.org." (`README.md:43`).

### coauthor/published/2024/highgamma-event-detection

Source: the abstract `manuscript/main.pdf`.

- Line 5, hook "State-of-the-art finger decoders drift between movements; ...": now "Even state-of-the-art finger decoders show instabilities between movement events; ..." (Introduction).
- Line 9, plain "...switches the trajectory decoder on and off, so the predicted finger moves only when the real one does.": now "...switches the trajectory decoder on and off, which steadies the prediction while the hand rests." (Results, Discussion).
- Line 22, "Rest stability differs: subject 1 shows a variance of 0.011 with gating and 0.03 with the multiband decoder.": now "Stability during rest differs: for subject 1 the average variance is 0.011, against 0.03 for the multiband BTTR decoder." (Results; decoder [2] is the BTTR paper).
- Line 23, "The gain suggests that high gamma marks movement against rest and that the LMP codes the trajectory itself.": now "The stability improvement suggests that high gamma distinguishes rapid finger movements from rest and that the LMP codes the trajectory." (Discussion, hedge kept).
- Line 26, headline "Same 0.56 correlation, with rest variance down from 0.03 to 0.011": now "Correlation 0.56, in line with the state of the art; rest variance 0.011 against 0.03 for subject 1" (Results).

### coauthor/published/2025/pfl-ms-npj

Source: `manuscript/main.pdf` (read through `pdftotext`) and `project.yml`.

- Line 11, "... L.M. Peeters, Y. Moreau (73 authors)": now "... L.M. Peeters, Y. Moreau".
- Line 24, "Adaptive training takes longer for four of the five strategies, 217.51 against 171.77 min for FedProx.": now "The adaptive gains cost training time: adaptive FedProx takes 217.51 min against 171.77 for baseline FedProx, 27% longer." (Results and Table 2).
- Line 33, heading "Where personalization helps, and what the comparison leaves open": now "Where personalization helps, and the limits the paper states".
- Line 38, "The federated-to-local gap shrinks with dataset size (Spearman $\rho = -0.503$, $p = 0.010$); the federated-to-centralized gap more so ($\rho = -0.761$).": now "The federated-to-local gap correlates moderately with dataset size (Spearman $\rho = -0.503$, $p = 0.010$), the federated-to-centralized gap strongly ($\rho = -0.761$, $p < 0.001$)." (Results).
- Line 39, "Fine-tuning helps intermediate-sized clients most; sparse clients risk overfitting and unstable test sets.": now "Fine-tuning gives the most consistent improvements for clients with intermediate data volumes; small clients risk overfitting and unstable evaluation." (Discussion).
- Line 45, "Federation is simulated on country partitions of one pooled registry extract, with no network, dropout or system effects.": now "Federation is simulated on country partitions, so network variability, system heterogeneity and dropout are not captured." (Discussion, limitations).
- Line 46, "...which can favour the large ones.": now "...which may favour the larger ones." (hedge kept).
- Line 47, "Calibration is not reported; the paper places the models at cohort-level use until it is.": now "Current performance may support cohort-level monitoring; calibration needs further work before high-stakes clinical decisions." (Discussion).
- Line 48, "Led by Ashkan Pirmani; A. Faes is the sixth of 73 authors.": now "Led by Ashkan Pirmani; A. Faes is a middle co-author." (`project.yml` outcome, "Co-author (middle)").

### coauthor/active/flkit

- Line 5, hook "...as an onboarding and usability problem, and bundles what a new group needs to run its first federation.": now "FLKit treats the adoption of federated learning in health and life sciences as an onboarding and usability problem, and bundles environment setup, client and server orchestration, and worked examples." (`README.md:5`, `project.yml` eli5).
- Line 8, purpose "Make it easier for medical and biology researchers to train models together on data that may not leave their institutions.": now "Lower the entry barrier to federated learning for health and life-science researchers." (`README.md:5`).
- Line 9, plain "FLKit is a ready-made kit with set-up steps, the programs that connect the sites and worked examples, so a research group can start without building it all itself.": now "FLKit is a kit with set-up steps for the environment, the programs that orchestrate the clients and the server, and worked examples." (`README.md:5`).
- Line 11, "... L.M. Peeters (10 authors)": now "... L.M. Peeters".
- Line 22, "The toolkit is public on GitHub.": now "Submitted to JMIR, under review." (`README.md:13`).

### archive/published/2017/icfp-src-poster

Source: `manuscript/main.pdf`, read through `pdftotext -layout` and on a render made with `pdftoppm -r 50 -png` into the round's scratch folder. The bar chart "Loop program variations" prints every bar value as text (Pure 100, 78.5, 35.4, 2.4, 2.3; Latent 100, 74.3, 37.4, 2, 1.9; Incr 100, 56, 62.3, 5.5, 3.8; State 100, 34, 85, 3.3, 2.3), so lines 20 and 21 stand. The N-Queens chart prints no value.

- Line 3, title "How close does optimised Eff get to native OCaml, and why do its rewrites need explicit types?": now "Can an explicitly typed core language with row-based effects make Eff's optimising rewrites less error-prone?" (poster, New Core Language: "make the source-to-source transformations less error-prone").
- Line 5, hook "The poster sets the Eff optimiser against native OCaml on loop benchmarks and N-Queens, and shows a function-specialisation rewrite that has to re-type its copy of a function.": now "The poster introduces an explicitly typed core language with row-based effects for Eff, compares optimised Eff with regular OCaml, Multicore OCaml, Handlers in Action and Eff directly in OCaml, and shows a function-specialisation rewrite that has to handle the types of its copy of a function." (Preliminary results; Research Problem).
- Line 8, purpose "Show that programs written with effect handlers can run as fast as plain code once compiled well.": now "Reduce type-checking bugs in the optimised compilation of algebraic effect handlers." (Summary).
- Line 9, plain "Removing the handlers at compile time brings the loops close to hand-written OCaml, but every removal step has to keep the program's types right.": now "Effect handlers carry a runtime penalty, so the compiler rewrites them away; each rewrite has to keep the program typable, and explicit types in the core language make that less error-prone." (Introduction; Research Problem; New Core Language).
- Line 17, "...emits regular OCaml code for effectively pure computations...": now "...identifies pure computations and emits regular OCaml code for them..." (Background: "Identify computations that are pure").
- Line 22, "N-Queens, sizes 2 to 14: Eff(PureOpt) stays within about 10% of OCaml; Handlers in Action peaks near 180%." (a reading of an unlabelled chart, ruling 8): now "The new core language builds on the calculus of Links, with a row-polymorphic type-and-effect system." (New Core Language).
- Line 23, "Edge cases still need their own optimisations.": now "Optimisations still need to be added for edge cases." (Preliminary results).
- Line 25, headline "PureOpt loops reach 2 to 5.5% of basic Eff, near native OCaml": now "An explicitly typed core language with row-based effects for optimised compilation" (Summary).

### archive/published/2017/icfp-src-abstract

Source: `manuscript/main.pdf`, read through `pdftotext`.

- Line 8, purpose "Make a compiler for effect handlers, a new programming feature, easier to build without breaking programs.": now "Make an optimising compiler for algebraic effect handlers easier to build without type-checking bugs." (Abstract).
- Line 25, headline "Proposal: explicit types so rewrites cannot break typing": now "Proposal: an explicitly typed core language to reduce bugs in optimised compilation" (Abstract: "explicitly typed in order to reduce bugs in the optimised compilation").

### coauthor/published/2017/algebraic-effects-compilation

Source: `manuscript/main.pdf`, read through `pdftotext -layout` and, for Fig. 14, on a render of page 24 made with `pdftoppm -f 24 -l 24 -r 90 -png` into the round's scratch folder. Fig. 14 prints every bar value as text above its bar, with the legend order Basic, Opt, Pure, PureOpt, Native; the four lines of the "Loop run time" column match it (Opt is the rewriting bar, Pure the purity-aware bar), so they stand.

- Line 5, hook "Handler-based programs run far slower than hand-written code; ...": now "Most handler-based programs are still much slower than hand-written code; ..." (Abstract).
- Line 22, "Rewriting or purity-aware code alone narrows the gap; both together reach 1x to 1.5x and remove every trace of handlers and the free monad.": now "Rewriting or purity-aware code alone has varying success in narrowing the gap; only both together are competitive with hand-written OCaml (1x to 1.5x), and they remove every trace of handlers and the free monad." (Section 8.1).
- Line 23, "...is the fastest of the OCaml-based effect systems tested and close to hand-written OCaml.": now "...is consistently the fastest of the OCaml-based effect systems tested and competitive with hand-written OCaml." (Section 8.2).
- Line 33, heading "Benchmarks and limits": now "Benchmarks, design choices and future work"; line 44, column "Limits": now "Design choices and future work" (the paper presents these as design choices and future work, Sections 4, 7.3 and 9).
- Line 47, "Nested handlers are left to future work; every higher-order function is compiled as taking impure arguments.": now "Every higher-order function is compiled as taking impure arguments; optimising complex patterns such as nested handlers is future work." (Section 7.3; Conclusion).

### archive/failed/fed-faithful-ecg

Sources: `README.md`, `CLAUDE.md`, and `code/results/pilot_mechanism/summary.md`, which `README.md:33` and `CLAUDE.md:6` name (the synthetic-pilot numbers of slide 2 are that file's table). The FedProx row comes from `code/results/fed_faithfulness/summary.md`, which neither `README.md` nor `CLAUDE.md` names, so it goes (ruling 5).

- Line 9, plain "...but on real ECGs both hospitals learned the same parts, so nothing scrambled.": now "...but on real ECGs it did not, likely because both hospitals' heartbeats share the same basic shapes." (`README.md:5`, "Likely reason", hedge kept).
- Line 18, "Arms: centralized, FedAvg, aligned averaging (FedMA-style slot matching) and FedProx.": now "Arms: centralized, FedAvg and aligned averaging (FedMA-style slot matching); FedProx and MOON are benchmarks still to run." (`README.md:72`).
- Line 22, "Aligned averaging recovered nothing (0.834, 0.107, 0.341); FedProx 0.788, 0.119, 0.613.": now "Aligned averaging recovered nothing (0.834, 0.107, 0.341), because there was no gap." (`README.md:5`).
- Line 25, headline "No-go: real ECG components align across silos on their own": now "No-go: on real ECG, federated averaging did not degrade faithfulness" (`README.md:3`; `project.yml` outcome).
- Line 38, "Each client used random unrelated prototypes, a mismatch real ECG silos do not have.": now "The pilot gave each client random unrelated prototypes, which overstated the problem." (`README.md:5`).

### ideas/xsub-ecog-framework (ruling 3)

Sources: `README.md` and `project.yml`. The deck was rewritten whole with Write. It now states the idea as one cross-subject ECoG transfer framework across tasks and datasets, its gate and what it would measure; it names no student method as its mechanism, gives no student result as its status, and names nothing of ward-bttr-crosssubject.

- Line 3, title "A behavior-aligned transfer framework for cross-subject ECoG decoding across non-corresponding grids": now "Does one cross-subject ECoG transfer framework hold across tasks and datasets?".
- Line 4, sub "Does a minimal-calibration transfer mechanism hold across behaviors and datasets?": now the manifest title, "A Behavior-Aligned Transfer Framework for Cross-Subject Decoding across Non-Corresponding ECoG Grids".
- Line 5, hook "...a behavior-aligned spatial filter with a shared decoder is a candidate general framework, shown so far on one finger-flexion task.": now "...the idea is one interpretable, minimal-calibration cross-subject transfer framework, tested across behaviors and datasets." (`README.md`, "What it is and why", "The bet").
- Line 8, plain "Each patient gets a private translator from their own electrodes into a shared set of movement-defined signals; one decoder trained on earlier patients reads those signals for everyone.": now "One way of moving a decoder from earlier patients to a new one, tested on several kinds of movement and on several datasets, with only a little calibration for each new patient.".
- Lines 14 and 15, the per-subject spatial filter and the shared seq2seq decoder: removed. Now line 14 "Test minimal-calibration cross-subject transfer across non-corresponding grids on BCI Competition IV dataset 4 (3 subjects, finger flexion), which tests dataset generalization." and line 15 "Then a different task: gesture, movement direction or another Kai Miller-library paradigm." (`README.md`, Data and Next).
- Line 16, "Directions: more tasks (gesture, movement direction), more public ECoG cohorts, and self-supervised donor pretraining for zero-shot transfer.": now "Directions: more public ECoG cohorts, and self-supervised donor pretraining to lift zero-shot transfer while staying interpretable.".
- Lines 19 to 21: the gate line stays (now line 19); "Target: competitive transfer on at least 2 more tasks and 1 more dataset." becomes "What it would measure: competitive minimal-calibration cross-subject transfer on at least 2 more tasks and 1 more dataset." (line 20); the novelty-check line moves to line 21.
- Line 22, mechanism "Behavior-aligned spatial filter plus shared seq2seq decoder": now "Minimal-calibration cross-subject transfer tested across tasks and datasets".
- Line 23, headline "Idea: one task so far; does it generalize?": now "Idea: one cross-subject ECoG framework across tasks and datasets".

### ideas/serial-ecg-af (ruling 4)

- Line 12, chip "Single-ECG bar" value "BTTN 0.762 (provisional), Raghunath 0.85 at 1 yr": now "Attia 0.87 near-term, Raghunath 0.85 at 1 yr" (`README.md:3`). BTTN stays named as the model the project keeps (lines 15 and 18).

### coauthor/stopped/individual-reference-intervals (ruling 9)

Source: `project.yml`, which is the only file besides `present/`. The deck was rewritten whole with Write.

- Line 5, hook "...this project asked whether a range built from the patient's own past values gives machine learning a better signal for readmission or progression.": now "The project explored combining individual, personalized clinical reference intervals with machine learning to predict clinical events such as readmissions or disease progression, in place of population-wide normal ranges." (`project.yml` eli5).
- Line 8, purpose "Warn earlier that a patient is heading for a hospital readmission or for worse disease.": now "Predict clinical events such as hospital readmissions or disease progression.".
- Line 9, plain "Ask whether a test result is normal for this person, judged against their own history, and let a model learn from that answer.": now "Judge a test result against a range set for this patient, in place of one normal range for everyone, and let a model learn from that.".
- Line 20, "The project folder holds only its manifest: no data, code or result was kept.": now "The bet was that per-patient baselines could sharpen event prediction." (`project.yml` eli5).
- Line 21, mechanism "Per-patient baselines as features for event prediction": now "Per-patient reference intervals combined with machine learning".
- Line 22, headline "Stopped in 2024 before a full paper for IEEE JBHI": now "Abandoned; it was targeted at IEEE JBHI, 2024" (`project.yml` outcome).

### ideas: fl-privacy-auditing, hccnet-fl-sweden, hccnet-pathology, quantum-tensor-fl, ssm-longitudinal

Each deck said "Nothing has run"; each source gives the stage as "gate-pending" (line 3 of each `README.md`).

- fl-privacy-auditing line 18, "Nothing has run; existing membership-inference attack code is reusable.": now "Gate pending: a novelty lit-check to fix the auditing angle; the attack code is reusable." (`project.yml` status line).
- hccnet-fl-sweden line 19, "Nothing has run; the Link<o diaeresis>ping data-use, ethics and GDPR agreement is the critical path.": now "Gate pending; the Link<o diaeresis>ping ...".
- hccnet-pathology line 20, "Nothing has run; the design is the transcribed architecture_v3.": now "Gate pending; the design is the transcribed architecture_v3.".
- quantum-tensor-fl line 19, "Nothing has run, and neither branch is chosen.": now "Gate pending: a lit-check decides between the two branches." (`README.md:3`, "Decide A vs G after a lit-check").
- ssm-longitudinal line 19, "Nothing has run; no new data and no collaborator gate are needed.": now "Gate pending: beat the HCCNet baseline; no new data and no collaborator gate are needed." (`project.yml` status line).

### archive/stopped/algebraic-subtyping

- Line 8, plain "A type then says both what a value is and which effects it may trigger, and a more specific type can stand where a general one is asked for.": now "Add effect information to Dolan's algebraic subtyping, which gives a type-and-effect system for algebraic effects and handlers." (`project.yml` eli5).

### coauthor/published/2023/ecog-frequency-features

Source: `manuscript/main.pdf` through `pdftotext`, and `project.yml`.

- Line 5, hook "Finger decoders usually take the whole ECoG spectrum; ...": now "Comparable prior work decodes fingers from the entire ECoG spectrum; ..." (Abstract).
- Line 9, plain "...follows the finger better and holds still at rest.": now "...follows the finger better and makes fewer false movements at rest." (Abstract: "erroneous predictions during rest were demoted").
- Line 39, "...most of all for thumb and index.": now "...most of all for thumb, index and pinky." (caption of Figure 7(c)).
- Line 46, "LMP cannot tell movement from rest, nor a cued finger from co-activation by its neighbours.": now "LMP falls short in discriminating movement from rest, and a cued finger from involuntary co-activation by other fingers." (Discussion).

### active/novel-math-primitives

- Line 5, hook "...this scan maps candidates that pass the first two on paper.": now "...this scan maps about 24 ML-empty survivors, each with a first idea for its bridge and its separation, ranked with medical fit." (`project.yml` eli5, latest).
- Line 43, "No candidate has a built bridge or a proved property yet.": now "Chip-firing and sandpile dynamics, the first build candidate, was spun out as the sandpile-operator project." (`project.yml` results).

### archive/failed/ms-lipid-handshake

- Line 30, hook "...is most likely ambient RNA contamination, and the uptake rise (p = 0.013) tracks general activation markers.": now "...is likely ambient RNA contamination, and the uptake rise (p = 0.013) may track general myeloid activation, since its genes are activation markers." (`README.md:82-83`, hedges kept).
- Line 34, "...a parameter-matched sweep leaves BTD no real edge over CP.": now "...a parameter-matched sweep shows BTD's edge over CP is negligible." (`README.md:84`).

### archive/published/2022/block-term-tensor-regression

Source: `manuscript/bare_jrnl.tex`.

- Line 33, hook "BTTR and HOPLS differ significantly only on subject 3, where ACCoS-gBTTR wins; against the Riemannian LightGBM decoder BTTR leads on subject 1, trails on subject 2 and ties on subject 3 (0.67 against 0.6775).": now "On test data ACCoS-gBTTR performs better than ACE-gBTTR and HOPLS for subject 3; against the Riemannian LightGBM decoder ACE-BTTR performs better for subject 1, worse for subject 2 and equally for subject 3 (0.67 against 0.6775)." (`bare_jrnl.tex:836, 850`).
- Line 35, panel explain "gBTTR and HOPLS follow the timing of each flexion but undershoot its peak." (a chart reading): now "Actual and predicted flexion amplitudes (z-scores) over time; of the BTTR versions only the generalized gBTTR is shown." (caption, `bare_jrnl.tex:824`).
- Line 37, "...on training data gBTTR scores lower, so it overfits less.": now "...on training data gBTTR scores lower, so it seemingly limits overfitting, mainly for ACCoS-BTTR." (`bare_jrnl.tex:840`).
- Line 38, "ACE-BTTR beats LSTM, AM, RF and LARS on average for every subject; per finger, thumb and index show no significant gap to LSTM.": now "ACE-BTTR differs significantly from LSTM, AM, RF and LARS on the average for every subject; per finger, thumb and index show no significant difference to LSTM." (`bare_jrnl.tex:848`).

### active/eeg-saad-challenge

- Line 5, hook "Most attention-decoding results are single-dataset and deep models exploit dataset shortcuts; this benchmark ...": now "The challenge's own framing is that most attention-decoding results are single-dataset and that deep models exploit dataset-specific shortcuts; the benchmark ..." (`README.md:7` gives it as the challenge's framing).
- Line 19, "...spatial decoding can ride on eye gaze.": now "...the organizers warn that spatial decoding can ride on eye gaze." (`README.md:55`).

### active/linfoot-estimator

- Line 27, panel explain "...and 8 carry strong dependence a rank correlation nearly misses.": now "...and 8 carry a label above 0.4 while a rank correlation reads under 0.25." (`README.md:71`).
- Line 51, "The released R code builds 17 bins where the paper says 18, leaving three inputs constant; the twin application waits on the SDU coauthors' data, its script verified on surrogate pairs." (a claim that the preprint and its code disagree): now "The twin data sit with the SDU coauthors; the twin-application script, which they can run with this model, is verified end to end on surrogate pairs." (`README.md:5, 207`).

The R-code bin count is not written to a private README section: the preprint's own text is not in the project folder (`ls manuscript` holds only the project's drafts), so it was not checked against the paper; the fault is already recorded in `README.md:114` and `:244`.

### active/loewner

- Line 24, "No structured derivative algorithm, efficiency advantage or perturbation bound has been derived yet.": now "Novelty and usefulness remain unestablished; there is no implementation, manuscript or selected venue." (`README.md:3`).
- Line 39, "...Loewner coordinates do not enlarge the rational family...": now "...need not enlarge..." (`README.md:68`, hedge kept).

### active/sandpile-operator

- Line 26, panel explain "All three reach a similar region, but diffusion smears the mass and the CNN leaks past walls; the sandpile error stays low." (a chart reading): now "Arrival-time maps on top, final mass error below: all models reach a broadly similar region, while diffusion smears the mass magnitude." (`README.md:27`).
- Line 38, "Stage 0 proves representational capability and inductive bias over smooth diffusion, and nothing about real processes.": now "Stage 0 proves representational capability and an inductive-bias advantage over smooth diffusion, not real-world superiority." (`README.md:31`).

### archive/failed/faithful-block-term-layer

- Line 26, headline "No-go: faithfulness and nonlinear capacity cannot both hold": now "No-go: a clean guarantee gives up the nonlinear capacity BTTN needs" (`README.md:23`).

### archive/failed/jacobian-coupled-blockterm-dp

- Line 22, "Below $\rho$ 0.3 the whitened floor is 16 to 18% lower...": now "...is about 16 to 18% lower..." (`README.md:37`).

### archive/phd/phd-thesis

Source: `manuscript/chapters/`.

- Line 36, "Among neural networks, LSTM-NUE detects directed connectivity best; ...": now "Among the neural networks, LSTM-NUE obtains better sensitivity and precision; ..." (`chapter-3/chapter-3.tex:338`).
- Line 42, "BTTR trails LightGBM on subject 2 (0.46 against 0.493), and its accuracy drops on rapid finger repetitions, where the ECoG-to-trajectory relation turns nonlinear.": now "LightGBM performs better than BTTR for subject 2 (0.493 against 0.46); the introduction names rapid finger repetitions, hand gestures and sustained flexions as tasks where state-of-the-art decoders are still inadequate." (`chapter-4/chapter-4.tex:377`; `introduction/introduction.tex:93`).
- Line 44, "Finger abduction, which sign language needs, has not been decoded from ECoG yet.": now "...has not yet been attempted from ECoG." (`conclusion/conclusion.tex:98`).

### archive/published/2016/bachelor-network-ids

Source: `manuscript/main.pdf` through `pdftotext`.

- Line 23, "Naive Bayes, the linear SVM and the one-class SVM do little better than the random baseline's binary F of 0.465." (the one-class SVM's binary F is 0.1275 to 0.4017, Table 11.19, below that baseline): now "Naive Bayes barely beats the random baseline's binary F of 0.465 across datasets; the one-class SVM cannot properly define the boundaries of its class." (Sections 11.3 and 11.7).
- Line 45, "Country of origin changed nothing, likely because the data came mostly from one country.": now "Country of origin had little impact, which could be because the data came mostly from one country." (KNN evaluation, hedge kept).
- Line 47, "Labelled training data was the main bottleneck.": now "Finding labelled data was a problem during the experiments." (Section on the datasets).

### archive/published/2018/masters-algebraic-subtyping

- Line 26, headline "Principal types with effects; faster on 3 of 5 benchmarks" (a count the thesis does not state): now "Principal types with effects; faster than subtyping except on Parser and Queens" (Section 6.5.1: "the performance of EffCore is superior ... There is an exception for the Parser and Queens programs").

### archive/published/2021/source-localization

Source: `manuscript/main.tex`.

- Line 34, panel explain "The two curves cross near $\kappa = 0.08$, where neither metric improves without the other worsening." (a chart reading): now "The Pareto-optimal solution is at the intersection, $\kappa \approx 0.08$, where neither metric improves without the other worsening." (caption, `main.tex:179`; `main.tex:234`).
- Line 36, "...Sparse eLORETA and BC-VARETA agree and are tighter than eLORETA.": now "...no notable differences between Sparse eLORETA and BC-VARETA, and the source space reduction shows against eLORETA." (`main.tex:260`).
- Line 37, "...ERD in contralateral M1 and VLPFC...": now "...ERD in contralateral M1 and bilateral VLPFC..." (`main.tex:287`).
- Line 39, "LCMV wins on simulated correlation yet scatters its dipoles; some sources were mislocated while their signals still correlated well.": now "LCMV yields the best simulated correlation yet its dipoles are dispersed; some sources were not accurately located while their signals still correlated well." (`main.tex:148, 182, 337`).

### archive/published/2022/connectivity-iris

- Line 47, "One dataset trains in 1048 s for Conv2D with two predictors; NUE makes LSTM-NUE among the slowest.": now "One dataset trains in 1048 s for Conv2D with two predictors." (the runtime ranking is only in the bar chart of Figure 12, which prints no value as text).

### archive/published/2026/erp-signatures

- Line 19, "...which is conservative when the within-participant dependence is positive.": now "...which is conservative when the within-participant correlation is non-negative." (`README.md:24`).

### archive/published/2026/glassbox-decision-pipelines

Source: `manuscript/main.tex`, `README.md`, `results/age_control/within_code15_seed0.json`.

- Line 9, plain "The large models cannot tell how old the patient is; adding the age...": now "The large models do not keep the patient's age in what they extract; adding the age as one extra number improves every one of them." (`main.tex:94` "the frozen embeddings do not preserve it", `main.tex:153` "it improved every encoder").
- Line 39, "The MIMIC severe-EMG edge (+0.010) and the clean transport edge (+0.017) change sign across fits.": now "On MIMIC the severe-EMG difference, +0.010, covers zero and flips sign across fits; CODE-15 to MIMIC transport trails, 0.726 against 0.745 clean." (`main.tex:66, 123`; `README.md:125` records zero sign flips for the clean transport comparison, so that half had no source).
- Line 48, "Synthetic corruptions, one fixed split, two datasets, one endpoint; the printed 0.160 is 0.159 measured.": now "Synthetic corruptions, one fixed split, two datasets, one endpoint." (the removed clause says the paper prints a wrong value; it goes to the private README section, ruling 2).

### archive/published/2026/hccnet-fl

Source: `manuscript/sections/*.tex`, `manuscript/tables/*.tex`, `README.md`.

- Line 24, "...CAF+FedBN lowers ECE from 0.118 to 0.074.": now "...CAF+FedBN lowers ECE from FedAvg's 0.118 to 0.074." (`5_results.tex:5`; 0.118 is FedAvg's ECE, `tables/main_results.tex:12`, which the old line left unnamed).
- Line 49, "The harness in `code/` is an independent re-implementation run only on a synthetic cohort; the published numbers were not re-run.": now "The harness in `code/` is an independent re-implementation, not the pipeline that produced the published numbers, and has not been re-run on the cohort." (`README.md:25`; no source says the harness ran only on synthetic data).

### coauthor/published/2016/chi-purpose-centric

Source: `manuscript/main.pdf`.

- Line 5, hook "Earlier work maps an object's shape to a digital input, a bottle cap to a knob; purpose-centric appropriation gives each object a virtual role that copies its real-world function.": now "Earlier work maps the affordances of an everyday object to an analogous digital input, a bottle cap to a knob; purpose-centric appropriation gives each object a virtual rendition that mimics its real-world purpose and function." (introduction: "mapping affordances offered by objects to analogous digital input", "virtual renditions that mimic actual purpose and function").
- Line 9, plain "...players know what it will do before they try it.": now "...players can recognise what it will do before they try it." (the paper: "can help users in immediately recognizing, or envisioning, the effect").
- Line 18, "...a physics engine reproduces their real-world forces...": now "...a physics engine takes each object's physical characteristics into account..." (Implementation: "takes into account physical characteristics and nuances of each everyday object").

### coauthor/published/2017/http2-best-practices

Source: `manuscript/main.pdf`.

- Line 5, hook "Earlier HTTP/2 studies contradict each other, often because each uses one server, one browser and one metric; ...to separate protocol effects from implementation effects.": now "Earlier HTTP/2 studies contradict each other, and most use a single server package, browser, network setup and metric; the Speeder framework runs many setup permutations to tell protocol behaviour from implementation behaviour." (Section 2: the authors give the single-tool setup as "one of the reasons" they believe, which "often because" overstated).
- Line 9, plain "...and where it is slower the browsers and servers are to blame.": now "...and where it is slower the cause is mainly inefficient software." (abstract: "mainly caused by inefficiencies in implementations").
- Line 22, "With 30 large images, sharding over 4 hosts improves HTTP/1 by over 50% in bad networks, and HTTP/2 also gains.": now "With 30 large images, sharding over 4 hosts can improve performance by over 50%, especially in bad networks, and HTTP/2 also profits significantly." (Section 4.3.1).
- Line 24, "Most HTTP/2 slowdowns trace to browser and server implementations; the single TCP connection hurts under heavy loss.": now "HTTP/2 underperforms mainly through inefficient implementations; with large files, packet loss impacts its single connection more." (abstract; Section 4.1.1 on Figure 2(c); the contributions state that in most cases bad network conditions do not impact h2 much more than h1, so the general loss claim had no source).

### coauthor/published/2023/coordinated-fingers-ecnr

Source: `manuscript/main.pdf`.

- Line 9, plain "...the signal does show reliably when a movement is about to start.": now "...the slow brain signal can show when a movement starts." (Conclusion: "The onset of finger movement is possible to be detected with MRCP features"; "reliably" has no source).

### coauthor/published/2023/modulation-lmp-bci

Source: `manuscript/main.pdf`.

- Line 9, plain "...together they stop the decoded finger from jittering at rest.": now "...together they make the decoded finger steadier at rest." (Results: lower variance during rest).
- Line 22, "High-gamma activity separates rapid finger movements from rest, while the LMP codes the trajectory.": now "The stability gains suggest that high-gamma activity separates rapid finger movements from rest, while the LMP codes the trajectory." (Discussion keeps "suggest").
- Line 25, headline "Gamma gating holds correlation at 0.56 and cuts rest variance from 0.03 to 0.011": now "Gamma gating: correlation 0.56, and rest variance 0.011 against 0.03 for participant 1" (the variances are for subject 1, and 0.03 is decoder [2]'s, not a before value of the same decoder).

### coauthor/published/2025/editorial-bigdata-ai-ms

Source: `manuscript/main.pdf`.

- Line 9, plain "...list the problems the field must still solve before AI reaches the clinic.": now "...list the open issues researchers will still have to solve." (Conclusion: "researchers will have to solve some open issues").
- Line 23, "The editorial reports no new data or experiment.": now "The Topic gathers reviews, perspectives and original research articles." (Introduction; the removed line is a description the editorial does not give).

### coauthor/published/2025/proprioception-exoskeleton

Source: `manuscript/main.pdf`.

- Line 5, hook "The feedback from an exoskeleton moving the fingers dominates sensorimotor EEG, so imagining the movement on top of it adds little a decoder can find.": now "An exoskeleton moving the fingers evokes strong alpha and beta desynchronization in sensorimotor EEG, and the EEG is then similar whether or not the user also imagines the movement." (abstract; Discussion: "brain activations are similar regardless of whether the subject imagines a movement").
- Line 9, plain "...looks almost the same whether or not...": now "...looks similar whether or not..." (same passage).
- Line 25, mechanism "Proprioceptive feedback swamps the motor-intention signal in sensorimotor EEG": now "Exoskeleton-induced proprioceptive ERD set against motor-imagery ERD" (Section IV; "swamps" is framing the paper does not use).

### ideas/btd-autoencoder

- Line 15, "The decoder is conditioned on the dataset, so the latent becomes batch-invariant.": now "The decoder is conditioned on the dataset to get a dataset-invariant latent." (`README.md`, Method, Part A item 3, states the aim; the old line stated it as an outcome).

### ideas/fedbtd

- Line 8, plain "...average without lining them up and the result is mush.": now "...average without lining them up and mismatched pieces get mixed." (`README.md`: naive FedAvg "averages mismatched, misrotated, misscaled blocks").
- Line 19, "What remained open was only the block-term-specific version, below the bar for a top-tier methods venue.": now "The pre-emption puts the idea below the bar for a top-tier methods venue." (`README.md` opening paragraph; the "only the block-term-specific version" clause belonged to the personalization split, not to what remained open).

### ideas/florank-personalization

Source: `README.md`, `notes/ectrims2025-florank-poster.pdf`.

- Line 5, hook "Under site heterogeneity a shared federated model fits no hospital well; FLoRank showed a per-center low-rank adapter fixes that on tabular MS data, and the open question...": now "Under clinical site heterogeneity personalization is essential; FLoRank's per-center low-rank adapter beat FedAVG and plain LoRA on tabular MS data, and the open question..." (poster Conclusion: "significantly outperformed both FedAVG and the original LoRA approach", "Personalization ... is therefore essential"; "fits no hospital well" and "fixes" have no source). The F1 and AUC-PR values with their SDs on line 21 match the poster's Conclusion as printed text.

### ideas/hccnet-fl-sweden

- Line 5, hook "...and the two sites do not share an MRI protocol; ...so each site has to contribute everything it has.": now "...and the two sites are expected to hold different MRI sequence sets; ...so each site has to use everything it has." (`README.md` Method: the sites "will have different available sequences"; Next item 1: "confirm the protocols"; Why a positive: "each uses everything it has").

### ideas/modality-dropping-btf

- Line 5, hook "...and imputation or zero-filling invents data they do not have;...": now "...and imputation or zero-filling fills in data they do not have;..." (`README.md`: "no zero-filling, no imputation"; "invents" is framing the README does not use).

### ideas/paleogenomics-tensor

- Line 8, plain "...split the cube into a few interpretable patterns, each a strand of ancestry over time.": now "...split the cube into a few interpretable patterns of population structure and admixture." (`README.md`: "recover population structure and admixture components").

### ideas/serial-ecg-af (full read)

- Line 23, "...the Gruwez cohort, delivered 2026-07-16, is checked for serial ECGs, and the work stays on MIMIC-IV-ECG if it has none.": now "...the Gruwez cohort, delivered 2026-07-16, is to be checked for serial ECGs; the work stays on MIMIC-IV-ECG if it has none." (`project.yml` next: "Check if the Gruwez cohort ... carries serial ECGs"; the old wording read as a check already done).

### manuscripts/btfno

Source: `manuscript/main.tex`, `README.md`.

- Line 40, "The code trains profiles factorized over the two frequency axes while the theorem counts free profiles over all $K$ modes, and the $L=1$ arm splits shared and routed parameters differently from the CP-expert arm.": now "Scope as the paper states it: an internal factorization comparison at about 670k parameters on one benchmark, not a state-of-the-art benchmark." (`main.tex:300`; the removed line is a claim that the paper and its code disagree, which ruling 1 bars from a slide; the fault went to the README private section, see Ruling 2).

### manuscripts/covert-applied

Source: `manuscript/main.tex`, `README.md`.

- Line 26, headline "Parity with centralized fitting at 24x less communication": now "Parity with centralized fitting, and 24x less communication than masked dense tensors" (`main.tex:899`: Route B "communicates 24x less (0.20 MB per round against 4.8 MB)" than Route A; the old headline left the comparison open and could be read as less than centralized fitting).
- Line 32, title "What the design buys, and what the multilinear structure does not": now "What the design buys, and the limits on accuracy" (`main.tex:930-936`: the coupled value of $L>1$ is interpretability at no accuracy cost, and on the ECG party alone AUROC rises from 0.625 to 0.637; the old title said the multilinear structure buys none of it).
- Line 43, heading "No accuracy gain from multilinearity": now "Accuracy limits and scope" (same passage; the paper states flat accuracy in $L$ on the full federation only, and the column also holds the fusion and scope items).

### manuscripts/covert-theory

Source: `manuscript/main.tex`.

- Line 24, "First convergence-and-utility theory for DP block-coordinate descent...": now "To the authors' knowledge, the first convergence-and-utility theory for DP block-coordinate descent..." (`main.tex:73`: "To our knowledge this is the first"; the hedge is kept).
- Line 45, "The $m$ and $\log(1/\delta)$ factors match only in the per-coordinate-sensitivity regime; under the joint $\ell_2$ clip they differ.": now "The match in $m$ holds only in the per-coordinate-sensitivity regime; under the joint $\ell_2$ clip the bounds need not be tight in $m$." (`main.tex:626-628`: under the joint clip the $m$-dependence "need not be tight (a gap of up to $m$)" and "is not claimed"; the paper does not state that they differ).

### manuscripts/dries-bttr-ecg

Source: `manuscript/main.tex`, `README.md`.

- Line 5, hook "The models that find atrial fibrillation in a sinus-rhythm ECG are deep networks on private cohorts...": now "...are usually deep networks on private cohorts..." (`main.tex:53`: "Models that read it are usually deep networks"; the hedge is kept).
- Line 41, "...RR pseudo-leads lower the score (0.471 and 0.548);...": now "...RR pseudo-leads are dead weight in sinus-rhythm records (0.471 and 0.548);..." (`README.md:27` gives `median_beat_rr` 0.471 / 0.548, `README.md` Dead-ends: "dead weight in afsr"; the comparison "lower" was not stated for these values).

### manuscripts/fed-multicellular-immune

Source: `manuscript/main.tex`, `README.md`.

- Line 39, "Parity elsewhere: SLE...": now "Comparable elsewhere: SLE..." (`main.tex:55`: "and is comparable elsewhere").
- Line 47, "...and needs about $10^3$ donors.": now "...and needs about 900 donors at $\varepsilon=4$ for a 30-gene program." (`README.md:40`: "recovery needs n ~ 900 donors @ eps=4 with a 30-gene program, ~4700 at the full gene set"; "about $10^3$" was a rounding the source does not give).

### manuscripts/hccnet-revision

Source: `manuscript/sections/`, `manuscript/tables/`, `README.md`.

- Line 28, headline "...with pre-training doubling AUPRC": now "...with pre-training raising AUPRC by 106.6%" (`sections/4_experiments/d_results.tex`: "the largest average improvement of 106.6% in AUPRC"; "doubling" is a reading the paper does not give).

### manuscripts/meseret-cirrhosis

Source: `manuscript/main.tex`.

- Line 29, headline "Competing-risks models recover the true transplant risk at Spearman 0.90 to 0.92; random forests reach 0.56": now "Cause-specific Cox and Fine-Gray rank the true transplant risk at Spearman 0.92 and 0.90; random forests reach 0.56" (`main.tex:31` and `:295` give the two values at $n=418$; the range 0.90 to 0.92 was not stated, and the paper's own range, 0.90 to 0.99, spans all $n$ and includes multinomial logistic regression).
- Line 43, "Complexity gains grow with sample size: up to +0.014 at about 2,000 patients and +0.046 on SUPPORT ($n$ = 8873).": now "On three single-event datasets complexity gains are consistent with a sample-size pattern: +0.008 on METABRIC ($n$ = 1904), +0.014 on GBSG ($n$ = 2232), up to +0.046 on SUPPORT ($n$ = 8873)." (`main.tex:200`: "consistent with a sample-size-dependent pattern", with the three datasets and their values; "about 2,000 patients" was not stated).

### Decks read in full against their sources with no statement the rule bars

`find projects -path '*/present/main.md' | wc -l` in the hub worktree: 95. The 66 decks with an entry above were changed; the other 29 were read in full against their sources and left as they are:

- archive/published/2018/masters-eeg-infotheory, archive/published/2026/dongho-ecg-clustering;
- ideas: adapter-format-theory, asthma-geo-tensor, attention-scoped-instructions, block-term-nca, brecht-fl-partitioning, cirrhosis-digital-twin, clinical-ai-eval-artifacts, concept-bottleneck-hcc, conformal-tensor-factors, ecg-af-fair, engram, faithful-interpretability-position, fed-duplication-limits, fed-neural-operators, federated-protocol-agents, fedlink, harmonop, multiway-biosignal-fm, neurosde, pathology-tensor-mil, physics-tensor-hcc, strokeop;
- manuscripts: bt-operator-theory (every value against `main.tex`), bttd-source-eeg (the top-K 1.6 of 3 is the dead end `project.yml` and `CLAUDE.md` state), bttn-incident-af (every value against `main.tex`, `README.md` and `RESULTS.md`), raw-pls (every value against `main.tex` and `README.md`, the readout rank $r=6$ at `main.tex:340`, the dead targets at `RESULTS.md:15` and `:36`, the four external datasets at `README.md:88`), ward-bttr-crosssubject (every value against `body.tex`, the BTTR and scalp-EEG values at `README.md:37` and `:47`).

## Ruling 2: the known issues of a paper, kept privately

Each fault below was checked against the paper itself and holds; it is written at the end of the project's `README.md` in the brief's heading and note text, and no deck takes anything from it. The eight new files start with `# <the project's title from project.yml>` and a blank line; the three existing files (glassbox-decision-pipelines, btfno, ecg-readable-substrate) got the section at their end and changed nowhere else.

| Project | Fault written | What showed it |
|---|---|---|
| go-bttr | Utrecht table: subjects 2, 4 and 5 carry the same mean and SD for every finger and method | `manuscript/main.tex:219-249`, e.g. `:226` |
| abduction | Text says no thumb abduction sensor; the glove figure lists one | `main.tex:209`, `:293`; `manuscript/dataglove.png` |
| abduction | Raw-signal legend names index-middle; caption names thumb-index, subject 2, task 2 | `manuscript/raw_signal.png`; `main.tex:219` |
| abduction | "Significantly outperforms on all pairs"; 12 of 40 baseline cells unmarked | `main.tex:211`; table `main.tex:238-265` |
| fbttr-strategies | Caption reads the colour as Pearson correlation; colour bar runs from -5 to 20 | `manuscript/latex/main.tex:435`; `model.png` |
| fbttr-strategies | "Centralized BTTR" rows repeat the eBTTR rows of the main tables | `main.tex:524, 546, 568` against `:446, 469, 490` |
| fermat | Hybrid FBTTR row equals the fully federated row, 0.872 and 0.772 | `admin/conference/main_work.tex:478-480` |
| fermat | Text names only FedAdagrad and FedProx non-significant; table marks FedProx significant and leaves FedYogi unmarked | `main_work.tex:468`; `:505-532` |
| fermat | ECoG case study gives no split of the recordings into clients | `main_work.tex:315-352` |
| hcc-modality-poster | Every AUROC is a 5-fold, 3-seed mean with no SD or interval | `manuscript/main.pdf`, render `hccposter-1.png` |
| hcc-modality-poster | Results table has no DCE single-group column; DCE alone only in the Single Modality chart (0.780) | same render |
| connectivity-motor-imagery (draft heading) | Granger Causality, Information Theory, Experimental setup and Discussion are headings with no text | `manuscript/main.tex:56, 60, 131, 162` |
| connectivity-motor-imagery | Recovered $x_1$ carries the lag-1 $x_2$ term twice, 0.14 and 0.2 | `main.tex:154` |
| abstract-bci-meeting-2021 | Estimated $x_1$ carries the lag-1 $x_2$ term twice, 0.14 and 0.2 | `manuscript/main.tex:52` |
| chi-household-survival | No user study or evaluation; the Conclusion's gameplay claim rests on no measurement | `manuscript/main.pdf` sections |
| ecg-readable-substrate | Head-to-head and transfer tables compare a model with age (and sex) to probes without it; the equal-input rerun is not reported | `manuscript/main.tex:127-150`, `:159-181`; `README.md:90` |
| glassbox-decision-pipelines | Largest age gain printed as +0.160; measured 0.15917, which rounds to 0.159 | `main.tex:27, 38, 94, 153, 161`; `results/age_control/within_code15_seed0.json` |
| btfno | $c_r$ stated as free over all $K$ modes (Theorem 1 counts on it); the experts factorize it over the two frequency axes | `manuscript/main.tex:90`; `code/core/moe_bt.py:50`, `:53` |
| btfno | The $L=1$ arm `(8, 57, 1, 24)` and the CP arm `(8, 32, 10, 230)` split routed and shared parameters differently; reported as matched | `code/campaigns/gen_gap_theory/run_pdebench_theory.py:87-88`; `main.tex:300` |

Faults dropped, with why:

- go-bttr line 32, "the caveats in the reported tables": no fault of its own; it pointed at the identical subject columns, written above.
- hcc-modality-poster line 36, the single-group chart's values "equal the pretrained encoder-head row": on the render `hccposter-1.png` the Single Modality chart (DWI 0.808, T1-IOP 0.753, T2W 0.738, all four 0.844) and the pretrained "Enc. heads + shared" row (0.808, 0.753, 0.738, 0.844) are the same single-group and all-four trainings shown twice, and the poster does not present them as different runs, so the equality is no fault.
- http2-web-performance line 48, "Three of the figures are reused from the authors' earlier paper": the paper states it itself in three captions, "Image taken from our previous work [18]" (`pdftotext -layout` of `manuscript/main.pdf`, lines 634, 685 and 1414 of the text), so it is a disclosure and no fault. http2-web-performance therefore gets no `README.md`, the one project of the brief's nine without one.
- linfoot-estimator, the R code's 17 bins against the paper's 18: the preprint's text is not in the project folder (`ls manuscript`: `archive`, `results`, `work`), so the fault was not checked against the paper; `README.md:114` and `:244` already record it.

## Ruling 3: xsub-ecog-framework in its own terms

The deck was rewritten from its `README.md` and `project.yml` (the entry above lists every line). `grep -n -i 'ward\|behavior-aligned\|spatial filter\|seq2seq\|Ceyssens'` over its `main.md` hits only line 4, the `sub`, which is the manifest's own title ("A Behavior-Aligned Transfer Framework for Cross-Subject Decoding across Non-Corresponding ECoG Grids"); no student method, student result or ward-bttr-crosssubject item is on the slide.

## Ruling 4: serial-ecg-af chip

The "Single-ECG bar" chip now reads "Attia 0.87 near-term, Raghunath 0.85 at 1 yr" (`README.md:3`); `grep -n -i 'BTTN\|0\.762'` over the deck hits only lines 15 and 18, which name BTTN as the model the project keeps.

## Ruling 5: fed-faithful-ecg FedProx

The FedProx row came from `code/results/fed_faithfulness/summary.md`, which neither `README.md` nor `CLAUDE.md` names; it is gone, and line 18 now states FedProx and MOON as benchmarks still to run (`README.md:72`). `grep -n -i fedprox` over the deck hits only that line.

## Ruling 6: fermat's disagreement between the two versions

The deck keeps the FLTA paper the manifest names (`project.yml:23`, "IEEE FLTA 2025"), `admin/conference/main_work.tex`. The two versions disagree on the local-client rows of the Fed-Heart-Disease table:

- FLTA paper, `admin/conference/main_work.tex:482-483`, "Local Experiment FBTTR": client 0 AUC 0.89 $\pm$ 0.01, accuracy 0.81 $\pm$ 0.01; client 1 AUC 0.92 $\pm$ 0.01, accuracy 0.84 $\pm$ 0.01.
- arXiv version, `manuscript/latex/main_work.tex:494-512`: no local FBTTR rows; its only local rows for clients 0 and 1 (`:508-509`) are 0.842 $\pm$ 0.009 and 0.882 $\pm$ 0.007 AUC, the FL4E "Local Experiment" rows that the FLTA paper also prints at `:497-498`.

The deck states no client 0 or client 1 value; its only local values are the smaller clients' FBTTR accuracies 0.63 and 0.72 (`admin/conference/main_work.tex:484-485`), rows the arXiv version does not have.

## Ruling 7: the verify sentence

The sentence that verify item 1 "cannot pass" is gone from the report's first line, and the verify-1 row of the DONE table now gives this round's run: `npm run test:quick` with `TMPDIR` unset, "test:quick: 43.9 s; every command passed".

## Ruling 8: values read from a figure

Every figure value a slide keeps was checked again on a render in `.agents/scratch/`:

- icfp-src-poster, lines 20 and 21: the "Loop program variations" bar chart prints every bar value as text (Pure 100, 78.5, 35.4, 2.4, 2.3; Latent 100, 74.3, 37.4, 2, 1.9; Incr 100, 56, 62.3, 5.5, 3.8; State 100, 34, 85, 3.3, 2.3); render `icfpposter-1.png` (`pdftoppm -r 50 -png`). The N-Queens chart prints no value, and the line read from it was replaced (entry above).
- algebraic-effects-compilation, lines 37 to 40: Fig. 14 "Relative run-times of Loops example" prints the same twenty values above its bars in the legend order Basic, Opt, Pure, PureOpt, Native; render `aec-p24-24.png` (`pdftoppm -f 24 -l 24 -r 90 -png`).
- hcc-modality-poster: the Results table (naive concatenation 0.718, 0.720, 0.705, 0.734 and with pretraining 0.795, 0.690, 0.670, 0.772, the last two in red; encoder heads 0.729, 0.731, 0.714, 0.787 and with pretraining 0.808, 0.753, 0.738, 0.844) and the Single Modality chart (0.808, 0.780, 0.753, 0.738, 0.844) print their values as text; render `hccposter-1.png`.

Values that only a chart's geometry gave were removed or replaced by the caption's or the text's own words: the icfp poster's N-Queens reading and the other chart readings marked "a chart reading" in the per-deck entries above.

## Ruling 9: individual-reference-intervals

Line 20, "The project folder holds only its manifest: no data, code or result was kept.", is replaced by "The bet was that per-patient baselines could sharpen event prediction." (`project.yml` eli5); the whole deck now follows `project.yml`, its only source (entry above).

## Verify, round 1

Run after this round's last change, from the oculus worktree, with `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch/` except for `npm run test:quick`:

- `npm run diagrams`: exit 0; `git status --short docs`: nothing.
- `env -u TMPDIR -u GIT_CEILING_DIRECTORIES npm run test:quick`: "ok prettier (0.8 s)", "ok ASCII gate (0.9 s)", "ok svelte-kit sync (2.9 s)", "ok eslint (2.4 s)", "ok svelte-check (9.0 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", "ok vitest checks (40.8 s)", "test:quick: 43.9 s; every command passed".
- Oculus ASCII gate, `LC_ALL=C grep -n '[^ -~]'` over `src/lib/themes/slide.css`, `src/lib/views/academic/present/Slide.svelte`, `src/lib/views/academic/present/parts/project/Facts.svelte`: nothing, exit 1.
- Hub ASCII gate, `find projects -path '*/present/*' \( -name '*.md' -o -name '*.yml' \) -print0 | xargs -0 env LC_ALL=C grep -n '[^ -~]'`: five lines, each an accented letter in a name: linfoot-estimator `main.md:11` (St<e acute>phanie), modality-dropping-btf `main.md:10` and hccnet-fl-sweden `main.md:4`, `:11`, `:19` (Link<o diaeresis>ping).
- Character set of the READMEs this round wrote, `LC_ALL=C grep -n '[^ -~]'` over the 11 files (btfno, ecg-readable-substrate, connectivity-motor-imagery, fermat, fbttr-strategies, go-bttr, hcc-modality-poster, glassbox-decision-pipelines, abduction, abstract-bci-meeting-2021, chi-household-survival): nothing.
- `sh utils/unused-exports.sh` (333 lines) against `O151-base/unused-exports.txt`: `diff` prints nothing, exit 0.
- `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O151.md df5a42a49`: the seven ledger paths of the DONE table's verify-4 row, none written by this builder.
- Hub `git status --short`: 143 lines; outside `present/` only the 11 READMEs.
- `sh diffrq.sh research.txt`: 95 folders, 0 "Only in base", 70 `main.md` and 70 `present.yml` only in the worktree, 25 `main.md` and 25 `present.yml` differ, 0 "base: no folder".
- C5, `node c5.mjs <hub worktree> research.txt`: "folders with present.yml: 95 of 95"; fault lines: 0; second slides: 50; `kind equation`: 0.
- C6: "Tests 7 passed | 7 skipped (14)", the three real-hub rows as in the DONE table.
- C10, `node c10.mjs`: "lines repeated across decks: 53", the same lines as listed under "Slide-text lines repeated across decks" with "### Limits" now in 4 decks.
- Fit, `node fit.mjs`: "slides: 145; slides over a fit rule: 0; slides with an equation key: 43".
- `node katex.mjs`: "equations: 43; throwing: 0".
- `node prose.mjs`: "hits: 20", 13 minus signs in math and 7 lower-case method names, read as in the DONE table.
- Figures: 23 of 23 identical to their sources (`cmp -s` loop).
- Doubled apostrophes in markdown bodies: none.

# Round 2

## NOT done, and what the coordinator has to know first

Nothing the round brief asks for is left unbuilt. These are the compromises in what was built, each stated in full because each changes what a reader of the decks gets.

1. **Facts were cut from slides to fit, and they were not given a second slide.** Ruling 1 says a fact that cannot stand on one slide is the reason for a second slide; it also says a second slide is rare. The 82 one-slide decks and the 13 two-slide decks together hold 1210 removed and 799 added lines against the round 1 state (`diff -U0`, counts per deck under "Per deck"), which is a net loss of text. The theory and failed decks lost the most: covert-theory (the PALM no-go, the "first" claim, the floor checks), ms-lipid-handshake (the specs Pairs and First cohorts, ambient RNA, BTD), jacobian-coupled-blockterm-dp (the spec Control and some numbers), and many coauthor decks lost minor numbers. Every cut is a `-` line in "Every changed line". On a two-slide deck the same pressure cut, for example, the two-branch and warm-start AUROC pairs of bttn-incident-af, whose names stay in its Dead ends chip with no number. I weighed the rarity of a second slide above completeness on one slide; that weighing is a judgment and it is the coordinator's to overturn deck by deck.
2. **Second slides are alike in their drawn parts, with these differences.** All 13 second slides have tag, eli5, specs, method, results and a headline (grep counts `specs=2 method=2 results=2 headline=2` per deck). Three of them (clinical-hccnet, dries-bttr-ecg, ecg-readable-substrate) have no equation, because their sources give none for that slide's content, and `grep -c begin{equation}` of dries's manuscript is 0. `mechanism` stands on first slides only (`mechanism=1` per deck); the field is not drawn on a slide.
3. **The method lists of the ten equation second slides are one bullet long.** An equation opens a half-width column, so the left column carries eli5, one short method bullet and the results. Numbers that did not fit as bullets stand in the specs chips.
4. **Figures that no slide draws any more stay in their folders.** No figure was deleted (`diff -rq`: no `Only in` line on the base side). The panels no longer drawn: clinical-hccnet (fusion_over_time, sequences_by_horizon), dries-bttr-ecg (forest_auroc, interpret_afsr_afibonly_blocks), btfno (fig_mechanism), bttd-source-eeg (fig2_source_maps, real_contralateral), linfoot-estimator (engine_shapes), hccnet-revision (figure_outline, calibration), meseret-cirrhosis (fig_simulation, meseret_landmark), raw-pls (fig2_results, synthetic_upgrades), ward-bttr-crosssubject (pipeline_flowchart, finger_spatial_maps). linfoot's engine label is not described in its manuscript: `grep -c -i sinkhorn` of the live `main.tex` is 0.
5. **A short name stands for a longer one on one chip.** bttn-incident-af's Dead ends chip says "tensor 0.675" for the beat-time-lead tensor; the longer name made the chip row wrap and the slide too tall.

## How the rules met in this round

- The spec's line "A builder runs no page ... whatever a brief says" conflicts with the round brief and ruling 730, which have the builder start a server and open a headless Chrome for the fit. I followed ruling 730 and the coordinator's message; the report states the conflict so that it can be ruled.
- The one measuring program is `.agents/scratch/measure.mjs`. Beside it ran only `c5.mjs` and `c10.mjs`, the brief's case-run programs that print and write nothing into the diff (their source stands in this report's appendix; the paths in it are read as the new worktree's). All were removed before this report's hand-back.
- The section "Every changed line" was generated with `diff -U0` and a shell redirect into this report, because the before-to-now diff is about 250 KB. Every other section was written with Write or Edit. Each deck file was written with Edit or Write, one file at a time.

## Per ruling

1. **One slide per deck.** 82 decks hold one slide and 13 hold two (`grep -c '^kind:'` per deck), 108 slides where there were 145. No `kind: columns` slide is left. The 13 are listed under "Decks that keep a second slide".
2. **A second slide looks like the first.** Same `kind: project` layout, a question or statement title of the first slide's form, and the parts in the NOT-done item 2 above.
3. **Every slide fits.** First and final measurement below.
4. **Slides made from the material only.** See "Per deck". The live-source updates are listed under "Up to date".
5. **All 17 issues per deck.** See "Per deck".
6. **Up to date.** The live checkout was read for the six named projects; the updates are listed under "Up to date".
7. **Kept as they stand.** The round 1 fixes, R1-S1 to R1-S6, R1-P1, R1-T1 and the private README records. No deck takes anything from a section headed private.
8. **Every changed line.** See "Every changed line".

## First and final measurement

The first measurement, taken with the server on 8796 before any deck was changed, on main's frame (`.agents/scratch/first-measurement.txt`, last line): `decks 95, tiles 145, marked Too tall 115`. Beside it stands the 99 of `O151-fit.md` on the old frame (95 decks, 145 slides, 92 decks and 99 slides too tall).

The final measurement, over every deck, printed by the approved program after the last change: `decks 95, tiles 108, marked Too tall 0`. The 108 tiles are 82 first slides of the one-slide decks and 26 of the 13 two-slide decks.

## Decks that keep a second slide

Each keeps a second slide because its sources give results, limits or dead ends that the first slide has no room for and that item 2 of the brief requires on the slides.

| Deck | Why one slide cannot hold it |
|---|---|
| bttn-incident-af | The first slide holds the model and the fused AUROC; occlusion, published comparators, external cohorts and dead ends stand on the second. |
| meseret-cirrhosis | The first slide holds the simulation and competing events; the discrimination ceiling, landmark analysis and failed transport stand on the second. |
| ward-bttr-crosssubject | The first slide holds the method and transfer results; the same-protocol ablation, cursor replication and dead ends stand on the second. |
| hccnet-revision | The first slide holds model results and pre-training gains; the ablation, calibration and fusion stand on the second. |
| dries-bttr-ecg | The first slide holds cohorts and baselines; weight maps, the R-peak ablation, limits and dead ends stand on the second. |
| clinical-hccnet | The first slide holds the fused AUROC and odds ratios; per-sequence AUROC, HCC stage at diagnosis, limits and dead ends stand on the second. |
| bttd-source-eeg | The first slide holds simulation results; correlated sources, real visual EEG and the method's limits stand on the second. |
| fed-multicellular-immune | The first slide holds federated recovery and privacy; lung and liver gains, the missing secure merge and differential privacy stand on the second. |
| raw-pls | The first slide holds the structural and grade results and proofs; radiomics margins, dead targets and external datasets stand on the second. |
| linfoot-estimator | The first slide holds the estimator and pooled RMSE; independent samples, closed routes, runs in progress and credit stand on the second. |
| btfno | The first slide holds MoBTE and the generalization gap; the theorem at $L=1$, diversity, the AAAI 2027 rejection and scope stand on the second. |
| ecg-readable-substrate | The first slide holds the named-feature results; the equal-input arm, transfer, limits and dead ends stand on the second. |
| bt-operator-theory | The first slide holds the separation; the synthetic checks and the scope stand on the second, with the equation. |

## Up to date

The live hub checkout was read for the projects of ruling 6. These changed a deck's lines (source in brackets):

- linfoot-estimator (live `manuscript/main.tex`): title, authors with S.M. van den Berg, Target IEEE TNNLS in preparation, RMSE 0.0544 and 0.0539 against 0.0714 and 0.0708, paired $-0.0169$ intervals, 0.0537 against 0.0566, departure at most $2.38 \times 10^{-7}$.
- clinical-hccnet (live `manuscript/main.tex`): 243 patients, 804 of 947 MRI analysed, adjusted odds ratio intervals, JHEP Reports.
- btfno (live `project.yml` and manuscript): Venue "AAAI 2027 rejected; targeting MLST"; the "at equal fit" framing is gone.
- bt-operator-theory (live manuscript and manifest): Authors A. Faes, M. Amir Haeri; Target Neural Networks.
- ecg-af-fair (live `README.md`, `project.yml`, `notes/concept-note/`): cohort numbers and Direction 3.
- dongho-ecg-clustering (live `project.yml`): BSPC 131, 111784.

Disagreements between a project's own places, none of which a slide takes a side on beyond the brief's order of precedence (manuscript, then README or named results file, then manifest):

| Project | One place | The other place |
|---|---|---|
| linfoot-estimator | Manifest results: ParamPL0z 0.0548 against 0.0714, $-0.0166$ $[-0.0203,-0.0130]$, 0.0491 to 0.0554, 26 groups | `manuscript/main.tex:41,265,310,397` |
| linfoot-estimator | Manifest `outcome` "No contribution is in the paper yet" and coauthor | The manuscript's authorship and the manifest's `lead` |
| bt-operator-theory | `README.md:83` "Blocking corrections" | `manuscript/main.tex:93,229,256,361`; the slide carries no critique |
| dongho-ecg-clustering | Manifest AMI 0.245 | 0.148; neither is on the deck |
| ecg-af-fair | Live `README.md` Direction 3 | Manifest "Two directions" |
| fermat | arXiv local-client rows 0.89 and 0.92 | FLTA 0.842 and 0.882 |
| covert-applied | Project `CLAUDE.md` names J-BHI | The manifest and deck name Neurocomputing |

## Per deck: the check of the 17 issues

Every deck's text was read this round against the 17 issues of ruling 5. The issues that need a source (statements the sources do not give, numbers from a file the sources do not name, claims no source makes, chart values read off a picture) were checked in this way: every line a deck holds now is a line, a shortening or a recombination of lines that stood in that deck after round 1 and were checked against its project's sources there (the per-deck part of "# Round 1"); the short method and hook lines written for the second slides state what those lines or the project's manuscript state; and the live-source updates are read from the live source named in the "Up to date" section. The issues the sources do not bear on (a repeated line, a banned pattern, a slide too tall, the right-hand column) were checked with C10, the prose grep and the final measurement. covert-theory's deck does not name COVERT (`grep -c -i covert` prints 0) and covert-applied's names only itself. The command `grep -oE '[0-9]+(\.[0-9]+)?'` over each deck against its before-state, followed by `comm -23`, prints new numbers in four decks only (linfoot-estimator, dongho-ecg-clustering, ecg-af-fair, clinical-hccnet), and every one of those numbers was then found by `grep -l -F` in that project's live source. A row's "none" means that reading found no instance of any of the 17 issues other than issue 10. Issue 10 (a fact dropped) is not "none" for any deck that lost a line to fit: the row's two counts are the removed and added lines of `diff -U0` between the before-state and the deck, and the lines themselves are in "Every changed line". The repeated lines of issue 11 are listed under C10.

| Deck | Slides | Removed / added lines | 17 issues other than 10 |
|---|---|---|---|
| eeg-saad-challenge | 1 | 17 / 8 | none |
| linfoot-estimator | 2 | 26 / 33 | none |
| loewner | 1 | 16 / 7 | none |
| novel-math-primitives | 1 | 11 / 6 | none |
| sandpile-operator | 1 | 16 / 6 | none |
| faithful-block-term-layer | 1 | 16 / 8 | none |
| fed-faithful-ecg | 1 | 14 / 6 | none |
| jacobian-coupled-blockterm-dp | 1 | 20 / 9 | none |
| ms-lipid-handshake | 1 | 21 / 6 | none |
| phd-thesis | 1 | 14 / 7 | none |
| bachelor-network-ids | 1 | 15 / 8 | none |
| icfp-src-abstract | 1 | 5 / 4 | none |
| icfp-src-poster | 1 | 7 / 5 | none |
| masters-algebraic-subtyping | 1 | 16 / 8 | none |
| masters-eeg-infotheory | 1 | 14 / 6 | none |
| abstract-bci-meeting-2021 | 1 | 10 / 6 | none |
| source-localization | 1 | 20 / 6 | none |
| volga-finger-trajectories | 1 | 4 / 2 | none |
| block-term-tensor-regression | 1 | 23 / 8 | none |
| connectivity-iris | 1 | 20 / 10 | none |
| extended-bttr-note | 1 | 23 / 8 | none |
| fbttr-strategies | 1 | 22 / 7 | none |
| fermat | 1 | 19 / 9 | none |
| go-bttr | 1 | 23 / 9 | none |
| abduction | 1 | 10 / 7 | none |
| dongho-ecg-clustering | 1 | 25 / 10 | none |
| erp-signatures | 1 | 11 / 7 | none |
| glassbox-decision-pipelines | 1 | 17 / 8 | none |
| hcc-modality-poster | 1 | 17 / 8 | none |
| hccnet-fl | 1 | 20 / 10 | none |
| algebraic-subtyping | 1 | 0 / 0 | none |
| connectivity-motor-imagery | 1 | 16 / 8 | none |
| flkit | 1 | 8 / 6 | none |
| chi-household-survival | 1 | 12 / 8 | none |
| chi-purpose-centric | 1 | 12 / 9 | none |
| algebraic-effects-compilation | 1 | 18 / 8 | none |
| http2-best-practices | 1 | 16 / 7 | none |
| http2-web-performance | 1 | 16 / 7 | none |
| coordinated-fingers-ecnr | 1 | 14 / 10 | none |
| ecog-frequency-features | 1 | 19 / 9 | none |
| modulation-lmp-bci | 1 | 8 / 5 | none |
| highgamma-event-detection | 1 | 11 / 7 | none |
| editorial-bigdata-ai-ms | 1 | 10 / 6 | none |
| pfl-ms-npj | 1 | 20 / 10 | none |
| proprioception-exoskeleton | 1 | 15 / 11 | none |
| individual-reference-intervals | 1 | 0 / 0 | none |
| adapter-format-theory | 1 | 3 / 2 | none |
| asthma-geo-tensor | 1 | 0 / 0 | none |
| attention-scoped-instructions | 1 | 3 / 2 | none |
| block-term-nca | 1 | 3 / 2 | none |
| brecht-fl-partitioning | 1 | 7 / 5 | none |
| btd-autoencoder | 1 | 2 / 1 | none |
| cirrhosis-digital-twin | 1 | 16 / 9 | none |
| clinical-ai-eval-artifacts | 1 | 2 / 1 | none |
| concept-bottleneck-hcc | 1 | 4 / 3 | none |
| conformal-tensor-factors | 1 | 3 / 2 | none |
| ecg-af-fair | 1 | 13 / 12 | none |
| engram | 1 | 16 / 8 | none |
| faithful-interpretability-position | 1 | 4 / 3 | none |
| fed-duplication-limits | 1 | 3 / 2 | none |
| fed-neural-operators | 1 | 4 / 3 | none |
| fedbtd | 1 | 1 / 1 | none |
| federated-protocol-agents | 1 | 4 / 3 | none |
| fedlink | 1 | 8 / 5 | none |
| fl-privacy-auditing | 1 | 3 / 2 | none |
| florank-personalization | 1 | 12 / 7 | none |
| harmonop | 1 | 3 / 2 | none |
| hccnet-fl-sweden | 1 | 3 / 2 | none |
| hccnet-pathology | 1 | 15 / 7 | none |
| modality-dropping-btf | 1 | 12 / 8 | none |
| multiway-biosignal-fm | 1 | 15 / 8 | none |
| neurosde | 1 | 9 / 6 | none |
| old-charges-stemmatology | 1 | 18 / 9 | none |
| paleogenomics-tensor | 1 | 1 / 1 | none |
| pathology-tensor-mil | 1 | 10 / 7 | none |
| physics-tensor-hcc | 1 | 4 / 3 | none |
| quantum-tensor-fl | 1 | 7 / 5 | none |
| serial-ecg-af | 1 | 8 / 5 | none |
| ssm-longitudinal | 1 | 4 / 3 | none |
| strokeop | 1 | 2 / 2 | none |
| xsub-ecog-framework | 1 | 5 / 4 | none |
| bt-operator-theory | 2 | 19 / 27 | none |
| btfno | 2 | 21 / 25 | none |
| bttd-source-eeg | 2 | 23 / 24 | none |
| bttn-incident-af | 2 | 15 / 18 | none |
| clinical-hccnet | 2 | 23 / 25 | none |
| covert-applied | 1 | 19 / 10 | none |
| covert-theory | 1 | 19 / 9 | none |
| dries-bttr-ecg | 2 | 23 / 24 | none |
| ecg-readable-substrate | 2 | 17 / 25 | none |
| fed-multicellular-immune | 2 | 20 / 30 | none |
| hccnet-revision | 2 | 25 / 19 | none |
| meseret-cirrhosis | 2 | 26 / 23 | none |
| raw-pls | 2 | 20 / 22 | none |
| ward-bttr-crosssubject | 2 | 26 / 20 | none |

## Oculus, the four files

`git diff --stat -- src`, after the last change: `slide.css` 25 lines, `Slide.svelte` 20, `Facts.svelte` 27, `Project.svelte` 16; 53 insertions and 35 deletions. `grep -c '<<<<<<<\|>>>>>>>'` over the four files prints 0 for each. `.slide-frame` holds `--slide-design-facts: 0.9375cqw` and `--slide-design-facts-label: 0.78125cqw`, and `body.rice` holds `0.859375cqw` and `0.703125cqw`.

The grep of the changed comments for 'before', 'used to', 'no longer', 'still', 'always has been', 'always had', 'as before', 'previously', 'the step adds' and 'after this package lands' (`git diff -U0 -- src`, the added lines) has one hit, "The dot before a hued value is three quarters of the value type" in `Facts.svelte`. It is the position of the dot, no history.

## Prose

Each slide's text was read against the prose rule. A grep of the decks' sentences for "rather than", " - ", " -- ", ", but not ", "not only", "is not ..., it" and " not ... but " hits minus signs inside LaTeX and two sentences ("IVIM work exists ... but not as longitudinal tensor fusion" in physics-tensor-hcc, "separately, but not their combination" in neurosde), each stating what the source's check found and no contrast of the banned form. A grep for "leverage", "comprehensive", "crucial", "showcase" and "moreover" hits only the metric name "comprehensiveness" in fed-faithful-ecg.

## Verify, round 2 (run after the last change)

| Check | Result |
|---|---|
| `npm run diagrams` | exit 0; `git status --short docs` printed nothing |
| `npm run test:quick` with `TMPDIR` unset | `test:quick: 42.5 s; every command passed`. Its own line on what it does not cover: tests that reach no changed file within the import depth, other than the checks under `tests/checks/source` and `tests/checks/tree`, the build, the lint of unchanged files |
| Oculus ASCII gate over `slide.css`, `Facts.svelte`, `Slide.svelte`, `Project.svelte` | `LC_ALL=C grep -n '[^ -~]'` prints 0 lines |
| Hub non-ASCII grep over the `present/` folders | 4 lines, each the accented letter in the place name Link<o umlaut>ping: `ideas/modality-dropping-btf/present/main.md:10`; `ideas/hccnet-fl-sweden/present/main.md:4`, `:11`, `:19` |
| `sh utils/unused-exports.sh` against `O151-2-base/unused-exports.txt` | `diff` prints 0 lines |
| `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O151.md 3d5b3da7d` | prints 4 paths. Three are ledger files the orchestrator wrote: `.scratch/migration/agents/briefs/O151-round2.md`, `.scratch/migration/agents/reviews/O151-oculus-before-round-2.patch`, `.scratch/migration/plan.md`. The fourth, `src/lib/views/academic/present/parts/project/Project.svelte`, is named by the round brief's "Paths this round writes" and is absent from the O151 brief's list that this tool reads |
| Hub `git status --short` | 143 lines: 132 under `present/` folders of the brief's list, 11 the `README.md` records of round 1 (`git status --short \| grep -v /present/ \| wc -l` prints 11). No `README.md` was changed this round: `find ... -newer first-measurement.txt` over figures prints 0, and the round wrote only `present/main.md` files |
| `diff -rq` per folder against `O151-hub-base` | Quoted below. The base copy holds only each folder's `present/`, so the `Only in` lines for a folder's other files are that fact; compared `present/` to `present/`, 50 files differ, all `main.md` or `present.yml`, and no file exists only on the base side, so no figure was deleted |
| Equation floor | `grep -c '^equation'` summed over the decks prints 13, the floor of `REAL_FLOORS` in `tests/checks/config/integrity.test.ts` |
| C5 | `node c5.mjs <H> research.txt` prints all 95 folders with `present.yml`, each slide's kind and keys; no fault line. Output quoted below; source in the appendix of round 0, its paths read as the new worktree's |
| C6 | `OCULUS_TEST_HUB=<H> TMPDIR=<S> GIT_CEILING_DIRECTORIES=<S> npx vitest run tests/checks/config/integrity.test.ts -t "deck\|equation\|portfolio"`: 7 passed, 7 skipped (the skipped ones are the tests the `-t` filter excludes) |
| C10 | `node c10.mjs <H> research.txt`: 36 repeated lines, all fact-labels and facts true of each deck. The non-label ones: the shared author lists; the paper titles shared by a paper and its abstract or poster (Causal Graphical Modelling..., High-gamma band event detection..., Towards a Core Language...); the venue strings and stage words. Output quoted below |
| Final measurement | `decks 95, tiles 108, marked Too tall 0` |
| Server and Chrome | stopped by the pids started; no listener on 8796 or 9340; `.agents/scratch/` contents removed, as the hand-back states |

## Programs

The source of the one measuring program is quoted here; it was removed with the scratch folder.

```js
// Ruling 730's one measuring program. For every slide of every deck, drawn in the Present view's
// Overview of that deck on the scratch server: whether its tile holds the mark "Too tall", and by
// how much the content passes the frame (scrollHeight against clientHeight of the tile's
// .slide-frame). It prints those facts and changes nothing. Given project ids as arguments, only
// those decks are measured.
const debug = 'http://127.0.0.1:9340';
const page = 'http://127.0.0.1:8796/';
const sleep = (ms) => new Promise((go) => setTimeout(go, ms));

for (const tab of await (await fetch(`${debug}/json/list`)).json()) {
    if (tab.type === 'page' && tab.url.startsWith(page)) await fetch(`${debug}/json/close/${tab.id}`);
}
const made = await (await fetch(`${debug}/json/new?about:blank`, { method: 'PUT' })).json();
const socket = new WebSocket(made.webSocketDebuggerUrl);
await new Promise((go) => socket.addEventListener('open', go, { once: true }));
let next = 0;
const waiting = new Map();
socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.id !== undefined && waiting.has(data.id)) {
        waiting.get(data.id)(data);
        waiting.delete(data.id);
    }
});
const send = (method, params = {}) =>
    new Promise((go) => {
        const id = ++next;
        const timer = setTimeout(() => {
            waiting.delete(id);
            go({});
        }, 30000);
        waiting.set(id, (data) => {
            clearTimeout(timer);
            go(data);
        });
        socket.send(JSON.stringify({ id, method, params }));
    });
const evaluate = async (expression) => {
    const answer = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
    });
    if (answer.result?.exceptionDetails) throw new Error(JSON.stringify(answer.result));
    return answer.result?.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false
});
await send('Page.bringToFront');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Page.navigate', { url: page });

const until = async (expression, what, limit = 60000) => {
    const start = Date.now();
    while (Date.now() - start < limit) {
        if (await evaluate(expression)) return true;
        await sleep(300);
    }
    return `timed out: ${what}`;
};

const checked = (result) => {
    if (result !== true) throw new Error(result);
};
checked(await until(`document.querySelector('[data-rail-page="present"] button') !== null`, 'the rail', 120000));
await evaluate(`document.querySelector('[data-rail-page="present"] button').click()`);
const menu = `document.querySelector('select[aria-label="Deck"]')`;
checked(await until(`${menu} !== null && ${menu}.options.length > 1`, 'the deck menu', 120000));
const choiceIds = await evaluate(`[...${menu}.options].map((one) => one.value)`);
const wanted = process.argv.slice(2);
let shownFirst = false;
if (choiceIds.includes('portfolio')) {
    await evaluate(`(() => {
        const menu = ${menu};
        menu.value = 'portfolio';
        menu.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await sleep(800);
    shownFirst = true;
}
const projectIds = (await evaluate(`[...${menu}.options].map((one) => one.value)`))
    .filter((one) => one.startsWith('project:'))
    .map((one) => one.replace('project:', ''));
const toDo = wanted.length > 0 ? projectIds.filter((one) => wanted.includes(one)) : projectIds;

const overviewOpen = `document.querySelector('[data-overview]') !== null`;
const overviewChip = `[...document.querySelectorAll('button')].find((one) => one.textContent.trim().endsWith('Overview'))`;
const read = `[...document.querySelectorAll('.tile.pressable')].map((tile) => {
    const frame = tile.querySelector('.slide-frame');
    return {
        key: tile.dataset.tile,
        title: (tile.querySelector('h1,h2,h3,h4')?.textContent ?? '').trim(),
        tall: [...tile.querySelectorAll('button,span')].some((one) => one.textContent.trim().endsWith('Too tall') && (frame === null || !frame.contains(one))),
        scroll: frame === null ? 0 : frame.scrollHeight,
        client: frame === null ? 0 : frame.clientHeight
    };
})`;

let marked = 0;
let total = 0;
for (const id of toDo) {
    if (await evaluate(overviewOpen)) {
        await evaluate(`${overviewChip}.click()`);
        await until(`!(${overviewOpen})`, 'the grid to close', 15000);
    }
    await evaluate(`(() => {
        const menu = ${menu};
        menu.value = 'project:${id}';
        menu.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    const on = await until(
        `![...${menu}.options].some((one) => one.value === 'project:${id}') && /\\d+$/.test(document.querySelector('.counter')?.textContent ?? '')`,
        `deck ${id}`,
        30000
    );
    if (on !== true) {
        console.log(`ERROR\t-\t-\t${id}\t${on}`);
        continue;
    }
    await evaluate(`${overviewChip}.click()`);
    const shown = await until(`${overviewOpen} && document.querySelectorAll('.tile.pressable .slide-frame').length > 0`, `tiles of ${id}`, 30000);
    if (shown !== true) {
        console.log(`ERROR\t-\t-\t${id}\t${shown}`);
        continue;
    }
    let rows = [];
    let steady = 0;
    const start = Date.now();
    while (steady < 3 && Date.now() - start < 15000) {
        await sleep(500);
        const now = await evaluate(read);
        steady = JSON.stringify(now) === JSON.stringify(rows) && now.length > 0 ? steady + 1 : 0;
        rows = now ?? [];
    }
    for (const row of rows) {
        const past = row.scroll - row.client;
        const percent = row.client === 0 ? 0 : Math.round((past / row.client) * 100);
        console.log(`${row.tall ? 'TOO-TALL' : 'fits'}\t${past}px\t${percent}%\t${id}\t${row.title}`);
        total += 1;
        if (row.tall) marked += 1;
    }
    await evaluate(`${overviewChip}.click()`);
}
console.log(`decks ${toDo.length}, tiles ${total}, marked Too tall ${marked}`);
await fetch(`${debug}/json/close/${made.id}`);
socket.close();
if (shownFirst) process.exit(0);
```

## C5 output

```
projects/active/eeg-saad-challenge: 1 slide(s), deck.title "EEG-sAAD", order ["main.md"]
  slide 1: kind project; title: Decoding which talker a listener attends to, across unseen EEG datasets
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/active/linfoot-estimator: 2 slide(s), deck.title "Linfoot Estimator", order ["main.md"]
  slide 1: kind project; title: A Linfoot estimator invariant to what the estimand is invariant to
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: Where the published estimator is lower, and which routes are closed
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, headline
projects/active/loewner: 1 slide(s), deck.title "Loewner", order ["main.md"]
  slide 1: kind project; title: Trainable Loewner layers for compact rational operators
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/active/novel-math-primitives: 1 slide(s), deck.title "Math-Primitives", order ["main.md"]
  slide 1: kind project; title: Mathematical objects ML does not use yet, each with a route to a layer
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/active/sandpile-operator: 1 slide(s), deck.title "Sandpile-Op", order ["main.md"]
  slide 1: kind project; title: A differentiable sandpile operator for threshold-cascade spreading
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/failed/faithful-block-term-layer: 1 slide(s), deck.title "Faithful BT Layer", order ["main.md"]
  slide 1: kind project; title: Can a block-term layer carry a provable no-leakage faithfulness guarantee?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/failed/fed-faithful-ecg: 1 slide(s), deck.title "Fed-Faithful ECG", order ["main.md"]
  slide 1: kind project; title: Does federated averaging break a glass-box ECG model's explanation?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/failed/jacobian-coupled-blockterm-dp: 1 slide(s), deck.title "Jacobian-Coupled BT-DP", order ["main.md"]
  slide 1: kind project; title: Can whitened block scores make the gap lower a block-term DP floor?
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, mechanism, headline
projects/archive/failed/ms-lipid-handshake: 1 slide(s), deck.title "MS Lipid Handshake", order ["main.md"]
  slide 1: kind project; title: A lipid handshake in multiple-sclerosis lesions, tested and disproved
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, mechanism, headline
projects/archive/phd/phd-thesis: 1 slide(s), deck.title "PhD Thesis", order ["main.md"]
  slide 1: kind project; title: Finger movement decoding: from source localisation to tensor regression
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2016/bachelor-network-ids: 1 slide(s), deck.title "Flow-based Network IDS (BSc)", order ["main.md"]
  slide 1: kind project; title: Can machine learning on IP flows alone detect intrusions out of the box?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2017/icfp-src-abstract: 1 slide(s), deck.title "Row-Based Effects Core Language (abstract)", order ["main.md"]
  slide 1: kind project; title: Can an explicitly typed core language make optimised Eff less error-prone?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2017/icfp-src-poster: 1 slide(s), deck.title "Row-Based Effects Core Language (poster)", order ["main.md"]
  slide 1: kind project; title: Can explicit types with row-based effects make Eff's rewrites less error-prone?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2018/masters-algebraic-subtyping: 1 slide(s), deck.title "Algebraic Subtyping (MSc)", order ["main.md"]
  slide 1: kind project; title: Can Dolan's algebraic subtyping carry effects and keep its properties?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2018/masters-eeg-infotheory: 1 slide(s), deck.title "EEG Info-Theoretic Connectivity (MSc)", order ["main.md"]
  slide 1: kind project; title: How much information do abstract and concrete words share in one region?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2021/abstract-bci-meeting-2021: 1 slide(s), deck.title "BCI Connectivity (abstract)", order ["main.md"]
  slide 1: kind project; title: Can a causal-discovery network seed a graph model of EEG source links?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2021/source-localization: 1 slide(s), deck.title "eLORETA Source Reduction", order ["main.md"]
  slide 1: kind project; title: Can sparse Bayesian screening of the lead field make eLORETA sparse?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2021/volga-finger-trajectories: 1 slide(s), deck.title "Finger Trajectories (Volga abstract)", order ["main.md"]
  slide 1: kind project; title: Can a block-term tensor regression read single-finger trajectories from ECoG?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2022/block-term-tensor-regression: 1 slide(s), deck.title "BTTR Finger Decoding", order ["main.md"]
  slide 1: kind project; title: Can block-term tensor regression choose its own ranks and decode fingers?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2022/connectivity-iris: 1 slide(s), deck.title "NN Connectivity", order ["main.md"]
  slide 1: kind project; title: Can neural networks match Granger causality on directed EEG connectivity?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2022/extended-bttr-note: 1 slide(s), deck.title "BTTR Coactivation", order ["main.md"]
  slide 1: kind project; title: Can one tensor regression predict all five fingers at once?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2025/fbttr-strategies: 1 slide(s), deck.title "FBTTR Strategies", order ["main.md"]
  slide 1: kind project; title: Can block-term regression be trained across clients without pooling ECoG?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2025/fermat: 1 slide(s), deck.title "FERMAT", order ["main.md"]
  slide 1: kind project; title: Does federated block-term regression hold up on brain and clinical data?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2025/go-bttr: 1 slide(s), deck.title "Sign-Language ECoG", order ["main.md"]
  slide 1: kind project; title: Can one decoder choose, block by block, which fingers to regress together?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2026/abduction: 1 slide(s), deck.title "Finger Abduction", order ["main.md"]
  slide 1: kind project; title: Can finger abduction be decoded from ECoG as well as flexion?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2026/dongho-ecg-clustering: 1 slide(s), deck.title "ECG-Repr", order ["main.md"]
  slide 1: kind project; title: Does the ECG representation, more than the algorithm, decide clustering?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2026/erp-signatures: 1 slide(s), deck.title "ERP Signatures", order ["main.md"]
  slide 1: kind project; title: Do stimulus type and task structure change N-Back ERP signatures?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2026/glassbox-decision-pipelines: 1 slide(s), deck.title "Robust-XAI-ECG", order ["main.md"]
  slide 1: kind project; title: What do frozen ECG foundation models gain from the patient's age?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2026/hcc-modality-poster: 1 slide(s), deck.title "Modality-Specific HCC Encoding (poster)", order ["main.md"]
  slide 1: kind project; title: Does one encoder head per MRI sequence group predict HCC better?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/published/2026/hccnet-fl: 1 slide(s), deck.title "HCCNet-FL", order ["main.md"]
  slide 1: kind project; title: Which part of a longitudinal MRI model should hospitals federate?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/archive/stopped/algebraic-subtyping: 1 slide(s), deck.title "Algebraic Subtyping", order ["main.md"]
  slide 1: kind project; title: Algebraic subtyping for algebraic effects and handlers
    keys: title, sub, hook, eli5, method, results, mechanism, headline
projects/archive/stopped/connectivity-motor-imagery: 1 slide(s), deck.title "Motor-Imagery Connectivity", order ["main.md"]
  slide 1: kind project; title: Can an attention network and a graph process recover EEG source links?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/active/flkit: 1 slide(s), deck.title "FLKit", order ["main.md"]
  slide 1: kind project; title: How can health researchers be brought onto federated learning?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/published/2016/chi-household-survival: 1 slide(s), deck.title "Household Survival (abstract)", order ["main.md"]
  slide 1: kind project; title: A broom, a fan, a vacuum cleaner and a mousetrap as room-game weapons
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/published/2016/chi-purpose-centric: 1 slide(s), deck.title "Objects as Game Controllers (abstract)", order ["main.md"]
  slide 1: kind project; title: Should a game controller do in the game what it does in real life?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/published/2017/algebraic-effects-compilation: 1 slide(s), deck.title "Algebraic Effects Compilation", order ["main.md"]
  slide 1: kind project; title: Can algebraic effect handler code run as fast as hand-written OCaml?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/published/2017/http2-best-practices: 1 slide(s), deck.title "HTTP/2 Best Practices", order ["main.md"]
  slide 1: kind project; title: Do concatenation, embedding and sharding still make sense in HTTP/2?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/published/2018/http2-web-performance: 1 slide(s), deck.title "HTTP/2 Web Performance", order ["main.md"]
  slide 1: kind project; title: Which HTTP/2 features speed up page loads over HTTP/1.1?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/published/2023/coordinated-fingers-ecnr: 1 slide(s), deck.title "Coordinated Fingers from HD-EEG (abstract)", order ["main.md"]
  slide 1: kind project; title: Can high-density EEG tell individual and coordinated finger movements apart?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/published/2023/ecog-frequency-features: 1 slide(s), deck.title "ECoG Frequency Features", order ["main.md"]
  slide 1: kind project; title: Which ECoG frequency features carry finger movement?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/published/2023/modulation-lmp-bci: 1 slide(s), deck.title "LMP Gamma Modulation (abstract)", order ["main.md"]
  slide 1: kind project; title: Can gamma-band event detection steady ECoG finger trajectories?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/published/2024/highgamma-event-detection: 1 slide(s), deck.title "High-Gamma Event Detection (abstract)", order ["main.md"]
  slide 1: kind project; title: Does high-gamma event detection keep decoded fingers still at rest?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/published/2025/editorial-bigdata-ai-ms: 1 slide(s), deck.title "MS Big-Data Editorial", order ["main.md"]
  slide 1: kind project; title: Where do big data and AI stand in multiple sclerosis research and care?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/published/2025/pfl-ms-npj: 1 slide(s), deck.title "PFL-MS", order ["main.md"]
  slide 1: kind project; title: Can federated learning predict MS progression across differing countries?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/published/2025/proprioception-exoskeleton: 1 slide(s), deck.title "Proprioception EEG", order ["main.md"]
  slide 1: kind project; title: Can EEG read intention while an exoskeleton moves the fingers?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/coauthor/stopped/individual-reference-intervals: 1 slide(s), deck.title "Reference Intervals", order ["main.md"]
  slide 1: kind project; title: Can per-patient reference intervals sharpen the prediction of clinical events?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/ideas/adapter-format-theory: 1 slide(s), deck.title "Format Theory", order ["main.md"]
  slide 1: kind project; title: Which tensor format should a fine-tuning update use?
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/asthma-geo-tensor: 1 slide(s), deck.title "Asthma-Geo", order ["main.md"]
  slide 1: kind project; title: Predicting asthma attacks from where and when a patient breathes
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/attention-scoped-instructions: 1 slide(s), deck.title "Scoped Instructions", order ["main.md"]
  slide 1: kind project; title: Scope and precedence for the instructions a language-model agent reads
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/block-term-nca: 1 slide(s), deck.title "Block-term NCA", order ["main.md"]
  slide 1: kind project; title: Growth rules that name their mechanisms
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/brecht-fl-partitioning: 1 slide(s), deck.title "FL Partitioning", order ["main.md"]
  slide 1: kind project; title: Federated ECG models break on label skew, and global accuracy hides it
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/ideas/btd-autoencoder: 1 slide(s), deck.title "BTD Autoencoder", order ["main.md"]
  slide 1: kind project; title: An autoencoder whose bottleneck is a block-term decomposition
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/cirrhosis-digital-twin: 1 slide(s), deck.title "Cirrhosis iDT", order ["main.md"]
  slide 1: kind project; title: One patient history, two risks: heart and liver in cirrhosis
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/clinical-ai-eval-artifacts: 1 slide(s), deck.title "Eval Artifacts", order ["main.md"]
  slide 1: kind project; title: Clinical-AI evaluation artifacts
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/concept-bottleneck-hcc: 1 slide(s), deck.title "Concept-Bottleneck HCC", order ["main.md"]
  slide 1: kind project; title: Future liver-cancer risk that runs through concepts a radiologist can correct
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/conformal-tensor-factors: 1 slide(s), deck.title "Conformal Tensor", order ["main.md"]
  slide 1: kind project; title: Calibrated uncertainty on the factors a clinician reads
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/ecg-af-fair: 1 slide(s), deck.title "ECG-AF (FAIR)", order ["main.md"]
  slide 1: kind project; title: Hidden atrial fibrillation from a normal-rhythm ECG on the Gruwez cohort
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/engram: 1 slide(s), deck.title "Engram", order ["main.md"]
  slide 1: kind project; title: Locating and excising a memorised record inside a clinical language model
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/ideas/faithful-interpretability-position: 1 slide(s), deck.title "Faithful-Interp Position", order ["main.md"]
  slide 1: kind project; title: Measured faithful interpretability for structured-tensor clinical models
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/fed-duplication-limits: 1 slide(s), deck.title "FL Duplication", order ["main.md"]
  slide 1: kind project; title: When one patient record sits at several hospitals of a federation
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/fed-neural-operators: 1 slide(s), deck.title "Fed Neural Operators", order ["main.md"]
  slide 1: kind project; title: One neural operator trained across silos with different field resolutions
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/fedbtd: 1 slide(s), deck.title "FedBTD", order ["main.md"]
  slide 1: kind project; title: Aligning block terms before federated averaging, stopped by prior art
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/federated-protocol-agents: 1 slide(s), deck.title "Protocol Agents", order ["main.md"]
  slide 1: kind project; title: Keeping a multi-site study faithful to one protocol without moving data
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/fedlink: 1 slide(s), deck.title "FedLink", order ["main.md"]
  slide 1: kind project; title: FedLink: which gene cluster makes which antibiotic?
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/fl-privacy-auditing: 1 slide(s), deck.title "FL Privacy Audit", order ["main.md"]
  slide 1: kind project; title: A standard privacy audit for deployed federated and DP clinical models
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/florank-personalization: 1 slide(s), deck.title "FLoRank Personalization", order ["main.md"]
  slide 1: kind project; title: Structured per-hospital personalization for federated clinical models
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/harmonop: 1 slide(s), deck.title "HarmonOp", order ["main.md"]
  slide 1: kind project; title: MRI harmonization learned as an operator between scanner function spaces
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/hccnet-fl-sweden: 1 slide(s), deck.title "HCCNet FL Sweden", order ["main.md"]
  slide 1: kind project; title: Federated HCC risk across a real two-country hospital network
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/hccnet-pathology: 1 slide(s), deck.title "HCCNet Pathology", order ["main.md"]
  slide 1: kind project; title: Liver-cancer risk from MRI through four pathology-specific networks
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/modality-dropping-btf: 1 slide(s), deck.title "Modality-Dropping BTF", order ["main.md"]
  slide 1: kind project; title: Federated fusion where a hospital missing a modality drops that mode
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/multiway-biosignal-fm: 1 slide(s), deck.title "Multiway FM", order ["main.md"]
  slide 1: kind project; title: A biosignal foundation model pretrained on the factors of the data tensor
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/neurosde: 1 slide(s), deck.title "NeuroSDE", order ["main.md"]
  slide 1: kind project; title: One shared stochastic cortical dynamics to decode a new subject's ECoG
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/old-charges-stemmatology: 1 slide(s), deck.title "Old Charges", order ["main.md"]
  slide 1: kind project; title: Rebuilding the copying tree of the Old Charges with phylogenetic methods
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/paleogenomics-tensor: 1 slide(s), deck.title "Paleo-Tensor", order ["main.md"]
  slide 1: kind project; title: Ancient-DNA population structure from a population by locus by period tensor
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/pathology-tensor-mil: 1 slide(s), deck.title "Pathology Tensor-MIL", order ["main.md"]
  slide 1: kind project; title: Whole-slide pathology read through block-term tissue signatures
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/physics-tensor-hcc: 1 slide(s), deck.title "Physics-Tensor HCC", order ["main.md"]
  slide 1: kind project; title: Making multiparametric liver MRI fusion pay off for future HCC risk
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/quantum-tensor-fl: 1 slide(s), deck.title "Quantum Tensor/FL", order ["main.md"]
  slide 1: kind project; title: One exploratory quantum-methods paper from the tensor and federated line
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/serial-ecg-af: 1 slide(s), deck.title "Serial-ECG AF", order ["main.md"]
  slide 1: kind project; title: Predicting future AF from atrial substrate change across serial ECGs
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/ssm-longitudinal: 1 slide(s), deck.title "SSM Longitudinal", order ["main.md"]
  slide 1: kind project; title: A continuous-time state-space model over irregular MRI follow-ups
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/strokeop: 1 slide(s), deck.title "StrokeOp", order ["main.md"]
  slide 1: kind project; title: Ischemic tissue fate learned as an operator, perfusion to final infarct
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/ideas/xsub-ecog-framework: 1 slide(s), deck.title "XSub-ECoG", order ["main.md"]
  slide 1: kind project; title: Does one cross-subject ECoG framework hold across tasks and datasets?
    keys: title, sub, hook, eli5, specs, method, results, mechanism, headline
projects/manuscripts/bt-operator-theory: 2 slide(s), deck.title "BT-Op-Theory", order ["main.md"]
  slide 1: kind project; title: Why does a block-term spectral kernel generalize better than CP?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: What do the checks show, and what is the reach of the claim?
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, headline
projects/manuscripts/btfno: 2 slide(s), deck.title "BT-FNO", order ["main.md"]
  slide 1: kind project; title: Do block-term spectral weights help one operator span PDE families?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: Which part of the gain is the factorization's, and what is still open?
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, headline
projects/manuscripts/bttd-source-eeg: 2 slide(s), deck.title "LF-BTD", order ["main.md"]
  slide 1: kind project; title: Can one decomposition localize evoked EEG generators and their dynamics?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: Correlated sources, real visual EEG, and where the method stops
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, headline
projects/manuscripts/bttn-incident-af: 2 slide(s), deck.title "BTTN", order ["main.md"]
  slide 1: kind project; title: Can an interpretable ECG model predict atrial fibrillation before onset?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: What do the block factors read, and where does the evidence stop?
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, headline
projects/manuscripts/clinical-hccnet: 2 slide(s), deck.title "Clin-HCCNet", order ["main.md"]
  slide 1: kind project; title: Can liver parenchyma MRI alone predict HCC years before diagnosis?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: How does each sequence perform, and what limits the result?
    keys: title, sub, hook, tag, eli5, specs, method, results, headline
projects/manuscripts/covert-applied: 1 slide(s), deck.title "COVERT", order ["main.md"]
  slide 1: kind project; title: COVERT: block-term regression across parties holding different modalities
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
projects/manuscripts/covert-theory: 1 slide(s), deck.title "Private Coupled Descent", order ["main.md"]
  slide 1: kind project; title: Private Coupled Descent: privacy that does not pay for feature dimension
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, mechanism, headline
projects/manuscripts/dries-bttr-ecg: 2 slide(s), deck.title "BTTR-AF", order ["main.md"]
  slide 1: kind project; title: Can a model of readable maps identify AF from a sinus-rhythm ECG?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: Where does the weight sit, what does alignment do, what are the limits?
    keys: title, sub, hook, tag, eli5, specs, method, results, headline
projects/manuscripts/ecg-readable-substrate: 2 slide(s), deck.title "Readable-FM-ECG", order ["main.md"]
  slide 1: kind project; title: Do ECG foundation models beat named measurements on one-year mortality?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: What changes when the encoders also get age, and what limits the result?
    keys: title, sub, hook, tag, eli5, specs, method, results, headline
projects/manuscripts/fed-multicellular-immune: 2 slide(s), deck.title "Fed-Multicellular", order ["main.md"]
  slide 1: kind project; title: Can multicellular immune programs be recovered without sharing cells?
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: Where does multicellularity pay, and what is not solved?
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, headline
projects/manuscripts/hccnet-revision: 2 slide(s), deck.title "HCCNet", order ["main.md"]
  slide 1: kind project; title: Predicting liver cancer from a patient's whole series of surveillance MRI
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: Where does the pre-training gain come from, and what does fusion show?
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, headline
projects/manuscripts/meseret-cirrhosis: 2 slide(s), deck.title "Cirrhosis-CR", order ["main.md"]
  slide 1: kind project; title: What a cirrhosis benchmark loses when its outcome is scored as a class
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: Where is the static ceiling, and what do updated measurements add?
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, headline
projects/manuscripts/raw-pls: 2 slide(s), deck.title "RAW-PLS", order ["main.md"]
  slide 1: kind project; title: RAW-PLS: tensor-PLS for tumours in a different place in every patient
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: What holds against registration, and what did not hold?
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, headline
projects/manuscripts/ward-bttr-crosssubject: 2 slide(s), deck.title "BSA-ECoG", order ["main.md"]
  slide 1: kind project; title: Decoding finger movements in a new patient from other patients' implants
    keys: title, sub, hook, tag, eli5, specs, method, results, mechanism, headline
  slide 2: kind project; title: Does the alignment carry the transfer, and where does it stop?
    keys: title, sub, hook, tag, eli5, specs, method, results, equation, headline
folders with present.yml: 95 of 95
```

## C10 output

```
"Venue" in 54 decks:
    projects/archive/published/2017/icfp-src-abstract (specs.label)
    projects/archive/published/2017/icfp-src-poster (specs.label)
    projects/archive/published/2021/abstract-bci-meeting-2021 (specs.label)
    projects/archive/published/2021/source-localization (specs.label)
    projects/archive/published/2021/volga-finger-trajectories (specs.label)
    projects/archive/published/2022/block-term-tensor-regression (specs.label)
    projects/archive/published/2022/connectivity-iris (specs.label)
    projects/archive/published/2022/extended-bttr-note (specs.label)
    projects/archive/published/2025/fbttr-strategies (specs.label)
    projects/archive/published/2025/fermat (specs.label)
    projects/archive/published/2025/go-bttr (specs.label)
    projects/archive/published/2026/abduction (specs.label)
    projects/archive/published/2026/dongho-ecg-clustering (specs.label)
    projects/archive/published/2026/erp-signatures (specs.label)
    projects/archive/published/2026/glassbox-decision-pipelines (specs.label)
    projects/archive/published/2026/hcc-modality-poster (specs.label)
    projects/archive/published/2026/hccnet-fl (specs.label)
    projects/coauthor/active/flkit (specs.label)
    projects/coauthor/published/2016/chi-household-survival (specs.label)
    projects/coauthor/published/2016/chi-purpose-centric (specs.label)
    projects/coauthor/published/2017/algebraic-effects-compilation (specs.label)
    projects/coauthor/published/2017/http2-best-practices (specs.label)
    projects/coauthor/published/2018/http2-web-performance (specs.label)
    projects/coauthor/published/2023/coordinated-fingers-ecnr (specs.label)
    projects/coauthor/published/2023/ecog-frequency-features (specs.label)
    projects/coauthor/published/2023/modulation-lmp-bci (specs.label)
    projects/coauthor/published/2024/highgamma-event-detection (specs.label)
    projects/coauthor/published/2025/editorial-bigdata-ai-ms (specs.label)
    projects/coauthor/published/2025/pfl-ms-npj (specs.label)
    projects/coauthor/published/2025/proprioception-exoskeleton (specs.label)
    projects/ideas/adapter-format-theory (specs.label)
    projects/ideas/attention-scoped-instructions (specs.label)
    projects/ideas/harmonop (specs.label)
    projects/ideas/hccnet-pathology (specs.label)
    projects/ideas/modality-dropping-btf (specs.label)
    projects/ideas/neurosde (specs.label)
    projects/ideas/pathology-tensor-mil (specs.label)
    projects/ideas/physics-tensor-hcc (specs.label)
    projects/ideas/ssm-longitudinal (specs.label)
    projects/ideas/strokeop (specs.label)
    projects/ideas/xsub-ecog-framework (specs.label)
    projects/manuscripts/btfno (specs.label)
    projects/manuscripts/bttd-source-eeg (specs.label)
    projects/manuscripts/bttn-incident-af (specs.label)
    projects/manuscripts/clinical-hccnet (specs.label)
    projects/manuscripts/covert-applied (specs.label)
    projects/manuscripts/covert-theory (specs.label)
    projects/manuscripts/dries-bttr-ecg (specs.label)
    projects/manuscripts/ecg-readable-substrate (specs.label)
    projects/manuscripts/fed-multicellular-immune (specs.label)
    projects/manuscripts/hccnet-revision (specs.label)
    projects/manuscripts/meseret-cirrhosis (specs.label)
    projects/manuscripts/raw-pls (specs.label)
    projects/manuscripts/ward-bttr-crosssubject (specs.label)
"Authors" in 43 decks:
    projects/active/linfoot-estimator (specs.label)
    projects/archive/published/2017/icfp-src-abstract (specs.label)
    projects/archive/published/2017/icfp-src-poster (specs.label)
    projects/archive/published/2021/abstract-bci-meeting-2021 (specs.label)
    projects/archive/published/2021/source-localization (specs.label)
    projects/archive/published/2021/volga-finger-trajectories (specs.label)
    projects/archive/published/2022/block-term-tensor-regression (specs.label)
    projects/archive/published/2022/connectivity-iris (specs.label)
    projects/archive/published/2022/extended-bttr-note (specs.label)
    projects/archive/published/2025/fbttr-strategies (specs.label)
    projects/archive/published/2025/fermat (specs.label)
    projects/archive/published/2025/go-bttr (specs.label)
    projects/archive/published/2026/abduction (specs.label)
    projects/archive/published/2026/dongho-ecg-clustering (specs.label)
    projects/archive/published/2026/erp-signatures (specs.label)
    projects/archive/published/2026/glassbox-decision-pipelines (specs.label)
    projects/archive/published/2026/hcc-modality-poster (specs.label)
    projects/archive/published/2026/hccnet-fl (specs.label)
    projects/archive/stopped/connectivity-motor-imagery (specs.label)
    projects/coauthor/active/flkit (specs.label)
    projects/coauthor/published/2016/chi-household-survival (specs.label)
    projects/coauthor/published/2016/chi-purpose-centric (specs.label)
    projects/coauthor/published/2017/algebraic-effects-compilation (specs.label)
    projects/coauthor/published/2017/http2-best-practices (specs.label)
    projects/coauthor/published/2018/http2-web-performance (specs.label)
    projects/coauthor/published/2023/coordinated-fingers-ecnr (specs.label)
    projects/coauthor/published/2023/ecog-frequency-features (specs.label)
    projects/coauthor/published/2023/modulation-lmp-bci (specs.label)
    projects/coauthor/published/2024/highgamma-event-detection (specs.label)
    projects/coauthor/published/2025/editorial-bigdata-ai-ms (specs.label)
    projects/coauthor/published/2025/pfl-ms-npj (specs.label)
    projects/coauthor/published/2025/proprioception-exoskeleton (specs.label)
    projects/coauthor/stopped/individual-reference-intervals (specs.label)
    projects/manuscripts/bt-operator-theory (specs.label)
    projects/manuscripts/btfno (specs.label)
    projects/manuscripts/bttd-source-eeg (specs.label)
    projects/manuscripts/bttn-incident-af (specs.label)
    projects/manuscripts/clinical-hccnet (specs.label)
    projects/manuscripts/dries-bttr-ecg (specs.label)
    projects/manuscripts/fed-multicellular-immune (specs.label)
    projects/manuscripts/hccnet-revision (specs.label)
    projects/manuscripts/meseret-cirrhosis (specs.label)
    projects/manuscripts/ward-bttr-crosssubject (specs.label)
"Data" in 32 decks:
    projects/archive/failed/faithful-block-term-layer (specs.label)
    projects/archive/published/2016/bachelor-network-ids (specs.label)
    projects/archive/published/2018/masters-eeg-infotheory (specs.label)
    projects/archive/published/2021/source-localization (specs.label)
    projects/archive/published/2021/volga-finger-trajectories (specs.label)
    projects/archive/published/2022/block-term-tensor-regression (specs.label)
    projects/archive/published/2022/connectivity-iris (specs.label)
    projects/archive/published/2022/extended-bttr-note (specs.label)
    projects/archive/published/2025/fbttr-strategies (specs.label)
    projects/archive/published/2025/fermat (specs.label)
    projects/archive/published/2025/go-bttr (specs.label)
    projects/archive/published/2026/dongho-ecg-clustering (specs.label)
    projects/archive/published/2026/erp-signatures (specs.label)
    projects/archive/published/2026/glassbox-decision-pipelines (specs.label)
    projects/archive/published/2026/hcc-modality-poster (specs.label)
    projects/archive/stopped/connectivity-motor-imagery (specs.label)
    projects/coauthor/published/2023/coordinated-fingers-ecnr (specs.label)
    projects/coauthor/published/2023/ecog-frequency-features (specs.label)
    projects/coauthor/published/2023/modulation-lmp-bci (specs.label)
    projects/ideas/asthma-geo-tensor (specs.label)
    projects/ideas/clinical-ai-eval-artifacts (specs.label)
    projects/ideas/fed-duplication-limits (specs.label)
    projects/ideas/harmonop (specs.label)
    projects/ideas/modality-dropping-btf (specs.label)
    projects/ideas/neurosde (specs.label)
    projects/ideas/pathology-tensor-mil (specs.label)
    projects/ideas/serial-ecg-af (specs.label)
    projects/ideas/ssm-longitudinal (specs.label)
    projects/ideas/strokeop (specs.label)
    projects/manuscripts/fed-multicellular-immune (specs.label)
    projects/manuscripts/meseret-cirrhosis (specs.label)
    projects/manuscripts/ward-bttr-crosssubject (specs.label)
"Stage" in 28 decks:
    projects/active/novel-math-primitives (specs.label)
    projects/archive/published/2017/icfp-src-abstract (specs.label)
    projects/coauthor/stopped/individual-reference-intervals (specs.label)
    projects/ideas/adapter-format-theory (specs.label)
    projects/ideas/asthma-geo-tensor (specs.label)
    projects/ideas/attention-scoped-instructions (specs.label)
    projects/ideas/block-term-nca (specs.label)
    projects/ideas/btd-autoencoder (specs.label)
    projects/ideas/concept-bottleneck-hcc (specs.label)
    projects/ideas/conformal-tensor-factors (specs.label)
    projects/ideas/ecg-af-fair (specs.label)
    projects/ideas/faithful-interpretability-position (specs.label)
    projects/ideas/fed-duplication-limits (specs.label)
    projects/ideas/fed-neural-operators (specs.label)
    projects/ideas/fedbtd (specs.label)
    projects/ideas/federated-protocol-agents (specs.label)
    projects/ideas/fedlink (specs.label)
    projects/ideas/fl-privacy-auditing (specs.label)
    projects/ideas/harmonop (specs.label)
    projects/ideas/hccnet-fl-sweden (specs.label)
    projects/ideas/neurosde (specs.label)
    projects/ideas/paleogenomics-tensor (specs.label)
    projects/ideas/pathology-tensor-mil (specs.label)
    projects/ideas/physics-tensor-hcc (specs.label)
    projects/ideas/quantum-tensor-fl (specs.label)
    projects/ideas/ssm-longitudinal (specs.label)
    projects/ideas/strokeop (specs.label)
    projects/ideas/xsub-ecog-framework (specs.label)
"Code" in 10 decks:
    projects/archive/published/2018/masters-algebraic-subtyping (specs.label)
    projects/coauthor/active/flkit (specs.label)
    projects/coauthor/published/2017/algebraic-effects-compilation (specs.label)
    projects/manuscripts/bt-operator-theory (specs.label)
    projects/manuscripts/btfno (specs.label)
    projects/manuscripts/bttd-source-eeg (specs.label)
    projects/manuscripts/dries-bttr-ecg (specs.label)
    projects/manuscripts/ecg-readable-substrate (specs.label)
    projects/manuscripts/fed-multicellular-immune (specs.label)
    projects/manuscripts/hccnet-revision (specs.label)
"Cohort" in 10 decks:
    projects/archive/published/2026/hccnet-fl (specs.label)
    projects/coauthor/published/2025/pfl-ms-npj (specs.label)
    projects/ideas/cirrhosis-digital-twin (specs.label)
    projects/ideas/concept-bottleneck-hcc (specs.label)
    projects/ideas/ecg-af-fair (specs.label)
    projects/ideas/hccnet-pathology (specs.label)
    projects/ideas/physics-tensor-hcc (specs.label)
    projects/manuscripts/bttn-incident-af (specs.label)
    projects/manuscripts/clinical-hccnet (specs.label)
    projects/manuscripts/hccnet-revision (specs.label)
"nascent, gate pending" in 8 decks:
    projects/ideas/federated-protocol-agents (specs.value)
    projects/ideas/fl-privacy-auditing (specs.value)
    projects/ideas/harmonop (specs.value)
    projects/ideas/hccnet-fl-sweden (specs.value)
    projects/ideas/neurosde (specs.value)
    projects/ideas/physics-tensor-hcc (specs.value)
    projects/ideas/ssm-longitudinal (specs.value)
    projects/ideas/xsub-ecog-framework (specs.value)
"A. Faes, M. Amir Haeri" in 4 decks:
    projects/manuscripts/bt-operator-theory (specs.value)
    projects/manuscripts/btfno (specs.value)
    projects/manuscripts/bttd-source-eeg (specs.value)
    projects/manuscripts/fed-multicellular-immune (specs.value)
"Outcome" in 4 decks:
    projects/archive/failed/faithful-block-term-layer (specs.label)
    projects/archive/failed/fed-faithful-ecg (specs.label)
    projects/archive/failed/jacobian-coupled-blockterm-dp (specs.label)
    projects/archive/stopped/connectivity-motor-imagery (specs.label)
"Target" in 4 decks:
    projects/active/linfoot-estimator (specs.label)
    projects/coauthor/stopped/individual-reference-intervals (specs.label)
    projects/ideas/hccnet-pathology (specs.label)
    projects/manuscripts/bt-operator-theory (specs.label)
"Baselines" in 3 decks:
    projects/ideas/btd-autoencoder (specs.label)
    projects/ideas/harmonop (specs.label)
    projects/ideas/paleogenomics-tensor (specs.label)
"Degree" in 3 decks:
    projects/archive/published/2016/bachelor-network-ids (specs.label)
    projects/archive/published/2018/masters-algebraic-subtyping (specs.label)
    projects/archive/published/2018/masters-eeg-infotheory (specs.label)
"E. Calvo Merino, A. Faes, M.M. Van Hulle" in 3 decks:
    projects/coauthor/published/2023/ecog-frequency-features (specs.value)
    projects/coauthor/published/2023/modulation-lmp-bci (specs.value)
    projects/coauthor/published/2024/highgamma-event-detection (specs.value)
"Form" in 3 decks:
    projects/archive/published/2017/icfp-src-abstract (specs.label)
    projects/archive/published/2017/icfp-src-poster (specs.label)
    projects/archive/published/2021/abstract-bci-meeting-2021 (specs.label)
"A. Faes" in 2 decks:
    projects/archive/published/2026/glassbox-decision-pipelines (specs.value)
    projects/manuscripts/ecg-readable-substrate (specs.value)
"A. Faes, M. Fahimi Hnazaee, M. Van Hulle" in 2 decks:
    projects/archive/published/2021/abstract-bci-meeting-2021 (specs.value)
    projects/archive/stopped/connectivity-motor-imagery (specs.value)
"A. Faes, M.M.J. Guichelaar, ..., M. Amir Haeri" in 2 decks:
    projects/archive/published/2026/hcc-modality-poster (specs.value)
    projects/archive/published/2026/hccnet-fl (specs.value)
"Benchmark" in 2 decks:
    projects/ideas/old-charges-stemmatology (specs.label)
    projects/manuscripts/btfno (specs.label)
"Causal Graphical Modelling of Functional Connectivity from Reconstructed EEG Sources" in 2 decks:
    projects/archive/published/2021/abstract-bci-meeting-2021 (sub)
    projects/archive/stopped/connectivity-motor-imagery (sub)
"Cohorts" in 2 decks:
    projects/manuscripts/dries-bttr-ecg (specs.label)
    projects/manuscripts/ecg-readable-substrate (specs.label)
"Comput. Biol. Med., under review" in 2 decks:
    projects/manuscripts/ecg-readable-substrate (specs.value)
    projects/manuscripts/meseret-cirrhosis (specs.value)
"Compute" in 2 decks:
    projects/active/loewner (specs.label)
    projects/ideas/conformal-tensor-factors (specs.label)
"Corpora" in 2 decks:
    projects/coauthor/published/2018/http2-web-performance (specs.label)
    projects/ideas/engram (specs.label)
"de-risking" in 2 decks:
    projects/ideas/pathology-tensor-mil (specs.value)
    projects/ideas/strokeop (specs.value)
"de-risking, gate pending" in 2 decks:
    projects/ideas/adapter-format-theory (specs.value)
    projects/ideas/fed-duplication-limits (specs.value)
"High-gamma band event detection improves stability of finger trajectories decoded from ECoG-LMP activity" in 2 decks:
    projects/coauthor/published/2023/modulation-lmp-bci (sub)
    projects/coauthor/published/2024/highgamma-event-detection (sub)
"Horizons" in 2 decks:
    projects/ideas/concept-bottleneck-hcc (specs.label)
    projects/ideas/physics-tensor-hcc (specs.label)
"ICFP 2017 Student Research Competition" in 2 decks:
    projects/archive/published/2017/icfp-src-abstract (specs.value)
    projects/archive/published/2017/icfp-src-poster (specs.value)
"Measured" in 2 decks:
    projects/archive/failed/ms-lipid-handshake (tag.text)
    projects/archive/phd/phd-thesis (tag.text)
"Medical Image Analysis or IEEE TMI" in 2 decks:
    projects/ideas/hccnet-pathology (specs.value)
    projects/ideas/physics-tensor-hcc (specs.value)
"nascent, exploring" in 2 decks:
    projects/ideas/concept-bottleneck-hcc (specs.value)
    projects/ideas/fed-neural-operators (specs.value)
"nascent, speculative" in 2 decks:
    projects/ideas/asthma-geo-tensor (specs.value)
    projects/ideas/paleogenomics-tensor (specs.value)
"Setup" in 2 decks:
    projects/coauthor/published/2017/http2-best-practices (specs.label)
    projects/ideas/brecht-fl-partitioning (specs.label)
"stopped" in 2 decks:
    projects/coauthor/stopped/individual-reference-intervals (specs.value)
    projects/ideas/fedbtd (specs.value)
"Supervision" in 2 decks:
    projects/archive/published/2018/masters-algebraic-subtyping (specs.label)
    projects/archive/published/2018/masters-eeg-infotheory (specs.label)
"Towards a Core Language with Row-Based Effects for Optimised Compilation" in 2 decks:
    projects/archive/published/2017/icfp-src-abstract (sub)
    projects/archive/published/2017/icfp-src-poster (sub)
lines repeated across decks: 36
```

## `diff -rq` of every `present/` folder against its base copy

```
Only in projects/active/eeg-saad-challenge/present: main.md
Only in projects/active/eeg-saad-challenge/present: present.yml
Only in projects/active/linfoot-estimator/present: engine_shapes.png
Only in projects/active/linfoot-estimator/present: main.md
Only in projects/active/linfoot-estimator/present: present.yml
Only in projects/active/loewner/present: main.md
Only in projects/active/loewner/present: present.yml
Only in projects/active/novel-math-primitives/present: main.md
Only in projects/active/novel-math-primitives/present: present.yml
Only in projects/active/sandpile-operator/present: main.md
Only in projects/active/sandpile-operator/present: present.yml
Only in projects/active/sandpile-operator/present: rollout.png
Only in projects/archive/failed/faithful-block-term-layer/present: main.md
Only in projects/archive/failed/faithful-block-term-layer/present: present.yml
Files projects/archive/failed/fed-faithful-ecg/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/archive/failed/fed-faithful-ecg/present/main.md differ
Files projects/archive/failed/fed-faithful-ecg/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/archive/failed/fed-faithful-ecg/present/present.yml differ
Only in projects/archive/failed/jacobian-coupled-blockterm-dp/present: main.md
Only in projects/archive/failed/jacobian-coupled-blockterm-dp/present: present.yml
Only in projects/archive/failed/ms-lipid-handshake/present: main.md
Only in projects/archive/failed/ms-lipid-handshake/present: present.yml
Only in projects/archive/failed/ms-lipid-handshake/present: within_cohort_macnair.png
Only in projects/archive/phd/phd-thesis/present: main.md
Only in projects/archive/phd/phd-thesis/present: present.yml
Only in projects/archive/published/2016/bachelor-network-ids/present: main.md
Only in projects/archive/published/2016/bachelor-network-ids/present: present.yml
Only in projects/archive/published/2017/icfp-src-abstract/present: main.md
Only in projects/archive/published/2017/icfp-src-abstract/present: present.yml
Only in projects/archive/published/2017/icfp-src-poster/present: main.md
Only in projects/archive/published/2017/icfp-src-poster/present: present.yml
Only in projects/archive/published/2018/masters-algebraic-subtyping/present: main.md
Only in projects/archive/published/2018/masters-algebraic-subtyping/present: present.yml
Only in projects/archive/published/2018/masters-eeg-infotheory/present: main.md
Only in projects/archive/published/2018/masters-eeg-infotheory/present: present.yml
Only in projects/archive/published/2021/abstract-bci-meeting-2021/present: main.md
Only in projects/archive/published/2021/abstract-bci-meeting-2021/present: present.yml
Only in projects/archive/published/2021/source-localization/present: main.md
Only in projects/archive/published/2021/source-localization/present: present.yml
Only in projects/archive/published/2021/source-localization/present: sparsity-acc-spread_norm.png
Only in projects/archive/published/2021/volga-finger-trajectories/present: main.md
Only in projects/archive/published/2021/volga-finger-trajectories/present: present.yml
Only in projects/archive/published/2022/block-term-tensor-regression/present: image10.png
Only in projects/archive/published/2022/block-term-tensor-regression/present: main.md
Only in projects/archive/published/2022/block-term-tensor-regression/present: present.yml
Only in projects/archive/published/2022/connectivity-iris/present: main.md
Only in projects/archive/published/2022/connectivity-iris/present: present.yml
Only in projects/archive/published/2022/extended-bttr-note/present: ebttr_fig.jpeg
Only in projects/archive/published/2022/extended-bttr-note/present: main.md
Only in projects/archive/published/2022/extended-bttr-note/present: present.yml
Only in projects/archive/published/2025/fbttr-strategies/present: main.md
Only in projects/archive/published/2025/fbttr-strategies/present: model.png
Only in projects/archive/published/2025/fbttr-strategies/present: present.yml
Only in projects/archive/published/2025/fermat/present: main.md
Only in projects/archive/published/2025/fermat/present: present.yml
Only in projects/archive/published/2025/go-bttr/present: gobttr.jpeg
Only in projects/archive/published/2025/go-bttr/present: main.md
Only in projects/archive/published/2025/go-bttr/present: present.yml
Only in projects/archive/published/2026/abduction/present: main.md
Only in projects/archive/published/2026/abduction/present: present.yml
Only in projects/archive/published/2026/abduction/present: raw_signal.png
Files projects/archive/published/2026/dongho-ecg-clustering/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/archive/published/2026/dongho-ecg-clustering/present/main.md differ
Files projects/archive/published/2026/dongho-ecg-clustering/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/archive/published/2026/dongho-ecg-clustering/present/present.yml differ
Only in projects/archive/published/2026/erp-signatures/present: main.md
Only in projects/archive/published/2026/erp-signatures/present: present.yml
Only in projects/archive/published/2026/glassbox-decision-pipelines/present: main.md
Only in projects/archive/published/2026/glassbox-decision-pipelines/present: present.yml
Only in projects/archive/published/2026/hcc-modality-poster/present: main.md
Only in projects/archive/published/2026/hcc-modality-poster/present: present.yml
Files projects/archive/published/2026/hccnet-fl/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/archive/published/2026/hccnet-fl/present/main.md differ
Files projects/archive/published/2026/hccnet-fl/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/archive/published/2026/hccnet-fl/present/present.yml differ
Only in projects/archive/stopped/algebraic-subtyping/present: main.md
Only in projects/archive/stopped/algebraic-subtyping/present: present.yml
Only in projects/archive/stopped/connectivity-motor-imagery/present: main.md
Only in projects/archive/stopped/connectivity-motor-imagery/present: present.yml
Only in projects/coauthor/active/flkit/present: main.md
Only in projects/coauthor/active/flkit/present: present.yml
Only in projects/coauthor/published/2016/chi-household-survival/present: main.md
Only in projects/coauthor/published/2016/chi-household-survival/present: present.yml
Only in projects/coauthor/published/2016/chi-purpose-centric/present: main.md
Only in projects/coauthor/published/2016/chi-purpose-centric/present: present.yml
Only in projects/coauthor/published/2017/algebraic-effects-compilation/present: main.md
Only in projects/coauthor/published/2017/algebraic-effects-compilation/present: present.yml
Only in projects/coauthor/published/2017/http2-best-practices/present: main.md
Only in projects/coauthor/published/2017/http2-best-practices/present: present.yml
Only in projects/coauthor/published/2018/http2-web-performance/present: main.md
Only in projects/coauthor/published/2018/http2-web-performance/present: present.yml
Only in projects/coauthor/published/2023/coordinated-fingers-ecnr/present: main.md
Only in projects/coauthor/published/2023/coordinated-fingers-ecnr/present: present.yml
Only in projects/coauthor/published/2023/ecog-frequency-features/present: main.md
Only in projects/coauthor/published/2023/ecog-frequency-features/present: present.yml
Only in projects/coauthor/published/2023/modulation-lmp-bci/present: main.md
Only in projects/coauthor/published/2023/modulation-lmp-bci/present: present.yml
Only in projects/coauthor/published/2024/highgamma-event-detection/present: main.md
Only in projects/coauthor/published/2024/highgamma-event-detection/present: present.yml
Only in projects/coauthor/published/2025/editorial-bigdata-ai-ms/present: main.md
Only in projects/coauthor/published/2025/editorial-bigdata-ai-ms/present: present.yml
Only in projects/coauthor/published/2025/pfl-ms-npj/present: main.md
Only in projects/coauthor/published/2025/pfl-ms-npj/present: present.yml
Only in projects/coauthor/published/2025/proprioception-exoskeleton/present: main.md
Only in projects/coauthor/published/2025/proprioception-exoskeleton/present: present.yml
Only in projects/coauthor/stopped/individual-reference-intervals/present: main.md
Only in projects/coauthor/stopped/individual-reference-intervals/present: present.yml
Only in projects/ideas/adapter-format-theory/present: main.md
Only in projects/ideas/adapter-format-theory/present: present.yml
Only in projects/ideas/asthma-geo-tensor/present: main.md
Only in projects/ideas/asthma-geo-tensor/present: present.yml
Only in projects/ideas/attention-scoped-instructions/present: main.md
Only in projects/ideas/attention-scoped-instructions/present: present.yml
Only in projects/ideas/block-term-nca/present: main.md
Only in projects/ideas/block-term-nca/present: present.yml
Only in projects/ideas/brecht-fl-partitioning/present: main.md
Only in projects/ideas/brecht-fl-partitioning/present: present.yml
Files projects/ideas/btd-autoencoder/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/btd-autoencoder/present/main.md differ
Files projects/ideas/btd-autoencoder/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/btd-autoencoder/present/present.yml differ
Only in projects/ideas/cirrhosis-digital-twin/present: main.md
Only in projects/ideas/cirrhosis-digital-twin/present: present.yml
Files projects/ideas/clinical-ai-eval-artifacts/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/clinical-ai-eval-artifacts/present/main.md differ
Files projects/ideas/clinical-ai-eval-artifacts/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/clinical-ai-eval-artifacts/present/present.yml differ
Only in projects/ideas/concept-bottleneck-hcc/present: main.md
Only in projects/ideas/concept-bottleneck-hcc/present: present.yml
Only in projects/ideas/conformal-tensor-factors/present: main.md
Only in projects/ideas/conformal-tensor-factors/present: present.yml
Files projects/ideas/ecg-af-fair/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/ecg-af-fair/present/main.md differ
Files projects/ideas/ecg-af-fair/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/ecg-af-fair/present/present.yml differ
Only in projects/ideas/engram/present: main.md
Only in projects/ideas/engram/present: present.yml
Only in projects/ideas/faithful-interpretability-position/present: main.md
Only in projects/ideas/faithful-interpretability-position/present: present.yml
Only in projects/ideas/fed-duplication-limits/present: main.md
Only in projects/ideas/fed-duplication-limits/present: present.yml
Only in projects/ideas/fed-neural-operators/present: main.md
Only in projects/ideas/fed-neural-operators/present: present.yml
Only in projects/ideas/fedbtd/present: main.md
Only in projects/ideas/fedbtd/present: present.yml
Only in projects/ideas/federated-protocol-agents/present: main.md
Only in projects/ideas/federated-protocol-agents/present: present.yml
Only in projects/ideas/fedlink/present: main.md
Only in projects/ideas/fedlink/present: present.yml
Files projects/ideas/fl-privacy-auditing/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/fl-privacy-auditing/present/main.md differ
Files projects/ideas/fl-privacy-auditing/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/fl-privacy-auditing/present/present.yml differ
Files projects/ideas/florank-personalization/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/florank-personalization/present/main.md differ
Files projects/ideas/florank-personalization/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/florank-personalization/present/present.yml differ
Only in projects/ideas/harmonop/present: main.md
Only in projects/ideas/harmonop/present: present.yml
Files projects/ideas/hccnet-fl-sweden/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/hccnet-fl-sweden/present/main.md differ
Files projects/ideas/hccnet-fl-sweden/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/hccnet-fl-sweden/present/present.yml differ
Files projects/ideas/hccnet-pathology/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/hccnet-pathology/present/main.md differ
Files projects/ideas/hccnet-pathology/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/hccnet-pathology/present/present.yml differ
Only in projects/ideas/modality-dropping-btf/present: main.md
Only in projects/ideas/modality-dropping-btf/present: present.yml
Only in projects/ideas/multiway-biosignal-fm/present: main.md
Only in projects/ideas/multiway-biosignal-fm/present: present.yml
Only in projects/ideas/neurosde/present: main.md
Only in projects/ideas/neurosde/present: present.yml
Only in projects/ideas/old-charges-stemmatology/present: main.md
Only in projects/ideas/old-charges-stemmatology/present: present.yml
Only in projects/ideas/paleogenomics-tensor/present: main.md
Only in projects/ideas/paleogenomics-tensor/present: present.yml
Only in projects/ideas/pathology-tensor-mil/present: main.md
Only in projects/ideas/pathology-tensor-mil/present: present.yml
Only in projects/ideas/physics-tensor-hcc/present: main.md
Only in projects/ideas/physics-tensor-hcc/present: present.yml
Files projects/ideas/quantum-tensor-fl/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/quantum-tensor-fl/present/main.md differ
Files projects/ideas/quantum-tensor-fl/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/quantum-tensor-fl/present/present.yml differ
Only in projects/ideas/serial-ecg-af/present: main.md
Only in projects/ideas/serial-ecg-af/present: present.yml
Files projects/ideas/ssm-longitudinal/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/ssm-longitudinal/present/main.md differ
Files projects/ideas/ssm-longitudinal/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/ideas/ssm-longitudinal/present/present.yml differ
Only in projects/ideas/strokeop/present: main.md
Only in projects/ideas/strokeop/present: present.yml
Only in projects/ideas/xsub-ecog-framework/present: main.md
Only in projects/ideas/xsub-ecog-framework/present: present.yml
Files projects/manuscripts/bt-operator-theory/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/bt-operator-theory/present/main.md differ
Files projects/manuscripts/bt-operator-theory/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/bt-operator-theory/present/present.yml differ
Only in projects/manuscripts/btfno/present: fig_mechanism.png
Files projects/manuscripts/btfno/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/btfno/present/main.md differ
Files projects/manuscripts/btfno/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/btfno/present/present.yml differ
Only in projects/manuscripts/bttd-source-eeg/present: fig2_source_maps.png
Files projects/manuscripts/bttd-source-eeg/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/bttd-source-eeg/present/main.md differ
Files projects/manuscripts/bttd-source-eeg/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/bttd-source-eeg/present/present.yml differ
Only in projects/manuscripts/bttd-source-eeg/present: real_contralateral.png
Only in projects/manuscripts/bttn-incident-af/present: bttn_interpret.png
Files projects/manuscripts/bttn-incident-af/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/bttn-incident-af/present/main.md differ
Only in projects/manuscripts/bttn-incident-af/present: pipeline_overview.png
Files projects/manuscripts/bttn-incident-af/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/bttn-incident-af/present/present.yml differ
Only in projects/manuscripts/clinical-hccnet/present: fusion_over_time.png
Only in projects/manuscripts/clinical-hccnet/present: main.md
Only in projects/manuscripts/clinical-hccnet/present: present.yml
Only in projects/manuscripts/clinical-hccnet/present: sequences_by_horizon.png
Files projects/manuscripts/covert-applied/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/covert-applied/present/main.md differ
Files projects/manuscripts/covert-applied/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/covert-applied/present/present.yml differ
Files projects/manuscripts/covert-theory/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/covert-theory/present/main.md differ
Files projects/manuscripts/covert-theory/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/covert-theory/present/present.yml differ
Only in projects/manuscripts/dries-bttr-ecg/present: forest_auroc.png
Only in projects/manuscripts/dries-bttr-ecg/present: interpret_afsr_afibonly_blocks.png
Files projects/manuscripts/dries-bttr-ecg/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/dries-bttr-ecg/present/main.md differ
Files projects/manuscripts/dries-bttr-ecg/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/dries-bttr-ecg/present/present.yml differ
Files projects/manuscripts/ecg-readable-substrate/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/ecg-readable-substrate/present/main.md differ
Files projects/manuscripts/ecg-readable-substrate/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/ecg-readable-substrate/present/present.yml differ
Files projects/manuscripts/fed-multicellular-immune/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/fed-multicellular-immune/present/main.md differ
Files projects/manuscripts/fed-multicellular-immune/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/fed-multicellular-immune/present/present.yml differ
Only in projects/manuscripts/hccnet-revision/present: calibration.png
Only in projects/manuscripts/hccnet-revision/present: figure_outline.png
Files projects/manuscripts/hccnet-revision/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/hccnet-revision/present/main.md differ
Files projects/manuscripts/hccnet-revision/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/hccnet-revision/present/present.yml differ
Only in projects/manuscripts/meseret-cirrhosis/present: fig_simulation.png
Files projects/manuscripts/meseret-cirrhosis/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/meseret-cirrhosis/present/main.md differ
Files projects/manuscripts/meseret-cirrhosis/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/meseret-cirrhosis/present/present.yml differ
Only in projects/manuscripts/raw-pls/present: fig2_results.png
Files projects/manuscripts/raw-pls/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/raw-pls/present/main.md differ
Files projects/manuscripts/raw-pls/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/raw-pls/present/present.yml differ
Files projects/manuscripts/ward-bttr-crosssubject/present/main.md and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/ward-bttr-crosssubject/present/main.md differ
Only in projects/manuscripts/ward-bttr-crosssubject/present: pipeline_flowchart.png
Files projects/manuscripts/ward-bttr-crosssubject/present/present.yml and /Users/axelfaes/workspace/research-hub/.agents/worktrees/O151-hub-base/projects/manuscripts/ward-bttr-crosssubject/present/present.yml differ
```

## Every changed line

Generated with `diff -U0 <before-state> <deck>` per deck: a line beginning `-` is the line before this round, a line beginning `+` the line now. The source of each line is given above the record: a `+` line that is a shortening or a recombination of `-` lines takes its source from those lines, as checked per deck in "# Round 1"; a line carrying a number no `-` line had is from the live source named under "Up to date" (the `comm -23` check under "Per deck"). A deck with no changed line has an empty block.

### eeg-saad-challenge

```diff
-title: 'Decoding which talker a listener attends to, on EEG datasets the model has never seen'
+title: 'Decoding which talker a listener attends to, across unseen EEG datasets'
-hook: 'The challenge''s own framing is that most attention-decoding results are single-dataset and that deep models exploit dataset-specific shortcuts; the benchmark trains on five public sets and scores blind on two held-out ones with new subjects, stimuli, setups and in-trial attention switches.'
+hook: 'Train on five public sets; score blind on two with new subjects, stimuli, setups and in-trial attention switches.'
-  plain: 'Train a decoder on five public brain-recording collections, then let the organizers test it on two secret ones; the score rewards both being right and noticing quickly when the listener switches voices.'
+  plain: 'Train on five public collections; the organizers test on two secret ones, scoring accuracy and how fast a switch is noticed.'
-  - { label: 'Stage', value: 'exploring; not registered' }
-equation: 'H = \frac{2\,\mathrm{Acc}\cdot L}{\mathrm{Acc} + L}, \qquad \text{per switch } e^{-|\tau^* - t_0|/60}'
-  - 'Planned: a multilinear (channel, time, frequency) decoder with mode-wise factors shared across datasets.'
-  - 'Switch detection as a change-point problem on the decoder statistic, since the score charges latency directly.'
-  - 'A learned montage map for BioSemi 64, NeuroScan 64 and 255-channel high-density sets.'
-  - 'Open choice: decode direction or the attended envelope; the organizers warn that spatial decoding can ride on eye gaze.'
+  - 'Planned: a multilinear decoder with mode-wise factors shared across datasets and a learned map for BioSemi 64, NeuroScan 64 and 255-channel sets.'
+  - 'Switch detection as change-point on the decoder statistic; $H = 2\,\mathrm{Acc}\,L/(\mathrm{Acc}+L)$, per switch $e^{-|\tau^*-t_0|/60}$.'
-  - 'No results: not registered, no data staged, no code.'
-  - 'First number: linear stimulus reconstruction plus causal HMM, leave-one-dataset-out.'
-  - 'Bar: the organizers expect linear stimulus reconstruction to transfer better than deep models; a structured model has to beat it on held-out datasets.'
+  - 'No results: not registered, no data staged, no code. First number: linear stimulus reconstruction plus causal HMM, leave-one-dataset-out.'
+  - 'Bar: organizers expect linear reconstruction to transfer better than deep models; a structured model must beat it on held-out data.'
+  - 'Rules: at most 1000 ms lookahead; no test-time adaptation; 2 test submissions, the last counts. KUL 2.1 corrects a 70 ms misalignment in 2.0.'
-
----
-kind: columns
----
-# The rules the decoder must meet, and the data it must transfer across
-
-### Rules
-
-- At most 1000 ms lookahead per labelled sample, counting every lag in every step.
-- No test-time adaptation and no use of dataset, subject or trial identity.
-- One binary label per sample at 128 Hz; at most 2 test submissions, and the last one counts.
-- Top-five entries are reproduced and rule-checked by the organizers.
-
-|||
-
-### Data
-
-- Three languages (Danish, Dutch, Chinese) and two amplifier systems across the five training sets.
-- Only 64 of the 255 high-density channels may be used, at train and test.
-- KUL must be version 2.1, which corrects a 70 ms EEG-stimulus misalignment in 2.0.
-- The 255-channel record names a SynAmps RT device where the challenge page lists BioSemi, so channel maps come from the files.
----
```

### linfoot-estimator

```diff
-title: 'A pretrained Linfoot estimator made invariant to what the estimand is invariant to'
-sub: 'Towards a pretrained deep learning estimator of the Linfoot informational correlation'
-hook: 'The published estimator reads raw values and trains on two positively dependent copula families, so a monotone change of margins moves its estimate and reversed dependence breaks it; rank input, the eight symmetries of the square and a generator of exact-label shapes remove both failures.'
+title: 'A Linfoot estimator invariant to what the estimand is invariant to'
+sub: 'A Pretrained Rank-Based Estimator of the Linfoot Informational Correlation'
+hook: 'Exactly invariant to strictly increasing marginal maps and the eight symmetries of the square, through ranks and averaging.'
-  plain: 'Turn the values into ranks so stretching an axis changes nothing, average over flips and turns of the square, and train on an endless supply of invented shapes whose true answer is known exactly.'
+  plain: 'Turn values into ranks so stretching an axis changes nothing, average over flips and turns, and train on shapes with exact answers.'
-  - { label: 'Lead', value: 'St<e acute>phanie van den Berg; Axel Faes coauthor' }
-  - { label: 'Preprint', value: 'arXiv:2512.12358, arXiv only' }
-  - { label: 'Estimator', value: 'ParamPL0z' }
-  - { label: 'Stage', value: 'exploring; IEEEtran draft for IEEE TNNLS next' }
-equation: 'L = \sqrt{1 - e^{-2I(X;Y)}}'
+  - { label: 'Authors', value: 'A. Faes, S.M. van den Berg, ..., J. von B. Hjelmborg' }
+  - { label: 'Target', value: 'IEEE TNNLS, in preparation' }
+  - { label: 'Preprint', value: 'arXiv:2512.12358' }
-  - 'Ranks are the maximal invariant under monotone margins, so feeding them makes marginal invariance exact.'
-  - 'Averaging over the eight symmetries of the square makes negative dependence as accurate as positive.'
-  - 'Label engine: random smooth log-densities projected to uniform margins by Sinkhorn scaling, with exact labels and exact samples.'
-  - 'ParamPL0z gates five maximum pseudo-likelihood copula starts, its own estimate and a start fixed at 0, then applies a logit correction.'
+  - 'Starts: four maximum pseudo-likelihood copula fits, normal-scores correlation, own estimate, a start fixed at zero; softmax gate, logit-scale correction.'
+  - 'A CNN on rank histograms, trained by squared error on a mixture of three simulated training sets with exact labels, a tenth independent samples.'
-  - '12-family test: ParamPL0z 0.0548 against 0.0714 for the published estimator (paired $-0.0166$ $[-0.0203, -0.0130]$); the published one is lower on none of 26 groups.'
-  - 'Largest change on reflected and rotated copies $2.38 \times 10^{-7}$, against 1.00 for the published estimator.'
-  - 'Under reversed or rotated association 0.0491 to 0.0554, where the published estimator reads 0.6028 to 0.6029.'
-  - 'The published pipeline is ported to Python and reproduces the preprint''s Table 1 column in all 24 cells to within 0.0063.'
-panels:
-  - { figure: engine_shapes.png, caption: 'The preprint''s two families and 18 draws from the label engine', explain: 'Every engine label is exact; 12 of the 18 draws fall rather than rise, and 8 carry a label above 0.4 while a rank correlation reads under 0.25.' }
-mechanism: 'Rank input, D4 averaging and gated parametric starts'
-headline: 'Pooled error 0.0548 against 0.0714 on the 12 families'
+  - 'Pooled RMSE 0.0544 and 0.0539 on 12 VineCopula families, against 0.0714 and 0.0708 published; paired $-0.0169$ $[-0.0206, -0.0133]$ and $[-0.0207, -0.0133]$.'
+  - 'Lowest of ten columns, next KSG on ranks 0.0650 and 0.0651, every other column''s paired interval above; lower on seven of 12 families.'
+  - 'Every scored family is inside the training prior. Reversed, rotated, reflected 0.0250 to 0.0553 against 0.4487 to 0.6029 for the published estimator.'
+mechanism: 'Rank input, symmetry averaging and gated parametric starts'
+headline: 'Pooled RMSE 0.0544 and 0.0539 against 0.0714 and 0.0708 on the 12 families'
-kind: columns
+kind: project
+title: 'Where the published estimator is lower, and which routes are closed'
+sub: 'Independent samples, measured departure, closed routes, runs in progress and credit'
+hook: 'On independent samples the published estimator is lower, 0.0537 against 0.0566.'
+tag: { class: mixed, text: 'Limits and closed routes' }
+eli5:
+  purpose: 'Where the new estimator does not help; ideas set aside.'
+  plain: 'The published estimator is lower on independent samples.'
+specs:
+  - { label: 'Port', value: 'Table 1 reproduced within 0.0063' }
+  - { label: 'Departure', value: 'at most $2.38 \times 10^{-7}$' }
+  - { label: 'Backbone bias ratio', value: '2.13 to 1.65' }
+method:
+  - 'Departure from invariance measured on exact images.'
+results:
+  - 'Closed: an operator backbone, not built; reshaping the label prior; six levers against the accuracy floor. Held-out family and equal-training-data runs are in progress.'
+  - 'The Linfoot estimand and Propositions 2.1 and 2.2 with the Clayton closed form are the preprint authors''.'
+equation: 'L = \sqrt{1 - e^{-2I(X;Y)}}'
+headline: 'On independent samples the published estimator is lower, 0.0537 against 0.0566'
-# Closed routes, credit and prior work
-
-### Closed routes
-
-- An operator backbone: on the 480k-example model the fine-structure bias ratio fell from 2.13 to 1.65 and error turned scatter-dominated, so it is not built.
-- Reshaping the label prior trades error between dependence bands; four arms all land within 0.001 of 0.062 overall.
-- Six levers against the accuracy floor; only a finer input resolution moved it, by 1.8 percent.
-- MIST cannot be scored on bivariate data: its released weights read about 0.33 nats where the truth is 0.
-
-|||
-
-### Credit, prior work and the classical panel
-
-- The Linfoot estimand, Proposition 2.1 and Proposition 2.2 with the Clayton closed form are the preprint authors'; no contribution of this work is in the paper yet, and the new draft is the preprint's successor.
-- Supervised amortised MI estimation is published (MIST, InfoNet, InfoAtlas, ALICE); none of their abstracts uses rank histograms, exact group invariance, several training priors, gating or parametric starts.
-- Against six classical estimators and MINE, the August estimator read 0.0624 pooled against 0.0799 for the best classical one, unchanged under four monotone transforms that moved raw-value estimators by 0.0142 to 0.2501.
-- The twin data sit with the SDU coauthors; the twin-application script, which they can run with this model, is verified end to end on surrogate pairs.
----
```

### loewner

```diff
-hook: 'A Loewner construction builds a rational model from sampled responses; the question is whether letting task gradients reach that construction gives a distinct learning algorithm with better reconstruction or perturbation behaviour at matched cost.'
+hook: 'Does letting task gradients reach a Loewner construction give a distinct learning algorithm at matched cost?'
-  plain: 'A classical recipe turns measured responses into a small exact formula; the layer learns, across many examples, how to clean the measurements first so the formula comes out better.'
+  plain: 'A classical recipe turns measured responses into a small exact formula; the layer learns how to clean the measurements first.'
-  - { label: 'Stage', value: 'scoping; algorithm development' }
-equation: 'v_{\text{next}} = v - \eta\,\big[W + \beta D_r(v)^{\top} D_r(v) + \epsilon I\big]^{-1} \nabla F(v; y)'
-  - 'Correct $v$ with the step above, $W$ the observation precision and $D_r = \partial R_r / \partial v$; step sizes, metric weights and penalty schedules are shared trainable parameters.'
-  - 'Outer loss: query reconstruction plus a first-order noise risk $\mathrm{tr}(J_y \Sigma J_y^{\top})$.'
-  - 'Open deliverable: an efficient Loewner-structured derivative and adjoint inside the correction.'
+  - 'Correct by $v_{\text{next}} = v - \eta[W + \beta D_r^{\top} D_r + \epsilon I]^{-1} \nabla F(v; y)$; steps and weights are trainable.'
+  - 'Outer loss: query reconstruction plus noise risk $\mathrm{tr}(J_y \Sigma J_y^{\top})$. Open: an efficient Loewner-structured derivative and adjoint.'
-  - 'No experiments have run, and code/ holds only its README.'
-  - 'Occupied: differentiable rational approximation, neural rational filtering and low-rank Loewner response fitting.'
-  - 'First number: a matched local synthetic pilot against direct rational filter learning.'
-  - 'Novelty and usefulness remain unestablished; there is no implementation, manuscript or selected venue.'
+  - 'No experiments have run; code/ holds only its README; no implementation, manuscript or venue. Novelty and usefulness remain unestablished.'
+  - 'Occupied: differentiable rational approximation, neural rational filtering, low-rank Loewner fitting; a Loewner divided-difference matrix already appears in ML.'
+  - 'First number: a matched local synthetic pilot (orders 4 and 8, 16 or 32 observed nodes, 3 seeds) against direct rational filter learning.'
-
----
-kind: columns
----
-# The planned pilot, its assumptions, and the claims the audit rules out
-
-### Synthetic pilot and assumptions
-
-- Scalar discrete-time responses from stable simple poles, split 512, 128, 256 before sampling; orders 4 and 8, 16 or 32 observed nodes, 256 query nodes, 3 seeds.
-- Comparators: plain and noise-weighted Loewner fitting, a matched pole/residue network, a regularized direct rational fitter and a generic corrector.
-- Score: normalized squared complex error on held-out queries, with paired intervals across systems and seeds.
-- For nonsingular $E$, Loewner coordinates need not enlarge the rational family; singular descriptors and repeated poles need separate analysis, and a fixed-rank SVD derivative needs spectral separation.
-
-|||
-
-### Not supported, and not yet compared
-
-- Autodiff through a rational fit, plain low-rank Loewner fitting or a Jacobian penalty does not by itself make a new algorithm.
-- A Loewner divided-difference matrix already appears in neural matrix-function backpropagation, so no first-use claim.
-- Better conditioning of one realization matrix does not prove lower sensitivity of the whole learned map, and ridge regularization does not ensure stable poles.
-- Still to extract before a new objective is claimed: Singh and Sznaier (2020), Gosea and Antoulas (2016), data-driven structured realization, noisy Loewner data-driven control and three 2026 parametric rational-interpolation papers.
----
```

### novel-math-primitives

```diff
-title: 'Mathematical objects machine learning does not use yet, each with a route to a layer'
+title: 'Mathematical objects ML does not use yet, each with a route to a layer'
-hook: 'A new primitive differs from a renamed special case only if it has a differentiable bridge, a separation from what a standard layer represents, and one provable property before any benchmark; this scan maps about 24 ML-empty survivors, each with a first idea for its bridge and its separation, ranked with medical fit.'
+hook: 'A scan of about 24 ML-empty survivors, each with a first idea for its differentiable bridge and its separation.'
-  plain: 'Search for mathematical objects nobody in machine learning uses yet, keep only those that can be made trainable and can do something ordinary layers cannot, and rank them by use in medicine.'
+  plain: 'Search for objects nobody in machine learning uses yet, keep those that can be trained and beat ordinary layers, and rank them by use in medicine.'
-  - 'Frame each one as object, differentiable bridge, separation, then one provable property or toy capability.'
-  - 'Rank the survivors by ML potential and medical fit.'
+  - 'Frame each as object, differentiable bridge, separation, then one provable property or toy capability; rank by ML potential and medical fit.'
-  - 'No code and no manuscript; the gate is to pick one survivor and run the four-step test.'
+  - 'Refuted, already in ML: graph magnitude, Ihara zeta, Schur functors, tensor Z-eigenvalues. Downgraded: matroid bias, holonomy.'
+  - 'No code, no manuscript. Gate: pick one survivor, chip-firing first, and run the four-step test; every claim is re-verified first.'
-
----
-kind: columns
----
-# Earlier finds that failed deeper checks, and what is still to do
-
-### Refuted or downgraded
-
-- Graph magnitude: refuted, now used for generalization bounds, diversity metrics and GNN pooling.
-- Ihara zeta, Schur functors and tensor Z-eigenvalues: refuted, each already in ML.
-- Matroid bias and holonomy: downgraded; differentiable routes already exist.
-- Minkowski tensors are partly mined in biomedical imaging; flag valuations are the unused successor.
-
-|||
-
-### Still to do
-
-- Every "unused in ML" claim is to be re-verified before any first claim in a manuscript.
-- Imaging and the geometry, topology and physics areas are heavily mined, so their survivors are few.
-- Chip-firing and sandpile dynamics converged as the first build candidate.
----
```

### sandpile-operator

```diff
-hook: 'Tumour infiltration, infarct growth and seizure spread move only once a local threshold is crossed and stop at tissue barriers; smooth linear diffusion has no threshold and leaks across barriers, so it cannot represent such fronts.'
+hook: 'Tumour, infarct and seizure fronts cross local thresholds and stop at barriers; smooth diffusion has no threshold and leaks.'
-  - { label: 'Stage', value: 'exploring; no manuscript' }
-equation: '\text{excess} = \tau\,\mathrm{softplus}\!\left(\frac{u - \theta}{\tau}\right)'
-  - 'A small conv head predicts a per-cell threshold field $\theta$; the mass above it is redistributed conservatively to passable neighbours.'
-  - 'Walls stay empty; $\tau$ is learnable, and $\tau \to 0$ recovers the exact hard sandpile.'
-  - 'Applied recurrently from one visit to the next; trained by one-step MSE with backprop through the step.'
+  - 'A conv head predicts thresholds $\theta$; the excess $\tau\,\mathrm{softplus}((u-\theta)/\tau)$ moves conservatively to passable neighbours.'
+  - 'Walls stay empty; $\tau$ is learnable, $\tau \to 0$ recovers the exact hard sandpile; applied recurrently, trained by one-step MSE.'
-  - 'Rollout MSE 0.003 against 0.233 for linear diffusion (about 77x lower) and 0.169 for a CNN.'
-  - 'Active-region IoU 0.95, 0.82 and 0.47; zero wall mass by construction, while the CNN leaks.'
-  - 'The ground truth comes from the same class of dynamics, so this shows capability only; real-data superiority is the question for stages 1 and 2.'
-panels:
-  - { figure: rollout.png, caption: 'Held-out synthetic medium: arrival step and final mass error', explain: 'Arrival-time maps on top, final mass error below: all models reach a broadly similar region, while diffusion smears the mass magnitude.' }
+  - 'Rollout MSE 0.003 against 0.233 for linear diffusion (about 77x lower) and 0.169 for a CNN; IoU 0.95, 0.82, 0.47; zero wall mass, the CNN leaks.'
+  - 'The ground truth comes from the same class of dynamics, so this shows capability only; the IoU gap is modest, the 77x gap is in the mass magnitude.'
+  - 'ISLES24 first; HCC shrinks under treatment, so the operator must condition on it; liver deformation makes registration an issue.'
-
----
-kind: columns
----
-# What stage 0 does not show, and what the real stages need
-
-### Caveats
-
-- Stage 0 proves representational capability and an inductive-bias advantage over smooth diffusion; real-world superiority is the empirical question for stages 1 and 2.
-- The IoU gap is modest; the 77x gap is in the mass magnitude.
-- The current run_all.sh runs only the local synthetic stage.
-
-|||
-
-### Real stages
-
-- ISLES24 first: the infarct grows from a core with no treatment-shrinkage confound.
-- HCC lesions shrink and recur under TACE, ablation or resection, so the operator must condition on treatment or use surveillance intervals.
-- Liver deformation between visits makes registration a further issue.
-- Method: replace the fixed rollout by a deep-equilibrium fixed point, with longer held-out rollouts and a $\tau$ ablation.
----
```

### faithful-block-term-layer

```diff
-hook: 'BTTN reports a frequency and a lead signature per block; the bet was a theorem that the prediction runs through those signatures with no hidden leakage, and it fails under the nonlinear head that gives BTTN its accuracy.'
+hook: 'The bet was a theorem that prediction runs through the signatures with no leakage; it fails under the nonlinear head.'
-  plain: 'The model only looks through a few named windows, which can be proved; but what it does with what it sees through them is a free nonlinear rule the windows do not describe.'
+  plain: 'The model looks through named windows, which can be proved; what it does with what it sees is a free nonlinear rule.'
-  - { label: 'Stage', value: 'failed' }
-equation: 'Z_k[:,t,:] = A_k^{\top} X[:,t,:]\, C_k, \qquad \hat y = h(Z_1, \dots, Z_K)'
-  - 'Each block projects the input onto a reported frequency signature $A_k$ and lead signature $C_k$; a nonlinear head $h$ predicts.'
-  - 'Faithfulness is split into P1, off-subspace invariance, and P2, signature completeness.'
-  - 'Low rank is tested as a rescue: a leakage bound indexed by $r_f r_l$.'
+  - 'Each block computes $Z_k[:,t,:] = A_k^{\top} X[:,t,:] C_k$ on reported signatures $A_k$, $C_k$; a nonlinear head $h$ predicts.'
+  - 'P1, off-subspace invariance; P2, signature completeness; low rank tested as a rescue, a leakage bound indexed by $r_f r_l$.'
-  - 'P1 holds for any head, by construction; it is the known chi-net and B-cos confinement principle in block-term form.'
-  - 'P2 fails: two models with the same signatures and different heads predict differently, so the signatures under-determine the output.'
-  - 'Low rank bounds frequency-lead leakage by $O(r_f r_l)$, but the full-length nonlinear temporal head escapes the bound.'
-  - 'A clean guarantee forces a linear or energy readout per block, giving up the capacity BTTN needs to match a CNN.'
+  - 'P1 holds for any head, by construction: the known chi-net and B-cos confinement principle in block-term form.'
+  - 'P2 fails: two models with the same signatures and different heads predict differently.'
+  - 'Low rank bounds leakage by $O(r_f r_l)$, but the nonlinear temporal head escapes it; a clean guarantee forces a linear or energy readout.'
+  - 'Fallback set aside: concept-bottleneck literature finds smaller bottlenecks leak more, against the rank-indexed wedge.'
-
----
-kind: columns
----
-# Why the weaker fallback was also set aside
-
-### The trade-off angle
-
-- A faithfulness-capacity frontier with a rank-indexed leakage bound is a narrow open sliver.
-- Its shape is already owned: rate-distortion explanations (Macdonald et al. 2019), limits-of-explainability results, the CEM accuracy-explainability trade-off.
-- A leakage measure for concept bottlenecks already exists.
-
-|||
-
-### The decisive problem
-
-- The concept-bottleneck leakage literature finds the opposite direction: smaller bottlenecks leak more.
-- The wedge claims lower rank leaks less, which would need a contested argument that rank and width are different knobs.
-- The project's own bound is partial, since the temporal head escapes it.
----
```

### fed-faithful-ecg

```diff
-title: 'Does federated averaging break a glass-box ECG model''s explanation? On real ECG it did not'
+title: 'Does federated averaging break a glass-box ECG model''s explanation?'
-hook: 'Block-term components are gauge-ambiguous, so averaging models from different hospitals could blend unrelated components and leave an accurate model with a wrong explanation; a synthetic pilot showed exactly that, and the real two-silo run did not.'
+hook: 'Averaging gauge-ambiguous components could blend unrelated ones; a synthetic pilot showed that, the real two-silo run did not.'
-  plain: 'Each hospital trains a model that shows which part of the heartbeat it used; averaging them was expected to scramble that, but on real ECGs it did not, likely because both hospitals'' heartbeats share the same basic shapes.'
+  plain: 'Each hospital''s model shows which part of the heartbeat it used; averaging was expected to scramble that, on real ECGs it did not.'
-  - { label: 'Stage', value: 'failed' }
-  - 'A shift-add glass-box ECG backbone with a reconstruction term, one client per silo, non-IID and patient-grouped.'
-  - 'Faithfulness by comprehensiveness gap, sufficiency AUROC and intervention consistency.'
+  - 'A shift-add glass-box ECG backbone with a reconstruction term, one client per silo; faithfulness by comprehensiveness, sufficiency and consistency.'
-  - 'Centralized AUROC 0.824, comprehensiveness 0.162, consistency 0.244; FedAvg 0.838, 0.178, 0.468.'
-  - 'FedAvg kept accuracy and kept faithfulness at or above centralized, so there was no gap to fix.'
-  - 'Aligned averaging recovered nothing (0.834, 0.107, 0.341), because there was no gap.'
+  - 'AUROC, comprehensiveness, consistency: centralized 0.824, 0.162, 0.244; FedAvg 0.838, 0.178, 0.468; aligned 0.834, 0.107, 0.341: no gap to fix.'
+  - 'Synthetic pilot, 4 clients, 3 seeds: centralized 0.849, purity 0.940; FedAvg 0.812, 0.585; aligned 0.819, 0.670; it overstated the problem.'
-
----
-kind: columns
----
-# Why the synthetic pilot overstated the problem, and the designs that failed first
-
-### Synthetic pilot, 4 clients, 3 seeds
-
-- Centralized AUROC 0.849, concept purity 0.940, 4.00 of 4 concepts covered.
-- FedAvg 0.812, purity 0.585, 2.00 of 4: accuracy held while faithfulness roughly halved.
-- Aligned averaging 0.819, purity 0.670, 3.00 of 4.
-- The pilot gave each client random unrelated prototypes, which overstated the problem.
-
-|||
-
-### Failed pilot designs
-
-- Attribution-against-ablation correlation on an additive model reads about 1.0 by construction, and rose under FedAvg.
-- A glass-box model on classification loss alone is not concept-identifiable: centralized purity about 0.46, 1 of 4 concepts.
-- Adding a tied-weight reconstruction term fixed that, purity about 0.95.
-- The loaders and the backbone carried forward to later ECG work.
----
```

### jacobian-coupled-blockterm-dp

```diff
-title: 'Can whitened block scores make the inter-block gap lower a block-term model''s DP floor?'
+title: 'Can whitened block scores make the gap lower a block-term DP floor?'
-hook: 'COVERT''s DP floor is generic because sequential deflation makes its coupling Jacobian block-diagonal; releasing whitened scores couples the blocks so the gap enters the floor, and at matched correlation a flat model gains just as much.'
+hook: 'Whitening couples the blocks so the gap enters the DP floor, and at matched correlation a flat model gains just as much.'
-  purpose: 'Find a privacy advantage that only a block-structured model can give, tied to how well its blocks separate.'
-  plain: 'Mixing the blocks'' outputs did make block separation matter for the privacy cost, but a model with no block structure got the same effect, so the gain belonged to the mixing step alone.'
+  purpose: 'Find a privacy advantage only a block-structured model can give.'
+  plain: 'Mixing the blocks'' outputs tied separation to privacy cost; a flat model got the same.'
-  - { label: 'Data', value: 'synthetic standard-normal tensors' }
-  - { label: 'Control', value: 'flat P3LS-style model at matched $\rho$' }
-  - { label: 'Stage', value: 'failed' }
-equation: 'S = T\,G^{-1/2}, \qquad G = T^{\top} T, \qquad t_{r,i} = \langle X_i, A_r B_r^{\top} \rangle'
-  - 'Release the whitened score $S$ in place of the raw block scores $T$; the Jacobian then carries the spectrum of $G$.'
-  - 'Floor $= \lVert J \rVert_F^2$ by finite differences over all factor entries, 12 to 16 seeds.'
-  - 'Utility gate: test $R^2$ is identical raw and whitened, since $G^{-1/2}$ is invertible.'
+  - 'Floor $= \lVert J \rVert_F^2$ by finite differences, 12 to 16 seeds; test $R^2$ is identical raw and whitened.'
-  - 'Raw floor flat in $\rho$ (about 14 at $R=2$, 22 at $R=3$); the whitened floor follows $\rho$.'
-  - 'Below $\rho$ 0.3 the whitened floor is about 16 to 18% lower; it blows up 58 to 67 times at collinearity.'
-  - 'At matched $\rho$, block-term $L=2$ tracks flat: 1.129 against 1.116 at $\rho$ 0.3, 1.715 against 1.753 at 0.6.'
-  - 'Rank sweep $L=1$ to 4: $L \geq 2$ cluster on flat; only $L=1$ dips below 1, at $\rho$ 0.2 (0.988).'
+  - 'Raw floor flat in $\rho$; whitened 58 to 67 times higher at collinearity.'
+  - 'At matched $\rho$, $L=2$ tracks flat: 1.129 against 1.116 at 0.3.'
+  - 'The gap enters only through $G = T^{\top} T$, whatever the weight structure.'
+equation: 'S = T\,G^{-1/2}, \qquad G = T^{\top} T, \qquad t_{r,i} = \langle X_i, A_r B_r^{\top} \rangle'
-
----
-kind: columns
----
-# Where the advantage went once correlation was matched
-
-### Matched-$\rho$ test, $R=2$, 16 seeds
-
-- The first favourable read came from the flat model sitting at a higher $\rho$.
-- White-to-raw floor ratio, flat, $L=1$, $L=2$: 1.066, 0.971, 0.995 at $\rho$ 0.2.
-- Above $\rho$ 0.2 whitening raises the floor for every model.
-- The rank-1 edge, about 3% at $\rho$ 0.2, is gone by 0.3.
-
-|||
-
-### Root cause
-
-- The gap enters only through $G = T^{\top} T$, built from the $R$ scores whatever the weight structure.
-- A flat multi-output model has the same score Gram and the same effect.
-- The within-block multiway structure never enters the coupling.
-- Left open: a model whose within-block structure enters the Jacobian, unproven.
----
```

### ms-lipid-handshake

```diff
-hook: 'Myeloid cholesterol export does not rise with oligodendrocyte myelin rebuilding: on 632k nuclei the coupling is absent.'
+hook: 'On 632k nuclei myeloid cholesterol export does not rise with oligodendrocyte myelin rebuilding.'
-  purpose: 'Find out whether the cells that clear myelin debris pass its cholesterol on to the cells that rebuild myelin.'
-  plain: 'Score a cholesterol-export program in immune cells and a rebuild program in oligodendrocytes of the same samples, and see whether one rises with the other.'
-equation: 'r_{ds} = \beta\, e_{ds} + \gamma_{s} + u_{d} + \varepsilon_{ds},\qquad u_{d} \sim \mathcal{N}(0, \sigma_u^{2})'
+  purpose: 'Do myelin-clearing cells pass cholesterol to myelin-rebuilding cells?'
+  plain: 'Does cholesterol export in immune cells rise with rebuilding in oligodendrocytes?'
-  - { label: 'Pairs', value: '65 paired samples across 43 donors' }
-  - { label: 'First cohorts', value: 'Absinta 66k and Jakel 18k nuclei' }
-  - 'Score curated lipid-gene programs per donor and lesion stage.'
-  - 'Fit rebuild $r$ on export $e$ with stage control and a donor random effect, and donor-bootstrap the slope $\beta$.'
-  - 'Slope -0.061, LRT p = 0.732, donor-bootstrap 95% CI [-0.746, 0.143]: the criterion fails.'
-  - 'The one significant raw signal is negative (Spearman rho -0.346, p = 0.005) and vanishes under donor and stage control.'
-  - 'Underpowering is excluded at this size, so the transcriptomic handshake is not to be tried again.'
+  - 'Slope -0.061, p = 0.732, 95% CI [-0.746, 0.143]: the criterion fails.'
+  - 'The raw negative signal (rho -0.346, p = 0.005) vanishes under donor and stage control.'
+equation: 'r_{ds} = \beta e_{ds} + \gamma_s + u_d + \varepsilon_{ds}'
-
----
-kind: project
-title: 'Every other thread, and how it ended'
-hook: 'The myelin-gene signal in myeloid cells (p = 8.6e-7) is likely ambient RNA contamination, and the uptake rise (p = 0.013) may track general myeloid activation, since its genes are activation markers.'
-panels:
-  - { figure: within_cohort_macnair.png, caption: 'The decisive test on Macnair 2024', explain: 'One dot per paired donor and stage sample: the myeloid export score shows no rising trend against the oligodendrocyte rebuild score.' }
-results:
-  - 'Small cohorts: BTD held-out RMSE 0.499 against CP 0.507 and Tucker 0.704; a parameter-matched sweep shows BTD''s edge over CP is negligible.'
-  - 'Coupled cross-cohort factorization: r = 0.252, CI [-0.900, 0.954], permutation p = 0.258.'
-  - 'Phagocytic load to efflux in 5432 single cells: slope -0.235, p = 0.0013, yet no outlier against 40 expression-matched genes (p = 0.15).'
-  - 'Compositional pivot: +0.30, p = 0.002 in discovery, +0.003, p = 0.27 in validation.'
----
```

### phd-thesis

```diff
-hook: 'Four journal papers lead to a multiway decoder that predicts single and coordinated finger trajectories from ECoG and trains in minutes.'
+hook: 'Four journal papers lead to a multiway decoder that predicts single and coordinated finger trajectories from ECoG.'
-  plain: 'Keep the brain signal as a block of channels, frequencies and time, and fit it piece by piece so the decoder is quick to retrain.'
-equation: '\mathbf{Y} = \sum_{k=1}^{K} \mathbf{t}_k b_k \mathbf{q}_k^{\top} + \mathbf{F},\qquad \underline{\mathbf{X}} = \sum_{k=1}^{K} \underline{\mathbf{G}}_k \times_1 \mathbf{t}_k \times_2 \mathbf{P}^{(2)}_k \cdots \times_N \mathbf{P}^{(N)}_k + \underline{\mathbf{E}}'
+  plain: 'Keep the brain signal as a block of channels, frequencies and time, and fit it piece by piece so it is quick to retrain.'
-  - 'BTTR: deflation into blocks whose multilinear ranks are chosen automatically (ACE).'
-  - 'eBTTR: one model for all five fingers, the unintended coactivations included.'
-  - 'Before the ECoG work: Sparse eLORETA and neural-network connectivity for motor EEG sources.'
+  - 'BTTR: deflation into blocks $\mathbf{Y} = \sum_{k} \mathbf{t}_k b_k \mathbf{q}_k^{\top} + \mathbf{F}$, ranks chosen automatically (ACE).'
+  - 'eBTTR: one model for all five fingers, coactivations included. Earlier: Sparse eLORETA and neural-network connectivity for motor EEG sources.'
-  - 'BTTR mean r 0.64, 0.46 and 0.67 for the three subjects, level with HOPLS and above the competition winner (0.42, 0.36, 0.46).'
-  - 'Training takes about 3 min (BTTR) and 5 min (eBTTR) against about 14 h for HOPLS.'
-  - 'eBTTR lifts subject 1 middle finger from 0.38 to 0.49.'
+  - 'BTTR mean r 0.64, 0.46, 0.67, level with HOPLS and above the winner (0.42, 0.36, 0.46); about 3 min (eBTTR 5) against about 14 h for HOPLS.'
+  - 'eBTTR lifts subject 1 middle finger from 0.38 to 0.49; 4 sign-language gestures in 5 patients above 0.70; LightGBM beats BTTR for subject 2 (0.493 against 0.46).'
+  - 'Sparse eLORETA: spatial spread 113.16 against 199.47 at correlation 0.9234 against 0.9537, in 1.05 s against 68.05 s for BC-VARETA.'
-
----
-kind: columns
----
-# The four papers and what stays open
-
-### EEG sources and connectivity
-
-- Sparse eLORETA masks eLORETA with SSBL: spatial spread 113.16 against 199.47 at correlation 0.9234 against 0.9537 (far superficial, pink noise).
-- It runs in 1.05 s against 68.05 s for BC-VARETA.
-- Among the neural networks, LSTM-NUE obtains better sensitivity and precision; time-reversed Granger causality keeps the higher precision (0.71 against 0.37 on ground truth 2).
-
-|||
-
-### ECoG decoding and outlook
-
-- LightGBM performs better than BTTR for subject 2 (0.493 against 0.46); the introduction names rapid finger repetitions, hand gestures and sustained flexions as tasks where state-of-the-art decoders are still inadequate.
-- A pilot decodes 4 sign-language gestures in 5 patients with eBTTR at mean r above 0.70.
-- Finger abduction, which sign language needs, has not yet been attempted from ECoG.
```

### bachelor-network-ids

```diff
-title: 'Can machine learning on IP flows alone detect network intrusions out of the box?'
+title: 'Can machine learning on IP flows alone detect intrusions out of the box?'
-hook: 'A data centre carries too much traffic to inspect every packet; IP flows keep only headers and counts, so the thesis tested seven learners on labelled botnet and honeypot flows and on unlabelled traffic from a university network and a datacentre.'
+hook: 'Seven learners on labelled botnet and honeypot flows and on unlabelled traffic from a university network and a datacentre.'
-  plain: 'A program learns what past attacks looked like from connection summaries; the method that compares a new connection with its nearest known examples worked best.'
+  plain: 'A program learns what past attacks looked like from connection summaries; comparing with the nearest known examples worked best.'
-  - { label: 'Stage', value: 'published' }
-  - 'Learners: KNN, decision tree, Gaussian naive Bayes, linear and RBF SVM, a neural network and a one-class SVM.'
-  - 'Multi-class and binary F-scores over 10 runs, against a random and an all-normal baseline.'
+  - 'KNN, decision tree, Gaussian naive Bayes, linear and RBF SVM, neural network, one-class SVM; F-scores over 10 runs against random and all-normal.'
-  - 'KNN is best: binary F 0.950 within CTU-13 and 0.963 across datasets, 0.986 and 0.992 with TCP flags.'
-  - 'The Canberra distance gives the best multi-class F, 0.915; Euclidean the best binary F, 0.992.'
-  - 'On 11.07M unlabelled real-world flows KNN reaches F 0.763; the decision tree falls to 0.0155.'
-  - 'Naive Bayes barely beats the random baseline''s binary F of 0.465 across datasets; the one-class SVM cannot properly define the boundaries of its class.'
+  - 'KNN is best: binary F 0.950 within CTU-13, 0.963 across datasets, 0.986 and 0.992 with TCP flags; Canberra gives the best multi-class F, 0.915.'
+  - 'On 11.07M unlabelled real-world flows KNN reaches F 0.763; the decision tree falls to 0.0155, flagging every EDM flow as malicious.'
+  - 'Naive Bayes barely beats the random binary F of 0.465 across datasets; within CTU-13 the RBF SVM reaches F 0.046, the neural network 0.'
+  - 'Flows expose DDoS, scans, worms and botnets, while payload attacks stay hidden; the one-class SVM cannot properly define its class boundaries.'
-
----
-kind: columns
----
-# How the other learners failed, and what flows cannot show
-
-### Failure modes
-
-- Decision tree: binary F 0.907 within CTU-13, yet it flagged every EDM flow as malicious.
-- RBF SVM: binary F 0.046 within CTU-13, labelling most flows normal.
-- Neural network: binary F 0 within CTU-13, underfitting on a few thousand samples per attack class.
-- K-means: no way was found to check its clusters.
-
-|||
-
-### Limits and leads
-
-- Flows expose DDoS, scans, worms and botnets; attacks carried in the payload stay hidden.
-- Country of origin had little impact, which could be because the data came mostly from one country.
-- KNN trained for a binary answer alone reached 0.986 within CTU-13 and 0.993 across, over a few runs.
-- Finding labelled data was a problem during the experiments.
----
```

### icfp-src-abstract

```diff
-title: 'Can an explicitly typed core language make the Eff optimising compiler less error-prone?'
+title: 'Can an explicitly typed core language make optimised Eff less error-prone?'
-hook: 'Eff infers effect types through subtyping, so every source-to-source optimisation has to rebuild types; the abstract proposes an explicitly typed core language with row-polymorphic effects, based on the calculus of Links, as the intermediate language.'
+hook: 'The abstract proposes an explicitly typed core language with row-polymorphic effects, based on the calculus of Links.'
-  plain: 'Writing every type down inside the compiler lets each optimisation step be checked quickly, where today the types are worked out again after every step.'
+  plain: 'Writing every type down inside the compiler lets each optimisation step be checked quickly, in place of re-inferring types.'
-equation: 'C, D ::= A \,!\, \Delta, \qquad \Delta ::= \{\mathrm{Op}_1, \dots, \mathrm{Op}_n\}'
-  - 'Types are functions $A \to C$, handlers $C \Rightarrow D$, type variables and polytypes $\forall\alpha.C$ over dirty types.'
+  - 'Types are functions $A \to C$, handlers $C \Rightarrow D$, type variables and polytypes over dirty types $A \,!\, \Delta$, $\Delta = \{\mathrm{Op}_1, \dots, \mathrm{Op}_n\}$.'
```

### icfp-src-poster

```diff
-title: 'Can an explicitly typed core language with row-based effects make Eff''s optimising rewrites less error-prone?'
+title: 'Can explicit types with row-based effects make Eff''s rewrites less error-prone?'
-hook: 'The poster introduces an explicitly typed core language with row-based effects for Eff, compares optimised Eff with regular OCaml, Multicore OCaml, Handlers in Action and Eff directly in OCaml, and shows a function-specialisation rewrite that has to handle the types of its copy of a function.'
+hook: 'The poster compares optimised Eff with regular OCaml, Multicore OCaml, Handlers in Action and Eff directly in OCaml.'
-  plain: 'Effect handlers carry a runtime penalty, so the compiler rewrites them away; each rewrite has to keep the program typable, and explicit types in the core language make that less error-prone.'
+  plain: 'Handlers carry a runtime penalty, so the compiler rewrites them away; explicit core-language types keep each rewrite typable.'
-  - { label: 'Stage', value: 'published' }
-  - 'Function specialisation copies a recursive function and brings the handler inside its body.'
+  - 'Function specialisation copies a recursive function, types included, and brings the handler inside its body.'
-  - 'The new core language builds on the calculus of Links, with a row-polymorphic type-and-effect system.'
-  - 'Optimisations still need to be added for edge cases.'
+  - 'The core builds on the calculus of Links, with a row-polymorphic type-and-effect system; optimisations still need adding for edge cases.'
```

### masters-algebraic-subtyping

```diff
-title: 'Can Dolan''s algebraic subtyping carry effect information and keep its properties?'
+title: 'Can Dolan''s algebraic subtyping carry effects and keep its properties?'
-hook: 'Subtyping in Eff leaves unsolved constraints that made its optimising compiler fragile; EffCore extends Dolan''s algebraic subtyping with dirts built as a lattice of operations, so constraints are solved during inference and principal types survive.'
+hook: 'EffCore extends algebraic subtyping with dirts built as a lattice of operations, so constraints are solved during inference.'
-  plain: 'The checker folds its side conditions into the types themselves, with "either" and "both" types, for effects as well as values.'
+  plain: 'The checker folds its side conditions into the types, with "either" and "both" types, for effects as well as values.'
-  - { label: 'Stage', value: 'published' }
-equation: '\Delta ::= \mathrm{Op} \mid \delta \mid \emptyset \mid \Delta_1 \sqcap \Delta_2 \mid \Delta_1 \sqcup \Delta_2, \qquad C ::= A \,!\, \Delta'
-  - 'Dirts mirror types: operations, dirt variables, empty, intersection and union, under distributive-lattice equations.'
-  - 'Polar types put intersections on inputs and unions on outputs; biunification solves each constraint as it arises.'
-  - 'Type-&-effect automata extend type automata, so standard DFA minimisation simplifies types and effects together.'
+  - 'Dirts $\Delta ::= \mathrm{Op} \mid \delta \mid \emptyset \mid \Delta_1 \sqcap \Delta_2 \mid \Delta_1 \sqcup \Delta_2$ mirror types, under distributive-lattice equations.'
+  - 'Polar types: intersections on inputs, unions on outputs; biunification solves each constraint; type-&-effect automata allow DFA minimisation.'
-  - 'Proved: instantiation, weakening, substitution, soundness by progress and preservation, principal inferred types.'
+  - 'Proved: instantiation, weakening, substitution, soundness by progress and preservation, principal inferred types; several proofs lean on Dolan''s.'
-  - 'Parser and Queens are slower, 27387.7 and 6402.7 against 1177.2 and 753.5, without type simplification.'
-  - 'A program standard Eff rejects is typed in EffCore through a union return type.'
+  - 'Parser and Queens are slower, 27387.7 and 6402.7 against 1177.2 and 753.5, without type simplification; growing types as the cause is a hypothesis.'
+  - 'A program standard Eff rejects is typed in EffCore through a union return type; biunification on the automata is not built.'
-
----
-kind: columns
----
-# What the inferred types look like, and what is left open
-
-### Loop program types
-
-- Subtyping: the state handler carries five constraints, $\delta_1 \leqslant \delta_3$, $\delta_1 \leqslant \delta_2$ and three $\delta = \top$.
-- EffCore unsimplified: the test function takes an intersection of 16 type variables with int.
-- EffCore simplified by hand: $\mathrm{int} -(\mathrm{Get} \sqcup \mathrm{Put}) \to \mathrm{int}$, matching subtyping with no constraints left.
-- Intersections sit on inputs and unions on outputs, as the polarity rule requires.
-
-|||
-
-### What Eff still lacks
-
-- Simplification is not implemented in Eff; growing types as the cause of the Parser and Queens slowdown is a hypothesis.
-- Several proofs lean on Dolan's and are less rigorous than planned.
-- Biunification run directly on type-&-effect automata is not built.
-- An optimising compiler free of unsolved constraints is the next step.
----
```

### masters-eeg-infotheory

```diff
-title: 'How much information does one cortical region share between abstract and concrete words?'
+title: 'How much information do abstract and concrete words share in one region?'
-hook: 'Scalp EEG links are inflated by volume conduction, so the thesis measures entropy, mutual information and interaction information on source-reconstructed activity, with a Python framework built for it.'
+hook: 'Entropy, mutual information and interaction information on source-reconstructed activity, with a Python framework built for it.'
-  - { label: 'Stage', value: 'published' }
-equation: 'I(\mathrm{Abs},\mathrm{Con},\mathrm{Rest}) = I(\mathrm{Abs},\mathrm{Con}) - I(\mathrm{Abs},\mathrm{Con} \mid \mathrm{Rest})'
-  - 'Data delivered source-reconstructed with sLORETA from 128-channel EEG on 600 Dutch nouns, cut to four regions active for both word classes.'
-  - 'Equal-width binning with 90 bins, from the Freedman-Diaconis rule and an entropy curve that levels off near 100.'
-  - 'Every measure is a sum of joint entropies over numpy histograms: mutual information, conditional MI, interaction information.'
+  - 'Source-reconstructed with sLORETA (128-channel EEG, 600 Dutch nouns, four regions); 90 equal-width bins from Freedman-Diaconis and an entropy curve.'
+  - '$I(\mathrm{Abs},\mathrm{Con},\mathrm{Rest}) = I(\mathrm{Abs},\mathrm{Con}) - I(\mathrm{Abs},\mathrm{Con} \mid \mathrm{Rest})$, every measure a sum of joint entropies over numpy histograms.'
-  - 'The three-way term is -1 bit against 2 to 3 bits for $I(\mathrm{Abs},\mathrm{Con})$: rest adds synergy.'
-  - 'Per subject, 10 trials leave most of the 90 bins empty; from 80 trials on the curves are clear.'
+  - 'The three-way term is -1 bit against 2 to 3 bits for $I(\mathrm{Abs},\mathrm{Con})$: rest adds synergy, hard to interpret.'
+  - 'Per subject, 10 trials leave most of the 90 bins empty, from 80 on the curves are clear; directed information is derived but not computed.'
-
----
-kind: columns
----
-# What the measures show, and what is left open
-
-### Reading the measures
-
-- The results agree across all four regions; the figures show one.
-- A Venn picture predicts +1 bit for the three-way term; the joint entropy is smaller than drawn, so the sign flips.
-- Negative interaction information marks synergy and is hard to interpret.
-- With 90 bins and 262 trials per subject, about 3 trials fall in each bin.
-
-|||
-
-### Measures still to compute
-
-- Directed information is derived but not computed.
-- No comparison with Granger causality or another connectivity measure.
-- Total correlation and dual total correlation are proposed as non-negative alternatives.
-- The framework needs more measures and a clean-up before release as a package.
----
```

### abstract-bci-meeting-2021

```diff
-title: 'Can a causal-discovery network seed a graph process model of directed links between EEG sources?'
+title: 'Can a causal-discovery network seed a graph model of EEG source links?'
-hook: 'What scalp electrodes record is a mix of many brain sources; the abstract proposes finding directed links with an attention network and refining them in a Causal Graphical Process Model, checked on one simulated network.'
+hook: 'The abstract finds directed links with an attention network and refines them in a Causal Graphical Process Model.'
-  plain: 'A network proposes who influences whom, a graph model fits how strongly, and a made-up brain network with known answers checks the result.'
+  plain: 'A network proposes who influences whom, a graph model fits how strongly, and a made-up network with known answers checks it.'
-  - { label: 'Stage', value: 'published' }
-equation: 'x_2(n) = 0.7\,x_2(n-1) - 0.5\,x_2(n-2) + 0.2\,x_1(n-1) + 0.25\,x_3(n-1) + w_2(n)'
-  - 'The Temporal Causal Discovery Framework, an attention-based CNN with a causal validation step, proposes the causal links.'
-  - 'Those links are the skeleton solution of a Causal Graphical Process Model.'
-  - 'Simulation chain: sources with a set pattern, noise sources, forward model, sensor noise, inverse model, then the estimate.'
+  - 'The Temporal Causal Discovery Framework, an attention-based CNN, proposes the links that skeleton a Causal Graphical Process Model.'
-  - 'Estimated $x_1$: own lags 0.5 and $-0.4$; terms $0.14\,x_2(n-1)$, $0.14\,x_3(n-2)$ and $0.2\,x_2(n-1)$.'
-  - 'Estimated $x_2$: own lags 0.77 and $-0.28$, from $x_1$ 0.18 and from $x_3$ 0.31; estimated $x_3$: own lag 0.8.'
+  - 'True $x_2$: own lags 0.7, $-0.5$, from $x_1$ 0.2, from $x_3$ 0.25; estimated own lags 0.77, $-0.28$, from $x_1$ 0.18, from $x_3$ 0.31.'
+  - 'Estimated $x_1$: own lags 0.5 and $-0.4$; terms $0.14\,x_2(n-1)$, $0.14\,x_3(n-2)$ and $0.2\,x_2(n-1)$; estimated $x_3$: own lag 0.8.'
```

### source-localization

```diff
-title: 'Can screening the lead field with sparse Bayesian learning make eLORETA sparse and keep its signals?'
+title: 'Can sparse Bayesian screening of the lead field make eLORETA sparse?'
-hook: 'eLORETA localizes well but spreads current smoothly over the cortex; Sparse eLORETA first screens the lead field with Structured Sparse Bayesian Learning, then runs eLORETA on the dipoles that remain.'
+hook: 'Sparse eLORETA screens the lead field with Structured Sparse Bayesian Learning, then runs eLORETA on the rest.'
-  - { label: 'Stage', value: 'published' }
-equation: 'P = \mathrm{eLORETA}\big(HM_{:,\,\mathcal{I}},\ \gamma\big), \qquad \mathcal{I} = \mathrm{smooth}\big(\mathrm{SSBL}(S_{vv}, HM),\ \kappa\, d\big)'
-  - 'SSBL, taken from BC-VARETA, reads the data covariance and the head model and returns the dipoles likely to be active.'
-  - 'A smoothing step on the cortex mesh prunes to a fraction $\kappa$ of all dipoles; the kept columns form a reduced lead field.'
+  - 'SSBL, from BC-VARETA, returns the dipoles likely to be active; smoothing on the cortex mesh prunes to a fraction $\kappa$, Pareto point about 0.08.'
-  - 'Correlation with the true sources, far superficial, pink noise: LCMV 0.9867, eLORETA 0.9537, Sparse eLORETA 0.9234.'
-  - 'Spatial spread drops from 199.47 to 113.16 (far superficial) and 9239.1 to 175.34 (far deep); BC-VARETA reaches 113.89 and 4.48.'
-  - 'Close deep dipoles are hardest: correlations 0.8383, 0.6297 and 0.5991.'
-  - 'Seconds per run: eLORETA 0.3567, Sparse eLORETA 1.0459, BC-VARETA 68.0538.'
+  - 'Correlation, far superficial, pink noise: LCMV 0.9867, eLORETA 0.9537, Sparse eLORETA 0.9234; close deep dipoles hardest: 0.8383, 0.6297, 0.5991.'
+  - 'Spread 199.47 to 113.16 (far superficial), 9239.1 to 175.34 (far deep); BC-VARETA 113.89, 4.48. Seconds: eLORETA 0.3567, ours 1.0459, BC-VARETA 68.0538.'
+  - 'Cuban EEG: no notable differences from BC-VARETA. Imagined right-hand movement: ERD in contralateral M1 and bilateral VLPFC, ERS in DLPFC.'
-
----
-kind: project
-title: 'Choosing the sparsity, and the real recordings'
-hook: 'Correlation rises and spread grows with $\kappa$ until both level off at 0.12; the Pareto point at about 0.08 is used in the simulation and on the Cuban set.'
-panels:
-  - { figure: sparsity-acc-spread_norm.png, caption: 'Average correlation and complement of normalized spread against $\kappa$', explain: 'The Pareto-optimal solution is at the intersection, $\kappa \approx 0.08$, where neither metric improves without the other worsening.' }
-results:
-  - 'Cuban resting EEG, 300 bootstrap localizations: no notable differences between Sparse eLORETA and BC-VARETA, and the source space reduction shows against eLORETA.'
-  - 'Imagined right-hand movement, subject ay: ERD in contralateral M1 and bilateral VLPFC, ERS in DLPFC, angular gyrus and superior PPC.'
-  - 'There BC-VARETA finds only a few sources, and LCMV marks nearly all as ERS with no clusters.'
-  - 'LCMV yields the best simulated correlation yet its dipoles are dispersed; some sources were not accurately located while their signals still correlated well.'
----
```

### volga-finger-trajectories

```diff
-hook: 'Motor BCIs still lack control of individual fingers; the abstract fits Block-Term Tensor Regression to sensorimotor ECoG and predicts thumb, index and little-finger flexion and extension.'
+hook: 'The abstract fits Block-Term Tensor Regression to sensorimotor ECoG and predicts flexion and extension of three fingers.'
-  - { label: 'Stage', value: 'published' }
-  - 'The abstract credits the automatic choice of parameters with increased flexibility and interpretability.'
-  - 'One subject; flexions and extensions of three fingers.'
+  - 'The abstract credits the automatic choice of parameters with increased flexibility and interpretability; one subject, three fingers.'
```

### block-term-tensor-regression

```diff
-title: 'Can block-term tensor regression choose its own ranks and still decode single fingers from ECoG?'
-sub: 'Single finger trajectory prediction from intracranial brain activity using Block-Term Tensor Regression with fast and automatic component extraction'
-hook: 'Multiway decoders fit the space, frequency and time structure of ECoG but need ranks found by costly cross-validation; BTTR extracts each block with ranks chosen by BIC and deflates, so only the number of blocks is cross-validated.'
+title: 'Can block-term tensor regression choose its own ranks and decode fingers?'
+sub: 'Single finger trajectory prediction from intracranial activity by automatic BTTR'
+hook: 'BTTR extracts each block with ranks chosen by BIC and deflates, so only the number of blocks is cross-validated.'
-  plain: 'The model cuts the brain data into a few blocks, each matched to the movement and each choosing its own size, so nobody tunes it by hand.'
+  plain: 'The model cuts the brain data into a few blocks that each choose their own size, so nobody tunes it by hand.'
-  - { label: 'Stage', value: 'published' }
-equation: '\underline{\mathbf{X}} = \sum_{k=1}^{K} \underline{\mathbf{G}}_k \times_1 \mathbf{t}_k \times_2 \mathbf{P}_k^{(2)} \cdots \times_N \mathbf{P}_k^{(N)} + \underline{\mathbf{E}}, \qquad \mathbf{y} = \sum_{k=1}^{K} \mathbf{t}_k b_k + \mathbf{f}'
-  - 'mPSTD: a sparse Tucker decomposition of the ECoG-finger cross-covariance, pruned with a threshold $\tau$.'
-  - 'ACE picks SNR and $\tau$ by BIC; ACCoS then keeps only the components that raise the R-squared with the finger.'
-  - 'BTTR deflates block by block; gBTTR averages noisy refits of each block, a ridge-like guard against overfitting.'
-  - 'Input tensor: samples by channels by 8 bands by 10 time points, from 1 s before each trial onset.'
+  - 'mPSTD: sparse Tucker of the ECoG-finger cross-covariance, pruned by $\tau$; ACE picks SNR and $\tau$ by BIC; ACCoS keeps components raising R-squared.'
+  - 'BTTR deflates block by block; gBTTR averages noisy refits of each block; input: 8 bands by 10 time points from 1 s before each trial onset.'
-  - 'The competition winner, amplitude-modulation regression, gets 0.42, 0.36 and 0.46; LSTM gets 0.54, 0.39 and 0.62.'
-  - 'Training takes about 3 min (ACE-BTTR) and 8 min (ACCoS-BTTR) against about 14 h for cross-validated HOPLS.'
-  - 'Synthetic tensors: mPSTD reaches $C1 = 1$ against 0.81 for standard PSTD, and ACE sets SNR and $\tau$ with no manual tuning.'
+  - 'Competition winner (AM regression) 0.42, 0.36, 0.46; LSTM 0.54, 0.39, 0.62; LightGBM: better subject 1, worse 2, equal 3 (0.67 against 0.6775).'
+  - 'Training about 3 min (ACE-BTTR), 8 min (ACCoS-BTTR) against about 14 h for HOPLS; synthetic: mPSTD $C1 = 1$ against 0.81 for PSTD.'
-
----
-kind: project
-title: 'Where BTTR stands against the other decoders'
-hook: 'On test data ACCoS-gBTTR performs better than ACE-gBTTR and HOPLS for subject 3; against the Riemannian LightGBM decoder ACE-BTTR performs better for subject 1, worse for subject 2 and equally for subject 3 (0.67 against 0.6775).'
-panels:
-  - { figure: image10.png, caption: 'Predicted ring-finger flexion of subject 1 against the data glove', explain: 'Actual and predicted flexion amplitudes (z-scores) over time; of the BTTR versions only the generalized gBTTR is shown.' }
-results:
-  - 'On test data BTTR and gBTTR do not differ significantly; on training data gBTTR scores lower, so it seemingly limits overfitting, mainly for ACCoS-BTTR.'
-  - 'ACE-BTTR differs significantly from LSTM, AM, RF and LARS on the average for every subject; per finger, thumb and index show no significant difference to LSTM.'
-  - 'The ring finger is left out of the averages, since it flexes along with the middle or little finger.'
-  - 'BTTR still cross-validates the number of blocks $K$.'
----
```

### connectivity-iris

```diff
-title: 'Can neural networks estimate directed connectivity between reconstructed EEG sources as well as Granger causality?'
+title: 'Can neural networks match Granger causality on directed EEG connectivity?'
-hook: 'Granger-type estimators assume linearity and stationarity that EEG breaks; three networks (TCDF, LSTM-NUE and a proposed Conv2D) are set against time-reversed Granger causality on simulated sources reconstructed with eLORETA.'
+hook: 'TCDF, LSTM-NUE and a proposed Conv2D against time-reversed Granger causality on simulated sources.'
-  purpose: 'Tell which brain region drives which from EEG traced back into the brain, without assuming the links are linear.'
-  plain: 'Train a network to predict one region from the others; if leaving a region out makes the prediction worse, that region drives it.'
+  purpose: 'Tell which brain region drives which from EEG, without assuming the links are linear.'
+  plain: 'Train a network to predict one region from the others; a region whose removal worsens it drives that region.'
-  - { label: 'Data', value: 'simulation, New York Head, 108 electrodes' }
-  - { label: 'Stage', value: 'published' }
-equation: '\mathrm{NNGC} = \mathrm{err}_{\mathrm{reduced}} - \mathrm{err}_{\mathrm{full}}'
+  - { label: 'Data', value: 'simulation, New York Head' }
-  - 'Three sources over 1500 steps, pink-noise background, SNR 0.9 at sources and electrodes, eLORETA with $\gamma = 0.01$.'
-  - 'Far-superficial and far-deep dipole placements; ground truth 2 adds a sender that moves over 1004 iterations.'
-  - 'LSTM-NUE picks informative lags, then scores each link by the loss rise when its source is dropped.'
-  - 'Baseline: conservative time-reversed Granger causality (TRGC), model order 2, FDR-corrected $\alpha = 0.05$.'
+  - 'Three sources, pink noise, SNR 0.9, eLORETA; ground truth 2 adds a moving sender.'
+  - 'LSTM-NUE scores links by $\mathrm{err}_{\mathrm{reduced}} - \mathrm{err}_{\mathrm{full}}$; baseline: time-reversed Granger (TRGC), order 2.'
-  - 'Ground truth 1, median sensitivity: TRGC 1, LSTM-NUE 0.67, Conv2D with two predictors 0.67, TCDF 0.33.'
-  - 'F1 far-superficial: TRGC and Conv2D 0.73, LSTM-NUE 0.70, TCDF 0.40; far-deep: TRGC 1, LSTM-NUE 0.75, Conv2D 0.47.'
-  - 'Conv2D with three predictors collapses to sensitivity 0.13 and precision 0.40.'
-  - 'TRGC repeats two false positives in the far-superficial case, where its precision falls to 0.58.'
+  - 'Ground truth 1 median sensitivity: TRGC 1, LSTM-NUE 0.67, Conv2D 0.67, TCDF 0.33; far-deep F1: TRGC 1, LSTM-NUE 0.75.'
+  - 'Ground truth 2: only LSTM-NUE and TRGC detect the link; precision TRGC 0.71, 0.70, LSTM-NUE 0.37, 0.43.'
+  - 'Every result is on simulated sources; dipole placement shows no significant effect.'
-
----
-kind: columns
----
-# Ground truth 2 and the limits of the networks
-
-### One moving sender
-
-- Only LSTM-NUE and TRGC detect the single true link, both with sensitivity 1.
-- Precision: TRGC 0.71 and 0.70, LSTM-NUE 0.37 and 0.43 (far-superficial, far-deep); the gap is significant.
-- F1: TRGC 0.79 in both placements, LSTM-NUE 0.53 and 0.60.
-- TCDF and both Conv2D models detect no connection at all.
-
-|||
-
-### Simulated sources and run cost
-
-- Every result is on simulated sources; real EEG is the next test.
-- One dataset trains in 1048 s for Conv2D with two predictors.
-- The networks vary more across runs than TRGC, most of all in the far-deep placement.
-- Dipole placement shows no significant effect, which the authors call counterintuitive.
----
```

### extended-bttr-note

```diff
-title: 'Can one tensor regression predict all five fingers at once, coactivations included?'
-sub: 'Finger movement and coactivation predicted from intracranial brain activity using extended Block-Term Tensor Regression'
-hook: 'BTTR predicts one scalar, so each finger needs its own model and what the fingers share is lost; eBTTR regresses a fingers matrix on the ECoG tensor block by block, with ranks still chosen automatically by ACE.'
+title: 'Can one tensor regression predict all five fingers at once?'
+sub: 'Finger movement and coactivation predicted from intracranial activity using extended BTTR'
+hook: 'eBTTR regresses a fingers matrix on the ECoG tensor block by block, with ranks still chosen automatically by ACE.'
-  - { label: 'Data', value: 'BCI Competition IV dataset 4, 3 subjects' }
-  - { label: 'Stage', value: 'published' }
-equation: '\mathbf{Y} = \sum_{k=1}^{K} \mathbf{t}_k b_k \mathbf{q}_k^{T} + \mathbf{F}, \qquad \mathbf{w}_k = \big(\mathbf{P}_k^{(N)} \otimes \cdots \otimes \mathbf{P}_k^{(2)}\big)\,\mathrm{vec}(\underline{\mathbf{G}}_k)'
+  - { label: 'Data', value: 'BCI Competition IV, 3 subjects, 8 bands x 10 bins' }
-  - 'ACE decomposes the cross-covariance of ECoG tensor and finger matrix with mPSTD, initialised by HOOI, and picks SNR and $\tau$ by BIC.'
-  - 'Each block yields a score $\mathbf{t}_k$ and a finger loading $\mathbf{q}_k$; tensor and fingers are deflated before the next block.'
-  - 'Tensor: 61, 46 and 63 curated channels by 8 bands by 10 bins; the glove is shifted one sample for its 37 ms lag.'
-  - 'Only the number of blocks $K$ is set by 5-fold cross-validation.'
+  - 'ACE decomposes the ECoG-finger cross-covariance with mPSTD, initialised by HOOI, and picks SNR and $\tau$ by BIC; only $K$ is cross-validated.'
+  - 'Each block yields a score $\mathbf{t}_k$ and a finger loading $\mathbf{q}_k$; $\mathbf{Y} = \sum_k \mathbf{t}_k b_k \mathbf{q}_k^{T} + \mathbf{F}$.'
-  - 'eBTTR and BTTR differ significantly in the middle finger of subjects 1 and 2: 0.49 against 0.38 and 0.33 against 0.27.'
-  - 'eBTTR and HOPLS differ significantly for subjects 1 and 2, mainly through the middle finger.'
-  - 'Training takes about 5 min, against 3 min for BTTR and 14 h for HOPLS.'
+  - 'eBTTR and BTTR differ significantly in the middle finger of subjects 1 and 2 (0.49 against 0.38, 0.33 against 0.27); eBTTR also differs from HOPLS.'
+  - 'About 5 min against 3 min for BTTR and 14 h for HOPLS; coactivations most likely not encoded by the ECoG (S1, thumb cued: index 0.72 against 0.05).'
-
----
-kind: project
-title: 'What the multi-output model adds: the fingers that move along'
-hook: 'Non-cued fingers move with the cued one, in part through hand and forearm tendon anatomy and the divergent connections from cortical to spinal motor neurons; the paper reports eBTTR predicting these coactivations as well as the cued trajectories.'
-panels:
-  - { figure: ebttr_fig.jpeg, caption: 'eBTTR: each block pairs a core and loadings for the ECoG tensor with a finger loading for $\mathbf{Y}$', explain: 'The tensor and the finger matrix are both rebuilt as a sum of $K$ blocks plus residuals $\mathbf{E}$ and $\mathbf{F}$.' }
-results:
-  - 'The supplement gives eBTTR and BTTR accuracies for every non-cued finger and notes a significant difference between them; subject 1, thumb cued: index 0.72 against 0.05.'
-  - 'Hand-avatar replays show eBTTR and HOPLS decoding joint movements better than BTTR and amplitude modulation.'
-  - 'Coactivations are present in the glove data but most likely not encoded by the ECoG.'
-  - 'The paper still renders them: the outcome looks more natural and could add sensory information when approaching an object.'
----
```

### fbttr-strategies

```diff
-title: 'Can block-term tensor regression be trained across clients that never pool their ECoG data?'
+title: 'Can block-term regression be trained across clients without pooling ECoG?'
-hook: 'BTTR needs every recording in one place; FBTTR runs ACE at each client, has the server agree on one component count, and averages the block parameters every round.'
+hook: 'FBTTR runs ACE at each client, has the server agree one component count, and averages the block parameters every round.'
-  - { label: 'Stage', value: 'published' }
-equation: 'W^{(t)} = \frac{1}{\sum_k N_k} \sum_{k=1}^{K} N_k\, \Delta W_k^{(t-1)}'
-  - 'Each subject''s recording is split into five clients of 40 s; all share one channel, band and time-bin layout (horizontal FL).'
-  - 'Every client runs ACE; the server fixes one component count, taking the median when clients disagree (under 5% of rounds).'
-  - 'Clients fit the block with F-mPSTD and deflate; the server takes the sample-weighted mean of their parameters.'
-  - 'Tensor of 61, 46 and 63 channels by 8 bands by 10 bins; $\tau$ searched in [90, 100], SNR in [1, 50].'
+  - 'Five clients of 40 s per subject; every client runs ACE; the server takes the median count when they disagree.'
+  - 'Clients fit with F-mPSTD and deflate; $W^{(t)}$ is the sample-weighted mean; FedAdagrad, FedYogi, FedProx each tested against FedAvg (Holm-Bonferroni).'
-  - 'Cued-finger mean r (ring excluded), FBTTR against eBTTR: 0.64/0.66, 0.48/0.48 and 0.68/0.66 for subjects 1 to 3.'
-  - 'Subject 3 thumb: 0.76 for FBTTR against 0.71 for eBTTR.'
-  - 'FBTTR differs significantly from HOPLS for subjects 1 and 2, mainly in the middle finger: 0.45 against 0.36, 0.32 against 0.26.'
-  - 'FBTTR outperforms the non-multilinear models AM, RF, LARS, CNN and LSTM.'
+  - 'Mean r against eBTTR: 0.64/0.66, 0.48/0.48, 0.68/0.66; above HOPLS for subjects 1 and 2, and above AM, RF, LARS, CNN and LSTM.'
+  - 'Subject means, FedAvg/FedAdagrad/FedYogi/FedProx: 0.64/0.63/0.62/0.63, 0.48/0.47/0.45/0.48, 0.68/0.67/0.65/0.68.'
+  - 'Ten rounds about 5 min, 2-5 MB per round; limits: synchronisation overhead, heterogeneous data, no privacy-preserving mechanism yet.'
-
----
-kind: project
-title: 'Which aggregation strategy to use'
-hook: 'FedAvg, FedAdagrad, FedYogi and FedProx run on the same five clients per subject; each is tested against FedAvg with paired t-tests over the five test blocks and Holm-Bonferroni correction.'
-panels:
-  - { figure: model.png, caption: 'FBTTR parameters for subject 1: the first 30 blocks (rows) by thumb to pinky (columns)', explain: 'The paper reads the smooth transitions across blocks for each finger as FedAvg yielding stable parameters without large fluctuations.' }
-results:
-  - 'Subject means, FedAvg/FedAdagrad/FedYogi/FedProx: 0.64/0.63/0.62/0.63, 0.48/0.47/0.45/0.48, 0.68/0.67/0.65/0.68.'
-  - 'FedAvg performs comparably or better; FedYogi shows slightly reduced performance, FedProx nearly matches FedAvg, FedAdagrad sits in between.'
-  - 'Ten rounds take about 5 min, against 3 min for BTTR and 14 h for HOPLS, sending 2-5 MB per round.'
-  - 'Limits the paper states: synchronisation overhead, possible degradation on highly heterogeneous data, and no privacy-preserving mechanism yet.'
----
```

### fermat

```diff
-title: 'Does federated block-term tensor regression hold up on brain signals and on clinical records?'
-sub: 'Applying Federated Learning to Block-Term Tensor Regression for Decentralised Data Analysis of Biomedical Data'
-hook: 'BTTR assumes one central dataset; FBTTR keeps the data at each client, lets every client run ACE, fixes a shared component count at the server and merges the blocks with FedAvg.'
+title: 'Does federated block-term regression hold up on brain and clinical data?'
+sub: 'Applying Federated Learning to Block-Term Tensor Regression for biomedical data'
+hook: 'Data stay at each client; ACE runs there, the server fixes the factor dimensions, and blocks merge with FedAvg.'
-  - { label: 'Venue', value: 'IEEE FLTA 2025' }
-  - { label: 'Data', value: 'BCI Competition IV, Fed-Heart-Disease, Fed-TCGA-BRCA' }
-  - { label: 'Stage', value: 'published; extended version arXiv:2412.06815' }
-equation: 'W^{(t)} = \frac{1}{\sum_k N_k} \sum_{k=1}^{K} N_k\, \Delta W_k^{(t-1)}'
+  - { label: 'Venue', value: 'IEEE FLTA 2025; extended version arXiv:2412.06815' }
+  - { label: 'Data', value: 'BCI Competition IV ECoG, two clinical sets' }
-  - 'Every client runs ACE on its own data; the server returns SNR and $\tau$ so that all clients share one set of factor dimensions.'
-  - 'Clients fit and deflate each block locally; the server averages the block parameters, weighted by client size.'
-  - 'ECoG: tensor of 61, 46 and 63 channels by 8 bands by 10 bins; $K$ set by 5-fold cross-validation.'
-  - 'Clinical: Fed-Heart-Disease (740 records, 4 centres) and Fed-TCGA-BRCA (1,088 patients, 6 centres), set against the FL4E baselines.'
+  - 'Every client runs ACE; the server returns SNR and $\tau$ so all share factor dimensions; blocks are averaged, weighted by client size.'
+  - 'ECoG: 61, 46 and 63 channels by 8 bands by 10 bins. Clinical: Fed-Heart-Disease (740 records, 4 centres), Fed-TCGA-BRCA (1,088, 6 centres), against FL4E.'
-  - 'Fed-Heart-Disease: AUC 0.872 and accuracy 0.772, against 0.874 and 0.783 for centralized BTTR; the accuracy gap is not significant.'
-  - 'FBTTR outperforms the FL4E fully federated, hybrid and centralized runs on Fed-Heart-Disease in absolute numbers, most comparisons significant.'
-  - 'Fed-TCGA-BRCA: C-index 0.775 against 0.737 for centralized BTTR, a significant gain.'
+  - 'Fed-Heart-Disease: AUC 0.872 against 0.874 centralized, gap not significant; Fed-TCGA-BRCA: C-index 0.775 against 0.737, a significant gain.'
+  - 'Limits: overhead of model synchronisation, possible degradation on heterogeneous data, no specific privacy-preserving mechanism.'
-
----
-kind: columns
----
-# The clinical case studies
-
-### Fed-Heart-Disease
-
-- Class imbalance across the four clients: 164/139, 163/98, 1/45 and 29/101 records of class 0/1.
-- The hybrid FBTTR run is on par with the fully federated model and significantly outperforms the local runs of the smaller clients (accuracy 0.63 and 0.72).
-- The paper suggests that smaller clients with imbalanced data may benefit more from joining federation than from working alone.
-- The paper notes that the larger clients can lose performance by joining federation: alone they reach AUC 0.89 and 0.92.
-
-|||
-
-### Fed-TCGA-BRCA, and the limits the paper states
-
-- FBTTR performs significantly better than centralized BTTR, which the paper reads as FBTTR leveraging the federated data.
-- FBTTR implements only the FedAvg equivalent; FL4E's FedOpt and FedProx runs serve as the comparison.
-- Limits: overhead of model synchronisation and possible degradation with highly heterogeneous data.
-- No specific privacy-preserving mechanism is part of this work.
----
```

### go-bttr

```diff
-title: 'Can one decoder track sign-language finger flexions by choosing, block by block, which fingers to regress together?'
-sub: 'Decoding Sign Language Finger Flexions from high-density electrocorticography using Graph-Optimized Block Term Tensor Regression'
-hook: 'BTTR decodes each finger alone and eBTTR all five jointly, with single-finger accuracy that can lapse as blocks are added; Go-BTTR runs a Causal Graph Process before each block and sends linked fingers to an eBTTR block, the rest to BTTR blocks.'
+title: 'Can one decoder choose, block by block, which fingers to regress together?'
+sub: 'Decoding sign language finger flexions from high-density ECoG using Graph-Optimized BTTR'
+hook: 'Go-BTTR runs a Causal Graph Process before each block; linked fingers go to an eBTTR block, the rest to BTTR blocks.'
-  - { label: 'Data', value: 'Utrecht (subjects 2 to 5) and Leuven (2) ECoG patients' }
-  - { label: 'Stage', value: 'published' }
-equation: 'x[k] = w[k] + \sum_{i=1}^{M} \Big( \sum_{j=0}^{i} c_{ij} A^{j} \Big)\, x[k-i]'
+  - { label: 'Data', value: 'Utrecht and Leuven ECoG patients' }
-  - 'Before each block, CGP fits a graph autoregression to the finger trajectories; links above 0.08 join fingers, the threshold at which CGP reconstructs the signal with at least 95% accuracy.'
-  - 'Linked fingers share one eBTTR block, unlinked fingers get one BTTR block each; all deflate before the next CGP.'
-  - 'Tensor: channels by 16 features (15 gamma bands from 60 to 130 Hz plus the LMP) by 10 time bins.'
-  - 'Split 60/20/20 into training, validation (choosing $K$) and test; Wilcoxon tests over five test blocks.'
+  - 'Before each block a CGP links fingers above 0.08; linked fingers share one eBTTR block, the rest one BTTR block each; all deflate.'
+  - 'Tensor: channels by 15 gamma bands (60-130 Hz) plus the LMP by 10 time bins; split 60/20/20; Wilcoxon tests over five test blocks.'
-  - 'Utrecht, 4 ASL letters, subjects 2 to 5: mean r over all fingers 0.73 for Go-BTTR, 0.719 for eBTTR, 0.70 for BTTR.'
-  - 'Utrecht subject 5 pinky: 0.82 against 0.80 for eBTTR and 0.72 for BTTR.'
-  - 'Leuven, 26 Flemish letters, 2 patients: 0.37, 0.34 and 0.33; eBTTR is significantly lower for subject 1''s middle finger and pinky, BTTR for subject 2''s index, ring and pinky.'
-  - 'Leuven single-finger task: Go-BTTR beats eBTTR on index (0.55 against 0.45) and middle (0.48 against 0.12), and BTTR on ring (0.23 against 0.17).'
+  - 'Utrecht, 4 ASL letters, subjects 2 to 5: mean r 0.73 Go-BTTR, 0.719 eBTTR, 0.70 BTTR; subject 5 pinky 0.82 against 0.80 and 0.72.'
+  - 'Leuven, 26 Flemish letters, 2 patients: 0.37, 0.34, 0.33; single-finger Go-BTTR beats eBTTR on index (0.55 against 0.45) and middle (0.48 against 0.12).'
+  - 'Training 28 and 34 min against eBTTR 18 and 22, BTTR 13 and 16; Leuven below Utrecht, attributed to epidural against subdural grids.'
-
----
-kind: project
-title: 'How Go-BTTR assigns its blocks'
-hook: 'As blocks are added, eBTTR''s index-finger correlation shows lapses in both datasets, while BTTR and Go-BTTR remain stable.'
-panels:
-  - { figure: gobttr.jpeg, caption: 'Go-BTTR: each iteration runs CGP on the five finger trajectories, then one block per finger group', explain: 'In iteration 1 fingers 1 and 2 are linked and share an eBTTR block; in iteration 2 no link remains and every finger gets a BTTR block.' }
-results:
-  - 'Training time, Utrecht and Leuven task 1: Go-BTTR 28 and 34 min, eBTTR 18 and 22, BTTR 13 and 16 (M1 MacBook Pro).'
-  - 'Leuven correlations sit below Utrecht''s; the paper attributes this to epidural against subdural grids.'
-  - 'Utrecht subject 1 is excluded because no electrode covered M1.'
----
```

### abduction

```diff
-title: 'Can finger abduction, the sideways spreading of fingers, be decoded from ECoG as well as flexion?'
+title: 'Can finger abduction be decoded from ECoG as well as flexion?'
-hook: 'Two patients with epidural grids performed cued flexions, the 26 letters of the Flemish sign alphabet and cued abductions, each decoded with eBTTR.'
+hook: 'Two epidural-grid patients performed cued flexions, the 26 Flemish sign letters and cued abductions, decoded with eBTTR.'
-  - { label: 'Data', value: '2 patients, epidural ECoG, data glove' }
-  - 'Features per electrode: 15 gamma bands (60-130 Hz) and the LMP, sampled at 10 time points over the last second.'
-  - 'One eBTTR model per task, block count by 5-fold cross-validation; chance level from shuffled features (90th percentile).'
-  - 'Baselines AM, RF, LARS, CNN and LSTM, Wilcoxon tests over five test blocks; subject 1 also flexes single fingers (150 trials).'
+  - 'Per electrode: 15 gamma bands (60-130 Hz), LMP, 10 time points over the last second; one eBTTR per task, blocks by 5-fold cross-validation.'
+  - 'Chance from shuffled features (90th percentile); baselines AM, RF, LARS, CNN, LSTM, Wilcoxon over five blocks; subject 1 also flexes single fingers.'
-  - 'Abduction r, thumb-index to ring-pinky: 0.14, 0.32, 0.28, 0.22 (subject 1), 0.04, 0.36, 0.37, 0.37 (subject 2); flexion, subject 1: 0.31, 0.45, 0.12, 0.23, 0.16.'
-  - 'Significantly above chance on every finger pair, better than or on par with the non-linear decoders; thumb abduction is lowest for both subjects, which the paper expects stems from gauging it with the glove.'
-  - 'Trained on single fingers and tested on letters: significantly lower than trained on letters; the reverse seemed on par, which the paper reads as a call for all-finger decoders.'
-  - 'Correlations came out lower than expected, attributed to epidural grids with lower amplitudes; limits: two facial-pain patients, somatomotor implants.'
+  - 'Abduction r, thumb-index to ring-pinky: 0.14, 0.32, 0.28, 0.22 (S1), 0.04, 0.36, 0.37, 0.37 (S2); flexion, S1: 0.31, 0.45, 0.12, 0.23, 0.16.'
+  - 'Significantly above chance on every finger pair, better than or on par with non-linear decoders; thumb lowest for both, expected from the glove.'
+  - 'Single-finger training on letters significantly lower; the reverse seemed on par. Correlations attributed to epidural grids; two facial-pain patients.'
```

### dongho-ecg-clustering

```diff
-title: 'Does the representation of an ECG, more than the clustering algorithm, decide whether clustering finds arrhythmia?'
-sub: 'Which representation clusters? A chance-corrected benchmark of ECG representations for unsupervised arrhythmia structure'
-hook: 'Five representations of PTB-XL strips, from raw samples to two frozen foundation models, are clustered by five algorithms to separate sinus rhythm from atrial fibrillation, and scored with chance-corrected ARI against a supervised ceiling.'
+title: 'Does the ECG representation, more than the algorithm, decide clustering?'
+sub: 'A chance-corrected benchmark of ECG representations for unsupervised arrhythmia structure'
+hook: 'Five representations of PTB-XL strips, five clusterers, scored by chance-corrected ARI against a supervised ceiling.'
-  plain: 'Sixteen simple rhythm measurements sort normal rhythm from atrial fibrillation nearly as well as a model trained on ten million ECGs, and hold up better when data are lopsided or split across hospitals.'
+  plain: 'Sixteen rhythm measurements sort normal rhythm from AF nearly as well as a model trained on ten million ECGs.'
-  - { label: 'Venue', value: 'Biomed. Signal Process. Control, accepted' }
+  - { label: 'Venue', value: 'BSPC 131, 111784' }
-  - { label: 'Stage', value: 'accepted' }
-equation: '\mathrm{ARI} = \frac{\mathrm{RI} - E[\mathrm{RI}]}{\max \mathrm{RI} - E[\mathrm{RI}]}'
-  - 'Representations: raw flattening (1992-d), a conv autoencoder (32-d), 16 hand-crafted RR and P-wave features from lead II, HuBERT-ECG (768-d), ECGFounder (1024-d).'
-  - 'Clusterers: $k$-means, Ward, spectral, GMM and HDBSCAN; ten seeds, patient-grouped, Yeo-Johnson power scaling.'
-  - 'A supervised ceiling per representation (logistic regression and random forest) tells missing information apart from wrong geometry.'
-  - 'Stress tests: a 9:1 SR:AF subsample, and federated $k$-means over ten simulated sites, IID and Dirichlet non-IID.'
+  - 'Representations: raw (1992-d), conv autoencoder (32-d), 16 hand-crafted features from lead II, HuBERT-ECG (768-d), ECGFounder (1024-d).'
+  - '$k$-means, Ward, spectral, GMM, HDBSCAN; ten seeds, patient-grouped; stress tests: a 9:1 SR:AF subsample, federated $k$-means over ten simulated sites.'
-  - 'Best ARI: ECGFounder 0.885, hand-crafted 0.711, HuBERT-ECG 0.195, raw 0.013, conv-AE 0.008; only the last two intervals overlap.'
-  - 'Supervised ceilings in the same order: 0.983, 0.942, 0.899, 0.519, 0.678; HuBERT-ECG holds the label yet clusters at 0.195.'
-  - 'At 9:1 imbalance the hand-crafted features overtake ECGFounder: ARI 0.265 against 0.063.'
-  - 'Non-IID federation: hand-crafted keeps 0.92 of its ARI (worst site draw 0.455), ECGFounder 0.69 (three draws at 0.132 or below).'
+  - 'Best ARI: ECGFounder 0.885, hand-crafted 0.711, HuBERT-ECG 0.195, raw 0.013, conv-AE 0.008; ceilings 0.983, 0.942, 0.899, 0.519, 0.678.'
+  - 'At 9:1 the hand-crafted features overtake ECGFounder, ARI 0.265 against 0.063; in non-IID federation they keep 0.92 of ARI against 0.69.'
+  - 'Robust scaling drops ECGFounder from 0.866 to 0.093; MIT-BIH N-vs-V: 21 morphology features 0.783. Limits: binary tasks, two foundation models.'
-
----
-kind: project
-title: 'Why the weak representations fail, and two cautions for practitioners'
-hook: 'An axis fitted on other patients lifts HuBERT-ECG from 0.160 to 0.549 held-out ARI, so its label lies off the dominant axes; raw flattening moves from 0.000 to 0.001, so no such axis carries its label.'
-panels:
-  - { figure: dongho_silhouette.png, caption: 'Silhouette against ARI for every clustering solution; marker size is the largest-cluster fraction', explain: 'Raw flattening with Ward scores silhouette 0.81 at ARI 0.000, one cluster holding the cohort; the hand-crafted features score 0.28 at ARI 0.711.' }
-results:
-  - 'Scaler choice: hand-crafted mean ARI 0.629 standard, 0.606 power, 0.360 robust, 0.229 quantile; ECGFounder falls from 0.866 to 0.093 under robust.'
-  - 'MIT-BIH N-vs-V beats: 21 morphology features reach 0.783, the conv-AE 0.127 at a 0.927 ceiling, raw beats 0.049.'
-  - 'Cost per record: hand-crafted 28.3 ms and 364 MB, ECGFounder 434.7 ms and 1037.6 MB.'
-  - 'Limits: binary tasks only, two foundation models, federation simulated on one dataset; ECGFounder sees upsampled 100 Hz (0.909 against 0.896 native).'
----
```

### erp-signatures

```diff
-title: 'Do stimulus type and task structure change the ERP signatures of the N-Back task?'
+title: 'Do stimulus type and task structure change N-Back ERP signatures?'
-hook: 'N-Back studies vary their stimuli and timing freely; nine variants crossing three stimulus types with three task structures test whether their N2 and P3 components can be compared at all.'
+hook: 'Nine variants crossing three stimulus types with three task structures test whether N2 and P3 can be compared.'
-  purpose: 'Check whether brain responses to a working-memory test can be compared between labs that show different words, pictures or timings.'
+  purpose: 'Check whether brain responses to a working-memory test can be compared between labs that show different stimuli.'
-  - { label: 'Stage', value: 'accepted' }
-  - 'Three stimulus types (words, pictures, colours) crossed with three task structures (stimulus duration, ISI, response contingency).'
-  - 'UCR: 36 participants doing 4 of the 9 variants each, so every variant has 16; the Leuven and Maribor sets are cut to 16.'
-  - 'Whole-scalp cluster-based permutation tests on the N2 and P3 windows, widening an earlier midline-only analysis.'
-  - 'Conditions are compared as independent groups of participant averages, which is conservative when the within-participant correlation is non-negative.'
+  - 'Words, pictures or colours crossed with stimulus duration, ISI or response contingency; UCR: 36 participants doing 4 of the 9 variants each, 16 per variant.'
+  - 'Whole-scalp cluster-based permutation tests on N2 and P3, conditions compared as independent groups, conservative for non-negative correlation.'
-  - 'Changes in task structure shift the components less than the stimulus type does.'
-  - 'N-Back ERP results are comparable only between studies with matched stimulus type.'
-  - 'A re-check on the 8 participants held locally is a pipeline smoke test only: too few participants and a wrong trial definition.'
+  - 'Task structure shifts the components less than the stimulus type; results are comparable only between studies with matched stimulus type.'
+  - 'The re-check on 8 locally held participants is a pipeline smoke test only.'
```

### glassbox-decision-pipelines

```diff
-title: 'What happens to frozen ECG foundation models predicting one-year mortality when they are handed the patient''s age?'
-sub: 'Transparent and Robust: Interpretable Inputs Improve Foundation Models in Mission-Critical Decision Pipelines'
-hook: 'A gradient-boosted model over 165 named ECG features plus age is set against six frozen ECG foundation models under six corruptions and across two sites; the encoders never see age, and one age column changes the comparison.'
+title: 'What do frozen ECG foundation models gain from the patient''s age?'
+sub: 'Transparent and Robust: Interpretable Inputs Improve Foundation Models in Decision Pipelines'
+hook: 'A GBM over 165 named ECG features plus age against six frozen foundation models under six corruptions and two sites.'
-  purpose: 'Check whether large pretrained ECG models predict who dies within a year better than a model built on named, readable measurements, also on noisy recordings.'
-  plain: 'The large models do not keep the patient''s age in what they extract; adding the age as one extra number improves every one of them.'
+  purpose: 'Check whether large pretrained ECG models predict who dies within a year better than a model built on named measurements.'
+  plain: 'The large models do not keep the patient''s age in what they extract; adding it as one extra number improves every one of them.'
-  - { label: 'Stage', value: 'published' }
-  - 'One-year all-cause mortality from one 12-lead ECG; 60/40 patient-level splits, prevalence 12.9% (MIMIC) and 4.3% (CODE-15).'
-  - 'Named-feature model: gradient boosting over 165 named features (13 per lead, HRV, axis) plus age; every arm gets the same head.'
-  - 'Encoders, frozen: ECGFounder, HuBERT-ECG, ECG-JEPA, xECG, ECG-FM, ST-MEM; six corruptions at three severities, applied to test data only.'
-  - 'Paired DeLong intervals, TOST equivalence at a 0.02 AUROC margin fixed beforehand, five fits for sign stability.'
+  - 'One-year all-cause mortality from one 12-lead ECG, 60/40 patient-level splits; gradient boosting over 165 named features plus age; same head for every arm.'
+  - 'Encoders, frozen: ECGFounder, HuBERT-ECG, ECG-JEPA, xECG, ECG-FM, ST-MEM; paired DeLong, TOST at a 0.02 AUROC margin fixed beforehand.'
-  - 'Gains are largest where the encoders lose most: HuBERT-ECG +0.113 under severe EMG and +0.160 under lead dropout, ECG-FM +0.117, xECG +0.119.'
-  - 'At equal input the encoders lead in 28 of 28 settings; on CODE-15 under severe EMG, age alone scores 0.755 against 0.754 for the named model.'
+  - 'At equal input the encoders lead in 28 of 28 settings; named features without age lose everywhere. Limits: synthetic corruptions, one split, two datasets.'
-
----
-kind: columns
----
-# The unequal-input comparison, and what did not hold
-
-### With age in the named arm only
-
-- CODE-15, severe EMG: the named arm holds 0.754 while ECG-JEPA falls from 0.812 to 0.614.
-- MIMIC to CODE-15 transport: 0.772 against 0.755 clean, 0.753 against 0.687 under severe noise.
-- Lead dropout reverses the order: the named arm falls to 0.677 and 0.745, ECG-JEPA holds 0.750 and 0.788.
-- On MIMIC the severe-EMG difference, +0.010, covers zero and flips sign across fits; CODE-15 to MIMIC transport trails, 0.726 against 0.745 clean.
-
-|||
-
-### Dead ends and limits
-
-- Named features without age lose everywhere; a per-decision sufficiency certificate is near-empty at 4-13% prevalence.
-- A named-feature novelty monitor detects corruption (AUROC up to 0.95) but predicts model errors at chance.
-- Averaging the named and encoder predictions, both with age, gives no gain over the encoder with age.
-- Synthetic corruptions, one fixed split, two datasets, one endpoint.
----
```

### hcc-modality-poster

```diff
-title: 'Does a separate encoder head per MRI sequence group, over one shared backbone, predict HCC better than concatenating the sequences?'
+title: 'Does one encoder head per MRI sequence group predict HCC better?'
-hook: 'Liver MRI comes as four physically different sequence groups; one network stem on their concatenation is set against a DINO-pretrained encoder head per group feeding one shared 3D ConvNeXt backbone.'
+hook: 'One stem on concatenated sequences against a DINO-pretrained encoder head per group feeding one shared 3D ConvNeXt.'
-  - { label: 'Authors', value: 'A. Faes, M.M.J. Guichelaar, D.E. Bouman, S.M. van den Berg, M. Amir Haeri' }
+  - { label: 'Authors', value: 'A. Faes, M.M.J. Guichelaar, ..., M. Amir Haeri' }
-  - { label: 'Stage', value: 'published' }
-  - 'Four sequence groups per examination: DWI (b0 to b800), T1 in- and opposed-phase, T2 short and long TE, DCE (pre, arterial, delayed, venous).'
-  - 'Each group has its own encoder head, pretrained with DINO on that group only and then frozen; contrastive views never cross groups.'
-  - 'One 3D ConvNeXt backbone with the same weights runs once per group; the group embeddings are fused per time point.'
-  - 'A Transformer encoder (4-6 layers, pre-LN, $\sqrt{t}$ positional encoding, CLS pooling) over the examinations gives P(HCC); AUROC over 5 folds and 3 seeds.'
+  - 'Four sequence groups per examination (DWI, T1-IOP, T2W, DCE); each has its own encoder head, pretrained with DINO on that group only and then frozen.'
+  - 'One 3D ConvNeXt, same weights, runs once per group, fused per time point; a Transformer over examinations gives P(HCC); AUROC over 5 folds, 3 seeds.'
-  - 'All four groups: 0.844 AUROC with encoder heads, shared backbone and pretraining, against 0.772 for naive concatenation with pretraining (+0.072).'
-  - 'Without pretraining the decomposition alone gives 0.787 against 0.734 (+0.053).'
-  - 'Encoder heads mitigate the pretraining disparity: every group benefits from DINO pretrained per group; with naive concatenation the poster marks T1-IOP (0.720 to 0.690) and T2W (0.705 to 0.670) as degrading.'
-  - 'Leaving one group out of the full system costs DWI 0.058, DCE 0.044, T1-IOP 0.028 and T2W 0.020 AUROC.'
+  - 'All four groups: 0.844 for heads, shared backbone and pretraining against 0.772 for concatenation (+0.072); without pretraining 0.787 against 0.734 (+0.053).'
+  - 'Single group: DWI 0.808, DCE 0.780, T1-IOP 0.753, T2W 0.738. With concatenation T1-IOP (0.720 to 0.690) and T2W (0.705 to 0.670) degrade.'
+  - 'Leaving one group out costs DWI 0.058, DCE 0.044, T1-IOP 0.028 and T2W 0.020 AUROC.'
-
----
-kind: columns
----
-# Single sequence groups, cohort and training
-
-### One group at a time
-
-- Training with one group only: DWI 0.808, DCE 0.780, T1-IOP 0.753, T2W 0.738; all four combined 0.844.
-- Multi-modal fusion provides a further gain over any single group.
-- Encoder heads without pretraining: DWI 0.729, T1-IOP 0.731, T2W 0.714.
-- Naive concatenation without and with pretraining: DWI 0.718 and 0.795, T1-IOP 0.720 and 0.690, T2W 0.705 and 0.670.
-- DWI and DCE contribute most, in line with their clinical diagnostic value.
-
-|||
-
-### Cohort and training
-
-- Retrospective single-centre cohort from Medisch Spectrum Twente: about 240 patients, about 37 of them HCC-positive.
-- AUROC over 5 folds and 3 seeds.
-- Stage 1: each encoder head is pretrained with DINO on its group, then frozen.
-- Stage 2: backbone and Transformer trained supervised on P(HCC); stage 3: the full system end to end, all parameters unfrozen.
----
```

### hccnet-fl

```diff
-hook: 'HCCNet''s own ablation puts most of its gain in the label-free, self-supervised 3D backbone; component-aware federation (CAF) shares only that backbone and keeps the temporal Transformer, the head and every label at each site.'
+hook: 'HCCNet''s ablation puts its gain in the self-supervised backbone; CAF shares only that backbone, labels stay local.'
-  purpose: 'Let hospitals train a liver-cancer warning model together on their MRI scans without any hospital sending out its patients'' scans or diagnoses.'
-  plain: 'Hospitals share only the part of the model that learns what scans look like, which needs no diagnoses; each keeps its own part for the timing of its patients'' visits and the final prediction.'
+  purpose: 'Let hospitals train a liver-cancer warning model together on MRI scans without any hospital sending out scans or diagnoses.'
+  plain: 'Hospitals share only the part that learns what scans look like; each keeps its own part for visit timing and the final prediction.'
-  - { label: 'Authors', value: 'A. Faes, M.M.J. Guichelaar, D.E. Bouman, S.M. van den Berg, M. Amir Haeri' }
+  - { label: 'Authors', value: 'A. Faes, M.M.J. Guichelaar, ..., M. Amir Haeri' }
-  - { label: 'Cohort', value: 'Cirrhosis surveillance MRI: 243 patients, 37 HCC, 963 examinations' }
-  - { label: 'Stage', value: 'accepted' }
+  - { label: 'Cohort', value: '243 patients, 37 HCC, 963 MRI examinations' }
-  - 'Stage A: each site pretrains the 3D ConvNeXt backbone self-supervised on all its unlabelled scans; the server averages the backbones by sample count, 60 rounds of 1 local epoch.'
-  - 'Stage B: the frozen shared backbone feeds a temporal Transformer encoder and head that each site trains on its own labels; labels and temporal parameters never leave the site.'
-  - 'One single-centre cohort split by patient into 5 simulated silos, inside stratified 5-fold cross-validation; HCCNet-Pico (22.0M parameters, 13.8M in the backbone) on diffusion-weighted MRI.'
-  - 'Compared with local-only, centralised, FedAvg, FedProx, FedBN and FedRep under one per-silo protocol, with AUPRC as the primary metric.'
+  - 'Sites pretrain the backbone on unlabelled scans, the server averages it, each site trains its own head; 5 simulated silos against FedAvg, FedProx, FedBN, FedRep.'
-  - 'AUPRC 0.713 for CAF and 0.724 with local normalisation, against 0.677 for FedBN, the strongest baseline ($\Delta$ 0.036, 95% CI [0.011, 0.061], p = 0.006); centralised 0.744.'
-  - 'At Dirichlet $\alpha$ = 0.1, where some silos hold no positives, worst-silo AUPRC is 0.566 for CAF against 0.274 for FedAvg and 0.280 for FedRep.'
-  - 'Federating the encoder and personalising the backbone instead gives 0.574, below FedAvg''s 0.628.'
-  - 'Per-round upload falls from 88.0 MB to 55.2 MB (37% less in total); CAF+FedBN lowers ECE from FedAvg''s 0.118 to 0.074.'
-equation: '\theta^{(r+1)} = \sum_{k=1}^{K} \frac{n_k}{n}\,\theta_k^{(r)}'
+  - 'AUPRC 0.713 for CAF, 0.724 with local normalisation, against 0.677 for FedBN ($\Delta$ 0.036, 95% CI [0.011, 0.061], p = 0.006); centralised 0.744.'
+  - 'At Dirichlet $\alpha$ = 0.1 worst-silo AUPRC is 0.566 for CAF against 0.274 for FedAvg and 0.280 for FedRep.'
+  - 'Per-round upload falls from 88.0 MB to 55.2 MB; federating the encoder and personalising the backbone instead gives 0.574, below FedAvg''s 0.628.'
+  - 'Limits: silos simulated from one centre, 37 positives, backbone parameters sent in the clear, the released harness not re-run on the cohort.'
-
----
-kind: columns
----
-# Heterogeneity axes, ablations and limits
-
-### Axes and ablations
-
-- Label skew: as $\alpha$ falls to 0.1, CAF mean AUPRC goes from 0.713 to 0.671 and FedAvg from 0.628 to 0.503.
-- Cadence: CAF 0.718 on dense and 0.694 on sparse silos, worst silo 0.671; FedAvg 0.641, 0.583 and 0.547; FedBN worst silo 0.601.
-- Dominant modality: worst-silo AUPRC 0.351 local-only, 0.408 FedAvg, 0.489 CAF.
-- Federated supervised training without pretraining reaches 0.402; the federated self-supervised backbone alone reaches 0.701.
-
-|||
-
-### Simulated silos and the released harness
-
-- The silos are simulated from one centre; scanner field strength (1.5 T and 3 T) is not used as an axis.
-- With 37 positives the worst-silo estimates carry the largest fold variance; at $\alpha$ = 0.1 on average 2.6 of 5 silos are evaluable.
-- Backbone parameters are sent in the clear; secure aggregation and differential privacy are not applied.
-- The harness in `code/` is an independent re-implementation of the pipeline that produced the published numbers, and has not been re-run on the cohort.
----
```

### algebraic-subtyping

```diff
```

### connectivity-motor-imagery

```diff
-title: 'Can an attention network and a graph process recover directed connectivity between reconstructed EEG sources?'
+title: 'Can an attention network and a graph process recover EEG source links?'
-hook: 'Scalp EEG mixes activity from many sources; the draft fed a Temporal Causal Discovery Framework graph into a Causal Graph Process and validated it on one simulated three-source network before the journal paper was dropped.'
+hook: 'The draft fed a TCDF graph into a Causal Graph Process and validated it on one simulated three-source network.'
-  plain: 'A neural network first guesses which regions talk to each other, and a graph model then fits how strongly, on signals traced back from the scalp into the brain.'
+  plain: 'A neural network first guesses which regions talk to each other, and a graph model then fits how strongly.'
-  - { label: 'Stage', value: 'stopped' }
-equation: 'x[k] = w[k] + \sum_{i=1}^{M} \Big( \sum_{j=0}^{i} c_{ij} A^j \Big)\, x[k-i]'
-  - 'Causal Graph Process: an autoregressive model whose lag matrices are polynomials in one graph $A$, fit with $\ell_1$ penalties on $A$ and $c$.'
-  - 'The Temporal Causal Discovery Framework, an attention CNN with causal validation, gives a first graph $\mu$; a term $\lambda_3 \lVert A - \mu \rVert_1$ ties the fit to it.'
-  - 'The same network drops nodes with no incoming or outgoing link, which shortens the graph fit.'
+  - 'Causal Graph Process: $x[k] = w[k] + \sum_i (\sum_j c_{ij} A^j) x[k-i]$, lag matrices polynomial in one graph $A$, $\ell_1$ penalties on $A$ and $c$.'
+  - 'TCDF, an attention CNN with causal validation, gives a first graph $\mu$; $\lambda_3 \lVert A - \mu \rVert_1$ ties the fit to it; unlinked nodes are dropped.'
-  - '3 brain sources and 500 noisy sources, SNR 0.9 at sources and at sensors, projected to the scalp and reconstructed.'
-  - 'The New York Head Model serves as the forward model from brain sources to the scalp.'
+  - '3 brain sources and 500 noisy sources, SNR 0.9 at sources and at sensors, projected with the New York Head Model and reconstructed.'
+  - 'True: $x_1$ own lags 0.5, $-0.7$, from $x_2$ 0.25; $x_2$ 0.7, $-0.5$, from $x_1$ 0.2, $x_3$ 0.25; $x_3$ 0.8, no inputs.'
+  - 'Recovered: $x_1$ 0.5, $-0.4$, terms $0.14\,x_2(n-1)$, $0.14\,x_3(n-2)$, $0.2\,x_2(n-1)$; $x_2$ 0.77, $-0.28$, from $x_1$ 0.18, $x_3$ 0.31; $x_3$ 0.8.'
-  - 'Its conclusion: the work shows the applicability of the Temporal Causal Discovery Framework on source-reconstructed scalp EEG.'
-
----
-kind: columns
----
-# The simulated network and the coefficients the method recovered
-
-### Ground truth (Omidvarnia et al. 2011 pattern)
-
-- $x_1$: own lags 0.5 and $-0.7$; from $x_2$ at lag 1, 0.25.
-- $x_2$: own lags 0.7 and $-0.5$; from $x_1$ 0.2 and from $x_3$ 0.25, both at lag 1.
-- $x_3$: own lag 0.8; no inputs.
-
-|||
-
-### Recovered from reconstructed sources
-
-- $x_1$: own lags 0.5 and $-0.4$; terms $0.14\,x_2(n-1)$, $0.14\,x_3(n-2)$ and $0.2\,x_2(n-1)$.
-- $x_2$: own lags 0.77 and $-0.28$; from $x_1$ 0.18 and from $x_3$ 0.31.
-- $x_3$: own lag 0.8.
----
```

### flkit

```diff
-title: 'How can health and life-science researchers be brought onto federated learning?'
-sub: 'Development and Design of FLKit: A Structured Onboarding Toolkit for Federated Learning in Health and Life Sciences'
-hook: 'FLKit treats the adoption of federated learning in health and life sciences as an onboarding and usability problem, and bundles environment setup, client and server orchestration, and worked examples.'
+title: 'How can health researchers be brought onto federated learning?'
+sub: 'FLKit: A Structured Onboarding Toolkit for Federated Learning in Health and Life Sciences'
+hook: 'FLKit treats federated-learning adoption as an onboarding problem, bundling setup, orchestration and worked examples.'
-  plain: 'FLKit is a kit with set-up steps for the environment, the programs that orchestrate the clients and the server, and worked examples.'
+  plain: 'FLKit is a kit with environment set-up steps, programs that orchestrate clients and server, and worked examples.'
-  - { label: 'Code', value: 'UHasselt-BiomedicalDataSciences/federated-learning-toolkit' }
-  - { label: 'Stage', value: 'submitted' }
+  - { label: 'Code', value: 'federated-learning-toolkit' }
-  - 'Environment setup for the participating sites.'
-  - 'Client and server orchestration for a federated run.'
+  - 'Environment setup for the participating sites; client and server orchestration for a federated run.'
```

### chi-household-survival

```diff
-title: 'What happens when a broom, a fan, a vacuum cleaner and a mousetrap become the weapons of a room-sized game?'
+title: 'A broom, a fan, a vacuum cleaner and a mousetrap as room-game weapons'
-hook: 'Household Survival is a floor-projected tower-defence game in which four tracked household objects fend off enemy bots; in RoomAlive players use touch, instrumented pointing devices or standard controllers, and iCon does not consider an object''s real-life purpose, while here each object''s virtual attributes represent its real-world function.'
-tag: { class: design, text: 'Game prototype' }
+hook: 'A floor-projected tower-defence game in which four tracked household objects keep their real-world function.'
+tag: { class: design, text: 'Student Game Competition' }
-  plain: 'You sweep enemies away with a real broom, blow them off with a real fan, suck them up with a real vacuum cleaner and catch them in a real mousetrap, while the game is projected on the floor.'
+  plain: 'You sweep, blow, suck up and trap enemies with real household objects while the game is projected on the floor.'
-  - { label: 'Venue', value: 'CHI EA 2016, Student Game Competition, pp. 168-171' }
+  - { label: 'Venue', value: 'CHI EA 2016, pp. 168-171' }
-  - { label: 'Stage', value: 'published' }
-  - 'Reflective markers on each object; an OptiTrack motion-capture system tracks them as rigid bodies against the playing field.'
-  - 'Two fixed rigid bodies mark the field extremities for calibration; an Android app fine-tunes the field and object calibration.'
-  - 'A physics engine in a Unity game turns each object''s motion into its real-world effect; a ceiling-mounted short-throw projector draws the scene on the floor.'
+  - 'OptiTrack tracks reflective markers on each object; a physics engine in Unity turns its motion into its real-world effect, projected on the floor.'
-  - 'Broom: drags bots precisely to a chosen spot. Fan: scatters them along the airflow, without fine control of direction.'
-  - 'Vacuum cleaner: pulls nearby bots into the tube and destroys them. Mousetrap, built from K''nex: catches bots only while loaded, shown by a projected overlay.'
+  - 'Broom drags bots precisely; fan scatters them along the airflow; vacuum cleaner pulls them into the tube; K''nex mousetrap catches them only while loaded.'
-  - 'Developed as a student project for a university-level course; it is still used in university courses as a teaching example.'
+  - 'Developed as a student project for a university course; it is still used in university courses as a teaching example.'
```

### chi-purpose-centric

```diff
-title: 'Should an everyday object used as a game controller do in the game what it does in real life?'
+title: 'Should a game controller do in the game what it does in real life?'
-hook: 'Earlier work maps the affordances of an everyday object to an analogous digital input, a bottle cap to a knob; purpose-centric appropriation gives each object a virtual rendition that mimics its real-world purpose and function.'
-tag: { class: design, text: 'Interaction concept' }
+hook: 'Purpose-centric appropriation gives each everyday object a virtual rendition that mimics its real-world purpose.'
+tag: { class: design, text: 'Student Game Competition concept' }
-  - { label: 'Venue', value: 'CHI EA 2016, Student Game Competition, pp. 2744-2750' }
-  - { label: 'Testbed', value: 'Household Survival, a room-sized tower-defence game' }
-  - { label: 'Stage', value: 'published' }
+  - { label: 'Venue', value: 'CHI EA 2016, pp. 2744-2750' }
+  - { label: 'Testbed', value: 'Household Survival' }
-  - 'Affordance-centric mapping, as in iCon, shows what can be done with an object; purpose-centric mapping also shows what the action will do in the game.'
-  - 'Testbed weapons: a floor mop or broom, a pedestal fan, a vacuum cleaner and a K''nex mousetrap, each defending the players'' towers against spawning bots.'
-  - 'Motion capture tracks the objects, a physics engine takes each object''s physical characteristics into account, and the scene is projected onto the floor.'
-  - 'Design extensions: bottles and mugs pour and collect, a pen clicker draws boundaries and paths, an iron smooths terrain, a hair dryer blows and dries.'
+  - 'Affordance-centric mapping (iCon) shows what can be done with an object; purpose-centric mapping also shows what the action does in the game.'
+  - 'Testbed: a floor mop or broom, pedestal fan, vacuum cleaner and K''nex mousetrap; motion capture, a physics engine and floor projection.'
+  - 'Design extensions: bottles and mugs pour and collect, a pen clicker draws paths, an iron smooths terrain, a hair dryer blows and dries.'
-  - 'No formal evaluation; usability, learnability and immersion against standard controllers are left to later studies.'
-  - 'One game style, tower defence, and four objects were built.'
+  - 'No formal evaluation against standard controllers; one game style, tower defence, and four objects were built.'
```

### algebraic-effects-compilation

```diff
-title: 'Can programs written with algebraic effect handlers run as fast as hand-written OCaml?'
+title: 'Can algebraic effect handler code run as fast as hand-written OCaml?'
-hook: 'Most handler-based programs are still much slower than hand-written code; an optimising compiler from Eff to OCaml removes handlers at compile time, guided by the type-and-effect system.'
+hook: 'An optimising compiler from Eff to OCaml removes handlers at compile time, guided by the type-and-effect system.'
-  plain: 'The compiler rewrites the program so that the costly effect machinery disappears where it can, and turns the parts without side effects into plain code.'
+  plain: 'The compiler removes the costly effect machinery where it can and turns the side-effect-free parts into plain code.'
-  - { label: 'Stage', value: 'published' }
-  - 'Source-to-source rewrite rules push handlers inward and drop them; each rule preserves observational equivalence (Theorem 4.1).'
-  - 'Recursive functions are specialised for the handler applied to them; non-tail recursion is generalised over the return case, a selective CPS transform.'
-  - 'Basic translation: effectful Eff computations become OCaml values of a free monad, with types preserved (Theorem 5.1).'
-  - 'Purity-aware translation: computations with an empty effect set compile to plain OCaml, let in place of bind, also type-preserving (Theorem 6.2).'
+  - 'Rewrite rules push handlers inward and drop them (Theorem 4.1); recursive functions are specialised for their handler, a selective CPS transform.'
+  - 'Effectful Eff becomes OCaml free-monad values, types preserved (Theorem 5.1); empty-effect computations compile to plain OCaml (Theorem 6.2).'
-  - 'Loop benchmarks: basic compilation is 25x to 50x slower than hand-written OCaml.'
-  - 'Rewriting or purity-aware code alone has varying success in narrowing the gap; only both together are competitive with hand-written OCaml (1x to 1.5x), and they remove every trace of handlers and the free monad.'
-  - 'N-Queens, all solutions: optimised Eff is consistently the fastest of the OCaml-based effect systems tested and competitive with hand-written OCaml.'
-  - 'N-Queens, first solution: optimised Eff is 25-30% faster than Multicore OCaml, the closest competitor.'
-equation: '\mathrm{handle}\ f\,v\ \mathrm{with}\ h \;\leadsto\; \mathrm{let\ rec}\ f''\,x = \mathrm{handle}\ c_f\ \mathrm{with}\ h\ \mathrm{in}\ f''\,v'
+  - 'Loops: basic compilation is 25x to 50x slower than hand-written OCaml; only rewriting plus purity-aware code is competitive (1x to 1.5x).'
+  - 'Run time, % of basic, rewriting / purity-aware / both / hand-written: pure loop 78.5, 35.4, 2.4, 2.3; state 34, 85, 3.3, 2.3.'
+  - 'N-Queens: optimised Eff is the fastest OCaml-based effect system tested, competitive with hand-written OCaml; first solution 25-30% faster than Multicore OCaml.'
-
----
-kind: columns
----
-# Benchmarks, design choices and future work
-
-### Loop run time, % of basic compilation
-
-- Pure loop: rewriting 78.5, purity-aware 35.4, both 2.4, hand-written 2.3.
-- Latent operation, in the same order: 74.3, 37.4, 2, 1.9.
-- Increment operation: 56, 62.3, 5.5, 3.8.
-- State with Get and Put: 34, 85, 3.3, 2.3.
-
-|||
-
-### Design choices and future work
-
-- Specialisation can diverge; termination is enforced by never re-specialising a specialised function.
-- Every higher-order function is compiled as taking impure arguments; optimising complex patterns such as nested handlers is future work.
-- The system comparison runs as bytecode, since DelimCC has no native compilation; the Links backend, 20 times slower than OCaml, is left out.
-- All runs on one MacBook Pro (2.5 GHz Core i7, 16 GB) with OCaml 4.02.2.
----
```

### http2-best-practices

```diff
-title: 'Should web developers keep concatenating, embedding and sharding when they move to HTTP/2?'
+title: 'Do concatenation, embedding and sharding still make sense in HTTP/2?'
-hook: 'Earlier HTTP/2 studies contradict each other, and most use a single server package, browser, network setup and metric; the Speeder framework runs many setup permutations to tell protocol behaviour from implementation behaviour.'
+hook: 'The Speeder framework runs many setup permutations to tell protocol behaviour from implementation behaviour.'
-  plain: 'Bundling files and spreading them over several servers still pay off; HTTP/2 is mostly as fast as the old protocol, and where it is slower the cause is mainly inefficient software.'
+  plain: 'Bundling files and spreading them over several servers still pay off; HTTP/2 is mostly as fast as the old protocol.'
-  - { label: 'Setup', value: 'NGINX, Chrome via Webpagetest, dynamic cellular network model' }
-  - { label: 'Stage', value: 'published' }
+  - { label: 'Setup', value: 'NGINX, Chrome via Webpagetest' }
-  - 'Speeder: Docker-deployed servers (Apache, NGINX, NodeJS), browsers (Chrome, Firefox), test drivers and network emulators combined into setup permutations.'
-  - 'HTTPS/2 compared with HTTPS/1.1 and cleartext HTTP/1.1 under a dynamic cellular loss model (NoLoss to VeryPoor) and a fixed model.'
-  - 'Metrics: loadEventEnd and SpeedIndex; each point aggregates 10 to 100 page loads, and each experiment ran at least five times.'
-  - 'Synthetic cases per best practice (images, CSS, JS; 1 to 500 files; sharding over 4 hosts), then nine image-heavy real websites.'
+  - 'HTTPS/2 against HTTPS/1.1 and cleartext HTTP/1.1 under a dynamic cellular loss model; loadEventEnd and SpeedIndex over 10 to 100 page loads.'
+  - 'Synthetic cases per best practice (1 to 500 files; sharding over 4 hosts), then nine image-heavy real websites, all in Docker-deployed Speeder setups.'
-  - 'HTTP/2 rarely beats HTTP/1 by much, can be much slower than cleartext HTTP/1.1, and often starts rendering later.'
-  - 'HTTP/2 underperforms mainly through inefficient implementations; with large files, packet loss impacts its single connection more.'
+  - 'HTTP/2 rarely beats HTTP/1 by much, can be much slower than cleartext HTTP/1.1 and underperforms mainly through inefficient implementations.'
-
----
-kind: columns
----
-# Per best practice, and the limits of the setup
-
-### Per best practice
-
-- Images: with 380 small icons, HTTP/2 beats HTTP/1 on separate files; one sprite is two to five times faster and brings the two near par.
-- CSS and JS: HTTP/2 takes the lead from about 30-40 simple CSS files and about 100 complex JS files.
-- Embedding and Push: small gains bound by the 14 KB initial TCP window; pushing assets in the wrong order slows the page.
-- Sharding lowers the effectiveness of HPACK header compression by 25% to 50%.
-
-|||
-
-### Testbed and browser caveats
-
-- A virtualised setup on two Dell PowerEdge R420 machines; load times are compared between setups, all equally affected.
-- Push runs on Apache, since NGINX did not support Push; an Apache priority bug sent the font after the images.
-- Chrome blocks rendering on every CSS file and Firefox applies even head CSS progressively, which shifts SpeedIndex.
-- The nine real websites show how hard measurements are to read; the paper draws no definitive conclusion from them.
----
```

### http2-web-performance

```diff
-title: 'Which of HTTP/2''s four performance features actually speed up page loads over HTTP/1.1?'
+title: 'Which HTTP/2 features speed up page loads over HTTP/1.1?'
-hook: 'HTTP/2 adds a single multiplexed connection, prioritisation, Server Push and HPACK header compression; this study tests each in isolation and then on two corpora of real pages.'
+hook: 'One multiplexed connection, prioritisation, Server Push and HPACK tested in isolation, then on two corpora of real pages.'
-  plain: 'Sending everything over one connection matters most, and it can stall on bad networks; the other new features matter less, and most of the slowness seems to come from immature browser and server software.'
+  plain: 'One connection matters most and can stall on bad networks; most of the slowness seems to come from immature browser and server software.'
-  - { label: 'Corpora', value: 'A: 9 landing pages; B: 40 Alexa and Moz pages' }
-  - { label: 'Stage', value: 'published' }
+  - { label: 'Corpora', value: 'A: 9 pages, 10+ loads; B: 40 pages, 20+ loads' }
-  - 'The Speeder framework, extended with the H2O server, Chrome up to v60, Firefox up to v54 and the H2Vis packet and priority-tree visualiser.'
-  - 'HTTPS/2 against HTTPS/1.1 and cleartext HTTP/1.1 on a dynamic cellular network model, scored by loadEventEnd and SpeedIndex.'
+  - 'Speeder extended with H2O, Chrome up to v60, Firefox up to v54 and the H2Vis visualiser; loadEventEnd and SpeedIndex on a dynamic cellular model.'
-  - 'Corpus A loaded at least 10 times per page and corpus B at least 20 times; medians reported.'
-  - 'The single connection has by far the largest effect: with 30 large images, packet loss alone makes HTTP/2 almost 80% slower while HTTP/1 barely changes.'
-  - 'Round Robin, the default of the HTTP/2 specification, clearly worsens SpeedIndex on Poor networks; otherwise the prioritisation scheme matters little.'
-  - 'HPACK cuts header bytes by more than a factor of five for 400 JS files, arguably too little to change a single page load.'
+  - 'The single connection has by far the largest effect: with 30 large images, packet loss alone makes HTTP/2 almost 80% slower.'
+  - 'Round Robin, the HTTP/2 default, clearly worsens SpeedIndex on Poor networks; HPACK cuts header bytes by more than a factor of five for 400 JS files.'
-
----
-kind: columns
----
-# Implementation problems and scope
-
-### Implementation problems found
-
-- Requests through a Service Worker lose their priority: Chrome falls back to first-come-first-served, Firefox to Round Robin.
-- Firefox treats async and defer scripts as normal high-priority JS, where Chrome marks them Low.
-- Chrome applies HTTP/2 JavaScript in groups of 50 to 300 files, so rendering starts later than over HTTP/1.
-- Using several connections also helps HTTP/2 on bad networks, where its problems are largest.
-
-|||
-
-### Scope and related work
-
-- Server Push is shown on one example page; a full evaluation is outside the paper's scope.
-- Networks are emulated; the paper cannot confirm the more positive HTTP/2 results of work that loads pages directly over the internet.
-- Corpus A is small, so the causes of HTTP/2's uneven Poor-network results could not be pinned down on it.
-- The QUIC protocol, on UDP, might help HTTP/2 overcome its single-connection problems.
----
```

### coordinated-fingers-ecnr

```diff
-title: 'Can high-density EEG tell individual and coordinated finger movements of one hand apart?'
-sub: 'Individual and Coordinated Finger Movements Decoding from High-Density EEG and Its Implications in Hand Exoskeleton Control'
-hook: 'An EEG-controlled hand exoskeleton needs finger-level decoding, which EEG studies rarely address; four participants performed eight cued finger movements under a 62-electrode cap.'
+title: 'Can high-density EEG tell individual and coordinated finger movements apart?'
+sub: 'Individual and Coordinated Finger Movements Decoding from High-Density EEG'
+hook: 'Four participants performed eight cued finger movements under a 62-electrode cap, for EEG-controlled hand exoskeletons.'
-  purpose: 'Find out whether a scalp brain recording can tell which finger movement a person makes, to steer a robotic glove for paralysed hands.'
-  plain: 'A grasp and a pinch can be told apart from the brain signal, single fingers hardly; the slow brain signal can show when a movement starts.'
+  purpose: 'Find out whether scalp EEG can tell which finger movement a person makes, to steer a robotic glove for paralysed hands.'
+  plain: 'A grasp and a pinch can be told apart from the brain signal, single fingers hardly; a slow signal shows when movement starts.'
-  - { label: 'Data', value: '4 healthy participants, 62 electrodes, data glove' }
-  - { label: 'Stage', value: 'published' }
+  - { label: 'Data', value: '4 healthy participants, data glove' }
-  - 'Eight cued movements: the five single fingers, pinch, three-finger pinch and grasp.'
-  - 'Active electrodes over the hemisphere contralateral to the dominant hand; a data glove records the hand.'
-  - 'Offline pairwise classification on 8-30 Hz power after movement onset.'
-  - 'Movement-related cortical potentials (MRCP) examined in the 0.3-3 Hz band.'
+  - 'Eight cued movements: five single fingers, pinch, three-finger pinch and grasp; active electrodes over the hemisphere contralateral to the dominant hand.'
+  - 'Offline pairwise classification on 8-30 Hz power after movement onset; movement-related cortical potentials (MRCP) examined in the 0.3-3 Hz band.'
-  - 'Grasp against either pinch: pairwise accuracy reaches 80%.'
-  - 'Single fingers against each other: just above the 50% chance level.'
-  - 'The MRCP falls from about 0.5 s before movement onset and rebounds after it, but differs too little between movements to classify them, unlike one earlier report.'
+  - 'Grasp against either pinch: pairwise accuracy reaches 80%. Single fingers against each other: just above the 50% chance level.'
+  - 'The MRCP falls from about 0.5 s before onset and rebounds after it, but differs too little between movements to classify them, unlike one earlier report.'
```

### ecog-frequency-features

```diff
-title: 'Which ECoG frequency features carry finger movement, and does decoding from only those beat the whole spectrum?'
+title: 'Which ECoG frequency features carry finger movement?'
-hook: 'Comparable prior work decodes fingers from the entire ECoG spectrum; splitting a trajectory into movement dynamics and movement events shows that two features, one per state, decode better.'
+hook: 'Splitting a trajectory into movement dynamics and movement events shows that two features, one per state, decode better.'
-  plain: 'Fast brain rhythms show when a finger moves and the slow signal shows how it bends; a decoder using just those two follows the finger better and makes fewer false movements at rest.'
+  plain: 'Fast rhythms show when a finger moves and the slow signal how it bends; a decoder on just those two follows the finger better.'
-  - { label: 'Data', value: 'Stanford ECoG, 9 participants, 38-64 electrodes' }
-  - { label: 'Stage', value: 'published' }
+  - { label: 'Data', value: 'Stanford ECoG, 38-64 electrodes' }
-  - 'Eight features per channel at 20 Hz: the local motor potential (LMP) and power in seven bands from delta (0-5 Hz) to high gamma (100-200 Hz).'
-  - 'Ordinary least squares per participant and finger on a one-second tap-delay window, forward selection of up to 10 channels, 3-fold cross-validation.'
-  - 'Each feature is scored on movement dynamics, on movement events and on the original trajectory.'
-  - 'Decoder: LMP plus high gamma predicts the trajectory, and a high-gamma-only regressor sets rest samples to a constant $c$.'
+  - 'Eight features per channel at 20 Hz (LMP, seven power bands); OLS per participant and finger, up to 10 channels forward-selected, scored on dynamics and events.'
+  - 'Decoder: LMP plus high gamma give $Y_1$, high gamma alone gives $Y_2$; the output is a constant $c$ where $Y_2 \le th$, otherwise $Y_1$.'
-  - 'LMP decodes movement dynamics best and high gamma decodes movement events best (paired t-tests over 45 participant-finger pairs).'
-  - 'Average correlation with the true trajectory is 0.5, against 0.45 for the whole-spectrum linear decoder of Liang and Bougrain run under the same protocol.'
-  - 'Variance during rest is significantly lower than for that decoder.'
-  - 'The best LMP cut-off follows movement rate: 1.5 Hz for slow and 3.5 Hz for fast movers.'
-equation: 'Y_3 = \begin{cases} c, & Y_2 \le th \\ Y_1, & Y_2 > th \end{cases}'
+  - 'LMP decodes dynamics best, high gamma events best (paired t-tests over 45 pairs); the best LMP cut-off is 1.5 Hz for slow and 3.5 Hz for fast movers.'
+  - 'Average correlation with the true trajectory 0.5, against 0.45 for the whole-spectrum decoder of Liang and Bougrain; rest variance significantly lower.'
+  - 'Limits: LMP falls short separating movement from rest and cued from co-activated fingers; rest variance stays above zero; repetitive flexions only.'
-
----
-kind: columns
----
-# Feature analysis and limits
-
-### Temporal and spatial analysis
-
-- High gamma contributes mostly in the 250 ms before the predicted sample; LMP contributions spread wider and vary with movement rate.
-- Longer windows help high gamma steadily, LMP less consistently.
-- LMP decodes well from more channels than high gamma, most of all for thumb, index and pinky.
-- Participant 9, movement dynamics: an LMP cut-off of 1.5 Hz gives 0.4 and 3.5 Hz gives 0.46.
-
-|||
-
-### Where LMP and high gamma fall short
-
-- LMP falls short in discriminating movement from rest, and a cued finger from involuntary co-activation by other fingers.
-- Rest variance stays above zero because high-gamma event detection is imperfect.
-- Splitting high gamma into 60-100 Hz and above 100 Hz gives similar results from both bands.
-- Repetitive flexions only; a check for high-gamma decline during repetition was inconclusive.
----
```

### modulation-lmp-bci

```diff
-title: 'Can gamma-band event detection steady finger trajectories decoded from ECoG?'
+title: 'Can gamma-band event detection steady ECoG finger trajectories?'
-hook: 'Finger trajectories decoded from ECoG wander between movements; a second decoder on high-gamma activity detects the movement events and gates the trajectory decoded from the local motor potential.'
+hook: 'Trajectories wander between movements; a high-gamma decoder gates the local motor potential (LMP) decoder.'
-  plain: 'One model follows how the finger moves and a second decides whether it is moving at all; together they make the decoded finger steadier at rest.'
+  plain: 'One model follows how the finger moves and a second decides whether it moves at all.'
-  - { label: 'Stage', value: 'published' }
-  - 'Two Block-Term Tensor Regression models: one on LMP (< 3.5 Hz) ECoG against data-glove trajectories, one on high-gamma (> 60 Hz) ECoG against binarised trajectories.'
-  - 'Where the gamma estimate exceeds a threshold, the LMP trajectory is multiplied by it; elsewhere the output is a constant $C$.'
-  - '$C$ and the threshold are set per participant and finger by cross-validation on the trajectory correlation.'
+  - 'Two Block-Term Tensor Regression models: LMP (< 3.5 Hz) to data-glove trajectories, high gamma (> 60 Hz) to binarised trajectories.'
+  - 'Where the gamma estimate exceeds a threshold, the LMP trajectory is multiplied by it; elsewhere the output is a constant $C$, set by cross-validation.'
-equation: 'y(t) = \begin{cases} C, & x_\gamma(t) \le \mathrm{threshold} \\ x_{\mathrm{lmp}}(t)\, x_\gamma(t), & x_\gamma(t) > \mathrm{threshold} \end{cases}'
```

### highgamma-event-detection

```diff
-title: 'Does detecting movement events in high-gamma ECoG keep decoded fingers still at rest?'
+title: 'Does high-gamma event detection keep decoded fingers still at rest?'
-hook: 'Even state-of-the-art finger decoders show instabilities between movement events; the LMP trajectory is multiplied by a thresholded high-gamma event estimate and held at a constant below the threshold.'
+hook: 'State-of-the-art finger decoders show instabilities between movement events; a thresholded event estimate holds the output.'
-  plain: 'A detector for when the finger moves switches the trajectory decoder on and off, which steadies the prediction while the hand rests.'
+  plain: 'A detector for when the finger moves switches the trajectory decoder on and off.'
-  - { label: 'Venue', value: 'Proc. 10th International BCI Meeting 2023' }
+  - { label: 'Venue', value: '10th International BCI Meeting 2023' }
-  - { label: 'Stage', value: 'published' }
-  - 'Trajectory model: block-term tensor regression from ECoG below 3.5 Hz to the data-glove signal.'
-  - 'Event model: block-term tensor regression from ECoG above 60 Hz to a binarised copy of that signal.'
-  - 'Above the threshold the two estimates are multiplied, below it the output is held at $C$; both are tuned per subject and finger on cross-validated cross-correlation.'
-  - 'Tested on rapid single-finger repetitions, Dataset 4 of BCI Competition IV.'
+  - 'Block-term tensor regression twice: ECoG below 3.5 Hz to the data-glove signal, ECoG above 60 Hz to a binarised copy of it.'
+  - 'Above the threshold the two estimates are multiplied, below it the output is held at $C$; both tuned per subject and finger on cross-correlation.'
-  - 'The stability improvement suggests that high gamma distinguishes rapid finger movements from rest and that the LMP codes the trajectory.'
-equation: 'y(t) = f\big(x_{\mathrm{lmp}}(t), x_\gamma(t)\big) = \begin{cases} C, & x_\gamma(t) \le \mathrm{threshold} \\ x_{\mathrm{lmp}}(t) \times x_\gamma(t), & x_\gamma(t) > \mathrm{threshold} \end{cases}'
+  - 'The improvement suggests that high gamma distinguishes rapid finger movements from rest and that the LMP codes the trajectory.'
```

### editorial-bigdata-ai-ms

```diff
-hook: 'MS differs from patient to patient in symptoms, progression and treatment response; this editorial opens a Frontiers in Immunology Research Topic on how data and AI can support personalised care.'
+hook: 'MS differs from patient to patient; this editorial opens a Research Topic on how data and AI can support personalised care.'
-  - { label: 'Collection', value: 'Research Topic on big data and AI in MS' }
-  - { label: 'Stage', value: 'published' }
-  - 'Examples: the CLAIMS project for an AI decision-support platform, AI to diversify treatment regimens, and AI brain volumetry set against neuropsychological tests in clinically isolated syndrome.'
-  - 'Future trends: trustworthy machine learning, patient-reported outcome measures at scale, and European data initiatives such as EHDS, DARWIN-EU, OHDSI, EBRAINS and ELIXIR.'
-  - 'Modalities: AI for MRI, digital remote monitoring with wearables and smartphones, and AI on serum, blood and cerebrospinal-fluid biomarkers.'
+  - 'Examples: the CLAIMS decision-support platform, AI to diversify treatment regimens, AI brain volumetry against neuropsychological tests.'
+  - 'Future trends: trustworthy machine learning, patient-reported outcome measures at scale, European data initiatives (EHDS, DARWIN-EU, OHDSI, EBRAINS, ELIXIR).'
+  - 'Modalities: AI for MRI, digital remote monitoring with wearables and smartphones, AI on serum, blood and cerebrospinal-fluid biomarkers.'
-  - 'The domain is expanding rapidly.'
-  - 'Open issues: trustworthy and reliable AI models, consistent multidimensional longitudinal data, the patient perspective, and alignment with regulation such as EHDS.'
-  - 'A systematic review in the Topic finds most AI biomarker papers in MS published within the past four years, still some distance from clinical use.'
-  - 'The Topic gathers reviews, perspectives and original research articles.'
+  - 'Open issues: trustworthy and reliable AI models, consistent multidimensional longitudinal data, the patient perspective, alignment with regulation such as EHDS.'
+  - 'The domain is expanding rapidly; a systematic review finds most AI biomarker papers in MS within the past four years, still some distance from clinical use.'
```

### pfl-ms-npj

```diff
-title: 'Can federated learning predict MS disability progression when every country holds different data?'
-sub: 'Personalized federated learning for predicting disability progression in multiple sclerosis using real-world routine clinical data'
-hook: 'One global federated model fits 32 very different country partitions of MSBase poorly; letting each client keep its own extension layers, or fine-tune the global model, lifts ROC-AUC from 0.78 to 0.84.'
+title: 'Can federated learning predict MS progression across differing countries?'
+sub: 'Personalized federated learning for predicting disability progression in multiple sclerosis'
+hook: 'Each of 32 MSBase country partitions keeps its own extension layers or fine-tunes the global model: ROC-AUC 0.78 to 0.84.'
-  purpose: 'Predict which people with multiple sclerosis will get worse within two years, using hospital records that stay in each country.'
-  plain: 'Every country trains a shared part of the model together and keeps a private part tuned to its own patients, which predicts better than one model shared by all.'
+  purpose: 'Predict which people with multiple sclerosis will get worse within two years, with hospital records staying in each country.'
+  plain: 'Every country trains a shared part of the model together and keeps a private part tuned to its own patients.'
-  - { label: 'Cohort', value: '283,115 episodes, 26,246 patients, 146 centres' }
-  - { label: 'Stage', value: 'published' }
+  - { label: 'Cohort', value: '283,115 episodes, 26,246 patients' }
-  - 'Episodes from the MSBase registry: baseline EDSS, full prior history, and a label for confirmed progression within 2 years; split by country into 32 clients, each 60/20/20.'
-  - 'Baseline: a 42-input MLP with 5 layers of 512, trained over 350 rounds with FedAVG, FedProx, FedAdagrad, FedYogi and FedAdam, 10 repeats.'
-  - 'AdaptiveDualBranchNet adds up to 5 local extension layers of 64 units by client size (none below about 2000 samples, all above about 25000); only the other layers are aggregated.'
-  - 'Fine-tuning retrains the final global model on each client; centralized and local models are the comparators.'
+  - 'MSBase episodes labelled for confirmed progression within 2 years; 32 country clients; a 42-input MLP over 350 rounds with five federated optimisers, 10 repeats.'
+  - 'AdaptiveDualBranchNet adds up to 5 local extension layers by client size; only the other layers are aggregated; fine-tuning retrains the global model per client.'
-  - 'AUC-PR rises from 0.4081 for baseline FedProx to 0.5346 adaptive, against 0.4605 centralized.'
-  - 'Adaptive models lead in 11 countries, fine-tuned in 6, centralized in 5, local in 3 and baseline federated in none.'
-  - 'The adaptive gains cost training time: adaptive FedProx takes 217.51 min against 171.77 for baseline FedProx, 27% longer.'
-equation: '\Phi_f = \sum_{k=1}^{K} \frac{n_k}{n}\Big(\Theta''^{\,\mathrm{input}}_{k,f} + \Theta''^{\,\mathrm{core}}_{k,f} + \Theta''^{\,\mathrm{combine}}_{k,f} + \Theta''^{\,\mathrm{output}}_{k,f}\Big)'
+  - 'AUC-PR rises from 0.4081 for baseline FedProx to 0.5346 adaptive, against 0.4605 centralized; adaptive leads in 11 countries, fine-tuned in 6.'
+  - 'Adaptive FedProx takes 27% longer (217.51 against 171.77 min); federation is simulated on country partitions; calibration needs further work.'
-
----
-kind: columns
----
-# Where personalization helps, and the limits the paper states
-
-### Client size
-
-- Federated beats local in five of the six largest countries, which hold 82% of the data.
-- The federated-to-local gap correlates moderately with dataset size (Spearman $\rho = -0.503$, $p = 0.010$), the federated-to-centralized gap strongly ($\rho = -0.761$, $p < 0.001$).
-- Fine-tuning gives the most consistent improvements for clients with intermediate data volumes; small clients risk overfitting and unstable evaluation.
-
-|||
-
-### Limits the paper states
-
-- Federation is simulated on country partitions, so network variability, system heterogeneity and dropout are not captured.
-- Scores are test-size-weighted averages over clients, which may favour the larger ones.
-- Current performance may support cohort-level monitoring; calibration needs further work before high-stakes clinical decisions.
-- Led by Ashkan Pirmani; A. Faes is a middle co-author.
```

### proprioception-exoskeleton

```diff
-title: 'Can EEG still tell what the user intends while a hand exoskeleton moves the fingers?'
-sub: 'On the Impact of Proprioception in EEG Representations and Decoding during Human-Hand Exoskeleton Interaction'
-hook: 'An exoskeleton moving the fingers evokes strong alpha and beta desynchronization in sensorimotor EEG, and the EEG is then similar whether or not the user also imagines the movement.'
+title: 'Can EEG read intention while an exoskeleton moves the fingers?'
+sub: 'On the Impact of Proprioception in EEG Representations and Decoding during Exoskeleton Interaction'
+hook: 'An exoskeleton moving the fingers evokes strong alpha and beta desynchronization, with or without imagined movement.'
-  purpose: 'Find out whether a brain-controlled glove can keep reading what the wearer wants once the glove itself starts moving the hand.'
-  plain: 'Feeling the fingers being moved changes the brain signals strongly, and that change looks similar whether or not the person also imagines the movement.'
+  purpose: 'Find out whether a brain-controlled glove can still read the wearer''s intent while it moves the hand.'
+  plain: 'Feeling the fingers being moved changes the brain signals strongly, whether or not the person also imagines the movement.'
-  - { label: 'Subjects', value: '25 right-handed, 62-channel EEG' }
-  - { label: 'Stage', value: 'published' }
+  - { label: 'Subjects', value: '25, 62-channel EEG' }
-  - 'Three modalities with a cable-driven hand exoskeleton: imagined (IM), passive (PM), and imagined with passive (IPM) flexion of thumb, index or the other three fingers.'
-  - 'Alpha (8-13 Hz) and beta (13-30 Hz) ERSP over the scalp and at C3 and C4, compared with repeated-measures ANOVA and Bonferroni correction.'
-  - 'Four binary FgMDM classifiers on 1-s segments in 4-40 Hz: IM, PM and IPM against rest, and IPM against PM, under 10 $\times$ 5-fold cross-validation.'
+  - 'Cable-driven exoskeleton: imagined (IM), passive (PM), imagined with passive (IPM) flexion of thumb, index or the other three.'
+  - 'Alpha and beta ERSP at C3 and C4 (repeated-measures ANOVA); four binary FgMDM classifiers on 1-s segments, 10 $\times$ 5-fold CV.'
-  - 'PM and IPM give significantly stronger alpha and beta desynchronization than IM at C3 and C4; PM and IPM do not differ.'
-  - 'Assisted movement against rest: 0.80 $\pm$ 0.07 for IPM and 0.72 $\pm$ 0.10 for PM.'
-  - 'IPM against PM reaches 0.61 $\pm$ 0.09, slightly above chance and significantly below IM against rest at 0.73 $\pm$ 0.08.'
-  - 'Subjects reported that refraining from imagery during PM was hard, which the paper reads as a need for subject training and better decoders.'
-equation: '\mathrm{ERSP}(c,f,t) = \frac{1}{S}\sum_{s=1}^{S}\frac{1}{N}\sum_{n=1}^{N}\Big(F_{s,n,c}(f,t) - F^{\mathrm{baseline}}_{s,n,c}(f)\Big)'
+  - 'PM and IPM give significantly stronger desynchronization than IM at C3 and C4; PM and IPM do not differ.'
+  - 'Against rest: 0.80 $\pm$ 0.07 for IPM, 0.72 $\pm$ 0.10 for PM and 0.73 $\pm$ 0.08 for IM.'
+  - 'IPM against PM reaches 0.61 $\pm$ 0.09, slightly above chance; refraining from imagery during PM was hard.'
```

### individual-reference-intervals

```diff
```

### adapter-format-theory

```diff
-hook: 'A format risk ordering proved for spectral operators may carry to adapter weight updates, if those updates are block-banded along the layer axis.'
+hook: 'A risk ordering proved for spectral operators may carry to adapter updates that are block-banded along the layer axis.'
-  - 'No results yet: the gate has not run.'
-  - 'Open slot: no risk ordering across formats for weight updates, and no format selector with a proved oracle inequality.'
+  - 'No results yet: the gate has not run. Open slot: no risk ordering across formats for updates, no format selector with a proved oracle inequality.'
```

### asthma-geo-tensor

```diff
```

### attention-scoped-instructions

```diff
-hook: 'Every rule in a long policy sees every other rule, so an edit to one section shifts behaviour in another; a declared visibility graph compiled to an attention mask would make that impossible.'
+hook: 'An edit to one section of a long policy shifts another; a visibility graph compiled to an attention mask would prevent it.'
-  - 'Nothing built yet: no code, no runs, no manuscript.'
-  - 'The problem is measured elsewhere: leakage at Cohen''s d 0.63 (Instruction Bleed), long-policy strict pass rate at most 36.2% (HANDBOOK.md).'
+  - 'No code, no runs, no manuscript. Measured elsewhere: leakage at Cohen''s d 0.63 (Instruction Bleed), long-policy strict pass rate at most 36.2% (HANDBOOK.md).'
```

### block-term-nca

```diff
-hook: 'Write a cellular automaton''s learned local rule as block-term pieces, one per mechanism, and serial scans give each patient numbers for how a lesion grows.'
+hook: 'Block-term pieces of a learned local rule, one per mechanism, give each patient numbers for how a lesion grows.'
-  - 'Nothing built: no code, no runs, no manuscript.'
+  - 'Nothing built: no code, no runs, no manuscript. A six-search scan found no block-term or tensor-decomposed NCA update rule; that is not yet a novelty check.'
-  - 'A six-search scan found no block-term or tensor-decomposed NCA update rule; that is not yet a novelty check.'
```

### brecht-fl-partitioning

```diff
-title: 'Federated ECG arrhythmia models break on label skew, and global accuracy hides it'
+title: 'Federated ECG models break on label skew, and global accuracy hides it'
-hook: 'Across six ways of splitting MIT-BIH over simulated hospitals, class skew does the damage while size skew barely matters, and a near-flat global accuracy masks it.'
+hook: 'Across six splits of MIT-BIH over simulated hospitals, class skew does the damage and size skew barely matters.'
-  plain: 'Give every simulated hospital all heartbeat types and unequal sizes barely matter; give some hospitals only some types and the rare types are lost, while the headline accuracy still looks fine.'
+  plain: 'Unequal hospital sizes barely matter; give some hospitals only some heartbeat types and the rare types are lost while accuracy looks fine.'
-  - { label: 'Data', value: 'MIT-BIH Arrhythmia Database' }
-  - { label: 'Training', value: 'Flower, FedAvg; CNN and CNN-LSTM' }
+  - { label: 'Setup', value: 'MIT-BIH; Flower, FedAvg; CNN and CNN-LSTM' }
-  - 'Balanced and size-skewed splits match the centralized baseline closely.'
-  - 'Limits: one dataset and FedAvg only; novelty is unverified.'
+  - 'Balanced and size-skewed splits match the centralized baseline closely. Limits: one dataset and FedAvg only; novelty is unverified.'
```

### btd-autoencoder

```diff
-  - 'Not started: no model spec, no benchmark protocol, no code.'
+  - 'Not started: no model spec, no benchmark protocol, no code. Novelty is unverified until a cited literature check.'
-  - 'Novelty is unverified until a cited literature check.'
```

### cirrhosis-digital-twin

```diff
-hook: 'Cardiovascular and liver risks in cirrhosis are managed by separate specialties; one model over the same clinical record could predict both and compare treatments.'
+hook: 'One model over the same clinical record could predict cardiovascular and liver risk and compare treatments.'
-  plain: 'Read lab values, GP visits, medication and imaging over time, and estimate both kinds of risk from the same history, with and without a given therapy.'
+  plain: 'Read lab values, GP visits, medication and imaging over time, and estimate both risks from the same history, with and without a therapy.'
-  - { label: 'Lead', value: 'Maureen Guichelaar (MST hepatology) and Axel Faes' }
-  - { label: 'Stage', value: 'scoping, grant not chosen' }
-  - { label: 'Candidate cohort', value: 'MST chronic liver disease, about 400 patients' }
-  - { label: 'Grant routes', value: 'PIHC (joint UT and MST, Maureen as PI); SSH Explore 2027 or ENW-XS 27-2 (one applicant); ENW-M with a tenured main applicant' }
+  - { label: 'Lead', value: 'Maureen Guichelaar (MST) and Axel Faes' }
+  - { label: 'Cohort', value: 'MST chronic liver disease, about 400' }
+  - { label: 'Grants', value: 'PIHC; SSH Explore 2027; ENW-XS 27-2; ENW-M' }
-  - 'Competing risks: cardiovascular events against decompensation, HCC and death.'
-  - 'Treatment-effect estimation from observational records, liver-directed against metabolic therapy.'
+  - 'Competing risks: cardiovascular events against decompensation, HCC, death; treatment effects from records, liver-directed against metabolic therapy.'
-  - 'Nothing built and no data requested yet.'
-  - 'It starts from a 2025 multi-organ digital-twin proposal by the hepatology lead, which names no method for per-patient treatment effects.'
-  - 'Novelty unchecked: the claim that a multi-organ digital twin is unexplored is not verified.'
+  - 'Nothing built and no data requested yet. Novelty unchecked: the claim that a multi-organ digital twin is unexplored is not verified.'
+  - 'Starts from the 2025 iDT proposal (M. Guichelaar main applicant; Axel not an applicant), which names no method for per-patient treatment effects.'
+  - 'iDT: MASLD test case, about 400 MST patients in a Saxion dataspace, a prospective study of 250; its 2025 outcome is not stated.'
-
----
-kind: columns
----
-# The 2025 PIHC proposal the idea starts from
-
-### The proposal
-
-- Title: "iDT: Pioneering a Multi-Organ Integrated Digital Twin (iDT) for the Future of Preventive Medicine", a technological pioneering voucher.
-- Applicants: M. Guichelaar (MST, main), H. Aktas and P.J. Hilbers (ZGT), M. Amir Haeri and J. Wolterink (UT), E. Bakker and C. Graat (MST), W. Teeuw (Saxion); Axel was not an applicant.
-- Test case MASLD; data from about 400 MST patients (laboratory, ECG, liver and heart ultrasound, pharmacy) in a Saxion dataspace, and a prospective study of 250.
-- Outcome of the 2025 submission: not stated in the email or the proposal.
-
-|||
-
-### Its plan
-
-- Phase 1 builds the dataspace; phase 2 a hybrid of clinical and physiological models with machine learning, and a library of interventions for in silico testing.
-- Evaluation by AUROC, sensitivity, specificity, calibration and SHAP.
-- 12-month milestone: a first prototype for liver decompensation, HCC and major cardiovascular events.
-- Budget: one AI junior researcher at MST across MST and ZGT, with two Saxion PhD researchers; follow-up from NWO, Horizon Europe or Health Holland.
```

### clinical-ai-eval-artifacts

```diff
-  - 'Gate-pending: no protocol run yet.'
-  - 'Target: the reported gain shrinks or vanishes on that benchmark under the protocol.'
+  - 'Gate-pending: no protocol run yet. Target: the reported gain shrinks or vanishes on that benchmark under the protocol.'
```

### concept-bottleneck-hcc

```diff
-hook: 'Read readable liver concepts at every scan, compose their trajectories with a sparse model, and the risk depends on the images only through those concepts.'
+hook: 'Risk that depends on the images only through readable liver concepts, read at every scan and composed by a sparse model.'
-  - 'Nothing trained yet.'
-  - 'Premise check: the label files hold one LI-RADS integer per observation (0, 1, 2: 685, 174, 104 of 963) and no feature fields, so the LI-RADS concepts are not annotated there.'
+  - 'Nothing trained yet. Main risk: concept lossiness caps accuracy at what the concepts capture.'
+  - 'Label files hold one LI-RADS integer per observation (0, 1, 2: 685, 174, 104 of 963), no feature fields: concepts not annotated there.'
-  - 'Main risk: concept lossiness caps accuracy at what the concepts capture.'
```

### conformal-tensor-factors

```diff
-hook: 'Block-term factors are defined only up to permutation, sign and within-block rotation, which breaks the exchangeability conformal prediction needs; a gauge-invariant conformity score restores it.'
+hook: 'Gauge (permutation, sign, within-block rotation) breaks exchangeability; a gauge-invariant conformity score restores it.'
-  - 'No prototype has run.'
-  - 'First number: empirical marginal coverage on held-out calibration of an existing block-term model, against the nominal level.'
+  - 'No prototype has run. First number: empirical marginal coverage on held-out calibration of an existing block-term model, against the nominal level.'
```

### ecg-af-fair

```diff
-title: 'Atrial fibrillation from a sinus-rhythm ECG, with explanations or privacy a CNN lacks'
+title: 'Hidden atrial fibrillation from a normal-rhythm ECG on the Gruwez cohort'
-hook: 'The task is established by a black-box CNN (Gruwez 2023, AUROC 0.87, AUPRC 0.48); this project has its exact cohort and must match it while adding readable factors or multi-site privacy.'
+hook: 'The published CNN on this exact cohort reaches AUROC 0.87, AUPRC 0.48; Directions 1 and 2 are novelty-checked.'
-  plain: 'A neural network already does this but cannot say why; an interpretable tensor model, or one trained across hospitals without pooling ECGs, would add what it lacks.'
+  plain: 'Either a score that stays stable between a patient''s ECGs, or a model that treats ''no AF'' as possibly undiagnosed.'
-  - { label: 'Stage', value: 'exploring, lead hook open' }
+  - { label: 'Stage', value: 'exploring, concept note made' }
-  - 'Candidate 1: a block-term model of leads x time x frequency whose factors are the explanation, with faithfulness measured.'
-  - 'Candidate 2: federated AF risk across hospitals, where the privacy mechanism is the contribution.'
-  - 'Splits by patient, since the label rides on the patient and most have several ECGs.'
+  - 'Direction 1: a score that stays stable between a patient''s ECGs and separates patients of the same age.'
+  - 'Direction 2: a model trained on whole patients that treats ''no AF'' as possibly undiagnosed.'
+  - 'Direction 3: a block-term layer that separates what persists across a patient''s ECGs from what changes per recording.'
-  - 'No model has run on the cohort yet.'
-  - 'The inventory confirms the delivered file is Gruwez''s exact training set, so the comparison is head-to-head.'
-  - 'No event date and no follow-up column: time-to-AF needs a diagnosis date from the hospital.'
-  - 'The lead hook and the cited novelty check are still open.'
-mechanism: 'Interpretable or federated AF risk from SR-ECG'
-headline: 'Idea: choose one hook, then match AUROC 0.87'
+  - 'No model has run on the cohort yet. No event date and no follow-up column: time-to-AF needs a diagnosis date from the hospital.'
+  - 'Age and sex logistic on the first ECG: AUROC 0.788, AUPRC 0.242, prevalence 0.0886; number of ECGs alone: AUROC 0.686.'
+  - 'Within-age AUROC of age and sex: 0.662, 0.64, 0.619, 0.582, 0.553; mean ECGs 5.99 (label 1) against 3.23.'
+mechanism: 'Stable within-patient score, or a whole-patient objective for possibly undiagnosed AF'
+headline: 'Idea: choose a direction, then reproduce the published CNN'
```

### engram

```diff
-title: 'Locating and excising a memorised patient record inside a clinical language model'
+title: 'Locating and excising a memorised record inside a clinical language model'
-hook: 'A model trained on clinical notes memorises some of them, and erasing one patient today erodes what it knows about other patients with the same condition; components that carry one record would make targeted erasure possible.'
+hook: 'Erasing one patient today erodes other patients with the same condition; components carrying one record would target it.'
-  plain: 'Plant fake records at known rates, train small models from scratch, split their internal activity into a few parts, and remove the part that carries a record to see whether the record stops coming out.'
+  plain: 'Plant fake records at known rates, train small models, split their internal activity into parts, and remove the part that carries a record.'
-  - { label: 'Stage', value: 'exploring; gate not run' }
-  - 'Ablate the ranked components: extraction drop against perplexity cost, as a curve.'
-  - 'Baselines: K-FAC curvature editing, a plain weight SVD and neuron-level ablation; the SVD is the bar.'
-  - 'If the components are real, erase one actual patient''s records and check retention on patients sharing a condition.'
+  - 'Ablate ranked components: extraction drop against perplexity cost. Baselines: K-FAC editing, neuron-level ablation, a plain weight SVD (the bar).'
-  - 'Instrument built and cluster-verified: nine stages, 102 tests, 274k tok/s at 12M on an L40S (145k on an A40, 74k at 72M, 6k on Apple MPS); all numbers are from a 12M model on a synthetic corpus, one canary per cell, one seed.'
-  - 'Sampled exposure caps at $\log_2 N$ references: 8 of 16 cells still pinned at 8192; a fitted normal resolves them, agreeing to 0.06 bits.'
-  - 'Identifier dose-response 3.2, 15.8, 21.3, 25.8 bits at 1, 4, 16, 64 copies; identifiers 25.8 to 26.8 bits at 64 copies against 12.0 to 12.5 for free text.'
-  - 'Instruction tuning moves exposure by under 0.3 bits in all 16 cells.'
+  - 'Instrument cluster-verified: nine stages, 102 tests, 274k tok/s at 12M on an L40S; from a 12M model, synthetic corpus, one canary per cell, one seed.'
+  - 'Identifier dose-response 3.2, 15.8, 21.3, 25.8 bits at 1, 4, 16, 64 copies; at 64 copies 25.8 to 26.8 bits against 12.0 to 12.5 for free text.'
+  - 'Exposure caps at $\log_2 N$ references: 8 of 16 cells pinned at 8192; a fitted normal resolves them (0.06 bits), its assumption unverified.'
+  - 'Instruction tuning moves exposure under 0.3 bits in all 16 cells; if the decomposition only ties the SVD, the fallback is a duplication findings paper.'
-
----
-kind: columns
----
-# What the instrument settled, what is open, and what is unchecked
-
-### Settled and open
-
-- Document-level deduplication never touches a canary; the default 50-token substring threshold is longer than the canaries.
-- A dictionary provenance index costs 190 MB per million tokens (158 GB for MIMIC against 48 GB); a sorted posting table brings that to 32 MB.
-- Decided against: PPO, GRPO and a reward model; the Pile; a control-panel UI; more reference candidates (512 to 8192 is 16x compute for 4 bits, half the grid still pinned); a skew-normal fit unless the normal one fails.
-- Open off the main chain: a path without a cluster, a third corpus with real patient timelines (PMC-Patients has one summary per patient, so the within-patient arm runs only on MIMIC), a federated arm, an external-instruction loader, and a deposit.
-
-|||
-
-### Unchecked, and the fallback
-
-- The normal fit sits beneath half of every reported cell, and its assumption is unverified on real reference distributions.
-- The free-text arm is not monotone in multiplicity; one draw per cell cannot separate signal from noise. The 27 GB merge peak at full MIMIC scale is a projection from a linear fit and has not been measured.
-- Freezing MLPs drops synthetic memorisation from 100% to 19%, against 69% for frozen query and key; a prior for where to look only.
-- If the decomposition only ties the weight SVD, the fallback is a controlled-duplication findings paper on the deduplication, tokenizer and fine-tuning arms.
----
```

### faithful-interpretability-position

```diff
-title: 'Measured, not asserted: faithful interpretability for structured-tensor clinical models'
+title: 'Measured faithful interpretability for structured-tensor clinical models'
-hook: '"The structure is the explanation" counts only when faithfulness is measured by a probe and an intervention, which almost no interpretable clinical model does.'
+hook: '"The structure is the explanation" counts only with a measured probe and intervention, which almost no model has.'
-  - 'Not drafted.'
-  - 'Revisit once a good share of that work is accepted.'
+  - 'Not drafted; revisit once a good share of that work is accepted.'
```

### fed-duplication-limits

```diff
-hook: 'Once a memorised record is held by $k$ of $n$ sites, attribution becomes set-valued with an impossibility boundary, and one site''s deletion can only bound what the others still let be extracted.'
+hook: 'At $k$ of $n$ sites attribution has an impossibility boundary and one site''s deletion only bounds what the others leak.'
-  - 'No code and no runs yet.'
-  - 'If attribution and the floor are both flat in $k$, there is no frontier and no paper.'
+  - 'No code and no runs yet. If attribution and the floor are both flat in $k$, there is no frontier and no paper.'
```

### fed-neural-operators

```diff
-title: 'One neural operator trained across silos that see the field at different resolutions'
+title: 'One neural operator trained across silos with different field resolutions'
-hook: 'An operator is defined on functions, so clients on different grids can aggregate coherently where fixed-dimension FedAvg cannot, and block-term factors are cheap to send.'
+hook: 'Clients on different grids can aggregate operators coherently where fixed-dimension FedAvg cannot; factors are cheap to send.'
-  - 'Nothing prototyped yet.'
-  - 'Real only if it is both cheaper to communicate and accurate where a fixed-dimension baseline cannot aggregate.'
+  - 'Nothing prototyped yet. Real only if it is both cheaper to communicate and accurate where a fixed-dimension baseline cannot aggregate.'
```

### fedbtd

```diff
-hook: 'A block term is identifiable only up to permutation, a within-block subspace transform and scale, so naive averaging of factors mixes mismatched blocks; the alignment idea was pre-empted.'
+hook: 'Averaging factors naively mixes mismatched blocks: a block is identifiable only up to permutation, transform and scale.'
```

### federated-protocol-agents

```diff
-title: 'Keeping a multi-site study faithful to one protocol without moving patient data'
+title: 'Keeping a multi-site study faithful to one protocol without moving data'
-hook: 'Hospitals store the same concept differently, so one study plan silently becomes several studies; agents at each site compare only aggregates, repair the definition errors and leave true differences alone.'
+hook: 'Hospitals store concepts differently; agents at each site compare aggregates, repair definition errors, leave true differences.'
-  - 'Nothing built; only a novelty check has run, and it is unfinished.'
-  - 'Risk: attrition alone may not identify the cause of a 5% against 15% difference.'
+  - 'Nothing built; only a novelty check has run, unfinished. Risk: attrition alone may not identify the cause of a 5% against 15% difference.'
```

### fedlink

```diff
-title: 'FedLink: which gene cluster makes which antibiotic, learned across private strain collections'
+title: 'FedLink: which gene cluster makes which antibiotic?'
-hook: 'The link between a gene cluster and a metabolite is co-occurrence across strains, and no single lab has enough strains; a federated coupled tensor pools that signal without moving genomes or spectra.'
+hook: 'No lab has enough strains for gene-molecule co-occurrence; a federated tensor pools it without moving genomes or spectra.'
-  - { label: 'Baseline', value: 'NPOmix, KNN on strain-paired fingerprints' }
-  - 'A coupled tensor with a shared strain mode over BGC features, MS features and activity.'
-  - 'Strain factors stay local; only the component dictionaries are aggregated.'
+  - 'A coupled tensor with a shared strain mode over BGC, MS and activity features; strain factors stay local, only component dictionaries are aggregated.'
-  - 'No model has run.'
-  - 'A cited check (21 sources, 25 claims adversarially verified) found the federated multimodal application unoccupied; the public data stack is confirmed.'
-  - 'Gate: a centralized coupled tensor must beat NPOmix on held-out links before any federation work.'
+  - 'A cited check (21 sources, 25 claims adversarially verified) found the federated multimodal application unoccupied; public data stack confirmed.'
+  - 'No model has run. Gate: a centralized coupled tensor must beat NPOmix (KNN on strain-paired fingerprints) on held-out links first.'
```

### fl-privacy-auditing

```diff
-hook: 'Hospitals and regulators will ask how much a deployed federated model leaks; today the answer is a set of one-off attacks, with no standard report that ties measured leakage to the guarantee the model claims.'
+hook: 'Today the answer on leakage is one-off attacks; no standard report ties measured leakage to the guarantee the model claims.'
-  - 'Gate pending: a novelty lit-check to fix the auditing angle; the attack code is reusable.'
+  - 'Gate pending: a novelty check of the membership-inference, gradient-inversion and DP-auditing literature fixes the angle; the attack code is reusable.'
-  - 'Gate: a novelty check of the membership-inference, gradient-inversion and DP-auditing literature, to fix the angle first.'
```

### florank-personalization

```diff
-sub: 'FLoRank, a collaborator''s adaptive low-rank adapter, carried into imaging or generalized to a block-term adapter'
-hook: 'Under clinical site heterogeneity personalization is essential; FLoRank''s per-center low-rank adapter beat FedAVG and plain LoRA on tabular MS data, and the open question is whether it carries to imaging and whether a multilinear adapter does better than a flat one.'
+sub: 'FLoRank, a collaborator''s low-rank adapter, carried into imaging or to a block-term adapter'
+hook: 'FLoRank''s per-center adapter beat FedAVG and LoRA on tabular MS data; does it carry to imaging, or to a multilinear form?'
-  - { label: 'Seed method', value: 'FLoRank, Pirmani et al., ECTRIMS 2025' }
-  - { label: 'Seed cohort', value: 'MSBase, about 26k MS patients, 146 centers' }
+  - { label: 'Seed', value: 'FLoRank, Pirmani et al., ECTRIMS 2025; MSBase, about 26k MS patients, 146 centers' }
-  - { label: 'Stage', value: 'scoping, collaboration idea' }
-equation: 'y = xW + b + \mathrm{Scale}\left[\mathrm{GELU}(xBA)\right]'
-  - 'The seed: a frozen global layer plus a center adapter $BA$, trained in Pre, Warmup and Post phases.'
-  - 'Branch A: FLoRank adapters personalize the federated HCCNet imaging backbone per hospital.'
-  - 'Branch B: a sum of low-multilinear-rank Tucker blocks replaces the matrix adapter, with LoRA as its rank-$(1,1)$ case.'
-  - 'Win conditions: A beats FedAVG-HCCNet on the worst silos at matched communication; B beats the matrix adapter at a matched parameter budget.'
+  - 'The seed: $y = xW + b + \mathrm{Scale}[\mathrm{GELU}(xBA)]$, a frozen global layer plus a center adapter $BA$, trained in Pre, Warmup and Post phases.'
+  - 'Branch A: FLoRank adapters on the federated HCCNet backbone. Branch B: Tucker blocks replace the matrix adapter (LoRA is rank-$(1,1)$).'
+  - 'Wins: A beats FedAVG-HCCNet on the worst silos at matched communication; B beats the matrix adapter at matched parameters.'
-  - 'A cited scan found no block-term adapter anywhere in parameter-efficient fine-tuning.'
-  - 'FacT (AAAI 2023) already casts LoRA as a special case, and FedRot-LoRA pre-empts factor-alignment claims.'
+  - 'A cited scan found no block-term adapter in fine-tuning; FacT (AAAI 2023) casts LoRA as a special case, FedRot-LoRA pre-empts factor alignment.'
```

### harmonop

```diff
-hook: 'GAN and ComBat harmonizers are tied to their training grid and their training scanners; an operator defined on functions can be trained at one resolution, applied at another, and carried to a scanner it never saw.'
+hook: 'An operator defined on functions can be trained at one resolution, applied at another, and carried to an unseen scanner.'
-  - 'No harmonization operator has been trained on any site yet.'
-  - 'Gate: a 2D prototype between two BraTS sites at appearance parity with a CycleGAN.'
+  - 'No operator trained on any site yet. Gate: a 2D prototype between two BraTS sites at appearance parity with a CycleGAN.'
```

### hccnet-fl-sweden

```diff
-hook: 'Data from a Dutch and a Swedish hospital cannot be pooled, and the two sites are expected to hold different MRI sequence sets; a federation that assumes shared modalities breaks there, so each site has to use everything it has.'
+hook: 'The sites cannot pool data and are expected to hold different MRI sequence sets, so each site has to use everything it has.'
-  - 'Gate pending; the Link<o umlaut>ping data-use, ethics and GDPR agreement is the critical path.'
-  - 'The novelty check is pending, so no novelty is claimed.'
+  - 'Gate pending; the Link<o umlaut>ping data-use, ethics and GDPR agreement is the critical path. Novelty check pending: no novelty is claimed.'
```

### hccnet-pathology

```diff
-hook: 'A monolithic HCC-risk network overfits 243 patients with 37 cancers and cannot say which liver condition drives a patient''s risk; four small networks, one per pathology, give a stronger prior at fewer parameters and a per-patient attribution.'
+hook: 'A monolithic network overfits 243 patients with 37 cancers; four small pathology networks give a stronger prior and attribution.'
-  plain: 'Four small models each watch one problem in the liver (scarring, inflammation, fat, iron) over several scans, and a final model weighs them for each patient.'
+  plain: 'Four small models each watch one problem (scarring, inflammation, fat, iron) over several scans, and a final model weighs them for each patient.'
-  - { label: 'Stage', value: 'scoping, gate pending' }
-  - 'Stage 1: fibrosis, inflammation, steatosis and iron nets, each per-modality encoders and a small 3D CNN emitting a per-visit score; about 9M parameters in all against 12.4M for HCCNet-F.'
-  - 'Steatosis and iron are anchored on the Dixon fat fraction and the iron index, a signal floor nothing has to learn.'
-  - 'Stages 2 and 3: score trajectories plus clinical variables feed a Transformer with soft MoE gating, then a classification head.'
-  - 'Training: DINO pretraining on all 963 exams, each pathology net on P(HCC), then end-to-end fine-tuning.'
+  - 'Fibrosis, inflammation, steatosis and iron nets, each a per-visit score: about 9M parameters against 12.4M for HCCNet-F.'
+  - 'Steatosis and iron anchored on Dixon fat fraction and iron index; a Transformer with soft MoE gating; DINO pretraining on all 963 exams.'
-  - 'Gate pending; the design is the transcribed architecture_v3.'
+  - 'Gate pending; the design is the transcribed architecture_v3. Gate: equal or better AUPRC than HCCNet-F on identical folds, plus validated attribution.'
-  - 'Gate: equal or better AUPRC than HCCNet-F on identical folds, plus validated attribution.'
-  - 'The claim is the composition; each single-pathology MRI measure has its own literature, and the novelty check is pending.'
+  - 'Baselines: HCCNet-F and HCCNet-Pico, a late-fusion CNN, radiomics with XGBoost. Ablations: physics off, MoE to mean pooling, one shared net.'
+  - 'The claim is the composition; the novelty check is pending. With 37 positives: stage-wise training, bootstrapped CIs and paired tests.'
-
----
-kind: columns
----
-# Baselines, open checks and cheaper training
-
-### Baselines and checks
-
-- Baselines: monolithic HCCNet-F and HCCNet-Pico, a late-fusion multimodal CNN, and radiomics with XGBoost as a cheap lower bound.
-- Ablations: physics features off, MoE gating replaced by mean pooling, and one shared net replacing the modular nets.
-- Pathology labels: weak labels (FibroScan or biopsy, MR-PDFF, R2$^*$) for a supervised head, post-hoc validation against them, or no pathology names at all.
-- With 37 positives: stage-wise training, bootstrapped CIs and paired tests; the 3-year horizon against next-scan is fixed up front with a lead-time analysis.
-
-|||
-
-### Less data, faster training (proposed, none measured)
-
-- Pre-train the reader once on all 963 exams, freeze it and train later models on stored per-visit embeddings; pre-training takes about 27 h on one GPU, fine-tuning about 4 h.
-- One shared frozen reader with small per-condition heads, replacing the four 3D networks.
-- Condition scores trained on reference measures (elastography, biopsy, MR fat fraction, R2$^*$) where many patients have them, beyond the 37 HCC cases.
-- A small sequence model on about ten numbers per visit, and a liver crop at lower resolution for a first pass; each proposal is measured by trainable parameters, hours per run and AUPRC on identical folds.
----
```

### modality-dropping-btf

```diff
-title: 'Federated multimodal fusion where a hospital missing a modality drops that mode'
+title: 'Federated fusion where a hospital missing a modality drops that mode'
-hook: 'Real hospitals do not hold the same modalities, and imputation or zero-filling fills in data they do not have; a block-term fusion whose modes are the modalities lets a site drop what it lacks and still borrow a shared cross-modal factor from richer sites.'
+hook: 'With modalities as block-term modes, a site drops what it lacks and borrows a shared cross-modal factor from richer sites.'
-  plain: 'The model is built from pieces, each tied to a set of data types; a hospital uses only the pieces whose data it has, and the pieces everyone has learn from everyone.'
+  plain: 'Each piece of the model is tied to a set of data types; a hospital uses only the pieces whose data it has.'
-  - { label: 'Venue', value: 'IEEE J-BHI as a fusion method, MedIA or IEEE TMI as a network study' }
-  - { label: 'Stage', value: 'nascent, gate pending' }
+  - { label: 'Venue', value: 'IEEE J-BHI (fusion), MedIA or IEEE TMI (network study)' }
-  - 'Prediction as a sum of $R$ Tucker-$(L_r,\dots,L_r,1)$ blocks, each over a subset of modality modes.'
-  - 'A site lacking modality $m$ keeps only the blocks not supported on $m$: a strict sub-model, with no imputation.'
-  - 'The server averages each modality factor only across the sites that hold it.'
-  - 'A local residual head per site is a minor part; the shared and personal split alone is pre-empted.'
+  - 'Sum of $R$ Tucker-$(L_r,\dots,L_r,1)$ blocks over modality subsets; a site lacking $m$ keeps the blocks off $m$, no imputation.'
+  - 'The server averages each modality factor across the sites holding it; a local residual head is minor, the shared-personal split alone being pre-empted.'
-  - 'Nothing has run; a cited four-lane scan is done.'
-  - 'Gate 1: read TenMFL (IEEE TCE 2024), which could pre-empt the tensor-fusion core.'
-  - 'Gate 2: beat BLOSSOM-style late fusion at matched parameter budget on real data; a tie makes it a clinical demo.'
+  - 'Nothing has run; a cited four-lane scan is done. Gate 1: read TenMFL (IEEE TCE 2024), which could pre-empt the tensor-fusion core.'
+  - 'Gate 2: beat BLOSSOM-style late fusion at matched budget on real data; a tie makes it a clinical demo.'
```

### multiway-biosignal-fm

```diff
-hook: 'Every EEG and ECG foundation model tokenizes the signal, so nothing in them means the same thing across electrode layouts; a pretraining objective on the mode-wise factors is the one place where multiway structure is more than a cheaper layer.'
+hook: 'Tokenizing EEG and ECG models mean nothing across electrode layouts; a pretraining objective on mode-wise factors would.'
-  plain: 'Treat a recording as a grid of sensors by time by frequency, split it into a few shared patterns, and train the model so each pattern means the same thing in every dataset.'
+  plain: 'Treat a recording as a grid of sensors by time by frequency, split it into shared patterns, and train so each pattern means the same everywhere.'
-  - { label: 'Stage', value: 'scoping, gate pending' }
-  - 'Backbone: a multilinear map on the (channel, time, frequency) array, pretrained across datasets with heterogeneous montages.'
-  - 'Objective, the open design and the contribution: a masked target on the mode-wise factors, or a loss enforcing factor identifiability across datasets.'
-  - 'Datasets chosen by montage diversity; candidates include mimic-iv-ecg and code15.'
+  - 'Backbone: a multilinear map on the (channel, time, frequency) array, pretrained across montages (candidates include mimic-iv-ecg and code15).'
+  - 'Objective, the contribution: a masked target on the mode-wise factors, or a loss enforcing factor identifiability across datasets.'
-  - 'None of the swept models carries a Tucker, CP or block-term factorization of the data tensor.'
-  - 'Gate 1: reach a tokenizing baseline downstream at matched parameters and pretraining budget.'
-  - 'Gate 2: factor-level pretraining transfers across montages better than a tokenizing model.'
-  - 'No code, no runs, no manuscript.'
+  - 'None of the swept models carries a Tucker, CP or block-term factorization of the data tensor. No code, no runs, no manuscript.'
+  - 'Gate 1: reach a tokenizing baseline at matched parameters and budget. Gate 2: factor-level pretraining transfers across montages better.'
+  - 'Taken: block-term attention to 0.16B (NeurIPS 2019), CP tensor attention to 1.5B (TPA, NeurIPS 2025), factorized experts (NeurIPS 2024).'
+  - '$R$ rank-$(L,L,1)$ terms have CP-rank at most $RL$: no representational claim, only statistical or identifiability claims; scale is the main risk.'
-
----
-kind: columns
----
-# What the cited scan found taken, and what limits the claim
-
-### Already taken
-
-- Block-term attention (Ma et al., NeurIPS 2019) at most 0.16B, the ceiling for block-term anywhere; factorized experts (Multilinear Mixture of Experts, NeurIPS 2024); CP tensor attention to 1.5B (TPA, NeurIPS 2025).
-- Other multiway structure: axial parameter sharing (Axial Neural Networks, NeurIPS 2025), Tucker and CP operator weights (MG-TFNO), and an amortized variational LL1 method on one dataset.
-- Near misses in biosignals: B[FM]$^2$ uses separable convolution, MST independent per-frequency maps.
-- BTT already names Block Tensor-Train (ICML 2024), so the abbreviation is not used.
-
-|||
-
-### Limits on what can be claimed
-
-- A sum of $R$ rank-$(L,L,1)$ terms has CP-rank at most $RL$, so no representational claim; only statistical or identifiability claims.
-- Title-and-abstract search cannot see a factorization buried in an architecture appendix.
-- Tuformer (ICLR 2022) and Hypoformer (COLING 2022) could not be opened.
-- Scale is the main risk: the claim has to rest on structure and transfer at about 100M.
----
```

### neurosde

```diff
-title: 'One shared stochastic cortical dynamics for decoding a new subject''s ECoG'
+title: 'One shared stochastic cortical dynamics to decode a new subject''s ECoG'
-hook: 'Every patient''s electrode grid sits differently, and deterministic cross-subject decoders return a point estimate with no confidence; a latent SDE shared by all subjects lets the noise term absorb the variability between people and gives the decoder calibrated uncertainty.'
+hook: 'A latent SDE shared by all subjects lets the noise absorb between-person variability and gives calibrated uncertainty.'
-  plain: 'All patients share one model of how brain activity evolves, with randomness built in; each new patient only needs a small personal translator in and out of it.'
+  plain: 'All patients share one model of brain activity with randomness built in; each new patient needs only a small personal translator.'
-  - { label: 'Compute', value: 'small enough to run without HPC' }
-  - 'Trained by variational inference over trajectories.'
-  - 'Transfer freezes the shared SDE and fits only the new subject''s thin maps.'
+  - 'Trained by variational inference over trajectories; transfer freezes the shared SDE and fits only the new subject''s thin maps.'
-  - 'No SDE has been fitted to the ECoG recordings yet.'
-  - 'A cited check found latent SDEs for neural dynamics and shared-latent cross-subject decoding separately, but not their combination.'
+  - 'No SDE fitted to the ECoG yet. A cited check found latent SDEs and shared-latent cross-subject decoding separately, but not their combination.'
-  - 'The problem space is active, so the SDE variant is confirmed absent from the closest preprints first; the Stanford gesture and motor-imagery paradigms then test that it is not specific to finger flexion.'
+  - 'The SDE variant is confirmed absent from the closest preprints first; Stanford gesture and motor-imagery paradigms then test beyond finger flexion.'
```

### old-charges-stemmatology

```diff
-sub: 'A stemmatology of the manuscript constitutions of English and Scottish freemasonry, c.1390 to the 18th century'
-hook: 'About 130 copies of one text survive, sorted into families by hand since Begemann 1888 and contested since; a reconstructed tree can show which copies mix two sources, date the undated ones and place the unclassified.'
+sub: 'A stemmatology of English and Scottish masonic manuscript constitutions, c.1390 to the 18th century'
+hook: 'About 130 copies of one text survive, sorted into families by hand since Begemann 1888; a tree can show copies mixing sources.'
-  plain: 'Every copy changed a few words; the methods biologists use to build family trees from DNA differences can build the family tree of the copies from those word changes.'
+  plain: 'Every copy changed a few words; the methods biologists use for DNA family trees can rebuild the family tree of the copies.'
-  - { label: 'Benchmark', value: 'Heinrichi artificial tradition, with contamination' }
-  - { label: 'Stage', value: 'scoping, pilot-gated' }
+  - { label: 'Benchmark', value: 'Heinrichi artificial tradition' }
-  - 'Fix the witness set and a justified, varied spelling normalisation; collate into variation units.'
-  - 'Fit a parsimony tree, a NeighborNet split network and a Bayesian tree (BEAST 2), and compare with the hand families and the McLeod codes.'
-  - 'Assess contamination explicitly, since a tree cannot show a witness with two exemplars.'
-  - 'Date undated witnesses with copy date and content date kept apart.'
+  - 'Collate; fit parsimony, NeighborNet and Bayesian (BEAST 2) trees; compare with the hand families and McLeod codes.'
+  - 'Assess contamination, since a tree cannot show a witness with two exemplars; date undated witnesses, copy date and content date kept apart.'
-  - 'No result: the gate has not run, and no code exists.'
-  - 'Gate: collate 15 to 20 witnesses and measure the conflict between split signals, the one number no source gives.'
-  - 'No computational study found with the queries run; Scholar, Scopus, WoS and the full AQC index are not yet searched.'
-  - 'Candidate contribution: a contamination-aware model with exemplar mixing per witness; its novelty is not checked.'
+  - 'No result: the gate has not run, no code. Gate: collate 15 to 20 witnesses and measure the conflict between split signals, which no source gives.'
+  - 'No computational study found with the queries run; Scholar, Scopus, WoS, full AQC index not searched. Exemplar mixing: novelty unchecked.'
+  - 'Dead ends: a lodge by occupation by decade tensor; periodical topic modelling. Constraints: no TEI or plain-text corpus; old-charges.org is all rights reserved.'
-
----
-kind: columns
----
-# What was set aside, and what the texts allow
-
-### Dead ends and prior art
-
-- A lodge by occupation by decade tensor: FactGrid fills 7,607 of about 10.1 million cells, and the data cannot carry a multiway analysis.
-- Periodical topic modelling: noisy OCR over about 75,000 pages and a low methodological bar.
-- Taking the hand families as ground truth: both Begemann's and McLeod's schemes are contested, so they serve only as a comparison.
-- Prior art: phylogenetic stemmata of Dante's Monarchia (20 manuscripts plus the editio princeps) agree closely with the traditional ones; on the Heinrichi benchmark Neighbour-Joining scores 67.9% skeleton and 58.5% orientation; McCollum and Turnbull 2024 leave simultaneous contamination out of scope.
-
-|||
-
-### Corpus constraints, and a second corpus
-
-- No TEI or plain-text diplomatic corpus exists; old-charges.org holds the only complete set, all rights reserved.
-- Counts of known versions differ by source and by what is counted: 32 (Hughan 1872), about 115 (Knoop and Jones 1941), 131 entries on old-charges.org.
-- About 330 years of copying, 13 to 15 lost witnesses, copyists who altered passages on purpose, and contamination nobody has measured.
-- Second paper: the same pipeline on the 18th-century printed exposures (Prichard 1730, Three Distinct Knocks, Jachin and Boaz).
----
```

### paleogenomics-tensor

```diff
-hook: 'Ancient-DNA data is three-way, populations by loci by time period, and two-way PCA or ADMIXTURE flattens the time axis; a coupled block-term model could recover admixture more cleanly and federate across institutions that cannot share raw genotypes.'
+hook: 'Two-way PCA or ADMIXTURE flattens the time axis; a coupled block-term model could recover admixture more cleanly.'
```

### pathology-tensor-mil

```diff
-title: 'Whole-slide pathology read through block-term tissue signatures whose faithfulness is measured'
+title: 'Whole-slide pathology read through block-term tissue signatures'
-hook: 'Attention MIL pools a slide''s patches with maps that are spatially imprecise and never tested for being causal; a block-term decomposition of the patch grid gives localized tissue signatures, and ablating a block shows whether it drives the prediction.'
+hook: 'Attention MIL maps are imprecise and never tested as causal; block-term signatures are localized and testable by ablation.'
-  plain: 'Lay the slide''s small image tiles out on their grid, split the grid into a few tissue patterns each tied to one region, and check each pattern by removing it and watching whether the answer changes.'
+  plain: 'Split the slide''s tile grid into a few tissue patterns tied to regions, and check each by removing it and watching the answer.'
-  - { label: 'Data', value: 'CAMELYON16/17 benchmark (region annotations); TCGA-LIHC for the headline' }
+  - { label: 'Data', value: 'CAMELYON16/17 (region annotations), TCGA-LIHC; frozen UNI or CONCH embeddings' }
-  - { label: 'Features', value: 'frozen UNI or CONCH patch embeddings' }
-equation: '\mathcal{T} \in \mathbb{R}^{X \times Y \times \text{feature}}, \qquad \mathcal{T} \approx \sum_{r=1}^{R} (A_r B_r^{\top}) \circ c_r'
-  - 'Tile the slide, embed patches with a frozen pathology foundation model, and assemble the per-slide grid tensor.'
-  - 'Rank-$(L,L,1)$ block-term decomposition; block activations map to the slide label.'
-  - 'Faithfulness by probe and intervention, as in BTTN: ablating a block must move the prediction if and only if it is causal.'
-  - 'Baselines on the same splits: ABMIL, TransMIL and DTFD-MIL.'
+  - 'Tile the slide, embed patches with a frozen pathology foundation model, assemble the per-slide grid tensor.'
+  - 'Rank-$(L,L,1)$ decomposition $\mathcal{T} \approx \sum_{r} (A_r B_r^{\top}) \circ c_r$; block activations map to the slide label.'
+  - 'Faithfulness by probe and intervention: ablating a block must move the prediction if and only if causal. Baselines: ABMIL, TransMIL, DTFD-MIL.'
```

### physics-tensor-hcc

```diff
-hook: 'HCCNet''s own ablation shows naive fusion adds little over the best single modality; with 37 positives a dense fusion layer overfits, and the four DWI b-values are one decay curve treated as four channels.'
+hook: 'HCCNet''s ablation: naive fusion adds little; four DWI b-values are one decay curve treated as four channels.'
-equation: 'S(b)/S_0 = f\,e^{-bD^*} + (1-f)\,e^{-bD}, \qquad \mathrm{FF} = (S_{in}-S_{out})/(2\,S_{in})'
-  - 'Physics: IVIM collapses b = 0, 150, 400, 800 into $D$, $D^*$ and $f$; Dixon turns the T1 in/out pair into a fat fraction.'
+  - 'IVIM $S(b)/S_0 = f e^{-bD^*} + (1-f) e^{-bD}$ collapses b = 0, 150, 400, 800 into $D$, $D^*$, $f$; Dixon gives $\mathrm{FF} = (S_{in}-S_{out})/(2 S_{in})$.'
-  - 'Nothing has run; first the parameter maps are checked against known physical ranges.'
+  - 'Nothing has run; first the parameter maps are checked against known physical ranges. With 37 positives a dense fusion layer overfits.'
```

### quantum-tensor-fl

```diff
-hook: 'Quantum ML is crowded and hype-heavy, so a generic quantum plus tensor or quantum plus FL paper carries little; the bar is a specific angle that builds on block-term and federated methods and beats a classical baseline.'
+hook: 'Quantum ML is crowded; the bar is a specific angle on block-term and federated methods that beats a classical baseline.'
-  plain: 'Either borrow the tensor networks physicists use for quantum systems, or add quantum parts to federated training, and keep it only if it beats the ordinary version.'
+  plain: 'Either borrow tensor networks from quantum physics or add quantum parts to federated training; keep it only if it beats the ordinary version.'
-  - { label: 'Stage', value: 'nascent, lowest priority; one paper at most, opportunistic or post-tenure' }
+  - { label: 'Stage', value: 'nascent, lowest priority; opportunistic or post-tenure' }
-  - 'One branch only, chosen after the literature check; capped at one paper and pursued opportunistically.'
+  - 'One branch only, chosen after the check; capped at one paper, kept only if the quantum angle gives a positive over a classical baseline.'
-  - 'Gate pending: a lit-check decides between the two branches.'
-  - 'Gate: a cited check of the quantum-ML, quantum-FL and quantum tensor-network spaces that pins an unoccupied angle.'
-  - 'Kept only if the quantum angle gives a positive over a classical baseline.'
+  - 'Gate pending: a cited check of the quantum-ML, quantum-FL and quantum tensor-network spaces pins an unoccupied angle and decides the branch.'
```

### serial-ecg-af

```diff
-title: 'Predicting future AF from how a patient''s atrial substrate changes across serial ECGs'
+title: 'Predicting future AF from atrial substrate change across serial ECGs'
-hook: 'One ECG shows only the atrial substrate''s current state, so single-ECG models sit near a ceiling; serial ECGs see remodeling velocity, and every serial-ECG AF model so far is a black box.'
+hook: 'One ECG shows only the current substrate; serial ECGs see remodeling velocity, in black-box models so far.'
-  plain: 'Track a few readable heart-rhythm patterns from one ECG to the next and watch how fast they change; the change itself is the warning sign and the explanation.'
+  plain: 'Track readable heart-rhythm patterns from one ECG to the next; how fast they change is the warning sign and the explanation.'
-  - { label: 'Stage', value: 'exploring, gate pending' }
-  - 'Couple each patient''s per-visit factor scores across the series, with irregular intervals as the continuous variable.'
-  - 'Predict future-onset AF from the trajectory, a new objective on the series.'
+  - 'Couple each patient''s per-visit factor scores across the series, irregular intervals continuous; predict future-onset AF from the trajectory.'
-  - 'No results: the join of dated future-AF outcomes from MIMIC-IV to the serial ECGs is not done.'
-  - 'Serial ECGs beat single ECGs for new-onset AF (Sun et al., JAHA 2024), with black-box models only.'
+  - 'No results: the outcome join to the serial ECGs is not done. Serial beat single ECGs for new-onset AF (Sun et al., JAHA 2024), black-box only.'
```

### ssm-longitudinal

```diff
-hook: 'HCCNet''s Transformer pads irregular follow-up to fixed steps; a state-space model whose dynamics depend on the actual $\Delta t$ between scans treats screening cadence as the continuous variable it is.'
+hook: 'HCCNet''s Transformer pads irregular follow-up to fixed steps; a state-space model uses the actual $\Delta t$ between scans.'
-  - 'Gate pending: beat the HCCNet baseline; no new data and no collaborator gate are needed.'
-  - 'Gate: a head-to-head against the HCCNet CNN-Transformer on the same cohort and endpoints, with CIs, before more effort.'
+  - 'Gate pending: a head-to-head against the HCCNet CNN-Transformer on the same cohort and endpoints, with CIs; no new data and no collaborator gate needed.'
-  - 'It would be the temporal backbone of the imaging foundation-model idea, if that becomes feasible; irregular-time sequences also arise in EHR and wearables, and the line sits in Flanders'' imaging-AI strength.'
+  - 'It would be the temporal backbone of the imaging foundation-model idea, if feasible; irregular-time sequences also arise in EHR and wearables.'
```

### strokeop

```diff
-title: 'Ischemic tissue fate learned as an operator from baseline perfusion to final infarct'
+title: 'Ischemic tissue fate learned as an operator, perfusion to final infarct'
-hook: 'Stroke tissue-fate models are CNNs that segment a static mask on their training grid and cannot answer what-if questions; an operator with reperfusion as a control input is resolution-invariant and can be run counterfactually.'
+hook: 'An operator with reperfusion as a control input is resolution-invariant and can answer what-if questions counterfactually.'
```

### xsub-ecog-framework

```diff
-title: 'Does one cross-subject ECoG transfer framework hold across tasks and datasets?'
+title: 'Does one cross-subject ECoG framework hold across tasks and datasets?'
-hook: 'Every patient''s electrode grid sits differently, and the foundation models that handle mismatched grids are not interpretable and mostly do not do motor decoding; the idea is one interpretable, minimal-calibration cross-subject transfer framework, tested across behaviors and datasets.'
+hook: 'Foundation models for mismatched grids are not interpretable and mostly skip motor decoding; this framework would do both.'
-  - 'Test minimal-calibration cross-subject transfer across non-corresponding grids on BCI Competition IV dataset 4 (3 subjects, finger flexion), which tests dataset generalization.'
+  - 'Minimal-calibration transfer across non-corresponding grids on BCI Competition IV dataset 4 (3 subjects, finger flexion) tests dataset generalization.'
-  - 'Not started; it needs new runs.'
-  - 'Gate: minimal-calibration transfer holds on BCI-IV-4, then on a different task.'
+  - 'Not started; it needs new runs. Gate: minimal-calibration transfer holds on BCI-IV-4, then on a different task.'
```

### bt-operator-theory

```diff
-title: 'Why does a block-term spectral kernel generalize better than CP at the same expressivity?'
+title: 'Why does a block-term spectral kernel generalize better than CP?'
-hook: 'A sum of $R$ rank-$(L,L,1)$ block terms is a subclass of CP-rank-$RL$, so both formats reach the same operators; the gap is statistical, because CP fits a free frequency profile per rank-one term where a band-structured target needs one per band.'
+hook: 'Both formats reach the same operators; CP fits a frequency profile per rank-one term, a band target needs one per band.'
-  purpose: 'Explain why one way of compressing the weights of a network that learns physics makes fewer mistakes on new data.'
-  plain: 'Both ways can express the same functions, but one has fewer knobs for the noise to push around when the problem splits into separate frequency bands, so it learns more from the same examples.'
+  purpose: 'Explain why one way of compressing a physics-learning network''s weights makes fewer mistakes on new data.'
+  plain: 'Both ways express the same functions, but one has fewer knobs for noise to push around when the problem splits into bands.'
-  - { label: 'Authors', value: 'A. Faes' }
-  - { label: 'Target', value: 'JMLR' }
+  - { label: 'Authors', value: 'A. Faes, M. Amir Haeri' }
+  - { label: 'Target', value: 'Neural Networks' }
-  - { label: 'Stage', value: 'revision' }
-  - 'By Parseval the data-averaged operator metric is a spectrally weighted Frobenius norm, which reduces the risk to counting free frequency directions: $RLK$ for CP, $\mu_{\mathrm{band}}K$ for block-term.'
-  - 'Least-squares excess risk is $\sigma^2\dim/n$ on each model manifold, with the conditioning constant $\kappa$ made explicit.'
-  - 'Extensions: a variance ordering of CP, Tucker, TT and block-term, a penalized format selector, depth amplification, and the proportional regime.'
+  - 'By Parseval the risk reduces to counting free frequency directions: $RLK$ for CP, $\mu_{\mathrm{band}}K$ for block-term.'
-  - 'Separation $\Theta((RL-\mu_{\mathrm{band}})K\sigma^2/n)$; the risk ratio tends to $RL/\mu_{\mathrm{band}}$ ($RL$ for disjoint bands), and the gap stays positive under any band overlap exactly when $L>1$.'
+  - 'Separation $\Theta((RL-\mu_{\mathrm{band}})K\sigma^2/n)$; the risk ratio tends to $RL/\mu_{\mathrm{band}}$; the gap is positive under any band overlap exactly when $L>1$.'
-  - 'Proportional regime: the ratio diverges near CP''s threshold $n = RLK$ (about 60 against the classical 6 in the synthetic), and block-term avoids CP''s double-descent peak.'
-  - 'The companion PDEBench study measures a 33% smaller generalization gap at five families (0.0178 to 0.0120) and a tie on one family.'
-equation: '\mathrm{Risk}(\mathrm{CP}) - \mathrm{Risk}(\mathrm{BT}) = \Theta\Big(\frac{(RL-\mu_{\mathrm{band}})K}{n}\,\sigma^2\Big) \ge \Theta\Big(\frac{R(L-1)K}{n}\,\sigma^2\Big) > 0'
+  - 'Proportional regime: the ratio diverges near CP''s threshold $n = RLK$, and block-term avoids CP''s double-descent peak.'
-kind: columns
+kind: project
+title: 'What do the checks show, and what is the reach of the claim?'
+sub: 'Self-contained synthetics and the scope of the separation'
+hook: 'Four self-contained synthetics check the theory inside the paper''s own Gaussian model.'
+tag: { class: proof, text: 'Checks and scope' }
+eli5:
+  purpose: 'Show that the theory''s numbers come out in its own model, and say how far it reaches.'
+  plain: 'The numbers match the theory; the advantage is an inductive bias.'
+specs:
+  - { label: 'Code', value: 'four synthetic scripts' }
+method:
+  - 'Four self-contained synthetic scripts.'
+results:
+  - 'L-gating at full overlap: ratio [1.0, 1.99, 2.79, 4.34] against theory [1, 2, 3, 4].'
+  - 'Depth: the dimension gap is exactly $92D$ through $D=4$.'
+  - 'An oracle reaches the rate within CP, so no minimax separation; the companion PDEBench study: a 33% smaller gap at five families, a tie on one.'
+equation: '\mathrm{Risk}(\mathrm{CP}) - \mathrm{Risk}(\mathrm{BT}) = \Theta\Big(\frac{(RL-\mu_{\mathrm{band}})K}{n}\,\sigma^2\Big) \ge \Theta\Big(\frac{R(L-1)K}{n}\,\sigma^2\Big) > 0'
+headline: 'The synthetic checks match the theory; the gap is an inductive-bias result'
-# Checks in the paper's own model, and the reach of the claim
-
-### Four self-contained synthetics
-
-- L-gating at full overlap: ratio [1.0, 1.99, 2.79, 4.34] against theory [1, 2, 3, 4], an exact tie at $L=1$.
-- Disjoint bands with $R=4$, $L=3$, $K=16$: ratio 10.15 against the asymptotic 12, the gap the exact finite-$K$ formula predicts.
-- Depth: the CP-minus-block-term dimension gap is exactly $92D$ through $D=4$ and saturates at the predicted $D^\star = 4$.
-
-|||
-
-### Scope
-
-- Estimator-level: an oracle that knows the band support reaches the block-term rate within CP, so there is no minimax separation.
-- Block-term has no representational edge over CP; the advantage is inductive bias.
-- On approximately band-structured targets the gain is a bias-variance trade-off, and the absolute constants are unoptimized.
-- PDEBench agrees in sign, direction, diversity gating and the $L>1$ requirement; the constants are not claimed to match.
```

### btfno

```diff
-title: 'Does factorizing a Fourier operator''s spectral weight into block terms make one operator generalize across PDE families?'
+title: 'Do block-term spectral weights help one operator span PDE families?'
-hook: 'The factorization of an FNO''s spectral weight acts as a prior on how frequencies couple to channels; block terms sit between the shipped CP and Tucker forms, and a routed mixture of them serves five PDEBench families at once.'
+hook: 'A routed mixture of block-term experts, between the shipped CP and Tucker forms, serves five PDEBench families at once.'
-  plain: 'Each expert stores its frequencies in small blocks that share one frequency pattern, so it has less room to memorise the training data, and a router sends every input to the experts that suit it.'
+  plain: 'Each expert stores frequencies in small blocks sharing one pattern, and a router sends each input to the experts that suit it.'
-  - { label: 'Venue', value: 'AAAI 2027, rejected; revising' }
+  - { label: 'Venue', value: 'AAAI 2027 rejected; targeting MLST' }
-  - { label: 'Code', value: 'TheAxeC/block-term-neural-operator (private)' }
-  - 'Spectral weight as $R$ rank-$(L,L,1)$ block terms with channel factors $A_r$, $B_r$, core $G_r$ and frequency profile $c_r$; $L=1$ gives CP, $R=1$ with $L=C$ gives Tucker; one einsum, no dense tensor.'
-  - 'MoBTE-SM: an always-on shared block-term expert plus 8 routed experts, softmax-gated from the radial log-energy spectrum of the input.'
-  - 'Two-frame input, matched real degrees of freedom against CP, Tucker and dense layers, 3 seeds, two-sided Welch $t$-tests.'
-  - 'A least-squares separation under a Gaussian spectral-operator model: gap $\Theta(\sigma^2 R(L-1)K/n)$, risk ratio tending to $L$, zero at $L=1$.'
+  - 'Spectral weight as $R$ rank-$(L,L,1)$ block terms; $L=1$ gives CP, $R=1$ with $L=C$ gives Tucker; one einsum, no dense tensor.'
+  - 'MoBTE-SM: a shared block-term expert plus 8 routed experts, softmax-gated from the input spectrum; matched real degrees of freedom, 3 seeds, Welch $t$-tests.'
-  - 'At matched parameters the block-term expert''s generalization gap is 33% below the CP expert''s (0.0120 against 0.0178, $p=0.015$), while the CP expert fits training better.'
-  - 'All compressible flow: a 31% smaller gap ($p=0.0005$); a single family: a tie (0.0083 against 0.0085, $p=0.44$).'
-  - 'In raw test error the two expert kinds separate only marginally ($p=0.053$ and $p=0.082$).'
-equation: 'W_{i,j,k}=\sum_{r=1}^{R}\Big(\sum_{p,q} A_{r,ip}\,G_{r,pq}\,B_{r,jq}\Big)\,c_r(k)'
+  - 'At matched parameters the block-term expert''s generalization gap is 33% below the CP expert''s (0.0120 against 0.0178, $p=0.015$); the CP expert fits training better.'
+  - 'All compressible flow: a 31% smaller gap ($p=0.0005$); a single family: a tie (0.0083 against 0.0085, $p=0.44$); raw test error only $p=0.053$ and $0.082$.'
-headline: 'Block-term experts generalize 33% better than CP experts at equal fit on five PDE families'
+headline: 'Block-term experts show a 33% smaller generalization gap than CP experts on five PDE families'
-hook: 'The raw diversity gain belongs to mixing; the block-term expert''s own contribution is the smaller generalization gap.'
-panels:
-  - { figure: fig_mechanism.png, caption: 'Learned block profiles and frequency roughness', explain: 'Left, the learned block frequency profiles of one layer; right, the block-term kernel varies least across frequency (0.715, Tucker 0.797, CP 0.924), which the paper reports as a correlate only.' }
+sub: 'Diversity, the theorem at $L=1$, and scope as the paper states it'
+hook: 'The raw diversity gain belongs to mixing; the block-term expert adds a smaller gap.'
+tag: { class: mixed, text: 'Theorem, diversity and scope' }
+eli5:
+  purpose: 'What the mixture adds, and what the block terms add.'
+  plain: 'Any mixture gains; block terms add a smaller gap.'
+specs:
+  - { label: 'Code', value: 'TheAxeC/block-term-neural-operator (private)' }
+  - { label: 'AAAI 2027', value: 'rejected in Phase 1, ratings 4 and 5' }
+  - { label: 'Scope', value: 'one benchmark, no external mixture-of-experts system run' }
+method:
+  - 'A least-squares theorem and a diversity sweep.'
-  - 'From two to five families the block-term mixture gains 0% to +14.7% over one block-term operator; a CP-expert mixture rises along the same curve to +8.5%.'
-  - 'At $L=1$ the theorem predicts no advantage, yet the gap stops at 0.0160 against the CP expert''s 0.0179: an 11% residual ($p=0.040$) the theorem does not account for.'
-  - 'Rejected at AAAI 2027 in Phase 1 (ratings 4 and 5); the reviews ask for MoE-POT, NESTOR, MPP and AM-FNO baselines, a second benchmark and the Tucker side of the theory.'
-  - 'Scope as the paper states it: an internal factorization comparison at about 670k parameters on one benchmark, with no external mixture-of-experts operator system run.'
+  - 'Theorem: gap $\Theta(\sigma^2 R(L-1)K/n)$, zero at $L=1$, where an 11% residual remains ($p=0.040$).'
+  - 'Two to five families: block-term mixture 0% to +14.7% over one operator; CP-expert mixture up to +8.5%.'
+equation: 'W_{i,j,k}=\sum_{r=1}^{R}\Big(\sum_{p,q} A_{r,ip}\,G_{r,pq}\,B_{r,jq}\Big)\,c_r(k)'
+headline: 'The theorem''s gap is zero at $L=1$; the scope is one benchmark'
```

### bttd-source-eeg

```diff
-title: 'Can one decomposition of evoked EEG return each generator''s location, time course and trial loading together?'
-sub: 'Jointly Localized Spatiotemporal Components of Evoked EEG via a Lead-Field-Constrained Block-Term Decomposition'
-hook: 'Distributed inverses return one map per time sample, and reading a generator''s time course off those maps mixes in leakage; folding the lead field into a block-term decomposition makes every block a cortical source map with its own dynamics.'
+title: 'Can one decomposition localize evoked EEG generators and their dynamics?'
+sub: 'Jointly Localized Spatiotemporal Components of Evoked EEG via a Lead-Field-Constrained BTD'
+hook: 'Folding the lead field into a block-term decomposition makes every block a cortical source map with its own dynamics.'
-  plain: 'The method only keeps patterns that come back across time and across trials, and it forces every pattern to be one the brain could actually have produced at the scalp.'
+  plain: 'The method keeps patterns that return across time and trials and that the brain could have produced at the scalp.'
-  - { label: 'Tensor', value: 'channels x time x trials' }
-  - 'Rank-$(L_r,L_r,1)$ blocks whose spatial factor is the lead field times a row-sparse source map $\mathbf{G}_r$, with temporal factor $\mathbf{B}_r$ and trial loading $\mathbf{c}_r$; $L_r=2$.'
-  - 'Greedy deflation as in block-term tensor regression (BTTR): least-squares updates for $\mathbf{B}_r$ and $\mathbf{c}_r$, ISTA with a row group threshold for $\mathbf{G}_r$.'
-  - 'Simulated evoked EEG with 500 background dipoles and white sensor noise on a 64-channel sphere, a BEM on fsaverage and the New York head; 8 seeds, paired Wilcoxon tests.'
-  - 'Baselines: MNE, sLORETA, eLORETA, LCMV, Champagne and CP followed by eLORETA.'
+  - 'Rank-$(L_r,L_r,1)$ blocks whose spatial factor is the lead field times a row-sparse source map $\mathbf{G}_r$; $L_r=2$; channels by time by trials.'
+  - 'Greedy deflation; simulated evoked EEG on sphere, BEM and New York head; against MNE, sLORETA, eLORETA, LCMV, Champagne, CP then eLORETA.'
-  - 'Recovered time courses correlate 0.93 $\pm$ 0.09 with the truth on the sphere, against 0.98 to 0.99 for MNE, sLORETA and eLORETA.'
-  - 'Spread 13.4 $\pm$ 4.2 mm, the most focal of the classical solvers (MNE 14.5, eLORETA 17.4, sLORETA 21.8); the margin over eLORETA is not significant ($p=0.055$).'
-  - 'On the BEM eLORETA is more focal (22.1 against 26.8 mm), and on the New York head the spread is 23 to 33 mm against 17 to 22.'
-  - 'Champagne is sharper on these point sources (spread about 0.1 mm, correlation about 1.00), under the matched sparse prior it assumes.'
-panels:
-  - { figure: fig2_source_maps.png, caption: 'Source maps on the sphere at 0 dB', explain: 'Blue crosses mark the true sources; the block-term components sit on the generators, next to Champagne, CP followed by eLORETA, MNE, sLORETA, eLORETA and LCMV.' }
-equation: '\mathcal{M}\approx\sum_{r=1}^{R}\big[(\mathbf{L}\mathbf{G}_r)\,\mathbf{B}_r^{\top}\big]\circ\mathbf{c}_r'
+  - 'Time courses correlate 0.93 $\pm$ 0.09 with the truth on the sphere, against 0.98 to 0.99 for MNE, sLORETA and eLORETA.'
+  - 'Spread 13.4 $\pm$ 4.2 mm, the most focal of the classical solvers (MNE 14.5, eLORETA 17.4, sLORETA 21.8); margin over eLORETA not significant ($p=0.055$).'
+  - 'On the BEM eLORETA is more focal (22.1 against 26.8 mm); New York head 23 to 33 mm against 17 to 22; Champagne is sharper (about 0.1 mm).'
-hook: 'On the open MNE sample data a stimulus in one visual hemifield localizes to occipital cortex in the opposite hemisphere, with time courses flat before onset.'
-panels:
-  - { figure: real_contralateral.png, caption: 'Retinotopic check on real evoked EEG', explain: 'Left-field stimulation peaks in right lateral-occipital cortex and right-field stimulation in left lateral-occipital cortex.' }
+sub: 'Retinotopy on the open MNE sample data, correlated sources and scope'
+hook: 'A stimulus in one visual hemifield localizes to the opposite occipital cortex, flat before onset.'
+tag: { class: measured, text: 'Real EEG and limits' }
+eli5:
+  purpose: 'Check the method on real evoked EEG and find where it stops.'
+  plain: 'Real data agree with the expected side of the brain; the method needs phase-locked responses.'
+specs:
+  - { label: 'Correlated, LCMV', value: 'spread 17 to 53 mm, AUC 1.00 to 0.73' }
+  - { label: 'Correlated, components', value: '17 to 18 mm, AUC 0.93 to 0.90' }
+method:
+  - 'Visual-hemifield stimuli on the open MNE sample data.'
-  - 'Correlated sources: LCMV''s spread rises from 17 to 53 mm and its AUC falls from 1.00 to 0.73, while the components stay at 17 to 18 mm and AUC 0.93 to 0.90; the linear inverses and Champagne are also robust.'
-  - 'Phase-locked data only: on non-phase-locked sources the time-course correlation falls to 0.16 $\pm$ 0.07, against 0.85 $\pm$ 0.05 for per-trial eLORETA.'
-  - 'No multi-source recovery advantage: under a readout-agnostic top-$K$ count the components recover 1.6 of 3 sources, the fewest of the methods.'
-  - 'Block count and rank are set by hand, and deep sources degrade for every method.'
+  - 'Phase-locked data only: non-phase-locked correlation falls to 0.16 $\pm$ 0.07, against 0.85 $\pm$ 0.05 for per-trial eLORETA.'
+  - 'No multi-source recovery advantage: 1.6 of 3 sources under a top-$K$ count, the fewest of the methods; block count and rank are set by hand.'
+equation: '\mathcal{M}\approx\sum_{r=1}^{R}\big[(\mathbf{L}\mathbf{G}_r)\,\mathbf{B}_r^{\top}\big]\circ\mathbf{c}_r'
+headline: 'Real visual EEG localizes to the opposite occipital cortex; the method needs phase-locked data'
```

### bttn-incident-af

```diff
-title: 'Can an interpretable ECG model predict atrial fibrillation before its first episode?'
-sub: 'An Interpretable Block-Term Tensor Network for Incident Atrial-Fibrillation Prediction from the Sinus-Rhythm 12-Lead ECG and Clinical Risk Factors'
-hook: 'BTTN reads a frequency by time by lead spectrogram through blocks with readable frequency and lead factors, and adds clinical risk factors outside those blocks.'
+title: 'Can an interpretable ECG model predict atrial fibrillation before onset?'
+sub: 'Block-Term Tensor Network for incident AF from the sinus-rhythm 12-lead ECG'
+hook: 'BTTN reads a frequency-time-lead spectrogram through blocks with readable factors; clinical factors sit outside them.'
-  - { label: 'Code', value: 'TheAxeC/bttn-incident-af' }
-  - 'Spectrogram of about 21 frequencies, 40 frames and 12 leads; $K=12$ blocks with factors $A_k$, $C_k$, temporal convolutions and attention pooling.'
-  - 'Cox loss over batch risk sets; clinical factors enter as $\eta=\eta_{\mathrm{ECG}}+\mathbf{w}^{\top}\mathbf{c}$, zero at the start of training.'
+  - 'About 21 frequencies, 40 frames, 12 leads; $K=12$ blocks under a Cox loss; clinical factors enter as $\eta=\eta_{\mathrm{ECG}}+\mathbf{w}^{\top}\mathbf{c}$.'
-  - 'One-year AUROC: ECG-only 0.747, matched CNN 0.734, clinical baseline 0.760; fused 0.778 [0.767, 0.789], paired +0.019 [+0.014, +0.024], and 0.794 at five years.'
+  - 'One-year AUROC: ECG-only 0.747, CNN 0.734, clinical 0.760, fused 0.778 [0.767, 0.789]; paired +0.019 [+0.014, +0.024]; five-year 0.794.'
-  - 'Recalibrated to 4.25% incidence: 20.7-fold risk gradient across deciles, Brier 0.039, 7.7 patients monitored per AF case at a top-5% flag rate.'
+  - 'Recalibrated to 4.25% incidence: 20.7-fold risk gradient across deciles, Brier 0.039, 7.7 monitored per AF case at a top-5% flag rate.'
-hook: 'Occlusion places future-AF risk in the P-wave band near 2 Hz and a 4 to 8 Hz atrial band, in leads I, II, V1 and V5.'
+hook: 'Risk sits in the P-wave band near 2 Hz, a 4 to 8 Hz atrial band and leads I, II, V1 and V5.'
-  purpose: 'Check which parts of the ECG carry the risk signal, and on which other cohorts it can be tested.'
-  plain: 'Masking a frequency band or a lead and watching the drop shows where the model looks; the same pattern recurs on CODE-15.'
+  purpose: 'Which ECG parts carry the risk, and where can it be tested?'
+  plain: 'Masking a band or a lead shows where the model looks.'
+specs:
+  - { label: 'CODE-15, PTB-XL', value: 'identification 0.829, detection 0.980, 0.983' }
+  - { label: 'AUROC', value: 'block-term, full-rank 0.729, CP 0.728' }
+  - { label: 'Dead ends', value: 'tensor 0.675, boosted BTTR 0.620, attention 0.61, two-branch, warm start' }
+method:
+  - 'Occlusion; probe label-blind 0.973, trained 0.976.'
-  - 'Below the one-year AUROC of 0.85 reported by Raghunath et al. on a far larger cohort; the five-year 0.794 is in-distribution, 0.77 of Jabbour et al. is external.'
-  - 'A label-blind block layer recovers 0.973 under the probe, the trained one 0.976; block-term, full-rank and CP layers tie on AUROC (0.729, 0.729, 0.728).'
-  - 'CODE-15 and PTB-XL test AF identification (0.829) and detection (0.980, 0.983) only: no external cohort has dated onset, and competing risks await death dates.'
-  - 'Dead ends on earlier report labels: beat by time by lead tensor 0.675, boosted BTTR 0.620, attention head 0.61, two-branch input 0.731 against 0.754, cross-covariance warm start 0.744 against 0.758; a risk rise toward onset did not replicate.'
+  - 'One-year 0.778, below 0.85 of Raghunath et al. (far larger cohort); five-year 0.794 in-distribution, 0.77 of Jabbour et al. external.'
+  - 'No external cohort has dated onset; no rise toward onset replicated; competing risks await death dates.'
+headline: 'Occlusion places the risk in the P-wave and atrial bands; no external cohort has dated onset'
```

### clinical-hccnet

```diff
-title: 'Can MRI of the liver parenchyma alone predict hepatocellular carcinoma years before diagnosis?'
+title: 'Can liver parenchyma MRI alone predict HCC years before diagnosis?'
-hook: 'Published HCC risk scores lean on laboratory markers of liver-disease severity; this model reads one block of left-lobe tissue on routine surveillance MRI, with no contrast agent and no clinical or laboratory variable.'
+hook: 'One block of left-lobe tissue on routine surveillance MRI, with no contrast agent and no clinical or laboratory variable.'
-  purpose: 'Tell which patients with advanced chronic liver disease are likely to develop liver cancer in the coming years, so that MRI surveillance goes to those at high risk.'
-  plain: 'A computer looks at a small block of liver tissue on each of a patient''s MRI scans, in order, and learns the tissue changes that come before cancer, changes too diffuse for the eye to see.'
+  purpose: 'Tell which patients with advanced chronic liver disease are likely to develop liver cancer, so MRI goes to those at high risk.'
+  plain: 'A computer reads a small block of liver tissue on each MRI scan in order, and learns changes too diffuse for the eye.'
-  - { label: 'Cohort', value: '243 patients, 947 MRI examinations' }
-  - { label: 'Input', value: 'Left-lobe parenchyma, no contrast' }
+  - { label: 'Cohort', value: '243 patients; 804 of 947 MRI analysed' }
-  - 'A CNN encodes a left-lobe region of interest on each examination and a Transformer reads the examinations in order; two self-supervised stages (DINO, then examination order and interval) precede fine-tuning on HCC.'
-  - 'One model per sequence (DW, T1 in- and out-of-phase, T2, T1 contrast-enhanced); the fusion model averages the contrast-free sequence models a patient has.'
-  - 'Horizons of 1, 2 and 3 years before the endpoint; AUROC with patient-level bootstrap intervals, and Firth logistic regression adjusted for age, sex and etiology.'
+  - 'A CNN per examination, a Transformer over the series, DINO then examination-order pre-training; fusion averages the contrast-free sequence models.'
-  - 'Fusion AUROC 0.966 (0.922 to 0.996) at 1 year, 0.893 (0.777 to 0.981) at 2 years and 0.829 (0.653 to 0.969) at 3 years.'
-  - 'In the 58 held-out patients: 0.899 at 1 year (4 HCC), 0.881 at 2 years (3 HCC) and 0.929 at 3 years (1 HCC).'
-  - 'Adjusted for age, sex and etiology, the odds ratio per SD of the fusion log-odds is 12.96, 5.19 and 3.34 at 1, 2 and 3 years; every interval excludes 1.'
-  - 'HCC developed in 37 patients (15.2%); at diagnosis 13 were at BCLC stage 0 and 16 at stage A, and 27 received curative treatment.'
-panels:
-  - { figure: fusion_over_time.png, caption: 'Fusion model AUROC by horizon', explain: 'Bars give the AUROC 1, 2 and 3 years before diagnosis, with patients and HCC under each bar; at 3 years, 72 patients with 10 HCC.' }
+  - 'Fusion AUROC 0.966 (0.922 to 0.996) at 1 year, 0.893 (0.777 to 0.981) at 2 years, 0.829 (0.653 to 0.969) at 3 years.'
+  - 'In the 58 held-out patients: 0.899 at 1 year (4 HCC), 0.881 at 2 years (3 HCC), 0.929 at 3 years (1 HCC).'
+  - 'Adjusted odds ratio per SD: 12.96 (4.84 to 66.58), 5.19 (2.52 to 14.22), 3.34 (1.50 to 9.93) at 1, 2, 3 years.'
-title: 'Per sequence, and the limitations'
-hook: 'In this cohort the prediction did not rest on the contrast-enhanced sequence: T1 contrast-enhanced MRI on its own reached an AUROC of 0.690 at 2 years and 0.433 at 3 years.'
-panels:
-  - { figure: sequences_by_horizon.png, caption: 'AUROC per MRI sequence by horizon', explain: 'DW-MRI reaches 0.922, 0.855 and 0.813, and T1 in- and out-of-phase MRI 0.936, 0.852 and 0.741, at 1, 2 and 3 years.' }
+title: 'How does each sequence perform, and what limits the result?'
+sub: 'Per-sequence AUROC, the HCC cases, limitations and dead ends'
+hook: 'In this cohort T1 contrast-enhanced MRI on its own reached an AUROC of 0.690 at 2 years and 0.433 at 3 years.'
+tag: { class: measured, text: 'Sequences and limits' }
+eli5:
+  purpose: 'Show how each MRI sequence scores alone and where the evidence stops.'
+  plain: 'Each sequence is scored on its own; one centre and no external validation yet.'
+specs:
+  - { label: 'HCC', value: '37 patients (15.2%)' }
+method:
+  - 'One model per sequence: DW, T1 in- and out-of-phase, T2 and T1 contrast-enhanced; horizons of 1, 2 and 3 years before the endpoint.'
-  - 'The whole-cohort values include the development patients that trained the models, and each sequence''s encoder size was chosen on the held-out patients.'
-  - 'One centre, an ethnically homogeneous population, mostly MASLD and ALD, and no external validation yet; 10 HCC at 3 years in the whole cohort and 1 in the held-out patients.'
-  - 'Results by etiology, sex and age were taken out of the paper: the subgroups are too small for the statistics.'
-  - 'Dead ends: combining sequences by rank, fixed weights or an any-sequence rule did not beat the plain average; combined-sequence models did not beat DW-MRI; scoring a truncated full history gave scores that rose with distance from diagnosis.'
+  - 'DW-MRI 0.922, 0.855, 0.813; T1 in- and out-of-phase 0.936, 0.852, 0.741 at 1, 2 and 3 years.'
+  - 'At diagnosis 13 patients were at BCLC stage 0 and 16 at stage A; 27 received curative treatment.'
+  - 'Whole-cohort values include development patients; one centre, mostly MASLD and ALD, 10 HCC at 3 years in the whole cohort, 1 held out.'
+  - 'Dead ends: rank, fixed weights or an any-sequence rule did not beat the plain average; combined-sequence models did not beat DW-MRI.'
+headline: 'Per-sequence AUROC and the limits of a single-centre cohort'
```

### covert-applied

```diff
-title: 'COVERT: block-term regression across parties that hold different modalities of the same patients'
+title: 'COVERT: block-term regression across parties holding different modalities'
-hook: 'ECG, labs and vitals of one patient sit with different parties; only a cohort-sized score and a residual cross between them, and the federated fit equals the centralized one.'
+hook: 'Only a cohort-sized score and a residual cross between the parties, and the federated fit equals the centralized one.'
-  plain: 'Each department turns its own data into one number per patient; only the sum of those numbers is shared, with privacy noise, and every department keeps its model parts at home.'
-equation: '\mathcal{L}\big(\{\theta^{(p)}\},\mathbf{q},d\big)=\Big\|\mathbf{F}-d\,\Big(\sum_p\mathbf{t}^{(p)}\Big)\mathbf{q}^{\top}\Big\|_F^2+\sum_p\lambda_p\big\|\mathcal{G}^{(p)}\big\|_1'
+  plain: 'Each department turns its own data into one number per patient; only the noisy sum is shared, model parts stay at home.'
-  - { label: 'MIMIC-IV-ECG', value: '5,000 inpatients, 3 parties, 1-yr mortality 14.1%' }
-  - { label: 'Liver MRI', value: '400 studies, 163 patients, 2 imaging parties' }
-  - { label: 'Model', value: 'coupled rank-$(L_r,L_r,1)$ block terms, sparse cores' }
+  - { label: 'MIMIC-IV-ECG', value: '5,000 inpatients, 3 parties' }
+  - { label: 'Liver MRI', value: '400 studies, 163 patients, 2 parties' }
-  - 'Orthogonal masking cannot keep a thresholded sparse core: only signed permutations commute with soft-thresholding, and they conceal nothing.'
-  - 'So each party fits its sparse factors locally in the clear; secure aggregation sums the partial scores.'
-  - 'Gaussian noise on the clipped score and residual gives patient-level DP independent of $\prod_n I_n$.'
+  - 'Each party fits sparse rank-$(L_r,L_r,1)$ factors locally in the clear; secure aggregation sums the partial scores; Gaussian noise gives patient-level DP.'
-  - 'MIMIC AUROC 0.745, equal to centralized and equivalent to P3LS 0.743 (TOST +0.0014, 95% CI [+0.0001, +0.0026]).'
-  - 'Fusion beats the best single party (0.721) by +0.024 across all seed-folds.'
-  - 'Liver MRI: 0.585, equal to centralized, +0.036 over P3LS (95% CI [+0.019, +0.053]) on 17 patient-level positives.'
-  - 'Route B keeps an 87%-sparse core and sends 0.20 MB per round against 4.8 MB for masked dense tensors.'
+  - 'MIMIC AUROC 0.745, equal to centralized, equivalent to P3LS 0.743 (TOST +0.0014, 95% CI [+0.0001, +0.0026]); fusion +0.024 over the best party (0.721).'
+  - 'Liver MRI: 0.585, equal to centralized, +0.036 over P3LS (95% CI [+0.019, +0.053]) on 17 positives; fusion does not beat the best party (0.572, p = 0.64).'
+  - 'Route B: an 87%-sparse core, 0.20 MB per round against 4.8 MB masked; score-only DP 0.748 at $\varepsilon$ = 0.23, both channels 0.711 at $\varepsilon \approx$ 4.8.'
+  - 'Limits: naive concatenation ties on MIMIC (0.745, p = 0.31); accuracy flat in block rank; data split by modality within one source.'
-
----
-kind: columns
----
-# What the design buys, and the limits on accuracy
-
-### Privacy and cost on MIMIC
-
-- Privatizing the score channel alone: 0.748 AUROC at $\varepsilon$ = 0.23.
-- Both channels: 0.711 at $\varepsilon \approx$ 4.8, a plateau of 0.669 below $\varepsilon$ = 1.
-- At 8x the feature dimension Route B stays at 0.20 MB per round while masked dense tensors grow to 38.1 MB.
-- Loadings of the ECG party reproduce at 0.95 against a 0.34 label-permutation null.
-
-|||
-
-### Accuracy limits and scope
-
-- Naive concatenation ties COVERT on MIMIC (0.745, p = 0.31).
-- Accuracy is flat in the block rank, 0.745 from $L$ = 1 to 4; a logistic link did not revive $L > 1$.
-- On the liver MRI cohort fusion does not beat the best single party (0.572, p = 0.64).
-- Both cohorts split data by modality within one source; no cross-institution deployment is evaluated.
----
```

### covert-theory

```diff
-hook: 'Put the differential-privacy noise on the short shared score that couples the parties, and the prediction''s privacy cost no longer grows with the size of any party''s data.'
+hook: 'With noise on the short shared score, the prediction''s privacy cost no longer grows with the size of any party''s data.'
-  purpose: 'Let institutions that hold different measurements of the same patients learn one model, with a privacy guarantee and a known price for it.'
-  plain: 'Only one short list of numbers per patient crosses between institutions; blur that list, and the accuracy lost depends on the number of patients, never on how much data each institution holds.'
-equation: '\min_{k<K}\mathbb{E}\|\mathcal{G}^k\|^2\le\frac{4(\mathcal{L}^0-\mathcal{L}^\star)}{\eta^2\gamma K}+\frac{4\kappa^2(m\sigma^2+\|\boldsymbol{\beta}\|^2)}{\eta^2\gamma^2}'
+  purpose: 'One model across institutions, with a known privacy price.'
+  plain: 'Only one short list per patient crosses, and it alone is blurred.'
-  - { label: 'Iteration', value: 'perturbed PALM under the KL property' }
-  - { label: 'Mechanism', value: 'Gaussian $(\varepsilon,\delta)$-DP on the score, clip $c$' }
-  - { label: 'Instance', value: 'vertical sparse block-term tensor regression' }
+  - { label: 'Mechanism', value: 'Gaussian DP on the score, clip $c$' }
-  - 'No-go: among orthogonal masks only signed permutations preserve a thresholded support, and they hide the core magnitudes from no one.'
-  - 'So parties decompose locally and share only the score, released once per round under the Gaussian mechanism.'
-  - 'The coupling noise is bounded as a gradient error whose constant does not depend on $\prod_n I_n$.'
+  - 'Parties share only the score; the noise is a gradient error independent of $\prod_n I_n$.'
-  - 'At $\sigma = 0$ the whole sequence converges to a critical point; under a fixed budget the iterates reach an $O(\sigma)$ neighborhood.'
-  - 'Excess prediction risk depends on the score length $m$ and the regression curvature, independent of $\prod_n I_n$.'
-  - 'A lower bound makes the cost order-optimal in $(c, \varepsilon)$; privatizing once removes the factor $P$ that per-message noise pays.'
-  - 'To the authors'' knowledge, the first convergence-and-utility theory for DP block-coordinate descent with coupling-variable noise, and the first for block-term decomposition.'
+  - 'At $\sigma = 0$ the sequence converges; under a fixed budget the iterates reach $O(\sigma)$.'
+  - 'Excess risk independent of $\prod_n I_n$, order-optimal in $(c, \varepsilon)$.'
+  - 'Not claimed: tightness in $m$, a block-term-specific separation.'
+equation: '\min_{k<K}\mathbb{E}\|\mathcal{G}^k\|^2\le\frac{4(\mathcal{L}^0-\mathcal{L}^\star)}{\eta^2\gamma K}+\frac{4\kappa^2(m\sigma^2+\|\boldsymbol{\beta}\|^2)}{\eta^2\gamma^2}'
-
----
-kind: columns
----
-# What the synthetic check measured, and what is not claimed
-
-### Predicted against measured, 20 seeds
-
-- Stationarity floor against $\sigma^2$: slope 1.00 (predicted 1).
-- Excess risk across a 100x rise in $\prod_n I_n$: ratio 1.03 (predicted 1).
-- Floor against $1/\varepsilon^2$: slope 0.97 (predicted 1).
-- Measured floor over the lower-bound prediction: 1.1.
-
-|||
-
-### Outside the result
-
-- The match in $m$ holds only in the per-coordinate-sensitivity regime; under the joint $\ell_2$ clip the bounds need not be tight in $m$.
-- The $\Omega(\sigma)$ floor constant is generic, so there is no block-term-specific separation.
-- No rate to the floor and no whole-sequence convergence under noise.
-- Private recovery of the high-dimensional factors stays dimension-dependent.
----
```

### dries-bttr-ecg

```diff
-title: 'Can a model whose parameters are readable maps identify atrial fibrillation from a sinus-rhythm ECG?'
-sub: 'An interpretable tensor model for identifying atrial fibrillation in sinus-rhythm ECG: block-term tensor regression on PTB-XL, benchmarked against deep and foundation models'
-hook: 'The models that find atrial fibrillation in a sinus-rhythm ECG are usually deep networks on private cohorts that do not show what they use; block-term tensor regression fits time-by-lead weight maps to the label, so the fitted maps are the decision.'
+title: 'Can a model of readable maps identify AF from a sinus-rhythm ECG?'
+sub: 'An interpretable tensor model for identifying atrial fibrillation in sinus-rhythm ECG'
+hook: 'Block-term tensor regression fits time-by-lead weight maps to the label, so the fitted maps are the decision.'
-  purpose: 'Find patients with atrial fibrillation from an ECG recorded while their heart beats normally, and show which leads and which part of the heartbeat the model used.'
-  plain: 'The average heartbeat of each lead is lined up on its main spike and stacked into a block of numbers; the model learns eight simple patterns over time and lead, and those patterns are the whole model.'
+  purpose: 'Find atrial fibrillation from an ECG in normal rhythm, and show which leads and part of the heartbeat the model used.'
+  plain: 'Median beats of each lead are stacked; the model learns eight simple patterns over time and lead, and those are the whole model.'
-  - { label: 'Venue', value: 'Med. Biol. Eng. Comput., revision resubmitted' }
+  - { label: 'Venue', value: 'MBEC, revision resubmitted' }
-  - { label: 'Code', value: 'TheAxeC/bttr-af-ecg' }
-  - 'PTB-XL 1.0.3: a sinus-rhythm record is positive when an AFIB record (or AFIB or flutter) follows within 31 days, median 5 days; controls are matched 1:3 on sex and nearest age, and age alone scores 0.500.'
-  - 'R-peak-aligned median beats from $-250$ to $+400$ ms at 100 Hz form a records by 65 by 12 tensor.'
-  - 'BTTR: $K=8$ rank-$(L_2,L_3,1)$ blocks fit to a $\pm 1$ target by deflation, with the ranks chosen inside each training fold.'
-  - 'Baselines: clinical features, an Attia-style CNN, a rank-8 CP surrogate and frozen HuBERT-ECG probes; ten control draws, patient-grouped 5-fold cross-validation and a pooled paired bootstrap.'
+  - 'PTB-XL 1.0.3: a sinus record is positive when an AFIB record (or AFIB or flutter) follows within 31 days; controls matched 1:3 on sex and nearest age.'
+  - 'BTTR: $K=8$ rank-$(L_2,L_3,1)$ blocks on median beats; against clinical features, a CNN, a CP surrogate and HuBERT-ECG probes; ten control draws.'
-  - 'Against the tuned HuBERT-ECG probe and clinical features the CIs include zero, and the CP surrogate on the same tensor is comparable (+0.004 and +0.009).'
-  - 'The per-lead weight profile reproduces across draws at Pearson $r=0.857$; the weight spreads over the beat, 0.374 in the T window and 0.161 in the atrial window.'
-panels:
-  - { figure: forest_auroc.png, caption: 'AUROC on the seed-0 draw with 95% CIs', explain: 'Every method on both cohorts; this draw is the best of the ten for BTTR on AFIB, so the ten-draw means are the primary summary.' }
+  - 'Against the tuned HuBERT-ECG probe and clinical features the CIs include zero; the CP surrogate is comparable (+0.004 and +0.009).'
-title: 'Where the weight sits, what alignment does, and the limits'
-hook: 'Without R-peak registration BTTR falls to chance, 0.490 and 0.457 against 0.597 and 0.643 aligned: a pooled paired gain of +0.107 and +0.186.'
-panels:
-  - { figure: interpret_afsr_afibonly_blocks.png, caption: 'The eight BTTR block maps, seed-0 AFIB fit', explain: 'Each panel is one block''s 65-sample by 12-lead weight map, ordered by the size of its coefficient $b$; colour is the signed weight.' }
+title: 'Where does the weight sit, what does alignment do, what are the limits?'
+sub: 'Weight maps, R-peak alignment, limits and dead ends'
+hook: 'Without R-peak registration BTTR falls to chance, 0.490 and 0.457 against 0.597 and 0.643 aligned.'
+tag: { class: measured, text: 'Weight maps and limits' }
+eli5:
+  purpose: 'Show where the model puts its weight and how far the evidence goes.'
+  plain: 'Lining up the beats on the main spike lifts the score; the result is feasibility-level.'
+specs:
+  - { label: 'Code', value: 'TheAxeC/bttr-af-ecg' }
+method:
+  - 'Alignment ablation: the same pipeline with and without R-peak registration, pooled paired gain +0.107 and +0.186.'
-  - 'Concurrent identification within 31 days, a feasibility-level AUROC on one small public database, and no external validation yet; PTB-XL has no follow-up for future onset.'
-  - 'The CNN stays near chance aligned and unaligned, so the ablation carries no conclusion on alignment for the CNN.'
-  - 'With unmatched controls age alone reached an AUROC of about 0.75 and the black-box baselines rode on it; the matching is now the design.'
-  - 'Dead ends: about 18 variants (regularised and group-lasso BTTR, a Fisher discriminant, fusion, multibeat, spectral, Riemannian and others) did not beat plain BTTR at 42 positives; RR pseudo-leads are dead weight in sinus-rhythm records (0.471 and 0.548); a single-seed 0.667 against 0.509 did not survive re-drawn controls.'
+  - 'Per-lead weight profile reproduces across draws at Pearson $r=0.857$; 0.374 of the weight in the T window and 0.161 in the atrial window.'
+  - 'Identification within 31 days, one small public database, no external validation; PTB-XL has no follow-up for future onset.'
+  - 'Dead ends: about 18 variants did not beat plain BTTR at 42 positives; a single-seed 0.667 against 0.509 did not survive re-drawn controls.'
+headline: 'Without R-peak registration BTTR falls to chance; the AUROC is feasibility-level'
```

### ecg-readable-substrate

```diff
-title: 'Does an ECG foundation model predict one-year mortality better than named ECG measurements?'
+title: 'Do ECG foundation models beat named measurements on one-year mortality?'
-hook: 'ECG foundation models are credited with prognostic signal that named measurements cannot capture; a gradient-boosted model on 231 named features is set against the best frozen-embedding probe of six published encoders, each comparison tagged for pretraining overlap.'
+hook: 'Gradient boosting on 231 named features against the best frozen-embedding probe of six published encoders.'
-  purpose: 'Check whether a large pretrained ECG model is needed to tell who will die within a year, or whether measurements a doctor can name do as well.'
-  plain: 'One model uses about 231 measurements with names, such as heart rate and the QT interval, plus age; the others use what six large pretrained ECG models extract. All are scored on the same patients from two health systems.'
+  purpose: 'Check whether a large pretrained ECG model is needed to tell who will die within a year.'
+  plain: 'One model uses about 231 named measurements, such as heart rate and QT, plus age; the others use six pretrained ECG models.'
-  - { label: 'Code', value: 'TheAxeC/named-ecg-vs-foundation-models' }
-  - 'One ECG per patient and one-year all-cause mortality: MIMIC-IV-ECG (prevalence 0.129) and CODE-15 (0.141), with patient-disjoint training, validation and held-out sets.'
-  - 'Named model: gradient boosting on 231 to 235 NeuroKit features (intervals, rate, time-domain HRV, amplitudes, band powers) and age.'
-  - 'Six frozen encoders (ECGFounder, ECG-FM, HuBERT-ECG, ECG-JEPA, xECG, ST-MEM), each scored by the better of a linear and a boosted probe; paired patient bootstrap, TOST margin 0.01, Bonferroni over 12 comparisons.'
-  - 'A cross-cohort arm on 227 shared features, and a per-patient sufficient-reason certificate at $\delta=0.9$.'
+  - 'One ECG per patient, one-year all-cause mortality, patient-disjoint sets; gradient boosting on 231 to 235 NeuroKit features and age.'
+  - 'Six frozen encoders, each scored by the better of a linear and a boosted probe; paired bootstrap, TOST margin 0.01, Bonferroni over 12 comparisons.'
-  - 'Named AUROC 0.811 on CODE-15 and 0.773 on MIMIC, calibration slope 1.02 and 1.01: 7 wins, 5 ties (ECG-JEPA and ST-MEM on both cohorts, ECGFounder on MIMIC) and no loss.'
+  - 'Named AUROC 0.811 on CODE-15 and 0.773 on MIMIC, calibration slope 1.02 and 1.01: 7 wins, 5 ties and no loss.'
-  - 'Over age alone the named features add +0.062 (CODE-15) and +0.105 (MIMIC); waveform features without age reach 0.781 against 0.749 for age.'
-  - 'The certificate has median length 1 and coverage 0.96, and holds age for every patient.'
+  - 'Over age alone named features add +0.062 (CODE-15) and +0.105 (MIMIC); the certificate has median length 1 and coverage 0.96.'
-kind: columns
+kind: project
+title: 'What changes when the encoders also get age, and what limits the result?'
+sub: 'The comparison at equal input, margins, scope and dead ends'
+hook: 'Giving each encoder the named arm''s covariates turns 7 wins, 5 ties and 0 losses into 5 wins, 1 tie and 6 losses.'
+tag: { class: measured, text: 'Equal input and limits' }
+eli5:
+  purpose: 'See how the comparison changes when the encoders get the same age input.'
+  plain: 'With age, several encoders move ahead of the named model.'
+specs:
+  - { label: 'Code', value: 'TheAxeC/named-ecg-vs-foundation-models' }
+method:
+  - 'A cross-cohort arm on 227 shared features, with age and sex given to the encoders.'
+results:
+  - 'With age, ECG-JEPA (0.016), ST-MEM (0.013), ECG-FM (0.006) beat the named model on CODE-15; ECGFounder (0.008), ECG-JEPA and ST-MEM (0.013) on MIMIC.'
+  - 'Transfer becomes 2 wins, 1 tie, 3 losses (MIMIC to CODE-15) and 2, 2, 2 (CODE-15 to MIMIC); the named model still beats HuBERT-ECG and xECG.'
+  - 'One endpoint, frozen embeddings only, ten-second HRV. Dead ends: a sparse-dictionary substrate, federated transport, a residual as a leakage signature.'
+headline: 'At equal input the count turns to 5 wins, 1 tie and 6 losses'
-# The comparison at equal input, and the limits
-
-### When the encoders also get age
-
-- Giving each encoder the named arm's covariates turns 7 wins, 5 ties and 0 losses into 5 wins, 1 tie and 6 losses.
-- With age, ECG-JEPA (by 0.016), ST-MEM (0.013) and ECG-FM (0.006) beat the named model on CODE-15, and ECGFounder (0.008), ECG-JEPA and ST-MEM (0.013 each) on MIMIC.
-- The named model still beats HuBERT-ECG and xECG on both cohorts and ECG-FM on MIMIC.
-- Transfer becomes 2 wins, 1 tie, 3 losses (MIMIC to CODE-15) and 2, 2, 2 (CODE-15 to MIMIC) with age and sex given to the encoders.
-
-|||
-
-### Margins, scope and dead ends
-
-- ECG-JEPA edges the named model from CODE-15 to MIMIC (+0.013), and ST-MEM by a margin whose interval includes zero.
-- A leakage-clean encoder adds +0.013 on CODE-15 and +0.002 on MIMIC to the named model.
-- One endpoint, frozen embeddings only, ten-second HRV, and NeuroKit delineation as a possible confounder.
-- Dead ends: a sparse-dictionary substrate (pre-empted), federated transport (no stable gap) and a residual as a leakage signature (pre-empted, and the residual does not behave as one).
```

### fed-multicellular-immune

```diff
-title: 'Can multicellular immune programs be recovered across institutions that never share cells?'
-sub: 'Privacy-preserving federated tensor decomposition of single-cell immune data: recovering multicellular programs across institutions'
-hook: 'Tensor decomposition of donor by cell-type by gene single-cell data finds programs that span cell types, but it needs the cells pooled; here each site sends a truncated summary of its program subspace, and a stacked SVD after global-mean centering approximates the pooled result.'
+title: 'Can multicellular immune programs be recovered without sharing cells?'
+sub: 'Privacy-preserving federated tensor decomposition of single-cell immune data'
+hook: 'Each site sends a truncated program summary; a stacked SVD after global-mean centering approximates the pooled result.'
-  purpose: 'Find the coordinated immune patterns that separate patients with a disease from healthy people, using single-cell data held at several institutions that cannot pool it.'
-  plain: 'Each institution sends only a short summary of the patterns in its own data, never the cells; combining the summaries gives nearly the same patterns as pooling everything, and an attack test measures how much the summaries reveal about who took part.'
+  purpose: 'Find the coordinated immune patterns separating patients from healthy people, in single-cell data that cannot be pooled.'
+  plain: 'Each institution sends a short summary of its patterns; combining them gives nearly the patterns of pooling everything.'
-  - { label: 'Venue', value: 'Comput. Methods Programs Biomed., under review' }
+  - { label: 'Venue', value: 'CMPB, under review' }
-  - { label: 'Code', value: 'TheAxeC/federated-multicellular-tensor' }
-  - 'Pseudobulk tensor of donors, cell types and 1,500 genes, standardized within each cell type; the programs are the top $K=10$ right singular vectors of the donor-mode unfolding.'
-  - 'Complete panels: sites centre on the federated global mean and send rank-$L$ loadings $M_s$; the coordinator takes the top-$K$ vectors of the stacked $M$.'
-  - 'Incomplete panels (vertical FL): sites holding different cell types for shared donors send donor Gram blocks, whose sum equals the centralized Gram.'
-  - 'A reconstruction-residual membership-inference attack over 30 splits, run on each release object.'
+  - 'Pseudobulk donors by cell types by 1,500 genes; programs are the top $K=10$ right singular vectors; sites send rank-$L$ loadings $M_s$.'
+  - 'Incomplete panels: donor Gram blocks, whose sum equals the centralized Gram; a membership-inference attack over 30 splits on each release object.'
-  - 'Lupus (261 donors): federated against centralized SLE AUC 0.958, $\Delta$AUC 0.000 [$-0.004$, +0.012], subspace correlation 0.967; label-free CV AUC 0.960.'
-  - 'Three original COVID-19 sites (61, 45 and 11 donors): correlation 0.989; global-mean centering holds AUC 0.957 under 90% case skew, where per-site centering falls to 0.861.'
-  - 'Cell-type-incomplete sites: correlation 1.000, exact by construction, where fixed-feature federated PCA cannot run.'
+  - 'Lupus (261 donors): SLE AUC 0.958, $\Delta$AUC 0.000 [$-0.004$, +0.012], subspace correlation 0.967; label-free CV AUC 0.960.'
+  - 'Three COVID-19 sites: correlation 0.989; global-mean centering holds AUC 0.957 under 90% case skew, per-site centering 0.861; incomplete sites 1.000.'
-equation: '\left\| X_c^{\top} X_c - M^{\top} M \right\|_2 \leq \sum_{s=1}^{S} \sigma_{L+1}^2(X_{s,c})'
-kind: columns
+kind: project
+title: 'Where does multicellularity pay, and what is not solved?'
+sub: 'Lung and liver gains, privacy limits and the merge'
+hook: 'Lung ILD reaches 0.959 against 0.910 for the best single compartment, and the gain survives federation.'
+tag: { class: measured, text: 'Gains and privacy limits' }
+eli5:
+  purpose: 'Say where one program across cell types beats one cell type, and what stays open.'
+  plain: 'Lung and liver gain; no secure protocol is implemented for the merge.'
+specs:
+  - { label: 'Code', value: 'TheAxeC/federated-multicellular-tensor' }
+  - { label: 'Liver PSC/PBC, 16 donors', value: 'CV AUC 0.975, $p=0.005$' }
+  - { label: 'Released program reveals', value: 'ancestry (AUC 0.81), sex (0.65)' }
+method:
+  - 'Programs scored against the best single compartment.'
+results:
+  - 'Lung ILD (109 donors): gap +0.049 [+0.006, +0.101], correlation 0.981.'
+  - 'No secure stacked-SVD protocol is implemented.'
+  - 'Differential privacy collapses recovery at these sizes (correlation 0.029 on lupus); it needs about 900 donors at $\varepsilon=4$.'
+equation: '\left\| X_c^{\top} X_c - M^{\top} M \right\|_2 \leq \sum_{s=1}^{S} \sigma_{L+1}^2(X_{s,c})'
+headline: 'Lung ILD gains +0.049 over the best compartment; the secure merge stays unsolved'
-# Where multicellularity pays, and what is not solved
-
-### When the program beats one cell type
-
-- Lung ILD (109 donors): 0.959 against 0.910 for the best single compartment, gap +0.049 [+0.006, +0.101], and it survives federation (correlation 0.981).
-- Liver PSC/PBC (16 donors): nested CV AUC 0.975, permutation $p=0.005$; a small cohort with 6 controls and no open replication.
-- Comparable elsewhere: SLE +0.013, COVID severity $-0.064$, Crohn's gut +0.008, kidney +0.024 (CI includes zero), heart $-0.015$.
-
-|||
-
-### Privacy limits and the replaced stitch
-
-- Additive secure aggregation does not compute the stacked merge, and no secure stacked-SVD protocol is implemented.
-- The released program reveals ancestry (AUC 0.81) and sex (0.65); site-subspace leakage rises to 0.98 at 20 donors per site.
-- Differential privacy collapses recovery at these cohort sizes (correlation 0.029 on lupus) and needs about 900 donors at $\varepsilon=4$ for a 30-gene program.
-- A gene-mode stitch for incomplete panels reached correlation 0.654 and was replaced by the donor-Gram coupling.
```

### hccnet-revision

```diff
-sub: 'HCCNet: a self-supervised 3D ConvNeXt and Transformer for longitudinal MRI, applied to HCC surveillance in cirrhosis'
-hook: 'Cirrhosis patients are screened by MRI for years at irregular intervals, yet earlier models read one scan; HCCNet encodes every examination and lets a Transformer read the series, with the time to the reference examination as its position.'
+sub: 'HCCNet: a self-supervised 3D ConvNeXt and Transformer for longitudinal MRI'
+hook: 'Every examination is encoded; a Transformer reads the series with the time to the reference examination as its position.'
-  purpose: 'Warn earlier which cirrhosis patients will develop liver cancer, using all the MRI scans they already had during routine surveillance.'
-  plain: 'A network first learns what liver MRI looks like from unlabelled scans, then learns the order of a patient''s visits; after that it is trained on which patients later developed cancer and reads the full history of scans at once.'
+  purpose: 'Warn earlier which cirrhosis patients will develop liver cancer, using all the MRI scans they already had.'
+  plain: 'A network learns what liver MRI looks like from unlabelled scans, then reads the full history of scans at once.'
-  - { label: 'Code', value: 'TheAxeC/hccnet' }
-  - 'Each examination goes through a 3D ConvNeXt backbone; a Pre-LN Transformer with a [cls] token reads the sequence of embeddings.'
-  - 'Position is the elapsed time in years to the prediction reference examination, set from examination dates alone and never from the outcome.'
-  - 'Two-stage self-supervised pre-training: DINO on the backbone with MRI series of one contrast as augmentations, then sequence-order prediction on the Transformer.'
-  - 'Five variants (12.4M to 72.4M parameters), patient-level 5-fold CV with ten seeded models per fold, ensembled.'
+  - 'Two-stage self-supervised pre-training: DINO on the 3D ConvNeXt backbone, then sequence-order prediction on the Transformer.'
+  - 'Position set from examination dates alone, never from the outcome; five variants, patient-level 5-fold CV, ten seeded models per fold.'
-  - 'Diffusion-weighted MRI, mean over the five variants: AUPRC 0.614, AUROC 0.901; best variant HCCNet-T 0.725 $\pm$ 0.103 and 0.936 $\pm$ 0.026.'
+  - 'DW-MRI, mean over five variants: AUPRC 0.614, AUROC 0.901; best variant HCCNet-T 0.725 $\pm$ 0.103 and 0.936 $\pm$ 0.026.'
-equation: '\mathrm{PE}(\Delta t, 2k) = \sin\!\left(\frac{\Delta t}{10000^{2k/H}}\right), \quad \mathrm{PE}(\Delta t, 2k+1) = \cos\!\left(\frac{\Delta t}{10000^{2k/H}}\right)'
-panels:
-  - { figure: figure_outline.png, caption: 'The HCCNet modelling approach for one patient.', explain: 'Each raw MRI passes through the **CNN backbone**; time-based positional encodings are added to the embeddings, the **Transformer encoder** reads them, and the last hidden state of the **[cls] token** gives the prediction.' }
-title: 'Where the pre-training gain comes from, and what fusion and calibration show'
-hook: 'An ablation on HCCNet-Pico separates the two pre-training stages, a calibration analysis compares baseline and pre-trained models, and an exploratory fusion test combines modalities.'
+title: 'Where does the pre-training gain come from, and what does fusion show?'
+sub: 'HCCNet-Pico ablation, calibration and exploratory fusion'
+hook: 'An ablation separates the two pre-training stages; a calibration analysis compares the models.'
+eli5:
+  purpose: 'Find which training stage helps and how trustworthy the probabilities are.'
+  plain: 'Sequence-order pre-training adds little; no fused input beats diffusion MRI alone.'
-  - { label: 'Ablation', value: 'HCCNet-Pico, per pre-training stage' }
-  - { label: 'Ties', value: 'Differences within one SD across folds' }
+  - { label: 'Code', value: 'TheAxeC/hccnet' }
+  - { label: 'Pre-training lowers ECE', value: '56.0% DW-MRI, 37.0% contrast T1, 12.1% T1 in/out with T2' }
-  - 'Pre-train only the CNN backbone, only the Transformer encoder, both, or neither, then fine-tune identically.'
-  - 'Fuse modalities by channel concatenation: DW with contrast-enhanced T1, DW with T1 in/out-of-phase and T2, and all three.'
+  - 'Pre-training ablation on HCCNet-Pico, then identical fine-tuning.'
-  - 'DW-MRI ablation AUPRC: backbone only 0.672, both stages 0.588 (within one SD), Transformer only 0.310, none 0.308; sequence-order prediction adds little.'
-  - 'Pre-training lowers expected calibration error by 56.0% on DW-MRI, 37.0% on contrast-enhanced T1 and 12.1% on T1 in/out-of-phase with T2.'
-  - 'No fused input beats DW-MRI alone (AUPRC 0.588, AUROC 0.894); the best fusion reaches 0.587 and 0.891, all within one SD.'
-  - 'Single centre (Medisch Spectrum Twente, 2011 to 2022) and no external validation yet.'
-panels:
-  - { figure: calibration.png, caption: 'Reliability diagrams, baseline against pre-trained, for every variant and modality group.', explain: 'Accuracy per confidence bin: **blue bars** are the pre-trained and fine-tuned models, **green bars** the randomly initialized baselines, and the striped region is perfect calibration; each legend gives the ECE.' }
+  - 'DW-MRI ablation AUPRC: backbone only 0.672, both stages 0.588 (within one SD), Transformer only 0.310, none 0.308.'
+  - 'No fused input beats DW-MRI alone (AUPRC 0.588; best fusion 0.587, within one SD); single centre, no external validation yet.'
+equation: '\mathrm{PE}(\Delta t, 2k) = \sin\!\left(\frac{\Delta t}{10000^{2k/H}}\right), \quad \mathrm{PE}(\Delta t, 2k+1) = \cos\!\left(\frac{\Delta t}{10000^{2k/H}}\right)'
```

### meseret-cirrhosis

```diff
-sub: 'Competing-risks modelling of the Mayo PBC cohort: recovering the transplant outcome and cause-specific risk'
-hook: 'The 418-patient Mayo PBC cohort is widely analysed as three-class classification of its end-of-follow-up status, though it is right-censored with death and transplantation competing; recast as competing-risks survival, the transplant risk becomes recoverable.'
+sub: 'Competing-risks modelling of the Mayo PBC cohort: recovering the transplant outcome'
+hook: 'The 418-patient cohort is right-censored with death and transplantation competing; recast, the transplant risk is recoverable.'
-  purpose: 'Give patients with this liver disease a time-resolved risk of dying and of receiving a transplant, from a public dataset that many studies treat as a sorting exercise.'
-  plain: 'A patient still alive at the last visit is not a negative case, and one who got a new liver can no longer die of the old one; models that respect this track each patient''s true risk, while sorting patients into three labels loses the transplant signal.'
+  purpose: 'Give patients a time-resolved risk of dying and of receiving a transplant, from a dataset often treated as a sorting exercise.'
+  plain: 'A patient still alive at the last visit is not a negative case; models that respect this track each patient''s true risk.'
-  - { label: 'Data', value: 'Mayo PBC, 418 patients (161 deaths, 25 transplants)' }
-  - { label: 'Code', value: 'TheAxeC/cirrhosis-competing-risks' }
+  - { label: 'Data', value: 'Mayo PBC, 161 deaths, 25 transplants' }
-  - 'Simulation fitted to the cohort: cause-specific Weibull hazards for death and transplant, 200 replicates at $n$ = 418, 1000 and 4000, scored against the true 5-year cumulative incidence.'
-  - 'Cause-specific Cox, Fine-Gray and two-event DeepHit, with Aalen-Johansen cumulative incidence and competing-risks decision curves.'
-  - 'Seven survival models against the five-variable Mayo score under leakage-free repeated stratified cross-validation.'
-  - 'Status-label baseline: random forest and gradient boosting, each with and without SMOTE, scored by F1.'
+  - 'Simulation fitted to the cohort: cause-specific Weibull hazards, 200 replicates at $n$ = 418, 1000 and 4000, scored against true 5-year incidence.'
+  - 'Cause-specific Cox, Fine-Gray and DeepHit, seven survival models against the Mayo score; status-label baseline: forests and boosting, with and without SMOTE.'
-  - 'Simulation at $n$ = 418: random forests rank the true transplant risk at Spearman 0.56 (0.59 with SMOTE); multinomial logistic 0.91, cause-specific Cox 0.92, Fine-Gray 0.90.'
+  - 'Simulation at $n$ = 418: random forests rank the true transplant risk at Spearman 0.56; multinomial logistic 0.91, cause-specific Cox 0.92, Fine-Gray 0.90.'
-  - 'Transplant as a competing event: C 0.822 [0.799, 0.843] from 25 events; Fine-Gray 5-year competing-risks C 0.842 for death and 0.807 for transplant.'
-  - 'Age acts in opposite directions: cause-specific HR 1.36 per SD for death and 0.74 for transplant; subdistribution HR 1.52 and 0.32.'
-equation: 'H_k(t \mid x) = \exp\left(b_k + x^{\top}\beta_k\right) t^{\rho_k}, \quad k \in \{\mathrm{death}, \mathrm{transplant}\}'
+  - 'Transplant as a competing event: C 0.822 [0.799, 0.843]; age: cause-specific HR 1.36 per SD for death, 0.74 for transplant.'
-panels:
-  - { figure: fig_simulation.png, caption: 'Recovery of the true transplant risk in the simulation.', explain: 'Left: **Spearman correlation** between each approach''s transplant risk and the true 5-year cumulative incidence; right: **Harrell''s C** against the truth. Means and 2.5 to 97.5 percentiles over 200 replicates per training size, on a fixed test set of 5000.' }
-title: 'The static ceiling, and what updated measurements add'
-hook: 'Seven model families, deep networks included, sit at the Mayo score''s discrimination; repeated biomarker measurements on the serial cohort carry the signal a single baseline snapshot loses.'
+title: 'Where is the static ceiling, and what do updated measurements add?'
+sub: 'Discrimination ceiling, landmark analysis and external transport'
+hook: 'Seven model families sit at the Mayo score''s discrimination.'
+eli5:
+  purpose: 'Do complex models or repeated measurements help?'
+  plain: 'No model exceeds the simple score.'
-  - { label: 'Serial cohort', value: '312 patients, 1945 measurements' }
-  - { label: 'External', value: 'SUPPORT cirrhosis subgroup, 508 patients' }
+  - { label: 'SUPPORT transport', value: 'C 0.823 internal, 0.558 external' }
+  - { label: 'Latest over baseline', value: '$\Delta$C +0.139 [+0.116, +0.162]' }
+method:
+  - 'Landmark analysis on 312 patients, 1945 measurements.'
-  - 'Harrell''s C 0.806 to 0.833 across seven models; none exceeds the Mayo score (0.833, integrated Brier 0.143), and Cox and Fine-Gray match its net benefit for 5-year death.'
-  - 'Baseline death-risk concordance falls from 0.87 to 0.64 over six years; the latest measurement holds 0.89 to 0.78, $\Delta$C +0.139 [+0.116, +0.162] at 6 years.'
-  - 'On three single-event datasets complexity gains are consistent with a sample-size pattern: +0.008 on METABRIC ($n$ = 1904), +0.014 on GBSG ($n$ = 2232), up to +0.046 on SUPPORT ($n$ = 8873).'
-  - 'The PBC model does not transport to acutely ill SUPPORT patients (C 0.823 internal, 0.558 external); transplant rests on 25 events and prothrombin violates proportional hazards ($p$ = 0.002).'
-panels:
-  - { figure: meseret_landmark.png, caption: 'Landmark analysis on the serial cohort.', explain: 'Three-year death-risk discrimination at each landmark: the **baseline measurement** decays as it ages, the **most recent measurement** restores it, and the advantage widens with follow-up.' }
+  - 'Harrell''s C 0.806 to 0.833 across seven models; Mayo score 0.833, integrated Brier 0.143.'
+  - 'Baseline concordance falls from 0.87 to 0.64 over six years; the latest holds 0.89 to 0.78.'
+  - 'No transport to SUPPORT patients; transplant rests on 25 events.'
+equation: 'H_k(t \mid x) = \exp\left(b_k + x^{\top}\beta_k\right) t^{\rho_k}, \quad k \in \{\mathrm{death}, \mathrm{transplant}\}'
```

### raw-pls

```diff
-title: 'RAW-PLS: tensor-PLS for tumours that sit in a different place in every patient'
+title: 'RAW-PLS: tensor-PLS for tumours in a different place in every patient'
-hook: 'Each lesion is transported onto one learnable cross-subject template by fused Gromov-Wasserstein, so no voxel has to match across patients.'
+hook: 'Each lesion is transported onto one learnable cross-subject template by fused Gromov-Wasserstein, no voxel matched.'
-  plain: 'Treat each tumour as a loose cloud of voxels, softly match the cloud to a shared learned set of atoms, and predict from how the voxels land on them.'
-equation: 'T_\varepsilon(\mu,\Theta)=\arg\min_{T\in U(a,b)}(1-\alpha)\langle M,T\rangle+\alpha\sum_{i,i'',k,l}\big(C_{ii''}-C^{\mathrm{ref}}_{kl}\big)^2T_{ik}T_{i''l}-\varepsilon H(T)'
+  plain: 'Treat each tumour as a loose cloud of voxels, softly match it to a shared set of atoms, and predict from how voxels land on them.'
-  - { label: 'Template', value: 'K=16 atoms, S=5 x J=25 unrolled Sinkhorn' }
-  - 'Up to 4000 tumour voxels per lesion, four channels each, centred per case and never registered.'
-  - 'Barycentric projection gives atom masses and mean features; a rank-6 geometry readout adds how the atoms are arranged.'
-  - 'A PLS-covariance term trains template, transport and head jointly; the unrolled transport is the estimand.'
+  - 'Up to 4000 tumour voxels per lesion, four channels, never registered; $K=16$ atoms, $S=5 \times J=25$ unrolled Sinkhorn.'
+  - 'Barycentric projection and a rank-6 geometry readout; a PLS-covariance term trains template, transport and head jointly.'
-  - 'Grade AUC 0.935 against 0.834: margin +0.101, p = 7.6e-10; AUPRC 0.975 against a 0.793 prevalence.'
-  - 'DeepSets (-0.337, 0.890) and a Set Transformer (-0.007, 0.734) lose on both targets.'
+  - 'Grade AUC 0.935 against 0.834: margin +0.101, p = 7.6e-10; DeepSets (-0.337, 0.890) and a Set Transformer (-0.007, 0.734) lose on both.'
-panels:
-  - { figure: fig2_results.png, caption: 'Synthetic warp, both BraTS targets, and the ablation', explain: 'Under warp only RAW-PLS stays flat near 0.67; it is the only positive method on the structural target and the best on grade.' }
-title: 'What holds against registration, and what did not hold'
-hook: 'A lesion-cropped registered radiomics baseline is far stronger than the whole-brain grid, and RAW-PLS still beats it in all four settings.'
-panels:
-  - { figure: synthetic_upgrades.png, caption: 'Ablations and the invariance test', explain: 'Both necessity margins stay positive in all seven synthetic regimes; an isometry changes the representation by 4.2e-16 against 1.40 for the grid.' }
+title: 'What holds against registration, and what did not hold?'
+sub: 'Radiomics baseline, real warps and dead targets'
+hook: 'RAW-PLS beats a lesion-cropped registered radiomics baseline in all four settings.'
+tag: { class: mixed, text: 'Registration and dead targets' }
+eli5:
+  purpose: 'A stronger registered baseline, and the targets that fail.'
+  plain: 'Two clinical targets stay near chance or below.'
+specs:
+  - { label: 'Real warps', value: '120 lesions, 3% at $\eta$ = 0.427' }
+  - { label: 'Dead targets', value: 'MGMT AUC 0.50 against 0.53, survival -0.087 against -0.049' }
+method:
+  - 'Lesion-cropped radiomics, registered affine and SyN.'
-  - 'Radiomics margins: structural +0.030 (affine) and +0.053 (SyN), grade +0.039 and +0.012, all p < 0.05; most of the grid''s deficit was rasterization.'
-  - 'Real non-isometric warps on 120 lesions move the representation 3% at $\eta$ = 0.427.'
-  - 'Dead targets: MGMT is near chance for every method (AUC 0.50 against 0.53) and survival is negative for both (-0.087 against -0.049).'
-  - 'Not shown empirically: the $\sqrt{N}$ rate stayed flat in three attempts and remains a theorem; four external datasets gave no clean win over radiomics.'
+  - 'Radiomics margins, affine and SyN: structural +0.030, +0.053; grade +0.039, +0.012; all p < 0.05.'
+  - '$\sqrt{N}$ rate: a theorem, flat in three attempts; no clean radiomics win on four external datasets.'
+equation: 'T_\varepsilon(\mu,\Theta)=\arg\min_{T\in U(a,b)}(1-\alpha)\langle M,T\rangle+\alpha\sum_{i,i'',k,l}\big(C_{ii''}-C^{\mathrm{ref}}_{kl}\big)^2T_{ik}T_{i''l}-\varepsilon H(T)'
+headline: 'Margins hold over registered radiomics; MGMT and survival are dead targets'
```

### ward-bttr-crosssubject

```diff
-sub: 'Behavior-supervised alignment for cross-subject neural decoding across non-corresponding electrode grids'
-hook: 'Every ECoG implant places a different grid over different cortex, so two patients share no channel and no geometry; each grid is projected onto axes defined by finger movement, and one shared decoder reads those axes for every patient.'
+sub: 'Behavior-supervised alignment for cross-subject decoding across non-corresponding electrode grids'
+hook: 'Each grid is projected onto axes defined by finger movement, and one shared decoder reads those axes for every patient.'
-  purpose: 'Let a brain-computer interface that decodes finger movements start working in a new patient after a few minutes, by reusing what it learned from earlier patients.'
-  plain: 'For each patient, the electrodes are summarized by how strongly they follow each finger; those summaries mean the same thing in every brain, so one decoder trained on earlier patients can read a new one after a short calibration.'
+  purpose: 'Let a finger-decoding brain-computer interface start in a new patient after minutes, reusing what it learned from others.'
+  plain: 'Electrodes are summarized by how strongly they follow each finger; those summaries mean the same thing in every brain.'
-  - { label: 'Data', value: 'Stanford fingerflex ECoG, leave-one-subject-out' }
-  - { label: 'Code', value: 'TheAxeC/behavior-aligned-ecog-transfer' }
+  - { label: 'Data', value: 'Stanford fingerflex ECoG' }
-  - 'Per finger, the first filter is the correlation of each electrode''s high-gamma envelope with that finger''s flexion; three more filters span the finger-driven subspace, giving $D=20$ shared components.'
-  - 'A dilated causal TCN, trained on the pooled source patients, reads the 20 components across 24 bands from 2 to 300 Hz.'
-  - 'The target alignment always uses labelled target movement; minimal calibration also fine-tunes the decoder, and frozen-decoder does not.'
+  - 'Per finger, filters from each electrode''s high-gamma correlation with flexion give $D=20$ shared components; a dilated causal TCN reads them across 24 bands.'
+  - 'Leave-one-subject-out; minimal calibration fine-tunes the decoder on labelled target movement, frozen-decoder does not.'
-  - 'Under the CORTEG foundation model''s own protocol on nine patients: 0.530 (SD 0.157) against its published 0.554, one accuracy band; ridge on the rebuilt inputs 0.380 against its 0.336.'
-  - 'Calibration reaches that band at about four to five minutes, 80 to 90% of the 5.6-minute calibration set; CORTEG reports ten to thirty minutes under another protocol.'
+  - 'Under CORTEG''s own protocol on nine patients: 0.530 (SD 0.157) against its published 0.554; calibration reaches that band at about four to five minutes.'
-equation: 'f_i = g \circ \varphi_i, \qquad \varphi_i(X_i) = W_i \, \Phi(X_i)'
-panels:
-  - { figure: pipeline_flowchart.png, caption: 'The pipeline from raw recordings to predicted trajectories.', explain: 'Grids enter as **24-band envelope features**; a private **behavior-aligned filter** projects each grid onto the shared finger-motor space; one **shared TCN decoder** outputs the trajectories. Target labels estimate the target filter in both regimes and update the decoder only under minimal calibration.' }
-title: 'The alignment carries the transfer, and where it stops'
-hook: 'A same-protocol ablation changes only the correspondence scheme or the alignment head, and an independent cursor-tracking cohort repeats the test with a different behavior and different grids.'
+title: 'Does the alignment carry the transfer, and where does it stop?'
+sub: 'Same-protocol ablation, cursor-tracking replication and dead ends'
+hook: 'A same-protocol ablation changes only the correspondence scheme or the alignment head.'
+eli5:
+  purpose: 'Test whether the alignment is what makes the transfer work.'
+  plain: 'Permuting or replacing the alignment lowers the transfer.'
-  - { label: 'Ablation', value: 'Decoder, features and seeds held fixed' }
-  - { label: 'Replication', value: '4 cursor-tracking patients, none in fingerflex' }
+  - { label: 'Cursor cohort, n = 4', value: '76.7% of within-subject ceiling aligned, 7.9% without' }
-  - 'Compared: behavior-aligned axes, permuted axes, the first 43 channels, Euclidean Alignment and an anatomical grid; then fixed, learned linear, nonlinear and random-init alignment heads.'
-  - 'Dead ends: block-term tensor decoders underfit across patients (ridge 0.354 against BTTR 0.156 on identical features); AJILE12 decodes near zero within subject, and on scalp EEG the alignment adds nothing (0.402 against 0.411 permuted).'
+  - 'Frozen-decoder ablation; a cursor-tracking cohort repeats the test.'
-  - 'Frozen-decoder $r$: behavior-aligned 0.371, axes permuted 0.162, first 43 channels 0.042, with Euclidean Alignment 0.037, anatomical grid 0.071 (behavior against Euclidean $p$ = 0.016).'
-  - 'A random-init head of the same capacity falls to 0.319 with calibration; a nonlinear behavior-supervised head lifts frozen-decoder transfer from 0.353 to 0.517 (7 of 7).'
-  - 'Cursor cohort: frozen-decoder transfer recovers 76.7% of the within-subject ceiling aligned and 7.9% without, against 72.1% and 8.2% on fingerflex; $n$ = 4, no significance claim, one patient goes the other way.'
-  - 'Needs electrodes over the driven cortex and producible movement: 6 of 12 clinical-monitoring patients met the coverage condition.'
-panels:
-  - { figure: finger_spatial_maps.png, caption: 'The rank-1 forward map of each finger on the cortex.', explain: 'Each map is the per-electrode correlation with one finger, a **forward pattern**; the maps localize over **sensorimotor cortex** in a gross finger order. Only these rank-1 axes are read as anatomy, never the other filters or the decoder.' }
+  - 'Frozen-decoder $r$: behavior-aligned 0.371, permuted 0.162, first 43 channels 0.042, Euclidean Alignment 0.037, anatomical 0.071 ($p$ = 0.016).'
+  - 'Cursor cohort: no significance claim, one patient goes the other way.'
+  - 'Dead ends: block-term decoders underfit across patients; AJILE12 decodes near zero; on scalp EEG the alignment adds nothing.'
+equation: 'f_i = g \circ \varphi_i, \qquad \varphi_i(X_i) = W_i \, \Phi(X_i)'
```

