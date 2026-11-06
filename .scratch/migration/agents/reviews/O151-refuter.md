# Step O151 refuter report (on .agents/worktrees/migration-O151, base aee6d1946 in oculus; the change is in the research hub against its HEAD e0d231cb0)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ cd ~/workspace/oculus && OCULUS_TEST_HUB=~/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts
 Test Files  1 passed (1)
      Tests  14 passed (14)

$ python3 <reviewer scratch>/refO151/enum.py        (own enumeration: every project.yml under projects/, code/ left out, yaml.safe_load)
manifests 99 research 95
with deck 95 without 0
('accepted', ('project',)) 1 | ('de-risking', ('idea',)) 5 | ('exploring', ('idea',)) 3 | ('exploring', ('project',)) 3
('failed', ('project',)) 3 | ('in-prep', ('project',)) 1 | ('nascent', ('idea',)) 12 | ('published', ('project',)) 30
('scoping', ('idea',)) 7 | ('stopped', ('project',)) 4 | ('submitted', ('project',)) 1
new not research or missing: []
(the 70 new present/ folders from `git status --short projects deck` equal the 70 of <scratchpad>/O151-projects-list.txt: diff prints nothing)

$ cd ~/workspace/research-hub && bash -c "find projects -path '*/present/*' \( -name '*.md' -o -name '*.yml' \) -not -path '*/code/*' -print0 | xargs -0 env LC_ALL=C perl -ne '...C9 as the brief gives it...'"
(prints nothing) exit 0

$ python3 <reviewer scratch>/refO151/keys2.py       (own C7 read: project keys of project.ts:4-5 plus kind, desc, notes; idea: kind, desc, notes; text: kind, notes)
decks 95
slides 255 {'project': 210, 'text': 9, 'idea': 36} unread 0 untitled [] multi []
(no ORDER MISMATCH line: every present.yml order names exactly the .md files of its folder)

Report's quoted commands, rerun read-only:
$ python3 <scratchpad>/O151/cases.py <scratchpad>/O151-projects-list.txt
C1 research 95 with deck 95 without 0
C1 of the 70 with deck 70
C7 slides with unread keys 0
$ python3 <scratchpad>/O151/keys.py   ->  decks 95 with unread keys 0
$ python3 <scratchpad>/O151/compare.py <scratchpad>/O151-before-split ~/workspace/research-hub
decks with a difference: 2   (ecg-readable-substrate, fed-faithful-ecg: only the added section headings)
$ git status --short projects deck : 143 '??' and 32 ' M' under projects/, every one under a present/ folder; ' M deck/present.yml', ' M deck/title.md', ' D deck/transition.md' (O150's); git status --short outside projects/ and deck/ lists only .oculus/data/academic/funding.yml and funding/2026-fwo-senior-transplant/ (Axel's)

Own checks:
$ python3 <reviewer scratch>/refO151/figs.py        (every figure: of the 70 new decks, exists, suffix, drawn by an \includegraphics of the project's manuscript or under results/)
22 figures, all OK, all 'drawn' or 'results'; no PDF named
$ python3 <reviewer scratch>/refO151/preserve.py   (old main.md at HEAD against the concatenated split files, numbers and words, for the 16 split rich and text decks)
no number lost in 16 decks; lost words only the keys 'extra', 'label', 'body' (btfno, covert-applied) and 'diagram_html' (covert-theory, key read by project.ts:60 and kept in method.md); the raw-pls and meseret word counts were confirmed by reading the files whole (a regex artefact on '<=128')
```

The look (C4's Findings view, C5, item 4) was not rerun, as the review instructions say.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: violated. The 70 decks exist with present.yml and main.md, the kinds follow the vocabulary and every figure is a drawn raster. But comparator numbers are written without the intervals the source gives them (Spec 3). `results:` is filled from the manifest's `outcome` where the brief allows only the manifest's own `results` (Spec 4). The connectivity-motor-imagery result is selected so that it overstates what the source shows (Spec 5). Prose breaks the rules file's construction rule (Standards 1). The split into several slides is not shown to follow decision 1 (Spec 2).
- 2: holds. My key read prints no untitled slide. `btfno/present/main.md` and `covert-applied/present/main.md` carry `notes:` holding the old label and body, and no `extra:`. The words stay; the `<i>` markup of the btfno body was dropped (Standards 3).
- 3: violated. 18 slides stay Too tall by the report's own account (open item 693, booked at `orchestrator-state.md` "Open items"). There is also no record that each slide that was split was Too tall before the split (Spec 2, Proof 1).
- 4: violated. By the report, 18 "slide too tall" findings remain under `present/`. Not rerun here.

Cases of the brief's "Cases":

- C1: met. The enumeration rerun gives 95 with a deck and 0 without. The 70 new folders equal the brief's list.
- C2: met. Counted by stage in my enumeration. I read the README of each of the 8 exploring or de-risking projects with an idea slide: each holds no run and no result (fed-duplication-limits `README.md` "Results": "None. No code, no runs"; strokeop, pathology-tensor-mil, conformal-tensor-factors and serial-ecg-af have no results section). linfoot-estimator, sandpile-operator and engram hold a method and results, and each has a project slide.
- C3: partial. Missing: intervals on comparator numbers (Spec 3), a selective claim (Spec 5), results taken from `outcome` (Spec 4), and one place the report does not give (Proof 2).
- C4: partial. The integrity test is green (rerun). The Findings view, by the report, lists 18 Too tall findings under `present/` (item 4, Spec 1). Not rerun.
- C5: partial. By the report, 18 Too tall tiles. Not rerun; see "Declined to judge".
- C6: met. figs.py: all 22 figures of the new decks exist, are PNG, JPG or JPEG, and are drawn by an `\includegraphics` of their manuscript or sit under `results/`.
- C7: met. keys2.py and the report's two scripts all print 0 unread keys.
- C8: met. See the git status lines above.
- C9: met. The perl check prints nothing.

## 1. Spec

- O151-report.md "The cases' first run on the unchanged hub": "C1, C2, C3, C5, C6, C7, C8 and C9: no first run on the unchanged hub is on record."; what is wrong: the brief's Cases section says "The first task is the first run of every case on the unchanged hub, before any change; the report gives that run before the result table". Only C4 has one. Most importantly, C5 has none, so which of the 25 existing slides were Too tall at HEAD is unknown. The report states this gap but still calls "Every other item and case" met; failure scenario: a reader of the landing cannot tell whether a split of an existing deck answered a Too tall finding (item 3) or reshaped a slide that fitted; verdict: item 3, C5.
- every new project deck, and the 16 split existing decks, for example `projects/archive/published/2017/icfp-src-poster/present/present.yml` "order: [main.md, method.md, results.md]" with `results.md` holding one bullet, and `projects/archive/failed/fed-faithful-ecg/present/main.md` cut to its title and one-liner; what is wrong: the brief's decision 1 says "A deck is one `main.md` with one slide ... split into more slides only where the slide is too tall". The report describes a fixed template instead: "A project deck is split one part per slide: `main.md` (...), then `plain.md`, `method.md`, `results.md` and one slide per figure, as its sources fill them". Every one of the 41 rich new decks and all 16 rich and text existing decks were split; only the two manifest-only decks have one slide. No measurement of an unsplit new deck is on record (the before-split copy `<scratchpad>/O151-before-split` holds the 70 unsplit, for example `icfp-src-poster/present/main.md` as one slide, but no Too tall reading of them is quoted). The result is 255 slides where the step needed one per project plus splits; failure scenario: the portfolio deck grows to 258 slides, many holding one line (icfp-src-poster's results slide, fed-faithful-ecg's main slide) that would have fitted on one slide; verdict: item 1, item 3.
- `projects/archive/published/2025/fbttr-strategies/present/results.md:11`: "FedAvg average r: <b>0.64 $\pm$ .05</b>, 0.48 $\pm$ .05 and 0.68 $\pm$ .05 for subjects 1 to 3, against 0.66, 0.48 and 0.66 for centralized BTTR."; what is wrong: the source gives the comparator its interval (`manuscript/latex/main.tex:524`, `:546`, `:568`: "0.66 $\pm$ .03", "0.48 $\pm$ .05", "0.66 $\pm$ .05"), and the brief says "Every number keeps its interval and qualifier as the source states it". The same stripping occurs elsewhere:
  - `extended-bttr-note/present/results.md`: "against 0.54, 0.39 and 0.62 for LSTM" (source `:323`, `:344`, `:365` give +/- .04, .04, .05) and "against 0.38 for BTTR and 0.36 for HOPLS" (source `:317-318` give +/- .02, .03).
  - `block-term-tensor-regression/present/results.md`: "against 0.63 for HOPLS, 0.42 for AM and 0.54 for LSTM" (source `bare_jrnl.tex` subject-1 table gives +/- .04, .03, .04).
  - `abduction/present/results.md`: "0.04, <b>0.36, 0.37 and 0.37</b>" and "0.14, 0.32, 0.28 and 0.22" (source `manuscript/main.tex:246`, `:254` give +/- .05, .08, .04, .01 and .05, .07, .04, .01).

  failure scenario: a reader comparing "0.64 +/- .05 against 0.66" sees one interval and cannot judge whether the two overlap, and reads the federated result as stated with more certainty than its comparator; verdict: item 1, C3.
- `projects/archive/stopped/algebraic-subtyping/present/main.md:17`: "results:\n- Not pursued into a standalone paper; the Master's thesis and the CW708 compilation report are published separately." and `projects/coauthor/stopped/individual-reference-intervals/present/main.md:17`: "- Abandoned; not pursued to a full paper."; what is wrong: neither manifest has a `results:` key (`cat project.yml` of each). The text is the manifest's `outcome`. The brief says that for a manifest-only project the slide gets "`results` only from the manifest's own `results`". The bullet is also a status, not a result. `connectivity-motor-imagery/present/results.md` likewise puts "The full journal paper was never finished; only the abstract was presented" (the manifest's `outcome`) under Results; failure scenario: the slide's Results heading shows a project-status sentence, and a reader of a stopped project's deck takes "Abandoned" for a measured finding; verdict: item 1, C3.
- `projects/archive/stopped/connectivity-motor-imagery/present/results.md`: "On the simulated three-source pattern, the estimate recovers $x_3(n) = 0.8x_3(n-1)$ exactly and $x_1$'s first lag at 0.5." The same selection is in `abduction-bci-meeting-2021/present/results.md`: "The estimate recovers $x_3(n) = 0.8x_3(n-1)$ and the first lag of $x_1$ at 0.5"; what is wrong: the manuscript's estimate (`manuscript/main.tex:150-156` against the truth at `:138-144`) also gives $x_1(n-2)$ as -0.4 against a true -0.7, $x_2$'s lags as 0.77 and -0.28 against 0.7 and -0.5, and a spurious $0.14x_3(n-2)$ term in $x_1$. The slide quotes only the two coefficients that match. The hub `CLAUDE.md` Hard rule "Research integrity ... never overclaim a positive" and the brief's "every number keeps its ... qualifier" both apply; failure scenario: a reader concludes the method recovered the simulated connectivity, when the source shows two coefficients right and several wrong; verdict: item 1, C3.
- `projects/ideas/cirrhosis-digital-twin/present/main.md:3`: "desc: 'An idea with Maureen Guichelaar (MST hepatology): use the clinical record of patients with cirrhosis (lab values, GP visits, medication, imaging) to predict cardiovascular events and liver outcomes for each patient, and to compare what different treatments would do.'"; what is wrong: the project's `README.md:3` says it "starts from Maureen's proposal to the Pioneers in Healthcare (PIHC) Innovation Fund 2025, which she shared in confidence ... keep the proposal within this project". The desc carries that proposal's aims: multi-organ prediction, and treatment comparison, which is the proposal's "in silico testing" (`README.md` "The 2025 PIHC proposal"). The brief says "Nothing a source marks confidential or another person's unpublished proposal reaches a slide". The slide sits in the project's folder, but O150's group puts every research deck in the portfolio deck, which `deck/present.yml:1` calls "a public artifact"; failure scenario: a public talk from the portfolio deck shows the aims of Guichelaar's unpublished, confidential PIHC proposal under her name; whether the joint idea's aims may appear at all is Axel's call (an open item); verdict: item 1.
- <scratchpad>/O151/compare.py, keys.py, sync.sh and the in-page JavaScript named in the report's "Scripts written for the step"; what is wrong: the brief builds no script under "What to build" and no line of `plan.md`'s Rulings approves these. cases.py and keys.py compute what the brief's verify items 2 and 3 ask to be printed (the enumeration and the key read), so they serve named checks. compare.py, sync.sh and the frame-height JavaScript serve no check the brief names. The report names the scripts but does not have them approved; failure scenario: the "nothing lost in a split" claim and the look's 18-slide list rest on unapproved code whose output the landing would use; verdict: none.

## 2. Proof

- O151-report.md DONE / NOT DONE, row "Nothing lost in a split": "compares each of the 95 decks before the splits with now: no value missing"; what is wrong: `<scratchpad>/O151-before-split` is a mid-step copy, not the hub at HEAD. Its btfno and covert-applied decks already hold `notes:` (compare.py reports no `extra` loss, while `git diff` shows `extra:` removed), and its 70 new decks are the step's own first drafts. So the check does not compare the 25 decks with HEAD. My own comparison against `git show HEAD:` (preserve.py) reproduces the conclusion for the 16 split decks: no number lost, only key names. The landing's decision that the split kept every word therefore holds, but on my run, not on the quoted one; failure scenario: a reader of the report takes "before the splits" for HEAD and trusts a comparison that could not have caught a loss made before the copy was taken; verdict: none.
- O151-report.md "The 70 decks", archive/published/2026/erp-signatures: "`README.md:7`"; what is wrong: the method slide's "Each of the nine variations was completed by 16 participants" is at `README.md:22`, not `:7`. The report's C3 "met" rests on "places under 'The 70 decks'". This is a path no decision rests on, named for C3's completeness; failure scenario: a reader checking the slide against `README.md:7` does not find the number; verdict: C3.
- `projects/coauthor/published/2023/modulation-lmp-bci/present/results.md`: "Average correlation coefficient <b>0.56</b> ... At rest, subject 1's average variance is 0.011, against 0.03"; what is wrong: the project's `manuscript/main.pdf` page 1 is titled "High-gamma band event detection improves stability of finger trajectories decoded from ECoG-LMP activity", the title of the 2024 project `highgamma-event-detection`, while this project's manifest title is "Modulation of LMPs using the gamma band increases the stability ..." (2023). The two PDFs differ (`cmp`), and both decks state the same 0.56, 0.011 and 0.03. The report cites the PDF page 1 without noting that its title is another project's; failure scenario: the 2023 deck may state the numbers of the 2024 abstract; what would settle it is the 2023 BCI Society abstract itself; verdict: C3.

## 3. Standards

- `projects/active/sandpile-operator/present/main.md:8` "spread as all-or-none cascades, not smooth diffusion"; `results.md:14` "this shows representational capability, not real-world superiority"; `projects/archive/published/2026/abduction/present/present.yml:2` "title: Finger abduction, not only flexion, can be decoded from high-density ECoG"; `projects/coauthor/active/flkit/present/main.md:8` "not only an algorithmic one"; `http2-best-practices/present/results.md:11` "mainly inefficient implementations, not the protocol"; what is wrong: the rules file's prose rule (`spec.md`, the prose line: "no 'not X but Y' construction (state the thing directly)"), which the brief makes binding on the decks' text. The abduction deck title was written by the step, not copied; failure scenario: a reader of the portfolio deck meets the negation-contrast tell Axel bans, on a slide title among others; verdict: item 1.
- `projects/ideas/brecht-fl-partitioning/present/present.yml:2` "title: In federated ECG classification, label skew across clients hurts far more than size skew" and `main.md:3` "A federated-learning data-partitioning study from Brecht Heeren's Hasselt master's thesis, with Axel as co-supervisor. On MIT-BIH arrhythmia classification it shows ..."; what is wrong: the hub `CLAUDE.md` Hard rule "Never frame Axel's research via his students' (lower-tier) projects". The deck headlines a student's master's-thesis result in an Axel-led project's deck, which the portfolio deck then shows. The project's own `README.md` "Next" 2 says "Confirm Brecht (and the thesis promotor) co-authorship and consent", so consent is not yet confirmed. An idea slide also states as shown what the brief has it state as "what it would show"; failure scenario: a public portfolio talk presents a student's unconfirmed thesis finding as one of Axel's research projects; verdict: item 1.
- `projects/manuscripts/btfno/present/main.md:20` "notes: 'Why this could matter for HCCNet: Disease progression across scans is itself a dynamical process, ...'"; what is wrong: the old body at HEAD read "itself a <i>dynamical</i> process ... or a <i>learned progression operator</i>". The brief allows the existing decks' `<i>` markup and asks that the words stay; the markup was dropped. This is minor; failure scenario: the speaker notes lose the emphasis the author wrote; verdict: none.

## 4. Behaviour

- the "reading" slides, for example `projects/manuscripts/meseret-cirrhosis/present/figures.md` "explain: 'Left: the standard 3-class framing ... Right: as **competing risks** ...'" and `raw-pls/present/read-saliency.md` "Left: a high-separation tumour ... right: a concentric low-separation tumour"; what is wrong: a panel's explanation now sits on a slide that does not draw its figure (the figure is on the slide before, with its caption only), and its "left" and "right" point at nothing on screen. On a figure-only slide the left column of `Project.svelte:71-113` stays empty. The report's "The 25 existing decks: what changed" lists the file names (read-*, figures) but does not state this before and after: one slide with figure and explanation together, now two slides with them apart; failure scenario: an audience reads "Left: ... Right: ..." on a slide with no figure, while the slide before showed the figure without its explanation; verdict: none.

## Declined to judge

- The look: C4's Findings view, C5's Overview tiles and item 4's 18 Too tall slides with their pixel amounts. The review instructions forbid starting a server or opening a port. The code read agrees with the report's cause of the remaining Too tall slides: `Panel.svelte:53-59` `.fig { width: 100% }` with no height limit, inside a two-column grid (`Project.svelte:183-187`, `minmax(min(300px, 100%), 1fr)`). A rerun on the scratch server would settle the counts.
- Which of the 25 existing slides were Too tall at HEAD. No first run is on record and none can be taken without the look.
- That the `deck/` folder of the look's hub copy was refreshed with O150's uncommitted version, and the report's statement that `diff -rq` between the copy and its backup prints nothing. Neither was rerun (it touches the look's files).
- `fbttr-strategies` and `fermat` label as "centralized BTTR" a row equal, cell for cell, to eBTTR's row in `extended-bttr-note` (`fbttr-strategies/manuscript/latex/main.tex:524` against `extended-bttr-note/manuscript/main.tex:316`; fermat's own table labels it eBTTR). The slides follow their sources. This is a question about the published papers, outside O151.
- Whether the decks of the failed and stopped projects belong in the public portfolio deck: open item 690, Axel's call.
- What git would stage, or what it ignores, under the new `present/` folders. That needs `git add --dry-run` or `git check-ignore`, which this review does not run.

Reviewer usage: a4e66cc7858239325, claude-opus-5-5, 301242 tokens, 98 tool uses, 16 min 20 s.
