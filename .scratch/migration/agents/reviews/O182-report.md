# O182 report: every tree indents as the Files view

Everything in the brief is done.

## DONE / NOT DONE

| Item | State | Proof (command, output as printed) |
| --- | --- | --- |
| 1. The two measures are tokens in `tokens.css` beside `--tree-indent`, with their comment; TreeItem reads them with no fallback; the guide comment and the comment at the head of TreeItem's style block say what is true | DONE | `grep -n -E 'tree-guide' src/lib/themes/tokens.css` prints `221:    --tree-guide-gap: 0px;` and `222:    --tree-guide-shift: calc(var(--icon-box) / 2);`; gate 2 below prints nothing |
| 2. `Tree.svelte`'s `.rows` sets neither measure, keeps `--tree-end-inset`, its comment says what it sets | DONE | name grep (gate 3) has no hit in `Tree.svelte` |
| 3. The three Graph paddings take the level formula; `ChangesRepo.svelte` reads the gap with no fallback; their comments say what is true | DONE | gate 3 hits `CommitFiles.svelte:251`, `GraphHead.svelte:80`, `CommitRow.svelte:240`: `padding-left: calc(var(--tree-indent) * var(--text-scale, 1) + 2 * var(--tree-guide-gap));` and `ChangesRepo.svelte:140` with `2 * var(--tree-guide-gap)` |
| 4. Session and terminal rows lose the 2px border; the amber mark takes no width, sits at the left edge, 2px wide, over the tint; the TerminalRows comment says what is true | DONE | `SessionWorkspace.svelte:245` `.row.input::after` (absolute, `inset: 0 auto 0 0`, `width: 2px`); no `border-left` left in either file (`grep -n border-left src/lib/views/sessions/session-list/*.svelte` prints nothing) |
| 5. `TreeItem.svelte` and `Tree.svelte` split to 520 or under, into `ui/tree/row/Guides.svelte` and `explorer/tree/control/tree-props.ts`, each with a head comment; the head comments of both components name where the moved part lives | DONE | gate 5 below |
| Gate 1: `npm run diagrams`, then `npm run test:quick` once with `TMPDIR` unset | DONE | diagrams wrote no tracked change (`git status --short` lists only the 11 step files); last lines of test:quick: `test:quick: 147.8 s; every command passed` (prettier, ASCII gate, svelte-kit sync, eslint, svelte-check `0 ERRORS 0 WARNINGS`, vitest checks over 12 files) |
| Gate 2: `grep -rn -E "tree-guide-(gap\|shift), " src` | DONE | prints nothing, exit 1 |
| Gate 3: the name grep | DONE | 15 hits, each judged below |
| Gate 4: `sh utils/unused-exports.sh` against `../O182-base/unused-exports.txt` | DONE | first line `Unused exports (226)`; `diff` of the two prints nothing, exit 0 |
| Gate 5: `wc -l` | DONE | `520 src/lib/ui/tree/TreeItem.svelte`, `463 src/lib/views/shared/explorer/tree/Tree.svelte` |
| Gate 6: the ASCII check of `spec.md` over the 11 changed files | DONE | prints nothing, exit 0 |

The list ran once (`npm run test:quick`); no whole-suite command was run. The step adds and changes no test.

Gate 3, each hit (`grep -rn -E "tree-guide-gap|tree-guide-shift|tree-indent" src tests config docs README.md --exclude=local.yml`):

- `tokens.css:214`, `:221`, `:222`: the tokens themselves.
- `TreeItem.svelte:260` (comment naming the two tokens), `:272` (`--row-least`, fallback removed): carried.
- `row/Guides.svelte:26`, `:30`, `:33`, `:34`, `:36`: the moved guide rule, fallbacks removed: carried.
- `CommitFiles.svelte:251`, `GraphHead.svelte:80`, `CommitRow.svelte:240`, `ChangesRepo.svelte:140`: carried (item 3).
- `TimelineTurns.svelte:190`: left as it is, as the brief says (no tree row; it pads by one level after the change).
- No hit in `tests`, `config`, `docs` or `README.md`.

History-word grep over the lines the step added (the added lines of `git diff -U0 -- src` and the two new files, grepped for `before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands`): one hit, `Guides.svelte:25` "The gap before a guide", which is the place on the line and not time. No test title was added.

## Open items of the state file, verbatim

`## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)` is followed by empty lines and then: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own." (`.scratch/migration/orchestrator-state.md:199-207`). The list holds no entry.

## The cases, first run on the unchanged tree

Read from the CSS of the base copy. A row's line starts 2px in (`.main` padding-left 2px); between the line's parts is a 4px gap; a guide is a flex item of width `--tree-indent * s`, margin-left `g`, margin-right `g - 4px`, so one level is `8s + 2g`. A guide's line sits at `2 + k*(8s+2g) + g + shift*s` for level k; the twistie of the row at depth k spans `2 + k*(8s+2g)` to that plus `16s`. Default today `g = 4px`, shift 0; the Files tree sets `g = 0`, shift 8px.

- Files tree: level `8 + 0 = 8px`; guide k at `2 + 8k + 8 = 10 + 8k`, the centre of the depth-k twistie (`2 + 8k` + 8). Holds.
- Sessions list: the depth-0 row is the TreeSection head (twistie at 2). A session row at depth 2 sits in `.row` with a 2px border: twistie at `2 + 2 + 2*16 = 36`, 34px in, against 32px for a depth-2 row of a 16px tree and 16px for the Files tree. Its guides at `2 + 2 + 16k + 4 = 8 + 16k`, the parent twisties' centres at `10 + 16k`: 2px left of the centre. A terminal row is at the same 34px. Does not yet hold (the case is what the step builds).
- Sessions list, waiting for input: the amber 2px border on `.row` is outside the TreeItem's tint, so it shows on hover and selection, and the transparent border is always there, so the text does not move. Holds, at the cost of the 2px offset above.
- Outline: depth-1 twistie at `2 + 16 = 18`, 16px in from a depth-0 row's at 2. A leaf symbol keeps its slot (`--tree-leaf-twisty` is set only on `Tree.svelte`'s `.arrowless`, `grep -rn tree-leaf-twisty src`). The 8px does not yet hold.
- Graph: commit row padding `4 + 8 = 12px`, TreeItem at depth 0, so its twistie at `12 + lanes + 2 = 14 + lanes`, against 18 for a depth-1 row: 4px short. The graph head stands 12px in, against a 16px level. A commit's file row (padding 12, depth 1) has its twistie at `12 + lanes + 2 + 16`: 16px under its commit. Does not yet hold.
- Sessions sidebar Changes: inset `2*(8 + 8) + 16 + 6 = 54px`; a group row at depth 2 (`ChangesRepo` hands `depth={2}` to GroupList, whose group head draws no icon) has its words at `2 + 2*16 + 16 + 4 = 54`. Lines up today at 54; the 38 does not yet hold.
- Text scale 1.25: level `10 + 8 = 18px`, shift 0 outside the Files tree (10 inside it), Graph paddings `4 + 10 = 14px`, ChangesRepo inset `2*18 + 20 + 6 = 62px`. Does not yet hold.
- Row narrowed by its pane: `--row-least` = `d*(8s + 8) + 2*(16s + 4) + 4ch + 6px` outside the Files tree. Does not yet hold.

No case is one the brief's rules get wrong. One premise sentence is wrong as written (see the last section); it does not change what is built.

## Each case after the change, with the widths computed

Now `g = 0` and shift `8px` everywhere from `:root`, so a level is `8s` and guide k sits at `2 + 8ks + 8s`, the centre of the depth-k twistie (`2 + 8ks` + `16s/2`). Proof of every row is the look at landing.

- Files tree: unchanged, 8px a level, guide k at `10 + 8k`, the parent twistie's centre. Look: Files view, a folder open two levels deep, pointer over the tree; the rows and guides stand exactly where they stood.
- Sessions list: session row at depth 2 has its twistie slot at `2 + 16 = 18`, 16px in from the head's at 2, as a depth-2 Files row; guides at `10` and `18`, the centres of the head's twistie (2 to 18) and the group row's (10 to 26); a terminal row starts at the same edge (no border on either). Look: Sessions view, a workspace group and the Terminals group open, pointer over the list; the session and terminal rows start 8px a level, the guides run down the twistie centres.
- Sessions list, waiting for input: `.row.input::after` is a 2px absolute bar from top to bottom at `.row`'s left edge, painted after the TreeItem in the same stacking context, so over the `.item` background of hover (`--chip`) and selection (`--accent-bg`); it is out of flow, so the row's parts do not move when the class comes and goes. Look: a session waiting for input, the row at rest, hovered and selected; the amber bar shows at the left edge each time, and the title does not shift when the session leaves the input state.
- Outline: depth-1 twistie at `2 + 8 = 10`, 8px in from a depth-0 row's, as a depth-1 folder row of the Files tree; a leaf symbol keeps its empty 16px twistie slot (nothing sets `--tree-leaf-twisty` there). Look: Files view, Outline section of a file with nested symbols.
- Graph: commit row padding `8 + 0 = 8px`, twistie at `8 + lanes + 2 = 10 + lanes`, where a depth-1 row's twistie (10) sits, moved right by the lanes; graph head 8px in, one level from the section head; a commit's file row (padding 8, depth 1) has its twistie at `8 + lanes + 2 + 8 = 18 + lanes`, 8px under its commit's when the file row's passing lanes are as wide as the commit's lanes. Look: Repositories view, Graph section, a commit opened, with Incoming or Outgoing Changes shown.
- Sessions sidebar Changes: inset `2*8 + 16 + 6 = 38px`; a group row's words at `2 + 2*8 + 16 + 4 = 38`. Look: a session's Changes section with a repository that has changes; the branch line, the new-branch field and the commit box start under the group rows' words.
- Text scale 1.25: a level `8*1.25 + 0 = 10px`; the shift `8*1.25 = 10px` (Guides multiplies it), the centre of a 20px twistie; Graph paddings `10px`; ChangesRepo inset `2*10 + 16*1.25 + 6 = 46px`. Look: the same views with the text scale at 1.25.
- Row narrowed by its pane: `--row-least` = `d*8s + 2*(16s + 4) + 4ch + 6px`, 8px less per level than on the unchanged tree outside the Files tree, so such a row runs past the pane's edge later. Look: the Sessions list or a Repositories section in a narrow pane.

## Files changed (`diff -rq ../O182-base/src src`, and `tests`, `config -x local.yml`, `utils`: no difference outside `src`)

| File | Change (`git diff --numstat`, `wc -l` for new files) | In write list |
| --- | --- | --- |
| `src/lib/themes/tokens.css` | +7 -0 | yes |
| `src/lib/ui/tree/TreeItem.svelte` | +14 -34, 520 lines | yes |
| `src/lib/ui/tree/row/Guides.svelte` | new, 43 lines | yes |
| `src/lib/views/shared/explorer/tree/Tree.svelte` | +10 -80, 463 lines | yes |
| `src/lib/views/shared/explorer/tree/control/tree-props.ts` | new, 76 lines | yes |
| `src/lib/views/sources/repositories/graph/CommitFiles.svelte` | +20 -9, 273 lines | yes |
| `src/lib/views/sources/repositories/graph/CommitRow.svelte` | +6 -5 | yes |
| `src/lib/views/sources/repositories/graph/GraphHead.svelte` | +3 -3 | yes |
| `src/lib/views/shared/sessions/sections/changes/ChangesRepo.svelte` | +1 -1 | yes |
| `src/lib/views/sessions/session-list/SessionWorkspace.svelte` | +12 -3 | yes |
| `src/lib/views/sessions/session-list/TerminalRows.svelte` | +2 -2 | yes |
| `.scratch/migration/agents/reviews/O182-report.md` | this report | yes |

Folder sizes: `src/lib/ui/tree/row/` holds five items, `src/lib/views/shared/explorer/tree/control/` ten (`ls`). No file was changed by a script; `npx prettier --write` over the 11 files reported each `(unchanged)`.

Comments and documents re-read after the change: TreeItem head comment (rewritten: names `row/Guides.svelte`), TreeItem style-block head (rewritten: names the two tokens, says the gap is the one not multiplied), the `--row-least` comment (still true), the guide comment (rewritten, moved to `Guides.svelte` with its rule), `tokens.css:209-211` (still true: the four tokens it lists are multiplied), the new token comment (new), Tree.svelte head comment (rewritten: names `control/tree-props.ts`), its `.rows` comment (rewritten), the CommitRow, GraphHead and CommitFiles style comments (rewritten), ChangesRepo's `.lines` comment (still true), SessionWorkspace head comment line 13 "keeps its amber left edge" (still true), TerminalRows `.row` comment (rewritten), `Graph.svelte:20` "one step in" (still true), `docs/` (`grep -rn -i -E "indent guide|indent|twistie|amber" docs README.md` finds four hits, each judged under "Repair round 1"; no sentence of HELP.md, data-map.md or decks.md is made false).

Reuse grep before adding the type: `grep -rn "tree-props\|TreeProps" src tests` found only `TreeView.svelte:179`'s local `treeProps`, unrelated.

## Judgment calls (each reversible)

1. TreeItem keeps the clamp of the depth (`const levels = $derived(Math.max(0, depth))`), since it needs the value for `--depth` too, and hands it to `Guides`, which builds its array from it; the clamp is written once.
2. The guide comment moved with the `.guide` rule into `Guides.svelte`, so the comment the brief places at `TreeItem.svelte:365-370` lives where the rule now lives.
3. The new type is named `TreeProps`, as `item-props.ts` names `TreeItemProps`; the Props type moved unchanged, and `Tree.svelte` dropped the imports only it used (`Snippet`, `RowOrder`, `NamingHooks`, `FsRoot`, `ProblemMark`, `RowRef`, `StatusFold`).
4. The amber mark is a `::after` on `.row` (with `position: relative` on `.row`), with `pointer-events: none`, so a press on the left edge still reaches the row.
5. `.row` of `TerminalRows.svelte` keeps `min-width: 0` alone; the rule stays so the comment about the shared edge has its place.

## User-visible changes, before and after

- Every tree outside the Files tree, the Notes section and ProjectTree (Sessions list, Customizations, the sessions sidebar's sections, Outline, Tags, Backlinks, clangd AST, Memory Usage, every Repositories section, Search, LaTeX, Apps, Settings Contents): a level was 16px and is 8px; the guides sat 4px right of the level's left edge, 4px left of the parent twistie's centre, and now run down that centre.
- Graph: commit rows and the graph head stood 12px in and stand 8px in (one level); a commit's file rows stood 16px under their commit and stand 8px under it.
- Sessions sidebar Changes: the branch line, new-branch field, commit box and busy line started 54px in and start 38px in.
- Sessions list: session and terminal rows started 2px right of their level and start at it; the amber mark of a session waiting for input was a 2px border beside the row's tint and is a 2px bar over the tint at the row's left edge.
- A narrowed row in those trees keeps a least width 8px a level smaller.

## Anything in the brief that was wrong

- The premise "their guides sit 2px right of the parent's twistie centre" (`What is on the tree`, the Sessions list bullet) does not hold on the unchanged tree: from the base CSS a bordered session row's guide k sits at `2 + 2 + 16k + 4 = 8 + 16k` and the parent twistie's centre at `10 + 16k`, 2px left of the centre. The sentence is true of the bordered rows under the new measures (`2 + 2 + 8k + 8 = 12 + 8k` against `10 + 8k`), which is the offset item 4 removes. The work does not change.
- Item 1 dictated a false clause for the tokens comment: "the gap is the one tree measure a row does not multiply by the text scale". `--tree-end-inset` (`tokens.css:263`) is a tree measure a row also reads unmultiplied (`TreeItem.svelte:463`, `:487`). The comment now says only that the row multiplies the shift by the text scale and not the gap (repair round 1, item 1).

## Limitations and sharp edges

- The amber bar is square and sits over the row's rounded corner (`--radius-sm` on `.item`), and over the left 1px of the focus outline of a waiting row that has the keyboard's focus. Look at landing: a waiting session row focused by the keyboard.
- A commit's file row is one level under its commit only when its passing lanes are as wide as the commit's own lanes; the lanes are drawn by `Lanes.svelte` from different inputs (`row.width` against the highest passing lane), which the step does not change.
- `--tree-guide-shift` resolves `calc(var(--icon-box) / 2)` on `:root`; a tree that sets its own `--icon-box` would keep the root's shift unless it sets the shift too. No ancestor sets `--icon-box` today (`grep -rn -E -- '--icon-box\s*:' src` prints only `tokens.css:260`).

## Repair round 1

Everything in the round's brief (`agents/briefs/O182-round-1.md`) is done.

### DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1. tokens comment: the false clause removed; named under "Anything in the brief that was wrong" | DONE | `tokens.css:216-220` below; the added bullet in that section above |
| 2. Every comment paragraph the step edited rewrapped as a whole at 100 columns | DONE | the width table below: no line inside a paragraph takes its next word within 100 |
| 3. The amber bar's comment drops "rather than beside it" | DONE | history grep below prints no "rather than" |
| 4. A commit's pending and error lines drawn in the `.file` frame, passing lanes included | DONE | the `CommitFiles.svelte` diff below; the positions under "Case after the change" |
| 5. The report: B1, B2, P1 | DONE | the sections below |
| Verify: `npm run diagrams`, then `env -u TMPDIR npm run test:quick` once | DONE | diagrams exit 0 and `git status --short` lists only the step's paths and the ledger files; the list printed `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint`, `ok svelte-check (55.0 s): ... COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest checks (145.2 s)`, last line `test:quick: 167.1 s; every command passed` |
| Gate 2 | DONE | `grep -rn -E "tree-guide-(gap\|shift), " src` prints nothing, exit 1 |
| Gate 3 | DONE | 15 hits, the same as the step's, with `CommitFiles.svelte:261` (moved down by the snippet) in place of `:251` |
| Gate 4 | DONE | `Unused exports (226)`; `diff` against `../O182-base/unused-exports.txt` prints nothing, exit 0 |
| Gate 5 | DONE | `wc -l`: `520 TreeItem.svelte`, `463 Tree.svelte` (`CommitFiles.svelte` 273) |
| Gate 6 | DONE | the perl ASCII check over the 11 changed files prints nothing, exit 0 |

The list ran once in this round; no whole-suite command was run. The round adds and changes no test. Files changed in this round: `tokens.css`, `Tree.svelte`, `SessionWorkspace.svelte`, `CommitRow.svelte`, `CommitFiles.svelte`, `TreeItem.svelte`, `Guides.svelte` and this report, all in the brief's write list; `git diff --numstat` for the step as a whole now reads `CommitFiles.svelte` +20 -9, `CommitRow.svelte` +6 -5, `Tree.svelte` +10 -80, the other rows unchanged.

### 1. The tokens comment

```css
    /* The indent guide of a tree level: the gap either side of its column, and how far its line
       sits right of the column's left edge, half an icon's box, so the line runs down the centre of
       the twistie of the row above. A row multiplies the shift by `--text-scale` and not the gap; a
       level is the indent and twice the gap, which is the indent alone at this gap of 0, as in VS
       Code's Explorer. */
```

The clause "the one tree measure that stays a fixed number of pixels" is gone. `TreeItem.svelte:259-262` says "Each but the gap is multiplied by the text size where it is drawn"; it names the row's height, the indent, the two type sizes and the two guide measures, and among those that is true (`--tree-end-inset` is not in that list).

### 2. Widths after the rewrap

Measured with an awk that prints each comment line's width and, for a line inside a paragraph, the width with the next line's first word added (reads only). No line inside a paragraph is short of its next word:

| Paragraph | Line widths | With the next word |
| --- | --- | --- |
| `tokens.css:216-220` | 96, 100, 100, 98, 26 | 101, 104, 106, 105 |
| `Tree.svelte:28-38` | 98, 90, 96, 98, 100, 93, 96, 95, 95, 93, 29 | 114, 102, 103, 104, 110, 101, 102, 105, 101, 116 |
| `Tree.svelte:423-424` | 100, 91 | 104 |
| `SessionWorkspace.svelte:242-244` | 96, 100, 45 | 102, 104 |
| `CommitRow.svelte:229-235` | 98, 98, 99, 100, 98, 99, 47 | 102, 102, 103, 104, 106, 107 |
| `GraphHead.svelte:71-75` | 96, 98, 99, 95, 92 | 101, 104, 105, 103 |
| `CommitFiles.svelte:253-256` | 97, 97, 97, 100 | 102, 101, 101 |
| `TerminalRows.svelte:147-148` | 98, 25 | 101 |
| `TreeItem.svelte:2-6` | 96, 98, 99, 100, 65 | 103, 105, 104, 105 |
| `TreeItem.svelte:259-262` | 97, 98, 97, 58 | 103, 101, 103 |
| `Guides.svelte:2-5` | 95, 100, 98, 99 | 102, 103, 104 |
| `Guides.svelte:22-28` | 99, 100, 100, 97, 100, 95, 75 | 102, 107, 103, 104, 107, 101 |
| `tree-props.ts:1-5` | 99, 93, 100, 98, 84 | 109, 103, 107, 108 |

`Tree.svelte:29` (90) is a line the step did not edit; its next word is "pressing.ts", which takes it to 102.

### 3. The amber bar's comment

```css
    /* A session needing input is marked by a 2px amber bar laid over the row's left edge, so it
       takes no width, the row's words stay where they are when it comes and goes, and it shows over
       the row's hover and selection tint. */
```

History grep over the added lines of `git diff -U0 -- src` and the two new files, with "rather than" added to the word list: one hit, `Guides.svelte:25` "The gap before a guide", the place on the line.

### 4. A commit's pending and error lines

```svelte
{#snippet said(label: string, tone: 'error' | 'muted')}
    <li role="none" class="file">
        {#if passing.length > 0}
            <Lanes {passing} {open} />
        {/if}
        <div class="item">
            <TreeItem {label} depth={1} {tone} />
        </div>
    </li>
{/snippet}

{#if failure !== ''}
    {@render said(failure, 'error')}
{:else if reading && files.length === 0}
    {@render said(t('repositories.graph_pending'), 'muted')}
{/if}
```

(each `{@render}` carries the file's `eslint-disable-next-line` comment for a render tag). The two lines take the `.file` frame and the passing lanes a file row takes, at depth 1, the depth of a file row at the top of the commit's files (`depth={1 + row.depth}` with `row.depth` 0). The `.file` comment says so in one sentence.

Case after the change, scale 1, `Lp` the width of the passing lanes' SVG (the same `Lanes` call a file row makes): the line's twistie slot starts at `8 + Lp + 2 + 8 = 18 + Lp`, where a top file row's starts (`18 + Lp`). With no lanes passing both are at 18. Before this round (after the step) the line was at `2 + 2*8 = 18` whatever the lanes, so with lanes passing it stood `Lp` left of the file rows; on the unchanged tree it was at `2 + 2*16 = 34` against file rows at `12 + Lp + 2 + 16 = 30 + Lp`. Look at landing: Repositories, Graph, a commit opened while its files are read (and a commit whose files fail to read), with lanes passing and with none; the line starts where the file rows start, its lanes drawn beside it.

### 5. The report

- B1, the amber bar. Before: a 2px square amber border on `.row`, outside `.item`; the row's rounded tint (`border-radius: var(--radius-sm)`, `TreeItem.svelte:279`) and its whole focus outline (`outline: 1px solid var(--accent); outline-offset: -1px`, `:318-319`) began 2px to its right. After: the bar lies at `.row`'s left edge over the tint's top-left and bottom-left corners and over the left edge of the focus outline. Look at landing: a waiting session at rest, hovered, selected and focused by the keyboard.
- B2, the tint. The hover and selection tint of every session row and terminal row starts 2px further left, at the list's row edge, level with the tint of the group rows (the workspace rows and the Terminals row); before, it started after the 2px transparent border. Look at landing: hover a session row under a group row and select one; the two tints start at the same left edge.
- P1, the docs grep `grep -rn -i -E "indent guide|indent|twistie|amber" docs README.md` prints four hits, none about a tree level:
  - `docs/decks.md:91`: `design: amber` in a slide's tag palette. Not made false.
  - `docs/HELP.md:31`: a rail badge's colours, "red before amber before green". Not made false.
  - `docs/HELP.md:302`: the editor's indentation settings. Not made false.
  - `docs/HELP.md:573`: Tab indents in an editor. Not made false.
- B-r1, the lanes: a commit's pending and error lines now draw the passing lanes beside them, as a file row does; before this round, with lanes passing, the line stood the lanes' width left of the file rows and no lane ran through its row. Look at landing: a commit with lanes passing, its files being read and its files failing to read.

### Anything in the brief that was wrong

- Item 1 of the step's brief dictated the false clause for the tokens comment (the gap as the one tree measure a row does not multiply); `--tree-end-inset` is read unmultiplied too (`TreeItem.svelte:463`, `:487`). Named in the step's section of the same name above, and fixed by item 1.

### Limitations

- The pending and error lines are drawn in the same frame as the file rows, so the width of their lanes follows the file rows' (`Lanes.svelte` sized from the highest passing lane), the same relation to the commit's own lanes the step's limitations name.
