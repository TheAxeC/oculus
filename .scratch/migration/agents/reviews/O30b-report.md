NOT DONE: nothing is built. The first run of the cases on the unchanged tree found two places where the brief's own rules cannot give the result the cases ask for (item 1 with decision 2, and item 2), so this report is the hand-back the brief asks for, and no file of the step is changed.

# O30b report: first run, hand-back before any change

## Open items of the state file, verbatim

- Z634 (2026-10-06), Q123, the words of a new guarded entry G52. Q123's brief check found that G51's words guard input reaching the program, while the alternate-screen test guards what the page shows (Z621): an editor drawn full screen after an attach, and the shell's text and cursor back when it exits. Guarded entries carry Axel's words, so the choice is his. (a) A new entry G52, recommended, proposed as: "G52. A page that attaches to a terminal pane whose program is in its alternate screen is given the shell's text in the grid's normal buffer and the program's screen in its alternate buffer, so the program draws full screen and leaving it shows the shell's text again with the cursor where the shell left it." Code: the pane's attach under `src/lib/server/machine/pty/`. Test: written by Q123. For: the behaviour Z621 asked for is guarded by a test whose failure costs a lost shell screen. Against: one more entry. (b) Widen G51's words to cover the alternate screen. For: one entry for the attach. Against: G51 then guards two different promises. (c) No guarded test; the behaviour is checked by a quoted run and the look only. Against: nothing stops a later change from dropping it; the lazy option. Q123 is built under (a); its landing waits for the ruling.

## What the first run found that the brief's rules get wrong

### Finding 1: `--mode app` does not reach SvelteKit's post-build worker, so the build the brief specifies fails

The rule: item 1 and decision 2 say `buildServer` runs `vite build --mode app`, `vite.config.ts` is a function of the mode, and no environment variable is needed. Cases 1 and 9 type `vite build --mode app`.

The result, measured on a scratch copy of the tree (`o30b/exp1` under the session scratchpad, the worktree's source with `vite.config.ts` as a function of the mode, `sveltekit({ outDir: '.svelte-kit-app' })` under the mode `app` and `adapter({ out: 'build-app' })`, `node_modules` linked): `node node_modules/vite/bin/vite.js build --mode app` exits 1. The last lines of its output (`exp2-build.log`):

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../exp1/.svelte-kit/output/server/internal.js' imported from .../node_modules/@sveltejs/kit/src/core/postbuild/analyse.js
```

The cause, read from the installed kit 2.70.3:

- `node_modules/@sveltejs/kit/src/core/postbuild/analyse.js:42` runs `const config = (await load_config()).kit;` with no mode, and `:44` reads `join(config.outDir, 'output')`.
- `node_modules/@sveltejs/kit/src/core/config/index.js:192` resolves the Vite config for that call with `mode ?? process.env.MODE ?? 'production'`.
- `node_modules/@sveltejs/kit/src/utils/fork.js:38-43` starts the post-build as a worker thread whose environment is a copy of the parent's `process.env`, so the worker never sees the `--mode` of the command line.

The worker therefore resolves the config under the mode `production`, takes the outDir `.svelte-kit`, and looks for the build's output where the build did not write it. The same failure is what the unchanged tree shows in the first run of case 9 (below): `ERR_MODULE_NOT_FOUND ... .svelte-kit/output/server/internal.js` in the app build whenever the plain build has emptied `.svelte-kit/`.

Two ways give a build that exits 0 with `.svelte-kit-app/` and `build-app/` written and no `build/` or `.svelte-kit/`:

- `MODE=app` in the environment of the build process, beside `--mode app` (`exp3-build.log`, exit 0).
- The config function setting `process.env.MODE = mode` itself, which the worker inherits when it is started (`exp4-build.log`, exit 0, no `.svelte-kit` folder afterwards).

### Finding 2: "no tsconfig warning" under the mode `app` cannot be met with a static `tsconfig.json` and a working `npm run check`

The rule: item 2 and case 1 (second run): the app build reads nothing under `.svelte-kit/`, prints no tsconfig warning, and `npm run check` keeps working.

Two separate things read the root `tsconfig.json`:

- Vite. With only the `outDir` changed and no `.svelte-kit/` on the tree, the build fails with 104 errors, `Tsconfig not found .../.svelte-kit/tsconfig.json` (`exp1-build.log:12` reads `Build failed with 104 errors:`, and the log lists the first of them as `Tsconfig not found .../.svelte-kit/tsconfig.json`), because the root `tsconfig.json` extends that file. Vite 8.3.0 has a top-level `tsconfig` option (`node_modules/vite/dist/node/index.d.ts:3488`, "Path to the TypeScript configuration file. Relative paths are resolved from the project root", used at `node_modules/vite/dist/node/chunks/node.js:37117` and `:33961`). With `tsconfig: '.svelte-kit-app/tsconfig.json'` under the mode `app`, Vite reads that file only and the build exits 0 with no `.svelte-kit/` (`exp3-build.log`). The read of `.svelte-kit/` is removed by this option.
- SvelteKit's own check. `write_tsconfig.js:45` calls `validate_user_config`, which compares the root `tsconfig.json`'s `extends` with `<outDir>/tsconfig.json` (`write_tsconfig.js:154-189`, the notice text at `:187`) and prints `Your tsconfig.json should extend the configuration generated by SvelteKit:` followed by `{ "extends": "./.svelte-kit-app/tsconfig.json" }` when they differ. It runs at each resolution of the config, which is three times in one app build (lines 1, 11 and 535 of `exp3-build.log`: the build itself and the two post-build workers). Nothing in the `sveltekit()` options, in Vite, or in `buildServer`'s command line turns that check off; the option `kit.typescript.config` runs inside `get_tsconfig`, which `write_tsconfig.js:47` calls after the check.

The check passes when `extends` is an array holding the app's file (`write_tsconfig.js:157-160`). `exp4` (array `["./.svelte-kit/tsconfig.json", "./.svelte-kit-app/tsconfig.json"]`, `process.env.MODE` set by the config, Vite `tsconfig` option) builds with no tsconfig line in its output (`grep -in tsconfig exp4-build.log` prints nothing) and writes no `.svelte-kit/`. But a root `tsconfig.json` that extends a file that does not exist is an error for the type check: on a scratch project with `"extends": ["./a.json", "./missing.json"]`, `tsc -p` exits 2 with `error TS5083: Cannot read file '.../missing.json'`, and `svelte-check --tsconfig ./tsconfig.json` exits 1 with `ERROR "tsconfig.json" 1:1 "Cannot read file '.../missing.json'."`. `svelte-kit sync` in `npm run check` writes `.svelte-kit/` only (sync resolves the config under the mode `production`), so on a checkout where no app build has run, `npm run check` would fail with the array.

## Choices for the orchestrator, with the options, their costs and one recommendation

### Choice A: how the mode reaches kit's post-build worker

- A1, recommended: `vite.config.ts` sets `process.env.MODE = mode` when the mode is `app` (one line, with a comment saying kit's workers read `MODE`). For: the command stays `vite build --mode app`, so every case, `buildServer`, and the start test's `beforeAll` use it as the brief writes it, and a hand-typed command works; the two switches cannot disagree. Against: the config writes one key of `process.env`, which is process-wide state the spec's principles ask to avoid; the value is the mode name, which no folder is named by, and only kit's worker reads it.
- A2: `buildServer` and the start test pass `MODE=app` in the child's environment beside `--mode app`. For: no write to `process.env` from the config. Against: two switches that must agree; `vite build --mode app` typed by hand fails with the `ERR_MODULE_NOT_FOUND` above; cases 1 and 9 and the landing script must be written `MODE=app vite build --mode app`, which changes the brief's case text.
- A3, the lazy option: build with `--mode app` alone. It does not build (finding 1).

### Choice B: the tsconfig

- B1, recommended: the Vite `tsconfig` option under the mode `app` pointing at `.svelte-kit-app/tsconfig.json`; `tsconfig.json` unchanged; kit's extends notice is printed (three times per app build, in the `[build]` lines of the app's output). For: the build reads nothing under `.svelte-kit/` and exits 0 on a tree without it; `npm run check` is untouched and works on a fresh checkout; nothing generated is read by the type check that an app build could leave stale. Against: item 2's "no tsconfig warning" and case 1's second run (`grep -i tsconfig` over the output prints nothing) are not met; the amended wording would be "prints no line about a missing tsconfig, only kit's extends notice".
- B2: B1 plus the root `extends` array. For: no notice. Against: `npm run check` fails with TS5083 on a checkout with no `.svelte-kit-app/` (measured above), so it is refused.
- B3: B2 plus `check`, the quick tier and `test:warm` also running `MODE=app svelte-kit sync`, so `.svelte-kit-app/tsconfig.json` exists. For: no notice and `npm run check` works. Against: the write list widens to `package.json` and `tests/tiers/quick.mjs`; a check writes the app's folders, so DESIGN.md's sentence "folders no other command of the checkout writes" is false; and the array makes the type check read the later file's `rootDirs`, `paths` and `$app/types` entries, that is the app folder's generated types, which stay stale between app syncs.

B1 is the cheaper option here, and it is also the better one on merit: B3 ends the notice by making the type check depend on a second generated tree. If Axel wants the notice ended, B3 is the option that does it.

### What else the choice carries

- The Vite `tsconfig` option makes Vite read `.svelte-kit-app/tsconfig.json` instead of the root `tsconfig.json`, so the root file's own `compilerOptions` (`rewriteRelativeImportExtensions`, `esModuleInterop`, `strict` and the rest) are no longer what the app's transform reads. Whether the app's `build-app/handler.js` differs from `build/handler.js` for that reason is not verified; a built step would compare the two builds' file lists and hashes.
- The brief's case texts that change with the ruling: cases 1, 9 and 14 (the start test's `beforeAll` command) under A2; case 1's second run under B1.

## The cases' first run on the unchanged tree

Every command ran from `tools/oculus` in the worktree, which equals the base copy (`diff -rq` of `src tests utils docs config` and `diff -q` of `vite.config.ts tsconfig.json .gitignore .prettierignore eslint.config.js README.md HELP.md DESIGN.md` against the base copy print nothing). Scripts and logs are in the session scratchpad under `o30b/`. A server run (cases 3, 4, 5, 10, 11, 12) used a scratch world made as `start.test.ts`'s `scratch()` and `run()` make it (`world.sh`, `serve.sh`): the engine copied from `config/` without `local.yml`, a scratch `local.yml` naming a scratch `hub:` and a free `port:` (52690, 52721 and others, never 8787, 8790 or 8817), `HOME` and `TMUX_TMPDIR` under the scratchpad, started with `env -i`, stopped after the run. The lines of the scratch hub's missing folders (`watch: cannot watch`, `config: ... this document draws nothing`, `publish: unreachable|unconfigured`) are filtered from the quoted output and counted by the script.

1. `vite build --mode app`, listing with hashes of `.svelte-kit/` and `build/` before and after: exit 0 (1:23 minutes); `ls -d build-app .svelte-kit-app` prints `No such file or directory` for both; the before and after listings differ (61 lines before, 2431 after; the build rewrote `build/` and `.svelte-kit/`). Second run with `.svelte-kit/` moved to the scratchpad: exit 0, `grep -i tsconfig` over the output prints nothing, `ls -d .svelte-kit` prints `.svelte-kit` (the unchanged build writes it again); the folder was put back. Not met, as expected on the unchanged tree: the mode has no effect.
2. `vite build`, listing of `.svelte-kit-app/` and `build-app/` before and after: exit 0, both folders absent before and after, `diff` prints nothing, `build/handler.js` written (930 bytes). Met on the unchanged tree, since nothing writes those folders.
3. `node src/server.ts --engine <scratch engine> --handler <worktree>/build-app/handler.js`: prints `oculus: unknown argument: --handler`, exit status 1.
4. The four wrong forms, each in the scratch world: `--handler=` prints `oculus: unknown argument: --handler=`; `--handler=--foo` prints `oculus: unknown argument: --handler=--foo`; a path that does not exist prints `oculus: unknown argument: --handler=<that path>`; the directory `build/` prints `oculus: unknown argument: --handler=<that path>`; exit status 1 each. The flag is unknown, so none of them reaches the checks the brief asks for.
5. `node src/server.ts --engine <scratch engine>`: prints `oculus on http://127.0.0.1:52721 over hub <scratch hub>`, and `GET /api/health` answers `{"app":"oculus"}`; stopped afterwards. Met on the unchanged tree.
6. Reading `src/desktop/server/process.ts:76`: the argument list is `['--engine', options.engine, '--default-port', String(options.defaultPort)]`, no `--handler`; `src/desktop/app.ts:295`: `existsSync(join(checkout, 'build', 'handler.js'))`. Not met.
7. Not run on its own: case 9 shows it (below).
8. Reading: `.gitignore:2-3` `.svelte-kit/` and `build/`; `.prettierignore:2-3` the same; `eslint.config.js:25` `'.svelte-kit/**'`; `src/lib/server/root/watch/git.ts:80` `IGNORED = ['node_modules', '.svelte-kit', 'build', '__pycache__']`. The two new folders are in none of them. The prettier and eslint runs over the two folders are not run: the folders do not exist.
9. `case9.sh` (nine runs, second build 4, 12 and 16 s after the first build's first line, three runs each; the script and its output are in the scratchpad, `case9.sh` and `case9-first.out`): `vite build --mode app` exit status per run: offset 4 s: 1, 1, 0; offset 12 s: 0, 1, 1; offset 16 s: 1, 1, 1. `vite build` exit status: 0 in all nine. The failing app builds print `ERR_MODULE_NOT_FOUND ... .svelte-kit/output/server/internal.js` (`case9-first/off4-run1.app.log`). Not met: seven of nine app builds fail on the unchanged tree. Both builds write `.svelte-kit/` and `build/` and nothing in `.svelte-kit-app/` or `build-app/` (0 listing lines differ in both).
10. `--handler build-app/handler.js` from the worktree: prints `oculus: unknown argument: --handler`, exit status 1.
11. `--handler <missing path> --handler build-app/handler.js`: prints `oculus: unknown argument: --handler`, exit status 1.
12. `--handler <scratch file that throws>`: prints `oculus: unknown argument: --handler`, exit status 1.
13. `node case13.mjs` (imports `src/desktop/decide/args.ts` under plain Node):
    - `["--handler","<package.json>"]` gives `{"error":"unknown argument: <package.json>"}` (the flag goes to Chromium, its value is read as a positional argument);
    - `["--handler=<package.json>"]` gives `{"engine":"<checkout>"}`, no refusal;
    - `["--handler"]` gives `{"engine":"<checkout>"}`;
    - `["--engine","<checkout>"]` gives `{"engine":"<checkout>"}`.
    Not met.
14. `npx vitest run tests/server/desktop/start.test.ts -t 'prints the port in use and exits 1 when the server cannot listen' --reporter=verbose`: the row's line, with the reporter's pass mark first: `|unit| tests/server/desktop/start.test.ts > the desktop app starting and stopping > prints the port in use and exits 1 when the server cannot listen 14143ms`, `Tests  1 passed | 4 skipped (5)`. It starts no Electron.
15. Reading `config/text/desktop.yml:9`: `not_built: The oculus server is not built. Run npm run build, then start the app again.` Seen at the look on landing, not run.
16. Reading `node_modules/@sveltejs/kit/src/exports/vite/index.js:340-344`: `watch: { ignored: [`${out_dir}/!(generated)`] }`, so the dev watcher ignores everything under `.svelte-kit` except `generated` and watches `build-app/` and `.svelte-kit-app/` as ordinary folders of the root. A host-visible fact; nothing is changed for it.
17. Reading `src/desktop/app.ts:59-64`: `app.setPath('userData', join(home, 'Library', 'Application Support', 'oculus'))` and `app.requestSingleInstanceLock()` follow HOME, so two starts under two HOMEs each take a lock of their own and, after the step, share `build-app/` and `.svelte-kit-app/`.
18. `npm run check`: exit 0, `COMPLETED 3036 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
19. `sh utils/unused-exports.sh`: exit 0, 381 lines, identical to `O30b-base/unused-exports.txt` (`diff` prints nothing). The Vitest run of the function-form config is the final run's.
20. No case, as the brief says.

## State of the tree

- No file of the step is changed. The first runs rewrote `build/` and `.svelte-kit/` in the worktree (gitignored, not listed by the step's write list); `.svelte-kit-app/` and `build-app/` do not exist.
- The experiments of the findings ran in `o30b/exp1` under the session scratchpad, a copy of the worktree's source with `node_modules` linked; nothing of them is in the worktree. Their logs are `exp1-build.log` to `exp4-build.log` in the scratchpad.
- No Electron was started, no port 8787, 8790 or 8817 was used, no `local.yml` was read, and no process of another session was signalled.

## What the builder needs to continue

A ruling on choice A and choice B. With A1 and B1 the build is: `vite.config.ts` a function of the mode with `outDir`, `tsconfig` and `process.env.MODE` set under `app`, `adapter({ out })` through `oculusViteServer`, and every other item of the brief as written; cases 1 (second run) and 9 are then run with the wording "prints no line about a missing tsconfig". With another ruling the brief's items 1, 2 and the cases named above are rewritten first.
