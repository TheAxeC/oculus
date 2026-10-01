# Step Q85d refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85d, base c62d2ce3)

Reviewer: first run, claude-sonnet-5-5. I changed nothing in the worktree or the ledger. `git status --short` printed 76 lines before and after my runs. The runs wrote only `.svelte-kit/` and `build/`, which git ignores. I did not open `config/local.yml` and did not copy it into my scratch copy. I touched no port and no browser. My scratch copy is removed.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams      (exit 0, regenerated docs/diagrams/*.dot and *.svg)
$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md    (exit 0)
$ npm test            Test Files  421 passed | 22 skipped (443)    Tests  11081 passed | 620 skipped (11701)
$ npm run test:checks Test Files  29 passed | 2 skipped (31)        Tests  442 passed | 9 skipped (451)
$ npm run check       COMPLETED 2951 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build       built in 22.98s
$ npm run format:check  All matched files use Prettier code style!
$ npm run lint        (no output)
$ ! LC_ALL=C grep -rna '[^ -~]' src tests   (no output)
checks: 7 commands passed
```

The numbers match the report's fourth full-list run line for line.

The brief's grep checks, rerun in the worktree:
- Check-line count after the change: `grep -rcE "typeof |Array\.isArray|isRecord\(|isMap\(" ... src/lib/views src/lib/ui src/lib/shell src/routes | awk -F: '$2>0' | wc -l` printed 35, and the line sum printed 66 (report: 35 files, 66 lines). I read all 66 lines. Each is an E, F, G or H line of the brief. The ones I checked by reading:
  - `Calendar.svelte:180,185`, `EntryForm`, `Summary`, `LineCounts`, `Jobs` and `Projects.svelte:198-199` are G.
  - `routes/views.ts:27,28,71` are G (the `registration` narrowing).
  - `palette-open.ts:31,38` are G.
  - `history/rows.ts` and `table-rows.ts` are H.
  - The `navigator`, `ResizeObserver`, `document`, `location`, `getBoundingClientRect` and `closest` lines are E. The `typeof` in a type lines are F.
- `grep -rnE "z\.custom|\.refine\(" src/lib/views src/lib/shell src/routes src/lib/state/sources/repositories/answers.ts` printed nothing.
- `grep -rln "data/shapes/shapes" src/lib/views src/lib/shell` printed 16 view files and `shell/keys/palette-open.ts`.
- `grep -rnE "\.issues|prettifyError|treeifyError" ...` printed two lines, `Latex.svelte:226,232`. They are CSS selectors, as the report says, and the brief's "prints nothing" is met in substance.
- The `const ... = z` and `<script module>` greps print only names ending in `Shape`.
- The object-test grep, `as Record<string, unknown>|\) as \{|as Answer|as T\[\]`, `\.json\(\)\) as` and `\.json\(\)` over views, shell, ui and routes all printed nothing.

Reproduction of the report's first-run claims. The report's harness was deleted, so I rebuilt the unchanged tree myself:
- Copy: a scratch copy of `tools/oculus` in my own scratchpad, without `local.yml`.
- Base source: `git diff c62d2ce3 -- tools/oculus/src` reversed into it, with `answers.ts` removed.
- Test files: the step's new and changed test files kept as they are in the worktree.
- Run: each with `npx vitest run <file> --reporter=dot`.

Results on the unchanged tree:
- These pass: `audit`, `config`, `usage`, `history`, `focus` (50), `person` (15), `leads`, `radar`, `data`, `source` (27), `pillars`, `node-view` (5), `opening` (5) and `palette-open` (7). These are the kept rendered cases.
- `tests/shell/workbench.test.ts`: 1 failed, "uses the registered label when the state is a list that carries a label key" (`expected 'x' to be 'Status'`). This is the changed `activeLabel` answer, failing first as claimed.
- `tests/routes/page.test.ts`: 4 failed (`pushedCollections` absent, and the rewritten line-111 audit).
- `graph.test.ts`: 1 failed (`labelModeOf` absent).
- `fs-shape.test.ts`: 8 failed (`bookmarkRef` and `bookmarkRows` absent).
- `instance.test.ts`: 32 failed (the five readers absent).
- `git-answers.test.ts`: cannot load, `Cannot find module .../repositories/answers.ts`.

The 37 passed / 11 failed split and the 371-case golden snapshot cannot be reproduced; see Proof 1. I replaced them with two differential runs on scratch copies, the old inline logic written out beside the new function:
- `instanceText`, `instanceFlag`, `instanceNumber`, `instanceMap` (identity too), `instanceLabel`, Config's `open` and Source's `line`, over 33 inputs: Map, inherited key, own `__proto__`, array with own keys, null-prototype object, function, Proxy, frozen, `String` object, NaN, Infinity, getter that throws. All agree. The only difference against the old `workbench-title` reader is the array with an own `label`, which is the Z179 change.
- `answers.ts` against the old cast logic, over 31 bodies at `ok` true and false. Differences: a list holding a wrong row (survivors), and a page or sides that is no page or sides (failure sentence). The `listOf` and `branchesOf` runs differ nowhere. I also saw the page or sides handed on as a copy (Spec 1).

I also checked the server producers. `parseRefs`, `git.ts:287` (empty `incoming` and `outgoing` after the first page), `parseNameStatus`, the blame and marks rows, `check-attr` and the merge sides always send every field the new schemas require. So a schema does not silently drop real server rows. I did not check the producer of `DiffSides` item by item beyond its model type.

## Verdicts

Items of the brief's "What to build":

- 1: violated, low. `mergeSidesShape` is a plain `z.object`, so `mergeSidesOf` hands on a copy where the rule says the input itself (Spec 1). The rest holds: module-level `...Shape` consts, `satisfies`, no `custom` or `refine`, no zod error text read.
- 2: holds. `'data/shapes/shapes'` is in the `shell` and `views` rows of `ALLOWED`, and the comment at `boundaries.test.ts:73-77` says four layers. `data/helpers/guards` is imported by no view or shell file and joins no row. `ui/` has no diff.
- 3: holds. The five readers are in `instance.ts` and exported through `layout/index.ts`. `grep -rnw filterOf src tests` prints nothing. Every listed local reader is deleted. The four `history.test.ts` rows moved into the `instanceText` table (`instance.test.ts`), and `allow-audits.txt` lost its line. Source's `line` and Config's `open` keep their own schemas. The differential run above shows the answers are kept.
- 4: holds, with a signature difference. All six readers are in `answers.ts`, held with `satisfies`. Lists read through `survivorsShape`. A non-text `error` answers the failure sentence. `Deposit.svelte:188-192` reads `answer.branches ?? []`. `branchesOf(body)` takes no `ok`, where the item says the readers take `ok` and the body. The report lists this as a judgment call and it matches "Changes keeps a list whatever ok says". `wasRead` is a hand check (Standards 4).
- 5: holds. `warnAtShape`, `cadenceShape`, `labelModeOf` (`graph.ts:75-78`), `colorShape` over `mapShape`, `themeNamesShape`, `pushedCollections` (`views.ts:50-58`). Inherited and own `__proto__` keys agree with the old reader (`node-view.test.ts`, passing).
- 6: violated, low. `LeadCard.svelte:53` and `RadarCard.svelte:45` each define the same one-line `text` reader, where the item says one helper if both would otherwise define it (Spec 2). Everything else in the item holds: `Person`'s `jointWork` derived list, `retrievalShape`, `optionalText` in `LineCard`, `bookmarkRef` and `bookmarkRows` in `fs.ts`, `whereShape`.
- 7: holds. All E, F, G and H lines are still there and were read one by one (see Verification). The report's per-line reasons are grouped by letter, not per line.
- 8: holds. `allow-duplication.txt` lost the Editor/Project, DatasetCard/DomainCard, File/Note and File/Source lines (diff). The duplication check is green in `test:checks`.
- 9: holds for what it names. `sed -n 148p DESIGN.md | grep -o ...` prints the three areas. `README.md:13` is changed. `DESIGN.md:323` cites `opening.ts:47-70` and `openBookmark` is at 62-70. The stale citations and table the same edit leaves are Standards 1 and 2.
- 10: holds in content; the `answers` test is at another path (Standards 3). Only the three named existing cases are edited: `git diff --numstat -- tests` shows deletions only in `history.test.ts`, `page.test.ts:111`, `boundaries.test.ts` (comment and rows), `palette-open.test.ts` (import line), `allow-audits.txt` and `allow-duplication.txt`.
- 11: holds. Each changed answer has a case that fails on the unchanged tree or whose old behaviour I read in the base code. `workbench.test.ts` fails on base (run above). The base `Graph.svelte` read confirms `page: 3` on the first page draws no failure and holds undefined lists. `regionsOf(undefined...)` throws in `linesOf` (`text.split`), so Merge's old sentence came from the throw.

Cases of the brief's "Cases":

- 1 `instanceMap`: met, `instance.test.ts` "the saved state of a tab read as a map" (`toBe` for the map, Map and own-`__proto__` input; spread keeps `__proto__` as an own key).
- 2 `instanceText`: met, the 11-row table plus the four `history` rows. The differential run covers the same inputs on base logic.
- 3 `instanceFlag`: met, `instance.test.ts` rows.
- 4 `instanceLabel`, `instanceNumber`: met. The array row answers `null` and is the changed answer.
- 5 Source `line`: met, `source.test.ts` "carries a line only when the tab names a finite number above zero" (NaN, Infinity, -1, 0, '12', 12). It passes on base.
- 6 Config `open`: met, `config.test.ts` (text, `[3, 'layout.yml']`, two names, a map, nothing).
- 7 Audit: met, `audit.test.ts` "the pane state the view reads".
- 8 `answers`: met, `git-answers.test.ts` (path in Standards 3).
- 9 `nodeTone`, `configuredThemes`: met, `node-view.test.ts` and `palette-open.test.ts`.
- 10 CommandCenter, Usage, `labelModeOf`, `pushedCollections`: met, `focus.test.ts` ('5' to 4, NaN, 2), `usage.test.ts` (0, -1, NaN, Infinity, '5', 5), `graph.test.ts`, `page.test.ts`.
- 11 LeadCard, RadarCard, Person status, DatasetCard, LineCard: met, the added render cases. They pass on base.
- 12 Bookmark readers: met, `opening.test.ts` (open or not; drawn `r/p`, `/p`, `/p`, `/p`, `r/`, `r/`) and `fs-shape.test.ts` (`bookmarkRows`).
- 13 existing cases unedited but three: met, `git diff c62d2ce3 --numstat -- tests` as above.
- 14 E, F, G, H answer as today: met by reading the 66 remaining lines plus the green suite.

## 1. Spec

1. `src/lib/state/sources/repositories/answers.ts` `mergeSidesShape` (`const mergeSidesShape = z.object({ base, ours, theirs, deleted }) satisfies z.ZodType<GitMergeSides>`) and `graphPageShape`: what is wrong: item 1 says a reader that hands on an object it was given answers the input itself (`unchanged`). My differential run shows `mergeSidesOf(true, { sides: { ...MERGE, extra: 1 } })` answers a copy without `extra`, and an object that is not the input. Failure scenario: a later reader that compares or forwards the sides by identity, or a server field the type does not name yet, is lost without notice; the view today reads only the four fields, so nothing visible breaks. `mergeSidesShape` holds no list and could be `unchanged(...)`. `graphPageShape` needs a rebuilt page only when a list is filtered; it could answer the input when every item passes. Verdict: item 1 violated, low; fix at landing.
2. `src/lib/views/feeds/leads/LeadCard.svelte:53` and `src/lib/views/feeds/radar/RadarCard.svelte:45`: "const text = (field: string): string => readOr(textOrNumberShape, entry[field], '');" appears twice, identical. Item 6 says one helper if both would otherwise define it, and both do. Failure scenario: a change to how an entry field is read as text must be made twice. Also `textOrNumberShape` already ends in `.catch('')`, so the `''` fallback of `readOr` is never used (same in `CommandCenter.svelte:71`, `warnAtShape` with `.catch(4)` and `readOr(..., 4)`). Verdict: item 6 violated, low.
3. The report gives the first run of the cases as counts (37 passed, 11 failed, 371 golden) and, for the kept view cases, says "their output is not in this report" (its Not verified section). The brief's last Cases paragraph and Verify 4 ask for both runs quoted and each case's first run named. Failure scenario: the orchestrator cannot tell from the report which kept case ran first on the unchanged tree. I reproduced it (Verification), so no case is unmet. Verdict: none; see Proof 1.

## 2. Proof

1. The report's first-run section (37 passed, 11 failed, "371 passed (371)", twice) rests on a throwaway harness that is deleted, with its output outside the tree ("kept in the scratchpad `first-run.txt`"). The decision resting on it is that every kept reader answers as before. I could not run the builder's harness. I reproduced the substance: the kept rendered cases pass on the unchanged tree, the activeLabel case fails there, and the two differential runs found only the Z179 differences. Failure scenario if unreproduced: a changed answer outside Z179 would land unnoticed. Disposition: reproduced by the reviewer, so the claim is supported; the report should have quoted the runs. Verdict: none.
2. No test asserts a known defect; no threshold, tolerance or predicate is widened; no `static` or file-scope mutable is added. The only source-text audit is `page.test.ts:111`, which the brief asks to be rewritten as an audit. Nothing else found.

## 3. Standards

1. `DESIGN.md:169-170` (the Boundaries table, "enforced by `tests/checks/tree/boundaries.test.ts`"): the `shell/` and `views/` rows do not list `data/shapes/shapes`, but `boundaries.test.ts` now allows it in both. The `state/` row at line 171 lists it. Failure scenario: a reader of the table concludes a view or shell file may not import `data/shapes/shapes`, which the enforced test now allows and 17 files do. The brief's path list (lines 148, 323) did not reach lines 169-170, which D27 and D35 do not write either; a path list is a choice, so the rows should be widened. Verdict: item 9 holds for what it names; this is an extra defect of the change.
2. `DESIGN.md:268` cites `routes/views.ts:53-65` for `registerCollections` calling only a module whose `registration` is a function, and `DESIGN.md:294` cites `Document.svelte:108` and `Document.svelte:118`. After the change `registerCollections` is at `views.ts:68` (`typeof module.registration` at 71), and the contextmenu listener and `window.open` in `Document.svelte` are at lines 103 and 113. Failure scenario: a reader following the citation lands on `pushedCollections` or on unrelated lines. The spec says to grep every changed name and carry the change to every hit. (`Document.svelte:134-141` and `:138` are correct after the change.) Verdict: none.
3. `tests/state/sources/fs/git-answers.test.ts` tests `state/sources/repositories/answers.ts`, but sits in the folder of the file browser's store tests, next to `fs-answers.test.ts` (a test of `/api/fs` answers). The brief's folder `tests/state/sources/repositories` holds 10 items (`ls | wc -l` printed 10), so the brief's path was impossible as written. The spec rule is to split a full folder into folders named for what they hold and put the new file where its concern lives; the builder neither split the folder nor booked it. Failure scenario: the next test of `answers.ts` or of a repositories module goes looking in the mirror folder and finds neither the file nor room. Verdict: item 10 holds in content; this is a Standards finding for the orchestrator to rule on at landing (accept, or split `tests/state/sources/repositories` into subfolders).
4. `answers.ts` `wasRead`: "return body !== undefined && body !== null;". It is a hand check of an untyped value, the kind `DESIGN.md:148` replaces with a schema. The `null` half is unreachable through `readJson`, which answers `undefined` for JSON null; the tests pass `null` directly. Failure scenario: none visible; it is a second place that decides what an unread body is. Verdict: none.
5. A type defined twice: `fs.ts` `BookmarkRow` equals `shell/rail/rail.ts:20` `Bookmark`. The report says it is structurally equal, which the build proves. Low; no verdict.

No non-ASCII (the lint gate printed nothing), no history in comments (I grepped the added lines for step ids, dates and "used to"; the one date is a test fixture string in `usage.test.ts`), no secret in the report, files within the size limit (checks green).

## 4. Behaviour

None beyond what the report states. All six changes (a wrong-shaped list item, a non-text `error`, Graph `page: 3`, Merge `sides: 3`, Diff `attributes: 3`, `activeLabel` over an array with an own `label`) are in its "Changed answers" table, each with before and after. I checked that table against the base code. The corrected points in the report's "Wrong or impossible" 2 and 3 are accurate.

## The builder's six "Wrong or impossible in the brief" points, against the tree

1. Test placement: the premise is true. `ls tests/state/sources/repositories | wc -l` printed 10 and `repositories.test.ts` is 880 lines against the 900 limit (`size.test.ts:28`). The brief's path would fail `size.test.ts`. The builder's replacement path is a Standards finding (3 above), not a defect of the content.
2. Graph `page: 3`: holds. Base `Graph.svelte` assigns `commits = page.commits` on the first page without a throw. Only `[...commits, ...page.commits]` on a later page throws, and that is caught as `graph_failed`.
3. Merge `sides: 3`: holds. Base assigned `sides = body.sides`, then `regionsOf(undefined...)` threw in `linesOf` and the catch drew `merge_failed`.
4. The blame key is `'lines'`: holds. Base `Source.svelte:239` calls `readOne(..., 'lines')`.
5. `DESIGN.md:323`: the sentence is not true of the code, and was not at the base. `grep -n apps` over the base `opening.ts` printed nothing. Nothing in `src/lib/views/sources/files` or `fs.svelte.ts` tests an apps folder. The sentence belongs to the apps section, which `plan.md` lines 439-444 and 484 call an unbuilt proposal that step E4 builds. So "false before the step" holds only in the sense that the proposed check does not exist yet. Leaving the sentence alone was right and inside the brief (item 9 asked for the cite only), and the new cite `47-70` is correct. I found no booking of this anywhere in the ledger (`grep -n "Reading an app\|apps folder\|DESIGN.md:323" plan.md orchestrator-state.md` printed nothing). It is E4's to build, not a gap of Q85d.
6. `DESIGN.md:148` named the helper list as read by "the server and the state layer": holds. The change to include the views and the shell is needed, and the diff makes it.

## Declined to judge

- Looking at the changed views on screen (TEST page) and the four click handlers (`SessionList.write`, `Band.reveal`, `CommandCenter.reveal`, `Repositories.patch`): needs a DOM and a click; I may use no browser. I read the four sites. Each passes `instanceMap(instanceState(...))` where the old three-line function stood, and the differential run proves `instanceMap` answers the same value (the input itself for a map).
- The effect in `routes/+page.svelte` that follows a config push: checked by reading and by `page.test.ts`; not run in a browser.
- Whether the two copies of the `text` reader (Spec 2) and the `BookmarkRow` type (Standards 5) deserve a fix at landing or a ruling: a call for the orchestrator.
- The builder's 371-case golden snapshot and the exact 37/11 split: harness deleted, not reproducible; substituted as above.
- The `DiffSides` producer field by field: I read the model type and the checks the server's types give, not every writer of a diff.

Reviewer usage: tokens not available to me; about 95 tool uses; about 55 minutes.

Usage, from the completion notice: reviewer a1869e27b7f463b00, claude-sonnet-5-5, 282,135 tokens, 76 tool uses, 25.0 min.
