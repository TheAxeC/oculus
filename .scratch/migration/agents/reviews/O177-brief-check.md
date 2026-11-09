Brief check of O177. Nothing was changed in either repository (`git status --short` on both at the end: oculus shows only the two untracked briefs O176.md and O177.md; hub 0 lines). Program files of mine are only in the session scratchpad. Main moved from 30e1d996b to 1f9c69f37 during the check (`git log --oneline -4`: two commits preparing and launching O175); `git diff --stat 30e1d996b HEAD` over the brief's paths and boards.test.ts prints nothing, so the premises stand on head.

Most serious first: (1) item 5 and C5 cannot be met by a colour in vocab.yml, by measurement; (2) `tests/data/sources/config/boards.test.ts` becomes false and is on neither the brief's lists nor `npm run test:quick`; (3) C7 uses a banned git command and cannot hit on the moved files; (4) item 6 and the write list collide with spec.md:72.

## Names

`grep -rn --exclude=local.yml -i umbrella src tests config docs README.md bin utils`: no hit, so no key collision for the stage, category, cluster or lane. `find projects -type d -name umbrella` in the hub: none.

Hits outside the brief's paths, by `grep`/`git grep` for the stage lists, `focus_clusters|focus_lanes|deck_order`, category keys, and `projects/(active|ideas)`:

- `tests/data/sources/config/boards.test.ts`, 12 lines naming `categories[7]` (223, 227, 232, 238, 244, 275, 276, 283, 292, 293, 304, 305; `grep -n "categories\[7\]" ... | wc -l` prints 12). `withRows` (line 191) appends after `SHIPPED.categories`, and the hub rows of lines 275-305 come after oculus's rows, so the first added row becomes index 8. Made false: yes, 12 lines. It is not in "What is on the tree", not in item 7, not in the paths. It is the test of guarded entry G124 (`guarded.md:188`). Item 7 limits the builder to "the tests of What is on the tree".
- `tests/tiers/quick.mjs:165-193`: `npm run test:quick` chooses a test that imports a changed file or is named `<stem>.test.ts`. For `vocab.yml` that is `vocab.test.ts`. boards.test.ts imports no changed file, so the verify list does not run it and the 12 red lines reach main unseen unless the builder is told.
- `config/schemas/manifest-schema.yml:51`, the `help:` of the form's Stage field: "an idea (nascent, scoping), work in flight (de-risking, exploring, in-prep, ...), or done (...)". Made false: yes, it gives the whole list and omits the word; the reader sees it in the project form. Item 6 covers it ("any other a grep of the words finds"); the paths list does not name the file.
- `config/catalogs/vocab.yml:214`, the comment above `focus_lane_tones`, is a third list of the under-10 pairs. Item 5 names "that comment and derive.ts" and says "neither comment"; this third list becomes incomplete if any band column (Funding, Jobs, Teaching) is under 10 against Umbrella when clusters are folded.
- `config/catalogs/vocab.yml:52`, "the idea group (nascent, scoping), the in-flight group (de-risking to revision)": false for a word placed between scoping and de-risking unless rewritten. Item 1's "stays true" covers it; in path.
- `tests/data/shapes/catalog-files/vocab.test.ts:47`, "oculus's four clusters", in path, covered by item 7.
- Tests that read the shipped lists and stay true, each read: `tests/state/shared/hub-words.test.ts:118-120`, `tests/data/sources/config/layers/hub-vocab.test.ts:56,67,240-242`, `tests/server/edit/config-value.test.ts:203-228`, `tests/data/sources/present.test.ts:748` (derived or naming no umbrella deck), `tests/checks/source/keys.test.ts:229`.
- `docs/data-map.md:88-100`, `:143-146`, `docs/decks.md:126,131`: key descriptions, not lists; not false.
- Hub `docs/RESEARCH-APPROACH.md:55` "The stage is one of nascent, scoping, ..., failed and stopped": false after the step (it already omits `accepted`). Outside the brief's paths.
- Hub `docs/RESEARCH-APPROACH.md:59` lists the folders holding projects directly, `docs/figures/gen_figures.py:537-543` and `docs/figures/hub-map.svg`: the scan-folder table omits `projects/umbrella`. Not false, incomplete.
- Hub `.agents/skills/project-cleanup/SKILL.md:53` resolves a project under `projects/{active,manuscripts,ideas}/` or archive and coauthor; a project in `projects/umbrella` is not resolved. Made false for the two moved projects.
- Hub `.oculus/config.yml:36` `required_sections` folders omit `projects/umbrella`: brief's decision 3, stated. Effect read: ecg-af-fair names `datasets: [ml4af]` and has `## Data` at its README:46, so nothing is lost today.
- Hub `.gitignore`: no pattern changes a moved file's state (`git check-ignore --no-index --stdin` over all 47 tracked files at their new paths prints nothing).
- No other hub in `~/workspace/*/.oculus/config.yml` overrides the five keys (grep prints nothing), so no hub gets the "lane names a cluster no row has" finding.

## The step line

No part lacks a requirement:

| Part of the line | Item |
|---|---|
| row of `stages` carrying only `on_map` | 1 |
| row of `categories` | 2 |
| place in `deck_order` before `idea` | 3 |
| section of `focus_clusters` between Incubation and Idea | 4 |
| its one lane in `focus_lanes` | 5 |
| "with their words and pages" | 6 (labels in 1, 2, 5; item 7 keeps the tests true) |
| `{ dir: projects/umbrella }` under `scan:` | 8 |
| hub README layout lines | 9 |
| both projects moved at that stage | 10, 11 |
| `parked` chip gone | 11 |
| decks updated | 12 |
| `related` on sandpile-operator | 13 |
| built by a builder agent | "Where you work" |

The Rulings line "O177 umbrella" quotes Axel on the stage, pill, section and both moves; `related` is on the step line and not in the quoted words. plan.md has no `## Goal` section (`grep -n -i '^## goal\|^goal:'` prints nothing); the goal used below is the one in my task. The step line carries no check of its own.

## Premises

Rechecked by the commands named; holds unless said.

- vocab.yml: `sed -n 63,77p | wc -l` 15 (key plus 14 words); `grep -n -E '^(stages|focus_clusters|focus_lanes|categories|deck_order):'` 63, 175, 183, 270, 280; four, ten and seven rows read. Holds.
- `isDormant` at lines.ts:176-184, inside the cited 173-185. Holds.
- layout.yml `boards:` at 216, `projects` has `stages: { not_flags: [terminal] }`. Holds for the Projects board; `supervision` and `coauthor` name no stage filter, so "the project boards take a project whose stage carries no `terminal`" is true of the Projects board only.
- Lanes.svelte: the `full_width` branch runs 294-314 and the line that heads it with the lane's own label is 304, outside the cited 275-300. Substance holds, range does not.
- derive.ts:84-98 comment. Holds. templates.md:464, 564, 924-926, data-map.md:377, HELP.md:102 read. Holds.
- Tests at vocab.test.ts:47-53, 136-152, 274-284 and board-rules.test.ts:591-610. Hold, but the list is incomplete: boards.test.ts (see Names).
- Hub config `grep -n -E '^(stages|...):' .oculus/config.yml` exit 1; `scan:` key at line 7, comment at 6, last row 21. Holds.
- Both manifests `stage: exploring`, first with `chips: [parked]`; `grep -i -E 'parked|exploring'` on the two READMEs exit 1. Holds.
- `git grep -n -E "active/novel-math|ideas/ecg-af-fair"` outside the folders prints nothing; ids at radar.yml, data.yml:1219, loewner/project.yml:11. Holds. Inside the two folders `git grep -n -E "projects/(active|ideas)|\bideas/|\bactive/"` also prints nothing.
- sandpile-operator has no `related` key (grep prints nothing). Holds.
- `ls docs/adr`: no such directory. Holds.
- **False**: item 9's line numbers. `grep -n` in the hub README: the tree runs 29-43, its `projects/ideas` and `projects/archive` lines are 41-42 (lines 30-32 are only the `active` line and two file rows). The table runs 45-50 (46 is its rule line; 51 blank; 52 is the bullet "Every scan folder"). Line 55 holds.
- Tracked vs on disk: `find` gives 8 and 40 files, `git ls-files` 8 and 39; the one extra is the ignored `projects/ideas/ecg-af-fair/notes/.DS_Store`. A worktree does not hold it, so C6's "before" count there is 47. After landing, the live hub keeps `projects/ideas/ecg-af-fair/notes/.DS_Store` at the old path unless someone moves it.
- **Item 5's colour requirement is not satisfiable as the path list stands.** Read-only program in the scratchpad (`parseBlocks`, `resolveTheme`, `deriveTokens`, culori `differenceCiede2000`, over tokens.css, themes.css, vscode.css, rice/*.css, the 49 themes of appearance.yml). Validation: it reproduces the comment's counts exactly (gold/honey 32, gold/amber 41, grey-d/slate 47, grey-d/grey 45). Result: of the palette's 29 hue tokens with a `-lane` surface, none is 10 or more against all of Scope, De-risk, Build, Idea and the panel in all 49 themes. Best: `blue`, 3 misses: synthwave/build 9.44, everforest/build 8.55, kanagawalotus/idea 9.75. `green`: 4 misses, lowest rosepinedawn/build 6.93. `grey`, `grey-d`, `slate`: 4 misses, lowest kanagawalotus/derisk 4.48. `amber-s` and `red-s` clear the headers but sit 1.66 from the panel. A hex the palette does not map gets the unknown tone (`tones.ts:197-203`), so it is no way out either. O141's open item 672 (plan.md:3605) is the same situation, and it was settled by adding hues in the theme sheets. The brief's write list holds no theme sheet. This is a premise found wrong, and brief line 70 would stop the builder at its first run.

## Cases and checks

Against spec.md:
- C7 breaks spec.md:33 and :107: a builder's git commands are `git status`, `git diff` and `git show` only. It also cannot hit on the moved files: a move with `mv` leaves them untracked, and `git grep` reads tracked files only (shown in a scratch repo: after `mv a/t.yml b/t.yml`, `git grep -n -E "exploring|parked" -- b` prints nothing, exit 1). On the hub today the tracked hits are `present/main.md` and `project.yml` of both folders.
- Item 6 plus the write list break spec.md:72 for `docs/HELP.md` and `docs/data-map.md`: no step writes them except a line Axel ruled into the brief, and the O177 ruling names no line of them. Both sentences (data-map:377, HELP:102) stay true with the new row, so the conditional gives no edit and nothing needs them on the list.
- spec.md:3 says a brief overrides nothing in the rules file, so the two above stand against the brief.
- The brief names no base copy, which spec.md:33, :35 and :62 rely on for the file table and the test-edit table. O175's brief names one (`.agents/worktrees/O175-base`). `ls .agents/worktrees` holds no O177 base yet.
- "Conventions: No hard wrapping" against spec.md:45: the comment edited in `src/lib/themes/derive.ts` is rewrapped at 100 columns. `docs/templates.md:924-926` is a column-aligned wrapped comment inside a yaml fence.
- Report parts: spec.md:61's before-and-after section for the views is not named among the brief's report parts; the spec binds anyway.

Places the step does not change: C4 checks the chip-before-stage rule of the lane order, which the step leaves as it is. C2 reads hub data and changes nothing in the test.

Commands as written:
- C1 works: run on the unchanged tree, `Test Files 2 passed, Tests 125 passed`, exit 0. "Reading the shipped file gives no finding" is `vocab.test.ts:65`.
- C2 works: with `OCULUS_TEST_HUB=/Users/axelfaes/workspace/research-hub`, `14 passed`, 121 projects, exit 0; unset, 7 passed and 7 skipped. It also passes on a git worktree of the hub (`.agents/worktrees/linfoot-figlabels`, c6a9e7e74, 14 passed), so the hub worktree form works. Neither command carries `TMPDIR` and `GIT_CEILING_DIRECTORIES`; brief line 13 requires them.
- C5: the repository holds the theme derivation (`src/lib/themes/parse.ts` `parseBlocks`, `resolveTheme`; `derive.ts` `deriveTokens`, which makes `--c-<hue>-lane`; `config/defaults/appearance.yml` the 49 classes). It holds no CIEDE2000 code: `grep -i ciede` over `src`, `tests`, `utils`, `bin` finds comments and one string only. The dependency culori 4 exports `differenceCiede2000` (`node_modules/culori/src/index.js`), and the repo imports only `wcagContrast` and `wcagLuminance` from it. C5 works if the program imports it from culori. The brief does not say the measure is on the `-lane` surface, as O141 did, and does not list the folded-layout pairs: with Incubation folded, Review, Blocked, Backburner over Umbrella; with Parked too, Run, Push, Revise; with all folded, the three band columns.

## The question

Could it pass without the goal (own stage, pill, Focus section between Incubation and Idea, folder)?

- C1: yes for the pill, placement and deck. It is shape and findings; item 7 edits only pin the cluster and lane key lists.
- C2: yes. It passes on the unchanged hub (shown above) and on a hub with the folders moved but no `scan:` row only if the count agrees; it says nothing about the pill or section.
- C3: yes. A case-run program applies the comment's rule by hand, so it does not exercise `categoryOf` (exported, `categories.ts:134`) or `laneItems` (exported, `focus.ts`; `laneOf` is private), and the stage row can be right while the board is not. It says nothing of cluster order.
- C4: yes. It is about the rule for a chip, on a synthetic project.
- C5: yes. It measures colour only, and the expected result is unreachable (Premises).
- C6: yes. It lists changed paths; it would pass with item 8's file changed in any way, and it does not show that `projects/umbrella` is in `scan:`.
- C7: yes, always, as written (untracked files).
- C8: yes. It proves the word is on the pages, nothing else.
- Check on the step line: none exists.
- Item 1: yes, alone it gives a stage with no pill. Item 2: yes, the pill needs item 1's word. Item 3: yes, deck order only. Item 4: yes, a section with no lane draws nothing (`Lanes.svelte:295`). Item 5: yes, a lane with no cluster row is not drawn. Item 6: yes. Item 7: yes. Item 8: yes, the folder would hold nothing without item 10. Item 9: yes, words only. Item 10: yes, without item 8 the projects leave the scan. Item 11: yes, without the moved folders. Item 12: yes, the deck only. Item 13: yes, unrelated to the goal.
- Together, the visible parts of the goal (pill, section position, deck order) are proved only by the orchestrator's look. A scratch server started from the step's checkout reads the live hub unless pointed at the hub worktree, which still says `exploring` until landing; the brief does not say which hub the look uses.

## Implied inputs

Each with its expected result, read from the code. Those that would cost something if wrong are marked.

- Project boards: pill `umbrella`, count 2 on Projects; the rail count excludes it (no `rail`), so the Projects rail count drops by 2. Costs if unstated: the look is not told the number that should change.
- Project form: Stage select offers `umbrella` after `scoping` (`foreign_key: vocab.stages`), with help text that omits it (`manifest-schema.yml:51`, see Names).
- Quick add: offers such a project, since it leaves out only `terminal` stages (`vocab.yml:55`).
- Focus move onto Umbrella: writes `stage: umbrella` and takes off `blocked` and `parked` (`focus.ts:500-510`). Off Umbrella: writes the target lane's word. Costs: the folder never moves, and the hub README line 55 says a move is a folder move plus the stage. `stage_folders` has no umbrella row, so a project moved on Focus keeps its old folder with no finding, and one moved off keeps `projects/umbrella` with none. Unstated.
- Audit: the `live` rules (results, datasets, ELI5) stop applying to both projects; `required_files` still apply and both hold `README.md` and `present/present.yml`; `required_sections` and `stage_folders` do not reach them. Item 8 says the first; nothing says the second. On a board, so no `msg_no_board`.
- Pillars and other `live` counts: both leave the in-flight count and tier strip of pillar `tensor`, the unfunded card, venue concentration, and manifests-behind (`lines.ts:93`, `cross-links.ts:364`, `venues.ts:70`, `focus-lanes.ts:115`). Costs: a visible number change on Pillars that no case or look names. Neither manifest has `deadline:`, so the deadline radar is not affected.
- Portfolio deck: hub `deck/present.yml` finds `projects/**/present`, so both decks stay, placed by `deck_order` before `idea`.
- Focus when no project is at the stage: a `full_width` lane is drawn with nothing in it (`Lanes.svelte:295`, no count filter), so the section is always shown.
- ecg-af-fair `present/main.md:23`, `headline: 'Idea: choose a direction...'`, and novel-math `status.line` "Exploration/scan": item 11 and 12 turn on "states the old stage" and C7 does not reach them; the brief does not say which way they go.
- Item 9's "what such a project holds" and the new table row's "Required" column are not given. By the audit: `project.yml`, `README.md`, `present/present.yml`.

## ADRs

`ls docs/adr` prints "ls: docs/adr: No such file or directory". There is no ADR folder.

## Dictated text

Nothing is on the tree yet, so each grep prints nothing today; each is the command that will find it. Character set and spec.md:21,44: holds for each.

- Item 1 label "umbrella (parent of other projects)": `grep -n 'umbrella (parent of other projects)' config/catalogs/vocab.yml`. Holds.
- Item 2 `label: { one: umbrella, other: umbrellas }`: `grep -n 'other: umbrellas' config/catalogs/vocab.yml`. Holds.
- Item 5 lane `label: Umbrella`: `grep -n 'label: Umbrella' config/catalogs/vocab.yml`. Holds.
- Item 8 `{ dir: projects/umbrella }`: `grep -n 'projects/umbrella' .oculus/config.yml`. Holds.
- Item 11 `stage: umbrella`: `grep -n '^stage: umbrella' projects/umbrella/*/project.yml`. Holds.
- Item 12 Stage value `umbrella` and kept `concept note made`: `grep -n "label: 'Stage'" projects/umbrella/*/present/main.md`. Holds.
- Item 13 `related: [novel-math-primitives]`: `grep -n '^related' projects/active/sandpile-operator/project.yml`. Holds; `related` is a `foreign_key: projects` field (`manifest-schema.yml:74`).

## Declined to judge

Whether the `headline` and `status.line` wordings above state the old stage; which colour should stand in for the unreachable requirement; whether the two hub docs outside the paths should change, since those are decisions on the text.

Usage: a602a835ac6d57075, claude-opus-5-5, 227351 tokens, 28 tool uses, 664 s

## Closed

- Names, `tests/data/sources/config/boards.test.ts`: added to item 7, the paths and the verify list.
- Names, `config/schemas/manifest-schema.yml:51`: added to item 6 and the paths.
- Names, `vocab.yml:214` and `:52`: item 1 and item 5 name them.
- Names, hub `docs/RESEARCH-APPROACH.md`, `docs/figures/gen_figures.py` and `docs/figures/hub-map.svg`: item 9 and the paths.
- Names, hub `.agents/skills/project-cleanup/SKILL.md:53`: skills are not edited; left as it stands and reported to the user.
- Premises, the colour: item 5 widened to the theme sheets under Rulings "Open item 672"; C5 names the `-lane` surface, culori and the folded pairs.
- Premises, line ranges of the README and `Lanes.svelte`, and the Projects board wording: corrected.
- Premises, tracked and on-disk counts: C6 counts tracked files, 47.
- Cases, C7: rewritten with `grep -rn` over the moved folders.
- Cases, spec.md:72: `docs/HELP.md` and `docs/data-map.md` removed from item 6 and the paths.
- Cases, no base copy: `.agents/worktrees/O177-base` named.
- Cases, hard wrapping: Conventions now follow each file's own form.
- Cases, report parts: before and after of the views added.
- The question, C3: uses the exported `categoryOf` and `laneItems`.
- The question, the look: names the hub worktree and the changed numbers.
- Implied inputs: ecg-af-fair's headline and novel-math's status line ruled in items 11 and 12; item 9 gives the new row's required files.
