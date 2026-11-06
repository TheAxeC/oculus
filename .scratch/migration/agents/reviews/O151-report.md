# O151 report: a deck for every research project

NOT DONE: 18 slides in 16 decks are still Too tall. Each holds one figure and its caption alone, and the figure by itself is taller than a slide's room. Item 3 allows only a split or a cut of repeated words, and neither shrinks a figure (open item 693). Every other item and case is met. The first runs on the unchanged hub are on record for C4 only. The hub commit waits on Axel's word; it will stage the 70 new `projects/**/present/` folders and the changed and new files of the 25 existing decks, as `git status --short projects` lists them (143 untracked entries, 32 modified files under `projects/`), and nothing else.

## Open items (verbatim from `orchestrator-state.md`, "## Open items")

- Open item 689 (2026-11-06, O150's brief check): `deck/engine.md:12` in the research hub reads "Each of the next slides leads with the governing equation, then specs, method, and results." With O150's one group, the next slides are all 25 research decks, of which nine are `kind: idea` and two `kind: text`, with no equation, so the sentence becomes false; O150's line rewrites `deck/present.yml` only, and a change to the hub's own words outside it is yours. (a) Reword it in the same hub commit to "The slides that follow are every research project's deck, in folder order; a project slide leads with its governing equation, then specs, method, and results.": the slide stays true of the whole run. (b) Delete the sentence: true, but the section slide loses its pointer to what follows. (c) Keep it as written: the lazy option, a false sentence on the deck's second slide. Recommendation (a). O150 is built with the sentence as it stands, and the hub commit, which waits on your word anyway, carries (a) or (b) when you rule.

- Open item 690 (2026-11-06, O150's review, a rule clash): rulings 678 (a) and 685 (a) put every research project's deck in the portfolio deck, the failed and stopped ones included, and O150 does so; the deck's own rule line, `deck/present.yml:1` in the hub, says the deck is "a public artifact" with "never a null or negative result". The rule line agrees with the hub's Hard rule "Failed experiments are PRIVATE guidance only" (hub `CLAUDE.md:7`). Today one deck is affected, `projects/archive/failed/fed-faithful-ecg` (stage `failed`), now the first project slide; O151 (2026-11-06) writes seven more in their projects' own folders, the three failed and four stopped projects without a deck (among them `ms-lipid-handshake`, `faithful-block-term-layer` and `jacobian-coupled-blockterm-dp`), which the group finds as well under (b); its slide (`present/main.md`, `kind: text`, no status chip) reads "In progress: real-hospital replication" and "Next: ... Open to clinical and federated-learning collaborators", which is false of a failed project. (a) Leave the failed and stopped projects out of the portfolio deck: the group's `find:` gains `stages:` listing every stage of the vocabulary but `failed` and `stopped`; their decks stay whole and open on their own in the Present view, and the public deck holds no negative result; it narrows 678's "every research project's deck" to the live and finished ones. (b) Keep them, as 678 and 685 say: the rule line drops "never a null or negative result", and the fed-faithful-ecg slide is rewritten to its failed state (by O151, which writes the failed and stopped decks like every other); the public deck then shows a NO-GO project. (c) Keep both as they are: the lazy option, a deck that breaks its own rule with a false slide. Recommendation (a), since the deck is presented in public talks and your rule against a negative result in public output is absolute. O150's hub commit, which waits on your word, carries (a) or (b)'s rule line when you rule.

- Open item 691 (2026-11-06, O150's review over round 1): O150 drops the portfolio deck's two summary slides and its idea grid. Measured on the scratch server, a summary and a grid of all 25 research decks are both Too tall in the 1280 by 720 frame; with the filter bar on Stage `submitted` (11 decks) the summary fits and the grid stays Too tall. So a summary would serve the filtered talk (ruling 676 has a summary count only what the filter keeps) and overflow the unfiltered one. (a) Keep the deck as built, no summary and no grid: no slide overflows, and a filtered talk has no at-a-glance table. (b) Add one `{ kind: summary, of: research }` before `closing.md`: the filtered talk gets its table, and the unfiltered deck draws one Too tall slide with its finding each time it is opened. (c) A new step in oculus that splits a summary over as many slides as its rows need, so it fits filtered and unfiltered, then (b): the option that ends the cause, at the cost of a step. (d) The lazy option is (a) without saying anything. Recommendation (c), with (a) standing until that step lands. O150's hub commit, which waits on your word, carries (a), or (b) when you choose it.

- Open item 692 (2026-11-06, O148's review over round 1, Behaviour 1 of `agents/reviews/O148-refuter.md`): the two readers of a deck check a project slide's domain differently. The snapshot build checks the manifest's raw `domain:` key against its own hub's domains (`src/lib/data/sources/documents/decks.ts:61-62`, `:83`); the deck route checks the domain as the merge resolved it, by its key, against its own hub's domains (`src/lib/server/content/deck/read.ts:77-78`, `:129`). So a domain no hub holds raises `domain_unknown` in the Findings view but not on the deck route, and a domain only a second hub holds raises a false `domain_unknown` on both, the slide drawing no Domain tag while its strip shows a Domain chip. Neither happens today: the workspace has one hub and every project's domain is a key of `.oculus/data/pillars/domains.yml`. The fix reaches both readers, the facts module and their tests, more than a fix at landing. (a) A step O154, built by a builder: both readers take the slide's domain as the merge resolves it, checked against every hub's domains, keeping the deck's `domain_unknown` finding, with test rows for a domain only a second hub holds and one no hub holds. (b) The same step, with the deck's `domain_unknown` finding removed: a manifest's unknown domain is already a finding of validate (`src/lib/data/snapshot/validate.ts:107`), so the deck finding repeats it, and a domain that resolves is drawn on both readers. (c) Leave it as it is: the lazy option, two readers that disagree on a workspace with a second hub. Recommendation (b): one cause, one finding, and the readers agree.

- Open item 693 (2026-11-06, O151's build): some project slides stay Too tall even with one figure and its caption alone on the slide. A project slide draws a panel's figure at the full width of its column, about 485 px, with no height limit (`src/lib/views/academic/present/Panel.svelte:52-58`, `.fig { width: 100% }`), so a figure taller than it is wide is drawn taller than the room a slide has under its title (about 418 px at text scale 1). O151's item 3 allows only a split or a cut of repeated words, neither of which shrinks a figure, so these slides are left Too tall: the slide list is in `agents/reviews/O151-report.md`, section "The look". (a) A step in oculus: a project slide's figure is drawn no taller than the room its column has left, scaled down with its aspect ratio kept, at every text scale, with a test row for a tall figure; then O151's look is run again. (b) Remove those figures from the decks: every slide fits, and those projects lose the figure (a data glove, a sign-language alphabet, a coactivation plot among them). (c) Leave them Too tall: the lazy option, a finding on each of those slides every time its deck is drawn. Recommendation (a): it ends the cause for every deck, present and future, and keeps every figure.

- Open item 694 (2026-11-06, O151's build): the existing deck of `projects/manuscripts/bttn-incident-af` states the provisional numbers the project has retired: its results read "BTTN+SSL 0.762 vs CNN 0.749", "parity at the noisy-label ceiling" and a headline "BTTN 0.762 vs CNN 0.748", while the manuscript's final gold ICD-10 numbers are CNN 0.734, ECG-only BTTN 0.747, clinical baseline 0.760 and the ECG plus clinical fusion 0.778 [0.767, 0.789] (`projects/manuscripts/bttn-incident-af/manuscript/main.tex:40`, `:224`, `:234-238`), and the project's `CLAUDE.md` names the old framing retired. O151's brief takes the sources only for the 70 new decks; for the 25 existing decks it allows titles, `notes:` and splits, so O151 split this deck with its words as they were. (a) O151 rewrites this deck's numbers and framing from the manuscript before the hub commit. (b) O151 also checks every number of the other 24 existing decks against its project's manuscript, README or manifest, as it did for the 70, and rewrites any that differ, this deck among them. (c) Leave the 25 decks' words as they are: the lazy option, a deck that states numbers its project has withdrawn. Recommendation (b): one stale deck found by chance means the other 24 have not been checked.

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
