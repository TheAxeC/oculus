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
