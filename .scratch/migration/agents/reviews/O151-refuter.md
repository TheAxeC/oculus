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
