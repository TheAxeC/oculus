# O116 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O116, a transcript's first read takes only the end of the file, landed. Next: none queued.

## Open items

- Open item 629: the transcript and the grid share one size setting; the text stands in `orchestrator-state.md`.

## The check of Steps 1

`ListAgents` lists no agent of O116.

## NOT DONE

- The Markdown export was not pressed on 8790; it was measured over `node:http` in the reviews (first byte 18 ms, end 574 ms on a sparse 1.5 GiB file).
- A line longer than a piece is parsed in one stretch (about 296 ms for 256 MiB), and `JSON.stringify` of a large answer from a small offset runs in one stretch.
- A first read shows only what the last 32 MiB hold, with no sign of older turns.
- A first read or a read from an offset runs on after its client leaves; the export stops.
- `tests/checks/imports/cycles.test.ts` fails at the base on Cards.svelte and NestedCards.svelte; the step does not change those files.

## Landed

See O116's booking in `plan.md`: 11 paths.

## Verification

`npm run diagrams && npm run docs:palette && npm run test:quick` in the gate: "test:quick: 172.8 s; every command passed"; staged diffs equal.

## Usage

Brief check 190927 tokens, 20 tool uses, 9 min 34 s; builder 156943 tokens, 18 tool uses, 4 min 56 s, round 0 resumed 231426 tokens, 66 tool uses, 16 min 5 s, round 1 298732 tokens, 61 tool uses, 8 min 22 s; reviewer 208975 tokens, 23 tool uses, 11 min 27 s; reviewer over round 1 218691 tokens, 26 tool uses, 11 min 9 s. The first report did not pass its bar.
