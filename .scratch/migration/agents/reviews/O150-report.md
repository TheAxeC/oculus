# O150 report: the hub's portfolio deck

Everything in the brief is done. The hub change is uncommitted, waiting on Axel's word.

## Open items

- Open item 689: `deck/engine.md:12` ("Each of the next slides leads with the governing equation, then specs, method, and results.") is false of the new run of 25 decks, nine of them `kind: idea` and two `kind: text`. The step leaves it as it is; the hub commit carries the rewording Axel rules.

## The cases' first run, on the unchanged hub

- C1: the Overview held three groups, `pillars 7`, `more 8`, `ideas 9` (24 of the 25 research decks; `archive/failed/fed-faithful-ecg` was in none), and the deck 22 slides ("1 / 22"). The title read "7 pillar projects and 8 more. A shared thesis: ...".
- C2: `OCULUS_TEST_HUB=~/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts --reporter=verbose` from oculus main: "the real hub > reads the portfolio deck with every named deck found" passed; 14 of 14 passed.
- C3: Stage `submitted`: "Filtered: 11 of 24 decks", 18 slides (the summaries, the transition and the grid included). The Stage menu listed nascent 6, scoping 2, exploring 1, submitted / under review 11, major revision 2, accepted / to appear 2, and no failed.
- C4: `git status --short deck` printed nothing; the whole `git status --short` printed the five paths of Axel's own work (`.oculus/data/academic/funding.yml`, `funding/2026-fwo-senior-transplant/RESEARCHQUESTIONS.md`, three untracked paths under `funding/2026-fwo-senior-transplant/proposal/proposal/`), saved to the scratchpad as `O150-status-before.txt`.
- C5: read in `groups.ts` (no run needed on either tree): a `coauthor/published/<year>/<p>/present` deck is reached by `projects/*/*/*/*/present`; a repository's deck lies outside the hub root `under` globs; a repeated folder name gives `name_twice`. The basenames of the 95 research folders hold no repeat.

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
| Verify 4, `git status --short deck` | DONE | ` M deck/present.yml`, ` M deck/title.md`, ` D deck/transition.md`; `diff` of the whole status before and after adds those three lines only |
| Verify 5, the look | DONE | below |
| C1 | met | 25 members, equal by path to the manifest enumeration (`diff O150-glob.txt O150-manifests.txt` prints nothing, 25 lines); Overview "research 25"; "1 / 28"; slides 3 to 27 in folder order, slide 3 "Keeping Federated Glass-Box ECG Models Honest" (fed-faithful-ecg), 4 dongho-ecg-clustering, 5 hccnet-fl, 6 to 14 the nine ideas, 15 to 27 the thirteen manuscripts, 28 the closing |
| C2 | met | Verify 3; the Findings view of the scratch oculus (164 findings) lists none on a deck file or a `present.yml` |
| C3 | met | "Filtered: 11 of 25 decks", "1 / 14"; the Stage menu adds "failed 1" |
| C4 | met | Verify 4 |
| C5 | met | by reading, as in the first run |

The look: the scratch oculus on 8797 (the gate at 57649a80d, HOME the scratch home), its hub copy refreshed with the two rsync commands of Verify 5 (25 `present.yml` under `projects/`), its `deck/` set to the step's files and restored from the backup after (`diff -r` prints nothing).

## The hub diff

`git diff deck` in the hub: `present.yml`'s groups `pillars`, `more` and `ideas` replaced by `research: { find: { folders: [projects/*/*/present, projects/*/*/*/present, projects/*/*/*/*/present], tiers: [research] }, discover: true, sort: folder }`, and its order reduced to `title.md`, `engine.md`, `{ slides: research }`, `closing.md`; `title.md`'s `legend: pillars` to `legend: research` and the lede's "{{pillars.count}} pillar projects and {{more.count}} more. " removed; `transition.md` deleted.

## Names and docs

- `git grep -n -E '\{\{ *(pillars|more)\.count *\}\}|transition\.md|slides: *(pillars|more|ideas)|legend: *(pillars|more|ideas)'` in the hub: no output, exit 1.
- `deck/engine.md:12`: made false, open item 689.
- Hub `README.md:60` (per-project content lives in `projects/<project>/` with an optional `present/` deck): still true.
- `.oculus/config.yml:26` (the portfolio deck is the folder whose `present.yml` the Present view opens): still true.

## Limitations and judgment calls

- A research project placed a level deeper than `projects/<a>/<b>/<c>/<d>/`, or in its own repository, is not found by the group; none is today.
- Dropping the summaries and the grid rests on a judgment that a slide of 25 rows overflows the frame; it was not measured.
- Member decks' slides show "Too tall" marks in the Overview (fed-faithful-ecg, dongho-ecg-clustering among them); those are the member decks' own, O151's to fix, and the integrity run's reader findings are none.

## Visible changes

- The deck: 22 slides in three runs with two summaries, a transition and an idea grid, to 28 slides: title, engine, the 25 research decks in folder order, closing.
- The first project slide: hccnet-revision's, to fed-faithful-ecg's ("Keeping Federated Glass-Box ECG Models Honest").
- The nine idea decks: cards of the grid (and slides of `ideas` members), to slides of their own in the run.
- The title: "7 pillar projects and 8 more. A shared thesis: ..." to "A shared thesis: ..."; its legend, four domains (liver, method, heart, brain) to seven (meta, privacy and liverfl added).
- The filter bar: 24 decks to 25, and the Stage menu gains "failed 1".
