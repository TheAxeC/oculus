# Brief check of O181

Base read: `git rev-parse HEAD` in `/Users/axelfaes/workspace/oculus` gives 1874e6140c8f6e012560781bf631fca6e99b47f3. Brief: `/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O181.md`. No test or page was run and no file was changed.

The six findings that stop the brief as written:

- F1. Cases 1 and 2 set `show_tabs` in a hub. A hub cannot set that key, so case 1 is false on the tree (check 4).
- F2. Verify item 6 cannot print nothing, because it matches values the step does not name (check 3).
- F3. `UpdateTask` becoming `string` leaves three four-word tables that throw or read undefined for any other word (check 1).
- F4. "the schedule left out" has no defined meaning, and the likely readings lose the problem word or the repair path (check 4).
- F5. Verify item 6, `git ls-files` and the removal of `test:quick` contradict `agents/spec.md`, which the brief says governs unchanged (check 4).
- F6. `feed_registries` with a word other than leads or radar makes a collection disappear (check 6).

## 1. Names

Commands:

```
git grep -n -E '(^|[^A-Za-z_])(UpdateTask|FeedRegistry)([^A-Za-z_]|$)' -- . ':!.scratch' ':!config/local.yml'
git grep -n -E 'UPDATE_TASKS|FEED_REGISTRIES' -- . ':!config/local.yml'
git grep -n -E 'update_tasks|feed_registries|poll_timeout_ms|format_file_name|default_agent' -- . ':!config/local.yml'
git grep -l -E 'UPDATE_TASKS|FEED_REGISTRIES|UpdateTask|FeedRegistry' -- .scratch
```

Hits outside "Paths this step writes":

| Hit | False after the change? |
|---|---|
| `docs/diagrams/writes.dot:604` and `docs/diagrams/writes.svg:2670` (`src/lib/data/index.ts:270 FEED_REGISTRI...`) | Yes. These are generated (`package.json:23`, `node utils/diagrams/diagrams.mjs`). The brief does not list them, and spec.md:26 reruns diagrams only with `test:quick`, which the brief removes. They go stale unless the landing regenerates them. |
| 18 files under `.scratch/migration/`, the list printed by the last command: `plan.md`, `choices.md`, and briefs and reviews of A3, O37, O86, O33, O78, D23b, D62, D64, Q125 | Historical records. `plan.md:1731` states the step's own words. None needs a change. |

- `update_tasks` has hits at `config/text/app.yml:322`, `config/text/desktop.yml:75`, `src/lib/shell/rail/UpdateTray.svelte:153,155` and `src/desktop/windows/menu-template.ts:343`. These are catalog keys in another namespace and stay true.
- `feed_registries`, `poll_timeout_ms`, `format_file_name` and `default_agent` have no hit outside `.scratch`.

Hits inside the write list that the brief does not name, each of which the change makes wrong unless handled:

- `src/lib/state/system/machine/schedules/schedule-words.ts:17-22` `TASK_LABELS: Record<UpdateTask, () => string>` holds the four words. `taskLabel` at :25 calls `TASK_LABELS[task]()`.
- `src/lib/shell/rail/UpdateTray.svelte:66-71` `NOTES: Record<UpdateTask, () => string>` holds the four words.
- `src/lib/state/workbench/navigation/notice-sources.ts:148-153` `TASK_VIEW: Record<UpdateTask, string>` holds the four words.
- With `UpdateTask` as `string`, each table type-checks. `grep -n noUncheckedIndexedAccess tsconfig.json .svelte-kit/tsconfig.json` prints nothing, so svelte-check stays clean and `update_tasks: [weekly]` throws at runtime in the tray.
- `config/text/app.yml:315` (`no_files`) names the four tasks and says no hub holds a task file. It is false for a hub holding the file with no `update_tasks`.
- `src/lib/data/model/index.ts:124` `feeds: ('leads' | 'radar')[]` is the literal union that receives `FEED_REGISTRIES.filter(...)`.
- `src/lib/data/index.ts:53,205` import and use `FeedRegistry`, and `:219-220` call `feedFile('leads')` and `feedFile('radar')`. The brief's line 23 names only `:270`.
- `src/lib/data/snapshot/hubs/feeds.ts:20` `KINDS` holds the words, and `src/lib/data/model/model-collections.ts:468` `FeedKind`.
- `src/lib/data/helpers/run/tasks.ts:1-5,11` and `src/lib/server/machine/runs/schedules/task.ts:1` head comments say "the four update tasks".
- `docs/HELP.md:35`, `docs/data-map.md:24`, `docs/templates.md:768,788` and `config/defaults/behavior.yml:59` also name the four words or "four". The two pages go through the report's "Doc text". The templates lines are in the write list with no requirement naming them.

Overlap with O180. Brief line 31 names three owned places. O180's write list (`O180.md:83-108`) also holds these paths inside O181's `src/**`, `config/defaults/*.yml`, `config/options/*.yml` and `docs/templates.md`:

- `src/lib/data/helpers/hub-names.ts`
- `src/lib/data/model/machine/model-machine.ts`
- `src/lib/data/model/model-entities.ts`
- `src/lib/data/sources/config/settings/files.ts`
- `src/lib/server/content/audit/publications.ts`
- `src/lib/server/machine/runs/website.ts`
- `src/lib/state/sessions/source/website.svelte.ts`

`wc -l` gives `hub-names.ts` 863 lines on main and 869 in `.agents/worktrees/migration-O180` and in `migration-O180-round-1`. Round 1 and O181 both add rows, against the 880 limit of spec.md:48.

## 2. The step line

`plan.md:1731`, mapped:

| Part of the line | Requirement |
|---|---|
| read every source file under `src/` | line 35 (the three O180 places left out, under rulings Hardcoding sweep and O180 scope) |
| remove every hardcoded value of a kind config can hold | line 37, Decision 1 |
| fallbacks go (`appearance.ts:406-407`, `pane-view.ts:418-419`, `builds.ts:419`, every other) | item 1 |
| hub's words move to the hub's config (`UPDATE_TASKS`, `FEED_REGISTRIES`, every other) | item 2 |
| fixed values get config keys (`poll.ts:330`, `latex/endpoint.ts:502`, `opening.svelte.ts:187`, every other) | item 3 |
| Built by a builder agent | "Where you work" |

No part of the line lacks a requirement. One requirement departs from the line: item 2 puts `feed_registries` with value `[leads, radar]` in `config/defaults/sources.yml`, which is oculus's config, where the line says the hub's config. Decision 4 also says a word naming one hub's content goes in the hub's file with default `[]`, so item 2 and Decision 4 disagree.

`plan.md` has no Goal line (`grep -n 'Goal\|^Gate' .scratch/migration/plan.md` gives no heading; `# Plan: migration` is followed by an intro and `## Steps`). The step line names no check.

## 3. Premises

| Line | Command | Result |
|---|---|---|
| 18 | `git ls-files src \| wc -l`; `git ls-files src \| xargs wc -l \| tail -1` | 2142; 410784. Matches. |
| 19 | `git grep -n` and `grep -n` over `appearance.ts`, `config/defaults/appearance.yml`, `config/options/appearance.yml` | :324, :327, :406, :407, yml 212 and 214, control and options. Matches, and incomplete: `appearance.ts:173-174` hold `let tabBar: TabBar = 'multiple'` and `let actionsAt: EditorActions = 'strip'`, the value before the config arrives. Item 1 does not name them. |
| 20 | `git grep` | `pane-view.ts:418-419`. Matches. |
| 21 | `git grep`, `grep -n`, read | `builds.ts:419`, `behavior.yml:389`, `latex.ts:94-98`. Matches. |
| 22 | first grep of check 1 | Matches for `UPDATE_TASKS`. Also re-exported at `src/lib/data/model/index.ts:684`. `run/schedules.ts:152` matches. |
| 23 | same | `hub-names.ts:145,152`, `data/index.ts:270`. Matches, and incomplete (check 1). |
| 24, 25, 26 | `git grep` | `poll.ts:330`, `endpoint.ts:502`, `opening.svelte.ts:187`. Match. |
| 27 | `git grep -n -F "?? ''" -- src \| wc -l` and the same form for each kind (no pattern is in the brief) | Mine: 1188 `''`, 579 `null`, 381 numbers (`\?\? *-?[0-9]`), 55 booleans, 101 words (`\?\? *'[^']`). The brief: 1170, 578, 379, 56, 92. They differ and the brief gives no command to rerun. |
| 28 | `grep -n -E '_ms:\|_s:' config/defaults/behavior.yml` | The three named suffixes exist. Matches. Also present: `autosave_ms`, `auto_build_interval_ms`, `keys_per_s`, and `timeout_seconds` at :447. |
| 29 | `ls docs/adr` | No such file or directory. Matches. |
| 30 | `sed` of `plan.md:1884,3708` | Both rulings exist. Which one governs is under "Declined to judge". |
| 31 | read of `O180.md`, `O180-round-1.md` | The three places are O180's. The claim is true and narrower than O180's write list (check 1). |

A premise of the Verify list does not hold. Line 99 expects item 6 to print nothing:

```
git grep -n -E "UPDATE_TASKS|FEED_REGISTRIES|40000|'main.tex'|\?\? *'(multiple|strip|never|claude)'" -- src
```

On the tree, outside the places the brief names, it prints:

```
src/lib/server/accounts/calendar/ics.ts:40:const MAX_STEPS = 40000;
src/lib/server/accounts/calendar/poll.ts:118:    const day = 86400000;
src/lib/server/accounts/mail/triage.ts:159:    const cutoff = now - KEEP_DAYS * 86400000;
src/lib/state/life/calendar.ts:205:    const day = 86400000;
src/lib/server/content/latex.ts:38:const FIRST = 'main.tex';
```

Three hits are the length of a day in milliseconds, matched as the substring `40000`. The check cannot pass unless those are changed.

## 4. Cases and checks

Inconsistent with the rules file or the tree:

- Case 1 (`show_tabs: none` in a hub) and case 2 (`show_tabs: 5` in a hub).
  - `show_tabs` is not in `HUB_LIST` (a `grep` of `hub-names.ts:713-796` for `show_tabs|editor_actions|latex|terminal|hpc` hits nothing but `slurm.resource`).
  - `hub-layer.ts:554-558` says a key outside the list is a finding naming the hub's file and the key and nothing of it is applied, so case 1's "as today" is false on the tree.
  - The layer that takes it is the workspace's `settings:` (`workspace-layer.ts:7,16-17`), which already refuses a bad value with a finding and leaves oculus's value standing.
  - The cases need "in a workspace's `settings:`", or `show_tabs` must join the hub list, which is a design decision.
- Case 2, "with no literal of it in `src`", contradicts Decision 1's third heading and the tree: `appearance.ts:324` keeps `'multiple'` in the `z.enum` of the type `TabBar`, and `pane-view.ts:465` and `tab-strip.ts:148` branch on it.
- Decision 2 says "A hub's value". The existing refusal is in the workspace layer; `hub-layer.ts` applies a non-vocabulary key whole. The new hub keys need the check built in `hub-layer.ts`, and no item says so.
- `feed_registries` and `update_tasks`: item 2 and the cases assume a hub sets them. Item 3 asks for the `HUB_LIST` row only for its own keys, and neither item names `src/lib/data/shapes/hub-keys.ts` `OWN_HUB_KEYS`. Without an entry there, a key set by a hub other than the primary is a finding and is not applied (`hub-layer.ts:568-571`, `primaryOnly`). Task files are per hub (`task.ts:5-7`) and `collections` is in `OWN_HUB_KEYS`, so both keys need it.
- Case "the tray lists scout alone" omits the file: `offeredTasks` (`task.ts:76-85`) lists only tasks whose `.oculus/tasks/<kind>.md` exists.
- Case "A schedule naming a task `update_tasks` lacks: ... the schedule left out".
  - "left out" has no defined meaning.
  - Rows are built with an entry and a problem, and a row with a problem does not run already (`watch.ts:610-612`).
  - If `readRuns` returns null, `readEntry` reports `runs-wrong` in place of the problem (`schedules.ts:238`).
  - If `entry` is null, Pause and Resume are refused (`file.ts:505`), the dialog no longer opens the row (`schedule.svelte.ts:593`), and the `unchosen` task path that lets the reader pick a task (`schedule.svelte.ts:596-603`) is lost.
  - The save route's check returns the first problem before it reads `entry` (`routes.ts:159-161`). The brief does not say which of these changes.
- Line 57 ("An absence value ... unchanged, and named under its heading") and line 43 ("Every kept value kind is listed by file") ask the builder to quote places the step does not change, for over 1700 absence hits by my counts above.
- Line 35 and Verify item 6 tell the builder to run `git ls-files` and `git grep`. spec.md:33 allows only `git status`, `git diff` and `git show`, naming `ls-files`, and brief line 13 only bars state-changing git.
- Line 14 and the Verify list say `npm run test:quick` is not run. spec.md:26,78 require it "At minimum" and spec.md:3 says nothing in a brief overrides the file, while brief line 5 says the rules govern unchanged. O180-round-1 did the same.
- Line 106 puts the open items and the cases' first run before the DONE / NOT DONE table. spec.md:84 puts the table directly after the first line.
- Line 56 tests collision alone. spec.md:73 also requires empty and duplicated for every key a step introduces, and a hub value reaching a shell is untrusted; `update_tasks` reaches `taskCommand` (`task.ts:110-119`).
- Line 56's "none exists" by grep will print catalog hits for `update_tasks` (check 1), so it needs "as a config key".
- Item 2 names no requirement for `docs/templates.md`, which the write list carries.

Decision 3 against the tree: `hpc.poll_timeout_ms` creates a new top-level section, while `slurm:` (`behavior.yml:84-89`) holds `poll_min` and `quota_min`. `grep -n -E '^(hpc)' config/defaults/*.yml` finds no `hpc:`. Decision 3 asks for an existing section where the value belongs. `terminal:` is in `appearance.yml:80`, so a second `terminal:` block in another file raises `defined_twice` (`merge.ts:183-190`).

## 5. The question

Goal: no hardcoded value of a kind config can hold left in `src/`.

| Item | Could pass without the goal? | Reason |
|---|---|---|
| Step line's check | No check exists | `plan.md:1731` names none. |
| Case show_tabs none | Yes | Exercises one key; `appearance.ts:173-174` can stay. |
| Case show_tabs 5 | Yes | `.catch('multiple')` left in gives the same drawing. |
| Case latex.auto_clean | Yes | Passes on the unchanged tree with `?? 'never'`. |
| Case update_tasks | Yes | Passes with `TASK_LABELS`, `NOTES`, `TASK_VIEW` still holding the words. |
| Case schedule unknown | Yes | Shows only that one task path. |
| Case feed_registries | Yes | Passes with `KINDS`, `FeedKind` and the `leads`/`radar` literals in place. |
| Case hpc timeout | Yes | Proves one value. |
| Case format | Yes | `latex.ts:38` `FIRST` can stay. |
| Case default_agent | Yes | `opening.svelte.ts:123` `agent: StartKind = 'claude'` can stay. |
| Case collision | Yes | Says nothing about remaining values. |
| Case absence | Yes | Any value called absence passes. |
| "Read so far" (line 35) | Yes | A list of folders written by the builder; nothing shows a file was read. |
| Item 1 (Verify 6) | Yes | The regex matches `?? '...'` alone: `.catch('multiple')`, `:173-174` and default parameters are missed. |
| Item 2 (Verify 6) | Yes | Only the two constant names; tables holding the same words pass. |
| Item 3 (Verify 6, new-key list) | Yes | The list holds only what was moved. An unmoved and unlisted constant is seen by nothing. |
| Kept-values list | Yes | Self-declared. Decision 1's headings hold no named limit or constant. |
| Verify 1 to 5, 7 | Yes | Pass with no change made. |

Scale for the last two: `git grep -n -E "^(export )?const [A-Z][A-Z0-9_]+ = -?[0-9]" -- src | wc -l` gives 575 numeric constants, and the same form gives 810 for text constants and 438 for lists. A named constant such as `JOIN_MAX = 8` or `HEAD_BYTES = 65536` (`latex.ts`) is under no heading of Decision 1, so by the brief every such value gets a key, an option and a default, or sits in no list. The brief states no rule for them. My judgment: only a reviewer's read of the kept list against the constants can close this, and the brief should name that list as one the reviewer checks.

## 6. Implied inputs

None is in "Cases". Each has happened or costs something if wrong, and the expected result is given.

| Input | Expected |
|---|---|
| `update_tasks: [weekly]`, a word with no label (`TASK_LABELS`, `NOTES`, `TASK_VIEW`) | No throw. A label source must be named; this is a user-visible shape the brief leaves open. |
| `update_tasks: [scout, scout]` | One row, one finding. |
| `update_tasks: ['']` | Finding, left out. |
| `update_tasks: ['../x']` | Finding; no path outside `.oculus/tasks/` and no shell word (`task.ts:58-66,110-119`). |
| `update_tasks: 5`, or a list holding a non-text | Finding, default `[]` (Decision 2). |
| Hub holds `scout.md`, no `update_tasks` | Tray lists nothing and its sentence is true (`app.yml:315` is not). |
| `update_tasks` on a hub other than the primary, two hubs with different lists | Each hub's list decides its own tasks; order stated, replacing "in the order of UPDATE_TASKS" (`task.ts:73`). |
| Schedule of an unknown task with `update_tasks: []` | Sentence stays well formed: `app.yml:258` gives "the tasks are ." with an empty `{1}`. |
| Unknown-task schedule: Pause, Resume, Delete, open the dialog | The row stays, Delete works, and the task can be chosen. |
| Any schedule while the hub's lines are not yet written at landing | Landing writes them first; otherwise every task schedule is left out. |
| `feed_registries: [foo]` with an entry `registry: foo` | Finding. On the tree, `isFeedEntry` true drops it from collections (`data/index.ts:201`) and only leads, radar and linkedin are read as feeds (`:218-222`), so the entry vanishes. |
| `feed_registries: [leads]` | Radar's entry read as a collection, or stated otherwise; `feedFile('radar')` stays at `:220`. |
| `feed_registries: [datasets]` | Finding (collides with `REGISTRY_NAMES`). |
| `feed_registries: 5` | Finding, default. |
| `terminal.default_agent: foo`, and `shell` | Finding, default. `ComposeAt.agent` is `AgentId` (claude or codex; `model-agents.ts:9`). |
| `latex.format_file_name: ''` or a value holding `/` | Finding for empty; `basename` at `endpoint.ts:502` stays. |
| `latex.auto_clean: foo` in `settings:` | Finding, default, no throw from `wordOf` (`latex.ts:96`). |
| Appearance read before the config arrives | What the strip draws, with no invented value (`appearance.ts:173-174`). |
| `hpc` timeout changed while a poll is in flight | The running poll keeps its value; the next poll takes the new one. `poll.ts:330` reads once at creation. |

## 7. ADRs

`ls docs/adr` gives "No such file or directory". There is no folder, no record, and no record the step touches.

## 8. Dictated text

Each located with `grep -n -- '<text>' .scratch/migration/agents/briefs/O181.md`.

| Text | Line | Verdict |
|---|---|---|
| `update_tasks` default `[]` | 40 | holds |
| `feed_registries` ... `[leads, radar]` in `config/defaults/sources.yml` | 40 | Breaks the brief's own Decision 4 (word naming a hub's content, default `[]`). No rule of spec.md is broken. |
| `hpc.poll_timeout_ms: 40000` | 79 | Breaks the brief's own Decision 3 (existing section where the value belongs; `slurm:` holds `poll_min`). The unit suffix holds. No rule of spec.md is broken. |
| `latex.format_file_name: main.tex` | 79 | holds |
| `terminal.default_agent: claude` | 79 | holds; its file must be `appearance.yml`, where `terminal:` is |
| `update_tasks: [litwatch, scout, linkedin, inbox]` | 79 | holds |
| `feed_registries: [leads, radar]` | 79 | as line 40 |
| "Everything in the brief is done" | 106 | holds (spec.md, Report, :84) |
| section names "Read so far", "Doc text", "Decisions" headings | 35, 43, 71, 106 | hold |
| `0 errors and 0 warnings` | 95 | holds |
| `All matched files use Prettier code style!` | 96 | holds |
| `update-task-unknown` | 51 | holds; an existing word |
| "with no literal of it in `src`" | 48 | Contradicts Decision 1's third heading (check 4). No rule of spec.md is broken. |

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O181.md` prints nothing.

## Declined to judge

- Whether ruling Hardcoding sweep replaces ruling Settings (2026-09-30), as brief line 30 reasons. The two rulings exist, and whether one replaces the other is Axel's reading, since the hub rules send a clash of rulings to him.
- Whether a builder session can read 410784 lines whole in one run. I measured the size only.
- The label source for a new task word, and whether `feed_registries` belongs in oculus's defaults or the hub's file: these are design decisions for the orchestrator or Axel.

Usage: aae22591a037e332b, claude-opus-5-5, 203183 tokens, 24 tool uses, 452 s

## Closed

- F1, cases 1 and 2: they now set `show_tabs` in a workspace's `settings:`; the words "no literal in `src`" are replaced by no `.catch` or `??` holding the default.
- F2, Verify 6: rewritten with `grep -rn` over the named constants and over `poll.ts` alone.
- F3, the three tables: `update_tasks` rows are `{ task, label, note, view }`, replacing `UPDATE_TASKS`, `TASK_LABELS`, `NOTES` and `TASK_VIEW`.
- F4, "left out": the row stays with its problem, its task the word the file holds, and Delete and choosing a task still work.
- F5: `find` replaces `git ls-files` and `grep -rn` replaces `git grep`; the report's order follows `agents/spec.md`.
- F6, `feed_registries`: a word no feed reader takes is a finding and is ignored; `FeedRegistry` becomes `FeedKind`; item 2 and Decision 4 agree on the hub's config, with `OWN_HUB_KEYS` named.
- Check 1: the O180 overlap is named in the premises and in `shared_paths`; `docs/diagrams` are regenerated by the landing's verify list; `docs/templates.md`, the head comments and `app.yml` have a requirement.
- Check 3: the `??` counts are removed; `appearance.ts:173-174` is named.
- Check 4: the invalid-value check is built in `hub-layer.ts`; "every kept value" no longer asks for absence values; empty, duplicated and path values are cases.
- Check 5: Decision 1 says a named limit, size, cadence, timeout, path, file name or program name gets a key, and the kept constants are listed for the reviewer. "Read so far" stays self-declared; the reviewer reads the diff and the kept list.
- Check 6: each implied input has a case, or falls under Decision 2.
- Check 8: `hpc.poll_timeout_ms` is now `slurm.poll_timeout_ms` and `terminal.default_agent` names `appearance.yml`; each rewritten dictated line holds against `agents/spec.md` (ASCII, one line, no history).
- Declined, the Settings ruling: the later and specific ruling Hardcoding sweep governs the values it moves, as open item 748's withdrawal records.
