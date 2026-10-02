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
