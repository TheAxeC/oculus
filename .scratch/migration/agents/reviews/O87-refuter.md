# O87 refuter report

## Verification (rerun by the reviewer)

All commands were run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O87`.

1. I ran `npm run test:quick` once. I did not run `npm run diagrams` because it writes files; the staleness check stood in for it (see "Declined to judge"). Output:
```
test:quick: 28 changed file(s), from git since HEAD
test:quick: 150 test file(s)
ok      ASCII gate (1.3 s)
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (7.5 s)
ok      svelte-check (112.8 s): 1793059851589 COMPLETED 548 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (125.1 s)
ok      vitest (221.0 s): Duration  209.16s (transform 223.81s, setup 0ms, import 355.12s, tests 330.24s, environment 54.18s)
ok      vitest checks (226.6 s): Duration  214.37s (transform 168.58s, setup 0ms, import 436.87s, tests 390.01s, environment 5ms)
ok      vitest slow (272.9 s): Duration  261.34s (transform 26.15s, setup 0ms, import 189.05s, tests 827.39s, environment 10ms)
test:quick: 280.7 s; every command passed
```
   `npx vitest run tests/checks/diagrams/diagrams.test.ts --testTimeout 0` printed `Test Files  1 passed (1)` and `Tests  47 passed (47)`, so the committed diagrams match the source.

2. ASCII gate of the brief over `git diff --name-only 33780ceee`: it printed nothing, `ascii exit 0`. `LC_ALL=C grep -c '[^ -~]'` over `docs/diagrams/writes.svg` printed `0`, and over `.scratch/migration/agents/reviews/O87-report.md` it also printed `0`.

3. `grep -rn "applications_open\|education_open\|applications_sent\|grp_subtask_dl_label\|subtaskDated" src config docs tests --exclude=local.yml` printed nothing (`grep3 exit 1`). The builder's wider grep (adding `grp_followups_label|runsByKind|runHeading|kindGroups|focusWords`) printed:
```
src/lib/views/boards/focus/Tasks.svelte:102:                t('focus.tasks.grp_followups_label'),
config/text/views/boards/focus.yml:141:            grp_followups_label: Follow-ups
```

4. `grep -rn "position_stages\|teaching_stages" src config docs tests --exclude=local.yml` hits:
   - `rail-badges.svelte.ts:275,282`
   - `focus-lanes.ts:6,91,132,228,229,252,254`
   - `vocab-keys.ts:213,214`
   - `catalog-files/vocab.ts:335,336,427,433`
   - `hub-keys.ts:28,29`
   - `in-place.ts:67,68`
   - `hub-names.ts:684,685,721,722`
   - `Band.svelte:5`
   - `config/options/catalogs/vocab.yml:4,221,234`
   - `config/options/sources.yml:80,83,89`
   - `config/catalogs/vocab.yml:4,200,205`
   - `docs/templates.md:331,333,338,340`
   - `docs/HELP.md:294,538`
   - `config-folder.test.ts:232,233`
   - `hub-vocab.test.ts:162,195,196,209,212,222`

   Every place item 1 names is in that list. `docs/data-map.md` is left to the Doc text.

5. `sh utils/unused-exports.sh 2>/dev/null | diff .../O87-base/unused-exports.txt -` gave `diff exit 0`. The builder's form with `2>&1` now also prints 8 stderr lines: the script's warning that a key in the research hub's `.oculus/local.yml` is unknown. These are not export lines, and no decision rests on them.

6. `npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts tests/checks/config/config-folder.test.ts` printed `Test Files  2 passed (2)` and `Tests  47 passed | 2 skipped (49)`. The verbose run of hub-vocab alone printed `Tests  19 passed (19)`, the slow-tagged G126 rows included. G126's second file, `npx vitest run tests/data/sources/config/layers/catalogs.test.ts`, printed `Tests  7 passed (7)`.

7. Case runs. I reran the builder's case-run program, adapted, as a program fed to `node --input-type=module -` on stdin, with shims for `$state`, `$derived` and `$effect`. I ran it once against the base copy `.agents/worktrees/O87-base`, whose files equal `git show 33780ceee:<path>` under `cmp`, and once against the worktree. Every line matches the report's "First run" and "After the change" blocks. I also printed three extra probes:
```
base:      CASE X snoozed far task: snoozed [] tasks []
worktree:  CASE X snoozed far task: snoozed ["Snoozed task far (200)"] tasks []
worktree:  CASE 7 row0 findings: ["/scratch/B/.oculus/config.yml | teaching_stages.0.color | teaching_stages.0.color must be a text"] config [{"label":"Bad","color":5,"statuses":["planned"]}]
worktree:  CASE 7 row0: [{"label":"Bad","color":"","items":[{"id":"B:e14","title":"Course Planned","entry":"education","deadline":"","root":"B"}]}]
```
   A probe of two `position_stages` rows sharing one label printed:
```
findings []
union [{"label":"Open","color":"#16a34a","statuses":["active"]}]
staged [["Open",["J1"]]]
```

8. The builder's two reruns of the time-out files reproduce: `Test Files  9 passed (9)` with `Tests  126 passed | 20 skipped (146)`, and `Test Files  2 passed (2)` with `Tests  39 passed (39)`.

9. Other commands the report quotes:
   - `sed -n 696,760p src/lib/data/helpers/hub-names.ts | grep -c "key: '"` prints 51; the same over `git show 33780ceee:...` prints 49.
   - `sed -n "203,206p" .scratch/migration/orchestrator-state.md` in the main checkout shows the open-items section with no entry.
   - `wc -l` and `git diff --numstat 33780ceee` match the report's file table.

## Verdicts

Items of "What to build":
1. Two new lists of stages: **holds**. The vocab.yml lists, the shared `bandStage` zod shape, `UNION_FIELD`, `OWN_HUB_KEYS`, `HUB_LIST` with its comment, `WHOLE`, the options rows, both headers, `HELP.md:538`, the `templates.md` examples and `config-folder.test.ts` are all present (Verification 4). Findings S6 and P1 bear on its proof and report.
2. The band's three columns stack by stage: **holds**. See `stagedEntries` and `column` in `focus-lanes.ts`, the single `column` snippet in `Band.svelte`, and `jobs_sub` / `teaching_sub` in `focus.yml`. Cases 1, 3, 5, 6 and 8 rerun.
3. Applications badge: **holds**. `openCount` counts `new Set(stages.flatMap(...entry))` over `stagedEntries(selectors.collectionsOfKey(key), 'position_stages', ...)`. Cases 9 and 18 to 20 rerun.
4. Awaiting box by `deadline_met`: **holds** for every part the item names (`vocab.yml:154`, `focus.ts:626`, `filter.ts:464`, the `vocab.yml:102` comment). See finding T4 for the twin description it left out.
5. The three `focus:` keys leave: **holds**. Verification 3, case 12, and the G126 row at `hub-vocab.test.ts:160-167`.
6. Dated lines move to Tasks: **holds**. Cases 13 to 17, 23 and 24 rerun. The comments of `Ticker`, `ticker()`, `taskGroups`, `Tasks.svelte` and `CommandCenterView.svelte` are rewritten. See T1 for a head comment outside the item's list that the change makes false.
7. The documents: **holds** for every sentence the item lists, and the Doc text for `docs/data-map.md` is given. See T2 for further sentences the change makes false.

Cases:
1. **Met**: `Active[Job Active] Applied[Job Applied] count 2`. The look is for landing.
2. **Met**: Job Rejected is in no stage, and the count stays 2.
3. **Met**: `Ongoing[Course Ongoing] Planned[Course Planned] count 2`. The look is for landing.
4. **Met**: the G126 row "replaces the lists whose order is their meaning whole" passes, and the run printed `CASE 4: Open[Job Open]`. Red on the unchanged tree is judged by reading plus the base run (`key position_stages is not one the hub's settings file takes`).
5. **Met**: `Active[A active, B live]`.
6. **Met**: the positions column is empty, and `Band.svelte`'s `{#if stages.length + gone > 0}` draws no column. Teaching and funding are unchanged.
7. **Met** as the case is written: no finding for the bare row, and the finding `teaching_stages.0.color must be a text`. The test row behind it also asserts behaviour that G126 contradicts (P1).
8. **Met**: `One[Job Active] Two[Job Active] head 2`.
9. **Met**: badge 2 after the change, 1 on the base.
10. **Met**: `["App applied","App submitted"]`. The look is for landing.
11. **Met**: the G126 row at `hub-vocab.test.ts:160-167` passes.
12. **Met**: both keys give `is not an option; it is not applied` (base: `focus.nope` only), and Verification 3 is empty.
13. **Met** at unit level: the groups and order are as the brief says. The tails are read from `Tasks.svelte:40-41` (`row(line, dateTail(line))`) and the tones from `rows.ts:295`. The look is for landing.
14. **Met**.
15. **Met**.
16. **Met**: `hidden.tasks 1`, and the kept tasks list is empty.
17. **Met**.
18. **Met**: badge 2, column 2.
19. **Met**: badge 1.
20. **Met**: badge 1, and the column draws the entry twice.
21. **Met**: `["Scheme applied"]`.
22. **Met**: both the hub untick and Mine only report the application hidden.
23. **Met**: "Joint in 5" is in Deadlines only.
24. **Met** at unit level. `hasCommandRows` is false over the groups `CommandCenterView.svelte:74-79` passes; the program rebuilds those groups itself. The look on a scratch hub is for landing.

## 1. Spec

S1. **Scratch probe written without approval and not quoted.** Report, section "Changes made to files by means other than the Edit and Write tools": "`cat > $S/o87/tests/probe.test.ts <<'EOF' ...`: a heredoc that wrote a scratch probe file in the scratchpad, before the coordinator's rule; the file is gone."
- The brief says: "No script is written for this step ... other than a case-run program as spec.md allows". `spec.md:65` asks that a case-run program's source and output be quoted.
- The probe's source and output are not given, and no Rulings line approves it.
- Failure scenario: the reviewer cannot tell what the probe computed, or whether a result the step relied on came from it. It is a script under the brief's ban either way.

S2. **The case-run program itself: acceptable.** `o87case.test.ts` (source quoted at report lines 150-487) imports `TREE`, only prints, ends in `expect(true).toBe(true)`, and was deleted. It meets `spec.md:65`, and my rerun reproduces its output line for line. It is listed here only because the brief asks for a judgment.

S3. **Key checks of `spec.md:72` missing.** `spec.md:72` asks, for every key the step introduces, what the code does when it is empty, duplicated or colliding. The report states the empty case (case 6) but not a duplicate label. My probe: a hub's `position_stages` with two rows labelled `Open` gives `findings []`; the union keeps the first row only, and an `applied` entry that only the second row names is in no stage (`staged [["Open",["J1"]]]`).
- Failure scenario: a hub writes two rows with one label. The second row's entries vanish from the Positions column and the badge with no finding, while G126's text says "two rows naming one key ... are findings".
- `fund_stages` already behaves this way, so the step carries the behaviour into two more keys without stating it.

S4. **Write-range claim inaccurate (judgment calls and out-of-range writes).**
- `focus.ts:19` (removing `focusBlock` and `strings`) and `filter.ts:48` (removing `focusWords`) follow directly from item 5, which removes `focusWords`. They are changes an item asks for.
- The report says "Every other hunk is inside its range", but `git diff -U0` shows `docs/templates.md` hunk `@@ -279 +280,2 @@`, outside the listed `274-278`. Base line 279 ends the sentence item 7 calls `:276` ("names the group its lines carry."), so the change is asked for and only the claim is wrong.
- The nine judgment calls:
  - 1 (`BadgeSelectors` gains `collectionsOfKey` and `vocabOf`) and 2 (export `stagedEntries`) are asked by item 3.
  - 3 (`datedFirst` replacing `runsByKind`), 4 (undated subtasks keep their kind order) and 5 (tasks beyond the horizon are drawn) are asked by item 6 and decisions 3 and 4.
  - 6 (`HELP.md:529`) and 8 (`behavior.yml:161`) are asked by item 7.
  - 7 (`vocab.yml:3`) is a sentence item 5 makes false.
  - 9 (`npx prettier --write` on the changed files in place of `npm run format`, which is `prettier --write .` over the whole tree) applies `spec.md:49`'s "run npm run format on what you wrote".
  - None is a change outside an item.

S5. **Rows no case asks for.** `hub-vocab.test.ts:222-238` runs one `it.for` over `['fund_stages', 'position_stages', 'teaching_stages']`. Case 7 names `teaching_stages`. The `fund_stages` row tests behaviour the step does not change, and the three rows give the same outcome. `spec.md:59` asks for "one row per input that gives a different outcome".
- Failure scenario: none in behaviour. G126's table grows by two rows that prove nothing the third does not.

S6. **Brief premise clashes with G126; builder did not stop.** The brief's premise says a stage row with `color: 5` "gives the finding ... while the row is still read". G126 (`guarded.md:189`) says "a value of the wrong kind are findings naming the file and the dotted key, and oculus's entry stands". `spec.md:7` says: "Where the brief and the code's own rules disagree, stop and report the disagreement; do not pick a side." The builder wrote the brief's side into G126's test (P1) and reported "No case was found where the brief's rules give a wrong result".

## 2. Proof

P1. **A G126 row asserts the wrong-kind row is read, against G126's text.** `tests/data/sources/config/layers/hub-vocab.test.ts:234-236`:
```ts
            expect(wrong.config[key]).toEqual([
                { label: 'Running', color: 5, statuses: ['ongoing'] }
            ]);
```
- G126, whose test this file is, says "oculus's entry stands" for a value of the wrong kind. The same file asserts that for `rail_color` (`:265`) and for a map written as a list (`:323`).
- The row pins the hub's bad row as the merged value. That is the behaviour the guarded entry calls wrong, so it is a test asserting a known defect.
- My probe shows the stage is then drawn with `"color":""`.
- Failure scenario: the day the merge is fixed to let oculus's list stand on a wrong-kind row, as G126 says, this row goes red. Until then the suite is green over the divergence.

P2. **The changed `config-folder.test.ts` row has no failing line quoted from the unchanged tree.** `tests/checks/config/config-folder.test.ts:232-233` adds `'position_stages'` and `'teaching_stages'` to the `catalogs/vocab.yml` key list. `spec.md:68` asks for each changed test's failing line on the unchanged tree. The report quotes the failures for hub-vocab only.
- Failure scenario: nothing in the report shows the row fails on the base, so it cannot be told from a row that passes either way.

P3. **No before/after table of the edited assertions.** `hub-vocab.test.ts:160-167` removes these lines:
```ts
-            const stray = withHub(
-                'statuses: { applied: null }\nfocus: { applications_sent: [x] }\n'
-            );
-            expect(everything(stray)).toEqual([
-                `${FILE} | focus | key focus is not one the hub's settings file takes; it is not applied`
-            ]);
-            expect((stray.config.focus as Record<string, unknown>).applications_sent).toEqual([]);
```
- `spec.md:61` asks for every edit to an existing assertion, one row per changed line with its before and after, made from a `diff` of the test file. The report gives one sentence instead ("The old row also proved ... still proved by the row at `hub-vocab.test.ts:329-330`").
- Failure scenario: the reviewer has to rebuild from the diff which proofs left with the removed assertion.

## 3. Standards

T1. **`Focus.svelte` head comment made false.** `src/lib/views/boards/focus/Focus.svelte:18-19`:
```
    // `command_center` the command center of everything with a date, `tasks` the tasks section of
    // the open work that carries none, `quick_add` the quick add, `awaiting` the box of what is out
```
- After the change, the tasks section holds dated subtasks, due follow-ups and dated tasks, and the command center does not hold everything with a date (`spec.md:71`).
- Failure scenario: a maintainer reading `Focus.svelte` looks in `CommandCenter.svelte` for the dated subtask lines and does not find them.

T2. **Further sentences made false, not named in the report or the Doc text.**
- `config/defaults/sources.yml:31`: "`ticker:` `{ category, undated }`: the word of `ticker_categories` (config/catalogs/vocab.yml) the command center's lines of the file carry, and `undated: true` when an undated entry is open work, a task line."
- `config/options/sources.yml:109`: `help: "the command center's lines of the file; with none the file gives no lines"`.
- `config/options/sources.yml:112`: `help: the word of ticker_categories the lines carry, which decides their group, glyph and words`.
- For the file flagged `tasks`, none of its lines are command center lines now, and its category gives no group and no words (`config/catalogs/vocab.yml:212` now says "its category gives them only their glyph").
- The builder named `docs/data-map.md:34` for the same fact but not these. Two of the three are outside the write list, and the help is shown in Settings.
- Failure scenario: a user reading Settings for the tasks file's `ticker:` expects its dated tasks in a Command Center group.

T3. **Required report greps missing.**
- `spec.md:44` asks the report to quote the grep of added comment lines and test titles for history words, with each hit judged. It is absent. My grep of the added lines in `src tests config` hit only two existing long header lines in the vocab files.
- `spec.md:71` asks for each touched head comment, doc comment and docs paragraph to be listed as "still true" or "rewritten". It is absent; T1 is the miss that list would have caught.
- `spec.md:88` asks for the helper and type grep before writing `datedFirst`, `stagedEntries` and `bandStage`. It is absent. My grep finds no existing equivalent.

T4. **`deadline_met` zod description left short.** `src/lib/data/shapes/catalog-files/vocab.ts:215-217`:
```ts
    deadline_met: flag(
        "The status ends a funding entry's or another entry's own deadline, so it leaves the deadline radar, and a funding entry carrying it is listed in the Focus board's awaiting box; compared trimmed and in lower case."
    ),
```
- This is the twin of the `config/catalogs/vocab.yml:102` comment item 4 rewrote. It still names only the funding entry and is shown as the completion text in the editor.
- It is not false, but a named thing is its whole: the comment and its shape description describe one flag.
- Failure scenario: a user completing `deadline_met:` in a hub's config is not told it also lists an application in the Awaiting box.

T5. **Whole-suite command run.** The report says: "One whole-suite command ran by accident during setup: `vitest --dir` ... started the whole unit suite, which was killed before it finished". `spec.md:26` says a whole-suite command "is a finding of the review".

T6. **New HELP sentence silent on snoozed lines.** `docs/HELP.md:294`: "Due follow-ups, open subtasks and the open entries of the tasks file are lines of the Tasks section, dated or not, whatever `deadline_horizon_days` says." A snoozed subtask, follow-up or task is open but drawn in the Command Center's Snoozed group (`ticker.ts`, `asleep.push`), and no HELP sentence says so.
- Failure scenario: a user who snoozed a subtask looks for it in Tasks.

## 4. Behaviour

B1. **Unstated change to the Snoozed group.** A snoozed entry of the tasks file dated beyond `deadline_horizon_days` now appears in the Command Center's Snoozed group; before, it appeared nowhere. Probe output: base `CASE X snoozed far task: snoozed [] tasks []`; worktree `snoozed ["Snoozed task far (200)"] tasks []`.
- Cause: `ticker.ts:327` (`if (days !== null && days > horizon && !isTasks) continue;`) no longer drops the entry before the snooze check.
- The report's "Before and after" does not state it.
- Look on landing: on TEST's Focus page, a task in the tasks file dated 200 days ahead with `snooze:` set. Before, it is not drawn; after, it is a row of the Command Center's Snoozed group.

## Declined to judge

- I did not run `npm run diagrams`: it writes `docs/diagrams/*` and this review changes nothing. `tests/checks/diagrams/diagrams.test.ts` (staleness computed in memory) passed instead.
- I did not rerun the new G126 rows and the `config-folder.test.ts` row on the unchanged tree. That needs the changed test files placed in the base copy, which is a file write. I judged them by reading and by the base-tree run of the same inputs, which gives the refusal finding (`key position_stages is not one the hub's settings file takes`, and the same for `teaching_stages`). The failure lines the report quotes for hub-vocab are consistent with that.
- I did not rerun the builder's heredoc probe: its source is not in the report (S1).
- I took no looks (cases 1, 3, 10, 13 and 24, and B1): a reviewer runs no page. They are for the look on landing.
- I did not read the builder's transcript, so I have not checked whether the whole-suite run (T5) and the heredoc (S1) happened as stated or whether other commands ran. That transcript would settle it.
- I did not rerun `uptime` and the builder's time-out load figures: no decision rests on them, and my `npm run test:quick` passed with no time-out.

Reviewer usage: a362e1e25ae8483be, claude-opus-5-5, 274255 tokens, 83 tool uses, 19 min 44 s

# Repair round 1, refuted

The round closes every first-review finding it was sent, with one exception. A list holding both a repeated key and a row of the wrong kind now reports only the repeated key, which breaks G126 and round item 1 for that one input. There are also two smaller findings: the report does not give its count of `test:quick` runs, and the visible effect on five existing lists has no view-level before and after for the look. Every other item and case holds or is met on my rerun.

The commands below ran from `~/workspace/oculus/.agents/worktrees/migration-O87`. No file in the repository or in any worktree was written by me. `test:quick` runs `svelte-kit sync`, which regenerates the worktree's ignored `.svelte-kit` folder. I saved three command outputs to read them, in the session scratchpad folder `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o87r1`: `delta.txt`, `newpaths.txt` and `quick.log`. `npm run diagrams` was not run because it writes `docs/diagrams/*`; `tests/checks/diagrams/diagrams.test.ts`, which computes staleness in memory, stood in for it.

```
$ uptime   (before the first run)
load averages: 19.76 14.09 13.12
$ npm run test:quick -- --base 33780ceee          (first run)
 FAIL  |unit| tests/server/edit/config-value.test.ts > a hub's word written into the hub's settings file > deletes the row of a word the hub added once the reader removes it
Error: Test timed out in 20000ms.
 FAIL  |unit| tests/routes/edit/undo/undo.test.ts > taking a change back > writes the project of a folder of the workspace inside 'a second hub' ... 'a field of the manifest editor'
Error: Test timed out in 20000ms.
(also a 20 s time-out at tests/server/edit/config-key.test.ts:456)
 Test Files  4 failed | 34 passed (38)
      Tests  6 failed | 412 passed | 128 skipped (546)
test:quick: 558.3 s; failed: vitest, vitest slow

$ uptime   (before the second run)
load averages: 17.94 18.32 16.20
$ npm run test:quick -- --base 33780ceee          (second run, the whole list again)
test:quick: 33 changed file(s), from git since 33780ceee
test:quick: 150 test file(s)
ok      ASCII gate (1.6 s)
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (11.4 s): /Users/axelfaes/workspace/research-hub/.oculus/local.yml: ignoring unknown key(s) self
ok      svelte-check (61.4 s): 1793065446847 COMPLETED 548 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (77.1 s)
ok      vitest (173.5 s): Duration  159.59s (...)
ok      vitest checks (186.6 s): Duration  172.07s (...)
ok      vitest slow (215.4 s): Duration  201.87s (...)
test:quick: 227.1 s; every command passed

$ npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts tests/checks/config/config-folder.test.ts tests/data/sources/config/layers/catalogs.test.ts
 Test Files  3 passed (3)
      Tests  60 passed | 2 skipped (62)
$ npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts --reporter verbose
(all 25 rows passed, among them the 8 rows "words a row of '<key>' of the wrong kind and a second row naming one key, oculus's list standing" for focus_lanes, roles, fund_stages, position_stages, teaching_stages, venue_categories, venue_tiers, radar_buckets, and "reads a row of teaching_stages with no statuses")
      Tests  25 passed (25)
$ npx vitest run tests/data/shapes/catalog-files/vocab.test.ts tests/checks/diagrams/diagrams.test.ts --testTimeout 0
 Test Files  2 passed (2)
      Tests  60 passed (60)

$ ASCII gate of spec.md over the 14 files the round changed (in-place.ts, hub-layer.ts, findings.yml, hub-vocab.test.ts, Focus.svelte, config/defaults/sources.yml, config/options/sources.yml, vocab.ts, HELP.md, config/catalogs/vocab.yml, config/options/catalogs/vocab.yml, templates.md, writes.dot, writes.svg) and O87-report.md
ascii exit 0   (nothing printed)
$ grep -rn "applications_open\|education_open\|applications_sent\|grp_subtask_dl_label\|subtaskDated" src config docs tests --exclude=local.yml
grep3 exit 1   (nothing printed)
$ grep -rln "position_stages\|teaching_stages" src config docs tests --exclude=local.yml
config/catalogs/vocab.yml, config/options/catalogs/vocab.yml, config/options/sources.yml, docs/HELP.md, docs/templates.md, src/lib/data/helpers/hub-names.ts, src/lib/data/shapes/catalog-files/vocab.ts, src/lib/data/shapes/hub-keys.ts, src/lib/data/shapes/vocab-keys.ts, src/lib/data/sources/config/merge/in-place.ts, src/lib/state/boards/focus/focus-lanes.ts, src/lib/state/workbench/rail-badges/rail-badges.svelte.ts, src/lib/views/boards/focus/Band.svelte, tests/checks/config/config-folder.test.ts, tests/data/sources/config/layers/hub-vocab.test.ts
$ sh utils/unused-exports.sh 2>/dev/null | diff ../O87-base/unused-exports.txt -
unused diff exit 0

$ the round's delta: for each path of migration-O87-round-1/files.txt, cmp of the snapshot copy against the worktree's file
CHANGED: config/catalogs/vocab.yml, config/options/catalogs/vocab.yml, config/options/sources.yml, docs/HELP.md, docs/diagrams/writes.dot, docs/diagrams/writes.svg, docs/templates.md, src/lib/data/shapes/catalog-files/vocab.ts, src/lib/data/sources/config/merge/in-place.ts, tests/data/sources/config/layers/hub-vocab.test.ts
changed now but not in files.txt (read as their part of git diff 33780ceee): config/defaults/sources.yml, config/text/findings.yml, src/lib/data/sources/config/merge/hub-layer.ts, src/lib/views/boards/focus/Focus.svelte
unchanged in the round: focus-lanes.ts, ticker.ts, focus.ts, filter.ts, rail-badges.svelte.ts, Band.svelte, Tasks.svelte, CommandCenter*.svelte, rows.ts and the other files.txt paths

$ claims the report quotes, rerun:
git show 33780ceee:src/lib/data/sources/config/merge/in-place.ts | diff - ../migration-O87-round-1/src/lib/data/sources/config/merge/in-place.ts
66a67,68
>     position_stages: WHOLE,
>     teaching_stages: WHOLE,
git show 33780ceee:config/catalogs/vocab.yml | grep -c "position_stages\|teaching_stages"
0
tests/data/shapes/catalog-files/vocab.test.ts lines 79, 99, 123, 149 are the four focus_clusters row-by-row tests the report names (titles read).
History-word grep of spec.md:44 over every added line of git diff 33780ceee -- src tests config: only hits are "a word the hub's values >>no longer<< give" (4 lines), the merge's own wording, none history.

$ the round's cases and the step's cases, through node on stdin (no file written), against the worktree:
R1 ["teaching_stages.0.color | teaching_stages.0.color must be a text"] oculus true
R2 ["position_stages.1 | position_stages.1 names Open, which an earlier row names; none of the list is applied and oculus's list stands"] [{"label":"Active",...},{"label":"Applied",...}]
R3 ["venue_categories.1 | venue_categories.1 names a, which an earlier row names; none of the list is applied and oculus's list stands"] oculus true
FC wrong ["focus_clusters.0.label | focus_clusters.0.label must be a text","focus_clusters.0.layout | ..."] oculus false
lanes stage twice ["focus_lanes.1.stages | focus_lanes.1.stages is not a value this key takes"] oculus true
lanes unknown field ["focus_lanes.0.extra | key focus_lanes.0.extra is not a key this file takes"] oculus true
wrong row + removal ["position_stages.0.color | position_stages.0.color must be a text"] [{"label":"Active",...,"statuses":["active"]},{"label":"Applied",...,"statuses":[]}]
both ["position_stages.1 | position_stages.1 names Open, which an earlier row names; none of the list is applied and oculus's list stands"]
CASE 1/2 Active[Job Active] Applied[Job Applied] count 2
CASE 9 badge 2
CASE 3 Ongoing[Course Ongoing] Planned[Course Planned]
CASE 4 [] Open[Job Open]
CASE 5 Active[A active, B live]
CASE 6 [] flat[] 0 Ongoing[Course Ongoing]
CASE 7 ["teaching_stages.1.color | teaching_stages.1.color must be a text"] Ongoing[Course Ongoing] Planned[Course Planned]
CASE 8 [] One[Job Active] Two[Job Active] 2
CASE 20 badge 1
CASE 10 ["App applied","App submitted"] CASE 21 ["Scheme applied"]
CASE 12 [".../main.yml | settings.focus.nope | focus.nope is not an option; it is not applied"] [".../main.yml | settings.focus.applications_open | focus.applications_open is not an option; it is not applied"] undefined
CASE 13 followups ["P13 - Follow yesterday (-1, red)","P13 - Follow undated (undated)"] subtasks ["P13: Sub 2 ago (-2, red)","P13: Sub in 3 (3, amber)"] tasks ["Task in 5 (5, amber)","Task in 200 (200)","Task undated (undated)"]
CASE 13/14/23 overdue ["Grant past 2 (-2, red)"] deadlines ["Paper14 (10, amber)","Joint in 5 (5, amber)"] keys overdue,deadlines,tasks,venueLoad,snoozed,behind,unplaced
CASE 15 ["P15: Snoozed sub (4, amber)"] []
CASE 16 ["P16: Sub in 3 (3, amber)"] hidden.tasks 1 kept []
CASE 17 ["Task in 5 (5, amber)","Task in 200 (200)","P17 (undated)","Task undated (undated)"] []
CASE 18 badge 2 column 2
CASE 19 badge 1
CASE 22 hub ["B applied"] hidden.awaiting 1
CASE 24 drawn false ["P24 - Follow yesterday (-1, red)","P24: Sub in 3 (3, amber)"]
```

### Verdicts

Items of the step brief's "What to build", for the whole diff since 33780ceee:

- 1: holds. The 15 files of the grep above hold every registration item 1 lists. The shared row shape `bandStage` and the `STAGES` shape in `in-place.ts:66` read the three stage keys alike.
- 2: holds. Rerun cases 1, 3, 5, 6 and 8 match. `focus-lanes.ts` and `Band.svelte` are unchanged in the round (cmp against the snapshot).
- 3: holds. Rerun cases 9, 18, 19 and 20 match.
- 4: holds. Rerun cases 10, 21 and 22 match. The `deadline_met` description at `vocab.ts:215-217` now names the application in the Awaiting box.
- 5: holds. The removed-key grep prints nothing, case 12 matches, and the G126 row at `hub-vocab.test.ts:160-167` passes.
- 6: holds. Rerun cases 13 to 17, 23 and 24 match. `ticker.ts` is unchanged in the round.
- 7: holds. The `Focus.svelte:18-25` head comment, `config/defaults/sources.yml:31`, `config/options/sources.yml:110` and `:114` and the `docs/HELP.md:294` snooze sentence are rewritten. `docs/data-map.md` gets the report's Doc text, plus the extra sentence under "For the orchestrator" 3.

Cases of the step brief's "Cases":

- 1: met, rerun line `CASE 1/2`. The look is at landing.
- 2: met, rerun line `CASE 1/2`.
- 3: met, rerun line `CASE 3`. The look is at landing.
- 4: met, rerun line `CASE 4` and the passing G126 row "replaces the lists whose order is their meaning whole".
- 5: met, rerun line `CASE 5`.
- 6: met, rerun line `CASE 6`.
- 7: met as the round ruled. The finding `teaching_stages.1.color must be a text` is given and oculus's list stands. A bare row gives no finding (the passing row "reads a row of teaching_stages with no statuses").
- 8: met, rerun line `CASE 8`.
- 9: met, rerun line `CASE 9`.
- 10: met, rerun line `CASE 10`. The look is at landing.
- 11: met, the passing row at `hub-vocab.test.ts:160-167`.
- 12: met, rerun line `CASE 12`.
- 13: met, rerun line `CASE 13`. The look is at landing.
- 14: met, rerun line `CASE 13/14/23`.
- 15: met, rerun line `CASE 15`.
- 16: met, rerun line `CASE 16`.
- 17: met, rerun line `CASE 17`.
- 18: met, rerun line `CASE 18`.
- 19: met, rerun line `CASE 19`.
- 20: met, rerun lines `CASE 8` and `CASE 20`.
- 21: met, rerun line `CASE 21`.
- 22: met for the hub untick (rerun line `CASE 22`). The Mine-only half was not rerun (see "Declined to judge").
- 23: met, rerun line `CASE 13/14/23`.
- 24: met at unit level, rerun line `CASE 24`. The look on a scratch hub is at landing.

Items of the round brief:

- 1: violated for one input, finding F1 (Spec). For a list with a row of the wrong kind and no repeated key, it holds: rerun R1, the probes "lanes stage twice" and "lanes unknown field", and the 8 passing G126 rows.
- 2: holds. Rerun R2 and R3 and the 8 G126 rows. The rule lives in `layInPlace` (`in-place.ts:290-293`) for every whole list that has a `field`, so O88's `pillar_kinds` gets it by registration.
- 3: holds. `hub-vocab.test.ts:228-299` has one row per key of the round's set, each with both inputs. The failure of each row on the base is quoted in the report from a scratch copy of the base. `focus_clusters` is left out, matching the round's own list and G126's.
- 4: holds. The four sentences are rewritten, and each new sentence agrees with the code I read (`ticker.ts` snooze pushes, `focus.ts:198`, `CommandCenter.svelte`).
- 5: holds, with finding F2 on the run count. The report gives the probe account, the `templates.md:279` hunk, the failing `config-folder.test.ts` lines, the before/after table (checked against the hunk headers of `git diff 33780ceee -- hub-vocab.test.ts`), the three greps and B1.

Cases of the round brief:

- 1: met, rerun R1.
- 2: met, rerun R2.
- 3: met, rerun R3.
- 4: met, every rerun step case above.

### Findings

- **F1 (Spec): a repeated key hides the wrong-kind findings of the same list.**
  - Place: `src/lib/data/sources/config/merge/hub-layer.ts:67-69` with `src/lib/data/sources/config/merge/in-place.ts:290-293`:
    ```
    if (laid.problems.some((problem) => problem.kind === 'repeated_row')) {
        return { value: laid.value, wrong: true };
    }
    ```
    ```
    if (shape.kind === 'whole') {
        const problems = shape.field === undefined ? [] : repeatedRows(value, shape.field);
        return { value: problems.length > 0 ? oculus : value, problems };
    }
    ```
  - What is wrong: when a hub's whole list repeats a key, the value laid is oculus's list. The shape check at `hub-layer.ts:604` (`for (const issue of shapeIssues(name, own))`) therefore reads oculus's rows and never the hub's.
    - A row of the wrong kind in that same list gives no finding.
    - G126 (`guarded.md:189`) says "two rows naming one key and a value of the wrong kind are findings naming the file and the dotted key".
    - Round item 1 says such a row "gives that finding".
    - My probe: `position_stages: [ { label: Open, color: 5, statuses: [active] }, { label: Open, color: "#000000", statuses: [applied] }, { label: Third, color: "#111111", statuses: 7 } ]` prints only `["position_stages.1 | position_stages.1 names Open, ...oculus's list stands"]`. The findings for `position_stages.0.color` and `position_stages.2.statuses` are missing.
    - On the base, both wrong-kind findings were given.
    - No G126 row covers a list holding both faults.
  - Failure scenario: a hub writes that list. The user fixes the repeated label, reloads, and only then sees the two other faults, one at a time across reloads. The findings list never shows everything wrong with the file at once.
  - Verdict: round item 1 violated for this input.

- **F2 (Standards): the report does not say how many times the list ran.**
  - Place: report "Round 1", "Verification", `O87-report.md:956`: "Run once after the last change, from the worktree's root." Against that, `O87-report.md:998` ("For the orchestrator" 1): "Four tests of `tests/data/shapes/catalog-files/vocab.test.ts` ... failed in a quick-list run with `focus_clusters` under the rules".
  - What is wrong: `spec.md:26` says "The report states how many times you ran the list". The report counts only the run after the last change, and mentions an earlier run of the list in this round only in passing.
  - Failure scenario: the orchestrator books the round's runs from the report and cannot tell whether a run beyond what `spec.md:26` allows took place.
  - Verdict: none.

- **F3 (Behaviour): the change to five existing lists has no before and after for the look.**
  - Place: `src/lib/data/sources/config/merge/hub-layer.ts:604-611`:
    ```
    if (shape.kind !== 'whole' || shape.field === undefined) continue;
    applied[head] = valueAt(config, head);
    Reflect.deleteProperty(hubValues, head);
    ```
    with `in-place.ts:292`, against the report's "B1, before and after", the round's only before/after.
  - What a user sees change: a hub's `focus_lanes`, `roles`, `venue_categories`, `venue_tiers`, `radar_buckets` or `fund_stages` holding any row the shape refuses, or repeating a key, was applied with a finding on the base. It is now replaced by oculus's list.
    - Examples of a refused row: a stage held by two lanes, an unknown field, a `label` that is no text.
    - Views that change: the Focus lanes, the Role facet, the Venues sections and tiers, the Lit Watch radar buckets and the Funding column.
    - The report shows the effect only at config level (the T rows, "oculus stands false" then "true"). It names no view, state or difference for the look, as `spec.md:60` asks.
    - `grep -n "^focus_lanes\|^roles\|^venue_categories\|^venue_tiers\|^radar_buckets\|^fund_stages\|^focus_clusters" ~/workspace/research-hub/.oculus/config.yml` prints nothing, so the user's own hub is not affected today.
  - Failure scenario: a hub has `focus_lanes` with `exploring` in two lanes. On the base its own lanes are drawn on Focus with a finding. After the change, oculus's ten lanes are drawn, and the landing report has no row telling the orchestrator to expect this.
  - Verdict: none. The change is what round item 1 asks for.

### Declined to judge

- **The output filter.** The brief's "Verify before you report" says to pipe each output through the filter the rules file names. `.scratch/migration/agents/spec.md` names no output filter (a grep of "filter" in it hits nothing), so the commands ran as written and only their result lines are quoted.
- **`npm run diagrams`.** Not run, since it writes `docs/diagrams/*`. `tests/checks/diagrams/diagrams.test.ts` passed in its place.
- **The first run's red lines.** The first `test:quick` run went red only on 20 s time-outs: `config-key.test.ts:456`, `config-value.test.ts:241`, `undo.test.ts:416` and one more row in a fourth file (6 tests in 4 files), at a load average of 19.76. The whole list passed on the second run at 17.94.
- **The round's G126 rows and the `config-folder.test.ts` rows on the unchanged tree.** Not rerun, since that needs the test files copied into a base tree, which is a file write. I judged them by reading. My base read gives no `position_stages` or `teaching_stages` in `config/catalogs/vocab.yml`. The base `in-place.ts` differs from the snapshot only by the two `VOCAB_SHAPES` lines, which agrees with the quoted failures.
- **Case 22, Mine only.** The Mine-only half and B1 were not rerun. B1's code path (`ticker.ts`) is byte-identical to the snapshot the first review reran.
- **`from[path]` for a list reverted to oculus's.** `hub-layer.ts` still sets `from[path]` to the hub file, as it already did on the base for a value of the wrong kind. What Settings draws for such a key cannot be settled without a page, and a reviewer runs none.
- **G126's text at `guarded.md:189`.** It lacks `position_stages` and `teaching_stages` and says nothing of `focus_clusters` being read row by row. The brief leaves that line to the orchestrator at landing, so it is not judged as a defect of the step.
- **Whether the builder ran other commands than its report lists.** Not checked: I did not read the builder's transcript.
- **The looks.** Cases 1, 3, 10, 13 and 24 and B1 were not looked at: a reviewer runs no page.

Reviewer usage: af7af79de6701e01c, claude-opus-5-5, 260077 tokens, 67 tool uses, 27 min 44 s.

## Closed

- The first review's findings (Spec S1 to S6, Proof P1 to P3, Standards T1 to T6, Behaviour B1): sent in repair round 1 (`agents/briefs/O87-round1.md`); the review over round 1 found each closed, round item 1 aside for one input (F1 below).
- F1 (Spec), a repeated key hiding the rows of the wrong kind of the same list: fixed at landing in `src/lib/data/sources/config/merge/hub-layer.ts`, `vocabValue` marking such a list `refused` and the shape check reading the hub's own rows of it, oculus's list still standing; the new row "words each row of the wrong kind of a list two of whose rows name one key, oculus's list standing" of `tests/data/sources/config/layers/hub-vocab.test.ts`, red on the round's code, passes; the `focus_lanes` row of the round's table expects the lane finding the fix lets through. G126 in `agents/guarded.md` names it.
- F2 (Standards), the report's count of its runs: the booking states it from the builder's transcript, four runs of the verify list in round 1 where `spec.md:26` allows one after the last change and one more after a red line in a changed file; nothing the landing rests on comes from the runs before the last.
- F3 (Behaviour), the visible effect on the lists replaced whole: looked at on the scratch server, a hub's `focus_lanes` with a stage in two lanes drawing oculus's lanes with the finding `focus_lanes.1.stages is not a value this key takes`; the before and after are in the booking.
