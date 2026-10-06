# PR2 landing

Plan oculus/migration (cockpit to oculus), step PR2 of 351 (306 landed with it), Present decks from any folder. Next: /spec for PR3 (Present decks edited and generated), which waited for PR2.

## Open items

- Q125 waits for Axel's read of the new HELP.md and DESIGN.md before it lands (the brief's "What to build"): `.agents/worktrees/Q125/tools/oculus/HELP.md`, `DESIGN.md` and the six new guides under `docs/`. His word lands it; anything he wants changed is fixed at landing or goes to Q126.
- PR2 carried 38 lines in 8 project decks that use a spaced hyphen where the prose rule wants a comma, colon or parentheses: raw-pls 10, fed-multicellular-immune 6, dries-bttr-ecg 6, hccnet-fl 5, hccnet-revision 5, ecg-readable-substrate 3, ward-bttr-crosssubject 2, bttd-source-eeg 1 (each `present/main.md`; e.g. "Dries - supervised block-term tensor regression"). The brief carried every word byte for byte, which clashes with the prose rule for these lines. Options: (a) reword each line to the prose rule, keeping every number and name; (b) keep them as carried. Recommendation (a): the slides are public text; (b) is the lazy option.

## Not done

- The look was not taken on TEST at localhost:8790. Axel's server there runs the server code of before this landing: its Present view shows "The deck in {0} draws no slides", because the old server answers the old deck shape. It reads decks once that server restarts. The look was taken on a scratch oculus instead (Z662).
- `tests/server/desktop/start.test.ts` 'asks the default port ... starts no second server' is red, on main's head without PR2 as well (Z663, booked in the state file).

## Agents stopped

ListAgents before the landing listed one subagent running, D23's reviewer (a0a498ede0a9659bb); no builder or reviewer of PR2.

## What landed

A deck is a folder holding a `present.yml` (`deck:`, `defaults:`, `groups:` with `find:`, `discover:`, `sort:` and `slides:`, `order:`) and Markdown slide files. The portfolio deck is the hub's `deck/` (`portfolio_deck:` in `config/sources.yml`), a project's deck its `present/`, any other folder opened with Open Presentation in the Files menu. Every PRESENT.md and the portfolio content of `config/present.yml` are converted by `utils/migrations/convert-decks.mjs` and removed. A Present tab's identity is its deck's root and path.

Host-visible: a Present tab of a folder deck draws the breadcrumb bar over the slides (hub > projects > manuscripts > btfno > present), shows the folder's path as its tooltip and has the file items of the tab menu (Copy Path, Copy Relative Path, Reveal, Bookmark, Compare). The portfolio deck's tab has none of these, as before.

## Fixes at landing

1. Z655: a section slide's front matter may carry `foot:` (`src/lib/data/sources/deck/kinds.ts`). `deck/transition.md` carries its hint there, with no cards, and the converter writes it so. A probe of `buildSlide` gave `{"lede":"","cards":0,"foot":"Same four-layer format.","legend":"more"}` for that slide, and lede, two cards and foot for a section with a list.
2. Z656, the deck menu: `pointInstance` (`src/lib/state/workbench/layout/instances.ts`, wired in `layout.svelte.ts`) points a tab at a record, or activates the tab on the page that already holds it; `Present.svelte`'s `open` calls it.
3. Z656, the portfolio deck: `tabDeck` (`src/lib/state/life/present.ts`) names the portfolio deck by the empty reference; the deck menu and the Files menu (`row-menu.ts`) use it.
4. Z656, a root's own folder: `fileOfTab` reads the path `.` as no file; the Slides opener passes `deckState({}, deckRefOf(instance.state))`.
5. DESIGN.md:385 and HELP.md:139 state the one-tab rule as built and the breadcrumb bar.
6. Proof 1: the deck write records its file under the hub's own path (`hubSpelling`, `deckFileOf` in `src/lib/server/edit/writes/config/deck.ts`); `changes.test.ts` expects `deck/present.yml`.

## Verification

On the gate (`.agents/worktrees/gate`, main's head plus PR2 and the fixes):

```
npm run diagrams && npm run test:landing
ok      ASCII gate (0.8 s)
ok      npm run format:check (15.0 s): All matched files use Prettier code style!
ok      npm run lint (54.1 s)
ok      npm test (62.4 s)
FAILED  npm run test:checks (67.5 s): integrity.test.ts, the real hub's two cases ("deck folder deck is not in ...gate": the gate's sparse checkout held no deck/)
FAILED  npm run check, then npm run build, then npm run test:slow (227.5 s): check "COMPLETED 3052 FILES 0 ERRORS", build green, test:slow 1 failed (start.test.ts, the default-port case)
git sparse-checkout add deck; npm run test:checks -> Test Files 16 passed (16), Tests 231 passed (231)
npx vitest run tests/server/desktop/start.test.ts -> 1 failed | 4 passed (the same case)
the same file on a scratch checkout of main's head 033d3b9b, no PR2 -> 1 failed | 4 passed (the same case)
npx vitest run tests/server/core/changes.test.ts tests/server/edit -> Test Files 8 passed (8), Tests 38 passed (38)
node tools/oculus/utils/migrations/convert-decks.mjs --check -> nothing left to convert
cmp of the gate's and main's staged diffs over tools/oculus and deck -> equal
```

## The look

On a scratch oculus over the gate's build (port 8793, its own HOME, engine config and local.yml; stopped after, `lsof` on 8793 printed 0):

- The portfolio deck: 21 slides; the title slide with lede, legend and the key hint.
- The transition slide, "7 more, same backbone": heading, the legend and the hint as the foot, no cards.
- Open Presentation on `deck/`, twice: one Present tab, activated, with no breadcrumb.
- The deck menu's BT-FNO: the tab shows the breadcrumb hub > projects > manuscripts > btfno > present.
- A second Present tab on the portfolio deck, its deck menu's BT-FNO: the open BT-FNO tab came forward and the portfolio tab kept its deck.

On TEST at localhost:8790, the Present view opened beside and closed again: "The deck in {0} draws no slides", from the server of before the landing.

## Agents

- Builder ad626fab8e2a49ab3 (claude-sonnet-5-5): 347,934 tokens, 609 tool uses, 113.1 min; round 1 208,624 tokens, 249 tool uses, 44.9 min; round 2 284,207 tokens, 177 tool uses, 44.3 min.
- Brief check a4be0b9c90d5e0f8b (claude-opus-5-5): 262,300 tokens, 111 tool uses, 16.2 min.
- Reviewer ac8902c2a666de395 (claude-opus-5-5): 149,642 tokens, 114 tool uses, 15.6 min; over round 1 ac66e4d8f80f5fe9f: 341,182 tokens, 108 tool uses, 16.7 min; over round 2 afb8c97b1def8331e: 315,512 tokens, 115 tool uses, 18.4 min.

The builder's first report did not pass its bar: two repair rounds, the second under the round cap's exception (Z653). Six fixes at landing, listed above.
