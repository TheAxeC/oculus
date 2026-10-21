# Step O39 part D brief check (on main at 784756d5)

This report covers `agents/briefs/O39-partD.md`, read as it stands uncommitted on disk (`git status --short`: ` M .scratch/migration/orchestrator-state.md`, ` M .scratch/migration/plan.md`, `?? .scratch/migration/agents/briefs/O39-partD.md`). The rules file is `.scratch/migration/agents/spec.md`. I changed nothing.

## 1. Names

- `HELP.md` and `DESIGN.md`, inside the repository: `git grep -l -I "HELP\.md\|DESIGN\.md" -- . ':!.scratch' | wc -l` printed `82`. The line count over those files printed `170`. All 82 files are in the write list's prose entry. That entry is the problem: `utils/outside-paths.mjs` reads a write list as backticked tokens, so it cannot read a prose entry. I printed what it reads with `node --input-type=module -e "... entriesOf(sectionOf(brief)) ... outside([...], e)"`:
  - Entries: `["README.md","HELP.md","DESIGN.md","docs/HELP.md","docs/DESIGN.md","docs/reference.md","docs/apps.md","CLAUDE.md","docs/diagrams/*",".scratch/migration/agents/reviews/O39-partD-report.md"]`.
  - Paths it reports as outside: `docs/diagrams/layers.svg src/hooks.server.ts tests/routes/docs/docs.test.ts`.
  - Only the eight named files are covered. The other 76 files the grep lists are not. The `*` in `docs/diagrams/*` is a literal character, so that entry covers no diagram file.
- Sentences outside the name grep that the change makes false. Each was found by `grep -n "README" DESIGN.md` or `git grep -n -I "three documents\|SHIPPED_SOURCES" -- . ':!.scratch'`, then read in context:
  - `DESIGN.md:655`: "The arguments and the environment the server is given are in `README.md`." Item 5 moves those paragraphs to `docs/reference.md`, so this becomes false. Item 1 allows no change to the moved text "except for links and paths", and the line is in backticks, not a link.
  - `DESIGN.md:741`: "the app is Electron (`src/desktop/`), started and packaged as `README.md` says". The `npm run app` and `app:package` paragraphs move to the reference page, so this becomes false. Item 1 has the same restriction.
  - `DESIGN.md:705` and `src/desktop/release.ts:5`: "`config/`, `docs/`, `assets/` and the three documents". After the move two of the three documents ship inside `docs/`, so the sentence counts them twice. `release.ts` names neither file, so the write list does not hold it. C5 still asks for its comment to "say so".
  - `src/lib/data/places/shipped.ts:2`: "the three documents". It is in the paths, and item 3 covers it.
  - `HELP.md:3`: "`README.md` says how to run and check it". This stays true: the new README keeps install from source and the checks.
  - `DESIGN.md:198` and `DESIGN.md:581`: the diagrams command and the verification commands that `README.md` lists. These stay true, since the checks stay in the README.
- Code that reads the documents by path (the `HELP.md` hits from `git grep -n -I "HELP\.md" -- . ':!.scratch' ':!DESIGN.md'`):
  - `src/lib/server/content/docs.ts:812` (`MANUAL`).
  - `src/lib/data/places/shipped.ts:13-14` (`SHIPPED_SOURCES`).
  - `tests/checks/source/history.test.ts:22` (`DOCS`).
  - All three are in the paths and the brief names all three.
- `MANUAL`: `git grep -n "MANUAL\b" -- src tests utils` hits `docs.ts:471,473,525,812,822,825`, all in the paths. `src/lib/state/system/docs.svelte.ts:147` `const MANUAL = 'manual';` is a different constant, so the change does not touch it.
- `SHIPPED_SOURCES`: its readers are `src/desktop/release.ts:29,52` and `src/lib/server/machine/lines.ts:30,269`, both outside the paths. The code stays correct because `docs` is already an entry. The visible effect is that the Status view's line counts move the Markdown lines of `HELP.md` and `DESIGN.md` from the top-level row to the `docs` row. `lines.ts:71-77` `folderOf` gives "the first segment of any other path", and the same holds for the README paragraphs that move to `docs/reference.md`. The brief does not name this change.
- `docs/reference.md`: `git grep -n -I "reference\.md"` prints nothing, and `ls docs/reference.md` prints "No such file or directory". There is no collision.
- `README.md` sections (Quickstart, Running it, Checking it, Two Claude accounts): `git grep -n -I "README\.md#\|Running it\|Checking it\|Quickstart\|Two Claude accounts" -- . ':!.scratch'` hits only `README.md` itself. Nothing links a section anchor.
- Outside the repository:
  - The hub: `grep -n "HELP\.md\|DESIGN\.md" ~/workspace/research-hub/CLAUDE.md` gives `33:` only, and item 7 covers it. `grep -rn --exclude=local.yml ... ~/workspace/research-hub/.oculus` prints nothing.
  - The user-level rules and skills: `grep -ln ... ~/.claude/CLAUDE.md ~/.claude/rules/*.md ~/workspace/ordo/skills/*/SKILL.md` prints nothing.
  - `~/.oculus`: `grep -rl --exclude=local.yml ... ~/.oculus` lists only `views.json`, and `grep -o 'engine:[A-Za-z/._-]*' ~/.oculus/layouts.json` lists only the four `docs/` guides. No saved tab names either document.
- Ledger and memory text that is not in item 7's "Doc text" list but makes a standing statement about where `DESIGN.md` is:
  - `.scratch/migration/orchestrator-state.md:3`, `:117` ("Design: `DESIGN.md` is the artefact every package is measured against") and `:312` ("Design: `DESIGN.md`. Its "Decisions taken" ...").
  - `.scratch/ROADMAP.md:3` ("Design: `oculus/DESIGN.md` once written"). This is the roadmap that `.agents/plan.yaml` names, not the plan's log.
  - `.scratch/migration/plan.md:3` ("Execution ledger for `tools/oculus/DESIGN.md`").
  - `~/.claude/projects/-Users-axelfaes-workspace-oculus/memory/project-oculus.md:45` ("The design is `tools/oculus/DESIGN.md` and is the artefact every step is measured against"). This is already stale.
  - The brief calls the rest of `.scratch/` "the plan's log". The state file's standing lines and the roadmap are standing pages.

Findings:
- The write list's prose entry covers none of the 76 files the grep lists beyond the eight named ones, and `docs/diagrams/*` covers no file, by `utils/outside-paths.mjs`'s own reading (output above).
- `DESIGN.md:655` and `DESIGN.md:741` become false. Item 1 ("text unchanged except for links and paths") forbids the builder to fix them.
- `src/desktop/release.ts:5` and `DESIGN.md:705` ("and the three documents") become inexact. `release.ts` is outside the paths although C5 relies on its comment.
- The Status view's line-count rows change (`lines.ts` `folderOf`), and no before-and-after names it.
- `orchestrator-state.md:3,117,312`, `ROADMAP.md:3`, `plan.md:3` and memory `project-oculus.md:45` name `DESIGN.md` at a place that will not exist, and item 7 does not list them.

## 2. The step line

The step line `plan.md:655` gives part D's authority as (ruling 193) and (ruling 194), which are `plan.md:2362-2363`.

- 193, "README.md is rewritten by a builder in a part of O39 (part D), reviewed and landed": the brief itself and item 4. Review and landing are process.
- 193, "what oculus is": item 4.
- 193, "install from the Release or from source": item 4.
- 193, "the first hub": item 4.
- 193, "where the documents are": item 4.
- 193, "the checks": item 4.
- 193, "the reference paragraphs (the server's arguments, the workspace and `local.yml` keys, the dependency and licence list) move to a page under `docs/`": item 5.
- 193, "a lighter edit of the present text was the lazy option": item 4 ("rewritten").
- 194 (a), "`HELP.md` and `DESIGN.md` move into `docs/`": item 1.
- 194 (a), "every reference updated": items 2, 3, 6 and 7.
- 194 (a), "in the same part D as open item 193": the brief.
- Parts of "What to build" with no requirement in either ruling:
  - Item 5 also moves the install-and-start-checks paragraph (README:18), `npm run dev` (20), the native app with `app:package` (22) and `app:release` (24). Ruling 193 names only the three kinds of reference paragraph, and the brief records no decision for these four.
  - "Two Claude accounts" also moves, but decision 2 covers it.

Findings: the four paragraphs README:18, 20, 22 and 24 move with no ruling and no decision of the brief. That the reference page holds them is a design choice, and it should be a numbered decision like decision 2. Everything else maps.

## 3. Premises

- README is 64 lines with the four sections: `grep -n "^#" README.md` printed `1:# oculus 5:## Quickstart 16:## Running it 32:## Checking it 45:## Two Claude accounts`, and `wc -l` printed `64 README.md`. Matches. Lines 14, 18, 20, 22, 24, 26, 28 and 30 hold what the brief says (`cat -n README.md`), and line 22 holds "[manual](HELP.md#the-window)". Matches.
- The release: `gh release view v0.1.0 --json tagName,isDraft,url,assets` printed `v0.1.0`, `false`, `https://github.com/TheAxeC/oculus/releases/tag/v0.1.0` and the three named archives. `gh repo view ... visibility` printed `PRIVATE`. Matches.
- Sizes and the docs folder: `wc -l` printed `544 HELP.md`, `768 DESIGN.md`, and `ls docs` printed `apps.md data-map.md diagrams palette.md templates.md`. Matches.
- Name counts:
  - 82 files and 170 lines: printed `82` and `170`. Matches.
  - `HELP.md` in 16 files: `git grep -c -I "HELP\.md"` printed 16 rows. Matches.
  - `DESIGN.md` in 73 files, 57 of them under `src/lib`: printed `73` and `57`. Matches.
  - The quoted lines (`docs.ts:812`, `shipped.ts:13-14`, `history.test.ts:22`, `docs.test.ts:28,29,74,157`, `doc-link.test.ts:17,30,60,74,80,122`) match.
- "`DESIGN.md` links `docs/diagrams/<name>.svg` nine times and `docs/apps.md`, `docs/data-map.md`, `docs/palette.md` and `docs/templates.md`": `grep -o "\]([^)]*)" DESIGN.md | wc -l` printed `9`, and all nine are diagrams. DESIGN.md has no `](` link to any guide. It names `docs/apps.md` 3 times, `docs/data-map.md` 3, `docs/palette.md` 2 and `docs/templates.md` 2, only inside code spans and the layout block (`grep -o "docs/[a-z-]*\.md" DESIGN.md | sort | uniq -c`). The guide links are `HELP.md`'s: `](docs/apps.md)` 4, `](docs/data-map.md)` 2, `](docs/palette.md)` 1, `](docs/templates.md)` 11 and `](#the-keys)` 2, 20 in all. Half matches.
- `docs/apps.md:3` links `[HELP.md](../HELP.md)`: matches. `DESIGN.md:36` "Repository layout" lists the root files at `DESIGN.md:40`: matches.
- `docs.ts:333-350` (the diagram rule), `:672-690` (engine documents) and `doc-link.ts:76-101` (Help view for the manual): read with `sed -n`. Matches.
- `CLAUDE.md:5` and `CLAUDE.md:36`: `grep -n` matches.
- The ledger lines `spec.md:7,22,55,70,103` and `guarded.md:341,343`: `grep -n` matches. Hub `CLAUDE.md:33`: matches. The oculus memory folder has two memories naming the documents (`project-oculus.md`, `feedback-deletion-leaves-no-stale-reference.md`): matches.
- `~/.oculus/views.json` holds the names only in saved document text: `grep -o ".\{60\}\(HELP\|DESIGN\)\.md.\{30\}"` prints only README-like text, two hits each. Matches.
- `ls docs/adr` printed "No such file or directory". Matches.

Findings: the premise that `DESIGN.md` links the four guides is wrong. `DESIGN.md` has only the nine diagram links. The guide links are `HELP.md`'s 18 `](docs/...)` links, and `DESIGN.md` names the guides in code spans and in the layout code block. Item 2's example ("`docs/apps.md` becomes `apps.md`") was written on this premise. Read as written, it would rewrite repository paths in `DESIGN.md`'s layout block (`DESIGN.md:83-84`) and code spans, while `DESIGN.md` names hundreds of other repository-root paths (`src/...`) that stay root-relative. The brief does not say that code-span paths stay repository paths and only `](...)` links become relative.

## 4. Cases and checks

- C1 (a test), consistent in part:
  - The `docs.test.ts` rows are G2's test (`guarded.md:12`), so they fit the test rule.
  - The `doc-link.test.ts` rows are G74's test (`guarded.md:222-224`, "one row per opening"). The new row "`../README.md` from `docs/HELP.md` resolves to the root README in the engine's space" gives the opening `{ kind: 'engine' }`. The row 'an engine link to an engine document opens it with the engine outside the hub' (`doc-link.test.ts:77-83`) already gives that opening. A second row with the same outcome breaks spec.md "What every package obeys" ("one row per input that gives a different outcome").
  - "On the unchanged tree the rows with the new path fail" is false for `doc-link.test.ts`. `docLinkOf` and `openingOf` take `manual` and `from` as data, and the step does not change `doc-link.ts`, so rows with `manual: 'docs/HELP.md'` pass on the unchanged tree. Verify item 5's "preserves" branch applies, and C1's sentence contradicts it.
- C2 (a test), inconsistent:
  - No test covers the diagram rule. `git grep -ln "diagramOf\|DocPart\|\.parts\b\|ownScope\|renderEngineDoc" -- tests` printed nothing. `docs.ts:335-336`, which the brief cites as the existing test, is a doc comment.
  - No entry of `agents/guarded.md` covers the diagram parts (`grep -n "diagram" guarded.md` hits only G25, the committed-diagram check). Under spec.md "What every package obeys" ("A test exists only as the test of one entry of `agents/guarded.md` ... A step that needs a new entry stops and asks Axel"), the row C2 asks for needs a new entry, which means a stop, and the brief does not say so.
- C3 (a run), consistent with the rules. Its acceptance wording does not cover two kinds of hit the brief itself creates outside `docs/`:
  - The test data of C1 (`href: 'HELP.md'`, `from: 'docs/apps.md'` in `tests/`).
  - The example address in the comment `src/lib/views/shared/prose/doc-link.ts:3` (`../HELP.md#the-keys`, which must become `HELP.md#the-keys` to stay a true example).
  - Both name a bare `HELP.md` from a file that is not under `docs/`. The clause "or the `MANUAL` constant's value" is moot, since that value becomes `docs/HELP.md`.
- C4 (a run): consistent.
- C5 (a run): it asks the builder to check `src/desktop/release.ts:5`'s comment, which is outside the step's paths (section 1). "The `history.test.ts` run passes and reads `docs/HELP.md`, `docs/DESIGN.md`, `README.md` and `docs/reference.md`" cannot be shown by a pass. `documentHits` skips a missing file (`history.test.ts:142` `if (!existsSync(join(base, doc))) continue;`), and `documentsOf` already walks every `docs/*.md` through `GUIDES`. The reading is the proof, and the brief should say so.
- C6 (a reading): consistent.
- C7 (a reading): consistent with the rules. It conflicts with item 4 (see section 5).
- C8 (implied input): the "existing missing-file row of `docs.test.ts`" is the `engine=docs%2Fnone.md` row (`docs.test.ts:118-121`). It covers a link that resolves into the engine folder (an engine read). A hub `docs:` entry or link to an engine folder that lies outside that hub goes through `renderHubDoc` and answers another 404 message, and no row covers it. The case also asks about hub files that the step does not change (the grep finds no such link today).
- Conventions and decision 4 say "a comment line pushed past 100 columns is rewrapped". spec.md "What every package obeys" says "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short". The brief's version is narrower than the rule it is under.

Findings:
- C1's claim that the new-path rows fail on the unchanged tree is false for `doc-link.test.ts`.
- C1's README row repeats an opening G74 already has.
- C2 needs a test with no `guarded.md` entry, and its premise of an existing test is false.
- C3's acceptance rule fails correct work in `tests/` and in `doc-link.ts:3`.
- C5 asks about `release.ts:5`, outside the paths, and asks a pass to prove what a file read proves.
- C8 cites a row of another read.
- The rewrap rule is narrower than spec.md's.

## 5. The question

The goal is rulings 193 and 194 carried out: a README rewritten for a first reader, with the reference paragraphs on a `docs/` page, and both documents in `docs/` with every reference updated and the app still drawing them.

- C1, `docs.test.ts` part: no. The rows plant `docs/HELP.md` and assert `manual: 'docs/HELP.md'`, which only the `MANUAL` change satisfies.
- C1, `doc-link.test.ts` part: yes. Those rows pass on the unchanged code, since only their data changes.
- C2: yes. A planted document proves the unchanged diagram rule, not that the real `docs/DESIGN.md`'s links were rewritten to `diagrams/x.svg`. C4 is what catches the real links.
- C3: yes, in part. The grep sees only the two names. `DESIGN.md:655`/`:741` ("in `README.md`") and "the three documents" stay false with C3 green.
- C4: no for files. It checks targets exist but not fragments: `HELP.md#the-window` and DESIGN.md's 49 `HELP.md#...` code spans. They hold today, since `grep -n "^#\+ The window\|^#\+ The keys\|^#\+ The rail" HELP.md` prints `11:`, `49:` and `124:`.
- C5: yes for the history part (a pass shows nothing about what was read). No for the `SHIPPED_SOURCES` reading.
- C6: no. It is a sentence-by-sentence mapping.
- C7: no for order and archive names. On "states only facts of the tree", item 4 asks for two facts the tree does not hold:
  - "macOS asks once before opening it": the only source is the release body. `gh release view v0.1.0 --json body` says "macOS asks for confirmation the first time it opens (right-click the app, then Open)". `git grep -n -i "gatekeeper\|quarantine\|asks once\|Open Anyway"` finds no such sentence on the tree.
  - "where each unpacks or installs": the tree gives an install place only for the `app:package` stub (`~/Applications`, `~/.local/share/oculus`, README:22), not for a Release archive.
  - So item 4 and C7 cannot both hold as written.
- C8: no. It is a robustness check, not the goal.
- The step line's check (`npm run test:landing` at landing): yes. It passes with the README unrewritten and with any document text, so the README part rests on C6 and C7 alone.
- Item 1: no (verify 4's `ls`).
- Item 2: yes, in part, for the reason given under C3.
- Item 3: yes. "The Help view draws the manual ... and the doc view draws `DESIGN.md` with its diagrams, as before the move" has no check against the real engine folder. `git grep -ln "renderManual\|manual=1" -- tests` and the `engineDir()` users show no test reads the real manual. The builder runs no page (spec.md). The brief does not name the look on landing (the Help view, a manual link to the Apps guide, the doc view of `docs/DESIGN.md` with its diagrams) as this item's proof.
- Item 4: yes, until C6 and C7 are read. Their limits are given above.
- Item 5: no (C6 maps every sentence).
- Item 6: yes, in part. C3 checks the names but not that `CLAUDE.md:5` names the reference page.
- Item 7: no. The section is read at landing.

Findings:
- The C1 doc-link rows and C2 pass without the change.
- C3 and item 2 pass with `DESIGN.md:655`/`:741` and "the three documents" false.
- C7 and item 4 contradict each other on the macOS first-open sentence and on install places.
- Item 3's "the app still draws them" has no proof named: no test reads the real engine, and no look on landing is named for it.
- C5's history part passes whatever `DOCS` holds.

## 6. Implied inputs

- An `oculus.app` stub, or a built `node src/server.ts`, whose `build-app/` or `build/` was built before the move. README:22 says the stub "runs no build and reads `build-app/`", and `ls -la` shows `build-app` dated Oct 21 13:53. Such a build serves `MANUAL = 'HELP.md'` over a checkout that no longer has it. Expected: the Help view shows the manual's 404 sentence (`answer`, `docs.ts:515-517`) until one `npm run app` or `npm run build`. Missing from Cases. This includes Axel's own running app at the look on landing.
- The published v0.1.0 archives. They hold their own root `HELP.md` and a build with `MANUAL = 'HELP.md'`, so they are unaffected. Expected: unchanged. Missing; low cost.
- An engine folder given by `--engine` that holds `config/` only, or a copy made before the move (README:28 recommends a copy). Expected: `manual=1` answers 404 with `{ error, file }`, no crash. No row asks `manual=1` of an engine without the file, and C8 cites an `engine=` row. Missing.
- The link `HELP.md#the-window` (README:22, moving to `docs/reference.md`) and DESIGN.md's 49 `HELP.md#...` references. Expected: each fragment is a heading id of `docs/HELP.md`, which holds today (`HELP.md:11`, `:49`, `:124`). C4 checks files, not fragments. Missing.
- A document cached under an entity tag. `fileTag` is the process, size and modification time (`docs.ts:31-35`), and the manual's key on the page is `ownKey('manual','manual')` (`docs.svelte.ts:276`), independent of the path. Expected: the moved file has a new modification time and size, so the next ask answers 200 with the new text. Low cost; missing.
- A saved document tab naming `engine:DESIGN.md` or a hub path `tools/oculus/HELP.md`. Expected: the 404 sentence, with no migration code (spec.md). `~/.oculus/layouts.json` holds none (`grep -o 'engine:[A-Za-z/._-]*'`). Missing; low cost.
- The Status view's line counts (section 1). Expected: the Markdown lines of the two documents and of the moved README paragraphs count under the `docs` row instead of the top level. Missing from Cases and from the report's before-and-after.
- Whether `docs/reference.md` gets a pinned tab on the Help page, as the four guides have (`config/defaults/layout.yml:159-162`). This is a visible shape the brief does not decide. Not a case, but a decision the brief should state either way.

Findings: the stale `build-app/`/`build/`, the `--engine` folder without `docs/HELP.md`, the anchors, the Status view rows and the Help page's pinned tab for the reference page are all missing from "Cases", with the expected results above.

## 7. ADRs

- `ls docs/adr` printed "ls: docs/adr: No such file or directory". There is no record.

Findings: none.

## 8. Dictated text

- "docs/DESIGN.md's one "Auth" rule" (`src/hooks.server.ts:79`): `grep -n 'docs/DESIGN.md.s one "Auth" rule' briefs/O39-partD.md` gives `76:`. Holds.
- "the layers of docs/DESIGN.md, section "Boundaries"" (`tests/checks/tree/boundaries.test.ts:1`): `grep -n 'the layers of docs/DESIGN.md, section "Boundaries"'` gives `76:`. Holds. The line becomes 101 columns (it is 96 now), so it needs the rewrap the brief names.
- "in the order docs/DESIGN.md names them" (`utils/diagrams/diagrams.mjs:61`): `grep -n 'in the order docs/DESIGN.md names them'` gives `76:`. Holds.
- "the docs/HELP.md of its folder" (`src/lib/views/system/help/Help.svelte:18`): `grep -n 'the docs/HELP.md of its folder'` gives `76:`. Holds.
- "(docs/DESIGN.md, "Apps added while oculus runs")" (`config/defaults/behavior.yml:267`): `grep -n '(docs/DESIGN.md, "Apps added while oculus runs")'` gives `76:`. Holds.
- The title "Reference": `grep -n 'titled "Reference"'` gives `73:`. Holds.
- Item 4's required sentence content, "the macOS bundle is signed ad hoc so macOS asks once before opening it": `grep -n "asks once before opening it"` gives `28:`. It holds against the prose rules (plain, ASCII). It breaks the brief's own item 4 and C7 rule, "Every fact the README states is kept from the present text or checked on the tree", because the tree holds no such fact (section 5).

Findings: the macOS first-open sentence states a fact the tree does not hold. Its source, the release body, is not on the tree, and the brief does not name it as a source.

## Declined to judge

- Whether the release body's "right-click the app, then Open" is still how current macOS treats an ad hoc signed, unnotarized download. That is behaviour of macOS that a read of the tree cannot settle. It matters if the brief makes the release body the source of the README sentence.
- Whether a README written "for a reader who meets oculus first on its GitHub page" suits a repository that `gh repo view` reports as `PRIVATE`. That is the user's call on audience, not something a read settles.
- Whether the install-from-Release part should name the programs a Release app needs (git, tmux, perl, the Claude CLI; README:18 says the app checks them over its own engine). Item 4 does not ask for it. Whether a first reader needs it is a judgment on content for the session.

Agent usage: abc0742eebc9814e2, claude-opus-5-5, 205,748 tokens, 73 tool uses, 9.5 min.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- 1, the write list's prose entry and `docs/diagrams/*`: "Paths this step writes" now lists every file by its path, the 82 files of the grep, `src/desktop/release.ts` and the 18 files of `docs/diagrams/` one per line, with the sentence that limits each to its naming lines.
- 1, `DESIGN.md:655` and `:741` made false, and "the three documents" at `DESIGN.md:705`, `release.ts:5` and `shipped.ts:2`: "What is on the tree" names them, and item 1 now allows and requires their correction; `release.ts` is in the paths.
- 1, the Status view's line-count rows: named in "What is on the tree" and in item 3, with the before and after required in the report.
- 1, the standing lines `orchestrator-state.md:3,117,312`, `plan.md:3`, `ROADMAP.md:3`: added to the orchestrator's list in "What is on the tree" and to item 7's "Doc text"; the memory `project-oculus.md:45` is the orchestrator's at landing.
- 2, the four README paragraphs with no ruling: decision 6, with item 5 pointing to it.
- 3, the premise on `DESIGN.md`'s guide links: corrected in "What is on the tree" (the nine diagram links; `HELP.md`'s 18 guide links and two anchors); item 2 now says Markdown links become relative from `docs/` and code-span and layout-block paths stay repository paths.
- 4 and 5, C1: split into C1 (the `docs.test.ts` rows, G2, failing on the unchanged tree) and C2 (the `doc-link.test.ts` rows, G74, a preserving test, both runs quoted, no row repeating an opening).
- 4 and 5, C2 (no existing test, no guarded entry): the diagram test is dropped; the drawing of `docs/DESIGN.md`'s diagrams rests on C4's reading of every link and the look at landing, named in item 3.
- 4, C3's acceptance: widened to relative links and examples whose file or `from` is under `docs/`.
- 4 and 5, C5: now a reading, `release.ts` in the paths, the reading of `history.test.ts` named as the proof since a pass proves nothing about what was read.
- 4, C8 citing another read's row: C8 rewritten as a reading of `renderManual` and `answer` for an engine folder or a build without `docs/HELP.md`.
- 4, the rewrap rule: decision 4 and "Conventions" now give `spec.md`'s rule, a comment the step edits rewrapped as a whole paragraph at 100 columns.
- 5, C7 against item 4 (the macOS sentence and install places): item 4 and C7 now take the release notes as a source, quoted in the report, and allow no install place the notes do not give; "What is on the tree" quotes the notes.
- 5, item 3 without a proof: item 3 names C4 and the look at landing.
- 5, item 6 not checked: C3 and C4 cover the names; `CLAUDE.md:5` naming the reference page is read by the reviewer.
- 6, implied inputs: the stale build and the `--engine` folder without the file (C8), the fragments (C4), a saved tab or old link (C9), a cached document (C10), the Status view rows (item 3); the Help page tab for the reference page is decision 7.
- 8, the macOS first-open sentence: no longer dictated; item 4 takes its content from the release notes.
- Declined points: the release notes are the source for the macOS sentence (decision of item 4); the README is written for a reader of the repository page whether it is private or public; the programs the app names at its first window are part of item 4's install-from-Release part.
- Dictated lines added after the check: none; the case texts and decisions state requirements and dictate no words for a file.
