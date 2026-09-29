# Q96 report (repair round 1 included)

Everything in the brief and in repair round 1 is done. Case 6's press, which calls `onchange`, is left to the look, as the round's ruling gives it. Two things depart from the brief's letter because of the ten-item folder rule: the icon dropdown's path is `ui/forms/choice/GlyphSelect.svelte`, and verify item 3 prints two lines (section 8).

## Open items (verbatim from the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md`)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- None.

## The cases' first run (unchanged source tree)

Each case was written as a test and run on the unchanged source with `npx vitest run tests/views/system/workbench/settings.test.ts tests/ui/forms/glyph-select.test.ts tests/ui/menu/tooltip.test.ts`. No case turned out to contradict the brief's rules.

| Case | Test | First run |
| --- | --- | --- |
| 1 | settings: draws Label, Icon and Page before their fields in every row | red: `expected false to be true` (no word in the row) |
| 2 | settings: draws the sentence under the heading | red: `expected -1 to be greater than 4833` |
| 3 | settings: draws the chosen icon and name in the trigger...; glyph-select: closed trigger cases | red: `expected '' to contain 'data-glyph="sliders"'`; glyph-select file red: `Cannot find module .../GlyphSelect.svelte` |
| 4 | glyph-select: draws the empty choice first, then every choice... | red: module not found |
| 5 | glyph-select: draws a value the choices lack as its own item... | red: module not found |
| 6 | glyph-select: gives each item its name as the value a pick hands on... | red: module not found |
| 7 | settings: draws the row glyph only inside its icon field | red: `expected 'data-rail-row="0"><span class="mark s...' not to contain 'class="mark'` |
| 8 | settings: names a row with no icon and a row with an unknown one in the word icon | red: `expected '...' to contain 'button 1 names no icon'` |
| 9 | tooltip: is refused by bits-ui when drawn outside the one tooltip group | red on the unchanged `Tooltip.svelte`, which draws its own provider. Revert R1 below restores that provider: `Tests 1 failed / 12 passed` |
| 9 | tooltip: is drawn under the page layout, which holds the one group | green on the unchanged tree, since each tooltip carried its own provider. It turns red only once `Tooltip.svelte` has none (revert R2) |
| 10 | look only | not run |

## Rulings of repair round 1, carried

- **Case 6.** The pick's call to `onchange` is not reached by a server render. The case 6 test is marked in its comment as an audit of the value each item hands on. It is red when an item hands a value other than its name. The press is seen at the look.
- **The fixture's harness stays where it is.** `tests/fixtures/client.ts` imports `tests/ui/menu/GroupContexts.svelte`. `tests/fixtures` holds ten items, and the harness draws the tooltip group, so it sits beside the tooltip tests.
- **The trigger's `.select` rules stay repeated.** They repeat `Select.svelte` in `GlyphSelect.svelte`. Folding them needs a global stylesheet or a wrapper that changes the native select's markup in eight views, which is outside this brief. The orchestrator books it.
- **No test holds TooltipGroup's four settings**: `delayDuration`, `skipDelayDuration`, `disableHoverableContent` and `ignoreNonKeyboardFocus`. No test held them before the move either.
- **The overlap with Q79b** is merged by the orchestrator at the second landing. The files are `tests/ui/{colours,wall}.test.ts` (moved to `tests/ui/theme/` here), `tests/views/system/help.test.ts` and `tests/views/whole/type-scale.test.ts`. Nothing changed for it in this round.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| Words Label, Icon, Page before each field in every row, hidden from a screen reader | DONE | case 1 test; reverts R3, R3b, R3c |
| Field names use Icon (4 strings); keys keep their names | DONE | case 1 and case 8 tests; revert R7 |
| `rail_why_shape` reads `'button {0} is not a label, an icon and a page'` | DONE | `grep -n rail_why_shape config/text/views/system/workbench.yml` prints line 50 with those words; no test held the old words |
| Sentence under the heading | DONE | case 2 test; revert R4 |
| `GlyphSelect` on bits-ui Select: trigger with icon before name, styled as `.select` (rice too) | DONE | case 3 tests; reverts R5, R12, R12b; type-scale R14 |
| The trigger's accessible name is the field's label and the chosen name (`aria-labelledby` over a hidden label span and the `.name` span, ids from `$props.id()`) | DONE | settings "names the trigger by the field label and the chosen name" and the glyph-select closed cases; revert N1 |
| List: empty first, stray, every choice with icon, name first in DOM, portal, z-index 70 | DONE | cases 4 and 5 tests; reverts R8, R9 |
| The items sit inside bits-ui's `Select.Viewport`, which scrolls, so the keys keep the highlighted item in view | DONE for the markup; the scroll itself is seen at the look | "draws every item inside the viewport bits-ui scrolls"; revert V1 |
| One floating list box: `ui/frame/FloatingList.svelte`, used by `MenuList.svelte` and `GlyphList.svelte` | DONE | "draws the list as the listbox bits-ui places..."; reverts F1, F2; menu tests pass unchanged |
| Rice: the empty choice and a stray value line up with the icon column; the list has no rice rule of its own | DONE; CSS only, seen at the look | `GlyphList.svelte` `:global(body.rice) .item .name:only-child { padding-left: calc(3ch + 6px); }` |
| List split into its own component with a harness under `tests/ui/forms/` | DONE | `GlyphList.svelte`, `tests/ui/forms/OpenGlyphList.svelte` |
| Pick hands the name, empty hands `''` | The value each item hands on is pinned; the press that calls `onchange` is seen at the look | case 6 audit; revert R10 |
| Row `.mark` gone | DONE | case 7 test; revert R6 |
| One `Tooltip.Provider` in `ui/menu/TooltipGroup.svelte`, the layout wraps children, `Tooltip.svelte` has none, `DELAY` shared | DONE | case 9 tests; reverts R1, R2; verify item 3 |
| Tests that render a tooltip render it inside the group | DONE | `clientContext` in `tests/fixtures/client.ts` draws the group; revert R13; `tooltipGroup` is no longer exported |
| Absence assertions carry a reason comment directly above them | DONE | the three `expect(glyphsIn(...)).toEqual(['disclosure'])` lines in `settings.test.ts` |
| `Glyph.svelte` head comment names the forms among what draws it | DONE | `Glyph.svelte:5-7` |
| `DESIGN.md:306` | DONE | line 306 opens "One tooltip is open at a time: `ui/menu/TooltipGroup.svelte` holds bits-ui's one Tooltip Provider..." |
| Diagrams regenerated | DONE | `npm run diagrams` exit 0; `tests/checks/diagrams/diagrams.test.ts` passes in the checks run |

The checks script, run from `.agents/worktrees/Q96/tools/oculus` at the end of the round:

```
$ npm test
 Test Files  357 passed (357)
      Tests  5724 passed | 1 skipped (5725)
$ npm run check
1790685207946 COMPLETED 2050 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

Exit 0. The machine's load average was 9 to 14 during the round (`uptime`). Earlier full runs of the same tree timed out once each in `tests/server/git/git-ops.test.ts`, `tests/server/core/git-reads.test.ts`, `tests/checks/imports/order.test.ts` and `tests/server/git/deposit.test.ts`. Run alone, each passed:
- `git-ops.test.ts`: 37 passed.
- `git-reads.test.ts`: 17 passed.
- `order.test.ts`: 13 passed.
- `deposit.test.ts`: 28 passed.

This step touches none of the four files.

The brief's other verify items:
- `npm run diagrams`: exit 0. The diagrams the source change altered are `docs/diagrams/layers.dot`, `layers.svg`, `layer-ui.dot` and `layer-ui.svg`.
- `grep -rn "Tooltip.Provider" src`:
  ```
  src/lib/ui/menu/TooltipGroup.svelte:20:<Tooltip.Provider
  src/lib/ui/menu/TooltipGroup.svelte:27:</Tooltip.Provider>
  ```
- `sh bin/folder-check.sh`: no output, exit 0. The spec's ASCII gate (the perl form) printed nothing, exit 0.

The reverts. Each one was applied by `revert.py` in my scratch folder, then the named test file was run, then the file was put back. The script asserts that the file is byte-identical after restoring. The results are quoted as run:

```
== R1 Tooltip draws its own provider again            (Root wrapped in <Tooltip.Provider>)
   x tooltip.test.ts > Tooltip > is refused by bits-ui when drawn outside the one tooltip group
== R2 the layout draws no group
   x tooltip.test.ts > Tooltip > is drawn under the page layout, which holds the one group
== R3 the Label word goes / R3b the Icon word is read out / R3c the Page word moves after its field
   x settings.test.ts > ... > draws Label, Icon and Page before their fields in every row   (each)
== R4 the sentence goes
   x settings.test.ts > ... > draws the sentence under the heading
== R5 the trigger draws no icon
   x glyph-select.test.ts > the icon dropdown closed > draws the chosen icon before its name on the trigger
   x settings.test.ts > ... > draws the chosen icon and name in the trigger, and the empty words with no icon
   x settings.test.ts > ... > draws the row glyph only inside its icon field
== R6 the row draws its mark again, as the old mark did
   x settings.test.ts > ... > draws the row glyph only inside its icon field
== R7 the refusal words go back to glyph
   x settings.test.ts > ... > names a row with no icon and a row with an unknown one in the word icon
== R8 an item draws its icon before its name in the DOM
   x glyph-select.test.ts > ... > draws the empty choice first, then every choice with its name before its icon
== R9 a stray value is not listed
   x glyph-select.test.ts > ... > draws a value the choices lack as its own item after the empty choice
== R10 an item picks by its words
   x glyph-select.test.ts > ... > gives each item its name as the value a pick hands on, and the empty choice nothing
   x glyph-select.test.ts > ... > lists a name given twice once, and an empty name as the empty choice alone
== R11 names are not made unique
   x glyph-select.test.ts > ... > lists a name given twice once, and an empty name as the empty choice alone
== R12 the trigger draws an icon for any set value
   x glyph-select.test.ts > the icon dropdown closed > draws a value the choices lack by its name, with no icon
   x settings.test.ts > the rail half > draws a row whose glyph the vocabulary lacks by its name with no icon, and names it
== R12b the trigger draws an icon for the empty value
   x glyph-select.test.ts > the icon dropdown closed > draws the empty words and no icon when none is chosen
   x settings.test.ts > the rail half > draws a row "Add a button" appended, with no icon in its field ...
== R13 clientContext draws no tooltip group
   Tests  26 failed | 62 passed (88)
== R14 type scale: GlyphSelect trigger at fs-md
   x type-scale.test.ts > ... > sets every pass-through role in src/lib/ui/forms/choice/GlyphSelect.svelte
== R15 wall: GlyphList highlight drawn as an outline
   x tests/ui/theme/wall.test.ts > ... > answers every surface a component paints, or names it as solid with its reason
== V1 the items are drawn outside bits-ui viewport
   x glyph-select.test.ts > the icon dropdown open > draws every item inside the viewport bits-ui scrolls
== N1 the trigger is named by aria-label again
   x glyph-select.test.ts > the icon dropdown closed > draws the chosen icon before its name on the trigger
   x glyph-select.test.ts > the icon dropdown closed > draws the empty words and no icon when none is chosen
   x settings.test.ts > ... > names the trigger by the field label and the chosen name
   (and 5 more settings cases that find the trigger by its labelled-by ids)
== F1 the floating box drops the attributes bits-ui hands it
   x glyph-select.test.ts > the icon dropdown open > draws the list as the listbox bits-ui places, named by its field, around the viewport
== F2 the shared item size changes (fs-sm to fs-md)
   x type-scale.test.ts > ... > sets every pass-through role in src/lib/ui/frame/FloatingList.svelte
```

R1 to R15 were first run on the tree as handed back. R5, R8, R9, R10, R12 and R12b touch the trigger or the list this round changed, so they were run again at the end of the round and are red on the current tree:
- R5: `3 failed | 24 passed`
- R8: `1 failed | 8 passed`
- R9: `1 failed | 8 passed`
- R10: `2 failed | 7 passed`
- R12: `3 failed | 24 passed`
- R12b: `8 failed | 19 passed`

R8 and R10 were rewritten for the list's new indentation inside the viewport.

Some things have no server test and are seen at the look instead:
- the scroll itself;
- the rice indent;
- the press that calls `onchange`.

Some test changes carry no revert of their own:
- The moves of the colours, theme and wall tests.
- The import-path changes in `primitives.test.ts`, `help.test.ts` and `type-scale.test.ts`.
- The comment rewraps and the reason comments.
- The guard in `tooltipGroup()`, which throws when the group hands over no context. It is a fixture guard, not a case.

## Files with line counts (`wc -l`)

New:
- `src/lib/ui/forms/choice/GlyphSelect.svelte` 135
- `src/lib/ui/forms/choice/GlyphList.svelte` 80
- `src/lib/ui/forms/choice/choices.ts` 26
- `src/lib/ui/frame/FloatingList.svelte` 97
- `src/lib/ui/menu/TooltipGroup.svelte` 27
- `tests/ui/forms/glyph-select.test.ts` 176
- `tests/ui/forms/OpenGlyphList.svelte` 27
- `tests/ui/menu/LaidOutTooltip.svelte` 13
- `tests/ui/menu/GroupContexts.svelte` 14
- `tests/ui/menu/HeldContexts.svelte` 14

Changed:
- `src/lib/views/system/workbench/RailEditor.svelte` 287
- `src/lib/ui/menu/MenuList.svelte` 241, drawn on `FloatingList`, with the box and base item rules gone
- `src/lib/ui/menu/Tooltip.svelte` 376
- `src/lib/ui/display/Glyph.svelte` 75, head comment only
- `src/routes/+layout.svelte` 43
- `config/text/views/system/workbench.yml` 60
- `DESIGN.md` line 306
- `tests/views/system/workbench/settings.test.ts` 304
- `tests/ui/menu/tooltip.test.ts` 162
- `tests/fixtures/client.ts` 42
- `tests/views/whole/type-scale.test.ts` 357
- `tests/ui/theme/wall.test.ts` 210
- `docs/diagrams/layers.*` and `layer-ui.*`, regenerated

Moved, with import paths only:
- `ui/forms/{Select,MultiSelect}.svelte` to `ui/forms/choice/`. `Select.svelte` now takes its stray rule from `choices.ts`, and is 71 lines.
- `ui/menu/{KeySheet.svelte,key-rows.ts}` to `ui/menu/keys/`.
- `ui/menu/tooltip-target.ts` to `ui/menu/tooltip-rules.ts`, 36 lines, which now also holds `DELAY`.
- `tests/ui/{colours,theme,wall}.test.ts` to `tests/ui/theme/`.

Changed only to follow those moves:
- The eight importers of `Select` and `MultiSelect`.
- `shell/Workbench.svelte`.
- `tests/ui/primitives.test.ts` and `tests/views/system/help.test.ts`.
- `tests/checks/tree/allow-duplication.txt`: the path of `wall.test.ts` on 3 lines.
- The comment path references in `TabFace.svelte`, `tones.ts` and `tests/shell/workbench.test.ts`.

## Judgment calls (each reversible)

1. Folder layout under the ten-item rule. `ui/forms`, `ui/menu`, `tests/ui` and `tests/fixtures` each held ten items at base. I split them into folders named for what they hold:
   - `ui/forms/choice/` holds Select, MultiSelect, GlyphSelect, GlyphList and `choices.ts`.
   - `ui/menu/keys/` holds the key sheet, which keeps `Tooltip.svelte` and `TooltipGroup.svelte` at the paths the brief and `DESIGN.md` name.
   - `tests/ui/theme/` holds colours, theme and wall.

   `ui/frame` held 8 items, and `FloatingList.svelte` makes 9.
2. `DELAY` lives in `ui/menu/tooltip-rules.ts`, renamed from `tooltip-target.ts`, and both the provider and `Tooltip.svelte`'s own rest import it. The lint rejects an export from a component's module script (`no-unsafe-argument`), and `ui/menu` had no room for a new file.
3. `FloatingList` takes what differs between the lists as `shape: 'menu' | 'grouped' | 'field'`, and sets the matching class itself, so each variant's rules live in one file with the box rather than in a `:global` rule in each caller.
   - Its item rules are `.list :global(:where(.item))`, so they weigh one class and a list's own item rules always win: MenuList's hover, current and focus ring, and GlyphList's highlight and selection.
   - A `field` list holds its scrolling in the viewport, so its box does not scroll (`overflow-y: hidden`) and the viewport shrinks to the room (`min-height: 0`).
4. `choices.ts` holds `isStray`, which is shared with `Select.svelte`, and `glyphItems`, which drops an empty name and a repeated name among the choices.
5. The trigger draws a caret after the name: the `disclosure` glyph, a chevron-down. This is user-visible, and the brief did not name it.
6. The words are `<span aria-hidden="true">` elements, not `<label>`s.
7. New string keys: `rail_about`, `rail_word_label`, `rail_word_icon`, `rail_word_page`.
8. The trigger's hidden label span uses a scoped `.unseen` rule: 1 px, `clip-path: inset(50%)`, absolute inside the `position: relative` trigger. The tree had no shared visually-hidden rule.
9. The list is at least the trigger's width, and its maximum height is `min(60vh, available height)`. The keyboard's item carries the `--chip` fill, and the selected item is drawn in the accent. The empty choice and a stray value are indented to the icon column: `1.2em + 6px`, and `3ch + 6px` under the rice theme, whose glyph box is `3ch`.
10. `+layout.svelte` gained a head comment ("Layer 3, route").

## Visible changes, for the look

**Settings view, rail list:**
- Before: the heading "RAIL" alone. Each row drew a bare icon, a label input, a native select "Glyph of button N" holding names only, a page select, and the up, down and remove buttons, with no words. The refusal lines said "glyph", including "is not a label, a glyph and a page".
- After: the sentence "Each row is a button on the rail: its words, its icon, and the page it shows." sits under the heading. Each row reads `Label [input]  Icon [icon name v]  Page [select]` and then the buttons, with no icon at the row's start. At a narrow width the row wraps between fields. The refusal lines say "icon": "names no icon", "names an icon glyphs.yml does not hold" and "is not a label, an icon and a page".

**The icon list scrolls with the keys:**
- Before: the list scrolled only by wheel. Down past the visible rows, End, typing "te" for `terminal`, and opening a row whose icon is far down all left the highlighted item out of sight.
- After: each of those brings the highlighted item into view, and opening a row shows its chosen icon.
- To check: Up, Down, Home, End, Enter, and "te" to `terminal`, over the 165 names. The list stays inside the window.

**The trigger's spoken name:**
- Before: a screen reader read "Icon of button 2, button" without the chosen name.
- After: it reads "Icon of button 2 sliders", or "Icon of button 3 Choose an icon" for an empty row.

**Rice theme, the icon list:**
- Before: the empty choice and a stray value sat left of the names that have icons, and the list drew a mono face with square corners, unlike the menus.
- After: those two line up with the icon column, and the list looks as the menus do under rice.

**Menus:** they draw as before, with the same box, items, hover, current and focus ring. Their box is now `FloatingList`, which the icon list shares.

**Tooltips:** over a tree row whose action has its own words, one bubble shows at a time.

## Anything in the brief that was wrong

- The brief's paths would have put three folders over ten items: `ui/forms` (GlyphSelect plus the list component), `tests/ui` (the new `forms/`) and `ui/menu` (TooltipGroup). At base, `ls ... | wc -l` gave 10 for each, and a full run failed with `src/lib/ui/menu holds 11 items`. The split is in judgment call 1. It moves `GlyphSelect` to `ui/forms/choice/GlyphSelect.svelte`.
- Verify item 3 expects one line. The grep prints two, the opening and the closing tag of the one provider, both in `TooltipGroup.svelte`.
