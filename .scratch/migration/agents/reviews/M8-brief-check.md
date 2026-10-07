M8 brief check on main at d5d7f727b

No repository file was changed. Since d5d7f727b, main has moved to 499741d71. `git diff --stat d5d7f727b HEAD` lists only files under `tools/oculus/.scratch/migration/`, so every premise below holds at both heads. The spec.md change in that range adds `docs` to the grep rule at spec.md:66, which the brief's write list already covers. `git status --short` shows only the four ledger files that were already modified before this check. One probe script, `zt.mjs`, and a yaml-language-server 1.24.0 tarball unpacked for reading are in my session scratchpad.

The findings that block dispatch come first. Their details are under the headings.
- F17: Verify 7 is red on main before M8 changes anything.
- F18: Verify 7 also goes red after M8 sets `thesis` and `meeting`.
- F12: the brief does not say how the generated schemas reach the relay without changing `context.ts`.
- F13: generating schemas from the zod readers (item 2, third bullet) is impossible as written.
- F22, F23 and F24: case 16 and item 3's glob list fail because yaml-language-server matches globs itself.
- F20: Verify 3 names a path that does not exist.
- F21: the ASCII gate in Verify 5 fails over the hub files.
- F30: the brief's plan for a new guarded entry contradicts spec.md:57.

## 1. Names

F1. None of the brief's new names exists anywhere in the repository. I ran `git grep -l -F "<name>" -- . ':!tools/oculus/.scratch' ':!tools/oculus/config/local.yml' | wc -l` for each name, and every count printed was 0: `config/schemas`, `server_yaml`, `cmd_yaml_restart`, `cmd_yaml_output`, `oculus-schema:`, `co-present`, `side-project-schema`, `deck-schema`, `cpp-schema`, `commands-schema`, `machine/lsp/adapters`.
- `thesis` already exists as a `type_order` key (`tools/oculus/config/catalogs/vocab.yml:103` `- { key: thesis, icon: book, label: "thesis" }`). It lives in a separate list from `venue_categories`, so the two do not collide.

F2. `metalist` already has a meaning, and item 2 gives it a second one.
- Item 2 makes career's sections "a field of type `metalist` with its own `fields:`".
- `sed -n 422p docs/DATA-MAP.md` prints "| `metalist` | a list of `{ label, value }` maps | ...". `src/lib/server/edit/writes/entries.ts:112-124` reads `type: z.literal('metalist')` for `normaliseMetalists`.
- Reusing the name changes what those readers and the entry form do for every existing metalist field. Either the type gets a new name, or the brief names those readers and the widening.

F3. options.yml has two more reference keys that the one-vocabulary rule in item 1 does not cover.
- `grep -c "values_by:\|suggest_from:" config/catalogs/options.yml` prints 4. `suggest_from` is at :76, :223 and :746, and options.yml:11 documents `values_by: { field, sources }`.
- `grep -n "no_values\|no_description" config/text/findings.yml` prints :113 "a choice or multi with no values, values_from or values_by ..." and :114 "the entry or field has no description ...". findings.yml is on the write list, but the brief does not say that these two sentences, or their keys (`options.ts:197` `'no_description'`), change.

F4. The brief does not say whether the TypeScript property `description` is renamed along with the YAML key.
- The YAML key is read only at `options.ts:256-266` (`grep -n description src/lib/data/sources/config/catalog/options.ts`).
- `grep -rl "\.description\b"` also finds the property in `views/system/workbench/settings/Control.svelte`, `Item.svelte` and `List.svelte`, none of which is on the write list. Two of the readers, `state/system/config/rows.ts` and `search.ts`, are on it.

## 2. Step line and rulings mapped to "What to build"

Read with `sed -n 239,246p plan.md` and `sed -n 1462,1500p plan.md`.

The step line (M8): items 1 to 5 and 7. "A help line on every field" is item 1, fourth bullet.

Z672:
- (1) `from:` everywhere: item 1. The ruling names "the cockpit selftest". `git grep -n options_from -- tools/cockpit` finds only `page.py:706-709`, which item 1 names, so the selftest itself has no `options_from` to rename. Its venue category check is F18.
- (2) Registry names and `vocab.`: item 1, second bullet. See F8 for the four bare vocab names this misses.
- (3) `when:` and `required: { when }`: item 1, third bullet.
- (4) `help:` and `options:` in options.yml: item 1, first bullet. See F3 and F4.
- (5) The career and radar blocks, and the side-project schema: item 2. The ruling places the side-project schema at `config/catalogs/side-project-schema.yml`. Z701 (8) moves it to `config/schemas/`, and the brief follows Z701.
- (6) ajv replaces `REFERENCES`: item 5.
- (7) The data: item 6, every part.
- (8) The 26 deck `present.yml` files and `.oculus/cpp.yml`: item 2 (`deck-schema.yml`, `cpp-schema.yml`) and item 3's globs.
  - Z672 (8) says the deck files get "their schema after PR3 lands". The brief says nothing about PR3, and `git log --oneline -300 | grep -i "Land PR3"` was not run, so whether PR3 has landed is not verified.

Z681 (a): item 7, `DESIGN.md:24`. "The records ... change only where a value breaks its own rule" is item 6's last sentence, "No other record changes".

Z701:
- (1): item 1, second bullet. Its premise "manifest-schema.yml already uses these" is false; see F8.
- (2): item 4, fourth bullet.
- (3): item 6.
- (4): item 4, fifth bullet, and case 22.
- (5): item 3.
- (6): item 3 (`additionalProperties: false`) and case 26.
- (7) `commands.yml`: item 2. The catalogs and text files from zod: item 2, third bullet. See F13.
- (8): item 2, second bullet.
- (9): item 6.
- (10): item 5 and case 27.

No ruling is missing from "What to build". The defects are in how items carry out the rulings, below.

## 3. Premises rechecked on main

F5. The folder check printed no ADR folder: `ls tools/oculus/docs/adr docs/adr` printed "ls: docs/adr: No such file or directory" twice, run from `tools/oculus` and from the hub root.

F6. `ServerEntry` is at `servers.ts:123-143`. `grep -n "^export type ServerEntry\|^};" src/lib/server/machine/lsp/servers.ts` printed "123:export type ServerEntry = {" and "143:};". The brief says :115-135.

F7. The brief says `merge.ts` is under `src/lib/data/sources/config/catalog/`, but the file is at `src/lib/data/sources/config/merge.ts`.
- On the write list it sits in the `catalog/` series. `[ -e src/lib/data/sources/config/catalog/merge.ts ]` failed ("MISSING"), and `find src -name merge.ts` prints `src/lib/data/sources/config/merge.ts` and `src/lib/state/feeds/literature/merge.ts`.
- Line 18 is `export const CATALOGS_DIR = 'catalogs';`. Moving `manifest-schema.yml` out of `catalogs/` therefore needs a second folder read by that merge, since data/index.ts:191 takes `schema: merged.manifest_schema`. The brief names only the path line.

F8. manifest-schema.yml has four bare vocab `from:` values. Z701 (1) says it "already uses these".
- `grep -n "from:" config/catalogs/manifest-schema.yml` prints :31 `from: type_order`, :36 `from: status_legend`, :38 `from: focus_lanes` and :39 `from: priority_levels`. Under item 1 these become `vocab.<key>`.
- `src/lib/state/forms/schema.ts:243` `return vocabChoices(byKey(config, from));` must then strip the prefix. The brief names schema.ts on the write list but not this line or the four entries.

F9. `.prettierignore:21` reads `config/catalogs/manifest-schema.yml` (`sed -n 21p .prettierignore`). After the move, prettier formats the moved file, since the exclusion no longer matches. `.prettierignore` is not on the write list.

F10. Other text that the move makes false and that is not on the write list. Found earlier with `grep -rn "catalogs/manifest-schema.yml"` and `grep -rln "manifest-schema" src`:
- `DESIGN.md:44`
- `docs/views.md:239`
- `src/lib/views/boards/focus/QuickAdd.svelte:61`
- `src/lib/views/boards/editor/Editor.svelte:16`
- `src/lib/state/client/selectors.svelte.ts:343`
- `tests/server/edit/writes.test.ts:6`
- `docs/DATA-MAP.md` lines 180, 240, 359 and 475, which the survey's section 5 list does not include.

`DESIGN.md:165` names the four language servers and is also off the list.

F11. Paths that the adapter regroup and the Settings view touch, missing from the write list.
- `relay.ts:54` is `import type { Run } from './pyright/interpreter.ts';`. Regrouping into `adapters/` changes relay.ts beyond "only the reconfigure hook".
- `tests/server/machine/lsp/cpp-file.test.ts` lines 1 and 9 import adapter paths.
- The Code lines of `agents/guarded.md` G7 (:26), the svelte approval entry (:38) and G13 (:126) name the old paths.
- The Settings view lists catalogs only from `config/catalogs`: `config-files.ts:18` `CATALOGS`, `groups.ts:249` and `Settings.svelte:161`. Each file's description is `settings.desc_<name>` in `config/text/views/system/workbench.yml:20`.
- `tests/checks/config/config-folder.test.ts:100` builds its list from `own('', '')` and `own('catalogs', 'catalogs/')` (read with `sed -n 85,130p`), so `config/schemas/` is outside that test's enumeration.

F12. The brief does not say how the generated schemas and the change signal reach the yaml adapter.
- The relay is built in `src/lib/server/root/context.ts:341-352`, and `wc -l` prints 879 for that file. Item 5 says "`context.ts` (879 lines) is not changed".
- `RelayOptions` (`relay.ts:95-110`) carries `oculus`, `node`, `roots`, `lspFolder`, `approvals`, `changes` and `library`. `RootEnv` (`servers.ts:65-75`) carries `root`, `lsp`, `approvals`, `run` and `exists`. Neither holds an engine, the config or the snapshot.
- So the adapter has no input from which to build `schemas` or the enums, and no trigger for item 4's "when a referenced file ... changes". One more option in context.ts takes it to 880 or over.
- Z705 (I1) and Z704 split context.ts in X3e and D11, both in flight. The brief should say which of them M8 waits for, or where the new option goes.

F13. Generating JSON Schemas from the zod readers (item 2, third bullet; Z701 (7)) is impossible as written.
- No catalog or text file has a whole-file zod reader. vocab.yml is read key by key (`vocabCatalog` in catalogs.ts), and text files are flattened by `flattenText`.
- My probe `zt.mjs` printed "transform throws: Transforms cannot be represented in JSON Schema" for a reader with a transform.
- zod 4's output declares draft 2020-12, sets `additionalProperties: false`, and marks `z.unknown()` keys as required.
- The builder has to write new whole-file readers, or hand-write schemas. The brief should say which, and that the output's `$schema` must be one ajv's default draft-07 class and yaml-language-server both take.

F14. G14's test path is wrong in Verify 3.
- `grep -rln "zero findings" tests` prints `tests/checks/config/integrity.test.ts`. The brief writes `tests/checks/data/integrity.test.ts`.
- The test takes its hub from `loadLocal(engine).hub` (tests/fixtures/real-hub.ts), and the default is two levels above tools/oculus. Whether a worktree's run reads the worktree's hub depends on the worktree's local.yml, which I did not open.

F15. The premises in the brief's "What is on the tree" that do reproduce, each by grep or a Python recount:
- 16 hub files with a `schema:` list. A Python walk over `git ls-files '*.yml'` outside `tools/` printed "hub files with a schema list: 16".
- 147 fields with 60 help lines, so 87 to add.
- options.yml has 216 `description:`, 27 `values:` and 19 `values_from:`.
- The redownload.py lines at :154, :217-240.
- The Z468 departures; the undeclared `snooze` and `subtasks` fields.
- The yaml-language-server facts at the lines the brief cites; `checkSchemaURI` is at `schemaUrls.js:54-74`.
- No modelines in the hub.
- The retrieval-method comment at `registries/data.yml:9`.
- `relay.ts` is now 839 lines (`wc -l`), where the plan's line 243 says 869.

F16. Every path on the write list exists except `catalog/merge.ts` (F7). I checked with a `[ -e ]` loop over the 30 paths.

F17. Verify 7 is red on main before M8 changes anything.
- `python3 tools/cockpit/build.py --selftest; echo exit $?` printed "SELFTEST FAIL - 0 broken reference(s) + 32 validation error(s)" and "exit 1".
- The errors are unknown status chips: 25 'nascent', 5 'scoping' and 2 'de-risking' (`grep "✗" ... | sort | uniq -c`).
- No fix within M8's write list turns this green, since `tools/cockpit/data/config/vocab.yml` is not on it. This is a red check for the orchestrator to rule on before dispatch.

F18. After M8, Verify 7 fails a second way.
- `tools/cockpit/src/cockpit/selftest.py:207` checks venue `category` against the cockpit's own `venue_categories`. `grep -n venue_categories tools/cockpit/data/config/vocab.yml` prints `303:venue_categories: [journal, conference]`.
- Item 6 sets `thesis` and `meeting`, so the selftest reports three more errors. That vocab file is not on the write list.

F19. `page.py:708` does `deck.get(fd["options_from"])`. After the rename, `from: vocab.venue_categories` gives `deck.get("vocab.venue_categories")`, which is None, so the dropdown has no options unless the prefix is stripped. Item 1 names the lines but not the prefix strip, and case 25 depends on it.

## 4. Cases and verify checks against spec.md and guarded.md

F20. Verify 3's path is wrong (F14). `npx vitest run tests/checks/data/integrity.test.ts` matches no file.

F21. The ASCII gate in Verify 5, "over the changed files", fails over the hub files M8 must change.
- A Python scan of the 16 schema files printed "non-ascii: 11": applications.yml, education.yml, position-leads.yml, funding.yml, events.yml, joint-work.yml, data.yml, organisations.yml, people.yml, venues.yml and tasks.yml.
- The hits are accented names, the euro sign, a bell emoji in `followup` help lines, and check-mark emoji in venues `wos`/`scopus`.
- spec.md:72 says the scan "must print nothing". The brief must exempt the hub files or say what the gate checks there. Removing the glyphs from Axel's data is outside Z681's "records keep their shape".

F22. Verify 6 asks the builder to run `git grep`. spec.md:32 reads "You never run a git command, read-only ones included".
- Its pattern also skips the hub YAML, `docs/DATA-MAP.md` and `utils/migrations`.
- It checks neither `values:` nor `description:` outside options.yml, nor `REFERENCES` in validate.ts.

F23. The report section does not ask for the number of full-list runs, which is a standing demand (`orchestrator-state.md:60`: "asks the report for the number of full-list runs").

F24. The brief names no worktree path, no base copy and no base `unused-exports.txt`.
- spec.md:31 says the work happens "in the git worktree the brief names", and spec.md:34 makes the file table from "the `diff -rq` against the base copy". D45's brief line 39 shows the form: "The base copy is `.agents/worktrees/D45-base/tools/oculus/` ...".
- Verify 4's "prints no new name" needs a base list to compare against.

F25. The hub data edits have no script named, and the brief does not require each hand-edited hub line before and after. Item 6 changes about ten records across five hub files. The report section asks for "every host- or user-visible change with its before and after", but not for each data line.

F26. Brief line 101 says a new guarded entry "is not added by the builder: the report names what it would cover". spec.md:57 reads "A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled". The generator and the ajv mapping are config readers or parsers in spec.md:57's sense, so the brief should either put the entry to Axel before dispatch or tell the builder to stop.

F27. Decision 6 ("yaml-language-server's diagnostic and hover texts reach the editor as the server writes them") sits beside item 5's citation of spec.md that "a library's error is mapped to a catalog line". See Declined.

## 5. Could a case, the step's check or a build item pass without the goal being reached?

F28. Case 16 and item 3's glob list rest on decision 4 ("Globs use node:path's matchesGlob"), but the matching that decides which schema a file gets is yaml-language-server's.
- The `schemas` map is handed to yaml-language-server, and `yamlSchemaService.js:120-130` reads "// strip leading / and add **/ prefix" and then calls `picomatch_1.default(processedPatterns, ...)`. `grep -n picomatch package.json` in the 1.24.0 tarball prints `"picomatch": "^4.0.4"`.
- So `projects/**/project.yml` becomes `**/projects/**/project.yml`, which my picomatch probe matched against `.../tools/oculus/demo/projects/x/project.yml`. `git ls-files 'tools/cockpit/dummy/projects/**/project.yml' | wc -l` prints 10. Those demo and dummy manifests get the hub's manifest schema with the hub's enums, and the hub's venue ids and people keys then mark their values.
- "Outside `tools/`" cannot be written, because a `!` negation is broken by the prefix.
- A bare `present.yml` glob matches `tools/oculus/config/present.yml` and `config/text/views/academic/present.yml` (the probe returned true). `git ls-files '**/present.yml'` lists both, beside the 26 decks and `tools/present/content/present.yml`.
- Several matching schemas are combined with `allOf`, so a file matched twice must pass both.
- A check that runs `matchesGlob` in oculus passes case 16 while the editor shows the wrong schema. The brief must say that the globs given to the server are exact, root-relative paths generated per file (or another form yaml-language-server matches as intended), and that case 16 is checked in the editor.

F29. Case 8 passes with any handling that does not print "unknown retrieval.method", including a `print` and skip. It does not require that the dry run prints `wget` of the `direct` set's `base_url` plus each `priority_first` name (Z701 (9)), or that a `script` set prints its notes as `show_manual` does (redownload.py:177-192).

F30. Verify 3 (G14 zero findings) can pass against a hub other than the worktree's, depending on local.yml (F14). It can also pass if ajv replaces `REFERENCES` with a set of checks that finds less: `validate()` at validate.ts:828-863 runs 25 named checks beside `REFERENCES`. The brief does not list which of them ajv replaces and which stay. An ajv path that drops, for example, `checkWaitingOn` or `checkFundingIdentity` still gives zero findings on a clean hub.

F31. Case 4 (a hover shows the help line) passes for any field the generator emits `description` on. Case 1 and case 3 pass on the hub root alone. No case covers what the cpp, commands, deck and side-project schemas accept against their readers, which item 2 asks for ("so the schema accepts exactly what the reader accepts"). No case covers the zod-generated schemas.

F32. Case 17 ("no request reaches schemastore.org") does not cover the server reading a `file:` or relative schema from disk.
- `checkSchemaURI` (`schemaUrls.js:65-71`) turns an absolute path into `file:` and resolves a relative path against the workspace folders, and `resolveDollarSchema` honours a top-level `$schema:` key as well as the modeline.
- `loadSchema` falls back to parsing the content as YAML. In oculus's own `yaml` package, a parse error message embeds that content: `node -e` with `y.parse('token: SECRET-VALUE-123\n  bad: [unclosed\n')` printed "token: SECRET-VALUE-123" under the caret.
- A hub file with `$schema: ../secrets/<file>` or `$schema: config/local.yml` would therefore have the server read that file and could echo its text in a diagnostic, which is G3's ground. Case 18 covers only sending local.yml as a document.

## 6. Implied inputs, each with its expected result

F33. The brief states no expected result for the following inputs.
- 36 manifests have an integer `year`, while the field is `type: text`; a Python count printed "manifests with int year: 36". If the generator maps `text` to `string`, ajv marks 36 manifests and G14 goes red. Expected: `text` accepts a number, or the brief rules otherwise.
- `feeds/literature-radar.yml`: 55 entries carry `maps_to: new-idea-candidate`, which is not a project id. The Python check printed "maps_to not an id: {'new-idea-candidate': 55}". `from: projects` marks all 55 unless the word is an allowed extra value.
- In the same file, `motif`, `maps_to` and `idea_spark` appear 185 times and must be declared, or `additionalProperties: false` gives 185 findings.
- Career: `hosts` rows carry free score keys (normalise-career.ts:18 treats every other string key as a score), `situation` is a map with free keys, `host_criteria` is a list of strings, and `retrieval` in data.yml is `type: raw`. Each needs `additionalProperties` left open, which the brief does not say.
- Every hub collection file has top-level keys besides its records (`title`, `intro`, `meta`, `schema`), and data.yml's records sit under `datasets:`. The expected file-level schema is not stated.
- `projects/manuscripts/dongho-ecg-clustering/admin/reviews/commitment-ledger.yml` is a list at the top level. Expected: no schema, syntax marks only.
- The demo hub (15 schema blocks) and `tools/cockpit/dummy` (10 manifests): F28. Expected: their own registries, or no schema.
- Event role `co-present` in Board stats: `state/boards/board/stats.ts:153-154` skips only `role === 'attend'`, so a co-author's talk counts as Axel's. The expected count is not stated.
- The Venues view (`state/sources/venues.ts:166-170`) draws only `journal` and `conference`. Where `thesis` and `meeting` venues are drawn is not stated.
- Other YAML that oculus reads and the brief gives no schema: `.oculus/settings.yml`, `.oculus/apps/*/app.yml`, `~/.oculus/schedules.yml` and `~/.oculus/bookmarks.yml`. bookmarks.yml carries a hub-format `schema:` block (`head -12 ~/.oculus/bookmarks.yml`: `- { field: label, type: text, label: Label, required: true }`). Expected: none, or stated.
- A hub schema file that does not parse while a file referencing it is open: case 13 covers the referenced file, not the schema file.
- A side project with an empty `links:` list: all nine files have `links` empty (`[]`), and the expected acceptance is not stated.

## 7. What the ADR folder check prints

`ls tools/oculus/docs/adr docs/adr`, run from `tools/oculus` and from the hub root, printed "ls: docs/adr: No such file or directory" and "ls: tools/oculus/docs/adr: No such file or directory". There is no ADR folder.

## 8. Dictated text in the brief

F34. Dictated text that can be checked against the files:
- The five vocabulary examples (brief lines 140-144) quote `venues.yml:18`, `joint-work.yml:11`, `events.yml:8`, `manifest-schema.yml:41` and `options.yml:20-25`. `grep -n "from:" config/catalogs/manifest-schema.yml` confirms :41 `venue_id: { label: "Venue", type: select, from: venues, section: Core }`.
- Example 3 writes `help: "..."`, leaving the help line to the builder, which is consistent with item 1's "87 hub fields".

None of the dictated sentences in `help:` values or item 7 contains a dash or non-ASCII character. `grep -n " - \| -- " agents/briefs/M8.md` printed nothing.

The help lines the brief dictates (venues category: "The kind of venue: a journal, a conference, a thesis or a meeting."; joint-work person: "The person's key in registries/people.yml.") are Axel's hub text. See Declined.

## 9. Sizes and folder counts against the limits

`wc -l` on the files the step changes or that the regroup touches:
- context.ts 879 (F12)
- validate.ts 863
- fs.svelte.ts 840 (a `.svelte.ts` file, so the 880 limit applies)
- relay.ts 839
- normalise.ts 837
- collection.ts 806
- settings.ts 770
- fields.ts 653
- held.ts 601
- servers.ts 556
- options.ts 541
- choices.ts 224
- lsp-servers.ts 209
- options.yml 1286 (YAML is outside the size check, which covers ts, svelte, mjs, js and sh)
- cockpit page.py 995 (outside oculus's size check)

validate.ts, normalise.ts, fs.svelte.ts and relay.ts have 17 to 43 lines of room.

F35. Item 3 offers "a new folder beside" `src/lib/data/snapshot`, but `ls src/lib/data | wc -l` prints 10, so a new folder there breaks the folder limit. `ls src/lib/data/snapshot | wc -l` prints 8, so two new generator modules fit inside `snapshot/` and a third does not.

Other folder counts:
- `server/machine/lsp` holds 10 items (`ls` lists choices.ts, clangd, held, library, pyright, relay.ts, servers.ts, uris.ts, web and wire.ts); the regroup brings it down.
- `config` holds 7 plus `schemas/`, making 8.
- `config/catalogs` holds 9, and 8 after the move.
- `data/prose` 9, `tests/server/machine/lsp` 9, `state/system/config` 10, `state/sources` 10, `state/boards` 10.

## Declined to judge

- Whether the worktree's `local.yml` points G14's test at the worktree's hub. The task forbids opening local.yml.
- The wording of the 87 help lines and the dictated help sentences. They are Axel's hub text, and the brief leaves them to the builder's report.
- Whether yaml-language-server's English diagnostic and hover texts fall under spec.md's rule that a library error is mapped to a catalog line, given decision 6's precedent of pyright and clangd. `grep -n -i "diagnostic" DESIGN.md` printed nothing, so no written ruling settles it. A ruling by the orchestrator settles it.
- The paths D43 and M6 will share with M8. The dispatch entries' `shared_paths` for steps not yet prepared were not read.
- Whether PR3 has landed (Z672 (8)). This was not verified in this check.

Usage: a40f2578315ca7d21, claude-opus-5-5, 145,450 tokens, 197 tool uses, 25.4 min.
