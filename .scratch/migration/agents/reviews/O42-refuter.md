# O42 refuter report

## Verification lines

All runs were made in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O42/tools/oculus`, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

`npm run diagrams && npm run test:quick -- --base 3587a477a` (exit 0):
```
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.8 s)
ok      eslint (2.1 s)
ok      svelte-check (8.0 s): 1792332995190 COMPLETED 515 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (41.0 s): Duration  34.51s (transform 68.84s, setup 0ms, import 93.38s, tests 30.60s, environment 1.86s)
test:quick: 44.0 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
EXIT 0
```

The other commands I ran:
- **Guarded tests.** `npx vitest run <the 60 test files named on the Test lines of G8, G59, G69, G77, G107, G108, G109, G110> tests/state/client/terminal/terminal-close.test.ts tests/state/system/apps/app-keys.test.ts --reporter=dot` gave `Test Files  61 passed (61)` and `Tests  769 passed (769)`. This matches the report.
- **Boundaries.** `npx vitest run tests/checks/tree/boundaries.test.ts --testTimeout 0 --hookTimeout 0` gave `Test Files  1 passed (1)` and `Tests  11 passed (11)`.
- **G108 tests.** `npx vitest run tests/server/desktop/menu-template.test.ts tests/shell/window/menu-answer.test.ts` gave `Test Files  2 passed (2)` and `Tests  119 passed (119)`. This matches the report.
- **G109 and G110 tests.** `npx vitest run tests/state/sources/folder-settings.test.ts tests/state/sources/settings-readers.test.ts tests/server/edit/literature.test.ts --reporter=verbose` gave `Tests  29 passed (29)`. The watch row took 175ms.
- **Keys, size and duplication checks.** `npx vitest run tests/checks/source/keys.test.ts tests/checks/tree/size.test.ts tests/checks/tree/duplication.test.ts --testTimeout 0 --hookTimeout 0` gave `Tests  37 passed (37)`.
- **Folder check.** `sh utils/folder-check.sh` exited 0.
- **Window guard.** `npx vitest run tests/server/desktop/window-guard.test.ts` gave `Tests  11 passed (11)`.
- **Unused exports.** `sh utils/unused-exports.sh`, compared by `diff` with `O42-base/unused-exports.txt`: the diff prints nothing (exit 0).
- **ASCII.** `LC_ALL=C grep -n '[^ -~]'` over every changed and untracked file except the `.svg` files prints nothing.
- **Case 14, worktree.** `node --input-type=module -e` with `repoOrigins([{key:'plain',settings:null},{key:'gone'}], ...)` printed `[{"kind":"none","root":"plain","lead":"","label":"plain","tail":" has no .oculus/settings.yml, or one that does not read as text"},{"kind":"none","root":"gone",...}]`. This reproduces the report.
- **Case 14, base copy.** The same command with the base signature and a 404 answer printed `[]`. This reproduces the report.
- **Case 8, base copy.** `npx vitest run tests/state/system/apps/app-keys.test.ts` gave `Tests  71 passed (71)`.
- **Base copy integrity.** `git show 3587a477a:tools/oculus/tests/server/edit/literature.test.ts | cmp - <base copy file>` prints nothing, so the base copy was restored. The new test files are absent from the base copy.
- **Worktree unchanged by the review.** `git diff 3587a477a --stat` gives the same `57 files changed, 1176 insertions(+), 851 deletions(-)` before and after my runs.

## Verdicts, "What to build"

- **Part 0, the guarded entries: holds.** G108, G109 and G110 follow G107 in `agents/guarded.md`, with Code and Test lines naming the step's code and tests. G59's Code line names `settingsOf`.
- **Part 1, the app's menu: holds.** The menus, their order, the command list, the bridge, Open in Browser, Open Recent, the keys and `ACCELERATORS` are as the brief states. The Terminal functions sit on the terminals store; the boundary row allows `state/sessions/terminals` and nothing under `state/sessions/terminal/` (`tests/checks/tree/boundaries.test.ts`, the shell row), so the builder's reason holds. The proof is short (P1), the report states a wrong before and after (B1), and two DRY points remain (S1, S2).
- **Part 2, the repository header: violated, finding B2.** The branch is drawn in capitals, not as the row draws it.
- **Part 3, the settings text in the folder list: holds.** `workspacesAnswer` carries `settings`. The three readers take it with no request. `heard` marks the root's own file. A mark while a read is out cancels the read and reads again: `markOne` in `src/lib/state/client/queries/queries.svelte.ts:274-283` under `'replace'`. Findings B3, S6 and S7 apply.
- **Part 4, the rice empty state: holds by reading; the look is owed.** `.empty:not(.error)` is `display: block`, the message is an inline span after the `::before` mark, and `.action` is a block.
- **Part 5, the citation key: holds.** `ET_AL`, the widened `INITIALS` and `isName` are in place, and the 24 rows of `literature.test.ts` pass.

## Verdicts, "Cases"

1. **Met.** Template order, command ids and no Check for Updates: `menu-template.test.ts:128`.
2. **Met.** The keys are read back through `resolveKey` and `paletteKeyOf`, and each is checked to be in `menuKeys()`: `menu-template.test.ts:214-261`.
3. **Met.** `menu-template.test.ts:276`.
4. **Partial, finding P1.** The table stubs `MenuPage`, not the stores, so `menuPage`'s colon path is untested.
5. **Met** at unit level: `menu-answer.test.ts:169-193`.
6. **Met** for `openInBrowser` and `commandWindow`. `windows.reader()`'s audience detection is Electron-bound and is not unit-tested.
7. **Met.** `menu-template.test.ts:298-317`.
8. **Met.** 71 rows pass, on the base and on the worktree.
9. **Not verifiable here; look on landing.** Finding B2 already shows a defect by reading.
10. **Met.** `folder-settings.test.ts:41`; the failure quoted from the base copy is an assertion.
11. **Met.** `folder-settings.test.ts:156`; the base failure is a timeout, and the probe edit came after that run.
12. **Met.** `settings-readers.test.ts:110`.
13. **Met.** `settings-readers.test.ts:121`.
14. **Met.** The run is reproduced above.
15. **Met.** The `save-key.client.test.ts` row passes in the guarded run. The base run is impossible because of the linked `node_modules`, as the report says.
16. **Met.** All forms are rows, and the kept forms pass on the base by the report's quote. I did not rerun that quote on the base, since that would need writing into the base copy.
17. **Not verifiable here; look on landing**: an empty view with an action under the rice theme, in a narrow and a wide pane.
18. **Not verifiable here; look in the app.**
19. **Not verifiable here; look in the app.**

## Spec

**S1. The key sheet's `?` is still written as a literal beside `SHEET_CHARACTER`.**
- Place: `src/lib/shell/keys/workbench-keys.svelte.ts:151`, `event.key === '?'`, in the branch of `keys()` that closes the sheet. The file is changed by the step.
- What is wrong: Part 1 says the page's keys become tables "so no key is written twice". `page-keys.ts:77` defines `SHEET_CHARACTER = '?'`, and `resolve.ts:340` reads it.
- Failure scenario: `SHEET_CHARACTER` is changed. Then the sheet opens on the new key and closes only on `?`.

**S2. The open-workspace effect of `:workspace` is written a second time.**
- Place: `src/lib/shell/window/menu-answer.ts:206-209`:
  ```
  workspaceCommand((value) => client.fs.selectWorkspace(value, { said: true }), path)
  ```
  The same effect is in `src/lib/shell/keys/rows/WorkspaceRows.svelte:79`, `workspaceCommand(saying(selectWorkspace), choice.path)`.
- What is wrong: the brief asks that Open Recent open the workspace "as `:workspace` does" and that no effect be written twice. The other colon effects moved to `shell/commands/colon-effects.ts`; this one did not.
- Failure scenario: the pick's effect changes in `WorkspaceRows.svelte`, for example how the `said` option is passed. Then Open Recent and `:workspace` diverge.

**S3. A defect the builder found is left unfixed in a file the step changes.**
- Place: `src/lib/shell/Workbench.svelte:244-247`:
  ```
  appKey: (event, textual, editor) => ... tab: activeMain, status: client.editorStatus.statusOf(activeMain?.id ?? ''),
  ```
  The step changed the line beside it, `:241 ...sourceKeys(client, pageTab)`.
- What is wrong: judgment call 17 names the defect: an app keybinding's `when` reads the main area's tab in a popped-out window. It is left as "outside the brief". The fix is the same one-line change the step made at :241.
- Failure scenario: an app binds a key `when: resourceExtname == .md`. In a popped-out window showing a `.md` tab while the main area shows a `.py` tab, the binding does not fire. This is for the orchestrator: fix at landing, or book it into the step that owns G77.

## Proof

**P1. G108's answer table stops before the logic it is meant to prove.**
- Place: `tests/shell/window/menu-answer.test.ts:22-111` (`recorder`, `ROWS`, `'runs %s once'`).
- What is wrong: each row asserts only which `MenuPage` method `RUNS` calls, for example `['switch-workspace', undefined, ['colon', 'workspace']]`. What `colon()` then does is never run in any test. That logic is in `menuPage` (`src/lib/shell/window/menu-answer.ts:158-184`):
  - finding the command with `commands(...)`;
  - the unavailable path that posts `pressRefusal ?? noteOf` as a notice;
  - `opensAsMode(name) || command.hint !== ''`, which opens the palette typed with `:<name> `;
  - the effects of `folder`, `folder-add`, `workspace-close`, `crt`, `update` and the docks.
- Case 4 asks for "each command name of the list runs its command once against stubbed stores". The float table (`:132-193`) reaches the real `menuPage` only for Save, Revert, Settings, Help and Close Tab.
- The tests would still pass with the colon behaviour taken out of `menuPage.colon`. The G108 text is "Each command of the app's menu runs its page command once".
- Failure scenario: `cmd_workspace_hint` is emptied, or `opensAsMode` stops listing `workspace`. Then Switch Workspace... runs nothing from the menu, and every G108 row still passes. Accent Colour..., whose notice is the stated behaviour of judgment calls 1 and 2, likewise has no row asserting the notice.

## Standards

**S4. A test title refers to the brief's structure.**
- Place: `tests/server/desktop/menu-template.test.ts:128`, `it('holds the menus in their order, each item sending the command Part 1 maps it to', ...)`.
- What is wrong: "Part 1" names a section of the brief. A reader of the test cannot resolve it. `agents/spec.md:44` bans step references in test titles.
- Failure scenario: none at run time. The title is meaningless once the brief is archived.

**S5. Edited comments break the 100-column rule.**
- Rule: `agents/spec.md:45`.
- Places, each line added by the step: `desktop-keys.ts:41` (102), `fs.ts:107` (101), `source-options.ts:3` (101), `menu-template.ts:96` (101), `menu-commands.ts:86` (101), `tests/server/desktop/menu-template.test.ts:10` (102), `tests/state/sources/folder-settings.test.ts:106` (101). Found with `awk 'length > 100'` over the changed files.
- `resolve.ts:257-261` appends a sentence on its own short line, "// The letter is the typed one, read from the table's press with its Shift.", below a paragraph whose last line ends short. The paragraph was not rewrapped.

**S6. Server tests are placed in a client-state folder.**
- Place: `tests/state/sources/folder-settings.test.ts`, whose head reads "Layer 2, server and client-state tests". It tests `workspacesAnswer` in `lib/server/files/fs.ts` and `watchGit` in `lib/server/root/watch/git.ts`.
- What is wrong: `agents/spec.md:48` says "a new file goes where its concern already lives", and a full folder is split. `tests/server/files` and `tests/server/root` each hold 10 items (`ls -A | wc -l`). Judgment call 4 places the test elsewhere to avoid the split.
- Failure scenario: someone looking for `workspacesAnswer`'s tests under `tests/server/files` finds none.

**S7. The terminals store reaches 880 lines with doc comments cut short.**
- Place: `src/lib/state/sessions/terminals.svelte.ts:364-370` (876 lines at the base, 880 now). `showTerminal`'s comment is now `/** Show a terminal by showIn's rule; its grid takes the keyboard unless preserveFocus. */`.
- What is wrong: the base comment's sentence "An id that is not a terminal's shows nothing." is gone from both `showTerminal` and the moved `showIn` (`terminal-lists.ts:1700-1704` of the diff). The guard `!isTerminalId(id)` is still in `showTerminal`. `agents/spec.md:47` says comments are not shortened to stay under the limit.
- Failure scenario: a reader of `showIn` and `showTerminal` learns nothing of the refusal of an id that is no terminal's.

**S8. The terminal kinds and their words now live in a key-commands module.**
- Place: `src/lib/data/helpers/keys/oculus/menu-commands.ts:8-19` (`TERMINAL_PROFILES`, `profileWords`), imported by the view `src/lib/views/sessions/terminal/start/Composer.svelte:73` and by `terminal-list.ts`.
- What is wrong: a terminal kind's words are no key and no menu command. The Composer now depends on the menu's command module for its own labels. Low cohesion; `agents/spec.md:87`.
- Failure scenario: a new kind for the Composer must be added in the menu command list.

**S9. The new public field and the menu's routing are recorded nowhere in DESIGN.md.**
- Rule: `agents/spec.md:70`, "a decision with its reason into DESIGN.md".
- What is wrong: the folders of `GET /api/fs` now carry `settings` (a wire field). DESIGN.md's sentences on what the folders of the workspaces answer carry (`DESIGN.md:616` for `real`, `:750` for `hub` and `folds`) do not name it. Neither the decision of ruling 138 (b) nor the menu's routing to the reader's window has a DESIGN.md line. The only DESIGN.md change is the Keybindings sentence (:530).
- Failure scenario: a later change to `workspacesShape` has no design statement to be measured against.

**S10. The HELP.md bullet is one long paragraph.**
- Place: `HELP.md:18`, one bullet of seven sentences.
- Rule: `agents/spec.md:70` says HELP.md takes "short bullets".

**S11. The report's history-word grep does not use the spec's list.**
- Place: the report's row "History words": "grep of every added line for was, previously, formerly, used to, no longer, earlier, old, replaced, moved, fix, bug, revert, now: 11 hits".
- What is wrong: `agents/spec.md:44` lists 'before', 'still', 'always has been', 'always had', 'as before', 'the step adds' and 'after this package lands', and asks that each hit be quoted and judged. The report leaves those words out and quotes three examples.
- My grep for those words over the added comment lines and test titles: 'before' at `literature-key.ts` "before them" and "before a suffix", `Repo.svelte` "read before whatever failed", `folder-settings.test.ts` "come before the probe's"; 'still' at `Repo.svelte` "drawn still" and `folder-settings.test.ts` "may still hear". Each one describes the code, none is history.

## Behaviour

**B1. The report states a before and after for popped-out windows that the host never produces.**
- Place: the report's "Host- and user-visible changes": "A popped-out window: Save, Revert File and Close Tab act on its float's tab; Settings and Help open into its float. Before, Settings and Help went only to the main window".
- The host's code sends Settings and Help only to the last main window:
  ```
  src/desktop/windows/menu-template.ts:56  const MAIN_ONLY: readonly MenuCommand[] = ['settings', 'help'];
  src/desktop/windows/menu-template.ts:70      if (MAIN_ONLY.includes(name)) return lastMain;
  ```
- What is wrong: no float window ever receives `settings` or `help`, so they still open in the main window, as the brief asks ("Settings and Help go to the last main window, as today"). The test row `'opens Settings and Help into its float'` (`menu-answer.test.ts:179`) asserts a path the product never takes.
- Failure scenario: the look reads the report, presses oculus > Settings... in a popped-out window, sees Settings open in the main window, and records a false failure. A reader of the report believes the behaviour changed.

**B2. The header draws the branch in capitals.**
- Place: `src/lib/views/sources/repositories/repo/Repo.svelte:255-264`:
  ```
  <span data-repo-branch>{branchOf(git)}</span>
  ...
  <TreeItem label={name} glyph="repositories" heading detail={git.detached || git.branch !== '' ? branchWords : undefined} />
  ```
- `src/lib/ui/tree/TreeItem.svelte:526-529` has `.heading .main { font-weight: 700; text-transform: uppercase; }`. The `detail` span is rendered by `line()` (`TreeItem.svelte:162-164`), which is drawn inside `<span class="main text">`.
- What is wrong: Part 2 asks for "the branch as the row draws it (a detached HEAD as the row draws it)". The row draws it in its own case. Judgment call 9 reports only that the name is in capitals.
- Failure scenario:
  - The branch `fix/menu-Keys` shows as `FIX/MENU-KEYS`.
  - A detached HEAD `a1b2c3d4` shows as `A1B2C3D4`.
  - The detached sentence is drawn in capitals.
  - Git branch names are case-sensitive, so the header names a branch that may not exist.

**B3. The Settings sentence is wrong for a settings file over the read limit.**
- Place: `src/lib/state/system/config/editors/origins.ts` (`originsOf`, `text === null`), the catalog word `config/text/views/system/workbench.yml:211`, `settings_origin_none: '{0} has no {1}, or one that does not read as text'`. `settings_origin_cut` is removed.
- What is wrong: `settingsText` (`src/lib/server/files/fs.ts`) answers null for a file over `TEXT_LIMIT` (2 MB, `src/lib/data/file-ops.ts:34`), so the row then says the folder has no settings file or one that does not read as text. Before, it said "longer than the file window reads". Judgment call 8 states this change; decision 8 of the brief names only "a missing file and one that does not read as text".
- Failure scenario: a folder with a 3 MB valid `.oculus/settings.yml` is told its file is missing or not text.

**B4. A popped-out window's debug keys now read the float's tab; the report does not say so.**
- Place: `src/lib/shell/Workbench.svelte:241`, `...sourceKeys(client, pageTab)`. This hands both `saveSource` and `breakpointFileOnScreen` the float's tab.
- What is wrong: judgment call 10 states only the Cmd+S change. `breakpointFileOnScreen` decides `breakpointFocus` (`workbench-keys.svelte.ts:189`), which decides whether F5, F9, F10 and F11 are swallowed. In a popped-out window it now reads the float's file, where before it read the main area's.
- Before and after for the look: a popped-out window whose editor shows a file the debugger takes, while the main area shows one it does not. Before, F9 in the float's editor was not swallowed. Now it is.

**B5. Cmd+S in a popped-out window now saves the float's tab (judgment call 10).**
- I judge this correct and needed. With the macOS menu showing Cmd+S on Save, the key and the item must save the same tab, and the menu's Save uses `deps.tab`, the page's tab.
- The report gives the before and after; G107's test passes. No finding beyond B4.

**B6. The new title-case `desktop.menu` words (judgment call 6).**
- Each differs from an existing word only in case or form: `close_tab` 'Close Tab' and `ui.close_tab` 'Close tab'; `crt` 'CRT Overlay' and 'CRT overlay'; `update_tasks` 'Update Tasks' and 'Update tasks'; `save_all` 'Save All' and 'save all'. I found them with `grep -rni -F ": <value>" config/text`.
- They follow the brief's letter ("where one exists word for word"). Whether the menu's title case is worth a second stored word is the user's call; see "Declined to judge".

**B7. Possible behaviour while an undocked DevTools window has the focus, by reading; not verified.**
- `windows.reader()` (`src/desktop/windows/windows.ts:493-500`) answers `entry: null` for a focused window that is no entry. `commandWindow` then sends the command to `lastMain`.
- On macOS, Cmd+S or Cmd+W pressed in the undocked DevTools window, if DevTools leaves the key to the menu, would save or close a tab in the last main window. Before the step no menu item held Cmd+S or Cmd+W.
- Only the app can show whether DevTools takes the key first.

## Declined to judge

- **First runs on the base copy of the new test files.** These are cases 1 to 7 and 10 to 13, plus the base run of the new `literature.test.ts` rows (case 16). Rerunning them needs copying the tests into the base copy, which is a write this review may not make. I read the failures quoted in the report, and the tests' imports and inputs are consistent with them. Would settle it: the orchestrator's own run in a scratch copy of the base.
- **The case 15 run in the worktree before `Source.svelte` changed** cannot be rerun; that tree state no longer exists.
- **Cases 9, 17, 18 and 19, and the menu as Electron draws it.** These are the looks the brief names:
  - the menu bar and its items;
  - the repository header (B2 is a defect already);
  - rice Empty in a narrow and a wide pane;
  - Monaco's Cmd+F, the terminal's Ctrl+- and Ctrl+Tab with a text field focused;
  - one run per press of Save, Close Tab and Next Tab on macOS;
  - whether Electron on macOS gives the page the key before the menu. This decides whether any press runs twice. `keys()` calls `preventDefault` whenever `perform` acts (`workbench-keys.svelte.ts:197`).
- **`?` as an Electron accelerator off macOS** (judgment call 7). It needs a run on Linux or Windows.
- **Ctrl+Tab as a macOS menu key equivalent.** Whether macOS lets a menu take Ctrl+Tab is shown only by the app.
- **New Terminal and Split Terminal from the menu.** This covers `startOnPage` with a float id as the page, and `splitShown`. They have no unit test and no guarded entry; it is a look in the app, in a main window and in a popped-out window.
- **Judgment call 13**: Open Recent lists the open workspace too; VS Code leaves the current one out. **Judgment call 6**: the case variants of the menu words. **Every folder with no `.oculus/settings.yml` now gets a line under the `editor.languages` row**; this is by the brief's Part 3 and case 14. These three are the user's call.
- **A fact only another git command would give**: none needed.

Usage: a1771f58c31fcccbc, claude-opus-5-5, 350,419 tokens, 85 tool uses, 16.7 min

## Repair round 1, refuted

## Verification lines

All runs were made in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O42/tools/oculus`, in the foreground, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

`npm run diagrams && npm run test:quick -- --base 3587a477a` (exit 0):
```
test:quick: 85 changed file(s), from git since 3587a477a
test:quick: 212 test file(s), 9 essential
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.5 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (1.7 s)
ok      svelte-check (6.4 s): 1792348406170 COMPLETED 515 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (52.1 s): Duration  46.27s (transform 60.62s, setup 0ms, import 93.39s, tests 78.86s, environment 2.31s)
test:quick: 54.4 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
```
The diagrams run left the same twelve `docs/diagrams/` paths modified that `git status --short` listed before it.

The other commands:
- **Guarded tests.** `npx vitest run <the 62 files on the Test lines of G8, G59, G69, G77, G107, G108, G109, G110 in the worktree's guarded.md> tests/server/files/workspace/workspaces.test.ts tests/server/root/process/first-run.test.ts --reporter=dot` (exit 0): `Test Files  63 passed (63)`, `Tests  808 passed (808)`. The moved `workspace/workspaces.test.ts` is already on a Test line, so 63 files is the 62 plus `first-run.test.ts`. This matches the report.
- **Tree checks.** `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/source/keys.test.ts tests/checks/tree/duplication.test.ts --testTimeout 0 --hookTimeout 0` (exit 0): `Test Files  4 passed (4)`, `Tests  48 passed (48)`.
- **Unused exports.** `sh utils/unused-exports.sh` (exit 0), then `diff` against `O42-base/unused-exports.txt`: no output, exit 0.
- **Folder check.** `sh utils/folder-check.sh`: no output, exit 0.
- **ASCII.** `LC_ALL=C grep -n '[^ -~]'` over the 77 changed or untracked files, `.svg` files and deleted paths left out and the ledger files included: no output, exit 1.

The report's own evidence, rerun in the same form:
- `grep -n "SHEET_CHARACTER" src/lib/shell/keys/workbench-keys.svelte.ts` prints `32:import { SHEET_CHARACTER } ...` and `152:            event.key === SHEET_CHARACTER`. Reproduced.
- `grep -n "Part 1" tests/server/desktop/menu-template.test.ts` prints nothing (exit 1). Reproduced.
- `wc -l src/lib/state/sessions/terminals.svelte.ts` prints `879`. Reproduced.
- `grep -rn "files/workspaces\.test\|root/first-run\.test" src tests docs config utils *.md` prints nothing. Reproduced.
- `npx vitest run tests/state/system/apps/shell.test.ts tests/server/desktop/menu-template.test.ts tests/shell/window/menu-answer.test.ts tests/state/sources/settings-readers.test.ts tests/state/sources/folder-settings.test.ts tests/server/files/workspace tests/server/root/watch tests/server/root/process/first-run.test.ts --reporter verbose` (exit 0): `Test Files  9 passed (9)`, `Tests  203 passed (203)`. Every row the report quotes as passed is passed: the three `commandWindow` rows, the float row of `shell.test.ts`, the 17 colon rows with the row-count row, the Open Recent row, the three refusal rows and "name each reason a folder's settings text is null". Reproduced.
- History words. My grep for the full list of `agents/spec.md:44` over every added line under `src`, `tests` and `config` of `git diff 3587a477a`, and over the untracked source and test files whole, gives the same five hits the report judges (two in `literature-key.ts`, two in `Repo.svelte`, one in `settings-watch.test.ts`). It also hits a variable `before` in the moved `workspaces.test.ts`, which is base code. Reproduced.
- Added lines over 100 columns. `awk` over the added lines of `git diff 3587a477a -- tools/oculus/src tools/oculus/tests tools/oculus/config`, and over the untracked source and test files:
  - In added lines, only the catalog line at `config/text/views/system/workbench.yml:211` (121 columns), whose words ruling 15 dictates.
  - In the untracked files, only lines of the moved `workspaces.test.ts` (67, 87, 115, 208, 258), which `diff` against `git show 3587a477a:tools/oculus/tests/server/files/workspaces.test.ts` shows are unchanged base lines. Only four import lines (20 to 23) differ.
  - Reproduced.
- `test:quick` over its limit. The report quotes 56.9 s. My run took 54.4 s and printed the same `over the time limit` line, with every command passing and exit 0. Reproduced in kind.

## Closure, per ruling

1. **S1: done as ruled.** `workbench-keys.svelte.ts:152` reads `SHEET_CHARACTER`.
2. **S2: done as ruled.**
   - `openWorkspace` in `colonEffects` (`src/lib/shell/commands/colon-effects.ts:57-58`) is the one place that passes `{ said: true }` to `selectWorkspace`.
   - `WorkspaceRows.svelte:82` and `menu-answer.ts:203` call it.
   - It matches the removed `saying(selectWorkspace)` (`WorkspaceRows.svelte:48-51`).
3. **S3: done as ruled.**
   - `appKey` is now an answer of `sourceKeys` (`src/lib/shell/window/source-keys.ts`). It reads the tab `active()` gives.
   - `Workbench.svelte:241` spreads `sourceKeys(client, pageTab)`, and `pageTab` is `pageActiveTab(floatId, floats(), activeMain)` (`:196`).
   - The row in `tests/state/system/apps/shell.test.ts` passes. Its first run on the base is quoted by the builder and was not rerun (Declined).
4. **P1: done as ruled.**
   - By reading, each of the 17 rows of `COLON_ROWS` (`menu-answer.test.ts:245-262`) expects exactly one recorded call, and only `menuPage`'s `colon` makes that call. So each row fails with the colon behaviour taken out.
   - The row at `:264` ties the list to the `colon` rows of `ROWS`.
   - The accent row asserts the notice `'Unavailable'`. See finding RB2 on those words.
5. **S4: done as ruled.** The title is now 'holds the menus and the items of each menu in their order' (`menu-template.test.ts:129`).
6. **S5: done as ruled.** No added line of code or tests is over 100 columns. `resolve.ts:256-261` is one paragraph.
7. **S6: partial, finding RS1.**
   - Done:
     - The server rows moved to `tests/server/files/workspace/folder-settings.test.ts` and `tests/server/root/watch/settings-watch.test.ts`.
     - `tests/server/files` and `tests/server/root` each hold ten items (`ls -A`).
     - The moved files differ from the base only in their import depth.
     - The Test lines of G109, G8, G31 and G73 are updated.
   - Not done: the Test line the report says G59 "gains" was written under G107 (`guarded.md:301`), and G59's Test line (`:148`) is unchanged.
8. **S7: done as ruled.** "An id that is not a terminal's shows nothing." is in `showTerminal`'s comment (`terminals.svelte.ts:375-379`) and in `showIn`'s (`terminal-lists.ts:163-168`). The room comes from moving `sessionTerminal` out of the store, and the file is 879 lines. See RS2 for the doc text the two now share.
9. **S8: done.**
   - `src/lib/data/model/machine/terminal-kinds.ts` holds the kinds. `menu-commands.ts` and `menu-template.ts` import it directly.
   - `terminal-list.ts` and `Composer.svelte` import through the re-export of `src/lib/state/sessions/terminals.svelte.ts`. The views row of `tests/checks/tree/boundaries.test.ts:258-266` names no `data/model`, so a view cannot import the module directly. The builder's reason holds.
   - See RS3 for a head comment.
10. **S9: done as worded; one claim is false, finding RB1.**
    - DESIGN.md now names `settings` at the Problems sentence and at the hub folders' sentence, and gives the menu's routing in the Windows paragraph (`DESIGN.md:748`).
    - The routing sentence says no command is sent while an undocked DevTools window is focused, which the code does not do (RB1).
    - RS4 covers the missing reason.
11. **S10: done as ruled.** The eleven bullets of `HELP.md:18-28`, compared with the round-1 bullet, lose nothing. The added bullet at `:28` carries the false DevTools claim (RB1).
12. **S11: done as ruled.** My grep reproduces the five hits and their judgments.
13. **B1: done, and a little past the ruling, with no reachable effect.**
    - The row is removed, and the correction is the second paragraph of "Repair round 1".
    - Beyond the ruling, `menuPage.openView` became `client.layout.openView(view)`, without the float (`menu-answer.ts:187`). Its only callers are `settings` and `help` (`RUNS`, `:64` and `:110`).
    - The host sends those two only to `lastMain`: `MAIN_ONLY` in `commandWindow`, and `lastMain` keeps only entries whose `kind` is `'main'` (`windows.ts:471-477`).
    - `open-view` goes through `colon('tab')` to the palette, which keeps its own float behaviour. So no path sends Settings, Help or another `openView` command to a float page.
14. **B2: done as ruled.**
    - `.branch { text-transform: none; }` sits on the snippet's span (`Repo.svelte:255` and the rule near `:416`).
    - An `awk` over every `<TreeItem` tag in `src/lib` finds `heading` only in `TreeSection.svelte`, `Repo.svelte`, `WorkspaceHeader.svelte` and `Notes.svelte`. Only `Repo.svelte` carries a `detail`, so no file needed listing.
15. **B3: done as ruled.** The catalog line is the ruling's words verbatim (`workbench.yml:211`), and the row at `settings-readers.test.ts:122` reads it. RB3 notes a reason the sentence does not cover.
16. **B4: done as ruled.** The before and after is the second bullet of "Before and after, for the look".
17. **B7: claimed, and by reading not reproduced for the DevTools case, finding RB1.**
    - `reader()` answers `'other'` only for a focused `BrowserWindow` that is not in the list, which is the audience window.
    - An undocked DevTools window is no `BrowserWindow`. Electron's `getFocusedWindow` answers the inspected window while its DevTools is focused.
    - The command therefore goes to that entry.
    - The no-focus case (`'none'`, to the last main window) is as ruled.

## Verdicts, "What to build" (the whole diff since 3587a477a)

- **Part 0, the guarded entries: holds.**
  - G108, G109 and G110 follow G107 with Code and Test lines.
  - Two problems sit beside them: RS1 (G59's Test line written under G107) and RS5 (the approved wording of G108 changed).
- **Part 1, the app's menu: violated, finding RB1.**
  - Holds:
    - the menus, the command list, the bridge, the keys and `ACCELERATORS`;
    - Open in Browser, where an audience window or no focus gives the last main window's origin (`app.ts:223-224`);
    - Open Recent;
    - the shared colon effects;
    - Close Window, whose `closeFocused` still asks `audience.closeFocused()` first (`windows.ts:511-513`).
  - Violated: the sentences the round added in `HELP.md:28`, `DESIGN.md:748`, the head comment of `menu-template.ts:26-30`, the doc of `Focused` (`menu-template.ts:60-62`) and `windows.ts:101-103` state a behaviour for an undocked DevTools window that the code does not have.
- **Part 2, the repository header: holds by reading (B2 is closed); the look is owed.**
- **Part 3, the settings text in the folder list: holds.** RB3 notes a reason the null sentence leaves out.
- **Part 4, the rice empty state: holds by reading; the look is owed.** The round did not change it.
- **Part 5, the citation key: holds.** The rows of `literature.test.ts` pass in the guarded run.

## Verdicts, "Cases"

1. **Met.** `menu-template.test.ts:129`.
2. **Met.** `menu-template.test.ts:215` and `:248`.
3. **Met.** `menu-template.test.ts:277`.
4. **Met.** P1 is closed. The command rows are at `menu-answer.test.ts:114`, the colon rows over the real `menuPage` and `commands(...)` at `:269`, `:287` and `:296`, and the overlay rows at `:132`.
5. **Met** at unit level. `menu-answer.test.ts:174` and `:184`.
6. **Met** for `openInBrowser` (`menu-template.test.ts:343`). By reading, `app.ts:223-224` maps `'other'` to the last main window. A real audience window reaching `'other'` is Electron-bound and was not run.
7. **Met.** `menu-template.test.ts:299`.
8. **Met.** `tests/state/system/apps/app-keys.test.ts` passes in the guarded run.
9. **Not verifiable here; look on landing.**
10. **Met.** `tests/server/files/workspace/folder-settings.test.ts:34`.
11. **Met.** `tests/server/root/watch/settings-watch.test.ts:79`.
12. **Met.** `settings-readers.test.ts:111`.
13. **Met.** `settings-readers.test.ts:135`, where the root that is no folder is the clause in the comment above the row.
14. **Met.** `settings-readers.test.ts:122` asserts the sentence for `settings: null`.
15. **Met.** The `save-key.client.test.ts` row passes in the guarded run.
16. **Met.** The rows pass. The base runs are the builder's (Declined).
17. **Not verifiable here; look on landing.**
18. **Not verifiable here; look in the app.**
19. **Not verifiable here; look in the app.**

## Spec

**RS1. G59's Test line was not updated; the line written for it sits under G107.** This is the partial verdict of ruling 7.
- Place: `.scratch/migration/agents/guarded.md:298-301` (G107):
  ```
  - G107. Cmd+S in a source tab saves its file whether or not the editor settings have arrived: ...
    Code: `connectSourceStatus` in `createTabAsks` ...
    Test: `tests/views/sources/source/save-key.client.test.ts`, 'saves the file on Cmd+S before the first config message has arrived'.
    Test: the save rules over the folder's settings text: `tests/state/sources/settings-readers.test.ts`, describe 'the readers of a folder settings file', "take the folder's records from the folder list and ask for nothing" and "give a tab rooted at a folder's repository path that folder's records"; `tests/state/sources/folder-settings.test.ts`, every row.
  ```
  G59's own Test line (`:148`) still names only `tests/data/helpers/files/save-text.test.ts`.
- What is wrong:
  - Ruling 7 asks for G59's Test line to be updated, and the report says "G59 gains a Test line".
  - G59's Code line (`:147`) now names `saveRulesOf` over `settingsOf`, and no G59 Test line names a test of that unit.
  - G107 now names tests of a guarantee that is not its own.
- Failure scenario: a later step changes `saveRulesOf` or `settingsOf` and runs G59's test as `agents/spec.md` requires. Only `save-text.test.ts` runs, and the two `settings-readers.test.ts` rows that read the save rules over the folder's text are not run.

**RS5. The approved wording of G108 was changed in the round.**
- Place: `guarded.md:302`. The approved text ended "and does nothing under an overlay, in an audience window or for a name not in the list" (ruling 148 (a), "approved as written"). It now ends "while a window that is not one of the app's entries is focused (an audience window, an undocked DevTools window) or for a name not in the list".
- What is wrong:
  - The round brief's item 17 asks for `reader()`, `commandWindow` and a test row; it does not ask for a change to the entry's text.
  - The report names the change ("G108's sentence and Code line say the same"), but the wording Axel approved is now different.
  - The added clause is false for DevTools (RB1).
- Failure scenario: a later reviewer judges G108's tests against a sentence that promises no command from an undocked DevTools window. That promise is untested and, by RB1, untrue.

## Proof

None.
- The base red of the S3 row is a `TypeError` for a missing function. That is the honest red for a seam the base tree lacks.
- The colon rows of P1 are sound by reading.
- The `'other'` rows of `commandWindow` test only the routing; the classification behind it is RB1.

## Standards

**RS2. The rule of `showIn` is now written out in full in two comments.**
- Places: `src/lib/state/sessions/terminals.svelte.ts:375-379` and `src/lib/state/sessions/terminal/terminal-lists.ts:163-168`:
  ```
  * Show a terminal by `showIn`'s rule. The tab that owns it is activated, its page switched to
  * when it is another, and shows it in the tab's row. A terminal no tab owns joins the end of ...
  ```
  ```
  * Show a terminal. The tab that owns it is activated, its page switched to when it is another,
  * and shows it in the tab's row. A terminal no tab owns joins the end of the Terminal tab of the ...
  ```
- What is wrong:
  - Ruling 7 asked for the one sentence to come back in both comments. `showTerminal`'s comment now also restates the whole rule it defers to ("by `showIn`'s rule").
  - The guard `if (!isTerminalId(id)) return;` was also added to `showIn`, whose one caller already checks it. That is harmless.
- Failure scenario: `showIn`'s rule changes, for example where an unowned terminal joins. The comment of `showTerminal` then states the old rule.
- Low severity. The orchestrator can accept it as the consequence of "no comment is shortened".

**RS3. `menu-commands.ts`'s head comment says the kinds module imports nothing.**
- Place: `src/lib/data/helpers/keys/oculus/menu-commands.ts:6-7`, "The module imports nothing but those kinds, which import nothing". Against it, `src/lib/data/model/machine/terminal-kinds.ts:9` reads `import type { StartKind } from './model-machine.ts';`, and its own head says "imports nothing but that type".
- Failure scenario: a reader trusting the comment adds a value import to `terminal-kinds.ts` from the model, believing the host stays free of the page's graph. The comment gave the wrong picture of what is already there. Low severity.

**RS4. The DESIGN.md sentences on the routing and the settings field state what was decided and give no reason.**
- Rule: `agents/spec.md:70`, "a decision with its reason into DESIGN.md".
- Place: `DESIGN.md:748`, "A command of the application menu goes to the window the reader is in when that window is one of the app's entries ...".
- What is wrong: the reason (so that Close Tab and Save act where the reader is; Settings and Help in a main window) is in the head comment of `menu-template.ts`, but not in DESIGN.md. The settings sentence likewise gives no reason why the text travels with the folder list (no request of each reader, and no 404 for a root that is a repository path).
- Failure scenario: a later change weighs moving the read back to the readers and finds no stated reason against it. Low severity.

**RS6. The window list imports its focus type from the menu's template module.**
- Place: `src/desktop/windows/windows.ts:31`, `import type { Focused } from './menu-template.ts';`.
- What is wrong: `windows.ts` manages windows and `menu-template.ts` builds a menu. The window manager's public `reader` type now depends on the menu module, the reverse of the use. Low cohesion; the import is type-only.
- Failure scenario: a change to the menu module's types reaches the window manager's interface. Low severity.

## Behaviour

**RB1. An undocked DevTools window reads as the window it inspects, so a menu command is still sent.** This is the violated verdict of Part 1 and the unreproduced closure of ruling 17.
- Place: `src/desktop/windows/windows.ts:494-499`:
  ```
  function reader(): Focused<Entry> {
      const focus = BrowserWindow.getFocusedWindow();
      if (focus === null) return { kind: 'none' };
      const entry = list.find((one) => one.win === focus);
      return entry === undefined ? { kind: 'other' } : { kind: 'entry', entry };
  }
  ```
- What is wrong:
  - Electron's `BrowserWindow.getFocusedWindow` returns a window when `window.isFocused() || window.webContents.isDevToolsFocused()`. An undocked DevTools window is no `BrowserWindow`.
  - Evidence, from reading, not from a run. The framework binary of Electron 44.5.1 in the main checkout's `node_modules/electron/dist`, read with `strings -n 6`, lists the identifiers of its browser-window module in that module's order: `fromId`, `clearPersistedState`, `isDevToolsFocused`, `getOwnerBrowserWindow`, `fromWebContents`, `fromBrowserView`. That matches `getFocusedWindow` checking `isDevToolsFocused`, followed by `fromWebContents` and `fromBrowserView`.
  - So with an entry's DevTools undocked and focused, `getFocusedWindow()` is that entry's window and `reader()` answers `{ kind: 'entry' }`. The command is sent there.
  - The case `'other'` is reached only by the audience window, a `BrowserWindow` made in `show.ts:89`.
  - The test rows (`menu-template.test.ts:337`) hand `commandWindow` the value `{ kind: 'other' }` directly, so nothing exercises the classification.
  - Five texts state the opposite: `HELP.md:28`, `DESIGN.md:748`, the comment at `menu-template.ts:26-30`, the doc of `Focused` at `:60-62` and the doc at `windows.ts:101-103`, together with G108's new clause.
- Failure scenario: open DevTools on the main window and undock it. Click into its console and choose File > Close Tab, or press Cmd+W if DevTools leaves the key to the menu. The main window's active tab closes, while HELP.md says no menu item runs then. This is the scenario of the first review's B7, unchanged for a window's own DevTools.
- Fix that fits: in `reader()`, answer `{ kind: 'other' }` when `entry.win.webContents.isDevToolsFocused()`.
- What settles it without the code: the look in the app, with the steps above.

**RB2. Accent Colour... from the menu posts a notice that says only "Unavailable".**
- Place: `menu-answer.ts:166-168`, `say(pressRefusal(command) ?? noteOf(command))`. `noteOf` is `command.why ?? t('app.palette_unavailable')` (`colon-effects.ts:70-72`), and `config/text/app.yml:172` is `palette_unavailable: Unavailable`. The `accent` command has `available: false` and no `why` (`palette.ts:526-531`). The row `['accent', ['notice', 'Unavailable', { tone: 'warning' }]]` pins the words.
- What is wrong:
  - In the palette the word sits beside the row's name, so it reads as "this command is unavailable".
  - As a notice it stands alone and names neither the command nor the reason.
  - The brief's letter, "in the palette's words", is met. The words do not tell the reader what was refused.
- Failure scenario: the reader chooses View > Accent Colour... and a warning notice "Unavailable" appears. With another notice up, nothing says which command it is about.
- This is user-visible wording, for the orchestrator. One option is a `why` on `accent` in `palette.ts`, which both surfaces would then say.

**RB3. The null sentence of the Settings row does not cover a settings file that is a link out of the folder.**
- Place: `config/text/views/system/workbench.yml:211`, `'{0} has no {1}, or one that does not read as text or is longer than the file window reads'`. `settingsText` also answers null for a link out of the folder (`tests/server/files/workspace/folder-settings.test.ts:41`, the `linked` row). DESIGN.md, `settingsOf`'s comment (`place.ts:71-75`) and G109 all name that fourth reason.
- What is wrong: the words are ruling 15's, verbatim. They leave out the one reason the other texts of the change name.
- Failure scenario: a folder whose `.oculus/settings.yml` is a symlink to a shared file outside the folder is told it has no settings file, or one that is not text or too long. None of those is true.
- For the orchestrator, since the words are a ruling.

## Declined to judge

- **The first runs on the unchanged tree for items 3 and 17.** These are `shell.test.ts`'s row red on the base by `TypeError: keys(...).appKey is not a function`, and the three `commandWindow` rows red on the round-1 overlay. Rerunning them needs the new tests copied into the base copy, or the snapshot laid over it, which is a write this review may not make. I read the quoted failures, and they match the rows' bodies and the signatures before the change. Would settle it: the orchestrator's own run in a scratch copy.
- **The base runs of case 16's kept forms and case 15 before `Source.svelte` changed.** These are as the first review declined them.
- **Whether macOS gives the page or the menu a key first while DevTools is focused.** This decides whether RB1 can be reached by a key as well as by a click. Only the app shows it.
- **Cases 9, 17, 18 and 19, and every other look the first review lists.** These are the menu as Electron draws it, `?` as an accelerator off macOS, Ctrl+Tab as a macOS key equivalent, and New Terminal and Split Terminal from the menu in a main and a popped-out window. They are unchanged by the round and remain the looks on landing.
- **Whether `test:quick` running past 45 s comes from the step or from load on the machine.** The selection is 212 test files for 85 changed files. Other suites may run on this machine at once (`agents/spec.md`, "Verify before you report"). The command is green; a run on an idle machine would settle the time.
- **When `guarded.md`'s G107 line was written.** The round snapshot holds no ledger file, so whether the line at `guarded.md:301` came from the first build or the round cannot be read here. The report places it in the round. `git diff 3587a477a` shows only the end state, and no command allowed here would separate the two.

Usage: over round 1: adad48ff0edac1de7, claude-opus-5-5, 249,683 tokens, 75 tool uses, 13.2 min

## Closed

First run (S1 to S11, P1, B1 to B7): each sent to the builder as rulings 1 to 17 of `agents/briefs/O42-round1.md`; the review over the round finds each done as ruled, ruling 7 partial (RS1 below) and ruling 17 not reproduced for DevTools (RB1 below). B5 and B6 needed no change: B5 is judged correct by the reviewer, and B6's title-case words follow the brief's line 52. Judgment call 13 (Open Recent lists the open workspace) follows the brief's line 71.

Repair round 1:
- RB1. Fixed at landing: `focusedOf` in `src/desktop/windows/menu-template.ts` reads a focused entry whose DevTools has the focus as `other`, and `reader()` in `windows.ts` hands it Electron's focused window and `webContents.isDevToolsFocused()`; the row 'reads an entry, no window, and a window of no entry or with its DevTools focused' in `tests/server/desktop/menu-template.test.ts`. The texts of HELP.md, DESIGN.md and the comments that state the DevTools case are now true; the press itself is a look in the app.
- RS1. Fixed at landing: the save-rules Test line moved from G107 to G59 in `agents/guarded.md`.
- RS5. Fixed at landing: G108's sentence restored to the text approved under ruling 148 (a).
- RS2. Fixed at landing: `showTerminal`'s comment defers to `showIn`'s rule and keeps the sentence on an id that is not a terminal's.
- RS3. Fixed at landing: `menu-commands.ts`'s head comment says the kinds module imports only a type.
- RS4. Fixed at landing: DESIGN.md gives the reason for the routing (Close Tab and Save act where the reader is) and for the settings text in the folder list (a repository-path root finds its folder's text, no reader asks for a missing file).
- RS6. Kept: `Focused` describes the menu's reading of the focus and sits beside `commandWindow` and `focusedOf`, its users; the window list imports it as a type, so the Electron-free template module never imports the Electron module.
- RB2. Fixed at landing: a menu command that is unavailable with no reason of its own says `'{0}: unavailable'` with the command's description (`app.palette_unavailable_named`), so Accent Colour... says "Set the accent colour: unavailable"; the palette row keeps "Unavailable" beside its name.
- RB3. Fixed at landing: `settings_origin_none` names the fourth reason, "or is a link out of the folder", and the row "name each reason a folder's settings text is null" reads it.
