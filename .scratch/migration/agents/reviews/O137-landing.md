# O137 landing

Roadmap entry: the cockpit-to-oculus migration. Step O137, a collection always sorted (ruling 654). Next: O140, whose brief check has reported.

## Open items

None.

## Steps 1

The runner's agent listing showed one subagent running, O140's brief check ad6e98d66c1edb3ea. None of O137's agents (the builder aa29cd8b3c25cd0a1, the brief check a361b40d4a9410a68, the reviewers a7e642347c27ccca6 and a6335b37145919815) was listed.

## Not done

Nothing of the step.

## What landed

The whole range from base 6779731e1 (the builder's work under the cases ruling `agents/briefs/O137-cases.md` and repair round 1, in the wip commit ebb3828f3): 35 paths, 665 insertions and 692 deletions.

- Each entry of `collections:` in `config/defaults/sources.yml` carries `sort:`, a list of its file's schema fields, which a hub's entry may replace.
- A collection's cards go pinned first, then by those fields (a status field in its options' order through `stageRank`, a date oldest first, any other field by the collator), then in the file's order; an entry with no `sort:` sorts by its title.
- A `sort:` field the schema does not name is a finding at the file's `schema` key.
- The drag of a card, Shift+J and Shift+K, `Grip.svelte` (deleted), `requestCardMove`, `cardMoveRequested`, the `move` action and `moveCard` are gone with their HELP lines. `movedOrder` moves to `src/lib/state/life/slides.ts` with its body unchanged. The server's `reorderEntries` stays for the Files view's bookmarks.

Fixes at landing:

- The doc of `stageRank` (`src/lib/state/boards/board/presets.ts`) is worded for any order.
- `sortFindings` of `src/lib/data/snapshot/schema/run.ts` is renamed `sortFieldFindings` with its call, so it no longer shares a name with `validate.ts`'s `sortFindings`.
- G56 in `agents/guarded.md` names the sort rule and the describe that holds its rows.
- The report's row on the Status choices of a file with no schema (`agents/reviews/O137-report.md`) says the choices come in the order first met over the cards, pinned cards first.

## Verification

In the gate worktree, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
test:quick: 35 changed file(s), from git since HEAD
test:quick: 229 test file(s)
ok      prettier (1.6 s): All matched files use Prettier code style!
ok      ASCII gate (1.7 s)
ok      svelte-kit sync (3.5 s)
ok      eslint (17.7 s)
ok      svelte-check (50.5 s): 1793741610329 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (219.4 s): Duration  200.91s
ok      vitest (255.2 s): Duration  237.49s
ok      vitest slow (327.0 s): Duration  309.69s
test:quick: 330.8 s; every command passed
```

On main, `git diff --cached --binary` equals the gate's under `cmp`. The verify list equals the page's commands. No A/B: the configuration names no bench.

## The look

A scratch server on 8797 from the gate, with a scratch copy of the research hub:

- The Applications view's 31 cards go by status in the options' order (active, applied, interview, accepted, not-applied, declined, rejected, withdrawn). The active ones go by deadline, oldest first (2026-11-04, 11-15, 11-22, 11-27, 2027-01-21). The entries with no deadline keep the file's order.
- No card is draggable and no grip is drawn.
- In the Slides view of a scratch deck with two entries, the step control and a drag of the grip each move an entry.
- No console error. The server is stopped and 8797 is free.

## Agents

The builder's first report did not pass its bar. Its first run handed back C13, ruled in `agents/briefs/O137-cases.md`. The review found Proof 1 to 3, Standards 1 to 5 and Behaviour 1 and 2; repair round 1 closed them, apart from Standards 4 (no change) and Standards 5 (fixed at landing).

- Builder aa29cd8b3c25cd0a1 (claude-opus-5-5): first run 243434 tokens, 54 tool uses, 7 min 1 s; after the cases ruling 173862 tokens, 262 tool uses, 48 min 16 s; round 1 281799 tokens, 97 tool uses, 14 min 26 s.
- Brief check a361b40d4a9410a68 (claude-opus-5-5): 287169 tokens, 157 tool uses, 18 min 5 s.
- Reviewer a7e642347c27ccca6 (claude-opus-5-5): 302477 tokens, 86 tool uses, 26 min 49 s.
- Reviewer over round 1 a6335b37145919815 (claude-opus-5-5): 196285 tokens, 51 tool uses, 15 min 32 s.

## Next

O140: its brief check found that ruling 665's premise misses three themes, which goes to Axel as an open item.
