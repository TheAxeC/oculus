# D73 landing

Plan: oculus/migration, the cockpit-to-oculus migration. Step D73, the Literature view. Next step: D77, the Sessions view and the title bar, then Q72 and O33.

## Open items

- None.

## The check of Steps 1

ListAgents before the landing showed no D73 agent running (the builder a37eb2c2709eb3729 and both reviewers finished); the only agent running was D77's diagnosis aa071f530aa99f740, which has since finished.

## NOT DONE

- Save to Literature from a Lit Watch or Literature search card was not looked at, since it needs the network; the write and the home hub are covered by G8 and G28 rows.

## What landed

The Literature view over `registries/literature.yml` with Save to Literature, Add by DOI or address asking the hub, field filters in every collection view, venue links, Copy BibTeX; hidden and ignored files shown by default in the Files view; open item 94's three parts with this hub's `.oculus/config.yml`, `registries/domains.yml`, `registries/venues.yml` and `registries/data.yml` changed once by hand and `registries/literature.yml` added; open items 96, 97, 99 and 100 (Copy on code blocks, Templates and Palette as Help tabs, the generated Contents block, the key-set test under the new guarded entry G83, the demo hub as a test fixture, the `new-entry` body's `root`). 192 paths, +5,135 -2,049 against main. The booking in `plan.md` under D73 holds the detail.

## What was found, and the fixes at landing

Six fixes at landing: Spec 1, Spec 2, Standards 1 and Behaviour 1 of the review over round 1 (`agents/reviews/D73-refuter.md`, Closed), and two defects the look found: the generated Contents block listed the page's title and its own heading (`renderDocumentParts` in `data/prose/markdown/markdown.ts`), and the Literature Add answered empty reset the hub chosen to the primary (`literatureAsk`, `collectionAsk`). Proof 1 needed no change; Standards 2 was one `git -v` in round 1. Axel's uncommitted Contents block in `docs/palette.md` is kept byte for byte by the generated page.

## The look

On a scratch oculus on port 8796 with two scratch hubs naming `literature`: the Literature view, Add with the Hub field and the hub kept into the second box, an entry added to the second hub only, Domains in the registry's colours, Venues and Data theme chips from the schema labels with a working filter, Files showing `.git` and `.oculus`, the Templates and Palette Help tabs with their Contents blocks and Copy buttons.

## Verification

In the gate worktree at main's head with the step and every fix: `npm run diagrams && npm run test:landing` passed the ASCII gate, format, lint, `npm test` and `check, build, test:slow`; `test:checks` failed once on the comment line the TOC fix made 101 columns wide, and after the rewrap `npm run test:checks` passed whole (`Tests  294 passed (294)`). Main's staged diff equals the gate's (`cmp` of the two `git diff --cached` outputs).

## Agents

- Builder a37eb2c2709eb3729 (claude-opus-5-5): 227,155 tokens, 820 tool uses, 152.7 min; round 1 137,894 tokens, 306 tool uses, 66.9 min. Its first report did not pass its bar (17 findings).
- Brief check a70d783a1699be8de (claude-opus-5-5): 239,040 tokens, 92 tool uses, 16.1 min.
- Reviewer ad6b64b3f5ddc2cac (claude-opus-5-5): 288,307 tokens, 179 tool uses, 39.3 min.
- Reviewer over round 1 a2a35873b46a38dbf (claude-opus-5-5): 332,678 tokens, 89 tool uses, 32.0 min.

## Next

Book the two choices D77's brief names, recheck its premises on this commit, run its brief check, prepare and launch its builder; then Q72 and O33.
