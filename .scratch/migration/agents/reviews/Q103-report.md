# Q103 report: the Live HPC view's failure text in the view's own type, and its capacity section collapsible

Everything in the brief is done. One write falls outside the brief's path list: the six generated diagram files under `tools/oculus/docs/diagrams/` (`layers`, `layer-state`, `layer-views`, each `.dot` and `.svg`), regenerated with `npm run diagrams` because `tests/checks/diagrams/diagrams.test.ts` fails on the three import edges this step adds. The orchestrator may keep them or regenerate them at landing.

## Open items of the state file, verbatim

> ## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.
>
> None.

## The cases' first run, on the unchanged tree

Every case was written as a test in `tests/state/system/hpc.test.ts` or `tests/views/system/hpc.test.ts` before any product change and run with `npx vitest run tests/state/system/hpc.test.ts tests/views/system/hpc.test.ts` (log in the session scratch folder, `Q103/first-run.log`): `Tests 25 failed | 24 passed (49)`. The 24 passes are the cases that were already in the files.

| Case | Result on the unchanged tree |
| --- | --- |
| `parseHpcState(undefined / null / 'x' / {})` gives the defaults | red: `TypeError: parseHpcState is not a function` |
| `{ capacity: false }` and `{ sinfo: true }` fall back per key | red: same TypeError |
| `{ capacity: 'no', sinfo: 1 }`, `{ capacity: null, sinfo: 'true' }`, `[]` give the defaults | red: same TypeError |
| `{ capacity: false, sinfo: true, label: 'x' }` drops `label` | red: same TypeError |
| `toggledHpcState` on `capacity`: `true` gives null, `false` the new state | red: `toggledHpcState is not a function` |
| `toggledHpcState` on `sinfo`: `true` gives the new state, `false` null | red: same |
| No held state: outer fold open, `Cluster capacity (1 partition)`, `sinfo table (3 rows)`, inner closed | red: no capacity fold is drawn |
| `{ capacity: false }` held: outer has no `open`, meters inside it | red: no capacity fold is drawn |
| `{ sinfo: true }` held: inner carries `open` | red: the sinfo `<details>` has no class and no `open` |
| `{ capacity: false, sinfo: true }` held: inner open inside the closed outer | red: no capacity fold is drawn |
| One sinfo row: `sinfo table (1 row)` | red: the summary reads `Cluster capacity (sinfo) - 1 rows` |
| Two panes, `hpc-one` held closed, `hpc-two` not: each its own | red: no capacity fold is drawn |
| Unreachable with `hint: 'ssh timeout'`: paragraph carries `class="said"`, hint in the head's `code` | red: the paragraph has no class; the hint half is an audit, drawn in `<code>` by `Head.svelte:88` on the unchanged tree |
| Unreachable with no hint: `class="said"`, no `<code>` | red: the paragraph has no class |
| Error payload: `class="said"` | red: the paragraph has no class |
| Starting payload: `Fetching job status...` inside `class="empty"` | red: drawn as a bare `<p>` |
| No sinfo rows (`ok`, and `unreachable` with quota rows): no capacity fold, disk meters kept | red: `expected [ 'class="meters ', 'class="meters ' ] to have a length of 1 but got 2`, the empty capacity grid drawn beside the disk grid |
| The `toggle` event under `svelte/server` | not a test: it cannot fire in node; the guard is proven by the `toggledHpcState` cases and the wiring is for the look |

No case is one the brief's own rules get wrong; every red is the defect or the absent feature the step exists for.

Added beside the brief's cases: two partitions read `Cluster capacity (2 partitions)` and four rows `sinfo table (4 rows)`, so the plural pick of the outer summary is proven too.

## DONE / NOT DONE

| Deliverable | State | Proof |
| --- | --- | --- |
| 1. Fetching line through `Empty`, unreachable line `class="said"` (`margin: 0; font-size: var(--fs-md); color: var(--muted-txt, var(--muted))`) | DONE | `Hpc.svelte:68-70` and its `.said` rule; tests "draws the fetching line through the empty primitive..." and the three `said` cases pass |
| 2. Hint `code` with `font-family: var(--font-mono); font-size: var(--fs-sm)` | DONE | `Head.svelte` style; `type-scale.test.ts:124` now `'.meta=fs-sm \| code=fs-sm'` passes |
| 3. `HpcViewState`, `parseHpcState`, `toggledHpcState` in `state/system/hpc.ts` | DONE | the eleven state cases pass |
| 3. Capacity section one outer `<details>` (nothing when no meters), inner sinfo `<details>`, `held` / `onheld` props, `ontoggle` through `toggledHpcState` | DONE | `Capacity.svelte:64-88`; the view cases pass |
| 3. `Hpc.svelte` reads `instanceState(instance.id)` through `parseHpcState`, writes with `setInstanceState(instance.id, next)` | DONE | `Hpc.svelte:41-45`; the two-pane case passes |
| 4. Words `capacity_title`, `capacity_title_one`, `capacity_summary` changed, `capacity_summary_one` | DONE | `config/text/views/system/hpc.yml:11-14`; `tests/views/system/hpc.test.ts:124-125` quote the new text |
| 5. Tests in the three files | DONE | `npx vitest run tests/state/system/hpc.test.ts tests/views/system/hpc.test.ts tests/views/whole/type-scale.test.ts`: `Test Files 3 passed (3)`, `Tests 295 passed (295)` |
| Verify 1: checks.sh | DONE, with one unrelated timeout | quoted below |
| Verify 3: `bash bin/folder-check.sh` | DONE | exit 0, no output |
| Verify 4: each test's revert | DONE | table below |

### checks.sh, verbatim lines

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`, exit 1:

```
$ npm test
 FAIL  tests/checks/imports/order.test.ts > the folder order of each layer > holds the data folders
Error: Test timed out in 5000ms.
 Test Files  1 failed | 374 passed (375)
      Tests  1 failed | 5909 passed | 1 skipped (5911)
checks: failed with exit 1: npm test
```

`tests/checks/imports/order.test.ts` is a file this step does not change, and the failure is a 5000 ms timeout under load. Run alone, `npx vitest run tests/checks/imports/order.test.ts`: `Tests 13 passed (13)`.

checks.sh stops at the first failing command, so the other five commands of the list were run one by one, each through `bash -o pipefail -c`, from the worktree's `tools/oculus`:

```
$ npm run check
... COMPLETED 2130 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
exit 0
$ npm run build
exit 0
$ npm run format:check
All matched files use Prettier code style!
exit 0
$ npm run lint
exit 0
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
exit 0
```

`LC_ALL=C grep -n '[^ -~]'` over the eight files this step wrote printed nothing (exit 1).

### Reverts, each run and restored from a copy

Command for each: the one change applied to the file, then `npx vitest run <the test file>`, then the file restored. After the last one, the three files: `Tests 295 passed (295)`.

| Revert | Red |
| --- | --- |
| Parser default `capacity: true` made `false` | 8 of the parser cases |
| Parser boolean check removed (`held[key] ?? default`) | the two non-boolean cases |
| Parser keeps other keys (`{ ...held, ... }`) | "ignores every other key of the held map" |
| Equality guard of `toggledHpcState` removed | both toggle cases |
| Outer `open={held.capacity}` removed | "draws the capacity fold open...", "draws each pane from its own held state" |
| Inner `open={held.sinfo}` removed | "draws the sinfo fold open...", "draws the open sinfo fold inside the closed capacity fold" |
| `class="said"` removed | the three unreachable/error cases |
| Partition singular pick removed | the first case and "draws the capacity fold open..." |
| Row singular pick removed | "names one sinfo row in the singular" |
| `Empty` replaced by `<p>` | "draws the fetching line through the empty primitive..." |
| `{#if meters.length}` made `{#if true}` | both no-sinfo cases |
| Held state read from a fixed `'hpc-one'` | "draws each pane from its own held state" |
| `.said` font-size removed | type-scale "sets every local role in system/hpc/Hpc.svelte" |
| Hint `code` font-size removed | type-scale "sets every local role in system/hpc/Head.svelte" |

Audits, which no revert turns red: the hint half of the unreachable case (`<code[^>]*>ssh timeout</code>`, drawn by the unchanged `Head.svelte:88`), and the "closed fold" case (removing the `open` binding leaves every fold closed, so that case stays green; the open-by-default case is what goes red). The paragraph's `margin: 0` and the hint's `font-family` are pinned by no test and are seen at the look.

## Files, with line counts after the change (`wc -l`)

- `src/lib/views/system/hpc/Hpc.svelte` 114
- `src/lib/views/system/hpc/Head.svelte` 124
- `src/lib/views/system/hpc/Capacity.svelte` 136
- `src/lib/state/system/hpc.ts` 101
- `config/text/views/system/hpc.yml` 72
- `tests/state/system/hpc.test.ts` 188
- `tests/views/system/hpc.test.ts` 418
- `tests/views/whole/type-scale.test.ts` 357 (lines 72 and 124 changed; line 123 unchanged, since `Capacity.svelte`'s size rules are the same selectors as before)
- `docs/diagrams/layers.dot`, `layers.svg`, `layer-state.dot`, `layer-state.svg`, `layer-views.dot`, `layer-views.svg`: regenerated by `npm run diagrams`, outside the brief's path list. The `.dot` diff is three edge counts, one per import this step adds: `state/system to data` 4 to 5 (`hpc.ts` imports `fields`), `views/system to ui` 84 to 85 (`Hpc.svelte` imports `Empty`), `views/system to state` 75 to 76 (`Hpc.svelte` imports `parseHpcState`), and the totals `state to data` 79 to 80, `views to ui` 564 to 565, `views to state` 583 to 584.

Grep of the changed names, `grep -rn "capacity_summary\|capacity_title\|Cluster capacity" src tests config HELP.md DESIGN.md README.md`: hits only in `Capacity.svelte:40,45`, `hpc.yml:11-14` and `tests/views/system/hpc.test.ts`; nothing in `HELP.md`, `DESIGN.md` or `README.md` names the old summary.

## Judgment calls the brief left open (each reversible)

- The folds carry the classes `capacity` and `sinfo` so the tests can tell them apart in the markup; neither class carries a style.
- `parseHpcState` reads through `fields` from `data/helpers/guards.ts` (the map or `{}`), with the defaults in one `HPC_DEFAULTS` constant.
- `toggledHpcState`'s key is typed `keyof HpcViewState`, which is `'capacity' | 'sinfo'`.
- Three `.not.toContain` assertions carry a reason comment above them, as `tests/checks/tree/negatives.test.ts` requires.
- The `toggled` handler in `Capacity.svelte` is typed `Event & { currentTarget: HTMLDetailsElement }`; `npm run check` accepts it with 0 errors.

## What the reader sees, before and after (for the look on TEST)

- **The fetching line** (Live HPC pane while the poller is starting): before, a bare `<p>` with the browser's 1em margins at the body's 15px; after, `ui/frame/Empty.svelte`, 12.5px (`--fs-md`), muted, `margin: 0` with its own `padding: 10px 0`, and under the rice theme the terminal form (`# ` and `--fs-xs` monospace).
- **The unreachable line** (take the cluster off the network, or a payload with `status: 'unreachable'`): before, `Cluster unreachable - on UT network / EduVPN?` at 15px with 1em margins; after, 12.5px muted with no margin, in the view's 10px column gap.
- **The ssh hint** in the head under the status line: before, the browser's default monospace at a size no rule set; after, the theme's `--font-mono` at 11.5px (`--fs-sm`), still red.
- **The capacity section**: before, the partition meters always shown, and under them a closed fold `Cluster capacity (sinfo) - N rows`; after, one fold headed `Cluster capacity (N partitions)` (`(1 partition)` for one), open in a new pane, holding the meters and, inside it, the fold `sinfo table (N rows)` (`(1 row)` for one), closed in a new pane. Close the outer fold, switch tab and back, reload: it stays closed in that pane. Open a second Live HPC pane: it shows its own state. Open the sinfo fold, reload: it stays open.
- With no sinfo rows (an unreachable cluster before its first answer) the capacity fold is not drawn; before, an empty meters grid was drawn and took one gap.

## Anything in the brief wrong or impossible

Nothing. The brief's path list did not name `docs/diagrams/`, which the three imports the brief itself requires make stale; that is the one write outside the list, named at the top.

## Limitations and sharp edges

- The `toggle` handler's wiring is not exercised by any test (the unit suite renders to a string and fires no event); it is proven only at the look.
- A browser fires `toggle` once when a `<details>` is drawn with `open` already set; `toggledHpcState` returns null for it, so nothing is written. This rests on the equality guard, which the toggle cases pin.
- The held state lives in the pane's instance state and goes when the tab closes (`clearInstanceState`), as decision 3 of the brief says; a new pane always starts with the capacity open and the table closed.
- The unrelated timeout in `tests/checks/imports/order.test.ts` was seen in the full run only; it passed alone.
