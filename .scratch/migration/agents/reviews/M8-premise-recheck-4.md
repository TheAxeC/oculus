# M8 premise recheck 4, run on main at 3bf3bf4c6

Nothing is left undone in this recheck, with two limits. First, `~/workspace/cathedra/.oculus/` was not listed, as the task forbids, so "no `.oculus` file other than `project.yml` in a served root" is checked for the hub root and five of the six roots only. Second, whether sticky scroll reads the YAML server's document symbols is traced only as far as the Outline and breadcrumb store; see 3.4. I changed no file, ran only read-only git, started no process and touched no port.

## 0. Main's head

`git rev-parse HEAD` printed 3bf3bf4c6876e35dd3a198d65892c2f27c719053. `git log --oneline 1ae5e7c8d..HEAD` lists four commits: 2441e0b53, 4fbe89e4b and e370ee0a1 (D28's preparation, launch and repair round) and 3bf3bf4c6 (Land D28).

Commands used throughout:
- A. A loop of `git diff --numstat 1ae5e7c8d 3bf3bf4c6 -- <file>` over every source, test, config and doc file the brief or recheck 3 names (about 85 paths). Only these printed a change: `src/lib/server/root/context.ts` (+22/-5), `src/lib/server/root/process/server-context.ts` (+9), `config/catalogs/options.yml` (+33), `src/lib/data/sources/config/editor-options.ts` (+13/-1), `views/system/workbench/settings/Item.svelte` and `List.svelte` (+1/-1 each, an import path), `src/lib/state/sources/fs-transport.ts` (+7/-4), `tests/checks/config/config-folder.test.ts` (-1), `config/text/views/sources/source.yml` (+12/-1), `DESIGN.md` (+8/-7), `HELP.md` (+1/-1), `docs/files-and-search.md` (+17/-3), `docs/configuration.md` (+1/-1), `src/lib/server/files/fs/lsp-edit.ts` and `src/lib/server/files/source.ts`. Any anchor in a file outside this list holds byte for byte.
- B. `git diff --stat 1ae5e7c8d 3bf3bf4c6 -- applications education feeds funding network registries tasks projects side-projects docs/DATA-MAP.md tools/data tools/cockpit tools/oculus/demo .../manifest-schema.yml .../vocab.yml .../config/text .../.prettierignore .../README.md .../docs/apps.md .../docs/views.md .../utils` printed only `config/text/views/sources/source.yml`. The hub's data, DATA-MAP, `redownload.py`, the cockpit and the demo are unchanged since recheck 3.

## 1. Recheck 3's corrections at 3bf3bf4c6

1. Line 11. Moved. `wc -l` gives `context.ts` 795 (was 778) and `server-context.ts` 147 (was 138). D28 added `openFiles` and `configCache` to `ServerContext` (`server-context.ts:82` `configCache: ConfigCache`). "M8 does not change server-context.ts" still holds: the relay is already a member (`:43`), and Z712 N2's callback is passed inside `context.ts`. D28 has landed too.
2. Line 30. Moved: the read is now on main at 3bf3bf4c6.
3. Line 32. Holds; this recheck's file is added.
4. Line 34. Partly moved.
   - Holds: `lsp-servers.ts` is 207 lines.
   - Moved: `grep -n createRelay context.ts` gives `:244`, and the call closes at `:255`, so the relay is built at `:244-255`.
   - Moved: `const portfolio = startPortfolio()` is at `:377` (was `:375`), `startPortfolio` at `:300`, and `hub.latest('portfolio')` at `:315`.
   - Hold: `data/index.ts:257` and `:291`, `watch/portfolio.ts:590`/`:591` and `:114-117`, `packaged` at `servers.ts:268`, "There are four entries" at `servers.ts:10`, `held/process.ts:173` (`initialized`), `held.ts:431` (`ready:`) and `choices.ts:117` (`async function reconfigure`). Each was read with `grep -n`/`sed -n`.
5. Holds: `grep -n '^schema:' feeds/position-leads.yml` gives `52:`.
6. Holds (`entries.ts` unchanged, A).
7. Holds.
   - `launch.ts:46` and `files.ts:33` are `entryShape` (`sed -n`).
   - `ls -a .oculus` in the hub root says "No such file or directory". `ls ~/workspace/<r>/.oculus` gives only `project.yml` for game-engine, officium, ordo, scotoma and youtube-downloader. Cathedra was not listed.
   - `network/events.yml` is unchanged (B).
8. Holds (`sed -n '19p;28p' model-entities.ts`).
9. Moved (D28). `wc -l` gives 1331 lines.
   - `grep -c "description:"` gives 224 (was 218) and `grep -c 'values:'` gives 28 (was 27).
   - The sections are now `layout.yml :851`, `present.yml :1085`, `sources.yml :1098` and `local.yml :1241`; `behavior.yml :170` holds.
   - `suggest_from` is at `:76`, `:223` and `:779` (was `:746`).
10. Holds.
    - `fs-transport.ts:237` is still `optionsFrom` (the file is now 468 lines).
    - `settings.ts:79` holds, `FieldControl.svelte:301` is `spec.suggest_from`, and the `collection.ts` lines hold (file unchanged).
11. Holds: `editors/draft.ts:126` and `:512`, and `editors/Editor.svelte:73`. This is `state/system/config/editors/draft.ts`. D28's new `state/sessions/source/draft.ts` is a different file.
12. Holds.
13. Holds: `docs/views.md:247`, and `schema.ts:1` and `:28` (grep).
14. Partly moved. G7 `:26` and G55 `:38` hold. G13's Code line is now `:135` (was `:126`), because D28 added G58 to G60 above it. `grep -n -E '^- G(...)\.'` gives G12 `:131`, G13 `:134`, G14 `:137` and G56 `:140`. `servers.ts:27-30` and `relay.ts:54` hold.
15. Holds: `real-hub.ts:29` is `loadLocal(engine).hub`, and `validate.ts` is unchanged (A).
16. Holds: `stats.ts:154`.
17. Moved.
    - `context.ts` is now 795 and `fs-transport.ts` 468.
    - Folder counts: `git ls-files | cut | sort -u | wc -l` gives `server/root/process` 9 (was 8, since D28 added `config-cache.ts`). `server/files/fs` is 10 and `data/helpers/files` 8. Every other folder recheck 3 lists is the same.
    - The other sizes hold: `wc -l` gives transport.ts 871, fs.svelte.ts 879, draft.ts 695, settings.ts 797, collection.ts 806 and normalise.ts 837.
18. Holds, and widens. `options.yml:493` is still `editor.sticky_scroll`, and `client.ts:601` is unchanged. Add `docs/files-and-search.md:81` (the sticky-scroll sentence D28 rewrote) and `:85` ("document symbols for sticky scroll, the path over the tab and the Outline").
19. Holds (N1, Z712).
20. Holds.
21. Holds.
22. Moved: `context.ts:242-254` becomes `:244-255`.
23. Holds.
24. Holds.
25. Holds.
26. Holds (N3; `events.yml` unchanged).
27. Holds, and widens with `docs/files-and-search.md:81` and `:85`.
28. Holds.
29. Holds (no change).
30. Holds: `data/index.ts` and `watch/portfolio.ts` are unchanged.
31. Holds.
32. Holds.
33. Holds.
34. Holds.
35. Holds.
36. Moved. D28 has landed and `dispatch: []` (`orchestrator-state.md:27`), so nothing is in flight. The `options.yml` merge question is gone: M8's rename must cover D28's entries (section 3).
37. Moved. The read ranges become `context.ts:236-264`, `:296-316` and `:372-382`. `config-cache.ts` should be added (section 3).
38. Holds.
39. Holds. `npm view yaml-language-server` gives latest 1.24.0, next 1.25.1-2c1cd23.0, `time.modified` 2026-10-07T23:03:11Z.

## 2. Other premises D28 touched

- `DESIGN.md`. D28's hunks start at `:121` (`git diff -U0 | grep @@`), so `:23`, `:24`, `:44`, `:163` and `:165` hold. `:571` ("The language servers ... pyright, clangd, ...") is now `:572`, because a line was inserted at `:510`.
- `docs/files-and-search.md`. The "Language servers" heading and paragraph are now `:83` and `:85` (were `:69-71`). The Outline at `:15-17` holds. D28 added "Saving a source file" (`:63-75`) and rewrote "The source tab's editor options" (`:77-81`).
- `docs/configuration.md:19` (manifest-schema row) holds. D28 changed only `:13`.
- `HELP.md`. Still 185 lines; `:79` (F2 rename) and `:114` hold. `grep -n -i "yaml\|schema\|completion"` finds nothing for M8.
- `config/text/views/sources/source.yml`. The `cmd_*_restart`/`cmd_*_output` block is still at `:17-36`. D28 inserted at `:38-42` and later.
- `Item.svelte:95`, `:176`, `List.svelte:65-66`, `:97-98` and `Control.svelte:118` hold (`grep -n description`).
- `config-folder.test.ts`. D28 removed a comment at old `:104`, so `:100` (`own(...)`) holds and the manifest-schema row moved from `:176` to `:175` (`grep -n`).
- `editor-options.ts` (220 lines). The brief's "`editor-options.ts:1-10`, read against the `options.yml` entries of the `editor:` block" is wrong for `.oculus/settings.yml`. This was missed before D28 too. `parseRepoSettings` (`:199-219`) reads only the top-level `languages:` map, each record against the fields of the `editor.languages` entry (`options.yml:523-559`). It ignores every other top-level key, `editor:` included, with no problem. `docs/files-and-search.md:81` says so: "its `editor:` key is not read". So case 32 ("offers the `editor:` keys") tests the wrong thing.
- `options.yml` header. `:9`, `:11` and `:12` name `description`, `values`, `values_from`, `values_by` and `suggest_from` (`sed -n`). Verify 6's `grep -c "description:"` does not catch the backticked `description` at `:9` and `:12`.
- `tests/server/root/context-fixture.ts:53-59` (changed by D28) calls `createRelay` with five members. `changes` and `library` are optional in `RelayOptions` (`relay.ts:107-112`). M8's new member must be optional too, or this fixture joins the write list. `grep -rn "createRelay(" tests src` lists only this fixture and `context.ts:244`.
- `.agents/plan.yaml` and `agents/spec.md` are unchanged since 1ae5e7c8d (`git diff --stat` printed nothing).

## 3. D28's entries and what M8 must take in

3.1 The `options.yml` entries D28 added (`awk 'NR>=496 && NR<=559 && /description:|values:/'`):
- `editor.autosave`, `:496`: `description:` at `:499` (three sentences, VS Code's words) and `values: ['off', after_delay, on_focus_change]` at `:502`. M8 renames them to `help:` and `options:`. The generated `behavior.yml` schema gives `editor.autosave` an enum of the three words, and `config/behavior.yml:122` (`autosave: 'off'`) must pass it.
- `editor.autosave_delay_ms`, `:503`: `description:` at `:506`, then `control: number`, `min: 0`, `whole: true`. Rename to `help:`; the schema is `type: integer, minimum: 0`.
- `editor.trim_trailing_whitespace`, `:511`: `description:` at `:514`, toggle. Rename to `help:`; boolean.
- `editor.final_newline`, `:517`: `description:` at `:520`, toggle. Rename to `help:`; boolean.
- `editor.languages` field `trim_trailing_whitespace`, `:554`: `description:` at `:555`. Rename to `help:`.
- `editor.languages` field `final_newline`, `:557`: `description:` at `:558`. Rename to `help:`.

These two record fields belong in both schemas that take `editor.languages` records: `behavior.yml`'s `editor.languages`, and a repository's `.oculus/settings.yml` `languages:`. The brief must say that the `settings.yml` schema is generated from the `editor.languages` entry's `fields:`, so they are in it without a list kept by hand.

The brief must also say three more things:
- M8 keeps D28's words byte for byte and changes only the keys.
- The sentences the rule builds from these entries keep their words. D28's `tests/checks/config/config.test.ts` asserts "editor.autosave must be one of off, after_delay, on_focus_change; the default is used" and five more, so that file is run alone (G12/G13).
- The header comment `:9`, `:11`, `:12` is rewritten in the new words.

3.2 The config cache (`server/root/process/config-cache.ts`, 67 lines; `hooks.server.ts:88` `event.locals.config = () => (read ??= context.configCache.read())`):
- M8's generation does not touch it. The portfolio watcher reads the config itself (`watch/portfolio.ts:513` `loadConfig(paths.engine)`) and watches the config folder recursively (`:588` `open(engineConfig, true)`). Z712 N2's schemas leave `buildPortfolio`, not `loadConfig`.
- Moving `manifest-schema.yml` into `config/schemas/` and the second folder `merge.ts` reads are both seen by the cache. `configStamp` (`config-cache.ts:29-45`) lists `configDir` with `readdirSync(..., { recursive: true })`, so a write under `config/schemas/` moves the stamp and the next request parses again.
- The brief should state that the generator runs in `buildPortfolio` and never in `loadConfig`. Otherwise the parse cost that `config-cache.ts:2` names ("about 75 ms") grows for every request after a config write.
- The relay's own closures still call `make.loadConfig(engine)` directly (`context.ts:247`, `:250`, `:252`), and M8's new member needs no config.

3.3 The save path, autosave and the `source:` channel:
- Formatting. A server with no formatting provider makes `#format` answer `unsupported` (`kit/lsp/client.ts:611-612`), and `formatForSave` (`views/sources/source/language/lsp.ts:520-526`) says nothing for it. So `format_on_save` and the formatting that an `on_focus_change` autosave does (`state/sessions/source/autosave.svelte.ts:97`) save a YAML file as typed, which agrees with Z701 (4). Case 22 should cover both, with D28's trim and final-newline keys at their default false, since those keys change a hub file's text when the reader turns them on, and that is the reader's choice.
- Autosave. Under `after_delay`, D28 writes a hub YAML file after each pause in typing. Each write rebuilds the snapshot and therefore the schemas, and a `workspace/didChangeConfiguration` makes yaml-language-server drop its schemas and revalidate (`yamlLanguageService.js:47-48`, recheck 2). Item 4 must say that the relay sends it only when a generated schema's text differs from the last one sent.
- Case 12 should say the new `people.yml` key is saved, by Save or by autosave.
- The `source:` channel (`server/files/fs/open-files.ts`) polls the hashes of open files. It shares nothing with the `lsp:` channel or the relay, so nothing to take in.

3.4 `lsp-edit.ts`'s whole-file rule:
- A server's edit of a file not open in a tab is now refused as `binary` when the file holds a NUL byte or is not UTF-8 throughout (`isWholeText`, `lsp-edit.ts:68`). The hub's YAML holds accented letters, the euro sign and emoji, all of them UTF-8, so the rule passes them. M8's capability list has no rename, and yaml-language-server's code actions edit the document they were asked on, which is open in a tab and edited there. Nothing to take in.
- A related fact that predates D28: `inLibraryFolder` refuses any path with a part that starts with a dot, so a cross-file edit of `.oculus/*.yml` is refused `outside`.
- Server symbols. Server symbols reach the Outline and breadcrumb store through `services.symbols`, which `views/sources/source/language/lsp.ts:199` wires to `documents.setSymbols` (`state/system/machine/lsp/documents.svelte.ts:84`). The only `registerDocumentSymbolProvider` in `src` is `views/sources/source/language/symbols.ts:81`, used for Markdown and LaTeX. Whether sticky scroll uses server symbols is not verified, so the `:81` sentence is read at the build against what the YAML tab shows.

## 4. Cases and verify against the rules

- Breakage testing. `grep -n -i "revert\|mutation\|must catch\|fault\|break"` over the brief finds only Z681's "breaks its own rule" (line 20) and line 35's "default". No case or verify item breaks code. Cases 31 and 36 use input files under `$TMPDIR`, which is a fixture, not a change to code.
  - Case 29 does not say where its two hub files are written. Since the builder may change only the hub lines the brief names, it should say a root served from `$TMPDIR`.
- Tests and guarded entries. Every test the brief adds is under an existing entry, plus Z707's G56 (`guarded.md:140`, Test "written by M8"). No new entry is needed.
- Entries whose code M8 changes but whose tests the brief does not name. By spec.md:57 ("A step whose change touches an entry's code runs that entry's test"), each should be named and run alone:
  - G12/G13: `tests/checks/config/config.test.ts`, which reads D28's `editor.*` entries through `readEditorOptions` and the rule M8 renames.
  - G24: `tests/checks/source/keys.test.ts`, for `no_help`, `statusbar.server_yaml`, `source.cmd_yaml_*` and `settings.desc_*`.
  - G49: the manifest reader's `tests/server/machine/apps/manifest.test.ts`, 'reads each apps folder to its rows and its findings' (`guarded.md:35-36`), whose reader M8 rewrites in zod.
  - The commands and launch readers that Z712 N1 changes have no guarded entry (`grep -o "commands/files.ts\|debug/launch.ts" guarded.md` prints nothing). Case 30 checks them by a quoted run, so no entry is asked for.
- Verify commands.
  - `package.json` has `diagrams` (`:21`) and `test:quick` (`:15`). `~/.claude/skills/land/templates/checks.sh` and `~/.nvm/versions/node/v24.21.0` exist. `orchestrator-state.md`'s `verify:` is `npm run test:quick`, and `tests/checks/config/integrity.test.ts` exists. All hold.
  - Wrong: Verify 5 cites the ASCII gate as `agents/spec.md:72`, but `grep -n "The ASCII gate" spec.md` gives `:97`, and `:72` is "Run every command the brief lists".
  - Gap: Verify 6 does not catch the backticked old key names in the `options.yml` header.

## 5. Choices

One new choice comes from rereading `editor-options.ts`. Z701 (6) arguably settles it, but the code and `docs/files-and-search.md:81` say the opposite, so it is put here.

C1. A top-level key other than `languages` in a repository's `.oculus/settings.yml`, such as `editor:`. This is user-visible: a mark, a Findings line under the Languages row, and a doc sentence.
- Today `parseRepoSettings` (`editor-options.ts:199-219`) ignores it with no problem, and the docs say "its `editor:` key is not read". Z701 (6) says a field no schema declares is marked and is a finding.
- (a) Recommended: the schema declares only `languages`, with `additionalProperties: false`, so the editor marks such a key. `parseRepoSettings` names it as a skipped entry under the Languages row, and `docs/files-and-search.md:81` says so.
  - Pro: the editor and the reader agree, as Z701 (6) and Z672 (6) ask, and an `editor:` block a reader expects to work is shown as unread.
  - Con: a new problem kind in the Languages row and a reader change in `editor-options.ts`.
- (b) The schema marks the key and the reader stays silent.
  - Pro: no reader change.
  - Con: the editor marks what the Languages row never lists, two rules for one file.
- (c) The schema leaves the top level open. This is the lazy option: the key is neither marked nor listed, against Z701 (6).

The other candidates are not choices:
- D28's six help texts are D28's ruled words, and M8 renames only their keys.
- Sending a reconfigure only when a schema changes is internal.
- The config cache needs no change.
- Case 22's coverage of the trim and final-newline keys is a clarification.
- The optional `RelayOptions` member is internal.
- Whether yaml-language-server parses unquoted `off` as a string depends on its `yaml.yamlVersion` default, which is not verified (the package is not installed: `ls node_modules/yaml-language-server` says no such file). The brief can set `yamlVersion: '1.2'` in the configuration answer, as an internal setting.

## 6. Libraries

`npm view <name> version license dist-tags time.modified`:
- yaml-language-server: 1.24.0 MIT, latest; next 1.25.1-2c1cd23.0; modified 2026-10-07T23:03:11Z. Not installed.
- ajv: 8.20.0 MIT, latest, 2026-04-24. 6.15.0 is installed (`node -p`).
- zod: 4.6.5 MIT, latest. 4.6.5 is installed.
- ajv-formats 3.0.1, picomatch 4.0.7, @types/json-schema 7.0.15 and monaco-yaml 5.5.1: unchanged.

D28 added no dependency: `package.json` is unchanged (A). No new candidate covers what M8 builds.

## 7. The full list of corrections to the brief

Recheck 3's corrections, restated with updates:

1. Line 11, new text: "the relay gains a member built in `server/root/context.ts`. X3e (1ae5e7c8d), D11 (c88b76443, d098915b5) and D28 (3bf3bf4c6) have landed: `context.ts` is 795 lines, and the `ServerContext` type is in `server/root/process/server-context.ts` (147 lines), which M8 does not change. The premises below are read on main at 3bf3bf4c6 (`agents/reviews/M8-premise-recheck-3.md`, `M8-premise-recheck-4.md`), and the worktree is cut at main's head."
2. Line 30, new text: "(read on main at 3bf3bf4c6)".
3. Line 32, new text: "the brief check `agents/reviews/M8-brief-check.md`, or `agents/reviews/M8-premise-recheck-3.md` and `M8-premise-recheck-4.md`, with its command there."
4. Line 34.
   - Change "(209 lines)" to "(207 lines)".
   - Replace "The relay is built in `server/root/context.ts:341-352`." with: "The relay is built in `server/root/context.ts:244-255`, before the portfolio watcher starts at `:377` (`startPortfolio` `:300`); the snapshot validation uses is built by `buildPortfolio` (`data/index.ts:257`, `validate` at `:291`), called from `server/root/watch/portfolio.ts:590`, whose `Watcher` exposes only `close()` (`:114-117`). `ServerContext` also holds `configCache` (`server-context.ts:82`), which `locals.config()` reads (`hooks.server.ts:88`)."
   - Add: "`packaged()` (`servers.ts:268-284`) launches `[script, '--stdio']` under `options.node` and takes no node flags. `servers.ts:10-17` says there are four entries and names each. `initialized` is sent by `held/process.ts:173`, and the server's `ready` is handled at `held.ts:431`. `reconfigure` is module-private at `choices.ts:117-126`."
5. Line 41: "`feeds/position-leads.yml:51`" becomes ":52".
6. Line 41: "`normaliseMetalists` (`server/edit/writes/entries.ts:130`), its field set from `metalistFields` (`:112-128`)".
7. Line 42, append: "`.oculus/launch.yml` (D11, the debug configurations, reader `server/machine/debug/launch.ts`, a zod `entryShape` at `:46`); `.oculus/commands.yml`'s reader is zod (`runs/commands/files.ts:33`). No `.oculus/cpp.yml`, `commands.yml`, `settings.yml`, `launch.yml` or `apps/*/app.yml` exists in the hub root or the roots game-engine, officium, ordo, scotoma and youtube-downloader. `network/events.yml:1` and `:3` (`intro`) describe the roles `present` and `attend` only."
8. Line 43: "`model-entities.ts:19-28`".
9. Line 44: "(1331 lines): `description:` 224, `values:` 28, ... sections `appearance.yml :15`, `behavior.yml :170`, `layout.yml :851`, `present.yml :1085`, `sources.yml :1098`, `local.yml :1241`; `suggest_from:` 3 (`:76`, `:223`, `:779`)".
10. Line 45.
    - "`state/sources/fs-transport.ts:237`" and "`data/sources/config/settings.ts:79`".
    - "`state/boards/collection.ts:134`, `:135`, `:155`, `:157`, `:160`, `:248`, `:623`".
    - Add "`views/system/workbench/editors/FieldControl.svelte:301` (`spec.suggest_from`)".
11. Line 46, append: "The property is also written at `state/system/config/editors/draft.ts:126` and `:512` and at `views/system/workbench/editors/Editor.svelte:73`."
12. Line 47: "`views/system/workbench/Settings.svelte:161`".
13. Line 48.
    - "`docs/views.md:247`".
    - Add "`src/lib/state/forms/schema.ts:1`, `:28`".
    - "`config-folder.test.ts:176`" becomes ":175".
14. Line 49: "`servers.ts:27-30`, `relay.ts:54`, `tests/server/machine/lsp/servers.test.ts:9` and `cpp-file.test.ts` lines 1 and 9 import adapter paths; `agents/guarded.md` names them in the Code lines of G7 (:26), G55 (:38) and G13 (:135)."
15. Line 50.
    - "`validate() :828-863`, which calls `checkReferences` (the `REFERENCES` loop), `sortFindings` (the order) and 23 checks: 22 other `check*` functions and `personalFindings` (`checkWaitingOn` and `checkFundingIdentity` among them)".
    - "(`tests/fixtures/real-hub.ts:29`)".
16. Line 53: "`state/boards/board/stats.ts:154`".
17. Line 55.
    - Sizes: "`fs.svelte.ts` 879 (M8 does not change it), `transport.ts` 871, `validate.ts` 863, `relay.ts` 839, `normalise.ts` 837, `collection.ts` 806, `settings.ts` 797, `server/root/context.ts` 795, `draft.ts` 695, `watch/portfolio.ts` 660, `fs-transport.ts` 468, `data/index.ts` 299".
    - Add to the folder counts: "`server/root` 10, `views/system/workbench/settings` 10, `server/root/process` 9".
18. Line 56, append: "`options.yml:493` (`editor.sticky_scroll`) and `docs/files-and-search.md:81` name the servers that give the editor its structure, and the Outline asks any served tab's server for symbols (`kit/lsp/client.ts:601`)."
19. Item 2, line 70 (Z712 N1): "and `cpp-schema.yml` (`.oculus/cpp.yml`); `.oculus/commands.yml` and `.oculus/launch.yml` get the JSON Schemas of whole-file zod shapes built on their readers' `entryShape`s (`runs/commands/files.ts:33`, `debug/launch.ts:46`)". Case 38 then reads "the three new schema files", and case 30 names launch in place of commands-schema.
20. Item 4, line 78.
    - "`servers.ts` gains the entry through `packaged(...)`, which gains an optional list of node flags placed before the script (today `servers.ts:268-284` builds `[script, '--stdio']`),".
    - Add to line 77's facts: "`program: 'yaml-language-server'`, `semanticTokens: false`, `organizeImports: null`, `interpreterLibrary: false`".
21. Item 4, line 80: "... `yaml/registerContentRequest`, from an optional entry member read where `held.ts:431` handles the server's `ready`."
22. Item 4, line 82 (Z712 N2): "built beside the relay at `server/root/context.ts:244-255`, fed with each rebuild's schemas by the portfolio watcher (`server/root/watch/portfolio.ts:590`) from `buildPortfolio` (`data/index.ts:257`), which returns them beside the snapshot and publishes nothing new. When they change (a referenced file, a schema block or a schema file written), the relay sends `workspace/didChangeConfiguration` through `reconfigure` (`choices.ts:117-126`, exported for it),".
23. Item 4, line 83: "every import of their paths follows (`servers.ts:27-30`, `relay.ts:54`, `servers.test.ts:9`, `cpp-file.test.ts` lines 1 and 9), and `servers.ts:8`'s 'a folder of its own beside this file' and `:10-17`'s 'There are four entries' are reworded. The report gives the new path of each file named in a Code line of `agents/guarded.md` (G7, G55, G13)".
24. Item 5, line 85: "Of the 23 other checks `validate()` runs (`:835-860`)".
25. Report, line 232: "the 23 checks of `validate()` each", and "the Code lines of G7, G55 and G13".
26. Item 6, line 86, append: "`network/events.yml:1` and `:3` name `co-present` beside `present` and `attend`."
27. Item 7, line 87, append: "`options.yml:493` (`editor.sticky_scroll`), `docs/files-and-search.md:15-17` (Outline), `:81` (sticky scroll) and `:85` (document symbols) are read against the YAML server's symbols and rewritten where they no longer hold."
28. Case 30: "every real side-project and deck file in the served roots passes; no cpp, commands or launch file exists in a served root, so one of each, written under `$TMPDIR` with only keys its reader accepts, passes, and a key its reader refuses is marked."
29. Paths, line 151: no change.
30. Paths, line 154: "`src/lib/data/index.ts` (`buildPortfolio` `:257-299`, and `:191` if the merge's key moves); `src/lib/server/root/watch/portfolio.ts` (the schemas handed on at `:590`)".
31. Paths, line 155: "`src/lib/state/sources/fs-transport.ts`".
32. Paths, line 156: "`settings.ts` (line 79 only)".
33. Paths, line 158, append: "`src/lib/state/system/config/editors/draft.ts` (`:126`, `:512`)".
34. Paths, line 159: "`tools/oculus/src/lib/views/system/workbench/settings/Control.svelte`, `Item.svelte`, `List.svelte`; `src/lib/views/system/workbench/Settings.svelte`; `src/lib/views/system/workbench/editors/FieldControl.svelte` (`:301`), `editors/Editor.svelte` (`:73`)".
35. Paths, new lines: "`tools/oculus/src/lib/server/machine/runs/commands/files.ts`, `src/lib/server/machine/debug/launch.ts` (the whole-file shapes)" and "`network/events.yml` lines 1 and 3".
36. "Shared with the steps in flight", line 169, new text: "Nothing is in flight (`orchestrator-state.md:27`, `dispatch: []`). D28 landed at 3bf3bf4c6; its `config/catalogs/options.yml` entries are in the old words and M8's rename converts them (item 1)."
37. Read, item 2: "`held/held.ts:270-360`, `:425-440`; `held/process.ts:160-180`" and "`server/root/context.ts:236-264`, `:296-316` and `:372-382`; `server/root/process/server-context.ts`; `server/root/process/config-cache.ts`; `server/root/watch/portfolio.ts:495-612`; `data/index.ts:257-299`".
38. Read, item 5, append: "`server/machine/runs/commands/files.ts:1-60` and `server/machine/debug/launch.ts:1-80`".
39. Libraries, line 190, append: "Its other dependencies `ajv-i18n`, `ajv-draft-04`, `vscode-uri`, `@vscode/l10n` and `vscode-languageserver-textdocument` install with it; npm's `latest` is still 1.24.0 (`next` is the prerelease 1.25.1-2c1cd23.0, 2026-10-07)."

New corrections:

40. Line 15, append to the sub-lines: "the premise recheck on main at 1ae5e7c8d (`agents/reviews/M8-premise-recheck-3.md`), closed by Z712, and the recheck on main at 3bf3bf4c6 (`agents/reviews/M8-premise-recheck-4.md`)".
41. Rulings list, after line 28, add: "- Z712 (the orchestrator, automode): N1 (a), the JSON Schemas of `.oculus/commands.yml` and `.oculus/launch.yml` from whole-file zod shapes on their readers' `entryShape`s, no `commands-schema.yml`; N2 (a), `buildPortfolio` returns the schemas beside the snapshot and the portfolio watcher hands each rebuild's to a callback the relay's member reads; N3 (a), `events.yml`'s header comment and `intro` name `co-present`; M8 after D28."
42. Line 42, old: "a repository's `.oculus/settings.yml` (read against the `options.yml` entries of the `editor:` block, `data/sources/config/editor-options.ts:1-10`)". New: "a repository's `.oculus/settings.yml` (read by `parseRepoSettings`, `data/sources/config/editor-options.ts:199-219`: its top-level `languages:` map alone, each record against the fields of the `editor.languages` entry, `options.yml:523-559`, D28's `trim_trailing_whitespace` and `final_newline` among them; any other top-level key, `editor:` included, is ignored with no problem, as `docs/files-and-search.md:81` says)".
43. Line 44, append: "D28 added `editor.autosave` (`:496`, `description:` `:499`, `values:` `:502`), `editor.autosave_delay_ms` (`:503`, `:506`), `editor.trim_trailing_whitespace` (`:511`, `:514`), `editor.final_newline` (`:517`, `:520`) and the `editor.languages` fields `trim_trailing_whitespace` (`:554`, `:555`) and `final_newline` (`:557`, `:558`); `values:` sits at indent 12 (20 times) and 20 (8 times). The header comment `:9`, `:11` and `:12` names `description`, `values`, `values_from`, `values_by` and `suggest_from`."
44. Item 1, line 62, append: "The rename covers D28's entries (`options.yml:499`, `:502`, `:506`, `:514`, `:520`, `:555`, `:558`), keeping their words, and rewrites the header comment `options.yml:9`, `:11`, `:12` in the new words. The sentences the rule gives keep their words (`tests/checks/config/config.test.ts` asserts six of D28's)."
45. Item 2, line 73, old: "A repository's `.oculus/settings.yml` gets the schema of the `options.yml` entries its reader checks it against." New: "A repository's `.oculus/settings.yml` gets the schema of what `parseRepoSettings` reads: a top-level `languages:` map keyed by the `languages` source, each record taking the fields of the `editor.languages` entry, generated from that entry's `fields:` so D28's `trim_trailing_whitespace` and `final_newline` are in it." Then the C1 ruling's sentence on any other top-level key; under (a): "any other top-level key is marked, `parseRepoSettings` names it as a skipped entry under the Languages row, and `docs/files-and-search.md:81` says so."
46. Item 4, line 82, append:
    - "The relay sends `workspace/didChangeConfiguration` only when a generated schema's text differs from the one it last sent, since an `editor.autosave` `after_delay` save writes a hub file after each pause in typing and each write rebuilds the snapshot."
    - "The generator runs in `buildPortfolio`, never in `loadConfig`, so the parse `locals.config()` takes from the server context's `configCache` (`server/root/process/config-cache.ts`) costs no more. `merge.ts`'s second folder needs nothing there, since `configStamp` (`config-cache.ts:29-45`) lists the config folder recursively."
    - "The new `RelayOptions` member is optional, as `changes` and `library` are (`relay.ts:107-112`), absent meaning no schemas, so `tests/server/root/context-fixture.ts:53-59` builds unchanged."
47. Line numbers that D28 moved.
    - Line 56: "`DESIGN.md:23`, `:165`, `:572`; `docs/files-and-search.md:83-85`".
    - Item 7, line 87: "`DESIGN.md:23`, `:165` and `:572`, `docs/files-and-search.md:83-85`".
    - Paths, line 163: "`tools/oculus/DESIGN.md` lines 23, 24, 44, 165, 572" and "`tools/oculus/docs/files-and-search.md` lines 81, 83-85".
    - Read, item 7, line 205: "`DESIGN.md:20-50,160-170,565-576`; `docs/files-and-search.md:60-85`".
48. Line 71: "`config-folder.test.ts:100` (a third `own('schemas', 'schemas/')`) and `:175`".
49. Line 133, append: "A test of an entry whose code the step changes is run alone with `npx vitest run <file>` and quoted: `tests/checks/config/config.test.ts` (G12, G13; it reads D28's `editor.*` entries through the renamed rule), `tests/checks/source/keys.test.ts` (G24; `no_help` and the new keys) and `tests/server/machine/apps/manifest.test.ts`, 'reads each apps folder to its rows and its findings' (G49; the `app.yml` reader rewritten in zod)."
50. Case 12: "A key added to `people.yml` and saved (by Save or by `editor.autosave`) while a manifest is open is offered in `collaborators:` completion without a restart."
51. Case 22: "Format Document, `format_on_save: true` in `editor.languages.yaml`, and an `editor.autosave: on_focus_change` save (which formats, `state/sessions/source/autosave.svelte.ts:97`) change nothing in a hub YAML file, with `editor.trim_trailing_whitespace` and `editor.final_newline` at their default false; the save goes on as typed, since `#format` answers `unsupported` for a server with no formatting provider (`kit/lsp/client.ts:611-612`)."
52. Case 29, append: "both files are written in a root served from `$TMPDIR`, never in the worktree's hub."
53. Case 32, old: "`.oculus/settings.yml` in a repository offers the `editor:` keys and marks a value the options rule refuses". New: "`.oculus/settings.yml` in a repository offers `languages:`, the language names under it and, in a record, the fields of `editor.languages` (D28's `trim_trailing_whitespace` and `final_newline` included), and marks a value the options rule refuses", plus the C1 ruling's words on another top-level key.
54. Verify 5: "(`agents/spec.md:72`)" becomes "(`agents/spec.md:97`)".
55. Verify 6, append: "``grep -n '`description`\|`values`\|values_from\|values_by\|suggest_from' config/catalogs/options.yml`` prints nothing (the header comment included)."
56. Open item C1 (section 5), recommended (a), lazy option (c), to be booked before dispatch.

Usage: about 260,000 tokens (from the context counter), 77 tool uses, time not measured.

Usage: aa716dd6e7b642a9b, claude-opus-5-5, 269,194 tokens, 80 tool uses, 11.2 min.
