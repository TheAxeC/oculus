# D40 landing report

Position: the oculus migration plan; D40, the writing rules as editor marks, landed on main. Nothing is in flight. Next: D41 (links in Markdown checked), once Axel rules on open item 23.

## Open items (Axel's to rule on)

- 22. The rename box has no hint line naming Cmd+Enter. (a) Recommended: a new step D39b that draws it by replacing Monaco's edit service, one internal Monaco import. (b) Leave it, the lazy option.
- 23. D41's library for Markdown links. (a) Recommended: Microsoft's Markdown language server as one more served language. (b) Its language service inside the oculus server. (c) Hand-written, the lazy option.

## The check of Steps 1

`ListAgents` lists no subagent of this session; the builder a55bd9e7057d5d802 and both reviewers had finished.

## NOT DONE

Nothing of D40's brief or its repair round is left undone.

## What landed

The linter `writing` ("Writing rules"), run by D36's `POST /api/lint` on `.md` and `.yml` files and on code comments and Python docstrings. Each banned character (em dash, en dash, curly quote, ellipsis, arrow, no-break space) and each Markdown paragraph broken across lines is a warning in the editor and the Problems view, with its automatic fix; the em dash gets comma, colon and semicolon suggestions; the arrow is fixed to `->` or `=>` with ` to ` as a suggestion. No mark or fix falls in code, code spans, URLs or front matter (G71). The settings `lint.writing`, `lint.writing_skip` and `lint.writing_glyphs`. The folder Fix All from the Files view's folder menu: a dialog listing each file with its count of fixes and a box ticked by default, "Fix N Files", one History record "Fixed by the writing rules in N files" with its undo. The plan and the write refuse the hub's `secrets` folder and `~/.oculus` in any letter case, leave out a file over 2 MB unread, and give the readers no file over 256 KB.

## What was found, and the fixes at landing (9)

- R1-B1: a path naming `secrets` in another letter case passed the private-folder checks on this machine's case-insensitive disk. `under` (`server/core/paths.ts`) now compares the system's own spelling of the path; a G3 test row covers the plan and the write.
- R1-B2: the folder plan read files of any size. It now stats first, leaves out a file over 2 MB, and searches a file over 256 KB for the characters only.
- R1-Sp1: G3's title narrowed to what is true (the folder Fix All reads no private file; the tab lint reads the file the page shows).
- R1-Sp2: the comment worker's request queue now catches, so one bad message does not end the thread.
- R1-S1, R1-S2, R1-S3: a test head comment, `DESIGN.md:166` with `docs/files-and-search.md`, and the `CommentFailure` doc made true.
- The merge with D39: a `writing-fix` file between 256 KB and 5 MB would have been written with no History copy; `lsp-edit.ts` now takes each operation's copy limit (`copyLimit` in `history.ts`).
- The look: the dialog's Fix button stretched across its row; it now sits beside Cancel at the width of its words.

The builder's first report did not pass its bar: the first review's findings went in repair round 1.

## The look (8796 scratch oculus served from the gate)

- `look.md` in the editor: squiggles on the ellipsis, the em dash and the broken paragraph; "Writing rules" in the status bar; a problem count of 3.
- Quick Fix on the ellipsis: "Replace the ellipsis character with three periods".
- Quick Fix on the em dash: "Replace the dash with a comma", "... with a colon", "... with a semicolon".
- Quick Fix on the paragraph: "Join the paragraph's lines".
- The folder menu on `lookdocs`: "Fix All Writing Problems in Folder...". The dialog: "Fix writing problems in lookdocs", `look.md` 2 fixes and `look.yml` 1 fix, both ticked, "Fixes: 3. Files: 2.", "Fix 2 Files"; unticking `look.yml` gave "Fixes: 2. Files: 1." and "Fix 1 File".
- Fix 2 Files: `look.md` became "Wait... and see <em dash> a dash." with the paragraph joined, the em dash left for a choice; `look.yml` became `title: Hello...`; the notice "Fixed writing problems in 2 files."; the problem count went to 1.
- History: "Fixed by the writing rules in 2 files" on `lookdocs/look.md`.
- Light theme only; the step changes no theme.

## Verification

Gate `.agents/worktrees/gate` at 8964aa96e with D40's range and the fixes, `npm run diagrams && npm run test:landing`, last run:

```
ok      ASCII gate (1.0 s)
ok      npm run lint (13.1 s)
ok      npm run format:check (20.9 s): All matched files use Prettier code style!
ok      npm test (143.8 s)
ok      npm run test:checks (244.3 s)
ok      npm run check, then npm run build, then npm run test:slow (264.0 s)
test:landing: 264.0 s; every command passed
```

The run before it was red on `test:checks` (`boundaries.test.ts`, 'lets no view or shell component style a primitive own class') on the first form of the look's fix; the fix now uses the dialog's own box. Main's staged diff is `cmp`-equal to the gate's: 76 files, `docs/` compared by index blob. The A/B: no `bench:` line, none run.

## Agents' usage

- Builder a55bd9e7057d5d802 (claude-sonnet-5-5): first run 325,520 tokens, 62 tool uses, 7.5 min (stopped on case 20); after the cases ruling 322,044 tokens, 419 tool uses, 106.5 min; round 1 106,613 tokens, 178 tool uses, 39.3 min.
- Brief drafted by a4320b81ef592a759 (claude-opus-5-5): 194,634 tokens, 153 tool uses, 27.6 min.
- Brief check a2cb4c691ca4ee98c (claude-opus-5-5): 296,952 tokens, 97 tool uses, 18.4 min; closed inline by the orchestrator.
- Reviewer aed703dd3c0db8631 (claude-opus-5-5): 228,936 tokens, 141 tool uses, 27.7 min.
- Reviewer over round 1 ad2bb43bc6176eed2 (claude-opus-5-5): 334,553 tokens, 100 tool uses, 28.7 min.

## Next

D41 after Axel's ruling on open item 23; D39b if Axel rules (a) on open item 22. Q72, R2, O29 and O33 to O36 stay paused by Axel.
