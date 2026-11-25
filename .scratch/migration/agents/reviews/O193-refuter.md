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

## Repair round 1, refuted

Review of O193 over repair round 1. Worktree: /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O193. Base: b4c4dd9d9. Snapshot: /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O193-round-1/. I changed nothing.

The round changed four files against the snapshot: `utils/shots/hub.mjs`, `utils/shots/page.mjs`, `utils/shots/scratch.mjs` and `utils/shots/server.mjs`. Every other path in `files.txt` is byte-identical to its snapshot copy. The three deleted paths are absent from both the snapshot and the tree. `git status --short` lists no changed path outside `files.txt` other than the ledger files under `.scratch/`.

The first refuter report is at /Users/axelfaes/workspace/oculus/.scratch/migration/agents/reviews/O193-refuter.md. It is in the main checkout's ledger, not the worktree's.

## Verification lines

Every command was run from the worktree root after the round's last change.

1. `npx prettier --check package.json tests/checks/tree/size.test.ts utils/shots`
   - `Checking formatting...`
   - `All matched files use Prettier code style!`
   - `exit=0`
2. `npx eslint tests/checks/tree/size.test.ts` printed nothing: `exit=0`.
3. `for f in utils/shots/*.mjs; do node --check "$f" || echo "FAIL $f"; done` printed nothing: `exit=0`.
4. The ASCII gate (`LC_ALL=C perl ...`) over `README.md package.json tests/checks/tree/size.test.ts utils/tree/* utils/shots/*` printed nothing: `exit=0`.
5. The two tree checks printed nothing:
   - `size exit=0`
   - `folder exit=0`
6. `taskpolicy -b nice -n 19 npx vitest run tests/checks/tree/size.test.ts tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts --testTimeout 0 --maxWorkers 2`
   - `Test Files  3 passed (3)`
   - `Tests  18 passed (18)`
7. `npm run check`: `1795647117081 COMPLETED 4689 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
8. `node -e "JSON.parse(...)"` on `package.json`: `exit=0`.
9. `sh utils/unused-exports.sh 2>&1 | diff - /Users/axelfaes/workspace/oculus/.agents/worktrees/O193-unused-base.txt`: `diff exit=0`.
10. `grep -rn "utils/size-allow\|utils/folder-check\|utils/size-check" src tests utils config docs README.md package.json --exclude=local.yml` printed nothing: `exit=1`.

Each line matches what the round's section quotes.

Other commands I reran from the round's section:
- `wc -l utils/shots/*.mjs` gives hub 253, page 305, programs 84, scratch 141, server 128, shots 272. This matches the round's table.
- `grep -n "<LanguageItems" src/lib/shell/status/SourceItems.svelte` gives `192:<LanguageItems {instance} {status} {shown} {onpalette} />`. This matches.
- The history-word grep over the round's added lines found one hit, server.mjs "before the first check reads it". It orders the run itself and does not compare with an earlier state, so it is fine.
- `awk 'length > 100'` over `utils/shots` finds only string literals: manuscript lines and refusal sentences. No comment line is over 100, and the comment-width test passed.

## Closures

- **B1: closed.** The ruled list is in place, the chain from the workspace file to `shown()` holds, and each hidden id is an id the bar uses.
  - `utils/shots/hub.mjs:81` defines `HIDDEN_ITEMS = ['host', 'usage', 'sessions', 'language_server', 'interpreter', 'linter']`.
  - `hub.mjs:237` writes `settings: { theme: 'light', status_bar: { hidden: HIDDEN_ITEMS } }`.
  - The file is read back deep-equal through `writeChecked`.

  The chain, read link by link:
  1. `openWorkspace` (`src/lib/server/files/workspace/open.ts:221-246`) reads `workspace.json`'s `open`.
  2. `configOptions` (`src/lib/server/files/workspace/paths.ts:73`) passes it on as `workspace: { file }`. The server's config load uses it at `context/config-parse.ts:55`.
  3. `merge.ts:270` calls `mergeWorkspace`.
  4. In `workspace-layer.ts`, `walk` (293-347) reaches `status_bar`. That path is neither an option nor a hub key: `grep status_bar src/lib/data/shapes/hub-keys.ts` finds nothing, and the options catalog has only `status_bar.hidden`, `.quiet` and `.repository`. Because it is a prefix of an option, `walk` descends into it.
  5. `options.get('status_bar.hidden')` is a `control: list` entry with no `fields` (`config/options/behavior.yml:1927-1931`). `familyKind` therefore gives `leaf`, and `appliedValue` goes on to `valueProblem`.
  6. `valueProblem` dispatches `case 'list'` to `listProblem` (`value-rule.ts:242-255`). That accepts a list of strings: no `items`, no `form`, no `slots`.
  7. `setAt(config, path, taken.value)` (line 351) lays the list over `hidden: []` (`config/defaults/behavior.yml:1042-1043`).
  8. On the page, `setAppearance` sets `look = readLook(config)` (`appearance.ts:398-410`), and `lookShape` maps `status_bar.hidden` to `statusHidden` (346-358).
  9. `ui.svelte.ts:391-392` gives `held('status_bar.hidden', configuredLook()?.statusHidden)`.
  10. In `StatusBar.svelte`, `hidden = $derived(statusHidden())` (102), `isHidden` is `hidden.includes(key)` (105-107) and `shown` is `!isHidden(item)` (138-140). The same `shown` goes to `RepoItems` as booleans (248-250), to `SourceItems` (344) and on to `LanguageItems` (SourceItems:192), and to `Bell` (381).

  All six hidden ids are in `LEFT_ITEMS` or `RIGHT_ITEMS` (`status-items.ts:39-69`).

  Every item kept, read in its markup:
  - **host:** hidden, so nothing is drawn.
  - **repository, branch:** `repo.name` and `main`. The root appears only in `data-repo` and the tooltip, which a capture does not draw.
  - **sync:** nothing is drawn. The copy has no upstream and no remote (see P-R1).
  - **problems, findings:** counts.
  - **debug:** not drawn, since no session has run.
  - **hpc:** `hpc.unconfigured`. The copy has no `slurm:`, and the engine default is `resource: []` (`config/defaults/behavior.yml:146-147`).
  - **server:** `socketWords`.
  - **latex:** the step words. The paths are in the tooltip only (`LatexItem.svelte` markup).
  - **caret, indent, encoding, line_ending, language:** words about the file.
  - **blame:** the fixed identity `oculus` with a relative date (see B-R2).
  - **compile_database, svelte_config:** not drawn for a `.tex` file.
  - **unsaved:** a count.
  - **bell:** a glyph and a count.
  - **AppItems:** none. `apps_dir` is `.oculus/apps` of the primary hub (`config/defaults/sources.yml:106`), and the copy holds no `.oculus/apps` (`ls -a tests/fixtures/hubs/demo/.oculus`: `config.yml`, `data`).

  No kept bar item draws the machine's name, the user's name or e-mail, an account, an agent's usage, a clock or a path outside the scratch folder. The copy holds no `.oculus/local.yml`, so the machine values (`self`, `accounts`) take their defaults.

  Other surfaces of the two states:
  - **The title bar strip** is drawn only when `client.desktop !== undefined` (`Workbench.svelte:180, 388`). The capture window has no preload (`page.mjs:274-282`), so the strip is not drawn. The window title is not part of `capturePage()`.
  - **The breadcrumbs** start at the root label (`tab-crumbs.ts:53-75`), which is `demo`.
  - **The Worktrees section** draws "no worktrees" for a repository with only its main worktree. The paths are in `title` and `data-entry` only (`Worktrees.svelte:162-182`).
  - **Source Control** has no remote line, since there is no remote. The commit author is `oculus`.
  - **The board** draws a folder path only in `EntryFolder.svelte`, a side panel that 2.7 keeps closed.
  - **A toast** does draw the time of day (B-R1, below).
- **B2: closed.**
  - `scratch.mjs:100-120` wraps everything after `freshFolder`: the five folders, the `cpSync` and the stand-ins with their `chmodSync`.
  - On a throw it runs `removeFolder(dir)` and rethrows.
  - `makeScratch` is synchronous, so no signal handler runs between `freshFolder` and the `try`.
- **B3: closed.**
  - `withinLimit` (`page.mjs:105-119`) races the work against a 60 s timer, refuses with the given sentence and clears the timer in `finally`.
  - `Promise.race` subscribes to the work, so a later rejection of the work (for example `loadURL` aborted by `destroy()`) is handled.
  - It bounds three calls:
    - `loadURL` (291-294);
    - each step's `executeJavaScript` (121-130);
    - each `capturePage()` (244-247).
  - A lost race is a `Refusal` inside `takeShots`'s `try`. The `finally` destroys the window, and the entry's `finish(1)` runs.
  - No check was removed: `if (done !== true) throw new Refusal(late)` stays, and so does the size check.
- **T1: closed.**
  - `image.isEmpty() ? Buffer.alloc(0) : image.toPNG()`, then `png.length < 24` gives the refusal "The hidden window drew nothing: the capture for <file> is empty." (`page.mjs:248-253`).
  - This happens before `readUInt32BE`, so the size refusal at 254-259 is kept.
- **T2: closed.**
  - `answered()` first awaits `once(child, 'spawn').catch(() => undefined)` (`server.mjs:92`).
  - `events.once` rejects when `error` is emitted.
  - The output-appending `child.once('error', ...)` (82-84) is registered before `answered()` is called, at `ready: answered()`, so it runs first.
  - The first check then sees `child.pid === undefined` and refuses with the output that holds the spawn error.
  - `once` is imported at line 16.

None of the five is closed by removing a check, and no fix reaches beyond its finding. The only other edits are the two head comments, which describe the change.

## Verdicts: items

- **1, the move: holds.** No change in the round. The files are identical to the snapshot.
- **2, the capture command: holds.**
- **2.1: holds.** This includes the disclosed departure: the userData folder is made before the needs check.
- **2.2: holds.**
- **2.3: holds.** It now also holds on a failure inside `makeScratch` (B2).
- **2.4: holds.** The workspace `settings:` also hide the six status bar items, as the round's ruling says.
- **2.5: holds.** A spawn failure now carries its reason (T2).
- **2.6: holds.**
- **2.7: holds by reading.** Every page wait is now bounded (B3). Whether each state draws as intended is for the look.
- **2.8: holds.** An empty capture is a worded refusal (T1).
- **2.9: holds.** The B2 path is closed.
- **The manuscript text and the sentence: hold.** `hub.mjs` is unchanged outside the comment, the constant and the settings line.
- **3, the README: holds.** No change.

## Verdicts: cases

- **The full run (exit 0, two PNGs of 2880 by 1800): not verifiable.** The look settles it.
- **`git status --short -- tests/fixtures` after the run: met by reading.**
- **No window, no focus change: met by reading.** Whether a Dock icon shows is for the look.
- **Nothing of the hub, sessions or git identity drawn: partial.**
  - The status bar is met by reading (B1), and so are the other surfaces named above.
  - A notification toast would draw the time of day and its message (B-R1).
- **Nothing written outside the scratch folder and `docs/images`: met by reading** for the command's own folders, the `makeScratch` failure included. Writes by Electron or AppKit are declined below.
- **The port: met.**
- **latexmk, git or tmux not on PATH: met.**
- **`npm run build` fails: met.**
- **The server exits or does not answer within 60 s: met.** A spawn failure now carries its reason.
- **A capture that throws after the server started: met.** An empty capture and a page that never answers now also end in a worded refusal.
- **The stand-ins: met.**
- **The copy's config without `slurm`: met.**
- **A second run: met.**
- **The tree checks and `size.test.ts` after the move: met** (verification lines 5 and 6).
- **The README: met by reading.**

## Spec

None.

## Proof

**P-R1. The round's B1 table gives a wrong reason for `sync`.**
- The row reads: "the copy's branch, which has no upstream, so Publish Branch".
- `RepoItems.svelte` draws Publish only under `{:else if sync && !detached && repo.remotes.length === 1}` or `> 1`. The copy is made by `git init` and has no remote, so nothing is drawn in the sync item's place.
- No decision rests on it: the item is kept either way and draws nothing of the machine.
- The risk is at the look: a reviewer of the PNG who expects a Publish Branch button would think a state is missing.

## Standards

None.

## Behaviour

**B-R1. A notification toast during the capture would draw the time of day and its message on the public PNG.** This is a surface outside the bar that the round did not cover.
- `src/lib/shell/status/notices/NoticeEntry.svelte:41`:
  ```svelte
  <time class="when" datetime={new Date(notice.at).toISOString()}>{clockOf(notice.at)}</time>
  ```
- `Bell.svelte` draws the toasts in a `Portal` under `{#if showing.length > 0}`, outside `{#if drawn}`, so hiding `bell` does not stop them.
- Failure scenario: a notice is posted while the Explorer state is being reached. One example is a language server's message relayed by `src/lib/server/machine/lsp/held/requests/notices.ts`. texlab is looked up on the server's PATH, which ends with the user's own PATH (`config/defaults/behavior.yml:477` `texlab_path: ''`; `scratch.mjs` `scratchEnv`). The capture would then show the hour and minute of the run and the toast's text.
- The workspace settings can end it deterministically. `status_bar.quiet` (`config/options/behavior.yml:1932-1936`) says a notification "goes into the notification list and shows no toast".
- Options:
  1. **`quiet: true` with `bell` added to the hidden list.** No toast and no bell glyph. The cost is that the bell is missing from the shot.
  2. **`quiet: true` alone.** The bell then draws its quiet glyph, which reads as Do Not Disturb on a public README.
  3. **The capture refuses while a `.toasts` element is present.** The lazy option: it makes a run fail at random rather than ending the cause.
- Recommendation (a judgment): option 1. It is a one-line change at landing in `hub.mjs`, next to `HIDDEN_ITEMS`, with its comment.
- Whether a toast fires on this machine is for the look.

**B-R2 (low). The blame item's words change with the date of the run.**
- `blameWords(line, now = Date.now())` (`src/lib/state/sources/repositories/file-git.ts:139`) words the caret line's blame as `${authorName} (${authorDateAgo})`. For the copy's commit, dated 2026-01-01, that is "oculus (N months ago)".
- So the Explorer PNG differs between runs a month apart. That is against the brief's Decision 4, "the shot is the same on every run".
- It is not a privacy leak: the identity is the fixed `oculus`.
- Options: hide `blame` in the same list, or accept the drift as harmless. Recommendation (a judgment): accept. The item shows a real feature, and the drift carries nothing personal.

## Declined to judge

- **Whether a toast actually fires during the run, and whether texlab is on this machine's PATH.** Judging it needs running the capture, which the prompt forbids. The look settles it.
- **Whether the 60 s outer race cuts short a step that the in-page deadline would have let finish.** The two limits are almost equal and give the same sentence. Settling it needs a run.
- **Electron 44's behaviour in a hidden window**, and **whether Chromium or AppKit write outside the two folders.** Same reason as in the first review: the look and a before-and-after listing settle them.
- **Whether every selector of 2.7 finds its element on the built page.** The look settles it.

Usage: ab8a03aa7a028303f, claude-opus-5-5, 193688 tokens, 61 tool uses, 623 s.

## Closed

- First run, B1, B2, B3, T1 and T2: closed in repair round 1 (the round's review, "Closures").
- First run, S1: the added line of the brief is the orchestrator's (the base list), and the ledger is written on main; no change.
- First run, S2: the reworded comment of `utils/tree/size-check.sh:9` follows spec.md's rule on history words in comments; kept, named in the booking.
- First run, P1: the look expects the printed path under `/private/tmp/`.
- Round 1, P-R1: the report's reason for `sync` is wrong (no remote, so nothing is drawn); no decision rests on it, and the look expects no Publish Branch control.
- Round 1, B-R1: fixed at landing, inside item 2.4 and the ruling README screenshots: the workspace file's `settings:` set `status_bar.quiet: true`, so no toast is drawn, and `bell` joins the hidden items, so the quiet glyph is not drawn either; option 1 of the finding, option 3 (refusing while a toast shows) the lazy one.
- Round 1, B-R2: fixed at landing, under the brief's Decision 4 ("the shot is the same on every run"): `blame` joins the hidden items, since its words count months from the fixed commit date; accepting the drift was the lazy option.
