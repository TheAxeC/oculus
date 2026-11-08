# Step O173 refuter report (on .agents/worktrees/migration-O173, base c116b57ad)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ env -u TMPDIR npm run test:quick -- <the nine paths of Verify 1>
test:quick: 9 changed file(s), from the given paths
test:quick: 31 test file(s)
        tests/checks/imports/augments.test.ts: scans the source text of a changed file
        tests/checks/imports/cycles.test.ts: scans the source text of a changed file
        tests/checks/imports/order.test.ts: scans the source text of a changed file
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (2.5 s)
ok      svelte-check (9.5 s): 1794181953981 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (53.4 s): Duration  41.96s (transform 24.53s, setup 0ms, import 54.82s, tests 97.28s, environment 6ms)
ok      vitest slow (79.0 s): Duration  67.56s (transform 37.77s, setup 0ms, import 61.81s, tests 126.27s, environment 1ms)
ok      vitest checks (81.3 s): Duration  69.81s (transform 22.61s, setup 0ms, import 47.87s, tests 172.79s, environment 4ms)
test:quick: 83.8 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source, tests/checks/tree and
            tests/checks/imports, which run for any change under src, tests or
            utils; the build, the lint of unchanged files

$ env -u TMPDIR npx vitest run tests/routes/docs/audit.test.ts tests/server/edit/config-value.test.ts --reporter=dot
first invocation:  Test Files  1 failed | 1 passed (2) / Tests  2 failed | 60 passed (62)
second invocation: Test Files  2 passed (2) / Tests  62 passed (62)
(see "Declined to judge" for the two reds of the first invocation)

$ env -u TMPDIR npx vitest run tests/server/edit/config-value.test.ts --reporter=verbose   (three times)
Tests  24 passed (24), each of the three runs

$ env -u TMPDIR npx vitest run tests/routes/docs/audit.test.ts --reporter=verbose --testTimeout 20000 -t "the required files of the audit|the shape of the audit setting"
13 named rows of 'the required files of the audit' (8 existing, 5 new) and 5 of 'the shape of the audit setting' (3 existing, 2 new), all passed
Test Files  1 passed (1) / Tests  18 passed | 20 skipped (38)

Verify 3, grep -rn with --exclude=local.yml over src tests docs config, the .svg and .dot left out:
required_files 34 hits, stageMeets 3, blockHolds 13, word block 46, SCANNERS 4, tests/checks/tree 8; the required_files, SCANNERS and tests/checks/tree hits read and agree with the report's list

History-words grep (the report's form is abbreviated with "..."; run in full over the added lines of `git diff c116b57ad`, the words of the rules file's list): nothing printed

$ LC_ALL=C grep -n '[^ -~]' <the nine paths> docs/diagrams/writes.dot docs/diagrams/writes.svg
nothing printed

$ sh utils/unused-exports.sh | diff - /Users/axelfaes/workspace/oculus/.agents/worktrees/O173-base/unused-exports.txt
exit 0, no difference

$ ls docs/glossary.md
ls: docs/glossary.md: No such file or directory

$ grep -n "required_files" docs/HELP.md docs/decks.md
nothing printed

$ ls docs/adr
ls: docs/adr: No such file or directory

Report's line counts, wc -l: setting.ts 183, projects.ts 598, rules.ts 373, words.ts 100, behavior.yml 1628, templates.md 1942, audit.test.ts 790, config-value.test.ts 530, quick.mjs 311: all as the report gives them. The added and removed counts agree with `git diff c116b57ad --stat`.

Doc text: the report's line for guarded.md:189 equals the file's line 189 (`diff` exit 0); the replacement differs from it only by "the tier, " in the parenthesis (`cmp` exit 0 after removing it).

Added for the diagrams question:
$ env -u TMPDIR npx vitest run tests/checks/diagrams/diagrams.test.ts --testTimeout 0 --hookTimeout 0 --reporter=verbose -t "committed|stale|differs|source they are"
the committed diagrams > are what the source gives now, each file byte for byte: passed
Test Files  1 passed (1) / Tests  5 passed | 42 skipped (47)

Brief premises, against `git show c116b57ad:<path>`: setting.ts 167 lines, RequiredFile :25, FILE_FIELDS :110; projects.ts 592 lines, stageMeets :263; quick.mjs :11, :32, :47, :307; data-map.md :117; FLAG_SOURCES has no tiers entry; `from: tiers` at config/options/catalogs/vocab.yml:306: all reproduce. The refusal of flags is at schemas/options.ts:173 on this base, the brief says :174; the fact reproduces.

`git status --short` after every run: the same 12 lines as before them.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds, `src/lib/server/content/audit/setting.ts:122` and `:128` (`wordBlock.omit({ flags: true, not_flags: true })`, a strict object still), `RequiredFile` at `:28-34`; C5 and C10 pass.
- 2: holds, `rules.ts:57` and `:169`, `tierMeets` at `projects.ts:268-270`, the skip at `:283`, `isPersonal` left at `:279`; C1, C2, C3, C4 and C6 pass.
- 3: holds, `config/options/behavior.yml:27` names `tiers` among the keys, the field at `:36-39` with `control: words`, `from: tiers` and a help in the shape of `stages`' help.
- 4: holds, `docs/templates.md:291-295` and the example row after `:306`, the comment block's line shape kept.
- 5: holds, `RequiredFile` in `setting.ts`, the comment of `requiredFiles`, the head comment of `words.ts` and the comment of `blockHolds` all name the tier; a grep of comments listing `stages`, `chips` and `forms` found no other sentence the diff makes false. A new comment the step wrote is false: Standards 1, which is no part of this item's list.
- 6: holds, `tests/tiers/quick.mjs:48`, the comments at `:11` and `:32`, the log lines at `:308-310`; the comment above `SCANNERS` is true of `tests/checks/imports/`, whose three tests read the imports of the whole tree.
- 7: holds, the tests are in the describes and in `LAB_ROWS` the brief names; each passes in the rerun.

Cases of the brief's "Cases":

- C1: met, the first row of the table at `tests/routes/docs/audit.test.ts:236-309`; scope `projects/a` alone, `projects/b` holding the file and `projects/c` of tier software.
- C2: met, the row with `tier: undefined`, scopes `[]`.
- C3: met, the row with `not_words: [software]`, scopes `projects/a` and `projects/c`.
- C4: met, the row naming `tiers` and `stages`, scope `projects/a`.
- C5: met, the row 'a list in place of a block'; `shapeKeys` gives `audit.required_files.0.tiers` and the second row still runs.
- C6: met, the row with `tiers: { words: [personal] }`; the project is held to no row by `isPersonal`.
- C7: met, the eight existing rows of the describe are unchanged in the diff and pass in the verbose run above.
- C8: met, the list of Verify 1 chooses the three imports checks; on the unchanged tree the reading of `git show c116b57ad:tests/tiers/quick.mjs` `:47` gives two folders, and `docs/` is not in `SCANNED`.
- C9: not verifiable, only a page shows it; the look on landing settles it: Settings, heading Boards, section Audit checks, `audit.required_files`, a row's `tiers` control after `stages` offering `research`, `personal` and `software` under Words and Not words.
- C10: met, the row 'a block naming flags'; the problem at `audit.required_files.0.tiers`, the row off, the good row still running.
- C11: met, the row of `LAB_ROWS`, `tests/server/edit/config-value.test.ts:440-449`, and the assertion at `:469` that no finding of the config channel names the key.

Whether the two diagram files may lie outside the write list: yes, the claim holds. `utils/diagrams/diagrams.mjs:198-207` writes `docs/diagrams/<name>.dot` and `.svg`, the rules file's "Token discipline" has `npm run diagrams` run right before each run of the list, and a call the write reader cannot follow is drawn under its `file:line`. The head comment of `words.ts` grew by one line, which moves `stringItemsShape.parse(` from `:26` (`git show c116b57ad:src/lib/data/shapes/boards/words.ts`) to `:27`. The diffs of both files change that label and no position. The test 'are what the source gives now, each file byte for byte' passes on this tree, and it compares every committed diagram with the source byte for byte. The report names both paths with the reason, as "Where you work" asks. `test:quick -- <the nine paths>` does not choose `tests/checks/diagrams/`, so that test is the proof and the list is not. Both paths have to be carried at landing.

## 1. Spec

none

## 2. Proof

none

## 3. Standards

- `src/lib/server/content/audit/setting.ts:119-120`: "A word block of the tiers: `words` and `not_words`, since a tier carries no flags, so a block naming flags is not of this shape."; what is wrong: the rules file's "What every package obeys" holds a comment to being true of the code, and this one is false of the tree. `config/catalogs/vocab.yml` holds `research: { label: Research, unmarked: true, default: true }`, and `flagsOf` at `src/lib/data/shapes/boards/words.ts` defines a flag as a field a row holds as `true`, so the tiers carry `unmarked` and `default`. The step's own test writes `{ flags: [default] }`. What holds is the brief's Decision 1, "as far as the form and the config check go": `FLAG_SOURCES` has no entry for `tiers` and `schemas/options.ts:173` refuses flags on such a block; failure scenario: a maintainer who reads the comment concludes that `flagsOf` over `tiers` gives nothing and that the rows hold no flag fields, and is misled about why `flags` is left out when adding a tier flag or `FLAG_SOURCES` entry; verdict: none, the code of item 1 holds.
- `tests/server/edit/config-value.test.ts:375-384`: "...READER_FINDINGS.flatMap((find) => find(where, read.config))"; what is wrong: the rules file's "The principles every package is judged on" asks for a grep of `src` and `tests` for a helper's name and key call before it is written, reuse of what exists, and that grep quoted in the report. The report quotes no such grep for `findingsNaming`, `tierMeets`, `tiersBlock` or `TierRow`. The same key call is the body of `readerFindings` in `tests/data/sources/config/layers/layers-fixture.ts:46-52`, whose head comment says "One copy, so each test file says only its rows". That fixture takes no engine and uses `engineDir()`, while this test passes a scratch engine, which may be the reason to differ; the report does not say so, and its judgment call on `findingsNaming` names only `READER_FINDINGS`; failure scenario: a change to the shape of `where` or to how the readers are run is made in one of the two places, and the other test goes on running the readers the old way; verdict: none.
- `.scratch/migration/agents/reviews/O173-report.md` (no section holds it): the report states nothing for the new key `tiers` when empty, duplicated or colliding; what is wrong: the rules file's "What every package obeys" says "Every id or key a step introduces is checked empty, duplicated, and colliding with a configured or reserved key ... The report states what the code does in each case." By reading: `tiers: {}` parses and places no condition; `tiers: { words: [] }` parses and the row then holds for no project, with no finding; `tiers: null` is the problem `audit.required_files.<n>.tiers`. A key named twice in a row was not read (see "Declined to judge"); failure scenario: a hub writes `tiers: { words: [] }`, the row silently asks nothing of any project, and the orchestrator was never told that this is what the code does; verdict: none.

## 4. Behaviour

none

## Declined to judge

- The cause of the two reds in the first invocation of Verify 2. I kept only the tail of that output, which showed a code frame at `tests/server/edit/config-value.test.ts:137-139`, the first `it` of the describe 'a keyed list or a family written as what the merge gives back', which the diff does not touch. The frame's place fits a timeout at vitest's default limit, since the command names no `--testTimeout` and that describe is tagged slow, but this is not verified. The next invocation and three runs of the file passed. The machine's load average was 4.84 to 8.60 a few minutes later.
- The cases' first run on the unchanged source (the report's table). Reproducing it needs the new tests in a copy of the base tree, and this review changes nothing, in place or in a copy. The counts it gives (5 failed, 13 passed; 1 failed, 6 passed) agree with the 18 and 7 rows the same filters select now. The tests were read.
- The report's "Full-list runs: 2", "No whole-suite command was run" and the `svelte-check` run of 4648 files. They are facts of the builder's session, and no decision rests on them.
- What a key named twice in one row does, which depends on how the YAML reader treats a duplicate. It was not read, and a run would need a scratch hub.
- C9, and how the empty Flags and Not flags lists look on the form: a page shows them. `forms` at `config/options/catalogs/vocab.yml` is an existing block drawn from a list with no flag source, so such empty lists are not new to this step.
- What git would stage for the two diagram files: `git add` on the paths at landing settles it, and it is not a command of this review.

Reviewer usage: a0a900d566b589741, claude-opus-5-5, 195803 tokens, 27 tool uses, 12.8 min.
