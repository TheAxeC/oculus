# Step O30 brief check (on main at ac44f68ba)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O30.md` (header "read on main at 94bb9b3a8"; booked at 53908af5c; `git log --oneline 94bb9b3a8..53908af5c -- tools/oculus ':!tools/oculus/.scratch'` printed nothing, so the code base is the same). Code landed since: `git log --oneline 53908af5c..HEAD -- tools/oculus ':!tools/oculus/.scratch'` printed `0aea28449 Land D20`, `b07d24766 Land D38`, `ee0407a5a Land X3f`, `71017ce60 Land S5`. The four findings with the most weight are 3.3 (S5 has landed), 4.2 (item 10 and case 23 conflict with Z53 and the text-box menus), 5.1 (the pgrep checks) and 6.1 (a second `npm run app` rebuilds `build/` under the running app).

## 1. Names

- `FloatPlace` gains `kind: 'window'`: `git grep -n "FloatPlace\|place\.kind\|kind: 'free'\|kind === 'free'\|kind === 'dock'" -- tools/oculus ':!tools/oculus/config/local.yml' ':!tools/oculus/.scratch'`. Hits outside the write list:
  - `src/lib/shell/panes/floats/float-geometry.ts:40-41`: `floatStyle(place: FloatPlace)` returns `BORDER` for a dock and draws every other place as a free one in viewport fractions. Its doc comment (:37-39) names only free and docked. Both become false for a window place passed in. They stay true only if FloatLayer drops window floats before it styles them (item 8 asks for that), and the file is not in the write list.
  - `src/lib/shell/panes/DropLayer.svelte:39` counts only free floats. Not made false.
  - `src/lib/state/workbench/navigation/arrangement.ts:91,99,120` builds only config places (dock and free). Not made false.
  - `src/lib/state/workbench/layout/index.ts:27` is a re-export, and `tests/state/workbench/layout/layout-fixture.ts:9,35,38` is a fixture. Neither is made false.
- `PickerState` / `handlePick` / `pickerState`: `git grep -n "PickerState\|pickerState\|handlePick" -- tools/oculus ...`. Hits outside the list:
  - `src/lib/server/root/context.ts:63,139,462`, `src/routes/api/(files)/folders/pick/+server.ts:10`, `tests/server/files/picker.test.ts:8-31` and `tests/server/root/context-fixture.ts:12,98` are not made false, since `ask` is optional.
  - X3e's brief (`agents/briefs/X3e.md`, H2) rewrites the same type to `{ panel: AbortController | null }`, adds `closePicker` and a `connection` dependency, and lists `picker.ts` among its paths (:10). Its line 148 says O30 is queued "once X3e has landed". `queue.md` instead prepares O30 at the end of this check. The two orders disagree, and O30's item 9 is written against `{ open: boolean }`.
- `createClientState()` gains a dependency: `git grep -n "createClientState(" -- tools/oculus ':!tools/oculus/.scratch'` printed `+page.svelte:44` and eleven test call sites with no argument: `config-folder.test.ts:39`, `keys.test.ts:35`, `fixtures/client.ts:18`, `tab-menu.test.ts:38`, `terminal-close.test.ts:55`, `form-drafts.test.ts:41,83`, `manifest-draft.test.ts:43,64,74`, `source.test.ts:16`, and `layout-unread.test.ts:21,32,35,41,45`. A required parameter breaks all of them. The brief does not say whether the parameter is optional, and none of those files is in the write list.
- Ctrl+Tab bound in the app (item 7): `grep -n -o ".\{60\}\(Chrome\|the browser\|browser's\|a browser\).\{60\}" HELP.md DESIGN.md README.md`.
  - `DESIGN.md:408` says "Ctrl and Tab is not the pair: a browser keeps that chord for its own tabs and never dispatches it to a page, so a binding on it would be dead". This is made false in the app, and :408 is not among O30's DESIGN lines.
  - `DESIGN.md:378` says the layout-write record's "`tab` the browser tab's id". In the app the id belongs to a window. It is loose, and not in the list.
- The native right-click menu (item 10): `HELP.md:44` ("the browser's own menu stays inside a text box, the code editor and the ...") and `src/lib/shell/context-guard.ts:1-9` describe the browser's menu. In the app these sentences cover the native menu only if one shows (see 4.2). Neither is in the list.
- `src/desktop/` in the diagrams: `utils/diagrams/graphs.mjs:33-36` and `HELP.md:314` place "a module directly under src (the server entry and the hooks) in a group named src". `src/desktop/*.ts` is neither directly under `src` nor under `lib`. Where `npm run diagrams` draws it, and whether `HELP.md:314` stays true, is not verified. `graphs.mjs` and `HELP.md:314` are outside the list.
- favicon: `tests/checks/diagrams/diagrams.test.ts:205,213` and `utils/diagrams/graphs.mjs:154` name the file by its path, which does not change. Not made false.
- `src/server.ts` and port wording: `memories.ts:46`, `serve.ts:5` and `README.md:9` are not made false. `mover.ts:30` words a failed move "the port is in use" beside the new start line `oculus: port <n> is in use`, which gives two wordings of one fact. Not made false.
- `desktop:` group, `oculusDesktop`, `window.json`, `app-icon`, `float=`, `new_window`, `main_window`: `git grep -n -i "^ *desktop:\|oculusDesktop\|window\.json\|app-icon\|\bfloat=\|move_new_window\|new_window\|main_window"` printed only `FloatLayer.svelte:129 data-float=`. No collision.

Findings:
- 1.1. Eleven `createClientState()` test call sites break if the bridge parameter is required.
- 1.2. `DESIGN.md:408` becomes false.
- 1.3. X3e and O30 change `PickerState` in different shapes and their order is contradictory (`X3e.md:148` vs `queue.md`).
- 1.4. `float-geometry.ts:37-41` is unguarded against a window place.
- 1.5. `HELP.md:44` and `HELP.md:314` / `graphs.mjs` are outside the list with their truth unsettled.

## 2. The step line

`grep -n "^- O30 " plan.md` printed 632.

- "native window (I)": items 3 and 14.
- "Electron": item 1 and "Libraries checked" (ruling O30, plan.md:800).
- "running the oculus server inside the app": item 1, a utility process forked by the app (Decision 2).
- "the page in Electron's own Chromium": items 1 and 3.
- "(1 commit)": the step is booked as one commit; this has no requirement of its own.
- "Z3: a floating pane pops out into its own window": item 8.
- "and sub-windows can be opened": item 8 (Move or Copy into New Window, a tab dragged out), item 6 (File > New Window) and item 5 (Open Worktree in New Window).

Findings: none.

## 3. Premises

Moved lines and counts:
- plan.md:
  - `grep -n "^- O30 \|^- O31 \|^- O33 \|^- O34 \|^- O35 \|^- O36 " plan.md` printed O30 :632 (brief 625), O31 :631 (624), O33 :465 (460), O34 :468 (463), O35 :470 (465), O36 :472 (467).
  - The O32 removal is at :446 (441). Ruling O30 is at :800 (793). The queue is at :807 (800). Z187 is at :929 (922). Z369 is at :1100 (1093). Z425 is at :1156 (1149).
  - In `orchestrator-history.md`, Z187 is at :328 (283) and Z3 at :669 (624).
- `vite.config.ts`: `grep -n "oculusViteServer\|adapter\|host: '127\|port: loadLocal\|strictPort" vite.config.ts` printed `11: const development = oculusViteServer(engineDir());` and `21: adapter: development.adapter`. The brief's `vite.config.ts:16` is wrong at the base too (the same grep on 94bb9b3a8 printed the same lines). :26-28 matches.
- `local.ts`: `grep -n "export function loadLocal\|function localDefaults\|DEFAULT_PORT\|must be an integer\|must be a list\|throw" src/lib/data/sources/config/local.ts` printed `122: DEFAULT_PORT = 8790`, `167: localDefaults`, `514: loadLocal`, and comments saying "never throw" (:480, :511). There is no throw, no `:276` and no `:176 accounts must be a list`. The head comment (:2-6) reads: "A key whose value the file gets wrong takes its default and is a problem naming the key ... no read throws". S5 with Q119 landed at 71017ce60, so "S5's round with Q119 (in flight)" is stale and case 8's first branch cannot occur.
- `src/lib/state/client/context.ts`: `createClientState` is at :210 (brief :204).
- Layout:
  - `storage.ts` `LAYOUT_KEY` is at :20 (19).
  - `takeSaved` is at `layout.svelte.ts:403` (372). The store's `placeFloat` is at :769 (738), the float operations at :757-770, and the returned entries at :837-842.
  - `wc -l src/lib/state/workbench/layout.svelte.ts` printed 886 (brief 825). That is over spec.md's 880 limit, so the step must split it, and the write list's "lines 720-790" no longer covers the float operations.
- `pane-view.ts` (unchanged since base): `floatItems` is at :213-224. The brief says :175-224, which was wrong at base too.
- `window.open`: `grep -rn "window.open" src/lib` printed `state/workbench/navigation/pages.ts:506` (`openInBrowserTab`, X3f's Open in Browser Tab), `views/shared/explorer/tree/menu/row-menu.ts:524`, `InboxCard.svelte:141`, `TerminalGrid.svelte:301` and `Worktrees.svelte:121` (111). `File.svelte` and `Document.svelte` hold no `window.open`: the grep over them printed nothing. Item 5 still cites `File.svelte:183` and `Document.svelte:113`. `grep -rln '_blank' src/lib | wc -l` printed 19 (16).
- The server's `context.ts`: `folderPicker` is at :139 and :462 (136, 457).
- Keys and key sheet:
  - `keys.ts`: "Cmd plus a digit is left to the browser" is at :131. The Ctrl/Tab comment starts at :160-163 (brief :113-118 and :139-157).
  - `keys.ts` also now holds `defaultCommand` (:97, Cmd+Shift+B build, Cmd+Alt+T test) and `savesFile` (:114).
  - `Workbench.svelte` draws `app.keys.rows` at :363 (354).
- guarded.md: `grep -n "^- G28\|^- G29\|^- G1\.\|^- G42" agents/guarded.md` printed G1 :7, G42 :28, G28 :44, G29 :56. G28's lines are :44-46 (brief :41-43). G42 ("A folder panel lives no longer than the request that opened it", Code `src/lib/server/files/fs/picker.ts`) covers a file O30 changes, and the brief does not name it.
- HELP.md:
  - Rerunning the brief's grep printed :157 (brief 155) and :344 (340). :3, :11-16, :40 and :43 are unchanged. `wc -l` printed 352 (348).
  - The keys table is :56-95. X3f has landed, so the reason for sending its rows to "Doc text" is gone.
- DESIGN.md: the same grep printed :217 (215), :307 (305), :324 (324 for 322), :379 (377), :395 (393) and "Still undecided" at :436-438 with the last "Decisions taken" bullet at :434 (431-435). `wc -l` printed 438.
- Steps in flight: `queue.md` names A3 and D44 building. The brief's shared section names X3f, S5/Q119, X3e and D20 (all but X3e landed) and does not name A3 or D44.
- Rulings since the brief:
  - `grep -n "O30" plan.md` printed Z516 :1280 (D4-D15 closed in automode) and Z517 :1243 (Axel: `@electron/packager`, `shell-env`, `electron-context-menu`).
  - It also printed Z518 :1244 (Axel: "yes to both; written into agents/guarded.md before O30 is dispatched"). The brief's "Decisions for Axel" and "Tests" ("No test is written in this step until Axel rules") are therefore stale. `grep -n -i "app window\|electron\|desktop\|one server and ends" agents/guarded.md` printed nothing, so the entries are not written yet.
- Z53 (`orchestrator-history.md:543`, plan.md:862) is not named in the brief: "oculus's text menu on every box, as built ... since a native window is planned (O30)".

Matching premises (command, then result as the brief says):
- `grep -n '"main"' package.json`: nothing.
- `ls node_modules/electron`: "No such file or directory".
- The scripts list and the dependencies, through `node -e`: as the brief says.
- `ls svelte.config.js`: no such file.
- `src/server.ts`: :19, :35, :38, :46 and :58 as cited, with no `error` listener.
- `args.ts:40`, `serve.ts:24` `/ws`, `shutdown.ts:19` SIGINT/SIGTERM and :29 `onShutdown`: as cited. `ASKED = 0` is at :22.
- `mover.ts:10`, `config.ts:19`, `socket.svelte.ts:206` and :254-277, `socket.ts:83`, `auth.ts:29`/:64, `+page.server.ts:44`, and `+page.svelte:44` and :191 (`takeCarried`): as cited.
- `model.ts:111-119`, `saved.ts:124-138`, `floats.ts:47/65/215/241/357/378` and `FloatLayer.svelte:54-58`: as cited.
- `ui.yml` float keys :30-35, `pane-view.ts:167`, `grep -rn beforeunload src` printing nothing, and `tmux.ts:23,46`: as cited.
- `which tmux claude git` printed the three paths.
- `cat /etc/paths` holds neither `/opt/homebrew/bin` nor `~/.local/bin`.
- `grep -l /opt/homebrew ~/.zprofile ~/.zshrc` printed both files.
- `plutil -extract CFBundleIdentifier raw` printed `local.research.cockpit`.
- `iconutil`, `sips` and `rsvg-convert` are at the cited paths.
- The favicon's `<title>svelte-logo</title>` and `+layout.svelte:18`: as cited.
- `picker.ts:51/59/91` and the `config/text` 6, `state/shared` 3, `src` 6 and `utils` 10 item counts: as cited.
- The electron.d.ts lines, rerun with `grep -n -F` over `$TMPDIR/o30brief/node_modules/electron/electron.d.ts` (version 44.5.1 from its package.json): all eighteen cited lines match. `'will-frame-navigate'` (:17776), `setPermissionCheckHandler(`, `registerAccelerator`, `serviceName`, `stopFindInPage(` and `exposeInMainWorld(` exist.

Findings:
- 3.1. Every moved number above.
- 3.2. `vite.config.ts:16` is wrong at the base as well.
- 3.3. S5 has landed: `loadLocal` never throws, so case 8's first branch and the "in flight" sentence are void.
- 3.4. `layout.svelte.ts` is 886 lines, so a split is required and the write range is wrong.
- 3.5. `File.svelte:183` and `Document.svelte:113` hold no `window.open` now. The file address opens through `pages.ts:506` and `row-menu.ts:524`.
- 3.6. G42 is not named.
- 3.7. Z516, Z517, Z518 and Z53 are not reflected.
- 3.8. The shared section names the wrong steps, and the keys-table deferral to X3f is void.

## 4. Cases and checks

- Cases 1, 3, 9 to 22, 24, 26 to 30 and 32 are consistent with spec.md: scratch ports 8797/8799, a scratch engine, `tmux -S` on the scratch socket, `local.yml` of the main checkout never read, and a look named for the DOM behaviours ("A behaviour that needs a DOM ... is seen at the look").
- Cases 2, 4 and the whole of "The look (Z467)" break the state file's standing demand "Looks happen on TEST at localhost:8790 ... The one exception ruled so far is D35's port move".
  - Z507 extended the exception to S5's look alone ("Closed 2026-10-05 by Axel: (a): S5's look on a scratch oculus").
  - O30's scratch app, and the server it starts running tmux on the default socket moved by `TMUX_TMPDIR` without `-L`/`-S` ("Never run tmux without `-L` or a private `-S` socket"), have no ruling for O30.
  - A desktop app cannot be looked at in Chrome, so this needs a ruling (or an automode closing, if the orchestrator does not treat it as a clash between rules).
- Case 23 contradicts the tree and ruling Z53.
  - Its input "a text field no oculus menu covers (the Settings search box)" is false. `Header.svelte:62` draws `<Search ...>`, and `Search.svelte:69` wraps the box in `<TextBoxMenu>`. `TextInput.svelte:81`, `TextArea`, `DateInput`, `SuggestInput` and `NameField` all carry oculus's text menu (`grep -rln "TextBoxMenu\|textMenu\|text-menu" src/lib/ui`).
  - With Monaco and xterm drawing their own menus, item 10's `electron-context-menu` answers in no field a reader types in, so the spelling suggestions Z53 deferred to O30 never appear.
  - D3's lazy-option sentence ("a plain field has no Paste on the right-click") is false, since `text-menu.ts` offers Paste through `navigator.clipboard.readText()`.
  - Axel's Z517 (a) for `electron-context-menu` rests on that premise. A premise found wrong under one of Axel's rulings is a stop.
- Item 11 and "What it must do" break spec.md "What every package obeys" ("Every control a reader presses is a `ui/` primitive ... never a raw `<button>`, `<input>`"), and they contradict each other. The find bar is "a small page of `src/desktop/` with its own preload", which can use no Svelte `ui/` primitive and no `t()`. "What it must do" says "every control the page draws a `ui/` primitive".
- Case 25 cannot run as written (not verified by a run, since Electron may not be started here). Item 3 sets `contextIsolation: true` and `nodeIntegration: false`, so the page's console context has no `process`. `process.crash()` exists only in the preload's world, and `webContents.forcefullyCrashRenderer()` is at electron.d.ts:18272.
- Case 31 contradicts item 15. It says "nothing else changed" in Chrome, but item 15 replaces the favicon Chrome draws.
- Case 7: consistent, but see 5.
- Case 8: its first branch is void (3.3).
- Case 4: the command is unnamed (see 6.1).
- Cases 5 and 6: no item of "What to build" says how the app tells an oculus from another program, or draws the Open a Window dialog (see 5).
- "Tests": stale against Z518. spec.md's test rule ("A test exists only as the test of one entry of `agents/guarded.md`") now calls for the two approved entries' tests (cases 18, 29 and 30 for the first; 4, 5, 16 and 32 for the second), slow-tagged where they start a process. The write list names no test file.

Findings:
- 4.1. The scratch-app look has no ruling for O30.
- 4.2. Case 23 and item 10 conflict with the tree and with Z53. Axel's Z517 (a) rests on a false premise, which is a stop.
- 4.3. Item 11 conflicts with the `ui/` primitive and catalog rules.
- 4.4. Case 25 cannot run as written.
- 4.5. Case 31 contradicts item 15.
- 4.6. "Tests" is stale under Z518.

## 5. The question

Could each check pass without the goal being reached?
- Case 1: yes. `lsof` "lists one listener, the server process's" passes with the server inside the main process unless the report names the listener's process. It should compare the PID with the utility process (`app.getAppMetrics()` type `Utility`) or with `ps -o args`.
- Cases 4, 5, 9 and 16: yes. They count the server with `pgrep -f "src/server.ts"`, but `utilityProcess.fork` hands the module path to the child over IPC, so the child's command line carries the Helper binary and the service name rather than the script path. This is not verified by a run; the builder's first run settles it with `ps -o pid,args`. If it holds, "prints nothing" passes with a server running, and case 4's "lists one" never passes.
- Case 7: yes. `node -e` over `loadLocal` exercises unchanged code and passes on the unchanged tree. The app's start with no `local.yml` is only read.
- Case 18: partly. The node run checks the pure decision alone; its wiring to `setWindowOpenHandler`, `will-navigate` and `will-frame-navigate` is proved only by the one link at the look.
- Cases 29 and 30: same as 18 for the sender check and the permission handler.
- Case 2: no. Under `env -i`, PATH is empty, so a Terminal tab works only through the login shell's environment.
- Cases 3, 4 (if run on the binary), 10 to 17, 19 to 22, 24, 26 to 28 and 32: no. Each needs the behaviour itself.
- Case 8: no (second branch).
- Cases 5 and 6: they cannot pass as specified, since nothing builds them.
- Case 23: cannot pass on this tree (4.2).
- Case 25: cannot be run as written (4.4).
- Case 31: no, apart from its "nothing else changed" clause.
- The step line has no check of its own.
- Items 1 to 16:
  - Item 1 could pass with the server in the main process (case 1 above).
  - Item 5 could pass as a pure function never wired (case 18).
  - Item 10 cannot be met on this tree (4.2).
  - The others are tied to cases that need the behaviour.

Findings:
- 5.1. The `pgrep -f "src/server.ts"` checks of cases 4, 5, 9 and 16 can pass vacuously.
- 5.2. Case 1 does not name the listener's process.
- 5.3. Case 7 proves nothing of the app.
- 5.4. Cases 5 and 6 (D10 (a), Z516) have no requirement in "What to build".

## 6. Implied inputs

Missing from "Cases", each with the expected result:
1. A second `npm run app` while the first runs. The script runs `vite build` before `electron .` (Decision 6), which rewrites `build/` under the running server and cannot exit within 2 s. Expected: the second start does not rebuild `build/` (the instance check before the build, or a build output the running app does not serve), prints the already-running line and exits 0.
2. Port held by an oculus. Expected: the rule that tells an oculus from another program is stated in "What to build", with the dialog's words from the catalog.
3. A window onto an oculus the app did not start (D10 (a)). That server's port move sends no `listening`, and its picker has no `ask`. Expected: the window follows the move, and Add Folder uses the JavaScript for Automation panel.
4. Port-move ordering: the page's `location.assign(moved)` (`socket.svelte.ts:277`) can reach `will-navigate` before the main receives `{ kind: 'listening' }`. Expected: the navigation is admitted, never sent to the browser.
5. Two windows writing `oculus.layout.v1` at once (item 8). This is a lost update between the main page and a popped-out page; Z515 (1)'s cross-tab tab loss is still open, with D20's record under `oculus.layout.writes.v1` and the per-window `oculus.layout.tab` in sessionStorage (`storage.ts:38-50`). Expected: neither window's change is lost, shown in the write record.
6. A popped-out page's client running whole-arrangement upkeep for tabs it does not draw (a Terminal tab closed when a `sessions` message stops naming its terminal, `terminals.svelte.ts`). Expected: each tab is acted on once, by one page.
7. The eleven `createClientState()` test callers (1.1). Expected: they run unchanged with no bridge.
8. Electron's profile during the look: `HOME=L/home` may not move `~/Library/Application Support/oculus` (not verified). Expected: the look leaves nothing in the real profile.
9. A pick whose requesting page reloads or whose connection closes (G42 on `picker.ts`). Expected: the sheet's answer is dropped, `busy` is cleared, and no folder is added. Whether an open `showOpenDialog` sheet can be dismissed is not verified.
10. A popped-out window whose saved screen place is on no attached display. Item 4 clamps only the main window. Expected: the same clamp for a window place.
11. Cmd+W or Close on the last tab of a popped-out window. Expected: the float closes and the window with it, nothing asked beyond G28.

Findings: all eleven above.

## 7. ADRs

- No record: `ls docs/adr` and `ls tools/oculus/docs/adr` both printed "No such file or directory", and `.agents/plan.yaml` has no `adr` key. The brief says the same.

Findings: none.

## 8. Dictated text

Each line was found with `grep -n "is in use\|already running\|Desktop, the app\|{0} of {1}\|Move into New Window, Copy into New Window, Restore\|An app window shows only\|The app runs one server and ends it" agents/briefs/O30.md` (lines 81, 93, 147, 155, 204, 231, 232, 333). `LC_ALL=C grep -n '[^ -~]' agents/briefs/O30.md` printed nothing.

- `oculus: port <n> is in use` (:81, :204): the wording holds. The brief does not say it is a catalog line. spec.md "What every package obeys" says "A literal string ... anywhere a reader sees it is a defect"; `src/server.ts:25` and `:60` already print literal `oculus: ...` lines, which is precedent, not an exemption. It should be stated as catalogued (the `server` group) or as the existing exception.
- `oculus is already running; its window is brought to the front` (:93): the same point. Item 13 says every word the app shows comes from the catalog, so it holds if catalogued.
- Head comment "Desktop, the app's main process" (:333): breaks spec.md's head-comment rule ("its layer ('Layer 2, server' and so on)"). DESIGN.md's layers are `## Layer 1, data`, `## Layer 2, code` and `## Layer 3, view` (`grep -n "^## " DESIGN.md`), with no desktop layer. `src/server.ts`, the other process host, opens "Layer 2, server".
- The proposed "Never happens" entry (:231), "a navigation or a window opened to any other address goes to the default browser": contradicts item 5, which refuses every scheme other than http, https and mailto. Axel approved this text (Z518), so either item 5 or the entry's text has to change, and the latter needs his word.
- The proposed "It starts" entry (:232): holds against D10 (a).
- The new `ui` words Move into New Window, Copy into New Window, Restore into Main Window and Switch to Main Window (:155): hold. They are Title Case as in Z508, with VS Code's wording.
- `{0} of {1}` (:147): holds.
- The menu labels (:115): hold. "Settings..." uses ASCII `...` as the catalog does.
- The button word `Add` (:139): holds.

Findings:
- 8.1. The head-comment form.
- 8.2. The approved entry's "any other address goes to the default browser" against item 5's refusal.
- 8.3. The two output lines are not stated as catalog lines.

## Shared paths (with A3 and D44)

The steps were compared by reading `agents/briefs/A3.md` and `D44.md` "Paths this step writes". The worktrees were read with `grep -n '"sh-syntax"\|"croner"' .agents/worktrees/{A3,D44}/tools/oculus/package.json`, which printed A3 :66 `croner` and D44 :88 `sh-syntax`.

- `package.json`:
  - A3 adds `"croner"` after `"cloc"` (:65).
  - O30 adds `main` (near :5), two scripts, `electron-context-menu` after `"dompurify"` (:68), `shell-env` between `"seti-ui"` (:87) and `"shiki"` (:88), and two devDependencies.
  - With A3: separate hunks, simple.
  - With D44: `sh-syntax` goes in at the same point between `seti-ui` and `shiki`, so the insertions touch. The merge is not simple (a two-line conflict, both kept in order).
- `package-lock.json`: all three add packages. The lockfile is regenerated by `npm install` at landing rather than merged by hunk, as A3's and D44's `shared_paths` already say.
- `src/routes/+page.svelte`: A3 lines 177-190 (`'schedule'` after `'processes'`, :189); O30 lines 40-50 and 185-195. The ranges overlap at 185-190. It is simple only if O30's change in that range starts at :191 (`takeCarried`) or later, with :190 `]);` between, and the brief does not fix that. Not simple as written.
- `src/lib/state/client/context.ts`: A3 names the whole file (its read list: :336-351 beside `createProcesses` at :345, and the returned object :458-504). O30 names the signature (:210) and "the lines that hand the bridge on", unspecified. It is simple if O30 keeps off :336-351 and :458-504, which the brief cannot show.
- `HELP.md`: A3 :25 and :269; D44 :49 and :146; O30 (at HEAD) :3, :11-16, :40, :43, :157 and :344. Disjoint, simple.
- `DESIGN.md`: A3 :85, :114, :137 (plus a paragraph), :155 and :414; D44 :128 and :135; O30 (at HEAD) :71, :217, :307, :324, :379, :395 and :434-438. Disjoint, simple.
- `docs/diagrams/`: all three regenerate it with `npm run diagrams` at landing; it is not a text merge.
- Not in flight but shared: X3e and O30 both write `src/lib/server/files/fs/picker.ts` (`PickerState`). Not simple, and the order is contradictory (1.3).

## Declined to judge

- The library facts under "Libraries checked" (`npm view`). They need the network, are not premises of "What is on the tree", and D1 to D3 are ruled (Z517).
- The Electron behaviours that need Electron started: the server inside a utility process, cross-window `storage` events between two BrowserWindows (the base of D7 (a)), the utility process's command line, `process` in the page's console, `HOME` and Electron's `userData`, and dismissing a dialog sheet. Each is marked "not verified" above with the run that settles it.
- The merits of Z516's automode choices and of Z517. These are the orchestrator's and Axel's, apart from the false D3 premise reported in 4.2.

Agent usage: abeb3af4ed6c02ba7, claude-opus-5-5, 284,824 tokens, 94 tool uses, 16.0 min (from its completion notice).

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- Left to the session.
