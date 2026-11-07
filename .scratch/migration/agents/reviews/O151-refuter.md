# Step O151 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151, base 391708a81)

Reviewer usage: a35359bb43448153a, claude-opus-5-5, 94045 tokens, 95 tool uses, 15.3 min.

Not done in this step, and the first things the orchestrator acts on:
- Item 4 is violated. The look counts 94 too-tall slides out of 124, 19 to 696 px over, median 307 px. The deck text goes past Decision 4's starting size, and the short titles that Decision 6 allows were not used (Spec 3).
- Item 5 is violated. G14 is red over the scratch hub, 3 failed and 11 passed. The cause is the test's reading of the decks, not the decks (Spec 4).
- The builder's opening line says the brief is done, while its own table marks item 4 NOT DONE (Proof 1).
- The report was assembled with an unapproved script (Spec 1). Nothing that script produced is used as evidence in this review.

## Verification (rerun by the reviewer)

All commands were run in the foreground from the worktree root, unless noted.

```
ps -Ao command | grep -E 'vitest|svelte-check'
  -> only the grep itself; no other run

npm run test:quick
  test:quick: 4 changed file(s), from git since HEAD
  test:quick: 9 test file(s)
  prettier ok, ASCII gate ok, svelte-kit sync ok, eslint ok,
  svelte-check: 585 FILES 0 ERRORS 0 WARNINGS, vitest checks ok
  test:quick: 44.0 s; every command passed

perl ASCII gate over src tests config (no bin)
  -> printed nothing, rc=0

LC_ALL=C grep -rn -I '[^ -~]' .agents/hub
  -> 10 text lines, the same 10 the builder quotes; the only non-ASCII is
     <e acute> x2, <o umlaut> x9, <O umlaut> x1, <u umlaut> x1, in the names
     St<e acute>phanie, Link<o umlaut>ping, <O umlaut>sterg<o umlaut>tland,
     D<u umlaut>sseldorf; 20 binary figure files

wc -l Project.svelte Facts.svelte slide.css
  -> 364, 251, 74 (689 total)

git diff 391708a81 -U0 -- src, history-word grep over the added lines
  -> one hit, "The dot before a hued value": spatial, and already in the base comment

find .agents/hub/projects -name present.yml | wc -l
  -> 95

sh utils/unused-exports.sh | diff - .agents/worktrees/O151-base/unused-exports.txt
  -> rc=0 (base list 334 lines)

git status --short
   M src/lib/themes/slide.css
   M src/lib/views/academic/present/parts/project/Facts.svelte
   M src/lib/views/academic/present/parts/project/Project.svelte
  ?? .scratch/migration/agents/reviews/O151-report.md

read-only node program over the 95 decks (read from stdin, writes nothing)
  -> decks=95 with_front_equation=56 front_equations=56 equation_slides=5 decks_with_problems=0
     every present.yml is exactly {deck:{title}, order:[main.md]}, and deck.title equals the
     manifest title; every deck has 1 or 2 slides, the first kind: project and the second an
     allowed kind opening with an h1; no unknown key; tag.class always valid; no missing or
     unnamed figure; the 56 front-matter equations and the 5 equation-slide $$ bodies all
     typeset through katex with no katex-error; placeholders only in adapter-format-theory
     and strokeop ({{project.venue}})

bash -c cmp loop over the 20 figure files and the project trees
  -> 19 byte copies of project files; glassbox age_dumbbell.png (227 by 164) comes from
     admin/talk/figures/age_dumbbell.pdf (226.772 by 164.409 pt) by sips
```

The whole verify list was not rerun (it runs at landing), nor G14 (see Declined to judge). For G14 and the slide fit the review uses the orchestrator's look, `agents/reviews/O151-look.md`.

## Verdicts

Items of the brief's "What to build":

- 1: holds. 95 deck folders under `.agents/hub/projects/`. The `present.yml` shape is exact and its title equals the manifest title (node program). 19 figures are byte copies, and the glassbox figure was converted from its PDF with sips (cmp loop).
- 2: holds on the sample. 14 decks traced line by line against their README, manuscript and manifest, and the numbers match, apart from two exceptions in clinical-hccnet (Spec 2).
- 3: holds. Every second slide is of an allowed kind and opens with an h1. 56 decks carry a front-matter equation and 5 a `kind: equation` slide (node program).
- 4: violated, Spec 3 and Proof 1. The look found 94 too-tall slides.
- 5: violated, Spec 4. G14 fails 3 of 14 over the scratch hub (look).
- 6: holds. `Project.svelte:149` `{#if right}` with `:73` `const right = $derived(slide.equation !== undefined || figures.includes(false));` removes only the empty `.right` element. The look shows `ideas/fedlink` with no `.right` and a left column 1023 px wide.
- 7: holds. `slide.css:24-25` sets `--slide-design-fact: 12px; --slide-fs-fact: calc(var(--slide-design-fact) * var(--text-scale, 1));` on `.slide-frame`, 11 px under rice at `:73`. `Facts.svelte:160` sets `--fact-label: calc(10em / 12);` and `:167` `font-size: var(--slide-fs-fact);`. Every surface that draws a slide sits inside `.slide-frame` (`Stage.svelte:87`, the print route `+page.svelte:184`). `docs/decks.md:166` and `:383-391` stay true.

Cases:

- C1: met. `find ... -name present.yml | wc -l` gives 95.
- C2: met. The `present.yml` shape is exact for all 95 (node program).
- C3: met. Each deck has one or two slides, the first `kind: project` (node program).
- C4: met. The second slides are allowed kinds with an h1 (node program).
- C5: met. No unknown key, and `tag.class` is valid everywhere (node program).
- C6: met. Every figure is present and named; 19 byte copies, 1 converted by sips (cmp loop).
- C7: met on the sample, partial for clinical-hccnet (Spec 2).
- C7b: met on the sample, partial for clinical-hccnet (Spec 2).
- C8: met. ms-lipid-handshake traces to README:28-36, :60 and :78-89. The builder reports that the README and the manifest disagree on whether the project was solo or had collaborators.
- C9: met. Every line of individual-reference-intervals traces to a manifest key.
- C10: met. The reviewer's own `diff -u` of the old hub raw-pls `main.md` against the new one shows the old +0.070, +0.34, +0.42, +0.18, +0.43 and the synthetic +0.39/0.41/0.23 gone; the new numbers trace to README:23-26, :79-92 and main.tex.
- C11: met. cirrhosis-digital-twin carries README:7-50, the proposal and the funding options included, on a columns second slide.
- C12: met (look).
- C13: met (look).
- C14: met by the brief's wording, since the equations typeset (node program). G14 is still red (Spec 4).
- C15: met (look). `.facts` 12px, its label 10px, a Method item 13.5px.
- C16: met. The glassbox `age_dumbbell.png` is 227 by 164 px, converted from the 226.772 by 164.409 pt PDF. It draws small (Behaviour 1).

## 1. Spec

- Spec 1, script, report section "Files changed by a shell command": "the 25 `diff -u` blocks of this report were assembled with shell redirects, `sed -i` and `mv` without the approval `spec.md:66` asks for". An unapproved script that changed files (`spec.md:66`); the standing rulings on open items 337 and 715, both (a), apply. The scratchpad outputs were also written by `>`. Failure scenario: a reader takes the assembled diff blocks as evidence when a redirect or `sed -i` has silently changed them. None of these blocks is used here. Verdict: none on an item.
- Spec 2, `.agents/hub/projects/manuscripts/clinical-hccnet/present/main.md:15`: `- { label: "Coauthors only", value: "... choosing encoder sizes on the held-out patients moves their next-scan fusion AUROC from 0.922 to 0.940" }`. README:29 places the 0.922 to 0.940 size-selection shift "for a response to reviewers", not as a coauthors-only fact. The deck also leaves out the open PT_318 endpoint-date check (README:71); `grep -rln PT_318 .agents/hub/projects/` finds nothing, rc=1. PT_318 is the only HCC patient behind the held-out 3-year 0.929 (15/1). Failure scenario: a reviewer-response number shown in the coauthors-only frame, or the 0.929 shown with no sign that it rests on one patient whose date is unchecked. Verdict: C7 and C7b partial.
- Spec 3, item 4 and Decisions 4 and 6, deck text length across the 95 decks (node program counts): 83 of 95 sub lines over 90 characters (longest 219); 64 titles over 70 characters (longest 173, dries-bttr-ecg; meseret 152), and no short title used though Decision 6 allows one; 306 of 512 list items over 20 words (longest 44); 19 eli5 lines over 30 words; 16 decks with more than 4 specs (dongho, glassbox and hccnet-fl have 6); 7 decks with 4 results items; 22 decks with a "Dead ends" spec, the longest value 53 words. The builder's report lists the six- and five-spec rows knowingly. Failure scenario: 94 of 124 slides draw too tall (look); the fit factor bottoms out at 0.75 and the content still runs past the foot; on slide 3 the facts strip is never reached. Verdict: item 4 violated.
- Spec 4, item 5, `tests/checks/config/integrity.test.ts` (G14), per the look: two of the three failures come from G14's `readDeck`, which reads with `noRecords` (`record: () => undefined`), so `{{project.venue}}` in `ideas/adapter-format-theory/present/main.md:4` and `ideas/strokeop/present/main.md:4` resolves to "holds no value". The app reads with hub records (`src/lib/data/sources/documents/decks.ts`, `snapshot/hubs/deck-facts.ts`), and both manifests hold a venue (`venue: jmlr`, `venue: media`, each `project.yml:15`, records at `venues.yml:290` and `:355`). The third failure, "expected 61 to be 56", comes from `writtenEquations` (`integrity.test.ts:75-85`), which counts only a front-matter `equation:`, while the brief allows the five `kind: equation` second slides. Failure scenario: landing runs G14 over the hub and goes red on decks that draw correctly in the app. Options: (a) G14 reads with the hub records and counts the bodies of equation slides as written equations, recommended, it ends the test defect; (b) the decks write the venue in words and drop the equation slides, the lazy option. Verdict: item 5 violated.
- Spec 5, report section on sources: the builder read the PDFs with `pdftotext -layout` into scratchpad files after the Read tool returned "[media removed: request limit]"; the brief names main.pdf read through the Read tool's pages. Layout extraction can lose equations and tables; the sample found no misplaced number. Verdict: none.

## 2. Proof

- Proof 1, `agents/reviews/O151-report.md:3`: "Everything in the brief is done, with one breach of the rules file and one proof left to the look." The builder's own table says at `:88` "Every slide fits the frame (item 4) | NOT DONE by the builder" and at `:100` "Report assembled without an unapproved shell command | NOT DONE". The rules file's Report section requires a report to open with what is not done. Failure scenario: the step taken as complete and landed with 94 too-tall slides and a red G14. Verdict: item 4 violated (Spec 3).
- Proof 2, the report's claim that every assembled block matches a fresh `diff -u` ("Verify outputs", item 8): the check was produced inside the scratchpad run Spec 1 covers, and is not used. Verdict: none.

## 3. Standards

- Negation-contrast phrasing in the deck text, which the brief's Conventions ban: 18 hits, among them `archive/published/2026/dongho-ecg-clustering/present/main.md:5` (hook "... is decided by the ECG representation, not the clustering algorithm") and `:28` (headline "The representation, not the algorithm, decides ECG clusterability"), `manuscripts/ward-bttr-crosssubject/present/main.md:26` ("the behavioral alignment, not the decoder, crosses the grid"), the meseret deck `:9` ("competing events in time, not as three classes"), the hccnet-pathology deck `:21` ("trained on P(HCC), not on pathology ground truth") and the fed-neural-operators deck `:20`. Some are factual statements of scope that stay once reworded into a positive form. Failure scenario: a phrasing Axel bans on every deck he presents. Verdict: none on an item.
- Code comments in `Project.svelte` (`:15-19`, `:70-72`, `:277-281`), `Facts.svelte` (`:21-29`, `:154-158`) and `slide.css` (`:12-17`, `:63-66`): none; ASCII, no history, they describe the code as it is.

## 4. Behaviour

- Behaviour 1, the glassbox figure `age_dumbbell.png`, 227 by 164 px: a figure this small draws small, or scaled up and soft, on a 1280 by 720 slide; the report does not state its size on screen. Failure scenario: an unreadable figure when presented. Verdict: none (C16 met).
- Behaviour 2: the report states the change from 25 hub decks to 95. The premise correction reproduces: the hub's 25 old decks are 14 `kind: project`, 9 `idea` and 2 `text`, with 38 figure files. A slide with no panels loses its empty right column, and the facts strip becomes 12 px with 10 px labels. Verdict: none.

## Declined to judge

- Whether the builder opened the deleted run's files: the scratchpad `o151` folder held the deleted run's 2026-11-06 files (cases.py, keys.py, sync.sh, compare.py, cases-final.txt, integrity.txt and others) beside this run's files. Settling it needs the builder's transcript.
- The pixel fit of each slide and how the 227 px figure renders: the look's to judge.
- A rerun of G14 and of the builder's case-run program: G14 needs a scratch hub, and the case-run files are deleted.
- The vite-node hazard: the builder reports that running with the repository's vite.config started the mail, calendar and HPC pollers and that two runs went 35 and 50 minutes; not reproduced, since that starts the pollers.
- Hub data outside the step: modulation-lmp-bci and highgamma-event-detection carry the same abstract in their PDFs; hccnet-fl's README:47 and manifest still say "present at FLTA (Paris, 29 October 2026)", a past date; the fed-faithful-ecg and covert-applied CLAUDE.md files are stale.
- Which ruling "the dead-ends ruling" means: read as ruling 685 with the READMEs' dead-ends sections (33 reproduce).
- Whether `.gitignore` covers `.agents/hub`: needs `git check-ignore`.
