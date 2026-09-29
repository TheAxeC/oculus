# Step Q81 refuter report (reviewer acab87030fa9fa19d, on .agents/worktrees/Q81, base d0ba72f5)

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q81/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null   (from .agents/worktrees/Q81/tools/oculus; exit 0, 3:22 wall)
$ npm test
 Test Files  354 passed (354)
      Tests  5672 passed | 1 skipped (5673)
   Duration  98.24s
$ npm run check
COMPLETED 1960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
✓ built in 12.27s   (plus the usual "Some chunks are larger than 500 kB" warning)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
(no output after eslint .)
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

The report's failure (a 5 s timeout in `tests/server/git/git-ops.test.ts`) did not come back: in this run `npm test` passed all 354 files in one go, so no single-file run was needed.

The commands the report quotes, rerun:
```
grep -n "bits-ui\|fuzzysort" package.json            -> 44: "bits-ui": "2.19.3",  48: "fuzzysort": "4.0.2",
grep -rn "on-body\|onBody\|menuLevel\|menu_back" src config tests   -> nothing, exit 1
wc -l on the 30 changed source files                  -> every count in the report's table matches (Palette 462, Tooltip 381, Modal 159, MenuList 286, ...)
largest src file                                      -> src/lib/state/sources/fs.svelte.ts 881
folder counts ui/menu, ui/frame, ui/controls, state/shared/words, tests/ui/menu -> 10, 7, 9, 9, 4; bin/folder-check.sh exit 0
grep -c "Red when" per file                            -> 4, 2, 1, 1, 3, 4, 2, 3 (primitives), 1 (prompt): matches the report
npm run diagrams, run on a scratch copy               -> docs/diagrams byte-identical to the worktree's (diff -rq prints nothing)
```

To reproduce the first run, I made a scratch copy with the src and config diff reversed (on-body.ts put back from the patch) and ran the new tests against it. Results:
```
state/workbench/palette.test.ts: case 1 red; case 2 (views alone) green; case 3 (title first) green
navigation/status.test.ts: both language tests red;  state/sources/files.test.ts: the 'mntx' test red
shell/keys/palette.test.ts: the marks, the combobox, the palette dialog and the tray dialog tests red; UpdateTray ground test red
ui/menu/tooltip.test.ts: words-in-place, wrapper-is-trigger and presentational-trigger red; the empty-string and presentational-describes-nothing tests green
ui/primitives.test.ts: tool button tooltip and KeySheet dialog red; the Confirm in-place test green
ui/menu/menu.test.ts: case 8 red, case 9 green
shell/keys/workbench-keys.test.ts: "leaves the tray to its dialog" red; "restores no pane on the Escape the dialog has taken" green
```
The on-body grep on the base copy gives 15 lines. The menuLevel|menu_back grep gives 14: 5 in src and config, plus the 9 lines removed from paneview.test.ts.

## 1. Spec

- `src/lib/state/shared/words/fuzzy.ts` (new, 66 lines) is outside the brief's path list, and the report does not name it as a widening. The report lists Modal.svelte, `watchShown` and Search's `field` as widenings and leaves this one out. The same applies to seven test files outside the brief's list of tests: `tests/shell/rail/rail.test.ts`, `tests/shell/keys/workbench-keys.test.ts`, `tests/views/boards/projects.test.ts`, `inbox.test.ts`, `radar.test.ts`, `cardlinks.test.ts` and `data.test.ts`. They are named, but as audits, not as paths added.
- `src/lib/shell/keys/Palette.svelte:441-445`: `.hit { color: var(--accent-txt, var(--accent)); font-weight: 600; }`. Brief decision 4 has two branches. If there is a highlight or match token, use it. If not, use `--accent` at weight 600. `grep` of `themes/tokens.css` finds no such token, so the second branch applies, and it names `--accent`. The builder used `--accent-txt`, the contrast-corrected accent, which is the colour the Search view's `.match` uses (`views/sources/search/Results.svelte:160-163`). But the Search view draws it at weight 700, so the two match looks in oculus now differ in weight. This is a small deviation from the brief's letter, and the orchestrator decides it.
- Dependencies: only bits-ui and fuzzysort are added to `package.json`. The lock adds these packages transitively (read with python over `package-lock.json`):
  - `@floating-ui/core` 1.8.0, `@floating-ui/dom` 1.8.0, `@floating-ui/utils` 0.2.12, from bits-ui.
  - `runed` 0.35.1, which brings `dequal` 2.0.3 and `lz-string` 1.5.0.
  - `svelte-toolbelt` 0.10.6 (MIT by its LICENSE file; its package.json has no license field), which brings `style-to-object` 1.0.14 and `inline-style-parser` 0.2.7.
  - `tabbable` 6.5.0.
  - As peers: `@internationalized/date` 3.12.4 (Apache-2.0), `@swc/helpers` 0.5.23 (Apache-2.0) and `tslib` 2.8.1 (0BSD).

  `runed` declares `@sveltejs/kit` as an optional peer. Because of that, the lock also flips about 30 existing entries from `"dev": true` to `"devOptional": true` or drops the flag: `@sveltejs/kit`, `vite-plugin-svelte`, the rolldown and lightningcss bindings, `cookie`, `mrmime` and others. The report says none of this.
- The brief's cases have no test, or a test that does not hold them:
  - Case 8 is checked only through the catalog key (see Proof).
  - Case 3's title-first rule, the step's own ranking construct, is not held by any test (see Proof).
- The judgment calls, read against the brief:
  - `ui/frame/Modal.svelte`: inside the brief's intent (item 5 and 6's Dialog and Alert Dialog, drawn in place). It adds a primitive and a z-level vocabulary (`level`), which is a widened path the report names.
  - `watchShown` in `ui/shown.ts`: a second ResizeObserver helper beside `onShown`, where item 5 said "(`onShown`), as today". It is needed so that the trap turns off while the tab is hidden, which `onShown` cannot report. This is a substitute with a reason, and it stays inside the brief.
  - Search's `field` prop: needed so Command.Input's attributes reach the ui/ Search primitive. Inside the brief.
  - `menuClosing`: shared closing logic that holds the pick until the list has closed. It changes when `onpick` runs (see Behaviour). The brief said "as today", so this is a decision the brief did not leave open.
  - Highlight token: see above.
  - Submenu chevron (`MenuList.svelte:89-93`, glyph `chevron`): a visible mark the brief did not name. It matches VS Code and is a small user-visible decision.
  - Type-ahead by DOM order with CSS `order: -1` (`MenuList.svelte:15-16, 225-237`): a substitute for the `textValue` shape the brief named. It is justified, because bits-ui 2.19.3 ignores `textValue`: `internal/dom-typeahead.svelte.js:29-32` reads only `textContent`. The report's stated reason is wrong (see Proof).
  - Hand-written `aria-controls` (`Palette.svelte:223`): bits-ui fills `aria-controls` only from a `Command.Viewport` (`command/command.svelte.js:1111`), which item 8 does not name. Pointing it at the listbox is what ARIA asks of a combobox. Inside the brief.
  - ContextMenu opening from the keyboard by a dispatched `contextmenu` event (`ContextMenu.svelte:48-83`): a mechanism of the builder's choice that routes through bits-ui's own trigger. It relies on svelte-toolbelt's `composeHandlers` skipping the next handler after `preventDefault` (`svelte-toolbelt/dist/utils/compose-handlers.js:11`). Inside the brief.
  - The Tooltip's capture-phase Escape (`Tooltip.svelte:168-175, 199-207`): hand code beside bits-ui's tooltip escape layer, needed because that layer calls `preventDefault` before it reads its behaviour (`use-escape-layer.svelte.js:32-36`). It is correct for trusted key events, because the microtask checkpoint between listeners lets Svelte remove the layer first. Inside the brief.
  - Z-order values (Modal 60, 65, 70; list 70; bubble 80): menus opened against their button were z-index 2 inside their surface and are now 70 on the body. This is a decision the brief did not leave open, stated without a before and after.
  - `TextPart` re-exported from `state/workbench/palette.ts`: forced by `tests/checks/tree/boundaries.test.ts:91-107`, which lets shell/ read `state/workbench/palette` but not `state/shared/words/fuzzy`. Inside the brief.
- The report opens with Z45, Z46 and Z47 quoted as open, from the worktree's copy of the state file at the base (lines 88-97). In the main checkout they are closed ("Open items ... - None."). This does not bear on the step's correctness, only on the report's opening block.

## 2. Proof

- `tests/ui/menu/menu.test.ts:42-52` (case 8): "Red when the choice goes back to replacing the list in place after a Back choice." With the old in-place MenuList put back and only `menu_back: Back` removed from `config/text/ui.yml`, the file passes (`Tests 2 passed (2)`, run on the scratch copy). The old MenuList already drew `aria-haspopup="menu"` on a choice with `items`, and drew no Back at the top level. So the only thing that turns the test red is the catalog-key check on lines 48-51, which is a constant, not the submenu. Nothing in the test tells a bits-ui SubTrigger from the old in-place opener (for example `data-menu-sub-trigger` or the SubTrigger's `aria-controls`).
- `tests/state/workbench/palette.test.ts:199-210` (case 3): "Red when the rank drops the title-first rule." I dropped `Number(right.titled) - Number(left.titled) ||` from `src/lib/state/workbench/palette.ts:155` on the scratch copy and ran the file: `Tests 18 passed (18)`. The title-first ordering in `ranked` holds only because fuzzysort's score already puts "Kappa methods" first. A pure index-order sort, the revert the comment names, would turn it red. The step's own construct, `titled`, is not proven by any test.
- The report's first-run table (`Q81-report.md:30-48`) labels the cases wrongly: "2 (files filter)", "3 (language list)", "6 (palette ranking)" and "7 (views alone for no word)". In the brief, 2 is the views alone, 3 is title first, 6 is the language list and 7 is the files filter. My rerun of the first run gives brief 2 green, 3 green, 6 red and 7 red. The results match the numbers, not the labels.
- `Q81-report.md:45`: "13 (greps) | 15 lines each, as the brief counted." On the base copy the counts are 15 and 14 (5 in src and config plus 9 removed from paneview.test.ts), and the brief gives no count.
- `Q81-report.md:159`: "bits-ui's `textValue` prop is not declared on Item." It is declared at `node_modules/bits-ui/dist/bits/menu/types.d.ts:58`. What is true is that the implementation never reads it (`internal/dom-typeahead.svelte.js:29-32`).
- `tests/shell/keys/workbench-keys.test.ts:330` ("restores no pane on the Escape the dialog has taken") stays green with the step reverted (base copy run). Its "Red when" names a revert of a line that predates the step (`workbench-keys.svelte.ts` `event.defaultPrevented` in the final Escape check). It is an audit of the step, and the report counts it among the proofs.
- `tests/ui/controls/prompt.test.ts:34`: the change is a "Red when" comment added to a test the step does not change. That test is green with the step reverted, so it is an audit. The same holds for:
  - `tests/ui/primitives.test.ts` "is drawn in place as a modal alert dialog", green against the hand-built Confirm. Its named revert, a Portal, would turn it red.
  - `tests/ui/menu/tooltip.test.ts` "draws a presentational wrapper that describes nothing".
  - `tests/ui/menu/menu.test.ts` case 9.

  The report does not mark any of these as audits.
- The tooltip-markup edits in rail, workbench, inbox, radar, data, cardlinks and projects tests do not loosen what those tests held. Each old assertion on the hidden `role="tooltip"` bubble with its words becomes an assertion on the hidden `class="words"` span with the same words. The projects.test rewrite makes the attribute order free but still requires `aria-haspopup="menu"` and the label on the same `<button>`.
- No known defect is asserted, no threshold is widened, and no file-scope mutable is added (`menuClosing` keeps `held` and `away` inside the closure).

## 3. Standards

- `src/lib/shell/keys/Palette.svelte:403`: `/* The Command's own box lays the input over the list, as the palette did before it. */` carries history. `agents/spec.md` says a comment never says what came before.
- `tests/shell/keys/workbench-keys.test.ts:315-318`: "... here, only that the shell no longer closes it." This is history in a comment, under the same rule.
- `Q81-report.md:204`: the builder ran `git -C . status` in the worktree. `agents/spec.md` ("You never run a git command") forbids any git command, and the state file bans the `-C` form. The report states it.
- `src/lib/state/workbench/palette.ts:164` (`match`) and `src/lib/state/workbench/navigation/status.ts:292` (`languageChoices`) are now read only by tests (`grep -rn "languageChoices" src tests`; `match` is imported only by `tests/state/workbench/palette.test.ts:9`). `agents/spec.md` principles say "YAGNI ... nothing is built for a need the plan does not name". The brief's cases name both functions, so this is for the orchestrator to weigh.
- `tests/state/sources/files.test.ts:147`: the test title "are the rows whose path holds the query" still describes substring matching, and `matchingFiles` is now fuzzy. The assertions under it still hold for its data.
- The grep of the removed and renamed names (`on-body`, `onBody`, `menuLevel`, `menu_back`, `edgeOf`, "Back choice", `pointerdown` in ui/menu and ui/frame, the shell's Escape branches) across `DESIGN.md`, `HELP.md`, `README.md`, `bin`, `src`, `tests`, `config/text` and `agents/spec.md` found no stale sentence. The only hits are the new test comments in `tests/ui/menu/menu.test.ts:42-43` and Tooltip's own `pointerdown` listener for `over`. `docs/` holds only `diagrams`, which reproduces.
- No file over 1000 lines, no folder over ten items, no non-ASCII in src or tests, and no new `:global` rule in a view or shell component (`git diff | grep ":global"` on added lines prints nothing).

## 4. Behaviour

Each item below is a user-visible change the report does not state, or states without a before and after.
- **The tray's first focus.** Before: the tray took no focus, and the keyboard stayed where it was. After: bits-ui focuses the first tabbable element, the Close ToolButton. When the tray is opened from the keyboard (the palette's `:update`), that focus is `:focus-visible`, so Close's tooltip can open at once. This is from reading the code, not verified in a browser. The report lists the first focus as a judgment call with no before and after.
- **Tooltip after a dialog closes.** The palette, the tray and the key sheet now give the focus back through `Modal.svelte:63-65` (`came.focus()`), a plain focus. When the dialog is closed with Escape, the focus that comes back is `:focus-visible`, so the tooltip of the control that held the focus opens. DESIGN.md:306 exempts only the focus a closing menu gives back. Not verified in a browser.
- **When a pick is answered.** Before: `onpick` ran synchronously in the click, after `focusQuietly(button)`. After: it runs once bits-ui has finished closing (`menu-items.ts:72-112`, from `onCloseAutoFocus` or `onOpenChangeComplete`). The report gives the reason but no before and after.
- **Tab in an open menu.** Before: the list stayed open and the focus moved on through the page. After: bits-ui closes the menu and focuses the next tabbable element after the trigger (`bits-ui/dist/bits/menu/menu.svelte.js:816-835`).
- **Opening a menu.** Before: the list took the keyboard on its first choice when it appeared, whether opened by pointer or key (old MenuList `onMount` `focusAt(0)`). After: a pointer open focuses the content, and an arrow key reaches the first item. ArrowDown, Enter and Space on an opener now open its list through bits-ui's trigger.
- **Tooltip placement near an edge.** Before: a `below` bubble was only clamped left and right. After: bits-ui's collision handling flips it to the other side near the window's bottom. The report says "The on-screen look and the delay are the same as before".
- **Palette Home and End.** Home and End in the palette's input now move the selection and no longer move the caret in the query (`command/command.svelte.js:918-927` calls `preventDefault`). HELP.md:86 states the selection half only.
- **Keyboard trap across the workbench.** The Memories picture overlay, and any Confirm shown in a visible tab, now hold the keyboard for the whole workbench through bits-ui's focus trap. Before, the Memories overlay did not trap, and pressing into another pane gave that pane the keyboard. After, the trap pulls the focus back into the overlay. Item 6 asks for the trap, but the report does not say what it means for the rest of the workbench.
- **Menu lists above other overlays.** Before: a menu list hung against its button was drawn at z-index 2 inside its surface. After: every list is on the body at 70, above the tray (65) and Confirm grounds (60). The report gives the values only.
- **When the grounds dismiss.** Before: a press on the palette and tray grounds closed them on `click`. After: bits-ui's outside interaction closes them on pointer down.
- **Search in the palette.** Words are ANDed across the title, the label and the text. Before, the title was not part of the AND filter (old `palette.ts` built `text` from `label` and `text` only). A query word found only in an item's title now finds it. The report describes fuzzy matching but not this widening of what is searched.

## Not checked

- Every case left to the look: the keys in menus, submenu placement and ArrowLeft and Escape, Shift+F10 and the context menu key (in particular whether Chrome still raises a `contextmenu` event after the `keydown` is prevented), tooltip rest, focus-visible and drag, the trap in a Confirm and in the palette, a hidden-tab Confirm taking the keyboard back through bits-ui's FocusScope remount (`focus-scope.svelte.js:193-201` suggests it re-fires `onOpenAutoFocus`), and the Memories overlay.
- Whether `onOpenChangeComplete` can fire before `onCloseAutoFocus`. If it does, a held pick that raises a dialog would run before `focusQuietly(button)` and then lose the focus to the button. This needs a DOM.
- Whether the tray's `over` Confirm, drawn outside the tray's Dialog.Content, is exempt from the tray's outside-press layer in bits-ui's layer stack.
- The palette's `chosen` value when the index changes while the palette is open (a vanished value leaves no selection, so Enter does nothing).
- Screen-reader effects of bits-ui's `role="application"` on the Command root.

Reviewer usage: about 310k tokens, about 100 tool uses, time not measured.
