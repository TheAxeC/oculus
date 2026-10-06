Not done: nothing in parts 1 to 9 of the brief and nothing in the ten findings of the repair round. Not run, by the standing limits of this round: `npm run test:slow`, any `tests/server/desktop/*` case and `tests/tiers/landing.mjs`. Not looked at: the missing-image gap in a browser, including whether the page's HTML sanitiser keeps `<img src="#gap">` for `markup.ts` to find (no browser was opened; the reader's output and the markup function were read). Not verified: prose tells in the 16 project slides beyond the spaced hyphens counted below.

# PR2 report: Present decks from any folder, one format for every deck

## Open items of the state file

The "Open items" section of `tools/oculus/.scratch/migration/orchestrator-state.md` (read in the main checkout, lines 173 to 175) holds its heading and this one paragraph and no entry: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## The first run of the 26 cases, on the unchanged tree

The unchanged tree is `.agents/worktrees/PR2-base` (config, src, tests, utils) with `tools/oculus/demo` and the hub data of the main checkout. I ran it in a scratch copy with the worktree's node_modules (`scratchpad/pr2first`), reading the main checkout's hub read only. No case showed a rule of the brief to be wrong, so the build went ahead.

| Case | First run on the unchanged tree |
|---|---|
| 1 | `deckSlides(deckFrom(config), projects)` over the real hub: 23 slides, keys `title framing:engine hccnet-revision hccnet-fl covert-applied covert-theory bttn-incident-af raw-pls btfno bt-operator-theory summary:summary1 framing:transition bttd-source-eeg dries-bttr-ecg dongho-ecg-clustering fed-multicellular-immune meseret-cirrhosis ward-bttr-crosssubject summary:summary2 ideas ecg-readable-substrate asthma-geo-tensor closing`; the lede is the typed text "A dozen active projects spanning brain, heart, liver and immunity." (`config/present.yml:16`); no deck folder exists |
| 2 | `grep -n "{{" config/present.yml` finds nothing: no count token exists, the counts are typed text |
| 3, 4, 5, 11 | `ls src/lib/data/sources/deck` answers "No such file or directory": no slide splitter and no `order:` of slide files exist |
| 6, 7, 8, 10 | `grep -c -E "groups\|discover\|find" config/present.yml` prints 0: no group, no `find:`, no `discover:`, so none of these cases can be set up |
| 9 | idea manifests by chip: `{"exploring":32,"parked":1}`; fedbtd carries `parked` |
| 12 | `present.ts:108-115` reads a panel's `figure` as text and has no deck folder to resolve it against; not run |
| 13 | `config/present.yml:7` holds one `tag_tones` under `deck:` for the single deck; no per-deck tones |
| 14, 15 | `grep -n "present" src/lib/views/shared/explorer/tree/menu/row-menu.ts` finds nothing: the Files menu has no Open Presentation |
| 16, 17, 18 | `src/routes/api/(docs)` holds `diagrams docs literature memories wallpaper`, no deck route; the write is `DeckWrite = { kind: 'deck'; selection: string[]; order: string[] }` (`bodies.ts:100`), with no root, path, group or base |
| 19 | `watch/portfolio.ts:13,45,144` push on `PRESENT.md` only |
| 20 | `find projects tools/oculus/demo -name PRESENT.md` from the hub: 18 files; `grep -rn PRESENT src tests`: 58 lines in 18 files |
| 21 | chips of the 33 idea manifests: `exploring` 32, `parked` 1; active and coauthor: `exploring` 4, `numbers-pending` 1 |
| 22 | scratch portfolio build over `tools/oculus/demo`: findings 0, 11 projects, `graph-bandits` with 2 slides |
| 23 | `data/index.ts:39` names `present.yml` as an engine config file; no `portfolio_deck` key in `config/sources.yml` (`grep -n portfolio_deck config/sources.yml` prints nothing); not run further |
| 24 | `parsePresentState({ slide: 'hccnet-fl' })` returns `{"slide":"hccnet-fl","overview":false}`, and `hccnet-fl` is slide 4 of the 23 |
| 25 | `undo.ts:135` and `:311` undo a `deck` record by writing `config/present.yml` |
| 26 | `manifest.ts:444` writes `'  chips: [exploring]'` for a new idea |

## The ten findings of the repair round, as they stand

1. The transition slide has no lede and its hint is the foot. `sectionParts` in `src/lib/data/sources/deck/kinds.ts` gives a section slide whose text holds no ordered list an empty lede and the whole text as the foot; with a list, the text before it is the lede and the text after it is the foot. The reader's answer for `deck/transition.md` (`scratchpad/r2-transition.txt`): `{"key": "transition.md#0", "kind": "section", "heading": "7 more, same backbone", "lede": "", "foot": "Same four-layer format: equation | specs | method | measured results.", "legend": ["brain", "heart", "method", "liver"], "cards": []}`.
2. The slide split reads front matter with `splitFrontmatter` and `parseFrontmatter` of `src/lib/data/sources/docs.ts` (the functions the documents of a project use). `grep -n "from 'yaml'\|parse(" src/lib/data/sources/deck/*.ts` lists `read.ts:18` and `read.ts:154` only: the parse of `present.yml` itself. `split.ts` imports `{ parseFrontmatter, splitFrontmatter } from '../docs.ts'` and has no YAML parser of its own.
3. The deck a pane shows lives in the pane's instance state beside `slide`, `overview` and `recent`: `PresentState` in `src/lib/state/life/present.ts` has `root` and `path`, `shownRef(state)` reads them and `openedDeck(value, next)` writes them. The layout state `Instance.state` holds only `label`. `showDeck(ref, label, beside)` in `src/lib/state/workbench/layout/open/show.ts` opens a Present tab and then writes `openedDeck(...)` into the tab's instance state (`ui.setInstanceState`); the Files row menu (`row-menu.ts:550`) and the project card (`ProjectCard.svelte:192`) call it, and `Present.svelte` reads and writes the same state. The run is case 24 below.
4. The slide rule "Rules for what goes on a slide (a public artifact): public-safe only, every number real and matching the manuscript, never a null or negative result, no hedging (the slide's `tag` chip carries the status)." is the first line of `deck/present.yml` and of `tools/oculus/demo/deck/present.yml`, the YAML comment right after the opening `---` of `tools/cockpit/templates/docs/present/main.md` (the file `project-new` copies for a new project's deck), and the constant `SLIDE_RULE` of `utils/migrations/convert-decks.mjs`, which writes it as the head of the two decks it creates. `grep -c "Rules for what goes on a slide"` prints 1 for each of those three files.
5. A Markdown image in a slide body whose file is missing or outside the deck's folder is rewritten by the reader to `![<its path>](#gap)` and still raises the finding `figure <path> is not in <deck>/`; `markup.ts` turns `<img src="#gap">` into `<span class="gap">`, and an image slide draws `<p class="gap">` (`parts/Plain.svelte`, `parts/Words.svelte`). The run is case 12 below.
6. The lines of `project-new`, `research-cockpit` and `project-cleanup` that this step added or rewrote are ASCII and one line per paragraph, bullet or item (`diff` against the main checkout lists them, `LC_ALL=C perl` over each prints none of them). The `research-cockpit` sentence now reads "If a project's `present/` deck changed, no build is needed for it: ... `tools/present/` is the old showcase and is no longer rebuilt. Report which files you changed." The gate over every file the step writes outside `projects/` and `deck/` is quoted in item 4 of the verify list.
7. `desc_present` (`config/text/views/system/workbench.yml:22`) reads "What every deck the Present view draws starts from: the hue each tag class of a project slide wears." and the `defaults.tag_tones` option description (`config/catalogs/options.yml`) reads "The hue each tag class of a project slide wears."; `tag_tones` colours the tag chips of a project slide.
8. Each of the four test files holds one `it` per unit with a table of rows for the several outcomes; the tables are listed under "The guarded tests", with each table's first run on the unchanged tree and its pass. Case 23 and the case 12 gap are runs, quoted in "The cases after the build", and no test exists for either.
9. `setItems` keeps a comment on the key's own line and `entryText` quotes a word YAML reads as another type, for every caller. The four callers and the two behaviours, each run through the unchanged tree's `list-edit.ts` (before) and the worktree's (after), are in "Host- and user-visible changes".
10. Verify item 4 is reported from its rerun after the last edit (item 4 of the verify list below). The server side of the deck is `src/lib/server/content/deck/read.ts` and `endpoint.ts`, both new in the table of files. The conversion script is `utils/migrations/convert-decks.mjs` and not `utils/convert-decks.py`; the reasons are in "Anything in the brief that was wrong or impossible". The Files menu word stays `Open Presentation` (Title Case like the other words of that menu).

## DONE and NOT DONE, with the check that proves each

NOT DONE: nothing in parts 1 to 9 of the brief. The brief's script `utils/convert-decks.py` is `utils/migrations/convert-decks.mjs` (see "Anything in the brief that was wrong or impossible").

| Part | State | Check and its output |
|---|---|---|
| 1 deck format (reader, kinds, groups, counts, findings) | DONE | `src/lib/data/sources/deck/{split,files,spec,project,kinds,groups,read}.ts`; case runs below |
| 2 where decks live, route, store | DONE | `GET /api/deck` answers, item 7 below; `portfolio_deck: deck` in `config/sources.yml`; `config/present.yml` keys: `['defaults']` |
| 3 maturity chips | DONE | idea chips: `{('nascent',): 25, ('scoping',): 5, ('de-risking',): 2, ('parked',): 1}` (the 23 ideas without a deck plus `ssm-longitudinal` and `quantum-tensor-fl`, which the grid called nascent), read from `projects/ideas/*/project.yml` in the worktree; `exploring` ideas: 0 |
| 4 conversion script | DONE | `node tools/oculus/utils/migrations/convert-decks.mjs --check` from the hub root prints `nothing left to convert` |
| 5 Present view | DONE | `npm run check`: `COMPLETED 3052 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; views in the file table |
| 6 Open Presentation | DONE | `row-menu.ts:235,278,544-550,571` (look, cases 14 and 15) |
| 7 Slides view and the `deck-slides` write | DONE | `tests/routes/edit/deck-slides.test.ts`, `tests/server/edit/deck-edit.test.ts`, `tests/routes/edit/undo/undo.test.ts`, `tests/server/core/changes.test.ts` (all in the `npm test` run of item 1) |
| 8 documents | DONE | file table; item 3 below |
| 9 cockpit deck (Z650) | DONE | `tools/present/` untouched: `diff -rq tools/present` against the main checkout lists only `.DS_Store`, `__pycache__` and `present.html`, files that exist in the main checkout only; `research-cockpit/SKILL.md` and `docs/DATA-MAP.md:138` updated |

Verify list, each run from `tools/oculus` in the worktree unless stated, after the last edit:

1. `npm run diagrams` (exit 0) then `npm run test:quick`: `ok      ASCII gate (1.2 s)`, `ok      prettier (2.0 s): All matched files use Prettier code style!`, `ok      svelte-kit sync (2.8 s)`, `ok      eslint (2.9 s)`, `ok      svelte-check (7.7 s): ... COMPLETED 392 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest (18.1 s)`, `test:quick: 19.5 s (limit 45.0 s); every command passed`. Also `npm run check` `COMPLETED 3052 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `npx eslint .` exit 0; `npx prettier --check .` "All matched files use Prettier code style!"; `npm test` "Test Files 106 passed | 17 skipped (123), Tests 634 passed | 71 skipped (705)", exit 0; `npx vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0` "Test Files 15 passed | 1 skipped (16), Tests 228 passed | 3 skipped (231)". Not covered by these results: `npm run test:slow`, the desktop cases and `tests/tiers/landing.mjs` (not run in this round), and any browser look.
2. `node tools/oculus/utils/migrations/convert-decks.mjs --check` (hub root of the worktree) prints `nothing left to convert`; `find projects tools/oculus/demo -name PRESENT.md | wc -l` prints 0.
3. `grep -rn "PRESENT" src tests` prints `src/lib/server/git/git-index.ts:336` and `:357` (`ALREADY_PRESENT`) only; `grep -rn -E "slide_order|OPEN_TIERS|DeckTheme" src tests config --exclude=local.yml | wc -l` prints 0. Files outside the brief's greps that still name `PRESENT.md` are `tools/present/*`, `tools/cockpit/{DESIGN.md,README.md,data/HELP.md,tests/test_presentation.py,src/cockpit/*}` (Z650, not updated), `tools/oculus/utils/migrations/convert-decks.mjs` (it removes `PRESENT.md`), `projects/manuscripts/raw-pls/RESULTS.md:64` and `projects/manuscripts/raw-pls/code/campaigns/brats_realdata/saliency_overlay_figure.py:8` (project content, not edited).
4. The gate of `spec.md`, `LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests config -type f ! -name local.yml)`, prints nothing; the same pattern without the `config/` allowance over `utils/migrations/convert-decks.mjs` prints nothing. Over the files the step writes outside `projects/`, `deck/` and `config src tests utils` (`LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if $_ =~ /[^\x20-\x7E\n]/; close ARGV if eof'` over `DESIGN.md HELP.md docs/apps.md demo/README.md README.md docs/DATA-MAP.md`, the four skill files, the two cockpit templates, `convert-decks.mjs`, `demo/deck`, the graph-bandits deck, `templates/docs/present` and `docs/diagrams`): 188 lines print, all in `research-cockpit/SKILL.md` (69), `remove-unicode/SKILL.md` (66), `project-cleanup/SKILL.md` (28), `project-new/SKILL.md` (22) and `tools/cockpit/templates/project.active.yml:40-42` (3), headings, arrows and dashes of the main checkout; the listing of those hits whose text is not a line of the same file in the main checkout (`grep -qxF`) prints nothing, so none of the 188 is a line this step wrote.
5. `sh utils/unused-exports.sh` exits 0 and prints `Unused exports (250)` and `Unused exported types (122)` against the base's 256 and 123. `diff` of the two files differs in these lines only, each explained by this step: removed with their modules `DECK_KINDS` (`data/helpers/deck.ts`), `DECK_FILE` (`data/index.ts`), `PRESENT_DIR` and `equationIsImage` (`data/sources/present.ts`), `SELECTION`, `ORDER` and `setDeckList` (`deck-edit.ts`), `deckLists` (`config/deck.ts`), `slideKey`, `plainTitle`, `slideSources`, `deckCatalogKeys` and the type `SlideSource` (`state/life/present.ts`), `saveMessage` (`state/life/slides.ts`); moved with `content/audit.ts` to `content/audit/scan.ts` `signatureOf, firstMarker, jaccard, normalTitle, titleWords` and the type `AuditRules`; renamed `writeDeck` and `deckWrite` to `writeDeckSlides` and `deckSlidesWrite` in `writes.ts`; added `ROW_DECK` to the `ROW_*` constants of `row-menu.ts` that the base already lists.
6. The four restructured test files, first on the unchanged tree and then in the worktree; the output is in "The guarded tests".
7. A server on 8792 with a scratch `HOME` and the engine copied without `local.yml` (`node src/server.ts --engine <scratch>/engine --default-port 8792`), asked with the page's token and the Origin and Sec-Fetch-Site headers the hook demands: root `hub`, path `deck` answers `200 ok 21` slides, title "Structured models, everywhere they hide", findings `[]`, groups `[('pillars', 7, 7, 16, [], []), ('more', 7, 7, 7, [], []), ('ideas', 9, 9, 0, [], [])]` (name, count, members, candidates, missing, conflicts); path `projects/manuscripts/btfno/present` answers `200 ok 1` slide "A PDE-solving neural operator built from specialist low-rank blocks", findings `[]`; path `tools/oculus/demo/deck` (a custom deck, in the real hub's root) answers `200 ok 26` slides, "The demo hub, at a glance", findings `[]`; path `../` answers `403 {"error":"outside"}`; path `projects/nothere` answers `200` state `missing`, one finding `deck folder projects/nothere is not in <hub>`. The answers were taken after the last change to server-side code; the edits after them are the client comment in `show.ts` and comment lines. The server is stopped (`lsof -nP -iTCP:8792 -sTCP:LISTEN` lists nothing).

## The cases after the build

Runs are `node scratchpad/cases.mts <engine>` (the reader over scratch hubs, output in `scratchpad/r2-cases.txt`) and the scratch scripts named; tests are named in "The guarded tests".

| Case | Result |
|---|---|
| 1 | route answer for `deck`: 21 slides (title, engine, 7 pillars, summary, transition, 7 more, summary, grid, closing); the title lede is `{{pillars.count}} pillar projects and {{more.count}} more.` (`deck/title.md`) and the transition heading `# {{more.count}} more, same backbone` (`deck/transition.md`), its lede empty and its hint the foot (finding 1) |
| 2 | `{{pillars.count}}` 7, `{{ideas.count}}` 9 with `ideas` never placed by `{ slides: }` (route answer: `ideas` count 9); run `case 2 unknown count`: `finding [order[0]] a count of group nogroup, which the deck does not define, stays as written` |
| 3, 4, 5, 11 | `tests/data/sources/present.test.ts`: the table of `splitSlides` rows (a front matter after a separator, one closed by a line of dots, a separator inside a fence or an HTML comment, lines after a separator that are not a front matter) and the reader test |
| 6 | `case 6 missing name`: group g members [a] missing [nope], `finding [groups.g] group g names nope, which matches no deck`; the Slides view draws it missing (`slides.ts` row kind `missing`) |
| 7 | `case 7 discover conflict`: state empty, g1 conflicts [a<-g2], g2 conflicts [a<-g1], `finding [groups.g1] deck a is found by the discovering groups g1, g2 and named by none; it is in neither`; the Slides view draws the conflict row (`slides.kind_conflict`) |
| 8 | `case 8 named elsewhere`: pillars [a], more [b] |
| 9 | route answer: `fedbtd` found nowhere. Scratch copy of the worktree hub (`scratchpad/case9`, never the real hub) with a tenth idea `scratch-tenth` (`chips: [nascent]`, a `present/` deck of `kind: idea`, named nowhere), run through `readDeck`: `group ideas count 10 members btd-autoencoder,...,quantum-tensor-fl,scratch-tenth candidates 0`, `scratch-tenth in ideas: true`, `scratch-tenth in more: false`, `fedbtd found anywhere: false`, `findings 0`. `more` holds 7 (the six named and `ecg-readable-substrate`, found by `tiers: [active, manuscripts]` and `discover: true`) |
| 10 | `case 10 self member`: group g members [] missing [a], `finding [groups.g] group g names a, which matches no deck`; `case 10 cycle a-b-a`: `finding [order] deck a holds itself through its groups; the repeat is not placed`; no hang |
| 12 | `case 12/16`: `finding [main.md#0] figure gone.png is not in d/`, and the image slide body `{"key":"main.md#1","kind":"image","title":"Img","heading":"Img","src":"#gap","alt":"../outside.png"}` with `finding [main.md#1] figure ../outside.png is not in d/`; `case 12 markdown image in a text slide`: findings `figure missing.png is not in d/` and `figure nope[1].png is not in d/`, body `"# T\n\n![missing.png](#gap) and ![ok](/api/file/hub/d/here.png) and ![nope\\[1\\].png](#gap)"` (the image that exists keeps its served path, the two that do not are the gap) |
| 13 | `case 13 tag tones`: `tagTones {"measured":"red"}` for a deck whose `defaults.tag_tones` sets it; the portfolio deck (scratch copy, `deck/present.yml` sets none) reads `tagTones {"measured":"green","design":"amber","proof":"purple","mixed":"cyan"}`, which is `config/present.yml`'s `defaults.tag_tones` |
| 14 | `scratchpad/case14`: a deck `ext/talk` in a second root `ext` outside the hub: `state ok slides main.md#0:image`, `image {"key":"main.md#0","kind":"image","title":"Pic","heading":"Pic","src":"/api/file/ext/talk/pic.png","alt":"x"}` (served from its own folder), `groups g members 0 candidates 0 findings 0`; the pane's deck menu lists it through `recent` (`openedDeck` and `deckChoices` in `present.ts`; look, no test) |
| 15 | look: `row-menu.ts:235` sets `present` true for a file named `present.yml` and for a folder whose listing holds a file of that name, and `:278` adds the item only then; no test |
| 16 | `case 16 symlink and .. out of root`: three findings `link/secret.md is outside d`, `../../c16-outside/secret.md is outside d`, `link/pic.png is outside d`, nothing read; `case 12/16` for the `find.folders` globs `../*/present` and `/etc/*` (`finding [find] ../*/present is outside <root>`, `finding [find] /etc/* is outside <root>`) and the `order:` entry `../outside.md`; the route and the write: the tables of `tests/routes/docs/deck.test.ts` (5 refused queries) and `tests/routes/edit/deck-slides.test.ts` (the path that leaves the served root and the root nothing serves) |
| 17 | `tests/routes/edit/deck-slides.test.ts` (the write of a group list keeping every other line); `tests/server/edit/deck-edit.test.ts`; undo: `tests/routes/edit/undo/undo.test.ts`, `tests/server/core/changes.test.ts` |
| 18 | `tests/routes/edit/deck-slides.test.ts` refusal rows: a repeated name, a name no deck of the group answers to, an unknown group, a file not named `present.yml`, a stale `base`, a path outside the root, a root nothing serves; `tests/server/edit/deck-edit.test.ts` refusal rows: a group the file does not hold, a file that does not parse, a group that is not a map |
| 19 | look: `present.svelte.ts` marks every held deck stale on a new version of `files`, `portfolio` or `config`; `watch/portfolio.ts:150-193` pushes a change of a slide file of a `present/` folder or of `portfolio_deck`; `Grid.svelte` reads the card's maturity and `domainTone` from the projects and `vocab.yml` |
| 20 | `find projects tools/oculus/demo -name PRESENT.md | wc -l` prints 0; `grep -rn PRESENT src tests` prints `ALREADY_PRESENT` at `git-index.ts:336,357`; `config/present.yml` keys `['defaults']` |
| 21 | chips by command in item 3 of the table above; the nine grid ideas keep the grid's values (btd-autoencoder scoping, florank-personalization scoping, clinical-ai-eval-artifacts scoping, ecg-af-fair de-risking, fl-privacy-auditing scoping, hccnet-fl-sweden de-risking, hccnet-pathology scoping, ssm-longitudinal nascent, quantum-tensor-fl nascent); `fedbtd` `parked`; ideas `exploring` 0 |
| 22 | scratch copy of `tools/oculus/demo`: `deck state ok slides 5 title.md#0:title graph-bandits/main.md#0:project graph-bandits/main.md#1:project summary:projects:summary closing.md#0:closing`, deck findings 1 `domain project graph-bandits names the domain graphs, which config/catalogs/vocab.yml does not list; its slides are drawn in the neutral tone`; `portfolio findings 1` is the same one (`projects/active/graph-bandits/project.yml`, key `domain`) |
| 23 | run, no test: `case 23 unparsable: state unreadable, slides` with `finding [] present.yml does not parse`; `case 23 missing folder: state missing, slides` with `finding [] deck folder nothere is not in <root>`; `case 23 empty file: state unreadable, slides` with `finding [] present.yml is not a map`; no crash |
| 24 | run (`parsePresentState` and `shownRef` of `present.ts`): `parsePresentState({ slide: 'hccnet-fl' })` returns `{"root":"","path":"","slide":"hccnet-fl","overview":false,"recent":[]}` and `shownRef` of it `{"root":"","path":""}` (the portfolio deck, where `hccnet-fl` is no slide, so the pane opens at the first slide); `openedDeck` of a pane on `hub/projects/manuscripts/btfno/present` at slide `s3` with the grid open, given `ext/talk`, returns `{"root":"ext","path":"talk","slide":"","overview":false,"recent":[{"root":"hub","path":"projects/manuscripts/btfno/present"}]}`; given the deck it already shows it returns the same value; a pane with no deck of its own, given `ext/talk`, returns `recent: []` |
| 25 | `tests/routes/edit/undo/undo.test.ts` (an old `deck` record answers 404 `deck-gone`, `config/present.yml` unchanged) |
| 26 | `tests/server/edit/writes.test.ts` (the new idea's `chips: [nascent]`) |

## The guarded tests

Each of the four deck test files holds one `it` per unit and a table of rows for the units with several outcomes (the shape of `tests/server/files/fs.test.ts`). Cases 23 and 12/gap are brief-run cases and have runs above, no test.

| Entry | Test written | The test it replaces |
|---|---|---|
| G2 (a path outside the roots is refused) | `tests/routes/docs/deck.test.ts`, one `it`, 5 rows (a root nothing serves, a climb into a folder beside the root, a climb to the root parent, a link inside the root that leaves it, an absolute path); `tests/routes/edit/deck-slides.test.ts`, the rows "a path that leaves the served root" and "a root nothing serves" | none for the route; the write's refusals replace `tests/server/edit/deck-edit.test.ts`'s old selection tests |
| G8 (a write changes only its file and key; a stale base is refused) | `tests/routes/edit/deck-slides.test.ts`, one `it`: the write of a group list, then 7 refusal rows; `tests/server/edit/deck-edit.test.ts`, one `it` of 5 rows (a block list with comments around it, a group that holds no list, a list written as a flow, names YAML would read as another value, a list equal to the one held) and one of 3 refusal rows | the `setDeckList` and `deck` write tests of the same two files |
| G9 (logged, undone) | `tests/routes/edit/undo/undo.test.ts`, `tests/server/core/changes.test.ts` (kind `deck-slides`, field `slides`, 404 `deck-gone`) | the `deck` record tests there |
| G12, G13 (every shipped config reads) | `tests/checks/config/config-folder.test.ts`, `tests/checks/config/config.test.ts` | edited, see the list below |
| G14 (the real hub builds with no findings) | `tests/checks/config/integrity.test.ts` (deck parts rewritten over each project's `present/` deck and the portfolio deck) | the `PRESENT.md` slide parts of the same file |
| G32 (parsers read a well-formed file into what it holds) | `tests/data/sources/present.test.ts`: `splitSlides`, one `it` of 4 rows; the reader, one `it` | the old `present.test.ts` (PRESENT.md front matter parsing) |
| G16 (layer boundaries) | `tests/checks/tree/boundaries.test.ts` (the `data/helpers/deck` row and its comment removed) | edited |
| G21 (written once) | `tests/checks/tree/allow-duplication.txt` (stale docs/present entry removed) | edited |
| G24 (every key has a reader) | `tests/checks/source/keys.test.ts` (`COMPUTED_FINDING_KEYS` gains the deck reader's key `id`) | edited |

The first run of the four files on the unchanged tree (`scratchpad/r2base`, the base copy of `config src tests utils` with the four files, `scratchpad/r2-first-run.txt`), `npx vitest run tests/data/sources/present.test.ts tests/routes/docs/deck.test.ts tests/routes/edit/deck-slides.test.ts tests/server/edit/deck-edit.test.ts`; two files fail to load and the two `it`s that load fail before their first row:

```
 FAIL  |unit| tests/data/sources/present.test.ts [ tests/data/sources/present.test.ts ]
Error: Cannot find module '../../../src/lib/data/sources/deck/read.ts'
 FAIL  |unit| tests/routes/docs/deck.test.ts [ tests/routes/docs/deck.test.ts ]
Error: Cannot find module '../../../src/lib/server/content/deck/endpoint.ts'
 FAIL  |unit| tests/routes/edit/deck-slides.test.ts > writing a deck group list > writes the list of a group keeping every other line, and refuses what the file or the roots do not allow
TypeError: The "path" argument must be of type string. Received undefined
 FAIL  |unit| tests/server/edit/deck-edit.test.ts > setGroupSlides > replaces a list in place and keeps every comment around it
TypeError: setGroupSlides is not a function
 Test Files  4 failed (4)
      Tests  2 failed (2)
```

The same command in the worktree (`scratchpad/r2-pass.txt`, verbose reporter; each line is a passing test):

```
 |unit| tests/server/edit/deck-edit.test.ts > setGroupSlides > replaces a list in place and keeps every comment around it
 |unit| tests/data/sources/present.test.ts > splitSlides > cuts a file at each separator and gives a slide after one its own front matter
 |unit| tests/data/sources/present.test.ts > the deck reader > places the member decks of a group with every slide of their files, counts them and reads their summary rows
 |unit| tests/routes/docs/deck.test.ts > the deck route > refuses a root nothing serves, a path that climbs out of the root, a link and an absolute path
 |unit| tests/routes/edit/deck-slides.test.ts > writing a deck group list > writes the list of a group keeping every other line, and refuses what the file or the roots do not allow
 Test Files  4 passed (4)
      Tests  5 passed (5)
```

The unchanged tree has no `setGroupSlides`, no deck reader and no deck route, so no table of the four files reaches a row there. What the tables do not cover: the Svelte views (no component test environment), the gap through the page's sanitiser, and the menu of cases 14 and 15 (looks).

Edited existing assertions, allow-lists and predicates, each with before and after:

- `tests/checks/config/config.test.ts`: the assertion `expect(portfolioConfigFrom(loadConfig(copy).config, copy).deckFile).toBe(join(copy, 'config', 'present.yml'))` and its import are removed; no deck file path exists any more, and `portfolioConfigFrom` takes no engine argument.
- `tests/checks/config/config-folder.test.ts`: EXPECTED `present.yml` top keys `['deck']` becomes `['defaults']`; the expected key list of `sources.yml` gains `portfolio_deck`.
- `tests/data/snapshot/normalise.test.ts:235`: `present: {}` becomes `decks: {}`.
- `tests/server/edit/writes.test.ts:153`: chips `['exploring']` becomes `['nascent']`.
- `tests/checks/source/keys.test.ts`: one entry added to `COMPUTED_FINDING_KEYS` for `deck/read.ts` key `id`, a key built from a project id at run time.
- `tests/fixtures/kinds.ts`: a new `RETIRED_KINDS = ['deck']` joins the write kinds the fixture lists (before: the list held the found kinds, `files` and `app-store`); the old record kind still has a History name and an undo answer.
- `tests/checks/tree/allow-duplication.txt`: the line `tests/data/sources/docs.test.ts tests/data/sources/present.test.ts 4ec036f383df the same 13 lines at 18 and 19, to fold into one place` removed (both tests now use `plantFile`); nothing added.
- `tests/checks/tree/html-sites` list: unchanged, since the Equation key stays `tex(slide.equation, true)`.
- Comment blocks of files in the table were rewrapped to the width of 100 where a rename lengthened them (`tests/checks/source/comment-width.test.ts` passes in the run of item 1).

## The files, with line counts

From `diff -rq` of `config src tests utils` against the base copy `.agents/worktrees/PR2-base/tools/oculus` (`local.yml` excluded), each file's current line count and, for a changed file, the lines added and removed (`diff -u`). "In" and "outside" refer to the brief's "Paths this step writes". Outside rows are the consequences of the size and folder rules (a folder holds at most 10 items, a file at most 900 lines, a component 540), of `portfolioConfigFrom` losing its `engine` argument (its callers), of the `plantFile` fixture (`tests/fixtures/scratch.ts`, which two tests now share so that the duplication check passes) and of the layout API gaining `showDeck` (`layout.svelte.ts`, `layout/index.ts`, `layout/open/show.ts`, which holds `createShowInFiles` and `createShowDeck`; the base's `layout/open/show-in-files.ts` is removed); each is a judgment call listed below.

| File (under tools/oculus) | Change | Lines | Paths this step writes |
|---|---|---|---|
| config/catalogs/options.yml | changed | 1194 (+9 -169) | in |
| config/catalogs/vocab.yml | changed | 299 (+6 -0) | in |
| config/present.yml | changed | 8 (+2 -267) | in |
| config/sources.yml | changed | 134 (+4 -0) | in |
| config/text/findings.yml | changed | 231 (+26 -10) | in |
| config/text/server.yml | changed | 118 (+8 -0) | outside |
| config/text/views/academic/present.yml | changed | 38 (+11 -1) | in |
| config/text/views/academic/slides.yml | changed | 38 (+16 -10) | in |
| config/text/views/boards/project.yml | changed | 128 (+2 -2) | in |
| config/text/views/sources/files.yml | changed | 246 (+1 -0) | in |
| config/text/views/system/history.yml | changed | 70 (+2 -0) | in |
| config/text/views/system/workbench.yml | changed | 200 (+1 -1) | in |
| src/lib/data/helpers/deck.ts | removed | 188 (was) | in |
| src/lib/data/helpers/files/apps.ts | changed | 203 (+1 -1) | in |
| src/lib/data/helpers/finding-text.ts | changed | 47 (+2 -2) | outside |
| src/lib/data/index.ts | changed | 299 (+66 -36) | in |
| src/lib/data/model/index.ts | changed | 601 (+23 -17) | in |
| src/lib/data/model/model-entities.ts | changed | 780 (+151 -115) | in |
| src/lib/data/snapshot/normalise.ts | changed | 837 (+5 -4) | in |
| src/lib/data/sources/config/catalog/options.ts | changed | 541 (+3 -21) | in |
| src/lib/data/sources/deck/files.ts | new | 82 | in |
| src/lib/data/sources/deck/groups.ts | new | 188 | in |
| src/lib/data/sources/deck/kinds.ts | new | 331 | in |
| src/lib/data/sources/deck/project.ts | new | 154 | in |
| src/lib/data/sources/deck/read.ts | new | 533 | in |
| src/lib/data/sources/deck/spec.ts | new | 163 | in |
| src/lib/data/sources/deck/split.ts | new | 117 | in |
| src/lib/data/sources/docs.ts | changed | 158 (+32 -22) | in |
| src/lib/data/sources/present.ts | removed | 403 (was) | in |
| src/lib/server/content/audit.ts | removed | 68 (was) | outside |
| src/lib/server/content/audit/projects.ts | changed | 511 (+19 -3) | in |
| src/lib/server/content/audit/scan.ts | new | 61 | outside |
| src/lib/server/content/deck/endpoint.ts | new | 31 | outside |
| src/lib/server/content/deck/read.ts | new | 59 | outside |
| src/lib/server/content/docs.ts | changed | 558 (+7 -12) | in |
| src/lib/server/core/changes.ts | changed | 362 (+1 -1) | outside |
| src/lib/server/edit/deck-edit.ts | changed | 58 (+40 -46) | in |
| src/lib/server/edit/list-edit.ts | changed | 206 (+40 -27) | in |
| src/lib/server/edit/writes.ts | changed | 620 (+12 -12) | in |
| src/lib/server/edit/writes/app-gate.ts | changed | 124 (+2 -2) | in |
| src/lib/server/edit/writes/bodies.ts | changed | 465 (+26 -15) | in |
| src/lib/server/edit/writes/config/audit-mute.ts | changed | 88 (+2 -2) | outside |
| src/lib/server/edit/writes/config/config-sources.ts | changed | 68 (+0 -5) | in |
| src/lib/server/edit/writes/config/config-write.ts | changed | 100 (+6 -10) | in |
| src/lib/server/edit/writes/config/deck.ts | changed | 146 (+122 -109) | in |
| src/lib/server/edit/writes/manifest.ts | changed | 486 (+1 -1) | in |
| src/lib/server/edit/writes/undo.ts | changed | 413 (+8 -15) | in |
| src/lib/server/files/project-files.ts | changed | 217 (+1 -1) | outside |
| src/lib/server/machine/pty/start/chat.ts | changed | 119 (+1 -1) | outside |
| src/lib/server/machine/pty/start/context.ts | changed | 46 (+2 -6) | outside |
| src/lib/server/machine/seeds/task-start.ts | changed | 94 (+1 -1) | outside |
| src/lib/server/root/watch/portfolio.ts | changed | 658 (+31 -20) | in |
| src/lib/state/boards/board/items.ts | changed | 195 (+3 -7) | in |
| src/lib/state/client/context.ts | changed | 542 (+1 -1) | in |
| src/lib/state/client/writes.svelte.ts | changed | 660 (+11 -7) | in |
| src/lib/state/life/present.svelte.ts | changed | 151 (+130 -71) | in |
| src/lib/state/life/present.ts | changed | 287 (+180 -366) | in |
| src/lib/state/life/slides.ts | changed | 168 (+119 -90) | in |
| src/lib/state/shared/stores/shapes.ts | changed | 357 (+6 -1) | in |
| src/lib/state/system/config/editors/sources.ts | changed | 132 (+0 -5) | in |
| src/lib/state/workbench/layout.svelte.ts | changed | 836 (+6 -0) | outside |
| src/lib/state/workbench/layout/index.ts | changed | 140 (+2 -2) | outside |
| src/lib/state/workbench/layout/open/show-in-files.ts | removed | 82 (was) | outside |
| src/lib/state/workbench/layout/open/show.ts | new | 105 | outside |
| src/lib/views/academic/present/Bar.svelte | new | 75 | in |
| src/lib/views/academic/present/Overview.svelte | changed | 81 (+5 -3) | in |
| src/lib/views/academic/present/Panel.svelte | changed | 165 (+6 -15) | in |
| src/lib/views/academic/present/Present.svelte | changed | 513 (+109 -98) | in |
| src/lib/views/academic/present/Slide.svelte | changed | 94 (+69 -44) | in |
| src/lib/views/academic/present/keys.ts | new | 30 | in |
| src/lib/views/academic/present/markup.ts | changed | 101 (+17 -1) | in |
| src/lib/views/academic/present/parts/Closing.svelte | removed | 63 (was) | in |
| src/lib/views/academic/present/parts/Equation.svelte | changed | 68 (+6 -5) | in |
| src/lib/views/academic/present/parts/Framing.svelte | removed | 94 (was) | in |
| src/lib/views/academic/present/parts/Grid.svelte | new | 123 | in |
| src/lib/views/academic/present/parts/Ideas.svelte | removed | 109 (was) | in |
| src/lib/views/academic/present/parts/Legend.svelte | changed | 37 (+17 -9) | in |
| src/lib/views/academic/present/parts/Plain.svelte | new | 85 | in |
| src/lib/views/academic/present/parts/Project.svelte | changed | 254 (+20 -16) | in |
| src/lib/views/academic/present/parts/Section.svelte | new | 101 | in |
| src/lib/views/academic/present/parts/Summary.svelte | changed | 102 (+16 -15) | in |
| src/lib/views/academic/present/parts/Title.svelte | changed | 72 (+22 -15) | in |
| src/lib/views/academic/present/parts/Words.svelte | changed | 64 (+9 -0) | in |
| src/lib/views/academic/slides/Slides.svelte | changed | 442 (+245 -139) | in |
| src/lib/views/boards/project/Project.svelte | changed | 285 (+3 -6) | in |
| src/lib/views/shared/card/ProjectCard.svelte | changed | 495 (+8 -9) | in |
| src/lib/views/shared/card/card.ts | changed | 138 (+5 -5) | in |
| src/lib/views/shared/explorer/tree/menu/row-menu.ts | changed | 582 (+43 -9) | in |
| src/lib/views/shared/writes/undo-said.ts | changed | 46 (+1 -0) | outside |
| src/routes/api/(docs)/deck/+server.ts | new | 22 | in |
| tests/checks/config/config-folder.test.ts | changed | 556 (+2 -1) | in |
| tests/checks/config/config.test.ts | changed | 595 (+0 -4) | in |
| tests/checks/config/integrity.test.ts | changed | 291 (+123 -79) | in |
| tests/checks/source/keys.test.ts | changed | 490 (+7 -3) | outside |
| tests/checks/tree/allow-duplication.txt | changed | 35 (+0 -1) | in |
| tests/checks/tree/boundaries.test.ts | changed | 668 (+2 -5) | in |
| tests/data/real-hub.probe.ts | changed | 133 (+1 -1) | outside |
| tests/data/snapshot/cluster-folder.test.ts | changed | 75 (+1 -1) | outside |
| tests/data/snapshot/normalise.test.ts | changed | 302 (+1 -1) | in |
| tests/data/snapshot/resources.test.ts | changed | 93 (+1 -1) | outside |
| tests/data/sources/docs.test.ts | changed | 55 (+5 -15) | outside |
| tests/data/sources/personal.test.ts | changed | 105 (+1 -1) | outside |
| tests/data/sources/present.test.ts | changed | 209 (+192 -70) | in |
| tests/fixtures/kinds.ts | changed | 34 (+10 -2) | outside |
| tests/fixtures/real-hub.ts | changed | 37 (+1 -1) | outside |
| tests/fixtures/scratch.ts | changed | 126 (+14 -0) | outside |
| tests/routes/docs/deck.test.ts | new | 72 | in |
| tests/routes/edit/audit-mute.test.ts | changed | 114 (+1 -1) | outside |
| tests/routes/edit/deck-slides.test.ts | new | 128 | in |
| tests/routes/edit/undo/undo.test.ts | changed | 381 (+68 -20) | in |
| tests/routes/edit/write-fixture.ts | changed | 349 (+43 -28) | in |
| tests/routes/files/project-files.test.ts | changed | 66 (+1 -1) | outside |
| tests/server/core/changes.test.ts | changed | 316 (+19 -14) | in |
| tests/server/edit/deck-edit.test.ts | changed | 127 (+111 -31) | in |
| tests/server/edit/feeds.test.ts | changed | 343 (+1 -1) | outside |
| tests/server/edit/writes-fixture.ts | changed | 120 (+1 -1) | outside |
| tests/server/edit/writes.test.ts | changed | 164 (+1 -1) | in |
| tests/server/git/deposit.test.ts | changed | 144 (+1 -1) | outside |
| tests/server/git/refs/repo.ts | changed | 70 (+3 -10) | outside |
| utils/migrations/convert-decks.mjs | new | 536 | outside |

Outside `config src tests utils` (no base copy of these; line counts of the worktree, added and removed against the main checkout's file, read only), all in "Paths this step writes":

| File | Lines | Change |
|---|---|---|
| `tools/oculus/DESIGN.md` | 439 | +8 -8 |
| `tools/oculus/HELP.md` | 375 | +8 -8 |
| `tools/oculus/docs/apps.md` | 861 | +2 -2 |
| `tools/oculus/docs/diagrams/` | 12 files | regenerated by `npm run diagrams` (layer-data, layer-server, layer-state, layer-views, layers, writes; .dot and .svg) |
| `tools/oculus/demo/README.md` | 5 | +1 -1 |
| `tools/oculus/demo/deck/` | 3 files, 30 lines | new |
| `tools/oculus/demo/projects/active/graph-bandits/present/` | 2 files, 43 lines | new; its `PRESENT.md` removed |
| `README.md` | 50 | +1 -1 |
| `docs/DATA-MAP.md` | 490 | +8 -9 |
| `.agents/skills/project-new/SKILL.md` | 83 | +2 -6 |
| `.agents/skills/project-cleanup/SKILL.md` | 277 | +2 -11 |
| `.agents/skills/remove-unicode/SKILL.md` | 253 | +1 -1 |
| `.agents/skills/research-cockpit/SKILL.md` | 270 | +11 -34 |
| `tools/cockpit/templates/project.active.yml` | 51 | +1 -1 |
| `tools/cockpit/templates/project.idea.yml` | 21 | +2 -2 |
| `tools/cockpit/templates/docs/present/` | 2 files, 23 lines | new; `docs/PRESENT.md` removed |

Hub data, written through `convert-decks.mjs` only (in "Paths this step writes"): `deck/` (5 files, 89 lines, new); 25 `present/` folders with a `present.yml` and a `main.md` each (50 files: 16 project decks and the 9 idea decks); the `chips:` line of 32 idea manifests; 18 `PRESENT.md` removed (17 under `projects/` and the demo's). `find projects -type d -name present | wc -l` prints 25 and `find projects -path '*/present/*' -type f ( -name present.yml -o -name main.md ) | wc -l` prints 50.

## Prose the slides do not carry

`PRESENT.md` is removed, so these sentences are gone from the hub unless Axel wants them in a `main.md`. I compared each sentence of each file's prose (under the front matter, from the main checkout, read only) with the converted `main.md`. Markdown emphasis dropped from the quotes. `fed-faithful-ecg` and `ecg-readable-substrate` had prose only and became their slide, whole. `asthma-geo-tensor` held the empty template only: no sentence, no deck.

- hccnet-fl: "A naive federation shares the whole model, but labels are scarce and unevenly spread, and the part that actually carries performance is the label-free feature extractor (learned without diagnoses)." / "The design rule generalises: what to federate can be read from a model's transfer-importance profile - share the transferable, label-free component." / "A privacy-preserving, communication-efficient route to cross-hospital longitudinal-MRI surveillance models that works when labels are scarce and unevenly distributed." / "Evaluation across clinically-grounded silo axes (label skew, screening cadence, modality) is in progress." / "Open to collaboration on federated medical imaging."
- bt-operator-theory: "A principled, predictive account of structured neural operators, it tells practitioners how to build them (band-specialized experts, matched-parameter comparison, generalization-gap metric) and why it works." / "Open to collaborations on operator-learning theory and multi-scale PDE benchmarks."
- btfno: "A parameter-efficient, multi-scale foundation operator for science." / "Open to collaborations on operator learning and PDE benchmarks."
- bttd-source-eeg: "Classic methods estimate a source map at each instant separately." / "Fit greedily/deflationarily with a joint refit." / "The novelty is the capability, jointly-localized spatiotemporal components of evoked EEG, distinct from per-sample inverses and from 'decompose first, localize after.'" / "Setup-dependent on denser head models eLORETA is sharper." / "(a robustness shared with linear distributed inverses)" / "Scope, stated plainly: it is not the sharpest point-source localizer, and it applies to phase-locked evoked responses." / "A physics-grounded, interpretable way to read evoked EEG as a small set of spatiotemporal components, useful when you want what+where+when together rather than a sequence of instantaneous maps." / "Open to collaboration on tensor methods for neural source imaging."
- bttn-incident-af: "Atrial fibrillation often leaves a faint 'fingerprint' in an ECG that still looks normal." / "...and we test that those highlighted parts are really what the model uses, rather than taking the explanation on faith." / "The contribution is an interpretable-factor + measured-faithfulness framework, instantiated efficiently by the block-term layer, NOT an accuracy record or a new interpretability gadget." / "Interpretability is validated, not asserted:" with "Control probes calibrate how much of the model a readout of its interpretable factors recovers (against raw-tensor, random-projection, and black-box-penultimate references)", "Intervention / sufficiency test is the decisive evidence: ablating the top-ranked factors collapses performance while ablating the bottom-ranked ones barely moves it, proving the explanation tracks the model's actual routing." and "Substrate reproduces externally (CODE-15 + PTB-XL): the same leads and frequency bands recur, so the glass-box signature is not a single-dataset artifact." / "A faithful, glass-box route to ECG-based risk models, where the reasoning can be inspected and stress-tested." / "Joint work with Dries Cornelissen (lead)." / "Open to collaborations on interpretable cardiac ML and dated-incidence external validation."
- covert-applied: "The honest pitch is equal accuracy with privacy + systems + interpretability benefits, not an accuracy record." / "A practical recipe for privacy-preserving learning across institutions that hold complementary clinical views (imaging + ECG + labs): formal DP where it is cheap (the coupling variable), low communication, and inspectable components, at no accuracy cost." / "Both clinical arms are measured (HCC imaging + MIMIC-IV-ECG), at parity." / "(with convergence guarantees from the companion theory paper)" / "Companion theory in a sibling project." / "Open to collaboration on private clinical federated learning."
- covert-theory: "In vertical federated learning, several institutions each hold different features for the same patients and want a joint model without sharing raw data." / "Hospitals A, B, C each measure different things about the same patients. To learn together without sharing records, they exchange only a small coupling score that ties their views together." / "The privacy question is where to add the differential-privacy noise. Adding it to each party's big feature factors is expensive and scales with how many features they have." / "Private Coupled Descent: a block-coordinate (PALM-style) scheme for vertical federated block-term tensor regression where the only thing crossing party boundaries is a differentially-private coupling score." / "a no-go result (naive private masking cannot recover the sparse structure)" / "A clean answer to where to spend the privacy budget in cross-silo vertical FL: on the coupling variable." / "The guarantee is dimension-free and the bounds are tight in the budget, useful wherever institutions must learn jointly over disjoint feature sets under formal privacy." / "Companion applied study (clinical multi-view) in a sibling project." / "Open to collaboration on private federated optimization."
- dongho-ecg-clustering (the slide has no `eli5:`): "If you feed raw heartbeat recordings into a clustering algorithm, it groups them by loudness and timing quirks, not by disease, and a popular 'quality score' (the silhouette) will even reward that useless grouping." / "We benchmark five ways of representing an ECG, score them with metrics that correct for chance, and add a supervised 'ceiling' that separates 'the signal isn't there' from 'clustering can't reach it.' The headline ordering is unsurprising; the value is the controls, the cautions, and what survives real-world deployment stress." / the table rows raw flattened (ARI ~0.00, supervised 0.52), conv-autoencoder 32-d (~0.01, 0.68), HuBERT-ECG (0.20, 0.90; the slide reads 0.19), 16 hand-crafted (0.71, 0.94) and ECGFounder 10M-ECG CNN (0.89, 0.98) / "A model can contain the discriminative signal (decodable to 90%+ accuracy) yet not cluster on it, because the signal lies off the dominant axes of variation. Hand-crafted features place it on those axes by construction." / "The silhouette trap: a degenerate one-cluster solution scores silhouette 0.81 at ARI 0.00. Internal indices reward collapse, chance-corrected external metrics are mandatory." / "Scaler sensitivity: a common default (RobustScaler) nearly halves clustering quality. Conditioning matters as much as representation." / "Under two realistic stressors the picture flips toward the cheap features:" / "9:1 class imbalance: the 16-d hand-crafted features overtake the 10M-ECG foundation model." / "...retain 92% of their centralized quality vs 69% for the foundation embedding" (the 69%) / "For privacy-preserving, heterogeneous multi-hospital ECG phenotyping, simple interpretable features are competitive with a large foundation embedding." / "The finding replicates on a different dataset and task, MIT-BIH beat-level normal-vs-PVC morphology: hand-crafted features cluster (ARI 0.78); raw and autoencoder representations do not." / "A clean, reproducible reference for which ECG representation to cluster, which metrics to trust, and which features survive deployment, with every number backed by a supervised ceiling and patient-grouped evaluation." / "Joint work with Dongho Chun (lead)." / "Open to collaboration on interpretable / robust cardiac ML."
- dries-bttr-ecg: "Deep networks can spot it but won't tell you what they used." / "So every prediction comes with a faithful, built-in account of its evidence - not a post-hoc guess." / "To our knowledge this is the first intrinsically-interpretable tensor model for identifying AF in sinus rhythm, and the first such study carried out entirely on public data (PTB-XL)." / "On a like-for-like benchmark against a clinical-feature model, an Attia-style CNN, an unsupervised CP-tensor surrogate, and a frozen HuBERT-ECG foundation model (pretrained on 9.1 million ECGs)" / "Interpretability arrives at no accuracy cost." / "(This is also why an earlier thesis that fed BTTR unaligned ECG saw near-null results: the fix was alignment, not abandoning the method.)" / "A faithful, glass-box route to ECG-based AF screening - where a positive flag (which prompts further testing and lifelong therapy) comes with an inspectable, stress-tested account of its evidence, entirely on public data." / "Joint work with Dries Cornelissen (lead)." / "Open to collaboration on interpretable cardiac ML and dated-incidence external validation."
- fed-multicellular-immune: "A 'multicellular program' is a pattern of variation that shows up across many cell types at once and tracks disease (e.g. the interferon program in lupus). Finding it normally needs everyone's cells in one place." / "Cell-type-incomplete recovery ... something fixed-feature federated PCA cannot do." / "Where multicellularity matters: on an interstitial-lung-disease atlas the recovered program predicts disease better than the best single cell type (AUC 0.96 vs 0.91), and the advantage survives federation; a liver fibrosis cohort corroborates. On compartment-dominated tissues it's at parity - reported honestly." / "A practical, privacy-preserving route to discovering multicellular disease programs across the multi-institution single-cell atlases the field is now building - with a provable equivalence to the centralised analysis and a clear map of when the multicellular view actually helps." / "Joint work with S. van den Berg and M. Amir Haeri (Univ. ...)." / "Open to collaboration on federated single-cell analysis."
- hccnet-revision: "Chronic-disease patients (here, cirrhosis patients watched for liver cancer) get repeated MRI scans at uneven intervals. Most models look at a single scan; HCCNet looks at the whole timeline." / "Two-stage self-supervised pre-training: DINO-style SSL for the 3D CNN backbone + a sequence-order-prediction task for the Transformer (so it learns disease progression)." / "The gain is driven by the self-supervised pre-training of the backbone (shown by ablation) - the right place to invest when labels are scarce." / "A general, label-efficient framework for prognosis from longitudinal 3D MRI screening - adaptable to other chronic-disease surveillance settings with irregular imaging timelines." / "Joint work with Jakob Nolte (co-first) and clinical collaborators." / "Open to collaboration on longitudinal medical imaging and self-supervised 3D representation learning."
- meseret-cirrhosis: "The Mayo primary-biliary-cirrhosis dataset (418 patients) is a popular benchmark, usually scored by asking a model to label each patient alive / transplant / death. But patients are still being followed (some outcomes simply haven't happened yet), and a transplant competes with death rather than being a fixed label." / "Treating it as plain classification throws away the follow-up time and mishandles transplantation, which is exactly why the 'transplant' class looks unpredictable." / "(95% CI 0.80-0.84)" on the transplant concordance 0.82 / "On small tabular clinical data, problem formulation matters more than model sophistication." / "A reproducible, openly-released framework so a heavily-used benchmark can be analysed correctly, with calibrated absolute risk and cause-specific effects for both competing outcomes, plus a clear, generalizable lesson for clinical ML on small tabular cohorts." / "Joint work with Meseret Assefa Kerga (lead)." / "Open to collaboration on principled survival modelling and clinical-ML evaluation."
- raw-pls: "Output: a shared interpretable atom dictionary + per-sample importance maps (which / where), all registration-free." / "Structural target (ET-NCR distance, BraTS2021, n=1181): registration-free margin +0.354 R^2 over the aligned baseline (Wilcoxon p~2e-15, 10 seeds)." / "Tumour grade (HGG/LGG, BraTS2020, n=368): AUC 0.935 vs 0.834 (+0.101, p~8e-10)." / "Beats DeepSets on both targets; gradient-saliency interpretability localizes to lesion sub-structure; identifiability + sqrtN-consistency theory." / "A registration-free, interpretable, theoretically-grounded predictor for unaligned spatial measures (lesions, point clouds)." / "Open to collaborations on transport-based tensor learning and multiparametric MRI."
- ward-bttr-crosssubject: "Decoding finger movement from brain-surface (ECoG) usually means training a fresh black-box network per patient, because every implant's electrode grid is different." / "...comparable to CORTEG's 0.554 (a gap inside the method's own subject-to-subject spread, so competitive rather than a clean beat)" / "...behavior-supervised alignment transfers where generic Euclidean Alignment, and even a principled anatomical alignment, collapse (Wilcoxon p=0.016)." / "A route to interpretable, transferable ECoG decoders that reach the foundation-model accuracy band without a large pretraining corpus, without the opacity, and with a few minutes of calibration." / "Joint work with Ward Ceyssens (lead)." / "Open to collaboration on interpretable neural decoding and cross-subject transfer."

Where the prose and the slide disagree (carried as the slide has it, for Axel): `dongho-ecg-clustering`'s slide says hand-crafted features "lead unsupervised clustering" (ARI 0.71) while the prose table gives ECGFounder ARI 0.89, and HuBERT-ECG is 0.20 in the prose and 0.19 on the slide; `raw-pls`'s prose margin is +0.354 R^2 and the slide's results line says +0.34 with a headline of +0.43; `bttn-incident-af`'s headline reads "BTTN 0.762 vs CNN 0.748" and its results line reads "BTTN+SSL 0.762 vs CNN 0.749".

## The 23 ideas set to `nascent`, and the two converted slides

The 23 ideas with no deck, chip `nascent` (`projects/ideas/<id>/project.yml`): adapter-format-theory, asthma-geo-tensor, attention-scoped-instructions, block-term-nca, brecht-fl-partitioning, concept-bottleneck-hcc, conformal-tensor-factors, engram, faithful-interpretability-position, fed-duplication-limits, fed-neural-operators, fedlink, harmonop, modality-dropping-btf, multiway-biosignal-fm, neurosde, paleogenomics-tensor, pathology-tensor-mil, physics-tensor-hcc, serial-ecg-af, strokeop, tao-of-ecs, xsub-ecog-framework (from `find`/`yaml` over `projects/ideas/*/project.yml`: `nascent without deck` lists exactly these 23). The nine grid ideas keep the grid's maturity (case 21).

`ecg-readable-substrate` as converted (`projects/manuscripts/ecg-readable-substrate/present/`): `present.yml` is `deck: {title: "A Certificate, Not Just an Explanation, for ECG AI"}`, `order: [main.md]`; `main.md` is `kind: text` front matter, a heading with that title, and the prose of `PRESENT.md` word for word: "One-liner: Powerful ECG AI can flag hidden disease but not give a reason you can trust. We turn it into a few nameable concepts and, for each patient, emit a small set that PROVABLY suffices for the prediction - a guarantee, not a guess.", "In plain words (ELI5)", "The idea / method", "Key results: In progress.", "Why it matters / what's next". `fed-faithful-ecg` (`projects/archive/nogo/fed-faithful-ecg/present/`) has the same shape, title "Keeping Federated Glass-Box ECG Models Honest", "Key results: In progress: real-hospital replication on PTB-XL and MIMIC-IV-ECG." Both are the 17-line prose of `PRESENT.md` and nothing else (`cat` of the two folders). `ecg-readable-substrate` is found by `more`'s `find:` and appears in the portfolio deck; `fed-faithful-ecg` is archived and no group finds it.

## Carried sentences that break a prose rule, for Axel

The converted words are byte for byte the source's, so these stay. A spaced hyphen standing in for a dash, found by `re.search(r' - | -- ')` on each line of the 50 `main.md` and `present.yml` files under `projects/*/present/` and `projects/archive/*/*/*/present/` after removing a leading list marker: 42 lines in 10 files: `projects/archive/published/2026/hccnet-fl/present/main.md` lines 6, 7, 10, 40, 45 and `present.yml:2`; `projects/manuscripts/bttd-source-eeg/present/main.md:7`; `dries-bttr-ecg/present/main.md` lines 6, 7, 23, 24, 30, 34 and `present.yml:2`; `ecg-readable-substrate/present/main.md` lines 6, 9, 18; `fed-multicellular-immune/present/main.md` lines 7, 8, 11, 27, 32, 38; `hccnet-revision/present/main.md` lines 7, 24, 29, 30, 34; `raw-pls/present/main.md` lines 7, 11, 32, 35, 37, 38, 41, 43, 48, 49, 50, 51; `ward-bttr-crosssubject/present/main.md` lines 7, 26. Other tells (negation-contrast such as "not an accuracy record", groups of three, marketing words) need a reading of all 16 slides and I did not do it: not verified.

## Judgment calls the brief left open

- The deck a pane shows (root, path), the slide, the overview and the recent decks are in the pane's instance state, so opening a deck from the Files menu, the card, the deck menu or a saved pane writes it one way (`openedDeck`); the layout state of a tab keeps its label only.
- The project tab's Open Presentation control is on the card (`ProjectCard.svelte`, `card.ts`), shared with the Projects board.
- The transition slide is a section slide with no list: its text is the foot, as the brief says.
- The menu word is `Open Presentation` (Title Case, as the other Files menu words are), not `Open presentation`.
- A grid card and a summary row name a project by its `short:`.
- `ecg-readable-substrate` is in `more` by discovery (the brief's group `more` has `tiers: [active, manuscripts]` and `discover: true`), so `more` holds 7 and the portfolio deck 21 slides.
- Size and folder rules forced: the deck store merged into `state/life/present.svelte.ts` (the folder held 10 items), the Idea card merged into `parts/Grid.svelte`, `layout/open/show-in-files.ts` and the new deck opener merged into `layout/open/show.ts` (the folder holds 10 items), the old `content/audit.ts` moved to `content/audit/scan.ts`, `Present.svelte` split into `Present.svelte` (513 lines), `Bar.svelte` and `keys.ts`, and the conversion script written as `utils/migrations/convert-decks.mjs`.
- `list-edit.ts` takes an owner that is a key, a path of keys or null, so a deck group's `slides:` under `groups.<name>` is one call.
- `server/edit/writes/config/deck.ts` compares the path with `realPath(root.dir)`, since a served root can sit behind a symlink (the macOS temp folder does).
- `portfolioConfigFrom(merged)` lost its `engine` argument, since the engine no longer holds a deck file; its callers changed (`project-files.ts`, `pty/start/chat.ts`, `pty/start/context.ts`, `seeds/task-start.ts` and the tests that call it, the "outside" rows).
- `tests/fixtures/scratch.ts` gains `plantFile`, which `tests/data/sources/docs.test.ts` and `tests/server/git/refs/repo.ts` use in place of their own copies.

## Host- and user-visible changes, before and after

- The portfolio deck: before, 23 slides from `config/present.yml` (including `hccnet-fl` as slide 4, `ecg-readable-substrate` and `asthma-geo-tensor`, which was the empty template); after, 21 slides from `deck/` (title, engine, 7 pillars, summary, transition, 7 more, summary, idea grid, closing). `hccnet-fl` no longer shows in it (its slide lives in its own archive deck); `asthma-geo-tensor` has no deck. A Present pane saved with `{ slide: 'hccnet-fl' }` opens at the first slide (case 24).
- The idea grid: before, 10 cards typed in the config, one of them "Federated Block-Term Decomp." (`fedbtd`, `parked`); after, 9 cards found by `status: [nascent, scoping, de-risking]`, so the parked `fedbtd` card is gone (case 9), and a card's name, colour and maturity come from the manifest.
- Chips: before, every idea `exploring`; after, `nascent`, `scoping` or `de-risking` with words and colours in `config/catalogs/vocab.yml`, and a new idea starts `nascent` (New idea write and `project.idea.yml`). Active and coauthor projects keep `exploring`.
- Colours and labels: before, typed per slide in `config/present.yml` (`themes`, the summaries' `field:` text, the hand-typed domain lists of the title lede and of `summary2`'s foot, the transition's topic list, the deck's key hint); after, read from `vocab.yml` by each project's `domain:`, with the counts as `{{group.count}}`, the legend as `legend: <group>`, and the key hint drawn in the foot of every deck's first slide.
- Slides: a Markdown image whose file is missing or outside the deck's folder is drawn as a gap with a finding (new: the old format held no Markdown slide body); a section slide without a list shows its text as the foot with an empty lede.
- The slide rule: before, the head comment of `config/present.yml` and the `PUBLIC-SAFE ONLY` line of the template `tools/cockpit/templates/docs/PRESENT.md:4`; after, the head comment of `deck/present.yml` and of the demo's `present.yml`, and the first lines of the template `tools/cockpit/templates/docs/present/main.md`.
- Present toolbar: a deck menu lists the portfolio deck, the project decks and the decks shown before; the Slides view lists each group's members, candidates, missing names and conflicts.
- Files menu: Open Presentation on a `present.yml` and on a folder holding one; a project's card and tab: Open Presentation for a project with a `present/` folder (before: the card's control opened the first slide id of `project.present`, `card.ts:95` of the base, and the tab listed `PRESENT.md` among the documents).
- Write kinds: `deck` (selection and order of `config/present.yml`) is replaced by `deck-slides` (one group's `slides:` list of a `present.yml` under a served root, with `base`); old `deck` records keep the History name and their undo is refused with "This write belongs to the deck format that is gone, so it cannot be taken back." (`config/text/views/system/history.yml:30`, `deck_gone`).
- `config/present.yml` holds `defaults.tag_tones` only; `config/sources.yml` gains `portfolio_deck: deck`, which is a new Settings option (heading sources, control folder).
- The project snapshot carries `deck?` (the project's `present/` folder) in place of `present?` (`docs/apps.md`).
- A slide front matter closed by a line of dots (`...`) reads like a document's, since both go through `splitFrontmatter` of `docs.ts`.
- List writes (`src/lib/server/edit/list-edit.ts`), for every caller. Each case is the same source and the same new list run through the unchanged tree's file (before) and the worktree's (after) with a temporary test, `scratchpad/callers-r2base.txt` and `scratchpad/callers-PR2.txt`.
  - audit-mute (`writes/config/audit-mute.ts`, `setList(source, null, 'audit_ignore', ['old', '2026', 'null'])`), `audit_ignore: # keys the audit skips` and the item `old`. Before: the comment is gone (`audit_ignore:`) and the items are written `- 2026` and `- null`, which YAML reads as a number and null. After: `audit_ignore: # keys the audit skips`, items `- old`, `- "2026"`, `- "null"`.
  - rail (`writes/config/rail.ts`, `setItems(source, null, 'rail', ...)`), `rail: # the rail` and an entry with glyph `null` and page `2026`. Before: the comment is gone and the entry is `{ label: "B", glyph: null, page: 2026 }`. After: `rail: # the rail` and `{ label: "B", glyph: "null", page: "2026" }`.
  - roots (`writes/config/roots.ts`, `setItems(source, null, 'roots', ...)`), `roots: # served folders` and one root added. Before: `roots:` with the comment gone. After: `roots: # served folders`, both entries kept as written.
  - deck (`deck-edit.ts`, `setList(source, ['groups', 'g'], 'slides', ['a', '2026', 'null'])`): `slides: # named by hand` and the item `a`; after: the comment kept and `- "2026"`, `- "null"` appended. The unchanged tree has no group `slides:` write (its `deck` write set the `selection` and `order` lists of one deck), so there is no before.

## Hazards, unfixed

- A slide after a separator is read as front matter when the lines directly after the `---` parse as a YAML map with a key up to a closing `---` or `...`: a paragraph such as `Note: this is a body line` directly after a separator, with another `---` below it, is taken as front matter and not shown (the decision of the brief, applied by `splitSlides` in `data/sources/deck/split.ts`). A blank line after the separator avoids it.
- A custom deck under a root that the portfolio watcher does not watch gets no push when its slide files change: the pane refreshes on the next `files`, `portfolio` or `config` version or when the deck is opened again.
- An `<img src="...">` written as HTML in a slide is not rewritten against the deck's folder and is not turned into the gap; only a Markdown image `![alt](path)` is resolved to `/api/file/<root>/<path>` or to the gap.
- `markup.ts` finds the gap with `gaps(markdown(lifted))`, that is, on the output of the app's sanitiser: the gap works only if the sanitiser keeps `<img src="#gap">`. The node test environment has no DOM and no browser was opened, so that step was not run; the reader's output (`src: "#gap"`) and the expression `GAP_IMAGE` were read.

## Anything in the brief that was wrong or impossible

- The brief names `utils/convert-decks.py` (Python). The script is `utils/migrations/convert-decks.mjs`, run from the hub root as `node tools/oculus/utils/migrations/convert-decks.mjs [--check] [--hub <dir>]`, for two reasons: the tree checks of `tests/checks` read no `.py` file, so a Python script under `utils/` would be outside them, and `utils/` is at its folder limit of 10 items, so the `.mjs` sits in `utils/migrations/`. "Verify" step 2 and "Paths this step writes" name the `.py`.
- `PR2-design.md` says "the other 21 `exploring` ideas get `nascent`"; the brief says 23, and the manifests give 32 `exploring` minus the 9 of the grid = 23.
- The brief says the route is read "with the page's token as every route that reads the disk". `hooks.server.ts:58,83` also refuses, with 403 `forbidden`, a request that carries neither an `Origin` nor a `Sec-Fetch-Site` header on a path outside its headerless list, so a `curl` with the token alone is refused.
- `tools/oculus/demo/README.md` named `tests/data/demo-hub.test.ts`, which does not exist (`find tests -name "demo*"` prints nothing); the paragraph now says what the folder holds, as the brief asks.
- `PR2-design.md` says `OPEN_TIERS` is at `data/helpers/deck.ts:40`; the file is removed with it.

## Git

I ran no git command on purpose. Six invocations were made by mistake while working, none of them writing anything: four in the first stretch (among them `git` with no subcommand, which printed usage, and `git status` piped to `head -0`) and two in this round (`git -C /dev/null status`, which printed nothing, and `git -C <hub>` with no subcommand, which printed usage).
