# Step O84 brief check (on main at 467be69c2)

This is the report of the fresh agent of the `spec` skill's "Steps / The brief check" on `agents/briefs/O84.md`. A page this report cites (the rules file, a standard, a skill's text) is named by its section and never by a line number, because a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`. Every command ran in `/Users/axelfaes/workspace/oculus` on main at 467be69c2 (`git log -1` printed `467be69c2... Land O85: a hub's own settings set in Settings for any hub`).

## 1. Names

- **The option `self`** (the brief's grep): `grep -rn "workspace setting .self\|setting .self.\|setting self" src config docs tests --exclude=local.yml | wc -l` prints 48, over 37 files, as the brief says. The hits that sit outside the "Paths this step writes", or outside the line ranges given there:
  - `docs/HELP.md:288` ("...name you (the workspace setting `self`)..."). The change makes it false. It falls inside O89's range, and the brief's "Doc text" lists only 277, 317 and 538, so this line is missed.
  - `docs/data-map.md:216` (it is in Doc text) and `docs/HELP.md:277`, `:317` (also in Doc text). These are covered.
  - `src/lib/data/snapshot/normalise.ts:601` ("whose `self` the people are read with"). The change makes it false. It is outside the ranges 360-395 and 620-635 that the paths give for this file.
  - `src/lib/data/model/model-collections.ts:496-504` (`self?: SelfCheck`, `export type SelfCheck`). The removal of `checkSelf` makes this dead code, not only a false comment. The paths cover this file only through "the comments of the other files the grep lists". O86 also writes this file (`Feeds`, line 415).
- **Hits the brief's grep does not catch, outside the paths:**
  - `grep -n "self" config/defaults/sources.yml`:
    - `29:` "...the `self` key below names the user's own entry". False once the key leaves. The paths give only lines 5 and 82, and the comment of the key itself is line 81.
  - `grep -rn "SelfCheck\|selfKey\|checkSelf\b" src tests | grep -v checkSelfRelated`:
    - `src/lib/data/index.ts:68` (`import { normalise, selfKey }`). This is outside the range 455-515 the paths give for `index.ts`, and the build breaks if the import stays.
    - `src/lib/data/model/index.ts:43` (`export type { KeyFault, SelfCheck, ...}`). Not in the paths and not in the grep.
  - `src/lib/server/edit/writes/config/config-sources.ts:6-8`: "since a setting such as `self` names a record of that hub by the key its file gives it". False. Its code at 73-76 checks a `from: people` value against `hubRecords(people, inputs.primary)`, the primary's people alone, and item 4 requires the value to be checked against the people of every hub. The file is not in the paths.
  - `src/lib/server/root/process/context/machine-defaults.ts:37-60`: `machineDefaults` names a default for every `local.yml` key, and `self` needs one for the This machine row. Not in the paths.
  - `src/lib/data/sources/config/catalog/schemas/engine.ts:89-110,267`: the schema of `local.yml` is built from `config/options/local.yml`, and `choiceSchema` (`schemas/options.ts:87-96`) turns `from: people` into an `enum` of the building hub's people. The YAML server would then flag `self: kim` in P's `local.yml` when kim is L's. Not in the paths.
  - `src/lib/views/system/workbench/editors/FieldControl.svelte:28-34`: Add person on "a choice whose catalog `from` is the people registry alone (the setting `self`)". `docs/HELP.md:277` says the same. This is a behaviour of the row being moved, and only its comment is covered by the paths.
  - `src/lib/state/client/selectors.svelte.ts:811-815`: `newProjectPerson: (keys, hub) => personOfNewProjects(rolesOf(vocabOf(hub)), keys, selfIds(...))`. Item 7 needs code here, and the paths say "(comments)".
  - `src/lib/views/shared/forms/NewIdeaForm.svelte:120` calls `newProjectPerson`. Only its comment at line 12 is covered.
  - `docs/HELP.md:327`: "Each control writes your value into the open workspace file's `settings:` ... with no workspace file open it offers Save Workspace As... The `local.yml` keys are listed under This machine with their value in force". False for the `self` row. Not in Doc text.
  - `docs/HELP.md:514`: "the open workspace file's `settings:`, which ... is where Settings and every control that sets an option write". False for the `self` row. Not in Doc text.
  - `config/options/layout.yml:145`: "not applied when the workspace names no self".
  - The state comments that say "the workspace names a `self`" are loosely false now that the machine's file names it:
    - `src/lib/state/boards/board/state.ts:104-126`
    - `facets.ts:244`
    - `filter-menu.ts:137`
    - `presets.ts:151-212`
    - `src/lib/data/shapes/boards/takes.ts:5-35`
    - `src/lib/state/boards/focus/filter.ts:10,122`
    - `src/lib/state/boards/focus.ts:532`
    - `src/lib/data/shapes/boards/roles.ts:183`
  - `tests/fixtures/hubs/demo/.oculus/data/people/people.yml:1` ("the user of a workspace that names them `self`") is loosely false.
- **The entries of `.scratch/migration/agents/guarded.md`:**
  - `:70`, G8: "The Settings writers (`config-value`, `config-key`) never write a `local.yml`". The change makes it false.
  - `:375`, G119: "The choice Self lists the people of the primary hub that have no `root`". The change makes it false.
  - Item 10 has the builder name tests per entry. Nothing in the brief rewrites these two rule sentences at landing.
- `tests/routes/edit/config-key.test.ts:201-215` (the route test that `local.yml` with `port` is refused) stays true. It is not in the paths, and no route-level case of the `self` write is named.
- `setSelf`, `localRows`, `machineValues`: every caller found is in the paths or is a test the paths list (`tests/state/system/settings/port-row.test.ts`, `tests/routes/hubs/machine-answer.test.ts`). Those two tests are outside the paths and need no change, as far as reading shows.

Findings:
- Hits the change makes false, outside the paths or outside the given ranges:
  - `config/defaults/sources.yml:29` and `:81`
  - `normalise.ts:601`
  - `index.ts:68`
  - `model/index.ts:43`
  - `model-collections.ts:496-504`
  - `config-sources.ts:6-8,73-76`
  - `machine-defaults.ts`
  - `schemas/engine.ts` (the local.yml enum)
  - `selectors.svelte.ts:811-815` (code)
  - `NewIdeaForm.svelte:120`
  - `HELP.md:288,327,514`
  - `guarded.md` G8 and G119
- Loosely false comments: `config/options/layout.yml:145` and the "workspace names a `self`" comments listed above.

## 2. The step line

`grep -n "^- \[ \] O84" .scratch/migration/plan.md` prints line 835. Its parts map as follows.
- "`self` is read from the primary hub's `.oculus/local.yml`": item 1.
- "kept out of git": item 1 implicitly, since `local.yml` is normally gitignored. Item 4 and case 12 let the write create the primary's `local.yml` when it is absent. Nothing requires the `.oculus/.gitignore` line or the mode 600 that Make Folder a Hub gives the file (`src/lib/server/files/project/make.ts:19,79-80,276`), so a file the write creates is not kept out of git.
- "and no longer from the workspace file's `settings:`": item 1 (`settings_unknown`, case 8).
- "the Settings row and the Person page's button writing it there": items 4, 5 and 6.
- "the person it names may be in any hub of the workspace": item 2.
- "the 'this is me' button drawn on a person of any hub": item 6.
- "one `self_unknown` finding over the people of every hub in place of the check each hub's build runs": items 2 and 3.
- "at its landing the session runs O84's own `self` write once, in a one-off node run that prints nothing of the file ... setting `self: axel-faes`": no requirement. The brief says only that this write is the landing's ("Where you work"). Nothing requires the write to be callable from a node run without a running server, for example as an exported function over the primary's folder.
- "and takes `self:` out of `.oculus/workspaces/research-hub.yml` in a hub commit": a landing action with no builder requirement, which is correct.
- "(ruling 437) (ruling 438) (ruling 462)": these are booked at `plan.md:2824`, `:2825` and `:2851`.

Findings:
- "kept out of git" has no requirement for the case where the write creates `local.yml` (no `.gitignore`, no mode 600).
- The landing's one-off write has no requirement that makes the write reachable from a node run that prints nothing of the file.

## 3. Premises

- `config/defaults/sources.yml` line 82 `self: ''` and the head comment at 5: `sed -n` confirms both. The comment of the key is line 81, and line 29 also names it (section 1). It matches, apart from those two lines.
- `config/options/sources.yml:189-196`: matches (heading sources, section People, `control: choice`, `from: people`, help naming the open workspace file).
- `normalise.ts`: `selfKey` at 367, `const user = selfKey(merged)` at 627, the `self:` line at 386. This matches. The file has 672 lines.
- `builtHub` `self: {key: selfKey(config.merged), file, read}` at `index.ts:488-492`: matches. `checkSelf` is at `validate.ts:453-466` (its doc comment at 447-452), called at 548. The brief says 453-468, which is near.
- `self_unknown` at `findings.yml:362`: matches.
- Every reader reads `self === true`:
  - `roles.ts:44-46`, `team.ts:23`, the selectors at 194-199, 367 and 804, `portfolio.ts:703`, `hooks.ts:150-163` and `chat.ts:29` all match.
  - `newProjectPerson` is at `new-project.ts:46-63`, and `manifest.ts:601` matches.
- `resolveKey`, `resolvedId`, `holdersOf` at `hub-names.ts:518-551`: match (holdersOf 520, resolveKey 535, resolvedId 549). `merge.ts` has 382 lines and `build.ts:129` is `buildHubs`.
- `local.ts`: 664 lines. `LOCAL_KEYS` at 159-180 and `checkLocal` at 661 match; `LocalConfig` ends at 135. `readMachine` raises `other-hub` for every key that is not joined (`machine.ts:131-144`), and `local_other_hub` is at `findings.yml:219`. This matches.
- The watch: `FIELDS` at 108 and `BUILT_FROM` at 160 match, and no entry of `BUILT_FROM` builds the portfolio. `startPortfolio` is at `context.ts:307` and uses `machine.held()` at 318. This matches.
- `localRows` at `rows.ts:459-479`, the local branch of `Item.svelte` at 261-300 and `'none'` at 106 match. `machineValues` sends a secret as the catalog's word (`machine-values.ts:14-16`). This matches.
- Config writes refuse `local.yml`: `config-key.ts:122,129`, `config-value.ts:217`, `config-reset.ts:127`. This matches. The body at `bodies.ts:495-502` matches.
- `CLOSED_WRITES`: the brief places it in `src/lib/server/edit/writes/apps/gate.ts`. `grep -rn "CLOSED_WRITES" src` prints `src/lib/data/helpers/files/apps/apps.ts:155`. The fact holds and the file named is wrong.
- `localRefusal` at `source.ts:159-162`: matches. `rows.ts` of accounts verifies with `checkLocal` at 187. This matches.
- `setSelf` at `ui.svelte.ts:453-460`: matches. Its write goes through `writeOption` (`ui.svelte.ts:241-260`), which returns early with Save Workspace offered when `deps.workspaceFile() === false`. The brief does not state this (section 6).
- The Person page:
  - `markSelf` is at 160-164 and refuses another hub at 162. The markup is at 217-233. These match the brief's approximate lines.
  - `person.yml:10-12` matches.
- `editors/sources.ts` `ownPeople` at 121 and the `hubRecords` people at 147: match. The G119 test at `theme-groups.test.ts:388-440` with `poolOf(shipped['sources.yml'].self, ...)` at 421: matches.
- The rename (G67): `workspaceScans` at `build.ts:265-277` and the head of `references.ts` ("A hub's local.yml has no defaults file", 118-129) match. The rows of `rename.test.ts:240-258` and `WORKSPACE_TEXT` at `reference-hub.ts:261-269` match.
- **"The edit is a `documentChanges` answer the page previews and applies ..., so a `local.yml` it names is saved through the source save and `checkLocal`": this does not reproduce.**
  - `src/lib/state/system/machine/lsp/edits.ts:11-13` says "Every other file is written to disk by one `lsp-edit` operation (server/files/fs/lsp-edit.ts)". So a file no tab holds is written by `lsp-edit`, not by the source save.
  - `edits.ts:243-244` refuses any place where `inHiddenFolder(place.path, hub)` holds, and so does `lsp-edit.ts:63`.
  - `inHiddenFolder` (`src/lib/data/prose/markdown/note-names.ts:147-157`) is true for every path under a dot folder other than `.oculus/notes/`, so `.oculus/local.yml` is refused as `outside`.
  - `lsp-edit.ts` calls no `checkLocal` (`grep -n "checkLocal" src/lib/server/files/fs/lsp-edit.ts` prints nothing). It keeps a whole-file copy in local history before writing (`lsp-edit.ts:22-23`).
  - The same rule refuses `.oculus/data/people/people.yml` and `.oculus/workspaces/<name>.yml`. A page-level rename that reaches any of them is therefore refused today, which `tests/state/system/lsp/edits.test.ts:115-130` shows for a dotted path.
- The tests that name `self`: all eight are at the lines the brief gives.
- 48 lines over 37 files: matches (section 1 command).
- O86's paths: `merge.ts` (`feedsOf`), `normalise.ts` 589-596, `index.ts` near 537, `context.ts` 377-401 and 800-813, `templates.md` 520-545. These match `awk` over `briefs/O86.md`. O86 also writes `src/lib/data/model/model-collections.ts` (`Feeds`) and `docs/diagrams/*`, which the brief does not name. O89's paths: `docs/HELP.md` 270-300 and 315-320, matching.
- Folders at 10 items: `ls -A | wc -l` gives 10 for `src/lib/data/snapshot`, `src/lib/data/sources/config`, `src/lib/server/edit/writes/config` and `tests/server/edit`. It also gives 10 for `src/lib/server/edit/writes`, `src/lib/state/system/config` and `src/lib/views/system/workbench/settings`, which the brief does not list. The counts "with room" match: hubs 3, `tests/data/hubs` 5, `tests/data/snapshot` 9, `tests/state/system/settings` 8, person 1.

Findings:
- `CLOSED_WRITES` lives in `src/lib/data/helpers/files/apps/apps.ts:155`, not `gate.ts`.
- `src/lib/server/edit/writes` holds 10 items, yet the paths offer "one file of `src/lib/server/edit/writes/` (outside `config/`, which is full)". A new file there breaks the folder limit.
- The rename's apply path is `lsp-edit`, not the source save. It refuses `.oculus/local.yml` as `outside` (`edits.ts:243`, `lsp-edit.ts:63`, `note-names.ts:147-157`), runs no `checkLocal`, and keeps a whole-file history copy, which for `local.yml` means its secrets.
- O86 also writes `model-collections.ts` and `docs/diagrams/*`, which the brief does not name.

## 4. Cases and checks

- Cases 1 to 6, 7, 8, 9, 11, 13, 14, 15, 16, 18 and 27 are consistent with the rules file. Case 27's `selfName` and Mine only are in the paths, as comments.
- Case 10 is consistent, provided it is run as a watcher-level build. The rules file's test rule on signals ("What every package obeys") applies: a real watch is tagged slow.
- Case 12 is consistent with the rules file. It leaves the created file's mode and `.gitignore` unstated (section 6).
- Case 17 is internally inconsistent. "A key resolving from P to another hub's person shadowed by P" cannot happen: a key P holds resolves to P's own person (`resolveKey`, `hub-names.ts:535-544`), and that person is offered. The second example therefore cannot be refused. The refusable example is a key that two or more hubs other than P hold while P does not.
- Cases 19, 21 and 22 are looks. They are consistent with "What every package obeys" (the builder runs no page; the look on TEST is the proof).
- Case 20 is consistent.
- Cases 23 to 25 are consistent with the rules file. They test the index and the adapter, and the page refuses the edit (section 3).
- Case 26 is internally inconsistent. "`self` names `L:kim` and P holds kim" cannot happen: with P holding kim, `self: kim` marks `P:kim` (item 2, case 3). The case meant is one where the hub the board writes to holds a different person under the user's key. An example is `self: kim` naming `P:kim` while a board writes to L and L holds its own kim: L's manifest `lead: kim` resolves in L to `L:kim`, so no New project is offered for L.
- Item 10 and Verify 4 against "What every package obeys", the test rule: "A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled."
  - Item 10 lets the builder write tests under "a new entry proposed with its rule sentence", which the orchestrator writes at landing.
  - `grep -n "snapshot/hubs\|hubs/merge\|resolveKey\|holdersOf\|hub-portfolio" .scratch/migration/agents/guarded.md` prints nothing, so no entry covers the merge or `tests/data/hubs/`.
  - The new `tests/data/hubs/self.test.ts` (cases 1 to 9) therefore needs a new entry, and the brief lets the builder write it before any ruling.
- Cases that ask the builder to check a place the step does not change:
  - Case 7 rests on `readMachine`'s generic `other-hub` rule (`machine.ts:131-144`), which needs no change. `machine.ts` is in the paths, so the case checks behaviour that holds unchanged.
  - Case 14 checks the existing refusal.

Findings:
- Case 17's second example and case 26's first half describe states the brief's own resolve rule makes impossible.
- Item 10 conflicts with the rules file's rule that a step needing a new `guarded.md` entry stops and asks before writing the test. `self.test.ts` needs such an entry.

## 5. The question

The goal is the part of the plan's goal this step delivers: `self` read from the primary's `local.yml`, the person in any hub, the write there, one finding.

- **Cases 1 to 6, 7, 8, 9: no.** Each pins the mark or the finding for one input at the merge.
- **Case 10: yes, if it is proven at `rebuiltBy(['self'])` level.** That proves the watcher is rebuilt, not that `buildHubs` receives the new value from `machine.held()`. It needs a watcher-level build (the `watchedOnce` harness of `references.test.ts` exists).
- **Cases 11, 13 to 16, 18: no.**
- **Case 12: yes for "kept out of git".** The created file can be world-readable and outside `.gitignore` while the case passes.
- **Case 17: yes.** No case checks that the value check accepts a key of another hub. A server test calling `writeConfigKey` without `inputs` checks no value (`config-key.ts:107-111` comment). The route keeps `config-sources.ts`'s primary-only `people` list, so case 21's press (writing L's kim) would be refused while every listed case passes.
- **Cases 19 to 22: no.** They are the look itself.
- **Cases 23 to 25: yes.** They hold at the index and adapter level while the page refuses applying the rename's edit to `.oculus/local.yml` (section 3), so a rename of the self person cannot be applied.
- **Case 26: yes.** As written its first half cannot be set up, so it passes trivially.
- **Case 27: no.**
- **The step line's check (the landing's one-off write and the workspace line removed): no.** With the workspace `self:` removed, a build still reading the workspace file would mark nobody, and the look shows it.
- **Item 1: no.** `tests/checks/config/templates.test.ts:67-72` and `config-folder.test.ts:219` hold the key lists.
- **Item 2: yes, through case 10 as above.**
- **Item 3: no.**
- **Item 4: yes, as for case 17.** The value check's list is not required to be the list the row offers, and `config-sources.ts` is not in the paths.
- **Item 5: yes.** The G119 `poolOf` test can pass on a page-side list that differs from the server's value check. `config-sources.ts`'s header says the two read one function (`configItems`/`hubRecords`), and the brief does not require one shared function.
- **Item 6: no.** It is the look.
- **Item 7: yes, through case 26.**
- **Item 8: yes, as for cases 23 to 25.**
- **Item 9: yes.** Verify 8's grep (`"workspace setting .self\|setting .self.\|setting self\|self. option of the sources"`) misses "a setting such as `self`" (`config-sources.ts:7`, `editors/sources.ts:9`), "the `self` key below" (`defaults/sources.yml:29`), "whose `self` the people are read with" (`normalise.ts:601`), "workspace names no self" (`options/layout.yml:145`), and `HELP.md:327,514`.
- **Item 10: yes.** A test under an unruled entry can be written.

Findings:
- Case 10 (and item 2) could pass on `rebuiltBy` alone.
- Case 12 could pass with the created file outside `.gitignore`.
- Cases 17 and item 4 could pass with the value check primary-only.
- Cases 23 to 25 and item 8 could pass while the page refuses the edit.
- Case 26 is impossible as written.
- Item 5 could pass with two lists.
- Item 9's grep could pass with false sentences left.
- Item 10 could pass with tests under an unruled entry.

## 6. Implied inputs

This is a code step. The implied inputs that have happened, or whose wrong answer would cost something, all missing from "Cases":
- **The value check accepts another hub's key.** A write of `self: kim` with kim in L alone, through the route, should be accepted and written. It is missing; only refusals are listed.
- **The unsaved workspace with a primary** (`state.ts:30-31`, `unsaved.primary`). `setSelf` and Reset go through `writeOption`/`resetOption`, which offer Save Workspace and write nothing (`ui.svelte.ts:247-249,264-267`). With `self` in `local.yml`, the write should reach P's `local.yml`, or a stated refusal should be given. Missing.
- **The primary moves while the server runs.** `self` should be read from the new primary's file, the mark should move, and the row should follow (`apply` in `context.ts:767-779` with `self` in `FIELDS`). Missing.
- **A write that creates `local.yml` (case 12).** The file should be made with mode 600 and an `.oculus/.gitignore` naming `local.yml`, as Make Folder a Hub does (`make.ts:79-80`). Today `written()` (`config-checks.ts:271-282`) passes no mode, so the file is 0644 and not ignored. Missing.
- **P's `local.yml` at mode 600.** The write and its undo should keep the mode. Missing. Write-file-atomic keeps an existing file's mode, which is expected but unverified.
- **The YAML server's check of P's `local.yml`.** `self: kim` naming L's kim should give no diagnostic, and `self: zed` should give the editor's unknown value. Missing (`engine.ts:267` with the `enum` of `options.ts:87-96`).
- **The rename applied on the page.** The edit should reach P's `local.yml`, and only the `self:` line should be written. No whole-file history copy of `local.yml` should be kept, or the brief should say the page refuses it. Missing.
- **Add person on the This machine `self` choice** (`FieldControl.svelte:28-34`, `HELP.md:277`). Whether the row keeps Add person, and into which hub's people file, is not stated. Missing.
- **A hub leaving the workspace that held the self person.** The next build should give case 5's finding, or mark the now-sole holder. Missing.
- **The self person deleted from the Person page** (delete is not blocked by references, `Person.svelte:87-88,199-200`). The next build should give case 5's finding. Missing.
- **`self` written with a non-text value** (`self: 5`, `self: [a]`) in `local.yml`. There should be a problem naming `self` (`local_row`), the default `''`, and nobody marked. The source save should be refused by `checkLocal`. Missing.
- **The value check before the first published portfolio** (`entities` null). The check is then of type only (`config-sources.ts:9-11`), so any text is accepted. The expected answer is not stated. Missing.
- **Undo after the primary moved.** The record should name the old primary's file and the undo should answer gone (`recordLayers`, `undo.ts:113-121`). Missing.
- **The landing's one-off run.** The write function should be callable from a node run, and nothing of the file should be printed on any refusal (`not_parsed`'s sentence included). Missing.
- **A reset's change log record.** It should hold only the removed `self` line (`replacedText`, `config-checks.ts:181-198`) and no neighbouring line. Missing; case 11 states this only for the key write.

Findings: each of the inputs above is missing from "Cases".

## 7. ADRs

- `ls -d docs/adr` prints "ls: docs/adr: No such file or directory". `.agents/plan.yaml` names no `adr` key (`grep -n "adr" .agents/plan.yaml` prints nothing). There is no record.

Findings: none.

## 8. Dictated text

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O84.md` prints nothing.
- "`# self:`" (the commented key of the `local.yml` template), found by `grep -n "# self:" .scratch/migration/agents/briefs/O84.md` (line 37). It holds: it is ASCII, and `tests/checks/config/template-keys.ts:31-50` reads a commented key with no value.
- "`{kind: 'config-key', file: 'local.yml', key: 'self', value}`", found by `grep -n "kind: 'config-key', file: 'local.yml'" .scratch/migration/agents/briefs/O84.md` (line 40). It holds, and matches `configKeyShape` (`bodies.ts:495-502`).
- "`BUILT_FROM.self = ['portfolio']`", found by `grep -n "BUILT_FROM.self = \['portfolio'\]" .scratch/migration/agents/briefs/O84.md` (line 38). It holds: `portfolio` is a `WatcherName` (`local.ts:146-155`).
- "`resolvedId(holdersOf(people), primary, self)`", found by `grep -n "resolvedId(holdersOf(people), primary, self)" .scratch/migration/agents/briefs/O84.md` (line 38). It holds, given that no primary gives none, as item 3 says.

Findings: none.

## Further findings asked of this check

- **Paths list coverage.** The requirements force changes in files the paths do not list:
  - `src/lib/server/edit/writes/config/config-sources.ts`: the value check of `from: people` (item 4).
  - `src/lib/data/sources/config/catalog/options.ts`: `hubRecords`, where a list shared by the page and the server belongs (items 4 and 5).
  - `src/lib/server/edit/writes/config/config-checks.ts`: `written`, `refusedBy`, and the mode on create.
  - `src/lib/server/edit/writes/config/config-write.ts`: the landing and `primary_only`, which works for `self` as it stands, by reading.
  - `src/lib/server/root/process/context/machine-defaults.ts`: the default of the This machine row.
  - `src/lib/data/sources/config/catalog/schemas/engine.ts`: the `local.yml` schema.
  - `src/lib/data/model/model-collections.ts` and `src/lib/data/model/index.ts`: `SelfCheck`.
  - `src/lib/data/index.ts:68`.
  - `normalise.ts:601`.
  - `config/defaults/sources.yml:29,81`.
  - `src/lib/state/client/selectors.svelte.ts:811-815` (code, not comments), and possibly `src/lib/data/shapes/boards/takes.ts` for item 7's holders.
  - `src/lib/state/system/machine/lsp/edits.ts` and `src/lib/server/files/fs/lsp-edit.ts` for item 8's apply.
  - `docs/HELP.md:288,327,514` for Doc text.
  - The rule sentences of G8 and G119.
  - The change log and undo table are covered by `undo.ts` and the record shape in `config-checks.ts`.
- **Overlaps with steps in flight:**
  - O86: `model-collections.ts` is shared and unnamed (O86 `Feeds` at 415, O84 `SelfCheck` at 496-504); these are separate hunks.
  - O86 also adjoins `normalise.ts`: O86 writes 589-596, and the doc comment O84 must correct is at 598-605 (line 601). That is within diff context, so the cherry-pick is not a clean merge.
  - `docs/diagrams/*` is shared with O86 and O89 and is regenerated at landing.
  - O89: `HELP.md` 277, 288 and 317 lie inside O89's ranges. The brief defers them to landing, which is a hand merge if O89 rewrites those lines.
  - O88: it is at `landing: preparing` in `orchestrator-state.md:30-31` and has no brief yet. Its step line (`plan.md:838`, ruling 461) draws "the Person page's blocks" with `GroupHead`, so it writes `Person.svelte`, which O84 writes. The brief does not name this overlap.
- **User-visible choices no ruling makes** (`grep -n "O84" .scratch/migration/choices.md` shows only Z1044 and Z1045):
  - Decision 4: New project withheld for a hub where the key resolves elsewhere.
  - The second finding kind and its place: the finding lands on `local.yml` at `self`, and a second finding covers a key two other hubs hold.
  - The label form "<words> (<hub>)" of the Settings items, and the section name of the row in This machine.
  - Whether the moved row keeps Add person.
  - The mode and `.gitignore` of a `local.yml` the write creates.
  - The behaviour in the unsaved workspace.

## Declined to judge

- Other workspace files of Axel's repositories that may still hold `settings.self`, and would then show the `settings_unknown` finding: ruling 462 names only `research-hub.yml`, and this check may not read `~/workspace/research-hub`.
- Whether rebuilding the whole portfolio watcher on a change of `self` (rather than re-marking) costs too much time on the real hub: not measured, and outside what a read settles.
- The refusal of every page-level hub-key rename that touches a file under a hub's `.oculus/` folder (people, workspace files) reaches beyond O84. Whether to fix it inside O84, or raise it as its own item, is the orchestrator's call. It is reported above because item 8 depends on it.

Agent usage: a16be0c5fb7576829, claude-opus-5-5, 291709 tokens, 129 tool uses, 16 min 43 s.

## Closed

- 1, Names: every hit the change makes false is in the brief's paths or Doc text now: `config/defaults/sources.yml` 5, 29, 81-82 (item 1); `normalise.ts:601`, `index.ts:68`, `model/index.ts:43`, `model-collections.ts:496-504` (item 1, paths); `config-sources.ts`, `catalog/options.ts` (item 4, paths); `machine-defaults.ts`, `schemas/engine.ts` and `schemas/options.ts` (item 1); `selectors.svelte.ts:811-815`, `NewIdeaForm.svelte`, `takes.ts` (item 7, paths); `FieldControl.svelte` (item 5, paths); `HELP.md` 288, 327, 514 (item 9); G8 and G119 rule sentences given in Doc text for the landing (item 9); `config/options/layout.yml:145`, the demo fixture's people file and the "workspace names a self" comments (paths, Verify 8's grep widened).
- 2, The step line: "kept out of git" for a created file is item 4 and case 12 (mode 600, `.oculus/.gitignore`); the landing's one-off write is item 4 (one exported function, refusals quoting no file text) and case 34.
- 3, Premises: `CLOSED_WRITES` path corrected; `src/lib/server/edit/writes`, `state/system/config` and `workbench/settings` added to the full folders, and the offer of a new file in `writes/` removed; the rename apply refusal recorded in "What is on the tree" and fixed in item 8 (choice Z1046), case 28; O86's `model-collections.ts` and `docs/diagrams/*` named.
- 4, Cases and checks: case 17 rewritten (zed, and kim held by L and L2) with the accepted write of L's kim added; case 26 rewritten to a state the resolve rule allows; item 10's new entry is open item 465, the stop of this /spec.
- 5, The question: case 10 needs a watcher-level build; case 12 checks mode and `.gitignore`; item 4 and item 5 require one shared people list for the row and the value check; cases 23 to 25 are applied by case 28; item 9's grep widened (Verify 8).
- 6, Implied inputs: cases 29 to 34 added (unsaved workspace, primary change and undo gone, non-text value, hub leaving or person deleted, YAML server check, the function's refusal); the reset's record (item 4); Add person kept (item 5, decision 8); before the first portfolio, by type as now (item 4); the mode kept on an existing file (case 12).
- Further findings: the paths list widened as above; the `normalise.ts:601` hunk next to O86's is recorded as a shared path simple to merge (a one-line comment); O88 is not in flight; the user-visible choices are taken as decisions 4 and 6 to 9 of the brief, each reversible, with Z1046 for the apply.
- Declined to judge, the rename refusal under a hub's `.oculus/`: fixed inside O84 (item 8, Z1046), since item 8 cannot be met without it.
