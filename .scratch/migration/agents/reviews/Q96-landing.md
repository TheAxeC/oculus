# Q96 landing

Roadmap entry oculus/migration (the migration of oculus). Plan step Q96: the Rail section's field words and its icon dropdown on bits-ui, with one tooltip open at a time. Next: D13a's repair round 1, then `/spec` Q88 into the slot Q96 freed.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

- None.

## NOT DONE

The look was not taken. At landing the browser tab showed Axel's Sessions page, and a look is taken only on TEST. It is owed with Q81's and Q82's (the state file's Booked list) and covers:
- the Settings view's rail list: the words Label, Icon and Page before each field, and the sentence under the heading;
- the icon dropdown: Up, Down, Home, End and type-ahead "te" keeping the highlighted item in view, the scrollbar, a far-down icon highlighted on opening, the rice alignment of the empty choice, a pick changing the row;
- one tooltip at a time over a tree row's action.

## The check before landing

The runner's agent listing showed no builder or reviewer of Q96 running; only Q79b's builder (a4835b1ff7c423ca1) was running.

## What landed

Each rail row in the Settings view reads Label, Icon and Page before its fields, and a sentence under the heading says what a row is. The refusal lines say "icon", and `rail_why_shape` reads 'button {0} is not a label, an icon and a page'.

The icon field is `ui/forms/choice/GlyphSelect.svelte` on bits-ui's Select:
- its list, `GlyphList.svelte`, draws each name with its icon inside a `Select.Viewport`, so the keys scroll the highlighted item into view;
- the list draws the page's thin scrollbar, which bits-ui's viewport rule hides otherwise;
- the trigger is named by `aria-labelledby` over the field's label and the chosen name ("Icon of button 2 sliders").

The floating box the menus and the icon list stand in is one component, `ui/frame/FloatingList.svelte`, which `MenuList.svelte` and `GlyphList.svelte` both draw in.

`ui/menu/TooltipGroup.svelte` wraps the page in `+layout.svelte` with one bits-ui Tooltip provider, so a row action inside a tree row that carries its own words opens one bubble at a time. `tooltip-target.ts` is now `tooltip-rules.ts`.

For the ten-item folder rule, Select and MultiSelect moved to `ui/forms/choice/`, KeySheet and key-rows to `ui/menu/keys/`, and `tests/ui/{colours,theme,wall}.test.ts` to `tests/ui/theme/`.

The step is 47 files, 1229 lines added and 417 removed (`git diff HEAD --stat -- tools/oculus ':!tools/oculus/.scratch'` before the commit).

## What was found

- **The first review.** The builder's first report did not pass its bar: the keys did not scroll the icon list, the trigger's spoken name dropped the chosen icon, and the rice theme misaligned the list's plain rows. All three were closed in repair round 1 (`agents/briefs/Q96-round1-sent.md`) and checked by the round review.
- **The round review** (`agents/reviews/Q96-refuter.md`, "Repair round 1, refuted"), each closed at landing:
  - the icon list had no scrollbar, since bits-ui hides every Select viewport's scrollbar with `!important`: `GlyphList.svelte` draws the page's thin bar again (`scrollbar-width: thin` and the `--scroll-thumb` and `--scroll-track` colours, as `+layout.svelte` draws it);
  - `FloatingList.svelte`'s comment said its `:where` rules weigh one class; it now says two, the same as a list's plain `.item` rule;
  - `MenuList.svelte`'s head comment broke mid-sentence and said it puts bits-ui's attributes on the box; it now says it hands them on to `FloatingList.svelte`;
  - two DONE rows are source reads, stated here as audits: that both lists draw through FloatingList, and the `rail_why_shape` wording.
- **Carried to Q72** (`plan.md`, under Q72's line): the trigger's `.select` rules repeat `Select.svelte`'s; folding them needs a global stylesheet or a wrapper that changes the native select's markup in eight views, a design choice outside the brief.

## Verification on main

Run from `tools/oculus` with the three fixes at landing in place:

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md </dev/null
$ npm test
 Test Files  357 passed (357)
      Tests  5724 passed | 1 skipped (5725)
$ npm run check
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

This does not cover what the look covers: the scroll, the scrollbar, the spoken name and the tooltip are drawn only in a browser.

## Usage

- Builder: 104 tool uses, 282k tokens, 51 min (the build); 33 tool uses, 365k tokens, 44 min (round 1).
- Reviewers: 225k tokens, 64 tool uses, 13 min (first review); 181k tokens, 40 tool uses, 13 min (round 1).
- First report passed its bar: no. Fixes at landing: three.

## Next

D13a's review is in (`agents/reviews/D13a-refuter.md`); its repair round 1 is next. Q88 is prepared into the freed slot. Q79b's round 1 is building; its landing merges onto Q96's moved test files.
