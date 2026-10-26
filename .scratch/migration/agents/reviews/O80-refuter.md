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
