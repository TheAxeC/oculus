Everything in the brief is done. Nothing was run that starts the Electron app, so the rows that start it (the slow lane of `npm run test:landing`, `start.test.ts`, the look of the dialogs) are the orchestrator's at landing.

## Open items of the state file, verbatim

- Z627 (2026-10-06, step O30, raised by the diagnosis of its landing red line): `npm run app` from a checkout builds the server into the same `.svelte-kit/output` and `build/` as every other build of that checkout, so a `npm run build` in that checkout during the app's start fails it with the dialog "The build of the oculus server failed" (the record's red command, still red with the landing's fix). Options: (a) the app's build from the checkout writes into folders of its own (a `kit.outDir` and an adapter `out` the app passes to `vite build`, the server told where its handler is by a flag), with the folder pair in `.gitignore` and DESIGN.md's tree, recommended, since a start then never meets another build; (b) leave it, and rely on the landing running the slow tests after its build, the lazy one. The folder names and the flag are a shape nothing names yet, which is why this is yours.
- Z628 (2026-10-06, step O30, raised by the same diagnosis): `tests/checks/diagrams/diagrams.test.ts` carries its own 60 s limit on three cases (:85, :111, :826), while `npm run test:checks` runs the tree checks with no time limit by their documented rule (`vite.config.ts:34-36`, README.md:17); under the landing's parallel load one case took 62.4 s and failed (alone, 19.4 to 20.5 s). Removing a limit is a threshold changed to pass a check, which `agents/spec.md` forbids as an edit, so it is raised. Options: (a) drop the three per-case limits so the tree checks follow their documented rule, recommended; (b) keep them and rerun the tree checks alone after a red from load, the lazy one.
- Z624 (2026-10-06, step A3, raised by the review over its round 2): the new test 'refuses a rename or a drop while the lock is held, committing nothing' (`tests/server/machine/schedules/record.test.ts:55-81`) guards a behaviour no entry of `agents/guarded.md` names: G31 covers a record file that does not read, not a lock that stays taken. Options: (a) G31 gains "or whose lock stays taken", and at A3's landing the test is folded into G31's table under fake timers with one row through `handleSchedules` showing `schedules.yml` and the record byte-equal, its `slow` tag dropped, recommended, since a save that writes under another oculus's lock can lose a run record and start an unwanted catch-up run; (b) no entry, the test does not land and the behaviour is shown by the review's probe run. A3's landing waits on this.
- Z620 (2026-10-06, step O30, raised by its second diagnosis): a test for the terminal modes given to an attaching page needs a new entry in `agents/guarded.md`, which only Axel adds. Options: (a) add under "Your work is not lost or misplaced": "A page that attaches to a terminal, on a reconnect or in a new grid, is given the modes the pane's program set, so a paste, the arrow keys and the mouse reach the program in the form it asked for.", with its tests in `tests/server/machine/pty/sessions.test.ts` and `channel.test.ts`, recommended, since a lost mode sends a paste as typed keys and runs it; (b) no entry, the fix shown by the diagnosis's runs only. Z619's fix lands without a test until this is ruled.
- Z621 (2026-10-06, step O30, raised by its second diagnosis, not diagnosed): a pane in an editor's alternate screen is given to an attaching page as plain text in the grid's normal buffer, so the editor's screen is not restored as an alternate screen. This was on main before O30. Options: (a) a step of its own that reads tmux's `#{alternate_on}`, switches the grid to its alternate buffer before writing the capture, and gives the normal buffer's capture first, so leaving the editor shows the shell's text again, recommended; (b) switch the grid to its alternate buffer only, which loses the shell's text when the editor exits; (c) leave it, the lazy one.
- Z605 (2026-10-06, step E4, raised at its landing): main's commit 57c6ba7e6 removed the test `describe('the shipped files')` from `tests/data/sources/config/settings.test.ts`, as one no guarded entry names; E4 added its eight `apps.*` keys to that test, so the cherry-pick in the gate worktree brings it back. Removing it again in the gate was refused by the runner's auto mode classifier as a test removal, and a refused call is not retried in another form (Z551). Options: (a) Axel removes that `describe` block in `.agents/worktrees/gate/tools/oculus/tests/data/sources/config/settings.test.ts` himself, or allows the edit, so the file matches main's sweep plus E4's `appsSettings` rows, recommended, since 57c6ba7e6 already ruled the test out; (b) keep the test with E4's keys, which brings back a test no guarded entry names, against `agents/spec.md`'s test rule. E4's landing waits on this; the gate holds the cherry-pick with the diagram conflicts not yet resolved, and main is untouched.

## The cases' first run

Run on the worktree as the session left it (the patch applied, item 20 not yet applied, no change of mine), each by its command or reading.

- 17.1, by reading `tests/tiers/landing.mjs`: unmet. `grep -n "test:slow\|npm run check\|npm run build"` printed `22: 'npm run check, then npm run build',`, `24: ['-c', 'npm run check; c=$?; npm run build; b=$?; [ $c -eq 0 ] && [ $b -eq 0 ]']` and `33: ['npm run test:slow', NPM, ['run', 'test:slow']]`: the lane holds two commands and `test:slow` is an entry of its own.
- 17.2, the lane's `sh -c` line as it stood, with a scratch `npm` first on `PATH` that logs each call and exits 1 for the call named: unmet. With `run test:slow` failing: `exit 0`, calls `run check,run build`. With none failing: `exit 0`. With `run check` failing: `exit 1`, calls `run check,run build`. The line never calls `test:slow`.
- 18.1, scratch module `p18/printed.ts` made by `extract.mjs`, which copies `printed()` verbatim from `start.test.ts` (lines 169 to 194), driven by `node -e` printing `[screen] dialog` then sleeping 30 s: unmet. `18.1 (dialog line before the awaited text): no answer within 2000 ms`; the child was ended after (`18.1: child ended`).
- 18.2, the same module, child printing the awaited text then `[screen] dialog`: holds. `settled after 25 ms`.
- 18.3, child printing `dialog: Port 8817 is held by another program.` then `[screen] dialog`, waiting for the message: holds. `settled after 23 ms`.
- 18.4, child printing `something else` and exiting: holds. `rejected after 24 ms: no line with "oculus on http://127.0.0.1:8817"; the output was: // something else //`.
- 19.1 to 19.5, the real `buildServer` of `build.ts` run with a scratch root whose `node_modules/vite/bin/vite.js` prints each stream of the case on stderr and exits 1 (`p19/build-first.ts`, run by `node`): 19.1 unmet (`{"ok":false,"last":"}"}`), 19.2 unmet (`"last":"Node.js v24.21.0"`), 19.3 unmet (`"last":"Node.js v24.21.0"`), 19.4 holds (`"last":"done"`), 19.5 unmet (`"last":"}"`). No shared function existed (`ls src/desktop/server` listed `build.ts`, `health.ts`, `login-env.ts`, `process.ts`).
- 20.1, `patch -p1 -E --dry-run -i O30-landing-fixes.diff` from the worktree root: holds. It printed `patching file '...'` for each of the 28 files, no `FAILED`, no `Reversed`, exit 0.
- 20.2, `diff -rq` of `src`, `tests`, `config` (`--exclude=local.yml`), `package.json`, `HELP.md`, `DESIGN.md` against `.agents/worktrees/gate-O30/tools/oculus`, before the apply: listed 14 differing files under `src`, the move of `read-again.ts` (`Only in` on both sides), `config/text/views/sessions/terminal.yml`, `package.json`, `HELP.md` and `DESIGN.md`. A scan for `^<<<<<<<` over `*.ts`, `*.svelte`, `*.json`, `*.md`, `*.dot`, `*.svg` found the seven files the brief names (`package-lock.json`, `package.json`, `layers.svg`, `layers.dot`, `layer-views.svg`, `layer-views.dot`, `Source.svelte`).

No case turned out to be wrong in the rule the brief gives for it.

## DONE / NOT DONE

| Item or check | State | Command and output |
|---|---|---|
| 17, one lane of check, build, slow tests | DONE | `tests/tiers/landing.mjs:25-30`; `grep -n "test:slow" tests/tiers/landing.mjs` prints only the lane name (:25) and the shell line (:29), so no entry of its own names it |
| 17.1 | DONE | the lane's line: `npm run check; c=$?; npm run build; b=$?; npm run test:slow; s=$?; [ $c -eq 0 ] && [ $b -eq 0 ] && [ $s -eq 0 ]`, one entry, no other entry names `test:slow` |
| 17.2 | DONE | scratch `npm`, the lane's line run with `sh -c`: only `run test:slow` failing gives `exit 1`, calls `run check,run build,run test:slow`; none failing gives `exit 0`; `run check` failing gives `exit 1`, calls `run check,run build,run test:slow` |
| 18, `printed()` fails at once on a dialog | DONE | `tests/server/desktop/start.test.ts:165-204`, the head comment (:165-171) says the rule by order (see Repair round 1) |
| 18.1 | DONE | `18.1 ...: rejected after 26 ms: a dialog before "oculus on http://127.0.0.1:8817"; the output was: // [screen] dialog //` |
| 18.2 | DONE | `18.2 ...: settled after 27 ms` |
| 18.3 | DONE | `18.3 ...: settled after 25 ms` |
| 18.4 | DONE | `18.4 ...: rejected after 26 ms: no line with "oculus on http://127.0.0.1:8817"; the output was: // something else //` |
| 19, the reason is the last error-naming line | DONE | `src/desktop/server/error-line.ts` (`errorReason()`), used by `build.ts:25,33,46` and `process.ts:80,95,115,117` |
| 19.1 to 19.5 | DONE | the function and `buildServer` through the fake vite give: 19.1 `Error: Could not load /x/.svelte-kit/output/server/manifest.js: ENOENT: ...`, 19.2 `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'x' imported from /y.js`, 19.3 `SyntaxError: Unexpected token '}'`, 19.4 `done`, 19.5 `Error: b` |
| 19, the server process | DONE | `process.ts` run under plain Node with `electron` stubbed by a scratch resolve hook (no Electron started): a server printing the 19.2 stream and exiting 1 gives `{"kind":"exited","code":1,"reason":"Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'x' imported from /y.js"}`; a bare `listen EADDRINUSE: ...` line then `done` gives `"reason":"done"` |
| 20, the landing's fixes | DONE | `patch -p1 -E`, below |
| 20.1 | DONE | dry run: no `FAILED`, no `Reversed`, exit 0; after the apply `grep -rn '^<<<<<<<\|^>>>>>>>' . --include='*.ts' --include='*.svelte' --include='*.json' --include='*.md' --include='*.yml' --exclude=local.yml --exclude-dir=node_modules` printed nothing (exit 1); no `.orig` or `.rej` file |
| 20.2 | DONE | after items 17 to 19, `diff -rq` of `src`, `tests`, `config`, `package.json`, `package-lock.json`, `HELP.md`, `DESIGN.md`, `README.md` and `docs` against gate-O30 lists `src/desktop/app.ts`, `src/desktop/server/build.ts`, `src/desktop/server/process.ts`, `Only in src/desktop/server: error-line.ts`, `tests/server/desktop/start.test.ts`, `tests/tiers/landing.mjs` and nothing else |
| Lockfile | DONE | `npm install --offline --dry-run`: `up to date in 406ms`; `cmp package-lock.json` against a copy taken before: identical |
| V1, `npm run diagrams`, then checks.sh | DONE | `diagrams exit 0`; then `test:quick: 31.7 s (limit 45.0 s); every command passed` and `checks: 1 commands passed` (exit 0). The lines it printed: `ok ASCII gate (0.4 s)`, `ok prettier (1.6 s): All matched files use Prettier code style!`, `ok svelte-kit sync (1.8 s)`, `ok eslint (18.3 s)`, `ok svelte-check (22.4 s): ... COMPLETED 379 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest (31.2 s): Duration 27.20s ...` |
| V2, prettier and eslint over the changed files | DONE | `npx prettier --check`: `All matched files use Prettier code style!` exit 0; `npx eslint`: no output, exit 0 |
| V3, non-ASCII | DONE | `LC_ALL=C grep -n '[^ -~]'` over the six changed files: no output, exit 1; the ASCII gate of `checks.sh` is `ok` |
| V4, comment width and history | DONE | `npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts`: `Test Files 2 passed (2)`, `Tests 5 passed (5)` |
| Tree checks over the files the step changes | DONE | `npx vitest run tests/checks/tree tests/checks/imports tests/checks/source tests/checks/diagrams tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0`: `Test Files 13 passed (13)`, `Tests 195 passed (195)` |
| V6, no process left | DONE | `pgrep -fl 'Electron\|src/server.ts'` prints only Visual Studio Code's crashpad handler (pid 943, started before this step); with that line removed it prints nothing |
| V7, list items and sentences | DONE | no list item or Markdown sentence was added by items 17 to 19; the new comment sentences were read against the spec's rules and none departs |

What these do not cover: no run of `start.test.ts`, `npm run test:slow` or `npm run test:landing`, by the brief's rule. `printed()` was run as a verbatim copy, not inside vitest. `process.ts` ran against a stub of `electron`, not inside Electron.

## `patch -p1 -E`

```
patching file 'tools/oculus/config/text/views/sessions/terminal.yml'
patching file 'tools/oculus/DESIGN.md'
patching file 'tools/oculus/docs/diagrams/layer-shell.dot'
patching file 'tools/oculus/docs/diagrams/layer-shell.svg'
patching file 'tools/oculus/docs/diagrams/layer-views.dot'
patching file 'tools/oculus/docs/diagrams/layer-views.svg'
patching file 'tools/oculus/docs/diagrams/layers.dot'
patching file 'tools/oculus/docs/diagrams/layers.svg'
patching file 'tools/oculus/HELP.md'
patching file 'tools/oculus/package-lock.json'
patching file 'tools/oculus/package.json'
patching file 'tools/oculus/src/desktop/windows/bridge.ts'
patching file 'tools/oculus/src/desktop/windows/windows.ts'
patching file 'tools/oculus/src/lib/server/machine/pty/channel.ts'
patching file 'tools/oculus/src/lib/server/machine/pty/sessions.ts'
patching file 'tools/oculus/src/lib/shell/desktop-windows.svelte.ts'
patching file 'tools/oculus/src/lib/state/client/socket.svelte.ts'
patching file 'tools/oculus/src/lib/state/client/writes.svelte.ts'
patching file 'tools/oculus/src/lib/state/shared/stores/desktop.ts'
patching file 'tools/oculus/src/lib/state/shared/stores/shapes.ts'
patching file 'tools/oculus/src/lib/state/shared/words/appearance.ts'
patching file 'tools/oculus/src/lib/state/workbench/layout/index.ts'
patching file 'tools/oculus/src/lib/views/sessions/terminal/grid/TerminalGrid.svelte'
patching file 'tools/oculus/src/lib/views/sessions/terminal/terminal-list.ts'
patching file 'tools/oculus/src/lib/views/sources/source/actions/read-again.ts'
patching file 'tools/oculus/src/lib/views/sources/source/actions/ReadAgainButton.svelte'
patching file 'tools/oculus/src/lib/views/sources/source/read-again.ts'
patching file 'tools/oculus/src/lib/views/sources/source/Source.svelte'
```

The dry run printed the same lines, exit 0. Every hunk was read before it was applied, and each answers a finding or ruling the brief names. No hunk was left out.

| File | Hunk | Answers |
|---|---|---|
| `config/text/views/sessions/terminal.yml` | adds `paste_confirm_one: Paste 1 line into the terminal?` | Z612 |
| `DESIGN.md` | the pty bridge bullet (:374-375) says the page is given the pane's modes after the capture (`modesAt`) | Z619 |
| `DESIGN.md` | the environment bullet gains the `--default-port <n>` sentence | St2-2 |
| `HELP.md` | The window paragraph (:13): a restart onto another port moves every window there with its arrangement, settings and unsaved text | B2-3 |
| `HELP.md` | the Terminal row: a paste holding a line break, a single line ending in one included, asks first; a terminal shown again after a restart keeps the modes the program set | Z612, Z619 |
| `docs/diagrams/layer-shell.dot`, `.svg` | edge count 8 to 9 | regenerated count after B2-3's new import |
| `docs/diagrams/layer-views.dot`, `.svg`; `layers.dot`, `.svg` | conflict markers resolved, counts 232, 16, 74, 202, 101, 901 | the merge, and S2-1's move |
| `package.json`, `package-lock.json` | keeps both `sh-syntax` and `shell-env` | the merge of the two dependency lists |
| `src/desktop/windows/bridge.ts` | a drop outside answers false for a window that is loading, navigating or has crashed | B2-4 |
| `src/desktop/windows/windows.ts` | `moveTo` sends `'move-to'` to a running page and loads the URL only for a loading or crashed one | B2-3 |
| `src/lib/server/machine/pty/sessions.ts` | `PANE_MODES`, `modesAt`, `cursorArgs` reads the mode flags, `screenAt` accepts them | Z619 |
| `src/lib/server/machine/pty/channel.ts` | the screen message ends with `modesAt(cursor)` | Z619 |
| `src/lib/shell/desktop-windows.svelte.ts` | the `'move-to'` listener carries the workbench and assigns the new location | B2-3 |
| `src/lib/state/client/socket.svelte.ts` | subscribes as the socket opens; a changed token goes out as `{ type: 'subscribe', channels: [], token }`; a reconnect renews the token | B2-1, B2-2 |
| `src/lib/state/client/writes.svelte.ts` | `onToken`, and `setToken` calls the listeners when the token changes | B2-1, B2-2 |
| `src/lib/state/shared/stores/shapes.ts` | `WritesStore` gains `onToken` | B2-1, B2-2 |
| `src/lib/state/shared/stores/desktop.ts` | the bridge gains the `'move-to'` event | B2-3 |
| `src/lib/state/workbench/layout/index.ts` | re-exports `carryWorkbench` | B2-3 |
| `src/lib/state/shared/words/appearance.ts` | drops the comment clause on the window guard | St2-1 |
| `TerminalGrid.svelte`, `terminal-list.ts` | the paste question for one line; `pasteLines` and `holdPastes` comments say a paste with a line break is held | Z612 |
| `views/sources/source/read-again.ts` to `actions/read-again.ts`, `actions/ReadAgainButton.svelte`, `Source.svelte` | the read-again button and its module moved, `Source.svelte` takes main's side with S2-1 over it | S2-1 and the Source.svelte merge |

## Files changed by items 17 to 20, line counts

Items 17 to 19 (`wc -l`): `tests/tiers/landing.mjs` 54, `tests/server/desktop/start.test.ts` 333, `src/desktop/server/error-line.ts` 31 (new), `src/desktop/server/build.ts` 51, `src/desktop/server/process.ts` 142, `src/desktop/app.ts` 323. Item 20: the 28 files of the table above, as in the landing's state.

Edits to existing assertions, allow lists and predicates: none. `diff` of `start.test.ts` against the landing's copy changes the doc comment and the body of `printed()` only (Repair round 1 gives its final form); no `it` title or `expect` changes. The failing line of the changed helper on the unchanged tree is case 18.1's first run: `no answer within 2000 ms`.

Repeated names: `grep -rn "lastError\|errorLine\|names an error" src` before the change found `errorLine` in `src/lib/data/sources/yaml-file.ts:15`, which returns an exception's message and is a different rule, and no helper to reuse. The unused-exports comparison (`sh utils/unused-exports.sh` against `O30-base/unused-exports.txt`) shows no line for `error-line.ts`. It lists lines the step as built added and this round did not touch: `src/lib/server/root/process/parent.ts: parentOf, askParentToPick` and `ParentPort`, which `src/server.ts:16,45,58` imports; why the tool reports them is not investigated. It lists fewer lines than the base for `config.ts`, `local.ts` and `ssh.ts`, where the step's code now uses the names.

Documents read after the change: `HELP.md`, `DESIGN.md` and `README.md` hold no sentence on the lane order, on `printed()` or on which line a dialog quotes (`grep -n -i "stderr\|error line\|last line"` finds none that describe them): still true. The head comments of `build.ts` and `process.ts` (still true), `landing.mjs` (rewritten), `printed()` (rewritten).

## Judgment calls the brief left open, each reversible

1. The shared function is a tracker, `errorReason()` returning `{ note(line), text() }`, in a new module `src/desktop/server/error-line.ts`, so neither file keeps the whole stream. The one rule is the pattern `^ *\w*Error(?: \[[^\]]*\])?:`. An indented `    Error: x` counts as an error line, as the brief's "after any leading spaces" says.
2. The field and parameter named `last` in `BuildResult`, the server's `exited` start, `onLost` and `app.ts`'s `ended` is now `reason`, since it no longer holds the last line. `app.ts` is outside the three paths items 17 to 19 name and inside `src/desktop/` of the first brief's list.
3. `landing.mjs`'s head comment: the sentence listing the commands was reworded (the slow tests now sit with the type check and the build, `one lane, in that order`) rather than only extended, so that it names the slow tests in the lane. Nothing else in the file changed.
4. `npm install --offline` was run as `--dry-run`, so `node_modules` was not touched. `npx svelte-kit sync` was run once so that `utils/unused-exports.sh` could load `vite.config.ts`; it writes only under the ignored `.svelte-kit` of the worktree.
5. The tree checks over the changed files were run beyond the brief's list, because item 20 resolves conflicts in files those checks read (size, boundaries, diagrams, keys).

Nothing in the brief was wrong or impossible.

## Host- and user-visible changes

| What | Before | After |
|---|---|---|
| The dialog when the build fails | `The build of the oculus server failed: }` | `The build of the oculus server failed: Error: Could not load .../manifest.js: ENOENT ...`, the error line itself |
| The dialog when the server process ends | `The oculus server ended (exit code 1): Node.js v24.21.0` | the same sentence ending in the stream's last error line, for example `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'x' imported from /y.js`; the last line when none names an error |
| `npm run test:landing` | the slow tests ran in a lane of their own beside the lane of the type check and the build | one lane runs `npm run check`, `npm run build`, `npm run test:slow` in that order, each to its end, red when any one is red; the lane's time is about 826 s against 703 s (added from the gate log, not measured) |
| A slow row that meets a dialog it did not wait for | waited to its 10-minute limit | fails at once, its error holding the awaited text and every line the app printed |
| Item 20, as the landing's fixes | none of B2-1 to B2-4, Z612, Z619 present | a restart onto another port moves every window and carries its arrangement, settings and unsaved text; a drop onto a loading or crashed window answers false; a one-line paste ending in a line break asks `Paste 1 line into the terminal?`; a terminal shown again keeps the modes its program set |

The look of the dialogs is the orchestrator's: put the app in a build failure (a failing `vite build` in the checkout) and read the dialog's reason; the app was not started by this step.

## Repair round 1

Everything in the round brief is done. Nothing I ran starts the Electron app, imports or runs `tests/tiers/landing.mjs`, or runs a git command.

### Finding 1: `printed()` decides by order

`tests/server/desktop/start.test.ts:165-204`. The wait settles only when the first line holding `text` comes before the first line opening `[screen] dialog`, and fails at once when a dialog line comes first, at the call and on each chunk.

```ts
const decided = (): boolean => {
    const said = lines.findIndex((line) => line.includes(text));
    const asked = lines.findIndex((line) => line.startsWith('[screen] dialog'));
    if (said !== -1 && (asked === -1 || said < asked)) {
        done();
        return true;
    }
    if (asked === -1) return false;
    fail(new Error(`a dialog before "${text}"; the output was:\n${lines.join('\n')}`));
    return true;
};
...
if (decided()) return;
for (const stream of streams) stream?.on('data', heard);
```

`heard` calls `decided()` on each chunk and removes the listeners when it returns true; the `close` path still fails with `no line with "<text>"`. The head comment states the rule by order. Cases, each run on a verbatim copy of the changed `printed()` (copied by the scratch `extract.mjs` from the test file's lines 173 to 204) in a scratch module with a `node -e` child, the child ended after, the scratch files removed after:

```
18.1 (dialog line before the awaited text): rejected after 23 ms: a dialog before "oculus on http://127.0.0.1:8817"; the output was: // [screen] dialog //
18.2 (awaited text, then a dialog line): settled after 27 ms
18.3 (a dialog message, then its recorder line): settled after 27 ms
18.4 (neither, child exits): rejected after 28 ms: no line with "oculus on http://127.0.0.1:8817"; the output was: // something else //
18.5 (one write, dialog line then the text): rejected after 30 ms: a dialog before "oculus on http://127.0.0.1:8817"; the output was: // [screen] dialog // oculus on http://127.0.0.1:8817 //
18.6 (both lines printed before the call, dialog first): rejected after 1 ms: a dialog before "oculus on http://127.0.0.1:8817"; the output was: // [screen] dialog // oculus on http://127.0.0.1:8817 //
18.7 (one write, the text then the dialog line): settled after 40 ms
```

18.5 and 18.6 are the two inputs the review named.

### Finding 2: a dialog's message is printed before the recorder's line, on one stream

```
$ grep -n "log(\`dialog\|showMessageBox" src/desktop/dialogs.ts
24:    log(`dialog: ${options.message}`);
34:            ? await dialog.showMessageBox(box)
35:            : await dialog.showMessageBox(options.window, box);
$ sed -n 51,54p src/desktop/app.ts
function print(line: string, error = false): void {
    if (error) console.error(line);
    else console.log(line);
}
$ sed -n 107,108p src/desktop/app.ts
    const say = (message: string, buttons: string[]): Promise<number> =>
        showDialog({ message, buttons }, print);
$ sed -n 12,14p tests/server/desktop/app-harness.ts
function record(what: string): void {
    process.stdout.write(`[screen] ${what}\n`);
}
$ sed -n 22,25p tests/server/desktop/app-harness.ts
dialog.showMessageBox = (): Promise<never> => {
    record('dialog');
    return new Promise<never>(() => undefined);
};
```

`say` logs the message through `print` (line 24), which writes a non-error line with `console.log`, then calls `dialog.showMessageBox` (lines 34 and 35), which the harness replaces with the recorder. The recorder writes `[screen] dialog` with `process.stdout.write`. Both reach the app's stdout, the message first, so a row waiting for the message of the dialog it expects settles on it before the recorder's line (case 18.3).

### Finding 3: why `unused-exports.sh` lists the `parent.ts` names

```
$ grep -n '"main"' package.json
6:    "main": "src/desktop/main.ts",
$ sed -n 23p utils/unused-exports.sh
node_modules/.bin/knip --production --include exports,types --reporter compact --no-progress
$ grep -n "parentOf\|askParentToPick\|ParentPort" src/server.ts
16:import { askParentToPick, parentOf, type ParentPort } from './lib/server/root/process/parent.ts';
45:const parent = parentOf((process as { parentPort?: ParentPort }).parentPort);
58:if (parent !== null) context.folderPicker.ask = askParentToPick(parent);
```

The tool runs knip in production mode with no configuration file (`ls -a | grep -i knip` finds none, and `knip` appears in `package.json` only as the devDependency at line 41), so its entries come from `package.json`: `main`, the scripts and the SvelteKit routes. `src/server.ts` is none of them (the app forks it by path, `src/desktop/app.ts`), so the three names count as unused although `src/server.ts` imports and uses them. The base list shows the same effect: it already flags `engineDir`, which `src/server.ts:11` imports. The three names are used and stay.

### Finding 4: the two greps

The history-word grep of `agents/spec.md`, over the lines this preparation added or changed in the six files (a `diff` against the landing's copy, 94 lines):

```
$ grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands" added-lines.txt
18:tests/server/desktop/start.test.ts:  * fail at once when a line opening `[screen] dialog` comes before it, at the call and on each
20:tests/server/desktop/start.test.ts:  * limit. The app prints a dialog's message before the recorder's line, so a row that waits for the
32:tests/server/desktop/start.test.ts:             fail(new Error(`a dialog before "${text}"; the output was:\n${lines.join('\n')}`));
```

All three hits name the order of lines in one output stream; none compares with an earlier state of the code. `npx vitest run tests/checks/source/history.test.ts` passes (below).

The renamed `last` field:

```
$ grep -rn -E "\.last\b|\blast:|started\.last|built\.last" src/desktop tests/server/desktop tests/tiers config HELP.md DESIGN.md README.md --exclude=local.yml
HELP.md:202: ... a tab whose editor had the focus last: `${file}` ...
```

The one hit is prose about a focus, not the field. Over the whole `src` the same grep also finds only unrelated `last` fields of other modules (`UpdateTray.svelte`, `sessions/record.ts`, `sessions/group.ts`, and similar), none in `src/desktop` and none read from a build result or a server start.

### Finding 5: comment wrapping

`printed()`'s doc comment (`start.test.ts:165-171`) and `landing.mjs`'s head comment (:1-14) are rewrapped as whole paragraphs at 100 columns. A script over both comments found the longest line at 100 columns and no line inside a paragraph that ends where the next word would still fit (its only hits were the paragraph breaks `//` and `/**`).

### Verify, from the worktree's `tools/oculus`, after the last change

```
$ npx prettier --check tests/server/desktop/start.test.ts tests/tiers/landing.mjs
All matched files use Prettier code style!     (exit 0)
$ npx eslint tests/server/desktop/start.test.ts tests/tiers/landing.mjs
(no output, exit 0)
$ LC_ALL=C grep -n '[^ -~]' tests/server/desktop/start.test.ts tests/tiers/landing.mjs
(no output, exit 1)
$ npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts
 Test Files  2 passed (2)
      Tests  5 passed (5)
$ sh ~/.claude-work/skills/land/templates/checks.sh .../orchestrator-state.md
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.7 s)
ok      eslint (7.3 s)
ok      svelte-check (6.6 s): 1791263570285 COMPLETED 379 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (12.1 s): Duration  9.13s (transform 13.07s, setup 0ms, import 21.01s, tests 12.88s, environment 401ms)
test:quick: 12.6 s (limit 45.0 s); every command passed
checks: 1 commands passed     (exit 0)
```

`diff -rq` of `src`, `tests` and `config` against gate-O30 still lists only `app.ts`, `build.ts`, `process.ts`, `error-line.ts` (new), `start.test.ts` and `landing.mjs`. Line counts: `start.test.ts` 333, `landing.mjs` 54. `pgrep -fl 'Electron|src/server.ts'` with Visual Studio Code's crashpad handler (pid 943, running before this step) removed prints nothing.

Not covered: `start.test.ts` was not run (its rows start the app); `printed()` ran as a verbatim copy in a scratch module.
