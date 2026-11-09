# Step O177 refuter report (on .agents/worktrees/migration-O177 and the hub worktree of the same name, base 12f08efdc, hub base 76cf0c5f9)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

`.agents/scratch/` does not exist in the worktree, so `TMPDIR` could not be set to it. Every npm, npx and node command ran with `TMPDIR` unset, as the invocation says, and PATH starting with node v24.21.0. The case-run programs were read out of the builder's report by `awk` and piped to `node --input-type=module-typescript -`, with `../../` rewritten to `./`, so no file was written into the worktree. The one file the review wrote is the `unused-exports.sh` output, in the session scratchpad.

```
Brief's list, oculus worktree:

npm run test:quick -- --base 12f08efdc
  ok prettier | ok ASCII gate | ok svelte-kit sync | ok eslint | ok svelte-check (591 FILES 0 ERRORS 0 WARNINGS) | ok vitest slow | ok vitest | ok vitest checks
  test:quick: 56.2 s; every command passed
  (quick.mjs prints no verify-exit= line; `grep -n verify-exit tests/tiers/quick.mjs` prints nothing)

C1: npx vitest run tests/data/shapes/catalog-files/vocab.test.ts tests/state/boards/board/board-rules.test.ts
  Test Files  2 passed (2)
  Tests  125 passed (125)
  and, loading the shipped config: loadConfig(engineDir()) -> findings []

C2: OCULUS_TEST_HUB=/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O177 npx vitest run tests/checks/config/integrity.test.ts
  Test Files  1 passed (1)
  Tests  14 passed (14)

C3, C4: the report's case-c3-c4.mts, args <hub worktree> projects/umbrella/novel-math-primitives projects/umbrella/ecg-af-fair
  novel-math-primitives: stage umbrella; chips []; category umbrella; lane Umbrella; on_map yes
  ecg-af-fair: stage umbrella; chips []; category umbrella; lane Umbrella; on_map yes
  synthetic-umbrella-parked (C4): stage umbrella; chips [parked]; category umbrella; lane Backburner; on_map yes

C5: the report's case-c5.mts, no args (the output equals the report's, line for line)
  themes: 49; statuses: amber blue sky violet orange cyan green brass grey red slate pink teal
  Umbrella tone: blue
  Umbrella against Scope: lowest 23.05 in tokyolight
  Umbrella against De-risk: lowest 14.04 in kanagawadragon
  Umbrella against Build: lowest 10.42 in gruvboxlight
  Umbrella against Idea: lowest 11.17 in kanagawadragon
  Umbrella surface against the panel: lowest 13.88 in dracula
  folded: Umbrella against Review: lowest 0.00 in dracula; under 10 in 3
  folded: Umbrella against Blocked: lowest 20.88 in nord; under 10 in 0
  folded: Umbrella against Backburner: lowest 0.00 in dracula; under 10 in 2
  folded: Umbrella against Run: lowest 12.03 in rosepinedawn; under 10 in 0
  folded: Umbrella against Push: lowest 0.00 in light; under 10 in 49
  folded: Umbrella against Revise: lowest 14.04 in kanagawadragon; under 10 in 0
  folded: Umbrella against Funding: lowest 14.04 in kanagawadragon; under 10 in 0
  folded: Umbrella against Jobs: lowest 10.08 in macchiato; under 10 in 0
  folded: Umbrella against Teaching: lowest 10.42 in gruvboxlight; under 10 in 0
  status: synthwave --c-blue #61e2f9: nearest status on the hue sky 10.85; on -txt sky 10.85
  status: everforest --c-blue #87e3e3: nearest status on the hue sky 10.52; on -txt sky 10.52
  status: kanagawalotus --c-blue #324088: nearest status on the hue violet 11.40; on -txt sky 11.21
  open-layout pairs 21; under 10 in at least one theme: 0
  folded-only pairs 49; under 10 in at least one theme: 14

npx vitest run tests/data/sources/config/boards.test.ts
  Test Files  1 passed (1)
  Tests  46 passed (46)

ASCII gate (the perl command of agents/spec.md, with stderr of find dropped): printed nothing

Brief's list, hub worktree:

python3 -c "import yaml,sys;[yaml.safe_load(open(f)) for f in sys.argv[1:]]" .oculus/config.yml projects/umbrella/novel-math-primitives/project.yml projects/umbrella/ecg-af-fair/project.yml projects/active/sandpile-operator/project.yml
  printed nothing; yaml-exit=0

C6: git status --short, grouped by sed and uniq -c
     1  D "projects/ideas/ecg-af-fair/notes/presentations/FAIR2 UC.pptx"
     8  D projects/active/novel-math-primitives
    38  D projects/ideas/ecg-af-fair
     1  M .oculus/config.yml
     1  M docs/figures/gen_figures.py
     1  M docs/figures/hub-map.svg
     1  M docs/RESEARCH-APPROACH.md
     1  M projects/active/sandpile-operator/project.yml
     1  M README.md
     1 ?? projects/umbrella/
  find projects/umbrella -type f | wc -l: 47 (novel-math-primitives 8, ecg-af-fair 39)

The report's quoted evidence:

awk '/^## Open items/{f=1;print;next} /^## /{if(f)exit} f' .scratch/migration/orchestrator-state.md: heading and paragraph as the report quotes them
npx vitest run tests/checks/look: Tests  56 passed (56)
git diff 12f08efdc --stat, last line: 11 files changed, 96 insertions(+), 86 deletions(-)
wc -l src/lib/state/boards/focus.ts: 791
grep -rln --exclude=local.yml -i umbrella src tests config docs README.md: the 7 files the report lists
grep -rn --exclude=local.yml -E 'nascent, scoping|exploring, in-prep|in-flight, released' src tests config docs README.md: docs/templates.md:464 is the one hit naming the two idea stages without the word, other than vocab.yml:277, the idea row itself, and two test strings about new_idea
git diff 12f08efdc | grep -E '^\+' | grep -i -E '\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package)\b': two hits, the focus_lanes comment and singles.css, as the report says
LC_ALL=C grep -n '[^ -~]' over the 11 touched files: printed nothing
sh utils/unused-exports.sh compared by diff with O177-base/unused-exports.txt: no line differs
ls -la .agents/worktrees/O177-base: only unused-exports.txt
python3 -B -c "... hubmap_svg() ..." | cmp - docs/figures/hub-map.svg: hub-map-identical
cmp of each file under projects/umbrella against git show 76cf0c5f9:<old path>: DIFF on exactly the two project.yml and the two present/main.md
grep -rIn -E "exploring|parked" projects/umbrella: no line
case-c5.mts --hues --try <hues> over the base theme sheets (read through git show 12f08efdc:<path>, everything else from the worktree):
  blue: 3 misses: Build everforest 8.55; Build synthwave 9.44; Idea kanagawalotus 9.75
  try blue: themes missing 3: everforest, synthwave, kanagawalotus; folded under 10: Review-Umbrella 3, Backburner-Umbrella 2, Push-Umbrella 49, Teaching-Umbrella 2
    synthwave #03edf9: #61e2f9, 6.29 away, worst 10.85
    everforest #7fbbb3: #87e3e3, 10.52 away, worst 10.52
    kanagawalotus #4d699b: #324088, 13.53 away, worst 11.21
  try lime: themes missing 5; orange: 8; sky: 11; cyan-d: 13; indigo: 14; violet: 21; purple: 21; magenta: 24; cyan: 25
  (the three hexes and the theme counts equal the report's table; the moves 13.53, 26.90 and 10.51 for blue, lime and orange too)

Beyond the brief's list, naming folders only:
npx vitest run tests/data/shapes tests/data/sources/config tests/state/boards tests/checks/config tests/data/hubs/decks.test.ts tests/data/sources/present.test.ts tests/data/snapshot/tier-stage.test.ts
  Test Files  32 passed (32)
  Tests  654 passed | 9 skipped (663)
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds, `config/catalogs/vocab.yml:66` carries the label, `icon: folder` (`config/catalogs/glyphs.yml:125`), a colour and `on_map: true` alone, after `scoping`; the comment at `vocab.yml:52` was rewritten and reads true.
- 2: holds, `vocab.yml:276`, the label, `stages: { words: [umbrella] }`, a colour, no `rail`, before `idea`; the same diff also moved the `idea` row, Spec 1.
- 3: holds, `vocab.yml:284`, before `idea`.
- 4: holds, `vocab.yml:180`, between `incubate` and `idea`, the fields as named, no `label`, no `awaiting`.
- 5: holds, `vocab.yml:195` with the fields as named; C5 gives every open pair and the panel at 10 or more in 49 themes; three blocks carry a `--c-blue` of their own (`everforest.css:44`, `kanagawa.css:161`, `singles.css:287`), each at 10 or more against the status tokens on the hue and on `-txt`; the head comments name the added hues; the pair lists in the `focus_lanes` comment, the `focus_lane_tones` comment and `derive.ts:85-97` equal C5's 14 pairs and themes, and 8 of them are the band's.
- 6: holds, `docs/templates.md:564` and `:924`, `config/schemas/manifest-schema.yml:51`, `vocab.yml:52`, `src/lib/state/boards/focus.ts:651`. `docs/templates.md:464` is an example row of the `idea` category and lists no stages of its own to complete, so it rightly stays.
- 7: holds, the three test files are brought up to the new lists, no test added, all pass; Proof 1 concerns the evidence.
- 8: holds, `.oculus/config.yml`, the row with its comment; `audit.required_sections` is unchanged.
- 9: holds, the hub README's tree, table row and moves bullet, `docs/RESEARCH-APPROACH.md` (the sentence "The stage is one of" and the folder list), `gen_figures.py`'s row, and `hub-map.svg` equal to `hubmap_svg()` by `cmp`.
- 10: holds, 47 files; every file other than the two manifests and the two decks equals its base copy under `cmp`.
- 11: holds, read in both manifests: `stage: umbrella`, the `parked` chip gone, `status.line`, `next` and `latest` unchanged.
- 12: holds, read in both decks: the `Stage` specs and ecg-af-fair's headline; no other line changed (the four-file `cmp`, and the diffs the report lists).
- 13: holds, `projects/active/sandpile-operator/project.yml:9`, after `pillars`.

Cases of the brief's "Cases":

- C1: met, 125 passed, and `loadConfig(engineDir())` on the shipped file gives `findings []`.
- C2: met, 14 passed with `OCULUS_TEST_HUB` set to the hub worktree.
- C3: met, the program's output above: `umbrella`, `umbrella`, `Umbrella`, yes, for both projects.
- C4: met, the program's output above, lane Backburner.
- C5: met, the program's output above; every number on the open layout and the panel is 10 or more, and the folded pairs are printed.
- C6: met, the `git status --short` grouping and the count of 47 above.
- C7: met, the grep hits nothing.
- C8: met, by reading the places of item 6.

## 1. Spec

1. `config/catalogs/vocab.yml:277`: "`  - { key: idea,          label: { one: idea, other: ideas },                 stages: { words: [nascent, scoping] }, color: "#7c5cff" }`"; what is wrong: four spaces were removed from the `idea` row, so its `stages:` starts at column 79 where the base row and the `in-flight` and `umbrella` rows start it at column 83 (`git show 12f08efdc:config/catalogs/vocab.yml`, line 273). No item asks for a change to this row; item 2 only places a new row before it; failure scenario: a reader of the aligned table sees one row out of line, and the diff shows a change to the `idea` row that has no reason; verdict: none, item 2 stands.

2. `.scratch/migration/agents/reviews/O177-report.md`, section "Case-run programs": "`case-c5.mts` also carries the `--pick` mode above, which `--try` supersedes; the three hues in the sheets are the output of `--try blue`."; what is wrong: the brief's "Paths this step writes" allows only "the case-run programs C3, C4 and C5 name, which only print each case's result", and any other script needs an approval quoted from `plan.md`'s Rulings. `--pick` and `--try` print no case's result: they search an OKLCH grid for the colour to put in the sheets, and the three hexes shipped in `everforest.css`, `kanagawa.css` and `singles.css` are their output. C5 asks for a program that measures. No line of the Rulings approves a program that picks for this step (Rulings "Open item 672" is a ruling for O141 and names no program). The program writes no file, and the review's rerun reproduces the three hexes; failure scenario: three theme colours in shipped sheets are decided by a program the brief did not build, under a brief that says any such program needs approval, and a reader of the brief believes only printing programs ran; verdict: none, item 5's outcome holds by C5. Disposition is the orchestrator's.

## 2. Proof

1. `.scratch/migration/agents/reviews/O177-report.md`, section "Edits to existing assertions": "For each changed test, its failing line on the unchanged tree, by reading and not by a run, since putting the old vocabulary under the new tests is banned by `agents/spec.md`"; what is wrong: `agents/spec.md`, section "What every package obeys", asks the report to quote each changed test's failing line on the unchanged tree. The rule the builder cites bans breaking code to see a test fail. Editing a test first and running it on the unchanged `vocab.yml` breaks nothing, and that run was possible for all three test files. The report quotes no failure line for any of the changed expectations in `vocab.test.ts`, `board-rules.test.ts` and `boards.test.ts`. By reading, each changed expectation names a row or an index the base vocabulary does not hold, so each would have failed; failure scenario: a changed expectation that would pass on both trees could not be told apart from the report alone, and a later reader takes "by reading" as what the rule allows; verdict: none.

## 3. Standards

none

## 4. Behaviour

1. `.scratch/migration/agents/reviews/O177-report.md`, section "Before and after of each view a reader sees changed": "| Funding tab, audit | novel-math-primitives | a project at a `live` stage | no longer one, by the flag's rule at `vocab.yml:54`; not run, for the look |"; what is wrong: both projects were at `exploring`, which carries `live`, and both lose it. The row names one project, and `vocab.yml:54` also lists the Focus board's manifests behind and a venue's concentration marker, which no row states before and after. `ecg-af-fair` carries `funding: [FAIR]`, so only the Funding card part of the row is particular to novel-math-primitives; failure scenario: the look is read against this table, so the orchestrator checks the audit's in-flight rules for novel-math-primitives alone and never checks the manifests-behind list or the audit for ecg-af-fair; verdict: none.

## Declined to judge

- The reader-visible items the brief assigns to the orchestrator's look (the Projects board's pill with its count of 2, the rail count lower by 2, the Focus section between Incubation and Idea, a Pillars or Domains card kept awake, the Present deck order), not verifiable by a read or a rerun here; the look on a scratch server pointed at the hub worktree settles them. No case of the brief's "Cases" is assigned to the look.
- Whether the Umbrella lane may share Push's blue, so that the two headers are the same colour when Parked and Incubation are both folded. Item 5 binds the open layout only, and the comments state the pair. It is a judgment for the look and the orchestrator; the report's judgment call 1 names it.
- The quoted commands `git diff -U0` (the history words), `git diff -U0 tests`, `git diff --stat`, `git diff -U0 --word-diff=porcelain` and the `git show HEAD:` loop, not run in those forms because they have no base or name `HEAD`. The history words, the stat line and the `cmp` loop were run against the named base instead, as quoted above.
- The `difflib` read of `hub-map.svg` line by line, not run; the `cmp` of the file against `hubmap_svg()` and the read of the `gen_figures.py` diff cover the same change.
- The cases' first run on the unchanged trees, not rerun because the trees are changed; only the base hue table for `blue`, `lime` and `orange` was reproduced, through `git show` of the base sheets.
- The count of runs of the verify list and the red first run (a 5000 ms timeout in `vocab.test.ts`), which only the builder's transcript shows; `vocab.test.ts` passes here.
- The folded columns of the report's hue table for `sky` to `cyan`, whose printed lines the review cut at 200 columns; only the theme counts were compared, and the choice of blue rests on those.
- `--try` was not rerun over the changed sheets, since the picks were made on the base sheets.
- ADRs: `ls docs/adr` in the oculus worktree prints no such folder, so none governs the diff.
- `.oculus/local.yml` of the hub, not read, under the review's rules; the brief's premise leaves its references to the two moved folders out of what it checked.
- What git would ignore or record after staging in the hub (`git add` and `check-ignore` are outside the three permitted commands); `git status --short` shows `projects/umbrella/` as untracked with 47 files.

Usage: ab2166d2af0bc3b1a, claude-opus-5-5, 219077 tokens, 37 tool uses, 815 s

## Closed

- Spec 1 and Behaviour 1: repair round 1 (`agents/briefs/O177-round-1.md`).
- Spec 2: raised as open item 737.
- Proof 1: left as built. The run it asks for needs the code under test in its earlier state, which the no-breakage rule bans; a test is judged by reading, and the review's own reading is that each changed expectation would have failed on the base.
