# Brief check of O193 (read on oculus main at e83939639, plus the uncommitted ledger files)

## 1. Names

Command: `grep -rn --exclude=local.yml -- "<name>" src tests utils config docs README.md package.json .scratch/migration/agents/spec.md CLAUDE.md AGENTS.md`, run for folder-check, size-check, size-allow, utils/tree, utils/shots, docs:shots, docs/images and shots. Also `git grep -n "size-allow\|folder-check\|size-check" -- ':!.scratch' ':!config/local.yml'` and `git grep -n "utils" -- ':!.scratch' ':!config/local.yml' ':!package-lock.json'`.

- `utils/tree`, `utils/shots`, `docs:shots`, `docs/images`: no hits anywhere. The `shots` hits are all "snapshot" words in `src/lib/server/machine/usage/*` and `src/lib/state/shared/words/fuzzy.ts`, which have nothing to do with this step. CLAUDE.md (AGENTS.md is a symlink to it) has no hit for any of the names.
- The tree-check names: the only hits are in `tests/checks/tree/size.test.ts` (10, 14, 26, 134, 135, 148, 162) and in `utils/size-check.sh` (7, 15). Both files are in the write list.
- Hits outside the write list:
  - `.scratch/migration/agents/spec.md:49` names `utils/folder-check.sh`. The move makes it false. The brief says the orchestrator fixes it at landing.
  - `.scratch/migration/agents/spec.md:48` cites `tests/checks/tree/size.test.ts:28-29`, the LINES and COMPONENT constants. The brief does not name this hit. The comment paragraph at size.test.ts lines 10-12 is 96+98+92 characters and gains 10 characters (two `tree/` insertions). Rewrapped at 100 columns it can grow to four lines, which moves the constants to 29-30 and makes spec.md:48 false. This was not measured; it depends on how the rewrap falls.
  - `tests/checks/tree/size.test.ts:147` is inside the write list but missing from the brief's line list: `mkdirSync(join(dir, 'utils'), { recursive: true });`. If line 148 copies to `utils/tree/folder-check.sh` and 147 still makes only `utils`, the copy throws ENOENT. See "Specific checks".
  - `utils/folder-check.sh:8` and the header of `utils/size-allow.txt` name `tests/checks/tree/size.test.ts`. Both stay true after the move.

## 2. The step line

The step line is `plan.md:1764`. Each part, with the requirement that serves it:

- "README shows two screenshots near its top": item 3 (after the opening paragraph of the sections at lines 7 and 19).
- "Projects board in card view for 'Why a researcher...'": item 2.7, first state, and item 3.
- "Explorer with a manuscript open in the editor beside its PDF and Source Control for 'Why a software engineer...'": item 2.7, second state, and item 3.
- "each with alt text": item 3.
- "PNGs live in docs/images/": item 2.8.
- "Oculus Light only": item 2.4 (`theme: light`).
- "from tests/fixtures/hubs/demo on a scratch server with a scratch HOME, never from the research hub": items 2.3, 2.4 and 2.5.
- "npm script over a hidden Electron window, show: false and the Dock icon hidden": item 2 (`docs:shots`) and item 2.6.
- "starts that server, opens each view at a fixed window size and writes the two PNGs": items 2.5 to 2.8.
- "README's text or the command's head comment says how to take them again": item 2's head comment and item 3's sentence.
- "builder writes the command and README text, does not run the capture; orchestrator runs it at the look": the paragraph under "What to build".
- "Electron's hidden window and capturePage()": only weakly carried. Item 2.6 names the hidden `BrowserWindow`, but no item of "What to build" names `webContents.capturePage()`. It appears only in the premise (line 19), in Libraries (line 98) and as "(ruling 785)".
- "under utils/shots/": item 2.
- "the three tree-check files moving to utils/tree/": item 1.
- "lands only after Axel has approved both screenshots": the "What to build" paragraph.

No part of the step line is without a requirement. The capturePage part is the only one without a requirement that names it.

## 3. Premises

All rerun from /Users/axelfaes/workspace/oculus.

- Line 11:
  - `wc -l README.md` prints 119.
  - `grep -n '!\[\|<img\|\.png' README.md` prints nothing (rc=1).
  - `grep -n '^## ' README.md` prints sections at 7, 19, 30, 47, 63, 79, 93, 103 and 117, as stated.
  - Read whole: each Why section is one paragraph followed by bullets. The `sh` block holds `npm ci`, `npm run dev` and `npm run app`, plus `git clone` and `cd`. `npm run app:release` is in its own paragraph.
  - Holds.
- Line 12: `ls docs/images` prints "No such file or directory" (rc=1). `ls docs | wc -l` prints 9. Holds.
- Line 13:
  - `find ... -name project.yml | wc -l` prints 13.
  - `find ... -name '*.pdf'` prints nothing.
  - The one main.tex is `projects/active/streaming-anomaly/manuscript/main.tex`.
  - `git -C tests/fixtures/hubs/demo rev-parse --show-toplevel` prints the oculus root, so the demo is not a repository of its own.
  - `config.yml` lines 35-37 are the comment plus `slurm:` and `resource: [utwente]`.
  - `tests/data/hubs/hubs-fixture.ts` exists. `tests/checks/config/integrity.test.ts:6` reads the demo in place.
  - Holds.
- Line 14: `which latexmk pdflatex` prints `/usr/local/texlive/2025/bin/universal-darwin//latexmk` and the pdflatex beside it. Holds.
- Line 15:
  - `args.ts:22` is `const PORT_FLAG = '--default-port';`.
  - `src/server.ts:84` is the handler-not-built check.
  - `state.ts` reads `{open, recent, unsaved}` from `join(homedir(), '.oculus')`.
  - `config/options/appearance.yml:32` is `theme:`.
  - Holds.
- Line 16: `grep -n` gives `config/defaults/appearance.yml:9` for the light row and `:60` for `theme: ''`. Holds.
- Line 17: there is no page to read. The catalog agrees: `config/defaults/layout.yml:10` is `{ label: "Projects", ... }` and `:13` is `{ label: "Explorer", ... }`.
- Line 18: the list of eight stand-ins is not verified from a landing record. `grep -rn "exit 255" .scratch/migration/` finds `exit 255` stand-ins in O82, O83, Q15 and D44, but I found no record naming all eight programs.
- Line 19: `package.json:46` is `"electron": "44.5.1"`. `"app": "electron ."` is present. The API facts are not checked by a command.
- Line 20:
  - `ls utils` lists the ten items named.
  - `utils/diagrams` and `src/desktop` hold ten items each.
  - The git grep matches the reference list exactly.
  - `folder-check.sh:11` and `size-check.sh:13` are `cd "$(dirname "$0")/.."`.
  - spec.md:49 names `utils/folder-check.sh`, and spec.md:89 names `sh utils/unused-exports.sh`.
  - Holds.
- Line 21: `package.json:24` is `"docs:palette": "node utils/diagrams/palette.mjs"`. Holds.
- Line 22: `ls docs/adr` fails, and `orchestrator-state.md:11` is `standards: [.scratch/migration/agents/spec.md]`. Holds.
- Line 23: the rulings agree with `plan.md:3805-3807`.

## 4. Cases and checks

- Spec 69 says the report quotes, for each test the step changes, its failing line on the unchanged tree. The brief (line 65, and Verify 5) asks instead that size.test.ts pass before the move and pass after it. The changed size.test.ts, run on the unchanged tree, would fail with ENOENT on `utils/tree/size-check.sh`. That failing line is what spec 69 asks for. This is inconsistent with the rules file.
- Verify 9 asks the builder to run `git grep`. Spec 33 allows a builder only `git status`, `git diff` and `git show`. This is inconsistent with the rules file. A plain `grep -rn` over the same paths would do the same job.
- Case "npm run build fails": unlike its neighbours, it does not say how it is checked. The only way to run it is to break the build, which the no-breakage rule (spec 68) bans. It must say "checked by reading".
- Case "latexmk not on PATH": it describes a run with a reduced PATH but says it is checked by reading. That is consistent with "the builder never runs the command", but the run it describes is never made by anyone, including at the look.
- Conventions, line 115 ("prints its sentences to the terminal, as the other tools there do"): spec 51 says a literal string anywhere a reader sees it is a defect. It is consistent with the tree's practice (`utils/unused-exports.sh` echoes literals) but departs from the rule's wording. The orchestrator should rule on it.
- Item 2.5 ("neither 8787 nor 8790, by binding port 0"): binding port 0 returns an ephemeral port (49152 and up on macOS, 32768 and up on Linux), so it can never return 8787 or 8790. The clause invites a hardcoded check that never fires, and 8790 is a config default that spec 55 says must not be hardcoded. The case "A run while a server already listens on 8790" passes trivially.
- The cases do not ask the builder to check, quote or explain a place the step does not change. `git status --short -- tests/fixtures` checks the command's effect, so it belongs to the step.
- Item 2.9's "no tmux server on its socket" has no case. The server-timeout case names the server process, the scratch folder and Electron, but not tmux.

## 5. The question

The goal: the README shows two good screenshots of oculus on made-up data, and one command takes them again.

- Case 1 (exit 0, 2880 by 1800): it can pass with the wrong content, such as a loading state, a dialog or the wrong tab. Only the look and Axel's approval judge the content.
- Case 2 (fixture unchanged): necessary, not sufficient.
- Case 3 (no window, no focus): it is not about the goal. It is checked by reading for the calls. See item 6 for the Dock icon that default_app may show first.
- Case 4 (nothing of the hub): checked by reading. It can pass while Electron writes its profile under the real HOME (item 6), which does not touch the goal.
- Case 5 (8790): passes trivially (see section 4).
- Cases 6 to 9 (latexmk missing, build fails, server timeout, a capture throws): all checked by reading. They are about clean failure, not the goal.
- Case 10 (stand-ins): "checked by reading the PATH" can pass while a stand-in is not executable. `programPath` then skips it (`program.ts:14-15`: "a file this process may run") and finds the real ssh or claude later on PATH. The check should also read the chmod.
- Case 11 (second run): judged at the look.
- Case 12 (tree checks): these cannot pass without the move. The prettier and eslint rows are a different matter, see below.
- Case 13 (README): judged at the look against the PNGs.
- The step line's check (Axel approves both): this is the only gate on "good". It is real, but nothing in the brief settles beforehand what the Explorer shot holds:
  - main.tex is 6 lines, and its body sentence is "The demo hub's one manuscript, kept to five lines so a build finishes at once."
  - `\maketitle` prints today's date, so the PDF changes on every run.
  - The copy is committed whole before the shot, so Source Control shows a clean repository with an empty changes list. The workspace file written after the commit (item 2.4's order) shows as one untracked file.
  - My judgment is that this Explorer shot may be thin. A rejection costs a redesign after the build.
- Item 1 (the move): it can pass without the goal; it only enables it.
- Item 2.6 ("a device scale factor of 2"): `BrowserWindow` has no such option. Without a switch it passes only on a Retina display.
- Verify 1 (prettier):
  - `utils/tree` will hold only .sh and .txt files, which prettier has no parser for.
  - `npx prettier --check utils/size-check.sh` prints "No parser could be inferred" (rc=2).
  - Prettier given a folder with no supported file exits 2 ("No files matching the pattern were found"). I saw this with the missing folder: `npx prettier --check README.md utils/tree` gives rc=2. I did not run it on a folder holding only .sh and .txt.
  - So Verify 1 cannot pass as written.
  - README.md is under `.prettierignore` (`*.md`) and is skipped silently (rc=0).
- Verify 2 (eslint): it checks nothing in `utils/shots`.
  - With `.mjs` files: `npx eslint --print-config utils/diagrams/palette.mjs` prints `"rules": {}`, so no rule applies.
  - With `.ts` files: `npx eslint --print-config utils/shots/capture.ts` prints `undefined`, and `npx eslint utils/migrations` (a folder of .ts only) prints "all of the files matching the glob pattern ... are ignored" (rc=2).
  - So with `.mjs` files it passes without checking anything, and with `.ts` files it cannot pass.
- Verify 6 (npm run check): `.svelte-kit/tsconfig.json` includes only src, test and tests, so `utils/shots` is not type-checked. It passes without checking the new code.
- Two checks that do cover utils are not in the verify list:
  - `tests/checks/source/comment-width.test.ts:61-62` ('src', 'tests', 'utils').
  - `tests/checks/source/history.test.ts:19` (ROOTS includes 'utils').
  - They would catch real defects in the new files.

## 6. Implied inputs

Each is an input the capture command depends on that the brief does not state, with the expected result.

- **Retina vs non-Retina scale.**
  - BrowserWindow takes no device scale factor, and `capturePage()` returns pixels at the display's scale. On a 1x display the PNGs come out 1440 by 900 and case 1 fails.
  - Expected: `app.commandLine.appendSwitch('force-device-scale-factor', '2')` before ready.
  - Also: the content size needs `useContentSize: true`, or the macOS title bar eats about 28 px. A window larger than the screen may be clamped (`enableLargerThanScreen`). Not verified.
- **Electron's own profile.**
  - `electron <file>` runs default_app's `loadApplicationPackage(file)`. That function looks for `<file>/package.json`, finds none and leaves the app name as "Electron" (read from `default_app.asar`). So userData becomes the real `~/Library/Application Support/Electron`, outside the scratch folder. Only the server gets the scratch HOME.
  - Expected: `app.setPath('userData', <scratch>/electron)` before ready, as `src/desktop/app.ts:73` does for the app.
  - `git grep -n localStorage -- src/lib` counts 0, so no page state carries over between runs. The cost is files written outside the scratch folder.
- **Top-level await in the ES module entry.** `src/desktop/main.ts:2-4` says "a top-level await on ready never returns in an ES module main". Expected: the entry uses `app.whenReady().then(...)` and never a top-level `await app.whenReady()`. The brief does not say this, and getting it wrong hangs the command.
- **Git identity and config of the copy.**
  - `git commit` with only an author still needs a committer.
  - Under the scratch HOME with no config it fails ("Please tell me who you are").
  - Under the real HOME it takes Axel's name and e-mail, which Source Control may draw, along with his global settings (signing, hooks, init.defaultBranch).
  - Expected: git run with the scratch HOME; `-c user.name=... -c user.email=...` for both author and committer; `git init -b main`; fixed `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE`, so the shot is the same on every run.
- **TeX auxiliary files and the date.**
  - `latexmk -pdf` leaves .aux, .log, .fls and .fdb_latexmk in the copy. `git add -A` then commits them, and the Files view lists them.
  - `\maketitle` prints `\today`.
  - Expected: `latexmk -c` after the build, or an `-auxdir`. Also `SOURCE_DATE_EPOCH` with `FORCE_SOURCE_DATE=1` for a fixed date. Possibly `-norc` so another machine's `~/.latexmkrc` does not change the build.
- **Order of writes in item 2.4.** The workspace file is written after the commit, so it shows as an untracked change in the shot. Expected: write it before the commit, or decide that one change is what Source Control should show.
- **tmux outlives the server.** The README says terminals "keep running when the server or the window stops". Ending the server leaves the tmux server running. Removing the folder deletes its socket but not the process, and item 2.9 then fails. Expected: `tmux kill-server` under the same `TMUX_TMPDIR` before the folder is removed.
- **Half-written pair.** Item 2.8 writes each PNG as it is taken. If the second capture fails, a new projects-board.png sits beside an old explorer.png, and that mismatched pair could be committed. Expected: capture both into the scratch folder and move both into `docs/images/` only after both succeed.
- **Server exiting early.**
  - The port-0 pick is released before the server binds, so a race is possible. The server prints `port_in_use` and exits 1 (`src/server.ts`, the `refused` handler).
  - A Node older than 24.15 or a stale `npm ci` makes `installLacks` exit 1.
  - Expected: the wait ends on the server's exit, with its output, and not only at the 60 s bound.
- **Machine with no display (Linux).** Electron fails with its own X or Wayland error before the entry runs. Expected: the head comment names the need for a display, or the entry checks `DISPLAY`/`WAYLAND_DISPLAY` on Linux and prints one sentence. Low cost, since the shots are taken on macOS.
- **The Dock icon and focus before user code.**
  - default_app runs before the entry, so a brief Dock icon at launch is possible before `app.dock.hide()`. Not verified.
  - default_app's `showErrorMessage` calls `app.focus()` and shows an error box when the entry cannot be resolved. That path takes focus.
- **Hidden-window rendering.** `paintWhenInitiallyHidden` defaults to true, so the renderer counts as visible. `backgroundThrottling: false` may be needed so the page's timers and frames run (Monaco, the PDF render). Not verified.
- **npm run build and tracked files.**
  - `.gitignore` ignores `build/` and `.svelte-kit/`, so the build changes no tracked file (judged from `vite.config.ts`'s write sites and `.gitignore`).
  - The build replaces `build/` under any `node src/server.ts` started from the same checkout, for example a scratch look server.
  - It also takes the types lock (`vite.config.ts` typesLocked), so a svelte-check or vitest running in that checkout waits on it or delays it.
- **Stand-ins vs the server's first-run checks.** They never refuse; see "Specific checks". A stand-in left non-executable is skipped, and the real program further along PATH is found (see section 5).
- **Stale files in docs/images.** The command writes two names. Any other file already there stays, so case 11's "no other file" holds only from a clean folder. The cost is low.
- **The copy's folder name and path.** The Files tree and the workspace title draw the folder `name` of `shots.yml`, and possibly its temporary path. The brief names neither. Expected: a fixed name such as `demo`.
- **Editing the copy's YAML.** Spec 74 says a write that edits a file's text re-parses its result. Removing the `slurm:` block by text should re-parse the file and refuse if `slurm` is still present.

## 7. ADRs

`ls docs/adr` prints "No such file or directory". `find . -path ./node_modules -prune -o -type d -name adr -print` finds none. There is no ADR folder.

## 8. Dictated text

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O193.md` prints nothing, so the brief is ASCII.

- "Layer 4, tool." (`grep -n 'Layer 4, tool'` finds line 32): holds. It matches `utils/diagrams/*.mjs:1`.
- "#!/bin/sh" and "exit 255" (line 35): holds.
- "oculus <oculus@example.invalid>" (line 36, "such as"): holds.
- `.oculus/workspaces/shots.yml` with `theme: light` (line 36): holds.
- `"docs:shots"` and `electron utils/shots/<entry>` (line 32): holds.
- `allow=utils/tree/size-allow.txt` (line 30): holds.

The brief dictates no README words. The alt text and the "Run from source" sentence are described, not quoted. Line 5 reads "Then, in full: `.scratch/migration/agents/spec.md` is the one standards page...". It is a broken sentence (a reading instruction that runs into a statement), but it is not dictated text.

## Specific checks

- **"A builder runs no page" vs the brief's split.** Consistent. The builder writes the command and never runs it, the orchestrator runs it at the look, and case 1's row names the look as its proof, as spec 65 asks. The exceptions are those named in section 4: the "npm run build fails" case can only be read (no-breakage rule), and Verify 9's `git grep` breaks spec 33.
- **size.test.ts scratch-tree case.**
  - It holds after the move only if line 147, which the brief does not list, also changes. Line 147 is `mkdirSync(join(dir, 'utils'), { recursive: true });`.
  - If line 148 copies to `join(dir, 'utils', 'tree', 'folder-check.sh')` while 147 makes only `utils`, `copyFileSync` throws ENOENT. Then all three `folderTree` cases (179, 189, 196) fail.
  - With 147 changed to `utils/tree`, the copied script's `cd "$(dirname "$0")/../.."` reaches the scratch root, and the expected outputs stay as they are: `utils` holds one item (`tree`), `utils/tree` holds one, and both are under ten.
  - Line 162 changes to `join(dir, 'utils', 'tree', 'folder-check.sh')`.
- **npm run check, eslint and prettier over utils/shots.**
  - `eslint.config.js` lints only `src/**/*.ts`, `src/**/*.svelte` and `tests/**/*.ts`. A `.mjs` under `utils/shots` gets an empty rule set (print-config shows `"rules": {}`), and a `.ts` there is "ignored", with rc=2 on a folder argument.
  - `tsconfig.json` extends `.svelte-kit/tsconfig.json`, whose include list is src, test and tests, so `npm run check` does not type-check `utils/shots`.
  - `.prettierrc` sets no globs, so prettier formats `.mjs` and `.ts` in `utils/shots`. It has no parser for `utils/tree`'s .sh and .txt files (rc=2, see section 5). It skips README.md through `.prettierignore` `*.md`.
- **Electron 44 and an ES module entry.**
  - `ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron -p ...` prints `24.21.0 44.5.1 ts=strip`.
  - default_app loads a file path with `await import(url.pathToFileURL(filePath))`, after `Module._resolveFilename` (read from `default_app.asar`). So `.mjs`, `.js` (the root `package.json` has `"type": "module"`) and `.ts` (type stripping) all load as ES modules.
  - The brief names no extension. `.mjs` is the extension of the tree's tools under utils (`utils/diagrams/*.mjs`). A `.ts` entry makes Verify 2 fail (rc=2).
  - Whichever extension, the entry must not top-level-await `app.whenReady()` (`src/desktop/main.ts:2-4`).
- **First-run checks vs the stand-ins.**
  - `first-run.ts` `machineLacks` (lines 180-215) only looks up git, tmux and the `claudeBin` with `programPath`: a file this process may run, found on PATH. Every such lack is `required: false`, and `reportLacks` (237-240) returns true only for a required lack.
  - A stand-in `claude` counts as found, and nothing is run. The stand-ins for codex, gh, open, osascript, scp, sftp and ssh are not checked at all.
  - The only required lacks are `installLacks`: the Node version and the installed packages.
  - On macOS, when git resolves to `/usr/bin/git`, `xcode-select -p` is run. It is the real program, since it is not among the stand-ins.
  - So the server does not refuse to start with the stand-ins. Git and tmux must be real, further along PATH. Without tmux the Explorer's terminals fail, and that could show in the shot.

## Declined to judge

- That the eight stand-ins match the landing looks: I found no record listing all eight. The brief gives the list itself, so the command does not depend on the premise.
- Whether a hidden window throttles frames or timers, and whether the Dock icon shows briefly before `app.dock.hide()`: these need a run of Electron with a window, which this check may not start.
- Whether prettier exits 2 on a folder holding only .sh and .txt: inferred from the missing-folder run (rc=2) and the .sh run (rc=2). I wrote no such folder, since this check writes nothing.
- The default of `claude_bin`: it is not in `config/defaults` (`git grep -n "claude_bin:" -- config/defaults` prints nothing), and I did not trace where its default lives. The first-run conclusion does not depend on it, since every machine lack is optional.
- Whether opening main.tex starts the server's LaTeX runs or an approval prompt (`src/lib/server/machine/pty/latex/approval.ts`) that could draw a dialog in the Explorer shot: not traced.

Usage: ac32c8c7d99fe4d01, claude-opus-5-5, 209538 tokens, 57 tool uses, 627 s.

## Closed

Each finding with the change made to `agents/briefs/O193.md`:

- Names, spec.md:49 and spec.md:48: the premise names both; the report gives the new line numbers of `LINES` and `COMPONENT`, and the orchestrator updates spec.md at landing.
- Names and Specific checks, `size.test.ts:147`: item 1 lists line 147 and says the scratch tree makes `utils/tree`.
- The step line, `capturePage()`: item 2.8 takes each state with `webContents.capturePage()`.
- Premises, the eight stand-ins: the premise cites the looks' stand-in folder of this session's scratch, read with `ls`.
- Cases, spec 69: the size.test.ts bullet asks for its run before any edit (passing), after the test's edit and before the move (failing, quoted) and after the move (passing).
- Cases, Verify 9's `git grep`: replaced by `grep -rn` (Verify 10).
- Cases, "npm run build fails": "Checked by reading".
- Cases, "latexmk not on PATH": the case covers `latexmk`, `git` and `tmux` and is checked by reading.
- Cases, literal strings: Decisions 6 states the terminal sentences of a `utils/` tool are literals, as the tree's tools print theirs.
- Cases, the 8787 and 8790 clause: removed; the port case reads the port-0 pick and the server's exit on a race.
- Cases, tmux: item 2.9 runs `tmux kill-server` under the command's `TMUX_TMPDIR`; the failure cases name the tmux server.
- The question, the Explorer shot: open item 787 (automode, (a)); item 2.4 writes the dictated manuscript into the copy with `\date{}`, commits it, and adds one dictated sentence left uncommitted.
- The question, the device scale: item 2.1 adds the switch `force-device-scale-factor` before ready; item 2.6 sets `useContentSize` and `enableLargerThanScreen`.
- The question, Verify 1: prettier over `package.json`, `size.test.ts` and `utils/shots` only.
- The question, Verify 2 and 6: eslint over `size.test.ts` only; the `.mjs` files are checked by `node --check` (Verify 3) and the comment-width and history checks (Verify 6); Verify 7 says what `npm run check` covers.
- Implied inputs, Electron's profile: item 2.1 sets `userData` into the scratch folder before ready; a case reads it.
- Implied inputs, top-level await: item 2 says the entry chains on `app.whenReady()`.
- Implied inputs, git identity: item 2.4 runs git with the scratch HOME, `GIT_CONFIG_NOSYSTEM=1`, a fixed identity, no signing, `init -b main` and fixed dates.
- Implied inputs, TeX: `latexmk -norc -pdf`, then `latexmk -norc -c`; the copy's manuscript has `\date{}`.
- Implied inputs, the order of writes: item 2.4 writes the workspace file before the commit.
- Implied inputs, a half-written pair: item 2.8 captures both into the scratch folder and moves them only after both are written.
- Implied inputs, the server exiting early: item 2.5 stops on the server's exit as well as at 60 s.
- Implied inputs, no display: item 2.1 checks `DISPLAY` or `WAYLAND_DISPLAY` on Linux; the head comment names the need for a display.
- Implied inputs, the Dock icon before the entry: item 2.1 hides it before any window; a brief icon from Electron's default app before the entry runs is judged at the look.
- Implied inputs, hidden-window rendering: item 2.6 sets `backgroundThrottling: false`.
- Implied inputs, `npm run build`: the premise states it writes only ignored paths.
- Implied inputs, the stand-ins' mode: item 2.3 writes them with `0o755`; the stand-in case reads the mode; item 2.1 checks that git and tmux are real.
- Implied inputs, stale files: the second-run case says a file of another name is left as it is.
- Implied inputs, the folder name: item 2.3 names the copy `demo`, and item 2.4 names the workspace folder `demo`.
- Implied inputs, editing the copy's YAML: item 2.4 re-parses the config and refuses when it does not parse or still holds `slurm`; a case reads it.
- Dictated text, line 5: rewritten as two sentences.
- Declined, the LaTeX approval: the premise states that opening a file runs no build and the approval is asked only before a build or a clean.
- Added after the check, held line by line against spec.md (ASCII, plain): the manuscript block of item 2 (`grep -n 'documentclass' agents/briefs/O193.md`) and the sentence `Its false alarm rate stays below one per thousand samples.` (`grep -n 'false alarm' agents/briefs/O193.md`); both hold.
