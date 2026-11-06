# O150 report

NOT done: I have not counted the "slide too tall" findings per deck. Only a drawn page measures them, and the repair brief's item 6 rules that the orchestrator counts them at the look on landing. "Before and after, for the look", C1, says what to count. Everything else in the brief, the cases ruling (`agents/briefs/O150-cases.md`) and repair round 1 (`agents/briefs/O150-round-1.md`, items 1 to 5) is done.

## Open items of the state file, verbatim

Copied from `/Users/axelfaes/workspace/oculus/.scratch/migration/orchestrator-state.md`, section "Open items", as it stands while I write this. Items 697, 698 and 699 are ruled and closed there.

- 700 (2026-11-06, the Lit-Watch measurement owed to Axel, `agents/reviews/owed-looks.md` "Taken"): Lit Watch takes about 7.7 s to show its papers on a page load, against 1.5 s for the shell, because the browser's main thread is blocked for 5.5 s in one frame while it builds the view, which draws all 678 papers' cards at once (39,956 elements; the likely cost, not profiled by function); the server and the radar file cost about 50 ms. (a) A step: Lit Watch draws the cards of the papers on screen and those just below, and the rest as they are scrolled to, with the bucket heads and their counts unchanged and a search still over every paper. Pros: the view shows at once, whatever the radar holds. Cons: one step; a find-in-page (Cmd+F) then sees only drawn cards, the view's own search still sees all. (b) Leave it. Cons: about 6 s of a frozen page each time Lit Watch is drawn, and more as the radar grows. Recommended (a); (b) is the lazy option.

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

- Item 4 and C8. The rule asked for a sentence saying "each project's slides first giving its governing equation where it has one, then its specs, method and results", true for the 25 decks. The result: 11 of the 25 decks draw none of these. Nine are one `kind: idea` card each and two are one `kind: text` slide each (the listing above). Handed back before any change. The cases ruling (point 1) says the sentence names no count and claims no part a deck may lack. Repair round 1 (item 2) adds that the claim about what a project's slides give is tied to the slides themselves. Built so.
- C1. The rule asked for "no deck finding under Findings". The result: the Present view lists each slide it has drawn taller than its frame under Findings (`docs/HELP.md:331`, `tallFindings` at `src/lib/state/life/present.svelte.ts:513-520`), and O157's look measured 16 of the 25 project decks Too tall. The cases ruling (point 2): C1 holds when the portfolio deck's state is `ok` and the reader raises no finding on its own files. The "slide too tall" findings on the project decks' own files are counted per deck, and repair round 1 (item 6) makes that count the orchestrator's at the look.
- C4. The brief listed in-flight as `bt-operator-theory, btfno (revision), ecg-af-fair (exploring)`. The reader places `ecg-af-fair` first, by the board's stage order. The cases ruling (point 3): the reader's order stands, and the brief listed membership only.
- Item 7. The cases ruling (point 4): every `pillars` hit is judged. Done under "Item 7, the grep over oculus".

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1. `deck/present.yml` rewritten | DONE | "Hub files" below. `node o150-cases.ts new o150-deck none`: `order entries file:title.md, file:engine.md, group:projects, file:closing.md`, `group projects: members 25, kept 25, count 25, missing [], conflicts 0, candidates 0`, `state ok, deck findings 0` |
| 2. `deck/transition.md` removed | DONE, in the report for the orchestrator | "Hub files" names the removal; no order entry names it (C10 grep below) |
| 3. `deck/title.md` and the framing redraft (round 1 items 1 and 3) | DONE | "Hub files" and "Proposed framing". The run prints `title "Research projects"`, the title slide's `lede "Research projects that have a deck of their own, each in its own slides."` and `legend [hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl]` |
| 4. `deck/engine.md:12` (round 1 item 2) | DONE | The sentence: "Next come research projects' own decks, one after another: a project slide shows its project's governing equation, specs, method and results, each where the slide states it." C8 below |
| 5. `deck/closing.md` unchanged | DONE | Not in "Hub files". Every run reads the hub's closing slide (slide 28, heading `"Questions &amp;<br>collaborations welcome"`) |
| 6. "Hub files" section | DONE | Below: three fenced blocks and the removal |
| 7. The grep over oculus | DONE | "Item 7, the grep over oculus" below. No sentence is made false, and no oculus file is changed |
| Round 1 item 4, the open items | DONE | Copied above from main's state file |
| Round 1 item 5, the filter bar before and after | DONE | "Before and after, for the look", C2 and C5 |
| C1, reader side | DONE | `state ok, deck findings 0` in all three new runs |
| C1, per-deck count of "slide too tall" | NOT DONE, the look's | Round 1 item 6: the orchestrator counts it at the look on landing |
| C2 to C10 | DONE, with the look's parts on landing | "The cases on the built files" below |
| Verify 1, ASCII gate | DONE | The perl gate over the scratch copies of the three hub texts (the bytes quoted below) printed nothing, `gate exit 0`. For this report, see the last section |
| Verify 2, the texts parse | DONE | Three `node -e` runs below |
| Verify 3, `git status --short` | DONE | See the last section |
| Verify 4, `npm run test:quick` | DONE | See the last section |
| Verify 5, prose | DONE | "Prose of the new sentences" below |
| Unused exports | DONE | From the worktree's root, `sh utils/unused-exports.sh 2>&1 \| diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O150-base/unused-exports.txt -` printed nothing, `diff exit 0`. The step adds no line |

## Hub files

The orchestrator writes these into `~/workspace/research-hub/deck/` at landing; the hub commit waits on Axel's word. Each file ends with one newline after its last line, as the hub's files do: `tail -c1 | od -An -c` gave `\n` for each scratch copy.

`deck/present.yml`:

```yaml
deck:
    title: 'Research projects'

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
# Research projects

Research projects that have a deck of their own, each in its own slides.
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
3. **Composable with constraints.** The same factorization carries through a lead-field constraint, federation, differential privacy, and spectral operators for PDEs.

Next come research projects' own decks, one after another: a project slide shows its project's governing equation, specs, method and results, each where the slide states it.
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
> # Research projects
8c8
< {{pillars.count}} pillar projects and {{more.count}} more. A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away.
---
> Research projects that have a deck of their own, each in its own slides.
-- diff engine.md
4c4
< # The common engine: rank-(L,L,1) block-term decomposition
---
> # A recurring engine: rank-(L,L,1) block-term decomposition
6c6
< A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across the portfolio:
---
> A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across several of the portfolio's projects:
10c10
< 3. **Composable with constraints.** The same factorization carries through irregular time, federation, differential privacy, and unaligned geometry.
---
> 3. **Composable with constraints.** The same factorization carries through a lead-field constraint, federation, differential privacy, and spectral operators for PDEs.
12c12
< Each of the next slides leads with the governing equation, then specs, method, and results.
---
> Next come research projects' own decks, one after another: a project slide shows its project's governing equation, specs, method and results, each where the slide states it.
```

The `present.yml` diff removes line 1 (the comment), the three groups and the old order entries. It sets `title: 'Research projects'`, the group `projects` with `find: { folders: [projects/**/present], tiers: [research] }` and `discover: true`, and the four order entries. The diff names only lines 4, 6, 10 and 12 of `engine.md`; every other line is the hub's, byte for byte. In `title.md`, lines 1, 2, 5 and 7 are the hub's.

The parse of each text with the `yaml` package, typed on the command line in the worktree:

```
$ node -e "const Y=require('yaml'); console.log(JSON.stringify(Y.parse(\"deck:\n    title: 'Research projects'\n\ngroups:\n    projects:\n        find: { folders: [projects/**/present], tiers: [research] }\n        discover: true\n\norder:\n    - title.md\n    - engine.md\n    - { slides: projects }\n    - closing.md\n\")))"
{"deck":{"title":"Research projects"},"groups":{"projects":{"find":{"folders":["projects/**/present"],"tiers":["research"]},"discover":true}},"order":["title.md","engine.md",{"slides":"projects"},"closing.md"]}
$ node -e "const Y=require('yaml'); console.log(JSON.stringify(Y.parse('kind: title\nkicker: Research portfolio | technical briefing\nlegend: projects\n')))"
{"kind":"title","kicker":"Research portfolio | technical briefing","legend":"projects"}
$ node -e "const Y=require('yaml'); console.log(JSON.stringify(Y.parse('kind: section\n')))"
{"kind":"section"}
```

## Proposed framing

Each draft is given beside the words it replaces, claim by claim, with the decks that bear it out and any deck that does not. These are for Axel's corrections at landing.

### The deck title and the title slide

- `present.yml` `deck.title`, and `title.md:6`, the heading that repeats it. Today: "Structured models, everywhere they hide" (the heading breaks it with `<br>`). Draft: "Research projects".
  - The claim: each deck placed is a research project's deck.
  - Borne out by all 25: the group keeps a deck only when its project's `tier` is `research` (`tiers: [research]`). The run prints `research | axel true` for each of the 25 members and `held decks of no research project with a deck: []`. `quantum-tensor-fl` is a research project (`idea | nascent | quantum-tensor-fl | research`).
  - It stays true once every research project has a deck, since a deck of any other tier is not kept.
  - No deck fails it.
- `title.md:8`, the lede. Today: "{{pillars.count}} pillar projects and {{more.count}} more. A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away." Draft: "Research projects that have a deck of their own, each in its own slides." It makes two claims.
  - "Research projects that have a deck of their own": each of the 25 is a research project with its own `present/` deck (`research projects 95, with a deck 25`, and every member path ends in `/present`). The phrase has no article and names the projects as those with a deck, so it does not say the deck holds every research project. It stays true under any filter, and once every research project has a deck. No deck fails it.
  - "each in its own slides": the reader places each member deck's own slides (`{ slides: projects }`; slides 3 to 27 carry one project key each). `quantum-tensor-fl` is slide 23, its own `idea` card. No deck fails it.
  - The thesis sentence is gone whole. Three decks (`clinical-ai-eval-artifacts`, `fl-privacy-auditing`, `ssm-longitudinal`) name no tensor word. `quantum-tensor-fl`'s card names a method and no data, so no claim about the decks' data holds for all 25.
- `title.md:3`, the kicker. Today: "Research portfolio | technical briefing | June 2026". Draft: "Research portfolio | technical briefing". The date is past and no date stays true. The other words are Axel's and are kept.

### The engine slide

- `engine.md:4`, the heading. Today: "The common engine: rank-(L,L,1) block-term decomposition". Draft: "A recurring engine: rank-(L,L,1) block-term decomposition". "Common" claimed every deck; "recurring" claims that several decks show it.
  - Borne out by 8 decks whose slides draw a block-term word: `bt-operator-theory`, `btfno`, `bttd-source-eeg`, `bttn-incident-af`, `covert-applied`, `dries-bttr-ecg`, `fed-faithful-ecg` (main.md:12, "Interpretable block-term ECG models") and `florank-personalization` (its card, "a block-term adapter").
  - The other 17 show no block-term word. The heading makes no claim about them.
  - `ward-bttr-crosssubject` names `BTTR deflation` only in `mechanism:`, which only a summary row draws, and the deck has no summary.
- `engine.md:6`, the lede's end. Today: "That middle ground recurs across the portfolio:". Draft: "That middle ground recurs across several of the portfolio's projects:". The same 8 decks bear it out. The phrase claims several projects, not all.
- `engine.md:8`, kept: "**Interpretable by construction.** Sparse and low-rank cores <i>are</i> the explanation: per-block (time x lead) or (freq x lead) signatures a clinician can read."
  - (time x lead) maps: `dries-bttr-ecg` ("Every block <b>is</b> a (time x lead) weight map, faithful by construction", main.md:30).
  - (freq x lead) signatures: `bttn-incident-af` ("Per-block (freq x lead) signatures make each risk score auditable", main.md:39; "a clinically coherent readout", main.md:30).
  - Sparse cores: `covert-applied` ("A sparse, interpretable multiway core (87% zero entries)", main.md:45).
  - Every claim of the line is borne out, so it is not redrafted.
- `engine.md:9`, kept: "**Parameter-efficient.** An (R,L) knob matches CP and Tucker budgets while dedicating capacity to distinct regimes (scales, modalities, leads)."
  - The (R,L) knob between CP and Tucker at matched parameters: `btfno` ("(R,L) interpolate CP <-> Tucker", main.md:17; "matched ~670k params", main.md:36) and `bt-operator-theory` ("better than CP/Tucker at matched capacity", main.md:8).
  - Scales: `btfno` ("specialist blocks, each tuned to its own scale", main.md:11).
  - Modalities: `covert-applied` ("Same patients, different modalities per site", main.md:25).
  - Leads: `bttn-incident-af` ("low-rank (freq, lead) subspaces", main.md:32).
  - Every claim is borne out, so it is not redrafted.
- `engine.md:10`. Today: "**Composable with constraints.** The same factorization carries through irregular time, federation, differential privacy, and unaligned geometry." Draft: "**Composable with constraints.** The same factorization carries through a lead-field constraint, federation, differential privacy, and spectral operators for PDEs."
  - Dropped, "irregular time": no block-term deck shows it. `btfno`'s line (main.md:42) is a plan ("could give HCCNet ... from irregular longitudinal history"), and `hccnet-revision`, which shows irregular time, draws no block-term word.
  - Dropped, "unaligned geometry": the one block-term deck that tests alignment shows the opposite. `dries-bttr-ecg`, main.md:35: "aligned 0.715 vs unaligned 0.434 (chance)". `raw-pls`, which handles unaligned MRI, draws no block-term word.
  - Added, "a lead-field constraint": `bttd-source-eeg` ("lead-field-constrained block-term decomposition", main.md:7).
  - Kept, "federation": `covert-applied` (a coupled block-term model across departments, only a secure-aggregated score crossing, main.md:37-39); also `fed-faithful-ecg` (block-term ECG models across a multi-hospital federation, main.md:12) and `florank-personalization` (federated personalization with a block-term adapter).
  - Kept, "differential privacy": `covert-applied` ("clipped + DP-noised score", main.md:26, over its "Coupled block-term model", main.md:37).
  - Added, "spectral operators for PDEs": `btfno` ("BT-FNO gives each spectral layer a sum of specialist low-rank blocks", main.md:8) and `bt-operator-theory` (block-term neural operators on PDEBench).
- `engine.md:12`. Today: "Each of the next slides leads with the governing equation, then specs, method, and results." Draft: "Next come research projects' own decks, one after another: a project slide shows its project's governing equation, specs, method and results, each where the slide states it."
  - The first clause holds for slides 3 to 27 (C3), under any filter, and once every research project has a deck.
  - The second clause is tied to the slide itself, so it holds in every case:
    - The 13 project slides with `equation:` state all four.
    - `ward-bttr-crosssubject`'s project slide states specs, method and results and no equation.
    - The 9 idea cards and the 2 text slides are no project slide, so the clause says nothing of them. `ecg-readable-substrate` is one of the two text slides ("Key results" / "- In progress.").
    - If its deck later opens with a project slide that states no results, the clause still holds.
  - The sentence carries no count.

## The cases on the built files

Read with the case-run program over the hub, with the three drafted files handed to the reader as drafts. Every state is with Mine only on: `axel true` on every member line.

- C1. Reader side holds: `state ok, deck findings 0` with no filter, with `submitted` and with `in-prep`; `snapshot findings 0`. The "slide too tall" count per deck is the look's (round 1 item 6).
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
- C7. Holds: `title.md` holds no `{{pillars.count}}`, `{{more.count}}` or `legend: pillars` (the C10 grep, and `grep -n '{{'` over `title.md` and `engine.md`, exit 1). The legend draws `[hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl]`, the seven domains each once, and no finding is raised.
- C8. Holds, as "Proposed framing", `engine.md:12`, sets out for each claim.
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

How the hits were found:
- The folders: `grep -rln ... | awk -F/ '{ ... print $1"/"$2"/"$3 }' | sort | uniq -c`.
- The deck-group hits: `grep -rn --exclude=local.yml -E 'pillars\.count|legend: *pillars|slides: *pillars|of: *pillars|groups\.pillars|group pillars|\{ *slides: *pillars'`, plus `grep -n 'pillars'` over each deck test file.
- The old and new deck titles and the new lede: `grep -rn --exclude=local.yml -e 'Research projects that have' -e 'Structured models' src tests config docs README.md` printed nothing.

## The case-run program

What it does:
- It runs oculus's deck reader over the research hub, read only.
- In mode `new` it reads the text of `present.yml`, `title.md` and `engine.md` from the scratch copy `o150-deck` (the three files of "Hub files", byte for byte). It hands them to the reader as an editor's drafts over the hub's own deck paths; the reader reads drafts in place of a file's text at `src/lib/data/sources/deck/read.ts:260-264`. So the glob runs over the real hub's `projects/` and nothing is written there.
- `transition.md` stays on disk, and no order entry names it.
- A filter is the reader's `keep` set, the bare keys of the projects at the named stage, as the deck route passes it (`src/lib/server/content/deck/read.ts:76,101`).

It was run as `node o150-cases.ts <base|new> <scratch deck folder> <none|stage>` from the scratchpad; each of the four runs exited 0. The program, its outputs and the scratch copy are removed: `rm -f`, `rm -rf`, then `ls $S | grep -E '^o150'` printed nothing.

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
mode new, filter none, portfolio_deck deck, title "Research projects"
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
  slide 1 (deck) title heading "Research projects" legend [hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl]
    lede "Research projects that have a deck of their own, each in its own slides."
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
mode new, filter submitted, portfolio_deck deck, title "Research projects"
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
  slide 1 (deck) title heading "Research projects" legend [hub:heart,hub:brain,hub:liver,hub:method]
    lede "Research projects that have a deck of their own, each in its own slides."
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
mode new, filter in-prep, portfolio_deck deck, title "Research projects"
snapshot findings 0
research projects 95, with a deck 25
state ok, deck findings 0
order entries file:title.md, file:engine.md, group:projects, file:closing.md
group projects: members 25, kept 0, count 0, missing [], conflicts 0, candidates 0
research decks the groups do not hold: []
held decks of no research project with a deck: []
slides 3
  slide 1 (deck) title heading "Research projects" legend []
    lede "Research projects that have a deck of their own, each in its own slides."
    kicker "Research portfolio | technical briefing"
  slide 2 (deck) section heading "A recurring engine: rank-(L,L,1) block-term decomposition" legend []
    lede "A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across several of the portfolio's projects:"
  slide 3 (deck) closing heading "Questions &amp;<br>collaborations welcome" legend []
    lede "Happy to go deeper on any one: the clinical motivation, the optimization and theory, or the data pipeline. Several are open to collaborators across computer science, psychology, and medicine."
    kicker "Thank you"
project slides 0, with no equation []
slide kinds {"title":1,"section":1,"closing":1}
```

The gate, C9, C10 and the count-token grep over the drafted files, before the scratch copy was removed:

```
gate exit 0
C9 grep exit 1
C10 grep exit 1
count grep exit 1
```

The categories of the members for the filter bar's slices: `grep -E '^  [a-z-]+ \| ' <output> | cut -d'|' -f1 | sort | uniq -c`. Over the base output it gave `8 idea`, `3 in-flight`, `11 in-review`, `2 publications`. Over the new output it gave `1 dead-ends`, `8 idea`, `3 in-flight`, `11 in-review`, `2 publications`.

## Before and after, for the look

Open these on a copy of the hub with the three files of "Hub files" written in and `deck/transition.md` removed. Use the Present view with no deck named (the portfolio deck), Mine only on (its default; every one of the 25 deck projects names `axel-faes`, so Mine only leaves out none).

- C1. Before: Findings lists no reader finding of the portfolio deck. After: the same, with the deck's state `ok`. Count the "slide too tall" findings under Findings that sit on the project decks' own files, and name each deck with its count. O157's look measured 16 of the 25 project decks Too tall. Before this step the deck placed 14 project slides and 1 text slide; after, it places 14 project slides, 2 text slides and 9 idea slides.
- C2. The Overview and the filter bar.
  - Overview before: three group headings, `pillars` (7), `more` (8), `ideas` (9), with `fed-faithful-ecg` in none.
  - Overview after: one heading, `projects`, with 25 decks, `fed-faithful-ecg` among them, and an Add tile with no candidate.
  - The filter bar is drawn over the projects whose decks the groups hold (`docs/decks.md`, "The filter"). Before, line 2 reads "24 projects", with slices for 4 categories: publications 2, in-review 11, in-flight 3, idea 8, and no dead-ends slice. After, line 2 reads "25 projects", with a fifth slice, dead-ends 1 (`fed-faithful-ecg`).
  - The portfolio deck now places `fed-faithful-ecg`'s text slide (slide 27). Its project facts strip shows the stage chip `failed`, drawn as it is (`docs/decks.md:387`; `project.yml:2` is `stage: failed`).
- C3. Overview. Before: 22 tiles, with 2 summaries, the "8 more, same backbone" section and the idea grid. After: 28 tiles in the order of "The cases on the built files", C3. There is no summary, grid or transition, and 9 idea cards stand as tiles.
- C4. Overview, the order of the 25 tiles: the categories and titles as C4 above lists them.
- C5. The filter bar, the stage `submitted`. Before: line 2 reads "11 of 24 shown". After: "11 of 25 shown", the dead-ends slice offered beside the four others. After shows 14 tiles (title, engine, the 11 in-review decks, closing), and the title slide's legend shows heart, brain, liver and method. Clear all gives 28 tiles again and "25 projects".
- C6. The filter bar, the stage `in-prep`. After: 3 tiles (title, engine, closing), the title slide with no legend, and no finding.
- C7. The title slide.
  - Before: kicker "Research portfolio | technical briefing | June 2026", heading "Structured models, everywhere they hide", lede "7 pillar projects and 8 more. A shared thesis: ...", a legend of 4 domains.
  - After: kicker "Research portfolio | technical briefing", heading "Research projects", lede "Research projects that have a deck of their own, each in its own slides.", a legend of 7 domains (liver, heart, brain, method, meta, privacy, liverfl), each once.
  - The deck's tab and its deck menu entry read "Research projects".
- C8. The engine slide. After: heading "A recurring engine: rank-(L,L,1) block-term decomposition"; the lede ending "recurs across several of the portfolio's projects:"; point 3 reading "... carries through a lead-field constraint, federation, differential privacy, and spectral operators for PDEs."; and the last line "Next come research projects' own decks, one after another: ...". Points 1 and 2 are unchanged.
- C9. `deck/present.yml` in the hub has no comment line: `grep -n '^\s*#' deck/present.yml` prints nothing.
- C10. `ls deck` shows `closing.md engine.md present.yml title.md`. `grep -n -E 'transition\.md|pillars|more|ideas' deck/*` prints nothing.

## Prose of the new sentences

Each new sentence was read against the rules file's prose rule: plain, ASCII, no em dash, no quip and no "not X but Y" construction.

- "Research projects": a plain noun phrase.
- "Research portfolio | technical briefing": the kicker's own words, less the date.
- "Research projects that have a deck of their own, each in its own slides.": a lede in the deck's voice, with no verb of its own, as a title slide's lede can be.
- "A recurring engine: rank-(L,L,1) block-term decomposition": plain.
- "That middle ground recurs across several of the portfolio's projects:": plain.
- "**Composable with constraints.** The same factorization carries through a lead-field constraint, federation, differential privacy, and spectral operators for PDEs.": plain. Its list has four items, the four settings the decks show.
- "Next come research projects' own decks, one after another: a project slide shows its project's governing equation, specs, method and results, each where the slide states it.": plain. Its list of four is the four parts a project slide has.

No sentence departs from the rule.

## Judgment calls

- The deck title is "Research projects", plain, since every richer claim tried against the 25 decks fails for at least one. `quantum-tensor-fl`'s card names no data. The decks of `btfno` and `bt-operator-theory` are not clinical. Three decks name no tensor word.
- The lede names the projects as those that have a deck, with no article, so it holds under any filter and makes no claim about the research projects without one.
- The kicker drops the date and keeps "Research portfolio | technical briefing".
- Engine line 10 keeps "federation" and "differential privacy", drops "irregular time" and "unaligned geometry", and adds the two settings block-term decks show: a lead-field constraint and spectral operators for PDEs. The heading "Composable with constraints" stays, as Axel's words. "spectral operators for PDEs" is a setting the factorization is carried into, and is not a constraint in the narrow sense; Axel may prefer a heading that fits all four.
- Engine lines 8 and 9 stay. Every claim of each is borne out by a named deck ("Proposed framing").
- Engine line 12 ties its claim to "a project slide" and to what "the slide states", so an idea card, a text slide and a project slide that states no results all leave it true.
- The case-run program reads the drafted files as drafts over the hub's own paths in place of a scratch copy of the whole hub. The glob then runs over the real `projects/`, and nothing is written in the hub.
- The C5 and C6 filters are simulated by the reader's `keep` set. Mine only is left out of the set, since all 25 deck projects name `axel-faes` as lead or supervisor (`axel true` on every member line).

## Wrong or impossible in the brief

- Item 4 and C8, as first given: the dictated content was false for the 9 idea decks and the 2 text decks. Ruled by the cases ruling and repair round 1 item 2, and built.
- C1, as first given: the look will list the Too tall findings of the placed project decks. Ruled; the per-deck count is the orchestrator's at the look (round 1 item 6).
- C4 listed the in-flight decks out of the reader's order. Ruled; membership holds.
- Every other premise the cases rest on reproduced: 25 research decks, 95 research projects, the deck folders (13 under `manuscripts`, 9 under `ideas`, 2 under `archive/published/2026`, 1 under `archive/failed`), the 24 decks the three groups hold today, the 7 domains, and the `deck_order` categories.

## Files changed

`.scratch/migration/agents/reviews/O150-report.md`, this report, the one path on the write list. No oculus file is changed: `diff -rq` of the base copy's `config`, `src`, `tests` and `utils` against the worktree's printed nothing for each, exit 0. No hub file is written. No test is added or changed.

## The verify list, after the last change

The list ran once after this report was written. No whole-suite command ran.

Before it, the quoted deck lines of "Proposed framing" were re-read on the hub with one `grep -n -E` over the 25 decks' `main.md` files, and each one cited matched. The `deck/` lines quoted under C9 and C10 were re-read with the C9 and C10 greps over the hub, and `ls deck` printed `closing.md engine.md present.yml title.md transition.md`.

`npm run diagrams` printed the diagram files it rebuilt, ending:

```
docs/diagrams/channels.svg
docs/diagrams/writes.dot
docs/diagrams/writes.svg
```

`npm run test:quick`, once:

```
test:quick: 4 changed file(s), from git since HEAD
test:quick: 0 test file(s)
ok      ASCII gate (1.4 s)
ok      svelte-kit sync (3.2 s)
ok      svelte-check (7.8 s): 1793985627887 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 11.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The four changed files are the ledger files below. `.scratch` and `*.md` are in `.prettierignore`, so they select no test file. The green run covers no oculus code, because the step changes none. It does not cover the hub texts either, which the case-run program read.

`git status --short`:

```
 M .scratch/migration/agents/briefs/O150.md
?? .scratch/migration/agents/briefs/O150-cases.md
?? .scratch/migration/agents/briefs/O150-round-1.md
?? .scratch/migration/agents/reviews/O150-report.md
```

The orchestrator changed the three brief files. This report is the only file the builder wrote.

The perl ASCII gate over this report printed nothing (`gate exit 0`). `diff -rq` of the base copy against the worktree printed nothing for `config`, `src`, `tests` and `utils` (each `diff exit 0`). `sh utils/unused-exports.sh 2>&1 | diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O150-base/unused-exports.txt -` printed nothing (`unused diff exit 0`).
