# O157 landing

Position: roadmap entry migration (oculus's migration plan), step O157, a slide laid out from its content. Next: O158, the Project facts strip redesigned, its design shown to Axel as screenshots before it lands; then O150 and O151.

Open items: none.

The check of Steps 1: the builder a928a4ae4b2a98ab4 and both reviewers had finished before the landing; no agent of the step was running.

NOT DONE: nothing of the step. The research hub's `deck/present.yml:19` `sort: folder` removal, from O155, waits on Axel's word for its hub commit.

## What landed

O157 landed on main from base 8a157c780, the whole range (the wip commit 494144429), 19 paths counted without renames, on top of 19b77017f with no conflict.

- `src/lib/views/academic/present/screen/slide-layout.ts` places a slide's figures as one block (one alone, side by side or stacked, whichever draws them larger): a tall block is a column at the room's right, a wide block sits under the text, and a slide with no text gives the block the whole room.
- `Slide.svelte` measures the drawn slide, lays it out with the text between 0.75 and 1.25 of the type scale, and raises Too tall only for text that does not fit at 0.75.
- The Stage, the Overview tiles, the presenter screen, the audience window and the print page draw a slide the same way; `docs/decks.md` says so.

## What was found

The builder's first report did not pass its bar. The review (`agents/reviews/O157-refuter.md`) found seven findings, and repair round 1 (`agents/briefs/O157-round-1.md`) closed them. The review over round 1 found five findings.

Fixes at landing, four:

- Round 1 review, Spec 1: a text slide with a heading and a tall Markdown image still ran past its frame. The image's cap is now lowered once by the overrun in `Slide.svelte`'s `draw`.
- Round 1 review, Spec 2: the ledes of the title, section and grid kinds now carry `data-room`, so an image there is held under the heading.
- Round 1 review, Standards 2 and Behaviour 1: the key hint's height past the frame's bottom padding is now kept at the reading column's foot and taken off the room, so no line of the hint runs past the frame.
- Found at the look: on five project decks (BSA-ECoG, BT-FNO, BTTR-AF, Cirrhosis-CR, Fed-Multicellular) the figures were drawn 14 by 14 px above the room, because captions measured at a narrow width left the block no scale. `slide-layout.ts` now draws the images at the size the room allows them alone and never chooses a column of no width. BT-FNO's figures are 250x257 and 759x257 px after the fix.

Recorded, no change: the report's flush count was seven a try by reading where it said five (Proof 1), and the builder ran more verify runs than the round brief asked for (Standards 1).

## Verification

Gate worktree `.agents/worktrees/gate` at 19b77017f, `git cherry-pick -n 8a157c780..migration-O157` with the fixes, `npm run diagrams && npm run docs:palette && npm run test:quick` (`.agents/worktrees/gate-O157-2.log`, no other vitest or svelte-check running at its start):

- "test:quick: 19 changed file(s)", "test:quick: 10 test file(s)"
- "ok prettier", "ok ASCII gate", "ok svelte-kit sync", "ok eslint"
- "ok svelte-check (16.8 s): ... 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS"
- "ok vitest", "ok vitest slow", "ok vitest checks"
- "test:quick: 61.9 s; every command passed"
- `npm run build` exit 0.

The layout module's case run C1 to C9 under Node prints the report's 16 lines. The same range on main with the fixed files copied, and `cmp` of the two `git diff --cached --no-renames 19b77017f` outside the ledger, printed SAME (19 files). Not covered: tests that reach no changed file within the import depth.

## The look

Scratch server on 8797 from main, HOME under the scratchpad's O138look. A scratch look deck was put in the hub copy for the look and removed after it.

- At 1280x720, both text slides with a tall image fit at 1.25, the image 288 and 171 px tall.
- A 720 px portrait frame at text size 1.5 draws the key hint in 2 lines, ending 5.5 px inside the frame.
- A 400 px frame at 1.5 draws a 107 px hint, 44 px past the padding, ending 0.8 px inside the frame with no scroll; the facts strip ends where the hint starts.
- 16 of the 25 project decks are Too tall, the same 16 as open item 693. Each has text that does not fit its room at 0.75: text of 546 to 1092 px against a 435 px room, or text-only slides 272 to 463 px over. Under the step's rule that is Too tall.
- The Overview of the portfolio deck's 32 tiles laid out in 673 ms alone, and in 1022 and 1095 ms with the gate's tests running beside it.
- The scratch `.oculus` equals its backup after the look, and the server is stopped.

No A/B (no `bench:`).

## Agents

| Agent | Role | Model | Usage |
|---|---|---|---|
| a928a4ae4b2a98ab4 | builder | claude-opus-5-5 | 125104 tokens, 174 tool uses, 42.8 min; round 1: 271934 tokens, 126 tool uses, 26.5 min |
| ab20efa6321dbf728 | brief check | claude-opus-5-5 | 190352 tokens, 47 tool uses, 9.2 min |
| a90de74f922bc0f23 | reviewer | claude-opus-5-5 | 238527 tokens, 66 tool uses, 28.8 min |
| ae1d580808535f263 | reviewer over round 1 | claude-opus-5-5 | 246421 tokens, 50 tool uses, 14.4 min |

## Next

O158, the Project facts strip redesigned, with its design shown to Axel as screenshots before it lands; then O150 and O151.
