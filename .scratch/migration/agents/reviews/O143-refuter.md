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
