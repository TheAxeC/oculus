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
