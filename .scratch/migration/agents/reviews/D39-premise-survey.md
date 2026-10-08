# D39 premise survey on main at 7c5514850e3f557efce08b626cbbfd6bbd1b70f3

Breaches of this survey's own rules, first. Four commands read `tools/oculus/config/local.yml`, and one may also have read files under the hub's `secrets` folder. None of them printed any content of those files.
- The YAML byte count (`find ... -name '*.yml' | xargs cat | wc -c`) passed local.yml to `cat`. Only the total reached me.
- The keyword loop `grep -rIlw --exclude-dir=secrets ... -- "$k" .` did not exclude local.yml. It printed only counts of matching files per extension.
- `grep -rIl --include="*.yml" -- "ZonMw-AI-HCC" . --exclude-dir=...` put the exclusions after `--`, so ugrep took them as file names and searched the whole hub with no exclusions. That includes local.yml and any `.yml` under `secrets/`. It printed only matching file names, and none of them was under `secrets` or was local.yml.
- `grep -rn "data_domains\|resource:" config/*.yml | grep -v "^config/local.yml"` read local.yml. Its lines were dropped by the pipe before anything was shown.
No file was changed, no git command other than `log`, `show` and `rev-parse` was run, and nothing of mine is still running.

Premise findings that bear on the brief:
- **Rename preview covers every server.** Z682 (3) (plan.md:1489) gives D39 the rename preview for every server's rename ("its preview the edit list of D39 when D39 lands"), not only YAML. Today a rename is written with no preview: `transport.ts:660-667` commits it at once.
- **yaml-language-server is not installed in main's checkout.** `ls -d node_modules/yaml-language-server` in `tools/oculus` gives "No such file or directory", while `package-lock.json:8931` lists it. The gate worktree has it.
- **DATA-MAP.md:287-290 is false on the tree.** It says the `related` field of `network/events.yml`, `education/education.yml`, `applications/applications.yml` and `registries/repos.yml` is checked by "Audit". M8 gave all four `from: projects` (`git show 7c5514850 -- registries/repos.yml` shows `+  - { field: related, type: tags,     from: projects, ...`).
- **The radar file is too large for D23b's write chain.** `feeds/literature-radar.yml` is 336,388 bytes, and `lsp-edit` refuses any file over `SAVE_MAX_BYTES` = 256 * 1024 = 262,144 (`history.ts:47`, `lsp-edit.ts:64,73`). So a rename of a project id that the radar names is refused whole.

## 1. How M8's schemas declare a reference

The forms of `from:`, and their reader:
- A hub file's `schema:` field writes `from:` as one source, a list of sources, or `{ field, sources }`. `fromShape` reads it (`src/lib/data/snapshot/schema/field.ts:26-34`).
- `manifest-schema.yml` writes `from:` on a row of `manifest_schema.fields`. `rowShape` in `schema/manifest.ts:13-23` reads it, and `manifestFields` (:48-63) turns it into schema fields.
- A source is one of eight registries, `projects`, or `vocab.<key>`. They are listed in `REGISTRIES` and `VOCAB_PREFIX` (`schema/lists.ts:26-38`). `config/schemas/manifest-schema.yml:16-18` says the same in its comment.

How the keys are read:
- `hubLists` (`lists.ts:41-53`) gives the keys of each registry by `REGISTRY_SHAPES` (`helpers/hub-names.ts:40-52`): venues by `id`, datasets by `key` under `datasets:`, and the other six by `key`.
- `projects` is `raw.manifests.map(m => m.id)`, the folder names of the research manifests. Side projects are not in it (`run.ts:120` and `static.ts:72` filter `isSideTier`).
- `listsOf` (`lists.ts:76-86`) answers one source, and `unreadSources` (:60-73) marks a source whose file did not read. The prompt's `listOf` is this `listsOf`. The `listOf` in `server/edit/entry-edit/lines.ts:152` is the entry writer's list finder.

How the JSON Schema builder carries a reference:
- `valueSchema` (`schema/record.ts:87-133`) writes a `select` as `{ enum, 'x-from': sources }` (:112-116) and a `tags` field as `items: { enum, 'x-from' }` (:100-110).
- A `text` field with `from` gets only `examples` and no `x-from` (:126-130). This matters for `maps_to` in `feeds/literature-radar.yml`.
- The `{ field, sources }` form gets one rule per word with `x-from` (:199-218).
- `x-from` is declared as an annotation in `schema/json.ts:5-17`.
- Builder and matching: `fileSchema` (`schema/hub.ts:59-80`), `manifestSchema` (`manifest.ts:69-89`), `projectFileSchemas` for the side project, deck and cpp schemas (`static.ts:69-91`), and `runSchemas` (`run.ts:100-182`), which also checks the documents. `schemaFor` (`set.ts:72-79`) matches a schema to a file by root and glob.
- Oculus's own config files: `engineSchemas` (`sources/config/catalog/schemas/engine.ts:79`) reads `from: domains` and `from: clusters` from `options.yml` (:189 `data_domains`, :339 `slurm.resource`). Both resolve to hub registry keys (`engine.ts:66-71`).

Reference fields per hub file. The command was a node script over each file's `schema:` and the three schema files, run from `tools/oculus`. It printed:
- `project.yml` (`manifest-schema.yml`): 12 `from` fields, 8 of them to hub keys:
  - `venue_id` from venues
  - `domain` from domains
  - `pillar` from pillars
  - `funding` from funding
  - `collaborators` from people
  - `related` from projects
  - `datasets` from datasets
  - `compute` from resources
  - The other four point into `vocab.yml`: `type`, `status.chips`, `focus`, `priority`.
- `registries/people.yml`: 1, `affiliations` from organisations.
- `funding/funding.yml`: 1, `funder` from organisations.
- `network/joint-work.yml`: 1, `person` from people.
- `network/events.yml`, `education/education.yml`, `applications/applications.yml`, `registries/repos.yml`: 1 each, `related` from projects.
- `feeds/literature-radar.yml`: 3, of which 2 are hub keys (`project` select from projects, `maps_to` text from projects). `bucket` points into vocab.
- Vocab only:
  - `registries/venues.yml`: 3
  - `registries/data.yml`: 2
  - `registries/career.yml`: 1
  - `side-project-schema.yml`: 1
- None: pillars, domains, organisations, resources, boilerplate, tasks, position-leads, `deck-schema.yml`, `cpp-schema.yml`.
- Totals: 17 fields that name hub keys and 12 that name vocab keys.

Values present on the tree (the same script counting values; `waiting-on` counted apart):
- Manifests: `domain` 94, `pillar` 122, `related` 70, `collaborators` 57, `datasets` 58, `venue_id` 53, `funding` 22, `compute` 17, `waiting-on` 2.
- Other files: radar `project` 376, radar `maps_to` 185, people `affiliations` 20, joint-work `person` 13, education `related` 10, applications `related` 7, events `related` 6, repos `related` 5.
- Total: 1,115 values under hub-key `from:` fields.

How a project id is referenced:
- An id is the folder name. All 94 research manifests also write `id:` (`find projects -name project.yml -not -path "*/code/*" | xargs grep -l "^id:" | wc -l` gives 94).
- `record` in `sources/manifests.ts` reports an `id` that is not the folder name (DATA-MAP.md:275).

## 2. How the YAML editor talks to yaml-language-server (M8)

The server side:
- The entry is `yaml()` in `server/machine/lsp/servers.ts:544-575`.
  - It runs under node's permission model with read access to `node_modules` only (:551-557).
  - Settings are `YAML_SETTINGS` (:526-536): validate, hover and completion on, format off, schema store off.
  - Server requests are answered by `yamlRequests` (`adapters/yaml/requests.ts:31-46`, `custom/schema/request` and `content` from `ask.schemas`).
  - The machine's own files are refused at :562 (`isMachineFile`, `isPrivateFile` in `adapters/yaml/machine-file.ts:28-39`).
- The capabilities the page is told (:563-572): hover, completion, documentSymbol, definition, folding, selectionRange and codeAction. They do not include references, rename or documentLink.
- The relay answers the page's `initialize` itself with `entry.capabilities(language)` (`relay.ts:434-442`). It forwards every other document request by `#route` (`relay.ts:497-551`).
- The schema set reaches the relay through `SchemaFeed` (`schema-feed.ts:10-34`, `relay.ts:118-121, 157-170`). `own-schemas.ts` adds app, commands and launch.

The page side:
- `views/sources/source/language/lsp.ts:128-135` withholds a withheld YAML file (`isWithheldFile`).
- Find All References is listed only when `provides('referencesProvider')` (:468-474), so YAML has none today.
- The status items are in `shell/status/SourceItems.svelte`.

What M8 offers today:
- Completion of a reference's keys, from the `enum` the build writes.
- Hover with the field's help line, from `description`.
- Marks against the enum and the other rules.
- docs/files-and-search.md:85 says the YAML server "offers no formatting and no rename".

What yaml-language-server 1.24.0 can do (read in the gate's `node_modules`, `lib/esm/yamlServerInit.js:81-98` and `languageservice/services/`):
- `yamlDefinition.js` resolves an alias to its anchor in the same document only.
- `yamlRename.js` renames anchors and aliases in one document only.
- `yamlLinks.js` links `$ref` targets inside the document only.
- It has no `referencesProvider`.
- Nothing in it reads data across files or treats an `enum` value as a link.

What oculus would build:
- An index of every hub-key value with its file and range.
- Answers to `textDocument/definition` (composed with the server's alias answer), `textDocument/references`, `textDocument/prepareRename` and `textDocument/rename` for the YAML entry.
- The edit list shown before anything is written.

## 3. D23b's write chain and how navigation is wired for other languages

The write chain:
- A rename answer reaches the transport. `transport.ts:660-667` sends it to `#commit` (:504-513) and gives Monaco no result.
- `#commit` calls `host.applyEdit`, which is `lspEdits.apply` (`language/lsp.ts:210`, `state/system/machine/lsp/edits.ts:194` onward).
- `apply` edits the open tabs unsaved and posts every other file as the `lsp-edit` operation (`server/files/fs/lsp-edit.ts`, refusal order at :5-23).
- Each written file gets a history copy of kind `lsp-edit`, an atomic write and a read back, and the whole request is one `files` record.
- The page refusals are in `edits.ts:18-27`.
- No preview step exists: Z682 (3) says the preview is D39's.

How the editor is wired:
- Monaco's own LSP client registers `registerDefinitionProvider`, `registerReferenceProvider` and `registerRenameProvider` from the declared capabilities (`node_modules/monaco-editor/esm/external/monaco-lsp-client/out/index.js:1721, 1834, 1948`).
- Its rename uses `prepareRename` when `prepareProvider` is declared (:1966-1986).
- The References view starts from `find()` in `language/lsp.ts` (the `references.start` call at :329), with the store in `state/system/machine/lsp/references.svelte.ts`.
- A press on a row opens it through `openReference` (`views/shared/links/source-file.ts:52-67`).
- So once the YAML entry declares and answers these four methods, Cmd+click, Peek, the References view and F2 work with no new page provider. The only new page work is the preview.

## 4. How a go-to opens a file at a line and column

- `openSourceFile(client, { root, path, line, column })` is at `views/shared/links/source-file.ts:17-29` (`SourceFile` at :15). It calls `sourceTabState` (`state/sessions/source/draft.ts:219-231`, `placed` at :247-250) and `client.layout.openView('source', ...)`.
- A definition into another file goes through Monaco's editor opener (`ui/controls/editor/kit/lsp/hosts.ts:129-148`). The opener calls `services.open(target, line, column)` (`language/lsp.ts:199-210`).
- The tab applies the place in `views/sources/source/Editor.svelte:175-191` as `{ kind: 'word', line, column }`, run by `ui/controls/editor/commands.ts:27-40`. That selects `getWordAtPosition`.

Hazard. Monaco's YAML configuration sets no `wordPattern` (`node_modules/monaco-editor/esm/vs/languages/definitions/yaml/yaml.js:3`, `grep wordPattern` finds none). The default word pattern breaks at `-`. So opening `hccnet-revision` or `ZonMw-AI-HCC` at its column selects only the part of the key under the column. VS Code selects the target's whole selection range.

## 5. What would hold the reference index

What the server already reads:
- `buildPortfolioWithSchemas` (`data/index.ts:228-275`) reads the manifests, registries, collections, feeds and career on every rebuild.
- `runSchemas` reads each hub data file's text (`run.ts:133-144, 175-178`) and each manifest's text (`checkDocument` through `readText`, :175-177).
- `duplicateKeys` (`lists.ts:117-145`) already finds an entry's line with `parseDocument` and `LineCounter` (`lineOfItem`, :89-111).
- `validate.ts` holds the checks a schema cannot state, among them `checkWaitingOn` (:191) and `checkSelfRelated` (:146).
- `readCollection` is in `server/files/fs/collections.ts:115`.
- The YAML position helpers are in `server/edit/yaml/yaml-ranges.ts`, which M6 moves to `data/helpers/files/`.

Size of the hub:
- 376 YAML files under the hub root, excluding `secrets`, `node_modules`, `.git` and worktrees. They total 2,707,480 bytes (`find ... | wc -l` and `| xargs cat | wc -c`).
- Project manifests: 94 research (ideas 33, archive 25, coauthor 16, manuscripts 15, active 5) and 3 side projects.
- The files a reference can stand in are 18 hub data files and 97 manifests: 115 files, 897,957 bytes.
- `parseDocument` with a `LineCounter` and a scalar visit over those 115 files took 150.8 ms on the first run and 80.5 and 79.4 ms on the next two (node script, 24,837 scalars). That is a measure of parsing alone, not of the real build.

How it would stay current:
- The portfolio watcher rebuilds on each change with lodash `debounce` and `maxWait` (`server/root/watch/portfolio.ts:128-135, 602, 644-653`) and publishes the schemas through `SchemaFeed`.
- The relay holds each open document's text (`held/held.ts:50-67` `Doc.text`, kept by `held/documents.ts:51-63`). An answer can therefore overlay the text of a file open on the page.
- The overlay is needed. `edits.ts` refuses an edit of a tab whose draft is not the text the server holds, so edits computed from disk against a dirty tab would be refused.

## 6. The value kinds the step names, against the schemas

All nine exist as `from:` fields:
- venue_id: manifest `venue_id`.
- person: manifest `collaborators` and joint-work `person`.
- organisation: people `affiliations` and funding `funder` (0 values filled on the tree).
- resource: manifest `compute`.
- project id: `related` in 5 files, and radar `project` and `maps_to`. `maps_to` carries no `x-from` in the JSON Schema, so an index must read the schema fields, not the generated JSON.
- dataset: manifest `datasets`.
- pillar: manifest `pillar`.
- domain: manifest `domain`.
- funding key: manifest `funding`, against 3 keys (FAIR, ZonMw-AI-HCC, FWO-PhD). Entries without a `key` are not named.

References the schemas hold that the step does not name:
- The 12 `vocab.<key>` fields, which point into `config/catalogs/vocab.yml`.
- `options.yml` `data_domains` (`from: domains`, value in `behavior.yml:26`).
- `slurm.resource` (`from: clusters`, value in `behavior.yml:76`).

References outside any `from:`:
- Manifest `waiting-on` (people or projects, `checkWaitingOn`; 2 values).
- The deck `present.yml` `groups.<name>.slides`, which names project ids (`deck/present.yml:8-25` and `tools/present/content/present.yml`). `deck-schema.yml` has no `from`.
- The `domains:` map of `vocab.yml:51-63`, keyed by domain.
- Prose mentions:
  - `pillars.yml`'s free-text `funding` names `ZonMw-AI-HCC`.
  - `tools/cockpit/templates/project.active.yml` names `ZonMw-AI-HCC`.

## 7. Rename's hazards on the tree

- **A project id is its folder.** A rename must move the folder, which `lsp-edit` refuses (Z682 (2) refuses a create, rename or delete). M7 owns moving a project folder and "lists every reference to the old path in the hub's YAML files for one confirm" (plan.md:243).
- **No funding key is used in a folder name.** The funding folders are named by year, funder and scheme (`ls funding`), and are reached by `link:`, which DATA-MAP lists as a path checked by Audit.
- **Keys in Markdown, LaTeX and other files.** `grep -rIlw` counts of files naming each key:
  - `hccnet-revision`: 38 md, 13 yml, 2 py
  - `FAIR`: 21 tex, 18 yml, 18 md
  - `utwente`: 55 md, 17 yml, 11 tex
  - `tensor`: 199 py, 175 md, 88 tex, 75 yml
- **Keys equal to common words.** The registry key listing found:
  - venues `media`, `patterns`, `radiology`
  - datasets `support`
  - pillars `tensor`, `federated`, `evaluation`
  - domains `method`, `heart`, `brain`, `privacy`, `theory`, `meta`, `cs`
  - funding `FAIR`
  - resources `data`
  - A text rename would hit prose. A rename by schema position alone does not.
- **Duplicate keys.** None on the tree: the same script reports `dup=[]` for all eight registries, no key in two sources, and no project folder name twice of 94. A rename to a key that already exists in the source must be refused.
- **Private files.** `secrets` and `~/.oculus` files hold no reference a schema governs. `lsp-edit` refuses `local.yml` and files outside the roots or under dot and `node_modules` folders, but its refusal list (`lsp-edit.ts:5-16`) does not name the hub's `secrets` folder. `closed_paths: [secrets]` (`behavior.yml:260`) is read by the library rules and apps only. An index that reads only schema-governed files never names one, but nothing in `lsp-edit` stops a page from posting one.
- **The radar file over the write limit.** Covered above: 336,388 bytes against 262,144, and `hccnet-revision` alone appears 32 times in it (`grep -c`).
- **Long reference lists.** A rename of a key many files name, such as a pillar with 122 values or a project the radar names 376 times in total, gives one long edit list.

What a rename must refuse:
- an empty new key
- a new key that exists in the same source
- a project id (folder)
- a vocab key (oculus code and catalogs read some, such as `holding`)
- a funding entry with no `key`
- a file over the write limit
- a new key that does not read back as the same scalar

## 8. Libraries

`npm view` and `npm search`:
- `yaml-language-server` 1.24.0, MIT, released 2026-07-07: already used, no cross-file features.
- `monaco-yaml` 5.5.1, MIT: wraps yaml-language-server.
- `volar-service-yaml` 0.0.71: wraps yaml-language-server.
- `vscode-json-languageservice` 6.0.0-next.3, MIT: `$ref` within a document.
- `@apidevtools/json-schema-ref-parser` 16.0.3, MIT: resolves schema `$ref`, not data references.
- `@stoplight/spectral-core` 1.24.0, Apache-2.0: lint rules.
- `yaml-references`, `yaml-schema-references` and `yaml-lsp`: E404.

No package gives definition, references or rename across YAML files from JSON Schemas. JSON Schema has no foreign-key concept, so the `from:` meaning is oculus's own. The `yaml` package (`^2.9.0`, already a dependency) gives every node's range. Recommendation: written in oculus over `yaml` and the existing `SchemaField` lists.

## 9. Files D39 would write, sizes and guarded entries

Line counts (`wc -l`):
- `relay.ts` 864 (16 lines of room before 880)
- `transport.ts` 871 (9 lines of room)
- `server/root/context.ts` 803
- `held/held.ts` 667
- `servers.ts` 642
- `kit/lsp/client.ts` 640
- `language/lsp.ts` 563
- `edits.ts` 286
- `run.ts` 182
- `lists.ts` 145
- `lsp-edit.ts` 143
- `set.ts` 87
- `schema-feed.ts` 34

So a relay hook and the transport's preview hand-off need a split of `relay.ts` and `transport.ts`.

Folders already at ten tracked items (`git ls-files | cut | sort -u | wc -l`): `data/snapshot/schema`, `ui/controls/editor/kit/lsp`, `state/system/machine/lsp` and `tests/server/machine/lsp`. A new file in any of them needs a regroup.

Guarded entries the work falls under:
- G2 (`lsp-edit` paths)
- G3 (no `secrets` or `~/.oculus` file to the YAML server)
- G8 and G9 (`lsp-edit` write and undo)
- G36 (YAML server life)
- G63 (versions)
- G56 (schema rules, `run.ts` and `lists.ts`)
- G32 (parsers under `src/lib/data/snapshot/`)

New behaviour whose test needs a new entry (Axel's open item, which the brief does not add):
- The index: every value of a field whose `from` names a source is a reference with its file and range, and the definition is the entry's identity line, or the manifest's `id:` line for a project.
- The rename edit: every reference and the entry's own key change, quoting is kept, no other byte changes, and the refusals in section 7 hold.
- The preview: nothing is written before Apply, and Discard writes nothing.

G32's text could arguably hold the index. G8's text does not state the rename's coverage.

## 10. Steps queued or in flight that write the same files

- **D33 (in flight, repair round 1; `agents/briefs/D33.md`, its paths widened by `D33-round1.md`).** D39 shares:
  - `kit/lsp/client.ts`, `hosts.ts`, `services.ts`
  - `views/sources/source/language/lsp.ts`
  - `ui/controls/editor/types.ts`, `commands.ts`
  - `views/sources/source/Editor.svelte`
  - `state/sessions/source/draft.ts`
  - `views/shared/links/source-file.ts`
  - `views/sources/search/` (D33 adds two files)
  - `DESIGN.md`, `HELP.md`
  - `docs/files-and-search.md:85`, the line D39 must rewrite
- **M6 (queued, premise recheck running; `agents/briefs/M6.md`).** D39 shares:
  - `ui/controls/editor/types.ts`, `commands.ts`
  - `views/sources/source/Editor.svelte`
  - `views/shared/links/source-file.ts`
  - `server/edit/yaml/yaml-ranges.ts` (moved to `data/helpers/files/`) and `server/edit/entry-edit/lines.ts`
  - `data/snapshot/validate.ts` (if `waiting-on` gets a `from`)
  - `config/catalogs/vocab.yml` (M6 line 249)
  - `docs/DATA-MAP.md` (M6 lines 191, 414-442; D39 260-336, no overlap)
  - `DESIGN.md`, `HELP.md`
- **D43 (no brief; `agents/reviews/D43-premise-recheck-2.md` section 3).** D39 shares:
  - `servers.ts` (a texlab entry; D39 the YAML capabilities and a `ServerEntry` answers hook)
  - `relay.ts` (D43's `source` filter through a new `ServerEntry` hook; one generic hook should serve both)
  - `data/prose/lsp-servers.ts`
  - `transport.ts` (D43 only under U4 (b))
  - `tests/server/machine/lsp/servers.test.ts`
  - `DESIGN.md` around :571-574, `docs/files-and-search.md` (the Language servers paragraph), `HELP.md`
  - `server/root/context.ts` (D43 only under U2 (a))
- **D41 (plan.md:532, no brief).** No file is named, but its "offers to rewrite the links ... listing them first" is a second list-before-write. It should use D39's edit list view.
- **M7 (plan.md:243).** It lists references to a moved project folder in the hub's YAML. That overlaps the project id rename (choice C4).

## 11. Choices the brief cannot settle

**C1. Where hub-key answers are computed.**
- (a) A `ServerEntry` hook the relay consults in `#route` before forwarding. The YAML entry answers definition (falling through to yaml-language-server's alias answer), references, prepareRename and rename from an index built with the schemas and overlaid with the page's open texts.
  - Pro: one client, one channel, and Cmd+click, Peek, the References view and F2 come with no new page provider. DESIGN.md:573 says "nothing else names a server or a language", and this keeps that true.
  - Con: `relay.ts` needs a split.
- (b) Page-side Monaco providers over a new HTTP route.
  - Con: two providers for one language, the References view and F2 still go to the LSP client, and it adds a route.
- (c) A second process of oculus's own speaking LSP.
  - Con: the registry has one entry per language (`forLanguage`).
- Recommended: (a). The lazy option is (b).

**C2. What counts as a reference.**
- (a) The 17 hub-key `from:` fields only (the literal reading of Z347's "read from M8's schemas").
  - Con: a rename leaves broken values in `waiting-on`, the deck groups, `behavior.yml` `data_domains` and `slurm.resource`, and a domain's colour in `vocab.yml`.
- (b) (a), plus `from:` written where a schema exists: `waiting-on` gets `from: [people, projects]` (its finding then comes from the schema, and `checkWaitingOn` is retired or kept as the one source), the deck groups' `slides` get `from: projects`, and the engine's `data_domains` and `slurm.resource` are read from `options.yml`'s `from`. A rule is stated for `vocab.yml`'s `domains:` map keys. Every reference stays declared in a schema.
- (c) (b), plus prose mentions listed without editing.
  - Con: common-word keys give false hits.
- Recommended: (b). The lazy option is (a).

**C3. Vocabulary values (12 fields).**
- (a) Definition and references (Cmd+click on `focus: run` opens `vocab.yml` at the lane), rename refused, since oculus code reads some vocab keys.
- (b) None. The step's list names none, though its main clause ("a value that names an entry of another file") covers them.
- (c) Rename too.
  - Con: it would change keys code depends on.
- Recommended: (a). The lazy option is (b).

**C4. Renaming a project id.**
- (a) Refused, with a sentence pointing at the folder's rename in Files. M7's move flow uses D39's index to rewrite the id references, so D39 is prepared before M7.
- (b) D39 moves the folder and rewrites the references as one operation.
  - Con: a new write kind beside `lsp-edit`, against Z682 (2), and it duplicates M7's place logic.
- (c) Values renamed and the folder left as is.
  - Con: every manifest's `id` then differs from its folder, a finding.
- Recommended: (a), with the queue changed to D39 before M7. The lazy option is (c).

**C5. The edit list's shape.**
- (a) A Refactor Preview as VS Code's: files with their edits, a check per edit, and Apply and Discard. It is shown always for a hub-key rename, and on Shift+Enter in the rename box for every other server, as VS Code does. Enter there applies at once.
- (b) A Confirm listing the files and their counts.
- (c) A preview for every rename of every server, always (Z682 (3) read literally).
  - Con: it departs from VS Code's Enter.
- (a) is a new view, with a place in `layout.yml`, a catalog and glyphs.
- Recommended: (a). The lazy option is (b).

**C6. A file over the copy limit.**
- (a) `lsp-edit` keeps its history copy up to the delete limit of 5 MB (`DELETE_MAX_BYTES`, `history.ts:50`), so the radar can be renamed in.
- (b) The rename is refused with `too_large`'s sentence.
  - Con: every project id in the radar becomes unrenameable.
- (c) The file is written without a copy.
  - Con: it has no undo.
- Recommended: (a). The lazy option is (b).

**C7. How the index stays current.**
- (a) Built in the snapshot build and published with the schemas, with the relay overlaying the page's open document texts.
- (b) Read from disk on each request (about 80 to 150 ms measured for parsing).
- (c) A watcher of its own.
- Recommended: (a). The lazy option is (b) without the overlay, which refuses edits against dirty tabs.

**C8. The guarded entries in section 9.** Axel's open item. The brief writes no test for them until he rules.

## 12. The paths D39 would write

The exact list depends on C1 to C7; this list assumes the recommendations.
- tools/oculus/src/lib/server/machine/lsp/servers.ts
- tools/oculus/src/lib/server/machine/lsp/relay.ts (and its split)
- tools/oculus/src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts (new)
- tools/oculus/src/lib/server/machine/lsp/schema-feed.ts
- tools/oculus/src/lib/data/snapshot/schema/run.ts
- tools/oculus/src/lib/data/snapshot/schema/set.ts
- tools/oculus/src/lib/data/snapshot/schema/lists.ts
- tools/oculus/src/lib/data/snapshot/<new folder for the reference index> (new; schema/ is full)
- tools/oculus/src/lib/data/index.ts
- tools/oculus/src/lib/server/root/watch/portfolio.ts
- tools/oculus/src/lib/server/files/fs/lsp-edit.ts (C6)
- tools/oculus/src/lib/server/files/fs/history.ts (C6)
- tools/oculus/src/lib/ui/controls/editor/kit/lsp/transport.ts (and its split)
- tools/oculus/src/lib/ui/controls/editor/kit/lsp/services.ts
- tools/oculus/src/lib/state/system/machine/lsp/edits.ts
- tools/oculus/src/lib/state/system/<preview store> (new)
- tools/oculus/src/lib/views/<Refactor Preview view> (new, with its registration)
- tools/oculus/src/lib/views/sources/source/language/lsp.ts
- tools/oculus/src/lib/ui/controls/editor/commands.ts (whole-key selection)
- tools/oculus/src/lib/ui/controls/editor/types.ts
- tools/oculus/src/lib/views/sources/source/Editor.svelte
- tools/oculus/src/lib/state/sessions/source/draft.ts
- tools/oculus/src/lib/data/prose/text-edits.ts (refusal notices)
- tools/oculus/src/lib/data/snapshot/validate.ts (C2 (b), `checkWaitingOn`)
- tools/oculus/config/schemas/manifest-schema.yml (C2 (b), `waiting-on`)
- tools/oculus/config/schemas/deck-schema.yml (C2 (b), `slides`)
- tools/oculus/config/layout.yml (the preview view)
- tools/oculus/config/text/views/<the preview's catalog file>
- tools/oculus/config/catalogs/glyphs.yml (only for a new glyph)
- tools/oculus/tests/server/machine/lsp/<split folder and new test> (after Axel's entry)
- tools/oculus/tests/data/snapshot/<index test> (after Axel's entry)
- tools/oculus/tests/state/system/lsp/edits.test.ts
- tools/oculus/DESIGN.md (:142, :573, :574)
- tools/oculus/docs/files-and-search.md (:85)
- tools/oculus/docs/views.md (the preview view)
- tools/oculus/HELP.md (:79)
- docs/DATA-MAP.md (:260-336, including the false rows :287-290)
- tools/oculus/docs/diagrams/ (regenerated)
- tools/oculus/.scratch/migration/agents/reviews/D39-report.md

Usage: claude-opus-5-5, about 99 tool uses; time not measured.
Usage (from the completion notice): a26d8068dfc88ec1f, claude-opus-5-5, 284,764 tokens, 104 tool uses, 12.5 min.
