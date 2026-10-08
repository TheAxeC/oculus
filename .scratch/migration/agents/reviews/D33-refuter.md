# Step D33 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D33, base 1439a44ec)

This report cites a page (the rules file, a standard, a skill's text) by its section. A finding in code keeps its `file:line`. Every path below is relative to `tools/oculus` in the worktree unless it is absolute.

## Verification (rerun by the reviewer)

```
$ (tools/oculus) PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh /Users/axelfaes/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (12.2 s)
ok      eslint (23.9 s)
ok      svelte-check (42.9 s): 1791452718440 COMPLETED 432 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (57.2 s): Duration  45.09s (transform 98.50s, setup 0ms, import 122.52s, tests 52.56s, environment 233ms)
test:quick: 58.3 s (limit 45.0 s); every command passed
test:quick: over the time limit
checks: 1 commands passed          (exit 0)
```
`npm run diagrams` was not run, because it writes files and a reviewer changes nothing. `npm run test:checks` includes `diagrams.test.ts`, which checks for stale diagrams in memory, and it passed, so the committed diagrams match the source.

```
npx vitest run <file>, each file alone (verify item 3, G32, G28, G60, G54, G12, G57):
manifests 1/1, registries 1/1, collections 1/1, career 2/2, feeds 1/1, docs 2/2, present 4/4, routes/docs/deck 3/3, personal 2/2, snapshot/normalise 1/1, source-disk.client 4/4, autosave.client 23/23, tab-menu 4/4, navigation/pages 5/5, arrangements 12/12, config 31/31, views/shared/explorer/root-drag 2/2: every one "Test Files 1 passed (1)"
npx vitest run tests/state/sessions/source.test.ts, six runs: each "Test Files 1 passed (1)  Tests 25 passed (25)"
npm run test:checks: "Test Files  17 passed (17)", "Tests  243 passed (243)"
sizes: 72 changed or new files under src, tests and config, read with wc -l; none is over 880 (source) or 520 (component). Workbench.svelte 519, context.ts 844, commands.svelte.ts 815
sh utils/folder-check.sh: exit 0
sh utils/unused-exports.sh: 371 lines. Against .agents/worktrees/D33-base/tools/oculus/unused-exports.txt (374 lines, of which 3 are knip error lines) the only differing line is layout/index.ts, which lacks `instanceFlag`. That is one export fewer, none added.
ASCII gate (spec.md form, over src tests config, ! -name local.yml): prints nothing, exit 0. The docs (DESIGN.md, HELP.md, docs/views.md, window.md, files-and-search.md) under LC_ALL=C grep '[^ -~]': nothing
yaml.safe_load over the 7 changed .yml: "yaml ok 7"
grep -rn "latex/Problems\|problemRows\|problemFile" src: exit 1. grep -rn "data-card={at}" src: exit 1. grep -rn "Marks the project-card control" src: exit 1
```

The report's node runs were reproduced under node 24 from scripts in my own scratchpad. The scripts import the worktree's modules; there is a runes shim and an alias loader in the scratchpad. Nothing in the worktree was written.
```
case 10 filterFiles: "boom" -> src/x.ts | "!boom" -> src/y.ts src/xy.ts node_modules/a/b.js | "**/node_modules/**" -> node_modules/a/b.js | "!**/node_modules/**" -> src/x.ts src/y.ts src/xy.ts | "src/?.ts", "src/[xy].ts", "src/{x,y}.ts" -> src/x.ts src/y.ts | "boom, !**/vendor/**" -> src/x.ts | "[abc", "{a," -> nothing, no throw | "" -> all four
case 11 activeOnly with active null -> []
case 12 packNumber: 0=0 999=999 1000=1K 1500=1K 9999=9K 10000=10K+
case 16 resolveKey: mac Cmd+Shift+M {"kind":"toggle-problems"}; non-mac Ctrl+Shift+M {"kind":"toggle-problems"}; mac Ctrl+Shift+M null; F8 {"kind":"next-problem","by":1}; Shift+F8 {"kind":"next-problem","by":-1}
case 21a tabFacts: endLine 1 < line 3 -> endLine 0, endColumn 0; endColumn without endLine -> 0; asked "x" -> 0, focus 1 -> true; {line 3, column 4, endLine 3, endColumn 2} -> kept as endLine 3, endColumn 2
case 23 problemMarkOf/problemWords: 2 errors {"count":2,"tone":"error"}; 12 warnings {"count":"9+","title":"12 problems in this file"}; infos only null; dir {"dot":true}
case 27 cardIds: [a,b,a,a] ["a","b","a:2","a:3"]; [] []; [a] ["a"]
case 28a fileOf over a scratch tree: sub/p.yml "sub/p.yml"; folder ""; missing ""; link leaving the hub ""; link inside the hub "inside.yml"; ../out/x.yml ""; outside absolute ""
case 13 copyText: tab-indented JSON with resource, owner, severity 8, message, source, startLineNumber, startColumn, endLineNumber, endColumn
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds for the store, its three sources, registration, the library hand-off, the fold and per-page creation. The evidence is `problems.svelte.ts`, `problem-sources.ts`, `client.ts:304-320`, `:457-470` and `:520-526`, `documents.svelte.ts` `listDiagnostics`, and `context.ts:646-674`. It is weakened by case 8 (Spec 5).
- 2: violated. The table view drops the rows of collapsed files (Spec 2). A single press in the table keeps the tab (Spec 3). The `entryAt` guard stands at the symptom (Proof 1).
- 3: violated, Behaviour 1: the toggle closes the tab and loses its filter. The keys, F8 in `chords.ts`, the walk and the keys sheet hold (node run above, `keys.ts:145-188`, `workbench-keys.svelte.ts:227-231`, `app.yml:12`).
- 4: holds. `status-items.ts:37-45` and `:66-74`, `StatusBar.svelte:96-108` and `:170-188`, `statusbar.yml:10` and `:43-49`, `status.ts:216-221`, the packNumber run.
- 5: holds. `draft.ts:57-72` and `:236-288`, `tab-state.ts`, `place.ts`, `source.svelte.ts:177` and `:722`, `Editor.svelte:177-213`, `commands.ts:22-62`, `types.ts:76-91`, `hosts.ts:139-151`, `services.ts:60-67`, the tabFacts run. Standards 6 covers a head comment.
- 6: holds. `command-marks.svelte.ts`, `extension.ts:45-50`, `tab-language.svelte.ts:72-74`, `model-sessions.ts:715`.
- 7: violated, Spec 1 and Standards 1. The strip tab reads the problems store through `tabProblem(facts.client, ...)` in place of facts built at `PaneView.svelte:182-198`. The Files tree and Open Editors hold.
- 8: holds. Both `Problems.svelte` files are deleted, the `latex.yml` keys are removed, `none_followed` is rewritten, `Main.svelte:124-133`, `context.ts:428-435` and `:449-451`, `builds.ts:76` and `:293`.
- 9: holds. `Audit.svelte:80-88`, `:131-153` and `:186-204`, `audit.ts:44-57`, `rules.ts:194-212`, every `add({` site (26 plus 6), `scan.ts:15-16`, `LaneCard.svelte:12-13` and `:109`, `tool-button.ts:107-110`.
- 10: holds. `Cards.svelte:20-24`, `:87-100` and `:152-158`, `Rollup.svelte`, `Editor.svelte:106-124`, `key-dom.ts:53-75`.
- 11: holds. The diff matches the hunks under "Fix and test" in `D33-diagnosis.md`, with the brief's extra clause (the first pane in document order) at `workbench-keys.svelte.ts:467-483`.
- 12: violated, Spec 4, Standards 2 and Standards 3. A false sentence in DESIGN.md, a wrong item order in window.md, and no per-page statement in views.md.

Cases of the brief's "Cases":

- 1: met by reading for the open: `Problems.svelte:143-151` and `place.ts:81-95` give a preview on detail 1 with `focus: false`, and a kept tab with focus on Enter (detail 0) or `onpressagain`. Whether the keyboard really stays in the view is not verifiable here; the look settles it.
- 2: met by reading (`problem-sources.ts:71-97`, `commands.svelte.ts` `hold`/`readUnplaced`). The page run is the look's.
- 3: met by reading (`latexProblems`, `line ?? 1`; `latexDiagnostics` reads only roots whose state is held).
- 4: met (`severityOf`, `problem-sources.ts:29-33`).
- 5: met by reading (`client.ts:520-526`; `listDiagnostics` gives one entry per language).
- 6: met (`problemTarget` returns null for root '').
- 7: met by reading (the fold is derived from `commandDiagnostics()`; status and view read one total). The count is the look's.
- 8: partial, Spec 5. Command rows and LaTeX rows of a removed root stay listed.
- 9: met by reading (`problems.svelte.ts:100-152`).
- 10: met (node run above).
- 11: met (node run; `Problems.svelte:260-263` draws "No results found with provided filter criteria." when rows are held).
- 12: met (packNumber run; the tooltip parts at `StatusBar.svelte:96-108`).
- 13: partial, Spec 2. Copy and Copy Message are met (copyText run). The table does not list the same rows as the tree once a file is collapsed.
- 14: met by reading (`client.ts:304-320` and `:463-468`; `problemTarget` handles a library).
- 15: met by reading (one store per `createClientState`). The look settles it.
- 16: met for the key function (node run). The toggle in a page and the desktop app are the look's.
- 17: met by reading (`stepProblem` and `walk`, `problems.svelte.ts:197-221` and `:296-303`; the walk reads `folded`, never a view filter).
- 18: met by reading (`context.ts:666-670`, `autosave.blurred(leaving)`). The look settles it.
- 19: met by reading (`nextAsked` `++asked`; `Editor.svelte:200-212` goes once per `asked`).
- 20: met by reading (`onwent` then `restateInstance(... wentTo)`, `Source.svelte:446-447`; `asked === wentTo` skips the go-to).
- 21: met by reading (`goingTo`, `hosts.ts:139-151`).
- 21a: met (tabFacts run; clamp at `commands.ts:27-41`).
- 21b: met by reading (`place.ts:91`). The look settles it.
- 22: met by reading (`command-marks.svelte.ts:52-61`).
- 23: met (marks run; `FileRow.svelte:107-119` joins ", ").
- 24: met by reading (`OpenEditors.svelte:217-257`, `TabFace.svelte:137-141`), subject to Spec 1 for the strip's path.
- 25: met by reading (`Latex.svelte` loses the section, `none_followed`, `Main.svelte:124-133`, `showProblems`; `filterFiles` filters the scope by root key).
- 25a, 25c, 25d: met by reading. 25b: not verifiable by reading for "opens the tab marked gone"; the look settles it.
- 26, 26a to 26e: met by reading of `Audit.svelte`'s `data-card`, `data-cursor` and the outline, with the shell's generic cursor. The DOM behaviour is the look's.
- 27: met (cardIds run).
- 28: met by reading for the place press, a row with no file, and no cursor. "Tab onto a mute, Enter opens the cursor row" is not verifiable by reading; the look settles it.
- 28a: met (fileOf run; site table at the report's lines).
- 29: met by reading (`LaneCard.svelte:109` `dataCardToggle`).
- 30: met by reading (`idOf` is unique by file:key, group and step path; `activateCursor` focuses and does not click).
- 30a: met for `problems`, `command`, the tab keys, `file` and the card ids (greps above). The owner literal is duplicated (Standards 7).
- 31, 32, 33: GREEN by the report's page runs, made before Z720. No page is run here; the look on TEST settles them.

## 1. Spec

1. `src/lib/shell/panes/strip/strip-tab.ts:42`: `const problem = tabProblem(facts.client, instance);`.
   - What is wrong: item 7 asked for `stripTab`'s facts to gain the file's problem counts, built at `PaneView.svelte:182-198`. The diff keeps `PaneView.svelte` unchanged and has the shell hand the whole client object to `tabProblem` in `state/workbench/navigation/pages.ts:407-415`, which reads `client.problems.fileCounts`. That is a substitute mechanism where the brief named a shape. It is also the boundary bypass in Standards 1.
   - Failure scenario: a later step that rules on what the shell may read (SHELL_STORES) finds the tab strip already depending on `problems` with no row naming it. Removing the store from the client, or renaming `fileCounts`, breaks the strip with no boundary test pointing at it.
   - Verdict: item 7 violated.
2. `src/lib/views/sources/search/Problems.svelte:118-120` and `:178-187`: `const rowEntries = $derived(entries.filter(... entry.kind === 'row'))`, with `entries = entriesOf(shown, closed)`.
   - What is wrong: the table's rows are built from the tree's entries, which leave out the rows of every file the reader closed or Collapse All closed. Item 2 asks for "View as Table" over the same rows, and case 13 asks that the table list the same rows as the tree.
   - Failure scenario: press Collapse All in the tree, then View as Table. The table draws no row at all, since `entries.length` is not 0, so the empty line is not shown either, though the store holds problems. Closing one file in the tree drops that file's rows from the table.
   - Verdict: item 2 violated; case 13 partial.
3. `src/lib/views/sources/search/Problems.svelte:272-278`: `onclick={() => show(problem, true)}`.
   - What is wrong: in the table a single press keeps the tab and puts the keyboard in the editor. Item 2 and Z716 N1 say a single press on a Problems row opens the preview with the keyboard kept in the view, and Enter or a double press keeps it.
   - Failure scenario: a reader walking the table with single presses gets one kept tab per file and loses the keyboard to the editor on every press, where the tree gives one preview tab.
   - Verdict: item 2 violated.
4. `docs/views.md:79-81` ("Problems"): the section has no sentence saying problems are per page or that a pop-out window lists its own.
   - What is wrong: item 12 asks for the section with "the defaults of item 2 stated, per page", and Z702 (13) asks for "Problems per page, stated in the guide". `docs/files-and-search.md:11` and `:17` name the tree and Open Editors decorations but not the tab strip, which item 12's `:9-13` asked for (views.md names the strip).
   - Failure scenario: a reader with a pop-out window sees fewer problems there than in the main window and finds nothing in the guide that says why.
   - Verdict: item 12 violated.
5. `src/lib/state/system/problem-sources.ts:71-97` and `:100-114`; case 8.
   - What is wrong: a removed served root's command rows are mapped by `tabOfFile` against the roots still served, so they stay listed under the path as written with root ''. Its LaTeX rows stay under the removed root's key, since nothing in `latex.svelte.ts` forgets a target when its root goes (`invalidate` at `:313-318` is the only `queries.forget`). Only the language-server rows go, through `#forget` when the models close. The report's row for case 8 is "reading ...; no run", and that reading does not show the command and LaTeX rows going.
   - Failure scenario: a root `ordo` with a failed LaTeX build and a command error is removed from the served roots. Both rows stay in the view and in the status count. The LaTeX row's press opens a source tab for root `ordo`, which is no longer served.
   - Verdict: case 8 partial.

Out-of-list paths (the reviewer's point 2), each judged:
- `config/text/views/sources/files.yml`: inside item 7, the decoration words.
- `state/sessions/latex/builds.ts` and `latex.svelte.ts`: inside item 8, Show Problems scoped to a root.
- `latex-state.ts`: inside item 8; `LatexIssue` lost its only outside reader.
- `state/sessions/source/source.svelte.ts`: inside item 5, the page counter.
- `state/sessions/source/place.ts`: inside items 2 and 5.
- `state/system/problem-sources.ts`: inside item 1, split for size.
- `state/workbench/navigation/registry.ts`: inside item 2, the tab badge keys.
- `pages.ts` `tabProblem`: inside item 7, but the substitute in Spec 1.
- `RootedTree.svelte`: inside item 7.
- `tab-language.svelte.ts`: inside item 6.
- `tests/views/shared/explorer/root-drag.test.ts`: open item 5's ruling (a).
- `package.json` and the lock are in the brief's write list; the report wrongly lists them as outside it.
- `state/sessions/terminal/commands.svelte.ts` `hold`/`readUnplaced`: inside item 1 and case 2, since the first output of a fresh run was dropped while its terminal was unlisted. One sharp edge is not reported: `UNPLACED_MAX` bounds the number of terminals but not the text held per terminal (`hold` concatenates every chunk and every scrollback whole). A terminal that is never listed, for example one closed while its pane still delivers output, accumulates its whole output until eight newer unlisted terminals push it out.

No change was found that no item asks for.

## 2. Proof

1. `src/lib/views/sources/search/problem-rows.ts:129-156` and `Problems.svelte:290`, `:296` and `:303`: `const GONE: Entry = { kind: 'row', id: '', ... }` and `return entries.at(at) ?? GONE;`.
   - What is wrong (the reviewer's point 5): a guard, where the cause belongs at its source. The comment claims "A list that shrinks asks for the rows it drew, at their old indexes, once more before it drops them". That would be a behaviour of `ui/tree/list/VirtualRows.svelte` (or of Svelte's keyed each over its stale window), which the report says is untouched and uninvestigated. If the claim is true, every other caller of VirtualRows indexes directly and would throw on the same shrink: `Changes.svelte:234` and `:243` (`group.rows[at]`, then `row.kind`), `Graph.svelte:425` and `:432` (`commits[at].hash`), `Console.svelte:164-166` (`rows[at].at`) and `Tree.svelte:308` and `:314` (`drawn[at]`). If it is false, the guard answers a cause nobody found. The guard also gives every past-end index the same key `''`. Svelte 5.57.1 throws `each_key_duplicate` for a repeated key in dev and prod alike (`node_modules/svelte/src/internal/client/dom/blocks/each.js:355-361`). So if the key function is ever asked for two past-end indexes in one pass, the guard swaps one throw for another.
   - Failure scenario: a filter typed that cuts the list from twenty rows to ten. If VirtualRows' each re-keys its stale window with the new `key`, ten stale indexes all answer `''` and the each block throws `each_key_duplicate`. If only the item bodies re-run, the guard hides the defect in the Problems view while staging the last files of a Changes group can hit the same past-end read.
   - Whether the stale read happens, and for which of the key and the body, is not settled by reading. A diagnosis of VirtualRows on a shrinking list settles it.

The test `tests/views/shared/explorer/root-drag.test.ts` (the reviewer's point 6) is not a Proof finding.
- It tests a behaviour the step preserves: `dragging.svelte.ts` is not in `git status`, so it is byte-identical to the base. The report claims a pass before and after, not a failure on the unchanged tree. My run on the worktree, whose `dragging.svelte.ts` is the base's, is "Tests 2 passed (2)".
- By reading, with the `mine` type check taken out of `ours()` (`dragging.svelte.ts:97-99`), the first test fails. The stale tree, still holding `cath`, would accept the other tree's drag over `ordo`: `overRoot` sets `dropEffect` to 'move' and draws the line, and `droppedRoot` writes `['cath','ordo']`. All three assertions (`dropEffect 'none'`, `dropEdge` undefined, `written []`) depend on the behaviour. The second test guards against blocking the tree's own drag. Both assert effects the module's handlers really run.

## 3. Standards

1. `src/lib/state/workbench/navigation/pages.ts:402-415`, called from the shell at `strip-tab.ts:42`.
   - What is wrong (the reviewer's point 4): this keeps the boundary regex green without keeping DESIGN.md's boundary in fact. The rule is "Boundaries" in DESIGN.md, the shell row, and `tests/checks/tree/boundaries.test.ts:404-427` (SHELL_STORES, "the stores a shell file may take out of the client object"); `problems` is not in it.
   - The regex `\bclient\.(\w+)` cannot follow a whole client handed on. The test's own comment names the one sanctioned case: badgeOf, "so that a view's own badge hook reads the view's own stores". `tabProblem` stretches that exception to a store the shell itself consumes to draw its own tab face. The shell's tab strip depends on the problems store as directly as a destructuring of `problems` would.
   - The status bar and F8 do keep the boundary: `StatusWords.problems` and `walkProblem` are fed by `+page.svelte`. The strip does not.
   - The new DESIGN.md passage (`DESIGN.md:475`) says "The shell does not name the store", which is true of the text and false of the dependency. The builder's report raises this as an architecture note. It is a rule of the checks that the diff satisfies only because the check cannot follow that path.
   - The two ways that end the cause are a `problems` row in SHELL_STORES with its reason clause, which widens an allow list and is the orchestrator's call, or a page-built count function handed to the strip as the status words are.
   - Failure scenario: a reader of the boundary test believes the shell cannot reach `problems`, and a refactor of the store's API breaks the tab strip with no boundary check pointing at it.
   - Verdict: item 7 violated (with Spec 1).
2. `DESIGN.md:475` (the new Problems passage): "every open of a place (a Problems row, a search hit, a reference, F8) goes through one function, `openPlace`".
   - What is wrong: `grep -rn "openPlace\b" src` finds one caller, `context.ts:669`, for the store's rows and F8. Search hits and references go through `openSourceFile` (`source-file.ts:15-20`), which calls `sourceFileState`, not `openPlace`. The diff makes the sentence false.
   - Failure scenario: a later step changes `openPlace`'s preview rule and expects search and references to follow. They do not.
   - Verdict: item 12 violated.
3. `docs/window.md:82`: "... the findings the Findings view lists (opens it), the problems item (...), the debug item ...".
   - What is wrong: the paragraph lists the left items in the order they are drawn, but `LEFT_ITEMS` (`status-items.ts:37-45`) draws `problems` before `findings`. DESIGN.md's status bar line says the same thing correctly.
   - Failure scenario: a reader looks for the problems item to the right of the findings item.
   - Verdict: item 12 violated.
4. `src/lib/shell/status/status-items.ts:26` ("Findings view's list, the snapshot's findings and the config", 63 columns), `src/lib/views/shared/latex/Main.svelte:6` ("limited to the root. Everything goes through the LaTeX store", 67 columns) and `src/lib/views/academic/latex/Latex.svelte:25` ("... (Commands, Structure, Math Symbols) so", 88 columns).
   - What is wrong: each comment was edited but not rewrapped as a paragraph at 100 columns; a line ends short inside a sentence. This breaks spec.md, "What every package obeys", the rule on edited comments.
   - Failure scenario: the next reader sees a ragged paragraph, and the next edit carries the ragged lines on.
5. `src/lib/views/sources/files/sections/OpenEditors.svelte:298-311`: the comment `/* The unsaved mark: the dirty glyph the tab draws ... */` now sits above the new `.problems` rule, and `.dirty` follows without its comment.
   - What is wrong: the diff makes a comment describe the wrong rule.
   - Failure scenario: a reader styling the unsaved mark edits `.problems`.
6. `src/lib/views/sources/source/status/tab-state.ts:7` ("an end before the start is none") and `draft.ts:59` ("an end before the start, names none").
   - What is wrong: `openedAt` drops an end only when `endLine < line`. My run shows `{line 3, column 4, endLine 3, endColumn 2}` is kept. The sentence overstates what the code does. The brief only asked for `endLine` before `line`, so the fix is either the sentence or a same-line column check.
   - Failure scenario: a reader relies on the comment for a same-line reversed range.
7. `src/lib/views/sources/search/Problems.svelte:2-3`: "Problems is the ninth view of the Explorer page's group".
   - What is wrong: `grep -rn "group: 'explorer'" -A1 src/lib/views` lists eight views (orders 0, 1, 2, 3, 5, 6, 7, 8), so the sentence is false.
   - Also: the owner literals `'command'` and `'oculus-latex'` are now each written twice (`problem-sources.ts:87` and `command-marks.svelte.ts:16`; `problem-sources.ts:105` and `latex-widget.ts:54`), against spec.md's "a rule exists once".
   - Failure scenario: a rename of one owner leaves the Problems rows naming the old one.
8. `tests/views/shared/explorer/root-drag.test.ts:19`: `(globalThis as unknown as Record<string, unknown>).Element = Box;`.
   - What is wrong: this is module-level global state in a test that is never restored. spec.md's "No globals" principle holds "in test fixtures and helpers too". Under `test:quick`'s `--no-isolate`, every later file in the same worker sees `Element` as `Box`.
   - The text is the patch Axel ruled to land (`X3e-root-drag-test.patch`, byte-identical by diff), so it is the orchestrator's call whether the ruling covers the global. `vi.stubGlobal('Element', Box)` with `vi.unstubAllGlobals()` in an `afterEach` would end it.
   - Failure scenario: a later test that relies on `Element` being undefined in node, or on a real `Element`, passes or fails depending on which worker ran root-drag first.
9. The builder's report, "Deviations with no effect" (the reviewer's point 3): one `git diff --stat`, one `git -C . --version` and one `git diff --no-index --stat /dev/null /dev/null`.
   - What is wrong: spec.md, "Where you work", says a builder runs no git command, read-only ones included. None of the three changed repository state; `git status --short` in the worktree shows only the step's files.
   - Also: the full list ran three times where spec.md's "Token discipline" asks for once after the last change, plus once more after a failure. Run 1 came before the last change.
   - Failure scenario: none to the tree. This is a rule breach to note.

## 4. Behaviour

1. `src/lib/shell/keys/keys.ts:174-188` (`toggleView`), used by `workbench-keys.svelte.ts:227-230` and `StatusBar.svelte:177`.
   - What is wrong: "hide" is `layout.closeInstance(active.id, page)`, and `closeInstance` (`state/workbench/layout/instances.ts:281-291`) calls `access.ui.clearInstanceState(id)`. So Cmd+Shift+M pressed twice, or two presses on the status item, throw away the view's filter text, its Show toggles, its root scope and View as Table, and the next press opens a fresh view.
   - Item 3 asks for VS Code's `workbench.actions.view.toggleProblems`, which hides the panel and keeps its filter. The report's user-visible table says only "toggles the view", with no before and after for the lost state.
   - Failure scenario: a reader filters to `!**/node_modules/**`, hides the view with Cmd+Shift+M, shows it again and finds the filter gone.
   - Verdict: item 3 violated.
2. `Problems.svelte:272-278`: the table's press behaviour (Spec 3) is not in the report's user-visible table.
3. `Problems.svelte:118-120`: the collapsed-file gap in the table (Spec 2) is not in the report's user-visible table.

## Declined to judge

- Every case that only a page shows: whether the keyboard really stays in the view on a single press (case 1), the gone tab of case 25b, Tab onto a mute control and then Enter (case 28), the outline drawing and the terminal theme (26e), the Settings focus on a checkbox (30), and cases 31 to 33. No page was run, per Z720 and my brief. Each is the look on TEST at landing. The report's case table names a view, a state and what to see for each, except cases 1, 2, 7, 9, 10, 11, 13 and 16 to 24, whose "Look on landing" column says "none open" because a pre-Z720 page run is quoted. Those runs cannot be rerun here.
- The red full-list run at `tests/state/sessions/source.test.ts:466` (the reviewer's point 1): I find no path by which the diff causes it.
  - The file passed in six runs alone.
  - The row builds the source store with `createSource` directly (`source-server.ts:152`), with no client context, so the problems store and every other `context.ts` change are not on its path.
  - The diff's two changes to code on that path are `let asked = Date.now()` and `nextAsked` in `source.svelte.ts`, which the row never calls. `draft.ts`'s changed `placed`, `sourceTabState` and `libraryTabState` are called by neither `source.svelte.ts`, `disk.svelte.ts` nor `source-server.ts` (grep printed nothing).
  - The one shared state the diff adds to a `--no-isolate` run is root-drag's `globalThis.Element`. Nothing in `source.svelte.ts`, `disk.svelte.ts` or Svelte's reactivity names `Element`.
  - The failure shape (the draft still "one\n" with the old base) is the outside change's re-read not taken in when `settled()` returned. `settled()` (`source-server.ts:186-195`) decides it has settled after one `setTimeout(0)` turn with no request open, a timing heuristic that is sensitive to load. That helper is not changed by the step.
  - Whether the base also fails under the same load is not verified. A run of the file on the base copy under a concurrent full list would settle it, and that run was not made.
- The report's line "A usage-refresher `claude` process and a tmux server that were not mine to keep were ended by pid" is ambiguous. If these were children of the builder's own scratch server, under its scratch HOME and private tmux socket, nothing is wrong. If they were Axel's, the standing rules were broken: no signal to a pid of `~/.claude/sessions/`, and no stop of an agent without his word. The builder's transcript (the pid's parent and HOME at the time) settles it. I did not read the transcript.
- The full Q118 table for each `add({` site's `file` was not compared line by line against `agents/briefs/Q118.md`. I sampled the conformance sites (`NO_FILE` for no README, a bad folder, `code/`, a missing collection) and the gaps sites (the project file, README.md for the data section), and each fits its kind.
- The duration figure: `test:quick` took 58.3 s against its 45 s limit while other suites ran on the machine. That figure reflects the machine's load, not the step's code.

Reviewer usage: agent id not visible to me (the runner's record holds it), served model claude-opus-5-5, about 330,000 tokens (approximate), about 90 tool uses, about 35 minutes (approximate, not measured). The runner's completion notice holds the exact figures.

## Repair round 1, refuted

Step D33, worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D33`, base 1439a44ec. Paths are relative to `tools/oculus` in the worktree unless absolute. My scratch folder is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d33-r1-review`. I changed no file in the worktree, the main checkout or the ledger. `git status --short` gives the same 102 lines after my runs as before them. Nothing of mine is still running.

**Summary:**
- **Ruling 5:** not done, as the round says. The builder's finding reproduces, and Z723's rule is right on the tree, with one caveat on how paths are compared (see "Ruling 5 and Z723").
- **New defect (R1-1):** a Problems view hidden with Cmd+Shift+M and shown again with the status item comes back with its state lost. The status item's path also keeps no state per page. This affects ruling 6 and three document sentences.
- **Ruling 15:** broken. The builder reports two git calls of its own.
- **Everything else:** every other closure I reran reproduces.

### Verification lines (verbatim)

Brief verify item 1 (`npm run diagrams` was not run, because it writes files; `npm run test:checks` below includes `tests/checks/diagrams/diagrams.test.ts`, which passed):
```
$ (tools/oculus) PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh /Users/axelfaes/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
ok      ASCII gate (0.4 s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.7 s)
ok      eslint (20.4 s)
ok      svelte-check (20.7 s): 1791458371798 COMPLETED 432 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (32.8 s): Duration  29.74s (transform 60.65s, setup 0ms, import 74.84s, tests 37.31s, environment 199ms)
test:quick: 33.2 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
exit 0
```

Item 3. Each file was run alone with `npx vitest run <file>`:
```
tests/data/sources/manifests.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1)
tests/data/sources/registries.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1)
tests/data/sources/collections.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1)
tests/data/sources/career.test.ts:  Test Files 1 passed (1)  Tests 2 passed (2)
tests/data/sources/feeds.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1)
tests/data/sources/docs.test.ts:  Test Files 1 passed (1)  Tests 2 passed (2)
tests/data/sources/present.test.ts:  Test Files 1 passed (1)  Tests 4 passed (4)
tests/routes/docs/deck.test.ts:  Test Files 1 passed (1)  Tests 3 passed (3)
tests/data/sources/personal.test.ts:  Test Files 1 passed (1)  Tests 2 passed (2)
tests/data/snapshot/normalise.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1)
tests/state/sessions/source.test.ts:  Test Files 1 passed (1)  Tests 25 passed (25)
tests/state/sessions/source-disk.client.test.ts:  Test Files 1 passed (1)  Tests 4 passed (4)
tests/state/sessions/autosave.client.test.ts:  Test Files 1 passed (1)  Tests 23 passed (23)
tests/shell/panes/strip/tab-menu.test.ts:  Test Files 1 passed (1)  Tests 4 passed (4)
tests/state/workbench/navigation/pages.test.ts:  Test Files 1 passed (1)  Tests 5 passed (5)
tests/checks/config/arrangements.test.ts:  Test Files 1 passed (1)  Tests 12 passed (12)
tests/checks/config/config.test.ts:  Test Files 1 passed (1)  Tests 31 passed (31)
tests/views/shared/explorer/root-drag.test.ts:  Test Files 1 passed (1)  Tests 2 passed (2)
tests/server/machine/pty/channel.test.ts:  Test Files 1 passed (1)  Tests 12 passed (12)
tests/server/machine/pty/sessions.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1)
tests/views/sources/bar-actions.test.ts:  Test Files 1 passed (1)  Tests 11 passed (11)
tests/state/forms/manifest-draft.test.ts:  Test Files 1 passed (1)  Tests 3 passed (3)
tests/checks/config/config-folder.test.ts:  Test Files 1 passed (1)  Tests 20 passed (20)
npm run test:checks:  Test Files  17 passed (17) / Tests  243 passed (243)
```

Item 4:
- `wc -l` over every changed or new file under `src`, `tests` and `config`: none is over 880 for a source file or 520 for a component. The closest are `Workbench.svelte` 519, `PaneView.svelte` 515 and `context.ts` 844.
- `sh utils/folder-check.sh` exits 0.
- `sh utils/unused-exports.sh` exits 0 and prints 371 lines. The base file `.agents/worktrees/D33-base/tools/oculus/unused-exports.txt` has 374 lines, three of which are knip errors ("ERROR: Error loading vite.config.ts ...", "knip stopped with status 2"). The only content line that differs is `layout/index.ts`, which now lacks `instanceFlag` (now used by `Problems.svelte`). The tree adds no line.

Item 5:
- The ASCII gate (spec.md:99 perl form, over `src tests bin config`) prints nothing, exit 0.
- `LC_ALL=C grep -n '[^ -~]'` over `DESIGN.md HELP.md docs/views.md docs/window.md docs/files-and-search.md` exits 1.
- `yaml.safe_load` over the 7 changed `.yml` files prints `yaml ok 7`.

Item 6: `grep -rn "latex/Problems\|problemRows\|problemFile" src` exits 1; `grep -rn "data-card={at}" src` exits 1; `grep -rn "Marks the project-card control" src` exits 1.

Item 9: I read every new and changed document sentence: `DESIGN.md:475`, `docs/views.md:79-81`, `docs/files-and-search.md:11`, `docs/window.md:82`. None breaks the list-item rule. Three sentences are false (R1-1).

The builder's node runs, rerun from copies of its scripts in my scratch folder (`node --import ./register.mjs <n>.ts`, node v24.21.0):
```
n30: show (nothing kept)   open: i1 | records: []
     reader sets state     open: i1 | records: [["i1",{"filter":"error","hideInfos":true,"scope":"r","asTable":true}]]
     toggle hides          open: none | records: [["hidden-view:p1:problems",{"filter":"error","hideInfos":true,"scope":"r","asTable":true}]]
     toggle shows (new id) open: i2 | records: [["i2",{"filter":"error","hideInfos":true,"scope":"r","asTable":true}]]
     state of the new instance: {"filter":"error","hideInfos":true,"scope":"r","asTable":true}
     close button then show open: i3 | records: []
n31: read  {"line":3,"column":4,"endLine":3,"endColumn":2} -> {"line":3,"column":4,"endLine":0,"endColumn":0}
     write {"line":3,"column":4,"endLine":3,"endColumn":2} -> {"root":"r","path":"a.py","label":"a.py","line":3,"column":4}
     read  {"line":3,"column":4,"endLine":3,"endColumn":6} -> {"line":3,"column":4,"endLine":3,"endColumn":6}
     write {"line":3,"column":4,"endLine":3,"endColumn":6} -> {"root":"r","path":"a.py","label":"a.py","line":3,"column":4,"endLine":3,"endColumn":6}
     read  {"line":3,"column":4,"endLine":2,"endColumn":9} -> {"line":3,"column":4,"endLine":0,"endColumn":0}
     write {"line":3,"column":4,"endLine":2,"endColumn":9} -> {"root":"r","path":"a.py","label":"a.py","line":3,"column":4}
n32: SCROLLBACK_LINES 2000 | lines handed to note for the unlisted terminal: 3000
     diagnostics read after the terminal is listed: 500 | first line number: 1001 | lines kept: 2000
     chunked terminal: 3000 lines in two chunks; first line number read: 1001 | lines kept: 2000
     short output (10 lines) kept whole: 9 diagnostics
n33: fold: files a.py(2) b.py(2) | both files closed
     tree lines (entriesOf, both closed): 2 = file,file
     table rows (rowEntriesOf): 4 = ["r","a.py"]:m3 ["r","a.py"]:m9 ["r","b.py"]:m1 ["r","b.py"]:m4
     filter that hides everything: files 0 | tree lines 0 | table rows 0 | message shown: No results found with provided filter criteria.
     same closed fold, filter text "b.py": table rows 2 (only b.py rows)
n34: repositoryOf(served root): {"repo":"<scratch>/served-eQsPdx"}
     repositoryOf(served/nested, a git repository under it): {"repo":"<scratch>/served-eQsPdx/nested"}
     repositoryOf(served/nested) when no root is served: {"error":"repo is not under a root the file browser serves"}
```

The VirtualRows test, rebuilt from the report's "Tests not landed" text. The three files are byte-identical to the diagnosis's (`diff` prints nothing for each). I ran it on two scratch copies outside the worktree:
- a copy of the unchanged base tree `D33-base/tools/oculus`, whose `VirtualRows.svelte` equals the base commit's (I compared the `git diff 1439a44ec` hunks with a `diff -u` against the copy);
- a copy of the worktree.

Nothing was reverted or broken to produce the red run.
```
base copy:  x asks for no row past the end when a list of 20 shrinks to 3 inside an effect 18ms
            "past": { "body": [], -"key": [], +"key": [ 3, ] }
            +"thrown": "TypeError: Cannot read properties of undefined (reading 'id')
            Test Files  1 failed (1) / Tests  1 failed (1)
worktree:   Test Files  1 passed (1) / Tests  1 passed (1)
```

Other runs:
- My own key and count run (`r2.ts`): `mac Cmd+Shift+M {"kind":"toggle-problems"}`, `non-mac Ctrl+Shift+M {"kind":"toggle-problems"}`, `mac Ctrl+Shift+M null`, `F8 {"kind":"next-problem","by":1} Shift+F8 {"kind":"next-problem","by":-1}`, `0=0 999=999 1000=1K 1500=1K 9999=9K 10000=10K+`.
- Greps the report quotes, rerun: `grep -rn tabProblem src tests DESIGN.md docs` exits 1; `grep -rl "VirtualRows\|list/virtual" tests` exits 1; `grep -rn "entryAt\|\bGONE\b" src` prints only `state/workbench/layout.svelte.ts:91` and `:340`.
- The report's line counts (`problems.svelte.ts` 317, `problem-sources.ts` 122, `place.ts` 95, `file-problems.ts` 26, `Problems.svelte` 385, `problem-rows.ts` 203, `command-marks.svelte.ts` 66, `root-drag.test.ts` 106, `context.ts` 844, `commands.svelte.ts` 830, `workbench-keys.svelte.ts` 547) all match `wc -l`. The folder counts are also right: `state/system` 10, `shell/panes` 10, `shell/panes/strip` 8.

### Verdicts on the 17 rulings

1. **Holds.**
   - `shell/panes/strip/file-problems.ts` holds the page's function under a Svelte context.
   - `+page.svelte:84-89` provides it, and `PaneView.svelte:89`, `:197` and `strip-tab.ts:32`, `:45` read it.
   - `tabProblem` is gone (grep exits 1). `SHELL_STORES` is unchanged (`tests/checks` has no change in `git status`), and `test:checks` passes.
   - The function reaches the panes through a context, where the status words reach the bar as props. The report's "Architecture note" states this, and every PaneView importer (`PageLeaf`, `FloatWindow`, `FloatLayer`) lies under `+page.svelte`.
2. **Holds.** `rowEntriesOf` is at `problem-rows.ts:148`, and the table reads `rowEntries` (`Problems.svelte:119`, `:178-187`). The n33 rerun lists 4 table rows with both files closed, and the empty-filter message.
3. **Holds by reading.** `pressed` serves both layouts: table `:276`, tree `:344`. The double press is `ondblclick` in the table (`:277`) and `onpressagain` in the tree (`:346-347`), both calling `show(row, true)`. Whether the keyboard really stays in the view is for the look.
4. **Holds.** `docs/views.md:81` says the view is per page and lists the defaults; `docs/files-and-search.md:11` names the tab strip.
5. **Not done.** The builder stopped at the ruling's first step, as the ruling allows; ruled as Z723 for landing. See "Ruling 5 and Z723".
6. **Violated in part (R1-1).** n30 reproduces for the key path. The status item calls `toggleView(layout, ui, 'problems')` with no page (`StatusBar.svelte:178`), while the key passes `pageOf()` (`workbench-keys.svelte.ts:229`). So a view hidden by one and shown by the other comes back empty, and the status item's record is shared by every page.
7. **Violated in part.**
   - The table has before and after rows for rulings 3, 2 and 6.
   - Its toggle row says "for that page", which R1-1 makes false for the status item.
   - The same row says "survives a reload", which no run shows. I found no pruning of ui records at load (`ui.svelte.ts` `textsOf`, `clearInstanceStates`), but this is not verified.
8. **Holds.** `DESIGN.md:475` says this, and `source-file.ts:6-11` imports `place.ts`, which the sentence names.
9. **Holds.** `window.md:82` lists the problems item before the findings item, matching `LEFT_ITEMS` (`status-items.ts:36-45`).
10. **Holds.** I measured every line of `Main.svelte:2-11`, `Latex.svelte:18-27` and `status-items.ts:14-29`. The short lines end a paragraph, or come before a token too long to fit, as in `Main.svelte:6` followed by `(state/sessions/latex/latex.svelte.ts)`, which would reach 107 columns.
11. **Holds.** `OpenEditors.svelte:298-310` gives `.problems` its own comment, and `:312-313` puts the unsaved-mark comment back above `.dirty`.
12. **Holds.** `endsBeforeStart` is at `draft.ts:276`. `placed` (`draft.ts:285-305`) and `openedAt` (`tab-state.ts:54-62`) both use it. The n31 rerun is above.
13. **Holds.**
   - `Problems.svelte:2-5` matches the explorer group grep (orders 0, 1, 2, 3, 5, 6, 7, 8).
   - `COMMAND_OWNER` and `LATEX_OWNER` are defined once, at `problem-sources.ts:17-18`. The only other `'oculus-latex'` literal is `latex-editing.ts:62`, an undo source name.
   - `latex-widget.ts` takes the owner through `LatexEditorDeps.owner`, since `ui/` may not import `state/`. That departs from the ruling's wording, and the report says why.
   - A neighbouring point outside the ruling is R1-4.
14. **Holds.** `vi.stubGlobal('Element', Box)` is in a `beforeEach` (`root-drag.test.ts:76`) and `vi.unstubAllGlobals()` in an `afterEach` (`:80`). No `globalThis` is left (grep prints nothing), and the file passes 2 of 2. It has no failing line on the base because its subject `dragging.svelte.ts` is unchanged. That follows from the ruled patch and is not a defect of this round.
15. **Violated (R1-5).** The report says the builder ran `git --version` and `git diff --stat -- docs`. The round says no git command of any kind. Neither call changed the tree. That the full list ran exactly once is not verifiable from here.
16. **Holds.**
    - `SCROLLBACK_LINES` is at `model-machine.ts:197`, exported at `index.ts:601`, and imported by `sessions.ts:24`, `channel.ts:34` and `commands.svelte.ts:52`.
    - `grep -rn SCROLLBACK_LINES src` finds no second definition.
    - `hold` (`commands.svelte.ts:654-672`) bounds the text with `lastLines` (`:86-90`). The n32 rerun keeps 2000 lines.
    - Side note: when the held text ends in a line break, `lastLines` counts the empty tail as a line and keeps 1999 full lines. This is harmless.
17. **Holds.**
    - The `VirtualRows.svelte` and `virtual.ts` hunks match the diagnosis's diff line for line.
    - `GONE` and `entryAt` are gone, and `Problems.svelte` reads `entries[at]` at `:288`, `:295` and `:304`.
    - The red and green runs reproduce: red on the unchanged base copy, green on the worktree copy.
    - The three test files are out of the tree (`ls tests/ui` lists controls, frame, html.test.ts, menu, tabs).

### Verdicts for the whole diff since the base

Items of "What to build":
1. **Partial.** The store, the three sources, registration (`context.ts:673-675`), the library hand-off, the fold and per-page creation hold by reading. Case 8 is unmet because ruling 5 is not done.
2. **Holds.** Registration is order 8, `config/layout.yml:82` lists `problems`, the filter matches the earlier verified run, and the round's table fixes hold. R1-3 is a minor standards point.
3. **Violated in part (R1-1).** The keys, F8, `freedKeys` (`chords.ts:28-29`, `:80`), the walk and the keys sheet (`app.yml:12`: s1-s8, Cmd+Shift+M, F8, Shift+F8, Enter) hold by the `r2.ts` run and greps. The toggle keeps the view's state only when the same caller both hides and shows it.
4. **Holds.** `LEFT_ITEMS`, `packNumber` (run) and `statusbar.yml:10`, `:43-46`.
5. **Holds.** n31; `draft.ts:57-72`; `place.ts`.
6. **Holds.** `command-marks.svelte.ts`, composed at `tab-language.svelte.ts:74`.
7. **Holds.** The tree, Open Editors and tab strip marks; the strip uses the ruling-1 shape.
8. **Holds.** Both `Problems.svelte` files are absent (`ls`), `none_followed` names no problems (`latex.yml:85`), and the three greps exit 1.
9. **Holds by reading.**
   - `Audit.svelte:83-84` takes card ids from `cardIds` and marks the cursor row with `data-cursor`.
   - `LaneCard.svelte:109` carries `dataCardToggle`.
   - `rules.ts:195-207` holds `fileOf` and `NO_FILE`.
10. **Holds by reading.** `Cards.svelte:95` (`idOf`), `:155-156`, and `data-card-focus`; `key-dom.ts:53-75`.
11. **Holds by reading.** `workbench-keys.svelte.ts` adds `drawnCursor` (`:100-101`), the drawn-row guard in `moveCard`, the reworked `reconcilePane` and `syncCards`, and the reset in `stopCards`.
12. **Holds except the sentences R1-1 makes false:**
    - `docs/views.md:81` ("Hiding the view with the key or the status item keeps its filter ... for that page, and showing it again gives them back");
    - `docs/window.md:82` ("keeps its filter, toggles, root scope and table choice for the page");
    - `DESIGN.md:475` ("keeps them in the ui store under a record of the page and the view").

Cases:
- 1: met by reading; the keyboard staying in the view is not verifiable here (look).
- 2: met by reading.
- 3: met by reading.
- 4: met by reading (`problem-sources.ts:33-40`).
- 5: met by reading.
- 6: met by reading.
- 7: met by reading; the count matching the rows is not verifiable here.
- 8: unmet (ruling 5 not done; Z723 at landing).
- 9: met by reading.
- 10: not rerun in this review; the earlier refuter's run is unchanged by this round, and `problem-rows.ts`'s filter code is untouched by it.
- 11: met by reading (`Problems.svelte:258-262`).
- 12: met (`r2.ts` run).
- 13: met (n33 rerun and reading).
- 14: met by reading.
- 15: met by reading (one store per `createClientState`).
- 16: met for the key function (`r2.ts`); the page and the app are the look's.
- 17 to 21b: met by reading; the page behaviour is the look's.
- 22: met by reading.
- 23: met by reading.
- 24: met by reading (ruling-1 path).
- 25 to 25d: met by reading; 25b's gone tab and 25d's two panes are not verifiable here.
- 26 to 26e: met by reading; the DOM behaviour is not verifiable here.
- 27: met by reading (`cardIds`).
- 28: met by reading; Tab then Enter and Space is not verifiable here.
- 28a: met by reading.
- 29: met by reading.
- 30: met by reading; the focus is not verifiable here.
- 30a: met, with one new key this round. The ui record `hidden-view:<page>:<view>` collides with no instance id format I found. Its empty-page form `hidden-view::problems` is the defect in R1-1.
- 31, 32, 33: not verifiable here (page runs; the look on TEST).

### Findings

### Spec

**R1-1. The status item's toggle loses the state the key kept, and keeps no state per page.**
- **Place:** `src/lib/shell/status/StatusBar.svelte:178`, against `src/lib/shell/keys/workbench-keys.svelte.ts:229` and `src/lib/shell/keys/keys.ts:137-150`.
- **Quoted hunk:**
  ```
  StatusBar.svelte:178   onclick={() => toggleView(layout, ui, 'problems')}
  workbench-keys:229     toggleView(options.layout, options.ui, 'problems', pageOf());
  keys.ts:138            const hidden = `hidden-view:${page ?? ''}:${view}`;
  ```
- **What is wrong:**
  - The two callers file the hidden state under different records: `hidden-view:<page id>:problems` for the key, and `hidden-view::problems` for the status item.
  - A view hidden by one and shown by the other opens fresh, and the first record stays behind.
  - The status item's record names no page. The ui store is `localStorage` (`ui.svelte.ts:462`), so that record is shared by every page and every browser tab of the origin.
  - Ruling 6 names both triggers and asks for the state "kept for that page and view".
- **Run (my `r1.ts`, the n30 stub with the key's page then the item's none):**
  ```
  hidden by the key (page explorer) open: none | records: [["hidden-view:explorer:problems",{"filter":"error","asTable":true}]]
  shown by the status item (no page) open: i2 | records: [["hidden-view:explorer:problems",{"filter":"error","asTable":true}]]
  state of the new instance: undefined
  ```
- **Failure scenarios:**
  - A reader filters to `!**/node_modules/**`, hides the view with Cmd+Shift+M, then presses the status item: the filter is gone.
  - A reader hides the view with the status item on one page and shows it with the item on another page: the second page gets the first page's filter.
- **Fix at landing:** make the record's page the same for both callers. Either `toggleView` resolves `page ?? layout.currentPage().id`, or `StatusBar.svelte` passes the current page.
- **Verdict:** ruling 6 and item 3 violated in part; item 12 and ruling 7 violated for the three sentences named above.

### Proof

**R1-2. n33's quoted output is not what the script prints.**
- **Place:** the report's ruling 2 block, `D33-report.md:26`.
- **Quoted:** `table rows (rowEntriesOf): 4 = a.py:m3 a.py:m9 b.py:m1 b.py:m4`
- **What is wrong:** the script prints the file key, so the run gives `table rows (rowEntriesOf): 4 = ["r","a.py"]:m3 ["r","a.py"]:m9 ["r","b.py"]:m1 ["r","b.py"]:m4`. The count and the order agree, but the line is presented as output and is edited.
- **Failure scenario:** a reader comparing a rerun with the report takes the difference for a change in the code.
- **Verdict:** ruling 2 still holds on my rerun; this is a report defect.

**Not a finding, stated for the record:** the report says "show(row, true) the ondblclick of both (:277, :347)". The tree uses `onpressagain` (`Problems.svelte:346-347`), not `ondblclick`. The behaviour still goes through one handler, as ruling 3 asks.

### Standards

**R1-3. `RowEntry` is exported with no importer outside its file.**
- **Place:** `src/lib/views/sources/search/problem-rows.ts:129`.
- **Quoted:** `export type RowEntry = Extract<Entry, { kind: 'row' }>;`
- **What is wrong:** `grep -rlw RowEntry src tests` finds only `problem-rows.ts`. spec.md's export rule says such an export is removed or made local. `unused-exports.sh` does not list types, so its clean line does not cover this.
- **Failure scenario:** none at run time; an export with no reader stays in the module's surface.
- **Verdict:** item 2 minor; fix at landing.

**R1-4. The language server's marker owner is written in two places, and the new comment names only one.**
- **Place:** `src/lib/state/system/problem-sources.ts:13-15` and `:59`, against `src/lib/ui/controls/editor/kit/lsp/markers.ts:11-12`.
- **Quoted:**
  ```
  * share one, and a LaTeX build's markers have one. A language server's is `lsp-<language>`, built
  * where its markers are set.
  ...
  owner: `lsp-${file.language}`,
  ```
  with `return \`lsp-${language}\`;` in `markerOwner`.
- **What is wrong:** ruling 13 asked for the other two owners to be defined once. The `lsp-` owner is the same kind of rule, and it is written twice. The comment written this round says it is built where the markers are set, but the same file builds it too.
  - Whether `state/` may import `markerOwner` from `ui/` under DESIGN.md's boundaries is not checked here. If it may not, the comment should say the word is built in both places.
- **Failure scenario:** a rename of the owner in `markers.ts` leaves Problems rows naming the old one in the Copy JSON.
- **Verdict:** outside ruling 13's list; minor.

**R1-5. Two git commands in the round.**
- **Place:** the report's "Deviations with no effect".
- **Quoted:** "Two read-only git calls, which the round brief forbids: `git --version` once (output discarded) and `git diff --stat -- docs` once."
- **What is wrong:** ruling 15 says no git command of any kind in this round. The report itself states the breach.
- **Failure scenario:** none to the tree; a rule breach to note.
- **Verdict:** ruling 15 violated.

### Behaviour

R1-1 is the round's one user-visible change the report states wrongly. The report's table says the kept state is "for that page" and "survives a reload". The first is false for the status item. The second is not verified by any run.

Every other round change the report lists has a before and after: the table's press, the table with closed files, the strip counts, a reversed end on one line, and the held output bounded to 2000 lines. My reading of the diff since the base found no other change.

### Ruling 5 and Z723 (your check)

**The builder's finding reproduces.**
- `server/machine/runs/commands/repo.ts:22-27` accepts a repository that lies inside a served root and is either a served root or holds `.git`. n34 shows a nested git repository is accepted, and is refused once no root serves it.
- The page records that repository as the row's root: `CommandDiagnostic.root` is "The repository the command belongs to" (`model-sessions.ts:713-714`), set from `job.repo` at `commands.svelte.ts:715`.
- So ruling 5's rule as written (the row goes when `root` is no longer a served root) would drop a nested repository's live rows.
- The LaTeX store's only forgets are still at `latex.svelte.ts:315-316`, so its half is not done either. Case 8 stands as the first refuter found it.

**Z723's rule is right on the tree.** "A command row goes when its repository lies under no served root" is the same test `repositoryOf` applies first (`repo.ts:22`). So the page drops exactly the rows whose command the server would no longer accept:
- a repository under another root that is still served keeps its rows, remapped by `tabOfFile`;
- case 6's rows (a served repository naming a file outside every root) stay listed under the path as written.

Making the LaTeX store forget a root that leaves the served roots, at the store, ends the cause. A filter in `latexProblems` would leave dead targets in the store, and Z723 rightly names it the lazy option.

**One caveat for the landing fix: compare paths in the same terms.**
- `job.repo` is a real path (`repo.ts:17`, `realPath(folder)`).
- The page's served roots (`context.ts:420`, `fs.roots()`) carry the configured `dir` with `~` expanded (`files.ts:181`) but not resolved through symlinks.
- If a root's configured folder goes through a symlink, an "inside a served root" test on the page fails for every row of that root. The rows would then be dropped, where today they stay listed under their path.
- Not verified on this machine; a fixture with a symlinked root in the landing run settles it.

Also, case 8 covers the language-server rows of a removed root. Whether they go depends on the tab's model being released (`client.ts:516-526`), which I did not run. Z723's landing run, which lists the rows of each source before and after, should list them too.

### Declined to judge

- Brief verify item 7's page scripts and item 8 were not run, because builders and reviewers run no page under Z720. Cases 31, 32 and 33 and every DOM behaviour of cases 1, 16, 18 to 21b, 25b, 25d, 26 to 26e, 28 and 30 are the look on TEST.
- `npm run diagrams` was not run because it writes files. `tests/checks/diagrams/diagrams.test.ts` passed inside `npm run test:checks`.
- The claim that the full list ran once this round cannot be checked without the builder's transcript.
- I did not rerun case 10 (the filter), case 28a (`fileOf` over a scratch tree) or the `add({` site table. This round does not touch them, and the earlier refuter's runs stand.
- "Survives a reload" for the hidden-view record: not verified (needs a page).
- Whether a tab under a removed root keeps its language-server rows: not verified (Ruling 5 section).
- The Settings card, Audit and lane DOM behaviour: read only.

Reviewer usage: aba7f4b62b7054a8f, claude-opus-5-5, 334,877 tokens, 113 tool uses, 18.7 min (from its completion notice).
