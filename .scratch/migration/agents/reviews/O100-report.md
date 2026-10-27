# O100 builder report: stopped at the first read

NOT done: items 1 to 5 of "What to build" and every check of "Verify before you report" that needs the change. The first read found that items 2 and 4 of the brief, read together, give a name of the box no underline (cases 1 to 4), so the builder stopped before changing any code, as the brief's "Cases" section requires. `src/lib/views/boards/focus/Focus.svelte` is unchanged (`git status --short` prints nothing).

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:177-180`:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

The list holds no entry.

## The case the brief's rules get wrong

Item 4: "The span is inline". Item 2: "That class gets the band's rule", which is `color: var(--accent-txt, var(--accent)); text-decoration: underline;` on the span under `:hover` and `:focus-within` (`src/lib/views/boards/focus/Band.svelte:290-294`).

The chain a name of the box would have under those two items:

```
span.wait-name            display: inline (item 4), text-decoration: underline on hover (item 2)
  span.tip                display: inline-flex   (src/lib/ui/menu/Tooltip.svelte:301-304)
    button.tool.plain     text-decoration: inherit (src/lib/ui/controls/ToolButton.svelte:339-354)
      span.label          the name's words
```

- An underline set on an inline box is drawn on its text and its in-flow inline children, and is not carried into the contents of an atomic inline-level box (CSS Text Decoration 3, propagation). `span.tip` is `inline-flex`, an atomic inline-level box, so the span's underline does not reach the button's words.
- The button's own `text-decoration: inherit` takes the computed value of its parent, `span.tip`, which sets no decoration, so it computes to none.
- The tree states the same fact for the same structure at `src/lib/views/sources/repositories/merge/MergeSide.svelte:199-200`: "The button is an atomic inline box, which an underline of this box does not reach, so the button carries it." That view puts the underline on the button through `.link:hover :global(button)` (`:206-208`).
- The band's rule works in the band because `.entry-name` is `display: flex` (`Band.svelte:283-288`): `span.tip` is then a flex item, blockified and in flow, and a decoration on a flex container is carried into all its in-flow children. Person, Referrers and FolderFiles do the same with `display: inline-flex` on their `.link` span (`src/lib/views/boards/person/Person.svelte:408-417`, `src/lib/views/shared/forms/entry/Referrers.svelte:105-113`, `src/lib/views/shared/links/FolderFiles.svelte:131-139`).

The result the brief's rules give: under the pointer and with the focus, the name turns to the accent colour (colour is inherited through `span.tip` into the button's `color: inherit`) and is not underlined; Blocked's count stays red (item 3) and is not underlined. Cases 1, 2, 3 and 4 are then unmet on the underline. This rests on reading the CSS and the tree's own comment; no page was run (the builder runs no page).

## Options for the ruling

1. (Recommended) Give the new span `display: inline-flex; min-width: 0;`, as Person, Referrers and FolderFiles give their `.link`, and keep the band's rule on the span unchanged. The span is still an inline-level box in the line of names, and `span.tip` inside it is already an atomic inline-flex box, so each name was already one unbreakable box in the run: the line breaks fall where they fall now, at the spaces of the join `', '` (`config/text/views/boards/focus.yml:160`), and case 6 holds. A name wider than the column wraps inside its own box, as it does now. Cost: item 4's word "inline" is read as inline-level, which is a departure from its letter.
2. Keep the span `display: inline` and carry the underline on the button, as MergeSide does: `.wait-name:hover :global(button), .wait-name :global(button:focus-visible) { text-decoration: underline; }`, the colour staying on the span. Cost: the view reaches into the element a `ui/` primitive draws (`:global(button)`), and the rule differs in form from the band's, which item 2 names as the model.
3. The lazy option: build items 2 and 4 to the letter, `display: inline` and the band's rule on the span. It costs the least and gives no underline, so the ruling is not met.

## The cases' first read (unchanged tree, by reading markup and styles)

1. Hover a name of Waiting on. Read: `Focus.svelte:369-377` draws it as `<ToolButton plain ...>` inside `span.wait-names`; `.wait-names` (`:458-463`) sets no colour and no hover rule; `.tool.plain` (`ToolButton.svelte:339-354`) draws no border, background or decoration of its own; the only hover rule, `.tool:hover:not(:disabled) { border-color: var(--accent); }` (`:207-209`), changes a border of width 0. Result: at rest the box's colour, no underline; under the pointer nothing changes. The brief's report of the look on 8790 agrees.
2. Under review, Applications, Grants. Read: the same markup for every row; `boardName` (`:204-207`) and `entryName` (`:214-224`) both give a press, so the name is the same plain button. Result: as case 1.
3. Blocked's count. Read: the same button inside `span.wait-names.blocked`, `color: var(--c-red-txt)` (`:465-467`), inherited by the button. Result: red at rest and under the pointer, no underline either way.
4. Tab to a name. Read: `.tool:focus-visible { outline: 1px solid var(--accent); outline-offset: -1px; }` and `.tool.plain:focus-visible { outline-offset: 1px; }` (`ToolButton.svelte:451-460`). Result: the focus ring 1px outside the words, in the accent; no underline, the box's colour.
5. A grant with no press. Read: `{#if name.press === null}{name.text}` (`Focus.svelte:372`): text alone, no element. Result: its words, no hover, no underline. Items 1 to 5 keep it so.
6. A narrow pane. Read: each pressable name is `span.tip`, `display: inline-flex` (`Tooltip.svelte:301-304`), an atomic inline box in the run; the joins are text `', '` between them; the markup has no whitespace between the names and the joins (the `>{#each ...}` form at `:369-377`). Result: the line breaks at the space of a join, each pressable name whole; a name wider than the column wraps inside its own box (`white-space: inherit` gives `normal`, `overflow-wrap: anywhere` inherited from `.wait-names`).

## DONE / NOT DONE

| Item | State | Command and output |
| --- | --- | --- |
| First read of the six cases | DONE | `sed -n` and Read of `Focus.svelte`, `Band.svelte:100-125,270-300`, `ToolButton.svelte:55-160,195-215,325-365`, `Tooltip.svelte:225-320`, `MergeSide.svelte:80-95,186-212`, `Person.svelte:400-420`; results above |
| 1. span of its own class around a pressable name | NOT DONE | stopped at the first read |
| 2. the band's rule on that class | NOT DONE | stopped at the first read |
| 3. Blocked stays red, underlined | NOT DONE | stopped at the first read |
| 4. span inline, names wrap as now | NOT DONE | stopped at the first read; this item is the one in question |
| 5. comment above the new rule | NOT DONE | stopped at the first read |
| Check 1, `npm run test:quick -- src/lib/views/boards/focus/Focus.svelte` | NOT DONE | not run; the file is unchanged |
| Check 2, ASCII | holds on the unchanged file | `LC_ALL=C grep -n '[^ -~]' src/lib/views/boards/focus/Focus.svelte` printed nothing, exit 1 |
| Check 3, diff under 20 lines | no diff | `git diff --numstat -- src/lib/views/boards/focus/Focus.svelte` printed nothing |
| Check 4, size | holds on the unchanged file | `wc -l`: `468 src/lib/views/boards/focus/Focus.svelte` |
| Check 5, the new comment | NOT DONE | no comment written |

`npm run test:quick` was run 0 times; no whole-suite command was run. The step adds or changes no test.

## Files

- `src/lib/views/boards/focus/Focus.svelte`: unchanged, 468 lines.
- `.scratch/migration/agents/reviews/O100-report.md`: this report, the only file written.

## Judgment calls the brief left open

- Stopping rather than picking option 1 or 2: the brief's "Cases" section says the builder stops when the first read finds a case the brief's rules get wrong, and the standing spec says a disagreement between the brief and the code's own rules is reported, not decided by the builder.

## User-visible change, before and after

None made. For the step once ruled: Focus view, Awaiting response box; hover and Tab onto a name of Waiting on, Under review, Applications, Grants and Blocked's count. Before: nothing changes under the pointer; Tab draws the focus ring only. After: the name underlined and in the accent colour, Blocked's count underlined and red, the ring kept on Tab.

## Other observations

- Ruling 524 says "with keyboard focus"; decision 1 of the brief chooses `:focus-within`, as the band does, which also holds while a button keeps the focus after a mouse press (Chrome focuses a button on click). `LaneCard.svelte:263-266` uses `.name:has(:global(:focus-visible))`, which holds for keyboard focus only. Under either option above the `:focus-within` choice can stay as the brief decided; the difference shows only while the focus stays on a name after a click, and a press opens a tab, which normally takes the focus away. Not verified on a page.
