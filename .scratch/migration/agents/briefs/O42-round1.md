# O42, repair round 1

Read `agents/spec.md`, the brief `agents/briefs/O42.md` and the refuter report `agents/reviews/O42-refuter.md` first. This is the one repair round of O42; there is no second. Every item below is a ruling inside O42's part; each is done in this round, and a shortcut (a narrower reading, an item called outside the step) is a finding. Where an item reaches a file the brief's "Paths this step writes" does not name, the path list is widened to it. No `/diagnose`, no diagnosis agent and no breakage testing of any kind: a test is judged by reading it.

## Items

1. **S1.** `src/lib/shell/keys/workbench-keys.svelte.ts:151` reads `SHEET_CHARACTER` from `page-keys.ts` in place of the literal `'?'`, so the sheet opens and closes on one key.
2. **S2.** The open-workspace effect of `:workspace` lives once, in `src/lib/shell/commands/colon-effects.ts` beside the other colon effects; `WorkspaceRows.svelte:79` and `menu-answer.ts:206-209` both call it, with the `said` option passed in that one place.
3. **S3.** `src/lib/shell/Workbench.svelte:244-247`: `appKey` reads the page's tab (`pageTab`) and its status, as `sourceKeys(client, pageTab)` at :241 does, so an app keybinding's `when` in a popped-out window reads the float's tab. A test row under G77's tests shows a binding with `when: resourceExtname == .md` firing for a float whose tab is a `.md` file while the main area shows a `.py` file, with its first run on the unchanged tree quoted (red) and its run after (green). The report states the before and after.
4. **P1.** `tests/shell/window/menu-answer.test.ts` gains rows that run the real `menuPage` against stubbed stores for the colon path: for each command `RUNS` sends through `colon`, the command found by `commands(...)` runs once; a command that opens as a mode or has a hint opens the palette typed `:<name> `; an unavailable command posts the notice with the words `pressRefusal ?? noteOf` give (Accent Colour... among the rows); the effects of `folder`, `folder-add`, `workspace-close`, `crt`, `update` and the docks run once each. The rows are judged by reading: each would fail with the colon behaviour taken out of `menuPage.colon`. Quote their run.
5. **S4.** The title at `tests/server/desktop/menu-template.test.ts:128` names what it checks without "Part 1" or any other reference to the brief.
6. **S5.** Every line the step adds is at most 100 columns (`awk 'length > 100'` over the changed files prints nothing for added lines): `desktop-keys.ts:41`, `fs.ts:107`, `source-options.ts:3`, `menu-template.ts:96`, `menu-commands.ts:86`, `tests/server/desktop/menu-template.test.ts:10`, `tests/state/sources/folder-settings.test.ts:106`; the paragraph at `resolve.ts:257-261` is rewrapped as one paragraph.
7. **S6.** The server tests of `tests/state/sources/folder-settings.test.ts` (those of `workspacesAnswer` in `lib/server/files/fs.ts` and of `watchGit` in `lib/server/root/watch/git.ts`) move to where their concerns live, `tests/server/files` and `tests/server/root`, and a folder that would pass ten items is split by concern as `agents/spec.md:48` says, every import and every guarded entry's Test line (G59, G109) updated. The client-state tests stay where they are.
8. **S7.** The sentence "An id that is not a terminal's shows nothing." is back in the comments of `showTerminal` (`src/lib/state/sessions/terminals.svelte.ts`) and of `showIn`, and no comment is shortened to fit the 880-line limit; the room the store needs comes from moving code out by its concern.
9. **S8.** `TERMINAL_PROFILES` and `profileWords` move out of `data/helpers/keys/oculus/menu-commands.ts` into a data module of the terminal kinds' own concern; `menu-commands.ts`, `menu-template.ts`, `terminal-list.ts` and `Composer.svelte` import it from there.
10. **S9.** DESIGN.md states the `settings` field of the folders of `GET /api/fs` (text or null, ruling 138 (b)) beside the sentences on what those folders carry (`DESIGN.md:616` and `:750`), and the menu's routing: a command goes to the window the reader is in when it is an entry, else the last main window; Settings and Help to the last main window; nothing while an audience window, or any focused window that is not one of the app's entries, is focused (item 17).
11. **S10.** The bullet at `HELP.md:18` becomes short bullets, one fact each, nothing lost.
12. **S11.** The round report's history-word check greps every added comment line and test title for the list at `agents/spec.md:44` in full, and quotes and judges each hit.
13. **B1.** The row `'opens Settings and Help into its float'` (`menu-answer.test.ts:179`) is removed, since the host never sends Settings or Help to a float. The round report corrects the first report: Settings and Help keep going to the last main window.
14. **B2.** The repository header draws the branch, the detached HEAD and the detached sentence in their own case; only the header's name is in capitals. Every other `TreeItem` with `heading` and a `detail` keeps its drawing unless it shows a name whose case matters in the same way, which the report lists by file.
15. **B3.** The Settings row's sentence for null covers a file over the read limit as well: `settings_origin_none` in `config/text/views/system/workbench.yml` reads `'{0} has no {1}, or one that does not read as text or is longer than the file window reads'`, the tests that read the sentence updated.
16. **B4.** The round report states the before and after of the debug keys in a popped-out window: `breakpointFileOnScreen` now reads the float's tab, so F5, F9, F10 and F11 in a float whose file the debugger takes are taken; before, the main area's file decided.
17. **B7.** A menu command while a focused window is not one of the app's entries (an undocked DevTools window) is sent to no window, as for an audience window; with no focused window it goes to the last main window as now. `windows.reader()` and `commandWindow` carry it, with a row in `tests/server/desktop/menu-template.test.ts` for `commandWindow`, its first run on the unchanged tree quoted.

## Verify before you report

From `tools/oculus` in the worktree, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`:
- `npm run diagrams && npm run test:quick -- --base 3587a477a`: every command passes.
- The guarded tests of G8, G59, G69, G77, G107, G108, G109 and G110 by their Test lines, plus the moved files: all pass.
- `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/source/keys.test.ts tests/checks/tree/duplication.test.ts --testTimeout 0 --hookTimeout 0`: all pass.
- `sh utils/unused-exports.sh` compared with `O42-base/unused-exports.txt`: no new line.
- `LC_ALL=C grep -n '[^ -~]'` over every changed file except `.svg`: nothing.

The plan's whole verify list runs once, at landing on main.

## Report

Append a section "Repair round 1" to `agents/reviews/O42-report.md` in the worktree's ledger copy: one row per item above with DONE or NOT DONE, the command that shows it and its output; the first runs on the unchanged tree for items 3 and 17; the verification lines; every path changed in the round; the before and after of each host- or user-visible change the round makes.
