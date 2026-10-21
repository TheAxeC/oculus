# O48 review

Reviewer a1eff21c60f97ff0a (ordo-high; served model not recorded), 236,435 tokens, 106 tool uses, 10.8 min. Read only: the diff of O48 in the main checkout over 605466ac, the code around each hunk and its users, and the xterm 6.0.0 package. No test, check or build was run, by Axel's standing order.

## Spec

- Sp1. `editor.opacity` reached only the Source view's Monaco editor. The Diff view's file sections (`DiffSection.svelte`, `data-surface`, painting `--panel-on-wall`), the Merge view (`Merge.svelte`, a tinted Pane), the Deposit view's diff (inside its tinted Pane) and a Source tab's read-only code window (`LockedCode` to `Code.svelte`, `--chip-on-wall`) stayed at the panel's share, while the help and the manual said "the source editor and the diff editor".
- Question 2 holds: the workspace layer checks a key against the catalog (`workspace-layer.ts:58-66, 210-223`), not the defaults files, and `writeConfigKey` inserts a missing key (`config-key.ts:122-158`).

## Proof

None: the step adds no test and has no builder report.

## Standards

- St1. `Terminal.svelte` 528 lines, over the 520 limit of a component, from the `.share` wrapper.
- St2. `tokens.css:226-231` ("everything the box holds ... keeps `panel_opacity`") and the `--panel-on-wall` comment made false.
- St3. The manual and the catalog help named the diff editor (false, Sp1), "an editor inside a card" (no Monaco editor is drawn in a card), and said a value is clamped (a workspace or Settings value outside 0 to 1 is refused, not clamped).
- St4. `allowTransparency: true` has no effect in xterm 6 (only a default in `OptionsService.ts:45`), and its comment said it did.
- St5. `WALL_EDITOR` and `WALL_TERMINAL` exported with no importer; `WALL_PANEL`, `WALL_POPOVER` and `WALL_BLUR` the same.
- St6. The test for a list-type control in four places (`Item.svelte` `oneValue`, `Control.svelte` `single`, `EditLink.svelte` `WHOLE`, `editors/writer.ts:127`).
- St7. `appearance.ts`: the transform wrote `editor`/`terminal` only for the type and `setAppearance` overwrote them; `opacityOf` wrote the clamp by hand beside `clamped`.
- St8. `wall.css:4-6` not rewrapped.
- St9. `Control.svelte`'s head comment named two keys and claimed "its key is left out of every file", false for a hub key set to `null`.

## Behaviour

- B1. The grid's transparent background showed xterm's `.xterm-viewport`, painted `#000` by `xterm.css:93-102`, behind the text on every theme, wallpaper or not.
- B2. Inverse video drawn in `color.opaque(background)`, black for `rgba(0, 0, 0, 0)`.
- B3. The selection blended over black (`ThemeService.ts:84-101`).
- B4. The two rows read "Default: empty" while `panel_opacity` holds.
- B5. A reset of a key with no default showed the old value while the reset was out (`writer.shown(row) ?? row.value`).
- B6. `Item.svelte`'s `control` said `none` for a missing row that draws a number control.
- B7. Only `editor.opacity` and `terminal.opacity` are catalog options with no defaults line; a hub key set to `null` also draws an empty control now.
- B8. Not from this step: Monaco's sticky scroll band is painted `--panel` (`colours.ts:155-156`) and stays solid under `editor.opacity`.

## Declined to judge

- B1 to B3 on screen, a Terminal view in a docked float, and whether a hub key set to `null` raises a shape finding.

## Closed

All in the main checkout, before the commit, by reading, with no run:

- Sp1, St3: `Pane.svelte` takes `share: 'editor' | 'terminal'`, which sets `--panel-on-wall` on the box to `--editor-on-wall` or `--terminal-on-wall`; the Merge view's Pane takes `share="editor"`, the Diff view's file section paints `--editor-on-wall`, and `LockedCode.svelte` wraps the code window in a `display: contents` box that sets `--chip-on-wall` at `--wall-editor`. The Deposit view's diff, drawn inside its own tinted view, keeps that view's share, since a second layer over the view would break the one-layer rule of `tokens.css`. The help, the manual and the defaults comments name what follows each key, drop the card and the clamp.
- St1: the wrapper is gone; `Terminal.svelte` is its committed text with `share="terminal"` on its Pane, 517 lines.
- St2: `tokens.css` declares `--editor-on-wall` and `--terminal-on-wall` on body with a comment naming who takes each, and the rule paragraph names the two keys.
- St4, B1, B2, B3: the grid's background is the panel's colour with alpha 0 (`clear` in `grid-look.ts`), so inverse video and the selection derive from the panel's colour; `allowTransparency` and `cursorAccent` are gone, so the cursor is as on main; the new `grid/grid.css`, imported by `grid-look.ts`, paints `[data-terminal] .xterm .xterm-viewport` transparent.
- St5: the five wall constants of `theme.ts` are local.
- St6, B6: `writtenWhole(control)` in `state/system/config/rows.ts`, used by `Control.svelte`, `Item.svelte`, `EditLink.svelte` and `editors/writer.ts`; `Item.svelte`'s `control` is `none` only for a missing row written whole.
- St7: `wallpaperShape` gives the wallpaper without `editor` and `terminal`; `setAppearance` adds them through `shareOf`, which reads `opacityShape` and falls back to the panel's share in one place.
- St8: rewrapped.
- St9: the comment states the rule without naming keys or claiming where a key is absent.
- B4: a config row whose default is undefined (a key the defaults leave out) draws no default line.
- B5: `RowWriter.pending(row)`; the control shows `shown` while a write is out, an undefined one included.
- B7: no change; the empty control is right for any one-value key with no value.
- B8: not changed; the band sits over lines that scroll under it, and a see-through band would show them through it.
