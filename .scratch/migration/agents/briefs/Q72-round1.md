# Q72 round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/Q72.md`, which stay in force except where this file says otherwise. This round is built on the worktree `.agents/worktrees/Q72` as round 0 left it (`git diff e36bcd0b4 | shasum` begins `c0b3265d9acb`, 54 paths in `git status --short --untracked-files=all`, when the round was sent). The review is `agents/reviews/Q72-refuter.md` in the main checkout's ledger; read it whole before changing anything. Every finding below names its place there.

No script of your own: every probe is a one-line `node -e` (or a test of the step), and every edit is made with the edit tool, never by a Perl, shell or Node program that rewrites a file.

## What to change

1. **The character changes of git's blocks are computed off the page's thread (Behaviour 1; item 3).** `gitDocumentDiff` (`src/lib/ui/controls/editor/diff/git-provider.ts:140-175`) runs `DefaultLinesDiffComputer.refineDiff` on the page's main thread, which the review measured at 1390 ms for a 500-line rewritten block and 166903 ms for 5000 lines, freezing the page while a diff opens. Move that computation into a web worker of its own: a Vite `?worker` module beside `git-provider.ts` (as `kit/workers.ts` builds Monaco's workers), started once per page by the kit, never in a server bundle and never on a page that opens no diff editor. The page sends the two line lists and the runs; the worker answers, per run, the character ranges `refineDiff` finds as plain numbers; the provider builds the `RangeMapping` and `DetailedLineRangeMapping` objects from them and answers Monaco asynchronously. Keep what the diff editor sets today: its `maxComputationTime` is 0, so no timeout is added, as Monaco's own worker diff has none here. A worker that fails or answers a malformed reply makes the provider answer Monaco's own diff for that request. A request superseded by a newer `computeDiff` of the same editor (the texts changed meanwhile) must not draw the older answer over the newer: check the held texts again when the worker answers, and answer Monaco's own diff when they no longer match. The head comments of `git-provider.ts`, the new worker module and `kit/load.ts`, and `src/monaco-modules.d.ts`'s declarations, say what is true after the change. State the change in the report's host-visible changes with its before and after (the 500-line and 5000-line blocks measured again with the same `node -e` the review used, now off the page's thread, and the page's thread time of a `computeDiff` on such a block, measured with stand-ins as case 21 was).

2. **Providers are forgotten with their editor (Standards 2; item 3).** `asked` (`git-provider.ts:187`) loses an entry only in `dispose`, which Monaco's `DiffEditorViewModel` never calls, so it grows by one entry per diff editor for the page's life. When `hold(model, null)` is called (DiffEditor.svelte calls it as the editor is destroyed), the providers whose last computed model is that URI are dropped from `asked` after they are fired, and the listeners they hold are cleared. A provider made but never asked to compute holds no entry beyond its first computation. Show it with a run of `createGitDiffs` with stand-ins, quoted: two providers made, both asked to compute, one model released, `asked`'s size before and after (read through a test-only path you do not export, or by counting fires).

3. **The stale comment of the G25 describe (Standards 1; item 2).** `tests/checks/diagrams/diagrams.test.ts:836` says the router keeps other arrows off a node of words; for the channel and write diagrams `utils/diagrams/drawing/apart.mjs` draws the arrows, and the comment says so.

## Not sent back, and why

- Spec 1 (the builder's scripts): raised to the user as an open item. Nothing those scripts produced is used: case 8's ends are checked by the look at landing, and the Q71 comparison stays in the report as it is, without bearing any decision. The edits the Perl programs made to `graphs.mjs`, `DESIGN.md` and the report are in the diff, which the orchestrator and the reviewer read hunk by hunk.
- Spec 2 (three files outside the write list): each is needed and named in the report; accepted.
- Proof 1 (three `test:quick` runs): no change; this round runs `npm run test:quick` once, after its last change.
- Proof 2 (the unused-exports line): accepted, the same case as `kit/workers.ts: workerFor` on the base's list, an export read only through `import()`. A new worker module or a moved export may change that line; the report quotes the diff against the base's list and names each line's importer.
- Proof 3 (the barriers): the three checks hold for today's code, where every path that could end a terminal or submit an edit is synchronous up to the post; no change.

## Verify before you report

From `tools/oculus` in the worktree, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`:

- `npm run lint` (exit 0), `npm run format:check` ("All matched files use Prettier code style!"), `npm run check` (0 errors, 0 warnings).
- `npx vitest run tests/checks/diagrams tests/checks/source/comment-width.test.ts tests/checks/imports tests/checks/tree tests/checks/source/history.test.ts --testTimeout 0 --hookTimeout 0` (all pass).
- `npx vitest run tests/server/git/git-ops.test.ts` (17 pass) and any test file you add or change, by file.
- `sh utils/folder-check.sh`, `sh utils/size-check.sh` (print nothing), `sh utils/unused-exports.sh` against `.agents/worktrees/Q72-base/unused-exports.txt` (as Proof 2 above says).
- The ASCII gate of the rules file over every file this round changes.
- `npm run test:quick` once, after the last change.

Builders never start Electron, the app, a browser or a server.

## Paths this round writes

- `tools/oculus/src/lib/ui/controls/editor/diff/git-provider.ts`
- `tools/oculus/src/lib/ui/controls/editor/diff/` one new worker module
- `tools/oculus/src/lib/ui/controls/editor/kit/load.ts`
- `tools/oculus/src/lib/ui/controls/editor/diff/DiffEditor.svelte` (only if item 1 or 2 needs it)
- `tools/oculus/src/monaco-modules.d.ts`
- `tools/oculus/tests/checks/diagrams/diagrams.test.ts`
- a test file for items 1 and 2, if the rules file's test rule calls for one (say which, or why none)
- `tools/oculus/.scratch/migration/agents/reviews/Q72-report.md` (a section "Repair round 1" appended, in the shape of the brief's report: each item with its first run on the round-0 tree, its after run, and the verify lines)
