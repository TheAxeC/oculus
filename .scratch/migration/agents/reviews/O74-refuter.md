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

## Repair round 1, refuted

```
$ git diff a5387bdc --stat -- docs/diagrams | tail -1; shasum docs/diagrams/* | shasum      (before the run)
 6 files changed, 16 insertions(+), 16 deletions(-)
b3d6b7c309b4ee0d11f6bf2898de94bbdd76a916  -
$ npm run diagrams && npm run test:quick -- --base a5387bdc        (once; EXIT 0)
test:quick: 23 changed file(s), from git since a5387bdc
test:quick: 3 test file(s)
        tests/checks/tree/boundaries.test.ts: changed
        tests/data/sources/career.test.ts: named for a changed file
        tests/state/boards/board/board-rules.test.ts: imports at depth 1
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.5 s)
ok      vitest (11.4 s): Duration  3.94s (transform 3.92s, setup 0ms, import 5.48s, tests 430ms, environment 0ms)
ok      vitest checks (14.2 s): Duration  6.78s (transform 783ms, setup 0ms, import 2.83s, tests 3.83s, environment 0ms)
ok      eslint (18.6 s)
ok      svelte-check (20.9 s): 1792934164924 COMPLETED 538 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 23.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
(after the run: the same stat line and the same digest b3d6b7c3...; git status --short lists the same 23 paths)
$ sh utils/folder-check.sh; echo "folder-check exit $?"
folder-check exit 0
$ diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O74-base/unused-exports.txt <(sh utils/unused-exports.sh); echo "unused-exports diff exit $?"
unused-exports diff exit 0
$ LC_ALL=C grep -n '[^ -~]' <the 15 changed and new source files, the report, docs/diagrams/*.dot>; echo "ascii grep exit $?"
ascii grep exit 1
$ npx vitest run tests/state/forms/form-draft.test.ts tests/state/forms/page-entry.test.ts tests/state/client/held-unsaved.test.ts tests/state/sessions/source/source.test.ts
 Test Files  4 passed (4)
      Tests  85 passed (85)
$ npx vitest run tests/checks/tree/boundaries.test.ts
 Test Files  1 passed (1)
      Tests  11 passed (11)
$ diff .agents/worktrees/O74-base/tests/checks/tree/boundaries.test.ts tests/checks/tree/boundaries.test.ts   (absolute base path)
309a310
>         'data/helpers/files/yaml/career-text',
$ npx vitest run tests/checks/source/history.test.ts --testTimeout 0
 Test Files  1 passed (1)
      Tests  6 passed (6)

Commands the round's report quotes as evidence:
$ grep -n "function toggle" src/lib/views/boards/focus/career/CareerPanel.svelte
137:    function toggle(): void {
$ for f in CareerPanel.svelte CommandCenterView.svelte; do ...selector lines...; ...grep -nE '\.(week|grp|category|lbl|sub|career|sections|facts|order|when)\b|Table'; echo "grep exit $?"; done   (as quoted, whole)
== src/lib/views/boards/focus/career/CareerPanel.svelte, selector lines of the <style> block
    .body.wide {
    .body.wide:not([hidden]) {
== ..., old box/group/section rules in the <style> block
grep exit 1
== src/lib/views/boards/focus/CommandCenterView.svelte, selector lines of the <style> block
    .behind {
    .lead {
    .behind > .link,
    .behind > .more {
    .link {
    .link:hover,
    .link:focus-within {
== ..., old box/group/section rules in the <style> block
grep exit 1
$ git diff --stat a5387bdc -- docs/diagrams | tail -1
 6 files changed, 16 insertions(+), 16 deletions(-)
$ diff .agents/worktrees/O74-base/unused-exports.txt <(sh utils/unused-exports.sh); echo "unused-exports diff exit $?"   (as quoted, from the worktree root)
diff: .agents/worktrees/O74-base/unused-exports.txt: No such file or directory
unused-exports diff exit 2
$ LC_ALL=C grep -n '[^ -~]' src/lib/views/boards/focus/career/CareerPanel.svelte .scratch/migration/agents/reviews/O74-report.md; echo "ascii grep exit $?"
ascii grep exit 1
$ wc -l src/lib/views/boards/focus/career/CareerPanel.svelte
     250

The round's delta (Over a repair round 3):
$ for p in files.txt paths: diff -u migration-O74-round-1/<p> migration-O74/<p> | wc -l
src/lib/views/boards/focus/career/CareerPanel.svelte: 20 lines; every other path of files.txt: 0
(paths changed now that files.txt does not list: .scratch/migration/agents/reviews/O74-report.md, untracked, and the orchestrator's briefs/O74-round1.md)

Item 1, the programs section against the builder's transcript (subagents/agent-a3f212aba186ea413.jsonl, read with jq):
every Bash call of the first build at the 36 timestamps of P1 to P38 that quote a command: diff of the transcript's command
(less its leading "cd <worktree> && ") against the report's code block: 0 differing lines for each of the 36.
P22's heredoc body (transcript call 12:24:25, lines 2-65) | shasum: 4a19c9a995a1ecceb1a8c730dbe9bc89a8e9a250
Write calls of the first build: 12:16:16 career-text.ts, 12:18:03 career-rows.ts, 12:18:54 TickerGroup.svelte, 12:19:56 CareerPanel.svelte.
Every other first-build Bash call (12:08:18, 12:14:06, 12:15:30, 12:15:43, 12:22:03, 12:25:36, 12:26:08, 12:28:32, 12:29:59,
12:30:20, 12:32:07, 12:32:22, 12:32:54, 12:33:20, 12:35:50) reads only; none writes a file.
Round 1 calls: one Edit of CareerPanel.svelte (13:03:10), Edits of the report, one test:quick run (13:04:22); no python3, sed -i, perl, awk or redirect into a file.
$ git diff -U0 a5387bdc | grep -E "^(\+\+\+|@@)"   (every hunk compared with the listed ranges)

Item 2:
$ shasum $S/o74/cases.test.ts; wc -l
4a19c9a995a1ecceb1a8c730dbe9bc89a8e9a250, 64 lines
$ diff <(sed -n '1571,1634p' O74-report.md) $S/o74/cases.test.ts; echo $?
0
A1 (report lines 1459-1491) against the transcript call 12:15:00: diff exit 0. A2 (1499-1563) against 12:23:37: diff exit 0.
```

The quoted case run `npx vitest run tests/zz-o74/cases.test.ts` was not rerun, since it needs the program copied into the worktree's `tests/` (see Declined).

### Verdicts

Items of the brief's "What to build":

- 1: holds. `FoldKey = 'career' | 'command' | 'tasks'` (`focus.ts:536`), `Focus.svelte:173-179` passes `open={foldOpen(folds, 'career')}` and `ontoggle={() => fold('career')}`, the head comment `Focus.svelte:24-27` says all three start open, and the body is `hidden={open ? false : 'until-found'}` with `onbeforematch={unfold}` (`CareerPanel.svelte:199-204`). Unchanged in the round (empty delta for `focus.ts` and `Focus.svelte`).
- 2: holds. `{@render box('purple', content)}` (`CareerPanel.svelte:225`), and the box's rules live only in `TickerGroup.svelte:120-180`. CareerPanel's `<style>` holds `.body.wide { column-span: all; }` (`:240-242`) and `.body.wide:not([hidden]) { padding-top: 4px; }` (`:247-249`), the base's guard (`O74-base/.../CareerPanel.svelte:261-265`, `.body:not([hidden])`). The item 3 grep reruns print nothing.
- 3: holds. The row builder `career-rows.ts` is unchanged since the round was sent (empty delta), and the first refutation's `tsx` runs over it reproduced the groups, tails, tones and ids. `nextLine`, `recordTable` and `career_next_line` are gone (verify list green, keys test in `vitest checks`).
- 4: holds. `careerAt` (`career-text.ts:86-101`), `findCareer` and `answered` (`draft-entry.ts:98-136`), `openFound` (`entry-file.ts:91-107`), the one boundaries line (diff above, 11 passed).
- 5: holds. `openOn` goes from `EntryEditor.svelte:61-65,212` to `EntryForm.svelte:45-46,59-67,110`; `linkActions` (`career-rows.ts:91-100`); `act` calls `window.open(address, '_blank', 'noopener,noreferrer')` (`CareerPanel.svelte:172-177`).
- 6: holds. `roleBoard` (`career.ts:109-124`) over `boardRows` and `boardRuleOf`; a role with no board is `plain` (`career-rows.ts:135-139`).
- 7: holds. The `edit` snippet is FoldHead's `end` (`CareerPanel.svelte:180-198`), `toggle` at `:137-144` unfolds a folded banner and opens the editor, and asks before closing over unsaved edits. The label is "Close editor", today's label (see the finding on case 22).
- 8: holds. `docs/HELP.md:287` rewritten, the four new keys and the removed key in `focus.yml:18-26`, the head comments true on reading; the round's new comment at `CareerPanel.svelte:239,244-246` is true (see the finding on its history-word grep).
- 9: holds. `TickerGroup.svelte` holds the group, the split and folded forms, the note lines, `after`, and `box` exported from `<script module>` (`:1-26`, `:66-70`); svelte-check 0 errors; neither view's `<style>` keeps a box, group, heading or note-line rule (item 3 grep reruns).

Cases of the brief's "Cases":

- 1: met. The first refutation's run (`true {"x":1,"closed":["tasks","career"]} true true`) over `focus.ts`, which the round did not change.
- 2: met for the groups, rows, tails and order (the first refutation's run over the hub file; `career-rows.ts` unchanged); the two columns are `.box { columns: 2 22em }` by reading, seen at the look.
- 3: met (lines 24, 25, 32, 37; first refutation's run, `career-text.ts` unchanged).
- 4: met (lines 2, 4, 6; same).
- 5: met. The finder gives null and `findCareer` "Now is no longer in career.yml", line null (same); `arrived` then opens the tab with no line, by reading.
- 6: met (-3 days red, +10 amber, +15 none, no day no tail; same).
- 7: not verifiable here. By reading, the attach runs only on `field.field === openOn` (`EntryForm.svelte:110`), and the person page, the entry page and `Editor.svelte:262` pass no `openOn`. Settled at the look.
- 8: met by reading (`toggle`, `CareerPanel.svelte:137-144`; `discarding`). The look confirms.
- 9: met (first refutation's run; `career.ts` unchanged).
- 10: met by reading: Funding gets `{kind:'view', view:'funding'}` and no actions; role rows get no actions (`career-rows.ts`, `builder().view`).
- 11: met by reading (`recordRows` returns [] for a null record; `career === null` draws nothing, `CareerPanel.svelte:223`).
- 12: met (first refutation's run of the actions; `act` opens the address, its button separate from the row's press).
- 13: not verifiable here. Settled at the look: a fresh Focus tab shows the banner open, and a fold survives a reload.
- 14: met for the ids and ranks (run); the carets at lines 25, 24, 32 and 37 are settled at the look.
- 15: not verifiable here. By reading, `openEntry` calls `openFound` with `findEntry` (`entry-file.ts:138-139`). Settled at the look on a Funding card.
- 16: not verifiable here. `roleBoard` gives lead to projects (run). Settled at the look.
- 17: met (run over the demo fixture: no action on any row, 7 targets; heading `end` undefined with no `page`).
- 18: met (run: "Ship" alone, no note line for `order_note: ""`).
- 19: met (run: unique, none empty, the empty-label fact plain).
- 20: met (run: line 26).
- 21: met (run: "projects").
- 22: partial, Findings 1. The editor takes the groups' place (`CareerPanel.svelte:205-219`); the heading row reads "Close editor" where the case says "Done".
- 23: met (run: lines 1 and 3).
- 24: not verifiable here. By reading, `onbeforematch={unfold}` calls `ontoggle` when folded. Settled at the look.
- 25: not verifiable here. By reading, the command center's groups, classes and ticker props match the base. Settled at the look against the screenshot taken before landing.
- 26: met (rerun above: 11 passed, the one-line diff).

### Findings

- Spec, case 22: `src/lib/views/boards/focus/career/CareerPanel.svelte:183`: `label={editorOpen ? t('entry_form.edit_done') : t('entry_form.edit')}`.
  - What is wrong: the case says the heading row reads "Done" while the editor is open. Today's label is `entry_form.edit_done`, "Close editor", and the builder kept it. The round brief's "Not sent" rules this the brief's error, to be corrected in the booking at landing. It is carried from the first refutation's Spec 1 so the verdict has its finding.
  - Failure scenario: the look on landing, read against case 22 as written, finds "Close editor" and calls it wrong.
  - Verdict: case 22 partial.
- Spec, round item 2 (ruling 262): the report's "Case-run programs" section: "Their imports are relative (`../../src/...`), so each runs only from a copy two folders under a tree's root; in the first build each was run from `tests/zz-o74/` inside the worktree".
  - What is wrong: the source of B, A1 and A2 is quoted whole and verbatim (diff exit 0 against the scratchpad file and the transcript). But item 2 also says "It runs from the scratchpad or the base copy, never from the worktree's `tests/`", and ruling 262 says the program's files live in the scratchpad or the base copy. The report gives no way to run B from either place. With `../../src` imports, a copy in the scratchpad resolves nothing, a copy in `O74-base/tests/` runs the base's code, and the only working form is the one the item forbids. The round's DONE row 2 does not mention this, and the round ran no case-run program.
  - Failure scenario: a reviewer or the orchestrator who wants to rerun the cases from the report alone has to write the file into the worktree's `tests/` or rewrite its imports. This reviewer could not rerun it under its rules. The case verdicts above rest on the first refutation's `tsx` reruns over code the round did not change.
  - Verdict: none on the brief's items or cases.
- Proof, round item 1: the report's "Programs of the first build", the preamble ("Three files were written whole with the Write tool ... `career-text.ts` (12:16:16), `career-rows.ts` (12:18:03), `TickerGroup.svelte` (12:18:54) and `CareerPanel.svelte` (12:19:56)" and "no hunk lies in a line no program or Write call wrote"), and P5 "Today: ... `:24-27`" and P15 "`EntryForm.svelte` ... `:63-67`".
  - What is wrong: the transcript has four Write calls, and the preamble names four files but says three. Two hunks of `git diff -U0 a5387bdc` reach one line past every listed range:
    - `draft-entry.ts` `@@ -21,0 +25,4 @@` is lines 25-28. Line 24 is the unchanged `import type { SourceStore }`, and line 28, a blank line, is outside `:24-27`.
    - `EntryForm.svelte` `@@ -52,0 +63,6 @@` is lines 63-68. Line 68, a blank line, is outside `:63-67`.
  - Both blank lines are in the text P5 and P15 quote, so no unlisted program wrote them. Every other hunk lies inside a listed range or a Write-made file, and every quoted command matches the transcript (36 of 36, 0 differing lines).
  - The decision that rests on this: the orchestrator's hunk-by-hunk read under ruling 377 (a). It loses no content, since both lines are blank.
  - Failure scenario: the orchestrator walking the hunks by the listed ranges finds two hunks that overrun their range by one line and has to settle them by hand.
  - Verdict: none.
- Proof, round report "Verify, once after the last change": `$ diff .agents/worktrees/O74-base/unused-exports.txt <(sh utils/unused-exports.sh); echo "unused-exports diff exit $?"` followed by `unused-exports diff exit 0`.
  - What is wrong: run as quoted from the worktree's root, it prints `diff: .agents/worktrees/O74-base/unused-exports.txt: No such file or directory` and `unused-exports diff exit 2`. The transcript (13:04:57) shows the builder ran it with the absolute path `/Users/axelfaes/workspace/oculus/.agents/worktrees/O74-base/unused-exports.txt`, which gives exit 0 on this rerun.
  - In the same way, the quoted `$ npm run diagrams && npm run test:quick -- --base a5387bdc` was run as `npm run diagrams 2>&1 | tail -3; echo ...; npm run test:quick -- --base a5387bdc 2>&1 | tail -20; ...` (13:04:22). Its result is the same, since the diagrams step passed.
  - The decision that rests on this: Verify 2, no new unused export, which holds on the absolute-path rerun.
  - Failure scenario: the orchestrator reruns the line as quoted at landing, sees exit 2 where the report shows 0, and treats the row as red.
  - Verdict: none.
- Standards, `src/lib/views/boards/focus/career/CareerPanel.svelte:244-246`: "The gap is drawn only while the body is shown, since a body hidden until found still draws its padding and would make the folded box taller than the command center's."
  - What is wrong: the round changed this comment. The rules file ("What every package obeys", the rule on history in comments) asks the report to quote a grep of the changed comment lines for the history words, with each hit judged. The round report quotes none. The grep hits "still" at `:245`. Read in place, it means "even so" and compares with no earlier state, so the comment is fine. The base carried the same sentence, and `history.test.ts` passes 6 of 6. Only the missing record is the defect.
  - Failure scenario: a reader of the report cannot tell whether the round's comment was checked for history wording.
  - Verdict: none.

Item 4 of the round is closed: `.body.wide:not([hidden]) { padding-top: 4px; }` restores the base's `.body:not([hidden])` guard for the open editor, `column-span: all` stays on `.body.wide`, and the comment says why. The delta changes nothing else in code, so it is a fix that reaches no further than the finding. Item 3 is closed: both replaced greps and the `toggle` place reproduce as quoted.

### Declined to judge

- The case-run programs were not rerun. The quoted command `npx vitest run tests/zz-o74/cases.test.ts` needs the file copied into the worktree's `tests/`, and this review writes no file into any tree and writes no script (an inline `tsx -e` program included). The case verdicts rest on the first refutation's reruns. The files those runs exercised are byte-identical between the round's snapshot and the worktree: `focus.ts`, `career.ts`, `career-text.ts`, `draft-entry.ts`, `career-rows.ts` and `entry-file.ts` each have an empty `diff -u`.
- The height of a banner folded with its editor open, against the folded command center, needs a DOM. Settled at the look: open the editor, fold the banner, and compare its folded height with the folded command center's.
- The Svelte build (`vite build`) over `TickerGroup.svelte`'s `<script module>` export was not run, since a build writes into the tree. Settled by the build at landing in the gate worktree.
- DONE row 2 of the first section writes its grep inside a Markdown table with each `|` escaped as `\|`. Whether a reader copying the raw line gets a different ERE was not tested. The unescaped form in the round's item 3 code block is the one rerun above.
- Cases 7, 13, 14 (the carets), 15, 16, 24 and 25, and the columns of case 2, need a DOM. They are left to the look on landing, as each verdict says.

Reviewer usage: a74e72616216affa3, claude-opus-5-5, 260455 tokens, 50 tool uses, 8 min 9 s.

## Closed (the orchestrator's disposition of every finding above)

First run:
- Spec 1 (case 22, "Done"): the brief's error; today's label is "Close editor" (`entry_form.edit_done`), kept. Corrected in the booking at landing; no code change.
- Spec 2 (the builder's unapproved programs): closed under ruling 377 (a) and the standing ruling "Unapproved builder scripts": the breach recorded in the booking, the programs listed in round 1 (P1 to P38 of the report), every hunk of the diff read by the orchestrator against the brief and kept; the review over round 1 found every quoted command equal to the transcript (36 of 36) and no hunk outside the listed ranges but two blank lines.
- Proof 1 (two greps and a line cite): closed in round 1 (item 3); the review over the round reproduced both greps and `toggle` at `:137`.
- Standards 1 (case-run source not quoted): closed in round 1 (item 2), sources quoted whole and verbatim.
- Standards 2 (the `--dir` run) and Standards 3 (the verify list run twice): recorded in the booking.
- Behaviour 1 (the folded banner's 4px): closed in round 1 (item 4), `.body.wide:not([hidden])`.

Over round 1:
- Spec, case 22: as Spec 1 above.
- Spec, round item 2 (the case-run program runs only from the worktree's `tests/`): recorded in the booking; the case verdicts rest on both reviewers' `tsx` reruns over code the round did not change.
- Proof, round item 1 (the preamble says three Write calls for four files; two hunks one blank line past their ranges): recorded in the booking; both lines are blank, quoted in P5 and P15, no content lost.
- Proof, the quoted unused-exports line with a relative path (exit 2 as quoted; exit 0 with the absolute path the builder ran): recorded in the booking; Verify 2 holds.
- Standards, the round's comment without its history-word grep: the grep hits "still" at `CareerPanel.svelte:245`, read in place as "even so", compared with no earlier state; the comment is kept; recorded in the booking.
