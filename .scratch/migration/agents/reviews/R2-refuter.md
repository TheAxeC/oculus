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

## Repair round 1, refuted

This section covers the reviewer's run over R2's repair round 1 in `.agents/worktrees/R2`, base `5120f89cf`. The round's delta is the 26 files newer than `$TMPDIR/r2-round1.ref` (2026-10-09 23:20:06). It was read against the whole `git diff 5120f89cf`, which is 35 tracked files plus 5 untracked paths. Commands ran from `tools/oculus` in the worktree, or from scratch folders under `$TMPDIR/r2rr`, with `HOME=$TMPDIR/r2rr/home` and Node 24.21.0 first on PATH. Port 8811 was free before and after every run that could listen (`lsof -iTCP:8811 -sTCP:LISTEN` rc=1).

```
$ npm run test:quick -- --base 5120f89cf
ok      ASCII gate (0.4 s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.9 s)
ok      eslint (1.6 s)
ok      svelte-check (5.6 s): 1791583519528 COMPLETED 451 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (27.6 s): Duration  23.98s
test:quick: 28.1 s (limit 45.0 s); every command passed

$ npx vitest run tests/server/root/first-run.test.ts tests/checks/source/keys.test.ts tests/checks/tree tests/routes/git/git.test.ts tests/routes/git/untracked.test.ts tests/checks/diagrams tests/checks/imports --testTimeout 0 --hookTimeout 0
 Test Files  11 passed (11)
      Tests  143 passed (143)

$ npx vitest run tests/server/root/first-run.test.ts --reporter=verbose
 15 rows passed, among them 'Node 24.14.0 is one lack naming the r...', 'Node 25.0.0 is one lack naming the ra...', 'Node 24.15.0 is no lack', 'Node 26.0.0 is no lack', 'the pre-release 26.0.0-nightly2026010...', 'a hub whose folder cannot be read is ...'
 Test Files  1 passed (1)
      Tests  15 passed (15)

$ sh utils/folder-check.sh; echo "folder-check exit=$?"
folder-check exit=0
$ wc -l (changed sources and tests): largest src/lib/state/boards/collection.ts 776, tests/checks/tree/boundaries.test.ts 764, git-routes.ts 488, app.ts 353, first-run.ts 259
$ sh utils/unused-exports.sh > unused.txt; diff ../../../R2-base/tools/oculus/unused-exports.txt unused.txt
1c1  < Unused exports (245)  > Unused exports (246)
76c76  < git-message.ts: CLAUDE, TIMEOUT_MS  > git-message.ts: TIMEOUT_MS
101a102  > src/lib/server/root/process/start/first-run.ts: installLacks, reportLacks
$ grep -rn "installLacks\|reportLacks" src tests | grep -v 'start/first-run.ts:'
src/server.ts:23, :26, :53, :66; tests/server/root/first-run.test.ts:11, :66
$ LC_ALL=C perl -ne '<the spec's ASCII gate>' $(find src tests config -type f ! -name local.yml)
(prints nothing)
$ LC_ALL=C grep -c '[^ -~]' README.md DESIGN.md docs/configuration.md package.json .npmrc package-lock.json
0 for each

The report's evidence, rerun in its own form:
$ npx vitest run tests/server/root/first-run.test.ts tests/checks/source/keys.test.ts tests/checks/tree tests/routes/git/git.test.ts tests/routes/git/untracked.test.ts --testTimeout 0 --hookTimeout 0
 Test Files  7 passed (7)
      Tests  68 passed (68)
$ npx vitest run tests/checks --testTimeout 0 --hookTimeout 0
 Test Files  17 passed (17)
      Tests  264 passed | 1 skipped (265)

Item 1 (case 14): npm ci --dry-run in a copy of package.json, package-lock.json, .npmrc
Node 23.11.0: npm error code EBADENGINE / notsup Not compatible with your version of node/npm: oculus@0.0.1 / Required: {"node":"^24.15.0 || >=26.0.0","npm":">=11"} / Actual: {"npm":"10.9.2","node":"v23.11.0"}; node23 exit=1
Node 24.21.0: added 557 packages in 633ms; node24 exit=0
package-lock.json packages[""].engines and package.json engines: {'node': '^24.15.0 || >=26.0.0', 'npm': '>=11'} both; .npmrc: engine-strict=true
semver over every non-optional lockfile entry's engines.node (semcheck.mjs):
24.14.0 excluded by 1 node_modules/write-file-atomic ^22.22.2 || ^24.15.0 || >=26.0.0
24.15.0, 24.21.0, 26.0.0, 27.1.0 excluded by 0
25.0.0, 25.9.0 excluded by 1 node_modules/write-file-atomic

Item 2: scratch engine engroot (config/ copied with --exclude=local.yml), local.yml "hub: /var/root/hub\nport: 8811"
$ node src/server.ts --engine $R/engroot
oculus: /var/root/hub cannot be read (EACCES), so there is no research hub to read. Allow oculus to read it, or set hub in .../r2rr/engroot/config/local.yml to the folder of the research hub.
exit=1   (no stack)
hub inside a mode-000 scratch folder: oculus: .../r2rr/lk/inner cannot be read (EACCES), ... exit=1 (mode restored after)
case 8: hub a file -> "... /r2rr/hubfile is not a folder, ..." exit=1; hub missing -> "... /r2rr/nothere is not a folder, ..." exit=1

Item 3 / case 13: nonm (src, config, package files, .npmrc; no node_modules)
> node src/lib/server/root/process/start/first-run.ts            (predev, prepreview)
> node src/lib/server/root/process/start/first-run.ts --install  (preapp)
each: oculus: The packages are not installed in .../r2rr/nonm. Run npm ci in .../r2rr/nonm.
nonm predev exit=1 / preapp exit=1 / prepreview exit=1
full (node_modules linked), local.yml hub missing, port 8811:
node first-run.ts --install: prints nothing, exit=0; npm run preapp exit=0
node first-run.ts: the hub lack, exit=1; npm run predev exit=1; npm run prepreview exit=1

Item 4: grep -rn --exclude=local.yml -iE "usage refresh|worktree agents|chat terminals|commit messages|update tasks|claude_bin" config/catalogs config/text DESIGN.md HELP.md docs README.md
options.yml:1417 and server.yml:302 (needs_claude) list the six uses; README.md:13 and docs/configuration.md:37 the same six; no other list of what claude_bin runs.

Case 9: run9.mjs spawns node src/server.ts --engine engc with env {HOME, PATH=/var/empty}, ends it after "oculus on"
oculus: git was not found, so Source Control and History do not work. Run xcode-select --install.
oculus: tmux was not found, so the terminals and their sessions do not work. Run brew install tmux.
oculus: perl was not found, so the line counts of the Status view do not work. Perl comes with the macOS Command Line Tools; run xcode-select --install.
oculus: claude was not found, so the chat terminals, the worktree agents, the usage refresh, the update tasks, the prompts of schedules and the suggested commit messages do not work. Install the Claude CLI from https://code.claude.com/docs/en/setup, or set claude_bin in .../r2rr/engc/config/local.yml to its path.
(config and watcher notes of the empty scratch hub)
out: oculus on http://127.0.0.1:8811 over hub .../r2rr/hub
exit code=0 signal=null endedByRun=true

Cases 10, 11, 16 (probe.mjs over the worktree's first-run.ts and words.ts):
10a abs claude outside PATH []
10b claude-elsewhere name [["claude",false]]
11 darwin stub, xcode-select fails [["git",false]]; calls ["xcode-select -p"]; linux stub []
16 app own env [["tmux",false]]; server env []

Case 5: installLacks(worktree, '24.21.0') -> []
Case 6: cd nonm; node src/server.ts --default-port 8811 -> oculus: The packages are not installed in .../nonm. Run npm ci in .../nonm.  exit=1
Case 7: full, no build/: oculus: the server handler .../full/build/handler.js does not exist; run npm run build in .../full to make it  exit=1
        --handler $R/nothere.js: oculus: .../nothere.js is no file, so there is no handler to load  exit=1
Case 12: full, hub present, programs on PATH: node first-run.ts prints nothing, exit=0

End: git status --short, 40 lines, the same list as at the start; the round's delta is still 26 files; 8811 rc=1.
```

### Verdicts

Each verdict covers the whole diff since the base.

Items of the brief's "What to build":

- 1: holds. `src/lib/data/places/engine-dir.ts` imports `node:` modules only, and `config.ts` re-exports it. Case 6 shows it loads with no packages installed.
- 2: holds. `first-run.ts` holds the two parts and the program. Under Z761 (a), `nodeLacks` (`:89-102`) accepts major 24 from minor 15, and every major from 26. Under item 2 of the round, `folderProblem` (`:140-147`) never throws. Under Z761 (c), `--install` (`:243-244`) runs the first part only. The `args.ts` and `port.ts` moves are unchanged.
- 3: holds. Cases 6 to 9 rerun as quoted above. The unreadable hub ends the start with an oculus sentence and exit 1.
- 4: holds as Z761 (c) rules it. `predev` and `prepreview` run the whole check, and `preapp` runs `first-run.ts --install` (case 13 and the install-only run above).
- 5: holds by reading `main.ts` and `app.ts:313-353`. `machineFacts` and `machineLacks` no longer throw on an unreadable hub, so `run()` reaches the `lack_refused` dialog.
- 6: holds as Z761 (a) rules it. `engines` is `^24.15.0 || >=26.0.0` in `package.json` and in `packages[""]`, and `.npmrc` has `engine-strict=true` (case 14). The semver run shows that write-file-atomic 8.0.0 is the only entry that excludes 24.14 and 25.
- 7: holds. The round did not change it; case 10a and 10b were rerun, and 10c stands from the first review.
- 8: violated, Standards 1. The head comment of the G73 test still states the old Node rule. Spec 1 and Standards 1 of the first review are closed (see Findings).

Cases of the brief's "Cases":

- 1: met as Z761 (a) rules it. Rows 24.21.0, 22.12.0, 24.14.0, 25.0.0, 24.15.0, 26.0.0 and the 26.0.0 pre-release pass. The brief's `25.0.0-nightly...: no lack` is replaced by the ruling, and the report lists the row's edit.
- 2: met. The row, plus case 6 and case 13 rerun.
- 3: met. Both rows, with "version: 1)".
- 4: met. The optional-only row.
- 5: met. `installLacks` gives `[]`.
- 6: met. The packages sentence, exit 1, port free.
- 7: met. Both halves rerun.
- 8: met. Rows for the missing hub, the file, the unreadable hub and the default hub. The server runs end with exit 1 before the handler.
- 9: met. Four lines, then the start goes on.
- 10: met. 10a and 10b rerun; 10c stands from the first review, since `git-message.ts` is not in the delta.
- 11: met. The injected runner probe.
- 12: met for the module, which prints nothing. The start-output comparison with the base was not rerun (see Declined to judge).
- 13: met. The three hooks over `nonm` each exit 1.
- 14: met under Node 23.11.0 and Node 24.21.0. Node 24.14 and Node 25 are not installed; they are covered by the semver run and the G73 rows.
- 15: met by reading.
- 16: met. The probe gives `["tmux"]` with the app's own environment and `[]` with the server's.
- 17: met by reading `app.ts:330-352`.

The first review's findings:

- Spec 1 (README sentences): closed. `README.md:5` now has two added sentences, and both carry the range (read).
- Proof 1 (the verify 2 count taken before the last change): closed. The report's 7-file run reproduces `7 passed (7)` and `68 passed (68)`, and the `tests/checks` run reproduces `17 passed` and `264 passed | 1 skipped`.
- Standards 1 (`options.yml` `claude_bin` help): closed. `options.yml:1417` and `server.yml:302` name the six uses, and the grep finds no other list.
- Behaviour 1 (`engine-strict` refuses Node 24.0 to 24.14 and Node 25 because of write-file-atomic): closed. Z761 (a) is in `package.json`, the lockfile, `first-run.ts`, `README.md:5` and `DESIGN.md:511`. No check was removed, `engine-strict` stays, and the range matches the semver run.
- Behaviour 2 (an unreadable hub throws): closed. The `/var/root/hub` run and the mode-000 run both give the oculus sentence and exit 1. The new EACCES row guards it. The fix is limited to `folderProblem` and one catalog key.
- Behaviour 3 (`preapp` checks the checkout's hub instead of the `--engine` hub): closed as Z761 (c) rules. `preapp` exits 0 with a missing hub in the checkout's `local.yml` and exits 1 with packages missing. The app's own hub check in `app.ts` is unchanged.

Every closure the report claims is reproduced by my reruns, with one exception. The "before" run of the round, `Tests  3 failed | 12 passed (15)`, needs the tree as it was before the round, which no longer exists. By reading the old rule as the first review quotes it (major >= 24, and a stat that throws on EACCES), the 24.14.0 and 25.0.0 rows give `[]` and the EACCES row throws, which is three failures. That agrees with the report.

### Findings

- **Standards 1.** `tests/server/root/first-run.test.ts:1-3`: "The first-run check refuses a start for what oculus cannot run without: a Node major below 24, installed packages that are not what package-lock.json says, and a hub that is no folder." What is wrong: after the round, the check also refuses Node 24.0 to 24.14 and Node 25, and also refuses a hub that cannot be read. The table in the same file has rows for all three (24.14.0, 25.0.0, EACCES). The rules file's grep rule and item 8 ("Grep ... the head comments of the files the step changes for every sentence the change makes false ... and make it true") say this comment must be rewritten. The doc comment of `machineLacks` (`first-run.ts:153`, "The hub is a lack when its path is no folder.") has the same gap: it does not mention the unreadable hub that `folderProblem` now reports. Failure scenario: someone maintaining G73 reads the head comment and takes "a Node major below 24" as the rule. They then judge the 24.14.0 and 25.0.0 rows to be wrong and change the rule or the rows back. Verdict: item 8 violated.

- **Spec 2.** `README.md:5`: "Install once, with Node 24 and npm 11 (`nvm install 24` gives both)". What is wrong: round item 1 asks `README.md` to state the range "wherever they say 'Node 24' ... for this check". This opening install sentence still says "Node 24", and with `engine-strict` it is the sentence that tells the reader which Node `npm ci` accepts. The range does follow two sentences later in the same paragraph, and `nvm install 24` does install a 24.x at or above 24.15. This is minor. Failure scenario: a reader on Node 24.10 stops at "with Node 24", runs `npm ci`, and gets `EBADENGINE`. Verdict: none (round item 1, minor).

- **Spec 3.** `README.md:11`: "The app looks the programs up in the environment it hands the server and names the ones it does not find in the same sheet on the first window, with Continue and Quit." What is wrong: the brief's path list allows `README.md` lines 5 and 13 only. Line 11 gained this sentence, and the report's file table marks `README.md` "yes (lines 5, 11, 13)", as if line 11 were in the write list. The sentence itself is true (`app.ts:333-352`). Failure scenario: the orchestrator checks the diff against the path list, sees "yes", and does not judge the extra sentence as an addition outside the list. Verdict: none.

- **Behaviour 1.** `src/lib/server/root/process/start/first-run.ts:89-102`, the Node rule `major >= 26 || (major === 24 && minor >= 15)`, which `src/server.ts:53` and the `predev` and `prepreview` hooks apply at every start. What is wrong: the report's "Host- and user-visible changes, before and after" has no bullet for a start under an unsupported Node. At the base, `node src/server.ts`, `npm run dev` and `npm run preview` start under any Node that runs `.ts` files (22.18 and later, 23.6 and later), Node 24.0 to 24.14 and Node 25 included. Now each of those ends with `oculus: Node <v> is not supported: oculus needs Node 24.15 or later on the 24 line, or Node 26 or later. Install it with: nvm install 24` and exit 1. The report gives the sentence under repair item 1, but gives the before and after only for `npm ci`. Failure scenario: a reader on Node 25.x who started `npm run dev` yesterday is refused today, and the landing report built from this section does not tell the orchestrator or Axel that this change exists. Verdict: none.

### Declined to judge

- The round's "before" run (`3 failed | 12 passed (15)`) was not rerun, because the tree before the round is gone. Rebuilding the old `first-run.ts` from the first review's quote would mean writing code into a copy, which a review does not do. Judged by reading, as stated above.
- `npm run diagrams` was not run, because it writes into the worktree. `tests/checks/diagrams` ran in the 11-file set and passed. It compares every committed diagram with what the source gives now.
- Case 12's comparison of the start output with the base server was not rerun. `src/server.ts` is not in the round's delta, the module prints nothing with everything present (rerun), and the case 9 run shows the lines after the lacks unchanged. The first review's identical diff stands for the rest.
- Node 24.14 and Node 25 were not run, because they are not installed. The semver run over the lockfile and the G73 rows settle what this check and `npm ci` do with them.
- The app's dialogs and sheet on screen, and Electron's handling of the top-level `await import()` in `main.ts`, were not judged, because no Electron start is allowed here. G48's slow test and the look at landing settle them.
- The G73 row for the mode-000 hub depends on the suite not running as root, which the report states. Whether any runner of the suite is root is outside this review.

Reviewer usage: a1d2a98931ed442a9, claude-opus-5-5, 220,059 tokens, 48 tool uses, 14.5 min.

## Closed

- Repair round 1, Standards 1 (the head comment of `tests/server/root/first-run.test.ts` and the doc comment of `machineLacks`): fixed at landing; the head comment names the Node range and the hub that cannot be read, and `machineLacks`'s doc comment says the hub is a lack when its path is no folder or cannot be read, rewrapped at 100 columns.
- Repair round 1, Spec 2 (`README.md:5` "with Node 24"): fixed at landing; the sentence reads "with Node 24.15 or later on the 24 line (or Node 26 or later) and npm 11".
- Repair round 1, Spec 3 (`README.md:11`, a sentence outside the path list): kept; the sentence is true (`app.ts:333-352`) and describes the app's sheet item 5 of the brief changes. Named in the booking as an addition outside the path list.
- Repair round 1, Behaviour 1 (a start under Node 24.0 to 24.14 or Node 25 is now refused): kept as Z761 (a) rules it, and stated in the booking and the landing report with its before and after.
