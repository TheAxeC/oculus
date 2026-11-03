NOT done: verify 2. No run of `npm run test:quick` of mine printed "every command passed"; the last, in repair round 1, printed `test:quick: 495.2 s; failed: vitest, vitest slow`, every red line a timeout (`Error: Test timed out in 5000ms.` or `in 20000ms.`) in a file the step does not change, at load averages 6.01 before and 14.32 after the run, and each of those files passes alone (the section "Repair round 1"). The reviewer's run of the list printed `test:quick: 236.3 s; every command passed`. The lone runs of `tests/data/hubs/hub-portfolio.test.ts` are mixed: mine gave `Tests  16 passed (16)` twice (quoted under verify 2 and in "Repair round 1"); the reviewer's gave `Tests  9 failed | 7 passed (16)`, then `Tests  1 failed | 15 passed (16)` on a 5000 ms timeout, at load averages 11 to 17. Everything else in the brief is done.

## Open items of the state file (verbatim)

- Open item 653 (2026-11-03): step O136 (the editor holds a keyed family to the form the Settings write takes) stopped at /spec on a premise found wrong. The step's line says `familySchema` gives a keyed family "the form `familyProblem` takes, a map", and names `research_audit` among the families. On main: `familyProblem` (`src/lib/data/sources/config/catalog/value-rule.ts:249`) runs only for a family field (`control: records`, given by `catalog/options.ts:436` to a family that is no top-level option), and every keyed family field of the catalog is a key/value family, so for those a map is right (a board's `stages`, `chips`, `forms` and `match`, the reader rows' `params`, `headers` and the rest). A top-level keyed family is never read by `familyProblem` (`valueProblem` of `research_audit` gives no problem for a map or a list of rows); its form is the one its reader takes, and they differ: a hub's `.oculus/config.yml` with `research_audit` or `stages` written as a list of rows gives "research_audit must be a map; oculus's value stands" and "stages must be a map; oculus's value stands", and one with `categories` written as a map gives "categories must be a list; oculus's value stands" (`loadConfig` on a scratch hub). `stages` has the fields of a list of records and is written as a map, so its form does not follow from its fields. The editor schema gives every top-level keyed family `type: ['array', 'object']` (`schemas/options.ts:323`), so none of these is marked. Options: (a) the schema of every keyed family takes the form its reader takes: a family field a map, as `familyProblem` holds it; a top-level keyed family the form its whole-file shape and the in-place merge read (`src/lib/data/sources/config/merge/in-place.ts`, `src/lib/data/shapes/catalog-files/`), a map for `research_audit`, `stages`, `palette` and the others merged by their words, a list of rows for `categories`, `focus_lanes` and the others read as rows, in every options file that has one; with a case per form in oculus's files and a hub's settings file. Pros: the editor marks every keyed family written in the form its reader refuses, `research_audit` included as the line asks. Cons: a larger step, which reads each top-level family's form from its shape. (b) family fields only, a map, `research_audit` and the other top-level families left as they are. Pros: a small step, exact to `familyProblem`. Cons: `research_audit`, `stages` or `categories` written in the wrong form stays unmarked while its reader refuses it, and the head comment of `options.ts` keeps that kind among the places the schema and the rule part. Recommendation (a); (b) is the lazy option.

## The cases' first run

The test (the new describe 'the vocabulary words of a hub that is not the primary' in `tests/data/shapes/catalog-files/vocab.test.ts`, one `it.each` row per case C1 to C11) was written first and run on the unchanged `src` with `npx vitest run tests/data/shapes/catalog-files/vocab.test.ts --reporter=verbose`. The same command ran a second time on the same unchanged tree, with no edit between, to save its output to a scratchpad file; both runs gave `Tests  8 failed | 16 passed (24)`. Every result matches the brief's "Before"; no case of the brief was wrong, so nothing was handed back.

Row title prefix: `the vocabulary words of a hub that is not the primary > gives the findings of`; each ends `, each naming its settings file`.

| Case | Row | Before (unchanged tree) |
| --- | --- | --- |
| C1 | two tiers carrying default | `<multiplication x>` `AssertionError: expected [] to deeply equal [ [ <ellipsis>(3) ] ]` |
| C2 | two statuses carrying default_task | `<multiplication x>` `AssertionError: expected [] to deeply equal [ [ <ellipsis>(3) ] ]` |
| C3 | two stages carrying new_idea | `<multiplication x>` `AssertionError: expected [] to deeply equal [ [ <ellipsis>(3) ] ]` |
| C4 | a lane naming a cluster no row has | `<multiplication x>` `AssertionError: expected [] to deeply equal [ [ <ellipsis>(3) ] ]` |
| C5 | a lane moving onto a stage it does not list | `<multiplication x>` `AssertionError: expected [] to deeply equal [ [ <ellipsis>(3) ] ]` |
| C6 | a lane moving onto a stage the vocabulary lacks | `<multiplication x>` `AssertionError: expected [] to deeply equal [ [ <ellipsis>(3) ] ]` |
| C7 | a cluster whose label names no catalog word, the list leaving oculus's other clusters out | `<multiplication x>` `AssertionError: expected [] to deeply equal [ [ <ellipsis>(3) ], [ <ellipsis>(3) ], [ <ellipsis>(3) ], <ellipsis>(5) ]` (eight findings expected: the label and `focus_lanes[3]` to `focus_lanes[9]`) |
| C8 | a stage word the hub adds | `<check mark>` passes (audit) |
| C9 | no key of the vocabulary | `<check mark>` passes (audit) |
| C10 | a category row naming no color beside two tiers carrying default | `<multiplication x>` `AssertionError: expected [ [ <ellipsis>(3) ] ] to deeply equal [ [ <ellipsis>(3) ], [ <ellipsis>(3) ] ]`; the diff shows the received list holds the `categories[7]` finding alone and lacks the `tiers.personal` one |
| C11 | a lane naming no stages, which the merge refuses | `<check mark>` passes (audit) |
| C12 | the 13 rows of describe "the vocabulary's words past its shape" in the same run, and `npx vitest run tests/data/sources/config/boards.test.ts` | all 13 rows `<check mark>`; boards: `Tests  39 passed (39)` |

The rows of C1 to C3 also assert `oneWordWith(loaded.config, <map>, <flag>)` is `undefined`; on the unchanged tree those rows failed at the findings assertion first, so the `oneWordWith` line is a behaviour the change preserves and is proven by the after run.

After the change, the same command: all 24 rows `<check mark>`, `Tests  24 passed (24)`.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1. `readOtherHub` runs `vocabFindings` over the merged config when the hub's file sets a key of `hubKeysOf('catalogs/vocab.yml')` by `named`, each finding naming `sources`, after the category check's | DONE | `src/lib/data/index.ts:633,650-655,672-673`; `npx vitest run tests/data/shapes/catalog-files/vocab.test.ts`: `Tests  24 passed (24)` |
| 2. Doc comments of `OtherHub`, `readOtherHub`; head comment and `vocabFindings` doc comment of `vocab.ts`; head comment of `vocab.test.ts` | DONE | `src/lib/data/index.ts:619-625,635-645`; `src/lib/data/sources/config/sections/vocab.ts:1-15,56-58,186-190`; `tests/data/shapes/catalog-files/vocab.test.ts:1-11` (read) |
| 3. `docs/HELP.md` bullet beside line 592 | DONE | `docs/HELP.md:593`, one line (read) |
| 4. The new describe, one table, C1 to C11, whole findings list as `[file, key, message]`, `oneWordWith` for C1 to C3, `it` from `tests/fixtures/scratch.ts` | DONE | `tests/data/shapes/catalog-files/vocab.test.ts:236-363`; run above |
| Verify 1: the six files | DONE | `Test Files  6 passed (6)` / `Tests  134 passed (134)` |
| Verify 1: boundaries alone | DONE | `Test Files  1 passed (1)` / `Tests  11 passed (11)` |
| Verify 2: `npm run diagrams`, then `npm run test:quick` | NOT DONE: the last run is red (repair round 1: `test:quick: 495.2 s; failed: vitest, vitest slow`, thirteen timeouts in five files the step does not change, each file green alone, all quoted in "Repair round 1"); the reviewer's run printed `test:quick: 236.3 s; every command passed` | the build round's second run: `ok      prettier (2.8 s): All matched files use Prettier code style!` / `ok      ASCII gate (3.0 s)` / `ok      svelte-kit sync (13.2 s): svelte-kit types: waiting for the vitest runs 90449` / `ok      svelte-check (13.6 s): 1793724972133 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` / `ok      eslint (13.8 s)` / `ok      vitest checks (191.3 s): Duration  169.32s (transform 119.74s, setup 0ms, import 231.21s, tests 389.23s, environment 4ms)` / `ok      vitest (218.5 s): Duration  201.11s (transform 45.69s, setup 0ms, import 158.33s, tests 632.43s, environment 2.37s)` / `FAILED  vitest slow (354.6 s)` / `test:quick: 368.1 s; failed: vitest slow`; the three failing rows: `the portfolio of several hubs > reads a field of a second-hub entry that names a record as the key its file holds (G32)`, `the portfolio of several hubs > keeps a primary-hub id that begins with the name of a hub folder and a colon as a record of the primary, with no finding`, `a workspace of several hubs, every record under its hub and its key > gives a key two hubs hold two records, each project naming its own hub record, each shown by the key (C1)`, each `Error: Test timed out in 20000ms.`; that file alone at 18:02 (`uptime`: `load averages: 11.50 15.39 13.87`): `Test Files  1 passed (1)` / `Tests  16 passed (16)` / `Duration  42.26s (transform 1.94s, setup 0ms, import 2.89s, tests 39.25s, environment 0ms)`; the reviewer's lone runs of it: `Tests  9 failed | 7 passed (16)`, then `Tests  1 failed | 15 passed (16)` |
| Verify 3: ASCII gate over the four changed files | DONE | `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/data/index.ts src/lib/data/sources/config/sections/vocab.ts tests/data/shapes/catalog-files/vocab.test.ts docs/HELP.md` printed nothing, `ascii exit 0` |
| Verify 4: unused exports | DONE | `sh utils/unused-exports.sh` (exit 0) output compared with `diff ../O132-base/unused-exports.txt <output>`: no line, `diff exit 0` |
| Verify 5: each new test run before and after | DONE | the "first run" section above |
| Verify 6: list items and sentence length | DONE | see below |
| Prettier | DONE | `npx prettier --check` over the four files: `All matched files use Prettier code style!` |
| History words | DONE | `git diff -U0 src tests docs/HELP.md | grep '^+' | grep -nE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-"` printed nothing, exit 1 |

Verify 6: `spec.md`, the one standards page, holds one rule on list items (one line per paragraph or bullet in Markdown) and none on sentence length. The HELP bullet is one line of two sentences. The doc comment of `readOtherHub` runs four sentences, the longest naming the order of the three groups of findings; it keeps one sentence for the order because the order is one fact.

Runs of the verify list: two, each after `npm run diagrams`. The first ended `test:quick: 298.8 s; failed: vitest checks`, its one red row `tests/checks/source/comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and utils` naming `tests/data/shapes/catalog-files/vocab.test.ts:10`, a head-comment line of 101 columns this step wrote; the paragraph was rewrapped, `tests/checks/source/comment-width.test.ts` was rerun alone, and the list ran once more, as the rules file allows. Of the two lone runs of that file, the first, started while the first list's `vitest slow` group was still running, printed `Tests  1 failed | 1 passed (2)` with its failure lines not kept; the second printed `Tests  2 passed (2)`, and the second list printed `ok      vitest checks`. No whole-suite command was run.

## Files

`diff -rq ../O132-base/<d> <d>` over `src tests utils config docs` (config with `-x local.yml`), then `wc -l`:

| File | Lines (base -> now) | In the write list |
| --- | --- | --- |
| `src/lib/data/index.ts` | 847 -> 861 | yes (imports 44-63; the comments and code 619-676, base 617-662) |
| `src/lib/data/sources/config/sections/vocab.ts` | 202 -> 205 | yes for 1-15 and 186-190 (base 1-12 and 184-188); line 57 (base 54) is outside the named ranges, see judgment 2 |
| `tests/data/shapes/catalog-files/vocab.test.ts` | 226 -> 363 | yes |
| `docs/HELP.md` | 618 -> 619 | yes (593) |
| `docs/diagrams/layer-data.dot`, `layer-data.svg`, `writes.dot`, `writes.svg` | regenerated by `npm run diagrams` | yes |
| `.scratch/migration/agents/reviews/O132-report.md` | this report | yes |

No existing assertion, allow list or predicate was edited: the removed lines of `git diff tests/data/shapes/catalog-files/vocab.test.ts` are the last head-comment line, the vitest import line and the config import line, each replaced.

## Judgment calls the brief left open (each reversible)

1. The category check's condition is written `named(from, 'categories')` in place of `fromHubFile(from.categories)`, so both checks use the one rule the tree has for a key the hub's file sets (item 1's "with no second form of it"); the two give the same result, since `named` is `from[key] !== undefined && fromHubFile(from[key])` (`index.ts:251-254`) and `fromHubFile(undefined)` is false. Proof: boards.test.ts `Tests  39 passed (39)` after.
2. The doc comment of `flagFindings` (`vocab.ts:56-58`) said "filed in the file of the second word"; for a hub other than the primary the file is the hub's settings file whatever word is second, so it now says "filed under the key of the second word", the key `fileOf` is handed. The line is outside the brief's ranges for `vocab.ts` (1-14, 184-188) and is in the brief's file; it is written because the change made it false (spec rule on sentences a change makes false). The head comment grew from 12 to 15 lines, so it ends at line 15, one past the named 1-14.
3. A module constant `VOCAB_FILE = 'catalogs/vocab.yml'` in `index.ts:633`, local to the file; `src/lib/data/snapshot/references/build.ts:72` holds a local constant of the same name and value, and no shared export exists (`grep -rn "catalogs/vocab.yml'" src`).
4. The text catalog is built once (`textCatalog(config)`) and the file function `fileOf` once, shared by the two checks.
5. Case-run program for the before-and-after section: `<scratchpad>/o132/combo.mts`, run with `npx tsx <it> <tree>`, which plants a scratch hub with the texts of C1 and C7, prints `readOtherHub`'s findings and removes the hub; it writes nothing into the worktree and was removed from the scratchpad before this report. Its body (the `node:fs`, `node:os` and `node:path` imports and `const tree = process.argv[2]` above it):

```ts
const { readOtherHub } = await import(join(tree, 'src/lib/data/index.ts'));
const { engineDir, loadConfig } = await import(join(tree, 'src/lib/data/sources/config.ts'));
const dir = mkdtempSync(join(tmpdir(), 'o132-combo-'));
mkdirSync(join(dir, '.oculus'));
writeFileSync(join(dir, '.oculus/config.yml'),
    'tiers: { personal: { label: Personal, default: true } }\n' +
    'focus_clusters: [ { key: now, label: nosuch.word, muted: false, layout: columns } ]\n');
const read = readOtherHub({ key: 'lab', dir }, loadConfig(engineDir(), { hub: dir, other: 'lab' }));
for (const one of read.findings) console.log(`${one.file === join(dir, '.oculus/config.yml') ? '<hub file>' : one.file} | ${one.key} | ${one.message}`);
console.log(`count ${read.findings.length}`);
rmSync(dir, { recursive: true });
```

Ids and keys: the step adds no id, key or vocabulary word. `readOtherHub` is synchronous, so no path is in flight, after close or superseded.

## Host- and user-visible change, before and after

The Findings view, for a workspace whose second hub (not the primary) has a `.oculus/config.yml` holding the texts of C1 and C7 together. The config payload carries every other hub's findings (`src/lib/server/root/watch/portfolio/payload.ts:88-90`, `...others.flatMap((one) => one.findings)`).

- Before (`npx tsx <scratchpad>/o132/combo.mts ../O132-base`): `count 0`; the view shows no row for that hub's file.
- After (`npx tsx <scratchpad>/o132/combo.mts <worktree>`): `count 9`, each naming `<hub>/.oculus/config.yml`, in this order:
  - `tiers.personal | research, personal each carry default, which one word carries at most; none of them is read for it`
  - `focus_clusters[0].label | the label of the Focus cluster now names nosuch.word, which the text catalog lacks; it reads as absent`
  - `focus_lanes[3]` to `focus_lanes[9] | the Focus lane <lane> names the cluster <cluster>, which no readable row of focus_clusters has; the lane is not drawn` for review/parked, blocked/parked, backburner/parked, scope/incubate, derisk/incubate, build/incubate, idea/idea.
- The count on the Findings tab, the rail and the status bar: nine more after than before, if those counts sum the config channel's findings; not verified by a run (a builder runs no page). The look on landing is its proof: open the Findings view with such a second hub, and the nine rows above should show under that hub's file, with the counts nine higher than on the base.

## Wrong or impossible in the brief

Nothing. Every premise checked held: `grep -rn "vocabFindings" src` at the base printed `vocab.ts` and `findings.ts` alone; every "Before" result reproduced in the first run.

## Limitations

- The primary hub's run is unchanged (decision 2): a lane of oculus's whose cluster the primary hub's `focus_clusters` leaves out is filed under oculus's `config/catalogs/vocab.yml` by `keyFile`, while the same finding of another hub names that hub's file. The HELP bullet states the second case for a hub other than the primary alone, so it is true of both.
- Formatting was run as `npx prettier --write` over the three TypeScript files, the tool `npm run format` runs, limited to the files the step wrote.

## Repair round 1

The first line and the row of verify 2 above are rewritten to what the runs show (item 3). One item is NOT done: verify 2, since the round's run of `npm run test:quick` is red, on timeouts alone, in five files the step does not change, each of which passes alone (quoted below).

### Item 1: the head comment of `tests/data/shapes/catalog-files/vocab.test.ts`

The sentence of lines 5-6 is qualified to the describe of the primary hub, and the paragraph is rewrapped at 100 columns (widths of lines 1-11 by `awk '{print length}'`: `96 100 99 100 96 100 98 99 99 96 33`). Lines 5-11 now read:

```
// list or the field of the other kind of lane. In the describe of the primary hub, each finding
// names the file the value was read from, the hub's when the hub's value gives it, and the one-word
// readers give no word for a flag two words carry. The hub's file is given as text, so no file is
// read for it, save in the describe of a hub that is not the primary, which plants that hub's file
// on disk and reads it as the build does: every finding of such a hub names its settings file, one
// on a lane of oculus's that the hub's clusters leave out included, and the hub's whole list of
// findings is compared in order.
```

To rewrap the paragraph without a short line inside a sentence, "names its `.oculus/config.yml`" became "names its settings file"; the describe compares against `join(dir, HUB_FILE)`, the hub's settings file.

### Item 2: the doc comment of `VOCAB_FILE`

`src/lib/data/index.ts:632` now reads `/** The engine file whose keys, set in a hub's settings file, switch the vocabulary check on. */` (96 columns).

### Item 3: the report

The first line and the verify 2 row now state that every run of the list of mine is red, quote the reviewer's passing run and its red lone runs of `tests/data/hubs/hub-portfolio.test.ts`, and quote the output of my lone run of that file (18:02, `load averages: 11.50 15.39 13.87`, `Tests  16 passed (16)`). No row whose last run was red is marked DONE.

### Verify, after the last change

```
$ uptime
18:20  up 1 day,  2:23, 1 user, load averages: 4.26 7.98 10.39
$ npx vitest run tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/boards.test.ts tests/data/hubs/workspace-projects.test.ts tests/data/hubs/connection-keys.test.ts tests/state/forms/choices.test.ts tests/data/sources/manifests/manifests.test.ts
 Test Files  6 passed (6)
      Tests  134 passed (134)
$ npx vitest run tests/checks/tree/boundaries.test.ts
 Test Files  1 passed (1)
      Tests  11 passed (11)
$ LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/data/index.ts src/lib/data/sources/config/sections/vocab.ts tests/data/shapes/catalog-files/vocab.test.ts docs/HELP.md; echo "ascii exit $?"
ascii exit 0
$ sh utils/unused-exports.sh > <scratchpad>/o132-unused-r1.txt; echo "unused exit $?"; diff ../O132-base/unused-exports.txt <scratchpad>/o132-unused-r1.txt; echo "diff exit $?"
unused exit 0
diff exit 0
$ npx prettier --check src/lib/data/index.ts tests/data/shapes/catalog-files/vocab.test.ts
All matched files use Prettier code style!
$ git diff -U0 src tests docs/HELP.md | grep '^+' | grep -nE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-"; echo "history grep exit $?"
history grep exit 1
```

`npm run diagrams` (exit 0), then `npm run test:quick` once (`uptime` before: `load averages: 6.01 7.96 10.25`; after: `load averages: 14.32 14.01 12.67`):

```
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.8 s)
ok      eslint (15.1 s)
ok      svelte-check (49.1 s): 1793726553236 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (272.6 s): Duration  249.59s (transform 231.38s, setup 0ms, import 406.04s, tests 534.13s, environment 5ms)
FAILED  vitest (304.9 s)
FAILED  vitest slow (492.3 s)
test:quick: 495.2 s; failed: vitest, vitest slow
```

`vitest` ended `Tests  7 failed | 891 passed | 500 skipped (1398)` and `vitest slow` `Tests  6 failed | 494 passed | 165 skipped (665)`. Every red test, each `Error: Test timed out in <n>ms.`, with its file run alone (`npx vitest run <file>`) and the load average printed by `uptime` right before that run:

| Red test (timeout) | Its file alone | Load average before |
| --- | --- | --- |
| `tests/state/sources/clone-after.test.ts > Open after a clone while the unsaved workspace holds folders > Save with a name writes the two folders as that workspace file and opens the clone` (5000 ms) | `Tests  11 passed (11)` | `13.16 13.76 12.60` |
| `tests/routes/docs/primary-key.test.ts > the choice of a data file primary key > marks the field picked in a schema that flags none (key_none), every other line kept, one write listed and undone` (5000 ms) | `Tests  7 passed (7)` | `12.71 13.61 12.57` |
| `tests/routes/docs/primary-key.test.ts > the choice of a data file primary key > leaves the mark on the field picked alone in a schema that flags two (key_two)` (5000 ms) | same run | same |
| `tests/routes/git/zenodo.test.ts > the Zenodo token > goes as Bearer in the Authorization header to the deposit address alone` (5000 ms) | `Tests  51 passed (51)` | `12.14 13.44 12.52` |
| `tests/routes/git/zenodo.test.ts > the Zenodo token > is not sent by the Recover route when another hub of the workspace reads it from the row` (5000 ms) | same run | same |
| `tests/routes/git/zenodo.test.ts > the hub a press reads > answers the token's readiness of the GET from the project's own hub` (5000 ms) | same run | same |
| `tests/routes/git/zenodo.test.ts > what Publish and a new version send, and what a press that stops leaves > still writes the DOI and the share link when Cancel comes after the publish was sent` (5000 ms) | same run | same |
| `tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > reports the findings each hub gives, the second hub own naming its files` (20000 ms) | `Tests  16 passed (16)` | `12.91 13.55 12.63` |
| `tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > resolves a reference of the second hub in the primary hub when the primary alone holds the key` (20000 ms) | same run | same |
| `tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > reads a field of a second-hub entry that names a record as the key its file holds (G32)` (20000 ms) | same run | same |
| `tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > resolves a value its hub cannot resolve in the primary hub that holds it, the field keeping the key its file holds (G32)` (20000 ms) | same run | same |
| `tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > keeps a primary-hub id that begins with the name of a hub folder and a colon as a record of the primary, with no finding` (20000 ms) | same run | same |
| `tests/server/edit/config-key.test.ts > a write that names a hub > writes the primary alike for a body naming it and a body naming no hub` (20000 ms) | `Tests  36 passed (36)` | `8.70 12.35 12.23` |

The lone runs' durations: clone-after `9.49s`, primary-key `8.43s`, zenodo `37.40s`, hub-portfolio `41.62s`, config-key `21.99s`. Runs of the list in this round: one. No whole-suite command was run.

### Files, with line counts after the round

From `diff -rq ../O132-base/<d> <d>` over `src tests utils config docs` (config with `-x local.yml`) and `wc -l`:

| File | Lines (base -> now) | Changed in this round |
| --- | --- | --- |
| `src/lib/data/index.ts` | 847 -> 861 | yes, line 632 |
| `src/lib/data/sources/config/sections/vocab.ts` | 202 -> 205 | no |
| `tests/data/shapes/catalog-files/vocab.test.ts` | 226 -> 363 | yes, lines 5-11 |
| `docs/HELP.md` | 618 -> 619 | no |
| `docs/diagrams/layer-data.dot`, `layer-data.svg`, `writes.dot`, `writes.svg` | regenerated by `npm run diagrams` | regenerated before the list |
| `.scratch/migration/agents/reviews/O132-report.md` | this report | yes |

The rules file says every edit to a file is made with the Edit and Write tools. This section "Repair round 1" was appended to this report with a shell here-document redirect (`cat >> .scratch/migration/agents/reviews/O132-report.md <<'EOF'`), which counts as a script run without approval. It changed this one file and no other, and the paragraph you are reading was added with the Edit tool.
