# Q86b landing

oculus migration, step Q86b (the Map's drag after neato's placement), landed 2026-09-29. Next: Q103 at the free slot.

## Open items

- **Z58 (2026-09-29), Q86b, the slide along a contact that a real pointer move resumes.** A neighbour pressed against another circle slides slowly along it, the settle stops while it is still sliding, and each real pointer move of a pixel or more resumes the slide: 46.38 units on seed 2 `line::a` 200 over 60 events alternating 1.2 units, 2.57 on seed 1 `line::c` 200. Removing a pushed node's whole speed at a contact measured 2.18 and 0.90, no overlap, settles of 1476 and 1288 frames in place of 864 and 596. (a) Recommended: step Q86c removes the whole speed at a contact, with that case as its test and the look on TEST. (b) Leave it as landed, the lazy option.

## The check before landing

The builder and every reviewer of Q86b had ended: the agent listing showed only D13b's and Q83's builders.

## NOT DONE

- The press on a mover while the last drag still settles was not seen in the page: the tool's next action came after the settle had stopped. It is covered by the case 'holds a pressed node where the press caught it while the last settle finishes', red without the change.

## What landed

The drag without repulsion or centre pull, the push keeping circles apart and removing a pushed mover's speed into the contact, the settle at a fixed step, the press that finishes a running settle with the pressed node held, the one-pixel pointer guard, the grab offset, the pointer mapping through the letterbox and the pan, and labels kept off every circle. 16 files, 944 lines added, 253 removed. The booking in `plan.md` under Q86b names each part.

## Found

- Fixes at landing: the diagrams' conflict with main, resolved by `npm run diagrams`; the sentences of `DESIGN.md:291` and `Graph.svelte` on a resting pointer; the cooling-budget clause in `graph.ts`.
- Raised: Z58.
- The look: a pillar dragged 193 px right and 139 px up rests under the drop point, its neighbours moved a few pixels, no circle overlapping, and no node moved in the 8 s after the drop. A label (BSA-ECoG) is still crossed by an edge.

## Verification on main

`npm test`: 15 files failed with timeouts at load average 11.6, each passing alone (listed in the booking). Then `npm run check` `COMPLETED 2130 FILES 0 ERRORS 0 WARNINGS`, build, format:check, lint and the ASCII gate each exit 0; `bin/folder-check.sh` exit 0.

## Usage

Brief check 50 tool uses, 182k tokens, 8 min. Builder: first run 41 tool uses, 196k tokens, 14 min; build 84, 279k, 50 min; round 1 18, 313k, 10 min; round 2 30, 64k, 20 min. Reviewers: 38, 193k, 12 min; 31, 178k, 14.5 min; 32, 198k, 15 min. The first report did not pass its bar; three fixes at landing.
