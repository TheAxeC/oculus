# O151 report: a deck for every research project

NOT DONE (state after the fixes at landing; the section "Fixes at landing" at the end holds its evidence and holds over the sections before it): 16 slides are still Too tall. Each holds one figure with its caption and nothing else, its explanation on the next slide, and the figure with its caption is taller than a slide's room, which no split or cut can change (open item 693). Six existing decks state framings their projects have retired (open item 696, beside 694). Every other item and case is met. The hub commit waits on Axel's word; it will stage the 70 new `projects/**/present/` folders and the changed and new files of the 25 existing decks, as `git status --short projects` lists them (158 untracked entries, 32 modified files under `projects/`), and nothing else.

## Open items (verbatim from `orchestrator-state.md`, "## Open items")

- Open item 689 (2026-11-06, O150's brief check): `deck/engine.md:12` in the research hub reads "Each of the next slides leads with the governing equation, then specs, method, and results." With O150's one group, the next slides are all 25 research decks, of which nine are `kind: idea` and two `kind: text`, with no equation, so the sentence becomes false; O150's line rewrites `deck/present.yml` only, and a change to the hub's own words outside it is yours. (a) Reword it in the same hub commit to "The slides that follow are every research project's deck, in folder order; a project slide leads with its governing equation, then specs, method, and results.": the slide stays true of the whole run. (b) Delete the sentence: true, but the section slide loses its pointer to what follows. (c) Keep it as written: the lazy option, a false sentence on the deck's second slide. Recommendation (a). O150 is built with the sentence as it stands, and the hub commit, which waits on your word anyway, carries (a) or (b) when you rule.

- Open item 690 (2026-11-06, O150's review, a rule clash): rulings 678 (a) and 685 (a) put every research project's deck in the portfolio deck, the failed and stopped ones included, and O150 does so; the deck's own rule line, `deck/present.yml:1` in the hub, says the deck is "a public artifact" with "never a null or negative result". The rule line agrees with the hub's Hard rule "Failed experiments are PRIVATE guidance only" (hub `CLAUDE.md:7`). Today one deck is affected, `projects/archive/failed/fed-faithful-ecg` (stage `failed`), now the first project slide; O151 (2026-11-06) writes seven more in their projects' own folders, the three failed and four stopped projects without a deck (among them `ms-lipid-handshake`, `faithful-block-term-layer` and `jacobian-coupled-blockterm-dp`), which the group finds as well under (b); its slide (`present/main.md`, `kind: text`, no status chip) reads "In progress: real-hospital replication" and "Next: ... Open to clinical and federated-learning collaborators", which is false of a failed project. (a) Leave the failed and stopped projects out of the portfolio deck: the group's `find:` gains `stages:` listing every stage of the vocabulary but `failed` and `stopped`; their decks stay whole and open on their own in the Present view, and the public deck holds no negative result; it narrows 678's "every research project's deck" to the live and finished ones. (b) Keep them, as 678 and 685 say: the rule line drops "never a null or negative result", and the fed-faithful-ecg slide is rewritten to its failed state (by O151, which writes the failed and stopped decks like every other); the public deck then shows a NO-GO project. (c) Keep both as they are: the lazy option, a deck that breaks its own rule with a false slide. Recommendation (a), since the deck is presented in public talks and your rule against a negative result in public output is absolute. O150's hub commit, which waits on your word, carries (a) or (b)'s rule line when you rule.

- Open item 691 (2026-11-06, O150's review over round 1): O150 drops the portfolio deck's two summary slides and its idea grid. Measured on the scratch server, a summary and a grid of all 25 research decks are both Too tall in the 1280 by 720 frame; with the filter bar on Stage `submitted` (11 decks) the summary fits and the grid stays Too tall. So a summary would serve the filtered talk (ruling 676 has a summary count only what the filter keeps) and overflow the unfiltered one. (a) Keep the deck as built, no summary and no grid: no slide overflows, and a filtered talk has no at-a-glance table. (b) Add one `{ kind: summary, of: research }` before `closing.md`: the filtered talk gets its table, and the unfiltered deck draws one Too tall slide with its finding each time it is opened. (c) A new step in oculus that splits a summary over as many slides as its rows need, so it fits filtered and unfiltered, then (b): the option that ends the cause, at the cost of a step. (d) The lazy option is (a) without saying anything. Recommendation (c), with (a) standing until that step lands. O150's hub commit, which waits on your word, carries (a), or (b) when you choose it.

- Open item 692 (2026-11-06, O148's review over round 1, Behaviour 1 of `agents/reviews/O148-refuter.md`): the two readers of a deck check a project slide's domain differently. The snapshot build checks the manifest's raw `domain:` key against its own hub's domains (`src/lib/data/sources/documents/decks.ts:61-62`, `:83`); the deck route checks the domain as the merge resolved it, by its key, against its own hub's domains (`src/lib/server/content/deck/read.ts:77-78`, `:129`). So a domain no hub holds raises `domain_unknown` in the Findings view but not on the deck route, and a domain only a second hub holds raises a false `domain_unknown` on both, the slide drawing no Domain tag while its strip shows a Domain chip. Neither happens today: the workspace has one hub and every project's domain is a key of `.oculus/data/pillars/domains.yml`. The fix reaches both readers, the facts module and their tests, more than a fix at landing. (a) A step O154, built by a builder: both readers take the slide's domain as the merge resolves it, checked against every hub's domains, keeping the deck's `domain_unknown` finding, with test rows for a domain only a second hub holds and one no hub holds. (b) The same step, with the deck's `domain_unknown` finding removed: a manifest's unknown domain is already a finding of validate (`src/lib/data/snapshot/validate.ts:107`), so the deck finding repeats it, and a domain that resolves is drawn on both readers. (c) Leave it as it is: the lazy option, two readers that disagree on a workspace with a second hub. Recommendation (b): one cause, one finding, and the readers agree.

- Open item 693 (2026-11-06, O151's build): some project slides stay Too tall even with one figure and its caption alone on the slide. A project slide draws a panel's figure at the full width of its column, about 485 px, with no height limit (`src/lib/views/academic/present/Panel.svelte:52-58`, `.fig { width: 100% }`), so a figure taller than it is wide is drawn taller than the room a slide has under its title (about 418 px at text scale 1). O151's item 3 allows only a split or a cut of repeated words, neither of which shrinks a figure, so these slides are left Too tall: the slide list is in `agents/reviews/O151-report.md`, section "The look". (a) A step in oculus: a project slide's figure is drawn no taller than the room its column has left, scaled down with its aspect ratio kept, at every text scale, with a test row for a tall figure; then O151's look is run again. (b) Remove those figures from the decks: every slide fits, and those projects lose the figure (a data glove, a sign-language alphabet, a coactivation plot among them). (c) Leave them Too tall: the lazy option, a finding on each of those slides every time its deck is drawn. Recommendation (a): it ends the cause for every deck, present and future, and keeps every figure.

- Open item 694 (2026-11-06, O151's build): the existing deck of `projects/manuscripts/bttn-incident-af` states the provisional numbers the project has retired: its results read "BTTN+SSL 0.762 vs CNN 0.749", "parity at the noisy-label ceiling" and a headline "BTTN 0.762 vs CNN 0.748", while the manuscript's final gold ICD-10 numbers are CNN 0.734, ECG-only BTTN 0.747, clinical baseline 0.760 and the ECG plus clinical fusion 0.778 [0.767, 0.789] (`projects/manuscripts/bttn-incident-af/manuscript/main.tex:40`, `:224`, `:234-238`), and the project's `CLAUDE.md` names the old framing retired. O151's brief takes the sources only for the 70 new decks; for the 25 existing decks it allows titles, `notes:` and splits, so O151 split this deck with its words as they were. (a) O151 rewrites this deck's numbers and framing from the manuscript before the hub commit. (b) O151 also checks every number of the other 24 existing decks against its project's manuscript, README or manifest, as it did for the 70, and rewrites any that differ, this deck among them. (c) Leave the 25 decks' words as they are: the lazy option, a deck that states numbers its project has withdrawn. Recommendation (b): one stale deck found by chance means the other 24 have not been checked.

- Open item 696 (2026-11-06, O151's repair round 1): six more of the 25 existing decks state a framing their project's own `CLAUDE.md` has retired; O151 split them with their words as they were, as for 694. `dongho-ecg-clustering/present/main.md:8` and `:21` say hand-crafted features "beat billion-parameter foundation models" ("Hand-crafted 0.71 vs foundation 0.19"), where the project's `CLAUDE.md:6` calls that framing dead (ECGFounder 0.885 above hand-crafted 0.711). `bttd-source-eeg/present/results.md:13` says "Most focal of the distributed solvers" unqualified, where `CLAUDE.md:10` says it is most focal on the 64-channel sphere only and the margin against eLORETA is not significant. `dries-bttr-ecg/present/results.md:13` ("Beats every baseline tested") and `baselines.md:9-10` ("Matches or beats every baseline", "the interpretability costs no accuracy") break `CLAUDE.md:25`. `ward-bttr-crosssubject/present/main.md:20-21` gives the mechanism as "BTTR deflation" and the headline "$\rho$ 0.084 to 0.49 fix", where `CLAUDE.md:12` says BTTR is dropped and the method is the alignment with a TCN. `meseret-cirrhosis/present/reframe.md:10` and `results.md:8` lead with "no ML model beats the 1989 Mayo score", the framing `CLAUDE.md:9` forbids as a headline. `covert-applied/present/main.md:22` heads with "theorem exact+private", which points at the theory paper this paper does not cite (`CLAUDE.md:6`), and `covert-theory/present/main.md:5` carries the venue tag "TMLR" where the paper is under review at IEEE TSP (`project.yml:14`). (a) O151 rewrites these places, and 694's deck, to each project's own framing from its manuscript, before the hub commit; it is 694 (b) carried out on the decks a read has already found. (b) The same, plus the number check of 694 (b) over the other existing decks. (c) Leave them: the lazy option, public slides that state claims their projects have withdrawn. Recommendation (b), with 694 (b): it ends the cause for all 25.

## The cases' first run on the unchanged hub

- C4: `OCULUS_TEST_HUB=~/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts` from oculus main printed `Test Files 1 passed (1)`, `Tests 14 passed (14)` (recorded in `<scratchpad>/O151/first-run.txt`).
- C1, C2, C3, C5, C6, C7, C8 and C9: no first run on the unchanged hub is on record. The brief's premises give that state (25 decks, 70 projects without one, `git status --short projects` empty), from the enumeration and the `git status` run when the brief was written, but no run of each case's own check before the first deck was written is quoted anywhere.

## DONE / NOT DONE

| Item or case | State | Check and output |
|---|---|---|
| 1. A deck for each of the 70 | DONE | `python3 <scratchpad>/O151/cases.py <scratchpad>/O151-projects-list.txt` from the hub prints `C1 research 95 with deck 95 without 0` and `C1 of the 70 with deck 70` |
| 2. The 25 decks: untitled slides, `extra:` | DONE | The Findings view lists no untitled slide (0 lines matching "untitled"); `grep -n '^notes:\|^extra:'` over the btfno and covert-applied slides prints only `notes:` lines (`btfno/present/main.md:20`, `covert-applied/present/main.md:20`) |
| 3. Too-tall slides split or cut | NOT DONE for 18 slides | Every slide with text is split until it fits; the 18 that remain hold one figure alone (list under "The look"); open item 693 |
| 4. Read with no finding | NOT DONE for the same 18 | Findings view: 18 findings under `present/`, all "slide too tall" on those 18 slides; no untitled slide, no missing figure |
| C1 | met | as item 1 |
| C2 | met | `cases.py` C2 lines, counted by stage: nascent 12 idea, scoping 7 idea, de-risking 5 idea, exploring 3 idea and 3 project (`linfoot-estimator`, `sandpile-operator`, `engram`, the three whose READMEs hold a method and results), published 30, failed 3, stopped 4, accepted 1, in-prep 1, submitted 1 project |
| C3 | met | Every number of the 70 decks read against its source; places under "The 70 decks" |
| C4 | met | the integrity test above, rerun after every change: `Tests 14 passed (14)`, exit 0; the Findings view lists no finding under `present/` other than the 18 Too tall |
| C5 | partial | 18 slides Too tall, as item 3 |
| C6 | met | a read of every `figure:` of the 95 decks: `figures 46 bad 0` (each a tracked PNG, JPG, SVG or WebP that exists) |
| C7 | met | `python3 <scratchpad>/O151/keys.py` prints `decks 95 with unread keys 0`; `cases.py` prints `C7 slides with unread keys 0` |
| C8 | met | `git status --short projects deck`: 143 `??` and 32 `M` under `projects/`, every one under a `present/` folder; the three other lines are O150's `deck/present.yml`, `deck/title.md` and deleted `deck/transition.md`; Axel's changes under `.oculus/data/academic/funding.yml` and `funding/2026-fwo-senior-transplant/` are left alone |
| C9 | met | the brief's perl check, run under bash from the hub root, prints nothing, exit 0 |
| `eli5` shape | met | `eli5:` is read as a map of `purpose` and `plain` (`src/lib/data/sources/deck/project.ts:44-45`); a read of every slide's front matter prints `eli5 50 not a map 0` |
| YAML | met | every `present/` `.md` front matter and `.yml` parsed with `yaml.safe_load`: `parsed 350 bad 0` |
| Nothing lost in a split | met | `python3 <scratchpad>/O151/compare.py <scratchpad>/O151-before-split ~/workspace/research-hub` compares each of the 95 decks before the splits with now: no value missing; `decks with a difference: 2`, the two text decks, whose only additions are the new section headings |

## The 70 decks

27 are `kind: idea` and 43 are `kind: project`. An idea deck is one slide whose `desc` comes from the project's `README.md` and manifest. A project deck is split one part per slide: `main.md` (tag, title, sub, hook, specs, mechanism, headline), then `plain.md`, `method.md`, `results.md` and one slide per figure, as its sources fill them. A coauthor deck names the lead in `sub`. Each place below was read and holds the slide's number with its qualifier. Years, volume and article numbers in a `sub` line come from the paper's own first page or from the manifest's `outcome`.

Idea decks with no number: `active/loewner`, `active/novel-math-primitives`, `active/eeg-saad-challenge` (2027 from `README.md:3`), and in `ideas/`: adapter-format-theory, asthma-geo-tensor, attention-scoped-instructions, block-term-nca, brecht-fl-partitioning, cirrhosis-digital-twin, concept-bottleneck-hcc, conformal-tensor-factors, faithful-interpretability-position, fed-duplication-limits, fed-neural-operators, federated-protocol-agents, fedlink, harmonop, modality-dropping-btf, multiway-biosignal-fm, neurosde, paleogenomics-tensor, pathology-tensor-mil, physics-tensor-hcc, serial-ecg-af. Idea decks with a number: `old-charges-stemmatology` (130 copies, 1888: `README.md:3`, `:7`), `strokeop` (3 h against 6 h: `README.md:3`), `xsub-ecog-framework` (Paper 1: `README.md:3`).

Project decks, with the place of each result number:

| Project | Slides | Places |
|---|---|---|
| active/linfoot-estimator | 7 | `manuscript/main.tex:56` (abstract: 0.0608, 0.0713, 0.0708, 0.0000, 0.0142 to 0.2501, 0.0947, 0.0588, 0.6029), `:655`, `:542`, `:96` (12 families by 60 combinations) |
| active/sandpile-operator | 3 | `README.md:23-27` |
| archive/failed/faithful-block-term-layer | 3 | no number; `README.md` |
| archive/failed/jacobian-coupled-blockterm-dp | 4 | `README.md:17`, `:21-37` (16-18%, 58 to 67x), `:46`, `:49` |
| archive/failed/ms-lipid-handshake | 3 | `README.md:28-32`, `:36`, `:46-48` |
| archive/phd/phd-thesis | 4 | `manuscript/chapters/chapter-4/chapter-4.tex:386` (0.64 +/- .05), `manuscript/chapters/chapter-5/chapter-5.tex:287` (0.66 +/- .03) |
| archive/published/2016/bachelor-network-ids | 2 | no result number; `manuscript/main.pdf` p.1 |
| archive/published/2017/icfp-src-abstract | 2 | no result number; `manuscript/main.pdf` |
| archive/published/2017/icfp-src-poster | 3 | no result number; `manuscript/main.pdf` p.1 |
| archive/published/2018/masters-algebraic-subtyping | 3 | no result number; `manuscript/main.pdf` p.1 |
| archive/published/2018/masters-eeg-infotheory | 3 | no result number; `manuscript/main.pdf` p.1 |
| archive/published/2021/abstract-bci-meeting-2021 | 3 | `manuscript/main.tex:40`, `:42`, `:47` |
| archive/published/2021/source-localization | 5 | `manuscript/main.tex:81` (500 sources, 108 electrodes), `:95` (2004 dipoles), `:155` (0.9234, 0.9537, 0.9867), `:179` (0.08), `:192-194` (times) |
| archive/published/2021/volga-finger-trajectories | 2 | `manuscript/main.pdf` p.1 (0.37, 0.87, 0.78) |
| archive/published/2022/block-term-tensor-regression | 4 | `manuscript/bare_jrnl.tex:859-865` (subject 1 table), `:842` (3 and 8 minutes, 14 hours) |
| archive/published/2022/connectivity-iris | 3 | no result number; `manuscript/main.pdf` p.1 |
| archive/published/2022/extended-bttr-note | 4 | `manuscript/main.tex:316-318`, `:323`, `:337`, `:344`, `:358`, `:365` |
| archive/published/2025/fbttr-strategies | 4 | `manuscript/latex/main.tex:516`, `:538`, `:560` (FedAvg), `:524`, `:546`, `:568` (centralized), `:542`, `:564` (FedYogi), `:576`, `:435` (30 blocks) |
| archive/published/2025/fermat | 4 | `manuscript/main.pdf` p.1 abstract (0.76 against 0.71; 0.872, 0.772, 0.812, 0.753), p.12 tables |
| archive/published/2025/go-bttr | 4 | `manuscript/main.tex:43` (abstract: 0.73, 0.719, 0.70; 0.37, 0.34, 0.33) |
| archive/published/2026/abduction | 5 | `manuscript/main.tex:246` (subject 1), `:254` (subject 2), `:248-252` (chance and baselines) |
| archive/published/2026/erp-signatures | 3 | `README.md:7` |
| archive/published/2026/glassbox-decision-pipelines | 3 | `manuscript/main.tex:27` (abstract: 165 features, 48 of 48, 0.160, 0.02, p = 0.017 and 0.010, 28 of 28), `:63` |
| archive/published/2026/hcc-modality-poster | 3 | `manuscript/main.pdf` p.1 |
| archive/stopped/algebraic-subtyping | 1 | manifest only (`project.yml`) |
| archive/stopped/connectivity-motor-imagery | 6 | `manuscript/main.tex:140-156` |
| coauthor/active/flkit | 2 | no number; `README.md` |
| coauthor/published/2016/chi-household-survival | 2 | no result number; `manuscript/main.pdf` p.1 |
| coauthor/published/2016/chi-purpose-centric | 2 | no result number; `manuscript/main.pdf` p.1 |
| coauthor/published/2017/algebraic-effects-compilation | 2 | no result number; `manuscript/main.pdf` p.1 |
| coauthor/published/2017/http2-best-practices | 2 | no result number; `manuscript/main.pdf` p.1 |
| coauthor/published/2018/http2-web-performance | 2 | no result number; `manuscript/main.pdf` p.1 |
| coauthor/published/2023/coordinated-fingers-ecnr | 2 | `manuscript/main.pdf` p.1 |
| coauthor/published/2023/ecog-frequency-features | 2 | `manuscript/main.pdf` p.1 (0.45 to 0.5) |
| coauthor/published/2023/modulation-lmp-bci | 2 | `manuscript/main.pdf` p.1 (0.56; 0.011 against 0.03) |
| coauthor/published/2024/highgamma-event-detection | 2 | `manuscript/main.pdf` p.1 (0.56; 0.011 against 0.03) |
| coauthor/published/2025/editorial-bigdata-ai-ms | 2 | no result number; `manuscript/main.pdf` p.1 |
| coauthor/published/2025/pfl-ms-npj | 2 | `manuscript/main.pdf` p.1 (26,000 patients; 0.8398 +/- 0.0019, 0.8384 +/- 0.0014), p.4 |
| coauthor/published/2025/proprioception-exoskeleton | 2 | `manuscript/main.pdf` p.1, p.5 |
| coauthor/stopped/individual-reference-intervals | 1 | manifest only (`project.yml`) |
| ideas/engram | 4 | `README.md:34-39` |
| ideas/fedbtd | 3 | no result number; `README.md:3`, `:7` |
| manuscripts/clinical-hccnet | 5 | `manuscript/main.tex:59` (243 patients, 947 examinations), `:61` (37 HCC, 15.2%, 0.966 with its 95% CI, 0.893, 0.829) |

## The 25 existing decks: what changed

Each slide that was too tall was split into slides of the same kind, each with a title of its own. The `order:` of each `present.yml` names the files.

| Deck | Slides before, now | Change |
|---|---|---|
| fed-faithful-ecg | 1, 5 | text slide split by section: main, plain, method, results, next |
| ecg-readable-substrate | 1, 4 | text slide split by section: main, plain, method, next |
| dongho-ecg-clustering | 1, 5 | main (no equation), method (equation), results, silhouette, figures |
| hccnet-fl | 1, 4 | main, plain, method, results |
| bt-operator-theory | 1, 4 | main, plain, method, results |
| btfno | 1, 7 | main (its `extra:` became `notes:`), plain, kernel, method, mobte, results, generalization |
| bttd-source-eeg | 1, 4 | main, plain, method, results |
| bttn-incident-af | 1, 7 | main, plain, method, read-arch, results, read-factors, horizons; words unchanged (open item 694) |
| covert-applied | 1, 4 | main (its `extra:` became `notes:`), plain, method, results |
| covert-theory | 1, 4 | main, plain, method, results |
| dries-bttr-ecg | 1, 5 | main (equation moved to method), method, results, figures, read-maps |
| fed-multicellular-immune | 1, 6 | main, plain, method, results, figures, read-schematic |
| hccnet-revision | 1, 5 | main, method, results, discrimination (the figure), figures |
| meseret-cirrhosis | 1, 5 | main, method, results, figures, read-landmark |
| raw-pls | 1, 12 | main, plain, method, read-method, results, read-gonogo, real, read-registration, saliency, read-saliency, ortho, read-ortho |
| ward-bttr-crosssubject | 1, 8 | main, method, read-overview, results, calibration (the figure), read-calibration, maps, read-maps |
| the nine idea decks (btd-autoencoder, clinical-ai-eval-artifacts, ecg-af-fair, fl-privacy-auditing, florank-personalization, hccnet-fl-sweden, hccnet-pathology, quantum-tensor-fl, ssm-longitudinal) | 1, 1 | unchanged |

The 70 new decks were split the same way. Where a figure and text shared a slide that was too tall, the figure moved to a slide of its own: abduction (grid), connectivity-motor-imagery (tcdf), phd-thesis (alphabet), fbttr-strategies (model).

## The look

The scratch oculus on 8797 served the hub copy `<scratchpad>/O138look/home/workspace/research-hub` at text scale 1 in the default theme. Each `present/` folder was synced into the copy with `bash <scratchpad>/O151/sync.sh`. For the portfolio deck the hub's current `deck/` folder (O150's uncommitted version) was copied in too. The copy was then put back from `<scratchpad>/O151-look-backup`, and `diff -rq` between them prints nothing.

- Every project deck: each of the 95 was opened in its own Present view and every slide drawn, 255 slides in all. Each deck's Overview was then opened: 95 Overviews, 255 tiles, 18 tiles marked Too tall.
- The portfolio deck (O150's `deck/present.yml`, one group of every research deck): 258 slides, made of title, engine, the 255 project slides and closing. Each slide was drawn, then the Overview opened: 18 tiles marked Too tall, the same 18 slides. Title, engine and closing fit.
- The Findings view: 186 findings. 18 are under `present/`, all "slide too tall" on the slides below. None is under `deck/`, none is an untitled slide and none is a missing figure. The other 168 are hub findings outside the decks (README headings and files, for example).

The 18 slides, each one figure and its caption alone, with the amount the Findings view reports past the 1280 by 720 frame:

| Slide | Past the frame |
|---|---|
| abduction/present/glove.md | 487 px |
| extended-bttr-note/present/coactivation.md | 471 px |
| btfno/present/kernel.md | 189 px |
| go-bttr/present/alphabet.md | 149 px |
| clinical-hccnet/present/fusion.md | 109 px |
| connectivity-motor-imagery/present/simulation.md | 84 px |
| phd-thesis/present/alphabet.md | 73 px |
| dongho-ecg-clustering/present/silhouette.md | 63 px |
| ward-bttr-crosssubject/present/maps.md | 40 px |
| hccnet-revision/present/discrimination.md | 35 px |
| linfoot-estimator/present/engine.md | 35 px |
| raw-pls/present/read-gonogo.md | 30 px |
| source-localization/present/sparsity.md | 25 px |
| source-localization/present/dipoles.md | 25 px |
| fbttr-strategies/present/model.md | 12 px |
| ward-bttr-crosssubject/present/calibration.md | 7 px |
| connectivity-motor-imagery/present/tcdf.md | 4 px |
| abduction/present/grid.md | 2 px |

## What in the brief was wrong

- Item 3 cannot be met for a slide whose one figure is taller than a slide's room. A split leaves the figure on a slide of its own, still too tall, and a cut of repeated words does not change a figure. This is open item 693.
- "The look's hub copy ... refreshed from the hub": the copy also holds the hub's `deck/` folder at its committed state, without O150's uncommitted rewrite. Refreshing only the `present/` folders measures the old portfolio deck. That old deck raised two Too tall grid slides ("The wider portfolio, at a glance", 251 px; "The idea pipeline, what is next", 3000 px) and 11 findings on its `deck/present.yml` naming decks the old groups do not list. With O150's `deck/` copied in, none of these appear.

## Scripts written for the step

The brief does not build these, and no line of `plan.md`'s Rulings names them. Each computes a fact or copies files for the look, and none writes a hub file:
- `<scratchpad>/O151/cases.py` (C1, C2, C7), `keys.py` (C7), `compare.py` (nothing lost in a split), `sync.sh` (rsync of the `present/` folders into the look's hub copy);
- the inline Python reads that list each slide number beside the source lines holding it, used for the reading of C3;
- in-page JavaScript in the look's tab that steps through a deck and reads each slide frame's height.

## Usage

The executor is inline (ruling 679): no builder agent, no usage to report.

## Repair round 1

Built inline by the orchestrating session under `agents/briefs/O151-round-1.md`, every hub file written with Write or Edit. This section states the state after the round; where it differs from the sections above, this section holds.

### The cases' first run on the unchanged hub (ruling 1)

HEAD's `projects/` was exported with `git archive HEAD projects | tar -x -C <scratchpad>/O151-head-r1` and the checks run there:

- C1: `research 95, with deck 25, without 70`; `of the 70: with deck 0` (the four `tier: software` projects have no deck and are not research projects).
- C2 and C6: the 70 hold `slides 0 figures 0`.
- C7: the key read prints `projects/manuscripts/btfno/present/main.md: extra` and `projects/manuscripts/covert-applied/present/main.md: extra`.
- C9: the brief's perl check prints nothing.
- C8: `git status --short projects deck` (saved in `<scratchpad>/O151/c8-r1.txt`) prints 173 lines: 170 under a `present/` folder (138 `??`, 32 ` M`), the step's paths, and three under `deck/` (` M deck/present.yml`, ` M deck/title.md`, ` D deck/transition.md`), O150's uncommitted change.
- C5: the look copy held HEAD's 25 `present/` folders only (the 70 new ones moved aside); the portfolio deck's Overview on 8797 drew 28 tiles, 16 of them Too tall, one per rich deck, from 667 px (`ecg-readable-substrate`) to 2616 px (`raw-pls`) past the frame; the nine idea decks fit (`<scratchpad>/O151/c5-first-run-head.txt`). The copy was then put back from `<scratchpad>/O151-look-backup`: a `diff -rq` of each of its 25 `present/` folders and of `deck/` against the backup finds no difference.
- C4: as above, `Tests 14 passed (14)`.
- C3 is a reading and has no first run.

### Rulings

| Ruling | State | Check and output |
|---|---|---|
| 1. First runs | DONE | the list above |
| 2. One slide, split only where Too tall | DONE for every slide with text; 20 figure-only slides stay Too tall (open item 693) | Each deck was put back in one `main.md` (`<scratchpad>/O151-r1-onefile/`), measured, and split into the fewest slides that fit. The scratch oculus on 8797 at text scale 1, default theme, portfolio deck Overview after every tile was drawn: `tiles 219, tall 20`; for each of the 20, `.panel` count 1 and no `.eli5`, list, equation or specs block. The Findings view prints the same 20 "slide too tall" lines. |
| 3. Intervals | DONE | fbttr-strategies, extended-bttr-note, block-term-tensor-regression and abduction state each comparator's $\pm$ interval (`grep '^- ' present/results.md` of each) |
| 4. Manifest-only results | DONE | `grep -c '^results:'` prints 0 for algebraic-subtyping and individual-reference-intervals; no `outcome` line in connectivity-motor-imagery's slides |
| 5. The simulated estimate | DONE | both decks' `results.md` give the manuscript's estimate in full, every coefficient included, as `connectivity-motor-imagery/manuscript/main.tex:150-156` against the truth at `:138-144` |
| 6. cirrhosis-digital-twin | DONE | `desc: 'An idea with Maureen Guichelaar (MST hepatology): a digital twin for cardiovascular and liver outcomes in cirrhosis.'` |
| 7. Unapproved scripts | DONE | the breach stays recorded under "Scripts written for the step"; no claim of this round rests on `compare.py`, `sync.sh` or the frame-height JavaScript. The look's copy was synced with `rsync`, the comparisons made with `diff` and `git show HEAD:`, and the Too tall state read from the Overview's own Too tall marks and the Findings view. |
| 8. Nothing lost in a split | DONE | Existing decks against HEAD: `diff <(git show HEAD:<deck>/main.md) <one-file form>` for the 16 split existing decks prints no line for 14 and, for btfno and covert-applied, only the `extra:` block that brief item 2 turns into `notes:`. Every deck against its one-file form: of 95 decks compared, the split files differ from the one-file form only by added `panels:`, `results:`, `method:`, `specs:`, `eli5:` or `equation:` keys and section headings, except `block-term-tensor-regression`, whose headline ruling 11 rewrote. |
| 9. erp-signatures' 16 participants | DONE | the place is `README.md:22` |
| 10. modulation-lmp-bci | DONE | `cmp` of `manuscript/main.pdf` against `side-projects/theaxec.github.io/publications/abstracts/Abstract.Eva.CalvoMerino.pdf` prints nothing; the slide's numbers are that abstract's |
| 11. Negation contrast | DONE | a grep of the 70 new decks for `not only`, `, not `, `rather than` and `instead of` finds one place, `block-term-tensor-regression/present/main.md` headline "Minutes instead of hours, same accuracy", rewritten from `manuscript/bare_jrnl.tex:842` and `:840` to "Trains in ~3 min against ~14 h for HOPLS, comparable accuracy" |
| 12. brecht-fl-partitioning | DONE | its `desc` says what the study would show; whether the deck stands in the portfolio deck is open item 695 |
| 13. btfno `notes` markup | DONE | `<i>dynamical</i>` and `<i>learned progression operator</i>` are in `btfno/present/main.md` |
| 14. Explanations with their figures | DONE | 49 `explain:` lines, each inside a panel item with its figure or diagram (49 panel items); no explanation stands on a slide without its figure. Before: a figure and its explanation shared a slide in each deck's one file, and the first pass gave some figures a slide of their own with the explanation on another slide; after: each figure's slide carries its own caption and explanation. |

### The checks again

- C4: `OCULUS_TEST_HUB=~/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts` from oculus main: `Test Files 1 passed (1)`, `Tests 14 passed (14)`.
- C1: 99 manifests, 95 research projects with a deck, the four without one all `tier: software`.
- C6: `figures 46, missing 0`; the other three panels are diagrams.
- C7: the key read over every slide prints nothing.
- C9: the perl check prints nothing.
- C8: `git status --short` outside the decks lists only Axel's `.oculus/data/academic/funding.yml` and `funding/2026-fwo-senior-transplant/` files, left alone.
- C5: 20 slides Too tall, every one a figure-only slide (ruling 2's row).

### The look

The hub copy `<scratchpad>/O138look/home/workspace/research-hub` was refreshed with `rsync -a --delete` of every `present/` folder and of `deck/` from the hub, and served by the scratch oculus on 8797 at text scale 1 in the default theme. The portfolio deck (O150's `deck/present.yml`) draws 219 slides: title, engine, the 216 slides of the 95 decks, and closing. Each tile was scrolled into view and drawn before the Overview's Too tall marks were read. The copy was put back from `<scratchpad>/O151-look-backup` after C5's first run, as that bullet says.

The 20 Too tall slides, each one figure with its caption and explanation, px past the 1280 by 720 frame as the Findings view gives them: ECG-Repr, representation against clusterer 73; ECG-Repr, the silhouette trap 224; HCCNet-FL, what crosses the hospital boundary 55; BT-FNO, the block-term spectral kernel 350; COVERT, what crosses between departments 82; PCD, the two regimes in one bound 55; BTTR-AF, against the baselines 13; Fed-Multicellular, complete and incomplete panels 134; HCCNet, the two-stage pipeline 92; HCCNet, discrimination across follow-up 196; Cirrhosis-CR, from classification to competing risks 42; Cirrhosis-CR, fresh biomarkers 159; RAW-PLS, how it works 54; RAW-PLS, under growing misalignment 191; RAW-PLS, against registered baselines 87; RAW-PLS, saliency on real patients 80; RAW-PLS, saliency in three views 32; BSA-ECoG, one alignment per subject 62; BSA-ECoG, the shared axes on the cortex 255; BSA-ECoG, calibration time 168.

### The 16 split existing decks, slide order now

fed-faithful-ecg: main, plain, method, next. ecg-readable-substrate: main, plain, method, next. dongho-ecg-clustering: main, method, results, clusterers, silhouette. hccnet-fl: main, plain, method, results, federation. bt-operator-theory: main, plain, method, results. btfno: main, plain, method, mobte, kernel, results, generalization. bttd-source-eeg: main, plain, method, results, correlated. bttn-incident-af: main, plain, method, results, readout. covert-applied: main, plain, method, parties, results. covert-theory: main, plain, method, regimes, results. dries-bttr-ecg: main, method, results, baselines. fed-multicellular-immune: main, plain, method, panels, results. hccnet-revision: main, method, pipeline, results, discrimination. meseret-cirrhosis: main, method, results, reframe, landmark. raw-pls: main, plain, method, overview, results, misalignment, real, registration, saliency, views. ward-bttr-crosssubject: main, method, overview, results, maps, calibration. The nine idea decks keep their one slide.

### Found in the round

Six existing decks state framings their projects have retired; open item 696, booked in `orchestrator-state.md` beside 694.

### Usage

Inline: no builder agent.

## Fixes at landing

The six findings of the review over repair round 1 (`agents/reviews/O151-refuter.md`, "Repair round 1, refuted") are fixed on the hub at landing, by the orchestrating session with Write and Edit. This section states the state now; where it differs from the sections above, this section holds.

### The findings and their fixes

1. The 41 `eli5:` strings: each is a map again, `eli5:` with `  plain: '...'` under it (the list is `<scratchpad>/O151/eli5-files.txt`). A read of every slide's front matter prints no `eli5` that is not a map, and 289 slides parse.
2. The 22 figures outside `present/`: each is in the look copy at its relative path, and the page reports 46 images, 46 loaded, 0 gaps. Every measurement below was taken with them drawn.
3. The explanations: wherever a figure, its caption and its explanation do not fit one slide, the explanation stands on the next slide, `<name>-explained.md`, a panel with only `explain:`, whose first words name the figure ("The silhouette trap figure: ..."). 38 such slides. A slide that held two figures holds one, the second figure on a slide of its own. A main slide too tall with its plain-words callout gives the callout away: to the next slide where both fit (17 decks), otherwise to a new slide `plain.md`, "<short name>, in plain words", after the main slide (23 decks). Clinical HCCNet's horizon slide gives its specs to a new slide `study.md` after the main slide.
4. "(above)": the equation of btfno, raw-pls and fed-multicellular-immune stands on `method.md`, above the list that says "(above)"; `grep -c '^equation:'` prints 1 for each `method.md` that holds "(above)" (those three, hccnet-revision and meseret-cirrhosis).
5. The two deck titles keep the comma, which ends the spaced hyphen the prose rule bans. hccnet-fl, before: "Training one liver-cancer model across hospitals - sharing only the backbone"; after: "Training one liver-cancer model across hospitals, sharing only the backbone". dries-bttr-ecg, before: "A hidden AF fingerprint in a <i>normal</i> ECG - read straight off the model"; after: "A hidden AF fingerprint in a <i>normal</i> ECG, read straight off the model".
6. individual-reference-intervals: the hook ends "..., each patient measured against their own reference range." and the headline reads "Each patient against their own reference range"; `grep -rn 'in place of'` over every `present/` folder prints nothing.

### Words that pointed at a side of a figure on another slide (ruling 14)

- dongho silhouette, before "(big markers, top-left)", after "(big markers, in the upper left corner of the plot)".
- hccnet-revision discrimination, before "**AUROC (right) and AUPRC (left)**", after "**AUROC and AUPRC panels**".
- meseret-cirrhosis reframe, before "Left: the standard 3-class framing ... Right: as **competing risks**", after "The reframing figure, first panel: the standard 3-class framing ... Second panel: as **competing risks**".
- raw-pls misalignment, before "(left to right on the x-axis)", after "(misalignment grows along the x-axis)".
- raw-pls saliency, before "Left: a high-separation tumour ...; right: a concentric low-separation tumour ...", after "The first patient has a high-separation tumour ...; the second a concentric low-separation tumour ...".
- ward overview, before "enter on the left", after "enter first".

Explanations that stay on their figure's slide keep their words (bttd-source-eeg correlated, btfno generalization, bttn-incident-af readout); abduction's "right hand-knob area" is anatomy.

### Nothing lost

`diff` of each deck's content lines (keys, headings and the `eli5:` form left out) against its one-file form in `<scratchpad>/O151-r1-onefile/` (`<scratchpad>/O151/lossless-r2.txt`): every line of the one-file form is on a slide. The differences are the moved explanations with their figure's name in front and the side words above, the headlines rewritten by ruling 11 and finding 6, and the section headings of the two text decks.

### Slide order of the decks changed at landing

linfoot-estimator: main, plain, method, results, estimator-explained, engine, engine-explained. sandpile-operator: main, plain, method, results, metrics. jacobian-coupled-blockterm-dp: main, plain, method, results. ms-lipid-handshake: main, plain, method, results. phd-thesis: main, plain, results, task-explained. bachelor-network-ids: main, plain, results. icfp-src-abstract: main, plain, method. icfp-src-poster: main, plain, method. masters-algebraic-subtyping: main, plain, results. masters-eeg-infotheory: main, plain, results. source-localization: main, plain, results, sparsity, sparsity-explained, dipoles, dipoles-explained. block-term-tensor-regression: main, method, results, flexions, flexions-explained. connectivity-iris: main, plain, results. extended-bttr-note: main, plain, results, scheme-explained, coactivation, coactivation-explained. fbttr-strategies: main, plain, results, parameters-explained. fermat: main, plain, results, flexions-explained, parameters. go-bttr: main, plain, results, scheme-explained, task, task-explained. abduction: main, plain, results, glove, glove-explained, grid, grid-explained. dongho-ecg-clustering: main, method, results, clusterers, clusterers-explained, silhouette, silhouette-explained. erp-signatures: main, plain, results. hccnet-fl: main, plain, method, results, federation, federation-explained. connectivity-motor-imagery: main, method, results, tcdf-explained, simulation, simulation-explained. flkit: main, plain. algebraic-effects-compilation: main, plain, results. http2-web-performance: main, plain, results. engram: main, plain, method, results. fedbtd: main, plain, results. btfno: main, plain, method, mobte, kernel, kernel-explained, results, generalization. clinical-hccnet: main, study, results, horizon, horizon-explained, sequences, sequences-explained. covert-applied: main, plain, method, parties, parties-explained, results. covert-theory: main, plain, method, regimes, regimes-explained, results. dries-bttr-ecg: main, method, results, baselines, baselines-explained. fed-multicellular-immune: main, plain, method, panels, panels-explained, results. hccnet-revision: main, method, pipeline, pipeline-explained, results, discrimination, discrimination-explained. meseret-cirrhosis: main, method, results, reframe, reframe-explained, landmark, landmark-explained. raw-pls: main, plain, method, overview, overview-explained, results, misalignment, misalignment-explained, real, registration, registration-explained, saliency, saliency-explained, views, views-explained. ward-bttr-crosssubject: main, method, overview, overview-explained, results, maps, maps-explained, calibration, calibration-explained.

The callout moved onto the next slide in faithful-block-term-layer, abstract-bci-meeting-2021, volga-finger-trajectories, block-term-tensor-regression, glassbox-decision-pipelines, hcc-modality-poster, connectivity-motor-imagery, chi-household-survival, chi-purpose-centric, http2-best-practices, coordinated-fingers-ecnr, ecog-frequency-features, modulation-lmp-bci, highgamma-event-detection, editorial-bigdata-ai-ms, pfl-ms-npj and proprioception-exoskeleton.

### The checks

- C4: `OCULUS_TEST_HUB=~/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts` from oculus main: `Test Files 1 passed (1)`, `Tests 14 passed (14)`. The Findings view of the scratch oculus lists 16 findings under `present/`, the 16 "slide too tall" lines below, and nothing else.
- C5: the portfolio deck's Overview on 8797, text scale 1, default theme, every tile scrolled into view and drawn with its figures: 292 tiles (title, engine, the 289 slides of the 95 decks, closing; the 95 `order:` lists name 289 slides, so the portfolio deck holds every slide), 16 marked Too tall.
- C6: 46 figures, each a PNG, JPG or JPEG that exists.
- C7: the key read over the 289 slides (245 project, 36 idea, 8 text) prints no unread key.
- C9: the brief's perl check prints nothing.
- C8: `git status --short projects deck` prints 193 lines (158 untracked and 32 modified under `projects/`, three under `deck/`, O150's); outside them only Axel's `.oculus/data/academic/funding.yml` and `funding/2026-fwo-senior-transplant/` files, left alone.

### The 16 slides still Too tall (open item 693)

Each holds one figure and its caption, nothing else; px past the 1280 by 720 frame as the Findings view gives them: Linfoot Estimator, engine copulas 35; eLORETA Source Reduction, sparsity against fidelity 25; eLORETA Source Reduction, reconstructed dipoles 25; BTTR Coactivation, subject 3 471; Sign-Language ECoG, the alphabet task 149; Finger Abduction, the data glove 487; Finger Abduction, grid placement 2; ECG-Repr, the silhouette trap 63; Motor-Imagery Connectivity, results 4 (the results list beside the figure fits; the figure column overflows); Motor-Imagery Connectivity, the simulation framework 84; BT-FNO, the block-term spectral kernel 189; Clin-HCCNet, the fusion model by horizon 109; HCCNet, discrimination across follow-up 35; RAW-PLS, under growing misalignment 30; BSA-ECoG, the shared axes on the cortex 40; BSA-ECoG, calibration time 7.
