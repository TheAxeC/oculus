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
