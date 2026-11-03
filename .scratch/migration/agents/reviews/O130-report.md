# O130 builder report: the category rows of every hub held to the config check

Everything in the brief is done.

## Open items of the state file (verbatim, `.scratch/migration/orchestrator-state.md:172`)

- Open item 647 (2026-11-03): the words of a hub other than the primary are held to the whole-file shape only, never to `vocabFindings` (`src/lib/data/sources/config/sections/vocab.ts`, run in `READER_FINDINGS` over the primary's merged config alone, as `categoriesFindings` was before O130), so in such a hub's `.oculus/config.yml` two stages carrying `new_idea`, a `focus_clusters` row whose `label` names no catalog word, or a Focus lane's `move_writes` naming a word the vocabulary lacks gives no finding, and the page passes over the value silently (O130's brief check, `agents/reviews/O130-brief-check.md`, check 6). (a) recommended: a new step that runs `vocabFindings` in `readOtherHub` over each other hub's merged config when its settings file sets a vocabulary key, its findings naming that file, as O130 does for `categories`; it makes findings appear for such a hub's wrong words. (b) no change, the lazy option: a second hub's wrong vocabulary flags and lanes stay silent.

## The cases' first run (unchanged source, the new test table only)

Command, with only `tests/data/sources/config/boards.test.ts` changed and `src` as at the base: `npx vitest run tests/data/sources/config/boards.test.ts -t 'not the primary' --reporter=verbose`. The table's rows are in case order; C7 is two rows (its two hubs). Output as printed (the describe prefix `tests/data/sources/config/boards.test.ts > the category rows of a hub that is not the primary >` cut from each line, scratch paths written `<scratch>`; `x` and `v` stand for the reporter's `<multiplication sign>` and `<check mark>`):

```
x gives the findings of a stage word the hub does not hold, each naming its settings file 243ms   (C1)
x gives the findings of a row naming no color, each naming its settings file 218ms                (C2)
x gives the findings of a form word the hub does not hold, each naming its settings file 218ms    (C3)
v gives the findings of no categories, each naming its settings file 217ms                        (C4)
x gives the findings of a row with no key, each naming its settings file 216ms                    (C5)
v gives the findings of a row naming a stage word the hub adds, each naming its settings file 227ms (C6)
v gives the findings of a key in two rows, each naming its settings file 212ms                    (C7, repeated key)
v gives the findings of a categories that is no list, each naming its settings file 220ms         (C7, categories: 3)
      Tests  4 failed | 4 passed | 31 skipped (39)
```

The failing lines:

- C1: `AssertionError: expected [] to deeply equal [ [ ...(3) ] ]`, expected `[ "<scratch>", "categories[7].stages.words", "categories[7].stages.words must be one of the items of the list project_stages; it is not read" ]`, received `[]`, at `boards.test.ts:328:69`.
- C2: `expected [] to deeply equal [ [ ...(3) ] ]`, expected `[ "<scratch>", "categories[7]", "categories[7] names no color, so it is drawn in no colour" ]`, received `[]`.
- C3: `expected [] to deeply equal [ [ ...(3) ] ]`, expected `[ "<scratch>", "categories[7].forms.words", "categories[7].forms.words must be one of the items of the list project_forms; it is not read" ]`, received `[]`.
- C5: `expected [ [ ...(3) ] ] to deeply equal [ [ ...(3) ], [ ...(3) ] ]`, the shape's `categories.7.key must be a text` received, the missing row `[ "<scratch>", "categories[7]", "categories[7] must be a map with a key no earlier row holds; the row is not read" ]`.

Every case gave the result the brief expects on the unchanged tree: C1, C2, C3 and C5 fail (their proof), C4, C6 and C7 pass (audits of what the change preserves). No case was wrong by the brief's rules, so nothing was handed back.

Case-run program (after the change), `node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o130-cases.mts`: for each case it plants a scratch hub under `os.tmpdir()`, prints the category findings of `readOtherHub` ("other") and of the same file read as the primary through `READER_FINDINGS` ("primary"), and for C6 the hub's rows checked over the shipped config; it removes each hub (`ls /private/tmp | grep -c '^o130-'` prints `0` after it). Its source is that file, outside the tree. Output as printed:

```
C1 other:   [["<hub>/.oculus/config.yml","categories[7].stages.words","categories[7].stages.words must be one of the items of the list project_stages; it is not read"]]
C1 primary: [["<hub>/.oculus/config.yml","categories[7].stages.words","categories[7].stages.words must be one of the items of the list project_stages; it is not read"]]
C2 other:   [["<hub>/.oculus/config.yml","categories[7]","categories[7] names no color, so it is drawn in no colour"]]
C2 primary: [["<hub>/.oculus/config.yml","categories[7]","categories[7] names no color, so it is drawn in no colour"]]
C3 other:   [["<hub>/.oculus/config.yml","categories[7].forms.words","categories[7].forms.words must be one of the items of the list project_forms; it is not read"]]
C3 primary: [["<hub>/.oculus/config.yml","categories[7].forms.words","categories[7].forms.words must be one of the items of the list project_forms; it is not read"]]
C4 other:   []
C4 primary: []
C5 other:   [["<hub>/.oculus/config.yml","categories.7.key","categories.7.key must be a text"],["<hub>/.oculus/config.yml","categories[7]","categories[7] must be a map with a key no earlier row holds; the row is not read"]]
C5 primary: [["<hub>/.oculus/config.yml","categories.7.key","categories.7.key must be a text"],["<hub>/.oculus/config.yml","categories[7]","categories[7] must be a map with a key no earlier row holds; the row is not read"]]
C6 other:   []
C6 primary: []
C6 rows over the shipped config: [["categories[7].stages.words","categories[7].stages.words must be one of the items of the list project_stages; it is not read"]]
C7a other:   [["<hub>/.oculus/config.yml","categories","categories names x in more than one entry; none of them is applied and oculus's entry stands"]]
C7a primary: [["<hub>/.oculus/config.yml","categories","categories names x in more than one entry; none of them is applied and oculus's entry stands"]]
C7b other:   [["<hub>/.oculus/config.yml","categories","categories must be a list; oculus's value stands"]]
C7b primary: [["<hub>/.oculus/config.yml","categories","categories must be a list; oculus's value stands"]]
```

So each other-hub finding has the file, key and message the primary's run gives the same file, and C6's word is held to the hub's own merged stages (the same rows over the shipped config give a finding).

## DONE / NOT DONE

| Item | State | Command and output |
| --- | --- | --- |
| 1. `readOtherHub` runs `categoriesFindings` when `fromHubFile(from.categories)`, `fileOf` the hub's settings file, catalog `textCatalog(config)`, after `loaded.findings` and `sourcesFindings` | DONE | `src/lib/data/index.ts:640-642` and `:659`; the table after the change: `Tests  8 passed / 31 skipped (39)` for `-t 'not the primary'`, every row `<check mark>` |
| 2. Signature and callers unchanged | DONE | `git diff src/lib/data/index.ts` changes no signature line; `grep -rn readOtherHub src tests` lists the same call sites as the base (`portfolio.ts:610`, the four tests); verify 1 below passes |
| 3. Doc comments of `readOtherHub` and `OtherHub`; head comments of `boards.ts` and `boards.test.ts`; grep for other false sentences | DONE | `src/lib/data/index.ts:617-622`, `:629-635`; `boards.ts:1-13`; `boards.test.ts:1-6`; the grep and its judged hits are under "Documents and comments" |
| 4. One bullet in `docs/HELP.md` "Hubs and projects" after line 591 | DONE | `docs/HELP.md:592`: "- The `categories` rows a hub writes are checked against that hub's own words, its stages and its forms, and each finding names the hub's `.oculus/config.yml`." |
| 5. One test table, describe 'the category rows of a hub that is not the primary', in `boards.test.ts` | DONE | `tests/data/sources/config/boards.test.ts:255-337` (helpers `rowsFile` and `DRAFTING` at 255-261, the describe at 263-337); first run above (4 failed, 4 passed), run after the change: `Tests  8 passed / 31 skipped (39)` |
| Verify 1, the five files that read `readOtherHub` | DONE | `npx vitest run tests/data/sources/config/boards.test.ts tests/data/hubs/connection-keys.test.ts tests/data/hubs/workspace-projects.test.ts tests/data/sources/manifests/manifests.test.ts tests/state/forms/choices.test.ts`: `Test Files  5 passed (5)` / `Tests  110 passed (110)` |
| Verify 2, `npm run test:quick` after the last change | DONE | `test:quick: 9 changed file(s), from git since HEAD`, `test:quick: 99 test file(s)`, `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint (12.3 s)`, `ok svelte-check ... 0 ERRORS 0 WARNINGS`, `ok vitest checks`, `ok vitest`, `ok vitest slow`, `test:quick: 240.2 s; every command passed` |
| Verify 3, character set over the changed files | DONE | `LC_ALL=C grep -n '[^ -~]' src/lib/data/index.ts src/lib/data/sources/config/sections/boards.ts tests/data/sources/config/boards.test.ts docs/HELP.md docs/diagrams/layer-data.dot docs/diagrams/layer-data.svg docs/diagrams/writes.dot docs/diagrams/writes.svg` printed nothing, exit status 1; the spec's perl gate over the four authored files printed nothing, exit 0 |
| Verify 4, the test run before and after | DONE | before: the first run above; after: the run in rows 1 and 5. C1, C2, C3, C5 are proofs (red before); C4, C6, C7 are audits (green before and after) |
| Verify 5, list items and sentences against the standards | DONE | see "Sentences read against the standards" |
| Unused exports | DONE | `sh utils/unused-exports.sh` compared with `../O130-base/unused-exports.txt` by `diff`: no difference (exit 0); the step adds no export |
| History words in added comments and titles | DONE | `git diff -U0 <the four authored files> \| grep '^[+]' \| grep -niE "before\|used to\|no longer\|still\|always has been\|always had\|as before\|previously\|the step adds\|after this package lands\|O1[0-9][0-9]\|20[0-9][0-9]-"` printed nothing (exit 1) |

Runs of the list: `npm run test:quick` was started three times. The first completed with `FAILED eslint` on `src/lib/data/index.ts:642:9 Unnecessary conditional, the types have no overlap` (a guard `rows !== undefined` on `from.categories`, typed `string`); the line was fixed and `npx eslint src/lib/data/index.ts` rerun alone (exit 0). The second was stopped partway, before it printed a result, when a read found a false sentence in the new `readOtherHub` doc comment ("which the primary's check reads", false in a workspace with no primary); the third ran after that edit, the last change, and is the run quoted above. The third start is one more than the spec's paragraph allows, which is a finding of the review to weigh. No whole-suite command was run.

## Files (from `diff -rq ../O130-base/{src,tests,utils,config}` and `git status --short`; `git diff --numstat`)

| Path | Added / removed | Lines now | In the write list |
| --- | --- | --- | --- |
| `src/lib/data/index.ts` | 15 / 3 | 847 | yes |
| `src/lib/data/sources/config/sections/boards.ts` | 11 / 9 | 262 | lines 1-3 named; the head comment paragraph was rewrapped as a whole at 100 columns (spec rule), so it now runs to line 13, its lines 4-11 rewrapped with their words unchanged |
| `tests/data/sources/config/boards.test.ts` | 93 / 3 | 337 | yes |
| `docs/HELP.md` | 1 / 0 | 618 | yes (line 592) |
| `docs/diagrams/layer-data.dot`, `layer-data.svg`, `writes.dot`, `writes.svg` | 1/1, 1/1, 4/4, 10/10 | | yes, by `npm run diagrams` only |
| `.scratch/migration/agents/briefs/O130.md` | 1 / 0 | | not mine: it was already modified in the worktree when I started (`git status --short` at the start) |
| `.scratch/migration/agents/reviews/O130-report.md` | new | | yes |

Edits to existing assertions, allow lists or predicates: none. The removed lines of `boards.test.ts` (`diff ../O130-base/tests/data/sources/config/boards.test.ts tests/data/sources/config/boards.test.ts | grep '^<'`) are the two head comment lines rewrapped and `import { describe, expect, it } from 'vitest';`, replaced by `import { describe, expect } from 'vitest';` and `import { it, plantScratch } from '../../../fixtures/scratch.ts';`, since a file that makes scratch directories takes its `it` from that fixture (`tests/fixtures/scratch.ts:4-9`).

## Documents and comments

Grep: `grep -rn "readOtherHub\|categoriesFindings\|OtherHub" src docs config tests README.md --exclude=local.yml` (diagrams left out). Each hit judged:

- `src/lib/data/index.ts` `OtherHub` doc comment (617-622): rewritten.
- `src/lib/data/index.ts` `readOtherHub` doc comment (629-635): rewritten.
- `src/lib/data/sources/config/sections/boards.ts:1-13` head comment: rewritten.
- `tests/data/sources/config/boards.test.ts:1-6` head comment: rewritten.
- `src/lib/data/shapes/boards/categories.ts:49` ("the config check reports such a row"): still true.
- `src/lib/data/sources/config/sections/findings.ts:1-7` head comment and line 49: still true (it describes the readers of a merged configuration, and names no hub).
- `src/lib/server/root/watch/portfolio/payload.ts:20,51,73` and its head comment: still true (it carries `others.flatMap((one) => one.findings)`, whatever they hold).
- `src/lib/server/root/watch/build.ts:22,73` and `portfolio.ts:27,610` (with its comment at 604-607): still true.
- `tests/data/hubs/connection-keys.test.ts`, `workspace-projects.test.ts`, `manifests.test.ts`, `tests/state/forms/choices.test.ts`: no sentence about the category check; still true.
- The sentences the brief names: `config/catalogs/vocab.yml:262` ("a row without one is a finding naming the row"), `docs/templates.md:445-446` ("a row naming no colour is a finding"), `docs/HELP.md:307` ("a row naming none is a finding"): still true, now in every hub that writes rows. `docs/HELP.md:585-591`: still true, the bullet added after 591.

## Sentences read against the standards

- `docs/HELP.md:592`: one bullet, one sentence of 25 words (`wc -w` over the line prints 26, the bullet's `-` included), a single statement of what a user meets; no departure.
- The doc comments and head comments: each sentence names the function, file or key it is about; the longest is the `boards.ts` head comment's sentence on `categories` sources, kept as one sentence since it lists the file of each kind of value in one parenthesis the paragraph already had.

## Judgment calls the brief left open (each reversible)

1. C7 is two rows of the table, one hub each (a repeated key, and `categories: 3`), since a row plants one hub and the two give different findings.
2. The condition is `fromHubFile(from.categories)` with no `undefined` guard: `from` is typed `Record<string, string>` (`merge.ts:152`), eslint refuses the guard, and `fromHubFile` answers false for a missing value (`hub-names.ts:800-802`, `file === HUB_FILE`).
3. The test titles read "gives the findings of <case>, each naming its settings file"; the case names are in the table, the brief's ids C1 to C7 are not in the test file.
4. The test's hub for C4 writes `stages:` with one added word and no `categories`, so the hub's file is a real settings file that the hub layer reads.

## Host- or user-visible changes, before and after

- The Findings view (the config channel's findings), in a workspace whose second hub's `.oculus/config.yml` writes a `categories` row with a wrong `stages` or `forms` word, a row with no `color`, or a row with no key. Before: no category finding for that hub (C1, C2, C3; C5 gives the shape's finding alone). After: one finding per such fault, naming that hub's `.oculus/config.yml` and the key `categories[<index in the merged list>]...`, worded as the primary's run words it. A second hub that writes no `categories`, or whose rows are clean, shows nothing new. This is a look on landing: put a second hub in the workspace with `categories: [ { key: x, label: X, stages: { words: [building] } } ]` and see one finding "categories[7] names no color, so it is drawn in no colour" with that hub's file and chip.
- `docs/HELP.md` gains the bullet at line 592.

## Wrong or impossible in the brief

Nothing. Every premise I relied on reproduced: the call sites (`grep -rn readOtherHub src tests`), `fromHubFile` (`hub-names.ts:800`), the findings and their wording (the case-run output above), and the first run's red and green rows as the brief predicts.

## Limitations and sharp edges

- A hub that writes `categories` gets the check over its whole merged list, oculus's rows included; were one of oculus's own rows ever to give a finding, it would be said once more for each such hub, naming that hub's file. The shipped rows give none (`boards.test.ts`, 'reads the shipped categories with no finding').
- A finding's key is the merged list's index (`categories[7]` for a hub's first new row), not the row's place in the hub's file; the primary's run keys the same way (brief, premise at line 17).
- A second hub's category findings reach the config channel only; `startFindings` writes no stderr line for them, as for its other findings (`findings.ts:52` reads the primary alone).
- Each new table row takes 205 to 312 ms (the verbose run after the change), since each one runs `loadConfig` over a scratch hub.
