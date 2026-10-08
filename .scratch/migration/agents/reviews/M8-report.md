Everything in the brief is done. Three cases are verified by reading or by the covering test and not by running the view: case 28 (read at `src/lib/state/workbench/navigation/editor-text.ts:143` and `src/lib/views/sources/source/language/lsp.ts:16`), case 38 (the Settings view was not rendered; the file descriptions are checked by `tests/checks/source/keys.test.ts`, which passes) and case 20 (the lifetime row of `tests/server/machine/lsp/lifetime.test.ts`). `python3 tools/data/redownload.py picai --dry-run` ends in `KeyError: 'record'` (a zenodo answer needing the network), identically in `M8-base`, so it is not caused by the step.

## Open items of the state file, verbatim

The "Open items" section of `tools/oculus/.scratch/migration/orchestrator-state.md` (lines 160-163) holds no entry: the sentence "An entry leaves this list for the closed log the moment Axel rules on it" and the "What a review or a look found..." sentence are all it holds. Items 5, 6 and 7 of the earlier wording are no longer listed. Item 5 (G57) was landed by D33's preparation. Items 6 and 7 were ruled (a) by Axel and are landed by this step as G61 and G62 (section "Guarded tests G61 and G62").

## The coordinator's deck ruling, Z717

Verbatim from `plan.md:1523`: "Z717 (2026-10-08, M8's first run, the orchestrator, automode): M8's builder handed back case 10 and verify items 1 and 3: G14 failed two tests on the unchanged tree because `config/sources.yml:24` names `portfolio_deck: deck` and the worktree held no `deck/`. The worktree paths of `.agents/plan.yaml` and the state file gain `deck` and the hub's `docs`; M8's worktree and base copy gain `deck/` (G14 then 8 of 8 passed); the builder resumes with the brief unchanged (`agents/briefs/M8-cases.md`). Not chosen, the lazy option: the deck finding accepted as the baseline (self-rule)."

## First run of every case on the unchanged tree

Commands: a scratch script under the session scratchpad ran `buildPortfolio` (type stripping, the same function G14 runs) over a copy of the worktree's hub (every `.yml` of the data folders and every `project.yml`) with one change per case. The copy's baseline is the single deck finding that Z717 removed by putting `deck/` in the worktree. Where a case needs yaml-language-server or a schema, the evidence is: `ls node_modules/yaml-language-server` prints "No such file or directory"; `grep -c yaml src/lib/data/prose/lsp-servers.ts` prints 0 (no yaml entry); `ls config/schemas` does not exist; `grep -rn toJSONSchema src` prints nothing; `ls src/lib/data/snapshot` lists no generator; `grep -c "co-present" network/events.yml` prints 0.

| Case | First run on the unchanged tree |
|---|---|
| 1 | Not met: no YAML server, no schema served. |
| 2 | Not met: same. `venue_categories` is `[journal, conference]` (`vocab.yml:256`). |
| 3 | Not met: no completion exists for YAML. |
| 4 | Not met: no hover exists for YAML. |
| 5 | `venue_id: no-such-venue` in `projects/manuscripts/covert-theory/project.yml`: a finding, "venue_id names no venue: no-such-venue" (the Findings half holds, the editor mark does not exist). `category: magazine` in `registries/venues.yml`: no mark and no finding (`findings: 1`, the baseline). Not met. |
| 6 | The data is unchanged: `access: public` at `registries/data.yml:77`, no `co-present`, `venue_categories` `[journal, conference]`. No finding on the real hub (G14 baseline); no mark exists. Not met as written, the data changes are the step's. |
| 7 | `deadline_month` on a journal: no finding. A retrieval method `carrier-pigeon` in `data.yml`: no finding. Graz has `role: present` and no link (`network/events.yml:62-73`): no finding. None is marked or reported. Not met. |
| 8 | `python3 tools/data/redownload.py pmc-patients --dry-run` prints `! unknown retrieval.method 'direct' - skipping.`; `ajile12 --dry-run` (a `script` set) prints `! unknown retrieval.method 'script' - skipping.` Not met. |
| 9 | Not met: no `from:` key exists (`grep -n "options_from" registries/venues.yml` prints `:18`, `:21`). |
| 10 | After Z717 (`deck/` and `docs/` in the worktree and the base copy): `npx vitest run tests/checks/config/integrity.test.ts` on the base source composed with the base data folders, `deck/` and the worktree's projects: `Test Files  1 passed (1)`, `Tests  8 passed (8)`. Holds. |
| 11 | Holds as to findings: a `snooze` in education, events and venues and `subtasks` in tasks give no finding on the real hub. No mark exists. |
| 12 | Not met: no completion. |
| 13 | A `registries/people.yml` that does not parse: one finding "does not parse: ..." for the file and 71 findings "collaborators names no person: ..." on the manifests that reference it. Not met. |
| 14 | A funding entry with a `title` and no `key`: no finding. Holds as to findings; no enum exists. |
| 15 | Not met: no completion. |
| 16 | Not met: no matcher, no schema for any file. |
| 17 | Not applicable: no YAML server runs. |
| 18 | Holds trivially: no YAML server runs, `config/local.yml` is sent to none. |
| 19 | Syntax marks come from the editor's grammar only; no server runs. Not met. |
| 20 | Not met: no YAML server. |
| 21 | Not met: no YAML entry, the status bar has no `server_yaml` word. |
| 22 | Holds trivially: no YAML server, Format Document is `unsupported` for YAML. |
| 23 | No finding on `career.yml`; no schema marks it. Holds as to findings. |
| 24 | A `registries/venues.yml` with `options_from: nosuch` in its schema block: no finding (`findings: 1`). Not met. |
| 25 | An app reads a collection's `optionsFrom` (`model-collections.ts:37`, `docs/apps.md:247`); the new name `from` does not exist. Not met. |
| 26 | `venue_idd: tsp` in a manifest: a finding "key venue_idd is not in the manifest schema" (manifests only; no mark exists). Hub registry files: no check of undeclared fields. Partly met. |
| 27 | A duplicated `key: "amir-haeri"` in `registries/people.yml`: no finding. Not met. |
| 28 | Not applicable: no YAML server. |
| 29 | Not applicable: no YAML server. |
| 30 | Not met: `config/schemas/` does not exist, no side-project, deck, cpp, commands or launch schema. |
| 31 | Not met: no catalog or text file has a schema. |
| 32 | Not met: no schema for `.oculus/settings.yml` or `app.yml`; `parseRepoSettings` ignores a top-level `editor:` key (`editor-options.ts:199-219`). |
| 33 | Holds trivially: no file has a schema. |
| 34 | The 36 integer `year`s, the radar entries, career, the top-level keys and `links: []`: no finding on the real hub. Holds as to findings; no completion for `maps_to:`. |
| 35 | Holds trivially: syntax marks only. |
| 36 | A `schema:` block that does not parse in `registries/venues.yml`: "does not parse" for the file, and 54 findings "venue_id names no venue: ..." on manifests (55 findings besides the baseline, two of them "does not parse"). Not met (the governed files should get syntax marks only). |
| 37 | The `wallpaper` text entry carries `suggest_from: wallpapers` (`options.yml:76`), read at `FieldControl.svelte:301`; the new key `from` does not exist. Not met. |
| 38 | The Settings view lists catalogs from `config/catalogs` only; `config/schemas/` does not exist. Not met. |
| 39 | Holds: the Graz event has `role: present` and `related: [abduction]`, and `disseminated()` (`stats.ts:154`) drops only `attend`; the Venues view draws journals and conferences only (`venues.ts:166-170`). |

## Final run of the cases on the finished tree

Commands: the real-Relay harness under the session scratchpad (`e2e/page.ts`, a real `Relay` over the installed yaml-language-server 1.24.0, driven as the page drives it), `e2e/run1.ts` to `run16.ts`, their outputs in `e2e-out/`, rerun in this session; `npx vitest run` on the test files named; `buildPortfolioWithSchemas` probes.

| Case | Result on the finished tree |
|---|---|
| 1 | `run15.ts`: a new line at column 0 of `projects/active/linfoot-estimator/project.yml` offers 14 names (`tier,priority,pin,ideas,funding,waiting-on,related,deadline,snooze,paths,subtasks,followup,code_availability,reproduced`, the keys not yet in the file); the real manifest opened as it is has marks `[]` after 2.5 s; with `venue_idd: zz` appended the mark is `[32,"Property venue_idd is not allowed."]`. |
| 2 | `run2.ts`: `focus:` offers 11 lanes (`holding,run,push,revise,review,blocked,backburner,scope,derisk,build,null`); `run1.ts`: `category:` in `venues.yml` offers `journal,conference,thesis,meeting,null`. |
| 3 | `run1.ts`: `venue_id:` offers 72 ids (`jbi,jce,statmed,...`, never names), `collaborators:` 19 keys (`amir-haeri,van-den-berg,...`), `related:` 94 manifest ids; `run11.ts`: `compute:` offers `utwente,this-mac,data`. |
| 4 | `run1.ts`: hover on `category` in `venues.yml` answers "The kind of venue: a journal, a conference, a thesis or a meeting." followed by the allowed values. |
| 5 | `run5.ts`: `category: magazine` marked at line 42 ("Value is not accepted. Valid values: journal, conference, thesis, meeting, null."), `venue_id: no-such-venue` marked at line 29. The Findings half: `probe23` over a planted hub prints `focus is nonsense, which is not a key of vocab.focus_lanes`, `collaborators[0] is nobody, which is not a key of people` and the same sentence shape for `venue_id`. |
| 6 | `npx vitest run tests/checks/config/integrity.test.ts` on the worktree: 8 passed (zero findings on the hub); `run4.ts`: 221 YAML files of the hub governed by a schema, 0 marked, 0 ungoverned. |
| 7 | `run16.ts` (document closed between probes): `deadline_month: Jan` on a journal marked at line 43 ("Matches a schema that is not allowed."); `timing` and `call` on a journal: no mark. `run5.ts`: `role: present` with no `link` marked at line 20 ("Missing property \"link\"."), `method: carrier-pigeon` marked at line 66 with the nine allowed methods. Findings: `tests/data/snapshot/schema-rules.test.ts` passes. |
| 8 | `python3 tools/data/redownload.py pmc-patients --dry-run` prints `$ wget -q -c -O /Users/axelfaes/data/pmc-patients/PMC-Patients-V2.json https://huggingface.co/datasets/zhengyun21/PMC-Patients/resolve/main/PMC-Patients-V2.json`; `ajile12 --dry-run` (a `script` set) prints `x open, but no one-command recipe - fetch manually (see steps):` with source, steps and place. Neither prints "unknown retrieval.method". |
| 9 | `grep -rn "options_from\|values_from\|optionsFrom\|values_by\|suggest_from"` over the brief's paths prints only `../cockpit/src/cockpit/page.py:706`, `:708`, `:709`; `tests/data/snapshot/schema-rules.test.ts` and `tests/data/sources/config/catalog/options.test.ts` pass (`from: domains` to the registry keys, `from: vocab.<key>` to the vocabulary). |
| 10 | `npx vitest run tests/checks/config/integrity.test.ts` on the worktree: `Tests 8 passed`. |
| 11 | `run16.ts`: `snooze: true` on a venue: marks `[]`. `run5.ts`: a task with `snooze` and `subtasks` is marked only for the probe entry's own missing `status` ("Missing property \"status\"."), not for either key. `probe39`: no finding on the hub. |
| 12 | `run7.ts`: `collaborators:` completion lists 19 keys before and 20 after a key is added to `people.yml` (the relay republishes the schemas, the server revalidates); the mark on the new key present before the add is gone after (`beta marks after []`). |
| 13 | `run7.ts`: an unparsable `people.yml` gives one finding ("does not parse: Block collections are not allowed within flow collections at line 2, column 3:") and no mark and no completion on `collaborators: nobody-at-all`. |
| 14 | `probe23` over a planted hub: a funding entry with a title and no key gives only "funding entry zz is awarded and has no statement"; `run4.ts` marks nothing on the real `funding.yml`. |
| 15 | `run11.ts`: `compute:` offers `utwente,this-mac,data`; the parked resources `keptResources` drops are absent. |
| 16 | `run1.ts` mapping: `side-projects/residual/project.yml` to `side-project`; `other:.oculus/project.yml` to `side-project`; `deck/present.yml` to `deck`; `tools/oculus/config/present.yml` to `config/present`; `tools/oculus/config/text/views/academic/present.yml` to `text`. `~/workspace/ordo/.oculus/project.yml` is the second root case: the `other:` root maps `.oculus/project.yml` to `side-project`. |
| 17 | `run9.ts`: a listener on 127.0.0.1 behind `$schema=http://127.0.0.1:<port>/s.json` (modeline and key): `network hits []`; the files are marked "Unable to load schema ... No content."; `run10.ts`: `network none`. |
| 18 | `run14.ts`: `local marks undefined alias marks undefined`, `leak false`; `run9.ts`: `config/local.yml []`, `secret anywhere false`. |
| 19 | `run1.ts`: `other:.agents/plan.yaml` has no schema; `run10.ts`: `.agents/plan.yaml` gets syntax marks only (`[]`) and a broken `plan2.yaml` gets "Flow sequence in block collection must be sufficiently indented and en...". |
| 20 | By the covering test: `npx vitest run tests/server/machine/lsp` passes (`lifetime.test.ts` row "is one YAML server for a yml tab and a yaml tab of one root on one page, which ends 60 s after the last closed"). |
| 21 | `run12.ts`: states `starting`, then `not_found` with `program: yaml-language-server` when the package is missing. |
| 22 | `run13.ts`: the server's capabilities hold no formatting provider (`textDocumentSync,hoverProvider,completionProvider,documentSymbolProvider,definitionProvider,foldingRangeProvider,selectionRangeProvider,codeActionProvider`); a formatting request answers `[]`. |
| 23 | `probe23` and `run4.ts`: `career.yml` marks 0 against its schema, with `when: "27 Jul"` read as text. |
| 24 | `probe24.ts`: "the field category takes its keys from nosuch, which is no registry, projects or vocab list", "the field month is conditioned on nofield, which is no field of its record", "the field pick takes its keys from nosuch2, ..."; `tests/checks/config/config-folder.test.ts` passes (shipped catalogs read with no finding). |
| 25 | `docs/apps.md:247` lists `from?` in the collection's `schema?` shape; `src/lib/data/model/model-collections.ts:37` documents `from`; the rename grep of case 9 finds no `optionsFrom` outside the cockpit. |
| 26 | `run15.ts`: `venue_idd` marked "Property venue_idd is not allowed."; `probe23`: "key status.chipz is not declared by the schema of this file" as a finding. |
| 27 | `npx vitest run tests/data/snapshot/schema-rules.test.ts` passes; its row 'a key that stands twice in the referenced file' (`schema-rules.test.ts:71`) asserts the finding `findings.schema.duplicate_key` with the file and key. In the editor the server marks the duplicate as `Map keys must be unique` (`run16.ts`, line 574 of the conference probe). |
| 28 | By reading only: `src/lib/state/workbench/navigation/editor-text.ts:143` gives a file over `editor.paint_limit_kb` the plaintext language, and `src/lib/views/sources/source/language/lsp.ts:16` documents that the tab's channel is chosen by that language. Not run. |
| 29 | `run9.ts`: `c.yml`, `d.yml`, `e.yml` (a relative `$schema`, a key `$schema`, a `file://` modeline naming `config/local.yml` in a root under `$TMPDIR`) are marked "Unable to load schema from '<path>': No content."; `secret anywhere false` (`SECRET-LOCAL-TEXT` appears in no frame). The script's last line, a hover on `c.yml`, answers undefined, which its `.slice` call does not handle; every line above it printed. |
| 30 | `run10.ts`: `.oculus/commands.yml`, `.oculus/launch.yml`, `.oculus/cpp.yml`, `.oculus/project.yml` and `.oculus/apps/x/app.yml` pass; a key the reader refuses is marked (`Property bogus is not allowed.`, `Property foo is not allowed.`, `Value must be 1.`); `run4.ts`: every real side-project and deck file in the served root marks 0. |
| 31 | `run10.ts`: `tools/oculus/config/catalogs/glyphs.yml` passes, and a copy with `extra_top` and `zz_toolong` is marked; `config-folder.test.ts` passes every shipped catalog and text file through its schema. |
| 32 | `run11.ts`: `.oculus/settings.yml` offers 32 language names under `languages:` and as record fields, and `app.yml` offers `name,object,title,description,glyph,bridge,entry,reads,writes,connects`; `run10.ts`/`run9.ts`: a top-level `editor:` is marked "Property editor is not allowed." and `bogus` the same; `tests/data/sources/config/repo-settings.test.ts` passes (the skipped entry is named). |
| 33 | `run1.ts`: `tools/oculus/demo/projects/active/x/project.yml` and `tools/cockpit/dummy/projects/active/x/project.yml` map to no schema (`undefined`). |
| 34 | `run4.ts`: 221 governed files, 0 marked (the integer `year`s, the radar entries, career, top-level `title`/`intro`/`meta`/`schema`, `datasets:`); `run11.ts`: `maps_to:` offers 95 values beginning with the manifest ids. |
| 35 | `run1.ts`: `projects/manuscripts/dongho-ecg-clustering/admin/reviews/commitment-ledger.yml` maps to no schema; `run10.ts` shows the same for `.agents/plan.yaml`. |
| 36 | `run7.ts`: a `schema:` block that does not parse in a copy of `venues.yml` gives the finding "does not parse: Flow sequence in block collection must be sufficiently indented and end with a ] at line 16, column 3:" and the file itself gets syntax marks only (`[16,"Flow sequence in block collection ..."]`, `[16,"Flow map in block collection ..."]`). |
| 37 | `probe37.ts`: `appearance.wallpaper.file` carries `from: ["wallpapers"]` and its help line; `run11.ts`: the editor offers `wallpaper:\n  file: ` the wallpapers (`wallhaven-83`). The editor takes a page-held source as any text, so any name is accepted; the Settings view offers the same wallpapers from the page. |
| 38 | Not rendered. `npx vitest run tests/checks/source/keys.test.ts` passes: the test lists the files of `config/schemas/` with one description each. |
| 39 | `probe39.ts`: the Graz event reads `role: co-present`, `related: [abduction]` and the hub builds with 0 findings; no changed source file has `venues` in its path (`grep -c venues` over the list of changed files prints 0). |

## Ledger

Each row names the command run in this session and its output.

| Row | State | Command and output |
|---|---|---|
| Item 1: one schema vocabulary (`from`, `options`, `help`, `when`, `required:{when}`, `type: records` with `fields`, `open`) | DONE | `grep -rn "options_from\|values_from\|optionsFrom\|values_by\|suggest_from" ...` prints only `../cockpit/src/cockpit/page.py:706`, `:708`, `:709`; `grep -c "description:" config/catalogs/options.yml` prints 0; the `^    values:` pattern count prints 0; `grep -n REFERENCES src/lib/data/snapshot/validate.ts` prints nothing; ``grep -n '`description`\|`values`\|values_from\|values_by\|suggest_from' config/catalogs/options.yml`` prints nothing. |
| Item 2: schemas folder, whole-file readers, `.oculus/settings.yml`, app.yml, commands and launch | DONE | `ls config/schemas`: `cpp-schema.yml deck-schema.yml manifest-schema.yml side-project-schema.yml`; cases 30 to 32 above. |
| Item 3: generator and one path matcher using `matchesGlob` | DONE | `src/lib/data/snapshot/schema/set.ts` (90 lines); case 16 above. |
| Item 4: yaml-language-server 1.24.0 in the editor | DONE | `node -e` prints `1.24.0 8.20.0` for `node_modules/yaml-language-server` and `node_modules/ajv`; `package.json` diff adds `"ajv": "8.20.0"` and `"yaml-language-server": "1.24.0"`; cases 1 to 4. |
| Item 5: ajv validation replacing `REFERENCES`, with G56's table test | DONE | `npx vitest run tests/data/snapshot/schema-rules.test.ts` passes (151 lines). |
| Item 6: hub data changes | DONE | `diff` against the base, section "Hub data lines"; `integrity.test.ts` 8 passed. |
| Item 7: documents | DONE | section "Docs". |
| `npm run format` / `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | `eslint .` exit 0 (`lint exit 0`). |
| `npm run check` | DONE | `COMPLETED 3464 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. |
| `npm run diagrams` then `checks.sh` | DONE | `ok ASCII gate`, `ok prettier`, `ok svelte-kit sync`, `ok eslint`, `ok svelte-check (37.5 s): ... 433 FILES 0 ERRORS 0 WARNINGS`, `ok vitest (46.5 s)`, `test:quick: 47.2 s (limit 45.0 s); every command passed`, `test:quick: over the time limit`, `checks: 1 commands passed`, `exit 0`. The run took 47.2 s against the 45.0 s limit printed by the script; it reports the limit and still passes. |
| `npm run test:checks` | DONE | `Test Files  17 passed (17)`, `Tests  244 passed (244)` (comment width, import cycles, import order, duplication, keys, the diagrams, G12, G14 among them). |
| Verify 3: G14 | DONE | `Tests  8 passed (8)`. |
| Verify 4: sizes, folders, unused exports | DONE | `wc -l` in "Files"; the largest source file is `src/lib/server/machine/lsp/relay.ts` with 860 lines (limit 880), the largest component `Settings.svelte` 342 (limit 520); `sh utils/folder-check.sh` exit 0; `sh utils/unused-exports.sh`: worktree lists 248 exports against the base file's 249 and no entry that the base file lacks. |
| Verify 5: ASCII and YAML | DONE | `LC_ALL=C grep -nP '[^\x00-\x7F]'` over `DESIGN.md`, `README.md`, `docs/*.md`, `docs/DATA-MAP.md` prints nothing; `ok ASCII gate (0.6 s)` of `checks.sh`; the added hub lines hold no byte outside ASCII (`grep -nP '^>.*[^\x00-\x7F]'` over the data diff prints nothing); `yaml.safe_load` over 98 YAML files exits 0 (`yaml ok 98`). |
| Verify 6: rename greps | DONE | see row "Item 1". |
| Verify 7: no cockpit check | DONE | none run; `page.py:706-709` is the one place the old key stays. |
| 87 fields without a help line | DONE | the per-file count below: 87 in the base, 0 now. |
| Guarded tests G61 and G62 | DONE | section "Guarded tests G61 and G62". |
| Full-list runs | 2 | `checks.sh` ran twice after the last code changes; the second followed a change that moved `RENAMED_FIELDS` to `src/lib/data/helpers/hub-names.ts` to end an import cycle that `tests/checks/imports/cycles.test.ts` reports. |

## Files

`wc -l` of each source file the step adds or changes (the 89 under `src`; deleted files not listed):

| Lines | File |
|---|---|
| 860 | `src/lib/server/machine/lsp/relay.ts` |
| 819 | `src/lib/state/boards/collection.ts` |
| 814 | `src/lib/data/model/model-entities.ts` |
| 806 | `src/lib/data/snapshot/normalise.ts` |
| 803 | `src/lib/data/sources/config/settings.ts` |
| 803 | `src/lib/server/root/context.ts` |
| 695 | `src/lib/state/system/config/editors/draft.ts` |
| 679 | `src/lib/server/root/watch/portfolio.ts` |
| 662 | `src/lib/state/system/config/editors/fields.ts` |
| 647 | `src/lib/server/machine/lsp/held/held.ts` |
| 638 | `src/lib/data/model/index.ts` |
| 638 | `src/lib/server/machine/lsp/servers.ts` |
| 622 | `src/lib/server/content/docs.ts` |
| 556 | `src/lib/state/client/selectors.svelte.ts` |
| 555 | `src/lib/views/sources/source/language/lsp.ts` |
| 493 | `src/lib/server/edit/writes/config/config-fit.ts` |
| 489 | `src/lib/data/sources/config/catalog/options.ts` |
| 482 | `src/lib/state/sources/fs-transport.ts` |
| 471 | `src/lib/server/edit/writes/entries.ts` |
| 424 | `src/lib/data/snapshot/validate.ts` |
| 400 | `src/lib/data/snapshot/schema/check.ts` |
| 396 | `src/lib/state/forms/schema.ts` |
| 373 | `src/lib/data/sources/manifests.ts` |
| 363 | `src/lib/server/machine/apps/manifest.ts` |
| 361 | `src/lib/views/system/workbench/editors/FieldControl.svelte` |
| 348 | `src/lib/views/boards/editor/Editor.svelte` |
| 342 | `src/lib/views/system/workbench/Settings.svelte` |
| 330 | `src/lib/views/system/workbench/settings/Item.svelte` |
| 319 | `src/lib/data/sources/config/catalogs.ts` |
| 315 | `src/lib/data/sources/config/catalog/agents.ts` |
| 309 | `src/lib/data/shapes/catalog-files.ts` |
| 309 | `src/lib/state/system/config/groups.ts` |
| 282 | `src/lib/data/snapshot/schema/record.ts` |
| 275 | `src/lib/data/index.ts` |
| 274 | `src/lib/server/edit/writes/config/config-checks.ts` |
| 270 | `src/lib/server/machine/lsp/choices.ts` |
| 270 | `src/lib/server/machine/runs/commands/files.ts` |
| 266 | `src/lib/state/system/config/rows.ts` |
| 263 | `src/lib/data/sources/config/merge.ts` |
| 260 | `src/lib/data/sources/config/catalog/value-rule.ts` |
| 244 | `src/lib/data/sources/config/catalog/schemas/options.ts` |
| 239 | `src/lib/server/machine/lsp/held/process.ts` |
| 229 | `src/lib/data/sources/config/editor-options.ts` |
| 225 | `src/lib/data/prose/lsp-servers.ts` |
| 204 | `src/lib/server/machine/lsp/adapters/pyright/interpreter.ts` |
| 194 | `src/lib/state/system/config/browser.ts` |
| 183 | `src/lib/server/machine/debug/launch.ts` |
| 183 | `src/lib/views/system/workbench/editors/Editor.svelte` |
| 182 | `src/lib/data/snapshot/schema/run.ts` |
| 178 | `src/lib/server/machine/lsp/adapters/clangd/cpp-file.ts` |
| 170 | `src/lib/views/system/workbench/settings/List.svelte` |
| 164 | `src/lib/data/snapshot/schema/lists.ts` |
| 163 | `src/lib/server/machine/lsp/adapters/clangd/databases.ts` |
| 159 | `src/lib/data/model/model-collections.ts` |
| 150 | `src/lib/views/system/workbench/settings/Control.svelte` |
| 145 | `src/lib/views/boards/focus/QuickAdd.svelte` |
| 134 | `src/lib/data/sources/config/catalog/latex-tables.ts` |
| 126 | `src/lib/data/sources/registries.ts` |
| 122 | `src/lib/state/system/config/editors/origins.ts` |
| 120 | `src/lib/server/machine/lsp/held/documents.ts` |
| 119 | `src/lib/data/sources/config/catalog/schemas/engine.ts` |
| 104 | `src/lib/server/machine/lsp/adapters/web/config-files.ts` |
| 100 | `src/lib/data/sources/config.ts` |
| 97 | `src/lib/views/system/findings/Findings.svelte` |
| 91 | `src/lib/data/snapshot/schema/static.ts` |
| 90 | `src/lib/data/snapshot/schema/set.ts` |
| 89 | `src/lib/data/shapes/catalog-words.ts` |
| 89 | `src/lib/data/snapshot/schema/manifest.ts` |
| 88 | `src/lib/state/system/config/search.ts` |
| 84 | `src/lib/server/machine/lsp/adapters/pyright/adapter.ts` |
| 80 | `src/lib/data/snapshot/schema/field.ts` |
| 80 | `src/lib/data/snapshot/schema/hub.ts` |
| 64 | `src/lib/data/sources/config/catalog/option-findings.ts` |
| 60 | `src/lib/server/machine/lsp/adapters/clangd/adapter.ts` |
| 57 | `src/lib/data/helpers/dates.ts` |
| 55 | `src/lib/server/machine/lsp/adapters/web/approval.ts` |
| 52 | `src/lib/server/machine/lsp/adapters/web/svelte-adapter.ts` |
| 47 | `src/lib/server/machine/lsp/adapters/yaml/requests.ts` |
| 46 | `src/lib/data/helpers/hub-names.ts` |
| 45 | `src/lib/data/snapshot/schema/json.ts` |
| 41 | `src/lib/data/sources/config/catalog/schemas/settings.ts` |
| 34 | `src/lib/server/machine/lsp/schema-feed.ts` |
| 33 | `src/lib/server/root/watch/own-schemas.ts` |
| 32 | `src/lib/state/system/config/config-files.ts` |
| 29 | `src/lib/server/machine/lsp/adapters/yaml/machine-file.ts` |
| 28 | `src/lib/data/sources/config/catalog/schema-findings.ts` |
| 25 | `src/lib/data/snapshot/validate-kinds.ts` |
| 17 | `src/lib/server/machine/lsp/adapters/web/typescript-adapter.ts` |
| 15 | `src/lib/server/machine/lsp/adapters/yaml/adapter.ts` |

New files outside `src`: `config/schemas/cpp-schema.yml` (18), `deck-schema.yml` (23), `manifest-schema.yml` (77), `side-project-schema.yml` (15); tests `tests/data/snapshot/schema-rules.test.ts` (151), `tests/data/snapshot/relation-shapes.test.ts` (92), `tests/data/sources/config/repo-settings.test.ts` (42), `tests/server/machine/lsp/versions.test.ts` (66), `tests/server/root/config-cache.test.ts` (84), `tests/views/sources/repositories/diff/diff-read.test.ts` (42). `config/catalogs/manifest-schema.yml` moved to `config/schemas/manifest-schema.yml`. `server/machine/lsp/` holds 10 items.

## Judgment calls

- **The YAML server needs `workspaceFolders: true` and `configuration: true` in the initialize capabilities** (`src/lib/server/machine/lsp/servers.ts`, `initializeParams`). yaml-language-server's `initialized` handler throws when the client lacks `workspace.workspaceFolders`, which skips registering its configuration handler, so a schema republish (`workspace/didChangeConfiguration`) revalidated nothing. With both set, a key added to `people.yml` reaches an open manifest (case 12).
- **A reopened document keeps counting versions upward** (`Held.#sent`, `Held.versioned` in `held/held.ts`, `Doc.shift`): the YAML server caches its parse per URI and version, and a page reopening a document at version 1 after close was answered from the earlier text. The shift is added to the page's version on every change. `tests/server/machine/lsp/versions.test.ts` covers it.
- **A source that does not parse gives no list** (`Lists` returns `null`, `unreadSources` in `schema/lists.ts`): a value naming a registry that failed to parse is not marked, and the registry's own parse error is the finding (case 13). Without it every reference to an unparsable registry carried a false mark.
- **`checkRelationShapes` is kept in `validate.ts`** for the six relation fields of a manifest (`domain`, `pillar`, `datasets`, `related`, `collaborators`, `waiting-on`): the schema passes a bare `key:` for every type, and these lists are read as lists downstream. A bare key or, for `waiting-on`, a non-list is one finding in the sentence of `findings.schema.type`. `docs/DATA-MAP.md` says so next to the bare-key rule.
- **`buildPortfolio` is removed.** `buildPortfolioWithSchemas` (defaults for version, roots and checker) is the one build; the seven tests that called `buildPortfolio` call it and read `.snapshot`. This ends an export that nothing in `src` used.
- **`RENAMED_FIELDS` moved to `src/lib/data/helpers/hub-names.ts`** so that `schema/check.ts` does not import `validate.ts` while `validate.ts` imports `schema/check.ts`.
- **Exports the step no longer needs are file-local or removed** (`SIDE_TIER`, the eight catalog file shapes, `vocabKeys`, `FIELD_TYPES`, `isPicked`, the schema root keys, `schemaNameOf`, `SCHEMAS_GROUP`, `JOINT_WORK`, `PERSON_FIELD`; `pathsOf`, `namedSchemaShape` and `noSchemas` deleted), so that `sh utils/unused-exports.sh` lists no entry the base file lacks.
- **`wallpapers` in the editor.** A `from` naming a source held by the page (the wallpaper folder) is offered by the Settings view and treated as any text by the editor, which has no page state (case 37 as written describes the Settings view).
- **`vocabCatalog`** reads the `VOCAB_KEYS` across `vocab.yml` and `appearance.yml`, so `vocab.<key>` resolves in both.
- **`venues.yml` is read both as a registry and as a collection**, so a parse failure of it is reported twice (case 36; the base does the same).
- **New tests of code the step changed** that are ordinary tests and not guarded entries: `versions.test.ts`, `relation-shapes.test.ts`, `repo-settings.test.ts` and one row of `servers.test.ts` (initialize carries `workspaceFolders` and `configuration`). `versions.test.ts` and the `servers.test.ts` row fail on the unchanged tree because the base has no YAML server.
- **Brief line numbers offset:** the G13 Code line is `guarded.md:138`, not `:135` (`:135` is G12's).

## Guarded tests G61 and G62

- `tests/server/root/config-cache.test.ts` (84 lines), describe "the config cache of the server context", titles word for word: "parses a config folder once for requests over it, and again once a file of it is written", "parses again for every request while an entry of the folder cannot be stat-ed", "keeps the one read of a request for the rest of it, whatever is written meanwhile".
- `tests/views/sources/repositories/diff/diff-read.test.ts` (42 lines), one table "the read key of a diff pane" over `readKeyOf`: "changes with the disk hash for the compare of a save conflict", "stays the same for a working-tree compare when the file changes", "stays the same for a Replace Preview when the file changes".
- On the unchanged tree (`$SP/h`, whose `src` is identical to the base: `diff -rq` against `M8-base/tools/oculus/src` prints nothing): `npx vitest run tests/server/root/config-cache.test.ts tests/views/sources/repositories/diff/diff-read.test.ts` gives `Test Files  2 passed (2)`, `Tests  6 passed (6)`, so G61 is 3 passed and G62 is 3 passed.
- On the worktree: the same command together with `integrity.test.ts`, `schema-rules.test.ts` and `config-folder.test.ts` gives `Test Files  5 passed (5)`, `Tests  42 passed (42)`; G61 3 passed, G62 3 passed.

## Hub data lines before and after

The output of `diff <base copy> <worktree file>` for each file (`<` is the base, `>` the worktree). 348 changed lines; `LC_ALL=C grep -nP '^>.*[^\x00-\x7F]'` over the diff prints nothing.

```diff
=== applications/applications.yml
6,13c6,13
<   - { field: title,   type: text,     required: true }
<   - { field: sub,     type: text,     label: "Subtitle" }
<   - { field: status,  type: select,   options: ["not applied", active, accepted, rejected, declined, withdrawn, applied], required: true }
<   - { field: date,    type: text }
<   - { field: meta,    type: metalist }
<   - { field: tags,    type: tags }
<   - { field: note,    type: textarea }
<   - { field: link,    type: text }
---
>   - { field: title,   type: text,     required: true, help: "The name of the application." }
>   - { field: sub,     type: text,     label: "Subtitle", help: "A second line under the title, such as the institution." }
>   - { field: status,  type: select,   options: ["not applied", active, accepted, rejected, declined, withdrawn, applied], required: true, help: "Where the application stands." }
>   - { field: date,    type: text, help: "The year the application was made." }
>   - { field: meta,    type: metalist, help: "Label and value rows shown on the card." }
>   - { field: tags,    type: tags, help: "Words the card is filtered by." }
>   - { field: note,    type: textarea, help: "Free notes on the application." }
>   - { field: link,    type: text, help: "A path in the hub to the application's documents." }
15c15
<   - { field: related, type: tags,     help: "Project ids" }
---
>   - { field: related, type: tags,     from: projects, help: "Project ids" }
=== education/education.yml
6c6
<   - { field: title,    type: text,     required: true }
---
>   - { field: title,    type: text,     required: true, help: "The name of the course or programme." }
8c8
<   - { field: status,   type: select,   options: [planned, ongoing, completed], required: true }
---
>   - { field: status,   type: select,   options: [planned, ongoing, completed], required: true, help: "Whether it is planned, ongoing or completed." }
12,13c12,13
<   - { field: tags,     type: tags }
<   - { field: note,     type: textarea }
---
>   - { field: tags,     type: tags, help: "Words the card is filtered by." }
>   - { field: note,     type: textarea, help: "Free notes on the entry." }
15c15
<   - { field: related,  type: tags,     help: "Project ids this relates to" }
---
>   - { field: related,  type: tags,     from: projects, help: "Project ids this relates to" }
=== feeds/literature-radar.yml
11a12,28
> # Form schema: the fields of an entry. The editor completes them and marks a key no entry may hold.
> schema:
>   - { field: title, type: text, required: true, help: "The paper's title." }
>   - { field: authors, type: text, help: "The authors, in the order the paper lists them." }
>   - { field: venue, type: text, help: "Where the paper appeared, or the preprint server." }
>   - { field: year, type: text, help: "The year of the paper, as a whole number." }
>   - { field: url, type: text, required: true, help: "The paper's web address, which the sweep deduplicates by." }
>   - { field: bucket, type: select, from: vocab.radar_buckets, required: true, help: "How the paper bears on the project: a pre-emption risk, a paper to cite or run as a baseline, an adjacent paper or an idea spark." }
>   - { field: project, type: select, from: projects, help: "The project the sweep found the paper for." }
>   - { field: relevance, type: select, options: [high, med, low], help: "How closely the paper bears on the project." }
>   - { field: why, type: textarea, help: "Why the paper matters to the project." }
>   - { field: found, type: date, help: "The day the sweep found the paper." }
>   - { field: threatens, type: textarea, help: "The claim of the project that a pre-emption risk puts at stake." }
>   - { field: motif, type: text, help: "For an idea spark, the pattern in the paper that the spark takes from it." }
>   - { field: maps_to, type: text, from: projects, help: "For an idea spark, the project the spark applies to, or new-idea-candidate when it fits none." }
>   - { field: idea_spark, type: textarea, help: "For an idea spark, the idea in a few sentences." }
> 
=== feeds/position-leads.yml
53,62c53,62
<   - { field: title, label: "Title", type: text }
<   - { field: inst, label: "Institution", type: text }
<   - { field: country, label: "Country", type: text }
<   - { field: typ, label: "Type", type: text }
<   - { field: focus, label: "Focus", type: textarea }
<   - { field: fit, label: "Fit", type: textarea }
<   - { field: status, label: "Status", type: select, options: [open, applied, declined] }
<   - { field: date, label: "Date", type: date }
<   - { field: deadline, label: "Deadline", type: text }
<   - { field: url, label: "URL", type: text }
---
>   - { field: title, label: "Title", type: text, help: "The name of the position." }
>   - { field: inst, label: "Institution", type: text, help: "The institution that offers the position." }
>   - { field: country, label: "Country", type: text, help: "The country of the institution." }
>   - { field: typ, label: "Type", type: text, help: "The kind of position, such as postdoc or fellowship." }
>   - { field: focus, label: "Focus", type: textarea, help: "What the position is about." }
>   - { field: fit, label: "Fit", type: textarea, help: "How the position fits the hub owner's work." }
>   - { field: status, label: "Status", type: select, options: [open, applied, declined], help: "Whether the lead is open, applied for or declined." }
>   - { field: date, label: "Date", type: date, help: "The day the scout found the lead." }
>   - { field: deadline, label: "Deadline", type: text, help: "The deadline as the posting words it." }
>   - { field: url, label: "URL", type: text, help: "The link to the posting." }
=== funding/funding.yml
6c6
<   - { field: title,     type: text,     required: true }
---
>   - { field: title,     type: text,     required: true, help: "The name of the funding scheme or application." }
8c8,9
<   - { field: status,    type: select,   options: [in-prep, planned, submitted, contributing, awarded, rejected, withdrawn], required: true }
---
>   - { field: funder,    type: select,   from: organisations, help: "The organisation that funds the scheme, as a key of organisations.yml." }
>   - { field: status,    type: select,   options: [in-prep, planned, submitted, contributing, awarded, rejected, withdrawn], required: true, help: "Where the scheme stands, from in-prep to awarded or rejected." }
11,13c12,14
<   - { field: meta,      type: metalist }
<   - { field: tags,      type: tags }
<   - { field: note,      type: textarea }
---
>   - { field: meta,      type: metalist, help: "Label and value rows shown on the card." }
>   - { field: tags,      type: tags, help: "Words the card is filtered by." }
>   - { field: note,      type: textarea, help: "Free notes on the scheme." }
15c16
<   - { field: link,      type: text }
---
>   - { field: link,      type: text, help: "A path in the hub to the scheme's folder." }
=== network/events.yml
1c1
< # Talks & Events: one calendar of conference appearances, symposia, visits, and pitches. `role: present` = a talk/poster I give (feeds "Disseminated in" on the linked project cards; slide decks live in network/<event>/); `role: attend` = I attend but do not present. Forward-looking dated entries surface on the Focus "This week" ticker. Mark past ones status: completed. Schema: the `schema:` block below (an entry is edited in its card's form).
---
> # Talks & Events: one calendar of conference appearances, symposia, visits, and pitches. `role: present` = a talk/poster I give (feeds "Disseminated in" on the linked project cards; slide decks live in network/<event>/); `role: co-present` = a co-author gives it and I do not; `role: attend` = I attend but do not present. Forward-looking dated entries surface on the Focus "This week" ticker. Mark past ones status: completed. Schema: the `schema:` block below (an entry is edited in its card's form).
3c3
< intro: "Conference appearances, symposia, research visits, and pitches, in one calendar. role: present = a talk I give (feeds 'Disseminated in'); role: attend = attending only. A future ISO date shows up on the Focus ticker; mark past ones completed."
---
> intro: "Conference appearances, symposia, research visits, and pitches, in one calendar. role: present = a talk I give (feeds 'Disseminated in'); role: co-present = a co-author gives the talk; role: attend = attending only. A future ISO date shows up on the Focus ticker; mark past ones completed."
6,10c6,10
<   - { field: title,    type: text,     required: true }
<   - { field: sub,      type: text,     label: "Subtitle" }
<   - { field: role,     type: select,   options: [present, attend], required: true, help: "present = a talk/poster I give (feeds 'Disseminated in'); attend = attending only" }
<   - { field: status,   type: select,   options: [upcoming, planned, completed, cancelled, not-attending], required: true }
<   - { field: date,     type: text }
---
>   - { field: title,    type: text,     required: true, help: "The name of the event." }
>   - { field: sub,      type: text,     label: "Subtitle", help: "A second line under the title, such as the place." }
>   - { field: role,     type: select,   options: [present, co-present, attend], required: true, help: "present = a talk/poster I give (feeds 'Disseminated in'); co-present = a co-author gives it and I do not; attend = attending only" }
>   - { field: status,   type: select,   options: [upcoming, planned, completed, cancelled, not-attending], required: true, help: "Whether the event is upcoming, planned, completed, cancelled or not attended." }
>   - { field: date,     type: text, help: "When the event takes place, as text." }
12,16c12,16
<   - { field: meta,     type: metalist }
<   - { field: tags,     type: tags }
<   - { field: note,     type: textarea }
<   - { field: link,     type: text,     help: "slides / deck (network/<event>/), for a talk I give" }
<   - { field: related,  type: tags,     help: "Project ids" }
---
>   - { field: meta,     type: metalist, help: "Label and value rows shown on the card." }
>   - { field: tags,     type: tags, help: "Words the card is filtered by." }
>   - { field: note,     type: textarea, help: "Free notes on the event." }
>   - { field: link,     type: text,     required: { when: { role: present } }, help: "slides / deck (network/<event>/), for a talk I give" }
>   - { field: related,  type: tags,     from: projects, help: "Project ids" }
63c63
<     role: present
---
>     role: co-present
=== network/joint-work.yml
11,16c11,16
<   - { field: person, type: select,   options_from: people, required: true, help: "a registries/people.yml key" }
<   - { field: status, type: select,   options: [exploring, active, completed], required: true }
<   - { field: meta,   type: metalist }
<   - { field: tags,   type: tags }
<   - { field: note,   type: textarea }
<   - { field: deadline, type: date }
---
>   - { field: person, type: select,   from: people, required: true, help: "The person's key in registries/people.yml." }
>   - { field: status, type: select,   options: [exploring, active, completed], required: true, help: "Whether the work is being explored, active or completed." }
>   - { field: meta,   type: metalist, help: "Label and value rows shown on the card." }
>   - { field: tags,   type: tags, help: "Words the card is filtered by." }
>   - { field: note,   type: textarea, help: "Free notes on the work." }
>   - { field: deadline, type: date, help: "A day the work is due; it shows on the Focus radar while live." }
=== registries/boilerplate.yml
11,14c11,14
<   - { field: title,     type: text,     required: true }
<   - { field: status,    type: select,   options: [draft, ready], required: true }
<   - { field: tags,      type: tags }
<   - { field: note,      type: textarea }
---
>   - { field: title,     type: text,     required: true, help: "The name of the text block." }
>   - { field: status,    type: select,   options: [draft, ready], required: true, help: "Whether the text is a draft or ready to paste." }
>   - { field: tags,      type: tags, help: "Words the card is filtered by." }
>   - { field: note,      type: textarea, help: "Free notes on where the text is used." }
=== registries/career.yml
4a5,52
> # Form schema: the sections of this file, one field each. Every section is a field of its own; a records field lists the fields of
> # each row, and open: true lets a row carry keys the schema does not name (a host's score columns, the situation's labels).
> schema:
>   - { field: title, type: text, help: "The name the Career strategy panel is listed under." }
>   - { field: milestone, type: text, help: "The one-line milestone shown at the head of the panel." }
>   - field: situation
>     type: records
>     open: true
>     help: "Facts about where the hub owner stands now, one label and one sentence each."
>     fields: []
>   - field: order
>     type: records
>     help: "The order of work, in priority order."
>     fields:
>       - { field: task, type: text, required: true, help: "What to do." }
>       - { field: when, type: text, help: "When it is due, as text." }
>       - { field: note, type: text, help: "An optional remark on the task." }
>   - field: hosts
>     type: records
>     open: true
>     help: "Host candidates, ranked with the best fit first; each score column is a key of career_score_dims in vocab.yml."
>     fields:
>       - { field: name, type: text, required: true, help: "The host's family name." }
>       - { field: inst, type: text, help: "The host's institution." }
>       - { field: tag, type: text, help: "The host's field in a few words." }
>       - { field: status, type: select, from: vocab.career_host_status, help: "Where the contact with the host stands." }
>       - { field: note, type: textarea, help: "The scores in words and a remark on the host." }
>   - { field: host_criteria, type: tags, help: "What a host has to be, one criterion per entry." }
>   - field: not_hosts
>     type: records
>     help: "People who are not hosts, each with the reason."
>     fields:
>       - { field: who, type: text, required: true, help: "The person or group." }
>       - { field: why, type: text, help: "Why they are not a host." }
>   - field: eligibility
>     type: records
>     help: "The rule of the FWO Senior call, the shots that remain and the caveat."
>     fields:
>       - { field: rule, type: tags, help: "The conditions of the call, one per entry." }
>       - { field: shots, type: tags, help: "The calls that remain, one per entry." }
>       - { field: caveat, type: textarea, help: "What to keep in mind about a second attempt." }
>   - field: dropped
>     type: records
>     help: "Options that were dropped, each with the reason."
>     fields:
>       - { field: what, type: text, required: true, help: "The option that was dropped." }
>       - { field: why, type: text, help: "Why it was dropped." }
> 
=== registries/data.yml
9c9
< #  PRIVATE / local-only. Which projects use each set is now auto-derived from the manifests' `datasets:` keys (cross-linked in the cockpit); no manual list here. `access:` is a key of `data_access` in tools/oculus/config/catalogs/vocab.yml (open, registration, credentialed or private; any other value is drawn neutral). `retrieval.method:` drives the script in {physionet, physionet_zip, zenodo, manual}. Primary HPC home: faesayl@...:~/data  (compute nodes have NO internet, so log in to a LOGIN node to (re)download). Caches/npz are rebuilt from raw per-project.
---
> #  PRIVATE / local-only. Which projects use each set is now auto-derived from the manifests' `datasets:` keys (cross-linked in the cockpit); no manual list here. `access:` is a key of `data_access` in tools/oculus/config/catalogs/vocab.yml (open, registration, credentialed or private). `retrieval.method:` is one of direct, library, manual, physionet, physionet_zip, private, script, url or zenodo: tools/data/redownload.py downloads direct, physionet, physionet_zip, url and zenodo sets, prints the notes of manual, private and script sets, and leaves a library set to the project that loads it. Primary HPC home: faesayl@...:~/data  (compute nodes have NO internet, so log in to a LOGIN node to (re)download). Caches/npz are rebuilt from raw per-project.
25,34c25,49
<   - { field: key,         type: text,     required: true, label: "Dataset key" }
<   - { field: name,        type: text,     required: true }
<   - { field: modality,    type: text }
<   - { field: themes,      type: tags,     help: "Modality theme keys (facet filter), listed in config/vocab.yml data_themes" }
<   - { field: description, type: textarea }
<   - { field: size,        type: text }
<   - { field: hpc_path,    type: text,     label: "HPC path" }
<   - { field: access,      type: text,     help: "open / credentialed / DUA ..." }
<   - { field: source,      type: text,     help: "Source URL" }
<   - { field: retrieval, type: raw, help: "fetch recipe (raw JSON: method / notes / files / ...)" }
---
>   - { field: key,         type: text,     required: true, label: "Dataset key", help: "The dataset's key, used by a project's datasets list and as its folder name under ~/data." }
>   - { field: name,        type: text,     required: true, help: "The dataset's full name." }
>   - { field: modality,    type: text, help: "The kind of signal or data the set holds." }
>   - { field: themes,      type: tags,     from: vocab.data_themes, help: "Modality theme keys from the data_themes list of tools/oculus/config/catalogs/vocab.yml; the Data view filters by them." }
>   - { field: description, type: textarea, help: "What the dataset contains and why the hub uses it." }
>   - { field: size,        type: text, help: "How large the set is, as text." }
>   - { field: hpc_path,    type: text,     label: "HPC path", help: "Where the set lives on the cluster and locally." }
>   - { field: access,      type: select,   from: vocab.data_access, help: "How the data is obtained: open, behind a registration, credentialed (a data use agreement) or private." }
>   - { field: source,      type: text,     help: "The web address of the dataset's source." }
>   - field: retrieval
>     type: records
>     help: "How the set comes back: the method tools/data/redownload.py follows and the notes it prints."
>     fields:
>       - { field: method, type: select, options: [direct, library, manual, physionet, physionet_zip, private, script, url, zenodo], required: true, help: "The recipe redownload.py follows to fetch the set." }
>       - { field: notes, type: textarea, help: "The steps a person follows when no command fetches the set." }
>       - { field: base_url, type: text, help: "The web address that file names are joined to, for physionet and direct sets." }
>       - { field: manifest, type: text, help: "The checksum file a physionet set is verified against." }
>       - { field: throttle, type: checkbox, help: "Whether the download is slowed to spare the server." }
>       - { field: priority_first, type: tags, help: "File names fetched before the rest." }
>       - { field: zip_url, type: text, help: "The address of the archive of a physionet_zip set." }
>       - { field: meta_base_url, type: text, help: "The address of the metadata files of a physionet_zip set." }
>       - { field: record, type: text, help: "The Zenodo record number of a zenodo set." }
>       - { field: files, type: tags, help: "The file names a zenodo set holds." }
>       - { field: url, type: text, help: "The address of the one file a url set downloads." }
>       - { field: urls, type: tags, help: "The addresses of the files a url set downloads." }
77c92
<     access: public
---
>     access: open
=== registries/domains.yml
4,6c4,6
<   - { field: key,   type: text,     required: true, label: "Domain key" }
<   - { field: title, type: text,     required: true }
<   - { field: blurb, type: textarea }
---
>   - { field: key,   type: text,     required: true, label: "Domain key", help: "The domain's key, used by a project's domain field." }
>   - { field: title, type: text,     required: true, help: "The domain's name." }
>   - { field: blurb, type: textarea, help: "A sentence on what the domain covers." }
=== registries/organisations.yml
7,9c7,9
<   - { field: key,     type: text,   required: true, label: "Organisation key" }
<   - { field: name,    type: text,   required: true }
<   - { field: kind,    type: select, options: [university, hospital, funder, company, other], required: true }
---
>   - { field: key,     type: text,   required: true, label: "Organisation key", help: "The organisation's key, used by a person's affiliations and a funding scheme's funder." }
>   - { field: name,    type: text,   required: true, help: "The organisation's full name." }
>   - { field: kind,    type: select, options: [university, hospital, funder, company, other], required: true, help: "What kind of organisation it is." }
11c11
<   - { field: links,   type: tags }
---
>   - { field: links,   type: tags, help: "Web addresses of the organisation." }
=== registries/people.yml
8,16c8,16
<   - { field: key,          type: text,     required: true, label: "Person key" }
<   - { field: name,         type: text,     required: true }
<   - { field: affiliations, type: tags,     help: "organisations.yml keys, the primary first" }
<   - { field: role,         type: text,     help: "what this person is to the hub" }
<   - { field: orcid,        type: text }
<   - { field: email,        type: text }
<   - { field: links,        type: tags }
<   - { field: folder,       type: text,     help: "hub-relative folder of a student's supervision files" }
<   - { field: self,         type: checkbox, help: "true on the hub owner's own entry, exactly one" }
---
>   - { field: key,          type: text,     required: true, label: "Person key", help: "The person's key, used by a project's collaborators and by joint work." }
>   - { field: name,         type: text,     required: true, help: "The person's full name." }
>   - { field: affiliations, type: tags,     from: organisations, help: "The organisations the person belongs to, as keys of organisations.yml, the primary first." }
>   - { field: role,         type: text,     help: "What this person is to the hub." }
>   - { field: orcid,        type: text, help: "The person's ORCID identifier." }
>   - { field: email,        type: text, help: "The person's email address." }
>   - { field: links,        type: tags, help: "Web addresses of the person." }
>   - { field: folder,       type: text,     help: "The hub-relative folder of a student's supervision files." }
>   - { field: self,         type: checkbox, help: "True on the hub owner's own entry, which exactly one entry carries." }
=== registries/pillars.yml
27,28c27,28
<   - { field: key,     type: text,     required: true, label: "Pillar key" }
<   - { field: title,   type: text,     required: true }
---
>   - { field: key,     type: text,     required: true, label: "Pillar key", help: "The pillar's key, used by a project's pillar list." }
>   - { field: title,   type: text,     required: true, help: "The pillar's name." }
33c33
<   - { field: blurb,   type: textarea }
---
>   - { field: blurb,   type: textarea, help: "A sentence on what the pillar covers." }
=== registries/repos.yml
6,10c6,10
<   - { field: title,   type: text,     required: true }
<   - { field: sub,     type: text,     label: "Subtitle" }
<   - { field: status,  type: select,   options: [active, finished, archived], required: true }
<   - { field: meta,    type: metalist }
<   - { field: tags,    type: tags }
---
>   - { field: title,   type: text,     required: true, help: "The repository's name." }
>   - { field: sub,     type: text,     label: "Subtitle", help: "A second line under the title." }
>   - { field: status,  type: select,   options: [active, finished, archived], required: true, help: "Whether the repository is active, finished or archived." }
>   - { field: meta,    type: metalist, help: "Label and value rows shown on the card." }
>   - { field: tags,    type: tags, help: "Words the card is filtered by." }
12,13c12,13
<   - { field: note,    type: textarea }
<   - { field: related, type: tags,     help: "Project ids" }
---
>   - { field: note,    type: textarea, help: "Free notes on the repository." }
>   - { field: related, type: tags,     from: projects, help: "Project ids" }
=== registries/resources.yml
6,8c6,8
<   - { field: key,    type: text,     required: true, label: "Resource key" }
<   - { field: name,   type: text,     required: true }
<   - { field: kind,   type: select,   options: [cluster, machine, storage], required: true }
---
>   - { field: key,    type: text,     required: true, label: "Resource key", help: "The resource's key, used by a project's compute list." }
>   - { field: name,   type: text,     required: true, help: "The resource's name." }
>   - { field: kind,   type: select,   options: [cluster, machine, storage], required: true, help: "Whether the resource is a cluster, a machine or storage." }
11c11
<   - { field: links,  type: tags }
---
>   - { field: links,  type: tags, help: "Web addresses of the resource." }
=== registries/venues.yml
9,11c9,11
< # Fields per venue: name | category (journal|conference) | jif | quartile | wos | scopus | format | free
< # | wants (what they like to publish) | link (optional). Conferences also: timing (free-text ~deadline /
< #   ~held) + deadline_month / held_month (3-letter, e.g. Aug) - these drive the timeline ribbon + next-deadlines line.
---
> # Fields per venue: name | category (journal|conference|thesis|meeting) | jif | quartile | wos | scopus | format | free
> # | wants (what they like to publish) | link (optional) | timing (free-text submission window) | deadline | call.
> #   Conferences also: deadline_month / held_month (3-letter, e.g. Aug) - these drive the timeline ribbon + next-deadlines line.
15,34c15,34
<   - { field: name,           type: text,     required: true, label: "Venue name" }
<   - { field: id,             type: text,     help: "Catalogue id (manifests reference it via venue_id)" }
<   - { field: short,          type: text,     label: "Short name" }
<   - { field: category,       type: select,   options_from: venue_categories, help: "journal or conference; the options are the venue_categories list of tools/oculus/config/catalogs/vocab.yml" }
<   - { field: jif,            type: text,     label: "JIF" }
<   - { field: quartile,       type: text }
<   - { field: tier,           type: select,   options_from: venue_tiers, help: "prestige tier (curated, not JIF); the options are the venue_tiers list of tools/oculus/config/catalogs/vocab.yml" }
<   - { field: wos,            type: text,     label: "WoS", help: "Web of Science indexing note" }
<   - { field: scopus,         type: text }
<   - { field: format,         type: text,     help: "e.g. elsarticle / ieee" }
<   - { field: free,           type: text,     help: "Open-access / APC note" }
<   - { field: wants,          type: textarea, help: "Scope / what the venue wants" }
<   - { field: themes,         type: tags,     help: "Theme words, listed in config/vocab.yml venue_themes" }
<   - { field: link,           type: text }
<   - { field: timing,         type: text,     help: "Conference: submission window" }
<   - { field: deadline,       type: date,     help: "Conference: next deadline" }
<   - { field: deadline_month, type: text,     help: "Conference: typical deadline month" }
<   - { field: held_month,     type: text,     help: "Conference: typical month held" }
<   - { field: call,           type: text,     help: "Conference: call-for-papers URL" }
<   - { field: email,          type: text }
---
>   - { field: name,           type: text,     required: true, label: "Venue name", help: "The venue's full name." }
>   - { field: id,             type: text,     help: "The catalogue id that a project's venue_id names." }
>   - { field: short,          type: text,     label: "Short name", help: "The venue's short name or acronym." }
>   - { field: category,       type: select,   from: vocab.venue_categories, help: "The kind of venue: a journal, a conference, a thesis or a meeting." }
>   - { field: jif,            type: text,     label: "JIF", help: "The journal impact factor as text." }
>   - { field: quartile,       type: text, help: "The quartile of the venue in its category." }
>   - { field: tier,           type: select,   from: vocab.venue_tiers, help: "The prestige tier, curated by hand and not taken from the JIF." }
>   - { field: wos,            type: text,     label: "WoS", help: "Web of Science indexing note." }
>   - { field: scopus,         type: text, help: "Scopus indexing note." }
>   - { field: format,         type: text,     help: "The LaTeX document class or template, such as elsarticle or ieee." }
>   - { field: free,           type: text,     help: "Open-access and article processing charge note." }
>   - { field: wants,          type: textarea, help: "The scope of the venue and what it wants to publish." }
>   - { field: themes,         type: tags,     from: vocab.venue_themes, help: "Theme words from the venue_themes list of tools/oculus/config/catalogs/vocab.yml." }
>   - { field: link,           type: text, help: "The venue's web address." }
>   - { field: timing,         type: text,     help: "When submissions are open, as text." }
>   - { field: deadline,       type: date,     help: "The next submission deadline." }
>   - { field: deadline_month, type: text,     when: { category: conference }, help: "The month the deadline usually falls in, as a three-letter name." }
>   - { field: held_month,     type: text,     when: { category: conference }, help: "The month the conference is usually held in, as a three-letter name." }
>   - { field: call,           type: text,     help: "The call-for-papers web address." }
>   - { field: email,          type: text, help: "The editorial office's email address." }
1020a1021
>     category: thesis
1028a1030
>     category: thesis
1036a1039
>     category: meeting
=== tasks/tasks.yml
7,9c7,9
<   - { field: title,    type: text,     required: true }
<   - { field: status,   type: select,   options: [todo, doing, done, dropped], required: true }
<   - { field: deadline, type: date }
---
>   - { field: title,    type: text,     required: true, help: "What the task is." }
>   - { field: status,   type: select,   options: [todo, doing, done, dropped], required: true, help: "Whether the task is to do, in progress, done or dropped." }
>   - { field: deadline, type: date, help: "The day the task is due; it shows on the Focus radar while live." }
11,12c11,12
<   - { field: note,     type: textarea }
<   - { field: tags,     type: tags }
---
>   - { field: note,     type: textarea, help: "Free notes on the task." }
>   - { field: tags,     type: tags, help: "Words the card is filtered by." }
=== tools/data/redownload.py
155c155,156
<     """Direct file download(s) from `retrieval.url` (or `urls:` list) via wget -c."""
---
>     """Direct file download(s) from `retrieval.url`, the `urls:` list, or `base_url` plus each
>     `priority_first` name, via wget -c."""
157d157
<     ensure_dir(dest, dry)
158a159,166
>     if not urls and r.get("base_url"):
>         base = r["base_url"].rstrip("/") + "/"
>         names = r.get("priority_first") or []
>         urls = [base + name for name in names]
>         # An hpc_path that names one of the files is that file's place; its folder is the target.
>         if os.path.basename(dest) in names:
>             dest = os.path.dirname(dest)
>     ensure_dir(dest, dry)
160c168
<         print("  ! retrieval.method 'url' but no url(s) given - skipping."); return
---
>         print(f"  ! retrieval.method '{r['method']}' but no url(s) given - skipping."); return
222c230
<         if method in ("manual", "private"):
---
>         if method in ("manual", "private", "script"):
237c245
<         elif method == "url":
---
>         elif method in ("url", "direct"):
```

## Added help lines

87 fields of the base lacked a help line, 0 now (a Python `yaml.safe_load` walk of each file's `schema:` block, base against worktree): `applications/applications.yml` 8, `education/education.yml` 4, `feeds/position-leads.yml` 10, `funding/funding.yml` 6, `network/events.yml` 7, `network/joint-work.yml` 5, `tasks/tasks.yml` 5, `registries/boilerplate.yml` 4, `registries/data.yml` 6, `registries/domains.yml` 3, `registries/organisations.yml` 4, `registries/people.yml` 5, `registries/pillars.yml` 3, `registries/repos.yml` 6, `registries/resources.yml` 4, `registries/venues.yml` 7. Total 87; `fields 198 without help 0` over all 19 hub files.

## The 23 checks of `validate()`

| # | Check of the base | State | By |
|---|---|---|---|
| 1 | `checkKeys` | replaced | the manifest schema's undeclared-key rule (`additionalProperties: false`); the retired spelling `program` stays a named finding (`RENAMED_FIELDS`) |
| 2 | `checkType` | replaced | the `type` field's options from `vocab.types` |
| 3 | `checkFocus` | replaced | `focus` from `vocab.focus_lanes` |
| 4 | `checkShapes` | replaced | the field types; the bare-key part of it is kept as `checkRelationShapes` |
| 5 | `checkReferences` (`REFERENCES`) | replaced | each reference field's `from` |
| 6 | `checkSelfRelated` | kept | a project naming itself in `related:` |
| 7 | `checkClusterFolder` | kept | `paths.cluster` through the folder rule |
| 8 | `checkCollaborators` | replaced | `collaborators` from `people` |
| 9 | `checkWaitingOn` | kept | the `waiting-on` entries naming people or projects |
| 10 | `checkChips` | replaced | `status.chips` from `vocab.status_legend` |
| 11 | `checkFolderNames` | kept | two manifests under folders of one name |
| 12 | `checkPeople` | kept | the retired `affiliation` and exactly one `self`; the affiliations' references are replaced by `affiliations` from `organisations` |
| 13 | `checkOrganisations` | replaced | `kind` options in `organisations.yml` |
| 14 | `checkResources` | kept | `validate-kinds.ts` |
| 15 | `checkJointWork` | replaced | `person` from `people`, required, in `joint-work.yml` |
| 16 | `checkFunders` | replaced | `funder` from `organisations` in `funding.yml` |
| 17 | `checkFundingIdentity` | kept | key or title for an entry |
| 18 | `checkFundingStatements` | kept | an awarded scheme's statement |
| 19 | `checkEntryStatus` | kept | an entry's status in its vocabulary |
| 20 | `checkEntryIdentity` | kept | an entry's id |
| 21 | `checkCollectionSchema` | replaced | the `schema:` block's own rule in `schema/run.ts` (`schema_malformed`, the field-level findings of case 24) |
| 22 | `checkHostStatus` | replaced | `status` from `vocab.career_host_status` in `career.yml` |
| 23 | `checkThemes` | replaced | `themes` from `vocab.data_themes` and `vocab.venue_themes`; the retired `theme_labels` part is kept as `checkRetiredLabels` |
| | `checkReferences` | replaced | (row 5) |

That is 13 replaced and 10 kept of the 23, plus `checkRelationShapes` and `checkRetiredLabels` as the two kept parts of rows 4 and 23.

## Doc text

For `agents/guarded.md` (the main checkout; this step writes nothing there):

- G36's sentence ends: "... one TypeScript server its TypeScript and JavaScript tabs, one Svelte server its Svelte tabs and one yaml-language-server its YAML tabs (a `.yml` and a `.yaml` tab of one root share it)."
- G7's Code line (`guarded.md:26`): `src/routes/api/` commands, hpc, open; `src/lib/server/machine/lsp/servers.ts`, `src/lib/server/machine/lsp/adapters/pyright/interpreter.ts`; `src/lib/server/machine/lsp/adapters/web/svelte-adapter.ts`, `src/lib/server/machine/lsp/adapters/web/typescript-adapter.ts`.
- G55's Code line (`guarded.md:38`): `src/lib/server/machine/lsp/adapters/web/svelte-adapter.ts`, `src/lib/server/machine/lsp/adapters/web/typescript-adapter.ts`, `src/lib/server/machine/lsp/adapters/web/approval.ts`, `src/lib/server/machine/lsp/adapters/web/config-files.ts` and `src/lib/server/machine/approvals/approvals.ts`.
- G13's Code line (`guarded.md:138`, not `:135`): `... ; src/lib/server/machine/lsp/adapters/clangd/cpp-file.ts`.
- G12's Code line (`guarded.md:135`): `config/`, `config/catalogs/`, `config/schemas/`, since `config-folder.test.ts` now covers the schemas folder.

## Edits to existing assertions

| File | Edit |
|---|---|
| `tests/checks/config/config-folder.test.ts` | the own-file list includes `schemas/`; the per-catalog table names `schemas/manifest-schema.yml` and the three new schema files; a new case passes every config file through its matched schema |
| `tests/checks/config/integrity.test.ts` | `buildPortfolio(hub, config)` becomes `buildPortfolioWithSchemas(hub, config).snapshot` |
| `tests/checks/source/keys.test.ts` | the description keys are read from `catalogs/` and `schemas/` |
| `tests/data/real-hub.probe.ts` | the same build call |
| `tests/data/snapshot/cluster-folder.test.ts`, `resources.test.ts`, `tests/data/sources/personal.test.ts` | the same build call |
| `tests/data/snapshot/resources.test.ts` | the scalar `compute:` case asserts `findings.schema.type` with `findings.schema.is_list` instead of `findings.validate.must_be_list_or_null` |
| `tests/data/snapshot/normalise.test.ts` | `options_from: 'venue_categories'` becomes `from: 'vocab.venue_categories'` |
| `tests/data/sources/config/catalog/options.test.ts` | `description` becomes `help`, `values_from` becomes `from` |
| `tests/server/edit/writes.test.ts` | a comment names `config/schemas/manifest-schema.yml` |
| `tests/server/machine/lsp/cpp-file.test.ts` | the import and the comment follow `adapters/clangd/` |
| `tests/server/machine/lsp/lifetime.test.ts` | a row for the YAML server's lifetime |
| `tests/server/machine/lsp/servers.test.ts` | the import follows `adapters/pyright/`; the page opens a `.yml` file; the spawn count is 5; one row for the YAML argument array with `--permission` and `--allow-fs-read` |

## unused-exports, folder check, history words

- `sh utils/unused-exports.sh` against `M8-base/tools/oculus/unused-exports.txt`: `Unused exports (248)` against `(249)`; the set difference has no entry only in the worktree. Entries only in the base: `RENAMED_FIELDS`, `schemaKeys` (validate.ts), `AGENTS`, `AGENT_FLAGS` (catalog/agents.ts), `SIDE_TIER` (manifests.ts).
- `sh utils/folder-check.sh`: exit 0.
- A grep for `previously|formerly|used to|no longer|legacy|reverted|the old|until now` over every added line of `src`, `tests`, `config`, `docs`, `DESIGN.md`, `README.md` and `DATA-MAP.md` returns seven lines; each states current behaviour ("the library file is no longer open", "a key that no longer matches approves nothing", "a value the file no longer holds", "the root is no longer served", "would be answered from the old text" in `held.ts` for a cached parse) and none states a change.

## Docs

Changed: `docs/DATA-MAP.md` (+102 -75; the schema vocabulary, the generated JSON Schemas, the rules list including the unread-source rule and the bare-key rule with its six manifest fields, the config-folder rows), `DESIGN.md` (+7 -6: lines 23, 24, 44, 91, 166, 573), `README.md` (+1 -1: the two new dependencies), `docs/files-and-search.md` (+3 -3), `docs/configuration.md` (+5 -2: the `schemas/` folder and its files), `docs/views.md` (+1 -1), `docs/apps.md` (+1 -1: `from?` and the new fields). Still true and unchanged: the remaining sections of each file, read against the code for the paths and keys they name.

## Anything wrong or impossible in the brief

- The brief's line numbers offset by 3 for G13 (`guarded.md:138`).
- Case 37 as written describes the Settings view; the editor treats a page-held source as any text (judgment call above).
- `picai --dry-run` ends in `KeyError: 'record'` in the base and the worktree alike.
- `test:quick` took 47.2 s against its 45.0 s limit and still printed `checks: 1 commands passed`.

## Instructions followed

The verify list ran from `tools/oculus` in the worktree with the coordinator's command; no git command was run by the step other than one `git status` run by mistake after the coordinator's second correction (read-only; it failed through a pipe error and had no effect). The base copy was read with `diff -rq` and `diff -u`. Nothing was written in the main checkout. Full-list runs: 2.
