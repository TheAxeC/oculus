# Step O191 refuter report (on .agents/worktrees/migration-O191, base 35d2f571e)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All commands ran from the worktree root. Programs ran with TMPDIR set to the reviewer's scratch folder `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O191-refute/tmp`.

```
# npm run diagrams: not run in its writing form, so nothing in the worktree is written. The script's own
# comparison, staleFiles of utils/diagrams/diagrams.mjs, which compares every committed file of docs/diagrams/
# with what the source gives now:
node --input-type=module -e "const m = await import('<worktree>/utils/diagrams/diagrams.mjs'); const s = await m.staleFiles('<worktree>'); console.log('stale:', JSON.stringify(s));"
stale: []
exit 0

taskpolicy -b nice -n 19 npx vitest run tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts tests/checks/source/keys.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts --maxWorkers 2
     <multiplication sign> ends by the hundredth column everywhere under src, tests and utils 12841ms
     <multiplication sign> names no package id, date or session in any comment 40275ms
     <multiplication sign> has a reader for every catalog key 15848ms
 FAIL  |unit| tests/checks/source/comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and utils
Error: Test timed out in 5000ms.
 FAIL  |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment
Error: Test timed out in 5000ms.
 FAIL  |unit| tests/checks/source/keys.test.ts > text keys > has a reader for every catalog key
Error: Test timed out in 5000ms.
 Test Files  3 failed | 2 passed (5)
      Tests  3 failed | 117 passed (120)

taskpolicy -b nice -n 19 npx vitest run tests/checks/source/keys.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts --maxWorkers 2 --testTimeout 0 --hookTimeout 0
 Test Files  3 passed (3)
      Tests  19 passed (19)

npx prettier --check <the five changed files>
Checking formatting...
All matched files use Prettier code style!
prettier exit 0

taskpolicy -b nice -n 19 npx eslint <the five changed files>
/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O191/config/text/views/boards/projects.yml
  0:0  warning  File ignored because no matching configuration was supplied
<heavy multiplication x> 1 problem (0 errors, 1 warning)
eslint exit 0

taskpolicy -b nice -n 19 npm run check
1795628754701 COMPLETED 4687 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

printf '%s\0' <the five changed files> | xargs -0 env LC_ALL=C perl -ne 'print "$ARGV:$.\n" if /[^\x20-\x7E\n]/; close ARGV if eof'; echo "charset exit $?"
charset exit 0

sh utils/unused-exports.sh > <scratch>/unused-now.txt; wc -l; diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O191-unused-base.txt <scratch>/unused-now.txt
unused exit 0
     336
diff exit 0

wc -l <the five changed files>
     263 src/lib/state/boards/board/state.ts
     366 src/lib/state/boards/board/facets.ts
     444 src/lib/state/boards/board/filter-menu.ts
     728 src/lib/state/boards/board/presets.ts
     126 config/text/views/boards/projects.yml

git status --short
 M config/text/views/boards/projects.yml
 M src/lib/state/boards/board/facets.ts
 M src/lib/state/boards/board/filter-menu.ts
 M src/lib/state/boards/board/presets.ts
 M src/lib/state/boards/board/state.ts
?? .scratch/migration/agents/reviews/O191-report.md

# Cases 1 to 17, after the change. The report's case program (o191.case.ts) and its config were copied from
# the report verbatim. Only the import paths were changed, to absolute paths into the worktree, and the config
# was given `dir:` pointing at the scratch folder in place of the worktree's .agents/scratch:
taskpolicy -b nice -n 19 npx vitest run --config <scratch>/after.config.mts --root . 2>&1 | grep -v PLUGIN | grep -E "^case|Error|error|FAIL|passed|failed|No test"
# 46 lines, ending
case 17 shown under No form: []
 Test Files  1 passed (1)
      Tests  1 passed (1)
diff <the report's "The cases after the change" block> <this output>
identical-after

# Cases 1 to 17, first run on the unchanged tree. Mirror in the scratch folder: the worktree's src, tests and
# config (local.yml excluded), the five changed paths replaced by `git show 35d2f571e:<path>`. Each of the five
# compared with cmp against .agents/worktrees/O191-base: same. diff -rq of the mirror's src against the base
# copy's src: no output. node_modules is a symlink to the worktree's. The same program, imports pointed at the mirror:
taskpolicy -b nice -n 19 npx vitest run --config <scratch>/base.config.mts --root . ...
diff <the report's first-run block> <this output>
identical-before
 Test Files  1 passed (1)
      Tests  1 passed (1)

# History-word grep the report quotes, in the reviewer's git form:
git diff 35d2f571e -U0 -- src config | grep "^+" | grep -v "^+++" | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|\bO[0-9]+|\bQ[0-9]+|\bD[0-9]+|20[0-9][0-9]-"
67:+ * pillar, a funding scheme, a dataset or a resource no registry holds is dropped before the board
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `state.ts:47` `orNone`. Form at `state.ts:52` (`[item.project.form ?? NONE]`), Domain at `:56`, Venue at `:58`, Waiting at `:60`, Pillar at `:66`, Datasets at `:70`, Situation at `:72`. Slice, Role, Hub, Tier, Reproduced and Sessions are unchanged in the diff. Funding and Compute now go through `orNone`, which gives the same values as the base's `length === 0 ? [NONE] : ids(...)` (case 11 is identical before and after). I checked each sentence of the head comment (`state.ts:29-44`) against the code: `links.ts` `relations` and `linked` drop unknown venue, funding, dataset, pillar, domain and resource ids (`item.resourceIds ... filter((id) => known.resources.has(id))`, `delete item.venueId`), and `items.ts:174-180` drops a resource no registry holds. The Role, Hub, Tier, Reproduced and Sessions clauses match `items.ts:170,181-182` and `state.ts:54,62,64,76,80`.
- 2: holds. `facets.ts:151-155` `listedThenNone`, for status and form only. The general branch is unchanged. Cases 1, 6 and 7.
- 3: holds. `noneWords` (`filter-menu.ts:128-141`) uses literal `t('board.no_...')` keys. `projects.yml:64-72` holds the seven ruled words in alphabetical key order. `keys.test.ts` passed in the run with no time limit.
- 4: holds. `filter-menu.ts:209`: `if (values.every((one) => one.value === NONE) && !picked.includes(NONE)) return [];`. The head comment (`:186-190`) states the rule, with one inexact reason clause (Standards 1). Case 9 covers Form and Year. Cases 13 and 16 cover the collection bar and the Map through their unchanged files.
- 5: holds. `filter-menu.ts:165-166,175`: `most` is taken over the named values, and the NONE choice gets no `share`. Case 10. `PickMenu.svelte:130-131` draws a bar only when `share !== undefined`.
- 6: holds. This needs no code of its own: `applyFilters` and `countValues` are unchanged and read the new values (cases 1, 2, 8, 14, 15).
- 7: holds. `presets.ts:44-47` names the eleven board facets. On the base tree the hunk replaces line 44 alone, which is the brief's range 44-44, and the report's file table states that the one line became four.
- 8: holds. My greps found no other sentence in `src`, `tests`, `config` (local.yml excluded), `docs` or `README.md` that the diff makes false: "no value", "draws no group", "under no", the facet names, the new words, and the head comments of `map-bar.ts`, `collection/bar.ts`, `graph.ts` `filterGraph`, `Map.svelte`, `BoardBar.svelte`, `FilterBar.svelte` and `hub-facets.test.ts`, plus `docs/HELP.md:105,114-125,372,472`. The one new inexact sentence is Standards 1.

Cases of the brief's "Cases":

- 1: met. Rerun: `[["blocked (external)",1,false],["No situation",1,false]]`, and the pick keeps `["none-chip"]`.
- 2: met. `["blocked","none-chip"]`.
- 3: met. `d-none` and `d-unknown` carry `["__none__"]`. The list is `[["ecg",1,false],["No domain",2,false]]`.
- 4: met. `[["Amir",1,false],["Not waiting",1,false]]`, and the pick keeps `["w-none"]`.
- 5: met. Venue, Pillar and Datasets each list the named value, then `No venue` / `No pillar` / `No dataset` at 2. The unregistered key gives `__none__`.
- 6: met. `[["journal article",1,false],["No form",1,false]]`.
- 7: met. No `No situation` row.
- 8: met. Domain counted over the projects the blocked pick leaves: `[["ecg",1,false],["No domain",1,true]]`. Shown: `["a-none-blocked"]`.
- 9: met. Groups drawn: `["role","tier","reproduced","sessions"]`. Form shows no group, and with the pick `[["No form",2,true]]`. Year shows no group, and with the pick `[["No year",2,true]]`.
- 10: met. `[["BSPC",2,false,1],["CBM",1,false,0.5],["No venue",3,false]]`.
- 11: met. Identical before and after: `No year`, `No funding`, `unset`, `no code`.
- 12: met. Hub, Tier and Role values are `[]`, and no Tier facet is offered.
- 13: met. `project_form` ends with `["No form",1,false]` and `project_pillar` ends with `["No pillar",1,false]`.
- 14: met. `[["ecg",2,false],["No domain",0,true]]`, and shown is `[]`.
- 15: met. Shown is `[]`, and `["Not waiting",0,true]`.
- 16: met. The bar keeps `["bare"]`. The graph draws `[["project","bare"]]` (no pillar node), and with Connected only it draws `[]`.
- 17: met. `odd` carries `["zzz-chip"]` and `["zzz-form"]`: it is not listed and not under the value for none.
- 18: met. After the change, `hub-facets.test.ts` is one of the "2 passed" files of the brief's vitest command. The run on the unchanged tree is the builder's quoted run (`Tests  3 passed (3)`); I did not rerun it (Declined to judge).

## 1. Spec

- `.scratch/migration/agents/reviews/O191-report.md`, section "Limitations, sharp edges, scripts": "a `sed -i` that changed one line of a scratch smoke program, `.agents/scratch/smoke.case.ts` (removed, never part of the diff), and `.agents/scratch/wrap.mjs`, a Node program that printed a greedy 100-column wrap of a comment's words, which the comment edits were then made from with the Edit tool". Section "The cases after the change": "`diff .agents/scratch/after-run.txt .agents/scratch/final-run.txt` printed `identical`".
  - What is wrong: the builder wrote and ran programs the brief does not build, and no line of `plan.md`'s Rulings approves them:
    - `wrap.mjs`, a helper that laid out the edited comment paragraphs.
    - A `sed -i` edit to a second program, `smoke.case.ts`. The report does not quote its source, which the rules file asks for a case-run program ("What every package obeys", the case-run program rule).
    - Shell redirects that wrote `after-run.txt` and `final-run.txt`.
  - The rules break: the brief says "No script is written for this step, by the builder or by the session that runs it inline, other than a script the step builds under What to build". The rules file says that `sed -i` or a shell redirect that changes a file is a script and needs the brief's approval.
  - My read of the hunks `wrap.mjs` shaped: every added comment line is a greedy wrap at or under 100 columns (lengths measured with `awk '{print length($0)}'` over the added lines), and `comment-width.test.ts` passes. Nothing `smoke.case.ts` or the run files produced reaches the diff or a claim of the report.
  - Failure scenario: the orchestrator lands the step as one built under the no-script rule, and the ledger records no breach. And `smoke.case.ts` cannot be rerun, because its source is not in the report.
  - Disposition: the "Unapproved builder scripts" ruling in `plan.md` Rulings (closed in automode, the breach recorded in the booking, the builder's list of the commands and their files read by the orchestrator). Not an open item.
  - Verdict: none.

## 2. Proof

none

## 3. Standards

- `src/lib/state/boards/board/filter-menu.ts:188-189`: "neither does a facet whose only value, offered or picked, is the value for none (`NONE`), since its one choice would keep every project of the board".
  - What is wrong: the reason clause is false when a project carries only chip or form words that no vocabulary holds. `orderValues` lists Situation and Form only through `chipKeys()` and `formOrder()` (`facets.ts:154-155`). On a board where one project has `chips: [<a word no hub's chips list>]` and the rest have none, the only offered Situation value is `NONE`, so the group is not drawn. Yet a pick of No situation would drop that project, so it would not keep every project.
  - The standard: the rules file, "What every package obeys": a sentence in a head comment that the change makes false is a defect of the change.
  - Failure scenario: a maintainer reads the comment as a promise that hiding such a group never hides a pick that narrows the board, and builds on that. The words are reachable in a hub with a mistyped chip (case 17's state).
  - Fix: a one-clause rewording at landing (for example, "since its one choice would keep every project of the board whose values the facet lists").
  - Verdict: none (item 4's rule itself is stated and holds).

## 4. Behaviour

none. The report's "Host- and user-visible changes, before and after" covers the Research, Personal and Software boards, the Present view, the Map's bar and graph, a collection page's Projects section, and a saved pick of the value for none. Each surface gets its before, its after, and the state to put the look in.

## Declined to judge

- G92's test on the unchanged tree: not rerun. A run of it over a copy of the base tree in the scratch folder was refused by the permission system. The test file is unchanged (`git diff 35d2f571e` names no file under `tests`), it passes after the change, and the builder's quoted before-run stands unreproduced.
- `npm run diagrams` in its writing form: not run, so the reviewer changes nothing. `staleFiles` printed `stale: []` and `git status --short` shows no change under `docs`, which reproduces the report's claim that no diagram changed.
- The eslint warning on `projects.yml` ("File ignored because no matching configuration was supplied"): `eslint.config.js` has no YAML configuration and the brief's command names the YAML file. This is not a defect of the step.
- The brief's vitest command timing out on the three tree checks without `--testTimeout 0`: reproduced (12841 ms, 40275 ms and 15848 ms against vitest's 5000 ms default). With the repository's `test:checks` setting (`package.json:16`) all three pass. Whether the brief should carry that flag is for the orchestrator.
- How the Personal and Software boards look on the real hub, and how the `No venue` row lines up beside rows with bars in `PickMenu.svelte`: the builder runs no page and the reviewer opens none. This is for the look on landing.
- `presets.ts:44-47` names the eleven board facets. The collection Projects section's Category group also gives `NONE` (`collection/bar.ts:255`, a project in no row). The base comment omitted it too, the diff does not make that sentence newly false, and the group is not one of `FACETS`. Whether item 7's "every facet" reaches it is the orchestrator's call.
- File and line citations in the report's "Names and sentences" that are off by three lines (`filter-menu.ts:185`, `:205` against the actual `:188`, `:208`): no decision rests on them.

Reviewer usage: a187824606f56cf5b, claude-opus-5-5, 233135 tokens, 65 tool uses, 1324 s.

## Closed

- Spec 1 (the builder's programs outside the case program): closed under the ruling "Unapproved builder scripts" (plan.md Rulings), in automode and not raised as an open item. The breach is recorded in the booking. The builder's report already lists each command and what it touched: `wrap.mjs` printed a wrap and changed no file, the comment edits being made with the Edit tool; the `sed -i` changed only the scratch program `smoke.case.ts`, removed and never in the diff; the redirects wrote run logs under `.agents/scratch/`, removed. The orchestrator read every comment hunk of the diff against the brief: each is a whole-paragraph wrap at or under 100 columns, and the reviewer's line lengths and `comment-width.test.ts` agree. Every hunk is kept. No repair round, since no tree file was written by a program.
- Standards 1 (`filter-menu.ts:188-189`, the reason clause of `filterGroups`'s head comment false for a project carrying only chip or form words no vocabulary holds): fixed at landing, small and inside item 4, by narrowing the clause to the projects whose values the facet lists.
- Declined to judge, the brief's vitest command without `--testTimeout 0`: the three tree checks pass with the repository's `test:checks` setting, reproduced by the reviewer; the whole verify list runs at landing. The brief's command was wrong, not the step.
- Declined to judge, the Category group of a collection page in `presets.ts:44-47`: the group imports the board's `NONE` (`collection/bar.ts:52,255`) for a project in no row of `categories:`, so item 7's "every facet that gives it" reaches it; fixed at landing by adding it to the comment.
- Declined to judge, the Personal and Software boards and the No venue row's alignment: for the look at landing.
