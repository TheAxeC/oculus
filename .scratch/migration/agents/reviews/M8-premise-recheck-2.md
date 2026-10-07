M8 premise recheck on main at 8bd2070c

Scope note first. `git rev-parse HEAD` printed `8bd2070c740d88b0dfaf6f8c7db6e00f5ac9f2f4` when I started. Main has moved since: `git log --oneline 0753a5e7..HEAD` now lists `d5d7f727b Give the PDF viewer its own box inside the frame` above 8bd2070c. `git show --stat d5d7f727b` shows it changes only `orchestrator-state.md`, `plan.md`, `queue.md` and `src/lib/views/sources/file/pdf/viewer.svelte.ts`. Its `plan.md` hunk touches D45's look line and adds the six premise-recheck agent lines, and nothing about M8. So every finding below holds at 8bd2070c and also at d5d7f727b.

I changed no file. I unpacked one npm tarball, `yaml-language-server@1.24.0`, into my scratchpad (`.../scratchpad/ylstgz/package`) to read its source.

## 1. Premises

### 1a. The step's text, the Step 0 bullets and the rulings

- **Premise: "M8 is prepared after D23b lands" (plan.md:245).** Holds. `git merge-base --is-ancestor 639820b9 HEAD` prints "639820b9 ancestor". The same holds for 0753a5e7 (D45), eede4598 (PR4) and c0a4af9c (D23c).
- **Premise: "D23b moves the language servers' entries into a shared module under `src/lib/data/` and brings `relay.ts` to 839 of 880 lines" (plan.md:245).** Holds.
  - The module is `src/lib/data/prose/lsp-servers.ts`, 209 lines (`wc -l`).
  - Its head comment says: "A server is one entry here and one there, and nothing else names a server or a language".
  - `wc -l src/lib/server/machine/lsp/relay.ts` gives 839.
- **Premise: how a server is added after D23b (Z682 (8): "a new server is made one entry of `servers.ts` and one adapter, with no language branch elsewhere").** Holds, with the additions listed below.
  - `servers.ts` is now 556 lines. Its head comment (`:1-8`) says a new server is "one entry in each of the two places, and the `adapter` of its entry here names what it needs of a root (written in a folder of its own beside this file)".
  - `ServerEntry` (`servers.ts:115-135`) now carries `adapter: Adapter` and an optional `clientTextDocument`. `createServers` builds `[pyright(options), clangd(), typescript(options), svelte(options)]`.
  - `packaged(options, id, entry, setup)` launches a package from oculus's `node_modules` under `options.node`. A yaml-language-server entry can reuse it with `['yaml-language-server','bin','yaml-language-server']`; that bin requires `../out/server/src/server.js` (read in the tarball).
  - The `ADAPTERS` table in relay.ts is gone: `grep -c ADAPTERS relay.ts` prints 0, where c0a4af9c had it at `:85`. The relay now calls `held.entry.adapter.prepare(...)` (`relay.ts:648`).
  - On the page side there are no language branches left:
    - `hosts.ts:19` imports `SERVED_LANGUAGES, factsForLanguage` from `$lib/data/prose/lsp-servers`.
    - `language/lsp.ts:37` reads `factsForLanguage` and `LSP_CHOICES`.
    - `client.ts:255` reads `formatOnType` from the facts.
    - `grep -rn "'pyright'\|'clangd'\|LspServerId\|server_pyright..." src config/text`, excluding the two registry modules and the svelte imports, finds only `statusbar.yml:85-88` (the four `server_<id>` words).
  - The facts entry needs these catalog words: `statusbar.server_<id>`, `source.cmd_<x>_restart` and `source.cmd_<x>_output`. These exist for the four servers (`statusbar.yml:85-88`, `source.yml:13-36`).
  - A no-choice adapter exists to copy: `web/typescript-adapter.ts` (34 lines). Its `choices()` returns `{}`, `choose()` returns `{ choice: {}, apply: 'configuration' }`, and it uses `...NO_APPROVAL`.
- **New premise the brief must carry: the `common()` capability set does not fit yaml-language-server.**
  - `servers.ts`'s `common()` ("The capabilities every server keeps") always declares `typeDefinitionProvider`, `referencesProvider`, `documentHighlightProvider` and `workspaceSymbolProvider`.
  - yaml-language-server 1.24.0 declares none of these. Its `out/server/src/yamlServerInit.js:83-104` lists textDocumentSync Incremental, `completionProvider { resolveProvider: false }`, hover, documentSymbol, `documentFormattingProvider: !clientDynamicRegisterSupport`, `documentOnTypeFormattingProvider '\n'`, definition, `renameProvider { prepareProvider: true }`, documentLink, folding, selectionRange, codeAction, codeLens and executeCommand.
  - So the yaml entry cannot spread `common()` as the other four do.
- **New premise the brief must carry: there is no place for a server request specific to one server.**
  - Server-to-client requests are answered in `held/held.ts:283` `answer()`: workspace/configuration, register/unregisterCapability, workDoneProgress/create, diagnostic/refresh, showMessageRequest, showDocument and workspaceFolders. Anything else falls through to `relay.ts:705` `#serverRequest`, whose `default:` (`:732-737`) answers METHOD_NOT_FOUND.
  - `ServerEntry` has no member for a server request of its own. yaml-language-server sends `custom/schema/content` for any schema URI that is not `file:` or `http(s):` (`languageservice/services/schemaRequestHandler.js:53-122`).
  - So a schema served from memory needs a new optional entry member, or a case in held.ts. A case in held.ts would break Z682 (8)'s "no language branch elsewhere".
- **Premise: `workspace/configuration` is answered per item through `entry.configuration(section, setup)`.** Holds, at `held/held.ts:290-301`.
  - The relay pushes `workspace/didChangeConfiguration` on a reconfigure (`choices.ts:123`, `:158`).
  - yaml-language-server pulls the sections `yaml`, `http`, `[yaml]`, `editor` and `files` (`settingsHandlers.js:46-50`), and its `configure` calls `schemaService.clearExternalSchemas()` (`yamlLanguageService.js:47-48`). A reconfigure therefore drops cached schemas.
  - `Setup` (`servers.ts:31-52`) has no field for schema associations, so the yaml adapter's `prepare` would add one, as `configApproved` was added for Svelte.
- **Premise: dynamic registrations are handled.** Only partly. `held.ts:342-345` `#registered` keeps only `workspace/didChangeWatchedFiles`, so a dynamic formatting registration from the server is ignored. Formatting reaches the page only if the entry's `capabilities` declares it.
- **Premise (Z672 (1)): "the cockpit selftest (`tools/cockpit/src/cockpit/selftest.py:595-621`)" reads `options_from` and is renamed.** False; the reader has moved.
  - `git grep -n "options_from" -- tools/cockpit` finds only `tools/cockpit/src/cockpit/page.py:706-709`, which resolves `options_from` into a select's `options`.
  - `selftest.py:595` `_validate_palette_schemas` reads only `options` (`:612`).
  - The rename therefore reaches `page.py:706-709`, and selftest.py is untouched by Z672 (1).
- **Premise (Z672 (2)): "a registry by its `sources.yml` name (`from: people`)".** Partly false; the names do not line up with sources.yml.
  - sources.yml names the registry files `venues_file :28`, `datasets_file :32`, `pillars_file :36`, `domains_file :39`, `people_file :43`, `organisations_file :46` and `resources_file :49`. Funding appears only as the collection key `funding` (`:59`). The datasets file is also the collection key `data` (`:54`). There is no `projects` name.
  - The vocabulary the code keys by is `RegistryName` (`data/model/model-entities.ts:19-27`): venues, datasets, pillars, domains, funding, people, organisations, resources. The `IdSets` in `validate.ts:773-786` add `projects` from `raw.manifests`.
  - manifest-schema.yml already uses exactly that set (`from: venues|domains|pillars|funding|people|projects|datasets|resources`, lines `:41-68`).
  - The `vocab.` prefix is needed for a real clash: `vocab.yml:51` has a key `domains`, and `domains` is also a RegistryName.
- **Premise: the key a reference resolves to is on disk.** Holds, but the identity field differs per file.
  - `data/sources/registries.ts:39-48` `SHAPES` gives venues `idField: 'id'`, funding `key` with `idRequired: false`, and the other six `key`.
  - Resources are filtered by `keptResources` (`validate.ts:784`).
  - `identityField` (`server/files/fs/collections.ts:49-52`) takes a schema's first field. For venues that gives `name`, which is not what `venue_id` names.
- **Premise (Z672 (5)): the side-project schema is `config/catalogs/side-project-schema.yml`, "the folder goes from 8 to 9 items".** Moved.
  - `git ls-files config/catalogs` now lists 9 files. D45 added `latex.yml`: `git log --oneline c0a4af9c..HEAD -- config/catalogs` names 0753a5e76 and 639820b91.
  - The side-project schema makes 10, the folder limit (`spec.md:46`).
  - Z672 (8) also calls for a deck `present.yml` schema and a `.oculus/cpp.yml` schema. If both go in `config/catalogs/`, the count is 12.
- **Premise (Z681): `DESIGN.md:24` reads "Not a rewrite of the data. The YAML in the hub is the source of truth and its shape does not change for oculus."** Holds (`grep -n "shape does not change" DESIGN.md` gives `24:`).
- **Premise (Z436): M8 keeps `docs/DATA-MAP.md` true.** Holds as a duty.
  - `wc -l` gives 490, and `git diff --stat c0a4af9c HEAD -- docs/DATA-MAP.md` is empty.
  - The hub `docs/` folder is not in the worktree paths: `.agents/plan.yaml:12` lists `[tools/oculus, tools/cockpit, feeds, registries, projects, funding, network, education, applications, tasks, side-projects, tools/present]`.
  - Neither is `tools/data`. plan.md:243 says M8's worktree adds `tools/data`, and nothing says it adds `docs`.
- **Premise (Z345, Z672): yaml-language-server 1.24.0 is MIT and maintained by Red Hat.** Holds.
  - `npm view yaml-language-server` gives version 1.24.0, license MIT, dist-tags `latest: 1.24.0`, `next: 1.25.1-19631be.0`, and maintainers mohitsuman, rhdevelopers-ci, yvydolob and gercan.
  - `npm view ... time` gives 1.24.0 at 2026-07-07T20:01:54Z.
  - It is not installed: `ls node_modules/yaml-language-server` prints "No such file or directory".
- **Premise (Z672 (6)): ajv 8.20.0, MIT, blakeembrey and esp, released 2026-04-24.** Holds.
  - `npm view ajv` gives 8.20.0, MIT, time.modified 2026-04-24T15:22:16Z, `latest: 8.20.0`.
  - Installed now is only 6.15.0 (`node_modules/ajv/package.json`), pulled in through eslint. It is not in package.json.
- **Premise: oculus has `yaml` 2.9.x and yaml-language-server pins `yaml 2.8.3`.** Holds: `package.json:109` has `"yaml": "^2.9.0"` and node_modules has 2.9.1.
  - yaml-language-server's other dependencies: ajv ^8.17.1, prettier ^3.8.1 (oculus has 3.9.6 as a devDependency, `package.json:42`), vscode-languageserver ^9.0.0 (9.0.1 installed), vscode-languageserver-types ~3.17.5 (3.18.4 installed), picomatch ^4.0.4 (4.0.7 installed), request-light (absent) and jsonc-parser ^3.3.1 (2.3.1 installed).
  - Since it would sit in `dependencies`, prettier becomes a runtime dependency.
- **Premise (survey 3): the server's defaults reach the network.** Holds.
  - `yamlSettings.js:27`, `:31` and `:33` set `yamlHoverSchemaSource = true`, `schemaStoreEnabled = true` and `kubernetesCRDStoreEnabled = true`.
  - New: a modeline `# yaml-language-server: $schema=<uri>` is always honoured, and no setting turns it off. `yamlSchemaService.js:345-366` `resolveModelineSchema` reads it before associations.
  - The only way to keep `http(s)` schemas off the network is the `yaml/registerContentRequest` notification. It sets `useVSCodeContentRequest = true` (`notificationHandlers.js:43`), after which an `http(s)` schema is asked of the client as `vscode/content` (`schemaRequestHandler.js:97-103`).
  - A `file:` modeline is read from disk by the server itself (`:89-95`).
  - `git grep -ln "yaml-language-server:" -- '*.yml' '*.yaml'` counts 0 in the hub today.
- **Premise: the 16 hub `schema:` blocks.** Hold, on the same lines (loop of `grep -n '^schema:'`): applications 5, education 5, position-leads 51, funding 5, events 5, joint-work 8, boilerplate 10, data 24, domains 3, organisations 6, people 7, pillars 26, repos 5, resources 5, venues 14, tasks 6.
  - A Python recount gives keys field 147, type 147, required 33, label 27, options 12, help 60, options_from 3.
  - Types: text 80, select 15, metalist 6, tags 18, textarea 18, date 8, raw 1, checkbox 1.
  - So "a help line on every field" means 87 help lines to add.
- **Premise: 146 hub yml/yaml files, 94 manifests with no `schema:`, 3 hub side projects, 6 `.oculus/project.yml` outside the hub, 26 non-tools deck `present.yml`.** Holds, by the same `git ls-files` and `ls` commands. The six tools-side `present.yml` are unchanged: cockpit template, `tools/oculus/config/present.yml`, `config/text/views/academic/present.yml`, two demo decks, `tools/present/content/present.yml`.
- **Premise: options.yml counts (survey: 1200 lines; control 155, description 202, values 23, values_from 20; sections at `:15/:170/:732/:966/:979/:1113`).** Moved. D45 added the LaTeX options (`git log c0a4af9c..HEAD -- config/catalogs/options.yml` gives 0753a5e76).
  - Now: 1286 lines. `grep -oE "\bkey:"` counts control 167, default 120, section 168, values 27, min 40, max 27, description 216, `values_from:` 19 (20 matches of the bare word, one of them in the shape comment at `:10`), heading 139.
  - The file sections are `appearance.yml :15`, `behavior.yml :170`, `layout.yml :818`, `present.yml :1052`, `sources.yml :1065` and `local.yml :1199`.
- **Premise: manifest-schema.yml is 74 lines, `from:` comment at `:16-18`, section "Archive (archive tier)" at `:26`.** Holds (`grep -c ""`, `sed -n 16,18p`, `sed -n 24,27p`).
- **Premise: the false help lines `venues.yml:27`, `data.yml:28`, `data.yml:32`.** Hold, by `sed -n` on each line.
- **Premise: the comment at `data.yml:9`.** Moved in content: line 9 now reads "#  PRIVATE / local-only. Which projects use each set is now auto-derived ...". So the retrieval-method comment the ruling names is not at `:9`, and the brief locates it with `grep -n "retrieval.method" registries/data.yml`. The method counts still hold: direct 1, library 9, manual 28, physionet 3, physionet_zip 2, private 4, script 4, zenodo 3.
- **Premise: redownload.py.** Holds.
  - `redownload.py:217` reads the method. library is handled at `:220`, manual/private at `:222`, physionet, physionet_zip and zenodo at `:231-236`, url at `:237`, and the "unknown retrieval.method" line is at `:240`.
  - New fact: `fetch_url` (`:154`) reads `retrieval.url` or `urls`. pmc-patients' `direct` carries `base_url` and `priority_first`, and the four `script` sets carry only `notes` (Python read of `registries/data.yml`).
- **Premise: the Z468 data departures.** Hold.
  - `grep -n "access: public"` gives `77:`. Access counts: open 39, registration 7, credentialed 3, private 4, public 1. `vocab.yml:252` `data_access` has 4 keys.
  - `hcin` is at `venues.yml:244-262`, a journal with `timing`, `deadline: "2026-12-02"` and `call`.
  - Graz is at `events.yml:62-73`, `role: present`, `status: not-attending`, with no link. It is the only one of the 4 `role: present` events without a link (Python read).
  - `venue_categories` is `[journal, conference]` (`vocab.yml:256`).
  - `git diff --stat c0a4af9c HEAD` over every hub data folder is empty.
- **Premise: `career.yml:17-21` uses `when` as a data key.** Holds (`sed -n 17,21p`). It is a value of `field:` in a schema item, while the condition is a key of the item map, so the two do not collide in YAML.
- **Premise: the readers of the reference keys** (`git grep -n "options_from\|optionsFrom\|values_from"`).
  - These hold at their lines: `normalise.ts:576/:586`, `collectionSchema :602`, `model-collections.ts:37`, `state/sources/fs.svelte.ts:209`, `entries.ts:88`, `normalise.test.ts:201`, `migrate-joint-work.mjs:273`, `demo/network/joint-work.yml:11`, `docs/apps.md:247`, `config-fit.ts:71/:164`, `editors/fields.ts:252`, `value-rule.ts:97/:105`, and `catalog/options.ts:144`, `:300`, `:301`, `:309`.
  - These moved:
    - `collection.ts`: `PEOPLE_OPTIONS :135` (was :134), `kindOf :157` (was :156), `optionsFrom(config[...]) :623` (was :626).
    - `settings.ts`: the `values_from` loop `:76`, `PROBLEM_READERS :734` (was :505), `settingProblems :760` (was :531).
    - `catalogs.ts` `settingFindings :243` (was :234). Its callers are `context.ts:372` and `watch/portfolio.ts:533`.
    - `findings.yml` `no_values :113` (was :110).
  - The `description` readers are `catalog/options.ts:264-268`, `state/system/config/rows.ts:177/:243` and `search.ts:44`.
- **Premise: the validate.ts table.** Holds: 863 lines, `REFERENCES :83-132`, `SHAPES :134`, `fieldNames :183`, `schemaKeys :193`, `checkKeys :218`, `checkCollectionSchema :561`, `validate() :828`. The per-relation finding sentences are `findings.validate.no_venue|no_domain|no_funding|no_dataset|no_pillar|no_related|no_resource`.
- **Premise: the integrity test's head comment.** Holds: `integrity.test.ts:5` says "validates against the real hub with zero findings".
- **New premise: hub files hold fields their schema does not declare.**
  - A Python comparison of entry keys against declared fields gives education `snooze` 2, events `snooze` 2, venues `snooze` 2 and tasks `subtasks` 3.
  - `git grep -ln snooze -- tools/oculus/src` shows oculus itself writes `snooze` (`edit/writes/bodies.ts`) and `subtasks` (`edit/writes/subtasks.ts`).
  - Manifests have no key outside manifest-schema's 46 fields (the same script prints `{}`).
- **Premise: `DESIGN.md:23` and `:571`, `docs/files-and-search.md:71`.** Moved in content. D23b rewrote them to name four servers, each listing pyright, clangd, the TypeScript server and the Svelte server (`grep -n` output). A YAML server makes each false again, along with `README.md:15` (the licence line naming each server package) and G36's text.
- **Premise: G36.** Holds, with new text. `guarded.md:65` names "one pyright ..., one clangd ..., one TypeScript server ... and one Svelte server". Its Code line is `held/process.ts` (moved from `lsp/process.ts` by D23b) plus `relay.ts`, and its test is `tests/server/machine/lsp/lifetime.test.ts`.
- **Premise: `servers.test.ts`'s spawn expectation.** Moved. It now waits for 4 spawns and expects `['/node','/node','/node','clangd']` (`sed -n 30,60p tests/server/machine/lsp/servers.test.ts`).
- **Premise: YAML is the editor language `yaml`.** Holds: `sources.yml` `languages:` `yaml: [.yml, .yaml]` and `grammars.ts:52`, `:74`.
- **Premise: served roots.** `sources.yml:92-97` lists six roots outside the hub (cathedra, game-engine, ordo, scotoma, officium, youtube-downloader). Each holds `.oculus/project.yml` (`ls ~/workspace/*/.oculus/`).
- **Premise: `.oculus/cpp.yml`.** Holds: its reader is `lsp/clangd/cpp-file.ts`, 178 lines. Not in the survey: `.oculus/commands.yml` is also read by oculus (`runs/commands/files.ts`, `saved.ts`), and Z672 (8) does not name it.
- **Premise: `local.yml` is never served or read into a page (G3, `guarded.md:13`).** Holds as an entry, so `local.yml`'s text must never reach yaml-language-server through `didOpen`.

### 1b. Folder counts and sizes

Folder counts come from `git ls-files <d> | cut | sort -u | wc -l`; the limit is 10.
- At 10: `server/machine/lsp` (choices.ts, clangd, held, library, pyright, relay.ts, servers.ts, uris.ts, web, wire.ts). Z682 (8) wants a new adapter "in a folder of its own beside this file", which would make 11.
- Also at 10: `kit/lsp`, `src/lib/data`, `data/model`, `data/sources/config`, `config/text/views/sources`.
- Below 10: `data/prose` 9, `config/catalogs` 9, `tests/server/machine/lsp` 9, `server/machine` 9, `catalog/` 8, `data/snapshot` 8, `config` 7, `language/` 6, `state/forms` 5, `tests/checks/config` 4.

Sizes come from `wc -l`; the lines are 880 for a source file and 520 for a component.
- At or near the line: `root/context.ts` 879, one line of room. `transport.ts` 871. `validate.ts` 863. `relay.ts` 839. `normalise.ts` 837. `collection.ts` 806.
- `settings.ts` grew from 541 to 770 with D45.
- With room: `held/held.ts` 601, `servers.ts` 556, `language/lsp.ts` 543, `options.ts` 541, `manifest.ts` 486, `model-processes.ts` 481, `entries.ts` 473, `forms/schema.ts` 383, `catalogs.ts` 321, `lsp-servers.ts` 209, `hosts.ts` 188.
- `Source.svelte` is 517.

## 2. Changes since the earlier report (c0a4af9c)

`git log --oneline c0a4af9c..HEAD | wc -l` gives 24 commits; the landings among them are eede45985 (PR4), 639820b91 (D23b) and 0753a5e76 (D45), plus d5d7f727b after 8bd2070c. Per path (`git log --oneline c0a4af9c..HEAD -- <path>`):

- **`DESIGN.md`** (PR4, D23b, D45). D23b rewrote `:23` and `:571` to four servers and added `:572` (what a language server may change).
- **`HELP.md`** (PR4, D23b, D45). D23b added the F2 row (`:79`) and the References row (`:109`).
- **`config/catalogs/options.yml`** (D45). It gained the `latex.*` entries: about 14 descriptions and 4 new `values:` lists; `values_from` is unchanged at 19.
- **`config/catalogs/latex.yml`** (D45). New, which brings `catalogs/` to 9.
- **`config/sources.yml`** (D45). The `latex:` extensions line only.
- **`config/text/views/sources/source.yml`** (D23b). It added `cmd_svelte_*` and `cmd_typescript_*` (`:31-36`).
- **`config/text/statusbar.yml`** (D23b). It added `server_<id>` at `:85-88`.
- **`config/text/findings.yml`** (D45). +3 lines, which moved `no_values` to `:113`.
- **`package.json`** (D23b, D45). It added `svelte-language-server 0.18.4`, `typescript 6.0.3` (moved into dependencies), `typescript-language-server 6.0.1`, `typescript-svelte-plugin 0.3.52` and `pdfjs-dist 6.4.299`.
- **`docs/files-and-search.md`** (D23b, D45). `:71` now names four servers.
- **`docs/configuration.md`** (D45). +1 line: the `catalogs/latex.yml` row.
- **`src/lib/data/prose/lsp-servers.ts`** (D23b). New: `LspServerId`, `LspServerFacts`, `LSP_SERVERS`, `serverFacts`, `factsForLanguage`, `SERVED_LANGUAGES`, `LSP_CHOICES` and `choicesOfLanguage`.
- **`server/machine/lsp/servers.ts`** (D23b, +328/-). Changes:
  - `ServerEntry.adapter` added;
  - `Adapter.revoke` and `approve` returning an `Applying | null`;
  - the `typescript` and `svelte` entries;
  - `packaged()`, `ownFolder()`, `common()` and `Offers`;
  - `clientTextDocument`.
- **`relay.ts`** (D23b, +182/-). `ADAPTERS` removed; `#serverRequest` (`:705-738`) gained `workspace/applyEdit`.
- **`held/held.ts`** (D23b). 4 lines. `lsp/process.ts` moved to `held/process.ts`, and `held/elsewhere.ts` and `held/oculus.ts` are new.
- **`web/`** (D23b). New: approval.ts, config-files.ts, svelte-adapter.ts, typescript-adapter.ts.
- **`choices.ts`** (D23b). +78: `NO_APPROVAL`, `notFound` and the reconfigure path (`:123`, `:158`).
- **`kit/lsp/hosts.ts`, `client.ts`, `transport.ts`, `transport/edits.ts`, `uris.ts`** (D23b). They read the facts module, plus the edit path.
- **`views/sources/source/language/lsp.ts`** (D23b, +178). Its language branches are replaced by `factsForLanguage`.
- **`data/model/model-processes.ts`** (D23b, D45, +235). D23b added `LspApproval`, `LspConfig` and `LspPlace`; `LspCode` is now at `:346`.
- **`data/sources/config/settings.ts`, `catalogs.ts`** (D45). The LaTeX settings readers, which moved the line numbers listed in section 1a.
- **`state/boards/collection.ts`** (D45). `fileBytesUrl` replaces a hand-built URL, which moved the lines listed in section 1a.
- **`tests/server/machine/lsp/servers.test.ts`, `lifetime.test.ts`, `lsp-fixture.ts`, `uris.test.ts`** (D23b), and the new `svelte-trust.test.ts`.
- **Unchanged since c0a4af9c** (`git diff --stat c0a4af9c HEAD` prints nothing): every hub data folder, `docs/DATA-MAP.md`, `tools/cockpit`, `tools/data`, `data/snapshot/*`, `model-collections.ts`, `writes/entries.ts`, `writes/manifest.ts`, `state/forms`, `fs/collections.ts`, `state/sources/fs.svelte.ts`, `vocab.yml`, `manifest-schema.yml`, `docs/apps.md` and `demo/`.

## 3. Paths this step writes

A builder never writes under `.scratch/`; `agents/guarded.md` (the G36 widening, and any entry for the schema generator or ajv) is the orchestrator's. The other steps named for each path come from the plan lines (plan.md:196, 231, 236, 491, 514-519, 530, 576, 594, 599) and the existing briefs: `briefs/X3e.md:420`, `D11.md:367`, `D28.md:246` and `M6.md:275`. These briefs predate D23b and D45, and five of them are being re-prepared. `briefs/D15.md` (7 lines) names no paths. D43, D33, D39, D36, D40, M7 and D41 have no brief.

### Hub data

These need the hub data folders in the worktree, plus `docs` and `tools/data`, which `.agents/plan.yaml:12` lacks.

- **The 16 files with a `schema:` block**: `applications/applications.yml`, `education/education.yml`, `feeds/position-leads.yml`, `funding/funding.yml`, `network/events.yml`, `network/joint-work.yml`, `registries/{boilerplate,data,domains,organisations,people,pillars,repos,resources,venues}.yml`, `tasks/tasks.yml`.
  - What changes: help lines on every field, `when:`, and the rename `options_from` to `from` (`venues.yml:18`, `:21`, `joint-work.yml:11`, with the `vocab.` prefix on the venue pair).
  - Data values: `data.yml:77`, the retrieval-method comment, `data.yml:28` and `:32`; `venues.yml:27` plus the three uncategorised venues; the Graz role in `events.yml`.
  - Also written by M6, at the lines just above each block: data.yml:23, venues.yml:13, pillars.yml:24, domains.yml:1, boilerplate.yml:9, repos.yml:4, events.yml:1 and 4, joint-work.yml:7.
- **`registries/career.yml` and `feeds/literature-radar.yml`**: each gets a new `schema:` block. No other step is known to write them.
- **`tools/data/redownload.py`** (`direct`, `script`). None known.
- **`docs/DATA-MAP.md`**, the lines listed in the earlier report's section 5. Also M6 (lines 191, 414, 425, 428, 438, 441, 442).

### oculus config

- **`config/catalogs/manifest-schema.yml`**: `from: vocab.<key>` and the archive section's name. None known.
- **`config/catalogs/options.yml`**: `description` to `help` (216), `values` to `options` (27), `values_from` to `from` (19), and the shape comment `:8-11`. Also X3e, D11 (approvals and `rite_dap_bin`), D28 (editor keys), and M7 (a Files setting, by its plan line).
- **`config/catalogs/vocab.yml:256`** (`venue_categories`). M6 writes `:249`.
- **New: `config/catalogs/side-project-schema.yml`** (Z672 (5)), plus a deck schema and a `cpp.yml` schema (Z672 (8)). Where they go is choice C8.
- **`config/text/statusbar.yml`** (`server_yaml`). D11 (the debug item); D43 (`server_texlab`, by Z682 (8)).
- **`config/text/views/sources/source.yml`** (`cmd_yaml_*`). X3e, D28, D43.
- **`config/text/findings.yml`**: the `no_values` sentence at `:113`, and new finding sentences for schema and `from:`/`when:` problems. Also M6.
- **`tools/oculus/demo/network/joint-work.yml:11`**: 15 demo files have `schema:`, and one has `options_from`. None known.

### oculus source and tests

- **`src/lib/data/prose/lsp-servers.ts`**: the yaml facts entry. Also D43.
- **`src/lib/server/machine/lsp/servers.ts`**: the yaml entry, its own capability list, and a server-request member. Also D43.
- **New: the yaml adapter.** `lsp/` is at 10, so the adapters are regrouped. D43 needs the same regrouping, and whichever step lands first does it.
- **`lsp/held/held.ts` or `relay.ts`**: only if the server-request hook is wired there. Also D43 (texlab).
- **New: the schema generator module(s)**, from the hub blocks, manifest schema and options catalog to JSON Schema, plus reference keys and globs. `data/snapshot` has 8 items. None known; D39 reads it.
- **`data/snapshot/validate.ts`**: REFERENCES replaced by ajv. Also M6 (`validate-kinds.ts` or `validate-entries.ts`, new).
- **`data/snapshot/normalise.ts:576`, `:586`**: `from`. None known.
- **`data/model/model-collections.ts:37`**: `optionsFrom` renamed, which is the apps API. None known.
- **`state/boards/collection.ts`**: `:134`, `:135`, `:155`, `:157`, `:160`, `:248`, `:623`. Also M6.
- **`state/sources/fs.svelte.ts:209`**. Also M6 and X3e.
- **`server/edit/writes/entries.ts:88`**: comment and select check. Also M6.
- **`state/forms/schema.ts`**: manifest `from`. None known.
- **Options catalog readers**: `data/sources/config/catalog/options.ts`, `value-rule.ts` and `option-findings.ts`; `data/sources/config/settings.ts:76`; `server/edit/writes/config/config-fit.ts:71`, `:164`; `state/system/config/editors/fields.ts:252` and `rows.ts:177`, `:243`. X3e writes settings.ts.
- **Tests**:
  - `tests/server/machine/lsp/servers.test.ts` and `lifetime.test.ts` (G36's rows). Also D43.
  - `tests/data/snapshot/normalise.test.ts:201`.
  - `tests/data/sources/config/catalog/options.test.ts:42`.
  - `tests/checks/config/config-folder.test.ts:155-198`, the per-catalog key table, which gains rows for new catalog files.
  - The test of G14, `integrity.test.ts`, is held whole and is not edited.
- **`package.json` and `package-lock.json`**: `yaml-language-server` 1.24.0 exact and `ajv` 8.20.0 exact. Also D11 (`@vscode/debugprotocol`). D43 only if texlab came from npm.

### Docs

- **`DESIGN.md`**: `:23` (also D36, which rewrites "no lint panel" there, and D43), `:24` (Z681), `:571` (also D43), and any decision line for the schema generation. Also D11, D28, M6, X3e (whose brief names its lines in the report rather than writing them).
- **`HELP.md`**: only if it names the YAML editor's behaviour; I found no line today. Also D11, D28, M6.
- **`README.md:15`**: the licence line, adding yaml-language-server (MIT) and ajv (MIT). D43 only if texlab is a dependency.
- **`docs/files-and-search.md:69-71`** (Language servers). Also D43.
- **`docs/configuration.md`**: the catalog table rows `:19` and `:21`, plus the new schema files. None known.
- **`docs/apps.md:247`** (`optionsFrom`). None known.

### Outside oculus

- **`tools/cockpit/src/cockpit/page.py:706-709`**: `options_from`. None known.
- **`tools/oculus/utils/migrations/migrate-joint-work.mjs:273`**: the template line holding `options_from`. None known.

## 4. Libraries

1. **The YAML language server**: yaml-language-server 1.24.0.
   - MIT, Red Hat (mohitsuman, rhdevelopers-ci, yvydolob, gercan), released 2026-07-07, already ruled by Z345 and Z672.
   - Compatibility: it runs as a child process under oculus's node v24.21.0 (`node --version`) through `packaged()`.
   - Its exact `yaml 2.8.3` nests beside oculus's 2.9.1. Its `ajv ^8.17.1` dedupes with a direct ajv 8.20.0. It makes prettier 3 a runtime dependency.
   - It replaces completion, hover, value marks, folding and the document outline for YAML.
   - Still hand-written: the entry, the adapter, the settings answer and the schema content answer.
2. **Validating the hub against the same schemas for Findings and G14**: ajv 8.20.0.
   - MIT, blakeembrey and esp, 2026-04-24, ruled by Z672 (6). It works with oculus's ESM and TypeScript; ajv 6.15.0 stays under eslint.
   - It replaces the `REFERENCES` table and its loops in `validate.ts`.
   - Still hand-written: mapping each ajv error (`instancePath`, `keyword`) to a catalog finding sentence (`spec.md:48`), and to a line through the `yaml` package's document ranges.
   - An alternative already in the dependency it brings: yaml-language-server's own `getLanguageService(...).doValidation(document)` (`out/server/src/index.d.ts` re-exports it; `yamlLanguageService.d.ts:111`). Run in the server process, it would give Findings exactly the editor's marks with no second validator, but its messages are English library text and it needs a TextDocument per file. Z672 (6) ruled ajv; I name this only as the candidate the ruling did not weigh.
3. **ISO date fields**: ajv-formats 3.0.1 (MIT, last modified 2024-03-30). Recommend not adding it: the existing `ISO_DATE` pattern of `writes/entries.ts` expressed as `pattern` covers `type: date`.
4. **Path globs for `when: { path: ... }` and the schema-to-file match**: `node:path` `matchesGlob`, built in and already used in `lsp/held/watch.ts:17`. picomatch 4.0.7 (MIT, modified 2026-08-24) is installed transitively but is not a direct dependency. Recommend `node:path`. yaml-language-server matches `yaml.schemas` globs itself.
5. **JSON Schema TypeScript types**: ajv exports `SchemaObject` and `JSONSchemaType`. `@types/json-schema` 7.0.15 (MIT) would be another devDependency. Recommend ajv's types.
6. **Converting the three in-house schema formats (hub blocks, manifest schema, options catalog) to JSON Schema**: none found, since these formats are oculus's own. zod 4.6.5's `toJSONSchema` converts zod objects, not YAML data. Hand-written.
7. **Reading the keys of a referenced file on disk**: none needed. Reuse `registries.ts` `SHAPES` (id fields), `keptResources`, the manifest ids, and `configItems` (`catalog/options.ts:457`) for option sources.
8. **monaco-yaml** 5.5.1 (MIT, 2026-06-03, peer `monaco-editor >=0.36`). It runs the YAML service in a page worker outside D23's relay, and the earlier report's choice listing records it as not used. Not a candidate under Z672.
9. **redownload.py `direct` and `script`**: none needed. The Python standard library and the existing `fetch_url`/`wget` path cover it.

## 5. Choices

### User-visible, or changing an established decision

- **C1. The vocabulary `from:` resolves.** Z672 (2) says "by its `sources.yml` name", but sources.yml has no `projects` and names funding only as a collection key (section 1a).
  - (a) Recommended: the eight `RegistryName` words plus `projects`, and `vocab.<key>`. Pro: it is what `validate.ts`, `registries.ts` and manifest-schema.yml already use. Con: it states the ruling's words more narrowly.
  - (b) sources.yml key stems (`venues`, `datasets` and so on) plus collection keys. Con: `data` and `datasets` would name one file twice, and `projects` would need inventing.
  - Lazy option: leaving names unresolved by the generator.
  - Reason for (a): one existing vocabulary, no new name.
- **C2. Which YAML files start yaml-language-server.**
  - (a) Recommended: every `.yml`/`.yaml` in any served root, with schemas only where a path matches, as VS Code's YAML extension does. Pro: syntax marks and an outline everywhere. Con: one more process per root with YAML tabs.
  - (b) Only files a schema matches. Con: a language with a server for some files and not others, which the facts module (`factsForLanguage` by language) cannot express without a branch.
- **C3. The event role word for a talk a co-author gives.** Z672 (7d) names no word.
  - Options: `co-present`, `coauthor` and `coauthor-presents`.
  - `stats.ts:154` counts every role but `attend` as disseminated, so any new word counts the talk.
  - Recommend `co-present`: one short word beside `present` and `attend`, and plainly a variant of `present`. The `events.yml:8` role help and the `link` help at `:15` are rewritten with it.
- **C4. Formatting YAML through the server.**
  - (a) Recommended: off. The entry declares no formatting capability, and settings send `yaml.format.enable: false`. Pro: Format Document and `format_on_save` never re-lay the hub's aligned flow maps with prettier. Con: no YAML formatter, where VS Code's YAML extension has one.
  - (b) On, with prettier's defaults. Con: rewrites hub files on save.
- **C5. Fields oculus itself writes into collection entries (`snooze` in education, events and venues; `subtasks` in tasks).**
  - (a) Recommended: the generator adds them to every collection's entry schema, with a catalog help line. Pro: one place, owned by the write code that writes them. Con: a schema reader of the hub file does not see them in the block.
  - (b) Declare them in each hub `schema:` block. Con: one definition copied into every file.
  - Either way G14 stays at zero findings; without one of them, the four files are marked.
- **C6. A field the schema does not declare.**
  - (a) Recommended: marked and a finding (`additionalProperties: false`), once C5 is in. Pro: a mistyped key is caught, as `checkKeys` already does for manifests.
  - (b) Allowed silently. Con: a typo passes.
  - Lazy option: (b).
- **C7. Scope beyond Z672 (8).**
  - `.oculus/commands.yml` (D17's project commands, read by `runs/commands/files.ts`) is a YAML file oculus reads and the editor opens, and Z672 (8) does not name it. The ruling's reason ("since the YAML editor opens all of them") covers it.
  - oculus's own catalogs (`config/catalogs/*.yml` other than options.yml) and `config/text/**` are opened in the editor and covered by no schema.
  - Recommend: include `commands.yml` under the same ruling. Put the catalogs and text files to Axel as a scope question, since the plan line says "options.yml for oculus's own config files" and options.yml covers only appearance, behavior, layout, present, sources and local.
  - Lazy option: reading Z672 (8) as the two files it lists.
- **C8. Where the new schema files go** (changes Z672 (5)'s premise). `config/catalogs` is at 9 since D45, and Z672 asks for three new schema files (side-project, deck, cpp).
  - (a) Recommended: a new `config/schemas/` folder (config goes from 7 to 8) holding `manifest-schema.yml`, moved, and the three new ones. Pro: under the limit, one place for schemas. Con: it moves `manifest-schema.yml` (the `CATALOGS_DIR` merge in `merge.ts:18`, `config-folder.test.ts:176`, `docs/configuration.md:19`) and departs from Z672 (5)'s path.
  - (b) `config/catalogs/schemas/`. Con: catalogs reaches 10 with the subfolder, and the merge reads only the folder's own files.
  - (c) Keep Z672 (5)'s path for the side-project schema and fold deck and cpp into one file. Con: two unrelated shapes in one file.
  - This departs from a ruling, so it goes to Axel or is closed in automode with (a).
- **C9. What `redownload.py` does for `direct` and `script`.**
  - (a) Recommended: `direct` downloads `base_url` + each `priority_first` name through `fetch_url`'s `wget -c`; `script` prints the set's notes as `show_manual` does. Pro: no guessing of commands.
  - (b) Rewrite pmc-patients to `method: url` with `urls:`. Con: a data change beyond Z672.
  - Note: `url` is handled by `redownload.py:237` but is not one of the eight values in use, so under Z672 (7f) a future `url` set would be marked. Recommend `url` joins the allowed values, since the tool supports it.
- **C10. Whether Findings also flag a value whose reference resolves to a key that exists twice** (duplicate registry keys). Recommend a finding naming the file and key, since the enum would list it once and a reader could not tell which entry is meant. Not decided by any ruling.

### Internal and reversible, for the brief to take

- **I1. Placement of the yaml adapter.** `lsp/` holds 10 items. Recommend `lsp/adapters/` holding `pyright/`, `clangd/`, `web/` and `yaml/`, which takes lsp to 7. D43 then adds `texlab/` there. `servers.ts:8` "a folder of its own beside this file" is reworded.
- **I2. Schemas served from memory under a custom URI scheme.** The server sends `custom/schema/content`, answered through a new optional `ServerEntry` member, for example `requests?: Record<string, (params, setup) => unknown>`, read in `Held.answer`, so no language branch is added (Z682 (8)). Recommend this over writing `file:` schemas under `~/.oculus`.
- **I3. Freshness.** On a change to any file a schema references, or to a schema file, the relay sends `workspace/didChangeConfiguration` through `choices.ts`'s reconfigure path, which clears the server's external schemas (`yamlLanguageService.js:48`).
- **I4. The `yaml` section answer.**
  - `schemas` (URI to globs, per root), `validate: true`, `hover: true`, `completion: true`;
  - `schemaStore: { enable: false }`, `kubernetesCRDStore: { enable: false }`;
  - `hoverSchemaSource: false`, `format: { enable: false }`.
  - Also send `yaml/registerContentRequest` after `initialized` and refuse `vscode/content`, so an `http(s)` modeline never reaches the network.
  - A `file:` modeline is still read by the server itself. The brief states this and decides whether to refuse it, which cannot be done through settings.
- **I5. Capabilities.** The entry declares its own list (hover, completion with no trigger characters, documentSymbol, definition, folding, selectionRange, codeAction) and does not spread `common()`. `formatOnType: false`, `semanticTokens: false`, `organizeImports: null`, `choices: []`, `extras: []`, `approvedBy: null`. Rename stays out until D39 decides between anchor rename and key rename.
- **I6.** Dates as `pattern` from `ISO_DATE`, not ajv-formats.
- **I7.** Globs with `node:path.matchesGlob`.
- **I8.** Leave `context.ts` (879 lines) untouched. Validation runs inside `validate()`, which the snapshot already calls.
- **I9.** Compile the ajv validators once per snapshot build, keyed by the schema's content.
- **I10.** Pin `yaml-language-server` and `ajv` exactly in `dependencies`, as pyright is.

## 6. Cases

### Given by the step's text and the rulings

- Must pass:
  - Completion of field names: in a `project.yml`, a new line offers manifest-schema's fields.
  - Completion of values: `focus:` offers `vocab.focus_lanes`; `category:` in venues offers journal, conference, thesis, meeting.
  - A reference field's choices are the referenced file's keys: `venue_id:` offers venues' `id` values, not names; `collaborators:` offers people's `key`s; `related:` offers manifest ids.
  - Hover on a field shows its help line, on every field (147 hub fields, 87 without help today).
- Must refuse, as a mark, a value not allowed: `category: magazine`; `access: public` (before the data change); `venue_id: no-such-venue`.
- Z672 (7), must pass after M8:
  - `pmc-patients` with `access: open`;
  - `outcome` and `doi` on `projects/coauthor/published/...` and on `active/linfoot-estimator`;
  - `hcin` (a journal) with `timing`, `deadline` and `call`;
  - Graz with the new role and no `link`;
  - `kuleuven-thesis` and `uhasselt-thesis` with `thesis`, `xai-nl` with `meeting`;
  - each of the eight retrieval methods.
- Z672 (7), must refuse:
  - `deadline_month` or `held_month` on a journal;
  - `role: present` with no `link`;
  - a retrieval method outside the allowed set.
- `redownload.py` given `direct` or `script` never prints "unknown retrieval.method".
- `from: domains` resolves to `registries/domains.yml` keys, and `from: vocab.domains` to `vocab.yml:51`.
- Z672 (6): a value the editor marks is also a Findings row with a catalog sentence, and G14 (`integrity.test.ts`) still gives zero findings on the real hub.

### Implied, never stated, with a cost if wrong

- `snooze: true` or a date, and `subtasks:`, in collection entries are not marked. They exist today (section 1a); marking them fails G14 and marks Axel's own snoozes.
- A person added to `people.yml` while a manifest is open appears in `collaborators:` completion without a restart. A stale enum marks valid values.
- A referenced file that does not parse gives a finding for that file and no marks on the values that reference it. An empty enum would mark every reference.
- A funding entry with no `key` (allowed, `idRequired: false`) adds nothing to the enum and is not a finding.
- A parked resource that `keptResources` drops is not offered for `compute:`.
- Path matching:
  - `side-projects/<name>/project.yml` in the hub root and `.oculus/project.yml` in each of the six other roots both get the side-project schema.
  - Every one of the 26 deck `present.yml` files gets the deck schema.
  - `tools/oculus/config/present.yml` gets the options schema's `present.yml` section, not the deck schema. `config/text/views/academic/present.yml`, the cockpit template and `tools/present/content/present.yml` get neither by accident.
- No request to schemastore.org or the Kubernetes CRD store is ever made. A file with `# yaml-language-server: $schema=https://...` makes no network fetch.
- `config/local.yml` is never sent to the server, whatever tab state (G3).
- A YAML file in a root outside the hub (for example `ordo/.agents/plan.yaml`) gets syntax marks and no hub schema.
- Two YAML tabs of one root on one page share one server; it ends 60 s after the last closes (G36 widened to name it).
- yaml-language-server missing from `node_modules` gives the status `not_found`, as the other packaged servers do (`notFound`, `choices.ts`).
- Format Document and `format_on_save` on a hub YAML file change nothing (C4).
- `career.yml`'s `when: "27 Jul"` items validate as the data field `when` (a text), not as a condition.
- A schema `from:` naming no registry or vocab key, or a `when:` naming an undeclared field, is a finding on the schema's file (G12: shipped catalogs read with no finding).
- The renamed apps API field (`optionsFrom` to `from`, `docs/apps.md:247`) is read under the new name by every reader (`fs.svelte.ts:209`, `collection.ts`). An app that sends the old name gets the documented answer.
- After the `options_from` rename, the cockpit's page (`page.py:706-709`) still draws its registry dropdowns with their options.

## Declined to judge

- **Whether yaml-language-server's English diagnostic and hover texts fall under `spec.md:48`** ("an error from ... a library is mapped to a catalog line before it is shown"). pyright's and clangd's texts reach the editor as the servers write them today. Settling it needs a reading of how D23's landing judged server messages, which I did not find in the ledger in this run.
- **The wording of the 87 help lines and the new event role word.** These are Axel's hub text; I gave options only.
- **The paths of D15, D33, D39, D40, M7 and D41.** Their plan lines name behaviour, not files, and they have no brief listing paths, except D15's 7-line brief, which names none. D33 and D40 will consume the yaml server's diagnostics as Problems rows and linter marks, and D39 will read M8's `from:` declarations and must decide between yaml-language-server's anchor rename and its own key rename. The files they touch cannot be named from the tree.
- **The old briefs' line numbers for X3e, D11, D28 and M6.** They predate D23b and D45, and five of them are being re-prepared. I listed only the files they name.
- **Whether the oculus catalogs and text files (C7) belong in M8.** The plan line's words and Z672 (8)'s reason point different ways; that is a scope ruling.
