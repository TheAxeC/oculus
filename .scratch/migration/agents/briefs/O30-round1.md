# O30, repair round 1

The review of your build is `agents/reviews/O30-refuter.md` (main checkout ledger); read it whole first. Each item below names the finding it closes and says what to change. Your brief `agents/briefs/O30.md`, the cases ruling `agents/briefs/O30-cases.md` and the rules file `agents/spec.md` still hold in full; this round widens your paths only where an item says so. Line numbers are the reviewer's; check each with `grep -n` before you change it.

Never use breakage testing of any kind: no mutation, no revert or removal of code to watch a test fail, no injected fault, no scratch copy with a block removed. A test is judged by reading it. You run no git command, read-only ones included.

Never take focus on Axel's screen: no `app.focus`, no `osascript activate`, no `Page.bringToFront`, no `focus()` or `show()` called from outside the app's code. Start the app once for all the runs this round needs, on the scratch HOME, and close it by its pid. A run that does not show after one honest try is reported not verified with what you saw; never rerun a case to tune a harness.

## Items

1. **S1, case 12 (ruling Z592).** A source tab's saved state gains its scroll position (the first line shown), so Copy into New Window and Move into New Window open the tab at the line the original shows. Case 12's run is quoted with `first` equal on both sides.
2. **B1.** `src/desktop/app.ts` keeps `origin` current: it follows every listen of the server (`server.onListening` or the equivalent), so File > New Window, the Dock click and a second start after a port move open the port the server listens on now. The run: move the scratch server's port in the scratch Settings, close the windows, reopen through the main process's own New Window handler, and quote the new window's URL.
3. **B2.** A save the bridge does not answer, or answers with invalid arguments, is not admitted: `bridge.ts:96` and `preload.cjs:28` treat no answer as a refusal, so a save writes only with the turn.
4. **B3.** The write record's re-check (`storage.ts:56`, `CONFIRM_MS = 300`, and `:222`) waits on a signal (the other window's write landing, read from the storage event or a version the record carries), never on a fixed time.
5. **P6, case 35.** Settle why the main window's split changed no pane while the write record holds `splitInstance`, fix what lost it, and quote case 35's run with both changes in the saved arrangement.
6. **S4 (ruling Z598).** `src/desktop/decide/args.ts` passes every argument of the form `--name` or `--name=value` that is not one of oculus's own flags to Chromium; only a positional argument or an oculus flag with a wrong value gets the unknown-argument dialog. G48's row for arguments, if it reads the list, is changed to this rule and named in the edits table.
7. **S2 (ruling Z596).** `--default-port` stays. HELP.md:352 and README.md:11 name both arguments of the built server, `--engine <dir>` and `--default-port <port>`, with one clause each on what it does.
8. **S3.** HELP.md's keys table gains the Cmd+R row (Reload Window), beside the other app rows of brief :189.
9. **P2 (ruling Z597).** Delete every test no `guarded.md` entry names: `window-guard.test.ts:95` ('starts a page in the app on the dark theme, ...'), the `wordAt` rows and the suggestion test of `tests/ui/controls/text/text-menu.test.ts`, and the three tests of `tests/state/workbench/drag-outside.client.test.ts` (with the file, whose head comment is false). A file left empty is deleted. The behaviours are shown by runs the report quotes instead.
10. **P3.** `tests/server/desktop/start.test.ts` (G48) waits on signals only: the printed line through the child's output stream event, the process end through its `exit` event, each with no fixed `wait()` and no polling. The Quit row reads the exit code once the `exit` event has fired. Keep the file's `slow` tag.
11. **P1.** The report cites the Restart fix at the line it is on (`app.ts:234-235`), and quotes a run: Restart from the menu's own handler, invoked in the main process, and the count of main windows before and after.
12. **P5, case 2.** The packaged app's Terminal tab: say why no session existed after the click, fix it if the cause is in this step's paths, and quote the run.
13. **P7, the cases left undone.** Run each once, under the no-focus rule:
    - cases 14, 17 and 41: make the tab dirty by setting the editor's text over the debugging port (`Runtime.evaluate` on the Monaco model), then do what each case does;
    - case 21: full screen and DevTools by invoking the menu roles from the main process; the edit keys through `Input.dispatchKeyEvent` with the editing commands, reported not verified if Chromium ignores them;
    - case 16: start the app a second time on the scratch HOME;
    - case 27: move the windows apart with `setBounds` from the main process, then drag into the popped-out window;
    - case 9: quit after the answer, with the stub that answers dialogs from files.
    Cases 20 and 39's real sheet stay with the look.
14. **P4.** The report marks each paragraph brief :71 lists, of HELP.md, DESIGN.md and README.md, `still true` or `rewritten`, by file and line.
15. **S5.** The report gives the reason for each of the three new `process/` modules (`parent.ts`, `port.ts`, `words.ts`), as it does for the outside paths.
16. **Standards.**
    - St1: the orphaned doc comment at `layout.svelte.ts:85` moves to `GONE`.
    - St2: `window-file.ts:4` names `src/desktop/windows/window-state.ts`.
    - St3: `port.ts:4` says what a start without the flag does, with no history wording.
    - St4: `preload.cjs:4` wraps under 100 columns.
    - St5: the comment at `utils/diagrams/graphs.mjs:37-38` and `:155` is wrapped evenly at the file's width.
    - St6: `menu.ts:25`'s `'oculus'` label comes from the catalog.
    - St7: one `HOST` (import `LISTEN_HOST`) and one `ZOOM_LEAST` and `ZOOM_MOST`, each defined once and imported.
    - St8: `src/routes/find/+page.ts` and the main `+page.ts` share one install function.
    - St9: no git command, read-only ones included.

## Verify before you report

The brief's list, once, after the last change: from the worktree's `tools/oculus`, `bash ~/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, the lines it prints quoted; then the brief's other verify commands. While working, run only the test files you changed. A command that fails is rerun alone, then the full list once more.

## Report

Append "# Repair round 1" to your report in the worktree's ledger copy (`tools/oculus/.scratch/migration/agents/reviews/O30-report.md`): one row per item above, DONE or NOT DONE with the command or run that shows it, NOT DONE first; the runs; every test deleted and every test changed, by file and title; the edits to existing assertions; the verify lines.
