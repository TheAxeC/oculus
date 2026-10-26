# Step O80 refuter report (on .agents/worktrees/migration-O80, base ee0f4259)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
# Verify 1, from the worktree root (npm run diagrams not run, see Declined to judge)
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:quick -- --base ee0f4259
test:quick: 116 changed file(s), from git since ee0f4259
test:quick: 302 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.1 s)
ok      svelte-check (23.3 s): 1793005586903 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (157.8 s)
ok      vitest (198.9 s)
ok      vitest slow (247.8 s)
test:quick: 250.2 s; every command passed

# Verify 2, the item 10 test files on the final tree, one run
$ npx vitest run <the 17 test files of the report's "Tests of item 10" table>
FAIL |unit| tests/checks/source/catalog-file-keys.test.ts > catalog file keys > has a reader for every top-level key of every catalog file
Error: Test timed out in 5000ms.
Test Files  1 failed | 16 passed (17)
     Tests  1 failed | 479 passed (480)
$ npx vitest run tests/checks/source/catalog-file-keys.test.ts   (three runs, alone)
x ... has a reader for every top-level key of every catalog file 5287ms  -> Test timed out in 5000ms.
x ... 5161ms   Tests  1 failed (1)
x ... 5226ms   Tests  1 failed (1)
$ npx vitest run tests/checks/source/catalog-file-keys.test.ts --testTimeout 0
ok ... has a reader for every top-level key of every catalog file 5451ms   Tests  1 passed (1)

# Verify 3, unused exports: not run (knip loads vite.config.ts); the exports the diff adds, grepped for importers in src
boardsGroup, boardsSource, BoardsSource, BoardView, boardViews, BoardViews, chosenHub, Cluster, clusters,
drawnSections, FOCUS_SECTIONS, focusSections, HEX_COLOUR, keyFiles, newProjectTier, oneWordWith, pageBoards,
pushedBoards, registerBoards, vocabFindings: each imported outside its own file (e.g. registerBoards and
pageBoards in src/routes/+page.svelte:46-51, drawnSections in Focus.svelte:61, Cluster in Lanes.svelte:43)

# Verify 4, the first-of-list grep over the brief's files: 31 lines; every hit is named in the report except
src/lib/views/boards/person/Person.svelte:96:    const folderPath = $derived(hubPathsOf({ folder }).at(0));
src/lib/views/boards/entry/Entry.svelte:166:        entry === null ? undefined : hubPathsOf({ link: entry.fields.link }).at(0)

# Verify 5, the wording grep over config src docs tests --exclude=local.yml
129   (wc -l; the report says 129)

# Verify 6, the history grep over src config docs tests --exclude=local.yml
(prints nothing, exit 1)

# Verify 8, case 16
$ OCULUS_TEST_HUB=$HOME/workspace/research-hub npx vitest run tests/checks/config/config-folder.test.ts --reporter=verbose
ok ... names a group of its own and a path under the hub for every document of the real hub 181ms
ok ... matches the real hub's own files to a schema each, read with no finding 1770ms
Test Files  1 passed (1)
     Tests  30 passed (30)

# The report's case-run programs, rebuilt from its quoted source in the reviewer's scratch folder
# (before: W pointed at .agents/worktrees/O80-base; after: W at the worktree; TMPDIR in the scratch folder)
case1 (base copy), findings-cases (base copy), misc-cases (base copy), case1-after, findings-after, misc-after:
each exit 0; diff of each output against the report's quoted output, temp paths normalised: no difference
diff case1 (base) case1-after: only the program's own headings, "project_boards":true on the rail entry,
the byTitle/awaiting fields, and "dismissed held back by the declined toggle: true" -> "false"

# Reviewer's own probes (node 24 importing the .ts files, scratch folder only)
ticker3.mjs over base copy and worktree, hub file "ticker_categories: { funding: null }":
  base:  merged funding {"category":"funding"}
         list problem {"index":8,"field":"ticker.category","word":"findings.collections.category_unknown","values":["funding"]}
  after: merged funding {}
         list problem {"index":8,"field":"ticker","word":"findings.collections.ticker_unread","values":["{}","funding"]}
  same, hub file also writing collections: [ { key: funding, ..., ticker: { category: funding } } ]:
  after: finding "collections[0].ticker.category names funding, which the hub's words no longer hold; it is not read"
         list problem {"index":0,"field":"ticker","word":"findings.collections.ticker_unread","values":["{}","funding"]}
tiers.mjs, hub file "tiers: { teaching: { label: Teaching }, research: { default: true } }" (the templates.md example):
  oculus tiers: {"research":{"label":"Research","unmarked":true,"default":true},"personal":{"label":"Personal"},"software":{"label":"Software"}}
  merged tiers: {"research":{"default":true},"personal":{"label":"Personal"},"software":{"label":"Software"},"teaching":{"label":"Teaching"}}
grid.mjs, focus_clusters: [ { key: now, label: focus.cluster_now, muted: false, layout: grid } ]:
  clusters drawn: []
  lanes naming now: [ 'run', 'push', 'revise' ]
HUB_LIST rows: base 47, after 49 (docs/data-map.md says 49)
wc -l of every changed file: context.ts 880 (base 880), model/index.ts 879, writes.svelte.ts 867; none over the limits
ls -A: tests/state/boards/board 4, tests/checks/source 6, src/lib/data/shapes/boards 5, sections 7
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds, `boardViews` and `boardsSource` in `presets.ts`, `pageBoards`, `pushedBoards` and `registerBoards` in `src/routes/views.ts`, registered on the first frame and on each push in `+page.svelte`; `project_boards` read by `boardsGroup` in `rail.ts` with its three findings; the rail tick in `RailEditor.svelte`; case 1 identical apart from the ruled `dismissed` line; cases 2, 3, 4 and 17 pass.
- 2: holds, `clusters` in `focus.ts`, `Lanes.svelte` names no cluster word, the findings in `sections/vocab.ts`, `from: focus_clusters` on the lane's cluster option; see Behaviour 2 for the lanes of a cluster row that does not read.
- 3: holds, `newProjectTier`, `chosenHub` at every site of premise 3, `homeOf` and `homeOfLiterature` returning none with several hubs and `noHub` answering 409 with `server.workspace.which_hub`; cases 7, 8 and 9.
- 4: holds for the lanes, `moveOf`, `movable` and `moveOnto` read `move_writes`; see Spec 1 for the reach of `recordWithout` past `move_writes`, and Proof 2 for the chip half.
- 5: holds, `oneWordWith` read by `leads.ts`, `ticker.ts`, `new-entry.ts`, `lead-application.ts`, `manifest.ts` and `new-project.ts`; `flag_twice` in `sections/vocab.ts`; LeadCard's controls disabled with their tips; `dismissed` keeps `lead_closed` alone (case 1 output).
- 6: holds, every `categories` row names `color`, `colourOf` has no stage fallback, `rail_color` in `vocab.yml`, `HUB_LIST` and `VOCAB_SHAPES`; cases 13 and 14.
- 7: holds, `project.helper.xlink_*_glyph` and `focus.command.glyph_*` read with `t()`; grep 4 prints no `GLYPHS`.
- 8: holds, `focus.sections` in `behavior.yml` and its options entry, `focusSections` and `drawnSections`, `Focus.svelte` walks the list; case 15.
- 9: holds for the items it names (HELP.md, data-map.md at 49 keys, templates.md, apps.md, `vocab.yml`'s head comment, grep 6 empty); see Standards 2 and 3 for the comment paragraphs and the tiers example.
- 10: violated, Proof 1 (new rows with no failing first run on the unchanged tree) and Proof 2.

Cases of the brief's "Cases":

- 1: met, the reviewer's rerun of `case1.mjs` on the base copy and `case1-after.mjs` on the worktree matches the quoted outputs; the only change of a fact is `dismissed held back by the declined toggle: false`, as Z1021 rules.
- 2: met, `board-views.test.ts` passes in the verify 2 run; `findings-after.mjs` prints `view theses group=projects order=7`.
- 3: met, the `boardsFindings` row 'case 3: a board naming no label' passes.
- 4: met, the four `rail.test.ts` rows pass.
- 5: met, 'case 5' of 'the Focus lanes' and the `vocab.test.ts` rows pass; `findings-after.mjs` prints the two lane findings and the options entry `"from":"focus_clusters"`.
- 6: met, the finding `focus_clusters.0.layout must be one of columns, full_width` is given; see Behaviour 2.
- 7: met, `vocab.test.ts` and the `writes.test.ts` row pass; the refusal is the new `idea_tier_none`, since `idea_tier` fills `{0}` with a tier the write does not have, as the report says.
- 8: met, the two 'case 8' rows pass and `misc-after.mjs` prints `offered=true ... research` and `offered=false ... undefined`.
- 9: met, `misc-after.mjs` prints chosen `null`, `"hub"`, `"lab"` and `writtenFile` `null` for both writes; the 409 rows of `hub-writes.test.ts` pass.
- 10: met, the two 'case 10' rows pass (the in-prep row also passes on the base, Proof 1).
- 11: met, the `vocab.test.ts` rows and `findings-after.mjs`.
- 12: met for the finding and the reader (`misc-after.mjs`: the task written with no status, `appliedWord` `""`); the disabled control is for the look on landing.
- 13: met, the `categoriesFindings` row passes.
- 14: met, the `hub-vocab.test.ts` and 'the rail count of a board' rows pass.
- 15: met, `misc-after.mjs` prints each list as the case gives it.
- 16: met, verify 8 above.
- 17: met, 'the board views' rows pass and `boardsFindings` gives no finding for `focus`.
- 18: not verifiable, a Settings save while the page runs; the look on landing settles it.

## 1. Spec

- `src/lib/data/sources/config/merge/hub-layer.ts:187`: "if (isMap(spec) && spec.holds === 'record' && isMap(spec.fields) && isMap(value)) { return recordWithout(spec.fields, value, lost); }"; what is wrong: item 4 asks that a word a hub removes leave a lane's `move_writes`; `recordWithout` is applied to every options field with `holds: record`, and the other one is a collection's `ticker` (`config/options/sources.yml`, the `collections` entry's `ticker`, `holds: record` with `category` from `ticker_categories`). Its own doc comment (`hub-layer.ts:149`) names "a collection's `ticker`", but no item asks for it, the report does not state it, and the docs that list the word lists a removed word leaves (`vocab.yml`'s head comment, `docs/templates.md`, `docs/data-map.md`, `docs/HELP.md`) name the `move_writes` words and not a collection's ticker category; failure scenario: a hub whose settings file holds `ticker_categories: { funding: null }` gets, on the base, the problem "ticker category funding names no word of ticker_categories; the entry gives no ticker lines"; after the change the merged entry is `ticker: {}` and the problem is `ticker_unread`, "the ticker {} of the entry funding is not a map of a category word and an undated flag", which names a value the hub never wrote; when the hub writes its own `collections` list, the same removal gives two findings for one cause (the merge's "collections[0].ticker.category names funding, which the hub's words no longer hold; it is not read" and the `ticker_unread` line); verdict: none of the brief's items is made violated, the reach is outside item 4.

## 2. Proof

- `tests/state/client/held-unsaved.test.ts:448` and `:423`: "'an Add to Lit Watch naming the hub two', ['one', 'two'], 'radar.yml', (w: Writes) => w.addRadarEntry({ title: 'P' }, 'two')" with the held predicate "() => true,"; what is wrong: item 10 asks each new row's first run on the unchanged tree to be quoted with its failure; this row passes on the base by reading (the base `added('radar')` gives the first hub's file, hub one's `radar.yml`, held by `() => true`, refused with the same sentence), and the builder's own count for the file is "3 failed of 24", the three new 'names no file' rows. The same holds for the two new rows 'is %s (G8)' of `tests/state/forms/new-entry.test.ts:180` (the base `collections.find(...)` and `collections.at(0)` both give `second`; the builder's count "3 failed of 24" is the two task rows and the person 'is none' row), and, by reading the base `moveOnto`, for 'case 10: a project at in-prep is on the lane already and is written nothing' (`board-rules.test.ts:434`), 'a blocked project at in-prep keeps its stage and loses its chip' (`:439`) and both rows of 'case 11: moves onto a chip lane' (`:454`). The base rows also used `(held) => held.root === file.root && held.path === file.path`, which tied each refusal to one hub's file; `() => true` with both hubs' radar files named `radar.yml` cannot tell hub one's file from hub two's; failure scenario: a page that checks hub one's radar file when the reader picked hub two passes the row 'naming the hub two'; verdict: item 10 violated.
- `tests/state/boards/board/board-rules.test.ts:463`: "('case 11: moves onto a chip lane, $name', (row) => { ... hubMoveOnto(moved, { key: 'blocked' }, () => CONFIG)"; what is wrong: the chip half of item 4 is tested only on oculus's `blocked` lane, `chips: [blocked]` with `move_writes: { chip: blocked }`, where the word of `move_writes` is also the lane's first chip; no row has a chip lane whose `move_writes` names a chip other than its first (the stage half has one, case 10's `push` with `move_writes: { stage: submit-ready }`); failure scenario: a `moveOnto` that pushes `lane.chips[0]` instead of `move.word` passes every row (judged by reading the rows); verdict: item 10 violated.
- Report, "Tests of item 10", the row of `tests/checks/source/catalog-file-keys.test.ts`: "not run: an existing row moved | 1 passed"; what is wrong: the table's method is `npx vitest run <file>`; three runs of that command on the final tree time out at 5000 ms (5287, 5161, 5226 ms), and the row passes only with `--testTimeout 0` (5451 ms), the flag `test:checks` and `test:quick` run it with. In `keys.test.ts` the describe read the sources through `codeOf`, whose cache the file's other tests had filled; in its own file `keyReaderCode` strips the comments of every source file cold. The decision resting on it: G24's Test line gains this file, and a reader running the file alone gets a red; failure scenario: `npx vitest run tests/checks/source/catalog-file-keys.test.ts` fails on a clean tree; verdict: none.
- Report, "Tests of item 10", the row of `tests/server/edit/config-value.test.ts`: "passes on the base | 17 passed"; what is wrong: the builder's transcript has no run of this file on the base copy (it is edited at tool call #1813, after the red of the second list run), and by reading the edited assertion fails on the base, whose `idea` category row has no `color`; failure scenario: a reader takes the row as a base run of the edited assertion; verdict: none.
- Report, "Judgment calls", grep 4's remaining hits; what is wrong: the brief asks each remaining hit named with why it is no first-of-list default; `Person.svelte:96` (`hubPathsOf({ folder }).at(0)`) and `Entry.svelte:166` (`hubPathsOf({ link: entry.fields.link }).at(0)`) are not named (verify 4 above); failure scenario: the orchestrator cannot tell from the report whether these two were judged; verdict: none.

## 3. Standards

- `src/lib/state/client/context.ts:779`: "// A custom editor's tab is saved by its frame; the save took when the frame cleared its mark."; what is wrong: rules file, the size rule ("comments are not shortened and code is not compacted to stay under it"): the step adds two lines to `createClientState` (the moved `const registry` and the `registry` argument) and takes one out (the old `const registry`); this unrelated two-line comment ("..., and the save took when the frame cleared its / mark.") was cut to one line, so the file stays at 880 lines, the limit, where it would be 881; the report gives `context.ts` as "880 at the base and after" without saying a comment was cut for it; failure scenario: the next step that adds a line to `context.ts` finds it at the limit with no split made; verdict: none.
- Comment paragraphs the step edited and left with a line ending short inside a sentence (rules file, "A comment edited by the step is rewrapped as a whole paragraph at 100 columns"): `src/lib/data/sources/config/merge/hub-layer.ts:312` " * oculus's left with no word stays with" (40 columns), `src/lib/data/helpers/hub-names.ts:703` " * `manifest_fields`, the fields the hub adds to the project form, is read" (74), `src/lib/data/sources/config/merge/in-place.ts:11` "// replaces oculus's when it is written `#rrggbb`. What cannot be applied is a" (78), `src/lib/state/boards/focus.ts:587` " * another project's id, drawn by waiting.ts. The" (49), `src/lib/state/sessions/source/write-files.ts:18` "// write lands where the server" (31), `src/lib/views/shared/card/feed/lead-apply.ts:4` and `:8` (55 and 62), `src/lib/views/shared/forms/NewIdeaForm.svelte:11` "// of `tiers` carrying `default`." (37, the paragraph goes on), `src/lib/views/shared/forms/entry/entry-add.ts:101` " * that holds it, those of the" (30), `src/lib/views/system/workbench/RailEditor.svelte:7` (65), `src/routes/+page.svelte:114` "// that frame. The write token goes in" (42); each line's next word fits on it within 100 columns (the reviewer's scan of the paragraphs holding an added line); failure scenario: a reader of these comments meets a sentence broken mid-line, the AI-tell the prose rules ban; verdict: none.
- `docs/templates.md:260`: "#     research: { default: true }"; what is wrong: the `config.yml` template says a word named here replaces oculus's row in oculus's place; copied as written, the example replaces oculus's `research` row whole, which already carries `default: true`: the merged `tiers` becomes `{"research":{"default":true},...}`, losing `label: Research` and `unmarked: true` (`tiers.mjs` above); failure scenario: a hub that follows the example has its research tier drawn by its key with no label and loses the `unmarked` flag, with no finding; verdict: none.
- The builder's transcript, the verify list and test runs; what is wrong: rules file, "Token discipline": the list was started four times, the first (#1708) before the last change and stopped (#1726) when the size of two test files was found; `npx vitest run --dir <scratchpad>/o80 --project unit` (#145) ran the unit project's files of the worktree on the unchanged tree for about four minutes, a whole-suite command; run 2's red in `tests/ui/html.dom.test.ts`, a file the step does not change, was not rerun alone (no run of it in the transcript) and is named only as having "passed in run 4". The waits on those runs were `sleep 1; cat` (#146), `sleep 20; cat` (#148) and a Monitor whose command is `until grep -q "^exit " ...verify.txt; do sleep 5; done` (#1776), where the rules file asks a foreground command with a timeout or one background command waited on. The report states the four runs and the whole-suite command; failure scenario: the tokens and minutes of the extra runs; verdict: none.
- The builder's transcript: `git ls-tree -r --name-only HEAD docs` (#1613) and `git ls-files ...` (#1728, #1744, #1785, #1869); what is wrong: rules file, "Where you work": the git commands a builder runs are `git status`, `git diff` and `git show`, and `ls-files` is named among those never run; the report's "Folder limits" row cites `git ls-files` as its evidence; failure scenario: none to the tree (both read), a breach of a standing rule; verdict: none.

## 4. Behaviour

- `src/lib/data/sources/config/merge/hub-layer.ts:153` (`recordWithout`); what is wrong: a hub that takes a ticker category out changes what its collections' tickers read and which finding it sees (Spec 1: `category_unknown` before, `ticker_unread` naming `{}` after, and two findings where the hub writes its own `collections`); the report's "Host- or user-visible changes for the look on landing" does not name it; failure scenario: the Findings view shows a sentence about a `ticker {}` the reader cannot find in any file; verdict: none.
- `src/lib/data/sources/config/sections/vocab.ts:96` and `src/lib/state/boards/focus.ts:93`: "keys.add(key);" and "layout: z.enum(['columns', 'full_width']),"; what is wrong: a `focus_clusters` row whose `layout` (or `sort`) does not read is dropped by `clusters()`, so its lanes are not drawn, but `clusterFindings` adds its key to the known clusters, so the lanes naming it get no lane finding, and the row's own finding ("focus_clusters.0.layout must be one of columns, full_width") does not say the cluster or its lanes are not drawn; the report's case 6 note names the other clusters' lanes and not these; failure scenario: a hub with `focus_clusters: [ { key: now, ..., layout: grid } ]` loses the Run, Push and Revise lanes from the board (`grid.mjs`: clusters drawn `[]`, lanes naming now `run, push, revise`; `findings-after.mjs` case 6 lists lane findings for review, blocked, backburner, scope, derisk, build and idea only); verdict: none (case 6 asks only for the row's finding, which is given).

## Declined to judge

- `npm run diagrams`, the verify list's first command, was not run: it writes into the worktree; `test:quick` was run with `--base ee0f4259` alone.
- `sh utils/unused-exports.sh` was not run: knip loads `vite.config.ts`. The exports the diff adds were grepped for importers instead (verify 3).
- `test:quick` and case 16 load `vite.config.ts` through vitest; they were run because the brief's verify list names them, and no other vitest run touched a copy of the base.
- The first failing runs of the new rows on a base copy were not rerun: that needs vitest over a base copy with its own `vite.config.ts`. Proof 1 rests on reading the base code and the builder's own failure counts.
- Case 12's disabled apply control and case 18's board added by a Settings save while the page runs: the look on landing settles them.
- Whether `isLeadDeclined`, `isLeadApplied` and `isLeadOpen` (`src/lib/data/accounts/leads.ts`), which classify a status by its own flag, should also answer none when two words carry the flag: item 5 names the readers of "the one word", and these are not among them; a ruling on item 5's reach would settle it.

Reviewer usage: af6579c090daa182a, claude-opus-5-5, 101917 tokens, 175 tool uses, 35 min 13 s.

## Repair round 1, refuted

```
# The round's verify list, once, from the worktree root (docs/diagrams: md5 of every file 4eb9353e87d291c9cca7947c0b13dafb before and after, so npm run diagrams changed nothing)
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams && npm run test:quick -- --base ee0f4259    (exit 0)
test:quick: 119 changed file(s), from git since ee0f4259
test:quick: 302 test file(s)
ok      prettier (6.7 s): All matched files use Prettier code style!
ok      ASCII gate (9.0 s)
ok      svelte-kit sync (36.9 s)
ok      eslint (75.0 s)
ok      svelte-check (92.4 s): 1793010506547 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (184.3 s): Duration  168.57s (transform 98.17s, setup 0ms, import 274.54s, tests 271.05s, environment 6ms)
ok      vitest (200.0 s): Duration  184.61s (transform 259.01s, setup 0ms, import 407.24s, tests 248.00s, environment 59.90s)
ok      vitest slow (241.9 s): Duration  226.59s (transform 19.94s, setup 0ms, import 188.72s, tests 700.08s, environment 17ms)
test:quick: 280.1 s; every command passed

# Check 2, the base-copy runs items 3 to 5 ask for, in the report's form, in the reviewer's own scratch folder
# (the four folders of .agents/worktrees/O80-base, the worktree's root files and .svelte-kit, node_modules linked,
#  the worktree's final test file copied in; diff -rq against O80-base lists only the four copied test files;
#  git diff --stat ee0f4259 -- vite.config.ts package.json tsconfig.json eslint.config.js .prettierrc prints nothing)
$ npx vitest run tests/state/client/held-unsaved.test.ts -t "a write that adds a record and names no hub" --reporter=verbose
<multiplication sign> ... refuses an Add to Lit Watch naming the hub two over the file of the hub the server writes
<multiplication sign> ... names no file for an Add Lead / an Add to Lit Watch / an Add to Tasks with two hubs, so the server answers it (G8)
<check mark> ... refuses an Add Lead / an Add to Lit Watch / an Add to Tasks / a Save to Literature, whose hub is the one hub that holds the collection over the file of the hub the server writes
AssertionError: expected [ { kind: 'radar-add', ...(1) } ] to deeply equal []
AssertionError: expected [] to have a length of 1 but got +0
      Tests  4 failed | 4 passed | 16 skipped (24)
$ npx vitest run tests/state/forms/new-entry.test.ts -t "the hub a" --reporter=verbose
<multiplication sign> is none with two hubs holding tasks when there is no primary, said by asking which (G8)
<multiplication sign> is none with two hubs holding tasks when the primary holds no tasks collection, said by asking which (G8)
<multiplication sign> is none with two hubs holding people and none named, said by asking which (G8)
<check mark> is the hub named (G8); <check mark> is the one hub holding people when none is named (G8)
Error: text key not in the text catalog (config/text/): app.palette.task_add_which_hub
Error: text key not in the text catalog (config/text/): editor.add_person_which_hub
      Tests  3 failed | 6 passed | 15 skipped (24)
$ npx vitest run tests/state/boards/board/board-rules.test.ts -t "the Focus lanes" --reporter=verbose
<multiplication sign> moves onto a stage lane by its move_writes: 'case 10: a project at exploring is wr...'
<multiplication sign> case 11: a move onto a chip lane listing two chips adds the chip of move_writes, not the lane's first
<multiplication sign> takes no move onto a lane without move_writes
<multiplication sign> case 5: a cluster added after incubate is a fourth columns cluster drawn after it, holding the lane naming it
<check mark> 'case 10: a project at in-prep is on t...'; <check mark> 'a blocked project at in-prep keeps it...'; <check mark> both rows of 'case 11: moves onto a chip lane'
AssertionError: expected { stage: 'in-prep' } to deeply equal { stage: 'submit-ready' }
AssertionError: expected { 'status.chips': [ 'admin-prep' ] } to deeply equal { 'status.chips': [ 'blocked' ] }
AssertionError: expected true to be false // Object.is equality
TypeError: Cannot read properties of undefined (reading 'slice')
      Tests  4 failed | 7 passed | 90 skipped (101)
$ npx vitest run tests/server/edit/config-value.test.ts -t "writes a removed and a relabelled stage" --reporter=verbose
<multiplication sign> ... writes a removed and a relabelled stage as what changed from oculus's, and the merge gives it back
AssertionError: expected { key: 'idea', label: 'idea', ...(1) } to deeply equal { key: 'idea', label: 'idea', ...(2) }
      Tests  1 failed | 16 skipped (17)

# Check 2, item 2's failing run on the round's unchanged tree: a scratch copy of the worktree with every path of
# files.txt taken from .agents/worktrees/migration-O80-round-1, the round's two new files removed, the final vocab.test.ts copied in
$ npx vitest run tests/data/shapes/catalog-files/vocab.test.ts -t "whose row does not read"
<multiplication sign> words each lane of a cluster whose row does not read, and of oculus's clusters the hub's list leaves out
AssertionError: expected [ ...(8) ] to deeply equal [ ...(11) ]   (the received list lacks focus_lanes[0] run, [1] push, [2] revise)
      Tests  1 failed | 11 skipped (12)
$ npx vitest run tests/data/shapes/catalog-files/vocab.test.ts --reporter=verbose   (same copy)
<multiplication sign> case 5: ...; <multiplication sign> case 6: ...; <multiplication sign> words each lane of a cluster whose row does not read ...
      Tests  3 failed | 9 passed (12)

# Check 2, after the change, on the worktree
$ npx vitest run tests/state/client/held-unsaved.test.ts         Tests  24 passed (24)
$ npx vitest run tests/state/forms/new-entry.test.ts             Tests  24 passed (24)
$ npx vitest run tests/state/boards/board/board-rules.test.ts    Tests  101 passed (101)
$ npx vitest run tests/server/edit/config-value.test.ts          Tests  17 passed (17)
$ npx vitest run tests/data/shapes/catalog-files/vocab.test.ts   Tests  12 passed (12)
$ npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts   Tests  16 passed (16)
$ npx vitest run tests/state/workbench/navigation/pages.test.ts  Tests  13 passed (13)
$ npx vitest run tests/checks/source/catalog-file-keys.test.ts --testTimeout 0 --hookTimeout 0   Test Files  1 passed (1)  Tests  1 passed (1)

# Check 3
$ sh utils/unused-exports.sh   (exit 0, 341 lines; base file 344 lines)
$ diff .agents/worktrees/O80-base/unused-exports.txt <after>
< ERROR: Error loading vite.config.ts (File './.svelte-kit/tsconfig.json' not found.)
< ERROR: Please fix or visit https://knip.dev/reference/known-issues
< knip stopped with status 2
(no line added)

# Check 4, the brief's grep in its literal form: 33 lines, the same hits the round's report names
# (focus.ts:43,93,322; Person.svelte:96,177; Entry.svelte:152,166; presets.ts:474,545; new-project.ts:58,76,95; hubs.ts:53; write-files.ts:199; ...);
# the .find( grep over the same files: 39 lines
# Item 6's reading: hubPathsOf (src/lib/state/boards/collection/index.ts:352) gives at most one path per field of PATH_FIELDS,
# each caller hands it one field; the folder opens in rootOf(join.person) (Person.svelte:98), the link in rootOf(entry) (Entry.svelte:139)

# Check 5:  129 (wc -l)
# Check 6:  prints nothing, exit 1
# Check 8:  OCULUS_TEST_HUB=$HOME/workspace/research-hub npx vitest run tests/checks/config/config-folder.test.ts --reporter=verbose
#   <check mark> names a group of its own and a path under the hub for every document of the real hub 163ms
#   <check mark> matches the real hub's own files to a schema each, read with no finding 1598ms
#   Test Files  1 passed (1)   Tests  30 passed (30)
# wc -l of the 43 files the round changes (diagrams left out): every count equal to the report's table; context.ts 849 (base 880),
#   terminal-host.ts 66, focus-clusters.ts 50; ls -A: state/workbench/layout/tabs 6, data/shapes/boards 6, state/client 10
# LC_ALL=C grep -n '[^ -~]' over the 43 files and the report: prints nothing, exit 1
# Item 7: grep -n "A custom editor's tab is saved by its frame" -A1: context.ts:747-748 equal to the base's :778-779;
#   grep -rn "terminal-host" src tests: context.ts:70 (import) and :250 (comment)
# Item 8: the reviewer's scan of every comment line in a paragraph holding a line the step added, in every changed .ts and .svelte file:
#   src/lib/state/workbench/rail-badges/rail-badges.svelte.ts:78: (90 cols, next `rail:)   (the one hit the report names)
# Item 8: the reviewer's hunk probe over the round's delta: 52 hunks in 33 files change line breaks only, the words of each kept in order

# The round's case-run programs, run from the builder's o80r1 folder, TMPDIR in the reviewer's scratch folder
$ node ticker.mjs .agents/worktrees/O80-base       -> merged funding ticker {"category":"funding"}, list finding [collections[8].ticker.category] ... ; with collections: [collections[0].ticker.category] ...; push lane move_writes undefined
$ node ticker.mjs .agents/worktrees/migration-O80  -> line for line the base's, except: merged push lane stages ["submit-ready"] move_writes {}
$ node ticker.mjs <the round's unchanged tree>     -> merged funding ticker {}, [collections[8].ticker] the ticker {} ...; with collections: the merge finding and [collections[0].ticker] ...  (the report's "before")
$ node tiers.mjs .agents/worktrees/migration-O80   -> merged tiers {"research":{"label":"Research","unmarked":true},...,"teaching":{"label":"Teaching","default":true}}, tiers carrying default: ["teaching"], merge findings: []
# Round 0's after-programs, rebuilt from the report's quoted source, on the repaired worktree:
$ node case1-after.mjs     -> diff against the report's quoted output (temp paths normalised): no difference
$ node misc-after.mjs      -> no difference
$ node findings-after.mjs  -> 27 diff lines: "no row" -> "no readable row" in the lane findings and in the lane cluster's options help, and case 6's input now also listing run, push and revise
# The reviewer's probe over withHub (tests/data/sources/config/layers/layers-fixture.ts), focus_clusters findings only:
#   [ { key: now, label: focus.nosuch, muted: false, layout: grid } ]
#     round's unchanged tree: focus_clusters.0.layout must be one of columns, full_width
#                             focus_clusters[0].label | the label of the Focus cluster now names focus.nosuch, which the text catalog lacks; it reads as absent
#     after:                  focus_clusters.0.layout must be one of columns, full_width   (no label finding), then the ten lane findings
```

### Verdicts

Items of the brief's "What to build", in its numbering, for the whole diff since ee0f4259:

- 1: holds, `boardViews` and `boardsSource` in `presets.ts`, `registerBoards` in `src/routes/views.ts`, `project_boards` through `boardsGroup` in `rail.ts`; the verify list passes and `case1-after.mjs` prints the report's output unchanged.
- 2: violated, Spec 2. The lanes of a cluster row that does not read now get their finding (the new `vocab.test.ts` row fails on the round's unchanged tree and passes after; `findings-after.mjs`). The label, glyph and repeated-key findings of such a row are gone.
- 3: holds, the hub rows of `held-unsaved.test.ts` and `new-entry.test.ts` fail on the base where the behaviour changes, and the report names each row that passes there as kept behaviour; `misc-after.mjs` is unchanged.
- 4: holds, first refutation Spec 1 is closed (`ticker.mjs` after equals the base apart from the lane's own `move_writes {}`), and the chip half is tested by the new row, which fails on the base (`admin-prep` written) and passes after.
- 5: holds, `oneWordWith` readers unchanged in the round; the `vocab.test.ts` case 12 rows pass.
- 6: holds, the `config-value.test.ts` row fails on the base copy and passes after.
- 7: holds, unchanged in the round; check 4 prints no `GLYPHS`.
- 8: holds, `drawnSections` unchanged in the round; `misc-after.mjs` is unchanged.
- 9: holds, `docs/templates.md` tiers example (`tiers.mjs`: one `default`, on `teaching`, `research` keeps its label and `unmarked`), comment paragraphs rewrapped (one short line left, at a code span), check 6 empty.
- 10: holds. First refutation Proof 1 and Proof 2 are closed by the base runs above. See Proof 1 for two changed rows with no quoted first run, whose failure the reviewer's run supplies.

Cases of the brief's "Cases":

- 1: met, `case1-after.mjs` on the repaired worktree prints the report's output unchanged.
- 2: met, `board-views.test.ts` passes in the verify list.
- 3: met, the `boardsFindings` row passes in the verify list.
- 4: met, the `rail.test.ts` rows pass in the verify list.
- 5: met, 'case 5' of 'the Focus lanes' passes, and the `vocab.test.ts` case 5 row passes after.
- 6: met, the layout finding is given, and now also the findings of the cluster's three lanes (the `vocab.test.ts` case 6 row).
- 7: met, `vocab.test.ts` case 7 and the `writes.test.ts` row pass.
- 8: met, `misc-after.mjs` is unchanged (`offered=true ... research`, `offered=false`).
- 9: met, `misc-after.mjs` is unchanged; the `hub-writes.test.ts` rows pass in the verify list.
- 10: met, the 'case 10: a project at exploring' row fails on the base and passes after.
- 11: met, `vocab.test.ts` case 11 and the new chip row pass.
- 12: met for the finding and the reader (the two `vocab.test.ts` case 12 rows pass). The disabled apply control is not verifiable here. It is settled by the look on landing, on the Leads view with `lead_applied` on `applied` and `closed`.
- 13: met, the `categoriesFindings` row passes in the verify list.
- 14: met, `hub-vocab.test.ts` passes (16 of 16).
- 15: met, `misc-after.mjs` is unchanged.
- 16: met, check 8 above.
- 17: met, 'the board views' and `boardsFindings` rows pass in the verify list.
- 18: not verifiable. It is a Settings save that adds `theses` while the page runs, settled by the look on landing in the Projects group.

### Findings

#### 1. Spec

- The builder's scratch folder `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o80r1/` and the round's commands. The numbers below count the builder's tool calls from the round 1 message, with the transcript line of `agents/agent-a1c591e9512282600.jsonl` in brackets. Report, "Repair round 1", "The case-run programs": "### rewrap.mjs (item 8, the rewrapped form of each paragraph, applied by Edit)".
  - What is wrong: the round's head paragraph says "Write no script ... The only program allowed is a case-run program ... it only prints the result of each case". No line of `plan.md`'s Rulings approves any other program. The builder wrote or ran these programs, which do more than print case results:
    - `rewrap.mjs` (Write #129 [7167], run #135 [7201] and #136 [7207]) prints each comment paragraph rewrapped. Its output, `rewrap-out.txt` (1143 lines, written by a `>` redirect), is the text of the item 8 edits the Edit tool then applied. In the delta these are the 52 hunks in 33 files that change line breaks only. So this program produced the edits.
    - `wrap.awk` prints the comment lines that end short. It is a check of item 8 and runs no case of the brief. Its first form was written by `cat > .../wrap.awk <<'EOF'` (#30 [6632]), then removed with `rm` (#31) and written again with Write (#32).
    - The inline shell and `awk` loops of #35, #130, #135, #136, #210 and #213 list the step's added lines, feed the two programs and write `wrap-after.txt`.
    - Two `python3 - <<'EOF'` programs (#7 [6502], #8 [6507]) and four `jq` programs (#216, #220, #224, #225) read the builder's own transcript and print.
    - The base-run folder `o80r1/baserun` was built by `mkdir -p`, `cp -R` of the base copy's four folders and of the worktree's root files and `.svelte-kit`, `ln -s` of `node_modules`, and `cp` of four test files into it (#90 [6949], #96 [6985]).
    - Outputs were saved by `tee` and `>` (#22, #128, #233, #245).
  - The report's first paragraph names only the heredoc and the redirects. It files `wrap.awk` and `rewrap.mjs` under "The case-run programs", and it does not list the files whose hunks came from `rewrap.mjs`. The ruling "Unapproved builder scripts" asks for that list in the round.
  - Failure scenario: a defect of `rewrap.mjs` (a paragraph merged with its neighbour, a word dropped) reaches 33 files with no hunk-by-hunk read. The reviewer's hunk probe finds that each of the 52 hunks keeps its words in order. The orchestrator's read under the ruling can start from that list (`diff -u` of each path of `files.txt` against the snapshot).
  - Verdict: none (disposition under the ruling "Unapproved builder scripts").
- `src/lib/data/sources/config/sections/vocab.ts:85`: "for (const { at, row } of readClusterRows(config[FOCUS_CLUSTERS])) {".
  - What is wrong: round item 2 asks that a key count as known only for a row `clusters()` keeps. The delta does that, and it also takes the other checks of `clusterFindings` off every row that does not read. On the round's unchanged tree, `cluster_word` (a `label` or `glyph` naming no catalog word) and `cluster_repeated` ran over every map row with a key. Now they run only over rows that pass the row shape.
  - Brief item 2 lists "whose `label` or `glyph` names no catalog word, or two rows of one key" as findings of a cluster row, whatever its layout. The fix reaches beyond its finding and removes those two checks for such rows.
  - Failure scenario: a hub writing `focus_clusters: [ { key: now, label: focus.nosuch, muted: false, layout: grid } ]` got the layout finding and "the label of the Focus cluster now names focus.nosuch, which the text catalog lacks" on the round's unchanged tree (reviewer's probe). After the round it gets the layout finding alone, corrects `layout`, and only then meets the label finding.
  - The same happens to a readable row followed by a non-reading row of the same key: the second row's "a second row of focus_clusters has the key now" is no longer given. (The reverse order, a non-reading row before a readable one, is now right: the round's unchanged tree called the drawn row "not read".)
  - Verdict: item 2 violated.

#### 2. Proof

- `tests/data/shapes/catalog-files/vocab.test.ts:61` and `:79`: "it('case 5: words a lane naming a cluster no row has and one naming none, and reads a fourth cluster'" and "it('case 6: words a cluster drawn in a layout the shape does not take and each of its lanes, and reads no cluster from it'".
  - What is wrong: the round changed both rows. Case 5 expects "no readable row"; case 6 gets a new title and expects the lane findings of `scope`, `derisk` and `build`. The round brief's check 2 asks for both runs of each changed test, but the report quotes a failing run on the round's unchanged tree only for the new row. The reviewer's run of the file on a copy of the round's unchanged tree fails both rows (`Tests  3 failed | 9 passed (12)`), so the evidence exists, though not in the report.
  - Failure scenario: a reader of the report cannot tell that the two edited assertions test the changed behaviour rather than restating it.
  - Verdict: none.
- `.scratch/migration/agents/reviews/O80-report.md:120`: "| `tests/server/edit/config-value.test.ts` (edited assertion) | passes on the base | 17 passed |".
  - What is wrong: round item 5 asks the row to say what the base run printed. The round section's "Test rows" quotes the base run failing, which the reviewer reproduces (`Tests  1 failed | 16 skipped (17)`). The round-0 table row still says "passes on the base", so the report now holds both, and nothing marks the old row as superseded.
  - The decision resting on it: the orchestrator's booking and the guarded entries' Test lines at landing are read from the round-0 table.
  - Failure scenario: a landing that copies the table books a base pass for an assertion that fails on the base.
  - Verdict: none.

#### 3. Standards

- `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o80r1/` (`ls`: `baserun`, `rewrap-out.txt`, `ticker-after.txt`, `ticker-base.txt`, `ticker-before.txt`, `unused-after.txt`, `verify.txt`, `wrap-after.txt`).
  - What is wrong: the rules file, "What every package obeys", the case-run program paragraph, says "a file it needs lives in the scratchpad or the base copy and is gone before the report". The base-run folder and the saved outputs are still there after the hand-back.
  - `baserun`'s `board-rules.test.ts` and `held-unsaved.test.ts` differ from the worktree's final files: the comment rewrap of lines 2-4 and 11-12, and the `createWrites(...)` call reformatted at 430-445.
  - Failure scenario: a later run of a row in `baserun`, or a read of `verify.txt`, takes a stale copy for the step's current file or run.
  - Verdict: none.

#### 4. Behaviour

- `src/lib/data/sources/config/sections/vocab.ts:85` (Spec 2).
  - What is wrong: the Findings view no longer lists the label, glyph or repeated-key finding of a `focus_clusters` row that does not read, and in the reverse order it drops a false "not read" finding. The round's report states the new lane findings and the "no readable row" wording, and states neither of these changes with a before and after.
  - Failure scenario: at the look on landing, a reader of the Findings view with such a row sees one finding fewer than the round-0 build gave, and has nothing in the report to read it against.
  - Verdict: item 2 violated (with Spec 2).

### Declined to judge

- `src/lib/data/sources/config/merge/hub-layer.ts:154` (`WORD_RECORDS = new Map([['focus_lanes', 'move_writes']])`) names the one record whose words a hub's removal reaches in the merge code. A mark on the options-catalog field would do the same. `VOCAB_SHAPES` in `in-place.ts` is a key table of the same kind, so whether the table belongs in code or in `config/options/` is a design choice for the orchestrator.
- Whether "no readable row of focus_clusters" in `cluster_unknown`, `HELP.md:287` and the options help is plain enough for a reader. `docs/HELP.md` does not say what makes a row readable, and judging the wording is a prose call.
- `rail-badges.svelte.ts:78` is left short so that the code span `` `rail: true` `` is not split across two lines. Whether the rewrap rule allows splitting a code span is the orchestrator's reading.
- The base-copy runs ran in a scratch folder: the four folders of `O80-base`, with the worktree's root files and `.svelte-kit` and the worktree's `node_modules` linked. They were not run on a full checkout of the base, which only another git command would give.
- Case 18 and case 12's disabled apply control are settled by the look on landing.
- The builder's transcript before the round 1 message was not re-read; round 0's runs stand on the first refutation.

Reviewer usage: a3e9023399798e534, claude-opus-5-5, 329942 tokens, 73 tool uses, 25 min 20 s.

## Closed (findings of the run over repair round 1, at landing on main)

- Spec 1 (the builder's programs `rewrap.mjs` and `wrap.awk`, the inline shell and `awk` loops, the heredoc and the redirects): closed under the ruling "Unapproved builder scripts" (`plan.md` Rulings), not raised. The breach is recorded in the booking. The orchestrator compared each hunk of the round's delta (`diff -u` of every path of `.agents/worktrees/migration-O80-round-1/files.txt` against the worktree) by its words: 52 hunks in 33 files change comment line breaks only, every word kept in order, the same count the reviewer's probe gives; each was read in the delta, and each is kept. The other 45 hunks in 21 files were made by Edit and Write and read in the delta.
- Spec 2 and Behaviour 1: fixed at landing. `clusterFindings` (`src/lib/data/sources/config/sections/vocab.ts`) runs over every row of `focus_clusters` that is a map with a key again: a row whose key an earlier readable row holds gets `cluster_repeated`, every other such row gets its `label` and `glyph` findings, and a key counts as a known cluster only for a row that reads (`readClusterRows`), so a lane of a cluster whose row does not read keeps its finding. A test row in `tests/data/shapes/catalog-files/vocab.test.ts` covers a row with `layout: grid` and `label: focus.nosuch`. The booking states the before and after.
- Proof 1: no change. The reviewer's run of `vocab.test.ts` on a copy of the round's unchanged tree fails case 5 and case 6 (`Tests  3 failed | 9 passed (12)`), the failure the report did not quote; the booking quotes it.
- Proof 2: fixed at landing. The round-0 table row of `config-value.test.ts` in `agents/reviews/O80-report.md` now says the edited assertion fails on the base, as the round's run shows.
- Standards 1: fixed at landing. The builder's scratch folder `o80r1` (the base-run copy and the saved outputs) is removed after the landing's reads.
