Q85c report (worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85c, app tools/oculus)

NOT DONE / DEVIATIONS (first, as the brief asks)
- Everything in the brief is done, with one literal-gate difference. The brief's gate says `grep -c "safeParse\|readAs("` is at least 1 for every converted file. Four converted files print 0 on that literal grep: `sources/feeds.ts`, `sources/manifests.ts`, `sources/career.ts`, `sources/config/options.ts`. They read through `readOr(...)`, `readYamlMap(...)` and `optionalText(...)` from `shapes.ts` / `yaml-file.ts`, which call `safeParse` inside (counts of those calls: feeds 5, manifests 2, career 1, options 1). I did not add a `readAs(` call to satisfy the grep. The orchestrator decides whether the literal gate or the intent counts.
- Two tests of the second broad run (`tests/server tests/checks/config tests/data/sources/config/rail.test.ts`) failed under machine load: `tests/server/core/git.test.ts` "cuts every list it publishes at the cap" (timeout 5000 ms) and `tests/server/machine/pty/sessions.test.ts` (expected 'zsh' to be 'cat'). Rerun alone: `npx vitest run tests/server/core/git.test.ts tests/server/machine/pty/sessions.test.ts` printed `Test Files 2 passed (2) | Tests 63 passed (63)`. Neither touches a file of this step.
- Git slip: I ran one read-only `git diff --stat` early on (it printed nothing useful). No other git command was run. No agent was started. Nothing under `.scratch/` was edited. `config/local.yml` was never opened, grepped or copied. No server was started or killed. No browser.

OPEN ITEMS of the state file (worktree copy of `.scratch/migration/orchestrator-state.md`, lines 112-122, `sed -n 112,122p`)
- Z164, how U3 continues (raised 2026-10-01 16:55). U3's builder (ae3ab3b225611181e) started six general-purpose agents at 16:19 for six groups of views, against the one-builder rule; all seven stopped at 16:37 with no report. The worktree holds 259 changed paths, the groups left mid-edit. A dead builder's worktree is taken over only when Axel says so. `agents/spec.md:34` now forbids a builder to start an agent. (a) Resume the same builder by message, recommended. (b) A fresh builder takes over the worktree as it stands. (c) Discard the worktree and prepare U3 again from main. The full text of options (a) to (c) is in the file. The worktree's copy may be older than main's state file; main's commits show later rulings ("Book Axel's ruling that the repair round stays"), so this quote is "not verified" against main.

FIRST RUN OF THE CASES ON THE UNCHANGED TREE (before any source change)
- 32 test files passed and 1 failed; 664 tests passed and 2 failed. The two failures are the two changed cases in `tests/data/sources/config/merge.test.ts` (flattenText gives `['__proto__.a','b']` instead of `['b']`; the loadConfig prototype is replaced). Reference run of the app before: 81 files passed, 13 skipped; 1461 tests passed, 400 skipped.

DONE / NOT DONE (command, output)
| Row | Command | Output |
|---|---|---|
| Case 14, snapshot identical | `node $S/snapshot.mjs "$PWD" $S/snapshot-after.json; cmp $S/snapshot-before.json $S/snapshot-after.json` | `cmp` printed nothing, `cmp: identical` |
| Data tests | `npx vitest run tests/data` | `Test Files 34 passed (34)`, `Tests 669 passed (669)` |
| Full verify list, run 1 of 1 | `npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` | last lines: `$ npm run format:check` ... `All matched files use Prettier code style!`, `$ npm run lint`, `$ ! LC_ALL=C grep -rna '[^ -~]' src tests`, `checks: 7 commands passed` (I kept only the last 40 lines, so the earlier commands' output is not quoted) |
| Format | `npm run format:check` | `All matched files use Prettier code style!` |
| ASCII gate (perl line of the brief over src tests config) | | no hit (`bin` does not exist, find said so) |
| Sizes | `wc -l` | normalise.ts 767, validate.ts 849 |
| Folder items | `ls | wc -l` | src/lib/data/snapshot 6, tests/data/sources 9, tests/data 9, tests/data/snapshot 4, tests/fixtures 10 |
| Docs | `sed -n 148p DESIGN.md | grep -c 'src/lib/data'` | `1` |
| Temporary profiling files | `ls tests/data/zz` | `No such file or directory` |
| Item 3 greps | `.issues|prettifyError|treeifyError` | no output; `^(export )?const [a-zA-Z]+ = z` not ending in `Shape` | no output; item 6 grep | only `helpers/guards.ts:18`; cast grep | `snapshot/compact.ts:6` and `config/merge.ts:63` (the brief's `normalise.ts:107` and `merge.ts:53` at their new places); `record.port as number` | no output |
| Diagrams | `cmp` against the base copy | `writes.dot` identical; only `layer-data.dot` and `layer-data.svg` differ (new import counts) |
| Broad runs, counted | | `npm test` 1 (410 files passed, 22 skipped; 10776 tests passed), `npm run test:checks` 2, the server/checks-config/rail group 2, full list 1 |

TIMING (brief's bound: a mean over 1.5x the unchanged tree is a finding). `tests/data/snapshot/build-timing.test.ts`, unchanged, ms per 200 runs, 5 alternating rounds on a machine shared with other agents:
| Round | Tree | buildPortfolio | readManifests | validate |
|---|---|---|---|---|
| 1 | base | 2313.0 | 592.8 | 11.8 |
| 1 | worktree | 2766.2 | 729.8 | 13.7 |
| 2 | base | 2857.1 | 778.2 | 10.3 |
| 2 | worktree | 1837.0 | 385.5 | 10.4 |
| 3 | base | 1710.9 | 453.9 | 10.1 |
| 3 | worktree | 1849.9 | 428.6 | 11.9 |
| 4 | base | 1674.8 | 433.4 | 9.5 |
| 4 | worktree | 2037.9 | 505.9 | 11.8 |
| 5 | base | 1960.8 | 445.6 | 16.9 |
| 5 | worktree | 2261.4 | 545.0 | 11.3 |
Means base vs worktree: buildPortfolio 2103.3 vs 2150.5 (1.02x), readManifests 540.8 vs 519.0 (0.96x), validate 11.72 vs 11.82 (1.01x). All under 1.5x, so no reader keeps a hand narrowing for time. The base noise is large (validate 9.5 to 16.9), so a difference under about 20 percent is not resolved by these rounds.

PER-FILE TABLE (check lines = `grep -rcE "typeof |Array\.isArray|isRecord\(|isMap\(" --include='*.ts' src/lib/data | awk -F: '$2>0'`; before from the brief: 30 files, 196 lines; after: 14 files, 41 lines)
| File | Before | After | safeParse/readAs( lines | Stays and why |
|---|---|---|---|---|
| snapshot/validate.ts | 37 | 12 | 12 | `shapeOf` (154-156, names a value's kind for a finding), vocabulary comparisons (261, 288, 514, 608, 634, 693, 710, 747), `typeof SHAPES` type (308) |
| snapshot/normalise.ts | 35 | 2 | 6 | `isMap` at 163 and 175 (`codeAvailability`/`reproduced` bare map test) |
| sources/config/settings.ts | 14 | 0 | 4 | |
| index.ts | 13 | 0 | 1 | |
| sources/config/local.ts | 12 | 0 | 6 | |
| sources/present.ts | 11 | 0 | 3 | |
| helpers/guards.ts | 9 | 9 | 0 | the helpers themselves |
| sources/config/rail.ts | 6 | 0 | 8 | |
| sources/config/options.ts | 5 | 4 | 0 (readOr 1) | `isMap` walks of the catalog tree (60, 75, 83), `typeof CONTROLS` type (24) |
| sources/config/catalogs.ts | 5 | 0 | 3 | |
| sources/config/agents.ts | 5 | 1 | 2 | `typeof node.value === 'string'` on a yaml Scalar node (133), not a parsed value |
| sources/registries.ts | 4 | 0 | 2 | |
| sources/feeds.ts | 4 | 0 | 0 (readOr 5) | |
| sources/config/themes.ts | 4 | 0 | 2 | |
| sources/config/merge.ts | 4 | 1 | 2 | `isMap` at 224 inside the walk that throws `TextNotAMap` |
| sources/collections.ts | 3 | 0 | 2 | |
| helpers/worktrees.ts | 3 | 3 | 0 | git output parsing, not an outside value |
| helpers/deck.ts | 3 | 0 | 2 | |
| sources/manifests.ts | 2 | 0 | 0 (readYamlMap 1, optionalText 1) | |
| snapshot/validate-themes.ts | 2 | 0 | 2 | |
| shapes/shapes.ts | 2 | 2 | 8 | the helpers' own tests (`anyNumberShape`, `mapShape` support) |
| helpers/search.ts | 3 | 1 | 1 | |
| helpers/files/opens-in-program.ts | 2 | 1 | 1 | `isMap` before the walk |
| accounts/connect.ts | 2 | 2 | 0 | not a reader of an outside value |
| sources/docs.ts | 1 | 0 | 1 | |
| sources/career.ts | 1 | 0 | 0 (readYamlMap 1) | |
| model/model-sessions.ts | 1 | 1 | 0 | type declaration |
| helpers/editor.ts | 1 | 0 | 1 | |
| helpers/code-themes.ts | 1 | 1 | 0 | |
| accounts/calendar.ts | 1 | 1 | 0 | |
New files: `sources/yaml-file.ts` (1), `snapshot/compact.ts`, `snapshot/normalise-career.ts` (7). Schemas added are the module-level `...Shape` consts in each file above (every one named `Shape`, held with `satisfies z.ZodType<...>` where it answers a model type); the shared ones are in `shapes/shapes.ts`.

FILES CHANGED OUTSIDE src/lib/data/*: `DESIGN.md` line 148, `docs/diagrams/layer-data.{dot,svg}`, `tests/checks/tree/allow-duplication.txt` (the five `readFile` clone lines removed, nothing added), tests: `tests/data/sources/config/merge.test.ts` (uses `plantScratch`, typed entries), `options.test.ts`, `opens-in-program.test.ts`, `portfolio-config.test.ts`, plus the new cases.

JUDGMENT CALLS
1. `sources/yaml-file.ts` exports `errorLine` and `readYamlMap(file, catalog, findings, unreadable)`. The callback words the unreadable-file finding (registries: `file_missing`, collections: `file_missing`, manifests: `does_not_parse`) or answers null (career, feeds); `does_not_parse` and `not_a_map` come from the one function.
2. New helpers in `shapes.ts`: `readOr`, `filledText`, `optionalText`, `keysOfShape`, `valuesOfShape`, `optionalItemsShape`, `textOrNumberOnlyShape`. `mapShape` is `unchangedAs<Record<string, unknown>>(z.object({}))` (`z.object`, not `looseObject`, to avoid copying each map).
3. `data/helpers/*` use zod directly because `shapes` sits above `helpers` in the import order.
4. `normalise.ts` was split: `snapshot/compact.ts` and `snapshot/normalise-career.ts`; `normalise.ts` keeps `export { career };`. `namedSchemaShape` is exported from `normalise.ts` and shared with `validate.ts`.
5. Write diagram: `importedName.method(` chains on in-tree names draw unplaced nodes, so chains live in `shapes.ts` helpers; `writes.dot` equals the base. `sources/config/agents.ts:266` uses `mapShape.transform` on an imported name; the diagram is unchanged with it.
6. `validate.ts` per-manifest checks skip the read when a field is undefined and read id lists once (`survivorsShape(idShape)`); `validate-themes.ts` tests membership first and parses only a word not on the list.
7. Case 4b: the feed `meta` is read with `readOr(mapShape, data.meta, {})`.
8. `manifests.ts` reads `type` with `optionalText(data.type)` (was a `typeof` test).
9. The registry and collection `meta[key]=value` behaviour for `__proto__` is unchanged (not part of item 9).
10. The brief says to write the report to a `.scratch` path; the task prompt says deliver through SubagentHandback, so this message is the report and no `.scratch` file was written.

CHANGED ANSWERS (item 9 only; before to after)
- `flattenText(JSON.parse('{"__proto__":{"a":"x"},"b":"y"}'))`: keys `['__proto__.a','b']` to `['b']`. Nested form `['a.__proto__.c','a.d']` to `['a.d']`.
- `loadConfig` over a `behavior.yml` holding `__proto__:\n  a: x\nb: y`: before, the config prototype was replaced, `config.a === 'x'` and the finding `findings.config.defined_twice __proto__ [object Object] behavior.yml` appeared; after, the prototype is `Object.prototype`, `'a' in config` is false, `config.b === 'y'`, own keys `['b']`, findings `[]`. The `defined_twice` finding goes away as a consequence.
- Both are covered by the two cases that failed on the unchanged tree and pass now.

REMOVED NAMES (`grep -rnw <name> src tests HELP.md DESIGN.md README.md`)
- `readManifest`, `readFeed`, `STAND_IN`: no hit. Local `readFile` in `src/lib/data`: no hit. `list` in `index.ts`: only comment words at lines 67, 73, 91, not the function.
- `stringMap`: hits only in `src/lib/state/shared/words/tones.ts:54,82,83`, that module's own function. `mapOf`: only `src/lib/state/system/config/typed.ts:44,50,55`, its own function. `rowOf`: only `server/sessions/stores/customizations.ts:112,377` and `server/accounts/calendar/poll.ts:135`, their own. None is a use of a removed data function.

BEFORE AND AFTER FOR THE LOOK: no view, style or markup file changed; case 14's snapshot (`cmp`) is byte-identical, so the app's data answer is the same.

BRIEF WRONG OR IMPOSSIBLE: the premise that the literal `safeParse|readAs(` count is at least 1 per converted file does not hold for four files (see top). The cast grep lines moved to `compact.ts:6` and `merge.ts:63`, which are the two the brief names.
