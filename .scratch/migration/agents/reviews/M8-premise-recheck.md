M8 premise survey rechecked on main at c0a4af9c (`git rev-parse --short HEAD`). The survey was taken at fb7f076f, and `git log --oneline fb7f076f..HEAD | wc -l` gives 20 commits since then. I changed no file and ran only read-only git commands. The working tree has the orchestrator's uncommitted edits to plan.md, choices.md, orchestrator-history.md and queue.md (`git status --short`). I read plan.md as it stands in the working tree.

One premise in the request does not hold. Q126 did not land after the survey: `git merge-base --is-ancestor 6561f82a fb7f076f` succeeds, so it landed before. The DESIGN.md changes made since the survey come from PR3 (a2901490) and D23c (c0a4af9c), according to `git log fb7f076f..HEAD -- tools/oculus/DESIGN.md`.

## Header finding of the survey (G36 missing, moved paths)
- Now: G36 exists at `agents/guarded.md:62`, written by e0d93e78 after the survey (`git merge-base --is-ancestor e0d93e78 fb7f076f` fails). It reads: "None is started twice for one page and root: one pyright serves a page's Python tabs of a root, and one clangd its C and C++ tabs." Code: `lsp/process.ts`, `lsp/relay.ts`. Test: `tests/server/machine/lsp/lifetime.test.ts`.
- Now: guarded.md no longer names any moved path (`grep -n 'machine/commands/\|machine/schedules/\|machine/seeds/' guarded.md` prints nothing). G7 now cites `tests/server/machine/runs/commands/placeholders.test.ts`.

## 1. Hub YAML files, `schema:` lines and formats
- Holds: 146 hub yml/yaml files. The 16 `schema:` blocks are on the same lines: applications 5, education 5, position-leads 51, funding 5, events 5, joint-work 8, boilerplate 10, data 24, domains 3, organisations 6, people 7, pillars 26, repos 5, resources 5, venues 14, tasks 6. `git diff --stat fb7f076f HEAD` over every hub data folder touches only eight `present/main.md` deck slides and no yml.
- Holds: 94 manifests, none of which has `schema:`. There are 3 side projects in the hub and 6 `.oculus/project.yml` outside it. There are 26 non-tools `*present.yml` files. career.yml and literature-radar.yml have no `schema:`, and the radar header comment is at `:1-11`.
- Holds: `config/catalogs` has 8 items. manifest-schema.yml is 74 lines and options.yml is 1200.
- Holds: Python recount of the 16 blocks gives keys field 147, type 147, help 60, required 33, label 27, options 12, options_from 3. Types are text 80, tags 18, textarea 18, select 15, date 8, metalist 6, raw 1, checkbox 1. No `when:` key appears in any schema block.
- Holds: options.yml counts (`grep -oE '\bkey:'`) are control 155, default 110, section 156, values 23, min 39, max 27, description 202. The file sections are at `:15/:170/:732/:966/:979/:1113`, and the controls list is at `:10`. `values_from` occurs 20 times.
- Holds: examples at `venues.yml:18`, `:21`, `joint-work.yml:11`, `events.yml:8`, `manifest-schema.yml:41`, `options.yml:20-25`. The `from:` comment is at `manifest-schema.yml:16-18` and the section "Archive (archive tier)" at `:26`.
- Holds: the false help lines are `venues.yml:27` (config/vocab.yml venue_themes), `data.yml:28` (config/vocab.yml data_themes) and `data.yml:32` (`access` type text, "open / credentialed / DUA ..."). The `data.yml:9` comment still says `retrieval.method:` "drives the script in {physionet, physionet_zip, zenodo, manual}". Method counts in use are direct 1, library 9, manual 28, physionet 3, physionet_zip 2, private 4, script 4, zenodo 3. In `redownload.py`, library is at `:220`, manual/private at `:222`, physionet/physionet_zip/zenodo at `:231-236`, `url` at `:237`, and "unknown retrieval.method ... skipping" at `:240`.
- Not in the survey: `registries/career.yml:17-21` already uses `when:` as a data key (`{ task: ..., when: "27 Jul" }`). Career's nested schema will have a data field named `when` next to the new condition key `when:`.

## 2. Code readers
`git diff --stat fb7f076f HEAD` over src/lib/data/snapshot, model-collections.ts, boards/collection.ts, fs/collections.ts, sources/fs.svelte.ts, state/forms, writes/manifest.ts, writes/entries.ts and data/sources/config is empty, so all of these are unchanged.
- Holds: normalise.ts `collectionSchema` is at `:602`, with `options_from` at `:576` and `optionsFrom` at `:586`. The file is 837 lines.
- Holds: `SchemaField` is at `model-collections.ts:29` (`optionsFrom` at `:37`).
- Holds: validate.ts is 863 lines. REFERENCES is at `:83-132` (venue_id, domain, funding, datasets, pillar, related, compute), SHAPES at `:134`, fieldNames at `:183`, schemaKeys at `:193`, checkKeys at `:218`, checkCollectionSchema at `:561` and validate() at `:828`.
- Holds: entries.ts `typeRefusal` is at `:69`, the options_from comment at `:88` and `typeRefusals` at `:95`.
- Holds: collection.ts has PEOPLE_OPTIONS at `:134`, kindOf at `:156` and `optionsFrom(config[...])` at `:626`. fs/collections.ts `identityField` is at `:49`. sources/fs.svelte.ts has `optionsFrom` at `:209`.
- Holds: state/forms/schema.ts `manifestSchemaShape` is at `:116`, fieldRowShape at `:133` and formFields at `:147`. manifest.ts `fieldTypes` is at `:71`.
- Holds: catalog/options.ts has SOURCES at `:76-95`, FieldSpec at `:140`, CatalogEntry at `:170`, readCatalog at `:362`, catalogOf at `:386` and configItems at `:457`, and is 541 lines. value-rule.ts has valueProblem at `:197` and itemProblem at `:249`. option-findings.ts has optionFindings at `:56`. settings.ts has PROBLEM_READERS at `:505` and settingProblems at `:531`, and is 541 lines. catalogs.ts has settingFindings at `:234`.
- Now: settingFindings is called from `root/context.ts:371` (was :364). `root/watch/portfolio.ts:532` holds.
- Holds: the integrity.test.ts head comment (`:5`) says "validates against the real hub with zero findings". The cockpit selftest is unchanged (`git diff --stat fb7f076f HEAD -- tools/cockpit` is empty): `_validate_palette_schemas` at `:595` reads `options` at `:612`, is called from `:215`, and the completeness gate reads `field` around `:673-692`. `tools/cockpit/src/cockpit/schema.py` exists. `utils/` has only `migrations/migrate-joint-work.mjs`, and `tools/oculus/bin` does not exist.
- Holds: ajv is 6.15.0 in node_modules and is not in package.json. zod is 4.6.5, and `json-schema-generator.d.ts` exists.

## 3. D23/D23c language server client
- Now: `lsp/` still holds 10 items. `held.ts` and `watch.ts` moved into `held/` (with the new `held/documents.ts`), and D23c added `library/` (address, pages, read, rules, tokens). Items: choices.ts, clangd, held, library, process.ts, pyright, relay.ts, servers.ts, uris.ts, wire.ts.
- Now: servers.ts is 324 lines. `ServerId = 'pyright' | 'clangd'` is at `:41`. `Setup` is at `:22-36` and gained `interpreterPrefixes` (pyright-only). `Adapter` is at `:74-94` and still needs prepare, choices, choose, approve and settings. `ServerEntry` is at `:96-112` with the same members. pyright is at `:177-214` (script `:179`, `section === 'python'` `:197`) and clangd at `:216-260`. `createServers` is at `:265-276` (entries `[pyright(options), clangd()]`, forLanguage `:269`). `initializeParams` is at `:282-324`, with the clangd branch at `:292`.
- Now: relay.ts is 845 lines (was 869). ADAPTERS holds at `:85`. `inbound` is at `:173-192` and still routes `lsp:<language>` through `forLanguage` (`:178`).
- Now: server requests are answered in two places. `Held.answer` (`held/held.ts:283`) answers `workspace/configuration` (`:290-301`, per item `entry.configuration(section, setup)`), register/unregisterCapability, workDoneProgress/create, diagnostic/refresh, showMessageRequest, showDocument and workspaceFolders. Anything else goes to `relay.ts #serverRequest` (`:710`), which handles inlayHint/semanticTokens refresh and applyEdit, and its `default` (`:738`) answers METHOD_NOT_FOUND. A `custom/schema/content` case therefore goes in `held/held.ts` answer or in `relay.ts:710`.
- Now: D23c's `library/rules.ts` refuses the engine's `config/` folder, `~/.oculus` and any dot segment as a library file. Schema `file:` URIs written under the engine's folders would be refused as library addresses if a server ever named them to the page.
- Now: `SERVED_LANGUAGES` is at `kit/lsp/hosts.ts:21` (was :20), and `register` returns null at `:147` (was :143). It is also imported by `language/lsp.ts:31`.
- Now: `views/sources/source/language/lsp.ts` is 487 lines (was 445). The python/clangd branches are at `:110-112` (restart/output words), `:371` (`python = language === 'python'`), `:385` (`python ? 'pyright' : 'clangd'`), `:389-397` (interpreter vs database command), `:401` (clangd header) and `:424` (AST and memory).
- Now: the command words are at `config/text/views/sources/source.yml:12-25` (`cmd_clangd_*` 12-17, `cmd_python_*` 23-25).
- Now: `SEMANTIC_LANGUAGES = ['c','cpp']` is at `client.ts:40`, and client.ts is 547 lines.
- Holds: YAML is not routed. `grep -rni yaml` over both lsp folders finds only `clangd/cpp-file.ts:22`. `grammars.ts:52`, `:74` hold. `LspCode` is at `model-processes.ts:164`, and that file is 266 lines.
- Not in the survey: `tests/server/machine/lsp/servers.test.ts:49` expects the spawned commands to equal `['/node', 'clangd']`, and G36's text names pyright and clangd only.

## npm
- `npm view yaml-language-server version license time.modified`: 1.24.0, MIT, time.modified 2026-10-05T16:39:17Z. Now: the modified date is later than the survey's because of a prerelease; dist-tags are `latest: 1.24.0`, `next: 1.25.1-19631be.0` (2026-10-05). Holds: 1.24.0 itself was released 2026-07-07T20:01Z. Holds: dependencies include ajv ^8.17.1, yaml 2.8.3 (oculus has 2.9.1), prettier ^3.8.1, vscode-languageserver ^9.0.0, and vscode-languageserver-types ~3.17.5 (oculus node_modules 3.18.4).
- Holds: `npm view ajv version license` gives 8.20.0, MIT, modified 2026-04-24, maintainers blakeembrey and esp. monaco-yaml is 5.5.1, MIT, modified 2026-06-03.

## 4. Z468 data departures
- Holds: `data.yml:77` `access: public` is on `pmc-patients`. Counts: open 39, registration 7, credentialed 3, private 4, public 1. `vocab.yml:252` `data_access` has 4 keys.
- Holds: 18 non-archive manifests carry `outcome` (12 under coauthor/published), and 5 carry `doi`. The other six are the ones the survey named. `CardDetails.svelte:72-74` and `normalise.ts:324-325` are unchanged.
- Holds: `hcin` at `venues.yml:244-262` is `category: journal`, with timing, `deadline: "2026-12-02"` and call.
- Holds: Graz BCI is at `events.yml:62-73`, `role: present`, `status: not-attending`, with no link. It is the only `role: present` entry without a link. The link help is at `:15`.
- Holds: kuleuven-thesis `:1019`, uhasselt-thesis `:1027` and xai-nl `:1035` have no category (format thesis, thesis, poster). Categories are journal 41 and conference 27. Four manifests name one of these venues.

## 5. DATA-MAP sentences
The file is `docs/DATA-MAP.md` at the hub root, 490 lines. `git diff --stat fb7f076f HEAD -- docs/DATA-MAP.md` is empty.
- Holds: `:20` ("full field list of the files no schema covers"), `:156`, rows `:171`, `:179`, `:181`, `:182`, `:258`, `:275`, `:293`, `:294`, `:295`, `:297`, `:301`, `:302`, `:303`, `:340`, "Where each schema is" `:363-374` (rows `:367`, `:371`, `:372`, `:374`), "The files no schema covers" `:376-409`, `:413`, `:419`, `:431-441`, `:449`, `:460`, `:477`, `:481`.
- Now: the condition table header is at `:337`, and its rows run `:339-355`. Row `:355` is "any deck's `present.yml` | `groups.<name>.slides`", which the survey's range left out.
- Now: tools/oculus/DESIGN.md says which languages are served at `:571` ("A Python, C or C++ file ... is served by pyright or clangd") and at `:23`, which the survey did not name ("a language server client (pyright for Python, clangd for C and C++)"). `:123` holds. `:572` now also covers D23c's read-only library tab.
- Now: the "Language servers" section of docs/files-and-search.md is `:69-71`: the heading at `:69` and one paragraph at `:71`.
- Not in the survey: `DESIGN.md:24` reads "The YAML in the hub is the source of truth and its shape does not change for oculus." Z672's renames of `options_from` and of the hub data run against this sentence (see the last list).

## 6. Folder counts, file sizes, guarded entries
Folder counts (`git ls-files <d> | cut | sort -u | wc -l`, limit 10, `utils/folder-check.sh:41`):
- Holds at 10: lsp, editor, editor/kit, data/sources/config, data/sources, data, edit/writes, routes/api.
- Now at 10: `kit/lsp` (was 9; D23c added `transport/`). Also at 10, not in the survey: `data/model`, `edit/writes/config` and the deck reader `data/sources/deck`.
- Holds: machine 9; config/catalogs 8; snapshot 8; config 7; catalog 6; tests/data/sources/config 6; language 5; state/forms 5; tests/checks/config 4.
- Now: `tests/server/machine/lsp` has 8 (was 7; `library.test.ts` added). `lsp/held` has 3.

Sizes (`spec.md:45`: 880 and 520; the check refuses 900 and 540 in `size-check.sh:29` and `size.test.ts:29`):
- `utils/size-allow.txt` has only its 4-line header comment and no entries.
- Now: `kit/lsp/transport.ts` is 819, no longer over. `root/context.ts` is 877 (was 870), 3 lines under the line. relay.ts is 845 (was 869). Editor.svelte is 292 (was 496). held/held.ts is 599. language/lsp.ts is 487. servers.ts is 324. hosts.ts is 172. uris.ts is 329. client.ts is 547.
- Holds: validate.ts 863, normalise.ts 837, collection.ts 809, Source.svelte 520 (exactly at the line), options.ts 541, settings.ts 541, manifest.ts 486, entries.ts 473, kit/load.ts 448, forms/schema.ts 383, catalogs.ts 312, normalise-career.ts 158, normalise-personal.ts 168.

Guarded entries (`grep -n` in guarded.md, 158 lines):
- G1 `:7`. Code now includes the `lsp:` channel (`relay.ts`, `root/socket.ts`).
- G2 `:10`. It now allows "a file a language server named in an answer to the page", with code `uris.ts`, `library/read.ts`, `library/tokens.ts` and `library/rules.ts`, plus deck routes `deck-slides` and `deck-edit` (`edit/writes/config/deck/`).
- G3 `:13`. Code now includes `library/rules.ts`.
- G5 `:19`, sanitiser, `src/lib/ui/html.ts`.
- G7 `:25`. Code now includes `lsp/servers.ts` and `pyright/interpreter.ts`.
- G8 `:40`. Code now includes `edit/writes/config/deck/`. The test 'appends a new entry rendered from the file schema' is still listed.
- G12 `:119`. G13 `:122` (code now includes `clangd/cpp-file.ts`). G14 `:125` (integrity.test.ts held whole). G15 `:128`. G32 `:131` (code now includes `server/content/deck/`, and "present" is in its list).
- G36 `:62`, which now exists.

## 7. Choices
Z672 rules every part of these (`plan.md:1445`). Facts the choices rest on, rechecked:
- Now: more readers of the reference keys than the survey listed (`grep -rln "optionsFrom\|options_from\|values_from"`, excluding .scratch): `tools/cockpit/src/cockpit/page.py:706-709` reads `options_from` to resolve a select; `tools/oculus/demo/network/joint-work.yml:11` (the demo hub, 15 demo files have `schema:`); `tests/data/snapshot/normalise.test.ts:201`; `utils/migrations/migrate-joint-work.mjs:273`. For `values_from`: `state/system/config/editors/fields.ts:252`, `edit/writes/config/config-fit.ts:71`, `:164`, `config/text/findings.yml:110` (`no_values` sentence), and `tests/data/sources/config/catalog/options.test.ts`.
- Now: options.yml `description:` is read in `catalog/options.ts:141`, `:256`, `:263` and in `state/system/config/{search,rows,browser,groups}.ts` and `editors/draft.ts` (`grep -rln "description"`). `values` is read in `value-rule.ts`, `config-fit.ts` and `editors/fields.ts`.

## 8. Shared paths with PR3 and D23c
- Now: both have landed (plan.md `:547` ✅ D23c, `:669` ✅ PR3; commits c0a4af9c and a2901490). There are no paths in flight from them, and Step 0's wait on D23c (`plan.md:241-242`) is met.
- Deck present.yml after PR3:
  - Still 26 hub files.
  - PR3 introduced no deck schema file: `config/catalogs` is unchanged (`git diff --stat` over config shows no catalogs change).
  - The reader of present.yml keys is hand-written in `src/lib/data/sources/deck/spec.ts` (185 lines). It reads `deck.title`, `defaults.tag_tones`, `groups.<name>.{slides, sort (folder|title), discover, find.{folders,tiers,status}}` and `order` entries (a file string, `{slides: group}`, `{kind: summary|grid, of, title, lede, foot}`).
  - PR3's writers are `edit/writes/config/deck/` (deck.ts writes `slides:` and `order:`; deck-new.ts writes a new deck's present.yml and slides in any folder of a served root; deck-files.ts, deck-acts.ts, deck-undo.ts). `slide-text.ts:102` `presentText` writes `deck:\n    title:` and `order:`.
- Not in the survey: tracked `present.yml` files also exist under tools: `tools/oculus/config/present.yml` (an options file), `config/text/views/academic/present.yml` (a text catalog), `tools/present/content/present.yml`, `tools/cockpit/templates/docs/present/present.yml` and two demo decks (`git ls-files '*present.yml' | grep '^tools/'`). No `.oculus/cpp.yml` is tracked in the hub. Its reader is `clangd/cpp-file.ts`, covered by G13.
- M6: not landed. `plan.md:230` has no tick, and no M6 landing commit appears in `git log`. `briefs/M6.md:28`, `:68`, `:69`, `:79` name `optionsFrom`/`options_from`.
- `optionsFrom` in the apps API: `docs/apps.md:247` (the `schema?` field shape). In src: `model-collections.ts:37`, `normalise.ts:586`, `state/sources/fs.svelte.ts:209`, `state/boards/collection.ts:156`, `:159`, `:247`, `:626`, `:693`. In tests: none by that name; `tests/data/snapshot/normalise.test.ts:201` uses `options_from`. `docs/apps.md` changed since the survey only at `:435` (PR3 added `deck-edit` to the closed writes).

## Changed since the survey
What the M8 brief must take into account:
1. **G36 exists** (`guarded.md:62`). It names "one pyright ... and one clangd" and points at `tests/server/machine/lsp/lifetime.test.ts`. A yaml-language-server entry needs G36 widened. G1, G2, G3 and G7 now name the lsp files, including D23c's `library/`.
2. **The lsp folder was reorganised.** Held is now `lsp/held/held.ts` (599 lines) with `held/documents.ts` and `held/watch.ts`. `library/` is new. `lsp/` stays at 10 items, so M8 cannot add a folder there without merging or moving one. `kit/lsp` is now also at 10.
3. **Server requests** are answered in `held/held.ts:283` (answer) or `relay.ts:710` (`#serverRequest`, default METHOD_NOT_FOUND at `:738`). `custom/schema/content` must be added to one of them. `library/rules.ts` refuses the engine's `config/`, `~/.oculus` and dot paths as library files, which matters if schemas are served as `file:` URIs under oculus's folders.
4. **Line numbers moved** in servers.ts (`:41`, `:74-112`, `:177-324`), relay.ts (845 lines, inbound `:173`), hosts.ts (`:21`, `:147`), language/lsp.ts (487 lines, branches `:110-112`, `:371-434`), source.yml (`:12-25`), client.ts (`:40`) and context.ts (`:371`, 877 lines, 3 lines of room). `servers.test.ts:49` expects exactly `['/node','clangd']`.
5. **Sizes:** transport.ts is no longer over (819). context.ts at 877 is the tightest, if ajv validation touches it. relay.ts has 35 lines of room.
6. **Deck present.yml:**
   - Z672 (8) says "their schema after PR3 lands". PR3 has landed and wrote no schema. The schema must be authored from `deck/spec.ts`'s reader, and the keys are listed in section 8 above.
   - PR3's deck-new.ts creates present.yml in any folder of a served root, so the set is open-ended.
   - A path pattern `**/present.yml` would also match `tools/oculus/config/present.yml` (an options file covered by options.yml), `config/text/views/academic/present.yml` (a text catalog), `tools/present/content/present.yml`, the cockpit template and the demo decks. The brief must name the patterns and their exclusions.
7. **More renaming sites for Z672 (1) and (4)** than the survey listed: `tools/cockpit/src/cockpit/page.py:706-709` (a second cockpit reader of `options_from`, besides selftest.py), the demo hub (`demo/network/joint-work.yml:11` and its 15 demo schema blocks), `migrate-joint-work.mjs:273`, `normalise.test.ts:201`, the `values_from` readers in `editors/fields.ts` and `config-fit.ts`, the `findings.yml:110` sentence, and the `description` readers under `state/system/config/`.
8. **Docs M8 makes false**, beyond the survey's list: `DESIGN.md:23` and `:571`, `files-and-search.md:69-71`, and DATA-MAP's condition table row `:355` (deck present.yml).
9. **A possible clash for the orchestrator to judge:** `DESIGN.md:24` says "The YAML in the hub is the source of truth and its shape does not change for oculus." Z672 renames the `options_from` key in 16 hub files and changes hub data values. If that sentence still binds, this is a clash between a design decision and a ruling, to raise rather than build around.
10. **Wording overlap:** `career.yml:17-21` uses `when` as a data key in its milestone list. Career's nested schema will declare a field named `when` while `when:` is also the condition key.
11. **Blocks and data are unchanged:** the 16 schema blocks, the Z468 data, DATA-MAP, every reader of section 2 and the cockpit selftest have not changed since fb7f076f. Their facts hold.
12. **yaml-language-server:** latest is still 1.24.0. `next` is a 1.25.1 prerelease from 2026-10-05, which explains the newer time.modified.

Usage: this agent, claude-opus-5-5. About 50 tool uses (counted by hand). Tokens and time not verified.

Agent: a1a845d6c98b2f97f, claude-opus-5-5, 159,762 tokens, 72 tool uses, 6.2 min.
