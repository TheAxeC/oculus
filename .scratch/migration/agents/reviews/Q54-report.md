Everything in the brief is done. `src/lib/ui/Tabs.svelte` is 362 lines, under the 540 the brief asks for.

**The wall rule from the step beside me**: `.strip`'s styles stayed in `src/lib/ui/Tabs.svelte` (its `<style>` opens at line 288 with `.strip`, then `.strip.low`, `.strip.card`, `:global(body.wall) .strip` at 304 and `:global(body.wall) .strip.card`). The nine-line `position: relative; z-index: 1` rule under `:global(body.wall) .strip`, with its comment, lands in **`src/lib/ui/Tabs.svelte`**, in the same block it is in today, next to the two rules it already sits beside. Nothing of the strip's styling moved out.

## DONE / NOT DONE

| Row | State | Command and output |
| --- | --- | --- |
| Tab's markup and look out of `Tabs.svelte` into its own component | DONE | `wc -l src/lib/ui/Tabs.svelte src/lib/ui/TabFace.svelte` -> `362`, `306` |
| `Tabs.svelte` under 540 | DONE | `sh bin/size-check.sh` printed nothing, exit 0; `wc -l` -> `362` |
| No behaviour, token, class or prop of `Tabs` changed | DONE | `npx vitest run --reporter=dot` -> `Test Files 259 passed (259) / Tests 4357 passed (4357)`; browser specs 49 passed |
| Head comments follow the split | DONE | `TabFace.svelte:1-17` opens with its layer and what it owns; `Tabs.svelte:1-24` keeps the strip, focus order, drag, scrolling, and the strip's own look |
| Node suite | DONE | `npx vitest run --reporter=dot` -> `Test Files 259 passed (259) / Tests 4357 passed (4357)` |
| `npm run check` | DONE | `COMPLETED 1242 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | `✓ built in 1.78s` / `✓ built in 6.14s` / `✔ done` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | no output after the npm banner |
| ASCII gate | DONE | the brief's `perl` one-liner printed nothing |
| `sh bin/size-check.sh` | DONE | printed nothing, exit 0 |
| `find src tests bin -type f \| xargs wc -l \| sort -n \| tail -5` | DONE | `970 tests/routes/terminal.test.ts`, `970 tests/state/layout.test.ts`, `973 tests/views/collection.test.ts`, `980 tests/state/board.test.ts`, `180673 total` |
| Browser specs `tabs`, `pages`, `shell-defects`, `keyboard` | DONE | `49 passed (50.0s)` |

The node suite needed one rerun: `tests/server/hpc/ssh.test.ts` ("rejects a command that never returns at the budget and leaves no child behind") times out while another step's playwright run is on the machine. Run alone: `npx vitest run tests/server/hpc/ssh.test.ts` -> `Test Files 1 passed (1) / Tests 5 passed (5)`. The full-suite rerun quoted above is green with it included.

The browser port was held repeatedly by other steps' runs. Waited with `lsof -iTCP:8792` and retried; no lock deleted, no pid signalled, no `pgrep -f`.

## Line counts

| File | Before | After |
| --- | --- | --- |
| `src/lib/ui/Tabs.svelte` | 596 | 362 |
| `src/lib/ui/TabFace.svelte` | new | 306 |
| `src/lib/ui/tab-strip.ts` | 128 | 128 |
| `src/lib/ui/tab-scroll.svelte.ts` | 155 | 155 (not touched) |
| `tests/ui/primitives.test.ts` | 875 | 879 |
| `tests/ui/wall.test.ts` | 193 | 194 |
| `tests/browser/tabs.spec.ts` | 613 | 617 |
| `tests/views/type-scale.test.ts` | 243 | 247 |
| `tests/allow-styling.ts` | 155 | 155 |
| `tests/boundaries.test.ts` | not measured before | 568 (one line added) |
| `bin/size-allow.txt` | 15 | 14 |

## What each file owns

`src/lib/ui/TabFace.svelte` owns one tab: the `.tab` wrapper, the face button with the glyph, label, count badge and split cells, the close control with the dot and the cross, and every style for those, including `:global(.strip.unfocused) .tab.current` and `:global(body.wall) .tab.current`. The caller binds the wrapper (`face`) and the face button (`head`) through `$bindable`, so the strip still measures and still moves the focus.

`src/lib/ui/Tabs.svelte` keeps the strip: the props, the scroll wiring, the roving stop, the keyboard, the drag reporting, the scroll controls, the caller's menu, the drop mark, and the strip's own styles.

## Reverts run

Machine-readable directives, run with `node bin/revert-check.mjs tests/ui/primitives.test.ts tests/ui/wall.test.ts tests/views/type-scale.test.ts tests/boundaries.test.ts tests/size.test.ts`:

```
red       tests/ui/primitives.test.ts :: marks the shown tab current and no other (revert src/lib/ui/TabFace.svelte:77)
red       tests/ui/primitives.test.ts :: marks a tab holding unsaved text and draws its dot, and draws no dot on a clean tab (revert src/lib/ui/TabFace.svelte:78)
red       tests/ui/primitives.test.ts :: names a tab holding unsaved text with the catalog word, and leaves a clean tab its label (revert src/lib/ui/TabFace.svelte:89)
red       tests/ui/primitives.test.ts :: draws the glyph before the label, and the preview mark on the preview tab alone (revert src/lib/ui/TabFace.svelte:100)
red       tests/ui/wall.test.ts :: answers every surface a component paints, or names it as solid with its reason (revert src/lib/ui/TabFace.svelte:258)
red       tests/boundaries.test.ts :: lets no view or shell component style a primitive own class (revert tests/allow-styling.ts:72)
red       tests/size.test.ts :: is on the list with a count it has not passed (revert bin/size-allow.txt:7)
```

`tests/views/type-scale.test.ts` names its cases from a loop (`sets every pass-through role in ${file}`), so `bin/revert-check.mjs` cannot resolve them ("the case did not run"). Both reverts were run by hand:

- drop `font-size: var(--fs-lg);` from `.face` in `TabFace.svelte` (line 224) -> `FAIL tests/views/type-scale.test.ts > the view type scale > sets every pass-through role in src/lib/ui/TabFace.svelte`, `Tests 1 failed | 155 passed (156)`
- put `font-size: var(--fs-lg);` on `.strip` in `Tabs.svelte` (line 291) -> `FAIL ... sets every pass-through role in src/lib/ui/Tabs.svelte`, `Tests 1 failed | 155 passed (156)`

Browser reverts, each run with `npx playwright test tests/browser/tabs.spec.ts -g ...` and then restored:

- `src/lib/ui/TabFace.svelte:169 => border-top-color: transparent;` -> `1 failed / the look > a tab stands at the editor tab height, the shown one on an accent line over a gap, its close control where it is pressed`, failing at `tabs.spec.ts:207` on `expect(await lookOf(shown)).toEqual({ height: 35, top: accent, ... })`
- `src/lib/ui/TabFace.svelte:177 => border-top-color: var(--accent);` -> `1 failed / the look > only the active pane's shown tab carries the accent line; another pane's draws it in the line colour`, failing at `tabs.spec.ts:272` on `await expect.poll(tops).toEqual([line, accent])`
- `src/lib/ui/TabFace.svelte:289 => display: none;` -> `1 failed / the look > a tab or a page holding unsaved text shows a dot in the close control place until hovered, and says so in its name`, failing at `tabs.spec.ts:318` on `toEqual({ dot: true, cross: false, close: '1' })`

Every directive was re-read after the last edit: each line number still names the line it was written for (`sed -n "<n>p"` over each, printed above the report was written).

## Doc text

Two lines the split makes false, left unedited as decision 2 of the brief says:

- `DESIGN.md:98` lists the primitives: `Card.svelte Chip.svelte Tag.svelte Meter.svelte Table.svelte Pane.svelte Tabs.svelte Sash.svelte Empty.svelte Toolbar.svelte`. `TabFace.svelte` is a primitive and is not in it.
- `DESIGN.md:339` says "`ui/Tabs.svelte` draws editor tabs at the `--tab-*` tokens of `themes/tokens.css` ... a line between tabs, the shown tab on `--panel` over a gap in the line under the strip, its top line in `--accent` only when the strip is `focused` and in `--line` otherwise" and then "A `Tab.dirty` tab ... shows the `bullet` glyph in the close control's place and is named `ui.tab_unsaved`". Everything in that sentence past "the line under the strip" is now `ui/TabFace.svelte`; `ui/Tabs.svelte` draws the strip, the line under it and its controls.

`HELP.md` names no file; `grep -n 'Tabs.svelte\|tab-strip\|tab strip\|TabFace' HELP.md DESIGN.md README.md` found nothing in `HELP.md` or `README.md` that the split makes false (the two `HELP.md` hits, lines 9, 45 and 46, describe the strip's scrolling and keys, which did not move).

## Judgment calls the brief did not cover, each reversible

1. **`badgeStyle` and `cellStyle` stayed in the component, not in `ui/tab-strip.ts`.** Brief decision 1 puts a pure helper in `tab-strip.ts`. Moving them there fails `tests/ui/colours.test.ts`, which resolves a token name built at run time only through the source of the component that sets it (`assignments(source)` at `tests/ui/colours.test.ts:296`, and the head comment at line 30: "A `var()` of a custom property the component sets itself is read through to what it was set from"). With them in `tab-strip.ts`, `npx vitest run tests/ui/colours.test.ts` printed:
   ```
   + "lib/ui/TabFace.svelte: .cell: background: var(--cell-bg) (not a surface or a hue)",
   + "lib/ui/TabFace.svelte: .cell: color: var(--cell-fg) (not a -txt or --on- token)",
   + "lib/ui/TabFace.svelte: .tab-badge: background: var(--tab-badge-bg, var(--chip)) (not a surface or a hue)",
   + "lib/ui/TabFace.svelte: .tab-badge: color: var(--tab-badge-fg, var(--accent-txt, var(--accent))) (not a -txt or --on- token)",
   ```
   The alternative was widening `assignments()` to follow an import, which would weaken that check for every component in the tree; I did not do it. The two functions sit in `TabFace.svelte` with a comment saying why. `tab-strip.ts` is unchanged at 128 lines, so the 200-line question in decision 1 does not arise.

2. **Paths widened past decision 3.** Four files outside the brief's list had to change for the checks to stay green, each a direct consequence of a class or a count moving:
   - `bin/size-allow.txt`: the `src/lib/ui/Tabs.svelte 596` entry is removed, since a listed file back under the line fails both `bin/size-check.sh` and `tests/size.test.ts`.
   - `tests/allow-styling.ts` lines 72 and 96: `.label` is now declared by `ui/TabFace.svelte`, so `findPrimitiveStyling` names that file.
   - `tests/views/type-scale.test.ts`: `PASS_THROUGH` for `src/lib/ui/Tabs.svelte` becomes `''` and a `src/lib/ui/TabFace.svelte` entry carries `.tab-badge=fs-xs | .cells=fs-xxs | .face=fs-lg | .close=fs-lg`.
   - `tests/boundaries.test.ts`: one revert directive added above the case that reads `tests/allow-styling.ts`.
   No other step's paths were touched; nothing under `src/lib/shell/`, `src/lib/views/`, `src/lib/state/`, `themes/` or `config/` changed.

3. **Two handler callbacks carry explicit event types.** `onkeydown={(event: KeyboardEvent) => ...}` and `onpointerdown={(event: PointerEvent) => ...}` in `Tabs.svelte`. Without them `npm run lint` printed `Unsafe argument of type 'any' assigned to a parameter of type 'KeyboardEvent'` twice; `svelte-check` was clean either way.

## Found and not fixed

`bin/revert-check.mjs` reports one pre-existing case whose named revert leaves it green, in a file I did not touch:

```
GREEN     tests/ui/primitives.test.ts :: draws a row action as a button only when the caller says what one means (revert src/lib/ui/Ticker.svelte:231)
```

`src/lib/ui/Ticker.svelte` is outside this step's paths, so the directive is left as it is and named here.

## Files changed

- `src/lib/ui/Tabs.svelte` (362)
- `src/lib/ui/TabFace.svelte` (306, new)
- `tests/ui/primitives.test.ts` (879)
- `tests/ui/wall.test.ts` (194)
- `tests/browser/tabs.spec.ts` (617)
- `tests/views/type-scale.test.ts` (247)
- `tests/allow-styling.ts` (155)
- `tests/boundaries.test.ts` (568)
- `bin/size-allow.txt` (14)

## Before and after, for the look on screen

Open any pane with more than one tab (for instance Projects and Status in one pane, then a second pane), on the workbench TEST page. **Nothing should differ.** The tab height, the line between tabs, the shown tab on `--panel` over a gap, its accent top line on the active pane and the line colour on the other, the close control appearing on the shown tab and under the pointer, the unsaved dot on a tab holding unsaved text until hovered, the count badge and split cells, the preview tab's italic label, the scroll controls on an overflowing strip and the menu at the right end are all unchanged. A visible difference anywhere in that list is a defect of this step. Worth putting in a wallpaper theme too (`rice`), where the strip goes translucent and the shown tab paints nothing of its own; that pairing crosses the two files now and should read exactly as before.

