# O108 review report

## Verification lines, verbatim

Verify 1. `npm run diagrams`: exit 0. `npm run test:quick`, run once (captured with `tail -16`, so the head lines naming the changed-file count are not quoted):

```
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.3 s)
ok      svelte-check (7.9 s): 1793480853295 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (9.7 s): Duration  346ms (transform 374ms, setup 0ms, import 402ms, tests 6ms, environment 0ms)
ok      vitest checks (36.5 s): Duration  27.05s (transform 9.79s, setup 0ms, import 21.25s, tests 35.59s, environment 2ms)
test:quick: 39.0 s; every command passed
```

`git status --short` afterwards lists the seven changed paths, `?? .scratch/migration/agents/reviews/O108-report.md` and `?? src/desktop/release-steps.ts`; the diagrams changed nothing.

Verify 2. `sh utils/unused-exports.sh`: status 0, 337 lines, `grep -n desktop` over them prints nothing.

Verify 3. `grep -n -iE 'moved|formerly|used to|no longer|previously|launcher|stub'` over the four files: no output, exit 1.

Verify 4. `npx vitest run tests/server/desktop/platform-steps.test.ts tests/server/desktop/script-args.test.ts tests/checks/tree/boundaries.test.ts --reporter=dot`:

```
 Test Files  3 passed (3)
      Tests  22 passed (22)
```

Verify 5. The cases:

```
$ grep -c '"app:package"' package.json
0
$ npm run app:package
npm error Missing script: "app:package"
$ grep -n '"app' package.json
26:        "app": "electron .",
27:        "app:release": "node src/desktop/release.ts"
$ npm run app:release -- --platform nosuch
Error: there is no oculus app for the platform nosuch
    at appPlatform (file:///.../src/desktop/release-steps.ts:54:11)
$ npm run app:release -- --platfrom linux
Error: unknown argument --platfrom
    at scriptArgs (file:///.../src/desktop/release-steps.ts:40:42)
```

- The wide grep with the brief's exclusions: no output, exit 1. `grep -rn startedAsProgram src/desktop`: exit 1. `grep -rn not_built src/desktop config/text/desktop.yml`: exit 1.
- `tar -tzf release/oculus-1.0.0-linux-x64.tar.gz | wc -l`: 41053. It lists `oculus-linux-x64/resources/app/src/desktop/release-steps.ts` and `.../build-app/handler.js`, and no `package.ts`.
- `unzip -l release/oculus-1.0.0-darwin-arm64.zip | wc -l`: 83170. It lists `.../Resources/app/src/desktop/release-steps.ts` and `.../build-app/handler.js`, and no `package.ts`.
- `release-steps.ts`, `release.ts`, `app.ts` and `desktop.yml` in both archives are equal under `cmp` to the worktree's. The archives' `package.json` is a rewritten form, not byte-equal, and the Linux one has no `app:package` (`grep -c` printed 0).
- The zip unpacked with `ditto -x -k` into a scratch folder, removed afterwards: `codesign --verify --deep --strict oculus.app`, exit 0.

Verify 6, after the change. `npx vitest run` of the two test files alone: `Test Files 2 passed (2)`, `Tests 11 passed (11)`.

The report's other evidence commands:

```
$ node src/server.ts --handler /nonexistent/handler.js
oculus: /nonexistent/handler.js is no file, so there is no handler to load
exit 1
$ node -e "import('./src/lib/server/root/context.ts')..."
ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX TypeScript parameter property is not supported in strip-only mode
$ tar -xzOf release/oculus-1.0.0-linux-x64.tar.gz .../cv.ts | grep -n 'constructor(private'
141:    constructor(private readonly input: CvInput) {
$ npx vitest run tests/server/desktop/start.test.ts --reporter=dot
Tests  5 failed (5)
dialog: The oculus server ended (exit code 1): SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property is not supported in strip-only mode
```

- The line counts of the report's Files table match `wc -l` and `git show 85d449c47:<path> | wc -l` on every row.
- `grep -rn -E "\bStep\b" src/desktop` hits `release-steps.ts` alone.
- The ASCII grep over the seven changed files: exit 1.
- The history-word grep: one hit, `script-args.test.ts:3`, as the report says.
- The open items quoted match `.scratch/migration/orchestrator-state.md`.
- `grep -rln 'app:package'` over the hub's `CLAUDE.md`, `README.md`, `CONTEXT.md`, `docs` and `.oculus`: no output.
- `.agents/plan.yaml`: no hit. `guarded.md`: only line 299, G85.

## What to build

| Item | Verdict | Evidence |
| --- | --- | --- |
| `app:package` and `package.ts` gone; nothing makes an app that runs the checkout; `app:release` at the same paths with the same lines; `npm run app` unchanged | holds | the greps above; `release.ts:128-140` is outside the diff |
| `package.json`: the script line removed | holds | diff; the missing-script error above |
| `release-steps.ts`: the helpers, `Step`, `NAME`, `checkout`, no launcher code, defaults gone, comments say what is checked, head comment | holds | lines 51-61 and the whole file read; line-by-line equal to `package.ts` otherwise. `NAME` and `checkout` exported: finding S1 |
| `release.ts`: imports from `./release-steps.ts`; head comment says what the app is, naming neither `app:package` nor a stub | holds | lines 1-9, 31-44 |
| `platform-steps.test.ts`: import, `finishSteps` gone, head comment, programs through the three helpers, the Linux row | holds | test lines 15-21 and 45-50; the Linux args equal the old row's. Finding P1 |
| `script-args.test.ts`: import, head comment naming `npm run app:release` and the new file alone | holds | lines 1-8 |
| `src/desktop/package.ts` deleted | holds | ` D src/desktop/package.ts` |
| `app.ts`: `not_built` branch gone; `appHandler` stays | holds | `appHandler` at line 267; `existsSync` stays in use at lines 95 and 128, so no import goes |
| `desktop.yml`: `not_built` key gone | holds | diff; `tests/checks` green |
| Installing the app | not applicable | the brief leaves it out of the builder's work; not looked at, `~/Applications` being out of bounds |

## Cases

| Case | Verdict | Evidence |
| --- | --- | --- |
| `app:package` grep and missing-script error | met | above |
| `"app": "electron ."` | met | line 26 |
| wide grep, `startedAsProgram` grep | met | exit 1 on both |
| `--platform nosuch` | met | same message, now at `release-steps.ts:54` |
| `--platfrom linux` | met | same message, now at `release-steps.ts:40` |
| Linux archive | met | archive inspected, not rebuilt; 41053 entries; files `cmp` equal |
| macOS archive | met | archive inspected, not rebuilt; the unpacked bundle passes `codesign --verify --deep --strict` |
| the two test files | met | 11 passed; every row without `finishSteps` kept; macOS and Linux programs checked as the item says |
| `not_built` grep | met | exit 1 |

## Spec

S1. `src/desktop/release-steps.ts:17` and `:29`, `src/desktop/release.ts:32` and `:36`.

```
export const NAME = 'oculus';
export const checkout = resolve(import.meta.dirname, '..', '..');
```

- What is wrong: no item asks for these exports, or for removing `const NAME` and `const checkout` from `release.ts` (base lines 45 and 49) or the `resolve` import. The brief puts `NAME` and `checkout` in the new file "as the helpers need them". The report states this as judgment 1 and rests it on the rule that a fact exists once; `spec.md:88` names DRY.
- Failure scenario: none at run time. Both files sit in `src/desktop`, so `checkout` has the same value. The cost is two exports and a line of `release.ts` no item named.

No premise of the brief failed to reproduce. `grep -rn not_built src config tests` also hits `src/server.ts:85` and `config/text/server.yml:542`, which are the different key `handler_not_built`, in line with the brief's "for this key".

## Proof

P1. `tests/server/desktop/platform-steps.test.ts:18`.

```
const sign = platform === 'darwin' ? signSteps('/work/out/oculus.app') : [];
```

- What is wrong: the branch that decides which platform signs is written in the test. `signSteps` takes no platform, and the code's branch is `release.ts:127`, which no test can import. Taking the `platform === 'darwin'` guard out of `release.ts:127`, or the whole `runSteps(signSteps(folder))` call, leaves `expect(new Set(mac))...` and `expect(programs('linux')).toEqual(['tar'])` green, found by reading.
- At the base those two assertions read a code branch, `finishSteps`, though only the launcher's; `release.ts:127` had no test there either.
- `new Set(mac)` also says nothing about the second `signSteps` step: dropping the `--verify` entry passes, as it did at the base.
- Failure scenario: a change that signs a Linux app, or stops signing the macOS one, passes G85's test, whose text says the Linux app is made with none of those programs.

## Standards

St1. `tests/server/desktop/platform-steps.test.ts:3-4`.

```
// packager runs for the app (src/desktop/release-steps.ts), read as data with the platform passed
// in, so both branches are held on any machine and no step is run.
```

- What is wrong: for signing, no platform is passed to the code (see P1), so "both branches are held" is not true of that branch.
- Failure scenario: a reader trusts the comment and takes the signing branch as covered.

St2. `src/desktop/release-steps.ts:1-2`.

```
// Layer 2, server (the desktop host). The steps of `npm run app:release`: reading the script's
// arguments, checking the platform and the architecture, finding Electron's version, and the
// programs the script runs.
```

- What is wrong: the script also runs `npm ci` itself at `release.ts:93` and the build through `buildServer`, so this file holds some of the programs, not "the programs the script runs".
- Failure scenario: a reader looks here for the install step and does not find it.

The grep of each changed name across docs and comments found no other sentence the diff makes false. The report's still-true rows were read at `src/desktop/server/build.ts:1-6`, `first-run.ts:172-178`, `shipped.ts:1-5`, `docs/HELP.md:13` and `:32`, and `README.md:74` and `:79`, and they stand. No history in a comment. No line over 100 columns in the code or comments; the two over it are test titles the step did not change.

## Behaviour

B1. Report, "User-visible changes", row 2:

```
| The app with no built handler | dialog `The oculus server is not built. ...` | no such dialog; the server ends with its own line |
```

The row leaves out what the reader then gets, all read from `src/desktop/app.ts:333-340` and `:355-371`:

- Before: one button, Quit, shown before the login environment is read.
- After: the `desktop.dialog.server_exited` dialog, `The oculus server ended (exit code 1): oculus: <path> is no file, so there is no handler to load`, with two buttons, Restart and Quit.
- Restart forks the same missing handler and brings the same dialog back.
- The start now passes the login environment and `machineLacks` first, so on such a bundle a missing required program shows `desktop.dialog.lack_refused` instead.

Failure scenario: the look or Axel reads the row as a line on a terminal, when it is a dialog with a Restart that cannot succeed. Only a damaged bundle reaches it.

B2. Report, "User-visible changes", row 1:

```
| `npm run app:package` | builds a launcher into `~/Applications/oculus.app` | `npm error Missing script: "app:package"` |
```

The before column names macOS's default alone. The script took `--out`, and on Linux wrote `~/.local/share/oculus/oculus-linux-<arch>` and its `.tar.gz` (base `package.ts:92-94`, `:171`). All of that goes too, so the row understates the change for a Linux reader.

## Declined to judge

- The report's "`Tests 5 passed (5)`" in a scratch copy with `cv.ts` fixed, and so its sentence "the five rows hold on this step's `app.ts`". This is not reproduced: it needs an edited copy, and this review changes nothing. A run with `NODE_OPTIONS=--experimental-transform-types` stayed red with the same error, because the flag does not reach the server, so it is no evidence either way. No test exercises this step's start path on this tree. The branch removal is judged by reading only; O109 makes `start.test.ts` the check.
- The missing-handler dialog in a real app. It was not run, and the report says so too; B1 and the Behaviour row rest on reading `process.ts`, `error-line.ts` and `app.ts`.
- The builder's first runs on the unchanged tree, the "before" runs of verify 6 and the base side of the unused-exports diff. There is no base tree here. What `git show 85d449c47:<path>` reaches agrees: `package.json:27`, `release.ts:42`, `app.ts:353-357`.
- `~/Applications/oculus.app` and the replacement the brief says the orchestrator made: out of bounds, not looked at.
- G85's Code and Test lines at `guarded.md:299-300`: the orchestrator's at landing.
- The archives were not rebuilt. Their identity with the tree is the `cmp` above over five named files, of which four match, and not the whole tree.

Usage: a1bbebe0eb696ea45, claude-opus-5-5, 174612 tokens, 27 tool uses, 21.6 minutes

## Repair round 1, refuted

Reviewed on .agents/worktrees/migration-O108, base 85d449c47, against the snapshot .agents/worktrees/migration-O108-round-1. The review found nothing.

The delta is three files, all on the write list: `src/desktop/release-steps.ts`, `src/desktop/release.ts` and `tests/server/desktop/platform-steps.test.ts`. `diff -u` against the snapshot is empty for `config/text/desktop.yml`, `package.json`, `src/desktop/app.ts` and `tests/server/desktop/script-args.test.ts`. `src/desktop/package.ts` is absent from both the snapshot and the worktree. The only changed paths outside `files.txt` are `.scratch/migration/agents/briefs/O108-round-1.md` and `.scratch/migration/agents/reviews/O108-report.md`.

```
$ npm run diagrams
exit 0; `git status --short` before and after compared with diff: no difference

$ npm run test:quick -- --base 85d449c47     (run once, captured with tail -20, so the head lines with the changed-file count are not quoted)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (2.2 s)
ok      svelte-check (8.4 s): 1793482283163 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (10.4 s): Duration  463ms (transform 467ms, setup 0ms, import 513ms, tests 7ms, environment 6ms)
ok      vitest checks (35.9 s): Duration  25.78s (transform 12.32s, setup 0ms, import 25.36s, tests 33.36s, environment 2ms)
test:quick: 38.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files

$ sh utils/unused-exports.sh
status 0, 337 lines; grep -n desktop over them: no output, exit 1

$ npx vitest run tests/server/desktop/platform-steps.test.ts tests/server/desktop/script-args.test.ts tests/checks/tree/boundaries.test.ts --reporter=dot
 Test Files  3 passed (3)
      Tests  22 passed (22)

$ npx vitest run tests/server/desktop/platform-steps.test.ts tests/server/desktop/script-args.test.ts --reporter=verbose
 Test Files  2 passed (2)
      Tests  11 passed (11)

$ grep -n -iE 'moved|formerly|used to|no longer|previously|launcher|stub' src/desktop/release-steps.ts src/desktop/release.ts tests/server/desktop/platform-steps.test.ts tests/server/desktop/script-args.test.ts
no output, exit 1

$ LC_ALL=C grep -n '[^ -~]' over the seven changed files
no output, exit 1

$ the spec's ASCII gate (perl form) over src tests config    (the tree has no bin folder, so bin is left out of find)
no output, exit 0

$ history-word grep of the spec over the four files
tests/server/desktop/script-args.test.ts:3:// read by its name, and anything else stops the script before it builds, so an argument a shell
(an order of events in the script, unchanged wording, as the report says)

$ grep -n '"app:package"' package.json
no output, exit 1
$ npm run app:package
npm error Missing script: "app:package"
$ grep -n '"app' package.json
26:        "app": "electron .",
27:        "app:release": "node src/desktop/release.ts"
$ grep -rn -E 'app:package|desktop/package|package\.ts|writeStub|finishSteps|defaultOut|main\.cjs' . (the brief's exclusions, with .git and build-app)
no output, exit 1
$ grep -rn startedAsProgram src/desktop
no output, exit 1
$ npm run app:release -- --platform nosuch
Error: there is no oculus app for the platform nosuch
    at appPlatform (file:///Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O108/src/desktop/release-steps.ts:54:11)
$ npm run app:release -- --platfrom linux
Error: unknown argument --platfrom
    at scriptArgs (file:///Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O108/src/desktop/release-steps.ts:40:42)
$ grep -rn not_built src/desktop config/text/desktop.yml
no output, exit 1

$ grep -rn signSteps src tests docs README.md config --exclude=local.yml
src/desktop/release-steps.ts:9:// folder. The steps of each platform are plain data (`iconSteps`, `signSteps`, `archiveStep`), so a
src/desktop/release-steps.ts:113:export function signSteps(platform: AppPlatform, bundle: string): Step[] {
src/desktop/release.ts:41:    signSteps,
src/desktop/release.ts:127:        runSteps(signSteps(platform, folder));
tests/server/desktop/platform-steps.test.ts:11:    signSteps,
tests/server/desktop/platform-steps.test.ts:18:    const sign = signSteps(platform, '/work/out/oculus.app');
tests/server/desktop/platform-steps.test.ts:41:        expect(signSteps('darwin', '/apps/oculus.app')).toEqual([

$ wc -l src/desktop/release-steps.ts src/desktop/release.ts tests/server/desktop/platform-steps.test.ts
129, 146, 61, as the report's round section says

$ node src/server.ts --handler /nonexistent/handler.js    (refused at the argument parse, src/server.ts:41-43, before any port or hub read)
oculus: /nonexistent/handler.js is no file, so there is no handler to load
exit 1

$ tar -tzf release/oculus-1.0.0-linux-x64.tar.gz    (archive listed, not rebuilt)
41053 entries; oculus-linux-x64/resources/app/src/desktop/release-steps.ts listed; no package.ts
$ unzip -l release/oculus-1.0.0-darwin-arm64.zip    (archive listed, not rebuilt)
oculus.app/Contents/Resources/app/src/desktop/release-steps.ts listed, 5645 bytes, the snapshot's size; no package.ts
```

### Verdicts

Items of the brief's "What to build":

- `app:package` and `package.ts` gone, nothing makes an app that runs the checkout, `app:release` at the same paths with the same lines, `npm run app` unchanged: holds. The case greps and the missing-script error above show it. `release.ts:128-140` is outside the diff.
- `package.json`, the script line removed: holds. See the diff and the `grep '"app'` above.
- `src/desktop/release-steps.ts` (new): holds.
  - `diff` against `git show 85d449c47:src/desktop/package.ts` leaves only the launcher code deleted, the head comment rewritten, the `NAME`, `checkout` and `Step` export changes, the defaults and comments of `appPlatform` and `appArch`, and the round's `signSteps`.
  - The `NAME` and `checkout` exports are ruled (S1, round brief).
  - `Step` is unexported at line 26.
- `src/desktop/release.ts`: holds. Imports are at lines 31-44, the head comment at lines 1-9, and the wording grep prints nothing. Line 127 is as the round brief rules.
- `tests/server/desktop/platform-steps.test.ts`: holds. The import, the head comment, no `finishSteps`, the programs through the three helpers at lines 16-21, and the Linux `tar` row with the old row's arguments at lines 50-55.
- `tests/server/desktop/script-args.test.ts`: holds. Head comment and import at lines 1-8. Unchanged in the round.
- `src/desktop/package.ts` deleted: holds. `git status --short` prints ` D src/desktop/package.ts`.
- `src/desktop/app.ts`: holds. The `not_built` branch is gone, and `appHandler` stays at line 267. `existsSync` is still used, and eslint is green.
- `config/text/desktop.yml`: holds. The key is gone, and `tests/checks` is green.
- Installing the app: not applicable. It is outside the builder's work, and `~/Applications` is out of bounds.

Items of the round's brief:

- 1 (P1, St1): holds.
  - `signSteps(platform, bundle)` is at `release-steps.ts:113` and returns `[]` on Linux at line 114.
  - `release.ts:127` is `runSteps(signSteps(platform, folder));`.
  - `programs` has no branch of its own (test line 18).
  - The new assertion at test lines 41-44 holds both macOS steps whole and in order.
  - The head comment at test lines 3-4 is unchanged and now true: the platform reaches `signSteps`. `expect(programs('linux')).toEqual(['tar'])` reads the code's branch, and the darwin `toEqual` reads the other, found by reading.
- 2 (St2): holds. `release-steps.ts:1-4` says "and the icon, signing and archive steps and running them". The rest of the comment is unchanged and rewrapped. `comment-width.test.ts` passes in test:quick.
- 3 (B1, B2): holds. Each statement in the two report rows agrees with the code:
  - `src/desktop/app.ts:333-340` (`ended`), `:353` to `:370`, and base `app.ts:353-357`;
  - base `package.ts:92-94`, `:170-171` and `:188`;
  - `args.ts:105`, the catalog `server_exited` line, and `src/desktop/server/error-line.ts` (a stream with no line naming an error gives its last line as the reason).
- S1: ruled, no change. `release-steps.ts:17` and `:29` are unchanged.

Cases of the brief's "Cases":

- `grep '"app:package"'` and the missing-script error: met, above.
- `"app": "electron ."`: met, line 26.
- The wide grep and the `startedAsProgram` grep: met, exit 1 on both.
- `--platform nosuch`: met, same message, now at `release-steps.ts:54`.
- `--platfrom linux`: met, same message, now at `release-steps.ts:40`.
- Linux archive: met. The archive was listed, not rebuilt, and predates the round, as the round's brief allows: 41053 entries, `release-steps.ts` listed, no `package.ts`.
- macOS archive: met. The archive was listed, not rebuilt, and predates the round, as above. The `codesign` pass inside the script is the first reviewer's and the builder's result on the pre-round form of `release.ts:127`; see "Declined to judge".
- The two test files: met, 11 passed. Every row without `finishSteps` is kept, and the macOS and Linux programs are checked as the item says.
- `grep -rn not_built src/desktop config/text/desktop.yml`: met, exit 1.

Closures the builder claims, against the first report:

- P1: closed by a fix, with no check removed. The branch moved from the test and from `release.ts:127` into `signSteps`, and the sub-point on `new Set(mac)` is closed by the new whole-step assertion. All earlier assertions stay.
- St1: closed by the change of P1. No comment was edited.
- St2: closed by the wording change.
- B1, B2: closed in the report's "Report rows corrected".
- No fix reaches beyond its finding. The delta is the seven hunks the round's brief names: the head comment, the `signSteps` doc comment and signature, `release.ts:127`, test line 18, and the new assertion.

### Findings

#### 1. Spec

none

#### 2. Proof

none

#### 3. Standards

none

#### 4. Behaviour

none

### Declined to judge

- That `release.ts:127` is called in a real build in its round form. The round's archives predate it (the archived `release-steps.ts` is 5645 bytes, the snapshot's size), and rebuilding is excluded here. The report says so too. The orchestrator's release build after landing settles it. A removal of the call itself would leave the tests green, because `release.ts` runs its build when loaded (brief decision 2). The same holds for `runSteps(icon.steps)` and `runSteps([pack])`.
- The report's "`diff` with the base's output: no difference" for `sh utils/unused-exports.sh`. There is no base tree here, so the base side was not rerun. The rerun gives 337 lines and no desktop line, the count the report's first run and the first review give.
- `tests/server/desktop/start.test.ts`, and the report's "`Tests 5 passed (5)`" and "`Tests 5 failed (5)`": not run, under the standing demand, the test starting the app. This worktree still holds `cv.ts:141` `constructor(private readonly input: CvInput) {`, the reason the report and the prompt give. The `app.ts` branch removal is judged by reading only.
- The missing-handler dialog in a real app: not run. The report's B1 row rests on reading, as the report says, and that read agrees. The server's refusal line itself was rerun above.
- The builder's first runs on the unchanged tree and the "before" runs of verify 6: there is no base tree here. The round asks for no run on the unchanged tree.
- The report's `node -e "import('./src/lib/server/root/context.ts')..."`: not rerun. It concerns the `cv.ts` defect outside this step, and no decision of this review rests on it.
- `~/Applications/oculus.app`: out of bounds, not looked at.
- G85's Code and Test lines at `.scratch/migration/agents/guarded.md:298-300`: the Code line still names `src/desktop/package.ts`. The brief leaves this to the orchestrator at landing.

Usage: a85a27d09fd39ab43, claude-opus-5-5, 159344 tokens, 15 tool uses, 4.9 minutes

## Closed

- S1: ruled in the round's brief, `NAME` and `checkout` stay exported, no change.
- P1 and St1: closed by round 1, the platform choice now in `signSteps`.
- St2: closed by round 1.
- B1 and B2: closed by round 1 in the report's rows.
