# Step O49 refuter report (on .agents/worktrees/migration-O49, base 374eeaa2)

## Verification (rerun by the reviewer)

`npm run format` and `npm run diagrams` were not run, because both write files and the reviewer changes nothing. Formatting is covered by the prettier line of test:quick. Whether the diagrams are current is covered by the staleness case of `tests/checks/diagrams/diagrams.test.ts`, which compares the committed files with the source in memory.

```
$ git status --short
 M config/text/ui.yml
 M docs/HELP.md
 M docs/diagrams/layer-shell.dot
 M docs/diagrams/layer-shell.svg
 M docs/diagrams/layers.dot
 M docs/diagrams/layers.svg
 M src/lib/shell/panes/PaneView.svelte
 M src/lib/shell/panes/pane-view.ts
 M src/lib/state/workbench/layout.svelte.ts
 M src/lib/state/workbench/layout/open/opening.ts
 M src/lib/ui/menu/menu-items.ts
?? .scratch/migration/agents/briefs/O49-cases.md
?? .scratch/migration/agents/reviews/O49-report.md
?? src/lib/shell/panes/strip/open-view.svelte.ts
```

```
$ npm run test:quick      (from the worktree root; tail)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.2 s)
ok      svelte-check (9.5 s): 1792684124403 COMPLETED 535 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (9.5 s)
ok      vitest (36.9 s): Duration  26.44s (transform 61.11s, setup 0ms, import 89.12s, tests 2.55s, environment 791ms)
test:quick: 39.2 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
```
The list was started a second time, piped to `head -8`, only to read its header. That output was cut at its 8th line:
```
test:quick: 14 changed file(s), from git since HEAD
test:quick: 24 test file(s), 7 essential
```

```
$ LC_ALL=C perl -ne '...' (the brief's ASCII gate over the eight files); echo "exit $?"
exit 0
```

```
$ wc -l src/lib/shell/panes/PaneView.svelte src/lib/shell/panes/pane-view.ts src/lib/shell/panes/strip/open-view.svelte.ts
     516 src/lib/shell/panes/PaneView.svelte
     541 src/lib/shell/panes/pane-view.ts
     127 src/lib/shell/panes/strip/open-view.svelte.ts
$ ls src/lib/shell/panes/strip | wc -l
      10
```

```
$ sh utils/unused-exports.sh > <scratchpad>/o49-unused.txt; diff ../migration-O49-base/unused-exports.txt <scratchpad>/o49-unused.txt
exit 0
diff exit 0
```

```
$ (git diff 374eeaa2 -- src | grep '^+' | grep -v '^+++'; cat src/lib/shell/panes/strip/open-view.svelte.ts) | grep -inE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands"
exit 1
```

```
$ npx vitest run tests/checks/diagrams/diagrams.test.ts -t 'are what the source gives now, each file byte for byte'
 FAIL  |unit| tests/checks/diagrams/diagrams.test.ts > the committed diagrams > are what the source gives now, each file byte for byte
Error: Test timed out in 5000ms.
$ (same) --testTimeout=120000
 Test Files  1 passed (1)
      Tests  1 passed | 46 skipped (47)
```
The first run ended on the 5 s default timeout under the machine's load and did not finish the comparison. The second run passed, so the committed diagrams match the source.

```
$ npx vitest run tests/checks/tree/boundaries.test.ts
 Test Files  1 passed (1)
      Tests  11 passed (11)
$ npx prettier --check src/lib/shell/panes/strip/open-view.svelte.ts
All matched files use Prettier code style!
$ npx eslint src/lib/shell/panes/strip/open-view.svelte.ts; echo "eslint exit $?"
eslint exit 0
```

```
$ node -e "const {parse}=require('yaml'); try { parse('ui:\n  strip_open_view: Open View\n  strip_open_view: Other\n'); ... } catch (e) { ... }"
YAMLParseError: Map keys must be unique at line 3, column 3:
```
On a parse error, `merge/text.ts:60-64` pushes an `unparsed` finding and drops the file, which matches the builder's "Duplicated" row.

```
$ git show 374eeaa2:docs/HELP.md | grep -n "Eleven views\|Lock Group (pane\|New Text File (right"
65:- Eleven views exist once: ...
70:- A pane from the arrangement stays, ... Lock Group (pane right-click) makes a pane take no tab opened from elsewhere.
75:- New Text File (right-click on a strip's empty part) opens an untitled text. ...
```
The builder's claim holds: the brief's line 64 is line 65, and its Lock Group line 72 is line 70.

```
$ sed -n 263p docs/apps.md
- A view is listed in the Views catalogue under Apps. The first time, an `activitybar` view docks on the left, a `panel` view at the bottom, an `explorer` view beside Files.
$ sed -n 87p docs/apps.md
- Open an app from the Apps rail button, the Views catalogue, or `a` and its digit.
```
The builder's claim holds: apps.md:263 does not mention Open View. Line 87 does not either, and the builder did not name it.

```
$ grep -rln "unique: true" src/lib/views | wc -l   (listed by name)
Apps, Focus, Audit, Findings, History, Hpc, Processes, Usage, Status, Pages, Settings, Workbenches  (12 files)
$ grep -rn "stripMenu(" src tests
src/lib/shell/panes/pane-view.ts:311:export function stripMenu(
src/lib/shell/panes/PaneView.svelte:260:        stripMenu(
$ diff -rq ../migration-O49-base/{src,config,docs,tests,utils} ...   (config with --exclude=local.yml)
the 5 changed src files, open-view.svelte.ts new, config/text/ui.yml, docs/HELP.md, the 4 diagram files; tests and utils unchanged
```

These builder claims could not be reproduced:
- The builder's test:quick timing, "63.7 s (limit 45.0 s) ... over the time limit", does not repeat. The reviewer's run took 39.2 s and stayed within the limit. The time depends on the machine's load.
- That comment lines of `open-view.svelte.ts` were edited after the list ran is a statement about the order of events. No allowed command shows it (see Proof P1). The reviewer's run of the list covers the file as it is now.

## Verdicts

Items of "What to build":
1. Open View item, third in the first group, key `ui.strip_open_view: Open View`: holds (`pane-view.ts:347-351`, `ui.yml:82`; the first group carries no condition, so the item shows on every pane).
2. Submenu by `arrange` sections, glyphs, loose section, `title` for app views, no docs: holds (`open-view.svelte.ts:88-108`; `arrange` is called with the default `docs = []`, `catalogue.ts:183-187`).
3. The pick decided at the pick, `openInPane` in this pane, nothing for a missing registration: holds (`open-view.svelte.ts:116-124`; the unlisted re-check follows cases ruling 1).
4. `heldHost` beside `heldInstance`, on the store, hint from the holder: holds (`opening.ts:92-98`, `:411-413`, `:500`; `layout.svelte.ts:216-217`, `:830`; `open-view.svelte.ts:61-69`, following cases rulings 2 and 4).
5. New module with a head comment and its own prefix, PaneView at or under 520: holds (127 lines; PaneView at 516; `strip/` holds 10 items).
6. Comments and pages made true and rewrapped at 100 columns: violated (St1, St2, St3).
7. Diagrams regenerated: holds (the staleness case passes).

Cases (none was taken on screen; C1 to C11 are the orchestrator's look at landing):
- C1: met (by reading). The rail order in `layout.yml:10-22` and every rail group holds a listed registration (per-file grep of `group:` and `listed: false`).
- C2: met (by reading). `PaneBody` gets `items={stripItems}` (`PaneView.svelte:477`) and `onpick={stripPick}`.
- C3: met (by reading).
- C4: met (by reading, under ruling 3). Only app views carry `heading` or `headingKey` (`views.ts:162-164`).
- C5: met (by reading).
- C6: met (by reading).
- C7: met (by reading).
- C8: met (by reading).
- C9: met (by reading).
- C10: met (by reading).
- C11: met (by reading).
- C12: met (by reading).
- C13: met (by reading, under ruling 1).
- C14: met (by reading).
- C15: met (by reading).
- C16: met (by reading).
- C17: met (by reading). `readGroups({})` gives no rail entries (`rail.ts:117-118`), and `nav_groups` is not a map.

## 1. Spec

No finding. No change outside the items. No decision reserved for Axel was taken. Each premise the builder relied on reproduces. Ruling 4's premise also holds: `isPage` sits at `model.ts:298` and is not in `layout/index.ts`.

One brief premise is wrong and does not count against the builder. The write list names `docs/HELP.md lines 64-64` and the state file's `shared_paths` names "O49 lines 64 and 75-76". The sentence the brief means is at base line 65, and the new bullet is at 76. The landing should merge with O50 (lines 280-314) using 65 and 76. The ranges stay disjoint.

## 2. Proof

P1. The report's Verify 1 row, "DONE, once", quotes a test:quick run taken before the step's last change. The report says: "The verify list ran once, before a final edit that changed two comment lines in `src/lib/shell/panes/strip/open-view.svelte.ts`". This breaks `spec.md`, Token discipline: "After your last change run the verify list". It also breaks the Report rule that each DONE row quotes "the final run that proves it" after the last change.
- Failure scenario: an edit made after the list that breaks formatting, the type check or a test lands under a green row.
- Status: the reviewer's run of test:quick on the current tree passed (`test:quick: 39.2 s (limit 45.0 s); every command passed`). No repair is needed.

P2. The report covers the in-flight cases (C12, C13) but leaves out the "after close" path that `spec.md` asks to be stated for every asynchronous path: the pane closed or the tree reshaped while the menu is open.
- By reading, the code handles it. The menu is drawn inside `PaneView`, so it unmounts with the pane. The module reads the pane's place through getters, `page: () => page, path: () => path` (`PaneView.svelte:256`), so a pick uses the current path.
- This is an omission in the report only, with no defect behind it.

## 3. Standards

St1. Edited and new comments are not fully rewrapped at 100 columns. `spec.md`: "rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short". The tree's own lines run to 100 columns: base `pane-view.ts:3` is 100 long, and the base tree has 3549 comment lines of exactly 100 columns.
- `open-view.svelte.ts` head comment: lines 3 (98 columns, next word "a"), 6 (96, "the"), 8 (93, "state"), 9 (92, "open,") and 10 (94, "lives"). For example, line 8 reads `// opener shows it; the item names that page or float as its hint. The menu is drawn from the`, and "state" fits.
- `pane-view.ts:302` (`* Tab Bar and Editor Actions Position submenus, each marking the setting in force with a check,`, 96 columns, next word "the") and `pane-view.ts:306` (96 columns, next word "the").
- Failure scenario: the next step that edits these paragraphs rewraps them whole, and the diff shows changes to lines it did not mean to change.

St2. The `PaneView.svelte:44-45` head comment, written by the step, says something the code does not do: `Open View (the views by rail page, opened in this pane, strip/open-view.svelte.ts)`. A unique view that a page or float holds is not opened in this pane. It is shown where it is held (`open-view.svelte.ts:121`, `if (heldHost(view) !== null) openView(view);`).
- Failure scenario: someone maintaining the pane reads the head comment as the rule and "fixes" the pick to open every view in the pane, which makes a second instance of a unique view.

St3. The new `docs/HELP.md:76` bullet: `Open View (right-click on a strip's empty part or in an empty pane) lists every view by rail page, then Float, the views your apps add under Apps.` It has two faults:
- "every view" is false. A registration with `listed: false` is left out, including an app's view while its app is not active (`catalogue.ts:381-383`, `open-view.svelte.ts:91`).
- The appended phrase "then Float, the views your apps add under Apps" reads as if Float were the views the apps add.
- Failure scenario: a reader looks for a view that is opened only for an entry, or for the view of a disabled app, and finds it missing although the help says every view is there. Or the reader looks for app views under Float.

St4. A surface an app builder sees changed without its page. App views, and each app's own entry (cases ruling 3), are now listed in Open View under Apps, with the container title as their hover words. `docs/apps.md` still names only the Views catalogue: line 263 ("A view is listed in the Views catalogue under Apps.") and line 87 ("Open an app from the Apps rail button, the Views catalogue, or `a` and its digit.").
- `spec.md` asks a step to write "what an app builder meets into the Apps guide `docs/apps.md`". The brief's write list leaves `docs/apps.md` out.
- The builder named line 263 in its report, outside the write list, but not line 87.
- Failure scenario: an app builder checking where a contributed view appears, or why two views of one name differ on hover, finds Open View nowhere in the guide.
- Both lines are a one-clause fix at landing.

## 4. Behaviour

No finding. The following were read and hold:
- The `open-view:` prefix collides with no strip, pane, float or tab id. The desktop command `open-view` never reaches `stripPick`, and neither submenu trigger id (`open-view-list`, `open-view-group:<n>`) starts with `open-view:`.
- `heldHost` and `openView` both go through `holderOf` in the same synchronous pick (`opening.ts:397-413`, `showHeld` `:427-454`), so the hint and the pick name the same holder.
- `stripItems` is read only when a menu opens: through `tabMenu.read` for the strip, and through `ContextMenu`'s derived `shown` inside a portal that draws only while open for the empty body. Building the submenu therefore adds no work on layout changes while no menu is open.
- `MenuList.svelte:80-82`, `:108-109` and `:134`/`:189` draw the glyph, the hint and the `title` the item carries. Glyph names come from `groupGlyph` and `registrationGlyph`, as in `Catalogue.svelte:242` and `:272`.

## Declined to judge

- Whether the builder ran the list once, and in what order it edited the files: no allowed command shows the history of the work.
- The builder's 63.7 s test:quick time: it depends on load. The reviewer's run took 39.2 s.
- C1 to C11 on screen: the orchestrator's look on TEST at landing. That includes whether the System page's saved label on TEST is "System" (C5), which depends on the saved layout under `~/.oculus`, which was not read.
- Whether `OpenViewDeps`, an exported type with no importer outside its own file, should be made local. `utils/unused-exports.sh` (knip) does not list it. The existing `CloseQuestionDeps` follows the same pattern.

Reviewer usage: af0803206f26587d0, claude-opus-5-5, 183702 tokens, 57 tool uses, 8 min 48 s.
