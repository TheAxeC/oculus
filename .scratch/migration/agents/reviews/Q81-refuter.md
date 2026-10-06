# Step Q81 refuter report (reviewer acab87030fa9fa19d, on .agents/worktrees/Q81, base bb8a837b)

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

## Repair round 1, refuted

Two things block landing. First, the round leaves `npm test` red. `tests/checks/imports/order.test.ts` fails in the full run and again when run alone, because the new import in `Modal.svelte` goes up the ui folder order. Second, the round's change 1 stops the key sheet from taking the focus when it opens, which undoes brief item 6 for the sheet. I found this by reading the code; I did not check it in a browser.

### Verification

Run from `.agents/worktrees/Q81/tools/oculus`:
```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null   (exit 1, 110 s)
$ npm test
 FAIL  tests/checks/imports/order.test.ts > the folder order of each layer > holds the ui folders
+   "ui/frame/Modal.svelte:23 imports ui/menu/tooltip-target.ts (ui/menu, above ui/frame)",
 FAIL  tests/server/git/git-ops.test.ts > through the endpoint, with the real operations > routes the deletion actions: take the deletion, and mark resolved
Error: Test timed out in 5000ms.
 Test Files  2 failed | 352 passed (354)
      Tests  2 failed | 5670 passed | 1 skipped (5673)
checks: failed with exit 1: npm test
```

Each failing file run alone:
```
$ npx vitest run tests/checks/imports/order.test.ts
 FAIL  tests/checks/imports/order.test.ts > the folder order of each layer > holds the ui folders
+   "ui/frame/Modal.svelte:23 imports ui/menu/tooltip-target.ts (ui/menu, above ui/frame)",
 Test Files  1 failed (1)
      Tests  1 failed | 12 passed (13)
$ npx vitest run tests/server/git/git-ops.test.ts
 Test Files  1 passed (1)
      Tests  37 passed (37)
```
- `order.test.ts` is not a file the step changes, but the failure comes from this round's delta (`Modal.svelte:23`, added by `git diff 67d7fef0`), and it stays red when the file runs alone.
- `git-ops.test.ts` passes alone. It is the known flaky file and is not the step's.

The remaining commands, run one by one:
```
$ npm run check          exit 0   COMPLETED 1960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build          exit 0   ✓ built in 8.10s
$ npm run format:check   exit 0   All matched files use Prettier code style!
$ npm run lint           exit 0   (no output after eslint .)
$ ! LC_ALL=C grep -rna '[^ -~]' src tests     grep exit 1 (nothing printed)
spec.md's perl ASCII gate over src tests bin config    exit 0, nothing printed
$ npm run diagrams   (on a scratch copy, node_modules linked)   exit 0; diff -rq against the worktree's docs/diagrams prints nothing
```
The regenerated `docs/diagrams/layer-ui.dot` gains the edge `"folder ui/frame to folder ui/menu"`, which is the same upward import the order check fails on.

The commands the builder's report quotes, rerun:
```
grep -rn "languageChoices\|match(index" src tests DESIGN.md HELP.md README.md bin   -> nothing, exit 1
npx vitest run (the 9 changed or touched test files)   -> Test Files 9 passed (9), Tests 171 passed (171)
LC_ALL=C grep -n '[^ -~<tab>]' DESIGN.md HELP.md        -> nothing, exit 1
grep -rn "no longer\|as the palette did" tests/shell/keys/workbench-keys.test.ts src/lib/shell/keys/Palette.svelte   -> nothing, exit 1
lock against the base (python, lock rebuilt with the base diff reversed)   -> 15 packages added (bits-ui, fuzzysort, @floating-ui/core|dom|utils, runed, dequal, lz-string, svelte-toolbelt, style-to-object, inline-style-parser, tabbable, @internationalized/date, @swc/helpers, tslib); 31 entries dev -> devOptional, 27 lose dev
```
- The 27 entries that lose `dev` are all `@rolldown/binding-*`, `lightningcss-*` and `fsevents`, and each keeps `optional: true`. They are platform bindings, not vite or typescript.

Reds reproduced on a scratch copy of `src`, `tests` and `config` with `node_modules` linked. `src` was restored after each run and `diff -r src <worktree>/src` came back clean each time.
```
case 3: Number(right.titled) - Number(left.titled) || removed from ranked
  FAIL ... ranks the item whose title matches above one whose text alone does
  AssertionError: expected [ 'project:beta', 'project:spread' ] to deeply equal [ 'project:spread', 'project:beta' ]
  Tests  1 failed | 17 passed (18); restored: Tests 18 passed (18)
case 8: base MenuList.svelte, menu-items.ts and on-body.ts put back
  FAIL ... is a submenu trigger, and the menu draws no Back choice
  AssertionError: expected '<button type="button" class="item sve…' to match /^<[a-z]+ [^>]*data-dropdown-menu-sub-…/
  Tests  1 failed | 1 passed (2)
case 1: substring filter over title, label and text added to ranked
  FAIL finds a title by letters in its order ... expected [] to include 'project:raw'
  FAIL ranks the item whose title matches ... expected [ 'project:beta' ] to deeply equal [ 'project:spread', 'project:beta' ]
  Tests  2 failed | 16 passed (18)   (the same as the report)
case 6: substring filter on the label added to languageMatches
  FAIL matches a language by the letters of its name in their order: expected [] to include 'TypeScript'
  Tests  1 failed | 18 passed (19)
```
- Case 6 gives 1 red here against the report's 2 because my substring revert keeps fuzzysort's order, so the `script` ordering assertion stays green. The case is red either way.

### Spec

- **The key sheet no longer takes the focus (brief item 6).** In `src/lib/ui/frame/Modal.svelte:81-89`, `opened` now always calls `event.preventDefault()`. For a box with no `onopen` it then calls `focusFirstQuietly(box)`, and when the box holds no focusable control that function does nothing (`tooltip-target.ts:55-62`).
  - `KeySheet.svelte:21-44` passes no `onopen` and holds only `h2`, `span` and `kbd`, so nothing is focused and the keyboard stays on the control behind the sheet.
  - Before this round the default was not prevented. bits-ui's `FocusScope.#handleOpenAutoFocus` (`bits-ui/dist/bits/utilities/focus-scope/focus-scope.svelte.js:57-72`) then focused the first tabbable element, or the content itself (`this.#container.focus()`) when there was none.
  - bits-ui's trap only reacts to `focusin`, so nothing pulls the focus in. By reading, Enter or Space would press a button left focused behind the sheet. Not verified in a browser.
  - The fallback that was missing: focus the box itself, quietly, when it holds no control.
- **`focusFirstQuietly` picks more than tabbable controls** (`tooltip-target.ts:16`, `:55-62`).
  - It takes the first match in document order of `a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])` and skips only `:disabled`. A `button` or `input` with `tabindex="-1"`, an `input type="hidden"`, or a control under `[hidden]` is picked, and a positive tabindex is not honoured. Its doc comment says "in the order the browser reaches them".
  - Today's only boxes without `onopen` are the tray, whose first match is its Close `ToolButton` (the Tooltip wrapper strips `tabindex`, `Tooltip.svelte:107`), and the sheet. So nothing visible changes today beyond the sheet finding above.
- Every other round item matches the round brief:
  - `.hit` is `color: var(--accent-txt, var(--accent)); font-weight: 700`, the same declarations as `Results.svelte:160-163` `.match`. The palette draws a `<mark>` with `background: none` where Search draws a `<strong>`.
  - `match` and `languageChoices` are removed and have no reader left.
  - Case 8 asserts `data-dropdown-menu-sub-trigger`.
  - Case 3 uses spread title letters.
  - The five audits are marked.
  - The three comment and title fixes are made.
  - DESIGN.md:306 names the dialog's quiet focus.
  - The widenings, dependencies, first-run labels, the 15 and 14 counts, the textValue reason, the git note and the open items (`- None.`, which matches main's `orchestrator-state.md:103`) are in the report.

### Proof

- `Q81-report.md:19-21`: the reruns "against the base sources" of cases 1, 2 and 3 are red only with `TypeError: ranked is not a function`, since the base has no `ranked`. For cases 2 and 3 that red shows nothing about the behaviour.
  - The meaningful results are the first run (2 and 3 green on the base) and, for case 3, the `titled` revert, which I reproduced.
  - Case 2 is in effect an audit, and its comment ("Red when the empty query lists every item...") is not marked as one. No decision rests on this beyond how the case is labelled.
- `Q81-report.md:50` marks change 1 DONE. The sheet half does not hold (Spec above), and the report's own checks could not show it, since the round brief left the quiet focus to the look.
- Report `:63` says "Full verify list NOT RUN". My run shows the round made `npm test` red, which bears on whether the step can land as it is.

### Standards

- **`tests/checks/imports/order.test.ts` "holds the ui folders" fails.** The cause is `src/lib/ui/frame/Modal.svelte:23`, `import { focusFirstQuietly, focusQuietly } from '$lib/ui/menu/tooltip-target';`: `ui/menu` is above `ui/frame` in `tests/checks/imports/order.ts:74`'s order. The regenerated `docs/diagrams/layer-ui.dot` shows the same upward import.
- **Sentences the round made false about the sheet:**
  - `DESIGN.md:216` says of the modal boxes, the key sheet among them, "the focus moves into the box".
  - `src/lib/ui/menu/KeySheet.svelte:4-5`: "The focus moves into the sheet while it shows".
  - `Modal.svelte:7`: "the focus moves into the box". None of these holds for the sheet now.
  - `Modal.svelte:14` ("or to the first control the box holds") does not say what happens when there is none.
- **Sentences that claim more than Modal does:**
  - `DESIGN.md:306` says a dialog gives its focus "to its first control when it opens ... (`focusQuietly` ..., which `ui/frame/Modal.svelte` uses for both)".
  - `Modal.svelte:17-18` says "Both moves ... go through `focusQuietly`".
  - A box with `onopen` gets a plain `.focus()`: Confirm on its yes button, the second control and not the first (`Confirm.svelte:37`); Prompt's input (`Prompt.svelte:33`); the palette's input (`Palette.svelte:211`). None of these controls has a tooltip, so nothing visible changes.
- **`tests/state/workbench/palette.test.ts:150`**: `describe('match', ...)` still names the removed function.
- **Audit comments against the no-history rule.** Several of the new audit comments describe earlier code or the step itself, which `agents/spec.md` ("What every package obeys", no history in comments: "what the code did before") forbids:
  - `tests/ui/primitives.test.ts:640-642`: "the hand-built confirm drew the same, so this stays green with the step undone";
  - `tests/ui/controls/prompt.test.ts:34`: "drawn as before";
  - `tests/shell/keys/workbench-keys.test.ts:329-330`: "stays green with the step undone";
  - `tests/ui/menu/menu.test.ts` and `tests/ui/menu/tooltip.test.ts`: "green with the step undone".

  Round brief item 7 asked for this wording. This is a clash between that item and the rules file, and the orchestrator needs to rule on it.
- No non-ASCII (both gates above). No file over the limit: `Modal.svelte` 170 lines, `tooltip-target.ts` 62 (`cat -n`). No file was added to a folder.

### Behaviour

- **The key sheet's first focus.**
  - At `67d7fef0`: bits-ui focused the sheet's box.
  - After this round: nothing is focused and the keyboard stays on the control behind it.
  - The report does not state this. Its change-1 row and its visible-changes list speak only of the tray and of focus given back. This is from reading the code, not from a browser.
- **The first focus now runs synchronously.** For the tray, the first focus runs synchronously when bits-ui's focus scope mounts. Before, bits-ui's default ran it in a `requestAnimationFrame`. The report does not state this. I found no visible effect by reading.
- Everything else the round changes that a reader can see is stated with a before and an after: the tray's Close focus, the quiet focus given back, and `.hit` going from weight 600 to 700.

### Not checked

- Every browser behaviour: the quiet focus on the tray's Close button and on the control a dialog returns to, what Enter, Space and Tab do while the key sheet shows, and whether the tray's content is fully mounted when `focusFirstQuietly` runs synchronously.
- The report's per-file line counts table and its totals (1810 added, 1297 removed), apart from `Modal.svelte` and `tooltip-target.ts`.
- Case 7's revert, whose test changed only its title in this round.
- Whether `npm ci --omit=dev` behaves differently with the lock's flag changes. The 27 entries that lose `dev` all keep `optional: true`; no install was run.

### Usage

About 190k tokens, 40 tool uses; time not measured.

## Closed

Every finding of the first review was sent in repair round 1 and closed there, or ruled in the round brief (`agents/briefs/Q81-round1-sent.md`, "Rulings on what the review raised"). The findings of the run over round 1 were closed at landing on main, 2026-09-29:

- The upward import (`Modal.svelte:23` into `ui/menu`): fixed at landing. `focusQuietly`, `focusFirstQuietly`, `QUIET_FOCUS` and the focusable selector moved to the new `src/lib/ui/frame/quiet-focus.ts`, below `ui/menu` in the order, since the ui root already holds the ten items a folder may hold. `tooltip-target.ts` keeps `describedControl` and `describedBy` and reads the selector from there; `menu-items.ts`, `Modal.svelte`, `Tooltip.svelte` and `shell/status/Bell.svelte` import from there. `npx vitest run tests/checks/imports/order.test.ts` failed on main with the review's line before the move and passes after it.
- The key sheet taking no focus: fixed at landing. `focusFirstQuietly` focuses the box itself when it holds no control Tab reaches, as bits-ui's own fallback does (`focus-scope.svelte.js:124`); the content carries bits-ui's `tabindex="-1"` (`focus-scope.svelte.js:211`). Browser-only, left to the owed look.
- `focusFirstQuietly` picking controls Tab does not reach: fixed at landing. It takes the first element in document order with `tabIndex >= 0`, not `:disabled`, not `input[type="hidden"]`, and under no `[hidden]` or `[inert]`. Browser-only, left to the owed look.
- The sentences on the first focus: `DESIGN.md:216`, `KeySheet.svelte:4-5` and `Modal.svelte:7` hold again with the fallback. `Modal.svelte`'s head comment and its `onopen` doc now say what a box with no control gets, and that only the first focus of a box that names none and the focus given back go through `focusQuietly`. `DESIGN.md:306` says the same and names `ui/frame/quiet-focus.ts`. `Tooltip.svelte`'s head comment and `focused` doc name the dialog's focus beside the menu's.
- `describe('match', ...)` in `tests/state/workbench/palette.test.ts`: renamed `describe('ranked', ...)` at landing.
- The audit comments carrying history: the round brief's item 7 asked for wording that describes the step, which the rules file forbids; the rules file governs. Reworded at landing in present tense, each naming what turns it red, in `tests/ui/primitives.test.ts`, `tests/ui/controls/prompt.test.ts`, `tests/shell/keys/workbench-keys.test.ts`, `tests/ui/menu/menu.test.ts` and `tests/ui/menu/tooltip.test.ts`.
- Case 2 of the palette not marked as an audit: marked at landing.
- The key sheet's first focus and the tray's synchronous first focus, not stated in the report: stated with before and after in the booking and the landing report.
- Found at landing by the verify list: the allow list of `tests/checks/tree/duplication.test.ts` held the clone between `ui/menu/Menu.svelte` and `ui/menu/MenuOpener.svelte` that this step removes; the entry was taken out, as the case "holds the lists to clones that are still shared" requires.
