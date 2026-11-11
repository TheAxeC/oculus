# O182 landing

Position: the oculus migration, step O182 (every tree indents as the Files view) landed. Next: the whole suite once with nothing else running, then `npm run app:release` for v1.1.0, the tag and upload waiting for Axel's word on the push; O184 after that.

Open items: none.

## Check of Steps 1

The runner's agent listing (ListAgents) showed no subagent of this session, so no builder, reviewer or brief-check agent of the step was running.

## Not done

Everything in the brief is done.

## What landed

The whole range `3e1d5f960..migration-O182` (one wip commit 4408beea2) with the fix at landing below, 11 paths, 196 insertions and 137 deletions. The tree measures `--tree-guide-gap: 0px` and `--tree-guide-shift: calc(var(--icon-box) / 2)` are tokens in `tokens.css`, read by `TreeItem.svelte` with no fallback, so every tree's level is the 8px indent and its guide stands at the parent's twistie centre; `Tree.svelte` no longer sets them. The Graph's three paddings (`CommitFiles.svelte`, `CommitRow.svelte`, `GraphHead.svelte`) take the level formula, and `ChangesRepo.svelte` reads the gap with no fallback. A commit's pending and error lines take the file rows' frame and the passing lanes. The session and terminal rows lose their 2px border, and the waiting mark takes no width. `TreeItem.svelte` (520 lines) and `Tree.svelte` are split into `ui/tree/row/Guides.svelte` and `explorer/tree/control/tree-props.ts`.

## Fixes at landing

- The report's file table updated to the counts of `git diff 3e1d5f960` (round 1 P-r1).
- A bullet in the report's round section: the passing lanes now run through a commit's pending and error lines, which broke for one row before (round 1 B-r1).
- The waiting mark of `SessionWorkspace.svelte` (look): a full-height square 2px bar laid over the row stood with its ends outside the 6px rounded corners of the row's selection tint and focus outline. It is now a 2px bar inset 4px from the row's top and bottom with 1px rounded ends, inside the corners in every state, its comment saying so.

## Found

- Premise correction: on the unchanged tree the guide sat 2px left of the parent's twistie centre, not right as the brief said (Sp1). Nothing built depends on it.

## Verification

In the gate at main's head with the range: `npm run diagrams && npm run docs:palette && npm run test:quick`, "test:quick: 59.1 s; every command passed", 11 changed files, svelte-check 592 files 0 errors. Rerun after the fix at landing: "test:quick: 52.0 s; every command passed", 12 test files, svelte-check 592 files 0 errors. The diagrams and the palette regenerate to the staged copies. Main's index and the gate give the same tree under `git write-tree`, `87216f901eb9364546f1ab5ebb0b2c38fb9879ba`. No benchmark is on this plan's list, so there is no A/B.

## Look

Scratch server 8797 from the gate, HOME in the session scratchpad. Two stand-in sessions (a transcript and a registry entry for a `sleep` process each) and a notification hook posted to the scratch server gave a waiting session; a side branch set as master's upstream in the scotoma copy gave lanes passing; a stub of `fetch` in the page held a commit's file read back or answered it with an error.

- Files tree two levels deep, hovered: levels of 8px (twisties at 640.8 and 648.8), the guide line at the parent's twistie centre, the hovered row tinted whole.
- Outline of `hooks.server.ts`: symbol levels of 8px (640.8 to 664.8), a leaf keeping its twistie slot.
- Sessions list with a workspace and the Terminals group open: session and terminal rows at depth 2 (twistie 83), guides at 75 and 83.
- The waiting session at rest, hovered, selected and keyboard-focused: the bar shows over the hover and selection tints and, after the fix, stays inside the rounded tint and focus outline; its name stands at 103, as the row beside it.
- Graph: a commit's twistie at 74.9 plus its lanes (97 with one lane, 108 with a lane passing); a file row, the pending line "Reading the graph" and the error line "The graph could not be read." each one level under their commit (105, and 116 with a lane passing), the lanes continuous beside them.
- Sessions sidebar's Changes section: the lines at the 38px inset, under the change groups' words (103).
- Text scale 1.25: levels of 10px (67, 77, 87), the Graph's lanes at 75 and a commit's line 10px under it (104.5 to 114.5), the Changes inset 46px.
- A pane narrowed to 180px: no row runs past its edge.

The stand-in processes were ended, their registry entries and transcripts removed, the side branch deleted and the scotoma copy's config restored from its backup, the server stopped and its tab closed.

## Agents and fixes

Builder ac185986d79ef7d8f: 187726 tokens, 73 tool uses, 688 s; round 1 231019 tokens, 30 tool uses, 430 s. Brief check a141355f691370c1f: 183093 tokens, 52 tool uses, 495 s. Reviewer a4ff19f942d440a18: 181896 tokens, 54 tool uses, 812 s; over round 1 adb4c0871606a1a9d: 161585 tokens, 32 tool uses, 366 s. All on claude-opus-5-5. The first report did not pass its bar; repair round 1 and the fixes at landing above closed it.
