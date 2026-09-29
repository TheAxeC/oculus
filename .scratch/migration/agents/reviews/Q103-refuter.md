# Step Q103 refuter report (on .agents/worktrees/Q103, base 9d9810c0)

## Verification (rerun by the reviewer)

The verify list, run as the orchestrator's brief says ("from the worktree root") printed `npm error enoent Could not read package.json ... /.agents/worktrees/Q103/package.json` and `checks: failed with exit 254: npm test`. The state file's verify block says "from tools/oculus in the worktree", so it was rerun from `.agents/worktrees/Q103/tools/oculus`:

```
$ npm test
 Test Files  375 passed (375)
      Tests  5910 passed | 1 skipped (5911)
$ npm run check
... COMPLETED 2130 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
exit=0
```
(The npm test log also prints `Rebasing (1/1)error: could not apply ... Main` three times. That is git fixture output from the suite, not a failure.)

The builder's evidence, rerun:
```
npx vitest run tests/state/system/hpc.test.ts tests/views/system/hpc.test.ts tests/views/whole/type-scale.test.ts  (scratch copy)
  Test Files  3 passed (3) / Tests  295 passed (295)
bash bin/folder-check.sh                      -> exit 0, no output
wc -l (eight files)                           -> 114, 124, 136, 101, 72, 188, 418, 357, the same as the report
LC_ALL=C grep -n '[^ -~]' <the eight files>   -> nothing, exit 1
npx vitest run tests/checks/imports/order.test.ts -> first run "1 failed | 12 passed (13)" (load average 11.97), second run "Tests 13 passed (13)". The step does not change this file, and it passed inside the full suite above. Not a finding.
npm run diagrams (scratch copy), then diff -r docs/diagrams against the worktree -> IDENTICAL
the base's six diagram files put back in the scratch copy, npx vitest run tests/checks/diagrams -> "2 failed | 66 passed (68)" ("are what the source gives now, each file byte for byte")
npx vitest run tests/checks/diagrams (worktree)  -> Tests 68 passed (68)
```

Reverts, each applied in a scratch copy (`rsync` of `tools/oculus` to `$TMPDIR/q103ref/oculus`, with `node_modules` linked) and restored after its run:
```
equality guard of toggledHpcState removed          -> 2 failed | 17 passed (both toggle cases)
outer open={held.capacity} removed                 -> 2 failed | 28 passed (default-draw, two panes)
held state read from fixed 'hpc-one'               -> 1 failed | 29 passed (draws each pane from its own held state)
{#if meters.length} made {#if true}                -> 2 failed | 28 passed (both no-sinfo cases)
class="said" removed                               -> 3 failed | 27 passed
row singular pick removed                          -> 1 failed | 29 passed
parser boolean check made `?? default`             -> 2 failed | 17 passed (the two non-boolean cases)
inner open={held.sinfo} removed                    -> 2 failed | 28 passed
.said font-size removed                            -> type-scale "sets every local role in system/hpc/Hpc.svelte" failed
Empty replaced by <p>                              -> 1 failed | 29 passed
(reviewer's own) inner ontoggle calls toggled('capacity', ...) -> 30 passed (30): the handler wiring is untested, as the brief admits
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. `Hpc.svelte:69` is `<Empty message={t('hpc.fetching')} />` and `Hpc.svelte:71` is `<p class="said">`. The `.said` rule at `Hpc.svelte:104-108` is `margin: 0; font-size: var(--fs-md); color: var(--muted-txt, var(--muted))`. The class and Empty reverts go red.
- 2: holds. `Head.svelte:119-123` adds `font-family: var(--font-mono); font-size: var(--fs-sm)`, and type-scale line 124 pins the size.
- 3: holds.
  - `parseHpcState` (through `fields`, per-key boolean fallback) and `toggledHpcState` (null on equality) are in `hpc.ts:72-101`.
  - `{#if meters.length}` wraps the outer `<details class="capacity">`, which holds the meters and the inner `<details class="sinfo">`.
  - The props are `held` and `onheld`. Each fold has `ontoggle` through `toggled()`, which uses `event.currentTarget.open`.
  - `Hpc.svelte:41-45` derives `held` from `instanceState(instance.id)` and writes `setInstanceState(instance.id, next)`.
  - The outer summary shares the existing `summary { cursor: pointer; font-size: var(--fs-sm) }` rule.
  - Behaviour finding 1 concerns the spacing under the outer summary.
- 4: holds. `hpc.yml:11-14` holds the four keys with the exact words, in alphabetical order. The grep of `capacity_summary|capacity_title|Cluster capacity|sinfo table` over src, tests, config, HELP.md, DESIGN.md, README.md and bin hits only `Capacity.svelte:40,45`, `hpc.yml:11-14`, `hpc.ts:74` (a comment) and the view test.
- 5: holds. `tests/state/system/hpc.test.ts` and `tests/views/system/hpc.test.ts` carry every case. Type-scale changes only line 72 (`'.said=fs-md | footer=fs-sm'`) and line 124 (`'.meta=fs-sm | code=fs-sm'`); line 123 is unchanged because Capacity's selectors are the same. The diff has only these two hunks in that file, disjoint from D13b's lines 235-250 and Q83's new entry.

Cases of the brief's "Cases":

- `parseHpcState` undefined, null, `'x'` and `{}` give the defaults: met, `it.each` in the state test.
- `{ capacity: false }` and `{ sinfo: true }` fall back per key: met.
- `{ capacity: 'no', sinfo: 1 }`, `{ capacity: null, sinfo: 'true' }` and `[]` give the defaults: met, and the parser-boolean revert goes red.
- `label: 'x'` is dropped: met.
- `toggledHpcState` capacity true/false: met, and the guard revert goes red.
- `toggledHpcState` sinfo true/false: met.
- No held state: outer `open`, "Cluster capacity (1 partition)", "sinfo table (3 rows)", inner closed: met.
- `{ capacity: false }`: outer has no `open`, and the meters are inside it: met.
- `{ sinfo: true }`: inner `open`: met.
- `{ capacity: false, sinfo: true }`: inner open inside the closed outer: met (`fold(...).toContain(inner)`).
- One sinfo row gives "sinfo table (1 row)": met.
- Two panes: met, and the fixed-id revert goes red.
- Unreachable with a hint: met. `class="said"` is tested; the `<code>` half is an audit, as the report says.
- Unreachable with no hint: met.
- Error payload: met.
- Starting payload: met, `class="empty"`.
- No sinfo rows (ok, and unreachable with quota): met. The meters-guard revert goes red, and exactly one `class="meters "` is left (the disk's).
- The toggle event under `svelte/server`: not verifiable in the suite. The look settles it: close the outer fold, switch tab, reload, then the same with a second Live HPC pane, and open the sinfo fold and reload.

## 1. Spec

- `agents/briefs/Q103.md`, section "Paths this step writes", and the Q103 entry of the state file's `dispatch:` block (`shared_paths`): the path list and `shared_paths` do not name `tools/oculus/docs/diagrams/`.
  - What is wrong: the brief requires three new imports: `Empty` into `views/system`, `parseHpcState` into `views/system`, and `fields` into `state/system`. `tests/checks/diagrams/diagrams.test.ts` fails on stale diagrams. With the base's six diagram files put back, "are what the source gives now, each file byte for byte" goes red (2 failed | 66 passed). So the builder had to write `layers`, `layer-state` and `layer-views` (`.dot` and `.svg`).
  - The builder named the extra write at the top of its report. `npm run diagrams` in a scratch copy produces files byte-identical to the worktree's (`diff -r` printed nothing).
  - D13b's and Q83's entries both list "docs/diagrams/ regenerated by npm run diagrams at each landing". Q103's entry does not, although Q103 shares those files with both.
  - Failure scenario: an orchestrator who checks the diff against the path list reads the six files as an unauthorised write. Or, landing Q103 after D13b or Q83, it takes the cherry-pick conflict in the `.svg` edge labels for a real one.
  - Verdict: none; the fix is mechanical (rerun `npm run diagrams` at landing). The defect is in the brief, not the build.

## 2. Proof

- none.

## 3. Standards

- none.
  - The spec's "Every control a reader presses is a `ui/` primitive" is excepted by the brief's decision 1.
  - Comments state what and why, with no history.
  - Markup is one element per line.
  - Catalog keys are in order and every one has a reader.
  - The singular pick is inline, as `Calendar.svelte:116`, `Bell.svelte:70` and `CardSessions.svelte:55` do it; no shared helper exists (`grep -n "export function" src/lib/state/shared/words/text.ts`).

## 4. Behaviour

- `src/lib/views/system/hpc/Capacity.svelte:65-88` with `Hpc.svelte:97-101`: `<details class="capacity" ...><summary>...</summary><div class="meters">...</div><details class="sinfo" ...>`.
  - What is wrong: at the base, `<div class="meters">` and the sinfo `<details>` were separate children of `.hpc`, which is `display: flex; flex-direction: column; gap: 10px`, so 10px separated the meters from the sinfo summary. Both now sit inside one block-level `<details>`, and no rule gives them spacing. The sinfo summary sits flush under the last meter row, and the meters grid sits flush under the new outer summary.
  - The brief's item 3 says "the meters sit under it as they do now". The report's before/after section does not mention the lost gap.
  - Failure scenario: a reader at the look sees "sinfo table (N rows)" touching the last meter row, spaced unlike the other parts of the view.
  - Verdict: none on the items; a landing fix, for example `.meters { margin-block: 4px 10px; }` in `Capacity.svelte`, checked at the look.

The points the orchestrator asked about, each held with its evidence:
- `keepHeld` replacing the whole instance state:
  - `grep -rn "instanceState\|setInstanceState" src/lib/views/system/hpc src/lib/state/system` hits only `Hpc.svelte:36,41,44`.
  - The non-view writers of instance state (`grep -rn -e setInstanceState -e "instanceState(" src | grep -v src/lib/views/`) are palette-open (reveal only: feeds and collections), forms, sessions, sources, repositories, show-in-files and terminals. None targets `hpc`.
  - The registration (`Hpc.svelte:5-15`) keeps nothing there, and no view file reads the layout's `instance.state`.
  - Nothing is wiped.
  - `ui.svelte.ts:353-355` saves to localStorage under `oculus.ui.v1` (lines 17 and 225), so a reload keeps the state.
- `ontoggle` with `event.currentTarget.open`:
  - `node_modules/svelte` is 5.57.1, and `elements.d.ts:956` types `ontoggle?: ToggleEventHandler<HTMLDetailsElement>`.
  - `toggle` has no match in `svelte/src/utils.js`, so the handler is attached directly and is not delegated.
  - A `<details open>` fires one `toggle` whose `currentTarget.open` equals the held `true`, and `toggledHpcState` returns null. The guard revert turns both toggle cases red.
  - A closed-held fold draws with no `open`, so no event fires.
  - Only the look settles whether the event fires and writes, and whether the state survives a tab switch and a reload, per pane. The reviewer's crossed-key revert shows the suite cannot catch wiring errors.
- `{#if meters.length}`:
  - `partitionMeters` (`hpc.ts:50-70`) makes one meter per distinct `row.partition` for any row, so `meters.length === 0` holds exactly when `rows.length === 0`.
  - Rows present with no meters cannot happen, and the sinfo table cannot be lost. The guard matches the brief's decision 6.
- Words:
  - `capacity_summary` now carries the sinfo table's words, and its only reader is `Capacity.svelte:45`.
  - The cockpit's `slurm.capacity_summary` is a separate catalog, outside the paths (brief check).
  - Count 0 cannot reach either summary because of the guard.
- Documents: `grep -rn -i -e sinfo -e capacity -e "Live HPC" HELP.md DESIGN.md README.md` hits HELP.md:93, 134, 220 and 233, and DESIGN.md:132 and 318. The change makes none of them false.

## Declined to judge

- The look: the rendered sizes (15px before, 11.5px and 12.5px after), the hint's monospace family, `margin: 0`, and the toggle writes. No browser is allowed to this reviewer.
- Whether `Empty`'s own `padding: 10px 0` plus the view's 10px gap (20px under the head while fetching) is wanted. That is the primitive's shape, chosen by decision 5, and is Axel's to see at the look.

Reviewer usage: 146077 tokens, 36 tool uses, 14 min (from its completion notice).

## Closed

- Spec 1 (the six diagram files outside the path list): closed at landing. The files are what `npm run diagrams` gives; it is rerun on main after the cherry-pick, a mechanical rerun.
- Behaviour 1 (no spacing between the meters and the sinfo summary inside the outer fold): closed at landing with a margin on `.meters` in `Capacity.svelte`, checked at the look on TEST.
