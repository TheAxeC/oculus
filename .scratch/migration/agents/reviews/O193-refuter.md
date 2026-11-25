# Refuter report: O193

Review of O193, worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O193, base b4c4dd9d9. I changed nothing.

## Verification lines

Every command below was run from the worktree root after the builder's last change.

1. `npx prettier --check package.json tests/checks/tree/size.test.ts utils/shots`
   ```
   Checking formatting...
   All matched files use Prettier code style!
   exit 0
   ```
2. `npx eslint tests/checks/tree/size.test.ts` printed nothing, exit 0.
3. `for f in utils/shots/*.mjs; do node --check "$f" || echo "FAIL $f"; done` printed nothing, exit 0.
4. The ASCII gate over `README.md package.json tests/checks/tree/size.test.ts utils/tree/* utils/shots/*` printed nothing, exit 0.
5. The tree checks printed nothing and exited 0:
   ```
   size exit 0
   folder exit 0
   ```
6. `taskpolicy -b nice -n 19 npx vitest run tests/checks/tree/size.test.ts tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts --testTimeout 0 --maxWorkers 2`
   ```
   Test Files  3 passed (3)
        Tests  18 passed (18)
   ```
7. `npm run check`
   ```
   1795645835676 COMPLETED 4689 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ```
8. `node -e "JSON.parse(...package.json...)"` exited 0.
9. `sh utils/unused-exports.sh 2>&1 | diff - /Users/axelfaes/workspace/oculus/.agents/worktrees/O193-unused-base.txt` gave `diff exit 0`.
10. `grep -rn "utils/size-allow\|utils/folder-check\|utils/size-check" src tests utils config docs README.md package.json --exclude=local.yml` printed nothing, exit 1.

Other checks I ran:
- `grep -n "^const LINES\|^const COMPONENT" tests/checks/tree/size.test.ts` gives `30:const LINES = 900;` and `31:const COMPONENT = 540;`. This matches the report.
- The dictated manuscript: a `diff` of the brief's tex block against `utils/shots/hub.mjs:33-48` printed `SAME`.
  - The runtime value with the sentence added ends `...within two samples of their onset.$` / `Its false alarm rate stays below one per thousand samples.$` / `\end{document}$`.
- The five `.ts` modules the capture imports all load under Node v24.21.0 (the Node that Electron 44.5.1 embeds), each printing `ok`: `program.ts`, `health.ts`, `mover.ts`, `config.ts`, `words.ts`.
- `wordsOf` over the tree gives `views.repositories => "Repositories"`, `views.problems => "Problems"`, `files.row_open_tab => "open in a new tab"` and `latex.bar_view => "View"`. The rail labels are `[ 'Projects', 'Explorer' ]`.
- `git status --short -- tests/fixtures` printed nothing.
- `git show b4c4dd9d9:package.json | grep -c docs:shots` printed 0.
- The moved files diffed against `git show b4c4dd9d9:utils/<f>` differ only in:
  - the `cd` line of both scripts;
  - the `allow=` path in `size-check.sh`;
  - the head comment of `size-check.sh`.

## Verdicts: items

- **1, the move: holds.**
  - `ls -la utils` lists 9 items, `shots` and `tree` among them.
  - Each script's `cd "$(dirname "$0")/../.."` is in place, and `allow=utils/tree/size-allow.txt` is set.
  - `size.test.ts` follows at every site.
  - `size-allow.txt` is byte-identical to the base.
- **2, the capture command: holds, except 2.9 (see below).**
  - `package.json:25` reads `"docs:shots": "electron utils/shots/shots.mjs"`.
  - All six files open with `Layer 4, tool.` and are 84 to 277 lines long.
  - The entry's head comment names its needs and how to take the shots again.
  - The top level is `await main()`. `main` awaits only `firstLack()`, and the work is chained on `app.whenReady()` (`shots.mjs:256, 259-269`).
- **2.1: holds, with a disclosed departure.**
  - `freshFolder`, `setPath('userData')`, the scale switch and `app.dock?.hide()` come first (`shots.mjs:144-147`), then `firstLack()` (`:253`).
  - The userData folder is made before the needs check, because `setPath` throws on a missing folder. The lack path removes it (`finish(1)` leads to `removeFolders`).
  - The lack sentences are at `shots.mjs:57-70, 81, 98`.
- **2.2: holds.** `mustRun('npm', ['run','build'], ...)` with the refusal sentence and the build's output (`shots.mjs:218-223`).
- **2.3: holds.**
  - The scratch folder is under `/tmp`.
  - The copy is named `demo` and the fixture is only read (`cpSync`).
  - The folders are `home`, `tmux`, `tmp`, `bin` and `shots`.
  - The stand-ins are `'#!/bin/sh\nexit 255\n'`, each then `chmodSync` to `0o755` (`scratch.mjs:40-46, 99-108`).
- **2.4: holds, and the order is kept** (`hub.mjs:217-239`):
  1. `dropSlurm`, with a re-parse that refuses unless the result equals the keys without `slurm`.
  2. The manuscript, then `latexmk -norc -pdf`, then `latexmk -norc -c`, then the `main.pdf` check.
  3. The workspace file `shots.yml`.
  4. `git init -b main`, `add -A`, `commit -m "Demo hub"`, each with `GIT_CONFIG_NOSYSTEM`, the fixed dates and the `-c` identity and signing, and the scratch HOME through `scratchEnv`.
  5. The sentence, then `git status --porcelain`, which must equal ` M <TEX>\n`.
  6. `workspace.json`.
- **`primary: demo` is right.**
  - `readFolders` (`src/lib/server/files/workspace/folders.ts:200-214`) accepts `primary` naming a folder that is a hub.
  - The folder `path` must be absolute (`:177-180`), and the code writes `scratch.hub`, which is absolute.
  - `reads.ts:73` says a workspace with no primary reads nothing else.
  - The `workspace.json` shape matches `state.ts:26-31`.
- **2.5: holds.**
  - `freePort` binds port 0 on `LISTEN_HOST`.
  - The server is `node src/server.ts --default-port <port>` with `held.env`.
  - The wait polls the health route every 250 ms, ends on the server's exit, and is limited to 60 s with the output (`server.mjs:87-105`).
- **2.6: holds.** `show:false`, `paintWhenInitiallyHidden:true`, `useContentSize`, 1440 by 900, `enableLargerThanScreen`, `backgroundThrottling:false` (`page.mjs:249-257`). `grep -n "\.focus(\|\.show(\|showInactive\|app\.focus\|moveTop" utils/shots/*.mjs` prints nothing.
- **2.7: holds by reading.** Every selector resolves on this tree:
  - **The rail.** `nav[data-rail]` is at `ActivityRail.svelte:312`. Its buttons are compact ToolButtons with a glyph, so `aria-label` is the label (`ToolButton.svelte:52-54, 93`).
  - **The board.** `data-pane-view={shown?.view}` is at `PaneView.svelte:430`, and the board's view id is `projects`. Its cards carry `data-card={id}` through `RecordCard.svelte:320` and `Card.svelte:113`. The board starts in `mode: 'cards'` (`board/state.ts:177`).
  - **The Files rows.** Rows carry `data-value` = `treeKey(root, path)` = `demo:<path>` (`TreeView.svelte:208`, `place.ts:180`). `aria-expanded` sits on the treeitem. `button.main` is at `TreeItem.svelte:211-213`. A press on a folder toggles it (`pressing.ts:53`).
  - **No compacted folders.** `projects`, `active` and `streaming-anomaly` each hold more than one entry (checked with `ls -A`), so no row is compacted away.
  - **The open-tab control** is a compact ToolButton labelled `open in a new tab` (`FileRow.svelte:168-175`). It is in the DOM with `display:none`, and `.click()` still fires.
  - **The editor and the View control.** The view id is `source`. View is a bare ToolButton labelled `View`, drawn in that pane's strip (`LatexButtons.svelte:51-56`).
  - **The PDF.** `.oc-pdf` is at `viewer.svelte.ts:207`, and pdf.js draws `.textLayer` with `textLayerMode: 1`. `out_dir: "%DIR%"` (`behavior.yml:457`) puts `main.pdf` where latexmk leaves it.
  - **The tabs.** A tab is `button[role="tab"]` holding `span.label` (`TabFace.svelte:104-136`).
  - **The changes.** A change row is a TreeItem with a level, so its role is `treeitem` (`ChangeRow.svelte:157`).
  - Whether each state draws as intended is for the look.
- **2.8: holds.** Both captures are written in the scratch folder, then staged as `.<name>.part` in `docs/images`, then renamed (`shots.mjs:112-128`).
- **2.9: violated in one path** (finding B2). Otherwise it holds: `finish` stops the server, runs `tmux kill-server` under the scratch `TMUX_TMPDIR` with `TMUX` dropped, removes both folders and calls `app.exit`. The `exit` handler repeats this, and SIGINT and SIGTERM run `finish`.
- **The manuscript text and the sentence: hold**, word for word (`SAME`, above).
- **3, the README: holds.**
  - Image lines are at 11 and 25, each after the opening paragraph and before the bullets.
  - The sentence is at line 83, after the `app:release` paragraph.
  - Each addition is one line and passes the ASCII gate.
  - No other line changed (`git diff b4c4dd9d9 -- README.md`).
  - The alt text matches the layout: the Repositories tab is in the left pane, the editor and the PDF are above, Problems is below (`config/defaults/layout.yml:64-87`).

## Verdicts: cases

- **The full run (exit 0, two PNGs of 2880 by 1800): not verifiable here.** The look settles it.
- **`git status --short -- tests/fixtures` after the run: met by reading.** No path in `utils/shots` writes under the fixture. The look's run settles it.
- **No window, no focus change: met by reading.** Whether a Dock icon flashes before `dock.hide()` is for the look.
- **Nothing of the hub, sessions or git identity drawn: partial.** The three things named are met by reading: the scratch HOME, one folder, `GIT_*` dropped, and the fixed identity. However, the status bar draws the machine's host name (finding B1).
- **Nothing written outside the scratch folder and `docs/images`: partial.**
  - A failure inside `makeScratch` leaves the scratch folder behind (finding B2).
  - Writes by Electron, AppKit or the server outside the two folders cannot be settled by reading. A listing of `~/Library` and the checkout before and after the look's run would settle them.
- **The port: met.** A server that exits on `port_in_use` makes `answered()` refuse with its output.
- **latexmk, git or tmux not on PATH: met.** One sentence and exit 1. No scratch folder and no build. Only the userData folder exists, and it is removed.
- **`npm run build` fails: met.**
- **Server exit, or no answer within 60 s: met.**
- **A capture that throws after the server started: met.** `takeShots` destroys the window in its `finally`, nothing is placed, and `finish(1)` runs.
- **The stand-ins: met.**
- **The copy's config without `slurm`: met.**
- **A second run: met.** Older files of the same names are replaced, other files are left.
- **The tree checks and `size.test.ts` after the move: met** (my runs 5 and 6).
- **The README: met by reading.** Whether the images match the alt text is for the look.

## Spec

- **S1. The step's diff holds a change to `.scratch/migration/agents/briefs/O193.md`.** One added line naming the worktree and the base list.
  - `stat` gives `Nov 25 22:36:59`, 44 s after the checkout's files (`utils/cited-lines.mjs` at `22:36:15`) and before any step file (`utils/shots/shots.mjs` at `23:02:00`).
  - That is consistent with the orchestrator's dispatch, not the builder's work.
  - The landing should decide whether it rides with the step's commit.
- **S2. An unreported wording change.** `utils/tree/size-check.sh:9` changed "a file the tree no longer holds" to "a file the tree does not hold". The paragraph was rewrapped because of the path change, and spec.md's history-word rule asks for that change. But no item names it, and the report's file table says only that the head comment "names the new path and is rewrapped".

## Proof

- **P1. The "For the look" lines give a path the code does not print.** They say the command prints `Preparing the demo copy in /tmp/oculus-shots-XXXXXX/demo.`. But `freshFolder` returns `realpathSync(mkdtempSync(...))` (`scratch.mjs:71-73`), which on macOS is `/private/tmp/oculus-shots-XXXXXX`. The look should expect `/private/tmp/...`. The check `ls /tmp | grep oculus-shots` still holds.
- No other claim failed to reproduce. These all matched the report:
  - the nine items in `utils`;
  - the line counts (`wc -l`: README 125, package.json 133, size.test.ts 207);
  - LINES and COMPONENT at 30 and 31;
  - the unused-exports diff;
  - the Electron binary: the worktree's `node_modules/electron` has no `dist` or `path.txt`, and the main checkout's has both.

## Standards

- **T1. An empty capture ends in an unworded error** (`page.mjs:226-229`):
  ```js
  const png = (await win.webContents.capturePage()).toPNG();
  const taken = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  ```
  - When `capturePage()` returns an empty image (a hidden window that never painted), `toPNG()` is a zero-length Buffer.
  - `readUInt32BE(16)` then throws `ERR_OUT_OF_RANGE`, which reaches `tell()` as "The command stopped on an error it does not word: RangeError ...".
  - The head comment's sentence "a capture of any other size stops the command" with a size refusal is false for this case. Exit 1 and the clean-up still happen.
- **T2. A server that fails to spawn loses its reason** (`server.mjs:82-95`):
  ```js
  child.once('error', (error) => { output += `${error.message}\n`; });
  ...
  if (ended(child) || child.pid === undefined) {
      throw new Refusal('The server stopped before it answered; its output follows.', output);
  ```
  - `answered()` runs synchronously inside `startServer`, and `child.pid` is undefined on a failed spawn.
  - So the Refusal is built before the `'error'` event appends `spawn node ENOENT`, and the terminal gets the sentence with empty output.
  - Scenario: `node` is missing from the PATH Electron was started with.
- Comments: the history-word grep over the added comments found only words that order the run itself ("before Electron is ready", "still running"). None compares with an earlier state of the code.
- Non-ASCII: none. Files over the size limit: none (the largest is 277 lines). The comment-width check passed.

## Behaviour

- **B1. The host name of the capture machine is drawn on both screenshots.** These are committed to the public README.
  - `StatusBar.svelte:230-240` draws the `host` item first, with `label={status.host?.name ...}`.
  - `status.host` is `hostInfo(port)` = `{ name: hostname(), ... }` (`src/lib/server/root/context.ts:123-124, 266`).
  - `config/defaults/behavior.yml:1042-1043` reads `status_bar: hidden: []`, so the item shows by default.
  - The scratch HOME does not change `os.hostname()`. A macOS name of the form "Firstname-MacBook-Pro.local" would then appear on both PNGs.
  - This breaks the ruling's "so no real project, person, grant or session shows" (plan.md:1764).
  - Possible fix, which is a visible decision for the orchestrator: the workspace file's `settings:` hides `host` through `status_bar.hidden`. I did not check whether a workspace `settings:` layer may set `status_bar`.
- **B2. A failure inside `makeScratch` leaves the scratch folder in `/tmp`** (`shots.mjs:224` with `scratch.mjs:88-109`):
  ```js
  held.scratch = makeScratch(ROOT);
  ```
  - `makeScratch` makes the folder first (`freshFolder`), then the subfolders, the `cpSync` of the fixture and the stand-ins.
  - If any of those throws (disk full, a fixture file unreadable), `held.scratch` stays null. `removeFolders()` then removes only the userData folder.
  - `/tmp/oculus-shots-XXXXXX`, with the partial copy and a `home`, is left behind. This is against 2.9's "on every failure after the scratch folder was made ... removes the scratch folder".
  - Fix: `makeScratch` removes its own folder on a throw, or the entry records the folder before filling it.
- **B3. The page steps have unbounded waits** (`page.mjs:98-99`, `:226`, `:266`):
  ```js
  await document.fonts.ready;
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  ```
  - Only the find loop has the 60 s limit. The two awaits above, `win.loadURL(origin)` and `capturePage()` have none.
  - In a never-shown window where Chromium suspends frames, `requestAnimationFrame` never fires. That can happen on macOS when the display sleeps or the window is judged occluded.
  - Then `executeJavaScript` never settles and the command neither refuses nor exits. The server, the tmux server and Electron keep running until the user interrupts.
  - That is against 2.9's "leaves nothing running" and the brief's "a bounded poll" rule.
  - Fix: race each page step and the capture against the same limit and refuse with the step's name.
- These visible changes are stated in the report with before and after, and match the diff: the three README additions, the new command, and the moved files.

## Declined to judge

- **Whether Electron 44 behaves as the code assumes in a hidden window.** That is: emitting the process `exit` event after `app.exit`, painting and running rAF in a never-shown macOS window, `capturePage()` returning 2880 by 1800, and `app.dock.hide()` before ready leaving no Dock icon flash. Judging it needs running Electron, which the brief forbids. The look settles it.
- **Whether Chromium or AppKit write outside the two folders.** For example `~/Library/Saved Application State/com.github.Electron.savedState`, `~/Library/Preferences/com.github.Electron.plist` or the caches. Same reason. A before and after listing at the look settles it.
- **Whether the server writes into the hub copy or the engine folder during the run.** Such a write would add rows to Source Control (the porcelain check runs before the server starts) or touch the checkout. Same reason.
- **Whether the display check is reachable on Linux.** Electron without `DISPLAY` may abort before the main script runs. That needs a Linux run.
- **Whether killing npm on an interrupt also ends vite**, and whether a server killed after its 10 s grace leaves children (language servers, watchers). That needs a run.
- **Whether the Projects board and the Explorer show any error box or side panel on the demo copy.** The look settles it.
- **Who wrote the line in the brief.** `git log` is outside the three allowed git commands. I used `stat` only.

Usage: af103e2f15603e431, claude-opus-5-5, 268285 tokens, 110 tool uses, 1128 s.
