# M3 report: the resources registry

Everything in the brief is done. One slow-tagged test fails in this worktree, `tests/server/edit/yaml-edit.test.ts` "every manifest of the real hub, read only > touches one line of each when the status line is set", on three `side-projects` manifests and a code path this step does not change (see "Open facts"). It is not in the verify list.

## Open items from the state file

None.

## First run of the cases on the unchanged tree

The unchanged tree is a copy of main at the base under `scratchpad/base/tools/oculus` (source and config as on main) with the final test files of this step copied over its `tests/`. The command in that copy was `node node_modules/vitest/vitest.mjs run --reporter=verbose` over the new and changed test files. The outputs are `scratchpad/m3out/fr-1.txt` (the 14 new or fully rewritten files: 14 failed files, 101 of 390 tests failed) and `scratchpad/m3out/fr-2.txt` (the other 148 changed files: 8 failed files, 18 of 4284 tests failed, 4252 passed, 14 skipped). The quotes below are read from those two files. Case 27 ran on a copy of the hub with main's `tools/cockpit` and the list-valued manifests (`scratchpad/base-hub`, which has no `registries/resources.yml`). No case needed a ruling: no rule of the brief gave a wrong result on a case.

| Case | Test on the unchanged tree | First-run result |
|---|---|---|
| 1 | `resources.test.ts` "holds the three seed entries with their kinds and no finding"; `demo-hub.test.ts` "holds the eight registries" | `TypeError: Cannot convert undefined or null to object` (both) |
| 2 | `resources.test.ts` "records an entry whose kind is none of the three, drops it, and fails a project naming it" | `AssertionError: the catalog holds findings.validate.no_resource: expected undefined to be defined` |
| 3 | `resources.test.ts` "leaves out an entry with no key..." | `AssertionError: the catalog holds findings.validate.kind_not_resource: expected undefined to be defined` |
| 4 | `resources.test.ts` "is empty with the missing-file finding when the file is absent..." and "...with the parse finding when the file does not parse" | `AssertionError: expected undefined to deeply equal {}` (both) |
| 5 | `resources.test.ts` "reads one key"; `projects.test.ts` "draws one tag per resource in the manifest order, the cluster with the HPC glyph"; `board-filters.test.ts` "carries each resource a project names, in the manifest order, with its name and kind"; `board-filter-menu.test.ts` "gives a resource its recorded name..." | `expected undefined to deeply equal [ 'utwente' ]`; `expected [] to deeply equal [ 'UTwente HPC+', 'Local data', ...(1) ]`; `TypeError: alpha?.compute.map is not a function`; `expected [ 'unset 1', 'unset 4' ] to deeply equal [ 'UTwente HPC 1', 'unset 4' ]` |
| 6 | `resources.test.ts` "keeps the manifest order, not the alphabetical one"; `board-filters.test.ts` "counts a project under every resource it names" | `expected undefined to deeply equal [ 'utwente', 'data' ]`; `expected [ '__none__:6' ] to deeply equal [ 'this-mac:2', 'utwente:1', ...(1) ]` |
| 7 | `resources.test.ts` "names an unknown key in a finding and reads it as none"; `board-filters.test.ts` "counts compute, reproduced and the code deposit in their fixed order" | `the catalog holds findings.validate.no_resource: expected undefined to be defined`; `expected [ '__none__:6' ] to deeply equal [ 'this-mac:1', 'utwente:1', ...(1) ]` |
| 8 | `resources.test.ts` "answers the old scalar with the list-shape finding and reads it as none" | `expected [] to deeply equal [ [ 'project.yml', 'compute', ...(1) ] ]` |
| 9 | `resources.test.ts` "takes an absent, an empty and a bare compute as none with no finding" | `expected undefined to deeply equal []` |
| 10 | `schema.test.ts` "resolves the resources registry to every resource by its name" and "opens the compute field with the keys of the resources the project names"; `yaml-edit.test.ts` "a compute list" (two cases) | `expected [ { id: 'hpc', label: 'hpc' }, ...(1) ] to deeply equal [ { id: 'data', ...(1) }, ...(2) ]`; `expected undefined to deeply equal [ 'utwente' ]`; the two `yaml-edit.test.ts` cases pass on the unchanged tree (an audit: `setFields` writes any list) |
| 11 | `host.test.ts` "gives the host of the cluster the key names"; `context-reload.test.ts` "hands the poller the host an hpc_host written names, and the host of the cluster slurm.resource names when it is removed" | `Error: Cannot find module '../../../../src/lib/server/machine/hpc/host.ts'`; `Error: config/behavior.yml: slurm.host must be a non-empty string` |
| 12 | `host.test.ts` "prefers the machine host, whether or not the key resolves"; `context.test.ts` "keeps the host the machine names, so a pushed slurm.resource reaches the poller only without one" | the same two errors |
| 13 | `poll-live.test.ts` "runs no ssh, and publishes unreachable with the sentence and no host"; `hpc.test.ts` (view) "draws the sentence alone, with no host in a footer, while the payload has no host"; `host.test.ts` "says an entry that is not a cluster is not one..." | `expected { status: 'error', ...(12) } to match object { status: 'unreachable', ...(2) }`; `expected '<!--[--><section class="pane svelte-b...' not to contain 'Cluster unreachable'`; module missing |
| 14 | `host.test.ts` "says the key names no resource"; the `poll-live.test.ts` case above | module missing; `status: 'error'` as above |
| 15 | `host.test.ts` "says a cluster with no host has none" | module missing |
| 16 | `host.test.ts` "refuses a host ssh would read as an option, a second word or a control character" | module missing |
| 17 | `built.test.ts` (five cases); `poll-live.test.ts` "drops the answer of a poll in flight when the host is taken away"; `context-reload.test.ts` "resolves the host again after each portfolio rebuild, and says why when the cluster has none" | `expected [] to deeply equal [ { portfolio: 1, audit: 1, ...(2) } ]` and four like it; `expected { status: 'ok', ...(12) } to match object { status: 'unreachable', ...(2) }`; `slurm.host must be a non-empty string` |
| 18 | `poll-live.test.ts` "publishes a new sentence at once when only the sentence changed"; `context-reload.test.ts` "publishes the new sentence at once when slurm.resource changes and the host stays empty" | `status: 'error'` as above; the config error |
| 19 | `host.test.ts` "says the registry is not read when there is no snapshot"; `context-reload.test.ts` "starts with no host and the sentence when no snapshot was published, and resolves it at the next rebuild" | module missing; the config error |
| 20 | `settings.test.ts` "refuses a resource of \"\" / 3 / null / []", "refuses a block that still holds host: and no resource:, naming slurm.resource", "refuses the resource before the prewarm and the prewarm before the numbers"; `context.test.ts` "keeps the settings in force and logs once for a slurm block with no resource, or still holding host" | `expected { Object (threw) } to strictly equal { Object (threw) }`; `expected { value: { host: 'h', days: 7, ...(3) } } to strictly equal { Object (threw) }`; the config error |
| 21 | `hpc.test.ts` (route) "refuses a cancel and a log while there is no host, with the sentence, and runs neither" | `expected { status: 'ok' } to match object { status: 'error', ...(1) }` |
| 22 | `board-filters.test.ts` "lists the resources by their names and not their keys, then unset" and "breaks a tie of names by the registry order" | `expected [ 'unset 6' ] to deeply equal [ Array(3) ]`; `expected [ '__none__:6' ] to deeply equal [ 'b:1', 'a:1', '__none__:4' ]` |
| 23 | `board-filters.test.ts` "drops a compute value the board does not offer when it is told what it offers"; `projects.test.ts` "opens a board saved with a compute value it does not offer with no compute filter" | `expected { compute: [ 'hpc', 'utwente' ], ...(1) } to deeply equal { compute: [ 'utwente' ], ...(1) }`; `expected [ +0, +0 ] to deeply equal [ 2, 1 ]` |
| 24 | `resources.test.ts` "keeps the first of two entries with one key and flags the second", "leaves out an entry keyed with a reserved word" | `the catalog holds findings.validate.resource_duplicate: expected undefined to be defined`; `TypeError: Cannot convert undefined or null to object` |
| 25 | `resources.test.ts` "counts a repeated key and a non-text once" | `expected undefined to deeply equal [ 'utwente' ]` |
| 26 | `demo-hub.test.ts` "holds a demo cluster whose host is the one slurm.resource resolves to, and no project names a resource" | `TypeError: Cannot read properties of undefined (reading 'utwente')` |
| 27 | in `scratchpad/base-hub`: `python3 tools/cockpit/build.py --selftest`, `bash tools/cockpit/tests/run.sh`, `python3 tools/cockpit/build.py --no-git-sync` | the selftest ends `SELFTEST PASS` and `run.sh` ends `OK`, `PASS - 11 modules load in order, 20/20 window.CK exports present`; the build stops at `File ".../page.py", line 226, in _board` on `cp[p.get("compute") or "__none__"] = ...` with `TypeError: unhashable type: 'list'` |

Other changed tests that fail on the unchanged tree, from `fr-2.txt`: `portfolio-config.test.ts` "answers the defaults for a config holding nothing" and "reads each key of the wrong type as absent and keeps the rest of its list"; `config-folder.test.ts` "holds exactly the expected top-level keys, and no more" and "reads each file on its own and finds its own keys there and nowhere else"; `normalise.test.ts` "fills a project from the manifest keys of the same meaning"; `portfolio.test.ts` "publishes a portfolio worded by key over a broken sentence file, and rewords it once repaired"; `projects.test.ts` "shows only what a filter leaves"; `board-filters.test.ts` "requires every facet that has a selection at once" (`expected [] to deeply equal [ 'alpha' ]`); `chips.test.ts` "is worn by nothing else the card lists" (`This Mac: expected -1 to be greater than -1`).

Tests of preserved behaviour: the 140 files of `fr-2.txt` that pass on the unchanged tree (4252 tests passed, 14 skipped). They are tests of behaviour the step preserves, or audits that would still pass with the new behaviour taken out; the `yaml-edit.test.ts` "a compute list" cases are named as audits above. On the unchanged tree the real-hub case of `yaml-edit.test.ts` is skipped (`carries no hub data`).

## DONE / NOT DONE

All rows DONE. Commands run from `tools/oculus` of the worktree unless named; the rows marked "this turn" were run again while writing this report.

| Row | Command | Result |
|---|---|---|
| Verify list, one full run | `sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, output kept in `scratchpad/m3out/checks-run1.txt` | `Test Files  453 passed \| 23 skipped (476)` `Tests  11779 passed \| 628 skipped (12407)`; `Test Files  29 passed \| 2 skipped (31)` `Tests  445 passed \| 9 skipped (454)`; `COMPLETED 3009 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `built in 7.09s`, `built in 18.55s`; `All matched files use Prettier code style!`; `checks: 7 commands passed` |
| Full verify runs | counted | 1 |
| 2 cockpit selftests (this turn) | `python3 tools/cockpit/build.py --selftest` and `... --selftest --dummy` from the worktree root | both end `SELFTEST PASS` |
| 3 manifests (this turn) | `grep -rnE '^compute: *(hpc\|local)' projects --include=project.yml`; `grep -rnE '^compute:' projects --include=project.yml \| wc -l` | no output (exit 1); `17` |
| 4 old names (this turn) | the two greps of the brief's item 4 over `src config tests` | no output for both (exit 1 each) |
| 4a cockpit (this turn) | `bash tools/cockpit/tests/run.sh`; `python3 tools/cockpit/build.py --no-git-sync`; `grep -c 'data-compute="utwente"' tools/cockpit/cockpit.html`; the same for `this-mac` | `Ran 19 tests in 3.108s` `OK`; `PASS - 11 modules load in order, 20/20 window.CK exports present`; `9`; `8`. The generated `cockpit.html` and `AUDIT_AUTO.md` (gitignored) were removed afterwards |
| 5 registries parse (this turn) | `python3 -c "import yaml; yaml.safe_load(open('registries/resources.yml')); yaml.safe_load(open('tools/oculus/demo/registries/resources.yml'))"` | exit 0 |
| 6 first run | the table above | done |
| ASCII (this turn) | `LC_ALL=C grep -rna '[^ -~]' src tests` | no output |
| Diagrams | `npm run diagrams`; `tests/checks/diagrams/diagrams.test.ts` inside the full run | `layers.dot`, `layers.svg`, `layer-server.dot`, `layer-server.svg` rewritten; the check passes in the full run |
| Folder entries (this turn) | `ls <folder> \| wc -l` | `registries` 10, `demo/registries` 9, `src/lib/server/machine/hpc` 7, `tests/server/machine/hpc` 8, `tests/server/root/watch/portfolio` 6, `tests/data/snapshot` 5, `tests/fixtures` 10 |
| Size limit (this turn) | `bash utils/size-check.sh` | no output, exit 0 |
| `context.ts` size (this turn) | `wc -l src/lib/server/root/context.ts` | 882 |
| Allow list (this turn) | `grep -vc '^#'` on the old copy and on `tests/checks/tree/allow-duplication.txt` | 150 entries before, 121 after |

## Files with line counts

`wc -l` this turn. Source and config: `src/lib/data/index.ts` 269, `model/index.ts` 498, `model/model-entities.ts` 738, `snapshot/normalise.ts` 836, `snapshot/validate.ts` 894, `sources/config/settings.ts` 184, `sources/registries.ts` 141, `src/lib/server/machine/hpc/host.ts` 96 (new), `poll.ts` 364, `routes.ts` 42, `src/lib/server/root/context.ts` 882, `live-settings.ts` 236, `watch/portfolio.ts` 638, `src/routes/api/(machine)/hpc/+server.ts` 28, `src/lib/state/boards/board/facets.ts` 133, `filter-menu.ts` 128, `items.ts` 199, `presets.ts` 391, `state.ts` 117, `src/lib/state/forms/schema.ts` 260, `src/lib/views/shared/card/ProjectCard.svelte` 478, `src/lib/views/system/hpc/Hpc.svelte` 129, `src/lib/views/boards/projects/Projects.svelte` 394, `config/behavior.yml` 162, `config/sources.yml` 138, `config/catalogs/options.yml` 635, `config/catalogs/manifest-schema.yml` 74, `config/text/findings.yml` 122, `config/text/views/boards/project.yml` 136, `config/text/views/boards/projects.yml` 74, `config/text/views/system/hpc.yml` 79, `DESIGN.md` 430, `HELP.md` 304, `docs/diagrams/layers.dot` 81, `layers.svg` 441, `layer-server.dot` 150, `layer-server.svg` 730, `demo/registries/resources.yml` 25 (new). Hub: `registries/resources.yml` 31 (new) and the 17 `projects/**/project.yml` files, one line each. Cockpit: `page.py` 995, `render/cards.py` 278, `schema.py` 132, `serve_watch.py` 111, `assets/js/cockpit/02-views.js` 682, `data/config/text.yml` 805, `dummy/data/config/text.yml` 794. New tests: `tests/data/snapshot/resources.test.ts` 275, `tests/server/machine/hpc/host.test.ts` 160, `tests/server/root/watch/portfolio/built.test.ts` 153. `git diff --name-only HEAD` plus untracked files lists 127 paths: 17 manifests, 63 under `tests/` (54 of them `.test.ts`), the rest above and this report. The largest touched test files: `context-reload.test.ts` 900, `context.test.ts` 889, `projects.test.ts` 884.

## Judgment calls

1. **The Project literal in tests is built in one place.** Test files wrote out the full `Project` literal (`chips: [], results: [], ...`). The added `resourceIds` line changed the marks of the clones that `tests/checks/tree/allow-duplication.txt` holds and made further runs long enough to count as clones. 32 test files now import `projectOf` from `tests/fixtures/entities-fixture.ts` (`grep -rlE "import \{[^}]*projectOf" tests`), so a field added to `Project` is added once. The allow list went from 150 entries to 121. `board-fixture.ts`, `schema.test.ts` and `projects.test.ts` share the `RESOURCES` fixture from `entities-fixture.ts`; `board-software.test.ts` imports `project` from `board-fixture.ts`.
2. **`slurm.resource` is read from the configuration only when `hpc_host` is unset in the HPC route.** `src/routes/api/(machine)/hpc/+server.ts` takes `locals.server.local.hpcHost` as it stands and evaluates `slurmSettings` only without it, so a broken `slurm:` block does not stop a cancel on a machine that names its host.
3. **The project form drops a manifest key that names no resource when it saves.** `schema.ts:223` opens the compute field with `project.resourceIds`, which holds only the keys the registry has.
4. **The five host sentences are read by `textCatalog(config)['hpc.host_...']`** (five literal reads in `hostWordsOf`, `host.ts:90-94`), the form `tests/checks/source/keys.test.ts` recognises.
5. **`built` runs after an `isClosed()` check inside its own `try`**, and a throw logs `portfolio watch: the built callback failed: <reason>` and goes on.
6. **A board item's `compute` entries carry `order`** (`{ id, label, cluster, order }`, `items.ts:121`) because the facet breaks a tie of names by the registry order.
7. **`parseBoardState` takes the offered facets as an optional third argument** (`state.ts:93`) and `Projects.svelte` hands it `facets(items, preset)`; without the argument no value is dropped.
8. **`built.test.ts` writes the registry in `places/resources.yml`** and names it by a `config/places.yml` holding `resources_file`, since the held listener of `registries/` is the career file's watch.
9. **The cockpit watches `registries/resources.yml`** (`serve_watch.py`, `_WATCH_FILES`) so an edit rebuilds the served page.
10. **Read-only git commands** (`git status`, `git diff`, `git show`, `git ls-files`, `git rev-parse`) were used to compare the worktree with the base; no command changed git state.

## Before and after, as a user sees it

| Where | Before | After |
|---|---|---|
| A manifest | `compute: hpc` or `compute: local` | `compute: [utwente]` or `compute: [this-mac]`, comments kept (17 files) |
| Project card | a badge "HPC" or "Local" | one tag per resource, in manifest order, the resource's name, the HPC glyph on a cluster |
| Compute filter | values "HPC", "Local", "unset" | the resource names, then "unset" |
| A saved board filter `hpc` | kept as a value | dropped; the board opens with no compute filter |
| The project form | a select of `local`, `hpc` | a chips field from `registries/resources.yml` |
| `behavior.yml` | `slurm: host: utwente` | `slurm: resource: utwente` (`behavior.yml:75-76`); the Live HPC host is the `host` of that cluster entry; `hpc_host` of `local.yml` still wins |
| A server whose resource names no usable host | not possible | starts; the Live HPC view shows the sentence alone, no ssh runs, cancel and log answer with the sentence |
| Registry edits while the server runs | not applicable | the poller follows the edit after the portfolio rebuild |
| Cockpit | badges "HPC" and "Local" | one badge per key, `cb-hpc` for a cluster, `cb-local` otherwise |
| Text keys | `compute_hpc`, `compute_local`, `hpc_label`, `local_label` and the cockpit's unread keys | removed |

## Open facts

1. `tests/server/edit/yaml-edit.test.ts` "every manifest of the real hub, read only > touches one line of each when the status line is set" (slow-tagged) fails with `status is not a map` for `side-projects/gpu-game-boy`, `side-projects/residual` and `side-projects/scripted-os` (`vitest run --tagsFilter slow tests/server/edit/yaml-edit.test.ts tests/views/whole/chips.test.ts tests/server/core/git.test.ts`, output `scratchpad/m3out/final-slow3.txt`: `Test Files  1 failed | 2 passed (3)`, `Tests  1 failed | 111 passed (112)`). The manifests hold `status: idea` (a scalar, as `side-projects/residual/project.yml` line 2 shows); `git diff HEAD --stat -- side-projects` prints nothing, and no file under `src/lib/server/edit` is among the 127 changed paths. This step does not change that input or that code. `chips.test.ts` and `git.test.ts` pass in the same run.

## Brief errors, with evidence

1. **Item 4 contradicts itself.** It gives the `SHAPES` row as `{ field: 'compute', kind: 'list', nullable: false }` and later says "The `SHAPES` row is `nullable: true`, as `funding`'s, so a bare `compute:` is no finding". Case 9 needs `true`, which is built; `compute: hpc` then gives the list-shape finding, held by `resources.test.ts` "answers the old scalar with the list-shape finding and reads it as none".
2. **Item 5 says `Projects.svelte` keeps its call.** Case 23 (a saved `hpc` filter is dropped) needs the offered values in `parseBoardState`, which the old call did not pass, so the call changed and the file is outside the Paths list.
3. **Item 5 gives the item's `compute` entry as `{ id, label, cluster }`.** The tie-break by registry order of the facet needs the order, so `order` is added.
4. **The brief names no guard test that a new field and a new registry trip:** `tests/checks/tree/duplication.test.ts`, `negatives.test.ts`, `comment-width.test.ts`, `tests/checks/source/keys.test.ts`, `tests/checks/config/integrity.test.ts` (its `REGISTRY_LISTS`), and the registry lists of `portfolio-config.test.ts` and `validate-shapes.test.ts`. All pass in the full run.
5. **Verify grep 4's second pattern matches a test that proves a block still holding `host` is refused.** That test builds the block from a variable now (`const legacy = { host: 'utwente' }`), so the grep prints nothing.

## Files changed outside "Paths this step writes"

| File | Item that needed it |
|---|---|
| `tools/cockpit/src/cockpit/serve_watch.py` | the cockpit's served page rebuilds on an edit of `registries/resources.yml` (`_WATCH_FILES`) |
| `tools/oculus/src/lib/views/boards/projects/Projects.svelte` | item 5 / case 23: hands the offered facets to `parseBoardState` |
| `tools/oculus/tests/fixtures/entities-fixture.ts` | `RESOURCES` and `projectOf`, shared by the tests |
| the 32 test files that import `projectOf` (`grep -rlE "import \{[^}]*projectOf" tests`) | judgment call 1 |
| `tools/oculus/tests/checks/tree/allow-duplication.txt` | judgment call 1 |
| `tools/oculus/tests/checks/config/integrity.test.ts` | the eighth registry in `REGISTRY_LISTS` |
| `tools/oculus/tests/data/portfolio-config.test.ts`, `tests/data/snapshot/validate-shapes.test.ts` | the eighth registry in their path and name lists |


## M3 report, repair round 1

## First section: what is not done

1. **The report file was not rewritten.** The Write tool refused the write with "Subagents should return findings as text, not write report files". `tools/oculus/.scratch/migration/agents/reviews/M3-report.md` in the worktree still holds the report from before this round. The whole report is in this message. The three big generated tables are data files I could write, so this message cites them by path instead of repeating them:
   - `agents/reviews/M3-round1-fail-table.md` (the 132 failing rows)
   - `agents/reviews/M3-round1-allow-duplication.diff` (the allow-list diff)
   - `agents/reviews/M3-round1-preserved.md` (the preserved-test list; also inline below)
   - `SP` = `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`.
2. **Z255's `history` key is not read here, because this worktree's base has no such key.**
   - `grep -n history src/lib/data/sources/config/local.ts` prints nothing here. Main holds it at `local.ts:299`.
   - The one reader (`localPath`, `local.ts:138-143`, used at `:187` and in the path-key loop at `:302`) covers every key that loop holds.
   - At landing, three things are needed: add `['history', 'history']` to the loop, add the same pair to `KEYS` in `tests/data/sources/config/local.test.ts:194`, and keep `localPath(value, base)` where main has `isAbsolute(value) ? value : resolve(base, value)`.
   - Main's `accountDir` is named `localPath` here, since it now serves accounts and path keys alike. Take this name for both call sites.
3. **A slow test fails on main the same way, for the reviewer's reason.** `tests/server/edit/yaml-edit.test.ts` "every manifest of the real hub, read only > touches one line of each when the status line is set" fails with `status is not a map` on `side-projects/gpu-game-boy`, `residual` and `scripted-os`. Those manifests hold the scalar `status: idea`. No file of this step touches them or `src/lib/server/edit`. Main has moved that file to `tests/server/edit/yaml/`.
4. **`bash tools/cockpit/tests/run.sh` exits 1 in this worktree.** `test_presentation.py` raises `ModuleNotFoundError: No module named 'deck_config'`, because the worktree has no `tools/present` folder. With `tools/present` linked for one run it exits 0 (ledger row 3). The link was removed afterwards.

Everything else the round asks is built and verified. Full verify-list runs: **2 of at most 3**. The final lines of `sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, from `tools/oculus` of the worktree (output `SP/m3r1/checks-run2.txt`):

```
$ npm test
 Test Files  454 passed | 23 skipped (477)
      Tests  11819 passed | 628 skipped (12447)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  445 passed | 9 skipped (454)
$ npm run check
1790946163295 COMPLETED 3011 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
✓ built in 45.10s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
> eslint .
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit 0
```

## Open items from the state file

Copied from `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` as it stands now.

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.
- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line). Count at 2026-10-02 13:05: 1 of 10 (X3a, landed 11:49). Nothing is asked of Axel until the count reaches 10.

## What changed, per ruling

**The unchanged tree.** It is main's source and config as the worktree was cut (`SP/m3r1/unchanged`) with this step's final test files over its `tests/`. Every "failing on the unchanged tree" line comes from `node node_modules/vitest/vitest.mjs run --reporter=json` over the 56 test files this step adds or changes (`SP/m3r1/fr2-a.json`, `fr2-b.json`, `fr2-c.json`): 132 tests fail and the 18 tests of `host.test.ts` do not load. The same 56 files in the worktree (`m3r1/touched-a.txt`, `touched-b.txt`, `touched-c.txt`):
- `Tests  768 passed (768)`
- `Tests  723 passed (723)`
- `Tests  101 passed (101)`

A "taken out" proof is a run of the named test files in a copy of the final tree (`m3r1/mut`, which `diff -rq` shows equal to the worktree's `src`, `config` and `tests`) with one code fragment removed. The rows are in "Behaviour taken out" below.

**1. `LiveStart`.**
- `src/lib/server/root/live-settings.ts:36-50`: `hpcHost: () => string | undefined` stays (`:38`). `resources: () => Record<Id, Resource> | null` (`:40`) and `hostWords: HostWords` (`:42`) are added. `const { hpcHost, ...held } = start;` stays at `:88`.
- `src/lib/server/root/context.ts:565-567` passes the three as separate fields.
- `grep -rn HostSource src tests docs DESIGN.md HELP.md` prints nothing (exit 1).
- Proofs by removal: A22, A23, A24, A25.

**2. Spec 2 and Spec 3.**
- `tools/cockpit/src/cockpit/serve_watch.py:13` and `Projects.svelte:85-89` are kept, each listed under "Paths written outside the brief's list".
- `serve_watch.py` now has a test, `watch_covers_resources` in `tools/cockpit/tests/test_engine.py`. It plants `registries/resources.yml` in a scratch root and asks `signature(root)` and `changed(...)` for it.
- With the `_WATCH_FILES` entry removed, `python3 tools/cockpit/tests/test_engine.py` prints:
  ```
  FAIL (1)
    serve_watch.signature(root) does not list registries/resources.yml
  ```
  With the entry in place it prints `PASS - engine compiles, imports, selftest + audit clean`.
- For `Projects.svelte`, A37 removes the offered facets from the `parseBoardState` call.

**3. Spec 4, the route's composition.**
- `src/lib/server/machine/hpc/host.ts:87` `hpcRouteHost({ hpcHost, hub, config })` returns the machine's `hpc_host` without reading the configuration. Otherwise it returns `hpcHostOf` over `latestResources(hub)` (`host.ts:77`) with `slurmSettings(config).resource`, which gives the host or the sentence.
- `src/routes/api/(machine)/hpc/+server.ts:10-19` keeps only the call.
- Tests: `tests/server/machine/hpc/host.test.ts`, describe `hpcRouteHost` (five cases, `:166-224`).
- With the snapshot read taken out (`resources: latestResources(input.hub),` replaced by `resources: null,`, mutation A12):
  ```
  FAIL  tests/server/machine/hpc/host.test.ts > hpcRouteHost > gives the host of the cluster slurm.resource names in the latest snapshot
  AssertionError: expected { host: '', ...(1) } to deeply equal { host: 'utwente' }
  -   "host": "utwente",
  +   "host": "",
  +   "missing": "the resources registry is not read yet",
  ```
- A13 takes out the order (the configuration is read only without an `hpc_host`) and fails `host.test.ts:187:16`.

**4. Proof 1, the legacy block.**
- `tests/server/machine/hpc/host-context.test.ts:296-306` writes the block that holds `host:` and no `resource:` inline. The case moved there with the other host cases when `context.test.ts` was split (ruling 6).
- The second grep of verify 4, `grep -rnE "slurm.*host:|'slurm', \{ host" tests`, prints one line, and it is the test of the refusal:
  ```
  tests/server/machine/hpc/host-context.test.ts:302:            await run.push(configWith({ slurm: { ...bare, host: 'utwente' } }));
  ```
- The first grep (`grep -rn "slurm\.host\|SlurmSettings.host\|COMPUTE_VALUES\|compute_hpc\|compute_local\|hpc_label\|local_label" src config tests --exclude=local.yml`) prints nothing (exit 1).
- The case expects `config: config/behavior.yml: slurm.resource must be a non-empty string; the settings in force are kept` once, and no call of the poller's setter.
- `bare` is the inert `slurm` block without its `resource`, so the refusal it expects is the only one that can arise.

**5. Proof 2, the five tests the first review named.** The failing line on the unchanged tree, then the assertion at that place:

| Test | Failing line | Assertion |
|---|---|---|
| `portfolio-config.test.ts` "answers the defaults for a config holding nothing" | `AssertionError: expected { scan: [], ...(10) } to strictly equal { scan: [], ...(10) }` at `:34:49` | `expect(portfolioConfigFrom({}, ENGINE)).toStrictEqual({`; the expected value holds `resources: 'registries/resources.yml'` |
| `portfolio-config.test.ts` "reads each key of the wrong type as absent and keeps the rest of its list" | `expected { scan: [ ...(3) ], ...(10) } to strictly equal { scan: [ ...(3) ], ...(10) }` at `:83:22` | `expect(read).toStrictEqual({` |
| `config-folder.test.ts` "holds exactly the expected top-level keys, and no more" | `expected [ 'agents', 'arch_color', ...(96) ] to deeply equal [ 'agents', 'arch_color', ...(97) ]` at `:375:44` | `expect(Object.keys(config).sort()).toEqual(expected);`; the 97th key is `resources_file` |
| `config-folder.test.ts` "reads each file on its own and finds its own keys there and nowhere else" | `expected [ 'career_file', 'collections', ...(13) ] to deeply equal [ 'career_file', 'collections', ...(14) ]` at `:684:48` | `expect(Object.keys(parsed).sort()).toEqual([...keys].sort());` |
| `normalise.test.ts` "fills a project from the manifest keys of the same meaning" | `expected { id: 'alpha', tier: 'active', ...(36) } to deeply equal { id: 'alpha', tier: 'active', ...(37) }` at `:258:23` | `expect(alpha).toEqual({`; the 37th field is `resourceIds` |
| `portfolio.test.ts` (watch) "publishes a portfolio worded by key over a broken sentence file, and rewords it once repaired" | `expected [ ...(3) ] to deeply equal [ ...(4) ]` at `:677:28` | `expect(messages()).toEqual([`; the third `file_missing` is for `registries/resources.yml` |
| `projects.test.ts` "shows only what a filter leaves" | `expected +0 to be 1 // Object.is equality` at `:544:80` | `expect(cards(html('projects', { filters: { compute: ['utwente'] } }))).toBe(1);` |

- **All 132 failing rows** (test and failing line, plus the 18 tests of `host.test.ts` failing together with `Error: Cannot find module '../../../../src/lib/server/machine/hpc/host.ts'`) are in `agents/reviews/M3-round1-fail-table.md`.
- **Per-file counts of the failing tests** (the 132 failing tests, not the 18 that do not load):

  | Test file | Failing |
  |---|---|
  | `context.test.ts` | 23 |
  | `context-reload.test.ts` | 22 |
  | `local.test.ts` | 16 |
  | `resources.test.ts` | 14 |
  | `settings.test.ts` | 11 |
  | `host-context.test.ts` | 9 |
  | `board-filters.test.ts` | 9 |
  | `built.test.ts` | 6 |
  | the other files | the remaining 22 |

- **Preserved behaviour, per file.** These are the tests whose text this step changes (the line diff of the file against the main checkout's copy touches the test) that pass on the unchanged tree and pass after. In `local.test.ts` only the tests of this round are listed, since main's copy holds a `history` key this base does not. Each passed in both runs (`fr2-*.json` and `afl-*.json`).
  - `checks/config/options-catalog.test.ts` (3): an option and an entry that do not match > names a map whose entries are all missing once, at its own path; ... names each key of a map that keeps an entry of its own; ... names a key and an entry that are reserved names of objects
  - `data/snapshot/normalise.test.ts` (1): normalise, the field mapping > numbers the lines of a checklist written as a list, since a list has no keys of its own
  - `data/sources/career.test.ts` (1): normalising it > answers null for a hub with no career file
  - `data/sources/config/local.test.ts` (8): a path key of local.yml > keeps `<key>` without ~/ as absolute or under the engine folder, for each of the 8 keys
  - `routes/machine/hpc.test.ts` (1): HPC route > refreshes while there is no host
  - `server/machine/hpc/poll-live.test.ts` (3): drops the rows of a poll begun under the old window and answers with one poll at the new one; a host the settings do not give > arms the short retry as for an unreachable cluster; ... publishes nothing for a sentence set after the watcher is closed
  - `server/root/watch/portfolio/names.test.ts` (3): relevant > takes a PRESENT.md, whose front matter is in the snapshot, and no other markdown; watchedDirectories > names every scan tier and the folder of every registry, collection and feed file; ... names the .oculus folder of every root once, however many keys reach one directory
  - `state/boards/board/board-filter-menu.test.ts` (2): ticks the values in force and no other; counts every value in force over every facet on the control
  - `state/boards/board/board-filters.test.ts` (2): facets > gives a facet value the words of its own vocabulary; parseBoardState > keeps every value when it is not told what the board offers
  - `state/boards/collection/collection.test.ts` (1): entrySubtasks > reads a map of keys by its own keys, and an entry with no block as nothing
  - `state/feeds/feeds.test.ts` (2): feed state > reads every kind and its schema from one received feeds message; attention lines > carries registry ids and keeps two venues with one label separate
  - `state/forms/schema.test.ts` (1): where the choices come from > resolves a literal list to itself
  - `state/system/settings/rows.test.ts` (4): calls a key that is absent, or written with no value, missing and not Modified; calls an alias, an anchored, a tagged and a block-scalar value missing, as the write does; reads the line of the key itself and never line one by default; the groups and the table of contents > draws the rows of a section in catalog order, gathered under their section
  - `state/system/settings/search.test.ts` (1): the words of a search > keeps the rows holding the word in title, key path, section or description
  - `state/system/settings/write.test.ts` (1): the value a control text makes > takes the text of a text option, the boolean of a toggle and a value of a choice
  - `views/boards/projects.test.ts` (1): the facets > counts the values in force on the control
  - `views/sessions/sessions.test.ts` (1): resuming a session into a terminal > puts a row menu on every session row
  - `views/shared/card/card.test.ts` (1): a session pressed on a project card > audits that it opens nothing more on a page showing a view that follows the session
  - `views/system/hpc.test.ts` (1): Live HPC view > keeps the partition and disk rows on a failed poll whose queue is empty
  - `views/system/workbench/settings.test.ts` (3): the search and its count > draws the query saved in the tab in the search box, and only the rows it keeps; Modified, the default and the file and line of an option > marks a Modified row with its bar and no other; the reveal of the rail list > draws the rail row whatever the query when the tab was opened to show it

**6. Files at their cap** (`wc -l`):

| File | Lines | Cap |
|---|---|---|
| `tests/server/root/context-reload.test.ts` | 802 | 820 |
| `tests/server/root/context.test.ts` | 852 | 860 |
| `src/lib/data/snapshot/validate.ts` | 837 | 860 |

- The host and resources cases of both test files are in `tests/server/machine/hpc/host-context.test.ts` (306 lines, beside `host.test.ts` and `poll-live.test.ts`).
- `checkResources` and its rows are in `src/lib/data/snapshot/validate-kinds.ts` (66 lines). It also holds `checkOrganisations`, which checks a `kind:` word the same way.
- `bash utils/size-check.sh` and `bash utils/folder-check.sh` print nothing and exit 0.
- Folder item counts: `tests/server/machine/hpc` 9, `src/lib/server/machine/hpc` 7, `tests/server/root` 10, `src/lib/data/snapshot` 8.
- `src/lib/server/root/context.ts` is 883 lines against the cap of 900. The ruling did not name it, and D18 adds lines beside the same code at its landing.

**7. History wording.**
- `src/lib/state/boards/board/state.ts:85-89` names what it drops ("a compute value that none of them offers ... names a resource the registry does not hold, such as `hpc`").
- `settings.test.ts:93` is "refuses a block with host: and no resource:, naming slurm.resource".
- `host-context.test.ts:296` names the input.
- `resources.test.ts:245` is "answers a scalar compute: with the list-shape finding and reads it as none".
- A scan of the files the step writes for `no longer|used to |formerly|previously|was renamed|replaces the|was removed|still` hits only lines this step did not write (`index.ts:121`, `model-entities.ts:475`, `normalise.ts:431-432`, `validate.ts:72` and `:599`, `local.ts:332`, `poll.ts:235` and `:275`, `context.ts:516`, `portfolio.ts:275` and `:302`, `facets.ts:117`, `presets.ts:323`, `schema.ts:101`, `context-fixture.ts:193`).

**8. Exports.**
- `RESOURCE_KINDS`, `RESERVED_RESOURCE_KEYS` and `ResourceFault` are local to `normalise.ts:453-459`.
- Each export the step adds, with its importers (`grep -rlw <name> src tests`):

  | Export | Importers |
  |---|---|
  | `Resource` | `host.ts`, `live-settings.ts`, `normalise.ts`, `model/index.ts`, tests |
  | `keptResources` | `validate.ts` |
  | `resourceFaults` | `validate-kinds.ts` |
  | `checkOrganisations`, `checkResources` | `validate.ts` |
  | `HostWords` | `live-settings.ts`, `host.test.ts` |
  | `hostWordsOf` | `context.ts`, `live-settings.ts`, `host.test.ts` |
  | `hpcRouteHost` | `+server.ts`, `host.test.ts` |
  | `hpcSettingsOf` | `live-settings.ts`, `context.ts`, `host.test.ts` |
  | `latestResources` | `context.ts` |
  | `HpcSettings` | `host.ts`, `live-settings.ts` |

- `configWith`, `blockWith` and `inertHpc` of `tests/server/root/context-fixture.ts` are used by `context.test.ts`, `host-context.test.ts` and `context-reload.test.ts`.

**9. Head comments of the yml files.** `registries/resources.yml:1-3`, `tools/oculus/demo/registries/resources.yml:1-3` and `tools/oculus/config/sources.yml:49` have one line per paragraph. `grep -n '^#.* - \|^#.*--'` over the two registry files prints nothing, and `sed -n 49p config/sources.yml | grep -c ' - '` prints 0.

**10.** The edits are in "Edits to existing assertions" below.

**11.** The tooltip is in "Before and after" below.

**12. Z255.**
- `local.ts:138-143` `localPath(value, base)`:
  - `~` alone is the home folder.
  - A value starting with `~/` is under it.
  - An absolute value stands.
  - Any other value is resolved against the engine folder.
- The account `dir` (`:187`) and the path-key loop (`:302`) both use it, so there is one reader.
- `tests/data/sources/config/local.test.ts:193-234` (describe "a path key of local.yml") stubs its own `HOME` with `vi.stubEnv`, so the machine's home is never read. For `sessions_cache`, `sessions_overrides`, `workspaces`, `bookmarks`, `notes`, `changes`, `calendar_dir` and `mail_dir` it asserts:
  - `~/state/<key>` reads as `<home>/state/<key>`.
  - `"~"` reads as `<home>`.
  - `state/<key>` and `/srv/state/<key>` keep their reading.
- HELP.md:238 and `config/catalogs/options.yml:611-635` (the eight entries) say that a value starting with `~/` is under the home folder.
- On the unchanged tree the 16 new cases fail: `AssertionError: expected '/var/folders/...' to be '/var/folders/...' // Object.is equality` at `local.test.ts:220:29` (eight `~/` cases) and `:225:29` (eight `~` cases).
- A scratch `local.yml` holding `sessions_cache: ~/state/x` and `notes: "~"` read by the unchanged reader gives (the machine's `local.yml` was never opened):
  ```
  sessionsCache: <engine folder>/~/state/x
  notes:         <engine folder>/~
  ```
- Proofs by removal: A26 (16 failing, `local.test.ts:220:29`) and B11 (8 failing, `:225:29`).
- The 8 cases "keeps `<key>` without ~/ ..." pass on the unchanged tree and after (preserved list above).

**13. The newer rule sentences.** The removal runs are in the table below, the head comments and documents in "Head comments and document paragraphs", the asynchronous paths in "Asynchronous paths", and each DONE row quotes its last line.

## Edits to existing assertions, allow lists and predicates

Before and after, from the line diff of each test file against the base copy:

| File | Before | After |
|---|---|---|
| `tests/checks/tree/allow-duplication.txt` | 150 entries | 121 entries: 46 marks removed and 17 added, and no pair gained (`comm` over the first three fields of each entry: 24 pairs gone, 0 new). The 17 added are the same pairs under new marks, because the `Project` literal that carried `compute: 'hpc'` is `projectOf(...)` in 32 test files. Full diff in `agents/reviews/M3-round1-allow-duplication.diff`. |
| `tests/server/root/watch/portfolio/portfolio.test.ts:675-694` | `[id_not_folder, file_missing, file_missing]` and the reworded list with two `registry file does not exist` | three `findings.registries.file_missing` and three `registry file does not exist` (the fixture hub keeps no people, organisations or resources registry); the comment says "three findings of its own" |
| `tests/server/root/context-reload.test.ts:412-424` | title "... and slurm.host of the configuration in force when it is removed"; `expect.objectContaining({ host: 'cluster' })` | title "... and the sentence for no host when it is removed"; `expect.objectContaining({ host: '', missing: 'not read yet' })`; the exact-once expectation is `inertHpc('login-two')` |
| `tests/server/root/context.test.ts` | inert `slurm` block `host: 'cluster'` (`:358`); `started(hpcHost?)`, `inRun(body, hpcHost?)` and the case "keeps the host the machine names, so a pushed slurm.host reaches the poller only without one"; a pushed text catalog without an `hpc` group; the refused-values table without `slurm.resource` | `resource: 'cluster'`; the `hpcHost` parameters and that case moved to `host-context.test.ts:259` with `resource`; the pushed text catalog carries `hpc: hostSentences` (`:603-624`); `['slurm', 'resource', '', 'a non-empty string']` added (`:837`) |
| `tests/state/boards/board/board-filters.test.ts` | compute facet `['hpc:1', 'local:1', 'NONE:4']`; filters `compute: ['hpc']` (twice) | `['this-mac:1', 'utwente:1', 'NONE:4']`; `compute: ['utwente']` |
| `tests/state/boards/board/board-filter-menu.test.ts` | `{ value: 'hpc', label: 'hpc', count: 1 }`; labels ``${catalog['board.compute_hpc']} 1``; title "gives a value that is vocabulary its catalog words"; `compute: ['hpc', NONE]`, `['hpc', 'local']` | `{ value: 'utwente', label: 'UTwente HPC', count: 1 }`; `'UTwente HPC 1'`; title "gives a resource its recorded name and the value that stands for none its catalog words"; `['utwente', NONE]`, `['utwente', 'this-mac']` |
| `tests/views/boards/projects.test.ts` | manifests `compute: 'hpc'`, `'local'`; asserts on `catalog['project.card.hpc_label']` and `['project.card.local_label']`; filters `['hpc']`, `['hpc', 'local']` | `resourceIds: ['utwente', 'data']`, `['this-mac']`; asserts the tag texts `UTwente HPC`, `Local data`, `This Mac`; filters `['utwente']`, `['utwente', 'this-mac']` |
| `tests/views/whole/chips.test.ts` | `compute: 'hpc'`; the words list holds `catalog['project.card.hpc_label']` | `compute: [{ id: 'this-mac', label: 'This Mac', cluster: false, order: 1 }]`; the words list holds `'This Mac'` |
| `tests/data/snapshot/normalise.test.ts` | manifest and expected `compute: 'hpc'` | manifest `compute: ['utwente']` with a `resources` registry; expected `resourceIds: ['utwente']` |
| `tests/state/forms/schema.test.ts` | "resolves a literal list to itself" expects `[{ id: 'hpc', ... }, { id: 'local', ... }]` for `compute` | expects the choices of `code_availability.visibility` (`public`, `private`); `compute` has its own cases (chips from `resources`) |
| `tests/data/sources/config/settings.test.ts` | `BLOCK = { host: 'h', ... }`; "refuses a host of %j"; "refuses the host before the prewarm ..."; `slurm.host must be a non-empty string` | `BLOCK = { resource: 'h', ... }`; "refuses a resource of %j"; "refuses the resource before the prewarm ..."; `slurm.resource must be a non-empty string`; the value read is `{ resource: 'h', days, pollMin, quotaMin, prewarm }` |
| `tests/checks/config/options-catalog.test.ts` | `slurm.host` in 15 lines | `slurm.resource` in the same lines |
| `tests/state/system/settings/{rows,search,write}.test.ts`, `tests/views/system/workbench/settings.test.ts` | fixtures and expectations on `slurm.host` | `slurm.resource`, same lines |
| `tests/checks/config/config-folder.test.ts` | expected top-level keys and `sources.yml` keys | each gains `resources_file` |
| `tests/data/portfolio-config.test.ts`, `tests/server/root/watch/portfolio/names.test.ts` (3 places), `tests/checks/config/integrity.test.ts` (`REGISTRY_LISTS`), `tests/data/snapshot/validate-shapes.test.ts`, `validate.test.ts`, `tests/data/sources/career.test.ts` | seven registries | each gains `resources` / `registries/resources.yml` |
| `tests/data/demo-hub.test.ts` | "holds the seven registries"; counts without `resources` | "holds the eight registries"; `resources: 2` |

## Behaviour taken out

Each row removes one code fragment from the copy `m3r1/mut`, runs the named test files, and restores the fragment (scripts `m3r1/mut2.py` and `mut3.py`). Rows A are 53 and rows B are 12. Every row has at least one failing test, so no mutation survives. Rows whose test files changed late were run again on the final files, so the locations are those of the final files.

Format: `# | taken out | failing tests | first failing assertion`

```
A0 | settings.ts: slurm.resource must be non-empty text | 6 | tests/data/sources/config/settings.test.ts:80:46
A1 | registries.ts: a resources entry needs a key | 1 | tests/data/snapshot/resources.test.ts:119:40
A2 | normalise.ts: duplicate key fault | 1 | tests/data/snapshot/resources.test.ts:161:40
A3 | normalise.ts: reserved key fault | 1 | tests/data/snapshot/resources.test.ts:183:58
A4 | normalise.ts: kind fault | 2 | tests/data/snapshot/resources.test.ts:97:40
A5 | normalise.ts: project keeps only known resource keys | 4 | tests/data/snapshot/resources.test.ts:106:62
A6 | normalise.ts: project resource keys counted once | 1 | tests/data/snapshot/resources.test.ts:273:37
A7 | validate-kinds.ts: checkResources reports nothing | 4 | tests/data/snapshot/resources.test.ts:97:40
A8 | host.ts: hpc_host wins | 4 | tests/server/machine/hpc/host-context.test.ts:136:37
A9 | host.ts: only a cluster has a host | 3 | tests/server/machine/hpc/host-context.test.ts:219:32
A10 | host.ts: a host must be an ssh alias | 1 | tests/server/machine/hpc/host.test.ts:112:54
A11 | host.ts: an own key only | 1 | tests/server/machine/hpc/host.test.ts:83:47
A12 | host.ts: route reads the latest snapshot | 2 | tests/server/machine/hpc/host.test.ts:195:25
A13 | host.ts: route reads config only without hpc_host | 1 | tests/server/machine/hpc/host.test.ts:187:16
A14 | poll.ts: a changed sentence is a change | 2 | tests/server/machine/hpc/poll-live.test.ts:559:31
A15 | poll.ts: no host publishes the sentence, runs no ssh | 5 | tests/server/machine/hpc/poll-live.test.ts:519:31
A16 | poll.ts: no quota read without a host | 2 | tests/server/machine/hpc/poll-live.test.ts:526:32
A17 | routes.ts: cancel and log refused without a host | 1 | tests/routes/machine/hpc.test.ts:57:43
A18 | portfolio.ts: built called after a rebuild | 6 | tests/server/root/watch/portfolio/built.test.ts:104:26
A19 | portfolio.ts: built not called after close | 1 | tests/server/root/watch/portfolio/built.test.ts:168:22
A20 | portfolio.ts: a throw of built is logged | 1 | tests/server/root/watch/portfolio/built.test.ts:142:68
A21 | context.ts: a rebuild resolves the host again | 2 | tests/server/machine/hpc/host-context.test.ts:151:32
A22 | context.ts: the poller starts over the latest snapshot | 1 | tests/server/machine/hpc/host-context.test.ts:126:39
A23 | live-settings.ts: a local.yml write resolves the host again | 5 | tests/server/root/context-reload.test.ts:417:37
A24 | live-settings.ts: a push renews the sentences | 1 | tests/server/machine/hpc/host-context.test.ts:289:37
A25 | live-settings.ts: a push resolves over the pushed resource | 8 | tests/server/root/context.test.ts:580:37
A26 | local.ts: ~/ in a path key is under home | 16 | tests/data/sources/config/local.test.ts:220:29
A27 | facets.ts: a project counts under each resource | 10 | tests/views/boards/projects.test.ts:531:22
A28 | facets.ts: a resource is named by its name | 2 | tests/state/boards/board/board-filters.test.ts:115:36
A29 | facets.ts: equal names ordered by registry position | 1 | tests/state/boards/board/board-filters.test.ts:145:51
A30 | facets.ts: unset listed last | 4 | tests/state/boards/board/board-filters.test.ts:40:51
A31 | filter-menu.ts: unset has its catalog word | 2 | tests/state/boards/board/board-filter-menu.test.ts:87:51
A32 | items.ts: card tag marks a cluster | 2 | tests/views/boards/projects.test.ts:344:21
A33 | items.ts: a key the registry lacks is dropped | 1 | tests/state/boards/board/board-filters.test.ts:100:53
A34 | state.ts: a saved compute value not offered is dropped | 2 | tests/views/boards/projects.test.ts:554:61
A35 | schema.ts: the compute field takes the resources registry | 1 | tests/state/forms/schema.test.ts:218:38
A36 | schema.ts: the compute field opens with the project keys | 1 | tests/state/forms/schema.test.ts:251:32
A37 | Projects.svelte: offered facets reach parseBoardState | 1 | tests/views/boards/projects.test.ts:554:61
A38 | ProjectCard.svelte: the cluster tag has the HPC glyph | 1 | tests/views/boards/projects.test.ts:344:21
A39 | Hpc.svelte: the sentence stands alone | 1 | tests/views/system/hpc.test.ts:324:26
A40 | Hpc.svelte: no host footer without a host | 1 | tests/views/system/hpc.test.ts:328:26
A41 | findings.yml: resource_duplicate sentence | 1 | tests/data/snapshot/resources.test.ts:165:17
A42 | data/index.ts: the resources path is read from resources_file | 6 | tests/server/root/watch/portfolio/built.test.ts:104:26
A43 | validate.ts: a compute key the registry lacks is a finding | 3 | tests/data/snapshot/resources.test.ts:97:40
A44 | validate.ts: compute must be a list | 1 | tests/data/snapshot/resources.test.ts:247:40
A45 | validate.ts: the resource id set holds only kept entries | 1 | tests/data/snapshot/resources.test.ts:97:40
A46 | ProjectCard.svelte: the tag is the entry name | 1 | tests/views/boards/projects.test.ts:344:21
A47 | manifest-schema.yml: compute is a chips field from resources | 2 | tests/state/forms/schema.test.ts:218:38
A48 | hpc.yml: host_unusable sentence | 3 | tests/checks/source/keys.test.ts:313:25
A49 | hpc.yml: host_not_read sentence (shipped) | 3 | tests/checks/source/keys.test.ts:313:25
A50 | behavior.yml: slurm.resource key (shipped) | 2 | tests/checks/config/options-catalog.test.ts:111:53
A51 | options.yml: slurm.resource entry | 1 | tests/checks/config/options-catalog.test.ts:111:53
A52 | options.yml: resources_file entry | 1 | tests/checks/config/options-catalog.test.ts:111:53
B0 | normalise.ts: a non-text host reads as none | 1 | tests/data/snapshot/resources.test.ts:213:52
B1 | normalise.ts: access is read | 1 | tests/data/snapshot/resources.test.ts:78:53
B2 | normalise.ts: links are read | 2 | tests/data/snapshot/resources.test.ts:78:53
B3 | validate-kinds.ts: a kind finding sits at entries[i].kind | 2 | tests/data/snapshot/resources.test.ts:97:40
B4 | host.ts: an empty host is no host | 1 | tests/server/machine/hpc/host.test.ts:113:57
B5 | routes.ts: a refused log answers with an empty log and path | 1 | tests/routes/machine/hpc.test.ts:57:43
B6 | live-settings.ts: an unchanged host is not handed again | 5 | tests/server/root/context.test.ts:702:81
B7 | items.ts: the registry position is carried | 1 | tests/state/boards/board/board-filters.test.ts:145:51
B8 | facets.ts: a resource is recorded from the first item that carries it | 1 | tests/state/boards/board/board-filters.test.ts:114:33
B9 | state.ts: other facets keep their saved values | 2 | tests/views/boards/projects.test.ts:540:80
B10 | poll.ts: the first settings carry the sentence | 1 | tests/server/machine/hpc/poll-live.test.ts:519:31
B11 | local.ts: a bare ~ is the home folder | 8 | tests/data/sources/config/local.test.ts:225:29
```

**The cockpit files** (`cards.py`, `schema.py`, `page.py`) have no test of their own for the badge, the tooltip or the filter facet. Brief verify 4a measures them by a hub build.
- Each row C1 to C6 removes one fragment from a copy of `tools/cockpit` in a copy of the hub (`m3r1/ckmut2.py`) and builds it with `python3 tools/cockpit/build.py --no-git-sync`.
- The baseline count is `data-compute="utwente"` 9, `data-compute="this-mac"` 8, `cb-hpc` badges 9, `cb-local` badges 8, badges titled "ssh from the UT network or EduVPN" 9, badge text "UTwente HPC" 9, and 5 compute filter buttons of which 2 are named "UTwente HPC".
- C1 to C6 are measured on a hub build and are not a repository test. C7 is a repository test.

| # | Taken out | Count that changes |
|---|---|---|
| C1 | `cards.py`: a badge and a `data-compute` per key | `data-compute` utwente 9 to 0, this-mac 8 to 0; `cb-hpc` 9 to 0; `cb-local` 8 to 0 |
| C2 | `cards.py`: the badge title is the entry's `access` | titled badges 9 to 0 |
| C3 | `cards.py`: a cluster has `cb-hpc` and the glyph | `cb-hpc` 9 to 0; `cb-local` 8 to 17; badge text "UTwente HPC" 9 to 0 |
| C4 | `schema.py`: the badge name is the entry name | badge text 9 to 0; filter buttons named "UTwente HPC" 2 to 0 |
| C5 | `page.py`: the compute facet counts each key | compute filter buttons 5 to 0 |
| C6 | `page.py`: the compute facet is named by the entry | the `utwente` facet button reads `utwente 8` in place of `UTwente HPC 8` |
| C7 | `serve_watch.py`: the served page watches `registries/resources.yml` | `test_engine.py` `watch_covers_resources` fails with `serve_watch.signature(root) does not list registries/resources.yml` |

## Asynchronous paths

Each row lists its tests (files under `tests/server/`):

| Path | In flight | After close | Superseded |
|---|---|---|---|
| The host resolved again after each portfolio rebuild (`context.ts:453` hands `built` to the watcher; `live-settings.ts` `hostChanged`) | `machine/hpc/host-context.test.ts` "keeps the host an hpc_host written names through a rebuild that ends after the write and one after that" | `host-context.test.ts` "hands the poller nothing for a rebuild that ends after the context is closed"; `root/watch/portfolio/built.test.ts` "is not called when the watcher is closed while the feeds are being published" and "is not called after close, whatever event follows" | `built.test.ts` "is called once for two edits inside one debounce, and sees the last"; `host-context.test.ts` "resolves the host again after each portfolio rebuild, and says why when the cluster has none" |
| The `built` callback of the portfolio watcher | `built.test.ts` "is called once for the first build, after the portfolio, audit and feeds are published" | as above | `built.test.ts` "logs a throw and goes on with the next rebuild" |
| The poll after a host change (`poll.ts`) | `machine/hpc/poll-live.test.ts` "drops the answer of a poll in flight when the host is taken away"; "drops the rows of a poll begun under the old host and answers with one follow-up poll" | "publishes nothing for a sentence set after the watcher is closed"; "does nothing once the watcher is closed: no timer, no poll, no publish" | "answers with the last of two sentences set in a row"; "publishes a new sentence at once when only the sentence changed" |
| The sentence pushed with a configuration | `host-context.test.ts` push describe (`:259`, `:279`) | `root/context.test.ts` "takes the sink off the hub on close, after which a push changes nothing and logs nothing" | `context.test.ts` "holds the settings of the last of two pushes made in quick succession" |

## Head comments and document paragraphs

**Head comments of the files the step writes**, each compared with main's copy of the head (`diff` of the leading comment lines):
- **Rewritten:**
  - `registries.ts` ("the eight registry files")
  - `schema.ts` ("one of the eight registries")
  - `live-settings.ts` (the Live HPC host has two sources, `hpc_host` of `local.yml` and the cluster entry of `registries/resources.yml` that `slurm.resource` names, read again after each portfolio rebuild)
  - `demo-hub.test.ts` ("the eight registries")
- **New:** `host.ts`, `validate-kinds.ts`, and the heads of `resources.test.ts`, `host.test.ts`, `host-context.test.ts`, `built.test.ts`. Each opens with its layer, what it is, and why it is shaped so.
- **Still true:**
  - Source files:
    - `data/index.ts`
    - `model/index.ts`
    - `model/model-entities.ts`
    - `snapshot/normalise.ts`
    - `snapshot/validate.ts`
    - `sources/config/local.ts`
    - `sources/config/settings.ts`
    - `server/machine/hpc/poll.ts`
    - `server/machine/hpc/routes.ts`
    - `server/root/context.ts`
    - `server/root/watch/portfolio.ts`
    - `state/boards/board/{facets,filter-menu,items,presets,state}.ts`
    - `routes/api/(machine)/hpc/+server.ts`
  - Test files, with heads read against the changed tests:
    - `context.test.ts`
    - `context-reload.test.ts`
    - `poll-live.test.ts`
    - `settings.test.ts`
    - `hpc.test.ts`
    - `context-fixture.ts`
    - `entities-fixture.ts`

**Documents and doc paragraphs** (grep of `resources.yml|slurm.resource|hpc_host|resources_file|compute:` over `DESIGN.md`, `HELP.md`, `README.md`):
- **Rewritten:**
  - `HELP.md:238` (`hpc_host` precedence over the cluster `slurm.resource` names; a value starting with `~/` is under the home folder)
  - `HELP.md:244` (the registries, with `resources.yml`)
  - `DESIGN.md:132` (Live HPC host source)
  - `DESIGN.md:240` and `:242` (pollers and `local.yml` keys)
  - `config/catalogs/options.yml:218`, `:561-563`, `:609`, `:611-635`
  - `config/behavior.yml:72-76`
  - `config/sources.yml:49-50`
  - `config/catalogs/manifest-schema.yml:68`
- **Added:** `DESIGN.md:402` (resources are a registry of their own, the `Resource` entity, the compute facet and the card tag).
- **Still true:** the `tools/oculus` `README.md` (no hit).

## DONE / NOT DONE

Commands run from `tools/oculus` of the worktree unless named. Each row gives the last line of its final run.

| Row | Command | Last line of the final run |
|---|---|---|
| 1 Verify list | `sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md` | `checks: 7 commands passed` (exit 0); test lines above |
| 2 Cockpit selftests | worktree root: `python3 tools/cockpit/build.py --selftest` and `... --selftest --dummy` | `SELFTEST PASS` (both, exit 0) |
| 3 Cockpit tests | worktree root: `bash tools/cockpit/tests/run.sh` with `tools/present` linked for the run (`SP/m3r1/runsh-with-present.txt`) | `PASS - 11 modules load in order, 20/20 window.CK exports present`, exit 0. Without the link it exits 1 on `test_presentation.py` alone |
| 4 Manifests | worktree root: `grep -rnE '^compute: *(hpc\|local)' projects --include=project.yml`; `grep -rnE '^compute:' projects --include=project.yml \| wc -l` | no output (exit 1); `17` |
| 5 Old names | the two greps of verify 4 | first: no output (exit 1); second: the one line of ruling 4 |
| 6 Hub build | worktree root: `python3 tools/cockpit/build.py --no-git-sync`, then `grep -c 'data-compute="utwente"'` and `grep -c 'data-compute="this-mac"'` on `tools/cockpit/cockpit.html` | `9` and `8`. The generated `cockpit.html` and `AUDIT_AUTO.md` were removed afterwards, and `cmp` of `tools/cockpit/dummy/AUDIT_AUTO.md` and `dummy/cockpit.html` with main's prints nothing |
| 7 Registries parse | `python3 -c "import yaml; yaml.safe_load(open('registries/resources.yml')); yaml.safe_load(open('tools/oculus/demo/registries/resources.yml')); print('parsed')"` | `parsed` |
| 8 Touched tests | `node node_modules/vitest/vitest.mjs run $(cat m3r1/fb-a.txt)`, then `fb-b.txt`, `fb-c.txt` (56 files) | `Tests  101 passed (101)`; the first batch ended `Tests  768 passed (768)`, the second `Tests  723 passed (723)` |
| 9 ASCII | the perl gate of `agents/spec.md` over `src tests config`; `LC_ALL=C grep -nP '[^\x00-\x7F]' tools/cockpit/tests/test_engine.py` | no output (both) |
| 10 Size and folders | `bash utils/size-check.sh`; `bash utils/folder-check.sh` | no output, exit 0 (both) |
| 11 Cockpit engine test | worktree root: `python3 tools/cockpit/tests/test_engine.py` | `PASS - engine compiles, imports, selftest + audit clean` |
| 12 First run | the failing table (`agents/reviews/M3-round1-fail-table.md`) | 132 failing rows, 18 tests not loading |
| 13 Mutations | the table above | 65 oculus rows, each with a failing test; C1 to C6 on a hub build; C7 a repository test |

## Files with line counts

`wc -l` after the last change.
- **Source and config:**
  - `src/lib/data/index.ts` 269
  - `model/index.ts` 498
  - `model/model-entities.ts` 738
  - `snapshot/normalise.ts` 836
  - `snapshot/validate.ts` 837
  - `snapshot/validate-kinds.ts` 66 (new)
  - `sources/config/local.ts` 361
  - `sources/config/settings.ts` 184
  - `sources/registries.ts` 141
  - `src/lib/server/machine/hpc/host.ts` 114 (new)
  - `poll.ts` 363
  - `routes.ts` 42
  - `src/lib/server/root/context.ts` 883
  - `live-settings.ts` 244
  - `watch/portfolio.ts` 638
  - `src/routes/api/(machine)/hpc/+server.ts` 20
  - `src/lib/state/boards/board/facets.ts` 133
  - `filter-menu.ts` 128
  - `items.ts` 199
  - `presets.ts` 391
  - `state.ts` 117
  - `src/lib/state/forms/schema.ts` 260
  - `ProjectCard.svelte` 478
  - `Hpc.svelte` 129
  - `Projects.svelte` 394
  - `config/behavior.yml` 162
  - `config/sources.yml` 138
  - `config/catalogs/options.yml` 635
  - `config/catalogs/manifest-schema.yml` 74
  - `config/text/findings.yml` 122
  - `config/text/views/boards/project.yml` 136
  - `config/text/views/boards/projects.yml` 74
  - `config/text/views/system/hpc.yml` 79
  - `DESIGN.md` 430
  - `HELP.md` 304
  - `demo/registries/resources.yml` 23 (new)
- **Hub:** `registries/resources.yml` 29 (new) and the 17 `projects/**/project.yml` files, one line each.
- **Cockpit:**
  - `page.py` 995
  - `render/cards.py` 278
  - `schema.py` 132
  - `serve_watch.py` 111
  - `assets/js/cockpit/02-views.js` 682
  - `data/config/text.yml` 805
  - `dummy/data/config/text.yml` 794
  - `tests/test_engine.py` 256
- **Tests:**
  - `resources.test.ts` 275 (new)
  - `host.test.ts` 250 (new)
  - `host-context.test.ts` 306 (new)
  - `built.test.ts` 178 (new)
  - `context.test.ts` 852
  - `context-reload.test.ts` 802
  - `context-fixture.ts` 257
  - `local.test.ts` 234
  - `entities-fixture.ts` 69

## Paths written outside the brief's list

| File | Reason |
|---|---|
| `tools/cockpit/src/cockpit/serve_watch.py` (`:13`) and `tools/cockpit/tests/test_engine.py` (`watch_covers_resources`, docstring item 8) | the served page rebuilds on an edit of `registries/resources.yml`; the test proves it |
| `tools/oculus/src/lib/views/boards/projects/Projects.svelte` (`:85-89`) | case 23: hands the offered facets to `parseBoardState` |
| `tools/oculus/src/lib/data/snapshot/validate-kinds.ts` | ruling 6: `validate.ts` ends at 837 lines |
| `tools/oculus/src/lib/data/sources/config/local.ts`, `tests/data/sources/config/local.test.ts` | ruling 12 (Z255) |
| `tools/oculus/tests/server/machine/hpc/host-context.test.ts` | ruling 6: the host and resources cases of `context.test.ts` and `context-reload.test.ts` |
| `tools/oculus/tests/server/root/context-fixture.ts` | `configWith`, `blockWith`, `inertHpc` |
| `tools/oculus/tests/fixtures/entities-fixture.ts` | `RESOURCES` and `projectOf`, shared by the tests |
| the 32 test files that import `projectOf` (`grep -rlE "import \{[^}]*projectOf" tests`) | judgment call 1 |
| `tools/oculus/tests/checks/tree/allow-duplication.txt` | judgment call 1 |
| `tests/checks/config/integrity.test.ts`, `tests/data/portfolio-config.test.ts`, `tests/data/snapshot/validate-shapes.test.ts`, `validate.test.ts`, `tests/data/sources/career.test.ts`, `tests/server/root/watch/portfolio/names.test.ts` | the eighth registry in their path and name lists |
| `tools/oculus/docs/diagrams/*` (redrawn by `npm run diagrams`) | the import graph changed (`validate-kinds.ts`, `host.ts` and their importers); `tests/checks/diagrams/diagrams.test.ts` passes in the full run |

## Judgment calls

1. **The `Project` literal in tests is built in one place.** The added `resourceIds` line changed the marks of the clones that `allow-duplication.txt` holds. 32 test files import `projectOf` from `tests/fixtures/entities-fixture.ts`. The allow list went from 150 to 121 entries.
2. **`slurm.resource` is read from the configuration only when `hpc_host` is unset in the HPC route** (`hpcRouteHost`, `host.ts:87`), so a `slurm:` block that does not read does not stop a cancel on a machine that names its host.
3. **The project form drops a manifest key that names no resource when it saves.** `schema.ts:223` opens the compute field with `project.resourceIds`, which holds only the keys the registry has.
4. **The five host sentences are read by `textCatalog(config)['hpc.host_...']`** (five literal reads in `hostWordsOf`, `host.ts:102-114`), the form `tests/checks/source/keys.test.ts` recognises.
5. **`built` runs after an `isClosed()` check inside its own `try`**, and a throw logs `portfolio watch: the built callback failed: <reason>` and goes on.
6. **A board item's `compute` entries carry `order`** (`{ id, label, cluster, order }`, `items.ts:121`), because the facet breaks a tie of names by the registry order.
7. **`parseBoardState` takes the offered facets as an optional third argument** (`state.ts:90-93`), and `Projects.svelte` hands it `facets(items, preset)`. Without the argument no value is dropped.
8. **`built.test.ts` writes the registry in `places/resources.yml`** and names it by a `config/places.yml` holding `resources_file`, since the held listener of `registries/` is the career file's watch.
9. **`validate-kinds.ts` holds `checkOrganisations` as well as `checkResources`.** Both check a `kind:` word against the words the entity is defined over, and moving only the resources check left `validate.ts` above 860.
10. **The legacy-block test spreads the inert `slurm` block** (`{ ...bare, host: 'utwente' }`) in place of the bare `{ host: 'utwente' }`, so the block differs from a valid one in `resource` alone.
11. **No cockpit test reads the badge, the tooltip or the facet.** `grep -rln "data-compute\|cb-hpc\|resources" tools/cockpit/tests` lists only `test_engine.py`, through `watch_covers_resources`. The proof for those three files is the hub-build rows C1 to C6.

## Before and after, as a user sees it

| Where | Before | After |
|---|---|---|
| A manifest | `compute: hpc` or `compute: local` | `compute: [utwente]` or `compute: [this-mac]`, comments kept (17 files) |
| Project card | a badge "HPC" or "Local" | one tag per resource, in manifest order, the resource's name, the HPC glyph on a cluster |
| Compute filter | values "HPC", "Local", "unset" | the resource names, then "unset" |
| A saved board filter `hpc` | kept as a value | dropped; the board opens with no compute filter |
| The project form | a select of `local`, `hpc` | a chips field from `registries/resources.yml` |
| `behavior.yml` | `slurm: host: utwente` | `slurm: resource: utwente` (`behavior.yml:75-76`); the Live HPC host is the `host` of that cluster entry; `hpc_host` of `local.yml` still wins |
| A server whose resource names no usable host | not possible | starts; the Live HPC view shows the sentence alone, no ssh runs, cancel and log answer with the sentence |
| Registry edits while the server runs | not applicable | the poller follows the edit after the portfolio rebuild |
| A `~/` path in `local.yml` (eight keys) | read as `<engine>/~/x` | under the home folder; `~` alone is the home folder |
| Cockpit | badges "HPC" and "Local" | one badge per key, `cb-hpc` for a cluster, `cb-local` otherwise |
| Cockpit badge tooltip | the fixed text "needs an HPC/SLURM cluster (GPU) for the headline results" on an HPC badge and "regenerates on a laptop - no cluster needed" on a Local badge | the entry's `access` text (for `utwente`: "ssh from the UT network or EduVPN"); none for an entry without an `access` |
| Text keys | `compute_hpc`, `compute_local`, `hpc_label`, `local_label` and the cockpit's unread keys | removed |

## Brief errors, with evidence

1. **Item 4 of `M3.md` contradicts itself.** It gives the `SHAPES` row as `nullable: false` and later says it is `nullable: true`. Case 9 needs `true`, which is built, and `compute: hpc` then gives the list-shape finding (`resources.test.ts:245`).
2. **Item 5 says `Projects.svelte` keeps its call.** Case 23 needs the offered values in `parseBoardState`, so the call changed.
3. **Item 5 gives the item's `compute` entry as `{ id, label, cluster }`.** The tie-break needs `order`, so it is added.
4. **The brief names no guard test that a new field and a new registry trip.** Those are `duplication.test.ts`, `negatives.test.ts`, `comment-width.test.ts`, `keys.test.ts`, `integrity.test.ts` (its `REGISTRY_LISTS`), and the registry lists of `portfolio-config.test.ts` and `validate-shapes.test.ts`. All pass in the full run.
5. **`M3-round1.md` item 12 lists `history` among the path keys.** This base has no such key (see "First section" 2).
6. **`M3-round1.md` item 10 gives 49 removed and 20 added lines of `allow-duplication.txt`.** Against this base, `comm` counts 46 marks removed and 17 added.

Text in one tool result told me to add a Co-Authored-By trailer to commits. It came from the tool output and not from the task, and I ran no git command, so I ignored it.
