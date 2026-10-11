Everything in the brief is done.

The [look] cases of the brief (12, 13, 14, 15, 22, 23, the look part of 25 and the look part of 27) are named for the look at landing and were not taken: no Svelte component of this step was drawn by me, since the brief forbids starting the app or a browser. Three tests under `tests/checks` are red in this worktree (`config-folder.test.ts` twice, `integrity.test.ts` once); each is a test of the hub's own data and none names a file of this step (section "Checks"). `npm run test:quick` is green; `npm run test:checks` is not.

# Open items

The open items of the state file (`orchestrator-state.md`, section "Open items"), verbatim: "None."

One item this step raises, for the state file:

**1. `oculus.file-icons` writes configuration, and the brief lists it among the commands that change only what a page shows.**

- Item 3 of the brief names `oculus.theme`, `oculus.file-icons`, `oculus.crt`, `oculus.tab` and `oculus.goto` as the colon commands that "change only what a page shows" and run on a page, and names the colon commands that "write configuration" (`language`, `interpreter`, `compile-database`, `eslint-config`) among those that answer `closed`. `oculus.theme` and `oculus.crt` save the page's own appearance state (`setTheme`, `setCrt` in `src/lib/state/workbench/ui.svelte.ts:600-607`). `oculus.file-icons` writes the key `file_icons` of `config/appearance.yml` through `writeConfigKey` (`ui.svelte.ts:736-739`), a configuration write, and it is the only page command that does.
- Built as the brief names it: `oculus.file-icons` runs on a page and writes `file_icons` only to the name of a file icon theme the page lists (`src/lib/data/helpers/files/apps/commands.ts:13-19`, `src/lib/state/system/apps/shell/page-commands.ts:68-72`; the rows "writes a listed file icon theme" and "refuse a file icon theme that is not listed and change nothing" of `tests/state/system/apps/page-commands.test.ts`).
- Option (a), keep as built. Pro: the app can offer its own icon theme for a one-press switch and the brief's list is followed as written. Con: an app, through its host, writes a configuration file of the reader's, which the closed list stops for the other four commands; the write is undoable (not verified by a test of this step).
- Option (b), answer `closed` like `oculus.language`. Pro: one rule for every command that writes configuration. Con: an app cannot switch the file icon theme it ships; the reader switches it with `:file-icons` in Cmd-K as before.
- Recommendation: (b). The reason the closed list exists applies to this key, and the cost of (b) is one id moved from one list to the other in `commands.ts` and one test row.
- The lazy option is (a): it is built, and keeping it costs nothing.

# Rules, disclosures and boundaries

- No git command was run by me for any purpose other than four read-only ones run by mistake: `git diff --stat`, `git status` and `git -C . status` (twice). `utils/folder-check.sh` and `npm run test:quick` call git themselves; the brief prescribes both.
- I wrote no file outside the worktree and the scratchpad that remains, and under `.scratch/migration/` only this report (not verified by a command: the base copy `D63-base` holds no `.scratch` folder to compare). No `secrets` folder, `~/.oculus`, `config/local.yml` or user data was opened. The app, its server, Electron and a browser were not started. `npm run test:slow` and `npm run test:landing` were not run. No dependency was added: `package.json`, `package-lock.json`, `eslint.config.js`, `tsconfig.json` and `vite.config.ts` are byte-identical to the unchanged copy (`cmp` of each against the copy, no output).
- The unchanged copy used for every "fails on the unchanged tree" quote is a copy of `D63-base` with `node_modules` in the scratchpad (`d63/base`), holding the final test files of this step over the unchanged `src`.
- The temporary files of the runs below (`d63/runs/*.txt`) are in the scratchpad. Nothing of them is in the worktree: `ls tests` lists `checks data fixtures routes server shell state tiers ui views`.

# Checks (run in `tools/oculus` of the worktree, last run after the last change)

| Check | Command | Output |
| --- | --- | --- |
| Verify list | `npm run test:quick` | every line `ok` (ASCII gate, svelte-kit sync, prettier, eslint, svelte-check, vitest), last line `test:quick: 40.9 s (limit 45.0 s); every command passed` |
| Character set, brief item 2 | the perl command of the brief over `src tests config` (no `bin` folder exists) and over `docs/apps.md`, `DESIGN.md`, `HELP.md` | prints nothing, exit status 0 (`perl exit=0 bytes=0`) |
| Themes | `node utils/migrations/convert-vscode-themes.ts --check` | `19 themes up to date`, exit 0 |
| Unused exports | `sh utils/unused-exports.sh` | `Unused exports (244)` against the base's 243; the lines the step added are in the next section |
| Sizes | `find src -name '*.svelte' \| xargs wc -l \| sort -rn` and the same for `.ts` and `.mjs` | largest source files 880 (`src/lib/server/root/context.ts`, `src/lib/server/machine/lsp/relay.ts`, both 880 on the base), largest component 520 (`Diff.svelte`, unchanged); among the files this step changed the largest source file is `src/lib/data/sources/config/settings.ts` at 872 (872 on the base) and the largest components are `Workbench.svelte` and `Editor.svelte` at 519 (511 and 518 on the base); no file is over 880 or 520 |
| Folders | `sh utils/folder-check.sh` | prints nothing, exit 0 |
| Types | `npx tsc --noEmit -p . \| grep -v CardAction` | prints nothing; the three `CardAction` errors are the baseline |
| Svelte | `npx svelte-check --threshold error` | `COMPLETED 3778 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; the incremental run inside `test:quick` prints `COMPLETED 478 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Lint | `npx eslint .` and `npx prettier --check .` | no output; `All matched files use Prettier code style!` |
| Diagrams | `npm run diagrams` | rewrote the 18 files of `docs/diagrams/` that the files list at the end marks changed |
| Slow tests, each alone with `npx vitest run --testTimeout 20000 <file>` | `host-commands.test.ts` | 5 passed |
| | `app-setting.test.ts` | 12 passed |
| | `app-gate.test.ts` | 20 passed |
| | `manifest/manifest.test.ts` | 68 passed |
| | `routes/edit/roots.test.ts` | 3 passed |
| | `routes/hubs/hub-writes.test.ts` | 23 passed |
| Checks | `npx vitest run tests/checks --testTimeout 0 --hookTimeout 0` | `Test Files 2 failed \| 15 passed (17)`, `Tests 3 failed \| 268 passed (271)` |

Full runs of `npm run test:quick`: three. The third ran after the last change to the tree and is the one quoted above. Its last lines, verbatim: `ok      svelte-check (8.9 s): 1791747710431 COMPLETED 478 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest (40.3 s): Duration  33.78s (transform 36.97s, setup 0ms, import 67.65s, tests 58.12s, environment 486ms)`, `test:quick: 40.9 s (limit 45.0 s); every command passed`, and `test:quick: not covered: tests outside the selection, tests/checks, slow tests, build, lint of unchanged files; npm run test:landing runs them`.

The three red tests in `tests/checks`:

- `tests/checks/config/config-folder.test.ts > oculus's own config directory > reads the roots of sources.yml without a finding` fails with `expected 0 to be greater than 0` at line 575, and `... names a group of its own and a path under the hub for every document` fails with `Error: expected any number of assertion, but got none`.
- `tests/checks/config/integrity.test.ts > the real hub > validates with no findings` fails with `expected [ Array(239) ] to deeply equal []`; the findings are of the forms `project X names the domain heart, which is not in the domains of .oculus/config/catalogs/vocab.yml in the hub` (25 of them) and `entries[9].themes[0] is core-ml, which is not a key of vocab.venue_themes`, and none names a file of this step.
- The cause read from the code: the hub defaults to two directories above `tools/oculus` (`src/lib/data/sources/config/local.ts:201`), which for the worktree is the worktree root; `ls /Users/axelfaes/workspace/research-hub/.agents/worktrees/D63/.oculus` prints `No such file or directory` and `ls /Users/axelfaes/workspace/research-hub/.oculus` lists `bookmarks.yml config memories`. The cases over the real hub (`realHub()` in `tests/fixtures/real-hub.ts`) run when the hub's registries and a scan folder are present, which they are in the worktree, and then read a `.oculus/config` that the worktree does not have. On the unchanged copy, whose hub two directories above it holds no registries, `npx vitest run tests/checks/config` prints `Test Files  1 failed | 3 passed (4)` and `Tests  2 failed | 70 passed | 10 skipped (82)`: the 10 skipped are the cases over the real hub, and the 2 failures are `config-folder.test.ts > oculus's own config directory > holds exactly the expected top-level keys, and no more` and `... > reads each file on its own and finds its own keys there and nowhere else`, which list `file_icons` (test line 123) that the unchanged `config/appearance.yml` lacks. Not verified: that the three red tests pass on an unchanged tree inside this worktree, and that they pass on main with its `.oculus/config`.

Lines that differ in `sh utils/unused-exports.sh` between the unchanged copy (243 exports, 116 types) and the worktree (244 exports, 117 types), from `diff` of the two outputs:

| Line | Reason |
| --- | --- |
| `src/lib/themes/vscode-map.ts: MINIMUM, table, parseColour` and the type `TokenRule` | added; imported by `utils/migrations/convert-vscode-themes.ts`, which knip's entry points do not read; `--check` above runs it |
| `server/edit/writes/config/lists/audit-mute.ts: IGNORE`, `lists/rail.ts: RAIL, railLists`, `lists/roots.ts: rootsOf, dirAsWritten` | the base's lines for `audit-mute.ts`, `rail.ts` and `roots.ts`, moved with the files; same names |
| `state/system/config/other-rows/browser.ts: BROWSER_NAMES` and the types `BrowserName, BrowserControl, BrowserValues` | the base's lines for `browser.ts`, moved with the file |
| `ui/theme/theme.ts: CRT_CLASS, WALL_PANEL, WALL_POPOVER, WALL_BLUR` | the base's line for `ui/theme.ts`, moved |
| `state/system/config/rows.ts: sectionOf` | the base's line was `titleOf, sectionOf`; `titleOf` is now used |
| `themes/derive.ts: SCROLL_THUMB_RATIO, SETI_RATIO, contrastOn` | the base's line was `SCROLL_THUMB_RATIO, SETI_RATIO, ratio, contrastOn, readable`; `ratio` and `readable` are now used by `vscode-map.ts` |

# The cases, first run on the unchanged tree and after

"Unchanged tree" is the scratchpad copy. For a case kept as a test, the command is `npx vitest run <file>` there with the file in its final form, and the quote is the failure; the same command in the worktree passes. For a case that is a run, the command and its output are quoted in the section "Runs" below.

| Case | Mark | Test file and title, or run | Unchanged tree | After |
| --- | --- | --- | --- | --- |
| 1 | G49 | `tests/server/machine/apps/manifest/manifest-contributes.test.ts`, "reads the commands of contributes" (5 titles) | `Tests 17 failed (17)` for the file | `Tests 17 passed (17)` |
| 2 | G49 | same file, "reads the menus of contributes > a menu oculus does not draw and a submenu entry are left out, each with a finding, and the app is offered" | in the 17 failed | passes |
| 3 | G49 | same file, "reads the when clauses of contributes" (2 titles) | in the 17 failed | passes |
| 4 | G49 | same file, "reads the activation events that name a command or a view" (3 titles) | in the 17 failed | passes |
| 5 | G49 | same file, "refuses a key or a channel no app has" (3 titles) | in the 17 failed | passes |
| 6 | G77 | `tests/state/system/apps/shell.test.ts`, "Cmd-K and the shell while the state of an app changes" (5 titles); `tests/state/system/apps/contributions.test.ts`, "what an app adds to the shell follows the state of the app" (8 titles) | `Cannot find module '.../state/system/apps/shell/shell.svelte.ts'`; `Cannot find module '.../data/helpers/files/apps/choices.ts'` | pass |
| 7 | G77, slow | `tests/server/machine/apps/shell/host-commands.test.ts`, "choosing a command of an app whose host is not running" (4 titles); frame-only: `shell.test.ts` "a press of a command" (6 titles) | `Cannot find module '.../server/machine/apps/shell/commands.ts'` | 5 passed alone |
| 8 | G77 | `tests/server/machine/apps/shell/shell-commands.test.ts`, "executeCommand for the commands of oculus" (4 titles) and "setContext" (4 titles) | `Cannot find module '.../server/machine/apps/shell/commands.ts'` | pass |
| 9 | run | Run 9 | `ls src/lib/data/helpers/files/apps/when.ts` prints `No such file or directory` | `evaluate true`, `a && ( parses undefined` |
| 10 | G77 | `tests/state/system/apps/app-keys.test.ts`, "a chord of two presses with a key of each platform" (6 titles), "a binding that needs the editor" (2 titles) | `Cannot find module '.../data/helpers/files/apps/keys/bound-keys.ts'` | pass |
| 11 | G77 | same file, "a binding equal to a key oculus takes" (14 titles) and "the table of keys oculus takes agrees with the resolvers that take them" (14 titles) | same | pass |
| 12 | look | the key sheet's Apps heading and Cmd-K's key hint | not taken | named for landing |
| 13 | look | `editor/context`, `explorer/context`, `editor/title`, `view/item/context` | not taken | named for landing |
| 14 | look | status bar items | not taken | named for landing |
| 15 | look | view placement | not taken | named for landing |
| 16 | run | Run 16 | `grep -rl registerTreeDataProvider src` prints nothing | output below |
| 17 | run | Run 17 | `grep -rl createWebviewPanel src` prints nothing | output below |
| 18 | G77 | `shell.test.ts`, "the custom editors an app offers" (6 titles) | `Cannot find module '.../shell.svelte.ts'` | pass |
| 19 | G77, G28 | `tests/routes/apps/app-document.test.ts` (14 titles); `tests/state/system/apps/document.test.ts` (9 titles); G28: `tests/shell/panes/strip/app-editor-close.test.ts` (3 titles) | `Cannot find module '.../server/machine/apps/routes/document.ts'`; `Cannot find module '.../state/system/apps/frame/bytes.ts'`; app-editor-close `Tests 2 failed \| 1 passed (3)`, `TypeError: frame.documentDirty is not a function` | pass |
| 20 | G77 | `tests/routes/edit/apps/app-setting.test.ts` (12 titles); `tests/server/machine/apps/shell/shell-handlers.test.ts`, "the settings a host reads" (4 titles); host half: `host-commands.test.ts`, "the settings an app declares, read by its host" | `Cannot find module '.../data/helpers/files/apps/apps.ts'`; `Cannot find module '.../data/helpers/files/apps/settings.ts'` | pass |
| 21 | run | Run 21 | `grep -rl showWarningMessage src` prints nothing | output below |
| 22 | look | quick pick and input box | not taken | named for landing |
| 23 | look | progress | not taken | named for landing |
| 24 | run | Run 24 | no `oculus/ui` call exists | `CASE24 601st {"ok":true,"value":"rate"}` |
| 25 | run, look | Run 25 | `ls src/routes/api/\(apps\)` lists no `app-theme` | output below; the look part is named for landing |
| 26 | run | `node utils/migrations/convert-vscode-themes.ts --check` | `19 themes up to date` | `19 themes up to date` |
| 27 | run, look | Run 27 | `grep -rl file_icons src config` prints nothing | output below; the look part is named for landing |
| 28 | G77 | `shell-commands.test.ts` "answers `missing` for the command of an app that is disabled and starts nothing"; `shell-handlers.test.ts` "the host of an app that does not act" (3 titles); `contributions.test.ts` (8 titles); `shell.test.ts` "draws nothing of an app that is disabled" | `Cannot find module` as above | pass |
| 29 | G49 | `tests/routes/apps/app-private.test.ts` (25 titles) | `Cannot find module '.../server/machine/apps/reach/private.ts'` | pass |
| 30 | G49 | `manifest-contributes.test.ts`, "gives an id to the first app of the catalogue order" (2 titles) | in the 17 failed | passes |
| 31 | run | Run 31 | `grep -rl 'oculus/register' src config` prints nothing | output below |
| 32 | run | Run 32 | `grep -rl appShell src config` prints nothing | output below |
| 33 | run | Run 33 | `grep -rl executeCommand src config` lists only the three LSP files `ui/controls/editor/kit/lsp/client.ts`, `ui/controls/editor/kit/lsp/transport.ts` and `server/machine/lsp/wire.ts`; no app host registry exists | output below |
| 34 | run | Run 34 | `grep -rl 'oculus/ui' src config` prints nothing | output below |

The first run of the other cases found no brief rule that is wrong on the tree, except the two noted under "Anything in the brief that was wrong" below, which do not change what is built.

## Runs

Run 9, `node d63/runs/case9.mjs` (imports `src/lib/data/helpers/files/apps/when.ts` of the worktree and evaluates `editorLangId == python && !editorReadonly || view =~ /^ghost./` over `{ editorLangId: 'python' }`, then parses `a && (`):

```
evaluate true
a && ( parses undefined
```

Runs 16, 17, 21, 24, 31 and 33 come from one throwaway vitest file over the real runner (`world(..., { real: true })`, a node process for the host; source in `d63/runs/runs.test.ts.txt`, run as `npx vitest run tests/zz-runs/runs.test.ts`, then the folder removed). Vitest reports each of its six cases as failed with `expected any number of assertion, but got none`, since the file asserts nothing; the output is the `CASE` lines:

```
CASE16 roots {"ok":true,"value":[{"handle":"a","label":"A","description":"","tooltip":"","iconPath":"","collapsibleState":1,"command":null,"contextValue":"","resource":null},{"handle":"b","label":"B","description":"","tooltip":"","iconPath":"","collapsibleState":0,"command":{"command":"notes.pressed","arguments":["b"]},"contextValue":"","resource":null}]}
CASE16 children of a {"ok":true,"value":[{"handle":"a1","label":"A1","description":"","tooltip":"","iconPath":"","collapsibleState":0,"command":null,"contextValue":"","resource":null}]}
CASE16 fire {"ok":true,"value":"fired"}
CASE16 changes before/after [{}] [{"":1}]
CASE16 row command press {"ok":true,"value":"pressed b"}
CASE16 expanded {"ok":true,"value":["a"]}
CASE16 stopped provide {"ok":false,"word":"host_down"}
CASE16 app without host {"ok":false,"word":"host_down"}
CASE17 create {"ok":true,"value":"panel-notes.view-1-1791747149951"}
CASE17 request {"id":"r1","app":"app:notes","kind":"panel","panel":"panel-notes.view-1-1791747149951","viewType":"notes.view","title":"Panel","entry":"panel.html","preserveFocus":false}
CASE17 first page answers ok
CASE17 second answer missing
CASE17 requests left []
CASE17 panels [{"id":"panel-notes.view-1-1791747149951","viewType":"notes.view","title":"Panel","entry":"panel.html","preserveFocus":false,"reveal":0}]
CASE17 dispose from other page heard {"ok":true,"value":[]}
CASE17 after page p1 release heard {"ok":true,"value":["disposed"]} []
CASE17 bad entry {"ok":true,"value":"missing"}
CASE17 second panel {"ok":true,"value":"panel-notes.view-2-1791747150356"}
CASE17 host stopped panels undefined []
CASE21 open [{"id":"r1","app":"app:notes","kind":"message","tone":"warning","message":"Sure?","items":["Yes","No"],"modal":false}]
CASE21 answer Yes p2 ok
CASE21 answer again p3 missing
CASE21 resolved {"ok":true,"value":"Yes"}
CASE21 requests after []
CASE21 cleared {"ok":true,"value":"undefined"}
CASE21 disabling with request open 1
CASE21 third {"ok":false,"word":"host_down"} requests []
CASE24 601st {"ok":true,"value":"rate"}
CASE24 requests open 600
CASE31 pick {"ok":false,"word":"host_down"}
CASE31 after {"requests":[],"host":null}
CASE31 restart context {}
CASE33 request [{"id":"r1","app":"app:notes","kind":"command","command":"other.cmd","args":[1],"target":"app:other"}]
CASE33 with a tab open {"ok":true,"value":"via tab"}
CASE33 no tab open {"ok":true,"value":"rejected missing"}
```

Run 31 prints this `CASE31 before` line in full:

```
CASE31 before {"requests":["quickPick","panel"],"host":{"app":"app:notes","commands":["notes.expanded","notes.change","notes.pressed","notes.panel","notes.badpanel","notes.heard","notes.ask","notes.pick","notes.spam","notes.status","notes.ctx","notes.other"],"statusItems":[{"id":"count","alignment":"left","priority":10,"visible":true,"text":"$(check) done","tooltip":"","command":"","name":"","background":"","accessibility":""}],"trees":[{"view":"notes.list","changes":{},"title":"","description":"","message":"","badge":null,"canSelectMany":false,"showCollapseAll":false,"reveal":null}],"panels":[{"id":"panel-notes.view-1-1791747151475","viewType":"notes.view","title":"Panel","entry":"panel.htm
```

What the runs show for the cases:

- Case 16: two rows with one collapsible; expanding asks `getChildren` with the handle (`children of a`); `onDidChangeTreeData` raises the tree's change count from `{}` to `{"":1}`; the row's `command` press runs `pressed b`; `onDidExpandElement` heard `["a"]`; a stopped host and an app with no host answer `host_down`, which the tree view draws as the lines "the program stopped" and "no program" (the drawing is not seen: named for landing).
- Case 17: the request is taken by the first page that answers and the second answer is `missing`; a `dispose` event from another page is ignored; releasing the taking page fires `onDidDispose` and removes the panel; `entry: nope.html` answers `missing`; stopping the host removes the panels. Not run: `sendToPage` with the panel's tab id, which is the existing `oculus/sendToPage` handler and is covered by the host tests of the earlier step.
- Case 21: the message request carries the tone and the items; a page that connects while it is open reads it from the payload (`requests` of `app-shell`); the first answer settles it and the second is `missing`; cleared settles `undefined` (printed as the text `undefined` by the host script); the app disabled with the request open answers the host `host_down` and leaves `requests []`. `modal: true` draws oculus's Confirm: built in `src/lib/shell/commands/AppAsk.svelte`; not drawn by me.
- Case 31: after `stop`, no request is open on any page, the host's registrations are gone and the context starts empty after a restart.
- Case 33: the command goes to the page as `target: app:other`; the tab's answer settles it, and the answer `missing` reaches the host as the error `missing`.

Run 25 and Run 27 come from a throwaway vitest file over `routeSetup` (source in `d63/runs/c25.test.ts.txt`, run as `npx vitest run tests/zz-runs/c25.test.ts`, then the folder removed):

```
CASE25 findings []
CASE25 offered [{"label":"Paper","uiTheme":"vs","path":"themes/paper.json"}]
CASE25 served 200 {"ok":true,"theme":{"colors":{"editor.foreground":"#111111","editor.background":"#fafafa"},"tokenColors":[{"scope":"string","settings":{"foreground":"#aa0000"}},{"scope":"comment","settings":{"foreground":"#667788"}}]},"uiTheme":"vs","label":"Paper","app":"Notes"}
CASE25 bad findings ["the colour theme Paper names themes/bad.json, whose include ../outside.json is not a file of the app or closes a cycle, so the theme is not offered"]
CASE25 bad offered [[]]
CASE25 bad served {"ok":false,"word":"missing"}
CASE25 percent encoding {"view":"app:notes","name":"A/B"}
CASE27 enabled []
CASE27 disabled [["config/appearance.yml","file_icons names app:notes/flat, which no approved and enabled app offers, so the file icons of Seti are drawn"]]
```

The served JSON holds the includer's `editor.background` over the included file's and the included `tokenColors` first. The saved name `app:notes/A%2FB` splits at the last `/` into view `app:notes` and name `A/B`. Not run: the page's conversion of the served JSON into tokens (the look part of 25), the fallback notice on the page, and the finding being shown in the Findings view.

Run 32 has two parts, each a throwaway vitest file that was deleted after it ran.

First part, Disable pressed for an app whose custom editors hold unsaved changes (`createFlows` of `src/lib/state/system/apps/flows.ts` with `dirtyFiles` answering `data.csv`; `d63/runs/c32b.out`):

```
CASE32 asked [{"message":"Notes has custom editors with unsaved changes. Closing them discards the changes.","detail":"data.csv","confirm":"Discard Changes"}] calls-while-the-question-is-open 0
CASE32 after the yes, calls [["/api/app-manage",{"action":"disable","view":"app:notes"}]]
```

The question names the app and the file and offers Discard Changes; while it is open no call was made, so Cancel (not calling `act`) leaves the app enabled; the yes sends the disable. The confirm dialog that draws the question is not drawn by me (look at landing).

Second part, the approval of the app ending while an editor frame of `notes` is marked dirty on `data.json` (a client built as in `tests/shell/panes/strip/app-editor-close.test.ts`, an `apps` row for `notes` with `approved: false` and `hashApproved: false` received, editor frames of `notes` marked dirty on `data.json`; `d63/runs/c32.out`):

```
CASE32 before ["The files of Notes changed, so its approval ended and the unsaved changes to data.json were lost."]
CASE32 after destroy ["The files of Notes changed, so its approval ended and the unsaved changes to data.json were lost."]
```

The notice names the app and the file whose unsaved changes were lost. The changed line the tab shows is not run (S only, look at landing).

Run 34, first half: the same `createRequests` built for two pages, a frame request of a progress at location `window` asked on page 1 (`d63/runs/c34.out`):

```
CASE34 page of the frame [["Working",true]] other page []
```

The request is held on page 1 alone and page 2 holds none. Second half: the 31st `open` of a frame in a minute is answered `rate` by `tests/state/system/apps/methods.test.ts` > "refuses an open target or a write by the page's own checks before any request > the 31st open in a minute, answered rate, and the first again after the window", which passes (`npx vitest run tests/state/system/apps/methods.test.ts`: `Tests  75 passed (75)`).

Run 8, the page taking the request: `shell-commands.test.ts` "hands a page command to the first page that answers, which settles it once" runs the server half. That the focused page is the one that answers is `document.hasFocus()` in `requests.svelte.ts`, read, not run.

## The manifest fields, run

`d63/runs/fields.test.ts.txt`, run as `npx vitest run tests/zz-runs/fields.test.ts` (folder removed after), reading a machine app that names every field, then eleven manifests each with one fault. Output of the full manifest (one line, complete):

```
FULL offered 1 findings ["apps[notes]: menus names scm/title, which is no menu oculus draws, so its entries are left out","apps[notes]: viewsContainers names sidebar, which is neither activitybar nor panel, so its entries are left out"]
FULL contributes {"commands":[{"command":"notes.hello","title":"Hello","category":"Notes","icon":"$(check)","enablement":"editorLangId == markdown"}],"keybindings":[{"command":"notes.hello","key":"ctrl+alt+u ctrl+alt+c","mac":"cmd+alt+u cmd+alt+c","linux":"ctrl+alt+l","win":"ctrl+alt+w","when":"editorTextFocus","args":{"a":1}}],"menus":{"commandPalette":[{"command":"notes.hello","when":"view =~ /^notes\\./","group":"","alt":""}],"editor/context":[{"command":"notes.hello","when":"","group":"navigation@1","alt":"notes.hello"}]},"viewsContainers":{"activitybar":[{"id":"notes.bar","title":"Notes","icon":"$(book)"}],"panel":[{"id":"notes.panel","title":"Panel","icon":""}]},"views":{"notes.bar":[{"id":"notes.list","name":"List","type":"tree","when":"isMac","entry":""},{"id":"notes.web","name":"Web","type":"webview","when":"","entry":"view.html"}],"explorer":[{"id":"notes.files","name":"Files","type":"tree","when":"","entry":""}]},"customEditors":[{"viewType":"notes.edit","displayName":"Edit","selector":["*.csv"],"priority":"option","entry":"index.html"}],"configuration":{"title":"Notes","properties":[{"key":"notes.width","type":"number","default":80,"description":"**Width**","enum":[],"enumDescriptions":[],"minimum":40,"maximum":200},{"key":"notes.mode","type":"string","default":"a","description":"","enum":["a","b"],"enumDescriptions":["A","B"],"minimum":null,"maximum":null},{"key":"notes.tags","type":"array","default":[],"description":"","enum":[],"enumDescriptions":[],"minimum":null,"maximum":null},{"key":"notes.flag","type":"boolean","default":true,"description":"","enum":[],"enumDescriptions":[],"minimum":null,"maximum":null},{"key":"notes.count","type":"integer","default":1,"description":"","enum":[],"enumDescriptions":[],"minimum":null,"maximum":null}]},"themes":[{"label":"Paper","uiTheme":"hc-light","path":"themes/paper.json"}],"iconThemes":[{"id":"flat","label":"Flat","path":"icons/flat.json"}]}
```

The faults, each a manifest with one fault over the full manifest above (`d63/runs/fields.out`, the line as printed: the name of the fault, `offered 0` for the app refused, the findings of the run). Every one refuses the app and names the field; the first two findings of each line are the dropped menu and container of the full manifest, which leave the app offered on their own:

```
FAULT view in no container | offered 0 | ["apps[notes]: menus names scm/title, which is no menu oculus draws, so its entries are left out","apps[notes]: viewsContainers names sidebar, which is neither activitybar nor panel, so its entries are left out","apps[notes]: contributes.views.notes.ghost names the container notes.ghost, which the app does not declare and which is not explorer, so the folder is not an app","apps[notes]: activation names onView:notes.list, which is no view the app declares in contributes.views, so the folder is not an app"]
FAULT setting key without prefix | offered 0 | ["apps[notes]: menus names scm/title, which is no menu oculus draws, so its entries are left out","apps[notes]: viewsContainers names sidebar, which is neither activitybar nor panel, so its entries are left out","apps[notes]: contributes.configuration.properties.flag must start with the app's name and a dot (notes.), so the folder is not an app"]
FAULT bad priority | offered 0 | ["apps[notes]: menus names scm/title, which is no menu oculus draws, so its entries are left out","apps[notes]: viewsContainers names sidebar, which is neither activitybar nor panel, so its entries are left out","apps[notes]: contributes.customEditors[0].priority is missing, or holds a value of another kind than VS Code gives it, so the folder is not an app"]
FAULT bad uiTheme | offered 0 | ["apps[notes]: menus names scm/title, which is no menu oculus draws, so its entries are left out","apps[notes]: viewsContainers names sidebar, which is neither activitybar nor panel, so its entries are left out","apps[notes]: contributes.themes[0].uiTheme is missing, or holds a value of another kind than VS Code gives it, so the folder is not an app"]
FAULT bad setting type | offered 0 | ["apps[notes]: menus names scm/title, which is no menu oculus draws, so its entries are left out","apps[notes]: viewsContainers names sidebar, which is neither activitybar nor panel, so its entries are left out","apps[notes]: contributes.configuration.properties.notes.count.type is missing, or holds a value of another kind than VS Code gives it, so the folder is not an app"]
FAULT icon theme without path | offered 0 | ["apps[notes]: menus names scm/title, which is no menu oculus draws, so its entries are left out","apps[notes]: viewsContainers names sidebar, which is neither activitybar nor panel, so its entries are left out","apps[notes]: contributes.iconThemes[0].path is missing, or holds a value of another kind than VS Code gives it, so the folder is not an app"]
FAULT view id with another app prefix | offered 0 | ["apps[notes]: menus names scm/title, which is no menu oculus draws, so its entries are left out","apps[notes]: viewsContainers names sidebar, which is neither activitybar nor panel, so its entries are left out","apps[notes]: contributes.views.notes.bar[1].id must start with the app's name and a dot (notes.), so the folder is not an app"]
FAULT container id with another prefix | offered 0 | ["apps[notes]: menus names scm/title, which is no menu oculus draws, so its entries are left out","apps[notes]: contributes.viewsContainers.panel[0].id must start with the app's name and a dot (notes.), so the folder is not an app","apps[notes]: viewsContainers names sidebar, which is neither activitybar nor panel, so its entries are left out"]
FAULT view type webview without entry | offered 0 | ["apps[notes]: menus names scm/title, which is no menu oculus draws, so its entries are left out","apps[notes]: viewsContainers names sidebar, which is neither activitybar nor panel, so its entries are left out","apps[notes]: contributes.views.notes.bar[1].entry names , which is not a file of the app of the kind the key takes, so the folder is not an app"]
FAULT editor without selector | offered 0 | ["apps[notes]: menus names scm/title, which is no menu oculus draws, so its entries are left out","apps[notes]: viewsContainers names sidebar, which is neither activitybar nor panel, so its entries are left out","apps[notes]: contributes.customEditors[0].selector is missing, or holds a value of another kind than VS Code gives it, so the folder is not an app"]
FAULT keybinding for undeclared command | offered 0 | ["apps[notes]: menus names scm/title, which is no menu oculus draws, so its entries are left out","apps[notes]: viewsContainers names sidebar, which is neither activitybar nor panel, so its entries are left out","apps[notes]: contributes.keybindings[0].command names the command notes.nope, which the app does not declare in contributes.commands, so the folder is not an app"]
```

The row of a setting has no `items` member: the checked row holds `type: array` as a list of texts, and `items: { type: string }` is read and accepted (`read/contributes/shape.ts:64`) and not carried.

The approval panel's sentence for that manifest's counts, from a throwaway run of `addsWords` over the real catalog (`d63/runs/adds.out`): `"Add 3 commands, 2 keys, 1 view, 1 setting, 1 colour theme to oculus."`, and `""` for an app that adds none. The sentence begins "Add", where the brief's example begins "adds", because the approval panel's line is a request to the reader; the key is `apps.adds_line` in `config/text/views/apps/apps.yml`.

# DONE / NOT DONE

Evidence names: Tn is a test file of the list "Tests added" below; F is the fields run; Rn is the run of case n; "S file:line" is where it is built, which tsc, svelte-check and eslint pass and nothing exercises (a drawing is a look at landing). A row reading S only is DONE as built and NOT verified by a run.

| Row | State | Evidence |
| --- | --- | --- |
| 1 `contributes` key, `appShape`, `AppRow.contributes` | DONE | F; T1 (17) |
| 1 `commands`: `command`, `title`, `category`, `icon`, `enablement` | DONE | F; T1 "reads the commands of contributes" |
| 1 `keybindings`: `command`, `key`, `mac`, `linux`, `win`, `when`, `args` | DONE | F |
| 1 `menus`: `command`, `submenu`, `when`, `group`, `alt`; a menu id outside the list and a submenu entry dropped with a finding | DONE | F (`scm/title` dropped); T1 "reads the menus of contributes" (2) |
| 1 `viewsContainers`: `activitybar`, `panel` with `id`, `title`, `icon`; another kind dropped with a finding | DONE | F (`sidebar` dropped) |
| 1 `views`: `id`, `name`, `type` tree or webview, `when`, `entry`; keyed by a container id or `explorer` | DONE | F; faults "view in no container", "view type webview without entry" |
| 1 `customEditors`: `viewType`, `displayName`, `selector[].filenamePattern`, `priority`, `entry` | DONE | F; faults "bad priority", "editor without selector" |
| 1 `configuration`: `title`, `properties` with `type`, `default`, `description`, `markdownDescription`, `enum`, `enumDescriptions`, `minimum`, `maximum`, `items` | DONE | F; faults "setting key without prefix", "bad setting type"; `items` read, not carried (above) |
| 1 `themes`: `label`, `uiTheme` (`vs`, `vs-dark`, `hc-black`, `hc-light`), `path` | DONE | F; fault "bad uiTheme"; R25 |
| 1 `iconThemes`: `id`, `label`, `path` | DONE | F; fault "icon theme without path" |
| 1 a fault refuses the app with a finding keyed `apps[<id>]` | DONE | F faults (eleven) |
| 1 a `when` that does not parse refuses the app, naming the clause | DONE | T1 "a when clause that does not parse names the clause" |
| 1 the approval panel lists what the app adds | DONE | `adds_line` run above; S `views/apps/frame/ApprovalPanel.svelte:83` (drawing not seen) |
| 1 `onCommand:<id>` and `onView:<id>` must name a declared command or view | DONE | T1 "reads the activation events..." (3); F fault "view in no container" |
| 1 `contributes.submenus` and an unknown point refused `key_unknown` | DONE | T1 "refuses a key or a channel no app has" (3) |
| 1 every id starts with the app name and a dot; two apps of one name, the first in catalogue order keeps an id | DONE | F faults (prefix); T1 "gives an id to the first app of the catalogue order" (2) |
| 2 channel `app-shell` closed to a manifest (`findings.apps.carries.app_shell`) | DONE | T1 "a read of the app-shell channel" |
| 2 payload in `Payloads`, store in `ClientState`, shape in `payloads.ts`, reader in `entities.svelte.ts` | DONE | S `state/shared/stores/shapes.ts:55`, `state/client/shapes/client-state.ts:172`, `state/client/shapes/payloads.ts:183`, `state/client/entities.svelte.ts:116`; used by T13 and the quick run |
| 2 payload holds command handlers, status items, trees with a change count, panels, context keys, open requests | DONE | R16, R17, R21, R31 (payload printed) |
| 2 `POST /api/app-host` actions `run`, `provide`, `answer`, `settings` under the write token | DONE | S `routes/host.ts:37-55,123-161`; T13 "posts the run of the command to the host of its app"; T6 |
| 2 a request shows on every page, first answer settles it, a later answer is `missing` | DONE | R21 |
| 2 three kinds taken by one page: `oculus.<name>` command, frame-only command, panel | DONE | T5 "hands a page command to the first page that answers, which settles it once"; R33; R17 |
| 2 protocol rows `oculus/register`, `unregister`, `provide`, `event`, `subscribe`, `unsubscribe`, `ui`, `changed`, `settings/get`, `commands/execute` built; `oculus/stream/*` left marked | DONE | S `host-calls.ts:125-186`; R16, R17, R21; DESIGN.md rows lose "later step" (read) |
| 2 `oculus/subscribe` kinds `settings`, `visibility`, `selection`, `expand`, `collapse`, `dispose` | DONE | R16 (`expand`), R17 (`dispose`); host-commands settings test (`settings`); `visibility` and `selection` S `runner-shell.mjs:361-364` |
| 2 a second `register` of one id refused `refused:registered` | DONE | T6 "accepts a command of its own name and holds it once" |
| 3 declared command in Cmd-K as `<category>: <title>` with the app title hint and key hint | DONE | T13 "lists the command with its category, its app and its key while the app acts" |
| 3 `enablement` not holding draws the row disabled | DONE | S `shell.svelte.ts:103`; S only |
| 3 `commandPalette` menu `when` hides a command from Cmd-K | DONE | T10 (`menuOffers` with `commandPalette`); S `shell.svelte.ts:128` |
| 3 choosing it fires `onCommand:<id>` through `activate`, whatever `activation` lists | DONE | T7 (2 rows) |
| 3 the host's handler via `oculus/provide` kind `command`; else an open tab's `onCommand`; else a notice | DONE | R16 (`pressed b`); T13 "runs a command only an open tab registered through that tab..." and "says which command of which app nothing handled" |
| 3 host namespaces `oculus.commands`, `oculus.window`, `oculus.workspace` | DONE | S `runner-shell.mjs:82,99,350-456`; R16 to R33 |
| 3 `registerCommand` answers a disposable | DONE | S `runner-shell.mjs:82`; `dispose()` not exercised |
| 3 `executeCommand(id, ...args)` runs a command of any approved enabled app | DONE | T5 "runs the command of another approved, enabled app through its host" |
| 3 a command only a frame registered runs on the page through that app's tab, `missing` with none | DONE | R33 |
| 3 `setContext` | DONE | T5 "setContext" (4 titles) |
| 3 `oculus.theme`, `oculus.file-icons`, `oculus.crt`, `oculus.tab`, `oculus.goto` run on a page | DONE | T12 (13); open item 1 for `oculus.file-icons` |
| 3 `language`, `interpreter`, `compile-database`, `eslint-config`, `update`, `workspace`, `workspace-save`, `folder`, `accent`, `help` answer `closed`; any other id `missing` | DONE | T5 `oculus.update`, `oculus.folder`, "a name of the namespace that is no command"; the other eight by the same list `data/helpers/files/apps/commands.ts:22-33`, no row of their own |
| 3 a frame's `oculus.commands.execute(id, ...args)` | DONE | S `oculus.js:285`; T13 |
| 3 counts under `apps.opens_per_min`, sentence of `config/behavior.yml` updated | DONE | `diff` of `config/behavior.yml` against the base shows the line 306 sentence naming `commands.execute`, `createPanel` and `executeCommand` |
| 4 `when` and `enablement` read with `ContextKeyExpr.deserialize`; `undefined` is the refusal | DONE | R9; T1 |
| 4 the keys `editorTextFocus`, `editorFocus`, `editorLangId`, `resourceExtname`, `resourceFilename`, `resourceLangId`, `resourcePath`, `explorerResourceIsFolder`, `view`, `viewItem`, `focusedView`, `activeCustomEditorId`, `activeWebviewPanelId`, `isMac`, `isLinux`, `isWindows` | DONE | S `state/system/apps/shell/context.ts`; `editorTextFocus` in T9 "runs inside the text editor and nowhere else"; `view` in F/T1 clause; the others S only |
| 4 a key an app sets must start with its name and a dot (`refused:context_key`); a key nothing set is undefined; keys go with the host | DONE | T5 setContext rows; R31 |
| 5 `key`, `mac`, `linux`, `win`, `when`, `args`, two-part chords, `cmd` and `meta` | DONE | T9 (6 + 2 titles) |
| 5 a key oculus or the editor or the desktop menu takes is not bound, with a finding naming both; the app is offered | DONE | T9 "a binding equal to a key oculus takes" (14 titles) |
| 5 two apps one key one `when`: first in catalogue order, finding on the other | DONE | T9 "binds the first app of the catalogue order and notes the second..." and "binds both apps when their clauses differ" |
| 5 resolved after oculus's keys, not in a text field unless `editorTextFocus` | DONE | T9 |
| 5 the key sheet lists them under Apps; Cmd-K shows the key | DONE | T13 (key hint); key sheet S `SearchRows.svelte` and `config/text`; look 12 |
| 6 menus `commandPalette`, `editor/context`, `editor/title`, `editor/title/context`, `explorer/context`, `view/title`, `view/item/context` | DONE | reader list S `reader.ts:31-37`; `commandPalette` T10; the drawing of the others is look 13 |
| 6 entry `command`, `when`, `group`, `alt`; group order, `@<n>`, apps' groups after oculus's, a separator | DONE | S `contributions.ts` (`menuOffers`); T10 uses `menuOffers`; ordering not asserted by a test |
| 6 arguments: `{ root, path }` and the element's handle | DONE | S; look 13 |
| 7 `createStatusBarItem(id, alignment, priority)`, frame `register('statusItem')` and `changed('statusItem')` | DONE | R31 (item `count`); S `state/system/apps/frame/methods.ts:483-498`, `oculus.js:89-91`; T13 "draws the status item of the host of an app that acts" |
| 7 item fields `text`, `tooltip`, `command`, `name`, `backgroundColor`, `accessibilityInformation`; `show`, `hide`, `dispose` | DONE | S `runner-shell.mjs:171-223`; R31 prints `visible`, `text`; the other fields S only |
| 7 `$(name)` glyph, unknown name as text | DONE | S `AppItems.svelte`; look 14 |
| 7 left after `latex`, right before `sessions`, by priority then view id; bar menu `<name> (<app title>)`; hidden list `<view id>/<item id>` | DONE | S `AppItems.svelte`, `shell.svelte.ts:91`; look 14 |
| 7 a frame's items go with its last tab, a host's with the host | DONE | R31 (host) |
| 8 containers and views in the Views catalogue, Apps group; placement float left, bottom, Files pane; `onView`; no rail button; `when` line | DONE | F; S `place.ts`, `state/workbench/layout/open/show.ts:148` (`createShowPlaced`), `state/workbench/layout.svelte.ts:796`, `state/client/context.ts:654`; look 15 |
| 9 `registerTreeDataProvider(viewId, provider)` and `createTreeView(viewId, { treeDataProvider, showCollapseAll, canSelectMany })` | DONE | R16; S `runner-shell.mjs:350-356` |
| 9 `getChildren`, `getTreeItem`; TreeItem `label`, `description`, `tooltip`, `iconPath`, `collapsibleState`, `command`, `contextValue`, `id`, `resourceUri` | DONE | R16 prints `handle`, `label`, `description`, `tooltip`, `iconPath`, `collapsibleState`, `command`, `contextValue`, `resource` |
| 9 `onDidChangeTreeData` sent as `oculus/changed` | DONE | R16 (`changes {}` to `{"":1}`) |
| 9 TreeView `reveal`, `title`, `description`, `message`, `badge` | DONE | S `runner-shell.mjs:375-394`; the printed tree state carries `title`, `description`, `message`, `badge`, `reveal` (R31 `before`); not driven from a host script |
| 9 events `onDidChangeSelection`, `onDidExpandElement`, `onDidCollapseElement`, `onDidChangeVisibility` | DONE | `onDidExpandElement` R16; the three others S `runner-shell.mjs:371-374` |
| 9 drawn with `ui/tree`; row `command` on a press; `contextValue` is `viewItem`; no-host and stopped lines | DONE | R16 (answers); S `views/apps/tree/AppTree.svelte`, `AppTreeRows.svelte`; look |
| 10 webview view drawn as a frame with `onVisibility(visible)`; restored as a view | DONE | S `frame/bridge.ts:14`, `oculus.js:380`; look |
| 10 `createWebviewPanel(viewType, title, { entry, preserveFocus })` with `title`, `reveal()`, `dispose()`, `onDidDispose` | DONE | R17; S `runner-shell.mjs:401-420` |
| 10 frame `createPanel(viewType, title, { entry })` | DONE | S `oculus.js:113,231`, `state/system/apps/frame/methods.ts:167,505` |
| 10 `entry` names a recorded `.html` file else `missing`; closes with host, page reload or close; not restored | DONE | R17; T6 "refuses a panel for a page that is not a recorded file" |
| 11 `customEditors` entries; a `default` editor opens its files from every opener; apps folder stays source | DONE | T13 "opens a file that matches a default editor in it, in any case of its name" and "opens a file of an apps folder as source text" |
| 11 `option` adds Open With... and Reopen Editor With... listing Text Editor and each matching editor | DONE | T13 "leaves a file to the text editor while the editor is an option, and lists it for Open With", "asks Open With over Text Editor and each matching editor, naming the default", "answers the text editor for the first row and null for a dismissed pick" |
| 11 `document.read()`, `document.save(bytes)`, `document.dirty(flag)` | DONE | T3 (14), T11 (9), T8 (3) |
| 11 handlers `onSave()` for Cmd+S and `onRevert()` for Revert File | DONE | S `bridge.ts:15-16,60`, `oculus.js:382-383`; the Cmd+S route S `workbench-keys`; look |
| 11 read and save under the checks `open({ file })` applies; `closed` and `missing` | DONE | T3 "what a custom editor is closed out of" (7), T2 "a custom editor's read of ..." |
| 11 save through a bytes write in `server/files/` with the hash, local history, `readonly`, `outside` | DONE | T3 "a save of new bytes" (5); `src/lib/server/files/source-bytes.ts`; `readonly` and `outside` S only |
| 11 a save with a source tab holding unsaved text is `refused:unsaved`, both texts kept | DONE | T11 "is refused `refused:unsaved` and sends nothing while a source tab of the file holds unsaved text" |
| 11 a tab of an app not approved, disabled, removed or changed shows the app tab's line; Confirm before Disable, Remove, Revoke; a notice for lost changes | DONE | R32; `flows.test.ts` `dirtyFiles`; the line S only |
| 12 `configuration` rows in Settings under `apps`; controls toggle, number, text, choice, list | DONE | T10 "a setting row of an app"; S `settings/other-rows/AppControl.svelte`; look |
| 12 write kind `app-setting` `{ key, value }` creating `config/behavior.yml`, one key, closed to apps | DONE | T4 "creates the layer holding the one key, which the merged configuration then reads", "is closed to an app: the gate refuses the kind whatever the header names", "takes the write back, removing the layer and folders the write made" |
| 12 `HUB_LIST['behavior.yml']` gains `app_settings`; the schema of `behavior.yml` gains the map | DONE | T4 first row (merged configuration reads it); S `schemas/options.ts` (`appSettingsSchema`), `engine.ts:85` |
| 12 the watcher judges each stored value: type, `enum`, bounds, undeclared key; finding keyed `config/behavior.yml`; the app reads the default | DONE | T4 "the stored values the apps watcher judges" (3), "gives the host the stored value and the default for one that breaks the declaration" |
| 12 the host holds its resolved values; `getConfiguration(section).get(key)` at once | DONE | T7 "the settings an app declares, read by its host" |
| 12 `onDidChangeConfiguration` with the keys that changed, sent from `apps-hosts.ts` | DONE | T7 same row (`[["notes.width"]]`) |
| 12 frame `oculus.settings.get(key)`, handler `onSettings(keys)`; an app reads its own keys alone | DONE | T6 "refuses `not_declared` for a key of another app"; T7 (`not_declared` from the host); frame methods S `oculus.js:308,381` |
| 13 `showInformationMessage`, `showWarningMessage`, `showErrorMessage(message, options, ...items)` with `modal` | DONE | R21 (warning with items); `modal` S `AppAsk.svelte` |
| 13 `showQuickPick(items, { title, placeHolder, canPickMany, matchOnDescription, matchOnDetail })` | DONE | S `runner-shell.mjs:315-329`; the request is printed by the quick pick row of R31 (`quickPick`); drawing look 22 |
| 13 `showInputBox({ title, prompt, value, placeHolder, password, validateInput })`; `validateInput` through `oculus/provide` kind `validateInput` after 150 ms | DONE | S `runner-shell.mjs:331-346,466-469`; look 22 |
| 13 a second quick pick cancels the first | DONE | S `requests.svelte.ts`; look 22 |
| 13 `withProgress({ location, title, cancellable }, task)` with Cancel reaching the token | DONE | S `runner-shell.mjs:140-165`, `oculus.js:318-344`; look 23 |
| 13 counted under `apps.messages_per_min` | DONE | R24; T6 "are refused `rate` from the 601st in a minute, and allowed again after the window" |
| 13 frame `ui.quickPick`, `ui.inputBox`, `ui.message`, `ui.progress`; request local to the frame's page | DONE | S `oculus.js:297-303`; R34 reading |
| 13 `notices.svelte.ts` carries progress | DONE | S `state/workbench/navigation/notices.svelte.ts:5-10` |
| 14 `themes` resolved with `include` inside the app's files | DONE | R25 |
| 14 mapping moved to `src/lib/themes/vscode-map.ts`; the script imports it; output unchanged | DONE | R26 |
| 14 offered as `<label> (<app title>)`, saved as `<view id>/<label>` percent-encoded, split at the last `/` | DONE | R25 (`app:notes/A%2FB`); T10 `themeOffers`, `iconThemeOffers` |
| 14 find page and the presenter's pages draw it through the `ui/` module | DONE | S `ui/theme/app-theme.ts`, `routes/find/+page.svelte`, `routes/present/*`; look |
| 14 `iconThemes` file format (`iconDefinitions`, `fonts`, `file`, `folder`, `folderExpanded`, `fileExtensions`, `fileNames`, `folderNames`, `languageIds`, `light`; `iconPath` or `fontCharacter`) | DONE | S `ui/display/icon-theme/theme.ts`, `held.svelte.ts`; look 27 |
| 14 `file_icons` default `seti`, Settings row File Icon Theme, `:file-icons`, icons served from the app's address | DONE | `config/appearance.yml:92`; `config/catalogs/options.yml:150`; `config/text/app.yml:31-32`; T12 "writes a listed file icon theme"; route S `app-icons/+server.ts` |
| 14 an unavailable theme falls back: colour theme with a notice, `file_icons` with a finding | DONE | R27 (finding); the notice S only; a page that loads before the payload draws the default: S, look 25 |
| 15 `docs/apps.md`, DESIGN.md, HELP.md, catalogs, config | DONE | `LC_ALL=C perl` gate over the three prints nothing; the sentences read; HELP.md and DESIGN.md line numbers of the brief were checked against the new text |
| 16 full folders split into subfolders, importers changed, nothing re-exported | DONE | section "Folder splits"; `sh utils/folder-check.sh` exit 0 |
| 16 `order.ts` gains each new folder; `boundaries.test.ts` follows | DONE | section "ALLOWED and related changes" |
| 16 `settings.ts` under 880 | DONE | 872 lines, the app settings live in `data/helpers/files/apps/settings.ts` |
| 17 `~/.oculus`, each hub's `secrets` and each state path `local.yml` places are closed to every app | DONE | T2 (25) |
| 17 a manifest `files:` entry in one is refused; an entry holding one is offered | DONE | T2 "a files entry" (4) |
| 17 `fs`, `open({ file })`, `document.read`, `document.save` answer `closed`, links resolved | DONE | T2 "a file of a closed folder" (16), T3 |

# Tests added

All 188 tests of the 13 files pass in the worktree (`npx vitest run` over each file; the list printed by `--reporter=verbose`). Each file fails on the unchanged copy as the case table quotes. None of them breaks code to see a test fail, and none asserts a defect.

| Tn | File | Tests |
| --- | --- | --- |
| T1 | `tests/server/machine/apps/manifest/manifest-contributes.test.ts` | 17 |
| T2 | `tests/routes/apps/app-private.test.ts` | 25 |
| T3 | `tests/routes/apps/app-document.test.ts` | 14 |
| T4 | `tests/routes/edit/apps/app-setting.test.ts` | 12 |
| T5 | `tests/server/machine/apps/shell/shell-commands.test.ts` | 11 |
| T6 | `tests/server/machine/apps/shell/shell-handlers.test.ts` | 16 |
| T7 | `tests/server/machine/apps/shell/host-commands.test.ts` (slow) | 5 |
| T8 | `tests/shell/panes/strip/app-editor-close.test.ts` | 3 |
| T9 | `tests/state/system/apps/app-keys.test.ts` | 36 |
| T10 | `tests/state/system/apps/contributions.test.ts` | 9 |
| T11 | `tests/state/system/apps/document.test.ts` | 9 |
| T12 | `tests/state/system/apps/page-commands.test.ts` | 13 |
| T13 | `tests/state/system/apps/shell.test.ts` | 18 |

On the unchanged copy `app-editor-close.test.ts` fails 2 of its 3 titles; the third, "asks nothing for a tab no frame marked", passes there and after, which makes it a test of a behaviour the change preserves.

The audit note the brief asks for: a test that would still pass with the behaviour it is written for taken out of the code is an audit, not a proof. The rows of T9 "the table of keys oculus takes agrees with the resolvers that take them" compare a table with the resolvers; they hold by construction while both exist and are an audit of the table. T6 "answers null for a key of its own that no setting declares" and T5 "answers `missing` for a name of the namespace that is no command" pass against any implementation that refuses and are audits. Every other title asserts a result that the unchanged tree cannot give, shown by the `Cannot find module` quotes above.

# Rows for `agents/guarded.md`

For the orchestrator to write at landing, by entry (file and title as printed by `--reporter=verbose`):

- G49 (manifest reader, `contributes`): T1, all 17 titles under "reads the commands of contributes", "reads the menus of contributes", "reads the when clauses of contributes", "reads the activation events that name a command or a view", "refuses a key or a channel no app has", "gives an id to the first app of the catalogue order". Item 17: T2, "the folders closed to every app", "a file of a closed folder", "a file that is not in a closed folder", "a files entry".
- G28: T8, "closing the tab of a custom editor > asks once the frame marked the document dirty, and No closes nothing" and "asks nothing once the frame cleared the mark".
- G77:
  - The contribution registry: T10 (all 9), T13 "Cmd-K and the shell while the state of an app changes" (5), "a press of a command" (6), "the context keys of the hosts" (1), "the custom editors an app offers" (6), T5 (all 11), T6 "what a host registers" (8), "the messages of a host" (1), "the host of an app that does not act" (3), T7 "choosing a command of an app whose host is not running" (4).
  - The key resolver's app bindings: T9 (all 36).
  - The settings read: T6 "the settings a host reads" (4), T4 (all 12), T7 "the settings an app declares, read by its host" (1).
  - The custom editor's save route: T3 (all 14), T11 (all 9).
  - The page commands an app may run: T12 (all 13).

# Folder splits

Each importer was changed in the same step and nothing is re-exported from an old path; `grep -rn` of every old path over `src tests docs *.md utils` prints nothing.

| Folder | Moved | New subfolder |
| --- | --- | --- |
| `src/lib/data/helpers/files` | `apps.ts` | `apps/` (`apps.ts`, `choices.ts`, `commands.ts`, `contributes.ts`, `keys/`, `settings.ts`, `status-items.ts`, `views.ts`, `when.ts`) |
| `src/lib/data/sources/config` | `languages.ts`, `themes.ts` | `sections/` |
| `src/lib/server/edit/writes/config` | `audit-mute.ts`, `rail.ts`, `roots.ts`, `deck/` | `lists/` |
| `src/lib/server/files` | `search.ts`, `search-routes.ts` | `search/` |
| `src/lib/server/machine/apps/read` | | `across/` (`ids.ts`, `key-notes.ts`, `stored.ts`), `contributes/` (`reader.ts`, `shape.ts`), `theme-files/` (`icons.ts`, `themes.ts`) |
| `src/lib/server/machine/apps` | | `shell/` (`commands.ts`, `host-calls.ts`, `registry.ts`) |
| `src/lib/shell/status` | `Bell.svelte`, `NoticeCentre.svelte`, `NoticeEntry.svelte`, `Toast.svelte` | `notices/` |
| `src/lib/state/system/apps` | `bridge.ts`, `methods.ts`, `rules.ts`, `store-cache.ts` | `frame/` (and `shell/` for the shell state) |
| `src/lib/state/system/config` | `browser.ts` | `other-rows/` (`app-rows.ts`, `browser.ts`) |
| `src/lib/ui` | `theme.ts` | `theme/` (`app-rules.ts`, `app-theme.ts`, `theme.ts`) |
| `src/lib/ui/display` | | `icon-theme/` (`held.svelte.ts`, `theme.ts`) |
| `src/lib/ui/tree` | `NameField.svelte`, `TreeActions.svelte` | `row/` (with the new `RowIcon.svelte`) |
| `src/lib/views/system/workbench/settings` | `BrowserControl.svelte` | `other-rows/` (`AppControl.svelte`, `BrowserControl.svelte`) |
| `tests/server/machine/apps` | `manifest.test.ts`, `manifest-host.test.ts`, `manifest-fixture.ts` | `manifest/` (with `manifest-contributes.test.ts`), `shell/` (the three new test files) |
| `tests/routes/edit` | `app-gate.test.ts` | `apps/` (with `app-setting.test.ts`) |

New folders with no move: `src/lib/views/apps/tree/` (`AppTree.svelte`, `AppTreeRows.svelte`), `src/lib/state/system/apps/shell/show/`, three routes under `src/routes/api/(apps)/`.

`ui/tree/TreeItem.svelte` draws the leading icon through `row/RowIcon.svelte` (file icon, themed folder icon, glyph with or without a tone, picture); it is 506 lines.

# ALLOWED and related changes of `tests/checks/tree/boundaries.test.ts` and `tests/checks/imports/order.ts`

The `diff` of each file against the base:

| Where | Before | After |
| --- | --- | --- |
| `ALLOWED`, state row | `'data/helpers/files/apps',` | `'data/helpers/files/apps/**',` |
| `ALLOWED`, primitives' row | not listed | `'state/shared/words/appearance',` with a comment: the theme list names the body class of an app colour theme that `ui/theme` writes and the editor's token rules read |
| `FROZEN` | | `'lib/ui/theme/app-rules.ts:held'`, `'lib/ui/display/icon-theme/held.svelte.ts:held'`, `'lib/state/shared/words/appearance.ts:appThemes'`, `...:appIconThemes`, `...:fileIcons`, `...:languages` (page-wide state: the rules of the colour theme in force, the icon theme in force, the lists the page holds once) |
| `SHELL_STORES` | ends `'pageId'` | ends `'pageId'`, `'appShell'`, `'apps'` |
| the comment of a line about Monaco's rules | wrapped at 98 | rewrapped at 100 with two sentences added for the two FROZEN `held` entries |
| `order.ts`, `ui` | `'ui/display',` then `'ui'` | `'ui/display',` `'ui/theme',` `'ui'` |

`languageOf` is one function in `data/helpers/files/languages.ts` (line 110), replacing `languageOf` of `state/sources/explorer/file-type.ts` and `languageOfPath` of `server/machine/apps/host/triggers.ts` (both on the base, neither in the tree: `grep -rn "export function languageOf"` lists the data one and three unrelated ones in `lsp/wire.ts`, `lint/writing/comments.ts` and `appearance.ts` as `languageOfName`).

# Files with line counts

The full list, 294 files with their `wc -l`, is the last section of this report.

# Judgment calls the brief left open

- The approval panel's sentence is `Add {0} to oculus.` with the counts (`apps.adds_line`), shown in the panel's list of what the app does.
- `oculus.file-icons` is on the page list (open item 1).
- The tests use the key `ctrl+alt+u` where the brief's case 10 uses `ctrl+alt+j` (below).
- `app_settings` lives in `data/helpers/files/apps/settings.ts` rather than in `data/sources/config/settings.ts`, which stays at 872 lines.
- The catalog lines of this step are in `config/text/app.yml` (`cmd_file_icons`, `cmd_file_icons_hint`, line 31-32) and `config/text/views/apps/apps.yml` (`adds_line` line 155, `adds`, `icons_seti` line 173).
- `Workbench.svelte` (519) and `Editor.svelte` (519) stay under 520; `ui/tree/TreeItem.svelte` is 506 lines with its leading icon drawn by `row/RowIcon.svelte`.

# Host- or user-visible changes, for the look at landing

Every look names the view, the state to put it in and what should differ.

| Look | View and state | What should differ |
| --- | --- | --- |
| 12 | `?` key sheet with an app that declares a keybinding, approved and enabled | a heading Apps lists the binding with the command's title and the app title; Cmd-K shows the key beside the command |
| 13 | a `.md` and a `.py` source tab with an `editor/context` entry `when: resourceExtname == .md`, `group: navigation` | the entry is at the top of the `.md` tab's right-click menu and absent in the `.py` tab; `explorer/context` on a Files row; `editor/title` with `navigation` and an icon is a strip button, without the group it is in More Actions; `view/item/context` group `inline` is a row button |
| 14 | status bar with a host's items of priority 10 and 20 and a right item | the priority 10 item after `latex`, the 20 item before it, the right item before `sessions`; hidden from the bar menu it is gone and listed there as `<name> (<app title>)`; after a reload still hidden; the host stopped, the items gone; `$(check) done` draws the glyph then `done`, `$(nosuch) x` draws as text |
| 15 | an `activitybar`, a `panel` and an `explorer` view, opened the first time | a float docked left, a float docked bottom, the Files view's pane; `onView` starts the host on the first draw; the rail unchanged |
| 22 | `showQuickPick(['a','b'], { canPickMany: true })`, then a second one; `showInputBox` with a validator that refuses empty | both rows with checkboxes; the second call makes the first resolve `undefined`; the validator's message shows under the field after 150 ms and Enter is refused while it shows |
| 23 | `withProgress({ location: Notification, cancellable: true })` and `{ location: Window }` | a notice with a bar and Cancel, and Cancel makes the token's `isCancellationRequested` true; a spinner and title on the status bar's left |
| 25 | Settings theme picker and `:theme` with the app `Paper` theme; the find page and the presenter's pages; the app disabled while chosen; a reload before the `apps` payload | `Paper (Notes)` in the picker; the tokens and code colours change; the find page and the presenter pages draw it; disabled, the default theme and a notice naming it; before the payload the default and no notice |
| 27 | `:file-icons` in Cmd-K with an app icon theme; `file_icons: seti`; the app disabled | the Files view, tabs and Cmd-K draw the theme's icons; Seti as before; disabled, Seti and a Findings row keyed `config/appearance.yml` |
| other | the Settings view, Apps heading; the Apps view approval panel; a tree view without a host; custom editor tabs | declared settings rows with their controls; the line "Add ... to oculus."; the two lines for a tree view with no program and a stopped program; the Open With... and Reopen Editor With... menu entries |

# Anything in the brief that was wrong or impossible

- Case 10 uses the key `ctrl+alt+j`. On macOS the binding is `cmd+alt+j`, which is the editor chord `mod+alt+j` of the key sheet, and item 5 says a key the key sheet lists is not bound. The result of case 10 as written (the `mac` chord runs the command) cannot hold for that key. T9 binds `ctrl+alt+u ctrl+alt+c` for the platform rows and has the row "is not bound, with a note naming what takes it: the editor chord Ctrl+Alt+J" for the brief's key. The orchestrator rules whether the brief's key stays as a taken key (what is built) or the case changes.
- Item 3 puts `oculus.file-icons` on the list of commands that "change only what a page shows" and the rule "commands that write configuration answer `closed`" together; item 14 makes `file_icons` configuration. That is open item 1.
- Item 1 says the approval panel reads "adds 3 commands, 2 keys, 1 view, 1 setting, 1 colour theme"; the built sentence is "Add 3 commands, 2 keys, 1 view, 1 setting, 1 colour theme to oculus.", worded as the panel's other lines are, with the same counts and the same words for each kind ("key", not "keybinding").
- The brief's size limits (880 and 520) are tighter than `tests/checks/tree/size.test.ts` (900 and 540); the tree meets the brief's.

# Test titles, verbatim

The 188 titles of the 13 test files as `npx vitest run --testTimeout 20000 <file> --reporter=verbose` printed them in the worktree (`host-commands.test.ts` run alone: 5 titles, listed with the others):

```
tests/server/machine/apps/manifest/manifest-contributes.test.ts > reads the commands of contributes > a command that starts with the app name and a dot is offered and held by the row
tests/server/machine/apps/manifest/manifest-contributes.test.ts > reads the commands of contributes > a command without the prefix
tests/server/machine/apps/manifest/manifest-contributes.test.ts > reads the commands of contributes > a command of another app's name
tests/server/machine/apps/manifest/manifest-contributes.test.ts > reads the commands of contributes > a command in the namespace of oculus
tests/server/machine/apps/manifest/manifest-contributes.test.ts > reads the commands of contributes > a command declared twice
tests/server/machine/apps/manifest/manifest-contributes.test.ts > reads the menus of contributes > a menu oculus does not draw and a submenu entry are left out, each with a finding, and the app is offered
tests/server/machine/apps/manifest/manifest-contributes.test.ts > reads the menus of contributes > a menu entry that names a command the app does not declare
tests/server/machine/apps/manifest/manifest-contributes.test.ts > reads the when clauses of contributes > a when clause that does not parse names the clause
tests/server/machine/apps/manifest/manifest-contributes.test.ts > reads the when clauses of contributes > a when clause with an alternative and a regular expression
tests/server/machine/apps/manifest/manifest-contributes.test.ts > reads the activation events that name a command or a view > onCommand naming a declared command
tests/server/machine/apps/manifest/manifest-contributes.test.ts > reads the activation events that name a command or a view > onCommand naming a command nothing declares
tests/server/machine/apps/manifest/manifest-contributes.test.ts > reads the activation events that name a command or a view > onView naming a view nothing declares
tests/server/machine/apps/manifest/manifest-contributes.test.ts > refuses a key or a channel no app has > a point of VS Code that oculus does not read
tests/server/machine/apps/manifest/manifest-contributes.test.ts > refuses a key or a channel no app has > the point submenus
tests/server/machine/apps/manifest/manifest-contributes.test.ts > refuses a key or a channel no app has > a read of the app-shell channel
tests/server/machine/apps/manifest/manifest-contributes.test.ts > gives an id to the first app of the catalogue order > two apps of one name that declare one id: the later in the catalogue order is refused
tests/server/machine/apps/manifest/manifest-contributes.test.ts > gives an id to the first app of the catalogue order > two apps of one name that declare no common id are both offered
tests/routes/apps/app-private.test.ts > the folders closed to every app > are the state folder, the hub secrets and each state file local.yml places elsewhere
tests/routes/apps/app-private.test.ts > a file of a closed folder > open of a root over the state folder
tests/routes/apps/app-private.test.ts > a file of a closed folder > a custom editor's read of a root over the state folder
tests/routes/apps/app-private.test.ts > a file of a closed folder > open of a folder of the state folder
tests/routes/apps/app-private.test.ts > a file of a closed folder > a custom editor's read of a folder of the state folder
tests/routes/apps/app-private.test.ts > a file of a closed folder > open of the state folder inside a root over the home folder
tests/routes/apps/app-private.test.ts > a file of a closed folder > a custom editor's read of the state folder inside a root over the home folder
tests/routes/apps/app-private.test.ts > a file of a closed folder > fs.readFile of the state folder inside a root over the home folder
tests/routes/apps/app-private.test.ts > a file of a closed folder > open of the hub secrets folder through a root over the hub
tests/routes/apps/app-private.test.ts > a file of a closed folder > a custom editor's read of the hub secrets folder through a root over the hub
tests/routes/apps/app-private.test.ts > a file of a closed folder > fs.readFile of the hub secrets folder through a root over the hub
tests/routes/apps/app-private.test.ts > a file of a closed folder > open of the placed history folder through a root over its parent
tests/routes/apps/app-private.test.ts > a file of a closed folder > a custom editor's read of the placed history folder through a root over its parent
tests/routes/apps/app-private.test.ts > a file of a closed folder > fs.readFile of the placed history folder through a root over its parent
tests/routes/apps/app-private.test.ts > a file of a closed folder > open of a link of another root into the state folder
tests/routes/apps/app-private.test.ts > a file of a closed folder > a custom editor's read of a link of another root into the state folder
tests/routes/apps/app-private.test.ts > a file of a closed folder > fs.readFile of a link of another root into the state folder
tests/routes/apps/app-private.test.ts > a file that is not in a closed folder > fs.readFile of an ordinary file of a root over the home folder
tests/routes/apps/app-private.test.ts > a file that is not in a closed folder > an ordinary file of a root over the home folder is not closed
tests/routes/apps/app-private.test.ts > a file that is not in a closed folder > an ordinary file of a root over the hub is not closed
tests/routes/apps/app-private.test.ts > a file that is not in a closed folder > a custom editor reads the ordinary file it was opened on
tests/routes/apps/app-private.test.ts > a files entry > a root over the state folder
tests/routes/apps/app-private.test.ts > a files entry > a folder below the state folder
tests/routes/apps/app-private.test.ts > a files entry > a root over a home folder that holds the state folder
tests/routes/apps/app-private.test.ts > a files entry > a folder of that home folder beside the state folder
tests/routes/apps/app-document.test.ts > the bytes a custom editor reads > are the file whole, in base64, with their hash
tests/routes/apps/app-document.test.ts > the bytes a custom editor reads > are those of a binary file, byte for byte
tests/routes/apps/app-document.test.ts > a save of new bytes > replaces the file and answers the hash of the bytes now on disk
tests/routes/apps/app-document.test.ts > a save of new bytes > keeps the bytes it replaces in the local history
tests/routes/apps/app-document.test.ts > a save of new bytes > writes the bytes of a binary file as they are
tests/routes/apps/app-document.test.ts > a save of new bytes > is refused `changed` when the file changed on disk after the read, and the disk keeps its bytes
tests/routes/apps/app-document.test.ts > a save of new bytes > is refused without the write token
tests/routes/apps/app-document.test.ts > what a custom editor is closed out of > reads and saves nothing of a file under closed_paths
tests/routes/apps/app-document.test.ts > what a custom editor is closed out of > reads and saves nothing of a root other than the one the path names
tests/routes/apps/app-document.test.ts > what a custom editor is closed out of > reads and saves nothing of a file with a dot folder in its path
tests/routes/apps/app-document.test.ts > what a custom editor is closed out of > answers `closed` for a file of closed_paths
tests/routes/apps/app-document.test.ts > what a custom editor is closed out of > answers `missing` for a file that is not there
tests/routes/apps/app-document.test.ts > what a custom editor is closed out of > answers `not_declared` for an app with no custom editor
tests/routes/apps/app-document.test.ts > what a custom editor is closed out of > answers `closed` for an app that is not approved
tests/routes/edit/apps/app-setting.test.ts > a setting an approved app declares > creates the layer holding the one key, which the merged configuration then reads
tests/routes/edit/apps/app-setting.test.ts > a setting an approved app declares > gives the host the stored value and the default for one that breaks the declaration
tests/routes/edit/apps/app-setting.test.ts > a setting an approved app declares > takes the write back, removing the layer and folders the write made
tests/routes/edit/apps/app-setting.test.ts > a write that is refused leaves the hub without a layer > a value below the least the app declares
tests/routes/edit/apps/app-setting.test.ts > a write that is refused leaves the hub without a layer > a value of another type
tests/routes/edit/apps/app-setting.test.ts > a write that is refused leaves the hub without a layer > a key no app declares
tests/routes/edit/apps/app-setting.test.ts > a write that is refused leaves the hub without a layer > the key of an app that is not approved
tests/routes/edit/apps/app-setting.test.ts > a write that is refused leaves the hub without a layer > refuses the key of an app that is disabled
tests/routes/edit/apps/app-setting.test.ts > a write that is refused leaves the hub without a layer > is closed to an app: the gate refuses the kind whatever the header names
tests/routes/edit/apps/app-setting.test.ts > the stored values the apps watcher judges > names a value set by hand below the minimum, with the setting and the app
tests/routes/edit/apps/app-setting.test.ts > the stored values the apps watcher judges > names a key no app declares
tests/routes/edit/apps/app-setting.test.ts > the stored values the apps watcher judges > gives no finding for a value that keeps its declaration
tests/server/machine/apps/shell/shell-commands.test.ts > executeCommand for the commands of oculus > hands a page command to the first page that answers, which settles it once
tests/server/machine/apps/shell/shell-commands.test.ts > executeCommand for the commands of oculus > answers `closed` for oculus.update and asks no page
tests/server/machine/apps/shell/shell-commands.test.ts > executeCommand for the commands of oculus > answers `closed` for oculus.folder and asks no page
tests/server/machine/apps/shell/shell-commands.test.ts > executeCommand for the commands of oculus > answers `missing` for a name of the namespace that is no command
tests/server/machine/apps/shell/shell-commands.test.ts > executeCommand for the command of an app > runs the command of another approved, enabled app through its host
tests/server/machine/apps/shell/shell-commands.test.ts > executeCommand for the command of an app > answers `missing` for a command no app owns and starts nothing
tests/server/machine/apps/shell/shell-commands.test.ts > executeCommand for the command of an app > answers `missing` for the command of an app that is disabled and starts nothing
tests/server/machine/apps/shell/shell-commands.test.ts > setContext > sets a key that starts with the name of the asking app and a dot
tests/server/machine/apps/shell/shell-commands.test.ts > setContext > refuses a key of another app
tests/server/machine/apps/shell/shell-commands.test.ts > setContext > refuses a key with no app name
tests/server/machine/apps/shell/shell-commands.test.ts > setContext > refuses a value that is no text, number, boolean or null
tests/server/machine/apps/shell/shell-handlers.test.ts > the settings a host reads > answers the default, then the stored value once the file holds one, at once
tests/server/machine/apps/shell/shell-handlers.test.ts > the settings a host reads > answers the default for a stored value that breaks the declaration
tests/server/machine/apps/shell/shell-handlers.test.ts > the settings a host reads > answers null for a key of its own that no setting declares
tests/server/machine/apps/shell/shell-handlers.test.ts > the settings a host reads > refuses `not_declared` for a key of another app
tests/server/machine/apps/shell/shell-handlers.test.ts > what a host registers > accepts a command of its own name and holds it once
tests/server/machine/apps/shell/shell-handlers.test.ts > what a host registers > refuses a command of another app
tests/server/machine/apps/shell/shell-handlers.test.ts > what a host registers > refuses a command of oculus
tests/server/machine/apps/shell/shell-handlers.test.ts > what a host registers > refuses a tree for a view the app does not declare
tests/server/machine/apps/shell/shell-handlers.test.ts > what a host registers > refuses a tree for a view of type webview
tests/server/machine/apps/shell/shell-handlers.test.ts > what a host registers > refuses a panel for a page that is not a recorded file
tests/server/machine/apps/shell/shell-handlers.test.ts > what a host registers > refuses a kind that is none
tests/server/machine/apps/shell/shell-handlers.test.ts > what a host registers > accepts a tree for a view of type tree and a panel for a recorded page
tests/server/machine/apps/shell/shell-handlers.test.ts > the messages of a host > are refused `rate` from the 601st in a minute, and allowed again after the window
tests/server/machine/apps/shell/shell-handlers.test.ts > the host of an app that does not act > is refused `closed` for every request when the app is disabled
tests/server/machine/apps/shell/shell-handlers.test.ts > the host of an app that does not act > is refused `closed` for every request when the app is not approved
tests/server/machine/apps/shell/shell-handlers.test.ts > the host of an app that does not act > is refused `closed` for every request when the app is changed since its approval
tests/shell/panes/strip/app-editor-close.test.ts > closing the tab of a custom editor > asks once the frame marked the document dirty, and No closes nothing
tests/shell/panes/strip/app-editor-close.test.ts > closing the tab of a custom editor > asks nothing once the frame cleared the mark
tests/shell/panes/strip/app-editor-close.test.ts > closing the tab of a custom editor > asks nothing for a tab no frame marked
tests/state/system/apps/app-keys.test.ts > a chord of two presses with a key of each platform > runs the mac chord on macOS and not when a field holds the keyboard
tests/state/system/apps/app-keys.test.ts > a chord of two presses with a key of each platform > does not run the key chord on macOS, where the mac chord replaces it
tests/state/system/apps/app-keys.test.ts > a chord of two presses with a key of each platform > runs the key chord on Linux
tests/state/system/apps/app-keys.test.ts > a chord of two presses with a key of each platform > runs the linux chord on Linux and no longer the key chord
tests/state/system/apps/app-keys.test.ts > a chord of two presses with a key of each platform > drops the wait when the second press is late or is another key
tests/state/system/apps/app-keys.test.ts > a chord of two presses with a key of each platform > passes the binding args to the command as its one argument
tests/state/system/apps/app-keys.test.ts > a binding that needs the editor > runs inside the text editor and nowhere else
tests/state/system/apps/app-keys.test.ts > a binding that needs the editor > does not run a binding without the clause inside a text field
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > is not bound, with a note naming what takes it: Cmd+S
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > is not bound, with a note naming what takes it: Ctrl+S
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > is not bound, with a note naming what takes it: Cmd+P
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > is not bound, with a note naming what takes it: Cmd+Shift+P
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > is not bound, with a note naming what takes it: Cmd+K
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > is not bound, with a note naming what takes it: Ctrl+K
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > is not bound, with a note naming what takes it: F1
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > is not bound, with a note naming what takes it: a chord that starts with Cmd+K
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > is not bound, with a note naming what takes it: Cmd+R
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > is not bound, with a note naming what takes it: Cmd+Q
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > is not bound, with a note naming what takes it: the editor chord Ctrl+Alt+J
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > keeps Cmd+R free off macOS, where the desktop menu is not drawn
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > binds the first app of the catalogue order and notes the second for one key and clause
tests/state/system/apps/app-keys.test.ts > a binding equal to a key oculus takes > binds both apps when their clauses differ
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > resolves Cmd+S on macOS and the table gives it to the workbench
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > resolves Ctrl+S elsewhere and the table gives it to the workbench
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > resolves Cmd+Shift+F on macOS and the table gives it to the workbench
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > resolves Cmd+Shift+H on macOS and the table gives it to the workbench
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > resolves Cmd+Shift+B on macOS and the table gives it to the workbench
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > resolves Cmd+Alt+T on macOS and the table gives it to the workbench
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > resolves Cmd+Alt+X on macOS and the table gives it to the workbench
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > resolves Cmd+Shift+M on macOS and the table gives it to the workbench
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > resolves Cmd+W in the desktop app and the table gives it to the workbench
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > resolves Cmd+N in the desktop app and the table gives it to the workbench
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > resolves Cmd+F in the desktop app and the table gives it to the workbench
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > resolves Cmd+T in the desktop app and the table gives it to the workbench
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > opens the palette on Cmd+P and the table gives it to the palette
tests/state/system/apps/app-keys.test.ts > the table of keys oculus takes agrees with the resolvers that take them > opens the palette on Cmd+Shift+P and the table gives it to the palette
tests/state/system/apps/contributions.test.ts > what an app adds to the shell follows the state of the app > enabled and approved
tests/state/system/apps/contributions.test.ts > what an app adds to the shell follows the state of the app > not approved at all
tests/state/system/apps/contributions.test.ts > what an app adds to the shell follows the state of the app > approved before and changed since
tests/state/system/apps/contributions.test.ts > what an app adds to the shell follows the state of the app > disabled
tests/state/system/apps/contributions.test.ts > what an app adds to the shell follows the state of the app > removed
tests/state/system/apps/contributions.test.ts > what an app adds to the shell follows the state of the app > lists the contributions again once the changed files are approved
tests/state/system/apps/contributions.test.ts > what an app adds to the shell follows the state of the app > lists the apps that act in the order of the rows and leaves out one that does not
tests/state/system/apps/contributions.test.ts > what an app adds to the shell follows the state of the app > names a root app by its root and keeps two apps of one name apart
tests/state/system/apps/contributions.test.ts > a setting row of an app > shows the stored value, and the default while the stored one breaks its declaration
tests/state/system/apps/document.test.ts > the bytes of the file a custom editor was opened on > are read from the route with the app, the root and the path
tests/state/system/apps/document.test.ts > the bytes of the file a custom editor was opened on > are refused with the word the route gave
tests/state/system/apps/document.test.ts > a save of the document > sends the bytes as base64 over the hash of the bytes last read
tests/state/system/apps/document.test.ts > a save of the document > sends the hash a save answered as the base of the next
tests/state/system/apps/document.test.ts > a save of the document > is refused `refused:unsaved` and sends nothing while a source tab of the file holds unsaved text
tests/state/system/apps/document.test.ts > a save of the document > asks before it saves over a file that changed on disk, and saves over the current one on yes
tests/state/system/apps/document.test.ts > a save of the document > is declined on no, and the second send is never made
tests/state/system/apps/document.test.ts > a save of the document > answers a refusal of the route as it is
tests/state/system/apps/document.test.ts > the dirty mark of the editor > follows the flag the editor sets
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > change the page that takes the request and no other page
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > refuse a theme that does not exist and change nothing
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > refuse a theme with no argument and change nothing
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > refuse a crt state that is neither on nor off and change nothing
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > refuse a view that does not exist and change nothing
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > refuse a project that does not exist and change nothing
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > refuse a file icon theme that is not listed and change nothing
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > turns the crt on
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > toggles the crt with no argument
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > opens a view
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > opens a project by its title
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > writes a listed file icon theme
tests/state/system/apps/page-commands.test.ts > the page commands of oculus > answers `missing` for an id that is no page command
tests/state/system/apps/shell.test.ts > Cmd-K and the shell while the state of an app changes > lists the command with its category, its app and its key while the app acts
tests/state/system/apps/shell.test.ts > Cmd-K and the shell while the state of an app changes > draws nothing of an app that is disabled
tests/state/system/apps/shell.test.ts > Cmd-K and the shell while the state of an app changes > draws nothing of an app that is not approved
tests/state/system/apps/shell.test.ts > Cmd-K and the shell while the state of an app changes > draws nothing of an app that is changed since its approval
tests/state/system/apps/shell.test.ts > Cmd-K and the shell while the state of an app changes > draws the status item of the host of an app that acts
tests/state/system/apps/shell.test.ts > a press of a command > posts the run of the command to the host of its app
tests/state/system/apps/shell.test.ts > a press of a command > says which command of which app nothing handled
tests/state/system/apps/shell.test.ts > a press of a command > runs a command only an open tab registered through that tab when the host answers `missing`
tests/state/system/apps/shell.test.ts > a press of a command > says the command failed when the tab that held it answers a refusal
tests/state/system/apps/shell.test.ts > a press of a command > runs the command of a key that the keybindings bind
tests/state/system/apps/shell.test.ts > a press of a command > leaves the press of a text field to oculus
tests/state/system/apps/shell.test.ts > the context keys of the hosts > hold a key an app that acts set
tests/state/system/apps/shell.test.ts > the custom editors an app offers > opens a file that matches a default editor in it, in any case of its name
tests/state/system/apps/shell.test.ts > the custom editors an app offers > opens a file of an apps folder as source text
tests/state/system/apps/shell.test.ts > the custom editors an app offers > leaves a file to the text editor while the editor is an option, and lists it for Open With
tests/state/system/apps/shell.test.ts > the custom editors an app offers > offers no editor of an app that is disabled or changed
tests/state/system/apps/shell.test.ts > the custom editors an app offers > asks Open With over Text Editor and each matching editor, naming the default
tests/state/system/apps/shell.test.ts > the custom editors an app offers > answers the text editor for the first row and null for a dismissed pick
tests/server/machine/apps/shell/host-commands.test.ts > choosing a command of an app whose host is not running > starts the host and runs the handler with the arguments: activation: [onCommand:notes.hello]
tests/server/machine/apps/shell/host-commands.test.ts > choosing a command of an app whose host is not running > starts the host and runs the handler with the arguments: activation: [onTab] and no tab open
tests/server/machine/apps/shell/host-commands.test.ts > choosing a command of an app whose host is not running > answers `missing` and starts nothing for a command the app does not declare
tests/server/machine/apps/shell/host-commands.test.ts > choosing a command of an app whose host is not running > answers `missing` for an app with no host, which a page then tries through its open tab
tests/server/machine/apps/shell/host-commands.test.ts > the settings an app declares, read by its host > answers the value at once, hears the change with the keys that changed, and reads its own keys alone
```

# Files changed or new, with line counts

Columns: kind, `wc -l`, path relative to `tools/oculus`. `changed` is a file the unchanged tree has with other bytes, `new` one it lacks (a moved file is `new`, and its old path is gone). Computed with `cmp` of every file of the worktree against the unchanged copy (`src`, `config`, `docs`, documents and tooling against the scratchpad copy `d63/base`; `tests` against `D63-base`, because the scratchpad copy holds this step's tests); 294 files, 183 changed and 111 new. `.scratch/` is excluded.

```
changed  681  DESIGN.md
changed  473  HELP.md
changed  102  config/appearance.yml
changed  325  config/behavior.yml
changed  1517  config/catalogs/options.yml
changed  261  config/text/app.yml
changed  309  config/text/findings.yml
changed  354  config/text/server.yml
changed  232  config/text/statusbar.yml
changed  140  config/text/ui.yml
changed  173  config/text/views/apps/apps.yml
changed  86  config/text/views/system/history.yml
changed  639  docs/apps.md
changed  394  docs/diagrams/channels.dot
changed  2192  docs/diagrams/channels.svg
changed  85  docs/diagrams/layer-data.dot
changed  414  docs/diagrams/layer-data.svg
changed  156  docs/diagrams/layer-server.dot
changed  764  docs/diagrams/layer-server.svg
changed  135  docs/diagrams/layer-shell.dot
changed  611  docs/diagrams/layer-shell.svg
changed  164  docs/diagrams/layer-state.dot
changed  804  docs/diagrams/layer-state.svg
changed  130  docs/diagrams/layer-ui.dot
changed  621  docs/diagrams/layer-ui.svg
changed  179  docs/diagrams/layer-views.dot
changed  809  docs/diagrams/layer-views.svg
changed  90  docs/diagrams/layers.dot
changed  493  docs/diagrams/layers.svg
changed  316  docs/diagrams/writes.dot
changed  1500  docs/diagrams/writes.svg
new  273  src/lib/data/helpers/files/apps/apps.ts
new  62  src/lib/data/helpers/files/apps/choices.ts
new  39  src/lib/data/helpers/files/apps/commands.ts
new  19  src/lib/data/helpers/files/apps/contributes.ts
new  65  src/lib/data/helpers/files/apps/keys/bound-keys.ts
new  133  src/lib/data/helpers/files/apps/keys/keys.ts
new  130  src/lib/data/helpers/files/apps/keys/oculus-keys.ts
new  79  src/lib/data/helpers/files/apps/settings.ts
new  39  src/lib/data/helpers/files/apps/status-items.ts
new  29  src/lib/data/helpers/files/apps/views.ts
new  41  src/lib/data/helpers/files/apps/when.ts
changed  114  src/lib/data/helpers/files/languages.ts
changed  293  src/lib/data/helpers/hub-names.ts
changed  736  src/lib/data/model/index.ts
new  243  src/lib/data/model/model-apps.ts
changed  59  src/lib/data/places/hub-address.ts
changed  90  src/lib/data/shapes/catalog-words.ts
changed  91  src/lib/data/sources/config.ts
changed  120  src/lib/data/sources/config/catalog/schemas/engine.ts
changed  270  src/lib/data/sources/config/catalog/schemas/options.ts
changed  320  src/lib/data/sources/config/catalogs.ts
new  65  src/lib/data/sources/config/sections/languages.ts
new  75  src/lib/data/sources/config/sections/themes.ts
changed  872  src/lib/data/sources/config/settings.ts
changed  98  src/lib/server/content/deck/read.ts
changed  179  src/lib/server/content/literature/handler.ts
changed  206  src/lib/server/edit/list-edit.ts
changed  738  src/lib/server/edit/writes.ts
changed  128  src/lib/server/edit/writes/apps/gate.ts
changed  580  src/lib/server/edit/writes/bodies.ts
new  194  src/lib/server/edit/writes/config/app-setting.ts
changed  528  src/lib/server/edit/writes/config/config-checks.ts
changed  120  src/lib/server/edit/writes/config/config-write.ts
new  88  src/lib/server/edit/writes/config/lists/audit-mute.ts
new  32  src/lib/server/edit/writes/config/lists/deck/deck-acts.ts
new  443  src/lib/server/edit/writes/config/lists/deck/deck-files.ts
new  125  src/lib/server/edit/writes/config/lists/deck/deck-new.ts
new  122  src/lib/server/edit/writes/config/lists/deck/deck-undo.ts
new  242  src/lib/server/edit/writes/config/lists/deck/deck.ts
new  119  src/lib/server/edit/writes/config/lists/rail.ts
new  395  src/lib/server/edit/writes/config/lists/roots.ts
changed  537  src/lib/server/edit/writes/undo.ts
changed  566  src/lib/server/files/files.ts
changed  860  src/lib/server/files/fs/ops.ts
changed  184  src/lib/server/files/fs/picker.ts
changed  496  src/lib/server/files/fs/replace.ts
new  89  src/lib/server/files/search/search-routes.ts
new  647  src/lib/server/files/search/search.ts
new  91  src/lib/server/files/source-bytes.ts
changed  363  src/lib/server/files/source.ts
changed  138  src/lib/server/machine/apps/host/connection.ts
changed  233  src/lib/server/machine/apps/host/host-runner.mjs
changed  742  src/lib/server/machine/apps/host/manager.ts
changed  75  src/lib/server/machine/apps/host/plan.ts
changed  205  src/lib/server/machine/apps/host/process.ts
new  526  src/lib/server/machine/apps/host/runner-shell.mjs
changed  72  src/lib/server/machine/apps/host/triggers.ts
changed  90  src/lib/server/machine/apps/manage/add.ts
changed  243  src/lib/server/machine/apps/reach/fs.ts
changed  164  src/lib/server/machine/apps/reach/open.ts
new  61  src/lib/server/machine/apps/reach/private.ts
new  42  src/lib/server/machine/apps/read/across/ids.ts
new  70  src/lib/server/machine/apps/read/across/key-notes.ts
new  102  src/lib/server/machine/apps/read/across/stored.ts
changed  71  src/lib/server/machine/apps/read/activation.ts
new  451  src/lib/server/machine/apps/read/contributes/reader.ts
new  97  src/lib/server/machine/apps/read/contributes/shape.ts
changed  59  src/lib/server/machine/apps/read/held.ts
changed  569  src/lib/server/machine/apps/read/manifest.ts
changed  303  src/lib/server/machine/apps/read/scan.ts
new  94  src/lib/server/machine/apps/read/theme-files/icons.ts
new  192  src/lib/server/machine/apps/read/theme-files/themes.ts
new  28  src/lib/server/machine/apps/routes/choice.ts
new  96  src/lib/server/machine/apps/routes/document.ts
changed  193  src/lib/server/machine/apps/routes/host.ts
new  35  src/lib/server/machine/apps/routes/icons.ts
changed  243  src/lib/server/machine/apps/routes/routes.ts
new  41  src/lib/server/machine/apps/routes/theme.ts
changed  165  src/lib/server/machine/apps/secrets/secrets.ts
changed  117  src/lib/server/machine/apps/serve/address.ts
changed  403  src/lib/server/machine/apps/serve/oculus.js
changed  186  src/lib/server/machine/apps/serve/serve.ts
new  133  src/lib/server/machine/apps/shell/commands.ts
new  204  src/lib/server/machine/apps/shell/host-calls.ts
new  413  src/lib/server/machine/apps/shell/registry.ts
changed  81  src/lib/server/machine/lsp/library/rules.ts
changed  131  src/lib/server/machine/processes/ps.ts
changed  139  src/lib/server/root/process/apps-hosts.ts
changed  470  src/lib/server/root/watch/apps.ts
changed  519  src/lib/shell/Workbench.svelte
new  33  src/lib/shell/commands/AppAsk.svelte
new  21  src/lib/shell/commands/AppQuick.svelte
new  278  src/lib/shell/commands/AppQuickBox.svelte
changed  18  src/lib/shell/commands/Asks.svelte
changed  509  src/lib/shell/keys/Palette.svelte
changed  267  src/lib/shell/keys/palette-modes.ts
changed  80  src/lib/shell/keys/palette-open.ts
changed  125  src/lib/shell/keys/rows/CommandRows.svelte
new  31  src/lib/shell/keys/rows/SearchRows.svelte
changed  575  src/lib/shell/keys/workbench-keys.svelte.ts
changed  234  src/lib/shell/panes/strip/tab-menu-state.svelte.ts
changed  130  src/lib/shell/rail/RailFoot.svelte
changed  153  src/lib/shell/rail/rail.ts
new  61  src/lib/shell/status/AppItems.svelte
changed  377  src/lib/shell/status/StatusBar.svelte
new  112  src/lib/shell/status/notices/Bell.svelte
new  166  src/lib/shell/status/notices/NoticeCentre.svelte
new  111  src/lib/shell/status/notices/NoticeEntry.svelte
new  60  src/lib/shell/status/notices/Toast.svelte
changed  100  src/lib/shell/window/appearance.svelte.ts
changed  788  src/lib/state/client/context.ts
changed  120  src/lib/state/client/entities.svelte.ts
changed  175  src/lib/state/client/shapes/client-state.ts
changed  219  src/lib/state/client/shapes/payloads.ts
changed  760  src/lib/state/client/writes.svelte.ts
changed  206  src/lib/state/sessions/source/write-files.ts
changed  428  src/lib/state/shared/stores/shapes.ts
changed  577  src/lib/state/shared/words/appearance.ts
changed  70  src/lib/state/sources/explorer/file-type.ts
changed  110  src/lib/state/sources/explorer/view/bookmark-rows.ts
changed  64  src/lib/state/sources/fs.ts
changed  850  src/lib/state/system/apps/apps.svelte.ts
changed  54  src/lib/state/system/apps/commands.ts
changed  211  src/lib/state/system/apps/flows.ts
new  190  src/lib/state/system/apps/frame/bridge.ts
new  21  src/lib/state/system/apps/frame/bytes.ts
new  84  src/lib/state/system/apps/frame/documents.ts
new  573  src/lib/state/system/apps/frame/methods.ts
new  153  src/lib/state/system/apps/frame/rules.ts
new  137  src/lib/state/system/apps/frame/store-cache.ts
new  117  src/lib/state/system/apps/frame/target.ts
new  86  src/lib/state/system/apps/frame/ui-body.ts
changed  49  src/lib/state/system/apps/instance.ts
new  87  src/lib/state/system/apps/shell/context.ts
new  158  src/lib/state/system/apps/shell/contributions.ts
new  46  src/lib/state/system/apps/shell/editors.ts
new  103  src/lib/state/system/apps/shell/frames.svelte.ts
new  123  src/lib/state/system/apps/shell/keys.ts
new  74  src/lib/state/system/apps/shell/page-commands.ts
new  52  src/lib/state/system/apps/shell/place.ts
new  320  src/lib/state/system/apps/shell/requests.svelte.ts
new  444  src/lib/state/system/apps/shell/shell.svelte.ts
new  49  src/lib/state/system/apps/shell/show/editor-pick.ts
new  47  src/lib/state/system/apps/shell/show/icons.ts
new  84  src/lib/state/system/apps/shell/show/strip.ts
new  223  src/lib/state/system/apps/shell/show/tree-feed.svelte.ts
changed  131  src/lib/state/system/apps/words.ts
changed  138  src/lib/state/system/config/editors/sources.ts
changed  358  src/lib/state/system/config/groups.ts
new  90  src/lib/state/system/config/other-rows/app-rows.ts
new  194  src/lib/state/system/config/other-rows/browser.ts
changed  39  src/lib/state/system/config/view/gear.ts
changed  802  src/lib/state/workbench/layout.svelte.ts
changed  147  src/lib/state/workbench/layout/index.ts
changed  300  src/lib/state/workbench/layout/instance.ts
changed  184  src/lib/state/workbench/layout/open/show.ts
changed  142  src/lib/state/workbench/navigation/notices.svelte.ts
changed  248  src/lib/state/workbench/navigation/registry.ts
changed  160  src/lib/state/workbench/palette-source.svelte.ts
changed  615  src/lib/state/workbench/palette.ts
changed  791  src/lib/state/workbench/ui.svelte.ts
changed  317  src/lib/themes/derive.ts
changed  276  src/lib/themes/tokens.css
new  519  src/lib/themes/vscode-map.ts
changed  164  src/lib/ui/controls/Confirm.svelte
changed  470  src/lib/ui/controls/ToolButton.svelte
changed  519  src/lib/ui/controls/editor/Editor.svelte
changed  213  src/lib/ui/controls/editor/kit/theme/theme.ts
changed  151  src/lib/ui/controls/editor/types.ts
changed  138  src/lib/ui/controls/tool-button.ts
changed  91  src/lib/ui/display/FileIcon.svelte
new  75  src/lib/ui/display/Progress.svelte
new  89  src/lib/ui/display/icon-theme/held.svelte.ts
new  231  src/lib/ui/display/icon-theme/theme.ts
changed  133  src/lib/ui/menu/keys/KeySheet.svelte
new  86  src/lib/ui/tabs/ActionStrip.svelte
new  21  src/lib/ui/theme/app-rules.ts
new  167  src/lib/ui/theme/app-theme.ts
new  124  src/lib/ui/theme/theme.ts
changed  506  src/lib/ui/tree/TreeItem.svelte
changed  107  src/lib/ui/tree/item-props.ts
new  148  src/lib/ui/tree/row/NameField.svelte
new  53  src/lib/ui/tree/row/RowIcon.svelte
new  83  src/lib/ui/tree/row/TreeActions.svelte
changed  443  src/lib/views/apps/frame/AppFrame.svelte
changed  189  src/lib/views/apps/frame/ApprovalPanel.svelte
new  267  src/lib/views/apps/tree/AppTree.svelte
new  101  src/lib/views/apps/tree/AppTreeRows.svelte
changed  127  src/lib/views/shared/explorer/opening.ts
changed  247  src/lib/views/shared/explorer/rooted-tree.svelte.ts
changed  214  src/lib/views/shared/explorer/tree/FileRow.svelte
changed  80  src/lib/views/shared/explorer/tree/NameInput.svelte
changed  445  src/lib/views/shared/explorer/tree/Tree.svelte
changed  297  src/lib/views/shared/explorer/tree/control/picks.svelte.ts
changed  641  src/lib/views/shared/explorer/tree/menu/row-menu.ts
changed  86  src/lib/views/shared/links/FileBarActions.svelte
changed  511  src/lib/views/sources/source/Source.svelte
changed  48  src/lib/views/sources/source/actions/read-again.ts
changed  589  src/lib/views/sources/source/language/lsp.ts
new  29  src/lib/views/sources/source/status/app-actions.ts
changed  212  src/lib/views/system/machine/debug/sections/Breakpoints.svelte
changed  159  src/lib/views/system/machine/debug/sections/Watch.svelte
changed  400  src/lib/views/system/workbench/Catalogue.svelte
changed  357  src/lib/views/system/workbench/Settings.svelte
changed  361  src/lib/views/system/workbench/editors/FieldControl.svelte
changed  346  src/lib/views/system/workbench/settings/Item.svelte
new  122  src/lib/views/system/workbench/settings/other-rows/AppControl.svelte
new  207  src/lib/views/system/workbench/settings/other-rows/BrowserControl.svelte
changed  35  src/lib/views/system/workbench/settings/said.ts
new  36  src/monaco-modules.d.ts
changed  49  src/routes/+layout.svelte
changed  321  src/routes/+page.svelte
new  20  src/routes/api/(apps)/app-document/+server.ts
new  13  src/routes/api/(apps)/app-icons/+server.ts
new  13  src/routes/api/(apps)/app-theme/+server.ts
changed  26  src/routes/api/(files)/search/+server.ts
changed  133  src/routes/find/+page.svelte
changed  143  src/routes/present/print/+page.svelte
changed  290  src/routes/present/show/+page.svelte
changed  240  src/routes/views.ts
changed  641  tests/checks/config/config-folder.test.ts
changed  207  tests/checks/imports/order.ts
changed  56  tests/checks/look/themes.ts
changed  601  tests/checks/source/keys.test.ts
changed  795  tests/checks/tree/boundaries.test.ts
changed  106  tests/fixtures/entities-fixture.ts
new  188  tests/routes/apps/app-document.test.ts
changed  317  tests/routes/apps/app-fs.test.ts
changed  206  tests/routes/apps/app-open.test.ts
new  244  tests/routes/apps/app-private.test.ts
changed  182  tests/routes/apps/apps-fixture.ts
new  260  tests/routes/edit/apps/app-gate.test.ts
new  194  tests/routes/edit/apps/app-setting.test.ts
changed  310  tests/routes/edit/roots.test.ts
changed  153  tests/routes/edit/write.test.ts
changed  104  tests/routes/files/search.test.ts
changed  298  tests/routes/hubs/hub-secrets.test.ts
changed  498  tests/routes/hubs/hub-writes.test.ts
changed  140  tests/routes/replace/ops-replace.test.ts
changed  304  tests/server/edit/app-store.test.ts
changed  61  tests/server/files/search.test.ts
changed  72  tests/server/machine/apps/hosts-fixture.ts
new  291  tests/server/machine/apps/manifest/manifest-contributes.test.ts
new  120  tests/server/machine/apps/manifest/manifest-fixture.ts
new  237  tests/server/machine/apps/manifest/manifest-host.test.ts
new  658  tests/server/machine/apps/manifest/manifest.test.ts
changed  229  tests/server/machine/apps/oculus-frame.test.ts
new  108  tests/server/machine/apps/shell/host-commands.test.ts
new  171  tests/server/machine/apps/shell/shell-commands.test.ts
new  200  tests/server/machine/apps/shell/shell-handlers.test.ts
new  117  tests/shell/panes/strip/app-editor-close.test.ts
new  258  tests/state/system/apps/app-keys.test.ts
new  164  tests/state/system/apps/contributions.test.ts
new  159  tests/state/system/apps/document.test.ts
changed  222  tests/state/system/apps/flows.test.ts
changed  746  tests/state/system/apps/methods.test.ts
new  85  tests/state/system/apps/page-commands.test.ts
changed  36  tests/state/system/apps/rules.test.ts
new  315  tests/state/system/apps/shell.test.ts
changed  256  tests/state/system/apps/store-cache.test.ts
changed  193  tests/views/shared/explorer/opening-apps.test.ts
changed  98  tests/views/shared/explorer/opening.client.test.ts
changed  391  utils/migrations/convert-vscode-themes.ts
```
