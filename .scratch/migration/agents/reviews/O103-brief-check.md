# Brief check of O103 (`.scratch/migration/agents/briefs/O103.md`, on main at 492befd93)

`git log -1 --oneline` printed `492befd93 Book ruling 546 and add O103`, which is the base the brief names. `git status --short` showed the brief as untracked and the state file as modified. I changed nothing.

Summary: eleven findings change what the builder can build or what a check proves. They are 1.a, 1.b, 2.a, 3.a, 3.b, 4.a, 4.b, 4.c, 5.a, 6.a and 8.a. The rest are line-number slips or still-true notes.

## 1. Names

The command for the old words:
`git grep -n -e "category: position" -e "category: 'position'" -e 'category: "position"' -e dlcat_position -e glyph_position -e word_position_deadline -e word_application -- src tests config docs README.md ':!config/local.yml'`

Output, trimmed:
```
config/catalogs/vocab.yml:218:  position:   { label: focus.command.dlcat_position, ...
config/defaults/sources.yml:47: ... key: applications ... ticker: { category: position } ...
config/defaults/sources.yml:50: ... key: leads ... ticker: { category: position } ...
config/text/views/boards/focus.yml:43/55/98/104
docs/templates.md:87, :90
src/lib/state/boards/ticker.ts:365:            category: position,
tests/data/helpers/hub-names.test.ts:228:            ticker: { category: 'position' }
tests/data/sources/collections.test.ts:241:                ticker: { category: 'position' },
tests/fixtures/hubs/demo/.oculus/config.yml:20, :23
```

The command for the new words:
`git grep -n -w -e dlcat_lead -e glyph_lead -e word_lead_deadline -e "category: lead" -- src tests config docs README.md ':!config/local.yml'` printed nothing and exited 1. None of the new names exists yet.

`git grep -n -e taskGroups -e hasTasks -e TaskGroups -- src tests config docs README.md` found them only at `ticker.ts:647,658,659,669` and `Tasks.svelte:24,50,66`. Both files are in the write list.

The group text keys are `config/text/views/boards/focus.yml:140-142` (`grp_followups_label`, `grp_subtasks_label`, `grp_tasks_label`) and `:67` (`grp_subtask_glyph`). Their only reader is `Tasks.svelte`.

**Hits outside the write list and the Doc text, and whether the change makes them false:**
- `src/lib/state/boards/ticker.ts:365`: missing from the brief's "Other uses" list, but item 1's last bullet renames that local name. Covered.
- `tests/data/helpers/hub-names.test.ts:228` and `tests/data/sources/collections.test.ts:241`: both are applications-like `jobs` entries (read at `hub-names.test.ts:218-235` and `collections.test.ts:232-250`). Still true.
- `tests/fixtures/hubs/demo/.oculus/config.yml:20` (the applications row): still true.
- `config/options/behavior.yml:161` ("the dated entries of talks, teaching and positions"): still true, since applications keep `position`. `:166` (leads_horizon_days help, "an open position lead"): still true.
- `config/text/views/boards/focus.yml:8` (`cards_group: Funding | positions | teaching`) is the band, which the step does not touch. `config/text/views/sources/files.yml:88,94`: still true.
- `config/defaults/sources.yml:31` and the comment at `config/catalogs/vocab.yml:212`: still true. The registries still give their own category.
- `config/options/catalogs/vocab.yml:256` and `config/options/sources.yml:111-113`: the Settings choice reads `from: ticker_categories`, so `lead` appears there by itself. Still true.
- `docs/data-map.md:63,111`, `docs/apps.md:381` and `README.md:36`: still true.
- Head comments: `CommandCenter.svelte:2-6`, `CommandCenterView.svelte:2-5`, `Focus.svelte:15-24` and `rows.ts:1-21` stay true for the grouping itself.
- **1.a `Focus.svelte:28-31`** ("the markup is seven partials under views/boards/focus/ (... Tasks)") and **`src/lib/ui/controls/heads/FoldHead.svelte:9`** ("(views/boards/focus/Tasks.svelte)") become false if `Tasks.svelte` moves or a partial is added. Check 3.b shows a move is forced if a component is added. Neither file is in the write list.

**Orphan-key and catalog checks:**
- `tests/checks/source/keys.test.ts:679-692` ("has a reader for every catalog key") counts as read every key that a `ticker_categories` row names. It does this through `tickerWords('label'|'glyph'|'noun'|'overdue_noun')` (`keys.test.ts:209-219`, `:290-307`). So `dlcat_lead`, `glyph_lead` and `word_lead_deadline` have a reader once the dictated row names them. `word_application` keeps its reader through `position`'s `overdue_noun`. The check holds.
- `tests/checks/source/catalog-file-keys.test.ts` checks only the top-level keys of `config/catalogs/`, and `ticker_categories` already exists there. Holds.
- `tests/checks/config/templates.test.ts` compares the keys of `docs/templates.md`, not its values (head comment lines 1-6). Leaving `templates.md:90` for landing does not turn the builder's run red.
- `tests/checks/config/integrity.test.ts` runs over the demo hub. `lead` will be a word of `ticker_categories`, so it holds.

## 2. The step line

Requirements of the O103 line (`plan.md:1195`) and ruling 546 (`plan.md:3290`), with the part of "What to build" that serves each:
- New category `lead`, heading "position leads", glyph `scout`, noun "lead deadline": item 1 bullets 1 and 2.
- Given to the leads entry of `sources.yml`: item 1 bullet 3.
- `position` keeps `applications.yml`, heading "applications", the Applications view's glyph: item 1 bullets 2 and 3 (`glyph_position: inbox`, which equals `collection.yml:60`).
- The demo hub's rows follow: item 1 bullet 4. Only row 23 changes, since row 20's category stays.
- The tests that name the category: neither changes (What is on the tree, line 15). Correct by the reading under check 1.
- The docs that describe the group: Doc text for `HELP.md:295` and `templates.md:90`.
- Part (2), subheading, title opens the task, keeps the task row's buttons, subtasks as rows under it: item 2 bullets 1, 2 and 4.
- A task with none stays a plain row: item 2 bullet 3.
- Subtasks group keeps projects, funding schemes and other collections; a snoozed subtask stays in Snoozed: item 2 bullet 6.
- Built beside O99 (546 (3) (a)): the Doc text is held for landing.

**2.a** The step line names "the subtask loop of `src/lib/state/boards/ticker.ts`" as a place, but no item of "What to build" changes it. The grouping moves into `taskGroups`, and the loop already gives the targets. That is fine, but the brief should say the loop is unchanged, so a reviewer does not read it as an unserved requirement.

**Parts with no requirement of the line**, each serving a spec rule or a brief decision:
- item 1 bullet 5 (comment and rename), for `spec.md:71`;
- item 2 bullet 5 (an orphan subtask stays in Subtasks), decision 4;
- item 2 bullet 7 (`hasTasks` counts once) and bullet 8 (`hidden` unchanged);
- item 2 bullet 9 (sizes), for `spec.md:47-48`;
- decision 1 (`lead` drawn after `position`).

## 3. Premises

These hold: the base `492befd93`; `vocab.yml:218`; `sources.yml:47,50`; `focus.yml:43,55,98,104`; `collection.yml:60`; `leads.yml:40`; `glyphs.yml:101,119`; `ticker.ts:333-338,339-342,358-370,363,658-666`; `ticker-lines.ts:171`; `vocab.yml:115,136,138`; the sizes (`wc -l`: ticker.ts 692, Tasks.svelte 210); no ADR; `.agents/plan.yaml:4`.

- The hub check holds. `grep -n "collections:\|ticker" .oculus/config.yml` in the research hub prints only line 3, the header comment.
- The hub's task `work` is at `tasks.yml:20-29` with five subtasks.
- The brief's `git grep -ln "taskGroups\|state/boards/ticker'\|Tasks.svelte\|CommandCenter" -- tests` printed `keys.test.ts`, `boundaries.test.ts` and `collections.test.ts`, as the brief says. But `collections.test.ts:18,393` does call `tickerCategories` from `ticker.ts`, so "no test covers the ticker" is slightly loose. The step does not change `tickerCategories`.
- `grep -n -i "ticker" agents/guarded.md` hits `:242` and `:322`. Both are the config reader and editor of a collections entry's `ticker:`, not the ticker. Holds.
- The brief's line-15 grep also prints `src/lib/state/boards/ticker.ts:365`, which the line leaves out of its list (see check 1).

Line references that are off:
- Line 12: the category words are `vocab.yml:214-220`, not `212-219`. Line 212 is the comment and 213 is `ticker_categories:`.
- `CommandCenter.svelte` `tickerCategories(vocabOf())` is at `:85`, not `:84`, and `noun` is at `:87-95`, not `:89-93`.
- The tasks list's order is `ticker.ts:553-557`, not `:548-557`.
- The entry subtask loop is `:516-539`, not `:518-538`.
- A collection entry's snoozed subtask goes to `snoozed` at `:535`. The cited `:494` is the project loop.
- **3.a Read item 5** names `rows.ts:220-345 (the actions, openLine, rowMaker)`, but `openLine` is at `rows.ts:419`, `act` at `:485`, `removeAsked` at `:75` and `fileBlock` at `:138` (`grep -n "function openLine\|..." rows.ts`). The range leaves out three of the four functions the subheading must call.
- **3.b Folder limit.** `git ls-files src/lib/views/boards/focus | ... | sort -u` lists 10 items: Band.svelte, career, CommandCenter.svelte, CommandCenterView.svelte, Focus.svelte, FocusFilter.svelte, lanes, QuickAdd.svelte, rows.ts, Tasks.svelte. A new component, or a new subfolder, directly under `focus/` makes 11 and `utils/folder-check.sh` refuses it. The only lawful form is to move `Tasks.svelte` (and the new component) into a new subfolder. That writes `Focus.svelte:68` (`import Tasks from './Tasks.svelte'`), its head comment and the comment at `FoldHead.svelte:9`, and none of these is in the write list. Under the standing demand "A brief check never widens a step", this is an internal widening. Recommendation: name `Focus.svelte` (the import and the head comment), `FoldHead.svelte:9` and the subfolder in the write list, or say the subheading needs no new component.
- **3.c Styling the subheading.** A view may not restyle a primitive's class through `:global` without an entry in `tests/checks/tree/allow-styling.ts`, whose `DELIBERATE` list is empty and whose `HELD` entries are "a coupling to undo". So a subheading "in a heading style distinct from ... a plain row" can be built either way:
  - as a variant of `src/lib/ui/display/ticker/Ticker.svelte` and `ticker-rows.ts`, a ui primitive not in the write list;
  - as a new component that rebuilds Ticker's buttons and its reveal (`createReveal`, the kept button, the cut-text title) out of ui primitives, which duplicates `Ticker.svelte`.

  Not in the brief either: the builder must not restyle Ticker's rows from the view through `:global`, since that adds a row to that allow list. The brief names neither form. Recommendation: put `Ticker.svelte` and `ticker-rows.ts` in the write list for a heading-row variant. That is again an internal widening, with no new requirement and no new case.

## 4. Cases and checks

- **4.a Brief line 59** says "the drawing itself is looked at on a scratch server at landing". `spec.md:60` says the orchestrator opens the views on Axel's running server at localhost:8790. The research hub can show the main states there:
  - task `work`, with five subtasks (`tasks.yml:20-29`);
  - open leads due 2026-11-01, 2026-11-04 and 2026-11-22 (`grep -n "deadline:\|status:" leads.yml`);
  - an applications entry dated 2027-01-21.

  Only case 14 (two hubs) and similar states need a scratch server.
- **4.b Verify 3 and verify 4** ask for `git grep`. `spec.md:33` allows a builder only `git status`, `git diff` and `git show`.
- **4.c Verify 3's expected output is wrong.** Run on the current tree, `git grep -n -e "category: position" -- config tests ':!config/local.yml'` prints `sources.yml:47`, `sources.yml:50` and demo `:20`, `:23`. It does not print the two test fixtures, which write `category: 'position'` with quotes. After the change it prints two lines (`sources.yml:47`, demo `:20`), not the four the brief expects.
- Case 1 ("the Command Center draws it under 'position leads' with the tail ...") and cases 7 and 15 (what the section draws) are drawings. `spec.md:64,66` route a drawing to the look on landing. The brief says the drawing is looked at, but case 1 does not say which half is the program's and which is the look.
- No case asks the builder to check a place the step leaves unchanged. Cases 3, 5, 10, 13 and 18 are regressions over code the step changes.
- The test rule (`spec.md:58-59`) and the no-breakage rule (`spec.md:67`) are consistent with the brief: no test is added and nothing is broken on purpose.
- Feasibility of the case-run program: `rows.ts` imports through `$lib/...` aliases (`rows.ts:24-39`), and vitest includes only `tests/**` (`vite.config.ts:511`). A scratchpad program for case 16 needs the alias resolution. That is the builder's to solve and is allowed by `spec.md:65`.

## 5. The question: could it pass without the goal being reached?

- **5.a Case 6** can pass with no line at all. The demo hub's open leads are due 2026-09-15, 2026-08-30 and 2027-12-31 (`grep -n "deadline\|status" tests/fixtures/hubs/demo/.oculus/data/academic/leads.yml`). At today's date none is inside 21 days, so "its leads' lines are of kind `lead`" holds over an empty set. The case needs a stated `now` (such as 2026-08-25) and an expected count of lines.
- Case 1: no. It needs kind `lead`, the glyph and the noun.
- Case 2: no.
- Cases 4 and 5: no.
- Case 7: the state half cannot pass without the grouping. The drawing half rests on the look.
- Case 13: yes, for one input. Its project has no undated-deadline line in the Tasks group, so a matching rule that pairs any Tasks line by kind and id (a project's undated `deadline:` line with its subtasks) passes case 13 and still breaks "Subtasks keeps the subtasks of projects". See 6.a.
- Case 14: no.
- Case 16: yes, partly. The same action ids in the same order can hold while the subheading loses the always-drawn kept button (`rows.ts` `keptAction`, the task's `done` status), the reveal on keyboard focus (`Ticker.svelte` `onfocusin`) or the `fileBlock` disabling. That would make the buttons look unchanged in the program but wrong on the board.
- Case 17: no.
- The step line carries no check of its own. Its text ends at "(ruling 546)".
- Item 1: no. Bullet 3 together with case 1 needs the leads row changed. No hub of the workspace overrides it: I looped over the ten folders of `.oculus/workspaces/research-hub.yml` and found no `.oculus/config.yml` other than the research hub's.
- Item 2 bullets 1 and 2: the heading style can only be proven at the look.
- Verify 3: it could pass with the leads entry losing its ticker entirely, but case 1 covers that.
- Verify 4: it passes when the comment is merely deleted. Whether the comment is true is the reviewer's reading.

## 6. Implied inputs

- **6.a A Tasks-group line that is no task of the tasks file, with subtasks:**
  - a project whose `deadline:` is no date, which `ticker.ts:256-258` puts in `openEntries` and hence the Tasks group;
  - an entry of a hub collection with `ticker: { undated: true }` other than the tasks file.

  Expected: its subtasks stay in the Subtasks group. The matching must require `target.task === true` (`ticker.ts:323,337`). Item 2 bullet 4 says only "a task line of the section", which reads as any Tasks-group line. Nothing in the hub's data shows whether this happens, but a wrong match costs the rule the step line states.
- **The subtask row's label under the heading.** `ticker-lines.ts:167` makes it `${parent}: ${row.do}`, so the hub's `work` would draw "Main Tasks: Oculus" five times under the heading "Main Tasks". The brief does not say whether a row under a heading keeps the parent's name. The choice is user-visible, so under `spec.md:18` it should be dictated rather than left to the builder.
- **Keyboard focus and the kept button on the subheading.** Expected:
  - Tab reaches the title and the buttons are revealed as on a row (`Ticker.svelte` `onfocusin={shown.into}`);
  - the `done` status button stays drawn without hover, as the task row's does (`rows.ts:10-12`).

  `spec.md:60` counts focus and tab stops as visible. No case states this.
- **`fileBlock`.** While a source tab holds unsaved text of `tasks.yml`, the subheading's buttons are disabled with the file's words as their title (`rows.ts:16-18`). No case.
- **The Remove question from the subheading.** It opens `DeleteAsk` under the section through `Tasks.svelte`'s `run` and `asking`. A second Remove asks about the second entry alone (`Tasks.svelte:15-18`). Case 16 says only "opens the Delete question".
- **Order.**
  - The order of the subheadings among plain task rows. Expected: each keeps its task line's place in `datedFirst` (`ticker.ts:556`).
  - The order of undated subtasks under a heading. Expected: file order, since `ticker.ts:541` sorts only by kind. Case 7 states neither.
- **Columns.** The section is `columns: 2 22em` with `.grp { break-inside: avoid }` (`Tasks.svelte:168,191`). A Tasks group holding several subheadings cannot break across the columns. Whether a subheading and its rows must not split is unstated.
- **A hub overriding `ticker_categories` or the leads entry.** None in the workspace (the loop in check 5). A hub made earlier by Make Folder a Hub would carry the leads row with `category: position` and would draw its leads under "applications". That has not happened.
- **Several hubs.** Case 14 covers the tasks. For the leads, `tickerCategories(vocabOf())` reads every hub's words (`CommandCenter.svelte:85`), and each hub merges oculus's map by word (`vocab.yml:4`), so `lead` is present in every hub. No case needed.
- **Snoozes.** Cases 10 and 11. Snoozing the subheading moves the task to Snoozed and its subtasks into the Subtasks group, which is case 11's state.
- **The Focus filter.** Case 17. Hub and Pillar unticked hide the task and its subtasks together. No case needed.
- **The key `lead` (`spec.md:72`).** `git grep -n "\.kind === '..."` over `state/boards`, `views/boards/focus` and `state/feeds` finds no code comparing `line.kind` with `'lead'`. The target kind `'lead'` (`ticker.ts:368`) is a separate field, and `filter.ts:417` uses `line.kind` only in a key compared on both sides. No collision. The brief does not ask the report to state it.

## 7. ADRs

`ls docs/adr` printed "No such file or directory". `grep -n "adr" .agents/plan.yaml` printed nothing. No record touches the step.

## 8. Dictated text

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O103.md` printed nothing and exited 1, so the brief is ASCII. `grep -n -i "before\|no longer\|still\|previously\|used to"` over the brief hits only the brief's own instructions, none of the dictated text.

- `grep -n "dlcat_lead" O103.md` gives 31 and 32. The vocab row `{ label: focus.command.dlcat_lead, glyph: focus.command.glyph_lead, noun: focus.command.word_lead_deadline }`: holds. The neighbouring rows are padded into columns, and `vocab.yml` is in `.prettierignore`, so the padding is hand-kept. The brief does not ask for it. No rule of `spec.md` is broken.
- `grep -n "dlcat_position: applications" O103.md` gives 32 and 110. Holds.
- `glyph_position: inbox` (32): holds. `inbox` is `glyphs.yml:119`.
- `dlcat_lead: position leads` (32): holds. It matches the step line and the lowercase of its neighbours.
- `glyph_lead: scout` (32): holds.
- `word_lead_deadline: lead deadline` (32): holds. It gives "lead deadline in 10d" through `generic_in: '{0} in {1}d'` (`focus.yml`).
- `grep -n "category: lead" O103.md` gives 33, 34 and 55. `ticker: { category: lead }` for `sources.yml:50`, demo `:23` and `templates.md:90`: holds.
- **8.a** `grep -n "the other records' subtasks" O103.md` gives 54. The HELP.md:295 Doc text says that "the Subtasks group holds the other records' subtasks". That is false under the brief's own decision 4 and cases 11, 12 and 17, where a task's own subtasks stay in Subtasks when the task line is snoozed, dropped by `live_subtasks`, or hidden by the filter. It breaks `spec.md:71` (a sentence the change makes false is a defect). The dictated content should name that exception.
- The same line 54, "the command center's records naming applications and position leads as two groups": holds. `spec.md:71` asks for short bullets in HELP.md, but the brief replaces a sentence inside the existing long bullet, which keeps the file's present form.

## Declined to judge

- Whether a case-run program can import `ticker.ts` under plain node (it uses relative `.ts` imports and `t` needs a loaded catalog) without running it. Running it would be a script outside my brief.
- Whether O99's builder writes `config/text/views/boards/focus.yml`. O99's write list names `config/text/` only as "the words of the views it changes". Its diff is in flight, and I did not read its worktree.
- Whether `npm run diagrams` changes `docs/diagrams/layer-views.*` for this step. The diagrams count imports between folders, so a new import from `views/boards` into `ui` changes a count. Recent briefs (O99, O100) do not list `docs/diagrams/` either, so this is left to the landing's convention.
- How the subheading should look (glyph, size, weight). That is the look's.

Usage: adb3d9f9523ef6aca, claude-opus-5-5, 223910 tokens, 74 tool uses, 10 min 1 s.

## Closed

- 1.a, 3.b (folder limit, head comments): "What is on the tree" names the ten items and the two comments; item 2 moves `Tasks.svelte` with any new view component into `src/lib/views/boards/focus/tasks/`, and the paths add that folder, `Focus.svelte` (import, head comment) and `FoldHead.svelte` line 9, only when a component is added.
- 1, line 15 (`ticker.ts:365` missing from the list): added to "What is on the tree".
- 2.a (the subtask loop): item 2 says the loop is unchanged.
- 3 (line slips): `vocab.yml:214-220`, `CommandCenter.svelte:85` and `:87-95`, `ticker.ts:516-539`, `:535`, `:553-557` corrected; the `tickerCategories` call of `collections.test.ts:18,393` named.
- 3.a (Read item 5): `rows.ts` whole, with `removeAsked`, `fileBlock`, `rowMaker`, `openLine` and `act` by line.
- 3.c (styling): item 2 makes the subheading a heading variant of the ticker row in `ui/display/ticker/` (`ticker-rows.ts`, `Ticker.svelte` added to the paths), never a `:global` restyle nor a rebuilt ticker; decision 7.
- 4.a (where the look runs): the Cases preamble names the configured `look:`, the research hub for cases 1, 2 and 7, a scratch server for a case no hub shows.
- 4.b, 4.c (verify 3 and 4): both are `grep -rn`, verify 3 expecting exactly `sources.yml:47` and the demo hub's `:20`.
- 4 (state and drawing halves): the preamble splits each case; case 1 marks its halves.
- 5.a (case 6 over an empty set): `now` 2026-08-25 and the two lines named.
- 5, case 16 (kept button, focus, fileBlock): cases 21, 22 and 23; item 2 bullet on the subheading's behaviour.
- 6.a (a Tasks line that is no task): item 2 requires `task: true`; case 19.
- 6 (the subtask label): item 2 and decision 6, the subtask's own `do` under a heading; case 20.
- 6 (Remove, order, columns): cases 24 and 25; item 2 bullet on order and columns.
- 8.a (HELP.md Doc text): the dictated content names the subtasks of a task whose own line is not drawn.
