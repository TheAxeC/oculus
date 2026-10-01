# Step Q85c refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85c, base 8db30ca2)

Pages cited are named by section. Findings in code keep file:line (line numbers are the worktree's, from `tools/oculus`).

Position first: the step is built and its verification list is green. Findings: 3 Spec (one low, one that needs the orchestrator's ruling, one gate-wording), 2 Proof (low), 9 Standards (all low), 1 Behaviour. No ADR governs the step (`ls docs` prints `diagrams` only; no `docs/adr`). Nothing that I ran contradicts a count or a measurement in the builder's report.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams      (from tools/oculus in the worktree; exit 0; git status afterwards still 48 paths, layer-data.dot and .svg the only diagram files modified)
$ sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md   (exit 0)
$ npm test
 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85c/tools/oculus
 Test Files  410 passed | 22 skipped (432)
      Tests  10776 passed | 618 skipped (11394)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790872883845 COMPLETED 2924 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Commands the builder's report quotes, rerun in the same form:

```
npx vitest run tests/data          -> Test Files  34 passed (34) / Tests  669 passed (669)        (claim: same)
grep -rcE "typeof |Array\.isArray|isRecord\(|isMap\(" --include='*.ts' src/lib/data | awk -F: '$2>0'
                                   -> 14 files, 41 lines (validate.ts 12, normalise.ts 2, shapes.ts 2, calendar 1, connect 2, model-sessions 1, agents 1, merge 1, options 4, worktrees 3, search 1, code-themes 1, guards 9, opens-in-program 1)   (claim: 14 files, 41 lines)
grep -rnE "\.issues|prettifyError|treeifyError" src/lib/data   -> no output
grep -rnE "^(export )?const [a-zA-Z]+ = z" src/lib/data | grep -v "Shape = z"   -> no output
cast grep                          -> src/lib/data/snapshot/compact.ts:6 and src/lib/data/sources/config/merge.ts:63 only
item 6 grep                        -> src/lib/data/helpers/guards.ts:18 only
sed -n 148p DESIGN.md | grep -c 'src/lib/data'   -> 1
head -15 of every converted file | grep typeof   -> no output
LC_ALL=C grep -rna '[^ -~]' src tests DESIGN.md  -> no output
wc -l normalise.ts validate.ts     -> 767 and 849
ls: src/lib/data/snapshot 6, tests/data/sources 9, tests/data 9, tests/data/snapshot 4
grep -c 'safeParse\|readAs(' per file: deck 2, editor 1, opens-in-program 1, search 1, index 1, shapes 8, normalise 6, validate-themes 2, validate 12, career 0, collections 2, agents 2, catalogs 3, local 6, merge 2, options 0, rail 8, settings 4, themes 2, docs 1, feeds 0, manifests 0, present 3, registries 2, yaml-file 1, compact 0, normalise-career 7   (claim: 0 for feeds, manifests, career, options; the rest at least 1)
case 14: base src/lib/data rebuilt in the scratchpad by reverse-applying `git diff 8db30ca2 -- src/lib/data` with patch -R (no other git command); JSON.stringify(buildPortfolio(demo, config)) of both trees, 43256 bytes each; `cmp base.json new.json` -> no output, exit 0
first run on the unchanged tree: the worktree's new and changed test files (22 files) run against that rebuilt base tree -> Test Files 1 failed | 21 passed (22), Tests 2 failed | 503 passed (505); the two failures are tests/data/sources/config/merge.test.ts "flattenText > skips an own __proto__ key at every level" ("expected [ '__proto__.a', 'b' ] to strictly equal [ 'b' ]") and "loadConfig > skips a top-level __proto__ key of a file ..." (prototype not Object.prototype). The same 22 files in the worktree pass (inside the 669 above).
timing (tests/data/snapshot/build-timing.test.ts, base then worktree, 3 alternating rounds, ms per 200 runs, machine loaded):
  buildPortfolio 2571.2/4109.7, 2791.1/2394.9, 3195.3/2319.3 (means 2852 vs 2941, 1.03x)
  readManifests  1039.9/977.1, 908.9/680.0, 842.4/631.1 (means 930 vs 763, 0.82x)
  validate       14.7/17.4, 11.0/11.5, 16.7/15.9 (means 14.1 vs 14.9, 1.06x)
  report claimed 1.02x, 0.96x, 1.01x over five rounds; all under 1.5x; a second build of each tree is needed for any ratio, and the noise (base validate 11.0 to 16.7) hides differences under about 20 percent.
```

Additional check beyond the quoted commands (a differential run, scripts in the scratchpad, nothing in the worktree edited): the rebuilt base `src/lib/data` against the worktree's over about 250,000 inputs. Inputs were 80 weird values (undefined, null, NaN, the infinities, JSON `1e999`, 2^53, 2^53+2, 2^60, blank and NBSP and BOM strings, lists, maps, an own `__proto__` key holding a map, a text and a number, a key given twice in YAML, Date, Map, class instance, null-prototype object) put at every key of: the settings readers, `searchCap`, `paintLimit`, `programApps`, `catalogOf`, glyph, icon and theme readers, the rail readers, `cacheModels`, `deckOrder`, `savedKeys`, `flattenText`, `usageTiers`, `portfolioConfigFrom`, `collectionKeys`, `followups`, `subtasks`, `collectionSchema`, `career`, `fieldNames`, `schemaKeys`, 44 `checkLocal` texts, the five source readers and `readFrontmatter` over 20 file bodies, `readPresent` and `deckFindings`, `loadConfig` over scratch engines, and `validate` and `normalise` over the demo hub's raw portfolio with each weird value put at each field of manifests, registry entries, registry meta, collection entries, collection meta and the career file. Result: the only differences are `flattenText`, `portfolioConfigFrom(...).text` (through `textCatalog`, which calls `flattenText`) and `loadConfig`, all on an own `__proto__` key. Identity (`toBe`), key order, own `__proto__` keys and thrown sentences matched everywhere else.

## Verdicts

Items of the brief's "What to build":

- 1: violated (low), Spec 1: six schemas are built at each call instead of once at module level. Everything else in the item holds: `satisfies` where a declared type exists, the five answer-keeping rules (the differential shows no difference), no `.issues`, answers built from `safeParse(...).data` or `readAs(...)`, whole numbers by `Number.isInteger`.
- 2: holds. `readYamlMap` (`sources/yaml-file.ts:27-47`) tests the top through `readAs(mapShape, ...)`; the casts are gone (cast grep above); the top-of-file findings are unchanged for `[]`, `3`, `'x'`, empty (differential, and tests in registries, collections, manifests, docs, career and feeds tests).
- 3: holds. Lists and rows of the registries, collections, feeds, deck, `local.ts`, `rail.ts`, `agents.ts` read through item schemas; `local.ts` sentences and their order are identical (44 texts, plus `tests/data/sources/config/local.test.ts`).
- 4: holds. `settings.ts` has no inline map test or cast; `searchCap`, `programApps`, `paintLimit` read through a schema each; `flattenText` stays a walk with `isMap`.
- 5: holds. `normalise.ts`, `validate.ts`, `validate-themes.ts` read through schemas; `fieldNames` through `listNamesShape` (`validate.ts:165-172`); 849 and 767 lines; the new modules `snapshot/compact.ts` and `snapshot/normalise-career.ts` are beside them (folder holds 6).
- 6: holds. Item-6 grep prints `guards.ts:18` only; `sources/yaml-file.ts` replaces the five `readFile` clones; allowlist lines 14-18 removed and lines 46 and 51-54 rewritten to the moved paths (diff of `tests/checks/tree/allow-duplication.txt`), nothing added; `npm run test:checks` passes.
- 7: holds. Report's file table gives each remaining check line with its reason; my line list matches (`validate.ts` 154-156 `shapeOf`, 261, 288, 514, 608, 634, 693, 710, 747 vocabulary comparisons, 308 a type; `normalise.ts` 163 and 175 bare `isMap`; `options.ts` 24, 60, 75, 83; `merge.ts` 224; `opens-in-program.ts` 62; the rest are single-argument checks).
- 8: holds. `tests/data/snapshot/build-timing.test.ts` is tagged `@module-tag slow`, builds the portfolio 200 times and times `readManifests` and `validate` alone, asserts results and not time; my three alternating rounds give 1.03x, 0.82x, 1.06x.
- 9: holds as written (the two changed answers, each with a case that fails on the base and passes after). The premise "no other reader builds a map from an outside map's keys" is false for three readers, Spec 2; one of the changed answers also reaches `textCatalog`, Behaviour 1.
- 10: holds. Item-10 greps print 1 and nothing. The opening scope sentence of `DESIGN.md:148` was not extended, Standards 1.
- 11: holds. `calendar-config.test.ts` and `mail-config.test.ts` moved with only their two import paths changed (diff against the base blobs); the seven named files exist under `tests/data/sources/config/`; the only edited existing line in a test is one import line of `tests/data/snapshot/normalise.test.ts`; `normalise.test.ts` is 847 lines; no existing case removed.
- Verify 2 (the per-file `grep -c "safeParse\|readAs("` gate): partial literally, met in substance, Spec 3.
- Verify 1, 3, 4, 5, 6: hold (rerun above; item 3 greps; the two item-9 cases fail on the base; timing; removed names `readManifest`, `readFeed`, `STAND_IN`, local `readFile` have no hit in `src tests HELP.md DESIGN.md README.md`, and `entriesOf`, `rowOf`, `mapOf`, `stringMap` hits are other modules' own functions).

Cases of the brief's "Cases":

- 1: met. Tests per module (`career.test.ts`, `collections.test.ts`, `docs.test.ts`, `feeds.test.ts`, `manifests.test.ts`, `registries.test.ts`) for `[]`, `3`, `'x'`, empty; differential over those bodies and `null` shows no difference.
- 2: met. `registries.test.ts` and `collections.test.ts` additions (map list; items `3`, `null`, `{id:3}`, `{id:''}`, `{id:'a',extra:1}`; `registry`, `key`, `file`, `provenance`); differential.
- 3: met. `feeds.test.ts` (meta list, entries map, run log `3` and `{ at: 1 }`).
- 4: met. `present.test.ts` (slide map a list, `slides` a map, slide `3`, `order`, `tag: 3`, `tag: {class: 3}`, `eli5: []`, `specs`, `panels`, `deckOrder`, `savedKeys`); differential over 2,463 `readPresent` and `deckFindings` inputs, 0 differences.
- 4b: met. `manifests.test.ts` "keeps a key the schema does not name, in its place" and `validate-shapes.test.ts` "reports a key a project.yml carries that the schema does not name, after readManifests"; registry and feed `meta` order tests in `registries.test.ts` and `feeds.test.ts`.
- 5: met. `tests/data/sources/config/settings.test.ts` (NaN, both infinities, `'5'`, `-1`, `0`, `1.5`, `''`, `3`, `'true'` as `prewarm`); differential over seven readers.
- 6: met. `local.test.ts` (44 texts including the `dir`/`label` pair, the `hub: 3` beside `port: x` order, `port: 1.5`); no case opens `config/local.yml`.
- 7: met. `catalogs.test.ts`, `rail.test.ts`, `agents.test.ts`, `options.test.ts`; differential.
- 8: met. `merge.test.ts` (`flattenText` changed and kept, `usageTiers` both, `loadConfig` over a scratch engine); first run on the rebuilt base: exactly the two changed cases fail.
- 9: met. `tests/data/portfolio-config.test.ts` (`toBe` for `schema` and `deck`, line 102-103); differential.
- 10: met. `helpers/search.test.ts`, `helpers/files/opens-in-program.test.ts`, `helpers/editor.test.ts` additions.
- 11: met. `normalise.test.ts` additions (`followups`, `subtasks`, `collectionSchema`, `career`, `collectionKeys`, `year`, `status`).
- 12: met. `validate-shapes.test.ts` lines 111-132 (four forms and `null`).
- 13: met. `validate-shapes.test.ts` and 900 `validate`/`normalise` career cases in the differential.
- 14: met. `cmp` of the two snapshots printed nothing (Verification).
- 15: met. `npm test` (410 files) and `npm run test:checks` pass; the one edited existing line is an import.
- 16: met. Existing tests of the kept lines pass in the full run.

## 1. Spec

- `src/lib/data/index.ts:64`, `:75`, `:101`, `src/lib/data/snapshot/normalise.ts:79`, `src/lib/data/sources/present.ts:135`, `:140`: "return readOr(rowsShape(scanRuleShape), value, []);" (and the same with `rowsShape(collectionFileShape)`, `rowsShape(vocabKeyShape)`, `rowsShape(collectionKeyShape)`, `rowsShape(specShape)`, `rowsShape(panelShape)`); what is wrong: item 1 says the schema is "built once at module level"; `rowsShape(x)` builds a new array-plus-transform schema at every call of `scanRules`, `collectionFiles`, `vocabKeys`, `collectionKeys`, `specs` and `panels` (the other sites, `idsShape`, `entriesShape`, `listNamesShape`, are module-level consts); failure scenario: `specs` and `panels` run once per slide on every rebuild, so each rebuild allocates one more schema per slide than the brief's form needs (measured cost is small, 1.03x on the demo hub, so this is a convention break and a cost, not a wrong answer); verdict: item 1 violated (low), fix by a module-level `const specsShape = rowsShape(specShape)` and the like.
- `src/lib/data/sources/collections.ts:47-49`, `src/lib/data/sources/registries.ts:80-82`, `src/lib/data/snapshot/normalise.ts:485-487`: "for (const [key, value] of Object.entries(data)) { if (key !== listName) meta[key] = value; }" and "if (key !== 'provenance') fields[key] = value;"; what is wrong: item 9's premise is that the readers it leaves alone "build no map from outside keys", and `DESIGN.md:148` (edited by this step) says "A map built from an outside map's keys skips an own `__proto__` key". These three loops build a map from a hub file's keys and let an own `__proto__` key replace the new map's prototype. Reproduced on the step's tree: a registry or collection file `__proto__:\n  injected: yes\nentries: []` read by `readRegistries` / `readCollections` gives a `meta` whose prototype is not `Object.prototype` and `meta.injected === 'yes'`; a collection entry `{"__proto__":{"injected":"yes"},"title":"t"}` through `normalise` gives `entry.fields.injected === 'yes'`. The builder's judgment call 9 names the meta loops as unchanged and "not part of item 9"; the `fields` loop is not mentioned; failure scenario: a hub file (or a pasted registry) with a `__proto__:` key gives every reader of `meta`/`fields` an inherited key no file set, the defect Z163 (a) ended in `loadConfig` and `flattenText`; verdict: item 9 holds as written, but the clause the step adds to `DESIGN.md:148` stays false for the data folder. This is the same kind as Z163 (a), which the orchestrator closed in automode by fixing it; the cheaper option (a booking) is the lazy one. The fix is three `key !== '__proto__'` conditions and a case each (not made; I change nothing).
- Brief "Verify before you report" 2, and item 1 "answer is built from `safeParse(...).data` or `readAs(...)`": `src/lib/data/sources/feeds.ts` prints 0 (reads through `readOr` five times and `readYamlMap`), `sources/manifests.ts` 0 (`readYamlMap`, `optionalText`), `sources/career.ts` 0 (`readYamlMap` only), `sources/config/options.ts` 0 (`readOr`); what is wrong: the gate's words are "at least 1 for every file whose reader the step converts", and these four files print 0 on the literal grep. Against the brief's own words: the four readers are converted (each answer is the output of a `safeParse` inside `readOr` at `shapes.ts:206-209`, `optionalText` at `shapes.ts:56-58`, or `readAs(mapShape, ...)` inside `readYamlMap` at `yaml-file.ts:41`), so F15's purpose (a converted reader cannot hide behind a count of 0) is met, but `readOr`, `optionalText`, `filledText` and `readYamlMap` are forms the brief does not name, and the literal count is unmet. `career.ts` has no schema in its own file at all: it delegates the whole read to `readYamlMap`. The builder reported this first and did not pad the files with a redundant `readAs(` call; failure scenario: none for behaviour; a reader running the brief's grep sees four zeros; verdict: Verify 2 partial literally, met in substance; the orchestrator's call, my reading is that the substance counts and the brief's gate text, not the code, is what is short.

## 2. Proof

- Report, DONE table row "Full verify list, run 1 of 1": "(I kept only the last 40 lines, so the earlier commands' output is not quoted)"; what is wrong: the brief says "the lines it prints are what the report quotes" and the DONE table carries the checks "and their output verbatim"; the report quotes the last 40 lines of one run, and the 'Broad runs' row gives 410 files and 10776 tests from a separate `npm test`. I reran the list (Verification), 410 passed and 10776 passed match, so no decision rests on the gap; failure scenario: none after the rerun; verdict: none.
- Report, "first run of the cases on the unchanged tree": "32 test files passed and 1 failed; 664 tests passed and 2 failed ... Reference run of the app before: 81 files passed, 13 skipped; 1461 tests passed, 400 skipped"; what is wrong: the first-run figures are aggregates, not a quoted failing check per changed case; the brief asks the report to quote both runs. I reproduced the claim on the rebuilt base (2 failed, both the item-9 cases, 503 passed in the 22 files), so the claim stands, and the failing text is quoted in Verification above; failure scenario: none; verdict: none (low).

No test asserts a known defect, none has a threshold widened, none is made to pass by exemption. The test that lists an own `__proto__` key in `vocab.types` and `vocab.statuses` (`tests/data/portfolio-config.test.ts:106-118`) is what case 9 prescribes ("what the unchanged tree answers (kept)"); those are lists of keys, not maps. No `static` or file-scope mutable added.

## 3. Standards

- `DESIGN.md:148`: "In `server/core`, `server/root`, ... `server/transcripts` and `state/`, a value that comes from outside the process ... is checked with a zod schema ..."; what is wrong: the step adds the paragraph "In `src/lib/data` what is read that way: ..." but the opening sentence that sets the scope still lists the server folders and `state/` only; failure scenario: a reader of the scope sentence concludes `data/` is outside the rule and does not look for its schemas; verdict: none (item 10 holds).
- `src/lib/data/snapshot/validate-themes.ts:14` "const wordShape = z.string();" against `src/lib/data/shapes/shapes.ts:218` "export const wordShape = z.string().catch('');"; what is wrong: two schemas with the same name and different answers (a non-string word fails in one and becomes the empty text in the other); `validate.ts` imports the second. Four more files define a one-use alias of `z.string()` (`validate.ts:146` `idShape`, `settings.ts:10` `labelShape`, `normalise-career.ts:25` `plainShape`, `index.ts:110` `pathShape`), so one shared `z.string()` rule exists five times; failure scenario: a maintainer replaces the local `wordShape` in `validate-themes.ts` with the shared one, and a non-string theme word then reads as `''` and is no longer skipped, which changes the findings; verdict: none.
- `src/lib/data/sources/config/settings.ts:154-158`: "const [key] = Object.entries(held).find(([, value]) => !labelShape.safeParse(value).success) ?? [''];"; what is wrong: `tiers` is null only when some value fails `labelShape`, so `find` always finds one and the `?? ['']` branch cannot run (a fallback that stands for nothing); failure scenario: none today, but the dead branch reads as a real case; verdict: none.
- `src/lib/data/snapshot/normalise.ts:121` "export { career };": nothing under `src` imports `career` from `normalise.ts` (`normalise.ts` itself imports it from `normalise-career.ts` at `:15` and calls it at `:762`); only `tests/data/sources/career.test.ts:9` does, so the re-export exists to leave a test unedited; failure scenario: none; verdict: none.
- `src/lib/data/snapshot/normalise-career.ts:119` "const strip = readAs(mapShape, raw.situation);": the variable holds the situation map and is named `strip`; failure scenario: the next reader looks for what is stripped; verdict: none.
- `src/lib/data/helpers/files/opens-in-program.ts:34` "const bundleIdShape = z.string().regex(BUNDLE_ID);" beside the exported `isBundleId` at `:51`: the bundle-id test now exists in two forms over one regex, used by `programApps` and by `server/files/open.ts:243`; failure scenario: a change to one form (a trim, a length limit) is missed in the other; verdict: none.
- `src/lib/data/shapes/shapes.ts:1-7` (head comment): lists the shared helpers by kind and ends "the plain readers `readAs` and `text`"; `readOr`, `filledText`, `optionalText`, `keysOfShape`, `valuesOfShape`, `optionalItemsShape`, `textOrNumberOnlyShape` are added by this step and not named; failure scenario: a reader of the head comment writes a fourth local `readOr`; verdict: none.
- Report, "Git slip": "I ran one read-only `git diff --stat` early on"; what is wrong: `agents/spec.md`, "Where you work": "You never run a git command". It changed nothing; failure scenario: none beyond the rule; verdict: none.
- Report, "Broad runs, counted": "`npm test` 1 ..., `npm run test:checks` 2, the server/checks-config/rail group 2, full list 1"; what is wrong: `agents/spec.md`, "Token discipline": run only the test files you change while working, the full list once at the end. By the report's own table the whole unit suite ran twice (the separate `npm test` and the list) and `test:checks` three times, while the report and the dispatch entry count "1 full-list run"; failure scenario: the usage figures (138,304 tokens, 69.7 min) are read as one list run; verdict: none. Not verifiable by a command: I can only read the report's own count.

## 4. Behaviour

- `src/lib/data/sources/config/merge.ts:222-232` (`flattenText`), reached by `textCatalog` in `src/lib/data/sources/config.ts` and so by `portfolioConfigFrom(...).text`: "if (key === '__proto__') continue;"; what is wrong: the report's CHANGED ANSWERS list gives `flattenText` and `loadConfig` only. The same change alters `portfolioConfigFrom({ text: JSON.parse('{"__proto__":{"a":"x"},"b":"y"}') }, engine).text` (keys `['__proto__.a','b']` to `['b']`, found by the differential), and, for `loadConfig`, the finding `findings.config.defined_twice __proto__ [object Object]` also disappears for a file holding `__proto__: x` (a text, not a map; the base raised it with the prototype unchanged) and a second file's `defined_twice a undefined` finding disappears for the map case. The report states the finding going away only for the single-file map case; failure scenario: a reader checking the report's list of changed answers finds no entry for the text catalog or for the text-valued `__proto__` finding; verdict: none (item 9 holds).

## Declined to judge

- The look on the TEST page: no view, style or markup file changed (diff paths above), so it is the orchestrator's landing step and nothing a read can settle.
- The unchanged-tree results come from a rebuilt base: `src/lib/data` of the worktree copied to the scratchpad and `git diff 8db30ca2 -- src/lib/data` reverse-applied with `patch -R`, a copy of the app tree around it (symlinks for `node_modules`, `config`, `demo`). That is the base as the diff states it; no second git command (`git show`, `git worktree`) was allowed to confirm it against the commit.
- Whether the builder started a helper agent or ran more git commands than it states: the report says none; no command here can verify what the builder ran.
- `config/local.yml`: never opened, printed, grepped or hashed by me. `vite.config.ts` calls `loadLocal(engineDir())` when vitest starts, as in every run of the list; that is the app's own tooling.
- Whether the literal gate or the intent counts for the four zero-count files (Spec 3): the orchestrator's decision; I gave my reading.
- Five alternating timing rounds: I ran three, on a loaded machine (base `validate` ranged 11.0 to 16.7 ms across rounds), so ratios under about 20 percent are not resolved.
- Windows or other-platform behaviour of the file readers: not exercised.

Reviewer usage: about 330,000 tokens (context counter), about 80 tool uses, about 70 minutes (including two runs of the 7-command list at about 7.5 minutes each; the first run's output file was overwritten by a parallel session writing the same scratchpad path, so the quoted lines are from the second run).

## Repair round 1, refuted

# Q85c repair round 1, reviewer report (worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85c, base 8db30ca2, product tools/oculus)

Position first: every ruling of round 1 is closed. The verification list is green. I found 0 Spec, 0 Proof, 2 Standards (low) and 1 Behaviour (low) findings. Nothing was changed anywhere. `git status --short` in the worktree still prints 48 paths after my runs. My scratch files are under $TMPDIR with the prefix `Q85c-r1-review-`.

## Verification lines (from tools/oculus in the worktree, run in the foreground)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams        exit 0, git status --short afterwards 48 paths
$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md      exit 0
$ npm test
 Test Files  410 passed | 22 skipped (432)
      Tests  10779 passed | 618 skipped (11397)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790874541965 COMPLETED 2924 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
No test timed out in my run, so there is nothing to name as load.

Commands the round's report quotes, rerun:
- `npx vitest run tests/data tests/checks/diagrams` printed `Test Files 37 passed (37)` and `Tests 744 passed (744)`. This matches the report.
- Counting grep over `src/lib/data` printed 14 files and 41 lines (validate 12, normalise 2, shapes 2, connect 2, calendar 1, model-sessions 1, agents 1, options 4, merge 1, worktrees 3, code-themes 1, search 1, guards 9, opens-in-program 1). The `.issues|prettifyError|treeifyError` grep and the non-`Shape` `const x = z` grep print nothing. The cast grep prints `snapshot/compact.ts:6` and `sources/config/merge.ts:63` only. The item 6 grep prints `helpers/guards.ts:18` only.
- `sed -n 148p DESIGN.md | grep -c 'src/lib/data'` printed 1, and `grep -o "server/transcripts., .src/lib/data. and .state/."` matched the opening scope sentence.
- `grep -rn "export { career" src/lib/data` and `grep -n "?? \['']" settings.ts` print nothing. `grep -rn "rowsShape(" src/lib/data` prints only module-level consts (`index.ts:61,77,104`, `normalise.ts:72`, `present.ts:134,142`, `feeds.ts:35`, `validate.ts:170` inside `listNamesShape`) plus the helper's own definition in `shapes.ts`.
- `q85c-answers.mjs` was in the session scratchpad. I ran it on the tree it was run on (`$S/base/oculus`, which I confirmed equals the base: reverse-applying `git diff 8db30ca2 -- tools/oculus/src/lib/data` onto a copy of the worktree's folder leaves only the three new files as the difference) and on the worktree. All ten changed answers reproduce:
  - Before: `flattenText` gave `["__proto__.a","b"]` and nested `["a.__proto__.c","a.d"]`; `textCatalog` and `portfolioConfigFrom(...).text` gave `["__proto__.a","b"]`.
  - Before, `loadConfig`: the map case replaced the prototype (`protoIsObject:false`, `inherited_a:"x"`) with a `defined_twice __proto__` finding; the text case kept the prototype and had the same finding; the two-file case replaced the prototype and had two findings.
  - Before: registry meta and collection meta had `protoIsObject:false` and `injected:"yes"`.
  - After: `["b"]`, `["a.d"]`, `["b"]`, `["b"]`; `loadConfig` has `protoIsObject:true`, own keys `["b"]` and `[]` findings in the map and text cases; the two-file case has `inherited_a:"z"` and `[]` findings; registry meta and collection meta have `protoIsObject:true` and keys `["title"]`.
- Case 14: `JSON.stringify(buildPortfolio(demo, config))` from the base tree and from the worktree is 43256 bytes each, and `cmp` printed nothing (exit 0).
- Timing: `build-timing.test.ts` ran in 3 alternating rounds, base then worktree (base src copy, worktree tests), 200 runs each. buildPortfolio ms: base 2016.5, 2730.8, 2368.2 (mean 2371.8); worktree 2280.4, 2083.7, 1964.3 (mean 2109.5; 0.89x). readManifests: base 443.7, 787.1, 684.4 (mean 638.4); worktree 610.7, 697.6, 460.2 (mean 589.5). validate: base 10.4, 15.4, 17.6 (mean 14.5); worktree 11.0, 11.4, 10.7 (mean 11.0). All three are under the 1.5x bound; the machine was loaded.
- Differential (the scripts of the first review, in the session scratchpad, adapted in a copy only to import `career` from `normalise-career.ts`, since ruling 4 removed the re-export): `diff.mjs` compared 10751 cases and found 8 differences, all `flattenText` and `portfolioConfigFrom(...).text` on an own `__proto__` key. `diff3.mjs` compared 235695 cases and found 12 differences, all `loadConfig` with an own `__proto__` key in a file. `diff4.mjs` found 0 differences in 2463 `readPresent`/`deckFindings` inputs. `diff5.mjs` found 0 differences in 900 `validate`/`normalise` cases. Identity, key order and thrown sentences matched everywhere else. These scripts do not cover the three round-1 `__proto__` loops; those are covered by the answers script and the three cases below.

## Verdicts for the whole diff since the base

Items of "What to build":
- 1: holds. The six `rowsShape(...)` schemas now sit at module level (Spec 1 of round 0 is closed). `satisfies` is used where a declared type exists. The answers come from `safeParse(...).data`, `readAs` or `readOr`. The one `.parse` is `tiersShape.parse(held)` at `settings.ts:158`, which cannot fail (Standards 1).
- 2: holds. `readYamlMap` (`sources/yaml-file.ts:24-51`) tests the top through `readAs(mapShape, ...)`. The cast grep above shows only the two allowed lines.
- 3: holds. The lists and rows read through item schemas. The `local.ts` sentences and their order are unchanged; the differential and `local.test.ts` agree.
- 4: holds. `settings.ts`, `searchCap`, `programApps` and `paintLimit` read through schemas. `flattenText` stays a walk using `isMap`.
- 5: holds. `normalise.ts` is 769 lines, `validate.ts` 849, and the new `compact.ts` and `normalise-career.ts` sit in `snapshot/`, which holds 6 items.
- 6: holds. The item 6 grep prints `guards.ts:18` only. `yaml-file.ts` replaces the five `readFile` clones. In `allow-duplication.txt` five lines are removed and five are rewritten to the moved paths (diff read), and none is added.
- 7: holds. The remaining check lines are the ones "The other check lines" names (`shapeOf`, vocabulary comparisons, type tests, single-argument checks, bare `isMap` walks).
- 8: holds. `build-timing.test.ts` is tagged `@module-tag slow`, asserts results and not time, and times the three passes. I ran it by name (3 passed).
- 9: holds. The two changed answers named in the brief, and the three further maps of Z173, are ended. See Behaviour 1 for one changed answer the report does not list.
- 10: holds. `DESIGN.md:148` names `src/lib/data` in the opening scope sentence and in its own paragraph. No `typeof` appears in the first 15 lines of any changed file under `src/lib/data`.
- 11: holds. The two config tests moved into `tests/data/sources/config/`, which holds 9 items; `tests/data/sources` holds 9; the seven new files exist. The new cases sit in the module test files. `normalise.test.ts` is now 865 lines (above the brief's 850 mark, below the 900 limit); round-1 ruling 2 told the builder to put the case in the module's own file, so this follows the ruling.
- Verify 2 (per-file `grep -c "safeParse\|readAs("`): partial on the literal text. `feeds.ts`, `manifests.ts`, `career.ts`, `options.ts` and `compact.ts` print 0. The four reader files read through `readOr`, `optionalText` and `readYamlMap`, which call `safeParse` inside. Met in substance; the orchestrator ruled it accepted (round-1 ruling 3). `compact.ts` is a helper with no reader.

Cases:
- 1, 2, 3, 4, 4b, 5, 6, 7, 9, 10, 11, 12, 13: met. Each has its test in the files named by the first review; the 37 files of `tests/data` and `tests/checks/diagrams` pass, and the differentials above show no difference on these readers.
- 8: met. The changed cases of `merge.test.ts` fail on the base and pass after: the first review reproduced it, and my base-tree runs of the registries, collections and normalise files fail exactly the three ruling-2 cases.
- 14: met (`cmp` above).
- 15, 16: met (`npm test` and `npm run test:checks` pass; the only edited existing test lines are imports).

## Verdict per round-1 ruling

1. Six schemas at module level: closed. See the `rowsShape(` grep above. Each function reads through its const (`scanRules`, `collectionFiles`, `vocabKeys`, `collectionKeys`, `specs`, `panels` call `readOr(<const>, ...)`).
2. Three maps skip an own `__proto__` key: closed. The code is `collections.ts:49`, `registries.ts:82` and `normalise.ts:488`, each with `key !== '__proto__'` and a comment line. I ran the three new cases on the base: `registries.test.ts` "skips an own __proto__ key of the file when it builds the meta" fails, `collections.test.ts` the same name fails, and `normalise.test.ts` "skips the key when it builds the fields" fails (`expected { injected: 'yes' } to be Object.prototype`). All three pass on the worktree inside the 744. The fix reaches only those three loops and is not a removed check. A grep of the data folder for other maps built from outside keys finds only string-valued assignments (`scores[key] = text`, `icons[name] = ...`), where assigning to `__proto__` is a no-op, and `byId` keyed by an id value, which is not an outside map's key.
3. Literal gate accepted as built: closed. No padding call was added.
4. Standards: closed, each part checked.
   - `DESIGN.md:148` names `src/lib/data` in the opening sentence.
   - `validate-themes.ts:14` is `themeWordShape`, used at `:62`, and no other `wordShape` is in that file.
   - The `?? ['']` branch is gone.
   - `export { career }` is gone, and `career.test.ts:9` and `normalise.test.ts:14` import from `normalise-career.ts`.
   - `isBundleId` returns `bundleIdShape.safeParse(value).success`, and `BUNDLE_ID` is read only at `opens-in-program.ts:34`.
   - The `shapes.ts` head comment names `readOr`, `filledText`, `optionalText`, `keysOfShape`, `valuesOfShape`, `optionalItemsShape` and `textOrNumberOnlyShape`.
   - The `strip` to `written` rename: the builder's reason holds. `career()` already declares `const situation: {label, value}[] = []` at `normalise-career.ts:118`, so a second `situation` would not compile. `const written = readAs(mapShape, raw.situation)` followed by `for (const [label, held] of Object.entries(written))` reads acceptably. The file uses `section` for the eligibility map, which would also have worked, but I raise no finding.
5. Changed answers listed: not closed, narrowly. The report states ten with before and after, and my rerun reproduces all ten. One changed answer of the same rule is missing (Behaviour 1).

## 1. Spec

None.

## 2. Proof

None. The ruling-2 cases were seen failing on the unchanged tree, by the builder's quoted run and by my rerun. I did not find a test that asserts a known defect, a loosened threshold or a fitted revert. The `usageTiers` and `flattenText` tests assert the new answers.

## 3. Standards

1. `src/lib/data/shapes/shapes.ts:1-9` (head comment): "the whole-number and string-list schemas (`wholeShape`, `itemsShape`, `optionalItemsShape`)". `itemsShape` is `z.array(z.unknown())` at `:244`, a list of anything, not a string list. The comment also still says the helpers serve "the server and the state layer", although `src/lib/data` is now their largest reader. Failure scenario: a reader takes `itemsShape` for a string-list schema and uses it where items must be checked as texts. Fix: describe `itemsShape` as a list of anything, and name the data folder.
2. `src/lib/data/sources/config/settings.ts:152-158`: "const refused = Object.entries(held).find(([, value]) => !labelShape.safeParse(value).success); ... return tiersShape.parse(held);". The map is validated twice, and this is the only reader in `src/lib/data` that ends in a throwing `.parse`, where every other reader answers from `safeParse(...).data`, `readAs` or `readOr`. It cannot fail after the loop, so no answer is wrong. Failure scenario: a later edit that changes `tiersShape` but not the loop would make `.parse` throw a zod error whose text the brief says is never shown. Fix: take the answer from `readAs(tiersShape, held)` and keep the loop only to name the key.

## 4. Behaviour

1. `src/lib/data/sources/config/merge.ts:222-232` (`flattenText`): the round's report lists ten changed answers but not this one. Rerun on the unchanged tree and the worktree: `flattenText(JSON.parse('{"a":{"__proto__":"x","b":"y"}}'))` answered `{"a.__proto__":"x","a.b":"y"}` before and answers `{"a.b":"y"}` now. The same holds for a number leaf (`{"k":{"a":1,"__proto__":3}}` loses `k.__proto__`, found by `diff.mjs`). Item 9 says `flattenText` skips an own `__proto__` key "at every level", so the behaviour is as ruled, but ruling 5 asks for every changed answer with its before and after, and `merge.test.ts:53-58` asserts only the top-level text case, which was already `['b']` before. Failure scenario: a reader of the report's list sees a key `a.__proto__` leave the text catalog's dotted keys with no entry saying so. Fix: add the before and after to the list, and a case over a nested text leaf.

## Declined to judge

- The look on the TEST page: no view, style or markup file changed, so it belongs to the landing.
- Whether the `written` name is the best one available: I judge it acceptable and leave the choice to the orchestrator.
- The builder's claim that it started no agent and ran no git command this round: no command here can verify what it ran.
- `config/local.yml`: never opened, printed, grepped or hashed by me. `vite.config.ts` calls `loadLocal` at vitest start in every run, which is the app's own tooling, and I ran vitest with symlinks to the worktree's `config`.
- Timing ratios below about 20 percent: three rounds on a loaded machine (base `validate` ranged 10.4 to 17.6 ms) cannot resolve them. The ratios I measured are 0.89x, 0.92x and 0.76x.

Usage: Sonnet 5.5 (claude-sonnet-5-5)

Usage (from the completion notice): claude-sonnet-5-5, 204,734 tokens, 61 tool uses, 23.3 min.
