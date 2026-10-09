# Step R2 refuter report (on .agents/worktrees/R2, base 5120f89cf)

A page this report cites is named with its section. A finding in code keeps its `file:line`. Every command ran from `tools/oculus` in the worktree, or from a scratch folder under `$TMPDIR/r2rev`, with `HOME=$TMPDIR/r2rev/home`. No output filter is named in `agents/spec.md` or the state file (`grep -n -i "filter" agents/spec.md` prints nothing), so the output is quoted unfiltered.

## Verification (rerun by the reviewer)

```
$ npm run test:quick            (worktree, no paths given; the tool reads the changed files from git)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (24.1 s)
ok      svelte-check (27.4 s): 1791579390008 COMPLETED 451 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (40.7 s): Duration  36.35s (transform 66.62s, setup 0ms, import 86.16s, tests 52.49s, environment 668ms)
test:quick: 41.2 s (limit 45.0 s); every command passed

$ npx vitest run tests/server/root/first-run.test.ts tests/checks/source/keys.test.ts tests/checks/tree tests/routes/git/git.test.ts tests/routes/git/untracked.test.ts tests/checks/diagrams tests/checks/imports --testTimeout 0 --hookTimeout 0
 Test Files  11 passed (11)
      Tests  138 passed (138)

$ npx vitest run tests/server/root/first-run.test.ts --reporter=verbose
 Test Files  1 passed (1)
      Tests  10 passed (10)
(row times 46, 13, 14, 5, 14, 20, 48, 462, 27, 24 ms)

$ sh utils/folder-check.sh; echo "folder-check exit=$?"
folder-check exit=0

$ wc -l <every changed source and test file> | sort -n | tail
 776 src/lib/state/boards/collection.ts   (largest; first-run.ts 236, app.ts 353, server.ts 146, first-run.test.ts 170)

$ sh utils/unused-exports.sh > unused.txt; diff R2-base/tools/oculus/unused-exports.txt unused.txt
1c1
< Unused exports (245)
> Unused exports (246)
76c76
< src/lib/server/git/git-message.ts: CLAUDE, TIMEOUT_MS
> src/lib/server/git/git-message.ts: TIMEOUT_MS
101a102
> src/lib/server/root/process/start/first-run.ts: installLacks, reportLacks
(both are imported by src/server.ts:23,25, which knip does not read as an entry; the base list
 shows the same for createServerContext, serverMover and parentOf, src/server.ts's other imports)

$ LC_ALL=C perl -ne '<the spec's ASCII gate>' $(find src tests config -type f ! -name local.yml)
(prints nothing; bin/ does not exist in this tree)
$ LC_ALL=C grep -c '[^ -~]' README.md DESIGN.md docs/configuration.md package.json .npmrc package-lock.json
0 for each

Verify 4, the G73 test on the unchanged tree: R2-base/tools/oculus copied to $TMPDIR/r2rev/basecopy
(src, tests, config, package.json, the worktree's vite.config.ts and tsconfig.json, node_modules linked),
the test file added:
$ npx vitest run tests/server/root/first-run.test.ts
 FAIL  |unit| tests/server/root/first-run.test.ts [ tests/server/root/first-run.test.ts ]
Error: Cannot find module '../../../src/lib/data/places/engine-dir.ts' imported from .../basecopy/tests/server/root/first-run.test.ts
 Test Files  1 failed (1)
      Tests  no tests

Case 5: installLacks('<worktree>/tools/oculus', process.versions.node)
case5 installLacks(worktree, process.versions.node=24.21.0): []

Case 6: cd $TMPDIR/r2rev/nonm (src, config without local.yml, package.json, package-lock.json, .npmrc; no node_modules)
$ node src/server.ts --default-port 8811
oculus: The packages are not installed in /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/r2rev/nonm. Run npm ci in /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/r2rev/nonm.
exit=1        (lsof -iTCP:8811 -sTCP:LISTEN rc=1 before and after)

Case 7: cd $TMPDIR/r2rev/full (the same, node_modules linked to the worktree's, no build/)
$ node src/server.ts --default-port 8811
oculus: the server handler /private/var/folders/.../r2rev/full/build/handler.js does not exist; run npm run build in /private/var/folders/.../r2rev/full to make it
exit=1
$ node src/server.ts --default-port 8811 --handler $R/nothere.js
oculus: /var/folders/.../r2rev/nothere.js is no file, so there is no handler to load
exit=1        (8811 free before and after)

Case 8: --engine scratch engines whose local.yml is "hub: <missing>\nport: 8811" and "hub: <a file>\nport: 8811"
oculus: /var/folders/.../T//r2rev/nothere is not a folder, so there is no research hub to read. Set hub in /var/folders/.../r2rev/enga/config/local.yml to the folder of the research hub.
exit=1
oculus: /var/folders/.../T//r2rev/hubfile is not a folder, so there is no research hub to read. Set hub in /var/folders/.../r2rev/engb/config/local.yml to the folder of the research hub.
exit=1        (no handler line: the start ended before the handler)

Case 9: node run.mjs (spawns node src/server.ts --engine engc, env {HOME, PATH=/var/empty}, ends it after "oculus on")
err: oculus: git was not found, so Source Control and History do not work. Run xcode-select --install.
err: oculus: tmux was not found, so the terminals and their sessions do not work. Run brew install tmux.
err: oculus: perl was not found, so the line counts of the Status view do not work. Perl comes with the macOS Command Line Tools; run xcode-select --install.
err: oculus: claude was not found, so the chat terminals, the worktree agents, the usage refresh, the schedules and tasks, and the suggested commit messages do not work. Install the Claude CLI from https://code.claude.com/docs/en/setup, or set claude_bin in /var/folders/.../r2rev/engc/config/local.yml to its path.
(config and watcher notes of the empty scratch hub)
out: oculus on http://127.0.0.1:8811 over hub /var/folders/.../T//r2rev/hub
exit code=0 signal=null endedByRun=true      (8811 free before and after)

Cases 10, 11, 16 (probe.mjs importing the worktree's first-run.ts, words.ts, git-routes.ts):
10a abs path outside PATH: []
10b name not on PATH: [["claude",false,"claude-elsewhere was not found, so ... or set claude_bin in .../engc/config/local.yml to its path."]]
11 runner 1: [["git",false,"git is the macOS stub at /usr/bin/git and the Command Line Tools are not installed, so Source Control and History do not work. Run xcode-select --install."]]
11 runner calls: ["xcode-select -p"]
11 runner 0: []
11 platform linux, runner 1: []
16 app own env: [["tmux",false,"tmux was not found, so the terminals and their sessions do not work. Run brew install tmux."]]
16 server env: []
10c status 200 {"ok":true,"output":"stub message"}   (handleGit POST action suggest, claudeBin = a recording stub outside PATH, diff stubbed)
record.txt: "args: -p Write the commit message for the staged diff on stdin. ..." then "diff --git a b"

Case 12: the changed server (full/) and the base server (basecopy/), same engine engc (port 8811), same build/ (the worktree's, linked), same HOME:
wc -l: 22 c12-after.txt, 22 c12-before.txt; diff: IDENTICAL
$ cd full; node src/lib/server/root/process/start/first-run.ts   -> prints nothing, exit=0

Case 13: cd nonm; npm run predev | preapp | prepreview
> node src/lib/server/root/process/start/first-run.ts
oculus: The packages are not installed in /private/var/folders/.../r2rev/nonm. Run npm ci in /private/var/folders/.../r2rev/nonm.
predev exit=1 / preapp exit=1 / prepreview exit=1

Case 14: npm ci --dry-run in a scratch copy of package.json, package-lock.json, .npmrc
Node 23.11.0: npm error code EBADENGINE ... npm error notsup Required: {"node":">=24","npm":">=11"} ... Actual: {"npm":"10.9.2","node":"v23.11.0"}; node23 exit=1
Node 24.21.0: added 557 packages in 530ms; node24 exit=0

Other reruns of the report's evidence:
- moved files: diff R2-base hub-address.ts places/hub-address.ts rc=0; diff args.ts start/args.ts rc=0; diff port.ts start/port.ts prints only line 8 (the relative import).
- boundaries.test.ts comment, word by word against the base: one difference, `data/hub-address`, -> `data/places/hub-address`,.
- package-lock.json packages[""] keys: ['dependencies','devDependencies','engines','name','version'] {'node': '>=24', 'npm': '>=11'}.
- the Node bundled in the cached Electron 44.5.1 zip (unzip -p of the framework binary, grep): "nodejs.org/download/release/v24.21.0", so the server the app forks passes the Node check.
- greps for the old paths (process/args, process/port, data/hub-address) over src tests utils docs DESIGN.md HELP.md README.md config: no hit.
- lsof -iTCP:8811 -sTCP:LISTEN after the last run: rc=1. git status --short at the end: the same list as at the start.
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. `src/lib/data/places/engine-dir.ts` imports `node:fs`, `node:path`, `node:url` only; `config.ts:15` re-exports it; both head comments say where it lives; case 6 shows it loads with no packages.
- 2: holds. `first-run.ts` with `installLacks`, `packageLacks`, `machineLacks`, `machineFacts`, `reportLacks` and the program; args.ts and port.ts moved with only port.ts:8 changed; DESIGN.md:509 changed. Its one extra import is `import type { Words }`, erased at run time (case 13 runs it with no packages).
- 3: holds. `src/server.ts:35-66` parses, runs the first part over `engineDir()`, loads the six modules with `import()`, runs the second part before the handler; `handler_not_built` at :83-86 (cases 6 to 9, 12). See Behaviour 2 for an unreadable hub.
- 4: holds. The three `pre*` scripts (case 13). See Behaviour 3.
- 5: holds, by reading (`main.ts:14-33`, `app.ts:320-353`) and through `machineLacks` (case 16); no dialog was seen (Electron not started).
- 6: holds as written (case 14, the lockfile root entry, `.npmrc`). See Behaviour 1: `engine-strict` also refuses an install over a dependency's own `engines` range.
- 7: holds. `git-message.ts:58,63,87,96`, `git-routes.ts:195,305,312,451`, `+server.ts:22` (case 10c).
- 8: violated, Spec 1 (README sentences). The catalog keys are read (keys.test.ts passes); DESIGN.md:511 sits under "Decisions taken" (:451); docs/configuration.md and README:13 were rewritten. The `claude_bin` description in the options catalog was not (Standards 1).

Cases of the brief's "Cases":

- 1: met, G73 rows 1 to 3.
- 2: met, row 4, and the runs of cases 6 and 13.
- 3: met, rows 5 and 6 (the sentence holds `version: 1)`).
- 4: met, row 7.
- 5: met, `installLacks(worktree, '24.21.0')` gives `[]`.
- 6: met, the packages sentence, exit 1, no "Cannot find package", 8811 free.
- 7: met, both halves.
- 8: met, rows 8 to 10 and the two server runs ending before the handler.
- 9: met, four lines and the start goes on.
- 10: met, 10a, 10b and 10c through `handleGit`.
- 11: met, the injected runner, `xcode-select -p`, the `xcode-select --install` fix; none off macOS.
- 12: met, the module prints nothing, and the start output is identical to the base server's over the same engine and build.
- 13: met, each hook prints the packages lack and exits 1.
- 14: met under Node 23 and Node 24.21 (Behaviour 1 for Node 25 and Node 24 below 24.15).
- 15: met by reading `main.ts`: with a package lacking, one `say` with the literal button `Quit`, then `app.exit(1)`, and `config.ts` and `app.ts` load only in the `else` branch; the hub dialog with Quit at `app.ts:322-328` comes before `startServer` at :330.
- 16: met, `machineLacks` with the app's own environment gives `tmux` and with `{ ...appEnv, ...loginEnv }` gives none; `app.ts` passes the same `env` to `machineFacts` and `startServer`.
- 17: met by reading `app.ts:335-353`: one sheet joining `env_slow` and `desktop.dialog.lacks`, Continue and Quit, `pressed === 1` quits.

## 1. Spec

- `tools/oculus/README.md:5`: "`npm ci` refuses a Node below 24 before it installs anything. Each start (...) first checks the Node version (...) and says what is missing with its fix. A Node below 24, packages that do not match the lockfile and a hub folder that does not exist end the start; a missing program is named while oculus starts anyway." What is wrong: item 8 asks for "one or two sentences added to that paragraph"; three were added. This is minor. Failure scenario: none that misleads; the paragraph is longer than the brief allowed. Verdict: item 8 violated.

## 2. Proof

- R2-report.md, DONE row "Verify 2": "`Test Files 7 passed (7) Tests 63 passed (63)`" from a run the report says was made "before the last refactor". What is wrong: `agents/spec.md` ("Every count ... is taken after your last change") does not allow a figure from before the last change. By the report's own text, `tests/routes/git/git.test.ts` and `untracked.test.ts` were not rerun after it. The DONE verdict of verify 2 rests on that run. My rerun after the last change passes (11 files, 138 tests, with both git route tests), so only the report row is wrong; the code is green. Failure scenario: a reader takes the quoted 7-file run for the final state of the tree.

## 3. Standards

- `tools/oculus/config/catalogs/options.yml:1417`: "help: The Claude command line that the update tasks, the prompts of schedules and the chat terminal are started with, an absolute path or a name resolved on PATH." What is wrong: the step makes suggested commit messages run `claude_bin` (item 7). The builder rewrote the same list in `README.md:13` and `docs/configuration.md:37` for that reason, but left this catalog paragraph, which the Settings view shows beside the key. `agents/spec.md` ("re-read ... every ... catalog paragraph that describes that behaviour") asks for it to be rewritten, and the report lists neither "still true" nor "rewritten" for it. Failure scenario: a reader in Settings sets `claude_bin` to fix the update tasks and is not told that commit-message suggestions now use it too (as do the worktree agents and the usage refresh, which `docs/configuration.md:37` now lists). Verdict: none of the item verdicts (item 8's list of places to grep does not name `config/catalogs/`); it falls under the rules file's rule.

## 4. Behaviour

1. `tools/oculus/.npmrc:1`: "engine-strict=true". What is wrong: `engine-strict` refuses every package whose `engines` range excludes the running Node, not only the root. `package-lock.json` carries `node_modules/write-file-atomic` 8.0.0 with `"node": "^22.22.2 || ^24.15.0 || >=26.0.0"`. Checked with semver over every non-optional lockfile entry: Node 24.0.0 and 25.0.0 are each excluded by exactly that one entry; 24.21.0, 26.0.0 and 27.0.0 by none. A scratch probe under `$TMPDIR` (a lockfile holding only write-file-atomic 8.0.0 and its dependency, `.npmrc` `engine-strict=true`, Node 23.11.0) gives `npm error code EBADENGINE ... Not compatible with your version of node/npm: write-file-atomic@8.0.0`, exit 1. With an empty `.npmrc` the same dry run exits 0.
   - Failure scenario: a user on Node 25.x, or on Node 24 below 24.15, runs `npm ci`. Before the step it installed with a warning. Now it refuses, naming write-file-atomic's range rather than oculus's. Yet `README.md:5` says "`npm ci` refuses a Node below 24", and the first-run rule (`first-run.ts:33,85`, major >= 24) accepts those versions.
   - The report states only the root effect ("also makes `npm install` refuse an older Node or npm"). Node 25 is not installed here, so its refusal is inferred from the probe and the range, not run.
   - Where it should be stated: the report's before-and-after section and the README and DESIGN.md sentences on `engine-strict`. The real floor (24.15 on the 24 line, 25 excluded) is a decision for the orchestrator.
2. `tools/oculus/src/lib/server/root/process/start/first-run.ts:127-129`: "return statSync(path, { throwIfNoEntry: false })?.isDirectory() === true;". What is wrong: `throwIfNoEntry: false` only covers a missing entry. A hub path whose stat is refused throws. The step adds this stat to every start, and the report does not state the change.
   - Run with a scratch engine whose `local.yml` is `hub: /var/root/hub`: `node src/server.ts` prints Node's stack `Error: EACCES: permission denied, stat '/var/root/hub' at isFolder (.../first-run.ts:128:12) at machineLacks (...:146:10) at .../src/server.ts:66:17`, exit 1, with no oculus sentence. Before the step, nothing at start stat'ed the hub.
   - In the app, the same throw happens inside `run()` at `app.ts:322`, before any dialog (read, not run).
   - Failure scenario: a hub under a folder the process may not stat (EACCES, or EPERM from macOS privacy protection for a packaged app). The built server ends with a stack trace. The app's start rejects with no dialog.
3. `tools/oculus/package.json:24`: `"preapp": "node src/lib/server/root/process/start/first-run.ts"`. What is wrong: npm hands a script's arguments to the main script only. A scratch probe gives `pre args: []` and `main args: ["--engine","/x"]` for `npm run foo -- --engine /x`. So `npm run app -- --engine <dir>`, which README.md:11 documents, runs a hook that checks the checkout's own `config/local.yml` hub (`first-run.ts:223`, `machineFacts(checkout, undefined, process.env)`), not the engine the app is given. The report does not state this.
   - Failure scenario: the checkout's own `local.yml` names a hub that is not on this machine, and the user starts `npm run app -- --engine ~/engine-copy` whose hub exists. The hook prints the hub lack and exits 1, so Electron never starts, though the app over that engine would start.
   - The refusal itself is inferred from the probe and the code, not run, since `npm run app` is not started here. The brief asked for this exact script (item 4), so the fix is the orchestrator's call: for example, the hooks run only the first part, which never depends on the engine.

## Declined to judge

- That Electron settles the top-level `await import(...)` of `main.ts` before `ready`, and that the dialogs and the sheet draw as described: no Electron start is allowed here. G48's slow test at landing and the look on landing settle it.
- `npm run diagrams` was not run, since it writes into the worktree and this review changes nothing. In its place `tests/checks/diagrams` ran inside the 11-file set and passed; its head comment says it compares every committed diagram in memory with what the source gives now.
- Whether `https://code.claude.com/docs/en/setup` is the right install page: it needs a network fetch, which is outside a read and a rerun of the brief's checks.
- The report's own case table on the unchanged tree came from an earlier builder and was not rerun (the report says so). It records one run that tried to bind port 8790 and was refused. That is a fact of the earlier builder, which ruling A (Z760) addresses, and not a finding against this diff.
- Node 25 and Node 24 below 24.15 were not run (not installed); Behaviour 1 rests on the range and the probe.

Reviewer usage: a89a4942c965eeb8a, claude-opus-5-5, 283,279 tokens, 86 tool uses, 24.2 min.
