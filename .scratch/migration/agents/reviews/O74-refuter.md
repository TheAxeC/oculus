# Step O74 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O74, base a5387bdc)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run test:quick -- --base a5387bdc        (once; EXIT 0)
test:quick: 22 changed file(s), from git since a5387bdc
test:quick: 3 test file(s)
        tests/checks/tree/boundaries.test.ts: changed
        tests/data/sources/career.test.ts: named for a changed file
        tests/state/boards/board/board-rules.test.ts: imports at depth 1
ok      prettier (3.1 s): All matched files use Prettier code style!
ok      ASCII gate (3.4 s)
ok      svelte-kit sync (12.2 s)
ok      vitest (12.6 s): Duration  4.38s (...)
ok      vitest checks (15.0 s): Duration  6.82s (...)
ok      eslint (22.1 s)
ok      svelte-check (25.1 s): 1792932331332 COMPLETED 538 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 37.5 s; every command passed
(git diff a5387bdc --stat -- docs/diagrams after the run: the same 6 files, 16 +, 16 -, as before it)

$ sh utils/unused-exports.sh > <scratchpad>/o74-review-unused.txt; diff .agents/worktrees/O74-base/unused-exports.txt <that file>
EXIT 0 / DIFF 0
$ sh utils/folder-check.sh
FOLDER 0

$ npx vitest run tests/state/forms/form-draft.test.ts tests/state/forms/page-entry.test.ts tests/state/client/held-unsaved.test.ts tests/state/sessions/source/source.test.ts
 Test Files  4 passed (4)
      Tests  85 passed (85)
$ npx vitest run tests/checks/tree/boundaries.test.ts
 Test Files  1 passed (1)
      Tests  11 passed (11)
$ diff .agents/worktrees/O74-base/tests/checks/tree/boundaries.test.ts tests/checks/tree/boundaries.test.ts
309a310
>         'data/helpers/files/yaml/career-text',

Report-quoted commands:
$ npx vitest run tests/checks/tree/duplication.test.ts --testTimeout 0
 FAIL  |unit| tests/checks/tree/duplication.test.ts > a rule written twice > is not held anywhere under src/lib
+   "src/lib/views/sources/data/Data.svelte:64 and src/lib/views/sources/venues/Venues.svelte:77 hold the same 6 lines (c9d225dfd7c8)",
      Tests  1 failed | 17 passed (18)
$ grep -rln "toggledThemes(held.off, theme)" O74-base/src migration-O74/src
O74-base/src/lib/views/sources/venues/Venues.svelte
O74-base/src/lib/views/sources/data/Data.svelte
migration-O74/src/lib/views/sources/data/Data.svelte
migration-O74/src/lib/views/sources/venues/Venues.svelte
$ npx vitest run tests/checks/source/history.test.ts --testTimeout 0
      Tests  6 passed (6)
$ npx vitest run tests/checks/tree/size.test.ts tests/checks/imports/order.test.ts tests/checks/source/keys.test.ts tests/checks/imports/cycles.test.ts --testTimeout 0
 Test Files  4 passed (4)
      Tests  40 passed (40)
$ grep -n "sections\|facts\|class=\"order\"\|\.when\|Table\|\.career" src/lib/views/boards/focus/career/CareerPanel.svelte
27:    // The Edit control opens the editor of the career file's sections, ...
89:    const career = $derived(snapshot?.entities.career ?? null);
192:        glyph={t('focus.career_glyph')}
193:        title={t('focus.career_heading')}
194:        name={t('focus.career_heading')}
$ grep -n "\.week\|\.grp\|\.category\|\.lbl\|\.sub\b\|\.career" CommandCenterView.svelte CareerPanel.svelte
(16 lines, all `t('focus.command.grp_...')`, `one.category` or `focus.career_*` calls; none in a <style> block)
$ grep -rn "nextLine\|recordTable\|RecordTable\|career_next_line" src tests config docs README.md --exclude=local.yml
(nothing; exit 1)

Case runs (npx tsx -e, oculus's own functions, the hub's career.yml read only, no file written; the runes of .svelte.ts modules read as plain values through globalThis stand-ins so career-rows.ts loads outside vitest, TSX_TSCONFIG_PATH=.svelte-kit/tsconfig.json for $lib):
case 1 true {"x":1,"closed":["tasks","career"]} true true
case 3 [{"line":24,"column":7},{"line":25,"column":12}] {"line":32,"column":8} {"line":37,"column":13}
case 4 {"line":2,"column":13} {"line":4,"column":11} {"line":6,"column":5}
case 5 null
case 5 {"ok":false,"sentence":"Now is no longer in career.yml","line":null}      (findCareer over a stub draft source)
case 20 {"line":26,"column":7}
case 23 {"line":1,"column":27} {"line":3,"column":10}
extra: task 12 (a number) null; "goal: [" {"code":"file_unparsed","line":2,"key":""}; "" null; situation key 2024 {"line":2,"column":9}
case 6 2026-10-22 "2026-10-22, 3 days ago" "red"
case 6 2026-10-25 "2026-10-25, today" "amber"
case 6 2026-11-04 "2026-11-04, in 10 days" "amber"
case 6 2026-11-08 "2026-11-08, in 14 days" "amber"
case 6 2026-11-09 "2026-11-09, in 15 days" undefined
case 6 2026-11-17 "2026-11-17, in 23 days" undefined
case 6 none {"id":"career:next","glyph":"calendar","label":"M","actions":[{"id":"edit","label":"Edit"}]}
case 9 lead->projects supervisor->supervision collaborator->coauthor other->coauthor undefined
case 21 "projects"
case 12 career:goal "see https://x.test." ... [Edit, {"id":"link:https://x.test","label":"x.test","title":"Open https://x.test"}]
case 12 career:situation:Web ... [Edit, example.org "Open https://example.org/a", foo.test "Open http://foo.test/b"]
case 12 career:situation:Plain ... [{"id":"edit","label":"Edit"}]
case 14/18 order undefined career:order:0=Review, first/- | career:order:1=Review/- | career:order:2=Ship/Q3
case 14 targets order:0 {"task":"Review","nth":0}, order:1 {"task":"Review","nth":1}, order:2 {"task":"Ship","nth":0}
case 17 next:0 goal:0 situation:0,0 order:0,0,0 7      (no action on any row, 7 targets)
case 19 ["career:next","career:goal","career:situation:","career:situation:a","career:order:0","career:order:1","career:role:lead","career:role:other","career:funding"] true false
case 19 empty fact {"id":"career:situation:",...,"actions":[{"id":"edit","label":"Edit"}],"plain":true}
case 2 next Next calendar career:next=FWO Senior/2026-11-17, in 23 days/-
case 2 goal / situation PhD, Past, Now, Also with their values as tails / order career:order:0=ERC Starting Grant/Oct 2027/-

$ git show a5387bdc:config/text/views/shared/entry-form.yml   (line 19)
        edit_done: Close editor
$ git show a5387bdc:src/lib/views/boards/focus/career/CareerPanel.svelte   (line 126)
                    label={open ? t('entry_form.edit_done') : t('entry_form.edit')}
$ npx eslint src/lib/views/boards/focus/CommandCenterView.svelte src/lib/views/boards/focus/career/CareerPanel.svelte
EXIT 0   (eslint.config.js sets 'svelte/comment-directive': ['error', { reportUnusedDisableDirectives: true }], so each of the two no-unsafe-call directives suppresses a real report)
```

The builder's case-run program `<scratchpad>/o74/cases.test.ts` was not rerun as a file: its `../../src` imports need it inside the tree at `tests/zz-o74/`, and this review writes no file into a tree. Every case it printed was rerun above through `npx tsx -e`, and each matches its output.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `FoldKey = 'career' | 'command' | 'tasks'` (`focus.ts:536`), `Focus.svelte:173-179` passes `open={foldOpen(folds, 'career')}` and `ontoggle={() => fold('career')}`, the local `unfolded` is gone, the body is `hidden={open ? false : 'until-found'}` with `onbeforematch={unfold}` (`CareerPanel.svelte:199-204`), and the head comment says all three sections start open (`Focus.svelte:24-27`). The case 1 run is green.
- 2: holds. The box is `{@render box('purple', content)}` (`CareerPanel.svelte:225`), and the editor spans both columns (`.body.wide { column-span: all }`, `:241-244`). The `<style>` block holds only `.body.wide`. No `.sections`, `.facts`, `.order`, `.when`, `Table` or `.career` rule is left. See Behaviour 1 for the padding of a folded body.
- 3: holds. The groups, rows, tails, tones, the note line and the ids reproduce in the runs above. `nextLine`, `recordTable` and `career_next_line` are gone (grep C prints nothing), and `daysLeft` is exported (`career.ts:32`).
- 4: holds. `careerAt` is in `career-text.ts`; `findCareer` and the re-exported `CareerAt` are in `draft-entry.ts`, whose head comment names both text-rule files; boundaries gains the one line; `openFound` is exported and used by `openEntry` and `CareerPanel.pick`; `onsaid` comes from Focus. Runs: cases 3, 4, 5, 20 and 23.
- 5: holds. `openOn` goes from `EntryEditor` to `EntryForm`, `data-field` and `{@attach}` sit on the named row only, Open link buttons come from `linkActions` (case 12 run), and `act` calls `window.open(address, '_blank', 'noopener,noreferrer')` (`CareerPanel.svelte:172-177`).
- 6: holds. `roleBoard` uses `boardRows`/`boardRuleOf` and `isBoard` = `viewFor(view)?.group === 'projects'`, which is the group of every `boardRegistration` (`Projects.svelte:8-27`). A role with no board is plain; Funding goes to `openView('funding')`. Runs: cases 9 and 21.
- 7: holds. The `edit` snippet is FoldHead's `end` (`CareerPanel.svelte:180-198`). The label is `entry_form.edit_done`, which is "Close editor", today's label (base `CareerPanel.svelte:126`, `entry-form.yml:19`). `toggle` unfolds and opens when folded, and asks before closing over unsaved edits. The brief's word "Done" is Spec 1.
- 8: holds. HELP.md:287 is rewritten to the banner as built, with every sentence the brief lists. The four keys are added and `career_next_line` removed; keys.test passes. The head comments of the changed files are true on reading, and `FoldHead.svelte:2-13`, `form-draft.ts:1-4`, `page-file.ts:1` and `Ticker.svelte:1-14` are still true.
- 9: holds. `TickerGroup.svelte` holds the group, split and folded forms, the note lines, `after`, and `box` exported from `<script module>` (`:1-26`, `:66-70`). Every command-center group is drawn through it (`CommandCenterView.svelte:122-266`). Neither view's `<style>` keeps a box, group, heading or note-line rule. On reading, the markup matches the base group for group (see case 25).

Cases of the brief's "Cases":

- 1: met, the tsx run above.
- 2: met. The run over the hub file gives NEXT "FWO Senior" / "2026-11-17, in 23 days" with no tone, GOAL, SITUATION PhD, Past, Now and Also with their values as tails, ORDER OF WORK "ERC Starting Grant" / "Oct 2027", in that order. TRACK RECORD rows come from `recordRows` by reading. The two columns are `.box { columns: 2 22em }` by reading; the look confirms them on landing.
- 3: met, run (24, 25, 32, 37).
- 4: met, run (lines 2, 4, 6).
- 5: met. The finder gives null, and `findCareer` gives `"Now is no longer in career.yml"`, line null (run). By reading, `arrived` (`entry-file.ts:58-61`) then opens nothing beyond `openedDraft`'s tab with no line.
- 6: met, run: -3 days red, +10 amber, +14 amber, +15 none, no day no tail.
- 7: not verifiable here. By reading, the attach runs only on `field.field === openOn`; `Editor.svelte:262-271` and the person and entry pages pass no `openOn`. Settled at the look: Edit on GOAL focuses the goal field, and the other editors focus nothing.
- 8: met by reading (`toggle`, `CareerPanel.svelte:137-144`; `discarding` asks over unsaved edits). The look confirms on landing.
- 9: met, run.
- 10: met by reading. `make.view` gives Funding the target `{kind:'view', view:'funding'}` and no actions; role rows carry no actions (run, case 19 record rows). The look confirms the press.
- 11: met by reading. `record === null` gives no rows, so `recordRows` returns []; `career === null` draws nothing (`CareerPanel.svelte:223`).
- 12: met. The run gives the actions with the expected ids, labels and titles. By reading, `act` opens the address, and the act button is separate from the `.name` button (`Ticker.svelte:76-93`, `:106-121`), so the row's own press is not taken.
- 13: not verifiable here. Settled at the look: a fresh Focus tab shows the banner open, and a fold survives a reload.
- 14: met for the ids and ranks (run: order:0/1/2 with nth 0, 1, 0). The carets at lines 24, 25, 32 and 37 are settled at the look.
- 15: not verifiable here. By reading, `openEntry` calls `openFound` with `findEntry`, the same sequence `editInFile` ran. Settled at the look: Edit in File on a Funding card.
- 16: not verifiable here. `roleBoard` gives lead->projects (run). Settled at the look: a press on Lead.
- 17: met. The run over the demo fixture gives no action on any row and 7 targets. By reading, the press uses `viewSourceFile('career', ...)` (`CareerPanel.svelte:96`), and the heading has no Edit (`end={page === null ? undefined : edit}`).
- 18: met, run ("Ship" alone; `order_note: ""` gives no note).
- 19: met, run: unique, none empty; the empty-label fact is plain.
- 20: met, run (line 26).
- 21: met, run.
- 22: partial, Spec 1. The editor takes the place of the groups (`CareerPanel.svelte:205-219`). The heading row reads "Close editor", today's label, where the case says "Done".
- 23: met, run.
- 24: not verifiable here. By reading, `onbeforematch={unfold}` calls `ontoggle` when folded. Settled at the look.
- 25: not verifiable here. By reading, every group's markup, classes, order and Ticker props match the base. The box changes from `section.week` to `section.box` with `style="--edge: var(--c-red)"` under the same rules, and no global selector names `.week`. Settled at the look against the screenshot taken before landing.
- 26: met, run (11 passed; the one-line diff above).

## 1. Spec

- `src/lib/views/boards/focus/career/CareerPanel.svelte:183`: `label={editorOpen ? t('entry_form.edit_done') : t('entry_form.edit')}`.
  - What is wrong: item 7 and case 22 say the heading row reads "Done" while the editor is open, "as today". Today's label is `entry_form.edit_done`, "Close editor" (`git show a5387bdc:config/text/views/shared/entry-form.yml`, line 19; base `CareerPanel.svelte:126`). The builder kept today's label and said so in its first line. The brief's word is the error.
  - Failure scenario: the look on landing is read against case 22 and finds "Close editor", which the case calls wrong. Or a landing fix renames the label to "Done", which also changes no other caller, since `edit_done` has this one reader (`grep -rn edit_done src`), but is a word change no ruling asks for. The orchestrator corrects case 22's text, or decides on the word.
  - Verdict: case 22 partial.
- `<scratchpad>/o74/rewrap.py` (the builder's scratch folder, named by its report; written 13:26, between `cases.test.ts` 13:24 and `quick1.txt` 13:28): `# rewrap the leading line-comment paragraphs (the head comment) of a file at 100 columns ... open(p,'w').write('\n'.join(out))`.
  - What is wrong: this is a script that rewrites a source file's head comment. The brief does not build it under "What to build", and `grep -n -i rewrap .scratch/migration/plan.md` finds no line of the Rulings that approves it. The brief's script paragraph forbids it, and the report does not name it. Whether it was run on the step's files is not verified: the rewrapped head comments read the same whichever way they were made.
  - Failure scenario: an unapproved script that writes the head comments of the step's files lands without the user's ruling. Per the refute skill's dispositions, this goes to the user as an open item, and the head comments it may have produced are not relied on until he rules.

## 2. Proof

- `.scratch/migration/agents/reviews/O74-report.md`, DONE rows 2 and 9: "`grep -n "sections\|facts\|class=\"order\"\|\.when\|Table\|\.career" ...CareerPanel.svelte` prints nothing" and "`grep -n "\.week\|\.grp\|...` ... prints nothing".
  - What is wrong: the rerun prints 4 lines and 16 lines (see Verification). The `.` in the patterns matches any character, so they hit `career`, `grp_` and `category` in code. The substance holds by reading both `<style>` blocks, so items 2 and 9 still hold, but the quoted proof is false as written. The same report cites `toggle` at `:121-130` (row 7); it stands at `CareerPanel.svelte:137-144`.
  - Failure scenario: the orchestrator reruns the quoted greps at landing, sees output where the report promised none, and either loses trust in the row or treats it as red.
  - Verdict: none.

## 3. Standards

- The report's "Runs" section: "it lived only as `tests/zz-o74/cases.test.ts` for the length of each run and in the scratchpad ... It imports `foldOpen`, ...".
  - What is wrong: the rules file ("What every package obeys", the case-run program paragraph) and ruling 262 (`plan.md` "Open item 262") ask that the program's source and its output be quoted in the report, and that a file it needs live in the scratchpad or the base copy. The report quotes the output, gives the source only as a scratchpad path with a one-sentence summary, and ran the file from inside the step's worktree (`tests/zz-o74/`), a tree path.
  - Failure scenario: once the session's scratchpad is cleared, a later reader of the ledger cannot rerun or even read the program the case results rest on. And a run interrupted while the file sits in `tests/` leaves an untracked test file in the worktree, which the landing's cherry-pick or the quick tier's change detection then picks up.
- The report's "Runs" section: "`npx vitest run --dir <scratchpad>/o74 --project unit` ... spawned workers for over five minutes, and was stopped".
  - What is wrong: the rules file ("Token discipline") calls `npx vitest run` with no file named a whole-suite command and makes it a finding of the review. This one named no file, and the report itself says it may have run the tree's tests.
  - Failure scenario: on a machine running several suites at once, a five-minute unbounded run competes with them (the rules file's reason for the ban), and its results, if any, were not read.
- The report's "Runs" section: "The verify list ... ran twice ... Changes made after the first run ... needed the second run".
  - What is wrong: the rules file ("Token discipline") runs the list once, after the last change. A second run is allowed only after fixing a red line, and the first run was green and was not after the last change. That makes it a run beyond what the paragraph allows.
  - Failure scenario: each extra run of the list costs about 40 s and its tokens with no new information. The rule exists to stop that.

## 4. Behaviour

- `src/lib/views/boards/focus/career/CareerPanel.svelte:239-244`: `.body.wide { column-span: all; padding-top: 4px; }`, with `class:wide={editorOpen && page !== null}` and `hidden={open ? false : 'until-found'}` on the same element (`:199-204`).
  - What is wrong: the base drew the body's top gap only while shown (`.body:not([hidden]) { padding: 4px 0 0; }`, base `CareerPanel.svelte:263`). Its comment said why: a body hidden until found still draws its padding and would make the folded box taller than the command center's. The new rule has no `:not([hidden])`, so a banner folded while its editor is open draws a 4px band under the heading row. The report's before-and-after does not state this.
  - Failure scenario: open the banner's editor (heading Edit or a row's Edit), then fold the banner with its fold control. `editing` stays true, so the folded banner stands 4px taller than the folded command center under it.
  - Verdict: none (items 1 and 2 hold otherwise). Fixed by `.body.wide:not([hidden])` for the padding.

## Declined to judge

- The Svelte build (`vite build`) over the `<script module>` export of the `box` snippet was not run. The brief's stop names "the type check or the build", and a build writes into the tree, which this review does not do. svelte-check accepts it (0 errors). Settled by the build run at landing in the gate worktree.
- The exact eslint message behind the two `eslint-disable-next-line @typescript-eslint/no-unsafe-call` comments (`CommandCenterView.svelte:265`, `CareerPanel.svelte:224`) was not seen, since seeing it needs the comment removed. That each directive suppresses a real report follows from `svelte/comment-directive`'s `reportUnusedDisableDirectives: true` and eslint exiting 0. On the suppression itself: `eslint.config.js`'s header states the tree's standard ("a rule that is merely inconvenient at a site is on, and the site carries a disable comment naming the reason"), and the tree carries about 230 such reasoned site disables. Brief decision 8's stop names only a refusal by the type check or the build, and neither refused. So I count it as no finding. Whether a typed form without the disable exists (a wrapping box component, which decision 8 set aside) is the orchestrator's call.
- `duplication.test.ts` red on `Data.svelte:64`/`Venues.svelte:77` was not run on the base: the base copy holds no `node_modules`, and a run would write caches into a tree. By grep, the same six lines sit in the same two files on the base, neither file is in the step's diff, and the test and `allow-duplication.txt` are unchanged. So the red is not the step's, as the rules file's "Verify before you report" counts it.
- Whether `rewrap.py` was run, and on which files: nothing on disk records a run (Spec 2).
- What the builder's `--dir` vitest run executed: not recoverable after the fact (Standards 2).
- Cases 7, 13, 14 (carets), 15, 16, 24 and 25, and the columns of case 2, need a DOM. They are left to the look on landing as each verdict says.

Reviewer usage: addf65e05d5a93f7d, claude-opus-5-5, 283500 tokens, 78 tool uses, 15 min 34 s.