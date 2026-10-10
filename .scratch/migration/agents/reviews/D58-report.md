Not done in repair round 1: the test rows that rulings 1 and 2 ask for (`openingOf` and `fileOfTab`). No entry of `agents/guarded.md` covers either function (`grep -rn -e openingOf -e fileOfTab -e shownFileOfTab -e tabCrumbs -e shownTabPath -e activeLabel -e doc-link tests` prints nothing, exit 1), and spec.md line 57 says a step that needs a new entry stops and asks Axel and writes no test until he has ruled; both are checked by the quoted runs below instead. Everything else in the nine rulings is done.

Everything in the brief is done. Paths outside the write list were needed and are named in the file table and in 'Repair round 1'.

## Open items of the state file, verbatim

`orchestrator-state.md` line 144, under 'Open items': `None.`

## The cases' first run on the unchanged tree

Every route run below calls `handleDocs` from a scratch script outside the worktree tree (`run.mjs` in the session scratchpad) with `new Request('http://127.0.0.1:8811/api/docs?<query>')` and a `DocTarget` of `{ hub, engine, config }`; the printed fields are status, then the answer without `html`, `headings`, `parts` and `frontmatter`, then the size of the html, the number of headings and the number of parts. The page cases are read from the base copy (`.agents/worktrees/D58-base/tools/oculus/`) and, for the link resolver, run from a copy of the base `doc-link.ts`. No case is one the brief's own rules get wrong; no ruling was needed.

Cases 2, 3, 4 and 10, this hub as the hub (`node run.mjs <tree> <worktree> <worktree>/tools/oculus <query>`), unchanged tree:

```
engine=docs/apps.md 404 {"error":"not a document this route serves: "} html 0 headings 0 parts none
manual=1 200 {"file":"/Users/axelfaes/workspace/research-hub/.agents/worktrees/D58/tools/oculus/HELP.md","path":"tools/oculus/HELP.md","manual":"tools/oculus/HELP.md"} html 149205 headings 20 parts none
hub=docs/DATA-MAP.md 200 {"file":"/Users/axelfaes/workspace/research-hub/.agents/worktrees/D58/docs/DATA-MAP.md","path":"docs/DATA-MAP.md","manual":"tools/oculus/HELP.md"} html 101564 headings 29 parts none
engine=DESIGN.md 404 {"error":"not a document this route serves: "} html 0 headings 0 parts none
hub=tools/oculus/DESIGN.md 200 {"file":"/Users/axelfaes/workspace/research-hub/.agents/worktrees/D58/tools/oculus/DESIGN.md","path":"tools/oculus/DESIGN.md","manual":"tools/oculus/HELP.md"} html 278357 headings 18 parts 14
```

- Case 2: unmet. The engine read does not exist; the request is answered by the project read's message.
- Case 3: the answer has no `engine` and no `engineAt`, and `path` is `tools/oculus/HELP.md`: unmet.
- Case 4: `path` and `manual` are as the brief says; the two new fields are absent: unmet only for the new fields.
- Case 10: `hub=tools/oculus/DESIGN.md` comes back with 14 parts, `engine=DESIGN.md` is a 404: the parts half holds today, the engine half is unmet.

Case 5, a scratch engine folder `eng1/` (copies of `HELP.md`, `DESIGN.md`, `docs/apps.md`, `docs/diagrams/`, a folder `docs/f.md/`, `node_modules/x/README.md`, `.scratch/x.md`, and `docs/out.md` as a link to `../../outside.md`) under a scratch hub `hub1/`, both in the session scratchpad, unchanged tree:

```
engine=../../docs/DATA-MAP.md 404 {"error":"not a document this route serves: "} html 0 headings 0 parts none
engine=/etc/hosts.md 404 {"error":"not a document this route serves: "} html 0 headings 0 parts none
engine=config/local.yml 404 {"error":"not a document this route serves: "} html 0 headings 0 parts none
engine= 404 {"error":"not a document this route serves: "} html 0 headings 0 parts none
engine=docs/none.md 404 {"error":"not a document this route serves: "} html 0 headings 0 parts none
engine=node_modules/x/README.md 404 {"error":"not a document this route serves: "} html 0 headings 0 parts none
engine=.scratch/x.md 404 {"error":"not a document this route serves: "} html 0 headings 0 parts none
engine=docs/f.md 404 {"error":"not a document this route serves: "} html 0 headings 0 parts none
engine=docs/out.md 404 {"error":"not a document this route serves: "} html 0 headings 0 parts none
engine=docs/apps.md 404 {"error":"not a document this route serves: "} html 0 headings 0 parts none
manual=1 200 {"file":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d58/eng1/HELP.md","path":null,"manual":null} html 149205 headings 20 parts none
```

- Case 5: every `engine=` row is answered 404 with the project read's message, so none names its own reason and the served row `docs/apps.md` is a 404 too. The line `manual=1 ... "path":null` also shows the first half of case 6: with the engine outside the hub the manual's `path` and `manual` are null.

Page cases, read on the base copy and run through the base link resolver (`docLinkOf`, from a copy of base `doc-link.ts`):

```
case 6 (engine outside the hub): manual answer path is null -> store reads "" ; link {"path":"","fragment":""}
case 7 (this hub): manual link from tools/oculus/HELP.md {"path":"tools/oculus/docs/apps.md","fragment":""}
case 7 guide ../HELP.md from tools/oculus/docs/apps.md {"path":"tools/oculus/HELP.md","fragment":""}
case 9 hub link from docs/DATA-MAP.md {"path":"docs/RESEARCH-APPROACH.md","fragment":""}
```

- Case 1: read, not run. Base `Doc.svelte:82-85` calls `followDoc(readDocs(pushed.config.docs), path, label)`; with the demo hub's `docs: []` (`grep -rn apps.md tools/oculus/demo` prints nothing) `followDoc` finds neither the path nor a label, `reading` is `''`, `shown` is null and `Doc.svelte:169-170` draws `t('doc.unlisted', path)`. Unmet.
- Case 6: base `Markdown.svelte:82` is `if (client === undefined || link.path === '') return;` and the resolver gives the empty path above, so the manual's link opens nothing. Unmet.
- Case 7: holds on the unchanged tree. This hub's list names the guide, `docState(entry)` gives the id `tools/oculus/docs/apps.md`, the arrangement tab has the same id (`config/layout.yml:93`), and `openView` activates the instance with that id (`src/lib/state/workbench/layout/open/opening.ts:225-229`); a hub document's link to `tools/oculus/HELP.md` equals the answer's `manual` and opens the Help view (base `Markdown.svelte:84`). It has to keep holding once the list entry is removed.
- Case 8: read. With the list lacking the guide and the saved tab's label `Apps guide` matching no entry, base `followDoc` returns `{ entry: null, moved: false }`, nothing restates, the tab draws `doc.unlisted`. Unmet.
- Case 9: holds on the unchanged tree (the resolver output above; base `Markdown.svelte:90-92` opens a hub doc tab). It has to keep holding.
- Case 11: holds on the unchanged tree: a list naming `tools/oculus/docs/apps.md` gives a catalogue row whose `docState` id equals the Help arrangement tab's id, so one tab. It has to keep holding once the arrangement id is `engine:docs/apps.md`, which the restate of item 6 does.

## DONE / NOT DONE

Last lines of the final runs, all taken after the last change (the last change is `HELP.md`; `npm run diagrams` ran after it, then `npm run test:quick -- <the 25 changed paths>`).

| Item | Status | Command and last line |
|---|---|---|
| 1 The route: `engine=` read, refusals, order `manual`, `engine`, `hub`, project, head comment, `MANUAL` and `renderManual` comments | DONE | `src/lib/server/content/docs.ts` (`engineFile`, `renderEngineDoc`, `handleDocs`); route run below |
| 2 The answer: `engine`, `engineAt`, path and manual in the engine's space, store reads both fields, `engineDocument(path)`, `DocState` and the `RenderedMarkdown` literal | DONE | `docs.ts` `answer`, `engineAtOf`, `manualInHub`; `docs.svelte.ts` `bodyShape`, `engineDocument`; `RenderedMarkdown.svelte:77-78` |
| 3 The tab: `engine: true`, id `engine:<path>`, `engineDocument`, label or last name, bar actions at `<engineAt>/<path>`, `catalogue.ts` `engineDocState` | DONE | `Doc.svelte`, `catalogue.ts`; read, look on landing |
| 4 The links: both spaces, manual first, climbing links read in the hub, `jump.ts` comments | DONE | `doc-link.ts` `openingOf`, `Markdown.svelte` `open`; scratch run quoted under 'Every host- or user-visible change' |
| 5 The arrangement | DONE | `node arr.mjs`: `{"root":{"kind":"pane","view":["help",{"view":"doc","state":{"id":"engine:docs/apps.md","path":"docs/apps.md","engine":true,"label":"Apps guide"}},"memories"]}}` |
| 6 Saved tabs and listed entries restated, closing into an open engine tab | DONE | `Doc.svelte` `engined`, `becomeEngine`; read, look on landing |
| 7 This hub's list | DONE | `.oculus/config/layout.yml`: four entries left; `diff` against the main checkout's file prints `13d12` and the removed row `  - { label: "Apps guide",                   path: tools/oculus/docs/apps.md,             group: help }` and nothing else |
| 8 The text: `doc.yml` gains `failed_engine`, file comment rewritten; `HELP.md`, `DESIGN.md`, `docs/DATA-MAP.md` | DONE | `config/text/views/sources/doc.yml:1,5`; `HELP.md:25-27` and `:390`; `DESIGN.md:493`; `docs/DATA-MAP.md:220,234` |
| 9 The test under G2 | DONE | `npx vitest run tests/routes/docs/docs.test.ts tests/checks/tree/boundaries.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/size.test.ts tests/checks/config/arrangements.test.ts --reporter=dot` last lines `Tests  37 passed (37)` (five files); on its own the file printed `Tests  1 passed (1)` |
| Verify 1: `npm run diagrams` then `npm run test:quick` | DONE | `diagrams exit 0`; `ok      vitest (28.1 s): Duration  24.24s (transform 69.53s, setup 0ms, import 80.36s, tests 6.79s, environment 226ms)`; `ok      svelte-check (21.2 s): 1791615696902 COMPLETED 455 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `ok      eslint (20.7 s)`; `ok      prettier (1.5 s): All matched files use Prettier code style!`; `ok      ASCII gate (0.4 s)`; last line `test:quick: 28.5 s (limit 45.0 s); every command passed` |
| Verify 2: the new test passes after the change | DONE | `npx vitest run tests/routes/docs/docs.test.ts --reporter=verbose`: `PASS |unit| tests/routes/docs/docs.test.ts > the engine read of the docs route > serves a Markdown file of the engine and refuses a path that leaves the engine, a link out of it and a file of another kind 590ms` and `Tests  1 passed (1)` (the reporter's check mark is written PASS here) |
| Verify 3: boundaries, comment-width, size, arrangements | DONE | `npx vitest run tests/routes/docs/docs.test.ts tests/checks/tree/boundaries.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/size.test.ts tests/checks/config/arrangements.test.ts --reporter=dot`: `Test Files  5 passed (5)`, `Tests  37 passed (37)` |
| Also run: diagrams, history and config tree checks | DONE | `npx vitest run tests/checks/diagrams tests/checks/source/history.test.ts tests/checks/config --testTimeout 0 --hookTimeout 0`: `Test Files  6 passed (6)`, `Tests  131 passed (131)` (before the last `HELP.md` edit; `tests/checks/source/history.test.ts` rerun after it: `Tests  3 passed (3)`) |
| Verify 3b: ASCII | DONE | `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md ../../docs/DATA-MAP.md ../../.oculus/config/layout.yml` printed nothing, `3b exit 1`; the spec's perl gate over `src tests config` printed nothing, `ascii gate exit 0`; the same grep over the other touched files printed nothing, `ascii grep exit 1` |
| Verify 3c: folder check, sizes, unused exports | DONE | `sh utils/folder-check.sh`, `folder-check exit 0`; `wc -l` in the files table; `sh utils/unused-exports.sh \| diff - .../D58-base/tools/oculus/unused-exports.txt` printed `unused-exports identical` |
| Verify 4: each test on the unchanged tree and after | DONE | below |
| Verify 5: new sentences against the list and sentence rules | DONE | below |
| Case 1, 6, 8, 11 on a scratch oculus, case 7 on this hub | NOT RUN here | page behaviour; a builder runs no page. Proof is the look on landing, described under 'Every host- or user-visible change'; the route half is run below |

**Verify 4, the new test on the unchanged tree.** The test was written first and run before any change to `docs.ts`:

```
npx vitest run tests/routes/docs/docs.test.ts --reporter=verbose
 FAIL |unit| tests/routes/docs/docs.test.ts > the engine read of the docs route > serves a Markdown file of the engine and refuses a path that leaves the engine, a link out of it and a file of another kind 233ms
   -> an engine inside the hub: expected 404 to be 200 // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

The table stops at its first served row on the unchanged tree. Each refusal row also fails there: the case 5 run above shows every `engine=` request answered with `not a document this route serves: `, which is none of the expected messages (for example `the path leaves the engine folder: ../other.md`), and the order row would read the hub for `engine=docs/guide.md&hub=other.md`. After the change the same case 5 inputs, run on the changed tree against the same scratch engine:

```
engine=../../docs/DATA-MAP.md 404 {"error":"the path leaves the engine folder: ../../docs/DATA-MAP.md"}
engine=/etc/hosts.md 404 {"error":"an absolute path is not inside the engine folder: /etc/hosts.md"}
engine=config/local.yml 404 {"error":"not a Markdown file: config/local.yml"}
engine= 404 {"error":"no engine document named"}
engine=docs/none.md 404 {"error":"no file at docs/none.md in the engine folder"}
engine=node_modules/x/README.md 404 {"error":"the path has a node_modules or dot segment: node_modules/x/README.md"}
engine=.scratch/x.md 404 {"error":"the path has a node_modules or dot segment: .scratch/x.md"}
engine=docs/f.md 404 {"error":"docs/f.md is a folder, not a Markdown file"}
engine=docs/out.md 404 {"error":"docs/out.md is a link that leaves the engine folder"}
```

This test is one that tests a behaviour the change adds. Read as written, it asserts each row's exact message, `status` 404 and, for the served rows, `engine`, `path`, `manual`, `engineAt` and a rendered heading, against two targets (the engine inside the hub, and the hub beside it with the engine outside it). A reader should note what it does not cover: the 304 path, the figure addressing and the diagram parts of an engine document (checked by the case 10 run below, not by the test), and `engineAt` through a link in the hub.

Edits to existing assertions, allow lists or predicates: none. The step changes no existing test file (`diff -rq` over `tests` prints only `Only in tests/routes/docs: docs.test.ts`). Tests and guarded entries made obsolete: none.

**Cases 2, 3, 4, 5, 10 after the change** (`run.mjs` as above, this hub as the hub, then the scratch hub with the engine outside it):

```
engine=docs/apps.md 200 {"file":"/Users/axelfaes/workspace/research-hub/.agents/worktrees/D58/tools/oculus/docs/apps.md","path":"docs/apps.md","manual":"HELP.md","engine":true,"engineAt":"tools/oculus"} html 59962 headings 20 parts none
manual=1 200 {"file":"/Users/axelfaes/workspace/research-hub/.agents/worktrees/D58/tools/oculus/HELP.md","path":"HELP.md","manual":"HELP.md","engine":true,"engineAt":"tools/oculus"} html 149459 headings 20 parts none
hub=docs/DATA-MAP.md 200 {"file":"/Users/axelfaes/workspace/research-hub/.agents/worktrees/D58/docs/DATA-MAP.md","path":"docs/DATA-MAP.md","manual":"tools/oculus/HELP.md","engine":false,"engineAt":"tools/oculus"} html 101675 headings 29 parts none
engine=DESIGN.md 200 {"file":"/Users/axelfaes/workspace/research-hub/.agents/worktrees/D58/tools/oculus/DESIGN.md","path":"DESIGN.md","manual":"HELP.md","engine":true,"engineAt":"tools/oculus"} html 279272 headings 18 parts 14
hub=tools/oculus/DESIGN.md 200 {"file":"/Users/axelfaes/workspace/research-hub/.agents/worktrees/D58/tools/oculus/DESIGN.md","path":"tools/oculus/DESIGN.md","manual":"tools/oculus/HELP.md","engine":false,"engineAt":"tools/oculus"} html 279272 headings 18 parts 14
engine=docs/apps.md (scratch hub, engine outside it) 200 {"file":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d58/eng1/docs/apps.md","path":"docs/apps.md","manual":"HELP.md","engine":true,"engineAt":""} html 59962 headings 20 parts none
manual=1 (scratch hub, engine outside it) 200 {"file":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d58/eng1/HELP.md","path":"HELP.md","manual":"HELP.md","engine":true,"engineAt":""} html 149205 headings 20 parts none
```

The html sizes of the manual differ between this hub (149459) and the scratch engine (149205) because `HELP.md` was edited by this step in the worktree and the scratch engine holds a copy of the base file. Case 2, 3, 4 and 10 are met: `engine`, `path`, `manual` and `engineAt` are as the brief gives them, `hub=docs/DATA-MAP.md` is unchanged but for the two fields, and `engine=DESIGN.md` has the same 14 parts as `hub=tools/oculus/DESIGN.md`. Case 5 is met by the refusal block above and by the test. Case 1's route half: a copy of `tools/oculus/demo` as the hub (`grep -rn apps.md` over the copy prints nothing) with the real engine answers `engine=docs/apps.md` 200 with `"engine":true,"engineAt":""` and a first heading `# Building an oculus app`.

**Verify 5, the new sentences.** There are no standards pages in this repository (`ls tools/oculus/docs` holds `apps.md` and `diagrams`); the rules read against are the hub's `CLAUDE.md` 'Writing docs' and the spec's prose rules: one line per bullet, ASCII, no em dash, no history, one name per thing. `HELP.md:25` was split into three bullets (the tabs and the guide, the `docs:` entries, the restate) so each stays short; `HELP.md:390` (the former line 388) changed one clause. `DESIGN.md:493` is one long bullet, as it was; it departs from the short-bullet ideal because it describes one mechanism in order (the two reads, the engine's space, the guide tab, link resolution, the guard), and splitting it would separate the guard from the read it guards; its neighbours at 491 and 495 are of the same form. The two `docs/DATA-MAP.md` table cells each gained one clause.

History-word grep over the lines this step added to code, comments, catalog and test (made from `diff` against the base copy, then `grep -niE '\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package)\b'` and a package-id and year pattern): the hits were `docs.ts` head comment 'checked ... before the file is opened' (order of operations inside the route, kept), `engineFile`'s doc 'Nothing is opened before every check on the name has passed' (order of operations, kept), `Doc.svelte`'s 'Before the config's first push the list is unknown' (runtime sequence, existing sentence, kept), and `Doc.svelte`'s 'still' in two rewrapped sentences (reworded away). The test rows were renamed 'the manual wins over engine' and 'engine wins over hub'. No package id and no date is added anywhere.

## The terms

The repository has no `docs/glossary.md` (`ls docs/glossary.md tools/oculus/docs/glossary.md` finds neither), so this step has no term to take from one.

## Files

`diff -rq` against the base copy over `src`, `tests`, `utils` and `config`, with `wc -l` after the last change. Rows marked OUTSIDE are not in the brief's write list.

| Path | Lines | Note |
|---|---|---|
| `tools/oculus/src/lib/server/content/docs.ts` | 781 | write list |
| `tools/oculus/src/lib/state/system/docs.svelte.ts` | 358 | write list |
| `tools/oculus/src/lib/views/sources/doc/Doc.svelte` | 310 | write list |
| `tools/oculus/src/lib/views/shared/prose/Markdown.svelte` | 293 | write list |
| `tools/oculus/src/lib/views/shared/prose/doc-link.ts` | 112 | write list |
| `tools/oculus/src/lib/views/shared/prose/jump.ts` | 128 | write list (head comment and `LinkFollower`'s comments) |
| `tools/oculus/src/lib/views/shared/prose/RenderedMarkdown.svelte` | 130 | write list (the `DocState` literal) |
| `tools/oculus/src/lib/views/system/help/Help.svelte` | 97 | write list (head comments) |
| `tools/oculus/src/lib/state/workbench/navigation/catalogue.ts` | 326 | write list |
| `tools/oculus/src/lib/state/workbench/navigation/pages.ts` | 605 | OUTSIDE: `fileOfTab` reads a doc tab's `path` as a hub path; see 'wrong or impossible' |
| `tools/oculus/src/lib/data/helpers/files/paths.ts` | 109 | OUTSIDE: `hasHiddenSegment`, the one rule for a dot or `node_modules` segment, used by the server's engine read and the page's `engineServes`; the views layer may not import `data/helpers/files/paths` (`tests/checks/tree/boundaries.test.ts` views row), so the page reads it through `catalogue.ts` |
| `tools/oculus/config/layout.yml` | 182 | write list (line 93) |
| `tools/oculus/config/text/views/sources/doc.yml` | 19 | write list |
| `tools/oculus/HELP.md` | 454 | write list (line 25 became lines 25-27; line 388 became 390) |
| `tools/oculus/DESIGN.md` | 592 | write list (line 493) |
| `docs/DATA-MAP.md` | 594 | write list (lines 220, 234) |
| `.oculus/config/layout.yml` | 12 | write list (line 13 removed) |
| `tools/oculus/tests/routes/docs/docs.test.ts` | 146 | new, write list |
| `tools/oculus/docs/diagrams/layer-server, layer-state, layer-views, layers (each .dot and .svg)` | 8 files | regenerated by `npm run diagrams`; `diff -rq` against the main checkout's `docs/diagrams` lists exactly these eight files |

`sh utils/unused-exports.sh` equals the base's list: the step first added `ENGINE_PARAM` and `renderEngineDoc` as exports with no importer outside `docs.ts`, and both are local to the file.

Grep for the names the step changes, over `src tests config docs HELP.md DESIGN.md README.md`: `grep -rn "hubDocument\|DocState\|docState\|docLinkOf\|LinkFollower\|renderManual\|MANUAL" src tests` has no reader of the changed shapes left unchanged: `Entry.svelte:125` and `Doc.svelte` call `hubDocument` as before; `Workbench.svelte:213` and `Catalogue.svelte:228` build `docState(entry)` for a listed hub document, which `Doc.svelte` restates when it lies in the engine folder; the one `DocState` literal outside the store is `RenderedMarkdown.svelte`. Documents that describe the changed behaviour, read and listed: `HELP.md:25-27` rewritten, `HELP.md:390` rewritten, `DESIGN.md:493` rewritten, `HELP.md:3` still true (the manual links the guide and the hub's documents open from the Help group), `DESIGN.md:82` and `:491` still true (the guide is still opened in oculus as Apps guide), `DESIGN.md:495` still true (the hub's own documents are the `docs:` list), `docs/DATA-MAP.md:220` and `:234` rewritten, `docs/DATA-MAP.md:365` still true, `tools/oculus/docs/apps.md` and `README.md` hold no statement about where the guide opens (`grep -n 'Apps guide' README.md docs/apps.md` prints nothing), head comments of `docs.ts`, `docs.svelte.ts`, `Doc.svelte`, `Markdown.svelte`, `doc-link.ts`, `jump.ts`, `Help.svelte`, `catalogue.ts` (head comment still true: the catalogue's documents are the `docs:` list), `pages.ts` `fileOfTab` rewritten.

## Judgment calls the brief left open

Each is reversible and is reported as a decision the orchestrator may reverse.

1. **`fileOfTab` takes the engine folder's place** (`pages.ts`, `docShape` gains `engine`). An engine tab's `path` is relative to the engine folder, so `fileOfTab(tab, engineAt)` places it at `<engineAt>/<path>` in the hub root when the caller passes a non-empty `engineAt`, and shows no file otherwise. `engineAt` comes from the manual's answer (`engineAtFor` of the selectors) and is never written into the tab's state. The guide tab keeps its breadcrumb, tab-menu file items, icon, hover path, Open Editors row and Timeline following on a hub that holds the engine folder.
2. **A link to a path the engine read never serves** (a dot or `node_modules` segment) inside the engine folder opens as a hub document, as it did before the step (`openingOf`: the engine's space reads `.scratch/plan.md` in the hub at `engineAt`; the hub's space leaves it a hub path). The brief's rule 'any other target inside `engineAt` opens as the engine's document' would open a tab that the route refuses with a 404, a change for any hub document that links into `tools/oculus/.scratch/`.
3. **A link to a document that already has an open engine tab keeps that tab's words.** `openView` restates an open tab with the state it is given (`src/lib/state/workbench/layout/open/opening.ts:225-229`, `restate` replaces the state whole), so the manual's 'Apps guide' link would have wiped the label of the Help page's tab. `Markdown.svelte` `heldLabel` reads the label of the open tab with that id, and a `docs:` entry's label is used first when the hub lists the document. A link-opened engine document with neither has no label, so its pane title, tab strip name and window title are the last name of its path.
4. **`manual` of a hub document is `<engineAt>/HELP.md` when the file's real path lies outside the hub** (`manualInHub`), for an engine reached through a link in the hub, where `hubPath` gives null and a hub document's link to the manual would otherwise open an engine tab of `HELP.md` instead of the Help view. When the real path is in the hub the value is the one the brief gives (`tools/oculus/HELP.md` in the checkout).
5. **`engineAt` is the empty string when the engine folder is the hub itself** (relative path empty), the same value as 'not in the hub'. A hub that is the engine folder gets neither the engine-document restate nor the bar actions for the guide.
6. **The engine document's `path` is the file's real path relative to the engine's real folder**, as the hub read's `path` is real-path based; the manual's is the constant `HELP.md`. A link inside the folder to a file that is itself a link inside the folder resolves its own links from the target's folder.
7. **A figure of an engine document is addressed through the hub root** when the engine folder lies in the hub, joined with `engineAt`; with the engine outside the hub it is left as written, as the manual's is. This keeps the in-hub output of `engine=DESIGN.md` equal to `hub=tools/oculus/DESIGN.md` (both 279272 bytes of html).
8. **The refusal wording** (all literal English, inside `doc.failed_engine`): `no engine document named`, `not a Markdown file: <path>`, `an absolute path is not inside the engine folder: <path>`, `the path leaves the engine folder: <path>`, `the path has a node_modules or dot segment: <path>`, `no file at <path> in the engine folder`, `<path> is a link that leaves the engine folder`, `<path> is a folder, not a Markdown file`. The checks run in that order, and `docs/../.scratch/plan.md` is refused as a dot segment because the segment rule reads the normalised path.
9. **`doc.failed_engine`** is the new catalog key: 'The oculus document {0} could not be read: {1}'. It is the only new user-facing string; the `doc.yml` file comment now names both kinds of document.
10. **`hasHiddenSegment` in `data/helpers/files/paths.ts`** is one rule for the server and the page. The two older `inLibraryFolder` functions in `lsp-edit.ts` and `edits.ts` test folders only (they drop the last segment) and are not the same rule, so they were not changed.
11. **A hub tab asks for the manual's answer** as the brief says, and starts its own read in the same render, so a hub document tab draws `doc.loading` until the manual is answered and the two requests are out together. The manual is held in the query client and re-read with its entity tag; the cost of the extra wait on a first draw is not measured.
12. **Two things outside the worktree's rules, both read-only.** One git command was issued by mistake (`git -C . diff --stat -- .oculus 2>/dev/null | head -0`, in a command meant to inspect a file) with its output discarded; it changed nothing, and no other git command was run. Two `diff` commands read the main checkout without writing: `diff /Users/axelfaes/workspace/research-hub/.oculus/config/layout.yml .oculus/config/layout.yml` (to show the one-row change) and `diff -rq /Users/axelfaes/workspace/research-hub/tools/oculus/docs/diagrams docs/diagrams` (to list the regenerated diagrams), since the base copy holds no `.oculus` or `docs`.

## Every host- or user-visible change with its before and after

Link resolution of the page, run with the changed code through a scratch test that was removed afterwards (not a kept test; `openingOf` and `docLinkOf` with the answer fields given by hand):

```
case 6 manual outside hub | docs/apps.md from "HELP.md" -> {"path":"docs/apps.md","fragment":""} -> {"kind":"engine","path":"docs/apps.md"}
case 6 guide outside hub | ../HELP.md from "docs/apps.md" -> {"path":"HELP.md","fragment":""} -> {"kind":"help"}
case 6 guide outside hub, climbing | ../../docs/X.md from "docs/apps.md" -> {"path":"../docs/X.md","fragment":""} -> null
case 7 manual in this hub | docs/apps.md from "HELP.md" -> {"path":"docs/apps.md","fragment":""} -> {"kind":"engine","path":"docs/apps.md"}
case 7 hub doc to manual | ../tools/oculus/HELP.md from "docs/DATA-MAP.md" -> {"path":"tools/oculus/HELP.md","fragment":""} -> {"kind":"help"}
case 7 hub doc to guide | ../tools/oculus/docs/apps.md#the-manifest from "docs/DATA-MAP.md" -> {"path":"tools/oculus/docs/apps.md","fragment":"the-manifest"} -> {"kind":"engine","path":"docs/apps.md"}
case 9 hub doc to hub doc | RESEARCH-APPROACH.md from "docs/DATA-MAP.md" -> {"path":"docs/RESEARCH-APPROACH.md","fragment":""} -> {"kind":"hub","path":"docs/RESEARCH-APPROACH.md"}
guide climbs into the hub | ../../../docs/RESEARCH-APPROACH.md from "docs/apps.md" -> {"path":"../../docs/RESEARCH-APPROACH.md","fragment":""} -> {"kind":"hub","path":"docs/RESEARCH-APPROACH.md"}
guide climbs out of the hub | ../../../../x.md from "docs/apps.md" -> {"path":"../../../x.md","fragment":""} -> null
engine doc to a dot folder | .scratch/plan.md from "HELP.md" -> {"path":".scratch/plan.md","fragment":""} -> {"kind":"hub","path":"tools/oculus/.scratch/plan.md"}
doc outside the hub (empty path) | x.md from "" -> {"path":"","fragment":""} -> null
case 8 state {"id":"engine:docs/apps.md","path":"docs/apps.md","engine":true,"label":"Apps guide"}
```

The look on landing, per case. TEST page of Axel's own Chrome for this hub; a scratch oculus on port 8811 with HOME under `$TMPDIR` for the others.

- **Case 7, this hub.** View: the Help page. State: the Help page open with its three tabs (manual, Apps guide, Memories). Press the 'Apps guide' link near the top of the manual. Before and after: the guide tab becomes active, no fourth tab opens, and the tab keeps the name 'Apps guide'. Then press the manual link inside the guide (`../HELP.md`): the manual tab becomes active. Also, a hub document tab (Data map) holding a link to `tools/oculus/HELP.md`, if one exists, opens the manual.
- **Views catalogue, this hub.** View: System page, Views, Help group. Before: five documents (Research approach, Agent approach, HPC how-to, Data map, Apps guide). After: four; the Apps guide is not a row.
- **Guide tab breadcrumb, this hub.** View: the Help page's Apps guide tab. Before and after: the pane's breadcrumb reads `hub / tools / oculus / docs / apps.md`, the tab's right-click menu offers Copy Path, Copy Relative Path, Reveal, Show in Files, Open Timeline, the bookmark and Open in Program, its row stands in Open Editors, and the pane bar's star and Open in Program act on `tools/oculus/docs/apps.md`.
- **Case 1.** View: the Help page on a scratch oculus whose hub is a copy of `tools/oculus/demo`. Before: the Apps guide tab drew the `doc.unlisted` line naming `tools/oculus/docs/apps.md`. After: the tab draws the guide, first heading 'Building an oculus app'.
- **Case 6.** View: the Help page on a scratch oculus whose server is started with the engine at a path outside the hub. Before: the manual's 'Apps guide' link opened nothing. After: with the Help page's Apps guide tab open the link activates that tab, which keeps the name 'Apps guide'; with that tab closed the link opens a new tab named `apps.md` in the strip, the window title and the pane title. The guide's `../HELP.md` link makes the manual active. The Help page's own Apps guide tab draws on such a hub. An engine tab there shows no breadcrumb, no file items in its menu, and no star or Open in Program in the pane bar, since the folder has no place in the hub.
- **Case 8.** View: any page holding a saved tab `{ id: tools/oculus/docs/apps.md, path: tools/oculus/docs/apps.md, label: "Apps guide" }` (the hub's list no longer names the guide). Before: the tab drew `doc.unlisted`. After: it draws `doc.loading` for the moment the manual is answered, then the guide, and the layout file holds `{ id: engine:docs/apps.md, path: docs/apps.md, engine: true, label: "Apps guide" }` (key order follows the old map, then `engine` last).
- **Case 11.** View: a scratch oculus whose hub layer lists `tools/oculus/docs/apps.md`. Before: one tab for the catalogue row and the Help tab. After: the same, now by the restate: the row opens a tab that becomes the engine document and closes into the Help page's tab when that is open.
- **Every hub document tab** now draws the loading line until the manual's answer arrives (judgment call 11).

## Anything in the brief that was wrong or impossible

- **Item 3 names the pane bar only; the tab's file is also read by `fileOfTab`** (`pages.ts`), which feeds the breadcrumb (`strip/tab-crumbs.ts`), the tab menu (`strip/tab-menu-state.svelte.ts`), the tab icon (`strip/strip-tab.ts`), the hover path (`pane-view.ts`, `shownTabPath`), Open Editors and the Files view's Timeline, Outline and tree. Evidence: `grep -rn fileOfTab src` lists them. `fileOfTab` is a pure function of the tab's state and cannot know where the engine folder sits, so each caller passes the folder's place (`engineAt`) from the manual's answer; see 'Repair round 1', ruling 2.
- **Item 6 of the brief 'Paths this step writes' lacks `pages.ts` and `data/helpers/files/paths.ts`**; both were needed (above).
- **`docs/diagrams/` regenerates eight files**, not only the ones the brief expects; they follow the source (`diff -rq` against the main checkout).
- No premise of the brief failed to reproduce.

## Doc text

G2's three lines in `tools/oculus/.scratch/migration/agents/guarded.md`, as Z769 (a) words them. Each current line is printed as `grep -n`-style `<line>:<text>`; its replacement follows. The orchestrator applies them at landing.

**The sentence, with the exception.**

Current:

```
10:- G2. A path outside the configured roots is refused, except a file a language server named in an answer to the page, which that page alone reads, through the `lsp` channel.
```

Replacement:

```
- G2. A path outside the configured roots is refused, except a file a language server named in an answer to the page, which that page alone reads, through the `lsp` channel, and a Markdown document of the engine folder, which `api/docs` serves from inside that folder alone, never from `node_modules` or a folder whose name starts with a dot.
```

**The Code line, with the engine read added.**

Current:

```
11:  Code: `src/routes/api/` fs, ops, open, source, search, history, project-files, file/[root]; the `lsp:` channel: `src/lib/server/machine/lsp/uris.ts`, `src/lib/server/machine/lsp/library/read.ts` (the relay's read), `src/lib/server/machine/lsp/library/tokens.ts` and `src/lib/server/machine/lsp/library/rules.ts` (what may be named), `src/lib/server/machine/lsp/adapters/markdown/` (the handlers and the entry's `diagnostics` hook that keep a path outside the root from the Markdown server); the deck route `(docs)/deck` and the write route's `deck-slides` and `deck-edit` (`src/lib/server/edit/writes/config/deck/`); the page's edit a language server asks for: `src/lib/server/files/fs/lsp-edit.ts`, `src/lib/state/system/machine/lsp/edits.ts`; a `source:` channel, which is never polled for a path outside the roots: `src/lib/server/files/fs/open-files.ts`; the lint route: `src/lib/server/machine/runs/lint/routes.ts` (the file's path is resolved inside its root before any program starts); `src/lib/data/helpers/files/private-folders.ts` and `src/lib/state/system/config/config-files.ts` (`isPrivateFile`).; the folder Fix All: `src/lib/server/machine/runs/lint/writing/folder.ts` (the plan), `src/lib/server/files/fs/lsp-edit.ts` (the `writing-fix` write)
```

Replacement:

```
  Code: `src/routes/api/` fs, ops, open, source, search, history, project-files, file/[root]; the `lsp:` channel: `src/lib/server/machine/lsp/uris.ts`, `src/lib/server/machine/lsp/library/read.ts` (the relay's read), `src/lib/server/machine/lsp/library/tokens.ts` and `src/lib/server/machine/lsp/library/rules.ts` (what may be named), `src/lib/server/machine/lsp/adapters/markdown/` (the handlers and the entry's `diagnostics` hook that keep a path outside the root from the Markdown server); the deck route `(docs)/deck` and the write route's `deck-slides` and `deck-edit` (`src/lib/server/edit/writes/config/deck/`); the docs route's engine read: `src/lib/server/content/docs.ts`; the page's edit a language server asks for: `src/lib/server/files/fs/lsp-edit.ts`, `src/lib/state/system/machine/lsp/edits.ts`; a `source:` channel, which is never polled for a path outside the roots: `src/lib/server/files/fs/open-files.ts`; the lint route: `src/lib/server/machine/runs/lint/routes.ts` (the file's path is resolved inside its root before any program starts); `src/lib/data/helpers/files/private-folders.ts` and `src/lib/state/system/config/config-files.ts` (`isPrivateFile`).; the folder Fix All: `src/lib/server/machine/runs/lint/writing/folder.ts` (the plan), `src/lib/server/files/fs/lsp-edit.ts` (the `writing-fix` write)
```

**The Test line, with the new test added.**

Current:

```
12:  Test: fs: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; search: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'.; fs route: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops replace: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; open: `tests/routes/files/open.test.ts`, 'refuses a directory outside every configured root'; source: `tests/routes/files/source.test.ts`, 'refuses a path outside the named root' (its body with `create: true` included); source channel: `tests/server/files/open-files.test.ts`, the table 'the open files', its rows 'never polls or publishes a name out of the roots, a root nothing names or an empty path', 'takes no name that does not start with source:', 'publishes null for a file replaced by a link out of every root, and reads no file once the link is there', 'publishes null at the tick its root stops being served, and follows the file when it is served again', 'publishes a stat signature for a file over the read limit that nobody may read, and a new one when it grows', 'polls 200 names for one socket and 1,000 over the server, and no more', 'publishes the hash of the file at the first tick, and again only when the file changes' and 'closes the poll when the last socket drops the name, and hands the next one a fresh hash'; search plan: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'; history: `tests/routes/files/history.test.ts`, 'refuses a path outside the root and a request without its two parameters'; project-files: `tests/routes/files/project-files.test.ts`, 'answers 404 for an id the hub does not hold'; file/[root]: `tests/routes/files/file.test.ts`, 'has nothing for %s'; lsp: `tests/server/machine/lsp/uris.test.ts`, describe 'a document address', the rows 'is refused for <page address>'; deck read: `tests/routes/docs/deck.test.ts`, 'refuses a root nothing serves, a path that climbs out of the root, a link and an absolute path'; deck read over drafts: `tests/routes/docs/deck.test.ts`, 'refuses a draft read without the token and one over a root nothing serves or a path that climbs out'; deck-slides: `tests/routes/edit/deck-slides.test.ts`, 'refuses what the file or the roots do not allow, and writes nothing'; deck-edit: `tests/server/edit/deck-acts.test.ts`, 'refuses a path outside the roots in every act, and writes nothing'.; library: `tests/server/machine/lsp/library.test.ts`, describe 'a library file' (one table, one row per refusal code of the read, per path rule and per message refusal), and `tests/server/machine/lsp/uris.test.ts`, its four library rows; language server edits: `tests/server/machine/lsp/uris.test.ts`, 'drops a workspace edit whose documentChanges name a file the mapper has no address for, and turns the entries of one it can'; `tests/routes/replace/lsp-edit.test.ts`, 'refuses a path that climbs out, a root not served, and a path under a dot or node_modules folder, and writes nothing (case 7)'; `tests/state/system/lsp/edits.test.ts`, 'refuses a library file, a file under node_modules or a dot folder, and a path outside', 'refuses an entry that creates, renames or deletes a file' and 'refuses an edit that names a file open in a tab of another page, whether or not a tab of this page holds it'; lint: `tests/server/machine/runs/lint/lint-route.test.ts`, 'refuses %s before any program starts (G2)' for a path that climbs out of the root, a root no list names, a folder and a file that is gone, and 'lints a link inside the root as its target and refuses a link that leads out (G2)'; `tests/routes/replace/lsp-edit.test.ts`, 'refuses a file under the hub's secrets folder and one under the home folder's .oculus as outside, and writes and keeps nothing (case 30a)'; `tests/state/system/lsp/edits.test.ts`, 'refuses a file under the hub's secrets folder and one under the home folder's .oculus before any post (case 30a)'; the folder Fix All: `tests/routes/replace/writing-fix.test.ts`, 'refuses a path that climbs out of the root, a root not served, a file, and a link out of the root (G2)' (the plan), 'refuses a path out of the root, a link out of it and a root not served, naming the file (G2)' (the write).; Markdown server: `tests/server/machine/lsp/adapters/markdown-requests.test.ts`, describe 'the Markdown server may not be given the machine or the outside', the rows 'is refused for a file beside the root' and 'is refused for a link out of the root' (readFile), 'answers nothing for a file beside the root', 'answers nothing for a link out of the root' and 'answers nothing for the folder above the root' (stat), 'is refused for the folder above the root and for secrets' (readDirectory), 'are not made for a file beside the root' (watchers), and 'drops a mark whose path lies outside the root or under secrets, and words the others from the root' (the diagnostics hook); `tests/server/machine/lsp/uris.test.ts`, 'gives a document link to the page with no machine path in any field, takes its note back as the file address, and gives the target of its resolve with its #L fragment'.
```

Replacement:

```
  Test: fs: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; search: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'.; fs route: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops replace: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; open: `tests/routes/files/open.test.ts`, 'refuses a directory outside every configured root'; source: `tests/routes/files/source.test.ts`, 'refuses a path outside the named root' (its body with `create: true` included); source channel: `tests/server/files/open-files.test.ts`, the table 'the open files', its rows 'never polls or publishes a name out of the roots, a root nothing names or an empty path', 'takes no name that does not start with source:', 'publishes null for a file replaced by a link out of every root, and reads no file once the link is there', 'publishes null at the tick its root stops being served, and follows the file when it is served again', 'publishes a stat signature for a file over the read limit that nobody may read, and a new one when it grows', 'polls 200 names for one socket and 1,000 over the server, and no more', 'publishes the hash of the file at the first tick, and again only when the file changes' and 'closes the poll when the last socket drops the name, and hands the next one a fresh hash'; search plan: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'; history: `tests/routes/files/history.test.ts`, 'refuses a path outside the root and a request without its two parameters'; project-files: `tests/routes/files/project-files.test.ts`, 'answers 404 for an id the hub does not hold'; file/[root]: `tests/routes/files/file.test.ts`, 'has nothing for %s'; lsp: `tests/server/machine/lsp/uris.test.ts`, describe 'a document address', the rows 'is refused for <page address>'; deck read: `tests/routes/docs/deck.test.ts`, 'refuses a root nothing serves, a path that climbs out of the root, a link and an absolute path'; deck read over drafts: `tests/routes/docs/deck.test.ts`, 'refuses a draft read without the token and one over a root nothing serves or a path that climbs out'; deck-slides: `tests/routes/edit/deck-slides.test.ts`, 'refuses what the file or the roots do not allow, and writes nothing'; deck-edit: `tests/server/edit/deck-acts.test.ts`, 'refuses a path outside the roots in every act, and writes nothing'; engine read: `tests/routes/docs/docs.test.ts`, 'serves a Markdown file of the engine and refuses a path that leaves the engine, a link out of it and a file of another kind'.; library: `tests/server/machine/lsp/library.test.ts`, describe 'a library file' (one table, one row per refusal code of the read, per path rule and per message refusal), and `tests/server/machine/lsp/uris.test.ts`, its four library rows; language server edits: `tests/server/machine/lsp/uris.test.ts`, 'drops a workspace edit whose documentChanges name a file the mapper has no address for, and turns the entries of one it can'; `tests/routes/replace/lsp-edit.test.ts`, 'refuses a path that climbs out, a root not served, and a path under a dot or node_modules folder, and writes nothing (case 7)'; `tests/state/system/lsp/edits.test.ts`, 'refuses a library file, a file under node_modules or a dot folder, and a path outside', 'refuses an entry that creates, renames or deletes a file' and 'refuses an edit that names a file open in a tab of another page, whether or not a tab of this page holds it'; lint: `tests/server/machine/runs/lint/lint-route.test.ts`, 'refuses %s before any program starts (G2)' for a path that climbs out of the root, a root no list names, a folder and a file that is gone, and 'lints a link inside the root as its target and refuses a link that leads out (G2)'; `tests/routes/replace/lsp-edit.test.ts`, 'refuses a file under the hub's secrets folder and one under the home folder's .oculus as outside, and writes and keeps nothing (case 30a)'; `tests/state/system/lsp/edits.test.ts`, 'refuses a file under the hub's secrets folder and one under the home folder's .oculus before any post (case 30a)'; the folder Fix All: `tests/routes/replace/writing-fix.test.ts`, 'refuses a path that climbs out of the root, a root not served, a file, and a link out of the root (G2)' (the plan), 'refuses a path out of the root, a link out of it and a root not served, naming the file (G2)' (the write).; Markdown server: `tests/server/machine/lsp/adapters/markdown-requests.test.ts`, describe 'the Markdown server may not be given the machine or the outside', the rows 'is refused for a file beside the root' and 'is refused for a link out of the root' (readFile), 'answers nothing for a file beside the root', 'answers nothing for a link out of the root' and 'answers nothing for the folder above the root' (stat), 'is refused for the folder above the root and for secrets' (readDirectory), 'are not made for a file beside the root' (watchers), and 'drops a mark whose path lies outside the root or under secrets, and words the others from the root' (the diagnostics hook); `tests/server/machine/lsp/uris.test.ts`, 'gives a document link to the page with no machine path in any field, takes its note back as the file address, and gives the target of its resolve with its #L fragment'.
```

## Repair round 1

### Open item

1. A guarded entry for the page rules `openingOf` (`src/lib/views/shared/prose/doc-link.ts`) and `fileOfTab` (`src/lib/state/workbench/navigation/pages.ts`) would let them have the table rows rulings 1 and 2 ask for. G37's test (`tests/views/sources/bar-actions.test.ts`) renders each file view and checks what it hands the pane bar; it names neither function. Without an entry the rows are not written. Options: (a) a new entry "a document is opened by the rules of its space, and a tab names the file it shows", with `tests/views/shared/prose/doc-link.test.ts` and `tests/state/workbench/navigation/pages.test.ts` as tests (pros: both rules get rows; cons: a new entry is Axel's to approve); (b) no entry, the rules stay checked by the look and by a quoted run, as the brief does for views. Recommendation: (a), because both functions decide which tab opens and which file a menu acts on, and the refuter found a wrong row in each family by probing. Option (b) is the cheaper one.

### What changed, per ruling

| Ruling | Change | Check that shows it |
|---|---|---|
| 1 Spec 1, Behaviour 3, Standards 3 | `doc-link.ts:96`: the hub's space returns null for a target that climbs out of the hub (`climbsOut`), as the engine's space does with an empty `engineAt`. The comment at `doc-link.ts:87` ("Null for a link with no path and for one that leaves the hub") and `Markdown.svelte:22-23` are now true as written and are unchanged. | probe below |
| 2 Spec 2, Behaviour 1, Proof 2 | `fileOfTab(tab, engineAt = '')` (`pages.ts:480`), `shownFileOfTab(tab, engineAt = '')` (`pages.ts:502`), `isEngineDoc` (`pages.ts:458`), `engineDocName` (`pages.ts:466`), `tabFileFacts` held fact `engineAt`; `engineAtFor` (`selectors.svelte.ts:255`, listed at 130 and 581), `engineAt()` of the docs store (`docs.svelte.ts:364`); the callers listed below | probes below, `test:quick` |
| 3 Standards 2, Proof 1 | `docs.ts:600-603`: `engineFile` computes `at`, the real path relative to the engine's real folder, after the inside check and refuses a dot or `node_modules` segment of it with the message of the name check; the doc comments of `engineFile` and `renderEngineDoc` say so; `DESIGN.md:493` says "in the name or in the real path of a link inside the folder" | `tests/routes/docs/docs.test.ts:38-39,130-139` |
| 4 Standards 1 | `jump.ts:6-10` rewrapped, `doc-link.ts` on one line (line 8) | `comment-width.test.ts` |
| 5 Standards 5 | `catalogue.ts:9-14`: the head comment names the engine document helpers (`engineDocState`, `engineServes`, `engineRelative`, `engineHubPath`) | read |
| 6 Standards 6 | `docs.test.ts:40`: the config handed to the route is `portfolioConfigFrom({})`, so the test no longer calls `loadConfig(engineDir())`; the imports are gone and the head comment (lines 6-7) says the case reads no configuration file of the engine. Chosen because `handleDocs` takes the config as an argument and the engine read renders with the defaults. | docs test passes, below |
| 7 Behaviour 2 | `Doc.svelte:152-159`: `hub` is a derived of its own and `shown` reads it before the manual's answer is known | probe below |
| 8 Behaviour 4 | the case 6 bullet of 'Every host- or user-visible change' is rewritten (link activates the open guide tab; a new tab is named as ruling 2 gives it) | read |
| 9 Standards 4 | no git command was run in this round | none run |

Ruling 2, the callers, each with the mechanism: the caller reads `engineAt` through `client.selectors.engineAtFor(tab)` and passes it to `fileOfTab`.

| Place | File and line |
|---|---|
| breadcrumb | `strip/tab-crumbs.ts:38,40` (`tabCrumbs` takes `engineAt`), called at `PaneView.svelte:338` |
| tab menu file items, bookmark, Open in Program, Open Timeline, Reveal, Show in Files, Copy Path, Copy Relative Path | `strip/tab-menu-state.svelte.ts:70-79,125` (`tabFileFacts` gets `engineAt`; `tab-menu.ts` reads the facts and needed no change) |
| tab icon | `strip/strip-tab.ts:46` (`StripTabFacts.engineAt`, supplied at `PaneView.svelte:195`) |
| hover path | `pane-view.ts:497,499` (`shownTabPath`), called at `PaneView.svelte:183` |
| Open Editors | `OpenEditors.svelte:60,72` (`open-editors.ts` takes the file function and needed no change) |
| Timeline | `Timeline.svelte:78,90` |
| followed file tab for the Files view | `Files.svelte:111,129` |
| Outline | `Outline.svelte:86,93` |
| strip label | `strip-tab.ts:43`: the state's label, else the last name of the path (`engineDocName`) |
| window title | `workbench-title.ts:15`: the same |
| `doc:` word and registration comment | `config/text/views/sources/doc.yml:16` is `Document`; `Doc.svelte:2-4` says the view draws hub and engine documents; `Doc.svelte:56-69` describes the file actions |
| `Workbench.svelte`, `LatexItem.svelte`, `followed.svelte.ts`, `tex-root.svelte.ts`, `context.ts:417,737` | no change: they ask for source and file tabs, and `Workbench.svelte` calls `activeLabel` whose signature is unchanged |

Why `engineAt` is passed to `fileOfTab` and read through the selectors. `engineAt` comes from the manual's answer in the docs store (`docs.manual().engineAt`, empty while the answer is on its way, after a failure and when the folder lies outside the hub). The shell may take only the stores of `SHELL_STORES` (`tests/checks/tree/boundaries.test.ts:442-470`) out of the client object, and `docs` is not among them, while `selectors` is; so the selectors store holds `engineAtFor(tab)`, which returns the empty string for every tab that is not an engine document (and asks the server nothing for them) and `docs.engineAt()` for an engine document. `fileOfTab` stays a pure function of the tab and `engineAt`; there is no module-level state and `boundaries.test.ts` passes without an exemption. The saved tab state stays `{ id, path, engine: true, label? }`. The page never recomputes `engineAt` from the served roots.

Outside the extended write list, needed by ruling 2: `src/lib/state/client/selectors.svelte.ts` (`engineAtFor`; `createSelectors` takes the docs store's `engineAt` as a fourth argument) and `src/lib/state/client/context.ts:566` (passes `docs.engineAt`; 879 lines, as at the base). `src/lib/state/system/docs.svelte.ts`, `src/lib/state/workbench/navigation/catalogue.ts`, `HELP.md:27` and `DESIGN.md:493` are in the brief's list. `src/lib/data/helpers/files/paths.ts` is unchanged in this round.

### Before and after of each changed behaviour

Ruling 1. Link `../../x.md` in `docs/DATA-MAP.md`, hub space, `engineAt` `tools/oculus`. Before (the refuter's probe): `{"kind":"hub","path":"../x.md"}`, and a doc tab drawing "../x.md is not in the documents list". After (this round's probe, `probe-after`): `null`, the page stays where it is.

```
openingOf docs/DATA-MAP.md -> ../../x.md: null
openingOf docs/DATA-MAP.md -> ../x.md: {"kind":"hub","path":"x.md"}
openingOf docs/DATA-MAP.md -> RESEARCH-APPROACH.md: {"kind":"hub","path":"docs/RESEARCH-APPROACH.md"}
openingOf docs/DATA-MAP.md -> ../tools/oculus/HELP.md: {"kind":"help"}
openingOf docs/apps.md -> ../HELP.md: {"kind":"help"}
openingOf docs/apps.md -> ../../x.md: {"kind":"hub","path":"tools/x.md"}
openingOf docs/apps.md -> ../../../../x.md: null
```

The probe was a scratch test file under `tests/`, run with `npx vitest run` and removed afterwards; it is not a kept test. The first row is the input the refuter named.

Ruling 2. The guide tab on this hub, `engineAt` `tools/oculus`. Before: `fileOfTab` returned null for an engine tab, so the tab had no breadcrumb, no Copy Path, Copy Relative Path, Reveal, Show in Files, Open Timeline, bookmark or Open in Program in its menu, no file icon or hover path, no Open Editors row, and the Timeline did not follow it; the strip label and window title of an unlabelled engine tab read "Hub document". After (probe lines):

```
fileOfTab engine tab engineAt="tools/oculus": {"root":"hub","path":"tools/oculus/docs/apps.md"}
fileOfTab engine tab engineAt="": null
fileOfTab engine tab no argument: null
fileOfTab hub doc tab: {"root":"hub","path":"docs/DATA-MAP.md"} ; with engineAt {"root":"hub","path":"docs/DATA-MAP.md"}
shownFileOfTab engine: {"root":"hub","path":"tools/oculus/docs/apps.md"}
isEngineDoc true false; engineDocName apps.md null
tabCrumbs engineAt tools/oculus: ["hub","tools","oculus","docs","apps.md"]
tabCrumbs engineAt '': []
shownTabPath: ~/hub/tools/oculus/docs/apps.md ; empty: null
tabFileFacts engine bookmarked: false / no place: null
activeLabel unlabelled: apps.md ; labelled: Apps guide ; hub unlabelled: Document
stripTab unlabelled label=apps.md file=tools/oculus/docs/apps.md; labelled label=Apps guide
```

The store half, on the real client with a stubbed `fetch`:

```
non-engine tab: ""; fetches 0
engine tab before the answer: ""
engine tab after the answer: "tools/oculus"; asked ["/api/docs?manual=1"]
engine tab, manual refused: ""
engine outside the hub: ""
```

Where the folder lies outside the hub, or while the manual is on its way, an engine tab has no file, as before this round. The page was not run: how the strip, the menu and the Files sections look is for the look on landing (View: the Help page, Apps guide tab; State: this hub; what should differ: the breadcrumb `hub / tools / oculus / docs / apps.md`, the menu file items and the Open Editors row are present, as they are for any hub document).

Ruling 3. `docs/hid.md` (a link to `../.scratch/plan.md`) and `docs/nm.md` (a link to `../node_modules/pack/README.md`), both inside the engine folder. Before: both answered 200 and the hidden one's answer was named `.scratch/plan.md`. After: both answer 404 `{"error":"the path has a node_modules or dot segment: docs/hid.md"}` and `...docs/nm.md`. The fixtures link to the files the test already plants under `.scratch/` and `node_modules/pack/` instead of new `x.md` and `y/r.md` files.

Ruling 7. Before: `Doc.svelte` read `waiting ? guide : hubDocument(reading)`, so a hub tab asked for the manual, and its own read began only after the manual's answer, one after the other; the refuter measured the routes at `manual=1` 28.4 ms cold (12.8 and 6.5 ms warm) and `hub=docs/DATA-MAP.md` 12.1 ms over `handleDocs`, which in series add. After: both requests go out in the same render; the restate of item 6 still waits for the manual's `engineAt` (`waiting`, `engined`). The probe renders `Doc` on the real client with a stubbed `fetch` and lists the addresses asked:

```
hub tab, requests at the first render: []
hub tab, requests after the answers: ["/api/docs?manual=1","/api/docs?hub=docs%2FDATA-MAP.md"]
```

A hub tab that turns out to be an engine document (restated after the manual's answer) has also made one hub read of its hub path, which is not drawn. The page timing is not measured; the figures above are the refuter's route times.

Ruling 8. Case 6, as the refuter measured it. Before (as this report said): the link opens a tab named `apps.md`. As measured: with the shipped arrangement the Help page's Apps guide tab is open, the link activates it, and it keeps 'Apps guide'. A new tab, after the guide tab is closed, is named by the state's label or the last name of its path: `apps.md` in the strip (`stripTab`, `label=apps.md` above), the window title (`activeLabel` above) and the pane title; it was 'Hub document' in the strip and window title. The bullet in 'Every host- or user-visible change' says so.

### Tests

New test rows: the two rows of `tests/routes/docs/docs.test.ts` ('a link into a hidden folder of the engine', 'a link into a node_modules folder of the engine'), inside the existing table of G2's test. On the tree before this round's change the file ran:

```
 FAIL |unit| tests/routes/docs/docs.test.ts > the engine read of the docs route > serves a Markdown file of the engine and refuses a path that leaves the engine, a link out of it and a file of another kind 31ms
 -> a link into a hidden folder of the engine: expected 200 to be 404 // Object.is equality
 Test Files  1 failed (1)
```

The assertion stops at the first failing row, so the `node_modules` row has no failing line of its own on that tree; the refuter measured it at 200 there. After the change:

```
 PASS |unit| tests/routes/docs/docs.test.ts > the engine read of the docs route > serves a Markdown file of the engine and refuses a path that leaves the engine, a link out of it and a file of another kind 29ms
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

No existing assertion, allow list or predicate was edited (the file is new in this step). The test titles added carry none of the history words (`grep -i -E "before|used to|no longer|still|previously"` over the added lines of the changed files hits only "before the file is opened", "before the manual's answer is known" and "Before the config's first push", each a time order inside the code).

### Verification, from `tools/oculus` in the worktree

Check 1:

```
npm run diagrams: exit 0
test:quick: 41 changed file(s), from git since HEAD
test:quick: 27 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (1.8 s)
ok      svelte-check (6.7 s): 1791618400385 COMPLETED 455 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (15.5 s): Duration  11.63s (transform 23.67s, setup 0ms, import 34.98s, tests 7.96s, environment 151ms)
test:quick: 16.1 s (limit 45.0 s); every command passed
```

Check 2: the docs test line above (`Test Files  1 passed (1)`).

Check 3: `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/size.test.ts tests/checks/config/arrangements.test.ts` gave `Test Files  4 passed (4)`, `Tests  36 passed (36)`. The tests that exercise the changed tab and Doc code, `npx vitest run tests/shell/panes/strip/tab-menu.test.ts tests/views/sources/bar-actions.test.ts` (G28 and G37): `Test Files  2 passed (2)`, `Tests  15 passed (15)`. One run of the same list under the load of `sh utils/unused-exports.sh` reported 2 failed tests whose names were not captured; the reruns of it, alone and after that script, all pass.

Check 3b: `LC_ALL=C grep -n '[^ -~]'` over every file the step touched (the 26 changed `src` and `config` paths, `tests/routes/docs/docs.test.ts`, `HELP.md`, `DESIGN.md`, `docs/DATA-MAP.md`, `.oculus/config/layout.yml`) printed nothing; the perl gate over `src tests config` printed nothing (`perl gate exit 0`).

Check 3c: `sh utils/folder-check.sh`: `folder-check exit 0`. `sh utils/unused-exports.sh` against the base's `unused-exports.txt`: `unused diff exit 0` (no line added; `isEngineDoc` is imported by `selectors.svelte.ts`, and `engineDocName` by `strip-tab.ts` and `workbench-title.ts`). Line counts: context.ts 879, docs.ts 787, pages.ts 633, selectors.svelte.ts 608, PaneView.svelte 518, pane-view.ts 514, Timeline.svelte 409, Files.svelte 366, docs.svelte.ts 370, catalogue.ts 332, OpenEditors.svelte 327, Doc.svelte 313, docs.test.ts 158; none passes 880 (source) or 520 (component).

Check 4: the new rows' failing and passing lines are under 'Tests'.

Documents that describe the changed behaviour, read after the change: `HELP.md:27` rewritten (the engine tab acts as the file at the folder's place; its name), `DESIGN.md:493` rewritten (real-path segments; the tab's file by `engineAt`), `docs/DATA-MAP.md:220` still true (the cell names the `docs:` list and the guides on any hub), `Doc.svelte`, `pages.ts`, `strip-tab.ts`, `catalogue.ts`, `docs.svelte.ts` head comments rewritten, `Markdown.svelte:22-23` and `doc-link.ts:87` still true.
