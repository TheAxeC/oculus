# Refuter report: O58

## Verification

Everything ran from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O58` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. I ran two of the brief's checks in a form that writes nothing, because this review changes nothing:
- In place of `npm run format` (which is `prettier --write .`), I ran `npx prettier --check` over the step's changed files.
- In place of `npm run diagrams` (which writes `docs/diagrams/`), I called `staleFiles()` from `utils/diagrams/diagrams.mjs` in memory. This is the same function `tests/checks/diagrams/diagrams.test.ts` runs.

Verify 1: `npx vitest run tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts`. I ran it three times.
- Run 1 (dot reporter): `Test Files  1 failed | 1 passed (2)`, `Tests  1 failed | 41 passed | 2 skipped (44)`, exit 1.
- Run 2 (verbose reporter): `Test Files  2 passed (2)`, `Tests  42 passed | 2 skipped (44)`.
- Run 3 (verbose reporter, saved to `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o58-v1-run3.txt`): `<multiplication sign> |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > names a glyph only where the source or another config file reads it 6173ms` and `Error: Test timed out in 5000ms.`, `Tests  1 failed | 41 passed | 2 skipped (44)`.
- `config-folder.test.ts` alone (verbose reporter): `Test Files  1 passed (1)`, `Tests  29 passed | 2 skipped (31)`.
- What the reds are: the only red in run 3 is a 5 s timeout in the glyph-reader test (`config-folder.test.ts:445`). The diff does not touch that test or its glyph readers. It went green in run 2 and in the alone run, and several suites were running on the machine. I judge it a timeout under load, which spec.md "Verify before you report" says is not the step's.

Verify 2, prettier: `npx prettier --check src/lib/data/shapes/catalog-files/file-nesting.ts src/lib/data/shapes/catalog-files.ts config/text/views/system/workbench.yml tests/checks/config/config-folder.test.ts`:
```
Checking formatting...
All matched files use Prettier code style!
prettier exit 0
```

Verify 2, diagrams: `node --input-type=module -e "import { staleFiles } from './utils/diagrams/diagrams.mjs'; const s = await staleFiles(process.cwd()); console.log('stale:', JSON.stringify(s));"`:
```
stale: []
exit 0
```

Verify 2, `npx vitest run tests/checks/diagrams/diagrams.test.ts`: 3 failed, 44 passed. All three failures are `Test timed out in 5000ms.`, and one of them is 'are what the source gives now, each file byte for byte'. The `staleFiles()` call above answers the same question without the timeout, and it gives no stale file.

Verify 2, `npm run test:quick` (run once):
```
test:quick: 16 changed file(s), from git since HEAD
test:quick: 9 test file(s), 9 essential
        tests/checks/config/config-folder.test.ts: changed, run by npm run test:checks
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (3.1 s)
ok      vitest (36.2 s): Duration  26.83s (transform 35.57s, setup 0ms, import 43.93s, tests 16.64s, environment 19.36s)
ok      eslint (41.5 s)
ok      svelte-check (43.0 s): 1792672549018 COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 46.3 s (limit 45.0 s); every command passed
test:quick: over the time limit
exit 0
```

Verify 3, the ASCII gate perl command over the five files the brief names: prints nothing, `ascii exit 0`.

Verify 4, C1 and C4:
- `test ! -e config/catalogs/meta.yml && test ! -e src/lib/data/shapes/catalog-files/meta.ts; echo $?` prints `0`.
- The C1 grep prints nothing on stdout, prints `ugrep: warning: bin: No such file or directory` on stderr, and exits 2.
- `grep -c 'catalog-files/meta\|catalog&#45;files/meta' docs/diagrams/*` prints `:0` for all 18 files (`writes.dot:0` and `writes.svg:0` among them), exit 1.

Verify 5: `sh utils/unused-exports.sh > <scratchpad>/o58-unused-after.txt` gives `unused exit 0`. `diff ../migration-O58-base/unused-exports.txt <after>` prints nothing, `diff exit 0`. Both files are `342` lines.

Verify 6: `diff ../migration-O58-base/tests/checks/config/config-folder.test.ts tests/checks/config/config-folder.test.ts`:
```
194d193
<         'catalogs/meta.yml': ['meta'],
324d322
<         ['catalogs/meta.yml', 'bogus: 1\n', 'bogus', 'key bogus is not a key this file takes'],
```

Verify 7: the report quotes the failing lines and the "no failing line" sentence for row 324 (see Cases).

Other runs:
- `diff -rq` against the base copy (with `-x local.yml`) lists exactly: `file-nesting.ts` added, `meta.ts` deleted, `catalog-files.ts` differs, `config-folder.test.ts` differs, `config/catalogs/meta.yml` deleted, `workbench.yml` differs. `utils` has no difference.
- `wc -l`: `catalog-files.ts` 80, `file-nesting.ts` 22.
- `git status --short` lists the same files, plus the 8 diagram files, `.prettierignore` and the untracked report.
- `git diff 21c13dd7 --stat` matches the report's file table: `.prettierignore` 11, `writes.dot` 1377, `writes.svg` 2206, `layer-state` 2+2, `layer-views` 10+10, `layers` 6+6.

## Verdicts

### Items

1. `config/catalogs/meta.yml` deleted: holds. The C1 test prints 0, and `git status` shows ` D config/catalogs/meta.yml`.
2. `metaFileShape` removed, `nestingFileShape` moved unchanged into `file-nesting.ts` with a head comment naming only `file-nesting.yml`, `meta.ts` deleted: holds.
   - `diff <(git show 21c13dd7:src/lib/data/shapes/catalog-files/meta.ts | sed -n 19,34p) <(sed -n 7,22p src/lib/data/shapes/catalog-files/file-nesting.ts)` prints nothing (exit 0).
   - The head comment, at `file-nesting.ts:1-2`, has the same form as `vocab.ts` and `agents.ts`.
3. `catalog-files.ts`: the `catalogs/meta` row is removed and line 19 imports from `./catalog-files/file-nesting.ts`: holds (diff hunk read).
4. `config-folder.test.ts`: rows 194 and 324 removed and nothing else changed: holds (Verify 6 diff).
5. `desc_meta` removed from `workbench.yml`: holds (one-line deletion in the diff).
6. `.prettierignore`: the sentence is rewritten as the rule ("The files of config/ this list does not name are formatted.") and the paragraph is rewrapped: holds.
   - Line lengths of lines 10-15 are 92, 98, 97, 99, 95 and 34 (`awk`). No line could take the next word within 100 columns.
   - The rule is true: `find config -type f ! -name local.yml` minus the listed paths gives 77 files, and `xargs npx prettier --check` over them prints `All matched files use Prettier code style!`.
7. `docs/diagrams/` regenerated, nothing edited by hand: holds. `staleFiles()` returns `[]`, so every committed diagram is byte for byte what the source gives.

### Cases

- C1: met.
  - After the change: the test prints 0 and the grep prints no hit on stdout.
  - The grep exits 2 only because `bin` does not exist. The report says the same.
  - On the base, `git show 21c13dd7:<file> | grep -n ...` reproduces the report's first-run hits: `writes.svg` 2207 ... 2479 (16 lines), `writes.dot` 579, 586, 651, 656, 657, 659, 660, `.prettierignore:12`, `workbench.yml:26`, `config-folder.test.ts:194` and `:324`.
- C2: met. `config-folder.test.ts` passes alone and in run 2. Run 3's only red is the load timeout described under Verification.
- C3: met. The block diff is empty, and `grep -n nestingFileShape src/lib/data/shapes/catalog-files.ts` prints `19:import { nestingFileShape } from './catalog-files/file-nesting.ts';` and `50:        shape: nestingFileShape,`.
- C4: met. Every count is 0. On the base the counts were `writes.svg` 16 and `writes.dot` 7.
- The changed tests' failing lines on the unchanged tree: met by reading, not rerun, because reproducing them means editing the test.
  - `'holds exactly the expected top-level keys, and no more'` builds `expected` from `Object.values(EXPECTED)`. With the row gone, `meta` is missing from `expected` while the base config still holds it, so the quoted `+   "meta",` follows.
  - `'reads each file on its own ...'` ends with `expect(tracked(dir)).toEqual([...Object.keys(EXPECTED), ...OPTION_FILES].sort())` (`config-folder.test.ts:806`), so the quoted `+   "catalogs/meta.yml",` follows.
  - The report correctly says row 324 has no failing line on the unchanged tree, and that the step adds no test.

## Spec

none.

Premises I reproduced:
- `descriptionKey` returns `settings.desc_<name>` (`config-files.ts:114-117`).
- `t('app.title')` is used at `hooks.server.ts:102`.
- No importer of `catalog-files/meta` remains.
- No reader of the config key `meta` exists: `grep -rnE "(config|merged|cfg|c)\??\.meta\b|meta\?\.(title|subtitle)" src utils tests` prints nothing.
- No hub sets the key: `grep -rln --exclude=local.yml -E '^meta:'` over the hub's `.oculus` gives only `radar.yml` and `leads.yml`, and `meta` is not a key of `HUB_LIST`.
- `guarded.md` line 188 is G13 and line 356 is the held-files line.

The brief says two existing tests change. In fact the `EXPECTED` row also feeds a third test, 'reads each file on its own and finds its own keys there and nowhere else'. The builder reported this under "wrong in the brief", and no row of that third test was edited. This is an error in the brief, not in the build.

## Proof

none.

## Standards

- S1. The builder ran git commands, which spec.md "Where you work" forbids: "You never run a git command, read-only ones included ... not `diff`, `diff --stat`, ... `status`".
  - Place: `.scratch/migration/agents/reviews/O58-report.md`, the last bullet of "Limitations and sharp edges": "The listing of `docs/diagrams/` and `.prettierignore` changes and their line counts uses `git status --short` and `git diff --stat`, read only, which the launching prompt permits and `spec.md` "Where you work" forbids to a builder".
  - What is wrong: spec.md says "Nothing in a brief overrides anything here", and the brief gives no such permission.
  - Failure scenario: none for the code. The numbers obtained this way match my own `git diff 21c13dd7 --stat`. The finding is a breach of the builder's rules. Whether the dispatch prompt granted the exception is under "Declined to judge".
- Note, which breaks no rule of spec.md: in `src/lib/data/shapes/catalog-files.ts:19`, the line `+import { nestingFileShape } from './catalog-files/file-nesting.ts';` sits between the `latex.ts` and `options.ts` imports. The other seven imports of the file are in path order (agents, common, glyphs, latex, options, text, vocab), so by that order it belongs after `common.ts`. No eslint rule or spec rule enforces the order (`grep -n "sort\|import/order" eslint.config.js` prints nothing). It is a one-line readability fix at landing if the orchestrator wants the file's order kept.

No other standards finding:
- There is no history wording: `grep -nE "before|used to|no longer|still|...|O58|meta"` over `file-nesting.ts` and `.prettierignore` exits 1.
- There is no non-ASCII (Verify 3).
- No file is over the size limit (80 and 22 lines).
- `catalog-files/` holds 9 items.
- No unused export was added (Verify 5).

## Behaviour

none.

The report states the one visible change with its before and after: the Settings view listed `catalogs/meta.yml` with "The tool identity: the title and the subtitle the window carries." and lists it no more. The tab title is still `t('app.title')`. File Nesting reads through the same shape text (C3). No hub-visible change exists, since no hub sets `meta` and `meta` is not a hub-layer key.

## Declined to judge

- Whether the orchestrator's dispatch prompt allowed the builder `git status --short` and `git diff --stat` (S1). Settled by reading the O58 dispatch prompt in the orchestrating session's transcript.
- Whether `config/options/local.yml`, a file of `config/` that the `.prettierignore` list does not name, is prettier-formatted, which the new `.prettierignore` sentence asserts. I did not read it, because of the ban on `local.yml`. Settled by `npx prettier --check config/options/local.yml`.
- Whether the glyph-reader test (`config-folder.test.ts:445`) and the three diagram tests also time out on the base under the same load. Settled by running `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/diagrams/diagrams.test.ts` in a checkout at 21c13dd7 (the base copy `.agents/worktrees/migration-O58-base/` has no `docs/` and no `node_modules`).
- The report's claim that `layer-state`, `layer-views` and `layers` were stale on main at the base. The diff touches no file under `src/lib/state` or `src/lib/views`, which supports it. Settled by `git diff 21c13dd7 --stat -- src/lib/state src/lib/views` (empty) together with `staleFiles()` run at 21c13dd7.
- The changed tests' failing lines on the unchanged tree. Judged by reading only, because a rerun needs the row removed from the test file.

Usage: aac7aef6659cb68a7, claude-opus-5-5, 148061 tokens, 41 tool uses, 14 min 18 s

## Closed

- S1, the builder's read-only `git status --short` and `git diff --stat`: closed with no change to the code; the launch prompt allowed reading with `git status`, `git diff` and `git show`, as the plan-orchestration skill's prompt states, and the reviewer's own `git diff 21c13dd7 --stat` matches the numbers.
- The note on the import order at `src/lib/data/shapes/catalog-files.ts:19`: fixed at landing, the `file-nesting.ts` import placed after `common.ts` so the imports stay in path order.
- The brief's count of two changed tests (the `EXPECTED` row also feeds a third test, not edited): an error of the brief, recorded in the booking; nothing to change.
