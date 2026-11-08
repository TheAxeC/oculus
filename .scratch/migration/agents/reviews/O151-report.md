# O151 report, a deck for every research project and the facts strip

NOT done: verify item 1. `npm run test:quick` printed "test:quick: 65.2 s; failed: vitest checks": one test, `tests/checks/tree/size.test.ts` "a folder over ten items > counts a copy that is no git checkout by the files it holds", fails because `TMPDIR` must now point at `.agents/scratch/` inside the oculus worktree, which is a git checkout, so the test's copy is no longer outside one. The same file run alone with `GIT_CEILING_DIRECTORIES` set to that folder passes 10 of 10. This check cannot pass with a temporary folder inside either worktree, and it is handed back for that reason. Everything else in the brief is done; C9 is the orchestrator's.

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

All runs below were made after the last deck edit, from the oculus worktree, with `TMPDIR=/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151/.agents/scratch`.

| Item | State | Check and its output as printed |
|---|---|---|
| 1. A deck for every one of the 95 research projects, from the project's own sources | DONE | `node c5.mjs <hub worktree> research.txt`: "folders with present.yml: 95 of 95"; `grep -c -E 'DECK FAULTS/NO present/does not parse/REQUIRED KEYS ABSENT/SHAPE:/FIRST SLIDE NOT/CONTROL CHARACTER/SLIDE COUNT OUT' c5.txt` (the bars written as slashes here): 0. `diff -rq` per folder against the hub base copy (`sh diffrq.sh research.txt`): 95 folders, 0 "Only in base", 70 new decks (70 `main.md` and 70 `present.yml` only in the worktree), 25 replaced (25 `main.md` and 25 `present.yml` differ). Covert pair: see C4 under per deck. Hub `git status --short`: 132 lines (50 ` M`, 82 `??`), every path inside one of the 95 `present/` folders (`comm -23` of the status folders against the 95: empty). |
| 2. Every slide right | DONE except the measured fit, which is C9, the orchestrator's | Slide counts from `c5.txt`: 45 decks of 1 slide, 50 of 2; second slides 33 `columns` and 17 `project`; `grep -c 'kind equation' c5.txt`: 0. `node fit.mjs <hub worktree> research.txt`: "slides: 145; slides over a fit rule: 0; slides with an equation key: 43". C6 (below): the deck, equation and portfolio rows pass with the floor `REAL_FLOORS = { decks: 14, equations: 13 }` (`integrity.test.ts:46`). `node c10.mjs`: "lines repeated across decks: 53", each listed below with the fact it states. Hub ASCII gate (the brief's command): only accented letters in names, five lines (St<e acute>phanie in linfoot `main.md:11`; Link<o diaeresis>ping in modality-dropping-btf `main.md:10` and hccnet-fl-sweden `main.md:4`, `:11`, `:19`). `node prose.mjs`: "hits: 20", each read: the 13 "spaced hyphen" hits are minus signs inside `equation` values or inline math (for example loewner `v - \eta`, linfoot `\sqrt{1 - e^{-2I(X;Y)}}`), and the 7 "first letter" hits, in 4 decks, are sentences that begin with a method name written lower-case first (eBTTR, eLORETA, mPSTD, gBTTR); no "no full stop", "double hyphen" or "filler word" hit. Every figure 23 of 23 `identical` (`sh figcmp.sh`). |
| 3. The facts strip drawn below the slide's text | DONE | Read: `slide.css:27-30` declare `--slide-design-facts: 12px`, `--slide-design-facts-label: 10px` and `--slide-fs-facts`, `--slide-fs-facts-label` as each times `--text-scale` without the slide's fit factor; `:78-79` give 11px and 9px under `body.rice .slide-frame`; `Facts.svelte:162` `--dot-size: 0.75em`, the value and label `font-size` from the two new sizes, `--fact-label` gone (`git diff df5a42a49 -- Facts.svelte`). `git diff -U0` of `Slide.svelte`: one hunk, `@@ -33,10 +33,10 @@`. C8 below. Oculus ASCII gate over the three files: prints nothing (grep exit 1). |
| Verify 1: `npm run diagrams`, then `npm run test:quick` | NOT DONE | `npm run diagrams`: exit 0, wrote no changed file (`git status --short` shows no `docs/diagrams` path). `npm run test:quick`: "ok prettier", "ok ASCII gate", "ok svelte-kit sync", "ok eslint", "ok svelte-check (10.2 s): ... 0 ERRORS 0 WARNINGS", "FAILED vitest checks (62.5 s)", "Tests 1 failed / 77 passed (78)", "test:quick: 65.2 s; failed: vitest checks". The failure: `tests/checks/tree/size.test.ts:198`, expected `{ out: 'src/lib holds 11 items, over the ten a folder may hold\n', status: 1 }`, received `{ out: '', status: 0 }`. Cause, read from the code: the test's copy is made under `tmpdir()` (`tests/fixtures/scratch.ts:25-30`) without `git init` (`size.test.ts:145-157`, `git = false`), and `utils/folder-check.sh:16-17` counts through `git ls-files` when `git rev-parse --is-inside-work-tree` succeeds; with `TMPDIR` inside the oculus worktree it succeeds, and the copy sits in the ignored `.agents/` folder, so nothing is counted. `npx vitest run tests/checks/tree/size.test.ts` alone: "Tests 1 failed / 9 passed (10)"; the same with `GIT_CEILING_DIRECTORIES=<scratch folder>`: "Tests 10 passed (10)". This step changes neither file. |
| Verify 2: ASCII gates | DONE | As in rows 2 and 3. |
| Verify 3: unused exports | DONE | `sh utils/unused-exports.sh` (333 lines) against `O151-base/unused-exports.txt`: `diff` prints nothing, exit 0. |
| Verify 4: paths | DONE, with four paths that are not this step's | `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O151.md df5a42a49` printed `.scratch/migration/agents/briefs/O151-cases.md`, `.scratch/migration/agents/briefs/O151.md`, `.scratch/migration/agents/guarded.md`, `.scratch/migration/agents/spec.md`. None was written by this builder: every Write and Edit call of this step's transcript targets only `O151-report.md`, `slide.css`, `Slide.svelte`, `Facts.svelte` in the oculus worktree and the 190 `present/main.md` and `present/present.yml` files in the hub worktree (read from the transcript's tool calls). Hub `git status` and `diff -rq`: row 1. |
| Verify 5: C5, C6, C10 with sources and output | DONE | Outputs below and in the appendix; sources in the appendix. C6 after the last change: `OCULUS_TEST_HUB=<hub worktree> TMPDIR=<scratch> npx vitest run tests/checks/config/integrity.test.ts -t "deck\|equation\|portfolio" --reporter=verbose`: "Tests 7 passed \| 7 skipped (14)"; real hub: "reads a deck out of every project that has a present/ folder, with no finding 2722ms", "reads an equation out of every slide that writes one, as LaTeX that typesets 1048ms", "reads the portfolio deck with every named deck found 211ms"; load averages before 14.11 9.39 7.60, after 12.17 9.19 7.56. A run just before it, without the verbose reporter: "Tests 7 passed \| 7 skipped (14)", load 14.80 8.55 7.21 before and 15.34 9.38 7.56 after. |
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
- Manuscript root: `admin/conference/main_work.tex`. The manifest's title (`project.yml:10`), DOI (`:19`) and venue (`:18`, `:23`) name the FLTA 2025 paper; this file carries that title (`:32`) and its numbers match the IEEE-certified PDF. `manuscript/` holds the arXiv preprint, which `project.yml:15` calls the extended version; its heart-disease and TCGA numbers match the root (checked with `pdftotext` and `grep` on 0.872, 0.874, 0.812, 0.775, 0.609).
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
- Body headings that name a kind of column: "### Limits" (7: connectivity-iris, hcc-modality-poster, hccnet-fl, algebraic-effects-compilation, http2-best-practices, http2-web-performance, ecog-frequency-features), "### Limits and dead ends" (2: ecg-readable-substrate, fed-multicellular-immune), "### Open" (2: masters-algebraic-subtyping, masters-eeg-infotheory).
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
