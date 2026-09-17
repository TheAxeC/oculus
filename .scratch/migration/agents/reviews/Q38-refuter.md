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

## Repair round 1, refuted

```
Rerun in the worktree (tools/oculus), nothing edited anywhere; git status --short still 21 modified files, no untracked.
npx vitest run --reporter=dot        Test Files 246 passed (246), Tests 4125 passed (4125), 39.07s, no timeout
npm run check                        COMPLETED 1209 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint                         exit 0, no output
npm run format:check                 All matched files use Prettier code style!
ASCII gate (the perl command)        printed nothing
find src tests bin | wc -l | tail -3 970 tests/state/layout.test.ts, 980 tests/state/board.test.ts; largest component Tabs.svelte 596, Files.svelte 588
npm run build                        exit 0
playwright tabs, shell-defects, pages, layout, rail, unsaved-forms, source, keyboard, files-forms   86 passed (1.6m)
playwright whole suite (the report's 227)                                                          227 passed (4.6m)

Reverts, each in my own clone (scratchpad/q38-review2/clone), rebuilt before its run, restored and byte-checked after:
V1 ToolButton.svelte :219 `:global(body.rice) .tool.bare` dropped from the selector   RED, tabs.spec.ts:406 (gruvbox one-box)
V3 Sash.svelte :138-144 `.sash.col::before` (the split-down reach) removed            GREEN, tabs.spec 10 passed
V4 Sash.svelte :182-185 `.sash.col:focus-visible .line` removed                       GREEN, tabs.spec 10 passed
V7 Tabs.svelte :574 `transform: translate(-50%, -50%)` on the dot's svg removed       GREEN, tabs.spec 10 passed
V12 Tabs.svelte :392 `:global(body.wall) .strip.card` removed                         GREEN, tabs + pages + appearance 18 passed
V16 tokens.css :119 `--sash-reach: 0px`                                               probe: the caught column moves from 844.5 to 845.5

Probes from my own served build (the browser suite's serve.ts on 8792, clone build), light, dark, gruvbox at 1600x900 and 820x700, shots in scratchpad/q38-review2/shots/:
two panes with the right one active, a dirty Tasks tab, the page strip, a split-down handle hovered and focused, a narrow pane's scroll controls, an embedded page, a folded active pane.
```

- `src/lib/shell/PaneView.svelte:96` (`activePane = activeInstance(page)?.id === active`): ruling 1 not reached for a page shown inside another page. Probe with page 2 embedded in page 1: three `.tab.current` tops read `accent` (the page tab), `accent` (the host pane's Projects) and `accent` (the leaf pane's Tasks), and after a press inside the leaf still `[accent, accent]` for the two pane strips, so two strips carry the accent at once and it no longer says where the rail opens. The report names this as reversible decision 3 and the Doc text's HELP line ("the shown tab of every other pane a plain one") is false in that case; nothing is booked in `orchestrator-state.md`'s Open items. Under Spec.
- `src/lib/shell/PaneView.svelte:96`: with the active pane folded, no strip carries the accent at all. Probe: two panes, the right one active, `Fold pane` from its menu, tops afterwards `[accent(page tab), line(Status)]`, one `[data-fold]` strip, no separator. The rail still opens into that pane and no tab says so. Under Behaviour.
- `config/text/ui.yml:54` `tab_unsaved: '{0}, unsaved'` and `:44` `pane_more_glyph: more`: user-visible catalog keys the brief does not name, and the new `Tabs` props `focused`, `low`, `surface`. The first refuter asked for a ruling on `pane_more_glyph`; grep of `orchestrator-state.md` finds no Q38 entry in the Open items list, so neither key is booked. Under Spec.
- `tests/browser/tabs.spec.ts:304-311` (the dot-vs-cross centre check) with `src/lib/ui/Tabs.svelte:567-576`: the check measures the `.dot` span box, which is 1em x 1em in the close control whatever the svg does, so the revert named in that test's own list ("drop the `.tab.dirty:not(:hover) .dot` rule") is not the one that could move the mark. Removing `transform: translate(-50%, -50%)` from `.close .dot :global(svg)`, which puts the drawn dot's top-left on the centre point and moves it about 1.5 em down and right, leaves tabs.spec 10 passed. A check fitted around its revert. Under Proof.
- `src/lib/ui/Sash.svelte:138-144` `.sash.col::before`: the split-down handle's reach is untested, as limit 6 of the report says; removing the whole block leaves tabs.spec 10 passed. My own probe shows the vertical handle does work (sash box y 462 h 6 between panes [34,462] and [468,896]; line transparent at rest, accent after the delay, 4 px accent and `outline: none` under the keyboard, a press on the upper pane's border row resizes 444 -> 384.5 px), so this is missing coverage of a rule the ruling asked for on every sash, not a broken handle. Under Proof.
- `src/lib/ui/Sash.svelte:182-185` `.sash.col:focus-visible .line`: removed, tabs.spec 10 passed. The keyboard mark on a vertical handle is untested. Under Proof.
- `src/lib/ui/Tabs.svelte:392` `:global(body.wall) .strip.card`: removed, tabs + pages + appearance 18 passed. Ruling 5 was untested or redundant rules; over a wallpaper this rule is what keeps the page strip translucent, since `.strip.card` (two classes) beats `:global(body.wall) .strip` and would paint opaque `--card` over the picture. The same rule's predecessor was on the first refuter's untested list. Under Proof.
- `src/lib/ui/Sash.svelte:117-122` (`--sash-reach: 1px` through `::before`): at deviceScaleFactor 2 a real pointerdown at x = 844.5, which is the left pane body's last device-pixel column (body ends at 845, the pane border is 845-846, the sash 846-852), lands on the separator; 853 on the right side does not. With `--sash-reach: 0px` the same probe gives the border column 845.5 instead, so the reach is one device pixel wider than the borders on the left at that scale. `tests/browser/tabs.spec.ts:462-465` probes whole pixels only (`bodies[0].right - 1`, `bodies[1].left`), so the claim "never inside them" is proven at whole pixels alone. Under Behaviour.
- `src/lib/ui/Tabs.svelte` at 596 lines against the component guide of about 600, four lines of room, not split. `tests/ui/primitives.test.ts` 852 and `tests/shell/workbench.test.ts` 807 are under the 1000-line rule, no finding there. Under Standards.
- Not this step's, so that nobody reads it into the delta: under gruvbox (body `rice gruvbox wall`) the pane menu's list is covered by the pane body, `elementFromPoint` at the "Split tab downwards" item returns the body's `h3` and a click never lands. Reproduced on the base build at 91fb46cb with the step's diff reversed, and on the current tree, identically; light is unaffected.
- `tests/browser/words.ts:41-48` `tabNamed`, the dirty tab's accessible name, the page tab's dot across nested pages, and the `bare` prop on `ui/ToolButton.svelte` and `ui/Menu.svelte`: no finding. `tabNamed` anchors both alternatives (`^(?:label|label, unsaved)$`) after escaping, so a label that is a prefix of another does not match; the whole browser suite is green at 227 passed; `pageInstanceIds` walks no page leaf, which is the same list `closing.ts` asks the close question over, so a host page carrying an embedded dirty page shows no dot and closing it loses nothing (probe: "Page 2, unsaved", "Page 1" clean); `bare` is read only by the four strip buttons, and the only rule reaching other callers is the added `:not(.bare)` on the rice bracket rules, whose V1 revert shows the rice override is load-bearing. Measured boxes at 820 wide: light and dark 22.2 x 22 for all four controls, gruvbox 28.6 x 22 for all four, one vertical centre.
- Tokens: every token in the delta has a reader (`--tab-height-low`, `--tab-dot-size`, `--tab-action`, `--tab-action-pad`, `--tab-action-gap`, `--sash-reach`, `--sash-line`, `--sash-focus-line`), and the removed `--sash-hit` and `--page-tab-height` have none left. No finding.

Not checked: VS Code's own source values; a view whose scrollbar is flush with the pane body's edge (no such view found in the demo hub, the Status and Projects scrollers end inside their padding); the node suite under my reverts (the reverts were run against the browser specs only); `Tabs.svelte`'s pinned and preview cases beyond the node test.

Reviewer usage: about 40 tool uses, about 60 minutes (19:22 to 20:20).

## Closed at landing

- The dirty-dot check fitted to its revert (`tests/browser/tabs.spec.ts`): closed. The check measures the drawn svg inside the box, not the 1em box, on both axes; it is red with `transform: translate(-50%, -50%)` removed from `.close .dot :global(svg)` (the mark moves 20.66 px).
- The split-down handle's reach and its keyboard mark, untested (`src/lib/ui/Sash.svelte`): closed. A new case splits a pane downwards, probes the border row above and below the gap and the two body rows beside them, and reads the keyboard line; it is red with `.sash.col::before` dropped and red with `.sash.col:focus-visible .line` dropped.
- The page strip's wallpaper rule, untested (`src/lib/ui/Tabs.svelte` `:global(body.wall) .strip.card`): closed. The page-strip case now switches to a wallpaper theme and reads both strips: their surfaces differ and both are translucent; it is red with that rule dropped.
- The accent on two strips at once with a page shown inside another page, and on no strip when the active pane is folded: booked as Q53.
- `src/lib/ui/Tabs.svelte` at 596 lines against the component guide: booked as Q54.
- The pane menu covered by the pane body under the rice themes, which the reviewer reproduced on the base build as well: booked as Q55.
- The sash reach one device pixel past the borders at deviceScaleFactor 2: recorded, not changed; the rule the ruling asked for is the reach over the 1 px borders, and the case proves it at whole pixels.
- `config/text/ui.yml` `tab_unsaved` and `pane_more_glyph`, and the new `Tabs` props `focused`, `low` and `surface`: the two keys are named in the landing note and in the Doc text; the props are internal.
