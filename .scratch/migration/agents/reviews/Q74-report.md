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
