# Step Q74 refuter report (on .agents/worktrees/Q74, base f90268dc)

## Verification (rerun by the reviewer)

All commands were run from `.agents/worktrees/Q74/tools/oculus`.

| # | Command | Output |
|---|---|---|
| 1 | `npx vitest run --reporter=dot` | `Test Files 1 failed \| 311 passed (312)`, `Tests 1 failed \| 4893 passed (4894)`. The one failure is `readable.test.ts > ... in the write diagram`, which receives `lib/server/edit/writes.ts->lib/server/edit/writes/deck.ts along lib/server/edit/writes.ts->lib/server/edit/writes/rail.ts for 74`. This matches the report. |
| 2 | `npm run check` | `COMPLETED 1398 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | `npm run build` | exit 0 |
| 4 | `npm run format:check` | `All matched files use Prettier code style!` |
| 5 | `npm run lint` | exit 0 |
| 6 | `LC_ALL=C grep -rna '[^ -~]' src tests bin DESIGN.md HELP.md` | nothing printed (exit 1). The spec's perl ASCII gate also printed nothing. |
| 7 | `sh bin/size-check.sh`, `sh bin/folder-check.sh` | exit 0, exit 0 |
| 8 | `npm run diagrams` twice, `diff -r` between snapshots | Both runs are identical to each other and to the committed files. `node --no-experimental-strip-types bin/diagrams/diagrams.mjs` exits 0 and leaves the files unchanged. `git status --short` lists only the files of the diff. |
| 9 | `lsof -iTCP:8792 -sTCP:LISTEN`, then `npm run build`, then `npx playwright test` | Port free before (exit 1). Build exit 0. `386 passed (6.3m)`. Port free after (exit 1). |
| 10 | `node bin/revert-check.mjs tests/checks/diagrams/readable.test.ts tests/checks/diagrams/diagrams.test.ts` | `61 reverts, 0 unproven, 1 unchecked`. The unchecked case is the red write case. |
| 11 | `arrowsAlong()` and `labelsAcross()` over the nine drawings. "Before" is the base, rebuilt with `git diff f90268dc -- docs/diagrams` applied in reverse to a scratch copy. | Before, along/across: layers 0/0, data 0/0, server 28/0, state 29/0, ui 7/0, shell 3/0, views 41/0, channels 178/0, writes 1/0. After: every layer diagram and the overview 0/0, channels 178/0, writes 1/0. Sizes before and after match the report's table exactly. |
| 12 | `ls -d $TMPDIR/oculus-* \| wc -l` | 7015 before my runs and 7015 after (vitest, playwright, revert-check). `oculus-career-ObSvqv` is gone. |

Report-quoted evidence I reran:
- The five before-step counts reproduce (28, 29, 41, 7, 3, 0, 1).
- `labelledEdge()` output is unchanged: the overview's `.dot` is identical to the base.
- The channel and write `.dot`/`.svg` files are identical to the base; `git status` does not list them.
- `grep -rn uncomment` is clean. My grep showed no `uncomment` in the diff's files; I did not rerun the report's exact command over `config` and `README.md`.
- I did not rerun the report's construction table (56 spacing combinations and so on). My own trials are in the writes section below.

## 1. Spec

1. **Item 2 is not done.** The write case is red, and `readable.test.ts:183-190` has no revert directive. The report states this itself. My trials show the pair can be cleared (see the writes section), so the brief's premise that a construction exists holds.

2. **Item 3: `codeOf()` does not blank a JSDoc that ends a TypeScript or JavaScript file.** `bin/diagrams/code.mjs:43-58` skips every JSDoc node and relies on the next token's leading trivia. At the end of a file, the JSDoc is attached to `EndOfFileToken`. That token then has a child (the JSDoc), so it is never treated as a leaf, and the comment is never blanked.
   - Probe: `codeOf('a.ts', "const a = 1;\n/** hub.publish('x', y) */\n")` returns the text unchanged. A channel publish named there would be read as a call.
   - Real instance: `src/lib/data/model/model-entities.ts:673-679` (a trailing `/** ... */`). The old `uncomment()` blanked it; `codeOf()` keeps it.
   - The same probe in a `.svelte` script is blanked, because `tree.comments` covers it.
   - No case covers this. The fix is to treat a token as a leaf by its non-JSDoc children, or to take the leading comment ranges of `EndOfFileToken` explicitly.

3. **Every other difference between the old and the new blanking favours the new.** I compared the old `uncomment()` and `codeOf()` over all 563 source files. Outside style blocks there are 10 differing lines:
   - The 7 lines of `model-entities.ts:673-679` above, where the new blanking is wrong.
   - `lib/server/machine/hpc/actions.ts:53`, `lib/server/machine/hpc/prewarm.ts:18` and `routes/views.ts:37`, where the old pattern cut strings holding `/*` or `//` and the new one keeps them.
   - The channel and write edge sets are identical before and after.
   - Other probes behaved correctly: comments inside template `${}`, a regex with `\/\*`, type-literal comments, `{#if a /* c */}`, `{@const ... /* k */}`, an event-handler body comment, `<svelte:head><!-- --></svelte:head>`, `<script context="module">`, `lang="ts"`, a style block holding `'//'`, and markup text holding `//` (kept).
   - A shebang line is left as text (not a comment by the TypeScript scanner). This is harmless.

## 2. Proof

1. **`arrowsAlong()` does not cut pieces of at most 0.5 pt.** `labels.mjs:306-319` (`polyline()`) takes the piece count from the control-polygon length and samples evenly in t. Evenly spaced t does not give pieces of equal length, and the comment's reasoning (no piece is longer than the control polygon) bounds the total length, not each piece. Measured over the nine committed drawings: longest piece 1.499 pt; 60839 of 157566 pieces exceed 0.5 pt.
   - The report's sentence "cut along the exact Bezier into pieces of at most 0.5 pt" is therefore not reproduced.
   - With a count that does bound each piece (`ceil(3 * longest control leg / 0.5)`), the counts on all nine drawings, before and after, come out the same (scratch copy). The numbers stand; the claim and the comment at `labels.mjs:306-309` are false, and the code should be fixed to match the claim.

2. **Nothing tests the style-block blanking or the JSDoc skip in `codeOf()`.** Deleting `code.mjs:112` (the style block) or `code.mjs:44-46` (the JSDoc skip) turns no case red. Neither has a revert directive. The style-block blanking is a judgement call the report lists, but it is unproven.

3. The revert at `readable.test.ts:194` puts back only the block-comment half of the old `uncomment()`, not the whole function. It is red, and it exercises the probe. I accept it.

4. The grid lookup, the halves-as-one-arrow naming and the exclusion of arrowheads are correct as read (`labels.mjs:393-447`):
   - Heads are `<polygon>`s and are not read.
   - The midpoint cell is always among the cells a piece within 1.5 pt is filed under.

## 3. Standards

1. Two comments are false:
   - `bin/diagrams/code.mjs:31-32` says "A JSDoc node is passed over, since its comment is the trivia of the token after it". This is false at end of file (Spec 2).
   - `bin/diagrams/labels.mjs:306-307` says "pieces no longer than PIECE ... which no piece of the curve is longer than". This is false (Proof 1). The same claim is in `arrowsAlong()`'s doc at `labels.mjs:387-388` ("pieces of at most PIECE points").

2. `wordNode` is re-exported from `bin/diagrams/diagrams.mjs:47` and has no reader through that module; only `graphs.mjs` imports it, directly from `labels.mjs`. This is an unused export (YAGNI).

3. The other standards checks pass:
   - ASCII gate clean.
   - No added comment line past column 100 (awk over the added lines, revert directives aside).
   - Largest files: `diagrams.test.ts` 865 lines, `graphs.mjs` 489 lines.
   - Folder check exit 0.
   - No history found in the added comments.

## 4. Behaviour

1. The Help view's layer diagrams change shape. The report describes this in words, with sizes. Rasterised with `rsvg-convert`, these are what a reader sees that the report does not say:
   - **Counts stand near the tail, not on the path.** Each count between two folders sits one rank below its folder, near where the arrow leaves. In `layer-server` and `layer-state`, `server/root` and `state/client` put 7 and 9 counts in one row, then the arrows run long curves down to their targets. To learn which folder "6" reaches, the reader follows a long curve through a bundle. The five arrows from `server/root` and the others into `server/core` run as near-parallel strands down the right side, and seven arrows converge into `views/shared` in `layer-views`. They stay just outside 1.5 pt; the report mentions this under its limitations.
   - **The other layer's box is repeated per folder.** "data" appears 11 times in `layer-server` and 10 in `layer-state`; "state" and "ui" appear 9 times each in `layer-views`. A reader who has not read HELP.md may take these for separate nodes. HELP.md's new sentence explains it.
   - **The drawings are tall and narrow, with empty ranks.** Views is 289x1435 pt. The minlen gaps leave empty ranks between folders, since each folder with two outside layers takes two rows.
   - **One misreading risk.** The second dashed arrow of a folder bends down and then runs right, so its count stands below the folder, at the next folder's height in the column. In `layer-views` the "ui" count of one folder sits halfway to the next folder. It still reads correctly because the arrow is dashed.

2. **The channels diagram (178 pairs; the brief's test does not cover it) reads badly.** Rasterised:
   - About 20 arrows from the channel ellipses run as one trunk up the left edge of the `state` cluster and fan out at the end. A reader cannot trace which channel reaches which state module.
   - The `portfolio` arrows into `views` form a second dense fan.
   - This was already so at the base and is unchanged by this step. It is outside the brief (item 2 names the overview, the layer diagrams and the writes diagram), so it should be booked as its own step rather than left unmentioned.

## The writes pair: recommendation

**The measure should count this pair.** The brief's goal is that "each count reads as its own folder's and no two arrows run along each other". In the rasterised `writes.svg`, the arrows from `writes.ts` to `rail.ts`, `deck.ts`, `undo.ts` and `audit-mute.ts` leave the bottom of `writes.ts` as one bundle. The `rail` and `deck` arrows stay together for 74 pt before parting, so a reader cannot tell which strand ends at `rail.ts` and which at `deck.ts`. Arrows that share a start point and then run together are exactly the confusion the measure exists to find, so exempting pairs with a common start would loosen the check.

**A construction clears it.** One port on the one arrow, plus a wider rank separation, gives `arrowsAlong` `[]` and `labelsAcross` 0 on the writes diagram (1216x512 pt):
- `tailport=se` on `"lib/server/edit/writes.ts" -> "lib/server/edit/writes/deck.ts"`
- `ranksep=0.8`

Rasterised, `deck.ts`'s arrow leaves `writes.ts` separately, and the diagram reads as before. The builder's list has only uniform ports (`headport=w`, `tailport=e`, `c`), not a port on one arrow.

Other results from my trials:
- `tailport=s` on the rail arrow plus `se` on the deck arrow at `ranksep=0.8` also gives 0.
- `concentrate=true` gives 4 to 5.
- Placing `rail.ts` and `deck.ts` in `rank=same` gives 5 to 10.
- An invisible `rail -> deck` edge gives 6 to 13.
- General alternating-tailport rules over every module give 3 to 13 pairs and add 1 to 10 label crossings.

The per-arrow port is tied to today's layout, so the builder should make it a rule of `writesDot()`. For example: when two plain arrows from one module run along each other, give the later one a `se` tail port and lay the diagram out at `ranksep=0.8`, checked by `arrowsAlong()`. Then add the revert directive to `readable.test.ts:183`. I recommend this over changing the measure.

## Not checked

- The report's own construction table (the 56 spacing combinations, the `neato`/`fdp`/`ortho` runs).
- `layer-data`, `layer-ui` and `layer-shell` rasters were produced but only `layer-server`, `layer-state` and `layer-views` were viewed.
- Whether my writes construction keeps the committed drawing stable across `npm run diagrams` runs, since I did not change the code.
- The `lang` detection in `codeOf()` for forms other than `lang="ts"` / `lang='ts'` (for example `lang="typescript"`).

Reviewer usage: about 45 tool uses and about 40 minutes; tokens roughly 170k of context (not measured exactly).

## Repair round 1, refuted

All commands were run from `.agents/worktrees/Q74/tools/oculus`.

1. `npx vitest run --reporter=dot`: `Test Files  312 passed (312)`, `Tests  4899 passed (4899)`.
2. `npm run check`: `COMPLETED 1398 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build`: `build exit 0`.
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: `lint exit 0`.
6. `LC_ALL=C grep -rna '[^ -~]' src tests bin DESIGN.md HELP.md`: printed nothing (`grep exit 1`). The spec's perl ASCII gate also printed nothing.
7. `sh bin/size-check.sh`: `size 0`. `sh bin/folder-check.sh`: `folder 0`.
8. `npm run diagrams`, run twice with snapshots taken before and between: `run1=committed` and `run2=run1` (checked with `diff -r`). `node --no-experimental-strip-types bin/diagrams/diagrams.mjs` printed `node exit 0`, and a diff against the committed files gave `node=committed`. `git status --short` lists only the step's files and no untracked file.
9. `lsof -iTCP:8792 -sTCP:LISTEN` before the run: exit 1, so the port was free. `npm run build`: exit 0. `npx playwright test`: `1 failed [chrome] › tests/browser/sources/files.spec.ts:789:1 › a bookmarks read that failed is asked again by its own control, without a reload`, `385 passed (7.3m)`. Rerunning that one spec alone with `--repeat-each=3` gave `3 passed (6.2s)`. The step changes no browser spec and no `src` file (`git diff f90268dc --stat`), so I read this as a flake under full-suite load. It is still not a clean full run. Port free after the run (exit 1).
10. `node bin/revert-check.mjs tests/checks/diagrams/readable.test.ts tests/checks/diagrams/diagrams.test.ts`: `67 reverts, 0 unproven, 0 unchecked`. The tree was unchanged afterwards (`git diff --stat 9b366a25`: `24 files changed, 1150 insertions(+), 1003 deletions(-)`, the same as before).
11. Both measures over the nine drawings, by a scratch script that imports `arrowsAlong` and `labelsAcross` from the worktree. The base and wip copies were rebuilt by reverse-applying `git diff f90268dc|9b366a25 -- docs/diagrams` to scratch copies. Each cell is pairs/labels across.

| Drawing | Base f90268dc | Wip 9b366a25 | Now |
|---|---|---|---|
| layers | 0/0 | 0/0 | 0/0 |
| layer-data | 0/0 | 0/0 | 0/0 |
| layer-server | 28/0 | 0/0 | 0/0 |
| layer-state | 29/0 | 0/0 | 0/0 |
| layer-ui | 7/0 | 0/0 | 0/0 |
| layer-shell | 3/0 | 0/0 | 0/0 |
| layer-views | 41/0 | 0/0 | 0/0 |
| channels | 178/0 | 178/0 | 178/0 |
| writes | 1/0 | 1/0 | 0/0 |

The sizes and byte counts of the "Now" column match the reply's table exactly: layers 405x560 21962; data 160x603 12625; server 392x1027 50736; state 397x1027 53282; ui 252x827 30090; shell 224x769 22915; views 289x1412 42471; channels 509x1336 59381; writes 1216x512 40926.

12. `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before my runs and 7015 after.

Commands the reply quotes as evidence, rerun:
- The piece check, rerun with my own copy of the new `polyline()` count over every edge path. The claim of `over 0.5: 0 longest 0.5000` reproduces on the committed drawings (`pieces 244778 over 0.5: 0 longest 0.5000`), on wip (`257752 ... 0 ... 0.5000`) and on base (`358555 ... 0 ... 0.5000`). The reply's total of 263085 pieces matches none of the three sets.
- "The before drawings still count 28, 29, 7, 3 and 41 ... 178 ... 1": reproduced (the base column above, measured with the new cut).
- "The rule gives `tailport=se` to one arrow, `writes.ts -> writes/subtasks.ts` (`docs/diagrams/writes.dot:71`)": reproduced (`grep -n tailport`), and it is the only tail port in any `.dot`.
- The reviewer's JSDoc probe: `codeOf('a.ts', "const a = 1;\n/** hub.publish('x', y) */\n")` now gives `"const a = 1;\n" + 26 spaces + "\n"`. Reproduced.

### 1. Spec
- `DESIGN.md:176` says the write diagram is "drawn again until none does". That is false. `writesDrawn()` at `bin/diagrams/writes.mjs:462-481` returns as soon as the first pair's later arrow has tried all four ports. It can then leave that pair, and any other pair after it, unparted. The code's own comment (`writes.mjs:449-454`, "what it cannot part stays for the check to name") is accurate; the design sentence contradicts it.
- The round-1 items as sent: item 1 is closed by a rule rather than a one-off. Items 2, 3, 4 and 5 are closed. On item 6, the counts now sit halfway along their arrows, and the reply reports the look before and after.

### 2. Proof
- **`writesDrawn()`, `bin/diagrams/writes.mjs:462-481`.** The only case that proves it is the real-hub write case (`readable.test.ts`, revert `writes.mjs:428 => const tail = ''`). That case is red today only because today's source has a same-module pair.
  - No case over a synthetic source shows that two plain arrows of one module that run along each other get a port.
  - No case shows that the search stops once the ports are exhausted, or that a pair it cannot part is still named.
  - No case covers the choice of the later arrow, or the order of `PORTS`.
  - My scratch probe, a `draw` that always returns a fixed SVG holding a same-module pair `m->a`/`m->b`, shows the loop stops after 5 draws and returns the SVG with `m->a along m->b for 60` still in it. So it terminates and does not hide the pair, but no case holds this.
  - The spec's rule that a key a package introduces is exercised empty, duplicated and colliding is not met for the `ports` map (the `from->to` key).
- Is it a general rule or a redraw until the check passes? The search is driven by the check itself, but it only ever assigns ports to plain arrows from one module. Pairs between modules or labelled arrows are never touched and stay named. The trace on the real source is `draw 1 ... deck.ts along ... subtasks.ts for 73`, then `draw 2 ... [tailport=se` on subtasks `=> ` (empty), `draws 2 ms 656`. It is stable: two `npm run diagrams` runs are identical, and so is the node run.
- At `ranksep=0.8` with no ports, the pair is `deck` along `subtasks` for 73. It is no longer the reviewer's `deck`/`rail` pair (`writesDot(sources)` rendered in the probe). The rule parts it; this is not an error.
- The piece bound, `labels.mjs:303-318`. The argument holds: B'(t) is 3 times a convex combination of the legs, so its speed is at most 3 times the longest leg. The empirical check agrees (longest piece 0.5000 on all three sets). Only the reply's piece total of 263085 does not reproduce, and it carries no weight.
- The JSDoc fix, `code.mjs:28-31` and `:51-53`. A compare of the wip `codeOf()` against the current one over all 563 source files differs on 7 lines only: `src/lib/data/model/model-entities.ts:673-679`, now blanked as intended. Extra probes all behave:
  - blanked: a file that is only a JSDoc, with and without a final newline; JSDoc members in a class, including one before the closing brace; an inline `/** */` argument; a `.js` `@type` JSDoc at end of file; a trailing JSDoc in a `<script lang="ts">`;
  - style-block comments are blanked, and a `publish` in markup text is kept.
- The two new `code.mjs` cases:
  - `blank a JSDoc that ends a script` is red under `code.mjs:53 => if (children.length === 0) {`.
  - `read no trivia inside a JSDoc` is red under `code.mjs:51 => delete`.
  - The style-block case is red under `code.mjs:117 => delete`.
  - All three are confirmed by the revert-check run: 0 unproven.
- The tail-port stripping in `renderSvg()`, `diagrams.mjs:119`: the case `names the two modules alone` is red under its revert (revert-check). The regex strips a tail port only, which covers every port the tree writes: `grep tailport` finds one, and no `headport` is written.

### 3. Standards
- `bin/diagrams/diagrams.mjs:49` re-exports `writesDrawn`. Nothing reads it through that module: `diagrams.mjs:35` imports it directly from `./writes.mjs`. The test import lists (`diagrams.test.ts:21-39`, `readable.test.ts:18-27`) do not name it, and `grep -rn writesDrawn src tests config` finds nothing. This is the same unused re-export (YAGNI) that round item 5 removed for `wordNode`.
- Otherwise clean:
  - ASCII gate clean.
  - `grep -rn 'writesDrawn\|wordNode'` over `src tests config HELP.md DESIGN.md README.md bin` shows no stale reference.
  - No history in the added comments.
  - The files with the most lines stay under 900: `diagrams.test.ts` 865, `graphs.mjs` 511, `writes.mjs` 513.

### 4. Behaviour
- The halfway counts, rasterised with `rsvg-convert` (all six layer diagrams, plus a 3x crop of `layer-views` and wip `layer-server` for comparison):
  - Each count stands in a gap of its own arrow's line, since the arrow is drawn in two halves through the word node. I found no count that reads as a neighbour's.
  - The tightest spots are `17`/`16` side by side in `layer-views` (feeds and boards into `views/shared`), and `8`, the sessions arrow, running beside the feeds strand. At 3x each number clearly breaks its own line.
  - The bank of 7 counts under `server/root` at wip is gone: its counts now sit at 1, 5, 5, 6, 4, 7 and 8 down their arrows.
  - What remains: 7 strands still converge into `server/core` and 7 into `state/shared`; the other layer's box is still repeated per folder; the drawings are tall (views 289x1412 pt), with a free rank under every folder, including an empty rank in `layer-data` under `data/helpers`. All of this is reported in the reply.
- `writes.svg` rasterised: the strands from `writes.ts` to `deck.ts`, `rail.ts` and `subtasks.ts` leave and part visibly, and no label crosses an arrow. The arrows into `rail.ts` from `writes.ts` and `undo.ts` approach it close together over the last stretch, below the 1.5 pt measure. The "not placed" box text is clipped at `SIGNATURE.test(`, which is unchanged from base.
- Outside the step, not caused by it: `src/lib/data/model/model-entities.ts:673-679` is a doc comment at the end of the file with no declaration after it (an orphan JSDoc, `wc -l` 679).

### Not checked
- Whether `writesDrawn()` still clears the pair when `RANKSEP` is 0.5, or when a different arrow of the pair takes the port.
- The `lang` forms other than `ts` in `codeOf()`.
- The channels diagram's 178 pairs, which are outside the brief and unchanged.
- The Help view on the TEST page.

Reviewer usage: about 40 tool uses and about 25 minutes of wall time, most of it the vitest (105 s) and playwright (7.3 min) runs. Tokens not measured, roughly 150k of context.

## Closed

The first run's findings, closed in repair round 1 (`agents/reviews/Q74-round1-sent.md`, the reply in `agents/reviews/Q74-report.md`): the writes pair parted by a rule of the write drawing (`writesDrawn()`), its case green and red under its revert; the JSDoc that ends a script blanked, with a case; cases for the style block and the JSDoc skip; each piece of `arrowsAlong()` at most 0.5 pt, the counts unchanged; the unused `wordNode` re-export dropped; the counts standing halfway along their arrows. The channels diagram's 178 pairs are booked as Q75.

The run over round 1, fixed at landing on 2026-09-25 (small, inside the brief):
- Spec, `DESIGN.md:176` saying the write diagram is drawn again "until none does": made to say what `writesDrawn()` does, a pair it cannot part left for the check to name.
- Proof, `writesDrawn()` held only by the real hub's pair: cases over a stubbed drawing, one where a same-module pair takes a tail port and parts, one where the ports run out and the pair is still named after five draws.
- Standards, the `writesDrawn` re-export at `bin/diagrams/diagrams.mjs:49` with no reader: the two new cases import it through `diagrams.mjs`, as the other readable cases import their functions, so it now has a reader.
- Found by the reviewer outside the step: the doc comment of `Entry` stranded at the end of `src/lib/data/model/model-entities.ts:673-679`, while `Entry` is declared in `model-collections.ts`: moved above the declaration.

Noted, no change: the browser case `files.spec.ts:789` failed once in the reviewer's full run and passed three of three alone, with no `src` or browser file changed by the step; the landing's full run on main is its check. The reply's piece total (263,085) matched none of the reviewer's three sets, which bear the claim out regardless.
