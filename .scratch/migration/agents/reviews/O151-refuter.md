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

# Repair round 1, refuted

Usage: a6df3635a2e3bb58c, claude-opus-5-5, 274604 tokens, 70 tool uses, 10.8 min

## Verification lines (verbatim)

All from the O151 worktree; before each vitest or svelte-check run, `ps -Ao command | grep -E 'vitest|svelte-check' | grep -v grep` printed nothing.

- `npm run test:quick`: `test:quick: 8 changed file(s), from git since HEAD` / `test:quick: 10 test file(s)` / `ok prettier (0.7 s): All matched files use Prettier code style!` / `ok ASCII gate (0.8 s)` / `ok svelte-kit sync (2.3 s)` / `ok eslint (3.0 s)` / `ok svelte-check (9.1 s): 1794061813881 COMPLETED 585 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` / `ok vitest checks (39.9 s): Duration 28.82s ...` / `test:quick: 42.4 s; every command passed`
- G14 over the scratch hub: `Test Files 1 passed (1)` / `Tests 14 passed (14)`
- The perl ASCII gate over `src tests bin config`: `find: bin: No such file or directory`, nothing else, rc 0.
- `LC_ALL=C grep -rn -I '[^ -~]' .agents/hub`: 13 lines, each an accented letter in a real name (Stéphanie, Linköping, Östergötland, Düsseldorf).
- `wc -l`: `364 Project.svelte`, `251 Facts.svelte`, `74 slide.css`, `384 tests/checks/config/integrity.test.ts`.
- History-word grep over the `+` lines of `git diff 391708a81 -U0 -- src tests`: one hit, "before" used spatially.
- `find .agents/hub/projects -name present.yml | wc -l`: `95`.
- `sh utils/unused-exports.sh | diff - ../O151-base/unused-exports.txt`: no output, rc 0.
- The case-run program: `decks=95 decks_with_equation=56 problems=0`; kinds `project,columns 86`, `project,equation 5`, `project 4`; `cases.ts` equals the report's quoted source.
- Snapshot against worktree: the three `src` files identical; `diff -rq` of the decks lists 95 `main.md` and `glassbox-decision-pipelines/present/age_dumbbell.png` (945 by 686).
- A `cmp` loop of every worktree deck file against the scratch hub copy: `differ=0`, so checkpoint 4 measured the decks as they stand.
- Number tokens lost per deck from the snapshot to now: none, in all 95 decks.
- The builder's round-1 outputs: `testquick-r1.txt` ends `test:quick: 55.9 s; failed: eslint` (`integrity.test.ts 94:37 ... no-unnecessary-condition`); `testquick-r1b.txt` ends `test:quick: 50.0 s; every command passed`.

## Verdicts

Items: 1 holds; 2 partial (Spec 2, Spec 3); 3 partial (Spec 4); 4 violated (Spec 1); 5 holds; 6 holds; 7 holds.

Cases: C1 to C6 met; C7 partial (Proof 3); C7b met on the sample; C8 met; C9 partial (Spec 5); C10 met; C11 partial (Spec 2); C12 to C16 met.

## Spec

- Spec 1, item 4 violated: cirrhosis-digital-twin slide 1 (85 px), covert-theory slide 1 (2 px), fed-multicellular-immune slide 1 (2 px) are too tall at checkpoint 4 (`O151-look.md`), the decks byte-equal to the measured copies.
- Spec 2, cirrhosis-digital-twin facts dropped: "Checked 2026-11-03 against the call texts" (README.md:36); the funding.yml key `pioneers-in-healthcare-pihc-innovation-fund` (README.md:38, :50); Guichelaar as main applicant (README.md:16); the "up to" of each grant ceiling (README.md:39, :43); "a working dataspace" (README.md:20); "their effect on liver outcomes" (README.md:7); the voucher type "technological pioneering in healthcare" (README.md:15).
- Spec 3, "public" dropped: covert-theory's "the synthetic-validation code is public"; fed-multicellular-immune slide 1 line 11 "seven public CELLxGENE atlases". The facts strip draws code status as `deposited` and datasets as keys (`src/lib/data/shapes/project-facts.ts:85,135,153`), neither saying public.
- Spec 4, ecg-readable-substrate: slide 2's heading "FMs given age too: 5 wins, 1 tie, 6 losses" repeats slide 1's result (item 3).
- Spec 5, individual-reference-intervals `main.md:8` purpose "may hide early warning signs" traces to no manifest key (C9).
- Spec 6, unapproved scripts: the number-token comparison (source and command not given, no file), `<scratchpad>/o151/s1lines.py`, `s2lines.py` and `cols58.py`; none changed a file; the three estimators are not named in the report as scripts.

## Proof

- Proof 1: report:103 "Everything in the brief is done, ..." stands over two NOT DONE rows (:188, :200).
- Proof 2: report:6's estimate (only cirrhosis slide 2 at the limit) is contradicted by checkpoint 4.
- Proof 3: round-0 evidence left stale: the case-run output (from report:2988, linfoot-estimator `kinds=project,image`, now `columns`), the trace (from report:302; the cirrhosis rows :576-580), the DONE row "Case-run program files gone before the report" (:199, the files exist), and the 25 `diff -u` blocks of round 0.
- Proof 4: `integrity.test.ts`'s planted case retitled, `expect(drawn).toBe(2)` and `expect(writtenEquations(text)).toBe(2)` changed to `toBe(3)` with a planted equation slide; no before-and-after row and no G14 run of the builder's own before the change.
- Proof 5: two `test:quick` runs this round (red on eslint, then green); the report gives one.

## Standards

- Standards 1: `tests/checks/config/integrity.test.ts:111-120` `hubRecords` looks a record up as `isMap(held) ? held[id] : undefined`, where the deck route uses `byKey` (`src/lib/server/content/deck/read.ts:97-100`, `src/lib/data/helpers/guards.ts:57-59`); an id such as `__proto__` gives a record the app does not find.
- Ruling 4 (negation-contrast) and ruling 5 (past dates): no finding.

## Behaviour

- Behaviour 1: cirrhosis-digital-twin slide 2 line 35 "tenure(-track) applicant Amir Haeri, Axel (fixed-term postdoc) holds it" can be read as Axel holding a tenure-track post (README.md:43: Axel cannot apply; the funded position can be his). ecg-readable-substrate slide 2 "ECG-JEPA +0.013 CODE-15 to MIMIC" sets its sign opposite to the bullet above and no longer says ECG-JEPA leads; "1-year all-cause mortality" (README.md:3) became "one-year mortality".
- Behaviour 2: ten `image` second slides became `columns` slides; figure sizes on screen are for the look.

## Declined to judge

- Shell assembly of the report or a deck this round, and whether the builder opened a deleted-run file: need the transcript.
- Which main-checkout ledger file the builder read.
- Pixel fit and readability of the columns-slide figures and of the glassbox figure: for the look.
- Whether `pdftoppm` or `sips` made `age_dumbbell.png`.
- Dropped words in the 88 decks not read (their number tokens are all kept).

# Closed

The first review's findings went to the builder in repair round 1 (`agents/briefs/O151-round-1.md`); the run over the round is closed at landing as follows. The deck fixes were made in the step's `.agents/hub/projects/`, laid over the scratch hub by the round's copy command and measured on 8799 (`agents/reviews/O151-look.md`, "Landing").

- Spec 1 (three slides too tall), fixed at landing: covert-theory slide 1, its second Results item written in 66 characters so it takes one line (the Kurdyka-Lojasiewicz convergence at sigma = 0 is on slide 2's list); fed-multicellular-immune slide 1, its second Method item written as "Incomplete panel (vertical FL: shared donors, own loadings back)." (slide 2's heading states the summed donor Gram is exact, the hook that the sites sum donor Grams); cirrhosis-digital-twin rewritten across its two slides with nothing dropped. The Findings view after every slide of the portfolio deck was drawn holds no "slide too tall".
- Spec 2 (cirrhosis-digital-twin facts), fixed at landing: "Calls checked 2026-11-03", the key `pioneers-in-healthcare-pihc-innovation-fund`, Guichelaar as main applicant, "up to" on each grant ceiling, "a working dataspace", "their effect on liver outcomes" (in the hook) and the voucher type "technological pioneering in healthcare" are each on a slide again; the second spec reads "PIHC again, clinical or data".
- Spec 3 ("public"), fixed at landing: covert-theory's Next spec "wait for the decision; synthetic code public"; fed-multicellular-immune's Data spec "seven public CELLxGENE atlases".
- Spec 4 (ecg-readable-substrate repeat), fixed at landing: slide 2's heading is "The comparison as submitted and at equal input".
- Spec 5 (individual-reference-intervals purpose), fixed at landing: "Event prediction judges lab values against population-wide normal ranges; the bet was that per-patient baselines could sharpen it.", from the manifest's `eli5`.
- Spec 6 (unapproved scripts), closed under the standing ruling of open items 337 (a) and 715 (a), which Axel gave twice: the number-token comparison and `s1lines.py`, `s2lines.py` and `cols58.py` in the scratchpad `o151` folder are recorded here, none changed a file, and nothing they printed is used; the number-token claim rests on the reviewer's own `comm` loop and the fit on the look's measurements.
- Proof 1, Proof 2, Proof 3 and Proof 5 (the builder's report): closed by this record. The report's success line, its estimate, its round-0 trace, case-run output, DONE row on the case-run files and `diff -u` blocks are superseded by the two reviews and the look; the report is the builder's record and is kept as written. The round's `test:quick` ran twice, red on eslint at `integrity.test.ts:94:37`, then green.
- Proof 4 (the planted case), read at landing: the case now plants an equation slide as well, so both counts of the case are 3 where they were 2; the change follows the round's ruling 2, and the case still fails when the two counts differ.
- Standards 1 (`hubRecords`), fixed at landing: the lookup is `byKey(entities, id)` as `src/lib/server/content/deck/read.ts:98` reads it, `byKey` imported from `guards.ts`.
- Behaviour 1, fixed at landing: cirrhosis-digital-twin reads "tenured or tenure-track applicants, so Amir Haeri; the position can be Axel's (fixed-term postdoc, cannot apply)"; ecg-readable-substrate reads "ECG-JEPA leads by 0.013 CODE-15 to MIMIC" and "1-year all-cause mortality".
- Behaviour 2 (figure sizes on the columns slides), fixed at landing as far as the layout allows: on clinical-hccnet, raw-pls, ward-bttr-crosssubject, hccnet-revision and dries-bttr-ecg, items moved into the text-only column and written in fewer words, every fact kept; the figures are drawn 215 x 126, 216 x 152, 116 x 91, 194 x 208 and 250 x 182 design px (`agents/reviews/O151-look.md`, "Landing"), since a Markdown image on a columns slide takes only the room its column's text leaves (`docs/decks.md`).
