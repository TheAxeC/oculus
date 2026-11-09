# O179 landing

Position: the oculus migration, step O179 (an absent list told from an empty one) landed. Next: O180's review and repair round, then O181.

Open items: none.

## Check of Steps 1

The runner's agent listing showed no agent of the step running.

## Not done

Everything in the brief is done. The plan's verify list did not pass on its first run on main: `npm run test:quick` beside another builder ended with 34 tests red. `npm run test:quick` worked in a second run.

## What landed

`FieldControl.svelte`, `InlineItems.svelte`, `options.ts`, `appearance.yml`, `workbench.yml`, and `audit/publications.ts` as a fix at landing.

## Found

- `tests/checks/source/keys.test.ts` was red on main over ternary key arguments in `audit/publications.ts`; four literal-key calls end it.
- The button drew `Clear <label>`; it now draws `Clear`, with `Clear <label>` as its accessible name.
- The comments in `options.ts` and `appearance.yml` were wider than the code on a sparse card; they now name a card that is not sparse.

## Look

Scratch server 8797, Settings, Primary hub, `website.cv_sections`, three rows: `record_fields` absent draws Not set, `[]` draws Empty list with Clear, one item draws the item. A press of Clear gave Not set and the focus on Add. The page was reloaded unsaved and the scratch config restored.

## Agents and fixes

Builder aca00b7eae3f12ce2 153116 tokens, 38 tool uses, 536 s, its round 211751 tokens, 64 tool uses, 412 s; brief check a8f1c2ab3bdcbe17f 261781 tokens, 34 tool uses, 586 s; reviewer a79c6329d16447dbe 184490 tokens, 30 tool uses, 785 s; reviewer over round 1 ae26e9f3cb94fc224 176078 tokens, 26 tool uses, 686 s (claude-opus-5-5). The first report did not pass its bar. Fixes at landing: three.
