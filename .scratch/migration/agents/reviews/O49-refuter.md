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

## Repair round 1, refuted

Reviewed in `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O49` against base `374eeaa2` and the round-1 snapshot `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O49-round-1/` (`files.txt`, 12 paths). The round's delta: `diff -u` of each `files.txt` path between the snapshot and the worktree, plus `git diff 374eeaa2 -- docs/apps.md` for the one path changed now that `files.txt` does not list. Of the `files.txt` paths, `config/text/ui.yml`, the four diagram files, `layout.svelte.ts`, `opening.ts` and `menu-items.ts` are identical to the snapshot (`diff -u` exit 0). The delta is the head comment of `open-view.svelte.ts` (lines 1-12), the doc comment of `stripMenu` (`pane-view.ts:302-309`), the head comment of `PaneView.svelte` (lines 44-49), `docs/HELP.md:76` and `docs/apps.md:87` and `:263`. No code line changed in the round.

```
$ git status --short        (from the worktree root)
 M config/text/ui.yml
 M docs/HELP.md
 M docs/apps.md
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
?? .scratch/migration/agents/briefs/O49-round1.md
?? .scratch/migration/agents/reviews/O49-report.md
?? src/lib/shell/panes/strip/open-view.svelte.ts

$ export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npm run test:quick 2>&1 | tail -15; echo "exit ${pipestatus[1]}"   (tail)
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (2.1 s)
ok      eslint (1.3 s)
ok      svelte-check (6.4 s): 1792684974260 COMPLETED 535 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (28.1 s): Duration  21.02s (transform 50.11s, setup 0ms, import 70.36s, tests 1.91s, environment 606ms)
test:quick: 30.2 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
exit 0

$ LC_ALL=C perl -ne '...spec.md ASCII gate...' src/lib/shell/panes/strip/open-view.svelte.ts src/lib/shell/panes/pane-view.ts src/lib/shell/panes/PaneView.svelte src/lib/ui/menu/menu-items.ts src/lib/state/workbench/layout/open/opening.ts src/lib/state/workbench/layout.svelte.ts config/text/ui.yml docs/HELP.md docs/apps.md docs/diagrams/layer-shell.dot docs/diagrams/layers.dot; echo "ascii exit $?"
ascii exit 0

$ awk 'length > 100 {print FILENAME":"FNR": "length}' src/lib/shell/panes/strip/open-view.svelte.ts src/lib/shell/panes/pane-view.ts src/lib/shell/panes/PaneView.svelte; echo "awk exit $?"
awk exit 0

$ (fill check: for each line of a paragraph but the last, whether the next line's first word fits at 100 columns)
open-view.svelte.ts 1-12: every line "ok" (no next word fits); line widths 95 97 100 100 97 98 95 99 95 95 99
pane-view.ts 298-309: every line "ok"; widths 97 97 97 99 100 98 97 99 98 98 100
PaneView.svelte 43-50: every line "ok"; widths 96 98 100 97 97 98 96
pane-view.ts 1-6, menu-items.ts 25-26, opening.ts 93-96 (round-0 comments): every line "ok"

$ (word sequence of the two St1 paragraphs, snapshot against worktree, comment markers stripped) diff ...; echo $?
open-view words exit 0
pane-view words exit 0

$ awk (snapshot widths) migration-O49-round-1/.../open-view.svelte.ts 1-12 and pane-view.ts 298-309
1: 95 2: 97 3: 98 4: 96 5: 96 6: 96 7: 97 8: 93 9: 92 10: 94 11: 96 12: 53
298: 97 299: 97 300: 97 301: 99 302: 96 303: 96 304: 97 305: 98 306: 96 307: 98 308: 97 309: 39

$ sed -n '87p;263p' docs/apps.md
- Open an app from the Apps rail button, the Views catalogue, Open View (the strip's right-click menu, under Apps), or `a` and its digit.
- A view is listed in the Views catalogue under Apps, and in Open View (the strip's right-click menu) under Apps with its container's title as its hover words. The first time, an `activitybar` view docks on the left, a `panel` view at the bottom, an `explorer` view beside Files.

$ wc -l src/lib/shell/panes/PaneView.svelte src/lib/shell/panes/pane-view.ts src/lib/shell/panes/strip/open-view.svelte.ts; ls src/lib/shell/panes/strip | wc -l
     517 src/lib/shell/panes/PaneView.svelte
     541 src/lib/shell/panes/pane-view.ts
     127 src/lib/shell/panes/strip/open-view.svelte.ts
      10

$ npx prettier --check src/lib/shell/panes/strip/open-view.svelte.ts src/lib/shell/panes/pane-view.ts src/lib/shell/panes/PaneView.svelte docs/HELP.md docs/apps.md; echo "prettier exit $?"
All matched files use Prettier code style!
prettier exit 0

$ (git diff 374eeaa2 -- src docs/HELP.md docs/apps.md | grep '^+' | grep -v '^+++'; cat src/lib/shell/panes/strip/open-view.svelte.ts) | grep -inE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands"; echo "history grep exit $?"
history grep exit 1

$ for d in src config docs tests utils; do diff -rq --exclude=local.yml migration-O49-base/$d migration-O49/$d; done
PaneView.svelte, pane-view.ts, opening.ts, layout.svelte.ts, menu-items.ts differ; only in worktree: strip/open-view.svelte.ts; config/text/ui.yml, docs/HELP.md, docs/apps.md and the four diagram files differ; tests and utils unchanged

$ sh utils/unused-exports.sh > <scratchpad>/o49r1-unused.txt; diff ../migration-O49-base/unused-exports.txt <scratchpad>/o49r1-unused.txt; echo "diff exit $?"
diff exit 0

$ sed -n '257p;439p;471,479p' src/lib/shell/panes/PaneView.svelte; sed -n 335,339p src/lib/shell/panes/PaneBody.svelte; sed -n 128,153p src/lib/ui/menu/ContextMenu.svelte; sed -n 186,200p src/lib/state/workbench/layout/open/opening.ts   (the P2 citations)
257: const viewOpener = createOpenView({ client, page: () => page, path: () => path });
439: <ContextMenu label={t('ui.pane_menu')} read={tabMenu.read} onpick={tabMenu.pick}>
471-479: <PaneBody ... {page} {path} ... items={stripItems} onpick={stripPick}
PaneBody.svelte:337: <ContextMenu label={t('ui.pane_menu')} {items} {onpick}>
ContextMenu.svelte:133-152: ContextMenu.Root > Trigger, Portal > Content > MenuList
opening.ts:195-197: function openInPane(...) { const held = access.at(page); if (held === null || paneAt(access.layout(held.id), path) === null) return '';

$ cat -n config/defaults/layout.yml | sed -n 9,27p; grep -n "^export function arrange\|^export function readGroups" src/lib/state/workbench/navigation/catalogue.ts   (the St3 order)
20: - { label: "Apps", glyph: app, page: apps, chord: a, group_glyph: app }   (11th of 13 rail entries, between Present and Help)
26-27: nav_groups: float: { label: "Float", glyph: split_right, chord: w }
183:export function arrange(
283:export function readGroups(config: Record<string, unknown> | undefined): NavGroup[] {
```

The round report's own test:quick run (35.7 s) and mine (30.2 s) differ by load; no decision rests on the time. That the builder's run came after its last change cannot be shown by an allowed command; the rerun above covers the tree as it is now.

### Verdicts

Items of `O49.md` "What to build", for the whole diff since the base:

- 1: holds. `pane-view.ts:349-350` places `facts.openView` third in the first group, which carries no condition; `config/text/ui.yml:82` `strip_open_view: Open View`.
- 2: holds. `open-view.svelte.ts:88-108`: `arrange(listedViews(views()), readGroups(configMap()))`, one submenu per labelled section with `groupGlyph`, views with `registrationLabel`, `registrationGlyph`, `title` from `registrationHeading`, the loose section after the groups, no docs.
- 3: holds. `open-view.svelte.ts:116-124` decides at the pick: `viewFor` undefined or unlisted opens nothing (cases ruling 1), otherwise `openInPane(view, undefined, deps.page(), deps.path())`.
- 4: holds. `heldHost` at `opening.ts:92-98`, `:411-413`, returned at `:500`; on the store at `layout.svelte.ts:216-217`, `:830`; the hint from `holderWords` (`open-view.svelte.ts:61-69`), page label, `Page N` (cases ruling 2) or `ui.float_label`, told apart by `pages()` (cases ruling 4).
- 5: holds. The new module has its head comment and the `open-view:` prefix; `PaneView.svelte` 517 lines (at or under 520); `strip/` 10 items.
- 6: holds. Every comment the brief names is true and filled to 100 columns (fill check above). `HELP.md:65` reads twelve views, with Apps; the Open View bullet at `HELP.md:76` says where it is, the sections, apps' views included, the pick in that pane, and the held view's hint and pick. One phrase of that bullet is finding Standards R1, recorded against round item 3.
- 7: holds. The round changed no import, and the four diagram files are identical to the snapshot. The first review's staleness run covers the round-0 import counts.

Cases of `O49.md` (read through the code, which the round did not change; C1 to C11 on screen are the orchestrator's look on TEST):

- C1: met, by reading. Rail order at `layout.yml:10-22` then Float from `nav_groups`; `arrange` keeps that order.
- C2: met, by reading. `PaneBody` gets `items={stripItems}` and `onpick={stripPick}` (`PaneView.svelte:478-479`).
- C3: met, by reading.
- C4: met, by reading, under cases ruling 3. The Apps view, each `registrationOfApp` entry and each listed `registrationOfView` entry, `title` from `heading` or `headingKey` (`registry.ts:178-183`).
- C5: met, by reading.
- C6: met, by reading.
- C7: met, by reading.
- C8: met, by reading.
- C9: met, by reading.
- C10: met, by reading.
- C11: met, by reading. `listedViews` (`catalogue.ts:381-383`) before `arrange`.
- C12: met, by reading.
- C13: met, by reading, under cases ruling 1.
- C14: met, by reading.
- C15: met, by reading.
- C16: met, by reading.
- C17: met, by reading.

Items of `O49-round1.md` "What to build":

- 1 (St1): holds. Both paragraphs fill to 100 columns: the awk check printed nothing, every line reads "ok" in the fill check, and the word sequence is unchanged against the snapshot (diff exit 0 for both).
- 2 (St2): holds. `PaneView.svelte:44-46` reads "a view a page or float holds is shown where it is held, and any other view opens in this pane". That is what `picked` does (`open-view.svelte.ts:121-122`). The paragraph fills at 100 columns.
- 3 (St3): holds on everything St3 named. "every view" is replaced by "the views the Views catalogue lists, so not a view opened only for something (a project, an entry, a file) and not the view of an app that is not active". This matches `listedViews` and the `listed` doc at `registry.ts:111-116`. Float and the apps' views read as two sections. The builder's departure from the round brief's word order is true to the code (see the note under the Findings). One phrase is finding Standards R1.
- 4 (St4): holds. `docs/apps.md:87` and `:263` name Open View under Apps, with the container's title as hover words, and nothing else in the file changed (`git diff 374eeaa2 -- docs/apps.md`: two hunks, one line each).
- 5 (P1): holds. The report quotes a green test:quick run, and my rerun on the current tree is green (`test:quick: 30.2 s (limit 45.0 s); every command passed`).
- 6 (P2): holds. The statement is in the report, and each citation reproduces: `PaneView.svelte:257`, `:439`, `:471`; `PaneBody.svelte:337`; `ContextMenu.svelte:133-152`; `opening.ts:195-197`.

Cases of `O49-round1.md`:

- 1 (St1): met. The awk check printed nothing, and each line ends where the next word would pass 100 columns. The report gives the "before" as columns and next words, not the paragraph text. The snapshot reproduces those columns (open-view 3: 98, 6: 96, 8: 93, 9: 92, 10: 94; pane-view 302: 96, 306: 96), and the words are unchanged.
- 2 (St2): met. Before: "opened in this pane". After: the held view is shown where it is held.
- 3 (St3): met, apart from Standards R1.
- 4 (St4): met. The before and after lines are quoted; the after lines match `sed -n '87p;263p' docs/apps.md` above.

The St3 word order. The builder's bullet is true to the code, and the round brief's order would not have been. The round brief listed the sections as "by rail page, then the floats' section, then the views the apps add under Apps". The bullet puts Apps among the rail pages and Float last. Apps is a rail entry, the 11th of 13 (`config/defaults/layout.yml:20`, between Present at `:19` and Help at `:21`). `readGroups` (`catalogue.ts:283-303`) gives the rail groups in rail order first and then the `nav_groups:` groups, Float being the only one (`layout.yml:26-27`). `arrange` (`catalogue.ts:183-207`) keeps that order. `item()` (`open-view.svelte.ts:88-108`) draws the labelled sections in that order, then the loose views. So the submenu reads Focus ... Present, Apps, Help, System, then Float. Written in the brief's order, the bullet would have put Apps after Float, which is false. The departure is stated in the report under St3 and is no finding.

### Findings

#### 1. Spec

none. The delta writes only the round's paths (`open-view.svelte.ts` lines 1-12, `pane-view.ts` lines 302-309 inside 296-394, `PaneView.svelte` lines 44-49, `HELP.md:76`, `apps.md:87` and `:263`). No code line changed, and no fix reaches beyond its finding. No finding is closed by removing a check.

#### 2. Proof

none. Every closure the report claims reproduces in my rerun: the fill, the words unchanged, the apps lines, the sizes, prettier, the ASCII gate, the history grep, unused exports, the P2 citations and test:quick.

#### 3. Standards

- R1. `docs/HELP.md:76`: "then a Float section with the views of the floats."
  - What is wrong: the Float section holds the registrations whose group is `float`. On the tree these are Live HPC, Usage and Workbenches (`group: 'float'` in `Hpc.svelte:10`, `Usage.svelte:12` and `Workbenches.svelte:10`), the views the shipped float starts with (`layout.yml:222`). It does not hold whatever views are in floats. "the floats", plural, reads as every floating pane. The same section names this group "the float" with its three views (`HELP.md:54`: "or in the float (Live HPC, Usage, Workbenches)"), and `layout.yml:25` says "the float's views".
  - Failure scenario: a reader floats a pane holding Files (Float in the pane menu), then looks for Files in Open View's Float section. Files is listed under Explorer.
  - Fix: one phrase, fixable at landing inside round item 3's path, for example "then Float with the float's views (Live HPC, Usage, Workbenches)".
  - Verdict: the one imprecise phrase of round item 3 and round case 3. It is not a red check or an unbuilt item.

#### 4. Behaviour

none. The round changed comments and documents only. The behaviour stated in the round-0 report's "before and after" is unchanged by the delta.

### Declined to judge

- Whether the builder's test:quick run came after its last change, and how many times it ran in the round: no allowed command shows the order of the work. My rerun covers the tree as it is now.
- The diagram staleness test (`tests/checks/diagrams/diagrams.test.ts`) was not rerun. The round brief does not name it, the round changed no import, and the diagram files are byte-identical to the snapshot. The first review's run covers the round-0 counts.
- C1 to C11 on screen, and whether the System page's saved label on TEST is "System" (C5): these are the orchestrator's look at landing. The saved layout under `~/.oculus` was not read.
- Whether a rail page added by a workspace's settings with no registered views should show a section: `arrange` leaves out a group with no listed views, as the Views catalogue does and as `HELP.md:54` describes it. The bullet's "a section per rail page" holds for the shipped rail. Ruling on custom rails is outside the step.

Reviewer usage: a06d0d28ac2eac6e4, claude-opus-5-5, 177883 tokens, 41 tool uses, 4 min 52 s.

### Closed

- R1: fixed at landing, inside round item 3's path (`docs/HELP.md:76`): the Float phrase names the float's views (Live HPC, Usage, Workbenches).
