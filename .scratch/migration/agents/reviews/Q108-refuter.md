Refuter report: Q108 (oculus/migration), worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q108, base a6efe87c

I changed nothing in the worktree. The only git commands I ran were `git diff a6efe87c` and `git status --short`. I reproduced the builder's runs on a copy of `tools/oculus` outside the worktree, at /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/q108r/oc. The copy was made with rsync, which left out `config/local.yml`, `node_modules` (symlinked instead), `build`, `docs`, `demo` and `.scratch`. Main's `zones.ts` and `Jobs.svelte` were restored in that copy by `patch -R` of `git diff a6efe87c` for those two paths.

## 1. Verification lines

`git status --short` gave the same 20 lines before and after `npm run diagrams`, and the four diagram files stayed staged with no worktree change (` M` did not appear on them). The diagrams run changed nothing the builder left.

`PATH=... npm run diagrams`, then `PATH=... sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, from `tools/oculus` in the worktree. These are the lines filtered with grep:
```
$ npm test
 Test Files  349 passed | 19 skipped (368)
      Tests  5329 passed | 563 skipped (5892)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790790406536 COMPLETED 2473 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 14.28s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
My pipe did not capture the exit status (`${PIPESTATUS[0]}` printed empty under sh). The pass line printed.

Brief verify 2: `npx vitest run tests/ui/controls/editor tests/views/system/hpc.test.ts tests/shell/workbench.test.ts tests/ui/theme/colours.test.ts` gave `Test Files  12 passed (12)` and `Tests  160 passed (160)`. This matches the report.

Brief verify 3: `sh utils/folder-check.sh` gave `folder-check exit 0`. `ls tests/ui/controls/editor | wc -l` gave `7`: chords.test.ts, gutter.test.ts, kit, monaco-diff.ts, monaco-sources.ts, tab-out.test.ts, zones.test.ts. `kit/` holds grammars, look, paint, platform and theme `.test.ts`.

Brief verify 4, the first runs reproduced on the scratch copy with main's `zones.ts` and `Jobs.svelte`: `npx vitest run tests/ui/controls/editor/zones.test.ts tests/views/system/hpc.test.ts --reporter=verbose` gave `Tests  6 failed | 34 passed (40)`, the same as the report.
- Passed: case 1, case 5, case 13, case 14.
- Failed with the messages the report quotes:
  - case 2: `expected [] to deeply equal [ [ 1, 28 ] ]`
  - case 3: `expected [] to deeply equal [ [ 1, 28 ], [ 5, 28 ] ]`
  - case 4: `expected +0 to be 1`
  - case 11: `expected '54px' to be '-1000px'`
  - case 12: `expected [] to deeply equal [ [ 1, 28 ] ]`
  - case 6: `expected -1 to be greater than -1`

Case 7, three runs in the scratch copy, each with `npx vitest run tests/shell/workbench.test.ts -t "marks the drop in the one pane"`:
- New form: `Tests  1 passed | 52 skipped (53)`.
- Tabs.svelte line 269 removed: `AssertionError: expected [] to have a length of 1 but got +0`, `Tests  1 failed`.
- Line 252 removed: `Tests  1 passed`.
- Old regex `/class="mark[^"]*"/g` restored: `AssertionError: expected [ ...(4) ] to have a length of 1 but got 4`, `Tests  1 failed | 52 skipped (53)`.

This matches the report, including its correction that the rendered case reaches line 269 and not line 252.

Case 8 on the unchanged tree: the five kit tests, placed back at the old depth in `tests/ui/controls/editor/` of the scratch copy (grammars, paint and theme rebuilt from the deleted lines of `git diff`; look and platform with their imports taken one level up), gave `Test Files  5 passed (5)` and `Tests  31 passed (31)`, as the report says.

The moved files differ from their originals only in import paths. `diff` of each rebuilt original against `kit/<name>.test.ts` showed only the `../` depth, the `../monaco-sources.ts` and `../../../../checks/look/themes.ts` imports in theme, and Prettier's wrap of the grammars import.

## 2. Verdicts

Items:
1. `zones.ts`: holds. `room()` sets `OUT_OF_SIGHT`, returns while `getModel() === null`, and otherwise adds a zone of `max(offsetHeight, height)` (zones.ts:79-95). `mount` subscribes `onDidChangeModel`, clears `entry.zone` and re-runs `room` for each held bar that has a widget (:114-119). `unmount` disposes it (:126-127). The file is 142 lines.
2. `zones.test.ts`: holds. The fake's `changeViewZones` returns while `model === null` (:50). `model(next)` clears the zones and fires the listeners (:81-85). This matches Monaco: `codeEditorWidget.js:1203-1206` has the early return, and `:370-395` fires `onDidChangeModel` for a null model as well as a real one, after `_attachModel`. The fake numbers zone ids with one counter, so an id is never reused; Monaco's ids carry a per-layout instance prefix (`linesLayout.js:60,144`), so they are unique too. The head comment's lines 8-9 name what the file does not cover. Cases 1-5 and 11-14 are present. See the Proof findings on case 13.
3. `Jobs.svelte` through `Empty`: holds for the code (Jobs.svelte:46, and the head comment at :3). The proving test is partial; see the Proof finding.
4. `workbench.test.ts`: holds (workbench.test.ts:809-811). The three runs were reproduced.
5. The five kit tests moved: holds. `colours.ts:12` and `colours.test.ts:611` name `tests/ui/controls/editor/kit/theme.test.ts`. The range `:160-178` is correct: the comment is at 160 and `});` at 178. The old `158-176` was already two lines off, and the line numbering did not change in the move.
6. `docs/diagrams/`: holds. `npm run diagrams` left the four files as the builder had them.

Cases:
1. Met (an audit; it passes on main).
2. Met.
3. Met.
4. Met.
5. Met (an audit).
6. Partial. The presence half is met and fails on main. The absence half cannot fail (Proof 1).
7. Met.
8. Met.
9. Not verifiable. It is the orchestrator's look on TEST at landing.
10. Not verifiable. It is the orchestrator's look on TEST at landing.
11. Met.
12. Met.
13. Partial. The widget-gone and no-throw assertions are met. The "no `removeZone` call" assertion cannot fail on the faithful fake (Proof 2).
14. Met (an audit).

## 3. Spec

None.

## 4. Proof

1. The absence half of case 6 is vacuous.
   - Place: tests/views/system/hpc.test.ts:180-181.
     ```
     // the cluster answers and the queue holds a job, so no list in the body is said to be empty
     expect(queued).not.toContain('class="empty"');
     ```
   - What is wrong: Svelte scopes Empty's class, so a rendered `Empty` prints `class="empty svelte-dorw7t"` and never the literal `class="empty"`. The presence half of the same test already allows for the hash with `/class="empty[\s"]/`. The absence check therefore passes whether or not `Empty` is drawn beside a queued job.
   - Failure scenario, run on the scratch copy: I changed Jobs.svelte:46 to `{#if rows.length === 0}<Empty message={t('hpc.no_jobs')} />{:else}<Empty message="probe-mutant" />`, and had the test write `queued.match(/class="empty[^"]*"/g)` and `queued.includes("probe-mutant")` to a file. The file held `[["class=\"empty svelte-dorw7t\""],true]`. The case still printed `Tests  1 passed | 30 skipped (31)`. An `Empty` drawn in the one-job queue would reach main unseen.
   - Fix: use the same pattern as the presence half, for example `expect(queued.search(/class="empty[\s"]/)).toBe(-1)`, with the reason comment kept above it.
   - Verdict: case 6 partial. Item 3's proof is short.

2. The "no `removeZone` call" assertion of case 13, and the zone reset in the listener, are covered by nothing that can fail.
   - Place: tests/ui/controls/editor/zones.test.ts:240, `expect(fake.removed).toEqual([]);`, and zones.ts:116, `entry.zone = null;`.
   - What is wrong: the fake records `removeZone` only inside `changeViewZones`, which returns at once while the fake holds no model. Case 13 removes the bar under a null model, so `removed` stays empty even if `remove()` passes a stale zone id.
   - Mutation run on the scratch copy: deleting zones.ts:116 (`entry.zone = null;`) left `Tests  9 passed (9)` in zones.test.ts.
   - Weight: low. Monaco behaves the same (`changeViewZones` is a no-op without a model), and its zone ids are unique per layout instance (`linesLayout.js:60,144`), so a stale id cannot remove another zone. The line has no effect that can be observed, and no test pins it. The report calls case 13 an audit, which is accurate for the widget-removal and no-throw parts. The "no removeZone call" part is not coverage.
   - Verdict: case 13 partial.

The fake editor: I found no way for the tests to pass against a fake Monaco does not match.
- The fake refuses zones without a model (`:1203-1206`).
- It drops the zones on every model change, including null. Monaco disposes the view in `_detachModel` and fires `onDidChangeModel` in both branches (`:381-395`).
- It keeps the overlay widgets. Monaco re-adds them to each new view (`:1412`) and holds them in `_overlayWidgets` while there is no model.
- One difference: the fake fires on a second `model({})` with a new object, and Monaco returns early only when given the same model object (`:370-373`). The tests always pass a new object, so this changes no result.

## 5. Standards

None.
- The perl ASCII gate over every changed file and the report printed nothing (`ascii exit 0`).
- No step id or date appears in the comments (`grep -rn "Q108\|2026-"` over zones.ts, zones.test.ts and Jobs.svelte printed nothing).
- The files are 142, 255, 429, 848 and 126 lines.
- A grep for the old test paths (`controls/editor/(look|platform|grammars|paint|theme).test`) across src, tests, config, DESIGN.md, HELP.md, README.md, docs and utils printed nothing. The only hits for `tests/ui/controls/editor` are the two updated comments and `tests/views/sources/source.test.ts:7` ("its pure parts are tests/ui/controls/editor/"), which stays true because `kit/` is inside that folder.
- The slow tag moved with `kit/theme.test.ts`. `vite.config.ts:32` includes `tests/**/*.test.ts` and names no path.

## 6. Behaviour

None beyond what the report states.
- The merge editor's bars and the empty-queue line are given before and after.
- The diff pane (`DiffEditor.svelte`) is unchanged in behaviour: it calls `made.setModel(pair)` at :153, before `placed.mount` at :165, and calls `setModel` nowhere else (`grep -n setModel` gives :153 and a `setModelLanguage` at :270). The new listener therefore never fires there after the mount.
- The only `Editor` caller that passes `bars` is `MergeSide.svelte`.

## 7. Declined to judge

- Cases 9 and 10 are looks on TEST, taken by the orchestrator at landing. I opened no browser.
- The exit code of checks.sh. The pipe through grep did not capture it; the pass line `checks: 7 commands passed` printed.
- The report's open-items section. It is copied from the worktree's state file, which is the base copy and lists only Z103. Main's state file names Z105 as open as well (orchestrator-state.md:538). The builder could not read main's copy, so I did not count this as a finding.

## 8. Usage

Usage: claude-opus-5-5 (served, read from the transcript), 152,342 tokens, 37 tool uses, 13.3 min.
