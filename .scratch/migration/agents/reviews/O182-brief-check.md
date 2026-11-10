# Brief check of O182 (oculus, main at f9e1061f0)

I changed nothing. All reads were on main at its head in `/Users/axelfaes/workspace/oculus`. The worktrees `.agents/worktrees/migration-O182` and `O182-base` do not exist yet (`ls .agents/worktrees/ | grep O182` prints nothing), so the brief's "Where you work" could not be checked against them.

Three findings need action before dispatch, in this order:
- **Size rule.** `TreeItem.svelte` is 540 lines and `Tree.svelte` is 533, both past the 520 at which `spec.md:48` says a file the step changes is split in the step. The brief does not mention this (check 6a).
- **Sessions case.** Case 2 gives the wrong width. Session and terminal rows sit inside a 2px `border-left`, so they start 18px in, not 16, and their guides sit 2px right of the parent twistie's centre (checks 4 and 6b).
- **Graph case.** Case 4 and requirement 3 say "where a depth-1 tree row's name starts". That is not what the padding does: the commit row's TreeItem sits where a depth-1 row's twistie starts, plus the lanes. "Still lines up" is also false today (checks 3 and 4).

## 1. Names

Commands:
- `git grep -n -E 'tree-guide-gap|tree-guide-shift' -- src tests docs config README.md ':!config/local.yml'`
- `git grep -n 'tree-indent' -- ...` (same paths)
- `git grep -c 'icon-box' -- ...` (same paths)

Results:
- **`--tree-guide-gap` and `--tree-guide-shift`.** Every hit is in a file on the write list: `TreeItem.svelte:271,368,369,375,376,378`, `Tree.svelte:494,495`, `ChangesRepo.svelte:140`, `CommitFiles.svelte:250`, `CommitRow.svelte:239`, `GraphHead.svelte:80`. There are none in tests, docs or config.
- **`--tree-indent`, one hit outside the write list:** `src/lib/views/shared/sessions/sections/TimelineTurns.svelte:190`, `padding-left: calc(var(--tree-indent) * var(--text-scale, 1));`. Its comment (lines 179-181) says "the event indented one level under its prompt". The change does not make it false: today it is 8px while a level elsewhere is 16; after the change 8px is a level. It is not a tree row (plain divs, no TreeItem).
- **`--icon-box`, hits outside the write list:** `ToolButton.svelte` (2), `FileIcon.svelte` (2), `Glyph.svelte` (4), `Select.svelte` (1), `RowIcon.svelte` (2), `ChangeRow.svelte` (1). The token is not changed, so none becomes false. `Glyph.svelte:18` ("drawn at `--icon-box`, 16 px times the text scale") stays true.
- **Comments inside the write list that the change touches:**
  - `tokens.css:209-211` says "A row multiplies each by `--text-scale`". The gap is not multiplied (`TreeItem.svelte:375-376`). If the builder puts the gap token under that comment, the comment becomes false (see 6c).
  - `TreeItem.svelte:259-261` lists only the height, indent and type sizes as the ancestor-settable tokens. It stays true but leaves out the two new tokens.
  - `CommitRow.svelte:233-234`, `GraphHead.svelte:74-75`, `CommitFiles.svelte:244-245` and `ChangesRepo.svelte:136-137` stay true.
- **Docs.** `git grep -n -i -E 'indent|twistie|twisty' -- docs README.md config` finds no sentence about tree indent.
- **Tests.** `git grep -n -E 'tree-guide|tree-indent|icon-box' -- tests` prints nothing (rc=1).

## 2. The step line

How each part of the step line (`plan.md:1734`) maps to "What to build":
- **"the Files view's measures (`--tree-guide-gap: 0px` and the guide at the twistie's centre, `Tree.svelte:494-495`) become the default of `TreeItem.svelte`":** requirement 1 (tokens in `tokens.css`, read by TreeItem with no fallback) and requirement 2 (Tree.svelte drops them). The step line says "the default of TreeItem.svelte"; the brief puts the default in `tokens.css` as its decision 1. That is internal and reversible, and it is stated.
- **"so every tree's levels are the 8px indent alone at every depth":** requirement 1, with cases 2, 3 and 6.
- **"the indent token `--tree-indent` unchanged":** the line "Nothing else changes: ... the indent token stay as they are".
- **"the indents computed by hand ... (CommitFiles:250, CommitRow:239, GraphHead:80, ChangesRepo:140) follow":** requirement 3, with cases 4 and 5.
- **"Built by a builder agent":** "Where you work".
- **Requirement 4 matches no part of the step line.** It is a property the token design keeps, checked by case 7.

## 3. Premises

Most premises reproduce:
- **TreeItem guides.** `.guide` is at `TreeItem.svelte:371-379` with `margin-left: var(--tree-guide-gap, 4px)`, `margin-right: calc(var(--tree-guide-gap, 4px) - 4px)` and `translate: calc(var(--tree-guide-shift, 0px) * var(--text-scale, 1))`. The comment is at 365-370 and `--row-least` at 268-273 (fallback on 271). Holds.
- **Tokens.** `--tree-indent: 8px` is at `tokens.css:214` and `--icon-box: 16px` at `:253`, both inside `:root` (opened at line 8). Holds.
- **Tree.svelte.** Lines 491-492 hold the comment "VS Code's Explorer measures ...", 494-495 the two measures and 496 `--tree-end-inset: 16px`. Holds.
- **Who sets the gap.** `git grep -n 'tree-guide-gap' -- src` shows only reads, apart from Tree.svelte. Holds.
- **The four hand-computed indents** are at the lines the brief gives. Holds.
- **Tests and guarded.md.** `git grep -n -E 'tree-guide' -- tests` gives rc=1. `grep -c -E 'TreeItem|tree-indent' .scratch/migration/agents/guarded.md` gives 0. Holds.
- **ADRs.** `ls docs/adr` gives "No such file or directory". Holds.
- **Trees at 16px today.** I ran the brief's import grep (65 files) and the `depth={...}` each passes. Every tree the brief lists passes depth 1 or more. The Debug sections pass no depth (flat rows), so their absence from the list is right.

Four premises are imprecise or wrong:
- **"Only the Files tree sets its own measures" is imprecise.** `Tree.svelte` is also drawn by the Notes section (`Notes.svelte:21`) and by `ProjectTree.svelte` through `RootedTree.svelte`. Those trees are already at 8px; nothing changes for them.
- **"So each still lines up" (requirement 3) is false today for the Graph.**
  - The Graph paddings are `gap + indent` = 4 + 8 = 12px today, while a level is 16px. A commit row's TreeItem twistie sits at 12 + lanes + 2 = 14 + lanes; a depth-1 row's twistie sits at 2 + 16 = 18. They are 4px apart today.
  - Example: the Graph's "missing" commit is a TreeItem at depth 1 (`Graph.svelte:414-424`) and starts at 16. Its file rows start at 12 + 16 = 28, so they are 12px under it, not one level.
  - After the change (gap 0) all of these line up. "Still" is the wrong premise.
- **"A depth-1 tree row's name starts" (requirement 3 and case 4) is wrong.** After the change, `CommitRow` and `GraphHead` start their lanes at 8px. Their TreeItem twistie is at 10 + lanes, exactly where a depth-1 row's twistie is (10), moved right by the lanes. A depth-1 row's name starts at 30, or 50 with an icon.

## 4. Cases and checks

Widths below are computed from the CSS. The `.main` padding-left is 2px (`TreeItem.svelte:330`) and the line gap is 4px (`:345`, `:361`). One level is `indent*scale + gap + (gap - 4) + 4` = `indent*scale + 2*gap`. The guide's line is at the column's left edge plus the shift times the scale. The twistie is `icon-box*scale` wide.

- **Case 1, Files tree:** 8px a level. The guide of the depth-k column is at 2 + 8k + 8; the twistie centre of the depth-k ancestor is at 2 + 8k + 8. Met, unchanged.
- **Case 2, Sessions list: inconsistent with the tree.**
  - Depth 0 is the section head (`TreeSection.svelte:78-85`) and depth 1 the workspace row (`SessionWorkspace.svelte:205-215`, no wrapper).
  - Depth 2 session rows sit in `<div class="row">` with `border-left: 2px solid transparent` (`SessionWorkspace.svelte:230-233`). Terminal rows do the same (`TerminalRows.svelte:147-151`, "The same left edge as a session row").
  - After the change a session row starts 2 + 2 + 16 = 20, which is 18px in from depth 0, not 16. Its guides sit at 12 and 20, against twistie centres at 10 and 18: 2px right.
  - As written, the case either makes the builder stop under the brief's stop clause, or it passes on a computation that leaves out the border.
- **Case 3, Outline:** a depth-1 symbol row's twistie slot starts at 10, as a depth-1 file row's does. This is ambiguous. The Files tree drops a leaf's empty twistie (`Tree.svelte:508`, `--tree-leaf-twisty: none`) and Outline does not, so a depth-1 file's icon is at 10 while a leaf symbol's icon is at 30. The case should say which edge "starts" measures.
- **Case 4, Graph:**
  - "A commit's file row one level, 8px, under its commit" holds after the change. CommitRow is 8 + lanes(row) + depth 0; the file row is 8 + lanes(passing) + depth 1 + row.depth. That assumes the two lane widths are equal; `Lanes.svelte:50` computes `row.width` against `max(passing)+1`, as before. For the missing commit it is 8 against 16.
  - "Where a depth-1 tree row's name starts" does not hold (section 3).
- **Case 5, ChangesRepo:** `--inset` = 2*(8 + 0) + 16 + 6 = 38. The group head at depth 2 (`ChangesRepo.svelte:100-114`, `GroupList.svelte:297-307`, no icon) has its words at 2 + 16 + 16 + 4 = 38. Met. The formula is the level formula, so it lines up at any gap.
- **Case 6, scale 1.25:** a level is 8*1.25 + 0 = 10 and the shift is 8*1.25 = 10. The twistie is 20 wide with its centre at 12, and the guide is at 2 + 10 = 12. ChangesRepo is 2*10 + 20 + 6 = 46 against words at 2 + 20 + 20 + 4 = 46. CommitRow padding is 10. Met.
- **Case 7, gap 4px on an ancestor:** 8 + 4 + 0 + 4 = 16. Met.
  - It asks about a place that does not exist: after the change no tree sets the gap.
  - Under such an ancestor the Graph's `gap + indent` paddings would be 12 against a level of 16, which the case does not cover (see 6e).

None of the cases conflicts with `spec.md`'s test rule: they are computed by reading, and the look is named for landing (`spec.md:60,61,66`).

## 5. The question

**Can each requirement pass without the goal being reached?**
- **Requirement 1:** passes with the goal reached for every row TreeItem draws. It also passes with the Sessions list's session and terminal rows 2px past the Files view's measure (border wrapper, above).
- **Requirement 2:** passes either way; it is cleanup and does not bear on the goal.
- **Requirement 3:** passes either way. "Read the same tokens with no fallback" keeps `gap + indent` in CommitRow, GraphHead and CommitFiles. That equals one level only while the gap is 0, so it reaches the goal for the default but not for requirement 4's override.
- **Requirement 4:** does not bear on the goal.

**Can each case pass without the goal?**
- Cases 1 and 7 pass without the goal: case 1 is unchanged, case 7 is hypothetical.
- Cases 3, 5 and 6 pass only if the goal is reached in those places.
- Case 2 cannot pass as written, even with the goal reached.
- Case 4's second half cannot pass as written.

**Rows drawn outside TreeItem with their own indent.** I searched for `padding-left` and `margin-left` with px or calc in the 65 tree files and in all of `src`, for `var(--depth`, `.guide` or `.twisty` outside TreeItem, for `role="treeitem"` outside TreeItem, and for `border-left` in the tree files. Found:
- `ChangesRepo.svelte` `.lines`: covered.
- `CommitRow`, `GraphHead`, `CommitFiles` paddings: covered.
- `TimelineTurns.svelte:190`: not a tree, and lines up after the change.
- `MakeGroup.svelte:95,109` (22px): inside the Files tree, whose measures do not change, and not depth-based.
- The 2px `border-left` wrappers in `SessionWorkspace.svelte:232` and `TerminalRows.svelte:150`: these are what put session and terminal rows out of line with the Files view's measure.

`ui/controls/heads/GroupHead.svelte`'s `--group-indent` is for card groups, not tree rows.

## 6. Implied inputs

- **a. File size (has happened; a wrong answer turns the size check red).**
  - `TreeItem.svelte` is 540 lines (`awk 'END{print NR}'`) and `Tree.svelte` 533 (`wc -l`). Neither is in `utils/size-allow.txt` (grep prints nothing).
  - `tests/checks/tree/size.test.ts:30,75` refuses a component with more than 540 newlines, and `test:quick` runs `tests/checks`, so one net added line in TreeItem (for instance from rewrapping the 365-370 comment) turns the verify list red.
  - `spec.md:48` says a component the step changes that would pass 520 is split by concern in the step, and both files are already past 520.
  - Both folders are at the 10-item cap (`src/lib/ui/tree` 10, `src/lib/views/shared/explorer/tree` 10), so a split goes into a subfolder such as `ui/tree/row/` (4 items).
  - The brief says nothing about this, and its write list holds no split file. Expected: the brief says how `spec.md:48` applies (split, with the paths), or the orchestrator rules on it.
- **b. The Sessions list's 2px border (has happened).** Expected: either case 2 says 18px with the guides 2px right of the twistie centre, or the brief decides whether the 2px wrapper is part of the goal. Changing it would need `SessionWorkspace.svelte` and `TerminalRows.svelte` on the write list, and is a visible change.
- **c. Where the gap token goes in `tokens.css`.** The gap is not scaled; the comment at 209-211 says a row scales every tree measure. Expected: the new comment says the gap is not multiplied by the text scale. Otherwise the comment becomes false, against `spec.md:72`.
- **d. Where the shift is computed.** `--tree-guide-shift: calc(var(--icon-box) / 2)` declared on `:root` is computed with `:root`'s `--icon-box`; today it is computed on `.rows`. `git grep -n -E -- '--icon-box\s*:'` finds only `tokens.css:253`, so the result is the same, 8px.
- **e. The Graph formula.** Expected: the brief says whether `CommitRow`, `GraphHead` and `CommitFiles` keep `gap + indent*scale` or take the level formula `indent*scale + 2*gap` (as `ChangesRepo:140` and `--row-least` do). Both are 8px at the default; only the level formula holds under requirement 4's override.
- **f. Theme parsing.** `tokens.css`'s `:root` block is parsed by `src/lib/themes/parse.ts` (`parseBlocks`), `vscode-map.ts:274-276` (`basesOf`) and `tests/checks/look/themes.ts`. Non-colour `calc()` tokens already sit there (`--fs-xs`, `--tree-indent`). Expected: no change in the theme tests. Not verified by a run.

## 7. ADRs

`ls docs/adr` gives "No such file or directory". No ADR is touched.

## 8. Dictated text

The brief dictates no verbatim line for any file. `grep -n` over the brief finds quoted text only in quotations of existing comments ("VS Code's Explorer measures", "past two indent guides and the arrow's box").

It does give the content of two comments:
- Requirement 1, TreeItem `:365-370`: "each level is the indent and twice the gap, the indent alone at the default gap of 0". This holds: no history word under `spec.md:44`.
- Requirement 2: "its comment says what it still sets". This is an instruction, not dictated text, but "still" copied into the comment would break `spec.md:44`.

Requirement 4's "as Tree.svelte did" and case 7's "as before" would also break `spec.md:44` if carried into a comment.

## 9. Overreach

The ruling and the step line, compared:
- **Ruling (`plan.md:3724`):** "(b). The Files view's tree measures become the default of every tree (`TreeItem.svelte`), so each level is 8px deep everywhere; step O182."
- **Brief, which adds a clause to the ruling's content:** "The plan's ruling "Open item 749": (b), the Files view's tree measures become the default of every tree, so each level is 8px deep everywhere, the indent token `--tree-indent` unchanged." The clause "the indent token `--tree-indent` unchanged" is the step line's words, not the ruling's. It follows from "8px", but it is presented as the ruling.
- **Reading of "tree measures".** The ruling's words could cover the Files view's status-letter inset too: `Tree.svelte:491-492` names "the status letter is 16px from the row's edge" among "VS Code's Explorer measures". The step line and the brief read the ruling as the two depth measures only, which "so each level is 8px deep" supports. I report it as a reading, not as a narrowing.

Verification beyond the plan's `verify:` list (`- npm run test:quick`) and `spec.md`'s own checks:
- "2. `grep -rn -E "tree-guide-(gap|shift), " src`: prints nothing (no fallback left)." This is an extra verification procedure. `spec.md:72`'s name grep is a different check.
- "The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted." With the stop clause after it ("When the first run finds a case the brief's rules get wrong, the builder stops before changing any code ..."), this is a procedure neither the verify list nor `spec.md` states.

Other overreach checks:
- **Text attributed to Axel:** none.
- **A workaround or invented rule presented as a ruling:** none beyond the added clause quoted above.
- **User-visible decisions:** every visible change follows from the step line: guides moving to the twistie's centre in every tree, Graph paddings going from 12 to 8, ChangesRepo lines from 54 to 38, and rows narrowing further before they overflow because `--row-least` shrinks. Decision 1 (tokens in `tokens.css`) is internal and labelled reversible. There is no uncovered user-visible decision.

## Declined to judge

- Whether the `/spec` skill's brief shape requires the "first run of every case" paragraph: I did not read the skill, since the task limited reads to the brief, the plan, `spec.md` and the tree.
- Whether the theme and contrast tests stay green with two new `:root` tokens: judged from reading only, not run (no test run is allowed here).
- Whether the lane widths of a commit row and its file rows can differ in practice (`Lanes.svelte:50`): this is not changed by the step and I did not measure it.
- How the rows look on screen: no page or server was allowed; that is the orchestrator's look at landing.

Usage: a141355f691370c1f, claude-opus-5-5, 183093 tokens, 52 tool uses, 495 s

## Closed

- 6a, the size rule: the brief splits both components by concern, as `spec.md:48` says: the guide columns of `TreeItem.svelte` (the `guides` derived, the `each` and the `.guide` styles) into `src/lib/ui/tree/row/Guides.svelte`, and the `Props` type of `Tree.svelte` into `src/lib/views/shared/explorer/tree/control/tree-props.ts`, as `ui/tree/item-props.ts` holds TreeItem's; both paths on the write list, each folder under the cap of ten.
- Case 2 and 6b, the Sessions list's 2px border: the step ends it, since the goal is rows as deep as the Files view's. The amber bar of a session waiting for input is drawn without taking width, and the transparent border goes from session and terminal rows; `SessionWorkspace.svelte` and `TerminalRows.svelte` are on the write list, and case 2 gives 16px with the guides at the twistie's centre.
- 3, 4 and 6e, the Graph: `CommitRow`, `GraphHead` and `CommitFiles` take the level formula `indent*scale + 2*gap`, as `ChangesRepo.svelte:140` and `--row-least` do; requirement 3 and case 4 say a commit row's twistie sits where a depth-1 row's twistie sits, moved right by its lanes, and that today's paddings are 12px against a 16px level.
- Case 3, the Outline: the case measures the twistie slot's left edge, and says a leaf symbol keeps its empty twistie, unlike a leaf file of the Files tree.
- 6c and 1, the comments: requirement 1 says the `tokens.css` comment names the gap as the one measure not multiplied by the text scale, and that the `TreeItem.svelte:259-261` comment names the two new tokens.
- 3, the premise on who sets the measures: the brief names Notes (`Notes.svelte:21`) and `ProjectTree.svelte` through `RootedTree.svelte` as trees `Tree.svelte` draws, already at 8px.
- 9, the ruling quote: the brief quotes the ruling's words only and gives "the indent token unchanged" as the step line's. 9, verify item 2: kept as the step's own gate, which the spec skill's brief shape allows after the verify list; it is the check of requirement 1's "no fallback". 9, the first run of every case: kept, since the spec skill's brief template requires it.
- 8 and the history words: the brief says no comment the step writes carries "still", "as before" or another word of `spec.md:44`'s list.
- Requirement 4 and case 7: removed, since no part of the step line asks for them and no tree sets the gap after the change.
- 1, `TimelineTurns.svelte:190`: named under "What is on the tree" as read and unchanged.
- 6d and 6f: named under "What is on the tree"; 6f is covered by the verify list's theme tests.
