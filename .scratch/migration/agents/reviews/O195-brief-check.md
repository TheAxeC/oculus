# Step O195 brief check (on main at e5bf17bdc)

## 1. Names

Every name was grepped with `git grep -n ... -- . ':!config/local.yml' ':!.scratch'` or over `src tests config docs README.md`. The list below gives each hit outside the brief's "Paths this step writes" and whether the change makes it false.

- `focus.refresh_stale_days` / `staleAfter`: `git grep -n "refresh_stale_days\|staleAfter"` hits only `config/defaults/behavior.yml:113`, `config/options/behavior.yml:590,595,600,2161`, `config/text/views/system/workbench.yml:15`, `src/lib/state/feeds/feeds.ts:57,62,63,110,136,148,156` and `tests/data/sources/config/catalog/options.test.ts:230`. All of these are on the write list. It has no hit in `docs/templates.md`, although the brief says it has (see check 3).
- `stale_days` / `staleDays`: `git grep -n "stale_days\|staleDays"` finds `staleDays` already in use as a field of a project. It holds the days a manifest trails its documents: `src/lib/data/model/model-entities.ts:476`, `src/lib/data/snapshot/normalise.ts:245,269,313`, `src/lib/state/boards/focus/focus-lanes.ts:117-127`, `src/lib/state/boards/board/state.ts:93`, `src/lib/views/shared/card/project/ProjectCard.svelte:393,395`. The brief gives `HubTask` a `staleDays` that means a threshold. That is one name for two different things, a collision the brief does not check. Nothing becomes false, but the new name is ambiguous. `tests/checks/config/config.test.ts:89-122` uses `stale_days` only as a made-up defaults key and does not collide.
- `FEEDS` of feeds.ts: it has no importer (`git grep -ln "state/feeds/feeds" -- tests src` lists `CommandCenter.svelte`, `Focus.svelte` and `FeedFile.svelte`, which import other names). `src/lib/data/sources/config/settings/hub-rows.ts:36` and `src/lib/state/forms/page-entry.ts:61` (`PAGE_FEEDS`) are separate constants and are not affected.
- `refresh`: its one caller is `src/lib/views/boards/focus/CommandCenter.svelte:92`, which is on the write list. Once `staleAfter` goes, the `config` parameter of `refresh` (`feeds.ts:127`) has no use left; the brief does not say to drop it from the signature and from the call.
- `RefreshItem.feed`: read at `CommandCenter.svelte:154-157` (`refreshGlyph`) and `:254-269`. The catalog keys these lines use are `focus.command.litwatch_glyph` (`config/text/views/boards/focus.yml:57`) and `focus.command.refresh_litwatch_plain` (`focus.yml:69`). Both carry the task word `litwatch` rather than the reader word `radar`. So the write list's conditional entry ("only if its keys are named by the feed word") does apply, but the brief names neither the file nor the two keys. If they are left as they are, `src` still holds the task name in `CommandCenter.svelte:157,263`, which breaks the brief's own convention "No hub's ... task name ... left in ... src/".
- `UpdateTaskRow`: used only in `hub-rows.ts` and `task.ts:34,109`, both on the write list.
- `HubTask`: `src/lib/state/system/machine/schedules/schedule-words.ts:18` uses `Pick<HubTask, 'task' | 'hub'>`, so it is not affected. `schedule.svelte.ts:515-520` spreads each row (`{ ...pair }`), so the field passes through. `notice-sources.ts:348` reads `lastRun` only, so it is not affected. `model-machine.ts:220` is the payload type. The payload shape `src/lib/state/client/shapes/payloads.ts:76` (`tasks: listShape.nullable()`) passes rows unchanged. Two test literals typed `HubTask` will fail `npm run check` once `staleDays` is required (the type check includes `../tests/**/*.ts`, per `.svelte-kit/tsconfig.json`):
  - `tests/state/system/schedule-lines.test.ts:258-267` (in the verify list, not on the write list; it is the G13 test 'the update tasks the page offers');
  - `tests/state/workbench/navigation/notice-sources.test.ts:14-23` (on neither list).
- `offeredTasks`: its only caller is `src/lib/server/machine/runs/schedules/watch.ts:264`. No test calls it directly (`git grep -n "offeredTasks" -- tests` prints nothing).
- `website.file_header` / `fileHeader`: `tests/fixtures/hubs/website-hub.ts:226` and `:268` (the expected first lines `TEN_ROWS_CV` and `PAPERS_TEXT`) also hold the header. The brief cites only `:32-41` and `:217` of that file. `docs/data-map.md:132` and `:176` describe the key without its value and stay true.
- `website.files.*`:
  - `tests/routes/docs/audit.test.ts:384-391` holds a `SHIPPED` constant under the comment "The four paths of `website.files` as they ship". That comment becomes false. The brief names `audit.test.ts` only as a guarded test, not as a file to change.
  - `tests/routes/sessions/website.test.ts:351,354,425` hold `_data/publications.yml`, and `:58-67` hold "as ... ships it" comments.
  - `tests/state/sessions/source/website-store.test.ts` has the rows 'the shipped paths and no command' (`:48-51`) and 'a shipped path' (`:99-105`). Their titles become false.
  - `docs/data-map.md:141-144` describe the keys without values and stay true.
- `scan`: the brief does not name the fixture that relies on the shipped `side-projects` rule. `tests/fixtures/hubs/deck-hub.ts:368-420` (`orderHub`) copies the demo hub and puts five projects under `side-projects/`. Its comment at `:368` reads "a scan folder of oculus's that the demo hub leaves empty". The brief's demo `scan:` has no `side-projects` (decision 4), so `orderHub` loses all five projects unless its `ORDER_SETTINGS` gets a full `scan:` that includes `side-projects`. Its users are the deck tests (`tests/data/hubs/decks.test.ts`, `deck-globs.test.ts`).
- `scan`, comment hits: `tests/data/hubs/workspace-findings.test.ts:1-3` says "inside a hub's scan folder" about `hub/side-projects/site`, which a hub with no `scan:` no longer has.
- `scan`, other fixtures: the other demo-based fixtures (`copyHub`, `tests/data/hubs/hubs-fixture.ts:43-47`; `deck-hub.ts:255-282`) are covered by the demo's own `scan:`. A comm of the files that name project folders against the files that name `scan` lists 23 test files for the builder to check, among them `tests/routes/sessions/terminal-fixture.ts`, `tests/state/boards/board/board-rules.test.ts`, `tests/data/snapshot/tier-stage.test.ts` and `tests/routes/hubs/hub-writes.test.ts`. The brief names none of them.
- `scan`, readers outside the write list: `src/lib/data/snapshot/schema/run.ts:509` and `static.ts:82` build the manifest and deck schema globs from `config.scan`. For a hub with no `scan:`, no schema is tied to its `project.yml` files. That follows from the ruling and the brief does not mention it.
- `incoming` / LinkedIn tab:
  - No test asserts the Incoming arrangement or the LinkedIn tab (`git grep -n "incoming" -- tests` prints nothing).
  - `tests/checks/config/arrangements.test.ts:85-89` ('pins every tab the %s page names') is generic and still holds.
  - `README.md:42` ("Incoming: read your mail, position leads, LinkedIn posts and calendars.") stays loosely true, since the LinkedIn view stays in the Incoming group (`docs/HELP.md:580`, "e1-e4").
- `docs/HELP.md` and `docs/data-map.md`: no sentence about the refresh thresholds, the scan defaults or the website paths becomes false (`grep -n -i "refresh strip\|stale_days\|scan folder\|incoming"`).
- guarded.md, G139: its text says "the shipped four read through the merged defaults where a hub sets none and one key alone leaving the others shipped". Its test titles are 'a hub that sets no website.files reads the four shipped paths, from the merged shipped defaults' and 'a hub that sets one key of website.files reads it, and the shipped value of the others' (`guarded.md`, G139 Test line). All three become false. The brief never names G139, and the builder cannot edit `guarded.md`.

Findings: two test files typed `HubTask` that the brief does not list (`notice-sources.test.ts`, `schedule-lines.test.ts`); the catalog file and its two `litwatch` keys left conditional; the `orderHub` fixture's reliance on `side-projects`; audit.test.ts's "as they ship" comment; the extra header and path lines of `website-hub.ts` and `website.test.ts`; G139's text and titles; the `staleDays` name collision; the `config` parameter of `refresh` left unused.

## 2. The step line

The step line is `plan.md:1795`, read with `grep -n "^- O195" plan.md`.

- (1) `stale_days:` on a row, in `config/defaults/sources.yml` and `config/options/sources.yml` with help and a number control: served by What to build 1, bullets 1 and 2.
- (1) Read from the row by feeds.ts, a row without it getting no nudge: served by bullet 4 (and bullet 3 for the types).
- (1) `focus.refresh_stale_days` removed from behavior.yml, the options (three entries and the heading), workbench.yml and options.test.ts: served by bullet 5.
- (1) `FEEDS` and the mapping of `litwatch` to `radar` removed: served by bullet 4.
- (1) The demo hub's rows get 14/7/2 where it has such rows: served by bullet 6 (it has none).
- (1) The research hub's rows get 31/7/2 and its workspace drops the key: served by bullet 7 (hub lines).
- (1) "a hub or workspace file that still holds `focus.refresh_stale_days` is a finding of the settings check like any unknown key": not served. No item of What to build covers it; only case 7 does. Its hub-file half is already a finding today, for the whole key `focus` (see check 4).
- (1) docs and comments naming the old key: served by item 5.
- (2) `website.files` and `file_header` ship empty, their options say what empty does, and the research hub gets the paths and a header: served by item 2.
- (3) `scan:` ships empty, with its comments and its options entry: served by item 3, bullet 1.
- (3) The demo hub's own six-folder `scan:`, "so the demo hub, the tests that read it and `npm run docs:shots` draw the same projects": served by item 3, bullets 2 and 3, and case 12.
- (3) The research hub keeps its `scan:`: served by item 3, bullet 5.
- (4) The `incoming` arrangement without `linkedin`, and the research hub's workspace gets today's arrangement: served by item 4.
- "the hub lines of all four parts written at landing": served by the General section and the Hub lines of the report shape.
- "the look checks the Focus refresh strip, the Incoming page and the project boards on the research hub's data, the demo hub's boards on a scratch server": served by cases 8, 12 and 16.
- "and a written website file's path and header by reading what a write would produce, never by a write to the website": not served. No case has the builder state what the look should read for the research hub's website files (path and first line), with the hub lines in place. Case 9 is the existing tests over the fixture's values.

Findings: two parts of the step line have no requirement: the unknown-key finding as built behaviour, and the look at the research hub's website file paths and header.

## 3. Premises

- Part 1, `behavior.yml:112-116`: holds (`sed -n '105,120p'`; the key is at :113 and its comment at :112).
- Part 1, the readers grep: it does not hold for `docs/templates.md`. `git grep -n "refresh_stale_days\|staleAfter" -- . ':!config/local.yml' ':!.scratch'` prints no `docs/templates.md` line, and `grep -n "refresh_stale\|stale_days\|behavior.yml" docs/templates.md` prints only `1987:#    focus: ""`. `docs/templates.md` holds no behavior.yml template at all; its sections are `config.yml`, `local.yml`, `.gitignore`, `bookmarks.yml`, `workspaces/<name>.yml` and so on (`grep -n "^## " docs/templates.md`). What to build item 1, bullet 5 ("from `docs/templates.md`") has nothing to remove. Read list item 7 ("the blocks of `behavior.yml`, `sources.yml`") names blocks that do not exist; the website and scan blocks sit in the `config.yml` template.
- Part 1, the rest of the readers grep: the other lines hold as cited.
- `FEEDS` at `feeds.ts:21`, used only at `:38` and `:108`, with the mapping at `:136,148,156`: holds. `RefreshItem` is at `:42-47` (the brief says `:41-46`).
- `update_tasks`:
  - `sources.yml:63-64` holds.
  - `options/sources.yml:155-180` holds.
  - `updateTasks` is at `hub-rows.ts:149-185` (comment at 149, function at 156). It holds.
  - `UpdateTaskRow` is at `:38-47`. It holds.
  - `HubTask` is at `model-tasks.ts:21-37`, against the brief's `:22-35`; the offset is small.
  - `offeredTasks` is at `task.ts:118-135` and holds. The call at `CommandCenter.svelte:92` holds.
- `LAST_RUNS`: it is at `model-tasks.ts:16`, not `:15`.
- The research hub's rows, at `config.yml:30-34`: hold. The `litwatch` row is `last_run: radar`, and the others hold as stated.
- The workspace file, `research-hub.yml:62-63`, with `focus:` holding only `refresh_stale_days: { litwatch: 31 }`: holds. Today's values are 31/7/2: the workspace layer descends into `focus.refresh_stale_days` and applies only the leaf `litwatch` (`workspace-layer.ts:293-344`, where an option entry exists per leaf at `options/behavior.yml:590-604`), so `inbox: 2` and `scout: 7` come from the defaults.
- The demo's top keys: they hold (`grep -n "^[a-z_]*:"` lists `collections`, `feed_registries`, `docs`, `slurm` and `leads_fit`, and there is no `.oculus/tasks/`).
- "A key no option names is a finding: `shape-issues.ts:16`, `:39`": wrong mechanism. `shape-issues.ts:1-9` covers oculus's own catalogs and text files. A workspace file's unknown key is `findings.config.settings_unknown` (`workspace-layer.ts:336-343`; text at `config/text/findings.yml:148`). A hub file's `focus:` is refused because `focus` is no prefix of a hub-list key (`hub-layer.ts:597-620`), so its finding names `focus`, today and after the step.
- G13 covers the `update_tasks` reader through `hub-rows.test.ts` 'updateTasks': holds (`guarded.md`, G13 Test line). `refresh` has no entry: holds (`grep -n "state/feeds/feeds\|refresh strip" guarded.md` prints nothing).
- Part 2, `behavior.yml:49` and `:96-100`: hold.
- Part 2, "every other key of `website:` ships empty (`:37-95`)": false. `behavior.yml:48` ships `doi_origin: https://doi.org/`, and the comment at `:37` describes it as shipped. That is a generic address, not a hub's setting, but the premise is false, and What to build 2 ("like the rest of `website:`") rests on it.
- Part 2, the research hub's grep over `:68-170` "prints nothing": false as a command. `sed -n '68,170p' config.yml | grep -n "files:\|file_header"` prints `64:    profiles: profiles` (a substring match). The fact itself holds: no `files:` or `file_header` key.
- Part 2, readers: `files.ts:538` and `:561-566` hold. The options at `behavior.yml:104-123` and `:232-235` hold, though `website.file_header` carries no `empty: true` (an empty text passes, since `formProblem` returns null with no form, `value-rule.ts:154-158`). `publications.ts:80` holds.
- Part 2, the test list: it holds as far as it goes, but it leaves out `website-hub.ts:226,268`, `website.test.ts:351,354,425` and `audit.test.ts:384-391`.
- `docs/templates.md:498` and `:548-552`: hold. `hub-keys.ts:142` and `:151-154`: hold.
- Part 3: `sources.yml:10-17`, `:4` and `:20-21` hold. The research hub's `scan:` (`:7-22`, with `projects/umbrella` and no `projects/software`) holds. `ls tests/fixtures/hubs/demo/projects` prints `active archive coauthor ideas manuscripts software` and holds.
- The counts 43 and 35: they hold (`git grep -ln ... -- tests | wc -l` printed `43` and `35`).
- `index.ts:142`, `:225` and `:420`: hold (`scanRules` is defined at `settings/scan.ts:43`). `make.ts:17-22`, `files.yml:111` and `options/sources.yml:12-24`: hold.
- Part 4: `layout.yml:50-63` holds. `sources.yml:84-85` holds. `research-hub.yml:51-61` holds. `options/layout.yml:60-63` holds (the help is the line at :63). G54 holds.
- General: `ls docs/adr` prints "No such file or directory" (exit 1). `standards: [.scratch/migration/agents/spec.md]` (`orchestrator-state.md:11`). No step is in flight: `queue.md` says "In flight (0 of 6 slots in use): none.", and the dispatch block holds only O195's brief check.
- Line counts: `feeds.ts` 161, `hub-rows.ts` 264, `task.ts` 228, `options/sources.yml` 269, `layout.yml` 334, `website-files.test.ts` 831 and `website-hub.ts` 617 hold (`wc -l`).

Findings:
- the premise of a `docs/templates.md` mention of `refresh_stale_days`, and of behavior.yml and sources.yml template blocks, is false;
- "every other key of `website:` ships empty" is false (`doi_origin`);
- the cited grep over the research hub's website block prints a line;
- the unknown-key finding is attributed to the wrong module;
- `LAST_RUNS`, `HubTask` and `RefreshItem` line numbers are off by one or two.

## 4. Cases and checks

The test rule is in spec.md, section "What every package obeys": a test exists only as the test of a guarded.md entry, one row per input with a different outcome.

- Cases 1 to 5: they exercise `refresh`, which has no guarded entry, so they are quoted runs. That is consistent with the rule.
- Case 2: the brief never says the new field must be optional in the options entry. `checkedRows` skips a missing field only when its spec sets `empty` (`reader.ts:155`); without it, every row lacking `stale_days` gets a finding and is either dropped or, read leniently, still raises the finding. The brief says "a number control" and names neither `empty`, `whole: true` nor `min: 0`. The precedent is the `days` field at `options/layout.yml:283-287`.
- Case 5: inconsistent as written. Its second half ("the first with no `stale_days`: no inbox line") does not say what the second row holds. The rule ("one line, for the first offered task that reads it") leaves open whether a first row without `stale_days` hides a second row that has one.
- Case 6: consistent. It is a row of G13's 'updateTasks'. The brief's words "in the same way as a refused field of the row" contradict the result it asks for: a refused field today leaves the whole row unread (`reader.ts:115-124`, `row: true`). Reading the row without the field is the `lenient` path of `checkedRows` (`reader.ts:119-121`), which the brief does not name.
- Case 7: not assigned. The brief's assignment paragraph places cases 1-6 and 8-16 but not 7, and not 13. A workspace file's unknown key is a row of G13's `tests/data/sources/config/workspace-layer.test.ts`, describe 'the workspace layer of loadConfig'. A hub file's `focus:` is already a finding today (`hub-layer.ts:597-620`), and that finding names `focus`, not `focus.refresh_stale_days`.
- Case 9: points at "the existing tests", but G139's row 'a hub that sets no website.files reads the four shipped paths, from the merged shipped defaults' (`website-files.test.ts:240-247`) cannot keep "asserting what it asserts today". After the step, the shipped value is four empty texts, so either its expected value or its point changes.
- Case 9, the one-key rows: the brief's instruction that a test of "the merge of a hub's one path over the shipped ones (`website-files.test.ts:255`, `website-store.test.ts:55-63`) keeps that point over the fixture's own paths" cannot be done. A hub's one path and the fixture's own paths are in the same hub file, and the workspace layer refuses hub keys (`workspace-layer.ts:298-304`). The only layer under a hub's one key is oculus's shipped value, which is now empty.
- Case 10: "the existing refusal, and the existing test of it stays". This asks the builder to rely on a test that sets its own empty or bad path. No row covers the new default, a hub with `website.folder` and no `files:`.
- Case 13: not assigned to a test or a run. It falls under G13's `tests/data/sources/scan.test.ts`, describe 'a wrong scan or new_project_dir value'. An empty list is not a "wrong" value, though, so the row would sit oddly under that table title.
- Case 14: consistent, as existing tests run before and after.
- Cases 8, 12, 15 and 16: the orchestrator's look. Consistent.
- Removed check: What to build 1, bullet 5 says the `options.test.ts:230` assertion "goes; no new one stands in for it". That line is the only assertion in 'reads every shipped options file with no finding and every group described' that a dotted group line is read. Other dotted groups remain (`options/behavior.yml:2155`, `website.files`, and the ones after it), so a replacement keeps the point. Dropping it removes a check, which the rules file treats as a loosening. The test is in no guarded entry (`grep -n "reads every shipped options file" guarded.md` prints nothing).
- Places the brief asks to be quoted or checked that the step does not change: `shape-issues.ts:16,39`, which is not on the write list and not the mechanism (check 3), and `files.ts:538,562-565`, `publications.ts:80`, `make.ts:17-22` and `templates.test.ts`, which are read only. No case asks the builder to explain an unchanged place beyond these premises.

Findings: case 5's ambiguity; case 7's hub half cannot fail, and cases 7 and 13 are unassigned; case 9's G139 rows cannot assert what they assert today, and the "merge over the fixture's own paths" instruction cannot be done; case 10 does not cover the new default; the dropped `options.test.ts` assertion; the missing `empty` and lenient mechanism that cases 2 and 6 rest on.

## 5. The question

The goal is that oculus's shipped defaults name no hub's tasks, website files, scan folders or LinkedIn tab, that every hub that used one states it itself, and that every surface draws as it does today on the research hub and the demo hub.

- The goal itself: the demo hub's Incoming page cannot draw as today. Case 15 (and item 4) removes its LinkedIn tab, since the demo's workspace sets no `arrangements.incoming`. The brief's goal sentence contradicts its own case 15.
- Case 1: yes. The runs build `offered` by hand, so they pass while `updateTasks` or `offeredTasks` never carry `stale_days` from the YAML. No case checks that a valid `stale_days: 31` becomes `staleDays: 31`.
- Case 2: yes. It passes when the row is refused for lacking the field (no `empty`), because a dropped row also gives no nudge.
- Case 3: no.
- Case 4: no.
- Case 5: yes for its second half. "No inbox line" also holds if the inbox branch never emits.
- Case 6: no, if the row assertion includes the row read without the field.
- Case 7: yes. The hub half passes today unchanged.
- Case 8: no, with the hub lines written.
- Case 9: yes. Tests over the fixture's own values pass whether or not the shipped values were emptied.
- Case 10: yes, for the reason in check 4.
- Case 11: yes. It passes today.
- Case 12: no.
- Case 13: no.
- Case 14: yes. Adding a `scan:` makes it pass without proving the shipped list is gone.
- Case 15: no.
- Case 16: no.
- The check on the step's line (verify 6, the grep): yes.
  - It does not grep the seven scan folders; item 5 names them but verify 6 leaves them out, so a stray `projects/active` in `config/` or `docs/` passes.
  - It does not grep `litwatch` in `src`, so `CommandCenter.svelte:157,263` and its catalog keys pass.
  - Nothing checks the `linkedin` tab.
  - The convention "No hub's ... task name ... left in ... src/" has no check, and read literally it also hits the oculus glyph name `litwatch` (`Radar.svelte:146,201`, `LiteratureCard.svelte:117-195`), which the step should not touch.
- Item 1's checks: yes. A `staleDays` set to `null` in `offeredTasks` passes the type check and every quoted run.
- Item 2's checks: yes. They never read the research hub's resulting website paths or header.
- Item 3's checks: no on the demo, given the look of case 12. Yes for Make Folder a Hub: no case reads the template's new `scan: []` block.
- Item 4's checks: no.
- Item 5's checks: yes, as for verify 6 above.

Findings: cases 1, 2, 5, 7, 9, 10, 11 and 14, the verify-6 grep, and the checks of items 1, 2, 3 (Make Folder a Hub) and 5 could pass without the goal; the goal sentence contradicts case 15 for the demo hub.

## 6. Implied inputs

- Schedules and the update tray reading `HubTask`. This has happened: `schedule.svelte.ts:519` spreads each row, `payloads.ts:76` passes `tasks` unchanged, and `schedule-words.ts:18` picks `task` and `hub` only. What it implies: the two test literals at `schedule-lines.test.ts:258` and `notice-sources.test.ts:14` gain `staleDays: null`, and `npm run check` is red without it. Neither file is on the write list.
- Make Folder a Hub with an empty shipped scan. Expected result: a new hub reads no projects and gives no finding until its user sets `scan:`. Also, `new_project_dir` must lie in a scan folder (`sources.yml:20`), so any `new_project_dir` the user sets on such a hub is a finding until `scan:` is set. The brief states neither.
- The Settings view's form of `update_tasks` rows and its write of a `stale_days` value. The brief does not state it. Expected result: the form draws a number box for `stale_days` (`FieldControl.svelte:318-326`); an absent value is drawn as not set; clearing the box takes the key off the row, never writing `''` (a finding) or `0` (a nudge every day); a typed `-1` or `1.5` is refused as typed (`settings/Control.svelte:93`). Not verified: I did not read how a cleared number field of a row is written.
- A second hub of a workspace. The brief does not state it. Before the step, a second hub's rows are nudged by the merged thresholds (14/7/2 or the workspace's). After it, only rows that carry `stale_days` are nudged. Expected result: a second hub's row without `stale_days` gets no nudge, and the single inbox line takes the first offered inbox task's `stale_days`. No other folder of the research hub's workspace holds a `.oculus/config.yml` (a loop over the eight folders of `research-hub.yml:3-10` found none), so Axel's surfaces do not change.
- `docs:shots` reading the demo hub. This has happened: `utils/shots/hub.mjs:171-196` (`dropSlurm`) parses the demo config and removes only the `slurm:` block. A new top-level `scan:` block outside that block keeps its check. The shots capture the Focus page, the Projects board and the Explorer (`utils/shots/page.mjs:1-25`), not Incoming. Expected result: the same projects, and no refresh lines (the demo has no tasks).
- The `orderHub` fixture. The brief does not state it. Expected result: it sets a `scan:` that includes `side-projects` (`deck-hub.ts:368-420`), or its five projects vanish from the deck tests.
- G139's entry text and test titles. The brief does not state them. Expected result: the orchestrator rewrites G139's "the shipped four ..." clause and the two titles to the empty shipped value. A builder cannot edit `guarded.md`.
- The research hub's comment at `config.yml:29`, which names the fields of an `update_tasks` row. The brief does not state it. Expected result: the hub line adds `stale_days` to that comment, or the comment stays incomplete.
- The Career view's Write the website tip on the research hub (`career.website_tip`, built from the paths). The brief does not state it. Expected result: with the hub lines, it names `_data/data.yml`, `_data/publications.yml` and `_data/industry.yml`, as today. This is the natural place for the look the step line asks for.

Findings: two test files and the `orderHub` fixture are left out of the write list; the Settings form's clear of a number field is not stated; a second hub's change of behaviour is not stated; the G139 edits, the hub comment line and the Career tip look are not stated.

## 7. ADRs

- `ls docs/adr` prints `ls: docs/adr: No such file or directory` (exit 1). This confirms the brief.

Findings: none.

## 8. Dictated text

- The `stale_days` 31/7/2 values: found with `grep -n "stale_days\` 31"` at brief line 62. Holds. They equal today's thresholds; see check 3, the workspace layer applies the leaf only.
- The four `_data/...` paths: found with `grep -n "_data/website.yml, cv"` at brief line 68. Holds (today's `behavior.yml:97-100`).
- The header sentence "Generated by oculus from the research hub. Change the hub's files and write the website again.": brief line 23, with line 68 giving it as "today's sentence". Holds: ASCII, plain, no history.
- The demo `scan:` list: found with `grep -n "projects/ideas\`, \`projects/active"` at brief line 71. Holds as text, but see check 1 on `side-projects` and `orderHub`.
- `scan:` ships as `[]`, and the option says "a hub with no scan rule has no projects": brief line 70. Holds. The instruction "no longer call the folders a research hub's layout" is instruction text; the builder must not carry "no longer" into the comment (spec.md bans it).
- "say that oculus names none, as `new_project_dir` does": brief line 70. Holds, with one wording mismatch: `new_project_dir`'s comment says "The engine names none" (`sources.yml:20`), while `linkedin_dir` says "oculus names none" (`sources.yml:84`). The brief dictates the second form while citing the first.
- `website.file_header` and the four paths ship as `''`, and templates.md shows them as `''`: brief lines 64 and 66. Holds.
- The templates.md `scan: []` with a commented example under it: brief line 73. This partly breaks a rule. The `config.yml` template's comments are wrapped near 100 columns (`docs/templates.md:44-57`), and spec.md's "One line per paragraph or bullet in any Markdown or YAML you edit. No hard wrapping." read literally clashes with that block's form. The brief does not say which governs inside the template's code block.
- The `incoming` arrangement pins `inbox` and `leads` and the research hub gains today's arrangement: brief lines 76 and 77. Holds. Today's arrangement is `layout.yml:50-63`.
- Brief line 4, "Then, in full: `.scratch/migration/agents/spec.md` is the one standards page the configuration lists": a garbled sentence that dictates nothing to a file. Holds as instruction, but it reads as a fragment.

Findings: the `new_project_dir` wording mismatch, and the unresolved wrapping rule for the template's commented example.

## Declined to judge

- Whether `stale_days` belongs on the row at all (the ruling) and whether `doi_origin` should also ship empty: these are Axel's rulings ("Feed staleness on the task row", "No hub's settings in oculus's defaults", `plan.md:3817-3818`). The second ruling lists only `website.files` and `file_header`.
- Whether the 23 test files listed in check 1 actually read projects through the shipped `scan:`: settling it means running them on a tree with the shipped list emptied, which this check may not do. Each is named for the builder.
- How the Settings form writes a cleared number field of a row: not read in full, so not verified.

Usage: a9f9d46d8a75327c7, claude-opus-5-5, 268099 tokens, 107 tool uses, 831 s

## Closed

- 1. Names: the two `HubTask` test literals, `config/text/views/boards/focus.yml` with the two keys renamed by the reader, `orderHub` in `deck-hub.ts`, `audit.test.ts`'s `SHIPPED`, `website-hub.ts:226,268`, `website.test.ts`, `workspace-findings.test.ts` are on the brief's paths and in What to build; the code name is `nudgeAfterDays` (decision 6); the `config` parameter of `refresh` is removed; G139's text and titles are brought to the new rows by the orchestrator at landing, from the titles the report gives.
- 2. The step line: the unknown-key finding is case 7, a quoted run over a workspace file (a hub file's `focus:` is already refused); the research hub's website paths and header are case 13, by the look.
- 3. Premises: the `docs/templates.md` premise and read item corrected (no behavior.yml template; the `config.yml` template holds `scan`, `update_tasks` and `website`); `doi_origin` named as the one key of `website:` that ships a value and stays; the research hub's grep written so it prints nothing; the unknown-key mechanism named (`workspace-layer.ts:336-343`, `hub-layer.ts:597-620`); the line numbers of `LAST_RUNS`, `HubTask`, `RefreshItem`, `updateTasks` and `UpdateTaskRow` corrected.
- 4. Cases and checks: case 5 states both rows and the rule (decision 7); case 6 follows the existing refusal of a row, with the valid, 0 and absent rows added; cases 7 and 15 are quoted runs; cases 10 and 12 are the changed G139 rows; case 11 is a preserved behaviour; the options.test.ts assertion moves to the dotted group `website.files`; `stale_days` is optional, whole and from 0 up as `days` of `options/layout.yml` is.
- 5. The question: the goal sentence names the LinkedIn tab of a new Incoming page; cases 1 to 5 run over offered tasks built from YAML rows; verify 6 greps `litwatch` (glyph lines excepted), the scan folders and the `incoming` arrangement's `linkedin`; case 13 reads the research hub's website tip and header.
- 6. Implied inputs: the Settings row form is case 19 and an item of What to build; a second hub's row without `stale_days` gets no nudge (What to build 1); Make Folder a Hub's empty scan, its `new_project_dir` finding and the schema globs are stated in What to build 3; the hub comment at `config.yml:29` is a hub line.
- 8. Dictated text: the scan comments use "oculus names none" (decision 9); a code block of `docs/templates.md` keeps its line form, and no "no longer" is carried into a comment (Conventions).
