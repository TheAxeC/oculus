# O193 report, two screenshots in the README

Everything in the brief is done. The capture command is written and not run, as the brief says; the two PNGs do not exist yet and are made by the orchestrator's run at the look (section "For the look").

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md`, section "Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)", holds no entry. Its text below the heading, after ten blank lines:

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first run, on the unchanged tree (base b4c4dd9d9)

| Case | Command or reading | Output as printed |
| --- | --- | --- |
| `npm run docs:shots` on a clean checkout: exit 0, two PNGs of 2880 by 1800 | `npm run docs:shots` | `npm error Missing script: "docs:shots"`, exit 1 |
| The same run, then `git status --short -- tests/fixtures` prints nothing | `git status --short -- tests/fixtures` | nothing, exit 0 |
| No window appears and focus does not move | reading: `ls utils/shots` | `ls: utils/shots: No such file or directory`; no entry to read |
| Nothing of the hub, the machine's sessions or the git identity is drawn | reading | no command exists to read (same `ls`) |
| Nothing is written outside the scratch folder and `docs/images/` | reading; `ls docs/images` | `docs/images` absent; `docs/` holds 9 items |
| The port from binding port 0 | reading | no command exists |
| latexmk, git or tmux not on PATH: one sentence, exit 1 | reading | no command exists |
| `npm run build` fails: its output, exit 1 | reading | no command exists |
| The server exits or does not answer within 60 s | reading | no command exists |
| A capture that throws after the server started | reading | no command exists |
| ssh, claude, codex, gh, open, osascript, scp, sftp reach the stand-in | reading | no command exists |
| The copy's config after the `slurm:` block is removed | reading | no command exists |
| A second run replaces both PNGs, leaves other files | reading | no command exists |
| The tree checks from the root print nothing and exit 0 | `sh utils/tree/size-check.sh`; `sh utils/tree/folder-check.sh` | each `sh: utils/tree/...: No such file or directory`, exit 127; `sh utils/size-check.sh` and `sh utils/folder-check.sh` print nothing, exit 0 |
| `README.md` images and sentence | `grep -n '!\[\|<img\|\.png' README.md` | nothing, exit 1 |

`tests/checks/tree/size.test.ts`, the three runs the Cases section asks for:

- On the unchanged tree, before any edit: 10 passed of 10.
- After the test's edit, before the files moved: 6 failed, 4 passed. Failing lines: `ENOENT: no such file or directory, open '.../utils/tree/size-allow.txt'`; `expected 127 to be +0`; `expected { out: '', status: 127 } to deeply equal { out: '', status: +0 }`; and the ENOENT of the copy of `utils/tree/folder-check.sh`.
- After the move: 10 passed of 10.

No case of the brief's rules was found wrong.

The required missing-script run made npm write its debug log `~/.npm/_logs/2026-11-25T21_37_46_781Z-debug-0.log`, outside the worktree. That is npm's own behaviour on any failed script and the brief requires that run; the file is left as npm wrote it.

## DONE / NOT DONE

The last round (the Verify list and `npm run check`) ran twice. The first run failed item 6 on two comment lines over 100 columns in `utils/shots/hub.mjs` (lines 51 and 112, `expected [ 'utils/shots/hub.mjs:51', ...(1) ] to deeply equal []`); both were shortened, and the second run, after the last change, is the one quoted here, all items green.

| Row | State | Command and output |
| --- | --- | --- |
| 1. Files moved into `utils/tree/` | DONE | `ls utils` prints 9 items: cited-lines.mjs, claude-usage.sh, diagrams, migrations, outside-paths.mjs, scratch-count.sh, shots, tree, unused-exports.sh. `git show HEAD:utils/size-allow.txt \| diff - utils/tree/size-allow.txt` prints nothing |
| 2. Capture command in `utils/shots/`, `docs:shots` script | DONE (written; behaviour verified only at the look) | files below; `grep -n docs:shots package.json` shows `"docs:shots": "electron utils/shots/shots.mjs"` |
| 3. README images and sentence | DONE | `grep -n '!\[' README.md`: lines 11 and 25; `grep -n docs:shots README.md`: line 83 |
| Verify 1, prettier | green | `Checking formatting...` / `All matched files use Prettier code style!`, exit 0 |
| Verify 2, eslint | green | prints nothing, exit 0 |
| Verify 3, `node --check` | green | prints nothing, exit 0 |
| Verify 4, ASCII gate | green | `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' README.md package.json tests/checks/tree/size.test.ts utils/tree/* utils/shots/*` prints nothing, exit 0 |
| Verify 5, tree checks | green | `size exit=0`, `folder exit=0`, nothing printed |
| Verify 6, vitest over the three files | green | `Test Files  3 passed (3)` / `Tests  18 passed (18)` |
| Verify 7, `npm run check` | green | `COMPLETED 4689 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Verify 8, package.json parses | green | exit 0 |
| Verify 9, unused exports | green | `sh utils/unused-exports.sh` exit 0; `diff` against `/Users/axelfaes/workspace/oculus/.agents/worktrees/O193-unused-base.txt` prints nothing (exit 0); both open `Unused exports (226)` |
| Verify 10, old paths | green | the grep prints nothing, exit 1 |
| The look (case 1 and the cases checked "at the look") | NOT DONE, the orchestrator's | `npm run docs:shots`, see "For the look" |

Vitest ran with `taskpolicy -b nice -n 19`, `--maxWorkers 2`, `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch/tmp`. `.agents/scratch` is removed (`ls .agents/scratch`: no such file). No process of mine runs (`ps -ef | grep -E "[v]itest|[k]nip|[s]velte-check"` lists only the grep itself). The formatter run was `npx prettier --write utils/shots package.json tests/checks/tree/size.test.ts`; it changed `hub.mjs`, `page.mjs` and `shots.mjs` (line breaks and quotes only).

The only edits to an existing assertion are the paths in `tests/checks/tree/size.test.ts` listed below; no expected value changed.

## Files with line counts (`wc -l`)

| File | Lines | Change |
| --- | --- | --- |
| `README.md` | 125 | two images, one sentence |
| `package.json` | 133 | one script |
| `tests/checks/tree/size.test.ts` | 207 | paths of the moved files, two comment paragraphs rewrapped |
| `utils/tree/folder-check.sh` | 47 | moved; `cd "$(dirname "$0")/../.."` |
| `utils/tree/size-check.sh` | 53 | moved; `cd` as above, `allow=utils/tree/size-allow.txt`, head comment names the new path and is rewrapped |
| `utils/tree/size-allow.txt` | 4 | moved, unchanged |
| `utils/shots/shots.mjs` | 272 | new, the entry |
| `utils/shots/programs.mjs` | 84 | new, the refusal and the program runner |
| `utils/shots/scratch.mjs` | 129 | new, the scratch folder, the stand-ins, the environment |
| `utils/shots/hub.mjs` | 240 | new, the copy's changes |
| `utils/shots/server.mjs` | 123 | new, the port and the server |
| `utils/shots/page.mjs` | 277 | new, the hidden window, the two states, the captures |

`git status --short` also lists `M .scratch/migration/agents/briefs/O193.md`: one added line naming the worktree and the base list, written at 22:36:59 local (`stat`), before this builder's first command (npm's log is stamped 21:37:46 UTC, 22:37:46 local). It is not mine.

Edits in `size.test.ts` (from `git diff`):

```ts
-const ALLOW = join(ROOT, 'utils', 'size-allow.txt');
+const ALLOW = join(ROOT, 'utils', 'tree', 'size-allow.txt');
-    it('runs utils/size-check.sh, which only this test runs, ...', () => {
-        const held = spawnSync('sh', [join(ROOT, 'utils', 'size-check.sh')], {
+    it('runs utils/tree/size-check.sh, which only this test runs, ...', () => {
+        const held = spawnSync('sh', [join(ROOT, 'utils', 'tree', 'size-check.sh')], {
-    mkdirSync(join(dir, 'utils'), { recursive: true });
-    copyFileSync(join(ROOT, 'utils', 'folder-check.sh'), join(dir, 'utils', 'folder-check.sh'));
+    mkdirSync(join(dir, 'utils', 'tree'), { recursive: true });
+    copyFileSync(
+        join(ROOT, 'utils', 'tree', 'folder-check.sh'),
+        join(dir, 'utils', 'tree', 'folder-check.sh')
+    );
-    const held = spawnSync('sh', [join(dir, 'utils', 'folder-check.sh')], {
+    const held = spawnSync('sh', [join(dir, 'utils', 'tree', 'folder-check.sh')], {
```

## Judgment calls the brief left open

- **How each state is reached (item 2.7): the page's own controls.** The command presses what a reader presses, through `executeJavaScript` in the hidden window: the rail button by its label (`nav[data-rail] button[aria-label=...]`, the label read from `loadConfig(root).config.rail`), the Files tree rows (`[role=treeitem][data-value="demo:<path>"]`, pressing `button.main` only while `aria-expanded="false"`, from the workspace folder down to `manuscript`), the open-tab control of the `main.tex` row (`aria-label` = `t('files.row_open_tab')`), the LaTeX tab's View control (`t('latex.bar_view')`), the tab of `t('views.repositories')` and the tab of `t('views.problems')`, the words read with `wordsOf(root)`. Each step polls every 100 ms for its element, up to 60 s, then waits for `document.fonts.ready` and two animation frames; a state is reached when its own element is drawn: `[data-pane-view="projects"] [data-card]` for the board; the Monaco `.view-lines` holding "Streaming", `.oc-pdf .textLayer` holding "Streaming", a treeitem holding `main.tex` in `[data-pane-view="repositories"]`, and `[data-pane-view="problems"]` for the Explorer. Why: the layout file is a written internal shape whose keys can move with any layout change, and a press on a missing control fails loudly with its name, while a fresh scratch HOME holds no saved layout, so the same presses reach the same state every run. No fixed sleep is used.
- **The lower pane shows Problems.** The Explorer's default lower pane can hold a terminal, which would draw this machine's shell prompt; Problems draws only the copy's state.
- **The `userData` folder** is a fresh temporary folder `oculus-shots-electron-*` (the brief's second option), made first because `app.setPath` needs an existing folder, and removed in the ending and again on the process's exit.
- **`primary: demo` in the workspace file.** `src/lib/server/root/watch/portfolio/reads.ts:73` says "A workspace with no primary hub reads nothing else", so without it the board would be empty. The brief names only the folder and the theme.
- **The scratch base is `/tmp`** (the system's temporary folder when `/tmp` is missing), because the macOS per-user temporary folder is about fifty characters and tmux's socket path may hold at most 104.
- **The environment of every program after the scratch folder**: this process's, with HOME, TMUX_TMPDIR, TMPDIR and PATH set to the scratch folder's, and TMUX, TMUX_PANE, CLAUDE_CONFIG_DIR, CODEX_HOME, the four XDG folders and every `GIT_*` variable dropped. TMUX matters most: with it set, `tmux kill-server` would end the user's own tmux server. `npm run build` runs with the caller's environment, since it runs before the scratch folder exists.
- **`paintWhenInitiallyHidden: true`** is written out (it is Electron's default) because the capture depends on it.
- **Every permission request and check is denied** in the window's session, so no prompt reaches the screen.
- **The capture's size is checked** from the PNG header (width at byte 16, height at 20); a capture other than 2880 by 1800 stops the command.
- **`git status --porcelain` must equal exactly ` M projects/active/streaming-anomaly/manuscript/main.tex`**, so Source Control shows the one change and nothing else.
- **Every file the command writes is read back and compared** (the config re-parse the brief asks for, also the manuscript, the workspace file and `workspace.json`).
- **Code reused from `src/`**: `onPath` (`src/lib/server/core/program.ts`), `oculusAnswers` (`src/desktop/server/health.ts`), `LISTEN_HOST` (`src/lib/server/root/mover.ts`, `'127.0.0.1'`), `loadConfig` and `wordsOf`. The command has its own runner (`programs.mjs`) because `run` in `program.ts` keeps only standard error when a program fails, and latexmk writes TeX's errors to standard output.
- **An interrupt** (SIGINT, SIGTERM) runs the whole ending, and an `AbortController` ends the build, latexmk or git if one is running.
- **Electron's default app quits on `window-all-closed`**; the command removes that listener so the window's `destroy()` does not quit before the server, tmux and the folders are ended.

## Every visible change, before and after

- README, "Why a researcher would use it": before, the opening paragraph was followed by the bullets; after, line 11 between them: `![The Projects board in oculus's Light theme, showing the research projects of the made-up demo hub as cards, each with its stage, venue and next action.](docs/images/projects-board.png)`.
- README, "Why a software engineer would use it": same place, line 25: `![The Explorer page in oculus's Light theme: Source Control on the left lists one changed file, the demo hub's LaTeX manuscript, which is open in the editor with its built PDF beside it in the PDF viewer, and the Problems view sits below them.](docs/images/explorer.png)`.
- README, "Run from source": after the `npm run app:release` paragraph, line 83: "`npm run docs:shots` takes the two screenshots of this README again from a copy of the demo hub and writes them to `docs/images/`, and needs TeX's `latexmk`, git and tmux on the PATH."
- New command: before, `npm run docs:shots` printed `npm error Missing script: "docs:shots"`; after, `package.json` has `"docs:shots": "electron utils/shots/shots.mjs"`.
- Moved files: `utils/folder-check.sh`, `utils/size-check.sh`, `utils/size-allow.txt` are now `utils/tree/folder-check.sh`, `utils/tree/size-check.sh`, `utils/tree/size-allow.txt`. `utils/` went from 10 items to 9.

## For the look

The worktree's `node_modules/electron` has no `dist/` and no `path.txt` (`ls node_modules/electron`), so `npm run docs:shots` in the worktree first downloads the Electron binary into it (`node_modules/electron/index.js` runs `install.js` when `path.txt` is missing). The main checkout has it (`/Users/axelfaes/workspace/oculus/node_modules/electron/path.txt` reads `Electron.app/Contents/MacOS/Electron`). Either command works from the worktree root:

```sh
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O193
npm run docs:shots
# or, with no download, the main checkout's binary on the same file:
/Users/axelfaes/workspace/oculus/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron utils/shots/shots.mjs
```

What it should print, in order (the npm script also prints its own two header lines first): `Building oculus with npm run build.`, `Preparing the demo copy in /tmp/oculus-shots-XXXXXX/demo.`, `Starting the server on port <n>.`, `Taking the Projects board.`, `Taking the Explorer.`, `Wrote <root>/docs/images/projects-board.png and <root>/docs/images/explorer.png.`, then exit 0. No window, no Dock icon, no focus change. Afterwards `ls /tmp | grep oculus-shots` prints nothing and `git status --short -- tests/fixtures` prints nothing.

- `docs/images/projects-board.png`, 2880 by 1800: the Projects page in the Light theme, first tab (research projects), the demo hub's projects as cards with stage, venue and next action; no filter, search, menu, side panel or error box.
- `docs/images/explorer.png`, 2880 by 1800: the Explorer page in the Light theme; the Files tree open down to `projects/active/streaming-anomaly/manuscript`; the editor with `main.tex` ("Streaming anomaly detection on a rolling window") and its PDF beside it in the PDF viewer; Source Control (the Repositories tab) listing the one changed `main.tex`; Problems in the lower pane.

Unverified until the look, since none of it can be checked without running the command: that no window appears and focus does not move; that no Dock icon shows; that Chromium or AppKit writes nothing outside the scratch and userData folders (for example macOS saved state or preferences under the app name "Electron"); that the process `exit` handler runs on `app.exit`; that every selector above finds its element on the built page; that the capture is 2880 by 1800; that the abort of `npm run build` also ends the processes npm started; that the two images match the alt text.

## Line numbers in `tests/checks/tree/size.test.ts` after the change

`grep -n "^const LINES\|^const COMPONENT" tests/checks/tree/size.test.ts`: `30:const LINES = 900;`, `31:const COMPONENT = 540;`.

## What in the brief was wrong or impossible

- The workspace file as the brief gives it (one folder and `settings: theme: light`) would draw an empty board: `reads.ts:73` needs a primary hub. The command adds `primary: demo`.
- Item 2.1 asks for the lack of a need to end the command "before any other folder is made"; the `userData` folder must exist before `app.setPath` (it throws on a missing folder) and is made first, then removed by the ending.
- The brief's line numbers for `size.test.ts` (10, 14, 26, 134, 135, 147, 148, 162) were right on the base; after the comment rewrap the lines below line 13 sit one lower.

## Repair round 1

Every finding of `agents/briefs/O193-round-1.md` is done as its ruling says. Nothing was run of the capture, Electron, a server or a page; each change is checked by reading and by the Verify list below, and its behaviour is seen only at the look.

### B1, the status bar items that draw this machine or its user

Changed: `utils/shots/hub.mjs:72-81`, the constant `HIDDEN_ITEMS = ['host', 'usage', 'sessions', 'language_server', 'interpreter', 'linter']` with its comment; `utils/shots/hub.mjs:237`, the workspace file's settings are now `{ theme: 'light', status_bar: { hidden: HIDDEN_ITEMS } }`; the head comment (lines 4-9) says so. The workspace file is still read back and compared deep-equal (`writeChecked`), so the hidden list is checked as written.

How a workspace's `settings:` reaches the bar's `shown()`, read line by line:

- `src/lib/server/files/workspace/paths.ts:73`: the open workspace file is passed to the config reader as `workspace: { file: open.file }`.
- `src/lib/data/sources/config/merge/merge.ts:270`: `if (opts.workspace !== undefined) mergeWorkspace(opts.workspace, config, from, pending);`.
- `src/lib/data/sources/config/merge/workspace-layer.ts:293-347`: `walk` descends `status_bar` (a prefix of the option `status_bar.hidden`, line 327-328), finds the option entry (`config/options/behavior.yml:1927`, `control: list`) and takes the value through `appliedValue` (316-326), whose `listProblem` (`catalog/value-rule.ts:242-255`) accepts a list of strings; `setAt(config, path, taken.value)` at line 351 lays it over the default `hidden: []` of `config/defaults/behavior.yml:1042`.
- `src/lib/state/shared/words/appearance.ts:398-410`: `setAppearance` installs the merged config as `look = readLook(config)`; `lookShape` at 346-358 maps `status_bar.hidden` to `statusHidden`.
- `src/lib/state/workbench/ui.svelte.ts:391-392`: `statusHidden()` answers `held('status_bar.hidden', configuredLook()?.statusHidden)`.
- `src/lib/shell/status/StatusBar.svelte:102-107` and `138-140`: `hidden = statusHidden()`, `isHidden(key)` is `hidden.includes(key)`, and `shown(item)` is `!isHidden(item)`; `SourceItems` and `LanguageItems` get the same `shown` (StatusBar.svelte:344, SourceItems.svelte line 192 `<LanguageItems {instance} {status} {shown} ...>`).

The `theme: light` setting rides the same path, through `lookShape`'s `theme`.

Every item of the bar (`src/lib/shell/status/status-items.ts:39-69`, the components `StatusBar.svelte`, `RepoItems.svelte`, `SourceItems.svelte`, `LanguageItems.svelte`, `LatexItem.svelte`, `notices/Bell.svelte`, `AppItems.svelte`):

| Item | Hidden or kept | Reason |
| --- | --- | --- |
| `host` | hidden | `status.host.name`, the machine's `os.hostname()` (StatusBar.svelte:230-240) |
| `repository` | kept | the copy's repository by its name (RepoItems.svelte:197-202) |
| `branch` | kept | the copy's branch `main` |
| `sync` | kept | the copy's branch, which has no upstream, so Publish Branch |
| `problems` | kept | the counts of the Problems view over the copy |
| `findings` | kept | the count of the copy's findings |
| `debug` | kept | drawn only once a debug session has run (StatusBar.svelte:285); none runs |
| `hpc` | kept | the copy's HPC state; the copy has no `slurm:` block, so its unconfigured words (`status.ts:223`) |
| `usage` | hidden | the state of the agents' usage accounts (`status.ts:181-188`) |
| `server` | kept | the page's connection to the server (`socketWords`) |
| `latex` | kept | the build state of the copy's manuscript |
| `blame` | kept | the copy's commit by the fixed identity `oculus` |
| `caret` | kept | the open file's caret |
| `indent` | kept | the open file's indentation |
| `encoding` | kept | the open file's encoding |
| `line_ending` | kept | the open file's line ending |
| `language_server` | hidden | whether this machine has the language server of the file's language and its state (LanguageItems.svelte:292-297) |
| `interpreter` | hidden | this machine's Python interpreter and environment (LanguageItems.svelte:306-309); not drawn for a `.tex` file, hidden so no machine path can be drawn |
| `compile_database` | kept | the copy repository's C or C++ configuration; not drawn for a `.tex` file |
| `svelte_config` | kept | the copy repository's Svelte configuration approval; not drawn for a `.tex` file |
| `linter` | hidden | which of this machine's linter programs ran or were not found (LanguageItems.svelte:345-349) |
| `language` | kept | the open file's language |
| `sessions` | hidden | the count of live agent sessions, the user's agents rather than the copy (`status.ts:245-246`) |
| `unsaved` | kept | the count of the page's unsaved tabs |
| `bell` | kept | the notification bell of the page |
| the apps' items (`AppItems.svelte`) | kept | none: the scratch HOME holds no app |

No item of the bar draws the user name, an account name, a clock or a path: the repository item's path is only in its `data-repo` attribute and tooltip, neither of which a capture draws.

### B2, `makeScratch` removes its own folder on a throw

Changed: `utils/shots/scratch.mjs:99-120`. Everything after `freshFolder` (the folders, the copy of the fixture, the stand-ins and their mode) runs in a `try`; its `catch` runs `removeFolder(dir)` and rethrows, so the caller, which holds no scratch folder until `makeScratch` answers (`utils/shots/shots.mjs:224`), never leaves one behind.

### B3, every wait of the page bounded by the step limit

Changed: `utils/shots/page.mjs:105-119`, the new `withinLimit(work, sentence)`, which races `work` against a timer of `STEP_LIMIT_MS` (60 s), refuses with `sentence` when the timer wins and clears the timer either way. It bounds:

- `win.loadURL(origin)` at lines 291-294: `The page did not load from <origin> within 60 s.`
- each step's `executeJavaScript` at lines 121-130: `The page did not show <what> within 60 s.`, the same sentence the in-page limit already gave, now also when the page never answers (`document.fonts.ready` or a frame that never comes).
- each `capturePage()` at lines 244-247: `The capture for <file> did not finish within 60 s.`

A lost race is a `Refusal`, so `takeShots`'s `finally` destroys the window and the entry's ending (`finish(1)`) ends the server and tmux and removes the folders. The head comment (lines 19-25) says so.

### T1, an empty capture is a worded refusal

Changed: `utils/shots/page.mjs:248-253`. `image.isEmpty()` gives an empty buffer in place of `toPNG()`, and a PNG shorter than 24 bytes is refused with `The hidden window drew nothing: the capture for <file> is empty.` before the size is read at bytes 16 and 20.

### T2, a server that cannot be spawned keeps its reason

Changed: `utils/shots/server.mjs:86-92`. `answered()` first awaits `once(child, 'spawn')`; when node cannot be started the child emits `error` in place of `spawn`, the `error` listener registered at spawn time (lines 82-84, registered first, so it runs first) appends `error.message` (for example `spawn node ENOENT`) to the output, the `once` is rejected and caught, and the first check then finds `child.pid === undefined` and refuses with `The server stopped before it answered; its output follows.` and that output.

### Verify, after the round's last change

The round's last check list ran once, from the worktree root, with `taskpolicy -b nice -n 19`, `--maxWorkers 2`, `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch/tmp`. The formatter ran once before it (`npx prettier --write utils/shots`, which rewrapped the folder list in `scratch.mjs`). Output as printed:

```
== 1
Checking formatting...
All matched files use Prettier code style!
exit=0
== 2
exit=0
== 3
exit=0
== 4
exit=0
== 5
size exit=0
folder exit=0
== 6
 Test Files  3 passed (3)
      Tests  18 passed (18)
== 7
1795646711844 COMPLETED 4689 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
== 8
exit=0
== 9
exit=0
diff exit=0
Unused exports (226)
== 10
exit=1
```

Item 9's `diff` is against `/Users/axelfaes/workspace/oculus/.agents/worktrees/O193-unused-base.txt`; item 10's exit 1 is grep finding nothing.

### Files of the round, with their new line counts (`wc -l`)

| File | Lines |
| --- | --- |
| `utils/shots/hub.mjs` | 253 |
| `utils/shots/page.mjs` | 305 |
| `utils/shots/scratch.mjs` | 141 |
| `utils/shots/server.mjs` | 128 |
| `utils/shots/programs.mjs` | 84 (unchanged) |
| `utils/shots/shots.mjs` | 272 (unchanged) |

### Unverified until the look, added by the round

That the bar draws none of the six hidden items; that a notification toast of the page (not part of the bar) draws nothing of this machine; that the 60 s races never cut short a load, a step or a capture that would have finished.

## Repair round 2

Every item of `agents/briefs/O193-round-2.md` is done. `docs/images/focus.png` does not exist yet (`ls -la docs/images` lists `explorer.png` and `projects-board.png` only): the capture command is written and not run, so the README's new image is a broken link until the look writes it. I read the landing-fixes patch and the four files it changed (`utils/shots/hub.mjs`, `page.mjs`, `shots.mjs`, `README.md`) whole before changing them. Nothing closes the right-hand floats: no step presses a float's control, so Live HPC and Usage stay drawn on all three shots.

### What changed

- `utils/shots/page.mjs:1-3`: the head comment names the three shots in the rail's order: the Focus page, the Projects board, the Explorer.
- `utils/shots/page.mjs:43-47`: `SHOT_NAMES` is `{ focus: 'focus.png', board: 'projects-board.png', explorer: 'explorer.png' }`, in that order.
- `utils/shots/page.mjs:171-188`: the new `focusSteps(config)`. It presses the rail's Focus button, whose label `railLabel(config, 'focus')` reads from `loadConfig` (`config/defaults/layout.yml:10`, `page: focus`). It then waits for a lane card in `[data-pane-view="focus"]`. The page is left in its default arrangement (`layout.yml:35-39`, one pane holding the pinned `focus` tab), and nothing opens a menu.
- `utils/shots/page.mjs:296-301` and `317-334`: `takeShots` returns and fills `taken.focus`. It takes the Focus page first (`Taking the Focus page.`, `focusSteps`, `capture`), then the Projects board, then the Explorer. Each capture goes through the same `capture()`, so the empty-image check and the 2880 by 1800 size check cover all three.
- The landing fix in `takeShots` split the board steps into `[rail, ...board]` and carried the comment "The floats are drawn with the workbench, so they are closed once the rail is drawn." No code there closes a float, so the comment was wrong. It is gone, and the board's steps are one loop again (`page.mjs:331`). The floats stay drawn, as ruled.
- `utils/shots/shots.mjs:1-13` and `24-33`: the head comment names the three files. It now says the captures are moved only once all three are written, so a failed run never leaves a mixed set, and that exit 0 needs all three files. Item 7 is rewrapped at 100 columns.
- `utils/shots/shots.mjs:114-117`: the doc comment of `placeShots` speaks of the set. `placeShots` already copies every entry of `SHOT_NAMES` under a name of its own and renames them all only after every copy is written, so it covers the third file with no code change.
- `utils/shots/shots.mjs:242` and `278`: the comment of `run` says three files, and the closing line is `Wrote <a>, <b>, <c>.`.
- `utils/shots/scratch.mjs:9`: "the three captures".
- `README.md:38`: under "What it shows", after "Each button on the rail at the left opens a page:" and before its list:

  `![The Focus page in oculus's Dark Modern theme, listing what wants attention in the made-up demo hub: its command center of deadlines and dates, its tasks, the work awaiting a response, and its projects as cards on the lanes of their stages.](docs/images/focus.png)`
- `README.md:85`: "`npm run docs:shots` takes the three screenshots of this README again ...". Nothing else in the README changed.

### The Focus element waited on, and why it shows the drawn state

The command waits for `[data-pane-view="focus"] [data-card]`, a card on a lane, which `lanes/LaneCard.svelte:207-215` draws with `data-card={project.id}`.

`views/boards/focus/Focus.svelte:143-152` works out the whole board as `page` only once the portfolio snapshot is in hand; until then `page` is null. Until then the lanes get `items={page?.sections.lanes ?? {}}` (line 391) and draw no card, and the board draws the message of a board with no project (`Empty`, lines 385-387). Every other section (command center, tasks, awaiting box, band) reads the same `page`. So a lane card is the first element that exists only once the board is drawn with the copy's records rather than the empty or loading board.

The demo copy has projects at stages the lanes take (`in-prep`, `revision`, `submit-ready`, `submitted`, `scoping`, `nascent`, from `grep -n "stage:" tests/fixtures/hubs/demo/projects/*/*/project.yml`), so the card does come.

Not verified until the look: whether the lanes sit inside the first 900 CSS pixels of the page. The card is waited on in the page, not on screen, and the alt text names the lanes; if the capture shows only the upper sections, the alt text needs that change.

### Item 2: what the Focus page draws that is not the copy's

What would draw this machine or its user. Each draws nothing on the copy, because its source is empty under the scratch HOME or the copy lacks it, so no workspace setting is needed for it:

| What | Drawn by | Why it draws nothing |
| --- | --- | --- |
| Mail: the inbox count of Needs attention and its line of email threads | `CommandCenter.svelte:86-88` (`attention(..., actionable(), ...)`), threads at `175-190`; `state/feeds/feeds.ts:88` | The mail accounts are the machine's: the `mail` key of the primary hub's `.oculus/local.yml` (default no accounts, `server/root/process/context/machine-defaults.ts:49`) and the notes under `~/.oculus/mail` (`server/accounts/connect/store.ts:75-76`, `homedir()`). The copy has no `local.yml` (`ls tests/fixtures/hubs/demo/.oculus` lists `config.yml` and `data` only), and HOME is the scratch HOME. |
| The Inbox refresh line, with its days since the triage notes ran | `CommandCenter.svelte:90-93`, `feeds.ts:145-150` | It needs the machine's triage-notes date (null under the scratch HOME) and an offered update task. `update_tasks` is `[]` in `config/defaults/sources.yml:64`, and the copy's config sets none. |
| The live HPC pill on the command center's heading row | `CommandCenterView.svelte:136-138` (`pillText()`) | It is drawn only while a cluster's running and pending sum is not empty; the copy's `slurm:` block is removed, so nothing is polled. |
| "Mine only" and the Role checklist of the Filter | `Focus.svelte:132` and `293` (`selfPeople()`), `FocusFilter.svelte:77-93` | `self` is a key of the primary hub's `local.yml`, which the copy lacks. The list is a menu, and no menu is open on the shot. |
| The LinkedIn cadence line | `CommandCenter.svelte:226-232`, `feeds.ts:90-94` | The copy has no LinkedIn feed (`feeds.linkedin` is absent), so `daysSince` is null. |
| The rail's badges for Inbox and the Session list | `config/defaults/layout.yml:311` and `318` (`rail: true`) | Under the scratch HOME both count 0, so no badge is drawn. |
| The Usage float on the right | the float the user ruled stays drawn | It reads the agents' usage accounts. Under the scratch HOME there are none. It is kept by the ruling, not hidden. |

No clock and no calendar are drawn on the Focus page: no element of `views/boards/focus/` reads a calendar, and `clock.minuteNow()` (`Focus.svelte:102`, `116`) is used only as today's date for the countdowns below.

What draws the day of the run, because `now` is today (`Focus.svelte:116`) and changes from day to day:

| What it draws | Drawn by |
| --- | --- |
| Which dated rows the command center lists, and which of them are Overdue. A row is listed when its date falls inside `deadline_horizon_days: 90`, `leads_horizon_days: 21` or `conf_horizon_months: 1` (`config/defaults/behavior.yml:119-121`) counted from today. | `Focus.svelte:143-152` (`focusPage(snapshot, config, now, ...)`) |
| The tail of each command-center row: "N days overdue" for a project, funding or other entry, and "in N days" for a submission, funding deadline, conference call or other entry | `CommandCenter.svelte:113-137` (`overdueTail`, and the line after it that words a date ahead) |
| A task row's tail, "in 3d" or "3d ago", and its tone | `Tasks.svelte:6` and the shared row maker in `rows.ts` |
| A lane card's deadline badge: overdue by N days (red), due in N days (amber, within `DEADLINE_SOON`), else the date itself | `lanes/Lanes.svelte:117-127`, and the card's facts `laneFacts(..., now)` at line 236, which give the days since `submitted` at a stage that pauses the countdown |
| A band card's countdown (Funding, Jobs, Teaching) | `Band.svelte:94-96` (`daysUntil(item.deadline, now)`) |

The demo fixture's dates are fixed, so these words and the set of rows change with the day the command runs. No workspace option fixes today's date, so they cannot be held still by a setting.

### Verify, after the round's last change

The round's last check list ran once, from the worktree root, with `taskpolicy -b nice -n 19`, `--maxWorkers 2`, and `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch/tmp`. The ASCII check and the size and folder checks include `utils/shots/*`. Before the list, `npx prettier --write utils/shots` ran once and changed nothing. Output as printed:

```
== 1
Checking formatting...
All matched files use Prettier code style!
exit=0
== 2
exit=0
== 3
exit=0
== 4
exit=0
== 5
size exit=0
folder exit=0
== 6
 Test Files  3 passed (3)
      Tests  18 passed (18)
== 7
1795649318963 COMPLETED 4689 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
== 8
exit=0
== 9
exit=0
diff exit=0
Unused exports (226)
== 10
exit=1
```

`.agents/scratch` is removed (`ls .agents/scratch`: no such file). No process of mine runs: `ps -ef | grep -E "[v]itest|[k]nip|[s]velte-check" | wc -l` prints 0.

### Files with their new line counts (`wc -l`)

| File | Lines |
| --- | --- |
| `utils/shots/page.mjs` | 340 |
| `utils/shots/shots.mjs` | 300 |
| `utils/shots/scratch.mjs` | 141 |
| `utils/shots/hub.mjs` | 331 (unchanged by this round) |
| `utils/shots/server.mjs` | 128 (unchanged) |
| `utils/shots/programs.mjs` | 84 (unchanged) |
| `README.md` | 127 |

### For the look

The command now prints `Taking the Focus page.` before `Taking the Projects board.` and `Taking the Explorer.`, and ends with `Wrote <root>/docs/images/focus.png, <root>/docs/images/projects-board.png, <root>/docs/images/explorer.png.`.

`focus.png`, 2880 by 1800, should show the Focus page in Dark Modern, with the right-hand floats drawn and no menu open. Not verified until the look:
- that no section shows anything of this machine;
- what part of the board fits the window;
- that the alt text matches the picture.
