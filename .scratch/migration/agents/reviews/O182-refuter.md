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

Usage: (filled by the session)

Usage: a4ff19f942d440a18, claude-opus-5-5, 181896 tokens, 54 tool uses, 812 s
