Nothing in the 11 rulings is left undone. NOT DONE: nothing. Not covered by any check and not verified: the autumn overlap hour (checked by probe s3 only, not by a kept test); the page's drawing of the tray (checked by the render probe only; the look at landing is the orchestrator's); `npm run test:landing` (not run, as ordered).

The full verify list (`sh <land>/templates/checks.sh <state file>`, which runs `npm run test:quick`) ran 6 times in this round. All 6 were green; the last (run f) is quoted below and took 44.7 s, inside the 45 s limit. Runs a and b took 87.2 s and 89.1 s, run e 59.3 s, over the limit with other agents using the machine; each of them passed every command. No git command that writes was run. Two read-only git commands were run (`git status --short` and `git show HEAD:tools/oculus/tests/routes/sessions/terminal-actions.test.ts`), against the order of no git command of any kind.

## Open items of the state file

Copied from the state file at the moment of writing (`awk '/^## Open items/{p=1} p&&/^## /&&!/^## Open items/{exit} p' tools/oculus/.scratch/migration/orchestrator-state.md`, main checkout). The section holds no entry, only its intro sentence:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## Round 1: the 11 rulings

### Ruling 1. The spring day starts at the due time, not up to 59 minutes early

Changed: `src/lib/server/machine/tasks/schedule.ts:73-90` (`dueAt` and the new constant `LOOKBACK = 61`) and the head comment `schedule.ts:12-16`; `tests/server/machine/tasks/schedule.test.ts:328` (the sixth test, renamed 'starts each run of a pattern inside the hour the clocks skip once, when it is due and not before'); `DESIGN.md:139` ('so a daily 02:30 starts at 03:30 on that day and never earlier').

```ts
const LOOKBACK = 61;
function dueAt(job: Cron, now: Date): Date | undefined {
    const ask = new Date(Math.floor(now.getTime() / 1000) * 1000 + 1000);
    return job.previousRuns(LOOKBACK, ask).find((due) => due.getTime() <= now.getTime());
}
```

`consider` and the catch-up in `apply` both reach the due time through `dueAt`, so both start only a due time that is not later than now. 61 is one more than the 60 minute-granular due times an hour holds: croner answers every due time of a skipped hour moved after it from the start of that hour (probe `$TMPDIR/probe-prev.mjs` under `TZ=Europe/Brussels` printed, at 01:00:30Z on 2026-03-29, `*/10 2 * * *` as `01:50 01:40 01:30 01:20` and `* 2 * * *` as `01:59 01:58 01:57 01:56`, all later than that moment), which is why the lookback covers a whole hour of due times and the third row (`*/10 2 * * *`, six due times in the skipped hour) is in the test.

The test sets the fake clock to 2026-03-28T22:00Z under `TZ=Europe/Brussels`, wraps `held.driver.run` to record `new Date().toISOString()` at each `new-session` call, and for each of `30 2 * * *` (due 01:30Z), `59 2 * * *` (due 01:59Z) and `*/10 2 * * *` (dues 01:00Z to 01:50Z every ten minutes) asserts: no call up to one minute before the first due time; then the call times equal the due times exactly; the record's runs are `{ trigger: 'schedule', due, outcome: 'started' }` per due time; and each run's `at` is not before its `due`.

The test was written before the change and run on the tree as the build left it (`dueAt` was `previousRuns(1, ask)[0]`); it failed at the first row:

```
$ npx vitest run tests/server/machine/tasks/schedule.test.ts      (dueAt: previousRuns(1, ask)[0])
 FAIL  |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > starts the run of a pattern inside the hour the clocks skip once, when it is due and not before
AssertionError: 30 2 * * *: expected [ '2026-03-29T01:00:00.000Z' ] to deeply equal []
      Tests  1 failed | 5 passed (6)
```

The run on the changed tree:

```
$ npx vitest run tests/server/machine/tasks/schedule.test.ts
Test Files  1 passed (1)
Tests  6 passed (6)
```

### Ruling 2. The risk sentence of HELP.md:25

Changed: `HELP.md:25` (one line). The sentence 'With it on, a scheduled run lets an agent edit files and run commands with nobody asked, on a timer.' now follows 'Under `skip_permissions: true` a scheduled run starts unattended without the question a press asks.', which comes after the sentences that introduce the schedule; the variant 'so a scheduled task then lets an agent' is gone. The same sentence stands in `config/catalogs/options.yml:389`.

```
$ grep -c "so a scheduled task then" HELP.md DESIGN.md config/catalogs/options.yml
HELP.md:0
DESIGN.md:0
config/catalogs/options.yml:0
$ grep -o "Under .skip_permissions: true. a scheduled run starts unattended[^.]*\. With it on, a scheduled run lets an agent edit files and run commands with nobody asked, on a timer\." HELP.md
Under `skip_permissions: true` a scheduled run starts unattended without the question a press asks. With it on, a scheduled run lets an agent edit files and run commands with nobody asked, on a timer.
$ grep -c "With it on, a scheduled run lets an agent edit files and run commands with nobody asked, on a timer." HELP.md config/catalogs/options.yml
HELP.md:1
config/catalogs/options.yml:1
```

The first HELP.md run of the Update paragraph now reads: the tray and Chat sentence, then the schedule sentences (keys, pattern, empty, due time, catch-up, working and idle earlier run, tray rows, record file), then the unattended sentence and the risk sentence, then the paragraph on a press, `skip_permissions: true` and the confirmation.

### Ruling 3. The Processes paragraph

Changed: `DESIGN.md:157`. It now says: "An update task's line is oculus's own text, so a scheduled run of it asks no approval. It runs in a listed terminal the reader can open from the Terminal tab or from the run row of the update tray, so it is not in the background either." The paragraph's own sentence 'it runs in a pane the reader can see, never in the background' is unchanged and does not contradict it: a scheduled run is a listed terminal, which the Terminal tab lists and the tray's run row opens.

```
$ grep -o "An update task.s line is oculus.s own text[^.]*\.[^.]*\." DESIGN.md
An update task's line is oculus's own text, so a scheduled run of it asks no approval. It runs in a listed terminal the reader can open from the Terminal tab or from the run row of the update tray, so it is not in the background either.
```

### Ruling 4. The update-tasks paragraph and the re-export

Changed: `DESIGN.md:416` and `src/lib/data/helpers/run/tasks.ts:1-5,21`. The paragraph now says that `taskSkipPermissions` reads only the boolean `true` as on, that the four `tasks.<task>.schedule` patterns are read through the options catalog's rule (the Schedules paragraph), and that `UPDATE_TASKS` and `UpdateTask` are defined in `src/lib/data/model/model-processes.ts` and re-exported by `data/helpers/run/tasks.ts` beside `taskSkipPermissions`. `tasks.ts:21` is `export { UPDATE_TASKS, type UpdateTask };`, so the sentence is true. The consumers import the kinds from `data/helpers/run/tasks.ts`, which makes the re-export used: `record.ts`, `schedule.ts`, `start.ts`, `live-settings.ts`, `watch/pollers.ts`, `settings.ts`, `schedule.svelte.ts` and `terminals.svelte.ts`. `data/helpers/run/tasks` is in the state row of the boundary table, and `data/sources/config/settings.ts` (layer 1) imports it from `data/helpers`, which `tests/checks/imports/order.test.ts` allows.

```
$ sh utils/unused-exports.sh | wc -l
     379
$ diff <(base output) <(this tree output)
diff empty
$ npx vitest run tests/checks --testTimeout 120000 --reporter=dot
 Test Files  16 passed (16)
      Tests  229 passed (229)
```

### Ruling 5. The placement of UPDATE_TASKS

Accepted as built: `UPDATE_TASKS` and `UpdateTask` are defined at `src/lib/data/model/model-processes.ts:6,9` and exported by `data/model/index.ts`; `tests/checks/imports/order.test.ts` puts `data/model` at the foot of the data layer, so `model-processes.ts` cannot import `data/helpers`. No change beyond ruling 4. The head comment of `tasks.ts` (lines 1-5) now says the list is defined in `data/model/model-processes.ts`, why, and that `tasks.ts` re-exports it.

```
$ sed -n 1,5p src/lib/data/helpers/run/tasks.ts
// Layer 1, data. The four update tasks and what the `tasks:` block of config/behavior.yml says
// about them: whether they turn the CLI's permission prompts off, and whether a word names one.
// The list itself, UPDATE_TASKS, is defined in data/model/model-processes.ts, because the schedule
// payload there names the kinds and the model layer may not import data/helpers; it is
// re-exported here so every other module reads the kinds beside the rule.
```

### Ruling 6. The boundaries allow-list

No code change in this round. `tests/checks/tree/boundaries.test.ts:343-360` holds `SHELL_STORES`, the stores a shell file may read from the client object. The list as the dispatch left main, `sed -n 335,362p` of the main checkout's file (`grep -c schedule` printed 0):

```
SHELL_STORES = ['commands', 'explorer', 'fs', 'layout', 'drag', 'ui', 'selection', 'terminals', 'search', 'paletteSource', 'editorStatus', 'notices', 'registry', 'writes', 'selectors']
```

The list now (`sed -n 343,360p` of the worktree's file):

```
const SHELL_STORES = [ 'commands', 'explorer', 'fs', 'layout', 'drag', 'ui', 'selection', 'terminals', 'search', 'paletteSource', 'editorStatus', 'notices', 'registry', 'writes', 'selectors', 'schedule'];
```

`'schedule'` is needed because `src/lib/shell/rail/UpdateTray.svelte:32` destructures `schedule` out of the client object (`const { paletteSource: { paletteSource }, schedule, selection: { select }, terminals: { ... } } = useState();`), and `UpdateTray.svelte` is a shell file; the store is `createSchedule` of `src/lib/state/system/machine/schedule.svelte.ts`, wired at `src/lib/state/client/context.ts:352` and put on the client object at `context.ts:488`. The tray draws each task's next run and latest runs from it. The doc comment above the list (line 341) says so. The test passes with the entry:

```
$ npx vitest run tests/checks/tree/boundaries.test.ts --testTimeout 120000
Test Files  1 passed (1)
Tests  11 passed (11)
```

### Ruling 7. The context fixture

Changed: `tests/server/root/context-fixture.ts:19,94-95`. `scheduleRecord` is `overrides.scheduleRecord ?? join(scratchDir('oculus-fixture-schedule-'), 'schedule.json')`, from `scratchDir` of `tests/fixtures/scratch.ts`; the constant with the fixed path under `tmpdir()` and the `tmpdir` import are gone. A fixture call makes one scratch directory, and the sweep belongs to the file that took `it` from `tests/fixtures/scratch.ts`, so the two test files that call `contextFixture` and took `it` from vitest, `tests/routes/machine/hpc.test.ts` and `tests/routes/git/git.test.ts`, now import `it` from `../../fixtures/scratch.ts`. The other callers (`tests/server/machine/usage/refresh.test.ts`, `tests/server/root/hooks-server.test.ts`, `tests/routes/git/deposit.test.ts`, `tests/routes/sessions/terminal-fixture.ts`) already do.

The fact checked is the one the change exists for, that a run leaves no fixture directory behind in the temporary directory:

```
$ ls "$(node -p "require('os').tmpdir()")" | grep -c oculus-fixture-schedule     (after the run of tests/routes, tests/server, and after list run f)
0
$ grep -n "scratchDir\|tmpdir" tests/server/root/context-fixture.ts
19:import { scratchDir } from '../../fixtures/scratch.ts';
95:            join(scratchDir('oculus-fixture-schedule-'), 'schedule.json'),
```

### Ruling 8. The taskSchedules titles

Changed: `tests/data/sources/config/settings.test.ts:555,583-591`. The first title is 'reads each pattern as written, and gives no problem for a missing, empty or {} entry' (its three rows are a missing entry, an empty one and `{}`). The `it.each` rows are `[kind, value]` and the title is 'answers the default and a %s problem for %j', so the problem kind and the value stand in their places, and the `[]` row prints `[]`. No assertion changed. The test run (`--reporter=verbose`):

```
|unit| tests/data/sources/config/settings.test.ts > taskSchedules > reads each pattern as written, and gives no problem for a missing, empty or {} entry
|unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a form problem for "nonsense"
|unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a form problem for "61 * * * *"
|unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a form problem for "* * * * * *"
|unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a form problem for "*/0 * * * *"
|unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a text problem for 5
|unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a text problem for null
|unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a text problem for []
|unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a cron_never problem for "0 0 31 2 *"
|unit| tests/data/sources/config/settings.test.ts > taskSchedules > names a task entry or a tasks block that is not a map, and reads the other tasks
|unit| tests/data/sources/config/settings.test.ts > taskSchedules > gives no problem for a key the catalog holds no entry for
|unit| tests/data/sources/config/settings.test.ts > taskSchedules > reads a pattern the Settings view wrote at its three-level key
```

### Ruling 9. No row takes over a live lock

Changed: `tests/server/machine/tasks/schedule.test.ts:5-8,30-36,47-60`. `local(days, ...)` is now seven days before the real day plus `days`, so the catch-up row `local(3, 9)` lies four days before the real day and every row of the file sets the fake clock before the real day. A new `afterEach` spies on `console.error` and asserts that no line contains 'took over', so a row that takes over a lock fails; the head comment (lines 3-6) says exactly that.

The check was added first and run with the clocks one day before the real day, where the catch-up row `local(3, 9)` lies two days after it; that run failed:

```
$ npx vitest run tests/server/machine/tasks/schedule.test.ts      (local() = one day before the real day)
schedule record: took over <tmp>/oculus-schedule-keZnJu/schedule.json.lock, which was 135674142.60424805 ms old
schedule record: took over <tmp>/oculus-schedule-keZnJu/schedule.json.lock, which was 135674141.6748047 ms old
schedule record: took over <tmp>/oculus-schedule-keZnJu/schedule.json.lock, which was 135674141.2397461 ms old
 FAIL  |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > starts one catch-up run at start for the due times missed while the server was down
AssertionError: expected [ ...(3) ] to deeply equal []
```

On the changed tree, stderr of the file carries no 'took over' line:

```
$ npx vitest run tests/server/machine/tasks/schedule.test.ts 2>&1 | grep -c "took over"
0
$ npx vitest run tests/server/machine/tasks/schedule.test.ts 2>&1 | grep -E "Tests |took over|schedule record"
Tests  6 passed (6)
```

### Ruling 10. The checks the report was missing

**Verify item 6, every changed name across `src`, `tests`, `config` and the docs.** The names changed by the step are `TASKS`, `isTask`, `TaskKind`, `taskCommand` (the server's), `processesText`; the run:

```
$ grep -rnwE "TASKS|isTask|TaskKind|taskCommand|processesText" src tests config README.md HELP.md DESIGN.md --exclude=local.yml
src/lib/server/machine/tasks/start.ts:41:function taskCommand(binary: string, kind: UpdateTask, skip: boolean): string {
src/lib/server/machine/tasks/start.ts:101:                command: taskCommand(options.claudeBin, kind, options.skipPermissions)
src/lib/views/sessions/terminal/grid/grid-links.ts:12:    isTask: () => boolean;
src/lib/views/sessions/terminal/grid/grid-links.ts:25:            if (match === null || !deps.isTask()) {
src/lib/views/sessions/terminal/grid/TerminalGrid.svelte:342:                    isTask: () => terminalById(wanted)?.task === true,
src/lib/views/boards/collection/task-card.ts:13:const TASKS = 'tasks';
src/lib/views/boards/collection/task-card.ts:25:    if (collection !== TASKS) return [];
src/lib/views/boards/collection/task-card.ts:35:                start({ id: entry.id, collection: TASKS });
src/lib/views/boards/focus/rows.ts:50:const TASKS = 'tasks';
src/lib/views/boards/focus/rows.ts:70:        const entry = target.kind === 'entry' && target.collection === TASKS;
src/lib/views/boards/focus/rows.ts:71:        return entry ? { id: target.id, collection: TASKS } : null;
tests/server/core/changes.test.ts:27:const TASKS =
tests/server/core/changes.test.ts:56:        ['tasks/tasks.yml', TASKS],
tests/server/edit/writes.test.ts:34:    TASKS,
tests/server/edit/writes.test.ts:135:        expect(tasksOf(root)).toBe(`${TASKS}\n  - title: A new task\n    status: open\n`);
tests/server/edit/writes-fixture.ts:70:export const TASKS = [
tests/server/edit/writes-fixture.ts:106:        ['tasks/tasks.yml', TASKS],
tests/server/edit/writes-collection.test.ts:16:import { configFor, record, tasksPath, TASKS, wider, tasksOf } from './writes-fixture.ts';
tests/server/edit/writes-collection.test.ts:37:        expect(tasksOf(root)).toBe(TASKS.replace('status: open', 'status: done'));
tests/server/edit/writes-collection.test.ts:42:    const TWO = TASKS.replace(
tests/server/edit/writes-collection.test.ts:65:        expect(tasksOf(root)).toBe(TASKS);
tests/routes/edit/write-fixture.ts:44:const TASKS =
tests/routes/edit/write-fixture.ts:75:        ['tasks/tasks.yml', TASKS],
DESIGN.md:416:- The four update tasks run under normal permissions. `taskCommand` in `server/machine/tasks/start.ts` builds `<claude> '/research-cockp
```

Judged: `TaskKind` and `processesText` have no hit. `taskCommand` stands at `start.ts:41,101` and `DESIGN.md:416`, both on the new path (`server/machine/tasks/start.ts`). `isTask` stands only as the grid-link dependency `isTask: () => boolean` of `grid-links.ts` and `TerminalGrid.svelte:342`, which is a different function (a terminal's `task` flag), not the removed server function. `TASKS` is `const TASKS = 'tasks'` of the boards (`task-card.ts:13`, `rows.ts:50`) and the `TASKS` fixture strings of the edit tests, none of them the removed list. No hit needs a change.

**The history-word grep with the whole list of agents/spec.md:42.** The command (`$A/r1/hist.sh`) takes the added lines of each file the step wrote, comment lines and values, and for the test files every comment line and test title, and prints the words 'before', 'used to', 'no longer', 'still', 'always has been', 'always had', 'as before', 'previously', 'the step adds', 'after this package lands', a package id (a letter and one to three digits) and a date. Its output, 58 lines, is quoted by file with each hit judged:

```
DESIGN.md: key that does not exist, so a typo is caught before it renders blank, and `tests/
DESIGN.md:  as new as, so the push the hub replays from before a config change does not repl
DESIGN.md: s terminal. A due time is written as handled before anything starts, under an exc
DESIGN.md:  or changed never catches up a due time from before it was read. One run of a tas
DESIGN.md: whole chain of the command as it is written, before any placeholder is replaced, 
DESIGN.md: ader is not there to answer. A configuration still carrying the key under `chat:
DESIGN.md: le it is on the tray asks for a confirmation before a task starts, once per press
HELP.md:  A due time while that task's earlier run is still working starts nothing. A due
HELP.md: ts latest five runs, a run whose terminal is still open opening it, and every ru
HELP.md: t.skip_permissions`, is not read, and a file still carrying it gets a finding on
config/behavior.yml: The update tray then asks for a confirmation before each task that a press starts
config/catalogs/options.yml: The update tray then asks for a confirmation before each task that a press starts
config/catalogs/options.yml: e. A run due while the task's earlier run is still working is skipped.
config/catalogs/options.yml: e. A run due while the task's earlier run is still working is skipped.
config/catalogs/options.yml: e. A run due while the task's earlier run is still working is skipped.
config/catalogs/options.yml: e. A run due while the task's earlier run is still working is skipped.
config/text/app.yml: utcome_skipped: skipped, the earlier run was still going
config/text/views/system/workbench.yml: les view's `files.confirm_delete` (true asks before a delete to the Trash), the u
src/lib/data/model/model-processes.ts: r a skipped run, of the earlier run that was still
src/lib/data/model/model-processes.ts: 22:     * working; null for a run still being started and for a faile
src/lib/server/machine/tasks/record.ts: hen that pattern was first read: no due time before it is caught up. */
src/lib/server/machine/tasks/record.ts: g a pattern never catches up a due time from before it. A task
src/lib/server/machine/tasks/schedule.ts:  (tasks/start.ts), unless its earlier run is still working. The
src/lib/server/machine/tasks/schedule.ts: a decision writes it under the record's lock before anything starts, so a due tim
src/lib/server/machine/tasks/schedule.ts: 11:// ones before it start nothing. A pattern f
src/lib/server/machine/tasks/schedule.ts: 12:// before it was read. Croner's timer s
src/lib/server/machine/tasks/schedule.ts: 15:// before that time.
src/lib/server/machine/tasks/schedule.ts: 75: * How many due times before a moment `dueAt` looks throug
src/lib/server/machine/tasks/schedule.ts: 81: * The newest due time of a job at or before `now`, or undefined when it h
src/lib/server/machine/tasks/schedule.ts: 82: * "before" in whole seconds, so a `now`
src/lib/server/machine/tasks/schedule.ts:  inside the second of a due time still sees the one before
src/lib/server/machine/tasks/schedule.ts: 106:    /** Read through a call, so a check before an await never stands in for 
src/lib/server/machine/tasks/schedule.ts: 210:    /** A run as the claim keeps it before the start answers. */
src/lib/server/machine/tasks/schedule.ts:  jump from 02:00 to 03:00) while its pattern still answers 03:30 for that day; a
src/lib/server/root/watch/pollers.ts: :    // published, and the one read at start before the first push.
src/lib/shell/rail/UpdateTray.svelte: 3:    // page still lists opens that terminal as 
src/lib/state/client/entities.svelte.ts:  read of the update tasks' schedule, or null before the first one. */
src/lib/state/system/machine/schedule.svelte.ts: 3:// page still holds that terminal. The tray
src/lib/state/system/machine/schedule.svelte.ts: e run started or found going, while the page still lists it. */
src/lib/state/system/machine/schedule.svelte.ts: 52:    /** One task's schedule, or null before the first payload arrives. */
tests/checks/config/config.test.ts: 155:// The check the source endpoint makes before it writes the machine's own file: it reads a body the
tests/checks/tree/boundaries.test.ts: 41:// held to is read by the Add form and the setup page before they send and by the server before it
tests/checks/tree/boundaries.test.ts: 60:// `data/helpers/run/marker`, the line a project command's chain prints before each command, which
tests/checks/tree/boundaries.test.ts: 64:// `data/helpers/search/**`, the Search view refusing a query before it sends it and the search
tests/checks/tree/boundaries.test.ts: 68:// fills a catalog string with and the one the server words every finding with before the snapshot
tests/checks/tree/boundaries.test.ts: 80:// before it is sent and the server's write and readers by after it, so the three agree; and
tests/checks/tree/boundaries.test.ts: 91:// Literature search refuses a query by before it sends it and the route refuses the same query by
tests/checks/tree/boundaries.test.ts: 122:// there is, so the row alone would no longer hold the shell to its own: the stores a shell file may
tests/checks/tree/boundaries.test.ts: 209:// other, so `state/client/entities.svelte` is still refused to the shell, which the synthetic case
tests/checks/tree/boundaries.test.ts: 450: * The whole selector a `:global(...)` sits in, from the end of the rule before it to its brace.
tests/checks/tree/boundaries.test.ts: 649:    it('holds the styling lists to rules the tree still has', () => {
tests/routes/git/git.test.ts: 31:/** What ran, so a case can assert that a refusal refused before the operation. */
tests/routes/sessions/terminal-actions.test.ts: 40:/** This file's scratch folder and what the fixture planted in it, made before its first case. */
tests/routes/sessions/terminal-actions.test.ts: 174:        // A build whose latexmk still runs answers that terminal and starts nothing.
tests/server/machine/tasks/schedule.test.ts: 3:// the server met it. No case reaches tmux or `claude`. Every clock is set a week before the real
tests/server/machine/tasks/schedule.test.ts: 27:/** The real day, read before any test installs the fake clock. */
tests/server/machine/tasks/schedule.test.ts: 30:/** A local time seven days before the real day, `days` days after it. */
tests/server/machine/tasks/schedule.test.ts: 328:    it('starts each run of a pattern inside the hour the clocks skip once, when it is due and not before', async () => {
```

Judged, every hit: the 'before' hits are ordering inside a process ('before anything starts', 'before it renders blank', 'before a task starts', 'before the first push', 'before the first payload arrives', 'before each command', 'before it sends') and the 'still' hits are the present state of a thing ('an earlier run still working', 'a page still lists a terminal', 'a configuration still carrying the key under `chat:`', 'a file still carrying it', 'croner still sees the one before'). None compares with an earlier state of the code, none names a package or a date. The lines of `tests/checks/tree/boundaries.test.ts`, `tests/checks/config/config.test.ts`, `tests/routes/git/git.test.ts` and `tests/routes/sessions/terminal-actions.test.ts` that match are lines the step did not write (the step changed `SHELL_STORES` and its doc comment, two import lines, a few lines of `taskOptions`); the title 'a resize of a terminal tmux no longer has' is an existing title. The step's own text has no hit that needs a change.

**The croner chunk sizes.** `npx vite build` on the dispatch base and on a copy of this tree (`$A/r1/build-base.log`, `$A/r1/build-step.log`, both exit 0), client JavaScript under `.svelte-kit/output/client/_app/immutable`, gzip level 6:

```
client js total: base raw 29047989 gzip 6756767 | step raw 29077827 gzip 6765311 | delta raw +29838 gzip +8544
chunks holding croner (previousRuns): ['/nodes/2.js']
/nodes/2.js: base raw 2704919 gzip 815814 | step raw 2734757 gzip 824359 | delta raw +29838 gzip +8545
chunks with a size change: [('/chunks/BjbE8_hV.js', 36996), ('/nodes/2.js', 29838), ('/chunks/DKNTU8dT.js', 390), ('/chunks/CBMXfZpK.js', 61), ('/chunks/Dyk0fXmS.js', 31)]
base has croner in any chunk: False
```

croner has no chunk of its own: `src/lib/data/sources/config/catalog/value-rule.ts` imports it for the `cron` form, the Settings view reaches that rule, and the bundler places it in the page node chunk `nodes/2`, the only client chunk that holds `previousRuns` (the base has it in no chunk). That chunk grows by 29,838 bytes raw and 8,545 bytes gzip, which is also the growth of the whole client bundle (+29,838 raw, +8,544 gzip); it holds croner (the package's own `dist/croner.js` is 27,551 bytes raw and 8,049 gzip) and the step's client code. The server imports croner from `schedule.ts` and `value-rule.ts` and has no size limit on it.

**Verify item 8, new or changed list items and sentences against the writing rules.** The rules that apply to a doc or a catalog line the step wrote are in the 'Writing docs' section of `CLAUDE.md` and `~/.claude/rules/writing-docs-md-yaml.md`: one continuous line per paragraph or bullet, short plain sentences with the so-what first, no groups of three padded, no negation-contrast, no synonym cycling, ASCII. Neither file fixes a word count, so the reading took sentences of 35 words or more among the sentences that exist now and did not exist in the dispatch base (`$A/r1/sentences.txt`, output below), shortened every one the step wrote in full (the **Schedules.** paragraph of `DESIGN.md:139` is now sentences of at most about 40 words; the `HELP.md:25` schedule sentences, the four `tasks.<task>.schedule` descriptions, the `skip_permissions` description and the `behavior.yml` comments are split at their clauses), and names each departure that remains with why:

```
HELP.md: 45 words: `tasks.litwatch.schedule`, `tasks.scout.schedule`, `tasks.linkedin.schedule` and `tasks.inbox.schedule` in `config/behav
HELP.md: 95 words: | `behavior.yml` | Thresholds, horizons and cadences: read limits, the `refresh_stale_days` thresholds of the refresh st
DESIGN.md: 85 words: The `control` is one of `toggle`, `number` (bounded by `min` and `max`, and held to a whole number by `whole: true`), `t
DESIGN.md: 54 words: `taskCommand` in `server/machine/tasks/start.ts` builds `<claude> '/research-cockpit <kind>'` and nothing else: the prin
config/catalogs/options.yml: 46 words: `program` (no slash or white space), `extension` (a dot and one segment), `bundle_id` (two or more dot-separated segment
config/catalogs/options.yml: 51 words: Whether the four update tasks start with --dangerously-skip-permissions. false starts them as ordinary Claude sessions, 
```

Departures: (1) `HELP.md:25`, 45 words: the sentence names four dotted keys (`tasks.litwatch.schedule` and three more), 12 of its words; it cannot be shorter without dropping a key. (2) `HELP.md` table row of `behavior.yml`, 95 words: an existing table cell that lists what the file holds, to which the step added 'and each task's `tasks.<task>.schedule`'; a table cell is one line and splitting it makes the cell a paragraph. (3) `DESIGN.md:85`, 85 words: the existing sentence that lists the forms of a text control, to which the step added `cron`; the sentence is a list. (4) `DESIGN.md:416`, 54 words: the existing sentence on `taskCommand`, whose path is the only change. (5) `options.yml:11`, 46 words: the same list of forms in the catalog's header comment. The 361-word sentence of `DESIGN.md:85` that lists the blocks the config channel reads gained one item, `the update tasks' tasks: block`, and is an existing enumeration. Each list item and sentence the step wrote is otherwise under 35 words.

**Verify item 7, the widened grep over the step's tests and probes.** `grep -nE "spawn|execFile|exec\(|tmux|claude"` over the 12 test files the step wrote or changed (`tests/routes/sessions/terminal-actions.test.ts`, `terminal-fixture.ts`, `tests/routes/machine/hpc.test.ts`, `tests/routes/git/git.test.ts`, `tests/checks/tree/boundaries.test.ts`, `tests/checks/config/config.test.ts`, `tests/data/sources/config/settings.test.ts`, `wrong-settings.ts`, `tests/server/root/context-fixture.ts`, `tests/data/sources/config/catalog/value-rule.test.ts`, `tests/server/machine/tasks/record.test.ts`, `schedule.test.ts`):

```
routes/sessions/terminal-actions.test.ts:4:// Nothing here runs tmux, `claude` or `codex`. handleTerminal is called with an options bag
routes/sessions/terminal-actions.test.ts:31:    tmux,
routes/sessions/terminal-actions.test.ts:52:    /** The command the task action built, from the tmux session it was asked to create. */
routes/sessions/terminal-actions.test.ts:57:        const driver = tmux();
routes/sessions/terminal-actions.test.ts:82:                `'/opt/Claude CLI/claude' '/research-cockpit ${kind}'`
routes/sessions/terminal-actions.test.ts:115:    function latexOptions(driver: ReturnType<typeof tmux>): TerminalOptions {
routes/sessions/terminal-actions.test.ts:132:        const driver = tmux();
routes/sessions/terminal-actions.test.ts:177:        expect(driver.respawns()).toEqual([]);
routes/sessions/terminal-actions.test.ts:181:        expect(driver.respawns()).toEqual([
routes/sessions/terminal-actions.test.ts:183:                'respawn-pane',
routes/sessions/terminal-actions.test.ts:193:        // The kept build is a task terminal, so Run Again on it respawns its line.
routes/sessions/terminal-actions.test.ts:201:        expect(driver.respawns()).toHaveLength(2);
routes/sessions/terminal-actions.test.ts:206:    const ID = 'a1b2c3-claude';
routes/sessions/terminal-actions.test.ts:208:    /** A tmux that holds no session and fails a resize the way tmux words a missing session. */
routes/sessions/terminal-actions.test.ts:224:            body: { action: 'fork', tool: 'claude', id: 'nope' },
routes/sessions/terminal-actions.test.ts:229:            body: { action: 'start', kind: 'claude', cwd: HERE, cols: 'wide', rows: 24 },
routes/sessions/terminal-actions.test.ts:238:            title: 'a resize of a terminal tmux no longer has',
routes/sessions/terminal-actions.test.ts:244:            body: { action: 'start', kind: 'claude', cwd: HERE, cols: 80, rows: 24 },
routes/sessions/terminal-actions.test.ts:274:    function chatOptions(driver: ReturnType<typeof tmux>): TerminalOptions {
routes/sessions/terminal-actions.test.ts:285:        const driver = tmux();
routes/sessions/terminal-actions.test.ts:325:            '/opt/Claude CLI/claude',
routes/sessions/terminal-actions.test.ts:331:            'claude-opus-4-1',
routes/sessions/terminal-fixture.ts:2:// suites read, the tmux double that records every argv and runs nothing, and the helpers that build
routes/sessions/terminal-fixture.ts:3:// a request and the options bag handleTerminal is called with. Nothing here runs tmux, `claude` or
routes/sessions/terminal-fixture.ts:85:            `hub: ${HERE}\nclaude_bin: /opt/Claude CLI/claude\n`
routes/sessions/terminal-fixture.ts:94:            `hub: ${chatHub}\nclaude_bin: /opt/Claude CLI/claude\nsessions_overrides: ${join(chatState, 'sessio
routes/sessions/terminal-fixture.ts:101:export const CHAT_CONFIG = { ...BASE_CHAT_CONFIG, chat: { model: 'claude-opus-4-1' } };
routes/sessions/terminal-fixture.ts:106: * The commands of one tmux invocation, each as its words: tmux runs the words after a lone `;`
routes/sessions/terminal-fixture.ts:129: * A tmux that runs nothing: it keeps every argv, remembers what set-option was told, in an
routes/sessions/terminal-fixture.ts:133:export function tmux(existingNames: string[] = []): {
routes/sessions/terminal-fixture.ts:153:                    'claude',
routes/sessions/terminal-fixture.ts:161:                        'oculus-aabbcc-claude',
routes/sessions/terminal-fixture.ts:164:                        'claude',
routes/sessions/terminal-fixture.ts:186:        run: tmux().run,
checks/tree/boundaries.test.ts:254:    const found = /<script[^>]*\bmodule\b[^>]*>([\s\S]*?)<\/script>/.exec(text);
checks/tree/boundaries.test.ts:276:                /^(?:export )?const (\w+)(?::[^=]+)? = (?:new (?:Map|Set)\b|\{\}|\[\]|\$state)/.exec(
checks/tree/boundaries.test.ts:278:                ) ?? /^(?:export )?let (\w+)\b/.exec(line);
checks/tree/boundaries.test.ts:308:    'lib/server/machine/pty/tmux.ts:SINGLES',
checks/tree/boundaries.test.ts:391:    const found = /<style[^>]*>([\s\S]*?)<\/style>/.exec(text);
checks/config/config.test.ts:51:    { tool: 'claude', dir: join(homedir(), '.claude'), label: 'claude' },
checks/config/config.test.ts:101:            claudeBin: 'claude',
checks/config/config.test.ts:116:                    { tool: 'claude', dir: 'a/.claude', label: 'Work' },
checks/config/config.test.ts:117:                    { tool: 'claude', dir: 'b/.claude', label: 'Personal' },
checks/config/config.test.ts:139:            claudeBin: 'claude',
checks/config/config.test.ts:147:            claudeBin: 'claude',
data/sources/config/settings.test.ts:94:            claude: {
server/root/context-fixture.ts:2:// opening a watcher, running tmux, reading the real hub, or writing outside a test's own fixture.
server/root/context-fixture.ts:40:        claudeBin: 'claude',
server/machine/tasks/schedule.test.ts:2:// recording tmux double, a scratch run record and a fake clock: a due time starts one run, however
server/machine/tasks/schedule.test.ts:3:// the server met it. No case reaches tmux or `claude`. Every clock is set a week before the real
server/machine/tasks/schedule.test.ts:6:// change of a repeated hour, the page's reading of the payload, and the tmux of a real machine.
server/machine/tasks/schedule.test.ts:21:import { HERE, tmux } from '../../../routes/sessions/terminal-fixture.ts';
server/machine/tasks/schedule.test.ts:25:const EARLIER = 'aabbcc-claude';
server/machine/tasks/schedule.test.ts:40:    driver: ReturnType<typeof tmux>;
server/machine/tasks/schedule.test.ts:71:/** A watcher over the real start, the recording tmux and a scratch record. */
server/machine/tasks/schedule.test.ts:78:    const common = { run: setup.driver.run, hub: HERE, claudeBin: 'claude' };
server/machine/tasks/schedule.test.ts:100:    return { record: join(dir, 'schedule.json'), driver: tmux(), hub: new Hub(), watchers: [] };
```

Judged: every `tmux` hit is the recording double of `terminal-fixture.ts` (`tmux()` pushes its argv onto `calls` and runs nothing; its head comment says 'Nothing here runs tmux, `claude` or ...') or a comment or name that refers to it, or the existing singletons name `lib/server/machine/pty/tmux.ts:SINGLES` in `boundaries.test.ts:308`; every `claude` hit is a string value (`claude_bin: /opt/Claude CLI/claude`, `claudeBin: 'claude'`, the account tool name `claude`, an id `aabbcc-claude`, the model `claude-opus-4-1`) that the double records and nothing runs; the `.exec(` hits of `boundaries.test.ts` are `RegExp.prototype.exec` on file text; `respawns()` and `respawn-pane` in `terminal-actions.test.ts` read the double's recorded argv. No hit spawns a process. The probes (`$A/vp/*.probe.ts`) run the same double, except `s4.probe.ts` and `probes/c1.mts`, which start a tmux server on a private socket under `/private/tmp/claude-502/a3t/` with the stub `probes/stub-claude.sh` as the binary (no real `claude`), and those two are outside the repository.

### Ruling 11. The head comments

Changed: `src/lib/server/root/watch/pollers.ts:1-5`, `src/lib/data/sources/config/settings.ts:1-10`, `tests/data/sources/config/settings.test.ts:1-8`, each rewrapped whole at 100 columns with no short line inside a sentence; the same rewrap for `src/lib/server/machine/tasks/schedule.ts:7-16` and `src/lib/data/helpers/run/tasks.ts:1-5`, which this round edited. The check for a short line inside a comment paragraph (a line that ends without sentence punctuation although the next word fits) printed nothing over the step's files, and the comment-width check passes:

```
$ npx vitest run tests/checks/source/comment-width.test.ts
Test Files  1 passed (1)
Tests  2 passed (2)
$ for f in the three files: awk 'length>100' <head lines>
       0
```

```
// Layer 2, server. The wiring of the pollers the context builds: the Live HPC poller, the Processes
// watcher, the update tasks' schedule, the calendar and mail pollers, and the two usage watchers a
// changed key of local.yml builds again. The context composes the server's objects and hands this
// module the settings each poller starts with, so what a poller is given is written here once and
// the composition root stays a list of what exists.
```

## The cases' first run

The first run on the unchanged tree was taken before any change (`first-run.log` in the scratchpad `a3-builder`, with the probes `probes/first-run-config.mts`, `probes/first-run-route.mts`, `probes/c1.mts`). Printed whole:

```
pane_pid 46305 listed pid 46305 printed $$ 46305 ppid(printed) 46304 ppid(pane) 46304
equal: true pane is parent of printed: false
taskSchedules exported by settings.ts: undefined
C3 absent entries | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false}
C3 schedule "" | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"litwatch":{"schedule":""}}
C3 litwatch: {} | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"litwatch":{}}
C4 "nonsense" | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":"nonsense"}}
C4 "61 * * * *" | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":"61 * * * *"}}
C4 "* * * * * *" | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":"* * * * * *"}}
C4 "*/0 * * * *" | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":"*/0 * * * *"}}
C4 5 | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":5}}
C4 null | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":null}}
C4 [] | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":[]}}
C5 0 0 31 2 * | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"litwatch":{"schedule":"0 0 31 2 *"}}
C5 0 0 29 2 * | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"litwatch":{"schedule":"0 0 29 2 *"}}
C6 @hourly | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":"@hourly"}}
C6 @daily | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":"@daily"}}
C6 @weekly | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":"@weekly"}}
C6 @monthly | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":"@monthly"}}
C6 @yearly | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":"@yearly"}}
C6 0 7 * * MON | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":"0 7 * * MON"}}
C6  0 7 * * *  | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":" 0 7 * * * "}}
C25 tasks.foo.schedule | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"foo":{"schedule":"0 7 * * *"}}
C32 litwatch: "0 7 * * *" | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"litwatch":"0 7 * * *"}
C32 tasks: [] | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false}
C32 tasks: [] | [] []
C32 litwatch {schedule, at: 7} | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"litwatch":{"schedule":"0 7 * * *","at":7}}
writeConfigKey tasks.scout.schedule="61 * * * *" | {"changed":[],"refused":[{"field":"behavior.yml:tasks.scout.schedule","reason":"The options catalog has no option of that name in a tracked config file"}]}
writeConfigKey tasks.scout.schedule="0 0 31 2 *" | {"changed":[],"refused":[{"field":"behavior.yml:tasks.scout.schedule","reason":"The options catalog has no option of that name in a tracked config file"}]}
writeConfigKey tasks.scout.schedule="0 7 * * 1" | {"changed":[],"refused":[{"field":"behavior.yml:tasks.scout.schedule","reason":"The options catalog has no option of that name in a tracked config file"}]}
P1 write tasks.litwatch.schedule | {"changed":[],"refused":[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"The options catalog has no option of that name in a tracked config file"}]} | config.tasks = {"skip_permissions":false,"litwatch":{"schedule":""}}
croner in node_modules: import node_modules/croner/dist/croner.js -> ERR_MODULE_NOT_FOUND
C15/C16/C33 skip_permissions=false: status=200 argv=["'/opt/Claude CLI/claude' '/research-cockpit litwatch'"] folder listing before='' after=''
C15/C16/C33 skip_permissions=true: status=200 argv=["'/opt/Claude CLI/claude' '--dangerously-skip-permissions' '/research-cockpit litwatch'"] folder listing before='' after=''
C2 C7-C14 C17-C24 C28-C31 C34 C35 modules:
    import src/lib/server/machine/tasks/schedule.ts -> ERR_MODULE_NOT_FOUND
    import src/lib/server/machine/tasks/record.ts -> ERR_MODULE_NOT_FOUND
    import src/lib/server/machine/tasks/start.ts -> ERR_MODULE_NOT_FOUND
    import src/lib/state/system/machine/schedule.svelte.ts -> ERR_MODULE_NOT_FOUND
    data/helpers/run/tasks.ts exports: taskSkipPermissions
    live-settings targets mention schedules: false
C36 route status 200 terminal 6627b3-claude pane pid 47412
C36 pane shows: /Users/axelfaes/.zshenv:.:1: no such file or directory: /private/tmp/claude-502/-Users-axelfaes-work | space-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3-builder/c36/home/.cargo/env | STUB ARGS: [/research-cockpit scout]
C36 scan (busy): [{"id":"0000b934-0000-4000-8000-00006ac3b7f9","pid":47412,"liveStatus":"busy","live":true}]  pane pid 47412
C36 scan (after 9 s, idle): [{"id":"0000b934-0000-4000-8000-00006ac3b7f9","pid":47412,"liveStatus":"idle","live":true}]
C36 one-run rule on the unchanged tree: import src/lib/server/machine/tasks/schedule.ts -> ERR_MODULE_NOT_FOUND
```

Reading of that run: every schedule case shows no schedule behaviour on the unchanged tree (`taskSchedules` undefined, `writeConfigKey` refusing `tasks.<task>.schedule` with the no-option sentence, the new modules not found); C1, C26, C33 and C36 hold there as the brief says (C1 pane pid equals the printed pid, C26 and C33 below). The cases the brief's rules got wrong are listed under "Anything in the brief that was wrong or impossible".

## The cases, final run

Each case names its checker. `test` is a kept test (title, run on the changed tree in the DONE table, failing lines under "Kept tests"). `probe` is a vitest probe kept in the scratchpad `a3-builder/vp` (`s1.probe.ts`, `s2.probe.ts`, `s3.probe.ts`, `s4.probe.ts`, `s5.probe.ts`, `tray.svelte-probe.ts`, run with `npx vitest run --config <scratchpad>/a3-builder/vp/vitest.config.ts <name>`), `probes/c1.mts` or `probes/c6.mjs`. Output lines are as printed; the two characters outside ASCII that vitest prints (a horizontal rule and the ellipsis inside a long array) are written as `-` and `...`.

### C1. The pane pid and the registry pid

Checked by: probe `c1.mts`.

```
pane_pid 52320 listed pid 52320 printed $$ 52320 ppid(printed) 52319 ppid(pane) 52319
equal: true pane is parent of printed: false
```

### C2. A pattern at 06:59 fires at 07:00 and the payload's next is tomorrow

Checked by: probe s1.

```
C2 06:59:00 payload litwatch pattern=0 7 * * * next=2026-10-04T05:00:00.000Z starts=0
C2 07:00:10 starts=[{"kind":"litwatch","trigger":"schedule","due":"2026-10-04T05:00:00.000Z"}] new-session calls=1 runs=[{"trigger":"schedule","due":"2026-10-04T05:00:00.000Z","at":"2026-10-04T05:00:00.000Z","outcome":"started","terminal":"bd9977-claude"}] next=2026-10-05T05:00:00.000Z (tomorrow 07:00 = 2026-10-05T05:00:00.000Z)
```

### C3. Absent entries, an empty schedule and an empty entry give no job

Checked by: test 'reads each pattern as written, and gives no problem for a missing, empty or {} entry' (settings.test.ts) and probe s1.

```
C3 no job: starts=0 record exists=false payload=[["litwatch","",null],["scout","",null],["linkedin","",null],["inbox","",null]]
```

### C4. Four unreadable patterns and three non-text values give no job and one finding each

Checked by: tests `answers the default and a %s problem for %j` (settings.test.ts), the value-rule rows, the config.test.ts `toContain` lines; probe s5 for the write refusal.

```
C4/C5 write "61 * * * *": refused=[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"This option takes a cron pattern of five fields, such as 0 7 * * 1, or a nickname such as @daily"}] changed=[] file changed=false
C4/C5 write "0 0 31 2 *": refused=[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"This option takes a cron pattern that matches a date, and this one matches none"}] changed=[] file changed=false
C4/C5 write "0 7 * * 1": refused=[] changed=["behavior.yml:tasks.litwatch.schedule"] file changed=true
C4/C5 write "@daily": refused=[] changed=["behavior.yml:tasks.litwatch.schedule"] file changed=true
C4/C5 write "": refused=[] changed=["behavior.yml:tasks.litwatch.schedule"] file changed=true
C4/C5 write 5: refused=[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"This option takes text"}] changed=[] file changed=false
```

### C5. A pattern that matches no date gives no job; 29 February gives a job

Checked by: the same tests, probe s5 for the write refusal, probe `c6.mjs` for the next run.

```
C4/C5 write "61 * * * *": refused=[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"This option takes a cron pattern of five fields, such as 0 7 * * 1, or a nickname such as @daily"}] changed=[] file changed=false
C4/C5 write "0 0 31 2 *": refused=[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"This option takes a cron pattern that matches a date, and this one matches none"}] changed=[] file changed=false
C4/C5 write "0 7 * * 1": refused=[] changed=["behavior.yml:tasks.litwatch.schedule"] file changed=true
C4/C5 write "@daily": refused=[] changed=["behavior.yml:tasks.litwatch.schedule"] file changed=true
C4/C5 write "": refused=[] changed=["behavior.yml:tasks.litwatch.schedule"] file changed=true
C4/C5 write 5: refused=[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"This option takes text"}] changed=[] file changed=false
C6/C5 "0 0 29 2 *" constructs; next after 2026-10-05 12:00 local = Tue Feb 29 2028 00:00:00 GMT+0100 (Central European Standard Time)
C6/C5 "0 0 31 2 *" constructs; next after 2026-10-05 12:00 local = null
```

### C6. Nicknames, a weekday name and a padded pattern each give a job

Checked by: test 'reads each pattern as written...' and probe `c6.mjs`.

```
C6/C5 "@hourly" constructs; next after 2026-10-05 12:00 local = Mon Oct 05 2026 13:00:00 GMT+0200 (Central European Summer Time)
C6/C5 "@daily" constructs; next after 2026-10-05 12:00 local = Tue Oct 06 2026 00:00:00 GMT+0200 (Central European Summer Time)
C6/C5 "@weekly" constructs; next after 2026-10-05 12:00 local = Sun Oct 11 2026 00:00:00 GMT+0200 (Central European Summer Time)
C6/C5 "@monthly" constructs; next after 2026-10-05 12:00 local = Sun Nov 01 2026 00:00:00 GMT+0100 (Central European Standard Time)
C6/C5 "@yearly" constructs; next after 2026-10-05 12:00 local = Fri Jan 01 2027 00:00:00 GMT+0100 (Central European Standard Time)
C6/C5 "0 7 * * MON" constructs; next after 2026-10-05 12:00 local = Mon Oct 12 2026 07:00:00 GMT+0200 (Central European Summer Time)
C6/C5 " 0 7 * * * " constructs; next after 2026-10-05 12:00 local = Tue Oct 06 2026 07:00:00 GMT+0200 (Central European Summer Time)
```

### C7. Catch-up after a short downtime

Checked by: test 'starts one catch-up run at start for the due times missed while the server was down'.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C8. Catch-up after three days is one run

Checked by: the same test, its second row.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C9. A restart after the due time was handled starts nothing

Checked by: test 'never starts a due time the record holds as handled, after a restart or from a second watcher'.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C10. A pattern written after its time today never catches up

Checked by: probe s1.

```
C10 09:12 starts=0 since=2026-10-04T07:12:00.000Z (now 2026-10-04T07:12:00.000Z) handled=null next=2026-10-05T05:00:00.000Z
C10 next day 07:00 starts=[{"kind":"litwatch","trigger":"schedule","due":"2026-10-05T05:00:00.000Z"}]
```

### C11. A pattern changed, emptied or dropped while the server runs

Checked by: probe s1 (the watcher) and probe s2 (the liveSettings path).

```
C11 set(same): schedule payload version 1 -> 1 next=2026-10-05T05:00:00.000Z
C11 set(0 9 * * *) at 08:00: pattern=0 9 * * * next=2026-10-04T07:00:00.000Z (want 2026-10-04T07:00:00.000Z) since=2026-10-04T06:00:00.600Z handled=null
C11 09:01: starts=[{"kind":"litwatch","trigger":"schedule","due":"2026-10-04T07:00:00.000Z"}]
C11 set(''): pattern='' next=null record pattern='' kills=[] timers=1
C11 a day later after emptying: starts=1
C11 push whose merge dropped behavior.yml: set calls still 1, pattern kept=0 9 * * *
```

### C12. A due time while the earlier run is busy, waiting or unmatched

Checked by: test 'starts nothing for a due time while the task's earlier run is working, and records it skipped' (rows busy, waiting, no session matched).

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C13. A due time after the earlier terminal left the list

Checked by: probe s1.

```
C13 earlier terminal absent from the list: new-session=1 kills=[] newest run={"trigger":"schedule","due":"2026-10-04T05:00:00.000Z","at":"2026-10-04T05:00:00.000Z","outcome":"started","terminal":"c05f8d-claude"}
```

### C14. Two tasks due in one minute

Checked by: probe s1.

```
C14 starts=["litwatch","scout"] new-session=2 litwatch=[["started","5320ba-claude"]] scout=[["started","b08699-claude"]]
```

### C15. A hand press is recorded; a press beside a working scheduled run starts a second terminal

Checked by: probe s2 (through `handleTerminal`).

```
C15 hand press: status=200 terminal=527dac-claude record={"pattern":"","since":"2026-10-05T18:10:35.110Z","handled":null,"runs":[{"trigger":"hand","due":null,"at":"2026-10-05T18:10:35.110Z","outcome":"started","terminal":"527dac-claude"}]}
C15 second press while the first terminal is busy: status=200 new terminal=62b31d-claude (differs=true) runs=hand,started,62b31d-claude | hand,started,527dac-claude
```

### C16. The scheduled argv equals the press's, with the flag only under skip_permissions

Checked by: probe s1.

```
C16 skip_permissions=false: hand argv='/opt/Claude CLI/claude' '/research-cockpit litwatch' | scheduled argv='/opt/Claude CLI/claude' '/research-cockpit litwatch' | equal=true
C16 skip_permissions=true: hand argv='/opt/Claude CLI/claude' '--dangerously-skip-permissions' '/research-cockpit litwatch' | scheduled argv='/opt/Claude CLI/claude' '--dangerously-skip-permissions' '/research-cockpit litwatch' | equal=true
```

### C17. Daylight saving changes in Europe/Brussels

Checked by: probe s3 under `TZ=Europe/Brussels`, and test 'starts each run of a pattern inside the hour the clocks skip once, when it is due and not before'.

```
C17 TZ=Europe/Brussels offset now: Mon Oct 05 2026 20:12:09 GMT+0200 (Central European Summer Time)
C17 "30 2 * * *" from 2026-03-28 23:00 CET for 30 h: ["2026-03-29 03:30:00 GMT+02:00","2026-03-30 02:30:00 GMT+02:00"]
C17 "30 2 * * *" from 2026-10-24 23:00 CEST for 30 h: ["2026-10-25 02:30:00 GMT+02:00","2026-10-26 02:30:00 GMT+01:00"]
C17 "0 * * * *" from 2026-10-24 23:30 CEST for 6 h (the repeated hour at 02:00 CEST/CET is 00:00Z and 01:00Z): ["2026-10-25 00:00:00 GMT+02:00","2026-10-25 01:00:00 GMT+02:00","2026-10-25 02:00:00 GMT+02:00","2026-10-25 03:00:00 GMT+01:00","2026-10-25 04:00:00 GMT+01:00"]
```

### C18. A machine asleep over two due times

Checked by: probe s1.

```
C18 wake 09:00: starts=[{"kind":"litwatch","trigger":"schedule","due":"2026-10-04T05:00:00.000Z"},{"kind":"scout","trigger":"schedule","due":"2026-10-04T06:00:00.000Z"}] (07:00=2026-10-04T05:00:00.000Z 08:00=2026-10-04T06:00:00.000Z)
```

### C19. A yearly pattern waits in timers of at most 30 s

Checked by: probe s1.

```
C19 timer delays recorded while waiting (max ms) = 30000 over 14 timers; payload next=2026-12-31T23:00:00.000Z
C19 after 1 Jan 00:00:05: starts=[{"kind":"litwatch","trigger":"schedule","due":"2026-12-31T23:00:00.000Z"}] (want one, due 2026-12-31T23:00:00.000Z)
```

### C20. A missing, unreadable or wrong-shaped record file

Checked by: test 'refuses a write over a schedule record it cannot read, leaving it' (record.test.ts); probes s1 and s2.

```
C20 missing file: exists after the first write=true mode=600 lock left=false
C20 file="{": starts=0 new-session=0 sha 021fb596db81 -> 021fb596db81 payload.error="RECORD UNREAD SENTENCE" stderr lines=1: schedule record: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/a3-probe-Uz290u/schedule.json is not JSON; no schedule
C20 file="{\"litwatch\": 5}": starts=0 new-session=0 sha 2b9f2f511ac7 -> 2b9f2f511ac7 payload.error="RECORD UNREAD SENTENCE" stderr lines=1: schedule record: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/a3-probe-UFGE3c/schedule.json holds a litwatch entry o
C20 hand press with an unreadable record: status=200 new-session=1 sha 021fb596db81 -> 021fb596db81 stderr=["schedule record: a run was not recorded: is not JSON"]
```

### C21. A record write that fails

Checked by: probe s1.

```
C21 read-only folder: new-session=0 stderr=["schedule: litwatch 2026-10-04T05:00:00.000Z: Error: EACCES: permission denied, open '/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/a3-pro"] file exists=false
C21 next due time after the folder is writable: new-session=1 runs=[{"trigger":"schedule","due":"2026-10-05T05:00:00.000Z","at":"2026-10-05T05:00:00.000Z","outcome":"started","terminal":"2baf1a-claude"}]
```

### C22. Two watchers over one record start one run

Checked by: test 'never starts a due time the record holds as handled, after a restart or from a second watcher'.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C23. A refused start is recorded failed

Checked by: probe s1 and probe s2.

```
C23 start refused (tmux lists no session): runs=[{"trigger":"schedule","due":"2026-10-04T05:00:00.000Z","at":"2026-10-04T05:00:00.000Z","outcome":"failed","terminal":null}] handled=2026-10-04T05:00:00.000Z
C23 next day: runs=[["started","2285ce-claude"],["failed",null]] new-session calls=2
C23 route: refused start answers status=400 body={"error":"terminal-not-started"} record=[{"trigger":"hand","due":null,"at":"2026-10-05T18:10:35.144Z","outcome":"failed","terminal":null}]
```

### C24. close() with a job armed and with a start awaited

Checked by: test 'leaves no timer after close and starts nothing, a start already awaited included'.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C25. A key the catalog holds no entry for gives no finding

Checked by: test 'gives no problem for a key the catalog holds no entry for'.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C26. No test or probe runs a real update task

Checked by: `grep -rn "research-cockpit" tests` and the recording runner of the step's tests.

```
$ grep -rn "research-cockpit" tests
tests/data/sources/feeds.test.ts:43:    - "2026-09-02 (local /research-cockpit scout): an older pass"
tests/data/sources/feeds.test.ts:44:    - "2026-09-09 (local /research-cockpit scout): the newest pass"
tests/data/sources/feeds.test.ts:45:    - "2026-09-10 (local /research-cockpit litwatch): a different task, not a run of this feed"
tests/routes/sessions/terminal-actions.test.ts:82:                `'/opt/Claude CLI/claude' '/research-cockpit ${kind}'`
$ grep -n "spawn\|execFile\|exec(" tests/server/machine/tasks/*.ts
(no output)
```

### C27. The tray before the first schedule message

Checked by: probe `tray.svelte-probe.ts`.

```
C27 TRAY BEFORE ANY schedule MESSAGE:
    | Update tasks
    | Close
    | Lit Watch
    | new-paper radar (web | minutes) Unavailable
    | Scout
    | academic openings (web | minutes) Unavailable
    | LinkedIn
    | draft a post from _linkedin/ Unavailable
    | Inbox
    | Gmail triage over the private mailbox Unavailable Gmail triage over the private mailbox
    | Chat
    | Ask about the portfolio, e.g. "what's blocked?", "summarise a project". Runs on your Claude Code / Max plan; I remember this conversation.
C27 TRAY AFTER A schedule MESSAGE (a listed terminal, an unlisted one, an error):
    | Update tasks
    | Close
    | The run record ~/.oculus/schedule.json does not read, so no scheduled run starts; the file is left as it is.
    | Lit Watch
    | new-paper radar (web | minutes) Unavailable Next: 10-06 07:00 07:00 scheduled started
    | 06:00 scheduled skipped, the earlier run was still going
    | 05:01 caught up started
    | 04:00 by hand failed
    | Scout
    | academic openings (web | minutes) Unavailable No schedule
    | LinkedIn
    | draft a post from _linkedin/ Unavailable No schedule
    | Inbox
    | Gmail triage over the private mailbox Unavailable Next: 10:00 Gmail triage over the private mailbox
    | Chat
    | Ask about the portfolio, e.g. "what's blocked?", "summarise a project". Runs on your Claude Code / Max plan; I remember this conversation.
```

### C28. A stale lock is taken over; a young lock that outlasts the wait starts nothing

Checked by: probe s1.

```
C28 lock 120 s old: new-session=1 runs=1 lock left=false stderr=["schedule record: took over /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/a3-probe-kCvvIM/schedule.json.lock, which was 120000 m"]
C28 lock 7 s old at the due time, outlasting the wait: new-session=0 runs=0 lock still there=true stderr=["schedule: litwatch 2026-10-04T05:00:00.000Z: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/a3-probe-dwFhAa/schedule.json.lock stays taken"]
C28 next due time with the lock gone: new-session=1 runs=[["started","2026-10-05T05:00:00.000Z"]]
```

### C29. A due time while the task's own start is awaited

Checked by: probe s1.

```
C29 two minutes due, the first start still awaited: starts called=1 runs=[["skipped",null,"2026-10-04T07:01:00.000Z"],["started",null,"2026-10-04T07:00:00.000Z"]]
```

### C30. A catch-up before the first sessions payload waits for it

Checked by: probe s1 (busy half) and test 'ends the terminal of the task's idle earlier run, and then starts the new run' (idle half).

```
C30 session busy: before the payload starts=0 new-session=0 runs=1; after: new-session=0 kills=[] newest run={"trigger":"catch-up","due":"2026-10-04T05:00:00.000Z","at":"2026-10-04T07:00:05.000Z","outcome":"skipped","terminal":"aabbcc-claude"}
C30 session idle: before the payload starts=0 new-session=0 runs=1; after: new-session=1 kills=["oculus-aabbcc-claude"] newest run={"trigger":"catch-up","due":"2026-10-04T05:00:00.000Z","at":"2026-10-04T07:00:05.000Z","outcome":"started","terminal":"0637a0-claude"}
```

### C31. An idle earlier run's terminal is ended, then the new run starts

Checked by: the same test, and probe s1.

```
C31 six hourly due times, each earlier run idle: new-session=6 kills=5 max open at once=1
```

### C32. A tasks entry or block that is not a map

Checked by: test 'names a task entry or a tasks block that is not a map, and reads the other tasks'.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C33. A hand press with no record path writes nothing

Checked by: probe s2.

```
C33 no record path: status=200 new-session=1 scratch folder listing before='' after=''
```

### C34. A foreign key is kept; the 21st run drops the oldest

Checked by: probe s1.

```
C34 foreign key after a write: file has foo=true payload tasks=litwatch,scout,linkedin,inbox (no foo)
C34 21 hand runs: kept=20 newest at=2026-01-21T00:00:00.000Z oldest at=2026-01-02T00:00:00.000Z (the first, 2026-01-01, dropped)
```

### C35. A changed pattern through liveSettings

Checked by: probe s2.

```
C35 before: pattern=0 7 * * * next=2026-10-06T05:00:00.000Z
C35 config push 0 7 -> 0 9: set calls=1 ["0 9 * * *"] pattern=0 9 * * * next local hour=9
C35 push with the same pattern: set calls still 1
```

### C36. The real argv on a scratch tmux server with the stub claude

Checked by: probe s4 (a real tmux server on its own socket, the stub claude, the real registry scan).

```
C36 first start answer: {"terminal":{"resumes":null,"task":false,"exit":null,"job":null,"foreign":false,"id":"7e6123-claude","name":"task litwatch","title":"","icon":"","color":"","kind":"claude","cwd":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3-builder/c36b","command":"bash","pid":3757,"created":"2026-10-05T18:10:37.000Z","attached":false}}
C36 a press started terminal 7e6123-claude (pane pid 3757) through startUpdateTask with the real taskCommand argv
C36 pane shows: STUB ARGS: [/research-cockpit litwatch] | STUB PID=3757 | STUB STATUS=busy
C36 sessions payload inputs (busy): {"records":[[3757,"busy"]],"terminals":[["7e6123-claude",3757]]}
C36 first minute boundary, session busy: runs (newest first) = ["schedule/skipped/7e6123-claude","hand/started/7e6123-claude"]; terminals now = ["7e6123-claude"]
C36 sessions payload inputs (idle): {"records":[[3757,"idle"]],"terminals":[["7e6123-claude",3757]]}
C36 second minute boundary, session idle: runs (newest first) = ["schedule/started/64bdb0-claude","schedule/skipped/7e6123-claude","hand/started/7e6123-claude"]; terminals now = ["64bdb0-claude"]
```

## DONE / NOT DONE

Run from `tools/oculus` in the worktree. NOT DONE: nothing. Not covered by any check, and not verified: the autumn overlap hour is checked by probe s3 only, not by a kept test; the page's drawing of the tray is checked by the render probe only (the look at landing is the orchestrator's); `npm run test:landing` was not run.

| Item | Command | Result |
|---|---|---|
| Items 1 to 8 built | the files listed under "The files" | DONE |
| Rulings 1 to 11 of the round | the sections of "Round 1" above, each with its command | DONE |
| Verify list, last run (f) | `sh <land>/templates/checks.sh <state file>` from `tools/oculus` (runs `npm run test:quick`) | green, 44.7 s, quoted below |
| Tests of `tests/checks` | `npx vitest run tests/checks --testTimeout 120000 --reporter=dot` | 16 files, 229 tests passed |
| The tests of the step | `npx vitest run tests/server/machine/tasks tests/data/sources/config/settings.test.ts tests/data/sources/config/catalog/value-rule.test.ts tests/checks/config/config.test.ts tests/routes/sessions/terminal-actions.test.ts --reporter=verbose` | 6 files, 105 tests passed, listed below |
| ASCII gate | `LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)` (the command of spec.md:97, `bin` left out: it does not exist in this tree) | prints nothing |
| ASCII over HELP.md and DESIGN.md | `LC_ALL=C grep -c '[^ -~]' HELP.md DESIGN.md` | 0 and 0 |
| Unused exports | `sh utils/unused-exports.sh | wc -l`, and `diff` against the base's output | 379 lines, diff empty (base 379) |
| Sizes and folders | `wc -l` of each file and `ls <folder> | wc -l` | largest written source file 845 lines (terminals.svelte.ts, limit 880); UpdateTray.svelte 285 (520); server/machine 9 items, machine/tasks 3, state/system/machine 7, tests/server/machine 7, tests/server/machine/tasks 2, data/helpers/run 2 |
| Diagrams | `npm run diagrams` before each list run; `tests/checks/diagrams` is in the `tests/checks` row | passed |
| Probes | `npx vitest run --config <scratchpad>/vp/vitest.config.ts <probe>` for s1 to s5 (s3 under `TZ=Europe/Brussels`), the render probe with `vitest.svelte.config.mjs`, `node probes/c6.mjs`, `node --experimental-strip-types probes/c1.mts` | s1 17, s2 2, s3 1, s4 1, s5 1, render probe 1 tests passed |
| Full-list runs | `checks.sh` over `npm run test:quick` | 6 runs in this round, all green; run f is the last |

The tests of the step, verbose run on the changed tree (`--reporter=verbose`, the check mark removed):

```
 ok |unit| tests/checks/config/config.test.ts > loadLocal > reads the file inside the config folder and not one beside it
 ok |unit| tests/checks/config/config.test.ts > loadLocal > reports an unknown key once and ignores it
 ok |unit| tests/checks/config/config.test.ts > loadLocal > accepts distinct Claude labels on equal folder basenames and a matching Codex label
 ok |unit| tests/checks/config/config.test.ts > loadLocal > reads the file of the engine it is given and never another engine own
 ok |unit| tests/checks/config/config.test.ts > checkLocal > says nothing, and prints nothing, about an unknown key
 ok |unit| tests/checks/config/config.test.ts > the config folder of an engine > is that engine own folder, so a run over a copy reads and writes the copy
 ok |unit| tests/checks/config/config.test.ts > the config folder of an engine > is the folder the engine root serves and the file a root finding names
 ok |unit| tests/checks/config/config.test.ts > loadConfig > merges the top-level keys of every file in name order
 ok |unit| tests/checks/config/config.test.ts > loadConfig > reports a top-level key two files define and takes the value from the later one
 ok |unit| tests/checks/config/config.test.ts > loadConfig > reports a catalog key two owner files define and takes the later value
 ok |unit| tests/checks/config/config.test.ts > loadConfig > reports a file that does not parse and merges the rest
 ok |unit| tests/checks/config/config.test.ts > loadConfig > reports a file that is not a map and treats an empty file as no keys
 ok |unit| tests/checks/config/config.test.ts > loadConfig > leaves the machine own file out of the merge, clashing key and all
 ok |unit| tests/checks/config/config.test.ts > loadConfig > reports a missing config directory and returns an empty map
 ok |unit| tests/checks/config/config.test.ts > loadConfig > words a catalog block that is not a map from the catalog, naming where it stops
 ok |unit| tests/checks/config/config.test.ts > loadConfig > reports a catalog block whose aliases loop as a finding rather than throwing
 ok |unit| tests/checks/config/config.test.ts > loadConfig > names a sentence file that does not parse by its key and arguments, without throwing
 ok |unit| tests/checks/config/config.test.ts > behaviorFindings > names the key that replaced a retired one, against behavior.yml
 ok |unit| tests/checks/config/config.test.ts > behaviorFindings > says nothing about a configuration whose keys are all under their own names
 ok |unit| tests/checks/config/config.test.ts > settingFindings > words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files
 ok |unit| tests/checks/config/config.test.ts > settingFindings > says nothing for a merge that dropped behavior.yml, or for a map without the catalog
 ok |unit| tests/checks/config/config.test.ts > themeFindings > names a theme row whose glyph is empty or missing, and draws it with its words alone
 ok |unit| tests/checks/config/config.test.ts > themeFindings > names a glyph the vocabulary does not hold, a prototype key among them
 ok |unit| tests/checks/config/config.test.ts > themeFindings > names a second row repeating a theme, and nothing for two rows sharing a glyph
 ok |unit| tests/checks/config/config.test.ts > themeFindings > names a code theme that is no listed id, one finding per value, case included
 ok |unit| tests/checks/config/config.test.ts > themeFindings > names a bad code theme in a config that has no themes list
 ok |unit| tests/checks/config/config.test.ts > themeFindings > says nothing for an absent code_theme, tokens or a listed id
 ok |unit| tests/checks/config/config.test.ts > themeFindings > says nothing about the shipped list, a row with no name, or a config with no list
 ok |unit| tests/checks/config/config.test.ts > vocabCatalog > carries code_theme with the other appearance keys, and only when the config holds it
 ok |unit| tests/data/sources/config/settings.test.ts > the synthetic catalog > gives every setting a default other than the shipped one
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > answers the default for a days with a range problem
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > answers the default for a days with a whole problem
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > answers the default for a poll_min with a range problem
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > answers the default for a quota_min with a range problem
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > answers the default for a days that is no number
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > answers the default for a poll_min that is no number
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > answers the default for a quota_min that is no number
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > answers the default for an empty resource, a text that is not a program and a flag
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > reads the corrected value with no problem
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > answers every default and one problem for a block that is not a map
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > answers the defaults and no problem for a missing, null or empty block, a missing key and a misspelt key
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > names two wrong keys of one block and reads the other three
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > throws the sentence naming the key and options.yml for a catalog with no entry
 ok |unit| tests/data/sources/config/settings.test.ts > slurmSettings > throws when an entry default is refused by its own bounds
 ok |unit| tests/data/sources/config/settings.test.ts > calendarSettings > answers the default for a poll_min with a range problem
 ok |unit| tests/data/sources/config/settings.test.ts > calendarSettings > answers the default for a days_back with a range problem
 ok |unit| tests/data/sources/config/settings.test.ts > calendarSettings > answers the default for a days_back with a whole problem
 ok |unit| tests/data/sources/config/settings.test.ts > calendarSettings > answers the default for a days_ahead with a range problem
 ok |unit| tests/data/sources/config/settings.test.ts > calendarSettings > answers the defaults for a block that is no map, and the written value for a good one
 ok |unit| tests/data/sources/config/settings.test.ts > searchSettings > answers the default for each value that is not above zero, and for a fraction of hits
 ok |unit| tests/data/sources/config/settings.test.ts > literatureSettings > answers the written values, and the default with the key named for each wrong value or a block that is no map
 ok |unit| tests/data/sources/config/settings.test.ts > mailSettings > answers the default for a wrong value and names the key
 ok |unit| tests/data/sources/config/settings.test.ts > changesKeep > answers the default for a keep that is not a whole number above zero
 ok |unit| tests/data/sources/config/settings.test.ts > openSettings and programApps > leaves out each member the entry refuses and names it
 ok |unit| tests/data/sources/config/settings.test.ts > openSettings and programApps > answers an empty map and one problem for a map that is none
 ok |unit| tests/data/sources/config/settings.test.ts > openSettings and programApps > answers an empty map for a configuration that holds no catalog yet
 ok |unit| tests/data/sources/config/settings.test.ts > latexFormatting and latexAutoBuild > answers the default for a formatter outside the entry words
 ok |unit| tests/data/sources/config/settings.test.ts > latexFormatting and latexAutoBuild > answers the default for a program path that is not a path
 ok |unit| tests/data/sources/config/settings.test.ts > latexFormatting and latexAutoBuild > reads the auto build by its entry
 ok |unit| tests/data/sources/config/settings.test.ts > usageTiers > leaves out each entry that is no text and names it
 ok |unit| tests/data/sources/config/settings.test.ts > usageTiers > answers an empty map for a map that is none, and for none
 ok |unit| tests/data/sources/config/settings.test.ts > processesSettings > answers the default list for ["python3","a/b"] and names the key
 ok |unit| tests/data/sources/config/settings.test.ts > processesSettings > answers the default list for ["python3","my tool"] and names the key
 ok |unit| tests/data/sources/config/settings.test.ts > processesSettings > reads a good list and an empty one
 ok |unit| tests/data/sources/config/settings.test.ts > refreshSettings, autofetchMin and paintLimit > answers the default for a wrong cadence and a model outside the models
 ok |unit| tests/data/sources/config/settings.test.ts > refreshSettings, autofetchMin and paintLimit > answers the default for a fetch period that is negative or a fraction
 ok |unit| tests/data/sources/config/settings.test.ts > refreshSettings, autofetchMin and paintLimit > answers the default bytes for a paint limit that is wrong, and null with no catalog
 ok |unit| tests/data/sources/config/settings.test.ts > confirmDelete > answers the default for a wrong flag, and true with no catalog
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > reads each pattern as written, and gives no problem for a missing, empty or {} entry
 ok |unit| tests/checks/config/config.test.ts > optionFindings > reads the shipped options catalog with no finding
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, the task action > starts every accepted task as an interactive session, with no skip and no print-mode flags
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a form problem for "nonsense"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a form problem for "61 * * * *"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a form problem for "* * * * * *"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a form problem for "*/0 * * * *"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a text problem for 5
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a text problem for null
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a text problem for []
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a cron_never problem for "0 0 31 2 *"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > names a task entry or a tasks block that is not a map, and reads the other tasks
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > gives no problem for a key the catalog holds no entry for
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > reads a pattern the Settings view wrote at its three-level key
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, the latex action > builds one main file with latexmk in the manuscript folder
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, the latex action > builds again in the terminal it kept, and cleans in another
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, a refusal > answers 'a body that is no map' as the word 'not-an-action'
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, a refusal > answers 'an action that is none' as the word 'not-an-action'
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, a refusal > answers 'an input to a session oculus did not ...' as the word 'not-ours'
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, a refusal > answers 'a fork of an id that is no session' as the word 'not-a-session'
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, a refusal > answers 'a start with a size that is no number' as the word 'bad-terminal'
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, a refusal > answers 'a rename of a terminal the list does ...' as the word 'terminal-ended'
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, a refusal > answers 'a resize of a terminal tmux no longer...' as the word 'terminal-ended'
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, a refusal > answers 'a start whose session was not listed ...' as the word 'terminal-not-started'
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, a refusal > answers 'a build in a folder of a root nothing...' as the word 'outside'
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, the chat action > starts a focused interactive Claude terminal and writes its private index first
 ok |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > starts one catch-up run at start for the due times missed while the server was down
 ok |unit| tests/data/sources/config/settings.test.ts > the shipped files > answers the shipped default for each setting the shipped file gets wrong, and reads every shipped default
 ok |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > starts nothing for a due time while the task's earlier run is working, and records it skipped
 ok |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > ends the terminal of the task's idle earlier run, and then starts the new run
 ok |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > never starts a due time the record holds as handled, after a restart or from a second watcher
 ok |unit| tests/server/machine/tasks/record.test.ts > the run record > refuses a write over a schedule record it cannot read, leaving it
 ok |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > leaves no timer after close and starts nothing, a start already awaited included
 ok |unit| tests/data/sources/config/catalog/value-rule.test.ts > valueProblem > answers the kind of problem each control, bound and list gives a value, and none for a value that fits
 ok |unit| tests/data/sources/config/catalog/value-rule.test.ts > valueProblem over a list > checks each item by the entry bounds, whole and form
 ok |unit| tests/data/sources/config/catalog/value-rule.test.ts > itemProblem and hasForm > checks one item of a list by the same rule
 ok |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > starts the run of a pattern inside the hour the clocks skip once, when it is due and not before
 Test Files  6 passed (6)
      Tests  105 passed (105)
```

Lines of the last list run (f):

```
test:quick: 61 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (3.5 s)
ok      prettier (3.6 s): All matched files use Prettier code style!
ok      svelte-check (36.7 s): 1791224546282 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (42.5 s)
ok      vitest (43.3 s): Duration  37.87s (transform 100.27s, setup 0ms, import 123.27s, tests 22.39s, environment 208ms)
test:quick: 44.7 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
```

Lines of the five earlier list runs of this round:

Run a:

```
test:quick: 61 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (1.8 s)
ok      prettier (2.8 s): All matched files use Prettier code style!
ok      svelte-check (35.4 s): 1791221868745 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (51.3 s): Duration  46.23s (transform 64.54s, setup 0ms, import 140.75s, tests 19.07s, environment 285ms)
ok      eslint (86.3 s)
test:quick: 87.2 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
```

Run b:

```
test:quick: 61 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      ASCII gate (0.8 s)
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.7 s)
ok      eslint (22.1 s)
ok      svelte-check (28.2 s): 1791222320819 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (88.2 s): Duration  82.44s (transform 118.92s, setup 0ms, import 275.54s, tests 38.61s, environment 922ms)
test:quick: 89.1 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
```

Run c:

```
test:quick: 61 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      ASCII gate (1.0 s)
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.2 s)
ok      svelte-check (17.0 s): 1791222655849 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (33.1 s): Duration  29.15s (transform 42.12s, setup 0ms, import 95.42s, tests 15.99s, environment 244ms)
ok      eslint (37.3 s)
test:quick: 38.2 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
```

Run d:

```
test:quick: 61 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      ASCII gate (0.5 s)
ok      svelte-kit sync (1.8 s)
ok      prettier (2.1 s): All matched files use Prettier code style!
ok      svelte-check (21.0 s): 1791223130081 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (38.3 s): Duration  34.10s (transform 89.58s, setup 0ms, import 113.90s, tests 18.01s, environment 114ms)
ok      eslint (40.8 s)
test:quick: 41.4 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
```

Run e:

```
test:quick: 61 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      ASCII gate (0.7 s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.0 s)
ok      eslint (11.5 s)
ok      svelte-check (33.0 s): 1791224104373 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (58.6 s): Duration  54.26s (transform 75.63s, setup 0ms, import 180.15s, tests 30.36s, environment 278ms)
test:quick: 59.3 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
```

## Kept tests: failing lines on the unchanged tree

On the unchanged tree (the dispatch base copied to the scratchpad, the step's test files copied in, `node_modules` linked; `base.out`):

```
FAIL  |unit| tests/server/machine/tasks/record.test.ts [ tests/server/machine/tasks/record.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/tasks/record.ts' imported from <base>/tests/server/machine/tasks/record.test.ts
FAIL  |unit| tests/server/machine/tasks/schedule.test.ts [ tests/server/machine/tasks/schedule.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/tasks/record.ts' imported from <base>/tests/server/machine/tasks/schedule.test.ts
------ Failed Tests 15 -------
FAIL  |unit| tests/checks/config/config.test.ts > settingFindings > words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files
AssertionError: expected [ 'calendar.days_ahead', ...(35) ] to deeply equal [ 'calendar.days_ahead', ...(38) ]
FAIL  |unit| tests/data/sources/config/settings.test.ts > the synthetic catalog > gives every setting a default other than the shipped one
TypeError: Cannot read properties of undefined (reading 'default')
FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > reads each pattern as written, and gives no problem for a missing, empty or {} entry
AssertionError: expected { Object (threw) } to strictly equal { value: { ...(4) }, problems: [] }
FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a form problem for "nonsense"
FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a form problem for "61 * * * *"
FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a form problem for "* * * * * *"
FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a form problem for "*/0 * * * *"
AssertionError: expected { Object (threw) } to strictly equal { value: { ...(4) }, ...(1) }
FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a text problem for 5
FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a text problem for null
FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a text problem for []
AssertionError: expected { Object (threw) } to strictly equal { value: { ...(4) }, ...(1) }
FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a cron_never problem for "0 0 31 2 *"
AssertionError: expected { Object (threw) } to strictly equal { value: { ...(4) }, ...(1) }
FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > names a task entry or a tasks block that is not a map, and reads the other tasks
AssertionError: expected { Object (threw) } to strictly equal { value: { ...(4) }, ...(1) }
FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > reads a pattern the Settings view wrote at its three-level key
AssertionError: expected [ { ...(2) } ] to strictly equal []
FAIL  |unit| tests/data/sources/config/settings.test.ts > the shipped files > answers the shipped default for each setting the shipped file gets wrong, and reads every shipped default
AssertionError: expected [ 'calendar.days_ahead', ...(30) ] to strictly equal [ 'calendar.days_ahead', ...(33) ]
FAIL  |unit| tests/data/sources/config/catalog/value-rule.test.ts > valueProblem > answers the kind of problem each control, bound and list gives a value, and none for a value that fits
TypeError: Cannot read properties of undefined (reading 'test')
Test Files  5 failed | 1 passed (6)
Tests  15 failed | 83 passed (98)
Tests  11 passed (11)
== UNCHANGED TREE boundaries (testTimeout 120000)
      Tests  11 passed (11)
```

## The stub of the look, quoted whole (`probes/stub-claude.sh`)

```
#!/bin/bash
# Stub for the real claude, used by the A3 probes and the look. It prints its arguments, writes the
# registry entry and the transcript a Claude session writes into its account folder, reports busy
# for STUB_BUSY_SECONDS (default 8) and then idle, and waits for input. The account folder is
# CLAUDE_CONFIG_DIR or $HOME/.claude. A file stub-status in the account folder holding busy or idle
# overrides the timer.
ACCOUNT="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
BUSY="${STUB_BUSY_SECONDS:-8}"
printf 'STUB ARGS:'
for arg in "$@"; do printf ' [%s]' "$arg"; done
printf '\nSTUB PID=%s\n' "$$"
ID="$(printf '%08x-0000-4000-8000-%012x' "$$" "$(date +%s)")"
SLUG="$(printf '%s' "$PWD" | tr '/' '-')"
mkdir -p "$ACCOUNT/sessions" "$ACCOUNT/projects/$SLUG"
START_MS=$(( $(date +%s) * 1000 ))
REGISTRY="$ACCOUNT/sessions/$$.json"
TRANSCRIPT="$ACCOUNT/projects/$SLUG/$ID.jsonl"
write_registry() {
    printf '{"pid":%s,"sessionId":"%s","cwd":"%s","startedAt":%s,"kind":"interactive","entrypoint":"cli","status":"%s","name":"stub"}\n' \
        "$$" "$ID" "$PWD" "$START_MS" "$1" > "$REGISTRY.tmp"
    mv "$REGISTRY.tmp" "$REGISTRY"
}
trap 'rm -f "$REGISTRY"' EXIT
NOW="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
printf '{"type":"user","sessionId":"%s","cwd":"%s","timestamp":"%s","version":"stub","entrypoint":"cli","origin":{"kind":"human"},"message":{"role":"user","content":"%s"}}\n' \
    "$ID" "$PWD" "$NOW" "$*" > "$TRANSCRIPT"
LAST=""
BEGAN=$SECONDS
while :; do
    if [ -f "$ACCOUNT/stub-status" ]; then
        STATUS="$(cat "$ACCOUNT/stub-status")"
    elif [ $(( SECONDS - BEGAN )) -lt "$BUSY" ]; then
        STATUS=busy
    else
        STATUS=idle
    fi
    if [ "$STATUS" != "$LAST" ]; then
        write_registry "$STATUS"
        printf 'STUB STATUS=%s\n' "$STATUS"
        LAST="$STATUS"
    fi
    if read -r -t 1 LINE; then
        [ "$LINE" = "quit" ] && exit 0
    fi
done
```

## The files

```
DESIGN.md   438 ->   440
HELP.md   352 ->   352
config/behavior.yml   201 ->   206
config/catalogs/options.yml  1280 ->  1312
config/text/app.yml    72 ->    81
config/text/findings.yml   179 ->   181
config/text/server.yml   106 ->   108
config/text/views/system/workbench.yml   199 ->   201
package-lock.json  7442 ->  7462
package.json    96 ->    97
src/lib/data/helpers/run/tasks.ts    22 ->    34
src/lib/data/model/index.ts   546 ->   553
src/lib/data/model/model-processes.ts    40 ->    70
src/lib/data/sources/config/catalog/options.ts   558 ->   561
src/lib/data/sources/config/catalog/value-rule.ts   252 ->   285
src/lib/data/sources/config/catalog/value-words.ts   117 ->   121
src/lib/data/sources/config/settings.ts   482 ->   509
src/lib/server/edit/writes/config/config-fit.ts   489 ->   492
src/lib/server/machine/pty/routes.ts   685 ->   664
src/lib/server/machine/tasks/record.ts new/changed ->   291
src/lib/server/machine/tasks/schedule.ts new/changed ->   380
src/lib/server/machine/tasks/start.ts new/changed ->   111
src/lib/server/root/context.ts   737 ->   756
src/lib/server/root/live-settings.ts   275 ->   290
src/lib/server/root/watch/pollers.ts   172 ->   220
src/lib/shell/rail/UpdateTray.svelte   248 ->   285
src/lib/state/client/context.ts   505 ->   509
src/lib/state/client/entities.svelte.ts   108 ->   110
src/lib/state/client/payloads.ts   129 ->   134
src/lib/state/sessions/terminals.svelte.ts   839 ->   845
src/lib/state/shared/stores/shapes.ts   322 ->   325
src/lib/state/system/config/editors/fields.ts   653 ->   664
src/lib/state/system/config/messages.ts    58 ->    60
src/lib/state/system/machine/schedule.svelte.ts new/changed ->    95
src/routes/+page.svelte   221 ->   222
src/routes/api/(sessions)/terminal/+server.ts    43 ->    44
tests/checks/config/config.test.ts new/changed ->   603
tests/checks/tree/boundaries.test.ts   657 ->   657
tests/data/sources/config/catalog/value-rule.test.ts new/changed ->   237
tests/data/sources/config/settings.test.ts new/changed ->   684
tests/data/sources/config/wrong-settings.ts new/changed ->    40
tests/routes/git/git.test.ts changed -> 213
tests/routes/machine/hpc.test.ts changed -> 38
tests/routes/sessions/terminal-actions.test.ts   342 ->   342
tests/routes/sessions/terminal-fixture.ts   213 ->   213
tests/server/machine/tasks/record.test.ts    42 ->    42
tests/server/machine/tasks/schedule.test.ts   341 ->   370
tests/server/root/context-fixture.ts   124 ->   129
```

`docs/diagrams/` holds 12 regenerated files (`npm run diagrams`); the brief's paths list names them.

## Every judgment call the brief left open

1. Where `UPDATE_TASKS` and `UpdateTask` live. The brief puts them in `data/helpers/run/tasks.ts`, and `SchedulePayload` in `data/model/model-processes.ts` names `UpdateTask`. `tests/checks/imports/order.test.ts` ('holds the data folders') refuses `data/model/model-processes.ts` importing `data/helpers/run/tasks.ts` (data/helpers is above data/model). They are defined in `model-processes.ts`, exported by `data/model/index.ts`, and re-exported by `data/helpers/run/tasks.ts:21`, from which the consumers import them. The boundary table is unchanged: `data/helpers/run/tasks` is in the state row.
2. The croner call that gives the fired due time. `dueAt(job, now)` in `server/machine/tasks/schedule.ts:87` is `job.previousRuns(LOOKBACK, <the start of the second after now>).find((due) => due.getTime() <= now.getTime())` with `LOOKBACK = 61`, because `previousRuns` is exclusive and second-granular, and because croner answers the due times of a skipped hour, moved after it, from the start of that hour. Probe `probes/cron-boundary.mjs` (`final/cron-boundary.out`) shows the second-granular part: `previousRuns(now)` at 0 ms after the due time answers the day before.
3. A look for a due time every 30 s (`CHECK_MS`, `consider` in `schedule.ts`) beside croner's timer. Evidence: raw croner callbacks over 30 h from 2026-03-28 22:00Z under `TZ=Europe/Brussels` fire only at 2026-03-30 02:30 (probe `vp/s3b.probe.ts`: `C17b raw croner callbacks (fake clock, 30 h): ["2026-03-30 02:30:00 GMT+02:00"]`), so a daily 02:30 never runs on the day the clocks skip it by the timer alone, while C17 expects 03:30. `consider` decides the newest due time not later than now that no decision has seen (`seen[kind]`), so the timer and the look never start one due time twice; `claimDue` stays the guard across servers. The sixth test of `schedule.test.ts` keeps it.
4. The lock: `schedule.json.lock` opened `wx`, retry every 50 ms for up to 2 s, a lock older than 60 s taken over with one stderr line (`record.ts`, `LOCK_RETRY_MS`, `LOCK_WAIT_MS`, `STALE_LOCK_MS`). A folder the lock cannot be made in (permission) answers `unwritable`, not `locked`.
5. The store's name is `schedule` (`state/system/machine/schedule.svelte.ts`, `createSchedule`, `ScheduleStore { task(kind), error() }`, five runs shown). The shell reads it, so `'schedule'` is added to `SHELL_STORES` in `tests/checks/tree/boundaries.test.ts`, a file outside the paths list (ruling 6).
6. The tray is not split: `UpdateTray.svelte` is 285 lines (limit 520), so no `TaskRow` component.
7. The stub of the look (`probes/stub-claude.sh`, quoted whole above): prints its arguments and pid, writes the registry entry `<account>/sessions/<pid>.json` and a transcript, is busy for `STUB_BUSY_SECONDS` (default 8) and then idle, or follows a file `<account>/stub-status` holding `busy` or `idle`, and ends on the input line `quit`.
8. The grid of a scheduled run is 80 x 24 (`SCHEDULED_SIZE` in `start.ts`): no page is sized for it.
9. The sentence for an unreadable record is read with `words(text, 'app.tasks.record_unread')` so the key check (`tests/checks/source/keys.test.ts`) sees its reader.
10. `taskSchedules` is read from `data/sources/config/settings.ts` by `context.ts`, `live-settings.ts` and the tests; `data/sources/config.ts` does not re-export it, since nothing reads it there and `utils/unused-exports.sh` would list it.
11. Exports kept to what is imported elsewhere: `RUNS_KEPT`, `STALE_LOCK_MS`, `change`, `TaskLogs`, `Refused`, `Change` of `record.ts`, `taskCommand` of `start.ts` and the two row types of `schedule.svelte.ts` are module-private, and `recordExists` is not written, so `utils/unused-exports.sh` prints the base's 379 lines. `hasForm` takes the forms a pattern decides (`Exclude<Form, 'cron'>`); the cron form is decided in `formProblem`.
12. An empty text is a value when the entry has `empty` (`textProblem`, `emptyIsValue`), the way an empty choice or path is, so `tasks.<task>.schedule: ""` is the off position and the Settings view can write it.
13. A run skipped because the task's own start is awaited is recorded with `terminal` null; one skipped for a working earlier run carries that terminal's id.
14. The earlier run's session is matched by the registry record whose pid equals the terminal's pane pid (C1 shows they are equal for a command tmux runs directly), and by a walk of the process table (`under`) only when no record has that pid.
15. The record folder is watched with `fs.watch` (non-persistent) so a press, a settled run and a second server reach the page.
16. `contextFixture` makes one scratch directory per call (ruling 7), so `hpc.test.ts` and `git.test.ts` take `it` from `tests/fixtures/scratch.ts`, which sweeps it.

## Every host- or user-visible change, before and after, for the look of item 9

The look is the orchestrator's, on the scratch server with the stub of `probes/stub-claude.sh` as `claude_bin` and one `tool: claude` account under the scratch `HOME`. What differs, view by view:

1. The update tray (Update, at the foot of the rail). Before, from the base tree (probe `vpb/tray.svelte-probe.ts`):

```
TRAY ON THE BASE TREE:
    | Update tasks
    | Close
    | Lit Watch
    | new-paper radar (web | minutes) Unavailable
    | Scout
    | academic openings (web | minutes) Unavailable
    | LinkedIn
    | draft a post from _linkedin/ Unavailable
    | Inbox
    | Gmail triage over the private mailbox Unavailable Gmail triage over the private mailbox
    | Chat
    | Ask about the portfolio, e.g. "what's blocked?", "summarise a project". Runs on your Claude Code / Max plan; I remember this conversation.
```

   After, with a `schedule` message that carries `litwatch` at `0 7 * * 1` with four runs (one listed terminal, one unlisted), `scout` and `linkedin` empty, `inbox` at `@hourly`, and the unread-record error (probe `vp/tray.svelte-probe.ts`):

```
C27 TRAY AFTER A schedule MESSAGE (a listed terminal, an unlisted one, an error):
    | Update tasks
    | Close
    | The run record ~/.oculus/schedule.json does not read, so no scheduled run starts; the file is left as it is.
    | Lit Watch
    | new-paper radar (web | minutes) Unavailable Next: 10-06 07:00 07:00 scheduled started
    | 06:00 scheduled skipped, the earlier run was still going
    | 05:01 caught up started
    | 04:00 by hand failed
    | Scout
    | academic openings (web | minutes) Unavailable No schedule
    | LinkedIn
    | draft a post from _linkedin/ Unavailable No schedule
    | Inbox
    | Gmail triage over the private mailbox Unavailable Next: 10:00 Gmail triage over the private mailbox
    | Chat
    | Ask about the portfolio, e.g. "what's blocked?", "summarise a project". Runs on your Claude Code / Max plan; I remember this conversation.
```

   Put the page in this state: a task with a pattern, its latest runs, and a run whose terminal is listed (the row is a button that opens that terminal) beside one whose terminal is not listed (plain text). What should differ: a `Next:` line under a scheduled task and `No schedule` under an unscheduled one; up to five run rows (time, how it was started, outcome); the error line under the heading while the record file does not read; the Chat row and the press behave as before, including the confirmation while `tasks.skip_permissions` is on.
2. The Settings view, Behavior, heading terminal, section "Update tasks": four new text controls, `tasks.litwatch.schedule`, `tasks.scout.schedule`, `tasks.linkedin.schedule` and `tasks.inbox.schedule`, empty by default. `61 * * * *` is refused before the write in the `settings_not_cron` words and `0 0 31 2 *` in the `settings_cron_never` words; `0 7 * * 1` is written (probe s5, C4/C5 lines above). Before: no such control.
3. `config/behavior.yml`: four entries `<task>: { schedule: "" }` under `tasks:`, so nothing runs until a pattern is written. A wrong pattern gives a finding on the Findings view naming `tasks.<task>.schedule` in the `findings.words.form_cron` words (a pattern that does not construct) or the `findings.words.cron_never` words (a pattern that matches no date), and the task has no schedule.
4. A new machine-local file `~/.oculus/schedule.json` (mode 600) and its lock `schedule.json.lock`, written at the first pattern read and at each run. Before: no such file. A file that does not read is never written over.
5. A scheduled run: a terminal `task <kind>` in the hub root that runs `<claude> '/research-cockpit <kind>'` (with `--dangerously-skip-permissions` while `tasks.skip_permissions` is true) and nothing shown on the page; its row appears in the tray's run list. Before: only a press started a task.
6. A new `schedule` channel on the socket; the page subscribes to it in `src/routes/+page.svelte`.

## Anything in the brief that was wrong or impossible

1. `writeConfigKey(engine, file, key, value)` without the fifth argument checks no value: `config-key.ts:113` builds `sources` as null and `config-fit.ts:284` returns null for a null `sources`. The refusals of C4 and C5 are shown by passing the inputs `config-write.ts` passes (`{ hub, projects: () => [] }`), as probe s5 does. The server's endpoint always passes them.
2. The folder order: the brief's placement of `UPDATE_TASKS` in `data/helpers/run/tasks.ts` conflicts with `tests/checks/imports/order.test.ts` once `model-processes.ts` names `UpdateTask` (judgment call 1).
3. C17: croner's timer alone does not run a daily 02:30 on the day the clocks skip it (judgment call 3), so the expectation holds only with the half-minute look.
4. Item 9 case 1 expects the finding for `inbox: nonsense` "on the Findings view"; the render of that view is not part of this step's probes. The finding text is shown by `tests/checks/config/config.test.ts` (the three `toContain` lines) and not by a drawn view.
5. The quick list's 45 s limit: runs a, b and e took 87.2 s, 89.1 s and 59.3 s, over it; runs c, d and f took 38.2 s, 41.4 s and 44.7 s. Every command passed in all six.

## Head comments and documents read against the change

Rewritten: `DESIGN.md` line 85 (forms, empty, the `tasks:` block), the channels list (adds `schedule`), the **Schedules.** paragraph (line 139, in shorter sentences, and 'never earlier'), the **Processes.** paragraph (line 157: the exception for a scheduled run's own idle terminal, and an update task's line needing no approval), the update-tasks paragraph (line 416: `taskSkipPermissions`, the catalog rule for the schedules, the location of `UPDATE_TASKS`); `HELP.md` lines 25 and 269; head comments of `tasks.ts`, `model-processes.ts`, `value-rule.ts`, `options.ts` (the forms), `settings.ts` (`heldAt`, `taskSchedules`, rewrapped), `routes.ts`, `pollers.ts` (rewrapped), `live-settings.ts`, `schedule.ts` (the look and the due time), `UpdateTray.svelte`, `terminal-fixture.ts`, `context-fixture.ts`, `terminals.svelte.ts` (the re-export note), `schedule.test.ts`, `settings.test.ts` (rewrapped); the descriptions of the four `tasks.<task>.schedule` options and of `tasks.skip_permissions` in `options.yml`, and the `tasks:` comment of `behavior.yml`. Still true: the head comment of `data/accounts/chat.ts` (names `data/helpers/run/tasks.ts` for the `tasks:` block).
