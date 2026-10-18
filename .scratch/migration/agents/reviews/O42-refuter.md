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
