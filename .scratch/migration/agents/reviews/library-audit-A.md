# Library audit, auditor A: ui/, shell/, themes/, routes/ and the entry files

Nothing in my part is left unaudited. All 125 files are in the coverage table at the end. No file was edited and no git command was run.

## Enumeration

I ran this command on main and in the X3b worktree:

`find src/lib/ui src/lib/shell src/lib/themes src/routes src/app.html src/app.d.ts src/hooks.server.ts src/server.ts src/lib/highlight-languages.d.ts -type f | sort`

- **Main:** 123 files.
- **X3b worktree:** 121 files. `diff` shows two differences:
  - X3b adds `src/lib/ui/forms/Prompt.svelte` and `src/lib/ui/forms/prompt.ts`.
  - X3b lacks `ui/controls/RowButton.svelte`, `routes/api/(accounts)/connect/+server.ts`, `routes/api/(sessions)/agents/+server.ts` and `routes/api/(sessions)/customizations/+server.ts`. X3b branches from `fcb314bd`, which is older than these files, so I audited them from main.
- **Audited set:** 125 files, 14,600 lines (`wc -l`). The ten X3b-named files and the two X3b additions were read from the worktree.

## Installed versions

From `node_modules/*/package.json`: svelte 5.57.0, @sveltejs/kit 2.70.3, adapter-node 5.5.7, vite 8.3.0, ws 8.21.3, typescript 6.0.3.

## Candidate facts

Taken from `npm view <pkg> --json`. The date is the release date of the latest version. "Peers" means peer dependencies.

| package | version | license | released | peers |
|---|---|---|---|---|
| bits-ui | 2.19.3 | MIT | 2026-09-22 | svelte ^5.33.0, @internationalized/date ^3.8.1 |
| melt | 0.44.0 | MIT | 2026-01-04 | svelte ^5.30.1, @floating-ui/dom ^1.6.0 |
| @ark-ui/svelte | 5.24.2 | MIT | 2026-09-13 | svelte >=5.20.0 |
| @floating-ui/dom | 1.8.0 | MIT | 2026-07-11 | none |
| paneforge | 1.0.2 | MIT | 2025-08-02 | svelte ^5.29.0 |
| dockview-core | 8.3.1 | MIT | 2026-09-10 | none |
| svelte-splitpanes | 8.0.12 | MIT | 2025-11-25 | svelte ^5.43.0 |
| golden-layout | 2.6.0 | MIT | 2022-09-26 | none |
| @vscode-elements/elements | 2.5.1 | MIT | 2026-02-21 | @vscode/codicons >=0.0.40 |
| fuzzysort | 4.0.2 | MIT | 2026-08-13 | none |
| fuse.js | 7.5.0 | Apache-2.0 | 2026-07-13 | none |
| @leeoniya/ufuzzy | 1.0.19 | MIT | 2025-08-22 | none |
| match-sorter | 8.3.0 | MIT | 2026-04-15 | none |
| tinykeys | 4.0.1 | MIT | 2026-09-25 | none |
| hotkeys-js | 4.0.8 | MIT | 2026-09-09 | none |
| mousetrap | 1.6.5 | Apache-2.0 WITH LLVM-exception | 2020-01-23 | none |
| @tanstack/virtual-core | 3.17.11 | MIT | 2026-09-14 | none |
| @tanstack/svelte-virtual | 3.13.39 | MIT | 2026-09-14 | svelte 3, 4 or 5 |
| virtua | 0.52.7 | MIT | 2026-09-22 | svelte >=5.0 (among others) |
| svelte-sonner | 1.2.1 | MIT | 2026-08-14 | svelte ^5.0.0 |
| culori | 4.0.2 | MIT | 2025-06-27 | none |
| colorjs.io | 0.7.1 | MIT | 2026-07-24 | none |
| chroma-js | 3.2.0 | BSD-3-Clause AND Apache-2.0 | 2025-11-28 | none |
| wcag-contrast | 3.0.0 | BSD-2-Clause | 2019-11-05 | none |
| @atlaskit/pragmatic-drag-and-drop | 4.0.0 | Apache-2.0 | 2026-09-24 | none |
| svelte-dnd-action | 0.9.79 | MIT | 2026-08-21 | svelte >=3.23 or ^5 |
| focus-trap | 8.2.2 | MIT | 2026-06-22 | none |
| postcss | 8.5.28 | MIT | 2026-09-03 | none |
| zod | 4.6.5 | MIT | 2026-09-13 | none |
| valibot | 1.5.0 | MIT | 2026-09-09 | typescript >=5 (oculus has 6.0.3) |
| @tanstack/table-core | 9.2.4 | MIT | 2026-08-28 | none |

- **Maintainers, from `npm view`:**
  - bits-ui and paneforge: huntabyte.
  - melt: tglide.
  - @ark-ui/svelte: segunadebayo (Chakra).
  - @floating-ui/dom: fezvrasta and atomiks.
  - dockview-core: mathuo.
  - @vscode-elements/elements: bendera.
  - Not checked for the rest.
- **Dependencies:** bits-ui depends on `@floating-ui/dom`, `@floating-ui/core`, `tabbable`, `runed`, `svelte-toolbelt` and `esm-env`. @vscode-elements/elements depends on `lit` and `@lit/context`.
- **Svelte 5 fit:** every Svelte package above declares a peer range that includes svelte 5.57.0.

---

## 1. Menus, context menus, tooltips, the floating layer and modal dialogs

### What oculus has
- **Menus (1,387 lines with the floating files):**
  - `ui/menu/Menu.svelte` (199), `MenuList.svelte` (394), `MenuOpener.svelte` (214), `ContextMenu.svelte` (103), `menu-items.ts` (49).
  - Tooltips: `Tooltip.svelte` (327), `tooltip-target.ts` (48), `tip-ids.ts` (37).
  - `ui/frame/on-body.ts` (16).
- **Modal dialogs (525 lines):**
  - `ui/controls/Confirm.svelte` (176) and `CloseQuestion.svelte` (28).
  - X3b `ui/forms/Prompt.svelte` (173) and `prompt.ts` (14).
  - `ui/menu/KeySheet.svelte` (121) and `key-rows.ts` (13).
  - Two shell overlays also declare themselves modal: `shell/rail/UpdateTray.svelte` and `shell/keys/Palette.svelte`.

What the code does:
- **Positioning:** the menus and tooltips place themselves by hand, from `getBoundingClientRect` and `innerWidth`/`innerHeight`:
  - `MenuList.svelte:126-133`
  - `Tooltip.svelte:97-137`
  - `Menu.svelte:138`
  - `ContextMenu.svelte:59`
- **Clipping:** they move themselves onto the body (`on-body.ts`) to escape containers that blur or clip.
- **Outside press:** they close through document `pointerdown` listeners.
- **Tooltip timing:** a 150 ms delay, shown on `:focus-visible` only.
- **Menu keys:** ArrowUp and ArrowDown only (`MenuList.svelte:180`).
- **Nested lists:** a choice with its own list replaces the list in place, with a Back entry (`menu-items.ts` `menuLevel`).
- **Focus traps:** the dialogs trap Tab by hand. The same loop is written twice, in `Confirm.svelte:55-72` and in X3b `Prompt.svelte:40-55`.

### Defects found while reading
- **Menu keyboard is incomplete.** There is no Home or End key, no type-ahead, and no Right or Left for a nested list. VS Code's menus open nested lists to the side (cascading); oculus replaces the list in place with Back. This is a VS Code parity gap.
- **Three overlays claim to be modal and are not.**
  - `KeySheet.svelte:20` and `UpdateTray.svelte:124` set `aria-modal="true"`, but neither moves focus nor traps Tab. `grep -n "focus\|keydown\|inert"` on both files returns nothing.
  - `Palette.svelte` focuses its input but has no Tab trap.
  - No surface uses `inert` (`grep -rn inert ui shell` is empty).
- **The palette's selection is not announced.** The listbox has no `aria-activedescendant` (grep is empty), so a screen reader is not told which row is selected.

### Candidates

**bits-ui** (headless, Svelte 5 runes)
- Components:
  - The components list names Dropdown Menu, Context Menu, Tooltip, Dialog, Alert Dialog, Popover, Command, Combobox, Select and Tabs, among others.
  - The Dropdown Menu page confirms: `Sub`, `SubTrigger` and `SubContent` for cascading submenus; `textValue` for type-ahead; `CheckboxItem` and `RadioItem`; `Group` with `GroupHeading`; `Portal`; and `side`, `align`, `avoidCollisions`, `collisionBoundary` and `collisionPadding` through floating-ui.
- Gaps:
  - The page does not state Home and End keys.
  - It does not state how a dialog behaves inside a hidden tab. That case matters here, because `Confirm.svelte` takes the keyboard back through `onShown` when its tab reappears.
- Theming: unstyled ("Most components ship completely unstyled"), so the existing rules and tokens move onto its parts unchanged. The contrast test keeps seeing the same token pairs.
- Layers: a package imported from `ui/` breaks no boundary row.
- Estimate: it would remove about 900 lines. That covers the positioning, the outside-press listeners, the Tab traps, the menu keys, `on-body.ts`, and most of `Tooltip.svelte` and `MenuList.svelte`.
- What stays: `MenuOpener`'s looks, the `menu-items` contract, the badge and tone drawing, the tooltip ids, and each component's CSS.

**melt** (the next-generation melt-ui)
- Builder-style and Svelte 5, with floating-ui as a peer.
- Still pre-1.0 (0.44.0), last released 2026-01-04.
- Features not checked in this run.

**@ark-ui/svelte**
- Built on the zag state machines, with 69 dependencies.
- Features not checked in this run.

**The platform alone**
- `<dialog>.showModal()`: MDN reads "top layer", "makes rest of page inert", Escape closes, focus goes to the first focusable element; widely available since March 2022.
- The popover attribute plus CSS anchor positioning. A web search reports anchor positioning in Chrome 125+, Firefox 147+ and Safari 18.2+ (from secondary sources, MDN linked).
- With this route, the top layer removes `on-body.ts` and the z-index work, and `inert` removes the hand-written Tab traps.
- The menu keyboard stays hand-built.
- Risk, not checked: a modal `<dialog>` left open in a hidden tab would leave the whole page inert.

**@floating-ui/dom alone**
- Replaces only the positioning arithmetic, about 120 lines (estimate).

### Options
1. **Keep.**
   - Pro: no dependency.
   - Con: the three false-modal overlays, the missing menu keys and the in-place submenus all remain, each to fix by hand, and the trap loop stays duplicated.
2. **bits-ui** for Menu, ContextMenu, Tooltip, Dialog and AlertDialog.
   - Pro: covers the missing keyboard behaviour, cascading submenus as VS Code draws them, collision handling and focus management.
   - Con: a new dependency tree of 6 packages. The hidden-tab confirm has to be proven in the browser suite.
3. **Platform only.**
   - Pro: zero dependencies; fixes the modal defects and the body workaround.
   - Con: the menu keyboard and submenus stay hand-built.

**Recommendation: option 2, bits-ui.** It is the only option that removes the hand-written code and also closes the parity gaps. Its facts check out: Svelte 5 peer, MIT, released four days ago. It does not touch the theme tokens because it ships no styles.

---

## 2. Command palette and matching

### What oculus has
- `shell/keys/Palette.svelte` (387), `palette-open.ts` (22), and the matcher in `state/workbench/palette.ts:127-140`. That state file is outside my part.
- Matching: `match()` does an AND of lowercased substrings, ranked by the number of title hits.
- The list: arrow-key selection, Enter, a `:` command mode, `:line` and `:language`.
- Missing: fuzzy scoring, match highlighting and `aria-activedescendant`.
- VS Code parity: VS Code's quick open matches fuzzily with highlights, and uses `>` for commands and `:` for go-to-line. Oculus uses `:` for both.

### Candidates
- **fuzzysort:** has a `highlight()` API and multi-key search (`keys: [...]`, README lines 81-108).
- **fuse.js, @leeoniya/ufuzzy, match-sorter:** facts in the table above. Highlight features were not checked.
- **bits-ui Command:**
  - Provides a default scorer, a `filter` prop returning a 0 to 1 score, exported `computeCommandScore`, `shouldFilter={false}` to supply your own results, and groups.
  - Its docs page states no highlighting and does not say whether it uses `aria-activedescendant`.

### Options
1. **Keep.** No dependency, but no fuzzy matching or highlights.
2. **fuzzysort for `match()`.** Replaces about 15 lines (estimate) and adds highlights, which then need a small renderer.
3. **fuzzysort plus bits-ui Command** (with `shouldFilter={false}`) for the list. Would remove about 150 lines of Palette's selection and keyboard code (estimate).

**Recommendation: option 3 if section 1 is adopted, otherwise option 2.** Matching is the part VS Code users feel, and fuzzysort covers it with a highlight API.

---

## 3. Tab and pane layout: split panes, sashes, tab strip and tab drag

### What oculus has (2,482 lines in my part)
- Panes: `shell/panes/*` except `workbench-title.ts` (1,184 lines), plus `ui/frame/Sash.svelte` (192) and `sash-size.ts` (19).
- Tab strip: `ui/tabs/Tabs.svelte` (360), `TabFace.svelte` (307), `tab-scroll.svelte.ts` (161), `tab-strip.ts` (135).
- Outside my part, the same capability includes `state/workbench/layout/*` and `layout.svelte.ts` (2,644 lines) and `drag.svelte.ts` (340).

What it does:
- The layout is a tree held as data (`Layout`): splits with fractional sizes and folded children, panes, and page leaves.
- The sash follows the WAI-ARIA window splitter pattern: role `separator`, `aria-valuenow`, arrow-key resizing, and double-click to reset.
- A folded child becomes a 28 px strip.
- Tabs support preview, dirty and badge marks, plus roving focus, overflow scrolling with jump controls, and dragging within a strip, to another pane, or onto a pane's edge to split it.
- A page leaf shows another page at a spot, with loop and duplicate refusal.

### Candidates

**dockview-core** (vanilla, zero dependencies)
- Description: "layout manager supporting tabs, groups, grids and splitviews"; README: floating groups, popout windows, serialization.
- The bundle exports `toJSON`, `fromJSON`, `addFloatingGroup` and `addPopoutGroup`. It ships a `dockview-theme-vs` theme and 17 others.
- Svelte: no binding. The repository lists React, Vue and Angular packages only.
- Keyboard and accessibility:
  - The bundle has 3 `keydown` listeners, on the tab list, an input and a window.
  - `grep` finds no `role="separator"`, so its sashes have no keyboard or ARIA support.
  - That would be a regression from `Sash.svelte`.
- Would own the tab and group DOM, so `TabFace`'s token-drawn tabs would become a mapping onto its `--dv-*` variables.
- Unknown whether it can express page leaves and folded strips (not checked).
- Views would be mounted into its panels with Svelte `mount()`.

**paneforge** (Svelte 5)
- Covers resizable, nested, persisted and collapsible panes only. No tabs and no drag between panes.
- The pages read did not confirm keyboard resizing, controlled sizes held in an outside store, or a fixed-pixel collapsed size.

**svelte-splitpanes and golden-layout**
- svelte-splitpanes: split panes only.
- golden-layout: last released 2022-09-26, so not current.

### Options
1. **Keep.**
   - Pro: page leaves, fold strips, the accessible sash, the data-first layout and the registry-based mounting all stay.
   - Con: about 2,500 lines to maintain in my part, plus the state files.
2. **dockview-core.**
   - Would remove perhaps 1,500 lines of shell, tabs and drag code, plus part of the state layout (estimate).
   - Loses the keyboard on sashes and the page leaves. Needs a Svelte glue layer and a theme mapping.
3. **paneforge for SplitView and Sash only.**
   - Would remove about 250 lines (estimate).
   - Fit with fractional sizes held in the store and fixed-pixel folds is unproven.

**Recommendation: keep.** dockview lacks a Svelte binding, sash accessibility and page leaves. paneforge covers only resizing, and its fit with a store-held layout is unverified. If a spike is wanted, paneforge on `SplitView` is the only small one.

---

## 4. Tree primitive (`ui/tree/`)

### What oculus has (808 lines)
- `TreeItem.svelte` (455), `TreeView.svelte` (81), `TreeSection.svelte` (86), `tree-keys.ts` (72), `Disclosure.svelte` (64), `roving.ts` (50).

What it does:
- One tab stop for the whole tree, with Up, Down, Home, End, Right and Left, and Enter pressing the row's button.
- Indent guides, rows marked selected or current, hover actions with a managed tabindex, heading rows, and a `fixed` state for rows held open by a filter.

VS Code parity gaps, from reading `tree-keys.ts`:
- No type-ahead or find.
- No multi-select with Shift or Ctrl.
- No `*` to expand all siblings.
- No virtualization (see section 5).

### Candidates
- **@vscode-elements/elements `vscode-tree`:**
  - Lit web components; the docs page confirms `multiSelect` and `indentGuides`.
  - Built declaratively from child elements.
  - Styled inside shadow DOM from `--vscode-*` variables (`--vscode-list-hoverBackground`, `--vscode-tree-indentGuidesStroke` and others, found by `curl` of `dist/vscode-tree/vscode-tree.js`). It would need a token-to-`--vscode-*` mapping, and the contrast test cannot see pairs drawn inside shadow DOM.
- **@ark-ui/svelte** tree view: not checked.
- **bits-ui:** its component list has no tree.

### Options
1. **Keep, and add the missing parity features by hand.**
2. **vscode-tree:**
   - Would remove about 500 lines (estimate).
   - Loses the hover-action tabindex management, `fixed` rows and the token contrast coverage. Needs Svelte-to-custom-element glue.

**Recommendation: keep.** The only VS Code-shaped candidate themes through shadow DOM outside the tokens the contrast test measures, and its documented features do not include the ones oculus relies on.

---

## 5. Long lists (virtualization)

### What oculus has
- No virtualization anywhere. `grep -rln virtual` finds no virtual list.
- `views/sources/files/tree/Tree.svelte:195` draws every row with one `{#each}`, so an open folder with thousands of entries draws thousands of `TreeItem`s. VS Code's explorer virtualizes.
- This is absent, not hand-built, so the finding is a missing capability.

### Candidates
- **@tanstack/virtual-core:** zero dependencies. It can be driven from `$state`. The Svelte adapter is store-based (depends on `@tanstack/virtual-core` 3.17.11); its fit with runes was not checked.
- **virtua:** has a `./svelte` export and declares svelte >=5 as a peer.

### Options
1. Keep drawing every row.
2. @tanstack/virtual-core inside `TreeView`.
3. virtua's Svelte component.

**Recommendation: option 2.** It is the most established, has zero dependencies, and works with fixed-height rows. It adds a capability rather than removing code.

---

## 6. Keyboard shortcuts and chords

### What oculus has (699 lines)
- `shell/keys/keys.ts` (182): a pure resolver covering Ctrl plus digit, Ctrl plus bracket, `?`, letter chords followed by a digit (1500 ms), vim-style cursor keys, `/`, `n`, `gg` (500 ms) and `G`.
- `workbench-keys.svelte.ts` (447): guards for typing, open overlays and drags, and binding to the DOM.
- `key-dom.ts` (70).

### Candidates
- **tinykeys:** key sequences with a 1000 ms timeout, configurable through `options.timeout` (README lines 197-334), and `$mod`.
- **hotkeys-js:** facts in the table. **mousetrap:** last released 2020, so stale.

What a library would cover: parsing key strings and timing sequences, about 50 lines of `keys.ts` (estimate).

What stays: the precedence rules against typing and overlays, a chord's digit indexing into a configured list, the cursor geometry, and all of `workbench-keys`.

**Recommendation: keep.** The library would remove about 50 lines and add registration glue of similar size.

---

## 7. Colour math (`themes/derive.ts`)

### What oculus has
- `derive.ts` (262 lines) includes about 75 non-comment lines of colour arithmetic: hex parsing, WCAG luminance and ratio, RGB to HLS and back, mix, and hex formatting. These sit under `readable()` and `deriveTokens()`.
- Outside my part, `tests/checks/look/lane-distance.test.ts:64` hand-writes CIEDE2000.

### Candidates
- **culori:**
  - Its `src/index.js` exports `wcagContrast`, `wcagLuminance`, `interpolate`, `converter`, `formatHex` and `differenceCiede2000`.
  - Zero dependencies, MIT.
- **colorjs.io:** 0.7.1, typed. Its API was not checked in this run.
- **chroma-js:** dual license, BSD-3-Clause AND Apache-2.0.
- **wcag-contrast:** last released 2019.

### Options
1. **Keep.**
2. **culori.**
   - Would remove about 70 lines of `derive.ts` and about 40 test lines of CIEDE2000 (estimates).
   - `readable()`'s nudge loop and `deriveTokens()` stay.
   - Rounding may differ from the hand-written HLS by one step on a derived hex. The contrast test would catch any failure that results, since that test is unchanged.

**Recommendation: culori.** It covers every formula `derive.ts` writes, plus the one in the test, with zero dependencies. The theme tokens are untouched.

---

## 8. Parsing the theme CSS (`themes/parse.ts`) and applying the theme (`ui/theme.ts`)

- `parse.ts` (87 lines) reads `:root` and `body.x` blocks with regular expressions.
- `postcss` 8.5.28 is already installed, pulled in by eslint-plugin-svelte (`npm ls postcss`), but it is not a direct dependency.
- `parse.ts` also runs in the browser through `ui/theme.ts`. postcss's browser build was not checked.
- Estimate: about 35 lines removed.

**Recommendation: keep.** The saving is small and the browser use is unverified.

---

## 9. Forms and inputs

- Files: `ui/forms/*` and `Search`/`Segment` (727 lines).
- Most controls wrap native elements (`Select`, `DateInput`, `Checkbox`, `TextInput`, `TextArea`).
- `MultiSelect.svelte` (196) is a hand-built filtering chip combobox with `free` entries.
- Candidate: bits-ui Combobox, which is in its component list. Support for multiple selection and free entries was not checked.

**Recommendation: keep.** Revisit MultiSelect only if bits-ui is adopted under section 1.

---

## 10. Notifications and toasts

- Files: `Bell` (106), `NoticeCentre` (165), `NoticeEntry` (93), `Toast` (59).
- Drawn as VS Code's: an 8 s toast, a notification centre, Do Not Disturb, Clear All.
- Candidate: svelte-sonner, which covers the toasts only. Its centre and Do Not Disturb support were not checked, and it is not drawn in VS Code's shape.

**Recommendation: keep.**

---

## 11. Drag and drop

- Tab and view drags are pointer-driven: `drag.svelte.ts` (340 lines, outside my part), `DropLayer.svelte` (113) and the insertion index in `Tabs`.
- File rows use native HTML5 dragging (`Tree.svelte` head comment), so the tree runs two drag mechanisms.
- Candidates:
  - @atlaskit/pragmatic-drag-and-drop: native drag and drop, Apache-2.0. Its edge-detection helpers were not checked.
  - svelte-dnd-action: covers list reordering only.

**Recommendation: keep**, following section 3. A library here only pays off together with a layout library.

---

## 12. Sortable table

- `Table.svelte` (172) and `table-rows.ts` (50): one sort key.
- @tanstack/table-core 9.2.4 covers this and much more.

**Recommendation: keep.** Adapter glue would be about as large as the code.

---

## 13. HTTP routing, request validation, and auth and origin checks

- The 26 route files (523 lines) are thin wiring. Validation and auth live in `lib/server`, which another auditor covers. For that work: zod 4.6.5 and valibot 1.5.0 fit TypeScript 6.
- **Built-in CSRF check is too narrow for the JSON API.** SvelteKit's own check covers form content types only (`node_modules/@sveltejs/kit/src/runtime/server/respond.js:83`, `utils/http.js:93`). So:
  - The origin check is repeated per handler; 22 server files call `sameOrigin(`.
  - `api/(files)/file/[root]/[...path]/+server.ts` does it inline.
  - A single guard for `/api/` in `hooks.server.ts`'s `handle` is SvelteKit's own mechanism for this.
- **Config is read three ways.**
  - `locals.config()`: the per-request cache that `hooks.server.ts` documents.
  - `locals.server.config`: the process-held copy.
  - Fresh `loadConfig(locals.server.engine)`: in `open/+server.ts`, `hook/+server.ts` and `terminal/+server.ts`.
  - The third contradicts the head comment of `hooks.server.ts`. This is not a library matter.

---

## 14. WebSocket wiring (`src/server.ts`)

- Node `http` plus `ws`, through `attachSocket`.
- @sveltejs/kit 2.70.3 declares no WebSocket hook: `grep socket` in `types/index.d.ts` finds nothing.

**Recommendation: keep.** `ws` is already a dependency and is used for this.

---

## Libraries already in package.json

- `ui/html.ts` uses marked and DOMPurify as intended: allow-list profiles and two hooks for the rules DOMPurify cannot express.
- `Glyph.svelte` draws the lucide-static icons through `sanitiseSvg`.
- highlight.js appears in my part only as the type declaration in `highlight-languages.d.ts`.
- No duplication of an existing dependency found in my part.

## Domain logic, no library

- `themes/tokens.css`, `themes.css`: the portfolio's palette and theme blocks (data).
- `ui/controls/Chip`, `Tag`, `ToolButton`, `RowButton`, `ui/display/Meter`, `ui/frame/Card`, `Empty`, `Pane`, `Toolbar`: oculus's own primitives over native elements and tokens.
- `ui/display/Ticker.svelte`, `ticker-rows.ts`: dated-line list with touch reveal rules for the Focus board.
- `ui/tabs/Breadcrumb.svelte`: path segments as controls.
- `ui/shown.ts`: tells a hidden tab's view it is shown again.
- `shell/rail/*`: VS Code activity bar with oculus pages, bookmarks, badges and the update-task tray.
- `shell/status/StatusBar`, `RepoItems`, `SourceItems`, `status-items.ts`: VS Code status bar items for oculus state.
- `shell/Workbench.svelte`: composition root of the shell.
- `shell/panes/workbench-title.ts`: document title.
- `routes/+page*`, `+layout*`, `views.ts`: page entry and view registry.
- `app.html`, `app.d.ts`, `highlight-languages.d.ts`, `hooks.server.ts`: SvelteKit shell, types and request hook.

## Coverage table

| file | lines | capability |
|---|---|---|
| src/app.d.ts | 32 | Type declarations |
| src/app.html | 13 | HTML shell |
| src/hooks.server.ts | 41 | Request hook (config, title) |
| src/lib/highlight-languages.d.ts | 9 | Type declarations |
| src/lib/shell/keys/key-dom.ts | 70 | Keyboard shortcuts and chords |
| src/lib/shell/keys/keys.ts | 182 | Keyboard shortcuts and chords |
| src/lib/shell/keys/palette-open.ts | 22 | Command palette and matching |
| src/lib/shell/keys/Palette.svelte | 387 | Command palette and matching |
| src/lib/shell/keys/workbench-keys.svelte.ts | 447 | Keyboard shortcuts and chords |
| src/lib/shell/panes/DropLayer.svelte | 113 | Tab and pane layout (drag) |
| src/lib/shell/panes/FoldedPane.svelte | 118 | Tab and pane layout |
| src/lib/shell/panes/PageLeaf.svelte | 160 | Tab and pane layout |
| src/lib/shell/panes/pane-view.ts | 95 | Tab and pane layout |
| src/lib/shell/panes/PaneView.svelte | 439 | Tab and pane layout |
| src/lib/shell/panes/SplitView.svelte | 207 | Tab and pane layout |
| src/lib/shell/panes/TabView.svelte | 52 | Tab and pane layout |
| src/lib/shell/panes/workbench-title.ts | 28 | Document title (domain) |
| src/lib/shell/rail/ActivityRail.svelte | 302 | Activity rail (domain) |
| src/lib/shell/rail/rail.ts | 140 | Activity rail (domain) |
| src/lib/shell/rail/RailFoot.svelte | 106 | Activity rail (domain) |
| src/lib/shell/rail/RailList.svelte | 123 | Activity rail (domain) |
| src/lib/shell/rail/RailPages.svelte | 296 | Activity rail (domain) |
| src/lib/shell/rail/UpdateTray.svelte | 263 | Activity rail (domain); modal dialog |
| src/lib/shell/status/Bell.svelte | 106 | Notifications and toasts |
| src/lib/shell/status/NoticeCentre.svelte | 165 | Notifications and toasts |
| src/lib/shell/status/NoticeEntry.svelte | 93 | Notifications and toasts |
| src/lib/shell/status/RepoItems.svelte (X3b) | 172 | Status bar (domain) |
| src/lib/shell/status/SourceItems.svelte (X3b) | 193 | Status bar (domain) |
| src/lib/shell/status/status-items.ts (X3b) | 83 | Status bar (domain) |
| src/lib/shell/status/StatusBar.svelte | 226 | Status bar (domain) |
| src/lib/shell/status/Toast.svelte | 59 | Notifications and toasts |
| src/lib/shell/Workbench.svelte | 382 | Workbench composition (domain) |
| src/lib/themes/derive.ts | 262 | Colour math |
| src/lib/themes/parse.ts | 87 | Theme CSS parsing |
| src/lib/themes/themes.css (X3b) | 798 | Theme tokens (domain data) |
| src/lib/themes/tokens.css (X3b) | 164 | Theme tokens (domain data) |
| src/lib/ui/controls/Chip.svelte | 156 | Primitives (domain) |
| src/lib/ui/controls/CloseQuestion.svelte | 28 | Modal dialogs |
| src/lib/ui/controls/Confirm.svelte | 176 | Modal dialogs |
| src/lib/ui/controls/RowButton.svelte | 52 | Primitives (domain) |
| src/lib/ui/controls/Search.svelte | 79 | Forms and inputs |
| src/lib/ui/controls/segment-items.ts | 5 | Forms and inputs |
| src/lib/ui/controls/Segment.svelte | 40 | Forms and inputs |
| src/lib/ui/controls/Tag.svelte | 83 | Primitives (domain) |
| src/lib/ui/controls/ToolButton.svelte (X3b) | 386 | Primitives (domain) |
| src/lib/ui/display/Glyph.svelte | 74 | Icons over lucide-static |
| src/lib/ui/display/Meter.svelte | 83 | Primitives (domain) |
| src/lib/ui/display/table-rows.ts | 50 | Sortable table |
| src/lib/ui/display/Table.svelte | 172 | Sortable table |
| src/lib/ui/display/ticker-rows.ts | 33 | Ticker list (domain) |
| src/lib/ui/display/Ticker.svelte | 493 | Ticker list (domain) |
| src/lib/ui/forms/Checkbox.svelte | 43 | Forms and inputs |
| src/lib/ui/forms/DateInput.svelte | 57 | Forms and inputs |
| src/lib/ui/forms/Field.svelte | 77 | Forms and inputs |
| src/lib/ui/forms/MultiSelect.svelte | 196 | Forms and inputs |
| src/lib/ui/forms/Prompt.svelte (X3b, added) | 173 | Modal dialogs |
| src/lib/ui/forms/prompt.ts (X3b, added) | 14 | Modal dialogs |
| src/lib/ui/forms/Select.svelte | 64 | Forms and inputs |
| src/lib/ui/forms/TextArea.svelte (X3b) | 91 | Forms and inputs |
| src/lib/ui/forms/TextInput.svelte | 75 | Forms and inputs |
| src/lib/ui/frame/Card.svelte | 225 | Primitives (domain) |
| src/lib/ui/frame/Empty.svelte | 45 | Primitives (domain) |
| src/lib/ui/frame/on-body.ts | 16 | Floating layer (menus, tooltips) |
| src/lib/ui/frame/Pane.svelte | 127 | Primitives (domain) |
| src/lib/ui/frame/sash-size.ts | 19 | Tab and pane layout (sash) |
| src/lib/ui/frame/Sash.svelte | 192 | Tab and pane layout (sash) |
| src/lib/ui/frame/Toolbar.svelte | 30 | Primitives (domain) |
| src/lib/ui/html.ts | 324 | Sanitised HTML over marked and DOMPurify |
| src/lib/ui/menu/ContextMenu.svelte | 103 | Menus and context menus |
| src/lib/ui/menu/key-rows.ts | 13 | Modal dialogs (key sheet) |
| src/lib/ui/menu/KeySheet.svelte | 121 | Modal dialogs (key sheet) |
| src/lib/ui/menu/menu-items.ts | 49 | Menus and context menus |
| src/lib/ui/menu/Menu.svelte | 199 | Menus and context menus |
| src/lib/ui/menu/MenuList.svelte | 394 | Menus and context menus |
| src/lib/ui/menu/MenuOpener.svelte | 214 | Menus and context menus |
| src/lib/ui/menu/tip-ids.ts | 37 | Tooltips |
| src/lib/ui/menu/tooltip-target.ts | 48 | Tooltips |
| src/lib/ui/menu/Tooltip.svelte | 327 | Tooltips |
| src/lib/ui/shown.ts | 19 | Hidden-tab visibility signal (domain) |
| src/lib/ui/tabs/Breadcrumb.svelte | 96 | Breadcrumb (domain) |
| src/lib/ui/tabs/tab-scroll.svelte.ts | 161 | Tab and pane layout (tab strip) |
| src/lib/ui/tabs/tab-strip.ts | 135 | Tab and pane layout (tab strip) |
| src/lib/ui/tabs/TabFace.svelte | 307 | Tab and pane layout (tab strip) |
| src/lib/ui/tabs/Tabs.svelte | 360 | Tab and pane layout (tab strip) |
| src/lib/ui/theme.ts | 95 | Theme application |
| src/lib/ui/tree/Disclosure.svelte | 64 | Tree primitive |
| src/lib/ui/tree/roving.ts | 50 | Roving focus (tabs, rail, tree) |
| src/lib/ui/tree/tree-keys.ts | 72 | Tree primitive |
| src/lib/ui/tree/TreeItem.svelte | 455 | Tree primitive |
| src/lib/ui/tree/TreeSection.svelte | 86 | Tree primitive |
| src/lib/ui/tree/TreeView.svelte | 81 | Tree primitive; long lists |
| src/routes/+layout.svelte | 37 | Page entry (domain) |
| src/routes/+layout.ts | 2 | Page entry (domain) |
| src/routes/+page.server.ts | 46 | Page entry (domain) |
| src/routes/+page.svelte (X3b) | 226 | Page entry (domain) |
| src/routes/+page.ts | 30 | Page entry (domain) |
| src/routes/api/(accounts)/calendar/+server.ts | 31 | HTTP routes |
| src/routes/api/(accounts)/calendar/callback/+server.ts | 24 | HTTP routes |
| src/routes/api/(accounts)/connect/+server.ts | 34 | HTTP routes |
| src/routes/api/(accounts)/mail/+server.ts | 34 | HTTP routes |
| src/routes/api/(accounts)/mail/callback/+server.ts | 24 | HTTP routes |
| src/routes/api/(docs)/diagrams/[name]/+server.ts | 9 | HTTP routes |
| src/routes/api/(docs)/docs/+server.ts | 20 | HTTP routes |
| src/routes/api/(docs)/memories/+server.ts | 15 | HTTP routes |
| src/routes/api/(docs)/wallpaper/+server.ts | 12 | HTTP routes |
| src/routes/api/(files)/file/[root]/[...path]/+server.ts | 21 | HTTP routes (inline origin check) |
| src/routes/api/(files)/fs/+server.ts | 39 | HTTP routes |
| src/routes/api/(files)/open/+server.ts | 20 | HTTP routes |
| src/routes/api/(files)/project-files/+server.ts | 8 | HTTP routes |
| src/routes/api/(files)/search/+server.ts | 21 | HTTP routes |
| src/routes/api/(files)/source/+server.ts | 17 | HTTP routes |
| src/routes/api/(git)/changes/+server.ts | 14 | HTTP routes |
| src/routes/api/(git)/deposit/+server.ts | 20 | HTTP routes |
| src/routes/api/(git)/git/+server.ts | 21 | HTTP routes |
| src/routes/api/(machine)/hpc/+server.ts | 16 | HTTP routes |
| src/routes/api/(machine)/usage/refresh/+server.ts | 10 | HTTP routes |
| src/routes/api/(sessions)/agents/+server.ts | 9 | HTTP routes |
| src/routes/api/(sessions)/customizations/+server.ts | 17 | HTTP routes |
| src/routes/api/(sessions)/hook/+server.ts | 17 | HTTP routes |
| src/routes/api/(sessions)/latex/+server.ts | 14 | HTTP routes |
| src/routes/api/(sessions)/terminal/+server.ts | 28 | HTTP routes |
| src/routes/api/(sessions)/transcript/+server.ts | 14 | HTTP routes |
| src/routes/api/write/+server.ts | 14 | HTTP routes |
| src/routes/views.ts | 65 | View registry (domain) |
| src/server.ts | 72 | Node entry: HTTP server and WebSocket wiring |

125 rows, the same as the enumeration count.
