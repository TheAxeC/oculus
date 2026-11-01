# O113 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O113, Timeline is a section of the Session view, landed. Next: O114, one Terminal view for a session.

## Open items

None.

## The check of Steps 1

`ListAgents` shows O113's agents as ended before the worktree was committed; the last reviewer's row reads completed.

## NOT DONE

- The saved layout's `timeline` tab in `~/.oculus/layouts.json` stands until O114's landing, which changes it with the `transcript` tab; until then it draws as "Unknown view: timeline" on a build holding this step.
- The drag of a section head with the mouse and a pick in a folder-limited list were not pressed in the look; the drag shares `createListDrag` with Alt+Up and Alt+Down, and the pick is read and held by `open-keep.test.ts`.

## What the look saw (scratch server on 8797, a scratch HOME)

- Four sections in the order Details, Changes, Timeline, Agents; the head counts the turns; rows 12px, clocks 11px; box 329px at a window of 823px.
- Past the event cap: "Before the first prompt" heads the list. A session with no events: head 0 and the empty sentence.
- Scrolled up, a push of six events left `scrollTop` at 100; at the foot a push followed. Scrolled up, a pick of the empty session and back stands at the foot; a pick with Files on top stands at the foot when the Session tab shows.
- Close and reopen stand at the foot. Alt+Up and Alt+Down kept `scrollTop` 70; after `focusKept` repeated presses move on and the order survives a reload.
- The Agents head is reachable. A saved `timeline` tab reads "Unknown view: timeline".
- O112's owed look: rice gives heads and sub-heads 10px, the view in the mono face.

## Fixes at landing

- `tests/state/workbench/layout/open-keep.test.ts`: the no-map row removed (Proof 1), a row for `openBeside` added.
- `openBeside` reads `keep`, `CardSessions.svelte` passes it, `docs/HELP.md` names a card (Behaviour 1, Z1098).
- `focusKept` in `list-drag.svelte.ts` (Z1099).
- G145's Code line and describe (Standards 1).

## Agents

Brief check a68ed6e397026f14a 200781 tokens, 22 tool uses, 475.6 s. Builder a2aa5018f994bbfb1 221465 tokens, 59 tool uses, 975.8 s; round 1 279173 tokens, 53 tool uses, 405.2 s; 4 full-list runs. Reviewer a1af2b7a974561620 218381 tokens, 32 tool uses, 606.0 s: Spec 0, Proof 0, Standards 2, Behaviour 2, opus. Reviewer over round 1 a493bbde9d565d176 208492 tokens, 26 tool uses, 478.8 s: Spec 0, Proof 1, Standards 1, Behaviour 1, opus. The first report passed its bar on every item but 11.
