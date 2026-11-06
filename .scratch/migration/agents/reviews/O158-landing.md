# O158 landing

Position: roadmap entry "migration" (the cockpit-to-oculus migration); step O158, the Project facts strip redesigned, landed; next: /land O163, O161's brief rewritten to ruling 713 (a), /spec O165.

## Open items

None.

## The check of Steps 1

`ListAgents` listed no agent of O158 (its builder a4151539c1a126061 and its reviewers a7c36a3b237a4d3c2 and a3b7974c339a4dc07 not running); the one running agent was O164's reviewer over round 1.

## NOT DONE

Nothing of the brief, the cases ruling or the round. Not seen at the look: the light, rice and high-contrast themes, a 400 px frame, text size 1.5, the presenter screen, the audience window and the PDF.

## What landed

11 paths, 302 insertions and 220 deletions: the strip draws every fact as a muted capital label and its value, dots in their hues on form, stage, chips and domain, wrapping to as many lines as its facts need; `screen/drawn-slide.ts` measures the foot as drawn; `docs/decks.md` and `docs/HELP.md` say so.

## Found and fixed at landing

- The hand merge of `Slide.svelte` against O162: O158's `.slide` structure kept, every key-hint part removed; `docs/diagrams/layer-views.dot` taken from main and regenerated.
- The hand merge's line break, by `npx prettier --write`.
- The look's two defects in `parts/project/Facts.svelte`: the rule above the strip drawn in a mix of the muted text colour and `--line` (rgb 100,100,100 under VS Code Dark Modern, where `--line` alone was #2b2b2b); the 14em cap on a value removed, so a value is cut only when its fact is wider than the strip's whole line.

## Verification

Gate at f3ebd1fa5 (main since then holds ledger commits only): `npm run diagrams && npm run docs:palette && npm run test:quick`, exit 0, "svelte-check (17.6 s): ... 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", "test:quick: 57.4 s; every command passed". Main's staged diff equal to the gate's under `cmp`, 11 paths.

## The look

Scratch server on 8797 from the gate, VS Code Dark Modern with the wallpaper: over all 25 project decks every fact drawn, none outside the strip, none cut; 13 decks on three lines, 6 on two, 6 on one; each deck's text factor equal to main's, read on a scratch server from main on 8798; Project facts off hides the words and the rule and keeps the room; the Overview tile draws the same strip; no key hint. Axel saw the screenshots and ruled "I like O158".

## Agents

Builder a4151539c1a126061 (claude-opus-5-5; first run handed back, 221753 tokens, 63 tool uses, 12.1 min; build after the cases ruling 311178 tokens, 78 tool uses, 16.3 min; round 1 109836 tokens, 29 tool uses, 7.9 min); brief check adc6d991942348bee (claude-opus-5-5, 190286 tokens, 51 tool uses, 8.8 min); reviewer a7c36a3b237a4d3c2 (claude-opus-5-5, 230538 tokens, 56 tool uses, 11.9 min); reviewer over round 1 a3b7974c339a4dc07 (claude-opus-5-5, 235128 tokens, 41 tool uses, 9.8 min). The first report after the cases ruling did not pass its bar (repair round 1); three fixes at landing.
