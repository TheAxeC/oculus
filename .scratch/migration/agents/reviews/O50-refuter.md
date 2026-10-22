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
