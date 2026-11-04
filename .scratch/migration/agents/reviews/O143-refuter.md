# O143 review

## Verification lines, verbatim

All commands were run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O143` with `PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH`.

Verify 1, `npx vitest run tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/layers/hub-vocab.test.ts tests/checks/config/config-folder.test.ts tests/data/snapshot/schema-rules.test.ts`:
```
 Test Files  4 passed (4)
      Tests  139 passed | 2 skipped (141)
```

Verify 2, `npm run diagrams` and then `npm run test:quick` (afterwards `git status --short` printed only ` M config/catalogs/vocab.yml`, ` M docs/templates.md` and `?? .scratch/migration/agents/reviews/O143-report.md`):
```
test:quick: 2 test file(s)
        tests/checks/config/templates.test.ts: named for a changed file
        tests/data/shapes/catalog-files/vocab.test.ts: named for a changed file
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.9 s)
ok      svelte-check (10.1 s): 1793755224127 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (13.4 s): Duration  1.38s (transform 581ms, setup 0ms, import 1.17s, tests 33ms, environment 0ms)
ok      vitest (22.3 s): Duration  10.30s (transform 1.48s, setup 0ms, import 2.63s, tests 7.49s, environment 0ms)
test:quick: 25.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

Verify 3, `LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' config/catalogs/vocab.yml docs/templates.md`: printed nothing, `perl exit 0`.

Verify 4, `python3 -c "import yaml; yaml.safe_load(open('config/catalogs/vocab.yml'))"`: printed nothing, `yaml exit 0`.

I also re-ran these commands that the report quotes as evidence:
- spec.md's full ASCII gate over the two files: printed nothing, `gate exit 0`.
- `sh utils/unused-exports.sh` (output saved to my scratch folder), then `diff` against `O143-base/unused-exports.txt`: `diff exit 0`, 335 lines.
- `diff -rq` of the base copy against the worktree over `src tests utils config` with `--exclude=local.yml`: one line, `Files .../O143-base/config/catalogs/vocab.yml and config/catalogs/vocab.yml differ`.
- `git diff 9cdccce4e --numstat`: `1 0 config/catalogs/vocab.yml` and `2 2 docs/templates.md`.
- `wc -l`: 312 lines for `vocab.yml`, 1925 for `templates.md`.

The case-run program: I wrote the three quoted sources (`cases.mts`, `svelte-hook.mjs`, `svelte-hooks.mjs`) from the report into `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o143-reviewer/`. `cmp` against the builder's files in `.../scratchpad/o143-builder/` printed `same` for each of the three.

Run on the changed worktree with `npx tsx --import <scratch>/svelte-hook.mjs <scratch>/cases.mts`:
```
deadline_horizon_days = 90; now = 2026-11-04; deadline = 2026-12-01
C2 stopped: deadline radar lines 0
C2 withdrawn: deadline radar lines 0
C3 findings 0
C4 stopped: awaiting grants 0
C4 submitted: awaiting grants 1 "Scheme at submitted"
C7 stopped: task lines 0
C8 stopped: tone grey
```

For the base run I built a scratch tree at `.../scratchpad/o143-reviewer/base-tree`: a copy of the base copy's `src tests utils config`, with symlinks to the worktree's `node_modules`, `package.json`, `tsconfig.json` and `.svelte-kit`. Same command:
```
deadline_horizon_days = 90; now = 2026-11-04; deadline = 2026-12-01
C2 stopped: deadline radar lines 1 "Scheme at stopped"
C2 withdrawn: deadline radar lines 0
C3 findings 1
C3   entries[0].status: status "stopped" is not a word of the statuses list; the closest word is dropped
C4 stopped: awaiting grants 0
C4 submitted: awaiting grants 1 "Scheme at submitted"
C7 stopped: task lines 2 "Scheme at stopped - Chase the funder" "Scheme at stopped: Draft the budget"
C8 stopped: tone grey
```
Both runs match the report's quoted output line for line.

C1 read, `python3 -c "...['statuses'].get('stopped','ABSENT')"`:
- worktree: `{'color': '#9ca3af', 'closes_deadline': True}`
- base copy: `ABSENT`

## Item verdicts

1. Holds. `config/catalogs/vocab.yml:147` reads `  stopped:       { color: "#9ca3af", closes_deadline: true }`, right after `not-applied` at :146. It carries no other flag. `awk` gives brace column 18 on all 45 rows of the list, :147 included.
2. Holds. `docs/templates.md:1407` options read `[in-prep, planned, submitted, contributing, awarded, rejected, withdrawn, stopped]`, and :1437 reads `#                                 # awarded, rejected, withdrawn or stopped`. That line is 75 columns, inside the 88 of :1436. The diff touches no other line. The 100-column rewrap of spec.md:45 is a separate point, Standards S1.
3. Holds. Item 3's grep, re-run, prints the same hits the report's table names. None of them is made false by the change.

## Case verdicts

- C1 met. Absent on the base, `{'color': '#9ca3af', 'closes_deadline': True}` after (the python reads above).
- C2 met. A scheme at `stopped` gives 1 radar line on the base and 0 after; the control at `withdrawn` gives 0 on both. The program's result depends on the change: the base run gives 1.
- C3 met. The base gives 1 finding naming `dropped`; after, 0 findings.
- C4 met. 0 awaiting grants before and after, with the `submitted` control at 1 on both. The case is a guard, so equal results on both trees is the expected outcome.
- C5 met. The `awk` print of :1397-1451 shows the options and the comment naming `stopped`. `git show 9cdccce4e:docs/templates.md` shows the base lines without it.
- C6 met. The Applications options at :1565 and the comment at :1582-1583 are unchanged (`git diff` touches only :1407 and :1437) and name no `stopped`.
- C7 met. The base gives 2 task lines (the follow-up and the subtask); after, 0.
- C8 met. `grey` on both trees.

## Spec

The premises of "What is on the tree" reproduce on the base copy:
- vocab.yml :48, :52, :77, :101-108, :145 and :146
- tones.ts :34 and :229-231
- behavior.yml :62
- ticker.ts :290, :441 and :502
- focus.ts :708
- validate.ts :258-279
- findings.yml :372
- make.ts :20-23
- templates.md :1384, :1407, :1436-1437, :1462, :1510, :1565 and :1605
- HELP.md :562 and :565; data-map.md :104 and :226
- the research hub: `funding.yml` :11, :56 and :69; `grep -n 'statuses' .oculus/config.yml` exits 1; the two stopped entries carry no deadline, follow-up or subtask (`awk` over :50-80).

The builder had already reported the one imprecise pointer: vocab-keys.ts:188 is the return line of `wordFlag`. Every case's first run is given. No script is outside what the brief approves.

- Sp1 (spec.md:44): the report has no history-word grep. The rule asks for a grep of the added and changed comment lines for the listed words, quoted with each hit judged; the report contains none (`grep -n -i "history\|used to\|no longer\|previously" .../O143-report.md` exits 1). The step changed one comment line, `templates.md:1437`. My grep of the diff's added lines for the listed words and for package ids and dates exits 1, so nothing is wrong in the code. The gap is in the report. Failure scenario: the orchestrator, reading the report against spec.md, cannot see the check was made and has to run it itself.
- Sp2 (spec.md:73): the report does not say that the new key `stopped` was checked for empty, duplicated and colliding. `grep -n -i "collid\|duplicat"` over the report exits 1. Facts from my own reads:
  - `statuses:` holds the key once.
  - The word is also a key of `stages:` (vocab.yml:77). It joins ten words already in both maps on the base (the python intersection prints `accepted`, `building`, `de-risking`, `exploring`, `in-prep`, `nascent`, `published`, `revision`, `scoping`, `submitted`).
  - No code reads the two maps as one for a status. `statusMarkTone` (tones.ts:314-317) reads `stages` first, but only for project marks, and both rows are `#9ca3af`.
  
  So the code is right; the statement is missing from the report. Failure scenario: the same as Sp1.

## Proof

- P1: the report (`O143-report.md:316`) says the second grep, `grep -rn -e 'in-prep, planned' -e 'contributing, awarded' config docs src tests README.md --exclude=local.yml`, "hits only `docs/templates.md:1407` and `:1436`". My run of the same command also hits `tests/fixtures/hubs/demo/.oculus/data/academic/funding.yml:8`. The report judges that fixture in the next sentence (found there with `find`), and the decision to leave it unchanged rests on that reading, so no decision rests on the wrong count. Failure scenario: a reader trusting the grep sentence alone would think the demo hub's Funding options had not been looked at.
- P2: the report's quoted `test:quick` result lines (`O143-report.md:49-61`) stop at `every command passed`. The builder's own saved run (`.../o143-builder/quick.txt`) also printed the four `test:quick: not covered: ...` lines, and the quote leaves them out. The hub's working rule is that a green result states in the same breath what it does not cover. No bar was loosened and no check was exempted. Failure scenario: a reader takes the green list as covering tests that do not reach the changed files.

Nothing else was found: no bar loosened, no check exempted, and no case that would pass with the change taken out, except C4 and C8, whose cases ask for equal results before and after.

## Standards

- S1 (spec.md:45, "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short"). The place is `docs/templates.md:1436-1437`:
  ```
  #    status: in-prep              # required: in-prep, planned, submitted, contributing,
  #                                 # awarded, rejected, withdrawn or stopped
  ```
  - Line :1436 is 88 columns (`awk length`), and `awarded,` would bring it to 97, inside 100. So the edited comment keeps a line that ends short inside its sentence.
  - The base had the same short line. The brief asked for the line to be "kept within the comment's column" and lists :1436-1437 in its write list, so a rewrap of both lines was allowed.
  - The Applications comment at :1582-1583 wraps correctly at 100: `not-applied,` would reach 105.
  - Failure scenario: a reader of the template meets a comment wrapped by a different rule from the one spec.md states.
  - The fix is two lines at landing: :1436 ends `contributing, awarded,` and :1437 reads `# rejected, withdrawn or stopped`. Brief item 2's "kept within the comment's column" may be read as 88; the orchestrator judges which reading holds.
- Non-ASCII: none. Verify 3 and the full gate print nothing; `LC_ALL=C grep -n '[^ -~]'` over the report exits 1.
- History in the diff's added lines: none (grep above).
- Alignment of `vocab.yml:147`: aligned (brace column 18, like all 45 rows).
- Sentences made false. I ran greps of `stopped`, `withdrawn`, `not-applied` and `closes_deadline` across `config docs src tests README.md` (`--exclude=local.yml`) and read the hits about statuses and stages. None is made false:
  - the comment over `statuses:` (vocab.yml:101-108), still true;
  - the `stages:` comment (vocab.yml:52) and `pillars.yml:5` ("Dead-ends (failed or stopped)"), which name the project stage, still true;
  - data-map.md:104 ("each word in one list") and :226, still true, since the sentence names the kind of value and ten words were already in both maps;
  - focus-lanes.ts:204-206, task-card.ts:6-7 and rows.ts:13-14, still true.

  On whether a reader may confuse the two words: the `stages:` comment ties `stopped` to the manifest's `stage`, and the `statuses:` comment ties its words to a collection entry's `status`, so neither comment misleads. The status row carries no label. The research hub's own Funding schema (`funding.yml:11`) explains the word ("stopped is preparation ended before submission"); oculus's template help at :1407 stays "Where it stands." Whether it should say more is listed under "Declined to judge".

## Behaviour

- B1: the report's "Host- or user-visible changes" names the deadline radar's Deadlines and Tasks lines, the finding, the colour and the make item. It does not name these other readers of `closes_deadline`, which change for an entry at `stopped`:
  - `src/lib/views/shared/forms/entry/task-card.ts:29` (`if (closesDeadline(config, status) || deadlineMet(config, status)) return [];`). Failure scenario: an entry of a collection flagged `tasks` written with `status: stopped` showed the Start Agent control before the change and shows none after.
  - `src/lib/state/boards/focus/focus-lanes.ts:211`. Failure scenario: a Focus band card at `stopped` counted down to its deadline before the change and shows no countdown after. This can happen only in a hub whose own `fund_stages`, `position_stages` or `teaching_stages` lists `stopped`, since oculus's lists (vocab.yml:197-212) do not.
  - The settings editor's list of oculus's `statuses` gains a row (not verified on screen).
  
  None of these shows on the research hub as it stands. The look on landing reads the report's before-and-after section, which omits them.

## Declined to judge

- Whether the Funding template's help at :1407 ("Where it stands.") should tell `stopped` from `withdrawn`, as the research hub's own schema line does. The brief's item 2 names no help change; this is the user's call.
- Whether `docs/HELP.md` should gain a bullet. The builder judged no bullet (report judgment 4), and HELP.md lists no status words. Whether choosing `stopped` in a new hub's Funding select is something "a user does" in the sense of spec.md:72 is the orchestrator's reading.
- What the Findings view, the Focus board and the Funding view draw. Like the builder, I started no page; that is the look on landing.
- Whether the builder ran any git command beyond those allowed. Only the report's own account was available, and it names `git diff` and `git status --short`.

Reviewer usage: a0173c7cce622909c, claude-opus-5-5, 148258 tokens, 46 tool uses, 7 min 24 s

## Repair round 1, refuted

### Verification lines, verbatim

All commands were run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O143` with `PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH`.

Verify 1, `npx vitest run tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/layers/hub-vocab.test.ts tests/checks/config/config-folder.test.ts tests/data/snapshot/schema-rules.test.ts --reporter=dot`, exit 0:
```
 Test Files  4 passed (4)
      Tests  139 passed | 2 skipped (141)
```

Verify 2: `npm run diagrams` exited 0. After it, `git status --short` printed only ` M config/catalogs/vocab.yml`, ` M docs/templates.md` and the three `??` ledger files, so it rewrote nothing tracked. Then `npm run test:quick`, run once, exit 0:
```
test:quick: 5 changed file(s), from git since HEAD
test:quick: 2 test file(s)
        tests/checks/config/templates.test.ts: named for a changed file
        tests/data/shapes/catalog-files/vocab.test.ts: named for a changed file
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.8 s)
ok      svelte-check (10.1 s): 1793755997589 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (12.6 s): Duration  1.17s (transform 399ms, setup 0ms, import 973ms, tests 19ms, environment 0ms)
ok      vitest (21.4 s): Duration  9.90s (transform 1.35s, setup 0ms, import 2.32s, tests 7.44s, environment 0ms)
test:quick: 24.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

Verify 3, `LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' config/catalogs/vocab.yml docs/templates.md`: printed nothing, exit 0.

Verify 4, `python3 -c "import yaml; yaml.safe_load(open('config/catalogs/vocab.yml'))"`: printed nothing, exit 0.

spec.md's full ASCII gate over the two files: printed nothing, exit 0.

The round's `awk 'NR>=1436 && NR<=1437 {print length($0)": "$0}' docs/templates.md`:
```
97: #    status: in-prep              # required: in-prep, planned, submitted, contributing, awarded,
66: #                                 # rejected, withdrawn or stopped
```
The same `awk` over `git show 9cdccce4e:docs/templates.md` prints `88: ...contributing,` and `66: ...# awarded, rejected or withdrawn`.

Unused exports: `sh utils/unused-exports.sh` (output in my scratch folder, exit 0), then `diff ../O143-base/unused-exports.txt <that output>`: exit 0, no lines, 335 lines in each.

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O143-report.md`: exit 1, nothing printed.

`diff -rq --exclude=local.yml ../O143-base/<d> <d>` for `src tests utils config`: one line, `Files ../O143-base/config/catalogs/vocab.yml and config/catalogs/vocab.yml differ`.

`wc -l`: 312 `config/catalogs/vocab.yml`, 1925 `docs/templates.md`. `git diff 9cdccce4e --numstat`: `1 0 config/catalogs/vocab.yml`, `3 3 docs/templates.md`.

The round's delta. `diff -u` of each path in the snapshot's `files.txt` against the worktree: `config/catalogs/vocab.yml` exit 0, no difference. `docs/templates.md` has one hunk:
```
-#    status: in-prep              # required: in-prep, planned, submitted, contributing,
-#                                 # awarded, rejected, withdrawn or stopped
+#    status: in-prep              # required: in-prep, planned, submitted, contributing, awarded,
+#                                 # rejected, withdrawn or stopped
```
`git status --short` lists no changed path outside `files.txt`, apart from the three untracked ledger files: the round brief, the copied refuter report and the builder's report.

I reran the commands the round's section quotes as evidence, in the same form, and they match its claims:
- The history-word grep, run as `git diff 9cdccce4e -U0 | grep -E '^\+[^+]' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|\b[A-Z][0-9]+[a-z]?\b|20[0-9]{2}-[0-9]{2}"`, exits 1. The report's form is `git diff -U0` with no base; I named the base. The four added lines it reads are the four the report quotes.
- The key checks. A `python3` read of `vocab.yml` prints `empty key False`, `in statuses 1`, `lead_statuses has stopped False`, and the intersection `['accepted', 'building', 'de-risking', 'exploring', 'in-prep', 'nascent', 'published', 'revision', 'scoping', 'stopped', 'submitted']`. `grep -n "^  stopped:" config/catalogs/vocab.yml` prints `77:` (in `stages:`) and `147:` (in `statuses:`). An `awk` over the `statuses:` block alone counts 1.
- `grep -rln "'statuses'" src | xargs grep -ln "'stages'"` names the five files the report names. The lines it cites read as it says: `focus.ts:192` reads `statuses`; `:208`, `:233`, `:329`, `:528-529`, `:600-601`, `:638` and `:747` read `stages` for `project.stage`. Also `rules.ts:159-171`, `hub-keys.ts:20,23`, `sections/vocab.ts:30-32,48`, `hub-names.ts:729,732`, and `tones.ts:314-317`. `grep -rn statusMarkTone src` names only `CardFacts.svelte:101` and `LaneCard.svelte:137,147` as callers.
- The second grep, `grep -rn -e 'in-prep, planned' -e 'contributing, awarded' config docs src tests README.md --exclude=local.yml`, prints three hits: `docs/templates.md:1407`, `docs/templates.md:1436` and `tests/fixtures/hubs/demo/.oculus/data/academic/funding.yml:8`. These are the three the report names.
- Item 3's grep prints the hits of the report's table, no more and no fewer.
- The builder's saved round run (`.../scratchpad/o143-builder/quick-r1.txt`) holds the lines the report quotes, `22.8 s; every command passed` and the four `not covered` lines included.
- The B1 reads:
  - `task-card.ts:29` reads `if (closesDeadline(config, status) || deadlineMet(config, status)) return [];`.
  - `taskCardActions` is used at `Collection.svelte:422` and `Entry.svelte:331`.
  - `focus-lanes.ts:211` reads `if (!deadlineMet(words, status) && !closesDeadline(words, status)) {`.
  - `vocab.yml:197-212` holds `fund_stages`, `position_stages` and `teaching_stages`, and none of them lists `stopped`.

The case-run program: `cmp` shows the three scratch files (`.../scratchpad/o143-reviewer/` against `.../o143-builder/`) are the same. A `diff` of each against the source the report quotes (`O143-report.md:99-108`, `:114-133`, `:139-275`) is empty. Run with `npx tsx --import <scratch>/svelte-hook.mjs <scratch>/cases.mts`. On the worktree:
```
deadline_horizon_days = 90; now = 2026-11-04; deadline = 2026-12-01
C2 stopped: deadline radar lines 0
C2 withdrawn: deadline radar lines 0
C3 findings 0
C4 stopped: awaiting grants 0
C4 submitted: awaiting grants 1 "Scheme at submitted"
C7 stopped: task lines 0
C8 stopped: tone grey
```
On the scratch base tree, whose `vocab.yml` `cmp`-equals the base copy's:
```
deadline_horizon_days = 90; now = 2026-11-04; deadline = 2026-12-01
C2 stopped: deadline radar lines 1 "Scheme at stopped"
C2 withdrawn: deadline radar lines 0
C3 findings 1
C3   entries[0].status: status "stopped" is not a word of the statuses list; the closest word is dropped
C4 stopped: awaiting grants 0
C4 submitted: awaiting grants 1 "Scheme at submitted"
C7 stopped: task lines 2 "Scheme at stopped - Chase the funder" "Scheme at stopped: Draft the budget"
C8 stopped: tone grey
```
Both runs match the report's quoted output line for line. `git status --short` after them is unchanged.

### Closure of each round item

1. Standards S1: closed. The `awk` above shows `:1436` ending `contributing, awarded,` at 97 columns and `:1437` reading `#                                 # rejected, withdrawn or stopped`. The `#` columns are as they stood: the prefix of `:1437` is byte-equal to the base line's. Adding `rejected,` to `:1436` would make it 107 columns, over 100, so the fill is correct at 100. The finding was fixed in the comment itself; no check was removed. The round's delta touches only these two lines.
2. Spec Sp1: closed. `O143-report.md:332-349` quotes the grep, its exit 1 and the four lines it reads. My rerun exits 1 over the same four lines. The grep covers every added line, the one comment paragraph among them, plus package ids and dates. It is wider than spec.md:44 asks, not narrower.
3. Spec Sp2: closed. `O143-report.md:351-355` states the empty, duplicated and colliding checks, each with its read, and every read reproduces (above). The grep the report quotes names only files that hold both words as single-quoted literals. The sentence it supports ("No code reads the two maps as one") is wider than that grep: see Proof below. A wider grep that also matches `.statuses`/`.stages` and double-quoted keys names ten files. I read the extra five (`tones.ts:118-140,228-237`, `focus-lanes.ts:114,140,182`, `validate.ts:324-384,529`, `options.ts:768-782`, `data/index.ts:210-212`), and each keeps the two maps apart. `installed()` in `tones.ts` keeps `statuses` and `stages` as separate fields, and its `legend.words` is built from `stages`, `forms` and `chips`, not from `statuses`. So the conclusion holds.
4. Proof P1: closed. `O143-report.md:320` names all three hits my rerun prints, the demo fixture's `funding.yml:8` included, with the reading that leaves it unchanged.
5. Proof P2: closed. `O143-report.md:49-65` quotes the round's run with the four `not covered` lines, and the builder's saved `quick-r1.txt` holds them.
6. Behaviour B1: closed. `O143-report.md:382-384` adds all three items with a before and an after:
   - the Start Agent control (`task-card.ts:29`, with the two views that call it);
   - the band card countdown (`focus-lanes.ts:211`), with the condition that only a hub whose own `fund_stages`, `position_stages` or `teaching_stages` lists `stopped` shows it;
   - the settings editor's extra row, marked "Not verified on screen".

   My reads of the cited lines agree. The round adds no code or behaviour beyond its findings: the only change to a tracked file is the two-line rewrap.

### Item verdicts (the whole diff since the base)

1. Holds. `config/catalogs/vocab.yml:147` reads `  stopped:       { color: "#9ca3af", closes_deadline: true }`, right after `not-applied` at `:146`, aligned with the rows around it. It carries no `deadline_met` and no `default_application`.
2. Holds. `docs/templates.md:1407` reads `options: [in-prep, planned, submitted, contributing, awarded, rejected, withdrawn, stopped]`. `:1436-1437` reads "... contributing, awarded, / rejected, withdrawn or stopped", filled at 100 columns as round item 1 rules. `git diff 9cdccce4e` changes `:1407`, `:1436` and `:1437` and no other line of the template.
3. Holds. Item 3's grep, rerun, prints exactly the hits of the report's table (`O143-report.md:309-318`). None is made false: the language-server and app-request senses of "withdrawn" are unrelated, the Applications lines are kept by the ruling, and `schema-rules.test.ts:250` passes in verify 1. No path was widened.

### Case verdicts (the whole diff since the base)

- C1 met. `statuses.stopped` is `{'color': '#9ca3af', 'closes_deadline': True}` on the worktree and `ABSENT` on the base copy (the `python3` reads above).
- C2 met. Radar lines for a scheme at `stopped`: 1 on the base, 0 after. The control at `withdrawn` gives 0 on both.
- C3 met. The base gives 1 finding naming `dropped`; after, 0.
- C4 met. Awaiting grants at `stopped`: 0 on both trees. The `submitted` control gives 1 on both. This case is a guard, so equal results are its outcome.
- C5 met. The options line reads as the case says, and the entry comment names `stopped`. `git show 9cdccce4e:docs/templates.md` shows neither.
- C6 met. The Applications options `:1565` and the comment `:1582-1583` compare equal to the base's (the `diff` above printed `applications unchanged`) and name no `stopped`.
- C7 met. Task lines at `stopped`: 2 on the base (the follow-up and the subtask), 0 after.
- C8 met. The tone is `grey` on both trees.

### Spec

- Sp-r1-1 (spec.md:33). The place is `O143-report.md:431`:
  ```
  Git commands of this round: `git diff` and `git status --short`, plus one `git -C /dev/null status`, which spec.md:33 does not allow. It ran outside any repository, printed nothing, and changed nothing.
  ```
  - What is wrong: spec.md:33 bans `git -C` by name ("any other git command, `log`, `ls-files`, `rev-parse`, `check-ignore`, `git -C` ... you never run"). By the report's own account the builder ran it, and the report gives no reason for running it.
  - The harm: `/dev/null` is not a directory, so the command could reach no repository and change no state (my judgment, not verified, since I may not run it). The rule is still broken. The disclosure is honest.
  - Failure scenario: a builder that runs `git -C <path>` can read or change a repository other than its worktree, the main checkout included. The ban exists so that the orchestrator need not check where such a command pointed. Here it pointed nowhere, but the step's record now holds a disallowed command.
  - Nothing in the diff depends on the command.

### Proof

- P-r1-1. The place is `O143-report.md:431`, "printed nothing". By my judgment, git given `-C` with a path that is not a directory prints a `fatal: cannot change to '/dev/null'` error on stderr and exits non-zero. So "printed nothing" holds only if stderr was discarded, and the report does not say it was. I could not rerun it (the command is outside the reviewer's allowed git set), so this is not verified. Failure scenario: a reader takes "printed nothing" as an exact record of the run when the run likely failed with an error. No decision rests on it.
- P-r1-2. The place is `O143-report.md:355`:
  ```
  No code reads the two maps as one for an entry's status. `grep -rln "'statuses'" src | xargs grep -ln "'stages'"` names five files, and in each the two maps are read apart
  ```
  - What is wrong: the grep matches only single-quoted literal keys, so it does not enumerate what the sentence claims. Property reads (`words.statuses`, `merged.stages`, `vocab.stages`) in `tones.ts`, `focus-lanes.ts`, `validate.ts`, `catalog/options.ts` and `data/index.ts` fall outside it.
  - My wider grep and reads of those five files (Closure, item 3) show the claim is true, so no decision rests on the narrow evidence.
  - Failure scenario: a reader who trusts the quoted grep as the full enumeration would not know that `tones.ts` `installed()`, which builds both maps side by side, was ever looked at.

No bar was loosened, no check was exempted, and no finding was closed by removing a check. No test was added or changed: `diff -rq` over `tests` prints nothing.

### Standards

None over the round's delta:
- The rewrapped comment is filled at 100 columns, with `:1436` at 97 and the sentence ending on `:1437`.
- It is ASCII: verify 3 and the full gate print nothing.
- It carries no history word: the history grep exits 1.
- `:1436` is now the widest comment line of the Funding template (97; the next is `:1431` at 76). That follows from the 100-column fill, which round item 1 rules.

### Behaviour

None. The round changes no code and no config value. Its one change to a tracked file is the wrap of a comment inside the template that the make item writes (`make.ts:22`), so a new hub's `funding.yml` gets the two lines as rewrapped. The words are the same as before the round.

### Declined to judge

- What the Findings view, the Focus board, the Funding view, the task card's Start Agent control, the band card countdown and the Settings editor's `statuses` rows draw, and the order of the new row in that editor. I started no page; this is the look on landing.
- Whether `git -C /dev/null status` printed anything and what it returned. The command is outside the git commands this review may run, and the report's account is the only source.
- Why the builder ran `git -C /dev/null status`. The report gives no reason, and I did not guess one.
- Whether the Funding template's help "Where it stands." (`:1407`) should tell `stopped` apart from `withdrawn`, and whether `docs/HELP.md` should gain a bullet. Both were declined in the first review, and the round does not touch them; they are the user's and the orchestrator's calls.
- Whether the base copy and the scratch base tree hold every file the case-run program imports in its base form. I checked `vocab.yml` with `cmp`, and the scratch base tree was built from the base copy's `src tests utils config` in the first review. I did not recheck its other files.

Reviewer usage: a8f3618bbe491b67a, claude-opus-5-5, 137562 tokens, 24 tool uses, 5 min 2 s

## Closed

- First review, Standards S1, Spec Sp1 and Sp2, Proof P1 and P2, Behaviour B1: closed in repair round 1; the review over round 1 reproduced each closure.
- Over round 1, Sp-r1-1 (`git -C /dev/null status 2>/dev/null`, against `agents/spec.md:33`): the breach recorded in the booking; it reached no repository and nothing in the diff rests on it.
- Over round 1, P-r1-1: fixed at landing; `O143-report.md` names the command with its `2>/dev/null`, as the builder's transcript holds it.
- Over round 1, P-r1-2: fixed at landing; `O143-report.md` names the five further files the wider grep finds and that each keeps the two maps apart.
