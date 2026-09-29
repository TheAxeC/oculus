# Q96 report

Everything in the brief is done. Two places depart from the brief's paths because of the ten-item folder rule. The icon dropdown is at `ui/forms/choice/GlyphSelect.svelte`, not at `ui/forms/GlyphSelect.svelte`. Verify item 3 prints two lines, not one. Both are explained in section 8. Case 6's press itself is left to the look (section 3).

## Open items (verbatim from the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md`)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- None.

## The cases' first run (unchanged source tree)

Each case was written as a test and run on the unchanged source with `npx vitest run tests/views/system/workbench/settings.test.ts tests/ui/forms/glyph-select.test.ts tests/ui/menu/tooltip.test.ts`. The log is in my scratch folder, `first-run.log`. No case turned out to contradict the brief's rules.

| Case | Test | First run |
| --- | --- | --- |
| 1 | settings: draws Label, Icon and Page before their fields in every row | red: `expected false to be true` (no word in the row) |
| 2 | settings: draws the sentence under the heading | red: `expected -1 to be greater than 4833` |
| 3 | settings: draws the chosen icon and name in the trigger...; glyph-select: closed trigger cases | red: `expected '' to contain 'data-glyph="sliders"'` (no icon trigger); glyph-select file red: `Cannot find module .../GlyphSelect.svelte` |
| 4 | glyph-select: draws the empty choice first, then every choice... | red: module not found |
| 5 | glyph-select: draws a value the choices lack as its own item...; closed stray case | red: module not found |
| 6 | glyph-select: gives each item its name as the value a pick hands on... | red: module not found |
| 7 | settings: draws the row glyph only inside its icon field | red: `expected 'data-rail-row="0"><span class="mark s...' not to contain 'class="mark'` |
| 8 | settings: names a row with no icon and a row with an unknown one in the word icon | red: `expected '...' to contain 'button 1 names no icon'` |
| 9 | tooltip: is refused by bits-ui when drawn outside the one tooltip group | red on the unchanged `Tooltip.svelte`, which draws its own provider. This is revert R1 below, which restores that provider: `× ... is refused by bits-ui when drawn outside the one tooltip group`, `Tests 1 failed / 12 passed` |
| 9 | tooltip: is drawn under the page layout, which holds the one group | green on the unchanged tree, since each tooltip carried its own provider. It turns red only once `Tooltip.svelte` has none (revert R2) |
| 10 | look only | not run |

Case 6 in a server render: the test pins the value each item hands to bits-ui. That is `data-value` set to the item's name, and `""` for the empty choice. `GlyphSelect.svelte` passes bits-ui's `onValueChange` straight to `onchange`. A server render cannot press an item, so the press that calls `onchange` is for the look.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| Words Label, Icon, Page before each field in every row, hidden from a screen reader | DONE | case 1 test; reverts R3, R3b, R3c |
| Field names use Icon (4 strings); keys keep their names | DONE | `config/text/views/system/workbench.yml`; case 1 and case 8 tests; revert R7 |
| Sentence under the heading | DONE | case 2 test; revert R4 |
| `GlyphSelect` on bits-ui Select: trigger with icon before name, styled as `.select` (rice too) | DONE | case 3 tests; reverts R5, R12, R12b; type-scale R14; wall entry |
| List: empty first, stray, every choice with icon, name first in DOM, portal, z-index 70, scrolls | DONE | cases 4 and 5 tests; reverts R8, R9 |
| List split into its own component with a harness under `tests/ui/forms/` | DONE | `GlyphList.svelte`, `tests/ui/forms/OpenGlyphList.svelte` |
| Pick hands the name, empty hands `''` | DONE as far as a server render reaches; the press is for the look | case 6 test; revert R10 |
| Row `.mark` gone | DONE | case 7 test; revert R6 |
| One `Tooltip.Provider` in `ui/menu/TooltipGroup.svelte`, the layout wraps children, `Tooltip.svelte` has none, `DELAY` shared | DONE | case 9 tests; reverts R1, R2; verify item 3 |
| Tests that render a tooltip render it inside the group | DONE | `tests/fixtures/client.ts` `clientContext` draws the group; revert R13 turns 26 cases red |
| `DESIGN.md:306` | DONE | line 306 now opens "One tooltip is open at a time: `ui/menu/TooltipGroup.svelte` holds bits-ui's one Tooltip Provider..." |
| Diagrams regenerated | DONE | `npm run diagrams` exit 0; `tests/checks/diagrams/diagrams.test.ts` passes in the checks run |

The checks script, run from `.agents/worktrees/Q96/tools/oculus`. The last line is quoted as printed:

```
$ npm test
 Test Files  357 passed (357)
      Tests  5720 passed | 1 skipped (5721)
$ npm run check
1790681661708 COMPLETED 2049 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

Exit 0. In the run before that one, `tests/server/git/git-ops.test.ts > ... routes each action to its own operation with its own fields` timed out at 5000 ms. Run alone, `npx vitest run tests/server/git/git-ops.test.ts` printed `Test Files 1 passed (1)`, `Tests 37 passed (37)`, and the checks run after that is the one quoted above.

The brief's other verify items:
- `npm run diagrams`: exit 0, with the full list of files it wrote kept in `diagrams-final.log` in my scratch folder. The diagrams that the source change altered are `docs/diagrams/layers.dot`, `layers.svg`, `layer-ui.dot` and `layer-ui.svg`. The diagrams test named these four before the regeneration.
- `grep -rn "Tooltip.Provider" src`:
  ```
  src/lib/ui/menu/TooltipGroup.svelte:20:<Tooltip.Provider
  src/lib/ui/menu/TooltipGroup.svelte:27:</Tooltip.Provider>
  ```
- `sh bin/folder-check.sh`: no output, exit 0. The spec's ASCII gate (the perl form) printed nothing, exit 0.

The reverts. Each one was applied by `revert.py` in my scratch folder, then the named test file was run, then the file was put back. The script asserts that the file is byte-identical after restoring. The results are quoted as run:

```
== R1 Tooltip draws its own provider again            (Tooltip.svelte, Root wrapped in <Tooltip.Provider>)
   × tests/ui/menu/tooltip.test.ts > Tooltip > is refused by bits-ui when drawn outside the one tooltip group
== R2 the layout draws no group                        (+layout.svelte renders children bare)
   × tests/ui/menu/tooltip.test.ts > Tooltip > is drawn under the page layout, which holds the one group
== R3 the Label word goes
   × settings.test.ts > ... > draws Label, Icon and Page before their fields in every row
== R3b the Icon word is read out                       (aria-hidden dropped)
   × settings.test.ts > ... > draws Label, Icon and Page before their fields in every row
== R3c the Page word moves after its field
   × settings.test.ts > ... > draws Label, Icon and Page before their fields in every row
== R4 the sentence goes
   × settings.test.ts > ... > draws the sentence under the heading
== R5 the trigger draws no icon
   × glyph-select.test.ts > the icon dropdown closed > draws the chosen icon before its name on the trigger
   × settings.test.ts > ... > draws the chosen icon and name in the trigger, and the empty words with no icon
   × settings.test.ts > ... > draws the row glyph only inside its icon field
== R6 the row draws its mark again, as the old mark did (hasGlyph-guarded mark before the fields)
   × settings.test.ts > ... > draws the row glyph only inside its icon field
== R7 the refusal words go back to glyph
   × settings.test.ts > ... > names a row with no icon and a row with an unknown one in the word icon
== R8 an item draws its icon before its name in the DOM
   × glyph-select.test.ts > the icon dropdown open > draws the empty choice first, then every choice with its name before its icon
== R9 a stray value is not listed
   × glyph-select.test.ts > the icon dropdown open > draws a value the choices lack as its own item after the empty choice
== R10 an item picks by its words                      (Select.Item value={item.label})
   × glyph-select.test.ts > ... > gives each item its name as the value a pick hands on, and the empty choice nothing
   × glyph-select.test.ts > ... > lists a name given twice once, and an empty name as the empty choice alone
== R11 names are not made unique                       (glyphItems keeps '' and repeats)
   × glyph-select.test.ts > ... > lists a name given twice once, and an empty name as the empty choice alone
== R12 the trigger draws an icon for any set value
   × glyph-select.test.ts > the icon dropdown closed > draws a value the choices lack by its name, with no icon
   × settings.test.ts > the rail half > draws a row whose glyph the vocabulary lacks by its name with no icon, and names it
   × settings.test.ts > ... > names a row with no icon and a row with an unknown one in the word icon
== R12b the trigger draws an icon for the empty value
   × glyph-select.test.ts > the icon dropdown closed > draws the empty words and no icon when none is chosen
   × settings.test.ts > the rail half > draws a row "Add a button" appended, with no icon in its field and the line naming its label
   (and 5 more settings cases; Glyph throws for the empty name, so the whole view render fails)
== R13 clientContext draws no tooltip group
   Tests  26 failed | 62 passed (88)   (every ToolButton, tab and menu-opener case of primitives and settings)
== R14 type scale: GlyphSelect trigger at another size (.select font-size fs-md)
   × type-scale.test.ts > the view type scale > sets every pass-through role in src/lib/ui/forms/choice/GlyphSelect.svelte
== R15 wall: GlyphList highlight drawn some other way  (background replaced by an outline)
   × tests/ui/theme/wall.test.ts > the wallpaper rule > answers every surface a component paints, or names it as solid with its reason
```

Three kinds of test change carry no revert of their own:
- The moves of `colours.test.ts`, `theme.test.ts` and `wall.test.ts`, and the import-path changes in `primitives.test.ts`, `help.test.ts` and `type-scale.test.ts`. They move files or rewrite import paths and assert nothing new.
- The comment rewraps.
- The guard in `tooltipGroup()` (`tests/fixtures/client.ts`) that throws when the group hands over no context. It is a fixture guard, not a case.

## Files with line counts (`wc -l`)

New:
- `src/lib/ui/forms/choice/GlyphSelect.svelte` 113
- `src/lib/ui/forms/choice/GlyphList.svelte` 106
- `src/lib/ui/forms/choice/choices.ts` 26
- `src/lib/ui/menu/TooltipGroup.svelte` 27
- `tests/ui/forms/glyph-select.test.ts` 131
- `tests/ui/forms/OpenGlyphList.svelte` 27
- `tests/ui/menu/LaidOutTooltip.svelte` 13
- `tests/ui/menu/GroupContexts.svelte` 14
- `tests/ui/menu/HeldContexts.svelte` 14

Changed:
- `src/lib/views/system/workbench/RailEditor.svelte` 287
- `src/lib/ui/menu/Tooltip.svelte` 376
- `src/routes/+layout.svelte` 43
- `config/text/views/system/workbench.yml` 60
- `DESIGN.md` line 306
- `tests/views/system/workbench/settings.test.ts` 272
- `tests/ui/menu/tooltip.test.ts` 162
- `tests/fixtures/client.ts` 42
- `tests/views/whole/type-scale.test.ts` 356
- `tests/ui/theme/wall.test.ts` 210 (moved, 2 entries added)
- `docs/diagrams/layers.dot`, `layers.svg`, `layer-ui.dot`, `layer-ui.svg` (regenerated)

Moved, with import paths only:
- `src/lib/ui/forms/{Select,MultiSelect}.svelte` to `src/lib/ui/forms/choice/`. `Select.svelte` now takes its stray rule from `choices.ts`, and is 71 lines.
- `src/lib/ui/menu/{KeySheet.svelte,key-rows.ts}` to `src/lib/ui/menu/keys/`.
- `src/lib/ui/menu/tooltip-target.ts` to `src/lib/ui/menu/tooltip-rules.ts`, 36 lines, which now also holds `DELAY`.
- `tests/ui/{colours,theme,wall}.test.ts` to `tests/ui/theme/`.

Changed only to follow those moves:
- The importers of `Select` and `MultiSelect`: `NewIdeaForm`, `EntryForm`, `AddAccount`, `RailEditor`, `SessionDetail`, `Editor`, `QuickAdd`, `Query`.
- `src/lib/shell/Workbench.svelte`.
- `tests/ui/primitives.test.ts` and `tests/views/system/help.test.ts`.
- `tests/checks/tree/allow-duplication.txt`: the path of `wall.test.ts` on 3 lines, with the marks unchanged.
- The comment path references in `src/lib/ui/tabs/TabFace.svelte`, `src/lib/state/shared/words/tones.ts` and `tests/shell/workbench.test.ts`.

The grep after the renames finds only the new paths, and none in `HELP.md`, `DESIGN.md` or `README.md`. The command was `grep -rln "ui/menu/KeySheet\|ui/menu/key-rows\|forms/Select.svelte\|forms/MultiSelect.svelte\|tooltip-target\|tests/ui/colours.test.ts\|tests/ui/theme.test.ts\|tests/ui/wall.test.ts" src tests bin config DESIGN.md HELP.md README.md`, run before each set of edits.

## Judgment calls (each reversible)

1. Folder layout under the ten-item rule. `ui/forms`, `ui/menu` and `tests/ui` each held ten items at base, and `tests/fixtures` held ten as well. I split them into folders named for what they hold:
   - `ui/forms/choice/` holds Select, MultiSelect, GlyphSelect, GlyphList and `choices.ts`.
   - `ui/menu/keys/` holds the key sheet, which keeps `Tooltip.svelte` and `TooltipGroup.svelte` at the paths the brief and `DESIGN.md` name.
   - `tests/ui/theme/` holds colours, theme and wall.
2. `DELAY` lives in `ui/menu/tooltip-rules.ts`, renamed from `tooltip-target.ts`, and both the provider and `Tooltip.svelte`'s own rest import it. The lint rejected an export from `TooltipGroup.svelte`'s module script (`no-unsafe-argument`, error-typed), and `ui/menu` had no room for a new file.
3. Tests reach the group through `clientContext`. `tooltipGroup()` in `tests/fixtures/client.ts` draws `TooltipGroup` around a component that hands back `getAllContexts()`, because bits-ui keeps the provider under a private key. Every test that draws with `clientContext` is therefore drawn under the real group. The two harness components sit in `tests/ui/menu/`, since `tests/fixtures` is full.
4. `choices.ts` holds `isStray`, which `Select.svelte` now uses too, so the stray rule exists once. It also holds `glyphItems`, which drops an empty name and a repeated name among the choices, because the list keys and picks by value.
5. The trigger draws a caret after the name: the `disclosure` glyph, Lucide `chevron-down`. A native select draws one, and the brief asks for the `.select` look. This is user-visible, and the brief did not name it.
6. The words are `<span aria-hidden="true">` elements, not `<label>`s, as the brief says: decoration beside a field that already has its name.
7. New string keys: `rail_about`, `rail_word_label`, `rail_word_icon`, `rail_word_page`.
8. `rail_why_shape` still reads "is not a label, a glyph and a page". It names the file's keys, and the brief lists the four strings to change without it.
9. The list:
   - It is at least as wide as the trigger (`--bits-floating-anchor-width`), and its maximum height is `min(60vh, available height)`.
   - The keyboard's item carries the menus' `--chip` fill, and the selected item is drawn in the accent.
   - The empty choice and a stray value are indented so their words line up with the names that have icons. The indent is `calc(1.2em + 6px)`, which matches the icon box. In the ASCII glyph mode the box is wider, so they may not line up there.
10. `+layout.svelte` gained a head comment ("Layer 3, route"), since it now holds more than styles.

## Visible changes, for the look (Settings view, rail list)

- Before: the heading "RAIL" alone. Each row drew a bare icon, a label input, a native select named "Glyph of button N" holding names only, a page select, and the up, down and remove buttons, with no visible words. The refusal lines read "names no glyph" and "names a glyph glyphs.yml does not hold".
- After: the sentence "Each row is a button on the rail: its words, its icon, and the page it shows." sits under the heading. Each row reads `Label [input]  Icon [icon name v]  Page [select]` and then the three buttons, with no separate icon at the row's start. At a narrow width the row wraps between fields, and each word stays with its field. The refusal lines say "icon".
- The icon field opens a list drawn over the page. It shows "Choose an icon" first, then a stray value if the row has one, then all 165 names, each with its icon drawn before it. The list scrolls and stays inside the window. The things to try: Up, Down, Home, End, Enter, and typing "te" to reach `terminal`.
- Tooltips: over a tree row whose row action has its own words, only one bubble shows at a time. Every tooltip still waits 150 ms.

## Anything in the brief that was wrong

- The brief's paths would have put three folders over ten items: `ui/forms/GlyphSelect.svelte` plus the list component, a new `tests/ui/forms/`, and `ui/menu/TooltipGroup.svelte`. At base, `ls src/lib/ui/forms | wc -l`, `ls tests/ui | wc -l` and the `ui/menu` count each gave 10, and the first full run failed with `src/lib/ui/menu holds 11 items`. The split is in judgment call 1. It moves `GlyphSelect` to `ui/forms/choice/GlyphSelect.svelte`.
- Verify item 3 expects one line. `grep -rn "Tooltip.Provider" src` prints two, the opening and the closing tag, both in `ui/menu/TooltipGroup.svelte` (quoted above).
- Overlap with Q79b, which is in flight. Q79b's brief lists `tests/ui/colours.test.ts`, `tests/ui/wall.test.ts`, `tests/views/system/help.test.ts` and `tests/views/whole/type-scale.test.ts` among its paths, and this step moves the first two and edits the last two:
  - `help.test.ts`: one import line.
  - `type-scale.test.ts`: the RailEditor entry, three new entries, and the paths of the moved files.

  Git's rename detection should carry Q79b's edits onto the moved files at the second cherry-pick, but that is not verified. Whichever step lands second needs its diff checked on those four files.
