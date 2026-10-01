# Step Q85b refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85b, base 402437e8)

Result: two answers of the step differ from the unchanged tree without being named (Behaviour 1 and 2), and one declared type is wider than its check (Behaviour 3). Everything else I read or reran holds. The two Standards findings are small. Nothing under $TMPDIR that I created is left (`ls` of those paths after `rm` printed "No such file or directory" for each); the worktree still shows 205 `git status --short` lines, the number the builder's report gives.

## Verification (rerun by the reviewer)

```
$ npm run diagrams
exit 0 (run earlier in this review; the output was not retained)

$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md   (from the worktree's tools/oculus; lines grepped from its output)
1:$ npm test
10: Test Files  387 passed | 21 skipped (408)
11:      Tests  10135 passed | 615 skipped (10750)
15:$ npm run test:checks
24: Test Files  29 passed | 2 skipped (31)
25:      Tests  442 passed | 9 skipped (451)
29:$ npm run check
35:1790857007405 COMPLETED 2862 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
36:$ npm run build
740:$ npm run format:check      (Checking formatting... All matched files use Prettier code style!)
747:$ npm run lint
752:$ ! LC_ALL=C grep -rna '[^ -~]' src tests
753:checks: 7 commands passed

Commands the report quotes, rerun in the same form after the build:
$ du -sk .svelte-kit/output/client
30156    .svelte-kit/output/client
$ grep -rl '\$ZodType' .svelte-kit/output/client/_app/immutable | xargs wc -c
 2033179 .svelte-kit/output/client/_app/immutable/nodes/2.BxH5iWn5.js        (one chunk; the report's hash differs, the byte count is the same)
$ npx vitest run tests/state/client/socket-timing.test.ts --tagsFilter slow --reporter=verbose --disableConsoleIntercept
socket-timing: 50000 frames in 311.8 ms
 ok tests/state/client/socket-timing.test.ts > the page's socket under load > hands 50,000 frames to its listeners 1226ms
 Tests  1 passed (1)        (the report quotes 264.4 ms; a machine-dependent figure)
$ grep -rnE "core/shapes|in shapes\.ts" src tests | wc -l                                   0
$ grep -rnE "\.json\(\)\)? as |\) as \{|as (Entry|SchemaField|NoteRow|FsEntry|string)\[\]\)|as Body|as Answer|as ConnectSetup|as Partial<" src/lib/state | wc -l     0
$ grep -rnE "\.issues|prettifyError|treeifyError" src/lib/state | wc -l                     0
$ grep -rnE "^(export )?const [a-zA-Z]+ = z" src/lib/state src/lib/data/shapes | grep -vcE "const [a-zA-Z]+Shape = z"     0
$ grep -rnE "function (record|objectOf|mapOf)\b" src/lib/state | wc -l                     0
$ grep -rnE "typeof |Array\.isArray|isRecord\(|isMap\(" src/lib/state | wc -l               62   (the report's 62; I classified each line against "The other check lines")
$ the 33 removed names of item 7, grep -rnw <name> src tests config HELP.md DESIGN.md README.md --exclude=local.yml     all 33 print nothing
```

Other reruns, from a base copy built only under $TMPDIR (removed since), run earlier in this review:
- Failing-first: the base `src` under the final `tests/state` and `tests/views` gave 138 failed and 7521 passed of 7671, the report's numbers.
- Timing A/B: five alternating rounds, mean about 278 ms for the unchanged tree and about 369 ms for the changed one, ratio about 1.33, under the brief's 1.5. The per-round values were in a scratch file that is removed, so I cannot quote them.

Size and folder checks (`wc -l` over every changed or new file under src and tests; `ls | wc -l` over every changed folder): no file over 900 lines (`fs.test.ts` is exactly 900), no `.svelte` over 540, no folder over ten items (`tests/state/sources` holds 10, `tests/state/boards` 8, `src/lib/data` 9, `src/lib/state/client` 10, `src/lib/state/sessions/terminal` 9). Import order: `tests/checks/imports/order.ts` lists `data/shapes` between `data/accounts` and `data/helpers`, and `test:checks` passes.

## Verdicts

Items of the brief's "What to build":

- 1: violated, Behaviour 1 and 2 (two answers change without being named, against "No other answer changes"). Otherwise holds. Every schema const I grepped ends in `Shape` in lower camel. The `.refine` calls are value checks laid over a zod type: `saved.ts:47` and `lines.svelte.ts:36` use `Number.isInteger` because zod's `int` is safe-integer only. No `.issues` or error text is read (grep 0). The answers are built from `readAs`/`safeParse(...).data`. `unchanged` and `unchangedAs` are the helpers `DESIGN.md` "Untyped input" names.
- 2: holds. `shapes.ts` is at `src/lib/data/shapes/shapes.ts`; `src/lib/server/core/shapes.ts` is deleted; the 20 server importers changed by one import line each (diff stat); `json.ts` head comment names the new path; `order.ts`, `boundaries.test.ts` and the `DESIGN.md` `state/` row carry `data/shapes/shapes`; `DESIGN.md` "Untyped input" names `data/shapes/shapes.ts`; the diagrams are regenerated; the stale-path grep prints 0.
- 3: holds. `frameShape`, `state/client/payloads.ts` and `state/sessions/terminal/terminal-payloads.ts` exist (read whole). The one remaining cast is `entities.svelte.ts:66`, `return held === undefined ? null : (held as Payloads[K]);`, which Z154 N1 rules and documents.
- 4: holds, with Behaviour 3. The cast grep prints 0; the null/not-JSON handling is `readJson` (`shapes.ts:168`) at every reader I read; a refused body answers the status text and a 2xx one takes the reader's own failed-read path, as round-0 ruling 2 says.
- 5: holds. `savedUiShape` (`ui.svelte.ts:461`), the part-by-part schemas of `saved.ts` with the refusal sentences kept by order, and `form-drafts.svelte.ts` are read in the diff. Every field of `savedUiShape` gives the answer the hand code gave (I compared field by field).
- 6: holds. `searchRevealShape` (`shapes.ts:52`) is shared; the instance-state readers I read answer a non-map with the fallback.
- 7: holds for the readers I read in the diff (`tones.ts`, `catalogue.ts`, `rail-badges*.ts`, `palette.ts`, `status.ts`), except Behaviour 2.
- 8: holds as far as the diffs I read (collection, ticker, focus-lanes, presets, leads, radar, schema, form-values) and the case tables show; not probed beyond the suite.
- 9: holds. The grep prints 0. `allow-duplication.txt`: two entries removed because the clone is gone (`agents.ts`/`catalogue.ts`, `inbox.ts`/`rail-badges.ts`), the deposit entry re-marked (30 lines at 100 and 14 became 27 lines at 99 and 20; the state file may not import `server/`), the rest path edits for the moved tests; I read the whole diff of the file.
- 10: holds; the 62 remaining check lines are the report's, each classified.
- 11: holds. `DESIGN.md` "Untyped input" and the `state/` row read whole; a grep of the added src lines for step ids, dates, "previously", "no longer" and similar prints no hit.
- 12: holds. `git diff -U0` over `tests` (moved files excluded) shows removed lines only as imports, header comments, the stub `WebSocket` moved to `tests/state/client/socket-stub.ts`, and path text in comments. I diffed all six moved files against the base (`git show 402437e8:<path> | diff`): only import depth changes, plus appended cases in `focus-lanes.test.ts` and `fs-shape.test.ts`. New cases for the over-850-line files are in `collection-fields.test.ts`, `focus-config.test.ts` and `fs-answers.test.ts`.
- 13: holds. The test is tagged slow, builds the stub socket, feeds 50,000 frames and asserts only a count heard; ratio about 1.33 against the 1.5 bound.
- 14: holds for the changed tree (30156, one zod chunk of 2033179 bytes). The baseline 30064 is the report's and I did not rerun it.
- 15: violated, Behaviour 1 and 2; the three named defects (own `__proto__` skipped, JSON null/not JSON, failing list items left out) hold as built (`mapOfShape`, `readJson`, `rowsShape`/`survivorsShape`).

Cases of the brief's "Cases" (each: the test file that holds its input, found by grep, passing in the 10135):

- 1: met as ruled (A); `config-seed.test.ts`.
- 2: met; `config-seed.test.ts` (`"b":3,"__proto__":"y"`).
- 3: met; `writes.test.ts`.
- 4: met; `writes.test.ts`.
- 5: met; `fs-answers.test.ts`.
- 6: met; `search.test.ts`.
- 7: met; `files.test.ts`.
- 8: met; `latex.test.ts`.
- 9: met; `source.test.ts`.
- 10: met; `terminal-tabs.test.ts`.
- 11: met; `composer.test.ts`.
- 12: met; `folds.test.ts`.
- 13: met; `ui-load.test.ts`, read whole (80+ rows, each a full line of what loadUi read and wrote).
- 14: met; `layout-refusals.test.ts`, `layout-parse-refusals.test.ts`, `layout-parse-root-refusals.test.ts`, `layout-workbench-refusals.test.ts` (named by grep and stat; not read whole).
- 15: met; `instance.test.ts`, `selection.test.ts`, `status.test.ts`, `rail.test.ts`, `pages.test.ts`, `arrangement.test.ts`.
- 16: met; `catalogue.test.ts`, `rail-badges.test.ts`.
- 17: met; `instance-state*.test.ts` through `instance-fixture.ts`, which I read whole.
- 18: met; `appearance.test.ts`, `tones.test.ts`, `focus-config.test.ts` and the others named in the stat.
- 19: met; `collection-fields.test.ts` and the rest.
- 20: met; `form-drafts.test.ts`.
- 21: partial. `deposit.test.ts`, `usage-refresh.test.ts` and `pty-io.test.ts` read whole and meet it. The `memories` row is partial (Behaviour 1). The `agents` row passes as the brief words it ("a body missing the answer's list" is kept), with Behaviour 3.
- 22: met; the suite passes (10135) and the only edits to existing tests are the ones listed under item 12.
- 23: met; the 62 lines are classified, and their existing tests pass unedited.

## 1. Spec

none

## 2. Proof

- Report "Total: 506 -> 59 in these 71 files": my count `git diff 402437e8 --name-only -- src/lib/state` then `grep -cE "typeof |Array\.isArray|isRecord\(|isMap\(" <file>` summed over the files that exist gives 58 over 78 changed files, and 0 in each of the two new files; what is wrong: one line and 7 files apart; the decision resting on it: none, the whole-directory grep prints 62 as the report says; failure scenario: none; verdict: none.
- Report item 7: four of the 40 names (`foot`, `lede`, `n`, `popover`) are "counted, not read"; what is wrong: a "not verified" in the report; I read the removed lines for `foot`, `lede`, `popover`, `sums` and `dock` in `git diff 402437e8 -- src`: all were local variables of the removed functions, none a call; verdict: none.

## 3. Standards

- `tests/state/workbench/layout/saved/refusal-fixture.ts:1`: "// Layer 2, test fixture. Readers and builders for the saved-arrangement refusal suites"; what is wrong: every other test fixture heads its file "Layer 4, test fixture" (`board-fixture.ts:1`, `rail-fixture.ts:1`, `writes-fixture.ts:1`); failure scenario: a reader taking the layer tag at its word looks for the file in the state layer; verdict: none of the items; change the tag to Layer 4.
- `src/lib/state/workbench/navigation/arrangement.ts:38`: "const arrangementTabShape: z.ZodType<Instance> = z.union([viewIdShape, stateTabShape]);"; what is wrong: `DESIGN.md` "Untyped input" holds a schema with a declared type with `satisfies`; an annotation is needed only for the recursive node (`arrangementNodeShape`, line 61), and this tab schema is not recursive; failure scenario: the annotation widens the const to the declared type, so a drift of the union's output from `Instance` shows at the use, not at the const; verdict: none of the items (small); use `satisfies`.

## 4. Behaviour

- `src/lib/state/life/memories.svelte.ts:55`: "const sideShape = z.number().multipleOf(1).positive().nullable().catch(null);"; what is wrong: it replaces `Number.isInteger(value) && value > 0`. zod 4.6.5's `multipleOf(1)` accepts numbers the hand check refused. Probe with the repo's zod: `1e-20`, `5e-324` give the number itself (the unchanged test answers null); `1.5`, `0.5`, `1e-7` give null as before. The report does not name it and no test fails without it; failure scenario: an answer `{ name: 'a', width: 1e-20, height: 5 }` gave `size: null` and now gives a size, so the tile aspect is computed from a side that is not a whole number of pixels; verdict: item 1 and item 15 violated ("No other answer changes"), case 21 partial. Fix: `z.number().refine(Number.isInteger).positive().nullable().catch(null)` as `saved.ts:47` does, with a case of `1e-20` that fails on the unchanged tree.
- `src/lib/state/shared/words/tones.ts:55`: "return Object.fromEntries(Object.entries(held).map(([name, one]) => [name.toLowerCase(), one]));"; what is wrong: `mapOfShape` skips an own `__proto__` key, then the lower-casing can create one: a `palette`, `status_palette`, `type_color`, `domains` or `data_access` key `__PROTO__` becomes an own `__proto__` entry. Probe: `Object.getOwnPropertyNames` of the new result is `['__proto__','a']`, of the unchanged loop's `['a']`; `byKey(palette, '__proto__')` then finds it. `setVocab` filters `__proto__` for the legend (`tones.ts:85`) but not here, and `DESIGN.md` says a map built from an outside map's keys skips an own `__proto__` key; failure scenario: a config with a `__PROTO__` domain answers a colour for the lookup `__proto__` where the unchanged tree answered none; verdict: item 1 and item 15 violated (an unnamed changed answer, config-author-only). Fix: skip the lower-cased key `__proto__` in `stringMap` and add a case.
- `src/lib/state/sessions/agents.svelte.ts:22-24`: "const listShape = z.array(z.unknown()).optional();" inside `unchangedAs<AgentsAnswer>(z.looseObject({ agents: listShape, accounts: listShape, findings: listShape }))`, and `src/lib/data/model/model-agents.ts:53-57` declares all three lists required; what is wrong: the check admits a body the declared type forbids, and `tests/state/sessions/agents.test.ts` asserts that `{}` is handed on as the answer. `Composer.svelte:101` is `return read?.agents.find((one) => one.agent === agent) ?? null;`, so a 200 `{}` makes that derived throw. The unchanged tree did the same and brief case 21 says "a body missing the answer's list" is kept, so the builder followed the brief; the same file already turns a wrong-typed list into a failed read (Z154 N2); failure scenario: `/api/agents` answering 200 `{}` or `{"accounts":[]}` leaves the composer's derived throwing a TypeError; verdict: case 21 met as written, not a defect of this step. This changes a kept answer, so it needs the orchestrator's ruling. The better option is to require the three lists (and `rows` in `customizationsAnswerShape`), which makes the missing list a failed read like the wrong-typed one; the lazy option is leaving the test that pins `{}`.

## Declined to judge

- The new test files I did not read line by line: `collection-fields.test.ts`, `focus-config.test.ts`, `fs-answers.test.ts`, `instance-state-feeds.test.ts`, `-files.test.ts`, `-sources.test.ts`, `appearance.test.ts`, the four `layout-*refusals.test.ts` suites and `refusal-fixture.ts` beyond its head, `off-facets.ts`, `socket-stub.ts`, and the appended cases in about 60 existing test files. I checked that each case's input exists in the named file by grep, that the whole suite passes, and, for the aggregate, the failing-first count. I did not check these files for a test fitted to its revert or for one asserting a known defect, except the `agents` `{}` case above. What would settle it: a read of each file.
- Which of the 138 failing-first cases belongs to which changed answer: only the aggregate was rerun.
- The bundle baseline 30064 and the per-round timing values: not reproduced in a form I can quote (see Verification).
- That the page works in a browser: not run; the brief's verification list does not include it.

Reviewer usage: about 600,000 tokens (the session counter went from 15,000,000 to 14,417,626 across the whole run); tool uses and minutes were not counted.
