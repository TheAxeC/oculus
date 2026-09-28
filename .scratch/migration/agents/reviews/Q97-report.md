Everything in the brief is done. The verify list ran once, at the end, and is red at `npm test` only because of timeouts in four test files this step does not touch; the other five commands were run on their own afterwards and pass (below).

## Open items (verbatim from the state file)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

None.

## The cases' first run

The first run of the cases against the unchanged tree was done by the previous builder of this step, who was stopped before writing a report. Its results are not on disk and are not restated here. For each case, the test that is it and the change whose undoing turns it red:

| Case | Test | Turns red when |
|---|---|---|
| `railPages(shipped)` as `label:page`, twelve | `tests/state/workbench/navigation/arrangement.test.ts:248` "draws the twelve buttons in the ruled order, Help right after System" | the `Help` entry is taken out of `rail:` in `config/layout.yml` |
| `ActivityRail` draws twelve `data-rail-page` in order | `tests/shell/rail/rail-config.test.ts:30` (against `SHIPPED_RAIL_KEYS` of `tests/shell/rail/shipped-rail.ts`) | the `Help` rail entry is taken out |
| the `help` button draws `data-glyph="question"` | `tests/shell/rail/rail-config.test.ts:40` "draws the Help button with the question glyph, the Help view's own" (new) | the Help rail entry's glyph is anything but `question`, or the entry is taken out |
| the pages pane by pane | `tests/state/workbench/navigation/arrangement.test.ts:265` "makes every page as the rulings lay it out, pane by pane" | the `info` arrangement goes back to the two-pane split, or the `help` arrangement is taken out |
| every placed entry on exactly one page | `tests/state/workbench/navigation/arrangement.test.ts:294`, unchanged | the `info` arrangement goes back to holding the manual, the documents and `memories` while `help` holds them too |
| the config's groups equal the rail's pages and labels | `tests/checks/config/config-folder.test.ts:450` "keys every catalogue group by the rail page it holds, in rail order, Help after System" | the Help rail entry or the `help` arrangement is taken out |
| the catalogue's sections, state fold | `tests/state/workbench/navigation/catalogue.test.ts:260` "lists one group per rail page, in rail order, labelled with its button, and Help after System" | the Help rail entry is taken out |
| the catalogue's sections, Views view | `tests/views/system/workbench/catalogue.test.ts:51` "draws each group under its heading, with its chord letter where it has one" | the Help rail entry is taken out |
| the Help section holds its five entries at `h1` to `h5` | `tests/views/system/workbench/catalogue.test.ts:61` and `:81`, unchanged | audit: this step changes no group membership or chord |
| the Settings rail half: 12 rows | `tests/views/system/workbench/settings.test.ts:96` (the count at `:98`) | the Help rail entry is taken out |
| a saved System page keeps its old tabs; the Help page is made on its first press | `tests/state/workbench/navigation/arrangement.test.ts:395` and `:403`, under the describe at `:320` (new) | audit of the existing keep-what-was-arranged rule of `openRailPage` over the shipped arrangements; the `:403` test also turns red if the `help` arrangement is taken out |

## What to build

| Item | State | Where | Proof |
|---|---|---|---|
| 1. `config/layout.yml`: Help rail entry after System, `help` arrangement after `info`, `info` one pane, `nav_groups` comment | DONE | `config/layout.yml:20`, `:24`, `:98-106` | `grep -c "label:" <(sed -n '/^rail:/,/^$/p' config/layout.yml)` prints `12`; `sed -n 8,40p` and `sed -n 95,115p` show the entries; `nav_groups` entries unchanged |
| 2. head comments of `catalogue.ts`, `Help.svelte`, `Memories.svelte` | DONE | `catalogue.ts:2-3`, `Help.svelte:2-3`, `Memories.svelte:2-3` | `grep -n "no page" config/layout.yml src/lib/views/system/help/Help.svelte src/lib/views/personal/memories/Memories.svelte src/lib/state/workbench/navigation/catalogue.ts` prints one line, `config/layout.yml:44` ("An arrangement that does not add up makes no page."), which is not about the Help group; no code line changed (diff against main shows only the comment lines) |
| 3. `HELP.md:19`, `:68` | DONE | `HELP.md:19`, `:68` | word diff against main: only these two lines changed, "twelve", System's six views, Help's five entries, "the Help page's under Help, reached by `h`", "the Help page's group" |
| 4. `DESIGN.md:269`, `:282` | DONE | `DESIGN.md:269`, `:282` | `:269` reads "(`f`, `m`, `p`, `e`, `s`, `c`, `l`, `r`, `t`, `y`, `h` and `w`, one per rail page)"; `:282` reads "a listed view of the Help page's group" |
| 5. tests changed to the twelve-page rail and the new cases | DONE | the eight test files of the brief | `npx vitest run` over `rail-config`, `config-folder`, both `catalogue`, `arrangement`, `settings`, `rail.test.ts` (state) and `rail.test.ts` (shell): `Test Files  8 passed (8)`, `Tests  138 passed (138)` |

Accepted edits outside the brief's path list, as the orchestrator ruled: `config/text/app.yml:12`, the `h1-h5` row of the key sheet now ends "the Help page's group", the same text as `HELP.md:68`; `DESIGN.md:81`, the sentence that called Help a group with no page now reads "The Help page's group, ... every group has a chord".

`npm run diagrams` was run; `diff -rq` of `docs/diagrams` against the main checkout prints nothing, so no diagram changed.

### The verify list, verbatim

`sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, exit 1. Its first lines and summary:

```
RED: npm test
exit status: 1
```
```
 Test Files  4 failed | 337 passed (341)
      Tests  13 failed | 5345 passed (5358)
```

The failing files, all timeouts (`Test timed out in 5000ms` / `Hook timed out in 10000ms`): `tests/server/core/git.test.ts`, `tests/server/git/git-ops.test.ts`, `tests/checks/tree/duplication.test.ts`, `tests/checks/tree/scratch.test.ts`, and one line of `tests/checks/source/comment-width.test.ts` also appears in the captured output.

- `tests/server/core/git.test.ts` and `tests/server/git/git-ops.test.ts`: not this step's; not rerun or investigated.
- `tests/checks/tree/duplication.test.ts`, `tests/checks/tree/scratch.test.ts` and `tests/checks/source/comment-width.test.ts` scan the files this step changed, so they count. Run on their own with default timeouts: `Test Files  3 passed (3)`, `Tests  22 passed (22)`.

The runner stops at the first red command, so the rest of the list was run one by one from the worktree: `npm run check` exit 0 (`COMPLETED 1433 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`); `npm run build` exit 0; `npm run format:check` exit 0 (`All matched files use Prettier code style!`); `npm run lint` exit 0; `! LC_ALL=C grep -rna '[^ -~]' src tests` exit 0. The spec's ASCII gate (the perl form over `src tests bin config`) prints nothing. `verify: 6 commands passed` was not printed, since the runner stopped at `npm test`.

## Files, line counts before and after

| File | Before | After |
|---|---|---|
| `config/layout.yml` | 181 | 184 |
| `config/text/app.yml` | 65 | 65 |
| `src/lib/state/workbench/navigation/catalogue.ts` | 263 | 263 |
| `src/lib/views/system/help/Help.svelte` | 91 | 91 |
| `src/lib/views/personal/memories/Memories.svelte` | 426 | 426 |
| `HELP.md` | 296 | 296 |
| `DESIGN.md` | 321 | 321 |
| `tests/shell/rail/shipped-rail.ts` | 33 | 35 |
| `tests/shell/rail/rail-config.test.ts` | 114 | 123 |
| `tests/checks/config/config-folder.test.ts` | 682 | 681 |
| `tests/state/workbench/navigation/catalogue.test.ts` | 414 | 395 |
| `tests/views/system/workbench/catalogue.test.ts` | 114 | 110 |
| `tests/state/workbench/navigation/arrangement.test.ts` | 455 | 547 |
| `tests/views/system/workbench/settings.test.ts` | 139 | 139 |

## Judgment calls

- The saved-System-page case lives in `arrangement.test.ts` as its own describe block, with the old `info` arrangement written out in the test (`OLD_INFO`) and the page saved and reloaded through a fake storage, so the case runs over a layout that was saved, not one still in memory.
- The Help glyph case is a separate test in `rail-config.test.ts` that reads the `help` button's markup from the rendered rail.
- The arrangement test title at `:248` drops "Incoming new and Info/more named System" for "Help right after System".

## Limitations and sharp edges

- Brief decision 4 stands: in a browser that saved a System page before this step, the manual, the three hub documents and the Memories wall sit on both the saved System page and the new Help page until that System page is Reset. The one-page test (`arrangement.test.ts:294`) checks the shipped arrangements, not saved layouts.

## The user-visible change

- The rail. Before: eleven buttons, System then Views and Settings. After: twelve, Help (glyph `question`) between System and Views and Settings. Help is the eleventh button, past the digits 1 to 9 like System and Views and Settings, so no digit shortcut changes.
- The System page. Before: a 0.6/0.4 split, left Status, Findings, Audit, History, Config, Gallery, Help, HPC how-to; right Research approach, Agent approach, Memories. After: one pane of Status, Findings, Audit, History, Config, Gallery.
- The Help page. Before: none. After: a 0.6/0.4 split, left Help and HPC how-to, right Research approach, Agent approach, Memories.
- The catalogue. Before: one section per rail page plus a Help section after System that was no page. After: one section per rail page in rail order, Help among them after System, with the same five entries at `h1` to `h5`.
- A saved System page. Before and after: shown as saved until its Reset; after Reset it is the one-pane System page. The Help page is made from its arrangement on its first press.
