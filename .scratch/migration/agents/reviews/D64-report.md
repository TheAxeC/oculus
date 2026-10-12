Ruling 22 is partly NOT DONE: the store, the request and the page command of `terminal.show(preserveFocus)` are built and tested, but the focused element after the call is not tested, because the suite has no DOM (no jsdom or happy-dom in `node_modules`) and the app may not be started; the grid's `focus()` calls are verified by reading only. Rulings 1 to 21 are DONE; each is below with its command.

## Not green or not covered in this worktree

- Ruling 22, the focused element after `terminal.show(true)` and `terminal.show(false)`: NOT tested here. What is tested: `tests/state/sessions/terminal/show-focus.client.test.ts` ("asks no grid for the keyboard when preserveFocus is true, and the grid of that terminal when it is false") and the two `page-commands.client.test.ts` rows ("is passed to the page with preserveFocus true" and "... false"). It goes onto the landing look list: with the Terminal tab open, an app calls `terminal.show(true)` on a second terminal while the cursor is in the source editor (the editor keeps the keyboard, the terminal tab shows), then `terminal.show(false)` (the terminal's grid takes the keyboard).
- `npx vitest run tests/checks --testTimeout 0 --hookTimeout 0` ends with `Test Files  2 failed | 15 passed (17)` and `Tests  2 failed | 264 passed (266)`. The two failures are the two the review explains, caused by the worktree's missing hub `.oculus/` folder: `tests/checks/config/integrity.test.ts > the real hub > validates with no findings` and `tests/checks/config/config-folder.test.ts > names a group of its own and a path under the hub for every document` (its loop runs over `docs: []` of `config/layout.yml:189`). No other check fails. Output: `r1out/checks2.txt` in the scratchpad, last lines quoted in "Checks".
- `npm run test:quick -- --base a9641a30b` passes every command and takes 64.7 s against the 45 s limit it prints, because 364 changed files select 181 test files (its line "181 test file(s), 10 essential"). The limit is not met by this selection.
- `tests/routes/machine/debug.test.ts > POST /api/debug > runs a debug launch only after its exact text is approved` takes 1236 ms in the verbose run; that test is not one this round adds or changes, and the file carries `// @module-tag slow:` (line 11).

## Open items of the plan

None. `sed -n 176,184p tools/oculus/.scratch/migration/orchestrator-state.md` of the main checkout prints the heading "Open items (only what Axel must rule on ...)" and its one explanatory paragraph with no entry below it, and line 281 of that file ("D64 round 1 sent") ends "No open items." Open items 77, 78 and 79 are ruled and belong to D71, not to this step.

## Rulings received, acknowledged

- Open item 64 (a): G77's list gains the tool contributions, so the tests of this step are filed under G77 as the brief says. The lazy option was to file them under an existing entry whose list does not name them or to leave them without an entry; it was not taken.
- Open item 65 (a): new protocol rows per namespace, changing no row already built, as item 2 of the brief says. The lazy option was to widen a built row to carry the new kinds of call; it was not taken.

## Stray git commands (disclosure)

I ran no git command meant to change anything. Nine read-only invocations were typed by mistake or inside a compound command, none with an effect on the tree: `git diff --stat` (twice, inside compound commands); `git -C . status >/dev/null` (three times, inside compound commands); `git diff --no-index /dev/null /dev/null`; `git status >/dev/null 2>&1; sed -n ...`; a bare `git 2>/dev/null` that printed usage; and `git show a9641a30b:tools/oculus/DESIGN.md | grep ...` to read the base's protocol table row, whose output I used only for that row. `sh utils/folder-check.sh` and `npm run test:quick` call git themselves (required verification scripts).

## Repair round 1: rulings 1 to 22

"Base" is the copy of a9641a30b at `.agents/worktrees/D64-base` (only `config`, `src`, `tests`, `utils`), run through a scratch copy with the new test and its helpers laid over it; "before this round" is the tree the review read (`agents/reviews/D64-before-round1.patch` applied to the base copy). Both runs were made with `npx vitest run <file> --reporter verbose`; their outputs are in the scratchpad `r1out/` (`base-*.txt`, `before-*.txt`, `app-manage.txt`, `save.txt`, `debug-route.txt`, `debug-toolbar.txt`, `show-focus.txt`, `page-commands.txt`). The result "now" of every row is the verbose run `npx vitest run tests/server/machine/apps/tools tests/routes/apps/app-manage.test.ts tests/routes/machine/debug.test.ts tests/shell/commands/debug-toolbar.test.ts tests/server/machine/lsp/versions.test.ts tests/data/helpers/files/languages-join.test.ts tests/state/sessions/terminal/show-focus.client.test.ts tests/state/system/apps/page-commands.client.test.ts tests/server/machine/apps/shell/host-commands.test.ts tests/server/machine/apps/manifest tests/server/machine/pty/channel.test.ts tests/state/system/apps/flows.test.ts --reporter verbose`, which printed `Test Files  29 passed (29)` and `Tests  340 passed (340)`.

1. DONE. Writes of `workspace.fs` and the file operations of `applyEdit` go through `runOps` in `src/lib/server/machine/apps/tools/workspace/writes.ts` (the app's scope is still checked first by `scope.resolve`): a new file or folder through `create` (a new file's bytes through `upload`), an existing file's bytes through `upload` with `replace`, `delete` through `delete` (or `trash` with `useTrash`), `rename` through `rename`, `copy` through `paste` in copy mode. A copy, rename or delete of a folder whose tree holds a private folder or a protected file is refused `closed` with nothing written (`writes.ts:87-90`, compared by path, no walk). Cases in `workspace.test.ts`: "writes a file of the scope in place, lists the write in History with the old bytes, and writes none outside", "is followed by a tab that holds the file written, which reads the new bytes at its next poll", "lists %s of %j in History as %j, and Undo puts the files back as they were" (eight rows: createDirectory, delete, delete recursive, delete to Trash, rename twice, copy twice), "is refused closed when copied, renamed or deleted whole, and the hub is untouched". Base: the file fails at its import (`Cannot find module .../lsp/relay/relay-apps.ts`, the tools do not exist in the base). Before this round: `Tests  12 failed | 10 passed (22)`; the History row fails with `TypeError: Cannot read properties of undefined (reading 'field')`, the eight History rows with `[ undefined, [], true, [], [...] ]` against the recorded fields, the folder row with `undefined: undefined` (copy and rename succeeded), `Unavailable: failed` for the delete, the hub touched and History `[]`. Now: 22 of 22 pass. Judgment calls (a), (b), (e), (f) below.
2. DONE. `findFiles`, the file watchers and a document selector's `pattern` use picomatch 4.0.7 (`package.json:106`; `providers.mjs:13` imports it from the package, `workspace/workspace.ts` `globIn`); `src/lib/server/machine/apps/host/runner/tools/languages/glob.mjs` is deleted (`ls` of it prints "No such file or directory", and `find tests -name 'glob*'` prints nothing, so its test is gone). `exclude` undefined skips `node_modules` and what the Files view hides, `null` skips nothing, a glob skips its matches. Cases in `workspace.test.ts`: "leaves out node_modules and what the Files view hides when undefined, nothing when null, and what a glob matches when it is one", "selects the same files in a document selector, in findFiles and in a file watcher" (a dot file, a brace set and a `**` in the middle), "selects a file whose name starts with a dot in a selector, as every glob of oculus does". Before this round: the exclude row got `[ '__pycache__/y.md', ... ]` and the selector row timed out at 20000 ms. Now: pass.
3. DONE. `supportsPauseRequest` is gone: `grep -rn supportsPauseRequest src tests DESIGN.md HELP.md docs | wc -l` prints 0. Pause is drawn whenever a thread of the session runs, for app adapters and `rite_dap` alike, and its request carries that thread's id. Cases: `debug-toolbar.test.ts` "draws Pause on while a thread runs and off while the program is paused", "posts the pause action when Pause is pressed"; `debug-adapters.test.ts` "pauses a running thread of an adapter that declared nothing". Base: `Error: text key not in the text catalog (config/text/): debug.pause` and `TypeError: client.debug.pause is not a function`. Before this round: debug-toolbar 2 failed (`no button labelled Pause`; `expected [ false, [] ] to deeply equal [ true, [ { action: 'pause' } ] ]`), debug-adapters 1 failed. Now: pass. DESIGN.md (debug adapters paragraph, debug client paragraph) and HELP.md (Debugging) no longer name Pause among the capability-drawn controls. `rite_dap` answers `pause` with "pause is not supported: arm a breakpoint instead" (`cathedra` `src/rite/src/tools/debug_dap.cpp` `cmdPause`); oculus shows that as a notice and the session goes on.
4. DONE in this report: the titles per guarded entry are in "Tests per guarded entry", the history-word grep with its output in "History-word grep", the Code-line changes in "Code-line changes".
5. DONE. No fixed sleep or wall-clock wait remains in the files the review lists: `grep -nE "setTimeout|sleep\(|delay\(|Date\.now|performance\.now"` over `tests/server/machine/apps/tools` and `tests/server/machine/apps/world` finds `vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })` (`decorations.test.ts:156`, `languages.test.ts:231`), `manualClock()` in `world/hosts-world.ts:102` (an advancing fake clock), `setImmediate` turns (`streams.test.ts:73`, `server-backpressure.test.ts:50`, `terminals-page.test.ts:46`), the zero delay of `host.end` (`hosts-world.ts:197`) and the scripted server's own `delay` field (`language-app.ts:61`, used by `languages.test.ts:198` and never waited for). A test that checks something did not happen advances the fake clock. The verbose timings after the change are in "Verbose timings".
6. DONE. `tests/routes/apps/app-manage.test.ts`, rows "app-host decorate", "scm", "file" and "terminal" (title "%s is answered with its own result with the token and 403 without it"): each sends the action with the token, asserts its result, sends it without the token and asserts 403. Base, first run: each of the four fails with `expected [ [ 400, ... ], 403 ] to deeply equal [ [ 200, {...} ], 403 ]`, the 400 body being `"error": "action must be request, tab, run, settings, provide, answer, event, release, stop, restart or output"` (`Tests  9 failed | 14 passed (23)`; the other five failures are the base lacking the fixture the rows share, not rows to quote). Before this round: 23 passed (the actions existed). Now: pass.
7. DONE (nothing to change). The three FROZEN entries `lib/ui/controls/editor/kit/languages/apps.svelte.ts:held`, `:signature`, `:version` (`tests/checks/tree/boundaries.test.ts:439-441`) and the ui ALLOWED line `data/helpers/files/apps/tools/language-kit` (`:215`) stand; the reasons above them (`:191`, `:429`) are unchanged.
8. DONE. The `infos` WeakMap of `relay-apps.ts` is a field of `AppEntries` (`relay-apps.ts:166`, made at `relay-make.ts:71`); `children.mjs` exports `createChildren()` and `runner/tools/index.mjs:11` makes the object at the runner's start and passes it in. `findGlobalState` (`boundaries.test.ts:400`) reads `new (?:Map|Set|WeakMap|WeakSet)\b`; it finds no module-level WeakMap or WeakSet in `src` (the three `new WeakMap`/`new WeakSet` lines in `windows.ts:249`, `FrameLayer.svelte:56` and `socket.ts:181` are inside functions), so FROZEN gains no entry. `boundaries.test.ts` passes in `checks2.txt`.
9. DONE. `terminals-page.test.ts` "holds the host to its window plus the chunk in flight, and receives every byte in order once it reads" drives a page that reads slowly through the Hub's `backlog` path in `channels.ts`; "waits and reaches the host in order once the credit returns" covers typed input; "ends the terminal when more than 8 MiB waits for the host" covers the bound. Base: `Cannot find module .../tools/run/stream-terminals.ts`. Before this round the slow-page row and the credit row passed (the output side was already bounded) and the 8 MiB row failed with `expected [ false, false ] to deeply equal [ true, true ]`. Now: 3 of 3 pass.
10. DONE. Cases 2 to 5, 9, 11, 13 and 15 to 19 carry the readings of the unchanged base in the Cases table below; the api readings come from `node r1probe.mjs` (imports the base's `runner-shell.mjs`), run in this turn, and `grep -rn "oculus/stream" <base>/src | wc -l` printed 0.
11. DONE. `BYTE_WINDOW` and `MESSAGE_WINDOW` (`apps/tools/streams.ts:32-33`) and `AppStreamLike` (`relay-apps.ts:38`) are local; the tests set the windows through `byteWindow` and `messageWindow`. `sh utils/unused-exports.sh` output differs from the base's `unused-exports.txt` only by removals and by two path moves (section "Unused exports").
12. DONE. The head comment of `apps/tools/streams.ts` (line 18) names `apps/host/runner/streams.mjs` as the second half of the protocol and the head comment of `runner/streams.mjs` (line 15) names `apps/tools/streams.ts`, each saying a change edits both.
13. DONE. The join stands as built. `DESIGN.md:549` and `HELP.md:313` say: a joined request waits up to 2 s for the slower servers; a request that takes one answer goes to the first server in the order without waiting. Before: the base relay held one server per language and answered as it came (`D64-base/tools/oculus/src/lib/server/machine/lsp/relay.ts:198`, `const entry = language === null ? undefined : this.#servers.forLanguage(language);`). After: `relay-join.ts:29` `JOIN_MS = 2000`; the first declaring server defines, hovers join, a slow server is sent `$/cancelRequest` after 2 s (`languages.test.ts` "join their answers the way VS Code joins them: the first declaring server defines, hovers join, a slow one is cancelled after 2 s").
14. DONE. When a tab's file is saved the page's client sends `textDocument/didSave` (`kit/lsp/transport/messages.ts:77`); the relay (`relay-route.ts:158`, `held/documents.ts:79-94`) forwards it to each server of the file's language whose `textDocumentSync.save` is declared, with the text when `includeText` is true, and to no server for a file the page does not hold. Before: the base page client never sent `didSave`, and the base relay forwarded a `didSave` verbatim to the server whatever it declared, with the text always. After: oculus's own servers get it only when they declare save. Cases: `versions.test.ts` "is sent to a server that ${row.name} as ${JSON.stringify(row.sent)}" (five rows: save true, save without includeText, open/close/change sync only, sync as a number, save false) and "is sent to no server for a file the page does not hold"; `languages.test.ts` "is sent to the server of an app that declared save, with the text when it asked for it" and "fires onDidSaveTextDocument of an app provider once, with the document". Base, first run of the five rows: `Tests  5 failed | 2 passed (7)`, received `{textDocument, text}` where `{textDocument}` or nothing was expected. Now: pass.
15. DONE. Oculus's side registers `backpressure` for the relay's page messages to an app server (`relay-apps.ts:256`) and for a stream terminal's input (`stream-terminals.ts:288`); `sendBytes` is bounded as `sendMessage` is. Case: `server-backpressure.test.ts` "is held to the window of the stream and its bound, loses no message, and the server gets them all in order once the host takes them" printed `measured: the host was sent 13 of 10000 didChange messages before it took any; the stream held at most 499 (window 16, bound 4096); 10000 arrived`; `streams.test.ts` "pauses the source when it holds data and resumes it when the queue is empty". Before this round: the backpressure row timed out at 60000 ms.
16. DONE. The host runs in its own process group and the group is killed when the host ends. Before: `spawn` in the base's `host/process.ts` passed `stdio` only (`grep -n detached` of the base file prints nothing). After: `process.ts:95` `detached: options.spawn === undefined`, `#endGroup()` (`process.ts:151-154`) calls `process.kill(-this.pid, 'SIGKILL')` after the host has ended. DESIGN.md's host paragraph and `docs/apps.md` ("What stops with an app") state both. Cases: `host-end.test.ts` "end when the host stops, though the program ignores SIGTERM and the close of its input" and "end when the host is killed, and the page is told the server is gone".
17. DONE. `debug/launch/write.ts` writes `.oculus/launch.yml` through `runOps` (`write.ts:88`, `runOpsFrom` at `:98`). Cases (`tests/routes/machine/debug.test.ts`): "lists the folder and the file for a folder with no launch.yml and undoes the file" and "lists the write of an existing launch.yml and undoes it to the old text". Before this round: `Tests  2 failed | 2 passed (4)`, `TypeError: Cannot read properties of undefined (reading 'field')` (History listed nothing). Now: pass. Judgment call (c) below.
18. DONE. `languageOf` (`data/helpers/files/languages.ts:150`) reads the base map's whole name, then its extension, then the apps' globs, then the apps' endings. Cases (`tests/data/helpers/files/languages-join.test.ts`): "stays the one the `languages:` map gives when an app glob matches the same name", "is the language of the app glob for a name the map does not decide", "is decided by an app glob before an app ending". Before this round: `Tests  1 failed | 2 passed (3)`, `expected [ 'notes', 'notes' ] to deeply equal [ 'markdown', 'markdown' ]`. Now: pass.
19. DONE. HELP.md's Debugging bullet and DESIGN.md's debug client paragraph (`DESIGN.md:730`) say: `rite_dap` is stopped by SIGTERM and then SIGKILL after the confirmation naming the process; an app's adapter is asked `terminate`, or `disconnect` with `terminateDebuggee` when it did not declare `terminate` (without it for an attach), and its stream is closed after 2 s if it has not ended; Restart sends the adapter's `restart` when it declares one and otherwise is Stop and the same configuration again. Shown by `debug-adapters.test.ts` "asks which end it is when stopped, and ends an adapter that declared terminate with terminate" and "ends an adapter that declared no terminate with disconnect that ends the program".
20. DONE. `APP_OPTION = '@oculus_app'` (`pty/sessions.ts:78`); `grep -rn "@oculus-app" src tests DESIGN.md HELP.md docs` prints nothing. Before this round: `terminals-tmux.test.ts` first row failed with `expected [ false, ... ] to deeply equal [ true, ... ]`. Now: 3 of 3 pass.
21. DONE. When an app's server ends while its host still acts, oculus asks it `shutdown` and then `exit` within the bound its own servers get (`held/process.ts:11,172`), closes the stream after, and tells the page `gone`; when the host itself ended, nothing is sent. Case: `languages.test.ts` "has its server asked shutdown and then exit, and the page told it is gone" (the app calls `client.stop()`; the log of the server ends `['shutdown', 'exit']`). Before this round: the `client.stop()` row timed out at 30 s.
22. PARTLY DONE; see the first line. Built: `terminal.show(preserveFocus)` reaches the page as a `preserveFocus` boolean (`run/terminals.ts:213-218`, `runner-shell.mjs:430`, `registry.ts:173`), the page's terminals store records the ask (`terminals.svelte.ts:378`, `focus.id = preserveFocus ? null : id`, read through `focusAsked` at `:852`) and `TerminalGrid.svelte:265-268` gives the keyboard to the grid of the terminal whose id was asked and then calls `focusTaken`, so `show(true)` leaves the focus where it is. Tested: `show-focus.client.test.ts` and `page-commands.client.test.ts` ("is passed to the page with preserveFocus %s", two rows). Base: `TypeError: terminals.focusAsked is not a function`, and the two page-commands rows fail with `expected [] to have a length of 1 but got +0` (`Tests  2 failed | 12 passed (14)`). Now: pass. NOT tested: the focused DOM element (no DOM in the suite).

## Cases, first run on the unchanged base and run now

The unchanged base is a9641a30b. Readings of the base's runner API come from `node r1probe.mjs` (imports the base's `runner-shell.mjs` and calls each entry point); it printed `api keys: commands, window, workspace` and `workspace keys: getConfiguration, onDidChangeConfiguration`. A case whose test imports a module the base does not hold fails at that import (`Cannot find module ...`, outputs `base-*.txt`). `grep -rn "oculus/stream" <base>/src | wc -l` printed 0, so no stream row exists in the base. The 22 cases are all in the brief's list; none was found wrong by the brief's own rules.

| Case | Shown by | First run on the unchanged base | Run now |
| --- | --- | --- | --- |
| 1 language, grammar, snippets, stdio server | `manifest-tools.test.ts`, `languages.client.test.ts`, `languages.test.ts` ("starts with the first document of its language under a served root...") | `contributes.languages`, `grammars`, `snippets` each read as `key_unknown`, so the folder is not an app; `languageOf('a.note')` is plaintext | pass |
| 2 serverOptions function | `languages.test.ts` ("starts from a serverOptions function...") | `languages.registerLanguageServer -> TypeError: Cannot read properties of undefined (reading 'registerLanguageServer')` | pass |
| 3 hover provider and collection beside oculus's markdown server | `languages.test.ts` ("answer a hover of the document and add their diagnostics...") | `languages.registerHoverProvider -> TypeError: Cannot read properties of undefined (reading 'registerHoverProvider')` | pass |
| 4 two servers, one language | `languages.test.ts` ("join their answers...", "show together with the name of each server...") | `languages.registerLanguageServer -> TypeError: Cannot read properties of undefined`; the base relay has one server per language (`relay.ts:198`) | pass |
| 5 app disabled while a server runs | `languages.test.ts` ("has its server end, its diagnostics leave...") and `server-lifetime.test.ts` | `languages.registerLanguageServer -> TypeError: Cannot read properties of undefined` | pass |
| 6 `.mdx`, language_taken, user `languages:`, filenamePatterns, firstLine, grammar scopeName | `manifest-tools.test.ts`, `languages.client.test.ts`, `languages-join.test.ts` | `languageOf`: `a.mdx`, `a.note`, `notes/a.txt` are plaintext, `a.md` markdown | pass |
| 7 debugger `notes.dbg` end to end | `debug-adapters.test.ts` | `contributes.debuggers` is `key_unknown` | pass |
| 8 launch.yml with no type, and `type: gone.dbg` | `debug-adapters.test.ts` ("reads an entry with no type as the oculus adapter and leaves out the type no app declares...") | `type`, `request`, `stopOnEntry` each rejected as "is not a key of a launch configuration" and the entry left out | pass |
| 9 inline, server and executable descriptors | `debug-adapters.test.ts` | `debug.registerDebugAdapterDescriptorFactory -> TypeError: Cannot read properties of undefined (reading 'registerDebugAdapterDescriptorFactory')`; `debug/launch/read.ts` absent (`Cannot find module`) | pass |
| 10 task provider | `tasks.test.ts` | `contributes.taskDefinitions` is `key_unknown` | pass |
| 11 problem matchers | `matchers.client.test.ts` | `tasks.registerTaskProvider -> TypeError: Cannot read properties of undefined (reading 'registerTaskProvider')`; `state/sessions/terminal/pty/matchers.ts` absent (`Cannot find module`) | pass |
| 12 commands.yml `type: notes.task` | `tasks.test.ts` ("resolves a typed commands.yml entry...") | entry `type: notes.task` without `run` gives finding `commands[0].run` "must be text" | pass |
| 13 terminals, tmux and pty | `terminals-tmux.test.ts`, `terminals.test.ts`, `terminals-scope.test.ts` | `window.createTerminal -> TypeError: api.window.createTerminal is not a function` | pass |
| 14 source control | `scm.test.ts`, `scm.client.test.ts` | `scm.createSourceControl -> TypeError: Cannot read properties of undefined (reading 'createSourceControl')`; menus `scm/inputBox` and `scm/title` are "no menu oculus draws" | pass |
| 15 decorations | `decorations.test.ts` | `window.registerFileDecorationProvider -> TypeError: api.window.registerFileDecorationProvider is not a function` | pass |
| 16 host crash with a stream of each kind open | `terminals/host-end.test.ts`, `terminals.test.ts` ("is closed with the host by a crash...") | no `oculus/stream` row in the base (`grep` count 0); `Cannot find module .../apps/tools/streams.ts` | pass |
| 17 50 MB terminal stream backpressure | `terminals.test.ts` ("is held to the window of the stream while the page holds still, loses no byte once it reads..."), `terminals-page.test.ts` | no `oculus/stream` row in the base; `Cannot find module .../tools/run/stream-terminals.ts` | pass |
| 18 bad ids | `streams.test.ts` ("refuses an id that is open, an id that closed, a bad id...", "is dropped with a line in the output...") and `terminals.test.ts` ("drops data for an id it did not open...") | no `oculus/stream` row in the base; `Cannot find module .../apps/tools/streams.ts` | pass |
| 19 root app in a workspace of two roots | `languages.test.ts` ("is given only the documents of its own root"), `scm.test.ts` ("sees the folder of its own root only..."), `decorations.test.ts` ("is asked for the files of its own root...") | `languages.registerLanguageServer`, `scm.createSourceControl` -> `TypeError: Cannot read properties of undefined`; `window.registerFileDecorationProvider -> TypeError: ... is not a function` | pass |
| 20 workspace.fs, findFiles, watcher, applyEdit | `workspace.test.ts` | `workspace.fs -> TypeError: Cannot read properties of undefined (reading 'readFile')`; `workspace.findFiles` and `workspace.createFileSystemWatcher` -> `TypeError: ... is not a function` | pass |
| 21 unknown point `notebooks`, menu `scm/inputBox` | `manifest-tools.test.ts`, `manifest-contributes.test.ts` (row edited, see "Edits to existing assertions") | `contributes.notebooks` is `key_unknown`; the menu `scm/inputBox` is dropped with finding `contributes_menu_dropped` | pass |
| 22 relay split | the unchanged base tests of `tests/server/machine/lsp` | `diff -r` of the base's `tests/server/machine/lsp` against this tree differs only by the import lines `lsp/relay.ts` to `lsp/relay/relay.ts`, the shared helpers of the lifetime suite and the `capabilities`/`appServers` parameters of `lsp-fixture.ts` (see "Edits to existing assertions") | pass |

Cases only a page shows (the grid, the Repositories view, the Files rows, the editor kit) are checked by reading and by the unit-level runs above. The look on landing: the Terminal tab with an app terminal of each kind (cases 13, 17) and `terminal.show(true)` and `terminal.show(false)` (ruling 22), the Repositories view with an app source control (14), the Files view with badges and a colour (15), the Debug view with an app debugger (7) with Pause drawn while a thread runs, Add Configuration (ruling 17) and Stop and Restart (ruling 19), a source tab in an app language with its server's hover and diagnostics (1 to 6), and F5.

## DONE / NOT DONE per item of "What to build"

NOT DONE: the focused-element check of ruling 22 (first line of this report); every item below is DONE. Each row names the code and the command or test that shows it; the commands are in "Checks".

| Item | State | Code | Shown by |
| --- | --- | --- | --- |
| 0 relay split | DONE | `src/lib/server/machine/lsp/relay/` holds `relay.ts` (115 lines, the `Relay` class and its head comment), `relay-apps.ts`, `relay-join.ts`, `relay-life.ts`, `relay-make.ts` (with `prepare` and the held-server helper as named functions), `relay-options.ts`, `relay-pages.ts`, `relay-route.ts`, `relay-server.ts`, `relay-state.ts`; `ls src/lib/server/machine/lsp/relay.ts` answers no such file | case 22, `wc -l` in "Checks" (largest 563) |
| 1 streams | DONE | `apps/tools/streams.ts` (`StreamHub`, the four `oculus/stream/*` rows, 256 messages or 1 MiB of credit, `backpressure` on oculus's side), `apps/host/runner/streams.mjs` (the host's end), `apps/tools/run/stream-terminals.ts`, `run/stream-actions.ts` | `streams.test.ts`, `terminals.test.ts` (case 17), `host-end.test.ts` (case 16) |
| 2 protocol rows | DONE | DESIGN.md protocol table: the four stream rows `yes`, about 30 new rows `oculus/languages/*`, `workspace/*`, `debug/*`, `tasks/*`, `terminals/*`, `scm/*`, `decorations/*`; no row already built was changed | `grep -n "later step\|not yet built" DESIGN.md` prints nothing |
| 3 languages points | DONE | `read/contributes/{place,reader-tools,shape-tools}.ts`, `read/across/languages.ts`, `read/tool-files/tool-files.ts`, `data/helpers/files/apps/tools/{language-kit,editor-defaults,languages,scope-names}.ts`, `state/system/apps/tools/languages.svelte.ts`, `ui/controls/editor/kit/languages/apps.svelte.ts` | cases 1, 6; `manifest-tools.test.ts`, `languages.client.test.ts` |
| 4 language servers | DONE | `lsp/relay/relay-apps.ts`, `relay-join.ts` (one server per root, 30 s initialize bound, 60 s grace, at most 4 restarts in 3 minutes, a join waits 2 s then sends `$/cancelRequest`), `runner/tools/languages/servers.mjs` | cases 2, 4, 5; `languages.test.ts`, `server-lifetime.test.ts` |
| 5 language features | DONE | `runner/tools/languages/{providers,convert}.mjs`, `apps/tools/languages.ts` (one in-host server per root and language answering the providers) | cases 3, 19; `languages.test.ts` |
| 6 workspace API | DONE | `apps/tools/workspace/{workspace,writes}.ts`, `apps/tools/scope.ts`, `server/files/fs/operations/{replace,ops-shape}.ts` (the recorded writer's helpers), `runner/tools/workspace.mjs` (fs, findFiles, applyEdit, watchers, workspaceFolders and `foldersChanged`) | case 20; `workspace.test.ts` |
| 7 debug adapters | DONE | `apps/tools/debug.ts`, `debug/app/{adapter,capabilities,filters,port,resolve,ends}.ts`, `debug/session/{send,start,controls,types}.ts`, `debug/launch/{read,write}.ts`, `runner/tools/debug.mjs`; a debugger app with no host file gets the runner (`runsHost(row)`) | cases 7, 8, 9; `debug-adapters.test.ts`, `host-manager.test.ts` (two rows) |
| 8 tasks | DONE | `apps/tools/run/tasks.ts`, `runner/tools/tasks.mjs`, `state/sessions/terminal/pty/matchers.ts`, `server/machine/runs/commands/files.ts` (typed entries) | cases 10, 11, 12; `tasks.test.ts`, `matchers.client.test.ts` |
| 9 terminals | DONE | `apps/tools/run/{terminals,terminals-env,stream-terminals}.ts`, `runner/tools/terminals.mjs`, `server/machine/pty/sessions.ts` (kind `app`, option `@oculus_app`) | cases 13, 16, 17; `terminals/*.test.ts` |
| 10 source control and scm menus | DONE | `apps/tools/scm.ts`, `runner/tools/scm.mjs`, `state/system/apps/tools/{scm.svelte.ts,source-rows.ts}`, `views/sources/repositories/apps/AppSourceGroup.svelte` and the app source rows of the repository list, the `scm/*` menus | case 14; `scm.test.ts`, `scm.client.test.ts` |
| 11 file decorations | DONE | `apps/tools/decorations.ts`, `runner/tools/decorations.mjs`, `state/system/apps/tools/decorations.svelte.ts`, the Files rows | case 15; `decorations.test.ts` |
| 12 menus debug and terminal | DONE | `debug/*` and `terminal/*` menus read by `read/contributes/` with the context keys `debugType`, `inDebugMode`, `debugState`, `callStackItemType`, `terminalProcessSupported`; drawn by `views/system/machine/debug/sections/*`, `views/sessions/terminal/app-menus.ts` and `TerminalGrid.svelte` | `manifest-contributes.test.ts` rows; `app-menus` reading in the views |
| 13 inventory | DONE | the table below | |
| 14 words and docs | DONE | `config/text/*` catalogs, `docs/apps.md`, `DESIGN.md`, `HELP.md` (ledger below) | the item 14 grep, hit by hit, in "Judgment calls and findings" |
| 15 tests | DONE | the per-entry table below | `npm run test:quick`, `npx vitest run` |

## Inventory (item 13)

| Row | Code that meets it | Case or test |
| --- | --- | --- |
| commands | `apps/shell/commands.ts` (D63); `DEBUG_COMMAND` and `TASKS_COMMAND` in `read/activation.ts` for the two built-in `onCommand` ids | `host-commands.test.ts`, cases 7, 10 |
| keybindings | D63's contribution; debug keys while the grid has the keyboard in `shell/commands/debug-key.ts` | unchanged by this step |
| menus | `scm/*`, `debug/*`, `terminal/*` menus with their arguments and context keys (docs/apps.md "Menus") | `manifest-contributes.test.ts`, `scm.client.test.ts` |
| status bar items | D63's; the source control `statusBarCommands` through `state/system/apps/tools/scm.svelte.ts` and the language server choice as submenus of the status bar menu | case 14 |
| side bar and panel views, tree views, panels, custom editors | D62 and D63's | not changed by this step |
| language features | items 3 to 5 | cases 1 to 6; `languages.test.ts` |
| debug adapters | item 7 | cases 7 to 9; `debug-adapters.test.ts` |
| tasks and terminals | items 8 and 9 | cases 10 to 13, 16, 17 |
| source control providers | item 10 | case 14 |
| file decorations | item 11 | case 15 |
| file read, write and watchers | item 6: reads and watchers as built, every write through the recorded writer `runOps`, globs by picomatch; plus Node in the host | case 20; `workspace.test.ts` |
| processes | language server children and task processes: `runner/tools/children.mjs`; the host runs in its own process group, killed when the host ends | cases 5, 16; `host-end.test.ts` |
| network | node's in the host (D62) | not changed |
| declared settings | `configurationDefaults` and the schemas of `jsonValidation` (item 3) | `manifest-tools.test.ts` |
| colour and icon themes | D63's; icon of a language (`AppLanguageIcon`) for file rows | `languages.client.test.ts` |
| quick pick, input box, notifications, progress | D63's `window` API; the Cmd-K list gains the tasks of apps | `tasks.test.ts` |
| state and secret storage | D62's | not changed |

## Kept list (things oculus has that VS Code does not, each kept)

- Repositories view: project commands, worktrees, the graph, the merge editor, the diff hunk bar, repository list counts. Kept: `views/sources/repositories/` and `state/sources/repositories/` are changed only for the app source rows, the quick diff original (`diff/subject.ts` `original`) and the `scm/*` menus.
- Debug view: the configuration list on the status bar, the floating toolbar, breakpoints and watches kept per browser, and the debug keys while the Terminal tab has the keyboard. Kept: `views/system/machine/debug/` gains app debugger rows and capability-driven controls; the keys stay in `shell/commands/debug-key.ts`.
- Files rows: problem marks, bookmarks, the git letter and colour, nesting, the inline filter. Kept: an app decoration is added beside the git letter (badge: git letter then the app badge cut to 2 characters).
- Source editor: the quick diff action, blame, the breakpoint gutter, the hub-key and backtick answers. Kept: the app language servers answer beside oculus's own servers (`answers` of the registry entries are untouched).
- Terminals: tmux persistence, the steer box, the composer, join and attach. Kept: an app terminal of kind `app` survives a server restart and is listed again.

## Tests per guarded entry (ruling 4; item 15)

Titles are quoted as `it(...)` writes them; `%s` and `%j` are table-driven rows. A file in the lists is new in this step unless the line says "(added)", which marks titles added to a file the base already held; titles renamed or deleted: none (the script `titles.py` compared every test title of the base with this tree: `removed` is empty for all 31 files that differ, and no file is gone). Test files tagged slow (`// @module-tag slow:` or `{ tags: ['slow'] }`, so `test:quick` leaves them to `npm run test:slow`): `decorations.test.ts`, `scm.test.ts`, `languages.test.ts`, `debug-adapters.test.ts`, `workspace.test.ts`, `tasks.test.ts`, `host-end.test.ts` and `terminals-tmux.test.ts` carry the module tag, and the case in `server-backpressure.test.ts` carries `{ tags: ['slow'] }` (2281 ms in the verbose run, 10,000 messages); the module-tagged files start node processes or a tmux server in each case; a case of any other file runs well under a second (section "Verbose timings").

### G77 (the tool contributions)

- `tests/server/machine/apps/tools/languages.test.ts`: "starts with the first document of its language under a served root, and the page gets its answers"; "starts from a serverOptions function that answers the program to run"; "is started once for two documents of one root and once more for a second root"; "is given to no server of an app, whether the root is unknown or the path climbs out of its root"; "join their answers the way VS Code joins them: the first declaring server defines, hovers join, a slow one is cancelled after 2 s"; "has its server end, its diagnostics leave the document, its capabilities withdrawn and the page told the server is gone, when the app is disabled"; "is started again by a request after each exit, at most 4 times in 3 minutes, and then left failed until Restart"; "is given only the documents of its own root"; "show together with the name of each server as the source, and a clear of one leaves the other"; "is above every version sent before for the file, after a close and an open again"; "answer from one in-host server, a provider that throws answers an error to its request alone, and one collection cleared leaves the other"; "answer a hover of the document and add their diagnostics with the collection as the source, while oculus own server stays ready"; "is sent to the server of an app that declared save, with the text when it asked for it"; "fires onDidSaveTextDocument of an app provider once, with the document"; "has its server asked shutdown and then exit, and the page told it is gone".
- `tests/server/machine/apps/tools/debug-adapters.test.ts`: "starts through a %s descriptor with no approval, launches with the file filled in, stops at entry and fills the call stack and the variables"; "starts the program the manifest names for an app with no host file, with no approval question"; "ends the session and the adapter when the host is killed while a %s descriptor session is paused"; "sends attach for an attach entry, with its own keys"; "asks which end it is when stopped, and ends an adapter that declared terminate with terminate"; "ends an adapter that declared no terminate with disconnect that ends the program"; "refuses a second session while one runs, and a type no app declares"; "offers no control and sends no extra request when it declared nothing"; "pauses a running thread of an adapter that declared nothing"; "draws each control and sends each request when it declared them"; "reads an entry with no type as the oculus adapter and leaves out the type no app declares, with its finding"; "resolves a configuration before and after its placeholders are filled, and aborts the launch of one a provider answers nothing for"; "lists what provideDebugConfigurations answers for Add Configuration"; "starts a session with startDebugging, is refused a second while one runs, reaches it with customRequest and hears it start and end".
- `tests/server/machine/apps/tools/tasks.test.ts`: "lists the tasks of a provider as source and name, the first default of a group as the default build, and a task named like a found command with the app title in parentheses"; "runs a shell execution and a process execution in a terminal named after the command, and a custom execution in a stream terminal, and tells the host each exit code"; "runs a task again in the terminal that ended, after the host stopped and was started by the listing"; "resolves a typed commands.yml entry by the app that defines its type, and drops one whose type no app defines or whose required property is missing, each with a finding"; "runs a task of the host with executeTask, which the host ends with terminate"; "fetches the tasks of its providers for the host".
- `tests/server/machine/apps/tools/scm.test.ts`: "is held under an id that starts with the app name and refused under another id or twice"; "places a resource of the scope in its root and path, and gives one outside or in a closed folder none"; "types into the box, runs the accept command and a row command, and opens a row with none"; "runs a menu command on the control, a group, rows and a change with the arguments VS Code gives it"; "refuses a command the app does not declare, a change with no file, a missing control and an app that does not act"; "answers the original of a file from a file of the scope, and null for one outside it"; "drops the control with its host"; "sees the folder of its own root only and places a resource of the other root nowhere".
- `tests/server/machine/apps/tools/decorations.test.ts`: "joins the badges, the tooltips and the colour, and keeps what a throwing or silent provider leaves"; "drops a badge of three characters with a line in the host output, and a name with no badge, tooltip or colour"; "names a file as changed when its late provider answers, and decorates it from then on"; "asks for no file outside the folders of the scope"; "tells 10,000 change events of one turn as one change of every file"; "tells the files of a few events as those files"; "tells a change with no file as a change of every file"; "is asked for the files of its own root and none of another root".
- `tests/server/machine/apps/tools/workspace.test.ts`: "reads a file of the scope and refuses one outside every folder, one in a closed folder and one through a link out"; "writes a file of the scope in place, lists the write in History with the old bytes, and writes none outside"; "is followed by a tab that holds the file written, which reads the new bytes at its next poll"; "lists a folder without hidden or closed names, and finds files by glob in the folders of the scope only"; "creates a folder and deletes a file inside the scope, and refuses both in a closed folder"; "tells the host its workspace folders"; "are told to the host when a folder joins or leaves the workspace, once for each change"; "edits a file of the scope, and applies nothing when one of its files is outside or closed"; "writes no text when a file operation of the same edit is refused"; "tells the host of a file created in the scope that its glob matches"; "lists %s of %j in History as %j, and Undo puts the files back as they were"; "is refused closed when copied, renamed or deleted whole, and the hub is untouched"; "leaves out node_modules and what the Files view hides when undefined, nothing when null, and what a glob matches when it is one"; "selects the same files in a document selector, in findFiles and in a file watcher"; "selects a file whose name starts with a dot in a selector, as every glob of oculus does".
- `tests/server/machine/apps/tools/streams/streams.test.ts`: "sends a server one window of messages with no credit back, holds the rest, and sends more as credit comes"; "sends a terminal one window of bytes and holds the rest of a larger write"; "pauses the source when it holds data and resumes it when the queue is empty"; "closes a stream that holds more messages than its bound, with a line in the output"; "closes a terminal stream that holds more chunks than its bound, with a line in the output"; "grants credit back only when the handler of a message has settled"; "is dropped with a line in the output for data, control and close, and the host goes on"; "is dropped for a stream that closed, whose data no listener hears"; "refuses an id that is open, an id that closed, a bad id and a server stream nobody asked for"; "closes a server stream whose data is not one message object, with a line in the output"; "has every stream closed, each told to the host, and opens no more".
- `tests/server/machine/apps/tools/terminals/terminals.test.ts`: "is a row of the app with the output the host wrote, and what a page types reaches the host"; "is told the smallest size of the pages that show it, and the next smallest when that page leaves"; "ends with its exit code and a line in its output when the host ends it, and stays listed"; "ends when the host stops while a terminal of tmux the host made stays listed"; "is closed with the host by a crash, and every stream the host held is closed"; "drops data for an id it did not open with a line in its output, refuses the second open of an id that is open, and the host goes on"; "is held to the window of the stream while the page holds still, loses no byte once it reads, and the server answers other requests meanwhile".
- `tests/server/machine/apps/tools/terminals/terminals-tmux.test.ts`: "lists a shellPath terminal and a Pseudoterminal as terminals of the app, with the typing, output and size each way"; "keeps the shellPath terminal when the host stops while the Pseudoterminal ends, and tells the next host of the first"; "ends both kinds of terminal when the app is disabled".
- `tests/server/machine/apps/tools/terminals/terminals-page.test.ts`: "holds the host to its window plus the chunk in flight, and receives every byte in order once it reads"; "waits and reaches the host in order once the credit returns"; "ends the terminal when more than 8 MiB waits for the host".
- `tests/state/sessions/terminal/matchers.client.test.ts`: "completes a problem from one line, with its file, place, severity and message"; "completes a problem from several lines, and one more for every line a looping pattern reads"; "drops what the lines before held when a line does not match the pattern it waits for"; "forgets the problems of the round before when a background matcher reads the line that begins a round"; "drops a hit that names a file outside the repository, and keeps one inside it"; "reads the file:line: error shape when the command names no matcher"; "reads a pattern whose expression does not compile as one that never matches"; "are looked up in the app that runs the command first, then in the others, and a name no app declares is left out".
- `tests/state/sessions/terminal/show-focus.client.test.ts`: "asks no grid for the keyboard when preserveFocus is true, and the grid of that terminal when it is false".
- `tests/state/system/apps-tools/languages.client.test.ts`: "are asked of the server once each, and the kit holds the language, grammar and snippets once they arrive"; "are asked of the server again when the app changed, and not at all for an app that is disabled or whose files are not approved"; "are the shipped ones and those the servers of acting apps select, and none of an app that stopped acting".
- `tests/state/system/apps-tools/scm.client.test.ts`: "are listed in the order of the hosts, counted together, and found by app and id"; "show the status bar commands of the selected control only, and leave the selection when it is deselected"; "is sent as the command the picked entry names, and as its alternative with Alt"; "sends nothing for a pick that names no entry, and answers missing"; "is said as a sentence that names the command and why, when the server refuses it"; "%s is %s"; "names a word it has no sentence for".
- `tests/shell/commands/debug-toolbar.test.ts`: "draws Pause on while a thread runs and off while the program is paused"; "posts the pause action when Pause is pressed".
- `tests/data/helpers/files/languages-join.test.ts`: "stays the one the `languages:` map gives when an app glob matches the same name"; "is the language of the app glob for a name the map does not decide"; "is decided by an app glob before an app ending".
- `tests/routes/machine/debug.test.ts` (added): "lists the write of an existing launch.yml and undoes it to the old text"; "lists the folder and the file for a folder with no launch.yml and undoes the file".
- `tests/state/system/apps/page-commands.client.test.ts` (added): "is passed to the page with preserveFocus %s".

### G75 (the stream protocol)

- `streams/streams.test.ts` (the stream rows listed under G77), `terminals/host-end.test.ts`: "end when the host stops, though the program ignores SIGTERM and the close of its input"; "end when the host is killed, and the page is told the server is gone", `debug-adapters.test.ts`, `streams/server-backpressure.test.ts`: "is held to the window of the stream and its bound, loses no message, and the server gets them all in order once the host takes them", `terminals/terminals-page.test.ts`.

### G1 (the write token)

- `tests/server/machine/pty/channel.test.ts` (added): "refuses input from a socket that carried no token, and sends nothing to the host".
- `tests/routes/apps/app-manage.test.ts` (added, four rows): "%s is answered with its own result with the token and 403 without it" for `app-host decorate`, `scm`, `file` and `terminal`.

### G2 (what an app may reach)

- `workspace.test.ts`: "reads a file of the scope and refuses one outside every folder, one in a closed folder and one through a link out", "creates a folder and deletes a file inside the scope, and refuses both in a closed folder", "writes no text when a file operation of the same edit is refused", "is refused closed when copied, renamed or deleted whole, and the hub is untouched"; `decorations.test.ts`: "asks for no file outside the folders of the scope".

### G35 (terminals)

- `terminals/terminals-scope.test.ts`: "is acted on by that app and answered missing to every operation of another app"; "starts in the folder of the scope it names or the first one, and is refused a folder outside, a file and a name that is no variable"; "is refused with refused:full when the app holds 32, and the other app is not held to that"; "end with the app and the terminals of another app stay"; `terminals-tmux.test.ts`; `tasks.test.ts`; `tests/state/sessions/terminal/ending.client.test.ts`: "names its running debug session, its tasks and its terminals, each under the name the Terminal tab shows"; "names nothing of another app, nothing that ended and no session that is over"; "names no debug session run by the adapter of another app".

### G36 (language server lifetime)

- `streams/server-lifetime.test.ts`: "is waited for 30 s, not 29.999 s, and then ended with the page told no_answer"; "ends 60 s after the last tab of its root and language closed, and not at 59.999 s"; "is kept by a tab reopened at 30 s, and not ended while another tab of its root stays open"; "ends 60 s after the page closed, and is started again by a tab opened at 70 s"; "is started once for the tabs of one page and root, and once for each page"; "ends at once when its root stops being served, and the page is told root_gone"; "ends at once when the app stops acting and registers no server, and with the oculus server"; `languages.test.ts`; `terminals/host-end.test.ts`.

### G49 (manifest points and tool routes)

- `tests/server/machine/apps/manifest/manifest-tools.test.ts` (three tables, one `%s` row per outcome), `tools/routes.test.ts`: "is read as JSON when the manifest names it for that kind, comments and trailing commas allowed"; "is missing when the manifest does not name it for that kind, though the app holds it"; "is closed for an app that is disabled, one that was never approved and one that is not held"; "is host_down for a source control, a terminal and nothing else"; "is no action of the tools when it names no action, a path of no kind or too many paths to decorate"; `manifest-contributes.test.ts` (one row edited, see "Edits to existing assertions").

### G63 (document versions and saves)

- `tests/server/machine/lsp/versions.test.ts` (added, a second `describe` 'a save of a file the page holds'): "is sent to a server that ${row.name} as ${JSON.stringify(row.sent)}"; "is sent to no server for a file the page does not hold"; `languages.test.ts`: "is above every version sent before for the file, after a close and an open again".

### Other files with added titles

- `tests/state/system/apps/flows.test.ts` (added): "asks before it ends the debug session, the tasks and the terminals the app runs, naming each, and sends nothing until the reader says yes".
- `tests/server/machine/apps/host-manager.test.ts`: two rows (a debugger app with no host file gets the runner and no host file argument; an unapproved one is not started).

Test folders: `tests/server/machine/apps/tools/` holds `streams/` (3 files), `terminals/` (5 files) and 7 test files beside them, `tests/server/machine/apps/world/` the shared worlds, and the two client-state tests of the tools are in `tests/state/system/apps-tools/` because `tests/state/system/apps/` already holds 10 items (`sh utils/folder-check.sh` exits 0, output in "Checks"). `tests/server/machine/lsp/` keeps its save rows in `versions.test.ts` because G63 names that file.

Shared helpers written instead of copies, because `tests/checks/tree/duplication.test.ts` refuses a block of the same lines in two test files: `relaysMade()`, `states()` and the `capabilities` and `appServers` parameters of `makeRelay` in `tests/server/machine/lsp/lsp-fixture.ts`, `outcome`, `refused` and `offeredWith` in `manifest/manifest-fixture.ts`, `tmuxTerminals()` with its `until` in `world/tmux-terminals.ts`, `creditSender()` in `world/credit-sender.ts` (used by `terminals.test.ts` and `terminals-page.test.ts`), `stubbedCommands()` in `tests/state/sessions/terminal/commands-fixture.ts`.

## Code-line changes each entry needs (ruling 4, for the orchestrator at landing)

Each line is a path `guarded.md` names that moved or that the step adds. `guarded.md:8` (G1), `:50` (G75), `:56` (G77), `:84` (G36) and `:165` (G63) hold the Code lines that name moved paths.

- G1 (`guarded.md:8`), G36 (`:84`), G63 (`:165`): their Code lines name `src/lib/server/machine/lsp/relay.ts`; it is now `src/lib/server/machine/lsp/relay/relay.ts` and the modules beside it (`relay-apps.ts`, `relay-join.ts`, `relay-life.ts`, `relay-make.ts`, `relay-options.ts`, `relay-pages.ts`, `relay-route.ts`, `relay-server.ts`, `relay-state.ts`). G1 (`:8`) and G58 (`:135`) also name `src/lib/server/files/fs/lsp-edit.ts`, which has not moved.
- G63 gains `src/lib/server/machine/lsp/held/documents.ts` (`saveDocument`), `relay/relay-route.ts` (`didSave`) and `relay/relay-join.ts`, `relay-apps.ts` (the versions sent to an app's server).
- G75 (`guarded.md:50`): `host/host-runner.mjs` is now `src/lib/server/machine/apps/host/runner/host-runner.mjs`; it gains `src/lib/server/machine/apps/tools/streams.ts` and `src/lib/server/machine/apps/host/runner/streams.mjs`.
- G77 (`guarded.md:56`): `host/runner-shell.mjs` is now `src/lib/server/machine/apps/host/runner/runner-shell.mjs`; it gains `apps/tools/{languages,debug,scm,decorations,scope,registry,routes,streams}.ts`, `apps/tools/workspace/{workspace,writes}.ts`, `apps/tools/run/{tasks,terminals,terminals-env,stream-terminals,stream-actions}.ts`, `apps/host/runner/tools/`, `src/lib/server/machine/debug/app/`, `debug/launch/write.ts`, `src/lib/state/system/apps/tools/`, `src/lib/state/sessions/terminal/pty/matchers.ts`, `src/lib/server/files/fs/ops.ts` (the writer the tools use) and `src/lib/server/files/fs/operations/{replace,ops-shape}.ts`.
- G2 gains `apps/tools/workspace/*.ts`, `apps/tools/scope.ts`, `apps/tools/decorations.ts`.
- G35 gains `apps/tools/run/terminals.ts`, `terminals-env.ts`, `stream-terminals.ts`, `src/lib/state/sessions/terminal/terminal-lists.ts` (`endingOf`).
- G49 gains `read/contributes/{place,reader-tools,shape-tools}.ts`, `read/across/languages.ts`, `read/tool-files/tool-files.ts`, `apps/tools/routes.ts`.

## Edits to existing assertions, allow lists and predicates (before and after)

- `tests/server/machine/apps/manifest/manifest-contributes.test.ts`: the row for a menu the reader drops used `scm/title`; it now uses `scm/inputBox`, and its expected finding `words('contributes_menu_dropped', 'scm/title')` is now `words('contributes_menu_dropped', 'scm/inputBox')`. Reason: `scm/title` is a menu oculus draws after this step, `scm/inputBox` is one it does not. The same file imports `outcome`, `refused` and `offeredWith` from `manifest-fixture.ts` instead of defining them.
- `tests/checks/tree/boundaries.test.ts`: the `ui` row of the allowed imports gains `'data/helpers/files/apps/tools/language-kit'` (before: absent; after: listed, with a comment saying the editor's kit takes the kit types and the schema glob rule from a module with no reader and no I/O); the FROZEN list of module-level state gains `lib/ui/controls/editor/kit/languages/apps.svelte.ts:held`, `:signature` and `:version` (before: absent; Monaco registers a language once per page, so the kit last given, its text and the redraw count are page state); `SHELL_STORES` gains `'appTools'` (before: `..., 'apps'`; after: `..., 'apps', 'appTools'`); the expression of `findGlobalState` reads `new (?:Map|Set|WeakMap|WeakSet)\b` (before: `new (?:Map|Set)\b`, so a module-level WeakMap or WeakSet was not seen). This widens what the check finds; no allowed hit was added to any list for it.
- `config/catalogs/icons.yml`: a row `debug_pause` after `debug_start`, matching the new glyph in `glyphs.yml` in the same order.
- `tests/routes/apps/app-manage.test.ts`: four rows added to the table of token-guarded routes (G1 above); no existing row changed.
- `tests/server/machine/apps/tools/debug-adapters.test.ts`: the table of declared capabilities (`ALL`) no longer lists `supportsPauseRequest` (before: listed; after: absent, since no code reads it), and a row "pauses a running thread of an adapter that declared nothing" asserts `pause` is sent with `{ threadId: 1 }` for an adapter that declared only `supportsConfigurationDoneRequest`.
- `tests/state/system/apps/shell.test.ts` and `contributions.test.ts`: the fixtures gained `...noContributes()` and `scmItems: () => []`; `tests/state/system/apps/page-commands.client.test.ts` gained `saveAll`, `showTerminal` and `hideTerminal` stubs; `tests/state/client/terminal/terminal-close.test.ts` and `tests/fixtures/sessions-fixture.ts` gained `app: ''` on a terminal row; `tests/state/system/apps/flows.test.ts` gained an `ending` argument in its builder. These add fields the stores now require; no assertion changed.
- `tests/state/sessions/served-roots.client.test.ts`: the commands store is built by `stubbedCommands(() => listed)` of the shared fixture (which passes `matchers: () => []`); before it built `createCommands({...})` by hand without `matchers`. No assertion changed.
- `tests/server/machine/lsp/lifetime.test.ts`: the suite's `beforeEach`, `afterEach` and `states()` moved to `lsp-fixture.ts` as `relaysMade()` and `states()`; the assertions are unchanged. `lsp-fixture.ts` `makeRelay` gained the optional `capabilities` and `appServers` parameters; callers that pass neither are unchanged.
- `tests/server/machine/apps/world/hosts-world.ts` (moved from `tests/server/machine/apps/hosts-world.ts`) gained the `ops`, `history`, trash spy, `watchFolder`, `more` and `privateReal` members the writes rows use, and `manualClock()`; `world/hosts-fixture.ts` (moved) gained the `ops` argument; `world/tmux-terminals.ts` returns `until`.
- Predicates, thresholds, allow lists and tolerances other than the ones above: none changed. `tests/checks/tree/duplication.test.ts` and `allow-duplication.txt` are unchanged.

## Unused exports (`sh utils/unused-exports.sh`, compared with the base's `unused-exports.txt`)

`diff $BASE/unused-exports.txt <output>` prints these differences, and no other:

- `src/lib/state/sources/repositories/repositories.ts: validName, worktreePath, stashUrl, worktreeDiffUrl, isConflict, currentBranch` in the base is `validName, worktreePath, isConflict, currentBranch` now (`stashUrl` and `worktreeDiffUrl` are imported by `diff/subject.ts`).
- `src/lib/data/model/index.ts` and `model-sessions.ts` no longer list `CommandSeverity` (it is used).
- `src/lib/ui/controls/editor/kit/languages/folding.ts: FOLDING_LANGUAGES, foldingRanges, FoldingRange` and `.../languages/grammars.ts: SHIKI_NAMES`: the base lists the same names under `kit/folding.ts` and `kit/grammars.ts`; the files moved into `kit/languages/`, the names are unchanged.
- The headers print `Unused exports (243)` and `Unused exported types (117)`, the same counts as the base file. The script adds no line against the base: `BYTE_WINDOW`, `MESSAGE_WINDOW` and `AppStreamLike` are local.

Every export the step added that nothing outside its file and its tests imports was made local or removed (62 names found by `unused-exports.sh` and `tsc` in the first pass, among them `joinLanguageDefaults`, `snippetsOf`, `firstLineOf`, `AppLanguageIcon`, `DECORATE_MAX`, `RING_BYTES`, `TASKS_MAX`, `TERMINALS_MAX`, `ScmChange`, `StreamControl`, `StreamKind`, `appEntryId`, `languagesOf`, `streamChild`, `severityOf`, `scmStatusItems`, `SEMANTIC_MODIFIERS`, `SEMANTIC_TYPES`, `TerminalMenu`); the definitions `filtersOf`, `isStartKind`, `START_KINDS`, `DecorationsStore`, `LanguagesStore`, `ScmStore` and the `ToolsScope` re-export of `scm.ts` had no user and were deleted.

## Verbose timings (ruling 5)

Command: `npx vitest run <the 29 files above> --reporter verbose --testTimeout 60000 --hookTimeout 60000` with nothing else running (`r1out/verbose-final.txt`): `Test Files  29 passed (29)`, `Tests  340 passed (340)`, `Duration  16.98s`. Slowest case of each changed file, from the verbose line of each passed case (cases at or above 300 ms are named below the table):

| File | Cases | Slowest case |
| --- | --- | --- |
| `tests/server/machine/apps/tools/debug-adapters.test.ts` | 18 | 190 ms |
| `tests/server/machine/apps/tools/decorations.test.ts` | 8 | 227 ms |
| `tests/server/machine/apps/tools/languages.test.ts` | 15 | 369 ms |
| `tests/server/machine/apps/tools/routes.test.ts` | 5 | 44 ms |
| `tests/server/machine/apps/tools/scm.test.ts` | 8 | 112 ms |
| `tests/server/machine/apps/tools/streams/server-backpressure.test.ts` | 1 | 2281 ms |
| `tests/server/machine/apps/tools/streams/server-lifetime.test.ts` | 7 | 12 ms |
| `tests/server/machine/apps/tools/streams/streams.test.ts` | 11 | 4 ms |
| `tests/server/machine/apps/tools/tasks.test.ts` | 6 | 297 ms |
| `tests/server/machine/apps/tools/terminals/host-end.test.ts` | 2 | 153 ms |
| `tests/server/machine/apps/tools/terminals/terminals-page.test.ts` | 3 | 17 ms |
| `tests/server/machine/apps/tools/terminals/terminals-scope.test.ts` | 4 | 39 ms |
| `tests/server/machine/apps/tools/terminals/terminals-tmux.test.ts` | 3 | 844 ms |
| `tests/server/machine/apps/tools/terminals/terminals.test.ts` | 7 | 309 ms |
| `tests/server/machine/apps/tools/workspace.test.ts` | 22 | 377 ms |
| `tests/server/machine/lsp/versions.test.ts` | 9 | 11 ms |
| `tests/routes/machine/debug.test.ts` | 4 | 1236 ms |

Cases at or above 300 ms: `terminals-tmux.test.ts` "ends both kinds of terminal when the app is disabled" 844 ms (module tagged slow); `server-backpressure.test.ts` 2281 ms (tagged slow); `debug.test.ts` "runs a debug launch only after its exact text is approved" 1236 ms (module tagged slow, not a case of this round); `languages.test.ts` "is sent to the server of an app that declared save, with the text when it asked for it" 369 ms and `workspace.test.ts` "selects the same files in a document selector, in findFiles and in a file watcher" 377 ms, "tells the host of a file created in the scope that its glob matches" 320 ms (both files module tagged slow); `terminals.test.ts` "is held to the window of the stream while the page holds still, ..." 309 ms. Every case of a file that is not tagged slow ran under 0.7 s. The `measured:` lines printed: `the host could send 1048576 bytes before the page read any (window 1048576); at most 1048576 bytes unread at once; 52428800 of 52428800 bytes delivered` (case 17), `the host could send 1024 bytes before the page read any (window 1024, chunk 128); 102400 of 102400 bytes received` (`terminals-page.test.ts`), `the host was sent 13 of 10000 didChange messages before it took any; the stream held at most 499 (window 16, bound 4096); 10000 arrived` (ruling 15).

## History-word grep (ruling 4; spec.md line 43)

Command: `python3 histgrep.py` from `.agents/worktrees` (scratchpad): every line this tree adds or changes against the base under `src`, `tests`, `config` and `utils` (a moved file counts whole), kept when it is a comment line or a test title and matches `before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands`. Output, the first line then every hit as `path:line: text`:

```
33207 added lines; 120 hits
src/lib/ui/controls/editor/kit/load.ts:514: // changed, or one that no longer loads, never stops the paint: the models of the language
src/lib/ui/controls/editor/kit/lsp/client.ts:241: * failed or not found, so a server that fails does not unmark what another still serves.
src/lib/ui/controls/editor/kit/languages/folding.ts:5: // before its matching `}`; a block of fewer than two lines gives none. Braces inside strings and
src/lib/ui/controls/editor/kit/languages/folding.ts:7: // `protected:` or `private:` opens a range to the line before the next such label of the same
src/lib/ui/controls/editor/kit/languages/folding.ts:8: // block, or before the block's closing brace.
src/lib/ui/controls/editor/kit/languages/folding.ts:47: /** A brace block still open: its first line, and the line of its latest access label. */
src/lib/ui/controls/editor/kit/languages/folding.ts:50: /** The braces of one line, in order, with whether a block comment is still open at its end. */
src/lib/ui/controls/editor/kit/languages/app-grammars.ts:8: // shipped grammar is kept for it, and its `injectTo` grammar still injects. The grammar's own
src/lib/ui/controls/editor/kit/languages/register.ts:23: /** Put the kit into Monaco, taking away what `before` put in. */
src/lib/ui/controls/editor/kit/languages/apps.svelte.ts:15: /** The kit before any app gave anything: the languages the shipped servers serve. */
src/lib/server/core/channels.ts:177: * when every page has taken what was published. A source of a byte stream waits on it before it
src/lib/server/edit/writes/file-undo.ts:11: //   replaced a file names the replaced bytes in `before` and is taken back as a `replace` is.
src/lib/server/machine/lsp/schema-feed.ts:6: // It is told when a set of schemas differs from the one before, so it asks its YAML servers for
src/lib/server/machine/lsp/adapters/entry.ts:188: * How many times a server that exits on its own is started again within three minutes before
src/lib/server/machine/lsp/adapters/entry.ts:195: * The diagnostics of a file before the page sees them: the `publishDiagnostics` params with
src/lib/server/machine/lsp/adapters/entry.ts:200: * An answer of the server to a request of the page, by the request's method, before it goes
src/lib/server/machine/lsp/adapters/entry.ts:206: * before the request goes to the server. The result or the error is the page's answer; nothing
src/lib/server/machine/lsp/relay/relay-life.ts:3: // them over (relay-pages.ts). A root that is no longer served ends its servers and each page is
src/lib/server/machine/lsp/relay/relay.ts:14: // - relay-life.ts: a root no longer served, a changed `lsp` folder, changed settings, and a server
src/lib/server/machine/lsp/relay/relay.ts:88: /** The served roots changed: the server of a root no longer served ends. */
src/lib/server/machine/lsp/relay/relay-route.ts:532: * Put a document on its servers. `existed` is whether a server was there before this document:
src/lib/server/machine/lsp/relay/relay-apps.ts:201: /** The entry with this id, if its server is still registered. */
src/lib/server/machine/lsp/relay/relay-server.ts:227: * registered with the page's client are withdrawn unless another server of the page still
src/lib/server/machine/apps/tools/scope.ts:204: * that exists must lie in the scope and be open, and the folders still to make are named under
src/lib/server/machine/apps/tools/debug.ts:6: // (`oculus/debug/configurations`) and for a configuration resolved before and after its
src/lib/server/machine/apps/tools/decorations.ts:27: /** How long a request waits for the providers before it answers what it has. */
src/lib/server/machine/apps/tools/decorations.ts:33: /** The most files the payload names before every file is told as changed. */
src/lib/server/machine/apps/tools/registry.ts:9: // Everything a host registers is judged here before it is held: the app must be approved and
src/lib/server/machine/apps/tools/registry.ts:55: /** How long a Save All waits for a page to answer before it gives up. */
src/lib/server/machine/apps/tools/registry.ts:346: /** Make a host start (an activation event) before a server is asked of it. */
src/lib/server/machine/apps/tools/streams.ts:35: /** The most messages a stream with no credit holds before it is closed. */
src/lib/server/machine/apps/tools/workspace/workspace.ts:7: // Every URI is judged by the scope (scope.ts) before anything is read or written: one outside the
src/lib/server/machine/apps/tools/workspace/workspace.ts:330: // Every file operation is judged before any text is written, so a refused one leaves
src/lib/server/machine/apps/tools/workspace/writes.ts:9: // folders above it is one `create` whose name holds the folders still to make. A rename inside a
src/lib/server/machine/apps/tools/run/stream-terminals.ts:28: /** The most typed bytes that wait for the host's credit before the terminal is ended. */
src/lib/server/machine/apps/tools/run/tasks.ts:49: /** How long a provider may take to give its tasks before the listing goes on without them. */
src/lib/server/machine/apps/tools/run/tasks.ts:130: /** How long a terminal may stay out of the list after its run began before the run is over. */
src/lib/server/machine/apps/tools/run/tasks.ts:639: // A list taken before the terminal started does not hold it yet.
src/lib/server/machine/apps/tools/run/terminals.ts:5: // terminal is still the app's and the host is told of it again (`oculus/terminals/list`). One made
src/lib/server/machine/apps/host/runner/runner-shell.mjs:8: // It is plain JavaScript that the runner (host-runner.mjs) imports before it installs its
src/lib/server/machine/apps/host/runner/streams.mjs:22: /** The most messages a stream with no credit holds before it is closed. */
src/lib/server/machine/apps/host/runner/streams.mjs:51: /** What the host may still send oculus. */
src/lib/server/machine/apps/host/runner/tools/decorations.mjs:15: /** The milliseconds changes are gathered for before they are sent: one animation frame. */
src/lib/server/machine/apps/host/runner/tools/index.mjs:5: // it before it installs its import guard and merges what it returns with the shell part.
src/lib/server/machine/apps/host/runner/tools/languages/convert.mjs:6: // a text is a string or a `MarkdownString`. The runner imports it before it installs its import
src/lib/server/machine/apps/host/runner/tools/languages/servers.mjs:31: * `exit`, SIGTERM two seconds after and SIGKILL five seconds after `exit`) before it closes the
src/lib/server/machine/apps/host/runner/tools/languages/servers.mjs:359: * ends it, as it does a server it stops itself; the streams still open `STOP_MS` later are
src/lib/server/machine/apps/host/runner/values/run.mjs:5: // when they cross to oculus. The runner imports it before it installs its import guard.
src/lib/server/machine/apps/host/runner/values/uri.mjs:5: // plain JavaScript that the runner imports before it installs its import guard.
src/lib/server/machine/apps/host/runner/values/text.mjs:5: // converts. The runner imports it before it installs its import guard.
src/lib/server/machine/apps/host/runner/values/features.mjs:5: // the protocol's is `languages/convert.mjs`. The runner imports it before it installs its guard.
src/lib/server/machine/apps/host/runner/values/document.mjs:4: // ranges of the text and raises the version. The runner imports it before it installs its import
src/lib/server/machine/apps/host/runner/values/position-range.mjs:3: // runner imports it before it installs its import guard.
src/lib/server/machine/apps/host/runner/values/events.mjs:4: // output without stopping the rest. The runner imports it before it installs its import guard.
src/lib/server/machine/runs/commands/resolve.ts:8: // they are about, before anything starts: an app's task runs in a terminal of its own, so it is
src/lib/server/machine/runs/commands/files.ts:280: /** The task of a typed entry before the app that defines its type has resolved it. */
src/lib/server/machine/runs/commands/run.ts:20: // same for a line still running once the reader confirmed the process that would be stopped; for
src/lib/server/machine/debug/app/filters.ts:4: // same debugger type, so a filter switched on stays on; before any choice the adapter's defaults
src/lib/server/machine/debug/app/resolve.ts:1: // Layer 2, server. What a launch of an app's debugger does to a `launch.yml` entry before the
src/lib/server/machine/debug/launch/read.ts:3: // before? }`. An entry without a `type`, or with `type: rite`, runs oculus's own adapter on a
src/lib/server/machine/debug/launch/read.ts:5: // declares; its keys beside `name`, `type`, `request`, `program`, `cwd` and `before` are the
src/lib/server/machine/debug/session/start.ts:1: // Layer 2, server. What a launch does before the client starts a session: the configuration is
src/lib/server/machine/debug/session/start.ts:6: // starts is its own. The app's providers resolve the configuration before and after its
src/lib/server/machine/debug/session/types.ts:76: /** The thread the commands name: the one the adapter last stopped, `THREAD` before any. */
src/lib/server/machine/debug/session/types.ts:151: * The milliseconds an app's adapter has to end after it was told to, before its stream is closed.
src/lib/server/machine/debug/session/send.ts:4: // declared, and an answer is dropped when the run it was asked in is no longer the current one.
src/lib/server/machine/debug/session/controls.ts:35: * Read the variables and the watch again in a frame, if the pause is still the one asked in.
src/lib/server/root/process/context/app-feed.ts:2: // relay. The relay is made before the hosts, and the hosts start after the server listens, so the
src/lib/server/files/fs/ops.ts:29: // before it kept in the local history so the undo can write it back. The Replace Preview is the
src/lib/server/files/fs/operations/replace.ts:11: // before anything is written. The text written for a match is computed here from the current groups
src/lib/server/files/fs/operations/replace.ts:18: // `changed`. A list of files stops at the first refusal and names the files done before it and the
src/lib/server/files/fs/operations/replace.ts:22: // places they were made before the file is written through the same atomic write a save uses. The
src/lib/server/files/fs/operations/replace.ts:28: // also carries the line and place it had before (`was`), found by moving its byte offset back over
src/lib/server/files/fs/operations/replace.ts:64: /** A refusal before or at a file. */
src/lib/server/files/fs/operations/replace.ts:82: /** The local history folder a copy is kept in before a file is written; none keeps none. */
src/lib/server/files/fs/operations/replace.ts:133: * file that is to be written is refused `denied` when its mode locks it, before its bytes are
src/lib/server/files/fs/operations/replace.ts:361: * moved over the splices before it, and its end after its own text.
src/lib/server/files/fs/operations/ops-shape.ts:2: // server/files/fs/ops.ts reads a request with before any operation runs.
src/lib/state/shared/stores/shapes.ts:91: /** What the running hosts registered with the tools, or null before a push. */
src/lib/state/system/machine/lsp/lsp.svelte.ts:148: * registered, or null before any said anything.
src/lib/state/system/machine/debug/debug.svelte.ts:14: // stops with the tab's own message when one is not saved. A configuration that names a `before`
src/lib/state/system/machine/debug/debug-file.ts:8: // its debugger's other configurations are still offered. The server appends the chosen one to the
src/lib/state/system/apps/tools/scm.svelte.ts:160: /** Leave the selection when it is still this control's, so a later one is not undone. */
src/lib/state/sessions/source/autosave.svelte.ts:18: // tabs it could not save are the ones the close still asks about. An app's `workspace.saveAll` asks
src/lib/state/sessions/terminal/commands.svelte.ts:36: // printed after a pane stopped reading are not lost. Output a pane hands over before the sessions
src/lib/state/sessions/terminal/commands.svelte.ts:38: // prints a marker before each command, the run's token and the command's name, and the output is
src/lib/state/client/entities.svelte.ts:117: /** What the running hosts registered with the tools, or null before a push. */
src/lib/data/model/machine/model-debug.ts:130: /** The session running or the last one that ran since the server started; null before any. */
src/lib/data/model/machine/model-debug.ts:145: /** The adapter of the session, null before any. */
src/lib/data/model/machine/model-debug.ts:189: /** The keys beside `name`, `type`, `request`, `program`, `cwd` and `before`, as written. */
src/lib/data/model/machine/model-machine.ts:42: /** When the rows were read; empty before the first good read. */
src/lib/data/model/machine/model-machine.ts:166: * The id of the terminal the run started; for a skipped run, of the earlier run that was still
src/lib/data/model/machine/model-machine.ts:167: * working; null for a run still being started and for a failed one.
src/lib/data/model/machine/model-machine.ts:250: * the output of a terminal the page keeps before it hears of the terminal.
src/lib/data/model/machine/model-machine.ts:257: * page checks a comment against the same expression before it types or copies it.
src/lib/data/model/machine/model-machine.ts:339: * What a build or a clean of one main file asks the reader to approve before it starts: the
src/lib/data/model/machine/model-machine.ts:448: * language (`unknown`), the root is not served any more (`not_served`), the path is no longer a
src/lib/data/helpers/files/languages.ts:22: // before a first line does.
src/lib/data/helpers/files/languages.ts:42: * alone, which decides before an app's glob does, and `added` holds the ids of the languages the
src/lib/data/helpers/files/apps/tools/decoration-colors.ts:3: // colour, so a decoration of an unknown id still shows its badge and tooltip. The git extension's
src/lib/views/sources/repositories/Repositories.svelte:140: /** The source controls the apps' hosts created, and the one this tab shows, if it still is. */
src/lib/views/sources/repositories/diff/HunkBar.svelte:9: // menu before them.
src/lib/views/sources/repositories/apps/AppSourceRow.svelte:34: /** A press, told before it runs anything: true when it only changed the selection. */
tests/server/machine/lsp/lsp-fixture.ts:304: * Start the fake clock before each test and close, after each, the relays a test pushed on the
tests/server/machine/apps/tools/debug-adapters.test.ts:513: it('resolves a configuration before and after its placeholders are filled, and aborts the launch of one a provider answers nothing for', async () => {
tests/server/machine/apps/tools/languages.test.ts:156: // server only when the refused ones before it were dealt with.
tests/server/machine/apps/tools/languages.test.ts:480: it('is above every version sent before for the file, after a close and an open again', async () => {
tests/server/machine/apps/tools/decorations.test.ts:191: // What the host sent before this answer has been heard when it arrives.
tests/server/machine/apps/tools/routes.test.ts:9: // write token that stands before all of them (tests/routes/apps/app-manage.test.ts) and the source
tests/server/machine/apps/tools/terminals/terminals.test.ts:167: // before the answer to this second open arrives.
tests/server/machine/apps/tools/terminals/terminals.test.ts:183: it('is held to the window of the stream while the page holds still, loses no byte once it reads, and the server answers other requests meanwhile', async () => {
tests/server/machine/apps/tools/terminals/terminals.test.ts:187: // The page holds still: its listener settles when the gate opens.
tests/server/machine/apps/tools/terminals/terminals.test.ts:229: // oculus granted before it would have arrived first, so the bytes sent by now are what the
tests/server/machine/apps/tools/terminals/terminals.test.ts:230: // window allowed while the page held still.
tests/server/machine/apps/world/language-app.ts:33: /** Milliseconds a request waits before it is answered. */
tests/state/system/apps/flows.test.ts:112: it('asks before it ends the debug session, the tasks and the terminals the app runs, naming each, and sends nothing until the reader says yes', async () => {
tests/state/sessions/terminal/matchers.client.test.ts:4: // a background matcher forgets the problems of the round before when a new round begins, a hit that
tests/state/sessions/terminal/matchers.client.test.ts:133: it('drops what the lines before held when a line does not match the pattern it waits for', () => {
tests/state/sessions/terminal/matchers.client.test.ts:140: it('forgets the problems of the round before when a background matcher reads the line that begins a round', () => {
tests/data/helpers/files/languages-join.test.ts:49: it('is decided by an app glob before an app ending', () => {
```

I read each of the 120 hits. Every one is an ordinary use of the word: a sequence in time inside the code ("before anything starts", "before the request goes to the server", "before a push", "the round before" for a background matcher's previous round, "before each test"), a test title ("asks before it ends ...", "is above every version sent before for the file ...", "is decided by an app glob before an app ending"), the field `before` of a launch configuration or of a History record, or "still" meaning "yet" ("still open", "still registered"). None compares the code with an earlier state of the code. `tests/checks/source/history.test.ts` passes (`Tests  3 passed (3)` when run alone, and `Tests  100 passed (100)` over `tests/checks/source`, `tests/checks/tree` and `tests/checks/imports` after the last edit).

## Checks (as printed, from `tools/oculus`)

```
$ npx vitest run tests/checks --testTimeout 0 --hookTimeout 0     (r1out/checks2.txt)
     x validates with no findings                                              (integrity.test.ts, hub .oculus/ missing)
     x names a group of its own and a path under the hub for every document    (config-folder.test.ts, docs: [])
 Test Files  2 failed | 15 passed (17)
      Tests  2 failed | 264 passed (266)
   Duration  510.76s
$ npx vitest run tests/checks/source tests/checks/tree tests/checks/imports --testTimeout 0 --hookTimeout 0   (after the last edit)
 Test Files  10 passed (10)
      Tests  100 passed (100)
$ npm run diagrams
docs/diagrams/writes.svg
diagrams exit 0 seconds 334          (18 files under docs/diagrams written)
$ npm run test:quick -- --base a9641a30b
test:quick: 364 changed file(s), from git since a9641a30b
test:quick: 181 test file(s), 10 essential
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (3.0 s)
ok      prettier (5.4 s): All matched files use Prettier code style!
ok      eslint (9.0 s)
ok      svelte-check (7.3 s): 1791841713457 COMPLETED 486 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (63.8 s): Duration  56.41s (transform 57.90s, setup 0ms, import 99.73s, tests 115.52s, environment 850ms)
test:quick: 64.7 s (limit 45.0 s); every command passed
test:quick: over the time limit
$ sh utils/folder-check.sh; echo "folder-check exit $?"
folder-check exit 0
$ sh utils/unused-exports.sh > out; diff $BASE/unused-exports.txt out
(the differences listed under "Unused exports"; headers "Unused exports (243)" and "Unused exported types (117)")
$ LC_ALL=C grep -rIn '[^ -~[:space:]]' src tests config utils DESIGN.md HELP.md README.md docs | grep -v local.yml | grep -v '^docs/diagrams'
config/catalogs/unimath.yml:1:   (the same single line the base holds: the Unicode math symbols the LaTeX completion offers)
$ find src tests -type f ( *.ts *.mjs *.svelte ) | xargs wc -l | awk (a source over 880 lines or a component over 520)
(no output)
$ npx tsc --noEmit -p . | grep -v CardAction
(no output)
$ npx vitest run tests/server/machine/apps/tools/debug-adapters.test.ts
 Test Files  1 passed (1)
      Tests  18 passed (18)
```

What these runs do not cover: the focused DOM element of ruling 22, the look of every page, the Electron app, a real language server of an app other than the scripted ones, the tests tagged slow in `npm run test:quick` (the files named under "Tests per guarded entry" run only by `npm run test:slow` and by the verbose run above), and the two checks that depend on the hub's `.oculus/` data. `npm run test:slow` was not run (a builder does not run it); the same files passed in the verbose run above with a test timeout of 60 s.

## Files (from `diff -rq` of the base copy against this tree, `local.yml` excluded; lines = `wc -l`)

The write list of the step is `tools/oculus/{src,tests,config/text,config/catalogs,HELP.md,DESIGN.md,README.md,docs,demo}`. Every path below lies under it, `utils/` holds no change, and `README.md` is unchanged. Outside the table: `DESIGN.md` (731 lines), `HELP.md` (479), `docs/apps.md` (1009), the 18 regenerated files `docs/diagrams/*.dot` and `*.svg`, and this report (`tools/oculus/.scratch/migration/agents/reviews/D64-report.md`), the only path outside the write list. The table lists files under `config`, `src`, `tests` and `utils` from `python3` comparing the two trees byte for byte; "base only" rows are files the base holds and this tree does not (moved or removed): `src/lib/data/model/model-apps.ts` and `model-machine.ts` (now `data/model/apps/` and `data/model/machine/`), `src/lib/server/files/fs/replace.ts` (now `fs/operations/replace.ts`), `host/host-runner.mjs` and `runner-shell.mjs` (now under `host/runner/`), `debug/launch.ts` (now `debug/launch/read.ts`), `lsp/relay-options.ts` and `relay.ts` (now `lsp/relay/`), `kit/folding.ts` and `grammars.ts` (now `kit/languages/`), `tests/server/machine/apps/hosts-fixture.ts` and `hosts-world.ts` (now `tests/server/machine/apps/world/`).

| Path | State | Lines |
| --- | --- | --- |
| `config/catalogs/glyphs.yml` | changed | 277 |
| `config/catalogs/icons.yml` | changed | 276 |
| `config/text/app.yml` | changed | 265 |
| `config/text/findings.yml` | changed | 334 |
| `config/text/server.yml` | changed | 392 |
| `config/text/statusbar.yml` | changed | 237 |
| `config/text/views/apps/apps.yml` | changed | 181 |
| `config/text/views/sessions/terminal.yml` | changed | 110 |
| `config/text/views/shared/commands.yml` | changed | 54 |
| `config/text/views/sources/repositories.yml` | changed | 314 |
| `config/text/views/sources/source.yml` | changed | 229 |
| `config/text/views/system/machine/debug.yml` | changed | 92 |
| `src/lib/data/helpers/editor/editor.ts` | changed | 160 |
| `src/lib/data/helpers/files/apps/apps.ts` | changed | 285 |
| `src/lib/data/helpers/files/apps/contributes.ts` | changed | 32 |
| `src/lib/data/helpers/files/apps/tools/debuggers.ts` | new | 107 |
| `src/lib/data/helpers/files/apps/tools/decoration-colors.ts` | new | 50 |
| `src/lib/data/helpers/files/apps/tools/editor-defaults.ts` | new | 108 |
| `src/lib/data/helpers/files/apps/tools/language-kit.ts` | new | 194 |
| `src/lib/data/helpers/files/apps/tools/languages.ts` | new | 130 |
| `src/lib/data/helpers/files/apps/tools/scope-names.ts` | new | 52 |
| `src/lib/data/helpers/files/languages.ts` | changed | 191 |
| `src/lib/data/helpers/keys/oculus-keys.ts` | changed | 88 |
| `src/lib/data/helpers/keys/oculus/resolve.ts` | changed | 365 |
| `src/lib/data/helpers/run/tasks.ts` | changed | 14 |
| `src/lib/data/model/apps/model-apps-tools.ts` | new | 319 |
| `src/lib/data/model/apps/model-apps.ts` | new | 285 |
| `src/lib/data/model/index.ts` | changed | 771 |
| `src/lib/data/model/machine/model-debug.ts` | new | 207 |
| `src/lib/data/model/machine/model-machine.ts` | new | 763 |
| `src/lib/data/model/model-apps.ts` | base only | - |
| `src/lib/data/model/model-machine.ts` | base only | - |
| `src/lib/data/model/model-sessions.ts` | changed | 747 |
| `src/lib/data/prose/languages.ts` | changed | 162 |
| `src/lib/data/prose/lsp-servers.ts` | changed | 286 |
| `src/lib/data/shapes/shapes.ts` | changed | 324 |
| `src/lib/data/sources/config/editor-options.ts` | changed | 230 |
| `src/lib/server/core/channels.ts` | changed | 276 |
| `src/lib/server/edit/writes/file-undo.ts` | changed | 304 |
| `src/lib/server/files/fs.ts` | changed | 484 |
| `src/lib/server/files/fs/lsp-edit.ts` | changed | 160 |
| `src/lib/server/files/fs/operations/ops-shape.ts` | new | 97 |
| `src/lib/server/files/fs/operations/replace.ts` | new | 496 |
| `src/lib/server/files/fs/ops.ts` | changed | 810 |
| `src/lib/server/files/fs/replace.ts` | base only | - |
| `src/lib/server/files/search/search.ts` | changed | 647 |
| `src/lib/server/machine/apps/host/connection.ts` | changed | 146 |
| `src/lib/server/machine/apps/host/host-runner.mjs` | base only | - |
| `src/lib/server/machine/apps/host/manager.ts` | changed | 774 |
| `src/lib/server/machine/apps/host/plan.ts` | changed | 75 |
| `src/lib/server/machine/apps/host/process.ts` | changed | 226 |
| `src/lib/server/machine/apps/host/published.ts` | new | 24 |
| `src/lib/server/machine/apps/host/runner-shell.mjs` | base only | - |
| `src/lib/server/machine/apps/host/runner/host-runner.mjs` | new | 254 |
| `src/lib/server/machine/apps/host/runner/runner-shell.mjs` | new | 585 |
| `src/lib/server/machine/apps/host/runner/streams.mjs` | new | 270 |
| `src/lib/server/machine/apps/host/runner/tools/children.mjs` | new | 31 |
| `src/lib/server/machine/apps/host/runner/tools/debug.mjs` | new | 345 |
| `src/lib/server/machine/apps/host/runner/tools/decorations.mjs` | new | 130 |
| `src/lib/server/machine/apps/host/runner/tools/index.mjs` | new | 165 |
| `src/lib/server/machine/apps/host/runner/tools/languages/convert.mjs` | new | 361 |
| `src/lib/server/machine/apps/host/runner/tools/languages/providers.mjs` | new | 834 |
| `src/lib/server/machine/apps/host/runner/tools/languages/servers.mjs` | new | 414 |
| `src/lib/server/machine/apps/host/runner/tools/scm.mjs` | new | 284 |
| `src/lib/server/machine/apps/host/runner/tools/tasks.mjs` | new | 262 |
| `src/lib/server/machine/apps/host/runner/tools/terminals.mjs` | new | 276 |
| `src/lib/server/machine/apps/host/runner/tools/workspace.mjs` | new | 371 |
| `src/lib/server/machine/apps/host/runner/values/document.mjs` | new | 161 |
| `src/lib/server/machine/apps/host/runner/values/events.mjs` | new | 115 |
| `src/lib/server/machine/apps/host/runner/values/features.mjs` | new | 370 |
| `src/lib/server/machine/apps/host/runner/values/position-range.mjs` | new | 155 |
| `src/lib/server/machine/apps/host/runner/values/run.mjs` | new | 155 |
| `src/lib/server/machine/apps/host/runner/values/text.mjs` | new | 241 |
| `src/lib/server/machine/apps/host/runner/values/uri.mjs` | new | 152 |
| `src/lib/server/machine/apps/read/across/languages.ts` | new | 95 |
| `src/lib/server/machine/apps/read/activation.ts` | changed | 79 |
| `src/lib/server/machine/apps/read/contributes/place.ts` | new | 29 |
| `src/lib/server/machine/apps/read/contributes/reader-tools.ts` | new | 386 |
| `src/lib/server/machine/apps/read/contributes/reader.ts` | changed | 485 |
| `src/lib/server/machine/apps/read/contributes/shape-tools.ts` | new | 153 |
| `src/lib/server/machine/apps/read/contributes/shape.ts` | changed | 99 |
| `src/lib/server/machine/apps/read/held.ts` | changed | 70 |
| `src/lib/server/machine/apps/read/manifest.ts` | changed | 575 |
| `src/lib/server/machine/apps/read/scan.ts` | changed | 326 |
| `src/lib/server/machine/apps/read/tool-files/tool-files.ts` | new | 150 |
| `src/lib/server/machine/apps/routes/host.ts` | changed | 196 |
| `src/lib/server/machine/apps/shell/host-calls.ts` | changed | 197 |
| `src/lib/server/machine/apps/shell/registry.ts` | changed | 412 |
| `src/lib/server/machine/apps/tools/debug.ts` | new | 194 |
| `src/lib/server/machine/apps/tools/decorations.ts` | new | 325 |
| `src/lib/server/machine/apps/tools/languages.ts` | new | 224 |
| `src/lib/server/machine/apps/tools/registry.ts` | new | 570 |
| `src/lib/server/machine/apps/tools/routes.ts` | new | 153 |
| `src/lib/server/machine/apps/tools/run/stream-actions.ts` | new | 104 |
| `src/lib/server/machine/apps/tools/run/stream-terminals.ts` | new | 362 |
| `src/lib/server/machine/apps/tools/run/tasks.ts` | new | 668 |
| `src/lib/server/machine/apps/tools/run/terminals-env.ts` | new | 76 |
| `src/lib/server/machine/apps/tools/run/terminals.ts` | new | 265 |
| `src/lib/server/machine/apps/tools/scm.ts` | new | 278 |
| `src/lib/server/machine/apps/tools/scope.ts` | new | 242 |
| `src/lib/server/machine/apps/tools/streams.ts` | new | 444 |
| `src/lib/server/machine/apps/tools/workspace/workspace.ts` | new | 441 |
| `src/lib/server/machine/apps/tools/workspace/writes.ts` | new | 219 |
| `src/lib/server/machine/debug/app/adapter.ts` | new | 67 |
| `src/lib/server/machine/debug/app/capabilities.ts` | new | 90 |
| `src/lib/server/machine/debug/app/ends.ts` | new | 50 |
| `src/lib/server/machine/debug/app/filters.ts` | new | 58 |
| `src/lib/server/machine/debug/app/port.ts` | new | 83 |
| `src/lib/server/machine/debug/app/resolve.ts` | new | 80 |
| `src/lib/server/machine/debug/breakpoints.ts` | changed | 139 |
| `src/lib/server/machine/debug/inspect.ts` | changed | 151 |
| `src/lib/server/machine/debug/launch.ts` | base only | - |
| `src/lib/server/machine/debug/launch/read.ts` | new | 288 |
| `src/lib/server/machine/debug/launch/write.ts` | new | 129 |
| `src/lib/server/machine/debug/routes.ts` | changed | 275 |
| `src/lib/server/machine/debug/session.ts` | changed | 849 |
| `src/lib/server/machine/debug/session/controls.ts` | new | 208 |
| `src/lib/server/machine/debug/session/send.ts` | new | 75 |
| `src/lib/server/machine/debug/session/start.ts` | new | 321 |
| `src/lib/server/machine/debug/session/types.ts` | new | 153 |
| `src/lib/server/machine/debug/shapes.ts` | changed | 77 |
| `src/lib/server/machine/debug/wire.ts` | changed | 186 |
| `src/lib/server/machine/lsp/adapters/entry.ts` | new | 275 |
| `src/lib/server/machine/lsp/held/diagnostics/published.ts` | changed | 120 |
| `src/lib/server/machine/lsp/held/documents.ts` | changed | 150 |
| `src/lib/server/machine/lsp/held/held.ts` | changed | 842 |
| `src/lib/server/machine/lsp/held/oculus.ts` | changed | 128 |
| `src/lib/server/machine/lsp/held/requests/links.ts` | changed | 325 |
| `src/lib/server/machine/lsp/relay-options.ts` | base only | - |
| `src/lib/server/machine/lsp/relay.ts` | base only | - |
| `src/lib/server/machine/lsp/relay/relay-apps.ts` | new | 310 |
| `src/lib/server/machine/lsp/relay/relay-join.ts` | new | 267 |
| `src/lib/server/machine/lsp/relay/relay-life.ts` | new | 173 |
| `src/lib/server/machine/lsp/relay/relay-make.ts` | new | 130 |
| `src/lib/server/machine/lsp/relay/relay-options.ts` | new | 65 |
| `src/lib/server/machine/lsp/relay/relay-pages.ts` | new | 163 |
| `src/lib/server/machine/lsp/relay/relay-route.ts` | new | 563 |
| `src/lib/server/machine/lsp/relay/relay-server.ts` | new | 340 |
| `src/lib/server/machine/lsp/relay/relay-state.ts` | new | 69 |
| `src/lib/server/machine/lsp/relay/relay.ts` | new | 115 |
| `src/lib/server/machine/lsp/schema-feed.ts` | changed | 74 |
| `src/lib/server/machine/lsp/servers.ts` | changed | 645 |
| `src/lib/server/machine/lsp/wire.ts` | changed | 184 |
| `src/lib/server/machine/pty/channel.ts` | changed | 836 |
| `src/lib/server/machine/pty/routes.ts` | changed | 542 |
| `src/lib/server/machine/pty/sessions.ts` | changed | 838 |
| `src/lib/server/machine/runs/commands/files.ts` | changed | 366 |
| `src/lib/server/machine/runs/commands/list.ts` | changed | 47 |
| `src/lib/server/machine/runs/commands/resolve.ts` | changed | 60 |
| `src/lib/server/machine/runs/commands/routes.ts` | changed | 152 |
| `src/lib/server/machine/runs/commands/run.ts` | changed | 274 |
| `src/lib/server/machine/runs/lint/writing/comments.ts` | changed | 200 |
| `src/lib/server/root/context.ts` | changed | 844 |
| `src/lib/server/root/process/apps-hosts.ts` | changed | 205 |
| `src/lib/server/root/process/context/app-feed.ts` | new | 51 |
| `src/lib/server/root/process/server-context.ts` | changed | 175 |
| `src/lib/server/root/socket.ts` | changed | 248 |
| `src/lib/server/root/watch/own-schemas.ts` | changed | 33 |
| `src/lib/shell/Workbench.svelte` | changed | 514 |
| `src/lib/shell/commands/DebugToolbar.svelte` | changed | 191 |
| `src/lib/shell/keys/Palette.svelte` | changed | 517 |
| `src/lib/shell/keys/palette-modes.ts` | changed | 284 |
| `src/lib/shell/keys/palette-open.ts` | changed | 88 |
| `src/lib/shell/keys/workbench-keys.svelte.ts` | changed | 582 |
| `src/lib/shell/status/LanguageItems.svelte` | changed | 352 |
| `src/lib/shell/status/SourceItems.svelte` | changed | 192 |
| `src/lib/shell/window/app-languages.svelte.ts` | new | 15 |
| `src/lib/shell/window/source-keys.ts` | new | 24 |
| `src/lib/state/client/context.ts` | changed | 836 |
| `src/lib/state/client/entities.svelte.ts` | changed | 122 |
| `src/lib/state/client/selectors.svelte.ts` | changed | 627 |
| `src/lib/state/client/shapes/client-state.ts` | changed | 180 |
| `src/lib/state/client/shapes/payloads.ts` | changed | 276 |
| `src/lib/state/sessions/source/autosave.svelte.ts` | changed | 198 |
| `src/lib/state/sessions/source/source.svelte.ts` | changed | 846 |
| `src/lib/state/sessions/terminal/commands.svelte.ts` | changed | 874 |
| `src/lib/state/sessions/terminal/composer/opening.svelte.ts` | changed | 205 |
| `src/lib/state/sessions/terminal/pty/matchers.ts` | new | 240 |
| `src/lib/state/sessions/terminal/terminal-lists.ts` | changed | 164 |
| `src/lib/state/sessions/terminal/terminal-marks.ts` | changed | 100 |
| `src/lib/state/sessions/terminal/terminal-payloads.ts` | changed | 105 |
| `src/lib/state/sessions/terminal/terminal-tabs.ts` | changed | 450 |
| `src/lib/state/sessions/terminals.svelte.ts` | changed | 878 |
| `src/lib/state/shared/answers/terminal-words.ts` | changed | 91 |
| `src/lib/state/shared/stores/shapes.ts` | changed | 434 |
| `src/lib/state/sources/explorer/follow.ts` | changed | 158 |
| `src/lib/state/sources/fs.ts` | changed | 61 |
| `src/lib/state/sources/repositories/answers.ts` | changed | 347 |
| `src/lib/state/sources/repositories/change-tree.ts` | changed | 329 |
| `src/lib/state/sources/repositories/diff/subject.ts` | new | 208 |
| `src/lib/state/sources/repositories/replace-preview.ts` | changed | 75 |
| `src/lib/state/sources/repositories/repositories.svelte.ts` | changed | 543 |
| `src/lib/state/sources/repositories/repositories.ts` | changed | 678 |
| `src/lib/state/sources/search/search.svelte.ts` | changed | 521 |
| `src/lib/state/system/apps/apps.svelte.ts` | changed | 866 |
| `src/lib/state/system/apps/flows.ts` | changed | 236 |
| `src/lib/state/system/apps/host-answer.ts` | new | 17 |
| `src/lib/state/system/apps/shell/context.ts` | changed | 90 |
| `src/lib/state/system/apps/shell/requests.svelte.ts` | changed | 337 |
| `src/lib/state/system/apps/shell/shell.svelte.ts` | changed | 467 |
| `src/lib/state/system/apps/shell/show/strip.ts` | changed | 87 |
| `src/lib/state/system/apps/tools/decorations.svelte.ts` | new | 194 |
| `src/lib/state/system/apps/tools/languages.svelte.ts` | new | 100 |
| `src/lib/state/system/apps/tools/scm.svelte.ts` | new | 173 |
| `src/lib/state/system/apps/tools/source-rows.ts` | new | 104 |
| `src/lib/state/system/apps/tools/tools.svelte.ts` | new | 70 |
| `src/lib/state/system/machine/debug/debug-adapter.svelte.ts` | new | 216 |
| `src/lib/state/system/machine/debug/debug-file.ts` | changed | 144 |
| `src/lib/state/system/machine/debug/debug-io.ts` | changed | 129 |
| `src/lib/state/system/machine/debug/debug-lists.ts` | changed | 260 |
| `src/lib/state/system/machine/debug/debug.svelte.ts` | changed | 840 |
| `src/lib/state/system/machine/debug/debug.ts` | changed | 308 |
| `src/lib/state/system/machine/lsp/lsp.svelte.ts` | changed | 631 |
| `src/lib/state/system/machine/schedules/schedule-words.ts` | changed | 92 |
| `src/lib/state/workbench/navigation/editor-text.ts` | changed | 155 |
| `src/lib/state/workbench/navigation/pages.ts` | changed | 678 |
| `src/lib/state/workbench/navigation/status.ts` | changed | 562 |
| `src/lib/state/workbench/palette.ts` | changed | 622 |
| `src/lib/state/workbench/rail-badges.svelte.ts` | changed | 299 |
| `src/lib/ui/controls/editor/Editor.svelte` | changed | 519 |
| `src/lib/ui/controls/editor/commands.ts` | changed | 206 |
| `src/lib/ui/controls/editor/diff/DiffEditor.svelte` | changed | 494 |
| `src/lib/ui/controls/editor/kit/folding.ts` | base only | - |
| `src/lib/ui/controls/editor/kit/grammars.ts` | base only | - |
| `src/lib/ui/controls/editor/kit/languages/app-grammars.ts` | new | 79 |
| `src/lib/ui/controls/editor/kit/languages/apps.svelte.ts` | new | 64 |
| `src/lib/ui/controls/editor/kit/languages/configuration.ts` | new | 190 |
| `src/lib/ui/controls/editor/kit/languages/folding.ts` | new | 142 |
| `src/lib/ui/controls/editor/kit/languages/grammars.ts` | new | 104 |
| `src/lib/ui/controls/editor/kit/languages/register.ts` | new | 56 |
| `src/lib/ui/controls/editor/kit/languages/snippets.ts` | new | 49 |
| `src/lib/ui/controls/editor/kit/load.ts` | changed | 602 |
| `src/lib/ui/controls/editor/kit/lsp/client.ts` | changed | 781 |
| `src/lib/ui/controls/editor/kit/lsp/hosts.ts` | changed | 246 |
| `src/lib/ui/controls/editor/kit/lsp/peeks.ts` | changed | 119 |
| `src/lib/ui/controls/editor/kit/lsp/semantic.ts` | changed | 120 |
| `src/lib/ui/controls/editor/kit/lsp/transport.ts` | changed | 874 |
| `src/lib/ui/controls/editor/kit/lsp/transport/messages.ts` | changed | 161 |
| `src/lib/ui/controls/editor/kit/rite/rite-hover.ts` | changed | 62 |
| `src/lib/ui/controls/editor/kit/rite/settings.ts` | changed | 44 |
| `src/lib/ui/controls/editor/kit/theme/semantic.ts` | changed | 188 |
| `src/lib/views/apps/frame/ApprovalPanel.svelte` | changed | 199 |
| `src/lib/views/sessions/session-list/TerminalRows.svelte` | changed | 237 |
| `src/lib/views/sessions/terminal/TerminalList.svelte` | changed | 499 |
| `src/lib/views/sessions/terminal/app-menus.ts` | new | 36 |
| `src/lib/views/sessions/terminal/bar/TerminalActions.svelte` | changed | 105 |
| `src/lib/views/sessions/terminal/grid/TerminalGrid.svelte` | changed | 520 |
| `src/lib/views/sessions/terminal/grid/grid-actions.ts` | changed | 96 |
| `src/lib/views/shared/explorer/control/app-menu.ts` | new | 36 |
| `src/lib/views/shared/explorer/tree/FileRow.svelte` | changed | 238 |
| `src/lib/views/shared/explorer/tree/Tree.svelte` | changed | 450 |
| `src/lib/views/shared/prose/source-options.ts` | changed | 153 |
| `src/lib/views/shared/sessions/commands.ts` | changed | 143 |
| `src/lib/views/sources/repositories/RepoList.svelte` | changed | 291 |
| `src/lib/views/sources/repositories/Repositories.svelte` | changed | 504 |
| `src/lib/views/sources/repositories/apps/AppSource.svelte` | new | 248 |
| `src/lib/views/sources/repositories/apps/AppSourceGroup.svelte` | new | 180 |
| `src/lib/views/sources/repositories/apps/AppSourceItem.svelte` | new | 73 |
| `src/lib/views/sources/repositories/apps/AppSourceRow.svelte` | new | 147 |
| `src/lib/views/sources/repositories/diff/Diff.svelte` | changed | 519 |
| `src/lib/views/sources/repositories/diff/DiffSection.svelte` | changed | 519 |
| `src/lib/views/sources/repositories/diff/HunkBar.svelte` | changed | 229 |
| `src/lib/views/sources/repositories/diff/diff-read.ts` | changed | 198 |
| `src/lib/views/sources/repositories/refs/Worktrees.svelte` | changed | 267 |
| `src/lib/views/sources/source/Source.svelte` | changed | 514 |
| `src/lib/views/sources/source/language/extension.ts` | changed | 71 |
| `src/lib/views/sources/source/language/lsp.ts` | changed | 632 |
| `src/lib/views/sources/source/language/symbols.ts` | changed | 122 |
| `src/lib/views/sources/source/language/tab-language.svelte.ts` | changed | 102 |
| `src/lib/views/sources/source/save/DiskNote.svelte` | changed | 80 |
| `src/lib/views/sources/source/source-gutter.svelte.ts` | changed | 202 |
| `src/lib/views/sources/source/status/app-actions.ts` | changed | 68 |
| `src/lib/views/system/machine/debug/Console.svelte` | changed | 302 |
| `src/lib/views/system/machine/debug/Debug.svelte` | changed | 208 |
| `src/lib/views/system/machine/debug/sections/Breakpoints.svelte` | changed | 445 |
| `src/lib/views/system/machine/debug/sections/CallStack.svelte` | changed | 99 |
| `src/lib/views/system/machine/debug/sections/LoadedSources.svelte` | new | 70 |
| `src/lib/views/system/machine/debug/sections/Variables.svelte` | changed | 154 |
| `src/lib/views/system/machine/output/Output.svelte` | changed | 88 |
| `src/routes/api/(machine)/debug/+server.ts` | changed | 42 |
| `src/routes/api/(sessions)/terminal/+server.ts` | changed | 36 |
| `src/routes/api/commands/+server.ts` | changed | 31 |
| `tests/checks/tree/boundaries.test.ts` | changed | 821 |
| `tests/data/helpers/files/languages-join.test.ts` | new | 64 |
| `tests/fixtures/sessions-fixture.ts` | changed | 195 |
| `tests/routes/apps/app-manage.test.ts` | changed | 371 |
| `tests/routes/apps/apps-fixture.ts` | changed | 183 |
| `tests/routes/machine/debug.test.ts` | changed | 231 |
| `tests/routes/replace/ops-replace.test.ts` | changed | 150 |
| `tests/server/machine/apps/host-manager.test.ts` | changed | 640 |
| `tests/server/machine/apps/host-runner.test.ts` | changed | 192 |
| `tests/server/machine/apps/hosts-fixture.ts` | base only | - |
| `tests/server/machine/apps/hosts-world.ts` | base only | - |
| `tests/server/machine/apps/manage.test.ts` | changed | 420 |
| `tests/server/machine/apps/manifest/manifest-contributes.test.ts` | changed | 287 |
| `tests/server/machine/apps/manifest/manifest-fixture.ts` | changed | 144 |
| `tests/server/machine/apps/manifest/manifest-tools.test.ts` | new | 355 |
| `tests/server/machine/apps/secrets.test.ts` | changed | 141 |
| `tests/server/machine/apps/shell/host-commands.test.ts` | changed | 113 |
| `tests/server/machine/apps/shell/runner-shell.test.ts` | changed | 209 |
| `tests/server/machine/apps/tools/debug-adapters.test.ts` | new | 577 |
| `tests/server/machine/apps/tools/decorations.test.ts` | new | 244 |
| `tests/server/machine/apps/tools/languages.test.ts` | new | 783 |
| `tests/server/machine/apps/tools/routes.test.ts` | new | 116 |
| `tests/server/machine/apps/tools/scm.test.ts` | new | 317 |
| `tests/server/machine/apps/tools/streams/server-backpressure.test.ts` | new | 156 |
| `tests/server/machine/apps/tools/streams/server-lifetime.test.ts` | new | 241 |
| `tests/server/machine/apps/tools/streams/streams.test.ts` | new | 219 |
| `tests/server/machine/apps/tools/tasks.test.ts` | new | 284 |
| `tests/server/machine/apps/tools/terminals/host-end.test.ts` | new | 88 |
| `tests/server/machine/apps/tools/terminals/terminals-page.test.ts` | new | 184 |
| `tests/server/machine/apps/tools/terminals/terminals-scope.test.ts` | new | 134 |
| `tests/server/machine/apps/tools/terminals/terminals-tmux.test.ts` | new | 145 |
| `tests/server/machine/apps/tools/terminals/terminals.test.ts` | new | 250 |
| `tests/server/machine/apps/tools/workspace.test.ts` | new | 596 |
| `tests/server/machine/apps/world/credit-sender.ts` | new | 52 |
| `tests/server/machine/apps/world/debug-app.ts` | new | 227 |
| `tests/server/machine/apps/world/hosts-fixture.ts` | new | 88 |
| `tests/server/machine/apps/world/hosts-world.ts` | new | 479 |
| `tests/server/machine/apps/world/language-app.ts` | new | 252 |
| `tests/server/machine/apps/world/terminals-double.ts` | new | 77 |
| `tests/server/machine/apps/world/tmux-terminals.ts` | new | 52 |
| `tests/server/machine/lsp/adapters/markdown-created.test.ts` | changed | 269 |
| `tests/server/machine/lsp/library.test.ts` | changed | 749 |
| `tests/server/machine/lsp/lifetime.test.ts` | changed | 682 |
| `tests/server/machine/lsp/lsp-fixture.ts` | changed | 374 |
| `tests/server/machine/lsp/relay.test.ts` | changed | 174 |
| `tests/server/machine/lsp/svelte-trust.test.ts` | changed | 150 |
| `tests/server/machine/lsp/versions.test.ts` | changed | 220 |
| `tests/server/machine/pty/channel.test.ts` | changed | 462 |
| `tests/server/root/context-fixture.ts` | changed | 207 |
| `tests/shell/commands/debug-toolbar.test.ts` | new | 95 |
| `tests/state/client/terminal/terminal-close.test.ts` | changed | 162 |
| `tests/state/sessions/served-roots.client.test.ts` | changed | 210 |
| `tests/state/sessions/terminal/commands-fixture.ts` | changed | 54 |
| `tests/state/sessions/terminal/ending.client.test.ts` | new | 74 |
| `tests/state/sessions/terminal/matchers.client.test.ts` | new | 200 |
| `tests/state/sessions/terminal/show-focus.client.test.ts` | new | 64 |
| `tests/state/system/apps-tools/languages.client.test.ts` | new | 172 |
| `tests/state/system/apps-tools/scm.client.test.ts` | new | 203 |
| `tests/state/system/apps/contributions.test.ts` | changed | 166 |
| `tests/state/system/apps/flows.test.ts` | changed | 254 |
| `tests/state/system/apps/page-commands.client.test.ts` | changed | 166 |
| `tests/state/system/apps/shell.test.ts` | changed | 419 |

344 files under config, src, tests and utils.


Every source file in the table is at or under 880 lines and every component at or under 520 (the `awk` check under "Checks" printed nothing). The largest: `src/lib/state/sessions/terminals.svelte.ts` 878, `src/lib/ui/controls/editor/kit/lsp/transport.ts` 874, `src/lib/state/sessions/terminal/commands.svelte.ts` 874, `src/lib/views/sessions/terminal/grid/TerminalGrid.svelte` 520. Files split in this step to keep the line: `src/lib/server/machine/lsp/adapters/entry.ts` (the types of the server registry, moved out of `servers.ts`), `src/lib/server/machine/debug/session/send.ts` (the sends of breakpoints and exception filters, out of `session.ts`), `src/lib/state/sources/repositories/diff/subject.ts` (the identity of a diff pane, out of `repositories.ts`), `src/lib/shell/window/source-keys.ts` (out of `Workbench.svelte`), `clipboardText` in `views/sessions/terminal/grid/grid-actions.ts` (out of `TerminalGrid.svelte`), `src/lib/server/machine/apps/tools/workspace/writes.ts` (the recorded writes, out of `workspace.ts`) and `src/lib/server/files/fs/operations/ops-shape.ts` (out of `ops.ts`). Folders that reached 11 items were split by concern: `src/lib/server/files/fs/operations/`, `src/lib/server/machine/apps/tools/workspace/`, `tests/server/machine/apps/tools/streams/` (`sh utils/folder-check.sh` exits 0). Comments were moved with their code, none shortened.

## Documents, paragraph by paragraph

| Document | Part | State |
| --- | --- | --- |
| DESIGN.md | host paragraph (hostless debugger, `runsHost`, `apps.debugger_line`; the host's process group, before and after: no group, then a group killed when the host ends) | rewritten |
| | Activation (two built-in `onCommand` ids, `declaredEvent`) | rewritten |
| | protocol intro and table (stream rows `yes`, about 30 new rows) | rewritten |
| | contributes paragraph (twenty-two points), Menus, Words | rewritten |
| | language servers bullet (join: a joined request waits up to 2 s, a one-answer request goes to the first server without waiting; server stop: `shutdown` then `exit`; globs by picomatch), language features (`didSave`), debug adapters (Pause for every adapter), debug client bullet (Stop, Restart, Pause), terminals (`show(preserveFocus)`), workspace API (recorded writes through `apps/tools/workspace/writes.ts`, `closed` refusal of folders holding private places), Streams (backpressure on oculus's side), change log (`fs/operations/replace.ts`) | rewritten |
| | ten paragraphs: Streams, Languages, Language servers of apps, Language features of apps, The workspace API of apps, Debug adapters of apps, Tasks of apps, Terminals of apps, Source control of apps, File decorations of apps | added |
| | every other paragraph | still true (`grep -n "later step\|not yet built" DESIGN.md` prints nothing) |
| docs/apps.md | intro, manifest row (twenty-two points), approval panel, points table, findings, menus, ids, host section, "What stops with an app" (the host's process group) | rewritten |
| | "The tools": worked examples, the workspace `fs` row and write sentence (History with the app's id, replaced bytes kept, delete to Trash only with `useTrash`, folder delete undo restores an empty folder, rename and copy across folders as two operations, `closed` refusal), `findFiles` exclude, `onDidSaveTextDocument` row, language order, selector `pattern` by picomatch, join sentence, server-ends behaviour, Pause, `show(preserveFocus?)` row, stream backpressure bullet (4096 queued messages or chunks, 8 MiB of typed input), "Limits of the tools" | rewritten and added |
| | refusal words, "What an app cannot do", "When something goes wrong" | rewritten |
| HELP.md | Files and the editor, Terminals, Project commands, Debugging (Stop, Restart and Pause bullet), Apps (line 313: languages, join sentence), Source Control; Add Configuration listed in History with Undo | rewritten bullets |
| | every other section | still true |
| README.md | no mention of the tools | still true |
| `config/text/` | added keys `apps.debugger_line`, `apps.ends_*`, `server.apps.*`, `server.debug.*`, `debug.pause`, `repositories.app_source_*` and the findings `findings.apps.*` for the tool points; no existing sentence changed | rewritten only where listed; others still true |

Commands for this table: `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md README.md docs/apps.md | wc -l` printed 0; `grep -rn "glob.mjs\|workspace-writes\|files/fs/replace.ts\|later step\|not yet built" DESIGN.md HELP.md docs/apps.md README.md src tests config` printed nothing; `grep -rn "supportsPauseRequest\|@oculus-app" src tests DESIGN.md HELP.md docs` printed nothing.

Head comments: every module this step added opens with a "Layer N, ..." comment; the relay modules carry the relay's comment divided by concern; the head comments of `apps/tools/streams.ts` and `runner/streams.mjs` name each other (ruling 12).

## Judgment calls and findings

- DAP has no pause capability, so Pause is drawn for every adapter whenever a thread runs; `rite_dap` refuses `pause` ("pause is not supported: arm a breakpoint instead", `cathedra` `src/rite/src/tools/debug_dap.cpp` `cmdPause`) and oculus shows that as a notice while the session goes on. The brief's premise (a Pause capability) was wrong; ruling 3 corrected it.
- (a) App writes pass `trashReplaced: false`: History keeps the replaced bytes of a file within its size limit, and a file over the limit is not recoverable from History. A delete goes to the Trash only when the app passes `useTrash`.
- (b) A rename across folders to a different name is two operations; a copy to a differently named target is a `paste` copy then a `rename` (History lists `['rename', 'copy']`, newest first).
- (c) Add Configuration on a folder with no `.oculus` is two History entries (the folder create, then the upload); undoing the folder create is refused `moved` once the file is in it, so after undoing the file an empty `.oculus` remains.
- (d) Dot-led files are closed to apps; the test of equal reading across a selector, `findFiles` and a watcher uses inner-dot names, and the dot-led case is a selector-only test.
- (e) The upload-replace record names the replaced bytes, so undoing a replace-upload in the Files view also restores the old bytes (a behaviour change of the Files view).
- (f) Undo of a recursive folder delete restores an empty folder only.
- (g) `findFiles` always skips dot-led entries, also with `exclude` null.
- (h) The watchers of oculus's own language servers (`lsp/held/watch.ts:257`) and the schema file match (`data/snapshot/schema/set.ts:133`) still use `path.matchesGlob`; the app watchers and `findFiles` use picomatch.
- (i) A message already written to an app server's stdin waits in the child's pipe and the writer's chain beyond the window plus the bound; the page's websocket is not paused.
- Oculus's own `rite` adapter keeps its fixed table (function breakpoints and hover); Finish Frame is offered only for it; launch and attach pass the whole `launch.yml` configuration to an app's adapter; the exception filter choices are kept on the server per type for the process.
- Restart uses the adapter's `restart` when declared, else stop and start with a confirmation; Add Configuration writes through the server's `addConfiguration` (comments kept, 4-space indent, a unique name by a " 2" suffix); `startDebugging` by name from a host fails (false) for a `launch.yml` entry whose `program` holds `${file}`.
- An app adapter's launch asks no approval and an app's task asks no per-text approval; Stop of an app debug session asks naming the debugger; the approval panel shows one line per debugger that names a `program` (`apps.debugger_line`).
- Disable, Remove and Revoke name the debug session, the tasks and the terminals of the app they end.
- Language servers: one app server per page and root; restart limit 4 in 3 minutes, then left failed until Restart, otherwise restarted by the next request; a retired app server is given `shutdown` and `exit` while its host acts (ruling 21) and the page is told `gone`, its diagnostics are republished without it and its dynamic registrations withdrawn; the 30 s bound, 60 s grace and the 2 s join wait are the brief's values; a user `languages:` mapping or `editor.languages` names only languages the highlighter registered; a language from the first line is decided from the saved text; JSON schema `fileMatch` without a leading `/` or `**` gets `**/`; `semanticTokenScopes` with `:language` apply to all languages; "ask which server" is a submenu of the status bar menu and one action per server in the tab and palette lists.
- Tasks: matchers are referenced by name (`$name`, names start with the app's name); a command without matchers keeps the default `file:line: error|warning` reading; hits outside the repository are dropped; a background matcher clears its diagnostics at `beginsPattern`; app tasks with scope undefined, Workspace or Global show in every repository of the app's scope, folder-scoped ones only in that folder; typed `commands.yml` entries refuse `run` and `depends_on`; app tasks cannot be dependencies; `TaskExecution.terminate` sends Ctrl-C to a tmux task terminal; stream-terminal capture strips ANSI on the server.
- Terminals: the request body field of `show` is `terminal` with `preserveFocus`; terminal menus apply to every terminal and `terminalProcessSupported` is pid != 0; `CommandSeverity` is widened with `info`.
- Source control: SCM input text is sent 150 ms after the last key; the selection is local to the view; an app's source control is a row of the repository list; a duplicate `createSourceControl` id throws synchronously inside the host (`refused:registered`) while a wrong-prefix id is refused asynchronously (`not_declared`, with an output line); the quick diff covers a file when the control's `root` equals the file's root.
- Decorations: the badge is git's letter and the app badge cut to 2 characters; a path with a leading `/` in `decorate` is root-relative; a change set over 5000 files is told as a change of every file.
- Workspace: `createDirectory` creates missing parents inside the scope; `applyEdit` validates file operations before it writes text; `oculus/workspace/foldersChanged` is sent when the scope's folders change.
- Streams: a stream that crosses a close closes silently; the runner kills the programs it started on exit.
- Page-side Monaco converters (`languageConfiguration`, the app grammars skip, the status `languageName`, the `gone` handling in `lsp.svelte.ts`, the page's F5) have no test of their own: tests exist only as entries of `guarded.md` and no entry names them. The lazy option would be a test outside an entry; it was not taken. They are checked by reading and by the lint and type runs, and the look on landing covers them.
- Against the brief, nothing was found wrong beyond the Pause premise of ruling 3.
