# Brief check of D70 (oculus/migration), read on main at 4e919e328

Read: the brief `tools/oculus/.scratch/migration/agents/briefs/D70.md` (126 lines), `plan.md` (the Goal, `^- D70` at :773, Rulings at :830, `Open item 61` at :1834), `agents/spec.md` (104 lines), `agents/guarded.md` G3 (:13-15), G49 (:34-36), G77 (:55-57), G8 (:61-63) and G13 (:170-172), and the tree under `tools/oculus/`. I changed nothing. I opened no `local.yml` file. `ls tools/oculus/config/` shows there is no `config/local.yml` in this checkout.

## 1. Names

`grep -rl -E "protectedFiles|holdsProtected|isProtected|historyRefusal|isMachineFile|namesMachineFile|machineFilesOf|isWithheldFile|withheldFolders|MachineState|localRows|refused_protected|lsp_edit_protected" .` (node_modules, .agents and .git excluded) finds hits only in `tools/oculus/src`, `tests`, `config/text` and `DESIGN.md`, which the write list covers, and in `tools/oculus/.scratch/migration/`. `grep -rln '`protected`'` outside the write list finds only `.scratch/migration/choices.md` and `agents/guarded.md`.

1. The hits outside the write list:
   - `.scratch/migration/plan.md:260`, `orchestrator-history.md`, `choices.md`, and the older briefs and reviews (`D68.md`, `D68-refuter.md`, `Q88c*` and others). These are logs. The change makes no rule in them false, and they are not rewritten.
   - `agents/guarded.md:14` names `src/lib/server/machine/lsp/adapters/yaml/machine-file.ts`, which the brief renames. `:15` names the test titles "refuses `protected` ...". The change makes both false. Item 5 gives this file to the orchestrator at landing.
   - `grep` for the same names in G13's lines (:170-172) finds nothing, so G13 is unaffected.
2. Hits inside the write list that "What is on the tree" does not name. The builder has to change each one, and the brief does not list them.
   - `guarded`, `Guard` and the `guard` option:
     - `src/lib/server/git/git-index.ts:25,387-391,430-432` (`TrashInto.guard`, then `server.git.never_changed`).
     - `src/lib/server/git/git-routes.ts:34,207-212,390-394` (with no guard it answers `server.git.no_guard`).
     - `src/lib/server/files/fs/replace.ts:14,73,134,138,154` (the `guarded` option and `fail('protected')`).
     - `src/lib/server/files/fs/lsp-edit.ts:45` (the `guarded` option).
     - `holdsProtected` at `ops.ts:393`. It is also used for create (:436) and delete (:525), which the brief does not name.
   - `isProtected`: `src/lib/server/machine/runs/lint/routes.ts:80,333` and `tests/server/machine/runs/lint/lint-fixture.ts:124,148`.
   - The word `protected` on the page:
     - `src/lib/data/file-ops.ts:84,106` (the `OpsRefusal` type and its list).
     - `src/lib/state/shared/answers/answers.ts:34-35` (`files.refused_protected`).
     - `src/lib/state/system/machine/lsp/edits.ts:255,305,385` and `src/lib/data/prose/text-edits.ts:224`.
     - The catalog lines `config/text/views/sources/files.yml:213` and `config/text/views/sources/source.yml:149`.
   - Catalog keys used only by the guard: `config/text/server.yml:230` (`never_changed`) and `:233` (`no_guard`). Once the guard goes they have no reader. The brief's sentence "every sentence of `config/text/` that only that word used" covers only the word `protected`, not these two keys.
   - `MachineState` and its wire shape:
     - `src/lib/server/files/fs.ts:100-109,179-180` (`MachineAnswer`, commented "Never a value of a file").
     - `src/lib/state/sources/fs-transport.ts:61`, `src/lib/state/sources/fs.svelte.ts:517` and `src/lib/state/system/config/groups.ts:255` (the defaults `{ set: [], defaults: {} }`).
     - `src/lib/views/system/workbench/Settings.svelte:193-197` (builds `MachineState` from `set` and `defaults` only) and its head comment `:30-31`.
     - `src/lib/views/system/workbench/settings/Item.svelte:195-205` (draws the local row).
   - Tests that assert what the change ends but are not in G3's Test line. None of them is named anywhere in `guarded.md` (`grep -n "machine-answer\|machine-section\|hub-secrets" agents/guarded.md` finds nothing).
     - `tests/routes/hubs/machine-answer.test.ts:52` ("holds no value of the file", `expect(text).not.toContain(PORT)`). The change makes this false.
     - `tests/state/system/settings/machine-section.test.ts` (the `MachineState` shape).
     - `tests/routes/hubs/hub-secrets.test.ts:30,125-139` (`isMachineFile` and `withheldFolders` holding the machine files).
     - `tests/routes/replace/replace-fixture.ts:7,109-127` (the shared row "refuses `protected` for oculus's own config/local.yml, reached through %s").
3. `isWithheldFile` has no hits in `tests`. `config-files.ts` already exports `isPrivateFile` (:52-66), so after the change `isWithheldFile` duplicates it. "Becomes the private-file check" should read "is removed, and its caller `lsp.ts:134` calls `isPrivateFile`".

## 2. The step line

Line 773: "every hub's `.oculus/local.yml` and oculus's own `config/local.yml` open, show, save (with the key check), paste, trash, undo and keep history like any file, the "This machine" section shows each key's value, and G3 keeps only its `secrets` and `~/.oculus` clause".

1. Each part of the line and the requirement that serves it:

| Part of the line | Served by |
|---|---|
| Open, show | Item 1 |
| Save (with the key check) | Item 1 (the key check of `source.ts:159` stays); case 2 |
| Paste | Item 1; case 3 |
| Trash | Item 1; cases 3, 7, 13 |
| Undo | Item 1; case 1 |
| Keep history | Item 1 (`historyRefusal`); case 1 |
| Shows each key's value | Item 3; cases 10, 11 |
| G3 keeps only its `secrets` and `~/.oculus` clause | Item 5 and decision 4 (the orchestrator rewrites `guarded.md`) |

2. "oculus's own `config/local.yml`" is named by the line, but no case exercises it. All 13 cases use a hub's `.oculus/local.yml`.
3. The last part conflicts with decision 4. Decision 4 "keeps the literature key rule beside the secrets clause of G3". The line says G3 keeps only the `secrets` and `~/.oculus` clause.
4. Parts with no requirement: none. Items 4 (the docs) and 5 (the tests) support the line.

## 3. Premises

`grep -rn "isMachineFile\|namesMachineFile\|machineFilesOf" src` and `wc -l` reproduce the call sites and the counts `ops.ts 852`, `source.ts 348`, `servers.ts 877`. These lines are confirmed: `source.ts:159,201`, `source-bytes.ts:54-55,73`, `servers.ts:684,801`, `places.ts:40`, `rules.ts:48`, `private.ts:56`, `config-checks.ts:140`, `config-value.ts:166,228`, `file-undo.ts:197-199`, `deck-undo.ts:47-48`, `git/+server.ts:31`, `lint/+server.ts:27-28`, `folder.ts:210`, `lsp-edit.ts:14`, `config-files.ts:73`, `lsp.ts:134`, `rows.ts:100,358`, `fs/+server.ts:26-29`, and `context.ts:567` (`machine: machine.values`). G3 is at `guarded.md:13` and its Test line at `:15`. The following premises are wrong or incomplete.

1. `ops.ts` line uses are mislabelled. The brief says `ops.ts:672,686,734,832` are "(paste, upload, trash, rename, replace)". The source (`sed -n 655,852p ops.ts`) shows:
   - :672 is replace.
   - :686 is `lsp-edit` and `writing-fix`.
   - :734 builds the scope that every operation reads: create (:436), rename (:467,478), trash and delete (:525), paste (:578,581) and upload (:630).
   - :832 is the Replace Preview.
2. `saveBytes`'s caller: `document.ts:17` is the import. The call is at `:89`.
3. `config-key.ts:119` is the by-name check `if (file === LOCAL_NAME)`, not `isMachinePlace`. `isMachinePlace` is used at :127 only.
4. Item 1 assumes the YAML server has a schema check, hover and completion for the machine file. `src/lib/data/sources/config/catalog/schemas/engine.ts:5-6` says "`local.yml` is a hub's own and has no schema", and `:84` has `if (file === LOCAL_NAME) continue;`. `grep -rn "local" src/lib/data/snapshot/schema/` finds no rule for `.oculus/local.yml`. With the refusal removed, the YAML server gets the file but has no schema for it. The brief does not name building one.
5. The verify list contradicts the kept key check. Verify item 5 says `grep -rn "namesMachineFile" src` must print nothing. The key check the brief keeps (`localRefusal`, `source.ts:158-161`) calls `namesMachineFile`, and `createFile` (`source.ts:251,267`) relies on it: it checks a `local.yml` that the source tab creates where none exists yet (`machine-file.ts:59-65`, "a path with nothing at it ... which a write would create"). Switching to `isMachineFile` silently drops the key check for a newly created file.
6. "The Test line lists the rows that assert the refusals this step ends" is incomplete. See check 1, finding 2: `machine-answer.test.ts:52`, `hub-secrets.test.ts:125-139` and the shared row in `replace-fixture.ts:121`.
7. "What stays closed": the custom editor's save of a machine file never reaches `saveBytes`'s `readonly`. `document.ts:85-86` calls `editorOf`, and `editorOf` calls `checkOpen` (`document.ts:41-51`). `checkOpen` answers `closed` first, for the dot segment and for `isPrivate` (`reach/open.ts:36,50` in `sed -n 100,162p`). The `readonly` at `source-bytes.ts:73` is a second line of defence that no request reaches.

## 4. Cases against spec.md

1. Item 5 conflicts with spec's test rule ("A test exists only as the test of one entry ... A step that needs a new entry stops and asks Axel"). Item 5 asks for tests of the new values "G13's readers and the Settings rows need". G13 (:170) is about wrong values being refused with a finding, not about values being shown. `grep -n -i "settings view\|This machine" agents/guarded.md` finds nothing, so no entry covers the Settings rows. The tests item 5 asks for therefore need a new entry, which is Axel's decision. The existing `machine-section.test.ts` and `machine-answer.test.ts` are outside every entry as well.
2. The brief says "Every other case is checked by a run the report quotes". For a case only a page shows, spec says it "is checked by reading and by the unit-level runs that reach it, and its row in the report names the look on landing". Case 10's "Open file opens the file" and the drawn rows of cases 10 and 11 are such cases.
3. Verify item 2 quotes a stricter ASCII command than spec's gate (spec has no exception for an accented letter under `config/`). It has no effect today: `LC_ALL=C grep -rln '[^ -~]' config/text HELP.md DESIGN.md README.md docs` prints nothing.
4. Cases that check a place the step does not change: case 8 (the app reach, `private.ts` and `open.ts`), case 9 (the Settings writers), case 12 (the literature route) and the unchanged half of case 2. Each is a regression guard on a kept closure. None tests the step's change.

## 5. Could each check pass without the goal being reached?

1. The step line names no check of its own. The brief's verify item 5 could pass without the goal. It greps only the guard names, so all of these would still pass it:
   - a `LOCAL_NAME` or `LOCAL_PATH` check elsewhere (`deck/read.ts:68`, `deck/files.ts:56`, `oculus-config.ts:22,30`, `engine.ts:84`, `config-files.ts:43,82`);
   - a missing local.yml schema;
   - the search skipping the file.
2. Item 4's line-based grep misses sentences that break across comment lines or are worded without "local.yml":
   - `Settings.svelte:30-31` ("the machine's own / file is listed from the catalog alone and its text is never read").
   - `fs.ts:102-103` ("Never a value of a file").
   - `rows.ts:97-98` ("No value of the file is among it"). The brief names this one, but the grep does not find it.
   
   A grep for "never read\|no value\|never a value\|never their values" would close the gap.
3. Case 1: tests the goal (the history copy and the undo).
4. Case 2: passes on the unchanged tree. It is a regression guard.
5. Case 3: "copy a file and paste it over" describes no operation. A copy onto a taken name takes a free name (`ops.ts:39`, `585-590`). Only a move or an upload with `replace: true` (`ops.ts:594-599,632-636`) goes over a file. A copied file lands as `local copy.yml`, and the case would read as passed. The rename and trash parts test the goal.
6. Case 4 cannot pass even with the goal reached. The search passes no `--hidden` (`src/lib/data/helpers/search/query.ts:168-178`), and `HELP.md:336` says hidden folders and ignored files are skipped. The hub's `.gitignore:166` names `/.oculus/local.yml`. A workspace search never lists the file.
7. Case 5 cannot pass even with the goal reached: there is no schema (premise 4).
8. Case 6 cannot pass as written. `filesUnder` skips every folder whose name starts with a dot (`writing/folder.ts:137-141`), so a Fix All over the hub's folder never enters `.oculus/`. The existing test reaches the file through a workspace folder `dot` over `.oculus` (`writing-fix.test.ts:98-104`).
9. Case 7 passes on the unchanged tree. The guard compares device and inode, so a copy of `local.yml` (a different inode) was never refused. It does not test the step. Testing it needs the machine file itself untracked, or a folder that holds it. One instance: `git check-ignore -v --no-index tools/oculus/config/local.yml` exits 1, so oculus's own file is not ignored.
10. Case 8: the expected `readonly` is wrong. The save answers `closed` (premise 7). The case passes before and after the step, so it tests no change.
11. Cases 9 and 12: pass unchanged. They are regression guards.
12. Case 10:
    - "`accounts` shows ... the default rows of the primary as the server joins them" is wrong. `src/lib/data/sources/config/machine.ts:113-126` uses `defaults.accounts` only when no hub sets `accounts`. When the second hub sets one row, the joined list is that row alone.
    - `machine.set` lists only the primary's keys (`machine.ts:142`). A values map that is driven by `set` would show the default for `accounts`, so the case does test the join.
13. Case 11: tests the goal (`withHeld` at `process/context/machine.ts:61-71`).
14. Case 13: tests that the folder chain is removed.
15. Item 3's "a scalar key shows its value as written" cannot come from `server.machine()`. That holds resolved values: `localPath` expands `~/` and resolves relative paths (`local.ts:200-206`), and `port` is a number. Either "as written" or the source changes.

## 6. Implied inputs

Each is missing from "Cases" unless said otherwise.

1. **Literature keys are secrets** (`literature.wos_key`, `scopus_key`, `scopus_insttoken`, `openalex_key`, `semantic_scholar_key`, `ncbi_key`). `server.machine()` holds them (`LocalConfig.literature`), and `machineDefaults` lists them as rows (`machine-defaults.ts:22-30,66`). Item 3 ("each key the server holds a value for") would send them in the `GET /api/fs` answer and draw them in Settings. That contradicts:
   - `local.ts:136-137`: "A value is never served to a page or written to a log."
   - `HELP.md:463`: "never in an answer".
   
   **Cost:** a key drawn on screen and carried in every page's workspace answer. Expected result to state: these rows show "set" or the default, never the value (`mailto` may show). This is a user-visible shape the brief does not name, so it is a decision for the orchestrator or Axel.
2. **A source-tab create of a new `.oculus/local.yml` with `port: abc`.** Expected: refused with the sentence naming `port`, as today. This is at risk from verify item 5 (premise 5).
3. **A write other than the source save whose result holds a key that does not read**: paste or upload with replace, Replace All (case 4 replaces the key name `claude_bin` itself), a language-server rename, a writing fix, an undo. Expected: written, with the machine read's finding naming the key and the default taking over. The brief should say the key check covers the source-tab save only.
4. **No primary while a non-primary hub sets `calendars`, `mail` or `accounts`.** `readMachine` still joins those rows (`machine.ts:113-138`). Expected: the joined rows show (the value in force, decision 2), not "every default". Today's text at `DESIGN.md:618` says "with no primary every key shows its default".
5. **A value that does not read** (for example `port: abc` set by hand or by paste). The key is in `set` but the default is in force. Expected: the row shows the default, the value in force; the brief should say what the "set in" line shows.
6. **A joined list with a repeated label.** `joinRows` drops the later row and adds a problem (`machine.ts:49-75`). Expected: only the rows in force show.
7. **A one-per-oculus key set by a non-primary hub** (problem kind `other-hub`). Expected: the primary's value or the default.
8. **The open-in-editor for a key set nowhere, for a joined key set by two hubs, and with no primary.** No expected result is stated. `machine-section.test.ts:53-63` opens nothing with no primary today.
9. **A workspace folder over a hub's `.oculus`.** This is the only way the Fix All (case 6) reaches the file. It should replace case 6's setup. The search is still blocked by `.gitignore`.
10. **Oculus's own `config/local.yml`.**
    - When oculus's folder is a workspace folder, the file is untracked and not ignored (check-ignore exit 1), so a Discard of all untracked files now moves it to the Trash.
    - When oculus's folder is not a workspace folder, no IDE operation reaches it.
    - No case covers either.
    - It also has no YAML schema (`engine.ts:84`).
11. **Trash of oculus's `config/` or of oculus's own folder** when a workspace folder holds it. The ancestor chain of `protectedFiles` refused this before (`ops.ts:379-383`). Decision 1 allows it. The expected effect on the running server is not stated.
12. **Case 13, the Trash and restore of a hub's `.oculus`.**
    - That folder holds `workspaces/`, `apps/`, `bookmarks.yml` and `notes/` (`HELP.md:452`), so the trash takes the open workspace file with it.
    - The local.yml watcher watches the `.oculus` folder (`watch/local.ts:11-16,63-74`) and skips a folder that does not exist when the watch is made.
    - Whether edits are heard after a restore is not verified. If they are not, the machine values stop updating until a workspace move or a restart.
    - The case's expected result covers only "done and undoable".
13. **A machine file reached through a link or another spelling.** The key check stays by inode. Every other operation now treats the file like any other. This costs nothing and needs no case.
14. **`history` set to a folder inside a git-tracked hub.** The new history copies of a `local.yml` holding literature keys would land in the repository. This has not happened as far as I checked (not verified). Low likelihood.

## 7. ADRs

1. `ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both. `find . -type d -iname adr` (node_modules filtered) prints nothing. There is no ADR folder.

## 8. Dictated text

1. `grep -n '"[^"]*"' D70.md` finds no catalog line or other product text dictated word for word.
2. The one dictated literal is the report's first line, "Everything in the brief is done" (`D70.md:118`). It holds: spec.md "Report" uses the same words.

## Other findings

1. Places that single out the machine files or `local.yml` that the brief does not name:
   - `src/lib/server/files/workspace/oculus-config.ts:4-5,22,30`: the read-only config route answers 404 for any path holding `local.yml` and drops it from listings.
   - `src/lib/server/content/deck/read.ts:62-68`: drafts of a `local.yml` are left out.
   - `src/lib/data/sources/deck/files.ts:55-56`: a deck never reads a `local.yml` in any root, by basename.
   - `src/lib/data/sources/config/catalog/schemas/engine.ts:5-6,84`: no schema.
   - `src/lib/data/snapshot/references/build.ts:9` and `schemas/references.ts:111-112`: the reference index never reads `.oculus/local.yml`, so a hub-key rename never edits it.
   - `src/lib/server/machine/lsp/adapters/markdown/backticks.ts:11`: the head comment; the code follows `withheld`.
   
   The brief should say for each whether it stays.
2. The catalog sentence `lsp_edit_protected` ("{0} is protected on this machine or read-only ...") is also the refusal for a read-only draft (`edits.ts:385`). Item 1 would remove sentences "only that word used", but this one has to be reworded rather than removed.
3. Parameters that lose their only purpose: `Reach.config` (`markdown/places.ts:14-18`), the relay's `#config()` (`relay.ts:684-686`), and `OpsTarget.config` in `ops.ts` (used by `protectedFiles` and `previewed`).
4. Decision 4 moves the app clause to G49. The custom editor's save belongs to G77, whose Code line names `document.ts`. No test asserts `saveBytes`'s `readonly` for a machine file: `grep -rln saveBytes tests` finds none, and `app-document.test.ts` has no `local.yml` row.
5. Guards whose removal would expose a secret to a third party: I found none.
   - The YAML server runs with `schemaStore: { enable: false }` (`yaml/settings.ts:12`) under `--permission` (`servers.ts:672,786`).
   - The writing rules are local (`grep -rn "claude\|fetch(\|https://" lint/writing/` finds nothing).
   - The Trash and the search are local.
   - The app closure stays.
   
   What the removals do expose: the literature keys on the page through the Settings values (Implied input 1), and copies of the file, keys included, in the file history on local disk.

## Declined to judge

1. Whether the local.yml watcher survives a Trash and restore of `.oculus` (Implied input 12). Settling it needs a run against a real watch, which a read-only check does not do.
2. Whether any page state carrying `workspaces().machine` is persisted or logged beyond the `NO_STORE` answer. I traced it to `fs.svelte.ts:517` and `Settings.svelte:195-196` only.
3. Whether ripgrep would list a gitignored file through a workspace folder over `.oculus`. This rests on ripgrep's parent-ignore behaviour, which I did not run.
4. The look of the Settings rows. That is the look on landing.

Usage: agent ab416c65c5e0a57d7, claude-opus-5-5, 261,895 tokens, 102 tool uses, 12.4 min.
## Closed

Each finding closed in `agents/briefs/D70.md` before the preparation commit.

- 1.1: logs not rewritten; `guarded.md:14-15` is rewritten by the orchestrator at landing (item 5).
- 1.2: every hit is named under "What is on the tree" (the `guard` chain in `git-index.ts`, `git-routes.ts`, `replace.ts`, `lsp-edit.ts`, `holdsProtected`, `lint/routes.ts`, the page's `protected`, `server.yml:230,233`, the `MachineState` wire, the tests outside G3), and item 1 and item 5 say what happens to each.
- 1.3: `isWithheldFile` is removed and `lsp.ts:134` calls `isPrivateFile` (item 1).
- 2.2: cases 7 and 8 exercise oculus's own `config/local.yml`; decision 6.
- 2.3: plan.md's D70 line corrected: G3 keeps the literature route's row with its secrets clause; decision 4 rewritten to match.
- 3.1, 3.2, 3.3: the `ops.ts`, `document.ts` and `config-key.ts` lines corrected.
- 3.4: item 1 gives `local.yml` its schema through `engineSchemas`; case 5 now passes only when it is built.
- 3.5: `namesMachineFile` stays for the save's and the create's key check; verify item 5 rewritten; case 2 adds the create.
- 3.6: the tests outside G3 are named; item 5 says what happens to each.
- 3.7: item 2 says `saveBytes`'s `readonly` sits behind `checkOpen`; the app's save case is dropped, since it checks nothing the step changes.
- 4.1: decision 7 and item 5: the values get no test, since no entry covers the Settings rows; the look checks them.
- 4.2: the Cases list says a page-only case is read and named for the look.
- 4.3: verify item 2 uses spec's command.
- 4.4: cases 8 (app), 9 (Settings writer) and 12 (literature route) of the first brief are dropped; case 2 keeps the key check, which the step's edits of `source.ts` reach.
- 5.1: verify item 5 adds the `LOCAL_NAME` grep; the further places are in item 1.
- 5.2: item 4's grep adds the wordings named.
- 5.5: case 3 uses move and upload with replace.
- 5.6: case 4 uses the ops replace request and states the search's skip as unchanged.
- 5.7: closed by 3.4.
- 5.8: case 6 runs through a workspace folder over `.oculus`.
- 5.9: case 7 uses oculus's own untracked `config/local.yml`.
- 5.10: closed by 3.7.
- 5.12: case 10 rewritten to the join `machine.ts:113-126` does, with a repeated label.
- 5.15: item 3 shows the value in force as `server.machine()` holds it.
- 6.1: decision 5: the literature keys show like every other value (ruling 61 (b); the file route already serves the same bytes to the same page; `/api/fs` is same-origin and app frames are not).
- 6.2: case 2. 6.3: case 9. 6.4: case 12. 6.5, 6.6, 6.7: item 3. 6.8: item 3, case 10. 6.9: case 6. 6.10: cases 7 and 8, decision 6. 6.11: case 14. 6.12: item 1's last bullet, case 13. 6.13: no case, as the report says.
- 6.14: not acted on: no `history` folder inside a repository has been seen; stated in the landing report.
- Other 1: item 1 drops each special case and rewrites `backticks.ts`'s comment. Other 2: `lsp_edit_protected` reworded, kept. Other 3: the parameters go with the guard (item 1). Other 4: item 2. Other 5: decision 5.
