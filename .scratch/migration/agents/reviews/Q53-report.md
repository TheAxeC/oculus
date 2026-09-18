# Report: Q53, the shell's drawing defects

Builder ab66a4e0d269be811, claude:opus through the Agent tool, launched 08:25, reported 09:22.

Everything in the brief is done, including the third half Axel ruled at 08:15. Two premises of the brief were wrong on the tree and were worked around inside the step.

## DONE / NOT DONE

| Deliverable | State | Command and output |
| --- | --- | --- |
| 1.1 One accent at a time, following the reader into an embedded page | DONE | `npx playwright test tests/browser/tabs.spec.ts -g "the one accent line"` -> 2 passed |
| 1.2 A folded active pane still says so | DONE | the case at `tests/browser/tabs.spec.ts:696` |
| 1.3 Head comments follow the rule as built | DONE | `shell/PaneView.svelte:27-31`, `shell/FoldedPane.svelte:6-9` |
| 1 node case, both arrangements | DONE | `tests/shell/workbench.test.ts:805` |
| 2.1 Name what covers the list and which ancestor makes the context | DONE | below |
| 2.2 The fix, list on top wherever it opens | DONE | `npx playwright test -g "a menu list over what is beside it"` -> 1 passed |
| 2.3 No new token, no placement change | DONE | two CSS declarations under `body.wall`; `themes/tokens.css` and `ui/Menu.svelte` untouched |
| 3 First tap opens, second presses, a tap off the row closes | DONE | `npx playwright test tests/browser/focus-buttons.spec.ts` -> 11 passed |
| Whole node suite | DONE | 252 files, 4293 tests, all passed |
| `npm run check` | DONE | `COMPLETED 1229 FILES 0 ERRORS 0 WARNINGS` |
| `build`, `format:check`, `lint`, the ASCII gate | DONE | built; Prettier clean; eslint silent; the gate printed nothing |
| The nine browser specs, then the whole suite | DONE | 86 passed, then `npx playwright test` 263 passed (5.3m) |

## What covered the list, and which ancestor made the stacking context

From the served build under `body.rice gruvbox wall`, `elementFromPoint` at the first item's centre returned the view's `HEADER`. The chain: the list (`position: absolute`, `z-index: 2`, blurred) inside `DIV.menu` inside `DIV.opener` inside `DIV.strip`, which carries `backdrop-filter: blur(var(--wall-blur))` under `:global(body.wall) .strip` and so makes the stacking context. The strip and the view's own box are siblings inside `DIV.pane`, the view's box is drawn after, and it paints over the open list. The page strip's menu was covered the same way by the pane strip below it. The rail's `beside` list (z-index 5) and a card's More menu were already fine.

The fix follows the rule `DESIGN.md:232` already states for the rail, that a blurred surface carries a depth of its own: `ui/Tabs.svelte:394-399` gives the strip `position: relative; z-index: 1`, and `shell/PageStrip.svelte` gives the page strip `z-index: 2`. No token, no placement change.

## How the mark reads on a folded strip

`shell/FoldedPane.svelte:83-85`: the folded strip's top border turns `var(--accent)` at 1 px, the width and colour a shown tab draws its accent line at, and its other three edges stay `var(--line)`. Only a folded pane carries it; a folded page leaf and a folded split carry none.

## The third half: how the first tap is told from the second

The row opens from the click the tap raises, not the press under it, in a capture handler on the list:

```svelte
function tap(event: MouseEvent): void {
    if (!(event instanceof PointerEvent) || event.pointerType !== 'touch') return;
    const found = rowAt(event.target);
    if (found === null || tapped?.at === found.at) return;
    tapped = { at: found.at, shown: null };
    event.preventDefault();
    event.stopPropagation();
}
```

The first tap is told from the second by whether the row the tap landed in is the row already held open. A tap in a row that is not open takes the click, so nothing is pressed; a tap in the open row falls through to whatever is under the finger. A tap that misses closes it, through a document `click` listener installed only while such a row is open. The click and not the press opens it because a press that opened it would draw the buttons before the click was aimed: opening on `pointerdown` makes the tap press a button the reader never saw, which is now that case's named revert.

## Before and after

1. **Two pages, one shown inside the other**: three shown tabs carried an accent and a press left both pane strips accented; now exactly one pane strip carries it, the one the rail's next view opens into, and it follows the reader between host and leaf.
2. **A pane folded while it is the pane the rail opens into**: no strip carried the accent; now the folded strip's top edge is the accent line.
3. **gruvbox or mocha with the wallpaper, the pane menu open**: the list drew but no item answered a press; now every item does, and the same for the page strip's menu.
4. **The Focus board on a device with a finger and a pointer**: a tap pressed the name and the buttons were unreachable; now the first tap draws them, the second presses, and a tap that misses closes the row.

## Doc text (not edited in this step)

`HELP.md:34`'s "How a strip is drawn" bullet and `DESIGN.md:339`'s tabs decision each carry a clause the step makes false, and the report writes both replacements out in full. `DESIGN.md:232`'s wallpaper paragraph is not false but incomplete; the suggested addition names the tab strip and the page strip beside the rail.

## Reverts

Seven for the new or changed cases, each printing the error its case names. Seven revert comments already in the tree named a line of `ui/Ticker.svelte` that the change moved; each number was corrected and each rerun to prove the corrected number names the line the comment means. After the last edit every revert comment in `tests/` naming a touched file was re-read and the line each names printed; all fourteen name the intended line.

**A revert in the tree that did not turn its test red**: `tests/browser/focus-buttons.spec.ts:400` named `Ticker.svelte:358 => position: absolute; right: 0;` against "a press at the end of a name reaches the name while the buttons are not drawn". Applied, the test passed: the waiting buttons are `display: none` while the row is closed, so moving the group out of flow cannot put one over the name. It was replaced with a revert that is red and that names the rule the test now guards; the declaration the old comment named is still guarded by another case.

## Decisions the brief did not cover

1. "Exactly one shown tab in the window" is read as one over pane strips; the page strip's current tab keeps its accent, which a committed assertion at `tests/browser/tabs.spec.ts:435` pins.
2. One new reader on the layout store, `openingInstance()`, read by both `PaneView` and `FoldedPane`, so the rule is written once.
3. Where the reader is became reactive: `attention.touched()` read a module-local no rune watched, so a press that moves the reader without changing any tree left the mark behind. `createAttention` takes a `Touched` cell with a default, and the store hands it a `$state` one.
4. Paths widened, all inside the step's concern: `state/layout/attention.ts`, `state/layout/index.ts`, `ui/Tabs.svelte`, `shell/PageStrip.svelte`.
5. `tests/ui/primitives.test.ts` carries no new case: both facts are DOM facts, and that suite renders to a string.

## Premises found wrong

1. Half 2's path list assumed the stacking context is made in a shell component; it is made in `ui/Tabs.svelte`, a primitive already in half 1's list.
2. Half 2's test asks for the same case in light with the wallpaper. Light cannot carry one: `config/appearance.yml:43` is `themes: rice`, and the wallpaper is drawn only under a theme whose class carries `rice`. The case runs gruvbox and mocha with the wallpaper on and light with it off.

## Files changed

`state/layout/attention.ts` 153, `state/layout/index.ts` 100, `state/layout.svelte.ts` 463, `shell/PaneView.svelte` 412, `shell/FoldedPane.svelte` 117, `shell/PageStrip.svelte` 363, `ui/Tabs.svelte` 605, `ui/Ticker.svelte` 423, `tests/shell/workbench.test.ts` 830, `tests/browser/tabs.spec.ts` 794, `tests/browser/focus-buttons.spec.ts` 646, `tests/ui/primitives.test.ts` 875.

## Limitations and sharp edges

- `ui/Tabs.svelte` is 605 lines against the 600 guide; it was 596 and the fix adds nine lines of rule and comment. Splitting a primitive the browser suite selects on is a change of its own.
- The strip's depth is declared only under `body.wall`. If a future change gives the strip a filter, transform or opacity outside it, the same defect returns there.
- The page strip's depth (2) and the pane strip's (1) are two numbers in two files; the comments name each other, the rail at 5 and the drag layer at 10, but nothing enforces the ordering.
- A folded page leaf carries no mark, so if the reader's instance is inside a page whose leaf is folded, nothing says where the rail opens.
- The menu case measures with `elementFromPoint`; a real press is exercised once per theme, on the opener the defect was found on.
- The ticker's document click listener fires for any click while a tapped row is open, including a mouse click and Enter; it only clears `tapped`, and a click inside that row leaves it open.
