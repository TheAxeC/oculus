# O91 report: the joint-work collection leaves, and the person, organisation and resource cards draw their project strips

Everything in the brief is done. One check did not print clean in one run: the verify list of check 1 exited 1, with 13 red files, every one a time-out in a file the step does not change. Each of the 13 passes when rerun alone by name, which is what check 1 says to do with such a line (DONE / NOT DONE row 1).

## Open items of the state file (verbatim, `.scratch/migration/orchestrator-state.md:208-218`)

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- 489 (2026-10-27, /spec O91, the orchestrator; kind 2 of self-rule, it deletes data, so it waits for Axel). What it is about: each of the ten entries of the research hub's `.oculus/data/academic/joint-work.yml` has a `title` you wrote (for example moreau "Privacy-preserving ML for health & genomics", van-hulle "Neuro & psychophysiology (ECoG / BCI)", naesens "Transplant nephrology - federated, interpretable outcome prediction"). Ruling 470 (a) moves only `note` and `tags` onto the person in `people.yml` and deletes the file, so the ten titles would be deleted. Most titles restate the note, but some hold words the note does not (moreau's "genomics", van-hulle's "psychophysiology"). The other fields carry nothing: `status` is `active` in all ten, and no entry has `meta`, `deadline` or `followup`.
  - (a) Each title is kept as the first sentence of that person's `note`: "<title>. <note>". Pros: nothing you wrote is lost; no new field in the people schema; the note stays the one place for the work with that person. Cons: the moved note is no longer byte for byte the old note; a terse title reads as a heading inside prose.
  - (b) The people schema gains a third field, `work` (text, "What the work with the person is about."), holding the title. Pros: the title is kept as written, apart from the note. Cons: a new field on every person for one line that the note mostly repeats, and one more schema key than ruling 470 named.
  - (c) The titles are deleted with the file, as ruling 470's words read. Pros: no extra work, the ruling's text carried out literally. Cons: deletes text you wrote that the notes do not hold. This is the lazy option.
  - Recommendation: (a). It loses nothing, and it adds no schema key for content the note already mostly holds. (b) keeps the titles too, but adds a field to every person for little gain.
  - Scheduling: inside O91, in the hub commit at its landing; the builder works meanwhile, since the hub text is the orchestrator's. O91 lands only after the ruling.
```

The demo fixture bears on open item 489. Its `joint-work.yml` held a `title`, a `status` and a `meta` row for each of its two entries. Item 7 of the brief moves only `note` and `tags` onto the person, so those three fields left with the file, and the fixture's titles are not kept anywhere. If Axel rules (a) or (b) for the hub, the demo `people.yml` should follow the same ruling at landing: under (a) each title becomes the first sentence of the note, under (b) a `work` field holds it. The orchestrator can make that change at landing.

## The cases' first run

The strips (cases 1 to 16) were run with the case-run program `case-run.test.ts`. Cases 19 to 21 were run with `case-run-hub.test.ts`. Both programs are quoted whole in the last section, with their outputs. In each program, the "first run" is its run against the base copy `.agents/worktrees/O91-base/src`, which is the unchanged tree. The "last run" is its run against the worktree's `src` after the last change.

Command (run from the scratchpad folder `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o91`):

```
CASES=<program> TREE=/Users/axelfaes/workspace/oculus/.agents/worktrees/<O91-base|migration-O91>/src /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O91/node_modules/.bin/vitest run --config ./vitest.config.mjs --reporter=dot
```

| Case | First run (base copy) | Last run (after) | Look on landing |
| --- | --- | --- | --- |
| 1 | `no strip` | `Collaborator: in-flight[hub:m-live] done[hub:m-done] ideas[hub:m-idea]` | People view, card of `amir-haeri`: one strip headed Collaborator; no Lead and no Supervisor strip |
| 2 | `no strip` | `Lead: in-flight[hub:s-lead] \| Collaborator: in-flight[hub:s-collab]` (the dead-stage project `s-dead` is left out) | People view, card of `van-den-berg`: a Lead strip with one project, then a Collaborator strip |
| 3 | `no strip` | `Lead: in-flight[hub:me-lead] \| Supervisor: done[hub:me-sup] \| Collaborator: ideas[hub:me-collab]` | People view, the user's own card: Lead, Supervisor and Collaborator strips in that order |
| 4 | `no strip` | `Lead: in-flight[hub:both] \| Collaborator: in-flight[hub:both]` | none |
| 5 | `no strip` | `no strip` | none |
| 6 | `no strip` | `no strip` | none |
| 7 | `no strip` | `no strip` | none |
| 8 | `no strip` | `Collaborator: in-flight[hub:s-collab] \| Lead: in-flight[hub:s-lead]` | none |
| 9 | `no strip` (and 9b `no strip`) | `no strip`; 9b, with the waiting-on role first: `Lead: in-flight[hub:s-lead] \| Collaborator: in-flight[hub:s-collab]` | none |
| 10 | `no strip` (and 10b `no strip`) | `no strip`; 10b `no strip` | none |
| 11 | `no strip` | `Collaborator: in-flight[hub:m-live] done[hub:m-done] ideas[hub:m-idea] \| Coauthor: in-flight[hub:m-live] done[hub:m-done] ideas[hub:m-idea]` | none |
| 12 | `no strip` | `Collaborator: in-flight[hub:m-live] done[hub:m-done] ideas[hub:m-idea]` | none |
| 13 | `strip: in-flight[hub:related-one]` | `strip: in-flight[hub:related-one]` | none |
| 14 | `no strip` (and 14b `no strip`) | `strip: in-flight[hub:ut-shared] done[hub:ut-other]` (ana and ben, both of ut, on `ut-shared`, which is listed once); 14b `strip: done[hub:ut-other]` | Organisations view, cards of `university-of-twente` and `mst`: one strip each, no heading |
| 15 | `no strip` (and 15b `no strip`) | `strip: in-flight[hub:on-hpc-1] ideas[hub:on-hpc-2]`; 15b `no strip` | Resources view, card of `utwente`: one strip, no heading; card of `data`: no strip |
| 16 | `no strip` (16b, 16c, 16d `no strip`) | `Lab collaborator: in-flight[lab:lab-own]` (headed by lab's own role label); 16b `Collaborator: in-flight[hub:m-live] done[hub:m-done] ideas[hub:m-idea]`; 16c `strip: in-flight[lab:lab-own]`; 16d `strip: in-flight[lab:lab-own]` | none |
| 17 | The Person page on the base draws a Joint work block, and a toolbar button "Joint work" while an entry names the person. Reading: `git show eeafcd4cb:src/lib/views/boards/person/Person.svelte \| grep -n -i joint` lists `openJointWork` at :198, the button at :208-214 and the block `data-block="joint-work"` at :264-270 | No Joint work block and no Joint work button: `git grep -n -i "joint" -- src/lib/views/boards/person/Person.svelte` prints nothing; the Projects, Waiting on and editor blocks are unchanged in the diff | `amir-haeri`'s Person page (open it from the person's tag on a project card): no Joint work block, no Joint work button; the Projects, Waiting on and editor blocks as before; once the hub commit has landed, the editor shows `tags` and `note` |
| 18 | `tests/state/forms/referrers.test.ts` row "names for a person the projects with them as collaborator or awaited, and the joint work" passed on the unchanged tree (first-run output below) | Row "names for a person the projects with them as collaborator or awaited" passes, expecting `['project:raw-pls', 'project:hccnet']` and no entry (last-run output below) | none |
| 19 | `19 findings naming joint or collab: none`, `19 config findings naming joint or collab: none`, `19 hub-config schema marks: none`, `19 collection hub:joint-work read: yes, 1 entries, joint_work flag true, ticker {"category":"collab"}` | `19 hub-config schema marks:` then `line 21: [collections[12].joint_work] key collections[12].joint_work is not declared by the schema of this file` and `line 21: [collections[12].ticker.category] collections[12].ticker.category is collab, which is not a key of ticker_categories`; `19 collection hub:joint-work read: yes, 1 entries, joint_work flag undefined, ticker undefined` | none |
| 20 | `20 chatContext read: ["funding","tasks"], problems: []` and `20 findings naming chat_context, joint or collab: none` | the same two lines | none |
| 21 | `21 ticker category findings: none` | `21 ticker category findings: ticker category collab names no word of ticker_categories; the entry gives no ticker lines` (the text of `findings.collections.category_unknown`); the Focus words `dlcat_collab`, `glyph_collab` and `word_collaboration` are gone (grep 5 prints none of them) | Focus view, command center: no "joint work" group |
| 22 | not runnable without a page | not runnable without a page | A workspace whose saved academic page holds the `joint-work` tab: the tab reads `Unknown view: joint-work` and its pane shows the same empty message; a fresh workspace's academic page has no such tab |
| 23 | not runnable without a page | the `joint-work:` row of `counts:` left `config/defaults/layout.yml` (diff) | The rail button of the Academic Life page: its badge sum no longer counts joint work |
| 24 | not runnable without a page | the demo `people.yml` declares `tags` and `note` and fills them for `rivera-lab` and `chen-graph` (diff) | People view, once the hub commit has landed: a person with `tags` and `note` shows them as every collection card shows fields of the kinds `tags` and `textarea` |
| 25 | every moved row passed on its old vehicle (first-run output below) | every moved row passes on its new vehicle (last-run output below; the two G32 rows of hub-portfolio also pass alone, row 3 of the table) | none |

On case 19: the finding the brief's case asks for comes from the editor's schema check of the hub's `.oculus/config.yml`. That schema is `hub-config`, built in `src/lib/data/sources/config/catalog/schemas/engine.ts:209` from the options file, with `additionalProperties: false` (`schemas/options.ts:137`). The program's line `19 config findings naming joint or collab: none` shows that the configuration channel (`loadConfig(...).findings`) gives no finding for the key. The snapshot and audit findings give none either. The editor's Problems list marks the key; the Findings view does not list it. This holds for any key a collection entry of a hub's list takes that its options do not describe, and was so before the step, so it is reported here and not changed.

The first run of the changed and moved test rows on the unchanged tree. It was made before any change, with this command:

```
npx vitest run tests/data/helpers/hub-names.test.ts tests/data/snapshot/references.test.ts tests/data/snapshot/rename.test.ts tests/data/sources/collections.test.ts tests/data/sources/config/settings.test.ts tests/routes/hubs/hub-writes.test.ts tests/server/machine/lsp/adapters/hub-keys.test.ts tests/state/forms/referrers.test.ts tests/state/system/settings/theme-groups.test.ts tests/state/boards/board/board-rules.test.ts tests/data/hubs/hub-portfolio.test.ts --reporter=verbose 2>&1 | grep -i -E "joint|person of|from picked|reads a title-keyed|chat_context|leaves out tasks|without the hub key|resolves a value its hub|reads a field of a second-hub|names for a person|reads the collections flagged|renames from self|flow sequence|plain and a double-quoted reference|waiting-on value that names a person|collaborators value of a personal|Test Files|Tests  |FAIL" | head -60
```

Output, with `<check>` for the check mark and `<ellipsis>` for the ellipsis vitest prints:

```
 <check> |unit| tests/data/sources/config/settings.test.ts > chatContext > answers for a hub whose list leaves out tasks the keys of the collections list it names, or its default and a problem 255ms
 <check> |unit| tests/data/sources/config/settings.test.ts > chatContext > answers for a hub whose list leaves out tasks, writing 3 the keys of the collections list it names, or its default and a problem 296ms
 <check> |unit| tests/data/snapshot/references.test.ts > the reference index > finds 'a waiting-on value that names a person' 197ms
 <check> |unit| tests/data/snapshot/rename.test.ts > the rename of a hub key > edits 'a plain and a double-quoted reference<ellipsis>' 285ms
 <check> |unit| tests/data/snapshot/references.test.ts > the reference index > finds 'a collaborators value of a personal p<ellipsis>' 101ms
 <check> |unit| tests/data/snapshot/rename.test.ts > the rename of a hub key > edits 'a flow sequence, a block sequence and<ellipsis>' 199ms
 <check> |unit| tests/data/snapshot/references.test.ts > the reference index > finds 'a double-quoted select, the person of<ellipsis>' 80ms
 <check> |unit| tests/data/snapshot/references.test.ts > the reference index > finds 'a from picked by another field of the<ellipsis>' 274ms
 <check> |unit| tests/data/snapshot/references.test.ts > the reference index > finds 'a from picked by another field of the<ellipsis>' 81ms
 <check> |unit| tests/state/system/settings/theme-groups.test.ts > the people of the choice self > offers a person of another hub whose key resolves to them from the primary, with that hub's name, and no person whose key the primary or a third hub holds (case 19) 0ms
 <check> |unit| tests/state/system/settings/theme-groups.test.ts > the people of the choice self > draws a person of another hub named like a person of the primary apart: [ 'Kim', 'Kim (other)' ] (case 20) 0ms
 <check> |unit| tests/state/system/settings/theme-groups.test.ts > the people of the choice self > draws a person of another hub named like a person of the primary apart: [ 'Kim (other) (x)', <ellipsis>(1) ] (case 20) 0ms
 <check> |unit| tests/data/sources/collections.test.ts > readCollections > reads a title-keyed collection with its entries in file order 24ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > the Focus band positions column reads the collections flagged band_positions 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > the Awaiting box applications reads the collections flagged awaiting 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > the open count and green badge reads the collections flagged open_badge 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > a lead's applied press reads the collections flagged lead_applications 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > the Focus band teaching column reads the collections flagged band_teaching 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > Disseminated in, each hub in order reads the collections flagged dissemination 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > Add Task, the task seed and the task lines reads the collections flagged tasks 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > a person's joint work and the cross-links reads the collections flagged joint_work 0ms
 <check> |unit| tests/state/forms/referrers.test.ts > referrersOf > names for a person the projects with them as collaborator or awaited, and the joint work 0ms
 <check> |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > reads a field of a second-hub entry that names a record as the key its file holds (G32) 2680ms
 <check> |unit| tests/server/machine/lsp/adapters/hub-keys.test.ts > the answer to a request on self of the primary hub's local.yml > renames from self of the primary hub's local.yml the person, and that file with it (case 23) 114ms
 <check> |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > resolves a value its hub cannot resolve in the primary hub that holds it, the field keeping the key its file holds (G32) 2742ms
 <check> |unit| tests/routes/hubs/hub-writes.test.ts > a write to a record of the second hub > writes a field that names a record of the second hub without the hub key (G8) 925ms
 <check> |unit| tests/routes/hubs/hub-writes.test.ts > a write to a record of the second hub > writes a manifest field that names records of the second hub without the hub key (G8) 807ms
 Test Files  11 passed (11)
      Tests  435 passed (435)
```

The last run, after the last change, used the same command, run while another worktree's suite was running on the machine (the O88 builder's). Output, with `<cross>` for the cross mark:

```
 <check> |unit| tests/data/snapshot/rename.test.ts > the rename of a hub key > edits 'a plain and a double-quoted reference<ellipsis>' 127ms
 <check> |unit| tests/data/snapshot/rename.test.ts > the rename of a hub key > edits 'a flow sequence, a block sequence and<ellipsis>' 105ms
 <check> |unit| tests/data/snapshot/references.test.ts > the reference index > finds 'a waiting-on value that names a person' 300ms
 <check> |unit| tests/data/snapshot/references.test.ts > the reference index > finds 'a collaborators value of a personal p<ellipsis>' 474ms
 <check> |unit| tests/data/snapshot/references.test.ts > the reference index > finds 'a double-quoted select, the person of<ellipsis>' 155ms
 <check> |unit| tests/data/snapshot/references.test.ts > the reference index > finds 'a from picked by another field of the<ellipsis>' 126ms
 <check> |unit| tests/data/snapshot/references.test.ts > the reference index > finds 'a from picked by another field of the<ellipsis>' 118ms
 <check> |unit| tests/server/machine/lsp/adapters/hub-keys.test.ts > the answer to a request on self of the primary hub's local.yml > renames from self of the primary hub's local.yml the person, and that file with it (case 23) 91ms
 <check> |unit| tests/data/sources/config/settings.test.ts > chatContext > answers for a hub whose list leaves out tasks the keys of the collections list it names, or its default and a problem 490ms
 <check> |unit| tests/data/sources/config/settings.test.ts > chatContext > answers for a hub whose list leaves out tasks, writing 3 the keys of the collections list it names, or its default and a problem 386ms
 <check> |unit| tests/state/system/settings/theme-groups.test.ts > the people of the choice self > offers a person of another hub whose key resolves to them from the primary, with that hub's name, and no person whose key the primary or a third hub holds (case 19) 1ms
 <check> |unit| tests/state/system/settings/theme-groups.test.ts > the people of the choice self > draws a person of another hub named like a person of the primary apart: [ 'Kim', 'Kim (other)' ] (case 20) 0ms
 <check> |unit| tests/state/system/settings/theme-groups.test.ts > the people of the choice self > draws a person of another hub named like a person of the primary apart: [ 'Kim (other) (x)', <ellipsis>(1) ] (case 20) 1ms
 <check> |unit| tests/data/sources/collections.test.ts > readCollections > reads a title-keyed collection with its entries in file order 83ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > the Focus band positions column reads the collections flagged band_positions 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > the Awaiting box applications reads the collections flagged awaiting 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > the open count and green badge reads the collections flagged open_badge 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > a lead's applied press reads the collections flagged lead_applications 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > the Focus band teaching column reads the collections flagged band_teaching 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > Disseminated in, each hub in order reads the collections flagged dissemination 0ms
 <check> |unit| tests/data/helpers/hub-names.test.ts > the collection a flag or a registry names > Add Task, the task seed and the task lines reads the collections flagged tasks 0ms
 <check> |unit| tests/state/forms/referrers.test.ts > referrersOf > names for a person the projects with them as collaborator or awaited 0ms
 <cross> |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > reads a field of a second-hub entry that names a record as the key its file holds (G32) 6781ms
 <cross> |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > resolves a value its hub cannot resolve in the primary hub that holds it, the field keeping the key its file holds (G32) 9309ms
 <check> |unit| tests/routes/hubs/hub-writes.test.ts > a write to a record of the second hub > writes a field that names a record of the second hub without the hub key (G8) 2424ms
 <check> |unit| tests/routes/hubs/hub-writes.test.ts > a write to a record of the second hub > writes a manifest field that names records of the second hub without the hub key (G8) 3411ms
 Test Files  1 failed | 10 passed (11)
      Tests  7 failed | 427 passed (434)
```

The seven red rows of that run are all in `tests/data/hubs/hub-portfolio.test.ts`. Five of them are rows the step does not touch (C1, C2 and C4, C3, C6, and "keeps a primary-hub id that begins with the name of a hub folder"). All seven are over the 5000 ms limit under the load of the other worktree's suite (6781 ms and 9309 ms for the two G32 rows). The file alone, with the same limit, gave `Tests  1 failed | 15 passed (16)`. The one red row there was the untouched "holds every record of both hubs, each under the name of its hub's folder", at 5497 ms with `Error: Test timed out in 5000ms.`, and both G32 rows passed (4167 ms and 4104 ms). The file alone with no time limit (`npx vitest run tests/data/hubs/hub-portfolio.test.ts --testTimeout 0`) printed:

```
 Test Files  1 passed (1)
      Tests  16 passed (16)
```

Inside the verify list (check 1), hub-portfolio was not among the red files.

## DONE / NOT DONE

| # | Item | State | Proof |
| --- | --- | --- | --- |
| 1 | Check 1: `npm run diagrams && npm run docs:palette && npm run test:quick -- --base eeafcd4cb` once, after the last change | DONE, red only in files the step does not change, each green alone | Summary lines below |
| 2 | Check 2: `wc -l` of every changed file | DONE | Files section: the largest source file is `src/lib/state/client/selectors.svelte.ts` at 871 (limit 880), the largest component `Person.svelte` at 400 (limit 520) |
| 3 | Check 3: every changed or moved row run before and after | DONE | The first and last runs above |
| 4 | Check 4: unused exports | DONE, no difference | `sh utils/unused-exports.sh > .../scratchpad/o91/unused-after.txt` printed `script exit 0`; `diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O91-base/unused-exports.txt .../unused-after.txt` printed nothing, `diff exit 0` |
| 5 | Check 5: grep 5 | DONE, one hit, kept | `tests/fixtures/hubs/demo/.oculus/data/people/people.yml:29:    note: "Early conversations about a joint workshop paper."` This is the demo's joint-work `note` moved byte for byte onto `chen-graph`, as item 7 asks. "joint workshop" is the note's own words and does not name the collection |
| 6 | Check 6: history-word grep `grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO9[0-9]\b' src config docs tests --exclude=local.yml` | DONE | prints nothing, `exit 1` |
| 7 | Check 7: ASCII gate (perl form of spec.md) over `src tests bin config`, and `LC_ALL=C grep -n '[^ -~]'` over the changed docs and this report | DONE | the perl gate printed nothing, `perl exit 0` (find also printed `bfs: error: bin: No such file or directory.`, since the tree has no `bin/`); `LC_ALL=C grep -n '[^ -~]' README.md docs/HELP.md docs/apps.md docs/templates.md docs/palette.md` printed nothing, `grep exit 1`; over this report: the last command before hand-back, quoted in the hand-back message |
| 8 | Items 1 to 8 of "What to build" | DONE | diff; cases above; grep 5 |
| 9 | svelte-check | DONE | inside check 1: `ok      svelte-check (177.6 s): 1793064804212 COMPLETED 548 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 10 | comment-width check after the cross-links.ts rewrap | DONE | `npx vitest run tests/checks/source/comment-width.test.ts --testTimeout 0`: `Test Files  1 passed (1)`, `Tests  2 passed (2)`; it also passed inside check 1's `vitest checks` |
| 11 | Scratchpad programs gone, nothing running | DONE | the hand-back message names the removal command; `ps -eo pid,ppid,etime,command \| grep -E "migration-O91\|scratchpad/o91" \| grep -v grep` printed nothing after the last run |

Check 1's summary lines, from `.../scratchpad/o91/verify.log`:

```
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.3 s)
ok      prettier (3.1 s): All matched files use Prettier code style!
ok      eslint (156.1 s)
ok      svelte-check (177.6 s): 1793064804212 COMPLETED 548 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (595.2 s): Duration  578.19s (transform 120.99s, setup 0ms, import 713.53s, tests 1113.52s, environment 7ms)
FAILED  vitest (602.0 s)
 Test Files  9 failed | 214 passed | 64 skipped (287)
      Tests  10 failed | 2837 passed | 762 skipped (3609)
     Errors  1 error
FAILED  vitest slow (747.5 s)
 Test Files  3 failed | 79 passed (82)
      Tests  3 failed | 737 passed | 289 skipped (1029)
test:quick: 750.2 s; failed: vitest, vitest slow
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
exit 1
```

Each red line was `Error: Test timed out in 5000ms.`, `Error: Hook timed out in 10000ms.`, `Error: Test timed out in 20000ms.`, or, for `tests/ui/html.dom.test.ts`, `Error: [vitest-pool]: Failed to start forks worker ... Caused by: Error: [vitest-pool-runner]: Timeout waiting for worker to respond`. None of the files is one the step changes. Each was rerun alone by name (`npx vitest run <file>`):

```
== tests/data/hubs/workspace-projects.test.ts             Test Files  1 passed (1)  Tests  5 passed (5)
== tests/routes/machine/schedules.test.ts                 Test Files  1 passed (1)  Tests  2 passed (2)
== tests/routes/hubs/make.test.ts                         Test Files  1 passed (1)  Tests  35 passed (35)
== tests/state/shared/hub-words.test.ts                   Test Files  1 passed (1)  Tests  4 passed (4)
== tests/server/machine/runs/commands/run.test.ts         Test Files  1 passed (1)  Tests  6 passed (6)
== tests/server/machine/runs/schedules/commands.test.ts   Test Files  1 passed (1)  Tests  3 passed (3)
== tests/server/machine/runs/schedules/record.test.ts     Test Files  1 passed (1)  Tests  2 passed (2)
== tests/state/workbench/layout/saved/layout-unread.test.ts   Test Files  1 passed (1)  Tests  6 passed (6)
== tests/server/machine/apps/tools/terminals/terminals-scope.test.ts   Test Files  1 passed (1)  Tests  4 passed (4)
== tests/ui/html.dom.test.ts                              Test Files  1 passed (1)  Tests  8 passed (8)
== tests/server/desktop/app-theme-start.test.ts           Test Files  1 passed (1)  Tests  21 passed (21)
== tests/server/git/git-ops.test.ts                       Test Files  1 passed (1)  Tests  17 passed (17)
== tests/server/edit/config-value.test.ts                 Test Files  1 passed (1)  Tests  23 passed (23)
```

(Each file's two summary lines are joined on one line here; the log prints them as two.) The red runs came while the O88 builder's suite ran on the same machine.

## Commands that wrote a file other than through Edit or Write

- `rm tests/fixtures/hubs/demo/.oculus/data/academic/joint-work.yml`: deletes that file (item 7).
- `npx prettier --write` over the changed files: reformatted `src/lib/views/shared/forms/entry/Referrers.svelte` and `tests/data/hubs/hub-portfolio.test.ts`.
- `npm run diagrams` (inside check 1): rewrote `docs/diagrams/layers.dot`, `docs/diagrams/layers.svg`, `docs/diagrams/layer-views.dot` and `docs/diagrams/layer-views.svg`. The counts changed because `Person.svelte` no longer imports from the data layer or `Tag.svelte`: `views to data` went from 21 to 20, `views to ui` from 1035 to 1034, and the `views/boards to layer data` edge left. These files are on the brief's write list.
- `npm run docs:palette`: rewrote `docs/palette.md`, removing the row `| Joint work | joint-work |`.
- `npx svelte-kit sync`, run inside test:quick, writes `.svelte-kit/` only, which git ignores.

## Files with line counts (`wc -l`, after the last change)

```
     115 README.md
     289 config/catalogs/vocab.yml
     345 config/defaults/layout.yml
     114 config/defaults/sources.yml
     824 config/options/behavior.yml
     186 config/options/sources.yml
      77 config/text/views/boards/collection.yml
     161 config/text/views/boards/focus.yml
      32 config/text/views/boards/person.yml
     339 config/text/views/sources/files.yml
     583 docs/HELP.md
     847 docs/apps.md
     184 docs/diagrams/layer-views.dot
     101 docs/diagrams/layers.dot
     202 docs/palette.md
    1504 docs/templates.md
     844 src/lib/data/model/index.ts
     504 src/lib/data/model/model-collections.ts
     737 src/lib/data/model/model-entities.ts
     386 src/lib/data/snapshot/hubs/merge.ts
     181 src/lib/data/snapshot/normalise-parts/links.ts
     643 src/lib/data/snapshot/normalise.ts
     216 src/lib/data/sources/collections.ts
      34 src/lib/state/boards/board/team.ts
     115 src/lib/state/boards/person.ts
     268 src/lib/state/boards/structure/cross-links.ts
     669 src/lib/state/boards/ticker.ts
     871 src/lib/state/client/selectors.svelte.ts
     131 src/lib/state/forms/referrers.ts
     280 src/lib/ui/controls/Chip.svelte
     400 src/lib/views/boards/person/Person.svelte
     360 src/lib/views/shared/card/record/RecordCard.svelte
     107 src/lib/views/shared/forms/entry/Referrers.svelte
     334 src/lib/views/shared/forms/entry/card/EntryCard.svelte
     198 src/lib/views/shared/links/CrossLinks.svelte
     390 tests/data/helpers/hub-names.test.ts
     553 tests/data/hubs/hub-portfolio.test.ts
     378 tests/data/snapshot/reference-hub.ts
     657 tests/data/snapshot/references.test.ts
     565 tests/data/snapshot/rename.test.ts
     494 tests/data/sources/collections.test.ts
     866 tests/data/sources/config/settings.test.ts
      38 tests/fixtures/hubs/demo/.oculus/config.yml
      46 tests/fixtures/hubs/demo/.oculus/data/people/people.yml
     859 tests/routes/hubs/hub-writes.test.ts
     273 tests/server/machine/lsp/adapters/hub-keys.test.ts
     862 tests/state/boards/board/board-rules.test.ts
     137 tests/state/forms/referrers.test.ts
     465 tests/state/system/settings/theme-groups.test.ts
```

Also deleted: `tests/fixtures/hubs/demo/.oculus/data/academic/joint-work.yml`. Also rewritten by `npm run diagrams`: `docs/diagrams/layers.svg` and `docs/diagrams/layer-views.svg`. `docs/templates.md` is a document, not a source file; the diff shortens it by 23 lines. No folder gained an item: `src/lib/views/shared/links/` still holds 10, and the demo's `academic/` folder lost one.

Path outside the brief's line ranges: `src/lib/views/shared/forms/entry/Referrers.svelte`. The write list gives its lines 1 to 8 (the head comment). The edit also reaches lines 25 to 37, the `open` function. The reason: the Referrer kind `'entry'` and its `collection` field leave `referrers.ts`, since only joint work made them, so the branch of `open` that opened an entry's page (through `openPage`) became dead code. The funding branch now builds its page inline with `pageView(registryKey('funding', addressOfId(one.id).hub), one.id, one.label)`, which is what `openPage` did for it.

## Judgment calls the brief left open

1. `config/defaults/sources.yml`: `tasks` keeps `order: 5`, leaving a gap at 4 in the academic group. The order only sorts the views, so the gap draws the same as a renumbered list and keeps the diff to the one removed line.
2. A strip's heading (`CrossLinks.svelte`, new optional prop `label`) is drawn as the first item of the strip's own flex row, on the line of the group heads. It uses the small, bold, muted words of a block's heading (`--fs-xs`, weight 700, `--muted-txt`). No new words are catalogued: the heading is the role's `label` (decision 3).
3. A person's card is decided by `registry: people` alone (case 12, case 13). For an entry of a people collection, `roleLinks` returns its rows and `crossLinks` is not called. So a person entry's own `related:` list, if a hub wrote one, is no longer drawn. Organisations and resources likewise draw their join and not `related:`. Item 3 to 5 of the brief say what each card draws, and fact 5 says none of these files has a `related:` list.
4. The vehicle for the G66 and G67 rows over `reference-hub.ts` is `.oculus/data/research/statements.yml`, which is the `statements` key of oculus's list (`config/defaults/sources.yml:40`). The planted text moved byte for byte, so no line or column of the other rows shifted. The only reorder is in the utwente row, which lists the same two references in path order. That row is in the assertion table.
5. The vehicle for the G32 row at `hub-portfolio.test.ts:221` is a funding entry's `lead`, one of the fields the brief names. The helper `plantLead` declares `- { field: lead, type: tags, foreign_key: people }` in the demo funding file and gives the scheme `ecf` the lead. The row asserts `resolvedId(holders, 'lab', 'ghost')` is `'hub:ghost'`, with no finding on the funding file naming `ghost`, in place of the `jointWorkPerson` pair. The relation table a funding lead would fill does not exist, so the resolution rule is asserted directly, through the function the page and the merge use.
6. The G8 row of `hub-writes.test.ts` writes to `statements` (`.oculus/data/research/statements.yml`), the same collection as item 4.
7. `collections.test.ts:37` and `:90` take the key `collaborations` with the file `.oculus/data/academic/collaborations.yml`. That key is on no list of oculus, so the row reads a plain title-keyed collection as before.
8. `settings.test.ts`: `FIVE` became `KEPT` (four keys: funding, events, education, applications), since the list now holds four. The rows' titles are unchanged.
9. `docs/apps.md:414` now says that `projectPerson` pairs a project with each person of its `lead`, its `collaborators` and its `supervisors`. The base text left out `supervisors`, while `links.ts` fills all three; the line had to be edited to remove `jointWorkPerson`, so it was made true at the same time.
10. The help words of the two new people rows (`tags`, `note`) in `docs/templates.md` and in the demo `people.yml` are the words of the brief's Hub text.
11. The Person page's registration comment and the text file `person.yml` say the person opens from "a field of an entry that names a person", in place of "a joint-work entry". An entry field typed `select` or `tags` with `foreign_key: people` opens the person's page, so this is where the joint-work entry's opener went.

## Host- and user-visible changes, view by view

- **Person page.** Before: a Joint work block listing the joint-work entries naming the person, and a toolbar button "Joint work" opening the Joint work view. After: neither. Projects, Waiting on and the editor are unchanged.
- **People view, a person's card.** Before: no project strip, since the card fell to the empty `related:` list. After: one strip per role row of `roles:` whose field is `lead`, `supervisors` or `collaborators`, each headed by the role's label, holding that role's projects grouped in flight, done and ideas. A role with no project draws no strip.
- **Organisations view, an organisation's card.** Before: no strip. After: one strip, with no heading, of the projects whose team holds a person affiliated to the organisation.
- **Resources view, a resource's card.** Before: no strip. After: one strip, with no heading, of the projects whose `compute:` names the resource.
- **Joint work view.** Before: a collection view on the Academic Life page, pinned, counted in the rail badge. After: no such view. A saved page holding its tab shows `Unknown view: joint-work` (case 22).
- **Academic Life rail badge.** Its sum no longer counts joint work.
- **Focus command center.** Before: a "joint work" deadline group. After: none. A hub entry naming `ticker: { category: collab }` gets the category_unknown finding (case 21).
- **Make Folder a Hub.** The line "Work with a person outside the projects." for joint-work leaves.
- **A person's delete question and the Referrers block of a record page.** They name the projects only, and no joint-work entry.
- **Settings view, a collection row.** The toggle `joint_work` leaves. A hub `.oculus/config.yml` still naming it is marked in the editor as `key collections[N].joint_work is not declared by the schema of this file` (case 19).
- **Chat context.** The default list no longer names `joint-work`. A hub list still naming it gives no finding and the word is left out (case 20).
- **Help, README and templates.** These name no joint work. `docs/HELP.md:301` now says what the person, organisation and resource cards draw.

## Changed lines of existing assertions, allow lists and predicates

The table is made from `git diff -U0 eeafcd4cb -- tests/`, one row per changed line. Line numbers are base / after.

| File | Line | Before | After |
| --- | --- | --- | --- |
| tests/data/helpers/hub-names.test.ts | 232 / - | `{ key: 'collab', file: 'collab.yml', joint_work: true },` | removed |
| tests/data/helpers/hub-names.test.ts | 303-304 / 302 | `['Add Task, the task seed and the task lines', 'tasks', ['hub:todo']],` and `["a person's joint work and the cross-links", 'joint_work', ['hub:collab']]` | `['Add Task, the task seed and the task lines', 'tasks', ['hub:todo']]` (the joint_work row deleted) |
| tests/data/hubs/hub-portfolio.test.ts | 16 / 16 | `import { bareId } from '../../../src/lib/data/helpers/hub-names.ts';` | `import { bareId, holdersOf, resolvedId } from '../../../src/lib/data/helpers/hub-names.ts';` |
| tests/data/hubs/hub-portfolio.test.ts | - / 64-82 | none | the helper `plantLead(dir, person)`, which asserts `expect(declared).not.toBe(text)` and `expect(planted).not.toBe(declared)` |
| tests/data/hubs/hub-portfolio.test.ts | - / 220-221 | none | `plantLead(from.hub, 'rivera-lab');` and `plantLead(from.lab, 'rivera-lab');` |
| tests/data/hubs/hub-portfolio.test.ts | 211 / 232 | `expect(entry('hub:joint-work', 'rivera-lab').fields.person).toBe('rivera-lab');` | `expect(entry('hub:funding', 'ecf').fields.lead).toEqual(['rivera-lab']);` |
| tests/data/hubs/hub-portfolio.test.ts | 212 / 233 | `expect(entry('lab:joint-work', 'rivera-lab').fields.person).toBe('rivera-lab');` | `expect(entry('lab:funding', 'ecf').fields.lead).toEqual(['rivera-lab']);` |
| tests/data/hubs/hub-portfolio.test.ts | 233-237 / 254 | `const work = join(from.lab, '.oculus', 'data', 'academic', 'joint-work.yml');`, `const text = readFileSync(work, 'utf8');`, `const named = text.replace('person: "rivera-lab"', 'person: "ghost"');`, `expect(named).not.toBe(text);`, `writeFileSync(work, named);` | `const funding = plantLead(from.lab, 'ghost');` |
| tests/data/hubs/hub-portfolio.test.ts | 239-240 / 256-257 | `const held = merged.entities.collections['lab:joint-work'].entries.find(` and `(one) => one.fields.key === 'rivera-lab'` | `const held = merged.entities.collections['lab:funding'].entries.find(` and `(one) => one.fields.key === 'ecf'` |
| tests/data/hubs/hub-portfolio.test.ts | 242 / 259 | `expect(held?.fields.person).toBe('ghost');` | `expect(held?.fields.lead).toEqual(['ghost']);` |
| tests/data/hubs/hub-portfolio.test.ts | 245-248 / 262-263 | `expect(merged.relations.jointWorkPerson).toContainEqual([`, `'lab:rivera-lab',`, `'hub:ghost'`, `]);` | `const holders = holdersOf(Object.values(merged.entities.people));` and `expect(resolvedId(holders, 'lab', 'ghost')).toBe('hub:ghost');` |
| tests/data/hubs/hub-portfolio.test.ts | 250 / 265 | `(one) => one.file === work && one.message.includes('ghost')` | `(one) => one.file === funding && one.message.includes('ghost')` |
| tests/data/snapshot/reference-hub.ts | 117 / 117 | `'.oculus/data/academic/joint-work.yml': [` | `'.oculus/data/research/statements.yml': [` |
| tests/data/snapshot/references.test.ts | 74 / 74 | `/** A joint-work file whose ...` | `/** A statements file whose ...` |
| tests/data/snapshot/references.test.ts | 126 / 126 | `'hub:.oculus/data/academic/joint-work.yml:5:13',` | `'hub:.oculus/data/research/statements.yml:5:13',` |
| tests/data/snapshot/references.test.ts | 150 / 150 | `'hub:.oculus/data/academic/joint-work.yml:5:13',` | `'hub:.oculus/data/research/statements.yml:5:13',` |
| tests/data/snapshot/references.test.ts | 186 / 186 | `name: 'a double-quoted select, the person of a joint-work entry',` | `name: 'a double-quoted select, the person of a statements entry',` |
| tests/data/snapshot/references.test.ts | 187 / 187 | `at: ['hub', '.oculus/data/academic/joint-work.yml', 5, 13],` | `at: ['hub', '.oculus/data/research/statements.yml', 5, 13],` |
| tests/data/snapshot/references.test.ts | 192 / 192 | `'hub:.oculus/data/academic/joint-work.yml:5:13',` | `'hub:.oculus/data/research/statements.yml:5:13',` |
| tests/data/snapshot/references.test.ts | 405 / 405 | `at: ['hub', '.oculus/data/academic/joint-work.yml', 5, 36],` | `at: ['hub', '.oculus/data/research/statements.yml', 5, 36],` |
| tests/data/snapshot/references.test.ts | 406 / 406 | `hub: { '.oculus/data/academic/joint-work.yml': PICKED },` | `hub: { '.oculus/data/research/statements.yml': PICKED },` |
| tests/data/snapshot/references.test.ts | 411 / 411 | `'hub:.oculus/data/academic/joint-work.yml:5:36',` | `'hub:.oculus/data/research/statements.yml:5:36',` |
| tests/data/snapshot/references.test.ts | 418 / 418 | `at: ['hub', '.oculus/data/academic/joint-work.yml', 6, 33],` | `at: ['hub', '.oculus/data/research/statements.yml', 6, 33],` |
| tests/data/snapshot/references.test.ts | 419 / 419 | `hub: { '.oculus/data/academic/joint-work.yml': PICKED },` | `hub: { '.oculus/data/research/statements.yml': PICKED },` |
| tests/data/snapshot/references.test.ts | 424 / 424 | `'hub:.oculus/data/academic/joint-work.yml:6:33',` | `'hub:.oculus/data/people/people.yml:7:19',` |
| tests/data/snapshot/references.test.ts | 425 / 425 | `'hub:.oculus/data/people/people.yml:7:19'` | `'hub:.oculus/data/research/statements.yml:6:33'` (the same two references, in path order, as the index sorts them) |
| tests/data/snapshot/rename.test.ts | 110 / 110 | `'hub:.oculus/data/academic/joint-work.yml': HUB_FILES[` | `'hub:.oculus/data/research/statements.yml': HUB_FILES[` |
| tests/data/snapshot/rename.test.ts | 111 / 111 | `'.oculus/data/academic/joint-work.yml'` | `'.oculus/data/research/statements.yml'` |
| tests/data/snapshot/rename.test.ts | 214 / 214 | `'hub:.oculus/data/academic/joint-work.yml': HUB_FILES[` | `'hub:.oculus/data/research/statements.yml': HUB_FILES[` |
| tests/data/snapshot/rename.test.ts | 215 / 215 | `'.oculus/data/academic/joint-work.yml'` | `'.oculus/data/research/statements.yml'` |
| tests/data/sources/collections.test.ts | 37 / 37 | `{ key: 'joint-work', file: '.oculus/data/academic/joint-work.yml' },` | `{ key: 'collaborations', file: '.oculus/data/academic/collaborations.yml' },` |
| tests/data/sources/collections.test.ts | 90 / 90 | `'.oculus/data/academic/joint-work.yml',` | `'.oculus/data/academic/collaborations.yml',` |
| tests/data/sources/config/settings.test.ts | 802 / 802 | `/** The five keys of oculus's default chat_context a hub's own collections list holds. */` | `/** Oculus's default chat_context keys but tasks, which a hub's own collections list holds. */` |
| tests/data/sources/config/settings.test.ts | 803 / 803 | `const FIVE = ['funding', 'events', 'education', 'applications', 'joint-work'];` | `const KEPT = ['funding', 'events', 'education', 'applications'];` |
| tests/data/sources/config/settings.test.ts | 804 / 804 | `const FIVE_LIST = ...FIVE.map(...)...` | `const KEPT_LIST = ...KEPT.map(...)...` |
| tests/data/sources/config/settings.test.ts | 850 / 850 | `['a hub whose list leaves out tasks', planted(FIVE_LIST), FIVE, [], false],` | `['a hub whose list leaves out tasks', planted(KEPT_LIST), KEPT, [], false],` |
| tests/data/sources/config/settings.test.ts | 853 / 853 | `planted(\`${FIVE_LIST}chat_context: 3\n\`),` | `planted(\`${KEPT_LIST}chat_context: 3\n\`),` |
| tests/data/sources/config/settings.test.ts | 854 / 854 | `FIVE,` | `KEPT,` |
| tests/routes/hubs/hub-writes.test.ts | 77 / 77 | `const PERSON_FIELD_FILE = \`title: Joint work` | `const PERSON_FIELD_FILE = \`title: Statements` |
| tests/routes/hubs/hub-writes.test.ts | 439 / 439 | `mkdirSync(join(hub, '.oculus', 'data', 'academic'), { recursive: true });` | `mkdirSync(join(hub, '.oculus', 'data', 'research'), { recursive: true });` |
| tests/routes/hubs/hub-writes.test.ts | 441 / 441 | `join(hub, '.oculus', 'data', 'academic', 'joint-work.yml'),` | `join(hub, '.oculus', 'data', 'research', 'statements.yml'),` |
| tests/routes/hubs/hub-writes.test.ts | 449 / 449 | `collection: 'joint-work',` | `collection: 'statements',` |
| tests/routes/hubs/hub-writes.test.ts | 458 / 458 | `const file = '.oculus/data/academic/joint-work.yml';` | `const file = '.oculus/data/research/statements.yml';` |
| tests/server/machine/lsp/adapters/hub-keys.test.ts | 257 / 257 | `pageUri('hub', '.oculus/data/academic/joint-work.yml'),` | `pageUri('hub', '.oculus/data/research/statements.yml'),` |
| tests/state/boards/board/board-rules.test.ts | 224 / - | `jointWorkIds: [],` | removed (the field left `Person`) |
| tests/state/forms/referrers.test.ts | 34-45 / - | the fixture `const jointWork: Collection = { ... joint_work: true, entries: [paper-a, paper-b] };` with its doc comment | removed |
| tests/state/forms/referrers.test.ts | 51 / 39 | `/** The collections of the snapshot: the registries, one keyed otherwise, and the joint work. */` | `/** The collections of the snapshot: the registries, one keyed otherwise, and a plain one. */` |
| tests/state/forms/referrers.test.ts | 62-63 / 50 | `['statements', { ... }],` and `['joint-work', jointWork]` | `['statements', { id: 'statements', title: 'Statements', file: '', entries: [] }]` |
| tests/state/forms/referrers.test.ts | 74-75 / 61 | `links: [],` and `jointWorkIds: ['paper-b']` | `links: []` |
| tests/state/forms/referrers.test.ts | 81-82 / 67 | `links: [],` and `jointWorkIds: []` | `links: []` |
| tests/state/forms/referrers.test.ts | 119 / 104 | `it('names for a person the projects with them as collaborator or awaited, and the joint work', () => {` | `it('names for a person the projects with them as collaborator or awaited', () => {` |
| tests/state/forms/referrers.test.ts | 123-124 / 108 | `'project:hccnet',` and `'entry:paper-b'` | `'project:hccnet'` |
| tests/state/forms/referrers.test.ts | 126 / - | `expect(referrers.at(-1)).toMatchObject({ label: 'paper-b', collection: 'joint-work' });` | removed |
| tests/state/system/settings/theme-groups.test.ts | 408-409 / 408 | `projectIds: [],` and `jointWorkIds: []` | `projectIds: []` |

No threshold, tolerance or predicate was loosened. No allow list changed.

## Moved and deleted guarded rows

Moved (same behaviour, new vehicle; the title changes only where it named joint work):

- G66, `tests/data/snapshot/references.test.ts`: "a double-quoted select, the person of a joint-work entry" became "a double-quoted select, the person of a statements entry". Same file; vehicle `.oculus/data/research/statements.yml`.
- G66, `tests/data/snapshot/references.test.ts`: "a from picked by another field of the record, the person source" and "a from picked by another field of the record, the organisation source". Titles unchanged; the planted `PICKED` file now sits at the statements path.
- G66, `tests/data/snapshot/references.test.ts`: "a waiting-on value that names a person" and its neighbour "a collaborators value of a personal project ...". Titles unchanged; their references lists name the statements path.
- G67, `tests/data/snapshot/rename.test.ts`: `AMIR_RENAMED` and the row "a flow sequence, a block sequence and ...". Titles unchanged; vehicle the statements path.
- G67, `tests/server/machine/lsp/adapters/hub-keys.test.ts`: "renames from self of the primary hub's local.yml the person, and that file with it (case 23)". Title unchanged; its changed URIs name the statements path.
- G8, `tests/routes/hubs/hub-writes.test.ts`: "writes a field that names a record of the second hub without the hub key (G8)". Title unchanged; vehicle the collection `statements`.
- G32, `tests/data/hubs/hub-portfolio.test.ts`: "reads a field of a second-hub entry that names a record as the key its file holds (G32)" and "resolves a value its hub cannot resolve in the primary hub that holds it, the field keeping the key its file holds (G32)". Titles unchanged; vehicle the funding entry's `lead`.
- G32, `tests/data/sources/collections.test.ts`: "reads a title-keyed collection with its entries in file order", named at `agents/guarded.md:254`. Title unchanged; key `collaborations`.
- `tests/data/sources/config/settings.test.ts`: "a hub whose list leaves out tasks" and "a hub whose list leaves out tasks, writing 3". Titles unchanged; four keys.

Deleted:

- `tests/data/helpers/hub-names.test.ts`, the row "a person's joint work and the cross-links reads the collections flagged joint_work", with its fixture list entry `collab`. It is named by G131, describe 'the collection a flag or a registry names', every row.
- `tests/state/forms/referrers.test.ts`: the joint-work part of "names for a person the projects with them as collaborator or awaited, and the joint work". The row stays as "names for a person the projects with them as collaborator or awaited". Its `entry:paper-b` expectation and its `toMatchObject({ label: 'paper-b', collection: 'joint-work' })` assertion are deleted. They are named by G32's clause at `agents/guarded.md:254`: "joint work by its flag: referrers.test.ts the rows whose joint-work collection carries joint_work: true".

## Head comments of every changed file

- Rewritten: `config/text/views/boards/person.yml`, `src/lib/data/sources/collections.ts`, `src/lib/state/boards/board/team.ts` (the list of readers names "the projects on an organisation's card"), `src/lib/state/boards/person.ts`, `src/lib/state/boards/structure/cross-links.ts`, `src/lib/state/forms/referrers.ts`, `src/lib/ui/controls/Chip.svelte` (the sentence on the untoned pills), `src/lib/views/boards/person/Person.svelte` (both the registration comment and the view comment), `src/lib/views/shared/forms/entry/Referrers.svelte`, `src/lib/views/shared/forms/entry/card/EntryCard.svelte`, `src/lib/views/shared/links/CrossLinks.svelte`, `src/lib/views/shared/card/record/RecordCard.svelte` (the foot paragraph), `src/lib/data/model/model-collections.ts` (the COLLECTION_FLAGS doc comment), `src/lib/data/model/model-entities.ts` (the Person doc comment), `src/lib/data/snapshot/normalise-parts/links.ts` (the Sides doc comment), `src/lib/state/boards/ticker.ts` and `src/lib/state/client/selectors.svelte.ts` (doc comments inside the files), `config/defaults/sources.yml` (the flags comment), `docs/templates.md` (the collections comment of the hub template), `tests/data/snapshot/references.test.ts` (the `PICKED` doc comment), `tests/data/sources/config/settings.test.ts` (the `KEPT` doc comment), `tests/state/forms/referrers.test.ts` (the collections doc comment).
- Still true, unchanged: `README.md`, `config/catalogs/vocab.yml`, `config/defaults/layout.yml`, `config/options/behavior.yml`, `config/options/sources.yml`, `config/text/views/boards/collection.yml`, `config/text/views/boards/focus.yml`, `config/text/views/sources/files.yml`, `docs/HELP.md`, `docs/apps.md`, `docs/palette.md`, `docs/diagrams/*` (generated), `src/lib/data/model/index.ts`, `src/lib/data/snapshot/hubs/merge.ts`, `src/lib/data/snapshot/normalise.ts`, the head of `src/lib/data/snapshot/normalise-parts/links.ts`, `tests/data/helpers/hub-names.test.ts`, `tests/data/hubs/hub-portfolio.test.ts`, `tests/data/snapshot/reference-hub.ts`, `tests/data/snapshot/rename.test.ts`, `tests/data/sources/collections.test.ts`, `tests/routes/hubs/hub-writes.test.ts` (the `PERSON_FIELD_FILE` doc comment, "A collection file whose `person` field takes a key of the people registry.", is still true), `tests/server/machine/lsp/adapters/hub-keys.test.ts`, `tests/state/boards/board/board-rules.test.ts`, `tests/state/system/settings/theme-groups.test.ts`, `tests/fixtures/hubs/demo/.oculus/config.yml`, `tests/fixtures/hubs/demo/.oculus/data/people/people.yml`. grep 5 shows that none of them names the joint work.

## Anything in the brief that was wrong or impossible

Nothing was impossible. One wording needs a correction. Item 1 and case 19 call the finding for a hub's `joint_work:` key "the finding the shape check gives any key its options do not list". That finding is the editor's schema mark on `.oculus/config.yml`, `key collections[12].joint_work is not declared by the schema of this file` (case 19's last run). It is not a finding of the configuration channel: `loadConfig(...).findings` gives none for the key, so the Findings view does not list it. The brief's demand, a mark that names the file and the key, is met, through the editor.

## Case-run programs: source and output, whole

`vitest.config.mjs`:

```js
// Case-run config: runs case-run.test.ts alone, with the Svelte plugin so a .svelte.ts module in
// the import chain of cross-links.ts compiles. TREE is the src folder the program reads.
import { svelte } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O91/node_modules/@sveltejs/vite-plugin-svelte/src/index.js';

export default {
    plugins: [svelte({ compilerOptions: { runes: true } })],
    resolve: {
        alias: {
            $lib: process.env.TREE + '/lib'
        }
    },
    test: {
        include: [process.env.CASES ?? 'case-run.test.ts'],
        root: '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o91'
    }
};
```

`case-run.test.ts` (cases 1 to 16):

```ts
// Case-run program of O91, cases 1-16: prints the strip a card of an entry of the people,
// organisations or resources collection draws, from the pure joins of cross-links.ts in the tree
// TREE names. A tree whose cross-links.ts exports `roleLinks` is asked as EntryCard.svelte asks
// it (roleLinks for the role rows, crossLinks for the single strip); a tree without it is asked
// crossLinks alone. Prints only; asserts nothing.
import { it } from 'vitest';
import { fixtureProject } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O91/tests/fixtures/entities-fixture.ts';

type Any = Record<string, unknown>;

const STAGES = {
    nascent: { idea: true },
    exploring: { live: true },
    published: { terminal: true },
    failed: { dead: 1, terminal: true },
    limbo: {}
};
const ROLES = [
    { key: 'lead', label: 'Lead', field: 'lead', unmarked: true },
    { key: 'supervisor', label: 'Supervisor', field: 'supervisors' },
    { key: 'collaborator', label: 'Collaborator', field: 'collaborators' },
    { key: 'other', label: 'Other' }
];
const HUB: Any = { stages: STAGES, chips: {}, roles: ROLES };
const LAB: Any = {
    stages: STAGES,
    chips: {},
    roles: [
        { key: 'lead', label: 'Lab lead', field: 'lead' },
        { key: 'collaborator', label: 'Lab collaborator', field: 'collaborators' }
    ]
};

const project = (id: string, stage: string, over: Any = {}, root = 'hub') =>
    fixtureProject({ id: `${root}:${id}`, root, title: id, stage, ...over });

const P = (key: string, affiliations: string[] = [], root = 'hub') => ({
    id: `${root}:${key}`,
    root,
    name: key,
    affiliations,
    links: [],
    projectIds: [],
    jointWorkIds: []
});

const PROJECTS = [
    // cases 1 and 11: maryam collaborates on one project of each group and leads nothing
    project('m-live', 'exploring', { collaborators: ['hub:maryam'] }),
    project('m-done', 'published', { collaborators: ['hub:maryam'] }),
    project('m-idea', 'nascent', { collaborators: ['hub:maryam'] }),
    // case 2 and 8: steph leads one, collaborates on two, one of them at a dead stage
    project('s-lead', 'exploring', { lead: ['hub:steph'] }),
    project('s-collab', 'exploring', { collaborators: ['hub:steph'] }),
    project('s-dead', 'failed', { collaborators: ['hub:steph'] }),
    // case 3: me as lead, supervisor and collaborator, each once
    project('me-lead', 'exploring', { lead: ['hub:me'] }),
    project('me-sup', 'published', { supervisors: ['hub:me'] }),
    project('me-collab', 'nascent', { collaborators: ['hub:me'] }),
    // case 4: both lists of one project
    project('both', 'exploring', { lead: ['hub:both'], collaborators: ['hub:both'] }),
    // case 5 and 6
    project('dead-only', 'failed', { lead: ['hub:deadonly'] }),
    project('limbo-only', 'limbo', { lead: ['hub:limbo'] }),
    // case 7
    project('waits', 'exploring', { waitingOn: ['hub:waiter'] }),
    // case 14: ana and ben (ut) on one team, cas (ut) on another, dan (other) on a third
    project('ut-shared', 'exploring', { lead: ['hub:ana'], collaborators: ['hub:ben'] }),
    project('ut-other', 'published', { supervisors: ['hub:cas'] }),
    project('not-ut', 'exploring', { lead: ['hub:dan'] }),
    // case 15: two projects compute on hpc
    project('on-hpc-1', 'exploring', { resourceIds: ['hub:hpc'] }),
    project('on-hpc-2', 'nascent', { resourceIds: ['hub:hpc', 'hub:laptop'] }),
    // case 16: a project of the hub lab naming its own maryam, ut and hpc
    project('lab-own', 'exploring', {
        collaborators: ['lab:maryam'],
        lead: ['lab:lia'],
        resourceIds: ['lab:hpc']
    }, 'lab'),
    // case 13: a project the related list names
    project('related-one', 'exploring')
];

const PEOPLE = [
    P('maryam'),
    P('steph'),
    P('me'),
    P('both'),
    P('deadonly'),
    P('limbo'),
    P('waiter'),
    P('ana', ['hub:ut']),
    P('ben', ['hub:ut']),
    P('cas', ['hub:ut', 'hub:mst']),
    P('dan', ['hub:other']),
    P('maryam', [], 'lab'),
    P('lia', ['lab:ut'], 'lab')
];

const wordsOf = (hub?: string): Any => (hub === 'lab' ? LAB : HUB);

const entry = (id: string, fields: Any = {}) => ({
    id,
    root: id.split(':')[0],
    title: id,
    fields,
    file: '',
    index: 0
});

const PEOPLE_COLL = { registry: 'people' };
const ORGS = { registry: 'organisations' };
const RES = { registry: 'resources' };

type Group = { type: string; members: { id: string }[] };

function show(groups: Group[]): string {
    return groups.map((g) => `${g.type}[${g.members.map((m) => m.id).join(',')}]`).join(' ');
}

it('prints every case', async () => {
    const mod = await import(`${process.env.TREE}/lib/state/boards/structure/cross-links.ts`);
    const hasRoles = typeof mod.roleLinks === 'function';
    const strip = (
        one: ReturnType<typeof entry>,
        collection: Any | undefined,
        config: Any = HUB,
        words: (hub?: string) => Any = wordsOf
    ): string => {
        const rows = hasRoles
            ? (mod.roleLinks(one, collection, PROJECTS, config, words) as
                  | { key: string; label: string; groups: Group[] }[]
                  | null)
            : null;
        if (rows !== null) {
            return rows.length === 0
                ? 'no strip'
                : rows.map((row) => `${row.label}: ${show(row.groups)}`).join(' | ');
        }
        const groups = mod.crossLinks(one, collection, PROJECTS, PEOPLE, config, words) as Group[];
        return groups.length === 0 ? 'no strip' : `strip: ${show(groups)}`;
    };
    const withRoles = (roles: unknown[]) => () => ({ ...HUB, roles });
    const lines = [
        `tree: ${process.env.TREE}, roleLinks exported: ${String(hasRoles)}`,
        `1  collaborator only (hub:maryam): ${strip(entry('hub:maryam'), PEOPLE_COLL)}`,
        `2  lead of one, collaborator on others (hub:steph): ${strip(entry('hub:steph'), PEOPLE_COLL)}`,
        `3  lead, supervisor and collaborator (hub:me): ${strip(entry('hub:me'), PEOPLE_COLL)}`,
        `4  lead and collaborator of one project (hub:both): ${strip(entry('hub:both'), PEOPLE_COLL)}`,
        `5  only at a dead stage (hub:deadonly): ${strip(entry('hub:deadonly'), PEOPLE_COLL)}`,
        `6  only at a stage of no group (hub:limbo): ${strip(entry('hub:limbo'), PEOPLE_COLL)}`,
        `7  only in waiting-on (hub:waiter): ${strip(entry('hub:waiter'), PEOPLE_COLL)}`,
        `8  roles collaborator before lead (hub:steph): ${strip(entry('hub:steph'), PEOPLE_COLL, undefined, withRoles([ROLES[2], ROLES[0], ROLES[1]]))}`,
        `9  a role on waiting-on (hub:waiter): ${strip(entry('hub:waiter'), PEOPLE_COLL, undefined, withRoles([...ROLES, { key: 'waiting', label: 'Waiting', field: 'waiting-on' }]))}`,
        `9b a role on waiting-on (hub:steph): ${strip(entry('hub:steph'), PEOPLE_COLL, undefined, withRoles([{ key: 'waiting', label: 'Waiting', field: 'waiting-on' }, ...ROLES]))}`,
        `10 roles empty (hub:maryam): ${strip(entry('hub:maryam'), PEOPLE_COLL, undefined, withRoles([]))}`,
        `10b roles naming none of the three (hub:maryam): ${strip(entry('hub:maryam'), PEOPLE_COLL, undefined, withRoles([{ key: 'other', label: 'Other' }, { key: 'w', label: 'W', field: 'waiting-on' }]))}`,
        `11 coauthor on collaborators too (hub:maryam): ${strip(entry('hub:maryam'), PEOPLE_COLL, undefined, withRoles([...ROLES.slice(0, 3), { key: 'coauthor', label: 'Coauthor', field: 'collaborators' }, ROLES[3]]))}`,
        `12 people registry keyed team (hub:maryam): ${strip(entry('hub:maryam'), { registry: 'people', id: 'hub:team' })}`,
        `13 key people, no registry, related [related-one] (hub:maryam): ${strip(entry('hub:maryam', { related: ['related-one'] }), {})}`,
        `14 organisation (hub:ut): ${strip(entry('hub:ut'), ORGS)}`,
        `14b organisation (hub:mst): ${strip(entry('hub:mst'), ORGS)}`,
        `15 resource named by two (hub:hpc): ${strip(entry('hub:hpc'), RES)}`,
        `15b resource named by none (hub:data): ${strip(entry('hub:data'), RES)}`,
        `16 second hub person (lab:maryam): ${strip(entry('lab:maryam'), PEOPLE_COLL)}`,
        `16b primary person of the same key (hub:maryam): ${strip(entry('hub:maryam'), PEOPLE_COLL)}`,
        `16c second hub organisation (lab:ut): ${strip(entry('lab:ut'), ORGS)}`,
        `16d second hub resource (lab:hpc): ${strip(entry('lab:hpc'), RES)}`
    ];
    console.log(lines.join('\n'));
});
```

The extra `jointWorkIds: []` on the planted people is read by neither tree's joins; it keeps one input for both runs.

First run (`TREE=.../O91-base/src`):

```
tree: /Users/axelfaes/workspace/oculus/.agents/worktrees/O91-base/src, roleLinks exported: false
1  collaborator only (hub:maryam): no strip
2  lead of one, collaborator on others (hub:steph): no strip
3  lead, supervisor and collaborator (hub:me): no strip
4  lead and collaborator of one project (hub:both): no strip
5  only at a dead stage (hub:deadonly): no strip
6  only at a stage of no group (hub:limbo): no strip
7  only in waiting-on (hub:waiter): no strip
8  roles collaborator before lead (hub:steph): no strip
9  a role on waiting-on (hub:waiter): no strip
9b a role on waiting-on (hub:steph): no strip
10 roles empty (hub:maryam): no strip
10b roles naming none of the three (hub:maryam): no strip
11 coauthor on collaborators too (hub:maryam): no strip
12 people registry keyed team (hub:maryam): no strip
13 key people, no registry, related [related-one] (hub:maryam): strip: in-flight[hub:related-one]
14 organisation (hub:ut): no strip
14b organisation (hub:mst): no strip
15 resource named by two (hub:hpc): no strip
15b resource named by none (hub:data): no strip
16 second hub person (lab:maryam): no strip
16b primary person of the same key (hub:maryam): no strip
16c second hub organisation (lab:ut): no strip
16d second hub resource (lab:hpc): no strip
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Last run (`TREE=.../migration-O91/src`):

```
tree: /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O91/src, roleLinks exported: true
1  collaborator only (hub:maryam): Collaborator: in-flight[hub:m-live] done[hub:m-done] ideas[hub:m-idea]
2  lead of one, collaborator on others (hub:steph): Lead: in-flight[hub:s-lead] | Collaborator: in-flight[hub:s-collab]
3  lead, supervisor and collaborator (hub:me): Lead: in-flight[hub:me-lead] | Supervisor: done[hub:me-sup] | Collaborator: ideas[hub:me-collab]
4  lead and collaborator of one project (hub:both): Lead: in-flight[hub:both] | Collaborator: in-flight[hub:both]
5  only at a dead stage (hub:deadonly): no strip
6  only at a stage of no group (hub:limbo): no strip
7  only in waiting-on (hub:waiter): no strip
8  roles collaborator before lead (hub:steph): Collaborator: in-flight[hub:s-collab] | Lead: in-flight[hub:s-lead]
9  a role on waiting-on (hub:waiter): no strip
9b a role on waiting-on (hub:steph): Lead: in-flight[hub:s-lead] | Collaborator: in-flight[hub:s-collab]
10 roles empty (hub:maryam): no strip
10b roles naming none of the three (hub:maryam): no strip
11 coauthor on collaborators too (hub:maryam): Collaborator: in-flight[hub:m-live] done[hub:m-done] ideas[hub:m-idea] | Coauthor: in-flight[hub:m-live] done[hub:m-done] ideas[hub:m-idea]
12 people registry keyed team (hub:maryam): Collaborator: in-flight[hub:m-live] done[hub:m-done] ideas[hub:m-idea]
13 key people, no registry, related [related-one] (hub:maryam): strip: in-flight[hub:related-one]
14 organisation (hub:ut): strip: in-flight[hub:ut-shared] done[hub:ut-other]
14b organisation (hub:mst): strip: done[hub:ut-other]
15 resource named by two (hub:hpc): strip: in-flight[hub:on-hpc-1] ideas[hub:on-hpc-2]
15b resource named by none (hub:data): no strip
16 second hub person (lab:maryam): Lab collaborator: in-flight[lab:lab-own]
16b primary person of the same key (hub:maryam): Collaborator: in-flight[hub:m-live] done[hub:m-done] ideas[hub:m-idea]
16c second hub organisation (lab:ut): strip: in-flight[lab:lab-own]
16d second hub resource (lab:hpc): strip: in-flight[lab:lab-own]
 Test Files  1 passed (1)
```

`case-run-hub.test.ts` (cases 19 to 21). It copies the demo hub of the tree named into `scratchpad/o91/hubs/case-*` and builds it with the fixture of that same tree:

```ts
// Case-run program of O91, cases 19-21: a copy of the demo hub of the tree TREE names, built as the
// watcher builds a workspace's primary hub, with three plantings. Prints the findings and the reads
// each case is about; asserts nothing. Writes only into a fresh scratch folder.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'vitest';

const TREE = process.env.TREE ?? '';

/** The demo hub copied to a fresh scratch folder, its config's collections list changed by `edit`. */
function plant(edit: (config: string) => string, files: Record<string, string> = {}): string {
    mkdirSync(join(import.meta.dirname, 'hubs'), { recursive: true });
    const base = mkdtempSync(join(import.meta.dirname, 'hubs', 'case-'));
    const dir = join(base, 'hub');
    cpSync(join(TREE, '..', 'tests/fixtures/hubs/demo'), dir, { recursive: true });
    const file = join(dir, '.oculus/config.yml');
    writeFileSync(file, edit(readFileSync(file, 'utf8')));
    for (const [path, text] of Object.entries(files)) {
        mkdirSync(join(dir, path, '..'), { recursive: true });
        writeFileSync(join(dir, path), text);
    }
    return dir;
}

/** The line a hub's list names the joint-work file with, flag and ticker category included. */
const JOINT =
    '  - { key: joint-work, file: ".oculus/data/academic/joint-work.yml", joint_work: true, ticker: { category: collab }, group: academic, order: 4 }\n';
const JOINT_FILE = [
    'title: Joint work',
    'schema:',
    '  - { field: key, type: text, primary_key: true }',
    '  - { field: title, type: text, display: 1 }',
    '  - { field: person, type: select, foreign_key: people }',
    '  - { field: deadline, type: date }',
    'entries:',
    '  - { key: w1, title: Work one, person: rivera-lab, deadline: "2026-11-01" }',
    ''
].join('\n');

/** The config with its joint-work line before the tasks line, whatever the tree's copy holds. */
function withJoint(config: string): string {
    const kept = config
        .split('\n')
        .filter((line) => !line.includes('key: joint-work'))
        .join('\n');
    return kept.replace('  - { key: tasks,', `${JOINT}  - { key: tasks,`);
}

function withoutJoint(config: string): string {
    return config
        .split('\n')
        .filter((line) => !line.includes('key: joint-work'))
        .join('\n');
}

it('prints cases 19 to 21', async () => {
    const { published, indexedOnce } = await import(`${TREE}/../tests/data/hubs/hubs-fixture.ts`);
    const { engineDir, loadConfig } = await import(`${TREE}/lib/data/sources/config.ts`);
    const { chatContext } = await import(`${TREE}/lib/data/sources/config/settings/files.ts`);
    const out: string[] = [`tree: ${TREE}`];
    const about = (text: string) => /joint|collab/i.test(text);

    // Case 19: the hub's own list names joint-work with joint_work: true.
    const one = plant(withJoint, { '.oculus/data/academic/joint-work.yml': JOINT_FILE });
    const built = published([{ name: 'hub', dir: one }], 'hub');
    const findings19 = [
        ...built.snapshot.findings.map((f: { file: string; message: string }) => `snapshot: ${f.file.replace(one, '<hub>')}: ${f.message}`),
        ...built.audit.findings.map((f: { message?: string; file?: string }) => `audit: ${String(f.file ?? '').replace(one, '<hub>')}: ${String(f.message ?? JSON.stringify(f))}`)
    ].filter(about);
    out.push(`19 findings naming joint or collab: ${findings19.length === 0 ? 'none' : '\n   ' + findings19.join('\n   ')}`);
    const config19 = loadConfig(engineDir(), { hub: one }).findings
        .filter((f: { message: string; key: string }) => about(`${f.key} ${f.message}`))
        .map((f: { file: string; key: string; message: string }) => `config: ${f.file.replace(one, '<hub>')}: [${f.key}] ${f.message}`);
    out.push(`19 config findings naming joint or collab: ${config19.length === 0 ? 'none' : '\n   ' + config19.join('\n   ')}`);
    // The editor's schema of the hub's .oculus/config.yml (hub-config), checked as the editor checks it.
    const { schemas } = indexedOnce([{ name: 'hub', dir: one }], 'hub');
    const { checkDocument, createChecker } = await import(`${TREE}/lib/data/snapshot/schema/check.ts`);
    const { textCatalog } = await import(`${TREE}/lib/data/sources/config/merge/text.ts`);
    const configFile = join(one, '.oculus/config.yml');
    const marks = checkDocument(
        { name: 'hub-config', file: configFile, text: readFileSync(configFile, 'utf8') },
        schemas.texts,
        createChecker(),
        textCatalog(loadConfig(engineDir(), { hub: one }).config)
    ).map((f: { key: string; message: string; line?: number }) => `line ${f.line}: [${f.key}] ${f.message}`);
    out.push(`19 hub-config schema marks: ${marks.length === 0 ? 'none' : '\n   ' + marks.join('\n   ')}`);
    const held = built.snapshot.entities.collections['hub:joint-work'];
    out.push(
        `19 collection hub:joint-work read: ${held === undefined ? 'no' : `yes, ${held.entries.length} entries, joint_work flag ${String(held.joint_work)}, ticker ${JSON.stringify(held.ticker)}`}`
    );
    // Case 21: the entry's ticker category collab.
    const cat = [...built.snapshot.findings, ...built.audit.findings].filter((f: { message?: string }) =>
        String(f.message ?? '').includes('ticker category')
    );
    out.push(`21 ticker category findings: ${cat.length === 0 ? 'none' : cat.map((f: { message?: string }) => f.message).join(' / ')}`);

    // Case 20: chat_context names joint-work and no collection is keyed so.
    const two = plant((config) => `${withoutJoint(config)}\nchat_context: [funding, joint-work, tasks]\n`);
    const map = loadConfig(engineDir(), { hub: two }).config;
    const problems: unknown[] = [];
    out.push(`20 chatContext read: ${JSON.stringify(chatContext(map, problems))}, problems: ${JSON.stringify(problems)}`);
    const built20 = published([{ name: 'hub', dir: two }], 'hub');
    const findings20 = [...built20.snapshot.findings, ...built20.audit.findings]
        .map((f: { message?: string }) => String(f.message ?? ''))
        .filter((m: string) => m.includes('chat_context') || about(m));
    out.push(`20 findings naming chat_context, joint or collab: ${findings20.length === 0 ? 'none' : findings20.join(' / ')}`);
    console.log(out.join('\n'));
}, 60000);
```

First run (`TREE=.../O91-base/src`):

```
tree: /Users/axelfaes/workspace/oculus/.agents/worktrees/O91-base/src
19 findings naming joint or collab: none
19 config findings naming joint or collab: none
19 hub-config schema marks: none
19 collection hub:joint-work read: yes, 1 entries, joint_work flag true, ticker {"category":"collab"}
21 ticker category findings: none
20 chatContext read: ["funding","tasks"], problems: []
20 findings naming chat_context, joint or collab: none
 Test Files  1 passed (1)
```

Last run (`TREE=.../migration-O91/src`):

```
tree: /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O91/src
19 findings naming joint or collab: 
   snapshot: <hub>/.oculus/config.yml: ticker category collab names no word of ticker_categories; the entry gives no ticker lines
19 config findings naming joint or collab: none
19 hub-config schema marks: 
   line 21: [collections[12].joint_work] key collections[12].joint_work is not declared by the schema of this file
   line 21: [collections[12].ticker.category] collections[12].ticker.category is collab, which is not a key of ticker_categories
19 collection hub:joint-work read: yes, 1 entries, joint_work flag undefined, ticker undefined
21 ticker category findings: ticker category collab names no word of ticker_categories; the entry gives no ticker lines
20 chatContext read: ["funding","tasks"], problems: []
20 findings naming chat_context, joint or collab: none
 Test Files  1 passed (1)
```

## Doc text

`git show HEAD:docs/data-map.md | grep -n -i joint` at `eeafcd4cb`, then line 180 read from the same file:

```
46:| `joint-work` | none | `.oculus/data/academic/joint-work.yml` | a piece of work with one person | `key` | Joint work, Person |
```
removed

```
69:| Funding, Talks & Events, Education & Service, Applications, Joint work, Tasks, Memories | Academic Life | their files, and the photo wall's pictures |
```
`| Funding, Talks & Events, Education & Service, Applications, Tasks, Memories | Academic Life | their files, and the photo wall's pictures |`

```
72:| Person | opened from a person's name | one person, with their organisations, joint work and projects |
```
`| Person | opened from a person's name | one person, with their organisations and projects |`

```
179:joint-work:
180:  person: people key
```
both removed
