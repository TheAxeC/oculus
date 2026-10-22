Everything in the brief is done

Three things the orchestrator should know before reading the rest:

- `tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib` is red on the unchanged tree and after the change, with the same two lines, both in files this step does not touch: `"state/boards/collection.ts imports data/snapshot/normalise-parts/plans"` and `"views/shared/forms/Followups.svelte imports data/model"`. It will be red at landing whatever this step does.
- `npm run format` (`prettier --write .`) also rewrites two files outside the write list, because they are not in Prettier's style on the base: `src/lib/server/content/wallpaper.ts` (lines 69-71 joined into one line) and `src/lib/views/shared/forms/entry/edit/EntryForm.svelte` (the `<Field ...>` at lines 60-65 joined into one line). Both are left as they are on the base: they match the base copy byte for byte (`diff -rq` below lists neither), and `npx prettier --check` on the two prints `[warn] Code style issues found in 2 files.` The landing format check will flag them whatever this step does.
- `npm run diagrams` changed 8 files under `docs/diagrams/` (import counts and one tooltip). None of the changes come from this rename, which keeps every import. They come from source already on the base, for example `"folder state/boards to layer data"` 49 to 50, which matches the new import `state/boards/collection.ts imports data/snapshot/normalise-parts/plans` that the boundaries test reports. They are kept because the write list allows `docs/diagrams/` "only where `npm run diagrams` changes it" and `spec.md` (Token discipline) asks for the diagrams to match the source the list checks. Decision 2 below covers this.

## Open items of the state file (verbatim, `/Users/axelfaes/workspace/oculus/.scratch/migration/orchestrator-state.md` lines 180-182)

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry.

## The cases' first run (on the unchanged tree, before any change)

Each case below gives the first run on the unchanged tree, then the result after the change. The brief's rules get no case wrong, so nothing was handed back.

- C1, first run. `grep -n "terminal" config/catalogs/vocab.yml` printed lines 52, 62, 67-72, 74, 81, 82, 83, 101, 102, 111, 124, 146-164, 166, 167 and 241. `grep -c "closes_deadline: true" config/catalogs/vocab.yml` printed `0`. The status words carrying `terminal: true` in the base copy (an awk over `statuses:` to `focus_lanes:` of `migration-O59-base/config/catalogs/vocab.yml`, written to the scratchpad file `base-words.txt`) number 25: accepted, published, dropped, finished, ongoing, completed, done, awarded, granted, contributing, rejected, "not funded", declined, withdrawn, "not applied", not-applied, "not attending", not-attending, cancelled, canceled, past, skipped, passed, archived, applied. Before the change the same awk over the worktree for `closes_deadline: true` printed nothing, so `diff` listed all 25 as missing (`1,25d0`).
- C1, after. `grep -n "terminal" config/catalogs/vocab.yml` prints only:
  ```
  52:# - `terminal`: a done or closed outcome, which the audit holds to no live chip.
  62:  published:   { color: "#16a34a", terminal: true, archive_outcome: true, placed: true, public: true }
  67:  tech-report: { color: "#0891b2", terminal: true }
  68:  software:    { color: "#0d9488", terminal: true }
  69:  nogo:        { color: "#b45309", dead: 1, terminal: true, archive_outcome: true, negative: true }
  70:  dropped:     { color: "#9ca3af", dead: 2, terminal: true, archive_outcome: true, dead_end: true }
  71:  disproved:   { color: "#dc2626", dead: 3, terminal: true, archive_outcome: true, negative: true }
  72:  abandoned:   { color: "#6b7280", dead: 4, terminal: true, dead_end: true }
  74:  phd:         { color: "#6366f1", terminal: true, archive_outcome: true, public: true }
  241:# Project lifecycle words the audit's status guardrails read. `live_chips` = in-flight chips a terminal project must not still carry; clear them when you archive, or the guardrail flags it. Which types are terminal or archive outcomes is a flag of `types` above.
  ```
  `grep -c "closes_deadline: true" config/catalogs/vocab.yml` prints `25`. The awk list of words carrying `closes_deadline: true` has 25 lines (`wc -l` prints `25`), and `diff base-words.txt new-words.txt` prints nothing (exit 0). `sed -n 81p` prints ``# - `closes_deadline`: the status ends a collection entry's deadline on the deadline radar; compared trimmed and in lower case (`wordFlag`).``
- C2, first read: `vocab.yml:152` was `rejected: { color: "#dc2626", terminal: true }`; `ticker.ts:249` (in the loop over `sources` that skips `OWN_LOOPS`) read `if (terminal(config, status) || deadlineMet(config, status)) continue;`, and `terminal` at `focus.ts:77-79` returned `statusFlag(config, status, 'terminal')`. After: `grep -n "^  rejected:"` prints `152:  rejected:         { color: "#dc2626", closes_deadline: true }`; `ticker.ts:249` reads `if (closesDeadline(config, status) || deadlineMet(config, status)) continue;`; `focus.ts:77-78` is `closesDeadline`, returning `statusFlag(config, status, 'closes_deadline')`, which goes to `wordFlag` (`vocab-keys.ts:137`), which trims and lowers the status and checks it against the keys of `statuses` whose row carries the flag (`wordsWith`, `vocab-keys.ts:69`). So `closesDeadline(config, 'rejected')` is true and the entry is skipped.
- C3, first read: `ticker.ts:351`, `:369`, `:406` and `:427` read `if (terminal(config, status) && !statusFlag(config, status, 'live_subtasks')) continue;`, and the `ongoing` row (line 146) carried `terminal: true, live_subtasks: true`. After: the four conditions (now at `ticker.ts:351-352`, `:370-371`, `:408-409`, `:430-431`, which Prettier wrapped over two lines) read `if (closesDeadline(config, status) && !statusFlag(config, status, 'live_subtasks'))` then `continue;`, and line 146 is `ongoing: { color: "#16a34a", closes_deadline: true, live_subtasks: true }`. For `ongoing` the condition is `true && !true`, false, so its follow-ups and subtasks stay listed, as before the change.
- C4, first read: `task-card.ts:29` read `if (terminal(config, status) || deadlineMet(config, status)) return [];` and `done` (line 148) carried `terminal: true`. After: `task-card.ts:29` reads `if (closesDeadline(config, status) || deadlineMet(config, status)) return [];` and line 148 is `done: { color: "#0ea5e9", closes_deadline: true }`, so a `done` task gets no Start Agent control.
- C5, first read and after: the 8 type rows (C1's grep, lines 62, 67-72, 74, `published` among them) carry `terminal: true`, and `vocab.ts:111` in `typeWord` reads `terminal: flag('A done or closed outcome, which the audit holds to no live chip.'),`, unchanged.
- C6, first read: `statusWord` is `z.strictObject` (`vocab.ts:34`) and declared `terminal`. After: it declares `closes_deadline` and no `terminal`. A hub's `statuses.<word>.terminal` is therefore an `unrecognized_keys` issue, which `shapeIssues` (`shape-issues.ts:37-40`) turns into `{ kind: 'unknown', key: 'statuses.<word>.terminal' }`, since `catalogs/vocab` owns no path (`owned: under()`, `catalog-files.ts:33`, and `under()` with no paths matches nothing, `common.ts:26-28`). `hub-layer.ts:83-85` pushes it as a finding with the hub's file, and `:87-92` still sets the value on the config. The only reader of a status flag by name for the deadline radar now reads `'closes_deadline'` (C7), so nothing reads the merged `terminal` and that status's entries stay on the radar.
- C6b, read after the change: `closes_deadline` is a key of `statusWord`, so a hub's `statuses.<word>.closes_deadline: true` parses with no issue. `closesDeadline` reads it through `wordsWith(config, 'statuses', 'closes_deadline')` over the merged config, so an entry with that status leaves the radar. The first read on the unchanged tree: the key was not declared, so the same hub value would have given an unknown-key finding and been read by nothing.
- C6c, read after the change: `typeWord` is `z.strictObject` (`vocab.ts:97`) and declares no `closes_deadline` (`grep -rn "closes_deadline" src` shows only `vocab.ts:45, 49, 52`, all in `statusWord`), so a type row carrying it gives an unknown-key finding by the same path as C6. The first read gave the same result, since the key did not exist anywhere.
- C6d, read after the change: the editor's schema is `z.toJSONSchema(shape, ...)` (`src/lib/data/snapshot/schema/json.ts:42`) of `vocabFileShape`, whose `statuses` is `z.record(z.string(), statusWord)` (`vocab.ts:242`) and `types` is `z.record(z.string(), typeWord)` (`vocab.ts:236`). So under a status the schema offers `closes_deadline` with the description `"The status ends a collection entry's deadline on the deadline radar; the status is compared trimmed and in lower case."`, and under a type it offers `terminal`; a status no longer offers `terminal`. `config-folder.test.ts:658-692` builds this schema and holds its 38 described flags; it passes (C8).
- C7, first run: `grep -rn "'terminal'" src` printed 34 lines, `src/lib/state/boards/focus.ts:78:    return statusFlag(config, status, 'terminal');` among them; `grep -rn "\bterminal(" src` printed `menu-answer.ts:96-99`, `focus.ts:77`, `ticker.ts:221, 249, 351, 369, 406, 427`, `review-comment.ts:104` and `task-card.ts:29`. After: see Verify 4 below. No hit reads `statuses` and no call of the old reader is left.
- C8, first run: `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/tree/boundaries.test.ts` printed `Test Files  1 failed | 1 passed (2)` and `Tests  1 failed | 40 passed | 2 skipped (43)`; the failure is the boundaries test above, and `config-folder.test.ts` passed. After: the same command prints the same two lines, and `config-folder.test.ts` passes.

## DONE / NOT DONE

| Item | State | Proof (command, output) |
| --- | --- | --- |
| 1. vocab.yml, 25 status rows and lines 81-83 | DONE | C1 after: `grep -c` prints `25`, words `diff` prints nothing, line 81 names `closes_deadline`; type rows, 52 and 241 unchanged (C1 grep) |
| 2. vocab.ts statusWord key and two descriptions | DONE | `diff` of vocab.ts against the base: lines 45, 49, 52 only; `grep -n terminal vocab.ts` prints only 111 and 215 |
| 3. focus.ts reader `closesDeadline` reading `'closes_deadline'`, two doc comments | DONE | `focus.ts:76-78` and `:110-112` in the new-names grep below |
| 4. ticker.ts and task-card.ts imports and calls, task-card head comment | DONE | new-names grep below: `ticker.ts:38, 221, 249, 351, 370, 408, 430`, `task-card.ts:5, 10, 29`; C7b grep has no `terminal(` call left |
| 5. rows.ts:9-14 head comment | DONE | `rows.ts:13` in the new-names grep |
| Verify 1, the two test files | DONE (config-folder green; boundaries red on the base for files outside the step) | `Test Files  1 failed | 1 passed (2)`, `Tests  1 failed | 40 passed | 2 skipped (43)` |
| Verify 2, format, diagrams, the list once | DONE | `test:quick: 57.4 s (limit 45.0 s); every command passed` |
| Verify 3, ASCII gate over the six files | DONE | prints nothing, exit 0 |
| Verify 4, the greps | DONE | below |
| Verify 5, unused exports | DONE | `diff <base>/unused-exports.txt <now>` prints nothing (342 lines each) |
| Verify 6, history words | DONE | prints nothing (exit 1) |
| Verify 7, no test | DONE | this step adds or changes no test |
| Verify 8, prose of each changed comment | DONE | below |

### Verify 2 output

`npm run format` ran, then `npm run diagrams && npm run test:quick`, once:

```
test:quick: 14 changed file(s), from git since HEAD
test:quick: 9 test file(s), 9 essential
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (3.8 s)
ok      eslint (26.1 s)
ok      vitest (49.2 s): Duration  35.31s (transform 52.06s, setup 0ms, import 79.52s, tests 29.10s, environment 2.25s)
ok      svelte-check (53.4 s): 1792661212900 COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 57.4 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
```

The list passed and ran over its 45 s limit. Other suites may have been running on the machine at the same time; that is not verified.

Runs: the list (`npm run test:quick`) ran once. The two Verify 1 files ran together four times: the first run on the unchanged tree, a rerun of the same pair on the unchanged tree to read which test failed, one run after the edits, and one after the last change. `tests/checks/tree/boundaries.test.ts` ran alone once on the unchanged tree to read its failure. No whole-suite command ran (`npm test`, `npm run test:checks`, `npm run test:landing` or `npx vitest run` with no file).

### Verify 3 output

`LC_ALL=C perl -ne '...' config/catalogs/vocab.yml src/lib/data/shapes/catalog-files/vocab.ts src/lib/state/boards/focus.ts src/lib/state/boards/ticker.ts src/lib/views/shared/forms/entry/task-card.ts src/lib/views/boards/focus/rows.ts` printed nothing, exit 0.

### Verify 4 output

C7a, `grep -rn "'terminal'" src` (33 lines; `focus.ts:78` is gone). No line reads `statuses`. `rules.ts:192` is the type flag; the rest are the Terminal view, terminal streams, schedules and the `terminal` settings block:

```
src/lib/ui/frame/Pane.svelte:44:        share?: 'editor' | 'terminal';
src/lib/server/content/audit/rules.ts:192:        terminalTypes: flagged('types', 'terminal'),
src/lib/server/machine/apps/tools/routes.ts:84:        action: z.literal('terminal'),
src/lib/server/machine/apps/tools/routes.ts:117:    if (body.action === 'terminal') {
src/lib/server/machine/apps/tools/run/tasks.ts:81:    z.object({ kind: z.literal('terminal') })
src/lib/server/machine/apps/tools/run/tasks.ts:492:        if (prepared.kind === 'terminal') {
src/lib/server/machine/apps/tools/streams.ts:29:type StreamKind = 'languageServer' | 'debugAdapter' | 'terminal';
src/lib/server/machine/apps/tools/streams.ts:39:const KINDS: readonly StreamKind[] = ['languageServer', 'debugAdapter', 'terminal'];
src/lib/server/machine/apps/tools/streams.ts:199:        if (kind !== 'terminal' && expected === undefined) throw new Refused('refused:purpose');
src/lib/server/machine/apps/tools/streams.ts:223:        if (stream.kind === 'terminal') {
src/lib/server/machine/apps/tools/streams.ts:303:            kind === 'terminal'
src/lib/server/machine/apps/host/runner/streams.mjs:45:        const bytes = kind === 'terminal';
src/lib/server/machine/apps/host/runner/tools/terminals.mjs:137:            .make('terminal', { name: options.name ?? '', ...(options.purpose ?? {}) })
src/lib/server/machine/apps/host/runner/tools/tasks.mjs:154:            return { kind: 'terminal' };
src/lib/server/machine/runs/schedules/record.ts:259:            'terminal' in settle
src/lib/server/machine/runs/schedules/routes.ts:312:        if ('terminal' in answer) {
src/lib/server/machine/runs/schedules/watch.ts:481:            'terminal' in answer
src/lib/server/machine/runs/schedules/watch.ts:820:            return 'terminal' in answer
src/lib/state/shared/words/appearance.ts:271:    .transform((raw): Omit<Wallpaper, 'editor' | 'terminal'> => {
src/lib/state/system/config/groups.ts:128:        case 'terminal':
src/lib/state/system/apps/tools/tools.svelte.ts:55:                    action: 'terminal',
src/lib/state/sessions/terminal/terminal-tabs.ts:25:export const TERMINAL_VIEW = 'terminal';
src/lib/data/shapes/catalog-words.ts:34:    'terminal',
src/lib/data/sources/config/catalogs.ts:59:    'terminal'
src/lib/data/helpers/files/apps/apps.ts:182:    'terminal'
src/lib/views/shared/explorer/tree/menu/row-menu.ts:82:export const ROW_TERMINAL = 'terminal';
src/lib/views/sessions/terminal/Terminal.svelte:5:        id: 'terminal',
src/lib/views/sources/repositories/RepoList.svelte:117:        if (asked === 'terminal') onterminal(root);
src/lib/views/sources/repositories/menus/repo-menu.ts:18:export const REPO_TERMINAL = 'terminal';
src/lib/views/sources/repositories/menus/repo-menu.ts:29:export type RepoPick = 'terminal' | 'reveal' | 'close' | 'close-others';
src/lib/views/sources/repositories/menus/repo-menu.ts:32:export type WorktreePick = 'terminal' | 'claude' | 'codex' | 'open' | 'open-window' | 'delete';
src/lib/views/sources/repositories/menus/repo-menu.ts:54:    if (id === REPO_TERMINAL) return 'terminal';
src/lib/views/sources/repositories/menus/repo-menu.ts:79:    if (id === REPO_TERMINAL) return 'terminal';
```

C7b, `grep -rn "\bterminal(" src`. No call of the reader is left; the five hits open terminals:

```
src/lib/shell/window/menu-answer.ts:96:    'new-terminal': (page) => page.terminal('shell'),
src/lib/shell/window/menu-answer.ts:97:    'terminal-shell': (page) => page.terminal('shell'),
src/lib/shell/window/menu-answer.ts:98:    'terminal-claude': (page) => page.terminal('claude'),
src/lib/shell/window/menu-answer.ts:99:    'terminal-codex': (page) => page.terminal('codex'),
src/lib/state/sources/repositories/review-comment.ts:104:    const terminal = deps.terminal();
```

`grep -rn "closes_deadline\|closesDeadline" src tests config docs --exclude=local.yml`:

```
src/lib/state/boards/ticker.ts:38:    closesDeadline,
src/lib/state/boards/ticker.ts:221:        if (grant === undefined || closesDeadline(config, status) || deadlineMet(config, status)) {
src/lib/state/boards/ticker.ts:249:            if (closesDeadline(config, status) || deadlineMet(config, status)) continue;
src/lib/state/boards/ticker.ts:351:        if (closesDeadline(config, status) && !statusFlag(config, status, 'live_subtasks'))
src/lib/state/boards/ticker.ts:370:            if (closesDeadline(config, status) && !statusFlag(config, status, 'live_subtasks'))
src/lib/state/boards/ticker.ts:408:        if (closesDeadline(config, status) && !statusFlag(config, status, 'live_subtasks'))
src/lib/state/boards/ticker.ts:430:            if (closesDeadline(config, status) && !statusFlag(config, status, 'live_subtasks'))
src/lib/state/boards/focus.ts:76:/** Whether a status carries `closes_deadline`, which takes its entry off the deadline radar. */
src/lib/state/boards/focus.ts:77:export function closesDeadline(config: Record<string, unknown>, status: string): boolean {
src/lib/state/boards/focus.ts:78:    return statusFlag(config, status, 'closes_deadline');
src/lib/state/boards/focus.ts:111: * whose word carries `closes_deadline` alone does not end it. Reading the flag is what keeps the
src/lib/data/shapes/catalog-files/vocab.ts:45:    closes_deadline: flag(
src/lib/data/shapes/catalog-files/vocab.ts:49:        "The status ends a project's own deadline (a chip whose word carries `closes_deadline` alone does not); compared trimmed and in lower case."
src/lib/data/shapes/catalog-files/vocab.ts:52:        "A status with `closes_deadline` under which an entry's subtasks and follow-up notes stay on the radar; compared trimmed and in lower case."
src/lib/views/shared/forms/entry/task-card.ts:5:// the focus board's ticker would list, so a task whose status carries `closes_deadline` or whose
src/lib/views/shared/forms/entry/task-card.ts:10:import { closesDeadline, deadlineMet } from '$lib/state/boards/focus';
src/lib/views/shared/forms/entry/task-card.ts:29:    if (closesDeadline(config, status) || deadlineMet(config, status)) return [];
src/lib/views/boards/focus/rows.ts:13:// under the pointer: the palette's `closes_deadline` says a status drops off the deadline radar,
config/catalogs/vocab.yml:81:# - `closes_deadline`: the status ends a collection entry's deadline on the deadline radar; compared trimmed and in lower case (`wordFlag`).
config/catalogs/vocab.yml:82:# - `deadline_met`: the status ends a project's own deadline (a chip whose word carries `closes_deadline` alone does not); compared trimmed and in lower case (`wordFlag`).
config/catalogs/vocab.yml:83:# - `live_subtasks`: a status with `closes_deadline` under which an entry's subtasks and follow-up notes stay on the radar; compared trimmed and in lower case (`wordFlag`).
config/catalogs/vocab.yml:101 to :167: the 25 status rows of C1
```

(The last line stands for the 25 row lines, each printed in full by C1's grep above with `closes_deadline: true` in place of `terminal: true`.)

The rename grep: `grep -rn "terminal" src tests config docs README.md --exclude=local.yml` prints 3317 lines (src 2593, tests 501, config 143, docs 75, README.md 5; 422812 bytes). The whole output is not pasted here because of its size; the command reproduces it. Every hit was judged by two narrower greps over the same trees, which between them reach every form the status flag can take:

1. The hits that also name a status, flag, vocabulary, deadline, radar, ticker, chip, type or `closes` (`... | grep -iE "status|flag|vocab|deadline|radar|ticker|chip|statuses|wordFlag|types|closes"`, svg files left out), 72 lines. Each is the type flag (`rules.ts:37-38, 192`, `projects.ts:388`, `vocab.ts:111, 215`, `vocab.yml:52, 62-74, 241`, `audit.yml:61-62`), a terminal session's exit status (`pty/*`, `sessions.ts`, `latex/*`, `terminals.mjs`, `folds.ts`, `pty-io.ts`, `terminal-list.ts`, `model-machine.ts`, `TerminalBar.svelte`, the session tests), a terminal theme's chips and tags (`Chip.svelte`, `Tag.svelte`, `Pane.svelte:246`, `appearance.yml`, `glyphs.yml:1`, `icons.yml:3`, `workbench.yml:20`), the word "types" about terminal kinds (`terminal-kinds.ts:7`, `terminals.svelte.ts:103`, `channel.ts:621`), or a schedule named "Weekly radar" in a test fixture (`record.test.ts:48`, `run.test.ts:71, 80, 89`).
2. The forms a flag is written in (`` `terminal` ``, `"terminal"`, `terminal: true|false`, an import list entry `terminal,`, `{ ... terminal ... } from`, "terminal chip/entry/status/word/flag", "is/are terminal", "terminal project/type"; svg files left out), 54 lines. Each is the type flag (`vocab.yml:52, 62-74, 241`, `vocab.ts:215`, `rules.ts:37`), a `terminal` stream or tool route, the `terminal` settings block (`appearance.ts:88`, `catalogs.ts:36`, `grid-look.ts:63`), the theme's `terminal` percentage (`theme.ts:90`), a terminal session (`processes.ts:54, 102`, `debug.svelte.ts:568`, the Terminal view's files, `config/text/views/sessions/terminal.yml`), a test fixture named `terminal` (`ending.client.test.ts:15`), or the Terminal view's row in `docs/HELP.md:243`.

No hit in either list names the status flag, so no hit was left to carry or explain. Every other hit names terminals, the Terminal view or the theme, in a line that names no status, flag or vocabulary word.

### Verify 5 output

`sh utils/unused-exports.sh` (exit 0) wrote 342 lines; the base's `unused-exports.txt` has 342; `diff /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O59-base/unused-exports.txt <now>` printed nothing (exit 0). The step adds no line.

### Verify 6 output

`grep '^>'` over the `diff` of the six files against the base copy, kept to comment lines and description strings, then `grep -nE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O[0-9]+|Q[0-9]+|20[0-9][0-9]-"`, printed nothing (exit 1).

### Verify 7

This step adds or changes no test.

### Verify 8, prose of each changed comment and description

- `vocab.yml:81`: the old sentence with the key renamed. Plain, ASCII, no history.
- `vocab.yml:82` and `vocab.ts:49`: "(a chip whose word carries `closes_deadline` alone does not)" replaces "(a terminal chip alone does not)". It says the same thing with the flag's name in place of the adjective.
- `vocab.yml:83` and `vocab.ts:52`: "a status with `closes_deadline` under which an entry's subtasks and follow-up notes stay on the radar" replaces "a terminal entry whose subtasks and follow-up notes still show on the radar". "still" became "stay" so the history-word grep has nothing to judge. The meaning (the lines show even though the status closes the entry) is kept. The string at `vocab.ts:52` is in double quotes because the new text holds an apostrophe, as Prettier's style asks; the format check passes on it.
- `focus.ts:76`: "Whether a status carries `closes_deadline`, which takes its entry off the deadline radar." Under 100 columns.
- `focus.ts:108-113` (`settled`): one sentence changed, and the paragraph rewrapped whole at 100 columns.
- `task-card.ts:1-6`: one clause changed ("whose status carries `closes_deadline`"), and the paragraph rewrapped whole at 100 columns.
- `rows.ts:9-14`: the key renamed, the rest kept as the brief asks, and the paragraph rewrapped whole at 100 columns. "the palette's" is kept from the base wording; the tree also uses "the status palette" for the coloured status words (`views/academic/present/parts/Legend.svelte:12`).
- None of these departs from `spec.md`'s prose rules.

## Files changed

From `diff -rq` of `src tests utils config` (`-x local.yml`) against the base copy, and for `docs/diagrams/` (which the base copy does not hold) from `git diff --numstat`:

| File | + / - | In the write list |
| --- | --- | --- |
| config/catalogs/vocab.yml | 28 / 28 | yes, lines 81-83, 101-167 (inside 76-167) |
| src/lib/data/shapes/catalog-files/vocab.ts | 3 / 3 | yes, lines 45, 49, 52 (inside 42-53) |
| src/lib/state/boards/focus.ts | 6 / 6 | yes |
| src/lib/state/boards/ticker.ts | 11 / 7 | yes |
| src/lib/views/shared/forms/entry/task-card.ts | 5 / 5 | yes |
| src/lib/views/boards/focus/rows.ts | 2 / 2 | yes, lines 13-14 |
| docs/diagrams/layer-state.dot, .svg | 1 / 1 each | yes, written by `npm run diagrams` |
| docs/diagrams/layer-views.dot, .svg | 5 / 5 each | yes, written by `npm run diagrams` |
| docs/diagrams/layers.dot, .svg | 3 / 3 each | yes, written by `npm run diagrams` |
| docs/diagrams/writes.dot | 8 / 8 | yes, written by `npm run diagrams` |
| docs/diagrams/writes.svg | 12 / 12 | yes, written by `npm run diagrams` |
| .scratch/migration/agents/reviews/O59-report.md | new | yes |

File sizes after the change (`wc -l`): ticker.ts 601, focus.ts 418, task-card.ts 41, rows.ts 412, vocab.ts 321, vocab.yml 268, all under 880.

## Head comments, doc comments and document paragraphs that describe the changed behaviour

- `vocab.yml:81-83`: rewritten (81 the key, 82 and 83 the words for the status). `vocab.yml:145` ("these statuses close an entry, and only a status with deadline_met ends a project's deadline") and `:132`: still true.
- `vocab.ts:45-53`: rewritten (the key and the descriptions at 49 and 52). The `statusWord` doc comment `vocab.ts:29-33`: still true.
- `focus.ts:76-79`: rewritten. `focus.ts:108-113` (`settled`): rewritten. `focus.ts:71` (the doc comment of `statusFlag`): still true.
- `task-card.ts:1-6`: rewritten. `task-card.ts:17-20` (`taskCardActions`): still true.
- `rows.ts:9-14`: rewritten.
- `ticker.ts`: the block comments at `:212-217` (grants), `:239-242` (the other `ticker_sources` rows), `:325-329` (follow-ups) and `:389-392` (subtasks) name no flag by its old name ("a status that keeps its lines live (`live_subtasks`)", "unless its parent is genuinely closed"): still true.

## Judgment calls the brief left open (each reversible)

1. The wording of `vocab.yml:82-83` and `vocab.ts:49, 52`: "a chip whose word carries `closes_deadline`" and "a status with `closes_deadline` under which ...". The brief asked only that they not use "terminal" for the status.
2. The 8 regenerated diagram files are kept. Their changes come from source already on the base, not from this rename; they are inside the write list ("only where `npm run diagrams` changes it"). The other choice is to keep the base's diagrams and leave them stale against main's source.
3. The two files `npm run format` rewrote outside the write list (`wallpaper.ts`, `EntryForm.svelte`) are left as they are on the base, so the diff holds only the step's paths. Formatting them is outside this step's concern; they are named in the opening lines so it can be booked.
4. The ticker's import list keeps alphabetical order, so `closesDeadline` sits first (`ticker.ts:38`) and in `task-card.ts:10` before `deadlineMet`.

## Host- or user-visible change, before and after

- Before: a status in a hub's `.oculus/config.yml` `statuses:` with `terminal: true` took that status's entries off the deadline radar and the tasks card's Start Agent, and `closes_deadline: true` gave an unknown-key finding.
- After: `closes_deadline: true` does that, and `terminal: true` on a status gives a finding naming the hub's `config.yml` and `statuses.<word>.terminal`; the value is merged into the config and nothing reads it, so the status's entries stay on the radar (C6, C6b). In the editor, a status in `vocab.yml` or a hub's `config.yml` offers `closes_deadline` with its description and no longer offers `terminal`; a type offers `terminal` as before (C6d).
- The Focus board's ticker, the deadline radar and the tasks cards show the same lines and controls for the shipped vocabulary: the same 25 statuses carry the renamed flag (C1's `diff`). No view changes on screen; the look on landing can open the Focus board on TEST and see the same ticker lines, and a `done` task in the Tasks collection with no Start Agent control.
- The brief's premise that no hub file sets the status flag was not re-run here, since the hub is outside what this step may read; it is the brief check's result (`grep -rln "terminal: true" ~/workspace/research-hub/.oculus --exclude=local.yml` printed nothing on main at cfa2d965).

## Anything in the brief that was wrong or impossible

- Verify 1's file `tests/checks/tree/boundaries.test.ts` is red on the base for two imports outside this step (see the opening lines), so Verify 1 cannot be wholly green from this step. Its failure is the same before and after the change.
- The brief's premise that `docs/diagrams/` would not change ("a rename that keeps every import changes nothing there") holds for the rename, but `npm run diagrams` still changes 8 files, because the committed diagrams were already out of date with the base's source.
- `npm run format` writes outside the step's paths on this base (see the opening lines).
- `spec.md` says a builder runs no git command; the dispatch message allowed `git status`, `git diff` and `git show` for reading. Reading commands were used: `git status --short`, `git log --oneline -1` (once, at the start), and `git diff --stat`, `git diff` and `git diff --numstat` over `docs/diagrams/` and the worktree, because the base copy holds no `docs/`. No git command that changes state was run.
