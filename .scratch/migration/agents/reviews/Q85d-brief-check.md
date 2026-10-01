# Brief check of Q85d (zod at the untyped inputs of the views, `ui/`, `shell/` and the routes)

Read on main at d210e4b4 (`git log -1 --format=%h` prints d210e4b4). Nothing was changed. No test was run. `config/local.yml` was not touched, and no grep went over `config/`. I read zod's source in `node_modules/zod/v4/core/` instead of running it.

`plan.md` has no `## Goal` heading. Its headings are Packages, Could run in parallel, Rulings and Blocked. I used the Q85d step line (`plan.md:346`), Z73 (`:609`), Z96 (`:635`), Z154 (`:736`), Z163 (`:745`), Z173 (`:756`), and LA7 as quoted in `agents/reviews/library-audit.md:73-81`.

Summary: 17 findings in total, 8 of which I rate blocking (they make the step impossible to build as written, or make a case unrunnable):
- Names 1 and 3: `filterOf` and `tests/routes/page.test.ts:111` break tests the brief forbids editing.
- Names 4 and 5: `layout/index.ts` and the listed paths and test files are incomplete.
- Premises 1 and 2: Deposit is not an untyped input, and two fetched bodies (Graph, Merge) are missing.
- Cases 1 and 2: cases 1-4 cannot run on the unchanged tree, and case 8 cannot run at all.

---

## Names

1. **`filterOf` is imported by a caller and a test the brief does not list, and deleting it breaks a test the brief forbids editing.**
   - `grep -rnw filterOf src tests HELP.md DESIGN.md README.md docs` prints:
     - `src/lib/views/system/history/rows.ts:51` (the definition)
     - `src/lib/views/system/history/History.svelte:45` (import) and `:58` (call)
     - `tests/views/system/history.test.ts:12` (import) and `:71-74` (four asserts on `filterOf`)
     - `tests/checks/tree/allow-audits.txt:58` (`tests/views/system/history.test.ts :: reads the filter out of whatever the instance state is | the case draws nothing and asserts over filterOf({ filter: 'tasks' })`)
   - `History.svelte`, `history.test.ts` and `allow-audits.txt` are in neither "What is on the tree" nor "Paths this step writes".
   - Item 3 says delete `filterOf` unless a caller outside the view uses it. Item 10 and case 13 say no existing case is edited. The test file imports the function, so it breaks.
   - Change: add the three paths. Say the four asserts move into the `stateText` table in `instance.test.ts` and are named in the report. Say `allow-audits.txt:58` is removed or rewritten, and give the rule for it.

2. **Namesakes of two new names.**
   - `grep -rnw stateLabel src` shows `views/sessions/session-list/session-list.ts:80`, an exported `stateLabel(state: ListStateKey)`, imported at `SessionWorkspace.svelte:17`.
   - `tests/state/workbench/layout/saved/refusal-fixture.ts:18` exports a `stateText`. It is a different function (it renders a state for a test).
   - No file imports both. Two functions of one name with different meanings is still the "parser exists once" smell.
   - Change: rename the new reader (for example `instanceLabel`) or state in the brief that the namesake is accepted and why.

3. **`tests/routes/page.test.ts:111` asserts the source text of the hand check item 5 deletes.**
   - `grep -n "isArray" tests/routes/page.test.ts` prints `111: expect(wired[0]).toContain('!Array.isArray(pushed.collections)) return;');`.
   - Item 5 converts `+page.svelte:89` (that exact line). Item 10 and case 13 forbid editing existing cases, so the step cannot pass its own rule.
   - The existing test pushes a builder to leave the hand check in place so the test stays green. That is a test fitted to its revert, and it leaves the goal unmet.
   - `page.test.ts` does not render the page. Its imports are `readFileSync`, `load`, `serverLoad`, `Hub` and similar. So case 10's "in `tests/routes/page.test.ts` if it renders the page" is false.
   - Change: add `tests/routes/page.test.ts` to the paths. Rule that the source-text assertion at `:111` is rewritten to the new form, or replaced by a behavioural test of the extracted function. Say it is a case that asserts source text and counts as an audit, per `spec.md`.

4. **The `layout/index.ts` facade is not in the paths.**
   - `layout/index.ts:87-100` re-exports `activePath, cardCursor, ..., withCardCursor` from `./instance.ts`.
   - The shell's row of `boundaries.test.ts` names `state/workbench/layout` (the index) only. Item 3 says "the shell reaches `instance.ts` through `state/workbench/layout`". `stateLabel` and `stateMap` must therefore be exported from `index.ts`.
   - `src/lib/state/workbench/layout/index.ts` is missing from "Paths this step writes". `ls src/lib/state/workbench/layout | wc -l` prints 10, the folder limit, so no new file can be added there.
   - Change: add `index.ts` to the paths and name the five exports. Also name which view files import from the facade and which import `instance.ts` directly.

5. **Other text the change makes false or stale, outside the paths.**
   - `README.md:13` says zod "checks a value that comes from outside the process where the server reads it". It is already stale since Q85b, and the step widens the gap.
   - `DESIGN.md:323` cites `views/sources/files/opening.ts:47-72` (`openBookmark`), which item 6 shortens.
   - `DESIGN.md:148` has a sentence the extension must stay consistent with: "the answers of the server's endpoints (a body that is JSON null or is not JSON is a failed read, never a map of the wrong shape, and an `error` that is not text is the status text)". See Premises 5.
   - `grep -n "zod\|untyped" DESIGN.md README.md HELP.md docs -r` found only `README.md:13` and `DESIGN.md:148`. HELP.md and docs hold no hit.
   - Change: add `README.md:13` and `DESIGN.md:323` to the paths. A named thing is its whole.

6. **Test files the cases need that are not in the paths, and two modules with no test file.**
   - Cases 6, 7, 8, 10 and 11 need these existing files, none named in "Paths": `tests/views/system/{config,audit,usage}.test.ts`, `tests/views/feeds/{leads,radar}.test.ts`, `tests/views/structure/{map,pillars}.test.ts`, `tests/views/sessions/changes.test.ts`, `tests/shell/workbench.test.ts` (the only test that renders PaneView), `tests/routes/page.test.ts`, `tests/views/system/history.test.ts`.
   - `grep -rn "nodeTone\|node-view" tests` prints nothing. `grep -rn "files/opening" src tests` shows only the `Files.svelte` and `row-menu.ts` imports, so `opening.ts` (`openBookmark`) has no test.
   - Item 10 says "in the existing test file of its module", and there is none for `node-view.ts` or `opening.ts`. `tests/views/sources/files` holds 9 files, so one new file fits. `tests/views/structure` holds 6.
   - Change: list the files and say where the `nodeTone` and `openBookmark` cases go.

7. **Steps in flight share more files than the brief says.**
   - Brief line 30 says only `Source.svelte`, `Merge.svelte` and `DESIGN.md` are shared with D27 and that D35 shares nothing.
   - D35: I read its "Paths this step writes" and found no overlap with Q85d. Confirmed.
   - D27's paths (`D27.md`, "Paths this step writes") also include these Q85d files:
     - `src/lib/state/sources/fs.ts` (Q85d adds `bookmarkRef` beside `refShape` at `:211`)
     - `tests/checks/tree/boundaries.test.ts` (D27 writes the state row and comment `:31-60`)
     - `tests/views/sources/source.test.ts` (D27 writes lines 494-516; case 5 adds there)
     - `tests/checks/tree/allow-audits.txt` (D27 writes only where a moved name changes its line; this is the same file as Names 1)
   - The hunks look apart, but the brief says the opposite.
   - Change: list them as shared with D27, as Q85b's brief did for S3c.

8. **The allowlist lines exist, and their recorded line numbers do not match the readers.**
   - `grep -n "views/\|shell/\|routes/" tests/checks/tree/allow-duplication.txt` shows lines 25 (Editor/Project), 30 (DatasetCard/DomainCard), 31 (File/Note), 32 (File/Source), as the brief says.
   - The recorded positions do not match the readers: Editor "at 80" but `readId` is at 82-86; Project "at 86" but `readId` is at 88-92; File "at 99" but `read` is at 113; Source "at 276" but `read` is at 296.
   - The check matches by mark (a hash), not by line (`duplication.test.ts:179-181`), and fails on a stale entry (`:597-606`). So the brief's removal instruction is right. Whether those three clones are the instance-state readers is **not verified**. It needs a jscpd run, which is the test suite.

---

## The step line

Line: `plan.md:346`, "Q85d the same in the views, `ui/`, `shell/` and the routes (64 files, 137 check lines), after Q85b". "The same" is Q85a1's line: zod at untyped input, `data/model` types kept through `satisfies`, redundant hand checks deleted, answers kept.

Mapping:
- zod at untyped input: item 1, with items 3 (state), 4 (bodies), 5 (config) and 6 (fields).
- `satisfies` facade: item 1.
- Hand checks deleted: items 3-6, with verify 2.
- Every answer kept: item 1, the cases, and the item 1 sentence "there is no item 9 here".
- Views: items 3-6. Shell: items 3 and 5. Routes: items 5 and 6.
- `ui/`: no item converts anything. Items 2 and 7 say its 21 check lines are all E, F and H. I confirmed each of the 21 lines against the listing.
- I grepped `ui/` for `: unknown`, `as unknown` and `Record<string, unknown>`. The hits are component props and library snippets, not outside data. I did not inventory `ui/` further, so "no untyped input in `ui/`" is verified only as far as that grep.
- Parts with no item or no correct item:
  1. `views/sources/repositories/graph/Graph.svelte:226` and `merge/Merge.svelte:112` read untyped bodies and are in no item. See Premises 2.
  2. `Deposit.svelte:196` has an item (item 4) but its premise is wrong. See Premises 1.
  3. Diff's `attributes` and `conflicted` fields are read but not named in item 4. See Premises 3.
  4. `Doc.svelte`'s `held` has the wrong reader assigned. See Premises 4.

---

## Premises

All counts reran and match:
- `grep -rcE "typeof |Array\.isArray|isRecord\(|isMap\(" ... | awk -F: '$2>0' | wc -l` prints 64, and the sum prints 137.
- Per area: views 46 / 97, `ui/` 10 / 21, `shell/` 6 / 13, routes 2 / 6.
- `grep -rln '<script module' src/lib | wc -l` prints 53.
- `grep -rln "svelte/server\|render(" tests/views | wc -l` prints 65.
- `ls src/lib/state/workbench/layout | wc -l` prints 10. `wc -l` of `instance.ts` is 156 and of `instance.test.ts` is 271.
- Sizes: Source 475, Diff 529, EntryForm 481, `+page.svelte` 230, CommandCenter 260.
- No file of views, `ui/`, shell or routes imports `zod`, `data/shapes` or `data/helpers/guards`.
- `LAYERS` is at `boundaries.test.ts:20`. The shell row is at `:103`, the views row at `:120`, the state row at `:121-125`, and the comment naming `data/shapes/shapes` at `:73-75`.
- `docs/adr` does not exist.

I checked every line number the brief cites under A to H against `sed -n`. All match. One citation is imprecise: `state/workbench/palette.ts:151` is `kind: 'editor'`, and the `state:` is at `:157`.

Class assignment: I mapped all 137 lines of `grep -rnE ... | sort` to exactly one of A to H. None is in two classes and none is in none. For E, F, G and H I traced where each value comes from:
- G `Summary`, `Projects:198-199`, `Jobs:66` and `LineCounts:67,70`: rows are built by the component (`Summary.svelte:29-36`, `Projects.svelte:211`, `Jobs.svelte:52`, `LineCounts.svelte:49`).
- G `EntryForm:148,153,192,193,252`: `initial` is built through `controlValue` (`state/forms/form-values.ts:81`), which already reads with `readAs`.
- G `Calendar:180,185`: `extendedProps` is built at `state/life/calendar.ts:153`.
- G palette `state`: built at `palette.ts:105,117,136,157`.
- G `views.ts:21-22,56`: a module the build imported.
- H `rows.ts:31-42` and `table-rows.ts`: walks that read no named field.
- None of E, F, G or H is a read of an outside value's fields.

Findings:

1. **`Deposit.svelte:196` is not an untyped input (item 4 and the Deposit part of case 8).**
   - `state/client/writes.svelte.ts:68-78` reads every answer through `answerShape`, whose `branches` is `survivorsShape(branchShape).optional().catch(undefined)`.
   - `state/shared/stores/shapes.ts:106` types `branches?: { name; upstream; current }[]`.
   - So `Array.isArray(answer.branches)` guards a validated, typed value. It is `answer.branches ?? []`, not a new schema. A `WriteAnswer` whose `branches` is `3` cannot come from `writeDeposit`; it becomes `undefined` first.
   - Change: reclassify Deposit:196 as a typed value (`?? []`). Keep it in the count as a hand check to delete, and drop the "schema of that field" wording. Replace the case with a failed answer (`{ ok: false, ..., network: true }`, no `branches`), expected `[]`.

2. **Two more cast `response.json()` bodies are untyped inputs the brief omits.**
   - `grep -rnE "\.json\(\)" ... src/lib/views src/lib/ui src/lib/shell src/routes` prints seven lines. The two missing from B:
     - `views/sources/repositories/graph/Graph.svelte:226: const body = (await response.json()) as { page?: GitGraphPage; error?: string };` then `body.page.commits/incoming/outgoing/more` at `:236-244`.
     - `views/sources/repositories/merge/Merge.svelte:112: ... as { sides?: GitMergeSides; error?: string };` then `body.sides.base/ours/theirs` at `:119`.
   - They are not in the 137 because they use neither `typeof` nor `Array.isArray`. The count under-inventories the goal "every untyped input of the views".
   - Verify 3's own grep (`\) as \{`) prints both lines, so the builder's check would fail on lines the brief never lists as G.
   - Change: add both to B and item 4. Define their answers. Today `body.page = 3` passes `!== undefined`, then `[...commits, ...undefined]` throws, which is caught as `graph_failed`. Add a `.json()` grep to verify 3. Say the 137 count is a floor, not the inventory.

3. **Diff reads two more body fields than item 4 names.**
   - `Diff.svelte:150-156` types `Answer = { files?, attributes?, conflicted?, error? }`. `:199-200` read `attributes = body.attributes ?? null` and `conflicted = body.conflicted === true`.
   - Item 4 and A-D name only `files` and `error`. `attributes: 3` today is stored as `3`, and `conflicted: 'true'` is false.
   - Change: name all four fields and add both to case 8.

4. **`Doc.svelte`'s `held` is a map reader, not a text reader.**
   - `Doc.svelte:89-92` returns the state map or `{}`, and `:70` spreads it: `restateInstance(instance.id, { ...held(instance.state), ...docState(entry) })`.
   - Item 3 lists "Doc's `held` and `read`" under `stateText`. Only `read` (`:94-97`) is `stateText`. `held` is `stateMap`, and its spread site is missing from the item-3 spread list.
   - Change: assign `held` to `stateMap` and add `Doc.svelte:70` to the spread list.

5. **Rule clash: view-fetched bodies keep `error: 3` while `DESIGN.md:148` says a non-text `error` is the status text.**
   - `CommitFiles.svelte:146-147` sets `failure = response.ok ? '' : (body.error ?? t('repositories.graph_failed'))`. With `{ error: 3 }` and status 500, `failure` is `3`. Case 8 includes `{ files: 3, error: 3 }`, expected "as the unchanged tree".
   - `DESIGN.md:148` (kept, extended to the views by item 9) says "an `error` that is not text is the status text", and "a list a store hands on to a view is read item by item".
   - Q85b changed such answers under Z154 and Z173. Q85d's item 1 says "no item 9, a changed answer is a finding".
   - Item 4 says lists are handed on `unchangedAs<Branch[]>`, i.e. items unvalidated, "as Q85b's readers keep it". Q85b read list items with `survivorsShape` (Q85b item 4, a changed answer). `unchangedAs` there is only for large payloads, top level.
   - This is a decision for Axel: (a) keep today's answers, and write in `DESIGN.md:148` that bodies fetched by views are the exception; or (b) apply the state layer's rule (item-wise lists, non-text `error` becomes the fallback sentence) as listed changed answers with before/after cases. Option (a) is the lower-effort one. Which is better depends on whether the views are meant to read bodies like the state layer does. The brief cannot proceed without the choice recorded. My recommendation is (b), since a cast `Branch[]` over unvalidated items is the untyped-input state the step exists to end.

6. **The existing "reads like PaneView" claim hides a second variant.**
   - `workbench-title.ts:14` tests `typeof instance.state === 'object' && instance.state !== null`, with no `!Array.isArray`. `PaneView.svelte:172` does exclude arrays.
   - Item 3 folds both into one `stateLabel`. They differ only for an array with an own `label` property.
   - Change: either accept that one reader's answer changes for that input and say so, or add the case below under Implied inputs.

7. **Minor count error.** Decision 2 says "16 views carry copies". `grep -rlE "Array\.isArray\((state|held_|current|held|kept|raw)\)" src/lib/views src/lib/shell` prints 20 files: 18 views (including `Config`) plus `palette-open.ts` and `PaneView.svelte`, and `workbench-title.ts` is a 21st variant. Change: say 18, or name what the 16 are.

---

## Cases and checks

1. **Cases 1-4 cannot be run on the unchanged tree.**
   - They call `stateMap`, `stateText`, `stateFlag`, `stateLabel` and `stateNumber`, which do not exist there. `grep -rnw "stateMap\|stateFlag\|stateNumber" src tests` prints nothing. The brief's last paragraph demands every case pass on the unchanged tree first.
   - The sentence before the cases says to run them against the deleted reader where exported, or through the component's render. Of the readers, only these are reachable that way:
     - exported: `filterOf` (`rows.ts`), `openPaletteItem` (palette spread), `activeLabel` (workbench-title)
     - render: Audit, Person, Project, Editor, Deposit `readId`, File, Source, Note, Merge, Document, Doc `read`, Config, Customization, `PaneView` (only through `tests/shell/workbench.test.ts`)
   - The spread sites of `SessionList.svelte:94-97`, `Band.svelte:70-77`, `CommandCenter.svelte:205-216` and `Repositories.svelte:106-109` are click handlers. No server render runs them.
   - Change: state per reader how its first run happens (a render case, the exported function, or "by reading the three-line function, named in the report"). Say that cases 1-4 run on the unchanged tree against `filterOf`/`openPaletteItem`/`activeLabel` and the renders, and on the new readers after.

2. **Case 8 cannot run as the brief says: "each with `fetch` stubbed (as their existing tests stub it)".**
   - `tests/views/sessions/changes.test.ts:9-11`: "the branch listing the panel fetches in an effect is never sent".
   - `tests/views/sources/repositories/diff-pane.test.ts:3-4`: "The files of a diff are read in a browser and a server rendering reads nothing".
   - `tests/views/boards/deposit.test.ts:1-11`: "there is no fetch in this suite... Nothing is clicked". `listBranches` fires on a press.
   - `Source.svelte`'s `readOne` runs in a gutter effect. `CommitFiles` has no test file.
   - `grep -rn "stubGlobal" tests/views` shows stubs only for other views.
   - Under `spec.md`: "a behaviour that needs a DOM (an effect) is seen at the look", and effects are tested in `*.client.test.ts`.
   - So case 8 is never executed by the unit suite, and it would pass vacuously. Item 4 (the cast removal) has no executable evidence.
   - Change: have each body reader be an exported `.ts` function taking the answer (for example `branchesOf(body)`, `commitFilesOf(ok, body)`), tested directly in the view's existing test file (a `*.client.test.ts` is the alternative). Say the component keeps `fetch`. Add the new modules to the paths.

3. **Case 10's `map_label_mode` inputs (`3`, `'short'`) cannot distinguish a right reader from a wrong one.**
   - `state/boards/structure/graph.ts:91` uses only `options.labelMode === 'full'`. `3` and `'short'` draw identically.
   - Also, `Graph.svelte` draws nodes only after the Graphviz placement returns, so whether `MapView`'s server render shows labels at all is not verified.
   - Change: add `'full'` and `['full']`, and name the render that shows the labels, or move the check to `buildGraph` options.

4. **Case 10's page-collection part and case 12's "the page's saved bookmarks keep only the first" are unreachable.** Nothing renders `+page.svelte` (see Names 3). Change: expose the page's filled-bookmark rule as a function in `fs.ts` (for example `bookmarkRef` for opening plus a filled variant), keep only the `''` test in the page, and test the function.

5. **Case 4 names `tests/shell/panes/paneview.test.ts`, which does not render `PaneView.svelte`.** Its imports are from `pane-view.ts` only (header comment lines 1-7). `PaneView` renders in `tests/shell/workbench.test.ts` (`html()`, `:141`). Change: name `workbench.test.ts` for the PaneView part.

6. **Expected values I read against the unchanged code:**
   - Case 2: `{ search: 'a' }` gives `'a'` and an inherited key gives `'a'`. Every local reader reads `state[key]` (`File.svelte:115`, `Document.svelte:68`, and so on), and zod reads `input[key]` (`node_modules/zod/v4/core/schemas.js`, `$ZodObject.parse`: `el._zod.run({ value: input[key]...`). Holds.
   - Case 4: `stateNumber` gives `NaN, Infinity, -2, 0, 0` (`File.svelte:122` returns any number). `stateLabel` gives `null, null, 'x', null`. Holds.
   - Case 9: `nodeTone` with `'constructor'` and `{}` gives `'grey'` (`node-view.ts:25-26`: `{}['constructor']` is a function). `configuredThemes` gives `[]` and `['a']`. Holds.
   - Case 11: `LeadCard`/`RadarCard` give `'3', 'x', '', '', ''`. Holds.
   - Case 12: `openBookmark` opens for the first two and not the last two; `whereOf` gives `r/p, /p, /p, /p` (`Bookmarks.svelte:55`). Holds.
   - Cases 5, 6 and 7 are reachable: `source.test.ts:504-518` renders `data-source-line` from the `line` key, `config.test.ts:112` sets `{ open: [...] }`, `audit.test.ts:171,190` set `showMuted`/`search`.
   - Case 5's key is `line` (`Source.svelte:124`). The brief can name it now instead of "found before".

---

## The question

The goal: every untyped input of the views, `ui`, `shell` and routes read through a zod schema, today's answers kept, redundant hand checks deleted.

- **Cases 1-4:** can pass with the five readers added to `instance.ts` and no view calling them. Only verify 2's count and the stale-allowlist test (`duplication.test.ts:597-606`) catch that.
- **Cases 5-7, 9-12:** are all "kept answer" cases. They pass on the unchanged tree, so they pass with the goal unreached. Only verify 2's grep count and the reviewer's read prove the goal. This is by design, but the brief should say it.
- **Case 8:** can pass because it never runs (Cases 2).
- **Cases 13 and 14:** pass trivially on an unchanged tree. Where `page.test.ts:111` stays unedited, it fails once the goal is reached. So case 13 pushes against the goal (Names 3).
- **Item 1 (rule):** a hand check moved into `z.custom` or `.refine` is banned, but verify 2 lets a line "sit inside a schema built from the shared helpers or zod's types". A `z.custom((v) => typeof v === 'string')` satisfies that wording. Tighten verify 2 to forbid `typeof` inside `z.custom`/`refine`.
- **Item 2 (boundary):** adding allowed rows passes with no file importing them. Add `grep -l "data/shapes/shapes" src/lib/shell src/lib/views` as evidence.
- **Item 3:** see cases 1-4. The keyed `stateText(state, key)` cannot be "one schema at module level" when the key is a parameter. The brief should give the form (for example `readOr(wordShape, readAs(mapShape, state)?.[key], '')`) and say the inherited-key answer follows from `[key]`.
- **Item 4:** goal reached only if Graph and Merge are added and the cases run (Cases 2).
- **Item 5:** `Map.svelte:78`, `Usage.svelte:55`, `CommandCenter.svelte:63`, `palette-open.ts:42-46`, `node-view.ts:22-26` and `+page.svelte:89` are in the verify 2 count, so a left hand check is caught. `+page.svelte:89` also needs its test fixed (Names 3).
- **Item 6:** `LeadCard`, `RadarCard`, `Person:176`, `DatasetCard`, `LineCard`, `opening.ts:65`, `Bookmarks:55`, `+page:166,168` are all in the count. Verified.
- **Item 8:** testable by the duplication check.
- **Item 9:** the check `sed -n 148p DESIGN.md | grep -c 'src/lib/views'` prints 1 whenever the string appears anywhere on that long line. It tests the views only, not shell or routes. Test each of `src/lib/views`, `src/lib/shell`, `src/routes`.
- **Verify 3's casts grep** (`as Record<string, unknown>|\) as \{|as Answer|as T\[\]`): it prints 29 lines today. The 13 `as Record<string, unknown>` instance-state lines and the Source/Changes/CommitFiles/Diff body casts are deleted by items 3-4. `Graph.svelte:226` and `Merge.svelte:112` would print and fail the check (Premises 2). `node-view.ts:25` and `palette-open.ts:45` are converted by item 5. The list the brief calls "lines G names" does not match the output.

---

## Implied inputs

Each expected result is read from the unchanged code.

1. **State is a Map or class instance** (`new Map([['search','x']])`): hand code accepts it as an object and reads `state.search` = `undefined`, so `''`, `false`, `null`, `0`; `stateMap` returns it itself (`toBe`). zod's `isObject` is the same test (`util.js:215-217`). Missing from cases 1-4.
2. **State is `undefined`** (a tab with no saved state, the common case): `''`, `false`, `null`, `0`, `{}` for the five readers. Case 1 has `undefined`; cases 2-4 do not.
3. **State with an own `__proto__` key** (`JSON.parse('{"__proto__":{"search":"p"},"b":1}')`): `stateText` gives `''`; `stateMap` returns the object itself, and `{...stateMap(s)}` keeps `'__proto__'` in `Object.keys` (spread copies it as an own key). `tests/state/workbench/layout/instance.test.ts:125-127, 160-168, 232-235` already hold such rows for `cardCursor`, `withCardCursor` and `stateId`; the new readers need them too. `DESIGN.md:148` says a map built from an outside map's keys skips an own `__proto__` key; the five spread sites copy it. Decide: exempt the spreads in the `DESIGN.md:148` clause, or treat as a changed answer.
4. **A `WriteAnswer` that is not a map:** cannot occur (`writes.svelte.ts` builds the object in code). A failed answer has no `branches`; the expected result is `rows = []`.
5. **`retrieval` that is a list or text:** `normalise.ts:380` already turns a non-map into `undefined`. A view sees a map or `undefined`. A hand-built dataset with `retrieval: []` gives `method` undefined and `notes` `''`. Add to case 11.
6. **A body whose field is present but `undefined`:** JSON cannot carry it, so it applies only to maps handed in directly (`{ label: undefined }` gives `null`, `{ funding: undefined }` gives `undefined`). Not applicable to the HTTP cases.
7. **`status: ''` on Person's joint work:** `typeof '' === 'string'`, so an empty `Tag` is drawn today. A reader on `filledTextShape` would hide it. Missing from case 11 (it has `3` and `'live'`).
8. **`NaN` and `Infinity` into LeadCard and RadarCard:** `typeof === 'number'` gives `'NaN'` and `'Infinity'`. Missing from case 11.
9. **`configuredThemes` with `{ name: '' }` and duplicate names:** `typeof name === 'string'` gives `['']` and `['a','a']`. Missing from case 9.
10. **`nodeTone` with an inherited key** (`Object.create({ done: 'green' })`) gives `'green'`; with `JSON.parse('{"__proto__":"green"}')` and a node archived `'__proto__'` gives `'green'` (an own property). A `mapOfShape` reader (it skips an own `__proto__`, `shapes.ts` `mapOfShape`) would answer `'grey'`, a changed answer. Missing from case 9.
11. **Bookmark fields `{ root: 'r', path: 3 }` and `{ root: 'r' }`:** `openBookmark` does nothing; `whereOf` gives `r/`; the page drops them. Case 12 varies only `root`.
12. **`stateLabel` over an array with an own `label`** (`Object.assign([], { label: 'x' })`): `PaneView.svelte:172` gives `null`; `activeLabel` (`workbench-title.ts:14-16`) gives `'x'`. See Premises 6.
13. **`collections: []`:** the page registers `[]` and closes every collection tab. Unreachable by test (Cases 4).
14. **Changes with status 500 and a branches list:** `Changes.svelte:77-79` has no `ok` test, so the list is kept. `Source.readOne` (`:228`) returns `[]` when `ok` is false. Same for a rejecting `fetch` (`[]` in both). `CommitFiles` leaves `files` unchanged when `json()` throws (`:145` is skipped). Case 8 lists none of these.
15. **Diff's `attributes: 3` and `conflicted: 'true'`:** see Premises 3.

---

## ADRs

1. `ls tools/oculus/docs/adr` prints "No such file or directory" and `ls docs/adr` (from the hub root) does too. `ls tools/oculus/docs` prints `diagrams` only. `grep -n "adr" .agents/plan.yaml` prints nothing. The brief's statement is correct; no ADR touches the step.

---

## Declined to judge

- Whether allowlist lines 25, 31 and 32 are exactly the instance-state readers' clones. It needs a jscpd run, which is the test suite (Names 8).
- Whether `MapView`'s server render draws node labels at all (Cases 3). I did not run it.
- Whether `ui/` holds any untyped input beyond the 21 check lines. I only grepped for `: unknown`/`Record<string, unknown>`.
- Runtime and bundle cost of the new schemas in `PaneView`'s tab derivation and the pane strip. Decision 5 of the brief says no timing measure; Q85b item 13 and 14 measured both. I did not measure.
- zod behaviour I did not run: `z.number().positive().catch(0)` against `Number.isFinite && > 0`. I read `schemas.js:642` (`Number.isFinite`), not the positive check.
- Whether the three check lines at `allow-audits.txt` other than line 58 (`audit.test.ts`, `note.test.ts`, `source.test.ts`) are touched by the new cases. They are keyed by test name, not line, so adding cases leaves them alone.

---

## Usage

claude-sonnet-5-5 (served, checked in the subagent record), 311,875 tokens, 104 tool uses, 15.7 min.

## Closed

Each finding is closed by a change to `agents/briefs/Q85d.md`, re-read on main at 459bb908.

Names
- 1 (`filterOf`): "What is on the tree" names `History.svelte:45,58`, `history.test.ts:12,71-74` and `allow-audits.txt:58`; item 3 moves the four asserts into the `instanceText` table, removes the case, its import and the allowlist line, each named in the report; the paths name the three files.
- 2 (namesakes): the readers are `instanceMap`, `instanceText`, `instanceFlag`, `instanceLabel`, `instanceNumber`; the premise names `session-list.ts:80` and the fixture.
- 3 (`page.test.ts:111`): `pushedCollections` moves into `routes/views.ts` beside `registerCollections` (item 5), tested in `page.test.ts`; line 111 is rewritten as an audit of the call (item 10); the path is listed.
- 4 (the facade): `state/workbench/layout/index.ts` is in the paths and item 3 exports through it.
- 5 (docs): `README.md:13` and `DESIGN.md:323` are in item 9 and the paths.
- 6 (test files): item 10 names each existing test file and the two new ones (`node-view.test.ts`, `opening.test.ts`).
- 7 (shared with D27): "Steps in flight" names the six shared paths and the lines each step writes; judged simple, recorded in the dispatch entry's `shared_paths`.
- 8 (stale allowlist lines): the paths name `allow-duplication.txt`'s lines and "any other line this step's change ends", which the duplication check reports by name.

Premises
- 1: Deposit is moved out of class B as a typed value; it reads `answer.branches ?? []`.
- 2: Graph (`Graph.svelte:226`) and Merge (`Merge.svelte:112`) are in class B with their fields; verify 3 adds the `.json()) as` grep; the 137 lines are called a floor.
- 3: Diff's `attributes` and `conflicted` are in class B and in case 8.
- 4: Doc's `held` is a map reader under `instanceMap`, with the spread at `:70`.
- 5: Z179 (b), closed by the orchestrator in automode, booked in `plan.md` Rulings, the state file's closed log and `choices.md`; item 11 lists the changed answers; decision 7 records it.
- 6: `activeLabel`'s array case is a changed answer in item 11 and case 4.
- 7: decision 2 says 18 views plus `palette-open.ts`, `PaneView.svelte` and `workbench-title.ts`, with the grep.

Cases
- 1: the paragraph before case 1 names each reader's first-run route, the four click-handler spreads by reading.
- 2: the body readers move into `answers.ts` (item 4) and case 8 tests them directly.
- 3: `labelModeOf` in `graph.ts` with `'full'` and `['full']` (item 5, case 10).
- 4: `bookmarkRows` in `fs.ts` (item 6, case 12).
- 5: PaneView through `tests/shell/workbench.test.ts` (item 10).
- 6: case 5 names `line` and the render at `source.test.ts:504-518`.

The question
- Verify 2 adds the `z.custom|.refine(` grep and the `data/shapes/shapes` evidence per layer; item 9's check names the three areas; item 3 gives `instanceText`'s form.

Implied inputs
- Cases 1, 2, 4 add `undefined`, a `Map` and an own `__proto__` (item 3 rules the spread hands the map on whole and an own `__proto__` stays an own key, said in item 9's clause); case 8 adds `ok` false, a non-JSON body and a mixed list; case 9 adds inherited and own `__proto__` for `nodeTone` and themes with `''` and duplicates; case 10 adds `collections: []`; case 11 adds `NaN`, `Infinity`, `status: ''` and `retrieval: []`; case 12 adds `{root:'r', path:3}` and `{root:'r'}`; case 4 adds the array with an own `label`.
