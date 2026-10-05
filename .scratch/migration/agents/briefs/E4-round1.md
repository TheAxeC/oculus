# E4, repair round 1

The review of your build is `agents/reviews/E4-refuter.md` (main checkout ledger; read it whole first). Each item below names the finding it closes and says what to change. Axel ruled on three of them (plan.md Z583 to Z585). Your brief `agents/briefs/E4.md` and the rules file `agents/spec.md` still hold in full; this round widens your paths only where an item says so. Line numbers are the reviewer's, read on your worktree as it stands; check each with `grep -n` before you change it.

Never use breakage testing of any kind: no mutation, no revert or removal of code to watch a test fail, no injected fault, no scratch copy with a block removed. A test is judged by reading it. You run no git command.

## Items

1. **E4-1, ruled (c) (review S5, case C64).** An app's `open({ file })` that adds a pane must not reload the app. Today the layout change redraws the pane holding the app, the browser reloads the iframe, and the app's call rejects `CONNECTION_DESTROYED`. End the cause for every frame: an iframe is never moved or recreated in the DOM by a layout change, because moving an iframe element reloads its document.
   - Draw the app frames (and every other view frame you find drawn inside a pane, named in your report) in one layer outside the pane tree, keyed by the tab's id, each positioned over the slot its pane draws for it, and hidden while its tab is not on screen. A pane draws only the slot. A frame is removed only when its tab closes or its app reloads on purpose.
   - The paths widen to `src/lib/shell/panes/` and whatever file holds the new layer, each named in the report with why.
   - `open` then resolves as the section says ("resolves once it has"). DESIGN.md:327's sentence stating the defect is replaced by the behaviour as built.
   - Case C64 passes with its run in the report: an app on a page with one pane opens a file, the pane is added, the app's in-memory state survives, and the call resolves.
2. **E4-2, ruled (a) (review S1).** The policy keeps `frame-ancestors <host>`. DESIGN.md:298 and :301 say `<host>` and give the reason in one sentence: behind adapter-node the request's protocol defaults to https (`handler.js:210`), so an origin built from the request could name the wrong scheme.
3. **E4-3, ruled (a) (review S2).** `list_shape` and `file_unreadable` stay, and DESIGN.md's list of what refuses an app names both.
4. **Review S3.** DESIGN.md:319's list of words gains `not_json`, and says that a write of an undeclared kind rejects `not_declared` too.
5. **Review S4.** DESIGN.md:325's Closed write list names `roots`; DESIGN.md:321 and :339 name `processes` among the closed channels and the `carries` list, matching `data/helpers/files/apps.ts:80`.
6. **Review T8.** DESIGN.md:319's `refused:<reason>` sentence says where each reason comes from: the `reason` of the `refused` list of a 200 answer (`methods.ts:159`), and `kind` from a 403 of any app write.
7. **Review T7.** HELP.md:205 drops "and it cannot ask for the app store as a write", since no app can.
8. **Review B1 (case C38).** `Document.svelte:141` finds the link without `instanceof Element`, which is false for an element of the frame's own realm: test the node's shape (`'closest' in target` on an object, or `target.ownerDocument.defaultView.Element`). The run of C38 is in the report: a manual's external link opens outside the frame.
9. **Review B2 (case C101).** `AppFrame.svelte:213` reads the theme from reactive state, so the frame's `color-scheme` follows a theme change while the app stays mounted. The report gives the change and the look state to check.
10. **Review B3 and S6.** One rule resolves a root key on the page: the current workspace's roots only, as the server's `addedRoots` (`server/files/fs.ts:299-302`) does. `context.ts:466` (`served`, used by `apps.svelte.ts:176`, `:202`, `:295`) and the Repositories `served` at `context.ts:364-369` both use it, from one function. The report gives the Repositories change with its before and after.
11. **Review B4.** `scan.ts:120-137` reads `app.yml` once: the bytes read are parsed and hashed, so the permissions shown and the hash approved come from the same bytes.
12. **Review B5.** `store-cache.ts:77` and `:81` reject `missing` only for a 404 or a row that is gone; any other failure rejects with a word for a failed read that DESIGN.md:319 names. `AppFrame.svelte:100-110`: a second `confirm` while one is open waits for the first or is refused, so no write's promise is left unsettled; the report says which and why.
13. **Review T3.** The 405 branches at `routes.ts:141` and `:152` are removed, since SvelteKit answers a POST to a GET-only route itself; the two 'answers a POST with 405' tests go with them.
14. **Review T4.** `holds` is required in `opening.ts:32`, `:46` and `:60`.
15. **Review T5.** `APP_HEADER` and `KIND_HEADER` live in `data/helpers/files/apps.ts`, and `app-gate.ts` and `writes.svelte.ts:491` both import them.
16. **Review T6.** The comment at `tests/data/sources/config/settings.test.ts:5` is one line again.
17. **Review T1 and T2, the tests.** Each unit gets exactly the test your brief names (E4.md:241-258), under that title verbatim: one `it.each` table, one row per input that gives a different outcome, holding the cases that brief line lists. Every other test the diff adds is deleted:
    - the 18 separate tests in `manifest.test.ts`, the separate tests of `app-files.test.ts`, `approve.test.ts` (except G1's 'refuses a request without the write token'), `app-store.test.ts`, `app-open.test.ts`, `app-gate.test.ts`, `methods.test.ts`, `store-cache.test.ts` and `opening-apps.test.ts`, folded into their file's one table where the case is one the brief line lists, deleted otherwise;
    - `tests/server/edit/app-store.test.ts` becomes one table for the `app-store` write kind (C49 to C51, C98);
    - `settings.test.ts` keeps one `appsSettings` case; `local.test.ts` keeps only the `checkLocal` row; `local.test.ts:118` and `file.test.ts:102` are deleted;
    - `methods.test.ts:289`'s 20 ms sleep is replaced by a fake clock or by waiting on a signal (`agents/spec.md:64`).
    - Item 1 adds one row to the app-open or methods table only if C64's outcome is a unit's outcome there; otherwise C64 is a run the report quotes.
18. **Review P2 (M4).** Rerun M4 with the probe recording its own click (the time it clicked and what the click returned) before the net log is read, and quote both runs.
19. **Review P1 and P3, the report.** The report gains the table `agents/spec.md:59` requires: one before/after row per changed line of an existing assertion, allow list or fixture (`config.test.ts:375-378`, `boundaries.test.ts`'s `ALLOWED.state`, `config-folder.test.ts`, `tests/checks/imports/order.ts`), made from a diff against the base copy. "Judgment calls" lists every choice you made that the brief did not: the `<host>` policy, the two finding keys, the Repositories rule, the fixture edit, and whatever this round adds.

## Verify before you report

The brief's list, once, after the last change: from the worktree's `tools/oculus`, `bash ~/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, the lines it prints quoted. While working, run only the test files you changed. A command that fails is rerun alone, then the full list once more.

## Report

Append "# Repair round 1" to your report in the worktree's ledger copy (`tools/oculus/.scratch/migration/agents/reviews/E4-report.md`): one row per item above, DONE or NOT DONE with the command or reading that shows it, NOT DONE first; then the runs of C38, C64 and M4; the P1 table; the judgment calls; each new test by file and title; the verify lines.
