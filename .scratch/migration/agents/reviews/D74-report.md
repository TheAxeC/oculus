NOT done: one check is red after the step and needs Axel's ruling before it can go green: `tests/checks/config/config-folder.test.ts`, row 'gives every group a chord and a glyph, and no letter a key the workbench binds' (G12/G13), fails because the new Apps view makes the Apps group a listed group and that group has no `chord`, while decision 5 and `config/layout.yml:24` say an Apps group view is reached by `direct_chord: v`. It is a clash between the test's rule and the brief's decision, written up as open item 1 below with options and a recommendation; the row is not edited. Everything else in the brief, parts 1 to 13 and every case, is done.

## Open items

The state file's open items, verbatim (main checkout, `tools/oculus/.scratch/migration/orchestrator-state.md`, read with `sed -n '/^## Open items/,/^## Booked/p'`):

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

The list holds no entry. This step raises one, for the orchestrator to book (the builder does not write the plan files):

1. **The Apps group has no chord, and a held check says every group has one.** The step lists the Apps view as the first row of the Apps group (decision 5). Before the step the Apps group had no registration that is not an app, so `arrange(...)` over the static registrations did not list it and the row passed. After the step the group is listed and `isChorded` (`src/lib/state/workbench/navigation/catalogue.ts:170`, `section.label !== null && section.chord !== undefined`) is false for it, so the row fails: `AssertionError: expected [ { label: 'Apps', <horizontal ellipsis>(3) } ] to deeply equal []` (`npx vitest run tests/checks/config/config-folder.test.ts tests/checks/config/integrity.test.ts`). `config/layout.yml:36` is `apps: { label: "Apps", glyph: app }` and `config/layout.yml:24` ends "A group with no `chord` is counted under `direct_chord`."
   - (a) Give the Apps group a chord letter in `config/layout.yml`. The row holds as written. App views then leave `v` for that letter, which is a host-visible chord change nothing asked for and contradicts decision 5 ("an Apps group view is reached by `direct_chord: v`"); a free letter has to be chosen.
   - (b) The row accepts a group with no `chord` as counted under `direct_chord`, which is what `config/layout.yml:24` states, and keeps every other assertion (every other group has a letter, every group a glyph, the letters distinct, no letter a key the workbench binds). This widens a held check, so it needs Axel's yes.
   - Recommendation: (b). It is the cheaper option and also the better one: the configuration already states the rule (b) checks, and (a) moves every app view's chord to serve the test. (a) is not the lazy option here; (b) is the cheaper one and is recommended on the merits.

## The cases' first run

Every run below is from `tools/oculus` of a copy: `$S/base` is a scratch copy of the base (equal to `.agents/worktrees/D74-base`), `$S/after` an rsync of the worktree, `$S` = `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d74`. A harness is a vitest file in `$S/harness/` (none in the tree), run by `sh $S/run.sh <base|after> <file>`, which copies it to `tests/zz/` of the copy and runs `npx vitest run --project unit tests/zz/<file>`; its `note()` lines go to `$S/notes-<tree>-<file>.log`, quoted here. Every harness was run on both trees in this session's last pass; the after runs all pass: hpc 4 passed, focused 6, history-live 8, history-other 5, repos 10, hubfile 7, vocab 5, vocab-cache 1, watch58 1, float 5, reopen 7, refusal 3. A guarded entry's test rows (the base run is the step's changed test file run on a copy of the base, `$S/bt`, logs in `$S/btlogs/`) are in "Test rows by entry" below. No case was found that the brief's own rules get wrong in a way that stopped the work; the brief errors found are listed under "Brief errors".

Part 1, HPC (`hpc.test.ts`):
- 1. Base: `CASE1 {"status":"unreachable","hint":"the settings of this hub name no cluster (slurm.resource in .oculus/config/behavior.yml)","retryMin":2,"calls":0}`, `AssertionError: expected 'unreachable' to be 'unconfigured'`. After: `CASE1 {"status":"unconfigured","hint":"the settings of this hub name no cluster (slurm.resource in .oculus/config.yml)","calls":0}` (no `retryMin`, the runner never called over 30 fake minutes), `CASE1 words {"short":"no cluster","long":"..."}` for the status bar. Drawing half: look on landing, Live HPC float and status bar on a hub whose `.oculus/config.yml` sets no `slurm.resource`: the sentence in the normal text colour, no countdown, status item "no cluster".
- 2. Base: `CASE2 start {"status":"unreachable","calls":0}`, `push names {"calls":2,"status":"unreachable"}`, `push away {"status":"unreachable","callsMoreAfter30min":0}`, failed `expected 'unreachable' to be 'unconfigured'`. After: `start {"status":"unconfigured","calls":0}`, `push names {"calls":2,"status":"unreachable"}` (the poll ran at once), `push away {"status":"unconfigured","callsMoreAfter30min":0}`, `refresh {"status":"unconfigured","callsMore":0}`, `mid-poll {"status":"unconfigured","versionMoved":0}`.
- 3. Base and after: `CASE3 {"status":"unreachable","hint":"ssh: no route","retryMin":2,"calls":2}`.
- 4. Base and after: `CASE4 {"status":"unreachable","hint":"nosuch names no resource","retryMin":2}`.

Part 2, the focused tab (`focused.test.ts`, over `editor-status.svelte.ts`):
- 5. Base `CASE5 null`, `AssertionError: expected null to be '/x/a.note'`; after `CASE5 /x/a.note`.
- 6. Base `{"during":null,"after":null}`, failed; after `{"during":"/x/a.note","after":"/x/a.note"}`.
- 7. Base failed `expected null to be '/x/a.note'`; after passes (the tab unmounted and mounted in another pane answers `/x/a.note`).
- 8. Base and after `CASE8 null`.
- 9. Base and after `CASE9 /x/b.note`.
- 75. Base `CASE75 null`, failed; after `CASE75 /x/a.note`.
- 10. By reading: `src/lib/state/client/context.ts:561` and `:652` hand the commands and the debugger `focusedSource: () => editorStatus.focused()`, and the problems reader falls back to `editorStatus.focused()` (`context.ts:605`), so a project command and F8 read the hidden focused tab. Look on landing: a source tab focused, then Debug shown in its pane; a project command button and F8 act on that tab's file.

Part 3, History (`history-live.test.ts` is the red command of `D74-diagnosis.md`; `history-other.test.ts`):
- 38, 39, 40 (`it.each` 'shows %s in the open view', a structured write, an app's Write File, an Add Configuration). Base: three `AssertionError: expected false to be true`. After: pass.
- 41 'shows the write on top and keeps the older page the reader loaded'. Base failed `expected false to be true`; after passes (56 rows, `status.line` first, `earlier-0` last).
- 42 'shows a write made while its tab was hidden once the tab is shown'. Base failed; after passes.
- 43 'shows a write made while the page was not connected once it connects again'. Base failed; after passes.
- 44 'shows a write whose append cut the log to its window'. Base failed; after passes.
- 45 'shows two writes made at once'. Base failed; after passes. Case 45b (two appends in one millisecond): base `AssertionError: expected false to be true`; after `CASE45b [["same-2","2030-01-01T00:00:00.001Z"],["same-1","2030-01-01T00:00:00.000Z"]]`. Case 45c: base and after `["2030-01-01T00:00:00.000Z","2030-01-01T00:00:00.001Z"]`. The `changes` row of G9 is in "Test rows by entry".
- 46. Base and after: 46a passes, `CASE46b {"rows":50,"first":"status.line"}`, `CASE46c {"rows":1,"askedMore":0}`.
- Totals: base `Tests  8 failed (8)` (history-live), `Tests  1 failed | 4 passed (5)` (history-other); after 8 passed, 5 passed.

Part 4, Repositories (`repos.test.ts`, a scratch workspace of real git repositories under `$TMPDIR`):
- 11. Base `CASE11 ["/research-hub","/research-hub/tools/oculus","/claude","/gone"]`, `tops {}`, failed. After `CASE11 ["/research-hub"]`, `tops {"/research-hub":"/research-hub","/research-hub/tools/oculus":"/research-hub","/claude":"","/gone":""}`.
- 12. Base `rows ["/research-hub","/research-hub/.agents/worktrees/X","/scratch-repo"]`, failed. After `rows ["/research-hub"]`, `worktrees ["/research-hub","/research-hub/.agents/worktrees/X"]`, `changes of the scratch session {"repository":true,"untracked":["new.txt"]}`.
- 13. Base and after `[["/research-hub","research-hub"],["/research-hub/theaxec.github.io","theaxec.github.io"]]`.
- 14. Base and after `["/research-hub","/hub-linked"]`.
- 15. Base `4`, `expected '4' to be '2'`; after `2`.
- 16. Base `{"name":"oculus","choices":["research-hub","oculus"]}`, failed; after `{"name":"research-hub","choices":["research-hub"]}`.
- 17. Base and after `["/research-hub"]`.
- 18. Base `["/research-hub","/claude"]`, failed; after `slow {...,"error":"Git did not finish within 0 seconds, so it was stopped",...,"top":""}`, `["/research-hub"]`.
- 19. Base `{"shown":"/research-hub/tools/oculus","closed":["/research-hub/tools/oculus","/nowhere"]}`, failed; after `{"shown":"/research-hub","closed":["/research-hub"]}`.
- 76. Base `{"timedOutRows":2,"linkRows":["/research-hub","/link-to-hub"]}`, failed; after `{"timedOutRows":2,"linkRows":["/research-hub"]}`.
- Totals: base 7 failed of 10; after 10 passed.

Part 5, Apps (page cases, checked by reading `src/lib/views/apps/Apps.svelte`, `config/layout.yml`'s `apps` arrangement and `state/system/apps/words.ts`; each is a look on landing):
- 20. Fresh layout, Apps button: the Apps view in the left pane lists every app with glyph, title and state; the right pane is empty (`config/layout.yml` `apps` arrangement is a split of `[apps]` and `view: []`). Base: one empty pane, "Files and documents you open on this page appear here."
- 21. An app waiting for approval reads "waiting for approval" and a press shows its approval panel in the right pane (`asksApproval`, `apps.review`); a kept app whose files changed reads "changed since approval"; an app not kept whose files changed reads "waiting for approval" (`appStateWords`).
- 22. A disabled app reads "disabled"; Enable in its row menu enables it and the row reads "approved".
- 23. A root app's row names its root; its menu has no Remove (`apps.choices`).
- 24. Typing part of a title keeps the matching rows (`matching`, title or name, case ignored).
- 25. No app: `apps.list_none` with Add app from folder under it; a search matching none: `apps.list_no_match` ("No app matches").
- 26. Reset layout on the Apps page: the split comes back (the arrangement is the reset target).

Part 6, pinned tabs and Reopen Closed Tab (`reopen.test.ts` over the layout store of `createClientState()`; page cases a look):
- 27. Look on landing, fresh layout, Help button: every Help tab shows a pin where its close control is; Close All in a tab menu closes none; Delete on the active one closes nothing. Unit reach: arrangements rows 'pins every tab the %s page names' (G54).
- 28. Look on landing in the desktop app: Cmd+W on the Help page changes nothing; on a pane with pinned tabs and one unpinned tab, a pinned one active, Cmd+W shows the unpinned tab and closes nothing (`PaneView.svelte`; `config/text/desktop.yml` row "close the active tab of the focused pane, or show the first tab that is not pinned when the active one is pinned").
- 29. Look on landing: Close in a pinned tab's menu closes it; a press on the pin unpins it at once.
- 30. Base: `TypeError: client.layout.hookClosed is not a function`. After: `CASE30 after close [["projects","{}",false],["coauthor","{}",false]]`, `after reopen [["projects","{}",false],["files","{\"root\":\"hub\",\"path\":\"projects/x\"}",false],["coauthor","{}",false]]` (the tab back at index 1 with its state); then `coauthor` and `files` closed in that order, `first reopen of two [["projects","{}",false],["files",...,false]]` (the one closed last), `second reopen of two [["projects","{}",false],["files",...,false],["coauthor","{}",false]]` (the one before).
- 31. Base TypeError as above. After: `after close all []`, `after reopen [["projects",...],["coauthor",...],["archive",...],["personal",...]]`.
- 32. Base TypeError. After: `CASE32 [["projects","{}",true],["coauthor","{}",true],["archive","{}",false]]`.
- 33. Base TypeError. After: `count after 21 closes 20`, `opened answers 20`, `last answer false`, `f1 back false`, `count at the end 0`. The palette leaves the command out with the list empty by reading: `Palette.svelte:251` passes `closedCount() > 0` as `reopenable` to `commands()` (`palette.ts:456`, `:490`).
- 34. Base TypeError. After: `CASE34 view terminal`, `state {"id":"b3b3fd6e-5d15-4998-9d67-bcf4b92fe2c9","terminals":[],"row":[],"shares":[],"shown":null,"composing":true,"label":""}`, `shells started [[true,"/hub/projects/x"]]` (a new state, a new shell in the folder the closed tab's shell ran in).
- 35. By reading: `resolve.ts:177-179` answers `{ kind: 'reopen-closed-tab' }` for Cmd+Shift+T in the desktop app, `workbench-keys.svelte.ts:268-270` runs `layout.reopenClosed()`; in a browser the palette's `:reopen-closed-tab` (`docs/palette.md:98`). Look on landing in the desktop app.
- 36. Look on landing: Reset layout on Academic Life gives pinned tabs; a page saved before this step keeps its tabs unpinned until Reset layout (no code converts a saved page).
- 77. Base TypeError. After: `CASE77 answer true`, `tabs ["projects","coauthor"]`, `left on the list 0` (the source tab whose file is gone is skipped, the batch before it, `coauthor`, comes back). A close made by the code is not put on the list: only `rememberClosed` puts tabs there and only the reader's close commands call it (`tabs/closed.ts` head comment; by reading).
- 78. Base `CASE78 tabs [["help",false],["doc",false],["memories",false]]`, failed `expected [ [ 'help', false ], <horizontal ellipsis>(2) ] to deeply equal [ [ 'doc', true ], <horizontal ellipsis>(2) ]`. After `[["doc",true],["help",false],["memories",false]]`, `active h`.
- 37. Arrangements rows (G54), below.

Part 7, each hub's vocabulary (`vocab.test.ts`, notes only, and `vocab-cache.test.ts`):
- 47. Base `case47 second second:heart {"tone":"red","label":"Heart main"}`; after `{"tone":"blue","label":"Heart second"}` (primary stays `{"tone":"red","label":"Heart main"}`).
- 48. Base `second:kidney {"tone":"grey","label":"second:kidney"}`; after `{"tone":"blue","label":"Kidney second"}`; primary `kidney` `{"tone":"grey","label":"kidney"}` on both.
- 49. Base `second:heart {"tone":"red","label":"Heart main"}`; after `{"tone":"grey","label":"second:heart"}`.
- 50. Base cards `Core ML main` for both hubs, facets `[{"theme":"core-ml","label":"Core ML main","count":2}]`; after `Core ML main` and `Core ML second`, facets `[{"theme":"core-ml","label":"Core ML main / Core ML second","count":2}]`.
- 51. Base `Data main` for both; after `Data main` and `Data second`, facets `Data main / Data second`.
- 52. Base and after `primary heart {"tone":"red","label":"Heart main"}`, `unlisted liver {"tone":"grey","label":"liver"}`.
- 83. Base `second:kidney {"tone":"grey",...}`; after `{"tone":"blue","label":"Kidney second"}` from the payload the page is built with (`routes/+page.server.ts` hands `hubs: configCache.vocab()`). The frame itself: look on landing.
- Config cache: base `TypeError: cache.vocab is not a function`; after `cache first lists {"main":["heart"],"second":["kidney"]}`, `cache after edit lists {"main":["heart"],"second":["lung"]}`.

Part 8, one settings file (`hubfile.test.ts`, `watch58.test.ts`):
- 53. Base `{"isHub":false,"findings":[],"slurm":"","domains":{}}`, failed; after `{"isHub":true,"findings":[],"slurm":"mycluster","domains":{"heart":{"label":"Heart","color":"#dc2626"}}}`.
- 54. Base `[]`, failed `expected [] to deeply equal [ [ <horizontal ellipsis>(2) ] ]`; after `[["/.oculus/config.yml","theme"]]`.
- 55. Base `{"isHub":true,"memories_dir":".oculus/photos"}`, failed; after `{"isHub":false,"memories_dir":".oculus/memories"}`.
- 56. Settings edit and undo: routes/config-key and server/edit/config-key rows (G8, G9) below.
- 57. app-setting rows (G77) below.
- 58. Base `CASE58-before utwente`, failed `expected 1 to be greater than 1` (no config push after the edit); after `CASE58-before utwente`, `CASE58-after edited-cluster`.
- 59. The first write into a hub with no settings file makes `.oculus/` and `.oculus/config.yml` and no `.oculus/config/`: server/edit/config-key row 'a key of the hub list, with a hub that holds no settings file', `created: [join(hub, '.oculus'), join(hub, HUB_FILE)]` (G8). See "Brief errors" on the word "seed".
- 79. Base `{"empty":{"isHub":false,...},"list":{"isHub":false,...},"broken":{"isHub":false,...},"twice":{"isHub":false,...},"nested":{"keys":[],"resource":""}}`, failed; after each `{"isHub":true,"files":[true],"slurm":""}` and `nested {"keys":["slurm.poll_min"],"resource":"x"}`.
- 80. hub-secrets row (G3) below.
- 81. config-cache rows (G61) below.

Part 9, one list of record files (`hubfile.test.ts`):
- 60, 61. Base `{"venues":"registries/venues.yml","people":"registries/people.yml","unnamed":["venues","datasets","pillars","domains","people","organisations","resources","funding"]}`, failed `expected 'registries/venues.yml' to be 'elsewhere/venues.yml'`; after `{"venues":"elsewhere/venues.yml","people":"registries/people.yml","unnamed":["datasets","pillars","domains","funding","people","organisations","resources"]}`. The venue card's deadline edit writes the `collections` entry's file, which is now the same file (`viewSourceFile('collection', ...)`).
- 62. Base `{"keys":[],...,"venues":"registries/venues.yml","leads":"feeds/position-leads.yml"}`, failed `expected [] to include 'venues_file'`; after `{"keys":["venues_file"],"more":[...,["venues","collection key venues is already read from .../one.yml"]],"venues":"one.yml","leads":"feeds/my-leads.yml"}`.
- 63. Base and after `{"venues":"registries/venues.yml","datasets":"registries/data.yml","pillars":"registries/pillars.yml","domains":"registries/domains.yml","funding":"funding/funding.yml","people":"registries/people.yml","organisations":"registries/organisations.yml","resources":"registries/resources.yml"}`.

Part 10, refusal words (`refusal.test.ts`; greps):
- 64. Base shipped words `[{"field":"retrieval","reason":"method takes one of direct, physionet"}]`; the changed-catalog half fails on base `Error: no line type_options: '{0} takes one of {1}'` (base has no catalog line). After: shipped the same words, changed catalog `[{"field":"retrieval","reason":"CHANGED: method is one of direct, physionet"}]`.
- 65. Base: the literal 'the leads feed does not allow that field' (base `tests/server/edit/feeds.test.ts`). After: `words(into.config.text, 'server.feeds.field_not_allowed', 'leads')` in feeds.test.ts, which passes.
- 66. Base `a new entry needs a non-empty id`, changed half `Error: no line new_key_empty`; after changed catalog `CHANGED id`.
- 67. Base `an entry needs a non-empty id`, changed half `Error: no line key_empty`; after `CHANGED id`.
- 68. `grep -rn "reason: \`\|reason: '\|fail('\|refuseAll(.*'" src/lib/server/edit | wc -l`: base 140, after 0. `grep -rn "error: \`[A-Za-z]\|error: '[A-Za-z][a-z]* [a-z]" src/lib/server/edit | wc -l`: base 13, after 0. `grep -rn "new Error(\`\|new Error('" src/lib/server/edit | wc -l`: base 5, after 0. `npx vitest run tests/checks/source/keys.test.ts`: `Tests  8 passed (8)`; on the base the step's keys.test fails to load `Cannot find module '../../../src/lib/server/edit/yaml/why.ts'`.

Part 11, entry pages right after a write (G28 rows below; page cases a look):
- 69, 70, 82: form-draft rows. Base: `Cannot find module '../../../src/lib/state/forms/settled.svelte.ts'` (the rows run on `createSettled`).
- 71. Unit reach: form-draft row 'shows an entry a write added from its first frame, and gives way to the snapshot'. First frame: look on landing, `:task-add Review the rebuttal` with Shift+Enter, Add on Organisations, the added notice's Open: the page shows the entry from its first frame and never `entry.unknown`.
- 72. Look on landing: delete a pillar on its page, Undo in History: the row reads as the entry put back; an undo of an Add reads as the entry removed; an undo of a field write as the field set back (`History.svelte` `kindOf` over `undoes`).

Part 12, the card on a feed entry's page (by reading `Entry.svelte`, `shared/card/feed/`; a look):
- 73. A lead's page: `LeadCard` above the editor with its status controls and the applied hand-off (`applyFromLead`, `shared/card/feed/lead-apply.ts`, the same function the Leads view calls).
- 74. A Lit Watch paper's page: `RadarCard` above the editor, Dismiss writes `dismissed`; Leads and Lit Watch draw the same components. After Delete the page has no entry (`page === null`) and shows `entry.unknown`, as a collection entry's page does.

Part 13, the Float group (`float.test.ts` over `arrange`, the chord reader and the key sheet rows):
- 84. Base `Float null`, `Focus ["focus","hpc","usage"]`, System ending `"processes","workbenches"`. After `Float ["hpc","usage","workbenches"]`, `Focus ["focus"]`, System ending `"processes"`.
- 85. Base `w null`, `f ["focus","hpc","usage"]`, failed `expected undefined to be 'workbenches'`; after `w ["hpc","usage","workbenches"]`, `f ["focus"]`. `w` then `1` with the float closed: by reading, the chord runs `options.layout.openView(action.view, undefined, pageOf())` (`workbench-keys.svelte.ts`), the call `f` then `2` made on the base; Live HPC, Usage and Workbenches are `unique: true`, so a float that shows the view is shown and focused.
- 86. Base `Help ["help","memories","Research approach","Agent approach","HPC how-to","Data map"]`, failed; after `["help","memories","Apps guide","Research approach",...]`, `h` digit 3 is `doc:engine:docs/apps.md`.
- 87. Base `first pane ["files","repositories","search","latex","problems"]`; after `["files","repositories","search","references","latex","problems"]`.
- 88. Base `w rows []`, `f rows ["f1-f3 | open a view of the Focus page's group"]`; after `w rows ["w1-w3 | open Live HPC, Usage or Workbenches, the views of the float's group, in the float when it shows them"]`, `f rows ["f1 | open the Focus view of the Focus page's group"]`.

## DONE / NOT DONE

Every command from `tools/oculus` of the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, after the last change.

| Item | State | Command | Output as printed |
|---|---|---|---|
| Part 1, no-cluster HPC | DONE | `sh $S/run.sh after hpc.test.ts` | `Tests  4 passed (4)` |
| Part 2, focused source tab | DONE | `sh $S/run.sh after focused.test.ts` | `Tests  6 passed (6)` |
| Part 3, live History (red command) | DONE | `sh $S/run.sh base history-live.test.ts`; `after` | base `Tests  8 failed (8)`; after `Tests  8 passed (8)` |
| Part 4, Repositories | DONE | `sh $S/run.sh after repos.test.ts` | `Tests  10 passed (10)` |
| Part 5, Apps page | DONE, look on landing | reading; `npm run check` | `COMPLETED 4000 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Part 6, pinned tabs, Reopen Closed Tab | DONE | `sh $S/run.sh after reopen.test.ts` | `Tests  7 passed (7)` |
| Part 7, each hub's vocabulary | DONE | `sh $S/run.sh after vocab.test.ts`; `vocab-cache.test.ts` | `Tests  5 passed (5)`; `Tests  1 passed (1)` |
| Part 8, `.oculus/config.yml` | DONE | `sh $S/run.sh after hubfile.test.ts`; `watch58.test.ts` | `Tests  7 passed (7)`; `Tests  1 passed (1)` |
| Part 9, one list of record files | DONE | same hubfile run | `Tests  7 passed (7)` |
| Part 10, refusal words | DONE | the three greps; `sh $S/run.sh after refusal.test.ts` | `0`, `0`, `0`; `Tests  3 passed (3)` |
| Part 11, entry pages after a write | DONE | guarded run below | `Tests  392 passed (392)` |
| Part 12, card on a feed page | DONE, look on landing | reading `Entry.svelte` | n/a |
| Part 13, Float group | DONE | `sh $S/run.sh after float.test.ts` | `Tests  5 passed (5)` |
| Guarded entries' test files (23 files) | DONE | `npx vitest run <the 23 changed test files> --reporter=verbose --testTimeout 0` | `Test Files  23 passed (23)`, `Tests  392 passed (392)` |
| lint | DONE | `npm run lint` | exit 0; last line `> eslint .` |
| format | DONE | `npm run format:check` | `All matched files use Prettier code style!` |
| type check | DONE | `npm run check` | `1791903051476 COMPLETED 4000 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| diagrams | DONE | `npm run diagrams` | exit 0; last line `docs/diagrams/writes.svg` |
| verify list | DONE (over its time limit) | `npm run test:quick` | `test:quick: 72.5 s (limit 45.0 s); every command passed` then `test:quick: over the time limit` |
| ASCII gate | DONE | `LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)` (spec.md's form without `bin`) | exit 0, no output |
| tree checks | DONE | `npx vitest run tests/checks/source/keys.test.ts tests/checks/diagrams tests/checks/tree --testTimeout 0 --hookTimeout 0` | `Test Files  6 passed (6)`, `Tests  94 passed (94)` |
| other source checks | DONE | `npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts --testTimeout 0` | `Tests  5 passed (5)` |
| config-folder and integrity | NOT DONE (open item 1; the rest is the sparse checkout) | `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/config/integrity.test.ts` | `Tests  3 failed | 29 passed (32)` |
| folder check | DONE | `sh utils/folder-check.sh` | exit 0, no output |
| size check | DONE | `sh utils/size-check.sh` | exit 0, no output |
| unused exports | DONE | `sh utils/unused-exports.sh`, compared with the base's run | two lines not in base, each a narrower form of a base line (below); `Unused exports (238)` against base `Unused exports (246)` |
| palette page | DONE | `npm run docs:palette`, md5 before and after | `dd89abcf67eceaea3266e8c9fa3b51a7` both |
| hub and doc lines ASCII | DONE | added lines of HELP.md, DESIGN.md, README.md, docs/apps.md, docs/palette.md, demo/, the five hub files through `LC_ALL=C grep -c '[^ -~]'` | `0` |

config-folder and integrity after the step: 'gives every group a chord and a glyph, and no letter a key the workbench binds' (`AssertionError: expected [ { label: 'Apps', <horizontal ellipsis>(3) } ] to deeply equal []`, open item 1); 'names a group of its own and a path under the hub for every document' (`Error: expected any number of assertion, but got none`, the worktree holds no `.oculus`); integrity 'validates with no findings' (`AssertionError: expected [ Array(239) ] to deeply equal []`, findings such as "project fed-faithful-ecg names the domain heart, which is not in the domains of .oculus/config.yml in the hub (of config/catalogs/vocab.yml when the hub sets none); its slides are drawn in the neutral tone", since the worktree has no `.oculus/config.yml`). On the base copy with no hub (`$S/base`): `Tests  23 passed | 9 skipped (32)`. On the base engine inside the hub's data (`$S/hubbase`, the hub's folders linked): `Tests  5 failed | 27 passed (32)`: the same 'names a group' row, integrity with `expected [ Array(265) ] to deeply equal []` (25 of them "main.md is outside" findings that come from the linked copy), and three deck and equation rows that fail only in the linked copy (`bt-operator-theory: expected 'missing' to be 'ok'`); the chord row passes there. Both run on main once the orchestrator writes `.oculus/config.yml`.

Unused exports after, not in base: `src/lib/state/feeds/leads.ts: isDeclined` and `src/lib/state/feeds/radar.ts: bucketsOf`; the base printed `leads.ts: isDeclined, isExpired` and `radar.ts: bucketsOf, isDismissed`, and `isExpired` and `isDismissed` are now read by `Entry.svelte:65-66`.

Runs of the verify list: four `npm run test:quick` runs, each after `npm run diagrams`. Runs 1 to 3 were each followed by more edits (naming, comment and test-title fixes, and three comment lines the history check flagged), so run 4 is the one after the last change. No whole-suite command was run. Covering runs named their files: the test files that import the changed files, in four chunks, single files during the work, and the folders `tests/checks/source`, `tests/checks/imports`, `tests/checks/config`, `tests/checks/look`, `tests/checks/utils` (the checks the comments and config changes reach, which `test:quick` does not cover).

Standards pages: the configuration lists `tools/oculus/.scratch/migration/agents/spec.md` alone, and it states no rule on list items or sentence length beyond its prose rules (plain, ASCII, no em dashes, no 'not X but Y'); new sentences were read against those. No ADR folder exists (`ls docs/adr docs/decisions`: no such directory).

## Terms

No `docs/glossary.md` exists in this repository (`ls` of `tools/oculus/docs/glossary.md` and `docs/glossary.md` in the worktree and the main checkout: no such file).

## Files with line counts

Engine (`tools/oculus/`), changed:
`config/appearance.yml` 93, `config/behavior.yml` 325, `config/catalogs/options.yml` 1488, `config/catalogs/vocab.yml` 250, `config/layout.yml` 285, `config/sources.yml` 101, `config/text/app.yml` 297, `config/text/desktop.yml` 66, `config/text/findings.yml` 335, `config/text/server.yml` 512, `config/text/views/academic/present.yml` 82, `config/text/views/academic/slides.yml` 48, `config/text/views/apps/apps.yml` 197, `config/text/views/feeds/linkedin.yml` 34, `config/text/views/sources/doc.yml` 19, `config/text/views/sources/files.yml` 294, `config/text/views/system/history.yml` 98, `config/text/views/system/machine/hpc.yml` 82, `config/text/views/system/workbench.yml` 243, `src/app.d.ts` 35, `src/hooks.server.ts` 109, `src/lib/data/helpers/files/apps/settings.ts` 79, `src/lib/data/helpers/files/private-folders.ts` 34, `src/lib/data/helpers/hub-names.ts` 323, `src/lib/data/helpers/keys/oculus/resolve.ts` 371, `src/lib/data/index.ts` 696, `src/lib/data/model/index.ts` 808, `src/lib/data/model/model-collections.ts` 199, `src/lib/data/model/model-entities.ts` 603, `src/lib/data/model/model-sessions.ts` 765, `src/lib/data/snapshot/normalise.ts` 732, `src/lib/data/sources/collections.ts` 119, `src/lib/data/sources/config.ts` 95, `src/lib/data/sources/config/catalogs.ts` 339, `src/lib/data/sources/config/merge.ts` 423, `src/lib/data/sources/manifests.ts` 445, `src/lib/server/content/docs.ts` 856, `src/lib/server/content/wallpaper.ts` 154, `src/lib/server/core/changes.ts` 420, `src/lib/server/core/git/state.ts` 375, `src/lib/server/edit/entry-edit/entries.ts` 391, `src/lib/server/edit/entry-edit/host-status.ts` 81, `src/lib/server/edit/entry-edit/lines.ts` 361, `src/lib/server/edit/entry-edit/merge.ts` 431, `src/lib/server/edit/entry-edit/subtasks.ts` 284, `src/lib/server/edit/feeds.ts` 788, `src/lib/server/edit/writes.ts` 867, `src/lib/server/edit/writes/bodies.ts` 592, `src/lib/server/edit/writes/config/app-setting.ts` 197, `src/lib/server/edit/writes/config/config-checks.ts` 594, `src/lib/server/edit/writes/config/config-key.ts` 179, `src/lib/server/edit/writes/config/config-value.ts` 253, `src/lib/server/edit/writes/entries.ts` 593, `src/lib/server/edit/writes/manifest.ts` 753, `src/lib/server/edit/writes/restore.ts` 150, `src/lib/server/edit/writes/subtasks.ts` 385, `src/lib/server/edit/writes/undo.ts` 580, `src/lib/server/edit/yaml/yaml-edit.ts` 861, `src/lib/server/files/roots.ts` 117, `src/lib/server/files/workspace/folders.ts` 296, `src/lib/server/files/workspace/follow.ts` 125, `src/lib/server/files/workspace/paths.ts` 51, `src/lib/server/machine/apps/read/scan.ts` 326, `src/lib/server/machine/hpc/host.ts` 122, `src/lib/server/machine/hpc/poll.ts` 392, `src/lib/server/root/config-seed.ts` 48, `src/lib/server/root/context.ts` 874, `src/lib/server/root/process/config-cache.ts` 127, `src/lib/server/root/watch/apps.ts` 492, `src/lib/server/root/watch/git.ts` 878, `src/lib/server/root/watch/portfolio.ts` 821, `src/lib/shell/keys/Palette.svelte` 530, `src/lib/shell/keys/rows/CommandRows.svelte` 181, `src/lib/shell/keys/workbench-keys.svelte.ts` 589, `src/lib/shell/panes/PaneView.svelte` 518, `src/lib/shell/panes/strip/close-question.svelte.ts` 113, `src/lib/shell/Workbench.svelte` 520, `src/lib/state/client/context.ts` 873, `src/lib/state/client/selectors.svelte.ts` 676, `src/lib/state/client/shapes/client-state.ts` 190, `src/lib/state/client/shapes/payloads.ts` 277, `src/lib/state/client/socket.svelte.ts` 454, `src/lib/state/client/writes.svelte.ts` 856, `src/lib/state/forms/form-draft.ts` 164, `src/lib/state/forms/page-entry.ts` 369, `src/lib/state/forms/schema.ts` 476, `src/lib/state/life/pictures/wallpapers.svelte.ts` 84, `src/lib/state/sessions/changes.svelte.ts` 244, `src/lib/state/sessions/terminals.svelte.ts` 879, `src/lib/state/sessions/view-source.ts` 86, `src/lib/state/shared/page/install.ts` 29, `src/lib/state/shared/stores/shapes.ts` 449, `src/lib/state/shared/words/themes.ts` 113, `src/lib/state/shared/words/tones.ts` 268, `src/lib/state/sources/explorer/view/limit.ts` 74, `src/lib/state/sources/explorer/view/place.ts` 222, `src/lib/state/sources/fs.svelte.ts` 852, `src/lib/state/sources/repositories/repositories.ts` 807, `src/lib/state/system/apps/apps.svelte.ts` 868, `src/lib/state/system/apps/words.ts` 149, `src/lib/state/system/config/config-files.ts` 95, `src/lib/state/system/config/groups.ts` 377, `src/lib/state/system/config/messages.ts` 59, `src/lib/state/system/config/rows.ts` 407, `src/lib/state/system/config/write.ts` 137, `src/lib/state/workbench/layout.svelte.ts` 811, `src/lib/state/workbench/layout/access.ts` 48, `src/lib/state/workbench/layout/index.ts` 147, `src/lib/state/workbench/layout/saved/docs.ts` 66, `src/lib/state/workbench/navigation/arrangement.ts` 222, `src/lib/state/workbench/navigation/catalogue.ts` 366, `src/lib/state/workbench/navigation/editor-status.svelte.ts` 207, `src/lib/state/workbench/navigation/status.ts` 597, `src/lib/state/workbench/palette.ts` 743, `src/lib/state/workbench/rail-badges.svelte.ts` 301, `src/lib/views/boards/editor/Editor.svelte` 298, `src/lib/views/boards/entry/Entry.svelte` 342, `src/lib/views/boards/person/Person.svelte` 380, `src/lib/views/boards/project/Project.svelte` 209, `src/lib/views/boards/projects/Projects.svelte` 391, `src/lib/views/feeds/leads/Leads.svelte` 315, `src/lib/views/feeds/radar/Bucket.svelte` 108, `src/lib/views/feeds/radar/Radar.svelte` 205, `src/lib/views/sessions/session-detail/session-sections.ts` 55, `src/lib/views/shared/explorer/rooted-tree.svelte.ts` 253, `src/lib/views/shared/forms/entry/edit/EntryEditor.svelte` 218, `src/lib/views/shared/forms/Subtasks.svelte` 295, `src/lib/views/sources/data/Data.svelte` 149, `src/lib/views/sources/files/control/editor-closing.ts` 52, `src/lib/views/sources/files/Files.svelte` 374, `src/lib/views/sources/files/sections/OpenEditors.svelte` 335, `src/lib/views/sources/files/sections/Timeline.svelte` 409, `src/lib/views/sources/repositories/Repositories.svelte` 514, `src/lib/views/sources/source/Source.svelte` 514, `src/lib/views/sources/source/status/tab-file.svelte.ts` 94, `src/lib/views/sources/venues/Venues.svelte` 216, `src/lib/views/system/history/History.svelte` 442, `src/lib/views/system/machine/hpc/Head.svelte` 122, `src/lib/views/system/machine/hpc/Hpc.svelte` 135, `src/lib/views/system/machine/usage/Usage.svelte` 367, `src/lib/views/system/workbench/Catalogue.svelte` 412, `src/lib/views/system/workbench/Settings.svelte` 378, `src/lib/views/system/workbench/settings/EditLink.svelte` 40, `src/lib/views/system/workbench/settings/List.svelte` 195, `src/lib/views/system/workbench/settings/other-rows/WallpaperPicker.svelte` 83, `src/lib/views/system/workbench/Workbenches.svelte` 361, `src/routes/+page.server.ts` 61, `src/routes/+page.svelte` 337, `src/routes/find/+page.server.ts` 17, `src/routes/present/print/+page.server.ts` 18, `src/routes/present/show/+page.server.ts` 18, `src/routes/views.ts` 241, `tests/checks/config/arrangements.test.ts` 75, `tests/checks/config/config-folder.test.ts` 624, `tests/checks/config/config.test.ts` 689, `tests/checks/source/keys.test.ts` 639, `tests/checks/tree/allow-styling.ts` 103, `tests/data/hubs/hub-folders.test.ts` 284, `tests/data/sources/manifests.test.ts` 769, `tests/data/sources/scan.test.ts` 122, `tests/fixtures/hubs/workspace.ts` 95, `tests/fixtures/sessions-fixture.ts` 197, `tests/routes/docs/deck.test.ts` 192, `tests/routes/edit/apps/app-setting.test.ts` 203, `tests/routes/edit/config-key.test.ts` 167, `tests/routes/hubs/hub-secrets.test.ts` 284, `tests/routes/hubs/hub-writes.test.ts` 521, `tests/server/core/changes.test.ts` 502, `tests/server/edit/config-key.test.ts` 289, `tests/server/edit/config-value.test.ts` 148, `tests/server/edit/feeds.test.ts` 415, `tests/server/edit/writes-collection.test.ts` 244, `tests/server/edit/writes-fixture.ts` 205, `tests/server/edit/writes.test.ts` 737, `tests/server/git/clone-exclude.test.ts` 247, `tests/server/git/git-scan-depth.test.ts` 264, `tests/server/root/config-cache.test.ts` 196, `tests/server/root/context-fixture.ts` 214, `tests/shell/panes/strip/app-editor-close.test.ts` 130, `tests/shell/rail/rail-fixture.ts` 46, `tests/state/forms/form-draft.test.ts` 295, `tests/state/forms/page-entry.test.ts` 199, `tests/state/sources/clone-after.test.ts` 221, `HELP.md` 498, `DESIGN.md` 742, `README.md` 49, `docs/apps.md` 1014, `docs/palette.md` 185, `demo/README.md` 5, `demo/registries/resources.yml` 23.

New: `src/lib/server/edit/yaml/why.ts` 74, `src/lib/state/forms/settled.svelte.ts` 136, `src/lib/state/system/config/view/hub-file.ts` 40, `src/lib/state/workbench/layout/tabs/closed.ts` 95, `src/lib/state/workbench/layout/tabs/instances.ts` 412, `src/lib/state/workbench/layout/tabs/reopen.svelte.ts` 132, `src/lib/views/apps/Apps.svelte` 228, `src/lib/views/shared/card/feed/LeadCard.svelte` 266, `src/lib/views/shared/card/feed/RadarCard.svelte` 303, `src/lib/views/shared/card/feed/lead-apply.ts` 54, `src/lib/views/shared/card/project/ProjectCard.svelte` 516, `demo/.oculus/config.yml` 60.

Deleted: `src/lib/state/system/config/view/hub-layer.ts`, `src/lib/state/workbench/layout/instances.ts` (moved to `layout/tabs/instances.ts`), `src/lib/views/feeds/leads/LeadCard.svelte`, `src/lib/views/feeds/radar/RadarCard.svelte`, `src/lib/views/shared/card/ProjectCard.svelte` (moved under `shared/card/feed/` and `shared/card/project/`), `demo/.oculus/config/behavior.yml` and `demo/.oculus/config/catalogs/vocab.yml` (the demo hub's two old settings files, now `demo/.oculus/config.yml`). No test file was deleted.

Generated by `npm run diagrams`: `docs/diagrams/channels.dot` 415, `channels.svg` 2300, `layer-data.dot` 88, `layer-data.svg` 431, `layer-server.dot` 156, `layer-server.svg` 764, `layer-shell.dot` 135, `layer-shell.svg` 611, `layer-state.dot` 170, `layer-state.svg` 838, `layer-views.dot` 184, `layer-views.svg` 832, `layers.dot` 90, `layers.svg` 493, `writes.dot` 310, `writes.svg` 1441.

Hub: `registries/data.yml` 1068, `registries/venues.yml` 1063, `registries/domains.yml` 55, `registries/resources.yml` 29, `docs/DATA-MAP.md` 578.

Files written outside the brief's "Paths this step writes", each needed by the change: `src/lib/state/sessions/terminals.svelte.ts` (start a shell in a reopened Terminal tab's folder, case 34); `src/routes/views.ts` (an app view's registration order counts from 1 behind the Apps view); `src/lib/shell/Workbench.svelte` (the Apps guide listed and opened from the Help group, part 13); `config/text/desktop.yml` (the Cmd+W and Cmd+Shift+T rows of the key sheet); `config/text/views/system/workbench.yml` (key `settings_layer_absent` renamed `settings_hub_file_absent` with the code's rename); `src/lib/data/model/model-collections.ts` and its export in `src/lib/data/model/index.ts` (`entryTitleOf`, `entryIdOf`, shared by the snapshot and the pages store, so `page-entry.ts` imports no snapshot module); `src/lib/data/helpers/files/apps/settings.ts`, `src/lib/server/content/docs.ts`, `src/lib/views/system/workbench/settings/EditLink.svelte`, `List.svelte`, `other-rows/WallpaperPicker.svelte`, `src/lib/views/sessions/session-detail/session-sections.ts`, `src/lib/views/shared/forms/Subtasks.svelte`, `src/lib/views/boards/project/Project.svelte` (comments that named the old folder, the old layer or a moved file); `src/lib/views/sources/files/Files.svelte` and `src/lib/state/sources/fs.svelte.ts` (comments that said the workspace's roots come from the hub's `sources.yml`, rewritten to the workspace file); `src/lib/data/sources/collections.ts` (the first `collections` entry for a key is read, part 9), `src/lib/data/sources/config.ts` (exports `hubVocabOf`), `src/lib/state/client/shapes/client-state.ts`, `src/lib/state/client/writes.svelte.ts`, `src/lib/state/forms/schema.ts` (the settled store of part 11 handed to the writes and the project editor); `src/routes/find/+page.server.ts`, `src/routes/present/print/+page.server.ts` (each hub's lists in the first frame, as `present/show` has them); `demo/.oculus/config.yml`, `demo/README.md:3`, `demo/registries/resources.yml:1` (the demo hub moved to the one file).

## Judgment calls

- `gitRoots()` readers, each with its treatment of a second root of one repository:
  - `Repositories.svelte`, `rail-badges.svelte.ts` (`repositoriesBadge`), `navigation/status.ts` (the repository item and its list): moved to `selectors.repositories()` (`repositoryGroups`), one row, one count and one name per top folder.
  - `views/sources/source/status/tab-file.svelte.ts` and `views/sources/files/sections/Timeline.svelte`: `readableRepositoryRoots` over the groups; a file under a second root is that repository's file, read through the root that shows it, so the branch and the history are the repository's once.
  - `views/shared/explorer/rooted-tree.svelte.ts`: reads each repository once through its shown root, since the decoration paths are relative to the top.
  - Left on `gitRoots()`, since each needs the folder that holds a file and names no repository: `shell/keys/Palette.svelte:181` `taskRepoOf` (the deepest root holding the file, whose tasks run), `state/system/machine/debug/debug.svelte.ts:341` and `:415` `repoOfFile` (the launch configuration's folder and the served check), `state/sessions/terminal/commands.svelte.ts:823` `runDefault` (the deepest root's commands file), `views/shared/card/project/ProjectCard.svelte:136` (whether the project's folder is a root), `views/shared/explorer/tree/control/picks.svelte.ts:98` (whether a tree row's folder is a root), `Diff.svelte:219` `groupWaits` (whether any root exists).
  - `pickerRoots` of `repositories.ts` was deleted: nothing read it once the list moved to `repositoryGroups`.
- How the page tells a session's workspace from the workspace's own roots (the brief left it to the builder): each root's state on the `git` channel carries `inWorkspace` (`src/lib/server/root/watch/git.ts:385`), true for the file browser's roots, the repositories below them, the cloned folders and the always-watched root, false for a root only a session names. It is a field of each state, listed in `docs/apps.md:368`, which apps reading the `git` channel see.
- The Apps view counts as an item of the Apps group, so the catalogue's "no app listed" branch answers for the apps alone (`Catalogue.svelte`).
- The status bar's HPC item for `unconfigured` reads "no cluster" in the normal colour; the quota timer does nothing while no cluster is named; a refresh in that state publishes `unconfigured` again.
- Settled values (part 11) are dropped for good after two snapshot builds that still show the old value, so a write the snapshot never shows (an outside writer reverting it) stops overriding the page after two builds.
- The engine's documents a page's arrangement shows are listed before the hub's `docs:` documents in their group, so `h` then `3` is the Apps guide.
- Workbenches opens, when the float group has no rail page, on the first page that is no workbench (its existing rule).
- The Explorer arrangement gains References after Search, the group's order.
- A `docs:` document given to a saved page whose first tab is unpinned is inserted at index 0, ahead of it, so the pinned run leads the pane (case 78).
- Reopen's default `readFolder` hook answers an empty listing with no error, which treats a closed source tab as gone until `context.ts` hooks the real read; only an unhooked store (a test) sees this.
- A reopened Terminal tab gets a fresh state and a new shell; the old terminals stay ended.
- The History store tells two rows apart by their `at`, since appends get distinct moments (case 45c on the base already).
- The `layer: 'engine' | 'hub'` discriminator of `merge.ts` and `config-checks.ts` was kept: it names the side of the merge, and the hub's side is now one file. Settings code's names for the hub's file were renamed (`rows.ts` `hubFile`, `messages.ts` `hubFileAbsent`, catalog `workbench.settings_hub_file_absent`).

## Host- and user-visible changes

- Apps page: before, one empty pane; after, the Apps list on the left and an empty pane on the right. A browser with a saved layout keeps its saved Apps page until Reset layout on that page.
- Views catalogue, Apps group: the Apps view is its first row, so every app view's `v` digit moves up by one (an app that was `v` `1` is `v` `2`).
- Float group: Live HPC, Usage and Workbenches are `w` `1` to `3` (before `f` `2`, `f` `3` and a System digit); Focus is `f` `1` alone; System loses Workbenches, so its later digits do not move (Workbenches was its last row).
- Help group: Help, Memories, Apps guide, then the hub's documents, so each hub document's `h` digit moves up by one (Research approach `h` `3` to `h` `4`).
- Explorer page: a fresh layout or Reset layout shows References after Search; a saved page keeps its tabs until Reset layout.
- Pinned tabs: every tab of every shipped arrangement is pinned; saved pages keep unpinned tabs until Reset layout. Cmd+W on a pinned tab closes nothing (it shows the first unpinned tab when there is one).
- Reopen Closed Tab: palette `:reopen-closed-tab`, listed only while the list holds a tab; Cmd+Shift+T in the desktop app. An app keybinding on `cmd+shift+t` is now a key oculus takes, left out of the app's keys with a finding (`takenBy` over `cmd+shift+t` on macOS: base `null`, after `workbench`, `$S/harness/key-taken.test.ts`).
- Live HPC on a hub that names no cluster: before `unreachable` with a retry countdown; after `unconfigured`, the sentence, no countdown, no poll. The `hpc` channel's `status` takes `unconfigured` (apps).
- `git` channel: each state carries `top` and `inWorkspace` (apps).
- `config` channel: carries `hubs` (each hub's domains and theme lists, keyed by hub) (apps). New channel `changes` (`{ at }`), closed to apps.
- Repositories list: one row per repository; no row for a folder that is no repository, a deleted folder or a session's own workspace; the rail badge counts each repository once; the status bar names the repository, not the nested folder.
- A hub is a folder that holds `.oculus/config.yml`; `.oculus/config/` is not read. Settings edits and app settings are written into `.oculus/config.yml`. The seven `*_file` registry keys are findings; registries come from `collections:` entries.
- Each hub's projects, venues and datasets draw that hub's domain colours, labels and theme labels.
- Refusal sentences come from `config/text/server.yml`; wording changes are listed under "Refusal sentences reworded".
- Entry pages show a saved value at once; a lead's and a Lit Watch paper's page show the card above the editor.

## Brief errors

- G3's Test line in `agents/guarded.md` does not name `tests/routes/hubs/hub-secrets.test.ts` (`grep -n "hub-secrets" agents/guarded.md` prints nothing), although the brief puts case 80 under G3; the new row is reported below for the orchestrator to place.
- G54's Test line names no file ("written by Q125"); the rows live in `tests/checks/config/arrangements.test.ts`.
- The ASCII gate of spec.md names `bin`, which does not exist in `tools/oculus` (`ls bin`: `No such file or directory`); the gate was run over `src tests config`.
- The tree checks of the verify list need `--testTimeout 0 --hookTimeout 0`, as `npm run test:checks` sets them (`package.json:16`); the diagram and palette rows take longer than vitest's default 5 s.
- `npm run test:quick` does not finish within the 45 s spec.md states: 72.5 s on the last run.
- Case 59 says "the seed of a new hub", and part 8 names `src/lib/server/root/config-seed.ts` as that seed. That file is the page's configuration seed (`configSeed`); no code makes a new hub. The first write into a hub with no settings file is what makes the file, and case 59 was checked on that write.
- Part 3's premise that two appends in one millisecond share their `at` does not hold: on the base, `logChanges` already gives them distinct moments (case 45c base output).

## Doc text

What `.oculus/config.yml` must hold for every key the hub's `.oculus/config/` files set today (read in the main checkout: `appearance.yml`, `behavior.yml`, `layout.yml`, `sources.yml`, `catalogs/vocab.yml`), with D72's three `collections` lines (people, organisations, resources, already in today's file) and part 9's change (the seven `*_file` keys gone; each registry is its `collections` entry):

```yaml
# ===========================================================================
# .oculus/config.yml
# This hub's settings for oculus: the folders and files the portfolio is built from, the hub's documents, the cluster its jobs run on, the domains expected to have a dataset, the research domains and theme words of its registries, and the wallpaper image. A key here replaces oculus's value of the same key whole (tools/oculus/config/*.yml); a key outside oculus's hub list is a finding and is not applied.
# ===========================================================================


# Where to find projects: each `dir` is relative to the hub root. A project is any folder that holds a `project.yml` at its top or a `.oculus/project.yml`, at any depth under the `dir`; the walk stops at a project and does not enter a dot folder, `node_modules` or a symbolic link. The project's tier and type are the manifest's own `tier` and `type` lines, and its id is the folder's name. When a project lies deeper than one level, the first folder under the `dir` is its category.
scan:
  # Projects of the tier projects and the type idea.
  - { dir: projects/ideas }
  # Projects of the tier personal, the types idea and active; the folder `school` holds the school and thesis ones.
  - { dir: side-projects, optional: true }   # optional; a hub without the folder reports nothing
  # Projects of the tier projects and the type active.
  - { dir: projects/active }
  # Projects of the tier projects and the type active, each holding a manuscript folder.
  - { dir: projects/manuscripts }
  # Projects of the tier software, the research tools and libraries; each holds a `repository:` block.
  - { dir: projects/software, optional: true }   # optional; a hub without the folder reports nothing
  # Projects of the tier coauthor, each of the type it ended as (published, in-prep, tech-report, abandoned, software).
  - { dir: projects/coauthor }
  # Projects of the tier archive, each of the type it ended as (published, phd, nogo, dropped, disproved).
  - { dir: projects/archive }


# The folder a new project is made in, for each tier: the New project form of a board offers it as the project's folder, and an app's new-project write with no folder uses the `projects` one. Each folder is a scan folder or lies under one.
new_project_dir: { projects: projects/ideas, personal: side-projects }


# The portfolio deck: the folder, relative to the hub, whose present.yml and Markdown slides the Present view opens when a pane names no deck. A project's deck is its own present/ folder and a custom deck is any folder, so this key names the one deck that belongs to the hub as a whole.
portfolio_deck: deck


# Collection views: one card list per key, from one YAML file each, except the keys data, venues, pillars and domains, whose views are Data, Venues, Pillars and Domains and not a card list. This list is also where each registry names its file: the file of the entry keyed `data` is the dataset registry (the Data view, provenance and a recovery recipe per dataset; the projects that use a dataset come from the manifests' `datasets:`), `venues` the venue catalogue, `pillars` the pillars registry (membership computed from the manifests' `pillar:`), `domains` the domains registry (projects grouped by the manifests' `domain:`), `funding` the funding registry, `people` the people registry (one entry per human the hub names, exactly one with `self: true`, whose `affiliations:` are keys of the organisations file), `organisations` the organisations registry (what a person's `affiliations:` and a funding entry's `funder:` point at) and `resources` the resources registry (the clusters, machines and storage that a project's `compute:` and the `slurm.resource` key name by key). A hub that lists none of these keys has no such registry: it is read from its engine path and reported as unnamed. A key listed twice uses its first entry and is a finding. The schema is the file's own `schema:` block, and the links between files are in docs/DATA-MAP.md. Every entry has a page with an editor built from the schema, where it is edited and deleted, Add asks the new entry's name and opens that page, and an entry's status, deadline and date are also changed on its card. Edit in File opens the file at the entry.
collections:
  - { key: data,           file: "registries/data.yml" }
  - { key: venues,         file: "registries/venues.yml" }
  - { key: pillars,        file: "registries/pillars.yml" }
  - { key: domains,        file: "registries/domains.yml" }
  - { key: statements,     file: "registries/boilerplate.yml" }
  - { key: people,         file: "registries/people.yml" }
  - { key: organisations,  file: "registries/organisations.yml" }
  - { key: resources,      file: "registries/resources.yml" }
  - { key: funding,        file: "funding/funding.yml" }
  - { key: events,         file: "network/events.yml" }
  - { key: education,      file: "education/education.yml" }
  - { key: applications,   file: "applications/applications.yml" }
  - { key: joint-work,     file: "network/joint-work.yml" }
  - { key: tasks,          file: "tasks/tasks.yml" }


# Position Leads reads the scout's YAML as cards. Its search specification belongs to the research-cockpit skill.
leads_file: feeds/position-leads.yml


# Lit Watch reads the literature scout's accumulated radar. The refresh workflow deduplicates by URL and appends entries.
radar_file: feeds/literature-radar.yml

# Public website publications feed, cross-checked in the Audit view (missing / leaked / wrong-section / untracked). It is a separate repository folder, and the check is skipped silently when it is not checked out.
publications_file: side-projects/theaxec.github.io/_data/publications.yml

# LinkedIn view: the posts pipeline from the website (_linkedin/: numbered = posted, xx- = ideas).
linkedin_dir: side-projects/theaxec.github.io/_linkedin

# Career strategy: the order of work, hosts, eligibility and dropped options live in registries/career.yml and are drawn by the Focus board's Career strategy panel. A funding entry's `statement:` shows on the Funding view.
career_file: registries/career.yml


# Hub documents: one entry inside its group in the view catalogue, listed after the group's views and the engine documents its page shows, opening the `doc` view over api/docs, and a pinned tab of the page its group names, placed after that page's first tab. `path` is relative to the hub, `group` is a key of `nav_groups`, which the engine's layout.yml (tools/oculus/config/layout.yml) defines, and `label` is the tab's words. A path with no file there draws the view's own missing line.
docs:
  - { label: "Research approach",            path: docs/RESEARCH-APPROACH.md,             group: help }
  - { label: "Agent approach",               path: docs/AGENT-APPROACH.md,                group: help }
  - { label: "HPC how-to",                   path: docs/HPC-UTwente-howto.md,             group: help }
  - { label: "Data map",                     path: docs/DATA-MAP.md,                      group: help }


# Domains expected to have a dataset. Oculus reports projects in these domains without a Data section.
data_domains: [heart, liver, liverfl, liversurv, immune, brain, brainbci]


# `resource` is the key of a cluster entry of registries/resources.yml, whose `host` is the ssh alias the poller uses.
slurm:
  resource: utwente


# Research-domain colours and project-card labels, keyed by the manifest's `domain` value.
domains:
  heart:     { color: "#e2374d", label: "Cardiology | ECG" }
  liver:     { color: "#0d9488", label: "Hepatology | imaging" }
  liverfl:   { color: "#0d9488", label: "Hepatology | federated" }
  liversurv: { color: "#0d9488", label: "Hepatology | survival" }
  privacy:   { color: "#2563eb", label: "Privacy | vertical FL" }
  theory:    { color: "#2563eb", label: "Privacy | theory" }
  immune:    { color: "#7c5cff", label: "Immunology | federated" }
  method:    { color: "#ea580c", label: "Methods frontier" }
  brain:     { color: "#7c3aed", label: "Neuroscience | EEG" }
  brainbci:  { color: "#7c3aed", label: "Neuroscience | BCI" }
  cs:        { color: "#0891b2", label: "Computer Science" }
  meta:      { color: "#64748b", label: "Meta-science" }


# The theme words a venue's `themes:` may use (registries/venues.yml) and the label each is drawn with; a word used in the registry and missing here is a finding.
venue_themes:
  - { key: core-ml,     label: "Core ML" }
  - { key: clinical,    label: "Clinical" }
  - { key: high-end,    label: "High-end" }
  - { key: signal,      label: "Signal" }
  - { key: theory,      label: "Theory" }
  - { key: informatics, label: "Informatics" }
  - { key: federated,   label: "Federated" }
  - { key: neuro,       label: "Neuro" }
  - { key: imaging,     label: "Imaging" }
  - { key: bio,         label: "Bio" }
  - { key: cs,          label: "CS" }
  - { key: systems,     label: "Systems" }
  - { key: method,      label: "Method" }

# The theme words a dataset's `themes:` may use (registries/data.yml) and the label each is drawn with; a word used in the registry and missing here is a finding.
data_themes:
  - { key: single-cell,      label: "Single-cell" }
  - { key: eeg,              label: "EEG" }
  - { key: mri-imaging,      label: "MRI imaging" }
  - { key: bci-ecog,         label: "BCI / ECoG" }
  - { key: ecg,              label: "ECG" }
  - { key: survival-tabular, label: "Survival (tabular)" }
  - { key: clinical-ehr,     label: "Clinical EHR" }
  - { key: pde-operator,     label: "PDE operator" }
  - { key: ct-imaging,       label: "CT imaging" }
  - { key: mammography,      label: "Mammography" }
  - { key: simulated-copula, label: "Simulated (copula)" }


# The image is a hub name and a file name joined by a slash, `random`, or empty for none; the picker under the wallpaper rows of the Settings view sets it.
wallpaper:
  image: research-hub/wallhaven-83do1o.jpg
```

By key, against today's files: `scan` (7 rules, comments kept), `new_project_dir`, `portfolio_deck`, `collections` (14 entries, unchanged), `leads_file`, `radar_file`, `publications_file`, `linkedin_dir`, `career_file` come from `sources.yml`, with its seven `venues_file`, `datasets_file`, `pillars_file`, `domains_file`, `people_file`, `organisations_file` and `resources_file` lines left out (each names the same file as its `collections` entry today); `docs` (4 entries) from `layout.yml`; `data_domains` and `slurm.resource` from `behavior.yml`; `domains` (12), `venue_themes` (13), `data_themes` (11) from `catalogs/vocab.yml`; `wallpaper.image` from `appearance.yml`. The old folder `.oculus/config/` is removed once the file is written; oculus reads nothing of it.

The new text of `.oculus/wallpaper/README.md`:

```markdown
# Wallpaper images

Oculus serves the `.jpg`, `.png` and `.webp` files of this folder as wallpaper images. The folder is `wallpaper_dir` of this hub's `.oculus/config.yml`, or oculus's own value in `tools/oculus/config/sources.yml` when the file sets none, and the image in use is `wallpaper.image` of `.oculus/config.yml`, written as `research-hub/<file name>` and chosen from the picker under the wallpaper rows of the Settings view.
```

## Hub text reworded by hand

Each line before and after (`diff` of the main checkout's file with the worktree's):

- `registries/data.yml:28`, before: `help: "Modality theme keys from the data_themes list of .oculus/config/catalogs/vocab.yml in the hub; the Data view filters by them."`; after: `help: "Modality theme keys from the data_themes list of .oculus/config.yml in the hub; the Data view filters by them."`
- `registries/venues.yml:27`, before: `help: "Theme words from the venue_themes list of .oculus/config/catalogs/vocab.yml in the hub."`; after: `help: "Theme words from the venue_themes list of .oculus/config.yml in the hub."`
- `registries/domains.yml:1`, before: "... whose card colour and label come from the `domains` map of .oculus/config/catalogs/vocab.yml in the hub) ..."; after: "... come from the `domains` map of .oculus/config.yml in the hub) ...", the rest of the line unchanged.
- `registries/resources.yml:1`, before: "A project's `compute:` in its project.yml and `slurm.resource` in .oculus/config/behavior.yml in the hub are keys into this file ..."; after: "... `slurm.resource` in .oculus/config.yml in the hub are keys into this file ...".
- `docs/DATA-MAP.md`:
  - `:37` "named by `portfolio_deck` in `.oculus/config/sources.yml`, the hub's layer" to "named by `portfolio_deck` in `.oculus/config.yml`".
  - `:57` "a `scan:` rule in `.oculus/config/sources.yml`, the hub's layer;" to "a `scan:` rule in `.oculus/config.yml`;".
  - `:186` "the `collections:` list in `.oculus/config/sources.yml`, the hub's layer. ... Each registry or feed view draws the file that its key in `.oculus/config/sources.yml` names: `venues_file`, `datasets_file`, `pillars_file`, `domains_file`, `people_file`, `organisations_file`, `resources_file`, `leads_file`, `radar_file` and `linkedin_dir`." to "the `collections:` list in `.oculus/config.yml`. ... Each registry view draws the file of its entry in that list (`venues`, `data`, `pillars`, `domains`, `funding`, `people`, `organisations` and `resources`), and each feed view the file that its key in `.oculus/config.yml` names: `leads_file`, `radar_file` and `linkedin_dir`."
  - `:217` "the `docs:` list in `.oculus/config/layout.yml` (the hub's layer; the engine's list is empty)" to "the `docs:` list in `.oculus/config.yml` (the engine's list is empty)".
  - `:220` "the hub's layer of it in `.oculus/config/`" to "the hub's settings file `.oculus/config.yml`".
  - `:223` heading "The hub's layer of oculus's configuration" to "The hub's settings file of oculus's configuration".
  - `:225` "The hub keeps its own values for oculus in `.oculus/config/`. ... the keys this layer may set ..." to "The hub keeps its own values for oculus in `.oculus/config.yml`, and a folder that holds it is a hub. ... the keys this file may set ...".
  - `:227-232` the table "File / Holds for this hub" with one row per old file (`behavior.yml`, `catalogs/vocab.yml`, `layout.yml`, `sources.yml` with the seven `*_file` keys and `roots`) to "Keys / Hold for this hub" with rows `data_domains`, `slurm.resource`; `domains`, `venue_themes`, `data_themes`; `docs`; `scan`, `new_project_dir`, `portfolio_deck`, `collections`, `leads_file`, `radar_file`, `publications_file`, `linkedin_dir`, `career_file` ("the list of record files (each registry is the entry of its fixed key: `data`, `venues`, `pillars`, `domains`, `funding`, `people`, `organisations`, `resources`)").
  - `:247` "the keys of the `domains:` map of the vocabulary file (`.oculus/config/catalogs/vocab.yml` in this hub)" to "the keys of the `domains:` map of the vocabulary (`.oculus/config.yml` in this hub)".
  - `:283`, `:287` "(the `data_themes` / `venue_themes` of `.oculus/config/catalogs/vocab.yml`)" to "of `.oculus/config.yml`".
  - `:289` "the `domains` map of `.oculus/config/catalogs/vocab.yml`" to "of `.oculus/config.yml`".
  - `:295-299` rows `.oculus/config/behavior.yml`, `.oculus/config/sources.yml` (the hub's layer, with "the `*_file` keys"), `.oculus/config/sources.yml`, `.oculus/config/layout.yml` to `.oculus/config.yml` each, the `*_file` keys dropped from the key list; the workspace row's "a folder holding `.oculus/config/` is a hub" to "a folder holding `.oculus/config.yml` is a hub".
  - `:302` "(set in `.oculus/config/behavior.yml`; ..." to "(set in `.oculus/config.yml`; ...".
  - `:556` "holds `.oculus/config/` is a hub of its own" to "holds `.oculus/config.yml` is a hub of its own".
  - `:560` "its own `.oculus/config/` layer sets what reads its files ... the Settings view's layer is the primary hub's" to "its own `.oculus/config.yml` sets what reads its files ... the Settings view's file is the primary hub's".
  - `:561` row "Config layer": "each hub's `.oculus/config/` layer is that hub's own ... the primary hub's `venues_file: registries/venues.yml` and a second hub's `venues_file: other-folder/venues.yml` each read their own file. A layer sets only the keys of the hub list: in `sources.yml`, ..." to row "Settings file": "each hub's `.oculus/config.yml` is that hub's own ... the primary hub's `collections` entry keyed `venues` naming `registries/venues.yml` and a second hub's naming `other-folder/venues.yml` each read their own file. The file sets only the keys of the hub list: `scan`, `new_project_dir`, `portfolio_deck`, `collections`, `leads_file`, `radar_file`, `publications_file`, `linkedin_dir`, `career_file`, `memories_dir`, `wallpaper_dir`, `wallpaper.image`, `docs`, `slurm.resource`, `data_domains`, `app_settings`, `domains`, `venue_themes`, `data_themes` ...".
  - `:577` "`config/` (the hub's layer of the settings)" to "`config.yml` (the hub's settings)".

## Test rows by entry, for `agents/guarded.md`

The base runs of these files: each changed test file was copied with the step's tests into a copy of the base (`$S/bt`) and run alone, `npx vitest run --project unit <file>`, by `$S/btrun.sh`, logs in `$S/btlogs/`. In the first run every file that imports `HUB_FILE` stops before its assertions with `TypeError: The "path" argument must be of type string. Received undefined`, since the base has no such constant. In the second run the base copy was given that one constant, `export const HUB_FILE = '.oculus/config.yml';` (`$S/bt/src/lib/data/helpers/hub-names.ts:322`), and no other change, so the rows reach their assertions; the base messages below are from that run (`*.2.log`). Second-run totals: config.test `7 failed | 28 passed (35)`, config-folder `4 failed | 18 passed | 2 skipped (24)`, hub-folders `25 failed (25)`, manifests `5 failed | 46 passed (51)`, app-setting `1 failed | 11 passed (12)`, routes/edit/config-key `4 failed | 4 passed (8)`, hub-secrets `10 failed (10)`, server/edit/config-key `5 failed | 3 passed (8)`, clone-after `2 failed | 8 passed (10)`; first-run totals of the files that do not import it: arrangements `18 failed | 14 passed (32)`, changes `2 failed | 12 passed (14)`, git-scan-depth `1 failed | 11 passed (12)`, config-cache `3 failed | 6 passed (9)`, deck `1 failed | 3 passed (4)` (`a hub that names the deck: expected 'unnamed' to be 'missing'`), scan `10 passed (10)`, clone-exclude `16 passed (16)`, app-editor-close `3 passed (3)`; feeds `3 failed | 5 passed (8)`, writes `4 failed | 45 passed (49)` and hub-writes `1 failed | 24 passed (25)` fail on the catalog keys the rows word their refusals by (`Error: text key not in config: server.entries.type_options` and the like), writes-collection on the same error before any row runs; form-draft, page-entry and keys fail to load (`Cannot find module` of `settled.svelte.ts` or `why.ts`, which the step adds). Each file after the step passes (the guarded run above, `Tests  392 passed (392)`). hub-folders and hub-secrets fail whole on the base because their fixture hub is marked by `.oculus/config.yml`, which the base does not read as a hub.

- G54 (`tests/checks/config/arrangements.test.ts`, which G54's Test line does not yet name): new describe 'the pinned tabs of an arrangement' with rows 'reads { view, pinned: true } and { view, state, pinned: true } as pinned tabs', 'puts the pinned tabs of a pane before the others', `it.each([false, 'yes', 1, null])` 'makes nothing of a tab with pinned: %s', `it.each(pages)` 'pins every tab the %s page names'. Base: `Tests  18 failed | 14 passed (32)` (e.g. `expected [ [ 'help', undefined, {} ], <horizontal ellipsis>(1) ] to deeply equal [ [ 'help', true, {} ], <horizontal ellipsis>(1) ]`, four `expected { root: { kind: 'pane', <horizontal ellipsis>(2) } } to be null`, one per value of `pinned`).
- G12/G13 (`tests/checks/config/config.test.ts`): describe 'loadConfig with the hub layer' renamed "loadConfig with the hub's settings file"; 'replaces the engine value of a listed key whole and names the layer file in `from`' renamed 'applies every listed key of one file whole and names the file in `from`'; 'names a key, a file and a local.yml the layer may not set, and applies none of them' renamed 'names a key the list does not hold, with the file, and applies none of them' (cases 54, 62: `theme`, `slurm.poll_min`, `venues_file` findings, `leads_file` applied); 'keeps the engine values and names the file when a layer file does not parse' becomes `it.each` 'keeps the engine values and names the file when the file %s' with rows 'is empty', 'is a list', 'does not parse', 'holds a key twice' (case 79); 'reads the engine alone for a hub without the folder and for a call that passes no hub' renamed 'reads the engine alone for a hub without the file, for a call that passes no hub and for a .oculus/config/ folder' (case 55). Base (`$S/bt`): `expected '' to be 'other'`, `expected [] to deeply equal [ [ <horizontal ellipsis>(2) ], [ <horizontal ellipsis>(2) ], [ <horizontal ellipsis>(2) ] ]`, four `expected [] to deeply equal [ [ <horizontal ellipsis>(2) ] ]`, `expected '.oculus/photos' to be '.oculus/memories'`.
- G12/G13 (`tests/checks/config/config-folder.test.ts`): 'keys every catalogue group by the rail page it holds, in rail order, System after Help' renamed "keys every catalogue group but the float's by the rail page it holds, in rail order, System after Help" (base `expected { <horizontal ellipsis>(12) } to have property "float"`).
- G13 (`tests/data/hubs/hub-folders.test.ts`): 'marks a folder that holds .oculus/config as a hub and no other' renamed 'marks a folder that holds .oculus/config.yml as a hub and no other, a .oculus/config folder included' (base `expected [] to deeply equal [ [ 'hub', true ], <horizontal ellipsis>(3) ]`).
- G13/G32 (`tests/data/sources/manifests.test.ts`, cases 60, 61, 62): 'raises the finding for a registry its own sources.yml names and does not hold' renamed 'raises the finding for a registry its own collections list names and does not hold'; new 'reads a registry from the collections entry that names it and leaves the others unnamed' (base `expected 'registries/venues.yml' to be 'elsewhere/venues.yml'`), 'reads the first of two collections entries for one key and names the key in a finding' (base `expected 'registries/venues.yml' to be 'one.yml'`).
- G8 (`tests/server/edit/config-key.test.ts`, cases 56, 59): row 'a key of the hub list, with a hub that holds no layer file' renamed 'a key of the hub list, with a hub that holds no settings file'; new rows 'a key of the hub list, with a settings file that holds other keys and comments', 'a key of the hub list, with a hub whose settings file is the empty map' (base `expected { <horizontal ellipsis>(5) } to deeply equal { <horizontal ellipsis>(5) }`); 'refuses a hub layer file that is a link to a hub's .oculus/local.yml, and writes nothing' and "... to oculus's own config/local.yml ..." renamed 'refuses a hub settings file that is a link to ...' (base `expected [ 'behavior.yml:slurm.resource' ] to deeply equal []`).
- G8 (`tests/server/edit/config-value.test.ts`, not named in G8's Test line): "refuses a hub layer file that is a link to a hub's .oculus/local.yml, and writes nothing" and "refuses a hub layer file that is a link to oculus's own config/local.yml, and writes nothing" renamed "refuses a hub settings file that is a link to ..."; same assertions.
- G9 (`tests/routes/edit/config-key.test.ts`, case 56's undo): row 'a key of the hub list, whose layer file the write made' renamed 'a key of the hub list, whose settings file the write made'; new rows 'a key of the hub list, whose settings file holds other keys and comments', 'a key of the hub list, whose settings file is the empty map'; "writes wallpaper.image into the primary hub's .oculus/config/appearance.yml and not oculus's own" renamed "writes wallpaper.image into the primary hub's .oculus/config.yml and not oculus's own" (base `Error: ENOENT: no such file or directory, open '.../.oculus/config.yml'`).
- G9 (`tests/server/core/changes.test.ts`, case 45): new describe 'the change log's announcement' with rows 'publishes the changes channel once with the moment of the newest record, after the lines are on disk', 'publishes nothing for a write that changed nothing, and the newest moment when an append cuts the log to its window' (base `expected [] to deeply equal [ { channel: 'changes', <horizontal ellipsis>(2) } ]`, 2 failed).
- G77 (`tests/routes/edit/apps/app-setting.test.ts`, case 57): 'creates the layer holding the one key, which the merged configuration then reads' renamed 'writes the one key into the settings file, which the merged configuration then reads' (base `expected '{}\n' to be 'app_settings:\n  notes.width: 100\n'`); 'takes the write back, removing the layer and folders the write made' renamed 'takes the write back, leaving the settings file as the empty map it was'; describe 'a write that is refused leaves the hub without a layer' renamed 'a write that is refused leaves the settings file as it was'.
- G3 (`tests/routes/hubs/hub-secrets.test.ts`, case 80, not in G3's Test line): new row 'is no private folder in a folder that holds .oculus/config/ and no .oculus/config.yml' (base `expected [ true ] to deeply equal [ false ]`).
- G61 (`tests/server/root/config-cache.test.ts`, case 81): "parses again once a file of the hub's .oculus/config is written" renamed "parses again once the hub's .oculus/config.yml is written"; "keeps its read when a file of the hub's .oculus outside config is written" renamed "keeps its read when a file of the hub's .oculus other than config.yml is written"; 'reads the layer of the primary hub the open workspace names now' renamed 'reads the settings file of the primary hub the open workspace names now'; 'parses once for requests over a hub with no .oculus/config folder' renamed 'parses once for requests over a folder with no .oculus/config.yml'; "parses again once the hub's .oculus/config folder is made, and again once it is removed" renamed "parses again once the hub's .oculus/config.yml is made, and again once it is removed" (base 3 failed, `expected { one: 1 } to match object { docs: [ { path: 'a.md' } ] }`).
- G81 (`tests/server/git/git-scan-depth.test.ts`): new describe 'the top folder and the workspace mark of each root' with row 'names the top folder of a repository, of a folder inside one and of one found below a root, and marks a root only a session names as outside the workspace' (base `expected { <horizontal ellipsis>(4) } to deeply equal { <horizontal ellipsis>(4) }`).
- G28 (`tests/state/forms/form-draft.test.ts`, cases 69, 70, 71, 82): new describe 'a save the snapshot has not caught up with' with 'shows the saved title and clean fields at once, and the tab title with them', 'shows a saved person role and a saved career section at once', 'shows the value the snapshot has once another writer changed the field', 'holds the values of the newest of two saves, whichever answer comes last', 'moves the page and its tab to the key a save gave the entry', 'keeps an edit the save did not take under the key the save gave the entry', 'shows an entry a write added from its first frame, and gives way to the snapshot', 'keeps the saved value while the snapshot still shows the old one, and drops it for good after two builds' (base: file fails to load, `Cannot find module '../../../src/lib/state/forms/settled.svelte.ts'`).
- G28/G32 (`tests/state/forms/page-entry.test.ts`): no title change; `createPages` is handed `createSettled(() => 0)` (base: the same load error).
- G77/G67 (`tests/checks/source/keys.test.ts`): reads the description of `HUB_FILE` and the keys of `REFUSALS` (`why.ts`) as literal catalog keys (base: `Cannot find module '../../../src/lib/server/edit/yaml/why.ts'`).

## Edits to existing assertions

- `tests/server/edit/feeds.test.ts`: `reason: 'status takes one of open, applied, declined'` to `words(into.config.text, 'server.entries.type_options', 'status', 'open, applied, declined')`; `'the leads feed does not allow that field'` (twice) to `words(into.config.text, 'server.feeds.field_not_allowed', 'leads')`; `'two entries share the title Job, so a write cannot address one of them'` to `words(into.config.text, 'server.entries.shared_identity', 'title', 'Job')`; `'this paper is in Lit Watch already'` (twice) to `words(into.config.text, 'server.feeds.paper_in_file')`; `"Lit Watch's file does not read"` to `words(unread.config.text, 'server.feeds.file_unread')`.
- `tests/server/edit/writes-collection.test.ts`: `'method takes one of direct, physionet'` to `words(configFor().text, 'server.entries.type_options', 'method', 'direct, physionet')`; `'two entries share the key a, so a write cannot address one of them'` to `words(configFor().text, 'server.entries.shared_identity', 'key', 'a')`.
- `tests/server/edit/writes.test.ts`: `'promoted is not a career host status'` to `words(configFor().text, 'server.career.not_a_status', 'promoted')`; the inner answers `'an entry with that key is already in the file'`, `'a new entry needs a key'`, `'a new entry needs a non-empty id'` to the key pairs `['server.entries.key_taken', 'key']`, `['server.entries.new_ident_missing', 'key']`, `['server.entries.new_key_empty', 'id']` (the inner function answers which refusal, the entry point words it); two calls gain the `configFor().text` argument.
- `tests/routes/hubs/hub-writes.test.ts`: `{ error: 'no project with the id nolab:alpha' }` to `{ error: words(into.config.text, 'server.write_route.no_project', 'nolab:alpha') }`.
- `tests/routes/hubs/hub-secrets.test.ts`: `listed('lab')` and `listed('hub')` from `['open.yml']` to `['.oculus/config.yml', 'open.yml']` (the fixture hub now holds the settings file that makes it a hub).
- `tests/routes/edit/apps/app-setting.test.ts`: `existsSync(join(into.hub, '.oculus'))` `false` to `readFileSync(layerOf(into), 'utf8')` `EMPTY` (`'{}\n'`), and the three refusal rows from `existsSync(layerOf(into))` `false` to the file's text equal to `EMPTY`: the fixture hub holds `.oculus/config.yml` as the empty map, since that file is what makes the folder a hub.
- `tests/state/sources/clone-after.test.ts`: `readdirSync(join(w.hub, '.oculus'))` from `['config']` to `['config.yml']` (three rows).
- `tests/checks/config/config-folder.test.ts`: the expected top-level keys lose the seven `*_file` keys; the description check adds `expect(descriptionKey(HUB_FILE) in catalog).toBe(true)` and lists `HUB_FILE` beside `LOCAL_NAME`; the group row adds `expect(groups).toHaveProperty('float')` and leaves the float out of the rail-page comparison.
- `tests/checks/config/config.test.ts`, `tests/server/edit/config-key.test.ts`, `tests/routes/edit/config-key.test.ts`, `tests/server/root/config-cache.test.ts`, `tests/data/hubs/hub-folders.test.ts`, `tests/data/sources/manifests.test.ts`: paths and expected files from the old folder's files to `.oculus/config.yml`, and the `created` list of a first write from `.oculus`, `.oculus/config`, `.oculus/config/behavior.yml` to `.oculus`, `.oculus/config.yml`; manifests' finding row now expects two findings (the hub's own `collections` list names the registry).
- Fixtures only (no assertion changed): `tests/data/sources/scan.test.ts`, `tests/routes/docs/deck.test.ts`, `tests/server/git/clone-exclude.test.ts`, `tests/shell/panes/strip/app-editor-close.test.ts`, `tests/fixtures/hubs/workspace.ts`, `tests/fixtures/sessions-fixture.ts`, `tests/server/edit/writes-fixture.ts`, `tests/server/root/context-fixture.ts`, `tests/shell/rail/rail-fixture.ts`, `tests/checks/tree/allow-styling.ts` (the moved `ProjectCard.svelte` path).

## Refusal sentences reworded (part 10)

Each sentence that was unclear, before and after; every other refusal keeps its words as a catalog line. Constants that held sentences on the base: `PAPER_IN_FILE` and `FILE_UNREAD` (`feeds.ts:420-421`) and `NOT_A_FIELD_VALUE` (`yaml-edit.ts:69`), now catalog keys; the table of refusal keys is `REFUSALS` in `src/lib/server/edit/yaml/why.ts`.

- `merge.ts:377` "the field has no value node" to "the field holds no value to write over".
- `yaml-edit.ts:579`, `:594`, `:613` "the key has no value node" to "the key holds no value to write over".
- `yaml-edit.ts:540`, `:546`, `:552`, `:555` "followup is not a map" and `:630` "${parent} is not a map" to "{0} is not written as a map, so a key cannot be set under it".
- `yaml-edit.ts:751` "not a field name" to "a field is named by a key, or by a key and a child key joined by a dot".
- `NOT_A_FIELD_VALUE` "not a string, number, boolean, list of strings, list of maps of scalars, map of scalars, lists and maps, or null" to "a field takes a string, a number, a boolean, a list of strings, a list of maps of scalars, a map of scalars, lists and maps, or null".
- `subtasks.ts:170` "not a string, number, boolean or null" to "a subtask field takes a string, a number, a boolean or null".
- `feeds.ts:625` "an entry with that {X} is in the file" to `server.entries.key_taken` "an entry with that {0} is already in the file".
- `feeds.ts`'s `new Error` sentences keep their words as catalog lines (`server.feeds.not_a_map` "{0}: expected a map of keys", `server.feeds.meta_not_a_map` "{0}: meta is not a map").

## Renames and their greps (spec.md)

`grep -rn -- '<name>' src tests config utils docs/apps.md HELP.md DESIGN.md README.md demo | wc -l` after the step: `HUB_LAYER` 0, `hub-layer` 0, `layout/instances` 0, `feeds/leads/LeadCard` 0, `feeds/radar/RadarCard` 0, `shared/card/ProjectCard` 0, `layerAbsent` 0, `settings_layer_absent` 0, `pickerRoots` 0. `\.oculus/config/` 4 and the seven `*_file` keys 4, every hit a test that checks the old folder is no hub or the key is a finding (`config.test.ts:330-366`, `hub-folders.test.ts:28`, `hub-secrets.test.ts:88-91`). `tests/state/system/settings/row-writer.test.ts:2` and `:51` still say "hub layer": that file is under no guarded entry and outside the tests this step may change, and "layer" there names the hub's side of the merge, which stays true.

Documents re-read for the behaviour the step changes: `HELP.md` rewritten at lines 23, 25, 44-45, 61, 86, 102-103, 109-111, 224, 227, 234-235, 258, 266, 268, 274, 302, 418-419, 421, 425, 427, 431, 435, 462, 468, 470-475, 492-493, 496; `DESIGN.md` at 88, 92, 157, 247, 263, 329, 334, 336, 401, 540, 615, 624, 628-630, 637, 673, 687, 694, 700, 726, 742; `README.md:13`; `docs/apps.md` at 237, 328, 360, 365, 367-368; every other paragraph of these files that names the behaviour is still true (`diff` of each with the main checkout's copy).

History words in added lines (`diff` of base and worktree, added lines through `grep -inE 'no longer|used to|previously|formerly|renamed|\bold\b|legacy|migrat|this step|D7[0-9]|Z8[0-9][0-9]'`): the hits describe what the code does at run time ("the file no longer holds the lines the write left", "drops what the old one answered", "no longer holds its instance", "the snapshot still shows the old one" and the test fixture value 'Old title'); none names a package, a date or an earlier version. `tests/checks/source/history.test.ts` passes.

## Limitations

- The config-folder chord row stays red until Axel rules on open item 1.
- config-folder's 'names a group of its own ...' and integrity's 'validates with no findings' cannot pass in the worktree, which holds no `.oculus`; they are verified only at landing on main after `.oculus/config.yml` is written.
- Page cases (1's drawing, 10's buttons, 20 to 29, 35, 36, 71's first frame, 72, 73, 74, 83's frame) are checked by reading and unit reach only; each needs the look on landing named in its row.
- A settled value outlives at most two snapshot builds; a write the snapshot never reflects stops showing after the second.
- `npm run test:quick` takes 72.5 s, over spec.md's 45 s.

## Repair round 1

Every ruling of `agents/briefs/D74-round1.md` is done; nothing is left open from this round. The report's first line and its open item 1 (option (b), a widened chord row) are superseded by ruling 1: the Apps group now has the chord `a`, and the held row 'gives every group a chord and a glyph, and no letter a key the workbench binds' passes unchanged. The one red row of the closing check run is 'names a group of its own and a path under the hub for every document', which reads the hub's `.oculus/config.yml`; it passes only on main, as the round brief says (details under the runs below).

Paths are under `tools/oculus/` of the worktree. Line numbers are from `grep -n` and `sed -n` on the final tree.

1. Apps chord. `config/layout.yml:36` is `apps: { label: "Apps", glyph: app, chord: a }`. The key sheet's catalog line `config/text/app.yml:26` (`keys.rows`) has the row `a1-a9 | open the Apps view or an app of the Apps page's group, its first nine` after `t1`, and `HELP.md:111` the table row `| a1-a9 | open the Apps view or an app of the Apps page's group, its first nine; the Apps view is `a1` and the apps follow it in the catalogue's order |`. Sentences corrected: `docs/apps.md:11` (was "by the chord `v` and the digit", now "by the chord `a` and the digit the catalogue shows beside it, `a1` being the Apps view and the apps following it") and `DESIGN.md:334` (was "the glyph `app` and no chord, so its views are reached by the direct-chord prefix and a digit", now "the glyph `app` and the chord `a`, so the Apps view is `a` then `1` and the app views follow it, `a2` onward"). `HELP.md:95` ("Every view sits in a group with a letter of its own, so the direct chord reaches nothing") is true again and is unchanged. `grep -rnE "direct_chord|chord .v.|direct-chord|v1-|\bv1\b" HELP.md DESIGN.md README.md docs/*.md config` finds no other sentence that sends an app view to `v`. The letter `a` is no key the workbench binds: the held row checks exactly that and passes. The held row itself is not edited.
2. `inWorkspace`: kept, no code change. Host-visible: before the step a root's state on the `git` channel had no `inWorkspace` field; after it each root's state carries `inWorkspace`, a boolean (documented at `docs/apps.md:368`). It is listed here as a host-visible change.
3. `src/lib/state/sessions/changes.svelte.ts:233`, `reload()`: kept `'again'`. Before `queries.refetch(KEY, first, 'drop')`, after `queries.refetch(KEY, first, 'again')`. Part 3 needs it: part 3 adds the announced-append read `queries.refetch(KEY, newer, 'again')` at `changes.svelte.ts:192`, where `newer` merges the first page in front of the rows held (`ahead`). `WhileFetching` (`src/lib/state/shared/stores/shapes.ts:396-401`) says `drop` leaves a fetch in flight alone and `again` asks at once after it. The view's own undo (History's undo, the Files tree's undo) calls `reload()`; with `'drop'`, a reload made while that announced read is out is dropped, and the store keeps the announced read's merge, the held rows plus the new page, instead of the one fresh page. Case 46b ("the view's own undo reloads one page") is the case that needs `'again'`. This is read from the code; no run with `'drop'` was made.
4. `src/lib/state/workbench/layout.svelte.ts` is a file outside the brief's paths that the step changed: it imports `createReopen` (`:26`) and builds the store at `:415`, `createReopen(access, attention, instances.activateInstance)`, which part 6 (reopen a closed tab) needs. It is named here among those files.
5. The two wrong premises: no code change. They stay in "Brief errors" above: `config-seed.ts` is the page's seed of the configuration, not a hub's seed, and appends in the same millisecond were already kept distinct (case 45c, `CASE45c ["2030-01-01T00:00:00.000Z","2030-01-01T00:00:00.001Z"]`).
6. `src/lib/server/root/watch/portfolio.ts:522-528`, the doc comment of `watchHubFolders`, now says what `:577` `openFile(join(dir, HUB_FILE), () => true)` does for each hub: "Every hub's settings file is watched the same way, as a config change: its change rebuilds the portfolio and publishes the `config` channel again. For the primary hub that carries the merged configuration read from the file; for another hub it carries that hub's domains and theme words in `hubs`, and the portfolio rebuild reads its scan folders and record files from the file again."
7. Rewrapped at 100 columns: `portfolio.ts:423-432` (the comment of the one-file watch), `src/lib/views/system/workbench/Catalogue.svelte:15-23`, and `src/lib/state/workbench/navigation/arrangement.ts:88-98`, where `{ kind: pane, view }` is whole on `:93` and `{ kind: split, dir, sizes, children }` whole on `:92`. `awk 'length>100'` over `portfolio.ts` and `arrangement.ts`, and over the first 40 lines of `Catalogue.svelte`, prints nothing.
8. `DESIGN.md:615`: the Workbenches view is "a unique view at order 2 of the `float` group, after Live HPC and Usage, so the chord `w` then `3` reaches it, and the last tab of the float that `floats:` of `config/layout.yml` ships". The order and chord are from `config/layout.yml` (`float` group, chord `w`) and the view's registration; the float harness prints `CASE85 w ["hpc","usage","workbenches"]`.
9. `src/lib/state/shared/words/themes.ts:91` joins with `t('hubs.label_separator')` (doc comment `:71`), a key added at `config/text/views/shared/hubs.yml:4`, `label_separator: ' / '`, with the file's head sentence widened to name it. Host-visible: a theme word two hubs label differently is drawn in a facet as the two labels joined, `Core ML main / Core ML second` (before the step the facet drew the primary hub's label alone, `Core ML main`); the ` / ` now comes from the catalog.
10. `config/behavior.yml:325`, the `app_settings` comment, names one place, a hub's own `.oculus/config.yml`: "The map is kept in a hub's own .oculus/config.yml, where `app_settings` is a key of the hub list; the apps read the map of the primary hub's .oculus/config.yml, and the Settings view writes into that file. ... This file sets no map." That line was also the file's last comment, so "The map is not set here; the hub's layer holds it." is gone with it. `grep -rn "hub's layer" config` prints nothing. "Hub list" is the name `config/sources.yml:4` gives the keys a hub's file may set. The reader is `src/lib/server/root/watch/apps.ts:331`, which reads `join(primary, HUB_FILE)`.
11. Frozen: `src/lib/state/sessions/source/write-files.ts:65` `export const NO_LOOKUPS: Readonly<FileLookups> = Object.freeze({...})`, and `src/lib/state/client/writes.svelte.ts:129` `const NO_SETTLE: Readonly<Settle> = Object.freeze({...})`; `createWrites` takes `look: Readonly<FileLookups> = NO_LOOKUPS, settle: Readonly<Settle> = NO_SETTLE` (`:160-161`). svelte-check reports 0 errors over 499 files with the read-only types.
12. The page reads the server's hint alone: `src/lib/state/workbench/navigation/status.ts:182` `long: data.hint ?? ''` and `src/lib/views/system/machine/hpc/Hpc.svelte:91` `<Empty message={data.hint ?? ''} />`; the `?? ''` is there only because `hint` is optional in the type. The key `hpc.no_cluster` is removed from `config/text/views/system/machine/hpc.yml`; `grep -rn "no_cluster" config src` finds only `hpc.host_no_cluster`, which the server reads (`src/lib/server/machine/hpc/host.ts:116`). `tests/checks/source/keys.test.ts` passes: a verbose run of it marks all 8 of its rows passed, 'has a reader for every catalog key' among them.
13. Reopen's `gone()` compares the refusal word: `src/lib/state/workbench/layout/tabs/reopen.svelte.ts:90` `if (listing.refused === 'missing') return true;`. The word travels from the answer: `src/lib/state/shared/answers/answers.ts:163` `answerRefusal(body)`, and `src/lib/state/sources/fs-transport.ts` carries it as `refused?: OpsRefusal` on `Listing` (`:38`) and on a failed answer (`:360`), set at `:371-375` and copied into the listing at `:406-407`. The same comparison of display words stood in the base at `src/lib/state/sources/fs.svelte.ts:483` (`found.error === t('files.refused_missing')`), a file the step already changes; it now reads `found.refused === 'missing'`. That line is beyond the ruling's letter and is the same defect.
14. The Apps view's search text: kept in the tab's instance state, key `search`, saved with the layout. Named here as a user-visible change: the search box of the Apps view comes back with its text after a reload.
15. This section.

### Runs this round

The harnesses are scratch files in `$S/harness/` run by `sh $S/run.sh <base|after> <file>` as described in "The cases' first run"; `after` is an rsync of the final worktree.

- Ruling 1: `chord-apps.test.ts`, the shipped configuration with two app views registered after the Apps view. After: `Tests  1 passed (1)`, `CHORD apps keys [["apps","a1"],["app:notes","a2"],["app:clock","a3"]]`, `CHORD direct {"letter":"v","views":[]}`. Base: `AssertionError: expected undefined to be defined`, since the base has no Apps view.
- Ruling 3: `history-other.test.ts`, after: `Tests  5 passed (5)`, `CASE46b {"rows":50,"first":"status.line"}`, `CASE46c {"rows":1,"askedMore":0}`.
- Ruling 9: `vocab.test.ts` (its `install()` now also sets the text catalog, as `installPageConfig` does) with the added row 'case 50b: the separator is the catalog line hubs.label_separator'. After: `Tests  6 passed (6)`, `case50 facets [{"theme":"core-ml","label":"Core ML main / Core ML second","count":2}]`, `case51 facets [{"theme":"core-ml","label":"Data main / Data second","count":2}]`, `case50b changed separator [{"theme":"core-ml","label":"Core ML main + Core ML second","count":2}]`. Base: `Tests  5 passed (5)`, `case50 facets [{"theme":"core-ml","label":"Core ML main","count":2}]`.
- Ruling 12: `hpc.test.ts`, after: `Tests  4 passed (4)`, `CASE1 words {"short":"no cluster","long":"the settings of this hub name no cluster (slurm.resource in .oculus/config.yml)"}`.
- Ruling 13: `reopen.test.ts`, whose fake folder read now answers `refused: 'missing'`, after: `Tests  7 passed (7)`. `refused-word.test.ts` reads a 404 answer `{ error: 'missing' }` through the real `listingAnswer` with the shipped catalog and with `files.refused_missing` reworded. After: `Tests  1 passed (1)`, `REFUSED shipped {"entries":[],"error":"It is not there any more.","refused":"missing","loading":false}`, `REFUSED reworded {"entries":[],"error":"Reworded: gone from the disk.","refused":"missing","loading":false}`, `REFUSED other {"entries":[],"error":"The server refused the request (HTTP 500).","loading":false}`. Base: `AssertionError: expected undefined to be 'missing'` (the base listing carries no refusal word).
- Rulings 8 and 1 together: `float.test.ts`, after: `Tests  5 passed (5)`.
- Ruling 11: `npx vitest run tests/state/client/held-unsaved.test.ts ...` (nine files that use `createWrites` or `NO_LOOKUPS`, listed in full: `tests/state/client/held-unsaved.test.ts tests/checks/config/arrangements.test.ts tests/routes/hubs/hub-secrets.test.ts tests/shell/commands/clone-ask.test.ts tests/state/sessions/served-roots.client.test.ts tests/state/sources/clone-after.test.ts tests/state/sources/workspaces-real.test.ts tests/state/system/settings/machine-section.test.ts tests/data/hubs/hub-portfolio.test.ts --testTimeout 0`): `Test Files  9 passed (9)`, `Tests  88 passed (88)`.

`npm run diagrams` ran after the last code change and printed the regenerated files (`docs/diagrams/writes.svg` last).

`npm run test:quick` ran twice this round. The first run was red on prettier for `src/lib/state/sources/fs-transport.ts`, a file this round changed: the `Answered` type had to sit on one line, `{ ok: true; body: unknown } | { ok: false; error: string; refused?: OpsRefusal };` (`:360`). `npx prettier --write` fixed it and `npx prettier --check` on that file printed "All matched files use Prettier code style!". Its time lines as printed:

```
test:quick: 75.9 s (limit 45.0 s); failed: prettier
test:quick: over the time limit
```

The second and last run, every command green (ASCII gate, svelte-kit sync, prettier, eslint, svelte-check `0 ERRORS 0 WARNINGS`, vitest over 206 test files):

```
test:quick: 53.3 s (limit 45.0 s); every command passed
test:quick: over the time limit
```

`npx vitest run tests/checks/config/config-folder.test.ts tests/checks/source/keys.test.ts tests/checks/diagrams tests/checks/tree --testTimeout 0 --hookTimeout 0`, run once after the last change:

```
 FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > names a group of its own and a path under the hub for every document
Error: expected any number of assertion, but got none
 Test Files  1 failed | 6 passed (7)
      Tests  1 failed | 117 passed (118)
```

That row reads the hub's `.oculus/config.yml` through `realHub()`; the worktree has no `.oculus` folder at its root (`ls .agents/worktrees/D74/.oculus`: "No such file or directory"), so the config has no `docs` entries and the row asserts nothing. It passes only on main, per the round brief, and was not run there. The held chord row passes (a verbose run of the same file marks 'gives every group a chord and a glyph, and no letter a key the workbench binds' passed), and every `keys.test.ts` row passes, among them 'has a reader for every catalog key'. Integrity's 'validates with no findings' (`tests/checks/config/integrity.test.ts:168`), the other row that reads the hub's file, is not in this command; `npx vitest run tests/checks/config/integrity.test.ts --testTimeout 0 --hookTimeout 0` run once in the worktree prints `Tests  1 failed | 7 passed (8)`, that row failing with `AssertionError: expected [ Array(239) ] to deeply equal []`, findings such as "project fed-faithful-ecg names the domain heart, which is not in the domains of .oculus/config.yml in the hub", for the same reason: the worktree holds no `.oculus/config.yml`, so the hub's domains and theme words are absent. It passes only on main, per the round brief.
