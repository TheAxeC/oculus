Everything in the brief and in repair round 1 is done. The full verify list was not run in this round, as the round brief says; the orchestrator runs it on main at landing.

# Q81 report, repair round 1: menus, context menus, tooltips and dialogs on bits-ui 2.19.3, the palette on bits-ui's Command with fuzzysort 4.0.2

## Open items (verbatim, main checkout `tools/oculus/.scratch/migration/orchestrator-state.md`, read at the end of this round)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- None.

## The cases' first run, and the ruling

Each case a server test can show was written as a test and run against the unchanged tree before any code changed. Rows follow the brief's case numbers. The cases this round changed (3, 6, 7 and 8) were run again against the base sources; those results are in the last column.

| Brief case | First run (before any code change) | Rerun this round against the base sources |
|---|---|---|
| 1, fuzzy match of `rpls`, `raw pls`, `zzzq` | red | red: `TypeError: ranked is not a function` (the test now calls `ranked`) |
| 2, views alone for no word | green | red: `TypeError: ranked is not a function` |
| 3, title match first | green | red: `TypeError: ranked is not a function` |
| 4, marked letters in the palette row | red | not changed |
| 5, combobox, listbox, option ids | red | not changed |
| 6, language list | red | red: `TypeError: languageMatches is not a function` |
| 7, files filter | red | red: `1 failed` (the `mntx` case) |
| 8, submenu trigger, no Back | did not load: `Cannot find package 'bits-ui'` | red: `expected '<button type="button" class="item sve...' to match /^<[a-z]+ [^>]*data-dropdown-menu-sub-.../` (old in-place `MenuList.svelte`, `menu-items.ts` and `on-body.ts` from the base; `menu_back` is already absent from `config/text/ui.yml`) |
| 9, item check, dot, glyph, badge | did not load: `Cannot find package 'bits-ui'` | not changed; green on the base, now marked an audit |
| 10, "the wrapper is the trigger" | red | not changed |
| 10, empty string; presentational describes nothing | green | not changed; the presentational case now marked an audit |
| 11, Confirm in place | green | not changed; now marked an audit |
| 12, Prompt field and verb | green | not changed; now marked an audit |
| 13, greps | 15 lines (`on-body\|onBody` in src) and 14 lines (`menuLevel\|menu_back` in src, config and tests) | not changed |
| 14, sheet, palette, tray as bits-ui dialogs | red | not changed |
| 14, Memories | look only | not changed |
| 15 | look only | not changed |

The coordinator's ruling (main checkout `tools/oculus/.scratch/migration/agents/briefs/Q81-cases.md`):

1. Case 5 is ruled (a). `aria-activedescendant` belongs to the Command and is a look case. The server test shows `role="combobox"` on the input, `role="listbox"` on the list, and `role="option"` with an `id` on each row. No selected id is written by hand.
2. Item 6: the key sheet, the palette and the tray close through bits-ui's Escape layer, calling the shell's `onclose`. A Confirm inside the tray takes the first Escape. The shell's three Escape branches in `shell/keys/workbench-keys.svelte.ts` and the tests that asserted them are removed; `?`, Cmd-K, `:` and the sheet's early return stay.
3. Case 10: the always-on description stays through `tip-ids.ts` and `tooltip-target.ts`, and the "wrapper is the trigger" test stays.
4. Case 14, Memories: left to the look.

The repair round's rulings are listed under the user-visible changes and the judgment calls below.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| Change 1: a dialog's focus is quiet on opening and on going | DONE | `ui/frame/Modal.svelte` `opened` always prevents bits-ui's first focus, calls `onopen` or `focusFirstQuietly(box)`, and gives the focus back with `focusQuietly(came)`; `focusFirstQuietly` added to `ui/menu/tooltip-target.ts`; DESIGN.md:306 and Modal's head comment name it. Browser-only, so left to the look; no test over source text |
| Change 2: `.hit` is the Search view's match look | DONE | `Palette.svelte` `.hit { background: none; color: var(--accent-txt, var(--accent)); font-weight: 700; }` |
| Change 3: `match` and `languageChoices` removed | DONE | `grep -rn "languageChoices\|match(index" src tests DESIGN.md HELP.md README.md bin` prints nothing; tests read `ranked(...).map((found) => found.item...)` and `languageMatches(...).map((found) => found.choice...)` |
| Change 4: case 8 held by the submenu | DONE | red quoted above |
| Change 5: case 3 held by the title-first rule | DONE | red quoted under "Reds" below |
| Change 6: comments and a title | DONE | `grep -rn "no longer\|as the palette did" tests/shell/keys/workbench-keys.test.ts src/lib/shell/keys/Palette.svelte` prints nothing; files.test title reads "are the rows whose path the query fuzzily matches" |
| Change 7: audits marked | DONE | the five comments below |
| Changed test files | green | `npx vitest run` over the 9 changed or touched test files: `Test Files  9 passed (9)`, `Tests  171 passed (171)` |
| `npm run check` | green | `COMPLETED 1960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run format:check` | green | `All matched files use Prettier code style!` |
| `npm run lint` | green | exit 0, no output after `eslint .` |
| `npm run diagrams` | run | regenerated `docs/diagrams/`, last lines `docs/diagrams/channels.svg`, `writes.dot`, `writes.svg` |
| ASCII | clean | `LC_ALL=C grep -rn '[^ -~<tab>]' src tests DESIGN.md HELP.md` prints nothing |
| Full verify list | NOT RUN in this round | the round brief reserves it for landing. The refuter's run of `checks.sh` over the step before this round: `Test Files  354 passed (354)`, `checks: 6 commands passed` |

These green results do not cover the browser behaviour: the quiet focus, the keys, the placement and the traps are look cases.

## Reds for the new or changed cases (the guarded change undone, then the file put back; `shasum` matched before and after each)

- **Case 3, title first.** Removed `Number(right.titled) - Number(left.titled) || ` from `ranked` in `state/workbench/palette.ts`: `FAIL ranks the item whose title matches above one whose text alone does`, `AssertionError: expected [ 'project:beta', 'project:spread' ] to deeply equal [ 'project:spread', 'project:beta' ]`, `Tests  1 failed | 17 passed (18)`. The two items are `Beta study` with text `kappa`, and `Kinetic appraisal of pain`, whose title holds the letters of `kappa` spread out; fuzzysort's score alone ranks the text match first.
- **Case 8, submenu.** Put back the base `MenuList.svelte` (in-place list), with the base `menu-items.ts` and `on-body.ts` it imports: `FAIL is a submenu trigger, and the menu draws no Back choice`, `AssertionError: expected '<button type="button" class="item sve...' to match /^<[a-z]+ [^>]*data-dropdown-menu-sub-.../`, `Tests  1 failed | 1 passed (2)`. The attribute name is `data-dropdown-menu-sub-trigger`, from `getBitsAttr("sub-trigger")` (`bits-ui/dist/bits/menu/menu.svelte.js:1215`) with the prefix `data-${variant}-` (`internal/attrs.js`).
- **Case 1 (rewritten onto `ranked`).** `ranked` filtered by lowercased substrings of title, label and text before scoring: `FAIL finds a title by letters in its order, ...` with `AssertionError: expected [] to include 'project:raw'`, and case 3 red with `expected [ 'project:beta' ] to deeply equal [ 'project:spread', 'project:beta' ]`, `Tests  2 failed | 16 passed (18)`.
- **Case 6 (rewritten onto `languageMatches`).** `languageMatches` changed to a substring filter: `FAIL lists Plain Text first ...` (`expected [ 'javascript', 'bash', 'typescript' ] to deeply equal [ 'javascript', 'typescript', 'bash' ]`) and `FAIL matches a language by the letters of its name in their order` (`expected [] to include 'TypeScript'`), `Tests  2 failed | 17 passed (19)`.
- **Case 7 (title changed).** `matchingFiles` changed to a substring filter: `FAIL keeps every row for no query, a row whose path holds the letters in order, ...`, `AssertionError: expected [] to include 'manuscript/main.tex'`, `Tests  1 failed | 7 passed (8)`.

## Audits (green with the step undone, as the review ran them; each comment now says so)

- `tests/shell/keys/workbench-keys.test.ts` "restores no pane on the Escape the dialog has taken".
- `tests/ui/controls/prompt.test.ts` "draws each field by its label with the text it begins with, and its yes and its cancel".
- `tests/ui/primitives.test.ts` "is drawn in place as a modal alert dialog with its message, detail and two buttons" (its comment keeps the Portal as the change that turns it red).
- `tests/ui/menu/tooltip.test.ts` "draws a presentational wrapper that describes nothing".
- `tests/ui/menu/menu.test.ts` "draws its check, its dot, its glyph and its badge, hidden from its name".
- The tooltip-markup edits in rail, workbench, inbox, radar, data, cardlinks and projects tests, the `wall.test.ts` selector key, the `type-scale.test.ts` entry and the `paneview.test.ts` removal follow the markup and names the step changed; they hold what they held before.

## Files, lines before and after

"Before" is the step's base. Main has moved since the base (Q82 and Q87 landed), so for the four files main has changed since (`DESIGN.md`, `HELP.md`, `package.json`, `tests/views/whole/type-scale.test.ts`) the counts are the base's and the step's own edits, not a diff against today's main. Every other row is `wc -l` and `diff` against the main checkout, whose copy of these files is still the base's. `package-lock.json` and `docs/diagrams/*` are not counted.

| File | Before | After | Added | Removed |
|---|---|---|---|---|
| DESIGN.md | 322 | 322 | 2 | 2 |
| HELP.md | 294 | 294 | 2 | 2 |
| package.json | 56 | 58 | 2 | 0 |
| config/text/ui.yml | 64 | 63 | 0 | 1 |
| src/lib/shell/keys/Palette.svelte | 387 | 463 | 246 | 170 |
| src/lib/shell/keys/workbench-keys.svelte.ts | 432 | 421 | 7 | 18 |
| src/lib/shell/rail/UpdateTray.svelte | 258 | 248 | 69 | 79 |
| src/lib/shell/status/Bell.svelte | 106 | 110 | 10 | 6 |
| src/lib/shell/status/NoticeCentre.svelte | 165 | 166 | 56 | 55 |
| src/lib/shell/status/RepoItems.svelte | 172 | 172 | 5 | 5 |
| src/lib/state/shared/words/fuzzy.ts | 0 | 66 | 66 | 0 |
| src/lib/state/sources/files.svelte.ts | 154 | 160 | 10 | 4 |
| src/lib/state/workbench/navigation/status.ts | 296 | 301 | 15 | 10 |
| src/lib/state/workbench/palette.ts | 196 | 218 | 40 | 18 |
| src/lib/ui/controls/Confirm.svelte | 176 | 114 | 24 | 86 |
| src/lib/ui/controls/Search.svelte | 79 | 86 | 8 | 1 |
| src/lib/ui/forms/Prompt.svelte | 173 | 131 | 33 | 75 |
| src/lib/ui/frame/Modal.svelte | 0 | 170 | 170 | 0 |
| src/lib/ui/frame/on-body.ts | 16 | 0 | 0 | 16 |
| src/lib/ui/menu/ContextMenu.svelte | 103 | 124 | 76 | 55 |
| src/lib/ui/menu/KeySheet.svelte | 121 | 113 | 29 | 37 |
| src/lib/ui/menu/Menu.svelte | 199 | 163 | 62 | 98 |
| src/lib/ui/menu/MenuList.svelte | 394 | 286 | 160 | 268 |
| src/lib/ui/menu/MenuOpener.svelte | 214 | 208 | 13 | 19 |
| src/lib/ui/menu/Tooltip.svelte | 327 | 381 | 175 | 121 |
| src/lib/ui/menu/menu-items.ts | 49 | 113 | 75 | 11 |
| src/lib/ui/menu/tooltip-target.ts | 48 | 62 | 16 | 2 |
| src/lib/ui/shown.ts | 19 | 37 | 20 | 2 |
| src/lib/views/personal/memories/Memories.svelte | 419 | 444 | 55 | 30 |
| tests/shell/keys/palette.test.ts | 225 | 276 | 53 | 2 |
| tests/shell/keys/workbench-keys.test.ts | 425 | 422 | 15 | 18 |
| tests/shell/panes/paneview.test.ts | 224 | 190 | 0 | 34 |
| tests/shell/rail/rail.test.ts | 282 | 283 | 2 | 1 |
| tests/shell/workbench.test.ts | 842 | 845 | 4 | 1 |
| tests/state/sources/files.test.ts | 155 | 166 | 12 | 1 |
| tests/state/workbench/navigation/status.test.ts | 287 | 301 | 22 | 8 |
| tests/state/workbench/palette.test.ts | 249 | 291 | 52 | 10 |
| tests/ui/controls/prompt.test.ts | 59 | 60 | 1 | 0 |
| tests/ui/menu/OpenMenu.svelte | 0 | 23 | 23 | 0 |
| tests/ui/menu/menu.test.ts | 0 | 91 | 91 | 0 |
| tests/ui/menu/tooltip.test.ts | 110 | 138 | 38 | 10 |
| tests/ui/primitives.test.ts | 808 | 838 | 32 | 2 |
| tests/ui/wall.test.ts | 206 | 206 | 2 | 2 |
| tests/views/boards/projects.test.ts | 858 | 860 | 4 | 2 |
| tests/views/feeds/inbox.test.ts | 449 | 451 | 4 | 2 |
| tests/views/feeds/radar.test.ts | 371 | 372 | 4 | 3 |
| tests/views/shared/card/cardlinks.test.ts | 295 | 289 | 3 | 9 |
| tests/views/sources/data.test.ts | 340 | 340 | 1 | 1 |
| tests/views/whole/type-scale.test.ts | 349 | 350 | 1 | 0 |

In all, 1810 lines added and 1297 removed. The six menu and tooltip primitives went from 1286 lines to 1275. The four dialogs went from 728 to 606, plus the 170-line `Modal.svelte` they share. Because main has moved, the landing cherry-pick meets main's changes in `DESIGN.md` (line 309, the Files and Repositories paragraph), `HELP.md`, `package.json` and `type-scale.test.ts`. The changed lines do not overlap.

## Paths beyond the brief's list (widenings)

- `src/lib/ui/frame/Modal.svelte` (new primitive, with its `level` values `dialog`, `tray`, `palette`, `sheet`).
- `watchShown` in `src/lib/ui/shown.ts`.
- The `field` prop on `src/lib/ui/controls/Search.svelte`.
- `src/lib/state/shared/words/fuzzy.ts` (new, the one fuzzysort wrapper for the palette, the language list and the files filter).
- `focusFirstQuietly` in `src/lib/ui/menu/tooltip-target.ts` (this round, change 1).
- Seven test files outside the brief's list: `tests/shell/rail/rail.test.ts`, `tests/shell/keys/workbench-keys.test.ts`, `tests/views/boards/projects.test.ts`, `tests/views/feeds/inbox.test.ts`, `tests/views/feeds/radar.test.ts`, `tests/views/shared/card/cardlinks.test.ts`, `tests/views/sources/data.test.ts`.

## Dependencies

`package.json` adds two, pinned, in `dependencies`: `"bits-ui": "2.19.3"` and `"fuzzysort": "4.0.2"`. `package-lock.json`, compared with python against the main checkout's lock, adds these packages. Licences are from the lock entries unless noted.

| Package | Version | Licence | Brought by |
|---|---|---|---|
| bits-ui | 2.19.3 | MIT | direct |
| fuzzysort | 4.0.2 | MIT | direct |
| @floating-ui/core | 1.8.0 | MIT | bits-ui |
| @floating-ui/dom | 1.8.0 | MIT | bits-ui |
| @floating-ui/utils | 0.2.12 | MIT | bits-ui |
| runed | 0.35.1 | MIT | bits-ui |
| dequal | 2.0.3 | MIT | runed |
| lz-string | 1.5.0 | MIT | runed |
| svelte-toolbelt | 0.10.6 | MIT by its `LICENSE` file; no licence field in the lock | bits-ui |
| style-to-object | 1.0.14 | MIT | svelte-toolbelt |
| inline-style-parser | 0.2.7 | MIT | style-to-object |
| tabbable | 6.5.0 | MIT | bits-ui |
| @internationalized/date | 3.12.4 | Apache-2.0 | peer |
| @swc/helpers | 0.5.23 | Apache-2.0 | peer |
| tslib | 2.8.1 | 0BSD | peer |

`runed` declares `@sveltejs/kit` as an optional peer (`node_modules/runed/package.json:60-62`). With it, the lock changes the flags of 58 existing entries: 31 go from `"dev": true` to `"devOptional": true` and 27 lose the `dev` flag. Among them are `@sveltejs/kit`, `@sveltejs/vite-plugin-svelte`, `vite`, `rolldown` and its bindings, `lightningcss` and its bindings, `typescript`, `cookie`, `mrmime`, `sirv` and `postcss`. What this changes for an install is not verified: a full install takes every entry either way, and whether a production-only install (`npm ci --omit=dev`) now keeps the entries that lost the flag was not run.

## Judgment calls

- **Highlight.** The theme has no highlight or match token (grep of `themes/tokens.css`). `.hit` is `var(--accent-txt, var(--accent))` at weight 700 with no fill, as `views/sources/search/Results.svelte`'s `.match` draws, so oculus has one match look. Brief decision 4 named `--accent` at weight 600 when no token exists; the colour here is the accent's text variant, which is what the theme already uses for search matches, and the weight is 700 against the decision's 600. This was ruled in this round (change 2).
- **Submenu chevron.** A trailing `chevron` glyph on a choice with its own list, as VS Code draws one. Ruled in.
- **Type-ahead.** The label is first in each item's DOM, with the dot and glyph drawn before it by CSS `order: -1`. bits-ui 2.19.3 declares `textValue` on Item (`bits/menu/types.d.ts:58`), but its type-ahead reads only `textContent` (`internal/dom-typeahead.svelte.js:29-32`), so a `textValue` would change nothing. Ruled in.
- **`menuClosing`** in `ui/menu/menu-items.ts`, shared by Menu and ContextMenu. On close, focus goes back to the opener quietly, unless the menu was left by Tab or a press elsewhere. The pick is held until the focus is back, so a dialog the pick opens keeps its focus. Ruled in.
- **`ui/frame/Modal.svelte`** with its levels, **`watchShown`**, **Search's `field`**, the hand-written **`aria-controls`** on the palette input (naming `palette-list`, since no `Command.Viewport` is used), the **context menu opened from the keyboard** by a dispatched `contextmenu` event at the control's right edge, the **Tooltip's capture-phase Escape**, and **`TextPart`** re-exported from `state/workbench/palette.ts` for the boundaries rule. All ruled in.
- **The dialog's first focus.** `onopen` when the box gives one; otherwise the first control inside the dialog's `role="dialog"` or `role="alertdialog"` element that is not disabled, in the order `a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])`. The `onopen` focuses of Confirm (its yes button), Prompt (its first input) and the palette (its input) stay plain `focus()` calls. None of those controls has a tooltip.
- **Z-order.** Dialog ground 60, tray 65, palette, sheet and menu lists 70, tooltip bubble 80. The tray's Confirm is drawn in Modal's `over` snippet, on the tray's ground.

## User-visible changes, before and after

- **Escape on the key sheet.** Before: the shell closed it on Escape or `?`. After: bits-ui closes it on Escape; the shell closes it on `?`.
- **Escape on the palette.** Before: the shell closed it. After: bits-ui closes it.
- **Escape on the update tray.** Before: the shell closed it unless a Confirm over it had already taken the key. After: bits-ui's escape layer closes it; a Confirm over the tray takes the first Escape and the next closes the tray.
- **A dialog's focus is quiet (change 1).** Before: no dialog gave focus quietly, and the tray, palette and sheet gave no focus back at all. After: a dialog puts its first focus and gives the focus back through `focusQuietly`, so the control it lands on opens no tooltip, even when the focus is `:focus-visible`.
- **The tray's first focus.** Before: none; the keyboard stayed where it was. After: the Close button, quietly.
- **Focus given back after a dialog closes.** Before: the palette, tray and sheet gave none. After: the control that held the focus when the ground was drawn gets it back, quietly, while it is still on the page.
- **When a pick is answered.** Before: `onpick` ran inside the click, after the focus went back to the opener. After: it runs once bits-ui has closed the menu and the focus is back.
- **The chevron.** Before: no mark on a choice with its own list. After: a trailing chevron.
- **Submenus.** Before: a choice with its own list replaced the menu's contents in place, with a Back choice (`ui.menu_back`). After: the list opens to the side; ArrowRight or Enter opens it, ArrowLeft or Escape closes it and puts the focus back on its choice. The Back choice and its string are gone.
- **Tab in an open menu.** Before: the list stayed open and the focus moved on. After: bits-ui closes the menu and the focus goes to the next tabbable element after the opener.
- **Opening a menu.** Before: the list focused its first choice however it was opened. After: a pointer open focuses the list and an arrow key reaches the first choice; ArrowDown, Enter and Space on the opener open the list through bits-ui's trigger.
- **Tooltip placement near an edge.** Before: a bubble below its control was clamped left and right only. After: bits-ui flips it to the other side near the window's bottom edge.
- **Palette Home and End.** Before: they moved the caret in the query. After: they move the selection.
- **The keyboard held by a Confirm and the Memories overlay.** Before: the Memories overlay did not trap the focus, and a press in another pane gave that pane the keyboard. After: bits-ui's focus trap holds the keyboard for the whole workbench while a Confirm in a visible tab or the Memories overlay shows.
- **Menu lists.** Before: a menu list hung against its button at z-index 2 inside its surface. After: every list is on the body at z-index 70, above the tray (65) and the dialog grounds (60).
- **Dismissing a ground.** Before: a press on the palette or tray ground closed it on `click`. After: bits-ui's outside interaction closes it on pointer down.
- **Palette search.** Before: substring words matched over the label and text; the title was not searched. After: fuzzysort matches every typed word, letters in order, over the title, the label and the text; a title match ranks first, then the better score; the matched letters of the title are drawn in the match look (change 2: accent text colour, weight 700). The files filter and the language list match the same way.
- **Palette selection.** Now bits-ui Command's, announced through `aria-activedescendant` (a look case).
- **Tooltips.** The bubble is drawn on the body and placed by bits-ui; its accessible words are a hidden span under the tooltip id. The delay is the same.
- **Menu height.** A list longer than its room scrolls within `--bits-floating-available-height`.

## Cases left to the look

- Case 5: the input's `aria-activedescendant` names the selected row and follows ArrowUp, ArrowDown, Home and End.
- Case 14, Memories: the lightbox is a bits-ui dialog; Escape and the arrows behave as before.
- Case 15 in full.
- The quiet focus of change 1: the tray opened from the palette's `:update` puts the focus on Close with no tooltip; a dialog closed with Escape gives the focus back with no tooltip.
- Focus goes back to the opener after each menu closes, with no tooltip.
- Menus opened by pointer; submenus placed to the side near the window's edges.
- A dialog left open in a hidden tab holds nothing of the page and takes the keyboard again when its tab shows.
- The tray's Confirm takes the first Escape.

## What in the brief was wrong or impossible

- **Item 6 / Decision 3.** The brief expected the shell's Escape branches to keep working under bits-ui. `bits-ui/dist/bits/utilities/escape-layer/use-escape-layer.svelte.js:32-36` calls `preventDefault()` on Escape for the responsible layer before it reads `escapeKeydownBehavior`, and `workbench-keys.svelte.ts` checked `defaultPrevented`, so those branches would never have closed anything. Ruled as point 2 above.
- **Case 5.** The brief had the listbox carry `aria-activedescendant`; bits-ui puts it on the Command input, and only in the page. Ruled as point 1.
- **Case 10.** bits-ui's Tooltip gives the trigger `aria-describedby` only while the bubble is open (`tooltip/tooltip.svelte.js:595`), so the always-on description stays in oculus's code. Ruled as point 3.

## Git

A read-only `git -C . status` was run once in the worktree while the step was being built, against the rule. It changed nothing. No git command was run in this round.
