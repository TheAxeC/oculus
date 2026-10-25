# O76 landing: the Pillars view's text made true and short

Position: the cockpit-to-oculus migration, step 276 of 399, O76 the Pillars view's text made true and short; next: O75's report, review and landing (building), then O74 on Axel's rulings on 371 to 373, then O77.

## Open items

- 371 (2026-10-25, step O74, where the career finder's text rule lives; `agents/reviews/O74-brief-check.md` finding 4.6; ruling Brief check scope, a widening of the step's paths). A press on a career row opens `career.yml` at the line of its entry, which needs a rule that finds that line in the file's text: the top-level key `goal` or `milestone`, a key under `situation:`, the n-th row of `order:` with a given task. The brief put it in `src/lib/state/sessions/source/draft-entry.ts`, whose head comment (`:3-6`) says it holds no text rules and that those live in `src/lib/data/helpers/files/yaml/collection-text.ts`; that file has 454 lines and finds only entries of a list (`entryAt`, `entryAtIndex`), not keys of a map. (a) A new file `src/lib/data/helpers/files/yaml/career-text.ts` (its folder holds 3 items) holds the rule, and `draft-entry.ts` calls it as it calls `collection-text.ts`. Pros: the text rules stay in one folder, `draft-entry.ts` stays true to its comment, `collection-text.ts` stays under the size limit. Cons: one more file in the step's paths. (b) The rule added to `collection-text.ts`. Pros: no new file. Cons: the file passes 500 lines, and a page's keys sit in a module about collection lists. (c) The rule kept in `draft-entry.ts` and its head comment rewritten to allow it. Cons: the separation the comment states is broken for one caller. Recommended (a); (c) is the lazy option.
- 372 (2026-10-25, step O74, one source for the command center's look; `agents/reviews/O74-brief-check.md` finding 4.5; ruling Brief check scope). Ruling 346 (a) draws the career banner with the command center's parts. Svelte scopes styles to their file, so the banner can share the look only through a shared component; otherwise its file copies the command center's CSS (the two-column box, the group block, the group heading, the muted note line), which the standards page's no-duplication rule forbids. (a) A new component `src/lib/ui/display/ticker/TickerGroup.svelte` (that folder holds 3 items): a group heading (glyph and label) over a `Ticker`, with an optional note line, and the two-column box as its own exported style or a wrapping component; `CommandCenterView.svelte` and `CareerPanel.svelte` both draw their groups with it. Pros: the two sections cannot drift apart; one place to change the look. Cons: the step's paths widen to `CommandCenterView.svelte` and the new file, and the command center is redrawn through the new component (its look unchanged, checked at the look). (b) The banner copies the CSS values. Cons: two copies of one look, against the standards page. Recommended (a); (b) is the lazy option.
- 373 (2026-10-25, step O74, web addresses in the career rows; `agents/reviews/O74-brief-check.md` finding 4.4). Today a web address in a career fact, the goal, the milestone, a task or a note is drawn as a link (`CareerPanel.svelte:16-17`, `LinkedText`). Under ruling 357 (a) a press on a row opens the career file, and the row's words sit inside that one button, so an address in them cannot be a link of its own; the hub's `career.yml` holds no address today (`grep -n "http\|www\."` prints nothing). (a) A row whose words hold a web address carries a second button under the pointer, Open link, beside Edit, opening the address (several addresses: one button per address, named by its host). Pros: nothing the banner does today is lost. Cons: such a row has two buttons where ruling 357 (a) says one. (b) The address is drawn as plain text and opens from nowhere in the banner. Cons: an address written in the file can no longer be opened from Focus. Recommended (a), a judgment: it keeps today's function at the cost of one button on the rows that need it. (b) is the lazy option.

## The check of Steps 1

The runner's agent listing showed only O75's builder a6cd05066857dc9c8 running; O76's builder aa83b2c7c27f97437 and reviewer a55bd13713108565c were not listed.

## NOT DONE

Nothing.

## What landed

O76 landed on main from base 006e4f24, the whole range (one wip commit 55d5f981), 8 paths: `config/text/views/structure/pillars.yml`, `src/lib/views/structure/pillars/LineCard.svelte`, `OrphansCard.svelte`, `ArchivalCard.svelte`, and the four `docs/diagrams` files `npm run diagrams` rewrote. The gate worktree took the range on top of 531e7b93 and main took the same range; `cmp` of the two `git diff --cached` outputs printed SAME.

- The intro, Orphans, Archival and Off-pillar notes read the ruled words; the Off-pillar note ends with "Off-pillar lines carry no in-flight or venue-tier counts." (ruling 360 (a)).
- A pillar or provisional card's counts row carries the tip "in flight: projects at a live stage; venue tiers: the venues of those projects", on the pointer's rest and on keyboard focus.
- The Orphans tag reads "<n> on no line"; the other sentences of the view and three head comments are true.

## Verification

In the gate worktree: `npm run diagrams && npm run test:quick`: `ok ASCII gate`, `ok prettier`, `ok svelte-kit sync`, `ok svelte-check (29.5 s): 537 FILES 0 ERRORS 0 WARNINGS`, `ok eslint (30.0 s)`, `test:quick: 51.0 s; every command passed`. It ran 0 test files (no test reaches a changed file); `npx vitest run tests/checks/source/keys.test.ts`: Test Files 1 passed, Tests 10 passed.

## Found, and the fixes at landing

- Spec 1 (review): the key `pillars.untagged` named an orphan as an untagged project. Renamed `pillars.on_no_line` at landing (`pillars.yml`, `OrphansCard.svelte:31`).
- Standards 1 (review): the report did not say the new key `pillars.counts_tip` was checked for a duplicate. Checked at landing: `grep -rn counts_tip src config tests` finds one definition (`pillars.yml:6`) and one reader (`LineCard.svelte:77`).
- Behaviour 1 (review): a press on the counts row leaves the focus in the card, so its Edit and Delete buttons stay drawn after the pointer leaves. Seen on TEST; kept, since pressing the card's own in-flight or done menu does the same.

## The look

On TEST, the Pillars view: the intro; the tip over the first pillar's "20 in flight 42 total 20 unrated" row, the row's height unchanged; the Orphans card "6 on no line" with its note; the provisional note; the Off-pillar note and an off-pillar card with no counts row; the Archival note "Dead-ends (failed or stopped), kept for provenance; they count toward no line." The hub's nine pillar colours (`.oculus/data/pillars/pillars.yml`, uncommitted in the hub) show on the cards' left edges: blue, teal and rose for the pillars, purple and indigo for the provisional lines, lime, mauve, dark cyan and slate for the off-pillar lines.

## Agents

The builder's first report passed its bar; one fix at landing. Builder aa83b2c7c27f97437 (claude-opus-5-5): 174922 tokens, 44 tool uses, 8 min 2 s. Reviewer a55bd13713108565c (claude-opus-5-5): 188617 tokens, 54 tool uses, 8 min 33 s. Brief check a3823758f5f3e72f3 (claude-opus-5-5): 165169 tokens, 37 tool uses, 5 min 25 s.

## Next

O75's report, its review and landing; O74 prepared again from the held brief once Axel rules on 371, 372 and 373; O77 after O75.
