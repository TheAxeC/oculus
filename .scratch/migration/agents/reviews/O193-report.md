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
