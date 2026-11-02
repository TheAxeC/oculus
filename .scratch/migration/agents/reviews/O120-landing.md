# O120 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O120, a card takes no height for its controls and Career has colour, landed. Next: no step is queued.

## Open items

None.

## The check of Steps 1

`ListAgents` lists no agent of O120 running.

## NOT DONE

A narrow card and a chip row that wraps were not seen on a page. A chip row can still grow under the pointer when the controls do not fit beside the chips and take a line of their own; the ruling covers an empty meta row only.

## What landed

A card with no chip draws its controls over its top right corner under a hover pointer, so hovering moves nothing. Career has a bar per list and on the strategy card, chosen in `career-view.ts` from oculus's palette, with no schema key and no edit of the hub's career file. The Career page reads the keyboard cursor. Two false comments were fixed at landing.

## The look

Scratch server on port 8797 from the gate. Bars: indigo, blue, violet, gold, teal, pink. `article.card` height did not change at rest, under the pointer, with the menu open, with focus on Edit or under the keyboard cursor on a Career card (155.5), nor under the pointer on a dataset card with a chip (120) or without one (95.5, the `access` value removed in the scratch hub). Themes other than the running dark one were not switched.

## Checks

`npm run diagrams && npm run docs:palette && npm run test:quick` in the gate: `test:quick: 40.6 s; every command passed`. It does not cover tests that reach no changed file, the build, or the lint of unchanged files. No A/B: the configuration block has no `bench:` line.

## Usage

Builder first run 189958 tokens, 24 tool uses, 7 min 45 s; build 235074 tokens, 62 tool uses, 14 min 4 s. Brief check 209948 tokens, 33 tool uses, 9 min 9 s. Reviewer 242039 tokens, 30 tool uses, 11 min 1 s. The first report passed its bar; two fixes at landing; no repair round.
