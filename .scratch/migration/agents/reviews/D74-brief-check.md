# Brief check: D74

The most serious findings come first; each section numbers its findings.
- **Pages:** the brief asks the builder to drive a page on a scratch server, which spec.md:63 forbids.
- **The status bar:** the code that draws two status-bar items the step must change (`src/lib/state/workbench/navigation/status.ts`) is not in the write list, and its premise names the wrong file.
- **Test rule:** the bullet that says parts 1 to 10 and 12 fall under no guarded entry is false.
- **Write list too narrow:** several text files the step makes false are outside it: `README.md`, `docs/palette.md`, and HELP.md, DESIGN.md and docs/apps.md lines beyond those listed.
- **The tree checks:** `tests/checks/config/integrity.test.ts` will most likely go red in the worktree, and the builder may not write the file that would make it pass.

I changed no file.

## Names

Commands run from `tools/oculus` unless a path says otherwise. I used git only as `git show` and `git grep`.

Names 1. `HpcStatus` gains `none` (part 1).
- Command: `grep -rn "HpcStatus\|retryMin\|hpc.status\|\.status === 'unreachable'" src/lib | grep -v "^src/lib/server/machine/hpc"`.
- Hits outside the write list: `src/lib/state/workbench/navigation/status.ts:171`, inside `hpcWords` (`:167-179`). That function chooses the words of the status bar's HPC item (`statusWords`, `:397`).
- Output: `if (data.status === 'unreachable') { return { short: t('hpc.unreachable'), ...`. With `none` it falls through to `return { short: t('statusbar.hpc_live', data.running, data.pending), ...`.
- Effect: the change makes this reader wrong. The bar would show a live count of 0 and 0 on a hub with no cluster.
- The brief names `status-items.ts` and `StatusBar.svelte` (brief line 15), but the write list has only `src/lib/shell/status/`. The builder either leaves the bar wrong or writes outside the write list.
- Other readers are unaffected: `notice-sources.ts:248` (`poll?.status !== 'ok'`), `state/system/machine/hpc/hpc.svelte.ts:31,38,48` (`=== 'ok'`) and `payloads.ts:52` (`status: z.string()`).

Names 2. The status bar's repository item (part 4).
- The item reads the `git` payload directly, not through `gitRoots()`.
- Commands: `grep -rln "repoStatus\|repositoryChoices" src/lib` lists `shell/status/status-items.ts`, `shell/status/RepoItems.svelte` and `state/workbench/navigation/status.ts`. `grep -n "readableRepositories" src/lib/state/workbench/navigation/status.ts` shows `:208 function readableRepositories(git)` with `Object.keys(git).filter(...)`, `:231 deepestHolding(readableRepositories(git), ...)` and `:245 name: folderName(root)`.
- `status.ts` is not in the write list. With `oculus` a root of the channel, a file under `tools/oculus` keeps naming `oculus` (case 16).
- `repositoryChoices` (`:319-340`, `Object.keys(git)`) is the item's list, and it keeps both rows.
- Effect: the brief points the builder at `tab-file.svelte.ts`, so the builder would change the wrong file, and this reader stays false. See Premises 1.

Names 3. `.oculus/config` becomes `.oculus/config.yml` (part 8).
- Command: `grep -rln --exclude=local.yml "\.oculus/config" src config docs DESIGN.md HELP.md README.md tests` lists 55 files.
- `tools/oculus/README.md:13` is outside the write list: "A listed folder that holds `.oculus/config/` is a hub". The change makes it false.
- `grep -n "\.oculus/config\|venues_file\|behavior.yml\|vocab.yml" HELP.md` finds HELP.md lines outside the listed numbers (44, 84, 100, 140, 220, 262, 406-424, 428). Each is made false by part 8 or part 9:
  - `:252` (`.oculus/config/sources.yml`)
  - `:260` (`linkedin_dir` of the hub's `.oculus/config...`)
  - `:268` (`written to .oculus/config/<file>`)
  - `:296`
  - `:455`
  - `:461` ("The hub's own settings are the hub's layer, `.oculus/config/`")
  - `:463` (`venues_file`, `datasets_file`, ...)
  - `:464`, `:465`, `:466`
  - `:468` (`.oculus/config/appearance.yml`)
  - `:485` ("A folder of the workspace that holds `.oculus/config/` is a hub")
  - `:486`
  - `:489`
- DESIGN.md lines outside the listed ones (157, 725, 324, the arrangement paragraph): `:92`, `:263`, `:540` (`.oculus/config/behavior.yml` under `app_settings`), `:636`, `:686` (`pillars_file`), `:693`, `:741` ("A folder of the workspace that holds `.oculus/config/` is a hub of its own"). Part 7's "DESIGN.md's paragraph on the hub layer" is one of these, and it is not in the write list.
- docs/apps.md lines outside the listed ones (365, 368, the `config` row): `:237` ("A value is written to the primary hub's `.oculus/config/behavior.yml`") and `:360` ("A folder of the workspace that holds `.oculus/config/` is a hub").
- Part 8's requirement says "The text that names the old folder is rewritten to the file: DESIGN.md, HELP.md, docs/apps.md". The write list's line ranges forbid exactly that. The builder either leaves those sentences false or writes outside its list.
- `agents/guarded.md:197` (G61, "of the primary hub's `.oculus/config/` folder") and `:199` (G61's test titles "parses again once a file of the hub's .oculus/config is written", "parses once for requests over a hub with no .oculus/config folder") become false.
  - That file is the orchestrator's, so nothing tells the orchestrator to update G61 at landing.
  - The builder will rename those test titles in `tests/server/root/config-cache.test.ts`, which leaves guarded.md naming titles that no longer exist.
- Outside oculus, `git grep -l "\.oculus/config\b\|\.oculus/config/" -- . ':!tools/oculus'` lists the hub's five `.oculus/config/*.yml` (landing), `.oculus/wallpaper/README.md` (landing), `docs/DATA-MAP.md` and `registries/{data,domains,resources,venues}.yml`. All are covered by the write list or the landing bullet.

Names 4. The seven `*_file` keys go (part 9).
- Command: `git grep -n -E "(venues|datasets|pillars|domains|people|organisations|resources)_file" -- . ':(exclude)tools/oculus/.scratch'`.
- Hits outside the write list:
  - `tools/oculus/HELP.md:463` and `tools/oculus/DESIGN.md:686`, which become false (see Names 3).
  - `tools/cockpit/...` (README.md:187-189, `data/config/layout.yml`, `src/cockpit/*.py`). That is the cockpit's own config and stays true.
  - The hub's `.oculus/config/sources.yml:34-55` (landing).
- Part 9's "After" sentence says "a `*_file` key in a hub's file is a key the list does not name, a finding as any other". `sed -n 222-247p src/lib/data/helpers/hub-names.ts` shows HUB_LIST keeps `leads_file`, `radar_file`, `publications_file` and `career_file`, so that sentence is false for four `*_file` keys that stay.
- Effect: a literal reading leads the builder to refuse `leads_file`, `radar_file`, `publications_file` and `career_file` as well. The sentence should say "one of the seven".

Names 5. `:reopen-closed-tab` (part 6).
- Commands: `grep -n "palette.md\|docs:palette" HELP.md package.json DESIGN.md` shows `package.json:24 "docs:palette": "node utils/diagrams/palette.mjs"`. HELP.md:67 says "Every command ... of the palette is listed in [the palette page](docs/palette.md), which `npm run docs:palette` writes". DESIGN.md:707 adds "A landing check compares the committed page with a fresh generation". guarded.md:238 (G25) names `tests/checks/diagrams/palette.test.ts`, 'is what the palette gives now'.
- `tools/oculus/docs/palette.md` is not in the write list, and the verify list never runs `npm run docs:palette`.
- Effect: `npx vitest run tests/checks` (verify item 1) goes red on G25, or the builder writes outside its list. HELP.md has no palette command list of its own; see Premises 11.

Names 6. The new view id `apps` and its place in the catalogue (part 5, decision 5).
- Command: `sed -n 24p;40,41p config/layout.yml`. The Apps group has no `chord` (`apps: { label: "Apps", glyph: app }`), so its views are reached by `direct_chord: v` and a digit for "the view's place among them".
- Decision 5 makes the Apps view the group's first row. That moves every app view's `v` digit by one, and no requirement, case or host-visible change in the brief says so.
- Part 5 also says "The Views catalogue keeps its Apps group as it is", while decision 5 adds a row to it.
- `Catalogue.svelte:111-115` computes `appsListed` from the group's views. With the Apps view registered there, the "no app listed" branch (`:317`) changes as well.
- HELP.md's views table ("One row per view of the Views catalogue", `HELP.md:166`) needs a row for `apps`. Lines 166 to 277 are not in the write list, and no requirement asks for the row.

Names 7. `pinned` on an arrangement tab (part 6).
- `src/lib/state/workbench/navigation/arrangement.ts:41-42` says "The tabs a pane or a float holds" (`tabsShape`, used by floats too). Adding `pinned` to the tab shape also lets `floats:` (`config/layout.yml:122-124`) say it.
- The comment of `floats:` (`:122`) says its `view` is "as in an arrangement's pane", so it stays true, but floats are named nowhere in part 6. See Implied inputs 9.

Names 8. `GitState.top` (part 4).
- Command: `grep -rln "ignoresWorktrees:" src tests` lists `model-sessions.ts`, `server/core/git/state.ts` and `tests/fixtures/sessions-fixture.ts`. All are covered.
- `payloads.ts:48` reads `git` as `mapShape`, so it needs no change.

Names 9. The `changes` channel and `ChangesPayload` (part 3).
- `Payloads` in `src/lib/state/shared/stores/shapes.ts:37-58` has no `changes` key, and `grep -rn "ChangesPayload" src` prints nothing, so there is no collision.
- `src/lib/data/helpers/files/apps/apps.ts:95` `READ_OPEN` does not list it, so the channel is closed to apps, as Z863 says.

## The step line

Every part from (1) to (12) has a "What to build" section. Mapping:
- (1) is brief part 1, bullets 1-4.
- (2) is part 2.
- (3) is part 3.
- (4) is part 4. It covers open items 84 (a) and 85 (a), the X3d one-row bug, and DESIGN/HELP. The "Files view still shows the folder" of ruling 84 is not restated but is current behaviour.
- (5) is part 5.
- (6) is part 6.
- (7) is part 7.
- (8) is part 8, with the landing move as its last bullet.
- (9) is part 9.
- (10) is part 10.
- (11) is part 11.
- (12) is part 12.

The step line 1. Part (10) of the line asks for more than the brief requires.
- The line says "no English sentence is left in the code of `src/lib/server/edit`". The brief limits part 10 to "every refusal reason", and its proof is the count `grep -rn "reason: \`\|reason: '\|fail('\|refuseAll(.*'" src/lib/server/edit | wc -l` (prints 140, reproduced).
- `grep -rn "error: \`[A-Za-z]\|error: '[A-Za-z][a-z]* [a-z]" src/lib/server/edit | wc -l` prints 13: English answers of the write route, such as `writes.ts:461 json({ error: \`no entry ${entry.id} in ${entry.collection}\` }...)`, `:617 'the leads feed is not on this hub'` and `:724 'the body is not a write this route knows'`.
- `grep -rn "new Error(\`\|new Error('" src/lib/server/edit | wc -l` prints 5 (`feeds.ts:99-196`).
- `src/lib/state/client/writes.svelte.ts:167` puts `answer.error` into the reason a notice shows (`notice-sources.ts` `unwritten`), so these sentences reach the reader.
- Effect: part 10 can be met in full while the line's part (10) is not.

The step line 2. Part (2) of the line names the wrong mechanism.
- The line says `forget` from `onDestroy` (`source-status.svelte.ts:44`) runs "whenever another tab of the same pane is shown".
- `sed -n 8,12p src/lib/shell/panes/PaneBody.svelte` says "A tab's view is mounted the first time the tab is shown and stays mounted until the tab closes or leaves the pane".
- The brief records this (line 20) and leaves the path to case 6's first run. That is the right handling. The line's premise is unconfirmed and should be booked if case 6 shows it wrong.

The step line 3. No part of the line is without a requirement. Requirements beyond the line, which the rulings support:
- Part 5's Remove only for a machine app.
- Part 6's batch semantics.
- Part 12's Delete control.

## Premises

Every command of "What is on the tree" was rerun on f3c588783.

Premises 1. Brief line 30 and part 4 bullet 3 are wrong about `tab-file.svelte.ts:47`.
- They call it "the status bar's repository item". `grep -rln "createTabFile" src/lib` lists `views/sources/source/Source.svelte` alone, so `tab-file.svelte.ts` is the source tab's own file and repository (blame, star, Open in Program).
- The status bar's item is `repositoryOf`, `repoStatus` and `repositoryChoices` of `src/lib/state/workbench/navigation/status.ts:262-340`. Those read `Object.keys(git)` and are not a `gitRoots()` reader. See Names 2.
- Effect: the builder changes `tab-file.svelte.ts` and case 16 stays red, or passes by checking the wrong module.

Premises 2. Brief line 15 names `status-items.ts` and `StatusBar.svelte` for the HPC item. Its words are chosen in `status.ts:167-179` (`hpcWords`), see Names 1.

Premises 3. Brief line 18 has the line numbers slightly off.
- `grep -n "export function createEditorStatus\|held.focused = null\|return { publish" src/lib/state/workbench/navigation/editor-status.svelte.ts` prints `144:`, `164:` and `192:`.
- So `createEditorStatus` is 144-192, not 150-193, and `forget` sets null at `:164`, not `:162`. The rest of line 18 holds.

Premises 4. Brief line 21 groups `context.ts:584` with the debug and commands wiring, but it is a different reader.
- `sed -n 560,590p src/lib/state/client/context.ts` shows `:584` is `createProblems({ here: () => sourceOnScreen(...) ?? editorStatus.focused() ...`, the F8 problems reader. The debug wiring is at `:540` and `:631`.
- Effect: part 2 changes F8's answer while the focused tab is hidden, and no requirement or case names it. See Implied inputs 2.

Premises 5. Brief line 26 leaves out a step of `workspaceOf`.
- It says a session's workspace is the nearest `.git` folder "else its `cwd`".
- `sed -n 168-176p src/lib/server/sessions/group.ts` shows `gitRoot(cwd) || rootChild(cwd, roots) || cwd`, so `rootChild` (the first segment below the deepest configured root) comes before `cwd`. It is minor, and the requirement is unaffected.

Premises 6. Brief line 28: `GitState` is at `model-sessions.ts:428-497`, not 440-500 (`grep -n "export type GitState"` prints `428:`). `state.ts:145` (`rev-parse --git-dir`) holds, and `grep -rn "show-toplevel" src/lib` finds only `server/git/clone/exclude.ts:95`.

Premises 7. Brief line 37: `AppsStore` is `apps.svelte.ts:189-268`, not 189-260. The surface it names holds (`rows`, `rowOf`, `review`, `reviewing`, `approve`, `revoke`, `showFolder`).

Premises 8. Part 5 assumes a state the row does not carry.
- Part 5 asks each row to say "changed since approval" apart from "waiting for approval".
- `sed -n 200-208p src/lib/server/machine/apps/read/scan.ts` shows `const hashApproved = input.approved.has(hash); const approved = kept || hashApproved;`. Approvals are a set of hashes with no record per app (`scan.ts:64` "The content hashes the approvals file holds as approved apps").
- `AppFrame.svelte:345-346` tells "changed" from the tab's own `tab.seen`, or `row.approved && !row.hashApproved` for a kept app.
- For an approved app that is not kept and whose files changed, `AppRow` is identical to a never-approved app.
- Effect: the builder either cannot draw "changed" or adds a field to `AppRow` and the `apps` payload, which is a wire shape no ruling names (spec.md:18).

Premises 9. Brief line 45's grep finds more than it says.
- The brief says `grep -rni "reopen" src/lib config/text` "finds only Reopen Editor With..., Reopen Closed Repositories and the subtask reopen".
- The output also has `config/text/views/system/workbench.yml:239 workbenches_reopen: Reopen` (`Workbenches.svelte:23-27,300`, reopening a closed workbench's kept layout), `leads.yml:10-11` (a lead's reopen) and `project.yml:17`.
- None blocks the step. The Workbenches reopen is the nearest existing feature to Reopen Closed Tab and is not named; see Implied inputs 9.

Premises 10. Brief line 76 cites part 9's line numbers slightly off.
- `sed -n 270,360p src/lib/data/index.ts` shows the registries read at `:285-292` (the brief says 284-290) and `REGISTRY_KEYS` at `:325-334`.
- `:352` is `if (collections) registries.push('funding')` in `unnamedBy`. The funding file is read at `:282` and `:289`, and `unnamedBy` is `:342-353`, not 345-353. The substance holds.

Premises 11. Part 6 bullet 5 cites a palette command list that HELP.md does not have.
- It says "the palette's command list in `HELP.md` gains `:reopen-closed-tab`".
- `grep -n "^## \|^### " HELP.md` shows no such list. HELP.md:67 points at the generated `docs/palette.md`. See Names 5.

Premises 12. Several folders the step adds files to are already at the ten-item limit.
- Command: `git show HEAD:tools/oculus/src/lib/state/workbench/layout/` lists exactly 10 tracked items (access.ts, index.ts, instance.ts, instances.ts, model.ts, nested.ts, open/, saved/, tree.ts, workbench.ts). `layout/open/` also holds 10.
- The write list says "a new file there when `instances.ts` would pass the size limit". `instances.ts` is 412 lines (`wc -l`), so the size limit is far off, but any new file in `layout/` breaks `utils/folder-check.sh` (spec.md:47).
- Part 12 says the two cards "move into `src/lib/views/shared/`". `git show HEAD:tools/oculus/src/lib/views/shared/` lists 10 items, and `views/shared/card/` holds 10.
- Effect: the builder writes there and goes red, or makes new folders the brief does not name.

Premises 13. All other premises reproduced:
- `host.ts:38-56`, `:46`, and `poll.ts:170-178` (`hub.publish('hpc', degraded('unreachable', current.missing))`, then the `finally` that runs `schedule(... RETRY_MIN)`).
- `hpc.yml:46`, `model-sessions.ts:523`, `docs/apps.md:365` and `:368`, `HELP.md:262`.
- `source-status.svelte.ts:37-41` and `:44`, `Source.svelte:468`.
- `debug.svelte.ts:340`, `:412`, `:421`, `:433`, and `debug.yml:52` "Open a file that a debugger starts".
- `commands.svelte.ts:469`, `git.ts:713-720`, `repositories.ts:395-403` and `:404-414`.
- `.oculus/workspaces/research-hub.yml` lists `oculus` at `~/workspace/research-hub/tools/oculus`, and `ls -ad ~/.claude/.git ~/.oculus/.git` gives "No such file" for both.
- VS Code's `main.js` holds `getRepositoryRoot(e){let t=await this.exec(e,["rev-parse","--show-toplevel"])` and `getRepositoryExact`.
- The `gitRoots()` reader list, `rail-badges.svelte.ts:204`, `ChangesRepository.svelte:32-34` (at `views/sessions/session-detail/`), `HELP.md:428`, `DESIGN.md:725`, `repositories.ts:12-16`, `Repositories.svelte:22-27`, `Repo.svelte:44` and `:362-368`.
- No test names `pickerRoots`, `repositoryLabels` or `limitedRepositories` (the grep prints nothing).
- `config/layout.yml:19`, `:35`, `:44` and `:107-108`; `ui.yml:51`; `PaneBody.svelte:91`; `git show 10ac00c69 -- tools/oculus/config/layout.yml` adds `apps:`.
- `apps.yml:99` `menu_add: Add app from folder`, `HELP.md:406-424`.
- `arrangement.ts:25-52`, `model.ts:17-26`, `pinnedTabsFirst` at `:245`, `saved.ts:333-334`, `TabFace.svelte:15-18` and `:172-186`, `tab-menu.ts:204-225`, `tab-strip.ts:115-124`.
- `resolve.ts:22-26` and `:177`, `workbench-keys.svelte.ts:261-264`, `PaneView.svelte:300-301`, `close-question.svelte.ts:64-68`.
- `instances.ts` `closeInstanceAnywhere` at `:237` and `closeInstance` at `:291`.
- `palette.ts:447-550`, `app.yml:61`, `HELP.md:44`, `:100` and `:140`.
- `portfolio.ts:634`, `:650`, `tones.ts:80-86` and `:150-154`, `socket.svelte.ts:380`, `install.ts:24`, `data/index.ts:576`, `merge.ts:125`, `Venues.svelte:64`, `Data.svelte:61`, `apps.ts:95`.
- `hub-names.ts:9-13`, `:212` and `:222-247`, `manifests.ts:69`, and every reader the brief lists for part 8.
- `config/sources.yml:55-58` and `:60-62`, `.oculus/config/sources.yml:65-67`, `VenueCard.svelte:266`.
- The count prints `140` over the 11 files the brief lists, and `NOT_A_FIELD_VALUE` and the career words (`subtasks.ts:311-368`) hold.
- `form-draft.ts:122`, `Entry.svelte:200`, `history.yml:45`, and the `Entry.svelte:25` head comment "A feed entry shows the editor alone".
- `changes.ts:345` and `:382`, `changes.svelte.ts:156` (`createChanges(queries: Queries)`), `context.ts:209` `const changes = withQueries('changes', createChanges(queries));`, `writes.ts:334-341` (the `ChangeLog` object inside `target()`, which starts at `:300`), `+page.svelte:276-294`.
- `entities.afterReceive` and `payloadOf` exist (`entities.svelte.ts:45`, `:55`), and so does `queries.refetch`.
- Every caller of `logChanges` gets its log from `target()`: `grep -rn "changes: target\|changes: \|changes = " src/routes src/lib/server/root`.
- `src/lib/state/system/history` does not exist (`ls`). The History label is chosen in `views/system/history/History.svelte:112-116` (`kindOf`), which the write list's "or where the History row's label is chosen" covers.

## Cases and checks

Cases and checks 1. Brief line 263, part 7's heading (line 193) and part 8's heading (line 201) contradict spec.md:63-64.
- They have a case checked through "the page on a scratch server on port 8796 with a scratch home and a scratch hub, driven through the browser the builder's runner offers".
- spec.md:63: "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says. A case that only a page shows is checked by reading and by the unit-level runs that reach it, and its row in the report names the look on landing as its proof."
- spec.md:64 puts a press, a focus and an effect at the look.
- Verify item 5 ("Each case's run is quoted on the unchanged tree and after the change") and the first-run rule (brief line 260) assume runs that spec.md bans for these cases. The cases that only a page shows: 1's drawing half, 20 to 29, 35, 36, 71's "first frame", 73 and 74.
- Effect: the builder starts a scratch oculus against the rules file, or reports these cases as unrun.

Cases and checks 2. The test-rule bullet (brief line 262) says "Parts 1 to 10 and 12 are under no entry and get no test". `grep -n` over `agents/guarded.md` for the files the step changes shows that is false:
- G54 (`guarded.md:209-211`): "Every page arrangement in `config/layout.yml` parses". Its Code is `config/layout.yml`'s arrangements and `parseArrangement` in `arrangement.ts`, which part 6 changes.
- G13 (`:179-181`): "A wrong config value is refused with a finding that names the key". Its Code is "the config readers under `src/lib/data/sources/config/`", which part 8 changes. Cases 54 and 62 are G13 outcomes.
- G61 (`:197-199`): the config cache over "the primary hub's `.oculus/config/` folder", whose Code is `config-cache.ts`. Part 8 changes it, and case 58 is its outcome.
- G32 (`:203-204`): the parsers of the hub's files. Its Code includes `src/lib/data/sources/` and `src/lib/data/index.ts`, which part 9 changes (cases 60 and 61).
- G8 (`:63-66`): "Each write kind changes only the file and key it names; the rest of that file stays byte-identical". Its Code includes `writes.ts`, `writes/` and `config-value.ts`. Parts 8 and 10 change these, and case 56 is a G8 and G9 outcome.
- G9: its Code is `src/lib/server/core/changes.ts`, which part 3 changes (`logChanges` publishing).
- G77 (`:55-57`) names `app-setting`, which part 8 changes (case 57).
- G81 (`:221-223`) names `src/lib/server/root/watch/git.ts`, which part 4 changes.
- G3: `private-folders.ts`, whose hub test moves (Implied inputs 13).
- spec.md:58 says "A step whose change touches an entry's code runs that entry's test" and "one row per input that gives a different outcome". The brief names none of these entries' tests to run or extend.
- Effect: the builder may skip them, and a new outcome such as case 54 or 62 gets no row under G13.

Cases and checks 3. The brief places case 72 as a row of G9's tests, but the label it tests is not in G9's code.
- The brief: "the undo's row is G9's (its tests `tests/server/core/changes.test.ts` and `tests/routes/edit/undo/undo.test.ts`), so cases 69, 70 and 72 are rows of those files".
- The History label is chosen on the page: `sed -n 108,116p src/lib/views/system/history/History.svelte` shows `return t(\`history.kind_${row.kind.replaceAll('-', '_')}\`)`. The record already carries `undoes` (`changes.ts:147`, `:356`).
- A fix in `History.svelte` is outside G9's Code line, and a server test file cannot test it. A label drawn in a view is a look (spec.md:64).
- Effect: the builder moves the fix to the server to fit the test, or writes a test under no entry.

Cases and checks 4. Case 69 and case 70's settle tests sit uneasily under G28.
- They are placed under G28 (`form-draft.ts` is in its Code). G28's sentence (`guarded.md:74`) is about an unsaved edit surviving and closing asking first. It does not say a saved value shows at once.
- spec.md:58 allows a row per outcome of a unit in an entry's Code, so this holds by the Code line and not by the guarantee. The orchestrator may want G28's sentence widened at landing.

Cases and checks 5. The case headings are wrong for parts 10 to 12.
- Cases 64 to 68 (part 10), 69 to 72 (part 11) and 73 to 74 (part 12) sit under the heading "Part 9, one list of record files:" (brief line 210), and parts 10, 11 and 12 have no heading.
- Cases 11 to 37 (parts 4 to 6) come after case 74.
- Effect: the report's case-by-name list may assign part 10's cases to part 9.

Cases and checks 6. Cases that check a place the step does not change:
- Case 12's "the session detail's Changes of the first session shows its changes" checks `ChangesRepository.svelte`, which the step leaves unchanged by design.
- Case 63's "an events entry ... read as before" checks a reader part 9 does not touch.
- Both are regression checks of an input the step changes (the `git` channel and `collections:`), so they are reasonable. None asks the builder to quote or explain an unchanged place.

Cases and checks 7. The rest of "Cases" is consistent with spec.md.
- Case 1 advances a fake clock for something that must not happen (spec.md:67).
- Cases 69, 70 and 72 quote their failing run (spec.md:66).
- "No harness is kept in the tree" agrees with spec.md:58.

Cases and checks 8. The verify list asks for a run spec.md reserves.
- It asks for `npx vitest run tests/checks` (every tree check). spec.md:25 says a builder runs only the tests covering what it changes, plus `npm run test:quick` once, and that the tree checks run in the orchestrator's landing list.
- spec.md:3 says a brief overrides nothing in spec.md. The orchestrator should confirm this is wanted.

Cases and checks 9. The tree checks will most likely be red in the worktree.
- `tests/checks/config/integrity.test.ts` (G14, "The real hub builds with no findings") reads the worktree's own hub through `loadConfig(engine, { hub })` (`tests/fixtures/hubs/real-hub.ts`).
- After part 8, the worktree's hub holds only the old `.oculus/config/` (tracked, unchanged until the landing move). It reads as no hub, so its `venue_themes` and `data_themes` are the engine's empty lists (`config/catalogs/vocab.yml:239`, `:242`). Every theme word in `registries/*.yml` would then be a finding.
- This is expected from reading and was not run.
- The brief forbids the builder to write the hub's data files and does not say how to treat this red line.

## The question

The goal is the part of plan.md's goal this step delivers. plan.md has no "Goal" heading; its first paragraph names it the execution ledger for `tools/oculus/DESIGN.md` (cockpit to oculus). For D74 that is the twelve behaviours of its line. The question is whether each check could pass without that goal being reached.

Cases 1 to 4 (part 1):
- 1: could pass. The HPC float's half is checkable on `Head.svelte` and `Hpc.svelte`, but the status bar's words come from `hpcWords` in `status.ts` (Names 1). A check of the shell files alone passes while the bar shows "0 running, 0 pending".
- 2: could pass. It does not cover a poll already in flight when the push removes the cluster (Implied inputs 1).
- 3 and 4: no; they assert the reason and the countdown.

Cases 5 to 10 (part 2):
- 5: could pass. The brief says the path that drops the focus at a tab switch is unknown (line 20). A harness that calls the store directly can pass without reproducing the real tab switch, and nothing requires the first run to be red.
- 6 to 10: no, provided 5's first run is red. F8 is untested (Implied inputs 2).

Cases 38 to 46 (part 3):
- 38 to 40: no; they are the record's red command.
- 41: no; it checks the kept rows.
- 42 and 43: no.
- 44: no.
- 45: could pass by timing. Two appends in one millisecond share an `at`, and the store's "already holds a row that new" test would drop the second (Implied inputs 4).
- 46: no.
- The Step 0 red command (the line's check): it could pass while the reader's older pages are dropped, since its three writes start from one page. Case 41 covers that.

Cases 11 to 19 (part 4):
- 11 to 15: no, if run over the list's functions.
- 16: could pass. The brief names `tab-file.svelte.ts` as the item, and a check there passes while the real item (`status.ts`) still names `oculus` (Premises 1).
- 17, 18 and 19: no. Case 18's single failed root does not test two roots with an empty `top` (Implied inputs 6).

Cases 20 to 26 (part 5):
- 20, 22 and 24 to 26: no; they are a look.
- 21: could pass without the goal. It tests only "waiting for approval", and no case shows "changed since approval", which the row cannot tell (Premises 8).
- 23: no.

Cases 27 to 37 (part 6):
- 27 and 29: they pass on the unchanged tree except the arrangement pin. Close All and Delete already spare a pinned tab (`tab-menu.ts:204-225`, `tab-strip.ts:115-124`), so their proof is the start-pinned half alone.
- 28 and 30 to 37: no. No case covers what goes into the closed list on a close the code makes (Implied inputs 9).

Cases 47 to 52 (part 7):
- 47 to 49: could pass. The heading allows "a harness over the payload and `tones.ts`", which passes while the board and Present readers (`state/boards/board/items.ts:112`, `facets.ts:65`, `views/academic/present/parts/*`, `state/life/present.ts:242`) still draw from the primary.
- 47 to 49 could also pass while the first frame, from `src/routes/+page.server.ts:42` `vocab: vocabCatalog(config)`, draws the primary's words. That file is not in the write list.
- 50 and 51: no, if run on the views.
- 52: no.

Cases 53 to 59 (part 8):
- 53 to 55 over `loadConfig`: could pass while `config-cache.ts:57` still stamps the old folder. Case 58 tests the watcher's rebuild, not the cache a request reads, which is G61's.
- 55 "nothing of it is read" passes while the hub's `secrets` folder silently stops being private (Implied inputs 13).
- 56, 57 and 59: no.

Cases 60 to 63 (part 9): no.

Cases 64 to 68 (part 10):
- 64 to 67: no.
- 68: could pass without the line's goal. The count misses the English `error:` and `new Error(...)` sentences (The step line 1), and any sentence moved into a constant (the `NOT_A_FIELD_VALUE` form) or a variable leaves the grep.

Cases 69 to 72 (part 11):
- 69 and 70: no, at the store.
- 71: "from its first frame" is a look.
- 72: see Cases and checks 3.

Cases 73 and 74 (part 12): no; they are a look.

Items of "What to build" that could pass without the goal:
- Part 4 bullet 3 (each other `gitRoots()` reader stated): it can be met in full while the status bar item, which reads the payload directly, is never examined.
- Part 8 "Every reader above reads ... that one file": its list leaves out `README.md` and the HELP, DESIGN and docs/apps.md lines of Names 3.
- Part 10: see case 68.
- Part 6 bullet 5: the HELP.md palette list does not exist, and the real list (`docs/palette.md`) is unchanged (Names 5).
- The other items carry their own checks above.

## Implied inputs

Implied inputs 1. Part 1: a push that removes the cluster while a poll is in flight.
- `poll.ts:180` guards with `began !== asking`, but `none` is a new state.
- Expected: `none` stays and the in-flight answer publishes nothing.
- Cost: a stale `ok` or `unreachable` over a hub with no cluster.
- Also missing: the Refresh press under `none` (expected: it publishes `none` and runs no ssh), and Submit to HPC from a source tab on such a hub (`submit-job.svelte.ts:100`).

Implied inputs 2. Part 2: F8 while the focused source tab is hidden.
- After the fix, `context.ts:584` (`... ?? editorStatus.focused()`) answers with a hidden tab's caret.
- Expected (to be stated): F8 steps from the hidden tab, as the comment at `:562-564` says, or does not.
- Also missing: a reload, after which the store is empty and nothing is focused; and two pages or desktop windows, each with its own store.

Implied inputs 3. Part 2: the focused tab's file renamed or deleted while hidden. Its kept status names the old file. Expected: Start and the placeholders read the last status as kept, or the tab is treated as gone.

Implied inputs 4. Part 3: two appends with the same `at`. Expected: both rows show. Cost: a write missing from an open History, the defect itself.

Implied inputs 5. Part 3: an undo made from the History view itself publishes `changes` and also reloads. Case 46 says "reloads one page as now". Expected: the publish adds no second request, or the case accepts it.

Implied inputs 6. Part 4: two or more roots with an empty `top` (timed out, failed, or a bare repository).
- "Roots with the same `top` as one repository" would merge them into one row.
- Expected: each root with an empty `top` is its own row (shape `failed`), or has none (`none`/`missing`).
- Cost: repositories vanish from the list.

Implied inputs 7. Part 4: a root path through a symlink. `top` is the real path. On macOS `$TMPDIR` is `/var/...` and its real path is `/private/var/...` (case 12), so "the root whose path is the top" never matches textually. Expected: the comparison is over real paths, and the label is the top's folder name.

Implied inputs 8. Part 4: a Repositories tab whose instance state has `oculus` in its `closed` list. Case 19 covers the shown root only. Expected: the closed list maps by top, or the entry is dropped.

Implied inputs 9. Part 6 leaves several close paths and inputs unstated.
- Closes the code makes are not stated: `File.svelte:199`, `read-again.ts:44`, `Doc.svelte:220` and `:239`, `AppFrame.svelte:230`, `closeInstancesOfView` (an app removed), a preview tab replaced, a tab moved between pages (`open/float/pages.ts:216-246`), and a workbench page closed (whose layouts the Workbenches view already reopens).
  - Expected: only a reader's close command records (the close control, Cmd+W, Delete, the tab menu's items, Close pane, Open Editors' close), and a close the code makes records nothing.
  - Cost: Reopen brings back a tab the reader never closed, or a removed app's view.
- A source tab whose file was deleted or moved since it closed. VS Code drops it (brief line 46, `:830-847`), but part 6 says only that the file comes back "as it is on disk". Expected to be stated: skipped and dropped.
- A float's tabs (`floats:`, which share `tabsShape`): pinned or not.
- A `docs:` document given to an already saved page later (`layout.yml:44`, "given each such document it lacks, once"): pinned or not.
- An app binding `cmd+shift+t`: from now on it is left out with a finding (`data/helpers/keys/oculus-keys.ts` `takenBy` resolves through `resolve.ts`). It is a host-visible change for app builders, not stated.

Implied inputs 10. Part 5: a search that matches nothing. Expected: a sentence such as "No app matches" with the list empty, which is different from case 25's "no app at all".

Implied inputs 11. Part 7: hub names and loading.
- A record whose `root` names a hub that has left the workspace.
- A workspace with no primary, where every hub's records are prefixed (`hub-names.ts:9-13`). Expected: each record is drawn with its own hub's lists, and the "primary's for a record with none" rule has nothing to fall back to.
- The first frame from `+page.server.ts` and `present/show/+page.server.ts:14` (`vocab: vocabCatalog(config)`), neither in the write list. Expected: the per-hub lists are there from the first frame. Cost: another hub's records drawn in the primary's colours until the socket's `config` arrives, which is the bug part 7 ends.

Implied inputs 12. Part 8: unusual contents of `.oculus/config.yml`.
- A file that is empty, not a map, unparsable, or with a duplicated key. Expected: the folder is a hub, with a finding naming the file, and the engine's values used.
- A nested key outside the list (`slurm: { resource: x, poll_min: 3 }`). Expected: `slurm.poll_min` is a finding and `slurm.resource` is applied.
- A folder holding both `.oculus/config.yml` and the old `.oculus/config/`. Expected: the folder is ignored and nothing names it.
- Cost: a whole hub lost, or keys applied silently.

Implied inputs 13. Part 8: a folder that holds `secrets/` and only the old `.oculus/config/`.
- `private-folders.ts:1-3` and `server/files/workspace/folders.ts:191` (`hub: ... isHubFolder(dir)`) make a hub's `secrets` folder private only while the folder is a hub. G3 guards this.
- After the change, such a folder's secrets are open to the YAML language server and the library rules.
- Expected to be stated, with G3's test run.
- Cost: secrets handed to a language server.

Implied inputs 14. Part 9: a `collections:` list that names one fixed registry key twice, or names `data` at a file that is not a dataset registry. Expected: the first entry, with a finding naming the key.

Implied inputs 15. Part 11: inputs around a save.
- Another writer changes the field between the Save and the reread. Expected: the editor shows the reread's value once it arrives, never the stale saved value as current.
- A second Save in flight over the first (superseded). Expected: the newest answer settles.
- A Save that renames the entry's key (a venue's `name` after open item 82, a pillar's key). Expected: the page and the tab title follow the new key from the first frame.

Implied inputs 16. Part 12: Delete on a lead's or a paper's own page. Expected: the page closes or says the entry is gone in the catalog's words. Unstated.

Implied inputs 17. Every new id is new and checked:
- `none`: it duplicates the concept of `unconfigured` (Dictated text 2).
- `top`: empty, see 6.
- `changes`: no collision (Names 9).
- `apps` as a view id: no collision with app ids `app:<name>` (DESIGN.md:324), but it is the nav group's key (Names 6).
- `:reopen-closed-tab`: no collision in `commands()`.

## ADRs

No ADR folder. Commands: `ls docs/adr tools/oculus/docs/adr` printed "No such file or directory" for both, and `ls docs/glossary.md tools/oculus/docs/glossary.md` printed the same, which agrees with the brief's report line on terms.

## Dictated text

Each item gives the command that finds the dictated text in the brief, from `tools/oculus/.scratch/migration/agents/briefs`.

Dictated text 1. The palette command's description.
- `grep -n "Reopen the tab closed last" D74.md` prints `337:`.
- Against spec.md:20 (plain, ASCII, no em dash, no "not X but Y") and the hub's prose rules, it holds.
- Its content is narrower than part 6, where one press reopens the last batch, all four tabs after Close All (case 31). "Reopen the tabs closed last" or "Reopen the last closed tabs" would match the behaviour.

Dictated text 2. The status value `none`.
- `grep -n "fifth \`HpcStatus\`, \`none\`" D74.md` prints `58:`.
- It holds against spec.md's prose rules, but it names a concept the apps guide already names otherwise.
- `grep -n "unconfigured" docs/apps.md src/lib/data/model/accounts/*.ts` shows `docs/apps.md:370` (`inbox` `status` ... `unconfigured`) and `model-connect.ts:35-36` ("`unconfigured` when the machine names no account").
- An app reading both channels meets two words for one state: nothing named to poll. Under the hub's prose rule "No synonym cycling" (CLAUDE.md, "Writing docs") this deserves the orchestrator's look at Z862.

Dictated text 3. `grep -n "ChangesPayload = { at: string }" D74.md` prints `81:`. It holds.

Dictated text 4. `grep -n "into \`GitState.top\`" D74.md` prints `91:` (the field `top`). It holds.

Dictated text 5. `grep -n "\`:reopen-closed-tab\` in the browser" D74.md` prints `117:`. It holds; the word "tab" matches the tab menu's vocabulary (decision 6).

Dictated text 6. `grep -n "{ view, pinned: true }" D74.md` prints `114:`. It holds.

Dictated text 7. `grep -n "settings in \`.oculus/config.yml" D74.md` prints `134:`. It holds.

Dictated text 8. The "Doc text" part of the report.
- `grep -n "under \"Doc text\"" D74.md` prints `139:`. Part 8 tells the report to give the file's keys "under 'Doc text'".
- The Report section (brief lines 380-391) lists no "Doc text" part, so the report shape and part 8 disagree.
- Separately, part 8's hub lines and `registries/*.yml` and `docs/DATA-MAP.md` are hub text a builder rewords. spec.md:104 asks "the report lists each line before and after", and the Report section does not require it.

Dictated text 9. `grep -n "Everything in the brief is done" D74.md` prints `382:`. It holds; it is spec.md:81's own sentence.

`LC_ALL=C grep -n '[^ -~]' D74.md` printed nothing, so the brief is ASCII.

## Declined to judge

- **VS Code source citations:** `historyService.ts:663-800` and `:830-847`, and `workbench.contribution.ts:286-296` in microsoft/vscode main. No source checkout is on this machine and I did not fetch it. Only the git extension's `main.js` was checked.
- **What drops the focused tab at a tab switch** (The step line 2): settling it needs a run of the page or a client harness, which this check does not run.
- **The diagnosis record** (`agents/reviews/D74-diagnosis.md`, 826 lines): I read its head, red command, cause list and probe list, not its full diff or harness source. Its correctness is the diagnosis' own.
- **Cases and checks 9:** whether `tests/checks/config/integrity.test.ts` goes red in the worktree is inferred from reading `tests/fixtures/hubs/real-hub.ts` and `config/catalogs/vocab.yml`. Not run, by the rule against running suites.
- **Whether `.note` files are started by a debugger** in case 5: not checked, since it is the case's own setting from D64's look.
- **The step's size, and whether the twelve parts fit one builder:** a sizing judgment for the orchestrator.

Usage: a1dd027bb4d25ddfb, claude-opus-5-5, 324,217 tokens, 144 tool uses, 17.4 min.

## Closed

Each finding closed in `agents/briefs/D74.md` before the preparation commit, by the orchestrator.

- Summary, Pages; Cases and checks 1: the page-driven runs are gone from part 7's and part 8's headings and from the case rule; a case only a page shows is checked by reading and unit-level runs, its row naming the look, as spec.md says, and the cases are listed.
- Summary, The status bar; Names 1 and 2; Premises 1 and 2: `src/lib/state/workbench/navigation/status.ts` is in the write list; part 1 names `hpcWords`, part 4 names the repository item's functions; the premises say what `tab-file.svelte.ts` is (a source tab's own repository) and that the status bar's item reads the payload directly.
- Summary, Test rule; Cases and checks 2: the test rule lists G54, G13, G61, G32, G8, G9, G77, G81, G3 and G28 with the cases that are their new rows; each entry's test runs.
- Cases and checks 3: case 72's History label is chosen on the page from `undoes`; it is a look and no server test.
- Cases and checks 4: cases 69 and 70 stay rows of G28's test by its Code line; the orchestrator widens G28's sentence at landing to name the settle of a saved edit, and G9's to name the `changes` publish.
- Cases and checks 5: the case headings for parts 10, 11 and 12 are added.
- Cases and checks 6: kept as regression checks of inputs the step changes.
- Cases and checks 7: no change.
- Cases and checks 8 and 9; Summary, The tree checks: `npx vitest run tests/checks` is replaced by the tree checks the change reaches; `config-folder.test.ts` and `integrity.test.ts` fail in a worktree on the base already, since the sparse checkout holds no `.oculus/` (D72's report, line 177), are quoted on the base and after, and run on main at landing after the orchestrator writes `.oculus/config.yml`.
- Summary, Write list too narrow; Names 3: HELP.md, DESIGN.md and docs/apps.md are whole files in the write list, `tools/oculus/README.md` line 13 is added, and part 8 names every line found; renamed test titles (G61) are listed in the report for `agents/guarded.md`.
- Names 4: part 9 says one of the seven `*_file` keys; the four that stay are named; a key named twice in `collections:` is a finding (Implied inputs 14, case 62).
- Names 5; Premises 11: part 6 regenerates `docs/palette.md` with `npm run docs:palette`, which is in the write list and the verify list.
- Names 6: part 5 says the Apps view is the Apps group's first row, the app views' digits move by one (stated in the report), the catalogue's no-app branch, and HELP.md's views table row; decision 5 gives why.
- Names 7: a float's tab accepts `pinned: true`; the shipped floats stay unpinned.
- Names 8 and 9: no change.
- The step line 1: part 10 covers the 13 `error:` answers and the 5 `new Error(...)` sentences that reach a reader, and sentences kept in constants, with two more greps in case 68.
- The step line 2: no change; case 6's first run shows the path, and a premise it finds wrong is reported.
- The step line 3: no change.
- Premises 3, 5, 6, 7 and 10: the line numbers and `workspaceOf`'s `rootChild` step corrected.
- Premises 4; Implied inputs 2: F8 at `context.ts:584` is named among the readers and steps from the hidden focused tab, as its comment says; case 10 covers it.
- Premises 8: part 5's states are those `AppRow` carries; changed since approval only for a kept app; a changed app that is not kept reads waiting for approval; no field is added. Case 21 covers both.
- Premises 9: the other reopen features are named; none reopens a tab.
- Premises 12: part 6's and part 12's paths say the folders hold ten items and a folder that would pass ten is split by concern, as spec.md says.
- Premises 13: no change.
- Implied inputs 1: part 1 and case 2 cover the push during a poll, Refresh and Submit under the no-cluster state.
- Implied inputs 3: part 2 and case 75.
- Implied inputs 4: part 3 and case 45.
- Implied inputs 5: case 46 stands; the store asks nothing when it holds the newest row.
- Implied inputs 6 and 7: part 4 and case 76.
- Implied inputs 8: part 4 and case 19.
- Implied inputs 9: part 6 and cases 77 and 78; an app's `cmd+shift+t` binding is a stated host-visible change.
- Implied inputs 10: part 5 and case 25.
- Implied inputs 11: part 7 and case 83; the readers and the two `+page.server.ts` files are in the write list.
- Implied inputs 12: part 8 and case 79.
- Implied inputs 13: part 8 and case 80; no other folder of the workspace holds `.oculus/config/` (`ls -d` over the eight folders).
- Implied inputs 14: part 9 and case 62.
- Implied inputs 15: part 11 and case 82.
- Implied inputs 16: part 12 and case 74.
- Implied inputs 17; Dictated text 2: the no-cluster value is `unconfigured`, the word the `inbox` and `connect` channels use for the same state; Z862 amended.
- Dictated text 1: the description reads "Reopen the tabs closed last".
- Dictated text 8: the Report section gains "Doc text", the hub text lines before and after, and the test rows and titles.
- Dictated texts 3 to 7 and 9: no change.
