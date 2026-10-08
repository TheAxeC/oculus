# D33 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration), step D33, the Problems view. Next: the briefs of M6, D39 and D43, each with its brief check, then M7, D41, D36 and D40.

## Open items

- Open item 11 (2026-10-08), D33's case 8 tests (a removed root takes its rows with it): the fix at landing (Z728) carries two test files, `tests/state/sessions/served-roots.client.test.ts` (six rows) and `tests/state/sources/workspaces-real.test.ts` (two rows), kept as `agents/reviews/D33-case8-tests.patch` and out of the tree. No entry of `agents/guarded.md` covers them. (a) A guarded entry G69 with these two files as its test; (b) no entry, the fix resting on the quoted run and the look, the lazy option. Recommended: (a).

## Not done

- The two case 8 test files are not on main until open item 11 is ruled.
- The look ran on a scratch oculus on port 8796 served from `.agents/worktrees/gate`, with the gate checkout as its hub, and not on TEST: the 8790 server runs main's code and needs a restart before D33 is seen there. Not verified on 8790.
- Case 8's command and LaTeX rows were checked by the unit run, not on the page; the page showed the language-server rows leave.

## The check of Steps 1

The builder a9ae1281ebf50855a was stopped at Axel's ruling Z728 (the stop tool answered "Successfully stopped task"), and both reviewers had completed; the agent listing showed the builder killed and no agent running.

## What landed

From base 1439a44ec, 113 files with the fixes at landing: one problems store folding the language servers' diagnostics, the errors of project commands and the LaTeX builds' errors and warnings; the Problems view (`s8`) with its filter, toggles, root scope and table; Cmd+Shift+M and the status bar's item toggling it with its state kept per page; F8 and Shift+F8; the marks in the Files tree, Open Editors and the tab strip; command markers in the editor; the card cursor of the Audit, Cards and lane views and its reload; the windowed list never read past its end, with G65's test (`tests/ui/tree/list/virtual-rows.client.test.ts`, `ShrinkingRows.svelte`, `mini-dom.ts`).

## What was found, and the fixes at landing

The builder's first report did not pass its bar; round 1 was sent from the first review. The review over round 1 found five findings and confirmed case 8 unbuilt. Round 2 (Z727) was stopped at Axel's ruling Z728, and case 8 was fixed at landing. Six fixes at landing (`agents/reviews/D33-refuter.md`, "Closed"):

- R1-1: the status bar's Problems item names the page as the key does, so a view hidden by one and shown by the other keeps its filter.
- R1-3: `RowEntry` is local.
- R1-4: both places the language server's marker owner is built are named in their comments.
- Case 8: a root that leaves the served roots takes its command and LaTeX rows with it in the stores' own state, nothing is forgotten while the roots are not read, and each root is compared by its real folder, which the workspaces answer now carries.
- The language client kept a file's diagnostics in the page's store after its server failed or the client disconnected, since `#forget` counted the entry itself as another holder; `#drop` in `client.ts` now takes them.
- The comment-width red line at `served-roots.svelte.ts:9`.

R1-2 (an edited run line in the report) and R1-5 (two read-only git calls) needed no code.

Run of `tests/state/sessions/served-roots.client.test.ts` in the gate:

```
before the removal of root a
  command /w/a src/x.ts
  command /w/b/nested src/y.ts
  command /w/b /etc/z.c
  latex a main.tex
  latex b main.tex
after the removal of root a
  command /w/b/nested src/y.ts
  command /w/b /etc/z.c
  latex b main.tex
after the roots list went empty while the workspaces were read again
  command /w/a src/x.ts
  command /w/b/nested src/y.ts
  command /w/b /etc/z.c
  latex a main.tex
  latex b main.tex
after the removal of root b, root link served through a symlink
  command /data/real src/x.ts
  command /data/real/inner src/w.ts
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

Two look findings outside D33, booked as Step 0 of the steps that touch their code:

- D43: when a root leaves the served roots while a source tab of it is open, the code-action request throws `Error: the document is not open`, uncaught in the console.
- M7: a source tab whose root left the served roots says "The file was deleted on disk; Save writes it again." while the file is still on disk.

## Verification

Gate in `.agents/worktrees/gate` at 67d8ea582:

```
ok      ASCII gate (1.6 s)
ok      npm run format:check (21.3 s): All matched files use Prettier code style!
ok      npm test (97.1 s): Duration  93.56s (transform 20.49s, setup 0ms, import 271.87s, tests 72.70s, environment 191ms)
ok      npm run lint (163.5 s): > eslint . --cache --cache-location node_modules/.cache/eslint/
FAILED  npm run test:checks (223.7 s)
ok      npm run check, then npm run build, then npm run test:slow (287.6 s): Duration  167.91s (transform 15.06s, setup 0ms, import 124.42s, tests 218.49s, environment 132ms)
```

The `test:checks` failure was one comment line past column 100 at `src/lib/state/shared/stores/served-roots.svelte.ts:9`, rewrapped; `npm run test:checks` rerun alone gave "Test Files  17 passed (17)" and "Tests  248 passed (248)". The staged diff on main equals the gate's (`git diff --cached HEAD -- tools/oculus ':!tools/oculus/.scratch' | shasum` gives 56bff8cf in both), before the two case 8 test files were taken out.

## The look

On the 8796 scratch oculus, with its own home folder, nothing written outside it:

- Problems view by Cmd+Shift+M: "No problems have been detected in the workspace." with the filter, the three Show toggles and the table control.
- The filter "broken" typed, the view hidden by the status bar's item, shown by Cmd+Shift+M: the filter box reads "broken". After a reload the view and its filter came back.
- A scratch workspace with a folder `extra` holding `pkg/broken.py`: pyright ready, the status bar 2 errors and 1 warning, the file red with its count 3 in the tree and its folders marked, 3 on the Problems tab, the squiggles in the editor.
- Remove Folder from Workspace on `extra`: the status bar 0 and 0, the marks gone from the editor and the tree, and the Problems view empty.

## Usage

- Builder a9ae1281ebf50855a (claude-sonnet-5-5): first run 247,889 tokens, 760 tool uses, 226.6 min; round 1 312,919 tokens, 198 tool uses, 33.5 min; round 2 stopped, no usage notice.
- Brief check a0a67ffbec5451994 (claude-opus-5-5): 335,815 tokens, 131 tool uses, 19.6 min.
- Diagnosis aecfa0b2710e743e8 (claude-opus-5-5), Proof 1: 288,280 tokens, 92 tool uses, 21.3 min.
- Reviewer a4557dd5285730c0d (claude-opus-5-5): 369,712 tokens, 90 tool uses, 20.7 min.
- Reviewer over round 1 aba7f4b62b7054a8f (claude-opus-5-5): 334,877 tokens, 113 tool uses, 18.7 min.

## Next

The briefs of M6, D39 (with G66 to G68) and D43, each with its brief check; then M7, D41, D36 and D40.
