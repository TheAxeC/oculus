# Step O138 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O138, base ceb3622c0)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ git status --short
 M config/catalogs/vocab.yml
 M docs/HELP.md
 M docs/templates.md
?? .scratch/migration/agents/briefs/O138-cases.md
?? .scratch/migration/agents/reviews/O138-report.md

$ grep -rln "position_stages\|statuses" tests | sort
tests/checks/config/config-folder.test.ts
tests/checks/tree/layer-rows.ts
tests/data/shapes/catalog-files/vocab.test.ts
tests/data/snapshot/schema-rules.test.ts
tests/data/sources/config/layers/hub-vocab.test.ts
tests/data/sources/config/layers/manifest-fields.test.ts
tests/data/sources/feeds.test.ts
tests/routes/apps/approve.test.ts
tests/state/forms/new-entry.test.ts
tests/state/shared/hub-words.test.ts
tests/state/workbench/count-row.test.ts
(the eleven, less approve.test.ts and layer-rows.ts, are the nine files the builder ran)

Verify 1:
$ npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts tests/data/snapshot/schema-rules.test.ts tests/checks/config/config-folder.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/layers/manifest-fields.test.ts tests/data/sources/feeds.test.ts tests/state/forms/new-entry.test.ts tests/state/shared/hub-words.test.ts tests/state/workbench/count-row.test.ts --reporter=dot
 Test Files  9 passed (9)
      Tests  177 passed | 2 skipped (179)

Verify 2:
$ npm run diagrams        (git status --short after it: the same five lines as above)
$ npm run test:quick
test:quick: 5 changed file(s), from git since HEAD
test:quick: 2 test file(s)
        tests/checks/config/templates.test.ts: named for a changed file
        tests/data/shapes/catalog-files/vocab.test.ts: named for a changed file
ok      prettier (2.2 s): All matched files use Prettier code style!
ok      ASCII gate (2.5 s)
ok      svelte-kit sync (4.7 s)
ok      svelte-check (12.5 s): 1793736387548 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (15.6 s): Duration  1.06s (transform 449ms, setup 0ms, import 927ms, tests 20ms, environment 0ms)
ok      vitest (24.9 s): Duration  10.30s (transform 1.36s, setup 0ms, import 2.26s, tests 7.93s, environment 0ms)
test:quick: 29.9 s; every command passed
(5 changed files against the builder's 4: the report file did not exist at the builder's run)

Verify 3:
$ LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' config/catalogs/vocab.yml docs/templates.md docs/HELP.md; echo "perl exit $?"
perl exit 0
(the same gate over .scratch/migration/agents/reviews/O138-report.md: prints nothing, exit 0)

Verify 4:
$ python3 -c "import yaml; yaml.safe_load(open('config/catalogs/vocab.yml'))"; echo "yaml exit $?"
yaml exit 0

The case-run program: the scratchpad's cases.test.mts compared with the report's quoted source: identical (diff exit 0); cases.config.mts identical to the quoted 12 lines.

After run, from the worktree root:
$ npx vitest run --config /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o138/cases.config.mts
openCount (applications) = 3
[interview] radar deadline line: no
[interview] awaiting box applications: yes
[interview] Job applications stack: Interview #7c3aed (purple)
[interview] counted in openCount: yes
[interview] statusTone: purple
[interview] band card countdown: none
[interview] tasks-section lines (follow-up, subtask):  "at-interview: prepare at-interview", followup "at-interview - write to at-interview"
[offered] radar deadline line: no
[offered] awaiting box applications: yes
[offered] Job applications stack: Offered #0d9488 (teal)
[offered] counted in openCount: yes
[offered] statusTone: teal
[offered] band card countdown: none
[offered] tasks-section lines (follow-up, subtask):  "at-offered: prepare at-offered", followup "at-offered - write to at-offered"
[applied] radar deadline line: no
[applied] awaiting box applications: yes
[applied] Job applications stack: Applied #0891b2 (cyan)
[applied] counted in openCount: yes
[applied] statusTone: cyan
[applied] band card countdown: none
[applied] tasks-section lines (follow-up, subtask): none
C4 Interview row: {"label":"Interview","color":"#7c3aed","statuses":[]}
C4 findings: 0
C5 closestWord('interveiw') = interview
C5 finding: status "interveiw" is not a word of the statuses list; the closest word is interview
C5 finding: entries[0].status is interveiw, which is not one of active, applied, interview, offered
C6 finding: entries[0].status is interview, which is not one of active, applied
 Test Files  1 passed (1)
      Tests  1 passed (1)
(line for line the report's "after" output)

First run: the base copy holds no node_modules, so the program was run with O138_TREE set to a scratch copy (/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/rev-o138-base: the worktree's src, config, tests, assets, .svelte-kit and top-level config files, node_modules linked, config/catalogs/vocab.yml from `git show ceb3622c0:config/catalogs/vocab.yml`; `diff -q` against O138-base's vocab.yml equal, `diff -rq` of its src against O138-base/src equal). The program itself unchanged:
openCount (applications) = 1
[interview] radar deadline line: yes, position "at-interview" -33d
[interview] awaiting box applications: no
[interview] Job applications stack: none
[interview] counted in openCount: no
[interview] statusTone: grey
[interview] band card countdown: no card
[interview] tasks-section lines (follow-up, subtask):  "at-interview: prepare at-interview", followup "at-interview - write to at-interview"
[offered] radar deadline line: yes, position "at-offered" -33d
[offered] awaiting box applications: no
[offered] Job applications stack: none
[offered] counted in openCount: no
[offered] statusTone: grey
[offered] band card countdown: no card
[offered] tasks-section lines (follow-up, subtask):  "at-offered: prepare at-offered", followup "at-offered - write to at-offered"
[applied] radar deadline line: no
[applied] awaiting box applications: yes
[applied] Job applications stack: Applied #0891b2 (cyan)
[applied] counted in openCount: yes
[applied] statusTone: cyan
[applied] band card countdown: none
[applied] tasks-section lines (follow-up, subtask): none
C4 Interview row: null
C4 findings: 1
C4 finding: statuses.interview | statuses sets interview to null, which oculus's map does not hold
C5 closestWord('interveiw') = none
C5 finding: status "interveiw" is not a word of the statuses list
C5 finding: entries[0].status is interveiw, which is not one of active, applied, interview, offered
C6 finding: status "interview" is not a word of the statuses list
C6 finding: entries[0].status is interview, which is not one of active, applied
 Test Files  1 passed (1)
(line for line the report's "first run" output)

Other evidence the report quotes, rerun:
$ diff -rq <O138-base>/{config,docs,src,tests,utils} <worktree>/...
Files .../O138-base/config/catalogs/vocab.yml and config/catalogs/vocab.yml differ
Files .../O138-base/docs/HELP.md and docs/HELP.md differ
Files .../O138-base/docs/templates.md and docs/templates.md differ
$ sh utils/unused-exports.sh > <scratch>; diff <scratch> O138-base/unused-exports.txt; echo "diff exit $?"
diff exit 0     (335 lines)
$ awk lengths, worktree / base: 1505: 136/136, 1538: 75/75, 1560: 198/178, 1577: 92/86, 1578: 80/66, 1600: 135/135, 1612: 74/74
$ grep -rni "interview" src tests docs README.md utils config --exclude=local.yml
docs/templates.md:1560, docs/templates.md:1577, docs/HELP.md:296, config/catalogs/vocab.yml:155, config/catalogs/vocab.yml:205 (only these)
$ grep -rn "`offered`|'offered'|\"offered\"|offered:|, offered|offered\]|\[offered|\"Offered\"" ...
as a status only config/catalogs/vocab.yml:156, :206, docs/templates.md:1560, :1577, docs/HELP.md:296; every other hit an English verb or a variable name
$ grep -rn "planned, ongoing\|todo, doing\|not-applied, active\|declined, withdrawn or applied\|withdrawn, applied" src tests docs README.md utils config --exclude=local.yml
tests/fixtures/hubs/demo/.oculus/data/academic/tasks.yml:8, tests/data/shapes/catalog-files/vocab.test.ts:209 and :274, config/defaults/layout.yml:322 (the report's four hits)
$ git diff -U0 ceb3622c0 | grep '^+[^+]' | grep -i -E "before|used to|no longer|still|...|O1[0-9][0-9]|20[0-9][0-9]-"
one hit, HELP:296 "...a follow-up with its Not before date...", a field name on the base line too
$ diff <(sed -n 197,198p .scratch/migration/orchestrator-state.md) <(report lines 9-10 less "> ")
equal: the open items are quoted verbatim
$ sed -n 370,371p;323p config/text/findings.yml
not_allowed / status_not_in_vocab / status_unknown at the lines the report cites
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `config/catalogs/vocab.yml:155-156` are the two rows right after `applied`, key column padded as the rows around them, with `live_subtasks: true` as ruling 664 (a) in O138-cases.md dictates, byte for byte.
- 2: holds. `vocab.yml:203-206` add Interview `#7c3aed [interview]` and Offered `#0d9488 [offered]` after Applied; Active and Applied re-padded so `color:` aligns over four rows (judged under Spec: within the write range 199-202, values unchanged, the alignment the item asks for).
- 3: holds. `docs/templates.md:1560` options read `[active, applied, interview, offered, accepted, not-applied, declined, rejected, withdrawn]`; :1577-1578 are the two dictated lines at 92 and 80 columns. Ruling 663 (a): :1505 `[ongoing, planned, completed]`, :1538 `# required: ongoing, planned or completed`, :1600 `[doing, todo, done, dropped]`, :1612 `# required: doing, todo, done or dropped`, each at its base column (widths 136, 75, 135, 74 on both trees).
- 4: holds. HELP:296's parenthesis reads ``(`submitted`, `under-review`, `applied`, `interview` and `offered` in oculus's)``, and those five are exactly the words of `statuses:` carrying `deadline_met` (`vocab.yml:110,129,154-156`).
- 5: holds. `diff -rq` of src against the base copy prints nothing.

Cases of the brief's "Cases":

- C1: met. The case-run program's after run: no radar line, in `waiting().applications`, Interview stack `#7c3aed` (purple), counted; first run: radar line -33d, not awaiting, no stack, not counted. The DOM look is on landing.
- C2: met. The same for `offered`, Offered stack `#0d9488` (teal).
- C3: met. The `applied` rows are identical in both runs.
- C4: met. After: `{"label":"Interview","color":"#7c3aed","statuses":[]}`, 0 findings; base: no row and one finding.
- C5: met. `closestWord('interveiw') = interview`, and the entry's finding names it (`status_not_in_vocab`).
- C6: met. Base: `status_unknown` and `not_allowed`; after: `not_allowed` only.
- C7: met, by reading the diff of the three blocks; `src/lib/data/sources/documents/templates.ts:1-15` says the Make reader writes the block under each heading as the page has it.
- C8: met under ruling 664 (a). After: the deadline line leaves the radar and the follow-up and subtask lines stay for `interview` and `offered`; `applied`'s leave. Read: `ticker.ts:461-466` and `:522-527` skip only on `closesDeadline && !statusFlag(..., 'live_subtasks')`, and the `applied` row (closes_deadline without live_subtasks) shows the skip firing, so the lines that stay are kept by `live_subtasks`.
- C9: met. `statusTone` gives purple and teal after the change and grey before it; the chip itself is seen on landing.
- C10: met. `bandItem` (`focus-lanes.ts:207-217`) leaves `deadline` unset under `deadline_met`/`closes_deadline`, and the program prints "none" for both; the DOM look is on landing.

## 1. Spec

- none. The re-padding of the Active and Applied rows (`vocab.yml:203-204`, `"Active",    color:` and `"Applied",   color:`) is inside the brief's write range 199-202. It is what item 2's "aligned as the rows above are" needs once a nine-letter label joins the list, as `fund_stages` pads to "Submitted". It changes no parsed value (hub-vocab.test.ts passes), and the report names it as a judgment call. The widened paths (1505, 1538, 1600, 1612) come from ruling 663 (a) in O138-cases.md. No script beyond the case-run program shows in the diff or the report (the `awk` and `grep` calls only read).

## 2. Proof

- none. The case-run program calls the real readers rather than constants: `ticker(snap, RAW, now)` (the radar lines in `overdue`/`deadlines` by `target.kind === 'entry'`, and the `tasks` lines for C8), `waiting(snap, RAW, {})`, `collectionLanes(snap, RAW)` (which runs `stagedEntries` and `bandItem`, giving the stack and the card's `deadline`), `statusTone` under `setVocab(workspaceVocabs(...))`, `closestWord`, `loadConfig` with the hub text and `READER_FINDINGS` for C4, and `builtHub(...).findings` for C5 and C6. One reader is called by its expression, not as itself: `openCount`. It is the store's own call (`rail-badges.svelte.ts:279-286`: `stagedEntries(collectionsOfKey(key), 'position_stages', configMap(), vocabOf)` counted as a Set), made without `vocabOf` over one hub's collections of key `applications`. For a single hub this is the same computation, and the report says so. Both runs reproduce the report's quoted outputs line for line.

## 3. Standards

- none. ASCII gate clean over the three files and the report. YAML parses. No code comment is changed. The two dictated YAML comment lines fill to 92 columns before a word that would pass 100. No history words were added. Every sentence that names the changed words was grepped (`applied`, `interview`, `offered`, `position_stages`, `live_subtasks`, `deadline_met`, "Job applications", "green badge", the old and new option orders, across docs, README.md, config with --exclude=local.yml, and src) and still reads true. That covers HELP:296 (the Awaiting box words, and "An entry whose status keeps its lines live (`live_subtasks`)..."), HELP:573, `docs/templates.md:492-497` (one Applied row as an example), `docs/data-map.md:109`, `config/options/catalogs/vocab.yml` (`statuses` and `position_stages` help), `config/options/sources.yml:80-89`, `config/defaults/sources.yml:30`, the comment over `statuses:` (`vocab.yml:101-108`), the group comment "# these statuses close an entry" over the new rows, and the head and doc comments of `focus-lanes.ts`, `ticker.ts:415` and `rail-badges.svelte.ts:273-277`. `config/defaults/layout.yml:319` gives applications no `match:` list, so no count row leaves the new words out.

## 4. Behaviour

- none. The report's before-and-after table covers each item the brief's report section lists: radar, awaiting box, Job applications column, badge, status chip, band countdown, follow-ups and subtasks, the three templates, and HELP. The findings change for a hub entry at `interview`/`offered` (no `status_unknown`) and for a near miss (closest word named) is stated with its first and after runs under C5 and C6.

## Declined to judge

- The DOM-level look of C1, C2, C9 and C10 (stack order and colour on the Focus band, the chip in the Applications view, purple `#7c3aed` against violet `#7c5cff` in each theme). Only the look on landing can settle it, as the brief and the report both say.
- The demo hub fixture `tests/fixtures/hubs/demo/.oculus/data/academic/tasks.yml:8` keeps `[todo, doing, done, dropped]`, and its applications options do not include the new words. Ruling 663 (a) and 660 (a) name only the templates and the research hub's files, and the demo hub's option lists are its own (its education list is `[ongoing, done]`), so no ruling asks for this change. Whether the demo hub should follow is Axel's call.
- Whether the builder edited the three files only with Edit/Write. The diff cannot show the tool used; the report names no other means.

Reviewer usage: afc96bfed496776c2, claude-opus-5-5, 168827 tokens, 46 tool uses, 9 min 43 s.

## Closed

- The review found nothing under the four headings, so O138 has no repair round. The demo hub fixture's option lists, which the reviewer declined to judge, are named by no ruling and stay as they are.
