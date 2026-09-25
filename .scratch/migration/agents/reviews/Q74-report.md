NOT DONE: the write diagram still has one pair of arrows that run along each other (`lib/server/edit/writes.ts->.../writes/deck.ts` along `lib/server/edit/writes.ts->.../writes/rail.ts` for 74 pt). The new case that holds the write diagram to none is red, and I did not exempt it. So verification item 1 fails on that one case, and item 10 reports that case as "unchecked". The constructions I tried are listed below. Everything else in the brief is done.

**Open items in the state file:** none at this brief's writing. I did not re-read `orchestrator-state.md`.

## DONE / NOT DONE

| # | Check | Result |
|---|---|---|
| 1 | `npx vitest run --reporter=dot` | **NOT DONE.** `Test Files 1 failed \| 311 passed (312)`, `Tests 1 failed \| 4893 passed (4894)`. The one failure is `readable.test.ts > the drawings the source gives > have no two arrows running along each other in the write diagram`. |
| 2 | `npm run check` | `COMPLETED 1398 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | `npm run build` | exit 0 |
| 4 | `npm run format:check` | `All matched files use Prettier code style!` |
| 5 | `npm run lint` | exit 0 |
| 6 | `LC_ALL=C grep -rna '[^ -~]' src tests bin DESIGN.md HELP.md` | printed nothing |
| 7 | `sh bin/size-check.sh`, `sh bin/folder-check.sh` | both exit 0 |
| 8 | `npm run diagrams` twice, then `md5 -q docs/diagrams/*` compared | identical ("diagrams stable"); `node --no-experimental-strip-types bin/diagrams/diagrams.mjs` exit 0 |
| 9 | `npm run build`, then `npx playwright test` | `386 passed (6.2m)`. Port 8792 was free before and after (`lsof` exit 1). |
| 10 | `node bin/revert-check.mjs tests/checks/diagrams/readable.test.ts` | `11 reverts, 0 unproven, 1 unchecked`. The unchecked one is the red write case: it has no revert, because it is red today. |
| 10 | `node bin/revert-check.mjs readable.test.ts diagrams.test.ts` | Every directive of `diagrams.test.ts` printed `red`. That run's 3 unproven lines were all `readable.test.ts` directives naming `code.mjs` lines that had moved. I corrected them, and the rerun above shows 0 unproven. |
| 11 | Both measures on all nine drawings, before and after | see "Measures" below |
| 12 | `ls -d $TMPDIR/oculus-* \| wc -l` | 7015 before, 7016 after. The extra folder is `oculus-career-ObSvqv`, made at 17:29:18 (`ls -ldT`). My first test run started at 17:36:17, so it does not look like mine, but I have not verified where it came from. |

## Item 1: a count between two folders sits inside the layer's box

- `bin/diagrams/graphs.mjs:249` declares the words node of every arrow of a layer inside the layer's cluster (`inside.push(node.line)`).
- Each arrow between two folders gets `minlen=<rows of its folder>, weight=10` on its first half (`:251`). Its words therefore land on a rank of their own, below the folder's rows (the folder chain at `:264-270` uses `minlen=rows+1`).
- `labels.mjs` now exports `wordNode()` (`:24`) and `halves()` (`:46`). `labelledEdge()` (`:82-85`) is built from the two, and its output is unchanged: the overview's `.dot` file is byte-identical.
- **Case:** `readable.test.ts` "draws a count between two folders, and its arrow, inside the layer box". It renders a small layer and checks that the words node and both halves lie inside the cluster's polygon. It turns red under `graphs.mjs:249 => boxes.push(...)`.

## Item 2: counts into another layer

**Construction** (`layerDot()`, `graphs.mjs:223-273`):
- Each arrow from a folder into another layer ends at a dashed box of that layer drawn for that folder alone (`"layer data from folder server/edit"`, `:255-256`).
- The first such arrow sits on the folder's own rank. It shares a `rank=same` with the folder, its count and its box (`:259-260`). Each further arrow goes one rank lower (`minlen=row, weight=10`).
- The count is declared inside the layer's box, beside the folder.
- No box collects arrows from two folders, so nothing converges.

**Measure:** `arrowsAlong(svg)` at `labels.mjs:~310-445`.
- Each curve is cut along the exact Bezier into pieces of at most 0.5 pt.
- A piece counts when its middle lies within 1.5 pt of the other arrow's line. The longer of the two directions is kept, and a pair is named when it passes 40 pt.
- Two halves through one words node count as one arrow. Arrowheads are left out.
- A grid of 4 pt cells keeps it fast: the largest drawing takes 148 ms.
- On the committed drawings from before this step it gives server 28, state 29, views 41, ui 7, shell 3, overview 0, writes 1. The reviewer's counts were 27, 30, 41, 7, 3, 0, 1.

**Cases:**
- "ends each folder arrow into another layer at a box of its own, the count on its row". Red under `graphs.mjs:255 => const box = to;` and under `:259 => const same = [node.id, box];`.
- "names two arrows that run within 1.5 pt of each other for more than 40 pt". Red under `labels.mjs:438 => if (false) {`.
- "takes the two halves through a node of words as one arrow". Red under `labels.mjs:404 => const name = title;`.
- "have no two arrows running along each other in the overview and the layer diagrams", over the generated and the committed drawings. Red under `graphs.mjs:255`.
- "... in the write diagram". **Red today.**

**Constructions tried on the write diagram, none of which reached 0 pairs** (pairs, words-across-arrow count):

| Construction | Result |
|---|---|
| Committed layout | 1, 0 |
| `nodesep` 0.15 to 0.5 by `ranksep` 0.4 to 1.2 (56 combinations) | 1 to 8 pairs, 0 crossings |
| `newrank=true`, alone and with spacings | 9 to 24 |
| `rankdir` TB, BT, RL | 11, 11, 1 |
| `clusterrank=none` / `global` | 2 |
| `ordering`, `remincross`, `mclimit`, `searchsize`, `nslimit`, `esep` | 1 each |
| `splines=polyline` / `curved` / `line` | 2 / 4 / 5 |
| `splines=ortho` | 0 at 1.5 pt, but 7 at 3 pt and 16 at 5 pt against the curved layout's 4 and 12. It passes the measure by laying lines about 4 pt apart for long runs, so I did not take it. |
| `neato` with `splines=true` | 0 pairs, but it ignores the folder clusters and nodes overlap; unreadable |
| `fdp` | 10 to 12 |
| Plain arrows through an empty words node or a point waypoint, including weighted halves | 18 to 30 |
| Every call list shown as words | 24 |
| `minlen` 2 or 3 on plain arrows | 5 / 3 |
| Plain arrows given weight 0 / 2 / 3 / 5 | 14 / 2 / 2 / 2 |
| Ports `headport=w` / `tailport=e` / `c` | 3 / 10 / 1 |
| One HTML table port per outgoing arrow on the dispatcher | 1 |
| Same on every module | 6 |
| Cluster `margin` 4 / 12 / 16 / 24 | 2 / 1 / 3 / 4 |
| `lib/server/edit/writes` nested inside `lib/server/edit` | 3 |

The pair comes from two arrows that leave `writes.ts` at the same point and head for neighbouring modules (`rail.ts`, `deck.ts`) far below, through the one gap in the cluster. This is a decision for you: accept a writes-specific construction I have not found, or change what the write case asks for. I have not loosened the measure.

## Item 3: the channel and write readers read code only

**New `bin/diagrams/code.mjs`** (117 lines), `codeOf(name, text)`:
- **Scripts:** a TypeScript parse through `parsed()`, which `imports.mjs` now exports. For every token it blanks the comments `ts.getLeadingCommentRanges(code, node.pos)` and `ts.getTrailingCommentRanges(code, node.end)` return. JSDoc nodes are skipped.
- **Components:** a svelte parse through `component()`, now exported from `imports.mjs`. It blanks:
  - the script comments, by the same TypeScript walk;
  - `tree.comments`, which are the comments inside markup expressions;
  - every `Comment` node, which are the HTML comments;
  - the style block's content.
- The markup is kept. Line breaks are kept, so offsets and line numbers do not move.
- `uncomment()` is removed from `source.mjs`. Both readers call `codeOf()`: `graphs.mjs:430` and `writes.mjs:172`. `diagrams.mjs` exports `codeOf`, `arrowsAlong`, `halves` and `wordNode`.

**The two probes of fact 3:**
- `const s = '/*'; hub.publish('a', x); const t = '*/';` gives the edge `"server/watch/w" -> "ch a"` (case "read a call between two strings that hold the marks of a comment"). Red under `graphs.mjs:430 =>` the old block-comment pattern.
- `const r = /[//]/; writeFileSync(...)` is followed to the disk (case "read a call after a regular expression that holds two slashes"). Red under `writes.mjs:172 =>` the old `//` pattern.
- On the probes, the old code blanked the `publish` call and cut `/[//]/` down to `/[`.

**Two more cases:**
- "blank the comments of a component and keep its markup". Red under `code.mjs:110` (markup expression comments) and `:111` (HTML comments).
- "blank the comments of a script and keep its strings and regular expressions". Red under `code.mjs:95`.

**Channel and write diagrams:** unchanged. `cmp` shows `channels.dot`, `channels.svg`, `writes.dot` and `writes.svg` equal to the files from before this step, so there was no change to quote.

## Item 4: documents

- `DESIGN.md` (the diagrams paragraph near line 172) now says what a layer diagram draws, names the new check and its thresholds, and says how the channel and write readers blank comments.
- `HELP.md` (the "Each layer on its own" paragraph and the paragraph on how imports are read) says the same in reader terms.
- Head comments of `source.mjs`, `calls.mjs` and the `writes.mjs` typedef now name `codeOf()`.
- `grep -rn uncomment src tests bin config DESIGN.md HELP.md README.md` prints nothing.

## Measures (both measures run over each file; sizes in pt and bytes)

| Drawing | Before: along / across | Before: size | After: along / across | After: size |
|---|---|---|---|---|
| layers | 0 / 0 | 405x560, 21962 | 0 / 0 | 405x560, 21962 |
| layer-data | 0 / 0 | 225x517, 12605 | 0 / 0 | 160x603, 12568 |
| layer-server | 28 / 0 | 893x773, 48716 | 0 / 0 | 388x1027, 50870 |
| layer-state | 29 / 0 | 832x823, 50086 | 0 / 0 | 392x1027, 53072 |
| layer-ui | 7 / 0 | 664x806, 29303 | 0 / 0 | 252x827, 29968 |
| layer-shell | 3 / 0 | 545x385, 20023 | 0 / 0 | 224x757, 22928 |
| layer-views | 41 / 0 | 1011x621, 36526 | 0 / 0 | 289x1435, 42296 |
| channels | 178 / 0 | 509x1336, 59381 | 178 / 0 | unchanged |
| writes | 1 / 0 | 1062x513, 41280 | 1 / 0 | unchanged |

The channel diagram carries 178 pairs. The brief's test does not cover it, and I left it as it is.

## What changes on the Help view (look at every layer diagram)

**Before:** the counts on arrows between folders stood outside the layer's box, and each such arrow left the box and came back. The counts of the arrows into other layers sat in one row beside a single dashed box per other layer, and the arrows into that box ran over one another.

**After:**
- Each layer's box is a narrow column of its folders.
- Every count between two folders is inside the box, on its own rank between folder rows.
- To the right of each folder is a short horizontal dashed arrow, with its count inside the box, to a small dashed box named for the other layer ("data", "state", "ui"). A folder reaching two layers has a second arrow one row lower, going down to it from the folder.
- The drawings are narrower and taller; views is now 289x1435 pt.
- I looked at shell, server, views and state rasterised with `rsvg-convert`.

## Files and line counts

- New: `bin/diagrams/code.mjs` 117, `tests/checks/diagrams/readable.test.ts` 246.
- Changed: `bin/diagrams/graphs.mjs` 489, `labels.mjs` 445, `source.mjs` 176, `writes.mjs` 463, `imports.mjs` 351 (only `parsed` and `component` exported), `calls.mjs` 175 (head comment only), `diagrams.mjs` 184.
- Changed: `tests/checks/diagrams/diagrams.test.ts` 865. Its layer case now asserts the new lines, and its revert directives were moved to their new line numbers.
- Changed: `DESIGN.md` 317, `HELP.md` 240.
- Regenerated: the twelve `docs/diagrams/layer-*.dot` and `.svg` files.
- `find -newer` over the tree lists only these files outside `docs/diagrams`.

## Judgement calls (each reversible)

1. **Measure details:** the longer direction is kept, heads are left out, and the two halves through one words node are one arrow.
2. **Duplicated layer boxes:** a layer diagram draws one dashed box per folder and layer pair, so "state" appears once per folder that reaches it.
3. **Style block:** `codeOf()` blanks a component's whole style block. No reader looks for a call in CSS, and the old pattern only blanked `/* */` there.
4. **New file for the tests:** the new cases went into `readable.test.ts`, because adding them to `diagrams.test.ts` (848 lines) would have taken it past 900.
5. **Committed drawings:** the committed-drawing checks read the files and also the drawings `generate()` gives, so the revert of a construction line turns them red.

## Limitations

- **Taller drawings:** the layer diagrams are about 1.3 to 2.3 times as tall as before (views 1435 pt).
- **Close but under the measure:** arrows converging on `views/shared` and `server/core` run close together without dropping under 1.5 pt, so the measure does not name them. At 3 pt, `layer-state` has 3 pairs.
- **The red case has no revert:** it will need a revert directive once it passes.

## Repair round 1, the builder's reply

Everything in the round is done. The node suite is fully green and the write diagram now has no pair of arrows running along each other.

## Per item

**1. Write diagram: the pair is cleared by a rule in the write drawing.**
- `writesDrawn(sources, draw, route)` at `bin/diagrams/writes.mjs:~437-500` draws the diagram and runs `arrowsAlong()` over it. While that names two plain arrows from one module, the later arrow of the pair (by name) gets the next tail port from `PORTS = ['se', 's', 'ne', 'n']` and the diagram is drawn again. It stops when no such pair is left or that arrow has tried every port, so anything it cannot part stays for the check to name.
- `writesDot()` takes a `ports` map (`from->to`) and writes `tailport=` on those plain arrows (`writes.mjs:427-429`).
- The write diagram is laid out at `RANKSEP = 0.8`. `header()` in `source.mjs:~150-162` has a new `ranksep` argument whose default of 0.5 keeps every other diagram's text as it was.
- `generate()` draws the write diagram through `writesDrawn()` (`diagrams.mjs:~140-147`).
- Graphviz writes the port into the edge title (`a:se->b`). `renderSvg()` now strips it (`diagrams.mjs:119`), so the hover title still names the two modules only.
- Today the rule gives `tailport=se` to one arrow, `writes.ts -> writes/subtasks.ts` (`docs/diagrams/writes.dot:71`). The write diagram measures 0 pairs and 0 labels across, at 1216x512 pt; I looked at it rasterised.
- **Cases:** the write case in `readable.test.ts` is green and now carries `// revert: bin/diagrams/writes.mjs:428 => const tail = '';`, which turns it red. A new case, "names the two modules alone", checks the port stripping and is red under `diagrams.mjs:119 => delete`.

**2. A JSDoc that ends a script is now blanked.**
- `code.mjs:~42-44` adds `isJSDoc()`. Line 51 skips JSDoc nodes, and line 53 treats a token as a leaf when every child it has is a JSDoc node (`children.every(isJSDoc)`). The end-of-file token is therefore a leaf, and its leading JSDoc is blanked.
- The comment at `code.mjs:34-39` is corrected to say this.
- The reviewer's probe, `"const a = 1;\n/** hub.publish('x', y) */\n"`, now comes back as the code line plus 26 spaces. It is the case "blank a JSDoc that ends a script", red under `code.mjs:53 => if (children.length === 0) {`.

**3. Cases for the style-block blanking and the JSDoc skip.**
- "blank the style block of a component" is red under `code.mjs:117 => delete`.
- "read no trivia inside a JSDoc, so the code after it on its line is kept" uses the probe `/** @param x // */ hub.publish('a', 1);`. Without the skip, the trailing-comment scan from inside the JSDoc blanks the publish call. It is red under `code.mjs:51 => delete`.

**4. Each piece of a curve is now at most 0.5 pt.**
- `polyline()` at `labels.mjs:~302-318` now uses `ceil(3 * longest control leg / PIECE)` pieces, since the curve's speed is at most three times its longest leg. The comments there and in `arrowsAlong()`'s doc (`labels.mjs:~386-388`) say this.
- **Check:** a scratch copy of `polyline()` run over every path of the nine drawings gives `pieces 263085 over 0.5: 0 longest 0.5000`.
- **Measures:** the before drawings still count 28, 29, 7, 3 and 41 pairs for server, state, ui, shell and views, 178 for channels and 1 for writes, the same as with the old cut.

**5.** The `wordNode` re-export is removed from `bin/diagrams/diagrams.mjs:47`. The line is now `export { arrowsAlong, halves, labelledEdge, labelsAcross } from './labels.mjs';`.

**6. Layer diagram look, and the counts moved to the middle of their arrows.**
- **Before this round:** each count between two folders stood one rank below its own folder. `server/root` and `state/client` had 7 and 9 counts in one row, and the arrows then ran long curves to their targets.
- **Can a count sit nearer the middle without breaking the measures:** yes, and it is done. `layerDot()` works out each folder's start rank (`graphs.mjs:~243-262`). `drop()` puts the count on the free rank under the middle folder row of the rows the arrow spans; where two rows are equally near the middle, it takes the upper one. The first half of the arrow gets `minlen=drop, weight=10` (`graphs.mjs:~273`).
- **What you see now** (`layer-server` and `layer-views` rasterised):
  - The counts of long arrows stand partway down their arrows. In `layer-server`, the `server/root -> server/core` count "7" is beside `server/files`, and the "8" to `server/sessions` is at the height of `server/edit`. The top row no longer holds a bank of counts.
  - Short arrows keep their count just under the folder.
- **What stays the same:** the layer box of another layer is still repeated per folder ("data" 11 times in `layer-server`). The drawings stay tall and narrow, with a free rank under each folder and one rank per arrow out of the layer: views is 289x1412 pt, server 392x1027 pt. The strands into `views/shared` and `server/core` still converge; they stay outside the 1.5 pt measure.
- **Case:** "stands halfway along its arrow, under the folder row between its ends" uses four folders, with a importing d, and the count lies between b and c. It is red under `graphs.mjs:262 => const below = from;`.
- **Measures after the round:**

| Drawing | Pairs / labels across | Size (pt) | Bytes |
|---|---|---|---|
| layers | 0/0 | 405x560 | 21962 |
| layer-data | 0/0 | 160x603 | 12625 |
| layer-server | 0/0 | 392x1027 | 50736 |
| layer-state | 0/0 | 397x1027 | 53282 |
| layer-ui | 0/0 | 252x827 | 30090 |
| layer-shell | 0/0 | 224x769 | 22915 |
| layer-views | 0/0 | 289x1412 | 42471 |
| channels | 178/0 | 509x1336 | 59381 (unchanged) |
| writes | 0/0 | 1216x512 | 40926 |

**Documents:** `DESIGN.md` says the count stands halfway between its two folders and describes the write diagram's port rule (`writesDrawn()`). `HELP.md` says the same in plain words: the count sits halfway between the two folders, and two arrows that would leave one module together leave from different sides.

**Revert lines:** the revert directives in `diagrams.test.ts` and `readable.test.ts` were moved to the lines' new numbers. `revert-check` below proves every one.

## Verification (verbatim)

1. `npx vitest run --reporter=dot`: `Test Files  312 passed (312)`, `Tests  4899 passed (4899)`
2. `npm run check`: `COMPLETED 1398 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
3. `npm run build`: `build exit 0`
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: exit 0
6. `LC_ALL=C grep -rna '[^ -~]' src tests bin DESIGN.md HELP.md`: printed nothing (exit 1)
7. `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0.
8. `npm run diagrams` twice: `two runs identical`. `node --no-experimental-strip-types bin/diagrams/diagrams.mjs`: `node exit 0`, files `unchanged after node run`.
9. `lsof -iTCP:8792 -sTCP:LISTEN` before: exit 1 (free). `npm run build`: exit 0. `npx playwright test`: `386 passed (7.7m)`. Port free after (exit 1).
10. `node bin/revert-check.mjs tests/checks/diagrams/readable.test.ts tests/checks/diagrams/diagrams.test.ts`: `67 reverts, 0 unproven, 0 unchecked`
11. Measures: see the table above.
12. `ls -d $TMPDIR/oculus-* | wc -l`: 7015 at the start of the round's runs, 7015 after.

No process I started is still running.

## Files changed in the round (line counts)

| File | Lines |
|---|---|
| `bin/diagrams/writes.mjs` | 513 |
| `bin/diagrams/source.mjs` | 183 |
| `bin/diagrams/diagrams.mjs` | 189 |
| `bin/diagrams/code.mjs` | 122 |
| `bin/diagrams/labels.mjs` | 448 |
| `bin/diagrams/graphs.mjs` | 511 |
| `tests/checks/diagrams/readable.test.ts` | 301 |
| `tests/checks/diagrams/diagrams.test.ts` | 865 (revert line numbers only) |
| `DESIGN.md` | 317 |
| `HELP.md` | 240 |

Also regenerated: the `docs/diagrams/layer-*.dot` and `.svg` files and `writes.dot` / `writes.svg`.

## Judgement calls (reversible)

- **Which arrow gets the port:** the later arrow of a pair by name, not the earlier one. Both clear today's pair.
- **Port order:** `se`, `s`, `ne`, `n`.
- **Write spacing:** `ranksep=0.8` applies to the write diagram only.
- **Middle count on an even split:** where two free ranks are equally near the middle, the count takes the upper one.
- **Port in hover titles:** the tail port is stripped from every edge title, so hover text is unchanged.

The channel diagram's 178 pairs are unchanged and outside the brief. The reviewer recommends booking it as its own step.
