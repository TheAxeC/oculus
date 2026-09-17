# Step Q38 refuter report (on .agents/worktrees/q38, base 91fb46cb)

Worktree status matches the diff: 13 files modified, nothing untracked, nothing edited by the reviewer. Every revert ran in a clone of the tree at `scratchpad/q38-review/oculus`, with a fresh build before each browser run, and every source file was restored afterwards (checked with `cmp`, then a final build).

## Verification (rerun by the reviewer)

All run from `tools/oculus` in the worktree:

| Command | Result |
|---|---|
| `npx vitest run --reporter=dot` | `Test Files 246 passed (246)`, `Tests 4120 passed (4120)`. No timeouts. |
| `npm run check` | `COMPLETED 1209 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | exit 0 |
| `npm run format:check` | `All matched files use Prettier code style!` |
| ASCII gate (the perl command) | printed nothing |
| `find src tests bin -type f \| xargs wc -l \| sort -n \| tail -3` | 970 `tests/state/layout.test.ts`, 980 `tests/state/board.test.ts` |
| Largest components | `Tabs.svelte` 574, `Files.svelte` 588 |
| `npm run build`, then playwright on tabs, shell-defects, pages, layout, rail, unsaved-forms, keyboard | build exit 0; `66 passed (1.3m)` |

## 1. Spec

**Item 1, the tab strip, measured in my own build.** I read `getComputedStyle` and the tab boxes in light, dark, gruvbox with the wallpaper, mocha without it, and vscode-dark-modern, at 1600 and 820 wide:
- Tab height is 35 in every theme and 56 at text scale 1.6. Tabs have no gap and a 1px `--line` border between them.
- The shown tab has a 1px `--accent` top border, the `--panel` background, and a transparent bottom border. Inactive tabs are in muted text. Label font is 13.5px (12.5px in rice themes).
- Close control opacity is 1 on the shown tab, the dirty tab and a hovered tab, and 0 on the others.

These match the brief, with these differences:
- The label is 13.5px, not VS Code's 13px. The builder cites the rule that every font size comes from the nine `--fs-*` steps, and no step is 13px. This is not a case of "oculus does something VS Code does not". It is a clash between the brief's measure and the token rule, and it was not raised as one.
- `src/lib/ui/Tabs.svelte:514-526` puts the dirty dot inside the close button. `tests/browser` (probe `aria left strip`) shows the button is still named "Close tab" and the tab is still named "Tasks & Service". The visible dirty state has no text equivalent (see 4).

**A pane that is not focused still shows the accent line.** The builder lists this as a kept difference, but the brief allows a kept difference only "where oculus does something VS Code does not". Oculus already has VS Code's active group:
- `layout.svelte.ts:256-260` `activeInstance` resolves `activePath(tree, active(page))`.
- HELP.md says the rail opens a view in "the pane whose tab was activated last".

My probe clicked Focus in the right pane. The left pane's shown tab still had `borderTopColor rgb(189, 93, 56)`, the accent. The difference is not justified by the brief and was not booked as a decision.

**Item 2, the pane header.** `PaneView.svelte:350-358` adds a split `ToolButton` and `:361` gives the menu the `more` glyph. Findings:
- **The two header actions differ in size.** In the probe, split is 25.8x19.56 and more is 30.19x24.31 (light, dark, vscode). In rice themes they are 47.61x21.75 and 36.56x22.5.
- **They are drawn differently in terminal themes.** In `shots/mocha-nowall-1600-strips.png` and `gruvbox-wall-1600-strips.png` the split button is drawn as `[ || ]` with small raised brackets, and the more opener as a bare `...` with no brackets. The two sit on different baselines. VS Code's group actions are uniform icon buttons.
- **Narrow panes.** In `shots/dark-820-overflow.png` the Q33 scroll controls keep their boxed ToolButton look while the header actions beside them are bare, so one strip draws two button styles.

**Builder decisions:**
- **New key `ui.pane_more_glyph`** (`config/text/ui.yml:44`). It is reported as a reversible decision. The grep confirms `ui.pane_menu_glyph` is still read by `views/sessions/SessionWorkspace.svelte:132` and `TerminalRows.svelte:65`. It is a user-visible config key the brief does not name, so it needs the orchestrator's ruling.
- **Page strip at 30px on `--card`.** Neither is a VS Code measure; the brief only asked for "its own height and background". Reported as a decision. My shots show the page strip reads as a separate band in light and dark.
- **Sash sizes not scaled.** Brief decision 2 says "the measures are VS Code's defaults scaled by `--text-scale`". `tokens.css:111-113` sets `--sash-hit: 10px`, `--sash-line: 2px` and `--sash-delay: 300ms` unscaled. `SASH_PX` is unscaled too, so this is defensible, but it departs from the brief's decision as written. It is reported, not booked.
- **Split button drawn only while a tab is shown** (`PaneView.svelte:350`). The HELP.md text in the report says the strip's right end "holds its split-right button" without that condition, so the sentence is false for an empty pane.
- **`tests/ui/wall.test.ts` edited outside the named paths** (+4 lines). The brief's list says "their tests", and this audit walks every `ui/` component, so the edit falls within that reading. Without it the suite fails. The entry at `wall.test.ts:117` holds the whole `.opener > :global(.tip > button...)` selector as a literal key, so any reformatting of that selector in `Tabs.svelte` breaks the node test.

**Item 3, the sashes.** Measured behaviour:
- The line is transparent at rest and turns accent after a hover and during a drag (shots `*-sash-rest/hover/drag.png`, all themes).
- On keyboard focus: `{"visible":true,"line":"rgb(189, 93, 56)","width":2}`.

**The Source view's editor/preview sash keeps the old always-visible 1px `--line` line** (`ui/Sash.svelte:116-129`, used by `views/source/Editor.svelte`). The app now draws two sash looks. The look belongs in `ui/Sash.svelte`, which was outside the paths. This is a path-scoping problem the orchestrator must resolve, not a kept difference the brief names.

**Item 4, the page strip.** Page tabs are 30px, with the same accent top line and the same close opacity rule (probe `pageTabs`). Page tabs never show a dirty dot, although closing a page asks about unsaved text. The builder states this; it is not booked.

**Kept differences the brief names:** the page strip, the badges, `FOLD_PX` and preview italics are all kept as named. The Q33 scroll controls stand in for VS Code's thin scrollbar, which is consistent with HELP.md line 9.

## 2. Proof

**Node reverts** (second clone, `scratchpad/q38-review/nodecopy`):

| Revert | Result |
|---|---|
| `dirty: false` in PaneView | red: "marks the tab the ui store answers unsaved for" |
| `class:dirty` removed | red in `workbench.test.ts` and `primitives.test.ts` |
| split button's `tabindex={-1}` removed | red: "draws the pane header's split button ... out of the focus order" |

**Browser reverts** (`tests/browser/tabs.spec.ts`, each after its own build):

| Revert | Result |
|---|---|
| R8 `border-top-color: var(--accent)` removed | red, 2 tests (tab look, page strip look) |
| R9 `dirty: unsaved(...)` set to `false` | red, dirty test |
| R10 sash hover delay removed | red at `tabs.spec.ts:337` |
| R11 `.split > :global(.sash.dragging .line)` removed | red at `:340` |
| R12 `width: var(--sash-hit)` removed | red at `:320` (`found(box.x - 1)`) |
| R13 `.tab.dirty .close` removed from the opacity selector | red at `:198` |
| R14 `--tab-height: var(--page-tab-height)` removed | red, page strip test |

**Reverts that stay green but should turn a test red.** I applied all seven together and each alone applies (`gcheck`, 1/6/3/1/3/7/3 changed lines). Built and run over tabs, shell-defects, pages, layout, keyboard and appearance: `50 passed`.
- `Tabs.svelte` `.tab.current { border-bottom-color: transparent }`: the gap in the line under the shown tab is untested.
- `Tabs.svelte` `.tabs::after` filler: the line past the last tab is untested.
- `Tabs.svelte` `color: var(--muted-txt, var(--muted))` on `.tab`: "inactive muted text", a brief item 1 mark, is untested.
- `Tabs.svelte` `.close:focus-visible` in the opacity rule: untested. The close button has `tabindex=-1`, so the rule may be unreachable.
- `SplitView.svelte:243-244` `.split > :global(.sash:focus-visible .line)`: untested, and the focus look stays correct without it. `Sash.svelte:131-134` already draws the accent on `:focus-visible` with higher specificity, so the rule is redundant.
- `SplitView.svelte` `.split.col > :global(.sash)::before`: the reach of a vertical split is untested (the spec only splits right).
- `PageStrip.svelte` `:global(body.wall) .strip > :global(.strip)`: the page strip over a wallpaper is untested.

**The pinned test does not test pinned tabs.** `tests/shell/workbench.test.ts` "draws a pinned tab as any other tab" names `class:current` as its revert, which proves only that the tab is current. Nothing pinned-specific can make it red.

**Class-name reach** (simulated renames, each built and run):
- C1, `Tabs.svelte` reaching Tooltip's `.tip` and Menu's `.menu > .tip`: red, header test.
- C2, `SplitView.svelte` reaching Sash's `.line`: red, sash test.
- C3, `PageStrip.svelte:346,350` reaching Tabs' `.strip`: red, page strip test. This third reach is not named in the builder's report.

All three couplings are guarded, but each styles a primitive from its consumer through `:global`. That is the coupling the principles forbid ("a module has one reason to change"): a Sash, Tooltip, Menu or Tabs class rename now breaks a sibling component.

## 3. Standards

- **Raw sizes, not tokens:**
  - `src/lib/ui/Tabs.svelte:408` `gap: 2px;` in `.opener`.
  - `src/lib/ui/Tabs.svelte:558-559` `width: 0.65em; height: 0.65em;` for the dirty dot.
  - The brief says "everything in theme tokens".
- **Duplicated rule blocks:** `.close` is declared twice (`Tabs.svelte:497` and `:515`), and `.face` / `.close` a third time at `:540`-ish (`.face, .close { display:flex ... }`). The same properties (`display`, `align-items`, `border`) are split across them.
- **Glyphs:**
  - `config/glyphs.yml:147` the orphaned `# circled section numbers (inbox)` comment now sits directly above the new tab-strip block, so it reads as a heading for `more`, `split_right` and `dirty`.
  - `dirty: a bullet` (`:151`) is the same character as `bullet: a bullet` (`:27`).
  - `icons.yml` `dirty: circle` repeats `circle_empty: circle`.
- **Tokens comment not verified:** `tokens.css:95-106` claims "VS Code's editor tab defaults" for `--tab-pad` 10, `--tab-icon-gap` 6, `--tab-actions` 28 and `--tab-close` 20. I did not check them against VS Code's source.
- **History in comments:** none found in the diff.
- **Non-ASCII:** the new characters appear only in `config/glyphs.yml`; the gate is clean.
- **File sizes:** `Tabs.svelte` is 574 lines, within the ~600 component guide but close to it. `tests/shell/workbench.test.ts` is 774 and `tests/ui/primitives.test.ts` 790.
- **False sentence in a comment:** `SplitView.svelte:16-21` says "a drag or the keyboard's focus draws it at once". That is true, but the focus half comes from `Sash.svelte`, not from the rule it describes (see 2).
- **Doc text:**
  - The proposed DESIGN.md decision line ends "Package Q38." and carries a package id. The same ending appears on 29 existing lines of DESIGN.md's Decisions section (`grep -c "Package [A-Z][0-9]" DESIGN.md` = 29), but it is a package id in a document.
  - The HELP.md line is false for an empty pane: the split button is not drawn there.
  - The HELP.md line says nothing of the dot's missing screen-reader text.

## 4. Behaviour

**Shots.** All in `scratchpad/q38-review/shots/`, deviceScaleFactor 2, from my own build served by `tests/browser/serve.ts` on 8792:
- Themes: light, dark, gruvbox with the wallpaper (`body` = `rice gruvbox wall`), mocha without it, vscode-dark-modern.
- Widths: 1600 and 820.
- Scenes: `-full` (two pages; two panes with a split; a dirty Tasks tab; a hovered tab), `-strips`, `-hover-tab`, `-hover-dirty`, `-sash-rest`, `-sash-hover`, `-sash-drag`, `-overflow`.
- Also `behaviour-sash-focus.png`, `behaviour-largest-text-strips.png`, `behaviour-tab-drag.png`, and a sash montage `sash-montage.png`.

**What the shots show:**
- **Header actions:** unequal and misaligned in terminal themes (`mocha-nowall-1600-strips.png`, `gruvbox-wall-1600-strips.png`).
- **Overflow:** a narrow pane's scroll controls are boxed buttons beside bare header actions (`dark-820-overflow.png`). A tab under a scroll control is clipped, which is expected.
- **Dirty dot:** it sits about 1.5 CSS px below the centre line of the cross it replaces (`behaviour-tab-drag.png`: dot centre y 107 vs cross 104 device px). Visual reading only, not measured with `getBoundingClientRect`.
- **Keyboard focus on a sash:** the browser's default blue focus ring is drawn on both sides of the 2px accent line (`behaviour-sash-focus.png`, light). The ring comes from `Sash.svelte`, which has no outline rule. With the line now hidden at rest, the ring is the dominant focus mark.
- **Largest text (scale 1.6):** tab 56, strip 56, opener 56, so the header does not outgrow the tabs.

**The sash reach over the panes' edges** (1600, light; separator box x=846 w=6; panes [102,846] and [852,1596]):
- `elementFromPoint` gives SASH at x = 844, 845, 852 and 853, and `div.body` at 843 and 854. The sash takes each neighbouring pane's 1px border plus the first 1px column of that pane's body.
- A press at x=844, inside the left pane's content, followed by a drag of 58px, resized the split (left pane width 744 to 686).
- The Status view's scroller ends at x=817, so no scrollbar was under the reach in this layout. A view whose scrollbar or card edge is flush with the pane body loses its outermost 1px column to the sash. That case is not verified with a flush scroller.

**Screen reader name** (probe, `ariaSnapshot` of the left strip):
```
- tab "Status" [selected]
- button "Close tab"
- tab "Tasks & Service"
- button "Close tab"
```
The dirty tab and its close button carry no word for unsaved text.

## Not checked

- VS Code's source values for tab padding, icon gap, close-room width, sash hover size and the unfocused-group colours. The comparisons above use the brief's reference list only.
- A view with a scrollbar flush against the pane edge next to the sash.
- The builder's "before" measures (29.25px tabs, 2px gap).
- The Source view's sash in a browser (read from `Sash.svelte` only).
- A vertical (split-down) sash in a browser.
- `rail.spec.ts` and `unsaved-forms.spec.ts` under my reverts (run only unreverted, in the worktree).

Reviewer usage: about 50 tool uses, about 20 minutes (17:57 to 18:17).
