# O119 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O119, the Transcript's right-click, tool-call runs and the import cycle, landed. Next: O120, a card takes no height for its controls and Career has colour.

## Open items

None.

## The check of Steps 1

`ListAgents` lists no agent of O119 running.

## NOT DONE

A pressed run through Live and Transcript and through a terminal's end were not seen on a page: the scratch sessions are ended, so Live is off, and no terminal could be run there. A session switch away and back was not pressed either; it stands on reading. A press on a cut run was run on `carryChoices` in a throwaway test in the gate, not on a page. A long press was not tried, no touch device being available. The menu key was raised by a synthetic keydown.

## What landed

The Transcript has one menu around the whole list with Copy for a selection, in a person's turn, on a call's row and across rows. A run's press is held by the tab under the run's first call, so it stands through a read, and a press on a cut run moves to the run's key at the first draw that holds it. A long press opens no `read` menu. `Cards.svelte` and `NestedCards.svelte` no longer import each other as values. The help page and the diagrams changed with it. Sixteen paths.

## The look

Scratch server on port 8797 from the gate, fixtures of 960 turns and of one run of 500 calls, dark and light not switched, the step touching no theme.

- A word selected in a person's turn: right-click gives one menu, Copy.
- A selection from a person's turn into the answer: one menu, Copy; `getSelection` holds both rows' words.
- A word on a call's row: one menu, Copy.
- The menu key on a code block's Copy with a selection in that answer: one menu, Copy.
- Owed press, a code block's Copy: reads Copied.
- Owed press, the Markdown export: the link the row's press makes answered 200 with a `.md` attachment of 163959 bytes starting with a heading; the browser's save was held back.
- Owed press, a refused value in the `terminal.transcript_font_px` row: -5 shows "It must be a number from 6 to 40."
- Nested cards in Settings, `editor.languages`: cards draw, and Add on `rulers` inside a card draws its row. No console error.

## What was found

First review: three limits and two corrections, closed in repair round 1. Run over round 1: Behaviour 1, a press on a cut run was carried only for a run at the top of the list, fixed at landing with `carryChoices`; Spec 1, the long press is stopped by leaving bits-ui's handler off, in place of the ruled handler, kept for the reasons in the booking. Limit that stands: maximising a pane that shares its page unmounts `Terminal.svelte`, so the presses read as never pressed, as on the base.

Gate: `test:quick: 63.5 s; every command passed`, `checks: 1 commands passed`. `git diff --cached` on main equals the gate's under `cmp`.

## Usage

Builder 248329 tokens, 80 tool uses, 18 min 1 s; round 1 303137 tokens, 46 tool uses, 8 min 30 s. Brief check 219620 tokens, 35 tool uses, 10 min 36 s. Reviewer 226856 tokens, 23 tool uses, 11 min 6 s (Spec 0, Proof 1, Standards 1, Behaviour 3). Reviewer over round 1 192612 tokens, 24 tool uses, 7 min 29 s (Spec 1, Proof 0, Standards 0, Behaviour 1). All claude-opus-5-5. Full-list runs by the builder, from its report: 2 and 2. The first report did not pass its bar; one fix at landing.

## Next

/spec O120.
