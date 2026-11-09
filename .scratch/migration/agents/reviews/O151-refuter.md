# Step O151 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151 and /Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O151, base df5a42a49 (oculus) and 59095642f (hub))

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ pgrep -fl "vitest|svelte-check"
(nothing; exit 1)

# Verify 1, from the oculus worktree root, TMPDIR and GIT_CEILING_DIRECTORIES unset
$ env -u TMPDIR -u GIT_CEILING_DIRECTORIES npm run diagrams
(regenerated docs/diagrams/*; git status --short unchanged afterwards, no docs/diagrams path listed)
$ env -u TMPDIR -u GIT_CEILING_DIRECTORIES npm run test:quick -- --base df5a42a49
test:quick: 8 changed file(s), from git since df5a42a49
9 test file(s)
ok prettier (1.0 s): All matched files use Prettier code style!
ok ASCII gate (1.1 s)
ok svelte-kit sync (2.6 s)
ok eslint (2.4 s)
ok svelte-check (9.5 s): 1794101588034 COMPLETED 589 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok vitest checks (45.2 s): Duration 34.04s ...
test:quick: 47.9 s; every command passed

# Verify 2
$ perl -ne 'print "$ARGV:$.: $_" if /[^\x09\x0a\x20-\x7e]/; close ARGV if eof' src/lib/themes/slide.css src/lib/views/academic/present/parts/project/Facts.svelte src/lib/views/academic/present/Slide.svelte
exit=0 (nothing printed)
$ cd <hub worktree> && find projects -path '*/present/*' \( -name '*.md' -o -name '*.yml' \) -print0 | xargs -0 env LC_ALL=C grep -n '[^ -~]'
projects/active/linfoot-estimator/present/main.md:11:  - { label: 'Lead', value: 'St<e acute>phanie van den Berg; Axel Faes coauthor' }
projects/ideas/modality-dropping-btf/present/main.md:10:  - { label: 'Data', value: 'real Twente (NL) and Link<o diaeresis>ping (SE) HCC federation' }
projects/ideas/hccnet-fl-sweden/present/main.md:4:sub: 'HCCNet federated between Twente (NL) and Link<o diaeresis>ping (SE), where sites hold different MRI sequ...
projects/ideas/hccnet-fl-sweden/present/main.md:11:  - { label: 'Partner', value: 'Link<o diaeresis>ping University Hospital, cohort to confirm' }
projects/ideas/hccnet-fl-sweden/present/main.md:19:  - 'Nothing has run; the Link<o diaeresis>ping data-use, ethics and GDPR agreement is the critical path.'

# Verify 3
$ sh utils/unused-exports.sh | diff - .agents/worktrees/O151-base/unused-exports.txt
exit=0 (nothing printed)

# Verify 4
$ node utils/outside-paths.mjs .scratch/migration/agents/briefs/O151.md df5a42a49
.scratch/migration/agents/briefs/O151-cases.md
.scratch/migration/agents/briefs/O151.md
.scratch/migration/agents/guarded.md
.scratch/migration/agents/spec.md
$ for f in <those four>; do diff -q $f /Users/axelfaes/workspace/oculus/$f && echo "same $f"; done
same .scratch/migration/agents/briefs/O151-cases.md
same .scratch/migration/agents/briefs/O151.md
same .scratch/migration/agents/guarded.md
same .scratch/migration/agents/spec.md
$ git status --short   (oculus worktree)
 M .scratch/migration/agents/briefs/O151.md
 M .scratch/migration/agents/guarded.md
 M .scratch/migration/agents/spec.md
 M src/lib/themes/slide.css
 M src/lib/views/academic/present/Slide.svelte
 M src/lib/views/academic/present/parts/project/Facts.svelte
?? .scratch/migration/agents/briefs/O151-cases.md
?? .scratch/migration/agents/reviews/O151-report.md
$ git status --short | wc -l; grep -c '^ M'; grep -c '^??'; grep -v '/present/'   (hub worktree)
     132
50
82
(the last prints nothing)
$ diff -rq <each of the 95 present folders> <O151-hub-base copy>
23 images only in the worktree, none only in the base; every other difference is main.md / present.yml
$ cmp -s <source> <target> for each of the 23 copies the report lists (report lines 1104-1126)
same (23 of 23), including manuscripts/ward-bttr-crosssubject/present/pipeline_flowchart.png = manuscript/figures/method_overview.png
$ cmp present/method_overview.png present/pipeline_flowchart.png   (ward)
method_overview.png pipeline_flowchart.png differ: char 19, line 3

# C5, own one-liner (node -e with the worktree's yaml package; parses every slide's front matter)
folders 95 slides-per-deck {"1":45,"2":50} kinds {"0:project":95,"1:columns":33,"1:project":17} equations 43 ctrl 0
findings none
(checks: present.yml has deck.title and order ["main.md"]; every slide titled; first slide project with title, hook, eli5.purpose, eli5.plain, method, results, headline; method/results arrays of at most 4; specs at most 4 with label and value; panels at most 1 and the figure on disk; tag.class in measured/design/proof/mixed; no control character)

# C6, oculus worktree root, TMPDIR at the system default
$ OCULUS_TEST_HUB=/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O151 npx vitest run tests/checks/config/integrity.test.ts -t "deck|equation|portfolio" --reporter=verbose
Tests 7 passed | 7 skipped (14)
deck row 2654ms, equation row 980ms, portfolio row 216ms; load average 5.36 6.42 6.90 before, 5.74 6.45 6.91 after
(both trees' git status unchanged after the run: 132 and 8 lines)

# C10, own one-liner (lines over 30 characters found in more than one deck)
28 Stage published | 9 Stage nascent, gate pending | 3 Stage stopped | 3 Stage failed | 3 Stage accepted
3 Authors E. Calvo Merino, A. Faes, M.M. Van Hulle | 3 Authors A. Faes, M. Amir Haeri
2 each: Venue Medical Image Analysis or IEEE TMI; Venue ICFP 2017 Student Research Competition; Venue Comput. Biol. Med., under review; Stage scoping, gate pending; Stage nascent, speculative; Stage nascent, exploring; Stage de-risking; Stage de-risking, gate pending; Authors A. Faes; Authors A. Faes, M.M.J. Guichelaar, D.E. Bouman, S.M. van den Berg, M. Amir Haeri; Authors A. Faes, M. Fahimi Hnazaee, M. Van Hulle; tag Measured (phd-thesis, ms-lipid-handshake); the FedAvg equation (fermat, fbttr-strategies); title "Towards a Core Language with Row-Based Effects for Optimised Compilation" (icfp-src-abstract, icfp-src-poster); title "High-gamma band event detection ..." (highgamma-event-detection, modulation-lmp-bci); title "Causal Graphical Modelling of Functional Connectivity from Reconstructed EEG Sources" (connectivity-motor-imagery, abstract-bci-meeting-2021)
(matches the report's C10 list, report lines 1132-1141)

# C4
$ grep -n -i -e covert -e '\bPCD\b' -e 'coupled descent' <each covert deck's main.md and present.yml>
== projects/manuscripts/covert-theory/present
present.yml:2:  title: 'Private Coupled Descent'
main.md:3:title: 'Private Coupled Descent: privacy that does not pay for feature dimension'
== projects/manuscripts/covert-applied/present
present.yml:2:  title: 'COVERT'
main.md:3:title: 'COVERT: block-term regression across parties that hold different modalities of the same patients'
main.md:45:- Naive concatenation ties COVERT on MIMIC (0.745, p = 0.31).

# Scratchpad writes after the 719 correction
correction delivered to the builder as a queued_command at 2026-11-08T00:59:11Z (01:59:11 CET), transcript agent-a69da2be8a76365d5.jsonl line 4329
$ find <session scratchpad> -maxdepth 1 -newermt '2026-11-08 01:59:11', each name grepped in the builder transcript
o167-r1-append.md 0, o167-now.txt 0, o167-r1-refute.md 0, o151-md.txt 0, o151-batch1..5.txt 0, o151-hub-files.txt 0, look-8797.log 9 (ls matches only; modified 02:48, after the builder's last line at 02:26)
the builder's own files there (c5.mjs, c10.mjs 23:39; fit.mjs 01:47; prose.mjs 01:49; diffrq.sh, figcmp.sh 01:51; c5-final.txt, c10-final.txt 01:52; diffrq-compact.txt 01:54) all predate the correction
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: violated, Spec 1 (serial-ecg-af compares with BTTN's result) and Spec 2 (fed-faithful-ecg takes numbers from a results file outside item 1's sources). Spec 3 (xsub-ecog-framework) is a clash inside ruling 1 for the orchestrator. Every other deck I read keeps to Reading B; the covert pair holds (C4).
- 2: violated, Spec 4 (slides carry the builder's own critique of a paper as framing in abduction, go-bttr, fbttr-strategies and fermat). Counts, shapes, titles, the equation floor, figures and repeats hold (C5, C6, C10, the cmp run).
- 3: holds. `slide.css` declares `--slide-design-facts: 12px` and `--slide-design-facts-label: 10px` with the `--slide-fs-facts*` calcs times `--text-scale` only, `body.rice .slide-frame` gives 11px and 9px, and `Facts.svelte` sets `.facts` and `.label` from them with `--dot-size: 0.75em` (9px at 12px). Every `Slide.svelte` user (Framed via Stage, `routes/present/show` via Stage, `routes/present/print` with `class="slide-frame page"`) draws inside a `.slide-frame`, so the properties resolve wherever the strip is drawn.

Cases of the brief's "Cases":

- C1: met. The deck follows `clinical-ai-eval-artifacts/README.md` and `project.yml`: the three studies, the protocol, the benchmark target, the co-authorship framing and the venue. Its only numbers are "three" and "at least one", both from `README.md` "Data" and "Method".
- C2: met. The phd-thesis deck comes from the thesis and the manifest. 1.05 rounds the 1.0459 of `chapter-2.tex:168`, and the sign-language pilot is in `conclusion.tex:42` and chapter 6.
- C3: met. ms-lipid-handshake's headline is "Disproved: slope -0.06, p = 0.73 on 632k nuclei". algebraic-subtyping says "Stopped before a standalone paper", as its manifest's `outcome:` gives it. raw-pls slide 2 carries the dead targets of `CLAUDE.md:11` at `main.md:40` ("Dead targets: MGMT is near chance ... survival is negative ...") and the empirical-consistency drop at `:41`.
- C4: met. Grep output above: covert-theory's deck has no "COVERT". Its instance spec "vertical sparse block-term tensor regression" is its own README:3 wording and does not describe the applied paper. covert-applied names only itself, and its HCCNet-FL comparison is gone.
- C5: met. My one-liner gives 95 folders, 45 one-slide and 50 two-slide decks, every first slide a project slide, and no findings.
- C6: met. 7 passed, 7 skipped, with the system TMPDIR; times and load are above.
- C7: partial. Spec 2: the FedProx numbers trace to a file outside item 1's sources. Proof 2: the fermat trace claims an agreement that does not hold for the local-client rows.
- C8: met by reading. 12 and 10 times 1, 1.5, 0.7 and 1.6 give 12/10, 18/15, 8.4/7 and 19.2/16. Under rice the values are 11 and 9 (12x12/13 = 11.08, 10x12/13 = 9.23). The dot is 0.75em of 12px = 9px at the design size, 8.25px under rice (ruling 3).
- C9: not verifiable. It is settled by the orchestrator's measured fit: every deck of the hub worktree drawn on a scratch server running the oculus worktree's code, listing each "Slide too tall".
- C10: met. Every repeated line is a manifest fact true of both decks (Stage, Authors, Venue, a shared title), the one-word tag "Measured", or the FedAvg step each paper states in its own algorithm (fermat `admin/conference/main_work.tex:199`, fbttr-strategies `:213`). None is another project's model written as the deck's own (ruling 4).

## 1. Spec

- Spec 1. `projects/ideas/serial-ecg-af/present/main.md:12`, slide 1 specs: "{ label: 'Single-ECG bar', value: 'BTTN 0.762 (provisional), Raghunath 0.85 at 1 yr' }".
  - What is wrong: ruling 1 (O151-cases.md) bars "comparison with a sibling paper or another project's result". The chip sets this idea against BTTN's AUROC, another project's result, taken from this project's `README.md:3`. Naming BTTN as the model the project keeps (method line 15) is allowed by the "builds on" clause; quoting its number as the bar is not. The number is also stale against BTTN's own deck and manuscript, which give ECG-only 0.747 and fused 0.778 (`manuscripts/bttn-incident-af/present/main.md:21`).
  - Failure scenario: a reader sees a single-ECG bar of 0.762 that no current BTTN source gives, beside an internal comparison the ruling removes.
  - Verdict: item 1 violated at this deck.
- Spec 2. `projects/archive/failed/fed-faithful-ecg/present/main.md:18` and `:22`: "Arms: centralized, FedAvg, aligned averaging (FedMA-style slot matching) and FedProx." and "Aligned averaging recovered nothing (0.834, 0.107, 0.341); FedProx 0.788, 0.119, 0.613."
  - What is wrong: item 1 allows the README and "a file the README or the project's CLAUDE.md names as holding the results". The FedProx triple comes from `code/results/fed_faithfulness/summary.md:11` ("fedprox 0.788 0.1189 0.663 0.613"). Neither `README.md` nor `CLAUDE.md` names that file: both name only `code/results/pilot_mechanism/summary.md` (CLAUDE.md:6, README.md:33).
  - `README.md:5` gives the real-run result without FedProx (centralized, fedavg, aligned), and `README.md:72` lists FedProx as a benchmark still to run. The builder also read `code/README.md`, outside item 1's list. The report admits that FedProx appears only in the results file.
  - Failure scenario: the deck presents FedProx as a run arm with numbers that the project's private record does not state as its result.
  - Verdict: item 1 violated at this deck; C7 partial.
- Spec 3. `projects/ideas/xsub-ecog-framework/present/main.md:5` and `:23`: hook "... a behavior-aligned spatial filter with a shared decoder is a candidate general framework, shown so far on one finger-flexion task." and headline "Idea: one task so far; does it generalize?"
  - What is wrong: the method and its "one task so far" status are ward-bttr-crosssubject's paper-1 result. That project's manifest has `lead: [ward]`, `supervisors: [axel-faes]`, so it is a student project. This deck's manifest names it as what the idea extends (`project.yml:9` `related: [ward-bttr-crosssubject]`, `:12` "Generalizes the ward paper-1 transfer method").
  - Ruling 1's "extends" clause permits naming it as the sources state it. The same ruling, and the hub rule "Never frame Axel's research via his students' (lower-tier) projects", bar framing through a student project. The deck takes neither path: it states the student's method as this project's mechanism and its evidence as this project's status, without naming its origin.
  - Failure scenario: a reader takes the mechanism as Axel's own and the single-task evidence as this idea's. Or, read the other way, the hook and headline frame the idea through a student's result.
  - Verdict: a clash between two clauses of ruling 1 for the orchestrator to rule. Not counted against the builder.
- Spec 4. Builder critique presented as the project's framing (item 2: "Every framing is the project's current one, from the same sources"). None of these projects has a README, and none of these lines restates a statement of its manuscript or manifest. Each is the builder's own reading of a table or figure against the text:
  - `archive/published/2026/abduction/present/main.md:32-38`, slide 2. Title "What the abduction decoding shows, and where it is weak". Hook "the paper puts this down to the glove lacking a thumb abduction sensor, while its own sensor figure lists a thumb-index abduction sensor". Explain "The plot legend names the index-middle pair; the manuscript caption names the thumb-index pair ...". Results "The text reports eBTTR significantly ahead of every method on every pair; the table leaves 12 of the 40 baseline cells unmarked ..." and "... the paper reads this as on par."
  - `archive/published/2025/go-bttr/present/main.md:39`: "In the Utrecht table, subjects 2, 4 and 5 carry identical values for every finger and method; only subject 3 differs." The table at `manuscript/main.tex:226-247` does show identical columns.
  - `archive/published/2025/fbttr-strategies/present/main.md:35`, explain: "The manuscript reads the colour as Pearson correlation; its colour bar runs past -5 and up to 20."
  - `archive/published/2025/fbttr-strategies/present/main.md:39`: "The rows labelled centralized BTTR in the strategy tables carry the eBTTR numbers of the main tables."
  - `archive/published/2025/fermat/present/main.md:47-48`: "The text calls FBTTR's lead over FedAdagrad and FedProx non-significant; the table marks FedAvg and FedProx as significant." and "The ECoG case does not say how the recordings were split into clients."
  - `archive/stopped/connectivity-motor-imagery/present/main.md:22`: "... come back within 0.07 of the truth." The figure is the builder's arithmetic over `main.tex:139-141` and `:154-156`, where the manuscript says only "can accurately estimate" (`:149`). The arithmetic is right (largest gap 0.77 against 0.7).
  - What is wrong: these are an audit of the papers, written as slide content. The decks of these published projects present the builder's critique, a framing their sources do not give. They are distinct from a project's own recorded defects, such as glassbox's 0.160 against 0.159, which is in its `README.md:105` and `project.yml:32`, and linfoot's 17 bins, in `README.md:114`.
  - Failure scenario: a reader of the internal deck takes the critique as the project's recorded position, for example that the abduction paper misreports its own glove.
  - Verdict: item 2 violated at these slides.
- Spec 5. Programs not approved by the brief. The brief allows "No script ... other than the case-run programs the rules file allows". The rules file ("A case of the brief may be run by a case-run program") allows only a program that prints a case's result.
  - `c5.mjs` and `c10.mjs` are case-run programs. `fit.mjs` (fit counts), `prose.mjs` (capital, full stop, hyphen and filler-word hits), `diffrq.sh` (verify 4), `figcmp.sh` (figure cmp), `katex.mjs` (equation render lengths), `mywrites.mjs`, `rootreads.mjs` and `sp-attr.mjs` (transcript and scratchpad attribution) serve no case. No Ruling approves them: a grep of plan.md and orchestrator-state.md for the names finds nothing.
  - All are read-only and change no file, so the standing ruling "Unapproved builder scripts" has no hunk to read.
  - Failure scenario: none to the product; the breach is of the brief's letter.
  - Verdict: no item or case.
- Spec 6. `projects/coauthor/stopped/individual-reference-intervals/present/main.md:20`: "The project folder holds only its manifest: no data, code or result was kept."
  - What is wrong: the manifest gives only "Abandoned ... Not pursued to a full paper". The folder state is true (`ls` shows `present`, `project.yml`). "No data, code or result was kept" is an inference about places outside the folder, which no source states.
  - Failure scenario: a reader concludes that the lead author kept nothing.
  - Verdict: no item or case (minor).
- Spec 7. `src/lib/views/academic/present/Slide.svelte`, hunk `@@ -30,16 +30,16 @@`, rewrapped through line 42 against the brief's path "lines 30-40".
  - What is wrong: lines 41-42 lie outside the named range. They are the tail of the same comment paragraph, rewrapped after the change at lines 33-34, with no new content.
  - Failure scenario: none.
  - Verdict: no item or case.

## 2. Proof

- Proof 1. `.scratch/migration/agents/reviews/O151-report.md:3`: "NOT done: verify item 1 ... This check cannot pass with a temporary folder inside either worktree, and it is handed back for that reason."
  - What is wrong: the same line reports that `size.test.ts` "run alone with `GIT_CEILING_DIRECTORIES` set to that folder passes 10 of 10". `agents/spec.md` "Where you work" now requires exactly that variable beside TMPDIR. My `npm run test:quick` with neither variable set printed "every command passed". Verify 1 is green; the "cannot pass" sentence is contradicted by the report's own run. The variable entered the rules file after the builder's run, so the red run itself is not a builder error.
  - Failure scenario: the orchestrator treats verify 1 as an open defect of the step and holds the landing for it.
  - Verdict: none (verify 1 holds on rerun).
- Proof 2. `.scratch/migration/agents/reviews/O151-report.md:664`: "`manuscript/` holds the arXiv preprint ... its heart-disease and TCGA numbers match the root (checked with `pdftotext` and `grep` on 0.872, 0.874, 0.812, 0.775, 0.609)."
  - What is wrong: the local-client rows differ between the two versions. The root `admin/conference/main_work.tex:482-483` gives Client 0 0.89 and Client 1 0.92. The arXiv `manuscript/latex/main_work.tex` heart table, and `manuscript/main.pdf` text lines 754-755, give 0.842 and 0.882.
  - The deck uses the root's numbers (`fermat/present/main.md:39`, "The two large centres score higher alone (AUC 0.89 and 0.92) than the federated model (0.872)."). The claim of agreement and the unlisted disagreement go against the brief's rule that a disagreement is listed with both places. The arXiv text also inverts the slide's claim: 0.842 is below 0.872.
  - Failure scenario: a reader checking the deck against the paper in the project's `manuscript/` folder finds numbers that contradict the slide, and no note says why.
  - Verdict: C7 partial.
- Proof 3. Report lines 538 and 800. The icfp-src-poster chart values and the algebraic-effects-compilation Figure 14 bar labels were "rendered to PNG in the scratchpad with `pdftoppm`" and read off the renders.
  - What is wrong: the 719 correction says nothing a scratchpad program printed stands as evidence. These renders predate the correction (01:59 CET; every builder file there predates it), and the report does not say they were redone in `.agents/scratch`. The values rest only on a scratchpad run.
  - Failure scenario: a misread chart value stands on a slide with no run behind it that the correction accepts.
  - Verdict: none on its own. See Declined.

## 3. Standards

- none. The ASCII gates print only the five accented-name lines, and the manifest spells "St<e acute>phanie" the same way. The new comments in `slide.css:17-20` and `:68-71`, `Facts.svelte:23-29` and `:154-158`, and `Slide.svelte:33-42` describe the code as it now stands. The one the diff could have made false, `Dot.svelte:5` ("unless an element around it sets `--dot-size`, which the strip sets to follow its own type"), still holds. No doc states the strip's type (`docs/decks.md` "facts" part is silent on size). A dash-stand-in and filler-word grep over every deck finds only minus signs inside equations.

## 4. Behaviour

- none beyond what the brief and ruling 3 state. The dot under a rice theme becomes 8.25px (ruling 3, listed in the report as a reversible decision).

## Declined to judge

- Whether the icfp-src-poster chart values and the algebraic-effects-compilation Figure 14 bar labels are read correctly. It needs a page render, which writes a file, and this review writes none.
- Who wrote the four ledger copies in the oculus worktree. They are identical to main's copies. Settled by `git log -- .scratch/migration/agents` in the worktree.
- C9. It is the orchestrator's measured fit.
- Whether the fermat manuscript root (`admin/conference/main_work.tex`, the FLTA paper the manifest names) is the right choice over `manuscript/` (the arXiv extended version). The report states its reason, and it is a judgment the brief leaves to the builder; only the unlisted disagreement is raised (Proof 2).

Reviewer usage: a6f5f05ec3e63f0f2, claude-opus-5-5, 206748 tokens, 180 tool uses, 23.1 min.

## Repair round 1, refuted

### Verification

Every command below was run after the builder's last change. Unless a line says otherwise, it ran from the oculus worktree `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151` (O) or the hub worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O151` (H).

Verify 1 (O):
```
$ env -u TMPDIR -u GIT_CEILING_DIRECTORIES npm run diagrams   (last lines)
docs/diagrams/channels.svg
docs/diagrams/writes.dot
docs/diagrams/writes.svg
$ git status --short          (unchanged after it: 6 M, 5 ??, no docs/ path)
$ env -u TMPDIR -u GIT_CEILING_DIRECTORIES npm run test:quick
ok      prettier (2.7 s): All matched files use Prettier code style!
ok      ASCII gate (3.1 s)
ok      svelte-kit sync (6.5 s)
ok      eslint (3.2 s)
ok      svelte-check (16.0 s): 1794142704169 COMPLETED 589 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (65.6 s): Duration  46.12s (transform 21.42s, setup 0ms, import 42.07s, tests 65.95s, environment 2ms)
test:quick: 72.4 s; every command passed
```

Verify 2:
```
(O) $ LC_ALL=C perl -ne '<rules-file ASCII gate>' src/lib/themes/slide.css src/lib/views/academic/present/parts/project/Facts.svelte src/lib/views/academic/present/Slide.svelte
exit=0 (nothing printed)
(H) $ find projects -path '*/present/*' \( -name '*.md' -o -name '*.yml' \) -print0 | xargs -0 env LC_ALL=C grep -n '[^ -~]'
projects/active/linfoot-estimator/present/main.md:11:  - { label: 'Lead', value: 'St<e acute>phanie van den Berg; Axel Faes coauthor' }
projects/ideas/modality-dropping-btf/present/main.md:10:  - { label: 'Data', value: 'real Twente (NL) and Link<o diaeresis>ping (SE) HCC federation' }
projects/ideas/hccnet-fl-sweden/present/main.md:4:sub: 'HCCNet federated between Twente (NL) and Link<o diaeresis>ping (SE), where sites hold different MRI sequence sets'
projects/ideas/hccnet-fl-sweden/present/main.md:11:  - { label: 'Partner', value: 'Link<o diaeresis>ping University Hospital, cohort to confirm' }
projects/ideas/hccnet-fl-sweden/present/main.md:19:  - 'Gate pending; the Link<o diaeresis>ping data-use, ethics and GDPR agreement is the critical path.'
(H) $ LC_ALL=C grep -n '[^ -~]' <the 11 README.md files of the round>
ascii exit=1 (nothing printed)
```

Verify 3 (O):
```
$ sh utils/unused-exports.sh | diff - /Users/axelfaes/workspace/oculus/.agents/worktrees/O151-base/unused-exports.txt
exit=0 (nothing printed); 333 lines
```
The brief's relative path `.agents/worktrees/O151-base/unused-exports.txt` does not exist inside the worktree. The base copy sits under the main checkout's `.agents/worktrees/`, so the absolute path was used.

Verify 4:
```
(O) $ node utils/outside-paths.mjs .scratch/migration/agents/briefs/O151.md df5a42a49
.scratch/migration/agents/briefs/O151-cases.md
.scratch/migration/agents/briefs/O151-round1.md
.scratch/migration/agents/briefs/O151.md
.scratch/migration/agents/guarded.md
.scratch/migration/agents/reviews/O151-refuter.md
.scratch/migration/agents/reviews/O151-source-check.md
.scratch/migration/agents/spec.md
```
- Compared with main's ledger by `diff -q`: six of the seven are byte-identical. `guarded.md` differs only by G152, which main gained later (`diff` prints `236a237,239 > - G152 ...`).
- `git diff df5a42a49` on the worktree's G130 line gives main's text. These are orchestrator copies, not builder writes.
- `git diff df5a42a49` touches only `slide.css`, `Slide.svelte` and `Facts.svelte` among the non-ledger files.

```
(H) $ git status --short | wc -l
143
(H) $ git status --short | grep -v '/present/'
 M projects/archive/published/2026/glassbox-decision-pipelines/README.md
 M projects/manuscripts/btfno/README.md
 M projects/manuscripts/ecg-readable-substrate/README.md
?? projects/archive/published/2021/abstract-bci-meeting-2021/README.md
?? projects/archive/published/2025/fbttr-strategies/README.md
?? projects/archive/published/2025/fermat/README.md
?? projects/archive/published/2025/go-bttr/README.md
?? projects/archive/published/2026/abduction/README.md
?? projects/archive/published/2026/hcc-modality-poster/README.md
?? projects/archive/stopped/connectivity-motor-imagery/README.md
?? projects/coauthor/published/2016/chi-household-survival/README.md
(H) $ for each of the 95 research projects: diff -rq <folder>/present O151-hub-base/<folder>/present   (summarised by kind)
  70 Only in worktree present.yml | 70 Only in worktree main.md | 25 main.md differ | 25 present.yml differ | 23 images only in the worktree (one each) | 0 only in base | 0 "base: no folder"
(H) $ git diff 59095642f --stat -- ':!*/present/*'
 .../archive/published/2026/glassbox-decision-pipelines/README.md   | 6 ++++++
 projects/manuscripts/btfno/README.md                               | 7 +++++++
 projects/manuscripts/ecg-readable-substrate/README.md              | 6 ++++++
```
Each tracked README hunk adds only the private section at the end of the file.

Verify 5. The commands are fed from the report's appendix through stdin with `node --input-type=module -`, and the project list comes in by process substitution, so no file is written.
```
C5 (c5.mjs source, report lines 1300-1409): last line "folders with present.yml: 95 of 95"; no "DECK FAULTS" line; 50 "slide 2:" lines (33 columns, 17 project)
C6 (O) $ OCULUS_TEST_HUB=<H> npx vitest run tests/checks/config/integrity.test.ts -t "deck|equation|portfolio" --reporter=verbose   (TMPDIR at the system default)
 <check mark> ... the real hub > reads a deck out of every project that has a present/ folder, with no finding 2101ms
 <check mark> ... the real hub > reads an equation out of every slide that writes one, as LaTeX that typesets 761ms
 <check mark> ... the real hub > reads the portfolio deck with every named deck found 155ms
      Tests  7 passed | 7 skipped (14)
 load average 5.89 7.15 8.71 before, 6.13 7.16 8.70 after
C10 (c10.mjs source, report lines 1417-1471): "lines repeated across decks: 53"; among them '"### Limits" in 4 decks' (connectivity-iris, hccnet-fl, http2-best-practices, ecog-frequency-features), '"### Limits and dead ends" in 2 decks', '"### Open" in 2 decks', '"BCI Competition IV dataset 4, 3 subjects" in 2 decks' (extended-bttr-note, xsub-ecog-framework)
```

Verify 6 was checked by reading. See R1-T1.

Commands the round-1 report quotes, rerun in the same form:
```
fit.mjs:   slides: 145; slides over a fit rule: 0; slides with an equation key: 43
katex.mjs: equations: 43; throwing: 0
prose.mjs: hits: 20   (13 spaced-hyphen hits on the front matter, 7 lower-case first letters: eBTTR, eLORETA, mPSTD)
figure cmp over the 23 source/target pairs of report lines 1104-1126: 23 same
(H) git status --short: 143 lines; outside present/ only the 11 READMEs (matches the report)
diffrq.sh: reproduced by the diff -rq loop above (70/70/25/25, 0 only in base)
```
- The deck delta since the snapshot was taken by `cmp` of each deck file against `migration-O151-round-1`. It is 66 `main.md` changed, no `present.yml` changed, no figure changed and none deleted. All 66 decks have an entry in the report's Round 1 section.
- The oculus round delta is none: `diff -u` of the three files in `files.txt` against the snapshot prints nothing for each.
- `.agents/scratch/` is absent from the oculus worktree (`ls .agents/`: only `plan.yaml`).

### Verdicts

Items of "What to build":
- Item 1 (a deck for every research project, from its own sources, naming no other project): violated.
  - Finding R1-S1: the round added a cross-reference to another project.
  - Finding R1-S6: clinical-ai-eval-artifacts frames the idea through two student studies. It is for the orchestrator.
  - These hold, each checked by reading: rulings 723 (xsub-ecog-framework), 4 (serial-ecg-af chip: `grep -n -i 'BTTN\|0\.762'` hits only lines 15 and 18) and 5 (fed-faithful-ecg FedProx, `README.md:5` and `:72`).
- Item 2 (every slide right, and ruling 724's source rule): violated.
  - Findings R1-S2 (a significance reading the paper does not state), R1-S3 (a fact dropped for room), R1-S4 (a negative the paper states dropped) and R1-S5 (repeated body headings).
  - Shape, count, titles, equation floor, fit rules and figures hold (C5, C6, fit.mjs, katex.mjs, the cmp loop).
- Item 3 (the facts strip): holds. The round did not change the three oculus files (snapshot diff empty), and `git diff df5a42a49` shows `--slide-design-facts: 12px`, `--slide-design-facts-label: 10px`, the rice values 11px and 9px, `--dot-size: 0.75em`, and `.facts` and `.label` set from `--slide-fs-facts` and `--slide-fs-facts-label`.

Cases:
- C1: met. clinical-ai-eval-artifacts is a `project` slide whose numbers ("three", "at least one") are in `README.md`. The student-study framing is raised under item 1 (R1-S6), not as a C1 miss.
- C2: met. The round's three changed phd-thesis lines match `chapter-3/chapter-3.tex:338`, `chapter-4/chapter-4.tex:377` (with 0.493 at `:416`), `introduction/introduction.tex:93` and `conclusion/conclusion.tex:98`.
- C3: met. ms-lipid-handshake's hook now keeps the README's hedges (`README.md:82-84`), and its headline is "Disproved: slope -0.06, p = 0.73 on 632k nuclei". algebraic-subtyping still states "Stopped before a standalone paper". raw-pls keeps the dead targets at `main.md:40`.
- C4: met. `grep -n -i -e covert -e '\bPCD\b' -e 'coupled descent'` gives covert-theory only its own title lines. covert-applied gives `main.md:3` and `:45`, and its new headline names Route A as "masked dense tensors" (`main.tex:78`, `:86`, `:899`), not the other paper.
- C5: met (rerun above).
- C6: met (rerun above).
- C7: met for every round-changed number checked. The checks were go-bttr, abduction, fbttr-strategies, fermat, abstract-bci, connectivity-motor-imagery, clinical-hccnet, meseret-cirrhosis, hccnet-fl, glassbox, fed-multicellular-immune, pfl-ms-npj (27% is printed in the PDF), hccnet-revision (106.6%), bachelor-network-ids, extended-bttr-note supp, linfoot, jacobian and old-charges. The decks not checked are under "Declined to judge".
- C8: met by reading (unchanged since round 0): 12/10 times 1, 1.5, 0.7 and 1.6; 11/9 under rice; the dot 0.75em of 12px is 9px.
- C9: not verifiable. It is settled by the orchestrator drawing every deck of the hub worktree on a scratch server running the oculus worktree's code and listing each "Slide too tall", then the look at landing.
- C10: partial, finding R1-S5.

### 1. Spec

- **R1-S1.** `projects/active/novel-math-primitives/present/main.md:45`, added this round: "Chip-firing and sandpile dynamics, the first build candidate, was spun out as the sandpile-operator project."
  - What is wrong: round-0 ruling 1 says "A deck names no other project as such: no cross-reference". The sentence names another research project of the hub. Its source (`project.yml:17`) says so, but the project is a spin-out, not something novel-math builds on, applies or extends. So the "builds on" clause does not cover it.
  - The fix of the finding ("No candidate has a built bridge or a proved property yet", a framing the sources do not give) reaches beyond the finding by bringing in a new violation. A grep for every research project id over every deck finds this one hit; the only other hit is "abduction" in phd-thesis, used as the plain word.
  - Failure scenario: the portfolio deck shows a slide that points at another project's slide, which the ruling removes from every deck.
- **R1-S2.** `projects/archive/published/2022/extended-bttr-note/present/main.md:24`, slide 1, written this round: "On the cued-finger average, AM, RF, LARS, CNN and LSTM are all marked significantly different from eBTTR for every subject."
  - What is wrong: the report names its source as "the bold Avg. cells of the three result tables, `manuscript/main.tex:315-369`". Nothing in the paper says what bold marks. `grep -n -i "bold\|significan" main.tex` finds no legend. The caption at `:328` reads only "Intended (cued) finger movement accuracy for Subject 1 (Pearson correlation)". The only significance statement, `:303`, covers BTTR and HOPLS against eBTTR.
  - Ruling 724 bars "reading of a chart or comparison that the sources do not state". The slide is the builder's reading of table formatting summed over three tables.
  - Failure scenario: a reader takes as the paper's finding a significance result the paper never states.
- **R1-S3.** `projects/archive/published/2026/hcc-modality-poster/present/main.md`, slide 2: the line "Naive concatenation without and with pretraining: DWI 0.718 and 0.795, T1-IOP 0.720 and 0.690, T2W 0.705 and 0.670." is gone.
  - The report says it was "removed to keep the column at four items". The T1-IOP and T2W values stay on slide 1, but DWI 0.718 and 0.795 are now on no slide (whole deck read). Both values print as text in the poster (`pdftotext -layout manuscript/main.pdf`, lines 54-55).
  - The column made room by adding "Multi-modal fusion provides a further gain over any single group."
  - What is wrong: item 2 says "A fact the first slide has no room for goes on the second; no fact is dropped for room."
  - Failure scenario: the DWI pretraining result of naive concatenation, the one group where pretraining helped it, drops out of the deck.
- **R1-S4.** `projects/archive/published/2025/fermat/present/main.md`, slide 2 "Fed-Heart-Disease" column: the line "The two large centres score higher alone (AUC 0.89 and 0.92) than the federated model (0.872)." was removed, and its replacement keeps only half of its source sentence.
  - The source sentence, `admin/conference/main_work.tex:449`, reads "suggesting that smaller clients ... may benefit more ...". Its next sentence, "It should be noted that the larger clients can showcase a decrease of performance due to participating in an FL environment.", is on no slide (whole deck read). The column holds three items, so it had room.
  - What is wrong: item 2, "Nothing is hidden: no slide leaves out a fact because it is ... negative". The paper states this negative itself, so ruling 724 allows it ("a limitation the sources themselves state"). The values 0.89 and 0.92 are at `main_work.tex:482-483`.
  - Failure scenario: the deck keeps the paper's positive reading of the client analysis and drops its stated cost to the larger clients.
- **R1-S5.** Body headings repeated across decks. "### Limits" sits at connectivity-iris `main.md:44`, hccnet-fl `:44`, http2-best-practices `:43` and ecog-frequency-features `:44`. "### Limits and dead ends" sits at ecg-readable-substrate and fed-multicellular-immune `:43`. "### Open" sits at masters-algebraic-subtyping and masters-eeg-infotheory `:43`.
  - The report files these as "Body headings that name a kind of column" beside the one-word labels.
  - What is wrong: round-0 ruling 4 allows only "a one-word tag text or spec label that names a kind of thing" and says "a body heading block [is] never repeated across decks". The round renamed three of the six "### Limits" headings (algebraic-effects-compilation, http2-web-performance, hcc-modality-poster: the snapshot grep gives six decks, the worktree four) and left the other four.
  - If "body heading block" is meant otherwise, the orchestrator rules it.
  - Failure scenario: C10's rule is applied to some decks and not others in the same round.
- **R1-S6.** `projects/ideas/clinical-ai-eval-artifacts/present/main.md:14` and `:20`: "Extract the recurring failure modes of three in-hand studies (federated partitioning, ECG representation benchmarking, a vertical-federation go/no-go) ..." and "The study owners co-author their own pieces; ...".
  - What is wrong: the README (`:11`, `:17`) says two of the three studies are the students' (`brecht-fl-partitioning`, `dongho-ecg-clustering`). Their studies are the deck's evidence base and method, which round-0 ruling 1 bars ("no deck frames its project through a student project"). This is the same kind of clash ruling 723 settled for xsub-ecog-framework only.
  - It predates the round and the first refuter did not raise it. It is raised here for the orchestrator to rule, not counted against the builder.
  - Failure scenario: an internal deck frames a senior meta-science idea through students' studies, as xsub did before ruling 723.

### 2. Proof

- **R1-P1.** Private README `projects/manuscripts/btfno/README.md`, second bullet: "the two arms split their parameters differently between the routed and the shared expert, while the paper reports the $L=1$ result as a matched comparison (`manuscript/main.tex:300`)".
  - What is wrong: `main.tex:300` says only "All comparisons are matched-degree-of-freedom factorization ablations". The script's own lines give the arms as matched in total, `run_pdebench_theory.py:87` `# 673k` and `:88` `# 671k`. `grep -n "L=1\|L = 1"` over `main.tex` finds no claim that the split between the routed and the shared expert is matched.
  - Ruling 2 says "A fault that does not hold against the paper is not written". This fault rests on a per-component reading the paper does not make.
  - Failure scenario: the private record lists as a fault of the paper something the paper does not claim, and a later revision acts on it.
- **R1-P2.** The report's Round 1 entry for `coauthor/stopped/individual-reference-intervals` lists hook, purpose, plain and line 20. The diff also replaces `mechanism` ("Per-patient baselines as features for event prediction" becomes "Per-patient reference intervals combined with machine learning") and `headline` ("Stopped in 2024 before a full paper for IEEE JBHI" becomes "Abandoned; it was targeted at IEEE JBHI, 2024").
  - The new words match `project.yml:11`.
  - What is wrong: ruling 1 asks the report to list "per deck, each statement removed or replaced, with its line before and its words after". Two of six are missing; the source-check item at line 22 is among them.
  - Failure scenario: the orchestrator's read of the per-deck list misses two of the deck's changes.
- **R1-P3.** Report "Ruling 6": "arXiv version, `manuscript/latex/main_work.tex:494-512`: no local FBTTR rows; its only local rows for clients 0 and 1 (`:508-509`) are 0.842 ... and 0.882 ..., the FL4E 'Local Experiment' rows that the FLTA paper also prints at `:497-498`."
  - This reproduces: `sed -n 494,512p` and `admin/conference/main_work.tex:486-500` show identical FL4E local rows.
  - The round brief's premise for ruling 6 ("0.89 and 0.92 against 0.842 and 0.882") therefore does not hold as two versions of the same rows.
  - What is wrong: the rules file asks that a brief premise that does not reproduce be stated in the report's first section. The report states it only inside the Ruling 6 section, and its first line says everything is done.
  - Failure scenario: the orchestrator does not see that ruling 6's described disagreement does not exist.

### 3. Standards

- **R1-T1.** Contrast constructions written this round and not named in the report as prose-rule departures (verify item 6 asks that each be named with why):
  - `projects/active/sandpile-operator/present/main.md:38` "... an inductive-bias advantage over smooth diffusion, not real-world superiority."
  - `projects/archive/published/2026/hccnet-fl/present/main.md:49` "... an independent re-implementation, not the pipeline that produced the published numbers, ..."
  - `projects/manuscripts/btfno/present/main.md:40` "... on one benchmark, not a state-of-the-art benchmark."
  - `projects/coauthor/stopped/individual-reference-intervals/present/main.md` hook and plain, two "in place of".

  The report's judgment-call line (`O151-report.md:1253`) lists the earlier contrast keeps but none of these. Each follows its source's wording (`README.md:31`, `README.md:25`, `main.tex:300`, `project.yml` eli5).
  - Failure scenario: negation-contrast phrasing enters the decks without the review the brief asks for.

### 4. Behaviour

- **R1-B1.** Eight projects that had no `README.md` now have one: abstract-bci-meeting-2021, fbttr-strategies, fermat, go-bttr, abduction, hcc-modality-poster, connectivity-motor-imagery and chi-household-survival.
  - Each file holds only the title line and the section "Known issues in the published paper (private)" (or "in the draft" for connectivity-motor-imagery).
  - Oculus lists `README.md` as a project document under the label README (`src/lib/data/sources/documents/docs.ts:41`). These projects' document lists go from no README to one whose whole text is the private faults.
  - What is wrong: the report states no user-visible before and after for this.
  - Failure scenario: at the look, a project's README chip appears and opens on the private faults, with nothing in the report saying to expect it.

### Declined to judge

- The icfp-src-poster bar values on `main.md:20-21`. `pdftotext -layout` gives no text for that chart (only 88 lines in all, none of the values), so checking them needs a page render, which writes a file. The algebraic-effects-compilation Fig. 14 values were checked as PDF text (page 24: 78.5, 74.3, 62.3, 37.4, 35.4, 34, 2.4 2.3, 2 1.9, 5.5 3.8, 3.3 2.3), and so were the hcc-modality-poster table values.
- The hcc-modality-poster "red" marking of T1-IOP and T2W. The poster text gives "Red: degradation", but the colour of each cell needs a render.
- Ruling 724's full read of all 95 decks.
  - All 66 round diffs were read line by line. The changed lines were checked against their sources for the decks named under C7, plus eeg-saad-challenge, loewner, sandpile-operator, faithful-block-term-layer, fed-faithful-ecg, novel-math-primitives, source-localization, block-term-tensor-regression, masters-algebraic-subtyping, http2-web-performance, covert-applied, covert-theory, dries-bttr-ecg, ecg-readable-substrate, serial-ecg-af, flkit, ideas status lines and xsub-ecog-framework.
  - Whole decks were read for fermat, hcc-modality-poster, fbttr-strategies, xsub-ecog-framework, clinical-ai-eval-artifacts, bachelor-network-ids (part), glassbox (slide 2) and hccnet-pathology (slide 1).
  - A keyword grep ("identical", "best", "marked", "every subject", "all ... cells", "wrong", "does not report", "authors)") ran over every deck, and every hit was traced. That found R1-S2; the other hits trace to their sources.
  - The remaining unchanged decks were not read in full against their sources.
- The connectivity-motor-imagery, go-bttr, fbttr-strategies and chi-household-survival private faults were read but not traced line by line against their papers. The abduction (12 of 40 unmarked cells counted), fermat, glassbox (`within_code15_seed0.json` holds `lead_dropout_3: 0.6054...`; README:105 gives 0.7646) and btfno faults were traced.
- `git status --short docs`, as the report quotes it, was run as plain `git status --short`, which covers it.
- C9: the orchestrator's measured fit.

Reviewer usage: a79e0d6fd9a360f28, claude-opus-5-5, 353095 tokens, 142 tool uses, 21.8 min.

## Repair round 2, refuted

Worktrees: oculus `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151-2` (O), base 3d5b3da7d; hub `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O151` (H). Round 2 snapshot of the hub: `.../migration-O151-round-2` (B).

```
$ (O, TMPDIR unset, PATH node v24.21.0) npm run diagrams   # tail: docs/diagrams/writes.svg; git status --short afterwards lists no docs/ path
$ (O, TMPDIR unset) npm run test:quick
test:quick: 8 changed file(s), from git since HEAD
ok prettier (1.3 s): All matched files use Prettier code style!
ok ASCII gate (1.4 s)
ok svelte-kit sync (2.7 s)
ok eslint (2.5 s)
ok svelte-check (8.8 s): ... COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok vitest (11.7 s) | ok vitest checks (36.2 s)
test:quick: 39.0 s; every command passed
(not covered, its own line: tests reaching no changed file within the import depth, other than tests/checks/source and tests/checks/tree; the build; the lint of unchanged files)

$ (O) LC_ALL=C perl ASCII gate over the four files: exit 0, nothing printed; LC_ALL=C grep -n '[^ -~]' over the four files: 0 lines
$ (H) find projects -path '*/present/*' \( -name '*.md' -o -name '*.yml' \) -print0 | xargs -0 env LC_ALL=C grep -n '[^ -~]'
projects/ideas/modality-dropping-btf/present/main.md:10 ... Link<o umlaut>ping
projects/ideas/hccnet-fl-sweden/present/main.md:4, :11, :19 ... Link<o umlaut>ping
(4 lines, each the place name)

$ (O) sh utils/unused-exports.sh | diff - .../worktrees/O151-2-base/unused-exports.txt   # diff exit=0, nothing printed
$ (O) node utils/outside-paths.mjs .scratch/migration/agents/briefs/O151.md 3d5b3da7d
.scratch/migration/agents/briefs/O151-round2.md
.scratch/migration/agents/reviews/O151-oculus-before-round-2.patch
.scratch/migration/plan.md
src/lib/views/academic/present/parts/project/Project.svelte
(Project.svelte is named by the round brief's path list; plan.md and the two others are orchestrator ledger files.)
$ (H) git status --short | wc -l   # 143
$ (H) git status --short | grep -v '/present/' | wc -l   # 11 (the round 1 README records)
$ (H) diff -rq each of the 95 present/ folders against O151-hub-base: 95 folders differ; only in base 0; only in worktree 163; files differ 50
$ (H) cmp of the 11 README.md against B: same for all 11
$ (H) grep -c '^kind:' per deck: 82 decks one slide, 13 decks two (108 slides); grep 'kind: columns': 0
$ grep -c '<<<<<<<\|>>>>>>>' over the four oculus files: 0 for each
$ C5 (source lines 1300-1409 of O151-report.md, worktree path replaced, fed by stdin, research.txt regenerated from project.yml tier): folders with present.yml: 95 of 95; 0 fault lines; 13 "slide 2:" lines
$ C6 (O) OCULUS_TEST_HUB=<H> npx vitest run tests/checks/config/integrity.test.ts -t "deck|equation|portfolio"
 Tests 7 passed | 7 skipped (14)
 <check mark> real hub deck row 1830ms, equation row 558ms, portfolio row 143ms; load average 8.72 6.02 5.79
$ C10 (source lines 1417-1471 of the report): lines repeated across decks: 36
$ node numbers check over all 95 decks (numbers on slides against README, CLAUDE.md, project.yml, manuscript .tex and PDF text): printed only fed-faithful-ecg, phd-thesis 1.05, bachelor-network-ids, icfp-src-poster, masters-algebraic-subtyping, bttn-incident-af 30,000, raw-pls -- see below
$ per-deck new numbers (comm -23 of each deck against B): linfoot-estimator, dongho-ecg-clustering, ecg-af-fair, clinical-hccnet only (agrees with the report)
```

### Verdicts

Rulings of `O151-round2.md`:

- Ruling 1, one slide per deck: violated. The counts hold (82 and 13 decks; the report names the 13 with why). The clause "A fact the one slide has no room for is not dropped silently: item 2 of the brief still holds, so a fact that cannot stand on one slide is the reason for a second slide" is not met: Spec 1, Spec 4.
- Ruling 2, a second slide looks like the first: violated, Spec 2.
- Ruling 3, every slide fits: not verifiable by this review (the measurement is the session's, under "Declined to judge").
- Ruling 4, slides from the material only: violated, Spec 6.
- Ruling 5, every deck checked again against all 17 issues: violated, Spec 5.
- Ruling 6, up to date and proper: holds for the decks read: linfoot-estimator, clinical-hccnet, btfno, bt-operator-theory, ecg-af-fair, dongho-ecg-clustering each trace to the live sources (numbers below). One point on bt-operator-theory's README is the user's, under "Declined to judge".
- Ruling 7, kept as they stand: violated at R1-S3 and R1-S4, Spec 3. Held: the 11 README records (cmp same against B; no README changed); R1-S1 (no "spun out" sentence); R1-S2 (no bold-reading line in extended-bttr-note); R1-S5 (no body headings remain); R1-S6; R1-P1; R1-T1 (no `, not X` in the listed decks).
- Ruling 8, every changed line reported, before and after, with its source: violated in part, Spec 7.

Items of the brief's "What to build":

- 1: holds. C5 95 of 95; each read deck comes from its own sources; C4 below; round 1 rulings 3, 4, 5 of `O151-round1.md` hold (`xsub-ecog-framework`, serial-ecg-af has no BTTN number, fed-faithful-ecg FedProx "benchmarks still to run").
- 2: violated, Spec 1 and Spec 4 (the "no fact is dropped for room", "Nothing is hidden" and `equation` clauses). Held: titled slides, shape checks (C5), C6, no finding of the deck reader, equation floor at 13.
- 3: holds. `slide.css` `--slide-design-facts: 0.9375cqw`, `--slide-design-facts-label: 0.78125cqw`, rice `0.859375cqw` and `0.703125cqw`; `Facts.svelte` sets the strip from them, dot 0.75em; `Project.svelte:149` `{#if right}`; markers 0; comments state fractions, no px size; `Slide.svelte` only its comment changed.

Cases:

- C1: met, `ideas/clinical-ai-eval-artifacts` read; the "project" slide follows its README and manifest.
- C2: met, `archive/phd/phd-thesis` read against the thesis and manifest; 1.05 is the 1.0459 rounding already accepted.
- C3: met for what the case asks: ms-lipid-handshake states "Disproved: slope -0.06, p = 0.73 on 632k nuclei"; algebraic-subtyping unchanged (cmp same) and says "Stopped before a standalone paper"; raw-pls slide 2 chip "Dead targets" holds MGMT and survival. The loss of ms-lipid's other threads is under Spec 1.
- C4: met. `grep -n -i -e covert -e '\bPCD\b' -e 'coupled descent'`: covert-theory only its own title lines; covert-applied its title only.
- C5: met (rerun above).
- C6: met (rerun above).
- C7: partial. Spec 8: the round's new numbers carry no file and line in the report. The numbers themselves check out at the lines listed in the Spec 8 entry.
- C8: met by reading. 12 and 10 at 1; 11 and 9 under rice; 18 and 15 at 1.5; 8.4 and 7 at 0.7; 19.2 and 16 at 1.6; dot 9 at 1 (0.75em of the value size).
- C9: not verifiable here; the session's page measurement.
- C10: met (rerun, 36 lines, all short labels, venue, stage or shared author and title strings of the kinds the report lists; no body heading remains).

### Decks read, and the 17 issues (task point 2)

Read in full (36): the 13 two-slide decks (`active/linfoot-estimator`, `manuscripts/` bt-operator-theory, btfno, bttd-source-eeg, bttn-incident-af, clinical-hccnet, dries-bttr-ecg, ecg-readable-substrate, fed-multicellular-immune, hccnet-revision, meseret-cirrhosis, raw-pls, ward-bttr-crosssubject); the decks the builder names as cut most (manuscripts/covert-theory, archive/failed/ms-lipid-handshake, archive/failed/jacobian-coupled-blockterm-dp); the decks with new numbers beyond those (archive/published/2026/dongho-ecg-clustering, ideas/ecg-af-fair); and a sample of 18: archive/published/2026/hcc-modality-poster, 2025/fermat, 2022/extended-bttr-note, active/novel-math-primitives, ideas/clinical-ai-eval-artifacts, 2026/abduction, 2025/go-bttr, 2025/fbttr-strategies, 2026/glassbox-decision-pipelines, 2026/hccnet-fl, archive/phd/phd-thesis, archive/failed/fed-faithful-ecg, active/loewner, ideas/engram, active/sandpile-operator, ideas/xsub-ecog-framework, manuscripts/covert-applied, 2022/block-term-tensor-regression.

Not read (59, numbers check and repeat check only): active/eeg-saad-challenge; archive/failed/faithful-block-term-layer; archive/published/2016/bachelor-network-ids, 2017/icfp-src-abstract, 2017/icfp-src-poster, 2018/masters-algebraic-subtyping, 2018/masters-eeg-infotheory, 2021/abstract-bci-meeting-2021, 2021/source-localization, 2021/volga-finger-trajectories, 2022/connectivity-iris, 2026/erp-signatures; archive/stopped/algebraic-subtyping, archive/stopped/connectivity-motor-imagery; coauthor (14): flkit, chi-household-survival, chi-purpose-centric, algebraic-effects-compilation, http2-best-practices, http2-web-performance, coordinated-fingers-ecnr, ecog-frequency-features, modulation-lmp-bci, highgamma-event-detection, editorial-bigdata-ai-ms, pfl-ms-npj, proprioception-exoskeleton, individual-reference-intervals; ideas (31): adapter-format-theory, asthma-geo-tensor, attention-scoped-instructions, block-term-nca, brecht-fl-partitioning, btd-autoencoder, cirrhosis-digital-twin, concept-bottleneck-hcc, conformal-tensor-factors, faithful-interpretability-position, fed-duplication-limits, fed-neural-operators, fedbtd, federated-protocol-agents, fedlink, fl-privacy-auditing, florank-personalization, harmonop, hccnet-fl-sweden, hccnet-pathology, modality-dropping-btf, multiway-biosignal-fm, neurosde, old-charges-stemmatology, paleogenomics-tensor, pathology-tensor-mil, physics-tensor-hcc, quantum-tensor-fl, serial-ecg-af, ssm-longitudinal, strokeop.

The 17 issues over the 36 decks read, in ruling 5's order: (1) critiques: none found; a grep for critique words over every deck printed nothing. (2) statements the sources do not give: Spec 6. (3) another project's result as a bar: none in the 36 (bt-operator-theory's companion-study line is its manuscript's own). (4) numbers from an unnamed file: none; fed-faithful's pilot numbers are in `code/results/pilot_mechanism/summary.md`, which `README.md:33` names. (5) student work framed as Axel's: none. (6) claims no source makes: Spec 6. (7) version disagreement not listed: none new; the report lists them. (8) chart values read off a picture: not re-rendered (Declined). (9) a paper's fault on a slide: none. (10) fact dropped, overstated or added: Spec 1, Spec 6. (11) repeated lines: C10 holds. (12) another project's materials: none. (13) banned prose: `, not X` grep over every deck printed one line, in linfoot (a closed route, no contrast). (14) unreported changes: Proof 2, Behaviour 1. (15) unapproved programs: Spec 9. (16) too tall: the session's. (17) empty right-hand column: holds, `Project.svelte:149`.

Numbers: the numbers check found every number of the 36 decks read in their named sources except, in the read set, raw-pls -0.087 and MGMT 0.50/0.53 (in `RESULTS.md:15` and `:36`, which the check did not include, named by item 1) and bttn 30,000 (`30{,}000` at `manuscript/main.tex:174`); fed-faithful-ecg's six are in the named `summary.md` lines 7-9. Claims: the 36 decks were read against the sources on every line the round changed (Spec 5 lists what round 2 rewrote); the unchanged lines were compared to the sources only where a reading raised doubt.

### Facts in the round 1 snapshot, absent now (task point 3)

For every fact below ruling 1 requires the same thing: it stands on the one slide, or it is the reason for a second slide named in the report. Neither happened for these. "N1" and "N4": named in NOT-done item 1 or item 4 of the Round 2 report. "D": present only as a `-` line in "Every changed line", not named as cut.

- bttn-incident-af: two-branch 0.731/0.754 and warm-start 0.744/0.758 AUROC pairs (N1). "On the earlier ECG-report labels" for the dead-end AUROCs (D, also Spec 6). Figures pipeline_overview and bttn_interpret (D, not among N4's nine).
- meseret-cirrhosis: Spearman 0.59 with SMOTE; Fine-Gray 5-year C 0.842, 0.807; subdistribution HR 1.52, 0.32; METABRIC +0.008, GBSG +0.014, SUPPORT up to +0.046 with sizes 1904, 2232, 8873; prothrombin PH violation p = 0.002; SUPPORT 508 patients; net benefit (D). Figures (N4).
- ward-bttr-crosssubject: ridge 0.354 against BTTR 0.156; CORTEG ridge 0.380 against 0.336; random-init head 0.319; nonlinear head 0.353 to 0.517; EEG 0.402 against 0.411; fingerflex 72.1 and 8.2; 6 of 12 coverage (D). Figures (N4).
- hccnet-revision: variant parameter counts 12.4M to 72.4M; fusion AUROC 0.894 and 0.891; Medisch Spectrum Twente 2011 to 2022 (D). Figures (N4).
- dries-bttr-ecg: RR pseudo-leads dead end 0.471, 0.548; age alone 0.75 with unmatched controls; age 0.500 with matched; median-beat window; CNN near chance aligned and unaligned, no alignment conclusion for CNN (D). Figures (N4).
- bttd-source-eeg: Champagne under the matched sparse prior; correlated-source robustness of linear inverses and Champagne; deep sources degrade; 500 background dipoles (D). Figures (N4).
- fed-multicellular-immune: comparable or below elsewhere SLE +0.013, COVID -0.064, Crohn's +0.008, kidney +0.024, heart -0.015; liver 6 controls and no replication; additive aggregation does not compute the merge; site-subspace leakage 0.98 at 20 donors; gene-mode stitch 0.654 replaced (D).
- raw-pls: AUPRC 0.975 against 0.793; "most of the grid's deficit was rasterization"; isometry 4.2e-16 against 1.40 (D). Figures (N4).
- btfno: frequency roughness 0.715, 0.797, 0.924; the gap values 0.0160 and 0.0179 at L = 1; the reviews' request for MoE-POT, NESTOR, MPP, AM-FNO, a second benchmark and the Tucker side (D). Figure (N4).
- bt-operator-theory: disjoint-band ratio 10.15 against 12; threshold about 60 against 6; gap values 0.0178 to 0.0120; selector and depth extensions; no representational edge; approximate band-structure trade-off (D).
- ecg-readable-substrate: prevalences; waveform no-age 0.781 against 0.749; ECG-JEPA +0.013 and ST-MEM's interval; leakage-clean encoder adds +0.013 and +0.002; NeuroKit delineation as a possible confounder; reasons for the dead ends (D).
- clinical-hccnet: "each sequence's encoder size was chosen on the held-out patients" (`manuscript/main.tex:142`; D; the held-out AUROCs stay on slide 1); ethnically homogeneous population; subgroup results removed; truncated-history dead end; every interval excludes 1 (D). Figures (N4).
- linfoot-estimator: figure (N4); closed routes' numbers (four arms 0.062, six levers 1.8 percent), MIST 0.33 nats, August estimator 0.0624 against 0.0799, margin spread 0.0142 to 0.2501 (D; all superseded lines of the old manifest aside).
- covert-theory: PALM no-go, the "first" claim, floor checks 1.00, 1.03, 0.97, 1.1 at 20 seeds (N1); limits (no rate to the floor, private recovery dimension-dependent) (D).
- ms-lipid-handshake: 65 pairs and 43 donors, Absinta and Jakel cohorts, ambient RNA p = 8.6e-7, BTD 0.499 and 0.507 and 0.704 (N1); uptake 0.013, phagocytic -0.235, compositional pivot, coupled factorization r 0.252, the method's fit (D). Figure (D).
- jacobian-coupled-blockterm-dp: Control chip, "some numbers" (N1); raw floor 14 and 22, 16 to 18 percent lower, L = 1 at 0.988, 1.715 against 1.753, white-to-raw ratios (D).
- dongho-ecg-clustering: HuBERT axis 0.160 to 0.549, raw 0.000 to 0.001; scaler table; cost 28.3 ms and 434.7 ms; conv-AE 0.127; ECGFounder 0.909 against 0.896; worst-site draws (D). Figure (D).
- ecg-af-fair: earlier Candidate 1 and 2 lines superseded by the three directions; "split by patient" (D).
- hcc-modality-poster: naive concatenation DWI 0.718 and 0.795 (D, also Spec 3); encoder heads without pretraining 0.729, 0.731, 0.714; about 37 positives; stage 2 and 3 training (D).
- fermat: larger clients lose performance, alone AUC 0.89 and 0.92 (D, also Spec 3); accuracy 0.772 and 0.783; class imbalance per client; local runs 0.63 and 0.72 (D).
- extended-bttr-note: channels 61, 46, 63; 37 ms lag; hand-avatar comparison; paper renders coactivations anyway (D). Figure (D).
- novel-math-primitives, clinical-ai-eval-artifacts, xsub-ecog-framework, sandpile-operator, block-term-tensor-regression, covert-applied, loewner, engram, phd-thesis, go-bttr, fbttr-strategies, abduction, glassbox, hccnet-fl, fed-faithful-ecg: lines cut (each D): for instance sandpile's deep-equilibrium plan, engram's decided-against list and 190 MB index cost, glassbox's dead ends (sufficiency certificate, novelty monitor, averaging), hccnet-fl's heterogeneity axes and FedSL 0.402 against 0.701, covert-applied's masking no-go and 38.1 MB, phd-thesis's Granger precision and abduction-not-attempted; block-term's significance and non-difference lines; go-bttr, fbttr, abduction, block-term figures (D).
- The sample of the facts is by reading. "Many coauthor decks lost minor numbers" (N1) names no deck; the coauthor decks are in the unread list.

### Findings

**1. Spec**

- Spec 1. `O151-report.md` Round 2, "NOT done" item 1: "Facts were cut from slides to fit, and they were not given a second slide. Ruling 1 says a fact that cannot stand on one slide is the reason for a second slide"; the facts above. What is wrong: ruling 1 and item 2 ("no fact is dropped for room") ask for one slide or a named second slide; the round gave neither for the facts it cut. The 13 kept second slides were chosen by the same reason the table gives ("the first slide has no room") that the other 82 decks equally meet; all 12 of `manuscripts/` that keep a second slide and linfoot keep one, while hccnet-fl, glassbox, fermat, abduction and the theses, whose same kind of fact was cut, do not. Failure scenario: a reader of the fermat deck reads "Level with centralized BTTR" with the paper's stated cost to the larger clients gone; a reader of fed-multicellular-immune sees where multicellularity pays and not the cohorts where it does not; a reader of clinical-hccnet reads held-out AUROCs without the fact that encoder sizes were chosen on those patients. Verdict: ruling 1 and item 2 violated. The collision of "rare" with "no fact dropped" is named under "Declined to judge".
- Spec 2. `projects/manuscripts/*/present/main.md`, second slides: 10 of the 13 second slides carry `equation` and no first slide of those decks does (`node` listing of keys per slide). The report ("Same `kind: project` layout") and `Project.svelte:73` and `:149` show the first slide one column and the second two columns (`right` true only with an equation). Headline form: title statement on slide 1 and question on slide 2 in hccnet-revision, meseret-cirrhosis, ward-bttr-crosssubject and raw-pls; question on slide 1 and statement on slide 2 in bttd-source-eeg ("Correlated sources, real visual EEG, and where the method stops"), against the report's "a question or statement title of the first slide's form". Parts: method 2 bullets against 1, specs 3 against 1 to 3 (the report's NOT-done items 2 and 3 state part of this). What is wrong: ruling 2 says "the same layout, the same headline form, the same parts". Failure scenario: a reader sees the second slide of 10 decks as a different page layout from the first. Verdict: ruling 2 violated.
- Spec 3. `archive/published/2026/hcc-modality-poster/present/main.md` and `archive/published/2025/fermat/present/main.md`: the line "Naive concatenation without and with pretraining: DWI 0.718 and 0.795, ..." and the line "The paper notes that the larger clients can lose performance by joining federation: alone they reach AUC 0.89 and 0.92." stand in snapshot B and are gone. `grep -n "0.718\|0.795"` and `grep -n "0\.89\|0\.92\|lose performance\|decrease"` print 0. What is wrong: ruling 7 keeps "the fixes made at landing in the hub worktree (a review's findings R1-S1 to R1-S6, R1-P1 and R1-T1)"; these two are the fixes of R1-S3 and R1-S4. Failure scenario: the two facts the review had restored are gone again and the report's ruling 7 row says they stand. Verdict: ruling 7 violated.
- Spec 4. All decks: `node` key count: decks with `equation` 43 in B, 13 now, exactly the floor of `REAL_FLOORS`; 30 decks whose snapshot carried one have none (fermat, go-bttr, abduction, block-term-tensor-regression, hccnet-fl and others), and the 10 two-slide decks that keep one moved it off the first slide. Report's Round 2: "Equation floor | `grep -c '^equation'` ... prints 13". What is wrong: item 2 says the first slide carries "`equation` where its sources give them" and names the project's defining formula where its manuscript or README states one. The report does not say 30 were removed. Failure scenario: a reader of the abduction deck sees no eBTTR equation though the paper states it and the snapshot drew it. Verdict: item 2 violated.
- Spec 5. Report, "Per deck: the check of the 17 issues": "every line a deck holds now is a line, a shortening or a recombination of lines that stood in that deck after round 1 and were checked against its project's sources there". What is wrong: ruling 5 says "Every deck is checked again against all 17 issues". For the source issues the round substituted the round 1 check; the rows say "none" with issue 10 excluded. The check did not catch the statements of Spec 6. Failure scenario: a reader trusts "none" for a deck whose rewritten line says something its source does not. Verdict: ruling 5 violated.
- Spec 6. Recombined lines that change what the source says; each new this round.
  - `manuscripts/ward-bttr-crosssubject/present/main.md` slide 2: "Euclidean Alignment 0.037, anatomical 0.071 ($p$ = 0.016)". Snapshot: "(behavior against Euclidean $p$ = 0.016)"; `README.md:24` "Behavior-vs-Euclidean Wilcoxon p=0.016". The p value now reads as the anatomical comparison.
  - `archive/published/2025/fermat/present/main.md`: "Fed-Heart-Disease: AUC 0.872 against 0.874 centralized, gap not significant". `main_work.tex:464` says the accuracy difference is not statistically significant and "practically no difference in the ROC-AUC"; the snapshot's "accuracy gap" became a gap on the AUC.
  - `archive/published/2022/extended-bttr-note/present/main.md`: "coactivations most likely not encoded by the ECoG (S1, thumb cued: index 0.72 against 0.05)". The two were separate statements; the parenthesis (eBTTR against BTTR accuracy for a non-cued finger) now reads as evidence for the claim it stood beside, and its comparison is unlabelled.
  - `manuscripts/bttn-incident-af/present/main.md` slide 2 chip "Dead ends": the qualifier "on the earlier ECG-report labels" is gone, so the AUROCs sit against the 0.778 of a different label set.
  What is wrong: ruling 4 and the source rule; ruling 5 issue 10 (overstated). Failure scenario: a reader cites the wrong comparison for a p value, or reads a dead-end AUROC against a headline measured on other labels. Verdict: ruling 4 violated.
- Spec 7. Report, "Every changed line": "The source of each line is given above the record: a `+` line that is a shortening or a recombination of `-` lines takes its source from those lines". What is wrong: ruling 8 asks "before and after, with its source". One sentence for the whole section gives no source per line; a `+` line such as "Sequence-order pre-training adds little; no fused input beats diffusion MRI alone." has no file and line. Failure scenario: a reader cannot check a rewritten line against its source without redoing the trace. Verdict: ruling 8 violated in part.
- Spec 8. Report, "Up to date": new numbers named with a source file but no line ("every one of those numbers was then found by `grep -l -F` in that project's live source"). What is wrong: C7 asks each number with file and line. Reproduced: linfoot `manuscript/main.tex:41`, `:66`, `:265`, `:310`; clinical `manuscript/main.tex:148`, `:269`; dongho live `project.yml:15`; ecg-af-fair `README.md:21`. Failure scenario: as Spec 7. Verdict: C7 partial.
- Spec 9. Report, "How the rules met": "The section 'Every changed line' was generated with `diff -U0` and a shell redirect into this report". What is wrong: the round brief approves one program, and `agents/spec.md` makes a shell redirect that changes a file a script needing approval; it is named, not approved. Failure scenario: none to the product. Verdict: no item or case.
- Spec 10. Second-slide chips stripped of what they say: `bt-operator-theory` slide 2 `{ label: 'Code', value: 'four synthetic scripts' }` (the first slide's chip Code is the repository); `raw-pls` slide 2 `{ label: 'Real warps', value: '120 lesions, 3% at $\eta$ = 0.427' }` (snapshot: "move the representation 3%"); `bttn-incident-af` slide 2 `{ label: 'AUROC', value: 'block-term, full-rank 0.729, CP 0.728' }`. What is wrong: item 2, "A second slide ... is drawn as carefully as the first". Failure scenario: a reader cannot tell what the 3% or the Code chip states. Verdict: no item or case.

**2. Proof**

- Proof 1. Report, NOT-done item 1: "together hold 1210 removed and 799 added lines against the round 1 state (`diff -U0` ...)". The table of the same section sums to 1210 and 799 (eeg-saad row "17 / 8"), but the report's own "Every changed line" holds 1764 `-` lines and 799 `+` lines (eeg-saad 34 and 8), and my `diff -U0` of H against B over every deck prints 1792 removed and 810 added. The decision resting on it: how much was cut, which the coordinator reads to decide whether to send the round back. Failure scenario: the stated scale of the cut is low by a third. Verdict: ruling 1.
- Proof 2. Report, NOT-done item 4: "The panels no longer drawn:" names nine decks. `grep -c "figure:"` over B prints 19 decks; over H, 0. Not named: bttn-incident-af, ms-lipid-handshake, block-term-tensor-regression, extended-bttr-note, fbttr-strategies, go-bttr, dongho-ecg-clustering, abduction, source-localization, sandpile-operator. Failure scenario: the reader takes nine for the list and looks for figures on ten decks that have none.

**3. Standards**

- Standards 1. Report, Round 2, first paragraph: "Nothing the round brief asks for is left unbuilt." then item 1. What is wrong: `agents/spec.md` Report, "First line: anything NOT done". The first sentence says nothing is undone and item 1 under it says facts were cut contrary to ruling 1. Failure scenario: a reader who stops at the first sentence takes the round as complete. Verdict: ruling 1.

**4. Behaviour**

- Behaviour 1. All 95 decks draw no figure now (`grep -c "figure:"` over H: 0; over B: 19 decks, 26 panels). The report states this for nine decks, without saying no deck draws a figure. Failure scenario: at the look, the portfolio deck and every project slide are text only, and the report does not say to expect that. Verdict: none on its own; see Proof 2.

### Declined to judge

- Ruling 3, C9 and the report's measurements (first 115, final 0): the fit on a page is the session's, and this review starts no server and opens no page.
- Whether the Chrome and scratch server are stopped: settled only by a port or process check on 8796 and 9340, which the limits bar.
- The collision inside ruling 1 between "a second slide is rare" and "a fact that cannot stand on one slide is the reason for a second slide" over 82 fact-dense decks, and whether 13 second slides is rare enough: the user's call.
- bt-operator-theory: `README.md:83` records "Blocking corrections" to Theorem 1 and the ordering (`next:` in the manifest repeats it), while the slide states the manuscript's factor and the ordering. The brief's precedence gives the manuscript and the report lists the disagreement; whether ruling 6's "the project's current framing" overrides that is the user's.
- Whether a slide may keep second-slide reasons by folder rather than need (Spec 1) beyond what the report states: the user's.
- Claims on the 36 read decks were compared with sources line by line only for the lines round 2 changed and where a doubt arose; the unchanged lines rest on round 1's trace.
- Numbers the check left unresolved in unread decks (bachelor-network-ids, icfp-src-poster chart values, masters-algebraic-subtyping): not traced by hand; the poster chart values need a render.
- Whether the five `plan.md` line additions in the worktree are the orchestrator's: `git log` is outside the git this review runs; they are Ruling lines and O173/O174, not builder work by their text.
- The report's "every line read" statement for the 17 issues (its wording) against the unread decks: not checkable from here beyond the 36.

Reviewer usage: a6bfcba59bb3a80aa, claude-opus-5-5, 379076 tokens, 54 tool uses, 15.1 min.
