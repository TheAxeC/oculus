# O117 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O117, the transcript's own text size, landed. Next: none queued.

## Open items

None.

## The check of Steps 1

`ListAgents` lists no agent of O117 running.

## NOT DONE

A refused value typed into the Settings row was not pressed on the page; the write path's refusal was run in the report and the row and help were seen. The look ran before a type-only change to `sends`, which the gate covers.

## What landed

- `terminal.transcript_font_px`, reader, option row, ui store reader and setter, one clamp and rounding for both keys.
- The transcript's size is the key, or `--fs-sm` times the text scale; the floor is gone and `font_px` sizes the grids alone.
- The bar's buttons act on what the tab shows and name it; reset takes out only that key.
- Fix at landing from the look: `writeOption` and `resetOption` send one key's writes in order (`inTurn`), and a write a later one replaced before its turn is not sent. This covers every option.

## Verification

Gate: `test:quick: 70.8 s; every command passed`. `git diff --cached` on main equals the gate's under `cmp`.

## Usage

Builder 217253 tokens, 87 tool uses, then 248236 tokens, 39 tool uses in round 1. Brief check 188468 tokens, 25 tool uses. Reviewer 173025 tokens, 21 tool uses. Reviewer over round 1 195850 tokens, 29 tool uses. The first report handed back one case and passed; three fixes at landing, named in the booking.
