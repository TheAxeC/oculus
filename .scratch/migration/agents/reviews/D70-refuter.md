# Step D70 refuter report (on .agents/worktrees/D70, base a0508758a)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

All commands were run from `tools/oculus` in the worktree, with Node v24.21.0 on PATH.

```
npm run diagrams            -> diagram hashes identical before and after (shasum docs/diagrams/*: DIAGRAMS-UNCHANGED)
npm run test:quick          -> ok prettier, ok ASCII gate, ok eslint, ok svelte-kit sync,
                               ok svelte-check (481 FILES 0 ERRORS 0 WARNINGS),
                               ok vitest (40.4 s)
                               test:quick: 41.2 s (limit 45.0 s); every command passed
                               (not covered: tests/checks, slow tests; three changed slow files listed)
npx vitest run tests/routes/git/untracked.test.ts tests/routes/hubs/hub-writes.test.ts tests/server/git/untracked/trash.test.ts
                            -> Test Files 3 passed (3), Tests 25 passed (25)
LC_ALL=C grep -n '[^ -~]' <the 94 changed files, minus the deleted one>   -> nothing (exit 1)
spec.md's perl ASCII gate over src tests bin config  -> nothing ("bin: No such file or directory" from find)
sh utils/unused-exports.sh, then diff with D70-base/tools/oculus/unused-exports.txt -> no difference, 362 lines each
wc -l of changed sources -> largest servers.ts 872, relay.ts 870, fs.svelte.ts 825; Item.svelte 408, Settings.svelte 378
sh utils/folder-check.sh    -> nothing, exit 0
grep -rn "protectedFiles\|holdsProtected\|isProtected\|isWithheldFile\|refused_protected\|never_changed\|no_guard" src tests config/text -> nothing
grep -rn "isMachineFile\|namesMachineFile\|machineFilesOf" src -> machine-file.ts, config-checks.ts, apps/reach/private.ts, source-bytes.ts, source.ts only
grep -rn "LOCAL_NAME\|'local.yml'" src -> config-key.ts:119, config-checks.ts:253, config-value.ts:157, watch/local.ts:70, machine-file.ts, source.ts:44,162, config-files.ts, groups.ts, rows.ts, local.ts, merge.ts:105,335, catalog/options.ts:322, schemas/engine.ts (matches the report's list)
grep -rn "lsp_edit_protected\|yaml/machine-file\|isWithheldFile\|files.refused_protected" src tests config docs HELP.md DESIGN.md README.md -> nothing (report's claim reproduced)
```

The brief does not list the tree checks. I ran the ones that read the changed files (`npx vitest run tests/checks/config/config.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/arrangements.test.ts tests/checks/source tests/checks/tree tests/checks/diagrams tests/checks/imports`): 2 failed, 213 passed.
- `tests/checks/source/comment-width.test.ts` fails on six lines the step wrote: `src/lib/data/sources/config/catalog/options.ts:198`, `src/lib/data/sources/config/local.ts:137`, `src/lib/server/git/git-index.ts:395`, `src/lib/server/root/process/context/machine-values.ts:2`, `src/lib/state/sources/fs-transport.ts:46`, `tests/server/machine/lsp/adapters/markdown-requests.test.ts:4`. This is a red line of `npm run test:landing`.
- `tests/checks/config/config-folder.test.ts` 'names a group of its own and a path under the hub for every document' fails with "expected any number of assertion, but got none". It reads the hub layer's `docs:` list, which the step does not touch, so it is not counted as the step's.

Scratch probes, all on scratch hubs under the system temp folder with a scratch HOME. Each imports the worktree's modules with Node's type stripping:
- Ops (`handleOps`, with a trash function that renames into a scratch Trash):
  - rename `.oculus/local.yml` away and back: 200 each;
  - paste move of `spare/local.yml` over it with replace: 200, the file now holds the moved text;
  - upload over it with replace: 200, the file now holds the uploaded text;
  - `replace` through the hub root `lab/.oculus/local.yml`: 200, the file is written;
  - `lsp-edit` through the hub root: 400 `outside`; through a root over `.oculus`: 200;
  - trash of the file: 200; trash of the `.oculus` folder: 200.
- Watch (`createWorkspace` and `watchLocal`, composed as `context.ts:786-795` composes them): after the trash of `.oculus` the hubs drop to 0; after the restore they are 1 again and the watch is rebuilt; an edit of the restored `local.yml` is heard (heard 1) and `readMachine` gives the new value. A trash and restore inside one poll tick followed by an edit is heard too (heard 1).
- Values (`readMachine` and `machineValues`) over the case 10 and 12 files:
  - `values.calendars` holds the two rows of hub a with "(a)", and the repeated row of hub b is left out;
  - `values.accounts` holds b's row with "(b)";
  - `hubs` is `{accounts:[b], calendars:[a], mail:[b]}`;
  - `history: ../h` resolves to the hub's sibling folder;
  - no answer holds the planted `wos_key` value (holds secret: false);
  - with no primary only the three lists have values;
  - a held port of 8790 shows "8790".
- Schema (`optionsSchema` over the shipped `local.yml` catalog, checked with `createChecker`):
  - `port: abc` gives "/port must be integer";
  - `nope: 1` gives "must NOT have additional properties";
  - a mail row with `provider: ics` is refused;
  - `literature:` with an unknown key is refused;
  - valid files pass;
  - each property carries its help as `description`.

The worktree's `git status --short` holds the same 95 entries after the review as before it.

## Verdicts

Items of the brief's "What to build":

- 1: holds. Evidence: every guard is gone (the item 5 greps print nothing), `protected` is gone from `OpsRefusal`, `answers.ts`, `edits.ts`, `replace.ts`, `lsp-edit.ts` and `ops.ts`, `lsp_edit_readonly` replaces `lsp_edit_protected`, `historyRefusal` copies every file (`source.ts:194-202`), the servers refuse `isPrivateFile` only (`servers.ts:681,796`), `withheldFolders` is the config folder and the private folders (`library/rules.ts:43`), `engineSchemas` governs `local.yml` (`schemas/engine.ts:40-41,98`), and the reviewer's ops, schema and watch probes behave as the item says.
- 2: holds. `apps/reach/private.ts`, `source-bytes.ts:54-55`, `config-value.ts:157` and `config-key.ts:119` are unchanged, and their tests pass in test:quick.
- 3: violated. See Spec 1 (the Edit control and the "Set in" line leave out a hub that sets a joined key but has no row in force) and Standards 2 (the rewritten `local.ts` comment is false).
- 4: violated. See Standards 3 (`machine-file.ts:5-7` and `tests/server/files/ops.test.ts:3-4` still describe the removed guard).
- 5: holds. The rows the brief names are deleted, the kept rows pass, and no row was added. The report's list of kept rows names a wrong file (Proof 1).

Cases of the brief's "Cases":

- 1: met. The builder's run on the changed tree shows a save with one history copy. By reading, `historyRefusal` has no machine check and the history restore (`restoreCopy`, `file-undo.ts`) has no guard. The restore itself was not run by the reviewer.
- 2: met. `localRefusal`, `namesMachineFile` and the create check are unchanged (`source.ts:159-162`); the builder's runs give the sentence naming `port`.
- 3: met. The reviewer's ops probe: move over, upload over, rename away and back, and trash all give 200. Undo by reading: `file-undo.ts:192` checks only `served`.
- 4: met. The reviewer's probe writes the file through the hub root, and the builder's run writes it through a root over `.oculus`. Search is unchanged (`query.ts`, no `--hidden`).
- 5: met. The reviewer's schema probe gives diagnostics for an unknown key and a wrong `port`, and the help is in `description`. `refuses` is `isPrivateFile` only (`servers.ts:681,796`), and `secrets` and `~/.oculus` are still refused (the markdown-requests rows pass).
- 6: met. By reading, `folder.ts:204-207` has no `isProtected`; the builder's run lists `local.yml`. The secrets refusal rows of `writing-fix.test.ts` pass.
- 7: met. By reading, `git-index.ts:398-436` has no guard; the builder's run calls the trash, and the reviewer's run of the slow `trash.test.ts` passes.
- 8: met. By reading, `namesMachineFile` covers `config/local.yml` for the key check and `historyRefusal` copies it; the builder's run confirms it.
- 9: met. The reviewer's upload-over probe writes the file. The builder's `readMachine` run gives the `port` finding and the default.
- 10: partial. The values, the lines and the repeated row are as the case says (reviewer's probe). Missing: the Edit control and the "Set in" line for the second hub's file, which sets `calendars` but whose only row is a repeat (Spec 1).
- 11: met. The reviewer's probe shows a held running port, and `machine.ts` `values()` returns the held values (`withHeld`). Seen only by probe and reading, not on a switched server.
- 12: met. The reviewer's probe with no primary gives only the joined lists, each line naming its hub.
- 13: met. The reviewer's watch probe reproduces the composition at `context.ts:786-795`: the hubs change on trash and on restore, the watch is rebuilt, and an edit of the restored file is heard and read. Trash of `.oculus` is done, by the ops probe. Not run end to end against a server.
- 14: met by reading and the builder's `loadConfig` run. No guard is left on a folder, and the ops probe trashed a folder holding `config/`. The engine-level read after a restore was not rerun by the reviewer.

## 1. Spec

- `src/lib/server/root/process/context/machine-values.ts:93-98`: "`const held = rows.flatMap((row) => (row.hub === undefined ? [] : [row.hub])); ... hubs[key] = [...new Set(held)];`"
  - What is wrong: `hubs` is built from the rows in force after the join. A hub whose file sets `calendars`, `accounts` or `mail` but whose rows were all left out (a repeated label, as in case 10, or rows that do not read) is not in `hubs`. `Item.svelte:205-206,224-238` draws the "Set in" line and the Edit controls from `hubs`. The brief's item 3 says "for a joined key, the row offers it for the file of each hub that sets the key", and case 10 says "for `calendars` and `accounts` each hub file that sets it".
  - Failure scenario: the reviewer's probe over case 10 gives `hubs.calendars = ["a"]`. The second hub b sets a `calendars` row whose label repeats a's, so the Settings row says "Set in a." and offers no Edit control for b's file. That file holds the finding the reader needs to fix.
  - Verdict: item 3 violated, case 10 partial.
- `tests/routes/hubs/machine-answer.test.ts:41`: "`machine: { set: read.set, defaults, ...machineValues(read.config, read.set, defaults) },`"
  - What is wrong: the brief's item 5 says a test file named by no entry "is changed only as far as it needs to compile and pass". `values: {}, hubs: {}` compiles. Wiring `machineValues` in makes the test run the new function without asserting anything about it.
  - Failure scenario: a reader of the test sees `machineValues` exercised and takes the values as covered, while nothing checks them.
  - Verdict: none.

## 2. Proof

- Report section 6, "Rows that stay": "save and create key check (`tests/checks/source/keys.test.ts`)"
  - What is wrong: `keys.test.ts` is the catalog-key gate (its head comment: "The catalog key gate in both directions"). `grep -rln "localRefusal\|checkLocal\|must be an integer" tests` finds only `tests/data/sources/config/local.test.ts` and `tests/checks/config/config.test.ts`. No test row of the source tab's save or create key check exists, and G3's Test line names none.
  - Decision resting on it: the orchestrator rewrites `agents/guarded.md` at landing from this section, and would book a row that does not test the key check.
  - Failure scenario: G3, or the entry that takes the key check, names `keys.test.ts` as the save's key-check test, and the guarantee is then listed as tested when it is not.
  - Verdict: none.
- Report section 7, judgment 11: "`lsp-edit`, `writing-fix` and `replace` reach a machine file through a root served over the `.oculus` folder ...; through the hub root the path `.oculus/local.yml` is answered `outside`"
  - What is wrong: this holds for `lsp-edit` and `writing-fix` (`lsp-edit.ts:59-65`). It is false for `replace`: `readChecked` (`replace.ts:135-160`) has no dot-folder rule, and the reviewer's probe of `replace` through `lab/.oculus/local.yml` answered 200 and wrote the file.
  - Decision resting on it: the landing look and the orchestrator's reading of case 4.
  - Failure scenario: the orchestrator expects a replace through the hub root to be refused, and either books a non-existent limitation or misreads the look.
  - Verdict: none.
- `tests/routes/hubs/hub-secrets.test.ts` (`is withheld from the library rules ...`, new line `expect(withheld).toContain(configDir(engineDir()))`) and `tests/server/machine/lsp/adapters/markdown-requests.test.ts` (the `readDirectory` expectation `['README.md','docs']`)
  - What is wrong: these are changed assertions of preserved behaviour. The report says "none was run on the unchanged tree", and quotes only the whole test:quick line after the change. The first of them could run on the unchanged tree.
  - Failure scenario: a reader cannot tell from the report whether the new assertion passes on the old code, that is, whether the row checks preserved behaviour or new behaviour.
  - Verdict: none.

## 3. Standards

- The six lines `comment-width.test.ts` names: `options.ts:198` ("it takes a number or a choice, no heading). Everything wrong is pushed to `problems`; a problem with the control reads the control"), `local.ts:137`, `git-index.ts:395` (117 columns: "resolves outside the repository or cannot be resolved. A link that points inside the repository, or at nothing, is"), `machine-values.ts:2` (101 columns), `fs-transport.ts:46` (101 columns) and `markdown-requests.test.ts:4` (136 columns). In addition, `tests/state/system/settings/machine-section.test.ts:3` ends short inside a sentence ("and the default in force where it does not; a workspace with no").
  - What is wrong: spec.md, "What every package obeys": "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short."
  - Failure scenario: `npm run test:landing` on main is red at `tests/checks/source/comment-width.test.ts`, so the step cannot land as it stands.
  - Verdict: none.
- `src/lib/data/sources/config/local.ts:137-138`: "The keys are secrets: no page is sent one (the Settings answer masks them in server/root/process/context/machine-values.ts) and no log holds one."
  - What is wrong: the file route (`src/routes/api/(files)/file/[root]/[...path]/+server.ts`, `serveFile` with no `local.yml` exception) sends the bytes of a hub's `.oculus/local.yml`, keys included, to the source tab that opens it. DESIGN.md's `local.yml` bullet says so ("The file route serves the bytes of a workspace folder's file, a hub's `.oculus/local.yml` included"). After this step `/api/oculus-config` also answers oculus's own `config/local.yml`. The masking covers the Settings answer only. Item 3 asked for this comment to be rewritten "to what is true".
  - Failure scenario: a maintainer trusts "no page is sent one" and puts tab text, which holds the keys once the file is open, into a log, a notice or an app message.
  - Verdict: item 3 violated.
- `src/lib/server/files/workspace/machine-file.ts:5-7`: "Every module that keeps a request away from the file (the file route, the source tab, the file operations, the language servers, the writing rules, an app's reach) asks here." Also `tests/server/files/ops.test.ts:3-4`: "Paste, upload and the guard on a hub's .oculus/local.yml are tests/server/files/ops-paste.test.ts".
  - What is wrong: the file operations, the language servers and the writing rules no longer ask `machine-file.ts`, and the guard and its `ops-paste.test.ts` rows are gone. spec.md: "A sentence in a document or a head comment that the change makes false is a defect of the change". The brief's item 4 grep (`machine's own file`) hits `machine-file.ts:1`, whose paragraph holds the sentence.
  - Failure scenario: a reader looking for where the Files operations refuse a machine file is sent to `machine-file.ts` and `ops-paste.test.ts`, which hold no such refusal.
  - Verdict: item 4 violated.
- `src/lib/state/sources/fs-transport.ts:55`: "`export const NO_MACHINE: WorkspaceMachine = { set: [], defaults: {}, values: {}, hubs: {} };`"
  - What is wrong: this one module-level object, with mutable arrays and records, is handed to callers by `.catch(NO_MACHINE)` (`:257`), by `body?.machine ?? NO_MACHINE` (`fs.svelte.ts:518`) and by `NO_WORKSPACES`. spec.md, "The principles": "a shared fallback object handed to callers is frozen or built per call". The base built `{ set: [], defaults: {} }` at each use in `fs.svelte.ts`.
  - Failure scenario: any caller that pushes into `set` or writes into `values` of a fallback answer changes the fallback every later answer gets.
  - Verdict: none.
- Report section 5 (files): the files are listed without line counts. The brief's "Report" section asks for "The files with line counts", and spec.md's "Report" asks for "files changed with line counts". The report also gives no statement of the checks spec.md asks for every new id or key (`values`, `hubs`, `MASKED_KEYS`, the three catalog keys): empty, duplicated, and colliding with a configured or reserved key.
  - Failure scenario: the orchestrator cannot check the size and key rules from the report and must recount.
  - Verdict: none.

## 4. Behaviour

- `config/text/views/sources/source.yml:149`: "`lsp_edit_readonly: "{0} is read-only, so the language server's edit was not made."`"
  - What is wrong: the notice a reader sees for a read-only tab changes from "{0} is protected on this machine or read-only, so ..." to the new sentence. Section 8 ("Visible changes") does not list it with its before and after, or the view and state to see it in.
  - Failure scenario: the look at landing has no line to check this notice against.
  - Verdict: none.
- `src/lib/server/files/workspace/oculus-config.ts:20-26`
  - What is wrong: `GET /api/oculus-config/local.yml` now answers the bytes of oculus's own `config/local.yml` (404 before), and the listing includes `local.yml`. This is a host-visible change of a route. The report names the file in the DONE table but gives no before and after.
  - Failure scenario: a reader of the report does not learn that any same-origin page can read oculus's own `config/local.yml` through this route, which bears on open item 63 (the literature keys).
  - Verdict: none.

## Declined to judge

- Whether `hubs` (a wire member the brief does not name) should exist: this is Axel's call or the orchestrator's. The report raises it as judgment 2. On the evidence it is needed, since `Item.svelte` needs the hub of each row and parsing "(hub)" out of the value text would be fragile. Its content has the gap in Spec 1.
- The catalog `control`/`fields` additions to the `local.yml` section of `options.yml`. Judged needed and correct by the schema probe:
  - without a control, `port` would carry no `integer` type;
  - the `tool` and `provider` options match `local.ts:276-278`, `isCalendarProvider` and `isProvider` (`data/accounts/connect.ts:50-57`).
  - The schema does not require `label` or `dir`, which the reader requires. That makes the schema less strict than the reader, never stricter. Not raised.
- Whether a guarded entry is owed a test for "a literature key never reaches a page". No entry's text covers it:
  - G3's literature-route row, 'never answers a key, in a hit, a failure line or the source list', is about `/api/literature`;
  - G13's row 'words each problem against local.yml with no value of the file in it' is about finding sentences;
  - G76 is the app keyring.
  - No entry names `/api/fs` or `machine-values.ts`. A test row would need a new entry or a wider G3 text, which is Axel's yes (spec.md's test rule).
  - As Standards 2 shows, the sentence would also be false as a general guarantee: the source tab receives the keys through the file route.
- Case 13 end to end on a running server: not run, since a scratch server on another port was not needed for a verdict. The composition at `context.ts:786-795` was reproduced by probe. Within one poll tick the old watch (FSEvents on macOS) heard the edit; on another platform's watcher this was not verified.
- The look of the This machine rows and the Edit buttons (`glyph="edit"` without `plain`, while the config rows use `plain`): only a page shows it, at the look on landing.
- `tests/checks/config/integrity.test.ts` and the real-hub probe: not run, since they read the real hub.

Reviewer usage: aa189c08f67b30328, claude-opus-5-5, 366,098 tokens, 94 tool uses, 23.2 min (from its completion notice).
