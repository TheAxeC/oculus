# M8 refuter report

Reviewer ab7cdbacbd59ae325, claude-opus-5-5, 252,447 tokens, 189 tool uses, 34.2 min.

## Verification lines (verbatim)

`sh /Users/axelfaes/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, run from `/Users/axelfaes/workspace/research-hub/.agents/worktrees/M8/tools/oculus` with node v24.21.0 on PATH (last of my runs):
```
ok      ASCII gate (1.3 s)
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.1 s)
ok      eslint (21.6 s)
ok      svelte-check (22.3 s): 1791449442579 COMPLETED 433 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (42.6 s): Duration  39.02s (transform 90.41s, setup 0ms, import 106.63s, tests 36.08s, environment 262ms)
test:quick: 44.1 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
exit 0
```
An earlier run of the same command printed `test:quick: 153 changed file(s), from git since HEAD`, `116 test file(s), 10 essential`, `test:quick: 35.9 s (limit 45.0 s); every command passed`. checks.sh takes one argument, so the state file's `-- --base <base>` cannot pass through it; `npm run test:quick -- --base d8f32d576` run separately: `153 changed file(s), from git since d8f32d576`, `test:quick: 40.6 s (limit 45.0 s); every command passed`, exit 0.

Tree checks, each with `npx vitest run <file>` (diagrams with `--testTimeout 0 --hookTimeout 0`, which `npm run test:checks` uses; under the default 5000 ms two of its tests time out): all 17 files of `tests/checks` pass; 244 tests, which matches the report.

Named test files, each `npx vitest run <file>`, all passed: `config-cache` 3/3 (G61), `diff-read` 3/3 (G62), `schema-rules` 7/7 (G56), `apps/manifest` 65/65, `catalog/options` 2/2, `relation-shapes` 8/8, `repo-settings` 3/3, `lsp/versions` 1/1, `lsp/lifetime` 25/25, `lsp/servers` 5/5, `lsp/cpp-file` 18/18, `snapshot/resources` 1/1, `snapshot/normalise` 1/1, `agents-catalog` 1/1, `sources/manifests` 1/1, `sources/registries` 1/1, `sources/collections` 1/1, `sources/career` 2/2, `cluster-folder` 7/7, `sources/personal` 2/2, `edit/writes` 5/5, `files/ops-paste` 5/5.

Other checks: `sh utils/folder-check.sh` exit 0; the largest source file is `relay.ts` at 860 lines (limit 880). `unused-exports` lists 248 entries against the base's 249 and adds none. The ASCII gate over src, tests, config, docs and the added hub lines finds nothing. `yaml.safe_load` over the 29 changed YAML files is ok. The rename greps find only `../cockpit/src/cockpit/page.py:706,708,709`. `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both, so no ADR folder exists. Case 8: `HOME=<scratch> python3 tools/data/redownload.py pmc-patients --dry-run` prints a `$ wget -q -c -O .../pmc-patients/PMC-Patients-V2.json https://huggingface.co/datasets/zhengyun21/PMC-Patients/resolve/main/PMC-Patients-V2.json` line; `ajile12` and `way-eeg-gal` print `x open, but no one-command recipe - fetch manually (see steps):` followed by source, steps and place. The base copy prints `! unknown retrieval.method 'direct' - skipping.` and `'script' - skipping.`

The builder's real-Relay harness (`<scratchpad>/e2e/page.ts`, an in-process Relay over the installed yaml-language-server 1.24.0) was rerun: `run4` (`files 221 governed 221 marked 0`), `run5`, `run7`, `run9`, `run11`, `run12`, `run13`, `run14`, `run15`, `run16`, `fin-probe23.ts`, `fin-probe24.ts`. Each reproduced the report's quoted output, except where this report says otherwise (case 32).

## Verdicts

Items of "What to build":
1. One schema vocabulary: holds. The renames are done and the greps are clean. The 87 missing help lines were added; a walk prints `fields 198 without help 0`. The `records` type also accepts one map (`schema/record.ts:125`, `type: ['array','object','null']`), which DATA-MAP:448 documents; the brief's wording was "a list of records".
2. New schemas: violated, in part (Spec 1). `config/schemas/`, `app.yml`, `commands`, `launch` and `.oculus/settings.yml` are done. The catalogs and the text files are not read through the whole-file zod reader.
3. Generator and matcher: holds. The defect in the radar's schema is under Behaviour 3.
4. yaml-language-server in the editor: holds as built. Two of its changes reach every server (Behaviour 2, Spec 3).
5. Validation through the schemas: holds. The G56 table has the six rows. The 23 checks are listed with replaced or kept. `fin-probe23` shows each replaced rule giving a finding with file and line.
6. The data: violated (Behaviour 1). The data lines the brief names are all made, and no value of a record is lost on disk, but the `data.yml` schema edits (`access` from text to a select fed by `vocab.data_access`, `retrieval` from raw to records) break the Data view's edit form for every dataset.
7. The documents: violated (Standards 1). `DESIGN.md:538` still names `validate.ts` as the place of the `program:` rename finding.

Cases (with the M8-cases ruling; Z717 deck ruling applied): 1 met (run15: 14 names, `venue_idd` marked). 2 met (run1, run11). 3 met (run1: 72 venue ids, 19 people keys, 94 manifest ids). 4 met (run1 hover). 5 met (run5 editor marks; fin-probe23 findings with line). 6 met (G14 8/8; run4 0 marked). 7 met (run16, run5; schema-rules). 8 met (rerun above). 9 met (greps; schema-rules; fin-probe23 `from: domains`/`vocab.*`). 10 met (integrity 8/8). 11 met (run16 snooze no mark; run5). 12 met (run7: 19 then 20, mark gone). 13 met (run7). 14 met (fin-probe23: only the statement finding). 15 met (run11: `utwente,this-mac,data`). 16 met by the reviewer's own probe; the builder's evidence is the matcher alone (Proof 1). 17 met (run9: `network hits []`; schemaStore and the Kubernetes CRD store disabled in `YAML_SETTINGS`). 18 met (run14: `local marks undefined alias marks undefined`, `leak false`). 19 met (run10). 20 met (G36 row in lifetime.test.ts, 25/25). 21 met (run12: `not_found`, `program: yaml-language-server`). 22 met (run13: no formatting provider; formatting request answers `[]`). 23 met (run4, fin-probe23). 24 met (fin-probe24; config-folder 21/21). 25 met (greps; `docs/apps.md:247`). 26 met (run15; fin-probe23 `status.chipz`). 27 met (schema-rules row 'a key that stands twice in the referenced file'). 28 met by reading: `lsp.ts:370` returns undefined unless `servedLanguage(language)`, and a plaintext tab's language is not served; not run. 29 met (run9: "Unable to load schema ... No content.", `secret anywhere false`). 30 met (run10). 31 met (run10; config-folder). 32 met by the reviewer's probe, partial in the builder's evidence (Proof 2). 33 met (run1). 34 met (run4; run11 `maps_to` 95). 35 met (run1, run10). 36 met (run7). 37 met (run11 `wallhaven-83`). 38 not verifiable: the Settings view was not rendered, and `keys.test.ts` 8/8 covers only the description keys. 39 met: `stats.ts` and `venues.ts` are unchanged (`git diff d8f32d576 --stat` on both is empty), and Graz reads `role: co-present` with `related: [abduction]`.

Guarded tests of M8-guarded.md: G61 met (`tests/server/root/config-cache.test.ts`, its three titles word for word at lines 48, 64, 73, 3/3). G62 met (`tests/views/sources/repositories/diff/diff-read.test.ts`, the describe 'the read key of a diff pane' and its three titles at lines 27, 33, 37, 3/3). The report's unchanged-tree run of these two files was not rerun.

## Spec

1. Item 2: the catalogs and text files are not read through their whole-file reader. Place: `src/lib/data/shapes/catalog-files.ts:1-9`, and the readers `catalogs.ts:52` (`vocabCatalog`), `catalog/options.ts:310` (`readCatalog`) and `merge.ts:244` (`flattenText`), unchanged in how they read. The brief: "each read through one whole-file zod reader, the one the catalog code then reads the file with (in place of the key-by-key reads of `vocabCatalog`, `readCatalog` and the text reader around `flattenText`)". `grep -rn "catalog-files" src` shows the shapes used only by `schemas/engine.ts`, `static.ts`/`run.ts` (`VOCAB_FILE_KEYS`), `standInShape` and the three latex row shapes; `vocabFileShape`, `glyphsFileShape`, `iconsFileShape`, `metaFileShape`, `nestingFileShape`, `agentsFileShape`, `optionsFileShape` and `textFileShape` are parsed by nothing at runtime. The head comment is false where it says "the findings over the file are the shape's issues". Failure scenario: the editor marks a catalog key the reader takes, or accepts one the reader drops, and nothing notices, because the editor's schema and the reader are two definitions. The report marks item 2 DONE.
2. Tests written outside guarded entries (spec.md:57). `tests/server/machine/lsp/versions.test.ts`, `tests/data/snapshot/relation-shapes.test.ts`, `tests/data/sources/config/repo-settings.test.ts` and the row 'tells every server its client can have workspace folders, which the YAML server needs to pull its settings' in `servers.test.ts` are named by no entry (`grep -n "relation-shapes\|repo-settings\|versions.test" guarded.md` prints nothing). The report lists them under "Judgment calls" and did not stop to ask.
3. `workspaceFolders: true` is set for every server in `initializeParams` (`servers.ts:625`) instead of on the YAML entry; a per-entry route exists (`clientTextDocument`, `servers.ts:150`). pyright, clangd, the TypeScript server and the Svelte server all receive a changed initialize request; only `servers.test.ts` asserts it. The relay already answers `workspace/workspaceFolders` (`held.ts:340`).

## Proof

1. Case 16 was proved with the matcher alone (`run1.ts` calling `schemaFor`), against the brief's "checked in the editor, through the server's own answer, never by running the matcher alone". The reviewer's probe (`<scratchpad>/e2e/review16.ts`) shows the server marking "Property zzbogus is not allowed." on all six files and completion on a project deck offering `deck, defaults, groups`.
2. Case 32's record half was not shown by `run11.ts`: it opens `.oculus/settings.yml` twice, and the second `didOpen` does not replace the text, so "case32 record fields" printed the 32 language names again. The reviewer's probe (`review32.ts`, one open) prints `record fields 7 [...]` and marks `tab_size: -3` and `final_newline: maybe`.
3. The timing: the report's `test:quick: 47.2 s (limit 45.0 s)`; the reviewer's runs printed 35.9 s, 40.6 s and 44.1 s. The step leaves test:quick at or near its 45.0 s limit from run to run.

## Standards

1. `DESIGN.md:538` still says the `program:` finding is "(`src/lib/data/snapshot/validate.ts`)"; `utils/migrations/rename-program-to-pillar.ts:17` imports `RENAMED_FIELDS` from `validate.ts` and fails with `SyntaxError: ... does not provide an export named 'RENAMED_FIELDS'`. spec.md:66's grep of a moved name was not run.
2. `adapters/yaml/machine-file.ts` writes its own `'engine'`, and `schema/set.ts` its own `'hub'` and `'engine'`, in place of `ENGINE_ROOT` and the hub root constant (`files.ts:255`); a rename of one silently stops the `local.yml` refusal matching.
3. `registries/career.yml:5-6`: the added comment is hard-wrapped mid-sentence; lines 1-4 are wrapped the same way.
4. `funding/funding.yml:16`: `link` help reads "A path in the hub to the scheme's folder.", but entries link to files (`:33` `CALL-REQUIREMENTS.md`, `:61` `OVERVIEW.md`).

## Behaviour

1. The Data view's edit form can no longer save a dataset, and once that is lifted it would delete the dataset's retrieval recipe. `vocab.data_access` is a map of colours (`vocab.yml:252`); `vocabWords` reads only lists, so the `access` select has no choices; `kindShape` has no `records`, so `retrieval` is drawn as a `text` box (`state/boards/collection.ts:609-628`, `views/shared/forms/EntryForm.svelte:192-245`). Probe `form-refuse.mjs`: worktree `"kind":"select","options":[]`, `datasets 54 edit form unchanged and saved: {"access":54}`; base `"kind":"text"`, `{"saves":54}`. Probe `form-save2.mjs`: `retrieval form kind: text`, `save sends retrieval = null`, `write changed: ["retrieval"]`, `retrieval after write: undefined`; base `retrieval form kind: raw`, untouched and not sent.
2. The version shift in `Held` (`held/held.ts:277-293`, `documents.ts:62`) applies to every server, and versions coming back are not shifted back; the page's `staleFile` (`ui/controls/editor/kit/lsp/transport/edits.ts:47-56`) refuses a `documentChanges` edit whose version differs from the page's own. A C++ tab closed and reopened within clangd's 60 s gets a rename or code action carrying clangd's version, refused as `lsp_edit_changed`. Not run live.
3. Dismissing a radar paper gives a finding: the new `schema:` block of `feeds/literature-radar.yml` does not declare `dismissed`, which `server/edit/feeds.ts:46` writes; `writtenFields` (`schema/hub.ts:31-40`) lists only `snooze` and `subtasks`. Probe `radar-dismiss.mjs`: `[["entries[0].dismissed",35,"key entries[0].dismissed is not declared by the schema of this file"]]`. G14 then fails on the real hub.
4. A hub `secrets/*.yml` opened in a tab reaches the YAML server: the refusal covers only the engine's `local.yml`; `library/rules.ts:41` treats the secrets folder as closed for library files. The other four servers already receive such a file; the YAML server makes no network fetch and reads only `<oculus>/node_modules`.

## Declined to judge

- Behaviour 2 not run live; a relay harness run with clangd over a small C file would settle it.
- Whether `workspaceFolders: true` changes what the other four servers do.
- Case 38 and every view-level look (sent to the look on TEST at landing).
- The editor cases through the worktree's own server on port 8797: the builder's in-process Relay harness was used instead.
- The report's run of G61 and G62 on the unchanged tree.
- No ADR folder exists.

Usage: ab7cdbacbd59ae325, claude-opus-5-5, 252,447 tokens, 189 tool uses, 34.2 min.
