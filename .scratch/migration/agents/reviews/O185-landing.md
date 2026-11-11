# O185 landing

Position: the oculus migration, step O185 (the whole suite runs green) landed; every step of `plan.md` is ticked and the queue is empty. Next: the whole suite once with nothing else running, then the v1.1.0 preparation and `npm run app:release`; the tag and upload wait for Axel's word on the push.

Open items: none.

## Check of Steps 1

The runner's agent listing (ListAgents) showed no subagent running: the builder ad4d4274f77374e16 and the reviewer a16114f25d691c13c had both completed.

## Not done

Everything in the brief is done. The whole suite has not been run on this step; it runs once before the release, as the ruling "Release v1.1.0 queue empty" says.

## What landed

The whole range `746518eba..migration-O185` (one wip commit ef366991a) with the fix at landing below, 12 paths, 222 insertions and 81 deletions.

- `labTarget` (`tests/routes/edit/write-fixture.ts`) makes its primary hub and its lab as the folders `hub` and `lab` of one scratch folder of their own, through `target(parent)`, `configTarget(engine, settings, parent)` and `folderIn`, so a stray `x` in the temporary folder no longer turns the 11 rows of 'a write that names a hub' red.
- `loadConfig` (`src/lib/data/sources/config/merge/merge.ts`) takes and returns `parses`: for each file of oculus's config folder, its text and raw parse. Every file is read from disk on every call and parsed again only when its text changed; the merge gets a clone; the shape check and every finding are made on every call. `readConfigFile` (`text.ts`) and `readOptionsFolder` (`options-folder.ts`) take the file's source from `configSource`.
- `contextConfig` (`src/lib/server/root/process/context/config-parse.ts`) holds the last load's `parses` in its closure and hands them to the next load of any hub, so the server's parse after a write reparses only the changed files.
- `tests/fixtures/hubs/engine-load.ts` loads the engine's config and the demo hub's once per test file, deep-frozen, and hands out copies; `write-fixture.ts`, `deposit-world.ts` and `zenodo-world.ts` use it.
- `config-cache.ts:2-4` says a parse costs 200 to 290 ms and reparses only the files whose text changed.
- Paths outside the brief's list: `engine-load.ts` sits in `tests/fixtures/hubs/`, since `tests/fixtures` holds the ten items a folder may hold; `portfolio.ts` and four fake loaders in `config-cache.test.ts` changed for the result type's `parses`, with no assertion changed; `tests/routes/git/zenodo.test.ts` at landing.

## Fixes at landing

- `tests/routes/git/zenodo.test.ts:428`: the shipped `deposit` comes from `engineConfigCopy()` in place of a full `loadConfig(engineDir())` (review Spec 2). The row 'keeps the shipped auth and time limit under a hub that lays only the address' took 83 and 110 ms alone in two runs in the gate, against 297 to 357 ms before.

## Found

- Review Spec 1, the brief's check 4 red in the two-file command: not reproduced. Three runs of `npx vitest run tests/server/edit/app-store.test.ts tests/routes/git/zenodo.test.ts --reporter=verbose` with no other test running gave the 5 rows 43 to 138 ms; the app-store rows alone took 42 to 79 ms beside four `yes` processes and beside a loop of fsynced 1 MB writes. The builder's and the reviewer's runs over 300 ms were made while the machine carried other work.
- Review Proof 1, the rows at 100 ms or more alone vary from run to run: closed under the brief's Decision 5. Each zenodo row makes one load under its own hub's settings, 33 to 93 ms with the engine's `parses`, the floor the brief sets; none is near the 5000 ms limit, and no row is tagged and no limit changed.
- Nothing outside the brief.

## Verification

In the gate at main's head 023f44911 with the range and the fix: `npm run diagrams && npm run docs:palette && npm run test:quick`, "test:quick: 251.7 s; every command passed", 12 changed files, 218 test files, svelte-check 592 files 0 errors. The diagrams and the palette changed no file. Main's index and the gate give the same tree under `git write-tree`, `e59043d1fa5aa3d8ca42376b80a0f76822a0b9da`, and the same staged diff under `cmp`. No benchmark is on this plan's list, so there is no A/B.

## Look

None owed: the step changes no view and nothing a reader sees. The config payload carries `config`, `findings` and `from` as before (`payload.ts:76`, `config-seed.ts:63`); only the time of the server's parse after a write changes.

## Agents and fixes

Builder ad4d4274f77374e16: 332497 tokens, 151 tool uses, 4929 s. Brief check aa439017cc1038d36: 228691 tokens, 66 tool uses, 696 s. Reviewer a16114f25d691c13c: 223948 tokens, 64 tool uses, 954 s. All on claude-opus-5-5. The first report did not pass its bar (check 4 marked not done in full; the review and the orchestrator's runs found it a load effect); no repair round; one fix at landing.
