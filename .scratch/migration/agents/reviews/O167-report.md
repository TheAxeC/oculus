# O167 builder report: stopped at the first run

NOT done: every item of "What to build". The builder stopped after the first run of the cases, before changing any file under `src`, `config` or `docs`, because the first run shows premises of the brief that do not reproduce and fixes that need paths outside the write list. The only files changed are the two test files whose rows the brief asks for (C7, C10, C12), run on the unchanged tree.

## Premises that do not reproduce, and paths outside the write list

1. Item 6 (C6): "a collection's rows are built in `src/lib/state/boards/collection/index.ts`" does not reproduce. index.ts is pure (its head: "No rune and no store here") and builds no row list; the Collection view builds its rows in `src/lib/views/boards/collection/Collection.svelte:144-160` and `:217-222` from `selectors.collectionsOfKey` (`src/lib/state/client/selectors.svelte.ts:480-483`) through `cardOrder` (`card-order.ts`). The `Settle` type that `deleteEntry` would call is declared and implemented in `src/lib/state/forms/page-entry.ts:370-380` and `:454-487`. Paths needed: `page-entry.ts`, and either `Collection.svelte` (reading `client.settled`, which `context.ts:838` exposes) or `selectors.svelte.ts` plus `context.ts` (879 lines) to hand the settled store to the selector.
2. Item 2 (C2): a refused write cannot be told today. `setSelf` (`src/lib/state/workbench/ui.svelte.ts:187`, `:485-488`) runs `void deps.writes.writeConfigKey(LOCAL, 'self', key)` and returns nothing, so Person.svelte cannot learn the refusal to drop its pressed flag. Path needed: `ui.svelte.ts` (setSelf answers the write's outcome).
3. Item 3 (C3): the right group's DOM order is reversed inside three components rendered directly into the group, so removing `row-reverse` while keeping every item's place needs their markup in drawn order: `src/lib/shell/status/SourceItems.svelte` (comment `:19-21`, items written language first), `src/lib/shell/status/LanguageItems.svelte` (rendered by SourceItems into the same group), `src/lib/shell/status/AppItems.svelte:24-27` (`side === 'right' ? drawn.reverse() : drawn`). Paths needed: those three.
4. Item 7 (C7): telling whether a folder between the parent's root and a nested repository is ignored by the parent needs git's answer (`check-ignore`); the one git call site is `src/lib/server/core/git/run.ts`, reached through `ignoredIn` (`src/lib/server/core/git/files.ts:34-47`), which takes the server's `GitCredentials`. `runNames` receives none. Paths needed: `src/lib/server/files/search/search-routes.ts` and `src/routes/api/(files)/search/+server.ts` (pass `server.credentials`, as `src/routes/api/(machine)/hpc/+server.ts:39` does for `keptFiles`).
5. Item 10 (C10): the field is drawn by `src/lib/views/system/workbench/editors/FieldControl.svelte` (520 lines, at the component limit), which hands no refusal to its inputs; of the inputs only `TextInput.svelte` and `NumberInput.svelte` take `invalid`/`refused`. Marking the field with `aria-invalid` needs FieldControl.svelte (split by concern, since it is at 520), `src/lib/ui/forms/TextArea.svelte` and `src/lib/ui/forms/choice/SuggestInput.svelte`.
6. Item 15 (C15): no fact of the layout state holds a pane's width in pixels (`grep -rn 'MIN_PANE\|minPane\|narrowest\|areaWidth\|paneWidth\|clientWidth' src/lib/state/workbench/layout` prints nothing), so `landingFor` and `openOpened` cannot tell whether a split leaves a pane under 320 px times the text size. A width source has to be handed to the opening code; where it comes from (the shell measuring the panes, or the window width with the tree's split fractions) is a design choice and touches files outside the list (`src/lib/state/workbench/layout/access.ts` or the layout store's construction, and the shell that measures).
7. Item 19 (C19): Bar.svelte takes `count` and `at` as numbers (`Bar.svelte:28-29`, `:55-56`); drawing no counter while a deck loads needs its Props, not line 113 alone. Path needed: Bar.svelte lines 26-60.
8. Item 11 (C11): `settingsTyped` (`typed.ts:130-132`) reads only the tab's instance state; to leave refused text uncounted the typed record needs a mark of its refusal, a new key in a record saved with the layout. That is a user-visible saved shape the brief does not name, so it is raised as a decision: a `refused: true` key on a typed record, set by Control.svelte when the row's writer refuses the text and dropped on the next keystroke.
9. Item 13 (C13): the reading of the key path end to end names no cause; see C13 below.

## The cases' first run (unchanged tree)

- C1 (reading): `open-view.svelte.ts:99` draws `groupGlyph(section)`, which takes `group_glyph` (`catalogue.ts:263-267`, `:289`): Focus `focus`, Pillars `book`, Registries `venue_dist`, Present `conference`, Help `page`, System `settings` (`layout.yml:10-21`). As the brief says.
- C2 (reading): `Person.svelte:211-219` draws `pressed`/`active` from `isSelf` (`:167`, the portfolio's flag); until the portfolio arrives the button is unpressed and enabled, and `ToolButton.svelte:207-209` draws the hover border. A refusal is said through the writes store's onUnwritten only; Person.svelte never sees it (premise 2).
- C3 (reading): `StatusBar.svelte:420-423` `row-reverse`; right group DOM order Bell, unsaved, sessions, AppItems right, SourceItems, so Tab walks right to left. No code scrolls a focused item into view. As the brief says; see premise 3.
- C4 (reading): `project.yml:193` `listing: Projects`; `docs/palette.md:26` `| Projects | listing |`. As the brief says.
- C5 (reading): `FocusFilter.svelte:157-160` gives the focus back with a plain `focus()`; `PickMenu.svelte:137` has no `onCloseAutoFocus`, so bits-ui focuses the trigger plainly; after a keyboard Escape the trigger matches `:focus-visible` and `Tooltip.svelte:186-194` opens the tip. `focus.yml:100` begins in lower case with no stop. As the brief says.
- C6 (reading): `writes.svelte.ts:408-410` only sends; `fs.svelte.ts:823-827` invalidates on success; `schedule.svelte.ts:705-706` posts and `send` touches no row. The rows stay until the next read. As the brief says; see premise 1 for where the rows are built.
- C7 (test row, `npx vitest run tests/server/files/nested-names.test.ts`): rows 1 (site in the exclude file) and 3 (`projects/p/` in the exclude file) give their expected listing; row 2 fails:

```
AssertionError: expected [ { ...(3) }, { ...(3) }, { ...(3) } ] to deeply equal [ { ...(3) }, { ...(3) }, { ...(3) } ]
     "inner": ".agents/worktrees/w",
     "listed": [
+       ".agents/worktrees/w/a.txt",
        ".gitignore",
        "a.md",
```

- C8 (reading): `Header.svelte` `.field { flex: 1 1 auto; min-width: 0 }` beside `.count { flex: 0 0 auto }`, the input `min-width: 0` (`field.css:13`): the field shrinks to nothing. As the brief says.
- C9 (reading): `ScopeBar.svelte:143-156` both `glyph="save"` and `compact`; "Saved into" in `{#if last !== null}` (`:158-160`), in the flow. As the brief says.
- C10 (test rows, `npx vitest run tests/state/system/settings/row-writer.test.ts`): 'is said until it is withdrawn: Escape, the held value typed back, or Reset' passes on the unchanged tree (write.ts already gives those outcomes); 'names the reasons of a refused Save with no full stop of their own' fails:

```
-     "The theme is not listed; The file is locked",
+     "The theme is not listed.; The file is locked",
```

  Reading: no field carries `aria-invalid` for a row's message (premise 5).
- C11 (reading): `typed.ts:130-132` counts every typed record, refused or not. As the brief says; see premise 8.
- C12 (test row, same command): the rows of a key the file does not hold fail for text, long, path and number, choice passes; every row of a key the file holds passes:

```
      "control": "text",
-     "held": undefined,
+     "held": {
+       "value": "",
...
      "control": "path",
-     "said": null,
+     "said": {
+       "args": [],
+       "key": "workbench.settings_not_a_path",
...
      "control": "number",
-     "said": null,
+     "said": {
+       "args": [],
+       "key": "workbench.settings_empty",
```

- C13 (reading, no cause found): window keydown (`Workbench.svelte:367`) to `keys` (`workbench-keys.svelte.ts:137-182`): no handler before it prevents the default; `resolveKey` answers `save` from `savesFile` (`resolve.ts:168-171`, refused only when `defaultPrevented`); `perform` (`:259-262`) saves unless the palette, the tray or an `alertdialog` is shown (`dialogShown`, `:337-341`), none of which a closed gear menu draws; `saveSource` (`source-keys.ts:28-33`) calls `ui.saveTab(pageTab().id)`, which runs every save the tab registered (`close-hooks.ts:108-112`): Settings' `scopes.save()` (`Settings.svelte:217-222`, `scopes.svelte.ts:218-228`) and each Control's. On the trigger side: bits-ui's trigger `onkeydown` prevents the default only for Space, Enter and ArrowDown (`menu.svelte.js:1449-1460`); `Menu.svelte:175` passes `onkeydown` only when a caller gives one, and Gear.svelte gives none; MenuOpener.svelte adds no key handler; Tooltip.svelte's document listener (`:250`) answers Escape only; no Settings handler stops a key (`Settings.svelte:381-385` answers Escape only; `Control.svelte:102-107` Escape only, and the gear is outside `.box`). The desktop menu's save (`menu-answer.ts:188`) runs the same `saveSource`. By reading, Cmd+S with the focus on the gear reaches the same saves as from the field; the cause of the reported flaw is not on this path as read, so it cannot be named before a change.
- C14 (reading): `CardActions.svelte:332-339` lays `.actions.over` absolutely at the top right on hover devices; `Card.svelte:105-121` draws the title with no room kept. As the brief says.
- C15 (reading): `landing.ts:96` ends in `{ kind: 'split', path: away ?? reader }`, with `away` the asker's pane (`opening.ts:280`); each record opened from a row splits the asker's pane again. As the brief says; see premise 6.
- C16 (reading): `Empty.svelte:122-125` puts `# ` before every `.empty` under rice, the error box and a box with a glyph included. As the brief says.
- C17 (reading): `Pane.svelte:221` `max-height: 50%` for every view. As the brief says.
- C18 (reading): `present.yml:58-76` holds the lower-case labels the brief lists; `GroupHead.svelte:219-222` the sticky strip at `z-index: 2`. As the brief says.
- C19 (reading): `Present.svelte:171` `rows = deck?.slides ?? []` and `:332-333` `count={rows.length}`, so "0 / 0" while the deck loads; `DeckAnswer.loading` and `.error` (`src/lib/state/life/present.svelte.ts:76-82`) are there to read. As the brief says; see premise 7.

## Files changed

From `diff -rq` against the base copy over `src` and `tests`: `tests/server/files/nested-names.test.ts` and `tests/state/system/settings/row-writer.test.ts`; nothing under `src`.
