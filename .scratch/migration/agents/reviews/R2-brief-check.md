# Brief check of R2 (`tools/oculus/.scratch/migration/agents/briefs/R2.md`)

Nothing was changed. Main is at `cd31fd9a3` (`git log --oneline -1`). Every finding below comes from a command run in this session; anything I could not run is marked "not verified".

The findings that block the build as briefed:
- **F1.** `src/server.ts` cannot parse the command line before the first part as written, because `engineDir()` comes from `config.ts`, which loads `zod`.
- **F2.** The app's first part can never report missing packages from `app.ts`.
- **F3.** The new test has no `agents/guarded.md` entry.
- **F4.** "The engine" is the wrong folder for the package check.
- **F5.** `engines` also changes `package-lock.json`, which is not on the write list.
- **F6.** No case runs `node src/server.ts` with packages missing.

## 1. Names

Commands, from `tools/oculus` and from the hub root:
- `grep -rn --exclude=local.yml "process/args\|process/port" tools/oculus` (without `node_modules` and `.scratch`)
- `grep -rn "args\.ts\|port\.ts\|parseEngineArgs\|readLocalWithDefault" src tests utils docs config DESIGN.md HELP.md README.md eslint.config.js vite.config.ts`
- `grep -rln -e "tools/oculus/src/server.ts" -e "oculus/package.json" -e "src/desktop/app.ts" -e "root/process/" -e "npm run dev" .` over the hub, with `tools`, `.git`, `.agents` and `secrets` excluded
- a grep for `predev`, `"engines"` and `first-run`

Hits:
- **On the write list:** `src/server.ts:13,18`, `src/desktop/decide/args.ts:8` (import and head comment lines 2 and 6, which name `parseEngineArgs` and stay true) and `DESIGN.md:508`. No test imports either module.
- **Outside the write list, made false by the change:**
  - `src/desktop/main.ts:6-7` imports `config.ts` and `app.ts` statically. Not false text, but the app's first part cannot work without changing it (see F2).
  - `src/lib/data/sources/config.ts:19` (`engineDir`) is needed before the check (see F1).
  - `package-lock.json`: npm writes `engines` into the lockfile's root entry, so the committed lockfile goes stale (see F5).
- **Outside the write list, not made false:**
  - The `.scratch` briefs and reviews that name `process/args` are history.
  - `package-lock.json`'s many `"engines"` hits belong to dependencies.
  - No hub doc outside `tools/` names these files (the hub grep printed only `CLAUDE.md:20`, which is unrelated).
  - `DESIGN.md:508` also says "no module finds the directory itself". `first-run.ts` run as a program finds its own checkout. That sentence needs a re-read; the brief already names `DESIGN.md` for false sentences.
- **Other steps in flight that share files** (`cmp` against each worktree):
  - D41 changes `package.json` (adds `markdown-it` and `vscode-markdown-languageserver`), `package-lock.json` and `README.md:15`.
  - D48 inserts `server.manifest_write` at `server.yml:273`, right before `server.start`.
  - D50 changes none of R2's files except `DESIGN.md`, `HELP.md` and `server.yml` (`server.carry`), on other lines. It does not touch line 508 (`diff` line list: 72, 91, 244, 272, 306, 492, 521, 547, 565, 573).
  - The brief names none of these shared paths.

## 2. The step line

`plan.md:725` and the ruling at `plan.md:1622`:
- **"a first-run check"**: What to build items 1 to 4.
- **"a small step with its review"**: the brief says "Size: a full step". This is the skill's category for a code step, but it differs from the line's wording.
- **"what a new user's machine lacks is named with its fix"**: items 1, 2, 4 and 6.
- **"before oculus starts"**: items 2 and 3 meet it. Item 4 shows the optional lacks "after the server starts" (Decision 5), which serves this part only partly. Nothing covers `npm run app` without `node_modules` (no `preapp`), and nothing covers the fourth start path `npm run preview` (`README.md:7` names it).
- **"README quickstart and demo hub's text are O33 (4)"**: excluded, correctly. Item 6's README:5 sentences document the check, not the quickstart.
- **"browser suite and `tmux_socket` dropped"**: no requirement, and none is needed. `grep -rn "tmux_socket" src tests config docs README.md DESIGN.md HELP.md utils` prints nothing.

`plan.md` has no "Goal" section (`grep -n "^## " plan.md`: Packages, Could run in parallel, Rulings, Agents, Blocked). I used the goal the prompt states.

## 3. Premises

| Brief line | Claim | Result |
|---|---|---|
| :17 | Scripts | `python3 -c ...['scripts']` prints them. `engines` is absent. No hook script, but a script named `preview` exists, which matches "pre*" literally. |
| :17 | `server.ts`, 113 lines | Holds (`cat -n` ends at 113). |
| :17 | `app.ts:84-345` | `wc -l` gives 335 lines. |
| :18 | README:5 | Matches (`sed -n 5p README.md`). |
| :18 | Start-check grep | `grep -rln -i "first.run\|preflight\|prerequisite" src utils` gives `src/lib/server/machine/usage/refresh.ts` and `src/lib/views/sources/source/save/tab-draft.svelte.ts`. Holds. |
| :19 | Imports of `server.ts` | `grep -n "^import" src/server.ts \| wc -l` gives 15. |
| :19 | Probe of imports without packages | Run from a copy of `src` with no `node_modules` under `$TMPDIR`. `config.ts` gives `Cannot find package 'zod' imported from .../snapshot/normalise.ts`. `serve.ts`, `words.ts` and `port.ts` give `'zod'`, `memories.ts` gives `'@sveltejs/kit'`, `core/words.ts` gives `'lodash-es'`. `mover.ts`, `parent.ts`, `shutdown.ts`, `build-folders.ts`, `args.ts` and `program.ts` load. |
| :19 | `ws` "through `context.ts`" | `ws` is imported by `root/socket.ts`, reached through `serve.ts`. The conclusion holds. |
| :19 | `server.ts` without packages ends in Node's error | Running `node src/server.ts` over the copy was refused by the permission classifier. The claim is not verified end to end; it is supported by the `config.ts` probe. |
| :20 | `args.ts:59,86,93,97` literals | Hold. `words.ts:8` imports `config.ts`. |
| :21 | `server.yml:275` | Holds. |
| :22 | Lockfile probe | Read in full and run. `tools/oculus`, gate, D46, D48, D50 and D53 give "wanted 522 missing 0 differ 0 optional 132". D41 gives "wanted 543 missing 0 differ 0". `D53-round0` gives "NO hidden lockfile". Holds. |
| :23 | `program.ts:110-128` | The file has 127 lines; `programPath` is at 112-122 and `onPath` at 125-127. Node-only imports hold. |
| :24 | Program constants | `GIT` (`run.ts:94`), `TMUX` (`tmux.ts:23`) and `PERL` (`lines.ts:35`) hold. **`git-message.ts:18` is `export const CLAUDE = 'claude'`**, run at `:95` with the server's own environment. Commit messages do not use `claude_bin` (premise partly wrong; see 5, case 9). `claude_bin` is used by chat terminals (`pty/start/chat.ts:113`), worktree agents (`compose.ts:187`), usage refresh (`usage/refresh.ts:206`) and schedules and tasks (`schedules/run.ts:79`, `task.ts:68`). |
| :25 | `local.ts:201` | Holds. `hub` is resolved at `local.ts:462` with no `~` expansion. |
| :26 | `app.ts` line ranges | `307-311` and `312-318` hold. `319-344` should be `319-334`. `desktop.yml` dialog keys are at 4-17. |
| :27 | Folder counts | `ls \| wc -l` gives 9 for `process`, 10 for D50's `process`, 10 for `root` and 4 for `tests/server/root`. Importers hold. |
| :28 | ADR folder | Holds (see 7). |

## 4. Cases and checks against the rules file

- **F3. No guarded entry for the new test.** `spec.md:57` says a test exists only as the test of a `guarded.md` entry, and a step needing a new entry stops for a ruling. The brief creates `tests/server/root/first-run.test.ts` (brief:69) but names no entry. `grep -n -i "first-run\|first run" agents/guarded.md` prints nothing.
- **G48's test.** `spec.md:57` also says a step touching an entry's code runs that entry's test. G48 (`guarded.md`, Code `src/desktop/` and `src/server.ts`) is tested by `tests/server/desktop/start.test.ts`. That file is tagged `@module-tag slow` and starts Electron. The brief neither runs it nor says who does, and its own "no case starts Electron" plus state demand :111 forbid the builder from doing so. The brief has to say how G48 is covered.
- **`app.ts` literals.** Case 12 and item 4 need a dialog with a Quit button before the catalog can load. That label and the dialog sentence would be literals, which `spec.md:48` forbids. Decision 3 covers only the Node and package sentences.
- **Case 12's "decision code".** The decision code cannot run under Node while it lives in `app.ts`, which imports `electron`. Factoring it out needs a new module, and `src/desktop/decide` holds 10 items (`ls | wc -l`), so it is full. No path for it is on the write list.
- **Ports.** Cases 8 and 10 let the built server listen, but the brief names no scratch port (`spec.md:38`). Case 10 also needs a build under `npm run build`, which the brief does not mention.
- **Case 5** reads "main's checkout". The builder works in the worktree (`spec.md:31`).
- **Verify 1** uses `--base <base>`, an unfilled placeholder. That form is the reviewer's (state file :6); the builder runs plain `npm run test:quick`.
- **Missing base copy.** The brief names no base copy or base `unused-exports.txt`, which `spec.md:32` and `:85` need. D50's brief names `D50-base` at its :21.
- **DESIGN.md.** The brief names no `DESIGN.md` section to read (`spec.md:7`) and confines `DESIGN.md` to line 508. The required/optional rule and the installed-packages rule are decisions that `spec.md:68` sends to `DESIGN.md` ("Decisions taken", `DESIGN.md:451`).
- **Places the step does not change.** Case 6's second half re-checks the `args.ts` refusal. That is legitimate, because the start order changes. No other case asks to check, quote or explain a place the step does not change.

## 5. The question (could it pass without the goal being reached?)

- **Step line's check:** yes, through the gaps below.
- **Case 1:** yes. It feeds the string "22.12.0" to a function. On a real Node 22.12 or Node 20, `node src/server.ts` and `node .../first-run.ts` should fail on the `.ts` extension before any line runs, since type stripping runs without a flag only from 22.18 and 23.6. That is not verified: only v23.11.0 and v24.21.0 are installed (`ls ~/.nvm/versions/node`), and `~/.nvm/versions/node/v23.11.0/bin/node p.ts` ran a `.ts` file with an ExperimentalWarning. In the app, `process.versions.node` is Electron 44.5.1's own Node, so `nvm install 24` is not the fix there.
- **Cases 2 and 3:** yes. The unit rows pass even if `server.ts` passes `parsed.engine` to `installLacks`, and a scratch `--engine` holds no `package-lock.json` (see F4).
- **Cases 4, 5, 7, 10, 13:** no; each is a direct run or row of what it claims.
- **Case 6:** no.
- **Case 8:** yes for git. `/usr/bin/git` exists on every Mac as the Command Line Tools stub (`ls -l /usr/bin/git` shows 78 links). `onPath('git')` is therefore true on a new Mac without the tools, where git does not run. The right fix there is `xcode-select --install`; Homebrew itself needs those tools.
- **Case 9:** yes. With `claude_bin` set to an absolute path and no `claude` on PATH, commit messages fail (`git-message.ts:18,95`) while the check reports nothing.
- **Case 11:** partly. `npm run predev` shows the script. That `npm run dev` runs it is shown by npm's `lib/commands/run.js:125-132`, which skips pre-scripts under `ignore-scripts` (`config.md:878-884`).
- **Case 12:** yes (F2). A scratch run of the decision code passes while the real app never reaches it.
- **Case 14:** read only; no run can show it.
- **Item 1:** yes, as for cases 1, 2 and 8.
- **Item 2 (F6):** yes. No case runs `node src/server.ts` with packages missing, so a remaining static import (for example `engineDir`) would pass every case.
- **Item 3:** see case 11.
- **Item 4:** yes (F2).
- **Item 5:** no. A probe in `$TMPDIR/r2engines` (no dependencies, engines `>=99`) printed `npm warn EBADENGINE Unsupported engine` on both `npm install` and `npm ci` under npm 11.19.0.
- **Item 6:** no.

## 6. Implied inputs the Cases never state

1. **(F4) `--engine` naming a folder other than the checkout.** This has happened: G48's `scratch()` copies only `config/` (`start.test.ts:70-88`), and the brief's own scratch engines do the same. Expected: the packages are checked over the checkout the code runs from (`engineDir()`), and the hub is read from the engine's `local.yml`.
2. **Node below 22.18 or 23.6.** Expected: a sentence naming Node 24 and `nvm install 24`. A `.ts` entry cannot give it; it needs a `.mjs` or `.js` launcher. Not verified, as in 5.
3. **`npm run app` with no `node_modules`.** Expected: a line naming `npm ci`. Today `electron` is missing and `src/desktop/main.ts`'s static imports fail. **The packaged app with packages missing:** expected a dialog; today `main.cjs`'s `import(...)` rejects with no handler (`package.ts:44-48`).
4. **macOS without Command Line Tools:** expected a git lack with `xcode-select --install`.
5. **The app's Node is Electron's:** expected no Node lack in the app, or a check of the Node that runs npm.
6. **`claude_bin` set while `claude` is not on PATH:** expected a lack for commit messages.
7. **A packaged app whose login shell is slow.** The app's environment has a bare PATH, so `env_slow` and a lack sheet naming tmux and claude would both show. Expected: one sheet.
8. **`ignore-scripts=true`:** `predev` is skipped and Vite starts. `npm config get ignore-scripts` prints `false` here.
9. **`npm run preview`:** expected checked, or excluded in words.
10. **`local.yml` absent:** the hub defaults to two folders above the engine. Expected: no lack when that folder exists.
11. **`hub: ~/x`:** resolved under the engine (`local.ts:462`). Expected: the lack names the resolved path.
12. **A Node pre-release string such as `25.0.0-nightly...`:** expected no lack.
13. **A symlinked `node_modules` in a scratch copy:** expected no lack, since `.package-lock.json` is read through the link. The worktrees have real folders (`ls -ld`).
14. **The server forked by the app runs both parts again:** expected the same lacks, printed only to the app's output.
15. **pnpm, yarn or bun:** they write no hidden lockfile. Expected: a refusal naming `npm ci`. Not known to have happened.

There is no workspace layout to cover: the hub root has no `package.json` (`ls` fails), and `workspaces` is `None`.

## 7. ADRs

`find tools/oculus -name adr -type d -not -path "*/node_modules/*"` prints nothing. There are no ADRs.

## 8. Dictated text

Command: `grep -n '"predev"\|"engines"\|prefixed \`oculus: \`\|nvm install 24\|brew install\|\`npm ci\`\|npm run build\|installLacks\|machineLacks' agents/briefs/R2.md`

| Brief line | Text | Verdict |
|---|---|---|
| :40 | `"predev": "node src/lib/server/root/process/start/first-run.ts"` | Holds. |
| :44 | `"engines": { "node": ">=24", "npm": ">=11" }` | Holds as text. It also needs the lockfile root entry (F5). |
| :38 | Prefix `oculus: ` | Holds; matches `server.ts:35`. |
| :33 | Fixes `nvm install 24` and `npm ci`; names `installLacks(engine)` | Holds. |
| :34 | `machineLacks(...)` | Holds. |
| :100 | `brew install tmux`, `brew install git` | Holds against the rules file. For git on a Mac without the tools, it is the wrong fix (see 5, case 8). |
| :36 | `node src/lib/server/root/process/start/first-run.ts` | Holds. |

None of these lines breaks an ASCII, prose or negation-contrast rule.

## Other

The four judgments asked for:

- **The order in `src/server.ts`:** it cannot be built as briefed (F1). Parsing needs `fallback: engineDir()` (`server.ts:12,30`), and `config.ts` cannot load without `zod` (probe above). `engineDir` has to move into a module with only `node:` imports, with `config.ts` re-exporting it. `config.ts` is not on the write list. The same need arises for `first-run.ts` as a program: it may import only `node:` modules and `program.ts`, so it would have to derive the checkout a second time, against the DRY rule (`spec.md:85`). The rest of the order can be built: `parent.ts`, `mover.ts` and `shutdown.ts` load without packages, and `memories.ts` (`BODY_LIMIT_BYTES`), `config.ts`, `context.ts`, `serve.ts`, `port.ts` and `words.ts` must become `await import(...)` before the body-size line and the handler.
- **`onPath` with an environment's PATH:** yes. `onPath(program, env = process.env)` is at `program.ts:125`. A probe returned `false` for `{PATH: ''}` and `true` for `{PATH: '/usr/bin'}` with `git`. Two limits: a path with a slash resolves against `process.cwd()` (`:114`), and an empty PATH entry is skipped (`:119`).
- **The app's first part before its build:** no (F2). `main.ts:6-7` and `app.ts:18-19` statically import `config.ts` and `words.ts`, which fail on `zod`, so no line of `app.ts` runs. The first part has to run in `main.ts`, before a dynamic import of `app.ts`, with literal dialog text. `main.ts` is not on the write list.
- **`predev` under npm 11.19.0** (`npm --version`): it runs. `run.js:125-132` prepends `pre${event}` unless `ignore-scripts` is set, and a non-zero exit stops the loop, so `dev` does not start.

Further findings:

- **F5.** npm writes `engines` into the root entry of `package-lock.json`. Shown by `shrinkwrap.js:95` and by the probe lockfile's root, which printed `{'name': 'probe', 'version': '1.0.0', 'engines': {...}}`. Main's root entry has no `engines` (`['name', 'version', 'dependencies', 'devDependencies']`). `package-lock.json` must join the write list, or the next `npm install` rewrites the committed lockfile.
- **`claude_bin` description.** The brief's list of what needs `claude_bin` follows `README.md:13`. Both leave out chat terminals, worktree agents and usage refresh, and the brief counts commit messages, which use the literal `claude`.

## Declined to judge

- How Node 22.12 and Node 20 behave on `.ts` files: no such Node is installed here, so stated from knowledge only.
- The end-to-end run of `node src/server.ts` without packages: refused by the permission classifier.
- Electron 44.5.1's bundled Node version: I would have to start Electron, which this check may not do.

## Usage

Agent id not visible. Model `claude-opus-5-5`. About 215,000 tokens of context, read from the remaining budget. About 80 tool uses. Minutes not visible.

Usage (the orchestrator, from the completion notice): a57eea66538e91df5, claude-opus-5-5, 224,420 tokens, 82 tool uses, 12.2 min.
