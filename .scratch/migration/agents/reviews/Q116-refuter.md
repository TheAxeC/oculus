# Step Q116 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q116, base 76148458)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
From tools/oculus in the worktree, once, in the foreground:
PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh /Users/axelfaes/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (exit 0)

$ npm test
fatal: Needed a single revision
 Test Files  569 passed | 26 skipped (595)
      Tests  13978 passed | 661 skipped (14639)
   Duration  183.73s
$ npm run test:checks
 Test Files  31 passed | 2 skipped (33)
      Tests  471 passed | 9 skipped (480)
   Duration  47.18s
$ npm run check
1791036302325 COMPLETED 3316 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 8.16s
built in 16.84s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

Commands the builder's report quotes, rerun:
npx vitest run tests/state/system/lines.test.ts tests/views/system/status.test.ts (worktree)
 Test Files  2 passed (2)
      Tests  90 passed (90)

First run on the unchanged tree (scratch copy of tools/oculus with lines.svelte.ts and LineCounts.svelte reverse-patched to the base from `git diff 76148458`, tests in their final form):
 x sums every row under src and no row beside them
 x sums only a folder that is src or starts with src/
 x gives null for rows with none under src and for no rows
 x gives zeros for a row under src that holds no files
 x draws one row per folder with its languages under it, the src/ sum above the first folder under src, and the total last
 x keeps the last table under the sentence when a later count failed
TypeError: underSource is not a function
AssertionError: expected [ ...(6) ] to deeply equal [ ...(7) ]
AssertionError: expected [ ...(6) ] to have a length of 7 but got 6
      Tests  6 failed | 84 passed (90)
(matches the report's 4 failed | 75 passed (79) and 2 failed | 9 passed (11))

Mutations on the scratch copy, lines.test.ts, each restored after (diff against the original printed "restored"):
isUnderSource -> `return folder.startsWith(SOURCE_FOLDER);`
 x rows 1, 2, 3; AssertionError: expected { files: 934, blank: 1528, ... } to strictly equal { files: 932, blank: 1524, ... }
      Tests  3 failed | 76 passed (79)
`sum.blank += row.comment;`
 x rows 1, 2      Tests  2 failed | 77 passed (79)
sum starting as zeros instead of null
 x row 3          Tests  1 failed | 78 passed (79)
(all three match the report; the report's prefix run quotes three titles and two assertion lines, the rerun gives the same three titles)
Reviewer's own extra mutations:
isUnderSource also accepting `src-`  -> x row 2 only, Tests  1 failed | 78 passed (79)
underSource skipping a row with files === 0 -> x row 4 only, Tests  1 failed | 78 passed (79)

find src -type f | wc -l   -> 932 (report: 932)
grep -rn --exclude=local.yml -e underSource -e isUnderSource -e SOURCE_FOLDER src tests config HELP.md DESIGN.md README.md
 -> hits only lines.svelte.ts, LineCounts.svelte, tests/state/system/lines.test.ts (matches the report)
wc -l: lines.svelte.ts 168, LineCounts.svelte 186, lines.test.ts 471, status.test.ts 209, status.yml 34, HELP.md 342 (matches the report)
spec's ASCII perl gate over src tests bin config (local.yml excluded): printed nothing; LC_ALL=C grep -c '[^ -~]' HELP.md status.yml: 0 and 0
python3 yaml.safe_load(config/text/views/system/status.yml): parses (dict)

Diagram check, scratch copy with the step's source and the four docs/diagrams files reverse-patched to the base:
npx vitest run tests/checks/diagrams/diagrams.test.ts
 x are what the source gives now, each file byte for byte
AssertionError: run npm run diagrams: expected [ 'docs/diagrams/layers.dot', ...(3) ] to deeply equal []
 (layers.dot, layers.svg, layer-views.dot, layer-views.svg named stale)
```

(The orchestrator replaced the runner's check and cross glyphs with `x` and dropped the build's tick glyphs when saving, under the ASCII rule; nothing else was changed.)

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `src/lib/state/system/lines.svelte.ts:95` `export const SOURCE_FOLDER = 'src'`, `:98-100` `isUnderSource` (equality or `src/` prefix), `:103-115` `underSource` returning a `LineTally` or null; head comment sentence at `:14-16`. The extra export `isUnderSource` has an importer outside its file (`LineCounts.svelte:17`, used at `:66`) and is listed as judgment call 1.
- 2: holds. `LineCounts.svelte:62-80`: the row `sum:src/`, kind `folder`, label `${SOURCE_FOLDER}/`, pushed once before the first row `isUnderSource` accepts, no languages, none when `underSource` gives null; the total row still `count.total`. Doc comment `:56-60` and head comment `:2-7` name the row.
- 3: holds. `status.yml:27` gains "The src/ row sums every file under src/ at every depth, the rows beneath it included."; no `: `, yaml parses.
- 4: holds. `HELP.md:137` alone changed, ending "with a TODO count and one row for everything under `src/`."
- 5: holds, with Standards 1 against one of its rows. One `it.each` of four rows at `tests/state/system/lines.test.ts:408-471`, built with `folder` and `tally`; head comment `:1-3`.
- 6: holds, with Spec 2 noting the title edit. `status.test.ts:133` row `'src/|1|1|0|4|0|5'` before `src/lib/x`, `:183` `toHaveLength(7)`, head comment `:1-5`; both assertions fail on the base source and pass after (rerun above).

Cases of the brief's "Cases":

- Ten real-tree `src` rows beside `''`, `tests`, `config`, `srcx`: met. Row 1 gives `tally([932, 1524, 2104, 29710, 65])` (sums checked by hand); prefix and field-swap mutations turn it red.
- `srcx` and `src-old` beside `src/lib/ui`: met. Row 2; the `src-` mutation turns only this row red.
- No row under `src`, and an empty list: met. Row 3, two inputs in one row; the zeros-start mutation turns it red.
- A zero-file row under `src`: met (row 4, red under the files === 0 mutation); see Standards 1 on whether the row may exist.
- Fixture `COUNT`: met. `status.test.ts:128-137` passes after and fails on the base source; the total `4|21|5|1,238|1|1,264` is in the same assertion.
- No row under `src`, no `src/` row drawn: met by reading. `LineCounts.svelte:66` pushes only when `source !== null` and `isUnderSource` holds, and `underSource` gives null exactly when no row passes `isUnderSource`.
- Keys: met by reading. `sum:src/` (`:67`) against `folder:<folder>` (`:71`), `language:<folder>:<language>` (`:73`), `total` (`:77`); a crafted folder `src/` has key `folder:src/`. Table keys rows by `rowKey="key"`.
- A crafted `src-old` row: met by reading. The loop pushes the `src/` row on the first row `isUnderSource` accepts, which in the order `src`, `src-old`, `src/lib/...` is `src`; `src-old` stays in the server's place.

## 1. Spec

- `tools/oculus/docs/diagrams/layer-views.dot:43`, `layer-views.svg`, `layers.dot:75`, `layers.svg`: `"folder views/system to layer state" [label="138"` (was 137) and `"views to state" [label="823"` (was 822); what is wrong: four paths outside the brief's "Paths this step writes", and the report's file table (Q116-report.md, "Files with line counts") does not list or mark them, which the rules file's "Where you work" asks for a path outside the write list. On the merits the change is required and correct: `LineCounts.svelte` moved from `import type {...} from '$lib/state/system/lines.svelte'` to a value import, the diagram reader leaves type-only imports out (`utils/diagrams/imports.mjs:54`, `:63`), so the edge counts rise by one, and with the base diagrams and the step's source `tests/checks/diagrams/diagrams.test.ts` fails "run npm run diagrams" naming exactly these four files (rerun above). The run rule has `npm run diagrams` run before the full list, so they belong in the landing. The brief's write list should have named them; failure scenario: an orchestrator holding the diff to the write list drops the four files as out of scope, and `npm run test:checks` goes red on main at the diagram staleness case; verdict: none (the items hold).
- `tools/oculus/tests/views/system/status.test.ts:124`: `it('draws one row per folder with its languages under it, the src/ sum above the first folder under src, and the total last'`; what is wrong: the test title is outside the line ranges the brief gives for this file (1-4, 128-135, 181), and the head comment now runs to line 5. The edit keeps the title true under the rules file's rule that a sentence the change makes false is a defect, and the report lists it in "Edits to existing assertions". Failure scenario: a reader holding the diff to the listed lines takes the title edit for an unasked change; low, acceptable at landing; verdict: none.

## 2. Proof

- `.scratch/migration/agents/reviews/Q116-report.md`, "Files with line counts": "All are inside the brief's write list. ... My change adds no import edge between files that was not already there (`LineCounts.svelte` already imported from `lines.svelte`), so I expect no difference"; what is wrong: both sentences are false. `git diff 76148458 --stat` shows four `docs/diagrams/` files changed, and the base import was type-only, which the diagrams do not count, so the step adds a counted edge (137 to 138, 822 to 823). The decision resting on it is whether the four diagram files land with the step; failure scenario: the orchestrator, told no diagram changes, reads the four files as stray noise and drops them, leaving main's diagrams stale and `tests/checks/diagrams/diagrams.test.ts` red; verdict: none.

## 3. Standards

- `tools/oculus/tests/state/system/lines.test.ts:462-466`, row `'gives zeros for a row under src that holds no files'`, and the `[]` input of row 3 at `:459`; what is wrong: the rules file's "What every package obeys" says a case gets a test only where it can occur and its failure costs something, and the test rule says a test exists only for behaviour whose failure costs something. The brief's own case text says the server never sends a zero-file row (a row exists only for a counted file in `lines.ts`), and the reviewer's mutation (skip a row with `files === 0`) turns only this row red, so the row guards nothing that can happen on oculus's tree: with the row deleted, no reachable defect goes unseen. The empty-list input likewise cannot come from the server on a tree that has tracked files, and adds a second input for an outcome row 3's first input already gives. The brief asked for both (its Cases, item 1, third and fourth bullets), so the builder followed the brief; the defect is the brief's. Failure scenario: the suite carries a row whose red would only ever report a crafted answer, and a later reader treats the zeros-not-null contract as a requirement worth keeping; verdict: the case "A row under `src` with zero files" is met as written, and this finding asks the orchestrator to delete the row and the `[]` input at landing or keep them under the brief's ruling.

## 4. Behaviour

none. The report's "User-visible change" names the view, the state, the before and the after, and matches the diff: one `src/` row above the `src` row, folder style, no languages, the total unchanged, and the help sentence.

## Declined to judge

- The row's look on TEST (its place among the real rows, the figures against a real cloc count): the landing look is the orchestrator's, and the reviewer may not touch a running server.
- Whether cloc gives every file under `src/` a language on this tree: not run, since the counter runs cloc and git outside the review's allowed commands; the `src/` row's figures against a real count are seen at the look.
- The `fatal: Needed a single revision` line printed during `npm test`: it comes from a test running git in the worktree, the suite is green, and it is not in a file the step changed.
- A note on the reviewer's own commands: besides `git diff 76148458` and `git status --short`, the reviewer ran `git ls-files src | wc -l` once, read-only, which changed nothing; every mutation and base run was made on a scratch copy under the reviewer's scratchpad, never in the worktree.

Reviewer usage: claude-opus-5-5, 136,700 tokens, 32 tool uses, 13.0 min (from the completion notice).

## Closed

- Spec 1 (the four `docs/diagrams/` files outside the write list): closed at landing. The files are the output of `npm run diagrams` over the step's source, which the run rule requires before the full list; they land with the step, and the booking names them.
- Spec 2 (the test title at `status.test.ts:124`): no change. The title edit keeps the title true after the change, which the rules file requires.
- Proof 1 (the report's false sentences about the diagrams): closed in the booking, which states the four files and the counted edge (137 to 138, 822 to 823).
- Standards 1 (the zero-file row and the `[]` input of `lines.test.ts`): closed at landing. The zero-file row and the `[]` input are deleted, since the server never sends either, so their failure costs nothing (`agents/spec.md:57`); the brief that asked for them was wrong on this point.
