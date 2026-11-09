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

## Repair round 1, refuted

```
$ env -u TMPDIR npm run test:quick -- <the nine paths of Verify 1> tests/data/sources/config/layers/layers-fixture.ts
test:quick: 10 changed file(s), from the given paths
test:quick: 35 test file(s)
        tests/checks/imports/augments.test.ts: scans the source text of a changed file
        tests/checks/imports/cycles.test.ts: scans the source text of a changed file
        tests/checks/imports/order.test.ts: scans the source text of a changed file
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (4.9 s)
ok      svelte-check (14.9 s): 1794182821281 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (62.7 s): Duration  45.61s (transform 27.02s, setup 0ms, import 66.66s, tests 106.37s, environment 18ms)
ok      vitest slow (83.1 s): Duration  65.80s (transform 35.59s, setup 0ms, import 62.71s, tests 121.11s, environment 4ms)
ok      vitest checks (88.0 s): Duration  70.74s (transform 18.24s, setup 0ms, import 45.02s, tests 172.17s, environment 5ms)
test:quick: 90.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source, tests/checks/tree and
            tests/checks/imports, which run for any change under src, tests or
            utils; the build, the lint of unchanged files

$ env -u TMPDIR npx vitest run tests/routes/docs/audit.test.ts tests/server/edit/config-value.test.ts --reporter=dot
Test Files  2 passed (2) / Tests  62 passed (62)

The round's report, for the callers of readerFindings:
$ env -u TMPDIR npx vitest run tests/server/edit/config-value.test.ts tests/routes/docs/audit.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/layers --reporter=dot --testTimeout 20000
Test Files  8 passed (8) / Tests  152 passed (152)

$ env -u TMPDIR npx vitest run tests/routes/docs/audit.test.ts --reporter=verbose --testTimeout 20000 -t "the required files of the audit|the shape of the audit setting"
Test Files  1 passed (1) / Tests  18 passed | 20 skipped (38), the five tiers rows of the required files and the two tiers rows of the shape among them

$ env -u TMPDIR npx vitest run tests/server/edit/config-value.test.ts --reporter=verbose --testTimeout 20000 -t "a list or family written into the hub the write names"
Test Files  1 passed (1) / Tests  7 passed | 17 skipped (24)

Verify 3, grep -rn with --exclude=local.yml over src tests docs config, the .svg and .dot left out, by file and line:
every hit of required_files, stageMeets, blockHolds, word block, SCANNERS and tests/checks/tree is in the report's list and every entry of the list is a hit. Four line numbers of the list are the positions from before the round's last change: setting.ts:124,156 are now :125,:157, and config-value.test.ts:436,443 are now :432,:439. The report's sentence "Every line number and count above is taken after this round's last change" is false of those four. Not a finding: no decision rests on them, the hits are the same lines moved.

Verify 4: the round adds and changes no test; see "Declined to judge" for the first run on the unchanged tree.
Verify 5: the round's two comments read against the rules file; no departure.

$ grep -rn -- <tierMeets, tiersBlock, TierRow, TiersCase, findingsNaming, wordBlock.omit, READER_FINDINGS> src tests
every line of the report's grep block reproduces. READER_FINDINGS also has config-checks.ts:43,88 and root/process/context/findings.ts:16,34, which the report's `READER_FINDINGS.flatMap` pattern does not hit and which are the src readers, not a copy of the test helper.

$ grep -rn "wordList(project\." src tests
projects.ts:269 is the one call holding a project's tier against a block; takes.ts:79 builds a word list for a take and holds no block. The key call of tierMeets is covered by Verify 3's blockHolds list.

$ LC_ALL=C grep -n '[^ -~]' <the ten paths> docs/diagrams/writes.dot docs/diagrams/writes.svg
nothing printed, exit 1

History words and package ids and dates, over the added lines of git diff c116b57ad on src, config, docs/templates.md and tests:
nothing printed, exit 1

$ sh utils/unused-exports.sh | diff - /Users/axelfaes/workspace/oculus/.agents/worktrees/O173-base/unused-exports.txt
exit 0, no difference

$ env -u TMPDIR npx vitest run tests/checks/diagrams/diagrams.test.ts --testTimeout 0 --hookTimeout 0 --reporter=verbose -t "committed|stale|differs|source they are"
the committed diagrams > are what the source gives now, each file byte for byte: passed
Test Files  1 passed (1) / Tests  5 passed | 42 skipped (47)

The round's delta, diff -u of the snapshot against the worktree for the 11 paths of files.txt, plus the fixture:
setting.ts (the comment above tiersBlock), audit.test.ts (TierRow to TiersCase, two lines), config-value.test.ts (the import and findingsNaming's body) and layers-fixture.ts differ; the other eight paths of files.txt are unchanged. `git status --short` lists the same 12 modified paths and 3 untracked ledger files, 15 lines, before and after every run. .agents/scratch is gone: `ls .agents/scratch` fails.

wc -l: setting.ts 184, projects.ts 598, rules.ts 373, words.ts 100, behavior.yml 1628, templates.md 1942, audit.test.ts 790, config-value.test.ts 526, quick.mjs 311, layers-fixture.ts 65: all as the report gives them. git diff c116b57ad --stat agrees with the report's added and removed counts.

The round's item 3, run in memory with no file written: a node program on stdin replaced node:fs readFileSync for one invented hub path and called hubAuditSetting and blockHolds, each row beside a good row { file: B.md }:
tiers: {}                  rows kept 2, problems [], holds research/software/no tier true/true/true
tiers: { words: [] }       rows kept 2, problems [], holds false/false/false
stages: { words: [] }      rows kept 2, problems [], holds false/false/false
tiers: null                rows kept 1 (B.md), problems ["audit.required_files.0.tiers"]
tiers: { words: [nosuch] } rows kept 2, problems [], holds false/false/false
tiers: { not_flags: [x] }  rows kept 1 (B.md), problems ["audit.required_files.0.tiers"]
tiers named twice          rows [], problems [], and yaml parse throws: Map keys must be unique at line 3, column 51:
The hand-written and duplicate rows of the report's table agree. value-rule.ts:200-201 is the refusal of a word outside `from`, reached for a row's field through config-fit.ts:368,387. config/text/findings.yml:5 holds 'does not parse: {0}'; tests/checks/config/config.test.ts:170-180 reads it. rowsOf looks a row's key up with Object.hasOwn at setting.ts:100.
```

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- 1: holds, `setting.ts:123` and `:129` (`wordBlock.omit({ flags: true, not_flags: true })`), `RequiredFile` at `:28-34`; C5 and C10 pass, and `not_flags` is refused in the in-memory run.
- 2: holds, `rules.ts:57` and `:169`, `tierMeets` at `projects.ts:268-270`, the skip at `:283`, `isPersonal` at `:279`; C1 to C4 and C6 pass.
- 3: holds, `config/options/behavior.yml:27` names `tiers` among the keys, the field at `:36-39` with `control: words`, `from: tiers` and a help in the shape of `stages`' help.
- 4: holds, `docs/templates.md:291-295` and the example row at `:308`, the comment block's line shape kept.
- 5: holds, `RequiredFile`, the comment of `requiredFiles`, the head comment of `words.ts` and the comment of `blockHolds` all name the tier. The step's new comment at `setting.ts:118-122` now states what `FLAG_SOURCES` (`catalog-words.ts:105`), `blockPool` (`offers.ts:86-87`) and `schemas/options.ts:173` do.
- 6: holds, `tests/tiers/quick.mjs:48`, the comments at `:11` and `:32`, the log lines at `:308-310`; the list of Verify 1 chooses the three imports checks.
- 7: holds, the tests are in the describes and in `LAB_ROWS` as the brief names; each passes in the rerun.

Cases of the brief's "Cases":

- C1: met, the first row of the table at `tests/routes/docs/audit.test.ts:244`; scope `projects/a` alone.
- C2: met, the row with `tier: undefined`, scopes `[]`.
- C3: met, the row with `not_words: [software]`, scopes `projects/a` and `projects/c`.
- C4: met, the row naming `tiers` and `stages`, scope `projects/a`.
- C5: met, the row 'a list in place of a block'; `audit.required_files.0.tiers`, and the second row still runs.
- C6: met, the row with `tiers: { words: [personal] }`; the project is held to no row by `isPersonal`.
- C7: met, the existing rows of the describe are unchanged in the diff and pass in the verbose run.
- C8: met, the list of Verify 1 chooses `augments`, `cycles` and `order`; on the unchanged tree `git show c116b57ad:tests/tiers/quick.mjs` `:47` gives two folders, `scansSource` keeps only those, and `SCANNED` at `:50` holds no `docs/`.
- C9: not verifiable, only a page shows it; the look at landing settles it: Settings, heading Boards, section Audit checks, `audit.required_files`, a row's `tiers` control after `stages` offering `research`, `personal` and `software` under Words and Not words.
- C10: met, the row 'a block naming flags'; the problem at `audit.required_files.0.tiers`, that row off, the good row still running.
- C11: met, the row of `LAB_ROWS` at `tests/server/edit/config-value.test.ts:436-445` and the assertion at `:465`, 7 passed in the named run.

Closures of the round:

- Standards 1, closed. The code at `setting.ts:123` is unchanged, the comment changed only. `config/catalogs/vocab.yml:250` holds the flag fields the first review named, and the new comment no longer says a tier carries none.
- Standards 2, closed by making `findingsNaming` call `readerFindings(read, dir, engine)`, no check removed. The `where` object is field for field what `findingsNaming` built before, `{ engine, hub: dir, from: read.from }`. The filter and the assertion at `:465` are unchanged.
- Standards 3, closed, no code changed, as item 3 rules. The table's reader and block lines reproduce in my run. The lines of the config channel are named under "Declined to judge".

The rename to `TiersCase`, judged: it stands, and it does not reach beyond the finding.

- Standards 2 of the first review names `TierRow` among the names whose grep the report lacked, and the round's item 2 requires that grep.
- The grep hit `src/lib/state/boards/structure/lines.ts:47`, a row of a venue's tiers (`key`, `label`, `color`, `glyph`, `fallback`), which is no row of this table. Reuse is impossible and keeping the name gives one name to two things.
- The change is two lines of a type local to the describe in a file on the write list, erased at compile. `audit.test.ts` imports no `TierRow`, so nothing was shadowed and nothing depends on the old name.
- `grep -rn -w TiersCase src tests` gives only `audit.test.ts:235,244`. `*Case` is an existing name form for such types (`PageCase` at `tests/server/root/hooks-server.test.ts:170`, `HubCase` at `tests/state/system/settings/fixture.ts:70`).
- The report states the rename with its reason and the grep.

Every existing caller of `readerFindings` gives the same result: yes.

- `grep -rn readerFindings src tests` gives 9 existing call sites of the fixture's function: `vocab.test.ts:39,196,235,245,256`, `agents.test.ts:59`, `hub-vocab.test.ts:106,155`, `catalogs.test.ts:19`. Each calls it directly with one or two arguments. None passes it as a callback, the form that would feed an index or an array into `hub` or `engine`.
- With `engine` left out, the default `engineDir()` is evaluated at the call, as the line it replaces was, and `where` and the `flatMap` are unchanged. The change to `read` is a type only.
- `language.test.ts` and `manifest-fields.test.ts` import the fixture and do not call this function. The two `readerFindings` in `src` (`root/process/context/findings.ts:33` and its import) are another function of the same name that predates the step.
- The 8-file run above passes with 152 tests.
- The new import of the fixture into `config-value.test.ts` runs the fixture's module-level `OCULUS = loadConfig(engineDir()).config` under that file's `vi.mock('node:fs')`. It adds no effect a case reads: the file already loads the config at import (`:58`), and the one reader of `reads.paths` clears it first (`:277`, `:283`).

### Findings

Spec: none. The round's delta is what its three items name, plus the rename judged above.

Proof: none. No check was removed, no assertion loosened, and every closure claimed reproduces in the reruns above.

Standards: none. The first review's three findings are closed. The report's four stale line numbers are recorded in the verification lines, and no decision rests on them.

Behaviour: none. The round changes one comment and test code, so a host or a user sees nothing new.

### Declined to judge

- The first run of the step's tests on the unchanged source (the report's table). It needs the new tests in a copy of the base tree, and this review changes nothing, in place or in a copy. The round adds and changes no test.
- The lines `config channel:` of the report's case-run output for `tiers: {}`, `{ words: [] }`, `null`, `{ words: [nosuch] }` and the duplicate. They come from `loadConfig`, which my program did not call: this review does not open `config/local.yml`, and whether `loadConfig` opens it was not checked. The duplicate's message is supported by the yaml throw, `findings.yml:5` and `config.test.ts:170-180`. C11 covers the no-finding line for a good `tiers` row. No decision rests on the other lines.
- That the builder's run of `npm run test:quick` had `TMPDIR` unset and ran once this round: facts of the builder's session.
- C9, a page shows it; the look at landing settles it.
- What git would stage for `docs/diagrams/writes.dot` and `writes.svg`: `git add` on the paths at landing settles it, and it is not a command of this review. Both still differ from the base, unchanged by the round, and the diagram test passes.

Reviewer usage: a89ad68a5efc4538f, claude-opus-5-5, 176698 tokens, 23 tool uses, 9.8 min.

## Closed

- First review, Standards 1, 2 and 3: closed in repair round 1.
- Repair round 1: no finding.
