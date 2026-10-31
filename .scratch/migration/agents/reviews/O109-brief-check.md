BRIEF CHECK OF O109, on main at 5771921ca (`git rev-parse HEAD`). I changed nothing in the repository: `git status --short` shows the same four paths before and after. I started no server. No skill was invoked and no agent started.

One thing went outside the plan. My first module-load run had src/server.ts in its list. It ended at the argument check with `oculus: unknown argument: ...` and exit 1, before any listen. I removed it from the list and reran.

Summary of findings:
- Must fix in the brief: F1, F2.
- Should fix in the brief: F3, F4, F7.
- For the orchestrator or Axel: F5, F6, F8, F9.

## Names

The step adds one field declaration and one new file. It renames nothing.

Command:
`grep -rnE 'strip-types|stripTypeScriptTypes|parameter propert|type stripping|erasableSyntaxOnly|ERR_UNSUPPORTED_TYPESCRIPT' src tests config docs README.md CLAUDE.md --exclude=local.yml`
Output: no hit.

`grep -rn 'comment-width' src tests config docs README.md CLAUDE.md utils --exclude=local.yml`: no hit shown, so no document lists the tree checks by file. The one list is guarded.md, which is the orchestrator's.

Other names:
- `input` stays `input`, and the constructor parameter keeps the name, so `input.people` at cv.ts:142 stays true.
- `this.input` is read in methods only (cv.ts:205, 239, 282).
- No field initialiser reads it, so "Behaviour is unchanged" holds by reading.

Hits outside "Paths this step writes" that the change makes false: none.

Findings: none.

## The step line

Line at plan.md:1590, ruling at plan.md:3379.

| Part | Requirement in the brief |
| --- | --- |
| cv.ts loses its parameter property | What to build, bullet 1 |
| a test over src fails on any file stripping refuses | What to build, bullet 2 |
| "so a file the app cannot load cannot land" | Goal sentence, narrowed to stripping; see F6 |
| after it and O108, three archives rebuilt | NONE |
| app started | NONE |
| v1.0.0's archives replaced | NONE |
| tag moved to the fixed commit | NONE |
| ~/Applications/oculus.app replaced | NONE |

F1 (finding): the brief does not say the second half is the orchestrator's after landing.
- `grep -n -iE 'archive|v1\.0\.0|oculus\.app|orchestrator|tag' .scratch/migration/agents/briefs/O109.md` prints one line, line 48, the guarded.md sentence. Nothing names the archives, the tag or the app.
- O108's brief has such a sentence ("Installing the app is no part of the builder's work").
- The fix is one sentence of the same kind.

## Premises

| Claim | Command | Result |
| --- | --- | --- |
| app forks src/server.ts unbuilt, app.ts:265 | sed -n 250,300p src/desktop/app.ts | holds: `entry: join(checkout, 'src', 'server.ts')` is line 265 |
| Stripping refuses a transform | strip scan below | holds |
| cv.ts:141 is the parameter property | sed -n 130,150p of cv.ts | holds |
| files.ts:17 imports it | grep -n cv of files.ts | holds |
| `node src/server.ts` ends on it | import of context.ts, below | holds |
| one file of 1524, Node v24.21.0 | scratch scan of stripTypeScriptTypes over src | holds |
| comment-width.test.ts form | read whole | holds |
| tests/checks runs in `vitest checks` at every landing | quick.mjs | holds, see below |
| docs/adr does not exist | ls docs/adr | holds: No such file or directory |

Strip scan output:
`v24.21.0 1524 [["src/lib/server/content/audit/website/cv.ts","ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX","TypeScript parameter property is not supported in strip-only mode"]]`
No .mts, .cts or .tsx file exists under src (`find` count 0).

The landing claim, read exactly:
- `chooseTests` picks everything under tests/checks/source and tests/checks/tree when a changed file is under src, tests or utils (quick.mjs SCANNERS and SCANNED). A change to src therefore always runs the new test.
- A change elsewhere does not, but it cannot add a src file.
- `verify_landing` is `npm run diagrams && npm run docs:palette && npm run test:quick`, run in the gate worktree (state file line 9).

Load order:
`node --input-type=module -e` importing memories.ts and then context.ts printed `memories ok`, then `SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]` at `cv.ts:141`. So the crash comes at the second import line of server.ts, well before the listen.

build:app and build-app:
- `npm run build:app` prints `npm error Missing script: "build:app"`. The script does not exist (package.json scripts: build, app, app:package, app:release and others).
- `build-app` is made by `vite build --mode app`: src/desktop/server/build.ts (`spawn(process.execPath, [vite, 'build', '--mode', APP_MODE]...)`), tests/server/desktop/start.test.ts `beforeAll`, and the names in src/lib/server/root/process/build-folders.ts. `npm run app` and `npm run app:release` make it as a side step.

Third case, read and not run:
- Flags: `--engine`, `--default-port` and `--handler` are all accepted (args.ts).
- Order of checks: parseEngineArgs runs before any import of cv.ts, and it refuses a `--handler` that is no file. With no build-app the first run prints that refusal and not the crash, so the build has to come first even on the unchanged tree. The brief's "first when build-app is missing" gets this right if the command is right.
- `perl -e 'alarm 25; exec @ARGV'` is sound; `timeout` is absent on this machine ("command not found: timeout").
- The success line: config/text/server.yml:545 is `oculus on http://{0}:{1} over the workspace {2}` and LISTEN_HOST is 127.0.0.1 (mover.ts:10), so the text matches as a prefix.
- Port 8797: `lsof -nP -iTCP:8797 -sTCP:LISTEN` prints nothing.
- Port source: with an empty HOME there is no primary hub, so `readMachineWithDefault` gives the default port (port.ts). `--engine "$PWD"` writes nothing to config: folder.ts:14 says settings never write there.

F2 (finding): the brief dictates a command that does not exist. Replace `npm run build:app or the build the repository names` with `npx vite build --mode app`, and say it runs before the first run of the case when build-app is missing.

F7 (finding, small), the two remaining faults of the third case:
- "the worktree's `.agents` scratch" names no folder. A worktree's `.agents` holds only plan.yaml (`ls -a .agents/worktrees/migration-O108/.agents`). spec.md says logs and working files go in the session scratchpad, "never in a worktree". Name a folder in the scratchpad, or name the folder and say it is removed before the report.
- HOME does not isolate tmux. `tests/server/desktop/start.test.ts` sets `TMUX_TMPDIR` for this reason; the case does not. `grep -rnE tmux src/lib/server/root/*.ts src/lib/server/root/process/*.ts` shows comments only, so a start with no hub may not touch tmux at all, but whether it does is not verified. Setting `TMUX_TMPDIR` to the same scratch folder ends the question.

## Cases and checks

Case 1 (new test on the unchanged tree fails naming cv.ts): consistent with the scan. Case 2: consistent.

Case 3: F2 and F7 above.

Case 4: `grep -rl 'website/cv\|website/files' tests` prints tests/data/hubs/website-files.test.ts and tests/routes/docs/audit.test.ts. Neither is tagged slow. G139's Code line names cv.ts and its Test line names website-files.test.ts, so the case also runs the entry's test, as spec.md asks.

No case checks an unchanged place. The cases are consistent with the rules file.

The new test's form:
- tests/checks/source holds 6 items, so a seventh stays within the ten-item limit.
- cv.ts is 431 lines, within the size line.
- `stripTypeScriptTypes` is declared in @types/node 24.13.4 (module.d.ts:279).
- `node $SP/strip.mjs` prints `ExperimentalWarning: stripTypeScriptTypes is an experimental feature` on stderr. It is harmless, but the builder will see it in the output.
- Default vitest limit under verify item 2: vite.config.ts sets no `testTimeout`. The scan took 733 ms (measured, load 3.5 to 5.6), so it fits. The `tests/checks` line of test:quick has no limit.

What spec.md demands and the brief omits. Each binds anyway through "its rules govern this step unchanged", but O108's brief lists the first two in its Verify section and O109's does not.

F8 (finding, small):
- utils/unused-exports.sh: spec.md says to compare with "the base's, which the brief names". The brief names no base and no run before the change.
- History grep of added comment lines and test titles: absent. O108 had it as item 3.
- `LC_ALL=C grep` over touched files: absent.
- Base copy: absent. O108's brief has none either, so the launch prompt must carry it.
- Slow tag: absent. No tag is needed in effect:
  - vite.config.ts says tree checks, "tagged or not, are left out of both".
  - comment-width is untagged.
  - Only tests/checks/diagrams/palette.test.ts and tests/checks/utils/claude-usage.test.ts are tagged.
  - The scan's 733 ms is not "well under a second", so one line saying it stays untagged like comment-width would close the point.

F3 (finding), the guarded entry:
- spec.md says "A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled". guarded.md line 3 says "A new entry needs Axel's yes".
- The brief says only that the orchestrator adds the entry at landing, and cites no ruling. A builder reading spec.md could rightly stop.
- Ruling 613 (b) says "the fix and a test over src", which is a yes to the test but does not say "entry". My judgment is that it covers the entry.
- The fix is a sentence in the brief naming ruling 613 as that yes.
- Second part: the tree-check section of guarded.md (line 410) says each entry is "kept because a rule in `agents/spec.md` asks for it", and spec.md has no such rule (first grep above). The orchestrator needs a spec.md line at landing too.

## The question

Could each case or item pass without the desktop app's server loading?

- Case 1, case 2, the test: yes. They show a refusal is gone, not that the server loads. The test also has no positive row, unlike comment-width's second test. A later fault in its walk would give an empty list and pass. The first run proves it live once, and the test's failing line on the unchanged tree is required by spec.md.
- Case 3: it cannot pass unless every statically reached module loads and the server listens under plain Node. It does not cover the Electron utility process: `parent !== null` and `tellThemes` in server.ts never run, nor does the app's start path. The only runs that do are the rows of tests/server/desktop/start.test.ts (G48) and "the app is started" in the second half.
- Case 4: unrelated to the goal; it guards behaviour.
- Verify items: `test:quick` does not choose start.test.ts for these paths, see Implied inputs.

Other failures stripping does not see, each checked:

- Is there a second load failure behind cv.ts? No. An AST walk over src/server.ts (static, re-export, literal dynamic, inline `type` imports kept) reached 590 modules, all under src. A scratch script then imported the 589 other than server.ts, with cv.ts patched in memory by a `registerHooks` load hook. It printed:
  `v24.21.0 13.6.233.17-node.53 loaded 589 of 589 1995 ms`, list empty
  `v24.21.0 15.2.124.28-electron.0 loaded 589 of 589 860 ms`, list empty (run with `ELECTRON_RUN_AS_NODE=1`)
  This covers module load only, not the built handler. No file in the repository was changed.
- Import of a `.svelte`, a `$lib`, `$app` or `$env` alias, a `?raw` query or a missing extension: the walk found 0 odd specifiers. Nothing refuses them later:
  - The only `$lib` hits under tests/checks are fixtures and resolution.
  - `grep -n '\$lib' eslint.config.js` has no hit.
  - tests/checks/imports/graph.ts resolves `$lib/`, and order.test.ts:113 accepts extensionless specifiers.
  - Such a file would pass the new test, vite, svelte-check and vitest, and crash only the unbuilt server.
- A type imported without `type`: closed by `verbatimModuleSyntax: true` in .svelte-kit/tsconfig.json, through svelte-check.
- A syntax Electron's Node refuses but v24.21.0 accepts: no gap. Electron 44.5.1 (node_modules/electron/dist/version) reports node v24.21.0 and amaro 1.1.11, the same as the system Node, and `strings` on the framework shows v24.21.0. Its V8 is newer (15.2.124.28 against 13.6.233.17). The gap can open only when Electron or the system Node moves.
- A package missing after `npm ci --omit=dev`: the reached code statically imports `@sveltejs/kit`, a devDependency. The lock marks it `devOptional`, kept by `runed`'s peer dependency, and ~/Applications/oculus.app holds it (`ls`). Correct today, but it depends on that peer. Case 3 runs with dev packages, so it cannot see this; only starting the release app does.

F6 (finding, for the orchestrator): the line's "so a file the app cannot load cannot land" is wider than what the test does. The brief's goal sentence states the narrower thing, which is right for the step. The alias, extension and devDependency cases above stay ungated. Today none occurs. Widening goes to Axel under the ruling "Brief check scope". Inside the step, the test's head comment should say what it does not cover.

F5 (finding, for Axel): no check inside the step or its landing runs the server under Electron.
- G48's start.test.ts is the direct test of the goal: it fails today and would pass after the fix (a judgment, not run).
- Naming it is outside the brief's cases, and the standing demand "Only related tests at a landing" (state file line 147) excludes it, since it imports nothing the step changes.
- The options are one run of `npx vitest run tests/server/desktop/start.test.ts` at landing, or relying on "the app is started" after landing. That line's start comes before the archives go up, so the second is a real gate, later. My judgment is that the run at landing is the better one, and relying on the later start the lazy one, since it finds a failure only after the release build.

## Implied inputs

Why tests/server/desktop/start.test.ts did not stop this at O102's landing (087f7ed7e, which added cv.ts with `constructor(private` at its line 140, `git show`):
- The file is tagged `// @module-tag slow`, so `npm test` leaves it out.
- quick.mjs chooses a test by import distance up to RELATED_DEPTH 2, by name or by being changed. start.test.ts imports build-folders.ts and words.ts, and words.ts imports data/sources/config.ts and core/words.ts.
- `git show --stat=200 --format=%h 087f7ed7e | grep -E 'data/sources/config\.ts|server/core/words\.ts|root/process/words\.ts|build-folders\.ts|desktop/start'` prints nothing. So it was not chosen, and quick's own "not covered" line says as much.
- `npm run test:slow` is in landing.mjs alone, and spec.md and the state file bar anyone from running test:landing or test:slow.
- Everything that did run passes through a transpiler: `npm run build` through vite, vitest through its transform, svelte-check on types only. The booking at plan.md:1212 lists those commands green, and none of them loads a file through Node's stripping.

Other inputs:
- Who pushes the moved tag. The remote has `refs/tags/v1.0.0` at 8e334774d (`git ls-remote`), and the release holds three assets (`gh release view`). Moving a published tag is a force push, `push` is on the ask list, and the hub rule says never push. Ruling 613 rules the move but not who does it. O33's line says "Axel pushes". Book it before the second half starts (F9).
- Order: O108 is in flight at base 85d449c47 and the second half waits on it. The write lists share 0 paths (`comm -12` count 0), so O109's first half can run beside it.
- The Linux archives cannot be started on this Mac, so "the app is started" covers darwin alone. The risk is small given the same src and Node, and it is unverified.
- Whether the repository's own `erasableSyntaxOnly` tsconfig option should stand beside the test. It exists in the installed TypeScript 6.0.3 (`grep` in tsc.js returned nothing in my output, so its presence is not verified by command; this is from memory). The ruling names a test, so nothing changes, and I raise no finding on it.

## ADRs

`ls docs/adr`: No such file or directory. The brief says the same. None touches the step. Findings: none.

## Dictated text

| Dictated line | Check | Result |
| --- | --- | --- |
| `private readonly input: CvInput;` | cv.ts class fields | holds; strips to a plain field |
| `tests/checks/source/strip-types.test.ts` | ls tests/checks/source, no such file | holds |
| `constructor(private readonly input: CvInput) {` | sed cv.ts | holds |
| `refuses that one file of 1524` | strip scan | holds |
| `expect(found).toEqual([])` | comment-width.test.ts | holds |
| `npm run build:app` | npm run build:app | BREAKS: "Missing script"; F2 |
| the third case's command | args.ts, server.ts | holds, with F2 and F7 |
| `oculus on http://127.0.0.1:8797` | server.yml:545, mover.ts:10 | holds, as a prefix |
| `grep -rl 'website/cv\|website/files' tests` | run | holds: two files |
| "since tests never load that way" | start.test.ts:29, :157 | BREAKS, F4 |
| "every file under `src` strips today but this one" | strip scan | holds |
| "the app runs its sources unbuilt by design" | release.ts SHIPPED, shipped.ts | holds |
| "No script is written..." | spec.md case-run rule | holds; the perl one-liner changes no file |

F4 (finding): "since tests never load that way" is false as written.
- Electron loads tests/server/desktop/app-harness.ts unbuilt (start.test.ts:29, :157).
- A scan over tests and utils refuses tests/routes/write-log.ts, tests/shell/panes/strip/tab-menu.test.ts and tests/ui/controls/editor/reach-text.test.ts, which stay refused. The harness is not among them.
- The scope is right, and the reason is what is wrong. `SHIPPED_SOURCES` holds src and not tests. Reword it as "since the app ships and runs src alone", so the sentence does not go into the test's head comment as written.

Character set: `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O109.md` printed nothing. No em dash, no history. Holds.

## Declined to judge

- Whether ruling 613 (b) counts as Axel's yes to a new guarded entry. My judgment is yes; it is the orchestrator's or Axel's to state (F3).
- Whether `--engine "$PWD"` plus a 25 s limit is long enough for a first start of the server. Not measured, since no server was started. The 589 modules load in 2 s, which suggests it is.
- Whether a start with no hub touches the default tmux socket. Not verified (F7).
- Whether a fresh worktree lacks build-app. It is gitignored, but the O108 worktree holds one, and I did not establish whether its builder made it. The brief's conditional covers both.
- The second half's own steps, which belong to the orchestrator and are not in the brief.

Usage: af0dc327065b27d02, claude-opus-5-5, 199916 tokens, 23 tool uses, 9.5 minutes

## Closed

F1 the brief says the second half is the orchestrator's. F2 the build is `npx vite build --mode app`. F3 ruling 613 is named as the yes to the test and its entry, added with its spec.md line at landing. F4 the reason reworded. F5 `tests/server/desktop/start.test.ts` added to Verify. F6 the head comment says what the test does not cover. F7 the folder is the session scratchpad, `TMUX_TMPDIR` set. F8 unused-exports, the history grep and the character check added; the test stays untagged like comment-width. F9 the move of the tag is by `gh release`, after Axel's push of the commits.
