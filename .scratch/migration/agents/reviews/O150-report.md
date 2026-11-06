# O150 report: the hub's portfolio deck

Everything in the brief and in repair round 1 is done. The hub change is uncommitted, waiting on Axel's word.

## Open items

- Open item 689: `deck/engine.md:12` ("Each of the next slides leads with the governing equation, then specs, method, and results.") is false of the new run of 25 decks, nine of them `kind: idea` and two `kind: text`. The step leaves it as it is; the hub commit carries the rewording Axel rules.
- Open item 690, a rule clash: rulings 678 and 685 put the failed and stopped decks in the portfolio deck, and its rule line (`deck/present.yml:1`) says the public deck holds "never a null or negative result". The one deck affected, `archive/failed/fed-faithful-ecg`, is now the first project slide, and its text says "In progress" and "Open to ... collaborators" of a failed project. The hub commit carries what Axel rules.

## The cases' first run, on the unchanged hub

The look's hub copy (`<scratchpad>/O138look/home/workspace/research-hub`) was backed up to `<scratchpad>/O150-deck-backup`, then refreshed from the hub (the two rsync commands of the brief's Verify 5; `diff -r ~/workspace/research-hub/deck <copy>/deck` printed nothing), so the first run read the hub's own unchanged deck. The backup, restored after each look, is the copy's state from before the look.

- C1: the Overview held three groups, `pillars 7`, `more 8`, `ideas 9` (24 of the 25 research decks; `archive/failed/fed-faithful-ecg` was in none), and the deck 22 slides ("1 / 22"). The title read "7 pillar projects and 8 more. A shared thesis: ...".
- C2: `OCULUS_TEST_HUB=~/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts --reporter=verbose` from oculus main: "the real hub > reads the portfolio deck with every named deck found" passed; 14 of 14 passed.
- C3: Stage `submitted`: "Filtered: 11 of 24 decks", 18 slides (the summaries, the transition and the grid included). The Stage menu listed nascent 6, scoping 2, exploring 1, submitted / under review 11, major revision 2, accepted / to appear 2, and no failed.
- C4: `git status --short deck` printed nothing; the whole `git status --short` printed the five paths of Axel's own work (`.oculus/data/academic/funding.yml`, `funding/2026-fwo-senior-transplant/RESEARCHQUESTIONS.md`, three untracked paths under `funding/2026-fwo-senior-transplant/proposal/proposal/`), saved as `<scratchpad>/O150-status-before.txt`.
- C5: read in `groups.ts` (the same on either tree): a `coauthor/published/<year>/<p>/present` deck is reached by `projects/*/*/*/*/present`; a repository's deck lies outside the hub root `under` globs; a repeated folder name gives `name_twice`. The basenames of the 95 research folders hold no repeat.

## Files changed

| File | Lines before | Lines after | Change |
|---|---|---|---|
| `deck/present.yml` | 54 | 15 | 3 lines added, 42 removed |
| `deck/title.md` | 8 | 8 | 2 lines changed |
| `deck/transition.md` | 6 | deleted | 6 lines removed |

From `git diff --stat e0d231cb0 -- deck` ("3 files changed, 5 insertions(+), 50 deletions(-)") and `wc -l`.

## DONE / NOT DONE

| Item or check | State | Evidence |
|---|---|---|
| 1. `deck/present.yml`, one group `research` | DONE | the hub diff below |
| 2. `deck/title.md`, counts dropped, `legend: research` | DONE | the hub diff below |
| 3. `deck/transition.md` deleted | DONE | ` D deck/transition.md` |
| 4. No finding of the deck; the filter bar draws | DONE | Verify 3; the look |
| Verify 1, YAML parses | DONE | `python3 -c "import yaml; yaml.safe_load(open('deck/present.yml'))"` exit 0 |
| Verify 2, ASCII gate | DONE | `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' deck/present.yml deck/title.md` printed nothing, exit 0 |
| Verify 3, integrity run | DONE | "the real hub > reads the portfolio deck with every named deck found" passed; "Tests 14 passed (14)" |
| Verify 4, `git status --short deck` | DONE | ` M deck/present.yml`, ` M deck/title.md`, ` D deck/transition.md`; the whole status is the first run's five lines plus those three |
| Verify 5, the look | DONE | below |
| C1 | met | the manifest list equals the decks the group's globs find, by path, and the Overview draws those 25 by name, in folder order (below) |
| C2 | met | Verify 3; no finding is on a `deck/` file; the 16 too-tall rows are on member decks' `present/main.md` files (below) |
| C3 | met | "Filtered: 11 of 25 decks", "1 / 14"; the Stage menu adds "failed 1" |
| C4 | met | Verify 4 |
| C5 | met | by reading, as in the first run |

C1's two lists. The manifest list, `<scratchpad>/O150-manifests.txt`, each research `project.yml` whose folder holds `present/present.yml`:

```
find projects -name project.yml | python3 -c "
import sys,yaml,os
out=[]
for p in sys.stdin.read().split():
    y=yaml.safe_load(open(p)); d=os.path.dirname(p)
    if isinstance(y,dict) and y.get('tier')=='research' and os.path.exists(d+'/present/present.yml'): out.append(d)
open('<scratchpad>/O150-manifests.txt','w').write('\n'.join(sorted(out))+'\n')"
```

The glob list, `<scratchpad>/O150-glob.txt`, the folders the group's three globs find that hold a `present.yml` (the deck's own globs, so it shows only that they reach every manifest's deck; the Overview below is the reader's own membership):

```
node -e "
const fs=require('fs');const s=new Set();for (const p of ['projects/*/*/present','projects/*/*/*/present','projects/*/*/*/*/present']) for (const m of fs.globSync(p)) if (fs.existsSync(m+'/present.yml')) s.add(m.replace(/\/present$/,''));
fs.writeFileSync('<scratchpad>/O150-glob.txt',[...s].sort().join('\n')+'\n')"
```

`diff O150-glob.txt O150-manifests.txt` prints nothing; each holds 25 lines. The Overview (the scratch server, after the change) draws, by slide number: 1 the title, 2 the engine, 3 "Keeping Federated Glass-Box ECG Models Honest" (archive/failed/fed-faithful-ecg), 4 "Which ECG representation actually lets clustering..." (archive/published/2026/dongho-ecg-clustering), 5 "Training one liver-cancer model across hospitals..." (archive/published/2026/hccnet-fl), 6 to 14 the nine ideas (BTD Autoencoder, Eval Artifacts, ECG-AF (FAIR), FL Privacy Audit, FLoRank Personalization, HCCNet FL Sweden, HCCNet Pathology, Quantum Tensor/FL, SSM Longitudinal), 15 to 27 the thirteen manuscripts' decks in folder order, 28 "Questions & collaborations welcome"; the group reads "research 25" and the deck "1 / 28".

The look: the scratch oculus on 8797 (the gate at 57649a80d, whose `src` and `config` equal the base's: `git log --oneline 57649a80d..81bda1d59 -- src config` prints nothing), HOME the scratch home, over the refreshed copy, its `deck/` set to the base's files (`git show e0d231cb0:deck/<file>`) and then to the step's, restored from the backup after (`diff -r` prints nothing).

The Too tall marks of the Overview, O146's measure, and the findings count of the status bar (148 before any deck is drawn):

| Deck | Too tall marks | Which slides | Findings count |
|---|---|---|---|
| The base deck | 16 | 3 to 9 and 12 to 19 (the 15 slides of `pillars` and `more`), 21 (the idea grid) | 164 |
| The step's deck | 16 | 3 to 5 and 15 to 27 (the 3 archived and 13 manuscript decks); none of the nine idea slides | 164 |

The 16 findings over 148 are the "slide too tall" rows, each on its member deck's `present/main.md`; no finding is on a file under `deck/`. Fixing the member decks' slides is O151's.

## The hub diff

`git diff e0d231cb0 -- deck` in the hub:

```diff
--- a/deck/present.yml
+++ b/deck/present.yml
@@ -3,52 +3,13 @@ deck:
     title: 'Structured models, everywhere they hide'
 
 groups:
-    pillars:
-        find: { folders: projects/*/*/present, tiers: [research], stages: [de-risking, exploring, in-prep, building, submit-ready, submitted, revision, published, nascent, scoping] }
-        slides:
-            - hccnet-revision
-            - covert-applied
-            - covert-theory
-            - bttn-incident-af
-            - raw-pls
-            - btfno
-            - bt-operator-theory
-    more:
-        find: { folders: [projects/*/*/present, projects/archive/published/*/*/present], tiers: [research], stages: [de-risking, exploring, in-prep, building, submit-ready, submitted, revision, accepted, published] }
+    research:
+        find: { folders: [projects/*/*/present, projects/*/*/*/present, projects/*/*/*/*/present], tiers: [research] }
         discover: true
         sort: folder
-        slides:
-            - bttd-source-eeg
-            - dries-bttr-ecg
-            - dongho-ecg-clustering
-            - fed-multicellular-immune
-            - meseret-cirrhosis
-            - ward-bttr-crosssubject
-    ideas:
-        find: { folders: projects/*/*/present, tiers: [research], stages: [nascent, scoping, de-risking, exploring] }
-        discover: true
-        slides:
-            - btd-autoencoder
-            - florank-personalization
-            - clinical-ai-eval-artifacts
-            - ecg-af-fair
-            - fl-privacy-auditing
-            - hccnet-fl-sweden
-            - hccnet-pathology
-            - ssm-longitudinal
-            - quantum-tensor-fl
 
 order:
     - title.md
     - engine.md
-    - { slides: pillars }
-    - { kind: summary, of: pillars, title: 'Active pillars, at a glance', foot: 'Unified by structured, interpretable tensor models.' }
-    - transition.md
-    - { slides: more }
-    - { kind: summary, of: more, title: 'The wider portfolio, at a glance', foot: 'The same structured-tensor backbone throughout.' }
-    - kind: grid
-      of: ideas
-      title: 'The idea pipeline, what is next'
-      lede: 'Early-stage directions seeding the next wave. Most reuse the federated, block-term and longitudinal machinery above, plus meta-science and methods bets.'
-      foot: 'Each gated on a novelty check before committing.'
+    - { slides: research }
     - closing.md
--- a/deck/title.md
+++ b/deck/title.md
@@ -1,8 +1,8 @@
 ---
 kind: title
 kicker: Research portfolio | technical briefing | June 2026
-legend: pillars
+legend: research
 ---
 # Structured models,<br>everywhere they hide
 
-{{pillars.count}} pillar projects and {{more.count}} more. A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away.
+A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away.
--- a/deck/transition.md
+++ /dev/null
@@ -1,6 +0,0 @@
----
-kind: section
-legend: more
-foot: 'Same four-layer format: equation | specs | method | measured results.'
----
-# {{more.count}} more, same backbone
```

## Names and docs

- `git grep -n -E '\{\{ *(pillars|more)\.count *\}\}|transition\.md|slides: *(pillars|more|ideas)|legend: *(pillars|more|ideas)'` in the hub: no output, exit 1.
- `deck/engine.md:12`: made false, open item 689.
- Hub `README.md:60` (per-project content lives in `projects/<project>/` with an optional `present/` deck; the portfolio deck is the hub's `deck/` folder): still true.
- `.oculus/config.yml:26` (the portfolio deck is the folder whose `present.yml` the Present view opens): still true.

## Limitations and judgment calls

- A research project placed a level deeper than `projects/<a>/<b>/<c>/<d>/`, or in its own repository, is not found by the group; none is today.
- Decision 2, measured: a summary and a grid of `research`, placed in the look's copy only, are both Too tall unfiltered (25 rows or cards, the 1280 by 720 frame of `config/defaults/present.yml`); with Stage `submitted` (11 decks) the summary fits and the grid stays Too tall. The deck drops both, so a summary would draw only under a narrowing; the booking in `choices.md` states this.
- The 16 member slides marked Too tall are the member decks' own, O151's to fix.

## Visible changes

- The deck: 22 slides in two runs with two summaries, a transition and an idea grid, to 28 slides: title, engine, the 25 research decks in folder order, closing.
- The first project slide: hccnet-revision's, to fed-faithful-ecg's ("Keeping Federated Glass-Box ECG Models Honest"), a `kind: text` slide with no status chip that describes the failed project as in progress (open item 690).
- The nine idea decks: drawn only as cards of the idea grid, to slides of their own in the run (slides 6 to 14), none of them Too tall.
- The Too tall marks: 16 to 16, on the 16 archived and manuscript slides in place of the 15 pillar and more slides and the idea grid; the findings count 164 to 164.
- The title: "7 pillar projects and 8 more. A shared thesis: ..." to "A shared thesis: ..."; its legend, four domains (liver, method, heart, brain) to seven (meta, privacy and liverfl added).
- The filter bar: 24 decks to 25, and the Stage menu gains "failed 1".
