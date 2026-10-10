# Step D59 refuter report (on .agents/worktrees/D59, base aff419a0b)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base aff419a0b          (tools/oculus in the worktree)
test:quick: 124 changed file(s), from git since aff419a0b
test:quick: 93 test file(s), 10 essential
ok      ASCII gate (0.5 s)
ok      prettier (1.5 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.0 s)
ok      svelte-check (5.2 s): 1791634603192 COMPLETED 458 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (13.5 s)
ok      vitest (26.5 s): Duration  22.14s (transform 29.07s, setup 0ms, import 52.29s, tests 31.75s, environment 389ms)
test:quick: 27.0 s (limit 45.0 s); every command passed

$ npx vitest run tests/server/root/config-cache.test.ts          (check 2)
 Test Files  1 passed (1)
      Tests  9 passed (9)

$ npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/size.test.ts tests/checks/config/arrangements.test.ts          (check 3)
 Test Files  4 passed (4)
      Tests  36 passed (36)

$ LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' HELP.md DESIGN.md README.md docs/*.md ../../docs/DATA-MAP.md ../../.oculus/config/layout.yml ../../.oculus/wallpaper/README.md          (check 3b)
(no output) exit=0
$ the spec's ASCII gate over src tests bin config     (no output) gate exit=0  (bfs: "bin: No such file or directory")

$ sh utils/folder-check.sh          (check 3c)     (no output) exit=0
$ sh utils/unused-exports.sh, diffed against .agents/worktrees/D59-base/tools/oculus/unused-exports.txt          (check 3c)
365 lines each; diff:
< src/lib/state/boards/board/index.ts: BoardColumn, BoardMode, Facet, ...
< src/lib/state/boards/board/presets.ts: BoardMode, BoardColumn
> src/lib/state/boards/board/index.ts: BoardColumn, Facet, ...
> src/lib/state/boards/board/presets.ts: BoardColumn
(no line added)

$ ls .oculus/memories | wc -l          16
$ ls tools/oculus/assets               app-icon.png  app-icon.svg
$ shasum of memories/* wallpaper/* in D59-base/tools/oculus/assets vs .oculus/          (check 3d)
28 files each side; one differs: wallpaper/README.md (the reworded sentence)

$ grep -rnE 'font-size: *[0-9.]+px' src          (check 3e)     (no output) exit=1
$ grep -nE -- '--(rail-badge-text|status-text|tree-font|tree-heading-font|tree-badge-font|button-font):' src/lib/themes/themes.css
741:    --rail-badge-text: 8px;   742: --status-text: 11px;   743: --tree-font: 12px;
744:    --tree-heading-font: 10px; 745: --tree-badge-font: 10px; 746: --button-font: 11px;   (inside body.rice, 733 to 754)
$ grep -n 'body.rice .slide-frame' src/lib/themes/slide.css      24:body.rice .slide-frame {
$ npx vitest run tests/checks/look/contrast.test.ts tests/checks/diagrams tests/checks/source/keys.test.ts tests/checks/tree
 Test Files  1 failed | 5 passed (6)   Tests  2 failed | 131 passed (133)
 (the two failures: diagrams.test.ts "Test timed out in 5000ms", under the load of the six files at once)
$ npx vitest run tests/checks/diagrams --testTimeout 0 --hookTimeout 0
 Test Files  1 passed (1)   Tests  46 passed (46)

Check 4, the step's new and changed tests on the unchanged tree (my own scratch copy: D59-base src/tests/config/utils under $TMPDIR, the worktree's six changed test and fixture files laid over it, node_modules linked):
$ npx vitest run tests/server/root/config-cache.test.ts tests/state/workbench/layout/saved/layout-saved.test.ts tests/data/sources/personal.test.ts tests/routes/edit/write.test.ts
 FAIL personal.test.ts > reads the five fields: expected { id: 'side:slug', ...(7) } to deeply equal { id: 'side:slug', ...(9) }
 FAIL personal.test.ts > names its deck when the folder holds present/present.yml, ...: expected undefined to be 'side-projects/deck/present'
 FAIL config-cache.test.ts > parses again once a file of the hub's .oculus/config is written: expected { one: 1, docs: [ { ...(3) } ] } to match object { docs: [ { path: 'a.md' }, ...(1) ] }
 FAIL config-cache.test.ts > reads the layer of the hub that local.yml names now: expected { one: 1, docs: [ { ...(3) } ] } to match object { docs: [ { path: 'other.md' } ] }
 FAIL config-cache.test.ts > parses again once the hub's .oculus/config folder is made, and again once it is removed: expected { one: 1 } to match object { docs: [ { path: 'a.md' } ] }
 FAIL layout-saved.test.ts > reads the paths of the documents a rail page was given, ...: expected [ undefined, undefined, ...(2) ] to deeply equal [ [ 'x.md', 'y.md' ], undefined, ...(2) ]
 FAIL layout-saved.test.ts > takes the folder name off the Files and LaTeX tabs ...: expected [ { root: 'hub', ...(2) }, ...(3) ] to deeply equal [ { root: 'hub', ...(1) }, ...(3) ]
 Test Files  3 failed | 1 passed (4)   Tests  7 failed | 20 passed (27)
(the report's quoted failures reproduce; write.test.ts's new row passes on the unchanged tree, as the report says)

Probes in place of the report's $S probes (gone), node scripts under $TMPDIR importing the worktree's modules, reading config/layout.yml, glyphs.yml and the hub's .oculus/config/layout.yml:
railPages + parseArrangement, docs list plus {f.md group focus}, {n.md group nopage}, {docs/AGENT-APPROACH.md group help, a duplicate}, {s.md group sessions}:
focus: focus | doc:Focus note
sessions: session-list | doc:Sess | terminal | transcript | timeline | session-detail | files
help: help | doc:Research approach | doc:Agent approach | doc:HPC how-to | doc:Data map | doc:Apps guide | memories
(no page gains n.md; the duplicate path gives one tab)
giveDocuments over a Help page made from the arrangement with no Page.docs:
given: help | doc:Research approach | doc:Agent approach | doc:HPC how-to | doc:Data map | doc:Apps guide | memories docs= ["docs/RESEARCH-APPROACH.md","docs/AGENT-APPROACH.md","docs/HPC-UTwente-howto.md","docs/DATA-MAP.md"]
closed Data map, again same: true help | doc:Research approach | doc:Agent approach | doc:HPC how-to | doc:Apps guide | memories
active is first: true
```

`npm run diagrams` was not run by me, since it writes files; the diagrams check above passes over the committed diagrams.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: violated, Spec 1 (the catalogue-press sentence). Everything else holds: `railPages` (`rail.ts:45-54`) adds the group's `docs:` entries through `withDocs` (`arrangement.ts:154-179`), `newPage` and `remade` record `Page.docs`, `giveDocuments` (`saved/docs.ts`) is called from `Workbench.svelte:256-259`, and the probes above give the Help page order, the Focus and sessions placements, one tab for a duplicate path, a closed tab kept closed and the active tab kept.
- 2: holds. `config-cache.ts:51-58` stamps both folders and the hub, `ABSENT` for a missing folder, `context.ts:547` passes `hub: () => local.hub` (and `local` is changed in place by `reloadLocal`, `context.ts:680-681`), and the head comment names both folders. G61's six new rows pass, and three of them fail on the unchanged tree (reproduced). The report's "Doc text" gives G61's lines.
- 3: holds. One card (`Personal.svelte:147` draws `ProjectCard` through `sideItem`), the project view by id (`selectors.svelte.ts` `projectOf`/`boardItemOf`), the editor over `sideFormFields`, `deposit={item.sideStatus === undefined}`, `ModeSwitch` and the list, the palette rows (`palette.ts:163-175`), `:goto`, the data fields (`manifests.ts` `folderHolds`), `api/docs`, `api/project-files`, the chat cwd and `docs/apps.md`. Related findings: Spec 2, Standards 7 and 9, Behaviour 1 and 2.
- 4: holds. `foldOpen`/`foldToggled` (`state/boards/focus.ts:381-400`), the `open`/`ontoggle` props and the `{#if open}` blocks in `CommandCenterView.svelte` and `Tasks.svelte`, and the catalog keys `focus.fold`/`focus.unfold`. CareerPanel is not touched.
- 5: holds. `startOf` gives no label (`folder-opener.ts`), `withoutFolderLabels` is applied in `keptEntry` (`kept.ts:113`) and in `parseLayout` for folder pages (`saved.ts:589`). Related findings: Proof 1 and Standards 3.
- 6: holds. The 3d checks above; the defaults are in `appearance.yml` and `options.yml`; `grep -rn 'assets/memories\|assets/wallpaper'` over tools/oculus (diagrams excluded), docs, .oculus and the hub's root docs finds nothing; HELP.md, DATA-MAP.md, `memories.test.ts`'s head comment and the README sentence all follow. The Settings listing asks for hidden entries (`Settings.svelte:128`, `{ hidden: true, ignored: true }`), so no change to `sources.ts` or `fs.ts` is needed.
- 7: violated, Spec 3 and Standards 2 (the rice comment and the slide comment). The declarations hold: the six tokens, the five slide sizes and the three ApprovalPanel tokens are exactly the diagnosis record's "Fix and test" diff, and check 3e is reproduced. The `tokens.css` comment says what the brief asks.
- 8: holds. The "Config layer" row matches `HUB_LIST` (`hub-names.ts:190-212`) and `mergeHub`'s comment (`merge.ts:312-320`) key for key; it agrees with the Settings row; lines 72 and 181-182 and the `.oculus/` row are updated; the new paragraph after the layer table is there.

Cases of the brief's "Cases":

- 1: met, my probe (Help, Research approach, Agent approach, HPC how-to, Data map, Apps guide, Memories). The tabs drawing their documents is for the look.
- 2: met by reading. `demo/.oculus/config/` holds no `layout.yml`, so `docs` is the engine's `[]`, and `withDocs` returns the node unchanged when `docs` is empty (`arrangement.ts:155`).
- 3: met, my probe (`focus: focus | doc:Focus note`; the `nopage` entry adds no tab).
- 4: met, `config-cache.test.ts` row fails on the unchanged tree and passes after.
- 5: met, row passes before and after.
- 6: met, row fails before and passes after.
- 7: met, row passes before and after.
- 8: met by reading (`ProjectCard.svelte:271` `openView('project', ...)`, `Editor.svelte:86-87` with `sideFormFields`, the existing side write); the look on a hub copy confirms it.
- 9: met by reading (`pin()` in `ProjectCard.svelte:257-264` writes through `writeManifest(item.id, ...)`; `sideCards` sorts a pinned card first).
- 10: met, `personal.test.ts` 'names its deck ...' and `Project.svelte:120` / `ProjectCard.svelte:204-216` by reading.
- 11: met by reading (`palette.ts:163-175`, `CommandRows.svelte:77-83`).
- 12: met by reading (`PersonalState.mode`, `modeShape`, the `Table` branch in `Personal.svelte`).
- 13: met by reading (the `closed` list in the tab's instance state).
- 14: met by reading. The test proves the open-page half only (Proof 1).
- 15: met, checks 3d, plus the defaults read through `images.ts:322-341`.
- 16: not verifiable here. Check 3e is reproduced; the record's red command at the look on landing settles it.
- 17: met by reading `docs/DATA-MAP.md`, "A second hub", the "Config layer" row.
- 18: met by reading (`projectOfSide` builds from the record that `sideProject` makes with its findings).
- 19: met, `write.test.ts` "writes a second hub's side project in that hub's file and no other" passes, plus reading of `placeOf` and `renderDoc`'s `within`.
- 20: met by reading (`renderRepositoryDoc`, `listSideFiles`, the chat cwd at `chat.ts:739-741`, `contextText` carrying status, eli5, next, latest and folder, `showFolder` with `place.dir`); the commands and sessions drawing is for the look.
- 21: met, my `giveDocuments` probe.
- 22: met, the first assertion of the `layout-saved.test.ts` row.
- 23: met, my probe (one tab for a duplicate path; `sessions: session-list | doc:Sess | terminal ...`).
- 24: met by reading (`projectOf` returns null, so `boardItemOf` returns null and the empty line shows).
- 25: met by reading (`Settings.svelte:128` lists hidden entries; `pathTrouble` and `offerFor` list `.oculus`).
- 26: met by reading (Focus keeps only `closed`, `foldToggled` keeps the other keys, `Band.svelte` and `CommandCenter.svelte` write to the instance of the opened view).

## 1. Spec

- `src/lib/state/workbench/layout/open/opening.ts:295-305` (unchanged by the diff): `const existing = findView(tree, view, stateId(state));` searches only the host page's tree. What is wrong: item 1 says "A press on a catalogue document row (h3 to h6) while a page holds that document shows that tab, never a second one". No change in the diff and no line of the report addresses that sentence, and the existing opener looks only on the page the reader is on. Failure scenario: the reader is on the Focus page and presses `h` then 4 (HPC how-to), or the catalogue row while Focus was the page before System. The Help page now always holds HPC how-to, yet a second HPC how-to tab opens on Focus. If the brief meant only the page the reader is on, the existing behaviour meets it and this is no finding; the sentence would then add nothing new, which suggests it meant any page. Verdict: item 1 violated.
- `src/lib/views/boards/entry/Entry.svelte:123`: "`const chosen = $derived(instanceChoice(instanceState(instance.id), 'doc', names));`", with its local `pick` removed. What is wrong: no item asks for a change to the entry page; this moves a working helper so that it can be shared with `Project.svelte`. The behaviour is the same by reading. Failure scenario: a reviewer of a later step sees the entry view in this step's diff with no item behind it; the cost is small. Verdict: none.
- `src/lib/themes/themes.css:729`: "`/* Terminal-ish rather than pixel-art: square corners, ...`". What is wrong: the brief's item 7 asks that the rice comment state the rice shape "as plain statements, with no contrast construction"; the first line keeps the "X rather than Y" construction. Failure scenario: the comment stays as the brief and `agents/spec.md` "The working rules that bind every package" (Prose) forbid. Verdict: item 7 violated (with Standards 2).

## 2. Proof

- `tests/state/workbench/layout/saved/layout-saved.test.ts:255,271`: the kept layout's folder is `{ root: 'hub', path: 'projects/beta' }` and its expectation is `{ root: 'hub', path: 'projects/alpha', label: 'alpha' }, ...`, unchanged. What is wrong: the title says it "takes the folder name off the Files and LaTeX tabs of ... a kept layout". The kept half asserts only that a label differing from the kept folder's name stays. With `withoutFolderLabels` taken out of `keptEntry` (`kept.ts:113`), the kept assertion still passes; only the open-page half fails on the unchanged tree. Failure scenario: a later change that drops the call in `keptEntry` keeps this test green, and a reopened closed workbench reads its folder name again (case 14's second clause). Verdict: none (case 14 is met by reading).
- Report, DONE / NOT DONE row "history words": "one hit, `src/hooks.server.ts` ...". What is wrong: the grep's word list leaves out words that `agents/spec.md` "What every package obeys" names ('before', 'still', 'always', 'as before'). My grep of the added comment lines finds three hits that it misses (Standards 1). Failure scenario: the orchestrator takes the report's single judged hit as the whole and lands the history words. Verdict: none.
- Report, "Hub text reworded by hand", the `docs/DATA-MAP.md` `layout.yml` row: the report gives the after text as "...; the Apps guide and Memories come from oculus's own list". The file (`docs/DATA-MAP.md`, the hub layer table) reads "...each an entry with `group: help`; the Apps guide and Memories are tabs of oculus's own arrangement of the Help page and take no entry". What is wrong: the brief asks for each hand-reworded hub line before and after, and the report's after is not the file's text. No decision rests on the wording, but the orchestrator checks the hub text against these lines. Failure scenario: the orchestrator reads a sentence that is not on disk. Verdict: none.

## 3. Standards

- `src/lib/state/workbench/navigation/arrangement.ts:166`: "`... is returned as it is, so parseArrangement refuses it as before.`". `src/lib/state/workbench/layout/saved/kept.ts:5-7`: "`... so a workbench saved before those tabs went unlabelled reads Files and LaTeX like a new one.`". `src/lib/state/workbench/layout/model.ts:123-124`: "`a page saved before it was recorded has none`". What is wrong: `agents/spec.md` "What every package obeys", the rule on history in comments ('before', 'as before', wording that compares with an earlier state). The second and third describe the code as it was before this step. Failure scenario: a reader after the next change cannot tell which "before" is meant, and the comment ages into a falsehood. Verdict: none.
- `src/lib/themes/themes.css:730-731`: "`The seven type scale steps and the size tokens sit 1 px below their VS Code values`". `src/lib/themes/slide.css:21-22`: "`each times 12/13 and rounded, as the type scale steps of `body.rice` are`". What is wrong: both comments are false. `--fs-xl` is 16px in `tokens.css:140` and 14px under rice, `--fs-2xl` is 20 and 16, `--fs-3xl` is 26 and 20, so the steps are one step down, not 1 px, and they are not the design sizes times 12/13 (16 times 12/13 rounds to 15, not 14). This breaks `agents/spec.md`'s rule that a sentence or comment the change makes false is a defect. Failure scenario: a theme author follows the comment, sets a new rice step at 1 px below, and breaks the "one step down" scale. Verdict: item 7 violated.
- `tools/oculus/DESIGN.md:476`: "`... and LaTeX `{ root, path, label }`) and ...`". The same bullet now also says "The Files and LaTeX tabs of a workbench carry no label". What is wrong: `folder-opener.ts` now gives LaTeX `{ root, path }`, and the bullet contradicts itself. This breaks `agents/spec.md`'s rule on a sentence the change makes false. Failure scenario: a builder writes a LaTeX folder-only state with a `label`, and the tab is named by the folder again. Verdict: none (item 5's code holds).
- `src/lib/shell/Workbench.svelte` grows from 520 lines at the base to 527 (`wc -l` of the base and worktree copies). What is wrong: `agents/spec.md` "What every package obeys" holds a component at or under 520 and says a file the step changes that would pass it is split by concern in the step. The report lists 527 without saying so. `size.test.ts` passes only because it refuses at 540. Failure scenario: the next step that touches the shell's workbench meets a component past its line with no room left. Verdict: none.
- `tools/oculus/HELP.md:56`: "`The Files and LaTeX tabs of a workbench are named Files and LaTeX, not by the folder.`". `src/lib/state/workbench/layout/saved/kept.ts:58`: "`Whether a workbench names this view's tab by the view and not by the folder.`". What is wrong: the contrast construction that `agents/spec.md` "The working rules that bind every package" (Prose) bans. Failure scenario: none functional; the text stays against the prose rule. Verdict: none.
- `src/lib/state/boards/board/personal.ts:4` (83 columns, the next word "the" fits) and `src/lib/themes/tokens.css:133` (83 columns, the next word fits): comment lines inside a sentence end short. What is wrong: `agents/spec.md`, "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short". Failure scenario: none functional. Verdict: none.
- `src/lib/state/boards/board/personal.ts:210-214,252`: "`The people and projects a side project's card links to: its `collaborators:` as people ...`" and the caller "`related: sideLinks(card.project, snapshot).related ?? []`". What is wrong: the function still joins the people names for every card, but its only caller reads `.related`, and its comment describes a use it no longer has. This is code larger than its job (`agents/spec.md` "The principles every package is judged on", YAGNI). Failure scenario: a reader edits the people half of `sideLinks`, expecting the card to change, and nothing changes. Verdict: none.
- `tests/state/workbench/layout/saved/layout-saved.test.ts`, describe 'a saved rail page and a saved workbench page', two new `it`s under G29. What is wrong: `agents/spec.md` "What every package obeys" says an entry keeps one test per unit, "written as a table where a unit has several outcomes". G29's unit `saved/` already has its table 'migrates every page, ...', and the two new outcomes are separate tests rather than rows of it. Failure scenario: G29 grows a test per step instead of one table. Verdict: none.
- `tools/oculus/config/text/app.yml:29`: "`cmd_goto_hint: '<project id or side:slug>'`". What is wrong: HELP.md's Personal bullet says `:goto` opens a side project by `side:<slug>` or `root:<key>`, but the hint names only the first. Failure scenario: a reader with a repository side project does not learn from the hint that `:goto root:<key>` works. Verdict: none.

## 4. Behaviour

- `src/lib/views/boards/personal/Personal.svelte:141-155` with `ProjectCard.svelte:405`: "`<p class="next"><CodeText text={firstSentence(item.project.next, CARD_NEXT)} /></p>`". What a reader sees change on the Personal board:
  - Before, the collapsed side card drew the `latest` line, the whole `next` under a "Next" label, and the links.
  - After, `next` is cut to its first sentence (130 characters), and `latest` shows only on an expanded card or the project page (`CardDetails.svelte:64-66`).
  - A write outcome line now appears under the toolbar.
  The report's "User-visible changes" row for the Personal board lists the controls only. Failure scenario: at the look, the orchestrator does not know to check that a side project's `latest` has left the collapsed card, and Axel finds it missing with no booking. Verdict: none.
- `src/lib/server/machine/pty/latex/latex.ts:192` and `src/routes/api/(sessions)/terminal/+server.ts:31`: "`projectFor: (id) => projectOrSide(server.hub, id)`". What is wrong: the terminal route's LaTeX build by project id refused a side project id with `no-project` before. It now accepts a hub side project's id and builds under `side-projects/<slug>/manuscript`, while a repository side project's id stays refused. Neither change is stated in the report. Failure scenario: a LaTeX request with a hub side id now reaches a build folder that usually does not exist, and the refusal text changes from no-project to whatever the missing folder gives. Verdict: none.

## Declined to judge

- The look-only parts of cases 8 to 14, 16 and 18 to 26 (rendered cards, page, editor save, fold controls, tab names, wallpaper drawing). The look on TEST and on a scratch oculus settles them; I start no server or browser.
- Case 16's red command (`RED: 292 texts` before, GREEN after). It needs a browser; it is the orchestrator's at landing.
- Whether a workbench's window title (`shell/panes/workbench-title.ts`, the active tab's label) still reads the item's name, as item 5 requires, when the Files tab is the active main tab. It depends on which tab is "main" on screen, which only the look shows.
- `npm test` whole and `npm run test:landing`. They are not on the reviewer's list; they run once at landing. The report's whole-suite figure (`Tests 1152 passed | 244 skipped`) is not reproduced, and no decision rests on it.
- The report's quoted list of rewritten diagrams (`layer-views.svg channels.dot channels.svg writes.dot writes.svg`) does not match the 18 diagram files the diff changes. I did not chase it, since `diagrams.test.ts` passes over the committed diagrams (46 passed) and no decision rests on that list. I sampled `channels.dot` and `layer-state.dot`: both are consistent with the source changes (the Personal view no longer reads the portfolio channel directly; one more data import each from state/client, state/workbench, state/boards, state/forms and state/shared).
- Point 2 of the orchestrator's list, judged here since it is a judgment and not a finding:
  - The `boundaries.test.ts` entry `data/snapshot/normalise-parts/as-project` follows the allowlist's own mechanism. A named data module is added with a paragraph giving its reason, and the module is used by both layers (server: `hooks.ts`, `project-files.ts`; state: `personal.ts`, `selectors.svelte.ts`, `schema.ts`, `hubs.ts`). It is a real single shape, not an exemption.
  - One remark: the module lives under `snapshot/normalise-parts/`, and its own head comment says it is never part of the snapshot, so a home under `data/helpers/` would match its concern better.
  - The removed `allow-duplication.txt` entry is required: `duplication.test.ts` "holds every entry of both lists to a reason" fails on a stale entry, and the clone is gone because the two props types are now `SectionProps` in `rows.ts`.
- Point 1, the files outside the write list. Each serves an item, except `Entry.svelte` (Spec 2):
  - `normalise-parts/{as-project,folder,personal}.ts` and `normalise.ts` serve item 3's data.
  - `server/content/docs.ts`, `project-files.ts` and its route, the docs route and the terminal route, `chat.ts` and `latex.ts` serve item 3's documents, file box and Ask (with Behaviour 2).
  - `state/forms/schema.ts` serves item 3's editor, and `state/shared/page/hubs.ts` re-exports `placeOf` for the views.
  - `layout.svelte.ts`, `layout/{index,instance,model}.ts`, `open/float/pages.ts`, `saved/{saved,docs,kept}.ts`, `navigation/pages.ts` and `Workbench.svelte` serve items 1 and 5. `arrangedPages` moves code out of the 877-line `layout.svelte.ts`.
  - `tex-root.svelte.ts` is a head comment made true by item 5, and `Projects.svelte` takes the shared `ModeSwitch`.
  - The test fixtures and the two tree-check files are needed.
- Point 8, the builder's `git -C . status`. The report says it read only; nothing in the diff or in `git status --short` shows a change from it, so it is not noted under Standards.

Reviewer usage: a7d96fd7cc9f172c5, claude-opus-5-5, 375,724 tokens, 109 tool uses, 27.5 min (from the completion notice).
