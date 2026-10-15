Everything in the brief is done. Three things the reader needs at once: `npm run test:quick` ran three times (each passed; why under "Number of full verify-list runs"); case 6's exit of `npm run diagrams` itself is shown by reading `diagrams.mjs` beside a quoted run of the drawing code, since the tree holds no source that throws; and two files outside "Paths this step writes" changed (`src/lib/data/model/index.ts`, `src/monaco-modules.d.ts`), plus `DESIGN.md:217` outside its listed lines, each with its reason under "Files".

# Q72 report: the architecture re-read, the readable channel and write diagrams, the diff pane on git's hunks, one field look, the negative checks on a signal

## Open items of the state file (verbatim)

- None.

## The cases' first run (on the unchanged tree)

Every command ran from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. Scratch repositories live under `$TMPDIR/q72/c/`. The base copy is `.agents/worktrees/Q72-base`. The "after" run of each case is quoted beside it, so each case is read once.

**Case 1 (measures).** Command (graph.ts, the hand checks' reader):

```
node --input-type=module -e "import {importGraph,findCycles} from './tests/checks/imports/graph.ts'; const g=importGraph('src','lib/'); const E=[...g].flatMap(([a,xs])=>[...new Set(xs.map(x=>x.id).filter(id=>g.has(id)))].map(b=>[a,b])); const vs=E.filter(([a,b])=>a.startsWith('lib/views')&&b.startsWith('lib/state')); const fo=p=>{const s=p.replace(/^lib\//,'').split('/'); return s.length>2?s.slice(0,2).join('/'):s[0]}; const fg=new Map(); for(const [a,b] of E){const [x,y]=[fo(a),fo(b)]; if(x!==y){if(!fg.has(x))fg.set(x,[]); fg.get(x).push({id:y}); if(!fg.has(y))fg.set(y,[]);}} console.log('modules',g.size,'edges',E.length); console.log('module cycles',findCycles(g).length,JSON.stringify(findCycles(g))); console.log('folder rings',JSON.stringify(findCycles(fg))); console.log('views->state',vs.length,'files',new Set(vs.map(x=>x[0])).size,'targets',new Set(vs.map(x=>x[1])).size)"
```

First run (unchanged tree): `modules 1760 edges 7043` / `module cycles 0 []` / `folder rings []` / `views->state 1254 files 391 targets 187`. After: `modules 1761 edges 7044` / `module cycles 0 []` / `folder rings []` / `views->state 1254 files 391 targets 187` (the one new module is `ui/controls/editor/diff/git-provider.ts`, the one new edge `kit/load.ts -> diff/git-provider.ts`, an `import()`). Q71's own script (`agents/briefs/Q71.md:81-122`, run as written from `$TMPDIR/q72/q71-measure.py`): base `modules 1760 edges 7035`, worktree `modules 1761 edges 7035`, cycles 0, rings [], views->state 1254 / 391 / 187 on both. The comparison with Q71's numbers and the differences between the two readers are in "The re-read".

**Case 2 (no "nicer way" items).** Reading of "The re-read" below: it names no item that is only a different or nicer way; the facts it records that are not major problems are listed as such and are not findings.

**Case 3 (`arrowsAlong()` / `labelsAcross()` over every committed `.svg`).** Command:

```
node --input-type=module -e "import {readFileSync,readdirSync} from 'node:fs'; import {arrowsAlong,labelsAcross} from './utils/diagrams/labels.mjs'; const fs=readdirSync('docs/diagrams').filter(f=>f.endsWith('.svg')).sort(); for (const f of fs){const s=readFileSync('docs/diagrams/'+f,'utf8'); const w=/width=\"(\d+)pt\" height=\"(\d+)pt\"/.exec(s); console.log(f, arrowsAlong(s).length, labelsAcross(s).length, w?w[1]+'x'+w[2]:'');} console.log('drawings', fs.length)"
```

First run:

```
channels.svg 2496 0 853x3664
layer-data.svg 0 0 304x921
layer-server.svg 0 0 428x1027
layer-shell.svg 0 0 305x1481
layer-state.svg 0 0 469x1039
layer-ui.svg 0 0 316x1209
layer-views.svg 0 0 325x1910
layers.svg 0 0 826x569
writes.svg 61 0 1720x1567
drawings 9
```

After (same command, the import path `./utils/diagrams/drawing/labels.mjs`, where `labels.mjs` now lives):

```
channels.svg 0 0 1703x3440
layer-data.svg 0 0 304x921
layer-server.svg 0 0 428x1027
layer-shell.svg 0 0 305x1481
layer-state.svg 0 0 469x1039
layer-ui.svg 0 0 328x1209
layer-views.svg 0 0 325x1910
layers.svg 0 0 826x569
writes.svg 0 0 4225x1927
drawings 9
```

**Case 4 (the G25 row).** Unchanged tree: a scratch copy `$TMPDIR/q72/base-rows1` built from the base copy (its `src` checked equal to the base's), the worktree's `node_modules` linked in, and the worktree's `tests/checks/diagrams/diagrams.test.ts` copied over it. `npx vitest run tests/checks/diagrams/diagrams.test.ts -t "run no two arrows along each other" --testTimeout 0 --hookTimeout 0`:

```
     x run no two arrows along each other in any drawing the source gives 178390ms
AssertionError: expected [ <horizontal ellipsis>(2557) ] to deeply equal []
+   "channels: ? src/lib/state/client/context.ts:166->state/client/context along ? src/lib/state/system/apps/apps.svelte.ts:599->state/system/apps/apps for 61",
+   "writes: lib/data/index.ts->? src/lib/data/index.ts:224 along lib/data/index.ts->? src/lib/data/index.ts:375 for 210",
 Test Files  1 failed (1)
      Tests  1 failed | 46 skipped (47)
```

(The failure mark is `<multiplication sign>` in the output.) The 2557 lines are 2496 `channels: ...` and 61 `writes: ...` lines (`grep -c` over the saved output `$TMPDIR/q72/orth/g25-base.txt`). After, in the worktree: `npx vitest run tests/checks/diagrams tests/checks/source/comment-width.test.ts tests/checks/imports tests/checks/tree tests/checks/source/history.test.ts --testTimeout 0 --hookTimeout 0` -> `Test Files  10 passed (10)` / `Tests  121 passed (121)`, the G25 row among them.

**Case 5 (`npm run diagrams` twice).** First run on the unchanged tree: run twice, `diff -rq` of the two outputs printed nothing. After: `npm run diagrams` run 1 `exit 0`, its output copied to `$TMPDIR/q72/final-c`, run 2 `exit 0`, `diff -rq $TMPDIR/q72/final-c docs/diagrams` printed nothing (`diff exit 0`). `npm run docs:palette` `exit 0`, `cmp docs/palette.md <base>/docs/palette.md` -> `palette page same as base`.

**Case 6 (a pair throws, never commits).** First run (unchanged tree, reading): `writesDrawn()` stops and leaves the pair "for the check to name" (`writes.mjs:546-548` on the base), and `npm run diagrams` exits 0 on the base while committing `writes.svg` with 61 pairs and `channels.svg` with 2496 (case 3's first run). After: a source of my own, `$TMPDIR/q72/orth/case6-source.dot`, a two-column graph of 128 arrows `l*` to `r*` (seeded search, 16 nodes a side, 8 arrows a node, seed 20098) that holds four arrows `"l1" -> "r1"` and four `"l10" -> "r13"`. At the positions Graphviz gives the nodes, the four `l1 -> r1` arrows start below and end above the four `l10 -> r13` arrows, so whatever route each takes between the two columns, each of the 16 pairs crosses; each crossing measures about 3 points of shared length, and `arrowsAlong()` counts the arrows of one title as one line, so the pair is over its threshold of 40 whatever the rule does short of moving nodes up or down, which it does not (the positions are Graphviz's). Run through the drawing code as `diagrams.mjs` calls it:

```
SOURCE=$TMPDIR/q72/orth/case6-source.dot node --input-type=module -e "import { instance } from '@viz-js/viz'; import { readFileSync } from 'node:fs'; import { drawnApart } from './utils/diagrams/drawing/apart.mjs'; const viz = await instance(); const draw = (dot) => viz.renderString(dot, { format: 'svg' }).replace(/^[\s\S]*?(?=<svg)/, ''); const layout = (dot) => viz.renderJSON(dot); const dot = readFileSync(process.env.SOURCE, 'utf8'); const drawn = drawnApart('crowded', dot, { draw, layout }); console.log('drawn', drawn.svg.length);"
Error: crowded: the arrows cannot be drawn apart
l1->r1 along l10->r13 for 48
    at drawnApart (file:///.../utils/diagrams/drawing/apart.mjs:682:19)
exit status 1
```

`npm run diagrams` on such a source exits non-zero by the same path, read in `utils/diagrams/diagrams.mjs`: `generate()` calls `drawnApart('channels', ...)` and `writesDrawn()` (`:159-160`) before it returns any drawing; `main()` writes only inside `for (const one of await generate(engine))` (`:198-200`); `await main()` at the top of the module (`:206`) turns the throw into a rejected top-level await, and Node exits 1 with the error printed, as the quoted run did. The tree's own source gives no drawing that throws, so the exit of `npm run diagrams` itself is shown by this reading and not by a run.

**Case 7 (no joining node).** `grep` of nodes whose title holds " to " in each DOT. First run: `channels.dot` 0; `writes.dot` 13 (`$TMPDIR/q72/to-nodes-before.txt`):

```
"lib/server/core/changes.ts to file on disk (calls)"
"lib/server/core/json.ts to file on disk (calls)"
"lib/server/edit/feeds/feeds.ts to file on disk (calls)"
"lib/server/edit/writes.ts to lib/server/core/auth.ts (refuses)"
"lib/server/edit/writes.ts to lib/server/edit/feeds/feed-route.ts (refuses)"
"lib/server/edit/writes/apps/store.ts to file on disk (calls)"
"lib/server/edit/writes/config/config-checks.ts to file on disk (calls)"
"lib/server/edit/writes/config/lists/deck/deck-files.ts to file on disk (calls)"
"lib/server/edit/writes/config/lists/deck/deck-new.ts to file on disk (calls)"
"lib/server/edit/writes/config/lists/deck/deck-undo.ts to file on disk (calls)"
"lib/server/edit/writes/file-undo.ts to file on disk (calls)"
"lib/server/edit/writes/manifest.ts to file on disk (calls)"
"lib/server/files/fs/history.ts to file on disk (calls)"
```

After: `grep -c ' to ' docs/diagrams/channels.dot` -> `0`; `writes.dot` holds the same 13 nodes with the same `label`, `shape=box`, `color="transparent"`, `fontsize=8`, `width=0`, `height=0`, `margin="0.04,0.02"` as on main, each with a `pos` added because the committed DOT is the positioned file (`$TMPDIR/q72/to-nodes-after.txt`, e.g. `"lib/server/core/json.ts to file on disk (calls)" [label="mkdirSync", shape=box, color="transparent", fontsize=8, width=0, height=0, margin="0.04,0.02", pos="3673.07,306.61!"];`). No other node was added.

**Case 8 (trace).** First run, reading the base drawings: of the channels with the most readers, `ch portfolio` had 63 pairs among the 370 that touch its arrows, `ch config` 65 of 476, `ch git` 10 of 222; of the writes with the most arrows, `lib/server/edit/writes/undo.ts` (23 arrows), `lib/server/core/json.ts` (19) and `lib/server/edit/writes.ts` (18) had 43, 12 and 1 pairs touching their arrows. After: readers per channel in `channels.dot` (`grep -o '"ch [^"]*" -> ' | uniq -c`): `21 ch portfolio`, `19 ch config`, `8 ch git`. A trace script reads each arrow's start point and arrowhead tip off `channels.svg` and `writes.svg`, finds the node box each touches, and sets them beside the arrow's two ends as the source names them; for the three channels (all their arrows, in and out) and the three writes every arrow reads `same`, quoted in full under "The drawings". `grep -c DIFFERS` over both outputs: `0` and `0`. The trace over twelve channels also reads `same` for every arrow (`22 of 22`, `20 of 20`, `10 of 10`, `9 of 9`, `9 of 9`, `6 of 6` three times, `5 of 5`, `4 of 4` three times). The look at landing is listed under "The looks".

**Case 9 (`channels.ts`, 9e250b73d).** Texts read with `git show 9e250b73d^:tools/oculus/src/desktop/decide/channels.ts` and `git show 9e250b73d:...` into a scratch repository `$TMPDIR/q72/c/channels`; git's head `@@ -13,0 +14,12 @@ export const SHOW_FIND = 'oculus:show-find';`. First run, `fileSides` and Monaco's computation (`tests/ui/controls/editor/monaco-diff.ts`): `channels changes: undefined | monaco: 12,0,13,24`. After: `case 9 channels f.ts->f.ts binary false equal false changes [13,0,14,25] actions lines`.

**Case 10 (`rail.ts`, 0107e4e74).** Same way; git's head `@@ -24,9 +23,0 @@ export type { RailEntry, RailProblem, RailRead };`. First run: `rail changes: undefined | monaco: 23,31,22,0`. After: `case 10 rail f.ts->f.ts binary false equal false changes [24,32,23,0] actions lines`.

**Case 11 (heads).** First run: `parseLineMarks('@@ -4 +4 @@\n@@ -0,0 +1,3 @@\n@@ -1,3 +0,0 @@')` -> `[{"kind":"modified","line":4,"count":1},{"kind":"added","line":1,"count":3},{"kind":"deleted","line":1,"count":0}]` (no change in the `LineChange` shape is read on main). After, `gitLineChanges` over each head with its texts: `case 11 [4,4,4,4] [0,0,1,3] [1,3,0,0]`.

**Case 12 (the G33 row).** The pair the test holds: `const A = 1;`, a blank line, `const B = 2;`, eight lines `four` to `eleven`, `const Z = 9;`; the new text adds `const C = 3;` and a blank line after the blank line and changes the last line to `const Z = 10;`. Git's heads, from `git diff -U0` on a scratch repository: `@@ -2,0 +3,2 @@ const A = 1;` and `@@ -12 +14 @@ eleven`. Monaco's, from `DefaultLinesDiffComputer` (`monacoLineChanges`): `1,0,2,3 12,12,14,14`, which adds a blank line and `const C = 3;` after line 1. Unchanged tree (the scratch copy of case 4 with the row's file copied in), `npx vitest run tests/server/git/git-ops.test.ts`:

```
 x reads a file's changes as git's hunks, and stages one block as exactly git's hunk 677ms
AssertionError: expected undefined to deeply equal [ { <horizontal ellipsis>(4) }, { <horizontal ellipsis>(4) } ]
 at tests/server/git/git-ops.test.ts:249:30
      Tests  1 failed | 16 skipped (17)
```

After: `npx vitest run tests/server/git/git-ops.test.ts` -> `Test Files  1 passed (1)` / `Tests  17 passed (17)`.

**Cases 13 to 20 (the server readers).** One command per run imports `fileSides`, `worktreeSides` (`git-reads.ts`), `commitDiff`, `stashDiff` (`reads.ts`), `compareSides` (`compare.ts`), `gitLineChanges` (`parse.ts`), `diffActions` (`diff-hunks.ts`) and `sameFiles` (`repositories.ts`), over the scratch repositories `c13` (commits `one`, `two` = a0540cf, `three` = fce2155), `c14`, `c15`, `c16` (merge b79a10c), `c17`, `c20` (commits 514ec00, 518908d, a stash, a worktree), `c20bin`. First run (unchanged tree):

```
c13 commit two kept.txt keep.txt -> kept.txt binary false changes undefined equal true
c13 commit two mode.txt mode.txt -> mode.txt binary false changes undefined equal true
c13 commit two empty.txt empty.txt -> empty.txt binary false changes undefined equal true
c13 commit three moved.txt move.txt -> moved.txt binary false changes undefined equal false
c14 unstaged f.txt -> f.txt binary false changes undefined equal false
c15 crlf crlf.txt -> crlf.txt binary false changes undefined equal false
c15 conflicted (conflicted=true) k.txt -> k.txt binary false changes undefined equal false
c16 merge commit m.txt -> m.txt binary false changes undefined equal false
c17 textconv t.txt -> t.txt binary false changes undefined equal false
c20 staged s.txt -> s.txt binary false changes undefined equal false
c20 unstaged u.txt -> u.txt binary false changes undefined equal false
c20 commit s.txt -> s.txt binary false changes undefined equal false
c20 stash u.txt -> u.txt binary false changes undefined equal false
c20 compare u.txt -> u.txt binary false changes undefined equal false
c20 worktree three-dot s.txt -> s.txt binary false changes undefined equal false
```

Case 17 first run: `heads body: ["@@ -2 +2 @@ ALPHA","-BETA","+BETA CHANGED"]` / `modified side: "alpha\nbeta changed\ngamma\n"` (the head names the textconv driver's upper-cased text, the side is the stored text). Case 18 first run: `head body ["@@ -2 +2 @@ a","-b","+B"] | modified "x\ny\na\nB\nc\nd\n" | changes undefined`. Case 19 first run (with `globalThis.$state=(v)=>v` standing in for the rune at module load): `sameFiles over equal texts, changes [1,1,1,1] and []: true`.

After (final code, the same scratch repositories, `$TMPDIR/q72/after-cases-out.txt`):

```
case 13 kept.txt keep.txt->kept.txt binary false equal true changes [] actions lines
case 13 mode.txt mode.txt->mode.txt binary false equal true changes [] actions lines
case 13 empty.txt empty.txt->empty.txt binary false equal true changes [] actions whole
case 13 moved.txt move.txt->moved.txt binary false equal false changes [4,4,4,4] actions lines
case 14 no final newline f.txt->f.txt binary false equal false changes [3,3,3,3] actions lines
case 15 crlf crlf.txt->crlf.txt binary false equal false changes [2,2,2,2] actions none
case 15 conflicted=true k.txt->k.txt binary false equal false changes [0,0,1,1 1,0,3,5] actions none
case 16 merge m.txt->m.txt binary false equal false changes [10,10,10,10] actions lines
case 17 textconv t.txt->t.txt binary false equal false changes [2,2,2,2] actions lines
case 18 check of heads against a rewritten text null
case 19 sameFiles over equal texts, changes [1,1,1,1] and []: false
case 20 staged s.txt->s.txt binary false equal false changes [4,4,4,4] actions lines
case 20 unstaged u.txt->u.txt binary false equal false changes [2,2,2,2] actions lines
case 20 commit s.txt->s.txt binary false equal false changes [2,2,2,2] actions lines
case 20 stash u.txt->u.txt binary false equal false changes [3,0,4,4] actions lines
case 20 compare s.txt->s.txt binary false equal false changes [2,2,2,2] actions lines
case 20 worktree s.txt->s.txt binary false equal false changes [2,2,2,2 5,0,6,6] actions lines
case 20 binary b.bin->b.bin binary true equal true changes undefined actions lines
case 20 submodule sub->sub binary false equal false changes undefined actions lines
```

Case 13: the empty lists give `hunksOf([])` no block, and the texts are equal, so no block shows. Case 14, through `sidesPatch` over git's changes and `applyHunk` on a scratch repository: `blocks 1`, the patch ends `-three` / `\ No newline at end of file` / `+THREE` / `\ No newline at end of file`, `stage ok true`, `index hunk equals the worktree hunk git gave: true`, the index hunk `@@ -3 +3 @@ two` / `-three` / `\ No newline at end of file` / `+THREE` / `\ No newline at end of file`. Case 16 against git: `git show --first-parent --format= -U0 HEAD` in `c16` gives `@@ -10 +10 @@ ONE` / `-10` / `+TEN`. Case 17 after: `c17 body ["@@ -2 +2 @@ alpha","-beta","+beta changed"]`, the head of the stored text. Case 20's readers that run no git diff, by reading: `diff-read.ts` `diskSide` (the save conflict), `sourceSide` (an app's quick diff) and `refactorSide` (the Refactor Preview) build `DiffSides` with no `changes` and each says so in its doc comment; `ops.ts` at the comparison of two files and the Replace Preview, and `compare.ts` `workspaceSides`, build theirs without `sidesOf` and say so in a comment; `sidesOf` (`reads.ts`) is the only place that sets `changes`, called by `compareSides`, `commitDiff`, `stashDiff`, `fileSides` and `worktreeSides`. A file without `changes` is drawn with Monaco's own diff, as on main (case 21).

**Case 21 (the pane draws git's changes).** First run: `monaco [{"originalStartLineNumber":12,"originalEndLineNumber":0,"modifiedStartLineNumber":13,"modifiedEndLineNumber":24}]` / `line 13 chooses {"removed":[],"added":[13]} | line 25 chooses {"removed":[],"added":[]}` / `provider files in ui/controls/editor/diff: DiffEditor.svelte comment-add.css read.ts`. After, through the service Monaco's diff editor reads (`createGitDiffs`, with model stand-ins holding the two texts of `channels.ts` read by `fileSides`, and a stand-in for Monaco's own provider):

```
held git changes: provider answers 13,0,14,25 | modified lines marked added 14..25
selection on 13 chooses {"removed":[],"added":[]} | on 25 chooses {"removed":[],"added":[25]}
no git changes held: provider answers monaco own | Monaco own computation 12,0,13,24
```

The tree's tests cannot make a Monaco diff editor (no DOM editor in Vitest), so `getLineChanges()` of a live editor and the drawn green lines are the look at landing.

**Case 22 (Previous and Next Change, Open File into hidden regions).** First run and after: the look at landing (see "The looks"). By reading: `hunk-acts.svelte.ts` and `Diff.svelte` step by the hunks of `drawnChanges`, the changes the editor answered, which for a file with git's changes are git's (case 21).

**Case 23 (eight fields' look).** First and after: the look at landing. By reading: each rule a field shared on main moved into `src/lib/ui/theme/field.css`; each declaration a field set differently stays in the field (case 24).

**Case 24 (each declaration once).** First run, `grep -c` per declaration over the eight fields: `border: 1px solid var(--line)` 8, `border-radius: var(--input-radius)` 8, `background: var(--chip)` 9, `color: var(--ink-txt, var(--ink))` 8, `font: inherit` 8, `font-size: var(--fs-md)` 8, `line-height: calc(...)` 8, `padding: 4px 6px` 9, `outline: 1px solid var(--accent)` 8, `outline-offset: -1px` 8, rice `border: 0` 9, `border-bottom` 7, `border-radius: 0` 8, `background: none` 10, `font-family: var(--font-mono)` 9; `grep -c oculus-field` 0 in each. After, over `field.css` and the eight: every field-look declaration appears once, in `field.css`; the repeats are other rules of one field each: `background: var(--chip)` 2 (`SuggestInput.svelte` `.item[data-highlighted]`), `padding: 4px 6px` 2 (`SuggestInput.svelte` `.note`), `border: 0` 2 (`TextArea.svelte` `.area.bare`), `background: none` 3 (`TextInput.svelte` `.text[readonly]`, `TextArea.svelte` `.area.bare`), `font-family: var(--font-mono)` 2 (`TextArea.svelte` `.area.code`); `cursor: not-allowed` 1. Import / class `grep -c` per field: `Select` 1/1, `FieldSelect` 2/1 (its comment names the sheet), `MultiSelect` 1/1, `SuggestInput` 1/1, `TextInput` 1/1, `TextArea` 1/1, `DateInput` 1/2 (two inputs), `Search` 1/1.

**Case 25 (three negative checks).** First run: `npx vitest run tests/state/client/terminal/terminal-close.test.ts tests/state/system/link-rewrite.test.ts` -> 2 files, 6 tests passed, each check after `setTimeout(resolve, 0)`. After: `Test Files  2 passed (2)` / `Tests  6 passed (6)`. The reading of each check against the code it guards is under "Changed assertions".

## DONE / NOT DONE

| Item | State | Proof (last line of its run) |
| --- | --- | --- |
| Part 1, the re-read | DONE | "The re-read" below; case 1 after: `views->state 1254 files 391 targets 187` |
| Part 2, channels and writes with no pair | DONE | case 3 after: `channels.svg 0 0 1703x3440`, `writes.svg 0 0 4225x1927`, `drawings 9` |
| Part 2, throw on a pair | DONE | case 6: `Error: crowded: the arrows cannot be drawn apart` / `l1->r1 along l10->r13 for 48`, `exit status 1` |
| Part 2, G25 row | DONE | `Tests  121 passed (121)` (tree checks, row among them) |
| Part 2, DESIGN paragraphs | DONE | `DESIGN.md:129` (channels, after Watchers), `:161` (writes) |
| Part 3, git's changes on `DiffSides` | DONE | cases 9-20 after, above |
| Part 3, the pane draws them | DONE | case 21 after: `held git changes: provider answers 13,0,14,25` |
| Part 3, G33 row | DONE | `Tests  17 passed (17)` |
| Part 4, one field look | DONE | case 24 after; `src/lib/ui/theme/field.css` |
| Part 4, `choice/drawn` to `choice/select` | DONE | rename grep below, empty |
| Part 5, three checks on a barrier | DONE | `Tests  6 passed (6)` |
| `npm run lint` | DONE | exit 0 |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run check` | DONE | `COMPLETED 4052 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Tree checks by file | DONE | `Test Files  10 passed (10)` / `Tests  121 passed (121)` |
| Other `tests/checks` files the step touches | DONE | `config/integrity.test.ts`, `source/keys.test.ts`, `source/html-sites.test.ts`, `look/contrast.test.ts`: `Tests  76 passed (76)`; `source/history.test.ts` is in the tree-checks run above |
| `tests/server/git/git-ops.test.ts` alone | DONE | `Tests  17 passed (17)` |
| The negative-check files | DONE | `Tests  6 passed (6)` |
| `npm run test:quick` | DONE | `test:quick: 68.4 s (limit 45.0 s); every command passed` |
| `sh utils/folder-check.sh` | DONE | prints nothing, `folder-check exit 0` |
| `sh utils/size-check.sh` | DONE | prints nothing, `size-check exit 0` |
| `sh utils/unused-exports.sh` | DONE | one added line, explained below |
| `npm run diagrams` twice, `docs:palette` | DONE | `diff exit 0`, `palette page same as base` |
| ASCII gate | DONE | prints nothing, `exit 0` (command below) |

The ASCII gate, over every file the step changes and this report:

```
printf '%s\0' <the files of the table under "Files"> tools/oculus/.scratch/migration/agents/reviews/Q72-report.md | xargs -0 env LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof'; echo "exit $?"
```

Output: nothing, then `exit 0` (the run is quoted at the end of this report, since it reads this file).

`test:quick` reports `over the time limit` on each run (81.8 s, 76.8 s, 68.4 s against 45.0 s), with 53 changed files selected and 176 test files run. Its own line says what it does not cover: `tests outside the selection, tests/checks, slow tests, build, lint of unchanged files; npm run test:landing runs them`; the checks and the slow file were run by file above. Without `--testTimeout 0 --hookTimeout 0`, four generation rows of `tests/checks/diagrams` and `comment-width.test.ts` time out at Vitest's 5000 ms (8026 ms for comment-width); `npm run test:checks` itself passes both flags, so the tier runs as the tree defines it.

The unused-exports line: `diff <base>/unused-exports.txt` against this run prints `< Unused exports (240)` / `> Unused exports (241)` and the one added line `> src/lib/ui/controls/editor/diff/git-provider.ts: createGitDiffs`. It is used: `kit/load.ts:248` loads the module with `import('../diff/git-provider')` and calls `git.createGitDiffs(...)`, an `import()` knip does not follow; the base list holds `src/lib/ui/controls/editor/kit/workers.ts: workerFor` (line 218) for the same reason. Nothing was changed for it.

## Number of full verify-list runs

The brief's verify list ran once in full. `npm run test:quick` ran three times, each `every command passed`: the first after the code was complete; the second after a comment-only edit to `drawing/apart.mjs` and the sentence split in `DESIGN.md` described under "Every judgment call"; the third after the publish rule of `graphs.mjs` (a publish is a call on the channel hub), which regenerated `channels.dot`/`.svg`. No run was a rerun after a red line. Whole-suite or tier commands run: `npm run test:quick` three times; `npm run test:checks`, `npm test`, `npm run test:slow` and `npm run test:landing` were not run. `npm run lint`, `format:check` and `check` ran again after the last change (results in the table).

## The re-read

### The measures

| Measure | Command | Now (worktree) | Q71 (`Q71-report.md:447`) |
| --- | --- | --- | --- |
| Modules, edges (graph.ts) | case 1's command | `modules 1761 edges 7044` | not measured by graph.ts |
| Modules, edges (Q71's script) | `python3 $TMPDIR/q72/q71-measure.py` | `modules 1761 edges 7035` | `modules 563 edges 2098` |
| Module cycles | case 1's command | `module cycles 0 []` | `module cycles 0 []` |
| Folder rings | case 1's command | `folder rings []` | `folder rings []` |
| Views into state: edges, files, targets | case 1's command | `views->state 1254 files 391 targets 187` | `views->state 477 files 155 targets 65` |
| Size check | `sh utils/size-check.sh` | exit 0 | `sh bin/size-check.sh`: exit 0 |
| Folder check | `sh utils/folder-check.sh` | exit 0 | `sh bin/folder-check.sh`: exit 0 |
| Hand checks (imports, tree) | `npx vitest run tests/checks/imports tests/checks/tree` on the base copy | 6 files, 68 tests passed | imports 11 passed, order 9 cases |
| svelte-check files | `npm run check` | `COMPLETED 4052 FILES` | 1387 files |

The like-with-like comparison is Q71's script against Q71's script: the tree measured 563 modules and 2098 edges at Q71 and measures 1761 and 7035 now, with views-into-state edges 477 to 1254, the files that make them 155 to 391 and their targets 65 to 187. The script is the same text (extracted from `agents/briefs/Q71.md:81-122`); why the tree is three times the size is not verified here, since reading the hub's history is outside what this step may run.

How graph.ts reads differently from Q71's script, on the worktree (7044 against 7035, a difference of 9 = 16 - 7):

- graph.ts counts 13 edges made only by `import()`, which the regex of Q71's script skips: `desktop/main.ts -> desktop/app.ts`, `desktop/main.ts -> lib/data/sources/config.ts`, `lib/server/root/process/start/first-run.ts -> port.ts`, `-> lib/server/files/workspace/open.ts`, `-> lib/server/files/workspace/state.ts`, `-> lib/server/root/process/words.ts`, `lib/ui/controls/editor/kit/load.ts -> kit/workers.ts`, `-> diff/git-provider.ts`, and `server.ts -> lib/server/content/memories.ts`, `-> lib/server/root/context.ts`, `-> lib/server/root/process/start/port.ts`, `-> lib/server/root/process/serve.ts`, `-> lib/server/root/process/words.ts` (12 on the base; the 13th is the new `load.ts -> git-provider.ts`).
- graph.ts counts 3 static imports the regex misses because an apostrophe in a comment above them derails it: `markdown.ts -> languages.ts`, `leads.ts -> dates.ts`, `stores/desktop.ts -> file-ops.ts`.
- The regex counts 7 edges graph.ts does not: an `import type` line matched from the word "import" inside a comment, each to `lib/data/model/index.ts`, from `catalog-words.ts`, `career.ts`, `focus.ts`, `selectors.svelte.ts`, `terminals.svelte.ts`, `transcript.svelte.ts` and `datasets.ts`. graph.ts counts runtime imports only, so a type import is no edge.

The modules count agrees (1761 both). The cycles, rings and views-into-state numbers agree between the two readers.

Other measures:

- Lines per layer, `.ts` and `.svelte` under `src/lib/<layer>`: data 163 files / 29328 lines, server 442 / 94310, state 354 / 71958, ui 159 / 24656, shell 91 / 13912, views 448 / 74784; all of `src` 315871 lines.
- Largest files (`wc -l | sort -rn`): `state/client/writes.svelte.ts` 889, `server/machine/lsp/held/held.ts` 880, `state/sessions/terminals.svelte.ts` 879, `server/root/watch/git.ts` 878, `server/git/deposit/deposit.ts` 877, `state/system/apps/apps.svelte.ts` 876, `views/sources/file/pdf/viewer.svelte.ts` 874, `state/sessions/terminal/commands.svelte.ts` 874, `data/sources/config/settings.ts` 872, `state/client/context.ts` 871, `server/root/context.ts` 870, `state/workbench/layout.svelte.ts` 861, `server/edit/yaml/yaml-edit.ts` 861. Components over 520: `shell/keys/Palette.svelte` 530, `views/sessions/terminal/Terminal.svelte` 523, `views/boards/deposit/Deposit.svelte` 521. The size check refuses at 900 and 540 (`tests/checks/tree/size.test.ts:29-30`), so all pass it; `writes.svelte.ts` (889 on the base too) is over the spec's 880.
- Folders: 439 under `src`, 95 of them at 10 items (`ls | wc -l`).
- The overview drawing's import counts (`layers.dot`): views to state 1254, views to ui 958, server to data 460, state to data 413, shell to state 173, routes to server 110, shell to ui 107, routes to state 31, routes to data 29, views to data 19, ui to state 13, src to server 12, routes to ui 12, ui to data 11, shell to data 10, desktop to server 10, ui to themes 9, routes to views 5, routes to themes 5, routes to shell 5, desktop to data 5, src to data 3, src to routes 1. Q71's overview drawing counted views to state 471, views to ui 470, server to data 98, shell to state 68, state to data 53, routes to server 45, shell to ui 39, ui to state 8.

### Each drawing read

- `layers.svg`: every arrow runs down the declared order; no ring. `ui to state` 13 are the text catalog `t()` (`state/shared/words/text`, 11) and `state/shared/words/appearance` (2), both in the `ui` row of `ALLOWED` in `tests/checks/tree/boundaries.test.ts`. The one dashed arrow is an import the reader cannot place: `src/lib/server/machine/apps/serve/oculus.js:356 import(new URL('penpal.js', import.meta.url).href)`, a script served to apps, drawn in the dashed "not placed" node.
- `layer-state.svg`: `state/client` heads the layer as its composition root (`state/client/context.ts`); every other folder imports down the order; no ring.
- `layer-server.svg`: `server/root` heads it; `server/machine` to `server/core` 101 and `server/edit` to data 104, machine to data 168: wide, but each down the order.
- `layer-views.svg`: each views group reaches `views/shared`, state and ui; `views/sources` to state 359 and `views/shared` 312 are the largest; the only arrows between two folders of the layer are the nine from each group to `views/shared` (`grep -oE '"folder views/[a-z]+ to folder views/[a-z]+"' layer-views.dot | sort -u`).
- `layer-data.svg`, `layer-ui.svg`, `layer-shell.svg`: down the order, no ring. `layer-ui.svg` holds the new `ui/forms to ui/theme` arrow (7, the field stylesheet) and `ui/controls to ui/theme` 2 (it was 1).
- `channels.svg`, `writes.svg`: read under "The drawings".

The views reach the stores through `state/client/use.ts` (190 view files import it) and words through `t()` (`state/shared/words/text`, 328 view files); 143 imports reach 36 `.svelte.ts` state modules, none of which declares a module-level `let` or `$state` (a `grep -nE '^(let |export let |(export )?const [A-Za-z_]+ = \$state)'` over the 36 printed nothing). The head comments of the largest modules (`writes.svelte.ts`, `state/client/context.ts`, `server/root/context.ts`, `apps.svelte.ts`, `terminals.svelte.ts`) each name one job: the write endpoint, the client's wiring, the server's wiring, the apps store, the terminals store. `routes/+page.svelte` reads channels through the client's entities and its head comment calls it the page root's wiring.

### Verdict

- data: good enough to maintain and to open-source. Pure modules, imported by every layer above, importing nothing above.
- server: good enough. A composition root (`server/root`) over watchers, machine services and edit routes; imports run down; the head comments of its four largest files each name one service (`held.ts` one language server as a page holds it, `watch/git.ts` the `git` channel, `deposit.ts` the deposit of one project, `root/context.ts` the server's wiring).
- state: good enough. Stores built per client in `state/client/context.ts`, reached through `use.ts`, no module-level mutable state among the modules views import.
- ui: good enough. Primitives importing only themes, data helpers and the text catalog.
- shell: good enough. It reads only the state modules its row of `ALLOWED` names (the client context, `use.ts`, the layout, drag, the palette and a few more) and draws ui primitives.
- views: good enough. Each view group reads state through `use.ts` and draws ui; no view reaches another group's internals.
- The whole: good enough to maintain and to open-source. No module cycle, no folder ring, every layer's folders in a declared order that the hand checks hold.

Major architectural problems found: none. What was read to reach that: the nine drawings above, case 1's numbers, the boundaries rows of the ui and shell layers, the head comments of the largest files, the importers of `.svelte.ts` state modules. Facts recorded that are not major problems, and not findings: 13 files lie between 861 and 889 lines against the spec's 880 (`writes.svelte.ts` is over it at 889, on the base as well); 95 of 439 folders are at the 10-item cap, so the next file in any of them needs a sub-folder; 3 components are over 520 lines.

## The drawings

### The construction

The rule is `utils/diagrams/drawing/apart.mjs` (`drawnApart()`), with `drawing/tracks.mjs` (`trackOrder()`, `jogsOf()`), both new, and `drawing/labels.mjs` (moved from `utils/diagrams/labels.mjs`, measure and thresholds unchanged: its diff against the base is the head comment's one sentence about apart.mjs and its import path `../source.mjs`). Graphviz lays the nodes out; the rule then draws every arrow itself, in level and upright runs:

- Each arrow leaves its tail by a port of its own on the tail's east side and reaches its head at a port of its own on the west side. The nodes are drawn as HTML tables with one port cell per arrow (a channel as a box with round corners, which replaces the ellipse; the disk stays a cylinder). The ports of a side are ordered as their arrows run on, the highest at the top. A node of words of the writes drawing has one arrow in and one out, which meet it level at its middle height.
- Each rank is a band of nodes. An arrow that passes a rank between its ends has a point of its own there, laid out by Graphviz clear of the rank's nodes, and crosses the band level at that height (`newrank` keeps the ranks over the whole drawing).
- Between two bands each arrow runs level to an upright track of its own, along it, and level on. No two arrows share a track; tracks lie `TRACK` = 6 points apart, `PAD` = 16 points from a band; a track that would cross a group's label passes right of it; each space is as wide as its tracks need. `trackOrder()` orders the tracks so an arrow leaving a band lies left of one arriving at that height where it can, and moves the arrows of one line of `arrowsAlong()` as a block to where the squares of their crossings with each other line add up least (a step aside costs `STEP` = 4). Where a ring of such pairs leaves two level runs within `LEVEL` = 3 points, `jogsOf()` steps the one that leaves aside, halfway before the first such track, to the nearest height more than 3 points off its own that has the fewest other level runs within `CLOSE` = 2 points, tried half a point at a time up to `REACH` = 48 points each side.
- An arrow back to an earlier rank runs up to a lane of its own above the drawing (none in either drawing now).
- The nodes move only sideways; the committed `.dot` is the positioned file Graphviz's `nop2` renders as is. The ports are reordered from each drawing and the drawing made again while it is not clear, up to `ROUNDS` = 8; then `drawnApart()` throws an error naming every pair and label left, and `npm run diagrams` writes nothing (case 6).

The channel reading (`graphs.mjs`) was made exact where it misplaced arrows: a channel is read through a string constant the module declares, a call of a function that builds a channel's name (`callableNamers()`), and a literal listen or subscribe; `message(` is the channel store's accessor only on `entities` or bare and unimported; a comparison of `channel` with `undefined` or `null` is no read; a template's parts read as `*`; a publish is a call of `publish` on the channel hub (`hub`, `.hub`, `#hub`, `hub?.`), so `schemas.publish(set, references)` in `server/root/context.ts:399`, which is another object's method, names no channel. Arrows in `channels.dot`: 198 on the base, 147 now; nodes "not placed": 103 on the base, 8 now, each a call whose channel is a parameter or a field: `server/files/fs/open-files.ts:150`, `server/machine/apps/host/published.ts:22`, `state/client/context.ts:166`, `state/client/entities.svelte.ts:56`, `state/client/queries/queries.svelte.ts:82`, `state/sources/search/file-matcher.svelte.ts:83`, `state/system/apps/apps.svelte.ts:599`, `ui/controls/editor/kit/lsp/transport.ts:152`.

No split: both drawings reach none as one drawing (case 3).

### Sizes and measures, before and after

| Measure | channels before | channels after | writes before | writes after |
| --- | --- | --- | --- | --- |
| Size (pt) | 853 x 3664 | 1703 x 3440 | 1720 x 1567 | 4225 x 1927 |
| `arrowsAlong()` pairs | 2496 | 0 | 61 | 0 |
| `labelsAcross()` | 0 | 0 | 0 | 0 |
| Arrows | 198 | 147 | 161 | 161 |
| Arrows across a group label (Graphviz's label boxes) | not measured | 0 | not measured | 0 |
| Arrows through a node | not measured | 0 | not measured | 0 |
| Most crossings of one pair of lines | not measured | 4 | not measured | 2 |
| Arrows with a step aside | - | 10 | - | 3 |
| Arrows by a lane | - | 0 | - | 0 |

The after column comes from `bash $TMPDIR/q72/orth/measure2.sh docs/diagrams/channels.dot docs/diagrams/writes.dot` (`channels.dot arrows 147 group labels 11 nodes 108 | across group labels 0 | through nodes 0`, `writes.dot arrows 161 group labels 21 nodes 80 | across group labels 0 | through nodes 0`) and two measure scripts over the committed files (`channels.svg lines 137 most crossings of one pair 4 ch sessions->state/client/selectors x ch sessions->routes/+page`, `writes.svg lines 141 most crossings of one pair 2`; `channels.dot arrows 147 ranks 3 arrows with a step aside 10 arrows by a lane 0`, `writes.dot arrows 161 ranks 11 arrows with a step aside 3 arrows by a lane 0`). A cruder measure that guesses a label's width from its characters counts 7 arrows across group labels in `writes.svg`; read against Graphviz's own label box they are clear (the arrow `writes.ts -> writes/apps/gate.ts` runs upright at x 259.88 and the label `lib/server/edit/writes/apps` spans x 281.2 to 405.8).

### Case 8's trace, as printed (after)

The three channels with the most readers, every arrow in and out (`$TMPDIR/q72/orth/tc12-final.txt`):

```
ch portfolio: 22 arrows
  same | drawn server/root/watch/portfolio -> ch portfolio | source server/root/watch/portfolio -> ch portfolio
  same | drawn ch portfolio -> state/client/context | source ch portfolio -> state/client/context
  same | drawn ch portfolio -> state/client/selectors | source ch portfolio -> state/client/selectors
  same | drawn ch portfolio -> state/life/present | source ch portfolio -> state/life/present
  same | drawn ch portfolio -> state/workbench/navigation/notice-sources | source ch portfolio -> state/workbench/navigation/notice-sources
  same | drawn ch portfolio -> state/workbench/palette-source | source ch portfolio -> state/workbench/palette-source
  same | drawn ch portfolio -> state/workbench/rail-badges/rail-badges | source ch portfolio -> state/workbench/rail-badges/rail-badges
  same | drawn ch portfolio -> views/boards/entry | source ch portfolio -> views/boards/entry
  same | drawn ch portfolio -> views/boards/focus | source ch portfolio -> views/boards/focus
  same | drawn ch portfolio -> views/boards/person | source ch portfolio -> views/boards/person
  same | drawn ch portfolio -> views/feeds/literature | source ch portfolio -> views/feeds/literature
  same | drawn ch portfolio -> views/feeds/radar | source ch portfolio -> views/feeds/radar
  same | drawn ch portfolio -> views/shared/card | source ch portfolio -> views/shared/card
  same | drawn ch portfolio -> views/shared/forms | source ch portfolio -> views/shared/forms
  same | drawn ch portfolio -> views/structure/domains | source ch portfolio -> views/structure/domains
  same | drawn ch portfolio -> views/structure/map | source ch portfolio -> views/structure/map
  same | drawn ch portfolio -> views/structure/pillars | source ch portfolio -> views/structure/pillars
  same | drawn ch portfolio -> views/system/findings | source ch portfolio -> views/system/findings
  same | drawn ch portfolio -> views/system/status | source ch portfolio -> views/system/status
  same | drawn ch portfolio -> views/system/workbench | source ch portfolio -> views/system/workbench
  same | drawn ch portfolio -> routes/+page | source ch portfolio -> routes/+page
  same | drawn ch portfolio -> routes/+page | source ch portfolio -> routes/+page
  22 of 22 arrows start and end at the source's two nodes
ch config: 20 arrows
  same | drawn server/root/watch/portfolio -> ch config | source server/root/watch/portfolio -> ch config
  same | drawn ch config -> state/client/context | source ch config -> state/client/context
  same | drawn ch config -> state/client/selectors | source ch config -> state/client/selectors
  same | drawn ch config -> state/client/socket | source ch config -> state/client/socket
  same | drawn ch config -> state/life/present | source ch config -> state/life/present
  same | drawn ch config -> state/sessions/latex/latex | source ch config -> state/sessions/latex/latex
  same | drawn ch config -> state/sources/fs | source ch config -> state/sources/fs
  same | drawn ch config -> state/sources/search/search | source ch config -> state/sources/search/search
  same | drawn ch config -> state/workbench/palette-source | source ch config -> state/workbench/palette-source
  same | drawn ch config -> views/boards/entry | source ch config -> views/boards/entry
  same | drawn ch config -> views/feeds/leads | source ch config -> views/feeds/leads
  same | drawn ch config -> views/feeds/literature | source ch config -> views/feeds/literature
  same | drawn ch config -> views/feeds/radar | source ch config -> views/feeds/radar
  same | drawn ch config -> views/sessions/terminal | source ch config -> views/sessions/terminal
  same | drawn ch config -> views/sources/doc | source ch config -> views/sources/doc
  same | drawn ch config -> views/system/findings | source ch config -> views/system/findings
  same | drawn ch config -> views/system/machine | source ch config -> views/system/machine
  same | drawn ch config -> views/system/workbench | source ch config -> views/system/workbench
  same | drawn ch config -> routes/+page | source ch config -> routes/+page
  same | drawn ch config -> routes/+page | source ch config -> routes/+page
  20 of 20 arrows start and end at the source's two nodes
ch git: 9 arrows
  same | drawn server/root/watch/git -> ch git | source server/root/watch/git -> ch git
  same | drawn ch git -> state/client/selectors | source ch git -> state/client/selectors
  same | drawn ch git -> state/system/apps/apps | source ch git -> state/system/apps/apps
  same | drawn ch git -> state/system/apps/frame/rules | source ch git -> state/system/apps/frame/rules
  same | drawn ch git -> views/sessions/terminal | source ch git -> views/sessions/terminal
  same | drawn ch git -> views/system/status | source ch git -> views/system/status
  same | drawn ch git -> views/system/workbench | source ch git -> views/system/workbench
  same | drawn ch git -> routes/+page | source ch git -> routes/+page
  same | drawn ch git -> routes/+page | source ch git -> routes/+page
  9 of 9 arrows start and end at the source's two nodes
```

The three writes with the most arrows (`$TMPDIR/q72/orth/tw-final.txt`):

```
lib/server/edit/writes/undo.ts: 23 arrows
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/undo.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/undo.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/core/changes.ts | source lib/server/edit/writes/undo.ts -> lib/server/core/changes.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/feeds/feeds.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/feeds/feeds.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/feeds/feeds.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/feeds/feeds.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/feeds/literature.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/feeds/literature.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/entries.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/entries.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/hubs.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/hubs.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/manifest.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/manifest.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/subtasks.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/subtasks.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/apps/store.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/apps/store.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/apps/store.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/apps/store.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/app-setting.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/app-setting.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/config-checks.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/config-checks.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/config-key.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/config-key.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/config-value.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/config-value.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/lists/folders.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/lists/folders.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/lists/folders.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/lists/folders.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/lists/rail.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/lists/rail.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/lists/deck/deck.ts | source lib/server/edit/writes/undo.ts -> lib/server/edit/writes/config/lists/deck/deck.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/files/fs/collections.ts | source lib/server/edit/writes/undo.ts -> lib/server/files/fs/collections.ts
  same | drawn lib/server/edit/writes/undo.ts -> lib/server/sessions/overrides.ts | source lib/server/edit/writes/undo.ts -> lib/server/sessions/overrides.ts
  same | drawn lib/server/edit/writes/undo.ts -> ? src/lib/server/edit/writes/undo.ts:241 | source lib/server/edit/writes/undo.ts -> ? src/lib/server/edit/writes/undo.ts:241
  same | drawn lib/server/edit/writes/undo.ts -> ? src/lib/server/edit/writes/undo.ts:439 | source lib/server/edit/writes/undo.ts -> ? src/lib/server/edit/writes/undo.ts:439
  23 of 23 arrows start and end at the source's two nodes
lib/server/core/json.ts: 19 arrows
  same | drawn lib/server/core/changes.ts -> lib/server/core/json.ts | source lib/server/core/changes.ts -> lib/server/core/json.ts
  same | drawn lib/server/core/json.ts -> lib/server/core/json.ts to file on disk (calls) | source lib/server/core/json.ts -> lib/server/core/json.ts to file on disk (calls)
  same | drawn lib/server/edit/feeds/feeds.ts -> lib/server/core/json.ts | source lib/server/edit/feeds/feeds.ts -> lib/server/core/json.ts
  same | drawn lib/server/edit/writes/entries.ts -> lib/server/core/json.ts | source lib/server/edit/writes/entries.ts -> lib/server/core/json.ts
  same | drawn lib/server/edit/writes/file-undo.ts -> lib/server/core/json.ts | source lib/server/edit/writes/file-undo.ts -> lib/server/core/json.ts
  same | drawn lib/server/edit/writes/manifest.ts -> lib/server/core/json.ts | source lib/server/edit/writes/manifest.ts -> lib/server/core/json.ts
  same | drawn lib/server/edit/writes/apps/store.ts -> lib/server/core/json.ts | source lib/server/edit/writes/apps/store.ts -> lib/server/core/json.ts
  same | drawn lib/server/edit/writes/config/config-checks.ts -> lib/server/core/json.ts | source lib/server/edit/writes/config/config-checks.ts -> lib/server/core/json.ts
  same | drawn lib/server/edit/writes/config/lists/audit-mute.ts -> lib/server/core/json.ts | source lib/server/edit/writes/config/lists/audit-mute.ts -> lib/server/core/json.ts
  same | drawn lib/server/edit/writes/config/lists/folders.ts -> lib/server/core/json.ts | source lib/server/edit/writes/config/lists/folders.ts -> lib/server/core/json.ts
  same | drawn lib/server/edit/writes/config/lists/rail.ts -> lib/server/core/json.ts | source lib/server/edit/writes/config/lists/rail.ts -> lib/server/core/json.ts
  same | drawn lib/server/edit/writes/config/lists/deck/deck-files.ts -> lib/server/core/json.ts | source lib/server/edit/writes/config/lists/deck/deck-files.ts -> lib/server/core/json.ts
  same | drawn lib/server/edit/writes/config/lists/deck/deck-new.ts -> lib/server/core/json.ts | source lib/server/edit/writes/config/lists/deck/deck-new.ts -> lib/server/core/json.ts
  same | drawn lib/server/edit/writes/config/lists/deck/deck-undo.ts -> lib/server/core/json.ts | source lib/server/edit/writes/config/lists/deck/deck-undo.ts -> lib/server/core/json.ts
  same | drawn lib/server/edit/writes/config/lists/deck/deck.ts -> lib/server/core/json.ts | source lib/server/edit/writes/config/lists/deck/deck.ts -> lib/server/core/json.ts
  same | drawn lib/server/files/fs/bookmarks.ts -> lib/server/core/json.ts | source lib/server/files/fs/bookmarks.ts -> lib/server/core/json.ts
  same | drawn lib/server/files/fs/history.ts -> lib/server/core/json.ts | source lib/server/files/fs/history.ts -> lib/server/core/json.ts
  same | drawn lib/server/files/workspace/state.ts -> lib/server/core/json.ts | source lib/server/files/workspace/state.ts -> lib/server/core/json.ts
  same | drawn lib/server/sessions/overrides.ts -> lib/server/core/json.ts | source lib/server/sessions/overrides.ts -> lib/server/core/json.ts
  19 of 19 arrows start and end at the source's two nodes
lib/server/edit/writes.ts: 18 arrows
  same | drawn lib/server/edit/writes.ts -> lib/server/core/changes.ts | source lib/server/edit/writes.ts -> lib/server/core/changes.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/entries.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/entries.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/file-undo.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/file-undo.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/hubs.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/hubs.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/manifest.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/manifest.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/subtasks.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/subtasks.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/undo.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/undo.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/apps/gate.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/apps/gate.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/apps/store.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/apps/store.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/apps/store.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/apps/store.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/config/config-write.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/config/config-write.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/config/lists/deck/deck-acts.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/config/lists/deck/deck-acts.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes/config/lists/deck/deck-undo.ts | source lib/server/edit/writes.ts -> lib/server/edit/writes/config/lists/deck/deck-undo.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/files/roots.ts | source lib/server/edit/writes.ts -> lib/server/files/roots.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/sessions/overrides.ts | source lib/server/edit/writes.ts -> lib/server/sessions/overrides.ts
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes.ts to lib/server/core/auth.ts (refuses) | source lib/server/edit/writes.ts -> lib/server/edit/writes.ts to lib/server/core/auth.ts (refuses)
  same | drawn lib/server/edit/writes.ts -> lib/server/edit/writes.ts to lib/server/edit/feeds/feed-route.ts (refuses) | source lib/server/edit/writes.ts -> lib/server/edit/writes.ts to lib/server/edit/feeds/feed-route.ts (refuses)
  same | drawn routes/api/write/+server.ts -> lib/server/edit/writes.ts | source routes/api/write/+server.ts -> lib/server/edit/writes.ts
  18 of 18 arrows start and end at the source's two nodes
```

## Files

`diff -rq <base> <worktree tools/oculus> -x node_modules -x .scratch -x .svelte-kit -x unused-exports.txt` lists 49 lines; with line counts (`wc -l`, base then now):

| File | Base | Now |
| --- | --- | --- |
| `DESIGN.md` | 757 | 759 |
| `HELP.md` | 485 | 485 |
| `docs/diagrams/channels.dot` | 415 | 304 |
| `docs/diagrams/channels.svg` | 2300 | 1593 |
| `docs/diagrams/layer-ui.dot` | 140 | 143 |
| `docs/diagrams/layer-ui.svg` | 667 | 684 |
| `docs/diagrams/writes.dot` | 332 | 353 |
| `docs/diagrams/writes.svg` | 1546 | 1546 |
| `src/lib/data/model/index.ts` (outside the list) | 825 | 826 |
| `src/lib/data/model/model-sessions.ts` | 823 | 843 |
| `src/lib/server/core/git/compare.ts` | 491 | 483 |
| `src/lib/server/core/git/parse.ts` | 716 | 819 |
| `src/lib/server/core/git/reads.ts` | 436 | 423 |
| `src/lib/server/files/fs/ops.ts` | 801 | 805 |
| `src/lib/server/git/git-diffs.ts` | 93 | 93 |
| `src/lib/state/sources/repositories/answers.ts` | 355 | 364 |
| `src/lib/state/sources/repositories/diff/diff-hunks.ts` | 293 | 293 |
| `src/lib/state/sources/repositories/diff/diff-patch.ts` | 178 | 180 |
| `src/lib/state/sources/repositories/repositories.ts` | 819 | 837 |
| `src/lib/ui/controls/editor/diff/DiffEditor.svelte` | 494 | 519 |
| `src/lib/ui/controls/editor/diff/git-provider.ts` | new | 239 |
| `src/lib/ui/controls/editor/diff/read.ts` | 66 | 67 |
| `src/lib/ui/controls/editor/kit/load.ts` | 602 | 634 |
| `src/lib/ui/controls/text/Search.svelte` | 120 | 91 |
| `src/lib/ui/forms/DateInput.svelte` | 109 | 78 |
| `src/lib/ui/forms/TextArea.svelte` | 166 | 148 |
| `src/lib/ui/forms/TextInput.svelte` | 151 | 120 |
| `src/lib/ui/forms/choice/GlyphSelect.svelte` | 54 | 54 |
| `src/lib/ui/forms/choice/MultiSelect.svelte` | 237 | 209 |
| `src/lib/ui/forms/choice/Select.svelte` | 94 | 68 |
| `src/lib/ui/forms/choice/SuggestInput.svelte` | 226 | 201 |
| `src/lib/ui/forms/choice/select/FieldSelect.svelte` (from `drawn/`) | 126 | 106 |
| `src/lib/ui/forms/choice/select/HueSelect.svelte` (from `drawn/`) | 118 | 118 |
| `src/lib/ui/theme/field.css` | new | 43 |
| `src/lib/views/sources/repositories/diff/Diff.svelte` | 519 | 520 |
| `src/lib/views/sources/repositories/diff/DiffSection.svelte` | 519 | 520 |
| `src/lib/views/sources/repositories/diff/diff-read.ts` | 201 | 207 |
| `src/lib/views/sources/repositories/diff/hunk-acts.svelte.ts` | 68 | 73 |
| `src/lib/views/system/workbench/editors/FieldControl.svelte` | 361 | 361 |
| `src/monaco-modules.d.ts` (outside the list) | 55 | 177 |
| `tests/checks/diagrams/diagrams.test.ts` | 867 | 877 |
| `tests/server/git/git-ops.test.ts` | 418 | 453 |
| `tests/state/client/terminal/terminal-close.test.ts` | 162 | 181 |
| `tests/state/system/link-rewrite.test.ts` | 57 | 79 |
| `utils/diagrams/diagrams.mjs` | 199 | 207 |
| `utils/diagrams/graphs.mjs` | 520 | 578 |
| `utils/diagrams/writes.mjs` | 608 | 558 |
| `utils/diagrams/drawing/labels.mjs` (from `utils/diagrams/labels.mjs`) | 448 | 450 |
| `utils/diagrams/drawing/apart.mjs` | new | 702 |
| `utils/diagrams/drawing/tracks.mjs` | new | 232 |

New folder: `utils/diagrams/drawing/` (3 files; `utils/diagrams/` holds 10 items). Renamed folder: `src/lib/ui/forms/choice/drawn/` to `src/lib/ui/forms/choice/select/` (2 files). `src/lib/ui/theme/` takes `field.css` (4 files). `src/lib/server/git/git-reads.ts` is listed but needed no change: its readers reach `sidesOf` in `reads.ts`, which fills the field.

Outside "Paths this step writes", each needed:

- `src/lib/data/model/index.ts`: one line, `GitLineChange,` in the barrel's re-export of `model-sessions.ts`, so the state and server layers import the new type from the model's entry as they import every other model type.
- `src/monaco-modules.d.ts`: Monaco ships declarations for its public entry alone, and `git-provider.ts` and `kit/load.ts` import eight internal modules (`offsetRange`, `lineRange`, `diffAlgorithm`, `rangeMapping`, `defaultLinesDiffComputer`, `diffProviderFactoryService`, `standaloneServices`, `instantiation`); this file is where the tree declares each internal subpath it uses, and its head comment now names them.
- `DESIGN.md:217`: the path `utils/diagrams/labels.mjs` became `utils/diagrams/drawing/labels.mjs`; the sentence was false after the move.

Rename greps (over `src tests config docs HELP.md DESIGN.md README.md utils`, `--exclude=local.yml`): `choice/drawn`, `utils/diagrams/labels.mjs` and `forms/field.css` print nothing (exit 1); `NO_CONTEXT` (renamed `PANE_DIFF`, which now carries `--no-textconv`) prints nothing in `src tests docs HELP.md DESIGN.md README.md config`.

## Every judgment call the brief left open

- The drawing construction (above): ports, tracks, steps aside, lanes, positioned `nop2` output, and its constants `PAD` 16, `TRACK` 6, `PORT` 8, `LEVEL` 3, `CLOSE` 2, `REACH` 48, `STEP` 4, `ROUNDS` 8, each with a comment on what it is. `RANKSEP` of `writes.mjs` is gone: the spaces now take the width their tracks need.
- A channel is drawn as a rounded box (an HTML table) in place of an ellipse, since a port cell per arrow needs a table node.
- `labels.mjs` moved into `drawing/` beside the rule that uses it, and the rule split into `apart.mjs` and `tracks.mjs`, to stay under 880 lines a file and 10 items a folder.
- The channel reading fixes listed under "The construction", including the publish rule (a call of `publish` on the hub): they remove arrows that were misread, so the drawing shows what the source does.
- `field.css` lives in `ui/theme`, the lowest ui folder, because `Search.svelte` (in `ui/controls`) imports it and `order.test.ts` refuses an import from `ui/controls` up into `ui/forms`; `ui/forms` stays at 10 items. Class `oculus-field`. New names checked unused on the base: `grep -rn oculus-field <base>/src` prints nothing; no text catalog key was added and `config/` is unchanged (`diff -rq` with `--exclude=local.yml`, exit 0).
- `:disabled` (muted colour, not-allowed cursor) is in the shared sheet: `Select`, `TextInput` and `DateInput` set it on main with the same two declarations, and the other five take no `disabled` prop (`grep -c disabled` 0 in each), so the rule changes nothing they draw. `::placeholder` is shared the same way: the five fields with a placeholder set the same colour on main.
- Part 3: git's changes are checked against the texts read (`gitLineChanges` returns null when a head's lines are not the texts' lines), and the provider answers Monaco's own diff whenever the models' lines are not the held texts' lines, a text has a carriage return no line feed follows, or a change would leave the lines. A file whose texts differ only in line endings keeps the note at its head.
- `--no-textconv` on the diff reads (`PANE_DIFF`), so the heads name the stored text the pane shows.
- After the code was complete: a comment-only edit in `apart.mjs` and three long sentences of `DESIGN.md:129`, `:161` and `:680` split in two each (the sentence lengths are under "Sentences and list items").

## Every host- or user-visible change, before and after

- Repositories diff pane, a file's own diff (staged, unstaged, a commit, a merge commit, a stash, a range compare, a worktree's diff, a conflicted file): before, the green and red lines, the blocks, Previous and Next Change and the rows a selection chooses came from Monaco's own diff; after, from git's `-U0` hunks, so a block is the hunk `git add -p` offers and a staged block leaves exactly that hunk in the index. On `channels.ts` (9e250b73d) the added run is lines 14 to 25 (git) where it was 13 to 24 (Monaco).
- The same pane on a file under a textconv driver: the heads now name the stored text (before, the driver's output, which no side showed).
- A comparison of two files, the Replace Preview, a save conflict, an app's quick diff, the Refactor Preview, a workspace compare: unchanged, Monaco's own diff.
- `channels.svg` (Help, DESIGN): before 853 x 3664 pt with ellipses and arrows sharing trunks; after 1703 x 3440 pt, channels as rounded boxes, each arrow on its own port and track, 147 arrows (198 before) and 8 "not placed" nodes (103 before).
- `writes.svg`: before 1720 x 1567 pt; after 4225 x 1927 pt, each arrow on its own port and track, a write's words sitting on its arrow.
- `layer-ui.svg`: a new arrow `ui/forms to ui/theme` (7) and `ui/controls to ui/theme` 2 (was 1); 316 to 328 pt wide.
- The eight fields: no change meant in any theme or state; their rules now come from one sheet (the look at landing).
- HELP.md:437 before: "A changed row opens its diff, side by side or inline. Blocks have Stage Block, Revert Block (asks) and Unstage Block; a line selection narrows them." After: "A changed row opens its diff, side by side or inline, with the changes git finds. Each block is a hunk as `git add -p` offers it, with Stage Block, Revert Block (asks) and Unstage Block; a line selection narrows them."
- DESIGN.md: a new channels paragraph at :129, two sentences added to the writes paragraph at :161, the path at :217, and the git line changes with their reason in the Repositories bullet at :680.

## Anything in the brief that was wrong or impossible

- Nothing was impossible. The brief's case 21 asks for a unit run "where the tree's tests can make a Monaco diff editor": they cannot (no Monaco editor runs under Vitest), so case 21 ran through the provider service with model stand-ins, and the live editor is the look at landing.
- The construction does not part every source: case 6's source, where four arrows of one title must cross four of another, throws. Of the seeded two-column sources kept from the search (`$TMPDIR/q72/orth/bip*.dot`, 18 files), run on the final rule, 15 are drawn and 3 throw: `bip20098` (`l1->r1 along l10->r13 for 48`), `bip20106` (`l3->r14 along l5->r8 for 45`) and `bip9078` (`l1->r4 along l2->r0 for 45`, 25 arrows, three `l1 -> r4` against five `l2 -> r0`). Each is a forced crossing of two bundles of three to five arrows of one title at Graphviz's positions. The tree's two drawings hold at most 2 arrows of one title (`uniq -c` over the arrows of `channels.dot` and `writes.dot`: `2 "ch usage" -> "routes/+page"`, `2 "lib/server/files/fs/collections.ts" -> "lib/server/files/fs/bookmarks.ts"`), and the generators cannot write more than 3: `channelsDot()` keeps its arrows in a set of statements, a solid read and a dashed subscription at most between a channel and a reader (`graphs.mjs:552`), and `writesDot()` keys an arrow by its two ends and its kind (`writes.mjs:363`, `calls`, `refuses` or `refers`). Two lines of at most 3 arrows each cross at most 9 times in one space where Graphviz's order forces them, about 27 points against the threshold of 40. Two such lines whose order Graphviz's layout flips in two spaces of their run could pass 40 and make `npm run diagrams` throw on a later source; the tree's source today gives none (case 3 after), and the throw names the pair, as the brief asks.
- The brief's `HunkBar.svelte` needed no change.

## Guarded entry rows added

- G25, `tests/checks/diagrams/diagrams.test.ts`, `'run no two arrows along each other in any drawing the source gives'` (inside the describe that holds 'are clear of every other arrow in every drawing the source gives'):

```ts
    it('run no two arrows along each other in any drawing the source gives', async () => {
        const drawn = await engineDrawn();
        expect(drawn.map((one) => one.name)).toEqual(NAMES);
        const along = drawn.flatMap((one) =>
            arrowsAlong(one.svg).map((line) => `${one.name}: ${line}`)
        );
        expect(along).toEqual([]);
    });
```

- G33, `tests/server/git/git-ops.test.ts`, `"reads a file's changes as git's hunks, and stages one block as exactly git's hunk"`: the pair of case 12 written to a scratch repository; asserts `file.changes` equals `[change(2, 0, 3, 4), change(12, 12, 14, 14)]`, two blocks, and that the block cut by `sidesPatch` over git's changes and staged by `applyHunk` leaves `git diff --cached -U0` equal to git's first hunk, `'@@ -2,0 +3,2 @@ const A = 1;\n+const C = 3;\n+\n'`.

G25's wording already names the drawings' arrows (`agents/guarded.md:244`); the G33 row's title is for the orchestrator to book at landing.

## Changed assertions, and each new or changed row on the unchanged tree

- `terminal-close.test.ts`, 'ends no terminal when it moves to another pane, to another page, or is split'. Before: `await settle(); expect(stops).toEqual([]); expect(holds(id)).toBe(true);`. After: `expect(holds(id)).toBe(true); await closedAndStopped(id, A, other); expect(stops).toEqual([A]);`.
- Same file, 'ends no terminal when the layout of another workspace is opened'. Before: `listed([A]); ... await settle(); expect(stops).toEqual([]);`. After: `listed([A, B]); ... await closedAndStopped(owning([B]), B); expect(stops).toEqual([B]);`.
- `link-rewrite.test.ts`, each row. Before: `submit` rejects and counts, `await new Promise((resolve) => setTimeout(resolve, 0)); expect(told).toEqual(said); expect(submitted).toBe(0);`. After: a second offer answered with an edit (`CREATED`), `await second;` (resolved by its submit), `expect(told).toEqual(said); expect(submitted).toEqual([{ documentChanges: [CREATED] }]);`.

Read against the code each guards: a tab's close posts the stop of its terminals synchronously through `closeInstance` (`state/workbench/layout/tabs/instances.ts:288`), `ui.endTerminals` and `terminals.endTerminals` to `stopTerminal`; a move, a split or an opened layout that ended a terminal would post through that same path, during its own call, before the close. If one did, `stops` would hold that id before the closing tab's (`[A, A]`, or `[A, B]`), or, where the ended terminal is no longer running at the close, the barrier for `A` would never resolve and the test would time out; both fail. In `link-rewrite.ts` an offer awaits `askLinks` once per root and then, with changes, `submit`; both offers take the same awaits in the same order, so the row's offer has said and submitted all it will before the second offer's submit resolves the barrier; a row's offer that submitted would leave two entries in `submitted`, and one that said more or less would change `told`.

On the unchanged tree (`$TMPDIR/q72/base-rows1`, `src` equal to the base's): the G25 row fails at `expect(along).toEqual([])` (case 4), the G33 row fails at `tests/server/git/git-ops.test.ts:249:30`, `expect(file.changes).toEqual(...)` with `expected undefined` (case 12). The changed checks of part 5 pass there (`Tests  6 passed (6)`), as they should: the thing each guards does not happen on main either.

## History words, doc comments and sentences

The spec's grep over every added line of the changed files (1634 lines, `$TMPDIR/q72/added-final.txt`), restricted to comments, test titles and Markdown, for 'before', 'used to', 'no longer', 'still', 'always has been', 'always had', 'as before', 'previously', 'the step adds', 'after this package lands'. Every hit, judged:

- `model-sessions.ts`: "named by the line before where it would be": a place in the text.
- `parse.ts`: "named by the line before where it would be": a place in the text.
- `reads.ts`: "`before` and `after` naming where": the parameter names; "bytes were UTF-8 before they were decoded": the order of two steps of one read.
- `diff-patch.ts`: "the change of the newline before it": a place in the text.
- `diff-read.ts`: "A preview that is no longer pending has none": a state at run time.
- `monaco-modules.d.ts`: "the position before `endExclusive`", "the line before `endLineNumberExclusive`": places.
- `terminal-close.test.ts`: "every such stop is recorded before this one": order at run time.
- `apart.mjs`: "steps aside to a free height before it meets the other", "the space before its head's band" (twice), "the layout before, so the drawing is made again" (the previous round of one run), "before it gives up", "The plans before, or none" (the previous round), "the one before", "The space before the first band", "the spaces before", `const before`: places or rounds at run time.
- `tracks.mjs`: "comes to another before that counts", "ends at its track before the other's begins", `const before`, "the runs before it", "halfway before the first such track": places and order.

None names an earlier state of the code. The `DESIGN.md` lines added print no hit.

Doc comments and pages read against the change:

- Rewritten: the head comments of `diff-hunks.ts`, `diff-patch.ts` (`:12-14`), `DiffSection.svelte` (`:18` and the hunk paragraph), `Diff.svelte` (`:137`), `hunk-acts.svelte.ts` (head and `drawnChanges`), `DiffEditor.svelte`, `diff/read.ts`, `kit/load.ts` (head and `pageDiffs`), `monaco-modules.d.ts`, `graphs.mjs` (`channelsDot` and the reading functions), `diagrams.mjs` (head and `generate`), `labels.mjs` (one sentence); the doc comments of `sidesOf` (`reads.ts`), `PANE_DIFF` (`parse.ts`), `LineChange` and `DiffSides` (`model-sessions.ts`), the two zod shapes (`answers.ts`), `sameChanges` (`repositories.ts`), `writesDrawn` (`writes.mjs`), the three builders of `diff-read.ts`; the comments at `compare.ts` `workspaceSides` and the two `ops.ts` builders; `FieldSelect.svelte`'s comment naming the sheet and its style comment (the trigger's own rules); the style comments of `SuggestInput.svelte` (its width) and `TextArea.svelte` (the rice line down its left side), and the rice comments of `TextInput.svelte` and `Search.svelte`, whose rules moved into `field.css` with their comment; `DESIGN.md:129`, `:161`, `:217`, `:680`; `HELP.md:437`.
- Still true: `git-diffs.ts`'s head comment (the reads it lists are unchanged); the `DESIGN.md` Watchers and Language server channels paragraphs (`:125-128`); the other bullets of `HELP.md`'s Source control section (`:425-445`); the head comments of the eight fields and of `GlyphSelect.svelte` and `HueSelect.svelte`.

Sentences and list items: `spec.md` gives no number for a sentence; it asks for short bullets in HELP.md and a decision with its reason in DESIGN.md. Words per sentence (a split at each full stop): `HELP.md:437` 17, 25; `DESIGN.md:129` 25, 43, 49, 27, 40, 9; `:161` 37, 31, 36, 13, 21; `:680` 44, 38, 36, 50, 30, 24, 22. Two sentences of mine are long: `:129`'s 49 words, because it names the three ways a channel is placed (a literal, a string constant, a naming function) and only one list can say which are not; and `:680`'s 50 words, which carries decision 3's reason (no second git command, git's own options as for `git add -p`) beside the fact it explains.

## The looks

- Case 8 and part 2: Help (or DESIGN.md's image) showing `docs/diagrams/channels.svg` and `writes.svg`. What must be seen: each arrow can be followed from its box to its box; no two arrows run together; arrows leave and reach boxes at separate points; the channels are rounded boxes; a write's words sit on its arrow, met level from the left and leaving level on the right; the 8 "not placed" nodes in the dashed group. `writes.svg` is 4225 pt wide: whether it reads at the Help view's width (scroll or zoom) is part of the look.
- Case 21 and 22: the Repositories view on a scratch repository holding `channels.ts` at 9e250b73d^ with the 9e250b73d text in the worktree. The unstaged row's diff marks modified lines 14 to 25 as added (not 13 to 24); a selection on line 13 offers no Stage Selected Ranges, one on line 25 does; Stage Block stages exactly git's hunk (`git diff --cached -U0` shows `@@ -13,0 +14,12 @@`). With unchanged regions hidden, Previous Change and Next Change reach a block inside a hidden region and open it; Open File opens at the block's first line. A comparison of two files (Compare with Selected) still draws Monaco's own.
- Case 23: a form holding the eight fields (the entry editor's fields; the Search box of a view; a native `Select`, a `FieldSelect`, a `MultiSelect` filter, a `SuggestInput`, a `TextInput`, a `TextArea`, a `DateInput`), in the dark, the light and the rice themes, at rest, focused and, for `Select`, `TextInput` and `DateInput`, disabled. Each must look as on main: the same border, radius, chip background, font size, line height and 4px 6px padding; the 1px accent outline at -1px on focus; muted text and a not-allowed cursor when disabled; in rice, no box, a line under the field and the mono font.

## The ASCII gate's run over this report and the changed files

Run from the worktree root after this report was written, over the 50 changed files of the table under "Files" (the base's `labels.mjs` and `drawn/` paths at their new places) and this report:

```
cd .agents/worktrees/Q72 && printf '%s\0' $(sed 's#^#tools/oculus/#' $TMPDIR/q72/gate-files.txt) tools/oculus/.scratch/migration/agents/reviews/Q72-report.md | xargs -0 env LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof'; echo "exit $?"
```

Output: no line, then `exit 0`.

## Repair round 1

All three items of `agents/briefs/Q72-round1.md` are built. Three things you need to know first:

- **Item 2 drops providers through a new `release(model)`, not on `hold(model, null)`.** The brief's premise is incomplete. `DiffEditor.svelte` calls `hold(model, null)` in two places, not one:
  - in `onDestroy`, as the brief says;
  - in its `$effect` (`DiffEditor.svelte:331`, through its `hold` helper at :281-291), every time a live editor is handed texts with no git changes. This covers every compare, Replace Preview and save conflict.

  Dropping providers and clearing their listeners there would cut a live editor off from its provider's `onDidChange`. So the providers are dropped by a new `GitDiffs.release(model)`, which `onDestroy` calls (`DiffEditor.svelte:457`). `hold(model, null)` keeps its meaning: drop the held changes and fire.
- **`DESIGN.md:680` is outside this round's path list.** It gained one sentence recording the decision to run the worker, with its reason (spec.md: "a decision with its reason into DESIGN.md").
- **No test file was added.** spec.md's test rule allows a test only as the test of a `guarded.md` entry. No entry names `git-provider.ts` or the worker: G33's Code line names `parse.ts` and `diff-patch.ts`. Items 1 and 2 are shown by the one-line `node -e` runs below.

### Open items of the state file

- `orchestrator-state.md:169` (main checkout, read only) lists one open item, 116: Q72's review, Spec 1, the builder's scripts outside the tree. Its recommendation is (a): leave them unapproved and unused, and allow no script of the builder's again. This round wrote no script. Every probe was a one-line `node -e`, and every edit was made with the edit tool.

### Item 1: the changed characters are found off the page's thread

First run, on the round-0 tree.

`refineDiff` called directly, as the review did. The review's own command is not quoted in its report, so this is my one-liner with the same call. The block is N lines `const value<i> = compute(<i>, 'alpha', <3i>);` rewritten as `let item<i> = transform(<i+1>, "beta", <5i>) + 1;`:
```
N=500 node --input-type=module -e "import {DefaultLinesDiffComputer} from 'monaco-editor/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer'; ... new DefaultLinesDiffComputer().refineDiff(a,b,new SequenceDiff(new OffsetRange(0,n),new OffsetRange(0,n)),InfiniteTimeout.instance,true,{extendToSubwords:false}) ..."
lines 500 mappings 1 ms 3616
N=5000 (same command)
lines 5000 mappings 1 ms 416743
```

The page's thread time of a `computeDiff` through `createGitDiffs`, with stand-ins for the models and for Monaco's own provider (as case 21 ran), 500 lines:
```
lines 500 page thread ms 3925 answer 1,501,1,501,1
```
The 5000-line block was not measured through `createGitDiffs` on the round-0 tree. Only the direct `refineDiff` run above was.

The change:
- `src/lib/ui/controls/editor/diff/inner-changes.worker.ts` (new, 70 lines). It is the worker. It runs `DefaultLinesDiffComputer.refineDiff` per run with `InfiniteTimeout`, and answers `{ id, ranges }`. `ranges` holds, per run, eight whole numbers per changed range (original start line, start column, end line, end column, then the same four for the modified side). If the computation refuses a run, `ranges` is null.
- `git-provider.ts`: `gitDocumentDiff` is gone.
  - `computeDiff` is async. It checks the runs with `modelChanges` as before, then posts the two line lists and the runs through `innerAsker`.
  - It builds `RangeMapping`/`DetailedLineRangeMapping` from the numbers (`mappingsOf`, `documentDiff`).
  - It answers Monaco's own diff when the worker fails, when a reply does not fit the runs asked (`fits`), or when the held entry or the models' lines changed while the worker computed.
  - The worker is started at the first ask that has runs. A diff with no runs, or with no git changes, starts none.
  - A worker that fires `error` or `messageerror`, or answers without a known id, is terminated. Its waiting asks answer null, and the next ask starts a new worker.
  - No time limit is set.
- `kit/load.ts` `pageDiffs()` imports `../diff/inner-changes.worker.ts?worker` dynamically, beside `git-provider`, and passes `() => new inner.default()` to `createGitDiffs`.
- `src/monaco-modules.d.ts` declares `monaco-editor/editor/common/core/range` (re-exporting the public `Range`), and `RangeMapping` as the class it is.

After, the same blocks through `createGitDiffs`. The stand-in worker is a Node `worker_threads` thread that imports the real `inner-changes.worker.ts`; the probe sets `self` there, since Node has none:
```
lines 500 computeDiff call ms 1 page thread busy ms 0 answered after ms 3866 workers started 1 answer 1,501,1,501,1,[1,1 -> 501,1]->[1,1 -> 501,1]
lines 5000 computeDiff call ms 3 page thread busy ms 6 answered after ms 463104 workers started 1 answer 1,5001,1,5001,1,[1,1 -> 5001,1]->[1,1 -> 5001,1]
```
"page thread busy" is `performance.eventLoopUtilization().active` over the whole call, from the call until the answer.

The answer is the same as before. On case 9's texts (`$TMPDIR/q72/c/channels`), the provider gives `changes 14,14,14,26`, `inner via worker [14,1 -> 14,1]->[14,1 -> 26,1]` and `same as refineDiff on the page thread: true`.

The asynchronous paths (spec.md "every asynchronous path in flight, after close, and superseded"), with a stand-in worker the probe answers by hand:
```
answered in time: git [1,3 -> 1,4]->[1,3 -> 1,4] | workers 1
held changes replaced while computing: monaco own
modified model edited while computing: monaco own
reply of 4 numbers for a range: monaco own
reply with no id: monaco own | that worker ended true
next ask starts worker number 2
worker error: monaco own | ended true
models disposed while computing: monaco own
no changes held: identical true | workers started for it 0
```

Build. `npx vite build --mode app` in the scratch copy `$TMPDIR/q72/r1/appbuild` (copied without `local.yml`, sharing the worktree's `node_modules`) exits 0. It writes `_app/immutable/workers/inner-changes.worker-DDFLUF8Y.js` (105.96 kB, an IIFE holding `refineDiff`, 0 imports).
- The one chunk that names it (`chunks/DXOGzm-j.js`, 145 bytes, `new Worker(new URL(...))`) is reached by `import(`../chunks/DXOGzm-j.js`)` in `nodes/2`.
- `grep -rl "inner-changes" .svelte-kit-app/output/server` prints nothing.

Vite's dev optimizer, run in that copy with a `node -e` of `resolveConfig` and `optimizeDeps`, puts `core/range` in one chunk `range-DQsvnEgT.js`. That chunk is imported by `editor.api-BihzCHcZ.js` and `standaloneServices-HGp72i4g.js` among others. `rangeMapping-DE4nkgxT.js` is shared with `editor.api` and `diffProviderFactoryService`. So the `Range` and `RangeMapping` the provider builds are the classes Monaco's diff editor reads.

The live diff editor drawing the worker's answer is checked by the look at landing (cases 21 and 22).

### Item 2: providers are forgotten with their editor

First run, on the round-0 tree. Providers A and B both computed (models `a`, `b`); C was made and never asked; then model `a` was dropped with `hold('a', null)`. Fires are counted through `onDidChange`:
```
A and B computed: holds of a and b fire A 1 B 1 C (never asked) 2
model a released, A fired 1
after the release: holds of a and b fire A 1 B 1 C (never asked) 2
```

The change:
- `asked` maps each provider's signal to `{ uri, model, dispose }`. A provider enters it at its first `computeDiff`, never at creation, so C holds no entry.
- `hold` fires the providers whose last `uri` is the model's.
- `release(model)` runs `hold(uri, null)`, then calls `dispose` on each provider whose last model is that model object. That removes it from `asked`, disposes the relay of Monaco's own provider, clears its listeners and disposes Monaco's own provider.

After:
```
A and B computed: holds of a and b fire A 1 B 1 C (never asked) 0
b dropped by a live editor, then: holds of a and b fire A 1 B 1 C (never asked) 0
model a released, A fired 1 | own providers disposed [0] | relay of A dropped
after the release: holds of a and b fire A 0 B 1 C (never asked) 0
```
Read through the fires, `asked` holds A and B, then only B. The second line shows that `hold('b', null)` from a live editor keeps B listed.

### Item 3: the stale comment

- First run: `tests/checks/diagrams/diagrams.test.ts:836`: "// Each count and call list is a node on its arrow; the router keeps other arrows off it."
- After (:836-838): "// Each count and call list is a node on its arrow. In the layer drawings Graphviz's router // keeps other arrows off it; the channel and write diagrams have every arrow drawn by // utils/diagrams/drawing/apart.mjs, which keeps them off it there."
- No assertion changed. This round adds or changes no test.

### Files this round changed

| File | Lines after | What |
| --- | --- | --- |
| `diff/git-provider.ts` | 352 | items 1 and 2, head comment rewritten |
| `diff/inner-changes.worker.ts` | 70 (new) | item 1 |
| `kit/load.ts` | 640 | the worker's import, `pageDiffs` doc comment and head comment rewritten |
| `diff/DiffEditor.svelte` | 519 | `onDestroy` calls `release`; `hold` helper takes no null, doc comment rewritten |
| `src/monaco-modules.d.ts` | 188 | `core/range` declared, `RangeMapping` a class, head comment rewritten |
| `tests/checks/diagrams/diagrams.test.ts` | 879 | item 3 |
| `DESIGN.md` (outside the path list) | 759 | one sentence in :680 |

- `ui/controls/editor/diff/` holds 5 items.
- Comments re-read:
  - Rewritten: the head comments of `git-provider.ts`, `inner-changes.worker.ts` and `monaco-modules.d.ts`; the `kit/load.ts` head comment and `pageDiffs`; `DiffEditor.svelte`'s `hold` helper.
  - Still true: `DiffEditor.svelte`'s head comment (:9-11) and `read.ts:3`.
- History words in the lines this round added: the grep of `before|used to|no longer|still|always ha|as before|previously` over the changed files hits only lines this round did not write. The worker's variables are named `original`/`modified`.
- Reuse grep: `grep -rn '?worker\|new Worker' src | grep -v "^src/lib/server"` finds `kit/workers.ts` (Monaco's workers by label), `state/sources/search/file-match.worker.ts` with `file-matcher.svelte.ts:48` (the palette's matcher), and the new `load.ts:252`. Neither existing worker computes a diff. The new worker follows the `file-match.worker.ts` form: `self.onmessage`, `self.postMessage`, and a dynamic `?worker` import.

### Verify

- `npm run lint`: `lint exit 0`.
- `npm run format:check`: `All matched files use Prettier code style!`.
- `npm run check`: `COMPLETED 4053 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- Tree checks (`npx vitest run tests/checks/diagrams tests/checks/source/comment-width.test.ts tests/checks/imports tests/checks/tree tests/checks/source/history.test.ts --testTimeout 0 --hookTimeout 0`): `Test Files  10 passed (10)` / `Tests  121 passed (121)`.
  - Run after `test:quick`.
  - An earlier run in this round had `comment-width` red at `git-provider.ts:158` (a doc comment of 101 columns). That line was shortened, the file rerun alone (`Tests  2 passed (2)`), and then the whole command run as quoted.
- `npx vitest run tests/server/git/git-ops.test.ts`: `Tests  17 passed (17)`.
- `sh utils/folder-check.sh`: `folder exit 0`. `sh utils/size-check.sh`: `size exit 0`. Both print nothing.
- `sh utils/unused-exports.sh`, diffed against `Q72-base/unused-exports.txt`: `< Unused exports (240)` / `> Unused exports (241)` / `> src/lib/ui/controls/editor/diff/git-provider.ts: createGitDiffs`.
  - This is the same single line as round 0. Its importer is `kit/load.ts:251` `import('../diff/git-provider')`.
  - The worker's exported types `InnerAsk` and `InnerAnswer` are imported by `git-provider.ts` and are not listed.
- ASCII gate (the perl form) over the seven files above: `ascii exit 0`.
- `npm run diagrams` ran right before the list. `diff -rq` against a copy taken before it printed nothing.
- `npm run test:quick`, run once after the last change: `test:quick: 55 changed file(s)`, `176 test file(s), 10 essential`, `test:quick: 55.3 s (limit 45.0 s); every command passed`, `test:quick: over the time limit`.

### Judgment calls

- **`release(model)` beside `hold`.** It is keyed by the model object, so that an editor made over the same URI keeps its providers when an older editor is destroyed.
- **A failed worker is replaced.** It is terminated, and the next ask starts another. The page's diffs with git's changes are not left on Monaco's own diff for the rest of the page's life after one crash. A worker that can never load costs one start and one failed ask per diff, and each such diff is Monaco's own.
- **A reply with no known id ends the worker**, because it cannot be tied to an ask.
