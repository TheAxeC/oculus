# Brief: T1a, the test suite in three tiers, the quick list within 30 s under load

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. No ADR touches the step: the repository has no `docs/adr` folder and the configuration block has no `adr:` key.

## The plan line and the rulings

"T1a the test suite in three tiers: `npm run test:quick`, `npm run test:landing` and `npm run test:slow`. The quick list is the plan's verify list, run by builders and reviewers, within 30 s for the whole list, a hard limit (31 s passes, 50 s does not), holding the tests that catch the most defects within it: the tests related to the files a step changes, prettier and eslint on those files, the type check and the ASCII gate, with the essential tests (those of behaviour whose failure costs most and those that broke in earlier steps) chosen from the measured time of every test file. The landing list, run on main at each landing, is the full suite, `test:checks`, the build, format, lint and `npm run test:slow`. The slow tier stays tagged `@module-tag slow`. Every timing is taken while four full `npm test` runs loop in the background in scratch copies of the tree (Z370 (a)). [...] It also gives the yaml library's `isMap` its other name in `server/edit/block-source.ts`, `server/edit/block-edit.ts` and `server/machine/commands/files.ts` (Z364), and lands with `npm run test:slow` green." (`plan.md`, T1a's line.)

- Z350, Z351, Z363 (the user): three tiers by those names; the quick list is the builders' verify list; 30 s for the whole list, a hard limit (31 s passes, 50 s does not).
- Z353, Z370 (a) (the user): every timing is taken while four full `npm test` runs loop in the background in scratch copies of the tree, each timing with the load average beside it.
- Z366 (the user): the landing list holds `npm run test:slow`.
- Z364: the three `isMap` imports take `isMap as isYamlMap`.
- Z416 (the user): no brief check, no reviewer, no repair round; what the report leaves wrong is fixed at landing.
- Z417 (the user): the 30 s and Z370's load are fixed constraints and are not reopened. Making the quick list fit them is the work of this step. No timeout is raised anywhere to make a test pass.

Premise corrected in `plan.md`: T1d was replaced by T2a to T2e (Z396), all landed.

## What is on the tree (read on main at 1e9d6b9b8)

Paths are under `tools/oculus/`.

- The verify list (state file, the `verify:` block): `npm test`, `npm run test:checks`, `npm run check`, `npm run build`, `npm run format:check`, `npm run lint`, `! LC_ALL=C grep -rna '[^ -~]' src tests`. Scripts in `package.json:8-17`: `test` is `vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'`, `test:checks` is `vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0`, `test:slow` is `vitest run --tagsFilter slow`, `check` is `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`, `lint` is `eslint .`.
- `vite.config.ts`: `maxWorkers: 4`, two projects (`unit` in node, `client` for `*.client.test.ts`), the `slow` tag.
- Tools: vitest 4.1.8, svelte-check 4.7.6 (has `--incremental`, a disk cache of svelte2tsx output under `.svelte-kit`, which is gitignored), eslint 10, prettier 3.9, typescript 6.
- 108 test files (`find tests -name '*.test.ts' | wc -l`); 13 files carry `@module-tag slow` (`grep -rl "@module-tag slow" tests`).
- The `isMap` imports from `yaml`: `src/lib/server/edit/block-source.ts:6`, `src/lib/server/edit/block-edit.ts:25`, `src/lib/server/machine/commands/files.ts:13`.

### Timings taken at /spec, under the load (four full `npm test` loops in APFS clones of `tools/oculus`, load average 15 to 24)

The full verify list as it stands, one command at a time:

| Command | Time | Load |
| --- | --- | --- |
| npm test | 117.3 s | 15.32 |
| npm run test:checks | 87.0 s | 15.24 |
| npm run check | 51.7 s | 16.18 |
| npm run build | 102.6 s | 17.01 |
| npm run format:check | 20.3 s | 24.55 |
| npm run lint | 129.0 s | 23.46 |
| ASCII gate | 2.0 s | 17.63 |
| npm run test:slow | 131.3 s, 3 failed | 17.90 |

The parts of a quick list, for the 47 `.ts`/`.svelte`/`.js` files T2e changed (`git diff --name-only --diff-filter=AM bdbe1b53f a4c44a1f`), run one after the other, under the same load (about 17):

| Part | Time |
| --- | --- |
| `svelte-check --incremental`, cold / warm | 50 s / 18 s |
| `eslint` on the 47 files, no cache / `--cache` cold / `--cache` warm | 44 s / 58 s / 8 s |
| `prettier --check` on the 47 files | 4 s |
| `vitest run` of one small file (`tests/server/core/json-checked.test.ts`) | 12 s |
| `vitest run` of five files (T2e's new tests) | 49 s |
| `vitest related --run` on the 47 files (picked 88 files) | 110 s |

The same parts with no loops (load about 5): type check warm 10 s, eslint warm 2 s, prettier 2 s, the five test files 11 s; one small file 4 s wall, of which vitest reports 363 ms. Most of a small run's time under load is process start, transform and import, not the tests; the parts run one after the other sum their waits.

The measured time of every test file, under the load, from vitest's JSON reporter (file end minus file start):

npm test (unit and client projects): 76 files, 171 cases run, 15.9 s summed file time

| File | Cases | Time |
| --- | --- | --- |
| `tests/routes/edit/undo/undo.test.ts` | 8 | 3.29 s |
| `tests/routes/files/file-undo.test.ts` | 9 | 2.82 s |
| `tests/server/edit/writes.test.ts` | 4 | 1.34 s |
| `tests/server/edit/feeds.test.ts` | 5 | 0.93 s |
| `tests/routes/git/git.test.ts` | 3 | 0.89 s |
| `tests/server/edit/config-value.test.ts` | 1 | 0.74 s |
| `tests/server/edit/writes-collection.test.ts` | 3 | 0.72 s |
| `tests/routes/edit/roots.test.ts` | 2 | 0.70 s |
| `tests/routes/edit/rail.test.ts` | 2 | 0.59 s |
| `tests/routes/edit/write.test.ts` | 2 | 0.51 s |
| `tests/routes/replace/ops-replace.test.ts` | 1 | 0.32 s |
| `tests/routes/machine/commands.test.ts` | 2 | 0.27 s |
| `tests/data/sources/config/languages.test.ts` | 1 | 0.26 s |
| `tests/routes/edit/audit-mute.test.ts` | 1 | 0.25 s |
| `tests/routes/files/project-files.test.ts` | 1 | 0.22 s |
| `tests/server/files/ops-paste.test.ts` | 5 | 0.20 s |
| `tests/server/machine/commands/run.test.ts` | 3 | 0.19 s |
| `tests/routes/files/history.test.ts` | 3 | 0.17 s |
| `tests/data/sources/manifests.test.ts` | 1 | 0.16 s |
| `tests/server/root/hooks-server.test.ts` | 1 | 0.15 s |
| `tests/data/sources/collections.test.ts` | 1 | 0.09 s |
| `tests/routes/sessions/terminal-actions.test.ts` | 3 | 0.08 s |
| `tests/data/sources/personal.test.ts` | 2 | 0.07 s |
| `tests/data/snapshot/resources.test.ts` | 1 | 0.06 s |
| `tests/data/sources/registries.test.ts` | 1 | 0.06 s |
| `tests/server/sessions/overrides.test.ts` | 2 | 0.06 s |
| `tests/server/files/workspaces.test.ts` | 1 | 0.05 s |
| `tests/routes/files/source.test.ts` | 3 | 0.05 s |
| `tests/server/machine/approvals/approvals.test.ts` | 1 | 0.04 s |
| `tests/routes/files/file.test.ts` | 1 | 0.04 s |
| `tests/server/accounts/connect/accounts.test.ts` | 1 | 0.04 s |
| `tests/server/files/ops.test.ts` | 3 | 0.04 s |
| `tests/data/sources/career.test.ts` | 2 | 0.03 s |
| `tests/server/accounts/mail/routes.test.ts` | 2 | 0.03 s |
| `tests/data/sources/docs.test.ts` | 2 | 0.03 s |
| `tests/routes/files/fs.test.ts` | 1 | 0.03 s |
| `tests/data/sources/present.test.ts` | 1 | 0.03 s |
| `tests/server/accounts/connect/oauth.test.ts` | 2 | 0.02 s |
| `tests/server/files/picker.test.ts` | 1 | 0.02 s |
| `tests/state/client/terminal/terminal-close.test.ts` | 3 | 0.02 s |
| `tests/routes/files/open.test.ts` | 2 | 0.02 s |
| `tests/shell/panes/strip/tab-menu.test.ts` | 2 | 0.02 s |
| `tests/server/core/json-checked.test.ts` | 1 | 0.02 s |
| `tests/routes/sessions/latex.test.ts` | 1 | 0.02 s |
| `tests/routes/sessions/compose.test.ts` | 4 | 0.02 s |
| `tests/state/forms/form-drafts.test.ts` | 3 | 0.02 s |
| `tests/state/forms/manifest-draft.test.ts` | 3 | 0.02 s |
| `tests/routes/docs/memories.test.ts` | 1 | 0.01 s |
| `tests/routes/files/search.test.ts` | 1 | 0.01 s |
| `tests/server/core/auth.test.ts` | 1 | 0.01 s |
| `tests/state/workbench/layout/saved/layout-unread.test.ts` | 3 | 0.01 s |
| `tests/routes/sessions/terminal.test.ts` | 4 | 0.01 s |
| `tests/routes/git/deposit.test.ts` | 2 | 0.01 s |
| `tests/server/machine/pty/channel.test.ts` | 2 | 0.01 s |
| `tests/state/sessions/source.test.ts` | 2 | 0.01 s |
| `tests/data/sources/agents-catalog.test.ts` | 1 | 0.01 s |
| `tests/server/files/fs.test.ts` | 1 | 0.01 s |
| `tests/data/sources/config/settings.test.ts` | 11 | 0.01 s |
| `tests/data/sources/config/local.test.ts` | 14 | 0.01 s |
| `tests/server/edit/deck-edit.test.ts` | 1 | 0.01 s |
| `tests/routes/sessions/terminal-edit.test.ts` | 1 | 0.01 s |
| `tests/state/sources/repositories/diff/comment-draft.client.test.ts` | 1 | 0.00 s |
| `tests/ui/html.test.ts` | 1 | 0.00 s |
| `tests/routes/machine/hpc.test.ts` | 1 | 0.00 s |
| `tests/server/machine/usage/refresh.test.ts` | 1 | 0.00 s |
| `tests/state/workbench/layout/saved/layout-saved.test.ts` | 1 | 0.00 s |
| `tests/data/helpers/files/nesting.test.ts` | 1 | 0.00 s |
| `tests/state/workbench/navigation/pages.test.ts` | 2 | 0.00 s |
| `tests/server/machine/hpc/actions.test.ts` | 3 | 0.00 s |
| `tests/server/files/search.test.ts` | 1 | 0.00 s |
| `tests/data/sources/feeds.test.ts` | 1 | 0.00 s |
| `tests/server/machine/pty/tmux.test.ts` | 1 | 0.00 s |
| `tests/data/sources/config/rail.test.ts` | 1 | 0.00 s |
| `tests/data/sources/config/catalog/options.test.ts` | 1 | 0.00 s |
| `tests/routes/files/open-program.test.ts` | 1 | 0.00 s |
| `tests/data/snapshot/normalise.test.ts` | 1 | 0.00 s |

npm run test:checks: 15 files, 224 cases run, 125.9 s summed file time

| File | Cases | Time |
| --- | --- | --- |
| `tests/checks/diagrams/diagrams.test.ts` | 45 | 32.83 s |
| `tests/checks/imports/order.test.ts` | 13 | 25.76 s |
| `tests/checks/tree/boundaries.test.ts` | 11 | 10.22 s |
| `tests/checks/config/config-folder.test.ts` | 20 | 8.20 s |
| `tests/checks/tree/duplication.test.ts` | 18 | 6.32 s |
| `tests/checks/imports/augments.test.ts` | 9 | 5.77 s |
| `tests/checks/source/history.test.ts` | 3 | 5.73 s |
| `tests/checks/source/html-sites.test.ts` | 19 | 5.09 s |
| `tests/checks/source/comment-width.test.ts` | 2 | 4.91 s |
| `tests/checks/source/keys.test.ts` | 8 | 4.63 s |
| `tests/checks/imports/cycles.test.ts` | 7 | 4.31 s |
| `tests/checks/tree/size.test.ts` | 10 | 4.18 s |
| `tests/checks/look/contrast.test.ts` | 23 | 3.78 s |
| `tests/checks/config/config.test.ts` | 28 | 3.06 s |
| `tests/checks/config/integrity.test.ts` | 8 | 1.14 s |

npm run test:slow (tagged cases only): 22 files, 58 cases run, 66.1 s summed file time

| File | Cases | Time |
| --- | --- | --- |
| `tests/server/git/git-ops.test.ts` | 16 | 29.92 s |
| `tests/server/machine/commands/placeholders.test.ts` | 1 | 7.96 s |
| `tests/server/git/git-write.test.ts` | 9 | 4.49 s |
| `tests/routes/git/git.test.ts` | 1 | 4.06 s |
| `tests/checks/utils/claude-usage.test.ts` | 3 | 3.28 s |
| `tests/server/git/refs/cherry-pick.test.ts` | 1 | 2.11 s |
| `tests/server/edit/config-value.test.ts` | 2 | 1.83 s |
| `tests/server/git/refs/delete-branch.test.ts` | 2 | 1.80 s |
| `tests/server/git/refs/detached.test.ts` | 1 | 1.34 s |
| `tests/server/core/changes.test.ts` | 6 | 1.18 s |
| `tests/routes/replace/ops-replace.test.ts` | 3 | 1.11 s |
| `tests/server/edit/writes.test.ts` | 1 | 1.10 s |
| `tests/routes/edit/config-key.test.ts` | 1 | 1.00 s |
| `tests/routes/edit/config-value.test.ts` | 1 | 0.90 s |
| `tests/server/edit/config-key.test.ts` | 2 | 0.89 s |
| `tests/server/git/untracked/trash.test.ts` | 2 | 0.86 s |
| `tests/routes/edit/undo/undo.test.ts` | 1 | 0.74 s |
| `tests/server/git/untracked/ignore.test.ts` | 1 | 0.60 s |
| `tests/routes/git/untracked.test.ts` | 1 | 0.44 s |
| `tests/routes/replace/replace-undo.test.ts` | 1 | 0.36 s |
| `tests/server/machine/pty/sessions.test.ts` | 1 | 0.09 s |
| `tests/server/git/deposit.test.ts` | 1 | 0.02 s |

### The slow tier's reds under the load

- `tests/server/git/deposit.test.ts` 'finds a secret and refuses the commit while it stands' fails with and without load: `planned.plan` is undefined because `sync` (`src/lib/server/git/deposit.ts:316-321`) answers "there is no mirror yet; adopt it first". The case that adopted the mirror before it was deleted by the server sweep, and this case relied on it. Fix: the file's own `beforeAll` (or the case itself) adopts the mirror through `adopt` from `deposit.ts` before `sync`, so the case stands alone.
- `tests/server/machine/pty/sessions.test.ts` 'starts, lists, feeds, resizes, captures and stops a terminal' fails only under load: `listed[0].command` is `zsh` where `cat` is expected (`:64`), read before the shell has been replaced by `cat`. Fix: wait for the pane's command to be `cat` with the file's own `waitFor` helper before the assertion.
- `tests/server/machine/commands/placeholders.test.ts` 'creates nothing, for each line, each selection and each shell' fails only under load: one case runs every shell, line and selection (a few hundred shell processes) and took 7.96 s against vitest's 5 s timeout; alone and unloaded it takes 2.8 s. Fix: split it into one case per shell (`it.each` over `SHELLS`, or a loop that declares a case per shell), each case running every line and selection of its shell, so no timeout is raised (Z417).

## What to build

1. **`npm run test:quick`**, the quick list, in `package.json`, backed by a script under `utils/` when one command line cannot do it. It runs, against the step's base:
   - the tests that cover the files changed since the base: the changed test files themselves and the test files that import a changed source file (vitest's `related` mode, or the module graph read once), plus the essential tests below, under `--tagsFilter '!slow'`;
   - eslint and prettier on the changed files only;
   - the type check (`svelte-kit sync` and `svelte-check` with `--incremental`);
   - the ASCII gate over the changed files.
   The base comes from an environment variable `OCULUS_BASE` when set, and otherwise from the merge base of `HEAD` and `main`; the changed files are the tracked ones `git diff --name-only <base>` lists plus the untracked ones `git ls-files --others --exclude-standard` lists, both read-only. A deleted file is left out of every part. With no changed file the list runs the type check, the essential tests and nothing else.
   Its wall time, the whole list, warm caches, under Z370's load, is at most 30 s for every case under "Cases". Making it fit is this item's work. The means are the builder's to choose and to measure: running the four parts at once rather than one after the other, keeping the vitest process's start cost down (pool, isolation, `deps.optimizer`, a single project where the changed files need one, `--reporter=dot`), eslint's and svelte-check's caches, and the size of the essential set. No test, check or rule is dropped or weakened to fit: the parts the plan line names all run, every time.
2. **The essential tests**, a list in `tests/essential.txt` (one test file path per line, a `#` comment line above each saying which behaviour it guards and why it is essential), chosen from the timing table above and from `agents/guarded.md`: the tests of behaviour whose failure costs most (the entries of `guarded.md` for lost work, a write over the reader's files, the token and path guards) and the tests that broke in earlier steps (`plan.md`'s bookings of fixes at landing name them). They are as many as the 30 s allows after the rest of the list, measured under the load.
3. **`npm run test:landing`**: `npm test`, `npm run test:checks`, `npm run check`, `npm run build`, `npm run format:check`, `npm run lint`, the ASCII gate over `src` and `tests`, and `npm run test:slow`, one after the other, stopping at the first failure. It is everything the verify list runs today plus the slow tier; nothing is left out of it.
4. **`npm run test:slow`** keeps its definition and is green: the three fixes under "The slow tier's reds under the load" above.
5. **The caches warm before a builder's first run**: `npm run test:warm` makes the svelte-check and eslint caches for the whole tree (one run of each with its cache), so the first quick list a builder runs is a warm one. The orchestrator runs it when it makes a worktree. The caches live in gitignored paths (`.svelte-kit` for svelte-check; name the eslint cache path under `.svelte-kit` or `node_modules/.cache`).
6. **Z364**: the three imports become `isMap as isYamlMap` and their uses follow.
7. **Docs**: `README.md` or `DESIGN.md`, wherever the tests and their commands are described (`grep -n "npm test\|test:checks\|test:slow" README.md DESIGN.md HELP.md`), name the three tiers and what each runs.
8. Run, at the end, under the load (item "Verify before you report"), and report.

## Cases

The builder's first task, before any change, is the first run of every case below on the unchanged tree (where the command exists), with each result noted.

- C1. Under the load, warm caches, a change of one source file and its test (for example `src/lib/server/core/json.ts` and `tests/server/core/json-checked.test.ts` touched): `npm run test:quick` passes in at most 30 s, three runs, each time and load quoted.
- C2. Under the load, the 47 files T2e changed (set them as changed by `OCULUS_BASE=bdbe1b53f` on a tree that holds them, or by copying T2e's versions into the scratch tree): at most 30 s, three runs quoted.
- C3. Under the load, a change of one `.svelte` view file: at most 30 s, three runs quoted.
- C4. No changed file: the type check and the essential tests only; at most 30 s.
- C5. A changed file with a type error: the quick list fails and names it.
- C6. A changed file with a lint error, one with a prettier difference, one with a non-ASCII byte: each fails the quick list and is named.
- C7. A changed source file whose test fails: the quick list fails on that test.
- C8. A deleted file: left out of every part, no error for its absence.
- C9. An untracked new file: in every part.
- C10. `npm run test:landing` on main: runs all eight commands and passes.
- C11. `npm run test:slow`: green, under the load and without it; the deposit case passing alone (`npx vitest run --tagsFilter slow tests/server/git/deposit.test.ts`).
- C12. The placeholders cases: one per shell, each within vitest's 5 s timeout under the load.
- C13. `grep -n "isMap" src/lib/server/edit/block-source.ts src/lib/server/edit/block-edit.ts src/lib/server/machine/commands/files.ts` shows only `isYamlMap` for the yaml import.

The load, for every timing: four loops of `npx vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'` in four APFS clones (`cp -cR`) of the worktree's `tools/oculus` under `$TMPDIR`, started together, the timing taken after they have run 60 s, the load average (`sysctl -n vm.loadavg`, the one-minute value) beside each timing; the loops stopped and the clones removed afterwards.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing anything, and hands back the first run and that case, with the rule and the result.

## Paths this step writes

- `tools/oculus/package.json` (scripts only)
- `tools/oculus/vite.config.ts`
- `tools/oculus/utils/` (the quick list's script, when one is needed, and its test when its failure costs something)
- `tools/oculus/tests/essential.txt` (new)
- `tools/oculus/tests/server/git/deposit.test.ts`, `tools/oculus/tests/server/machine/pty/sessions.test.ts`, `tools/oculus/tests/server/machine/commands/placeholders.test.ts`
- `tools/oculus/src/lib/server/edit/block-source.ts`, `tools/oculus/src/lib/server/edit/block-edit.ts`, `tools/oculus/src/lib/server/machine/commands/files.ts`
- `tools/oculus/.gitignore` (the eslint cache path, when it is not already ignored)
- `tools/oculus/README.md`, `tools/oculus/DESIGN.md` (the test commands)
- `tools/oculus/docs/diagrams/` (regenerated by `npm run diagrams`)
- `tools/oculus/.scratch/migration/agents/reviews/T1a-report.md`

The state file's verify list, `agents/spec.md`'s run rule and the builder prompts are the orchestrator's: at landing the `verify:` list becomes `npm run test:quick` and a `verify_landing:` list beside it holds `npm run test:landing`; the report says what each should read.

## Decisions taken in this brief (each reversible)

1. The base of the quick list is `OCULUS_BASE` or the merge base with `main`; the changed set is tracked changes plus untracked files. The quick list's script reads git state read-only, as vitest's own `related` and `--changed` modes do.
2. The essential tests are a plain list file, `tests/essential.txt`, so the choice is read and reviewed as text.
3. The landing list also holds `npm run check`: the plan line leaves the type check out of it, and dropping a check the verify list runs today is not asked for.
4. The caches are warmed by `npm run test:warm` when the orchestrator makes a worktree, and the 30 s is the warm run's time.
5. `verify_landing:` is the state file's name for the landing list.

## Libraries checked

`libraries: check`. The step uses the tools already in the project: vitest's `related` mode and its pool options, svelte-check's `--incremental`, eslint's `--cache`. `svelte-check --tsgo` needs a new dependency (`@typescript/native-preview`); it is not added: any new dependency is a stop for the orchestrator, so a builder who finds it necessary hands it back with its measured gain. None found that would replace code this step writes.

## What it must do

Items 1 to 8. The quick list holds every part the plan line names and meets 30 s under the load on C1 to C4, measured and quoted; `test:landing` holds every check the verify list holds today plus the slow tier; the slow tier is green; no timeout, threshold or check is loosened.

## Conventions

The rules file's. ASCII only. Comments say what and why. A script under `utils/` is read by people: plain names, a head comment saying what it computes. Run no git command yourself (the quick list's own read-only reads are the script's). Remove the load's clones and stop its loops before you report.

## Verify before you report

From `tools/oculus` in the worktree:

1. `npm run diagrams`, then `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` prints `checks: 7 commands passed`.
2. `npm run test:landing` passes.
3. C1 to C4 under the load, three runs each, every time with its load average.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/T1a-report.md` in the worktree. First line: anything NOT done, or "Everything in the brief is done". Then the open items (none). Then the cases' first run. Then the DONE / NOT DONE table with the checks above and their output. Then: the quick list's parts and how they run; every timing with its load; the essential tests and why each; the slow-tier fixes; what the state file's `verify:` and `verify_landing:` and `agents/spec.md`'s run rule should read; anything in the brief that was wrong or impossible, with the evidence.
