# Step D74 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D74, base 1e5cc69a8)

Pages cited by section: the brief is `tools/oculus/.scratch/migration/agents/briefs/D74.md` (sections "What to build" parts 1 to 13, "Cases", "Paths this step writes", "Decisions taken in this brief", "Verify before you report"); the spec is `tools/oculus/.scratch/migration/agents/spec.md`; the builder's report is `tools/oculus/.scratch/migration/agents/reviews/D74-report.md`; the ruling is the ledger's Z869 (chord for the Apps group) and Z862 (part 4's shape). Code paths below are relative to `tools/oculus` in the worktree.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:quick -- --base 1e5cc69a8      (run once, exit 0)
test:quick: 263 changed file(s), from git since 1e5cc69a8
test:quick: 206 test file(s), 10 essential
ok ASCII gate (0.5 s)
ok prettier (3.5 s): All matched files use Prettier code style!
ok svelte-kit sync (14.6 s)
ok eslint (18.8 s)
ok svelte-check (32.1 s): 1791905207302 COMPLETED 499 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok vitest (89.3 s): Duration  73.53s (transform 125.56s, setup 0ms, import 160.88s, tests 112.15s, environment 1.04s)
test:quick: 90.0 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
build, lint of unchanged files; npm run test:landing runs them
(changed tests it did not run: arrangements, config-folder, config, keys (test:checks); app-setting, routes config-key, hub-writes, clone-exclude (test:slow))

$ npx vitest run tests/checks/source/keys.test.ts tests/checks/diagrams tests/checks/tree --testTimeout 0 --hookTimeout 0
Test Files  6 passed (6)
Tests  94 passed (94)
Duration 242.29s

$ npx vitest run tests/checks/config/config-folder.test.ts tests/checks/config/integrity.test.ts
Tests  3 failed | 29 passed (32)
FAIL 'gives every group a chord and a glyph, and no letter a key the workbench binds': AssertionError: expected [ { label: 'Apps', <horizontal ellipsis>(3) } ] to deeply equal []
FAIL 'names a group of its own and a path under the hub for every document': Error: expected any number of assertion, but got none
FAIL integrity 'validates with no findings': AssertionError: expected [ Array(239) ] to deeply equal []

$ git diff 1e5cc69a8 --name-only -- '*.test.ts' (minus config-folder and keys) | xargs npx vitest run --testTimeout 0
Test Files  23 passed (23)
Tests  392 passed (392)

$ sh utils/folder-check.sh        exit 0
$ sh utils/size-check.sh          exit 0
$ sh utils/unused-exports.sh      exit 0, Unused exports (238)
  (same script on a scratch copy of the base src/tests/config/utils: knip printed "ERROR: Error loading vite.config.ts (File './.svelte-kit/tsconfig.json' not found.)", exit 2, and listed Unused exports (238); sorted diff of the two listings: base leads.ts isDeclined, isExpired / radar.ts bucketsOf, isDismissed; after leads.ts isDeclined / radar.ts bucketsOf)

$ grep -rn "reason: \`\|reason: '\|fail('\|refuseAll(.*'" src/lib/server/edit | wc -l
0          (on the base copy: 140)
  part 10's grep for error: answers: 0 (base 13); its grep for new Error(...) sentences: 0 (base 5)
  every one of the 47 REFUSALS keys in src/lib/server/edit/why.ts has a REFUSALS.<key> user (grep per key)

$ git diff 1e5cc69a8 | grep '^+' (excluding .scratch and svg) | LC_ALL=C grep -n '[^ -~]'    none
  new untracked files, same scan: none; added svg lines: 0

$ ls tools/oculus/docs/adr docs/adr (worktree and main)     No such file or directory
```

## Verdicts

1. The Live HPC view on a hub that names no cluster: holds. `host.ts` answers an unconfigured host, `poll.ts` neither schedules nor runs the runner for it and publishes `unconfigured` on a push that removes the cluster, the submit route refuses with the missing sentence through `refuse('no-host', missing)`. See Behaviour for the status bar's short label.
2. The source tab focused last, kept while hidden: holds. `editor-status` keeps `focused` until the tab is no longer open (`isOpen` false); the base cleared it on `forget` (base `editor-status:164`, `source-status:44` onDestroy).
3. A write shows in an open History: holds, with the Spec finding on `changes.svelte.ts:233` (reload mode changed, unasked and unreported).
4. Repositories, one row each: holds, with the Spec finding on the `inWorkspace` field added to the public `git` payload.
5. The Apps page as VS Code's Extensions view: violated. `config/layout.yml:36` gives the Apps group no chord; the held row in `config-folder.test.ts` is red; Z869 rules chord `a`. Finding: Spec 1.
6. Pinned arrangement tabs and Reopen Closed Tab: holds.
7. Each hub's own vocabulary: holds, with the Standards finding on `themes.ts:90`.
8. One settings file per hub: holds (`HUB_FILE`, `isHubFolder` by `isFile`, `mergeHub`), with the Standards findings on `portfolio.ts:521-526` and `config/behavior.yml:325`.
9. One list of a hub's record files: holds (the collections registry entries; options and `HUB_LIST` carry no `*_file` key).
10. Refusal words from the catalog: holds (greps above print 0; `keys.test.ts` passes).
11. Entry pages right after a write: holds by reading the settled store; the pages themselves are for the look.
12. The card on a lead's and a Lit Watch paper's page: holds by reading (cards moved to `shared/card/feed`, `lead-apply.ts`).
13. The Float group, Apps guide, References: holds in config and code; violated in one doc sentence, `DESIGN.md:615`. Finding: Standards 3.

Cases:
- 1, 2, 3, 4 (HPC): met by reading `host.ts`, `poll.ts`; the builder's harness quotes were not rerun (see Declined).
- 5 to 10, 75 (focused tab): met by reading `editor-status`; the harness runs not rerun.
- 38 to 44, 46 (History): not verifiable by me; what settles them is a rerun of the builder's harness over the store or the page look. 45: the `changes` row is met by the 23-file run (G9 `changes.test`, publishes after the lines are on disk via `lines: readChanges(log).length`); the same-millisecond half rests on a false premise (Spec 5).
- 47 to 52, 83 (vocabulary): not verifiable without the harness rerun or the look; 50 partial for the facet label (Standards 4).
- 53, 54, 56, 57, 58, 79, 80, 81: met by the 23-file run (G13, G8, G9, G77, G3, G61 rows). 55: met by reading `isHubFolder`. 59: met as checked by the report on the first config-key write that makes the file, the brief's premise about the seed being wrong (Spec 5).
- 60, 61, 62: met by the 23-file run (G32, G13). 63: not verifiable without the harness rerun.
- 64 to 67: met by reading why.ts and the edit refusals; 68: met (greps 0, keys.test.ts passes).
- 69, 70: met by the G28 rows in the 23-file run for the draft; the page is for the look. 82, 71, 72: not verifiable without the look; 72's label for unlisted kinds noted in Behaviour.
- 73, 74: not verifiable without the look.
- 11 to 19, 76 (Repositories): 11 to 14, 17, 18, 76 met by the G81 row and reading `repositories.ts:444-485`; 15, 16, 19 not verifiable without the look.
- 20 to 26 (Apps page): not verifiable without the look; the chord the group lacks is item 5's finding (Spec 1).
- 27 to 36, 77, 78: not verifiable without the look or the builder's harness rerun; 37 met by the G54 rows.
- 84 to 88 (Float group): 84, 86, 87 met by reading `config/layout.yml`; 85, 88 not verifiable without the look.

## 1. Spec

1. `config/layout.yml:36`: "apps: { label: "Apps", glyph: app }"; what is wrong: the Apps catalogue group has no chord, so the held row 'gives every group a chord and a glyph, and no letter a key the workbench binds' is red; the report's open item recommended option (b), widening that held check, which Z869 rules the lazy option and replaces with chord `a` in a repair round; failure scenario: the Apps views cannot be reached by a chord and the guarded config check fails at landing; verdict: violated, repair per Z869.
2. `src/lib/data/model/model-sessions.ts:481`: "inWorkspace: boolean;" (with `src/lib/server/root/watch/git.ts:385` "{ ...one, inWorkspace: marked.has(root) }" and `docs/apps.md:368`); what is wrong: part 4 allowed "what the server already sends or one list the server adds to the git channel's payload"; the step adds a per-root boolean on every `GitState`, a third shape on a public channel that Z862 did not rule; the report names it as a judgment call; failure scenario: an app reading the `git` channel sees a new field the orchestrator has not approved as wire format; verdict: open for the orchestrator's ruling (keep, or move to one list as the brief described).
3. `src/lib/state/sessions/changes.svelte.ts:233`: "-        if (inBrowser()) queries.refetch(KEY, first, 'drop');" / "+        if (inBrowser()) queries.refetch(KEY, first, 'again');"; what is wrong: the brief says the `first` path, reload and latest, is unchanged; the step changes reload's mode from drop to again, and the report does not state it; failure scenario: a reload while a fetch is out now runs a second fetch after it instead of being dropped, a behaviour change no case covers; verdict: unasked change, revert to `'drop'` or justify and report it.
4. `src/lib/state/workbench/layout.svelte.ts` (9 insertions, 4 deletions, wires `createReopen`): what is wrong: a path outside the brief's "Paths this step writes" (the layout folder is listed, the store file beside it is not), and the report does not name it as a widened path; failure scenario: the orchestrator's path check at landing finds an unlisted file; verdict: report gap, the change itself is needed for part 6.
5. Brief premises the report states as wrong: `config-seed.ts` is the page config seed, not a hub seed (case 59 was checked on the first config-key write instead); appends in the same millisecond already get distinct `at` stamps, so the item "compares by more than the moment" rests on a false premise and the store compares by moment only; verdict: premise errors for the orchestrator to confirm; no defect in the code.

## 2. Proof

1. Report, verification section: "four `npm run test:quick` runs ... Runs 1 to 3 were each followed by more edits"; what is wrong: the spec allows the verify list once after the last change plus one rerun after a red line in a changed file; four runs is at least two beyond that; failure scenario: none in the code, a process breach; verdict: violated (process).
2. Report, open item for part 5: option (b) recommends widening the held chord check; what is wrong: the spec says "A threshold is never loosened"; recommending it is the lazy option Z869 rejected; verdict: violated (recommendation), superseded by Z869.
3. Report's timing line "72.5 s" for test:quick; my run printed "test:quick: 90.0 s (limit 45.0 s)" and "over the time limit"; what is wrong: the over-limit run is not stated as over the limit in the report; verdict: minor, not load-bearing.
4. The guarded 23-file run and the tree checks use `--testTimeout 0`; the report says the tree checks need it as test:checks sets; note only, no defect.
5. Edited assertions read: `config-folder.test.ts` row renamed "keys every catalogue group but the float's by the rail page it holds..." filters `float` and adds `expect(groups).toHaveProperty('float')`, which follows ruled part 13; `keys.test.ts` gains a `COMPUTED_PREFIXES` entry for why.ts (`start: 'words(text, found.key'`, `keys: () => Object.values(REFUSALS)`) and the `HUB_FILE` description key, consistent with part 10 and listed in the report; `allow-styling.ts` changes are path moves only. None.

## 3. Standards

1. `src/lib/server/root/watch/portfolio.ts:524-525`: "The primary hub's settings file is a config change; another hub's is a portfolio rebuild."; what is wrong: the code at `portfolio.ts:574` is "openFile(join(dir, HUB_FILE), () => true);" for every hub, so the comment states the opposite of what the code does; failure scenario: a reader changes the watcher to match the comment and breaks a second hub's config push; verdict: violated, rewrite the sentence.
2. `src/lib/server/root/watch/portfolio.ts:426-428` (the `openFile` doc comment): "in the hub root would make a recursive watch of its folder" (65 columns) followed by "cover the whole hub a second time"; what is wrong: the edited paragraph is not rewrapped to 100 columns as the spec's comment rule asks; verdict: violated (format). Same defect at `src/lib/views/system/workbench/Catalogue.svelte:15-18`: the edited head comment has "// opens it and its live badge. A press opens the" (53 columns) mid-paragraph; verdict: violated (format).
3. `DESIGN.md:615`: "The Workbenches view (`views/system/workbench/Workbenches.svelte`, a unique view at order 10 of the `views` group, so it moves no chord)"; what is wrong: after part 13 the view sits in the `float` group at order 2, and the same paragraph was edited by the step ("(the Float group has none)"); failure scenario: the design doc misstates where the view lives and its chord; verdict: violated, item 13.
4. `src/lib/state/shared/words/themes.ts:90`: "label: [...(labels.get(theme) ?? [theme])].join(' / '),"; what is wrong: a literal separator the reader sees in the Venues and Data theme facets, outside the catalog (spec: every user-facing string from a catalog); it is also a user-visible facet shape (case 50) not raised as a decision; verdict: violated, case 50 partial.
5. `config/behavior.yml:325`: "...written by the Settings view into `app_settings` of the primary hub's .oculus/config.yml ... The map is not set here; the hub's layer holds it."; what is wrong: the description says the primary hub's file in one sentence and "the hub's layer" in the next for the same place, and part 8 makes every hub's file carry its own `app_settings`, so "the primary hub's" is also stale; verdict: violated, rewrite with one name.
6. `src/lib/state/client/writes.svelte.ts:129`: "const NO_SETTLE: Settle = {"; what is wrong: a file-scope fallback object handed to callers and not frozen (spec principles: a shared fallback object handed to callers is frozen or built per call); the earlier `NO_LOOKUPS` has the same shape; failure scenario: a caller mutating the returned settle changes every later caller's fallback; verdict: violated, freeze it.
7. The report's history-word grep leaves out the spec's words "still", "before", "as before", "always had"; my grep of added lines for them found only "still" and "no longer" describing run-time behaviour; verdict: no defect in the code, the report's check was narrower than the spec's.
8. `arrangement.ts` doc comment splits a code span across lines ("{ kind:" / " * pane, view }"); verdict: minor, optional.
9. The `hpc.no_cluster` catalog key is read only as a fallback when the payload has no `hint`, which the server never omits for `unconfigured`; verdict: minor, code larger than its job.

## 4. Behaviour

1. Status bar HPC item on a hub with no cluster: shows the short `hpc.unconfigured` label ("no cluster") with the sentence in the tooltip; the brief said the sentence alone; the report states it as a judgment call; verdict: minor, for the orchestrator.
2. Apps view search text kept in the instance state key `search`, so it is saved with the layout; a small user-visible shape the report does not name; verdict: report gap, minor.
3. History undo label for kinds not listed falls back to `'{0} set back'` with the kind label (for example "file operation set back"); case 72 names three readings only; verdict: minor, for the look.
4. Reopen Closed Tab drops the whole batch after processing, including tabs skipped because the pane already holds them, as the brief asks; `gone()` compares `listing.error === t('files.refused_missing')`, a match on a display string; verdict: no defect against the brief; the string comparison breaks if the catalog line is reworded to differ from the server's refusal key.
5. An empty `.oculus/config.yml` gives a `not_a_map` finding (brief part 8 and case 79 ask for it); `{}` parses with no finding; verdict: no defect.
6. Undo of a config-key or app-setting write that created `.oculus/config.yml` removes the file only when it holds no keys, and the file can be created only where the folder was not a hub, so the undo restores that state; verdict: no defect.
7. Findings keys `findings.config.hub_file_unknown` and `hub_local` removed with the cases they served; verdict: no defect.

## Declined to judge

- The two rows that need `.oculus/config.yml` on main: config-folder 'names a group of its own and a path under the hub for every document' and integrity 'validates with no findings'. They read the hub's own settings file, which main does not hold until this step lands; settled by running them on main after landing.
- The builder's harness runs (`sh $S/run.sh ...` in the builder's scratch directory) were not rerun; they live in the builder's scratchpad. Cases marked "not verifiable" above are settled by rerunning those harnesses or by the page look.
- The rules file names no output filter (grep of it found none), so no filter rule was applied to the quoted lines.
- Whether the worktree's sparse checkout lacks `.oculus` beyond what `git status --short` shows needs `git sparse-checkout list`, which I may not run.
- The report's base unused-exports count of 246 was not reproduced: knip errored on the scratch base copy (missing `.svelte-kit/tsconfig.json`) while still listing 238; the after listing is narrower than the base listing, so the count is not load-bearing.

Reviewer usage: aae4a86c850771659, claude-opus-5-5, 76,686 tokens, 98 tool uses, 18.5 min (1,111,692 ms).

## Repair round 1, refuted

Read: spec.md whole, briefs D74.md and D74-round1.md, plan.md:791 and :792, the round's delta (`diff -u` of each of the 230 paths of `.agents/worktrees/D74-round-1/files.txt` against the worktree: 18 paths differ; plus four paths changed since base that files.txt does not list: `config/text/views/shared/hubs.yml`, `src/lib/state/sessions/source/write-files.ts`, `src/lib/state/shared/answers/answers.ts`, `src/lib/state/sources/fs-transport.ts`, read through `git diff 1e5cc69a8`), the first refuter report, and the builder's "## Repair round 1" (D74-report.md:486 on).

Verification, run once each from `tools/oculus` in the worktree, PATH with node v24.21.0:

- `npm run test:quick` (the time lines as printed):
  ```
  ok      ASCII gate (0.5 s)
  ok      prettier (1.3 s): All matched files use Prettier code style!
  ok      svelte-kit sync (2.4 s)
  ok      eslint (33.0 s)
  ok      svelte-check (37.2 s): 1791907920428 COMPLETED 499 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (89.5 s): Duration  83.95s (transform 153.04s, setup 0ms, import 191.35s, tests 119.59s, environment 1.58s)
  test:quick: 90.1 s (limit 45.0 s); every command passed
  test:quick: over the time limit
  ```
- `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/source/keys.test.ts tests/checks/diagrams tests/checks/tree --testTimeout 0 --hookTimeout 0`:
  ```
  FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > names a group of its own and a path under the hub for every document
  Error: expected any number of assertion, but got none
  Test Files  1 failed | 6 passed (7)
       Tests  1 failed | 117 passed (118)
  ```
  The verbose run marks the held row 'gives every group a chord and a glyph, and no letter a key the workbench binds' passed, and keys.test.ts 'has a reader for every catalog key' passed. The red row reads the hub's `.oculus/config.yml`, which the worktree does not hold. It is expected red here and passes only on main.
- `npx vitest run tests/checks/config/integrity.test.ts --testTimeout 0 --hookTimeout 0`:
  ```
  FAIL  |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings
  AssertionError: expected [ Array(239) ] to deeply equal []
  Test Files  1 failed (1)
       Tests  1 failed | 7 passed (8)
  ```
  This is the expected red in the worktree, for the same reason. It passes only on main.
- `sh utils/folder-check.sh` exit 0; `sh utils/size-check.sh` exit 0.
- ASCII gate (spec.md's perl form over `src tests config`; `bin` does not exist) printed nothing. `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md docs/apps.md README.md` printed nothing.
- Part 10's three greps over `src/lib/server/edit`: 0, 0, 0.
- The step's 23 changed test files apart from config-folder and keys (`npx vitest run <the 23 files> --testTimeout 0 --hookTimeout 0`): `Test Files  23 passed (23)`, `Tests  392 passed (392)`.
- Ruling 11's nine files (the round's own command): `Test Files  9 passed (9)`, `Tests  88 passed (88)`.
- The builder's harnesses exist at `/private/tmp/claude-502/.../scratchpad/d74/harness/`. I ran them with its `run.sh after <file>`, which rsyncs the worktree into that scratch folder and writes nothing into the worktree:
  - chord-apps: `Tests  1 passed (1)`, `CHORD apps keys [["apps","a1"],["app:notes","a2"],["app:clock","a3"]]`, `CHORD direct {"letter":"v","views":[]}`; on base: `AssertionError: expected undefined to be defined`.
  - refused-word: `Tests  1 passed (1)`, with REFUSED shipped / reworded / other exactly as the round section quotes them; on base: `AssertionError: expected undefined to be 'missing'`.
  - reopen: `Tests  7 passed (7)`, CASE77 `answer true`, `left on the list 0`.
  - hpc: `Tests  4 passed (4)`, `CASE1 words {"short":"no cluster","long":"the settings of this hub name no cluster (slurm.resource in .oculus/config.yml)"}`.
  - vocab: `Tests  6 passed (6)`, `case50 facets [{"theme":"core-ml","label":"Core ML main / Core ML second","count":2}]`, `case50b changed separator [... "Core ML main + Core ML second" ...]`.
  - history-other: `Tests  5 passed (5)`, `CASE46b {"rows":50,"first":"status.line"}`, `CASE46c {"rows":1,"askedMore":0}`.
  - float: `Tests  5 passed (5)`.
  - focused 6 passed, history-live 8 passed, repos 10 passed, hubfile 7 passed, watch58 1 passed, vocab-cache 1 passed, refusal 3 passed.
  - key-taken: red with `Error: expected any number of assertion, but got none`, because the harness asserts nothing. Its notes print `KEY cmd+shift+t mac workbench` and `KEY cmd+shift+y mac null`, as the report states.

### Verdicts, rulings of D74-round1.md

1. Apps chord: holds.
   - `config/layout.yml:36` is `apps: { label: "Apps", glyph: app, chord: a }`.
   - The held row is unchanged: `git diff 1e5cc69a8` of config-folder.test.ts touches only the float-group row, the `HUB_FILE` description key and the removed `*_file` keys. The held row passes.
   - `a1-a9` is in the key sheet catalog (`config/text/app.yml:26`) and at `HELP.md:111`. `docs/apps.md:11` and `DESIGN.md:334` are corrected.
   - A grep for `direct_chord|direct-chord|chord .v.|v1` over HELP, DESIGN, README, docs and config finds no sentence left that sends an app view to `v`. `HELP.md:95` and `resolve.ts:356` are true.
   - The report text has a shortfall, under Proof 1.
2. `inWorkspace`: holds. Kept, with its before and after in round item 2.
3. Reload mode `'again'`: holds. I read `changes.svelte.ts:182-236` and `shapes.ts:396-401`. With `'drop'`, a reload made while the announced `newer` read is out would leave that read's merge in place of one fresh page, which case 46b needs. The before, the after and the case are stated. My history-other rerun prints `CASE46b {"rows":50,...}`.
4. `layout.svelte.ts`: holds in substance. It is named with its reason in round item 4, not in the paragraph at D74-report.md:194 that the ruling names (Proof 2).
5. The two wrong premises: holds. Both are still in "Brief errors" (D74-report.md:241-242).
6. Watcher comment: holds. `portfolio.ts:522-528` now says what `openFile(join(dir, HUB_FILE), () => true)` at `:577` does: every hub's file is a config change. The rebuild with `isConfig` true publishes `config`, which carries `hubs` (`:612`).
7. Comment width: holds. `awk 'length>100'` prints nothing for `portfolio.ts` and `arrangement.ts`. In `Catalogue.svelte` it hits only lines 255, 323 and 336, which are markup and over-width on base too (base 243, 311, 324). `{ kind: pane, view }` is whole on `arrangement.ts:93`.
8. `DESIGN.md:615`: holds. It now says the view is at order 2 of the `float` group, reached by `w` then `3`. That matches `Workbenches.svelte:10-11` (`group: 'float', order: 2`), `config/layout.yml:27` (`chord: w`) and `:218` (`floats: [hpc, usage, workbenches]`).
9. Separator: holds. `themes.ts:91` reads `t('hubs.label_separator')`, key at `config/text/views/shared/hubs.yml:4`. The facet is shared by Venues and Data (`themeFacets` in `Venues.svelte:65` and `Data.svelte:62`), so no single view file holds "the facet's other words", and the shared hubs file is a sound home. The rerun 50b shows the catalog line drives the join.
10. `behavior.yml:325`: holds. One name for one place, and the apps watcher reads `join(primary, HUB_FILE)` (`watch/apps.ts:331-334`). `grep -rn "hub's layer" config` prints nothing. A related stale sentence is outside this ruling's file (Standards 2).
11. Frozen fallbacks: holds. `writes.svelte.ts:141` and `write-files.ts:65` use `Object.freeze` with `Readonly<...>` types, and createWrites' parameters are typed read-only.
12. `hpc.no_cluster`: holds. The key is gone (`grep -rn no_cluster config src` finds only `hpc.host_no_cluster`). `status.ts:182` and `Hpc.svelte:91` read `data.hint ?? ''`. The server always sets `hint` for `unconfigured`, since `poll.ts:136` spreads `current.missing`, which is `words.noCluster` in that state. The `?? ''` only satisfies the optional type and stands in for no catalog word.
13. `gone()`: holds, with one format defect (Standards 1).
    - `reopen.svelte.ts:90` compares `listing.refused === 'missing'`.
    - The word is carried from `answerRefusal` (`answers.ts:163`) through `readAnswer` and `listingAnswer` (`fs-transport.ts:369-377`, `:405-408`). `context.ts:290-291` wires `readFolder` to `fs.readListing(..., true)`, which fetches through `listingAnswer`, so the field reaches the check.
    - The change at `fs.svelte.ts:483` is beyond the ruling's letter, and I judge it right:
      - It is the same comparison of display words.
      - It sits in a file the step already changes (D74-report.md:194 names `fs.svelte.ts`).
      - `fs.svelte.ts`'s `listing()` and `readListing` both hold `listingAnswer`'s result, so `refused` is present wherever the base's sentence was.
      - Only the word `missing` maps to `files.refused_missing` (`answers.ts:31`), so the shipped behaviour is identical.
      - Leaving it would have kept two ways to tell one fact.
    - It reaches no app: `apps/frame/methods.ts` does not hand a `Listing` to a frame.
14. Apps search in instance state: holds. Named in round item 14.
15. The report: partial.
    - test:quick ran twice, the second after a prettier red in a file of this round, which is allowed. Both sets of time lines are quoted, "over the time limit" included. The checks command and integrity are quoted, and the two hub rows are reported as passing only on main.
    - Short: the report's host-visible changes line for the Apps group is now false and the round's chord change has no before and after (Proof 1). The round's paths are not in the files table (Proof 2).

### Verdicts, items of D74.md "What to build" (whole diff since 1e5cc69a8)

1. No-cluster HPC: holds (hpc harness CASE1 to CASE4 rerun).
2. Focused source tab kept while hidden: holds (focused harness, 6 passed: cases 5, 6, 7, 8, 9, 75).
3. A write shows in an open History: holds (history-live 8 passed, history-other 5 passed; G9 `changes.test.ts` in the 23-file run).
4. Repositories, one row each: holds (repos harness, 10 passed, CASE11 to CASE19 and CASE76 printed).
5. Apps page: holds. The chord finding of the first review is closed by ruling 1 (chord-apps rerun: `a1`, `a2`, `a3`).
6. Pinned tabs and Reopen Closed Tab: holds (reopen harness 7 passed; `arrangements.test.ts` in the 23-file run).
7. Each hub's vocabulary: holds (vocab 6 passed, vocab-cache 1 passed; the separator is now from the catalog).
8. One settings file per hub: violated in one doc comment (Standards 2). The code holds: hubfile 7 passed, watch58 passed, config, config-key, app-setting, hub-secrets and config-cache in the 23-file run.
9. One list of record files: holds (hubfile CASE60, CASE62, CASE63).
10. Refusal words from the catalog: holds. The three greps print 0, keys.test.ts passes, and the refusal harness passes 3.
11. Entry pages right after a write: holds at the store level (form-draft and page-entry in the 23-file run). The round changed none of its files, and the page is for the look.
12. Card on a lead's and a paper's page: holds as the first review found by reading. The round changed none of its files. Not re-read.
13. Float group, Apps guide, References: holds (float harness 5 passed; `DESIGN.md:615` corrected).

### Verdicts, Cases

- Part 1:
  - 1 met at the data level (CASE1 payload, words and `calls 0`); the drawing is for the look.
  - 2, 3, 4 met (CASE2, CASE3, CASE4).
- Part 2:
  - 5, 6, 7, 8, 9, 75 met (focused harness rows by title).
  - 10 not verifiable: no harness row; the look on landing settles it.
- Part 3: 38 to 44 met (history-live rows by title); 45 met (45b, 45c, and the G9 rows); 46 met (46a, 46b, 46c).
- Part 7: 47, 48, 49, 50, 51, 52 met (vocab notes); 83 met at the data level (vocab-cache), the first frame for the look.
- Part 8:
  - 53, 54, 55, 79 met (hubfile notes); 58 met (watch58).
  - 56, 57, 59, 80, 81 met by the 23-file run (G8, G77, G3, G61 files pass). I did not map rows to cases this round.
- Part 9: 60, 61, 62, 63 met (CASE60 names people at `registries/people.yml` among the unnamed; CASE62; CASE63).
- Part 10: 64, 66, 67 met (refusal harness rows by title); 65 met by `tests/server/edit/feeds.test.ts` passing, row not mapped by me; 68 met (greps 0, keys.test.ts passes).
- Part 11: 69, 70 met at the store level; 82, 71, 72 not verifiable without the look.
- Part 12: 73, 74 not verifiable without the look.
- Part 4: 11 to 19 and 76 met (repos notes).
- Part 5: 20 to 26 not verifiable without the look. The chord they depend on is met (`a1`).
- Part 6:
  - 30, 31, 32, 33, 34, 77, 78 met (reopen notes); 37 met (`arrangements.test.ts`).
  - 27, 28, 29, 35, 36 not verifiable without the look. 35's key read was confirmed by the key-taken notes (`workbench`).
- Part 13: 84, 85, 86, 87, 88 met at the data level (float notes); the drawing is for the look.

### Spec

None. The one change beyond a ruling's letter, `fs.svelte.ts:483`, is judged in scope under ruling 13 above.

### Proof

1. The host-visible changes line about app chords is stale, and the round's chord change has no before and after.
   - Place: D74-report.md:220, under "## Host- and user-visible changes".
   - Hunk: "- Views catalogue, Apps group: the Apps view is its first row, so every app view's `v` digit moves up by one (an app that was `v` `1` is `v` `2`)."
   - What is wrong: after ruling 1, no app view is reached through `v`. The direct chord holds no views (`CHORD direct {"letter":"v","views":[]}`), and an app that was `v1` on the base is now `a2`. Round item 1 lists the changed sentences, but neither it nor that line states the host-visible key change with its before (`v` then n) and after (`a` then n+1), and the stale line is not marked superseded.
   - Failure scenario: the orchestrator reads the look against this section, presses `v` then `2` on TEST expecting an app, gets nothing, and takes a correct build for a regression.
   - Names ruling 15 (partial). Fix at landing: one line.
2. Round 1's paths are named in the wrong place and are missing from the files table.
   - Place: D74-report.md:184-194 ("## Files with line counts" and its outside-paths paragraph) against round items 4, 9, 11 and 13.
   - What is wrong:
     - Ruling 4 asked for `layout.svelte.ts` in the paragraph at :194. It is named in round item 4 instead.
     - The four paths this round added to the change set (`fs-transport.ts`, `answers.ts`, `write-files.ts`, `config/text/views/shared/hubs.yml`) are named in the round items but are absent from the files table with their line counts. The table's figures were taken before the round.
   - Failure scenario: the landing path check reads the table, finds four changed paths it does not list, and must reconstruct why each was written.
   - Names ruling 4 (letter) and ruling 15. Fix at landing.

### Standards

1. A comment line added this round runs past 100 columns.
   - Place: `src/lib/state/workbench/layout/tabs/reopen.svelte.ts:81`.
   - Hunk: `+     * Whether the file a closed source tab shows is deleted or moved, by a fresh read of its folder:`
   - What is wrong: the line is 101 columns (`awk 'NR==81' ... | wc -c` prints 102 with the newline). spec.md asks that an edited comment be rewrapped at 100 columns. The round's own width check covered only `portfolio.ts`, `arrangement.ts` and `Catalogue.svelte`.
   - Failure scenario: the comment rule is broken in a line this round wrote; a reader at 100 columns sees the colon wrap.
   - Names ruling 13 (format) and the spec's comment rule. Fix at landing: rewrap the two-line paragraph.
2. A doc comment still names the old settings file.
   - Place: `src/lib/state/client/writes.svelte.ts:568-569`, the doc comment of `writeAppSetting`.
   - Hunk: " * Set one setting an app declares: the endpoint writes the value under the setting's whole key / * in `app_settings` of the primary hub's config/behavior.yml, and refuses, ..."
   - What is wrong: after part 8 the write goes into the primary hub's `.oculus/config.yml` (`src/lib/server/edit/writes/config/app-setting.ts:1-2`; `docs/apps.md:237`). "The primary hub's config/behavior.yml" was the old `.oculus/config/behavior.yml`, a folder oculus no longer reads. The sentence is unchanged from base (`git show 1e5cc69a8:.../writes.svelte.ts` line 526), so the step's change made it false. The file is changed by the step and by this round, and the grep of `app_settings` this review was asked to run shows it.
   - Failure scenario: a reader debugging an app setting looks in `<hub>/.oculus/config/behavior.yml` and concludes the write did not land.
   - Names item 8 (violated). Fix at landing: "in `app_settings` of the primary hub's `.oculus/config.yml`".

### Behaviour

None. One observation, not a finding against the step: `src/lib/state/system/config/write.ts:42` compares `answer.error === t('app.write_timed_out')`. It is unchanged since base, apart from the step's two other lines in that file. The words are the page's own timeout sentence, built by the same `t` call on both sides, and are not a server refusal word, so ruling 13's case does not apply to it.

### Declined to judge

- What only a page shows: the drawing half of case 1, cases 10, 20 to 29, 35, 36, 71's first frame, 72, 73, 74, 82 and 83's frame. No page, app or browser was run, so these are settled by the look on landing.
- Items 11 and 12 beyond the store-level runs: the round changed none of their files, and I did not re-read their components.
- Whether each guarded row maps to its case: the 23-file run passes as a whole; I did not read each row against its case this round.
- `sh utils/unused-exports.sh`: not in this review's command list, and not run. `answerRefusal` has an importer outside its file (`fs-transport.ts:20`, read by grep).
- The `D74-sonnet-notes/` folder in the worktree's ledger copy is the orchestrator's saved copy of the earlier builder's notes (`orchestrator-state.md:32`). It is not the builder's write and was not judged.
- The worktree copy of D74-report.md carries the U+2026 <horizontal ellipsis> in lines from the first round (13, 81, 96, 169, 427-439). The main checkout's copy has them written as `<horizontal ellipsis>`. Not the round's delta.
- The two hub rows (config-folder 'names a group of its own ...' and integrity 'validates with no findings') can only be judged on main once `.oculus/config.yml` is written.

Usage: ace5c1e4521c02fb0, claude-opus-5-5, 261,447 tokens, 90 tool uses, 19.7 min (1,183,921 ms).

## Closed

The findings of the run over repair round 1, each fixed at landing (the last round's findings are never sent back):

- Proof 1 (the Apps chord line of the report): `agents/reviews/D74-report.md`, "Host- and user-visible changes", now states the chord `a`, the Apps view at `a` `1`, the app views from `a` `2`, and the before (`v` and the digit) and after.
- Proof 2 (the round's paths): the report's "Files with line counts" names the four paths repair round 1 added with their line counts, and its outside-paths paragraph names `src/lib/state/workbench/layout.svelte.ts` with its reason.
- Standards 1: `src/lib/state/workbench/layout/tabs/reopen.svelte.ts:81-82` rewrapped at 100 columns (`awk 'length>100'` prints nothing).
- Standards 2 (item 8): `src/lib/state/client/writes.svelte.ts:568` now names "the primary hub's .oculus/config.yml"; `grep -rn "hub's config/behavior.yml\|\.oculus/config/" src` prints nothing.

The first review's findings were closed by repair round 1, as the run over it records.
