Everything in the brief is done

## Open items of the state file (copied verbatim when this report was written)

From `/Users/axelfaes/workspace/oculus/.scratch/migration/orchestrator-state.md`, "## Open items":

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
>
> None open.

## The cases' first run (unchanged tree, before any change)

No case was found that the brief's rules get wrong, so the build went ahead without a stop. Two imprecisions in the brief's commands and premises are listed under "Anything in the brief that was wrong" below; neither changes what a case decides.

- C1, test: `test ! -e config/catalogs/meta.yml && test ! -e src/lib/data/shapes/catalog-files/meta.ts; echo $?` printed `1`.
- C1, grep: `grep -rn --exclude=local.yml 'meta\.yml\|metaFileShape\|catalogs/meta\|catalog-files/meta\|catalog&#45;files/meta\|desc_meta' src tests utils bin config docs README.md CLAUDE.md .prettierignore` printed `ugrep: warning: bin: No such file or directory` on stderr and these hits (long `docs/diagrams` lines cut at 200 columns by `cut -c1-200` for reading):
  - `src/lib/data/shapes/catalog-files.ts:19`, `:64`
  - `src/lib/data/shapes/catalog-files/meta.ts:1`, `:8`, `:9`
  - `tests/checks/config/config-folder.test.ts:194`, `:324`
  - `config/text/views/system/workbench.yml:26`
  - `docs/diagrams/writes.svg:2207, 2209, 2213, 2215, 2453, 2455, 2459, 2461, 2463, 2465, 2467, 2471, 2473, 2475, 2477, 2479`
  - `docs/diagrams/writes.dot:579, 586, 651, 656, 657, 659, 660`
  - `.prettierignore:12`
- C2: `npx vitest run tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts --reporter=dot` printed `Test Files  2 passed (2)` and `Tests  43 passed | 2 skipped (45)`.
- C3, a reading: `src/lib/data/shapes/catalog-files/meta.ts` lines 19-34 hold the doc comment and `export const nestingFileShape = z.strictObject({ ... });` (16 lines, saved with `sed -n 19,34p` to the scratchpad); `catalog-files.ts:50` names `nestingFileShape` in the `catalogs/file-nesting` row.
- C4: `grep -c 'catalog-files/meta\|catalog&#45;files/meta' docs/diagrams/*` printed `0` for every file except `docs/diagrams/writes.svg:16` and `docs/diagrams/writes.dot:7`.

## The changed tests' failing line on the unchanged tree

With only the row `'catalogs/meta.yml': ['meta'],` (line 194) removed and nothing else changed, `npx vitest run tests/checks/config/config-folder.test.ts --reporter=verbose` printed two failures, both naming `meta` (the glyph before each is written `<multiplication sign>`):

```
 <multiplication sign> |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > holds exactly the expected top-level keys, and no more 218ms
   -> expected [ Array(96) ] to deeply equal [ Array(95) ]
+   "meta",
 <multiplication sign> |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > reads each file on its own and finds its own keys there and nowhere else 146ms
   -> expected [ 'catalogs/agents.yml', ...(21) ] to deeply equal [ 'catalogs/agents.yml', ...(20) ]
+   "catalogs/meta.yml",
```

(The arrow and the ellipsis vitest prints are written `->` and `...`.) The run ended `Tests  2 failed | 28 passed | 2 skipped (32)`. The second failing test, 'reads each file on its own and finds its own keys there and nowhere else', reads `EXPECTED` too (`config-folder.test.ts:806` after the change, `expect(tracked(dir)).toEqual([...Object.keys(EXPECTED), ...`), so the removed `EXPECTED` row changes three tests, not the two the brief names.

The row at line 324 (`['catalogs/meta.yml', 'bogus: 1\n', ...]` of 'words a part of %s its shape refuses') has no failing line on the unchanged tree: its file and its shape are still there, so the row passes.

The step adds no test.

## DONE / NOT DONE

| Item | State | Proof (command and output) |
|---|---|---|
| 1. `config/catalogs/meta.yml` deleted | DONE | C1 test after the change printed `0` |
| 2. `metaFileShape` removed, `nestingFileShape` moved unchanged to `catalog-files/file-nesting.ts` with its own head comment, `meta.ts` deleted | DONE | C1 test `0`; C3 `diff <(sed -n 19,34p <base>/.../meta.ts) <(sed -n 7,22p .../file-nesting.ts)` printed nothing, `C3 diff exit 0` |
| 3. `catalog-files.ts`: row removed, import from `./catalog-files/file-nesting.ts` | DONE | `diff` against the base: `19c19` `< import { metaFileShape, nestingFileShape } from './catalog-files/meta.ts';` `> import { nestingFileShape } from './catalog-files/file-nesting.ts';` and `64d63` the `catalogs/meta` row |
| 4. `config-folder.test.ts` rows 194 and 324 removed, nothing else | DONE | Verify 6 below: `194d193`, `324d322`, no other line |
| 5. `desc_meta` removed from `workbench.yml` | DONE | `diff` against the base: `26d25` `<         desc_meta: 'The tool identity: the title and the subtitle the window carries.'` |
| 6. `.prettierignore` sentence rewritten as the rule, paragraph rewrapped | DONE | read below under "Comments and documents"; every line of lines 10-15 is at most 100 columns (`awk` lengths 92, 98, 97, 99, 95, 34 before writing) |
| 7. `docs/diagrams/` regenerated by `npm run diagrams` | DONE | `npm run diagrams` exit 0; C4 below |
| C1 | met | test: `0`; grep over the brief's folders printed no hit, only `ugrep: warning: bin: No such file or directory` on stderr, `exit 2`; the same grep without `bin` printed nothing, `exit 1` |
| C2 | met | `npx vitest run tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts --reporter=dot` after the change: `Test Files  2 passed (2)`, `Tests  42 passed | 2 skipped (44)` |
| C3 | met | the `diff` of the two 16-line blocks printed nothing (`C3 diff exit 0`); `grep -n nestingFileShape src/lib/data/shapes/catalog-files.ts` printed `19:import { nestingFileShape } from './catalog-files/file-nesting.ts';` and `50:        shape: nestingFileShape,` |
| C4 | met | `grep -c 'catalog-files/meta\|catalog&#45;files/meta' docs/diagrams/*` printed `0` for all 18 files, `docs/diagrams/writes.dot:0` and `docs/diagrams/writes.svg:0` among them, exit 1 |
| Verify 1 | DONE | the C2 run above; it is the only test file run while working (three runs in all, listed under "Runs") |
| Verify 2 | DONE | `npm run format`, then `npm run diagrams && npm run test:quick` once: `ok      prettier (0.9 s): All matched files use Prettier code style!`, `ok      ASCII gate (1.0 s)`, `ok      svelte-kit sync (2.9 s)`, `ok      eslint (30.3 s)`, `ok      vitest (55.8 s)`, `ok      svelte-check (60.1 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, last lines `test:quick: 63.3 s (limit 45.0 s); every command passed` and `test:quick: over the time limit` |
| Verify 3 | DONE | the ASCII gate perl command over `file-nesting.ts`, `catalog-files.ts`, `workbench.yml`, `.prettierignore`, `config-folder.test.ts` printed nothing, `exit 0` |
| Verify 4 | DONE | C1 and C4 rows above, with their exits |
| Verify 5 | DONE | `sh utils/unused-exports.sh` (exit 0) written to the scratchpad, `diff <base>/unused-exports.txt <after>` printed nothing, `diff exit 0`; both 342 lines (`wc -l`) |
| Verify 6 | DONE | see the table under "Edits to an existing test" |
| Verify 7 | DONE | the section "The changed tests' failing line on the unchanged tree" above |

### Runs

- The verify list (`npm run test:quick`) ran once.
- No whole-suite command ran (`npm test`, `npm run test:checks`, `npm run test:landing`, `npx vitest run` with no file named: none).
- Named test files: three runs. The first run of C2 on the unchanged tree (both files of Verify 1), the run of `config-folder.test.ts` alone with only row 194 removed (the failing-line quote), and the run of both files after the change.
- `test:quick` reported `9 test file(s), 9 essential` and `tests/checks/config/config-folder.test.ts: changed, run by npm run test:checks`, so neither of the step's two test files ran inside the list; both ran green in the Verify 1 run after the last edit. `npm run format` changed none of the step's files after that run: `find . -path ./node_modules -prune -o -path ./.svelte-kit -prune -o -type f -newer config/text/views/system/workbench.yml -print` (the last edit before the format) listed only the two files named under "Limitations", whose text is the base's.
- `test:quick` took 63.3 s against its 45 s limit and printed `over the time limit`; every command in it passed. Not investigated: the step changes no test infrastructure, and several suites run on this machine at once.

### Edits to an existing test

From `diff <base>/tests/checks/config/config-folder.test.ts tests/checks/config/config-folder.test.ts`:

| Line on the base | Before | After |
|---|---|---|
| 194 (`EXPECTED`) | `        'catalogs/meta.yml': ['meta'],` | removed |
| 324 ('words a part of %s its shape refuses') | `        ['catalogs/meta.yml', 'bogus: 1\n', 'bogus', 'key bogus is not a key this file takes'],` | removed |

No assertion, allow list or predicate changed otherwise.

## Files

From `diff -rq` against the base copy (`src`, `tests`, `config` with `-x local.yml`, `utils`), with line counts from `wc -l` and, for `docs/diagrams/` and `.prettierignore` (outside the base copy), from the `git diff --stat` the launching prompt permits:

| Path | Change | Lines |
|---|---|---|
| `config/catalogs/meta.yml` | deleted | -5 |
| `src/lib/data/shapes/catalog-files/meta.ts` | deleted | -34 |
| `src/lib/data/shapes/catalog-files/file-nesting.ts` | added | 22 |
| `src/lib/data/shapes/catalog-files.ts` | changed | 80 (was 81), 1 line changed, 1 removed |
| `tests/checks/config/config-folder.test.ts` | changed | 2 lines removed |
| `config/text/views/system/workbench.yml` | changed | 1 line removed |
| `.prettierignore` | changed | lines 10-14 became lines 10-15 (11 lines in the stat: 5 removed, 6 added) |
| `docs/diagrams/writes.dot` | regenerated | 1377 lines in the stat |
| `docs/diagrams/writes.svg` | regenerated | 2206 lines in the stat |
| `docs/diagrams/layer-state.dot`, `.svg` | regenerated | 2 each |
| `docs/diagrams/layer-views.dot`, `.svg` | regenerated | 10 each |
| `docs/diagrams/layers.dot`, `.svg` | regenerated | 6 each |
| `.scratch/migration/agents/reviews/O58-report.md` | this report | |

Every path is in the brief's write list. The `layer-state`, `layer-views` and `layers` diagrams changed by edge counts the step does not touch (for example `"folder views/shared to layer ui" [label="181"` became `[label="186"`, and `"views to state" [label="1313"` became `[label="1316"`): the diagrams committed at the base were out of date with the base's own `src/lib/views` and `src/lib/state`, and `npm run diagrams` brought them up to date. They are in the write list through "`docs/diagrams/`, only where `npm run diagrams` changes it".

`src/lib/data/shapes/catalog-files/` holds 9 items (`ls | wc -l`), `config/catalogs/` 7, both under the ten-item limit. `file-nesting.ts` is 22 lines and `catalog-files.ts` 80, under the 880-line limit.

## Comments and documents that describe the changed behaviour

- The head comment of `catalog-files.ts` (lines 1-12): still true. It says the shapes are in `catalog-files/`, "one file per catalog or group of catalogs", which `file-nesting.ts` keeps.
- The head comment of `meta.ts` (lines 1-3), as carried into `file-nesting.ts`: rewritten, to name only `config/catalogs/file-nesting.yml`: `// Layer 1, data. The whole-file shape of config/catalogs/file-nesting.yml, the files the Files view` / `// nests under another, with a description on every key.`
- The doc comment of `nestingFileShape` (`/** config/catalogs/file-nesting.yml: the children that nest under each parent pattern. */`): still true, carried unchanged.
- `.prettierignore` lines 10-14: rewritten. The sentence "meta.yml and icons.yml are formatted." is now "The files of config/ this list does not name are formatted."; the rest of the paragraph keeps its words, and the paragraph is rewrapped as a whole at 100 columns, now lines 10-15. The sentence holds against `ls config/catalogs config/options` (`agents.yml`, `file-nesting.yml`, `icons.yml`, `latex.yml`, every file under `config/options/`) and `config/text/`, none of which the list at lines 16-27 names.
- The spec's history-word grep over the comment lines the step added or changed: `grep -nE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O58|meta" src/lib/data/shapes/catalog-files/file-nesting.ts .prettierignore` printed nothing, exit 1. The step changes no test title.
- The name grep of `spec.md` after the change: `grep -rn --exclude=local.yml 'metaFileShape\|catalog-files/meta\|catalogs/meta\|desc_meta\|meta\.yml' src tests config docs README.md` printed nothing, exit 1. `grep -rn --exclude=local.yml 'file-nesting\.ts' src tests utils config docs README.md` (diagrams left out) prints only `src/lib/data/shapes/catalog-files.ts:19`.
- No reader of the config key `meta`: `grep -rnE "(config|merged|cfg|c)\??\.meta\b|meta\?\.(title|subtitle)" src utils tests --exclude=local.yml` printed nothing, exit 1.
- `docs/HELP.md` and `docs/apps.md`: no line names the file or the key (the name grep over `docs` above), so nothing to write there.

## Judgment calls the brief left open

- The wording of the new `.prettierignore` sentence, "The files of config/ this list does not name are formatted.", and the wording of the head comment of `file-nesting.ts`, taken from the first half of `meta.ts`'s head comment.
- The `.prettierignore` paragraph grew from five lines to six: the old lines 10 and 11 were 101 and 102 columns, and the rewrap at 100 columns moves "explains" and "file listed" down.

## Host- or user-visible changes

- The Settings view listed `catalogs/meta.yml` with the description "The tool identity: the title and the subtitle the window carries." and lists it no more. The look on landing: open the Settings view's Catalogs group; `meta.yml` and its description should be absent, the other seven catalogs listed as before.
- The tab title (`t('app.title')`, `oculus`) and the Files view's File Nesting are unchanged: no code read the `meta` key (the grep above), and `nestingFileShape` is the same text (C3).

## Anything in the brief that was wrong or impossible

- The brief says the step changes two tests. The `EXPECTED` row also feeds a third, 'reads each file on its own and finds its own keys there and nowhere else' (`config-folder.test.ts:790`, its assertion at `:806` after the change), which fails on the unchanged tree with only row 194 removed (the quote above). No row of that test is edited; it passes after the change.
- C1's grep names `bin`, which does not exist in the worktree (`ls bin`: `No such file or directory`) or in the main checkout (`ls -d /Users/axelfaes/workspace/oculus/bin`: `No such file or directory`). After the change the grep prints no hit on stdout, prints `ugrep: warning: bin: No such file or directory` on stderr and exits 2; the same grep without `bin` prints nothing and exits 1. The ASCII gate of `spec.md` names `bin` in its `find` too.

## Limitations and sharp edges

- `npm run format` (`prettier --write .`) rewrites two files outside the step that are not prettier-formatted on the base: `src/lib/server/content/wallpaper.ts` (lines 69-71, a ternary prettier joins onto one line) and `src/lib/views/shared/forms/entry/edit/EntryForm.svelte` (lines 60-65, a `<Field ...>` tag prettier joins onto one line). They are outside the write list, so the worktree holds them as on the base (`diff -rq` against the base copy shows no difference in either). `npm run test:quick` checks prettier only over changed files, so it does not see them; the landing list's format check over the whole tree would report both on main.
- The base's committed `layer-state`, `layer-views` and `layers` diagrams were out of date with the base's source; regenerating them in this step brings in edge-count changes unrelated to `meta.yml` (listed under "Files").
- `test:quick` ran over its 45 s limit (63.3 s) with every command passing.
- The listing of `docs/diagrams/` and `.prettierignore` changes and their line counts uses `git status --short` and `git diff --stat`, read only, which the launching prompt permits and `spec.md` "Where you work" forbids to a builder; the base copy holds no `docs/` or root files, so `diff -rq` could not list them.
