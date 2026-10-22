# Refuter report: O50

## Verification

All commands were run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O50` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. The load average was 15 during the runs (`uptime`: "load averages: 15.03 10.37 6.59").

1. Verify 1, the 13 named test files (`npx vitest run tests/server/edit/config-key.test.ts ... tests/checks/tree/boundaries.test.ts --reporter=dot`):
```
 Test Files  2 failed | 11 passed (13)
      Tests  2 failed | 210 passed | 9 skipped (221)
+   "state/boards/collection.ts imports data/snapshot/normalise-parts/plans",
+   "views/shared/forms/Followups.svelte imports data/model",
 FAIL  |unit| tests/server/edit/config-value.test.ts > ... > keeps a shipped theme removed by the Settings editor out of the merged list
Error: Test timed out in 5000ms.
```
   - The boundaries red is base-red. Neither file is in `git status --short`.
   - `config-value.test.ts` passes when run alone (`Test Files  1 passed (1)`, `Tests  10 passed (10)`). Its red was a timeout under machine load.
   - The reference index files plus normalise (`npx vitest run tests/data/snapshot/rename.test.ts tests/data/snapshot/references.test.ts tests/server/machine/lsp/adapters/hub-keys.test.ts tests/data/snapshot/normalise.test.ts --reporter=verbose`):
```
 <check mark> |unit| tests/data/snapshot/normalise.test.ts > normalise, the person the setting `self` names > marks [ 'someone' ] for the setting self 'someone', and no entry for its own self: true 1ms
 <check mark> |unit| tests/data/snapshot/normalise.test.ts > normalise, the person the setting `self` names > marks [] for the setting self '', and no entry for its own self: true 0ms
 <check mark> |unit| tests/data/snapshot/rename.test.ts > the rename of a hub key > edits 'the person the setting self of the op<ellipsis>' 72ms
 <check mark> |unit| tests/data/snapshot/rename.test.ts > the rename of a hub key > edits 'the person the setting self names, an<ellipsis>' 244ms
 Test Files  4 passed (4)
      Tests  75 passed (75)
```
2. Verify 2:
   - I did not run `npm run format` or `npm run diagrams`, because both write files. In their place:
     - `npm run test:quick` checks prettier read-only.
     - The diagrams check ran in memory: `npx vitest run tests/checks/diagrams/diagrams.test.ts --testTimeout=120000` gave `Tests  47 passed (47)`. With the default timeout, two rows timed out at 9.7 s and 8.1 s under load.
   - `npm run test:quick` printed the following, exit 0:
```
ok      ASCII gate (1.4 s)
ok      prettier (2.8 s): All matched files use Prettier code style!
ok      svelte-kit sync (6.5 s)
ok      eslint (57.8 s)
ok      svelte-check (83.2 s): 1792672643363 COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (170.4 s): Duration  143.14s (...)
test:quick: 177.2 s (limit 45.0 s); every command passed
test:quick: over the time limit
```
   - Also run: `npx vitest run tests/checks/source/keys.test.ts tests/checks/tree/size.test.ts --testTimeout=120000`. The catalog key check passes. `size.test.ts` is red only on files the step does not change: `src/lib/state/client/writes.svelte.ts is 903 lines`, `src/lib/views/shared/card/project/ProjectCard.svelte is 549 lines`, `src/lib/views/shared/forms holds 12 items`. That red is base-red.
3. Verify 3, the ASCII gate over `$(git status --short | awk '{print $2}' | grep -v '^\.scratch/')`: it printed nothing (`gate exit 0`). The same gate over the report printed nothing.
4. Verify 4:
   - `grep -rn -w --exclude=local.yml self src config docs tests README.md | wc -l` gives `128`, and `grep -c docs/diagrams` on its output gives `0`.
   - The C11 grep:
```
src/lib/server/sessions/stores/hooks.ts:157:        if (isMap(person) && person.self === true && typeof person.name === 'string') {
src/lib/views/boards/person/Person.svelte:151:    const isSelf = $derived(join.person?.self === true);
```
   - The person phrases (`grep -rn -e "self: true" -e "self_not_one" -e "this is me" -e "self?:" ...`) remain only in:
     - the hooks.ts doc (the wire flag);
     - `model-entities.ts:791` and `model/index.ts:99`;
     - the new docs and help;
     - the deliberate normalise test row.
5. Verify 5: `sh utils/unused-exports.sh > <scratch>/unused-now.txt; diff ../migration-O50-base/unused-exports.txt <scratch>/unused-now.txt` printed nothing (`diff exit 0`).
6. Verify 6: `git diff 0379bb5d | grep '^+' | grep -i -E "before|used to|no longer|still|...|O50|20[0-9][0-9]-"` over the source, tests, config and docs. The only hit is `+     * published portfolio, so a write on its way shows the state before it until the portfolio` (Person.svelte:148). It describes the run-time state, so it is not history. The other hits are in the orchestrator's brief copy under `.scratch/`.
7. The first runs on the unchanged tree, which I reproduced:
   - Setup: a scratch tree in my scratchpad. Its `src`, `config` and `utils` are copied from `migration-O50-base` (`diff -rq` printed nothing: `base-src-config-identical`). Its `tests` are the worktree's, and `node_modules` is linked.
   - Run: `npx vitest run tests/data/snapshot/rename.test.ts tests/data/snapshot/normalise.test.ts tests/checks/config/config-folder.test.ts tests/data/snapshot/schema-rules.test.ts --testTimeout=60000`:
```
AssertionError: expected [ Array(96) ] to deeply equal [ Array(97) ]
 <heavy right-pointing angle quotation mark> tests/checks/config/config-folder.test.ts:363:44
AssertionError: expected [ 'apps_dir', 'bookmarks', <ellipsis>(12) ] to deeply equal [ 'apps_dir', 'bookmarks', <ellipsis>(13) ]
 <heavy right-pointing angle quotation mark> tests/checks/config/config-folder.test.ts:798:48
AssertionError: expected [ 'nobody-home' ] to deeply equal [ 'someone' ]
 <heavy right-pointing angle quotation mark> tests/data/snapshot/normalise.test.ts:334:24
AssertionError: expected [ 'nobody-home' ] to deeply equal []
 <heavy right-pointing angle quotation mark> tests/data/snapshot/normalise.test.ts:334:24
AssertionError: expected { <ellipsis>(3) } to deeply equal { <ellipsis>(4) }
 <heavy right-pointing angle quotation mark> tests/data/snapshot/rename.test.ts:402:24
AssertionError: expected [ [ 'entries', <ellipsis>(1) ], <ellipsis>(1) ] to deeply equal [ [ 'entries[0].affiliation', <ellipsis>(1) ] ]
 <heavy right-pointing angle quotation mark> tests/data/snapshot/schema-rules.test.ts:224:60
```
   - These are exactly the failing lines the report gives.
   - Two other config-folder rows failed in my scratch tree with `ENOENT ... docs/templates.md`, because the scratch tree holds no `docs/`. Those failures are artefacts of the scratch tree.
8. Other report claims reproduced:
   - Doc line counts (`git show 0379bb5d:<f> | wc -l` against `wc -l`): HELP.md 546 to 547, data-map.md 209 to 209, templates.md 1313 to 1314.
   - `wc -l`: index.ts 827, model/index.ts 875, model-entities.ts 876, portfolio.ts 863, Person.svelte 416, normalise.ts 779, ui.svelte.ts 542, build.ts 256.
   - The diagrams change 67 lines each way (`git diff 0379bb5d --stat`).
   - wallpaper.ts and EntryForm.svelte are absent from `git status --short`.
   - The hub is untouched: `grep -n -w self` on the hub's people.yml gives lines 3, 16 and 112 (`self: true`), and its workspace file has `settings:` at 15 and no `self`.
   - The worktree's copies of `briefs/O50.md` and `O50-cases.md` are byte-identical to main's (`diff` printed nothing). They are the orchestrator's copies, not the builder's edit.
   - Spot-checked brief premises at the base, all of which reproduce:
     - `normalise.ts:389`, `validate.ts:394`, `Person.svelte:188-190`, `writes.ts:139`, `references.ts:26-33`;
     - `findings.yml:282`, `data-map.md:158`, `templates.md:843`, `ui.svelte.ts:121-122`.

## Verdicts

### Items

1. **Holds.**
   - `config/defaults/sources.yml:73-74` has `self: ''` with its comment.
   - `config/options/sources.yml:112-118` lists it under heading `sources`, section `People`, `control: choice`, `empty: nobody is marked as you`, `from: people`. The help names the key, the Person page, the chat and the open workspace file.
2. **Holds.**
   - `SOURCES` gains `people` (`catalog-words.ts:52`).
   - The page:
     - `Settings.svelte:195` hands in the people.
     - `editors/sources.ts:110-124` (`ownPeople`) and `:168-171`.
     - The labels map.
   - The server:
     - `config-sources.ts:64-71`.
     - The kind is added at `config-sources.ts:35`, `writes.ts:139` and `hooks.ts`.
   - The editor's schema is `engine.ts:98-99`.
   - The reference index:
     - `OPTION_SOURCES` `people` (`references.ts:31`) and `settingsNode`.
     - The workspace file is passed from `portfolio.ts:752` through `buildPortfolioWithSchemas` and scanned in `build.ts:236-247`.
     - C14's row passes.
   - See findings B1, P1 and ST2.
3. **Holds.**
   - `normalise.ts:375-396`: `selfKey(merged)` and `person(entry, owner)`. `person` reads nothing named `self` from the entry.
   - `model-entities.ts:790` is rewritten.
   - The wire keeps `self?`.
4. **Holds.**
   - `validate.ts:298-317` (`checkSelf`), with `findings.validate.self_unknown` in place of `self_not_one`.
   - The check is skipped when the key is empty or the registry is unread. The file is `join(hub, config.registries.people)` (`index.ts:527-531`), the same path convention `unreadSources` uses (`lists.ts:89`).
5. **Holds.** The `ownerName` code is unchanged, and its doc (`hooks.ts:148-152`) and `chat.ts:28-31` are rewritten.
6. **Holds.**
   - `Person.svelte:211-224` draws a `ToolButton` on every person with no `root`, with pressed/active from the wire flag.
   - `markSelf` returns early on the pressed person and on a person with `root`.
   - `setSelf` (`ui.svelte.ts:452-460`) goes through `writeOption`, which makes the unsaved-workspace offer at `:247-249`.
   - The titles are new keys in `person.yml:14-15`.
7. **Holds.**
   - data-map, templates (both ranges) and the `collections` comment are rewritten.
   - HELP has its Person note at `:301`.
   - The fixture loses its schema row, its flag and the head-comment mention.
   - The four tests' synthetic data are carried.
8. **Holds** for the builder: the hub is untouched (grep above). The move itself is the landing's.

### Cases

- C1. **Met by reading.**
  - `config-sources.ts:64-71`, `editors/sources.ts:168-171` and `Settings.svelte:195`.
  - The write goes through the existing `writeConfigKey` to `settings.self` (self is not in `HUB_LIST`, `config-place.ts:3-9`).
  - The look on landing is still its proof.
- C2. **Met by reading.** A value outside the `people` list is refused with `server.config_key.not_in_source` ("This option takes one of the items of the list {0}", `config/text/server.yml:102`, via `notListed`, `config-fit.ts:73-78`).
- C3. **Met.** The two rows cover `self: owner` and empty, and each carries an entry with `self: true` that is not marked. They fail on the base at `normalise.test.ts:334:24` (reproduced).
- C4. **Met by reading** (`validate.ts:309-316`, `index.ts:527-531`). A hand-set `lab:key` matches no primary entry key, so it gives the finding.
- C5. **Met** (C3's rows, and the record schema's `additionalProperties`, unchanged).
- C6. **Met by reading.** `ownerName` reads the wire flag set by `person()`, and the fallback is `chat.ts:115`.
- C7. **Met by reading** (`Person.svelte:151-161`, `:206-224`). The look on landing is still its proof.
- C8. **Met by reading** (`ui.svelte.ts:247-249`).
- C9. **Met.** `self` is not in `HUB_LIST`: grep over `hub-names.ts:325-356` for `self` gives no hit (exit 1).
- C10. **Met by reading.**
  - `workspace-layer.ts:6-11`: a value the option refuses is a finding, and oculus's `''` stands.
  - `selfKey` uses `str` (`guards.ts:30-32`), which gives `''` for `true`.
- C11. **Met.** The grep prints the two readers of the wire flag only (quoted above).
- C12. **Met by reading** (`engine.ts:98-99`, `hubLists` at `lists.ts:62-73`).
- C13. **Met by reading.**
  - A person with an empty name is drawn by the key.
  - Equal names are drawn as `name (key)`.
  - A portfolio with no primary-hub people gives `[]`, so only the empty item is offered.
  - See finding B3 for a collision the rule leaves.
- C14. **Met.**
  - The row 'the person the setting self of the open workspace file names, and no other byte of that file' passes. It fails on the base at `rename.test.ts:402:24` (reproduced).
  - The test compares the whole map of edited files, so every other byte is held.
  - See P2 on the unsaved row.

## Spec

- SP1. The report does not state what the code does for the key `self` in the cases spec.md requires.
  - The rule (spec.md, What every package obeys): "Every id or key a step introduces is checked empty, duplicated, and colliding ... and every asynchronous path in flight, after close, and superseded ... The report states what the code does in each case."
  - The cases are the key empty, duplicated or colliding, and the press in flight, after the tab closes or superseded by a second press.
  - `grep -n -i "supersed\|in flight\|duplicat\|tab closes\|after close\|colliding" O50-report.md` finds only the history-word row.
  - The brief's own list of these cases is the brief's, not a statement of what the built code does.
  - Failure scenario: a second press on another person before the first write answers. The landing reader has no statement of the outcome (the second `writeOption` supersedes, and `pending.self` is overwritten) to check at the look.
- SP2. Verify 4 asks the self grep "quoted whole". The report (lines 105 and 226-270) gives a count, 128 (reproduced), and lists of positions. It does not quote the lines, so a hit cannot be read against its judgment without rerunning the grep.
- Paths outside the brief's line ranges, each judged against the brief, the cases ruling and ruling 227:
  - `references.ts` head comment, `SETTINGS_KEY` import and `settingsNode`: needed. The scan's spec is built from the catalog, and `optionsRecord` is private to this file. The head comment had to be carried.
  - `portfolio.ts` imports and `settingsFileOf`: needed to compute the `SettingsFile` passed at the build call.
  - `model.ts` and `lookup.ts`: within "other files of that folder".
  - `reference-hub.ts`: within the reference index's test files.
  - `config-folder.test.ts`: a G12 row the change makes false.
  - None of these is a finding. ST2 covers the duplication inside `settingsFileOf`.

## Proof

- P1. The `of` input has no test row.
  - Places: `build.ts:246` (`return [held.root === sources.root ? scan : { ...scan, of: sources.root }];`), `lookup.ts:92-94` (`(scan) => (scan.of ?? scan.file.root) === root || scan.engine === true`) and the `overlay` change at `lookup.ts:67`.
  - The input is a workspace file lying in a workspace folder other than the primary hub's.
  - Both new rows plant the file at `WORKSPACE_FILE` of the hub's own root (`reference-hub.ts:229-231`, `:272-274`), so `of` is never set in any test.
  - spec.md's test rule asks for "one row per input that gives a different outcome" in the entry's table (G67, the rename's `edits $name`).
  - Failure scenario: `of` is dropped or set to the file's own root. The workspace file then leaves the primary graph, a rename of a person no longer rewrites `settings.self`, and no test goes red.
- P2. The unsaved-workspace row tests none of the production code for that case.
  - The row: `rename.test.ts:237-243`, 'the person the setting self names, and no workspace file for an unsaved workspace'.
  - It hands the build `null` directly (`reference-hub.ts:272-274`). It passes on the unchanged tree, as the report says (line 58).
  - The production decision, `settingsFileOf` returning null when `workspace.file === null` (`portfolio.ts:264-266`), is not reached by any test.
  - Judged by reading, the row would still pass with that behaviour removed.
- P3. `test:quick` ran three times (report line 102), and only one red is given (eslint in `build.ts`).
  - spec.md (Token discipline) allows the list once after the last change and once more for each red in a changed file. A third run without a second red is "a run of the list beyond what this paragraph allows".
  - The same row narrates code that is gone ("The code that line was in is not in the tree").

## Standards

- ST1. The builder ran git commands.
  - spec.md, Where you work: "You never run a git command, read-only ones included".
  - The report quotes `git status --short` (line 104), `git diff -U0 -- src tests config docs ...` (line 108), `git show HEAD:<file>` (line 152), `git diff --stat` (line 154) and `git diff --stat HEAD` (line 156).
  - The rules file gives the base copy and `diff -rq` for each of these needs.
- ST2. `settingsFileOf` re-implements an existing lookup.
  - The new code, `portfolio.ts:264-269`:
```
const real = realPath(hub, true) ?? hub;
const folder = workspace.folders.find((one) => one.real === real);
```
  - The existing helper is `hubNameOf` in `src/lib/server/files/workspace/open.ts:104-108`: `const real = realPath(hub, true) ?? hub; return folders.find((one) => one.real === real)?.name ?? basename(hub);`.
  - The report quotes no reuse grep for any helper or type it adds: `selfKey`, `ownPeople`, `settingsNode`, `settingsFileOf`, `SelfCheck`, `SettingsFile`, `FileScan.of`. spec.md's principles require one: "before writing a helper, type or schema, grep src and tests for its name and its key call and reuse what exists, quoting that grep in the report".
  - Failure scenario: the folder match by real path changes (for example the case-insensitive file system handling `paths.ts` holds). One copy is updated and the other is not, so the reference index names the workspace file under a different root than the workspace reader does.
- ST3. `Person.svelte:206-224` has `{#if join.person.root !== undefined} ... {/if}` followed by `{#if join.person.root === undefined} ... {/if}`, two blocks with complementary conditions where `{:else}` does the job. This is code larger than its job (low). The report's judgment call 8 names it.
- No other standards finding:
  - No non-ASCII.
  - No history in comments.
  - Every changed file is under its size limit.
  - No new unused export.
  - No file-scope mutable.
  - Every new catalog key has a reader.
  - Every edited comment I read is rewrapped as a paragraph.

## Behaviour

- B1. The editor adapter that picks a graph ignores `of`.
  - Place: `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts:91`, `const graph = graphOf(index, scan.file.root);`. This is the only call of `graphOf` (`grep -rn "graphOf(" src`).
  - The step makes `graphOf` hold a workspace-file scan under `of` (`lookup.ts:92-94`), but the adapter still builds the graph of the root the open file lies in.
  - Failure scenario:
    - The open workspace file is `lab:.oculus/workspaces/w.yml`, where `lab` is a second hub folder and the primary is `hub`. It holds `settings: { self: amir }`.
    - In the editor, Go to Definition or Rename on `amir` builds `graphOf(index, 'lab')`. That graph leaves the workspace scan out and holds `lab`'s people.
    - Definition jumps to `lab`'s own `amir` when `lab` has one, and gives nothing otherwise. A rename started there plans against `lab`'s keys, not the primary's person the setting names.
  - Renames started from the primary hub's files are correct, because `graphOf(index, 'hub')` includes the scan.
- B2. A visible change the report does not state. The open workspace file now enters the reference index, so in the editor:
  - Its `settings.self` value, and any setting drawn from `domains`, `clusters` or `people`, becomes a hub-key link (Go to Definition, Find References, Rename from the file).
  - A person's, domain's or cluster's Find References and the References view list the workspace file.
  - The report's before/after (lines 272-295) names only the rename's rewrite. The look on landing has no stated before and after for the editor's links in the workspace file.
- B3. Two picker items can draw the same words.
  - Place: `editors/sources.ts:115-124` (`ownPeople`). It disambiguates only equal names: `if (one.name === '') return { id, label: id };` and `const shared = (named.get(one.name) ?? 0) > 1;`.
  - Failure scenario: people `{ key: ada, name: '' }` and `{ key: bob, name: ada }` are both drawn "ada". The user cannot tell which item writes `self: ada` and which writes `self: bob`.
  - The brief's purpose clause, "so every item can be told apart", is not met for this input. C13's two named inputs are.
- The before and after the report does state are present and agree with the diff: the Settings row, the Person page button, the finding's sentence, the chat owner and the rename of the workspace file.

## Declined to judge

- The report's Verify 1 totals (`Tests  1 failed | 282 passed | 9 skipped (292)`). They come from a different file set than any run of mine, and no decision rests on them. My runs are quoted above.
- The report's claim that the diagram lines outside this step (the views counts, `writeFollowup`, the `undo.ts` line numbers) come from diagrams the base did not regenerate. Settled by running `npx vitest run tests/checks/diagrams/diagrams.test.ts` on a checkout of `0379bb5d`, which needs a git command outside the three I may run. The committed diagrams match the worktree's source now (47 passed).
- The look on landing for C1, C7 and C13 (the Settings row and its labels, the button pressed and unpressed and the press), and for B2. The builder runs no page and neither do I.
- The report's `git diff --stat HEAD` claim on `src/lib/views/shared` and `undo.ts`. I checked the same fact with `git diff 0379bb5d --stat`, which lists neither, so the claim holds. `HEAD` itself was not run.

Usage: ac99976ef654d4063, claude-opus-5-5, 212679 tokens, 69 tool uses, 23 min 17 s

## Repair round 1, refuted

Unresolved first: the round adds a red to the tree checks. `tests/checks/tree/duplication.test.ts` now reports `tests/data/hubs/hubs-fixture.ts:41 and tests/data/snapshot/references.test.ts:577 hold the same 10 lines`. That check is part of the landing list, so `npm run test:landing` will be red on main until this is fixed. Details are under Standards ST1.

### Verification

All runs were made from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O50` unless named otherwise. `git status --short` gave 54 lines before and after my runs. I changed nothing in the worktree.

1. Round brief and brief Verify 2, the list: `npm run test:quick -- --base 0379bb5d`. I ran it twice.
   - Run 1 was red, all of it timeouts. I captured only the tail of this run:
```
 FAIL  |unit| tests/server/machine/lsp/adapters/hub-keys.test.ts > the answer to prepareRename and rename of a hub key > gives the key and its range when nothing refuses it
Error: Test timed out in 5000ms.
 Test Files  3 failed | 222 passed | 9 skipped (234)
      Tests  8 failed | 2520 passed | 101 skipped (2629)
test:quick: 244.3 s (limit 45.0 s); failed: vitest
```
     The tail also showed a timeout in `tests/routes/edit/undo/undo.test.ts` ('puts a subtask line back as it was'). The tail did not show the third failed file.
   - Run 2, with no change in between (load average 15.05 at its start):
```
test:quick: 54 changed file(s), from git since 0379bb5d
test:quick: 234 test file(s), 9 essential
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (3.3 s)
ok      eslint (2.3 s)
ok      svelte-check (9.6 s): 1792681306500 COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (94.1 s): Duration  81.97s (transform 51.58s, setup 0ms, import 117.56s, tests 190.76s, environment 2.52s)
test:quick: 97.6 s (limit 45.0 s); every command passed
test:quick: over the time limit
```
   - The timeouts, each file run alone:
     - `hub-keys.test.ts` is a file the step changes. Alone (`npx vitest run tests/server/machine/lsp/adapters/hub-keys.test.ts --reporter=verbose`): `Test Files  1 passed (1)`, `Tests  14 passed (14)`, Duration 2.11s.
     - The step does not change the other three (none appears in `git status --short`; `grep -c` printed 0):
       - `undo.test.ts`: `Tests  56 passed (56)`.
       - `watch-no-primary.test.ts`: `Tests  2 passed (2)` (2900 ms, 1216 ms).
       - `window-guard.test.ts`: `Tests  27 passed (27)`.
2. Brief Verify 1, the 13 named files (`npx vitest run tests/server/edit/config-key.test.ts ... tests/checks/tree/boundaries.test.ts --reporter=dot`):
```
 FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib
+   "state/boards/collection.ts imports data/snapshot/normalise-parts/plans",
+   "views/shared/forms/Followups.svelte imports data/model",
 Test Files  1 failed | 12 passed (13)
      Tests  1 failed | 215 passed | 9 skipped (225)
```
   This red was already on the base. In a scratch copy of the base `src`/`config` (`diff -rq` against `migration-O50-base` printed nothing), the same file gave the same two lines, `Tests  1 failed | 10 passed (11)`.
3. The round's test files together (`npx vitest run tests/state/system/settings/theme-groups.test.ts tests/server/machine/lsp/adapters/hub-keys.test.ts tests/data/snapshot/rename.test.ts tests/data/snapshot/references.test.ts --reporter=verbose`): `Test Files  4 passed (4)`, `Tests  98 passed (98)`. This matches the report. The slow describe run as the report quotes it (`--tags-filter=slow --testTimeout 20000`): `Tests  4 passed | 33 skipped (37)`, at 740, 650, 624 and 635 ms.
4. First runs on the round-0 tree. Scratch copy: the worktree's `src` with the round-1 files put back as they were in round 0:
   - `lookup.ts`, `portfolio.ts`, `editors/sources.ts` and `Person.svelte` from `migration-O50-round-1`;
   - `open.ts` and `hub-keys.ts` from `migration-O50-base` (neither is in `files.txt`);
   - every `src` path of `files.txt` checked byte-equal to the snapshot;
   - the worktree's tests.
```
 FAIL  ... theme-groups.test.ts > the people of the choice self > draws { ada: '', bob: 'ada' } ...
AssertionError: expected [ 'ada', 'ada' ] to deeply equal [ 'ada (ada)', 'ada (bob)' ]
 <heavy angle> tests/state/system/settings/theme-groups.test.ts:419:41
 FAIL  ... draws { k1: 'Kim', k2: 'Kim', x: 'Kim (k1)' } ...
AssertionError: expected [ 'Kim (k1)', 'Kim (k2)', 'Kim (k1)' ] to deeply equal [ 'Kim (k1)', 'Kim (k2)', <ellipsis>(1) ]
 FAIL  ... hub-keys.test.ts > ... > goes from the setting self of the open workspace file in another workspace folder to the primary hub's person
AssertionError: expected undefined to match object { result: [ { <ellipsis>(2) } ] }
 <heavy angle> tests/server/machine/lsp/adapters/hub-keys.test.ts:210:28
 FAIL  ... hub-keys.test.ts > ... > renames from the open workspace file of another workspace folder the primary hub's person
AssertionError: expected undefined to deeply equal [ <ellipsis>(4) ]
 <heavy angle> tests/server/machine/lsp/adapters/hub-keys.test.ts:232:25
 Test Files  2 failed | 2 passed (4)
      Tests  4 failed | 94 passed (98)
```
5. The same rows on the base copy. Scratch tree: base `src`/`config`/`utils` (`base-identical`) with the worktree's tests (`npx vitest run tests/data/snapshot/rename.test.ts tests/data/snapshot/references.test.ts --testTimeout=60000`):
```
AssertionError: expected [] to deeply equal [ { root: 'hub', <ellipsis>(3) } ]
 <heavy angle> tests/data/snapshot/references.test.ts:625:23
AssertionError: expected [] to deeply equal [ { root: 'lab', <ellipsis>(3) } ]
 <heavy angle> tests/data/snapshot/references.test.ts:625:23
 FAIL ... rename.test.ts > the rename of a hub key > edits 'the person the setting self of the op<ellipsis>'
 FAIL ... rename.test.ts > the rename of a hub key > edits 'the person the setting self names, in<ellipsis>'
AssertionError: expected { <ellipsis>(3) } to deeply equal { <ellipsis>(4) }
 <heavy angle> tests/data/snapshot/rename.test.ts:406:24
 Test Files  2 failed (2)
      Tests  4 failed | 60 passed (64)
```
6. ASCII gate (Verify 3 and the round brief), run as `git status --short | awk '{print $2}' | grep -v '^\.scratch/' | grep -v '\.svg$' | xargs env LC_ALL=C perl -ne '<the spec.md gate>'` over 45 files: it printed nothing, `gate exit 0`. A plain non-ASCII scan of `docs/diagrams/*.svg` printed nothing. The gate over `O50-report.md` printed nothing.
7. Verify 4:
   - `grep -rn -w --exclude=local.yml self src config docs tests README.md` gives 136 lines, 0 of them under `docs/diagrams`.
   - The `file:line` set of my run against the 136 lines quoted at report 534-807: `diff` printed nothing.
   - The C11 grep:
```
src/lib/server/sessions/stores/hooks.ts:157:        if (isMap(person) && person.self === true && typeof person.name === 'string') {
src/lib/views/boards/person/Person.svelte:151:    const isSelf = $derived(join.person?.self === true);
```
8. Verify 5: `sh utils/unused-exports.sh > <scratch>/unused-now.txt; diff ../migration-O50-base/unused-exports.txt <scratch>/unused-now.txt` gives `diff exit 0`.
9. Verify 6: `git diff 0379bb5d -- src tests config docs ':!docs/diagrams' | grep '^+' | grep -i -E "before|used to|no longer|still|...|O[0-9]{2}[a-z]?\b|20[0-9][0-9]-[0-9]"`:
```
189:+// into a tab is a link before it is saved and a file open under two root keys is one file. A key
296:+     * published portfolio, so a write on its way shows the state before it until the portfolio
```
   Neither line is history. Both describe the state at run time; the first is pre-existing head-comment text in `hub-keys.ts`, rewrapped.
10. The report's evidence commands, rerun:
    - The reuse grep on the base copy (`grep -rnF --exclude=local.yml "<name>" src` for each of the 12 names) gives the same hits the report gives.
    - `node -e` with `yaml`'s `parse` on a duplicated `self:` gives `Map keys must be unique at line 3, column 3:`.
    - `grep -c signal 'src/routes/api/write/+server.ts'` gives 0.
    - `grep -c "'self'" src/lib/data/helpers/hub-names.ts` gives 0.
    - These cited places hold the code the report names: `open.ts:184` (`findings.workspace.file_unparsed`), `lists.ts:151` (`duplicate_key`), `hub-layer.ts:70` (`hub_key_unknown`), `workspace-layer.ts:185` (`settings_value`).
    - `writes.svelte.ts` holds `keepalive` only at 202-214.
    - `byId` (`normalise.ts:151-157`) is a stable sort, so the last of two equal keys is the one kept.
    - `diff -q` against the base for `wallpaper.ts` and `EntryForm.svelte` printed nothing.
11. Other checks:
    - `npx vitest run tests/checks/diagrams/diagrams.test.ts --testTimeout=120000`: `Tests  47 passed (47)`.
    - `npx vitest run tests/checks/tree/duplication.test.ts tests/checks/source/keys.test.ts --testTimeout=120000`: `Tests  3 failed | 24 passed (27)`. One of the three is new with this round:
```
 FAIL  |unit| tests/checks/tree/duplication.test.ts > a rule written twice > is not held anywhere under tests
+   "tests/data/hubs/hubs-fixture.ts:41 and tests/data/snapshot/references.test.ts:577 hold the same 10 lines (8e0af16b0cb5)",
```
      On the base tree (base `src` and base `references.test.ts`/`reference-hub.ts`), the same file fails only its two `src` rows (Lanes/Followups/Subtasks/EntryCard), `Tests  2 failed | 16 passed (18)`. So the `tests` row is red only because of this round.

### Verdicts

Brief items (whole diff since `0379bb5d`):
1. **Holds.** `config/defaults/sources.yml:73-74` has `self: ''` with its comment. `config/options/sources.yml:112-118` has heading `sources`, section `People`, a choice, `empty`, `from: people`, and the help the brief asks for.
2. **Holds.**
   - `SOURCES` gains `people`.
   - The page: `Settings.svelte:195` and `editors/sources.ts` (`ownPeople`, labels, the source case).
   - The server: `config-sources.ts:64-71`, `writes.ts:139`, `hooks.ts:140-145`.
   - The editor's schema: `engine.ts:98-99`.
   - The index: `OPTION_SOURCES` with `people`, `settingsNode`, and the workspace file passed from `portfolio.ts:750` to `build.ts:236-247`.
   - This round's B1 closes the editor half (`hub-keys.ts:93`). See B1 for the labels.
3. **Holds.** `normalise.ts:375-396`: `person(entry, owner)` takes nothing named `self` from the entry. `model-entities.ts:790` is rewritten.
4. **Holds.** `validate.ts:298-317` (`checkSelf`, `self_unknown`). The file is `join(hub, config.registries.people)` (`index.ts:527-531`), the convention `unreadSources` uses (`lists.ts:89`).
5. **Holds.** The `ownerName` code is unchanged, and its doc and `chat.ts:28-31` are rewritten.
6. **Holds.**
   - `Person.svelte:206-223` is one `{#if}/{:else}`. The button's pressed state comes from `isSelf`.
   - `markSelf` returns early for a person with a `root` and for the person already set.
   - `setSelf` (`ui.svelte.ts:457-460`) goes through `writeOption`, which makes the unsaved-workspace offer (`:247-249`).
7. **Holds.** The documents, the fixture and the four tests' data are carried (the self grep above).
8. **Holds** for the builder: the hub is not in the diff. The move is the landing's.

Round brief items:
1. **Holds.**
   - `keysRootOf` (`lookup.ts:89-91`) is used by `graphOf` (`:100`) and by `hub-keys.ts:93`.
   - The grep the item names prints three lines. `hub-keys.ts:108` (a URI) and `elsewhere.ts:16` (the root on disk) name where a file is; they do not choose a graph.
   - `graphOf` has one caller in `src`.
2. **Holds.**
   - The rename row in `lab` is at `rename.test.ts:239-248`. The adapter rows are at `hub-keys.test.ts:200-241`.
   - The adapter rows fail on the round-0 tree (run 4 above).
   - R1-1, judged by reading:
     - The `lab` rename row plans in `graphOf(laid, 'hub')` (`reference-hub.ts:341`). The `lab` scan is in that graph only through `of: 'hub'`, which `build.ts:246` sets.
     - Without `of`, the `lab` file would be missing from `edited`, and `rename.test.ts:406` would fail.
     - The `references.test.ts` row 'the file under another folder' asserts `of: 'hub'` directly.
     - So the row tests `of`. The run on the base copy (run 5) is the only failing run, and it fails for the wider reason that the base has no workspace scan.
   - The quoted failing lines are stale; see P1.
3. **Holds.**
   - `references.test.ts:540-627` builds through `watchPortfolio`, so `settingsFileOf` runs.
   - The rows 'unsaved' and 'no folder' give `[]`. By reading, either would throw or scan if `settingsFileOf`'s guards were absent.
   - The rows are tagged slow, so they run only in the landing list (at about 650 ms each). See ST1 for the duplicated watcher setup.
4. **Holds.** `folderOfHub` (`open.ts:105-112`) is used by `hubNameOf` (`:114-116`) and `settingsFileOf` (`portfolio.ts:266`), and `realPath` is no longer imported in `portfolio.ts`. The reuse grep is quoted and reproduced.
5. **Holds.** `Person.svelte:206-223`.
6. **Holds** for the rule the item states. The two named inputs give `ada (ada)`/`ada (bob)` and `Kim (k1)`/`Kim (k2)`, and they fail on the round-0 tree. The aim "every item can be told apart" still fails for one input; see B1.
7. **Holds**, with one omission:
   - The key cases (empty, duplicated, colliding) and the press cases (in flight, after close, superseded) are stated at report 502-520, and the evidence reproduces.
   - The editor before and after is at 522-525, but it leaves out settings drawn from vocabulary lists; see B2.
8. **Holds.** The 136 lines are quoted with a judgment on each. My run gives the same set. I read each "about the person" hit and agree with it.

Cases of the brief and the cases ruling:
- C1. Met by reading (`config-sources.ts:64-71`, `editors/sources.ts`, `Settings.svelte:195`). The look on landing is its proof.
- C2. Met by reading (`config-fit.ts` `notListed`, `server.config_key.not_in_source`).
- C3. Met. The normalise rows pass (Verify 1, 12 files passed). The first refuter reproduced their failure on the base.
- C4. Met by reading (`validate.ts:309-316`, `index.ts:527-531`).
- C5. Met (C3's rows, and the record schema unchanged).
- C6. Met by reading (`hooks.ts:157`, `chat.ts:115`).
- C7. Met by reading (`Person.svelte:151-161`, `:206-223`). The look on landing is its proof.
- C8. Met by reading (`ui.svelte.ts:247-249`).
- C9. Met (`grep -c "'self'" hub-names.ts`: 0).
- C10. Met by reading (`selfKey` uses `str`; `workspace-layer.ts:185`).
- C11. Met (grep quoted above).
- C12. Met by reading (`engine.ts:98-99`).
- C13. Partial. An empty name and equal names are told apart, and a workspace with no primary hub offers only the empty item. A cascading input is still drawn twice under one label; see B1.
- C14. Met. Both rename rows pass. On the base they fail at `rename.test.ts:406:24` (run 5). The unsaved half is now covered by the `references.test.ts` 'unsaved' row through the production path.
- Round case 1. Met (run 4: before, `undefined`; after, passes).
- Round case 2. Met. It passes now. By reading, it fails without `of` (R1-1 above).
- Round case 3. Met (verification 3).
- Round case 4. Met for its named inputs (verification 4 and 3).

### Spec

1. SP1. A head-comment change that no item asks for, and that the report does not list.
   - Place: `tests/data/snapshot/references.test.ts:1`:
```
-// Layer 1, data tests. The reference index of the snapshot build (data/snapshot/references/): the
+// Layer 4, data tests. The reference index of the snapshot build (data/snapshot/references/): the
```
   - The other seven files in `tests/data/snapshot/` say `Layer 1, data tests` (`head -1`). The round report's per-item list does not mention the change.
   - Failure scenario: none at run time. A reader of the folder finds one data test numbered differently from its siblings, with no reason given.
   - Fix at landing: keep it only if the new server import is the reason, and say so in the paragraph the round added. Otherwise put `Layer 1` back.

### Proof

1. P1. The failing lines the report quotes were taken before the last change and do not reproduce at those lines. The spec says: "Every count, line count, timing and `file:line` in the report is taken after your last change".
   - Report 377-378 gives `hub-keys.test.ts:213:28` and `:226:25`. My round-0 run gives `:210:28` and `:232:25`.
   - Report 382 gives `rename.test.ts:403:24`. My base run gives `:406:24`.
   - Report 386 gives `references.test.ts:624:23`. My base run gives `:625:23`.
   - The failures themselves reproduce (runs 4 and 5).
   - Failure scenario: the landing reader opens the quoted line to read the failing assertion and finds a different statement.
   - No decision rests on these lines. The verdicts used my lines.

### Standards

1. ST1. The new watcher harness copies an existing one, and the tree check that guards against copies is now red.
   - Place: `tests/data/snapshot/references.test.ts:570-596` (`watchedIndex`). It repeats the `watchPortfolio(new Hub(), { engine, icons, host, open, settings, problems }, { debounce: 20, ... })` setup of `published` in `tests/data/hubs/hubs-fixture.ts:37-58`:
```
    const watcher = watchPortfolio(
        new Hub(),
        {
            engine: engineDir(),
            icons: { set: {} },
            host: { name: 'test', address: '127.0.0.1' },
            open: () => workspace.open(),
            settings: (dir) => loadConfig(engineDir(), { hub: dir }),
            problems: () => []
        },
```
   - What is wrong:
     - The spec says "before writing a helper, type or schema, grep `src` and `tests` for its name and its key call and reuse what exists".
     - The report's reuse grep covers `src` only.
     - `duplication.test.ts` flags the pair: `tests/data/hubs/hubs-fixture.ts:41 and tests/data/snapshot/references.test.ts:577 hold the same 10 lines (8e0af16b0cb5)`. On the base tree that row is green (verification 11).
   - Failure scenario: `npm run test:landing` runs the tree checks on main and is red on this row. A later change to the watcher's environment (a new option, a different `settings` loader) has to be made in two harnesses.
   - Fix: widen `published` in `hubs-fixture.ts` to take a saved `Workspace` and the build options (or the `schemas` callback), and build `watchedIndex` on it.
2. ST2. The verify list ran four times.
   - The report states it at 419: "The verify list ran four times this round. Runs 3 and 4 are beyond what `spec.md` allows."
   - Spec, Token discipline: "A red line in a file the step does not change is rerun alone and named with that run in the report, and the list is not run again for it."
   - Run 2's red was in `undo.test.ts`, a file the step does not change. Runs 3 and 4 had no change in between.
   - Each timeout, judged by its one-file run:
     - `undo.test.ts`, run 2: not a step file, `Tests  56 passed (56)` alone.
     - `window-guard.test.ts`, run 3: not a step file, `Tests  27 passed (27)` alone.
     - `watch-no-primary.test.ts`, run 3: not a step file, `Tests  2 passed (2)` alone.
     - Run 1's red was `svelte-check` in `theme-groups.test.ts`, a step file. The builder fixed it, and run 2 was the allowed rerun.
3. ST3. `guarded.md` does not name the new test describes and rows.
   - `grep -c` for 'the open workspace file in the reference index', 'a setting of the open workspace file' and 'the people of the choice self' over `.scratch/migration/agents/guarded.md` finds none of them. The 4 lines it counts come from other text that mentions "unsaved workspace".
   - Spec: "A test exists only as the test of one entry of `agents/guarded.md`, and `agents/guarded.md` names it there by file and title."
   - The builder raised this as R1-2 (report 336 and 811-815), because the builder may not edit the ledger.
   - Failure scenario: a later step deletes the rows as unnamed, or never runs them as the test of G66, G67 or G119.
   - Fix at landing: write the listed names into G66, G67 and G119.
4. ST4. The doc comment of `ownPeople` (`editors/sources.ts:110-115`), "so every item can be told apart", is false for the input in B1. This is a sentence the diff makes false. It has the same fix as B1.

### Behaviour

1. B1. One picker input still draws two items under one label.
   - Place: `src/lib/state/system/config/editors/sources.ts:116-132`. `taken` holds the keyed labels of the items whose words are shared, and an item whose plain words equal one of those labels is keyed once:
```
    const taken = new Set(own.filter((one) => shared.has(one.id)).map(keyed));
    return own.map((one) => ({
        id: one.id,
        label: shared.has(one.id) || taken.has(one.words) ? keyed(one) : one.words
    }));
```
     That keyed label is never checked against the other plain words.
   - Failure scenario, run through `listsOf` and `poolOf` over the shipped option on a scratch copy of the worktree `src`: people `{ k1: 'Kim', k2: 'Kim', x: 'Kim (k1)', y: 'Kim (k1) (x)' }` draw `["Kim (k1)","Kim (k2)","Kim (k1) (x)","Kim (k1) (x)"]`.
     - `x` and `y` read alike in the Settings choice.
     - The input is contrived (a name that copies another item's label), but the round's purpose and the doc comment claim it cannot happen.
   - Fix: key items until the labels are unique (repeat the `taken` step until nothing changes), or key every item whose words equal any item's final label.
2. B2. The stated editor before and after leaves out settings drawn from vocabulary lists.
   - Report 525 says the settings whose option draws from `domains`, `clusters` or `people` become hub-key links.
   - `settingsNode` (`references.ts:137-144`) reads every option whose `from` is in `OPTION_SOURCES`. That includes `entry_statuses`, `tiers`, `status_chips` and `project_types`.
   - The options that draw from them: `config/options/behavior.yml:122`, `:128`, `:134` (`focus.applications_open`, `focus.education_open`, `focus.applications_sent`, `from: entry_statuses`) and `config/options/layout.yml:132`, `:156`, `:177`.
   - Their definitions are in `vocab.yml`, an engine file present in every graph (`lookup.ts:100`).
   - Failure scenario:
     - A workspace file with `focus.applications_open` set becomes a link to `vocab.yml`.
     - Find References on a status word lists the workspace file.
     - The look on landing has no stated before and after for this.
   - The rename of a vocabulary value stays refused (the `rename.test.ts` row 'a vocabulary value'), so only the links and references change.

### Declined to judge

- The third failing file of my first `test:quick` run. I captured only the tail. The second run, with no change in between, was green.
- Whether the base commit's diagrams match the base source. That needs a checkout of `0379bb5d`, which needs a git command outside the three I may run. The worktree's diagrams match its source (47 passed).
- The look on landing for C1, C7 and C13, and for B2: the Settings row and its labels, the button pressed and unpressed and its press, and the editor links in the workspace file. Neither builder nor reviewer runs a page.
- The report's claim that the server applies two writes in the order they arrive (report 520). It is a judgment about the write route's ordering, and settling it needs a run against a live server, which I may not start.
- The report's claim of load averages and top processes during its runs (report 488). It is a past measurement and cannot be rerun. No decision rests on it.

Usage: ae22da9a7c93e0180, claude-opus-5-5, 239932 tokens, 75 tool uses, 18 min 52 s

## Closed

- First review SP1, SP2, P1, P2, ST2, ST3, B1 and B3: closed in repair round 1 (round items 7, 8, 2, 3, 4, 5, 1 and 6), each verdict "holds" in the run over the round.
- First review B2: the before and after stated in round 1 (round item 7), completed at landing by round 1 B2 below.
- First review P3 and ST1 (the verify list run three times, read-only git commands run by the builder): no state of the tree changed and the report disclosed both; nothing in the tree to fix.
- Round 1 SP1: fixed at landing. The new server import is the reason for layer 4: the other tests that build through `watchPortfolio` (`tests/data/hubs/hub-portfolio.test.ts`, `hub-folders.test.ts`, `hubs-fixture.ts`) open with "Layer 4". `Layer 4` is kept and the head comment's paragraph on the watcher table says so (`tests/data/snapshot/references.test.ts:15-16`).
- Round 1 P1: closed by a note at landing in the report, with the failing lines as the reviewer's runs give them (`hub-keys.test.ts:210:28` and `:232:25`, `rename.test.ts:406:24`, `references.test.ts:625:23`).
- Round 1 ST1: fixed at landing. `tests/data/hubs/hubs-fixture.ts` gains `watchedOnce(workspace, options)`, the watcher's first build over a workspace with the build options given; `published` builds on it, and `watchedIndex` in `references.test.ts` passes its `schemas` callback to it, so the watcher's environment is set in one place.
- Round 1 ST2 (the verify list run four times this round): no state of the tree changed and the report disclosed it; nothing in the tree to fix.
- Round 1 ST3: fixed at landing in `agents/guarded.md`: G66 states the open workspace file's scan and names the describe 'the open workspace file in the reference index' with its four rows; G67 names the two rename rows of the setting self and the describe 'the answer to a request on a setting of the open workspace file' with its rows; G119 states the labels of the choice Self and names the describe 'the people of the choice self' with its five rows.
- Round 1 B1 and ST4: fixed at landing in `src/lib/state/system/config/editors/sources.ts` (`ownPeople`): an item whose label equals another item's label is keyed, repeated until no new item is keyed, and the doc comment says so. A fifth row of 'the people of the choice self', `{ k1: 'Kim', k2: 'Kim', x: 'Kim (k1)', y: 'Kim (k1) (x)' }` drawn as `Kim (k1)`, `Kim (k2)`, `Kim (k1) (x)`, `Kim (k1) (x) (y)`, failed on the step's code before the fix (received `Kim (k1) (x)` twice) and passes after.
- Round 1 B2: closed in the booking with the before and after. Before, the open workspace file was in no reference index. After, every setting of it whose option draws from a source the index holds is a reference, as the same setting in a defaults file already was (`optionFiles`, on the base at `src/lib/data/index.ts:527`): the sources `domains`, `clusters` and `people`, and the vocabulary lists (`entry_statuses` for `focus.applications_open`, `focus.education_open` and `focus.applications_sent`, and the options of `config/options/layout.yml` that draw from `tiers`, `status_chips` and `project_types`), each linking to its item in `vocab.yml`; Find References on such a word lists the workspace file. A rename of a vocabulary value stays refused.
