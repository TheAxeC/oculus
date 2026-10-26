# Brief check of O85 (oculus, main at ae2ef5ba)

The brief cannot be dispatched as written. Six findings stop it:

1. **A premise of ruling 444 is wrong.** `linkedin_dir` is read from each hub's own file, so it is not one of the 13 primary-only keys.
2. **Undo is outside the write list.** Undo of a write to a second hub's file needs `undo.ts`, which is not in "Paths this step writes".
3. **The page's list and family write is outside the write list.** That write (`editors/writer.ts`) and the `Writes` type (`shapes.ts`) both need the hub.
4. **The value checks use the primary's folder.** Folder and file values are checked against the primary's folder; with no primary they are refused with `no_primary`.
5. **The page cannot reach the hub layer's rules.** `mergeHub` and its word pruning live in `hub-layer.ts`, which imports `node:fs`. O79 also changes that file.
6. **Four folders the step adds files to already hold 10 items.**

Everything below was read on main at ae2ef5ba. The O85 step line and the bullets for open items 440, 443 and 444 exist only in the working tree's `plan.md` (uncommitted, `git diff .scratch/migration/plan.md`). The plan has no "Goal" section: `grep -n -i goal .scratch/migration/plan.md` finds none, so the goal used below is the one in my prompt (Settings can set a second hub's own settings in that hub's file).

## Names

`grep -rn -e writeConfigKey -e writeConfigValue -e resetConfig src tests`, `grep -rn -e config-key -e config-value -e config-reset src docs tests config README.md --exclude=local.yml`, `grep -rn -e optionNow -e layersOf -e "placeOf(" src`, and a grep for "primary hub's settings file" and its variants over src, docs, config and README.md. Hits outside the brief's paths:

- **`src/lib/server/edit/writes/undo.ts:100-112` `recordLayers`: made false.**
  - It calls `layersOf(into)`, then `placeOf(layers, change.key, change.field)`.
  - Its doc comment says a record "of another primary hub, which this target does not write" answers null.
  - So undo of a record naming the second hub's file finds no place and is not taken back. Case 3 and item 2 ("undoable in History as the primary's are") cannot be met without this file.
  - Its test, `tests/routes/edit/undo/undo.test.ts` (guarded entry G9), is not in the paths either.
- **`src/lib/state/sessions/source/write-files.ts`: made false.**
  - Line 120 is `return hubFileOf(key) === file ? inHub(HUB_FILE, look) : look.workspaceFile();`, and the head comment (lines 17-19) says a key of the hub list lands "in the primary hub's settings file".
  - With `root` naming the second hub, the unsaved-text guard checks the primary's file. A write to the second hub while its `config.yml` holds unsaved text in a tab would not be refused.
  - Its tests are in `tests/state/client/held-unsaved.test.ts`.
- **`src/lib/state/shared/stores/shapes.ts:386-410`: needs the change.** This is the `Writes` type of `writeConfigKey`, `writeConfigValue` and `resetConfig`. The page reaches the store through it (`useState().writes`), so the new parameter must be added here.
- **`src/lib/state/system/config/editors/writer.ts`: needs the change.**
  - Lines 30-35 type `WriteConfigValue` with no hub.
  - Its head comment and `pushed` logic tie the end of a draft to the config channel's push of the primary's merged value.
  - Every list, multi, words and family row (`stages`, `categories`, `manifest_fields`, `scan`, `audit.required_files`: cases 3, 5, 6, 7 and 8) is written through this file. Guarded entry G96 names its code.
- **`src/lib/state/system/config/editors/sources.ts`: needs the change.** The controls' lists (the hub's folders through `folder` in `Settings.svelte`, the collection keys `chat_context` offers) are the primary's. A folder picker shown with the second hub chosen would list the primary's folders.
- **`src/lib/server/edit/writes/config/config-sources.ts` and `config-fit.ts:335-336`: the check uses the wrong hub.**
  - `sourcesOf(into)` in `config-write.ts:65-72` hands `hub: into.hub`, the primary's folder.
  - `config-fit.ts:335-336` checks every `folder` and `file` control under it, and answers `server.workspace.no_primary` when it is null.
  - Per-hub keys with such controls: `memories_dir`, `wallpaper_dir`, `scan[].dir`, `new_project_dir[]`, `collections[].file` (`config/options/sources.yml:19,35,58,155,161`) and `audit.website.file` (`config/options/behavior.yml:75`).
  - This can be fixed inside `config-write.ts`, which is in the paths, but the brief does not say so.
- **`docs/HELP.md:325`: made false, and not in item 8.** It says "A key of the hub's list is written to the primary hub's `.oculus/config.yml`".
- **`src/lib/data/sources/config/merge/workspace-file.ts:55`: partly false.** The workspace file's schema description says "A key of the hub list is set in the primary hub's .oculus/config.yml instead."
- **`src/lib/server/edit/writes.ts:29`: head comment made false.** It says "...each written in the open workspace file or the primary hub's settings file".
- **The working tree's uncommitted `docs/data-map.md`: made false if the orchestrator commits it.**
  - `git diff docs/data-map.md` shows a new section "The primary hub", with "Settings writes a hub's words, its categories and its form fields to the primary's `config.yml`." and "In a workspace with no primary hub, Settings refuses to write a hub's words, categories and form fields".
  - Item 8 does not list them.
- **`src/lib/server/edit/writes/apps/gate.ts:88-90` and `src/lib/data/helpers/files/apps/apps.ts:159-161`: not made false.** The three kinds are in `CLOSED_WRITES` (`gate.ts:113-116`), so no app can send `root`.
- **`src/lib/state/workbench/ui.svelte.ts:70-77,253-270` and `tests/state/workbench/options-pages.test.ts`: not made false.** They write workspace options only, and an optional parameter leaves them valid.
- **`src/lib/server/edit/writes/config/app-setting.ts`: not made false.** It writes `app_settings` to the primary, which stays primary-only.
- **The term `root`: consistent.** `new-entry` uses `root` as the hub's name (`bodies.ts:81-90`, `hubTarget` in `writes/hubs.ts:98-103`), and the brief uses it the same way.
- **The new set file under `src/lib/data/helpers/`: no clash.** It has no name yet.

## The step line

Each part of the step line maps to an item of "What to build":

- "a Settings row of a key of the hub list that each hub's own `config.yml` is read for (36 keys)": item 1 (the set) and item 4 (the row).
- "names the hub it writes, the primary first and chosen, as Add does": item 4.
- "shows that hub's value": item 5.
- "the write lands in that hub's `.oculus/config.yml`": items 2 and 3.
- "a key read from the primary alone (13) keeps writing the primary with no choice": item 2 (the refusal of a `root` other than the primary's) and item 4 (no choice drawn).
- "`docs/data-map.md`'s 'A second hub' names those 13 keys": item 8, second bullet.

No part of the line is without a requirement. Items 6, 7 and the first bullet of item 8 (HELP.md) support the parts above.

The line itself carries the premise error under Premises: it lists `linkedin_dir` among the 13.

## Premises

**Holds:**

- `awk 'NR>=690 && NR<=775' src/lib/data/helpers/hub-names.ts | grep "key:" | nl` gives 49 keys. `HUB_LIST` is at lines 713-762 (brief: "about 700-750"). The 22 keys of `catalogs/vocab.yml` (palette to ticker_categories) are there.
- `wc -l`: bodies.ts 705, writes.svelte.ts 867, groups.ts 486, List.svelte 232, Item.svelte 437, Settings.svelte 407.
- `grep -n` of writes.svelte.ts: `writeConfigKey` at 568, `writeConfigValue` at 593, `resetConfig` at 616.
- `config-place.ts`: `placeOf` at 117-126 takes `layers.hub`, and `layersOf` at 56-62 fills it from `into.hub`.
- `config-write.ts:75` is `configWrite`.
- `config/text/server.yml:520` is `no_primary`.
- `config-key.ts:121,129` and `config-value.ts:216,225` hold the `local.yml` refusals. The brief says 226; the `isMachinePlace` call is at 225-226.
- `machineHubs` (`config-place.ts:173-178`) lists every hub.
- `grep -n "^import" in-place.ts` shows lodash-es and data modules only. `hub-layer.ts:17` imports `node:fs`.
- `hubsTaking`, `chosenHub` and `hubList` in `state/shared/page/hubs.ts` are as stated.
- `docs/HELP.md:527` and HEAD's `docs/data-map.md:260` read as quoted.
- O81's paths share none of O85's paths (`.scratch/migration/agents/briefs/O81.md:92-109`).

**The 36, checked one by one:**

- `scan` and `collections`: `readHub` per hub (`build.ts:142,153`) reads `config.scan` and `config.collections` (`data/index.ts:373-394`). Holds.
- `chat_context`: `pty/start/context.ts:1-3,37`, through `target.config.merged`. Holds.
- `new_project_dir`: `writes.ts:674`, `createIdea(home.hub, home.config, ...)`. Holds.
- `memories_dir` and `wallpaper_dir`: `images.ts:396-401`, each hub's merged config. Holds.
- The 22 vocab keys and `manifest_fields`: `hubWords` (`data/index.ts:635-640`), carried per hub on the config channel. Holds.
- The seven `audit.*` keys: `portfolio.ts:625-634` and `690-705`, `auditRules(merged, ...)` per hub. `audit/scan.ts:26-27` says each hub's website feed is checked against its own projects. Holds.

**The 13, checked one by one:**

- `linkedin_dir` is NOT primary-only. This premise does not reproduce.
  - `readOtherHub` (`data/index.ts:571-573`) builds each other hub's portfolio with `portfolioConfigFrom`, whose `feeds.linkedin` is `path('linkedin_dir', '')` (`data/index.ts:202-206`).
  - `readHub` calls `readFeeds(hub, config.feeds, ...)` for every hub (`data/index.ts:404`), which reads `join(hub, files.linkedin)` (`documents/feeds.ts:159`).
  - The merge keeps every hub's LinkedIn posts, with `hubFiles` naming each hub's file (`data/snapshot/hubs/feeds.ts:1-8,43-58`), and takes the latest `lastPost` over all hubs (`snapshot/hubs/merge.ts:236-239`).
  - That `lastPost` drives the LinkedIn cadence and badge (`state/feeds/feeds.ts:87`, `state/workbench/rail-badges/rail-badges.ts:76-81`).
  - HEAD's `docs/data-map.md:260` ("Its `career_file`, `linkedin_dir` and `portfolio_deck` are not read") is therefore already false for `linkedin_dir`. Item 8 would repeat the error, and ruling 444 and the step line list `linkedin_dir` among the 13.
  - The orchestrator must rule: the set becomes 37 and 12, or the brief explains why the LinkedIn folder stays primary-only.
- `career_file` and `portfolio_deck`: primary-only holds. `readOtherHub` sets `career: null, portfolioDeck: null` (`data/index.ts:560-573`).
- `bookmarks`, `schedules` and `apps_dir`: primary-only holds, but the cited code does not show it. `local.ts:185-186` only lists which watchers rebuild. The evidence is `src/lib/server/files/workspace/paths.ts:1-48`, `perOculus` over the primary's folder.
- `app_settings`: `apps.ts:349`. Holds.
- `wallpaper.image`: `wallpaper.ts:10`. Holds.
- `docs` and `counts`: `rail.ts:44`, `rail-badges.svelte.ts:149`, the page's primary config. Holds.
- `slurm.resource`: `host.ts:87-91`, "The setting is the primary hub's". Holds.
- `lint.writing_skip` and `lint.writing_glyphs`: `lintSettings` over `locals.config()` (`routes/api/(machine)/lint/+server.ts:19`, `context.ts:218`). Holds.

**Omissions in "What is on the tree" that change the build:**

- The config channel already carries each hub's merged vocabulary and `manifest_fields` as the server merged them, word pruning included: `HubVocabs.lists[hub].words` (`data/index.ts:635-662`, `data/model/index.ts:296-326`, `watch/portfolio/payload.ts:1-10`). It also carries oculus's own words in `own`. Item 5 has the page recompute this and does not mention it.
- The hub layer does more than item 5 names. `mergeHub` (`hub-layer.ts:521-617`) also runs `dropRemovedWords`: a word a hub removes leaves every option whose `from` names that list, and each option's `default` loses it (`hub-layer.ts:328-375`). It also runs `rowsNamingLists` for `manifest_fields`. These live in `hub-layer.ts`, which imports `node:fs`, so the page can import them only after a split of that file. `hub-layer.ts` is not in the paths, and O79 changes its lines 380-520 (`briefs/O79.md:110`).
- The page's options defaults are the primary's pruned defaults. Laying the second hub's value over them gives a wrong value when the primary removed a word the second hub keeps.
- The step is undone at three places outside the paths: undo (`undo.ts:100-112`), the unsaved-text guard (`write-files.ts:120`) and the client type (`shapes.ts:386-410`).
- Folder counts, from `git ls-files <dir>` counted by first path segment, against `utils/folder-check.sh` (more than 10 items is refused):

  | Folder | Items now | What the brief adds there |
  |---|---|---|
  | `src/lib/data/helpers` | 10 | item 1's new file |
  | `src/lib/views/system/workbench/settings` | 10 | the hub-choice component |
  | `src/lib/state/client` | 10 | item 3's split of writes.svelte.ts |
  | `src/lib/state/system/config` | 10 | any new state module |
  | `tests/server/edit` | 10 | tests "beside" the existing ones |
  | `src/lib/server/edit/writes/config` | 10 | any new server module |

  Each addition there needs a folder split, which no path allows.
- A split of `writes.svelte.ts` moves code beyond "lines 560-630". O79 changes its comment at line 435 (O79 brief:97; O85 brief says "near line 431").

## Cases and checks

Read against `.scratch/migration/agents/spec.md`:

- Case 3 ("Undo in History restores B's file") needs `undo.ts` and the G9 test `tests/routes/edit/undo/undo.test.ts`. Neither is in the paths.
- The rules file (`spec.md:59`) says a test exists only under a `guarded.md` entry that names it by file and title. The brief adds "a new test file of the rows of a chosen hub" but names no entry. G96 (`guarded.md:302-304`) names `row-writer.test.ts` "every row" but no new file. The builder may not edit `guarded.md` (`spec.md:36`), so this needs the orchestrator's entry change before dispatch.
- Verify item 4 says "this brief says which it is" (audit or proof) for each test, but the brief names none.
- Cases 1, 2, 4 (the drawn choice), 9, 10 and 11 are partly what the page draws. Under `spec.md:64,66` their proof is the look on landing. The brief does not say which cases are looks.
- Case 17 asks for a check of a place the step does not change: the config channel's payload. That is a fair negative check, but it passes by doing nothing.
- No case asks the builder to quote or explain a place the step does not change, other than case 17.

## The question

Could each part pass without Settings being able to set a second hub's own settings in its file?

- **Case 1:** yes. It holds on the unchanged tree.
- **Case 2:** yes, for keys other than `stages`. A page merge without the hub layer's word pruning passes `stages` while `focus_lanes` or `categories` show a wrong value for B.
- **Cases 3, 5 and 6:** yes, if run at the server writer only (`config-value.test.ts` with `root`). The page's list editor (`editors/writer.ts`, outside the paths) would still send no `root`. No case drives a row's Save through the page's writer.
- **Case 4:** no.
- **Case 7:** yes, if the test's folder exists in A too. `scan[].dir` is checked under A's folder (`config-fit.ts:335-336`). A folder only B holds would be refused, and B's real `scan` could not be set.
- **Case 8:** no.
- **Case 9:** yes. It holds on the unchanged tree.
- **Case 10:** yes, when the one hub is the primary; that is the unchanged behaviour. A one-hub workspace with no primary is not tested.
- **Case 11:** yes, if run with a vocabulary key. A folder or file key with no primary is refused with `no_primary` by `config-fit.ts:335`.
- **Cases 12, 13 and 15:** no.
- **Case 14:** yes. It holds on the unchanged tree.
- **Case 16:** no.
- **Case 17:** yes, trivially.
- **The step line's check:** yes. It is met at the server body level while the page's list and family write, undo and the unsaved guard still act on A.
- **Item 1:** yes, with a wrong set (`linkedin_dir`).
- **Item 2:** yes. The body routes to B while undo (`undo.ts`) and the value checks (`sourcesOf`) still use A.
- **Item 3:** yes. The parameters can be added without `editors/writer.ts`, `write.ts`'s types or `shapes.ts` carrying them.
- **Item 4:** yes. The choice can be drawn while list rows write A.
- **Item 5:** yes. It passes for `stages` and fails on pruned options and the defaults.
- **Item 6:** yes; it is a convention.
- **Item 7:** yes. Tests at the server level pass without the page part.
- **Item 8:** yes. It passes while writing a false sentence about `linkedin_dir` and leaving `HELP.md:325` false.

## Implied inputs

Each needs a case. The expected result follows each one.

1. **B's `.oculus/config.yml` removed while the view is open**, so B is no longer a hub. Expected: the write naming B is refused with `server.workspace.no_hub_named` and no file or folder is created; item 2's "creating the file and its folder" must not apply to a second hub. The row's choice falls back to `chosenHub`.
2. **B renamed or removed from the workspace while a row has B chosen.** Expected: the choice resets to `chosenHub` of the new `hubList`. A body already sent naming B is refused with `no_hub_named` and nothing is written.
3. **A list or family write whose base was read from the wrong hub.** Examples: a draft made with B chosen, then the hub switched to A; or a draft restored from instance state after a reload, while the choice, which is not saved, resets to A. Expected: the server refuses with the "changed since it was read" sentence. The editor's `pushed` must not end B's draft on a push of A's value, or apply a B draft to A.
4. **Reset on a key the chosen hub does not set.** Expected: the page sends nothing (`row.own` read from B's file). A body naming B anyway answers with nothing changed, no file is touched and no History record is made (`config-reset.ts:133-134`).
5. **The `copy` flag (Edit in a file) with B chosen on a key B's file lacks.** Expected: B's file gains the key holding B's value in force (not A's), B's file opens at that line once the push lands, A's file is unchanged, and Undo takes the added key out of B's file.
6. **Undo of a B write after B's file changed since.** Expected: refused as for the primary. After B left the workspace, refused as gone.
7. **B's `config.yml` open with unsaved text in a source tab.** Expected: the write naming B is refused before sending (the `write-files.ts` guard), and nothing is written.
8. **Folder and file values for B** (`memories_dir`, `wallpaper_dir`, `scan`, `new_project_dir`, `collections[].file`, `audit.website.file`). Expected: checked under B's folder, and with no primary not refused with `no_primary`. The pickers list B's folders.
9. **The hub switched while a write to A is out, or while A's refusal is shown.** The writer's state is keyed by `row.id`, which is `<file>:<key>` (`write.ts:95-112`). Expected: A's answer or message is not shown under B.
10. **A one-hub workspace whose hub is not primary.** Expected: the row shows that hub's value and the write lands there, with no `no_primary` refusal.
11. **A 13-key row in a workspace with no primary.** Expected: no choice and refused with `no_primary`, as now. A body naming the only hub on a 13-key is refused with the new sentence.
12. **`root` empty, `root` naming the primary, `root` with path characters such as `../x`.** Expected: empty and path-like are refused with `no_hub_named`. The primary's name writes the primary, recorded and undone as a body with no `root`.
13. **The primary removes a word that B keeps**, for example a stage. Expected: B's rows of options whose `from` names that list (`focus_lanes`, `categories`) show oculus's word kept, and Modified is not set by A's pruning.
14. **The config push after a write to B.** Expected: Settings re-reads B's listings and file (`refresh(B, pushed)`), and the row's `own` and line move.
15. **B's `config.yml` does not parse.** Expected: the row says so as for the primary (case 16), and a write naming B is refused with `not_parsed`.

## ADRs

None. `ls -d docs/adr` answers "No such file or directory", and `git ls-files | grep -i adr` prints nothing.

## Dictated text

None. `grep -n '"' .scratch/migration/agents/briefs/O85.md` shows only line 21's quotations of existing tree text (`HELP.md:527` and `data-map.md:260`), which match the tree, and the report-shape lines. The doc text of item 8 is described, not dictated. `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing.

## Declined to judge

- Whether `hubList`'s rule of no list with one hub is the right model for the per-row choice beyond what ruling 440 says.
- The HTTP status of the new refusals (a 404 like `new-entry`'s, or the 200 with `refused` the config writes answer with).
- Whether `linkedin_dir` should become per-hub in Settings, or the build should stop reading a second hub's LinkedIn folder. That is the orchestrator's ruling, since ruling 444 rests on the wrong premise.

Usage: a8ab0d4773e514752, claude-opus-5-5, 276151 tokens, 97 tool uses, 14 min 31 s (the run after its resume; the first run stopped on a 529 server error with no completion notice)

## Closed

Each finding is closed in `agents/briefs/O85.md` as follows.

- `linkedin_dir` is per hub: a premise correction booked in `plan.md` (the step line now lists 37 per-hub keys and 12 primary-only keys, and a Rulings bullet "O85 premise" records it; the choice of ruling 444 stands), a note in choice Z1033 of `choices.md`, the uncommitted `docs/data-map.md` section changed to "Twelve keys" without `linkedin_dir`, and the brief's premises, item 1 and item 9.
- Undo: `undo.ts` lines 90-140 and `tests/routes/edit/undo/undo.test.ts` are in the paths; item 2 says how `recordLayers` finds the hub; cases 3, 22 and 23.
- The page's list and family write, the `Writes` type, the folder lists and the unsaved guard: `editors/writer.ts`, `shapes.ts` lines 380-415, `editors/sources.ts`, `write-files.ts` and `tests/state/client/held-unsaved.test.ts` are in the paths; items 3, 4 and 5; cases 3, 20, 24 and 25.
- The value checks: `config-fit.ts` and `config-sources.ts` are in the paths; item 2 checks `folder` and `file` values under the named hub; cases 7, 11 and 25.
- The hub layer: item 5 takes a second hub's merged values and pruned defaults from the server's kept parse through a route the Settings view alone reads (decision 4), so `hub-layer.ts` stays out of the step; case 29 covers the primary pruning a word B keeps.
- The folders at 10 items: the key set goes to `src/lib/data/shapes/`, the hub choice inside `Item.svelte`, the route to `src/routes/api/(docs)/`, its handler to `src/lib/server/files/source/`, an optional split of `writes.svelte.ts` to `state/system/config/editors/`, and the new test to `tests/state/system/settings/`; "Paths this step writes" says no new file goes into a full folder.
- `docs/HELP.md:325`, `workspace-file.ts:55`, `writes.ts:29` and the head comment of `write-files.ts`: items 8 and 9.
- The tests rule: item 7 names the guarded entries G8, G9, G28 and G96, the builder names each new test's title and entry in the report, and the orchestrator writes it into `agents/guarded.md` at landing.
- Which cases are looks: marked "(look)" in "Cases".
- The 15 implied inputs: cases 18 to 30, with inputs 1, 12 and 15 folded into cases 18, 12 and 16, and case 31 for the route.
- Declined to judge: the HTTP status is decision 8.

