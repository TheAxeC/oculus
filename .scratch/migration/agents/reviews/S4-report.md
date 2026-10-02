# S4 report: the Settings editor finished

## Not done

Everything in the brief is done. Limits and loose ends, stated first:

- An emptied `tab_rollup: {}` is drawn by the records form and not by the rollup form, because the options catalog gives no signal that a map family holds lists. Fixing it needs a catalog key, which is a user-visible vocabulary and so Axel's decision (listed under Judgment calls). The server accepts either kind for an empty held map (`tests/server/edit/config-value.test.ts`).
- `colours.test.ts` (tagged slow, not part of `npm test`) fails on the unchanged tree and on this one for two rules outside S4: `DiffEditor.svelte` `.oculus-comment-add::before` and `OpenEditors.svelte` `.dirty`. Seen in direct runs on both trees earlier in the work; not re-run in this last session turn; not touched.
- The final `checks.sh` run is green. The earlier runs stopped at the first red command: diagram readability (fixed in source, see Judgment calls), comment width, lint, `npm run check`, and then four runs in which tests with a 5 s limit timed out while the machine's load average was 13 to 21 because other builders were running (`uptime` printed 12.52 to 21.25). The tests that timed out were `tests/server/git/autofetch.test.ts`, `tests/server/core/git/held.test.ts`, `tests/server/edit/config-key.test.ts`, `tests/routes/edit/config-key.test.ts`, `tests/routes/files/history.test.ts`, `tests/routes/git/refs.test.ts` and `tests/server/root/dev-server.test.ts`; each passed in the green full run and in at least one direct run (`autofetch` failed twice in a direct run at load 19 and `held` failed once in three direct runs), and none of the git or files files is in S4's diff (`git status --short tests/server/git tests/routes/git tests/routes/files src/lib/server/git` printed 0 lines). The orchestrator's landing run on a busy machine can meet them again; `tests/server/edit/config-key.test.ts` "refuses what is not a finite number" takes 2.2 s alone on the base tree and on this one against its 5 s limit.
- `tests/server/edit/yaml-edit.test.ts` "touches one line of each..." fails when run directly because of `side-projects/{gpu-game-boy,residual,scripted-os}/project.yml`; it passed in the full `npm test`. Not verified on the unchanged tree.

## Open items (`orchestrator-state.md`, lines 152 to 161, verbatim)

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z280 (2026-10-02, D14's /spec): a LaTeX formatter on this machine. D14 builds Format Document for `.tex` files (Z278) through `tex-fmt`, which is not installed (`command -v tex-fmt` prints nothing; Homebrew offers 0.5.7). `latexindent`, the other formatter LaTeX Workshop supports, is installed but stops at once with `Can't locate File/HomeDir.pm in @INC` (TeX Live 2025's script needs a Perl module macOS lacks). Without one of them Format Document says the formatter is missing and changes nothing. Options: (a) I run `brew install tex-fmt` now. For: one command, a single binary, fast. Against: one more program on your machine. (b) I install the Perl module for `latexindent` (`cpan File::HomeDir`, into your user Perl). For: the formatter most LaTeX users know, with its own settings files. Against: a Perl module install outside Homebrew, and D14 would be built against `latexindent` instead. (c) neither: Format Document stays unusable here, the lazy option. Recommended (a). D14 is built and tested with a stand-in program either way; this only decides whether it works on your machine.
- Z275 (2026-10-02, found at Q88c's landing): the Views and Settings rail button moved. `config/layout.yml` on main holds an uncommitted change that is not the plan's: the Views and Settings button moved from last on the rail to fourth, after Projects. Six test files pin the old order (`tests/shell/rail/rail-config.test.ts`, `tests/shell/rail/shipped-rail.ts`, `tests/state/workbench/navigation/rail.test.ts`, `catalogue.test.ts`, `arrangement.test.ts`, `tests/checks/config/config-folder.test.ts`), and the catalogue's groups (`nav_groups` in the same file) must follow the rail's order, so with the change on disk 5 tests of `npm test` and 1 of `test:checks` fail on main and every landing's verify is red until it is settled. With the button fourth, it also takes the digit key 4, and Incoming to Present move one digit down. Options: (a) keep the new place: the catalogue's groups reordered to match, the six tests updated, HELP.md's rail list and the digit keys checked, done as fixes at D18's landing (the Processes view), since D18 already changes that file and cannot land before this is settled. For: the rail reads as you arranged it. Against: the digit of every button after Projects changes. (b) keep it last: the change on disk put back by you. For: no code change. Against: the button stays far from the top. (c) leave it as it is: the lazy option, which leaves main's verify red. Recommended (a), if the move was meant; (b) if it was a trial. D18 (the Processes view) cannot land until this is settled: its diff adds `processes` to the System page's arrangement in the same file (line 93, apart from your lines 10 to 22), and the landing refuses a step whose paths carry an uncommitted change of yours. Under (a) your rail lines go in with D18's landing. S4 (the Settings editor finished) then merges the System page into the Views and Settings item (your ruling Z169), so under (a) the merged item sits fourth; under (b) it sits last.
- Z276 (2026-10-02, at Axel's question whether O34 covers the task "A second person in the hub" in `tasks/tasks.yml`): it does not. O34 reads the signed-in person in one place, which is the base that task needs; the task's three parts (a Focus board per person, a private-or-shared marker per field and document with private as the default, the group views of shared deadlines, who waits on whom and the meeting rotation) are in no step, and D10 waits on a second person too. Options: (a) one new step O36 after O34 with those three parts, so the plan ends with the hub usable by your group; (b) leave the task in `tasks/tasks.yml` until someone else works in the hub, as its note says, and open a step then. For (a): the remote server is built with several users in mind and the privacy marker is cheapest to add before anything is shared. Against (a): it builds for people who are not using the hub yet. Recommended (b): the task's own condition is not met, and O34 already leaves the one place a person is read. (b) is also the cheaper option, chosen because the condition is unmet, not because it costs less.
- Z274 (2026-10-02, Axel's word that oculus is now a full IDE rather than a dashboard): a new name for oculus. Where the name lives, counted on main: 122 files under `tools/oculus/src` and 1054 occurrences across its `src`, `tests` and `config`; 40 references to the `~/.oculus` folder; the `.oculus/project.yml` manifests the other repositories carry; five browser-storage keys (`oculus.ui.v1`, `oculus.layout.v1`, `oculus.layout.previous`, `oculus.carry.v1`, `oculus.diff.addComment`); and 1241 files of the hub outside `tools/oculus` that name it (the skills, rules, memory and manifests among them). Options for when: (a) the rename done in O33, as part of the move into its own repository: the repository, the package, the folder, the source, the docs and the hub's references take the new name at once; the first-run check moves `~/.oculus` and each repository's `.oculus/` folder and carries the five browser-storage keys over once, so nothing Axel saved is lost. For: the repository is created then anyway, so its name is chosen once; no step in flight conflicts with it. Against: the old name stays on screen until the last step. (b) the rename as a step of its own now. For: the new name is in use sooner. Against: it touches nearly every file five steps in flight also touch, so each of them meets conflicts at landing, and it needs a ruling for a new step. (c) keep the name oculus. For: no work. Against: the name no longer says what the tool is, which is Axel's reason for asking. Names, in the style of the other repositories (cathedra, ordo, officium, scotoma): scriptorium (the room where manuscripts were written and copied, fitting a tool for writing papers and code); officina (a workshop; close to officium in sound); fabrica (a workshop where things are made). Recommended (a) with scriptorium. (c) is the lazy option.
- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line). Count at 2026-10-02 13:05: 1 of 10 (X3a, landed 11:49). Nothing is asked of Axel until the count reaches 10.


## Coordinator rulings carried

- R1 (a): "a number is written as a number, read back as a number" is tested on `read_limits`. The `usage_tiers` edit to 20 is its own case, refused with the `usageTiers` reader's sentence, nothing written, `usageTiers` unchanged.
- R2 (a): the reader-refusal cases are a `themes` entry in `appearance.yml` with an unknown glyph (`themeFindings`) and `layout.yml` with `nav_groups.help` removed (`docFindings`). No `nav_groups` glyph finding was added.
- Confirmed readings: `audit_ignore` is exercised by C28; C33 asserts 409 `{error: 'moved'}` worded `history.moved`; 14 `desc_*` keys move (the brief said 15); C21's fixture is a views page whose status pane lacks gallery.
- Confirmed judgment calls: an empty list item is a named problem that holds Save back; a dropped `config` tab keeps its id with state null; a `config` tab beside a `settings` tab is removed and the pane's active tab becomes the `settings` tab; the Catalogs and Texts groups come after the `local.yml` group.

## The cases on the unchanged tree

The new and changed tests were run with `npx vitest run` on a copy of the base tree (`scratchpad/s4-base/oculus`, no S4 source). The output is in `scratchpad/s4-first-run-2.txt`: 21 test files failed and 3 passed, 57 tests failed and 829 passed, and 7 suites could not load because their subject does not exist (`Cannot find module '.../config-value.ts'`, `block-edit.ts`, `editors/draft.ts`, `config/contents.ts`, `config/gear.ts`, `config/folders.ts`). A first run in the worktree before the source existed (`scratchpad/s4-first-run-final.txt`) gave 18 files failed, 45 tests failed, 654 passed, with the same 7 suites unloadable. The failing lines by cause, quoted from the second file:

- `tests/routes/edit/config-value.test.ts` (11 tests): `expected 400 to be 200`, `Cannot read properties of undefined (reading 'at')`, `expected [ 'manifest', 'session', ...(19) ] to include 'config-value'`.
- `tests/state/workbench/layout/saved/layout-saved.test.ts` (16 tests): `expected [ 'home', 'p-info', 'p-views' ] to deeply equal [ 'home', 'p-views' ]`, `expected [ 'w-hpc', 'w-set', 'w-cfg' ] to deeply equal [ 'w-hpc', 'w-set' ]`.
- `tests/state/workbench/navigation/{arrangement,catalogue,rail,registry}.test.ts` (12 tests), `tests/shell/rail/rail-config.test.ts`, `tests/views/personal/account-setup.test.ts`, `tests/views/system/{audit,help}.test.ts`, `tests/views/system/workbench/{catalogue,settings}.test.ts`: `expected 9 to be 11` (rail entries), `expected { kind: 'split', dir: 'row', ...(2) } to match object { Object (children) }`, `the text catalog has no key settings.local_tag`.
- `tests/state/system/config-files.test.ts` (3 tests): `descriptionKey is not a function`, `describedAs is not a function`.
- `tests/views/whole/type-scale.test.ts` (6 tests): `lists every view file in the audit`, `sets every local role in system/workbench/editors/Cards.svelte` and the other new view files.

The tests that exist on the base tree and keep their behaviour (the 829 that passed) pass on both trees.

### The two wrong cases

- R1, case C4. Rule in the brief: a `usage_tiers` value of 20 is written as a number and read back as a number. Result: the `usageTiers` reader takes a list of tiers and refuses 20, so the write is refused. Ruling R1 (a): number-as-number is tested on `read_limits`; the 20 edit is its own refused case.
- R2, case C8. Rule in the brief: a `nav_groups` entry with a glyph a reader refuses. Result: `docFindings` (`src/lib/server/content/docs.ts:455-492`) checks that a document's group is one `nav_groups` names, and no reader checks a `nav_groups` glyph, so there is no refusal to assert. Ruling R2 (a): the two reader-refusal cases above; no new finding.

## DONE / NOT DONE

Verification command, run from `tools/oculus`: `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`. The brief says to run it from the worktree root; the commands need `tools/oculus` (the state file says "from tools/oculus"). The lines it printed on the last run:

```
$ npm test
 Test Files  512 passed | 24 skipped (536)
      Tests  12858 passed | 639 skipped (13497)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  446 passed | 9 skipped (455)
$ npm run check
1790967066349 COMPLETED 3163 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit=0
```

`npm run diagrams` ran before that run, and a second `npm run diagrams` changed no byte of `docs/diagrams` (`cat docs/diagrams/* | md5 -q` equal before and after).

| Item | Status | Proof |
|---|---|---|
| 1 `config-value` write, 7 lists and 21 families, `config-value.ts` 249 lines | DONE | `tests/server/edit/config-value.test.ts` (31 cases), `tests/routes/edit/config-value.test.ts` (11 cases), in `npm test` |
| 2 block rewrite, `block-edit.ts` 320 lines | DONE | `tests/server/edit/yaml/block-edit.test.ts` (36 cases) |
| 3 editors: partials each under 300 lines, pure state in `state/system/config/` | DONE | line counts below; `editors-draft` (85 cases), `editors-writer` (49), `folders` (11), `contents` (7), `settings-editors` (28) |
| 4 table of contents below 700 px (toggle, Escape) | DONE | `tests/views/system/workbench/settings-editors.test.ts` |
| 5 open-the-file action, Catalogs and Texts groups, descriptions under group headings | DONE | `tests/state/system/settings/folders.test.ts`, `tests/state/system/config-files.test.ts`, `settings-editors.test.ts` |
| 6 Config view removed; `config.local_tag` and 14 `desc_*` keys moved to `settings.*`; `history.kind_config_value` | DONE | verify 2 and the rename grep below; `config/text/views/system/history.yml:53` |
| 7 merged rail item `System`, chord `y`, arrangement key `views` | DONE | `config/layout.yml:20` `{ label: "System", glyph: sliders, page: views }`, `:35` `views: { label: "System", glyph: settings, chord: y }` |
| 8 saved `info` page migrated, `migrate.ts` 127 lines, called before `settlePageLeaves` | DONE | the 16 migration cases in `layout-saved.test.ts` that fail on the base tree |
| Verify 2: `grep -rn "views/system/config\|group: 'info'" src tests` | DONE | printed nothing |
| Verify 3: `grep -c "page: info" config/layout.yml` and `grep -n "^  info:" config/layout.yml` | DONE | printed `0` and nothing |
| Rename grep over src, tests, config, docs, HELP.md, DESIGN.md, README.md | DONE | one hit, `tests/views/system/workbench/settings-editors.test.ts:303 expect(catalog['config.local_tag']).toBeUndefined()`, the assertion that the key is gone |
| ASCII gate | DONE | `! LC_ALL=C grep -rna '[^ -~]' src tests` printed nothing, and is the last command in the checks output |
| Folder cap of ten | DONE | `sh utils/folder-check.sh` printed nothing; `test:checks` passed |
| `npm run format` and `format:check` | DONE | `All matched files use Prettier code style!` |

## Files (line counts from `wc -l`)

New: `src/lib/server/edit/block-edit.ts` 320, `block-render.ts` 51, `block-source.ts` 162; `src/lib/server/edit/writes/config/config-value.ts` 249; `src/lib/state/system/config/editors/{draft 357, flow 54, slots 107, writer 120}.ts`; `src/lib/state/system/config/view/{contents 36, folders 69, gear 22}.ts`; `src/lib/state/workbench/layout/saved/migrate.ts` 127; `src/lib/views/system/workbench/editors/{Cards.svelte 178, Editor.svelte 158, Rollup.svelte 81, writer.svelte.ts 30}`; `tests/routes/edit/config-value.test.ts` 206; `tests/server/edit/config-value.test.ts` 460; `tests/server/edit/yaml/block-edit.test.ts` 463; `tests/state/system/settings/{contents 66, editors-draft 493, editors-writer 436, folders 150}.test.ts`; `tests/views/system/workbench/settings-editors.test.ts` 363.

Changed: `src/lib/server/edit/writes/config/{config-checks 257, config-key 144, config-write 91}.ts`; `src/lib/server/edit/writes/{undo 387, bodies 441}.ts`; `src/lib/server/edit/writes.ts` 541; `src/lib/state/client/writes.svelte.ts` 584; `src/lib/state/shared/stores/shapes.ts` 316; `src/lib/state/shared/words/text.ts` 121; `src/lib/state/system/config/{config-files 29, groups 225, messages 44, typed 94, write 160}.ts`; `src/lib/state/workbench/layout/saved/saved.ts` 643; `src/lib/state/workbench/navigation/{catalogue 282, pages 335}.ts`; `src/lib/views/system/workbench/{Settings 298, Catalogue 301, Pages 390}.svelte`; `src/lib/views/system/workbench/settings/{Control 140, Header 108, Item 318, List 147}.svelte` and `said.ts` 35; `src/lib/views/system/{audit/Audit 300, findings/Findings 92, gallery/Gallery 301, history/History 348, status/Status 116}.svelte`; `src/lib/views/personal/account-setup/AccountSetup.svelte` 133; `src/lib/views/shared/code/Code.svelte` 97; `src/lib/ui/display/CodeText.svelte` 43; `src/lib/shell/rail/ActivityRail.svelte` 359; `src/lib/server/files/files.ts` 292; `src/lib/state/sources/fs.svelte.ts` 876; `config/layout.yml` 175; `config/catalogs/{glyphs 187, icons 186}.yml`; `config/text/{app 70, server 57}.yml`; `config/text/views/system/{workbench 154, history 63}.yml`; `config/text/views/sources/file.yml` 25; `HELP.md` 319; `DESIGN.md` 432; `docs/diagrams/*` regenerated.

Deleted: `config/text/views/system/config.yml`, `src/lib/views/system/config/Config.svelte`, `src/lib/views/system/config/files.ts`, `tests/views/system/config.test.ts`.

Tests changed: `tests/checks/config/config-folder.test.ts`, `tests/checks/source/keys.test.ts`, `tests/checks/tree/allow-audits.txt`, `tests/checks/tree/allow-duplication.txt`, `tests/routes/edit/write-fixture.ts`, `tests/state/system/settings/fixture.ts` (adds `rowOf`), `tests/views/system/workbench/workbench-fixture.ts`, `tests/views/whole/chips.test.ts`, `tests/views/whole/type-scale.test.ts`, `tests/ui/theme/wall.test.ts`, and the rail, catalogue, arrangement, registry, help, audit, account-setup, settings and `fs` tests that `git status --short .` lists.

## Judgment calls

- Catalog-file rows draw the `describedAs(file)` description; text-file rows draw none. File rows count in the search's found count.
- Save sends the row's current value as the write's base, so a draft whose saved base differs from `row.value` is stale; the editor guards this (beyond the brief) and `editors-writer.test.ts` tests it.
- The write's last step (the atomic write and the change record) is one function, `written` in `config-checks.ts`, used by `config-key.ts` and `config-value.ts`. It replaces two copies of that step, and it keeps the write diagram readable: `tests/checks/diagrams/readable.test.ts` forbids two arrows running along each other, and a sixth module writing to `core/json.ts` directly left no free port.
- The migration cases are in `layout-saved.test.ts` because the folder had reached the cap of ten.
- The history/chips duplication allowlist entry was re-keyed rather than folded, because the clone is older than S4.
- `Code.svelte` has one user now and stays in `views/shared`.
- The chips plain-tag floor went from 56 to 55 (`tests/views/whole/chips.test.ts`): the removed Config view held the one plain Tag (`config.local_tag`).
- `file.truncated` text was removed from `config/text/views/sources/file.yml` because only the removed view read it.
- Wall check: `Cards.svelte` carries a `body.wall` rule and `wall.test.ts` has one SOLID entry with its reason.
- Open decision for Axel: whether the options catalog gets a key that says a map family holds lists, so an emptied `tab_rollup: {}` draws as a rollup. (a) Add the key. For: the rollup form shows for an empty map. Against: one new catalog vocabulary word. (b) Keep the records form for an empty map. For: no new key. Against: the user sees the wrong form once; it is the lazy option. Recommended (a).

## Host- and user-visible changes (before / after)

- Rail: before 12 buttons, with System (page `info`) before Help and Views and Settings last; after 11 buttons, one `System` button last, after Help (`config/layout.yml`, `rail:` block). Keys: before, `y1` to `y6` opened the System page's views and `w1` to `w4` the Views and Settings page's; after, `y1` to `y9` open the nine views of the merged System page and the `w` row is gone.
- Rail badge: only Audit and Hpc register badges. Before, the System button (status, findings, audit, history, config, gallery) showed the audit count and the Views and Settings button showed none. After, the single System button holds settings, account-setup, catalogue, pages, status, findings, audit, history, gallery and shows the first non-empty badge, again the audit count (`src/lib/shell/rail/RailPages.svelte:53-66`).
- The Config view is gone; a saved `config` tab becomes a `settings` tab; a saved `info` page folds into the views page.
- Settings: before, the Settings view had no editor for a list or a family; after, each of the 7 lists and 21 families (the brief's count) has an editor (items, key/value pairs, records, rollup) with Save, Discard and the refusal sentence of the reader.
- The table of contents opens by a toggle below 700 px and closes with Escape.
- Each file in Settings has an open-the-file action and its description under the group heading; the Catalogs and Texts groups come after the `local.yml` group.
- History: the kind label for the new write is "list or family" (`config/text/views/system/history.yml:53`).
- The keyboard sheet in `HELP.md`: the row `y1-y6` is now `y1-y9` (`HELP.md:71`) and the `w1-w4` row is removed (base `HELP.md:70-72`).

## Brief errors

- The brief says 15 `desc_*` keys move; `grep -n "desc_" config/text/views/system/workbench.yml` prints 14 (lines 11 to 24).
- The brief says to run `checks.sh` from the worktree root; it runs from `tools/oculus`.
- Cases C4 and C8 (R1 and R2 above).

## Git calls made

Read-only only: `git status` (three early calls and later ones), `git diff`, `git ls-files`, `git log`, `git show HEAD:...`. No state-changing git.
