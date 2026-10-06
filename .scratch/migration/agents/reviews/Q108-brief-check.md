# Brief check: Q108 (oculus/migration), brief `tools/oculus/.scratch/migration/agents/briefs/Q108.md` (uncommitted), main at 3865a849

I changed nothing in the repository. For check 3 I made scratch copies outside the repository, under `/private/tmp/claude-502/.../scratchpad/q108/`: main's `zones.ts`, a copy with the patch's `zones.ts` hunk applied by `patch`, the patch's `zones.test.ts` pointed at each copy, and a symlink to `tools/oculus/node_modules`. The only git commands I ran were `git log`, `git status --short` and `git grep`. I checked that the patch applies cleanly without running `git apply`, by hashing each file's git blob with `shasum`.

## 1. Names

Commands, from the repo root:
- `git grep -n -I <name> -- . ':!tools/oculus/.scratch'`, run for `look\.test`, `platform\.test`, `zones\.test`, `controls/editor/zones`, `zones\.ts`, `onDidChangeModel`, `no_jobs`, `OUT_OF_SIGHT`, `lineBars` and `LineBars`.
- The same grep under `tools/oculus` for `tests/ui/controls/editor`, `editor/look`, `editor/platform`, `editor/kit`, `kit/look`, `kit/platform`, `hpc/Jobs` and `Jobs\.svelte`.
- A python scan of DESIGN.md, HELP.md and README.md for `queue`, `Accept bar`, `bars above`, `hunk bar`, `conflict bar`, `Empty` and `empty state`.

Hits outside "Paths this step writes":

1. `onDidChangeModel`, `zones.test`, `editor/look`, `editor/platform`, `kit/platform`: no hits outside the moved files themselves.
2. `hpc.no_jobs`:
   - `tools/oculus/config/text/views/system/hpc.yml:52` (`no_jobs: No jobs in the queue for you right now.`) stays true, since the key is still read.
   - `tools/cockpit/assets/js/cockpit/07-slurm.js:153`, `tools/cockpit/data/config/text.yml:175` and `tools/cockpit/dummy/data/config/text.yml:166` are the frozen cockpit's own key. The change does not touch them.
3. `zones.ts` is named in head comments at `DiffEditor.svelte:12`, `Editor.svelte:27` and `LineBars.svelte:2-5` ("moved into the editor by zones.ts's `above`, which gives it a place of its own above its line"). All stay true. The `zones.ts` head comment (lines 1-10, "an empty view zone above the line keeps the room ... moved to the zone's top on every render") also stays true. Line 28, "placed once it exists", stays true for the widget.
4. `room` has one unrelated hit, a local `const room` at `Editor.svelte:188`.
5. `lineBars`/`LineBars`: callers `Editor.svelte:54,156,411` and `DiffEditor.svelte:32,118,341`, plus `tests/views/whole/type-scale.test.ts:286`. None is made false.
6. `Jobs.svelte`:
   - `Hpc.svelte:24` imports it.
   - `tests/views/whole/type-scale.test.ts:125` (`'system/hpc/Jobs.svelte': 'table=fs-sm'`) reads Jobs' own `<style>`, which the change leaves alone. `Empty.svelte` is already listed at `:267`.
   - None is made false.
7. Comments that name `tests/ui/controls/editor/` files that do not move stay true: `src/lib/ui/controls/editor/kit/colours.ts:12` and `tests/ui/theme/colours.test.ts:611` name `theme.test.ts`, and `tests/views/sources/source.test.ts:7` names the folder. They become false only if more kit tests move (see 3.2).
8. DESIGN.md and HELP.md: no sentence describes the empty-queue line's form or how bars are placed.
   - DESIGN.md:132, the Live HPC paragraph, says nothing about the empty queue.
   - DESIGN.md:158 lists `Empty` among the primitives.
   - DESIGN.md:389, the merge editor with its Accept choices, stays true.
   - HELP.md:135 ("The cluster queue: ...") stays true.
   - None is made false.
9. `.scratch` ledger hits (`D13c-refuter.md:223,300,319,332,350,369`, `Q83-refuter.md:358`, `D13b-landing.md:34`) name `look.test.ts` and `platform.test.ts` at their old place. They are logs of earlier steps and are not to be changed.
10. Test titles: the patch's three titles have no other hit. The workbench title is unchanged (`workbench.test.ts:793`).

## 2. The step line

`plan.md:277`: "Q108 the four fixes kept as `agents/reviews/inline-fixes-2026-09-30.patch` applied and reviewed as a step: the merge editor's bars, the Live HPC empty-queue line through `Empty.svelte`, the slow workbench case, the two kit tests moved; in full in the state file's Booked section (ruling Inline fixes patch)".

| Part of the step line | Where the brief serves it |
|---|---|
| patch applied | preparation (brief line 10) |
| reviewed as a step | the orchestrator's refute stage, outside the brief |
| merge editor's bars | item 1, item 2, cases 1-5 and 9 |
| empty-queue line through `Empty.svelte` | item 3, case 6 |
| slow workbench case | item 4, case 7 |
| two kit tests moved | item 5, case 8 |
| Booked section, `orchestrator-state.md:121` ("the four diagram files that follow") | item 6 |

Every part has an item. One finding:

1. Brief line 10 points to a section "The patch as applied" below. No such section exists (`grep -n "The patch as applied" briefs/Q108.md` hits only line 10 itself). The builder is told how the worktree was prepared by a section that is not there. Either add the section (which command applied the patch, at which base, and what `git status` of the worktree should show) or drop the pointer.

## 3. Premises

Confirmed, with the command and its output:
- Step line at `plan.md:277` and ruling at `plan.md:578` (`sed -n 277p`; `grep -n "Inline fixes patch (2026-09-30)"` prints 578). The HEAD is 3865a849 (`git log --oneline -3`).
- The patch touches ten paths (`grep -c '^diff --git'` prints 10). `zones.test.ts` in it is 121 lines.
- The patch applies cleanly. I did not run `git apply --check`, because the brief-check rules allow no git command beyond show, log, diff and status. Instead, `shasum` of `blob <size>\0<content>` for each of the nine pre-image files matches the patch's `index` line exactly (`b4671e0c`, `13784e63`, `7408107f`, `d300e76e`, `ca08b166`, `e7650ff6`, `d8024c7c`, `049ee4f3`, `d1583799`), and `tests/ui/controls/editor/zones.test.ts` does not exist (`ls: No such file or directory`).
- `zones.ts` is 120 lines (`wc -l`). `changeViewZones` is at :68, `heightInPx: room` at :71 and `OUT_OF_SIGHT` at :19. `onDidChangeModel` has no hit anywhere outside `.scratch`.
- The callers are `Editor.svelte:156` and `DiffEditor.svelte:118`.
- The defect is real on the Editor path: `Editor.svelte` builds with `model: null`, calls `placed.mount` at :184, and sets models later at :281, with `setModel(null)` at :287 between files.
- Monaco behaves as the brief says: `node_modules/monaco-editor/esm/vs/editor/browser/widget/codeEditor/codeEditorWidget.js:1412` re-adds overlay widgets to each new view, and `:381-395` fires `onDidChangeModel` after `_attachModel`.
- `Jobs.svelte:45` is `{#if rows.length === 0}<p>{t('hpc.no_jobs')}</p>{:else}`. `Empty.svelte` has props `message` and `glyph` and draws `<p class="empty">`. `hpc.test.ts:383` is the fetching case. `hpc.yml:52` holds the text. `grep -n "no_jobs\|No jobs" tests/views/system/hpc.test.ts` prints only 170.
- `workbench.test.ts:12` carries the slow tag and :809 is the regex. `npx vitest run tests/shell/workbench.test.ts`, with node v24.21.0 on PATH, printed `AssertionError: expected [ ...(4) ] to have a length of 1 but got 4` and `Tests  1 failed | 52 passed (53)`.
- The two kinds of mark: `TabFace.svelte:101` has `class="mark"`, and `Tabs.svelte:252,269` have `<span class="mark" aria-hidden="true">`.
- `ls tests/ui/controls/editor` lists 10 items. `spec.md:42` holds the folder rule. `size.test.ts:149,163` runs `utils/folder-check.sh`.

Findings:

1. Case 1 fails on the unchanged tree with the patch's fake editor, although the brief classes it as preserved behaviour. Brief lines 38 and 95 say case 1 passes on the unchanged tree "where it can run there". I ran the patch's three cases against main's `zones.ts` and against the patched copy (`vitest run --root <scratch> main.test.ts` and `patched.test.ts`):
   - main: case 1 `AssertionError: expected 1 to be +0`; case 2 `expected [] to deeply equal [ [ 1, 28 ] ]`; case 3 `expected +0 to be 1`; `Tests  3 failed (3)`.
   - patched: `Tests  3 passed (3)`.

   The cause is that the fake's `changeViewZones` adds a zone while no model is set, and Monaco does not: `codeEditorWidget.js:1203-1206` returns early when `!this._modelData || !this._modelData.hasRealView`. On real Monaco, main makes no zone in case 1, so the fake misrepresents Monaco, and the builder's first run will contradict the brief and stop (brief line 40). Fix: require the fake to ignore `changeViewZones` while it holds no model, citing that file and line. Case 1 then passes on main and is the audit of a preserved behaviour. Also add the Monaco source to the Read list.
2. Brief line 14 says `look.test.ts` and `platform.test.ts` are "the two tests of `src/lib/ui/controls/editor/kit/`". That is wrong: `grep -n "editor/kit" tests/ui/controls/editor/*.test.ts` shows three more tests of kit modules in the parent folder:
   - `grammars.test.ts:6` (`kit/grammars.ts`);
   - `paint.test.ts:14-15` (`kit/load.ts`, `kit/theme.ts`);
   - `theme.test.ts:13,19` (`kit/colours.ts`, `kit/theme.ts`).

   Decision 3 justifies the move as mirroring `kit/` "where their concern already lives" (spec.md:42). Under that reason, all five kit tests belong in `tests/ui/controls/editor/kit/`, which leaves the parent at 7 items and not 10. If `theme.test.ts` moves, `kit/colours.ts:12` and `tests/ui/theme/colours.test.ts:611` (which name `tests/ui/controls/editor/theme.test.ts`) must be updated too, and the paths list must grow. The brief should either move the five and correct the premise, or state why only two move.
3. Brief line 11 places the Accept bars in `views/sources/repositories/merge/Merge.svelte`. They are built in `MergeSide.svelte:40-43` (`bars`) and handed to `Editor` at `MergeSide.svelte:100-110`. `Merge.svelte` draws `MergeSide` at :206 and :217, and its own Result editor at :232 has no bars. The name is imprecise, and `MergeSide.svelte` is missing from the Read list.
4. Verify item 1 expects `checks: 7 commands passed`. The state file's `verify:` block does hold seven commands (`orchestrator-state.md:7-14`). No finding.

## 4. Cases and checks against spec.md

1. Case 7 against verify item 4. Verify item 4 lists case 7 among the tests that must "fail on the unchanged tree, in the form it has after its last change". That cannot hold. Case 7 changes only the test: the source it renders (`Tabs.svelte`, `TabFace.svelte`) is main's in both states. So the new regex `/class="mark[^"]*" aria-hidden="true"/g` matches only the strip's marks at `Tabs.svelte:252,269` and passes on main. The honest proof is:
   - the old form red on main (already quoted);
   - the new form green;
   - the new form red when the strip's drop mark is taken out on a scratch edit (for example, removing `aria-hidden="true"` or the span at `Tabs.svelte:252`).

   This is spec's rule that a check must fail if the behaviour is absent. The builder would otherwise be told to show a failure that cannot happen.
2. Case 1 against verify item 4: the same class of mismatch, covered in 3.1.
3. Case 6 and the negatives check. Case 6's second half ("no such line in the queue body") will be written as `.not.toContain` or similar in a file under `tests/views/`. `tests/checks/tree/negatives.test.ts` (head comment, lines 1-18) requires a reason comment directly above every such absence, one that does not restate the literal. The brief does not say so. The check would catch it, but the case text should carry it.
4. Case 6 names a "queue body" the markup does not delimit. Jobs renders straight into `.hpc` (`Hpc.svelte:76-78`), with no wrapper of its own. The one-job half can only be written as "no `class="empty"` anywhere in the body", which holds because the fetching `Empty` draws only under `status === 'starting'` (`Hpc.svelte:68-69`). The case should say that.
5. No look case for the HPC view. spec.md says a step whose change a reader can see is looked at on TEST, and that the report names the view, the state and what differs. The empty-queue line changes look: `Empty` adds padding 10px, the muted colour and `--fs-md`, per `Empty.svelte:30-38`, where the bare `<p>` had none of these. Only case 9 (the merge editor) is a look case. Add the HPC view with an empty queue as a look item, or state that TEST cannot be put in that state and what stands in for it.
6. The ASCII line in Conventions ("the verify list's last command") names the `grep '[^ -~]'` form. spec.md's last section says the perl form replaces it wherever a brief names it. The step writes no `config/` or `bin/` file, so the outcome is the same. It is a wording inconsistency with the rules file only.
7. Minor: the patch's `zones.test.ts` head has no "What this does NOT cover" line, which its neighbours carry (`look.test.ts`, `paint.test.ts`, `theme.test.ts`; `grep -n "What this does NOT cover"` prints 3 in that folder). What it does not cover is real Monaco drawing the zone, which is case 9's look. spec.md does not require the line. The folder's test files mostly omit a Layer line (140 of 396 test files open with `// Layer`), so neither point is a defect.

## 5. Could each pass without the goal being reached?

- Case 1: yes. It passes on main once the fake is faithful (3.1). It is an audit of a preserved behaviour, and it proves no room is kept. The brief should call it an audit.
- Case 2: no. It asserts the zone's line, the zone's height and the drawn top after a model arrives. It fails on main (quoted in 3.1).
- Case 3: yes, for more than one bar. It holds one bar, so an implementation that re-makes the room only for the first held bar, or breaks the loop early, passes. The merge editor holds one bar per conflict. Add two bars (see 6.1).
- Case 4: no, as long as it asserts the dispose call. The "no zone" half alone passes on main, because main never subscribes. The dispose assertion is what makes it red on main.
- Case 5: passes on main. It is preserved behaviour and not the goal. It runs on main only if the model is set before the bar is placed, and the brief does not say so. Add "model set first".
- Case 6: yes, partly. A hand-written `<p class="empty">` in `Jobs.svelte` would pass a `class="empty"` search without going through `Empty`. To close that, also assert what only `Empty` draws: the inner `<span class="message">` (`Empty.svelte:24`), or the same scoped class attribute as the fetching line's `Empty`.
- Case 7: no, provided the scratch-removal proof of 4.1 is required. The count would go to 0 without the strip's mark.
- Case 8: no. `vite.config.ts:32` includes `tests/**/*.test.ts`, so the moved files still run, and `folder-check.sh` holds the rule.
- Case 9: no, for the first placement. Every merge side's `Editor` starts with `model: null` (`Editor.svelte`, `create` with `model: null`), so main shows the defect on any conflicted file. The look cannot show the model-change path (case 3's). That stays unit-only, which is acceptable.
- The step line's check (patch applied and reviewed): the brief cannot guarantee the review. That belongs to the orchestrator.
- Item 1: yes, if the fake stays unfaithful. An implementation that relies on `changeViewZones` working before a model exists passes the fake and fails in Monaco. Fixing the fake (3.1) and the look close it.
- Item 2: yes, see case 3.
- Item 3: yes, see case 6.
- Item 4: see 4.1.
- Item 5: no.
- Item 6: diagrams only, with no bearing on the goal.

## 6. Implied inputs missing from Cases

1. Two bars on one editor through a model change, for example after lines 1 and 5. Expected: two zones afterwards, with `afterLineNumber` 1 and 5. The first draw places each bar at its own zone's top. Removing one leaves one zone and one widget. Cost: the merge editor has one bar per conflict, and case 3 cannot see a loop that stops at the first bar.
2. A bar that has a zone, then the model set to null, then a new model. This is the order `Editor.svelte:281-288` uses on every change of file (`setModel(created)`, then `setModel(null)` in the cleanup, then the next model). Expected: after null, zero zones and top `'-1000px'` with the widget kept; after the new model, one zone. Cost: this is the real path, and case 3 goes model to model without the null.
3. Two model changes before any draw, the superseded asynchronous path that spec.md's rule on asynchronous paths names. Expected: one zone, not two. A draw at the second model's top places the bar there.
4. A bar removed while the editor holds no model, so it has a widget and no zone. Expected: zero widgets, no `removeZone` call and no throw. Cost is low. It is included because `remove` reads `entry.zone`, which the listener now sets to null.
5. Case 5's order: the model is set before the bar is placed, so the case runs on main as the brief says it can (see 5).

## 7. ADRs

None. `ls docs/adr ../../docs/adr`, run from `tools/oculus`, printed "No such file or directory" for both. `grep -n -i adr .agents/plan.yaml` printed nothing. `find . -maxdepth 4 -type d -iname adr -not -path '*/node_modules/*'`, run from the repo root, printed nothing.

## Declined to judge

- The four diagram files. `npm run diagrams` rewrites them in the worktree, and running it on main would change tracked files.
- Whether the patched `zones.ts` meets every spec.md coding rule (formatting, lint). `npm run format:check` and `npm run lint` are not mine to run on a patch that is not applied, and the builder's verify list covers them.
- Whether the new case 7 regex passes on main. I did not run it: it needs an edited test file in the repository. Per 4.1, it is inferred from the SSR shape at `Tabs.svelte:252,269` and `TabFace.svelte:100-102`, and is not verified.
- Whether the brief's rule that the builder writes `Q108-report.md` under `.scratch` fits spec.md's rule that builders never edit anything under `.scratch`. It is the ledger's standing practice (87 briefs name a `reviews/*-report.md`, for example `Q85a1.md:172` and `X3d.md:218`), so I did not treat it as a finding.

## Usage

claude-opus-5-5 (served, read from the transcript after the launch), 37 tool uses, 158,436 tokens, 7.0 min (from the completion notice).

## Closed

Each finding is closed by a change to `agents/briefs/Q108.md` before the preparation commit:

- 2.1 (no section "The patch as applied"): the section is added after the worktree is made and the patch applied, as the spec skill's Steps 7 says; the premise now says it sits at the end of the brief.
- 3.1 (the fake adds zones without a model): What to build 2 makes the fake follow `codeEditorWidget.js:1203-1206`; case 1 is named an audit that passes on main; the Monaco source is item 5 of the Read list and a premise.
- 3.2 (three more kit tests): What to build 5 moves all five kit tests, updates `kit/colours.ts:12` and `tests/ui/theme/colours.test.ts:611`; the premise, the paths, Decision 3, case 8 and verify item 3 (seven items) follow.
- 3.3 (the bars are in `MergeSide.svelte`): the premise names `MergeSide.svelte:40-43` and `:100-110`, and it is item 4 of the Read list.
- 4.1 (case 7 cannot fail on main): case 7 is proved by three runs, the third red on a scratch removal of the strip's mark; verify item 4 says so.
- 4.3 (absence reason comment): case 6 and Conventions require it; `negatives.test.ts` lines 1-18 are in the Read list.
- 4.4 (no queue body): case 6 says the one-job half asserts no `class="empty"` at all, and why that is the queue's.
- 4.5 (no HPC look): case 10 is the HPC look at landing, with case 6 standing for it when TEST cannot show an empty queue.
- 4.6 (the ASCII form): Conventions names spec.md line 88's `perl` form.
- 4.7 (no NOT-cover line): What to build 2 adds the line to the test file's head.
- 5, case 3 (one bar): case 3 holds two bars. Case 4: the dispose assertion is named as the red one. Case 5: the model is set first. Case 6: the inner `<span class="message">` is asserted.
- 6.1 to 6.5: case 3 (two bars), case 11 (null model between), case 12 (two model changes before a draw), case 13 (removal without a model), case 5's order.
- 3.4 and 7: no finding.
