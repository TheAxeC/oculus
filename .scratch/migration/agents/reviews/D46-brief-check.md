# Brief check of D46 (plan oculus/migration), read on main at 2390acd38 (`git log -1 --format=%h` printed `2390acd38`). Nothing was written, edited or created in the repository. One scratch file of path names (no contents) went to the session scratchpad.

Summary: the brief can be dispatched once the items below are fixed. The ones that would decide the build:

1. F1 cannot reach the shell from a terminal unless `grid-keys.ts` changes, and that file is not in the write list.
2. The premise about how the Files view opens a file is wrong, and the shell is not allowed to import the rule that does it.
3. The client side of the names request has no file in the write list that fits the layer rules.
4. The wire format of the names request is left to the builder, which the rules file counts as a silent decision.
5. One acceptance item contradicts the Search view: with the parameter absent, the request is an ordinary search.
6. The cap is a constant, while `search.max_hits` is a config key.
7. With ripgrep's hidden-file rule, Cmd+P cannot find any of the 1,708 files under `.scratch/`, `.agents/` and `.oculus/`, the ledgers among them.

## Names

Commands run from the hub root:

`git grep -n -I -E 'Cmd[-+]P\b|Cmd[-+]Shift[-+]P|Ctrl[-+]Shift[-+]P|Ctrl[-+]P\b|\bF1\b'`, excluding local.yml, secrets and the brief. Two hits: `plan.md:702` and `plan.md:1607`, the step line and the ruling. Neither is made false.

`git grep -n -I -E 'Cmd[-+]K|Ctrl[-+]K|cmdk'` over the repository, excluding `.scratch` and `tools/cockpit`. The hits outside "Paths this step writes":
- `docs/window.md:54` (Open File... is the palette as Cmd-K opens it): still true.
- `docs/window.md:57` (Pin Editor listed with Cmd-K Shift+Enter): still true.
- `docs/window.md:7` and `docs/files-and-search.md:85` (Cmd+T in the app): still true.
- `src/lib/shell/panes/PaneView.svelte:148` and `pane-view.ts:290`: still true.
- `src/lib/state/workbench/navigation/editor-status.svelte.ts:14-15` ("the Cmd+K chords the editor gave up so Cmd+K reaches the palette"): stays true but becomes incomplete once F1 is freed. It is outside the write list.
- `src/lib/ui/controls/editor/kit/load.ts:136`: still true.

`git grep -n -F` for each of the following names.
- **`freedKeys`:** hits only `chords.ts` (in the list) and `kit/load.ts:64,220`. load.ts needs no change, since it maps whatever the list holds.
- **`runRipgrep`:** hits `src/lib/server/files/fs/replace.ts:8,57,188`, which is outside the list. If the builder changes the signature, replace.ts changes too, so the brief should say the signature stays.
- **`SKIP_GLOBS`:** hits only `query.ts:37,170`, which is in the list. The constant is not exported.
- **`Palette.svelte`:** the import in `Workbench.svelte:38`, and the head comments of `PaletteRow.svelte`, `lint-config.svelte.ts`, `palette-modes.ts` and five files under `rows/`. These stay true.
- **`prefill` and `openPalette`:**
  - `openPalette(prefill: string)` is typed or handed on in `PaneView.svelte:148-149`, `floats/FloatLayer.svelte:51-52`, `floats/FloatWindow.svelte:17-18`, `leaf/PageLeaf.svelte:39`, `pane-view.ts:399`, `status/StatusBar.svelte:68` and `status/status-items.ts:156`. None of these is in the list.
  - The file mode has no typed prefix (decision 3), so a string prefill cannot express it. If the mode is passed through `openPalette`, all seven files change. The brief should say the file mode is opened by a separate handler option that leaves `openPalette(prefill)` as it is, or else widen the list.
  - `Workbench.svelte` is 517 lines (`wc -l`), 3 under the 520 line, and is in the list only "where it passes the palette's mode". Item 7 names only `Palette.svelte` for the size rule.
- **Palette item kinds:** `PaletteItem` is consumed by `palette-open.ts` and `Palette.svelte`, both in the list.
  - `PaletteRow.svelte` (143 lines) draws `ResultRow` (`value, kind, label, pick, parts, hint, note, active, disabled, language`). It has no slot for an icon.
  - Item 3 asks for "the file's icon as the Files view draws it". So either `PaletteRow.svelte` changes (not in the list), or the new rows component draws its own row beside PaletteRow, which duplicates it (DRY). The brief does not say which.
- **The search route:** DESIGN.md:142 reads "**Search.** One pattern over one served root or all of them, answered by `GET /api/search`...". Decision 1 makes the route also answer a request with no pattern, so this sentence becomes incomplete.
  - The rules file puts "a decision with its reason" in DESIGN.md, and decision 1 is such a decision.
  - DESIGN.md is not in the list and is not in "What is on the tree".
  - `docs/files-and-search.md:130-132` (the roots and the skip list) stays true.
- **The key sheet's catalog keys:** `app.keys.rows` (`config/text/app.yml:13`, in the list) and `desktop.keys.rows` (`config/text/desktop.yml:26`, app-only keys) are read at `Workbench.svelte:309-310`. The new keys are not app-only, so desktop.yml stays true.
  - `app.palette.cmdk_placeholder` (`app.yml:47`) is not in the brief's paragraph list. It stays true for Cmd+K.
- **HELP.md key table:** rows 79-80, and row 84 (`| : | command line |`), which stays true.
- **`docs/window.md` "The palette"** (72-80): in the list.

## The step line

`plan.md:702` has six parts, and each is served:

| Part of the step line | Served by |
|---|---|
| Cmd+Shift+P opens the command mode | item 1 |
| F1 opens the command mode | item 1 |
| F1 taken from Monaco as Cmd+K is | item 2 |
| Cmd+P opens a new file mode | item 3 |
| finds files by name across the served roots | items 3 and 4 |
| Cmd+K stays as it is | item 5 |

- Items 6 (the text) and 7 (size) serve the rules file, not the step line.
- No part of the line is without a requirement.
- `plan.md` has no Goal section: `grep -in goal plan.md` finds only lines 320 and 766, neither of which is a section. The goal used below is the one given in my task.

## Premises

Every reference was rerun.

**Hold:**
- `workbench-keys.svelte.ts` is 547 lines. Cmd+K is at 127-132 and `:` at 133-144. `function keys` is at line 109, not 110, which does not matter.
- `keys.ts` is 428 lines, with `appKey` at 232 and its comment at 224-231.
- `grep -rn "KeyP\|'p'" src/lib/shell/keys/keys.ts` prints nothing.
- `grep -n accelerator src/desktop/windows/menu.ts` gives Cmd+, / Cmd+Shift+N / Cmd+Shift+W / Cmd+R / Ctrl+Cmd+F / Cmd+= / Cmd+- / Cmd+0 / Alt+Cmd+I. That is as stated.
- `chords.ts` `freedKeys` is at 80-82 and returns `[CMD_K, CTRL_K, F8, SHIFT_F8]` on mac. `kit/load.ts:220` applies it.
- Monaco's `standaloneCommandsQuickAccess.js:62` is `primary: 59 /* KeyCode.F1 */`.
- `Palette.svelte` is 520 lines. `shell/keys` holds 9 items, `rows/` 6, `state/workbench` 10, `src/routes/api/(files)` 10 and `server/files` 10.
- `palette.ts` is 443 lines, with the kinds at line 52. `fuzzy.ts` is 66 lines. `package.json:79` is `"fuzzysort": "4.0.2"`.
- `pane-view.ts:336` and `:443` are as stated.
- `search.ts` is 492 lines, with `runRipgrep` at 98 and `scopeRefusal` at 425. `query.ts` is 265 lines, with `SKIP_GLOBS` at 37. `search-routes.ts` is 58 lines.
- `sourceTabState` is at draft.ts:235.
- `.agents/plan.yaml:8` is `standards: []`, and `grep -n adr .agents/plan.yaml` prints nothing.
- There is no `docs/glossary.md` (`ls tools/oculus/docs`).

**Drifts:**
- The brief says the hub size is 7,507 paths and 589,537 bytes. `rg --files` with the four SKIP_GLOBS from the hub root now prints `7501 589005`.
- Decision 1's measurement covers the hub only. The other served roots (`config/sources.yml:92-98` plus the engine root) add 1,884 names: cathedra 1075, game-engine 522, ordo 91, scotoma 35, officium 75, youtube-downloader 5 and engine 81. That makes about 9,385 in all, still far under the cap.

**Does not exist yet:** `.agents/worktrees/D46-base/tools/oculus` (`ls`: No such file or directory). This is expected until the worktree is made at dispatch.

**Wrong:** "A file opens from a list in a source tab through `sourceTabState` ..., as the Files view's row does."
- The Files view's row opens through `src/lib/views/shared/explorer/opening.ts` (`tabForKind` at 56, `openRow` after 92).
- That rule chooses the view by kind:
  - a text file, or a file in an apps folder, opens in the source tab;
  - an HTML file opens in the Document view;
  - a picture, a PDF or any other file opens in the File view.
- A single click opens the pane's preview tab (`openView(..., { preview })`, `armKeep`).
- The shell cannot import it. `tests/checks/tree/boundaries.test.ts` gives shell no `views/` module (ALLOWED.shell, lines 186-215), and `apps` (needed for `holds`) is not in `SHELL_STORES` (lines 442-471).
- So item 3 ("opens the file as a single click on its row in the Files view opens it") needs one of two things: the rule moved into `state/`, which changes opening.ts and its importers, or the allow lists changed. Neither path is in the list.

**Missing from "Guarded entries":**
- G1. Its Code names the `search` route, and its test is `tests/routes/files/search.test.ts`, 'refuses a request without the write token'. The step changes `search-routes.ts`, and the rules file says "A step whose change touches an entry's code runs that entry's test". That test is not in verify item 2.
- G16 (boundaries), given the import problem above.
- G7's Code line names no search code (`guarded.md:26`: commands, hpc, open, lsp servers, linters). So case 14 is a reading, not a G7 test, which the brief already says.

**Missing from the write list:**
- **The terminal.** `xterm`'s `Keyboard.ts:221-227` turns F1 into `ESC O P`, and `CoreBrowserTerminal.ts:1091-1099` sends it to the program and cancels the event. So F1 never reaches the window from a terminal. Ctrl+P off macOS (Keyboard.ts:308-310) is sent as `^P` and cancelled the same way.
  - Cmd+P, Cmd+Shift+P and Cmd+K on macOS produce no key in xterm (Keyboard.ts:353-356) and do bubble.
  - Item 1 ("a terminal") and case 6 therefore need `src/lib/views/sessions/terminal/grid/grid-keys.ts` (33 lines) to keep these keys from the program. That file is not in the list.
- **The client end of the names read.**
  - `palette.ts` is the pure index, and `state/workbench` is full.
  - The rows component in `shell/` may not import `data/helpers/search/**`, because ALLOWED.shell does not name it.
  - The Search view's end of `/api/search` is `state/sources/search/search.svelte.ts` (491 lines). That folder holds 7 items. The likely home is there, wired through `state/client/context.ts`, with `SHELL_STORES` naming the store if it is new. None of these paths is in the list.
- **The cap.** `config/behavior.yml:265-267` holds `search: max_hits: 500, timeout_s: 10`, read through `searchSettings` (`src/lib/data/sources/config`).
  - A cap of 100,000 names hardcoded beside them departs from that pattern. The rules file puts a default in the config file, and a config key is a user-visible shape the brief must name.
  - The brief does not say whether the cap is a key. If it is, `behavior.yml` and the config reader are missing from the list.
- **`config.test.ts`.** "Cases" says it may change, but it is not in the list. The resolveKey test that exists is in `tests/checks/config/config-folder.test.ts:558-569`.

## Cases and checks

- **Inconsistent with the rules file:**
  - **Case 6's quoted first run.** "the first run quotes what Cmd+K does in a terminal" asks the builder to explain a place the step does not list (`grid-keys.ts`, xterm). The rules file says "A builder runs no page", so this is a reading. The reading itself shows that F1 needs a change there.
  - **Case 13 and G2's title.** Case 13 adds rows to `tests/server/files/search.test.ts`. That file holds one `it` ('refuses a root outside the served list before any process starts', lines 26-38), and `guarded.md:12` names it by that title twice (search, and search plan). Making it a table (the rules file: "written as a table where a unit has several outcomes") may change the title, and `guarded.md` is the orchestrator's. The brief should say the title is kept, or that the orchestrator updates G2.
  - **Case 13's "path that climbs out".** It presumes the names request carries a path, but item 4 describes no path parameter. Either the request reuses `under` (and then `scopeRefusal` applies), or that row has no input.
- **The acceptance item on the parameter contradicts the step.** "absent, empty, repeated and an unknown value each give the search route's existing answer for a bad request, and never a names list". A request without the parameter is an ordinary search request, and it must keep answering hits (`handleSearch`, `queryFrom`). Only empty, repeated and unknown values should be bad requests.
- **Wire format left to the builder.** The names request's parameter name and values, and the answer's shape (the names, per-root failures, the cut and its count), are a route parameter and a wire format. The rules file counts both as user-visible shapes the brief names. The brief says only "a request for file names (decision 1)".
- **Cases that check places the step does not change:** case 12 (Open File... in `pane-view.ts`) and case 20 (`browserRoots`). Both are regression checks of code the change routes through. That is acceptable.
- **No case for the Search view.** The Search view's search and replace run through the changed `search.ts`, `query.ts` and `search-routes.ts`, and both go through `runRipgrep`. No case checks that a search and a replace answer as on the unchanged tree.

## The question

Could each one pass without the goal being reached?

**Cases:**
1. Yes alone, since it covers one place. With 3, 4 and 6 it covers the goal.
2. Same as case 1.
3. Yes, if only macOS is looked at. It also does not cover the diff editor, which item 1 names. A row "F1 in a diff editor" is missing.
4. No, for Cmd+Shift+P in both editors.
5. No.
6. Yes, on macOS for Cmd+P and Cmd+Shift+P, while F1 and off-mac Ctrl+P still go to the program, because the case names no platform and no `grid-keys.ts` change. This is the hole.
7. Not a goal check, since it covers the empty list.
8. Yes, it can pass without the name-first weight. `rg --files projects/manuscripts/raw-pls` lists 206 files, and some names match `rpls` (`raw_pls.py`, `rawpls.png`), so ranking is exercised only if those rows are compared with folder-only matches such as `reviews/domain.md`. The case should name the two files compared. It also covers one root only.
9. Yes. It passes for a text file while a PDF, an image or an HTML file opens in the wrong view, because no row has a non-text kind.
10. No.
11. No.
12. Yes. It does not cover Cmd+K inside the editor and the terminal, or the Search view (see above).
13 to 18. These are safety and bound checks, not goal checks. They cannot by themselves show the goal.
19. No. It is the case that proves "across the served roots".
20. No.
21. No.

**The step line's own check:** it has none. The brief's "What it must do" puts cases 1 to 12 and 21 on the landing look. That look passes without the goal under the gaps of cases 6 and 9.

**Items:**
1. Yes, for the reason in case 6.
2. No for F1. Monaco's right-click menu (`contextmenu: true`, `Editor.svelte:222`, `DiffEditor.svelte:203`) keeps "Command Palette" (`contextMenuOpts group z_commands`, `standaloneCommandsQuickAccess.js:66-69`), which still opens Monaco's own palette.
3. Yes:
   - The open rule is wrong, as above.
   - Hidden files are dropped. With ripgrep's default rule from the hub root, `rg --files ... | grep -c "/\.scratch/\|/\.agents/\|/\.oculus/"` prints 0. With `--hidden` (excluding `secrets` and worktrees) it prints 1708. So Cmd+P cannot find the plan ledgers, `.agents/plan.yaml` or any `.oculus/project.yml`. The brief chose ripgrep's hidden rule without naming that cost.
4. No.
5. No.
6. No.
7. No.

## Implied inputs

Each with its expected result. Starred ones have happened, or a wrong answer costs something, and none is in "Cases".

- **Modifiers off macOS and on macOS.***
  - Linux/Windows: Ctrl+P, Ctrl+Shift+P and F1, including in a terminal. Expected: as on macOS, the keys kept from the program.
  - macOS Ctrl+P. Expected: not Cmd+P, so it stays Monaco's cursor up (`coreCommands.js:581`), readline's previous line in a terminal, and the field's line up. The shell should read the modifier mac-aware as `appKey` does (`keys.ts:235-237`), not with Cmd+K's `metaKey || ctrlKey` (`workbench-keys.svelte.ts:127`).
- **A float in a window of its own.*** Expected: the keys work there (`Workbench.svelte:362-364` mounts the palette for it), the file opens in the float's pane, and the empty-query rows come from that window's tabs.
- **The key sheet open.** Expected: as for Cmd+K, which does nothing (`workbench-keys.svelte.ts:126`). Not stated.
- **A confirm dialog shown, or the update tray open.** Expected: as for Cmd+K, which opens the palette and closes the tray (`Workbench.svelte:275-281`). Not stated.
- **A file that is not text*** (PDF, image, HTML, or a file in an apps folder). Expected: it opens in the view the Files view uses.
- **A file over 2 MB.*** Expected: listed. `query.ts` passes `--max-filesize 2M` to searches. If the names reuse those arguments, the 128 files over 2 MB that `rg --files` lists in the hub disappear.
- **Dotfiles and hidden folders.*** As above, 1,708 names. The expected result has to be decided.
- **The hub's `secrets` folder and `~/.oculus`.*** `rg --files ... | grep -c "^\./secrets/"` prints 4; I ran a count only, nothing was printed or opened. `private-folders.ts` defines both as private. Expected: decided in the brief, either left out of the names or listed as the Files view lists them.
- **A root nested inside another.*** The engine root (`tools/oculus/config`, 81 names) lies inside the hub, so its files come back under both keys. Expected: decided.
- **A slow mount, or several.*** `runSearch` runs roots one after another (`search.ts:463-485`), so k slow roots hold the answer up to k x 10 s. Expected: what the palette shows meanwhile.
- **A large list.** Matching up to 100,000 rows on every keystroke through `fuzzyMatches`, which keeps every match and prepares nothing (`fuzzy.ts:19-41`). Typing latency is not verified. Expected: a stated bound.
- **Names with spaces or non-ASCII letters.*** The hub has 138 names with spaces and 7 non-ASCII. Expected: listed and opened.
- **Duplicate names within one root.** 675 base names repeat (README.md 145 times). Expected: rows told apart by folder, which item 3 covers.
- **A root whose `.gitignore` hides most files.** Expected: those files are not listed (case 18 covers this).
- **A root that is a symlink, and a link inside a root that leads out.** Expected: the root is listed through its real path, and a link that leads out is not offered, or is refused on open as the source route refuses it.
- **Preview or kept tab.** A single click gives a preview tab. VS Code's quick open opens a kept tab by default (`workbench.editor.enablePreviewFromQuickOpen`; not verified here). Expected: decided.
- **Where the keyboard lands.** "the keyboard in it" (case 9): `landOn` gives it to the tab head (`palette-open.ts:74-81`), while VS Code puts it in the editor. Expected: decided.
- **"most recent first" across panes.*** Recency is kept per pane only (`layout/model.ts:48-58`, `pane.recent`). Which tabs count is also open: source, File view, Document, Markdown preview, diff. Expected: stated.

## ADRs

`find . -name adr -type d -not -path '*/node_modules/*'` from the hub root prints nothing (exit 0). `.agents/plan.yaml` (22 lines) names no ADR folder. None.

## Dictated text

The brief dictates no product text: the placeholder, the key sheet rows, the HELP rows and the window.md sentences are all described, not worded. Report wording found with `grep -n '"' D46.md`:
- Line 196, "Everything in the brief is done": holds (the rules file's own wording).
- Line 200, "no glossary": holds (`ls tools/oculus/docs` shows no glossary.md).
- Line 202, "still true" / "rewritten": holds (the rules file's wording).

## Declined to judge

- Whether Monaco's keybinding service stops propagation for a key it handles, which matters for macOS Ctrl+P in the editor. Not verified: it would need reading Monaco's keybinding dispatch, and the brief's mac-aware fix makes it moot.
- Whether Chrome and Electron let the page prevent F1 (help, off macOS) and Cmd+P (print). It needs a page, which I may not open.
- The roots added by the saved workspaces file. It lives under `~/.oculus`, which I may not open.
- An overlap of D46's paths with D41's and D57's briefs. My task did not ask for it, and the `spec` skill compares the paths itself.
- Whether hidden files should be listed. That is a design choice for the orchestrator or Axel, and I give only its measured cost.

Usage: Ordo brief-check agent; this session does not expose its agent id. About 62 tool calls, all read-only.
