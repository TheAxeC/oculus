# O107 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O107, an entry of a file with no schema opens its page, landed; no step is left unticked in `plan.md`. Next: the 1.0.0 archives rebuilt.

## Open items

None.

## The check of Steps 1

The builder a54b4fd5ed1a27c93 and the reviewers a03ae4d4fe2c96233 and a8f6ccdf902f595b7 had ended before the worktree was committed; the agent listing shows none of them.

## Not done

Nothing inside the step.

## What landed

The page of an entry of a file with no schema, a collection's or a feed's, draws the card's fields as text with a line naming the missing `schema:` list and no control that writes. A key that names no entry keeps the unknown-entry message. An entry with no key opens no page. Rulings 609, 610 and 611; 27 files, +440 -166.

## Verification

`npm run diagrams && npm run docs:palette && npm run test:quick` in the gate worktree, every command passed, 275.2 s. On main the staged diff equals the gate's, 27 paths.

## The look

Looked at on a scratch server on 8797 from the gate, its hub the demo copy with the `schema:` of `events.yml` removed, under the demo's light theme: an event with `primary_key: key` on its `collections:` entry, a lead and a Lit Watch paper each open their page with the line naming the missing schema, the fields as text, no Status, Delete or form, the pencil opening the file in a source tab; Lit Watch's Delete asks, removes the entry from `radar.yml` and History's Undo puts it back (grep count 0, then 1); with no key named, the event's card and palette row show the entry's first filled text and the row opens Talks & Events.

## Found

One run of the list failed `tests/state/sessions/source/source.test.ts`, a file the step does not change; it passed alone and in the later runs.

## Fixes at landing

landing fixes in `page-entry.ts`, `page-file.ts`, `entry-actions.ts`, `editor-target.ts`, `RadarCard`, `LeadCard`, `palette.ts`, `Collection.svelte` and the test fixture (the review over round 1's S6, S7, St6, St7, St8 and P4); Status and Delete on a no-key lead disabled in place of inert; two defects the look found: a blank palette row and a card headed `hub:` for an entry with no display and no key, closed by `entryWords` in `src/lib/state/shared/page/idents.ts`, used by `EntryCard.svelte` and `palette.ts`, with its sentence in `docs/HELP.md`.

## Usage

Brief check a0a4cb0e10cbb5673: 229614 tokens, 26 tool uses, 7.1 min. Builder a54b4fd5ed1a27c93: 356386 tokens, 126 tool uses, 29.9 min; round 1 230083 tokens, 103 tool uses, 18.6 min. Reviewer a03ae4d4fe2c96233: 265346 tokens, 38 tool uses, 13.7 min. Reviewer over round 1 a8f6ccdf902f595b7: 232346 tokens, 35 tool uses, 12.5 min. The first report did not pass its bar.
