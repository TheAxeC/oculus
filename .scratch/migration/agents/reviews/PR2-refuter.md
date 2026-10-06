# Step PR2 refuter report (on .agents/worktrees/PR2, base 7e1d73675)

Not done, read this first: verify item 4 does not hold. The step's own added lines in `.agents/skills/project-new/SKILL.md` and `.agents/skills/research-cockpit/SKILL.md` carry non-ASCII characters. Verify item 7 was not rerun as a live server (see "Declined to judge"); I reproduced its three answers by calling the route's handler in-process over the source tree. Verify item 6's first run, on the unchanged tree, was not rerun. Nine findings follow. Two of them break an explicit sentence of the brief: Standards 1, the non-ASCII and hard wrapping in the skill files, and Spec 2, the transition slide's hint drawn as the lede when the brief asks for the foot. Behaviour 1 is the most consequential: the "never a null or negative result" slide rule was dropped from the deck files and from the project template.

## Verification (rerun by the reviewer)

```
1. npm run test:quick -- --base 7e1d73675   (from tools/oculus in the worktree)
   every line ok; ASCII gate ok; svelte-check 0 errors in 392 files;
   "test:quick: 21.3 s (limit 45.0 s); every command passed"
   (npm run diagrams not run: it writes files. Read-only stand-in:
    npx vitest run tests/checks/diagrams/diagrams.test.ts passed, inside the 12-file run below)
   npx vitest run over config-folder, config, integrity, keys, boundaries, size, duplication,
   history, comment-width, diagrams, contrast, deposit:
   "Test Files 12 passed (12), Tests 181 passed"; integrity read the worktree hub, projects 94
2. node tools/oculus/utils/migrations/convert-decks.mjs --check   (worktree root)
   -> "nothing left to convert"
   find projects tools/oculus/demo -name PRESENT.md   -> (nothing)
   utils/convert-decks.py does not exist (the brief's name; see Spec 1)
3. grep -rn PRESENT src tests   -> src/lib/server/git/git-index.ts:336 and :357 (ALREADY_PRESENT) only
   grep -rn -E "slide_order|OPEN_TIERS|DeckTheme" src tests config --exclude=local.yml   -> (nothing)
4. spec.md's perl ASCII gate over src tests config   -> (nothing)
   the same gate over the 140 changed files outside projects/ and deck/: hits in the four
   .agents/skills/*/SKILL.md and tools/cockpit/templates/project.active.yml. Of those, the
   step's ADDED lines carry non-ASCII in project-new/SKILL.md:44,46 ("->" arrow glyph, em dash) and
   research-cockpit/SKILL.md:62-66,247 (em dash, middle dot). project.active.yml:40-42 are untouched.
5. sh utils/unused-exports.sh   -> exit 0, 250 exports against the base copy's 256; every added line
   (ROW_DECK, writeDeckSlides/deckSlidesWrite, the audit/scan.ts names) is explained by the step
6. npx vitest run --reporter verbose tests/data/sources/present.test.ts tests/routes/docs/deck.test.ts
   tests/routes/edit/deck-slides.test.ts tests/server/edit/deck-edit.test.ts plus the undo/changes deck
   tests -> 55 tests in 9 files passed (deck route 6, deck-slides 10, deck-edit 7, present 5, undo 3 ...)
   first run on the unchanged tree: not rerun (the report quotes "Test Files 4 failed (4), Tests 17 failed (17)")
7. in-process, scratchpad/pr2probe/route.mts: handleDeck(request with x-oculus-token, 'tok', source)
   over the worktree hub, config from portfolioConfigFrom(loadConfig(engine).config):
   snapshot findings 0; projects with deck 25
   deck                                 200 ok 21 "Structured models, everywhere they hide" findings []
     groups: pillars count 7 cand 16; more count 7 (ecg-readable-substrate found) cand 7; ideas count 9
   projects/manuscripts/btfno/present   200 ok 1 "A PDE-solving neural operator built from specialist low-rank blocks" findings []
   tools/oculus/demo/deck               200 ok 26 "The demo hub, at a glance" findings []
   ../                                  403 {"error":"outside"}
   projects/nothere                     200 missing 0 slides, one finding naming the folder
Other evidence:
   demo.mts over tools/oculus/demo (read only): ok, slides title.md#0 graph-bandits/main.md#0
     graph-bandits/main.md#1 summary:projects closing.md#0; one finding, the graphs domain
   probe.mts writeDeckSlides over a scratch hub: path "deck" refused "That path is not a present.yml";
     path "deck/present.yml" changed ["g"], other lines of the file kept; ~/.oculus/changes.jsonl
     mtime unchanged (09:13), 0 lines naming the probe
   python over the 32 idea manifests: main exploring 32 parked 1; worktree nascent 25, scoping 5,
     de-risking 2, parked 1; non-grid ideas nascent = 23; diff +32 -32, the chips line only
   git diff 7e1d73675 --stat -- tools/present   -> (nothing)
   lsof -i :8792   -> (nothing)
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. The reader, split, groups, kinds and route are in `src/lib/data/sources/deck/` and `server/content/deck/`, and the route answers as quoted above. Spec 3 notes that the split does not reuse `splitFrontmatter`.
- 2: holds. `portfolio_deck` is read from `sources.yml`, and `Project.deck` is set for 25 projects (route.mts). The project decks, the portfolio deck and a custom folder all answer from one route.
- 3: holds. The chips are counted above. `manifest.ts:444` writes `chips: [nascent]` and the idea template writes `[nascent]`.
- 4: violated in one sub-point (Spec 2: the transition hint is the lede, not the foot). The script substitution is Spec 1, judged acceptable on its premise. Everything else holds: the conversion check prints nothing left, no PRESENT.md remains, and the converted front matter matches in order, with mechanism and headline matching the summary rows (read across all 16 project decks).
- 5: holds. The deck menu, the key hint (`Slide.svelte:73`, `present.key_hint`), the empty state, the card control and `desc_present` are all in place. Spec 4: the deck's root and path are held in the tab's layout state, where the brief names the instance state.
- 6: holds. `row-menu.ts` sets `present` for a file named `present.yml` and for a folder whose listing holds one, places the item after Open LaTeX, and labels the tab with the folder name. Spec 5: the word reads "Open Presentation".
- 7: holds. The write refusals, the key-path owner, the flow-to-block rewrite, the readback, CLOSED_WRITES, bodies, app-gate, history words and deck-gone undo are all present, and the tests pass.
- 8: violated (Standards 1 and Standards 2: non-ASCII and hard wrapping in the added skill lines, and a self-contradicting sentence in research-cockpit).
- 9: holds. `tools/present/` is untouched (the diff --stat is empty). `research-cockpit/SKILL.md` and `docs/DATA-MAP.md:138` are rewritten.

Cases:

- 1: met. The route answer gives the order title, engine, 7 pillars, summary, transition, 7 more, summary, grid, closing. The title lede reads "7 pillar projects and 7 more." and the legend is [liver, method, heart, brain]. The key hint is drawn by `Slide.svelte:73` (read, not looked at).
- 2: met. pillars counts 7; ideas counts 9 although `ideas` is never placed by `{ slides: }` (route answer). The unknown-group finding comes from the report's scratch run, which I did not rerun; its source in groups.ts was read.
- 3, 4, 5, 11: met by `tests/data/sources/present.test.ts` (the three splitSlides tests and "places a member deck whose order names two files...", all passed).
- 6, 7, 8, 10: met per the report's scratch runs (not rerun), consistent with my reading of `deck/groups.ts`. Case 8 also holds in the live hub: `more` holds none of the pillars.
- 9: met. In the route answer `ideas` has 9 members and `fedbtd` is in no group. The tenth-idea run is the report's, not rerun.
- 12: partial. A panel figure that is missing is drawn as the gap with a finding (report run). A missing Markdown image keeps its href and draws as a broken image (Behaviour 3).
- 13: met per the report's run and my reading of the tag-tone merge in read.ts.
- 14: not verifiable. The reader half is the report's scratch run. Opening from the Files view and the deck appearing in the menu need a look in the running app, which was not done.
- 15: met by reading `row-menu.ts` (the `present:` fact at rowFacts and the `latex` array in rowMenu). No look.
- 16: met. My run refused `../` with 403 outside; the route and write tests cover a root nothing serves, a climb and a link; the report's runs cover the symlink, `..`, and the order and glob cases.
- 17: met. "writes a list of the group member and its candidate, keeping every other line" passed. My probe kept every other line of the file. The undo and change-record tests passed.
- 18: met by the deck-slides tests (repeated, unknown, unknown group, not present.yml, stale base) and deck-edit's "returns null ... for a file that does not parse".
- 19: not verifiable without a running page. My reading supports it: `relevant()` now accepts `.md`, `namedByConfig` adds the `present/` slide files and the portfolio deck folder, `roleDirectories` watches the portfolio deck folder, and `present.svelte.ts` marks held decks stale on the files, portfolio and config versions.
- 20: met (the find, the grep, and `config/present.yml` holding only `defaults:`).
- 21: met. The nine grid ideas split 5 scoping, 2 de-risking and 2 nascent; 23 non-grid ideas are nascent; fedbtd is parked; no idea remains `exploring`. The design's "21" is stale and the brief's 23 is right.
- 22: met. demo.mts gives graph-bandits's two slides and the `graphs` domain finding, with no other finding.
- 23: met for the reader: the route answers `missing` with a finding naming the folder for a folder that does not exist, and `tests/routes/docs/deck.test.ts` covers a folder with no deck. The empty-state sentence in the view was read, not looked at.
- 24: met by reading `state/life/present.ts` (`deckRefOf` with no root gives the portfolio deck at slide 0).
- 25: met. The undo test "answers an undo of a record of the retired deck write with deck-gone and writes nothing" passed.
- 26: met (`manifest.ts:444`, and the writes test assertion passed in test:quick).

## 1. Spec

- `tools/oculus/utils/migrations/convert-decks.mjs:1-22`: "Convert a hub's PRESENT.md files, the idea grid and config/present.yml into decks." What is wrong: the brief names `tools/oculus/utils/convert-decks.py` (Python, stdlib plus yaml), and spec.md says hub data is written "through the script the brief names and by nothing else". The builder's premise is that the tree checks read ts/svelte/mjs/js/sh and not .py, and it holds. A further reason it does not state also holds: base `utils/` holds 10 items, so a new file there fails the folder limit. The `.mjs` is in `utils/migrations/` (3 items) beside `migrate-joint-work.mjs`. Failure scenario: none in behaviour, since `--check` prints nothing left and the conversion output reads correctly. The orchestrator must fix verify item 2 and the brief's paths to name the `.mjs`. Verdict: no item made violated; I accept the substitution.
- `deck/transition.md:5-7`: "# {{more.count}} more, same backbone" then a blank line and "Same four-layer format: equation | specs | method | measured results." What is wrong: the brief says "no lede, the hint as the foot". The route answer for transition.md#0 gives `lede: "Same four-layer format: ..."` and `foot: ""`, so the hint is drawn in the lede position. `deck/engine.md` puts its hint in the foot correctly. Failure scenario: the transition slide shows the hint as a lede under the heading and leaves the foot empty, so it differs from the old deck and from engine.md. The report calls this a judgment call the brief left open, but the brief states it. Verdict: item 4 violated in this sub-point.
- `src/lib/data/sources/deck/split.ts` (`splitSlides`): it parses a slide's front matter with its own `yaml.parse` rule, and `docs.ts` makes `splitFrontmatter` non-exported. What is wrong: brief decision 2 says the split is written "over the existing splitFrontmatter". There are now two front-matter rules: docs.ts accepts a `...` closer and split.ts does not. Failure scenario: a slide file whose first front matter closes with `...` reads as front matter in the docs route and as body in the deck reader. Verdict: no item violated (case 3 to 5 pass); a divergence from the decision.
- `src/lib/state/life/present.ts` (`deckRefOf`, `withDeck`): the deck's root and path are held in the tab's layout state; slide, overview and recent are held in the instance state. What is wrong: brief item 5 says "A Present pane's instance state holds the deck's `root` and `path` beside `slide` and `overview`". The report names this as a judgment call. Failure scenario: none observed; a saved pane with no root still opens the portfolio deck (case 24). The difference matters only if the instance state is persisted and restored separately from the layout. Verdict: item 5 holds; a recorded deviation.
- `tools/oculus/config/text/views/sources/files.yml:102`: "menu_present: Open Presentation". What is wrong: the brief dictates "Open presentation" (items 5 and 6), and the project card word in `project.yml:77` is "Open presentation". Failure scenario: the reader sees the same action with two cases. The Files menu's own items are Title Case ("Open LaTeX", "Open Preview"), so the Files form matches its menu. The brief's word was not used and the report does not say so. Verdict: item 6 holds.

## 2. Proof

- PR2-report.md "Size and folder rules forced": "the old `content/deck.ts` split into `content/deck/{read,endpoint}.ts`". What is wrong: there is no `src/lib/server/content/deck.ts` at the base. `ls .agents/worktrees/PR2-base/tools/oculus/src/lib/server/content/` lists audit, audit.ts, diagrams.ts, docs.ts, images.ts, latex, latex.ts, literature, memories.ts, wallpaper.ts. No decision rests on the sentence. Failure scenario: a reader looks for a removed file that never existed. Verdict: none.
- PR2-report.md "Verify" 4: "Files written outside it that still hold non-ASCII were not touched on those lines: ... the `.agents/skills/*/SKILL.md` headings carried non-ASCII before this step." What is wrong: the step rewrote `project-new/SKILL.md:44,46` and `research-cockpit/SKILL.md:62-66,247`, and the rewritten lines carry the em dash, the arrow glyph and the middle dot (rerun 4 above). Failure scenario: the orchestrator accepts verify 4 as clean when it is not. Verdict: item 8 violated (with Standards 1).

## 3. Standards

- `.agents/skills/project-new/SKILL.md:44,46` and `.agents/skills/research-cockpit/SKILL.md:62-66,247`, for example "4. **`<project>/present/main.md`** front matter (`kind: project`) [em dash] the project's public slide, drawn by". What is wrong: the hub CLAUDE.md "Writing docs" section and the rules file ban em dashes, arrows and the middle-dot separator, and require one line per paragraph or bullet. These added lines carry the glyphs, and the new text is hard-wrapped (research-cockpit:62-66 and 92-94, project-cleanup:36-37). Verify item 4 asks for no hit in every file the step writes outside `projects/` and `deck/`. Failure scenario: the remove-unicode pass and the ASCII gate flag the step's own text. Verdict: item 8 violated.
- `.agents/skills/research-cockpit/SKILL.md:92-94`: "If a project's **`present/`** deck changed, no build is needed: ... `tools/present/` is the old showcase and is no longer rebuilt. Report the build line(s) and which files you changed." What is wrong: the sentence says there is no build and then asks for the build lines. Failure scenario: an agent following the skill looks for a build to run or report. Verdict: item 8 violated (with the above).
- `tests/routes/docs/deck.test.ts:54-109`, `tests/routes/edit/deck-slides.test.ts:64-155`, `tests/server/edit/deck-edit.test.ts:42-94`: 6, 10 and 7 separate `it` blocks. What is wrong: spec.md "Tests" says an entry keeps "one test per unit it covers ... written as a table where a unit has several outcomes", and "A builder writes no other test". The brief says the malformed cases are "a run or a look the report quotes, since no guarded entry covers a malformed deck". `deck.test.ts:65` "answers a folder that holds no deck, and one that is not there..." is exactly such a case (case 23), and the no-store, empty-path and token tests are further units outside the brief's test plan. Failure scenario: the orchestrator rewrites the guarded entries' references from a list longer than the entries guarantee, and the suite carries tests no entry owns. Verdict: no item or case made unmet; a finding to fold into tables or delete at landing.
- PR2-report.md "Verify" 1: "`npm run test:slow`: ... the one failure is `tests/server/desktop/start.test.ts` ..." and its rerun alone. What is wrong: spec.md "Tests" says "a step never runs `npm run test:slow`", and the state file's standing demand forbids a builder or reviewer rerunning a case that starts the app. start.test.ts starts Electron. The step also ran `npm test` and the whole checks folder, where spec.md says to run only the covering files and then the verify list once. Failure scenario: the desktop app was started from a worktree twice. The one-red result also names a test PR2's diff does not touch (no change to src/desktop, src/server.ts, hooks.server.ts or the files the test imports), so it is not the step's and was not rerun by me. Verdict: none on the items; a conduct finding.
- PR2-report.md "Git": "Four read-only invocations were made by mistake while working (... `git` with no subcommand ... and `git status` piped to `head -0`)". What is wrong: spec.md says "a builder runs no git command at all". The `.git/worktrees/PR2/logs/HEAD` file holds only the orchestrator's creation (14:48) and reset (14:49), and the PR2 ref is the orchestrator's filter-branch rewrite at 16:13. No builder write to git is visible. Which directory the commands ran in, and any effect on the main checkout, cannot be checked from here. Verdict: none; a conduct finding.

## 4. Behaviour

- `tools/oculus/config/present.yml` (whole) and `tools/cockpit/templates/docs/present/main.md` (whole). What is wrong: the base file's head comment "Rules for what goes on a slide (a public artifact): public-safe only, every number real and matching the manuscript, never a null or negative result, no hedging", and the old template's "PUBLIC-SAFE ONLY: no dead-ends, no null/negative results, no unpublished-and-unclaimable numbers", are carried nowhere in the deck files, `deck/present.yml` or the new template. `grep -rn -i "negative result|public-safe|no nulls"` over deck/, DESIGN.md, HELP.md, the cockpit templates and config finds only `project.active.yml:38` and the audit's website check. `research-cockpit/SKILL.md:62-63` keeps "ONLY public-safe fields ... no nulls". The report does not mention the loss. Failure scenario: someone writing a new deck from the template, or editing `deck/`, meets no rule against putting a null result on a public slide, which an absolute rule of the user's forbids. Verdict: no case made unmet; to be restored (a comment in the template's main.md and in deck/present.yml) or raised.
- `src/lib/server/edit/writes/config/list-edit.ts` (the key-line comment handling). What is wrong: a comment on the key's own line is now kept when the list is rewritten; the base comment said it "goes with the line". `setItems` also serves audit-mute, rail and roots, so their rewrite behaviour changes too. `entryText` now quotes YAML-typed words for every caller. The report's behaviour section does not state either change for the other callers. Failure scenario: a rail or roots write on a file with `rail: # note` now keeps the note where it used to drop it. This is benign, but it is unannounced and no test of those callers names it. Verdict: none.
- Markdown images in a slide body (`deck/kinds.ts`, the image rewrite). What is wrong: a missing panel figure is drawn as the gap with a finding, but a missing Markdown image `![a](gone.png)` keeps its original href and is drawn as a broken image. The report states only that HTML `<img>` is not rewritten. Failure scenario: a typo in a slide's Markdown image shows the browser's broken-image box. Verdict: case 12 partial.
- `config/text/views/boards/project.yml:77`: "present: Open presentation" (was "Slide"). Summary rows and grid cards now take their names from the project's `short:` and the vocab labels. These changes are visible to the user and follow from the brief (decision 6, part 4). The report's behaviour list carries the card change. `desc_present` says "the hues of the status chips on a project slide", but `tag_tones` colours a slide's `tag.class`, which HELP.md:298 names correctly ("the hue each tag class of a project slide wears"). Failure scenario: a reader of the Workbench takes it for the manifest status chips. Verdict: none.

## Points the orchestrator listed

- The .py-to-.mjs substitution: acceptable. The premise holds and the folder limit is a further reason (Spec 1). The brief's verify 2 and paths must be corrected.
- The nascent count, 23 against 21: the brief's 23 is right. There are 23 non-grid `exploring` ideas at the base, all `nascent` in the worktree; the design's 21 is stale.
- The deck going from 23 slides to 21, with hccnet-fl, asthma-geo-tensor and fedbtd leaving it: each is asked for. hccnet-fl leaves by the brief's part 4 and decision 14 (Z651); asthma-geo-tensor was the empty template, removed by part 4; fedbtd is parked and excluded by case 9's `status:` find (Z652); the pillars come from Z640. Also, fedbtd's old card said de-risking while its manifest chip is parked, so the parked chip governs.
- The deletion of the PRESENT.md prose: required by the brief. Three samples were read against the base: btfno's prose is carried in its slide; meseret's "Joint work with Meseret Assefa Kerga (lead)" and "concordance 0.87 to 0.64 ... restored to 0.78" appear differently or not at all on the slide; dongho's "ARI 0.71 vs HuBERT-ECG 0.19" against the table's 0.20 is a real disagreement in the source prose. The report's list of 16 was not checked in full (Declined to judge).
- The files outside the write list: each is a consequence of the step:
  - the `portfolioConfigFrom(merged)` signature lost `engine`, which changes project-files.ts, pty/start/chat.ts, context.ts and seeds/task-start.ts and the tests;
  - `content/audit.ts` moved to `content/audit/scan.ts` because base `content/` holds 10 items;
  - `server.yml` gained the deck-slides refusal words;
  - finding-text.ts, changes.ts and undo-said.ts only had comments or words changed;
  - the test fixtures changed with them, and `tests/server/git/refs/repo.ts` replaced its own `put` with the new shared `plantFile`, which the duplication check required.
  None of them is unexplained.
- The start.test.ts failure: not caused by the diff (it touches none of the test's imports or the desktop host). Running it at all was against spec.md (Standards 4). Not rerun by me.
- The builder's git invocations: four read-only commands, against spec.md. No write is visible in the worktree's git log (Standards 5).
- The three hazards:
  - the front-matter ambiguity is the ruled rule (Z649) and outside the fix;
  - there is no push for a custom deck in an unwatched root, which the brief's channel design does not cover; the deck is refetched on the next files, portfolio or config version;
  - HTML `<img>` is not rewritten, and the brief asks only for Markdown images.
  All three are fairly stated. The missing-Markdown-image drawing (Behaviour 3) is a fourth, unstated.

## Declined to judge

- Verify 7 as a live server on 8792. The worktree's `build/handler.js` is dated 15:34, older than the deck sources (16:11), so a server would run a stale build. Rebuilding writes into the worktree, which I may not change. The equivalent in-process run over the current source is quoted above. No server was started; `lsof -i :8792` prints nothing.
- Verify 6's first run on the unchanged tree: it needs the test files copied into a base copy. The report quotes it.
- The views as drawn: cases 14, 15, 19 and 23's empty state, the deck menu, Slides drag and the full screen. These need the running page and a look, and the brief bars a browser here.
- The completeness of the report's "Prose the slides do not carry" across all 16 projects: three were sampled.
- Whether the builder's git commands touched the main checkout's index or config: it is not visible from the worktree's metadata.

Reviewer usage: agent-ac8902c2a666de395, claude-opus-5-5, about 500k tokens in the part after the context was compacted (the earlier part was not counted), 34 tool uses since then (the earlier count is not available), minutes not measured.
