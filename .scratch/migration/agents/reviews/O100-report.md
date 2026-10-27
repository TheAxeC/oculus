# O100 builder report

NOT done: check 3 of "Verify before you report" is not met. `git diff --numstat` prints 24 added and 6 removed, 30 lines against a budget of fewer than 20; the lines are the ruled content and prettier's form of the markup, and no line can go without compacting code or dropping a ruled rule (see "After the round-0 ruling"). Items 1 to 5 are built under the round-0 ruling, and checks 1, 2, 4 and 5 hold.

The sections up to "After the round-0 ruling" are the hand-back at the first read, kept as the round-0 record; that section gives the end state.

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

## After the round-0 ruling

Built under `.scratch/migration/agents/briefs/O100-cases.md`: option 1 (the name's span `display: inline-flex; min-width: 0`, the band's rule on the span) and the focus selector `:has(:global(:focus-visible))`. Options 2 and 3 are not taken. The only file changed is `src/lib/views/boards/focus/Focus.svelte` (`git status --short`: ` M src/lib/views/boards/focus/Focus.svelte`, besides the two untracked ledger files `briefs/O100-cases.md` and this report).

### Each item's change

1. A pressable name is drawn inside `<span class="wait-name">` (`Focus.svelte:372-379`); a name with no press stays `{name.text}` with no span (`:372`). The join `t('focus.wait_join')` stays outside the span (`:370-372`), so the comma is never underlined. No whitespace is added between the span, the button and the join: the markup keeps the `>{...}` form prettier gives it.

```svelte
)}{/if}{#if name.press === null}{name.text}{:else}<span
    class="wait-name"
    ><ToolButton
        plain
        label={name.text}
        onclick={name.press}
    /></span
>{/if}{/each}</span
```

2. The band's rule on the class, with the ruled focus selector (`Focus.svelte:476-480`):

```css
.wait-name:hover,
.wait-name:has(:global(:focus-visible)) {
    color: var(--accent-txt, var(--accent));
    text-decoration: underline;
}
```

At rest `.wait-name` sets no colour, so the name keeps the box's colour.

3. Blocked's red under the pointer and with the focus (`Focus.svelte:482-485`):

```css
.wait-names.blocked,
.wait-names.blocked .wait-name {
    color: var(--c-red-txt);
}
```

Scoped by Svelte, `.wait-names.blocked .wait-name` carries five classes and outranks the hover rule's `.wait-name:hover` and `.wait-name:has(:focus-visible)`, three each, so the red wins and the underline of the hover rule still applies.

4. `.wait-name { display: inline-flex; min-width: 0; }` (`Focus.svelte:471-474`), as `Person.svelte:408-417`. The span is an inline-level box in the run of names.

5. The comment above the new rules (`Focus.svelte:468-470`):

```css
/* A name of the box is a plain button: its words, with the focus ring the button draws, and an
   underline and the accent colour under the pointer and with keyboard focus. Its box is
   inline-flex so the underline reaches the button inside it; Blocked's count keeps its red. */
```

### The cases after the change (by reading; the look on 8790 is the proof)

1. Waiting on, hovered: `.wait-name:hover` sets the accent colour and the underline on the span. The span is a flex container, so the underline is carried into its in-flow children: `span.tip`, a blockified flex item, then the button and its label; the button's `color: inherit` takes the accent through `span.tip`. At rest no rule of `.wait-name` sets colour or decoration: the box's colour, no underline.
2. Under review, Applications, Grants: the same markup and rules as case 1.
3. Blocked's count, hovered: underlined by the hover rule, red by `.wait-names.blocked .wait-name`, which outranks it.
4. Tab to a name: the button matches `:focus-visible`, so `.wait-name:has(:focus-visible)` holds: underlined, in the accent colour, with the ring of `.tool.plain:focus-visible` (`ToolButton.svelte:458-460`) kept. After a mouse click alone Chrome does not match `:focus-visible` on a button, so the rule does not hold then.
5. A grant with no press: `{name.text}` with no span; no rule reaches it.
6. Narrow pane: the span is an atomic inline-flex box, as `span.tip` inside it already was, so the line breaks at the space of a join `', '` as before the change and each pressable name stays whole; a name wider than the column wraps inside its own box (`min-width: 0` on the span and on `span.tip`, `overflow-wrap: anywhere` inherited).

### Checks, after the last change

| Check | State | Output |
| --- | --- | --- |
| 1. `npm run test:quick -- src/lib/views/boards/focus/Focus.svelte` | holds | quoted below; `test:quick: 83.9 s; every command passed` |
| 2. `LC_ALL=C grep -n '[^ -~]' src/lib/views/boards/focus/Focus.svelte` | holds | printed nothing, exit 1 (the same run over this report printed nothing) |
| 3. `git diff --numstat -- src/lib/views/boards/focus/Focus.svelte`, fewer than 20 | NOT MET | `24 6 src/lib/views/boards/focus/Focus.svelte` (tab-separated), 30 lines |
| 4. `wc -l src/lib/views/boards/focus/Focus.svelte`, at or under 520 | holds | `486 src/lib/views/boards/focus/Focus.svelte` |
| 5. the comment against the comment rules | holds | read below |

Check 1, as printed (`npm run diagrams` ran right before it and changed no file, `git status --short` after it listing only `Focus.svelte` and the two ledger files):

```
test:quick: 1 changed file(s), from the given paths
test:quick: 8 test file(s)
ok      prettier (2.1 s): All matched files use Prettier code style!
ok      ASCII gate (2.7 s)
ok      svelte-kit sync (10.5 s)
ok      eslint (36.4 s)
ok      svelte-check (57.4 s): 1793137009050 COMPLETED 551 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (73.3 s): Duration  53.03s (transform 23.82s, setup 0ms, import 63.51s, tests 52.57s, environment 2ms)
test:quick: 83.9 s; every command passed
```

The 8 test files were the source and tree checks (`catalog-file-keys`, `comment-width`, `history`, `html-sites`, `keys`, `boundaries`, `duplication`, `size`). `npm run test:quick` ran once; no whole-suite command ran.

Check 3: the 30 lines are 5 removed and 8 added in the markup, which is prettier's one form of the span around the button (`npx prettier --check` passes it and would reject any other wrapping), and 1 removed and 16 added in the styles: the 3-line comment, the 4-line `.wait-name` rule, the 5-line hover rule, the second selector of the Blocked rule and 3 blank lines between rules. Every line carries a ruled item; meeting the budget would mean compacting code or dropping a ruled rule, which the spec forbids, so the check is reported as not met.

Check 5: the comment says what the rule does (a plain button, underline and accent under the pointer and with keyboard focus, Blocked's red kept) and why the box is inline-flex. It names no package, date, session or earlier state; the grep of the added lines for `before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-` printed nothing (exit 1). It is wrapped at 100 columns: its lines are 99, 92 and 99 characters (`awk '{print length($0)}'`); the second line ends where the next word, `inline-flex`, would pass 100. `comment-width` and `history` passed in check 1.

### Greps and documents

- `grep -n "wait-name" -r src tests docs`, the hits other than `wait-names`: only `Focus.svelte:373`, `:471`, `:476`, `:477`. The new class name collides with nothing.
- The head comment of `Focus.svelte:45-51` ("Every name of the awaiting box is a button. ...") is still true. `docs/HELP.md:294` ("Every name is a button.") is still true. The brief says no page line changes, and `docs/HELP.md` is outside the path list, so the hover is not written there; the band's and the command center lines' hover are not written there either.
- No export, helper, type or test is added. No test is changed.

### Files

- `src/lib/views/boards/focus/Focus.svelte`: 486 lines, +24 -6.
- `.scratch/migration/agents/reviews/O100-report.md`: this report.

### User-visible change, before and after, for the look on 8790

Focus view, Awaiting response box.
- Hover a name of Waiting on, Under review, Applications or Grants: before, nothing changes; after, the name is underlined and in the accent colour, and goes back to the box's colour with no underline when the pointer leaves.
- Hover Blocked's count: before, red with no change; after, red and underlined.
- Tab onto a name: before, the focus ring only; after, the ring, the underline and the accent colour (Blocked: the ring, the underline, red).
- Click a name: after, the name is not left underlined by the click alone (`:focus-visible` does not match after a mouse click on a button in Chrome).
- A grant with no press: its words, no change under the pointer.
- A narrow Focus pane: the names wrap at the joins, each pressable name whole, as before the change.

### Judgment calls

- The Blocked rule takes a second selector on the existing `.wait-names.blocked` rule instead of a separate rule, so the red is written once.
- The new rules are placed between `.wait-names` and `.wait-names.blocked`, so the comment introduces `.wait-name` before the Blocked rule names it.
- Formatting was checked with `npx prettier --check` on the one file; no formatter rewrote the file, which was written with the Edit tool only.
