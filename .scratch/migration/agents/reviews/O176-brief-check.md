# Brief check of O176

Summary: every premise of "What is on the tree" reproduces, apart from one loose sentence (the `next:` of bt-operator-theory, under Premises). Seven findings need a change to the brief, listed last under "The question". Not verified: a grep of the changed chips and titles across the whole of the hub's `projects/` (it ran past 180 s and I stopped it; bounded greps are given below).

## Names

The step changes no identifier. It changes three chips, five second-slide titles and panel lines naming 15 image files.

- `grep -rn --exclude=local.yml -E "four synthetic scripts|120 lesions|block-term, full-rank 0\.729|engine_shapes|sequences_by_horizon|forest_auroc|figure_outline|fig_simulation|meseret_landmark|fig2_results|pipeline_flowchart|sparsity-acc|ebttr_fig|gobttr|dongho_silhouette" src tests docs README.md` from oculus prints nothing. The same names over `config` (`find config -type f ! -name local.yml`) print nothing.
- `grep -rln -E "four synthetic scripts|120 lesions, 3|block-term, full-rank 0\.729"` over the three decks' `present` folders hits only those three decks, in the brief's paths.
- `grep -ln -F` of five of the six second-slide titles over the hub's `deck/*.md` and `deck/present.yml` prints nothing. bt-operator-theory's second-slide title is not among the five, since item 3 does not change it.
- Figure names outside `present/`, sampled over three projects' README, manifest and `main.tex`: `sequences_by_horizon` in clinical-hccnet `manuscript/main.tex`, `fig2_results` in raw-pls `manuscript/main.tex`. These are the manuscripts' own image references, and the change makes neither false.
- Not verified: chips and titles across all of `projects/` outside those folders.

## The step line

`plan.md:1717`, ruling at `plan.md:3687`. The plan has no heading or line named Goal (`grep -n -iE "^(\*\*)?goal|^## goal|^goal:" .scratch/migration/plan.md` prints nothing); I used the goal in the task.

| Part of the step line | Requirement in the brief |
|---|---|
| worktree of the hub, `present/` folders only, two decks left alone | "Where you work", "Paths this step writes" |
| 15 figures restored from round 2 snapshot, other 12 off | item 1 |
| no equation restored, none removed | item 2 |
| `sequences_by_horizon` on clinical-hccnet's first slide | item 1, decision 3 |
| one headline form in the five decks | item 3 |
| three chips from their sources | item 4 |
| limiting facts back, detail numbers off | item 5 |
| second slide only by need | item 7 |
| bt-operator-theory follows README's corrected Theorem 1 | item 6 |
| 59 decks read line by line | item 8 |
| built by a builder agent | brief as a whole |

Every part has a requirement. No part is left without one.

## Premises

Rechecked at oculus 30e1d996b and hub 76cf0c5f9 (`git rev-parse HEAD`, both print those).

- 95 and 93 decks: `find projects -path '*/present/main.md' | wc -l` prints 95, with the `grep -v` 93. Holds.
- 13 two-slide decks, the rest one: the `grep -c '^kind:'` per deck gives 82 of 1 and 13 of 2. Holds.
- No deck draws a figure: the grep over the live `present/` folders piped to `wc -l` prints 0. Holds, but `grep -rl` prints file names, so "prints 0" needs `| wc -l`.
- "27 image files are all on disk": all 27 named files exist live (per-file loop). `present/` folders hold 61 image files in all; the sentence is true of the 27.
- 19 snapshot decks, 27 figure lines, 95 `main.md`: holds (`figs.py` listing and `find`).
- 13 decks with `equation`: `xargs grep -l '^equation' | wc -l` prints 13. `tests/checks/config/integrity.test.ts:46` is `const REAL_FLOORS: Floors = { decks: 14, equations: 13 };`. Holds. It is a floor on slides, and each of the 13 decks has one, so the floor and the count agree.
- `slide-layout.ts:20-23` and `Project.svelte:73` and `:149`: the lines read as stated. Holds (path `src/lib/views/academic/present/...`).
- Title forms: `grep -nE '^title:'` on the five decks. Holds.
- Chips at bt-operator-theory:35, raw-pls:35, bttn-incident-af:36: `sed -n` prints exactly the quoted lines. Holds.
- `README.md:83`: `sed -n 83p` starts "**Blocking corrections". Holds. The `project.yml` `next:` (line 22) names only Theorem 1 and the format ordering, then "See README Next". "Says the same" is true of corrections 1 and 2 only.
- The deck states the uncorrected Theorem 1: slide lines 16, 18 and the equation at line 42 carry `\mu_{\mathrm{band}}` with ratio `RL`. Holds.
- O151 report "Every changed line" at `O151-report.md:3515`; refuter section at `O151-refuter.md:501`. Holds.
- The two other decks belong to a step beside this one: O177, `plan.md:1718`. Holds.
- No ADR folder: see ADRs.

The 15 figures. Columns: snapshot deck line, snapshot slide, image file in the snapshot folder, image file live and tracked (`git ls-files --error-unmatch`), live slides.

| Deck | File | Line | Slide | Snapshot file | Live, tracked | Live slides |
|---|---|---|---|---|---|---|
| active/linfoot-estimator | engine_shapes.png | 27 | 1 | yes | yes | 2 |
| manuscripts/bttn-incident-af | pipeline_overview.png | 26 | 1 | yes | yes | 2 |
| manuscripts/clinical-hccnet | sequences_by_horizon.png | 36 | 2 | yes | yes | 2 |
| manuscripts/dries-bttr-ecg | forest_auroc.png | 26 | 1 | yes | yes | 2 |
| manuscripts/hccnet-revision | figure_outline.png | 27 | 1 | yes | yes | 2 |
| manuscripts/meseret-cirrhosis | fig_simulation.png | 28 | 1 | yes | yes | 2 |
| manuscripts/raw-pls | fig2_results.png | 26 | 1 | yes | yes | 2 |
| manuscripts/ward-bttr-crosssubject | pipeline_flowchart.png | 27 | 1 | yes | yes | 2 |
| manuscripts/meseret-cirrhosis | meseret_landmark.png | 46 | 2 | no | yes | 2 |
| active/sandpile-operator | rollout.png | 26 | 1 | yes | yes | 1 |
| archive/published/2021/source-localization | sparsity-acc-spread_norm.png | 34 | 2 | yes | yes | 1 |
| archive/published/2022/block-term-tensor-regression | image10.png | 35 | 2 | yes | yes | 1 |
| archive/published/2022/extended-bttr-note | ebttr_fig.jpeg | 35 | 2 | yes | yes | 1 |
| archive/published/2025/go-bttr | gobttr.jpeg | 35 | 2 | yes | yes | 1 |
| archive/published/2026/dongho-ecg-clustering | dongho_silhouette.png | 35 | 2 | no | yes | 1 |

The two "no" rows cost nothing, because the step copies the panel line and the image is already live and tracked. The 12 others all exist live. The 15 match the list in the ruling at `plan.md:3687`.

Item 8: all 59 decks resolve to one folder holding `present/main.md`. The 14 coauthor decks lie under `projects/coauthor/{active,published/<year>,stopped}/`, one folder each, and the brief lists them by bare name. The list equals the refuter's "Not read (59)" at `O151-refuter.md:495`, read side by side.

Item 5's facts, looked up in the current sources (the brief names no line for most):
- clinical-hccnet: `manuscript/main.tex:142` (encoder size), `:322` (ethnically homogeneous).
- fed-multicellular-immune: `main.tex:448-450` and `README.md:29-30` (6 normal donors at `:29`).
- raw-pls: `main.tex:541`.
- dries-bttr-ecg: `README.md:41` (0.75), `main.tex:135` (0.500), `main.tex:216` and `README.md:25` (CNN).
- bttd-source-eeg: `main.tex:405`, `:323`.
- covert-theory: `main.tex:687`, `:139`.
- ecg-readable-substrate: `main.tex:262`.
- hcc-modality-poster: only in `manuscript/main.pdf` (`pdftotext` line 140 "~37").
- ward-bttr-crosssubject: only in `README.md:37`, `:46`, `:81`; `grep -n "0\.354\|0\.156\|6 of 12" manuscript/main.tex` prints nothing.

## Cases and checks

The integrity command of C2 works as written. `OCULUS_TEST_HUB=/Users/axelfaes/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts -t "deck|equation|portfolio"` from oculus, with `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to my scratchpad, printed `Tests  7 passed | 7 skipped (14)`.

The run was on the live hub, because the O176 worktree does not exist yet (`git worktree list`). `.oculus/config.yml` is tracked, so a worktree qualifies as a hub (`git ls-files --error-unmatch`). The `grep -rl '^equation'` half of C2 needs `| wc -l` to print 13.

Inconsistent with the rules file:
1. Brief line 120, `npm run test:quick` is not run, against `spec.md:78` "At minimum: `npm run test:quick`" and `spec.md:3` "Nothing in a brief overrides anything here". The brief has no authority to drop it. Either the orchestrator names the exception in a ruling, or the builder runs it.
2. Verify 2 and "Conventions" allow accented letters, against `spec.md:78`, whose `LC_ALL=C grep -n '[^ -~]'` over every file touched "must print nothing". Verify 2 on the live hub prints 4 lines, each Link<o with diaeresis>ping, in `ideas/modality-dropping-btf` and `ideas/hccnet-fl-sweden`, both item 8 decks. `spec.md:103` allows the accent only under `config/`. The name cannot be changed, so the brief needs to say the spec's check is replaced for these files.
3. Verify 4 reads each line "against the standards pages' rules on list items and sentence length". `spec.md` is the only standards page (`.agents/plan.yaml:6`) and `grep -n -i "list item\|sentence length" spec.md` prints nothing. The verification has no rule to read against.
4. `spec.md:33` and `:35` make the file table from `diff -rq` against a base copy "the brief names". The brief names none. `git status` and `git diff` in the hub worktree are allowed and suffice; the brief should say so.

Cases asking for a check of a place the step does not change:
- C1's "each file exists" (no image changes; it does check the panel's reference).
- C9 over "decks" takes in `novel-math-primitives` and `ecg-af-fair`, which the builder may not edit, so a repeat found there has no fix inside the step. My check of `hook` and `headline` over the present folders prints no repeat today.
- C2's portfolio case reads the hub's `deck/`, unchanged, as the reader of the changed decks. That is acceptable.

C3 is consistent: all 108 slides are `kind: project`, and each deck has as many `title:` lines as `kind:` lines.

## The question

Goal: the decks carry the agreed figures, facts and corrections, and every line matches its project's sources.

The step line carries no check of its own; the brief's cases carry it.

| Case or item | Could it pass without the goal? | Reason |
|---|---|---|
| C1 | yes, for captions | It prints placement and file existence; item 1's caption and explanation check has no case and leaves no record when nothing changes |
| C2 | yes | A count of 13 passes if one equation is removed and another added; the integrity test reads shape and typesetting |
| C3 | yes | Structure only |
| C4 | partly | Title form by reading; it does not say the content is unchanged, which item 3 requires |
| C5 | yes | "Say what they measure", with no source named, against item 4's "from the source" |
| C6 | yes | It holds for whatever is brought back; bringing back 3 of the 9 listed decks' facts passes |
| C7 | yes | See below |
| C8 | yes | A "no change" row names no source; a deck can be reported read without trace |
| C9 | yes | Repeats only |
| C10 | n/a to accuracy | Fit only |
| Item 1 | yes | As C1 |
| Item 2 | yes | As C2 |
| Item 3 | partly | As C4 |
| Item 4 | yes | As C5 |
| Item 5 | yes | As C6 |
| Item 6 | yes | As C7 |
| Item 7 | yes | No case at all; the report's "why" is the only evidence |
| Item 8 | yes | As C8 |
| Item 9 | yes | Only repeats and non-ASCII are checked; the rest is by reading, with no case |

C7 detail: `grep -n 'mu_{\\mathrm{band}}'` works today (three hits, lines 16, 18, 42). It returns nothing for any other TeX form of the same symbol, and it does not touch `headline:` at line 21 ("a factor tending to $RL$"), `mechanism:` or the `Proportional regime` and `Depth` lines. "The deck states ratio L" is met by one sentence elsewhere, so a slide can state both ratios.

The 34 decks outside the 59: the step line limits the line-by-line read to the 59. The refuter says unchanged lines of the 36 read decks "rest on round 1's trace" (`O151-refuter.md:567`). The goal's "every line" holds for those decks only through that trace. This is stated as the answer to the question and is not a request to widen the step.

Changes to the brief, inside the step:
1. C1: for each of the 15 panels the report gives the file and line in the source that states the caption and the explanation, or the correction made.
2. C2: `git diff` lines beginning `-equation` or `+equation` show only bt-operator-theory (a slide merged under item 7 moves a line and is named).
3. C6: each fact named in item 5's list stands on a slide, or the deck stops and asks. "Every listed fact left off with why" says "listed", which reads as also covering item 5's own list.
4. C7: name `headline:`, `mechanism:`, the equation and the depth and proportional-regime lines as read against `README.md:83`.
5. C8: a "no change" row gives, per number, the source file and line.
6. Item 7: a case, by reading, that each second slide kept or gained is justified against the fit limits.
7. C4: add "the content does not change".

## Implied inputs

1. Ruling O176 decks (`plan.md:3687`) says bttd, btfno, bt-operator-theory, fed-multicellular-immune and dries "keep a second slide laid out differently from the first". Item 7 says a deck whose second slide can stand on the first loses it, and does not name them. Expected: item 7 names the five as keeping a second slide, or the orchestrator rules that item 7 governs. All five have two slides today.
2. Item 6's "depth, proportional-regime and selection results inherit the change" (`README.md:83`, correction 1). The deck holds `Depth: the dimension gap is exactly $92D$` and `Proportional regime: the ratio diverges near CP's threshold $n = RLK$`, and item 6 names only the ordering, oracle and $L=1$ lines. Expected: item 6 names them.
3. Item 6's corrected equation: its source is the `$R(L-1)K>0$` of correction 4 in `README.md:83`. The brief does not name it. Expected: the builder cites that term; otherwise the form is the builder's derivation, which item 9 forbids.
4. Caption source: `figure_outline` has no hit in hccnet-revision's README, manifest or `main.tex`, so the panel cannot be tied to the manuscript by file name. Expected: the report names the manuscript's figure and caption line per panel.
5. meseret-cirrhosis slide 2 will hold both its equation and `meseret_landmark`. In the snapshot the equation stood on slide 1 and the figure on slide 2, so the pair was never measured together. Item 7's limits do not mention an equation. Expected: named for the orchestrator's C10 list.
6. Item 8's "page render" of icfp-src-poster: `spec.md:65` bars a builder from driving a page. The poster is `manuscript/main.pdf` and `pdftoppm` is at `/opt/homebrew/bin/pdftoppm`. Expected: the brief says `pdftoppm`.
7. Item 9 against item 5: "no critique of a paper and no fault of a paper on a slide", while item 5 returns "each sequence's encoder size was chosen on the held-out patients". The manuscript states it at `main.tex:142`. Expected: the brief says a fact is written in the source's own terms and is no critique, or the orchestrator rules; as written, a builder can use one item to leave out the other's fact.
8. Two decks of the 59 have only a manifest as a source (no README, no manuscript): `archive/stopped/algebraic-subtyping`, `coauthor/stopped/individual-reference-intervals`. Item 9's precedence covers them; the builder has nothing else to read.

## ADRs

`ls docs/adr` prints `ls: docs/adr: No such file or directory`. No ADR folder exists, so no ADR touches the step.

## Dictated text

The brief gives no wording of its own for a file. Item 4's "move the representation 3%" is a quotation of the snapshot given as a pointer, and items 3, 5 and 6 state content and leave the words open.

By reference, item 1 dictates the 15 snapshot panel lines. `grep -n "figure:"` on each deck finds them at the lines of the table under Premises.
- Holds on ASCII (`LC_ALL=C grep -c '[^ -~]'` prints 0) and on a spaced hyphen, `, not ` and ` but ` (grep prints 0).
- The longest lines are ward-bttr-crosssubject:27 at 426 characters, meseret-cirrhosis:28 at 373 and hccnet-revision:27 at 327 (`awk length`). Against item 7's "short lines" and "Every list item short" these three are the ones to watch; neither limit has a number, and C10 measures the fit.

## Declined to judge

- Whether each snapshot caption and explanation matches its source: the builder's reading under item 1.
- Whether a slide fits at 16:9: C10.
- Whether a listed fact reads as a fault of the paper: the wording is the builder's and any stop is the orchestrator's.
- Whether the 34 decks not in the 59 need a line-by-line read beyond the step line: Axel's ruling sets the scope.

Usage: a379c743a49e059f5, claude-opus-5-5, 196944 tokens, 34 tool uses, 1065 s

## Closed

- Cases, `npm run test:quick`: now in the verify list.
- Cases, accented letters: the verify item says that the character-set check of `spec.md` runs over the oculus files and that a name in a hub deck keeps its accent.
- Cases, standards pages: that verify item is removed.
- Cases, file table: taken from `git status` and `git diff` in the hub worktree.
- Cases, C9: limited to the 93 decks of the step.
- The question 1: C1 names the source of each caption and explanation.
- The question 2: C2 reads the `equation` lines of the diff.
- The question 3: C6 requires each fact of item 5's list on a slide.
- The question 4: C7 names `headline:`, `mechanism:`, the equation and the depth and proportional-regime lines.
- The question 5: C8's "no change" row gives each number's source.
- The question 6: new case C11 on each second slide.
- The question 7: C4 says the content does not change.
- Implied 1: item 7 names the five decks that keep a second slide.
- Implied 2 and 3: item 6 names the depth and proportional-regime lines and the source of the equation.
- Implied 4: covered by C1.
- Implied 5: item 7 names meseret-cirrhosis for the measured fit.
- Implied 6: item 8 says `pdftoppm`.
- Implied 7: item 9 says a fact in the source's own terms is no critique.
- Premises, `next:`: the sentence is limited to corrections 1 and 2; the two greps gain `| wc -l`.
