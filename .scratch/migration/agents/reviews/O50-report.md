# O50 report: who the user is becomes the workspace setting `self`

Everything in the brief is done.

## Open items of the state file

Copied from `/Users/axelfaes/workspace/oculus/.scratch/migration/orchestrator-state.md` lines 230-234 (`sed -n 230,236p`), at the time of writing:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
>
> None open.

## The cases' first run (unchanged tree)

- C1 (the Settings row). Command: `grep -n -w "self" config/options/sources.yml config/defaults/sources.yml`. Output: `config/defaults/sources.yml:28:# Collection views: one card list per key, ...` (the `collections` comment only). No option `self` existed, so Settings drew no row.
- C2 (a write naming no person is refused). Command: `grep -n "people" src/lib/server/edit/writes/config/config-sources.ts src/lib/data/shapes/catalog-words.ts`. Output: nothing. There was no source `people`, so the server held no list to refuse against.
- C3 (`person()` marks the person the setting names). I added the rows to `tests/data/snapshot/normalise.test.ts` and ran them on the unchanged `normalise.ts` (`npx vitest run tests/data/snapshot/normalise.test.ts --reporter=verbose`). Both rows failed:
  - `AssertionError: expected [ 'nobody-home' ] to deeply equal [ 'someone' ]` at `tests/data/snapshot/normalise.test.ts:334:24`.
  - `AssertionError: expected [ 'nobody-home' ] to deeply equal []` at `tests/data/snapshot/normalise.test.ts:334:24`.
  - Summary line: `Tests  2 failed | 2 passed (4)`.
- C4 (the finding). Checked by reading `src/lib/data/snapshot/validate.ts:297-314` on the unchanged tree. `checkPeople` counted entries with `self: true` and gave `self_not_one` unless exactly one carried it, so it never read the setting.
- C5 (an entry still carrying `self: true`). Reading `normalise.ts:389` on the unchanged tree: `self: entry.self === true ? true : undefined`. The entry's flag marked the person, which C3's first run shows (`nobody-home` marked).
- C6 (the chat names the owner). Reading `hooks.ts:151-161`: `ownerName` reads `person.self === true` from the published portfolio. On the unchanged tree that flag came from the entry (C5).
- C7 (the Person page button). Reading `Person.svelte:188-192` on the unchanged tree: a `Tag` "this is me" drawn only when `join.person.self === true`. There was no button and no write.
- C8 (the unsaved workspace). Command: `grep -n "'self'\|setSelf" src/lib/state/workbench/ui.svelte.ts`. Output: nothing. There was no setter.
- C9 (a hub `config.yml` setting `self`). Command: `grep -c "'self'" src/lib/data/helpers/hub-names.ts`. Output: `0`. `self` is not in `HUB_LIST`; this holds on the unchanged tree and after the change.
- C10 (`settings: { self: true }`). There was no option, so the workspace layer had no rule for `settings.self` and gave its finding of a key no option names. This was checked by reading `workspace-layer.ts`.
- C11 (no code reads `self` from an entry). Command: `grep -rn "\.self === true\|entry\.self\|'self' in\|\['self'\]" src`. Output on the unchanged tree:
  ```
  src/lib/server/sessions/stores/hooks.ts:155:        if (isMap(person) && person.self === true && typeof person.name === 'string') {
  src/lib/data/snapshot/validate.ts:305:        if (entry.self === true) selves.push(index);
  src/lib/data/snapshot/normalise.ts:389:        self: entry.self === true ? true : undefined,
  src/lib/views/boards/person/Person.svelte:188:            {#if join.person.self === true}
  ```
- C12 (the workspace file's editor offers the people keys). Command: `grep -n "case 'people'" src/lib/data/sources/config/catalog/schemas/engine.ts`. Output: nothing.
- C13 (the picker's items). Command: `grep -n "people" src/lib/state/system/config/editors/sources.ts src/lib/views/system/workbench/Settings.svelte`. Output: nothing. The page held no people list.
- C14 (a rename rewrites `settings.self`). On the first run, a reading showed that the reference index read no workspace file. The files were `src/lib/data/snapshot/schema/run.ts:249-265` (what the schema run reads), `src/lib/data/index.ts:519-529` (the `buildReferences` call), `rename.ts` and `src/lib/server/machine/lsp/adapters/hub-keys.ts:237`. Adding `people: 'people'` to `OPTION_SOURCES` alone would therefore not make a rename reach `settings.self`.
  - I handed C14 back as a case the brief's rules got wrong. Rule: ruling 226 (C14 checked by reading, with the `OPTION_SOURCES` row). Result: the row does not make a rename rewrite the workspace file.
  - The orchestrator's ruling (round 0, `briefs/O50-cases.md` items 1-3) held C14 and the row for open item 227. Axel then ruled 227 (a) (`O50-cases.md` item 4). The index reads the open workspace file's `settings:`, and C14 becomes a test row.
  - The C14 row as built: `tests/data/snapshot/rename.test.ts`, 'edits $name' row 'the person the setting self of the open workspace file names, and no other byte of that file'. I ran it on a scratch copy whose `src` and `config` equal the base copy (`diff -rq` against `migration-O50-base` printed nothing) and with this step's test files. It fails there:
    ```
    FAIL  |unit| tests/data/snapshot/rename.test.ts > the rename of a hub key > edits 'the person the setting self of the op<ellipsis>'
    AssertionError: expected { <ellipsis>(3) } to deeply equal { <ellipsis>(4) }
    -   "hub:.oculus/workspaces/lab.yml": "folders:
    -   - { name: hub, path: ~/hub }
    - primary: hub
    - # what this workspace sets
    - settings:
    -   self: amir-2   # who I am
    -   code_theme: vscode-dark-2026
    - ",
     <heavy right-pointing angle quotation mark> tests/data/snapshot/rename.test.ts:402:24
    ```
    I reran it this turn on a fresh scratch copy: `Tests  1 failed | 31 passed (32)`, with the failure at `rename.test.ts:402:24`.
  - The second new row, 'the person the setting self names, and no workspace file for an unsaved workspace', passes on the unchanged tree, because the unchanged index scans no workspace file. It guards that the scan added here never reads a file for an unsaved workspace.

## What was built, by item

1. The option `self`:
   - `config/defaults/sources.yml:74` holds `self: ''` with its comment at `:73`.
   - `config/options/sources.yml:112-118` lists it under heading `sources`, section `People`, as `control: choice`, `empty: nobody is marked as you`, `from: people`.
2. The source `people`:
   - In `SOURCES` (`catalog-words.ts`).
   - The page:
     - `Settings.svelte:195` passes `people: snapshot.entities.people`.
     - `ListInputs.portfolio.people`.
     - `ownPeople` in `editors/sources.ts:115-124` keeps the records with no `root`. Each person is drawn by name, by key when the name is empty, and as `name (key)` (`person.named_key`) when two share a name.
     - The `people` case (`:168-171`) answers loading while there is no portfolio.
   - The server: `config-sources.ts:64-71` takes the published portfolio's people with no `root`, and the entity kind `'people'` is added in `config-sources.ts:35`, `writes.ts:139` and `hooks.ts`.
   - The editor's schema: `engine.ts:98-99` reads `hub.people`.
   - The reference index:
     - `OPTION_SOURCES` gains `people: 'people'` (`references.ts:31`).
     - `settingsNode(catalog)` (`references.ts:132-144`) is the options of every defaults file together under `settings`.
     - `src/lib/data/index.ts` passes it with the new 8th parameter `workspace: SettingsFile | null` of `buildPortfolioWithSchemas`.
     - `portfolio.ts:259-273` (`settingsFileOf`) names the open workspace file, and `:752` passes it at the build call.
     - `build.ts:236-247` (`workspaceScans`) scans the file. When the file lies under another workspace folder than the hub's, the scan says `of: <hub root>`.
     - `model.ts:92-96` adds `FileScan.of`.
     - `lookup.ts:90-95` (`graphOf`) holds a scan by `of ?? file.root`.
     - `lookup.ts` `overlay` keeps `of` and `engine` on a rescanned open tab.
3. `normalise.ts:375-396`: `selfKey(merged)` reads the setting. `person(entry, owner)` sets `self: true` only on the entry whose key is `owner` and reads nothing named `self` from the entry. `model-entities.ts:790` is rewritten.
4. `validate.ts:298-317`: `checkSelf` gives one finding on the people file, key `entries`, with `findings.validate.self_unknown`. It runs only when the setting is non-empty, the people registry read, and no entry has the key.
   - `ValidationRules.self?: SelfCheck` (`model/index.ts:98-106`).
   - `index.ts:528` passes `{ key, file, read }`.
   - `self_not_one` is removed (`config/text/findings.yml:282`).
   - A people registry that read with no entry gives the finding on `join(hub, config.registries.people)`, the configured path.
5. `ownerName` code is unchanged; its doc (`hooks.ts:148-152`) and `chat.ts:28-31` are rewritten.
6. The Person page:
   - `Person.svelte:211-224` draws a `ToolButton` "this is me" on every person with no `root`. It is pressed and active on the person `self` names.
   - `markSelf` writes nothing for a person with a `root`, for the pressed person, or when there is no person.
   - `setSelf` in `ui.svelte.ts:452-460` calls `writeOption('sources.yml', 'self', key)`.
7. The docs, the demo fixture and the synthetic test data are carried (listed below).
8. Not touched: the hub. What the landing does is under "For the landing".

## DONE / NOT DONE

| Check | Status | Command and output |
|---|---|---|
| Verify 1, the named test files | DONE | Run this turn with the reference index's tests added: `npx vitest run <the 13 files of Verify 1> tests/data/snapshot/rename.test.ts tests/data/snapshot/references.test.ts tests/server/machine/lsp/adapters/hub-keys.test.ts`. Output: `Test Files  1 failed \| 15 passed (16)`, `Tests  1 failed \| 282 passed \| 9 skipped (292)`. The one red is `tests/checks/tree/boundaries.test.ts`, whose received lines are `"state/boards/collection.ts imports data/snapshot/normalise-parts/plans"` and `"views/shared/forms/Followups.svelte imports data/model"`. Both are the base-red lines; this step changes neither file (`diff -rq` lists neither). |
| Verify 2, format, diagrams, test:quick | DONE | Run three times in all. The last run came after the last change: `npm run format`, then the copy-back below, then `npm run diagrams && npm run test:quick`. Output: `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint (10.0 s)`, `ok svelte-check (24.4 s): ... 0 ERRORS 0 WARNINGS`, `ok vitest (79.1 s)`, `test:quick: 81.0 s (limit 45.0 s); every command passed`, `test:quick: over the time limit`. The first of the three runs failed eslint (`248:17 error Unnecessary optional chain on a non-nullish value`) in `build.ts`. The code that line was in is not in the tree. No whole-suite command was run. |
| Format copy-back | DONE | `npm run format` rewrote `src/lib/server/content/wallpaper.ts` and `src/lib/views/shared/forms/entry/edit/EntryForm.svelte`: its log lists both without `(unchanged)`. Both were copied back from the base copy after each format. `diff -rq` against the base lists neither. |
| Verify 3, ASCII gate | DONE | `LC_ALL=C perl -ne '<the gate>' $(git status --short \| awk '{print $2}' \| grep -v '^\.scratch/')` over every changed file, the diagrams included. It printed nothing, exit 0. |
| Verify 4, the `self` grep | DONE | `grep -rn -w --exclude=local.yml self src config docs tests README.md`: 128 lines, none in `docs/diagrams/`. They are judged under "The self grep, judged". |
| Verify 4, C11 grep | DONE | Prints only `src/lib/server/sessions/stores/hooks.ts:157` (`ownerName`, the wire flag) and `src/lib/views/boards/person/Person.svelte:151` (`isSelf`, the wire flag). |
| Verify 5, unused exports | DONE | `sh utils/unused-exports.sh > unused-now.txt; diff ../migration-O50-base/unused-exports.txt unused-now.txt`: no output, exit 0. |
| Verify 6, history words | DONE | `git diff -U0 -- src tests config docs ':!docs/diagrams' \| grep '^+' \| grep -i -E "before\|used to\|no longer\|still\|always has been\|always had\|as before\|previously\|the step adds\|after this package lands\|O50\|20[0-9][0-9]-"` over every added line. One hit: `Person.svelte:148` "so a write on its way shows the state before it until the portfolio". It describes what the page shows at run time while a write is in flight, not the code's history, so it stays. |
| Verify 7, test and fixture edits | DONE | Listed below from `diff` against the base copy. |
| Verify 8, prose | DONE | Every changed comment, help line and document line was read against `spec.md`'s prose rules; departures are listed under "Prose". |
| Size limits | DONE | `wc -l`: `model-entities.ts` 876 (unchanged, under G20's 880), `portfolio.ts` 863, `model/index.ts` 875. |

## Files, from `diff -rq` against the base copy (base lines, now lines)

Source, config and tests (`diff -rq --exclude=local.yml` over `src tests utils config`, `wc -l` on both sides):

```
config/defaults/sources.yml                              107  111
config/options/sources.yml                               112  119
config/text/findings.yml                                 386  386
config/text/views/boards/person.yml                       32   35
src/lib/data/index.ts                                    807  827
src/lib/data/model/index.ts                              867  875
src/lib/data/model/model-entities.ts                     876  876
src/lib/data/shapes/catalog-words.ts                      91   92
src/lib/data/snapshot/normalise.ts                       772  779
src/lib/data/snapshot/references/build.ts                225  256
src/lib/data/snapshot/references/lookup.ts               170  169
src/lib/data/snapshot/references/model.ts                104  109
src/lib/data/snapshot/validate.ts                        403  406
src/lib/data/sources/config/catalog/schemas/engine.ts    233  235
src/lib/data/sources/config/catalog/schemas/references.ts 127 144
src/lib/server/edit/writes.ts                            791  791
src/lib/server/edit/writes/config/config-sources.ts       71   81
src/lib/server/machine/pty/start/chat.ts                 142  142
src/lib/server/root/watch/portfolio.ts                   840  863
src/lib/server/sessions/stores/hooks.ts                  231  233
src/lib/state/system/config/editors/sources.ts           170  195
src/lib/state/workbench/ui.svelte.ts                     527  542
src/lib/views/boards/person/Person.svelte                384  416
src/lib/views/system/workbench/Settings.svelte           405  406
tests/checks/config/config-folder.test.ts                810  811
tests/data/snapshot/normalise.test.ts                    311  336
tests/data/snapshot/reference-hub.ts                     289  305
tests/data/snapshot/rename.test.ts                       407  453
tests/data/snapshot/schema-rules.test.ts                 259  258
tests/data/sources/collections.test.ts                   203  202
tests/data/sources/registries.test.ts                    133  133
tests/fixtures/hubs/demo/.oculus/data/people/people.yml   33   31
```

Docs (`git show HEAD:<file> | wc -l` against `wc -l`): `docs/HELP.md` 546 to 547, `docs/data-map.md` 209 to 209, `docs/templates.md` 1313 to 1314.

`docs/diagrams/`: `layer-server`, `layer-state`, `layer-views`, `layers` and `writes` (`.dot` and `.svg`) were changed by `npm run diagrams`, 67 lines each way (`git diff --stat`).
- From this step: edge counts such as `server/root to server/core` 18 to 19, `server/edit to layer data` 113 to 114, `state to data` 441 to 442, and the `data/index.ts` line numbers.
- Not from this step: the views counts (`views/shared to layer ui` 181 to 186, `views/boards to views/shared` 49 to 48), `writeFollowup` in the `writes.ts` to `subtasks.ts` edge, and the `undo.ts` line numbers 308/495 to 315/502. This step changes no file under `src/lib/views/shared` and not `undo.ts` (`git diff --stat HEAD` on them prints nothing). `writeFollowup` is in the base copy's `writes.ts` (`grep -c` gives 3 on both sides). These lines come from diagrams the base commit did not regenerate.

## Paths written outside the brief's line ranges

- `src/lib/data/sources/config/catalog/schemas/references.ts`. The brief lists lines 20-33. Also written:
  - The head comment, lines 1-7. It now names `people` among the sources and says the workspace file's `settings:` is read with the places of every options file.
  - The import of `SETTINGS_KEY`, line 17.
  - The new `settingsNode`, lines 132-144.

  `settingsNode` builds a node from the options catalog, which is this file's job. Putting it in `build.ts` would add a `data/snapshot` to `data/sources` import, which `npm run diagrams` showed as a new folder edge. So `index.ts` builds the node and passes it in `ReferenceSources.settings`.
- `src/lib/server/root/watch/portfolio.ts`. The brief lists the build call (`:752`). Also written: three import lines (`WORKSPACES_FOLDER`, `hubOfFile`, `realPath`, type `SettingsFile`) and the helper `settingsFileOf` (`:259-273`) that names the open workspace file for the index.
- `src/lib/data/snapshot/references/model.ts` and `lookup.ts`. These are covered by "other files of that folder where the scan needs them":
  - `model.ts` holds `FileScan.of`.
  - `lookup.ts` lets `graphOf` hold the workspace file under the hub it names, and keeps `of` in `overlay`.
- `tests/data/snapshot/reference-hub.ts`. This is the reference index's test helper, under "the reference index's test files". It plants the workspace file and passes the `SettingsFile` when the row's workspace is open.
- `tests/checks/config/config-folder.test.ts` (G12). It is covered by "the test files of G12 ... where a row the change makes false is changed".

## Test and fixture edits (before, after, failing line on the unchanged tree)

Each edit is a `diff` against the base copy. Failing lines come from a scratch copy whose `src` and `config` are the base copy's, with this step's test files.

- `tests/data/snapshot/normalise.test.ts`:
  - Line 184-185: `links: ['https://example.invalid/someone'],` / `self: true` became `links: ['https://example.invalid/someone']`. This is data removal; no assertion read it.
  - Added: describe 'normalise, the person the setting `self` names', with rows `{ self: 'someone', marked: ['someone'] }` and `{ self: '', marked: [] }` over people `someone` and `nobody-home` (the latter carrying `self: true`). Both fail on the unchanged tree at `:334:24` (C3 above).
- `tests/data/snapshot/schema-rules.test.ts:197-199`: the schema row `'  - { field: self, type: checkbox, help: The owner. }'` is removed, and `'  - { key: ada, name: Ada, self: true, affiliation: x }'` became `'  - { key: ada, name: Ada, affiliation: x }'`. With the edit, on the unchanged tree the row 'gives the one finding of a key no schema declares for 'a person\'s affiliation'' fails at `schema-rules.test.ts:224:60`. It receives an extra `["entries", "0 people entries carry self: true, and exactly one may"]`, the old check's finding.
- `tests/data/sources/collections.test.ts`:
  - Line 138: `'  - { key: wim, name: Wim, affiliations: [kuleuven, ut], self: true }'` became `'  - { key: wim, name: Wim, affiliations: [kuleuven, ut] }'`.
  - Lines 178-179: `affiliations: ['kuleuven', 'ut'],` / `self: true` became `affiliations: ['kuleuven', 'ut']`.
  - This is data removal and passes on the unchanged tree. Run this turn: `Test Files  1 failed | 2 passed (3)` for collections, registries and rename, the one failure being rename's C14 row.
- `tests/data/sources/registries.test.ts:76`: `'  - { key: me, name: The Owner, self: true }'` became `'  - { key: me, name: The Owner }'`. This is data removal and passes on the unchanged tree (same run).
- `tests/checks/config/config-folder.test.ts:209`: `'self',` is added to the expected keys of `defaults/sources.yml`. With the edit, on the unchanged config:
  - `AssertionError: expected [ Array(96) ] to deeply equal [ Array(97) ]` at `:363:44`.
  - `AssertionError: expected [ 'apps_dir', 'bookmarks', <ellipsis>(12) ] to deeply equal [ 'apps_dir', 'bookmarks', <ellipsis>(13) ]` at `:798:48`.
- `tests/fixtures/hubs/demo/.oculus/data/people/people.yml`:
  - Head lines 3-4: `# owner, the one entry carrying `self: true`. A person's facts live here and nowhere else, so a name` / `# is written once ...` became `# owner. A person's facts live here and nowhere else, so a name is written once and every card, tag` / `# and map node that draws one reads it from this file.`
  - The schema row `- { field: self, type: checkbox, help: "true on the hub owner's own entry, exactly one" }` is removed.
  - `self: true` on `owner` is removed.
- `tests/data/snapshot/rename.test.ts`:
  - New: the `Edited.workspace` field, the `LAB` text, the `AMIR_RENAMED` texts, and the two rows named in C14.
  - `plantHub(row.hub, row.engine)` became `plantHub(row.hub, row.engine, { workspace: row.workspace })`.
  - No existing row is changed.
- `tests/data/snapshot/reference-hub.ts`:
  - New: the head comment names the workspace file, `PlantOptions.workspace`, `WORKSPACE_FILE = '.oculus/workspaces/lab.yml'`, and the planting and passing of the file.
  - No existing behaviour is changed.

## Comments and documents describing the changed behaviour

- `normalise.ts:375-378` (now `:375-387`): rewritten. `selfKey`'s doc, and `person`'s doc says `self` is true on the person whose key the workspace setting names.
- `model-entities.ts:790`: rewritten. "True on the person the workspace setting `self` names; absent on every other."
- `validate.ts:297-300` (now `:298-303`): rewritten for `checkSelf`.
- `hooks.ts:147-150` (now `:148-152`): rewritten. It is the person the workspace setting `self` names, which the payload marks.
- `chat.ts:28-31`: rewritten. It is the name of the person the workspace setting `self` names.
- The head comment of `Person.svelte`: rewritten, with a new paragraph at `:33-37` on the button.
- `docs/data-map.md:158`: rewritten. "`people`: the workspace setting `self` names the key of one entry, the user's own; a key no entry carries is a finding."
- `docs/templates.md:843-866`: rewritten.
  - `:846`: "Your own entry is the one whose key the workspace setting `self` names (see `workspaces/<name>.yml`)."
  - The schema row and the commented example line for `self` are removed.
- `docs/templates.md:285-303`: rewritten. Two comment lines at `:295-296` say what `self` is, and `#   self: me` is at `:298`.
- `config/defaults/sources.yml:28`: rewritten. "the `self` key below names the user's own entry" replaces "exactly one with `self: true`". The file's head line 5 also names `self`.
- `docs/apps.md:380`: still true. The wire keeps `self?` on `people` (brief Decisions 3).
- The demo fixture's head comment: rewritten (above).
- Also rewritten because they describe the changed code:
  - `config-sources.ts:1-6` head, which names people of the primary hub.
  - `editors/sources.ts:7-8` head.
  - `ui.svelte.ts:13` head.
  - `build.ts:11-15` head paragraph on the workspace file.
  - `references.ts:1-7` head.
  - `writes.ts:135-138` (the entity kinds).
- `docs/HELP.md:301`: new **Person.** note among the notes on single views.

## The self grep, judged

`grep -rn -w --exclude=local.yml self src config docs tests README.md` printed 128 lines.

About the person, each carried to the setting:
- `config-sources.ts:6`.
- `hooks.ts:149-150,157`.
- `chat.ts:29`.
- `editors/sources.ts:8`.
- `ui.svelte.ts:13,182,453,459`.
- `data/index.ts:528`.
- `validate.ts:299-315,397`.
- `normalise.ts:375-395`.
- `build.ts:14`.
- `model/index.ts:98-103`.
- `model-entities.ts:790-791`.
- `Person.svelte:35,147-154,207,212,214,314,342`. Of these, `207`, `212`, `314` and `342` are the CSS class `self` of the paragraph that holds the root chip and the button. The class name is kept for the paragraph's layout.
- `config/options/sources.yml:112`.
- `config/defaults/sources.yml:5,28,74`.
- `person.yml:13-15`.
- `findings.yml:282`.
- `docs/HELP.md:301`.
- `docs/templates.md:295,298,846`.
- `docs/data-map.md:158`.
- `docs/apps.md:380` (the wire field, still true).
- `config-folder.test.ts:209`.
- `normalise.test.ts:312-333`.
- `rename.test.ts:83,90,229,235,239`.

The new test data at `normalise.test.ts:322` deliberately carries `self: true` on an entry, to show it is not read.

Not about the person, left as they are:
- CSP `'self'`: `hooks.server.ts:14,76`, `address.ts:14`, and the recorded `*.headers` answers.
- CSS `align-self` / `justify-self`.
- `self` the worker global: `load.ts`, `inner-changes.worker.ts`, `file-match.worker.ts`.
- `closeSelf` / `close-self`.
- LaTeX root `how: 'self'`: `root.ts`, `latex-state.ts`.
- `page-state.svelte.ts`'s own `self` id.
- `dependency-self`.
- clangd `self=<n>`: `clangd.ts`, `MemoryUsage.svelte`.
- zenodo `links.self`.
- `terminal-list.ts`'s `self` parameter.
- "self-evaluating" and "self-contained" in prose.
- `methods.test.ts:162`.
- The recorded `*.body` answers.

## Every host- or user-visible change, before and after

- The Settings row:
  - Before: no row.
  - After: under heading `sources`, section `People`, the row `self`. It is a choice of the primary hub's people, drawn by name; by key when the name is empty; and as `Name (key)` when two share a name. Its empty item is "nobody is marked as you".
  - Its help: "Your own person key in the people registry of the primary hub. The Person page draws its this is me button pressed on that person, and the portfolio chat names them as the hub's owner. It is set in the open workspace file, in its settings:, from this row or from the button on a Person page. Empty marks nobody; a key that names no person of the people registry is a finding."
  - Choosing a person writes `settings.self: <key>` to the open workspace file through `writeConfigKey`.
  - The refusal of a key naming no person is `server.config_key.not_in_source`: "This option takes one of the items of the list people" (`config/text/server.yml:102`, filled with the source name by `notListed` in `config-fit.ts:73-78`).
- The Person page:
  - Before: a teal `Tag` "this is me" with the star glyph, only on the entry that carried `self: true`.
  - After: on every person of the primary hub, a `ToolButton` "this is me" with the star glyph.
    - Pressed and active on the person `self` names, with the title "<name> is you, as the setting self of the open workspace file names; Settings clears it".
    - Unpressed on the others, with the title "Mark <name> as you: writes self: <key> into the settings of the open workspace file".
    - Pressing it on an unpressed person writes the key; pressing the pressed one writes nothing.
    - A person of another hub shows its root chip and no button.
- The finding:
  - Before: on the people file, key `entries`: "<n> people entries carry self: true, and exactly one may", whenever other than one entry carried the flag, including when none did.
  - After: on the people file, key `entries`, only when `self` is non-empty, the registry read, and no entry has that key: "the workspace setting self names <key>, a key no entry of the people file carries, so nobody is marked as you".
- The chat's owner:
  - Before: the name of the entry carrying `self: true`.
  - After: the name of the person the workspace setting `self` names, through the same wire flag. With `self` empty it falls back to `server.chat.chat_owner_fallback` as before.
- A rename (C14):
  - Before: a rename of a person key left the workspace file alone.
  - After: it rewrites `settings.self` (and any setting drawn from `domains`, `clusters` or `people`) in the open workspace file, keeping every other byte. An unsaved workspace has no file, and nothing is rewritten for it.

## Judgment calls the brief left open

1. Two title keys, `person.self_tip` and `person.self_held_tip`, so the pressed button's title says what is set and where it is cleared, and the unpressed one says what pressing writes.
2. `person.named_key` ('{0} ({1})') lives in `config/text/views/boards/person.yml`, beside the person page's other words. The label is of a person and the Settings code has no file of its own for it.
3. The option sits after `repository_scan_depth` in `config/defaults/sources.yml`, and before `groups: {}` in `config/options/sources.yml`, in its own section `People`.
4. The field `FileScan.of`. A workspace file under a different workspace folder than the hub's names the hub's keys. `graphOf` holds a scan by `of ?? file.root`, so such a file joins the hub's graph and no other.
5. The workspace file's scan reads every option drawn from a hub list (`domains`, `clusters`, `people`), as item 2 says. `settingsNode` merges the options of all defaults files except `local.yml`, the same set `optionFiles` reads.
6. `settingsFileOf` returns null when the workspace file lies in no folder of the workspace, because the page cannot open such a file. This matches the index's rule for oculus's own config folder in `build.ts:21-25`.
7. `SelfCheck` is a named type `{ key, file, read }` in `model/index.ts`, so `validate.ts` takes the people file's configured path and the unread state from the build, not from the raw portfolio.
8. The two `{#if}` blocks in `Person.svelte:206-224` test `root !== undefined` and `root === undefined` side by side. This keeps the root-chip paragraph as it was and adds the button paragraph next to it.
9. `root === undefined` is written inline in `editors/sources.ts` and `config-sources.ts`; the orchestrator ruled this in round 0 (`O50-cases.md` item 3).

## Prose

The changed comments, help lines and document lines were read against `spec.md`'s prose rules. One place departs:
- The help of the option and the defaults comment name the button as "this is me" without quotes, since a YAML help string with nested double quotes would need escaping.
- `docs/HELP.md:301` quotes it, as Markdown allows.

## Anything in the brief that was wrong or impossible

- Under ruling 226 alone, C14 could not hold: the index read no workspace file (first run above). Ruling 227 (a) widened the step, and C14 is built and tested.
- `npm run test:quick` takes 81.0 s against its limit of 45.0 s. Every command passed. vitest alone takes 79.1 s of it, with 47 changed files selecting 228 test files.

## For the landing (item 8 and the ledger)

- The hub move, which the orchestrator does at landing:
  - Add `self: axel-faes` under `settings:` of `~/workspace/research-hub/.oculus/workspaces/research-hub.yml`.
  - Remove from `~/workspace/research-hub/.oculus/data/people/people.yml` the `self` schema row (line 16), `self: true` on `axel-faes` (line 112), and the head comment's mention (line 3, "the one entry carrying `self: true`"). Read this turn, without writing, with `grep -n "self"` on that file: hits at lines 3, 16 and 112 only. The workspace file has `settings:` at line 15 and no `self` (`grep -n "^settings:\|self"`).
  - Then read both files: `settings.self: axel-faes` in the workspace file and no `self` in the people file.
- `agents/guarded.md` G67's test line lists the rows of 'edits $name'. The two new row names belong there:
  - 'the person the setting self of the open workspace file names, and no other byte of that file'
  - 'the person the setting self names, and no workspace file for an unsaved workspace'
- G32's test list may also take the new describe of `normalise.test.ts`, 'normalise, the person the setting `self` names'.
- No other hub's people get a button. A workspace with a second hub draws the second hub's people with their root chip only. This hub's workspace has no second hub, so the look on landing shows the primary half.

# Repair round 1

## Open items

- R1-1, a rule clash in the round brief, for the orchestrator. Item 2 asks for the rename row to be seen failing "with the scan's `of` taken from where the code gives it". Taking `of` out of `build.ts` to watch the row go red is removing code under test, which the global rule against breakage testing forbids. The row was run instead on the pre-step base tree (the copy `O50-base`), where it fails (quoted under item 2). On the round-0 tree the rename row passes, because round 0 already built `of` into `build.ts` and `graphOf`. The adapter row (the other half of item 2) is the one that fails on the round-0 tree.
- R1-2, for the landing. The guarded test lists of G66, G67 and G119 need the new and renamed rows (listed at the end of this section). `guarded.md` is ledger, so this round did not write it.

## Per item, what changed

1. **B1, the graph the scan belongs to.**
   - `src/lib/data/snapshot/references/lookup.ts:84-91` adds `keysRootOf(scan)`, which answers `scan.of ?? scan.file.root`. `graphOf` (`:100`) now filters with it, so the rule lives in one place.
   - `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts:93` builds `graphOf(index, keysRootOf(scan))`. Its head comment says a key is matched among the keys of the hub the file names keys of, which for the open workspace file is the primary hub wherever the file lies.
   - The other callers: `grep -rn "file\.root" src/lib/server/machine/lsp src/lib/data/snapshot/references` prints three lines:
     ```
     src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts:108:    return { uri: pageUri(scan.file.root, scan.file.path), version: null };
     src/lib/server/machine/lsp/held/elsewhere.ts:16:    const root = roots.find((one) => one.key === file.root);
     src/lib/data/snapshot/references/lookup.ts:90:    return scan.of ?? scan.file.root;
     ```
     `hub-keys.ts:108` and `elsewhere.ts:16` name where a file is (its URI, the root that holds it on disk), not which graph a key is matched in, so the file's own root is the right answer for both and they are unchanged. `lookup.ts:90` is the new helper.
2. **P1, rows for `of`.**
   - `tests/data/snapshot/reference-hub.ts` plants a second workspace folder `lab` (`LAB_FOLDER`, the root `lab`, `PlantedHub.lab`) and takes `workspace: { text, folder: 'hub' | 'lab' }`. With `folder: 'lab'` the workspace file lies in `lab` and names `hub` as primary. `WORKSPACE_TEXT` moved here from `rename.test.ts` so both test files use one text.
   - `tests/data/snapshot/rename.test.ts:239-248`, row 'the person the setting self names, in an open workspace file of another workspace folder': renaming `amir` in the primary's people rewrites `self: amir` to `self: amir-2` in `lab:.oculus/workspaces/lab.yml`, and nothing else in it.
   - `tests/server/machine/lsp/adapters/hub-keys.test.ts:200-241`, describe 'the answer to a request on a setting of the open workspace file':
     - `it.each` over the folder of the primary hub and another workspace folder: "goes from the setting self of the open workspace file in %s to the primary hub's person" (Go to Definition on `amir` lands on `hub:.oculus/data/people/people.yml` line 5, characters 9-13).
     - "renames from the open workspace file of another workspace folder the primary hub's person": the rename's `documentChanges` name the people file, `joint-work.yml` and `alpha/project.yml` of `hub`, and the workspace file in `lab`.
3. **P2, the unsaved workspace through the production path.** The row that handed the build `null` is gone from `rename.test.ts`. `tests/data/snapshot/references.test.ts:598-626`, describe 'the open workspace file in the reference index' (tagged `slow`), builds the index through `watchPortfolio` with a real `OpenWorkspace` (`workspaceAt`, `watchedIndex`, `:540-596`), so `settingsFileOf` runs as it does in the server:
   - 'no file, for an unsaved workspace': `file: null`, no workspace file in the index.
   - 'no file, for a file in a hub that is no folder of the workspace': the file lies in a hub `away` that is not a folder, no workspace file in the index.
   - 'the file under the primary hub, for a file in its folder': one scan, root `hub`, no `of`, naming `owner`.
   - 'the file under another folder, naming the primary hub, for a file in that folder': one scan, root `lab`, `of: 'hub'`, naming `owner`.
   The rows sit in `references.test.ts` because `spec.md` allows a test only under a guarded entry and G66 (the reference index) names that file. They are tagged `slow` under `spec.md`'s rule that a test which cannot run in well under a second (a real process, a timer) is tagged slow: each starts the portfolio watcher, with its file watchers and timers, over three planted hubs. Run alone (`npx vitest run tests/data/snapshot/references.test.ts --tags-filter=slow --testTimeout 20000 --reporter=verbose`) at a load average near 11 they took 810, 710, 796 and 639 ms and all four passed; at a load average near 20 earlier in the round they took about 7 s each, over the 5 s limit `npm test` uses. Being slow, they are outside `npm test` and `npm run test:quick` and run in the landing list's slow tests.
4. **ST2, one folder lookup.** `src/lib/server/files/workspace/open.ts:104-111` exports `folderOfHub(hub, folders)`, the workspace folder whose real path is the hub folder's, or undefined. `hubNameOf` (`:113-116`) and `settingsFileOf` (`src/lib/server/root/watch/portfolio.ts:266`) both call it; `portfolio.ts` no longer imports `realPath`. The reuse grep is under "Reuse grep" below.
5. **ST3.** `src/lib/views/boards/person/Person.svelte:206-223` is one `{#if join.person.root !== undefined}` (the root chip) `{:else}` (the "this is me" button) `{/if}`.
6. **B3, every item can be told apart.** `ownPeople` (`src/lib/state/system/config/editors/sources.ts:116-132`) computes each person's words (the name, or the key when the name is empty), draws as `name (key)` (`person.named_key`) every item whose words equal another item's, and then draws as `name (key)` any item whose plain words equal one of those `name (key)` labels. Test rows in `tests/state/system/settings/theme-groups.test.ts:387-421`, describe 'the people of the choice self', through `listsOf` and `poolOf` over the shipped option:
   - `{ ada: 'Ada', bob: '' }` draws `Ada`, `bob`.
   - `{ k1: 'Kim', k2: 'Kim' }` draws `Kim (k1)`, `Kim (k2)`.
   - `{ ada: '', bob: 'ada' }` draws `ada (ada)`, `ada (bob)`.
   - `{ k1: 'Kim', k2: 'Kim', x: 'Kim (k1)' }` draws `Kim (k1)`, `Kim (k2)`, `Kim (k1) (x)`.
7. **SP1 and B2.** Under "Item 7" below.
8. **SP2.** Under "Item 8" below.

## Each case's first run, then its result

First runs were made on the copy of the round-0 tree (`O50-round0` in the scratchpad: round 0's `src` and `config` with this round's test files), and where named on the copy of the pre-step base (`O50-base`, the base `src` and `config` with this round's test files). No code under test was changed or removed to make a row fail. vitest's ellipsis is written `...` in the quotes below.

1. Case 1 (item 1, Go to Definition from the file in `lab`).
   - Round-0 tree: the row for `lab` fails, `expected undefined to match object { result: [ { ...(2) } ] }` at `hub-keys.test.ts:213:28`; the row for the primary's folder passes.
   - Rename from the file in `lab`, round-0 tree: fails, `expected undefined to deeply equal [ ...(4) ]` at `hub-keys.test.ts:226:25`.
   - Worktree: all three rows pass.
2. Case 2 (item 2, the rename rewrites `settings.self` in the file in `lab`).
   - Round-0 tree: passes (round 0 built `of`).
   - Base tree: both workspace-file rename rows fail at `rename.test.ts:403:24`, `expected { ...(3) } to deeply equal { ...(4) }`, missing `hub:.oculus/workspaces/lab.yml` and `lab:.oculus/workspaces/lab.yml` respectively.
   - Worktree: both pass.
3. Case 3 (item 3, through `settingsFileOf`).
   - Round-0 tree: all four rows pass.
   - Base tree: the two rows with a file fail at `references.test.ts:624:23`, `expected [] to deeply equal [ { root: 'hub', ...(3) } ]` and `[ { root: 'lab', ...(3) } ]`. The two rows with no file pass on both trees: they assert an absence that held before the step.
   - Worktree: all four pass when run alone.
4. Case 4 (item 6, the picker labels).
   - Round-0 tree: `{ ada: '', bob: 'ada' }` fails, `expected [ 'ada', 'ada' ] to deeply equal [ 'ada (ada)', 'ada (bob)' ]` at `theme-groups.test.ts:419:41`; `{ k1: 'Kim', k2: 'Kim', x: 'Kim (k1)' }` fails, `expected [ 'Kim (k1)', 'Kim (k2)', 'Kim (k1)' ] to deeply equal [...]` at the same line. The `Ada`/`bob` and two-Kim rows pass.
   - Worktree: all four pass.

## Reuse grep

On the base copy, `grep -rnF --exclude=local.yml "<name>" src` for each helper and type the step adds:

```
selfKey:
ownPeople:
settingsNode:
settingsFileOf:
SelfCheck:
SettingsFile:
of?: string:
folderOfHub:
keysRootOf:
one.real === real: src/lib/server/files/workspace/folders.ts:173; src/lib/server/files/workspace/open.ts:107
hubOfFile(: undo.ts:252, undo.ts:501, open.ts:80 (the definition), open.ts:93, open.ts:137, open.ts:238
optionsRecord(: src/lib/data/sources/config/catalog/schemas/references.ts:106 (private), :123
```

- None of the names existed before the step.
- `open.ts:107` was `hubNameOf`'s match; it is now `folderOfHub`, which `settingsFileOf` reuses.
- `folders.ts:173` finds a folder already listed with the same place while the folder list is being read (`placeOf(dir)`, which takes a folder that does not exist); it answers a repeated folder, not the folder of a hub, and `open.ts` imports from `folders.ts`, so it does not call `folderOfHub`.
- `hubOfFile` is reused by `settingsFileOf`.
- `settingsNode` reuses `optionsRecord` of `references.ts`.

## Verify

The verify list ran four times this round. Runs 3 and 4 are beyond what `spec.md` allows (a red line in a file the step does not change is rerun alone and the list is not run again for it), which is a finding against this round. No code changed between runs 2, 3 and 4. `npm run format` and `npm run diagrams` ran before runs 1 and 2; after the format, `wallpaper.ts` and `EntryForm.svelte` were copied back from the base.

Run 1, after the last code change of the round but one:

```
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      ASCII gate (1.9 s)
ok      svelte-kit sync (3.4 s)
ok      eslint (14.1 s)
FAILED  svelte-check (63.0 s)
ok      vitest (222.2 s): Duration  209.36s (transform 219.43s, setup 0ms, import 426.39s, tests 322.95s, environment 50.13s)
test:quick: 225.9 s (limit 45.0 s); failed: svelte-check
```

The error was `theme-groups.test.ts:419:28`: the table's row objects were not assignable to `Record<string, string>`. The table is now typed `it.each<{ people: Record<string, string>; drawn: string[] }>` (`:410`), and the file alone then passed (20 tests).

Run 2, after that fix, the last change of the round:

```
ok      prettier (1.5 s): All matched files use Prettier code style!
ok      ASCII gate (1.9 s)
ok      svelte-kit sync (4.6 s)
ok      svelte-check (105.6 s): 1792680037305 COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (116.7 s)
FAILED  vitest (176.3 s)
 FAIL  |unit| tests/routes/edit/undo/undo.test.ts > taking a change back > writes the project of a folder of the workspace inside 'a second hub' and outside every scan folder in its own file, and takes it back: 'a field of the manifest editor'
 FAIL  |unit| tests/routes/edit/undo/undo.test.ts > taking a change back > writes the project of a folder of the workspace inside 'the primary hub' and outside every scan folder in its own file, and takes it back: 'an added line'
 FAIL  |unit| tests/routes/edit/undo/undo.test.ts > taking a change back > writes the project of a folder of the workspace inside 'a second hub' and outside every scan folder in its own file, and takes it back: 'an added line'
Error: Test timed out in 5000ms.
 Test Files  1 failed | 224 passed | 9 skipped (234)
      Tests  3 failed | 2525 passed | 101 skipped (2629)
test:quick: 181.9 s (limit 45.0 s); failed: vitest
```

Run 3, no change:

```
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.9 s)
ok      eslint (3.2 s)
ok      svelte-check (9.9 s): 1792680281807 COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest (162.3 s)
 FAIL  |unit| tests/server/desktop/window-guard.test.ts > the colours of the theme a window starts on > reads the sheets from the code folder when the config folder holds config/ alone
 FAIL  |unit| tests/server/machine/apps/watch-no-primary.test.ts > the apps watcher with no primary hub > has no apps folder and holds no app, and reads again without error
 Test Files  2 failed | 223 passed | 9 skipped (234)
      Tests  2 failed | 2526 passed | 101 skipped (2629)
test:quick: 165.4 s (limit 45.0 s); failed: vitest
```

Both failures were `Error: Test timed out in 5000ms.`

Run 4, no change:

```
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (1.8 s)
ok      svelte-check (8.5 s): 1792680617192 COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (80.8 s): Duration  71.37s (transform 45.35s, setup 0ms, import 103.87s, tests 170.38s, environment 2.05s)
test:quick: 83.1 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
```

The timeouts of runs 2 and 3 are in files this step does not change, and each was rerun alone:
- `npx vitest run tests/routes/edit/undo/undo.test.ts`: `Tests  56 passed (56)`. The fourteen rows 'outside every scan folder', verbose, took 603 to 2343 ms on the worktree and 813 to 2150 ms on the base copy (`tests 16.18s` against `tests 18.44s`).
- `npx vitest run tests/server/machine/apps/watch-no-primary.test.ts --reporter=verbose`: 2 passed on the worktree (2160 ms, 1079 ms) and on the base copy (2454 ms, 975 ms). Run together with `undo.test.ts` and `window-guard.test.ts` at a load average of 17.8, its first row timed out on the worktree and on the base copy alike.
- `uptime` printed load averages of 16.65 to 20.02 during runs 2 and 3 and 10.71 at the start of run 4. The machine's top processes by CPU (`ps -Ao pcpu,etime,command -r`) were a `vite dev` of the main checkout and a Python job, neither started by this round.

The round's test files, run together: `npx vitest run tests/state/system/settings/theme-groups.test.ts tests/server/machine/lsp/adapters/hub-keys.test.ts tests/data/snapshot/rename.test.ts tests/data/snapshot/references.test.ts` printed `Test Files  4 passed (4)` and `Tests  98 passed (98)` (the slow describe included, since a run that names files applies no tag filter).

The ASCII gate over the round's changed files:

```
LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/server/files/workspace/open.ts src/lib/server/root/watch/portfolio.ts src/lib/data/snapshot/references/lookup.ts src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts src/lib/state/system/config/editors/sources.ts src/lib/views/boards/person/Person.svelte tests/data/snapshot/reference-hub.ts tests/data/snapshot/rename.test.ts tests/data/snapshot/references.test.ts tests/server/machine/lsp/adapters/hub-keys.test.ts tests/state/system/settings/theme-groups.test.ts
```

It printed nothing, exit 0.

`npm run test:quick` takes 83.1 s at its quietest run against its limit of 45.0 s, with every command passing; 54 changed files select 234 test files.

## Item 7, what the code does

### The setting `self`

- **Empty.** `selfKey` (`src/lib/data/snapshot/normalise.ts:376-378`) answers `''`, and `person()` marks nobody (`self: owner !== '' && entry.key === owner ? true : undefined`, `:395`). `checkSelf` (`src/lib/data/snapshot/validate.ts:304-317`) returns at once, so there is no finding. No person's button is pressed. The chat names its owner with `server.chat.chat_owner_fallback` (`src/lib/server/machine/pty/start/chat.ts:115`). Settings shows the choice's empty item, "nobody is marked as you".
- **Duplicated.**
  - `self:` twice under `settings:` of the workspace file: the YAML reader refuses the file. `node -e` with `yaml`'s `parse` on `settings:\n  self: a\n  self: b\n` prints `Map keys must be unique at line 3, column 3:`. `open.ts:184` then gives the finding `findings.workspace.file_unparsed` and no folder is served from that file, so no `self` is set.
  - Two entries with one key in the people file: `src/lib/data/snapshot/schema/lists.ts:151` gives the finding `findings.schema.duplicate_key` ("two entries share the key {0}"). `normalise` keys the people by id, so the last of the two in file order is the record kept, and that is the one marked.
- **Colliding with a key of another hub.**
  - The choice offers only the primary hub's people (`ownPeople` keeps the records with no `root`), and the Settings write refuses any other value ("This option takes one of the items of the list people").
  - Written by hand, a key of another hub (or `lab:key`) matches no entry of the primary's people file, so `checkSelf` gives `findings.validate.self_unknown` ("the workspace setting self names {0}, a key no entry of the people file carries, so nobody is marked as you") and nobody is marked.
  - `self` in a hub's `.oculus/config.yml` is not applied: `self` is not in `HUB_LIST` (`grep -c "'self'" src/lib/data/helpers/hub-names.ts` prints 0), so the hub layer gives `findings.config.hub_key_unknown` (`src/lib/data/sources/config/merge/hub-layer.ts:70`).
  - A value that is not text (`self: 3`, a list) gets `findings.config.settings_value` ("{0} must be {1}; oculus's value stands", `workspace-layer.ts:185`), and the shipped empty value stands, so nobody is marked.

### The Person page's press

- **In flight.** `markSelf` (`Person.svelte:157-161`) calls `setSelf` (`src/lib/state/workbench/ui.svelte.ts:457-460`), which calls `writeOption(SOURCES, 'self', key)`. `writeOption` (`:241-259`) records `pending.self = { value, settled: null }` and awaits `writeConfigKey`. The button's pressed state reads the wire flag (`isSelf`, `Person.svelte:151`), so it stays as it was until the server republishes the portfolio with the new `self`; then the new person's button is pressed and the old one's is not.
- **After the tab closes.** `writeConfigKey` goes through `send` and `exchange` (`src/lib/state/client/writes.svelte.ts:582-589, 747-755, 783-795`), a plain `fetch` with no `keepalive` (the only `keepalive` in the file is `postCommand`, `:202-214`). A request the browser has already sent is finished by the server: `src/routes/api/write/+server.ts` does not read `request.signal` (`grep -c signal` prints 0), so the file is written and the change is in History. A request the browser had not yet sent when the tab closed is lost, and nothing is written.
- **Superseded by a second press.** A press on another person while the first write is on its way sends a second `writeConfigKey` and replaces `pending.self`. The server applies the two requests in the order they arrive; the one applied last is the setting, and each republish moves the pressed state. A press on the person already marked writes nothing (`markSelf` returns when `isSelf`).

### The editor, before and after, in the workspace file

- **Before.** The reference index read no workspace file, so `settings.self` and every other setting in it were plain text: no link, no Go to Definition, no rename, and Find References on a person listed no workspace file.
- **After.** The open workspace file is scanned (`settingsFileOf`, `build.ts`). Its `settings.self` value, and the value of every setting whose option draws from `domains`, `clusters` or `people`, is a hub-key link: Go to Definition goes to the entry in the primary hub, Find References lists every place, and Rename rewrites the setting with the rest. The keys are matched in the primary hub's graph wherever the file lies (item 1). Find References on a person, domain or cluster, and the References view, list the workspace file among the places that name it. A workspace file outside every folder of the workspace, and an unsaved workspace, are not scanned.

## Item 8, the self grep of Verify 4, judged

`grep -rn -w --exclude=local.yml self src config docs tests README.md` prints 136 lines (`wc -l`); a second run printed the same set (`diff` of the two sorted outputs printed nothing). Each line is quoted below with the judgment beside it. Seven lines longer than 220 characters are quoted as their length and the text around the hit.

- 70 lines are about the person: 44 carried to the setting, 19 tests of the setting, 2 lines of deliberate test data with `self: true` on an entry (shown not read), the wire flag and its field in `docs/apps.md` (kept, brief Decisions 3), its two readers (C11), and the option key in a test's expected keys.
- 66 lines are not about the person: CSS `align-self`/`justify-self`, the CSS class `self` of Person.svelte's paragraphs, the CSP keyword `'self'`, the worker global, the window closing itself, a LaTeX file that is its own root, a Zenodo record's own link, a command that depends on itself, the page's own writer id, clangd's own memory, the Terminal tab's own id, "self-contained", "self-evaluating", an object that holds itself, and recorded HTTP answers.

```
config/defaults/sources.yml:5: # It also holds who the user is among the people of the primary hub (self), and the map from a file name to the language the editor colours it in (languages).
    -> about the person: carried to the setting
config/defaults/sources.yml:28: <2453 characters; around the hit:> ...se `affiliations:` are keys of the organisations file; the `self` key below names the user's own entry), `organisations`...
    -> about the person: carried to the setting
config/defaults/sources.yml:74: self: ''
    -> about the person: carried to the setting
config/options/sources.yml:112:     self:
    -> about the person: carried to the setting
config/text/findings.yml:282:             self_unknown: 'the workspace setting self names {0}, a key no entry of the people file carries, so nobody is marked as you'
    -> about the person: carried to the setting
config/text/views/boards/deposit.yml:37:         finding_readme: no README.md in the deposit; code/README.md is required and self-contained
    -> not the person: "self-contained"
config/text/views/boards/person.yml:13:         self: this is me
    -> about the person: carried to the setting
config/text/views/boards/person.yml:14:         self_tip: 'Mark {0} as you: writes self: {1} into the settings of the open workspace file'
    -> about the person: carried to the setting
config/text/views/boards/person.yml:15:         self_held_tip: '{0} is you, as the setting self of the open workspace file names; Settings clears it'
    -> about the person: carried to the setting
docs/HELP.md:301: <364 characters; around the hit:> ...ther person of the primary hub writes that person's key to `self` in the open workspace file's `settings:`, undoable in ...
    -> about the person: carried to the setting
docs/apps.md:380: | `people` | `id`, `name`, `affiliations`, `links`, `projectIds`, `jointWorkIds`, `role?`, `orcid?`, `email?`, `folder?`, `file?`, `self?` |
    -> about the person: the wire field self?, kept (brief Decisions 3), still true
docs/data-map.md:158: - `people`: the workspace setting `self` names the key of one entry, the user's own; a key no entry carries is a finding.
    -> about the person: carried to the setting
docs/templates.md:295: # `self` is the key of your own entry in the primary hub's people file, which the Person page's
    -> about the person: carried to the setting
docs/templates.md:298: #   self: me
    -> about the person: carried to the setting
docs/templates.md:846: Your own entry is the one whose key the workspace setting `self` names (see `workspaces/<name>.yml`).
    -> about the person: carried to the setting
src/desktop/decide/channels.ts:7: export const CLOSE_SELF = 'oculus:close-self';
    -> not the person: the window closing itself
src/desktop/preload.cjs:25:     closeSelf: () => ipcRenderer.send('oculus:close-self'),
    -> not the person: the window closing itself
src/hooks.server.ts:14: const FRAME_SRC = "frame-src 'self'";
    -> not the person: the CSP source keyword
src/hooks.server.ts:76: // The page's answer carries `Content-Security-Policy: frame-src 'self'`, which holds the frame of
    -> not the person: the CSP source keyword
src/lib/data/helpers/run/chain.ts:46:             if (next === command) return { error: 'dependency-self', names: [command.name] };
    -> not the person: a command that depends on itself
src/lib/data/index.ts:528:             self: {
    -> about the person: carried to the setting
src/lib/data/model/index.ts:98:     /** The person the setting `self` names, checked against the people file; none checks none. */
    -> about the person: carried to the setting
src/lib/data/model/index.ts:99:     self?: SelfCheck;
    -> about the person: carried to the setting
src/lib/data/model/index.ts:103:  * The person key the workspace setting `self` names (empty for none), the people file it is
    -> about the person: carried to the setting
src/lib/data/model/machine/model-machine.ts:314:     'dependency-self',
    -> not the person: a command that depends on itself
src/lib/data/model/model-entities.ts:790:     /** True on the person the workspace setting `self` names; absent on every other. */
    -> about the person: carried to the setting
src/lib/data/model/model-entities.ts:791:     self?: boolean;
    -> about the person: the wire flag, kept (brief Decisions 3), set from the setting
src/lib/data/snapshot/normalise.ts:375: /** The person key the workspace setting `self` names in a merged config, empty for none. */
    -> about the person: carried to the setting
src/lib/data/snapshot/normalise.ts:377:     return str(merged.self) ?? '';
    -> about the person: carried to the setting
src/lib/data/snapshot/normalise.ts:381:  * One human. `self` is true on the person whose key `owner` is, the key the workspace setting
    -> about the person: carried to the setting
src/lib/data/snapshot/normalise.ts:382:  * `self` names, and carried only then, so the wire says who the hub belongs to and says nothing at
    -> about the person: carried to the setting
src/lib/data/snapshot/normalise.ts:395:         self: owner !== '' && entry.key === owner ? true : undefined,
    -> about the person: carried to the setting
src/lib/data/snapshot/references/build.ts:14: // a setting names, the person `self` names among them, rewrites the setting. The unsaved workspace
    -> about the person: carried to the setting
src/lib/data/snapshot/validate.ts:299:  * The workspace setting `self` names a person of the people registry, which is how the hub knows
    -> about the person: carried to the setting
src/lib/data/snapshot/validate.ts:306:     self: SelfCheck | undefined,
    -> about the person: carried to the setting
src/lib/data/snapshot/validate.ts:310:     if (self === undefined || self.key === '' || !self.read) return;
    -> about the person: carried to the setting
src/lib/data/snapshot/validate.ts:311:     if (raw.registries.people.entries.some((entry) => entry.key === self.key)) return;
    -> about the person: carried to the setting
src/lib/data/snapshot/validate.ts:313:         file: self.file,
    -> about the person: carried to the setting
src/lib/data/snapshot/validate.ts:315:         message: findingText(catalog, 'findings.validate.self_unknown', self.key)
    -> about the person: carried to the setting
src/lib/data/snapshot/validate.ts:397:     checkSelf(raw, rules.self, catalog, findings);
    -> about the person: carried to the setting
src/lib/server/content/latex/root.ts:10: //   self      the file itself, when it declares a document class.
    -> not the person: a LaTeX file that is its own root
src/lib/server/content/latex/root.ts:42: export type RootHow = 'magic' | 'self' | 'included' | 'folder';
    -> not the person: a LaTeX file that is its own root
src/lib/server/content/latex/root.ts:379:         if (declaresClass(headOf(walk, file))) return { main: file, how: 'self' };
    -> not the person: a LaTeX file that is its own root
src/lib/server/edit/writes/config/config-sources.ts:6: // the records with no `root`, since the workspace setting `self` names a person of the primary.
    -> about the person: carried to the setting
src/lib/server/machine/apps/serve/address.ts:14: // named by address and never `'self'`, and its `connect-src` holds the app's own files and the
    -> not the person: the CSP source keyword
src/lib/server/machine/pty/start/chat.ts:29:      * The name of the person the workspace setting `self` names, or null when it names nobody or
    -> about the person: carried to the setting
src/lib/server/machine/runs/recover/sources/zenodo.ts:27:             links: z.object({ self: httpsShape })
    -> not the person: a Zenodo record's own link
src/lib/server/machine/runs/recover/sources/zenodo.ts:43:         url: one.links.self
    -> not the person: a Zenodo record's own link
src/lib/server/sessions/stores/hooks.ts:149:  * The name of the person the workspace setting `self` names, which the last published `portfolio`
    -> about the person: carried to the setting
src/lib/server/sessions/stores/hooks.ts:150:  * payload marks `self: true`: the hub's owner, or null when none is marked, the name is empty or
    -> about the person: carried to the setting
src/lib/server/sessions/stores/hooks.ts:157:         if (isMap(person) && person.self === true && typeof person.name === 'string') {
    -> about the person: ownerName reads the wire flag set from the setting (C11)
src/lib/shell/keys/PaletteRow.svelte:148:         justify-self: end;
    -> not the person: the CSS property
src/lib/state/sessions/latex/latex-state.ts:117: type RootHow = 'magic' | 'self' | 'included' | 'folder';
    -> not the person: a LaTeX file that is its own root
src/lib/state/sessions/latex/latex-state.ts:322:     how: z.enum(['magic', 'self', 'included', 'folder']).catch('folder')
    -> not the person: a LaTeX file that is its own root
src/lib/state/shared/answers/terminal-words.ts:44:         case 'dependency-self':
    -> not the person: a command that depends on itself
src/lib/state/shared/stores/page-state.svelte.ts:144:     const self = `${page}:${freshStamp()}`;
    -> not the person: the page's own writer id
src/lib/state/shared/stores/page-state.svelte.ts:225:         if (by === self) return;
    -> not the person: the page's own writer id
src/lib/state/shared/stores/page-state.svelte.ts:243:         if (batch.by === self) return;
    -> not the person: the page's own writer id
src/lib/state/shared/stores/page-state.svelte.ts:268:         if (payload.debug !== undefined && payload.debug.by !== self) {
    -> not the person: the page's own writer id
src/lib/state/shared/stores/page-state.svelte.ts:285:             .send({ kind: 'layout', identity, envelope, from, write: next.write, by: self })
    -> not the person: the page's own writer id
src/lib/state/shared/stores/page-state.svelte.ts:359:             { kind: 'layout', identity, envelope, from, write: next.write, by: self },
    -> not the person: the page's own writer id
src/lib/state/shared/stores/page-state.svelte.ts:371:         void transport.send({ kind: 'unread', identity, value, by: self }).then((answer) => {
    -> not the person: the page's own writer id
src/lib/state/shared/stores/page-state.svelte.ts:391:             .send({ kind: 'views', set, remove: [...remove], by: self }, leaving)
    -> not the person: the page's own writer id
src/lib/state/shared/stores/page-state.svelte.ts:430:         void transport.send({ kind: 'debug', value, by: self }).then((answer) => {
    -> not the person: the page's own writer id
src/lib/state/shared/stores/page-state.svelte.ts:436:         by: self,
    -> not the person: the page's own writer id
src/lib/state/sources/search/file-match.worker.ts:10:     (out: FileWorkerOut) => self.postMessage(out),
    -> not the person: the worker global
src/lib/state/sources/search/file-match.worker.ts:14: self.onmessage = (event: MessageEvent<FileWorkerIn>) => handle(event.data);
    -> not the person: the worker global
src/lib/state/system/config/editors/sources.ts:8: // the workspace setting `self` names a person of the primary hub by key.
    -> about the person: carried to the setting
src/lib/state/system/machine/lsp/clangd.ts:66:     /** The tooltip, `self=<n> total=<n>`. */
    -> not the person: clangd's own memory of a node
src/lib/state/system/machine/lsp/clangd.ts:105:         detail: `self=${String(counter(node, '_self'))} total=${String(total)}`,
    -> not the person: clangd's own memory of a node
src/lib/state/workbench/ui.svelte.ts:13: // `self` option of the sources defaults, who the user is, which the Person page sets. A control
    -> about the person: carried to the setting
src/lib/state/workbench/ui.svelte.ts:182:     /** Write the user's own person key to the `self` option; an empty key writes nothing. */
    -> about the person: carried to the setting
src/lib/state/workbench/ui.svelte.ts:453:      * Write who the user is, the key of their own person, to the `self` option of the sources
    -> about the person: carried to the setting
src/lib/state/workbench/ui.svelte.ts:459:         void writeOption(SOURCES, 'self', key);
    -> about the person: carried to the setting
src/lib/ui/controls/editor/diff/inner-changes.worker.ts:67: self.onmessage = (event: MessageEvent<InnerAsk>) => {
    -> not the person: the worker global
src/lib/ui/controls/editor/diff/inner-changes.worker.ts:69:     self.postMessage(answer);
    -> not the person: the worker global
src/lib/ui/controls/editor/kit/load.ts:13: // theme files it points at are not. Monaco finds its workers through `self.MonacoEnvironment`, the
    -> not the person: the worker or window global
src/lib/ui/controls/editor/kit/load.ts:320:     self.MonacoEnvironment = {
    -> not the person: the worker or window global
src/lib/ui/controls/editor/kit/load.ts:408:     self.addEventListener('pagehide', (event) => {
    -> not the person: the worker or window global
src/lib/ui/controls/editor/kit/rite/rite.ts:173:                 '`:health`: interned, self-evaluating. `:` is an ordinary symbol char, so a keyword is only one when the colon OPENS the token; `a:b` is a plain symbol.',
    -> not the person: "self-evaluating" in a language help text
src/lib/ui/display/ticker/Ticker.svelte:193:         align-self: center;
    -> not the person: the CSS property
src/lib/ui/frame/toolbar/fit.ts:37: /** What `closesPopover` asks of a node: the nearest ancestor-or-self matching a selector. */
    -> not the person: the DOM word ancestor-or-self
src/lib/ui/tabs/TabFace.svelte:298:         align-self: center;
    -> not the person: the CSS property
src/lib/ui/tabs/Tabs.svelte:428:         align-self: stretch;
    -> not the person: the CSS property
src/lib/ui/tabs/Tabs.svelte:462:         align-self: stretch;
    -> not the person: the CSS property
src/lib/ui/tabs/Tabs.svelte:513:         align-self: stretch;
    -> not the person: the CSS property
src/lib/ui/tree/TreeItem.svelte:373:         align-self: stretch;
    -> not the person: the CSS property
src/lib/ui/tree/row/FoldLine.svelte:34:         align-self: flex-start;
    -> not the person: the CSS property
src/lib/views/boards/person/Person.svelte:35:     // setting `self` names; pressing it on another person writes that person's key to `self`
    -> about the person: carried to the setting
src/lib/views/boards/person/Person.svelte:147:      * Whether this person is the user, the one the workspace setting `self` names: the flag of the
    -> about the person: carried to the setting
src/lib/views/boards/person/Person.svelte:151:     const isSelf = $derived(join.person?.self === true);
    -> about the person: isSelf reads the wire flag set from the setting (C11)
src/lib/views/boards/person/Person.svelte:154:      * Make this person the user by writing their key to `self` through the Settings write path; on
    -> about the person: carried to the setting
src/lib/views/boards/person/Person.svelte:207:                 <p class="self">
    -> not the person's flag: the CSS class self of the paragraph that holds the root chip
src/lib/views/boards/person/Person.svelte:211:                 <p class="self">
    -> not the person's flag: the CSS class self of the paragraph that holds the button
src/lib/views/boards/person/Person.svelte:213:                         label={t('person.self')}
    -> about the person: carried to the setting
src/lib/views/boards/person/Person.svelte:313:                 <p class="self">{said}</p>
    -> not the person's flag: the CSS class self of the paragraph of the person's own words
src/lib/views/boards/person/Person.svelte:341:     .self {
    -> not the person's flag: the CSS rule of that class
src/lib/views/sessions/session-detail/DetailsBody.svelte:349:         align-self: center;
    -> not the person: the CSS property
src/lib/views/sessions/terminal/TerminalTitle.svelte:105:         align-self: center;
    -> not the person: the CSS property
src/lib/views/sessions/terminal/terminal-list.ts:470:  * The terminals the Terminal tabs in `tabs` own other than `self`'s, each by its name, which Join
    -> not the person: the Terminal tab's own id
src/lib/views/sessions/terminal/terminal-list.ts:471:  * Terminals on a menu offers to move into `self`. A terminal started elsewhere (`foreign`) is not
    -> not the person: the Terminal tab's own id
src/lib/views/sessions/terminal/terminal-list.ts:476:     self: string,
    -> not the person: the Terminal tab's own id
src/lib/views/sessions/terminal/terminal-list.ts:480:         .filter((one) => one.view === TERMINAL_VIEW && one.id !== self)
    -> not the person: the Terminal tab's own id
src/lib/views/shared/card/Clamp.svelte:83:         align-self: stretch;
    -> not the person: the CSS property
src/lib/views/shared/changes/ChangeGroups.svelte:444:         justify-self: end;
    -> not the person: the CSS property
src/lib/views/sources/file/File.svelte:503:         align-self: flex-start;
    -> not the person: the CSS property
src/lib/views/sources/files/sections/clangd/MemoryUsage.svelte:7:     // total in megabytes beside it and `self=<n> total=<n>` as its tooltip; children are ordered by
    -> not the person: clangd's own memory of a node
tests/checks/config/config-folder.test.ts:209:             'self',
    -> about the person: the option key in the expected keys of defaults/sources.yml
tests/data/snapshot/normalise.test.ts:312: describe('normalise, the person the setting `self` names', () => {
    -> about the person: a test of the setting
tests/data/snapshot/normalise.test.ts:313:     /** The fixture's people, the one besides `someone` carrying `self: true` on its entry. */
    -> about the person: describes the test data that carries self: true on an entry to show it is not read
tests/data/snapshot/normalise.test.ts:322:                     { key: 'nobody-home', name: 'Nobody Home', self: true }
    -> about the person: test data that carries self: true on an entry to show it is not read
tests/data/snapshot/normalise.test.ts:329:         { self: 'someone', marked: ['someone'] },
    -> about the person: a test of the setting
tests/data/snapshot/normalise.test.ts:330:         { self: '', marked: [] }
    -> about the person: a test of the setting
tests/data/snapshot/normalise.test.ts:331:     ])('marks $marked for the setting self $self, and no entry for its own self: true', (row) => {
    -> about the person: a test of the setting
tests/data/snapshot/normalise.test.ts:332:         const people = normalise(withSelfEntry(), [], { self: row.self }).entities.people;
    -> about the person: a test of the setting
tests/data/snapshot/normalise.test.ts:333:         const marked = Object.values(people).flatMap((one) => (one.self === true ? [one.id] : []));
    -> about the person: a test of the setting
tests/data/snapshot/reference-hub.ts:242: /** A workspace file whose setting `self` names the person `amir`, with bytes around it to keep. */
    -> about the person: a test of the setting
tests/data/snapshot/reference-hub.ts:249:     '  self: amir   # who I am',
    -> about the person: a test of the setting
tests/data/snapshot/references.test.ts:566:         ['folders:', ...listed, 'primary: hub', 'settings:', '  self: owner', ''].join('\n')
    -> about the person: a test of the setting
tests/data/snapshot/rename.test.ts:230:         name: 'the person the setting self of the open workspace file names, and no other byte of that file',
    -> about the person: a test of the setting
tests/data/snapshot/rename.test.ts:236:             [`hub:${WORKSPACE_FILE}`]: WORKSPACE_TEXT.replace('self: amir', 'self: amir-2')
    -> about the person: a test of the setting
tests/data/snapshot/rename.test.ts:240:         name: 'the person the setting self names, in an open workspace file of another workspace folder',
    -> about the person: a test of the setting
tests/data/snapshot/rename.test.ts:246:             [`lab:${WORKSPACE_FILE}`]: WORKSPACE_TEXT.replace('self: amir', 'self: amir-2')
    -> about the person: a test of the setting
tests/server/machine/lsp/adapters/hub-keys.test.ts:36: /** The value of `self` in the planted workspace file, and the key `amir` in the people file. */
    -> about the person: a test of the setting
tests/server/machine/lsp/adapters/hub-keys.test.ts:205:         "goes from the setting self of the open workspace file in %s to the primary hub's person",
    -> about the person: a test of the setting
tests/server/machine/runs/recover/answers/physionet/mitdb.headers:9: content-security-policy: sandbox; default-src 'self'
    -> not the person: a recorded CSP header
tests/server/machine/runs/recover/answers/stanford/purl.body:1: <24596 characters; around the hit:> ...btype"}],"type":"resource type","source":{"value":"Stanford self-deposit resource types"}},{"value":"Data sets","type":"...
    -> not the person: a recorded Stanford answer, "Stanford self-deposit"
tests/server/machine/runs/recover/answers/zenodo/aad-dtu.body:1: <8856 characters; around the hit:> ... audio dataset for auditory attention decoding", "links": {"self": "https://zenodo.org/api/records/1199011", "self_html"...
    -> not the person: a recorded Zenodo answer, "links": {"self": ...}
tests/server/machine/runs/recover/answers/zenodo/aad-dtu.headers:19: <265 characters; around the hit:> ...content-security-policy: default-src 'self' fonts.googleapis.com *.gstatic.com data: 'unsafe-inlin...
    -> not the person: a recorded CSP header
tests/server/machine/runs/recover/answers/zenodo/picai.body:1: <8699 characters; around the hit:> ...lenge: Public Training and Development Dataset", "links": {"self": "https://zenodo.org/api/records/6624726", "self_html"...
    -> not the person: a recorded Zenodo answer, "links": {"self": ...}
tests/server/machine/runs/recover/answers/zenodo/picai.headers:19: <265 characters; around the hit:> ...content-security-policy: default-src 'self' fonts.googleapis.com *.gstatic.com data: 'unsafe-inlin...
    -> not the person: a recorded CSP header
tests/state/system/apps/methods.test.ts:162:     cycle.self = cycle;
    -> not the person: an object that holds itself
tests/state/system/settings/theme-groups.test.ts:14: // The choice `self` draws each person of the primary hub by name, by key when the name is empty,
    -> about the person: a test of the setting
tests/state/system/settings/theme-groups.test.ts:387: describe('the people of the choice self', () => {
    -> about the person: a test of the setting
tests/state/system/settings/theme-groups.test.ts:388:     /** The words the choice `self` draws each person by, over people given as key and name. */
    -> about the person: a test of the setting
tests/state/system/settings/theme-groups.test.ts:406:         const pool = poolOf(shipped['sources.yml'].self, {}, lists);
    -> about the person: a test of the setting
```

## Landing notes

- Guarded rows to add or rename (`guarded.md`, ledger):
  - G66, `references.test.ts`: describe 'the open workspace file in the reference index' (tagged `slow`), its four rows 'scans no file, for an unsaved workspace', 'scans no file, for a file in a hub that is no folder of the workspace', 'scans the file under the primary hub, for a file in its folder', 'scans the file under another folder, naming the primary hub, for a file in that folder'.
  - G67, `rename.test.ts`: the row 'the person the setting self names, and no workspace file for an unsaved workspace' is replaced by 'the person the setting self names, in an open workspace file of another workspace folder'; 'the person the setting self of the open workspace file names, and no other byte of that file' stays.
  - G67, `hub-keys.test.ts`: describe 'the answer to a request on a setting of the open workspace file', with "goes from the setting self of the open workspace file in the folder of the primary hub to the primary hub's person", the same "in another workspace folder", and "renames from the open workspace file of another workspace folder the primary hub's person".
  - G119, `theme-groups.test.ts`: describe 'the people of the choice self', four rows 'draws $people as $drawn, so no two items read alike'.
- `npm run format` rewrites `src/lib/server/content/wallpaper.ts` and `src/lib/views/shared/forms/entry/edit/EntryForm.svelte` on every run, files this step does not change. Both were copied back from the base after the format, and `diff -q` against `../migration-O50-base` prints nothing for either.
