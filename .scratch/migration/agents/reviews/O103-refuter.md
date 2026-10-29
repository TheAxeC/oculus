# Step O103 refuter report (on .agents/worktrees/migration-O103, base d364c1b7e)

## Verification (rerun by the reviewer)

```
$ ls docs/adr
ls: docs/adr: No such file or directory

$ git status --short
 M config/catalogs/vocab.yml
 M config/defaults/sources.yml
 M config/text/views/boards/focus.yml
 M src/lib/state/boards/ticker.ts
 M src/lib/ui/display/ticker/Ticker.svelte
 M src/lib/ui/display/ticker/ticker-rows.ts
 M src/lib/views/boards/focus/Tasks.svelte
 M tests/fixtures/hubs/demo/.oculus/config.yml
?? .scratch/migration/agents/reviews/O103-report.md

$ npm run test:quick
test:quick: 9 changed file(s), from git since HEAD
test:quick: 13 test file(s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (17.6 s)
ok      vitest (26.2 s): Duration  15.21s (transform 15.97s, setup 0ms, import 27.18s, tests 10.39s, environment 1ms)
ok      svelte-check (27.4 s): 1793286791604 COMPLETED 560 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (75.4 s): Duration  64.32s (transform 21.24s, setup 0ms, import 65.39s, tests 83.11s, environment 3ms)
test:quick: 77.7 s; every command passed

$ LC_ALL=C grep -n '[^ -~]' src/lib/state/boards/ticker.ts src/lib/ui/display/ticker/Ticker.svelte src/lib/ui/display/ticker/ticker-rows.ts src/lib/views/boards/focus/Tasks.svelte tests/fixtures/hubs/demo/.oculus/config.yml .scratch/migration/agents/reviews/O103-report.md; echo "exit $?"
exit 1
$ LC_ALL=C grep -n '[^ -~]' config/catalogs/vocab.yml config/defaults/sources.yml config/text/views/boards/focus.yml; echo "exit $?"
exit 1
$ (spec.md:102 perl form over the three config/ files); echo "perl exit $?"
perl exit 0          (no line printed)

$ grep -rn --exclude=local.yml "category: position" config tests
config/defaults/sources.yml:47:  - { key: applications, file: ".oculus/data/academic/applications.yml", band_positions: true, awaiting: true, open_badge: true, lead_applications: true, dissemination: true, ticker: { category: position }, group: academic, order: 3, label: views.applications, glyph: views.applications_glyph, about: files.make_collection_line_applications }
tests/fixtures/hubs/demo/.oculus/config.yml:20:  - { key: applications, file: ".oculus/data/academic/applications.yml", band_positions: true, awaiting: true, open_badge: true, lead_applications: true, dissemination: true, ticker: { category: position }, group: academic, order: 3, label: views.applications, glyph: views.applications_glyph, about: files.make_collection_line_applications }

$ grep -rn "same group as the applications" src; echo "exit $?"
exit 1

$ git diff d364c1b7e --numstat
1<tab>0<tab>config/catalogs/vocab.yml
1<tab>1<tab>config/defaults/sources.yml
5<tab>2<tab>config/text/views/boards/focus.yml
53<tab>20<tab>src/lib/state/boards/ticker.ts
25<tab>0<tab>src/lib/ui/display/ticker/Ticker.svelte
7<tab>0<tab>src/lib/ui/display/ticker/ticker-rows.ts
27<tab>7<tab>src/lib/views/boards/focus/Tasks.svelte
1<tab>1<tab>tests/fixtures/hubs/demo/.oculus/config.yml
$ wc -l (after the change)
     725 src/lib/state/boards/ticker.ts
     319 src/lib/ui/display/ticker/Ticker.svelte
      50 src/lib/ui/display/ticker/ticker-rows.ts
     230 src/lib/views/boards/focus/Tasks.svelte
     308 config/catalogs/vocab.yml
     114 config/defaults/sources.yml
     169 config/text/views/boards/focus.yml
      38 tests/fixtures/hubs/demo/.oculus/config.yml

Premises on the base:
$ git show d364c1b7e:config/catalogs/vocab.yml | grep -n "^  position:"
218:  position:   { label: focus.command.dlcat_position,    glyph: focus.command.glyph_position,   noun: focus.command.word_position_deadline, overdue_noun: focus.command.word_application }
$ git show d364c1b7e:config/defaults/sources.yml | grep -n "category: position"   -> 47 (applications), 50 (leads)
$ git show d364c1b7e:config/text/views/boards/focus.yml | grep -n ...
43:            dlcat_position: positions
55:            glyph_position: scout
98:            word_application: application
104:            word_position_deadline: position deadline
collection.yml:60: applications_glyph: inbox | leads.yml:40: leads_glyph: scout | glyphs.yml:101 scout, :119 inbox
git show d364c1b7e:...ticker.ts | wc -l -> 692 ; Tasks.svelte -> 210
ls src/lib/views/boards/focus/ -> Band.svelte career CommandCenter.svelte CommandCenterView.svelte Focus.svelte FocusFilter.svelte lanes QuickAdd.svelte rows.ts Tasks.svelte
$ grep -n "collections:\|ticker" ~/workspace/research-hub/.oculus/config.yml   -> only line 3, the header comment

Report's own commands, rerun:
$ grep -rn --exclude=local.yml -e "category: position" -e "category: lead" -e dlcat_position -e dlcat_lead -e glyph_position -e glyph_lead -e word_position_deadline -e word_lead_deadline -e word_application src tests config docs README.md   (cut to 90 columns)
tests/fixtures/hubs/demo/.oculus/config.yml:20 / :23
config/catalogs/vocab.yml:218 / :219
config/text/views/boards/focus.yml:42 dlcat_lead, :44 dlcat_position, :54 glyph_lead, :57 glyph_position, :100 word_application, :105 word_lead_deadline, :107 word_position_deadline
config/defaults/sources.yml:47 / :50
docs/templates.md:87 / :90
$ grep -rln "taskGroups\|hasTasks\|TaskGroups\|TaskLine" src tests docs README.md
src/lib/state/boards/ticker.ts
src/lib/views/boards/focus/Tasks.svelte
$ git diff d364c1b7e -U0 -- src | grep '^+' | grep -v '^+++' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"; echo "exit $?"
exit 1
$ git diff d364c1b7e -U0 -- src | grep '^+' | awk '{ if (length($0)-1 > 100) print }'
(nothing)
$ sh utils/unused-exports.sh | grep -n -E "ticker|Tasks|ticker-rows|focus/rows"
135:src/lib/state/boards/ticker.ts: dueFollowups, collectionStatuses, monthsAhead
218:src/lib/views/boards/focus/rows.ts: keptAction, actionsFor
338:src/lib/views/boards/focus/rows.ts: RowIndex
  (all three ticker.ts names are exported on the base: git show d364c1b7e:src/lib/state/boards/ticker.ts lines 66, 177, 569)
$ ls docs/glossary.md
ls: docs/glossary.md: No such file or directory
$ sed -n '178,$p' .scratch/migration/orchestrator-state.md | awk 'NR>1 && /^## /{exit} {print}'
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
$ ls -d <tmpdir>/o103-cases-*            -> no matches found
$ grep -rqs "o103-cases-" <tmpdir>/oculus-workspace-state-*; echo "exit $?"   -> exit 1
$ ls -d <scratchpad>/O103-caserun        -> No such file or directory

Doc text lines on the tree (docs/ unchanged by the diff):
$ grep -n -o "[^.]*command center holds the deadlines[^.]*\." docs/HELP.md
295: The command center holds the deadlines and dates of the records: papers, venues, funding, positions, leads, events, teaching and joint work.
$ grep -n -o "Due follow-ups, open subtasks[^.]*\." docs/HELP.md
295:Due follow-ups, open subtasks and the open entries of the tasks file are lines of the Tasks section, dated or not, whatever `deadline_horizon_days` says.
$ grep -n "key: leads" docs/templates.md
90:#   - { key: leads, file: ".oculus/data/academic/leads.yml", registry: leads, ticker: { category: position }, about: files.make_collection_line_leads }
```

## Verdicts

- Item 1 (applications and position leads, two Command Center groups): holds. `vocab.yml:219` adds `lead` after `position` with no `overdue_noun`, `position` keeps its four fields, the comment above the list is unchanged and names no word; `focus.yml` gives `dlcat_position: applications`, `glyph_position: inbox`, `dlcat_lead: position leads`, `glyph_lead: scout`, `word_lead_deadline: lead deadline`, each in alphabetical place; `sources.yml:50` and the demo hub's `:23` say `category: lead`; the leads loop comment (`ticker.ts:351-357`) is rewritten and the local is `scouted`. Checks 3 and 4 print as the brief asks.
- Item 2 (a task's subtasks under it as a subheading): holds, with Spec finding 1 (the unnamed `under` set-in) to be ruled on before landing. `taskGroups` (`ticker.ts:680-698`) builds `TaskLine`s, matches subtasks by `[root, collection, id]` only to lines with `task: true`, and leaves the rest in Subtasks; `hasTasks` counts each line once; `Ticker.svelte:77-78,177-191` draws `heading` and `under`; `Tasks.svelte:65-82` makes the heading `{ ...own, heading: true }` from the task's own `rowMaker` row (same id, actions, kept button, `fileBlock`, index entry, so `pick`, `run`, `removeAsked` act on the task line) and the rows under it labelled `subtaskDo`. No `:global` restyle, no new component, so no move.

Cases (the state halves judged by reading the code against the builder's quoted program source and output, which I could not rerun without writing a script; see Declined to judge):
1. met (state; the tail "lead deadline in 10d" by reading `CommandCenter.svelte:87-95` against the new `noun`; drawing at the look).
2. met.
3. met.
4. met (`position(App Twenty) lead(Lead Ten)`, words `teaching, position, lead, task`).
5. met.
6. met.
7. met for the state half on a planted copy of the hub's `work`; drawing half not verifiable here, look on the research hub.
8. met.
9. met.
10. met.
11. met.
12. met.
13. met.
14. met (entry ids are hub-qualified, `src/lib/data/snapshot/hubs/merge.ts:228`, so the two `work` rows also get distinct row ids through `rows.ts` `targetId`).
15. met (state and order; tone by reading `rowMaker` `daysTone`; drawing at the look).
16. met (the heading is the spread of the plain row, so the ids and order are the plain row's).
17. met.
18. met.
19. met.
20. met (rows under the heading take `one.subtaskDo ?? one.label`, `Tasks.svelte:72`; the program printed `subtaskDo`, which is the same value).
21. met (state: `keeps[id]` is keyed by row id, which the spread keeps; drawing at the look).
22. met by reading (`Ticker.svelte:89-95` name button, `:70` `onfocusin`); not verifiable here beyond reading, look at landing.
23. met.
24. met by reading (`Tasks.svelte:107-115`, `{#key}` at `:166`); look at landing.
25. met.

## 1. Spec

1. `src/lib/ui/display/ticker/ticker-rows.ts:37-38` and `Ticker.svelte:187-191`, the `under` field and its set-in:
   ```
   +    /** Draw the row set in under the heading row above it, as one of the heading's. */
   +    under?: boolean;
   ...
   +    li.under {
   +        margin-left: 1.25em;
   +    }
   ```
   The brief names one field, the heading variant; `under` is a second, user-visible shape (rows indented by 1.25em). Ruling 546 (2) lists "(b), indented rows under the task row, not chosen"; the build now draws (a) plus the indentation of (b). The builder reported it as judgment call 1, so it is not silent. Is it needed: partly. Rows are already told apart by glyph (a subtask line carries `focus.command.glyph_subtask` `pin`, `ticker-lines.ts:167`; a task line the `tasks` glyph), so a plain task row after a heading's rows does not read as one of its subtasks by glyph, while the indent makes the grouping easier to see. Failure scenario: at the look Axel sees indented rows under the task, which is the form he passed over in 546 (2)(b), and the step lands a departure from his ruling without his word. Fix: the orchestrator either drops `under` (two lines in `Tasks.svelte`, the field and the rule in the ticker) or puts keep/drop to Axel as an open item. My recommendation, as a judgment: put it to him, since only he can say whether the indent is part of what he rejected.
2. The builder's report, line 530: "Two runs of a one-line scratch probe as `npx vitest run --project unit --dir <scratch>/caserun` ... they were whole-suite runs of the unit project. The first was stopped with TaskStop after about three minutes". The probe is a script outside the case-run program (the only script `spec.md:65` and the brief allow), and no ruling approves it. Both runs were whole-suite runs of the unit project, which `spec.md` "Token discipline" names a finding of the review. They wrote nothing into the diff. Failure scenario: the cost is minutes of machine time and tokens while other suites share the machine; nothing in the result depends on them.
3. The case-run program, report lines 127 and 135: `const BASE = mkdtempSync(join(tmpdir(), 'o103-cases-'));` puts the hub copies in the system temporary folder, and `published` writes `oculus-workspace-state-*` folders there. `spec.md:65` says a file the program needs lives in the scratchpad or the base copy. The cleanup claims reproduce (`ls -d <tmpdir>/o103-cases-*`: no matches; the `grep -rqs` over the state folders exits 1). Failure scenario: a run that crashes before `rmSync` leaves hub copies outside the scratchpad, where the session's cleanup does not reach them. Low severity.

No premise of "What is on the tree" failed to reproduce. Every case has its first run in the report (lines 24-81). No user decision was taken beyond finding 1.

## 2. Proof

none. One count in the report is misstated with no decision resting on it: line 534 says the name grep printed "the five `focus.yml` keys"; the rerun prints seven `focus.yml` lines (42, 44, 54, 57, 100, 105, 107). Every other quoted command reproduces as the report says (the open-items section, the grep of the changed names, the `taskGroups` grep, the history-word grep, the width check, the `unused-exports` lines, the missing glossary, the scratch and temporary-folder cleanup, the `test:quick` result).

## 3. Standards

1. `src/lib/state/boards/ticker.ts:140`, the `Ticker` type's doc comment, left unchanged: "Each list is already in the order it is shown in." After the diff this is false for `tasks`. A task's subtask lines sit in the list's subtask run (`ticker.ts:553-557`, before the tasks run), but `taskGroups` moves them under their task, so the section draws them after the task. Failure scenario: a reader who trusts the doc and draws `tasks` in order, or reasons about the section's order from it, puts a task's subtasks above the Tasks group. Fix: say that each list is in the order its lines are shown in within the group `taskGroups` puts them in.
2. The report leaves out the key check `spec.md` requires ("Every id or key a step introduces is checked empty, duplicated, and colliding with a configured or reserved key ... The report states what the code does in each case") for the new word `lead`, the catalog keys `dlcat_lead`, `glyph_lead`, `word_lead_deadline` and the fields `heading`/`under`. My check: the three catalog keys occur once each in `focus.yml` and once in `vocab.yml:219` (`grep -rn "dlcat_lead\|glyph_lead\|word_lead_deadline" config --exclude=local.yml | wc -l` prints 4). Under the lay-over rule (`docs/data-map.md:81`, "a word the hub names replacing oculus's in oculus's place"), a hub whose own `ticker_categories` names `lead` replaces oculus's word in place. A hub whose own `collections:` keeps `category: position` on its leads keeps them in the applications group. Failure scenario: the omission itself breaks nothing; the report fails to show the check was made.
3. `src/lib/state/boards/ticker.ts:355`: "so the leads stand in a Command Center group of their own". The same file writes "command center" in lower case everywhere else (`:141`, `:187`, `:707`, `:716`). This breaks the no-synonym-cycling and consistent-name rule of the prose standard. Failure scenario: cosmetic; a reader may wonder whether a different thing is meant.
4. Doc text for `docs/HELP.md:295` (report line 638): "A task of the tasks file with open subtasks is drawn under Tasks as a subheading with its subtasks under it." This is slightly wider than the diff. A task whose open subtasks are all snoozed stays a plain row (brief decision 5; `taskGroups` sees only the lines that reach the section). Failure scenario: a reader with a task whose only open subtask is snoozed expects a subheading and sees a plain row. Fix at landing: "with open subtasks on the board" or "with open subtasks that are not snoozed".

Checked and not a finding:
- The Gallery's ticker sample (`Gallery.svelte:389-397`) draws no heading row. It already draws none of the row's optional fields (`actions`, `detail`, `mark`, `plain`), so `Ticker.svelte:4-5` ("the gallery draws one with sample rows so the shape is visible") is no less true than on the base.
- These comments stay true: `Focus.svelte:19-20,28-33`, `FoldHead.svelte:9`, `CommandCenter.svelte:5`, `CommandCenterView.svelte:5`, `docs/data-map.md:34,57`, `docs/HELP.md:555`, the `ticker_categories` comment in `docs/templates.md:411-416`, `sources.yml:31` and `vocab.yml:212`.
- No file passes its size limit (725 and 230 lines, limits 880 and 520). `ui/` imports no state (`Ticker.svelte` imports Glyph, LinkedText, reveal and ticker-rows; `boundaries.test.ts` passed in the verify list). The code is ASCII and carries no history words. The edited comment paragraphs are rewrapped (`comment-width.test.ts` ok). `entryOfLine` is local and `TaskLine` has its importer.

## 4. Behaviour

1. Not stated in the report: a subtask row under a heading carries the `do` text alone as its label. So when its name is cut, its hover words (`Ticker.svelte:79` `shown.cutText(row)`) say the `do` text and the tail without the task's name. Before the change they said "Main Tasks: Oculus ...". Failure scenario: minor; the heading above names the task.
2. Not stated in the report with its before and after: when the first line of the Tasks group is a heading, `li.heading { margin-top: 4px; }` (`Ticker.svelte:179-181`) adds 4px under the group label on top of the list's 2px gap. Before the change the first row sat directly under the label. Failure scenario: a visible spacing change at the look that the report does not tell the orchestrator to expect.

The other visible changes are stated with their before and after (report lines 600-602 and judgment calls 1, 2 and 4): the renamed group and glyph, the new group and its order, the bold heading, the set-in, the dropped prefix, and the Subtasks group disappearing when empty.

## Declined to judge

- The case-run program's output (cases 1 to 25, state halves): its source and the vite config it ran under are deleted, and rerunning them would mean writing a script, which my brief forbids. I judged each case by reading `ticker.ts`, `ticker-lines.ts`, `rows.ts`, `Tasks.svelte` and `Ticker.svelte` against the quoted source (report lines 89-422) and the quoted first and final output (lines 23-53, 426-456).
- Every drawing half (cases 1, 7, 15, 21, 22, 24 and the heading style): it needs a page, so it is the look on landing.

Reviewer usage: abb1b8f406af77f0a, claude-opus-5-5, 187340 tokens, 43 tool uses, 8 min 56 s.
