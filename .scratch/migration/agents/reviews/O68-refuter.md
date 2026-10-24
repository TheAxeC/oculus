# Step O68 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O68, base 048821f9)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

The rules file (`agents/spec.md`) names no output filter; each run below is shown through `grep` of its summary lines.

## Verification (rerun by the reviewer)

```
$ cd .agents/worktrees/migration-O68 && (npm run diagrams && npm run test:quick)   # Verify 1
test:quick: 65 changed file(s), from git since HEAD
test:quick: 295 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.5 s)
ok      svelte-check (53.1 s): 1792867204483 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (59.5 s)
FAILED  vitest checks (121.6 s)
 FAIL  |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment
+ src/desktop/app.ts:161: // Every window of the app loads its pages on this session, so the mark rides every request
 Test Files  1 failed | 9 passed (10)
      Tests  1 failed | 204 passed | 9 skipped (214)
ok      vitest (168.9 s): Duration  158.84s (...)
ok      vitest slow (227.3 s): Duration  217.52s (...)
test:quick: 229.9 s; failed: vitest checks
exit 1
(git diff 048821f9 --stat before and after the run: "64 files changed, 2006 insertions(+), 2900 deletions(-)" both times; the 65th changed file is the untracked report)

$ cd .agents/worktrees/O68-base && sed -n 161p src/desktop/app.ts; diff src/desktop/app.ts ../migration-O68/src/desktop/app.ts && echo same; npx vitest run tests/checks/source/history.test.ts
    // Every window of the app loads its pages on this session, so the mark rides every request
same
 FAIL  |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment
+ src/desktop/app.ts:161: // Every window of the app loads its pages on this session, so the mark rides every request
 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)

$ git diff 048821f9 --name-only --diff-filter=AM | grep -v 'local.yml$' | xargs env LC_ALL=C perl -ne '<the rules file's ASCII gate>'   # Verify 2, 61 files
(nothing printed)
exit 0

$ grep -rnE "CARD_CHIPS|setHostStatus|...|'host'|case 'host'" src config docs tests --exclude=local.yml   # Verify 3
src/hooks.server.ts:144, src/lib/shell/status/StatusBar.svelte:214, status-items.ts:40,90, apps/read/manifest.ts:127,511, apps/serve/oculus.js:239, runs/recover/routes.ts:250,361, recover-words.ts:77 ('host' for other things)
src/lib/state/workbench/layout/index.ts:78, layout.svelte.ts:79,581, layout/open/float/pages.ts:386, layout/tabs/instances.ts:21,296,298 (the workbench's writeHost)
tests/ui/controls/editor/lsp-transport.test.ts:196-200, tests/shell/panes/strip/app-editor-close.test.ts:59, tests/server/machine/hpc/actions.test.ts:14,28, tests/server/machine/apps/oculus-frame.test.ts:31, tests/state/workbench/options-pages.test.ts:91, tests/routes/machine/recover.test.ts:112
tests/state/forms/record-values.test.ts:31,32,164,166,170,172 (eligibility sample field)
tests/data/sources/career.test.ts:36,38,40 (old sections in the UNDRAWN fixture)
(the same set the report explains; no docs/diagrams hit after the regeneration)

$ sh utils/unused-exports.sh > <scratch>; diff ../O68-base/unused-exports.txt <scratch>   # Verify 4
49c49
< src/lib/server/edit/writes.ts: ..., writeFollowup, writeHost, writeSubtask, ... hostWrite ...
---
> src/lib/server/edit/writes.ts: ..., writeFollowup, writeSubtask, ...
(only writeHost and hostWrite gone; no line added)

$ npx vitest run tests/data/sources/career.test.ts tests/server/edit/writes.test.ts tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts tests/routes/hubs/hub-writes.test.ts tests/state/client/held-unsaved.test.ts tests/state/forms/page-entry.test.ts tests/checks/config/config-folder.test.ts   # Verify 5, after
 Test Files  8 passed (8)
      Tests  251 passed | 2 skipped (253)
(the builder's base run, $S/base-tests.txt: "Test Files  8 passed (8)", "Tests  248 passed | 2 skipped (250)": the old versions of these files, not the new tests on the unchanged tree)

$ cd $W && npx vitest run --config $S/vitest.cases.config.mts --root $W $S/after.cases.test.ts   # the report's after-change case run
 Test Files  1 passed (1)
      Tests  5 passed (5)
case 1: lane=backburner marks=["in-prep","journal"]
case 1 no form: lane=backburner marks=["in-prep"]
case 2: lane=push marks=["submit-ready"]
case 3: lane=review marks=["journal","results-in","admin-prep","ai-tells"]
case 4: lane=blocked marks=["exploring","parked"]
case 5: lane=idea marks=[]
case 6a: lane=run marks=["poster"]
case 6b: lane=run marks=["results-in"]
case 7: goal="Assistant professor" milestone="FWO Senior" milestoneDate="2026-11-17" daysLeft="in 24d" folded="Career strategy | Next: FWO Senior (2026-11-17)"
case 8: ["in 1d","today","1d ago","3d ago"]
case 9a: goal=undefined milestone="FWO Senior" milestoneDate=undefined daysLeft="" folded="Next: FWO Senior"
case 9b: goal=undefined milestone="FWO Senior" milestoneDate=undefined daysLeft="" folded="Next: FWO Senior"
case 9c: goal=undefined milestone=undefined milestoneDate=undefined daysLeft="" folded=""
case 9d: goal=undefined milestone=undefined milestoneDate=undefined daysLeft="" folded=""
case 9e: goal=undefined milestone=undefined milestoneDate=undefined daysLeft="" folded=""
case 10 model keys: ["title","situation","order","sections"] sections=["title","hosts","host_criteria","not_hosts","eligibility","dropped"]
case 10 findings on career.yml schema: [["schema.hosts","the field hosts takes its keys from vocab.career_host_status, which is no registry, projects or vocab list"]]
case 10 snapshot career keys: ["title","goal","milestone","milestoneDate","situation","order","sections","schema"]
case 11: {"roles":[{"key":"lead",...,"lines":[in-review 0, in-flight 1, publications 1, other-outputs 0]},{"key":"supervisor",...[0,0,0,1]},{"key":"collaborator",...[1,0,0,0]}],"funding":1}
case 12 self unset: null
case 12 nothing to count: null
case 13: {"roles":[{"key":"lead",...,"lines":[in-review 1, in-flight 0, publications 0, other-outputs 0]}],"funding":0}
case 14: {... same three roles as case 11 ...,"funding":0}
case 15 findings naming career_: [["career_host_status","key career_host_status is not one the hub's settings file takes; it is not applied"]]
case 15 merged config holds career_host_status: false
case 16 page: status=400 body={"error":"the body is not a write this route knows"} unchanged=true
case 16 app declaring [host]: status=403 body={"error":"kind"} unchanged=true
case 16 app declaring [lead-add]: status=403 body={"error":"kind"} unchanged=true
case 16 manifest findings for writes: [host]: [["apps[notes]","writes names host, which is no write an app can ask for, so the folder is not an app"]]
case 17 undo: status=404 body={"error":"gone"} thrown="" unchanged=true
(identical to the report's quoted output; the count lines are abbreviated here, the printed JSON matches the report byte for byte)

$ cd $S/base-tree && npx vitest run --config $S/vitest.base.config.mts --root $S/base-tree $S/base10.cases.base.ts   # case 10 on the base replica
 Test Files  1 passed (1)
      Tests  1 passed (1)
(new output holds "which is not a key of vocab.career_host_status"; no bad_from text)
$ diff -rq --exclude=node_modules --exclude=.svelte-kit .agents/worktrees/O68-base/src $S/base-tree/src && echo base-tree-src-equal
base-tree-src-equal

$ cd $W && npx vitest run --config $S/vitest.cases.config.mts --root $W $S/hubdraft.cases.test.ts   # the report's hub draft run
 Test Files  1 passed (1)
      Tests  1 passed (1)
model: {"title":"Career strategy","goal":"Assistant professor / tenure-track (NL UD or Flemish ZAP)","milestone":"FWO Senior","milestoneDate":"2026-11-17","situation":[PhD, Past, Now, Also],...}
schema fields: ["title:text","goal:text","milestone:text","milestone_date:date","situation:records","order_note:textarea","order:records"]
findings on career.yml: []
folded: "Career strategy | Next: FWO Senior (2026-11-17)" daysLeft on 2026-10-24: "in 24d"

$ cd ~/workspace/research-hub/.oculus/data/academic && wc -l career.yml; grep -n "^[a-z_]*:" career.yml; grep -c "^ *# *- { *name:" career.yml   # hub read only
98 career.yml
4:schema: 51:title: 52:milestone: 55:situation: 63:order: 69:hosts: 85:host_criteria: 93:eligibility:
14
(no top-level not_hosts, dropped or order_note key: the report's statement holds)
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `laneMarks` (`src/lib/state/boards/focus.ts:256-265`) gives the `projectStatusWords` words once each through a `Set`, drops the stage when the lane's `stages` is that one stage, and drops each lane chip; `Lanes.svelte:229` hands `marks={laneMarks(project, one)}`; `LaneCard.svelte:102` draws `{#each marks as chip (chip)}`; `CARD_CHIPS` and the slice are gone (Verify 3); the after-run cases 1 to 6 reproduce.
- 2: holds. `normalise-parts/career.ts` reads title, goal, milestone, milestone date, situation, order, order note, sections and schema only; `config` parameter and the caller's argument gone (`normalise.ts:642`), comment at `:576` rewritten and true (`merged` is read for `tiers` at `:591` and `self` at `:602`); `Host` and the five model fields gone; `status-rows.ts` deleted.
- 3: violated, Spec 1 (the dictated comment wording). The counting itself holds: `trackRecord` (`state/boards/career.ts`) matches cases 11 to 14 on rerun; `entryPeople` and `isSelfByKey` exported; `obtained` on `awarded` and `granted` and accepted by the `statuses` shape.
- 4: holds. `daysLeft`, `foldedLine`, the panel's sections and their order, `CareerHosts.svelte` deleted, the head comment rewritten, the eleven keys removed and the new keys added (`focus.yml`).
- 5: violated, Spec 3 (the per-key grep result the item asks the report to name is absent) and Standards 1 (a comment still naming the removed host write). The removal itself holds: Verify 3 prints no host-write name, `OPEN_WRITES`, `matchedKind`, the undo kind, the client store and type, `write-files.ts`, `why.ts` and the catalog texts are cleaned, and `grep -rnE "host_no_field|host_no_status|no_hosts|\bno_host\b|..." src tests config` prints no reader of a removed key.
- 6: holds, with Spec 2 (a test broadened beyond what the item asks). Demo config and career file, `docs/apps.md`, `docs/templates.md`, `docs/data-map.md`, `docs/HELP.md`, both `sources.yml` comments, and the listed tests follow the brief.

Cases of the brief's "Cases":

- 1: met, after-run `case 1` and `case 1 no form`.
- 2: met, after-run `case 2`.
- 3: met for the marks (after-run `case 3`); the wrap rests on reading `.card-h { flex-wrap: wrap }` (`LaneCard.svelte:165`) and `.mark { flex: 0 0 auto }` (`:188-191`), drawn at the look on landing.
- 4: met, after-run `case 4` (`exploring`, `parked`).
- 5: met, after-run `case 5` (`[]`).
- 6: met, after-run `case 6a` and `6b`; the `Set` in `laneMarks` gives the keyed loop unique keys.
- 7: met, after-run `case 7`; the panel draws goal, milestone, `{career.milestoneDate}` and `<Tag label={left} />` (`CareerPanel.svelte:136-152`) by reading.
- 8: met, after-run `case 8`.
- 9: met, after-run `case 9a`-`9e` and the G32 rows 'reads $name'.
- 10: met, after-run `case 10` (model keys, `bad_from` text for a top-level `from: vocab.career_host_status`); the hub's own nested form (a `records` sub-field) was not run, see Declined.
- 11: met, after-run `case 11`.
- 12: met, after-run `case 12` (both null).
- 13: met, after-run `case 13`.
- 14: met, after-run `case 14` (funding 0) and `{#if record.funding > 0}` (`CareerPanel.svelte`).
- 15: met, after-run `case 15`.
- 16: met, after-run `case 16` (page 400, app 403, `write_unknown` finding, file unchanged).
- 17: met, after-run `case 17` (404 `gone`, no throw, file unchanged).

## 1. Spec

- 1. `config/catalogs/vocab.yml:109` and `src/lib/data/shapes/catalog-files/vocab.ts:172-174`: "# - `obtained`: the status is funding obtained, which the career banner's track record counts; compared trimmed and in lower case (`wordFlag`)." and "The status is funding obtained, which the career banner's track record counts; compared trimmed and in lower case."; what is wrong: the brief's item 3 dictates the words "the status is funding obtained, which the career card's track record counts; compared trimmed and in lower case (`wordFlag`)"; the builder wrote "career banner's" in both places and the report's judgment calls do not list the departure; failure scenario: the orchestrator, checking dictated text against the brief at landing, finds an unreported substitution in a vocabulary comment and a shape help sentence; the substitution matches the tree's own name for the surface ("career banner"), so the fix is either the brief's words or a recorded acceptance of the builder's; verdict: item 3 violated.
- 2. `tests/checks/config/config-folder.test.ts:427-437`: "const icons = ['stages', 'forms', 'chips', 'statuses'].flatMap((list) => ... expect(icons.length).toBeGreaterThan(0);"; what is wrong: the brief asks this test to "follow the model and the vocabulary"; the builder widened it to check the glyph names of `stages`, `forms` and `chips`, which it never checked, in a test that no entry of `agents/guarded.md` names (`grep -n "uses glyph names for every configured icon" agents/guarded.md` prints nothing), against the rules file's "A builder writes no other test"; the cause is real (with the host statuses gone, oculus's `statuses:` rows carry no `icon`, so the test reduced to its statuses part would assert over an empty list), and it is listed as judgment call 7, but the choice between deleting the now-empty check and extending it is the orchestrator's, since the rules file says "A step deletes the tests ... its change makes obsolete"; failure scenario: a later step that changes a stage glyph meets a red line from a test no guarded entry owns; verdict: item 6 holds otherwise.
- 3. Report, sections "DONE / NOT DONE" and "Verify 3": "| 5 write kind `host` removed everywhere, ... | DONE | cases 15-17; grep 3; ..."; what is wrong: item 5 says "A text key or refusal still read by another write stays: the builder checks each with `grep` before removing it and names the result in the report"; the report names no grep of `server.edit.host_no_field`, `host_no_status`, `no_host`, `no_hosts`, `server.write_route.no_host` or the `REFUSALS` keys; Verify 3's pattern covers only `not_a_status`; my own grep shows none of them is still read, so the code is right and the report is short; failure scenario: the orchestrator cannot see from the report that each removed key was checked for another reader; verdict: item 5 violated (report part only).
- 4. Report, section "Doc text", G8: "`72:describe 'a write that makes a record' (with its row ...)` becomes `describe 'a write that makes a record', every row`"; what is wrong: the removed row was in describe 'a write from an app' (`git show 048821f9:tests/routes/hubs/hub-writes.test.ts | grep -n "^describe"` gives `576:describe('a write that makes a record'` and `670:describe('a write from an app'`, the row at `:729`), so the current guarded line mislocates it, and the proposed replacement adds "every row", which widens the guard to every row of that describe; failure scenario: the orchestrator copies the proposal into `guarded.md` and the G8 line now guards rows it did not name before, without a ruling. Not a verdict on an item (the ledger is the orchestrator's).

## 2. Proof

- 1. Report, "Verify 5": "On the unchanged tree (`$S/base-tests.txt`): `Test Files  8 passed (8)`, `Tests  248 passed | 2 skipped (250)`"; what is wrong: the rules file ("What every package obeys") says "The report quotes, for each test the step adds or changes, its failing line on the unchanged tree", and the brief's Verify 5 asks for each new or changed test run on the unchanged tree; the quoted base run is the old versions of the eight files (`$S/base-tests.txt` was produced in the worktree before the edit), so no failing line is quoted for the added rows ('reads $name', six rows, and 'reads none of the sections the banner does not draw into the model' in `tests/data/sources/career.test.ts`) or for the changed rows ('reads the title, the milestone and the situation strip', 'parses it as the map it is, with no key renamed', the three rewritten rows of describe 'writing career sections', the renamed rows of `changes.test.ts` and `undo.test.ts`); for the rows of preserved behaviour (writeCareer, the subtask undo, the session record) the passing run after is quoted and reproduces (251 passed); failure scenario: a new parser row that would also pass on the unchanged tree is not told apart from one that pins the change; by reading, the new career rows read `goal` and `milestoneDate`, which the base model lacks, so they would fail there, but no run shows it.
- 2. Report, "test:quick count": "One earlier start of `npm run diagrams && npm run test:quick` was stopped before its vitest tiers finished"; what is wrong: the rules file ("Token discipline") allows the list once after the last change and calls a run beyond that a finding; failure scenario: none to the code; cost only.

## 3. Standards

- 1. `src/lib/server/edit/writes/hubs.ts:183-186`: "The target for a write that names no record and needs a hub (a new project, a new entry, a feed entry, a host status): the primary's, else, for the page, the first hub ..."; what is wrong: the step removes the host-status write, so the comment names a write that no longer exists; the rules file says "A sentence in a document or a head comment that the change makes false is a defect of the change" and asks for every doc comment describing the changed behaviour to be listed as "still true" or "rewritten"; `homeOf` is now reached by the career write (`writes.ts`, `careerWrite` branch), which the comment should name instead; failure scenario: a reader of `homeOf` looks for a host-status write that the tree does not have; verdict: item 5 violated. The file is outside the brief's write list; the brief allows "a further file the removal reaches" with a reason.
- 2. `src/lib/server/edit/writes.ts:23` (102 columns) and `src/lib/views/boards/focus/lanes/LaneCard.svelte:7` (101 columns): "// file, writes/subtasks.ts for a subtask line, a follow-up note and the career file, writes/bodies.ts" and "    // the hub's chip after its name, as the Command center's rows and the Projects board's cards do."; what is wrong: both comments were edited by the step and the rules file says "A comment edited by the step is rewrapped as a whole paragraph at 100 columns" (`awk 'length($0) > 100'` over the files prints these two; at the base neither file has such a line); failure scenario: none at run time; the next edit inherits an over-long line.
- 3. Report, "Verify 1": "`git log -L161,161:src/desktop/app.ts` names `a7d82144 ...`"; and `git status --short` in the worktree: "D  src/lib/server/edit/entry-edit/host-status.ts", "D  src/lib/state/shared/words/status-rows.ts", "D  src/lib/views/boards/CareerHosts.svelte" (path as printed: `src/lib/views/boards/focus/career/CareerHosts.svelte`); what is wrong: the rules file ("Where you work") limits a builder to `git status`, `git diff` and `git show` and names `log` as forbidden; the report shows a `git log` was run; the three deletions are staged in the index (status column `D` in the first position), which a plain `rm` or `mv` does not produce, so an index-changing git command ran in the worktree; who ran it is not verified; failure scenario: the orchestrator's landing reads the worktree's index as the builder left it; a staged deletion does not change the content landed but the rule exists so that only the orchestrator moves git state.
- 4. Report as a whole: what is wrong: the rules file asks the report to quote the grep for each new helper's name and key call before writing it ("before writing a helper, type or schema, grep `src` and `tests` ... quoting that grep in the report") and to list every head comment, doc comment and doc paragraph describing changed behaviour as "still true" or "rewritten"; the report has neither (Verify 6 is a summary sentence); Standards 1 is the sentence such a list would have caught; failure scenario: the orchestrator cannot tell which comments were re-read.
- 5. `docs/HELP.md:287`: "and a line of the funding entries you lead whose status is obtained (awarded, granted)"; what is wrong: the panel draws the funding line only when the count is above 0 (`{#if record.funding > 0}`), and the sentence reads as an always-present line; failure scenario: a reader with no obtained funding looks for a "funding obtained: 0" line and does not find it.

## 4. Behaviour

none. Each visible change (lane marks, banner sections and folded line, Awaiting box, app write kind `host`, the three hub keys, History's old `host` records and their undo) is stated with its before and after in the report's "Visible changes" section, and the days-left tag and the track record's place are listed as judgment calls 4 and 5.

## Declined to judge

- The builder's first-run program `first.cases.test.ts` was not rerun: it imports from the worktree's paths, whose code the step changed (`summaryOf` is gone), so a rerun "as quoted" now fails to import; settling it needs a copy pointed at `$S/base-tree`, which is a file write. The base-side claims it rests on were checked otherwise: `git show 048821f9:src/lib/views/boards/focus/lanes/LaneCard.svelte` shows `CARD_CHIPS = 2` and the slice, and `base10.cases.base.ts` reproduced case 10's base result.
- The new and changed tests were not run on the unchanged tree: that needs the new test files placed in the base copy, which I may not write (Proof 1).
- Whether a schema row whose `from: vocab.career_host_status` sits on a `records` sub-field (the hub's own shape) also gives `bad_from`: not run; a run of the published snapshot over a scratch hub holding that nested row settles it. The hub rewrite removes the row.
- Who staged the three deletions in the worktree's index: the builder's transcript settles it.
- The drawn wrap of case 3, the days-left tag and the track record's layout: a page is needed; the look on the TEST page at landing settles them.
- `tests/checks/source/history.test.ts` red on `src/desktop/app.ts:161`: confirmed identical on the base copy (run above), so not counted against the step.

Reviewer usage: <the session fills this from the completion notice: agent id, served model, tokens, tool uses, minutes>.

Usage: a7eeb12398f1acb96, claude-opus-5-5, 294870 tokens, 70 tool uses, 15 min 22 s
