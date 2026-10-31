# O109 report: the app's server starts

Everything in the brief is done.

## Open items of the state file

`.scratch/migration/orchestrator-state.md:180` has the heading "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)" and its text, and the list holds no entry (`sed -n 180,195p`, the next heading is "## Closed items").

## The cases' first run, on the unchanged tree

Run with `cv.ts` as it was at the base. vitest's result glyphs are written `x` and `ok` here, for the character set.

| Case | Result |
| --- | --- |
| New test on the unchanged `cv.ts` | fails, see the lines below |
| `node src/server.ts ...` for 25 s | exit=1, prints the crash below |
| `npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts` (the output of `grep -rl 'website/cv\|website/files' tests`) | `Test Files  2 passed (2)`, `Tests  72 passed (72)` |
| `npx vitest run tests/server/desktop/start.test.ts` | `Test Files  1 failed (1)`, `Tests  5 failed (5)`, `Duration  724.28s` |
| `sh utils/unused-exports.sh` | `Unused exports (227)`, 337 lines in all, kept as the base |

The new test's failing line on the unchanged tree:

```
 x |unit| tests/checks/source/strip-types.test.ts > a TypeScript file under src > can have its types stripped, as Node does to run it unbuilt 751ms
- []
+ [
+   "src/lib/server/content/audit/website/cv.ts: TypeScript parameter property is not supported in strip-only mode",
+ ]
```

The server case on the unchanged tree:

```
file:///Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O109/src/lib/server/content/audit/website/cv.ts:141

    constructor(private readonly input: CvInput) {
                                 ^^^^^^^^^^^^^^
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property is not supported in strip-only mode
```

The start test on the unchanged tree, the rows as printed (the fifth title cut by the command that listed it):

```
 x ... > brings the running app forward on a second start and starts no server 46793ms
 x ... > starts no server when another program holds the port, and names the port 600056ms
 x ... > stops the server process on Quit and leaves every tmux session running 36166ms
 x ... > prints the port in use and exits 1 when the server cannot listen 978ms
 x ... > asks the default port, passed as a held scratch port, whether an oculus answers there when no hub names a po
```

Its dialog line in the output: `dialog: The oculus server ended (exit code 1): SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property is not supported in strip-only mode`.

No case of the first run contradicts the brief's rules.

## DONE / NOT DONE

| Deliverable | State | Command | Output, as printed |
| --- | --- | --- | --- |
| `cv.ts`: the field declared, the constructor assigns it | DONE | `diff <base copy of cv.ts> src/lib/server/content/audit/website/cv.ts` | `> private readonly input: CvInput;`, `< constructor(private readonly input: CvInput) {`, `> constructor(input: CvInput) {`, `> this.input = input;` |
| `tests/checks/source/strip-types.test.ts` passes after the fix | DONE | `npx vitest run tests/checks/source/strip-types.test.ts --reporter=verbose` | `Tests  1 passed (1)`, row 664ms |
| The server case after the fix | DONE | the brief's command, `HOME` and `TMUX_TMPDIR` set to the scratch `O109-home` | `oculus on http://127.0.0.1:8797 over the workspace an unsaved workspace`; exit=142, the alarm of `perl -e 'alarm 25'` |
| The website file tests | DONE | `npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts` | `Test Files  2 passed (2)`, `Tests  72 passed (72)` |
| Verify 1, the list | DONE | `npm run diagrams`, then `npm run test:quick`, once | `test:quick: 45.8 s; every command passed` |
| Verify 2 | DONE | as row 2, with its failure on the unchanged tree quoted above | `Test Files  1 passed (1)` |
| Verify 3, the start test after the fix | DONE | `npx vitest run tests/server/desktop/start.test.ts --reporter=verbose` | `Test Files  1 passed (1)`, `Tests  5 passed (5)`, `Duration  145.44s` |
| Verify 4, unused exports | DONE | `sh utils/unused-exports.sh`, then `diff` of the base's lines with the final lines | diff printed nothing; 337 lines on each side; the step adds no line |
| Verify 5, history and character set | DONE | `LC_ALL=C grep -n '[^ -~]'` over the two files; `grep -niE 'before\|used to\|no longer\|still\|always ha\|as before\|previously\|the step adds\|after this package'` over the test | both printed nothing, each exit 1; every added comment line and the test titles read for history, none found |
| Verify 6, the cases | DONE | the rows above | quoted above |

The lines `npm run test:quick` printed:

```
test:quick: 2 changed file(s), from git since HEAD
test:quick: 11 test file(s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (10.5 s)
ok      vitest (24.9 s): Duration  12.96s (transform 7.82s, setup 0ms, import 11.82s, tests 5.79s, environment 0ms)
ok      svelte-check (32.0 s): 1793481242446 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (43.4 s): Duration  31.41s (transform 20.72s, setup 0ms, import 37.41s, tests 52.21s, environment 2ms)
test:quick: 45.8 s; every command passed
```

That list does not hold `tests/server/desktop/start.test.ts`, which is tagged slow; the row above is its proof. Its own "not covered" lines name the tests that reach no changed file, the build and the lint of unchanged files.

The start test after the fix, the rows as printed:

```
 ok ... > brings the running app forward on a second start and starts no server 35992ms
 ok ... > starts no server when another program holds the port, and names the port 34280ms
 ok ... > stops the server process on Quit and leaves every tmux session running 36992ms
 ok ... > prints the port in use and exits 1 when the server cannot listen 2964ms
 ok ... > asks the default port, passed as a held scratch port, whether an oculus answers there when no hub names a po
```

The server case after the fix, the lines as printed, with the scratch path shortened to `<home>`:

```
sessions watch: cannot watch <home>/.claude/projects: ENOENT: no such file or directory, watch ...
sessions watch: cannot watch <home>/.claude/sessions: ENOENT: no such file or directory, watch ...
sessions watch: cannot watch <home>/.codex/sessions: ENOENT: no such file or directory, watch ...
usage watch: cannot watch <home>/.claude: ENOENT: no such file or directory, watch ...
calendar publish: unconfigured
mail publish: unconfigured
oculus on http://127.0.0.1:8797 over the workspace an unsaved workspace
```

The list ran once. No whole-suite command ran (`npm test`, `npm run test:checks`, `npm run test:landing`, `npx vitest run` with no file named).

Nothing of mine is left running: `lsof -nP -iTCP:8797 -sTCP:LISTEN` and the same for 8817 print nothing, and `ps -ax -o pid,args | grep -E 'O109-home|migration-O109|o48-'` prints nothing.

## Files

Made from `git status --short` and `diff` against the base copy of `cv.ts`; this brief names no whole-tree base copy.

| Path | Lines | On the write list |
| --- | --- | --- |
| `src/lib/server/content/audit/website/cv.ts` | 433, +3 -1 | yes |
| `tests/checks/source/strip-types.test.ts` | 40, new | yes |
| `.scratch/migration/agents/reviews/O109-report.md` | this file | yes |

`build-app/` and `.svelte-kit/` exist in the worktree as generated folders that `.gitignore:5` and `.gitignore:2` hold; `git status --short` lists only the two source paths.

No existing test, assertion, allow list or predicate is edited. The step adds one test, its failing line quoted above.

## Judgment calls, each reversible

1. The field sits after `people` and before `at`, with the class's other private fields, and carries no doc comment, like `people` and `at` beside it.
2. The refused file is listed as one string, `src/<path>: <Node's message>`, so that the received list names the file and the reason. The message is read as `(error as Error).message`.
3. The helper `refusal` is local to the test. `grep -rln stripTypeScriptTypes src tests` prints only the new test, so no existing helper covers it. The walk is the shared `treeFiles` of `tests/checks/walk.ts`.
4. `npx svelte-kit sync` was run once in the worktree before the base of `utils/unused-exports.sh`. Without `.svelte-kit`, which `npx vite build --mode app` leaves absent (it writes `.svelte-kit-app`), knip prints `ERROR: Error loading vite.config.ts (File './.svelte-kit/tsconfig.json' not found.)` and the script ends on `knip stopped with status 2`. Both the base and the final run are the clean form, status 0.
5. `tests/server/desktop/start.test.ts` listens on its own port 8817 (`tests/server/desktop/start.test.ts:32`). The launch prompt names 8797 as the only port; the brief's verify item 3 asks for this test, and I ran it as written. 8787 and 8790 were not touched.

## User-visible changes

| Where | Before | After |
| --- | --- | --- |
| The desktop app's start, and `node src/server.ts` | the server ends on `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`, and the app shows the dialog "The oculus server ended (exit code 1)" | the server starts and prints `oculus on http://127.0.0.1:<port>`; the drawn window is not verified here, since the start test's recorder stands in for it and a builder runs no page |

The website's CV output does not change: `this.input` holds the same object as the parameter property did, and the 72 website and audit rows pass. No view changes, so nothing is owed to a look on 8790. The packaged app is the orchestrator's half of the step after landing.

## Wrong or impossible in the brief

- Nothing in the brief is wrong. Each premise reproduces: `find src -name '*.ts' ! -name '*.d.ts' | wc -l` prints 1524, `node -v` prints v24.21.0, and the new test refuses that one file on the unchanged tree. `find src -type f \( -name '*.mts' -o -name '*.cts' \) | wc -l` prints 0, so reading `.ts` alone misses no module of those kinds.

## Limitations and sharp edges

- The check strips on the Node that runs vitest, and the app's server runs on Electron's Node through `utilityProcess.fork` (`src/desktop/server/process.ts:83`). They agree now: `ELECTRON_RUN_AS_NODE=1 <electron binary> -p process.versions.node` prints 24.21.0 for the pinned Electron 44.5.1. A later Electron with a different Node could strip differently; the start test is the one run that goes through Electron's own Node, and it is slow-tagged, so it is outside `npm run test:quick`.
- As the head comment says, an import Node cannot resolve, such as a `$lib` alias, is not seen by the check. Only a real start shows it.
- The check reads all of `src`, client files included, as the brief's decision 2 says, so a client-only file with an `enum` is refused too, though the server never loads it.
- The test's row takes 664 ms (the verbose run above) on a read of 1524 files. It stays untagged, as the brief says; a growing tree moves it towards the spec's "well under a second".
- `tests/shell/panes/strip/tab-menu.test.ts:112` holds a parameter property. It lies under `tests`, which the check does not read and the app does not ship, so it stays.
- `/tmp` holds 23 `o48-*` folders, the scratch form `tests/server/desktop/start.test.ts` makes at `mkdtempSync(join('/tmp', 'o48-'))`. `find /tmp/ -maxdepth 1 -name 'o48-*' -mmin -40 | wc -l` prints 1 and the same with `-mmin +40` prints 22, so one is from this step's runs, which of the two I did not establish, and 22 are older. I removed none, since they lie outside the worktree.

## Guarded entry for the landing

`.scratch/migration/agents/guarded.md` is the orchestrator's. The entry names `tests/checks/source/strip-types.test.ts`, title "a TypeScript file under src can have its types stripped, as Node does to run it unbuilt"; the entry for the comment check at `guarded.md:419` is the form.

## Comments and documents re-read

- `cv.ts` head comment and the doc comment of `class Cv`: still true.
- `grep -rnE 'constructor\((private|public|protected|readonly)' src tests docs README.md` prints only `tests/shell/panes/strip/tab-menu.test.ts:112`, so `src` holds no other parameter property.
- `grep -n 'cv.ts\|Cv\b' docs/*.md` prints nothing; no README or guide describes the changed code.
- No catalog key, config key, route, id or asynchronous path is added.
