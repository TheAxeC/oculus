# O115 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O115, the transcript reads as a conversation, landed. Next: O116, a transcript's first read takes only the end of the file.

## Open items

- Open item 629: the transcript and the grid share one size setting. (a) a key of its own, `terminal.transcript_font_px`, recommended; (b) keep the one setting and the 12 px floor, the lazy option. The text stands in `orchestrator-state.md`.

## The check of Steps 1

`ListAgents` lists no agent of O115.

## NOT DONE

- A code block's Copy was not pressed in the transcript: the live tail on 8790 held no block.
- A pressed run closes again when the session moves from a terminal to none, since the view is drawn anew; seen once on 8790.
- `.calls` cuts a long command at 80 columns with the rest in the title; answers lose the browser's right-click menu; Text scale does not resize the transcript above the floor.
- `tests/checks/imports/cycles.test.ts` fails at the base on Cards.svelte and NestedCards.svelte; the step does not change those files.
- Opening a session reads its whole file; step O116.

## Landed

See O115's booking in `plan.md`: 19 paths, the turns told apart, answers through Markdown, runs of tool calls as one row, the size floor.

## Verification

`npm run diagrams && npm run docs:palette && npm run test:quick` in the gate: "test:quick: 84.3 s; every command passed"; staged diffs equal.

## Usage

Brief check 241923 tokens, 22 tool uses, 10 min 27 s; builder 280197 tokens, 81 tool uses, 20 min 27 s, round 1 318518 tokens, 39 tool uses, 5 min 17 s; reviewer 244101 tokens, 32 tool uses, 13 min 5 s; reviewer over round 1 188456 tokens, 25 tool uses, 7 min 14 s. The first report did not pass its bar.
