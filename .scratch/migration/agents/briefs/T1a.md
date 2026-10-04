# Brief: T1a, fast tests

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step except every rule there that tells you to run a command: `spec.md:25` (running test files, `npm run diagrams`, `checks.sh`), the running of `npm run format` and `npm run format:check` in `spec.md:47`, and the whole section "Verify before you report" (`spec.md:70` onward) do not apply to this step. You run none of those commands.

## The plan line (`plan.md:247`)

"T1a fast tests, after T1b, T1c and T1e and the sweeps T2a to T2e (which replaced T1d, Z396) have landed: "I simply want to run tests fast" (the user). Running the plan's whole verify list (`npm test`, `npm run test:checks`, `npm run check`, `npm run build`, `npm run format:check`, `npm run lint` and the ASCII gate) takes at most 30 s, measured while four full `npm test` runs loop in the background in scratch copies of the tree (Z370 (a), Z417). No test is deleted, the test suite stays actually useful, and no timeout is raised (Z417). The builder runs no command of the verify list and no test, in any form, at any time, for any reason: not `vitest` (directly, through `npx`, through `node_modules/.bin/vitest`, or through any script or wrapper), not `npm test` or any `npm run` script whose name starts with `test`, not `npm run check`, `npm run lint`, `npm run format:check` or `npm run build`, not `svelte-check`, `eslint`, `prettier` or `tsc`, not the ASCII grep, not `checks.sh`. It times no command and measures nothing. Where checking a change would need one of these, the report says "not run" for that change. The verify list under the load, the 30 s and `npm run test:slow` are run only by the orchestrator (Z419). It also gives the yaml library's `isMap` its other name in `server/edit/block-source.ts`, `server/edit/block-edit.ts` and `server/machine/commands/files.ts` (Z364), and `npm run test:slow` is green when the orchestrator runs it, apart from X3e's colour finding (Z359)."

## The ban on running commands

You run no command of the verify list and no test, in any form, at any time, for any reason. Not `vitest` (directly, through `npx`, through `node_modules/.bin/vitest`, or through any script or wrapper). Not `npm test`, and not any `npm run` script whose name starts with `test`. Not `npm run check`, `npm run lint`, `npm run format:check` or `npm run build`. Not `svelte-check`, `eslint`, `prettier`, `vite` or `tsc`. Not the ASCII grep. Not `checks.sh`. You time no command and measure nothing. You start no background process. Where checking a change would need one of these, your report says "not run" for that change. If you are unsure whether a command falls under this ban, do not run it.

You may read files, search them (`grep`, `find`, `ls`, `cat`, `sed -n`), and edit files. You run no git command.

## What is on the tree (main at the preparation commit)

Paths are under `tools/oculus/`.

- The verify list (state file, `verify:`): `npm test`, `npm run test:checks`, `npm run check`, `npm run build`, `npm run format:check`, `npm run lint`, `! LC_ALL=C grep -rna '[^ -~]' src tests`.
- `package.json` scripts: `test` is `vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'`; `test:checks` is `vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0`; `test:slow` is `vitest run --tagsFilter slow`; `check` is `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`; `lint` is `eslint .`; `format:check` is `prettier --check .`.
- `vite.config.ts`: `maxWorkers: 4`, two projects (`unit` in node, `client` for `*.client.test.ts`), the `slow` tag.
- Tools: vitest 4.1, svelte-check 4.7 (has `--incremental`), eslint 10 (has `--cache`), prettier 3.9 (has `--cache`), typescript 6.
- 108 test files; 13 carry `@module-tag slow`.
- The `isMap` imports from `yaml`: `src/lib/server/edit/block-source.ts:6`, `src/lib/server/edit/block-edit.ts:25`, `src/lib/server/machine/commands/files.ts:13`.

Times measured by the orchestrator at the earlier /spec of T1a, under the load (four full `npm test` loops, load average 15 to 24), one command at a time:

| Command | Time |
| --- | --- |
| npm test | 117 s |
| npm run test:checks | 87 s |
| npm run check | 52 s |
| npm run format:check | 20 s |
| npm run lint | 129 s |
| npm run build | 103 s |
| ASCII gate | 2 s |

Also measured: `svelte-check --incremental` 50 s cold, 18 s warm; `eslint --cache` 58 s cold, 8 s warm.

## What to build

1. **The whole verify list takes at most 30 s together under the load.** It is all seven commands: `npm test`, `npm run test:checks`, `npm run check`, `npm run build`, `npm run format:check`, `npm run lint` and the ASCII grep. None is left out of the 30 s. Change how they run (the scripts in `package.json`, `vite.config.ts`, the tools' own options and caches) so that together they take at most 30 s. Every test that runs today still runs, every time; every file each check reads today it still reads. No test or assertion is deleted, skipped or weakened, no timeout is raised, no check is loosened, and no new dependency is added. Where a change trades safety for speed (for example tests sharing loaded modules), say in the report what the risk is and why the suite stays actually useful. The verify list lives in the state file, which you do not edit, and `checks.sh` runs its commands one after the other. When your change needs the verify list to read differently (for example one `package.json` script that runs the parts at the same time), your report gives the exact new `verify:` list, and the orchestrator writes it.
2. **`npm run test:slow` green**, by these three fixes, each keeping the case's behaviour the same:
   - `tests/server/git/deposit.test.ts`, 'finds a secret and refuses the commit while it stands': `planned.plan` is undefined because `sync` (`src/lib/server/git/deposit.ts:316-321`) answers "there is no mirror yet; adopt it first"; the case that adopted the mirror was deleted by an earlier sweep. Fix: the file's own `beforeAll`, or the case, adopts the mirror through `adopt` from `deposit.ts` before `sync`.
   - `tests/server/machine/pty/sessions.test.ts`, 'starts, lists, feeds, resizes, captures and stops a terminal': under load `listed[0].command` (`:64`) is read as `zsh` before the shell is replaced by `cat`. Fix: wait for the pane's command to be `cat` with the file's own `waitFor` helper before the assertion.
   - `tests/server/machine/commands/placeholders.test.ts`, 'creates nothing, for each line, each selection and each shell': one case runs every shell, line and selection and took 7.96 s under load against vitest's 5 s timeout. Fix: one case per shell (`it.each` over `SHELLS`, or a loop that declares a case per shell), each running every line and selection of its shell. No timeout is raised.
3. **Z364**: the three `isMap` imports become `isMap as isYamlMap`, and their uses follow.

Nothing else. No new script that picks which tests run. No list of tests. No docs.

## Paths this step writes

- `tools/oculus/package.json`
- `tools/oculus/vite.config.ts`
- `tools/oculus/eslint.config.js`, `tools/oculus/svelte.config.js`, `tools/oculus/tsconfig.json`, `tools/oculus/.prettierignore`, `tools/oculus/.gitignore`: only where item 1 needs it
- `tools/oculus/tests/server/git/deposit.test.ts`, `tools/oculus/tests/server/machine/pty/sessions.test.ts`, `tools/oculus/tests/server/machine/commands/placeholders.test.ts`
- `tools/oculus/src/lib/server/edit/block-source.ts`, `tools/oculus/src/lib/server/edit/block-edit.ts`, `tools/oculus/src/lib/server/machine/commands/files.ts`
- `tools/oculus/.scratch/migration/agents/reviews/T1a-report.md` (your report, the only ledger file you write)

## Conventions

ASCII only. Comments say what the code does and why, never history. No git command.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/T1a-report.md` in the worktree. First line: anything NOT done, or "Everything in the brief is done". Then, per item of "What to build": each change with its file and line, and why it makes the run faster or fixes the case. Then the risks item 1 asks for. Then every check you would have run, each marked "not run".
