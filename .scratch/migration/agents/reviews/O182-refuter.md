# Refutation of O182 (worktree .agents/worktrees/migration-O182, base 3e1d5f960)

I changed nothing. All five items of "What to build" hold. All eight cases are met by the widths I computed from the CSS; the on-screen look at landing still has to confirm them. The verify list is green. The builder is right that the brief's premise "2px right of the parent's twistie centre" is wrong on the unchanged tree: the guides sat 2px left of it.

There are five findings, all small, and no repair round is needed for any of them:
- St1: a false clause in the new tokens.css comment. The brief dictated it, and the builder did not report it as wrong.
- St2: comment paragraphs that are not rewrapped as a whole.
- St3: a "rather than" contrast with the removed border.
- P1: a docs-grep count the report gives that my run does not reproduce. No decision rests on it.
- B1 to B3: three visible changes the report states without their before, or does not state.

## Checks of "Verify before you report", run from the worktree root

- 1a, diagrams. `staleFiles()` from utils/diagrams/diagrams.mjs, called read-only, printed `[]`. `npm run diagrams` then printed its file list, and `git status --short` afterwards listed only the 12 step paths (9 `M`, 3 `??`). It changes no tracked file.
- 1b, `env -u TMPDIR npm run test:quick` (node v24.21.0) printed `test:quick: 12 test file(s)` (all under tests/checks) and then:
  - `ok prettier`
  - `ok ASCII gate`
  - `ok svelte-kit sync`
  - `ok eslint`
  - `ok svelte-check (18.0 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
  - `ok vitest checks (155.6 s)`
  - `test:quick: 163.6 s; every command passed`

  No test in the list parses tokens.css. I ran `npx vitest run tests/checks/look/contrast.test.ts` alone, which reads it: `Tests 56 passed (56)`.
- 2: `grep -rn -E "tree-guide-(gap|shift), " src` prints nothing, rc=1.
- 3: the name grep prints 15 hits. They are at tokens.css:214,221,222, TreeItem.svelte:260,272, Guides.svelte:26,30,33,34,36, TimelineTurns.svelte:190, ChangesRepo.svelte:140, CommitFiles.svelte:251, CommitRow.svelte:240 and GraphHead.svelte:80. None is in tests, config, docs or README.md. This matches the report.
- 4: `sh utils/unused-exports.sh` prints `Unused exports (226)` first. `diff ../O182-base/unused-exports.txt <output>` prints nothing, rc=0.
- 5: `wc -l` gives 520 for TreeItem.svelte, 463 for Tree.svelte, 43 for Guides.svelte and 76 for tree-props.ts.
- 6: the perl ASCII check of spec.md:103 over the 11 changed files and the report prints nothing.
- `ls docs/adr` prints "No such file or directory".

## The report's quoted commands, rerun

- `grep -n -E 'tree-guide' src/lib/themes/tokens.css` prints 221 and 222, as claimed.
- `grep -n border-left src/lib/views/sessions/session-list/*.svelte` prints nothing, as claimed.
- `grep -rn tree-leaf-twisty src` prints only TreeItem.svelte:379,381 and Tree.svelte:438 (`.arrowless`), as claimed.
- `grep -rn -E -- '--icon-box\s*:' src` prints only tokens.css:260, as claimed.
- The reuse grep `grep -rn "tree-props\|TreeProps"`, run on ../O182-base, prints only TreeView.svelte:179, as claimed.
- `diff -rq` against ../O182-base over src, tests, utils and config (-x local.yml) shows 9 differing files and the 2 new files, all inside src. This matches the file table.
- The `git diff 3e1d5f960 --stat` line counts match the report's numstat column on every row.
- The history-word grep over the added lines and the two new files gives two hits: SessionWorkspace "rather than" (see St3) and Guides.svelte:25 "The gap before a guide", which is spatial.
- The state file's open-items list is empty, as quoted.
- The docs grep `grep -rn -i -E "indent guide|indent|twistie|amber" docs README.md` prints 4 hits, against the report's 1 (see P1).

## Verdicts per item of "What to build"

1. **Holds**, with St1. tokens.css:221-222 declares `--tree-guide-gap: 0px` and `--tree-guide-shift: calc(var(--icon-box) / 2)` beside `--tree-indent`. Guides.svelte:33-36 and TreeItem.svelte:272 read them with no fallback (gate 2 is empty). The level comment moved with the rule to Guides.svelte:22-28 ("the indent alone at the default gap of 0"). TreeItem.svelte:259-262 names both tokens.
2. **Holds.** Tree.svelte:423-430 sets neither measure and keeps `--tree-end-inset: 16px` and its other rules. Its comment says what it sets.
3. **Holds.** CommitFiles.svelte:251, CommitRow.svelte:240 and GraphHead.svelte:80 are `calc(var(--tree-indent) * var(--text-scale, 1) + 2 * var(--tree-guide-gap))`. ChangesRepo.svelte:140 has no fallback. Each comment states the level formula.
4. **Holds** by reading. The border is gone from both `.row` rules. SessionWorkspace.svelte:245-252 draws `.row.input::after` with `position: absolute; inset: 0 auto 0 0; width: 2px; background: var(--c-amber)` on a `position: relative` `.row`. The pseudo-element is positioned and comes last in tree order, so it paints over the TreeItem `.item` tint. TerminalRows.svelte:147-148 is true.
5. **Holds.**
   - Guides.svelte holds the derived array, the `each` and the `.guide` rules with the hover and focus rule.
   - TreeItem draws `<Guides depth={levels} />` where the `each` stood.
   - tree-props.ts holds `TreeProps` unchanged, and Tree.svelte uses it.
   - Both head comments name the moved part.
   - Both new files open with a Layer 3 head comment in the form of their siblings.
   - Folders: row/ holds 5 items and control/ 10, at the cap (`ls`).

## Verdicts per case

Widths come from the CSS. The `.main` padding-left is 2px (TreeItem.svelte:331), the line gap 4px (:346, :362), the guide column `8s` wide with margin-left `g` and margin-right `g - 4` (Guides.svelte:30-34), the shift `8s` (tokens.css:222 and Guides:36), and the twistie `16s` (TreeItem:370). So one level is `8s + 2g`, with g = 0 after the change.

1. **Files tree: met, unchanged.** At s=1 the guide of level k is at 10+8k, which is the centre of the depth-k twistie (2+8k plus 8).
2. **Sessions list: met by computation.** The depth-2 twistie is at 2+16 = 18, which is 16 in from the head's at 2. The guides at 10 and 18 are the centres of the twisties at 2-18 and 10-26. The terminal rows carry no border either. The look settles it.
3. **Waiting session: met by reading.** The bar is out of flow and painted over hover (`--chip`) and selection (`--accent-bg`). The look settles it.
4. **Outline: met.** The depth-1 twistie slot is at 10, 8 in from depth 0's at 2. No ancestor sets `--tree-leaf-twisty`, so a leaf symbol keeps its slot.
5. **Graph: met.**
   - The commit padding is 8, so its twistie is at 8+L+2 = 10+L, where a depth-1 row's twistie sits (10).
   - The head is 8 in.
   - A file row's twistie is at 18+Lp, 8 under the commit's when Lp = L.
   - Lanes.svelte:49-51 sizes the passing lanes from `max(passing)+1` and the commit's from `row.width`. That difference is unchanged by the step and named in the report.
6. **ChangesRepo: met.** The inset is 2*8+16+6 = 38, and a group row's words are at 2+16+16+4 = 38.
7. **Text scale 1.25: met.**
   - A level is 10 and the shift 10.
   - The guide of level k is at 2+10k+10 = 12+10k, the centre of a 20px twistie at 2+10k.
   - The Graph paddings are 10.
   - The ChangesRepo inset is 20+20+6 = 46, against words at 2+20+20+4 = 46.
8. **Narrowed row: met.** `--row-least` is `d*8s + 2*(16s+4) + 4ch + 6px`. Outside the Files tree it was `d*(8s+8) + ...`, so it is 8px less per level.

## Findings

### Spec

- **Sp1, the brief's premise (no fault of the builder).** The brief's "What is on the tree", Sessions bullet, says the guides "sit 2px right of the parent's twistie centre". That does not reproduce on the base.
  - The base `.guide` (O182-base TreeItem.svelte:371-379) defaults to g = 4 and shift 0.
  - A bordered session row's guide of level k is therefore at 2 (border) + 2 + 16k + 4 = 8+16k. The parent twistie's centre is at 2+16k+8 = 10+16k. So the guide is 2px left of the centre.
  - "2px right" is the after-change value with the border kept: 12+8k against 10+8k.
  - The builder's correction at O182-report.md:107 holds. Nothing built depends on it.
- **Sp2.** Item 1 dictated a comment saying "the gap is the one tree measure a row does not multiply by the text scale". That claim is false (see St1). The builder wrote it into tokens.css and did not list it under "Anything in the brief that was wrong". The reader is the orchestrator, who would then take the brief's wording as checked.

### Proof

- **P1.** O182-report.md:85 says the docs grep "finds only HELP.md:573". The same command prints four hits: docs/decks.md:91, docs/HELP.md:31, HELP.md:302 and HELP.md:573. None of them is about a tree level, so the report's conclusion ("no sentence of HELP.md, data-map.md or decks.md is made false") stands.
- No test was added or changed, so there is no "seen failing first" to check. No threshold or allow list was edited (`diff -rq` shows no change under tests or utils).

### Standards

- **St1, tokens.css:216-220.** The new comment says:

  `A row multiplies the shift by \`--text-scale\` and never the gap, the one tree measure that stays a fixed number of pixels;`

  This is false. `--tree-end-inset` is a tree token (tokens.css:263, `6px`, "How far a tree row's last part ... sits from the row's right edge"). It is read unmultiplied at TreeItem.svelte:463 (`padding: 0 var(--tree-end-inset) 0 4px`) and :487. A reader who sets a text scale and expects every tree measure but the gap to grow would wrongly expect the count's inset to grow too. Under spec.md:72 a sentence the change makes false is a defect. A fix at landing is to drop "the one tree measure that stays a fixed number of pixels".
- **St2, paragraphs not rewrapped as a whole (spec.md:45).** In each of these lines the first word of the next line fits within column 100:
  - Tree.svelte:35 is 91 columns and "the" fits. The paragraph at 28-38 was edited at 37-38.
  - SessionWorkspace.svelte:243 is 96 columns and "it" fits.
  - CommitRow.svelte:231 is 93 columns and "Under" fits. Its paragraph was edited at 233-235.
  - The next word would end exactly at column 100 in TreeItem.svelte:5, tokens.css:217, Guides.svelte:23, 24 and 25, and CommitRow.svelte:233.

  Elsewhere in the same diff the builder fills lines to 100 (Guides.svelte:3, tree-props.ts:3). The comment-width check only caps the width, so it passes these.
- **St3, SessionWorkspace.svelte:242-244.**

  `A session needing input is marked by a 2px amber bar at the row's left edge, laid over the row rather than beside it, so it takes no width,`

  "rather than beside it" sets the bar against the removed border. That is a construct spec.md:21 bans and a comparison with an earlier state under spec.md:44. A reader who never saw the border is left asking what "beside it" refers to. "laid over the row" alone says it.
- **Checked with no finding:**
  - Non-ASCII: none (gate 6).
  - Sizes are within the limits, and the folders are at or under ten.
  - Both new head comments name the layer, what the file is and why it is shaped so.
  - Guides.svelte markup is one element per line.
  - No code is left unused by the moves (eslint and svelte-check are clean, and unused-exports shows no added line). The imports Tree.svelte kept, `TreeNav` (:290), `Attachment` (:309) and `untrack` (:231), are used.
  - The names `TreeProps`, `Props`, `guide`, `border-left` and the 16px-level grep have no false hit in src, tests, config (--exclude=local.yml), docs or README.md.
  - SessionWorkspace.svelte:13 "keeps its amber left edge" is true.
  - TimelineTurns.svelte:190 is unchanged, as the brief says.

### Behaviour

- **B1, the amber bar has no before stated.** O182-report.md:111 states the bar's square corner over the row's `--radius-sm` tint, and its cover of the left 1px of the focus outline (`outline: 1px; outline-offset: -1px`, TreeItem.svelte:316-320), only as the after.
  - Before: the amber was a 2px square border on `.row`, outside `.item`. The rounded tint and the whole focus outline began 2px to its right.
  - After: the bar lies over the tint's top-left and bottom-left corners and over the outline's left edge.

  The look needs both states to judge it.
- **B2, the tint moves left.** The hover and selection tint of every session and terminal row now starts 2px further left, at the list's row edge, level with the group rows' tint. Before, it started after the transparent border. The report's "start at it" implies this but does not say the tint moves.
- **B3, the Graph's pending and error lines are not stated.** CommitFiles.svelte:190-197 draws a commit's pending and error lines as depth-2 TreeItems with no padding.
  - Their twistie moves from 34 (2+32) to 18 (2+16).
  - The commit's file rows move from 30+Lp to 18+Lp.
  - So with lanes passing, the pending line now sits Lp to the left of the file rows. Before, it sat 4-Lp to their right.

  The report's general "a level was 16px and is 8px" covers the line's own move, but it states neither these positions nor the relation to the file rows. The look is: Repositories, Graph, a commit opened while its files are read, with lanes passing.

## Declined to judge

- `git diff --numstat`, which the report quotes: it is a git command outside my three. I compared the counts with `git diff 3e1d5f960 --stat` instead, and they match.
- `npx prettier --write` over the 11 files, which the report quotes: it writes files. The list's prettier line, `ok prettier ... All matched files use Prettier code style!`, covers the same claim.
- tests/checks/diagrams/diagrams.test.ts, run alone, failed on `Test timed out in 5000ms`. That is a timeout in a file the step does not change (spec.md:80), so it is not counted. I computed staleness with `staleFiles()` instead, which printed `[]`.
- Every on-screen state, which the brief leaves to the orchestrator's look at landing:
  - the Files tree two levels deep, hovered;
  - the Sessions list with a workspace and the Terminals group open, guides on the twistie centres;
  - a waiting session at rest, hovered, selected and keyboard-focused (the bar over the tint, its corner and its cover of the outline);
  - the Outline with nested symbols;
  - the Graph with a commit open and lanes passing;
  - the sessions sidebar's Changes section;
  - all of the above at text scale 1.25;
  - a narrow pane.
- Whether Chrome paints the `::after` bar over or under the `.item` focus outline: CSS paint order says over, but only a page shows it.
- How often the passing lanes of a commit's file rows differ in width from the commit's own lanes (Lanes.svelte:49-51). The step does not change this, and I did not measure it.
- An exhaustive search for rows drawn outside TreeItem that line up with a 16px level. I grepped `padding-left: calc`, `margin-left: calc` and `--inset` over src/lib/views, ui and shell, and `border-left: 2px` in files that import TreeItem, and found nothing beyond the brief's list. I did not read every tree file.


Usage: a4ff19f942d440a18, claude-opus-5-5, 181896 tokens, 54 tool uses, 812 s

## Repair round 1, refuted

### Refutation of O182, repair round 1 (worktree .agents/worktrees/migration-O182, base 3e1d5f960)

I changed nothing in the repository. My only writes were a width-measuring awk program and the output of unused-exports.sh, both in the session scratchpad. `npm run diagrams` rewrote docs/diagrams with the same bytes, and `git status --short` shows no tracked change from it.

Every round item holds. Every item of "What to build" holds. Every case is met by the widths I computed from the CSS. The verify list is green. All five findings of the first review are closed by changes, and no check was removed to close any of them. There are two new findings, both small and both fixable at landing. No further repair round is needed:
- P-r1: the step's file table still gives three line counts from before the round.
- B-r1: one visible change of round item 4 is stated without its before: the passing lanes are now drawn beside the pending and error lines.

### The round's delta

I ran `diff -u` of each path in files.txt, snapshot copy against worktree. Seven files changed in the round:
- comment rewraps in tokens.css:216-220, TreeItem.svelte:2-6, Tree.svelte:35-37, CommitRow.svelte:229-235 and Guides.svelte:22-28;
- the SessionWorkspace.svelte:242-244 comment reworded;
- in CommitFiles.svelte, the `said` snippet and the two render tags at :189-206, and the `.file` comment extended at :253-256.

TerminalRows, ChangesRepo, GraphHead and tree-props.ts are identical to the snapshot. `git status --short` lists no path outside files.txt except three ledger files under .scratch, which are untracked: the round brief, the refuter report and the builder's report.

### Checks, run from the worktree root

- **Diagrams.** `staleFiles()` from utils/diagrams/diagrams.mjs, called read-only, printed `[]`. `npm run diagrams` then exited with rc=0, and `git status --short` afterwards showed the same 9 `M` and 5 `??` paths as before.
- **Verify list.** `env -u TMPDIR npm run test:quick` (node v24.21.0) ran once and printed:
  - `test:quick: 14 changed file(s), from git since HEAD` and `test:quick: 12 test file(s)`
  - `ok prettier (1.1 s): All matched files use Prettier code style!`
  - `ok ASCII gate (1.2 s)`
  - `ok svelte-kit sync (2.7 s)`
  - `ok eslint (2.2 s)`
  - `ok svelte-check (10.6 s): ... COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
  - `ok vitest checks (60.3 s)`
  - `test:quick: 63.2 s; every command passed`
- **Gate 2.** `grep -rn -E "tree-guide-(gap|shift), " src` prints nothing (rc=1).
- **Gate 3.** The name grep prints 15 hits: tokens.css:214, 221 and 222; TreeItem.svelte:260 and 272; Guides.svelte:26, 30, 33, 34 and 36; TimelineTurns.svelte:190; ChangesRepo.svelte:140; GraphHead.svelte:80; CommitFiles.svelte:261; CommitRow.svelte:240. None is in tests, config, docs or README.md. This matches the round's claim, with CommitFiles at :261.
- **Gate 4.** `sh utils/unused-exports.sh` prints `Unused exports (226)` first. `diff ../O182-base/unused-exports.txt <output>` prints nothing (rc=0).
- **Gate 5.** `wc -l` gives 520 for TreeItem.svelte, 463 for Tree.svelte, 273 for CommitFiles.svelte, 43 for Guides.svelte and 76 for tree-props.ts. The folder `row/` holds 5 items and `control/` holds 10.
- **Gate 6.** The perl ASCII check of spec.md:103 over the 11 changed source files and the report prints nothing (rc=0).

### The round section's quoted evidence, rerun

- **Line counts.** I counted the `+` and `-` lines of `git diff 3e1d5f960 -- <file>`: CommitFiles +20 -9, CommitRow +6 -5, Tree +10 -80. The other rows read tokens +7 -0, TreeItem +14 -34, GraphHead +3 -3, ChangesRepo +1 -1, SessionWorkspace +12 -3 and TerminalRows +2 -2. All match O182-report.md:136.
- **Width table.** My awk prints each comment line's width and the width with the next line's first word added. Every row of the report's table (O182-report.md:156-168) matches. The numbers are under round item 2 below.
- **History-word grep.** I grepped the added lines of `git diff 3e1d5f960 -U0 -- src` and the two new files, with "rather than" added to the word list. There is one hit, Guides.svelte:25 "The gap before a guide", which is spatial. That matches the report.
- **Docs grep.** `grep -rn -i -E "indent guide|indent|twistie|amber" docs README.md` prints four hits: docs/decks.md:91, docs/HELP.md:31, :302 and :573. This matches P1 as now reported, and none of them is about a tree level.
- **svelte-check file count.** The round quotes 592 files, and my run prints the same.

### Round item 4, read in full (CommitFiles.svelte, 273 lines)

**Markup.** The `said(label, tone)` snippet (:189-198) draws `<li role="none" class="file">`. Inside it come `<Lanes {passing} {open} />` when `passing.length > 0`, then `<div class="item">` holding `<TreeItem {label} depth={1} {tone} />`. That is the same frame as a file row (:208-212), which is `depth={1 + row.depth}` with `row.depth` 0 at the top in both list and tree mode.

**Positions.** The frame's padding is `8s + 2g` (:261), and g is 0. TreeItem's `.main` has a 2px left padding in both its text form and its button form (:331), with a 4px gap (:346, :362). A guide is `8s` wide with margins 0 and -4 (Guides.svelte:30-34). So the twistie slot starts at `8s + Lp + 2 + 8s`:

| Line | Scale 1, lanes passing | Scale 1, no lanes | Scale 1.25, lanes passing | Scale 1.25, no lanes |
| --- | --- | --- | --- | --- |
| Pending or error line | 18 + Lp | 18 | 22 + Lp | 22 |
| A top file row of the commit | 18 + Lp | 18 | 22 + Lp | 22 |

The two lines coincide in every column. Before the round they did not: the line sat at 18 (2 + 2*8) whatever the lanes. On the base it sat at 34, against file rows at 30 + Lp. This reproduces O182-report.md:205.

**Role.** The `li` is `role="none"`, as the file rows (:208) and the GraphHead rows (:41, :53) are. Its TreeItem has no `level`, so no treeitem role (TreeItem.svelte:182), the same as on the base. The accessibility tree does not change.

**Keyed list.** The `{#each rows ... (key)}` block at :207 is unchanged. The snippet is drawn outside it, inside the `{#if}`. The snippet reads `passing` and `open` from the component's props, so it updates with them. `data-commit-file` has no reader anywhere in src or tests (grep printed nothing), so leaving it off these two lines changes nothing.

**Practice of the tree.**
- Typed snippet parameters are the tree's norm: `grep -rn -E '\{#snippet [a-zA-Z]+\([a-zA-Z]+: '` gives 179 hits.
- A snippet that draws a whole `li` has a precedent in RefactorPreview.svelte:104 and :138.
- The two `eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position` comments match, word for word, the 168 occurrences of `grep -rn`. They are needed: eslint.config.js:40 sets `reportUnusedDisableDirectives: 'error'` and :108 sets `svelte/comment-directive` with `reportUnusedDisableDirectives: true`, so an unneeded directive would fail the lint, and the list's `ok eslint` shows neither fails.
- The markup is one element per line.

### Verdicts per item of the round's brief

1. **Holds.** tokens.css:216-220 now reads "A row multiplies the shift by `--text-scale` and not the gap". That is true: the shift is multiplied at Guides.svelte:36 and the gap is not at :33-34. The false clause is gone. "Anything in the brief that was wrong" names it at O182-report.md:108 and :219.
2. **Holds.** No line inside an edited paragraph takes its next word within column 100. Widths after the change, then the width with the next word:
   - tokens.css:216-220: 96, 100, 100, 98, 26; with the next word 101, 104, 106, 105.
   - TreeItem.svelte:2-6: 96, 98, 99, 100, 65; then 103, 105, 104, 105.
   - TreeItem.svelte:259-262: 97, 98, 97, 58; then 103, 101, 103.
   - Tree.svelte:28-38: 98, 90, 96, 98, 100, 93, 96, 95, 95, 93, 29; then 114, 102, 103, 104, 110, 101, 102, 105, 101, 116.
   - Tree.svelte:423-424: 100, 91; then 104.
   - SessionWorkspace.svelte:242-244: 96, 100, 45; then 102, 104.
   - TerminalRows.svelte:147-148: 98, 25; then 101.
   - CommitFiles.svelte:253-256: 97, 97, 97, 100; then 102, 101, 101.
   - CommitRow.svelte:229-235: 98, 98, 99, 100, 98, 99, 47; then 102, 102, 103, 104, 106, 107.
   - GraphHead.svelte:71-75: 96, 98, 99, 95, 92; then 101, 104, 105, 103.
   - Guides.svelte:2-5: 95, 100, 98, 99; then 102, 103, 104.
   - Guides.svelte:22-28: 99, 100, 100, 97, 100, 95, 75; then 102, 107, 103, 104, 107, 101.
   - tree-props.ts:1-5: 99, 93, 100, 98, 84; then 109, 103, 107, 108.

   The `--row-least` paragraph at TreeItem.svelte:263-268 has two lines whose next word would fit (264 and 267, each 99 with it), but the step did not edit that paragraph (it is context in `git diff 3e1d5f960`), so it is outside spec.md:45.
3. **Holds.** SessionWorkspace.svelte:242-244 reads "a 2px amber bar laid over the row's left edge, so it takes no width, ...". No "rather than" phrase is left in any added line.
4. **Holds.** See the section above: the line starts where a file row starts, with and without lanes, at scale 1 and 1.25.
5. **Holds**, with P-r1. B1 is at O182-report.md:209, B2 at :210 and P1 at :211-215, and all three match my reading and my run.

### Verdicts per item of "What to build" (whole diff since the base)

1. **Holds.** tokens.css:221-222 declares the two tokens beside `--tree-indent`, and the comment is now true. TreeItem.svelte:272 and Guides.svelte:33-36 read them with no fallback (gate 2 is empty). The level comment sits with its rule at Guides.svelte:22-28. TreeItem.svelte:259-262 names both tokens and says which are multiplied, and that is true: the heading font at :509, the row height at :277 and the indent at Guides:30.
2. **Holds.** Tree.svelte:423-430 sets neither measure and keeps `--tree-end-inset: 16px`. Its comment says what the rule sets.
3. **Holds.** CommitFiles.svelte:261, CommitRow.svelte:240 and GraphHead.svelte:80 use the level formula. ChangesRepo.svelte:140 has no fallback. The comments are true, and CommitFiles now also covers the pending and error lines.
4. **Holds** by reading. Neither `.row` rule has the border any more. `.row` is `position: relative` (SessionWorkspace.svelte:232), and `.row.input::after` is absolute, `inset: 0 auto 0 0`, `width: 2px`, `pointer-events: none`. TerminalRows.svelte:147-148 is true.
5. **Holds.** Guides.svelte holds the derived array, the `each` and the `.guide` rules, and TreeItem draws `<Guides depth={levels} />` where the `each` stood. tree-props.ts holds `TreeProps`. Both head comments name the moved part, and both new files open with a Layer 3 head comment. TreeItem is 520 lines and Tree is 463.

### Verdicts per case (s = text scale, g = 0, one level = 8s, the shift = 8s)

1. **Files tree: met, unchanged.** The guide of level k is at 10 + 8k at s=1 and at 12 + 10k at s=1.25. Each is the centre of the depth-k twistie, which starts at 2 + 8ks and is 16s wide.
2. **Sessions list: met by computation.**
   - At s=1, a depth-2 session row's twistie is at 2 + 16 = 18, which is 16 in from the depth-0 head's at 2. Its guides at 10 and 18 are the centres of the twisties at 2-18 and 10-26. A terminal row (depth 2, no border) starts at the same edge.
   - At s=1.25 the twistie is at 22, which is 20 in.
3. **Waiting session: met by reading.** The bar is out of flow and is positioned last in tree order, so it paints over the `.item` tint, `--chip` on hover and `--accent-bg` when selected. The words do not move when it comes or goes.
4. **Outline: met.** At s=1 the depth-1 twistie slot is at 10, which is 8 in from depth 0's at 2; at s=1.25 it is at 12, 10 in. Nothing outside Tree.svelte's `.arrowless` sets `--tree-leaf-twisty`, so a leaf symbol keeps its slot.
5. **Graph: met.**
   - At s=1 the commit row's and the head's padding is 8. The commit's twistie is at 10 + L, where a depth-1 row's twistie (10) is, moved right by the lanes.
   - A file row's twistie is at 18 + Lp, 8 under the commit's when Lp = L. The pending and error lines are now at 18 + Lp too.
   - At s=1.25 the paddings are 10, the commit's twistie is at 12 + L and a file row's at 22 + Lp.
   - The difference between Lp and L comes from Lanes.svelte:49-51, which the step does not change. The report names it.
6. **ChangesRepo: met.** At s=1 the inset is 2*8 + 16 + 6 = 38, and a group row's words are at 2 + 2*8 + 16 + 4 = 38.
7. **Scale 1.25: met.** A level is 10, the shift 10, the Graph paddings 10, and the ChangesRepo inset 20 + 20 + 6 = 46, against the words at 2 + 20 + 20 + 4 = 46.
8. **Narrowed row: met.** `--row-least` is `d*8s + 2*(16s+4) + 4ch + 6px`. Outside the Files tree it was `d*(8s+8) + ...`, so it is 8px less per level.

### Findings

#### Spec

None. The round made no change beyond its five items. The new sentence of the CommitFiles `.file` comment is what item 4 needs, and the snippet is the smallest form that draws the frame once. No check, test or allow list was changed: `git status --short` shows no path under tests, utils or config.

#### Proof

- **P-r1, O182-report.md:73, :75, :76.** The step's file table still reads:

  `| src/lib/views/shared/explorer/tree/Tree.svelte | +8 -78, 463 lines | yes |`, `| ...CommitFiles.svelte | +4 -3 | yes |`, `| ...CommitRow.svelte | +4 -3 | yes |`

  `git diff 3e1d5f960` now gives +10 -80, +20 -9 and +6 -5, as the round section itself says at :136. So the report gives two different counts for the same three files, which breaks spec.md:14 ("a figure from before it is taken again or removed"). The failure scenario: the orchestrator copies the table into the landing booking and records counts that do not match the cherry-picked commit. No decision rests on the counts. A fix at landing is to update the three rows.

#### Standards

None in the delta. The checks behind that:
- Every edited paragraph is rewrapped (the widths above).
- There is no history word or contrast construct.
- The markup is one element per line, and the snippet's types, the `li` role and the eslint directives follow the tree's practice (cited above).
- The changed files are all ASCII.

#### Behaviour

- **B-r1, CommitFiles.svelte:189-198.** The hunk:

  ```svelte
  {#snippet said(label: string, tone: 'error' | 'muted')}
      <li role="none" class="file">
          {#if passing.length > 0}
              <Lanes {passing} {open} />
          {/if}
  ```

  Besides the move, the round adds a visible change. On the base, and after the step, the pending and error lines drew no lanes, so a lane that passes the open commit broke for one row height while that commit's files were being read, or after a read that failed. Now the lane verticals, 3px on the open commit's lane, run through that row. The report says only "its lanes drawn beside it", in the look line at O182-report.md:205, and states no before. The step's list of "User-visible changes, before and after" (:97-103) does not mention these lines. Under spec.md:61 the before-and-after section is what the look is read against. The failure scenario: the look sees continuous lanes beside "Reading..." and has nothing to judge them against, or takes them for a stray drawing. The change itself is the one the round asked for ("the passing lanes included"), so this is a missing sentence and not a defect in the code. A fix at landing is one bullet in the round section.

### Declined to judge

- `git diff --numstat`, which the report quotes: it is a git command outside my three. I counted the `+` and `-` lines of `git diff 3e1d5f960 -- <file>` instead, and they match.
- Every on-screen state. These are for the orchestrator's look at landing:
  - Repositories, Graph, a commit opened while its files are being read, and a commit whose read fails, each with lanes passing and with none. The line should start where the file rows start, with the lanes continuous beside it.
  - The Sessions list with a workspace and the Terminals group open, and a waiting session at rest, hovered, selected and focused by the keyboard.
  - The Files tree two levels deep, hovered.
  - The Outline with nested symbols.
  - The sessions sidebar's Changes section.
  - All of the above at text scale 1.25.
  - A narrow pane.
- Whether Chrome paints the `::after` bar over the `.item` focus outline. CSS paint order says it does, but only a page shows it.
- Whether a pending line's label lines up with a file row's name. The file row has a Seti icon and the pending line has none, so the words differ by the icon's box. The brief and the round speak only of where the row starts, so I did not judge the words.
- How often a commit's passing lanes differ in width from its own lanes (Lanes.svelte:49-51). The step does not change this, and I did not measure it.

Usage: adb4c0871606a1a9d, claude-opus-5-5, 161585 tokens, 32 tool uses, 366 s

## Closed

- First run, St1, Sp2, St2, St3, B1, B2, B3, P1: closed in repair round 1, each holding in the review over the round.
- Sp1: the brief's premise sentence was wrong (2px left, not right, on the unchanged tree); nothing built depends on it, and the landing booking names it as a premise correction.
- Round 1, P-r1: the three rows of the report's file table updated at landing to the counts of `git diff 3e1d5f960`.
- Round 1, B-r1: one bullet added to the report's round section at landing: the passing lanes now run through a commit's pending and error lines, which broke for one row before; the look judges both.
