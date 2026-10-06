M8 survey report. main is at `fb7f076f` (`git rev-parse --short HEAD`). Nothing was changed. One npm tarball was unpacked into my scratchpad to read yaml-language-server's source.

**Found outside M8, for the orchestrator first.** `agents/guarded.md` on main has no G36, the language server lifetime entry. `grep -c -E 'G36|lsp|cpp-file|choices\.test|uris\.test|lifetime' agents/guarded.md` prints `0`. D23's report (`agents/reviews/D23-report.md:4687-4709`) lists G36 and the widened G1, G2, G7, G13 and G31 lines. Z479 and Z485 approved them, but the landing never applied them. guarded.md also still names paths that D23 moved:
- `:27`, `:61`, `:69`, `:70` and `:75` name `machine/commands/...`, `machine/schedules/...` and `machine/seeds/...`.
- `ls tests/server/machine/commands/placeholders.test.ts` answers "No such file". The file is now at `tests/server/machine/runs/commands/placeholders.test.ts`.

This matters for M8 because M8 changes `servers.ts`, `relay.ts` and `held.ts`, which G36 would cover.

## 1. Hub YAML files, their `schema:` lines, and the schema formats

**The files.** `git ls-files '*.yml' '*.yaml' | grep -v '^tools/' | wc -l` gives 146. Grepping each for `^schema:` gives 16 files with a block:

| File | Line of `schema:` |
|---|---|
| `applications/applications.yml` | 5 |
| `education/education.yml` | 5 |
| `feeds/position-leads.yml` | 51 |
| `funding/funding.yml` | 5 |
| `network/events.yml` | 5 |
| `network/joint-work.yml` | 8 |
| `registries/boilerplate.yml` | 10 |
| `registries/data.yml` | 24 |
| `registries/domains.yml` | 3 |
| `registries/organisations.yml` | 6 |
| `registries/people.yml` | 7 |
| `registries/pillars.yml` | 26 |
| `registries/repos.yml` | 5 |
| `registries/resources.yml` | 5 |
| `registries/venues.yml` | 14 |
| `tasks/tasks.yml` | 6 |

The other 130 have no `schema:` line:
- 94 `project.yml` manifests. `git ls-files 'projects/**/project.yml' | xargs grep -l '^schema:' | wc -l` gives 0; they are covered by `manifest-schema.yml`.
- 3 side projects: `side-projects/{gpu-game-boy,residual,scripted-os}/project.yml`. Six more side projects sit outside the hub at `~/workspace/{cathedra,game-engine,officium,ordo,scotoma,youtube-downloader}/.oculus/project.yml` (`ls`).
- `registries/career.yml` and `feeds/literature-radar.yml`.
- 26 deck files (`git ls-files '*present.yml' | grep -v '^tools/' | wc -l`): `deck/present.yml` and the project decks.
- `.agents/plan.yaml`, `projects/manuscripts/dongho-ecg-clustering/admin/reviews/commitment-ledger.yml` and three engram `code/configs/*.yaml`.

**Which of the step's named files have no schema today.**
- `registries/career.yml`: none.
- `feeds/literature-radar.yml`: none. It has `meta:` and `entries:`, and its header comment (`:1-11`) describes the buckets.
- The side projects' `project.yml`: none. Their reader is `FIELDS = ['title','status','eli5','next','links']` at `src/lib/data/snapshot/normalise-personal.ts:26`, checked by `personalFindings` (`:156`) against `side_project_status` in `vocab.yml:202`.

**The schema files.** `ls config/catalogs` shows 8 tracked items: `agents.yml`, `file-nesting.yml`, `glyphs.yml`, `icons.yml`, `manifest-schema.yml` (74 lines), `meta.yml`, `options.yml` (1200 lines) and `vocab.yml`. No other schema file exists.

**Format of the hub `schema:` blocks.** Each is a list of flow maps. A Python count over the 16 blocks gives:
- keys: `field` 147, `type` 147, `help` 60, `required` 33, `label` 27, `options` 12, `options_from` 3;
- types: `text` 80, `tags` 18, `textarea` 18, `select` 15, `date` 8, `metalist` 6, `raw` 1, `checkbox` 1.

The reference key `options_from` has two meanings. It names a vocab list in `venues.yml:18` and `:21`, and a registry (`people`) in `joint-work.yml:11`. There is no `when:` key. Conditions are written only in `help` text and header comments.

**Format of `manifest-schema.yml`.** A `sections:` map and a `fields:` map keyed by dotted name, each field carrying `label`, `type`, `section`, `help`, `options` and `from`. The `from:` value names a registry, `people`, `organisations`, `resources`, `projects` or a vocab key (`:16-18`). There is no condition key; the archive condition is only the section name `"Archive (archive tier)"` (`:26`).

**Format of `options.yml`.** It maps a file name to dotted keys, each with `heading`, `section`, `description`, `default` and `control`. The 16 controls are listed at `:10`. Allowed values are `values`, `values_from`, `values_by` or `suggest_from` (sources are `SOURCES` in `catalog/options.ts:76-95`), plus `min`, `max`, `whole`, `form`, `empty`, `allow_missing`, `holds` and family `fields`. Key counts (`grep -o ... | uniq -c`): `control:` 155, `default:` 110, `section:` 156, `values:` 23, `min:` 39, `max:` 27; `description:` occurs 202 times (`grep -c`). The file covers appearance, behavior, layout, present, sources and local (`:15`, `:170`, `:732`, `:966`, `:979`, `:1113`). It does not cover the catalogs or `config/text/`.

The same idea has three key names across these formats:
- the reference: `options_from` (hub files), `from` (manifest schema), `values_from` (options catalog);
- the allowed values: `options`, `options`, `values`;
- the help line: `help`, `help`, `description`.

**Five real examples.**
1. `registries/venues.yml:18`: `- { field: category, type: select, options_from: venue_categories, help: "journal or conference; the options are the venue_categories list of tools/oculus/config/catalogs/vocab.yml" }`
2. `network/joint-work.yml:11`: `- { field: person, type: select, options_from: people, required: true, help: "a registries/people.yml key" }`
3. `network/events.yml:8`: `- { field: role, type: select, options: [present, attend], required: true, help: "present = a talk/poster I give (feeds 'Disseminated in'); attend = attending only" }`
4. `manifest-schema.yml:41`: `venue_id: { label: "Venue", type: select, from: venues, section: Core }`
5. `options.yml:20-25`, the field `class` of the `themes` family: `control: multi`, `values_from: theme_classes`, `joined: true`.

**Help lines that are false now.**
- `venues.yml:27` says "listed in config/vocab.yml venue_themes".
- `data.yml:28` says "config/vocab.yml data_themes". The file is `config/catalogs/vocab.yml`.
- `data.yml:32` gives `access` the help "open / credentialed / DUA ...".
- The comment at `data.yml:9` lists retrieval methods `{physionet, physionet_zip, zenodo, manual}`. The file uses `direct` 1, `library` 9, `manual` 28, `physionet` 3, `physionet_zip` 2, `private` 4, `script` 4 and `zenodo` 3 (`grep -E '^ +method:' | awk | uniq -c`). `tools/data/redownload.py:217-240` handles `library`, `manual`, `private`, `physionet`, `physionet_zip`, `zenodo` and `url`, and prints "unknown retrieval.method ... skipping" for `direct` and `script`.

## 2. The code that reads these schemas today

**Hub collection `schema:` blocks.**
- `collectionSchema`, `src/lib/data/snapshot/normalise.ts:602`. The shape at `:572-591` reads `field`, `type`, `label`, `options`, `options_from` (to `optionsFrom`), `required` and `help`. It is all or nothing: a schema with one wrong field is dropped whole. The file has 837 lines.
- `SchemaField`, `src/lib/data/model/model-collections.ts:29-40`. This is the app API too: `docs/apps.md:247` documents `schema?` as `{ field, type, label?, options?, optionsFrom?, required?, help? }`.
- `checkCollectionSchema`, `src/lib/data/snapshot/validate.ts:561`. It checks only that each item names a `field` and a `type`.
- `typeRefusal` and `typeRefusals`, `src/lib/server/edit/writes/entries.ts:69-106`. They check text, date (`ISO_DATE`), checkbox and select. A select with `options_from` is checked only as text (`:88-91`).
- `kindOf`, `src/lib/state/boards/collection.ts:156`, with `PEOPLE_OPTIONS = 'people'` at `:134`. Choices come from `optionsFrom(config[field.optionsFrom])` at `:626`.
- `identityField`, `src/lib/server/files/fs/collections.ts:49`.
- `src/lib/state/sources/fs.svelte.ts:209`, a zod shape with `optionsFrom`.

**Manifest schema.**
- `formFields` and `fieldRowShape`, `src/lib/state/forms/schema.ts:116-162`. They read `label`, `help`, `type`, `section`, `from` and `options`.
- `fieldTypes`, `src/lib/server/edit/writes/manifest.ts:71`.
- In `validate.ts` (863 lines): `fieldNames` and `schemaKeys` (`:183`, `:193`), driving `checkKeys` (`:218`); the hard-coded `REFERENCES` table (`:83-132`: venue_id, domain, funding, datasets, pillar, related, compute); `SHAPES` (`:134-145`); and `validate()` (`:828-863`), which also runs checkType, checkFocus, checkCollaborators, checkWaitingOn, checkChips, checkPeople, checkJointWork, checkFunders, checkEntryStatus, checkHostStatus, checkThemes and `personalFindings`.
- The real-hub gate is `tests/checks/config/integrity.test.ts` (G14). Its head comment says the real hub must validate "with zero findings".

**The options catalog.**
- `readCatalog` and `catalogOf`, `src/lib/data/sources/config/catalog/options.ts:362` and `:386`; `FieldSpec` and `CatalogEntry` at `:140-181`; `configItems` at `:457`, which resolves each source word to its list.
- `valueProblem` and `itemProblem`, `catalog/value-rule.ts:197` and `:249`. This is the one value rule.
- `optionFindings`, `catalog/option-findings.ts:56`.
- `settingProblems`, `src/lib/data/sources/config/settings.ts:531-541`. It runs `PROBLEM_READERS`. `settingFindings` (`catalogs.ts:234`) turns its results into findings, called from `root/context.ts:364` and `root/watch/portfolio.ts:532`.

**Check scripts.**
- `tools/cockpit/src/cockpit/selftest.py`: `_validate_palette_schemas` (`:595-621`) reads each hub schema's `status` field's `options`, and the collection completeness gate (`:673-692`) reads `field` names. `python3 tools/cockpit/build.py --selftest` is a hub gate, so renaming `options` would break it.
- `tools/cockpit/src/cockpit/schema.py` is the cockpit's own manifest schema.
- `grep -rln schema tools/oculus/utils tools/oculus/bin` finds only `utils/migrations/migrate-joint-work.mjs`.

**What a JSON Schema generator needs from each (my reading, not built):**
- From the hub blocks and the manifest schema: each field's name, its type mapped to JSON (`text` to string or number, `date` to an ISO pattern, `checkbox` to boolean, `tags`/`chips`/`lines` to a string array, `metalist` to an array of `{label, value}`, `raw` to an object, `keymap` to an object), `options` as `enum`, and `help` as `description`.
- For a reference, the file and the key field it resolves to. Today the code knows this only as `REFERENCES` in validate.ts and `configItems` in options.ts, so `from:` must name something the generator can map to the referenced file's keys on disk.
- For a dotted manifest field, nested objects.
- For `required`, the JSON `required` list.
- For a condition, `if`/`then`. This needs the new `when:` key. The tier is not a field of the file, so a tier condition becomes a separate path glob.
- From `options.yml`: `control`, `values`, `min`, `max` and `whole` as `integer`; the source lists come from `configItems`, families from `fields`, and `holds: lists` gives `additionalProperties` of arrays.

**Validators.** No JSON Schema validator is a direct dependency. `npm ls ajv` shows only `ajv@6.15.0` under eslint, a dev dependency. zod 4.6.5 has `toJSONSchema` (`node_modules/zod/v4/core/json-schema-generator.d.ts` exists), but the schemas are YAML data, not zod objects.

## 3. D23's language server client as landed

**How a server is declared.** `src/lib/server/machine/lsp/servers.ts`, 319 lines:
- `ServerId = 'pyright' | 'clangd'` (`:36`).
- `ServerEntry` (`:91-107`) has `id`, `languages`, `program`, `launch(setup)`, `initializationOptions`, `configuration(section, setup)`, `capabilities(language)` and `commands`.
- The pyright entry (`:172-209`) launches `options.node` with `node_modules/pyright/langserver.index.js --stdio`, and answers `configuration` only for `section === 'python'`.
- The clangd entry is at `:212-255`. `createServers` (`:260-271`) builds both; `forLanguage` looks a server up by language.
- `initializeParams` (`:277-319`) has a clangd-only branch at `:287`.
- `Setup` (`:22-31`) holds only pyright and clangd fields.

**The relay.** `relay.ts`, 869 lines:
- `ADAPTERS: Record<ServerId, Adapter> = { pyright: pyrightAdapter, clangd: clangdAdapter }` (`:85`). Each `Adapter` needs `prepare`, `choices`, `choose`, `approve` and `settings` (`servers.ts:69-89`).
- `inbound` (`:166-185`) routes the channel `lsp:<language>` through `forLanguage`.
- `held.ts:289-299` answers `workspace/configuration` per item with `entry.configuration(section, setup)`.
- Other server requests are answered in `Held.answer` (`held.ts:282`).

**The page side.**
- `SERVED_LANGUAGES = ['python','c','cpp']` (`kit/lsp/hosts.ts:20`); `register` returns null for any other language (`:143`).
- `src/lib/views/sources/source/language/lsp.ts` treats "not python" as clangd: `:99-100` (the restart and output commands), `:329`, `:343` (`python ? 'pyright' : 'clangd'`), `:347`, `:359` and `:382`.
- The command words in `config/text/views/sources/source.yml:16-25` are `cmd_clangd_*` and `cmd_python_*`.
- `SEMANTIC_LANGUAGES` is `['c','cpp']` (`client.ts:39`).

**Whether YAML is routed anywhere.** It is not. `grep -i yaml` over both lsp folders finds only the `yaml` import in `clangd/cpp-file.ts:22`. YAML is coloured by a grammar (`kit/grammars.ts:52`, `:74`). D23's look item 13 shows a YAML file's Outline as "No symbols for this file yet." (`agents/reviews/D23-landing.md`).

**What adding yaml-language-server touches, from the code.** D23 brief decision 13 (`briefs/D23.md:625`, `:141`) says M8 adds "an entry and nothing else". The code needs more:
- `ServerId` and the entry in `servers.ts`;
- the `ADAPTERS` entry in `relay.ts`, with an adapter that offers no choices;
- `SERVED_LANGUAGES` in `hosts.ts`;
- the python/clangd branches in `views/sources/source/language/lsp.ts`;
- new `cmd_yaml_*` words in `source.yml`;
- a `custom/schema/content` case in `held.ts` if schemas are served from memory;
- perhaps an `LspCode` in `data/model/model-processes.ts:164`.

**The npm packages** (`npm view`; network answered):

| | yaml-language-server | monaco-yaml |
|---|---|---|
| Version | 1.24.0 (`next` is 1.25.1-19631be.0) | 5.5.1 |
| License | MIT | MIT |
| Maintainers | mohitsuman, rhdevelopers-ci, yvydolob, gercan (Red Hat) | remcohaszing |
| Repository | `redhat-developer/yaml-language-server` | `remcohaszing/monaco-yaml` |
| Last release | 1.24.0 on 2026-07-07 | 2026-06-03 |
| Size and peers | 5,297,088 bytes unpacked | peer `monaco-editor >=0.36` |

yaml-language-server's dependencies are `ajv ^8.17.1`, `yaml 2.8.3` (exact, while oculus has 2.9.1), `prettier ^3.8.1`, `vscode-languageserver ^9.0.0`, `vscode-languageserver-types ~3.17.5` (oculus has 3.18.4), `request-light`, `picomatch` and others; its bin is `bin/yaml-language-server`. monaco-yaml runs the YAML language service in a page web worker, outside D23's relay.

**How the server receives schemas** (read in the 1.24.0 tarball):
- It pulls the sections `yaml`, `http`, `[yaml]`, `editor` and `files` (`settingsHandlers.js:46-50`), and pulls again on `workspace/didChangeConfiguration`. `configure` calls `clearExternalSchemas()` (`yamlLanguageService.js:48`), so a changed schema is fetched again.
- It reads `yaml.schemas` (`:69`), `validate`, `hover`, `completion`, `hoverSchemaSource`, `schemaStore.enable` (`:99-102`) and `format.*` (`:119-133`).
- A schema URI is resolved by `schemaRequestHandler.js:53-122`. `file:` is read from disk, `http(s)` is fetched, and any other scheme is sent back to the client as the request `custom/schema/content` (`requestTypes.js`). So oculus can answer schema content itself from `held.ts`, or write files and pass `file:` URIs.
- `didChangeWatchedFiles` on a schema URI resets it (`languageHandlers.js:152-160`).

**Defaults the brief must override** (`yamlSettings.js:20-62`):
- `schemaStoreEnabled = true`, with `https://www.schemastore.org/api/json/catalog.json`, and `kubernetesCRDStoreEnabled = true`. Both make network requests unless turned off.
- `yamlHoverSchemaSource = true`, so the schema URI shows in hovers.
- Formatting is on (prettier). The server declares `documentFormattingProvider` and `documentOnTypeFormattingProvider` (`yamlServerInit.js:87-88`) with `textDocumentSync` Incremental (`:83`). A YAML Format Document, or `format_on_save`, would re-lay out the hub's aligned flow maps unless the entry leaves formatting out of `capabilities`.

## 4. The data departures Z468 lists, rerun

- **`registries/data.yml` `access: public`.** Still there, now at line 77, not 82 (`grep -n 'access: public'` prints `77:`). It is on the `pmc-patients` entry. The counts are open 39, registration 7, private 4, credentialed 3, public 1. `vocab.yml:252` has `data_access: { open, registration, credentialed, private }`.
- **`outcome` and `doi` outside the archive tier.** 18 manifests, 12 under `projects/coauthor/published/`. `outcome` is on all 18; `doi` on 5. The other six are `projects/active/linfoot-estimator`, `coauthor/abandoned/individual-reference-intervals`, `coauthor/active/{clinical-hccnet,elixir-fl4e,flkit}` and `manuscripts/erp-signatures`. In all of them `outcome` holds the involvement statement. `CardDetails.svelte:72-74` draws `outcome` on any tier, and `normalise.ts:324-325` reads both fields from every manifest. The archive condition exists only as a section name.
- **`hcin` (`venues.yml:245`).** `category: journal`, with `timing` (a topical-collection call), `deadline: 2026-12-02` and `call` (a Springer collection URL). It is the only journal with conference-only fields.
- **Graz BCI event (`network/events.yml:62-73`).** `role: present`, `status: not-attending`, no `link`; a co-author presents. It is the only `role: present` entry without a `link`. The `link` help says "slides / deck (network/<event>/), for a talk I give".
- **Venues with no `category`.** `kuleuven-thesis` (`:1019`), `uhasselt-thesis` (`:1027`) and `xai-nl` (`:1035`), with `format: thesis`, `thesis` and `poster`. The counts are journal 41, conference 27, none 3. Four manifests name one of them by `venue_id` (`grep -rln`).

Two more departures found in the same files: the retrieval methods `direct` and `script` (section 1), and the stale vocab paths in the help lines at `venues.yml:27` and `data.yml:28`.

## 5. Sentences of `docs/DATA-MAP.md` (490 lines) the step would make false

These depend on where the new schemas go and whether checks go into validate.ts:
- `:20`, "the full field list of the files no schema covers".
- `:156`, "Every one of them but `feeds/literature-radar.yml` opens with its own `schema:` block".
- The table rows `:171` (career, "none"), `:179` (radar, "none"), `:181` and `:182` (side projects, "none").
- `:258`, "Not checked means no function of validate.ts and no rule of audit reads the field", and the "not checked" rows that M8's allowed values and references would check: `:275` priority, `:293` access, `:294` category, `:295` tier, `:297` pillar colour, `:301` radar project, `:302` maps_to, `:303` bucket.
- The "Condition stated in" column of `:339-354`, which cites help lines and header comments that `when:` replaces. `:340` (outcome/doi "the project is on the archive tier") is already false by the data.
- "Where each schema is", `:365-374`, rows `:367`, `:371`, `:372`, and `:374` ("`registries/career.yml` has no schema").
- The whole section "The files no schema covers", `:376-409`.
- `:413`, `:419` and the attribute table `:431-441`, which name `options_from` and have no `from` or `when`.
- `:449`, kindOf rule 3, `options_from: people`.
- `:460` and `:477`, the manifest `from:` names.
- `:481`. It already undercounts: "An option has a control: `toggle`, `number`, `text`, `choice` or `list`", while `options.yml:10` lists 16 controls.

Nothing in DATA-MAP describes the YAML editor today.

## 6. Folder counts, file sizes and guarded entries

**Tracked items per folder** (`git ls-files <d> | cut -d/ -f1 | sort -u | wc -l`, limit 10):
- Full at 10: `src/lib/server/machine/lsp`, `src/lib/ui/controls/editor`, `src/lib/ui/controls/editor/kit`, `src/lib/data/sources/config`, `src/lib/data/sources`, `src/lib/data`, `src/lib/server/edit/writes`, `src/routes/api`.
- At 9: `src/lib/server/machine`, `kit/lsp`.
- At 8: `config/catalogs` (three new schema files there would make 11), `src/lib/data/snapshot`.
- Lower: `config` 7 (local.yml untracked); `tests/server/machine/lsp` 7; `catalog/` 6; `tests/data/sources/config` 6; `views/sources/source/language` 5; `state/forms` 5; `tests/checks/config` 4.

**File sizes** (`wc -l`; limits 880 for .ts and 520 for .svelte):
- Over the line: `kit/lsp/transport.ts` is 897, over 880. It is not in `utils/size-allow.txt`, and the check refuses only at 900.
- Near the line: `server/root/context.ts` 870, `lsp/relay.ts` 869, `validate.ts` 863, `normalise.ts` 837, `state/boards/collection.ts` 809.
- Svelte: `Source.svelte` is at exactly 520 (D23c's area); `Editor.svelte` is 496.
- Room left: `held.ts` 587, `catalog/options.ts` 541, `settings.ts` 541, `manifest.ts` 486, `entries.ts` 473, `kit/load.ts` 448, `language/lsp.ts` 445, `state/forms/schema.ts` 383, `servers.ts` 319, `catalogs.ts` 312, `model-processes.ts` 249, `hosts.ts` 168, `normalise-career.ts` 158, `normalise-personal.ts` 168.

**Guarded entries that cover what M8 touches:**
- G12: catalogs read with no finding.
- G13: config readers, including `catalog/options.ts`.
- G14: the real hub with no findings. New value or condition checks fail it until the Z468 data is settled.
- G15: a broken manifest still shows.
- G32: the hub parsers, including career, feeds and personal.
- G8: `entries.ts` writes and 'appends a new entry rendered from the file schema'.
- G1, G2, G3, G5 and G7 for the lsp channel, the URIs, `local.yml`, help text reaching a hover, and argument arrays.
- G36 is not in guarded.md (see the first section).
- The tree checks G16 to G25.

## 7. Choices the brief must take that no ruling settles

For each, the options, my recommendation and the lazy option.

1. **The reference key.** (a) `from:` everywhere, with `options_from` in the 16 hub files and in the readers and the app API (`optionsFrom`) renamed. (b) Keep `options_from` in the hub and `from` in the manifest schema. (c) Accept both. Recommend (a): one name for one thing, as the plan line names it. Its cost is the app API change (`docs/apps.md:247`) and the cockpit check. Lazy: (b) or (c).
2. **What `from:` names.** (a) A short name that `sources.yml` or `vocab.yml` defines, written `people` for a registry or `vocab.venue_tiers` for a vocab list, so the namespace has no clash. (b) A file path and key field, such as `from: { file: registries/people.yml, key: key }`. (c) Today's mixed bare names. Recommend (a): each path stays written once, in `sources.yml`. Lazy: (c).
3. **What `when:` means and how it is written.** (a) A map of field to value or values, all of which must hold, meaning the field is allowed only when they hold; a requirement is written separately as `required: { when: ... }`. (b) A string expression. (c) Raw JSON Schema `if`/`then`. A tier condition needs a separate path glob. Recommend (a). Lazy: keeping conditions as help text.
4. **Help and allowed-value key names in `options.yml`.** It uses `description` (202 occurrences) and `values`, where the other formats use `help` and `options`. (a) Rename them to match. (b) Keep them, and have the generator map them. Recommend (a) under the no-synonym rule. Lazy: (b).
5. **Where the new schemas live.** (a) Career and radar get their own `schema:` block, as every other hub data file has; the side-project schema goes in a new `config/catalogs/side-project-schema.yml` (catalogs then holds 9). (b) All three in `config/catalogs/`, which makes 11 and forces a subfolder that also moves `manifest-schema.yml`. (c) One `config/catalogs/schemas.yml`. Recommend (a). Career is a map of sections, so its block needs nested fields that the list format cannot express today.
6. **How schemas reach the server.** (a) From memory: a custom URI scheme answered by `custom/schema/content` in `held.ts`, with `didChangeConfiguration` sent when a referenced file changes. (b) Files written under the lsp folder, passed as `file:` URIs. Also set `schemaStore.enable` false, the Kubernetes CRD store off, `hoverSchemaSource` false, and formatting out of the capabilities. Recommend (a): always current, nothing written. Lazy: files generated once at start, which go stale.
7. **Does validate.ts check the same declarations, so the Findings view and the G14 gate agree with the editor marks?** (a) Validate through the generated JSON Schemas with `ajv`, a new direct dependency (8.20.0, MIT, maintainers blakeembrey and esp, modified 2026-04-24). (b) A hand-written check in validate.ts that reads `from` and `when`. (c) Editor marks only. Recommend (a): one rule for both sides, and Z468 says "checked". Lazy: (c).
8. **npm dependencies.** `yaml-language-server` pinned at exactly 1.24.0, as pyright is. Its transitive `prettier`, `ajv` 8 and `yaml` 2.8.3 come with it. `monaco-yaml` is not needed on the server route and goes around D23's relay.
9. **Settling the data** (Z468 says "settled"; each value is Axel's data):
   - `access: public` becomes `open`. Recommended, since the set needs no credentials.
   - `outcome`/`doi` outside the archive tier: (a) widen the condition to finished or coauthor work, (b) move the text, (c) delete it (data loss, the lazy option). Recommend (a). The section label and `:340` change with it.
   - `hcin`: make `timing`, `deadline` and `call` allowed on any venue, and keep the month fields conference-only. Recommended.
   - Graz: under recommendation 3 (allowed-only), a missing `link` is no departure; the alternative is a new role value.
   - The three uncategorised venues: (a) add `thesis` and `meeting` to `venue_categories`, which adds groups to the Venues view; (b) put them under an existing category. Recommend (a).
10. **Scope of "every hub file's `schema:`".** The 26 deck `present.yml` files, `.oculus/cpp.yml` and `~/.oculus/bookmarks.yml` are read by oculus but not named by the plan line. Recommend including the deck `present.yml` files, with a catalog schema after PR3 lands, since the YAML editor opens them. Lazy: reading the line as only the 16 files that already have a block.

## 8. Shared paths with PR3 and D23c

**With D23c** (`briefs/D23c.md:109-131`):
- The whole of `src/lib/server/machine/lsp/`. Both steps need a new subfolder in a folder that holds 10, and `relay.ts` is at 869, so this is not a simple merge.
- `src/lib/ui/controls/editor/kit/lsp/`, for `hosts.ts`.
- `src/lib/data/model/model-processes.ts`.
- `src/lib/views/sources/source/` (`language/lsp.ts`).
- `config/text/views/sources/source.yml`.
- `tests/server/machine/lsp/`.
- `DESIGN.md:123` and `:571-572`. `:571` says "A Python, C or C++ file ... is served by pyright or clangd", which M8 makes false.
- `docs/files-and-search.md:69-72`, the Language servers paragraph, which M8 also makes false.
- `guarded.md` lines 10-12 (G2).

**With PR3** (`briefs/PR3.md:207-233`):
- `guarded.md`, the G32 line, if career and radar gain blocks.
- `HELP.md`, `DESIGN.md` and `docs/configuration.md`. PR3 writes `:64`; M8 would write `:18-20`, adjacent but not the same line.
- `config/text/`, different files unless both touch `server.yml`.
- `src/lib/data/model/model-entities.ts`, only if M8 types radar or career schemas there.
- The deck `present.yml` files, if choice 10 includes them. PR3 writes their `slides:` and `order:`.

M6, not landed (`plan.md:230`, no tick), builds new entries from the hub `schema:` blocks (`briefs/M6.md` premise 6), so the key renames of choices 1 and 4 reach M6 as well.

Agent usage: a5116a7bcac126d61, claude-opus-5-5, 269,265 tokens, 104 tool uses, 11.1 min.
