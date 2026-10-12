Everything in the brief is done.

Not run: the page itself. No builder-run page or browser, so the Settings view's This machine rows (item 3) and the Edit controls on the joined lists were exercised through `settingsGroups` and the server function only, not drawn. The look at landing covers it (section 8). Not run either: an end-to-end trash and restore of a hub's `.oculus` against a running server (case 13); the file watcher was run on a scratch folder before the change and is unchanged (section 7).

# 2. Open items of the state file (verbatim, from `.scratch/migration/orchestrator-state.md` of this worktree)

- Open item 62 (2026-10-12, D68's landing; kind 1, outside the repository): the browser half of open item 59 (a) is not done. Axel's saved pages (`oculus.layout.v1` in the browser storage of his oculus address) still hold tabs addressed by the roots `hub` and `engine`, which D68 removed, so those tabs show as unknown views; the records in `~/.oculus` are converted. The runner's permission check refused opening a page of his server (`http://localhost:8790/api/wallpaper?list`, a JSON route, so no second oculus page would load) in a tab of the orchestrator's own, which is the only way to reach that browser storage. Options: (a) Axel allows that one step (a permission rule for the Chrome navigation to his server's address, or his word to run it), and the orchestrator reads the saved pages, writes a copy under `oculus.layout.before-d68`, rewrites `hub` to `research-hub` and `engine` to `oculus` in the tab addresses, and his open page takes the result through the browser's storage event (`layout/saved/storage.ts`, `followKey`); recommended, since it is what he ruled in 59 (a) and keeps every open tab; (b) Axel reopens the affected tabs himself once, the lazy option, which 59 (a) rejected. Blocks: nothing; D68 lands without it.

This is the only entry under "Open items" in the worktree's copy of the file. The main checkout's copy was not read, so an item booked there after the worktree was made (the brief names open item 63, the literature key masking) is not in this quote.

# 3. First run of the cases, on the unchanged tree

Run from scratch tests (deleted since), on scratch hubs and engines under the system temp folder.

| Case | Result on the unchanged tree |
|---|---|
| 1 | Source save of `.oculus/local.yml` (`port: 8800` to `8801`) wrote the file (200) and made no history copy (history folder not created, 0 copies), so History and undo had nothing. |
| 2 | Save with `port: abc`: 400 `local.yml: port must be an integer`, file unchanged. Create with `port: abc` in a hub with none: same sentence, file not created. |
| 3 | Paste move over, upload replace, rename (and back), trash, copy of the file: all `protected` (400). Records only from a move of a non-local file. Undo not reachable. |
| 4 | ops `replace` naming `dot/local.yml`: `protected`, file unchanged. Workspace search never lists the file (no `--hidden`; the hub's `.gitignore` names it). |
| 5 | YAML server `refuses`: true for a hub's `local.yml` and for `secrets/a.yml`. `schemaFor` was null for `lab/.oculus/local.yml` and for `cfg/local.yml`, while `behavior.yml` gave `config/behavior`. |
| 6 | Folder Fix All plan over root `dot` (a workspace folder over a hub's `.oculus`): listed `[]`. `writing-fix` write of `dot/local.yml`: `protected`, file unchanged. |
| 7 | Git discard of untracked `oculus/config/local.yml` (with a tracked sibling so it is listed alone): refused "The path ... is a file this server never changes", trash spy not called. |
| 8 | Oculus's own `config/local.yml` through root `cfg`: save accepted with the key check (`port: abc` refused 400); 0 history copies. |
| 9 | Upload replace leaving `port: abc`: `protected`, file unchanged. `readMachine` over a file with `port: abc` gives the default and a finding. |
| 10, 12 | Primary `a` (claude_bin, hpc_host, 2 calendars) and hub `b` (1 accounts row, a calendars row repeating label `one`): `set=[claude_bin,hpc_host,calendars]`, `calendars` the two rows of `a`, `accounts` the row of `b`, problem `repeat:calendars`. No primary and hub `b`: `set=[]`, accounts and calendars the rows of `b`. `MachineState` carried names and defaults only. |
| 11 | By reading `machine.ts` (`withHeld`): a started key (port and the state paths) holds the running value in `server.machine()`. |
| 13 | Guard refused trash of `.oculus`. `watchLocal` on a scratch hub heard an edit after `.oculus` was renamed away and back, and after it was deleted and recreated by copy. By reading `follow.ts` and `context.ts` (about lines 786-795): the workspace listener rebuilds `watchLocal` and `reloadLocal` when a folder becomes or stops being a hub. |
| 14 | Guard refused trash of `oculus/config` and `oculus`. `loadConfig` on a scratch engine with `config/` moved away gives one finding (`directory_missing`, file `config`), 0 findings before and after it is moved back. |

No case showed the brief's own rule to be wrong.

Finding on an existing row: the old `tests/server/git/untracked/trash.test.ts` row for oculus's own `config/local.yml` passed with the file wholly untracked because git lists the collapsed folder `oculus/`, so it was refused as "not an untracked path", not by the guard. The row is deleted by item 5.

# 4. Items of "What to build"

| Item | State | Code that does it |
|---|---|---|
| 1 | DONE | `protectedFiles`, `holdsProtected`, `guarded`, `Guard`, the `locals` scope member, `TrashInto.guard`, the git route `guard` option, the `isProtected` options of the writing rules and the lint route, `OpsTarget.config`, `Reach.config` and the relay's `#config()` are removed from `src/lib/server/files/fs/ops.ts`, `replace.ts`, `lsp-edit.ts`, `src/lib/server/git/git-index.ts`, `git-routes.ts`, `src/routes/api/(git)/git/+server.ts`, `(files)/ops/+server.ts`, `(machine)/lint/+server.ts`, `lint/routes.ts`, `lint/writing/folder.ts`, `edit/writes/file-undo.ts`, `edit/writes.ts`, `deck-undo.ts`, and through the LSP files (`relay.ts`, `servers.ts`, `held/*`, `adapters/*`). The refusal word `protected` is gone from `OpsRefusal` (`src/lib/data/file-ops.ts`), `answers.ts` and `edits.ts`. Catalog lines `files.yml refused_protected`, `server.yml never_changed` and `no_guard` are removed. `lsp_edit_protected` is now `lsp_edit_readonly`: "{0} is read-only, so the language server's edit was not made." (`edits.ts`, `text-edits.ts`, `config/text/views/sources/source.yml`). `historyRefusal(path, bytes, history)` copies every file (`source.ts`, `source-bytes.ts`). YAML and Markdown servers refuse `isPrivateFile` only (`servers.ts`, new `adapters/yaml/private-file.ts` replaces `machine-file.ts`; `places.ts`). `withheldFolders` is the config folder and the private folders (`library/rules.ts`); `isWithheldFile` is removed and `views/sources/source/language/lsp.ts` calls `isPrivateFile`. The key check on a source-tab save or create stays (`source.ts` `localRefusal`, `namesMachineFile`). Further places: `files/workspace/oculus-config.ts`, `content/deck/read.ts`, `data/sources/deck/files.ts`, `schemas/engine.ts`, `snapshot/references/build.ts` (comment) and `schemas/references.ts` (`LOCAL_FILE` skip removed), `adapters/markdown/backticks.ts` (comment). Schema: `engineSchemas` no longer skips `local.yml`; `localRule()` in `schemas/engine.ts` governs `.oculus/local.yml` at the top of any served root and `local.yml` in a folder holding oculus's config, under the name `config/local`. To give the schema real types the `local.yml` section of `config/catalogs/options.yml` now carries `control: number` and `whole: true` on `port` and `fields` on `accounts`, `calendars`, `mail` (see judgment calls). |
| 2 | DONE | Unchanged: `apps/reach/private.ts`, `source-bytes.ts` (`saveBytes` behind `checkOpen`), `config-value.ts` and `config-key.ts` refusals and their tests. |
| 3 | DONE | `src/lib/server/root/process/context/machine-values.ts` (`machineValues`) builds `values` and `hubs`; used in `src/routes/api/(files)/fs/+server.ts`. Wire: `MachineAnswer` (`server/files/fs.ts`), `WorkspaceMachine`, `NO_MACHINE` and the zod shape (`state/sources/fs-transport.ts`), `fs.svelte.ts`, `MachineState` and `LocalRow` (`state/system/config/rows.ts`), `groups.ts`, `Settings.svelte`, `Item.svelte`, new strings `settings_machine_in_force`, `settings_machine_edit_in`, `settings_machine_edit_tip` and a reworded `settings_machine_no_primary` in `config/text/views/system/workbench.yml`. `hubFileTarget` and `LOCAL_PATH` in `config-files.ts` give the per-hub Edit control. Literature masking per the coordinator's ruling (section 7). |
| 4 | DONE | HELP.md (Settings bullet, local history, lsp-edit refusals, YAML server, Replace All, `local.yml` bullet near the end), DESIGN.md (the `local.yml` bullet at line 618, the oculus-config route, lsp-edit refusals, the YAML, Markdown and reference-index sentences), `config/catalogs/options.yml` header and the `literature.mailto` help, comments listed in section 7. README.md and `docs/apps.md` describe the app closure only and stay true. |
| 5 | DONE | Section 6. |

## Checks, as printed (from `tools/oculus` in the worktree)

Two full runs of `npm run diagrams && npm run test:quick`. The first failed in five commands (ASCII gate, prettier, eslint, svelte-check, vitest), all inside my own scratch test folder, which was still in `tests/`. After deleting it and running `npm run format`, the second run printed:

```
ok      ASCII gate (0.6 s)
ok      prettier (1.5 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.3 s)
ok      eslint (7.4 s)
ok      svelte-check (6.3 s): ... COMPLETED 481 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (39.7 s)
test:quick: 40.5 s (limit 45.0 s); every command passed
```

test:quick leaves out the slow-tagged files, three of which I changed. I ran those with the files around them: `npx vitest run --testTimeout 20000 tests/routes/git/untracked.test.ts tests/routes/hubs/hub-writes.test.ts tests/server/git/untracked/trash.test.ts tests/routes/replace tests/routes/files/file-undo.test.ts tests/routes/files/history.test.ts`: 9 files, 60 tests passed. `tests/checks` and `npm run test:landing` were not run.

- ASCII gate over `src tests bin config` (the given perl one-liner; `bin` does not exist in the worktree, `find` said so): printed nothing. `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md`: nothing.
- `sh utils/unused-exports.sh` against `D70-base/tools/oculus/unused-exports.txt`: no difference (`diff` prints nothing, 362 lines both). One export I had added, `MASKED_KEYS`, was unused outside its file and is not exported.
- `sh utils/folder-check.sh`: prints nothing.
- Largest changed files: `fs.svelte.ts` 825, `servers.ts` 872, `ops.ts` 783 lines (limit 880); changed Svelte files `Item.svelte` 408, `Settings.svelte` 378 (limit 520).
- Item 5: `grep -rn "protectedFiles\|holdsProtected\|isProtected\|isWithheldFile\|refused_protected\|never_changed\|no_guard" src tests config/text` prints nothing. `grep -rn "isMachineFile\|namesMachineFile\|machineFilesOf" src` prints only `files/workspace/machine-file.ts`, `source.ts`, `apps/reach/private.ts`, `source-bytes.ts` and `edit/writes/config/config-checks.ts`.
- `grep -rn "LOCAL_NAME\|'local.yml'" src` prints, outside `machine-file.ts`: `config-checks.ts:253` (a name that is no option), `config-value.ts:157` and `config-key.ts:119` (writers' refusal), `watch/local.ts:70` (the watcher's file name), `source.ts:44,162` (key check), `merge.ts:105,335` (the config merge leaves the file out), `catalog/options.ts:322` (reads the `local.yml` catalog section as local entries), `schemas/engine.ts` (the schema rule), the client's `config-files.ts`, `groups.ts`, `rows.ts` (the Settings rows) and `local.ts` (the reader). Each is a reader of machine values, the key check, the schema rule or a place item 2 keeps.
- History-word grep (`before|used to|no longer|still |always has|as before|previously|the step adds|D70|2026`) over the added lines of every changed source, test, config and doc file: the only hits are "before" meaning order within a sentence ("the items it did before the one it stopped", "asserted before anything is written", "before the server has answered"). No history in a comment.
- Renamed names: `grep -rn "lsp_edit_protected\|yaml/machine-file\|isWithheldFile\|files.refused_protected" src tests config docs HELP.md DESIGN.md README.md` prints nothing.
- Item 4 grep (`local\.yml|machine file|machine's own file|protected|never read|no value|never a value|never their values` over HELP.md, DESIGN.md, README.md, docs, config/text, src, tests) was read hit by hit: HELP.md 316, 321, 340, 258, 300, 458 and DESIGN.md 584, 618, 670, 669, 672 and the references paragraph were rewritten; HELP.md 407, 439, 446, 452, 453, 454, 463 and DESIGN.md 410, 515 stay true (app closure, layer rules, defaults, keys never in an answer); `docs/apps.md` lines 15, 65, 481, 545, 546 are app behaviour and stay true; `config/text/server.yml:50,139` and `findings.yml:105` describe the Settings writers and the hub layer and stay true.

Behaviour checks on the changed tree (scratch tests, deleted since): source save of `.oculus/local.yml` and of `config/local.yml` each keep one History copy and refuse `port: abc` with the sentence; paste move over, upload over, rename and back, copy, trash all succeed, and undo of the trash restores the file; an upload leaving `port: abc` is written (brief case 9); ops `replace` over `dot/local.yml` writes it; `lsp-edit` and `writing-fix` write `dot/local.yml`; the folder Fix All plan over `.oculus` lists `local.yml`; discard of untracked `oculus/config/local.yml` calls the trash; the YAML server no longer refuses a `local.yml` and `schemaFor` gives `config/local` for `lab/.oculus/local.yml` and for `cfg/local.yml`, none for `x/local.yml`, and the generated schema has `port` as `integer`, `accounts` as a list with `tool` limited to `claude` and `codex`; `machineValues` over cases 10 and 12 gives the lines below.

```
primary a + hub b, a sets port: abc, history: ../h, 2 calendars, wos_key + mailto; b sets accounts, 1 calendar, hpc_host:
  values: port "8790"; hpc_host "hpc"; claude_bin "/bin/c"; history "<scratch>/h"; literature.mailto "me@x.org";
          accounts "{ tool: claude, dir: /x, label: other } (b)";
          calendars "{ provider: google, label: one } (a)\n{ provider: google, label: two } (a)"
  hubs:   accounts [b]; calendars [a]      (no entry for literature.wos_key)
no primary, hub b: accounts and calendars from b, hubs [b]
```

# 5. Files (from `diff -rq D70-base/tools/oculus D70/tools/oculus`)

Source (55): modified `src/lib/data/file-ops.ts`, `data/prose/text-edits.ts`, `data/snapshot/references/build.ts`, `data/sources/config/catalog/options.ts`, `catalog/schemas/engine.ts`, `catalog/schemas/references.ts`, `config/local.ts`, `config/machine.ts`, `sources/config.ts`, `sources/deck/files.ts`, `server/content/deck/read.ts`, `server/edit/writes/config/lists/deck/deck-undo.ts`, `edit/writes/file-undo.ts`, `edit/writes.ts`, `files/fs/lsp-edit.ts`, `fs/ops.ts`, `fs/replace.ts`, `files/fs.ts`, `source/source-bytes.ts`, `source/source.ts`, `workspace/oculus-config.ts`, `git/git-index.ts`, `git/git-routes.ts`, `machine/lsp/adapters/asks.ts`, `markdown/answers.ts`, `markdown/backticks.ts`, `markdown/diagnostics.ts`, `markdown/places.ts`, `held/answers.ts`, `held/diagnostics/published.ts`, `held/held.ts`, `held/oculus.ts`, `held/requests/links.ts`, `library/rules.ts`, `relay.ts`, `servers.ts`, `runs/lint/routes.ts`, `lint/writing/folder.ts`, `state/shared/answers/answers.ts`, `state/sources/fs-transport.ts`, `fs.svelte.ts`, `state/system/config/config-files.ts`, `groups.ts`, `rows.ts`, `state/system/machine/lsp/edits.ts`, `views/sources/source/language/lsp.ts`, `views/system/workbench/Settings.svelte`, `settings/Item.svelte`, `src/routes/api/(files)/fs/+server.ts`, `(files)/ops/+server.ts`, `(git)/git/+server.ts`, `(machine)/lint/+server.ts`; added `server/root/process/context/machine-values.ts`, `server/machine/lsp/adapters/yaml/private-file.ts`; deleted `server/machine/lsp/adapters/yaml/machine-file.ts`.

Config (5): `config/catalogs/options.yml`, `config/text/server.yml`, `config/text/views/sources/files.yml`, `config/text/views/sources/source.yml`, `config/text/views/system/workbench.yml`. Docs (2, not in the base copy; edited): `HELP.md`, `DESIGN.md`.

Tests (22): `tests/routes/edit/write-fixture.ts`, `routes/files/file-undo.test.ts`, `routes/files/fs.test.ts`, `routes/files/history.test.ts`, `routes/git/untracked.test.ts`, `routes/hubs/hub-secrets.test.ts`, `routes/hubs/hub-writes.test.ts`, `routes/hubs/machine-answer.test.ts`, `routes/replace/lsp-edit.test.ts`, `routes/replace/ops-replace.test.ts`, `routes/replace/replace-fixture.ts`, `routes/replace/writing-fix.test.ts`, `server/files/ops-fixture.ts`, `server/files/ops-paste.test.ts`, `server/files/workspaces.test.ts`, `server/git/untracked/trash.test.ts`, `server/machine/lsp/adapters/hub-keys.test.ts`, `markdown-requests.test.ts`, `server/machine/runs/lint/lint-fixture.ts`, `state/sessions/served-roots.client.test.ts`, `state/sources/workspaces-real.test.ts`, `state/system/settings/machine-section.test.ts`.

Outside the write list: none. Nothing under `.oculus`, `secrets`, `~/.oculus`, `feeds`, `projects`, `registries`, `funding` was touched; no real `local.yml` was opened (`vite.config.ts` itself reads the real workspace's `local.yml` through `devPort()` when vitest starts, which is existing infrastructure).

# 6. Tests per guarded entry

No test was added in this step. A new row for the schema of `local.yml` has no entry to go in: `grep -n 'engineSchemas\|schemas/engine\|local\.yml' agents/guarded.md` hits only G3 (lines 13-15), which is about the guard and not the schema. Values get no test, per the brief. Orchestrator rewrites `agents/guarded.md` at landing; its G3 Code line still names `adapters/yaml/machine-file.ts`, now `private-file.ts` with only `isPrivateFile`.

Deleted (G3 test lines and the rows the brief lists):
- `tests/server/files/ops-paste.test.ts`: `refuses every change to the file and to the folders holding it (case 24)` (a `describe.each` over both files).
- `tests/server/git/untracked/trash.test.ts`: `refuses a hub's .oculus/local.yml, which the Files view never touches`; `refuses oculus's own config/local.yml, in a folder of the workspace that holds it`.
- `tests/routes/files/file-undo.test.ts` (whole `describe('what an undo is held to')`): `never trashes a hub's .oculus/local.yml, even when a record names it`; `never trashes oculus's own config/local.yml, listed through %s, even when a record names it` (two cases).
- `tests/routes/files/history.test.ts`: `never copies a hub's .oculus/local.yml, reached through %s` (two cases); `never copies oculus's own config/local.yml, reached through %s` (two cases).
- `tests/routes/replace/ops-replace.test.ts`: `refuses protected for the machine's local file of a hub, which it never opens`, and the shared `refusesOculusLocal` use (two cases `refuses protected for oculus's own config/local.yml, reached through %s`).
- `tests/routes/replace/lsp-edit.test.ts`: the same two titles.
- `tests/routes/replace/writing-fix.test.ts`: `never lists a hub's .oculus/local.yml, which the plan never reads`; `never lists oculus's own config/local.yml, which the plan never reads`; `refuses protected for a hub's .oculus/local.yml and writes nothing to it (G3)`; `refuses protected for oculus's own config/local.yml and writes nothing to it (G3), reached through %s` (two cases).
- `tests/routes/hubs/hub-secrets.test.ts`: `keeps oculus's own config/local.yml from the language server relay, under any spelling`.
- `tests/server/machine/lsp/adapters/markdown-requests.test.ts`: three entries of the `readFile` `is refused for %s` table (a hub `local.yml` through a root over its `.oculus`; oculus's `config/local.yml` through a root over its folder; the same through the hub folder).
- `tests/routes/replace/replace-fixture.ts`: helpers `refusesOculusLocal`, `OCULUS_LOCAL_ROUTES`, `plantOculusLocal`, the `dot` and `peer` roots and `config` (no caller left).

Renamed: `markdown-requests.test.ts`: `lists no hub local.yml when yml is an extension, and no ~/.oculus file` to `lists no ~/.oculus file in the home folder` (its `dot` and `oculus` assertions removed, the home assertion kept); `machine-answer.test.ts`: `names the keys the primary sets and the default of each key, and holds no value of the file` to `names the keys the primary sets and the default of each key`.

Edits to existing assertions (from `diff` of each file):
- `machine-answer.test.ts`: the target is built with `machineValues(read.config, read.set, defaults)` spread into `machine`; removed `expect(text).not.toContain(PORT)` and `expect(text).not.toContain(CLAUDE)` from the first row (the answer now carries values). Header comment reworded. The second row keeps `expect(text).not.toContain(CLAUDE)`. Not run against the old assertions on the new tree.
- `hub-secrets.test.ts`: import from `private-file.ts` (only `isPrivateFile`); in `is withheld from the library rules ...` the three lines `toContain(`${hub}/.oculus/local.yml`)`, `toContain(`${lab}/.oculus/local.yml`)`, `toContain(join(configDir(engineDir()), 'local.yml'))` became `toContain(configDir(engineDir()))`.
- `markdown-requests.test.ts`: `readDirectory` expected `['.oculus','README.md','docs','oculus']` became `['README.md','docs']` (the fixture no longer plants `.oculus` and `oculus/config`); fixture roots `dot` and `oculus` and `config` members removed.
- Compile-only: `write-fixture.ts`, `ops-fixture.ts`, `hub-writes.test.ts`, `file-undo.test.ts` fixture, `replace-fixture.ts`, `hub-keys.test.ts` (`config` member removed); `lint-fixture.ts` (`isProtected` removed); `untracked.test.ts`, `trash.test.ts` (`guard` removed); `fs.test.ts`, `workspaces.test.ts`, `workspaces-real.test.ts`, `served-roots.client.test.ts`, `hub-secrets.test.ts`, `machine-section.test.ts` (`values: {}, hubs: {}` added to the machine state; header comment of `machine-section.test.ts` reworded).

Rows that stay: save and create key check (`tests/checks/source/keys.test.ts`), `app-private.test.ts`, `config-value.test.ts` and `config-key.test.ts` refusals, the literature route "never answers a key", `library.test.ts` `drops a file under the engine config folder`, the private-folder rows of `hub-secrets.test.ts`.

Failing line on the unchanged tree: this step adds no test and changes assertions only as listed above; none was run on the unchanged tree.

# 7. Judgment calls

1. Literature masking (the coordinator's ruling replaces brief decision 5 and item 3's literature part). Function `masked(key)` and list `MASKED_KEYS` (`literature.wos_key`, `scopus_key`, `scopus_insttoken`, `openalex_key`, `semantic_scholar_key`, `ncbi_key`) are in `src/lib/server/root/process/context/machine-values.ts`, used inside `machineValues` where the values map is built. That is the one place to change to undo it. The six keys have no entry in `values` and are not in the `GET /api/fs` answer (checked on a scratch file holding `wos_key: SECRETKEY123`: the answer's `values` and `hubs` do not contain it); the row shows the existing "Set in <hub>" line, or the default when unset. `literature.mailto` shows its value. HELP.md line 463 ("never in an answer") stays and is true.
2. Extra wire member `hubs` (key to hub names, only for `accounts`, `calendars`, `mail`) beside `values`: item 3 needs the hub of each row to offer the Edit control per hub, and the brief names `values` only. Rows of a joined list are one string per key with line breaks between rows. The orchestrator may reverse this.
3. The `local.yml` catalog section carries `control: number` and `whole: true` on `port` and `fields` on `accounts`, `calendars`, `mail`. The schema is built from the catalog and, with every local entry a plain text, `port: 8800` would have been marked as a wrong kind. The Settings rows still use `help` and `section` only. The header comment of `options.yml` and `CatalogEntry` in `catalog/options.ts` say so. The label rule (lowercase letters, digits, dashes) is not in the schema, since it needs a new form in the catalog vocabulary; the reader and the save check catch it.
4. `localRule()` in `schemas/engine.ts` uses `every: ['.oculus/local.yml']`, so the schema governs that path at the top of any served root, whether or not the root is a hub, besides `engine: ['local.yml']` for oculus's own config folder.
5. `adapters/yaml/machine-file.ts` renamed to `private-file.ts` (it only holds `isPrivateFile` now).
6. Parameters whose only use was the machine-file guard are removed: `FilesTarget.config`, the `config` parameter of `filesTargetOf`, `OpsTarget.config`, `Reach.config`, the relay's `#config()`, and the `config` member through `OculusContext`, `HeldHost`, `Publishing`, `Answering`, `ServerAsk`, `DiagnosticView`, `PageView`.
7. The watcher `watch/local.ts` is unchanged: the scratch run on the unchanged tree and the reading of `follow.ts` and `context.ts` show the edit is heard after a rename away and back and after delete and recreate, and a folder becoming or ceasing to be a hub rebuilds the watch.
8. Value rule in `machineValues`: a key the primary's file does not set has a value only when it differs from its default (a started key held at its running value); a key it sets always has one; a set key whose value does not read gets its default text as the value in force. The joined lists have lines only when some hub's file holds a row.
9. `PROGRAM_KEYS`, `STATE_PATHS`, `LITERATURE_KEYS` are exported from `local.ts` (and `config.ts`) so `machineValues` and the reader use one table of keys and fields.
10. Not changed because still true: head comments of `machine-defaults.ts`, `watch/local.ts`, `context.ts` (line 242) and `model-search.ts`.
11. `lsp-edit`, `writing-fix` and `replace` reach a machine file through a root served over the `.oculus` folder (as the workspace lists it); through the hub root the path `.oculus/local.yml` is answered `outside`, by the existing rule against dot folders. That rule is not part of this step.
12. Comments rewritten (the paragraph rewritten, nothing else): `ops.ts`, `lsp-edit.ts`, `file-undo.ts`, `source.ts`, `lint/writing/folder.ts`, `adapters/markdown/places.ts`, `servers.ts` (YAML entry), `library/rules.ts`, `markdown/backticks.ts`, `oculus-config.ts`, `(git)/git/+server.ts`, `local.ts` (literature), `machine.ts` (`MachineRead.set`), `rows.ts` (`MachineState`, `LocalRow`, `localRows`), `groups.ts`, `Settings.svelte`, `Item.svelte`, `fs.ts`, `fs-transport.ts`, `catalog/options.ts`, `schemas/engine.ts`, `snapshot/references/build.ts`, `config-files.ts`, `lsp.ts` (views).

# 8. Visible changes (for the look at landing; none was drawn by me)

All in the Settings view, group This machine (`Item.svelte`, `List.svelte` unchanged):
- Before: each key showed its title, path and one line: "Set in <primary>." or "Not set in the primary hub. The default is X." Now the same line, plus, when the key has a value in force, "The value in force:" and the value (one `code` item per line for `accounts`, `calendars`, `mail`, each "{ provider: google, label: one } (hub)").
- For a joined list, the status line reads "Set in <hub>, <hub>." (the hubs holding rows), and under it one button "Edit .oculus/local.yml of <hub>" per hub that holds a row; a hub with no folder of this workspace shows "<file> can be opened once a folder of this workspace holds it."
- With no primary hub, the section note now reads: "This workspace has no primary hub, so no file sets a key that has one value here and each of them shows its default; the lists of accounts, calendars and mail show the rows of every hub's file."
- The six literature secret keys show "Set in <hub>." and no value; `literature.mailto` shows its value.
- The group's own Open control for the primary's `.oculus/local.yml` is unchanged.

Outside Settings: the Files view, Replace, lsp-edit and the other operations now treat `local.yml` as any file; the source tab for a `local.yml` gets YAML server diagnostics and hover from the new `config/local` schema.

# 9. Anything wrong or impossible in the brief

Nothing found wrong. Two notes: the brief's "decision 5" is replaced by the coordinator's masking ruling (section 7, item 1); and the brief's item 3 asks for `values` only, while the per-hub Edit control needs the hub names, hence `hubs` (section 7, item 2).
