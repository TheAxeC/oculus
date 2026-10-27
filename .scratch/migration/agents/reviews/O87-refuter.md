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
