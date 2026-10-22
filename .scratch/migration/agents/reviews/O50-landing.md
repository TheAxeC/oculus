# O50 landing

Position: plan migration (cockpit to oculus), step O50 (who the user is becomes the workspace setting `self`), landed 2026-10-22. Next: /spec O54, O61 and O53; /land O49; O57 is building.

## Open items

None.

## Not done

- The hub's move is on disk and not committed: `settings.self: axel-faes` in `.oculus/workspaces/research-hub.yml:16` and the `self` lines out of `.oculus/data/people/people.yml`. The runner's permission check refused the commit in the hub repository.
- The look did not press the Person page's button or choose in the Settings row, since each writes the workspace file, and covered only the theme in force.

## The check of Steps 1

The runner's agent listing showed one agent running, O57's builder (a8ccea2c1a4048d6d); none of O50's builder (aa29e323ca91b7afd), brief check (a5cae3c5b6723f862) or reviewers (ac99976ef654d4063, ae22da9a7c93e0180) was running.

## What landed

From base 0379bb5d, the range replayed in the gate worktree `.agents/worktrees/gate` and then on main, the two staged diffs equal under `cmp`. Who the user is is the workspace setting `self`: Settings draws it under People with a choice of the primary hub's people; the Person page's "this is me" is a button pressed on that person that writes the setting; the check gives `self_unknown` for a key that names no person; the portfolio chat names the owner from it. The reference index reads the open workspace file's `settings:` and holds `people` among its option sources, so renaming a person key rewrites `settings.self`, and Go to Definition from the workspace file reaches the primary hub's person.

## Fixes at landing

- The replay's conflicts in the diagrams `layer-views`, `layers` and `writes`: main's copies taken, then `npm run diagrams` regenerated them.
- Round 1 SP1: `tests/data/snapshot/references.test.ts` keeps "Layer 4", and its head comment says why (the portfolio watcher, a server module, as in the other watcher tests).
- Round 1 ST1: `watchedOnce` in `tests/data/hubs/hubs-fixture.ts`; `published` and `watchedIndex` both build on it.
- Round 1 ST3: G66, G67 and G119 of `agents/guarded.md` state what the new tests guard and name them.
- Round 1 B1 and ST4: `ownPeople` in `src/lib/state/system/config/editors/sources.ts` keys an item whose label equals another's until no new item is keyed; a fifth table row failed on the step's code and passes after.
- Round 1 P1: a note in the report with the failing lines as the reviewer's runs give them.
- Round 1 B2: its before and after stated in the booking.
- The hub's line moved once, as item 8 says.

## What was found

The review (`agents/reviews/O50-refuter.md`) with one repair round and a run over it; every finding is closed under its Closed heading. The builder's first report did not pass its bar.

## The look

On TEST: the hub's workspace file opened from quick open; Go to Definition on `self: axel-faes` opened `people.yml` at the entry `axel-faes`. The Person page of Axel Faes: "this is me" pressed (`aria-pressed` true); that of Liesbet Peeters: unpressed (false). The Settings view, which the command palette opens on the System page where it is held: Self under People, its items "nobody is marked as you" then the people by name, "Axel Faes" selected, its place `.oculus/workspaces/research-hub.yml:16`; the view's search text was put back. The tabs the look opened on TEST were closed. `git diff` of the hub's `.oculus` shows only the move and Axel's own earlier setting edits. Defects: none.

## Verification in the gate

```
$ npm run diagrams && npm run test:quick
ok      ASCII gate (1.6 s)
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (4.0 s)
ok      eslint (24.6 s)
 FAIL  |unit| tests/routes/edit/config-key.test.ts > the rows of the wallpaper section of Settings > writes wallpaper.themes into the workspace file and neither oculus's file nor the hub file
Error: Test timed out in 20000ms.
 Test Files  1 failed | 75 passed (76)
      Tests  1 failed | 635 passed | 167 skipped (803)
test:quick: 313.9 s; failed: vitest slow
$ npx vitest run tests/routes/edit/config-key.test.ts --testTimeout 20000
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

`config-key.test.ts` is not a file the step changes; it passes alone. A/B: none, `bench: []`.

## Agents

- Builder aa29e323ca91b7afd, claude-opus-5-5: 211205 tokens, 72 tool uses, 10 min 31 s (hand-back of C14); round 0 build 199848 tokens, 274 tool uses, 36 min 19 s; round 1 182663 tokens, 238 tool uses, 50 min 34 s.
- Brief check a5cae3c5b6723f862, claude-opus-5-5: 257554 tokens, 86 tool uses, 12 min 53 s.
- Reviewer ac99976ef654d4063, claude-opus-5-5: 212679 tokens, 69 tool uses, 23 min 17 s.
- Reviewer over round 1 ae22da9a7c93e0180, claude-opus-5-5: 239932 tokens, 75 tool uses, 18 min 52 s.
