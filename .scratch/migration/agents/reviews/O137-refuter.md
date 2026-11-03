# Step O137 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O137, base 6779731e1)

This report cites a page (the rules file, a standard, a skill's text) by its section, not by a line number, because a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets.

## Verification (rerun by the reviewer)

```
$ uptime
21:25  up 1 day,  5:28, 1 user, load averages: 5.51 6.73 9.56

Check 1, first run: npx vitest run --reporter=dot <the brief's 16 files> <the report's 34 importer files>   (50 files)
 Test Files  5 failed | 45 passed (50)
      Tests  17 failed | 1243 passed | 9 skipped (1269)
   Duration  176.20s
21:29  load averages: 14.97 10.75 10.57
Check 1, second run, the same 50 files, whole output kept:
 Test Files  4 failed | 46 passed (50)
      Tests  28 failed | 1232 passed | 9 skipped (1269)
   Duration  215.41s
21:34  load averages: 13.68 14.13 12.35
  failing files: tests/data/hubs/hub-portfolio.test.ts (10), tests/routes/edit/config-key.test.ts (5),
  tests/routes/edit/undo/config-save.test.ts (7), tests/server/edit/config-value.test.ts (6);
  every error line: "Error: Test timed out in 5000ms." (22 of them); no AssertionError or other error.
  None of the four files is changed by the step.
Each rerun alone (npx vitest run --reporter=dot <file>):
== tests/data/hubs/hub-portfolio.test.ts        (21:34 load 12.04)  Test Files  1 passed (1)  Tests  16 passed (16)
== tests/routes/edit/config-key.test.ts         (21:35 load 9.51)   Test Files  1 passed (1)  Tests  14 passed (14)
== tests/routes/edit/undo/config-save.test.ts   (21:36 load 8.17)   Test Files  1 passed (1)  Tests  13 passed (13)
== tests/server/edit/config-value.test.ts       (21:36 load 7.15)   Test Files  1 passed (1)  Tests  23 passed (23)
(Every changed test file and every file the brief names, except the unchanged config-value.test.ts, passed in both runs.)

Check 2: npm run diagrams (exit 0; cmp of all 18 docs/diagrams/* files against a copy taken before: none changed), then npm run test:quick once:
test:quick: 36 changed file(s), from git since HEAD
test:quick: 228 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.1 s)
ok      eslint (2.9 s)
ok      svelte-check (11.4 s): 1793738255977 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (151.8 s): Duration  137.32s (transform 89.23s, setup 0ms, import 167.23s, tests 282.63s, environment 5ms)
FAILED  vitest (163.6 s)
 Test Files  167 passed | 44 skipped (212)
      Tests  2539 passed | 590 skipped (3185)
     Errors  1 error      ("Error: [vitest-pool]: Worker forks emitted error." / "Caused by: Error: Worker exited unexpectedly"; no test failed, 211 of 212 files reported)
ok      vitest slow (244.1 s): Duration  230.76s (transform 24.49s, setup 0ms, import 126.21s, tests 785.92s, environment 12ms)
test:quick: 246.4 s; failed: vitest
21:41  load averages: 13.88 13.42 12.41
The unit stage rerun alone, same 212 files and flags (node node_modules/vitest/vitest.mjs run <files> --tagsFilter '!slow' --no-isolate --reporter=dot --configLoader runner --experimental.fsModuleCache --passWithNoTests):
 Test Files  168 passed | 44 skipped (212)
      Tests  2595 passed | 590 skipped (3185)
exit 0   (21:42 load 8.98, 21:43 load 10.43)

Check 3, the rules file's gate over the changed files (git status paths, the deleted file and the .svg left out):
exit 0, nothing printed
  whole-tree form ... $(find src tests bin config -type f ! -name local.yml):
find: bin: No such file or directory
exit 0, no line of a file

Check 4: sh utils/unused-exports.sh (exit 0), diff against ../O137-base/unused-exports.txt:
326c326
< src/lib/state/workbench/ui.svelte.ts: CardMove, OwnedInstance, TerminalOwner, PaneStripKey
---
> src/lib/state/workbench/ui.svelte.ts: OwnedInstance, TerminalOwner, PaneStripKey

Check 5: sh utils/folder-check.sh: nothing printed, exit 0.
  wc -l: index.ts 874, hub-names.ts 857, run.ts 611, Collection.svelte 447, Present.svelte 518, EntryCard.svelte 328,
  schema-rules.test.ts 786, board-rules.test.ts 823 (all at or under 880 / 520)

Check 6: grep -rn 'requestCardMove\|cardMoveRequested\|CardMove\|moveCard\|fileOrder\|pinnedFirst\|reorder_hint\|grip_glyph\|move_left\|move_right\|ondragfrom\|ondropon' src tests docs config --exclude=local.yml
exit 1, nothing printed

Check 7: grep -n "cardOrder(part.collection.entries, part.collection.sort, part.schema)" src/lib/views/boards/collection/Collection.svelte
158:            cardOrder(part.collection.entries, part.collection.sort, part.schema)
219:            cardOrder(part.collection.entries, part.collection.sort, part.schema)

Check 8: read; see Proof 1.

The report's case-run, rerun unchanged from the worktree root:
CASE_OUT=rev-after.txt npx vitest run --config <scratchpad>/o137/vitest.case.config.mjs
 Test Files  1 passed (1)
      Tests  1 passed (1)
  diff of the C7 lines removed: "ALL NON-C7 LINES SAME" as the report's after run (C1-C6, C8-C18, C2 hub settings identical).
  C7 differs: the research hub's applications.yml changed after the builder's run (hub commit 1c0d40fdd,
  2026-11-03 21:31:35, "Order the hub's status options by stage and mark the UGent application as interview";
  options now [active, applied, interview, offered, accepted, not-applied, declined, rejected, withdrawn]).
  The rerun's C7 order follows those options: active x5 by deadline 2026-11-04 .. 2027-01-21, applied 2026-11-01,
  interview 2026-10-27, accepted x2, not-applied x9, declined x2, rejected x8, withdrawn x3.
  The program source and its config equal the report's quoted text (diff, non-ASCII letters written by name: no difference);
  the builder's first-run.txt and after-run.txt files equal the report's quoted blocks (diff: no difference).

C16: grep -n reorderEntries src/lib/state/client/writes.svelte.ts src/lib/views/sources/files/sections/Sections.svelte
src/lib/state/client/writes.svelte.ts:429:    async function reorderEntries(collection: string, order: string[]): Promise<WriteAnswer> {
src/lib/state/client/writes.svelte.ts:846:        reorderEntries,
src/lib/views/sources/files/sections/Sections.svelte:47:        writes: { reorderEntries }
src/lib/views/sources/files/sections/Sections.svelte:111:        const answer = await reorderEntries('bookmarks', ids);
  (the same four lines on the base copy)

Further greps: movedOrder -> only slides.ts:178,188 and the terminal list's (terminal-list.ts:196, TerminalList.svelte:75,235);
Grip, "J / K", "Shift+J", "Shift+K" -> nothing; "drag"/"reorder" left in the collection view, card, state and HELP -> nothing about a collection card.
The two lists: diff of sources.yml's "  - { key:" lines and templates.md's commented list -> LISTS-EQUAL.
The six changed YAML files parse with the yaml package.
The research hub's ten card-list schemas each name every word of oculus's default sort (read of each file's schema: block).
```

## Verdicts

Items of "What to build":

- 1: holds. `sortShape` and `entryOf` at `hub-names.ts:266-267,343-347`, the `sort?: string[]` in `CollectionTraits` (`model-collections.ts:309`), and the `traitsOf` line (`collections.ts:122`). The rows of 'reads a sort that is $name' pass. The docs and the head comment name the field, but the entryOf doc is not rewrapped whole (Standards 1).
- 2: holds. `sortFindings` (`run.ts:361-379`) is called at `:575` with `HubFile.sort`, and the KEY_ROWS rows pass. `cardOrder` drops a word the schema does not name (`index.ts:811`). The run.ts head comment names the finding, but its line 13 ends short (Standards 1).
- 3: holds. The ten sorts in `sources.yml` match the brief, the six registry entries carry none, the templates list equals the sources list line for line, `data-map.md:34` names the field, and the `config/options/sources.yml` field has `control: list` and its help line.
- 4: holds. `cardOrder` replaces `pinnedFirst` (`index.ts:802-820`), and `Collection.svelte:158,219` hand it `part.collection.sort` and `part.schema`. The head comments are rewritten. See Standards 2 and Behaviour 1.
- 5: holds. Check 6's grep prints nothing. `movedOrder` is private to `slides.ts:178`, `Grip.svelte` is deleted, and the J and K branch, the `move` kind, `moveCard`, the ui store members, the `rows.ts` case, the help keys and the `GRID_KEYS` letters are all gone.
- 6: holds. The demo hub's lists name only fields of the demo schemas (applications has `[status]`, since the demo applications schema has no `deadline`). The `tasks()` helper, case 21a and the make expectations are edited as the brief says. See Proof 1.
- 7: holds. `docs/HELP.md:148` reads exactly as asked, and :279 carries the order sentence. See Behaviour 2.

Cases:

- C1: met. The row 'a list of fields' passes, and the case-run prints `C1 sort: [["status","date"]] problems: []`.
- C2: met. The rows 'a text' and 'an empty list' pass, and the case-run's C2 lines match. A hub's own text `sort` gives one finding from the snapshot and none from the merge.
- C3: met. The rows 'a map' and 'a list holding a number' pass, each with one `sort_unread` naming the value and `events`.
- C4: met. The KEY_ROWS row passes, and the case-run prints `schema: the collections entry sorts by due, a field the schema does not name; ...`.
- C5: met. The KEY_ROWS row passes, an audit as the report says.
- C6: met. The rerun gives planned 2027-03-01, planned with no date, completed 2016 up to 2026-10-29, then cancelled, then not-attending.
- C7: met against the rule. The order follows the file's status options, with deadlines oldest first and missing ones last. Since the builder's run the hub's options were reordered (hub commit 1c0d40fdd), so the brief's literal list ("not-applied first") no longer describes the hub's data. The rerun follows the new options.
- C8: met. The case-run prints `["C planned pinned","B not-attending pinned","A upcoming","D planned"]`.
- C9: met. The case-run prints `["x","y"]`.
- C10: met. People come out as Anh Phuong DO, Ashkan Pirmani, Aur<e acute>lie de Borman, Axel Faes, and so on. In the synthetic list <O diaeresis>sterg<o diaeresis>tland falls between Oslo and Ozone.
- C11: met. The case-run prints `["Alpha","beta","gamma"]`.
- C12: met. The case-run prints `["planned","not-attending","paused"]`.
- C13: met as ruled. The case-run's C13 lines give each part its own sort, and the code path is `Collection.svelte:144-154` (`parts`) to `:216-222` (`shown`).
- C14: met by reading. `Grip.svelte` is deleted, `EntryCard.svelte:297` carries no drag attribute, and check 6's grep is empty. The press-and-drag and Shift+J/K on screen wait for the look at landing.
- C15: met by reading. `HELP.md:148` and `rows.ts` carry no J / K. `withMove` calls the local `movedOrder` (`slides.ts:187-188`). The Slides drag and step buttons wait for the look.
- C16: met. The grep above prints the same lines as on the base.
- C17: met by reading. `shown` and `entries` are `$derived` from the snapshot through `cardOrder`, and the cursor is the card identity (`Collection.svelte:138`, `:409`). The screen behaviour waits for the look.
- C18: met by run. The case-run prints the slices `["planned","completed","cancelled","not-attending"]` over the sorted entries (`bar.ts:467` over `entries`). The bar on screen waits for the look.

## 1. Spec

- none. The make.ts head comment changes lines 18-22 where the ruling named 17-18. The rewrap rule (rules file, "What every package obeys", the whole-paragraph rewrap) forces it, the report states it under its judgment calls, and line 17 is unchanged. I judge this no defect.

## 2. Proof

- Proof 1, `tests/data/snapshot/schema-rules.test.ts:512-522`, "const sorted = [...schema, STATUS, DEADLINE];".
  - What is wrong: this fixture edit changes every KEY_ROWS row that plants a tasks file, and the brief's check 8 asks that a test of a preserved behaviour "passes on the unchanged tree where it can run there". The report gives that run no result. The file did not load on the unchanged tree only because the two new rows name the new catalog key, so the edited helper could have been run there with those two rows held back.
  - Failure scenario: an extra `status` or `deadline` field that changed another row's expected findings on the base would not be shown by the after run alone, since that run carries both the fixture edit and the code change.
  - Verdict: check 8 partial.
- Proof 2, the report as a whole: several things the rules file asks for are missing.
  - The history-word grep of the added and changed comment lines and test titles, with each hit judged ("What every package obeys"). My grep of the added lines finds one hit, "so `2` sorts before `10`" (`index.ts`), which is an order and no history.
  - The reuse grep before writing a helper, for `cardOrder`, `sortText`, `filledFirst`, `CARD_COLLATOR`, `sortShape` and `sortFindings` ("The principles every package is judged on").
  - The grep of the moved `movedOrder` after the move ("What every package obeys", grep each changed name).
  - What the code does for an introduced key given twice: my probe of a hub's own `sort: [date, date]` gives merge findings `[]`, and `cardOrder` simply compares twice.
  - The edits to existing assertions as one row per changed line, made from a diff. The report gives them in prose.
  - Failure scenario: the orchestrator cannot check from the report that no existing helper was duplicated (see Standards 2) or that no history word was added.
  - Verdict: none.
- Proof 3, report section "Judgment calls", "once in `entries` (for the bar and the cursor)".
  - What is wrong: `entries` (`Collection.svelte:156`) is read only by `lifecycle` (:164) and `collectionBar` (:203). The card cursor compares card identities (:138, :409) and never reads `entries`.
  - Failure scenario: a reader of the report expects a change to `entries` to move the cursor.
  - Verdict: none.

## 3. Standards

- Standards 1, comments edited by the step that are not rewrapped as whole paragraphs at 100 columns (rules file, "What every package obeys", rewrapped as a whole paragraph). In each place a line ends short where the next word fits within 100 columns:
  - `src/lib/data/helpers/hub-names.ts:304` (94 columns, "order" fits) and `:308` (97, "an" fits), the entryOf doc: " * hold, is left out with a problem. A `sort:` reads as a list of texts and is kept as it stands;".
  - `src/lib/state/boards/collection/index.ts:741` (94, "text;" fits), the sortText doc.
  - `src/lib/state/boards/collection/index.ts:772` (94, "field" fits), the fieldCompare doc.
  - `src/lib/data/snapshot/schema/run.ts:13` (90, "manifests" fits): "// sorts its cards by that its schema does not name. The documents checked are the project".
  - `src/lib/data/sources/collections.ts:12` (94, "other" fits).
  - `src/lib/views/shared/forms/entry/card/EntryCard.svelte:7` (97, "of" fits).
  - Failure scenario: the next reader of the code meets ragged paragraphs, against the repository's rule.
  - Verdict: items 1, 2 and 4 hold in substance, with this convention short.
- Standards 2, `src/lib/state/boards/collection/index.ts` in fieldCompare: "const place = (value: string): number => { const at = options.indexOf(value); return at === -1 ? options.length : at; };".
  - What is wrong: this is the rule `stageRank` already gives (`src/lib/state/boards/board/presets.ts:327-330`: the index in the order, else `order.length`), and the rules file asks that a rule exists once and is reused.
  - Failure scenario: a later change to how an unknown value ranks is made in one of the two places and not the other, so boards and collections disagree.
  - Verdict: none (low).
- Standards 3, `config/defaults/sources.yml`, the `sort:` bullet: "an entry that holds no value of a field after those that hold one. ... and an entry with no `sort:` has its cards go by their title".
  - What is wrong: "has its cards go" is ungrammatical. "Entry" also names two things within one bullet, a file's record and a `collections:` list entry (rules file "Prose"; CLAUDE.md "Plain prose", one name per thing).
  - Failure scenario: a hub author reads "an entry with no sort:" as a record and looks for a `sort:` field on records.
  - Verdict: none (low).
- Standards 4, report section "Check 1": "rerun alone with `--testTimeout 30000`".
  - What is wrong: the rules file ("Verify before you report") says nobody reruns, investigates or changes a timeout for a failure in a file the step does not change. The one rerun alone was allowed; the longer-timeout reruns go beyond it.
  - Failure scenario: none for the code; time spent on suites that are not the step's.
  - Verdict: none.
- Standards 5, `tests/data/snapshot/schema-rules.test.ts:700`, "describe('the primary key, the foreign keys and the display ranks of a hub schema'", and `agents/guarded.md` G56.
  - What is wrong: the describe now holds the two sort rows, and neither its title nor G56's text names the sort rule. guarded.md is the orchestrator's file, so this is an item for landing.
  - Failure scenario: a later step looking for the sort finding's test does not find it from G56.
  - Verdict: none.

## 4. Behaviour

- Behaviour 1, `src/lib/views/boards/collection/Collection.svelte:155-160`, "const entries = $derived(parts.flatMap((part) => cardOrder(part.collection.entries, part.collection.sort, part.schema)))".
  - What changes: the base put every hub's pinned entries first across hubs (`pinnedFirst(parts.flatMap(...))`); now each hub's entries are ordered on their own and the hubs follow one another. `shown` was already per hub, so the drawn cards do not change from this alone. What does change, and is in the report's "Before and after" only for one hub's events:
    - the order of the status slices in a workspace of several hubs (first occurrence, `bar.ts:467`);
    - the order of the "other" values of a `filter: true` group with options (`bar.ts` fieldOrder, first occurrence);
    - the Status choices of a file with no schema (`offeredStatuses` over `statusFacets(entries)`).
  - Two further changes are not stated either. List mode's rows now start in the sorted order, since `EntryList` draws `shown`. A hub whose own `collections:` list names an entry with no `sort:` now draws it by title, where it was in file order.
  - Failure scenario: at the look, the orchestrator sees a multi-hub slice order or a list-mode row order that the report did not predict.
  - Verdict: none (the brief asked for `entries` per part).
- Behaviour 2, `docs/HELP.md:279`, "A card whose status or pin changes moves to its place."
  - What is wrong: any write to a sorted field moves the card. Examples are the card menu's Deadline on tasks, applications and funding, or a name edited on a person. The HELP sentence names only status and pin, while the Collection head comment says it right ("a write that changes a sorted field moves the card").
  - Failure scenario: a user sets a deadline from the card menu, the card jumps away, and the guide did not say it would.
  - Verdict: item 7 holds; the added sentence is incomplete.

## Declined to judge

- What only a page shows: C14's press and drag, Shift+J and Shift+K with the cursor on a card, C15's Slides drag and step buttons, C17's card moving with the cursor kept on it, and C18's bar. A reviewer runs no page; the look at landing settles these.
- The regenerated `docs/diagrams/*.svg`: judged by their stat and by `npm run diagrams` leaving all 18 files equal under `cmp`, not by reading the SVG.
- Whether a range value such as `2026-2027` should sort before or after `2026-10-29` in education's `date`. The rule "by its text" puts `2026-10-29` first under both the code-unit order and the collator (my probe: `"2026" | "2026-10-29" | "2026-2027"`). Which is right is the user's call on his data.
- Open items 660 and 661, which the report quotes: they are the user's to rule. 660's option (a) appears to be in the hub's data already (hub commit 1c0d40fdd).

Reviewer usage: a7e642347c27ccca6, claude-opus-5-5, 302477 tokens, 86 tool uses, 26 min 49 s.

## Repair round 1, refuted

Every round item holds and every closure the builder claims reproduces. Three low findings are new; each is small enough to fix at landing: Standards R1-1 (the doc of `stageRank`), Standards R1-2 (the two functions named `sortFindings`) and Behaviour R1-1 (one before-and-after row stated too broadly). No finding asks for another round.

## Verification (rerun by the reviewer)

```
Round delta: diff -u of each files.txt path, snapshot against worktree (.svg by cmp):
  changed: config/defaults/sources.yml (the sort: bullet), docs/HELP.md:279, docs/templates.md:73-80,
  src/lib/data/helpers/hub-names.ts:304-309, src/lib/data/snapshot/schema/run.ts:13-16,
  src/lib/data/sources/collections.ts:12-13, src/lib/state/boards/collection/index.ts (import :56,
  :742-744, :773-776, fieldCompare's place -> stageRank), EntryCard.svelte:7-8, schema-rules.test.ts:700.
  Every other path is identical, the six diagrams included. No path changed outside files.txt
  (git status --short lists the same 34 paths and the four .scratch files).
Words unchanged by the rewraps (tokenised compare of snapshot against worktree): hub-names.ts, run.ts,
  collections.ts, EntryCard.svelte: same-words. index.ts and templates.md differ only by items 5 and 6.
Widths (awk length), equal to the report's quote: hub-names 304-309 100 99 98 100 100 26;
  index 742-744 100 99 15; index 773-776 100 97 98 22; run.ts 7-16 94 95 92 97 100 95 100 97 98 98;
  collections.ts 7-13 92 99 96 98 98 100 31; EntryCard 2-11 88 100 100 93 70 100 97 99 93 62;
  templates.md 62-80 98 99 99 87 99 98 100 97 99 87 97 95 94 96 94 95 95 96 60.
  No line ends short of a next word that fits (each short line checked against its next word).

Item 1 rerun, from .../scratchpad/o137/base-run:
  diff -rq O137-base/src base-run/src: SRC-SAME; config: CONFIG-SAME; tests except schema-rules: same.
  The copy's schema-rules.test.ts differs from the worktree's only by the two sort rows moved into
  it.skip('the two sort rows, held back on the base') and the describe title as before item 7.
22:10  up 1 day,  6:13, 1 user, load averages: 23.16 16.48 13.60
$ npx vitest run --reporter=verbose tests/data/snapshot/schema-rules.test.ts
  the two sort rows, held back on the base   (skipped)
  gives the findings of 'a schema that flags no primary key' ... 'a from: left on a schema field' (16 rows, all pass)
 Test Files  1 passed (1)
      Tests  54 passed | 1 skipped (55)
  The KEY_ROWS rows that call tasks(): 14, of which 12 are not the sort rows; the count equals the report's twelve.

Check 1, the builder's 50 files (test-files.txt; every test file importing a changed module is in it):
22:10  load averages: 12.81 14.79 13.15
 Test Files  2 failed | 48 passed (50)
      Tests  5 failed | 1255 passed | 9 skipped (1269)
  failures: tests/data/hubs/hub-portfolio.test.ts (4), tests/routes/edit/undo/config-save.test.ts (1),
  each "Error: Test timed out in 5000ms."; neither file is changed by the step. Each rerun alone once:
22:13  load averages: 15.05 15.34 13.63   hub-portfolio.test.ts   Test Files  1 passed (1)  Tests  16 passed (16)
22:14  load averages: 8.91 13.66 13.11    config-save.test.ts     Test Files  1 passed (1)  Tests  13 passed (13)

Check 2: npm run diagrams: rc=0; cmp of the 18 docs/diagrams/* files against a copy taken before: none changed.
npm run test:quick, once:
22:14  load averages: 6.59 12.46 12.69
test:quick: 38 changed file(s), from git since HEAD
test:quick: 228 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (2.9 s)
ok      svelte-check (10.2 s): 1793740505129 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (155.4 s): Duration  141.89s (transform 71.76s, setup 0ms, import 170.45s, tests 278.10s, environment 5ms)
FAILED  vitest (172.5 s)
FAILED  vitest slow (264.3 s)
test:quick: 266.6 s; failed: vitest, vitest slow
  vitest: Test Files 2 failed | 166 passed | 44 skipped (212); Tests 2 failed | 2593 passed | 590 skipped (3185)
  vitest slow: Test Files 1 failed | 58 passed (59); Tests 1 failed | 589 passed | 309 skipped (899)
  failures, all timeouts ("Test timed out in 5000ms" x2, "in 20000ms" x1), none in a changed file:
  hub-portfolio.test.ts, tests/data/sources/config/layers/hub-vocab.test.ts, tests/routes/git/zenodo.test.ts.
22:19  load averages: 12.82 14.01 13.43
Each rerun alone once:
22:19  load averages: 10.49 13.44 13.23   hub-portfolio.test.ts   Test Files  1 passed (1)  Tests  16 passed (16)
22:20  load averages: 7.04 11.96 12.69    hub-vocab.test.ts       Test Files  1 passed (1)  Tests  31 passed (31)
22:20  load averages: 6.11 11.43 12.48    zenodo.test.ts          Test Files  1 passed (1)  Tests  51 passed (51)
(The builder's run of the list printed "every command passed" at load 12-14; mine went red only on these timeouts.)

Check 3, the rules file's gate over the 30 changed non-svg files and O137-report.md: nothing printed, rc=0.

Check 4: sh utils/unused-exports.sh rc=0; diff against ../O137-base/unused-exports.txt:
326c326
< src/lib/state/workbench/ui.svelte.ts: CardMove, OwnedInstance, TerminalOwner, PaneStripKey
---
> src/lib/state/workbench/ui.svelte.ts: OwnedInstance, TerminalOwner, PaneStripKey

Check 5: sh utils/folder-check.sh: nothing printed, rc=0. wc -l: index.ts 872, hub-names.ts 857, run.ts 610,
  collections.ts 218, EntryCard.svelte 328, Collection.svelte 447, Present.svelte 518,
  schema-rules.test.ts 786, board-rules.test.ts 823.

Check 6: the brief's grep: nothing printed, rc=1.

Check 7:
158:            cardOrder(part.collection.entries, part.collection.sort, part.schema)
219:            cardOrder(part.collection.entries, part.collection.sort, part.schema)

Check 8: the item 1 run above (preserved rows pass on the base's code) and check 1 after the change.

The case-run, the round report's command with CASE_OUT changed to a new file, from the worktree root:
22:21  load averages: 5.06 10.40 12.05
CASE_OUT=rev-r1-after.txt npx vitest run --testTimeout 120000 --config .../scratchpad/o137/vitest.case.config.mjs
 Test Files  1 passed (1)
      Tests  1 passed (1)
  diff r1-after.txt rev-r1-after.txt: SAME. The non-C7 lines are the same as after-run.txt (before stageRank).
  C7 follows the hub's options as they now stand, [active, applied, interview, offered, accepted,
  not-applied, declined, rejected, withdrawn] (applications.yml schema line 5): active x5 by deadline
  2026-11-04 .. 2027-01-21, applied, interview, accepted x2, not-applied x9, declined x2, rejected x8, withdrawn x3.

Item 2 greps rerun:
  history-word grep (the report's command): "72:+ * so `2` sorts before `10`." only; an order, no history.
  base: grep -rn "cardOrder\|sortText\|filledFirst\|CARD_COLLATOR\|sortShape\|sortFindings" src tests ->
  convert.mjs:94 sortText (LSP field), validate.ts:6,481,533 and its four importers; Intl.Collator in base src: 0.
  movedOrder: slides.ts:178,188; TerminalList.svelte:75,235; terminal-list.ts:196 (as the report quotes).
C16: writes.svelte.ts:429,846 and Sections.svelte:47,111, as on the base.
Lists: sources.yml's 16 "  - { key:" lines and templates.md's commented list: LISTS-EQUAL.
The six changed YAML files parse with the yaml package.
git diff 6779731e1 --stat: 34 files changed, 663 insertions(+), 690 deletions(-).
```

## Verdicts

Items of "What to build":

- 1: holds. `sortShape` (`hub-names.ts:267`), `entryOf`'s read (`:343-347`), `CollectionTraits.sort` and `traitsOf`. The entryOf doc is now rewrapped whole (Standards 1 of the first review is closed).
- 2: holds. `sortFindings` (`run.ts:365-378`) is called at `:574`, and the run.ts head comment is rewrapped (`:7-16`). Standards R1-2 is a naming point about it.
- 3: holds. The ten sorts and the six registry entries are unchanged. The sort bullet (`sources.yml:32`) now says "a card" for a record and "a `collections:` entry" for a list entry, and it ends as ruled. The templates comment says the same, and the lists are equal line for line.
- 4: holds. `fieldCompare` ranks a status by `stageRank` (`index.ts:785`) and its own `place` is gone, so the rank rule exists once. The order is unchanged (the case-run's non-C7 lines are identical). Standards R1-1 is about the reused function's doc.
- 5: holds. Check 6 prints nothing; `movedOrder` is local to `slides.ts`; `Grip.svelte` is absent from the card folder.
- 6: holds. Proof 1 of the first review is closed by the base-copy run above.
- 7: holds. `docs/HELP.md:279` now reads "When a write changes a card's pin or a field the collection's cards are sorted by, the card moves to its place." (Behaviour 2 closed.)

Cases:

- C1: met. The row passes; the case-run prints `C1 sort: [["status","date"]] problems: []`.
- C2: met. The text and empty-list lines match.
- C3: met. The map and number lines each give one `sort_unread` naming the value and `events`.
- C4: met. One `sort_unknown` naming `due` at `schema`.
- C5: met. `findings on tasks.yml: []`.
- C6: met. The events lines are unchanged from the after run.
- C7: met against the rule. The order follows the file's status options as they now stand (hub commit 1c0d40fdd), with the deadline oldest first inside a status and a missing deadline last.
- C8: met. `["C planned pinned","B not-attending pinned","A upcoming","D planned"]`.
- C9: met. `["x","y"]`.
- C10: met. The people lines are unchanged from the after run.
- C11: met. `["Alpha","beta","gamma"]`.
- C12: met. `["planned","not-attending","paused"]`.
- C13: met as ruled. Each part gets its own sort; the path runs through `Collection.svelte`'s `parts` to `shown` (:219).
- C14: met by reading. The grip is deleted and check 6 is empty. The on-screen drag and Shift+J and Shift+K wait for the look.
- C15: met by reading. `slides.ts:188` `withMove` calls the local `movedOrder`. The Slides drag and step buttons wait for the look.
- C16: met. The grep prints the same lines as on the base.
- C17: met by reading. `shown` and `entries` are derived through `cardOrder`, and the cursor compares identities (`Collection.svelte:138`, `:409`). The screen behaviour waits for the look.
- C18: met by run. `["planned","completed","cancelled","not-attending"]`.

## 1. Spec

none. The round's delta changes only what items 1 to 9 name. `presets.ts` is read and not changed, as the round allows. The sentence on the six files in `sources.yml:32` moves within the bullet so that the bullet ends as item 6 rules.

## 2. Proof

none. Each closure reproduces: the base-copy run (54 passed, 1 skipped), the widths, the greps, the case-run (equal to `r1-after.txt`), and checks 4 to 7. Check 1 and test:quick went red in my runs only on timeouts in files the step does not change, and each of those files passes when run alone.

## 3. Standards

- Standards R1-1, `src/lib/state/boards/board/presets.ts:323-326`: "Where a stage sorts in `order`, the keys of `stages`: its place there, and after every stage the order names for a stage it does not name or no stage at all."
  - What is wrong: after item 5, `stageRank` also ranks a collection's status value among its schema field's options (`index.ts:785`, `stageRank(left, options)`). For that caller the doc's "the keys of `stages`" and "stage" are false. The rules file ("What every package obeys": a sentence a change makes false is a defect of the change) applies. The round's path list kept `presets.ts` read-only, so the builder could not fix it; it is for landing.
  - Failure scenario: a reader of `fieldCompare` follows `stageRank`, reads that `order` is the board's stage keys, and takes the collection's status order for a board stage order. A later edit made for stages alone (for example, ranking `undefined` differently) then changes the collection order without anyone noticing.
  - Fix at landing: word the doc for any order, for example "Where a value sorts in `order`: its place there, and after every value the order names for a value it does not name or no value at all."
- Standards R1-2, `src/lib/data/snapshot/schema/run.ts:365`, "function sortFindings(", beside `src/lib/data/snapshot/validate.ts:481`, "export function sortFindings(findings: Finding[]): Finding[]". The builder raised this point; my judgment follows.
  - What is wrong: two functions in `data/snapshot/` share one name with opposite meanings. The run.ts one gives the findings of a `sort:`; the validate.ts one sorts a list of findings and is imported by `hubs/self.ts`, `hubs/merge.ts`, `sources/clones.ts` and `data/index.ts`. Nothing clashes in the build, since run.ts does not import validate.ts. But a grep for `sortFindings`, or `validate.ts:6`'s head-comment mention "by `sortFindings`", now lands on both. The brief's standard ("every line is written ... so that people can read, use and maintain it") is the rule broken, and the fix costs three words.
  - Failure scenario: a later step that changes how findings are sorted greps `sortFindings`, meets run.ts's function, and edits or reasons about the wrong one. Or a later import of validate's `sortFindings` into run.ts shadows or collides with the local function.
  - Fix at landing: rename the run.ts function and its one call (`:574`), for example to `sortFieldFindings`. My judgment is that this is the better option and leaving it is the lazy one.

## 4. Behaviour

- Behaviour R1-1, the report's "Before and after", the row on the Status choices of a file with no schema: "so with `status` in its sort the choices come alphabetically".
  - What is wrong: `offeredStatuses` lists the statuses in the order `statusFacets` first meets them over `entries` (`index.ts:829-848`). They come out alphabetical only when `status` is the first word of the sort and no pinned entry carries a later status. Pinned entries go first whatever the sort (`index.ts:812`). With `sort: [date, status]`, the order is set by the dates.
  - Failure scenario: at the look, a no-schema file whose pinned entry is `todo` shows Todo before Doing, and the orchestrator reads it as a defect the report did not predict.
  - Fix at landing: correct the booking text. The code is right.

## Declined to judge

- What only a page shows: C14's press and drag, Shift+J and Shift+K with the cursor on a card, C15's Slides drag and step buttons, C17's card moving with the cursor kept on it, and C18's bar on screen. A reviewer runs no page; the look at landing settles these.
- Whether the builder edited the scratch copy's `schema-rules.test.ts` with the Edit and Write tools or with a program. The copy's content is read and correct, but the round's transcript is not available to me, and the report does not name the tool used.
- The six regenerated diagrams: judged by `npm run diagrams` leaving all 18 files equal under `cmp`, not by reading the SVG.
- Open items 660 and 661: the user's to rule. The hub's data already carries 660's option (a) order (applications.yml schema line 5).

Reviewer usage: a6335b37145919815, claude-opus-5-5, 196285 tokens, 51 tool uses, 15 min 32 s.

## Closed

- First run, Proof 1 to 3, Standards 1 to 3, Behaviour 1 and 2: closed by repair round 1, as the review over the round found.
- First run, Standards 4: no change; the extra reruns cost time only.
- First run, Standards 5: fixed at landing, G56 in `agents/guarded.md` names the sort rule.
- Round 1, Standards R1-1: fixed at landing, the doc of `stageRank` (`src/lib/state/boards/board/presets.ts`) worded for any order.
- Round 1, Standards R1-2: fixed at landing, the `sortFindings` of `src/lib/data/snapshot/schema/run.ts` renamed `sortFieldFindings` with its call.
- Round 1, Behaviour R1-1: fixed at landing in the booking text and in `agents/reviews/O137-report.md`'s row on the Status choices of a file with no schema.
