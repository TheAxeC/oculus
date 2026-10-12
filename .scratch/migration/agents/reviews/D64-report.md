Everything in the brief is done.

## Not green in this worktree, and over the time limit

- `npm run test:checks` ends with 2 failing tests of 266, both in `tests/checks/config/`: `integrity.test.ts > the real hub > validates with no findings` (239 findings, every one a `project.yml` of the hub copy this worktree sits in, for example `projects/archive/nogo/fed-faithful-ecg/project.yml` naming a domain missing from the hub's `vocab.yml`) and `config-folder.test.ts > names a group of its own and a path under the hub for every document` (the loop runs over `docs: []`, which `config/layout.yml:189` holds and which is not a file this step changed, so the test finishes with no assertion). Neither reads a file under `tools/oculus` that this step changed; the base copy has no `node_modules`, so they were not run on the base. Command: `npm run test:checks` (output in section "Checks").
- `npm run test:quick -- <316 changed paths>` passes every command (ASCII gate, prettier, eslint, svelte-check, vitest) and takes 53.2 s against the 45 s limit it prints, because 316 changed files select 173 test files (its own line "173 test file(s), 10 essential"). The limit is not met by this list; every command in it passed.
- Full-list runs of `npm run diagrams && npm run test:quick -- <paths>`: 4. Run 1 failed prettier (2 files) and eslint (6 unused definitions); run 2 and run 3 passed and were followed by the size splits of section "Files"; run 4 is the one after the last change and passed (output in section "Checks").

## Open items of the plan (orchestrator-state.md, "Open items", read from the main checkout)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- Open item 77 (2026-10-12, raised by D71's builder, `agents/reviews/D71-report.md` lines 10-14): when a project's repository is cloned into the project's own folder (the default `clone_dir: .`), git treats that folder as a repository of its own, so the hub cannot track the project.yml inside it. This happens for every project made by Clone from GitHub (its project.yml is new) and for every cloned project whose folder is moved or renamed (the old path shows deleted and the new folder shows as one untracked folder; `git add -A` would add it as an embedded repository). A cloned project whose project.yml the hub already tracks and that never moves is fine. Option (a): leave it, and keep the sentence in HELP.md and DESIGN.md that says so. This is the lazy option: it states a limit instead of ending it. Option (b): the repository is cloned into a subfolder of the project's folder, and the project.yml stays beside it: Clone from GitHub writes `<folder>/project.yml` and clones into `<folder>/repository`, and the default `clone_dir` becomes `repository` instead of `.`; every manifest is then an ordinary file of the hub and a move is an ordinary rename. Cost: the working files sit one folder down, and the default Axel accepted (the clone in the project's own folder) changes. The subfolder name is Axel's to choose. Option (c), found after Axel asked for a way that keeps the clone in the project's folder (probed on a scratch hub and clone, 2026-10-12): `git add` of a path inside a cloned folder exits 0 and stages nothing, but `git update-index --add -- <path>` stages it; once the hub's index holds the manifest, an edit shows as ` M`, a plain `git add` stages it, and `git add -A` adds no embedded repository (the block hides the rest). So (c): the clone stays in the project's folder; oculus writes the manifest's entry into the hub's index when it makes a project by Clone from GitHub and when the Explorer moves or renames a cloned project (the old entry removed, the new one added, so the hub shows a staged rename); a move made outside oculus (Finder, a terminal) shows on Findings as a manifest the hub does not track, with a Track action that writes the entry, since no git write runs from a watcher; and the clone's own `.git/info/exclude` gets `/project.yml`, so the clone's repository never lists the manifest. Cost: oculus stages a file in the hub's git on those two actions, and a manifest added by hand from a terminal needs `git update-index --add` or the Track action. Axel's point (2026-10-12, not a ruling yet): Clone from GitHub is for any GitHub repository, which may or may not carry a `project.yml`; a clone is a repository of its own, so its `project.yml` is that repository's, and (a) is the design rather than a limit. Defect found from it, to be fixed whatever the ruling: D71's `cloneAsProject` writes `project.yml` before cloning, and `cloneRepository` then refuses a repository that tracks `project.yml` (brief case 19), so a repository with its own manifest cannot be cloned; the brief read open item 67 part 5 as every repository lacking one. Under (a) as the design: a repository with its own `project.yml` (root or `.oculus/`) is cloned as it is and nothing is written; the exclude block hides the whole clone folder, without the `!project.yml` line; the open question is the `project.yml` oculus writes for a repository without one, which then is tracked by neither the hub nor the repository until Axel commits it to the repository. Previous recommendation (c), held until Axel rules. Goes into D71's repair round when ruled; D71 waits for it before landing.

## Rulings received, acknowledged

- Open item 64 (a): G77's list gains the tool contributions, so the tests of this step are filed under G77 as the brief says. The lazy option was to file them under an existing entry whose list does not name them or to leave them without an entry; it was not taken.
- Open item 65 (a): new protocol rows per namespace, changing no row already built, as item 2 of the brief says (DESIGN.md protocol table: the four `oculus/stream/*` rows are now `yes`, and every new call is a row of its own). The lazy option was to widen a built row to carry the new kinds of call; it was not taken.

## Stray git commands (disclosure)

I ran no git command meant to change anything. Five read-only invocations were typed by mistake or inside a compound command, none with an effect on the tree: `git diff --stat` inside a compound command; `git -C . status >/dev/null` inside a compound command; `git diff --no-index /dev/null /dev/null`; `git status >/dev/null 2>&1; sed -n ...`; a bare `git 2>/dev/null` that printed usage. `sh utils/folder-check.sh` and `npm run test:quick` call git themselves (the required verification scripts).

## Cases, first run on the unchanged tree and run now

The first run on the unchanged tree is recorded in the scratchpad file `notes.md` ("First run"); a case whose test imports a module the base copy does not hold fails at that import (`ls` of the base copy shows the module absent: `src/lib/server/machine/apps/tools/`, `src/lib/server/machine/lsp/relay/`, `src/lib/server/machine/debug/launch/`, `src/lib/state/system/apps/tools/`, `src/lib/state/sessions/terminal/pty/matchers.ts`, `tests/server/machine/apps/world/`; `grep -c endingOf` of the base's `terminal-lists.ts` prints 0). The 22 cases are all in the brief's list; none was found wrong by the brief's own rules.

| Case | Shown by | First run on the unchanged tree | Run now |
| --- | --- | --- | --- |
| 1 language, grammar, snippets, stdio server | `manifest-tools.test.ts`, `languages.client.test.ts`, `languages.test.ts` ("starts with the first document of its language under a served root...") | `contributes.languages`, `grammars`, `snippets` each read as key_unknown, so the folder is not an app (notes.md); `languageOf('a.note')` is plaintext | pass |
| 2 serverOptions function | `languages.test.ts` ("starts from a serverOptions function...") | `language-app.ts:11` imports `lsp/relay/relay.ts`, absent in the base | pass |
| 3 hover provider and collection beside oculus's markdown server | `languages.test.ts` ("answer a hover of the document and add their diagnostics...") | the base `createShell` api has `commands`, `window`, `workspace` only (notes.md), no `languages` | pass |
| 4 two servers, one language | `languages.test.ts` ("join their answers...", "show together with the name of each server...") | same missing api | pass |
| 5 app disabled while a server runs | `languages.test.ts` ("has its server end, its diagnostics leave...") and `server-lifetime.test.ts` | same missing api | pass |
| 6 `.mdx`, language_taken, user `languages:`, filenamePatterns, firstLine, grammar scopeName | `manifest-tools.test.ts`, `languages.client.test.ts` | `languageOf`: `a.mdx`, `a.note`, `notes/a.txt` are plaintext, `a.md` markdown (notes.md) | pass |
| 7 debugger `notes.dbg` end to end | `debug-adapters.test.ts` | `contributes.debuggers` is key_unknown (notes.md) | pass |
| 8 launch.yml with no type, and `type: gone.dbg` | `debug-adapters.test.ts` ("reads an entry with no type as the oculus adapter and leaves out the type no app declares...") | `type`, `request`, `stopOnEntry` each rejected as "not a key of a launch configuration" and the entry left out (notes.md) | pass |
| 9 inline, server and executable descriptors | `debug-adapters.test.ts` | `debug/launch/read.ts` absent in the base (`debug-adapters.test.ts:22`) | pass |
| 10 task provider | `tasks.test.ts` | `contributes.taskDefinitions` is key_unknown (notes.md) | pass |
| 11 problem matchers | `matchers.client.test.ts` | `state/sessions/terminal/pty/matchers.ts` absent in the base (`matchers.client.test.ts:23`) | pass |
| 12 commands.yml `type: notes.task` | `tasks.test.ts` ("resolves a typed commands.yml entry...") | entry `type: notes.task` without `run` gives finding `commands[0].run` "must be text" (notes.md) | pass |
| 13 terminals, tmux and pty | `terminals-tmux.test.ts`, `terminals.test.ts`, `terminals-scope.test.ts` | `apps/tools/streams.ts` absent in the base (`terminals.test.ts:17`) | pass |
| 14 source control | `scm.test.ts`, `scm.client.test.ts` | `scm/inputBox`, `scm/title` menus are "no menu oculus draws" (notes.md); `apps/tools/routes.ts` absent (`scm.test.ts:18`) | pass |
| 15 decorations | `decorations.test.ts` | `tests/server/machine/apps/world/language-app.ts:11` imports an absent module | pass |
| 16 host crash with a stream of each kind open | `terminals/host-end.test.ts`, `terminals.test.ts` ("is closed with the host by a crash...") | the same absent modules | pass |
| 17 50 MB terminal stream backpressure | `terminals.test.ts` ("is held to the window of the stream while the page holds still, loses no byte once it reads...", `TOTAL = 50 * 1024 * 1024`) | `streams.ts` absent | pass |
| 18 bad ids | `streams.test.ts` ("refuses an id that is open, an id that closed, a bad id...", "is dropped with a line in the output...") and `terminals.test.ts` ("drops data for an id it did not open...") | `streams.ts` absent | pass |
| 19 root app in a workspace of two roots | `languages.test.ts` ("is given only the documents of its own root"), `scm.test.ts` ("sees the folder of its own root only..."), `decorations.test.ts` ("is asked for the files of its own root...") | absent modules | pass |
| 20 workspace.fs, findFiles, watcher, applyEdit | `workspace.test.ts` | `createShell` api has `workspace` keys `getConfiguration`, `onDidChangeConfiguration` only (notes.md) | pass |
| 21 unknown point `notebooks`, menu `scm/inputBox` | `manifest-tools.test.ts`, `manifest-contributes.test.ts` (row edited, see "Edits to existing assertions") | `contributes.notebooks` is key_unknown (notes.md); the menu `scm/inputBox` is dropped with finding `contributes_menu_dropped` | pass |
| 22 relay split | the unchanged base tests of `tests/server/machine/lsp` | `diff -r` of the base's `tests/server/machine/lsp` against this tree differs only by the import lines `lsp/relay.ts` to `lsp/relay/relay.ts` (6 files) plus the shared helpers of the lifetime suite (see "Edits to existing assertions") | pass |

Cases only a page shows (the grid, the Repositories view, the Files rows, the editor kit) are checked by reading and by the unit-level runs above; the look on landing is: the Terminal tab with an app terminal of each kind (cases 13, 17), the Repositories view with an app source control (14), the Files view with badges and a colour (15), the Debug view with an app debugger (7), and a source tab in an app language with its server's hover and diagnostics (1 to 6).

## DONE / NOT DONE per item of "What to build"

NOT DONE: nothing. Each row names the code and the command or test that shows it; the commands are in "Checks".

| Item | State | Code | Shown by |
| --- | --- | --- | --- |
| 0 relay split | DONE | `src/lib/server/machine/lsp/relay/` holds `relay.ts` (115 lines, the `Relay` class and its head comment), `relay-apps.ts`, `relay-join.ts`, `relay-life.ts`, `relay-make.ts` (with `prepare` and the held-server helper as named functions), `relay-options.ts`, `relay-pages.ts`, `relay-route.ts`, `relay-server.ts`, `relay-state.ts`; `ls src/lib/server/machine/lsp/relay.ts` answers no such file | case 22, `wc -l` in "Checks" (largest 554) |
| 1 streams | DONE | `apps/tools/streams.ts` (`StreamHub`, the four `oculus/stream/*` rows, 256 messages or 1 MiB of credit), `apps/host/runner/streams.mjs` (the host's end), `apps/tools/run/stream-terminals.ts`, `run/stream-actions.ts` | `streams.test.ts`, `terminals.test.ts` (case 17), `host-end.test.ts` (case 16) |
| 2 protocol rows | DONE | DESIGN.md protocol table: the four stream rows `yes`, about 30 new rows `oculus/languages/*`, `workspace/*`, `debug/*`, `tasks/*`, `terminals/*`, `scm/*`, `decorations/*`; no row already built was changed | `grep -n "later step\|not yet built" DESIGN.md` prints nothing |
| 3 languages points | DONE | `read/contributes/{place,reader-tools,shape-tools}.ts`, `read/across/languages.ts`, `read/tool-files/tool-files.ts`, `data/helpers/files/apps/tools/{language-kit,editor-defaults,languages,scope-names}.ts`, `state/system/apps/tools/languages.svelte.ts`, `ui/controls/editor/kit/languages/apps.svelte.ts` | cases 1, 6; `manifest-tools.test.ts`, `languages.client.test.ts` |
| 4 language servers | DONE | `lsp/relay/relay-apps.ts`, `relay-join.ts` (one server per root, 30 s initialize bound, 60 s grace, at most 4 restarts in 3 minutes, a join waits 2 s then sends `$/cancelRequest`), `runner/tools/languages/servers.mjs` | cases 2, 4, 5; `languages.test.ts`, `server-lifetime.test.ts` |
| 5 language features | DONE | `runner/tools/languages/{providers,convert,glob}.mjs`, `apps/tools/languages.ts` (one in-host server per root and language answering the providers) | cases 3, 19; `languages.test.ts` |
| 6 workspace API | DONE | `apps/tools/{workspace,scope}.ts`, `runner/tools/workspace.mjs` (fs, findFiles, applyEdit, watchers, workspaceFolders and `foldersChanged`) | case 20; `workspace.test.ts` |
| 7 debug adapters | DONE | `apps/tools/debug.ts`, `debug/app/{adapter,capabilities,filters,port,resolve,ends}.ts`, `debug/session/{send,start,controls,types}.ts`, `debug/launch/read.ts`, `runner/tools/debug.mjs`; a debugger app with no host file gets the runner (`runsHost(row)`) | cases 7, 8, 9; `debug-adapters.test.ts`, `host-manager.test.ts` (two rows) |
| 8 tasks | DONE | `apps/tools/run/tasks.ts`, `runner/tools/tasks.mjs`, `state/sessions/terminal/pty/matchers.ts`, `server/machine/runs/commands/files.ts` (typed entries) | cases 10, 11, 12; `tasks.test.ts`, `matchers.client.test.ts` |
| 9 terminals | DONE | `apps/tools/run/{terminals,terminals-env,stream-terminals}.ts`, `runner/tools/terminals.mjs`, `server/machine/pty/sessions.ts` (kind `app`, option `@oculus-app`) | cases 13, 16, 17; `terminals/*.test.ts` |
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
| file read, write and watchers | item 6 plus Node in the host | case 20; `workspace.test.ts` |
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

## Tests per guarded entry (item 15)

Every added test file opens with a head comment naming its entry. The count is the number of `it` blocks; a table-driven block holds one row per outcome. "Fails on the unchanged tree" names the line that fails in the base copy: the import of a module the base does not hold, verified with `ls` of the base.

| Entry | Test file (added) | `it` blocks | Fails on the unchanged tree at |
| --- | --- | --- | --- |
| G77 | `tests/server/machine/apps/tools/languages.test.ts` | 12 | `world/language-app.ts:11` imports `lsp/relay/relay.ts` |
| G77 | `tests/server/machine/apps/tools/debug-adapters.test.ts` | 13 | line 22 imports `debug/launch/read.ts` |
| G77 | `tests/server/machine/apps/tools/tasks.test.ts` | 6 | `apps/tools/run/*` modules absent (through `world/hosts-world.ts`, itself absent at that path) |
| G77 | `tests/server/machine/apps/tools/scm.test.ts` | 8 | line 18 imports `apps/tools/routes.ts` |
| G77 | `tests/server/machine/apps/tools/decorations.test.ts` | 8 | line 15 imports `world/language-app.ts` |
| G77 | `tests/server/machine/apps/tools/workspace.test.ts` | 9 | line 26 imports `world/hosts-world.ts` |
| G77 | `tests/server/machine/apps/tools/streams.test.ts` | 9 | line 16 imports `apps/tools/streams.ts` |
| G77 | `tests/server/machine/apps/tools/terminals/terminals.test.ts`, `terminals-tmux.test.ts` | 7, 3 | line 17 imports `apps/tools/streams.ts` |
| G77 | `tests/state/sessions/terminal/matchers.client.test.ts` | 8 | line 23 imports `matchers.ts` |
| G77 | `tests/state/system/apps-tools/languages.client.test.ts`, `scm.client.test.ts` | 3, 7 | line 15 and line 22 import `state/system/apps/tools/*.svelte.ts` |
| G75 | `streams.test.ts` (the stream rows), `terminals/host-end.test.ts` (2), `debug-adapters.test.ts` | | as above |
| G1 | `tests/server/machine/pty/channel.test.ts` (one `describe`, one test: input from a socket with no token to a stream terminal is refused and nothing reaches the host); `tests/routes/apps/app-manage.test.ts` four rows (`app-host decorate`, `scm`, `file`, `terminal`) | 1 + 4 rows | the channel test imports `apps/tools/streams.ts`, absent; the four rows pass on the unchanged tree as well because the token guard of `handleHostPost` is one generic check, so they show that the new actions are behind it |
| G2 | `workspace.test.ts` (outside, closed and link-out refusals), `decorations.test.ts` ("asks for no file outside the folders of the scope") | | as above |
| G35 | `terminals/terminals-scope.test.ts` (4), `terminals-tmux.test.ts`, `tasks.test.ts`, `tests/state/sessions/terminal/ending.client.test.ts` (3) | | `ending.client.test.ts:13` imports `endingOf`, absent from the base's `terminal-lists.ts` |
| G36 | `server-lifetime.test.ts` (7: 30 s bound at 29.999 s and 30 s, 60 s grace, once per page and root, ends with its root and with the server), `languages.test.ts`, `terminals/host-end.test.ts` | | `server-lifetime.test.ts:13` imports `lsp/relay/relay.ts` |
| G49 | `tests/server/machine/apps/manifest/manifest-tools.test.ts` (3 tables), `tools/routes.test.ts` (5), `manifest-contributes.test.ts` (row edited) | | `routes.test.ts:17` imports `apps/tools/routes.ts`; `manifest-tools.test.ts` fails on its assertions (the reader answers key_unknown for each tool point, notes.md) |
| G63 | `languages.test.ts` ("is above every version sent before for the file, after a close and an open again", with an app server) | | as above |

Added to existing test files: `tests/server/machine/apps/host-manager.test.ts` two rows (a debugger app with no host file gets the runner and no host file argument; an unapproved one is not started), `tests/state/system/apps/flows.test.ts` one test (the Disable question names the debug session, the tasks and the terminals), `tests/server/machine/pty/channel.test.ts` one `describe`. Deleted or renamed tests: none. Renamed helper files (not tests): `tests/server/machine/apps/hosts-fixture.ts` and `hosts-world.ts` moved into `tests/server/machine/apps/world/`.

Test folders: `tests/server/machine/apps/tools/` holds 10 items and `tests/server/machine/apps/tools/terminals/` 4; the two client-state tests of the tools are in `tests/state/system/apps-tools/` because `tests/state/system/apps/` already holds 10 items (`sh utils/folder-check.sh` exits 0).

Shared helpers written instead of copies, because `tests/checks/tree/duplication.test.ts` refuses a block of the same lines in two test files: `relaysMade()` and `states()` in `tests/server/machine/lsp/lsp-fixture.ts` (used by `lifetime.test.ts` and `server-lifetime.test.ts`), `outcome`, `refused` and `offeredWith` in `manifest/manifest-fixture.ts`, `tmuxTerminals()` in `world/tmux-terminals.ts`, `stubbedCommands()` in `tests/state/sessions/terminal/commands-fixture.ts` (used by `matchers.client.test.ts` and `served-roots.client.test.ts`).

## Code-line changes each entry needs (for the orchestrator at landing)

- G1, G36, G63: their Code lines name `src/lib/server/machine/lsp/relay.ts`; it is now `src/lib/server/machine/lsp/relay/relay.ts` and the modules beside it (`relay-apps.ts`, `relay-join.ts`, `relay-life.ts`, `relay-make.ts`, `relay-options.ts`, `relay-pages.ts`, `relay-route.ts`, `relay-server.ts`, `relay-state.ts`).
- G75: gains `src/lib/server/machine/apps/tools/streams.ts` and `src/lib/server/machine/apps/host/runner/streams.mjs`.
- G77: gains `src/lib/server/machine/apps/tools/{languages,debug,scm,decorations,workspace,scope,registry,routes,streams}.ts`, `apps/tools/run/{tasks,terminals,terminals-env,stream-terminals,stream-actions}.ts`, `apps/host/runner/tools/`, `src/lib/server/machine/debug/app/`, `src/lib/state/system/apps/tools/`, `src/lib/state/sessions/terminal/pty/matchers.ts`.
- G2: gains `apps/tools/workspace.ts`, `apps/tools/scope.ts`, `apps/tools/decorations.ts`.
- G35: gains `apps/tools/run/terminals.ts`, `terminals-env.ts`, `stream-terminals.ts`, `src/lib/state/sessions/terminal/terminal-lists.ts` (`endingOf`).
- G49: gains `read/contributes/{place,reader-tools,shape-tools}.ts`, `read/across/languages.ts`, `read/tool-files/tool-files.ts`, `apps/tools/routes.ts`.
- G63: gains `src/lib/server/machine/lsp/relay/relay-join.ts` and `relay-apps.ts` (the versions sent to an app's server) beside the relay path.

## Edits to existing assertions, allow lists and predicates (before and after)

- `tests/server/machine/apps/manifest/manifest-contributes.test.ts`: the row for a menu the reader drops used `scm/title`; it now uses `scm/inputBox`, and its expected finding `words('contributes_menu_dropped', 'scm/title')` is now `words('contributes_menu_dropped', 'scm/inputBox')`. Reason: `scm/title` is a menu oculus draws after this step, `scm/inputBox` is one it does not. The same file imports `outcome`, `refused` and `offeredWith` from `manifest-fixture.ts` instead of defining them.
- `tests/checks/tree/boundaries.test.ts`: the `ui` row of the allowed imports gains `'data/helpers/files/apps/tools/language-kit'` (before: absent; after: listed, with a comment saying the editor's kit takes the kit types and the schema glob rule from a module with no reader and no I/O); the FROZEN list of module-level state gains `lib/ui/controls/editor/kit/languages/apps.svelte.ts:held`, `:signature` and `:version` (before: absent; Monaco registers a language once per page, so the kit last given, its text and the redraw count are page state); `SHELL_STORES` gains `'appTools'` (before: `..., 'apps'`; after: `..., 'apps', 'appTools'`).
- `config/catalogs/icons.yml`: a row `debug_pause` after `debug_start`, matching the new glyph in `glyphs.yml` in the same order.
- `tests/routes/apps/app-manage.test.ts`: four rows added to the table of token-guarded routes (listed in the G1 line above); no existing row changed.
- `tests/state/system/apps/shell.test.ts` and `contributions.test.ts`: the fixtures gained `...noContributes()` and `scmItems: () => []`, `tests/state/system/apps/page-commands.client.test.ts` gained `saveAll`, `showTerminal` and `hideTerminal` stubs, `tests/state/client/terminal/terminal-close.test.ts` and `tests/fixtures/sessions-fixture.ts` gained `app: ''` on a terminal row, `tests/state/system/apps/flows.test.ts` gained an `ending` argument in its builder. These add fields the stores now require; no assertion changed.
- `tests/state/sessions/served-roots.client.test.ts`: the commands store is built by `stubbedCommands(() => listed)` of the shared fixture, which passes `matchers: () => []`; before it built `createCommands({...})` by hand without `matchers`. No assertion changed.
- `tests/server/machine/lsp/lifetime.test.ts`: the suite's `beforeEach` and `afterEach` and its `states()` moved to `lsp-fixture.ts` as `relaysMade()` and `states()`; the assertions are unchanged.
- Predicates, thresholds, allow lists and tolerances other than the ones above: none changed. `tests/checks/tree/duplication.test.ts` and the allow file `allow-duplication.txt` are unchanged.

## Unused exports (`sh utils/unused-exports.sh`, compared with the base's `unused-exports.txt`)

`diff` of the script's output against the base file after the last change prints these differences, and no other:

- `src/lib/server/machine/apps/tools/streams.ts: BYTE_WINDOW, MESSAGE_WINDOW`: kept exported; `streams.test.ts` and `terminals.test.ts` assert the credit windows by these values, and `runner/streams.mjs` holds its own two constants because the runner is a plain `.mjs` run by node with no TypeScript loader (the 50 MB case in `terminals.test.ts` shows both ends agree).
- `src/lib/server/machine/lsp/relay/relay-apps.ts: AppStreamLike` (types section): kept exported; `server-lifetime.test.ts` implements it for its scripted stream.
- `src/lib/ui/controls/editor/kit/languages/folding.ts: FOLDING_LANGUAGES, foldingRanges, FoldingRange` and `.../languages/grammars.ts: SHIKI_NAMES`: the base lists the same names under `kit/folding.ts` and `kit/grammars.ts`; the files moved into `kit/languages/`, the names are unchanged.
- Count lines: `Unused exports (244)` against 243 and `Unused exported types (118)` against 117, the differences being the lines above. The base's `CommandSeverity` lines are gone (it is used now) and `stashUrl, worktreeDiffUrl` of `repositories.ts` are gone (`diff/subject.ts` imports them).

Every export the step added that nothing outside its file and its tests imports was made local or removed (62 names made local, found by `unused-exports.sh` and `tsc`): `joinLanguageDefaults`, `snippetsOf`, `firstLineOf`, `languageByFirstLine`, `AppConfigurationSnippet`, `AppEditorLanguage`, `AppEditorSchema`, `AppLanguageIcon`, `AppScmCommand`, `AppToolsProviders` (and the 13 re-exports of `data/model/index.ts` that nothing imports), `RITE` (reader-tools), `ProblemMatcherShape`, `AdapterExecutable`, `DebugRegistration`, `LATE_MS`, `joinedOf`, `PROVIDERS`, `ToolsHosts`, `ToolsShell`, `DECORATE_MAX` (twice), `RING_BYTES`, `OPEN_MS`, `PROVIDE_MS`, `RUN_TASK_EVENT`, `TASKS_MAX`, `TERMINALS_MAX`, `RESOURCES_MAX`, `ScmChange`, `StreamControl`, `StreamKind`, `capabilitiesShape`, `AppDebuggerEntry`, `ControlSession`, `LINES_MAX`, `APP_PROGRAM`, `appEntryId`, `languagesOf`, `streamChild`, `Part`, `declares`, `prepare`, `oculusContext`, `Typed`, `fileEntryShape`, `Fields`, `Hit`, `LINE_MAX`, `severityOf`, `scmStatusItems`, `entriesOf`, `shownPath`, `NO_EXTRAS`, `SEMANTIC_MODIFIERS`, `SEMANTIC_TYPES`, `TerminalMenu`; the definitions `filtersOf`, `isStartKind`, `START_KINDS`, `DecorationsStore`, `LanguagesStore`, `ScmStore` and the `ToolsScope` re-export of `scm.ts` had no user and were deleted.

## Checks (as printed, from `tools/oculus`)

```
$ grep -E "^(ok|FAILED)|test:quick" (output of run 4: npm run diagrams && npm run test:quick -- <316 paths>)
test:quick: 316 changed file(s), from the given paths
test:quick: 173 test file(s), 10 essential
ok      ASCII gate (0.6 s)
ok      svelte-kit sync (2.8 s)
ok      prettier (5.3 s): All matched files use Prettier code style!
ok      eslint (9.8 s)
ok      svelte-check (8.2 s): 1791827689503 COMPLETED 486 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (52.6 s): Duration  44.59s (transform 49.03s, setup 0ms, import 87.25s, tests 82.03s, environment 723ms)
test:quick: 53.2 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
$ npm run diagrams (run 4): exit
exit 0
$ sh utils/folder-check.sh; echo $?
0
$ grep -n "later step\|not yet built" DESIGN.md
$ ls src/lib/server/machine/lsp/relay.ts
ls: src/lib/server/machine/lsp/relay.ts: No such file or directory
$ wc -l src/lib/server/machine/lsp/relay/*
     323 src/lib/server/machine/lsp/relay/relay-apps.ts
     267 src/lib/server/machine/lsp/relay/relay-join.ts
     173 src/lib/server/machine/lsp/relay/relay-life.ts
     130 src/lib/server/machine/lsp/relay/relay-make.ts
      65 src/lib/server/machine/lsp/relay/relay-options.ts
     163 src/lib/server/machine/lsp/relay/relay-pages.ts
     554 src/lib/server/machine/lsp/relay/relay-route.ts
     340 src/lib/server/machine/lsp/relay/relay-server.ts
      69 src/lib/server/machine/lsp/relay/relay-state.ts
     115 src/lib/server/machine/lsp/relay/relay.ts
    2199 total
$ find src tests config -type f ! -name local.yml | xargs perl ... non-ASCII outside config/ (no output expected)
$ LC_ALL=C grep -n "[^ -~]" DESIGN.md HELP.md README.md docs/apps.md
$ npx tsc --noEmit -p . | grep -v CardAction
$ npx svelte-check --tsconfig ./tsconfig.json --output machine | tail -1
1791827872975 COMPLETED 3916 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```


Other runs of this step: `npx vitest run --exclude 'tests/checks/**' --testTimeout 30000` after the last source change except three comment rewraps: `Test Files 237 passed (237)`, `Tests 2244 passed (2244)`; `npm run test:checks`: `Tests 3 failed | 263 passed (266)` before the comment rewraps, of which `comment-width.test.ts` is fixed (it passes alone: `Tests 2 passed (2)`) and the other two are the hub-copy failures named at the top. What these runs do not cover: the look of every page, the Electron app, a real language server of an app other than the scripted ones, and the checks that depend on the hub's data.

## Files (from `diff -rq` of the base copy against this tree, `local.yml` excluded; lines = `wc -l`)

All files lie under the write list (`tools/oculus/{src,tests,config/text,config/catalogs,HELP.md,DESIGN.md,README.md,docs,demo}`) except: `config/catalogs/icons.yml` and `glyphs.yml` are under `config/catalogs` (in the list); `utils/*` is not in the list and holds no change (the table has no `utils/` row); the regenerated `docs/diagrams/*.dot` and `*.svg` (18 files, by `npm run diagrams`, inside `docs`) are not in the table because the base copy holds no `docs`; `README.md` is unchanged. This report is the only path outside the list. The full list of base-only files (moved or removed): `src/lib/data/model/model-apps.ts` and `model-machine.ts` (now `data/model/apps/` and `data/model/machine/`), `src/lib/server/machine/apps/host/host-runner.mjs` and `runner-shell.mjs` (now under `host/runner/`), `src/lib/server/machine/debug/launch.ts` (now `debug/launch/read.ts`), `src/lib/server/machine/lsp/relay-options.ts` and `relay.ts` (now `lsp/relay/`), `src/lib/ui/controls/editor/kit/folding.ts` and `grammars.ts` (now `kit/languages/`), `tests/server/machine/apps/hosts-fixture.ts` and `hosts-world.ts` (now `tests/server/machine/apps/world/`).

| Path | State | Lines |
| --- | --- | --- |
| `DESIGN.md` | changed | 731 |
| `HELP.md` | changed | 479 |
| `config/catalogs/glyphs.yml` | changed | 277 |
| `config/catalogs/icons.yml` | changed | 276 |
| `config/text/app.yml` | changed | 265 |
| `config/text/findings.yml` | changed | 334 |
| `config/text/server.yml` | changed | 391 |
| `config/text/statusbar.yml` | changed | 237 |
| `config/text/views/apps/apps.yml` | changed | 181 |
| `config/text/views/sessions/terminal.yml` | changed | 110 |
| `config/text/views/shared/commands.yml` | changed | 54 |
| `config/text/views/sources/repositories.yml` | changed | 314 |
| `config/text/views/sources/source.yml` | changed | 229 |
| `config/text/views/system/machine/debug.yml` | changed | 92 |
| `docs/apps.md` | changed | 1009 |
| `src/lib/data/helpers/editor/editor.ts` | changed | 160 |
| `src/lib/data/helpers/files/apps/apps.ts` | changed | 285 |
| `src/lib/data/helpers/files/apps/contributes.ts` | changed | 32 |
| `src/lib/data/helpers/files/apps/tools/debuggers.ts` | new | 107 |
| `src/lib/data/helpers/files/apps/tools/decoration-colors.ts` | new | 50 |
| `src/lib/data/helpers/files/apps/tools/editor-defaults.ts` | new | 108 |
| `src/lib/data/helpers/files/apps/tools/language-kit.ts` | new | 194 |
| `src/lib/data/helpers/files/apps/tools/languages.ts` | new | 136 |
| `src/lib/data/helpers/files/apps/tools/scope-names.ts` | new | 52 |
| `src/lib/data/helpers/files/languages.ts` | changed | 183 |
| `src/lib/data/helpers/keys/oculus-keys.ts` | changed | 88 |
| `src/lib/data/helpers/keys/oculus/resolve.ts` | changed | 365 |
| `src/lib/data/helpers/run/tasks.ts` | changed | 14 |
| `src/lib/data/model/apps/model-apps-tools.ts` | new | 319 |
| `src/lib/data/model/apps/model-apps.ts` | new | 285 |
| `src/lib/data/model/index.ts` | changed | 771 |
| `src/lib/data/model/machine/model-debug.ts` | new | 208 |
| `src/lib/data/model/machine/model-machine.ts` | new | 763 |
| `src/lib/data/model/model-sessions.ts` | changed | 747 |
| `src/lib/data/prose/languages.ts` | changed | 162 |
| `src/lib/data/prose/lsp-servers.ts` | changed | 286 |
| `src/lib/data/shapes/shapes.ts` | changed | 324 |
| `src/lib/data/sources/config/editor-options.ts` | changed | 230 |
| `src/lib/server/core/channels.ts` | changed | 276 |
| `src/lib/server/files/fs/ops.ts` | changed | 864 |
| `src/lib/server/machine/apps/host/connection.ts` | changed | 146 |
| `src/lib/server/machine/apps/host/manager.ts` | changed | 774 |
| `src/lib/server/machine/apps/host/plan.ts` | changed | 75 |
| `src/lib/server/machine/apps/host/process.ts` | changed | 226 |
| `src/lib/server/machine/apps/host/published.ts` | new | 24 |
| `src/lib/server/machine/apps/host/runner/host-runner.mjs` | new | 254 |
| `src/lib/server/machine/apps/host/runner/runner-shell.mjs` | new | 585 |
| `src/lib/server/machine/apps/host/runner/streams.mjs` | new | 263 |
| `src/lib/server/machine/apps/host/runner/tools/children.mjs` | new | 26 |
| `src/lib/server/machine/apps/host/runner/tools/debug.mjs` | new | 343 |
| `src/lib/server/machine/apps/host/runner/tools/decorations.mjs` | new | 130 |
| `src/lib/server/machine/apps/host/runner/tools/index.mjs` | new | 162 |
| `src/lib/server/machine/apps/host/runner/tools/languages/convert.mjs` | new | 361 |
| `src/lib/server/machine/apps/host/runner/tools/languages/glob.mjs` | new | 54 |
| `src/lib/server/machine/apps/host/runner/tools/languages/providers.mjs` | new | 815 |
| `src/lib/server/machine/apps/host/runner/tools/languages/servers.mjs` | new | 392 |
| `src/lib/server/machine/apps/host/runner/tools/scm.mjs` | new | 284 |
| `src/lib/server/machine/apps/host/runner/tools/tasks.mjs` | new | 262 |
| `src/lib/server/machine/apps/host/runner/tools/terminals.mjs` | new | 276 |
| `src/lib/server/machine/apps/host/runner/tools/workspace.mjs` | new | 368 |
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
| `src/lib/server/machine/apps/tools/run/stream-terminals.ts` | new | 318 |
| `src/lib/server/machine/apps/tools/run/tasks.ts` | new | 668 |
| `src/lib/server/machine/apps/tools/run/terminals-env.ts` | new | 76 |
| `src/lib/server/machine/apps/tools/run/terminals.ts` | new | 265 |
| `src/lib/server/machine/apps/tools/scm.ts` | new | 278 |
| `src/lib/server/machine/apps/tools/scope.ts` | new | 224 |
| `src/lib/server/machine/apps/tools/streams.ts` | new | 436 |
| `src/lib/server/machine/apps/tools/workspace.ts` | new | 484 |
| `src/lib/server/machine/debug/app/adapter.ts` | new | 67 |
| `src/lib/server/machine/debug/app/capabilities.ts` | new | 93 |
| `src/lib/server/machine/debug/app/ends.ts` | new | 50 |
| `src/lib/server/machine/debug/app/filters.ts` | new | 58 |
| `src/lib/server/machine/debug/app/port.ts` | new | 83 |
| `src/lib/server/machine/debug/app/resolve.ts` | new | 80 |
| `src/lib/server/machine/debug/breakpoints.ts` | changed | 139 |
| `src/lib/server/machine/debug/inspect.ts` | changed | 151 |
| `src/lib/server/machine/debug/launch/read.ts` | new | 288 |
| `src/lib/server/machine/debug/launch/write.ts` | new | 65 |
| `src/lib/server/machine/debug/routes.ts` | changed | 271 |
| `src/lib/server/machine/debug/session.ts` | changed | 849 |
| `src/lib/server/machine/debug/session/controls.ts` | new | 207 |
| `src/lib/server/machine/debug/session/send.ts` | new | 75 |
| `src/lib/server/machine/debug/session/start.ts` | new | 321 |
| `src/lib/server/machine/debug/session/types.ts` | new | 153 |
| `src/lib/server/machine/debug/shapes.ts` | changed | 77 |
| `src/lib/server/machine/debug/wire.ts` | changed | 186 |
| `src/lib/server/machine/lsp/adapters/entry.ts` | new | 259 |
| `src/lib/server/machine/lsp/held/diagnostics/published.ts` | changed | 120 |
| `src/lib/server/machine/lsp/held/documents.ts` | changed | 128 |
| `src/lib/server/machine/lsp/held/held.ts` | changed | 842 |
| `src/lib/server/machine/lsp/held/oculus.ts` | changed | 128 |
| `src/lib/server/machine/lsp/held/requests/links.ts` | changed | 325 |
| `src/lib/server/machine/lsp/relay/relay-apps.ts` | new | 323 |
| `src/lib/server/machine/lsp/relay/relay-join.ts` | new | 267 |
| `src/lib/server/machine/lsp/relay/relay-life.ts` | new | 173 |
| `src/lib/server/machine/lsp/relay/relay-make.ts` | new | 130 |
| `src/lib/server/machine/lsp/relay/relay-options.ts` | new | 65 |
| `src/lib/server/machine/lsp/relay/relay-pages.ts` | new | 163 |
| `src/lib/server/machine/lsp/relay/relay-route.ts` | new | 554 |
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
| `src/lib/shell/commands/DebugToolbar.svelte` | changed | 194 |
| `src/lib/shell/keys/Palette.svelte` | changed | 517 |
| `src/lib/shell/keys/palette-modes.ts` | changed | 284 |
| `src/lib/shell/keys/palette-open.ts` | changed | 88 |
| `src/lib/shell/keys/workbench-keys.svelte.ts` | changed | 582 |
| `src/lib/shell/status/LanguageItems.svelte` | changed | 352 |
| `src/lib/shell/status/SourceItems.svelte` | changed | 192 |
| `src/lib/shell/window/app-languages.svelte.ts` | new | 15 |
| `src/lib/shell/window/source-keys.ts` | new | 24 |
| `src/lib/state/client/context.ts` | changed | 835 |
| `src/lib/state/client/entities.svelte.ts` | changed | 122 |
| `src/lib/state/client/selectors.svelte.ts` | changed | 627 |
| `src/lib/state/client/shapes/client-state.ts` | changed | 180 |
| `src/lib/state/client/shapes/payloads.ts` | changed | 276 |
| `src/lib/state/sessions/source/autosave.svelte.ts` | changed | 198 |
| `src/lib/state/sessions/terminal/commands.svelte.ts` | changed | 874 |
| `src/lib/state/sessions/terminal/composer/opening.svelte.ts` | changed | 205 |
| `src/lib/state/sessions/terminal/pty/matchers.ts` | new | 240 |
| `src/lib/state/sessions/terminal/terminal-lists.ts` | changed | 164 |
| `src/lib/state/sessions/terminal/terminal-marks.ts` | changed | 100 |
| `src/lib/state/sessions/terminal/terminal-payloads.ts` | changed | 105 |
| `src/lib/state/sessions/terminal/terminal-tabs.ts` | changed | 450 |
| `src/lib/state/sessions/terminals.svelte.ts` | changed | 865 |
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
| `src/lib/state/system/machine/debug/debug-adapter.svelte.ts` | new | 217 |
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
| `src/lib/ui/controls/editor/kit/languages/app-grammars.ts` | new | 79 |
| `src/lib/ui/controls/editor/kit/languages/apps.svelte.ts` | new | 64 |
| `src/lib/ui/controls/editor/kit/languages/configuration.ts` | new | 190 |
| `src/lib/ui/controls/editor/kit/languages/folding.ts` | new | 142 |
| `src/lib/ui/controls/editor/kit/languages/grammars.ts` | new | 104 |
| `src/lib/ui/controls/editor/kit/languages/register.ts` | new | 56 |
| `src/lib/ui/controls/editor/kit/languages/snippets.ts` | new | 49 |
| `src/lib/ui/controls/editor/kit/load.ts` | changed | 602 |
| `src/lib/ui/controls/editor/kit/lsp/client.ts` | changed | 778 |
| `src/lib/ui/controls/editor/kit/lsp/hosts.ts` | changed | 246 |
| `src/lib/ui/controls/editor/kit/lsp/peeks.ts` | changed | 119 |
| `src/lib/ui/controls/editor/kit/lsp/semantic.ts` | changed | 120 |
| `src/lib/ui/controls/editor/kit/rite/rite-hover.ts` | changed | 62 |
| `src/lib/ui/controls/editor/kit/rite/settings.ts` | changed | 44 |
| `src/lib/ui/controls/editor/kit/theme/semantic.ts` | changed | 188 |
| `src/lib/views/apps/frame/ApprovalPanel.svelte` | changed | 199 |
| `src/lib/views/sessions/session-list/TerminalRows.svelte` | changed | 237 |
| `src/lib/views/sessions/terminal/TerminalList.svelte` | changed | 499 |
| `src/lib/views/sessions/terminal/app-menus.ts` | new | 36 |
| `src/lib/views/sessions/terminal/bar/TerminalActions.svelte` | changed | 105 |
| `src/lib/views/sessions/terminal/grid/TerminalGrid.svelte` | changed | 517 |
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
| `src/lib/views/sources/source/language/lsp.ts` | changed | 628 |
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
| `src/routes/api/(sessions)/terminal/+server.ts` | changed | 36 |
| `src/routes/api/commands/+server.ts` | changed | 31 |
| `tests/checks/tree/boundaries.test.ts` | changed | 821 |
| `tests/fixtures/sessions-fixture.ts` | changed | 195 |
| `tests/routes/apps/app-manage.test.ts` | changed | 325 |
| `tests/routes/apps/apps-fixture.ts` | changed | 183 |
| `tests/server/machine/apps/host-manager.test.ts` | changed | 640 |
| `tests/server/machine/apps/host-runner.test.ts` | changed | 192 |
| `tests/server/machine/apps/manage.test.ts` | changed | 420 |
| `tests/server/machine/apps/manifest/manifest-contributes.test.ts` | changed | 287 |
| `tests/server/machine/apps/manifest/manifest-fixture.ts` | changed | 144 |
| `tests/server/machine/apps/manifest/manifest-tools.test.ts` | new | 355 |
| `tests/server/machine/apps/secrets.test.ts` | changed | 141 |
| `tests/server/machine/apps/shell/host-commands.test.ts` | changed | 108 |
| `tests/server/machine/apps/shell/runner-shell.test.ts` | changed | 209 |
| `tests/server/machine/apps/tools/debug-adapters.test.ts` | new | 537 |
| `tests/server/machine/apps/tools/decorations.test.ts` | new | 237 |
| `tests/server/machine/apps/tools/languages.test.ts` | new | 604 |
| `tests/server/machine/apps/tools/routes.test.ts` | new | 116 |
| `tests/server/machine/apps/tools/scm.test.ts` | new | 326 |
| `tests/server/machine/apps/tools/server-lifetime.test.ts` | new | 257 |
| `tests/server/machine/apps/tools/streams.test.ts` | new | 187 |
| `tests/server/machine/apps/tools/tasks.test.ts` | new | 275 |
| `tests/server/machine/apps/tools/terminals/host-end.test.ts` | new | 75 |
| `tests/server/machine/apps/tools/terminals/terminals-scope.test.ts` | new | 137 |
| `tests/server/machine/apps/tools/terminals/terminals-tmux.test.ts` | new | 138 |
| `tests/server/machine/apps/tools/terminals/terminals.test.ts` | new | 221 |
| `tests/server/machine/apps/tools/workspace.test.ts` | new | 304 |
| `tests/server/machine/apps/world/debug-app.ts` | new | 225 |
| `tests/server/machine/apps/world/hosts-fixture.ts` | new | 89 |
| `tests/server/machine/apps/world/hosts-world.ts` | new | 413 |
| `tests/server/machine/apps/world/language-app.ts` | new | 233 |
| `tests/server/machine/apps/world/terminals-double.ts` | new | 63 |
| `tests/server/machine/apps/world/tmux-terminals.ts` | new | 34 |
| `tests/server/machine/lsp/adapters/markdown-created.test.ts` | changed | 269 |
| `tests/server/machine/lsp/library.test.ts` | changed | 749 |
| `tests/server/machine/lsp/lifetime.test.ts` | changed | 682 |
| `tests/server/machine/lsp/lsp-fixture.ts` | changed | 363 |
| `tests/server/machine/lsp/relay.test.ts` | changed | 174 |
| `tests/server/machine/lsp/svelte-trust.test.ts` | changed | 150 |
| `tests/server/machine/pty/channel.test.ts` | changed | 462 |
| `tests/server/root/context-fixture.ts` | changed | 207 |
| `tests/state/client/terminal/terminal-close.test.ts` | changed | 162 |
| `tests/state/sessions/served-roots.client.test.ts` | changed | 210 |
| `tests/state/sessions/terminal/commands-fixture.ts` | changed | 54 |
| `tests/state/sessions/terminal/ending.client.test.ts` | new | 74 |
| `tests/state/sessions/terminal/matchers.client.test.ts` | new | 200 |
| `tests/state/system/apps-tools/languages.client.test.ts` | new | 172 |
| `tests/state/system/apps-tools/scm.client.test.ts` | new | 203 |
| `tests/state/system/apps/contributions.test.ts` | changed | 166 |
| `tests/state/system/apps/flows.test.ts` | changed | 254 |
| `tests/state/system/apps/page-commands.client.test.ts` | changed | 129 |
| `tests/state/system/apps/shell.test.ts` | changed | 419 |

316 files.

Every source file in the table is at or under 880 lines and every component at or under 520 (`python3` over the table: no file above; largest source `src/lib/state/system/apps/apps.svelte.ts` 866 and `src/lib/state/sessions/terminal/commands.svelte.ts` 874). Files split in this step to keep the line: `src/lib/server/machine/lsp/adapters/entry.ts` (the types of the server registry, moved out of `servers.ts`, which names them again), `src/lib/server/machine/debug/session/send.ts` (the sends of breakpoints and exception filters, out of `session.ts`), `src/lib/state/sources/repositories/diff/subject.ts` (the identity of a diff pane, out of `repositories.ts`; its importers now import it from there), `src/lib/shell/window/source-keys.ts` (what the workbench keys ask of the source tab, out of `Workbench.svelte`) and `clipboardText` in `views/sessions/terminal/grid/grid-actions.ts` (out of `TerminalGrid.svelte`). Comments were moved with their code, none shortened.

## Documents, paragraph by paragraph

| Document | Part | State |
| --- | --- | --- |
| DESIGN.md | host paragraph (hostless debugger, `runsHost`, `apps.debugger_line`) | rewritten |
| | Activation (two built-in `onCommand` ids, `declaredEvent`) | rewritten |
| | protocol intro and table (stream rows `yes`, about 30 new rows) | rewritten |
| | contributes paragraph (twenty-two points), Menus, Words | rewritten |
| | language servers bullet, debug client bullet, socket channels list (`app-tools`), Processes paragraph | rewritten |
| | ten new paragraphs: Streams, Languages, Language servers of apps, Language features of apps, The workspace API of apps, Debug adapters of apps, Tasks of apps, Terminals of apps, Source control of apps, File decorations of apps | added |
| | every other paragraph | still true (`grep -n "later step\|not yet built" DESIGN.md` prints nothing) |
| docs/apps.md | intro, manifest row (twenty-two points), approval panel, "What stops with an app", points table (13 rows), findings, menus, ids, host section | rewritten |
| | new section "The tools" with a worked example per tool (language server `notes-lsp`, provider `md-notes`, task `make-tasks`) and "Limits of the tools" | added |
| | refusal words, "What an app cannot do", "When something goes wrong" | rewritten |
| HELP.md | Files and the editor, Terminals, Project commands, Debugging, Apps, Source Control | rewritten bullets |
| | every other section | still true |
| README.md | no mention of the tools | still true |
| `config/text/` | added keys `apps.debugger_line`, `apps.ends_*`, `server.apps.*`, `server.debug.*`, `repositories.app_source_*` and the findings `findings.apps.*` for the tool points; no existing sentence changed | rewritten only where listed; others still true |

Head comments: every module this step added opens with a "Layer N, ..." comment; `Relay` and the relay modules carry the relay's comment divided by concern; `servers.ts`, `session.ts`, `repositories.ts`, `Workbench.svelte` and `grid-actions.ts` were rewritten to name where the moved code went; the head comments of the other changed modules state what the module does now (checked by reading each, none names a step, a date or an earlier form).

Item 14's grep (243 hits, scratchpad `item14.txt`) was read hit by hit: `rite_dap` names oculus's own adapter in HELP.md and `config/text/views/system/machine/debug.yml` (`ask_line`, still true); `relay.ts` hits are all `relay/relay.ts`; `SERVED_LANGUAGES` is the constant of `data/prose/lsp-servers.ts` the kit uses; "one adapter" in code is unrelated literature code; `scm/`, `debug/` and `terminal/` hits are real menu ids and paths. No hit was a sentence the change makes false.

History-word grep over the test titles and comments this step added: every hit is an ordinary use (`before`/`after` as variables, "the round before", "sent before for the file", `stillRuns`, `beforeEach`); none refers to code history. `tests/checks/source/history.test.ts` passes alone.

Ids and keys introduced were checked for empty, duplicate and colliding values, and for async paths: a stream id is refused when empty, malformed, open or closed (`streams.test.ts` "refuses an id that is open, an id that closed, a bad id..."); a source control id must start with the app's name and a second control of one id is refused (`scm.test.ts`); a debugger type is refused with `id_taken` when two apps declare it and the earlier app keeps it; a language id another app or oculus holds is `language_taken`; a command id that does not start with the app's name refuses the whole app; a join waits 2 s and then sends `$/cancelRequest` for the slow server (`languages.test.ts` "join their answers...").

## Judgment calls and findings

- DAP has no pause flag, so `DebugCapabilities.pause` reads the non-standard `supportsPauseRequest`; controls are known only after an adapter of that type answered `initialize` in this process.
- Oculus's own `rite` adapter keeps its fixed table (function breakpoints and hover); Finish Frame is offered only for it; launch and attach pass the whole `launch.yml` configuration to an app's adapter; the exception filter choices are kept on the server per type for the process.
- Restart uses the adapter's `restart` when declared, else stop and start with a confirmation; Add Configuration writes through the server's `addConfiguration` (comments kept, 4-space indent, a unique name by a " 2" suffix); `startDebugging` by name from a host fails (false) for a `launch.yml` entry whose `program` holds `${file}`.
- An app adapter's launch asks no approval and an app's task asks no per-text approval (Z845, Z837); Stop of an app debug session asks naming the debugger; the approval panel shows one line per debugger that names a `program` (`apps.debugger_line`); the launch approval text `debugText(repo, cwd, program)` for oculus's own adapter is unchanged.
- Disable, Remove and Revoke name the debug session, the tasks and the terminals of the app they end.
- Language servers: one app server per page and root; restart limit 4 in 3 minutes, then left failed until Restart, otherwise restarted by the next request; a retired app server is given no shutdown or exit but the page is told `gone`, its diagnostics are republished without it and its dynamic registrations withdrawn; the 30 s bound, 60 s grace and the 2 s join wait are the brief's values; a user `languages:` mapping or `editor.languages` names only languages the highlighter registered; a language from the first line is decided from the saved text; JSON schema `fileMatch` without a leading `/` or `**` gets `**/`; `semanticTokenScopes` with `:language` apply to all languages; "ask which server" is a submenu of the status bar menu and one action per server in the tab and palette lists.
- Tasks: matchers are referenced by name (`$name`, names start with the app's name); a command without matchers keeps the default `file:line: error|warning` reading; hits outside the repository are dropped; a background matcher clears its diagnostics at `beginsPattern`; app tasks with scope undefined, Workspace or Global show in every repository of the app's scope, folder-scoped ones only in that folder; typed `commands.yml` entries refuse `run` and `depends_on`; app tasks cannot be dependencies; sessions and schedules pass no `tasks`; Cmd-K lists only the app tasks of the repository holding the on-screen file in its default search mode; `TaskExecution.terminate` sends Ctrl-C to a tmux task terminal; stream-terminal capture strips ANSI on the server.
- Terminals: `preserveFocus` of `terminal.show` is ignored; the request body field is `terminal`; terminal menus apply to every terminal and `terminalProcessSupported` is pid != 0; `CommandSeverity` is widened with `info`.
- Source control: SCM input text is sent 150 ms after the last key; the selection is local to the view; an app's source control is a row of the repository list that shows the control in place of a repository; a duplicate `createSourceControl` id throws synchronously inside the host (`refused:registered`) while a wrong-prefix id is refused asynchronously (`not_declared`, with an output line); SCM refusal words are shown as sentences and a refused menu command posts an error notice; the quick diff covers a file when the control's `root` equals the file's root; `scm/change/title` shows in hunk bars only for diffs against an app control's original.
- Decorations: the badge is git's letter and the app badge cut to 2 characters; a path with a leading `/` in `decorate` is root-relative; a change set over 5000 files is told as a change of every file.
- Workspace: `createDirectory` creates missing parents inside the scope; `applyEdit` validates file operations before it writes text; `oculus/workspace/foldersChanged` is sent when the scope's folders change (a test in `workspace.test.ts`).
- Streams: a stream that crosses a close closes silently; the host runs in its own process group killed when the host ends, and the runner kills the programs it started on exit.
- Names and places: `rite` is the type name of oculus's debugger and `riteFocus`, `riteOnScreen`, `riteFile`, `riteHover` and `riteTabs` were renamed to breakpoint and debug names; `launch.ts` moved to `launch/read.ts`; `app-source.ts` moved to `state/system/apps/tools/source-rows.ts`; `endingOf` lives in `terminal-lists.ts`; the app menu helper is in `views/shared/explorer/control`; the matcher module is `state/sessions/terminal/pty/matchers.ts` with no compile cache; app file paths in manifests have no `./`.
- `Breakpoints.svelte` edit fields use `*_field` words as accessible names, the unused `debug.exceptions` word was deleted and a hint was added to `Field`; the `asked` snippet of `Breakpoints.svelte` takes the tree navigation as a parameter and `AppSourceGroup.svelte` reads `row.paths` through one `{@const}`.
- Page-side Monaco converters (`languageConfiguration`, the app grammars skip, the status `languageName`, the `gone` handling in `lsp.svelte.ts`, the page's F5) have no test of their own: tests exist only as entries of `guarded.md` and no entry names them. The lazy option would be a test outside an entry; it was not taken. They are checked by reading and by the lint and type runs, and the look on landing covers them.
- Against the brief, nothing was found wrong. The one place where the brief's wording and the code differ in a way a reader could trip on: the brief's "relay.ts ... is 880 lines (`wc -l`)" in its premises is the base file; this tree has no such file.
