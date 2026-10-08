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

## Repair round 1, refuted

Reviewer of M8 over repair round 1, on `.agents/worktrees/M8`, base d8f32d576. The step is the uncommitted tree: 163 paths in `git status --short`. Nothing was changed in the worktree, on main or in the ledger, with one exception: the verify list's first command, `npm run diagrams`, rewrites the 18 files of `docs/diagrams/` in place. Two runs of it gave identical `shasum` output ("diagrams identical across two runs"), and the changed-path count stayed 163. The probes ran from the session scratchpad, against a copy of the hub's YAML (`rv8radar`, `rv8hub`) and a scratch copy of `tools/oculus` (`rv8tree`, `local.yml` excluded).

**Summary.** 13 of the 14 rulings are closed. Ruling 1 is closed for every file except `agents.yml`. Ruling 7 is closed, but its fix on the page side reaches every language server, beyond the ruling. Every verification command is green. There are 9 findings: 2 Spec, 1 Proof, 4 Standards, 3 Behaviour (the second Behaviour finding is the first Spec finding seen from the user's side).

```
$ npm run diagrams                        (tools/oculus, node v24.21.0)
exit 0; run twice, shasum of docs/diagrams/* identical between the two runs

$ sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (1.8 s)
ok      eslint (1.6 s)
ok      svelte-check (5.3 s): ... COMPLETED 433 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (23.4 s): Duration  20.05s
test:quick: 24.0 s (limit 45.0 s); every command passed
checks: 1 commands passed
exit 0

$ npm run test:quick -- --base d8f32d576
test:quick: 168 changed file(s), from git since d8f32d576
test:quick: 118 test file(s), 10 essential
test:quick: 23.2 s (limit 45.0 s); every command passed
exit 0

npx vitest run <file>, one file per command, each "Test Files 1 passed (1)":
config-folder 25 | catalog/options 3 | lsp/servers 4 | lsp/versions 2 | snapshot/relation-shapes 8
source/keys 8 | config/integrity 8 (G14) | config/config 31 | lsp/lifetime 25 | lsp/relay 5
lsp/library 36 | snapshot/schema-rules 7 (G56) | apps/methods 47 | sources/present 4 | docs/deck 3
explorer/opening-apps 10 | lsp/cpp-file 18 | tree/boundaries 11 | root/config-cache 3 (G61)
diff/diff-read 3 (G62) | agents-catalog 1 | apps/manifest 65
Other tests/checks files, each alone with --testTimeout 0 --hookTimeout 0, all passed:
arrangements 12, diagrams 46, augments 9, cycles 7, order 13, contrast 23, comment-width 2,
history 3, html-sites 19, duplication 18, size 10. (claude-usage is tagged slow, not run.)
The 16 files run hold 245 tests; the report's 248 includes the slow file.

sh utils/folder-check.sh                      -> exit 0
sh utils/unused-exports.sh                    -> Unused exports (248); diff against the base's 249
                                                  removes lines only (validate.ts RENAMED_FIELDS,
                                                  schemaKeys; agents.ts AGENTS, AGENT_FLAGS;
                                                  manifests.ts SIDE_TIER), adds none
wc -l of the changed sources                  -> largest relay.ts 864, collection.ts 829; largest
                                                  component Lanes.svelte 386
ASCII gate (spec.md form) over src tests config -> prints nothing
added hub lines | LC_ALL=C grep '[^ -~]'      -> prints nothing
yaml.safe_load over the 29 changed .yml       -> ok 29
verify item 6 greps                           -> only ../cockpit/src/cockpit/page.py:706,708,709;
                                                  description: 0; values: 0; REFERENCES none
HOME=<scratch> redownload.py pmc-patients --dry-run -> "$ wget -q -c -O .../PMC-Patients-V2.json
                                                  https://huggingface.co/.../PMC-Patients-V2.json"
                    ajile12 --dry-run          -> "x open, but no one-command recipe - fetch manually"

Commands the round 1 section quotes, rerun in the same form:
node -e "import('./utils/migrations/rename-program-to-pillar.ts')..."   -> loaded (tree unchanged, 163)
r1/form-refuse.mjs <oculus> <worktree>   -> access field ... "kind":"select","options":["open",
    "registration","credentialed","private"] ... ; datasets 54 edit form unchanged and saved: {"saves":54}
r1/form-save2.mjs (scratch hub)          -> retrieval form kind: raw; save sends retrieval =
    "(raw untouched: not sent)"; write with size changed: changed ["size"] refused [];
    retrieval kept after the save: true
r1/radar-dismiss.mjs (scratch copy of the hub's YAML) -> as on disk: 0 []; one entry dismissed: 0 []
    (my own control on the same copy, dismissed plus `dismissedz: true`:
    [["entries[0].dismissedz",37,"key entries[0].dismissedz is not declared by the schema of this file"]])
r1/item8.mjs -> [{"file":"/hub/registries/venues.yml","key":"","message":"the schema venues cannot be
    compiled, so this file is not checked against it"}]; no schema for the file: []
r1/zprobe-init.test.ts (in the scratch copy) -> python {"configuration":true,"keys":[...3]};
    yaml {"configuration":true,"workspaceFolders":true,...}; c {...}; svelte {...};
    and a fifth line the report's quote leaves out: typescript {"keys":[]}
    (the probe opens the TypeScript tab on the channel 'lsp:ts' and starts no TypeScript server)
r1/zprobe-priv.test.ts (in the scratch copy) -> hub/secrets/a.yml: servers started 0, didOpen 0;
    hub/notes/b.yml: servers started 1, didOpen 1; state/c.yml: servers started 0, didOpen 0
e2e/case16.ts -> all six files mark "Property zzbogus is not allowed."; completion at the top level:
    side project 6 [title,object,status,eli5,next,links], deck 4 [deck,defaults,groups,order],
    config/present.yml 1 [defaults], text present.yml 2 [text,object]
e2e/case32.ts -> record fields 7 [tab_size,...,trim_trailing_whitespace,final_newline];
    marks [[3,"Value is below the minimum of 1."],[4,"Incorrect type. Expected \"boolean\"."]]
After the runs: pgrep for yaml-language-server, vitest and my probes prints nothing.
```

### Verdicts on the 14 rulings

1. **Spec 1 (catalog and text files read through their whole-file shapes): not closed in full.**
   - What is done: `loadConfig` (`merge.ts:202-208`) runs `shapeIssues` over every catalog and `text/**` file. Five catalog sentences word the issues (`findings.yml:79-83`), never zod's message. The new rows pass: config-folder 25, options 3. The shipped folder gives no finding.
   - What is not: `agents.yml` is registered with `owned: () => true` (`catalog-files.ts:307`), so its shape never yields a finding, and its reader does not word every issue the shape refuses. See Spec R1-1.
2. **Spec 2, as amended by open item 8 (a): closed.**
   - `versions.test.ts` (G63) and `relation-shapes.test.ts` (G64) are in the tree; `repo-settings.test.ts` is absent (`ls` prints "No such file or directory").
   - `grep -n "workspace folders\|workspaceFolders"` over `servers.test.ts` prints nothing.
   - The full text of both removed tests is under "Tests not landed".
3. **Spec 3 (`workspaceFolders` on the YAML entry alone): closed.**
   - `ServerEntry.clientWorkspace` (`servers.ts:152`) is set on the YAML entry only (`:558`).
   - The only change to `initializeParams` since the base is `...entry.clientWorkspace`.
   - The rerun probe shows `workspaceFolders` for yaml only, and pyright as before.
4. **Behaviour 2 (versions mapped back to the page's): closed.**
   - `Held.pageVersions` (`held.ts:305-317`) is applied to answers, to `workspace/applyEdit` and to diagnostics (`relay.ts:708`, `:741`, `:797`).
   - `versions.test.ts` row 2 asserts version 1 reaches the page both in the rename answer and in the applyEdit request; it passes (2/2).
5. **Behaviour 1 (the Data view's edit form): closed.**
   - `vocabOptions` and `vocabChoices` read a map's keys through `vocabKeys`.
   - `records` maps to `raw` (`collection.ts:616`).
   - `EntryForm.svelte:229-233` skips an untouched raw field of an edit form.
   - Both probes reproduce.
6. **Behaviour 3 (the radar's `dismissed`): closed.**
   - `literature-radar.yml:28` declares it.
   - The probe gives 0 findings, and my control shows the same copy still finds an undeclared key.
   - G14: 8/8.
7. **Behaviour 4 (`secrets` and `~/.oculus` kept from the YAML server): closed for the YAML server.**
   - One definition, `privateFolders`, is read by `withheldFolders` and by the YAML entry's `refuses`.
   - The relay probe reproduces.
   - On the page side the fix reaches every language server, beyond the ruling. See Spec R1-2.
8. **A schema ajv cannot compile is a finding: closed.**
   - `check.ts:384-393` and `findings.schema.not_compiled`; the item8 probe reproduces.
9. **Standards 1: closed.**
   - `DESIGN.md:538` names `schema/check.ts` and `hub-names.ts`.
   - The migration loads; the `RENAMED_FIELDS` grep matches the report.
10. **Standards 2 (one definition of the two root keys): closed.**
   - `HUB_ROOT` and `ENGINE_ROOT` are defined once, in `data/helpers/hub-names.ts:10,19`.
   - `files.ts` and `place.ts` import and re-export them; `machine-file.ts` and `set.ts` import them.
11. **Standards 3: closed.** `career.yml` lines 1-3 are one line per paragraph.
12. **Standards 4: closed.** `funding.yml:16` reads "A path in the hub to the scheme's folder or to a file of it."
13. **Proof 1 and 2: closed.** Case 16 and case 32 both reproduce through the relay and the YAML server.
14. **Proof 3: closed.** No change was asked for; my runs took 24.0 s and 23.2 s against the limit of 45.0 s.

### Verdicts for the whole diff since the base

Items of "What to build":

1. **Holds.** The rename greps are clean (verify item 6). The count of help lines was taken by the first review and not rerun here.
2. **Violated in part** (Spec R1-1): `agents.yml`'s shape issues are suppressed. `config/schemas/`, `app.yml`, commands, launch and settings hold (first review).
3. **Holds.** Generator and matcher: case16 and case32 runs; integrity 8/8.
4. **Holds as the item words it.** The page-side refusal reaches every server (Spec R1-2, Behaviour R1-1).
5. **Holds.** schema-rules 7/7 (G56), integrity 8/8, item8 probe.
6. **Holds.** The form probes, the radar probe and case 8.
7. **Violated in part** (Standards R1-1): `docs/configuration.md:32` is false for `agents.yml`. The lead sentence of `docs/files-and-search.md:85` is false for files under `secrets` and `~/.oculus` (Spec R1-2).

Cases:

- **Met by my reruns:**
  - 8: dry-run rerun.
  - 9: greps, and schema-rules.
  - 10: integrity 8/8.
  - 16: case16 rerun.
  - 18: the relay and page refusal read; first review run14.
  - 20: lifetime 25/25.
  - 24: config-folder 25/25.
  - 27: schema-rules.
  - 31: config-folder; the shipped folder has no finding.
  - 32: case32 rerun.
- **Met by the first review's runs; not rerun here:**
  - 1 to 7: run15, run1, run11, run5, fin-probe23, run4, run16. Case 7's schema-rules row was rerun here.
  - 11 to 15: run16, run7 and fin-probe23 (case 15 by run11).
  - 17, 19 and 21 to 23: run9, run10, run12, run13, fin-probe23.
  - 25, 26, 29 and 30: greps and `docs/apps.md:247`; run15; run9; run10.
  - 33 to 37: run1, run4, run11, run1, run7, run11.
  - 39: `stats.ts` and `venues.ts` are unchanged.
- **Met by reading:** 28, `lsp.ts:370` (not run).
- **Not verifiable:** 38. The Settings view is not rendered here; the look on TEST settles it.

### Findings

**Spec**

- **R1-1. `agents.yml`'s shape issues give no finding** (`src/lib/data/shapes/catalog-files.ts:303-308`):
  ```
  name: 'catalogs/agents', file: 'catalogs/agents.yml', shape: agentsFileShape, owned: () => true
  ```
  - What is wrong: ruling 1 says each issue of the shape is a finding. With every key "owned", `shapeIssues` drops all of `agents.yml`'s issues, and `parseAgents` does not word all of them. A list label is read with `stringIn(body, 'label') ?? key` (`agents.ts:195`), and a value's `pass` with `String(passNode.value)` (`agents.ts:225`), both silently.
  - Probe `rv8-agents.mjs`, the real `agents.yml` with `label: Model` changed to `label: 3`:
    ```
    shape issues (before owned): [["invalid_type","agents.claude.lists.model.label"]]
    shapeIssues after owned: []
    loadConfig findings: []
    parseAgents findings: [] label read: model
    ```
  - Failure scenario: the editor marks `label: 3` (its schema is this shape), no finding appears anywhere, and the composer shows "model". The editor and the reader still disagree unseen for this file, which is what Spec 1 was raised for.
  - Verdict: item 2 violated in part; ruling 1 not closed in full.
- **R1-2. The page withholds a file under `secrets` or `~/.oculus` from every language server** (`src/lib/views/sources/source/language/lsp.ts:125-127`, `:372`, `:415`):
  ```
  function isMachineFile(client: ClientState, file: { root: string; path: string }): boolean {
      return isWithheldFile(file, client.fs.roots(), client.fs.workspaces().home);
  }
  ...
  if (isMachineFile(input.client, file)) return undefined;
  ```
  - What is wrong: ruling 7 asked for the YAML entry's `refuses`, on the relay and on the page. On the page the check runs for every served language, behind `servedLanguage(language)` only. pyright, clangd, the TypeScript server and the Svelte server no longer get a file under the hub's `secrets` or under a `~/.oculus` root. The relay refuses such a file for the YAML entry only.
  - So the two sides disagree, and the comment at `:124` ("which the relay refuses as well") holds only for YAML.
  - The proposed G3 text ("no file under the hub's `secrets` folder or `~/.oculus` is given to a language server") states the wider rule. Its two new Code units (`machine-file.ts`, `private-folders.ts`) get no test row.
  - Failure scenario: a `secrets/sync.py` or `~/.oculus/*.ts` opened in a source tab has no hover, completion or diagnostics, and nothing says why. A page that did send it would be served by pyright, since the relay does not refuse it.
  - Verdict: a fix beyond the finding. Item 4 holds as worded.

**Proof**

- **R1-3. G63 and G64: unchanged-tree failures that are not the rule's own failure** (`tests/data/snapshot/relation-shapes.test.ts:62`, `tests/server/machine/lsp/versions.test.ts:40`).
  - What is wrong:
    - The G64 failure the report quotes on the unchanged tree is `TypeError: buildPortfolioWithSchemas is not a function`, a missing export rather than the rule failing.
    - The base already gave shape findings for these fields (`M8-base/.../validate.ts:141-157`, `findings.shape.is_null`), so the change is the sentence. No failure is quoted in the form the test has after the change.
    - G63 row 1's quoted failure, "Cannot read properties of undefined (reading 'messages')", is the base having no YAML server. Row 2 does fail on the rule ("expected 1 to be greater than 1").
  - Failure scenario: a reader of the landing report cannot tell from the quoted lines whether G64 guards a behaviour the base lacked.
  - Verdict: none.

**Standards**

- **R1-4. Two sentences claim every shape issue becomes a finding**: `catalog-files.ts:4` ("loadConfig parses each file's content with it, so every issue of the shape is a finding on the config channel") and `docs/configuration.md:32` ("a key the file does not take, a value of the wrong kind and a word outside the ones a key takes are each a finding that names the file and the key").
  - What is wrong: both are false for `agents.yml` (R1-1). This breaks spec.md's rule in "What every package obeys" that a sentence the change makes false is a defect.
  - Failure scenario: a maintainer trusts the editor's mark to have a matching finding.
  - Verdict: item 7 violated in part.
- **R1-5. A head comment made false by a move** (`src/lib/data/sources/config/catalog/agents.ts:8`): "The flags each agent may be given are held here".
  - What is wrong: `AGENT_FLAGS` and `AGENTS` moved to `src/lib/data/shapes/catalog-words.ts`, and the comment was not reread (spec.md's rule after a moved name).
  - Failure scenario: a maintainer adding a CLI flag edits `agents.ts` and finds no table there.
- **R1-6. A comment worded against an earlier state** (`src/lib/data/shapes/shape-issues.ts:5`): "A reader keeps what it kept before the shape found the issue".
  - What is wrong: spec.md lists "before" among the words to judge. This sentence compares with an earlier state, where "a reader keeps what it reads whatever the shape finds" says the same thing.
  - The round 1 section quotes no history-word grep over the comments it added. spec.md asks for that grep, with each hit judged.
- **R1-7. G64's Doc text names a title the file does not hold.**
  - The Doc text names 'gives one finding for %s'. The file's title is `it.each(ROWS)('gives one finding for $row', ...)` (`relation-shapes.test.ts:62`).
  - Failure scenario: a grep for the entry's title in the tree finds nothing.
  - Fix at landing: the orchestrator writes `$row` when it adds G64.

**Behaviour**

- **R1-8. Unstated: no language server for a non-YAML file under `secrets` or a `~/.oculus` root.**
  - This is the same change as R1-2, seen from the user's side. Report row 7 names `lsp.ts:126` and states no before and after.
  - Failure scenario: as R1-2.
- **R1-9. Unstated: the project edit form's Focus lane select now offers `holding`.**
  - From the whole diff: `config/schemas/manifest-schema.yml:41` has `options: [holding], from: vocab.focus_lanes`, and `choicesFor` (`state/forms/schema.ts:238-241`) now joins `options` and the source.
  - Probe `rv8-focus.mjs`:
    ```
    base choices ["run","push","revise","review","blocked","backburner","scope","derisk","build"]
    worktree choices ["holding","run","push","revise","review","blocked","backburner","scope","derisk","build"]
    ```
  - The report states no before and after.
  - `docs/DATA-MAP.md:345` allows `holding` on three tiers only. Whether picking it on another tier gives a finding after the save is not verified.
- **R1-10. Unstated: the Data view's edit form for a dataset.**
  - `access` is now a select of four (on the base it was a text box), and `retrieval` is a raw block that is not sent untouched.
  - The report quotes only the after state, and has no before-and-after section for the look as spec.md asks. Its headings, listed with `grep -n "^#\+ "`, hold none.
  - Failure scenario: the look on TEST has nothing to read the Data view's form against.

### The two choices

**(a) The whole-file shapes are parsed once in `loadConfig` (`merge.ts:202-208`) instead of in each reader.**

My judgment: justified.

- Ruling 1's own text names the readers, but its outcome is met by one parse: each issue a finding on the config channel, worded from the catalog, naming the file and the key, with what a reader keeps unchanged.
- The readers (`vocabCatalog(config)`, `readCatalog(config)`, the glyph and icon readers) take the merged map, where one file's keys sit beside another's (`vocab.yml` with `appearance.yml`). A strict per-file shape, the unknown-key rule included, can only be applied where one file's own content exists, and that is the merge.
- A parse per reader call would raise the same finding once per call, from readers called many times.
- The cost is one parse per configuration change, under `configCache` (G61). Measured with `rv8-loadtime.mjs`, median of 15 runs:
  - base: 68.9 ms and 68.0 ms;
  - worktree: 73.5 ms and 71.5 ms.
- The lazy option would have been to leave the shapes unparsed, as the first build did. This is not that.
- The cost of the choice: the readers keep a key-by-key reading, a second definition beside the shape, as ruling 1 allowed. The `owned` lists are where that second definition can hide an issue, and for `agents.yml` it does (R1-1).

**(b) Three entries added to the client row of `tests/checks/tree/boundaries.test.ts`.**

My judgment: each entry is justified by the layer rules; none exempts a breach.

- The rule the test enforces for the client is that it imports only listed, pure layer-1 modules and nothing under `lib/server/`. The row already holds such shared modules (`data/helpers/files/paths`, `address`, `apps`).
- Each new module is pure and imports no node module:
  - `data/helpers/hub-names` imports model types only. The client needs `HUB_ROOT` and `ENGINE_ROOT` (`place.ts`, `config-files.ts`), which ruling 10 asked to be one definition.
  - `data/helpers/files/private-folders` imports `./paths.ts`. The page's `isWithheldFile` needs it, as ruling 7 asked.
  - `data/shapes/vocab-keys` imports zod and `shapes.ts`. `collection.ts` and `schema.ts` need it, as ruling 5 asked.
- The comment at `boundaries.test.ts:114-119` gives each entry its reason.
- `hub-names` also carries server-side facts (`REGISTRY_SHAPES`, `RENAMED_FIELDS`) that the client does not read. They are pure, so the rule is not broken.

### Declined to judge

- **The cost of `pageVersions`** on large server answers (semantic tokens, completion lists). It rebuilds every answer of every server once before `toPage`. Not measured; a timing of a large semantic-tokens answer through the relay would settle it.
- **Full `npm run lint` and `npm run check`** (the report gives exit 0 and 3466 files) were not rerun. `test:quick` ran eslint and svelte-check over the changed files and passed.
- **`tests/checks/utils/claude-usage.test.ts`** is tagged slow and was not run.
- **Whether `holding` on a non-allowed tier gives a finding after a save** (R1-9). A save through `writeEntry` on a scratch archive manifest would settle it.
- **Case 38, and every view-level look**: the Data view's form, the Settings listing, the Focus select and the source-tab behaviour under `secrets`. These go to the look on TEST at landing.
- **No ADR folder exists**: `ls tools/oculus/docs/adr` gives "No such file or directory", in the worktree and on main.

Reviewer usage: agent id not known to me, claude-opus-5-5; tokens, tool uses and time come from the completion notice.

## Closed

The findings of the run over repair round 1, each closed at landing in `.agents/worktrees/gate` and carried to main.

- R1-1: `catalogs/agents` is registered with `owned: agentsWords` (`src/lib/data/shapes/catalog-files.ts:290-293`, `:316`), which leaves to the shape an agent's and a picker's `label` and a value's `pass`, the keys `parseAgents` reads as they are; every other key is worded by `parseAgents`. A probe over an `agents.yml` with a number as `agents.claude.label`, `agents.claude.lists.model.label` and `values.0.pass` gives three shape issues, one per key.
- R1-2 and R1-8: the page withholds a file under `secrets` or `~/.oculus` from the YAML language server only: `isMachineFile(client, language, file)` in `src/lib/views/sources/source/language/lsp.ts` returns `language === 'yaml' && isWithheldFile(...)`, both call sites pass the language, and its comment names the YAML server. Before and after, in the booking: such a file opened as Python or TypeScript gets its language server again, as on the base; opened as YAML it gets none.
- R1-3: no code change. G63's second row fails on the base on the rule ("expected 1 to be greater than 1"); G64's function does not exist on the base, so no run of it in its after form is possible there, and the base's own finding for these fields is `findings.shape.is_null`. Stated in the booking.
- R1-4: true after R1-1, since every issue of `agents.yml` is now a finding, from the shape or from `parseAgents`.
- R1-5: the head comment of `src/lib/data/sources/config/catalog/agents.ts` says the flags are held in `data/shapes/catalog-words.ts`.
- R1-6: `src/lib/data/shapes/shape-issues.ts:5-6` reads "A reader keeps what it reads whatever the shape finds, so a wrong key costs that key alone and the server starts."
- R1-7: G64's Doc text in `agents/guarded.md` names 'gives one finding for $row'.
- R1-9: the Focus lane of a project offers only what the board may move it to: `fieldChoices(field, project)` in `src/lib/state/client/selectors.svelte.ts` filters by `movable` (`state/boards/focus.ts`), and `views/boards/editor/Editor.svelte` passes the project. Seen at the look: the archived project Robust-XAI-ECG's Focus select offers no `holding`, the ideas-tier project Engram's offers it.
- R1-10: the before and after are stated in the booking and the landing report: `access` was a free text box with the help "open / credentialed / DUA ..." and is a select of open, registration, credentialed and private; `retrieval` is a raw JSON block, not sent when untouched. Seen at the look on the dataset "DTU EEG and audio dataset for auditory attention decoding".
