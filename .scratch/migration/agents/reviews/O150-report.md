# O150 report

NOT done: I have not counted the "slide too tall" findings per deck, which the cases ruling (point 2) asks for for the look. Only a drawn page measures them, and the rules file bars a builder from running one. The deck reader cannot measure height. The O157 landing look measured 16 of the 25 project decks Too tall (`agents/reviews/O157-landing.md:52`), and no file in this worktree names those 16. The look on landing counts them per deck; "Before and after, for the look", C1, gives the state and what to count. Everything else in the brief and the cases ruling is done.

## Open items of the state file, verbatim

- 697 (2026-11-06, O150's brief check): the hub's new portfolio deck finds its decks with `projects/**/present`, which must walk every folder under `projects/` (70,316 files); timed with `node -e` and `globSync` in the hub it takes 1319 ms, against 2 ms for the old `projects/*/*/present`. The deck reader keeps a glob only inside one reader (`src/lib/data/sources/deck/read.ts:217,347-362`), and a new reader is made for each snapshot build and each deck read of the Present view, a filter change included, so each of those would wait about 1.3 s. (a) A new step: the deck reader keeps a folder glob's matches per hub across readers and drops them when the file watcher sees a folder added, moved or removed under the glob's root. Pros: every depth stays covered, as the hub's `README.md:52` allows any depth of filing, and the cost is paid once. Cons: one more step, and a cache that must be cleared at the right moments. (b) Accept the 1.3 s on each snapshot build and each filter change. Pros: no work. Cons: the Present view's filter bar answers about a second late on this hub. Recommended (a); (b) is the lazy option. A list of today's three depths is not offered, since it misses a deck filed deeper, which the layout allows. O150 is built with `**` either way.
- 698 (2026-11-06, O150's brief check): with every research deck placed, some of the deck's framing words no longer hold for all of them: the title slide's "A shared thesis: clinical data is intrinsically multi-way ... block-term tensor structure ...", the heading "The common engine" and "recurs across the portfolio" on the engine slide, and the kicker "June 2026". Three of the 25 decks (`clinical-ai-eval-artifacts`, `fl-privacy-auditing`, `ssm-longitudinal`) name no tensor or block-term word (`grep -c -i -E 'block-term|tensor|multi-way|BTD|Tucker'` gives 0). O150 keeps these words as they stand, and its builder drafts versions that hold for all 25 decks; both come to you with the landing's screenshots. (a) The drafted versions, as you correct them. Pros: the public deck claims only what each deck shows. Cons: the thesis line becomes less sweeping. (b) Your words as they stand. Pros: no change of the deck's voice. Cons: the title slide claims a shared thesis three decks do not share, and the kicker carries a past month. Recommended (a); (b) is the lazy option.

## The cases' first run, on the hub's files as they stand

Each case was first read on `~/workspace/research-hub/deck/` as it stands, through the case-run program's base mode (its output is quoted under "The case-run program"). The facts behind the expected results were read from the hub's deck folders.

- C1. As it stands: `snapshot findings 0`, `state ok, deck findings 0`.
- C2. As it stands, the three groups hold 24 decks and leave out `projects/archive/failed/fed-faithful-ecg` (`research decks the groups do not hold: [projects/archive/failed/fed-faithful-ecg]`); `research projects 95, with a deck 25`.
- C3. As it stands: 22 slides, `slide kinds {"title":1,"section":2,"project":14,"summary":2,"text":1,"grid":1,"closing":1}`. The 9 idea decks share the one grid slide (slide 21).
- C4. As it stands, the decks follow the `slides:` lists of `pillars` and `more`, then `ideas`, with no deck order between groups.
- C5, C6. As it stands, a filter narrows three groups and the summaries and grid follow them. The filtered runs were taken on the new files only.
- C7. As it stands: `title.md:4` is `legend: pillars` and `title.md:8` holds `{{pillars.count}}` and `{{more.count}}`, drawn as "7 pillar projects and 8 more."; the legend is `[hub:liver,hub:method,hub:heart,hub:brain]`.
- C8. As it stands, `engine.md:12` reads "Each of the next slides leads with the governing equation, then specs, method, and results." Each deck's slide kinds and keys, read on the hub:

```
$ cd ~/workspace/research-hub && for d in $(find projects -path '*/present/present.yml' | sort); do dir=$(dirname $d); n=$(basename $(dirname $dir)); kinds=$(cat $dir/*.md | grep -E '^kind:' | tr '\n' ' '); eq=$(cat $dir/*.md | grep -c -E '^equation:'); sp=$(cat $dir/*.md | grep -c -E '^specs:'); me=$(cat $dir/*.md | grep -c -E '^method:'); re=$(cat $dir/*.md | grep -c -E '^results:'); echo "$n | files $(ls $dir | tr '\n' ' ') | $kinds| eq $eq specs $sp method $me results $re"; done
fed-faithful-ecg | files main.md present.yml  | kind: text | eq 0 specs 0 method 0 results 0
dongho-ecg-clustering | files dongho_silhouette.png dongho.png eq_dongho.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
hccnet-fl | files eq_hccnetfl.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
btd-autoencoder | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
clinical-ai-eval-artifacts | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
ecg-af-fair | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
fl-privacy-auditing | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
florank-personalization | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
hccnet-fl-sweden | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
hccnet-pathology | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
quantum-tensor-fl | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
ssm-longitudinal | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
bt-operator-theory | files eq_btfno.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
btfno | files btfno_blocks.png btfno.png eq_btfno.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
bttd-source-eeg | files bttdeeg_correlated.png bttdeeg.png eq_bttdeeg.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
bttn-incident-af | files eq_incidentaf.png incidentaf_arch.png incidentaf.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
covert-applied | files eq_covert.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
covert-theory | files eq_coverttheory.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
dries-bttr-ecg | files dries_forest.png dries.png eq_driesptb.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
ecg-readable-substrate | files main.md present.yml  | kind: text | eq 0 specs 0 method 0 results 0
fed-multicellular-immune | files eq_immune.png fedimmune.png immune_schematic.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
hccnet-revision | files eq_hccnet.png hccnet_arch.png hccnet.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
meseret-cirrhosis | files eq_meseret.png main.md meseret_landmark.png meseret.png present.yml  | kind: project | eq 1 specs 1 method 1 results 1
raw-pls | files eq_rawpls.png main.md present.yml rawpls_method.png rawpls.png registration_baseline.png saliency_ortho.png saliency_patients.png synthetic_upgrades.png  | kind: project | eq 1 specs 1 method 1 results 1
ward-bttr-crosssubject | files calibration_curve.png finger_spatial_maps.png main.md method_overview.png present.yml  | kind: project | eq 0 specs 1 method 1 results 1
```

- C9. As it stands: `grep -n '^\s*#' deck/present.yml` prints `1:# Rules for what goes on a slide (a public artifact): ...`.
- C10. As it stands: `grep -n -E 'transition\.md|pillars|more|ideas' deck/*` prints `present.yml` lines 6, 16, 26, 43 to 47 and 49, `title.md` lines 4 and 8, and `transition.md` lines 3 and 6.

### The cases the brief's rules got wrong, and the rulings

- Item 4 and C8. The rule asked for a sentence saying "each project's slides first giving its governing equation where it has one, then its specs, method and results", true for the 25 decks. The result: 11 of the 25 decks draw none of these. Nine are one `kind: idea` card each and two are one `kind: text` slide each (the listing above). Handed back before any change. The orchestrator's ruling (`agents/briefs/O150-cases.md`, point 1): the sentence names no count and claims no part a deck may lack. It says the slides that follow are the research projects' own decks, and that a project's slides give its governing equation, its specs, its method and its results where the project has them. It stays true for an idea card, a page of text, and any number of decks the filter keeps. Built so.
- C1. The rule asked for "no deck finding under Findings". The result: the Present view lists each slide it has drawn taller than its frame under Findings (`docs/HELP.md:331`, `tallFindings` at `src/lib/state/life/present.svelte.ts:513-520`), and O157's look measured 16 of the 25 project decks Too tall. The orchestrator's ruling (point 2): C1 holds when the portfolio deck's state is `ok` and the reader raises no finding on its own files. The "slide too tall" findings on the project decks' own files are counted and named per deck for the look. Splitting or cutting those slides is O151's work.
- C4. The brief listed in-flight as `bt-operator-theory, btfno (revision), ecg-af-fair (exploring)`. The reader places `ecg-af-fair` first, by the board's stage order. The orchestrator's ruling (point 3): the reader's order stands, and the brief listed membership only.
- Item 7. The orchestrator's ruling (point 4): every `pillars` hit is judged. Done under "Item 7, the grep over oculus".

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1. `deck/present.yml` rewritten | DONE | "Hub files" below. `node o150-cases.ts new o150-deck none`: `order entries file:title.md, file:engine.md, group:projects, file:closing.md`, `group projects: members 25, kept 25, count 25, missing [], conflicts 0, candidates 0`, `state ok, deck findings 0` |
| 2. `deck/transition.md` removed | DONE, in the report for the orchestrator | "Hub files" names the removal; no order entry names it (C10 grep below) |
| 3. `deck/title.md` and the framing redraft | DONE | "Hub files" and "Proposed framing". Last line of the run: `slide kinds {"title":1,"section":1,"project":14,"text":2,"idea":9,"closing":1}`, title slide `legend [hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl]` |
| 4. `deck/engine.md:12` | DONE | The sentence: "Next come the research projects' own decks: a project's slides give its governing equation, its specs, its method and its results where the project has them." C8 below |
| 5. `deck/closing.md` unchanged | DONE | Not in "Hub files"; `diff` of the other three against the hub's files shows the changes, and closing is read from the hub in every run (slide 28 heading `"Questions &amp;<br>collaborations welcome"`) |
| 6. "Hub files" section | DONE | Below, three fenced blocks and the removal |
| 7. The grep over oculus | DONE | "Item 7, the grep over oculus" below; no sentence is made false, and no oculus file is changed |
| C1 reader side | DONE | `state ok, deck findings 0` in all three new runs |
| C1 per-deck count of "slide too tall" | NOT DONE | Needs a drawn page; see the first line |
| C2 to C10 | DONE, the look's parts on landing | Below, under "The cases on the built files" |
| Verify 1, ASCII gate | DONE | The perl gate over `/private/tmp/.../scratchpad/o150-deck/present.yml`, `title.md` and `engine.md` (the bytes quoted below) printed nothing, `gate exit 0`; over this report, see the last rows |
| Verify 2, the texts parse | DONE | Three `node -e` runs below |
| Verify 3, `git status --short` | DONE | See the last rows |
| Verify 4, `npm run test:quick` | DONE | See the last rows |
| Verify 5, prose | DONE | "Prose of the new sentences" below |
| Unused exports | DONE | `sh utils/unused-exports.sh 2>&1 \| diff .agents/worktrees/O150-base/unused-exports.txt -` printed nothing, `diff exit 0`: the step adds no line |

## Hub files

The orchestrator writes these into `~/workspace/research-hub/deck/` at landing; the hub commit waits on Axel's word. Each file ends with one newline after its last line, as the hub's files do (`tail -c1 | od -c` gives `\n` for all three today).

`deck/present.yml`:

```yaml
deck:
    title: 'Methods for clinical and scientific data'

groups:
    projects:
        find: { folders: [projects/**/present], tiers: [research] }
        discover: true

order:
    - title.md
    - engine.md
    - { slides: projects }
    - closing.md
```

`deck/title.md`:

```markdown
---
kind: title
kicker: Research portfolio | technical briefing
legend: projects
---
# Methods for clinical<br>and scientific data

The research projects, each from its own deck: what it sets out to do, and the model or method it brings.
```

`deck/engine.md`:

```markdown
---
kind: section
---
# A recurring engine: rank-(L,L,1) block-term decomposition

A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across several of the portfolio's projects:

1. **Interpretable by construction.** Sparse and low-rank cores <i>are</i> the explanation: per-block (time x lead) or (freq x lead) signatures a clinician can read.
2. **Parameter-efficient.** An (R,L) knob matches CP and Tucker budgets while dedicating capacity to distinct regimes (scales, modalities, leads).
3. **Composable with constraints.** The same factorization carries through irregular time, federation, differential privacy, and unaligned geometry.

Next come the research projects' own decks: a project's slides give its governing equation, its specs, its method and its results where the project has them.
```

`deck/transition.md`: removed (`rm ~/workspace/research-hub/deck/transition.md`).

`deck/closing.md`: unchanged.

The `diff` of each drafted file against the hub's, run before the scratch copy was removed:

```
-- diff title.md
3,4c3,4
< kicker: Research portfolio | technical briefing | June 2026
< legend: pillars
---
> kicker: Research portfolio | technical briefing
> legend: projects
6c6
< # Structured models,<br>everywhere they hide
---
> # Methods for clinical<br>and scientific data
8c8
< {{pillars.count}} pillar projects and {{more.count}} more. A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away.
---
> The research projects, each from its own deck: what it sets out to do, and the model or method it brings.
-- diff engine.md
4c4
< # The common engine: rank-(L,L,1) block-term decomposition
---
> # A recurring engine: rank-(L,L,1) block-term decomposition
6c6
< A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across the portfolio:
---
> A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across several of the portfolio's projects:
12c12
< Each of the next slides leads with the governing equation, then specs, method, and results.
---
> Next come the research projects' own decks: a project's slides give its governing equation, its specs, its method and its results where the project has them.
```

The `present.yml` diff removes line 1 (the comment), the three groups and the old order entries. It sets `title: 'Methods for clinical and scientific data'`, the group `projects` with `find: { folders: [projects/**/present], tiers: [research] }` and `discover: true`, and the four order entries. Engine lines 1 to 3, 5 and 7 to 11 are byte for byte the hub's (the diff names only lines 4, 6 and 12). In `title.md`, lines 1, 2, 5 and 7 are the hub's.

The parse of each text with the `yaml` package, typed on the command line in the worktree:

```
$ node -e "const Y=require('yaml'); console.log(JSON.stringify(Y.parse(\"deck:\n    title: 'Methods for clinical and scientific data'\n\ngroups:\n    projects:\n        find: { folders: [projects/**/present], tiers: [research] }\n        discover: true\n\norder:\n    - title.md\n    - engine.md\n    - { slides: projects }\n    - closing.md\n\")))"
{"deck":{"title":"Methods for clinical and scientific data"},"groups":{"projects":{"find":{"folders":["projects/**/present"],"tiers":["research"]},"discover":true}},"order":["title.md","engine.md",{"slides":"projects"},"closing.md"]}
$ node -e "const Y=require('yaml'); console.log(JSON.stringify(Y.parse('kind: title\nkicker: Research portfolio | technical briefing\nlegend: projects\n')))"
{"kind":"title","kicker":"Research portfolio | technical briefing","legend":"projects"}
$ node -e "const Y=require('yaml'); console.log(JSON.stringify(Y.parse('kind: section\n')))"
{"kind":"section"}
```

## Proposed framing

Each draft is given beside the words it replaces, with the decks that show the claim holds. These are for Axel's corrections at landing.

| Place | Today | Draft | Why it holds for the 25 decks |
|---|---|---|---|
| `present.yml` `deck.title` | Structured models, everywhere they hide | Methods for clinical and scientific data | 21 decks name clinical data (ECG, MRI, EEG, ECoG, liver, cirrhosis, immune, HCC, patient or hospital words in their slides). `btd-autoencoder` names scRNA-seq data, and `bt-operator-theory` and `btfno` name PDEs, which are scientific data. `quantum-tensor-fl` is the weakest fit: its card ("Exploratory: quantum-inspired tensor networks or quantum federated learning, after a novelty check") names a method and no data. |
| `title.md:6` heading | Structured models,<br>everywhere they hide | Methods for clinical<br>and scientific data | The same claim as the deck title, which it repeats. |
| `title.md:3` kicker | Research portfolio \| technical briefing \| June 2026 | Research portfolio \| technical briefing | The kicker drops the date, which is past. No date stays true. |
| `title.md:8` thesis | {{pillars.count}} pillar projects and {{more.count}} more. A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away. | The research projects, each from its own deck: what it sets out to do, and the model or method it brings. | Every deck's slide states an aim and a model or method. A project slide states it in its title, sub line and method list, an idea card in its `desc:`, and the two text slides under "The idea / method". There is no count, so the sentence holds under every filter. |
| `engine.md:4` heading | The common engine: rank-(L,L,1) block-term decomposition | A recurring engine: rank-(L,L,1) block-term decomposition | "Common" claimed every deck. 8 decks draw a block-term word on their slides: `bt-operator-theory`, `btfno`, `bttd-source-eeg`, `bttn-incident-af`, `covert-applied`, `dries-bttr-ecg`, `fed-faithful-ecg` (main.md:12, "Interpretable block-term ECG models"), `florank-personalization` (its card, "a block-term adapter"). `ward-bttr-crosssubject` names `BTTR deflation` only in `mechanism:`, which only a summary row draws, and the deck has no summary. |
| `engine.md:6` | That middle ground recurs across the portfolio: | That middle ground recurs across several of the portfolio's projects: | The same 8 decks. The phrase claims several projects, not all of them. |
| `engine.md:12` | Each of the next slides leads with the governing equation, then specs, method, and results. | Next come the research projects' own decks: a project's slides give its governing equation, its specs, its method and its results where the project has them. | See C8. |

The block-term count per deck came from `grep -c -i -E 'block-term|BTTR|BTTD|BTTN|BTD|rank-\(L'` over each deck's `*.md`. It gave `bt=1` for `fed-faithful-ecg`, `florank-personalization` and `ward-bttr-crosssubject`, `bt=0` for the 16 decks it did not name above, and 4 to 9 for the other six. `grep -n` showed where the single hits sit: `ward-bttr-crosssubject/present/main.md:38: mechanism: BTTR deflation, LOSO transfer`, `fed-faithful-ecg/present/main.md:12`, and `florank-personalization/present/main.md:3`.

The engine slide's lines 8 to 10 stay, as item 4 says. They describe the block-term model itself, and each of their claims is drawn by at least one of the 8 decks. The closing slide stays as it is (item 5).

## The cases on the built files

Read with the case-run program over the hub, with the three drafted files handed to the reader as drafts. Every state is with Mine only on: `axel true` on every member line.

- C1. Reader side holds: `state ok, deck findings 0` with no filter, with `submitted` and with `in-prep`; `snapshot findings 0`. The "slide too tall" count per deck is not taken (first line).
- C2. Holds: `group projects: members 25, kept 25, count 25, missing [], conflicts 0, candidates 0`, `research decks the groups do not hold: []`, `held decks of no research project with a deck: []`. `fed-faithful-ecg` (`dead-ends | failed`) and both `projects/archive/published/2026/` decks are members. 95 research projects, 25 with a deck, so 70 without.
- C3. Holds: 28 slides. Slide 1 is the title, slide 2 the engine slide, slides 3 to 27 the 25 decks one slide each, slide 28 the closing. `slide kinds {"title":1,"section":1,"project":14,"text":2,"idea":9,"closing":1}`: no summary, no grid, no transition. Each of the 9 idea decks is its own `idea` slide (slides 16 and 19 to 26). The 25 decks in order, by slide: 3 hccnet-fl, 4 dongho-ecg-clustering, 5 bttn-incident-af, 6 dries-bttr-ecg, 7 ward-bttr-crosssubject, 8 meseret-cirrhosis, 9 hccnet-revision, 10 bttd-source-eeg, 11 fed-multicellular-immune, 12 covert-theory, 13 raw-pls, 14 covert-applied, 15 ecg-readable-substrate, 16 ecg-af-fair, 17 bt-operator-theory, 18 btfno, 19 btd-autoencoder, 20 clinical-ai-eval-artifacts, 21 fl-privacy-auditing, 22 hccnet-fl-sweden, 23 quantum-tensor-fl, 24 ssm-longitudinal, 25 florank-personalization, 26 hccnet-pathology, 27 fed-faithful-ecg.
- C4. Holds under the ruling. By category, in the reader's order, each deck's title:
  - publications: "Federate What Transfers" (`hccnet-fl`), "Which representation clusters?" (`dongho-ecg-clustering`).
  - in-review, by title: "An Interpretable Block-Term Tensor Network ..." (`bttn-incident-af`), "An interpretable tensor model ..." (`dries-bttr-ecg`), "Behavior-Supervised Alignment ..." (`ward-bttr-crosssubject`), "Competing-Risks Modelling ..." (`meseret-cirrhosis`), "HCCNet: ..." (`hccnet-revision`), "Jointly localized ..." (`bttd-source-eeg`), "Privacy-preserving federated tensor decomposition ..." (`fed-multicellular-immune`), "Private Coupled Descent ..." (`covert-theory`), "Registration-Free ..." (`raw-pls`), "When Masking Meets Sparsity ..." (`covert-applied`), "You Don't Need the Black Box ..." (`ecg-readable-substrate`).
  - in-flight: "ECG-AF (FAIR / Vandervoort)" (`exploring`), then "A Generalization Separation ..." (`bt-operator-theory`) and "MoBTE ..." (`btfno`) (`revision`).
  - idea, `nascent` by title: "BTD Autoencoder", "Clinical-AI Eval Artifacts", "FL Privacy Auditing", "HCCNet FL Network (Sweden)", "Quantum Tensor / Quantum FL", "SSM Longitudinal Imaging"; then `scoping`: "FLoRank x HCCNet / Block-Term ...", "HCCNet Pathology Networks".
  - dead-ends: "Faithfulness-Preserving Federated Learning for Interpretable ECG" (`fed-faithful-ecg`).
  - No deck of no category.
- C5. Holds: the `submitted` filter gives `kept 11, count 11` and 14 slides: title, engine, the 11 in-review decks in C4's order, closing. The legend is `[hub:heart,hub:brain,hub:liver,hub:method]`. With no filter (Clear all), 25 again.
- C6. Holds: the `in-prep` filter gives `kept 0, count 0` and 3 slides (title, engine, closing). The legend is `[]`, `deck findings 0`.
- C7. Holds: `title.md` holds no `{{pillars.count}}`, `{{more.count}}` or `legend: pillars` (C10 grep). The legend draws `[hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl]`, the seven domains each once, and no finding is raised.
- C8. Holds. The sentence makes three claims. (1) What follows is the research projects' own decks: every slide 3 to 27 carries a project key of a research deck (C3). (2) A project's slides give its governing equation, specs, method and results where the project has them. The 13 project slides with `equation:` give all four; `ward-bttr-crosssubject` gives specs, method and results and has no equation; the 9 idea cards and the 2 text slides have none of the four keys, so the claim says nothing of them (the per-deck listing above). (3) There is no count, so the sentence stays true under the `submitted` and `in-prep` filters.
- C9. Holds: `grep -n '^\s*#'` over the drafted `present.yml` printed nothing (`C9 grep exit 1`).
- C10. Holds: `grep -n -E 'transition\.md|pillars|more|ideas'` over the drafted `present.yml`, `title.md`, `engine.md` and the hub's `closing.md` printed nothing (`C10 grep exit 1`), and `transition.md` is removed.

## Item 7, the grep over oculus

`grep -rn --exclude=local.yml -e 'more\.count' -e 'transition\.md' -e 'public artifact' src tests config docs README.md` prints one line: `tests/fixtures/hubs/demo/deck/present.yml:1:# Rules for what goes on a slide (a public artifact): ...`. That is the demo hub's own deck comment, and the change does not make it false.

`grep -rln --exclude=local.yml 'pillars' src tests config docs README.md` lists 109 files. Every hit that names a deck group `pillars` is in a test that plants its own synthetic deck in a temporary directory. None names the research hub's deck or its files, so the change makes none of them false:

- `tests/routes/edit/write-fixture.ts:247,248,264,270,290,291`, a deck planted by `scratchDir('oculus-deck-')` (line 295).
- `tests/routes/edit/deck-slides.test.ts:5,8,45,81,85,91,100,105,150,165,167,171,172,173,176,192,199,221,256,271,286,315,316,320,321`, over that fixture (its head comment at line 5: "The hub is a temporary directory (deckTarget) whose portfolio deck holds three groups: `pillars` ...").
- `tests/routes/edit/undo/undo.test.ts:536,537,540,551,554`, `tests/routes/hubs/hub-writes.test.ts:799,832,853` and `tests/server/core/changes.test.ts:438,439,444,454`, over the same fixture's `DECK_ORDER`.
- `tests/server/edit/deck/deck-edit.test.ts:17,18,31,57,61,87,95,123`, its own deck text.
- `tests/data/sources/present.test.ts:157,164,165,170,174,220,226`, a planted `deck/present.yml` and `deck/title.md`. Lines 580 and 585 list the fact field `pillars` in a finding's words.

The other hits, by folder, are the pillars registry, the manifest key `pillars:`, the fact field `pillars` and the Pillars view. None names a deck group:

- `config/` (`catalogs/vocab.yml`, `defaults/layout.yml`, `defaults/sources.yml`, `options/layout.yml`, `options/sources.yml`, `schemas/manifest-schema.yml`, `text/app.yml`, five files under `text/views`): the registry's file and view, the manifest key, and the fact label `fact_pillars: Pillars` (`config/text/views/academic/present.yml:100`).
- `docs/` (`apps.md`, `data-map.md`, `decks.md`, `diagrams/channels.dot` and `.svg`, `HELP.md`, `palette.md`, `templates.md`): the registry, its channel and the fact field (`docs/decks.md:386,407`).
- `src/lib/data` (13 files): the registry reader, `pillarIds`, and the fact field (`model-deck.ts:150`, `snapshot/hubs/deck-facts.ts:8,31,100,117`).
- `src/lib/server` (1), `src/lib/state` (13), `src/lib/ui` (1) and `src/lib/views` (18): the registry's channel, state, controls and views, and the facts strip's label (`views/academic/present/parts/project/Facts.svelte:50`). `LineCard.svelte:92` is `t('pillars.counts_tip')`, a registry catalog key.
- `tests/fixtures/hubs` (15 files): the demo hub's manifests, its `.oculus/data/pillars/pillars.yml`, `.oculus/config.yml` and `README.md`, and `deck-hub.ts:73,91,176` (manifest `pillars:` lists and the domains file path).
- `tests/checks/config`, `tests/data/helpers`, `tests/data/hubs` (`decks.test.ts:78,166`, the fact field), `tests/data/real-hub.probe.ts`, `tests/data/snapshot`, `tests/data/sources` (beyond `present.test.ts`), `tests/routes/sessions`, `tests/server/edit` (beyond `deck-edit.test.ts`), `tests/state/boards`, `tests/state/forms` and `tests/ui/controls`: the registry, the manifest key and the fact field.

The groups were made with `grep -rln ... | awk -F/ '{ ... print $1"/"$2"/"$3 }' | sort | uniq -c`. The deck-group hits were found with `grep -rn --exclude=local.yml -E 'pillars\.count|legend: *pillars|slides: *pillars|of: *pillars|groups\.pillars|group pillars|\{ *slides: *pillars'` plus `grep -n 'pillars'` over each deck test file. `grep -rn --exclude=local.yml 'everywhere they hide' src tests config docs README.md` printed nothing, so no oculus file names the old deck title. In the hub, `grep -rln 'everywhere they hide' --include='*.yml' --include='*.md' . | grep -v '^./deck/'` printed nothing.

## The case-run program

It runs oculus's deck reader over the research hub, read only. In mode `new` it reads the text of `present.yml`, `title.md` and `engine.md` from the scratch copy `o150-deck` (the three files of "Hub files", byte for byte) and hands them to the reader as an editor's drafts over the hub's own deck paths. The reader reads drafts in place of a file's text at `src/lib/data/sources/deck/read.ts:260-264`. So the glob runs over the real hub's `projects/` and nothing is written there. `transition.md` stays on disk and no order entry names it. A filter is the reader's `keep` set, the bare keys of the projects at the named stage, as the deck route passes it (`src/lib/server/content/deck/read.ts:76,101`). It was run as `node o150-cases.ts <base|new> <scratch deck folder> <none|stage>` from the scratchpad. The program and the scratch copy are removed: `rm -f`, `rm -rf`, then `ls $S | grep -E '^o150'` printed nothing.

```ts
// Case-run program of O150. It only prints. It reads the research hub read only, builds its
// projects as the integrity test does, and reads the portfolio deck through oculus's deck reader,
// either as the hub's files stand (mode base) or with the text of the files in a scratch copy of
// the deck folder handed in as an editor's drafts over the hub's own paths (mode new). A third
// argument narrows the read as the filter bar does: none, or a stage whose projects it keeps.
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O150';
const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
const { buildOneHub } = await import(`${W}/tests/fixtures/hubs/hub-build.ts`);
const { mergeHubs } = await import(`${W}/src/lib/data/snapshot/hubs/merge.ts`);
const { engineDir, loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);
const { deckReader } = await import(`${W}/src/lib/data/sources/documents/decks.ts`);
const { deckOrderOf } = await import(`${W}/src/lib/data/shapes/boards/order.ts`);
const { categoryOf } = await import(`${W}/src/lib/data/shapes/boards/categories.ts`);
const { ofHub } = await import(`${W}/src/lib/data/helpers/hub-names.ts`);

const [mode, scratch, stage] = process.argv.slice(2);
const HUB = '/Users/axelfaes/workspace/research-hub';
const merged = loadConfig(engineDir(), { hub: HUB }).config;
const config = portfolioConfigFrom(merged);
const snapshot = buildOneHub(HUB, config).snapshot;
const projects = Object.values(
    mergeHubs([{ key: 'hub', snapshot, files: config.registries }], textCatalog(merged), 0).entities
        .projects
) as any[];
const order = deckOrderOf(merged);
const byFolder = new Map(projects.map((p) => [p.folder, p]));

const drafts = new Map<string, string>();
if (mode === 'new') {
    for (const file of ['present.yml', 'title.md', 'engine.md']) {
        const at = realpathSync(join(HUB, config.portfolioDeck, file));
        drafts.set(at, readFileSync(join(scratch, file), 'utf8'));
    }
}
let keep: Set<string> | undefined;
if (stage !== undefined && stage !== 'none') {
    keep = new Set(ofHub(projects.filter((p) => p.stage === stage), 'hub').map((p: any) => p.id));
}
const words = { record: () => undefined, vocab: merged, catalog: textCatalog(merged) };
const hub = { key: 'hub', dir: HUB, config };
const deck = deckReader({ hub, projects, words, drafts, ...(keep ? { keep } : {}) }).read(
    { key: 'hub', dir: HUB },
    config.portfolioDeck
);

const research = projects.filter((p) => p.tier === 'research');
console.log(`mode ${mode}, filter ${stage ?? 'none'}, portfolio_deck ${config.portfolioDeck}, title ${JSON.stringify(deck.title)}`);
console.log(`snapshot findings ${snapshot.findings.length}`);
console.log(`research projects ${research.length}, with a deck ${research.filter((p) => p.deck !== undefined).length}`);
console.log(`state ${deck.state}, deck findings ${deck.findings.length}`);
for (const f of deck.findings) console.log(`  deck finding ${JSON.stringify(f)}`);
console.log(`order entries ${deck.order.map((e: any) => `${e.kind}:${e.name}`).join(', ')}`);
for (const group of deck.groups) {
    console.log(`group ${group.name}: members ${group.members.length}, kept ${group.members.filter((m: any) => m.kept).length}, count ${group.count}, missing [${group.missing}], conflicts ${group.conflicts.length}, candidates ${group.candidates.length}`);
    for (const m of group.members) {
        if (!m.kept) continue;
        const p = byFolder.get(dirname(m.path));
        const cat = p === undefined ? '-' : (categoryOf(p, order.categories, order.vocab)?.key ?? 'none');
        const mine = p === undefined ? '-' : [...p.lead, ...p.supervisors].some((id: string) => id.endsWith('axel-faes'));
        console.log(`  ${cat} | ${p?.stage} | ${m.name} | ${p?.tier} | axel ${mine} | ${m.path} | ${p?.title}`);
    }
}
const withDeck = research.filter((p) => p.deck !== undefined).map((p) => p.folder);
const found = new Set(deck.groups.flatMap((g: any) => g.members.map((m: any) => dirname(m.path))));
console.log(`research decks the groups do not hold: [${withDeck.filter((f) => !found.has(f))}]`);
console.log(`held decks of no research project with a deck: [${[...found].filter((f) => !withDeck.includes(f))}]`);
console.log(`slides ${deck.slides.length}`);
for (const [i, s] of deck.slides.entries()) {
    const who = s.project === undefined ? '(deck)' : s.project;
    if (s.kind === 'title' || s.kind === 'section' || s.kind === 'closing') {
        console.log(`  slide ${i + 1} ${who} ${s.kind} heading ${JSON.stringify(s.heading)} legend [${s.legend}]`);
        console.log(`    lede ${JSON.stringify(s.lede)}`);
        if ('kicker' in s) console.log(`    kicker ${JSON.stringify(s.kicker)}`);
    } else console.log(`  slide ${i + 1} ${who} ${s.kind}`);
}
const noEquation = deck.slides
    .filter((s: any) => s.kind === 'project' && (s.slide.equation === undefined || s.slide.equation === ''))
    .map((s: any) => s.project);
console.log(`project slides ${deck.slides.filter((s: any) => s.kind === 'project').length}, with no equation [${noEquation}]`);
console.log(`slide kinds ${JSON.stringify(deck.slides.reduce((a: any, s: any) => ({ ...a, [s.kind]: (a[s.kind] ?? 0) + 1 }), {}))}`);
```

`node o150-cases.ts base - none`, the hub as it stands:

```
mode base, filter none, portfolio_deck deck, title "Structured models, everywhere they hide"
snapshot findings 0
research projects 95, with a deck 25
state ok, deck findings 0
order entries file:title.md, file:engine.md, group:pillars, summary:pillars, file:transition.md, group:more, summary:more, grid:ideas, file:closing.md
group pillars: members 7, kept 7, count 7, missing [], conflicts 0, candidates 15
  in-review | submitted | hccnet-revision | research | axel true | projects/manuscripts/hccnet-revision/present | HCCNet: A Self-Supervised CNN-Transformer for Disease Prognosis from Longitudinal 3D MRI, with a Case Study on Hepatocellular Carcinoma
  in-review | submitted | covert-applied | research | axel true | projects/manuscripts/covert-applied/present | When Masking Meets Sparsity: COVERT for Private, Communication-Efficient Vertical Federated Tensor Regression
  in-review | submitted | covert-theory | research | axel true | projects/manuscripts/covert-theory/present | Private Coupled Descent: Dimension-Free Privacy for Vertical Federated Learning by Privatizing the Coupling Variable
  in-review | submitted | bttn-incident-af | research | axel true | projects/manuscripts/bttn-incident-af/present | An Interpretable Block-Term Tensor Network for Incident Atrial-Fibrillation Prediction from the Sinus-Rhythm 12-Lead ECG and Clinical Risk Factors
  in-review | submitted | raw-pls | research | axel true | projects/manuscripts/raw-pls/present | Registration-Free Supervised Tensor-PLS for Unaligned Multiparametric MRI
  in-flight | revision | btfno | research | axel true | projects/manuscripts/btfno/present | MoBTE: A Mixture of Block-Term Spectral Experts for Multi-PDE Operator Learning
  in-flight | revision | bt-operator-theory | research | axel true | projects/manuscripts/bt-operator-theory/present | A Generalization Separation for Block-Term Spectral Operators
group more: members 8, kept 8, count 8, missing [], conflicts 0, candidates 8
  in-review | submitted | bttd-source-eeg | research | axel true | projects/manuscripts/bttd-source-eeg/present | Jointly localized spatiotemporal components of evoked EEG via a lead-field-constrained block-term decomposition
  in-review | submitted | dries-bttr-ecg | research | axel true | projects/manuscripts/dries-bttr-ecg/present | An interpretable tensor model for identifying atrial fibrillation in sinus-rhythm ECG: block-term tensor regression on PTB-XL, benchmarked against deep and foundation models
  publications | accepted | dongho-ecg-clustering | research | axel true | projects/archive/published/2026/dongho-ecg-clustering/present | Which representation clusters? A chance-corrected benchmark of ECG representations for unsupervised arrhythmia structure on PTB-XL
  in-review | submitted | fed-multicellular-immune | research | axel true | projects/manuscripts/fed-multicellular-immune/present | Privacy-preserving federated tensor decomposition of single-cell immune data: recovering multicellular programs across institutions
  in-review | submitted | meseret-cirrhosis | research | axel true | projects/manuscripts/meseret-cirrhosis/present | Competing-Risks Modelling of a Widely-Used Cirrhosis Outcome Benchmark: Recovering the Transplant Outcome and Cause-Specific Risk Lost to Classification
  in-review | submitted | ward-bttr-crosssubject | research | axel true | projects/manuscripts/ward-bttr-crosssubject/present | Behavior-Supervised Alignment for Cross-Subject Neural Decoding across Non-Corresponding Electrode Grids
  publications | accepted | hccnet-fl | research | axel true | projects/archive/published/2026/hccnet-fl/present | Federate What Transfers: Component-Aware Federation of Self-Supervised Backbones for Longitudinal 3D MRI
  in-review | submitted | ecg-readable-substrate | research | axel true | projects/manuscripts/ecg-readable-substrate/present | You Don't Need the Black Box: Named ECG Features Rival Foundation Models for Mortality Prediction
group ideas: members 9, kept 9, count 9, missing [], conflicts 0, candidates 0
  idea | nascent | btd-autoencoder | research | axel true | projects/ideas/btd-autoencoder/present | BTD Autoencoder
  idea | scoping | florank-personalization | research | axel true | projects/ideas/florank-personalization/present | FLoRank x HCCNet / Block-Term: structured personalization for federated clinical models
  idea | nascent | clinical-ai-eval-artifacts | research | axel true | projects/ideas/clinical-ai-eval-artifacts/present | Clinical-AI Eval Artifacts
  in-flight | exploring | ecg-af-fair | research | axel true | projects/ideas/ecg-af-fair/present | ECG-AF (FAIR / Vandervoort)
  idea | nascent | fl-privacy-auditing | research | axel true | projects/ideas/fl-privacy-auditing/present | FL Privacy Auditing
  idea | nascent | hccnet-fl-sweden | research | axel true | projects/ideas/hccnet-fl-sweden/present | HCCNet FL Network (Sweden)
  idea | scoping | hccnet-pathology | research | axel true | projects/ideas/hccnet-pathology/present | HCCNet Pathology Networks
  idea | nascent | ssm-longitudinal | research | axel true | projects/ideas/ssm-longitudinal/present | SSM Longitudinal Imaging
  idea | nascent | quantum-tensor-fl | research | axel true | projects/ideas/quantum-tensor-fl/present | Quantum Tensor / Quantum FL
research decks the groups do not hold: [projects/archive/failed/fed-faithful-ecg]
held decks of no research project with a deck: []
slides 22
  slide 1 (deck) title heading "Structured models,<br>everywhere they hide" legend [hub:liver,hub:method,hub:heart,hub:brain]
    lede "7 pillar projects and 8 more. A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away."
    kicker "Research portfolio | technical briefing | June 2026"
  slide 2 (deck) section heading "The common engine: rank-(L,L,1) block-term decomposition" legend []
    lede "A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across the portfolio:"
  slide 3 hccnet-revision project
  slide 4 covert-applied project
  slide 5 covert-theory project
  slide 6 bttn-incident-af project
  slide 7 raw-pls project
  slide 8 btfno project
  slide 9 bt-operator-theory project
  slide 10 (deck) summary
  slide 11 (deck) section heading "8 more, same backbone" legend [hub:brain,hub:heart,hub:method,hub:liver]
    lede ""
  slide 12 bttd-source-eeg project
  slide 13 dries-bttr-ecg project
  slide 14 dongho-ecg-clustering project
  slide 15 fed-multicellular-immune project
  slide 16 meseret-cirrhosis project
  slide 17 ward-bttr-crosssubject project
  slide 18 hccnet-fl project
  slide 19 ecg-readable-substrate text
  slide 20 (deck) summary
  slide 21 (deck) grid
  slide 22 (deck) closing heading "Questions &amp;<br>collaborations welcome" legend []
    lede "Happy to go deeper on any one: the clinical motivation, the optimization and theory, or the data pipeline. Several are open to collaborators across computer science, psychology, and medicine."
    kicker "Thank you"
project slides 14, with no equation [ward-bttr-crosssubject]
slide kinds {"title":1,"section":2,"project":14,"summary":2,"text":1,"grid":1,"closing":1}
```

`node o150-cases.ts new o150-deck none`, the hub files of this report:

```
mode new, filter none, portfolio_deck deck, title "Methods for clinical and scientific data"
snapshot findings 0
research projects 95, with a deck 25
state ok, deck findings 0
order entries file:title.md, file:engine.md, group:projects, file:closing.md
group projects: members 25, kept 25, count 25, missing [], conflicts 0, candidates 0
  publications | accepted | hccnet-fl | research | axel true | projects/archive/published/2026/hccnet-fl/present | Federate What Transfers: Component-Aware Federation of Self-Supervised Backbones for Longitudinal 3D MRI
  publications | accepted | dongho-ecg-clustering | research | axel true | projects/archive/published/2026/dongho-ecg-clustering/present | Which representation clusters? A chance-corrected benchmark of ECG representations for unsupervised arrhythmia structure on PTB-XL
  in-review | submitted | bttn-incident-af | research | axel true | projects/manuscripts/bttn-incident-af/present | An Interpretable Block-Term Tensor Network for Incident Atrial-Fibrillation Prediction from the Sinus-Rhythm 12-Lead ECG and Clinical Risk Factors
  in-review | submitted | dries-bttr-ecg | research | axel true | projects/manuscripts/dries-bttr-ecg/present | An interpretable tensor model for identifying atrial fibrillation in sinus-rhythm ECG: block-term tensor regression on PTB-XL, benchmarked against deep and foundation models
  in-review | submitted | ward-bttr-crosssubject | research | axel true | projects/manuscripts/ward-bttr-crosssubject/present | Behavior-Supervised Alignment for Cross-Subject Neural Decoding across Non-Corresponding Electrode Grids
  in-review | submitted | meseret-cirrhosis | research | axel true | projects/manuscripts/meseret-cirrhosis/present | Competing-Risks Modelling of a Widely-Used Cirrhosis Outcome Benchmark: Recovering the Transplant Outcome and Cause-Specific Risk Lost to Classification
  in-review | submitted | hccnet-revision | research | axel true | projects/manuscripts/hccnet-revision/present | HCCNet: A Self-Supervised CNN-Transformer for Disease Prognosis from Longitudinal 3D MRI, with a Case Study on Hepatocellular Carcinoma
  in-review | submitted | bttd-source-eeg | research | axel true | projects/manuscripts/bttd-source-eeg/present | Jointly localized spatiotemporal components of evoked EEG via a lead-field-constrained block-term decomposition
  in-review | submitted | fed-multicellular-immune | research | axel true | projects/manuscripts/fed-multicellular-immune/present | Privacy-preserving federated tensor decomposition of single-cell immune data: recovering multicellular programs across institutions
  in-review | submitted | covert-theory | research | axel true | projects/manuscripts/covert-theory/present | Private Coupled Descent: Dimension-Free Privacy for Vertical Federated Learning by Privatizing the Coupling Variable
  in-review | submitted | raw-pls | research | axel true | projects/manuscripts/raw-pls/present | Registration-Free Supervised Tensor-PLS for Unaligned Multiparametric MRI
  in-review | submitted | covert-applied | research | axel true | projects/manuscripts/covert-applied/present | When Masking Meets Sparsity: COVERT for Private, Communication-Efficient Vertical Federated Tensor Regression
  in-review | submitted | ecg-readable-substrate | research | axel true | projects/manuscripts/ecg-readable-substrate/present | You Don't Need the Black Box: Named ECG Features Rival Foundation Models for Mortality Prediction
  in-flight | exploring | ecg-af-fair | research | axel true | projects/ideas/ecg-af-fair/present | ECG-AF (FAIR / Vandervoort)
  in-flight | revision | bt-operator-theory | research | axel true | projects/manuscripts/bt-operator-theory/present | A Generalization Separation for Block-Term Spectral Operators
  in-flight | revision | btfno | research | axel true | projects/manuscripts/btfno/present | MoBTE: A Mixture of Block-Term Spectral Experts for Multi-PDE Operator Learning
  idea | nascent | btd-autoencoder | research | axel true | projects/ideas/btd-autoencoder/present | BTD Autoencoder
  idea | nascent | clinical-ai-eval-artifacts | research | axel true | projects/ideas/clinical-ai-eval-artifacts/present | Clinical-AI Eval Artifacts
  idea | nascent | fl-privacy-auditing | research | axel true | projects/ideas/fl-privacy-auditing/present | FL Privacy Auditing
  idea | nascent | hccnet-fl-sweden | research | axel true | projects/ideas/hccnet-fl-sweden/present | HCCNet FL Network (Sweden)
  idea | nascent | quantum-tensor-fl | research | axel true | projects/ideas/quantum-tensor-fl/present | Quantum Tensor / Quantum FL
  idea | nascent | ssm-longitudinal | research | axel true | projects/ideas/ssm-longitudinal/present | SSM Longitudinal Imaging
  idea | scoping | florank-personalization | research | axel true | projects/ideas/florank-personalization/present | FLoRank x HCCNet / Block-Term: structured personalization for federated clinical models
  idea | scoping | hccnet-pathology | research | axel true | projects/ideas/hccnet-pathology/present | HCCNet Pathology Networks
  dead-ends | failed | fed-faithful-ecg | research | axel true | projects/archive/failed/fed-faithful-ecg/present | Faithfulness-Preserving Federated Learning for Interpretable ECG
research decks the groups do not hold: []
held decks of no research project with a deck: []
slides 28
  slide 1 (deck) title heading "Methods for clinical<br>and scientific data" legend [hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl]
    lede "The research projects, each from its own deck: what it sets out to do, and the model or method it brings."
    kicker "Research portfolio | technical briefing"
  slide 2 (deck) section heading "A recurring engine: rank-(L,L,1) block-term decomposition" legend []
    lede "A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across several of the portfolio's projects:"
  slide 3 hccnet-fl project
  slide 4 dongho-ecg-clustering project
  slide 5 bttn-incident-af project
  slide 6 dries-bttr-ecg project
  slide 7 ward-bttr-crosssubject project
  slide 8 meseret-cirrhosis project
  slide 9 hccnet-revision project
  slide 10 bttd-source-eeg project
  slide 11 fed-multicellular-immune project
  slide 12 covert-theory project
  slide 13 raw-pls project
  slide 14 covert-applied project
  slide 15 ecg-readable-substrate text
  slide 16 ecg-af-fair idea
  slide 17 bt-operator-theory project
  slide 18 btfno project
  slide 19 btd-autoencoder idea
  slide 20 clinical-ai-eval-artifacts idea
  slide 21 fl-privacy-auditing idea
  slide 22 hccnet-fl-sweden idea
  slide 23 quantum-tensor-fl idea
  slide 24 ssm-longitudinal idea
  slide 25 florank-personalization idea
  slide 26 hccnet-pathology idea
  slide 27 fed-faithful-ecg text
  slide 28 (deck) closing heading "Questions &amp;<br>collaborations welcome" legend []
    lede "Happy to go deeper on any one: the clinical motivation, the optimization and theory, or the data pipeline. Several are open to collaborators across computer science, psychology, and medicine."
    kicker "Thank you"
project slides 14, with no equation [ward-bttr-crosssubject]
slide kinds {"title":1,"section":1,"project":14,"text":2,"idea":9,"closing":1}
```

`node o150-cases.ts new o150-deck submitted`:

```
mode new, filter submitted, portfolio_deck deck, title "Methods for clinical and scientific data"
snapshot findings 0
research projects 95, with a deck 25
state ok, deck findings 0
order entries file:title.md, file:engine.md, group:projects, file:closing.md
group projects: members 25, kept 11, count 11, missing [], conflicts 0, candidates 0
  in-review | submitted | bttn-incident-af | research | axel true | projects/manuscripts/bttn-incident-af/present | An Interpretable Block-Term Tensor Network for Incident Atrial-Fibrillation Prediction from the Sinus-Rhythm 12-Lead ECG and Clinical Risk Factors
  in-review | submitted | dries-bttr-ecg | research | axel true | projects/manuscripts/dries-bttr-ecg/present | An interpretable tensor model for identifying atrial fibrillation in sinus-rhythm ECG: block-term tensor regression on PTB-XL, benchmarked against deep and foundation models
  in-review | submitted | ward-bttr-crosssubject | research | axel true | projects/manuscripts/ward-bttr-crosssubject/present | Behavior-Supervised Alignment for Cross-Subject Neural Decoding across Non-Corresponding Electrode Grids
  in-review | submitted | meseret-cirrhosis | research | axel true | projects/manuscripts/meseret-cirrhosis/present | Competing-Risks Modelling of a Widely-Used Cirrhosis Outcome Benchmark: Recovering the Transplant Outcome and Cause-Specific Risk Lost to Classification
  in-review | submitted | hccnet-revision | research | axel true | projects/manuscripts/hccnet-revision/present | HCCNet: A Self-Supervised CNN-Transformer for Disease Prognosis from Longitudinal 3D MRI, with a Case Study on Hepatocellular Carcinoma
  in-review | submitted | bttd-source-eeg | research | axel true | projects/manuscripts/bttd-source-eeg/present | Jointly localized spatiotemporal components of evoked EEG via a lead-field-constrained block-term decomposition
  in-review | submitted | fed-multicellular-immune | research | axel true | projects/manuscripts/fed-multicellular-immune/present | Privacy-preserving federated tensor decomposition of single-cell immune data: recovering multicellular programs across institutions
  in-review | submitted | covert-theory | research | axel true | projects/manuscripts/covert-theory/present | Private Coupled Descent: Dimension-Free Privacy for Vertical Federated Learning by Privatizing the Coupling Variable
  in-review | submitted | raw-pls | research | axel true | projects/manuscripts/raw-pls/present | Registration-Free Supervised Tensor-PLS for Unaligned Multiparametric MRI
  in-review | submitted | covert-applied | research | axel true | projects/manuscripts/covert-applied/present | When Masking Meets Sparsity: COVERT for Private, Communication-Efficient Vertical Federated Tensor Regression
  in-review | submitted | ecg-readable-substrate | research | axel true | projects/manuscripts/ecg-readable-substrate/present | You Don't Need the Black Box: Named ECG Features Rival Foundation Models for Mortality Prediction
research decks the groups do not hold: []
held decks of no research project with a deck: []
slides 14
  slide 1 (deck) title heading "Methods for clinical<br>and scientific data" legend [hub:heart,hub:brain,hub:liver,hub:method]
    lede "The research projects, each from its own deck: what it sets out to do, and the model or method it brings."
    kicker "Research portfolio | technical briefing"
  slide 2 (deck) section heading "A recurring engine: rank-(L,L,1) block-term decomposition" legend []
    lede "A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across several of the portfolio's projects:"
  slide 3 bttn-incident-af project
  slide 4 dries-bttr-ecg project
  slide 5 ward-bttr-crosssubject project
  slide 6 meseret-cirrhosis project
  slide 7 hccnet-revision project
  slide 8 bttd-source-eeg project
  slide 9 fed-multicellular-immune project
  slide 10 covert-theory project
  slide 11 raw-pls project
  slide 12 covert-applied project
  slide 13 ecg-readable-substrate text
  slide 14 (deck) closing heading "Questions &amp;<br>collaborations welcome" legend []
    lede "Happy to go deeper on any one: the clinical motivation, the optimization and theory, or the data pipeline. Several are open to collaborators across computer science, psychology, and medicine."
    kicker "Thank you"
project slides 10, with no equation [ward-bttr-crosssubject]
slide kinds {"title":1,"section":1,"project":10,"text":1,"closing":1}
```

`node o150-cases.ts new o150-deck in-prep`:

```
mode new, filter in-prep, portfolio_deck deck, title "Methods for clinical and scientific data"
snapshot findings 0
research projects 95, with a deck 25
state ok, deck findings 0
order entries file:title.md, file:engine.md, group:projects, file:closing.md
group projects: members 25, kept 0, count 0, missing [], conflicts 0, candidates 0
research decks the groups do not hold: []
held decks of no research project with a deck: []
slides 3
  slide 1 (deck) title heading "Methods for clinical<br>and scientific data" legend []
    lede "The research projects, each from its own deck: what it sets out to do, and the model or method it brings."
    kicker "Research portfolio | technical briefing"
  slide 2 (deck) section heading "A recurring engine: rank-(L,L,1) block-term decomposition" legend []
    lede "A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across several of the portfolio's projects:"
  slide 3 (deck) closing heading "Questions &amp;<br>collaborations welcome" legend []
    lede "Happy to go deeper on any one: the clinical motivation, the optimization and theory, or the data pipeline. Several are open to collaborators across computer science, psychology, and medicine."
    kicker "Thank you"
project slides 0, with no equation []
slide kinds {"title":1,"section":1,"closing":1}
```

The gate, C9 and C10 over the drafted files, before the scratch copy was removed:

```
-- gate over the hub texts
gate exit 0
-- C9
C9 grep exit 1
-- C10
C10 grep exit 1
```

## Before and after, for the look

Open these on a copy of the hub with the three files of "Hub files" written in and `deck/transition.md` removed. Use the Present view with no deck named (the portfolio deck), Mine only on (its default).

- C1. Before: Findings lists no reader finding of the portfolio deck. After: the same, with the deck's state `ok`. Count the "slide too tall" findings under Findings that sit on the project decks' own files, and name each deck with its count. O157's look measured 16 of the 25 project decks Too tall. Before this step the deck placed 14 project slides and 1 text slide; after, it places 14 project slides, 2 text slides and 9 idea slides.
- C2. Overview, the group heading `projects`. Before: three group headings, `pillars` (7), `more` (8), `ideas` (9); `fed-faithful-ecg` in none. After: one heading, `projects`, with 25 decks, `fed-faithful-ecg` among them, and an Add tile with no candidate.
- C3. Overview. Before: 22 tiles, with 2 summaries, the "8 more, same backbone" section and the idea grid. After: 28 tiles in the order of "The cases on the built files", C3. There is no summary, grid or transition, and 9 idea cards stand as tiles.
- C4. Overview, the order of the 25 tiles: the categories and titles as C4 above lists them.
- C5. The filter bar, the stage `submitted`. After: 14 tiles (title, engine, the 11 in-review decks, closing). Line 2 reads "11 of 25 shown". The title slide's legend shows heart, brain, liver and method. Clear all gives 28 tiles again.
- C6. The filter bar, the stage `in-prep`. After: 3 tiles (title, engine, closing), the title slide with no legend, and no finding.
- C7. The title slide. Before: kicker "Research portfolio | technical briefing | June 2026", heading "Structured models, everywhere they hide", lede "7 pillar projects and 8 more. A shared thesis: ...", and a legend of 4 domains. After: kicker "Research portfolio | technical briefing", heading "Methods for clinical and scientific data" on two lines, the new lede, and a legend of 7 domains (liver, heart, brain, method, meta, privacy, liverfl), each once. The deck's tab and deck menu entry read "Methods for clinical and scientific data".
- C8. The engine slide. After: heading "A recurring engine: rank-(L,L,1) block-term decomposition", the lede ending "recurs across several of the portfolio's projects:", the three numbered points unchanged, and the last line "Next come the research projects' own decks: ...".
- C9. `deck/present.yml` in the hub has no comment line: `grep -n '^\s*#' deck/present.yml` prints nothing.
- C10. `ls deck` shows `closing.md engine.md present.yml title.md`. `grep -n -E 'transition\.md|pillars|more|ideas' deck/*` prints nothing.

## Prose of the new sentences

I read each new sentence against the rules file's prose rule: plain, ASCII, no em dash, no quip and no "not X but Y" construction.

- "Methods for clinical and scientific data": a plain noun phrase.
- "Research portfolio | technical briefing": the kicker's own words, less the date.
- "The research projects, each from its own deck: what it sets out to do, and the model or method it brings.": plain. It is the title slide's lede, so it carries no verb of its own in its first half, in the deck's voice.
- "A recurring engine: rank-(L,L,1) block-term decomposition": plain.
- "That middle ground recurs across several of the portfolio's projects:": plain.
- "Next come the research projects' own decks: a project's slides give its governing equation, its specs, its method and its results where the project has them.": the list of four is the four parts the slides have, as the ruling names them.

No sentence departs from the rule.

## Judgment calls

- The deck title and heading "Methods for clinical and scientific data". `quantum-tensor-fl` is the one deck whose card names no data. Another title for Axel to weigh: "Models and methods for clinical data", which `bt-operator-theory`, `btfno` (PDEs) and `btd-autoencoder` (scRNA-seq) would not fit.
- The title slide's lede "The research projects, each from its own deck: what it sets out to do, and the model or method it brings." It carries no count, since `{{projects.count}}` counts slides (decision 3), and it names neither the board order nor a tensor thesis. The thesis sentence is gone whole, since three decks name no tensor word (open item 698).
- The kicker drops the date and keeps "Research portfolio | technical briefing".
- The engine heading keeps "rank-(L,L,1) block-term decomposition" and changes "The common engine" to "A recurring engine"; the lede's "recurs across the portfolio" becomes "recurs across several of the portfolio's projects".
- The engine slide's lines 8 to 10 are kept as item 4 says. Line 8's "a clinician can read" and line 10's "irregular time, federation, differential privacy, and unaligned geometry" describe what the factorization offers, and are not claims about every deck.
- The case-run program reads the drafted files as drafts over the hub's own paths in place of a scratch copy of the whole hub. The glob then runs over the real `projects/`, and nothing is written in the hub.
- The C5 and C6 filters were simulated by the reader's `keep` set. Mine only was left out of that set, since every one of the 25 deck projects names `axel-faes` as lead or supervisor (`axel true` on every member line).

## Wrong or impossible in the brief

- Item 4 and C8, as first given: the dictated content was false for the 9 idea decks and the 2 text decks. Ruled and built (see "The cases the brief's rules got wrong").
- C1, as first given: the look will list the Too tall findings of the placed project decks. Ruled. The per-deck count those findings need is the look's, since a builder runs no page (first line).
- C4 listed the in-flight decks out of the reader's order. Ruled; membership holds.
- Every other premise the cases rest on reproduced: 25 research decks, 95 research projects, the deck folders (13 under `manuscripts`, 9 under `ideas`, 2 under `archive/published/2026`, 1 under `archive/failed`), the 24 decks the three groups hold today, the 7 domains, and the `deck_order` categories.

## Files changed

`.scratch/migration/agents/reviews/O150-report.md`, this report, the one path on the write list. No oculus file is changed: `diff -rq` of the base copy's `config`, `src`, `tests` and `utils` against the worktree's printed nothing for each, exit 0. No hub file is written. No test is added or changed.

## The verify list, after the last change

The list ran once, after this report was written. No whole-suite command ran.

- `npm run diagrams`: `diagrams exit 0`.
- `npm run test:quick`, its final lines: `test:quick: 3 changed file(s), from git since HEAD`, `test:quick: 0 test file(s)`, `ok      ASCII gate (2.0 s)`, `ok      svelte-kit sync (3.8 s)`, `ok      svelte-check (8.4 s): 1793984442872 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `test:quick: 12.5 s; every command passed`. The three changed files are the ledger's, and the run did not cover the build or the lint of unchanged files, as it says.
- The ASCII gate (the rules file's perl form) over this report printed nothing: `gate exit 0`.
- `git status --short`: ` M .scratch/migration/agents/briefs/O150.md`, `?? .scratch/migration/agents/briefs/O150-cases.md`, `?? .scratch/migration/agents/reviews/O150-report.md`. All three are under the ledger; the first two are the orchestrator's, and I wrote only the report. Nothing is changed outside the ledger.
