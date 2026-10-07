# D45, repair round 1

Read `agents/reviews/D45-refuter.md` whole. Close each item below, nothing beyond them, under the brief and `agents/spec.md` unchanged. Append a section "Repair round 1" to `agents/reviews/D45-report.md` in the worktree: each item, its change with `file:line`, and the check that shows it, quoted.

1. Spec 1, the jump: the `jump` message names the page the float belongs to (the float's owner instance or page id the float page already knows), and only that main page opens the source and takes focus. Run it in your hidden Electron script with two main pages on one scratch server: one opens the source, the other does not.
2. Spec 2 and Proof 1: the notice is "The LaTeX build of {0} failed." with the actions "Open Compiler Log" and "Show Problems", as item 20 dictates.
3. Spec 3: `DESIGN.md`'s "The socket" names the `jump` message among what the socket accepts from a page, and `socket.ts`'s head comment says the same.
4. Spec 4: the `texcount_autorun` text in `config/behavior.yml` and `config/catalogs/options.yml` says it counts after each save of a LaTeX file, as the code does.
5. Spec 5: kept under Z690 (D45-3), which covers the shell's port list as it covers its row, on the `documents` precedent; each of `latex`, `latexActions`, `float` and `windows` keeps its sentence. No change.
6. Proof 2: the G35 stop test starts a second LaTeX terminal of another main before the stop, and asserts that terminal received no interrupt.
7. Proof 3: the report states that pdfjs-dist 6.4.299 has no `isEvalSupported` option (the grep) and that scripting is off because no scripting manager is given (`pdf_viewer.mjs` line), so item 10's two safety requirements hold in effect.
8. Proof 4: the report states that the `jump` socket test was a scratch file outside the tree. If the payload check of item 10 below is a guarded behaviour under an entry the brief names, write its test row there; otherwise no test, and the report says which.
9. Proof 5: the report gets the table spec.md asks for, every edit to an existing assertion, allow list or predicate, before and after, one row per changed line, made from a diff of each changed test file against the base copy.
10. Standards 1: `jump`'s payload joins `payloadShapes` (`state/client/payloads.ts`) and is parsed there, never cast.
11. Standards 2: `agents/guarded.md` G35 text for the report's "Doc text": the Code line names `pty/latex.ts`, and the Test line names every `latex` test by file and title; fold the five new `it`s into one table test where they test one unit with several outcomes, as spec.md's test rule says.
12. Standards 3: Retry, Build, the outline entries and the thumbnails in the PDF viewer are `ui/` primitives mounted with Svelte's `mount`, not raw buttons.
13. Standards 4: one `oneLine` and one bounded read with one byte limit, shared by `data/prose/latex.ts` and `server/content/latex/root.ts` (in the module the layers allow both to read).
14. Standards 5: `ask.force` reaches the server from `builds.ts`, so the "no SyncTeX file" Build forces by its own ask.
15. Standards 6: `server/content/docs.ts` `routeUrl` builds its address through `data/helpers/files/address.ts`.
16. Behaviour 1: a PDF drawn in a float, in the app's float window or a ChromeTab at `/?float=<id>`, reloads after a build of its root, keeping page, zoom and scroll. Run it in the hidden Electron script: a float page with the PDF, a build, the float's version moved.
17. Behaviour 2: `latex-state.ts` `stateOf` takes the error files and `dir` relative to the main's folder, not the output folder, with `latex.out_dir: out`; your probe shows the project panel's problem rows and Show Problems naming real files and the main's folder.
18. Behaviour 3: the status item is drawn only while the active tab is a LaTeX source with a root or the PDF of a build; a LaTeX file with no root or another PDF hides it.
19. Behaviour 4: the float's presence is held by a Web Lock (the float page holds a lock named for its float id while it lives; the main page learns of its end when it can take that lock), not a timer heartbeat, so a hidden ChromeTab is never taken back.
20. Behaviour 5: `latex.context_menu` true adds Build and SyncTeX from Cursor to the right-click menu of a LaTeX source, and false leaves them out; run both.
21. Case 5, unmet: measure `rootOf` on a warmed tree and a plain read of the same files cold, three runs each, quoted; then make the walk read each file at most once per call and stop reading as soon as the root is decided, and rerun the five runs. The 200 ms bound stays; if a cold first read alone exceeds it, the report says so with the control's numbers.
22. Proof 6: `src/lib/views/shared/latex/Outline.svelte` is staged deleted in the worktree's index. Say in the report whether you ran a git command; run none now.

After the last change: `npm run diagrams`, then `npm run test:quick` once, quoted.
