# O145 landing

Position: the cockpit-to-oculus migration, step O145 (the deck arranged in the Overview, the Slides view retired); next is O146 (a deck's frame size and the slide findings).

## Open items, verbatim

- 686 (2026-11-05, Axel's request on the cards' Venue tag). The project card's Venue tag is `venueText` (`src/lib/state/boards/board/presets.ts:670-679`, used by `state/boards/board/items.ts:147`): name, quartile, JIF and the `free` text joined by bars, so a long cost note fills the card. The venues carry a `tier` (70 venues: 25 flagship, 25 strong, 20 specialist; `vocab.yml:301-305` `venue_tiers`, each with a colour, none with a glyph). (a) The tag reads a tier icon, then name, quartile and JIF; the cost leaves the card and stays on the Venues view's card; each `venue_tiers` row gains a `glyph:` (flagship `crown`, strong `star`, specialist `target`, unrated none, lucide icons through `glyphs.yml` and `icons.yml`), drawn in the tier's colour with the tier's label as its tooltip. Pros: the card shows prestige at a glance and the line stays short. Cons: one new key on `venue_tiers`. (b) The same with name and quartile only, the JIF left off. Cons: the JIF is what tells two Q1 venues apart. (c) Only the cost taken off, no icon. Cons: the tier stays invisible on the card; the lazy option. Recommended (a).

## The check of Steps 1

`ListAgents` listed no subagent of this session, only the three peer sessions; the builder and both reviewers had finished.

## NOT DONE

Nothing of the step.

## What landed

The whole range from base 3f0078305 (the wip commit d029a658e, the builder's first run and repair round 1), 51 paths, 2376 insertions and 1773 deletions, with three fixes at landing:

- A select trigger counts as a field: `FIELDS` in `src/lib/views/academic/present/screen/keys.ts` gains `[aria-haspopup="listbox"]`, the attribute bits-ui's Select trigger carries (its trigger props in `node_modules/bits-ui/dist/bits/select/select.svelte.js` hold no `role="combobox"`, which the review suggested). From the review over round 1, Behaviour 1.
- The `busy` prop docs of `KeyForm.svelte`, `RuleForm.svelte` and `DeckForm.svelte` and the sentence of `Overview.svelte:14-16` state the hold as built. From the review over round 1, Standards 1.
- The Edit Rule form puts each caption above its list, in one `.list` column; before, the two-column grid of `RuleForm.svelte` paired a caption with the wrong element, since each `MultiSelect` draws two, and the captions stood cut off at the pane's right edge. From the look.

## Verification

In the gate worktree at main's head 5f460c2ca, `npm run diagrams && npm run docs:palette && npm run test:quick`:

- First run, at a load average of 13.5 from other sessions: three tests timed out (`tests/routes/files/file-undo.test.ts` at 5000 ms, two of `tests/data/hubs/hub-portfolio.test.ts` at 20000 ms), no assertion failing; both files alone: `Test Files 2 passed (2)`, `Tests 24 passed (24)`.
- Second run, at a load of 6.2: `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint`, `ok svelte-check (11.2 s): ... COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest (158.6 s)`, `ok vitest checks (172.7 s)`, `ok vitest slow (241.5 s)`, `test:quick: 244.3 s; every command passed`.
- Third run, after the Edit Rule form fix, at a load of 3.4: every `ok` line again, `svelte-check (15.7 s): ... COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest (174.7 s)`, `ok vitest checks (192.5 s)`, `ok vitest slow (264.5 s)`, `test:quick: 268.5 s; every command passed`.
- Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files.

On main the same range cherry-picked and the fixes copied; `git diff --cached --no-renames 5f460c2ca` equals the gate's. A/B: none, `bench: []`. The verify list unchanged.

## The look

On a scratch server on 8797 from the gate, with the scratch hub:

- The portfolio deck's Overview draws 22 tiles, each its slide, with the headers of `pillars` and `more` carrying their rule sentences and Edit Rule.
- The Edit Rule form of `pillars` shows each list under its caption after the fix.
- With the deck's Edit form open and its tag-tone select focused, `o` leaves the Overview open; `o` on the Overview's Edit button closes it.
- The saved layout's two `slides` tabs read "Unknown view: slides".
- The console holds no error. Cancel left every form unwritten, and no `present.yml` of the scratch hub changed.
- The Overview's draw time on the portfolio deck, from the Overview button's click to two animation frames after it, 8 runs: before (main at 8b436978a) 36, 19, 18, 20, 18, 26, 17, 20 ms; after 405, 190, 198, 183, 167, 159, 174, 169 ms, each under the brief's 1 s bar.
- The server is stopped and 8797 is free.

## Agents

- Builder af8c8f54859bcc892 (claude-opus-5-5): first run 248052 tokens, 321 tool uses, 63 min 29 s; round 1 (item 4 handed back) 179792 tokens, 153 tool uses, 36 min 42 s; round 1 resumed 261149 tokens, 51 tool uses, 27 min 39 s.
- Brief check a2aaadf30fa035307 (claude-opus-5-5, 183567 tokens, 67 tool uses, 10 min 15 s).
- Reviewer a5bb0bc8f6d579102 (claude-opus-5-5, 305450 tokens, 105 tool uses, 25 min 12 s).
- Reviewer over round 1 a4a02238582c1777c (claude-opus-5-5, 263945 tokens, 88 tool uses, 21 min 43 s).

The builder's first report did not pass its bar (one repair round). No diagnosis record.

## Next

O146, a deck's frame size and the slide findings, through `/spec`.
