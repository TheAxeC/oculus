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
| 16 | Through the server's own answers (`e2e/case16.ts`: a real `Relay` over yaml-language-server 1.24.0; each of the six files opened with its own text plus `zzbogus: 1`, then, after a close, with an empty text, completion at the top of the file). Marks: `Property zzbogus is not allowed.` on all six. Top-level completion: `side-projects/residual/project.yml` `title,object,status,eli5,next,links`; `ordo:.oculus/project.yml` the same six; `deck/present.yml` `deck,defaults,groups,order`; `projects/manuscripts/raw-pls/present/present.yml` `deck,defaults,groups,order`; `tools/oculus/config/present.yml` `defaults` (the options schema's `present.yml` section); `tools/oculus/config/text/views/academic/present.yml` `text,object` (the text schema). The two config files are not given the deck schema. |
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
| 32 | Through the server's own answers (`e2e/case32.ts`, `.oculus/settings.yml` of a repository root opened once for each text, with a close between). Opened with `languages:` / `yaml:` and an empty record: completion in the record offers 7 fields, `tab_size, insert_spaces, word_wrap, rulers, format_on_save, trim_trailing_whitespace, final_newline`. Opened with `tab_size: -3` and `final_newline: maybe`: marks at line 3 `Value is below the minimum of 1.` and line 4 `Incorrect type. Expected "boolean".`. The top-level `editor:` mark and `app.yml` keys are `run10.ts`/`run9.ts`/`run11.ts` (earlier lines of this table); `tests/data/sources/config/repo-settings.test.ts` is not landed (see "Tests not landed"). |
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

New files outside `src`: `config/schemas/cpp-schema.yml` (18), `deck-schema.yml` (23), `manifest-schema.yml` (77), `side-project-schema.yml` (15); tests `tests/data/snapshot/schema-rules.test.ts` (151), `tests/data/snapshot/relation-shapes.test.ts` (92), `tests/server/machine/lsp/versions.test.ts` (136), `tests/server/root/config-cache.test.ts` (84), `tests/views/sources/repositories/diff/diff-read.test.ts` (42). `config/catalogs/manifest-schema.yml` moved to `config/schemas/manifest-schema.yml`. `server/machine/lsp/` holds 10 items.

## Judgment calls

- **The YAML server needs `workspaceFolders: true` in the initialize capabilities, and only it gets it** (`ServerEntry.clientWorkspace` at `src/lib/server/machine/lsp/servers.ts:152`, set on the YAML entry at `:558` and spread into `initializeParams` at `:629`, beside `clientTextDocument`). yaml-language-server's `initialized` handler throws when the client lacks `workspace.workspaceFolders`, which skips registering its configuration handler, so a schema republish (`workspace/didChangeConfiguration`) revalidated nothing. With it set, a key added to `people.yml` reaches an open manifest (case 12). The other four servers get the initialize request they got on the base (`configuration: true`, no `workspaceFolders`).
- **A reopened document keeps counting versions upward** (`Held.#sent`, `Held.versioned` in `held/held.ts`, `Doc.shift`): the YAML server caches its parse per URI and version, and a page reopening a document at version 1 after close was answered from the earlier text. The shift is added to the page's version on every change, and taken off every version a server names toward the page (`Held.pageVersions` in `held/held.ts`, applied in `relay.ts` to an answer, to a `workspace/applyEdit` request and to diagnostics), so an edit computed after a close and reopen passes the page's `staleFile` check. `tests/server/machine/lsp/versions.test.ts` covers both (guarded entry G63).
- **A source that does not parse gives no list** (`Lists` returns `null`, `unreadSources` in `schema/lists.ts`): a value naming a registry that failed to parse is not marked, and the registry's own parse error is the finding (case 13). Without it every reference to an unparsable registry carried a false mark.
- **`checkRelationShapes` is kept in `validate.ts`** for the six relation fields of a manifest (`domain`, `pillar`, `datasets`, `related`, `collaborators`, `waiting-on`): the schema passes a bare `key:` for every type, and these lists are read as lists downstream. A bare key or, for `waiting-on`, a non-list is one finding in the sentence of `findings.schema.type`. `docs/DATA-MAP.md` says so next to the bare-key rule.
- **`buildPortfolio` is removed.** `buildPortfolioWithSchemas` (defaults for version, roots and checker) is the one build; the seven tests that called `buildPortfolio` call it and read `.snapshot`. This ends an export that nothing in `src` used.
- **`RENAMED_FIELDS` moved to `src/lib/data/helpers/hub-names.ts`** so that `schema/check.ts` does not import `validate.ts` while `validate.ts` imports `schema/check.ts`.
- **Exports the step no longer needs are file-local or removed** (`SIDE_TIER`, the eight catalog file shapes, `vocabKeys`, `FIELD_TYPES`, `isPicked`, the schema root keys, `schemaNameOf`, `SCHEMAS_GROUP`, `JOINT_WORK`, `PERSON_FIELD`; `pathsOf`, `namedSchemaShape` and `noSchemas` deleted), so that `sh utils/unused-exports.sh` lists no entry the base file lacks.
- **`wallpapers` in the editor.** A `from` naming a source held by the page (the wallpaper folder) is offered by the Settings view and treated as any text by the editor, which has no page state (case 37 as written describes the Settings view).
- **`vocabCatalog`** reads the `VOCAB_KEYS` across `vocab.yml` and `appearance.yml`, so `vocab.<key>` resolves in both.
- **`venues.yml` is read both as a registry and as a collection**, so a parse failure of it is reported twice (case 36; the base does the same).
- **Tests in the tree that are not guarded entries of the first round:** `versions.test.ts` (G63) and `relation-shapes.test.ts` (G64), which fail on the unchanged tree (the base has no YAML server and no `buildPortfolioWithSchemas`). **Tests not landed:** `repo-settings.test.ts` and the `servers.test.ts` row for the initialize capabilities, whose text is under "Tests not landed" in "Repair round 1".
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
- G12's Code line (`guarded.md:135`): `config/`, `config/catalogs/`, `config/schemas/`, `src/lib/data/shapes/catalog-files.ts`, `src/lib/data/shapes/shape-issues.ts`, since `config-folder.test.ts` now covers the schemas folder and the shape findings of the catalogs and text files.

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
| `tests/checks/config/config-folder.test.ts` (repair round 1) | one table `words a part of %s its shape refuses`, four rows (a stray key of `meta.yml`, a list for the `icons` map, a number for the `status_palette` map of `vocab.yml`, a stray top-level key of a text file), each asserting the file, the key and the catalog sentence |
| `tests/data/sources/config/catalog/options.test.ts` (repair round 1) | one describe `the options file shape in loadConfig` with a stray key of an options entry (named by the shape) and an unknown control (left to `optionFindings`, no second finding) |

## unused-exports, folder check, history words

- `sh utils/unused-exports.sh` against `M8-base/tools/oculus/unused-exports.txt`: `Unused exports (248)` against `(249)`; the set difference has no entry only in the worktree. Entries only in the base: `RENAMED_FIELDS`, `schemaKeys` (validate.ts), `AGENTS`, `AGENT_FLAGS` (catalog/agents.ts), `SIDE_TIER` (manifests.ts).
- `sh utils/folder-check.sh`: exit 0.
- A grep for `previously|formerly|used to|no longer|legacy|reverted|the old|until now` over every added line of `src`, `tests`, `config`, `docs`, `DESIGN.md`, `README.md` and `DATA-MAP.md` returns seven lines; each states current behaviour ("the library file is no longer open", "a key that no longer matches approves nothing", "a value the file no longer holds", "the root is no longer served", "would be answered from the old text" in `held.ts` for a cached parse) and none states a change.

## Docs

Changed: `docs/DATA-MAP.md` (+102 -75; the schema vocabulary, the generated JSON Schemas, the rules list including the unread-source rule and the bare-key rule with its six manifest fields, the config-folder rows), `DESIGN.md` (+7 -6: lines 23, 24, 44, 91, 166, 573), `README.md` (+1 -1: the two new dependencies), `docs/files-and-search.md` (+3 -3), `docs/configuration.md` (+5 -2: the `schemas/` folder and its files; the shape findings of catalog and text files), `docs/views.md` (+1 -1), `docs/apps.md` (+1 -1: `from?` and the new fields). Still true and unchanged: the remaining sections of each file, read against the code for the paths and keys they name.

## Anything wrong or impossible in the brief

- The brief's line numbers offset by 3 for G13 (`guarded.md:138`).
- Case 37 as written describes the Settings view; the editor treats a page-held source as any text (judgment call above).
- `picai --dry-run` ends in `KeyError: 'record'` in the base and the worktree alike.
- `test:quick` printed `24.6 s (limit 45.0 s)` and `checks: 1 commands passed` in the last run of repair round 1.

## Instructions followed

The verify list ran from `tools/oculus` in the worktree with the coordinator's command; no git command was run by the step other than three read-only runs by mistake (a `git status` after the coordinator's second correction, a `git status` and a `git diff --stat` in repair round 1), each with its output discarded and no effect. The base copy was read with `diff -rq` and `diff -u`. Nothing was written in the main checkout. Full-list runs: 2.

## Repair round 1

All 14 rulings of `agents/briefs/M8-round1.md` are done, with the coordinator's change to ruling 2 applied: `versions.test.ts` and `relation-shapes.test.ts` are in the tree (G63, G64) and `repo-settings.test.ts` and the `servers.test.ts` row are not. Two points the orchestrator may want to rule on are stated first, because they are choices inside a ruling:

- Ruling 1 (Spec 1). Each catalog file and each text file is parsed once with its whole-file shape at the merge (`src/lib/data/sources/config/merge.ts:202`), which is where a file's own content exists; the readers the ruling lists (`vocabCatalog`, `readCatalog`, the glyph, icon, meta, nesting, agents and latex readers) still read the merged map, because the merged map joins `vocab.yml` and `appearance.yml` and the merge is the only place a single file's content is held. A reader that holds a key table of its own now takes it from the shape (`catalog/agents.ts:41` from `AGENT_FILE_KEYS`). If the ruling meant that each reader open its own file and parse it there, that is a different design and needs a ruling.
- Ruling 7 (Behaviour 4) and ruling 10 (Standards 2) widen the client row of the layer table in `tests/checks/tree/boundaries.test.ts` by three entries, `data/helpers/hub-names`, `data/helpers/files/private-folders` and `data/shapes/vocab-keys`, each with its reason in the file's head comment. The client row is where each pure data module the page reads is listed; the entries are the edit to an existing allow list that `agents/spec.md:59` asks to be listed.

### The 14 items

| # | Ruling | Done | File and line | Command that shows it |
|---|---|---|---|---|
| 1 | Spec 1: the catalogs and text files read through their whole-file shapes, a finding per issue | yes | `shapes/catalog-files.ts:283-375` (`CatalogFile.owned`, `fileShapeOf`, `AGENT_FILE_KEYS`), `shapes/shape-issues.ts` (new, 99 lines), `sources/config/merge.ts:202-208`, `catalog/agents.ts:41`, `config/text/findings.yml:79-83` (`findings.config.shape_unknown`, `shape_type`, `shape_value`, `shape_form`, `shape_other`) | `npx vitest run tests/checks/config/config-folder.test.ts` 25 passed (new table `words a part of %s its shape refuses`, 4 rows), `npx vitest run tests/data/sources/config/catalog/options.test.ts` 3 passed (new describe `the options file shape in loadConfig`); the real config folder gives no finding (`merges without a finding, so no key is defined in two files`, same file) |
| 2 | Spec 2 as amended by the coordinator (open item 8 a): `versions.test.ts` and `relation-shapes.test.ts` stay in the tree as G63 and G64; `repo-settings.test.ts` and the `servers.test.ts` workspace-folders row are taken out | yes | in the tree: `tests/server/machine/lsp/versions.test.ts` (136 lines, two rows, the second is the row for item 4) and `tests/data/snapshot/relation-shapes.test.ts` (92 lines); deleted: `tests/data/sources/config/repo-settings.test.ts`; the row 'tells every server its client can have workspace folders, which the YAML server needs to pull its settings' removed from `tests/server/machine/lsp/servers.test.ts` (158 lines now) | `npx vitest run` of each of the two kept files (output below); `ls tests/data/sources/config/repo-settings.test.ts` prints `No such file or directory`; `grep -n "workspace folders" tests/server/machine/lsp/servers.test.ts` prints nothing; full texts of the two taken out under "Tests not landed" |
| 3 | Spec 3: `workspaceFolders` on the YAML entry alone | yes | `servers.ts:152` (`clientWorkspace?`), `:558` (the YAML entry sets `{ workspaceFolders: true }`), `:629` (`...entry.clientWorkspace` in `initializeParams`) | the stub-spawn run below |
| 4 | Behaviour 2: versions mapped back toward the page | yes | `held/held.ts:305-317` (`Held.pageVersions`), `relay.ts:708` (answers), `:741` (`workspace/applyEdit`), `:800` (diagnostics) | the relay-harness run below |
| 5 | Behaviour 1: the Data view's edit form | yes | `state/boards/collection.ts:614` (`kindShape` maps `records` to `raw`), `:710-714` (`vocabOptions` reads a map's keys), `state/forms/schema.ts:190` (`vocabChoices`), `data/shapes/vocab-keys.ts` (new, the one `vocabKeys` that `snapshot/schema/lists.ts:22` also reads) | `node r1/form-refuse.mjs` and `form-save2.mjs` below |
| 6 | Behaviour 3: the radar declares `dismissed` | yes | `feeds/literature-radar.yml:28` | `radar-dismiss.mjs` below; `npx vitest run tests/checks/config/integrity.test.ts` 8 passed |
| 7 | Behaviour 4: `secrets` and `~/.oculus` refused | yes | `data/helpers/files/private-folders.ts` (new, the one definition, read by `library/rules.ts:41` `withheldFolders`), `adapters/yaml/machine-file.ts:36` (`isPrivateFile`), `servers.ts:562` (`refuses`), `state/system/config/config-files.ts:26` (`isWithheldFile`), `views/sources/source/language/lsp.ts:126`, `docs/files-and-search.md:85` and `DESIGN.md:573` | the `secrets/a.yml` run below |
| 8 | A schema ajv cannot compile is a finding | yes | `snapshot/schema/check.ts:384-393`, `config/text/findings.yml:173` (`findings.schema.not_compiled`), `docs/DATA-MAP.md:395` | `node r1/item8.mjs` below |
| 9 | Standards 1 | yes | `DESIGN.md:538`, `utils/migrations/rename-program-to-pillar.ts:17` | the `node -e "import(...)"` load and the greps below |
| 10 | Standards 2: one definition of the two root words | yes | `data/helpers/hub-names.ts:10,19` (`HUB_ROOT`, `ENGINE_ROOT`); imported by `server/files/files.ts:26`, `state/sources/explorer/view/place.ts:11`, `adapters/yaml/machine-file.ts:12`, `snapshot/schema/set.ts:11`, `data/index.ts:25`, `state/system/apps/methods.ts`, `views/shared/card/card.ts`, `views/shared/card/CardDocs.svelte`, `views/boards/focus/lanes/Lanes.svelte` | the greps below |
| 11 | Standards 3: `registries/career.yml` lines 1-6 | yes | `registries/career.yml:1-3` (three comment lines, one per paragraph) | `sed -n 1,3p registries/career.yml`; `python3 -c "import yaml; yaml.safe_load(open('registries/career.yml'))"` parses |
| 12 | Standards 4: the `link` help | yes | `funding/funding.yml:16` | `sed -n 16p funding/funding.yml` |
| 13 | Proof 1 and 2: cases 16 and 32 through the server's answers | yes | the two table rows in "Final run of the cases on the finished tree" are replaced | the two runs below |
| 14 | Proof 3: `test:quick` time | no change | | the final run below |


### Item 1 in detail

`shapeIssues(name, content)` (`shapes/shape-issues.ts`) parses a file's content with the shape `fileShapeOf(name)` (`shapes/catalog-files.ts:370`) names for it and returns one issue per refusal, each classified as an unknown key, a wrong kind of value, a word outside the ones a key takes, a text not in the form a key takes, or any other. `loadConfig` (`sources/config/merge.ts:202-208`) turns each issue into a pending finding on the file and the key, worded by `issueText` from the five lines `findings.config.shape_*` of the text catalog, never from the library's message. Each entry of `CATALOG_FILES` carries `owned(key)`, which is true for the keys the file's own reader already words when it drops them (glyph stand-ins under `glyphs`, nesting entries under `patterns`, the four latex tables, the options entry's `control`, `from`, `form`, `heading`, `whole`, `slots` and `help`, every key of `agents.yml`, the `text:` body of a text file), so the shape adds no second finding about the same row. The merge still reads every key of a file the shape refuses part of, so a wrong key costs that key alone.

The failing line of the new rows on the unchanged tree (the rows run in `$SP/h/tools/oculus`, whose `src` is the base): `AssertionError: expected [] to deeply equal [ { file: StringContaining{...}, ... } ]` for the config-folder table and `AssertionError: expected [] to deeply equal [ 'options.behavior.yml.probe.bogus' ]` for the options row.


### Item 3: the initialize capabilities of pyright and of the YAML server (the stub spawn of `lsp-fixture.ts`, probe `r1/zprobe-init.test.ts`)

```
python {"configuration":true,"keys":["didChangeWatchedFiles","configuration","semanticTokens"]}
yaml {"configuration":true,"workspaceFolders":true,"keys":["didChangeWatchedFiles","configuration","workspaceFolders","semanticTokens"]}
c {"configuration":true,"keys":["didChangeWatchedFiles","configuration","semanticTokens"]}
svelte {"configuration":true,"keys":["didChangeWatchedFiles","configuration","semanticTokens"]}
```

`python` is pyright, `yaml` is yaml-language-server. `workspaceFolders` is present for the YAML server alone; `configuration: true` is sent to every server as it was.


### Item 4: the version a server names toward the page (relay harness, `versions.test.ts` row below)

The row opens a file through the in-process relay with a stub server, closes it, opens it again, sends a `textDocument/rename`, and has the stub answer with `documentChanges` naming the server's version and then send a `workspace/applyEdit` request with the same edit. The run of the two files (`npx vitest run tests/server/machine/lsp/versions.test.ts`, then `tests/data/snapshot/relation-shapes.test.ts`):

```
 Test Files  1 passed (1)
      Tests  2 passed (2)
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

On the unchanged tree (`$SP/h/tools/oculus`, the same two files copied in):

```
     x is above every version sent before for the file, after a close and an open again 6ms
     x is the page version again in an answer and in an applyEdit request 5ms
--- Failed Tests 2 ---
TypeError: Cannot read properties of undefined (reading 'messages')
AssertionError: expected 1 to be greater than 1
 Test Files  1 failed (1)
      Tests  2 failed (2)
     x gives one finding for 'a bare domain' 3ms
     x gives one finding for 'a bare pillar' 1ms
     x gives one finding for 'a bare datasets' 1ms
     x gives one finding for 'a bare related' 1ms
     x gives one finding for 'a bare collaborators' 1ms
     x gives one finding for 'a bare waiting-on' 1ms
     x gives one finding for 'a waiting-on written as one text' 1ms
     x gives none for a bare venue_id, funding or compute, which may be empty 2ms
--- Failed Tests 8 ---
TypeError: buildPortfolioWithSchemas is not a function
TypeError: buildPortfolioWithSchemas is not a function
 Test Files  1 failed (1)
      Tests  8 failed (8)
```

The base has no YAML server (the first row's `Cannot read properties of undefined (reading 'messages')`), reopens a document at the page's version (the second row's `expected 1 to be greater than 1`), and has no `buildPortfolioWithSchemas` (every `relation-shapes.test.ts` row fails with `buildPortfolioWithSchemas is not a function`).


### Item 5: the Data view's edit form over the real `registries/data.yml` (my copies of `form-refuse.mjs` and `form-save2.mjs`)

```
access field: {"field":"access","label":"access","kind":"select","options":["open","registration","credentialed","private"],"required":false,"help":"How the data is obtained: open, behind a registration, credentialed (a data use agreement) or private."}
datasets 54 edit form unchanged and saved: {"saves":54}
retrieval form kind: raw
control holds: "{\"method\":\"direct\",\"base_url\":\"https://huggingface.co/datasets/zhengyun21/PMC-Patients/resolve/main/\",\"priority_first\":[\"PMC-Patients-V2.json\"],\"notes\":\"One curl, no credentials. Licence CC-BY-NC-SA-4.0, so it is fetched into ~/d
save sends retrieval = "(raw untouched: not sent)"
write with size changed: changed ["size"] refused []
retrieval kept after the save: true
```

The 54 datasets save unchanged, the `access` field offers `open, registration, credentialed, private`, `retrieval` is the `raw` kind and an untouched one is not sent, and a save that changes `size` leaves the `retrieval` block as it was.


### Item 6: the radar's `dismissed` (`r1/radar-dismiss.mjs` over a scratch copy of the whole hub with `dismissed: true` added to the first entry)

```
as on disk: 0 []
one entry dismissed: 0 []
```

`npx vitest run tests/checks/config/integrity.test.ts`: 8 passed (G14, zero findings on the real hub).


### Item 7: the YAML server is given no file of `secrets` or `~/.oculus` (relay with the stub spawn, `HOME` pointed at a scratch folder, `r1/zprobe-priv.test.ts`)

```
hub/secrets/a.yml: servers started 0, didOpen 0
hub/notes/b.yml: servers started 1, didOpen 1
state/c.yml: servers started 0, didOpen 0
```

`hub/secrets/a.yml` and `state/c.yml` (a root at `$HOME/.oculus`) start no server and give no `didOpen`; `hub/notes/b.yml` starts one and gives one. The page side (`isWithheldFile`, called with the roots and the home folder as the listing gives them):

```
PAGE hub/secrets/a.yml true
PAGE hub/notes/b.yml false
PAGE state/c.yml true
PAGE engine/local.yml true
PAGE engine/behavior.yml false
PAGE hub/secretsx/a.yml false
```

The engine's `config/` folder stays served: `engine/behavior.yml` is `false`, only `engine/local.yml` is `true`.


### Item 8: a schema ajv cannot compile (`r1/item8.mjs`)

```
[{"file":"/hub/registries/venues.yml","key":"","message":"the schema venues cannot be compiled, so this file is not checked against it"}]
no schema for the file: []
```


### Item 9: `RENAMED_FIELDS` and the names the step moved

```
$ node -e "import('./utils/migrations/rename-program-to-pillar.ts').then(() => console.log('loaded'))"
loaded
```

`grep -rn RENAMED_FIELDS src tests utils docs DESIGN.md`:

```
src/lib/data/snapshot/schema/check.ts:19:import { RENAMED_FIELDS } from '../../helpers/hub-names.ts';
src/lib/data/snapshot/schema/check.ts:224:            const renamed = at.length === 0 ? RENAMED_FIELDS[name] : undefined;
src/lib/data/helpers/hub-names.ts:59:export const RENAMED_FIELDS: Record<string, string> = { program: 'pillar' };
utils/migrations/rename-program-to-pillar.ts:17:import { RENAMED_FIELDS } from '../../src/lib/data/helpers/hub-names.ts';
utils/migrations/rename-program-to-pillar.ts:82:    const [from, to] = Object.entries(RENAMED_FIELDS)[0];
DESIGN.md:538:- One word for a research line: pillar. The word is the same on every surface, in the file (`registries/pillars.yml`, `pillars_file`), the registry and the collection key (`pillars`), th
```

Greps over `src tests utils docs DESIGN.md README.md config ../../docs/DATA-MAP.md` for every name the step removed or moved (`grep -rnF`, one heading per name; a heading with no line under it has no hit):

```
== HUB_KEY
== PERSON_FIELD
src/lib/data/snapshot/normalise.ts:118:const PERSON_FIELD = 'person';
src/lib/data/snapshot/normalise.ts:597:        const key = str(one.fields[PERSON_FIELD]);
== SIDE_TIER
src/lib/data/helpers/hub-names.ts:25:const SIDE_TIER = 'side-projects';
src/lib/data/helpers/hub-names.ts:32:    return (rule.dir.split('/').pop() ?? rule.dir) === SIDE_TIER;
tests/checks/config/integrity.test.ts:136:const SIDE_TIER = 'side-projects';
tests/checks/config/integrity.test.ts:141:        const kind = rule.dir.split('/').pop() === SIDE_TIER ? 'personal' : 'projects';
tests/checks/config/integrity.test.ts:175:        const folders = globSync('*/project.yml', { cwd: join(hub, SIDE_TIER) })
tests/checks/config/integrity.test.ts:185:        expect(snapshot?.findings.filter((finding) => finding.file.includes(SIDE_TIER))).toEqual(
== buildPortfolio
src/lib/server/root/watch/portfolio.ts:26:import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../data/index.ts';
src/lib/server/root/watch/portfolio.ts:602:            const { snapshot, schemas } = buildPortfolioWithSchemas(
src/lib/data/index.ts:228:export function buildPortfolioWithSchemas(
tests/checks/config/config-folder.test.ts:22:import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
tests/checks/config/config-folder.test.ts:590:        const { schemas } = buildPortfolioWithSchemas(HUB.hub, portfolio, 1, [], checker);
tests/checks/config/integrity.test.ts:19:import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
tests/checks/config/integrity.test.ts:157:    const snapshot = present ? buildPortfolioWithSchemas(hub, config).snapshot : null;
tests/data/snapshot/schema-rules.test.ts:3:// and a datasets registry that carry schemas, built through buildPortfolioWithSchemas, and the
tests/data/snapshot/schema-rules.test.ts:10:import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
tests/data/snapshot/schema-rules.test.ts:128:        const found = buildPortfolioWithSchemas(hub, CONFIG).snapshot.findings.filter((finding) =>
tests/data/snapshot/schema-rules.test.ts:145:        const found = buildPortfolioWithSchemas(hub, CONFIG).snapshot.findings;
tests/data/snapshot/cluster-folder.test.ts:3:// through buildPortfolioWithSchemas, and the findings and the project list asserted. The sentence
tests/data/snapshot/cluster-folder.test.ts:8:import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
tests/data/snapshot/cluster-folder.test.ts:46:        const { snapshot } = buildPortfolioWithSchemas(
tests/data/real-hub.probe.ts:12:import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../src/lib/data/index.ts';
tests/data/real-hub.probe.ts:81:const snapshot = buildPortfolioWithSchemas(hub, portfolio).snapshot;
tests/data/snapshot/resources.test.ts:2:// planted in a scratch directory, built through buildPortfolioWithSchemas, and the project's
tests/data/snapshot/resources.test.ts:8:import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
tests/data/snapshot/resources.test.ts:52:    return buildPortfolioWithSchemas(
tests/data/sources/personal.test.ts:12:import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
tests/data/sources/personal.test.ts:80:        const { snapshot } = buildPortfolioWithSchemas(hub, configOver());
== checkOrganisations
== checkThemes
== namedSchemaShape
== schemaKeys
== SchemaKeys
== lsp/pyright/
== lsp/clangd/
== lsp/web/
== catalogs/manifest-schema
== manifest-schema.yml
src/lib/server/edit/writes.ts:12:// manifest-schema.yml names, and one it does not name is refused. A collection entry's text,
src/lib/state/forms/schema.ts:1:// Layer 2, client state. The manifest edit form as data: what config/schemas/manifest-schema.yml
src/lib/state/forms/schema.ts:29:/** One field of the form, in the order config/schemas/manifest-schema.yml lists it. */
src/lib/state/client/selectors.svelte.ts:343:    /** The edit form as config/schemas/manifest-schema.yml describes it, in file order. */
src/lib/data/snapshot/schema/static.ts:34:    { key: 'manifest_schema', file: 'manifest-schema.yml' },
src/lib/data/snapshot/schema/manifest.ts:1:// Layer 1, data. The `manifest_schema` of config/schemas/manifest-schema.yml as the JSON Schema of
src/lib/data/snapshot/validate.ts:64: * maps with a `field` key, a map with a `fields` map inside (what the hub's manifest-schema.yml
src/lib/data/shapes/catalog-files.ts:359:/** config/schemas/manifest-schema.yml: the project edit form as data. */
src/lib/data/model/model-entities.ts:230: * One standing "do this later" note, the manifest's `followup:` (manifest-schema.yml's
src/lib/data/sources/config/catalog/schemas/engine.ts:99:            configRule('schemas/manifest-schema.yml')
src/lib/views/boards/focus/QuickAdd.svelte:61:     * config/schemas/manifest-schema.yml names (a bare `followup:` note in the file is expanded to
src/lib/views/boards/editor/Editor.svelte:16:    // in config/schemas/manifest-schema.yml; "Decisions taken": "Unsaved form input is instance
tests/checks/config/config-folder.test.ts:181:        'schemas/manifest-schema.yml': ['manifest_schema'],
tests/server/edit/writes.test.ts:6:// for writing, and the schema it checks against is the real config/schemas/manifest-schema.yml,
docs/configuration.md:19:| `schemas/manifest-schema.yml` | The project.yml edit form as data: its sections, its fields, the widget each field is edited by, and where a wi
docs/views.md:247:Six views are opened for something rather than listed in the Views catalogue: `project` (one project as its own tab, with a LaTeX panel over its manuscr
config/schemas/manifest-schema.yml:2:# manifest-schema.yml
../../docs/DATA-MAP.md:180:| `project.yml` | the project itself | the file | folder name | folder name | `tools/oculus/config/schemas/manifest-schema.yml` | Projects, Coa
../../docs/DATA-MAP.md:244:| `tools/oculus/config/schemas/manifest-schema.yml` | the `project.yml` edit form as data | `manifestSchemaFileShape` in `tools/oculus/src/lib/
../../docs/DATA-MAP.md:343:| `project.yml` | `type` | it is read from the manifest on a nested tier; on a flat tier the scan rule sets it, and a different written value i
../../docs/DATA-MAP.md:344:| `project.yml` | `outcome`, `doi` | any tier; a published or finished project carries them | the section "Outcome" of `tools/oculus/config/sch
../../docs/DATA-MAP.md:345:| `project.yml` | `focus` | it names a lane of `focus_lanes` on any tier; `holding` only on the tiers `ideas`, `active` and `manuscripts`; an `
../../docs/DATA-MAP.md:346:| `project.yml` | `followup.after` | `followup.do` is also written; the note stays hidden until that date | the help of `followup.after` in `to
../../docs/DATA-MAP.md:364:`year` is in the section Core of `tools/oculus/config/schemas/manifest-schema.yml` and holds on any tier.
../../docs/DATA-MAP.md:373:| `project.yml` | `tools/oculus/config/schemas/manifest-schema.yml` (top-level key `manifest_schema`) |
../../docs/DATA-MAP.md:487:A field of `tools/oculus/config/schemas/manifest-schema.yml` has a `type` (the widget), a `section`, a `label` and optionally `from`, `options`
../../docs/DATA-MAP.md:502:`type` is a `select` from `type_order`. A write refuses `id`, `tier` and `type` on every tier (`READ_ONLY` and `settable` in `tools/oculus/src/
```

Read: every `buildPortfolio` hit is the longer name `buildPortfolioWithSchemas`; `PERSON_FIELD` is a file-local constant of `normalise.ts`; `SIDE_TIER` is a file-local constant of `hub-names.ts` and a second one in `integrity.test.ts`; every `manifest-schema.yml` hit names the file in `config/schemas/`; no `catalogs/manifest-schema` and no `lsp/pyright/`, `lsp/clangd/` or `lsp/web/` path remains.


### Item 10: one definition of the two root words

`grep -rnE "(HUB_ROOT|ENGINE_ROOT) *= *'" src` (the definitions):

```
src/lib/data/helpers/hub-names.ts:10:export const HUB_ROOT = 'hub';
src/lib/data/helpers/hub-names.ts:19:export const ENGINE_ROOT = 'engine';
```

`grep -rnE "import .*(HUB_ROOT|ENGINE_ROOT).* from|export { (ENGINE_ROOT|HUB_ROOT)" src` (the imports and the two re-exports):

```
src/lib/server/content/docs.ts:56:import { HUB_ROOT } from '../files/files.ts';
src/lib/server/content/deck/read.ts:22:import { HUB_ROOT, resolveRootPath, type Root } from '../../files/files.ts';
src/lib/server/edit/writes/config/roots.ts:30:import { ENGINE_ROOT, HUB_ROOT, expandHome, type Root } from '../../../files/files.ts';
src/lib/server/machine/lsp/adapters/yaml/machine-file.ts:12:import { ENGINE_ROOT, HUB_ROOT } from '../../../../../data/helpers/hub-names.ts';
src/lib/server/machine/apps/open.ts:19:import { ENGINE_ROOT, type Root } from '../../files/files.ts';
src/lib/server/machine/apps/scan.ts:24:import { ENGINE_ROOT, type Root } from '../../files/files.ts';
src/lib/server/files/source.ts:48:import { ENGINE_ROOT, resolveRootFileResult, resolveRootPath, type Root } from './files.ts';
src/lib/server/files/roots.ts:9:import { configuredRootsOf, ENGINE_ROOT, expandHome, rootsFrom, type Root } from './files.ts';
src/lib/server/files/fs/ops.ts:67:import { ENGINE_ROOT, resolveRootPath, type Root } from '../files.ts';
src/lib/server/files/fs.ts:49:import { expandHome, HUB_ROOT, resolveRootPath, rootShape, type Root } from './files.ts';
src/lib/server/files/open.ts:36:import { HUB_ROOT, resolveRootPath, type Root } from './files.ts';
src/lib/server/files/files.ts:26:import { ENGINE_ROOT, HUB_ROOT } from '../../data/helpers/hub-names.ts';
src/lib/server/files/files.ts:248:export { ENGINE_ROOT, HUB_ROOT };
src/lib/state/life/present.svelte.ts:35:import { HUB_ROOT, type FsRoot } from '../sources/fs.ts';
src/lib/state/system/config/config-files.ts:8:import { ENGINE_ROOT, HUB_ROOT } from '../../sources/explorer/view/place.ts';
src/lib/state/system/apps/methods.ts:19:import { ENGINE_ROOT } from '../../sources/fs.ts';
src/lib/state/sessions/latex/latex-state.ts:16:import { HUB_ROOT, normalisePath } from '../../sources/fs.ts';
src/lib/state/sessions/latex/builds.ts:36:import { HUB_ROOT } from '../../sources/fs.ts';
src/lib/state/sessions/view-source.ts:13:import { HUB_ROOT } from '../sources/fs.ts';
src/lib/state/workbench/layout/open/show.ts:11:import { HUB_ROOT, nameOf, normalisePath, revealAsked, rootedState } from '../../../sources/fs.ts';
src/lib/state/workbench/navigation/pages.ts:38:import { HUB_ROOT, type RowRef } from '../../sources/explorer/view/place.ts';
src/lib/state/boards/collection.ts:32:import { HUB_ROOT, normalisePath } from '../sources/fs.ts';
src/lib/state/boards/board/personal.ts:18:import { HUB_ROOT } from '../../sources/fs.ts';
src/lib/state/sources/explorer/view/place.ts:11:import { ENGINE_ROOT, HUB_ROOT } from '../../../../data/helpers/hub-names.ts';
src/lib/state/sources/explorer/view/place.ts:16:export { ENGINE_ROOT, HUB_ROOT };
src/lib/data/index.ts:25:import { HUB_ROOT } from './helpers/hub-names.ts';
src/lib/data/snapshot/schema/set.ts:11:import { ENGINE_ROOT, HUB_ROOT } from '../../helpers/hub-names.ts';
src/lib/views/shared/card/CardDocs.svelte:36:    import { HUB_ROOT } from '$lib/state/sources/fs';
src/lib/views/shared/card/card.ts:8:import { HUB_ROOT } from '$lib/state/sources/fs';
src/lib/views/shared/card/ProjectCard.svelte:28:    import { HUB_ROOT } from '$lib/state/sources/fs';
src/lib/views/feeds/linkedin/PostCard.svelte:10:    import { HUB_ROOT } from '$lib/state/sources/fs';
src/lib/views/feeds/linkedin/post-card.ts:4:import { HUB_ROOT } from '$lib/state/sources/fs';
src/lib/views/system/workbench/Settings.svelte:52:    import { ENGINE_ROOT, HUB_ROOT } from '$lib/state/sources/fs';
src/lib/views/system/workbench/settings/EditLink.svelte:7:    import { ENGINE_ROOT } from '$lib/state/sources/fs';
src/lib/views/system/workbench/settings/Item.svelte:27:    import { ENGINE_ROOT } from '$lib/state/sources/fs';
src/lib/views/system/workbench/settings/List.svelte:14:    import { ENGINE_ROOT } from '$lib/state/sources/fs';
src/lib/views/boards/collection/EntryCard.svelte:54:    import { HUB_ROOT, opensInProgram } from '$lib/state/sources/fs';
src/lib/views/boards/person/Person.svelte:39:    import { HUB_ROOT } from '$lib/state/sources/fs';
src/lib/views/boards/focus/lanes/Lanes.svelte:39:    import { HUB_ROOT } from '$lib/state/sources/fs';
src/lib/views/sources/doc/Doc.svelte:66:    import { HUB_ROOT } from '$lib/state/sources/fs';
src/routes/+page.svelte:30:    import { bookmarkRows, HUB_ROOT } from '$lib/state/sources/fs';
```

`grep -rnE "['\"](hub|engine)['\"]" src`, outside `hub-names.ts` (every remaining hit, none a root key):

```
src/lib/server/machine/runs/schedules/file.ts:100:    return folder === 'hub' ? hub : expandHome(folder);
src/lib/server/root/context.ts:742:        if (changed.includes('hub')) {
src/lib/server/root/watch/local.ts:79:    'hub',
src/lib/state/system/docs.svelte.ts:100:const HUB = 'hub';
src/lib/state/system/machine/schedules/schedule.svelte.ts:265:        const folder = runs.folder === 'hub' ? runs.folder : lastSegment(runs.folder);
src/lib/state/system/machine/schedules/schedule.svelte.ts:374:        return ['hub', ...(entities.schedule()?.folders ?? []).slice(1)];
src/lib/state/system/machine/schedules/schedule.svelte.ts:385:            folder: 'hub',
src/lib/state/boards/board/personal.ts:138:    return project.source.kind === 'hub' ? project.source.folder : project.source.key;
src/lib/state/boards/board/personal.ts:143:    if (project.source.kind === 'hub') {
src/lib/state/boards/board/personal.ts:155:    return project.source.kind === 'hub'
src/lib/data/model/model-entities.ts:781:    { kind: 'hub'; folder: string } | { kind: 'root'; key: string; dir: string };
src/lib/data/sources/manifests.ts:320:                    source: { kind: 'hub', folder: hubPath(hub, folderPath) },
src/lib/data/sources/config/local.ts:158:    'hub',
src/lib/data/sources/config/local.ts:461:        const hub = filledAt(record, 'hub');
src/lib/data/sources/config/local.ts:462:        if (hub === undefined) problems.push(wrong('hub', 'a path'));
src/lib/data/helpers/run/schedules.ts:116:    const path = raw.startsWith('/') || raw.startsWith('~/') || raw === 'hub';
```

The hits are the schedules' own `hub` folder keyword (`schedules/file.ts`, `schedule.svelte.ts`, `helpers/run/schedules.ts`), the `hub` key of `local.yml` (`config/local.ts`, `watch/local.ts`, `root/context.ts`), the `kind: 'hub'` discriminant of a project's source (`personal.ts`, `model-entities.ts`, `manifests.ts`) and the `HUB = 'hub'` namespace of the document queries (`docs.svelte.ts`). The test files write `'hub'` and `'engine'` as fixture data.

### Item 13: cases 16 and 32 through the server's answers

Case 16 (`e2e/case16.ts`, a real `Relay` over yaml-language-server 1.24.0):

```
hub:side-projects/residual/project.yml marks ["Property zzbogus is not allowed."]
ordo:.oculus/project.yml marks ["Property zzbogus is not allowed."]
hub:deck/present.yml marks ["Property zzbogus is not allowed."]
hub:projects/manuscripts/raw-pls/present/present.yml marks ["Property zzbogus is not allowed."]
hub:tools/oculus/config/present.yml marks ["Property zzbogus is not allowed."]
hub:tools/oculus/config/text/views/academic/present.yml marks ["Property zzbogus is not allowed."]
hub:side-projects/residual/project.yml completion at the top level 6 ["title","object","status","eli5","next","links"]
ordo:.oculus/project.yml completion at the top level 6 ["title","object","status","eli5","next","links"]
hub:deck/present.yml completion at the top level 4 ["deck","defaults","groups","order"]
hub:projects/manuscripts/raw-pls/present/present.yml completion at the top level 4 ["deck","defaults","groups","order"]
hub:tools/oculus/config/present.yml completion at the top level 1 ["defaults"]
hub:tools/oculus/config/text/views/academic/present.yml completion at the top level 2 ["text","object"]
```

Case 32 (`e2e/case32.ts`, `.oculus/settings.yml` opened once for each text):

```
opened with the record empty: record fields 7 ["tab_size","insert_spaces","word_wrap","rulers","format_on_save","trim_trailing_whitespace","final_newline"]
opened with the two values: marks [[3,"Value is below the minimum of 1."],[4,"Incorrect type. Expected \"boolean\"."]]
```

### Item 14: the final `test:quick`

```
test:quick: 168 changed file(s), from git since HEAD
test:quick: 118 test file(s), 10 essential
test:quick: 24.6 s (limit 45.0 s); every command passed
checks: 1 commands passed
```

### Reruns after the last change

- `npm run format`: exit 0. `npm run lint`: exit 0 (`eslint .`, no problem printed). `npm run check`: exit 0, `COMPLETED 3466 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run diagrams`: exit 0, run after the last change to a file.
- `sh .../land/templates/checks.sh .../orchestrator-state.md`, node v24.21.0 on PATH: `checks: 1 commands passed`, with `test:quick: 24.6 s (limit 45.0 s); every command passed` (item 14: no code change; the time is the one printed).
- `npm run test:checks`: Test Files  17 passed (17) / Tests  248 passed (248).
- `sh utils/folder-check.sh`: exit 0, no output. `sh utils/unused-exports.sh`: `Unused exports (248)` against the base file's `Unused exports (249)`; `diff` of the two lists shows only lines the worktree shortens or drops (`agents.ts` loses `AGENTS` and `AGENT_FLAGS`, `manifests.ts` loses `SIDE_TIER`, `validate.ts` loses its line), so no name is unused that was not unused in the base. `wc -l`: `relay.ts` 864, `held.ts` 667, `servers.ts` 642, `check.ts` 410, `catalog-files.ts` 375, `shape-issues.ts` 99, `private-folders.ts` 23, `vocab-keys.ts` 25, `lsp.ts` 554, `config-files.ts` 56.
- Test files, each run alone with `npx vitest run <file>`, after the last change:

```
== tests/checks/config/config-folder.test.ts
 Test Files  1 passed (1)
      Tests  25 passed (25)
== tests/data/sources/config/catalog/options.test.ts
 Test Files  1 passed (1)
      Tests  3 passed (3)
== tests/server/machine/lsp/servers.test.ts
 Test Files  1 passed (1)
      Tests  4 passed (4)
== tests/server/machine/lsp/versions.test.ts
 Test Files  1 passed (1)
      Tests  2 passed (2)
== tests/data/snapshot/relation-shapes.test.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)
== tests/checks/source/keys.test.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)
== tests/checks/config/integrity.test.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)
== tests/checks/config/config.test.ts
 Test Files  1 passed (1)
      Tests  31 passed (31)
== tests/server/machine/lsp/lifetime.test.ts
 Test Files  1 passed (1)
      Tests  25 passed (25)
== tests/server/machine/lsp/relay.test.ts
 Test Files  1 passed (1)
      Tests  5 passed (5)
== tests/server/machine/lsp/library.test.ts
 Test Files  1 passed (1)
      Tests  36 passed (36)
== tests/data/snapshot/schema-rules.test.ts
 Test Files  1 passed (1)
      Tests  7 passed (7)
== tests/state/system/apps/methods.test.ts
 Test Files  1 passed (1)
      Tests  47 passed (47)
== tests/data/sources/present.test.ts
 Test Files  1 passed (1)
      Tests  4 passed (4)
== tests/routes/docs/deck.test.ts
 Test Files  1 passed (1)
      Tests  3 passed (3)
== tests/views/shared/explorer/opening-apps.test.ts
 Test Files  1 passed (1)
      Tests  10 passed (10)
== tests/server/machine/lsp/cpp-file.test.ts
 Test Files  1 passed (1)
      Tests  18 passed (18)
== tests/checks/tree/boundaries.test.ts
 Test Files  1 passed (1)
      Tests  11 passed (11)
```


### Tests not landed

The two tests below are not in the tree. Each is given as it would read after this round. `versions.test.ts` and `relation-shapes.test.ts` are in the tree under G63 and G64.

#### tests/data/sources/config/repo-settings.test.ts

```ts
// Layer 1, data tests. A repository's `.oculus/settings.yml` as parseRepoSettings reads it: the
// `languages:` records, and every other top-level key skipped and named, so the Languages row of
// the Settings view lists an `editor:` block that the file does not read.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { parseRepoSettings } from '../../../../src/lib/data/sources/config/editor-options.ts';

const MERGED: Record<string, unknown> = { ...loadConfig(engineDir()).config };

describe('parseRepoSettings', () => {
    it('names a top-level key other than languages as skipped, and reads the records', () => {
        const read = parseRepoSettings(
            'editor:\n  tab_size: 2\nlanguages:\n  yaml:\n    final_newline: true\nzzz: 1\n',
            MERGED
        );
        expect(read.kind).toBe('read');
        if (read.kind !== 'read') return;
        expect(read.skipped).toEqual([
            { key: 'editor', where: 'unknown-key' },
            { key: 'zzz', where: 'unknown-key' }
        ]);
        expect(Object.keys(read.languages)).toEqual(['yaml']);
    });

    it('names a top-level key of a file without languages as skipped', () => {
        const read = parseRepoSettings('editor:\n  tab_size: 2\n', MERGED);
        expect(read).toMatchObject({
            kind: 'read',
            skipped: [{ key: 'editor', where: 'unknown-key' }]
        });
    });

    it('skips nothing in a file that holds only languages', () => {
        const read = parseRepoSettings('languages:\n  yaml:\n    final_newline: true\n', MERGED);
        expect(read).toMatchObject({
            kind: 'read',
            languages: { yaml: { finalNewline: true } },
            skipped: []
        });
    });
});
```

#### tests/server/machine/lsp/servers.test.ts, one row of `ROWS`

```ts
    {
        name: 'tells the YAML server alone that its client can have workspace folders, which it needs to pull its settings',
        steps: async () => {
            const dir = awkwardRoot(['a.yml', 'a.py']);
            const spawned = stubSpawn();
            const relay = makeRelay({ roots: () => [{ key: 'repo', dir }], spawn: spawned.spawn });
            const page = { send: () => Promise.resolve(), close: () => undefined };
            open(relay, page, 'lsp:yaml', pageFile('repo', 'a.yml'), 'yaml');
            open(relay, page, 'lsp:python', pageFile('repo', 'a.py'), 'python');
            for (let turn = 0; turn < 30 && spawned.children.length < 2; turn += 1) await settle();
            await settle();
            const workspaceOf = (child: number): Record<string, unknown> => {
                const initialize = spawned.children[child].messages.find(
                    (message) => message.method === 'initialize'
                );
                const params = initialize?.params as {
                    capabilities: { workspace: Record<string, unknown> };
                };
                return params.capabilities.workspace;
            };
            const yaml = workspaceOf(0);
            const pyright = workspaceOf(1);
            expect(yaml.workspaceFolders).toBe(true);
            expect(yaml.configuration).toBe(true);
            expect(pyright.workspaceFolders).toBeUndefined();
            expect(pyright.configuration).toBe(true);
            await relay.close();
        }
    }
```


### Doc text, corrected

For `agents/guarded.md` (the main checkout; this step writes nothing there). These replace the lines of the "Doc text" section above where they name the same entry:

- G3 (`guarded.md:13`) reads: "The content of `config/local.yml` is never served, read into a page or written, and no file under the hub's `secrets` folder or `~/.oculus` is given to a language server." Its Code line adds `src/lib/server/machine/lsp/adapters/yaml/machine-file.ts`, `src/lib/data/helpers/files/private-folders.ts`.
- G12 (`guarded.md:134`) reads "Every shipped config file and catalog reads with no finding, the findings of its whole-file shape included." Its Code line: `config/`, `config/catalogs/`, `config/schemas/`, `src/lib/data/shapes/catalog-files.ts`, `src/lib/data/shapes/shape-issues.ts`. The `config-folder.test.ts` row 'merges without a finding, so no key is defined in two files' is the test.
- G13 (`guarded.md:137`) reads "A wrong config value is refused with a finding that names the key, and its default is used. A key, kind of value or word that the whole-file shape of a catalog or text file refuses is a finding naming the file and the key, and the rest of the file is read." Its Code line adds `src/lib/data/shapes/shape-issues.ts` and `src/lib/data/shapes/catalog-files.ts`; its Test line adds `tests/checks/config/config-folder.test.ts`, 'words a part of %s its shape refuses', and `tests/data/sources/config/catalog/options.test.ts`, 'names a key an entry does not take, and leaves a control to optionFindings'.
- G63 (new entry): "The version a language server is sent for a file is above every version it was sent before for that file, after a close and an open again, and an edit the server sends back reaches the page under the page's own version."
  Code: `src/lib/server/machine/lsp/held/held.ts`, `src/lib/server/machine/lsp/relay.ts`.
  Test: `tests/server/machine/lsp/versions.test.ts`, describe 'the version a document is held at': 'is above every version sent before for the file, after a close and an open again', 'is the page version again in an answer and in an applyEdit request'; written by M8.
- G64 (new entry): "A relation field of a manifest written as a bare key, or `waiting-on` written as one text, gives one type finding naming the field, and a bare `venue_id`, `funding` or `compute` gives none."
  Code: `src/lib/data/snapshot/schema/check.ts`, `src/lib/data/snapshot/schema/`, and the catalog sentences `findings.schema.type`, `findings.schema.is_list`, `findings.schema.is_text` of `config/text/findings.yml`.
  Test: `tests/data/snapshot/relation-shapes.test.ts`, describe 'the relation fields of a manifest': 'gives one finding for %s' (the rows 'a bare domain', 'a bare pillar', 'a bare datasets', 'a bare related', 'a bare collaborators', 'a bare waiting-on', 'a waiting-on written as one text') and 'gives none for a bare venue_id, funding or compute, which may be empty'; written by M8.
- G7's Code line is unchanged from the section above.

The sentences written into the project documents in this round:

- `docs/files-and-search.md:85`: "`config/local.yml`, a file under the hub's `secrets` folder and a file under `~/.oculus` are never sent to the server, and the server reads nothing outside oculus's own `node_modules`." and, earlier in the paragraph, "`yaml-language-server` for every `.yml` and `.yaml` file except the ones named below as never sent to it,".
- `DESIGN.md:573`: "... and `config/local.yml`, a file under the hub's `secrets` folder and a file under `~/.oculus` (the folders `withheldFolders` of `library/rules.ts` names beside the engine's config folder) are sent to no YAML server."
- `DESIGN.md:538`: "... (`src/lib/data/snapshot/schema/check.ts`, over `RENAMED_FIELDS` of `src/lib/data/helpers/hub-names.ts`) ...".
- `docs/DATA-MAP.md:195`: "The Radar view writes a third field, `dismissed`, into a radar entry when a paper is dismissed (`tools/oculus/src/lib/server/edit/feeds.ts`), and `feeds/literature-radar.yml` declares it in its own `schema:`."
- `docs/DATA-MAP.md:395`: "A schema that ajv cannot compile gives one finding for each file it governs, naming the file and the schema, and those files are not checked against it."
- `docs/configuration.md:32`: "A catalog or text file is also read through its whole-file shape (`src/lib/data/shapes/catalog-files.ts`): a key the file does not take, a value of the wrong kind and a word outside the ones a key takes are each a finding that names the file and the key, and the rest of the file is read as written."
- `docs/views.md:247`: `catalogs/manifest-schema.yml` is now `schemas/manifest-schema.yml`.
- Head comments rewritten and still true: `shapes/catalog-files.ts`, `sources/config/merge.ts`, `sources/career.ts`, `model/model-collections.ts`, `adapters/yaml/machine-file.ts`.

Edits to existing assertions and allow lists in this round, from the `diff` against the base copy: the rows under "Edits to existing assertions" above gain `config-folder.test.ts` (one table), `options.test.ts` (one describe) and `servers.test.ts` (the workspace-folders row is taken out); `tests/checks/tree/boundaries.test.ts` gains three entries in the client row (`'data/helpers/files/private-folders'`, `'data/helpers/hub-names'`, `'data/shapes/vocab-keys'`) and the comment paragraph that names them.
