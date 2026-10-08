# M8 premise recheck on main at 1ae5e7c8d

Main's head: `git rev-parse HEAD` printed 1ae5e7c8d94cbe03a0b87e48850648c54ba23a8c.

I changed no repository file. One tarball, `yaml-language-server-1.24.0.tgz`, is unpacked in my session scratchpad (`.../scratchpad/yls/pkg`) for reading only.

One hard limit was crossed, read only. While looking for real `.oculus/*.yml` files I ran `ls ~/workspace/*/.oculus/` and `find ~/workspace -maxdepth 4 -path '*/.oculus/*' -name '*.yml'`. Both commands listed the file names under `~/workspace/cathedra/.oculus/` (only `project.yml`). No file there was opened, read or changed.

Since 499741d71, `git log --oneline 499741d71..HEAD` shows 16 commits. The landings among them are D15 (a84214dad, 0d440a6ef), D11 (c88b76443 and its look fixes d098915b5) and X3e (1ae5e7c8d). Outside the ledger, `git diff --stat 499741d71 HEAD` shows two hub data changes: `feeds/position-leads.yml` got new entries, and nothing else under applications, education, funding, network, registries, tasks, projects, side-projects, `docs/DATA-MAP.md`, `tools/data`, `tools/cockpit` or `tools/oculus/demo` changed.

## 1. Premises

### "When this is dispatched" and the header

- **"context.ts, which is 879 lines".** Moved. `wc -l src/lib/server/root/context.ts` prints 778. D11 moved the `ServerContext` type to `src/lib/server/root/process/server-context.ts` (138 lines). context.ts re-exports it at `:101` and `:126`.
  - `ServerContext` holds `relay: Relay` and no portfolio watcher (grep of its members), so M8 does not need to change it.
- **"read on main at d5d7f727b and 499741d71".** Moved. Everything below is as read at 1ae5e7c8d.

### The language server client

- **`lsp-servers.ts` (209 lines) holding `LspServerId`, `LSP_SERVERS`, `factsForLanguage`, `SERVED_LANGUAGES`.** Moved to 207 lines (`wc -l`). D11 removed `hint` from `LspChoiceFacts` (`git diff 499741d71 HEAD -- .../lsp-servers.ts`). The names hold: `:16`, `:76` (module-private, not exported), `:166`, `:171`.
  - A facts entry also carries `program`, `semanticTokens`, `organizeImports` and `interpreterLibrary` (`:40-73`). The brief's item 4 names neither of these four for the yaml entry; recheck-2's I5 gave them as `semanticTokens: false`, `organizeImports: null`.
- **`servers.ts` 556 lines; `ServerEntry :123-143`; `RootEnv :65-75`; `common()` declaring typeDefinition/references/documentHighlight/workspaceSymbol; `createServers` with four entries.** Holds (`wc -l`; `grep -n "^export type ServerEntry\|^};"`; `sed -n 190,206p`; `:499-500`).
  - New fact for item 4: `packaged()` (`servers.ts:268-284`) returns `args: [script, '--stdio']` under `options.node`. It has no place for node flags, so the `--permission --allow-fs-read=...` arguments cannot pass through it unchanged.
  - New fact: the head comment `servers.ts:10-17` says "There are four entries" and names each one. This is a second sentence of the file that a fifth server makes false; the brief names only `:8`.
- **`web/typescript-adapter.ts` 34 lines, `...NO_APPROVAL`.** Holds (`wc -l`; `grep -n NO_APPROVAL` gives `:33`).
- **relay.ts facts: `held.entry.adapter.prepare` at `:648`, 839 lines, `RelayOptions :95-110` with seven members, `:54` imports `./pyright/interpreter.ts`.** Holds (`wc -l`; `grep -n`; `sed -n 95,112p`).
- **"The relay is built in `server/root/context.ts:341-352`".** Moved to `:242-254` (`grep -n "createRelay" context.ts` gives `:242`).
  - The portfolio watcher starts later, at `:375`.
  - New fact for item 4: the snapshot build that validation uses is `buildPortfolio` (`data/index.ts:257`, calling `validate` at `:291`). It is called from `server/root/watch/portfolio.ts:590`, which publishes only the snapshot (`hub.publish('portfolio', snapshot)`, `:591`). Its `Watcher` type exposes only `close()` (`:114-117`).
  - So the schemas cannot reach a member built at `context.ts:242` without changing `data/index.ts` beyond `:191` and `watch/portfolio.ts`. Neither change is on the write list. See choice N2.
- **`held.ts:283 answer()`, `workspace/configuration` at `:290-301`, default to `relay.ts:705 #serverRequest`, `held.ts:342-345` keeps only `didChangeWatchedFiles`.** Holds (`grep -n`, `sed -n 283,302p`, `sed -n 338,348p`).
  - New fact: `initialized` is sent by `held/process.ts:173`, and the server's `ready` is handled at `held.ts:431`. Item 4's two notifications after `initialized` therefore need an entry member read there.
  - New fact: the reconfigure path is `reconfigure` at `choices.ts:117-126`, which is module-private.
- **yaml-language-server facts (`yamlServerInit.js:83-104`, `yamlLanguageService.js:47-48`, `yamlSettings.js:27-33`, `yamlSchemaService.js:359-399` order, `:120-130` picomatch with `**/`, `notificationHandlers.js:14` and `:31-35`, `schemaRequestHandler.js:53-122` with the disk read at `:87`, `nodeTranslationSetup.js:57`).** Holds. I re-read each one in the unpacked 1.24.0 tarball (`sed -n`/`grep -n` on each file).
  - The only disk reads are `server.js:42-43` (the `readFile` the schema handler uses) and the l10n bundle. That bundle is under the package unless `initializationOptions.l10nPath` names another folder (`nodeTranslationSetup.js:54`).
  - No hub modeline exists: `git grep -ln "yaml-language-server:" -- '*.yml' '*.yaml' | wc -l` prints 0.
- **ajv 8.20.0 not installed, 6.15.0 through eslint; zod 4.6.5; `z.toJSONSchema` `target: 'draft-7'`.** Holds (`node -p` on each package.json).
  - The draft-7 normalisation is now at `node_modules/zod/v4/core/to-json-schema.js:25-27`.

### Hub schemas and other hub YAML

- **The 16 `schema:` blocks.** 15 hold on their lines. `feeds/position-leads.yml` moved from `:51` to `:52` (`grep -n '^schema:'` loop). `git ls-files ... | xargs grep -l '^schema:' | wc -l` prints 16.
- **Field counts and types.** Holds. A Python recount gives 147 fields, 60 with help, 87 without. Types: text 80, select 15, metalist 6, tags 18, textarea 18, date 8, raw 1, checkbox 1.
  - `options_from` appears 3 times: `venues.yml:18`, `:21` and `joint-work.yml:11`.
  - 11 of the 16 files hold non-ASCII text. No `when:` is used as a schema key.
- **`metalist` meaning (`DATA-MAP.md:422`) and its reader.** The DATA-MAP line holds. The reader's line numbers moved: `normaliseMetalists` is at `entries.ts:130`, and `:112-128` is its field set (`metalistItemShape`, `metalistFields`).
- **The other hub YAML.** Holds:
  - 94 manifests, none with `schema:`;
  - `manifest-schema.yml`: 74 lines, `from:` at `:31`, `:36`, `:38`, `:39`, `:41-68`, the archive section at `:26`;
  - `schema.ts:243` holds; 36 integer `year` values;
  - 3 hub side projects and 6 `.oculus/project.yml`, all with `links: []`; `FIELDS` at `normalise-personal.ts:26`;
  - `career.yml:17-21` holds; `HOST_KEYS` at `normalise-career.ts:18`;
  - the radar has `meta` and `entries`, 185 each of `motif`, `maps_to` and `idea_spark`, and 55 `new-idea-candidate`;
  - 26 deck `present.yml` outside `tools/`, plus 6 under `tools/`;
  - `cpp-file.ts` 178 lines; `commitment-ledger.yml` tracked;
  - demo hub 15 schema blocks; dummy 10 manifests.
- **New fact: D11 added `.oculus/launch.yml`.** A repository's debug configurations, read by `server/machine/debug/launch.ts` through a zod `entryShape` (`:46`) and the commands file's helpers. The brief covers no schema for it. See choice N1.
- **New fact: the commands reader is already zod.** The reader of `.oculus/commands.yml` (`runs/commands/files.ts:33`, `entryShape`) was zod already at 499741d71 (`git show 499741d71:... | grep entryShape` gives `:31`). Item 2 nevertheless hand-writes `commands-schema.yml`.
- **New fact: no real oculus-side YAML file exists in a served root.** No `.oculus/cpp.yml`, `commands.yml`, `settings.yml`, `launch.yml` or `apps/*/app.yml` exists in any of them: the hub root has no `.oculus/`, and the six roots of `sources.yml:93-98` hold only `project.yml`. So case 30's "every real file of its kind" is empty for cpp and commands.
- **`.oculus/settings.yml` read through `editor-options.ts:1-10`; `app.yml` by hand-written checks in `apps/manifest.ts` (`findings.apps.*`).** Holds. manifest.ts has no zod import, and its sentences are at `:122-170`.

### Registries, validate.ts, the data departures

- **`RegistryName`, `idSets`, `SHAPES`, `vocab.yml:51`.** `RegistryName` is at `model-entities.ts:19-28`, one line more than the brief's `:19-27`. The rest holds: `validate.ts:773-786` adds `projects`, `registries.ts:39-48` has `SHAPES`, and `vocab.yml:51` is `domains:` (`sed -n`).
- **validate.ts lines: 863 lines, `REFERENCES :83`, `SHAPES :134`, `checkKeys :218`, `checkCollectionSchema :561`, `validate :828`.** Holds (`grep -n`).
- **"runs 25 named checks beside `REFERENCES`".** False count. `sed -n 828,863p` lists 25 calls:
  - `checkReferences`, which is the `REFERENCES` loop;
  - `sortFindings`, which orders the findings and checks nothing;
  - 23 checks: 22 other `check*` functions and `personalFindings`.
- **G14's test and its hub.** Holds: `tests/checks/config/integrity.test.ts:5` says "zero findings". `loadLocal` is imported at `tests/fixtures/real-hub.ts:12` and called at `:29`. `git ls-files config/local.yml` prints nothing.
- **Fields oculus writes: education/events/venues `snooze` 2 each, tasks `subtasks` 3.** Holds (Python recount). The writers are `writes/bodies.ts` and `writes/subtasks.ts`, and the position-leads additions brought no undeclared field.
- **Data departures.** Holds:
  - `data.yml:77` reads `access: public`; access counts are open 39, registration 7, credentialed 3, private 4, public 1;
  - `vocab.yml:252` and `:256`;
  - `hcin` at `venues.yml:245`; the theses and `xai-nl` at `:1019`, `:1027`, `:1035`; Graz at `events.yml:62-73`;
  - the retrieval method counts and the comment at `data.yml:9`;
  - `redownload.py` `--dry-run` `:11`, `run :91`, `fetch_url :154`, `show_manual :177`, `:220`, `:222`, `:235-236`, "unknown" at `:240`; pmc-patients `direct` has `base_url` and `priority_first`; the four `script` sets carry only `notes`;
  - the three false help lines `venues.yml:27`, `data.yml:28`, `data.yml:32`.
- **New fact: `events.yml` describes only two roles in its own text.** `events.yml:1` (header comment) and `:3` (`intro`, which the collection view draws) say `role: present` is a talk I give and `role: attend` is attending only. A third role makes both incomplete. See choice N3.
- **`stats.ts:153` and `venues.ts:166-170`.** The `attend` check is at `stats.ts:154`. `venues.ts:166-170` holds.

### options.yml, findings and readers

- **options.yml: 1286 lines, `description:` 216, `values:` 27, `values_from:` 19, `suggest_from:` 3, `values_by` at `:11`, sections at `:15/:170/:818/:1052/:1065/:1199`.** Moved: 1298 lines, `description:` 218 (`grep -oE "\bdescription:" | wc -l`), and `local.yml` at `:1208`.
  - X3e added `sources.repository_scan_depth` and D11 added `rite_dap_bin`.
  - Holds: `values:` 27 (indents 12 and 20, which Verify 6's pattern catches), `values_from:` 19, `suggest_from:` at `:76`, `:223`, `:746`, and the other sections.
- **`findings.yml:113-114`, `no_description` at `options.ts:197`.** Holds. `option-findings.ts:36-37` also reads `no_description`.
- **Readers of the reference keys** (`git grep -n "options_from\|optionsFrom\|values_from\|values_by\|suggest_from"`). The lines that still hold:
  - `normalise.ts:576`, `:586`, `collectionSchema :602`; `model-collections.ts:37`; `entries.ts:88`;
  - `collection.ts:135`, `:157`, `:623` (`:134`, `:155`, `:160`, `:248` also name it);
  - `options.ts:130`, `:144-146`, `:180-184`, `:221-232`, `:300-310`; `value-rule.ts:38`, `:97`, `:105`;
  - `config-fit.ts:18`, `:71`, `:164-172`; `fields.ts:252-255`, `:620-621`;
  - `normalise.test.ts:201`, `migrate-joint-work.mjs:273`, `demo/network/joint-work.yml:11`, `docs/apps.md:247`, `page.py:706-709`.

  These are moved or missing:
  - `state/sources/fs.svelte.ts:209` is false. X3e moved the zod shape: `optionsFrom` is now at `state/sources/fs-transport.ts:237` (465 lines), and `fs.svelte.ts` (879 lines) no longer names it.
  - `settings.ts:76` moved to `:79`.
  - Missing from the brief and the write list: `src/lib/views/system/workbench/editors/FieldControl.svelte:301` (`{:else if spec.suggest_from !== undefined}`). It was there at 499741d71 too (`git grep ... 499741d71`).
- **The `description` readers (`options.ts:256-266`, `rows.ts:177`, `:243`, `search.ts:44`, `Control.svelte:118`, `Item.svelte:95`, `:176`, `List.svelte:97-98`; `List.svelte:65-66` a file's own).** Holds.
  - Missing: the property is also written at `state/system/config/editors/draft.ts:126` and `:512`, and at `views/system/workbench/editors/Editor.svelte:73` (`description: ''` in a field spec). None of the three is on the write list. `grep -rln "description:" tests | xargs grep -ln control` finds only `options.test.ts`, which is on it.
- **The catalog folder.** `merge.ts:18 CATALOGS_DIR`, `:240 flattenText`, `data/index.ts:191`, `config-files.ts:18 CATALOGS`, `groups.ts:249`, `workbench.yml:20`, `config-folder.test.ts:100` and `:176`, `catalogs.ts:51 vocabCatalog` and `options.ts:362 readCatalog` hold.
  - "`Settings.svelte:161`" holds as a line, but the file is `src/lib/views/system/workbench/Settings.svelte`. The write list's `views/system/workbench/settings/Settings.svelte` does not exist (`[ -e ]` loop prints MISSING).
- **What names `config/catalogs/manifest-schema.yml`** (`git grep -n "manifest-schema"`). These hold: `.prettierignore:21`, `DESIGN.md:44`, `docs/configuration.md:19`, `DATA-MAP.md:180`, `:240`, `:359`, `:475`, `QuickAdd.svelte:61`, `boards/editor/Editor.svelte:16`, `selectors.svelte.ts:343`, `writes.test.ts:6`, `config-folder.test.ts:176`.
  - `docs/views.md:239` moved to `:247`.
  - Missing: `src/lib/state/forms/schema.ts:1` and `:28` also name the old path.
- **The adapters' paths.** Holds for `cpp-file.test.ts` lines 1 and 9, `relay.ts:54`, G7 `:26`, G13 `:126`. "The svelte approval entry (:38)" is G55.
  - Missing: `tests/server/machine/lsp/servers.test.ts:9` imports `src/lib/server/machine/lsp/pyright/interpreter.ts`, and `servers.ts:27-30` import the four adapters (`grep -rn "lsp/clangd\|lsp/pyright\|lsp/web\|'\./..."`).

### Documents and other premises

- **`DESIGN.md` lines.** `:23`, `:24` (exact sentence), `:44`, `:163` ("Untyped input"), `:165` (names `pyright, clangd, typescript-language-server or svelte-language-server`) and `:571` hold (`grep -n`, `sed -n`). DESIGN.md is 575 lines.
- **Other documents naming four servers.** `docs/files-and-search.md:69` (heading) and `:71` hold. `README.md:15` holds and names `pyright`, `typescript-language-server` and `svelte-language-server`.
  - HELP.md (185 lines) names no server or YAML behaviour: `grep -n -i "python\|language server\|yaml\|schema\|hover\|completion"` finds only `:79` (F2) and `:114` (References), which stay true.
  - `docs/apps.md:247` holds. `docs/configuration.md:19` holds.
  - `DATA-MAP.md` is unchanged since 499741d71, so the survey's section 5 lines hold.
  - New: `options.yml:493` (`editor.sticky_scroll`) names the sources of the editor's structure, pyright and clangd among them. The Files view's Outline asks any served tab's server for `textDocument/documentSymbol` (`kit/lsp/client.ts:601`), so a YAML tab will list the server's symbols there. Whether sticky scroll also reads them is not verified.
- **No ADR folder.** Holds (`ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" twice; `.agents/plan.yaml` has no `adr:` key).
- **Worktree paths lack `tools/data` and `docs`.** Holds (`.agents/plan.yaml:12`).
- **The cockpit selftest is red.** Not rerun, since Z708 runs no cockpit check. `git diff --stat 499741d71 HEAD -- tools/cockpit projects` is empty.
- **The verify block (one command, `npm run test:quick`; `checks.sh` present).** Holds (`orchestrator-state.md:6-9`; `ls ~/.claude/skills/land/templates/checks.sh`).
- **"Shared with the steps in flight": D15 writes `DESIGN.md:169`, `:533` and `docs/views.md:259`.** No longer applies. D15 has landed (a84214dad), and `dispatch: []` (`orchestrator-state.md:27`).

## 2. Sizes

The limits: `tests/checks/tree/size.test.ts:29-30` refuses 900 and 540. spec.md:45 cites `:28-29`, which is one line off. The rule is 880 lines, and 520 for a component. `utils/size-allow.txt` holds no entry. `wc -l` on main:

- **The tightest files:**
  - `server/machine/lsp/relay.ts` 839 (41 lines of room; it gains the options member, the reconfigure hook and an import).
  - `data/snapshot/validate.ts` 863 (17 of room; `REFERENCES :83-132` goes).
  - `data/snapshot/normalise.ts` 837.
  - `state/boards/collection.ts` 806.
  - `data/sources/config/settings.ts` 797 (was 770).
- **`state/sources/fs.svelte.ts` 879.** One line of room. M8 no longer needs to change it, since `optionsFrom` moved to `fs-transport.ts` (465).
- **`server/root/context.ts` 778.** 102 lines of room; was 879.
- **With room:**
  - `server/root/watch/portfolio.ts` 660, `held/held.ts` 601, `servers.ts` 556, `selectors.svelte.ts` 556, `catalog/options.ts` 541, `entries.ts` 473, `config-fit.ts` 489, `forms/schema.ts` 383, `manifest.ts` 330, `catalogs.ts` 324, `groups.ts` 301, `data/index.ts` 299, `rows.ts` 266, `merge.ts` 259, `value-rule.ts` 252, `choices.ts` 224, `editor-options.ts` 208, `lsp-servers.ts` 207, `normalise-personal.ts` 168, `model-collections.ts` 138, `search.ts` 88, `option-findings.ts` 64, `config-files.ts` 29.
  - `state/system/config/editors/draft.ts` 695 (to be added to the write list).
- **Components:** `FieldControl.svelte` 360, `boards/editor/Editor.svelte` 348, `Settings.svelte` 341, `Item.svelte` 330, `editors/Editor.svelte` 183, `List.svelte` 170, `Control.svelte` 150, `QuickAdd.svelte` 145.
- **Not in the size check:** `options.yml` 1298 (YAML; the check covers ts, svelte, mjs, js and sh).
- **Folders** (`git ls-files <d> | cut | sort -u | wc -l`, limit 10):
  - At 10: `src/lib/data`, `server/machine/lsp`, `data/model`, `data/sources/config`, `state/system/config`, `state/sources`, `state/boards`, `config/text/views/sources`, `ui/controls/editor/kit/lsp`, `views/system/workbench/settings`, `server/root`, `server/machine`, `server/machine/apps`.
  - Below 10: `config/catalogs` 9, `data/prose` 9, `tests/server/machine/lsp` 9, `data/snapshot` 8, `catalog/` 8, `server/root/process` 8, `config` 7.
  - New since the brief: `server/root` is at 10, so a hand-off module for the schemas cannot be added there. It goes in context.ts or `watch/`.
  - The regroup takes `server/machine/lsp` to 8.

## 3. Guarded entries

- **G56 is written** at `agents/guarded.md:131`. Its words match Z707 as the brief quotes them.
- **Its Code line names files that exist or that M8 creates:** `src/lib/data/snapshot/validate.ts` exists (863 lines), and the generator folder under `src/lib/data/snapshot/` is one M8 creates (`data/snapshot` holds 8 items).
- **Its Test line is "written by M8"**, and names no file yet.
- **The entries whose Code lines M8's regroup changes:**
  - G7 at `:26` (`lsp/pyright/interpreter.ts`, `lsp/web/svelte-adapter.ts`, `lsp/web/typescript-adapter.ts`);
  - G55 at `:38` (`lsp/web/svelte-adapter.ts`, `typescript-adapter.ts`, `approval.ts`, `config-files.ts`);
  - G13 at `:126` (`lsp/clangd/cpp-file.ts`).
- **Unaffected:** G2 and G3 name `lsp/library/*`, and G36 names `held/process.ts`, none of which moves.
- **The G13 and G7 test titles the brief extends exist:** `options.test.ts:11` and `:38`, `servers.test.ts:29`, `cpp-file.test.ts:132`.

## 4. Shared paths with D28

Source: D28's brief, "Paths this step writes" (`agents/briefs/D28.md:246-283`, numbered at b3015df79 and being rechecked separately).

| File | M8 | D28 | Merge |
|---|---|---|---|
| `config/catalogs/options.yml` | renames every `description:`, `values:`, `values_from:`, `suggest_from:` in the file | adds `editor.*` entries after `editor.sticky_scroll` (its lines 496-529), written with `description:` and `values:` | Not simple |
| `server/root/context.ts` | the relay option at `:242-254` | the open-file poll beside the git watcher start (now `:327`/`:386`) and `close()` (`:496-`) | Simple |
| `data/sources/config/editor-options.ts` | the settings.yml schema from the entries it reads | its new keys | Simple if M8 adds a function; judged on the diffs |
| `config/text/views/sources/source.yml` | `cmd_yaml_restart`, `cmd_yaml_output` beside `:13-36` | keys at their alphabetical places | Simple unless both insert at one place |
| `DESIGN.md` | 23, 24, 44, 165, 571 | 114, 116, 395-398 (old numbering) | Simple |
| `docs/diagrams/` | `npm run diagrams` | `npm run diagrams` | Regenerated at landing |

- **options.yml is not a simple merge.** The two steps touch the same lines, and the step that lands second must convert the other's entries. If D28 lands second, its new entries are in the old words. If M8 lands second, its whole-file rename has to cover D28's entries. Verify 6's `grep -c "description:"` catches a leftover either way.
- **Not shared:** D28 also writes `HELP.md` 165 and 267, which M8 does not touch. (HELP.md is 185 lines, so D28's `:267` is stale; that is for D28's recheck.)
- **Recommendation: sequence the two.** Rebrief D28 to write `help:` and `options:` if M8 lands first, or have M8's rename cover D28's entries if D28 lands first. Running both at once is not recommended.

## 5. Libraries

`npm view <name> version license time.modified dist-tags`:

- **yaml-language-server.** 1.24.0, MIT, still `latest`, released 2026-07-07T20:01:54Z. Maintainers mohitsuman, rhdevelopers-ci, yvydolob, gercan. Not installed.
  - `time.modified` moved to 2026-10-07T23:03 for a new prerelease, `next: 1.25.1-2c1cd23.0`. No new stable release.
  - Its dependencies beyond the brief's list: `ajv-i18n ^4.2.0`, `ajv-draft-04 ^1.0.0`, `vscode-uri ^3.0.2` (3.1.0 installed), `@vscode/l10n ^0.0.18` (installed), `vscode-languageserver-textdocument ^1.0.1` (1.0.15 installed). `request-light`, `ajv-i18n` and `ajv-draft-04` are absent today.
- **ajv.** 8.20.0, MIT, latest, 2026-04-24, maintainers blakeembrey and esp; 6.15.0 installed through eslint.
- **zod.** 4.6.5, MIT, latest (released 2026-09-13; `time.modified` 2026-10-02 from other tags), installed 4.6.5.
- **ajv-formats** 3.0.1 (2024-03-30), **picomatch** 4.0.7 (installed 4.0.7), **@types/json-schema** 7.0.15 and **monaco-yaml** 5.5.1 are unchanged as versions.
- **No newer stable release** of any candidate.

## 6. New choices

N1. Which oculus-owned YAML files get a schema, and how: `.oculus/launch.yml` is new (D11), and its reader and the commands reader are both zod.
- (a) Recommended: generate the JSON Schemas of `.oculus/commands.yml` and `.oculus/launch.yml` with `z.toJSONSchema` from whole-file zod shapes built on the readers' own `entryShape`s (`runs/commands/files.ts:33`, `debug/launch.ts:46`), as Z706 (4) does for the catalogs, `settings.yml` and `app.yml`. `commands-schema.yml` is not written.
  - Pro: one definition per file, from the code that reads it.
  - Con: the readers' extra rules (a name's characters, `cwd` inside the repository, a `program` placeholder) are not in the schema, so the editor marks less than the reader refuses. Both readers gain an exported whole-file shape, and case 38 lists three new schema files.
- (b) A hand-written `commands-schema.yml` as the brief has it, plus a `launch-schema.yml` in `config/schemas/`.
  - Pro: both are listed in Settings.
  - Con: a second definition beside a zod reader, the option Z706 marks as lazy.
- (c) `launch.yml` gets syntax marks only. This is the lazy option, a narrower reading of Z672 (8)'s reason.

N2. How the generated schemas leave the snapshot build for the relay.
- (a) Recommended: `buildPortfolio` (`data/index.ts:257`) returns the generated schemas beside the snapshot without publishing them. `watchPortfolio` (`watch/portfolio.ts:590`) hands each rebuild's schemas to a callback the context passes, and the new `RelayOptions` member built at `context.ts:242` reads the latest through a closure and is told of a change.
  - Pro: nothing new on the socket, and it is the build validation uses.
  - Con: `data/index.ts` (beyond `:191`) and `watch/portfolio.ts` join the write list.
- (b) The schemas ride in the published `portfolio` payload, read with `hub.latest('portfolio')` as `context.ts:313` does.
  - Pro: no callback.
  - Con: a wire-format change. Every page receives every schema with every registry's keys.
- (c) The adapter regenerates from disk. This is the lazy option Z706 already refused.

N3. The hub text that describes the event roles: `events.yml:1` (header comment) and `:3` (`intro`, drawn by the collection view).
- (a) Recommended: name `co-present` in both, as a talk a co-author gives that counts in the project's dissemination as `present` does.
  - Pro: the file's own text stays true.
  - Con: two hub lines beyond Z672 (7)'s records, under Z681's reading that text the change makes false is reworded.
- (b) Leave both. This is the lazy option: the intro then misstates the roles.

## 7. Corrections the brief needs

1. **Line 11.**
   - Old: "the relay gains a member built in `server/root/context.ts`, which is 879 lines, and X3e (Z705 (I1)) and D11 (Z704) each move a part of it out. When both have landed, the premises below are checked again on main, every line number is corrected, and the worktree is cut at main's head."
   - New: "the relay gains a member built in `server/root/context.ts`. X3e (1ae5e7c8d) and D11 (c88b76443, d098915b5) have landed: `context.ts` is 778 lines, and the `ServerContext` type is in `server/root/process/server-context.ts` (138 lines), which M8 does not change. The premises below are read on main at 1ae5e7c8d (`agents/reviews/M8-premise-recheck-3.md`), and the worktree is cut at main's head."
2. **Line 30.**
   - Old: "(read on main at d5d7f727b and 499741d71; checked again at dispatch)"
   - New: "(read on main at 1ae5e7c8d)"
3. **Line 32.**
   - Old: "or the brief check `agents/reviews/M8-brief-check.md`, with its command there."
   - New: "the brief check `agents/reviews/M8-brief-check.md`, or `agents/reviews/M8-premise-recheck-3.md`, with its command there."
4. **Line 34.**
   - Replace "`src/lib/data/prose/lsp-servers.ts` (209 lines)" with "(207 lines)".
   - Replace "The relay is built in `server/root/context.ts:341-352`." with "The relay is built in `server/root/context.ts:242-254`, before the portfolio watcher starts at `:375`; the snapshot validation uses is built by `buildPortfolio` (`data/index.ts:257`, `validate` at `:291`), called from `server/root/watch/portfolio.ts:590`, whose `Watcher` exposes only `close()` (`:114-117`)."
   - Add "`packaged()` (`servers.ts:268-284`) launches `[script, '--stdio']` under `options.node` and takes no node flags. `servers.ts:10-17` says there are four entries and names each. `initialized` is sent by `held/process.ts:173` and the server's `ready` is handled at `held.ts:431`. `reconfigure` is module-private at `choices.ts:117-126`."
5. **Line 41.** Old: "`feeds/position-leads.yml:51`". New: "`feeds/position-leads.yml:52`".
6. **Line 41, same bullet.**
   - Old: "read by `normaliseMetalists` at `server/edit/writes/entries.ts:112-124`"
   - New: "read by `normaliseMetalists` (`server/edit/writes/entries.ts:130`), its field set from `metalistFields` (`:112-128`)"
7. **Line 42.**
   - Append: "`.oculus/launch.yml` (D11, the debug configurations, reader `server/machine/debug/launch.ts`, a zod `entryShape` at `:46`); `.oculus/commands.yml`'s reader is zod (`runs/commands/files.ts:33`). No `.oculus/cpp.yml`, `commands.yml`, `settings.yml`, `launch.yml` or `apps/*/app.yml` exists in any served root today."
   - Append: "`network/events.yml:1` and `:3` (`intro`) describe the roles `present` and `attend` only."
8. **Line 43.** Old: "(`data/model/model-entities.ts:19-27`)". New: "(`data/model/model-entities.ts:19-28`)".
9. **Line 44.**
   - Old: "(1286 lines): `description:` 216". New: "(1298 lines): `description:` 218".
   - Old: "`local.yml :1199`". New: "`local.yml :1208`".
10. **Line 45.**
    - Old: "`state/sources/fs.svelte.ts:209`". New: "`state/sources/fs-transport.ts:237`".
    - Old: "`data/sources/config/settings.ts:76`". New: "`data/sources/config/settings.ts:79`".
    - Old: "`state/boards/collection.ts:135`, `:157`, `:623`". New: "`state/boards/collection.ts:134`, `:135`, `:155`, `:157`, `:160`, `:248`, `:623`".
    - Add "`views/system/workbench/editors/FieldControl.svelte:301` (`spec.suggest_from`)".
11. **Line 46.** Append: "The property is also written at `state/system/config/editors/draft.ts:126` and `:512` and at `views/system/workbench/editors/Editor.svelte:73`."
12. **Line 47.** Old: "`Settings.svelte:161`". New: "`views/system/workbench/Settings.svelte:161`".
13. **Line 48.**
    - Old: "`docs/views.md:239`". New: "`docs/views.md:247`".
    - Add "`src/lib/state/forms/schema.ts:1`, `:28`".
14. **Line 49.**
    - Old: "`tests/server/machine/lsp/cpp-file.test.ts` lines 1 and 9 import adapter paths; `agents/guarded.md` names them in the Code lines of G7 (:26), the svelte approval entry (:38) and G13 (:126)."
    - New: "`servers.ts:27-30`, `relay.ts:54`, `tests/server/machine/lsp/servers.test.ts:9` and `cpp-file.test.ts` lines 1 and 9 import adapter paths; `agents/guarded.md` names them in the Code lines of G7 (:26), G55 (:38) and G13 (:126)."
15. **Line 50.**
    - Old: "`validate() :828-863`, which runs 25 named checks beside `REFERENCES` (`checkWaitingOn` and `checkFundingIdentity` among them)"
    - New: "`validate() :828-863`, which calls `checkReferences` (the `REFERENCES` loop), `sortFindings` (the order) and 23 checks: 22 other `check*` functions and `personalFindings` (`checkWaitingOn` and `checkFundingIdentity` among them)"
    - Old: "(`tests/fixtures/real-hub.ts:12`)". New: "(`tests/fixtures/real-hub.ts:29`)".
16. **Line 53.** Old: "`state/boards/board/stats.ts:153`". New: "`state/boards/board/stats.ts:154`".
17. **Line 55.**
    - Old: "`server/root/context.ts` 879 (before X3e and D11), `transport.ts` 871, `validate.ts` 863, `fs.svelte.ts` 840, `relay.ts` 839, `normalise.ts` 837, `collection.ts` 806, `settings.ts` 770"
    - New: "`fs.svelte.ts` 879 (M8 does not change it), `transport.ts` 871, `validate.ts` 863, `relay.ts` 839, `normalise.ts` 837, `collection.ts` 806, `settings.ts` 797, `server/root/context.ts` 778, `draft.ts` 695, `watch/portfolio.ts` 660, `fs-transport.ts` 465, `data/index.ts` 299"
    - Add to the folder counts: "`server/root` 10, `views/system/workbench/settings` 10, `server/root/process` 8".
18. **Line 56.** Append: "`options.yml:493` (`editor.sticky_scroll`) names the servers that give the editor its structure, and the Outline asks any served tab's server for symbols (`kit/lsp/client.ts:601`)."
19. **Item 2, line 70 (per N1 (a)).**
    - Old: "`cpp-schema.yml` (`.oculus/cpp.yml`) and `commands-schema.yml` (`.oculus/commands.yml`)"
    - New: "and `cpp-schema.yml` (`.oculus/cpp.yml`); `.oculus/commands.yml` and `.oculus/launch.yml` get the JSON Schemas of whole-file zod shapes built on their readers' `entryShape`s (`runs/commands/files.ts:33`, `debug/launch.ts:46`)"
    - Case 38 then reads "the three new schema files". Case 30 names launch in place of commands-schema.
20. **Item 4, line 78.**
    - Old: "`servers.ts` gains the entry through `packaged(...)`,"
    - New: "`servers.ts` gains the entry through `packaged(...)`, which gains an optional list of node flags placed before the script (today `servers.ts:268-284` builds `[script, '--stdio']`),"
    - Add to line 77's facts: "`program: 'yaml-language-server'`, `semanticTokens: false`, `organizeImports: null`, `interpreterLibrary: false`".
21. **Item 4, line 80.**
    - Old: "After `initialized` the client sends `yaml/registerCustomSchemaRequest` and `yaml/registerContentRequest`."
    - New: "After `initialized` the client sends `yaml/registerCustomSchemaRequest` and `yaml/registerContentRequest`, from an optional entry member read where `held.ts:431` handles the server's `ready`."
22. **Item 4, line 82 (per N2 (a)).**
    - Old: "built beside the relay in `server/root/context.ts`. When they change (a referenced file, a schema block or a schema file written), the relay sends `workspace/didChangeConfiguration` through the reconfigure path of `choices.ts`,"
    - New: "built beside the relay at `server/root/context.ts:242-254`, fed with each rebuild's schemas by the portfolio watcher (`server/root/watch/portfolio.ts:590`) from `buildPortfolio` (`data/index.ts:257`), which returns them beside the snapshot and publishes nothing new. When they change (a referenced file, a schema block or a schema file written), the relay sends `workspace/didChangeConfiguration` through `reconfigure` (`choices.ts:117-126`, exported for it),"
23. **Item 4, line 83.**
    - Old: "every import of their paths follows (`relay.ts:54`, `cpp-file.test.ts` lines 1 and 9), and `servers.ts:8`'s \"a folder of its own beside this file\" is reworded. The report gives the new path of each file named in a Code line of `agents/guarded.md` (G7, the svelte approval entry, G13)"
    - New: "every import of their paths follows (`servers.ts:27-30`, `relay.ts:54`, `servers.test.ts:9`, `cpp-file.test.ts` lines 1 and 9), and `servers.ts:8`'s \"a folder of its own beside this file\" and `:10-17`'s \"There are four entries\" are reworded. The report gives the new path of each file named in a Code line of `agents/guarded.md` (G7, G55, G13)"
24. **Item 5, line 85.** Old: "Of the 25 other checks `validate()` runs (`:828-863`)". New: "Of the 23 other checks `validate()` runs (`:835-860`)".
25. **Report, line 232.**
    - Old: "the 25 checks of `validate()` each". New: "the 23 checks of `validate()` each".
    - Old: "the Code lines of G7, the svelte approval entry and G13". New: "the Code lines of G7, G55 and G13".
26. **Item 6, line 86 (per N3 (a)).** Append: "`network/events.yml:1` and `:3` name `co-present` beside `present` and `attend`."
27. **Item 7, line 87.** Append: "`options.yml:493` (`editor.sticky_scroll`) and `docs/files-and-search.md:15-17` (Outline) are read against the YAML server's symbols and rewritten where they no longer hold."
28. **Case 30.**
    - Old: "every real file of its kind in the served roots passes, and a key its reader refuses is marked."
    - New: "every real side-project and deck file in the served roots passes; no cpp, commands or launch file exists in a served root, so one of each, written under `$TMPDIR` with only keys its reader accepts, passes, and a key its reader refuses is marked."
29. **Paths, line 151.** Leave as is: `held/held.ts` and `choices.ts` are already on the list.
30. **Paths, line 154.**
    - Old: "`src/lib/data/index.ts` (line 191, if the merge's key moves)"
    - New: "`src/lib/data/index.ts` (`buildPortfolio` `:257-299`, and `:191` if the merge's key moves); `src/lib/server/root/watch/portfolio.ts` (the schemas handed on at `:590`)"
31. **Paths, line 155.** Old: "`src/lib/state/sources/fs.svelte.ts`". New: "`src/lib/state/sources/fs-transport.ts`".
32. **Paths, line 156.** Old: "`settings.ts` (line 76 only)". New: "`settings.ts` (line 79 only)".
33. **Paths, line 158.** Append: "`src/lib/state/system/config/editors/draft.ts` (`:126`, `:512`)".
34. **Paths, line 159.**
    - Old: "`tools/oculus/src/lib/views/system/workbench/settings/Control.svelte`, `Item.svelte`, `List.svelte`, `Settings.svelte`"
    - New: "`tools/oculus/src/lib/views/system/workbench/settings/Control.svelte`, `Item.svelte`, `List.svelte`; `src/lib/views/system/workbench/Settings.svelte`; `src/lib/views/system/workbench/editors/FieldControl.svelte` (`:301`), `editors/Editor.svelte` (`:73`)"
35. **Paths, new lines.**
    - Per N1 (a): "`tools/oculus/src/lib/server/machine/runs/commands/files.ts`, `src/lib/server/machine/debug/launch.ts` (the whole-file shapes)".
    - Per N3 (a): "`network/events.yml` lines 1 and 3".
36. **"Shared with the steps in flight", line 169.**
    - Old: the whole paragraph.
    - New: "Nothing is in flight (`orchestrator-state.md:27`, `dispatch: []`). D28 may be prepared beside M8. It shares `config/catalogs/options.yml`, which is not a simple merge: M8 renames every `description:` and `values:` of the file, and D28 adds `editor.*` entries after `editor.sticky_scroll` in those words. Whichever lands second converts the other's entries, and Verify 6 catches a leftover. It shares `server/root/context.ts` (M8 `:242-254`, D28 the open-file poll by the git watcher start and `close()`), `data/sources/config/editor-options.ts`, `config/text/views/sources/source.yml`, `DESIGN.md` (other lines) and `docs/diagrams/`, each a simple merge of different blocks."
37. **Read, item 2.**
    - Old: "`held/held.ts:270-360`". New: "`held/held.ts:270-360`, `:425-440`; `held/process.ts:160-180`".
    - Old: "the relay's construction in `server/root/context.ts`". New: "`server/root/context.ts:236-262` and `:370-380`; `server/root/process/server-context.ts`; `server/root/watch/portfolio.ts:495-612`; `data/index.ts:257-299`".
38. **Read, item 5.** Append: "`server/machine/runs/commands/files.ts:1-60` and `server/machine/debug/launch.ts:1-80` (N1)".
39. **Libraries, line 190.** Append: "Its other dependencies `ajv-i18n`, `ajv-draft-04`, `vscode-uri`, `@vscode/l10n` and `vscode-languageserver-textdocument` install with it; npm's `latest` is still 1.24.0 (`next` is the prerelease 1.25.1-2c1cd23.0, 2026-10-07)."

## Declined to judge

- **The wording of the 87 help lines and of the `events.yml` text.** These are Axel's hub text.
- **Whether sticky scroll reads the YAML server's symbols.** I found no `registerDocumentSymbolProvider` in `kit/lsp/client.ts` (`grep -n "languages\.register"` lists only code actions and semantic tokens), and did not trace how its features reach Monaco. The Outline's use (`client.ts:601`) is read; sticky scroll's is not verified.
- **Whether `--permission --allow-fs-read=<oculus>/node_modules` alone lets yaml-language-server start under node v24.21.0.** It may also need its own folder's realpath, the l10n bundle, or a worker. This needs a run, and this check starts no process.
- **D28's current line numbers.** Its brief is being rechecked by another agent; I compared the files it names, and anchored context.ts by today's `startGit` lines.
- **The cockpit selftest result.** Not rerun (Z708). Its inputs under `tools/cockpit` and `projects` are unchanged since 499741d71.

Usage: aca73f6f335a1fa89, claude-opus-5-5, 316,803 tokens, 122 tool uses, 14.7 min.
