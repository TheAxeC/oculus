Brief check of Q102 (tools/oculus/.scratch/migration/agents/briefs/Q102.md, 139 lines, read whole), on main at 62c6f933 (`git rev-parse --short HEAD`). Nothing in the repository was changed.

## Names

I ran `grep -rlw -- <name> src tests config DESIGN.md HELP.md README.md docs utils` for each name. For `beside` and `share`, which are common words, I narrowed it with `grep -rn -E "\.beside\b|\bbeside:|tab\.share|\.share\b|share:"`. Hits outside the brief's "Paths this step writes":

**Source files outside the path list that the change makes false or breaks:**
- `src/lib/shell/Workbench.svelte:160` has `composeIn: (page) => client.terminals.composeIn(page)`. This wires the `n` key and PaneView's strip item. Item 1 needs a pane-scoped start, and `StripDeps.composeIn(page)` (`pane-view.ts:146`) carries no pane path. Changing the signature breaks this file, and it is not in the path list.
- `config/text/app.yml:12` is the key sheet row `n | start a new agent session: the composer in the page's Terminal tab`. Decision 2 (the `n` key starts a shell) makes it false. It is not in the path list.
- `src/lib/views/sessions/session-list/SessionList.svelte:124-126`: `newSession()` calls `composeIn()`, and `config/text/views/sessions/session-list.yml:33-34` labels it `New` / `Start a new session (n)`. The file is in the path list, but the brief never says what the Sessions view's New does once `composeIn` or `n` changes. `session-list.yml` is not in the path list.
- `src/lib/views/sessions/session-list/TerminalRows.svelte:57` draws `{entry.name}` in the Sessions list. Item 5 says the row, tab and title show the new `title`. The Sessions list keeps showing the name unless this file changes, and it is not in the path list.
- `src/lib/shell/rail/ActivityRail.svelte:151` (`resetPage`) and `src/lib/views/system/workbench/PagesReset.svelte:54` (`resetPages`) are the reset callers. Both run through `resetAfterAsking` (`pages.ts:204-227`), which asks only the unsaved question per tab. Item 9 ends terminals on a reset, and item 10's busy question is not specified for resets. If it goes into `resetAfterAsking` (pages.ts is in the list) these two callers may not change, but the brief does not say so.
- `src/lib/state/workbench/ui.svelte.ts:182` (`registerUnsaved`) is the model the brief names. It is not in the path list. The brief's "Read" item 4 cites `ui.svelte.ts 175-190` without its folder; the file is `src/lib/state/workbench/ui.svelte.ts`.
- `src/lib/state/workbench/navigation/registry.ts:189` (`unregisterView` then `closeInstancesOfView`) and `src/lib/views/sources/files/sections/Sections.svelte:99` (`closeRecord`). These are the only callers of `closeInstanceAnywhere`: `grep -rn -E "closeInstanceAnywhere|closeRecord\(|closeInstancesOfView\(" src` shows no user-facing caller. Item 9 calls `closeInstanceAnywhere` a user-facing removal, which it is not. If the new registration hooks it, a terminal view unregistered by `src/routes/views.ts:61` would end every terminal.
- `src/lib/views/sources/file/File.svelte:136` and `src/lib/views/sources/doc/Doc.svelte:76` call `closeInstance`. Unaffected unless the signature changes.
- `config/text/ui.yml:27,35,66` hold the close-question words (`page_close_confirm`, `pane_close_confirm`, `tab_close_dirty`). The busy question is asked from PaneView and Pages. Its words go in `terminal.yml` by item 11, so a shell file would read a `sessions.*` key. That is legal but is a decision the brief does not name.

**Test files outside the path list that the change breaks:**
- `tests/views/sessions/sessions.test.ts:359-362` audits `expect(source).toContain('onclick={() => composeInTab(instance.id)}')`. Item 1 breaks it.
- `tests/views/sessions/sessions.test.ts:352-356` audits `restate(withLabel(tab, live.name))`. Item 5 changes the label to follow the title.
- The brief's glob `tests/views/sessions/terminal*.test.ts` does not match `sessions.test.ts`.
- `tests/ui/menu/menu-words.test.ts:77-85` calls `gridMenu(true, false, words)`, `terminalRowMenu(readTab({..., beside: B}), ...)` and `emptyListMenu(words)`. Items 5-8 add menu items, and a signature change breaks it.
- `tests/shell/keys/workbench-keys.test.ts:144,163,386` uses `composeIn`, and the file uses `readTab`.
- `tests/shell/workbench.test.ts:61,233` uses `closePage`. It breaks only if `closePage` changes shape.
- `tests/views/system/workbench/pages.test.ts` is the Pages.svelte suite; Pages.svelte is in the path list.
- `tests/fixtures/sessions-fixture.ts` and `tests/server/root/watch/sessions.test.ts` build `Terminal` literals (`grep -rln "attached: \(true\|false\)"`). They break the type check if `title`, `icon` or `color` become required fields.

**Hits inside the path list, and false after the change:**
- `Terminal.svelte:20` "Closing a tab stops nothing".
- `terminals.svelte.ts:20` "A closed tab stops nothing, so its terminals run on unowned".
- `DESIGN.md:273` "Closing a tab stops nothing: its terminals run on" and "New in a tab shows the composer".
- `HELP.md:79` (`n` starts the composer).
- `HELP.md:127` "Closing a tab leaves its terminals running". Item 11's grep `stops nothing\|keep running\|keeps running` does not find this wording. The brief's "HELP.md's Terminal text" covers it only by the general sentence.
- `tests/state/client/terminal-tabs.test.ts:326` asserts the old rule ("leaves its terminals running and unowned").

**Names with no hit outside the brief's paths:** `LIST_FORMAT`, `parseTerminal` (`tests/server/machine/pty/sessions.test.ts` is covered), `@oculus_name`, `closeEnded`, `showComposer`, `splitOn`, `withStarted`, `splitAt`, `TerminalTabState`. `DESIGN.md` hits for `moveTerminal`, `resetPage` and `resetPages` (DESIGN.md:270, :273) stay true except as listed above.

## The step line

`grep -n "^- Q102" plan.md` gives line 255. Every part maps to an item:
- New Terminal starts a shell at once in the tab's folder: item 1.
- The kinds dropdown: item 2.
- Split at once, same kind and folder, as many as VS Code allows: items 3 and 4.
- Rename by right-click and double-click: item 5.
- Change Icon and Change Color: item 6.
- Clear: item 7.
- Copy as HTML: item 8.
- Closing a tab, pane or page ends its terminals, replacing Z40 (d), while a move or a reload ends none: item 9, with the words in item 11.
- Ask first unless the terminal is an idle shell: item 10.
- Seen on TEST plus the store's cases: the paragraph after Cases.

No part is unmapped. Two notes:
- plan.md has no "Goal" section (`grep -n "^## " plan.md` lists only Packages, Could run in parallel, Rulings and Blocked). The goal used here is the step line itself.
- The parity inventory the Q88 line cites (`agents/reviews/vscode-parity.md:279`) says Clear "clears the view, tmux keeps its history". Decision 5 of the brief says the opposite. The brief states it as a reversible decision, but it contradicts a document the plan cites and does not say so.

## Premises

Rechecked with `sed -n`, `grep -n` and `wc -l` on main at 62c6f933.

**Hold as stated:**
- `Terminal.svelte`: 249-254 (bar New calling `composeInTab`), 20, 100-104, 146-150, 178-183 (`splitOn`), 189 (`stop: stopTerminal`), 302-325 (Sash at 307).
- `terminals.svelte.ts`: 426-436 (`composeIn`), 439 (`composeInTab`), 448-452 (`showComposer`), 510-517 (`startTerminal`), 327.
- `composer.ts`: 44-49, 101-107, 138-141.
- `pane-view.ts:131,160`; `workbench-keys.svelte.ts:180`.
- `terminal-tabs.ts`: 23-25, 28-43, 84, 107-126, 168, 203, 209, 218, 224, 233, 243, 268, 275, 284-291.
- `terminal-list.ts`: 194-204, 253-262, 273-276, 285-304, 307-320.
- `TerminalList.svelte`: 176-180, 187, 191-198, 287, 306-311.
- `TerminalGrid.svelte:387-401`.
- `routes.ts`: 60, 406-426; the `action ===` grep lists exactly the twelve actions named.
- `sessions.ts`: 27, 38, 65-74, 216-223, 231-254, 413-421.
- `folds.ts:252-280` (263-265 the shell title).
- `grid-look.ts:14-31`; `GlyphList.svelte` is 88 lines; `RailEditor.svelte:160`.
- `instances.ts`: 166, 202, 236, 251, 269, 290, 310; `layout.svelte.ts:409`.
- `pages.ts:69-72`; `PaneView.svelte:287-291`, `:350-365`; `Pages.svelte:118-145`.
- `channel.ts`: 45, 55-65, 312.
- `stopTerminal` has three client-side callers plus the route.
- Installed xterm packages are 6.0.0 / 0.11.0 / 0.16.0 / 0.9.0 / 0.12.0 (read from each `node_modules/@xterm/*/package.json`). No addon-serialize is installed.
- `npm view @xterm/addon-serialize@0.14.0 version license peerDependencies` gives 0.14.0, MIT, and no peerDependencies line; latest is 0.14.0.
- `tmux -V` gives 3.7c. `tmux ls | grep -c bc3547` gives 0.
- `src/lib/views/sessions/terminal/` holds 10 tracked items.

**Differ:**
- `moveTerminal` starts at `terminals.svelte.ts:401`, not 400; the close is at 412.
- Z40 (d) is at `orchestrator-state.md:181` in the working copy but at 180 on HEAD (`git show HEAD:... | grep -n`). The state file has uncommitted edits, so "read on main at 62c6f933" is not strictly what was cited.
- "the composer's folder falls back to `hubRoot()` (`composer.ts:101-107`)": `composerWorkspace` there takes a `hub` parameter. The `hubRoot()` call is at `Composer.svelte:78`.
- The "two halves are assumed by" list leaves out `emptyTab` (terminal-tabs.ts:55-65, sets `beside: null, share`) and `withTerminal` (146-164, sets `beside: null`). Both assume the pair.
- `closeInstanceAnywhere` is not a user-facing removal (see Names).
- The Clear grep `grep -rn "clear-history\|\.clear()" src/lib` does print hits: Set and Map `.clear()` in channels.ts, channel.ts:411-413, poll.ts, portfolio.ts, sessions.ts, layout.svelte.ts:300 and attention.ts. None is xterm's, so the claim holds in substance but not as the command's output.
- `closeQuestion` is synchronous (`pages.ts:69`). The brief's premise that the ask-first check needs a fresh read is right. It never says how an async read fits the synchronous close question and its three callers.

## Cases and checks

The test setup, read from the heads of each file:
- `tests/server/machine/pty/sessions.test.ts` runs a real tmux on a private socket and is tagged `// @module-tag slow` (`grep -ln "@module-tag slow"`). `npm test` leaves it out, and the rules file bars running `test:slow`. A new `parseTerminal`, `rename`, `restyle`, `clear` or busy-read test placed there never runs in verification.
- The route suites (`tests/routes/sessions/terminal-fixture.ts`, `terminal-actions.test.ts`) use a `run` double that records each argument vector. That is where `set-option @oculus_title`, `clear-history` and `display-message #{pane_current_command}` can be asserted.
- `tests/state/sessions/terminals.test.ts` and `tests/state/client/terminal-tabs.test.ts` stub `fetch` and `WebSocket` and use the real client wiring with `fakeStorage`.
- Nothing renders a DOM.

**Cases that cannot pass as written:**
- **Case 11** cannot pass as written. `readTab` treats a state with no `terminals` array as the old pinned shape and returns an empty tab (`terminal-tabs.ts:110-115`). `'a'` and `'b'` also fail `isTerminalId` (`/^[0-9a-f]{6}-(claude|codex|shell)$/`, line 51) and are filtered out. `{ shown: 'a', beside: 'b', share: 0.3 }` reads today as a composer-only tab, not as row `['a','b']`. The case needs `terminals: [A, B]` with valid ids, as `tests/state/sessions/terminal/terminal-tabs.test.ts:85` has.
- **Case 10** "each at least 80 px" is a pixel fact. The tab state holds shares, not widths, so a state test can check it only through a pure function given a pane width, which the brief does not name. "Scrolls sideways" is DOM only.

**Cases that need a DOM (seen only at the look):**
- **Case 14**: an empty grid buffer. The server half can be tested through the route double.
- **Case 15**: the clipboard holding `text/html` from `serializeAsHTML`. Testable only as a helper handed a fake serializer and a fake clipboard.
- **Case 13**'s "row's mark takes `--c-red`" can be read off a server render of the row's style.

**Cases that cannot be seen on TEST**, although the brief says "Cases 1 to 22 are also seen in the page on TEST":
- Case 3: the portfolio not yet arrived.
- Case 8: the timing window before the payload lists a new terminal.
- Case 11: an old saved state.
- Case 21: a failing tmux read.

**Case 17 on TEST** needs a build running in a terminal the look started. Z57 (a) allows that.

**The rule on revert-named tests and audits:** the cases that exercise a press (1, 2, 5, 16, 17) can be checked only at the store call. The rules file ("an assertion over source text ... proves nothing and is reported as an audit") makes the press wiring an audit.

## The question

For each case and item: could it pass without the goal being reached?
- **Cases 1, 2, 5, 6, 7, 9 and 12 (store level):** yes. They assert the store's post, but the bar button, row button or menu pick could still call the old `composeInTab` or `splitOn`, as happened before, when Split "worked" in the store and did nothing visible. Only the landing look closes this. The brief puts the look on the orchestrator, so the goal is reached only if the look presses each control.
- **Case 4:** yes, if it is tested at `stripPicked` with a fake `composeIn`. The pane path must reach a store that opens the tab in that pane. The layout has no open-in-pane function today (`context.ts:190`, `open: (page, state) => layout.openView(...)`), so a test at the store through the client wiring is needed.
- **Case 10:** yes. Shares summing to 1 can pass while the `{#each}` still tears down the left grid, or while the sash bounds allow under 80 px. Both are DOM only.
- **Cases 16-18 and 21:** yes, if they are tested with the close registration called directly. The goal is that the pane's and page's close controls wait for the busy answer, which lives in PaneView and Pages (DOM). A store-level test of "ask, then end" does not show that PaneView awaits it.
- **Case 19 (reload):** yes. Reloading through `loadLayout` never calls a removal, so the case passes even if the registration is wired wrongly. It proves only the absence of a call.
- **Case 22:** yes, if `closeEnded` restates the tab before closing it. The registration then sees no terminals. That is correct, but the case cannot tell that path from one that swallows the stop errors.
- **Items 2 and 6** (dropdown, icon and colour pickers), **item 7** (grid clear) and **item 8** (Copy as HTML) are DOM only. Only their server halves are testable.
- **Item 11:** yes, if the builder uses the brief's grep alone, which misses `HELP.md:127`.

## Implied inputs

Inputs the step implies but the Cases do not list, each with its expected result:
- A title of only spaces: saved trimmed to empty, which clears the title, or refused. The brief does not choose.
- A title containing a tab: refused by `label()`'s control-character rule, which matters because `LIST_FORMAT` is tab-separated.
- A title ending in `;`: tmux's argument parser can take a trailing `;` as a command separator. It should be stored verbatim, and a route-double test should show the argument vector.
- A title of exactly 80 characters is accepted; one of 81 is refused.
- A rename, restyle or clear on an id the server does not know, a foreign id, or an ended terminal: a said refusal and no tmux call.
- `?busy=` holding a malformed id, or more ids than the tab holds: refused before `display-message` is built (the GET carries no token, `+server.ts:9`).
- The busy comparison of a shell: `pane_current_command` is a basename (`zsh`), while `commandFor('shell')` returns `$SHELL` as a path (`/bin/zsh`, `sessions.ts:152-153`). An idle shell must compare equal.
- Task, recover and LaTeX terminals are kind `shell` running a program, so they are busy while it runs.
- Closing a tab while its busy read is in flight, then closing again: one question, one read.
- The terminal ends by itself during the read: nothing is stopped twice.
- Closing a tab while a New or Split start is in flight: the terminal the start answers joins no tab. The expected result, it is ended because its tab closed, is unstated.
- Closing a pane holding a Terminal tab and a tab with unsaved text: one question naming both. The order is unstated.
- A Split or New while the tab shows the "With a Prompt..." composer: where the composer sits in a row of several is unstated.
- Split of a terminal that is itself not the shown one: the new terminal goes right of that one, not of the shown one.
- A start answer that fails (folder deleted, tmux down): a said refusal on the bar, no composer, and the tab unchanged.
- Two quick presses of New: two terminals.
- A press while the hub root is `''`: one post once the root is known, not one per press.
- The pane strip's New on a pane that holds no tab: a new Terminal tab in that pane.
- The Sessions view's New, which shares `n` today: behaviour unstated.
- Change Color to "Default" or Change Icon to "Default": the option unset.
- A glyph removed from `glyphs.yml` after it was set: drawn as the default.
- Copy as HTML when `ClipboardItem` or `navigator.clipboard.write` is refused: a said failure, or plain text only.
- Kill of the middle terminal of a row of four: the others keep their order, and the shares are renormalised.
- Unsplit on a row of one: nothing.
- A page reset that removes a Terminal tab holding a busy terminal: whether it asks is unstated.

## Folder limit

`sh utils/folder-check.sh` exits 0 today. Tracked items, counted with `git ls-files` per folder:

| Folder | Items |
|---|---|
| `src/lib/views/sessions/terminal` | 10 (the brief names it) |
| `src/lib/state/sessions` | 10 |
| `src/lib/state/workbench` | 10 |
| `src/lib/state/workbench/layout` | 10 |
| `src/lib/state/workbench/navigation` | 10 |
| `tests/state/sessions` | 10 |
| `tests/state/workbench/layout` | 10 |
| `src/lib/state/sessions/terminal` | 2 |
| `src/lib/server/machine/pty` | 7 |
| `src/lib/shell/panes` | 8 |
| `config/text/views/sessions` | 9 |
| `tests/views/sessions` | 8 |
| `tests/routes/sessions` | 7 |
| `tests/server/machine/pty` | 6 |
| `tests/state/client` | 7 |
| `tests/shell/panes` | 3 |
| `tests/state/workbench` | 8 |

The brief names only the first as full. Any new module for the pending-start record or the busy question, and any new test file for the close registration, cannot go into the other full folders without a split. `src/lib/state/sessions/terminal/` (2 items) and `tests/state/sessions/terminal/` (2 items) have room.

**Path list gaps against what the items require:**
- The `Terminal` type (`src/lib/data/model/model-sessions.ts:251`) is covered.
- `closeQuestion`'s callers `PaneView.svelte` and `Pages.svelte` are covered. The reset callers `ActivityRail.svelte` and `PagesReset.svelte` are not.
- The Sessions list's `TerminalRows.svelte` is not covered.
- `src/lib/shell/Workbench.svelte` is not covered (the `composeIn` wiring).
- `src/lib/state/workbench/ui.svelte.ts` is not covered (the registration model).
- `config/text/app.yml`, `config/text/views/sessions/session-list.yml` and `config/text/ui.yml` are not covered.
- The tests `tests/views/sessions/sessions.test.ts`, `tests/ui/menu/menu-words.test.ts`, `tests/shell/keys/workbench-keys.test.ts`, `tests/views/system/workbench/pages.test.ts`, `tests/fixtures/sessions-fixture.ts` and `tests/server/root/watch/sessions.test.ts` are not covered.

## Declined to judge

- **The look on TEST at this /spec** (the composer on New, Split writing `{ ..., composing: true }`, the two grids after Start, the Kill of both): I cannot rerun it, since I may start no browser and no server. I checked only that `tmux ls` lists no `bc3547` session, and that the code paths it describes exist (`splitAt` sets `composing: true`, `terminal-tabs.ts:224-227`; `listDrawn` is `count >= 2 || (count === 1 && composer)`, `terminal-list.ts:83-85`; the bar has four ToolButtons and no Split, `Terminal.svelte:249-270`).
- **The two VS Code files** (`terminalGroup.ts` `SplitPaneMinSize = 80`, `terminalConfiguration.ts` `confirmOnKill` values and default): not fetched here, so not verified.
- **Whether a tmux option value holding `#{...}` is re-expanded by `list-sessions -F`**: not verified, since no tmux command that changes state was run.

## Usage

claude-opus-5-5 (the transcript's message.model), 66 tool uses, 199,689 tokens, 8.4 min (506,023 ms), from its completion notice.

## Closed

Every finding is closed in the brief `agents/briefs/Q102.md`:

- Names outside the path list: `Workbench.svelte`, `ActivityRail.svelte`, `PagesReset.svelte`, `TerminalRows.svelte`, `ui.svelte.ts`, `config/text/ui.yml`, `config/text/app.yml`, `src/lib/state/sessions/terminal/` and the named tests are in "Paths this step writes"; their lines are in "What is on the tree". `session-list.yml` is not written, since decision 2 keeps the Sessions view's New and the `n` key on the composer.
- `closeInstanceAnywhere`: named as no user-facing close in the premises; item 9 leaves it out; case 40 checks that it ends nothing.
- The pane-scoped start: item 1 names a new `StripDeps` start wired in `Workbench.svelte` and a layout open-in-pane function.
- The async busy read against the synchronous `closeQuestion`: item 10 says the three close handlers become async, await the read and then choose, with one question for unsaved text plus a busy terminal, a second press ignored during the read, and `resetAfterAsking` asking once.
- Docs: item 11's grep adds "leaves its terminals running" and names `HELP.md:127`, `DESIGN.md:273`, `HELP.md:79` and the key sheet row.
- Clear against `vscode-parity.md:279`: decision 5 states why tmux's history is cleared, and the parity row is corrected in the preparation commit.
- Premise corrections: `moveTerminal` 401-420, the `hubRoot()` call at `Composer.svelte:78`, `emptyTab` and `withTerminal`, the clear grep's Set and Map hits, the Z40 line read by grep.
- Test placement: tmux argument vectors go through the route double; the slow pty file takes no new case.
- Case 11 rewritten with valid ids and a `terminals` array; case 10 through a pure width function, the scroll a look item.
- Look-only cases and cases that cannot be produced on TEST are listed after Cases.
- The implied inputs are cases 23 to 40, and the rules they need are in items 1, 4, 5, 6, 8, 9 and 10 and decision 8.
- Folders: the full folders are listed; new modules go to `src/lib/state/sessions/terminal/` and tests to `tests/state/sessions/terminal/`.
- Declined points (the look, the two VS Code files, tmux re-expansion of `#{...}` in an option value): the look was the orchestrator's at this /spec and is quoted in the premises; the VS Code files were fetched by the orchestrator; the re-expansion is covered by case 23's route-double test of the argument vector and by `label()`'s rules, and is a look item at landing (a title holding `#{pane_id}` shown as typed).
