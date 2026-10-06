NOT verified at the end of round 2: a typed line reaching an open terminal after a Restart (the paste into the open terminal after the Restart left no `after-restart` line in its tmux pane, cause not determined; the code involved is `src/lib/state/client/socket.svelte.ts` reconnect and `src/lib/state/sessions/terminal/pty/pty-io.ts`), S1's reopen at the saved first line in the app and in Chrome and the rest-timed `followFirstLine` of `src/lib/ui/controls/editor/commands.ts` (no editor was opened in the one allowed start), the `LockedCode` split of `Source.svelte` (checked by tests/checks and svelte-check, no run), a foreign server's port move followed by `windows.ts` `followed` (by reading only), the zoom conversion of a drop point onto another window, Monaco's edit keys and the full-screen menu role of case 21; case 25 was not run, by ruling (judged by reading); cases 20, 31 and 39 are the look. Verified in round 2 by runs: Restart without a reload (`performance.timeOrigin` unchanged in the main and the popped-out window, New Terminal started after it), the drop into a popped-out window and the release over a title bar (case 27), `wordAt` (punctuation, apostrophe, space), the terminal's Cmd+A and Cmd+C, and `start.test.ts` with the recorder (5 passed).

Open items for Axel: the Restart-without-reload decision and the save-answer shape, both in "Open items for Axel" below; the Restart items are re-stated in "Repair round 2".

# O30 report

## Open items of the state file

Copied from `tools/oculus/.scratch/migration/orchestrator-state.md:173-175`:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

The list holds no entries.

## Runs of the full verify list

4 by me, counted with `ls $S/final-checks*.log` (S is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`): `final-checks.log`, `final-checks2.log`, `final-checks3.log`, `final-checks4.log`. The lines of the last, `final-checks4.log` (run through `bash ~/.claude-work/skills/land/templates/checks.sh .../orchestrator-state.md` from the worktree's `tools/oculus`, after the last source edit, which is `src/desktop/app.ts` at 00:10:17):

```
$ npm run test:quick
test:quick: 107 changed file(s), from git since HEAD
test:quick: 59 test file(s), 10 essential
ok      prettier (1.9 s): All matched files use Prettier code style!
ok      ASCII gate (2.0 s)
ok      svelte-kit sync (4.7 s)
ok      vitest (33.0 s): Duration  29.02s (transform 74.47s, setup 0ms, import 93.16s, tests 9.78s, environment 148ms)
ok      svelte-check (34.5 s): 1791238268451 COMPLETED 377 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (38.9 s)
test:quick: 40.8 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
exit=0
```

What that list does not cover, as its own line says: `tests/checks` and the slow tests. Both were run apart: `tests/checks` (all 16 files, `final-checks-dir4.log`, 00:12:04): `Test Files  16 passed (16)`, `Tests  229 passed (229)`; G48's slow file alone (`g48-final3.log`, 00:13:14): `Test Files  1 passed (1)`, `Tests  5 passed (5)`, `Duration  162.75s`.

Every app run below was taken on this tree except the one edit at `src/desktop/app.ts:171` (00:10:17): `find src config tests utils -type f -newermt '2026-10-05 23:24:00' ! -name local.yml` prints only `00:10:17 src/desktop/app.ts`. Runs labelled "earlier tree" were taken before later edits and were not re-run.

How the cases were run: the app started once more on a scratch hub, a scratch HOME (`$S/o30-look/home`), the scratch tmux socket `/tmp/o30t/tmux-502/default`, the scratch port 8817 (the cases ruling fixes 8817, 8818 and 8819), the debugging port 9333. The app was started through a stub (`$S/stubapp/main.cjs`) that records every `focus` and `show` the app's own code makes, answers the folder sheet and the dialogs from files, and can hold the server's `listening` message back; no window was brought to the front by me, and `focus.log` holds the windows the app's code focused. Windows were read and driven over the debugging port (`cdp.mjs`) and the main process over the inspector (`main.sh`). Each case's script and complete output is `$S/cases/<name>.sh` and `.out` (the harness cut some long lines with `cut -c`; a quoted line below is whole unless it says so).

## Premise runs and the cases ruling

Runs the brief names, each as printed in `$S/probe/p2.out` and `p3.out` (first run on the unchanged tree):

- `context-menu` under a cancelled right-click: `A /plain electron context-menu events: [{"word":"","sug":[],"x":90,"y":75},{"word":"","sug":[],"x":120,"y":75}] DOM contextmenu count/prevented: [2,null]` and `A /cancel electron context-menu events: [] DOM contextmenu count/prevented: [2,2]`. The ruling (`O30-cases.md` item 1) follows from it: the suggestions come from the preload (`webFrame.isWordMisspelled`, `getWordSuggestions`), the main listens to no `context-menu`.
- `findInPage` and a text box: `B /find found-in-page: {"requestId":1,"matches":2,...}` and `B /findnoinput found-in-page: {"requestId":1,"matches":1,...}`; `p4.out`: `B textinput matches 2`, `B search matches 2`, `B textarea matches 2`, `B nouserselect matches 2`, `B contenteditable matches 2`, `B shadow matches 2`, `B password matches 1`, `B vishidden matches 1`. The find bar is therefore a view of its own (item 2 of the ruling).
- `window.name` across `loadURL`: `C before {"arrangement":1}`, `C after loadURL to 8802: "{\"arrangement\":1}" http://127.0.0.1:8802/name`, `C after location.assign to 8801: "second" http://127.0.0.1:8801/name`.
- The sheet's dismissal: `D state after open: open`, `D after reload, state: open`, `D after navigate, state: open`, `D after win.close(), state: answered {"canceled":false,"filePaths":["/Users/axelfaes/Downloads"]} destroyed: true`. The sheet cannot be dismissed from the main; the answer `cancelled` at once and the dropping of the sheet's later answer are in the code (item 6 of the ruling), and case 39 says what was seen.
- The utility process's command line (case 1 below): `--type=utility --utility-sub-type=node.mojom.NodeService`, parent the app's main, pid equal to the `lsof` listener.
- The first lookup in macOS's spell server: `NSSpellServer findMisspelledWordInString timed out, index is 0` (`p3.out`); the preload calls `webFrame.isWordMisspelled('oculus')` once when it loads (item 1 of the ruling), and case 23 shows the first answers.

The brief's rules the first run found wrong, with the ruling (all in `briefs/O30-cases.md`, applied as ruled): item 10 (suggestions come from the preload, not the main's `context-menu`); item 11 (find bar is `src/routes/find/`, a view of its own, not `FindBar.svelte`); the server count by `--utility-sub-type=node.mojom.NodeService`; ports 8817/8818/8819; every run ends with `tmux -S <socket> kill-server`; the sheet cannot be dismissed from the main; `main.ts` never awaits `whenReady` at module top level.

Two more rules of the brief that were wrong, with what was done:

- The ASCII gate's `find src tests bin config`: the tree has no `bin`. It printed `bfs: error: bin: No such file or directory.` and then `exit=0`. The same gate over the paths that exist (`find src tests config -type f ! -name local.yml`) printed nothing and `exit=0`.
- Case 37 says the callers run "with no line of them changed". `tests/checks/config/config-folder.test.ts` is one of the eleven callers and holds the list of the catalog's files, which `config/text/desktop.yml` joins, so it changed by one line (`'desktop.yml',` added in `CATALOG_FILES` after line 226).

## Cases 1 to 44

### 1. `npm run app`, one window, one server process (final tree, `c00.out`, `c01.out`, `f00.out`)

```
main pid 32884
utility server pid(s): 35848
--- lsof listener on 8817
p35848
f32
page E6C915B23B81FCF3BEDCA8F665BE05F3 http://127.0.0.1:8817/
"{\"url\":\"http://127.0.0.1:8817/\",\"title\":\"axel@research: ~/Settings\", ... (status items) ... \"oculus runs on YQ530VVFGK and is served at http://127.0.0.1:8817. Open Status.\" ...
diff -r $OL/engine-before $OL/engine/config --exclude=local.yml
65c65
<   default: false
---
>   default: true
diff exit 1
```

`ps -o pid,ppid,args -p 35848` shows `Electron Helper --type=utility --utility-sub-type=node.mojom.NodeService`; the listener pid 35848 is that utility process and not the main (32884). One window on `http://127.0.0.1:8817/`; the Settings toggle changed the one line of `appearance.yml` (the config was restored afterwards). The status bar's server item reads "oculus runs on YQ530VVFGK and is served at http://127.0.0.1:8817. Open Status."; the word "connected" is not on it.

Dark app (Z567 ruling), `c01.out`: `"{\"themeSource\":\"dark\",\"bg\":[\"#181818\"]}"` and `"{\"body\":\"rgb(24, 24, 24)\",\"theme\":\"vscode-dark-modern\"}"`.

### 2. Packaged (earlier tree, `o30-bash` calls 377 to 385)

```
local.research.oculus
oculus
electron.icns
codesign exit 0
```

(`CFBundleIdentifier`, `CFBundleName`, `CFBundleIconFile`, then `codesign --verify --deep --strict`.) Started under `env -i HOME=... TMUX_TMPDIR=/tmp/o30t USER=$USER` with `--remote-debugging-port=9333`, `curl -s http://127.0.0.1:9333/json/list` listed `"title": "axel@research: ~/Files"`, `"url": "http://127.0.0.1:8817/"`. The utility server's environment held the login shell's path: `PATH=/opt/homebrew/bin:/Users/axelfaes/.local/bin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:...` and `TMUX_TMPDIR=/tmp/o30t`. NOT verified: the Terminal tab of the packaged app; in that run `tmux -S /tmp/o30t/tmux-502/default list-sessions` printed `error connecting to /tmp/o30t/tmux-502/default (No such file or directory)` after the click.

### 3. Window state (earlier tree, `o30-cases-view.txt` entries 467, 468)

```
{"bounds":{"x":200,"y":150,"w":900,"h":700},"maximised":false,"fullScreen":false,"zoom":1}
[{"x":200,"y":150,"width":900,"height":700}]
{"bounds":{"x":200,"y":150,"w":900,"h":700},"maximised":true,"fullScreen":false,"zoom":1}
[{"max":true,"b":{"x":0,"y":38,"width":1512,"height":944}}]
{"bounds":{"x":200,"y":150,"w":900,"h":700},"maximised":false,"fullScreen":true,"zoom":1}
[{"fs":true,"max":false}]
{"bounds": {"x": 9000, "y": 150, "w": 900, "h": 700}, "maximised": false, "fullScreen": false, "zoom": 1}
{"wins":[{"x":612,"y":150,"width":900,"height":700}],"displays":[{"x":0,"y":38,"width":1512,"height":944}],"primary":{"x":0,"y":38,"width":1512,"height":944}}
```

Move and resize, maximised and full screen come back after Quit and start; the file edited to x 9000 opens inside the primary display (x 612 + width 900 = 1512).

### 4 and 33. Second start (final tree, `c04_33.out`)

```
utility servers before: 1
build/handler.js before: 1791235619
oculus is already running; its window is brought to the front
exit 0
real    0m1.340s
build/handler.js after: 1791235619
utility servers after: 1
"[{\"id\":1,\"focused\":true,\"visible\":true}]"
```

The second start printed the line, exited 0 in 1.34 s, `build/handler.js` kept its time, one utility server remains. The window was brought forward by the app; I did not take or photograph the screen (coordinator rule), so "first window to the front" is the app's own `show` and `focus` calls, recorded as `{"what":"window.show","id":1,...}` in `focus.log`.

### 5. Port held by another program (earlier tree, `o30-bash` call 499)

```
dialog: Port 8817 is held by another program, so oculus did not start.
utility servers: 0
```

(`python3 -m http.server 8817 --bind 127.0.0.1` held the port.) The dialog has Quit only; the dialog's text is `config/text/desktop.yml`'s `port_other`.

### 6. Port held by an oculus (earlier tree, `o30-bash` calls 501 and 798)

```
health: {"app":"oculus"}
dialog: An oculus already answers on port 8817.
utility servers of the app: 0
11:            port_oculus: An oculus already answers on port {0}.
10:            open_window: Open a Window
13:            quit: Quit
```

With the dialog answered Open a Window (stub, press 0): `False ['Open a Window', 'Quit'] 0 An oculus already answers on port 8817.`, `{"app":"oculus"}`, and one window on `http://127.0.0.1:8817/` (`["http://127.0.0.1:8817/ {\"x\":78,\"y\":128,\"width\":700,\"height\":700}"]`). The second server kept answering until I ended it myself.

### 7. No `local.yml`, the default port (G48's test, final tree)

`npx vitest run tests/server/desktop/start.test.ts` alone, `g48-final3.log`: `Test Files  1 passed (1)`, `Tests  5 passed (5)`, `Duration  162.75s`; the row 'asks the default port, passed as a held scratch port, whether an oculus answers there when no local.yml names a port, and starts no second server' is the case. The shipped default, by reading: `grep -n "DEFAULT_PORT = " src/lib/data/sources/config/local.ts` prints `122:export const DEFAULT_PORT = 8790;`.

### 8. `accounts: 5` (earlier tree, `o30-bash` call 765)

The page's findings text contained `local.yml`, `accounts` and `accounts must be a list; the default is used`; the window opened.

### 9. `--engine` with no `config/` (earlier tree, `o30-cases-view.txt` entries 472 to 474)

```
dialog: oculus did not start: $S/o30-dark/empty holds no config/ folder, so there is nothing
children of dialog-showing main:
0
```

The dialog is the sentence of `parseEngineArgs`; the main had no utility server child. A SIGTERM sent while the dialog was open printed `still running`; the dialog was not answered (the OS does not allow `osascript` to press: `osascript is not allowed assistive access. (-1719)`), so "the app quits after the answer" is not verified.

### 10. `build/` missing, packaged (earlier tree, `o30-cases-view.txt` entry 475)

```
dialog: The oculus server is not built. Run npm run build, then start the app again.
main 25040; utility children: 0
```

`build/` was moved aside for the run and is back (`ls` of the worktree's `tools/oculus` lists `build`).

### 11. A floating pane's Move into New Window (final tree, `c11.out`)

```
"{\"floats\":[\"float dock right svelt\"],\"tabs\":[\"Focus\",\"Settings\",\"Live HPC\",\"Usage\"]}"
"[\"Close pane\",\"Dock Left\",\"Dock Bottom\",\"Float\",\"Move into New Window\",\"Return to Page\",\"Move tab to page...\"]"
"picked Move into New Window"
"{\"floats\":0,\"tabs\":[\"Focus\",\"Settings\"]}"
"{\"tabs\":[\"Live HPC\",\"Usage\"],\"panes\":2,\"rail\":false}"
"\"place\":{\"kind\":\"window\",\"x\":1012,\"y\":138,\"w\":600,\"h\":400}"
main pid 47412 ended after 1s
"[\"Live HPC\",\"Usage\"]"
```

A window holds the pane (`b: x 912, y 110, width 600, height 428`, the float's place in screen points); the main window draws no float; after Quit and start the window is there with `["Live HPC","Usage"]`.

### 12. A tab's, a copy's and a pane's Move into New Window (final tree, `f01b` to `f09`, `f20`)

Source tab `long.ts` (a hub file of 40 numbered lines), scrolled in the main window by a mouse wheel of 2500 (`f02.out`): `"{\"first\":\"3\",\"lines\":40}"` (first line number drawn: 3). Its tab menu: `"[\"Close\",...,\"Split Right\",\"Split & Move\",\"Move into New Window\",\"Co` (the line is cut at 400 characters by the harness; it ends with Copy into New Window).

- Copy into New Window: window 2 opens with `"{\"tabs\":[\" long.ts\"],\"first\":\"1\"}"`; the main window keeps `"first\":\"3\"`. The copy opens at line 1, the original reads line 3: the scroll clause is NOT met. Cause: a source tab's saved state holds no scroll position (open decision above). Both tabs are in the saved arrangement (`"root":"hub","path":"long.ts","label":"long.ts"` twice).
- Move into New Window of the tab (`f09`): `"main tabs after the move:" ["Files","Repositories","Search","Live HPC","Usage"]`, window 3 `{"tabs":[" long.ts"],"first":"1"}`.
- A Terminal tab's menu (`f06`): `["Close","Close Others","Close to the Right","Close Saved","Close All","Keep Open","Pin","Split Right","Split & Move","Move into New Window"]`, no Copy.
- A pane's Move into New Window (`f20`): main before 3 floats, after 2; the new window `["Live HPC","Usage"]`.

### 13. In a popped-out window (final tree, `f20.out`)

Pane menu: `["Close pane","Restore into Main Window","Return to Page","Dock Left","Dock Right","Dock Bottom","Switch to Main Window","Move tab to page..."]`. Tab menu there: `[...,"Move into New Window","Copy into New Window"]`. Strip menu: `["Open File...","New Text File","Restore into Main Window","Return to Page","Dock Left","Dock Right","Dock Bottom","Switch to Main Window","Lock Group","Tab Bar","Editor Actions Position","Close","New Terminal"]`.

- Dock Right: the window ended and the main window drew the pane again (floats 2 to 3, the Live HPC and Usage pane back).
- Return to Page: window ended, the pane sits in the main page's panes (`[["Sessions"],[],[],["Live HPC","Usage"],...]`), floats 3 to 2.
- Restore into Main Window (after Float and a new window): window ended, floats back to 3 with the pane.
- Switch to Main Window: `focus.log` since the pick: `{"what":"window.show","id":1,...}` then `{"what":"window.focus","id":1,...}`.

### 14. A popped-out window closed (final tree, `f10` to `f19`; unsaved text NOT verified)

Windows 3 (`long.ts`, `Untitled-1`) and 4 (a Terminal tab with `sleep 600`) were closed by `win.close()` from the main (not by pressing the close button). Before: places `window`, `window`, `window`; after: `"\"place\":{\"kind\":\"free\",\"x\":0.35,\"y\":0.3,\"w\":0.3,\"h\":0.4}"` for both; main tabs `["Files","Repositories","Search","Live HPC","Usage"," long.ts","Untitled-1","451e09-shell"]` with `floats: 3`; `dialogs.log lines before: 0`, `after: 0`; `tmux ... list-panes`: `oculus-451e09-shell sleep`. Tabs return as a free float, `sleep` keeps running, nothing was asked. The text kept: not verified; the editor's textarea is read-only while the OS has not focused the window (`"ro":[true,true]` in `f16.out`), so text could not be typed.

### 15. The main window closed with a popped-out window open (final tree, `f42.out`)

```
"closed main window 1"
windows after the close:
"[]"
listener on 8817:
Electron 99719 127.0.0.1:8817
app main still running: 43824 .../Electron.app/Contents/MacOS/Electron
server pid 99719
--- File > New Window
windows after New Window:
"[{\"id\":14,...float=17b7e352-...},{\"id\":13,\"url\":\"http://127.0.0.1:8817/\",...}]"
```

Both windows closed, the app and the server kept running, File > New Window opened the main window and the popped-out window again (window 14 holds `["Live HPC"]`).

### 16. Quit with a Terminal tab running `sleep 600` (final tree, `f47` to `f49`; restart NOT run)

```
before: oculus-913f66-shell sleep
main process gone after about 0.5 s (elapsed 1 s)
listeners on 8817, 8818, 8819:
       0
utility server processes of the app:
       0
dialogs.log lines after: 1   (the same one line as before: the server-ended dialog of case 24)
oculus-913f66-shell: 1 windows (created Tue Oct  6 00:09:23 2026)
after: oculus-913f66-shell sleep
```

The quit was a SIGTERM to the main (`kill -TERM`), not the Cmd+Q key (no OS key press). No question was asked, nothing listens on 8817, 8818 or 8819, no utility server process remains, the tmux session and `sleep` stay. Started again with the Terminal tab drawing the same terminal: not run (the scratch session was ended with `kill-server` after).

### 17. Unsaved text, Cmd+Q at once: NOT verified

Text cannot be typed into the editor without the OS having focused the window (`f12` to `f18`: `type:` arrives as `"hit":[]`; `ta.readOnly` is `true`). Not run; the orchestrator's look.

### 18. The link decision (final tree, `c18.out`)

```
http://127.0.0.1:8817/ => {"kind":"main"}
http://127.0.0.1:8817/?float=f1 => {"kind":"float","id":"f1"}
http://127.0.0.1:8817/api/file/hub/a.pdf => {"kind":"browser"}
https://example.org/ => {"kind":"browser"}
mailto:a@b.c => {"kind":"browser"}
file:///etc/hosts => {"kind":"refused"}
javascript:alert(1) => {"kind":"refused"}
http://127.0.0.1:8790/ => {"kind":"browser"}
http://localhost:8817/ => {"kind":"browser"}
```

G47's first test holds one row per input. A public link at the look: the orchestrator's.

### 19. Open Worktree in New Window (final tree, `f21.out`, `f24.out`)

`Worktrees.svelte` calls `window.open(window.location.href, '_blank')` (`openWindow: (address) => void window.open(address, '_blank')`, `address: () => window.location.href`). Called from the main page: `"window.open(http://127.0.0.1:8817/)"`, and window 9 opened at `http://127.0.0.1:8817/` (`{"id":9,"url":"http://127.0.0.1:8817/","b":{"x":144,"y":138,"width":1280,"height":800}}`). File > New Window (Cmd+Shift+N) opened window 10; both main pages listed the same tabs: `["Sessions","Transcript","Settings","Help","Timeline","Session","Changes","Agents","Files"," long.ts","Untitled-1","451e09-shell"]`. NOT driven: the Repositories row's own menu item; window 9's pages were not read (File > New Window's tabs were).

### 20. Add Folder to Workspace (final tree, `f39.out`; the sheet is a stub)

```
sources.yml md5 at the start: 927ef85e93ecf099aac418f3507b127a  (recorded before the app started: 927ef85e93ecf099aac418f3507b127a)
--- Cancel
md5: 927ef85e93ecf099aac418f3507b127a
{"openSheet":true,"onWindow":true,"windowId":1,"properties":["openDirectory","multiSelections","createDirectory"]}
--- two folders chosen
md5: c146975851bea95a59a106d8565ca2a2
95:  - { key: f1, dir: .../o30-look/f1 }
96:  - { key: f2, dir: .../o30-look/f2 }
--- a second press while the sheet is open
busy text before the second press: false
busy text after the second press: true
```

The app asked for a directory sheet on window 1 (`onWindow: true`, properties as in the brief); Cancel changed nothing; two folders were added as roots (`diff -r` shows exactly the two added lines); the second press showed the busy text ("The folder panel is already open"). A real sheet was not shown: a stub answers it.

### 21. Keys (final tree, `f23`, `f24`, `f21`; partial)

- Cmd+N then Cmd+W (key events to the page, `Input.dispatchKeyEvent` with the Meta modifier, in the pane holding Transcript): tabs `["Sessions","Transcript","Timeline",...]` after Cmd+N: `["Sessions","Transcript","Untitled-1","Timeline",...]`, after Cmd+W: back to `["Sessions","Transcript","Timeline",...]`. Over unsaved text the question was not run.
- Ctrl+Tab and Ctrl+Shift+Tab: selected `Transcript`, after Ctrl+Tab `Timeline`, after Ctrl+Shift+Tab `Transcript`.
- Menu items, clicked from the main through each item's `click`: Settings... then `["Sessions","Settings","Session","Untitled-1","451e09-shell"]`; oculus Help then `[...,"Help",...]`; `focus.log` shows `window.show` and `window.focus` of the main window each time. New Window (Cmd+Shift+N) opened window 10; Close Window (Cmd+Shift+W) closed it; zoom `{"z0":1,"z1":1.1,"z2":0.9,"z3":1}` (in, out twice, reset).
- The application menu, with accelerators and roles, as printed by `f21.out` (excerpt): `Settings... | acc=Cmd+,`, `New Window | acc=Cmd+Shift+N`, `Close Window | acc=Cmd+Shift+W`, `Undo | acc=CommandOrControl+Z | role=undo | registerAccelerator=false` (likewise Redo, Cut, Copy, Paste, Select All), `Reload | acc=Cmd+R | role=reload`, `Toggle Full Screen | acc=Ctrl+Cmd+F | role=togglefullscreen`, `Zoom In | acc=Cmd+=`, `Zoom Out | acc=Cmd+-`, `Reset Zoom | acc=Cmd+0`, `Toggle Developer Tools | acc=Alt+Cmd+I | role=toggledevtools`, `Switch to Main Window`, `oculus Help`.
- NOT verified: Cmd+Z, Shift+Cmd+Z, Cmd+X, Cmd+C, Cmd+V, Cmd+A as real key presses in a source tab, a terminal and a text field; full screen and Alt+Cmd+I by a run (the roles are in the printed menu); Cmd+W over unsaved text; Cmd+Shift+W and Cmd+Shift+N were run by the item's click, not by the key.

### 22. Find in the page (final tree, `f25.out`, `f26.out`)

```
views over the window before:  |n=0
views over the window after Cmd+F: 7/find |n=1
"1 of 2965"
"occurrences of the in the page text: 2965"
"2 of 2965 | 3 of 2965 | 2 of 2965 | 3 of 2731"
```

The Help view's page, query `the`: the bar shows `1 of 2965`; the page's own text holds 2965 (`document.body.innerText` counted); Enter, Enter, Shift+Enter then Match case gave `2 of 2965 | 3 of 2965 | 2 of 2965 | 3 of 2731`, so stepping never lands in the bar. Escape in the bar: the view left the window (`|n=0`) and `contents.focus` of the main window's page was recorded. In a source tab (window 2): `"{\"findWidgetVisible\":true}"` and `views over window 2: n=0`: Monaco's find, no bar.

### 23. Spelling suggestions in the text menu (final tree, `f27.out`, `f28.out`)

```
"[{\"misspelled\":true,\"suggestions\":[\"weld\",\"wold\",\"wild\",\"wrud\",\"world\"]},{\"misspelled\":false,\"suggestions\":[]}]"
"wrld hello"
"[\"weld\",\"wold\",\"wild\",\"wrud\",\"world\",\"Undo\",\"Redo\",\"Paste\",\"Select All\"]"
first item: weld
"weld hello"
"[\"Undo\",\"Redo\",\"Paste\",\"Select All\"]"
```

In the Explorer's filter box (a text box inside `TextBoxMenu`) holding `wrld hello`, a right-click on `wrld` listed the suggestions above Undo and Redo; picking `weld` made the value `weld hello`; a right-click on `hello` listed `Undo`, `Redo`, `Paste`, `Select All`. The right-click was the first on the page; before it `window.oculusDesktop.spelling` had been called through the bridge, which is the first lookup after the start. The tab right-click showed oculus's tab menu (`f02.out`, `f09.out`: `["Close","Close Others",...]`). No native menu: `grep -rn "context-menu" src/desktop` prints one line, a comment in `src/desktop/preload.cjs:8`, so the main registers no `context-menu` listener and the preload's `spelling` is the only source. Chrome shows no suggestion: `spelling.ts`'s context is provided by the page root only when the app gave a bridge (reading); not run in Chrome.

### 24. The server process killed (final tree, `f41.out`)

```
main=43824 server=46185
False ['Restart', 'Quit'] pressed 0 The oculus server ended (exit code 9): usage watch: cannot w
new server pid 99719
p99719
"200 {\"app\":\"oculus\"}"
"{\"tabs\":[\"Files\",\"Repositories\",\"Search\",\" long.ts\",\"Untitled-1\"],\"status\":\"YQ530VVFGK | 35 | unreachable | refreshing | up | 0 | 0\"}"
```

The dialog named the exit code and offered Restart and Quit (pressed 0 by the stub); Restart brought a new server (pid 99719) and the page answers `/api/health` and draws connected. The run also opened a second main window on Restart (window 12 beside window 1 in the window list, `f41.out`'s last line). That defect is fixed in `src/desktop/app.ts:171`: after a listen, the first start opens a window and a restart opens none when `windows.lastMain()` is not null. NOT verified by an app run (the one start was used before the edit); G48 and the full list passed after it. No test was added (G48 has no dialog-press harness). The orchestrator checks it in the look: kill the server utility process, press Restart, one main window remains.

### 25. A page crash: not run, by ruling

Judged by reading `src/desktop/windows/windows.ts:174-177`:

```
contents.on('render-process-gone', (_event, details) => {
    deps.log(`a window's page went: ${details.reason}`);
    if (!quit && details.reason !== 'clean-exit') contents.reload();
});
```

A page whose renderer ended for any reason but a clean exit is reloaded, unless the app is quitting. `grep -rn -i "crash-window\|crashAfter\|forcefullyCrash" src tests config HELP.md DESIGN.md README.md` printed nothing, `exit=1`.

### 26. A port move (final tree, `f43.out`)

```
local.yml port line now: port: 8819
windows after:
"[{\"id\":14,\"url\":\"oat=17b7e352-...\"...},{\"id\":13,\"url\":\"http://127.0.0.1:8819/\",...}]"
listeners:
Electron 99719 127.0.0.1:8819
addresses sent to the default browser: "[]"
"{\"tabs\":[\"Sessions\",\"Transcript\",\"Settings\",\"Help\",\"Timeline\",\"Session\",\"Changes\",\"Agents\",\"Files\",\" long.ts\",\"Untitled-1\"],\"origin\":\"http://127.0.0.1:8819\"}"
```

The main window followed to 8819 and kept its tabs (the popped-out window's url was cut at the harness's 110 characters). The default browser got nothing (`shell.openExternal` recorder: `[]`). Quit then left nothing on 8819 (case 16's `lsof` listeners 0 after the quit).

### 27. A tab dragged out (final tree, `f29` to `f32`; the into-a-popped-out-window variant NOT shown)

A docked tab (`Focus`) dragged with real mouse events to the screen point (1500,300) (`f31.out`): window 11 opened at `{"x":912,"y":410,"width":600,"height":428}` holding `["Focus"]`, the main window's tabs lost it, `focus.log`: `{"what":"window.show","id":11,...}`. A tab inside a float (`Untitled-1`) is not draggable (`f30.out`: no window, no change). The dragged-back drop (`f32.out`): `Focus` dragged from window 11 to a point that falls on the main window: window 11 ended and `Focus` was in the main window's tabs again. A drop onto a popped-out window was not shown: the windows overlap there and the main window was chosen. The drag-outside test (3 tests) covers the page's call.

### 28. The login shell takes longer than 10 s (earlier tree, packaged, `o30-bash` calls 487 to 491)

`.zprofile` with `sleep 15`: `dialog after 13 s`, `dialog: The login shell did not answer within 10 seconds, so programs on its PATH (tmux, git, claude) may not be found.` (Continue and Quit buttons); then the server ran on the inherited environment: `server pid 93157`, `"axel@research: ~/Settings"`, `grep -c "^dialog:" ... 1`. The dialog was seen 13 s after the start of the app (the 10 s limit of the login shell plus the app's own start); case 28's "after 10 s" is therefore met within that start time.

### 29. The sender check (final tree, `c29.out`)

```
top frame of the server origin, path / => "page" save-layout: true find: true
subframe of the server origin => null save-layout: false find: false
top frame of another origin => null save-layout: false find: false
top frame of the server origin, path /find => "find-bar" save-layout: false find: true
subframe of the server origin, path /find => null save-layout: false find: false
```

### 30. Permissions (final tree, `c30.out`)

For the server's origin: `clipboard-read => true`, `clipboard-sanitized-write => true`, `fullscreen => true`, `media => false`, `geolocation => false`, `notifications => false`, `clipboard-write => false`; for `https://example.org` every ask `=> false`. Paste in a terminal's menu: not run.

### 31. Chrome after landing: the orchestrator's look

By reading: `src/lib/assets/favicon.svg` is the new drawing (18 lines); the app-only items, the app key rows and the suggestions are present only when `window.oculusDesktop` exists (`src/lib/state/shared/stores/desktop.ts`).

### 32. The port in use line (G48's test)

G48's test 'prints the port in use and exits 1 when the server cannot listen' passed in `g48-final3.log` (5 passed). The line is `server.start.port_in_use` of `config/text/server.yml`: `'oculus: port {0} is in use'`.

### 34. The port-move ordering (final tree, `f44.out`)

The stub held the server's `listening` message back by 7 seconds:

```
window addresses before: ["http://127.0.0.1:8819/?float=17b7e352-...","http://127.0.0.1:8819/"]
a window reached 8818 after about 1 s
window addresses after: ["http://127.0.0.1:8818/?float=17b7e352-...","http://127.0.0.1:8818/"]
{"t":1791238120949,"what":"held listening","id":8818,"url":""}
{"t":1791238127952,"what":"released listening","id":8818,"url":""}
addresses sent to the default browser: "[]"
```

The windows were on 8818 about 1 s after the file changed, 7 s before the held message was released: the navigation was admitted and loaded before the message (the order "navigation first"). The order "message first" is the usual one of case 26 (no hold). Nothing opened in the default browser.

### 35. Two windows changing the arrangement at once (final tree, `f33.out`; partial)

```
page tab ids: main "hd4zc1" window 8 "f6mlem"
"picked Split Right" "closed Usage"
window 8: ["Live HPC"]
writes: [["-7s","hd4zc1","splitInstance",1,19],["-7s","f6mlem","closeInstance",1,18]]
```

A tab split in the main window and `Usage` closed in window 8 within one second: both writes are in `oculus.layout.writes.v1` (`splitInstance` by the main's page, `closeInstance` by window 8's page) and window 8's tab is gone. The main window's split changed no pane (`[["Focus"],...]` before and after), so "both changes are in the saved arrangement" is shown for the close and for the record of the split only. The refused write run again: not seen in the entries.

### 36. A terminal ended from outside (final tree, `f37.out`)

```
page tab ids: main "hd4zc1" window 8 "f6mlem" window 2 "ykci8t"
main tabs before: ["Focus"," long.ts","Untitled-1","37fefa-shell"]
kill-session exit 0
main tabs after:  ["Focus"," long.ts","Untitled-1"]
window 8 tabs: ["Live HPC"]   window 2 tabs: [" long.ts"]
writes after: [... {"age":-11,"page":"hd4zc1","call":"closeInstance","tabs":17}]
closeInstance entries: [{"age":-292,"page":"hd4zc1"},{"age":-113,"page":"f6mlem"},{"age":-11,"page":"hd4zc1"}]
```

The Terminal tab was closed once, by the main window's page (`hd4zc1`, age -11); the popped-out pages' tab ids (`f6mlem`, `ykci8t`) have no write for it (`f6mlem`'s entry at -113 is the earlier close of `Usage`).

### 37. The `createClientState()` callers (final tree, `c37.out`)

```
CHANGED   tests/checks/config/config-folder.test.ts
unchanged tests/checks/source/keys.test.ts
unchanged tests/fixtures/client.ts
unchanged tests/shell/panes/strip/tab-menu.test.ts
unchanged tests/state/client/terminal/terminal-close.test.ts
unchanged tests/state/forms/form-drafts.test.ts
unchanged tests/state/forms/manifest-draft.test.ts
unchanged tests/state/sessions/source.test.ts
unchanged tests/state/workbench/layout/saved/layout-unread.test.ts
226a227
>         'desktop.yml',
 Test Files  8 passed (8)
      Tests  44 passed (44)
```

Nine files call it (the brief says eleven); eight of them are unchanged and the ninth, `config-folder.test.ts`, gained the line above (a catalog file added).

### 38. The real profile (final tree, `c38.out`, `f49.out`)

```
real profile now:
stat: /Users/axelfaes/Library/Application Support/oculus: stat: No such file or directory
scratch profile:
blob_storage
Cache
Code Cache
Cookies
...
=== real profile untouched
stat: /Users/axelfaes/Library/Application Support/oculus: stat: No such file or directory
```

Absent before and after; the scratch profile holds the app's data.

### 39. A pick whose page goes (final tree, `f40.out`)

```
sources.yml md5 before: c146975851bea95a59a106d8565ca2a2
after the reload: busy text on the page: false
after a new press: busy text: false  failure text: false
sources.yml md5 after: c146975851bea95a59a106d8565ca2a2
{"openSheet":true,"onWindow":true,"windowId":1,...}
{"openSheet":true,"onWindow":true,"windowId":1,...}
```

After the reload (`Page.reload`) a new press was not answered busy, no failure was said, no folder was added (the md5 is the same). Whether the sheet itself closed: a real sheet was not shown (a stub answers it); the first run on the unchanged tree shows Electron leaves a sheet up through a reload or `loadURL` and answers it with the default folder on `win.close()` (`D after reload, state: open`; `D after win.close(), state: answered {"canceled":false,"filePaths":["/Users/axelfaes/Downloads"]}`), so a sheet left on screen is cancelled by the reader and its answer dropped, as ruling item 6 says.

### 40. A popped-out window's place on no display (earlier tree, `o30-bash` calls 761, 762)

Places edited to `"place":{"kind":"window","x":9000,"y":142,"w":609,"h":742}` and `"place":{"kind":"window","x":9000,"y":66,"w":5000,"h":4000}`, then quit and start: `891519316ed7 {"x":0,"y":38,"width":1512,"height":944}` and `76bb5f2f8be2 {"x":903,"y":114,"width":609,"height":770}`: both on the primary display (work area `{"x":0,"y":38,"width":1512,"height":944}`), the second clamped to it.

### 41. Cmd+W on the last tab of a popped-out window (final tree, `f38.out`; unsaved text NOT verified)

```
places before: window 508,142 500x742 ; free ; window 564,370 384x309
dialogs.log lines before: 0
windows after: ids 8 and 1 (window 2 gone)
places after: free ; window 564,370 384x309
dialogs.log lines after: 0
```

Window 2 (`long.ts`) closed by Cmd+W, its place left the arrangement, nothing was asked. Over unsaved text: not verified (text cannot be typed, case 14).

### 42 and 43. A window onto an oculus the app did not start (earlier tree, `o30-bash` calls 799 to 803)

After case 6's Open a Window, `port: 8818` written to the second server's `local.yml`: the windows moved to `http://127.0.0.1:8818/?float=...` and `http://127.0.0.1:8818/`, `{"app":"oculus"}` answered, the tabs `["Settings","Findings","Files"," code.ts"]` were kept. The default browser: not recorded in that run (cases 26 and 34 recorded `[]` for the same decision). Case 43 (Add Folder in that window): a fake `osascript` on the server's PATH recorded the call and its first lines `-l JavaScript -e ObjC.import('AppKit'); const panel = $.NSOpenPanel.openPanel; panel.canChooseDirectories = true; ...`, and the two answered paths were added (`95:  - { key: f1, dir: ...`, `96:  - { key: f2, dir: ...`): the server's own panel, as before.

### 44. The debugging port (final tree, `c44a.out`, `c44b.out`)

```
main pid 32884, started with --remote-debugging-port=9333
pid 32884 engine --remote-debugging-port=9333: 127.0.0.1:9333 127.0.0.1:9229
pid 35848 oculus --shared-files --field-trial-hand: 127.0.0.1:8817
2          (curl -s http://127.0.0.1:9333/json/list | grep -c '"type": "page"')
main pid 44602, started without --remote-debugging-port
pid 44602 engine: 
pid 44897 oculus --shared-files --field-: 127.0.0.1:8817
(8817 is the server's own listener, the utility process)
9333 does not answer
```

Without the switch the main and its helpers listen on no port (8817 is the server utility process's own listener); with it the main lists 9333 and the pages. (9229 is the inspector the harness opened with SIGUSR1.)

## DONE / NOT DONE

| Check | State | Output |
| --- | --- | --- |
| `checks.sh` full list (4 runs, last `final-checks4.log`) | DONE | `ok prettier`, `ok ASCII gate`, `ok vitest`, `ok svelte-check ... 0 ERRORS 0 WARNINGS`, `ok eslint`, `checks: 1 commands passed`, `exit=0` |
| `tests/checks` (16 files) | DONE | `Test Files  16 passed (16)`, `Tests  229 passed (229)` |
| G48 alone | DONE | `Test Files  1 passed (1)`, `Tests  5 passed (5)`, `Duration  162.75s` |
| picker, layout-saved and G28's files, G47, drag-outside, text-menu, run this turn | DONE | `Test Files  12 passed (12)`, `Tests  34 passed (34)`, `exit=0` |
| the same picker, layout-saved and the eight callers, before the first change | DONE | `Test Files  10 passed (10)`, `Tests  46 passed (46)` (18:18:25) |
| G47's and G48's files on the unchanged tree | DONE | `Error: Cannot find module '../../../src/desktop/decide/links.ts'` (`unch-g47-drag.log`); `Error: Cannot find module '../../../src/lib/server/root/process/words.ts'` (`unch-g48.log`) |
| drag-outside, text-menu on the unchanged tree | DONE | `3 tests | 3 failed` (`unch-g47-drag.log`); `7 tests | 7 failed`, `TypeError: wordAt is not a function` (`unch-text.log`) |
| `sh utils/folder-check.sh` | DONE | no output, `exit=0` |
| `sh utils/unused-exports.sh` against the base's `unused-exports.txt` | DONE | see below |
| `node --check src/desktop/preload.cjs` | DONE | no output, `exit=0` (the one `.cjs` file) |
| ASCII gate, the brief's paths | DONE | `bfs: error: bin: No such file or directory.` then `exit=0` |
| ASCII gate, `find src tests config ...` | DONE | no output, `exit=0` |
| `npm run diagrams` | DONE | `final-diagrams2.log`: `> node utils/diagrams/diagrams.mjs`, then the `docs/diagrams/*.dot` and `.svg` names; G25's test is in the 16-file run above |
| crash-switch grep | DONE | no output, `exit=1` |
| `wc -l` of the changed files | DONE | `830 src/lib/state/workbench/layout.svelte.ts`, `132 src/lib/state/workbench/layout/saved/load.ts`; the largest other changed file is 839 (`terminals.svelte.ts`); components: `PaneView.svelte` 481, `Workbench.svelte` 464 |
| Cases 1 to 44 | partial | see the first line; every case above has its run or its reading |
| Item 10 of "Verify" (standards pages) | no pages | the brief's own text says the configuration's `standards` list is empty, so there is no page to read a list item or sentence against |
| Restart's second window fix | NOT verified | no app run after the edit |

`sh utils/unused-exports.sh`: 256 unused exports against 255 in the base. Lines not in the base's `unused-exports.txt` (`grep -vxFf`):

```
src/lib/server/root/process/parent.ts: parentOf, askParentToPick
src/lib/server/root/process/parent.ts: ParentPort   (unused exported types)
```

`src/server.ts:16` imports `askParentToPick, parentOf, type ParentPort` and calls them at lines 45 and 58; the tool does not treat `src/server.ts` as an entry (the Node entry the server runs as), so it reads them as unused. Left as they are, since removing the export would break the import. Two lines of the base left the list: `engineDir` and `DEFAULT_PORT` are used now (`src/lib/data/sources/config.ts` and `config/local.ts` lines).

## The terms

`ls docs` prints `diagrams`; the tree has no `docs/glossary.md`, so no term of it is added, changed or used.

## Files and line counts

From `diff -rq` against the base copy `/Users/axelfaes/workspace/research-hub/.agents/worktrees/O30-base/tools/oculus` (58 lines, `$S/diffrq-final.txt`; the base holds `config`, `src`, `tests`, `utils` only). Line counts after the change; "(base N)" for a changed file. Paths outside the brief's "Paths this step writes" carry their reason.

New:

- `config/text/desktop.yml` 59
- `src/desktop/` 25 files, 2048 lines (largest `windows/windows.ts` 381, `app.ts` 317, `windows/bridge.ts` 165), the preload `preload.cjs` among them
- `src/lib/server/root/process/parent.ts` 116, `port.ts` 21, `words.ts` 21
- `src/lib/shell/desktop-windows.svelte.ts` 66 (outside the paths: it is the page's one call site for the windows, so the Workbench file stays under its limit)
- `src/lib/shell/panes/floats/FloatWindow.svelte` 50 (outside: the one float a popped-out window draws)
- `src/lib/shell/panes/floats/window-bounds.ts` 47 (outside: where a new window opens, kept apart from `float-geometry.ts` for its size)
- `src/lib/shell/panes/strip/strip-tab.ts` 60 (outside: split off `pane-view.ts`, which would pass its limit)
- `src/lib/state/shared/stores/desktop.ts` 94 (outside: the one place the bridge is typed; under `stores/` so the boundaries rule for shell stores covers it)
- `src/lib/state/workbench/layout/open/float/` 2 files, 538 lines (`pages.ts` 422, `store.ts` 116) replacing `open/floats.ts` (removed; outside: the float code grew past one file)
- `src/lib/state/workbench/layout/saved/load.ts` 132 (outside: takes the load out of `layout.svelte.ts`, 886 to 830 lines, under the 880 limit)
- `src/lib/ui/controls/text/spelling.ts` 28 (the primitives' own context for the spelling ask)
- `src/routes/api/health/+server.ts` 13, `src/routes/find/` 3 files 165 lines (`routes/find/*` replaces `FindBar.svelte` by the cases ruling)
- `tests/server/desktop/` 3 files 385 lines, `tests/state/workbench/drag-outside.client.test.ts` 60, `tests/ui/controls/text/text-menu.test.ts` 54

Changed:

- `config/text/server.yml` 109 (base 106), `config/text/ui.yml` 133 (base 129)
- `src/hooks.server.ts` 98 (base 91), `src/server.ts` 99 (base 62), `src/lib/assets/favicon.svg` 18 (the base is a one-line file)
- `src/lib/server/core/auth.ts` 120 (119), `src/lib/server/files/fs/picker.ts` 132 (116), `src/lib/server/root/process/args.ts` 80 (66; outside: the `--default-port` flag of `port.ts`)
- `src/lib/shell/Workbench.svelte` 464 (440), `context-guard.ts` 23 (21), `keys/key-dom.ts` 91 (70; outside: the key actions the app routes to the page), `keys/keys.ts` 293 (247), `keys/workbench-keys.svelte.ts` 466 (448), `panes/PaneView.svelte` 481 (499), `panes/floats/FloatLayer.svelte` 218 (214), `panes/floats/float-geometry.ts` 201 (190), `panes/pane-view.ts` 504 (441), `panes/strip/tab-menu-state.svelte.ts` 179 (167; outside: the menu's window picks), `panes/strip/tab-menu.ts` 279 (261)
- `src/lib/state/client/context.ts` 514 (505), `sessions/terminal/workbench-shape.ts` 44 (39; outside: carries the `upkeep` flag), `sessions/terminals.svelte.ts` 839 (839; outside: `if (workbench.upkeep !== false) closeEnded(...)`, so a popped-out page does not close an ended terminal; case 36), `shared/words/appearance.ts` 388 (338; outside: the app's dark start), `workbench/drag.svelte.ts` 473 (376), `workbench/layout/index.ts` 139 (145), `layout/instances.ts` 378 (378; outside: copy of a tab), `layout/model.ts` 295 (292), `layout/saved/saved.ts` 687 (677), `layout/saved/storage.ts` 272 (197), `workbench/layout.svelte.ts` 830 (886), `workbench/ui.svelte.ts` 689 (690; outside: the copy's state)
- `src/lib/ui/controls/text/TextBoxMenu.svelte` 71 (40), `text-menu.ts` 183 (116), `src/lib/ui/menu/ContextMenu.svelte` 158 (146; outside: the `lead` items of the suggestions), `src/routes/+page.svelte` 230 (221)
- `tests/checks/config/config-folder.test.ts` 554 (553), `tests/checks/tree/boundaries.test.ts` 658 (655), `tests/state/workbench/layout/saved/layout-saved.test.ts` 34 (33), `utils/diagrams/graphs.mjs` 520 (517)

Top-level files with no base copy (the main checkout has moved on, so they are not diffed): `package.json` 102 lines (`main` is `src/desktop/main.ts`; scripts `app` and `app:package`; dependencies `electron` 44.5.1, `@electron/packager` 20.3.0, `shell-env` 4.0.3, all three named by the brief's rulings), `package-lock.json`, `HELP.md` 362, `DESIGN.md` 436 (`grep -c "Still undecided" DESIGN.md` prints 0; line 72 lists `desktop/`; line 436 states the native window), `README.md` 38 (line 9 the app), `assets/app-icon.svg` 18, `assets/app-icon.png`, `docs/diagrams/*` (`npm run diagrams`).

## The tests of G47 and G48 (for the entries' Test lines)

- G47, `tests/server/desktop/window-guard.test.ts`:
  - 'sends each address where the link decision says'
  - "answers the bridge only from the top frame of the server's page"
  - "grants clipboard and full screen to the server's page alone and denies every other ask"
  - 'makes every window with Node integration off and isolation and the sandbox on, subframes included'
  - 'starts a page in the app on the dark theme, keeps a saved choice and leaves a browser tab its own start' (the fifth, from the dark-app ruling)
- G48, `tests/server/desktop/start.test.ts` (slow):
  - 'brings the running app forward on a second start and starts no server'
  - 'starts no server when another program holds the port, and names the port'
  - 'stops the server process on Quit and leaves every tmux session running'
  - 'prints the port in use and exits 1 when the server cannot listen'
  - 'asks the default port, passed as a held scratch port, whether an oculus answers there when no local.yml names a port, and starts no second server'

Also written, outside G47 and G48: `tests/state/workbench/drag-outside.client.test.ts` ('hands the host the screen point as plain data', 'becomes a window at that point when no other window takes it', 'is left where it is when another window takes it') and `tests/ui/controls/text/text-menu.test.ts` (7 tests: the word at a caret at the start, the end, punctuation, apostrophes, spaces, the touched letter, and the suggestion items). Each is a behaviour the change adds, so each was run on the unchanged tree and failed there (rows above).

## Edits to existing assertions and allow lists (`spec.md:59`)

| File | Line | Before | After |
| --- | --- | --- | --- |
| `tests/checks/config/config-folder.test.ts` | 227 | `CATALOG_FILES` without `desktop.yml` | `'desktop.yml',` added after line 226 (the catalog gained one file) |
| `tests/checks/tree/boundaries.test.ts` | 340 | doc comment ends `... programs \`selectors\` reads.` | comment extended by the sentence on the panes, tab menu and windows asking the host through `desktop` |
| `tests/checks/tree/boundaries.test.ts` | 357 | `'selectors'` | `'selectors',` then `'desktop'` in `SHELL_STORES` |
| `tests/state/workbench/layout/saved/layout-saved.test.ts` | 8 | `import { PAGES_VERSION, parseLayout } from '.../layout/index.ts'` | `PAGES_VERSION` from `layout/index.ts`, `parseLayout` from `layout/saved/saved.ts`; no assertion edited |

No threshold, tolerance or predicate was loosened.

History-word grep over the comment lines and test titles this step added or changed (`before`, `used to`, `no longer`, `still`, `always has been`, `always had`, `as before`, `previously`, `the step adds`, `after this package lands`): 28 hits, each judged. 14 are in lines the base already held (`layout.svelte.ts:136, 143`, `load.ts:100, 106, 107`, `pages.ts:3, 38, 120`, moved code or unchanged wording). The other 14 name an order inside the code, not an earlier state of the code: `app.ts:268` ("before it listened"), `window-options.ts:34` ("before the page paints"), `window-file.ts:3`, `build.ts:2`, `pick.ts:5`, `bridge.ts:5`, `window-state.ts:2`, `TextBoxMenu.svelte:7`, `float-geometry.ts:22`, `layout.svelte.ts:118` ("draws nothing before"), `storage.ts:205`, `routes/find/+page.ts:7`, `window-guard.test.ts:1` ("before it lets a window do anything"), `server/process.ts:40`, `windows.ts:22` and `:28`, and `layout.svelte.ts:149-150` ("the page that was on screen before the one on screen now ... still in the list" states a held value). One hit describes the saved data's format, not the code's history: `load.ts:26` ("an envelope written before floats"), the same wording as `pages.ts:3` and `load.ts:100` in the base, naming the version of the saved envelope that holds no floats.

## Judgment calls the brief left open

- The bridge type lives at `src/lib/state/shared/stores/desktop.ts`, so the shell-stores rule of `boundaries.test.ts` covers it (the two-line test edit above).
- `open/floats.ts` is `open/float/pages.ts` (pure operations) and `open/float/store.ts` (the store's operations); `saved/load.ts` takes the load out of `layout.svelte.ts` so that file passes under 880.
- A popped-out window's client closes no ended terminal (`upkeep: false`): the main window's page does, once (case 36).
- The slow login shell's dialog offers Continue and Quit (`desktop.dialog.continue`); the app goes on under the inherited environment while it is up (case 28).
- `GET /api/health` is admitted with no `Origin` or `Sec-Fetch-Site` header (`HEADERLESS` in `src/hooks.server.ts`), since the host asks it with Node's fetch.
- The default port is passed to the server as `--default-port` (`port.ts`), so a refused listen asks the port the server tried.
- Quit stops the server utility process and exits the main; every tmux session stays (case 16).

## Host- and user-visible changes (before and after)

| View or window | State to put it in | Before | After |
| --- | --- | --- | --- |
| Chrome, any page | open oculus in Chrome | the Svelte logo as favicon | the oculus icon; nothing else differs (no app item, key row or suggestion without the bridge) |
| `npm run app` | a scratch engine | no app | one dark window (`#181818`) on the server's page; the server is a utility process; a second start brings the first forward and exits |
| `npm run app:package` | any | no package | `oculus.app` (`local.research.oculus`, ad hoc signed) that imports the checkout's main |
| Any pane's menu | in the app | no window item | Move into New Window; a tab's menu adds Copy into New Window (not for a Terminal tab) |
| A popped-out window | after Move into New Window | none | the pane alone, no rail or status bar; Restore into Main Window, Return to Page, Dock Left/Right/Bottom, Switch to Main Window; closing it returns its tabs as a free float, asking nothing |
| Text box right-click | misspelt word, in the app | Undo, Redo, Paste, Select All | the suggestions at the top; a pick replaces the word |
| Cmd+F in a page | in the app | none | a find bar over the window's top right with the count; in a source tab, Monaco's find |
| The folder panel | Add Folder to Workspace, in the app | the server's own panel (JXA) | Electron's sheet on the window; Cancel adds nothing; a second press says busy |
| A port conflict | start the app on a held port | none | a dialog naming the port; an oculus there gets Open a Window and Quit |
| The application menu | in the app | Electron's default | the menu printed in case 21 |
| A source tab | scrolled, then reloaded, copied or moved into a window (in the app or in Chrome) | opened at the top | opens at the first line it showed, saved in the tab's state once the scroll has rested |
| A tab released over another window | in the app, over that window's title bar or border | nothing moved, no window | a window of its own at the point; over its content the target window takes the tab and says so |
| A server that ended | in the app, Restart pressed | n/a | the windows keep their pages, reconnect and take the new write token; a window on another port loads from the new one |

## Anything in the brief that was wrong or impossible

- The ASCII gate's `bin` path does not exist (printed above); case 37's "no line changed" is wrong for `config-folder.test.ts`; the cases ruling's seven items (above).
- A real folder sheet, a Cmd+Q, edit keys and typing into an editor need the OS to focus the window, which the coordinator rule forbids; cases 14, 17 and 41 were run in repair rounds 1 and 2 with the editor's text set over the debugging port, case 21 in part (the terminal's Cmd+A, Cmd+C, Cmd+X and Cmd+Z), and cases 20 and 39 are answered by a stub. `osascript` has no assistive access: `osascript is not allowed assistive access. (-1719)`.
- Case 1's "status bar says connected": the status bar has no such word, only the served address.
- Case 28's "dialog after 10 s": the shell's own limit is 10 s and the dialog appeared at 13 s with one-second polling.
- Case 12's scroll clause is met since repair round 1: the saved tab state carries the first line shown (Z592).
- Brief item 12's bridge listed `replaceMisspelling` and a main `spelling` message; the cases ruling dropped both.

## Standing-rule notes

One read-only `git status -- tools/oculus` ran by my own slip in this last pass (it printed nothing); no other git command was run, no commit made. The scratch folders `$S/o30-look` and `/tmp/o30t` are removed after this report; the case scripts and outputs under `$S/cases` stay. `pgrep -fl "o30-look"` is the last check of the report's run.

# Repair round 1

NOT done or not verified in round 1: the full-screen menu role (case 21), Monaco's edit keys (case 21), the terminal's Cmd+A, Cmd+C, Cmd+X and Cmd+Z (case 21), and a run of `tests/server/desktop/start.test.ts` (P3); every other item of `O30-round1.md` is done and its run or command is in the table.

## Open items for Axel

- Restart (superseded by round 2): the window reload of round 1 is gone; see "Repair round 2", item 2.
- The save answer of the bridge gains a refusal with `held: null` (`SaveAnswer` in `src/lib/state/shared/stores/desktop.ts:32`): the host did not answer or the arguments were invalid. A page that gets it writes nothing and records no refusal. This is a wire shape between the preload and the page; no other reader exists.

## Items

| Item | Status | Command or run that shows it |
| --- | --- | --- |
| P7 case 21, full screen | NOT verified | `Toggle Full Screen` role click from the main process: `isFullScreen` stayed false and no `enter-full-screen` event came within 3 s while the app was not the active application (r09) |
| P7 case 21, Monaco edit keys | NOT verified | the Monaco textarea of a source tab is `readOnly=true` without OS focus; Cmd+A selected nothing and Cmd+X, Cmd+V, Cmd+Z and Shift+Cmd+Z changed nothing (r11) |
| P7 case 21, terminal Cmd+A, Cmd+C, Cmd+X, Cmd+Z | NOT verified | one run (r26) found no terminal to type into (the Sessions page of the scratch HOME showed no Terminal tab, and the palette did not open from the harness's Cmd+K), so the keys went to the page body and are no evidence; Cmd+V in the terminal is shown (r12) |
| P3 run of `start.test.ts` | NOT verified | the test opens real windows and focuses one, which the no-focus rule forbids; `checks.sh` lists it as `changed, run by npm run test:checks or test:slow` and runs it in neither |
| S1 / case 12 | DONE | r25 on the final tree: the original reads line 6 (`{"n":"6","top":-16,"bottom":1}`, one pixel of line 6 shown); the Copy into New Window window `?float=2566df19-...` reads `{"n":"6","top":0,"bottom":17}`; the Move into New Window window `?float=8ebcb5ef-...` reads `{"n":"6","top":0,"bottom":17}`; the first line is equal on all three, and the two new windows start at the top of that line |
| B1 | DONE | r02: `local.yml` port 8817 to 8819 in the scratch Settings; all windows destroyed; the `File > New Window` item click and then `app.emit('activate')` opened `http://127.0.0.1:8819/` and `http://127.0.0.1:8819/?float=cd2e8c89-...`; `app.ts:224` is `forked.onListening((port) => (origin = ...))` |
| B2 | DONE | r04 over the preload: `saveLayout(123, null)` and `saveLayout('x', 7)` both returned `{"admitted":false,"held":null}`; `bridge.ts:29` `REFUSED`, `bridge.ts:102`; `preload.cjs:29` |
| B3 | DONE | `CONFIRM_MS` and its `setTimeout` are gone from `saved/storage.ts`; `own` (:144) and `putBack` (:265) re-append an own write that no `storage` event delivered, driven by the `storage` event on `oculus.layout.writes.v1`, not a time; case 35 (r03) shows both writes of the same second in the record (`splitInstance` by `l0vawh`, `closeInstance` by `uqxwp3`); `npx vitest run tests/state/workbench/layout/saved` passes |
| P6 / case 35 | DONE | cause: `workbench.ts:61` makes splitting a pane away from its only tab a no-op, and the earlier run split `Focus`, alone in its pane; r03 split `Repositories` (one of three tabs) while `Usage` closed in the popped-out window within one second: main after `[["Files","Search"],[],["Repositories"]]`, window after `[["Live HPC"],[]]`, saved arrangement holds panes `focus`, `files,search`, `repositories`, `source` |
| S4 | DONE | `node` over `parseAppArgs` (`$S/cases/s4.out`): `["--lang=nl"]`, `["--remote-debugging-port=9333","--enable-logging"]` and `["--engine=/tmp/x","--foo"]` give an engine and no error; `["file.txt"]`, `["-x"]`, `["--"]`, `["--engine"]`, `["--engine","--foo"]`, `["--default-port","9"]` and `["--default-port=9"]` give `unknown argument` or the `--engine needs...` sentence. G48 does not read the list, so no assertion changed |
| S2 | DONE | `--default-port` stays; HELP.md:353 and README.md:11 name `--engine <dir>` and `--default-port <port>` with one clause each (`grep -n "default-port" HELP.md README.md`) |
| S3 | DONE | HELP.md:68 `| Cmd+R | reload the window (in the app) |`; `config/text/desktop.yml:26` carries the row too |
| P2 | DONE | deleted: all of `tests/ui/controls/text/text-menu.test.ts` (7 tests, listed in the first report), all of `tests/state/workbench/drag-outside.client.test.ts` (3 tests: 'hands the host the screen point as plain data', 'becomes a window at that point when no other window takes it', 'is left where it is when another window takes it'), and 'starts a page in the app on the dark theme, keeps a saved choice and leaves a browser tab its own start' in `window-guard.test.ts` (G47 keeps its four named tests) |
| P3 | DONE (code) | `start.test.ts` waits on the child's output stream events and its `exit` and `close` events only; no `wait()`, `alive()` or polling remains; the Quit row reads the exit code after `exit`; the `slow` tag stays (`:10`) |
| P1 | DONE | `app.ts:233-235` (a restarted listen reloads every window and opens a main only when none is open). r19 on the final tree: the server killed with `kill -9`, the stub pressed Restart (dialog: `The oculus server ended (exit code 9): ...`), new server pid 37201; main windows 1 before and 1 after, all windows 4 before and 4 after; the main page's `performance.timeOrigin` moved from 1791242036051 to 1791242133416 (it reloaded) and New Terminal then started `21cba6-shell` with no 403 |
| P5 / case 2 | DONE | cause: the scratch hub had no project, so the Terminal view said "No folder to start the terminal in" and started nothing; `hubRoot()` (`selectors.svelte.ts:237`) is the first project folder. Not a defect in this step. r21 on the packaged `oculus.app` (bundle `local.research.oculus`) with `hub/projects/active/demo/project.yml` present: New Terminal added the tmux session `oculus-d99014-shell`; the server utility process held `TMUX_TMPDIR=/tmp/o30t` |
| P7 case 14 | DONE | r06/r07: unsaved text set through the Monaco model over the debugging port (`dirty.js`); closing the Terminal window and the long.ts window with `win.close()` brought the tabs back into main as free floats, `UNSAVEDTEXT` kept and the tab marked; the tmux session ran `sleep 600`; `dialogs.log` stayed at 1 line |
| P7 case 41 | DONE | r08: Cmd+W on the last tab of a popped-out window with unsaved text asked "Close this tab and lose its unsaved changes?" (Cancel, Confirm); after Confirm the window closed and the saved floats were `[["hpc:"],["terminal:"]]` |
| P7 case 17 | DONE | r14 to r16, r24: `UNSAVEDTEXT` set, quit, started again: the long.ts tab read `UNSAVEDTEXT const line` with `aria-label` `long.ts, unsaved` (r24, packaged app) and the stub app's restart (r16) |
| P7 case 21, DevTools and text keys | DONE | r09: the Toggle Developer Tools role click gave `isDevToolsOpened` true, then false; r10 in a text field: Cmd+A, Cmd+C (clipboard `hello world`), Cmd+X (value empty), Cmd+V (restored), Cmd+Z (empty) and Shift+Cmd+Z (restored) with editing commands; r12 Cmd+V in the terminal put `hello world` into the tmux pane |
| P7 case 16 | DONE | r14/r15 and r22/r23: with `sleep 900` running in the terminal's tmux session, `app.quit()` ended the main in 3 s, `lsof -iTCP:8819` printed nothing, the utility server was gone, the tmux session stayed with `sleep`; started again on the same HOME, the Terminal tab drew the terminal with `sleep 900` (`hu b % sl ee p 90 0`); the `Quit oculus` menu item clicked with `item.click(undefined, win, contents)` did nothing in the scratch app, so the quit is `app.quit()` |
| P7 case 27 | DONE | r13: windows set apart with `setBounds` (main 20,100,700x700; popped-out 800,100,500x500); dragging `Search` into the popped-out window left it in the popped-out window (`[["Live HPC","Search"],[],[]]`), `focus.log` shows `window.show id 10`; one earlier drag in the same state left `Search` in main and I did not settle why (not verified as repeatable) |
| P7 case 9 | DONE | `--engine /tmp/o30t/noconfig` through the stub (press file): dialog `oculus did not start: /tmp/o30t/noconfig holds no config/ folder, so there is nothing to serve` with button `Quit`, press 0; the app exited with code 1 and `ps` showed no utility server |
| P7 cases 20 and 39 | left to the look | the real folder sheet |
| P4 | DONE | tables below |
| S5 | DONE | reasons below |
| St1 | DONE | `layout.svelte.ts:90` the doc comment sits on `GONE`; `MAX_TURNS` keeps its own |
| St2 | DONE | `decide/window-file.ts:4` names `src/desktop/windows/window-state.ts` |
| St3 | DONE | `port.ts:4-5` says what a start without the flag does |
| St4 | DONE | `preload.cjs` head comment wrapped under 100 columns (`awk 'length>100' src/desktop/preload.cjs` prints nothing) |
| St5 | DONE | `utils/diagrams/graphs.mjs` two comment paragraphs wrapped at 97 columns |
| St6 | DONE | `menu.ts` `label: t('desktop.menu.app')`; `config/text/desktop.yml` `menu.app: oculus` |
| St7 | DONE | `app.ts:19` imports `LISTEN_HOST` and `app.ts:24` imports `ZOOM_LEAST, ZOOM_MOST` (exported from `decide/window-file.ts:18`); `health.ts:6` imports `LISTEN_HOST` |
| St8 | DONE | `src/lib/state/shared/install.ts` `installPageConfig`, called by `routes/+page.ts` and `routes/find/+page.ts` |
| St9 | DONE, with a disclosure | no git command was run for the work in round 1 except one `git -C . rev-parse` run by my own slip, which printed one line and changed nothing; `checks.sh` runs git itself in `tests/tiers/quick.mjs` (the `113 changed file(s), from git since HEAD` line) |

## Edits made for the verify list

- `Editor.svelte` (`src/lib/ui/controls/editor/`) is 519 lines (limit 520): the first-line follower is `followFirstLine` and `lineAtTop` in `commands.ts` (96 lines), which the component calls from `build` and from the model effect.
- `installPageConfig` sits at `src/lib/state/shared/install.ts` because `shared/words/` would hold 11 items (`sh utils/folder-check.sh` exits 0 now).
- `src/desktop/app.ts:235` tests `origin !== null` before `openMain`, which `svelte-check` required.
- `Source.svelte` is 531 lines against 528 at the base copy (and 520 on today's main): the three added lines pass `draft.first` and `setSourceFirst` to the editor; the file was already over 520 at the base, and bringing it under belongs to the work that splits it on main.

## Runs

- Starts of the app in round 1: seven (the stub app of the first lifetime, the case 9 start, two stub lifetimes of cases 16, 17 and 12, two starts of the packaged `oculus.app` for cases 2, 16 and 17, one stub start for case 21's terminal keys), each on the scratch HOME `$S/o30-look/home`, each closed by its pid with `app.quit()`; `pgrep` showed no process, no listener on 8817, 8819, 9333 or 9229, and the clipboard at 0 bytes afterwards. No focus call was made; `focus.log` holds only the app's own `window.show` calls.
- Tests run: `npx vitest run tests/server/desktop/window-guard.test.ts tests/state/sessions/source.test.ts tests/state/workbench/layout/saved` (4 files, 10 tests passed); `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/tree/boundaries.test.ts --testTimeout 0 --hookTimeout 0` (`Test Files  2 passed (2)`, `Tests  31 passed (31)`).
- `checks.sh` (once, after the last code change): `ok svelte-kit sync (2.6 s)`, `ok ASCII gate (2.8 s)`, `ok prettier (3.1 s): All matched files use Prettier code style!`, `ok vitest (23.4 s): Duration  18.87s`, `ok svelte-check (25.2 s): ... COMPLETED 377 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok eslint (30.7 s)`, `test:quick: 33.1 s (limit 45.0 s); every command passed`, `checks: 1 commands passed`. Not covered by it: `start.test.ts`, the slow tests, the build, lint of unchanged files.
- `sh utils/folder-check.sh` exits 0 with no output. `node --check src/desktop/preload.cjs` exits 0. The ASCII gate's `perl` line over `src tests config` prints nothing (`bin` does not exist in the tree); `LC_ALL=C grep -n '[^ -~]' HELP.md README.md DESIGN.md` prints nothing.
- `sh utils/unused-exports.sh` against the base list: `engineDir`, `DEFAULT_PORT` (config.ts, config/local.ts) left the list because `src/desktop/` now imports them; three entries are new: `src/lib/server/root/process/parent.ts: parentOf, askParentToPick` and the type `ParentPort`, which `src/server.ts:16` imports; knip's production run does not read `src/server.ts` as an entry (the base list holds `engineDir` and `DEFAULT_PORT` for the same reason), so nothing was removed.
- `wc -l`: `layout.svelte.ts` 830, `saved/load.ts` 132, `saved/storage.ts` 306, `app.ts` 317, `bridge.ts` 171, `source.svelte.ts` 505, `start.test.ts` 289; `Editor.svelte` 519; `Source.svelte` 531 as above; `Palette.svelte` 523 and `Graph.svelte` 524 are not changed by this step.

## Tests

- Deleted: `tests/ui/controls/text/text-menu.test.ts` (7 tests), `tests/state/workbench/drag-outside.client.test.ts` (3 tests), and in `tests/server/desktop/window-guard.test.ts` the test 'starts a page in the app on the dark theme, keeps a saved choice and leaves a browser tab its own start' with the three imports only it used (`WINDOW_BACKGROUND`, `setAppearance`, `themeFor`).
- Changed: `tests/server/desktop/start.test.ts` (signal-only waits, as in P3) and `window-guard.test.ts` (the removal above, with its head comment shortened). No test was added.
- Edits to existing assertions: none beyond those removals and the `start.test.ts` rewrite of how the child is awaited; no threshold, tolerance or predicate was loosened.

## P4, the paragraphs of the brief's line 71 (line numbers are this worktree's)

| File and line | Mark | What |
| --- | --- | --- |
| HELP.md:3 | rewritten | names the window of the app beside the browser tab |
| HELP.md:11-17 | rewritten | :13 is new (browser tab or app, what the app adds, Restart on a server that ended); the rail paragraph :15 and the tooltip paragraph :17 are still true |
| HELP.md:42 (Float) | rewritten | Move into New Window in a float's menus |
| HELP.md:45 (pane menu) | rewritten | Move into New Window while the pane shows a tab |
| HELP.md:46 (right-click menus) | rewritten | Move into and Copy into New Window; the app's spelling suggestions; the sentence that the browser's own menu stays inside a text box, the code editor and the terminal is still true in a browser tab |
| HELP.md:58-104 (keys table) | rewritten | rows added for Ctrl+Tab, Cmd+W, Cmd+N, Cmd+Shift+N and Cmd+Shift+W, Cmd+, , Cmd+R (:63-68) and Cmd+F (:103); every other row is still true |
| HELP.md:166 (`pages`) | rewritten | the windows of the app share the arrangement |
| HELP.md:323 (diagrams) | rewritten | the desktop box |
| HELP.md:353-355 (built server) | rewritten | both server arguments, and The app paragraph |
| DESIGN.md:71 | still true | the `server.ts` listing line |
| DESIGN.md:72 | rewritten | the `desktop/` line is new |
| DESIGN.md:152 (Auth) | rewritten | adds `/api/health` for the host |
| DESIGN.md:218 (floats) | rewritten | windows beside floats |
| DESIGN.md:379-380 (pages and floats saved) | rewritten | the layout-write record and the floats that become windows |
| DESIGN.md:396 (environment) | rewritten | the app hands the server the login shell's environment |
| DESIGN.md:409 (Tab, Ctrl bracket) | rewritten | Ctrl+Tab in the app |
| DESIGN.md:436 (native window) | rewritten | the "Still undecided" section is gone and the decision is in the decisions list |
| DESIGN.md:249-341 (apps) | still true | unchanged by this step, as the brief says |
| README.md:7 | still true | `npm run dev` |
| README.md:9 | rewritten | new paragraph on the native app |
| README.md:11 | rewritten | two server arguments |
| README.md:15 (dependencies) | rewritten | adds `shell-env`, `electron` and `@electron/packager` |

## S5, why each new `process/` module exists

- `parent.ts`: the one place the message shapes between the server process and the host, the readers of raw values, the channel over a utility process's parent port and the health body are written, so `src/server.ts` and `src/desktop/server/process.ts`, `health.ts` and `windows/pick.ts` spell a message once; it is under `lib/server/root/process/` because the built server imports it and the host reaches the same folder.
- `port.ts`: `readLocalWithDefault` is the reader of `local.yml` that takes the host's default port while the file is missing, which `src/server.ts` uses when started with `--default-port`; it sits apart from `args.ts` (which only parses) because it reads the file system.
- `words.ts`: `wordsOf` is the catalog reader for a process that speaks outside a request (the lines the server prints at start and the host's dialogs and menus), shared by `src/server.ts`, `app.ts`, `menu.ts` and `pick.ts`; it reads the config once on the first line asked for.

# Repair round 2

NOT DONE first: item 2's typed line in an open terminal after a Restart is not shown (the line pasted into the open terminal after the Restart did not appear in its tmux pane; cause not determined; no second start was allowed, so it was not re-run); item 7's run (B-b, `followFirstLine`) and item 10's reopen at the saved first line in the app and in Chrome were not run, because the one allowed start opened no editor and no Chrome page was opened; items 9's Cmd+X and Cmd+Z left the pane and the clipboard as they were and are reported as observed, not as a pass or a fail.

| Item | State | Evidence |
|---|---|---|
| 2, typed line in an open terminal after Restart | NOT DONE | run r27: `pane:  words\|kept words\|axelfaes@YQ530VVFGK hub %\|` after pasting `echo after-restart` with Cmd+V; no `after-restart` line |
| 7, B-b `followFirstLine` rests before it reports | code DONE, run NOT DONE | `src/lib/ui/controls/editor/commands.ts:68` `SCROLL_REST_MS = 200` and `followFirstLine` with a trailing timer (`:75-90`); `Editor.svelte` 519 lines; no editor opened in the run |
| 10, S1's reopen at the saved first line, app and Chrome | rows written, run NOT DONE | before/after table above, the row "A source tab"; no run |
| 1, G48 `start.test.ts` shows nothing and takes no focus | DONE | `npx vitest run tests/server/desktop/start.test.ts`: `Tests 5 passed (5)`, `Duration 225.26s`; the recorder printed, in order: `none`, `[screen] window.show \| [screen] window.show \| [screen] window.focus`, `[screen] dialog`, `none`, `[screen] dialog`; every `show`, `focus` and `dialog` was recorded and none reached the screen, so no window appeared and no focus moved |
| 2, Restart without reload | DONE except the typed line | `src/desktop/app.ts:239` `windows.moveTo(origin)` and no `reload`; run r27: `timeOrigin before: main 1791245532098, popped-out 1791245549118`, after the Restart `main 1791245532098, popped-out 1791245549118`, main windows 1 and all windows 3 before and after; server pid 40357 killed with `kill -9`, new pid 45575; New Terminal after the Restart: `sessions: oculus-44e39f-shell oculus-7d3624-shell oculus-usage-claude`; the stub dialog answered Restart |
| 2, 403 retry and socket token | DONE by code | `writes.svelte.ts:159` `renewToken`, `:183` and `:523` retry once; `pty-io.ts:120-141` `postTerminal` retries once; `socket.svelte.ts:224` renews on reconnect before the subscription |
| 2, HELP.md:13 says what a Restart keeps | DONE | `grep -n` finds the sentence at `HELP.md:13` |
| 3, S-a `followed(origin)` | DONE by code | `windows.ts:57-58` `WindowsDeps.followed`, `:142` called for a main entry; `app.ts:123` sets `origin` when the app started no server; not run |
| 4, P-a | DONE | `window-file.ts` head rewrapped (`awk 'length>100'` prints nothing); `installPageConfig` in `src/lib/state/shared/page/install.ts` and `'state/shared/page'` in `tests/checks/imports/order.ts:102` above `words`; `npx vitest run tests/checks --testTimeout 0 --hookTimeout 0`: `Test Files 16 passed (16)`, `Tests 229 passed (229)` |
| 5, St-a | DONE | `wc -l src/lib/views/sources/source/Source.svelte` 509; the locked-source concern is `save/LockedCode.svelte` and `save/locked-words.ts`, imported at `Source.svelte:99-100` and used at `:179` and `:442`; no `.svelte` file over 520 lines is one this step changed |
| 6, B-a drop answer and bounds | DONE | `bridge.ts:142` `getContentBounds()`, `:84` waiting requests, `:166` `DROP_TAKEN`; `desktop-windows.svelte.ts:31` answers with `drag.receive(...)`; run r27 case 27: main `[["Files","Repositories","Search"]...]` and popped-out `[["Live HPC","Usage"]...]` before; after the drop at (980,350) main `[["Files","Repositories"]...]` and popped-out `[["Live HPC","Usage","Search"]...]`, no new window; a release over the title bar at (980,282) opened window 3 at 912,382 and removed Repositories from main |
| 8, St-c | DONE | `HELP.md:353` carries the login-shell clause |
| 9, P-c `wordAt` | DONE | run r27 and r29, caret in text box: `recieve, wrng` at 7 gave `receive, relieve, Undo, Redo, Paste, Select All`; `dosn't wrng` at 3 gave `don't, doesn't, dons't, dosa't, dosh't, Undo, Redo, Paste, Select All`; `recieve  wrng` at 8 (a space) gave `Undo, Redo, Paste, Select All` |
| 9, P-d case 21 terminal keys | partly observed | run r27: Cmd+A left the page selection empty and the terminal's own selection active; Cmd+C put the terminal text on the clipboard (`/Users/axelfaes/.zshenv:.:1: no suc\|h file or directory: ...`); Cmd+X and Cmd+Z left the pane and the clipboard unchanged |

The runs: one start of the app on the scratch HOME (engine port 8819, tmux socket `/tmp/o30t/tmux-502/default`), driven by the scratchpad scripts `cases/r27.sh`, `cases/r28.sh` and `cases/r29.sh` in the same start; the app was ended with `app.quit()` and `ps -p` showed it gone, the tmux server was killed, the clipboard emptied (`pbpaste | wc -c` 0), and `lsof` showed no listener on 8819, 9333 or 9229. The recorder of the stub app logged only the app's own `window.show` calls (windows 1, 2 and 3 at their creation); nothing in the run called `focus`, `bringToFront` or `osascript`. The harness found no text box in two lines of r27 because the menu close of the previous case had left the Search view; r28 and r29 ran the same two cases in that same start after the page was back on a text box, and the first outcome of each is the one quoted. No Chrome page was opened.

Tests changed: `tests/server/desktop/start.test.ts`, all five rows (`brings the running app forward on a second start and starts no server`, `starts no server when another program holds the port, and names the port`, `stops the server process on Quit and leaves every tmux session running`, `prints the port in use and exits 1 when the server cannot listen`, `asks the default port, passed as a held scratch port, whether an oculus answers there when no local.yml names a port, and starts no second server`) through the shared `app()`, `run()` and `stop()` helpers: windows stay unshown, `stop` waits on `exit` and falls back to the pids, the Quit row reads the server pid before Quit and asserts `process.kill(pid, 0)` throws `ESRCH` after `exit`, and the `slow` tag is kept. `tests/server/desktop/app-harness.ts` (not a test file) installs the recorders. No other test was added or changed; `tests/checks/imports/order.ts` gained the `state/shared/page` entry in its registry.

Verify lines:
- `bash ~/.claude-work/skills/land/templates/checks.sh .../orchestrator-state.md`: `exit 0`; `ok ASCII gate`, `ok prettier`, `ok svelte-kit sync`, `ok eslint`, `ok svelte-check (... 378 FILES 0 ERRORS 0 WARNINGS ...)`, `ok vitest ... Duration 23.53s`, `test:quick: 28.1 s (limit 45.0 s); every command passed`, `checks: 1 commands passed`. It does not cover the tests outside its selection, tests/checks, slow tests or the build.
- `npx vitest run tests/checks --testTimeout 0 --hookTimeout 0` (the `test:checks` flags): `16 passed`, `229 passed`, run after the last change. The same command with the default 5 s timeout failed five order checks by timeout while a background agent was running; with no time limit, as `test:checks` runs them, they pass.
- `sh utils/folder-check.sh`: exit 0. `node --check src/desktop/preload.cjs`: exit 0. The ASCII `perl` gate over `src tests config` and `grep` over HELP.md, README.md, DESIGN.md: no hit.
- `sh utils/unused-exports.sh` against `O30-base/unused-exports.txt`: 256 against 255; `engineDir` and `DEFAULT_PORT` left the list, and `parentOf`, `askParentToPick` and `ParentPort` of `src/lib/server/root/process/parent.ts` stay, as in round 1 (`src/server.ts` imports them and is not a knip entry).
- Git: I ran no git command in round 2; the only git reads are those `checks.sh` runs itself (`test:quick: 123 changed file(s), from git since HEAD`).

Open items for Axel from round 2:
- A Restart keeps every window and its page and renews the write token in place (user-visible, `src/desktop/app.ts:239`, `HELP.md:13`); it replaces round 1's reload.
- The typed line after a Restart is the unresolved defect to look at first; the rows above give the pane that was read.
- Wire shapes added: the `DROP_TAKEN` channel and `answerDrop` on the preload bridge (`channels.ts`, `preload.cjs`, `stores/desktop.ts`), `renewToken` on the writes store (`shapes.ts`), `Windows.moveTo` and `WindowsDeps.followed` (`windows.ts`), the 200 ms scroll-rest timer of `followFirstLine`, and the recorder harness `tests/server/desktop/app-harness.ts`.
