# Brief check of D64 (oculus/migration), read on main at a230adb0b

D64 brief check: I made no edits and ran no git command that changes state. I read the brief from disk, plan.md (the Goal, line 774, Step 0 at 775, the ruling at 1746, open items 42 and 43 at 1765-1766, Z794 at 1785, Z833 to Z839 at 1827-1833), spec.md, guarded.md (the entries cited below), the D62 and D63 landing reports, parts of the D62 brief, and the D70 brief. I also read two VS Code documentation pages with WebFetch. Main is at a230adb0b (`git log --oneline -1`).

The main findings:
- **Relay split vs case 18.** Item 0 and case 18 cannot both hold as written, and the split makes three guarded Code lines false.
- **Unmade wire-format choices.** Several wire formats and API shapes the step needs are not chosen in the brief:
  - stream flow control;
  - which connection the stream bytes travel on;
  - where an executable server's stderr goes;
  - the protocol rows for the new host calls;
  - the uri shape;
  - how the host answers the quick diff's original text.
- **Language premise holds only for shipped languages.** "`onLanguage:<id>` already starts the host" is true only for the languages oculus ships. An app's language is dropped by `languageMap` and by the fixed `registered` list.
- **Inventory row "language features" is not met.** VS Code counts snippets as a language feature. Case 17 keeps `snippets` refused.
- **`terminal/title` is not a VS Code menu id.**

## 1. Names

The names this step changes, each grepped with `grep -rln --exclude=local.yml --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=worktrees -- "<name>" .` from the repository root. The output was filtered to drop the brief's write list and the folders `.scratch/migration/agents/briefs` and `reviews`. The names: `SERVED_LANGUAGES`, `RegisterKind`, `rite_dap`, `launch.yml`, `id_taken`, `nine points`, `oculus/stream`, `contributes_menu_dropped`, `TerminalKind`, `relay.ts`, `Decoration`, `registerLanguageServer`, `createSourceControl`, `registerFileDecorationProvider`, kind `` `app` ``, `languageServer`, `debugAdapter`, `commands.yml`.

Hits outside the write list:
- **guarded.md Code lines (become false).** `tools/oculus/.scratch/migration/agents/guarded.md:8` (G1), `:84` (G36) and `:159` (G63) name `src/lib/server/machine/lsp/relay.ts`.
  - The folder rule forces relay.ts to move. `git ls-tree --name-only HEAD src/lib/server/machine/lsp/ | wc -l` prints 10, so a new subfolder beside relay.ts makes 11 and fails `utils/folder-check.sh`.
  - So relay.ts (and relay-options.ts) have to move into the new subfolder. Once they move, these three Code lines are false.
  - Item 13 names only G77, G75, G2 and G49, and guarded.md is the orchestrator's to edit. The brief should name these three rewrites as landing work.
- **docs/DATA-MAP.md (stays true).** `docs/DATA-MAP.md:364-365` names `<root>/.oculus/commands.yml` and `<root>/.oculus/launch.yml`, pointing at HELP.md's Project commands and Debugging sections. Adding `type` and `request` keys does not make it false.
- **Logs (not rules).** `plan.md`, `choices.md`, `orchestrator-history.md` and `orchestrator-state.md` name `rite_dap`, `launch.yml`, `oculus/stream`, `relay.ts`, `registerLanguageServer` and others. These are logs, and nothing there becomes false in a way that needs a rewrite.
- **`utils/migrations/convert-vscode-themes.ts:147,155`** hits on `Decoration` (`gitDecoration.*`). It is unrelated.

Hits inside the write list worth naming, since case 18 says "pass unchanged":
- Six test files import from `src/lib/server/machine/lsp/relay.ts`: `tests/server/machine/lsp/lsp-fixture.ts:20`, `svelte-trust.test.ts:25`, `lifetime.test.ts:16`, `library.test.ts:13`, `adapters/markdown-created.test.ts:29`, `relay.test.ts:12`.
- So do `tests/server/root/context-fixture.ts:13`, `src/lib/server/root/context.ts:71` and `src/lib/server/root/process/server-context.ts:28`.
- Head comments naming relay.ts: `src/lib/server/machine/pty/channel.ts:2`, `src/lib/server/root/socket.ts:9,61`, `lsp/held/held.ts:5,765`, `lsp/held/documents.ts:2`, `DESIGN.md:124`.
- `tests/checks/source/keys.test.ts:30,58` imports `SERVED_LANGUAGES` as a constant. If it becomes a joined, runtime list, this import has to follow.

The brief's own doc grep (item 12) misses one sentence the change makes false:
- `grep -rn "nine points\|nine contribution" DESIGN.md docs README.md HELP.md` shows `docs/apps.md:43` "a map of the nine contribution points of What an app adds to the shell".
- The brief's pattern `nine points` does not match "nine contribution points".
- The grep also misses DESIGN.md:448's "the four `oculus/stream/*` rows are the only ones not yet built", although `later step` on the same line catches it.

## 2. The step line

Each part of D64's line (plan.md:774), mapped to the item of "What to build" that serves it:
- **Language server through the relay** (completion, hover, diagnostics in the Problems view and the rest the relay carries): items 3 and 4, with item 2 for the languages and grammars.
- **Debug adapter through oculus's debug client:** item 5.
- **Tasks and terminals:** items 6 and 7.
- **Source control provider in the Repositories view:** item 8.
- **File decorations in the Files view:** item 9.
- **Every row of the inventory met at landing:** item 11.
- **Z833 to Z839:** item 2 serves Z833, item 3 Z834, item 4 Z835, item 5 Z836, item 6 Z837, item 7 Z838, items 8 and 9 Z839.
- **Z794** ("D64 builds the tools' menus"): items 8 and 10.
- **Step 0** (plan.md:775, relay split, `#prepare` and `#heldOf` back as named helpers): item 0. `grep -n "#prepare\|#heldOf" relay.ts` prints nothing, which confirms they are inlined today.

Parts with no requirement, or a defective one:
- **`terminal/title` is not a VS Code menu id.** Item 10 lists it. VS Code's contribution-points page (WebFetch of code.visualstudio.com/api/references/contribution-points) lists `terminal/context` and `terminal/title/context`, and no `terminal/title`. The ruling says every manifest point is VS Code's by its own name and shape, so the id should be `terminal/title/context`.
- **`scm/inputBox` is not documented.** Item 8 uses it, and it is not among the menu ids on that page. Its source is not verified in this session.
- **Other `scm/*` menu ids are not named.** The same page lists `scm/resourceFolder/context`, `scm/repository`, `scm/sourceControl` and `scm/change/title`.
  - Z794 says D63 dropped `scm/*`, `debug/*` and `terminal/*` "since D64 builds the tools' menus".
  - The brief builds a subset and does not say why the rest stay dropped (case 17 keeps `scm/change/title` dropped).
- **Fields with no behaviour.** Item 5's `configurationSnippets`, `initialConfigurations` beyond F5, and `provideDebugConfigurations` are listed, but no place in oculus uses them. VS Code uses them when it creates launch.json; oculus's Add Configuration (HELP.md:385) is not mentioned.
- **No input path for a task of an app's type.** Item 6's `resolveTask`, and the `required` and `properties` of `taskDefinitions`, have no place where a user writes a task of an app's type. VS Code's place is tasks.json, and nothing names the commands.yml form. The same holds for a commands.yml entry naming a contributed `$matcher`, so `resolveTask` is never called.

Every row of the ruling's inventory (plan.md:1746), judged against D62 (landing report), D63 (landing report, docs/apps.md) and this brief:
- **Met by D63:** commands, keybindings, menus (the shell's seven ids), status bar items, side bar and panel views, tree views, panels, custom editors, declared settings, colour and icon themes, quick pick, input box, notifications, progress.
- **Met by D62:**
  - **State and secret storage:** `oculus.store`, `oculus.secrets`.
  - **Processes, network, file read and write, watchers:** the host runs Node with the reader's rights. docs/apps.md:430 says the host "can read and write your files, start processes, reach any address and watch folders with Node's own modules". The frame also has `fs.readFile`, `readDirectory` and `stat` and `connects`.
  - VS Code's own API for these (`workspace.fs`, `workspace.createFileSystemWatcher`, `workspace.findFiles`, `workspace.applyEdit`, `Uri`, `workspace.workspaceFolders`) is absent from the host. `grep -n "workspaceFolders\|Uri\.\|EventEmitter\|CancellationToken" src/lib/server/machine/apps/host/runner-shell.mjs host-runner.mjs` prints only `resourceUri` at runner-shell.mjs:251.
  - Whether the row counts as met when an extension's calls must be rewritten to Node is the inventory's reading, and the brief does not settle it.
- **Met by this brief:**
  - debug adapters (item 5);
  - tasks and terminals (items 6 and 7);
  - source control providers (item 8);
  - file decorations (item 9);
  - the tools' menus (item 10).
- **Language features: unmet in part.** Items 2 to 4 cover servers, providers, grammars and language configuration. Two parts are missing:
  - **Snippets.** VS Code's Language Extensions Overview (WebFetch of code.visualstudio.com/api/language-extensions/overview) lists "Snippet completion" among its declarative language features. The `snippets` contribution point is not built, and case 17 keeps it refused as `key_unknown`.
  - **Other language contribution points.** The contribution-points page also lists `semanticTokenTypes`, `semanticTokenModifiers`, `semanticTokenScopes`, `jsonValidation` and `configurationDefaults`. The brief does not name them.
  - Item 11 tells the builder to build an unmet row with no shape given, and case 17 tells it the opposite for snippets.

## 3. Premises

Each line of "What is on the tree", rerun on main a230adb0b.

- **The relay.** `wc -l relay.ts` prints 880. `sed -n 106p` is `export class Relay {`.
  - `grep -n "^    [#a-z]" relay.ts` gives `inbound` 193, `remove` 228, `reconcile` 250, `reload` 287, `#page` 308, `#rpc` 417, `#route` 499, `#didOpen` 607, `#openOn` 636, `#make` 655, `#env` 689, `#initializeParams` 703, `#fromServer` 718, `#response` 726, `#serverRequest` 762, `#toPage` 803, `#serverNotification` 820, `#stopped` 836, `#gone` 852, `#release` 863. All match.
  - `#config()` is at 684-686, its doc comment at 683; it matches D70's reference.
- **The lsp folder.** `git ls-tree --name-only HEAD src/lib/server/machine/lsp/ | wc -l` prints 10. Matches.
- **The registry and the held server.**
  - `servers.ts` is 877 lines; `ServerEntry` at 182 and `Launch` at 106 with `command`, `args`, `cwd`, `program`, `env?`. Matches.
  - `held/process.ts` is 253 lines and uses `StreamMessageReader` and `StreamMessageWriter` (line 18). `INITIALIZE_MS = 30_000` (23), and `shutdown`, `exit`, SIGTERM, SIGKILL at 172-175. Matches.
  - `held/held.ts` is 816 lines. Matches.
- **Served languages and grammars.**
  - `SERVED_LANGUAGES` is at `lsp-servers.ts:245` (281 lines), and `hosts.ts:19,24,205` matches. `lsp.ts:36,116` reads it.
  - `package.json` has `@shikijs/monaco` 4.4.3 at 65 and `shiki` 4.4.3 at 111. `load.ts` (521 lines) has `createHighlighter` and `shikiToMonaco` at 272-273, 445 and 462. Matches.
- **The debug client.** `src/lib/server/machine/debug/` holds 8 files, 1,641 lines total.
  - `session.ts` is 683 lines; it spawns `[rite_dap, program]`, with SIGTERM at 594. Matches.
  - `launch.ts` is 183 lines, with `KEYS` at 32. Matches.
  - The page: `debug.svelte.ts` 751, `debug.ts` 232, `Debug.svelte` 172, and `sections/` as listed. Matches.
  - HELP.md's Debugging section runs 368 to 391, and line 390 holds "offers no Pause". Matches.
  - `@vscode/debugprotocol` 1.68.0 is at package.json:44, inside `devDependencies` (32-59). Matches.
- **Terminals.** `find src/lib/server/machine/pty -type f | wc -l` prints 14, totalling 4,125 lines. `channel.ts` is 760 and `routes.ts` 516. `sessions.ts:1-17` matches.
  - The view files' line counts match: 514, 492, 731, 514.
  - Not in the brief: `KINDS` is `['claude', 'codex', 'shell']` (`sessions.ts:42`), so `app` is a new value of `TerminalKind`. That type is used in 8 files.
- **Project commands.** `run.ts` 230 and `files.ts` 270 match, and so does HELP.md 357-366.
  - Not stated in the brief: the folder holds 10 tracked items, so it is full.
- **The Repositories view and the gutter.** Line counts match (479, 262, 506, 353, 287, 278), and so do the `gutter/` files.
- **The Files view decoration.** `decorations.ts:27` is `Decoration` (180 lines). Matches.
  - In `FileRow.svelte` (214 lines), the decoration is at 38, `letterTone` at 64-67 and the letter at 114-118. Matches within a line.
- **The host.**
  - `src/lib/server/machine/apps/host/` holds 10 items. Line counts match: `host-runner.mjs` 233, `runner-shell.mjs` 561, `manager.ts` 741, `connection.ts` 138, `handlers.ts` 133, `process.ts` 205.
  - `shell/` holds 3 files: `registry.ts` 416, `host-calls.ts` 204, `commands.ts` 133.
  - **Off by one:** `RegisterKind` is at `registry.ts:53`, not 52 (`grep -n RegisterKind`).
  - `reader.ts` is 451 lines, with `MENUS` at 30 holding seven ids. `shape.ts` is 97 lines, with `POINTS` at 81. `state/system/apps/shell` holds 10 items. All match.
- **DESIGN.md and the docs.**
  - DESIGN.md is 681 lines, and the stream row at 466 reads "later step". Matches.
  - docs/apps.md is 639 lines. Its points table at 125-137 has nine rows, and "What an app cannot do" is at 536. Matches.
  - HELP.md is 473 lines. Matches.
- **guarded.md.** G75 is at 49, G77 at 55, G49 at 34, and G2's Code line names `uris.ts` and `library/`. Matches.
- **Other files.** `context.ts` is 821 lines and `index.ts` 742. Matches.
- **Full folders the brief does not name.** Besides `runs/commands/` (10, above), `ui/controls/editor/kit/` (10) and `kit/lsp/` (10) are full, by `git ls-tree --name-only HEAD <dir>/ | wc -l` per folder. `pty/` is full too (10 items).
- **Wrong in part: "`onLanguage:<id>` already starts the host".**
  - `manager.ts:269-271` (`opened`) computes the language with `languageOf(path, this.#options.languages())`. `apps-hosts.ts:76` supplies `languageMap(options.config())`.
  - `src/lib/data/helpers/files/languages.ts:1-16` reads `languages:` of `config/sources.yml` and keeps only names the highlighter registered (`data/prose/languages.ts`). Its head comment says the registration "runs once at load and is never written after".
  - An app language such as `notes.lang` is therefore never the language of a file on the server or on the page. `grep -rln "languageOf(" src | wc -l` prints 21 callers.
  - The premise holds for shipped languages only. Item 2's "the file name rules decide a tab's language as the shipped languages do" needs these maps named. `filenamePatterns` (a glob) and `firstLine` (content) cannot be expressed in today's `LanguageMap`, which holds extensions and whole names only.
- **Incomplete: the paths shared with D70.** The "In flight" bullet lists relay.ts, servers.ts:684,801 and places.ts. D70's brief also writes these files that D64 changes:
  - `src/lib/views/sources/source/language/lsp.ts:134` (`isWithheldFile` becomes `isPrivateFile`);
  - `lsp/library/rules.ts` (`withheldFolders`);
  - `DESIGN.md`, `HELP.md`, `docs/` and `config/text/` (its sentence sweep, item 4).

## 4. Cases and checks

Read against spec.md and guarded.md:
- **Cases inconsistent with the rules or with item 0:**
  - **Case 18 vs item 0.** Case 18, "the language-server tests of the base pass unchanged", cannot hold with item 0. The 10-item rule (spec.md:47) forces relay.ts out of `lsp/`, which changes the import line of six test files. Either case 18 reads "with only their import paths changed", or item 0 names how the folder stays at 10.
  - **Case 6 vs VS Code.** Case 6 refuses an app that declares `markdown`. VS Code merges a language contributed by several extensions, so an extension that adds an extension or a file name to an existing language cannot be ported. This departs from the ruling's "every manifest point is VS Code's contribution point by its own name and shape", and the brief does not list it as a departure. It also has no finding sentence: `id_taken` (`findings.yml:291`) reads "which {2} declares too and comes before it in the Views list", which cannot name oculus.
  - **Case 17 vs the inventory.** It keeps `snippets` refused, against the inventory row "language features" (section 2).
- **The look on landing (spec.md:63-64).** Cases 1 to 5, 7, 10 and 12 to 14 are only partly page-visible. The brief's lines 103-107 send them to reading and unit runs, with the look on landing as their proof, which is consistent.
- **No list of what oculus keeps (spec.md:88).** spec.md:88 requires the brief to list, before the build, what oculus does beyond VS Code in the views it brings to VS Code's. Here those views are the Repositories view, the Debug view and the Files rows. One example: project commands are drawn above the commit box. The brief has no such list.
- **Tests under entries the brief does not name (spec.md:58).** Item 13 lists G77, G75, G2 and G49, and the code changed also falls under four more entries:
  - **G1:** the relay's token gate moves in the split. A stream terminal's input from a page also needs the token, which G1's terminal input row covers.
  - **G35:** a terminal of kind `app` is started, and a host Stop or Disable ends what it says it ends. Its Code line names `pty/routes.ts`, `sessions.ts` and `channel.ts`.
  - **G36:** an app server's 60 s grace, its end when a root is no longer served, its end with the server, and "none started twice for one page and root".
  - **G63:** the versions held by an app server, with relay.ts in its Code line.
- **G75 needs a Code line addition.** G75's text covers when a host runs and stops, and says nothing of streams. "A stream ends with its host" therefore needs G75's Code line to name the stream module (a new subfolder, since `host/` is full). Item 13 asks for the additions to be listed, which is consistent.
- **A possible rule clash on G77.** Item 13 and decision 6 extend G77's text at landing under the orchestrator.
  - G77's text is Axel's verbatim ruling (open item 54, plan.md, "(the user)").
  - The head of guarded.md and spec.md:58 reserve a new entry to Axel.
  - Widening the guarantee of an entry Axel worded is close to the case that stopped D63 (plan.md:769, Z803 replaced by open item 54). The orchestrator should judge whether that needs Axel's word.
- **Cases that check a place the step does not change:** none. Cases 8, 17 and 18 are regression checks inside code the step changes (`launch.ts`, `reader.ts`/`shape.ts`, the relay).

## 5. Could it pass without the goal being reached

Cases:
- **Cases 1 and 2:** yes. Unit runs can stub the relay while the page never learns an app language: `SERVED_LANGUAGES` is a module constant, and `languageMap` drops unknown ids. Only the look catches it.
- **Case 3:** no for the hover join. It does not test that diagnostics of two servers on one document are kept apart.
- **Case 4:** yes. It passes when every server answers. A hanging app server would block oculus's own completion and definition for that language, and no case has a server that never answers.
- **Case 5:** no.
- **Case 6:** it passes while encoding a departure from VS Code (section 4).
- **Case 7:** yes, for item 5's capability list. Only Pause, `stopOnEntry` and terminate are checked. These are not covered by any case, so they could be absent and every case pass: conditional, hit-count and function breakpoints, logpoints, exception filters, `setVariable`, `restart`, `disconnect` with `terminateDebuggee`, evaluate for hover, Debug Console completions, `loadedSources`, `request: attach`, `DebugAdapterServer`, the configuration provider, `contributes.breakpoints`, and F5 with `initialConfigurations`.
- **Cases 8 and 9:** no.
- **Case 10:** yes, for these parts, which no case covers: default build or test by `group`, `fetchTasks`, `executeTask` from the host, `onDidEndTaskProcess` exit code, Rerun and Restart of an app task, and a `ProcessExecution`.
- **Case 11:** partly. `background` matchers and `loop` patterns are untested.
- **Case 12:** no.
- **Case 13:** yes, for `statusBarCommands`, `count`, `hideWhenEmpty`, `scm/title`, `scm/resourceGroup/context` and `outside`.
- **Case 14:** yes, for a late answer, a throwing provider, an unknown colour id and a badge over two characters.
- **Case 15:** no, if `ps` is quoted.
- **Case 16:** yes. Buffering 50 MB in memory meets "no byte dropped, no limit refuses it, server responsive" with no backpressure built, and item 1 requires backpressure. A check that would fail without it bounds the server's memory, or the bytes held per stream, while the reader is held still.
- **Case 17:** no.
- **Case 18:** it can pass with a split that is not by responsibility. The named helpers are judged by reading.

The step line: it can pass, because item 11 lets the builder judge the inventory rows itself. It can declare "file read and write and watchers", "processes" and "network" met by Node in the host and still leave snippets unbuilt.

Items of "What to build":
- **Item 0:** see case 18.
- **Item 1:** yes, see case 16.
- **Items 2 to 4:** yes, see cases 1, 2 and 4. Item 2 can also pass with `filenamePatterns` and `firstLine` ignored, since no case uses them.
- **Item 5:** yes, see case 7.
- **Item 6:** yes. `resolveTask` has no caller (section 2).
- **Item 7:** no.
- **Item 8:** yes, see case 13. The quick diff original has no specified source (section 6 and "Buildable"), so a stub passes.
- **Item 9:** yes, see case 14.
- **Item 10:** yes. `terminal/title` is not a VS Code id, so the menu could be built under a wrong name and pass.
- **Item 11:** yes, see the step line.
- **Item 12:** it can miss `docs/apps.md:43` (section 1).
- **Item 13:** it can pass with tests filed only under the four named entries while G1, G35, G36 and G63 code changes.

## 6. Implied inputs

Each input the brief does not state, with the result it should give:
1. **A host crashes mid-stream.** Every stream it opened closes. The held language server is marked gone, its diagnostics are cleared, and the status item offers Restart. The debug session ends as if the adapter exited, and the Debug view shows it ended. A stream terminal ends with an exit line. tmux terminals of kind `app` keep running.
2. **An app is disabled during a debug session or a running task.**
   - The session ends (terminate, else disconnect, then the stream closes) and the Debug view returns to idle.
   - The task's terminal ends. A tmux task terminal ends too, since the brief ends its tasks.
   - The Disable question (D62's flow) should name the running session, tasks and terminals before it ends them.
3. **Two apps, one language.**
   - Both servers get the document.
   - The answers are joined in Views order.
   - Each server's diagnostics are kept apart.
   - Each server's Restart and Output are reachable on its own. Today's status item and actions are one per language, keyed by `factsForLanguage`.
4. **Two apps claim one file extension for different language ids, or an app claims `.md`.** The first in Views order wins. The user's `languages:` in `config/sources.yml` wins over both, as VS Code's `files.associations` does. The brief rules none of this.
5. **A provider or app server that never answers.** The page's request is answered with the other servers' results after a bound, and cancelled on the app side by `$/cancelRequest`. oculus's own server's answer is never held back.
6. **An app server that never answers `initialize`.** It is ended at 30 s, as G36 does for oculus's servers.
7. **An app server that exits again and again.** It is not restarted in a loop; Restart is offered. VS Code's client stops after repeated crashes.
8. **A decoration storm.** Thousands of `onDidChangeFileDecorations` per second, with no argument or with uris, are merged per frame. Only drawn rows are asked. A change is not refused under `apps.messages_per_min` silently, or if it is, the brief says so.
9. **Two decoration providers on one file.** The rule is unstated. VS Code joins badges and tooltips and takes the first colour.
10. **A badge over two characters.** Dropped, as VS Code drops it. Also unstated.
11. **A decoration for a path outside the workspace folders.** Ignored.
12. **A source control for a folder git also covers.**
    - Both sections are drawn.
    - The quick diff shows both providers' marks without one hiding the other. "Beside git's marks" does not say how two marks share a line.
    - `count` adds both.
13. **The SCM input box is set by the host while the reader types.** A rule is needed. VS Code sends each keystroke to the host and applies host writes, last write wins.
14. **A stream message from a host that is not the stream's owner.** Stream ids are per host connection. Data, control or close naming an id another host opened never reaches that stream and closes nothing.
15. **A duplicate `stream/open` id, or data for an unknown or closed id.** Refused or dropped, and the host is not ended. A `languageServer` or `debugAdapter` stream whose data is not one JSON object closes that stream with a line in the server's output.
16. **The dev server restarts with streams open.** D62 stops the old context's hosts. All streams close, and the debug session and stream terminals end. App servers start again at the next `didOpen`. tmux terminals of kind `app` survive.
    - After the restart, those terminals must still be known as the app's, so Disable ends them and `window.terminals` lists them.
    - The brief names no record that ties a tmux session to its app across a restart. A tmux session name suffix or option is a choice.
17. **A page reload with a stream terminal open.** The terminal stays (the host holds it). The page reattaches and is given the stream terminal's recent output, as a tmux pane's capture is given. The brief names no buffer for this.
18. **Two pages showing one stream terminal.** Input from both reaches `handleInput`. `setDimensions` receives one size by a stated rule; tmux uses the smallest client.
19. **A tab closed on a stream terminal.** `pty.close()` is called, then `onDidCloseTerminal` fires.
20. **A task label collides with a found command.** An app task with source `npm` and name `build` collides with the found `npm: build`. The two are listed apart: the brief's `<source>: <name>` names no app, so the label needs the app's title, as a name held twice is shown with its source (HELP.md:360).
21. **A root app's language server, decorations, source control or tasks.** They act only within its own root (G49, and G77's "own scope"). "One server per served root" would give a root app's server documents of every root.
22. **A `launch.yml` entry whose app type has an issue.** An entry naming the type of a disabled, unapproved or uninstalled app, or an unknown type, is left out with a finding.
23. **Two apps declare one debugger type.** The later app is refused (`id_taken`).
24. **An app adapter launch and approval.** Today every launch asks for approval (HELP.md:386). Whether an app adapter launch asks, as Z837 rules for tasks, is not stated.
25. **An app adapter Stop.** Today Stop asks a confirmation naming the process (HELP.md:389, `session.ts:572`). Whether an app adapter's Stop asks is not stated.
26. **Placeholders in an app type's keys.** "Passed as written" against `${file}` filled for F5. VS Code substitutes `${...}` in every value, which is what `resolveDebugConfigurationWithSubstitutedVariables` is named for.
27. **`startDebugging` while a session runs.** It resolves `false`, under one session at a time. `customRequest` with no session rejects.
28. **An app with `contributes.debuggers.program` and no `host`.** The brief has the runner start the adapter, so either a host is required (a finding) or oculus runs the program. The choice is not made.
29. **A problem matcher with a slow pattern over 50 MB of output.** The server is not blocked; patterns are matched line by line with a line-length bound.
30. **A matcher `fileLocation` outside the repository.** The diagnostic is dropped.
31. **Rerun of a `CustomExecution` task whose host is stopped.** Refused with a sentence, or the host is started first.
32. **A grammar `scopeName` equal to a shipped one** (for example `source.python`). The shipped grammar is kept, or the app is refused with a finding.
33. **A grammar with a pathological regex.** It runs on the page in oniguruma. The page's response is not covered.
34. **An app language whose tab opened before its host started.** The tab is coloured by the grammar at once, and gains server features when the server comes up.
    - Today the page learns a server's capabilities from the entry's static `capabilities(language)` (servers.ts:197).
    - An app server's capabilities are known only after `initialize`, so the page needs dynamic registration, or a fixed full set answered null.
35. **An app's server on a private file** (secrets, `~/.oculus`) or a machine file (D70). Never put on it (item 3 states the private part).

## 7. ADRs

None. `ls docs/adr tools/oculus/docs/adr` from the repository root answers "No such file or directory" for both.

## 8. Dictated text

The brief dictates almost no reader-facing sentence word for word. The fixed strings:
- `` `<source>: <name>` ``, the task label (`grep -n '<source>: <name>' D64.md` finds lines 59 and 91). It holds against spec.md (ASCII, plain). It collides with found commands (section 6, input 20).
- `` (`outside`) ``, the refusal word (`grep -n '`outside`' D64.md` finds line 68). It holds, and is an existing oculus refusal word (guarded.md G2, "refuses `outside`").
- The kind `` `app` `` (line 62). It holds, as a named vocabulary value.
- The finding key `findings.apps.id_taken` (line 31). It holds as a key. Its existing sentence cannot express a clash with an oculus language (section 4).
- "Everything in the brief is done" (line 162). It is spec.md's own and holds.
- The doc grep of item 12 (line 76). It holds as a command, and misses one sentence (section 1). Run on main it gives 164 hits (`... | wc -l`), 37 of them in `docs/diagrams/channels.svg`.
- The sentence of item 1, "The runner never writes a stream's bytes to file descriptor 1". It is not reader-facing, but read against DESIGN.md:448 it contradicts the protocol: every message, the four stream rows included, is JSON-RPC over the host's standard output. Either the stream bytes travel encoded on that connection (then the sentence means "never raw"), or streams use another pipe. Its meaning needs stating.

`LC_ALL=C grep -n '[^ -~]' D64.md` prints nothing: the brief is ASCII.

## Buildable in one build by one builder

Open item 42 rules that D64 stays one step, and the memory rule forbids proposing a split, so this judges only whether the brief can be built without choices it does not make. It cannot, as written. These items need a choice the brief does not make:
1. **Item 1, flow control.** The stream flow-control wire format: an acknowledgement or credit on `oculus/stream/control`, or another mechanism. Without it the backpressure demand and case 16 cannot be built as one thing.
2. **Item 1, the stream's path.** Whether a stream rides the host's stdout JSON-RPC connection or its own pipe (section 8).
3. **Item 3, stderr.** How an executable app server's stderr reaches oculus for Show Language Server Output. No stream kind carries it, and the host's own stderr is the Processes view's output.
4. **Items 3 to 9, the protocol rows.** Line 11 says "adds rows" and "changes no row already built". Item 3 extends `oculus/provide`'s purpose to a `languageServer` kind, and `oculus/register` lists only `command`, `statusItem`, `tree` and `panel` (`registry.ts:53`, DESIGN.md:461). No new row is named for:
   - provider registrations;
   - `createSourceControl` and its updates;
   - input box writes both ways;
   - decoration changes;
   - `createTerminal` and the `Terminal` calls;
   - `executeTask`, `fetchTasks` and the task events;
   - `startDebugging`, `customRequest` and `breakpoints`;
   - the `workspace.textDocuments` events.

   Open item 43 says D62 designed every row D64 needs; the table shows it did not.
5. **Items 4, 8 and 9, the uri shape.** D63 gives `resourceUri` as `{ root, path }` (docs/apps.md:200). Item 4's `TextDocument.uri` and `Location` are the relay's server uris. Item 8's `outside` needs a path a workspace folder may not hold. The shape, whether a `Uri` class exists, and `workspace.workspaceFolders` (absent, section 2) are a public API shape for docs/apps.md.
6. **Item 8, the original text.** How the host answers the original text for the quick diff. VS Code does this through `workspace.registerTextDocumentContentProvider` on a scheme, which the brief does not list.
7. **Item 2, language precedence.** Where an app language joins the server's and page's maps (`languageMap`, `registered`, 21 `languageOf` callers). Its precedence against the user's `languages:` key and the shipped list. How `filenamePatterns` and `firstLine` are read. The finding key for a clash with an oculus language.
8. **Item 3, the page side.** How the page learns app languages and capabilities. `ui/controls/editor/kit/lsp/hosts.ts` is in `ui/`, which imports no state (spec.md:54), and the `app-shell` payload is state. This is internal, but it decides the shape of the kit's API.
9. **Item 3, two servers per language.** What the status item, Restart Language Server and Show Language Server Output act on when one language has two servers. These are user-visible.
10. **Item 5, the debug client.** Each of these is user-visible:
    - the approval for an app adapter launch;
    - Stop's confirmation;
    - variable substitution;
    - where `configurationSnippets` and `provideDebugConfigurations` are offered;
    - an app debugger with no host;
    - `runtime` resolution.
11. **Item 6, user-written tasks.** The commands.yml key a user writes to configure a task of an app's type or to name a contributed `$matcher`. This is a config key; without it `resolveTask` has no input. Also the label when an app task's `<source>: <name>` equals a found command.
12. **Item 7, terminals.** The record that ties a tmux `app` terminal to its app across a server restart. The output kept for a stream terminal on a page reload.
13. **Item 9, decorations.** The merge of several providers on one file, and a badge over two characters.
14. **Item 10, menu ids.** `terminal/title` is to be replaced by VS Code's `terminal/title/context`, and the `scm/*` ids D64 leaves dropped need naming.
15. **Item 11, the inventory.** The shape of anything the builder finds unmet (snippets at least, against case 17).
16. **Item 0 and case 18, the folder.** How `lsp/` stays at 10 items, and whether the tests may change their import paths.

## Declined to judge

- Whether extending G77's text at landing needs Axel's word: I named it as a possible clash in section 4; it is the orchestrator's call.
- Whether "file read and write and watchers", "processes" and "network" count as met by Node in the host: this is the ruling's reading, not settled by any file I read.
- Whether `scm/inputBox` exists in VS Code's proposed API: not verified by a command in this session.
- Whether D64's size is within one builder's reach: Axel ruled one step (open item 42), so I judged only the choices left open.

## Usage

Agent aa2213f7585bfd534, claude-opus-5-5, 231,182 tokens, 58 tool uses, 9.7 min.

## Closed

Every finding is closed in `agents/briefs/D64.md` as rewritten before the preparation commit, by the automode choices Z840 to Z848 (`plan.md` Rulings) and two open items left to Axel.

- Relay split vs case 18, the full folder, the guarded Code lines: item 0 moves the relay into `lsp/relay/`, case 22 allows import-path changes only, and the report lists the Code-line paths of G1, G36 and G63 for landing (Z840).
- Unmade wire formats (Buildable 1 to 4, section 8's fd-1 sentence): item 1 states the encoding, credit flow control, stderr, per-host ids and bad data (Z841); the new protocol rows are item 2, raised as open item 65 since they touch Axel's ruling on open item 43.
- The uri shape and the workspace API (Buildable 5, 6; inventory "file read and write and watchers"): item 6 (Z844), with `registerTextDocumentContentProvider` as the quick diff's original.
- Languages (premise on `onLanguage:`, Buildable 7, 8, implied inputs 4, 32, 33, 34; case 6's departure from VS Code): item 3 and item 4's page side (Z842); case 6 rewritten.
- Inventory "language features" (snippets and the other language points; case 17): item 3 builds them; the unknown-point case uses `notebooks`.
- Several servers (Buildable 9; implied inputs 3, 5, 6, 7; cases 3 and 4): item 4 (Z843); cases 3 and 4 rewritten.
- Debug (Buildable 10; fields with no behaviour; implied inputs 22 to 28; case 7's uncovered capabilities): item 7 (Z845); cases 7 and 9 widened.
- Tasks (Buildable 11; no input path for an app task type; implied inputs 20, 29, 30, 31; cases 10 and 11): item 8 (Z846); cases 10, 11 and 12.
- Terminals (Buildable 12; implied inputs 16 to 19): item 9 (Z847); case 13.
- Source control, decorations, menus (`terminal/title`, the `scm/*` ids, Buildable 13 and 14; implied inputs 8 to 13, 21): items 10, 11 and 12 (Z848). The contribution-points page, fetched again by the orchestrator, lists `scm/title`, `scm/resourceGroup/context`, `scm/resourceFolder/context`, `scm/resourceState/context`, `scm/change/title`, `scm/repository`, `scm/sourceControl`, `terminal/context`, `terminal/title/context`, `debug/callstack/context`, `debug/toolBar` and `debug/variables/context`, none marked proposed; all are built and `scm/inputBox`, not listed, is dropped with a finding (case 21).
- Host crash, disable mid-session, stream ids, dev server restart (implied inputs 1, 2, 14, 15, 16): item 1, the preamble, item 9; cases 16 and 18.
- Case 16 could pass without backpressure: case 17 now measures the memory held per stream while the page holds still.
- No list of what oculus keeps (spec.md:88): the section "What oculus keeps beyond VS Code" is added.
- Tests under G1, G35, G36 and G63 as well: item 15.
- A possible rule clash on G77: raised as open item 64.
- Paths shared with D70: "What is on the tree" adds `views/sources/source/language/lsp.ts`, `lsp/library/rules.ts` and the docs and text sweeps.
- Item 12's grep misses `docs/apps.md:43`: item 14's grep adds `nine \(contribution \)\?points`; full folders `runs/commands/`, `ui/controls/editor/kit/`, `kit/lsp/` and `pty/`, `RegisterKind` at registry.ts:53 and `KINDS` at sessions.ts:42 are in "What is on the tree".
- Grammar regex responsiveness (implied input 33): item 3.
