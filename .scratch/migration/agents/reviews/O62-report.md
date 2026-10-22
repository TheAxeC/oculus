NOT done: Verify 3 does not hold. `npm run diagrams` changes eight files of `docs/diagrams/` (list below), so the brief's premise "the step removes no import, so `npm run diagrams` changes nothing there" is false. Two of the eight (`writes.dot`, `writes.svg`) change because of the step: they name `src/lib/data/shapes/catalog-files/vocab.ts` by line, and removing lines 286-289 moves `leads_fit: textMap.optional(` from line 300 to 296. The other changes in all eight name only source files the step does not change, so the committed diagrams at the base a2288789 are already behind their source. The eight regenerated files are left in the worktree, outside the write list; whether they land with O62 is the orchestrator's decision (see "Judgment calls"). Items 1 to 5 of "What to build" and cases C1 to C7 are done and hold.

## Open items of the state file (copied verbatim from `/Users/axelfaes/workspace/oculus/.scratch/migration/orchestrator-state.md`, "## Open items", at the time of writing)

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- Open item 226 (2026-10-22): O50, who the user is as the workspace setting `self`. O50's brief check found that oculus's rename of a key rewrites only the option sources its reference index knows (`OPTION_SOURCES`, `src/lib/data/sources/config/catalog/schemas/references.ts:26-33`: `domains`, `clusters` and four vocabulary words). Today renaming your own person key keeps you marked, since the mark is `self: true` on the entry; once O50 moves the mark to `settings.self`, a rename leaves the setting naming a key that no longer exists, so no person is marked and the check reports it. Carrying the rename is not in O50's line, so it is yours (ruling Brief check scope). (a) O50 adds `people` to `OPTION_SOURCES`, so a rename of a person key rewrites `settings.self` as it rewrites an option drawn from `domains`; one line and one path added. Pro: renaming your key keeps you marked, as today. Con: one more path in O50. (b) as O50's brief stands: the rename leaves `settings.self` stale and the check's finding tells you to fix it by hand. Pro: O50 stays on its paths. Con: a behaviour that works today stops working. Recommended: (a); (b) is the lazy option. O50 is prepared without it; on (a) it goes into O50's brief before its builder starts if the ruling comes first, otherwise into its repair round.

## Premise that did not reproduce

- Brief, "What is on the tree", last bullet: "`docs/diagrams/` draws folders and their imports; the step removes no import, so `npm run diagrams` changes nothing there." Disproved by `cp -R docs/diagrams <scratch>/diagrams-before`, then `npm run diagrams`, then `diff -rq <scratch>/diagrams-before docs/diagrams`, which prints (scratch prefix cut):

```
Files diagrams-before/layer-state.dot and docs/diagrams/layer-state.dot differ
Files diagrams-before/layer-state.svg and docs/diagrams/layer-state.svg differ
Files diagrams-before/layer-views.dot and docs/diagrams/layer-views.dot differ
Files diagrams-before/layer-views.svg and docs/diagrams/layer-views.svg differ
Files diagrams-before/layers.dot and docs/diagrams/layers.dot differ
Files diagrams-before/layers.svg and docs/diagrams/layers.svg differ
Files diagrams-before/writes.dot and docs/diagrams/writes.dot differ
Files diagrams-before/writes.svg and docs/diagrams/writes.svg differ
exit 1
```

  - The step's part: `writes.dot` draws each unchecked parse site by file and line. `diff <before>/writes.dot docs/diagrams/writes.dot | grep -i 'vocab\|catalog-files\|keys.test\|config-folder\|archive'` prints four lines, the node and the edge of `src/lib/data/shapes/catalog-files/vocab.ts:300 textMap.optional(` before and of `...vocab.ts:296 textMap.optional(` after; `sed -n '296p' src/lib/data/shapes/catalog-files/vocab.ts` prints `    leads_fit: textMap.optional().describe("The colour of a Position Lead's fit chip, by its fit."),`. `writes.svg` is the rendering of the same file.
  - Not the step's part: the other 34 changed lines of the four `.dot` files (38 in all, by `diff ... | grep '^[<>]' | grep -c .`) name files the step does not change: the tooltip of `lib/server/edit/writes.ts -> lib/server/edit/writes/subtasks.ts` gains `writeFollowup`; `src/lib/server/edit/writes/undo.ts:308` and `:495` become `:315` and `:502`; `layers.dot` counts move from 441 to 442 (state to data), 1313 to 1316 (views to state) and 1031 to 1036 (views to ui); `layer-state.dot` moves `state/boards` to layer data from 49 to 50. These come from source at the base that the committed diagrams do not match. The case 'are what the source gives now, each file byte for byte' (`tests/checks/diagrams/diagrams.test.ts:84`) would therefore fail on the base: not verified, since that file is not one Verify 1 names and was not run.

## The cases' first run (on the unchanged tree)

- C1. Command (the grep of the brief in a non-git form, see "Judgment calls"): `grep -rIn -i --exclude=local.yml --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.scratch --exclude-dir=.agents --exclude-dir=.svelte-kit 'archive_order\|archiveOrder\|archive order' .`

```
config/catalogs/vocab.yml:208:archive_order: [published, submitted, in-prep, abandoned, nogo, dropped, disproved, tech-report, software, finished, archived]
tests/checks/config/config-folder.test.ts:220:            'archive_order',
src/lib/data/shapes/catalog-files/vocab.ts:286:    archive_order: z
exit 0
```

  Three lines, the three the brief names.
- C2. `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/source/keys.test.ts --reporter=dot` (both files of Verify 1; the case is the first): `Test Files  2 passed (2)`, `Tests  39 passed | 2 skipped (41)`. Passes on the unchanged tree, as the brief check said it would (row and key present together).
- C3. Reading: `grep -n 'strictObject\|archive_order' src/lib/data/shapes/catalog-files/vocab.ts` prints `229:export const vocabFileShape = z.strictObject({` and `286:    archive_order: z`. On the unchanged tree the strict shape names the key, so a `vocab.yml` that sets it gives no finding.
- C4. Reading, same grep: the shape holds `archive_order` (line 286), and the editor's schema is made from that shape (`src/lib/data/sources/config/catalog/schemas/engine.ts:110`, `CATALOG_FILES.find((one) => one.file === file)?.shape`), so the schema offers the key.
- C5. `sed -n '200,210p' config/catalogs/vocab.yml`: `focus_lane_tones: { funding: gold, jobs: grey-d, teaching: teal }`, two blank lines, then `# The Archive's outcome categories, ...` and `archive_order: [...]`, then two blank lines. The `tiers:` comment is not in the range.
- C6 and C7. These read the case of item 4, so their first run is the case written and run with every other file at its base text: `npx vitest run tests/checks/source/keys.test.ts --reporter=verbose`:

```
 <multiplication sign> |unit| tests/checks/source/keys.test.ts > catalog file keys > has a reader for every top-level key of every catalog file 276ms
   <rightwards arrow> expected [ 'vocab.yml: archive_order' ] to deeply equal []
...
 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
```

  One key, `vocab.yml: archive_order`; no `venue_categories` line (C7). So item 5 finds no orphan beyond `archive_order`, and no case of the brief's rules was wrong; nothing was handed back.

## DONE / NOT DONE

| Item | State | Proof (command and the last line it printed after the last change) |
| --- | --- | --- |
| 1. `vocab.yml` lines 207-210 removed | DONE | `diff <base>/config/catalogs/vocab.yml config/catalogs/vocab.yml`: 4 lines removed, none added; C5 below |
| 2. `archive_order` removed from `vocabFileShape` | DONE | `grep -n 'archive_order\|vocabFileShape = z.strictObject' src/lib/data/shapes/catalog-files/vocab.ts` prints only `229:export const vocabFileShape = z.strictObject({` |
| 3. `EXPECTED` row removed | DONE | Verify 7 below: `220d219` / `<             'archive_order',` |
| 4. New case under G24 in `keys.test.ts`, head comment updated | DONE | `npx vitest run tests/checks/source/keys.test.ts --reporter=dot`: `Tests  10 passed (10)` |
| 5. Each orphan the case finds removed | DONE | C6 first run lists `vocab.yml: archive_order` alone; after items 1-3 the case passes |
| C1 | DONE | grep above, after the change: prints nothing, `exit 1` |
| C2 | DONE | `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/source/keys.test.ts --reporter=verbose`: `<check mark> ... holds exactly the expected top-level keys, and no more 438ms`, `Test Files  2 passed (2)`, `Tests  40 passed \| 2 skipped (42)` |
| C3 | DONE (reading) | `vocabFileShape` (`vocab.ts:229`) is a `z.strictObject` and no longer names the key; `config/text/findings.yml:135` reads `shape_unknown: 'key {0} is not a key this file takes'`, so a file that sets it gets "key archive_order is not a key this file takes" |
| C4 | DONE (reading) | the shape no longer holds the key, and the editor's schema is made from it (`engine.ts:110`) |
| C5 | DONE | `sed -n '200,210p' config/catalogs/vocab.yml`: line 205 `focus_lane_tones: ...`, lines 206-207 blank, line 208 `# The project tiers whose decisions are flags, ...` |
| C6 | DONE | before: `<rightwards arrow> expected [ 'vocab.yml: archive_order' ] to deeply equal []`; after items 1 and 2: `<check mark> ... catalog file keys > has a reader for every top-level key of every catalog file 578ms` |
| C7 | DONE | C6's failing run names no `venue_categories`; the case reads code through `codeOf` (`withoutComments` of `tests/checks/source/code.ts`), which turns every comment to spaces, so a key named only in a comment is not read |
| Verify 1 | DONE | only the two files ran while working (counts below) |
| Verify 2 | DONE | `npm run format`, then `npm run diagrams && npm run test:quick`, second run: `test:quick: 55.4 s (limit 45.0 s); every command passed` |
| Verify 3 | NOT DONE | `diff -rq <scratch>/diagrams-before docs/diagrams` prints the eight lines quoted under "Premise that did not reproduce", exit 1 |
| Verify 4 | DONE | the ASCII gate of `spec.md` over the four files prints nothing, `exit 0` |
| Verify 5 | DONE | the C1 grep after the change: nothing printed, `exit 1` |
| Verify 6 | DONE | `sh utils/unused-exports.sh > <scratch>/unused-after.txt` (exit 0), `diff <base>/unused-exports.txt <scratch>/unused-after.txt`: nothing printed, `diff exit 0` (342 lines both) |
| Verify 7 | DONE | `diff <base>/tests/checks/config/config-folder.test.ts tests/checks/config/config-folder.test.ts`: `220d219` / `<             'archive_order',` |
| Verify 8 | DONE | failing lines quoted below |

`test:quick` printed "over the time limit" (55.4 s against 45.0 s) on both runs; every command passed on the second.

### Failing lines on the unchanged tree (Verify 8)

- The changed test (the `EXPECTED` row, G12, G13): with the row of item 3 removed and items 1 and 2 not yet made, `npx vitest run tests/checks/config/config-folder.test.ts --reporter=verbose` printed:

```
 <multiplication sign> |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > holds exactly the expected top-level keys, and no more 219ms
 <multiplication sign> |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > reads each file on its own and finds its own keys there and nowhere else 128ms
   <rightwards arrow> expected [ 'archive_order', <horizontal ellipsis>(15) ] to deeply equal [ 'data_access', <horizontal ellipsis>(14) ]
AssertionError: expected [ Array(96) ] to deeply equal [ Array(95) ]
+   "archive_order",
      Tests  2 failed | 28 passed | 2 skipped (32)
```

  Both cases that read `EXPECTED` fail, naming `archive_order`. After items 1 and 2 both pass (C2 row).
- The new case (C6): `<rightwards arrow> expected [ 'vocab.yml: archive_order' ] to deeply equal []`, at `tests/checks/source/keys.test.ts:770:26` in that run.

### Runs

- The verify list (`npm run diagrams && npm run test:quick`) ran twice. The first run was red on eslint in `keys.test.ts`, a file the step changes: `766:29  error  Unsafe argument of type `any` assigned to a parameter of type `{}`  @typescript-eslint/no-unsafe-argument`. Fixed (the parse result is typed `as Record<string, unknown>`, as `SENTENCE_KEYS` types it at line 502), the file rerun alone (`npx eslint tests/checks/source/keys.test.ts`: exit 0; `npx vitest run tests/checks/source/keys.test.ts`: `Tests  10 passed (10)`), then the list once more, green.
- Verify 1 file runs: five (both files on the unchanged tree; `keys.test.ts` alone for C6; `config-folder.test.ts` alone for the changed row; both after items 1-3; `keys.test.ts` alone after the eslint fix).
- No whole-suite command ran (`npm test`, `npm run test:checks`, `npm run test:landing`, `npx vitest run` with no file).
- `npm run format` ran twice, once before each run of the list. Each time it rewrote two files outside the write list (see "Things in the brief or the tree that turned out wrong"); both are back at their base bytes, so the second run of the list ran with them in prettier's form and the final tree holds them as at the base.

## Files changed (`diff -rq` against the base copy over `src tests utils config`, `docs/diagrams` against the scratch copy made before `npm run diagrams`)

| File | Lines | In the write list |
| --- | --- | --- |
| `config/catalogs/vocab.yml` | -4 +0 (268 to 264) | yes, lines 207-210 |
| `src/lib/data/shapes/catalog-files/vocab.ts` | -4 +0 (321 to 317) | yes, lines 286-289 |
| `tests/checks/config/config-folder.test.ts` | -1 +0 (810 to 809) | yes, line 220 |
| `tests/checks/source/keys.test.ts` | -1 +60 (713 to 772) | yes |
| `docs/diagrams/writes.dot` | -10 +10 | no: regenerated by `npm run diagrams`; 4 lines are the step's (`vocab.ts:300` to `:296`), the rest base drift |
| `docs/diagrams/writes.svg` | -17 +17 | no: rendering of `writes.dot` |
| `docs/diagrams/layers.dot` / `.svg` | -3 +3 each | no: base drift only |
| `docs/diagrams/layer-state.dot` / `.svg` | -1 +1 each | no: base drift only |
| `docs/diagrams/layer-views.dot` / `.svg` | -5 +5 each | no: base drift only |
| `.scratch/migration/agents/reviews/O62-report.md` | new | yes |

`keys.test.ts` stays under 880 lines (772).

## Head comments, doc comments and document paragraphs

- `config/catalogs/vocab.yml` lines 1-4: still true (it names no outcome category and no Archive order).
- `src/lib/data/shapes/catalog-files/vocab.ts` lines 1-4: still true.
- `src/lib/data/shapes/catalog-files.ts` lines 1-12: still true (a shape is strict; the key is now refused like any other unknown key).
- `tests/checks/source/keys.test.ts` lines 1-10: rewritten. It now says the gate covers every top-level key of a file under `config/catalogs/`, the two ways a key is read, that the shapes are left out, and the limit of a check by name for a key whose name is a common word.
- `spec.md`, The principles every package is judged on: "every catalog key has a reader in the tree (a test fails on an orphan key)": made true for the top-level keys of `config/catalogs/*.yml` by the new case.
- The doc comment of `VOCAB_FILE_KEYS` ("The top-level keys of vocab.yml.", `vocab.ts:316`) and of `vocabFileShape` (`vocab.ts:228`): still true.

## Grep after the change of a name (`spec.md`)

- The removed key: the C1 grep above prints nothing (exit 1) over `src`, `tests`, `config`, `docs`, `README.md` and the rest of the worktree outside `.scratch`, `.agents`, `node_modules`, `.svelte-kit`, `.git` and `local.yml`.
- The new helper names before use, `grep -rn 'SHAPES_DIR\|keyReaderCode\|schemaText\|RegExp.escape' src tests` (outside `keys.test.ts`): `schemaText` is an export of `src/lib/data/snapshot/schema/json.ts:28` with another meaning, so the local helper is named `schemaFilesText` (`grep -rn 'schemaFilesText' src tests`: exit 1 before it was written). `SHAPES_DIR`, `keyReaderCode` and `RegExp.escape` had no hit. The case reuses `codeOf`, `treeFiles`, `SRC`, `engineDir`, `CATALOGS`, `SCHEMAS`, `parse`, `readFileSync` and `readdirSync`, all already in the file; no import is added.
- History words in the added lines: `diff <base>/tests/checks/source/keys.test.ts tests/checks/source/keys.test.ts | grep '^>' | grep -i -n "before\|used to\|no longer\|still\|always has been\|always had\|as before\|previously\|the step adds\|after this package\|O[0-9][0-9]\|20[0-9][0-9]-"`: nothing printed, exit 1. The other three files have no added line.

## Judgment calls the brief left open (each reversible)

1. The source files the case reads: modules and components under `src` named `.ts`, `.svelte`, `.js`, `.mjs` or `.cjs`, outside `lib/data/shapes/catalog-files/`. The brief says "a source file under `src/`"; the stylesheets, `app.html`, the one `.svg` and the one `.json` are left out, since a CSS class `.types` or `.tiers` would count as a reader by the `.<key>` pattern without reading a key. `src/lib/data/shapes/catalog-files.ts` (beside the folder, not in it) is read like any module.
2. "Outside a comment line": the case reads each file through `codeOf` (`withoutComments` of `tests/checks/source/code.ts`), which turns every comment to spaces, a trailing comment on a code line included. That is stricter than "a comment line", and it is the parse the other cases of the file already use.
3. Comment lines of the schema files and of `docs/templates.md` (a line whose first character other than a space is `#`) are left out, so a commented-out `from: vocab.<key>` does not count as a draw. Markdown headings of `templates.md` fall under the same rule and hold no `from:`.
4. The key is put in the patterns through `RegExp.escape` (Node 24, typed in TypeScript's `es2025.regexp` lib that `esnext` includes), so a key with a regex character is matched as written.
5. The case reads `config/catalogs/` with a non-recursive `readdirSync`; the folder holds eight `.yml` files and no subfolder (`ls config/catalogs`). A file put in a subfolder later would not be read.
6. The failure lists `<file>: <key>` with the file's name alone (`vocab.yml: archive_order`), as C6 states it.
7. The eight regenerated diagram files are left in the worktree. `spec.md` (Token discipline) has `npm run diagrams` run before each run of the list "so the committed diagrams match the source the list checks", and `writes.dot` and `writes.svg` must change with the step, or the case at `diagrams.test.ts:84` fails on the step's own line shift. The six other changes are base drift the same command fixes. Reverse by copying the base's `docs/diagrams` back, in which case `writes.dot` and `writes.svg` still need the regeneration at landing.
8. The C1 grep, quoted by the brief as `git grep`, was run as the `grep -rIn` above, since `spec.md` (Where you work) bars a builder from git commands; it covers the same folders plus untracked files. The dispatch allowed `git status`; `git status --short` was run to see whether `npm run format` touched a path outside the base copy's folders, and `git status` with `git log --oneline -1` once at the start to confirm the base.

## Host- or user-visible changes, before and after

- A `config/catalogs/vocab.yml` that sets `archive_order`: before, no finding; after, "key archive_order is not a key this file takes" (`config/text/findings.yml:135`). Checked by reading (C3).
- A hub's `.oculus/config.yml` that sets `archive_order`: "key archive_order is not one the hub's settings file takes; it is not applied" (`config/text/findings.yml:120`) before and after, unchanged by the step. Not run; from the brief and its check.
- The editor's schema for `vocab.yml` no longer offers `archive_order` (C4). The look on landing: open `config/catalogs/vocab.yml` in the editor on TEST and ask for completion at a new top-level key; `archive_order` is not among the keys offered, and typing `archive_order: []` gives the unknown-key finding above.
- No board, the Archive or the audit changes: no code read the key.

## Things in the brief or the tree that turned out wrong

- The diagram premise, above.
- `npm run format` (`prettier --write .`) rewrites two files at the base that are not in prettier's style, both outside the step: `src/lib/server/content/wallpaper.ts` lines 69-71 (a ternary prettier puts on one line) and `src/lib/views/shared/forms/entry/edit/EntryForm.svelte` lines 60-65 (a `<Field ...>` prettier puts on one line). Both are left at their base bytes (`diff -rq` against the base copy lists neither). The landing list's format check over the whole tree would report them on main: not verified, since the step does not run that list.
- The brief lists `meta.yml` among the catalog files as "removed by O58"; at the base it is present (`ls config/catalogs`), and the case reads it with the others (its key `meta` is read, the run is green).

## Limitations and sharp edges

- A key whose name is a common word (`meta`, `types`, `tiers`, `patterns`, `icons`, `glyphs`, `agents`) is counted as read by any property or quoted string of that name, so the case cannot see such a key go unread. The head comment says so. This is the limit of a check by name that Decision 2 states.
- A key read only by a hub's own schema that is not copied from `docs/templates.md` is invisible to the case, since the hub is not in the tree; such a key would be reported as an orphan.
- The case reads 1908 source files (`find src` over the five extensions, the shapes folder left out) through `codeOf`; the parse is shared with the other cases of the file through its cache, and the case took 578 ms in the green run.
