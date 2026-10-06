## Refutation of O30b (oculus/migration), worktree `.agents/worktrees/O30b`, base dff7539f4

**Verdict:** all eight items hold. Every case I was allowed to run is met. No finding needs another repair round. There are two Spec findings, two Proof findings, three Standards findings and one Behaviour finding. All are small and can be fixed at landing.

I ran the two read-only git commands, from the worktree:
- `git diff dff7539f4` covers 25 tracked files, +300/-156.
- `git status --short` (run at the start and again at the end) shows the same 25 `M` files and the same two `??` files: `src/lib/server/root/process/build-folders.ts` and the report. My build runs changed nothing that git tracks.

What I could not run: case 14 (row 4 of `start.test.ts`), because that row binds port 8817, which my rules forbid. Case 15 is left for the look at landing.

Machine conditions: the load average was 15 to 23 for most of the review. The machine rebooted during the pause (`uptime` showed "up 7 mins" at 13:40). The pause also emptied my scratchpad, so I recreated the case 9 scripts from the report and ran case 9 again in the foreground. That rerun is all nine runs reported below.

## Checks rerun

- **Diagrams:** `npm run diagrams` exits 0. A shasum of `docs/diagrams/*` is the same before and after, so the committed diagrams match the source. `diff -rq <base>/docs/diagrams docs/diagrams` lists only `layers.dot` and `layers.svg`. The one changed line in `layers.dot` is "desktop to server" going from 6 to 8, which is the two new imports of `build-folders.ts`. "src to routes" stays 1, so the reader still counts the entry's load of the routes.
- **`npm run test:quick`:** prettier, the ASCII gate, eslint and svelte-check all print `ok` (`COMPLETED 390 FILES 0 ERRORS`). Vitest failed with 4 tests at `Test timed out in 5000ms` while the load was 23. The four files are `app-files`, `file-undo`, `app-gate` and `schedules/watch`; the step changes none of them. Run alone, all four pass: `Test Files 4 passed (4)`, `Tests 54 passed (54)`. Under spec.md these timeouts are not the step's.
- **Tree checks:** `npx vitest run tests/checks/diagrams tests/checks/source tests/checks/tree tests/checks/imports --testTimeout 0 --hookTimeout 0` gives `Test Files 11 passed (11)`, `Tests 146 passed (146)`.
- **Unused exports:** `sh utils/unused-exports.sh` exits 0, and its output is identical to the base's `unused-exports.txt` (`diff` prints nothing).
- **Character set:** the ASCII gate (the perl pipeline of spec.md:97) prints 0 lines. `LC_ALL=C grep -n '[^ -~]'` over README, HELP, DESIGN, `vite.config.ts`, the three ignore files, `imports.mjs` and the report exits 1, meaning no hits.
- **Folder limit:** `sh utils/folder-check.sh` exits 0.
- **History words:** grepping the added lines for the spec.md:42 words finds hits only in prose and code the base already had. These are DESIGN.md:135/398, HELP.md:186, README.md:9, and `server.ts:22`, whose "before" is the base's own line. None is a defect.
- **File size:** the largest file written is `diagrams.test.ts` at 867 lines.
- **The brief's verify grep, item 4:** it prints 93 lines, the same count as the report. I checked how the report sorts each hit and agree.
- **`npm run check`:** `COMPLETED 3037 FILES 0 ERRORS 0 WARNINGS`. This covers case 18.
- **Installed mechanisms, read in `node_modules`:**
  - Vite 8.3.0, `index.d.ts:3488`: `tsconfig?: string`.
  - Kit 2.70.3, `types/index.d.ts:599`: `outDir?: string`.
  - `analyse.js:42`: `load_config()`.
  - `config/index.js:192`: `resolveConfig({}, 'build', mode ?? process.env.MODE ?? 'production')`.
  - `utils/fork.js`: the worker is started with `env: {...process.env}`.
  
  These match Ruling A1, Ruling B1 and the comment at `vite.config.ts:21-25`.

## Builds, rerun

- **Case 1a:** I listed `.svelte-kit` and `build` with hashes, ran `vite build --mode app` (exit 0), and listed again. `diff` exits 0 with 0 lines (3169-line listing). SvelteKit's tsconfig notice prints 3 times.
- **Case 1b:** I moved `.svelte-kit/`, `build-app/` and `.svelte-kit-app/` to the scratchpad and ran the app build. It exits 0. There are 0 tsconfig lines other than the notice, and 0 `ENOENT` or "not found" lines. `ls -d .svelte-kit` fails with exit 1. So the app build reads nothing under `.svelte-kit/`. I put `.svelte-kit/` back afterwards.
- **Case 2:** `vite build` exits 0. `diff` of the `.svelte-kit-app` and `build-app` listings exits 0 with 0 lines (2431-line listing).
- **Ruling check, `build-app/` against `build/`:** `compare-builds.mjs build-app build` prints `files: 1645 and 1645; without a partner: 0 and 0`. `diff build/handler.js build-app/handler.js` differs only on lines 5-7 and 19, which are the four hashed chunk names. This matches the report's account.
- **Case 9, nine runs, each in the foreground:** I first made fresh lone app and plain builds (both exit 0) as the reference copies, then ran `case9.sh <worktree> <out> ref 1 <offset>` once per run, three runs each at offsets of 4, 12 and 16 s.
  - Every run printed `exit statuses: vite build --mode app = 0, vite build = 0`.
  - `build-app` and `build` against their lone copies: 1645 and 1645, 0 and 0, in every run.
  - `build-app` against `build` of the same run: 0 and 0 in every run.
  - Modification times outside the owning build: 0 for `build-app`, `.svelte-kit-app` and `build`. `.svelte-kit` shows 738, the same as the lone build: files from an earlier `svelte-kit sync` that the build does not touch.
  - The start and end times show the two builds overlapping in every run.
  - The files without a partner are `ambient.d.ts` and `output/client/.vite/manifest.json` (one run had only `ambient.d.ts` in `.svelte-kit`). After sorting, `ambient.d.ts` has the same lines in another order, and the manifests are equal: a python comparison printed `491 491 True`.

## Server runs, rerun

Each run used a scratch world made with `serve.sh`: the engine copied from `config/` with `rsync --exclude=local.yml`, a scratch `local.yml`, `HOME` and `TMUX_TMPDIR` under the scratchpad, started with `env -i`, ports 61241-61247 checked free first. I stopped each server when its run ended.

- **Case 3:** `oculus on http://127.0.0.1:61241`, health answers `{"app":"oculus"}`.
- **Case 4, each exit 1:**
  - `--handler=`, `--handler=--foo`, and `--handler` with no value: `oculus: --handler needs the file that holds the handler`.
  - A missing path: `oculus: <r>/nope.js is no file, so there is no handler to load`.
  - A directory: `oculus: <checkout>/build-app is no file, so there is no handler to load`.
- **Case 5:** no `--handler` serves health. The default comes from `server.ts:53-54`.
- **Case 10** (relative path), **case 11** (missing path, then `build-app/handler.js`): both serve health.
- **Case 12:** `oculus: the server handler <r>/throws.js could not be loaded: handler blew up`, exit 1.
- **Row 4's behaviour on a scratch port** (holder on 61247, server started with `--handler`): `oculus: port 61247 is in use`, exit 1. This reproduces the row's behaviour; the test itself was not run.
- **Case 13 probe** (`parseAppArgs` under plain Node): `["--handler",pkg]` and `["--handler=pkg"]` both give `{"error":"unknown argument: --handler"}`, and `--engine` alone passes.
- **Case 8:** `npx prettier --check --ignore-path .prettierignore build-app .svelte-kit-app` exits 0. `npx eslint build-app .svelte-kit-app` exits 2 with "all of the files matching the glob pattern "build-app" are ignored".

## Verdict per item of "What to build"

1. **Holds.** `buildServer` runs `[vite,'build','--mode',APP_MODE]` (`build.ts:22`). `vite.config.ts` is `defineConfig(({mode}) => ...)`, with `outDir: folders.kit` and `oculusViteServer(engineDir(), { out: folders.adapter })`, which ends in `adapter({ out })`. `process.env.MODE` is set under Ruling A1.
   - The `test` block is not byte for byte the base's. With the `//` markers and whitespace removed, the words are identical (my token diff shows only `[{` against `[ {` from prettier's reflow).
   - I accept the rewrap. With the extra 4-space indent the base comment lines would pass 100 columns (G23), and prettier breaks the `tags` line.
2. **Holds**, under Ruling B1: Vite's `tsconfig` option points at `.svelte-kit-app/tsconfig.json`, and `tsconfig.json` is unchanged. Proven by case 1b.
3. **Holds:** `args.ts:90-110`, `server.ts:51-63`, and `process.ts:79-86` passes `--handler`.
4. **Holds:** `OWN_FLAGS` gains `--handler`, refused at `decide/args.ts:38`, and the head comment names it.
5. **Holds:** `app.ts:298` checks `build-app/handler.js`, and `desktop.yml:9` has the brief's sentence.
6. **Holds:** `.gitignore:4-5`, `.prettierignore:4-5`, `eslint.config.js:27-28`, `git.ts:80-87`, `query.ts:37`. I grepped every `node_modules` list in `src`, `utils` and `tests` (`project-files.ts` `SKIP_DIRS`, `fs.ts` `SKIPPED`, the tier scripts). None names `build` or `.svelte-kit`, so no other list needed the new names.
7. **Holds**, with the gaps in findings S2, P1 and St1. Every listed text is rewritten and true. On the `imports.mjs` change: `pathOf` follows a conditional to the branch that is a URL, and follows an identifier already bound to one. The real `server.ts` still draws src to routes as 1 with no dashed box for it, and `graphs.mjs` needed no change. I accept the change; the diagrams test became an `it.each` table with one row per form, as the brief asked.
8. **Holds:** `start.test.ts:58-61` builds `build-app/` with `--mode app` when `HANDLER` is missing, and row 4 passes `--handler HANDLER` (`:312-318`).

## Verdict per case

| Case | Verdict | Evidence |
|---|---|---|
| 1 | met | as reworded by B1; see Builds |
| 2 | met | see Builds |
| 3 | met | see Server runs |
| 4 | met | see Server runs |
| 5 | met | health served; default path read at `server.ts:53` |
| 6 | met | `process.ts:79-86`, `app.ts:221` |
| 7 | met | through case 9 |
| 8 | met | see Server runs |
| 9 | met | 9 of 9 runs exit 0 for both builds |
| 10 | met | see Server runs |
| 11 | met | see Server runs |
| 12 | met | see Server runs |
| 13 | met | see Server runs |
| 14 | not verifiable | the row binds 8817, forbidden to me; its behaviour reproduced on 61247 |
| 15 | not verifiable | left to the look at landing |
| 16 | met | kit `exports/vite/index.js:340-344` ignores only `${out_dir}/!(generated)` |
| 17 | met | `app.ts:59-63`: `userData` and the lock follow HOME |
| 18 | met | `npm run check`, 0 errors |
| 19 | met | Vitest loads the function config; `unused-exports` exits 0 |
| 20 | not applicable | owned by Q124 |

## Findings

### Spec

**S1.** `src/lib/server/root/process/build-folders.ts` (new, 12 lines) is not in the brief's write list ("Paths this step writes").
- The report's file table marks it `| ... build-folders.ts (new) | 12 | in |` (report:337). Its reason appears only under judgment calls (:367).
- Failure: the orchestrator's check of the diff against the write list passes a path nobody listed. It also missed the shared-path judgment against the steps in flight. I found no other in-flight step that writes it, so the risk is low.

**S2.** DESIGN.md is edited outside its listed ranges "38-81 and 436".
- The edits are at :135 (the Search paragraph's skip list), :188 (the diagram sentence, which item 7 names), and :398 (`It also takes --handler <file> ... and a handler that is no file are each refused`). The report marks all of DESIGN.md "in" (report:357).
- The edits themselves are needed, since the old text would be false.
- Failure: the `shared_paths` judgments for Q123, E4g and D23 cover :375, the tree and :436 only. A step in flight that edits the `--engine`/`--default-port` paragraph (:396 at the base) or the Search paragraph meets an unforeseen conflict at landing.

### Proof

**P1.** The file table's "in the write list" column is wrong for S1 and S2, so the table does not mark every path outside the list with its reason, as spec.md requires.

**P2.** The report states something false at :297: "the names of the shared folders are written once, in `vite.config.ts:20`".
- `'build'` also appears at `src/server.ts:53` (`'../build/handler.js'`), `git.ts:84` and `start.test.ts`. `.svelte-kit` appears in `query.ts:37`, `git.ts:82` and the ignore files.
- No decision rests on it, but it repeats the false head comment in St1.

The `landing.mjs` judgment (report:369) does not quote the lane's code (`landing.mjs:24-32`), which the brief's item 7 asked for. The comment itself is true. It does not say in so many words that the app's build no longer gives the lane its order; a reader has to infer that from "folders neither the type check nor the build writes".

The report says the unmatched `ambient.d.ts` comes from differing variable names. In my runs it had the same lines in another order. No decision rests on this.

### Standards

**St1.** `build-folders.ts:5-6` says: "vite.config.ts, the desktop host and the start test read the names from here, so each name is written once."
- This is false. `build-app` and `.svelte-kit-app` are written as literals again in `git.ts:82-85` (`IGNORED`) and `query.ts:37`.
- `git.ts` sits in the same layer and could import `APP_FOLDERS`. `query.ts` is layer 1 and cannot.
- The non-app pair `{ kit: '.svelte-kit', adapter: 'build' }` is written in `vite.config.ts:20` instead of beside `APP_FOLDERS`.
- Failure: a rename of the app folders edits `build-folders.ts` only, as the comment promises. The git watcher and search then go on skipping the old names.
- Fix: correct the comment, or make `git.ts` read `APP_FOLDERS` and put the default pair in `build-folders.ts`.

**St2.** `config/text/server.yml:102` adds `handler_failed` after `port_in_use` in the `start` group. Every other group in that file (`git`, `task`, `chat`) is in alphabetical order. This is a convention, not enforced by any check.

**St3.** The reader `isFile: (path) => statSync(path, { throwIfNoEntry: false })?.isFile() === true` is written twice, at `src/server.ts:32` and `src/desktop/app.ts:85`.
- `join(checkout, APP_FOLDERS.adapter, 'handler.js')` is also computed twice, at `app.ts:221` and `app.ts:298`.
- `diskFs.isFile` already exists at `src/lib/server/machine/apps/open.ts:42`. The report quotes no grep for an existing helper, which spec.md's principles require.
- The duplication follows the base's existing duplicated `hasConfig` lambda, and the duplication check (G21) passes.

### Behaviour

**B1.** The app answers a `--handler` with a bad value with the server's file sentence, not the refusal.
- My probe: `["--handler","/nonexistent/x.js"]` gives `{"error":"/nonexistent/x.js is no file, so there is no handler to load"}`.
- Failure: someone starting `oculus.app --handler /typo` is told to fix the path, and is refused with `unknown argument: --handler` once the path is right.
- This matches the base's answer to `--default-port abc` (`--default-port needs a port number`), and item 4 asked for "as it refuses `--default-port`". So it is consistent, not a regression.

No other behaviour findings. Ruling A1's `process.env.MODE` is set only under `--mode app`, in the build's own short-lived process. `oculusViteServer` has no side effects at construction (`vite-plugin.ts:45-87`), so building it per config resolution is harmless. The sharing of `build-app/` by two starts under two HOMEs (case 17) is stated in DESIGN.md:438 ("under the same HOME") and in the report.

## Declined to judge

- **Case 14, the test row itself:** it binds port 8817, which my rules forbid. The builder's two quoted runs (`1 passed | 4 skipped (5)`) are unreproduced. I reproduced its behaviour on scratch port 61247.
- **Case 15:** the `not_built` dialog of a packaged app is seen at the look on landing. I only checked the catalog sentence.
- **The builder's case 5 run with `build/` moved away** (the `handler_failed` line for the default path): I did not move `build/`. Case 12 shows the same catalog path for a flag file, and `server.ts:51-61` covers both paths with one `try`.
- **The rest of `npm run test:quick`:** after the four timeouts I did not run the whole tier again, since spec.md says a failure outside the step's files is not rerun as a whole.

## Usage

claude-opus-5-5; tokens and tool-use count not visible to me (about 80 tool calls); about 3.5 hours of wall time including the pause, most of it the builds of cases 1, 2 and 9 under load. Scratch scripts and logs: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/r/`.
