# O121 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O121, a chip row takes no height for its controls, landed. Next: step O122, a Transcript draws only what is in view, once open item 634 is ruled.

## Open items

Open item 634 (2026-11-02), step O122, from its brief check: five parts on what a windowed Transcript changes; the full text is in `orchestrator-state.md` and in O122's Step 0 in `plan.md`.

## The check of Steps 1

`ListAgents` lists no agent of O121 running.

## NOT DONE

Finding B5 is not fixed: a remote card can use a stale width under the same id for one frame. A first paint with no frame of movement was judged from the rendering order and the look's sampling, not from a frame-by-frame capture of first paint.

## What landed

A card whose chips leave no room for its controls draws them over its top right corner, on a screen that hovers, so the card keeps its height. A row with room for them keeps them on the chips' line. `stripWidth` in `card-layout.ts` replaces `leastStrip`, `Card.svelte` holds the row to the right, and Usage's control sits in the corner under hover.

## The look

Scratch server on port 8797 from the gate, dark theme. Registries Data: a wide card under the pointer kept them on the chips' line, position static, height 120 unchanged. A 100px card and a 190px card with four added chips, under the real pointer: `over start`, the controls in the corner on the card's colour, and the meta rows read 18.5 and 67.5 in each of 207 sampled frames, with card heights 188.5 throughout. Menu open on the 190px card: six items, opened by the opener, meta row still 67.5, controls stay drawn. Usage: the refresh control in the card's corner under hover. Career: the strategy card with its blue outline draws its controls in the corner, and Postdoc under the pointer the same.

## Checks

`land.sh` on main: `test:quick: 46.4 s; every command passed`. `npm run diagrams && npm run docs:palette && npm run test:quick` in the gate: `test:quick: 45.9 s; every command passed`. It does not cover tests that reach no changed file, the build, or the lint of unchanged files. No A/B: the configuration block has no `bench:` line.

## Usage

Builder first run 151456 tokens, 16 tool uses, 6 min 33 s; build 196620 tokens, 51 tool uses, 12 min 53 s; round 1 233859 tokens, 37 tool uses, 4 min 5 s. Brief check 192629 tokens, 20 tool uses, 8 min 23 s. Reviewer 198891 tokens, 25 tool uses, 9 min 24 s. Reviewer over round 1 187244 tokens, 28 tool uses, 8 min 11 s. The first report did not pass its bar, closed in round 1; two fixes at landing.
