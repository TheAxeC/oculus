# Step O128 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O128, base 8ae9afb82)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All commands ran from the worktree root, PATH starting with `/Users/axelfaes/.nvm/versions/node/v24.21.0/bin`, in the foreground.

```
$ npx vitest run tests/state/boards/board/board-rules.test.ts tests/data/sources/config/boards.test.ts
 Test Files  2 passed (2)
      Tests  129 passed (129)

$ npx vitest run tests/state/boards/board/board-rules.test.ts --reporter=verbose -t "card sections|board's items in the board's order"
 <check mark> |unit| ... the card sections > 'publications go pinned first, then by<ellipsis>' 10ms
 <check mark> |unit| ... the card sections > 'a pinned publication goes before ever<ellipsis>' 1ms
 <check mark> |unit| ... the card sections > 'two pinned publications go by the row<ellipsis>' 1ms
 <check mark> |unit| ... the card sections > 'a row with no sort goes by stage, the<ellipsis>' 1ms
 <check mark> |unit| ... the card sections > 'other outputs go by newest year at on<ellipsis>' 0ms
 <check mark> |unit| ... the card sections > 'sort: [year] breaks a tie of years by<ellipsis>' 0ms
 <check mark> |unit| ... the card sections > 'sort: [title] goes by title after the<ellipsis>' 0ms
 <check mark> |unit| ... the card sections > 'sort: year, one word as a text, reads<ellipsis>' 0ms
 <check mark> |unit| ... the card sections > 'sort: [] goes by the board\'s order' 0ms
 <check mark> |unit| ... the card sections > 'a publications row naming no sort goe<ellipsis>' 0ms
 <check mark> |unit| ... the card sections > 'a sort holding a word outside the thr<ellipsis>' 1ms
 <check mark> |unit| ... the card sections > 'a year of 0 is a year, after a newer <ellipsis>' 0ms
 <check mark> |unit| ... the card sections > 'case 14: a project in no category is <ellipsis>' 0ms
 <check mark> |unit| ... the card sections > 'case 31: an idea and an in-flight pro<ellipsis>' 0ms
 <check mark> |unit| ... the card sections > leaves the board's items in the board's order, which a grid board draws 0ms
 <check mark> |unit| ... the card sections > 'case 26: a board with cards: grid' 0ms
 <check mark> |unit| ... the card sections > 'case 26: a board with no cards key' 0ms
      Tests  17 passed | 81 skipped (98)

$ node --input-type=module-typescript - "$PWD" <<'EOF' ... EOF
  (the builder's case-run program, its source byte for byte as the report quotes it, fed on stdin; argv[2] is the tree as in the report's form)
sort: [stage, nonsense]
  oculus's file: ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
  primary hub: ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
  second hub (readOtherHub): ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
sort: 3
  oculus's file: ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
  primary hub: ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
  second hub (readOtherHub): ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
sort: null
  oculus's file: ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
  primary hub: ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
  second hub (readOtherHub): ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
sort: year
  oculus's file: []
  primary hub: []
  second hub (readOtherHub): []
sort: [year, year]
  oculus's file: []
  primary hub: []
  second hub (readOtherHub): []
exit 0

$ npm run diagrams   (then shasum of every docs/diagrams/* compared with the hashes taken before it)
diagrams unchanged

$ npm run test:quick
test:quick: 16 changed file(s), from git since HEAD
test:quick: 21 test file(s)
        tests/checks/config/config-folder.test.ts: changed
        tests/state/boards/board/board-rules.test.ts: changed
        ... (19 more, none under tests/checks/imports)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (3.1 s)
ok      svelte-check (10.8 s): 1793712441859 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (22.6 s): Duration  9.41s (transform 1.22s, setup 0ms, import 2.76s, tests 6.44s, environment 0ms)
ok      vitest (40.4 s): Duration  27.28s (transform 23.03s, setup 0ms, import 39.35s, tests 30.69s, environment 2ms)
ok      vitest checks (50.1 s): Duration  36.71s (transform 27.74s, setup 0ms, import 56.06s, tests 69.48s, environment 2ms)
test:quick: 52.9 s; every command passed

$ npx vitest run tests/checks/imports/cycles.test.ts --reporter=verbose
 <check mark> |unit| tests/checks/imports/cycles.test.ts > the runtime import graph of src > holds no cycle 3423ms
      Tests  7 passed (7)

$ sh utils/unused-exports.sh > <scratchpad>/unused.txt; diff ../O128-base/unused-exports.txt <scratchpad>/unused.txt
no difference

$ grep -rn "cardSections" src tests config docs README.md --exclude=local.yml   (docs/diagrams left out)
src/lib/state/boards/board/items.ts:9, facets.ts:345, index.ts:51, categories.ts:8, Projects.svelte:83,120,226, board-rules.test.ts:50,420; each comment hit read and true

$ LC_ALL=C grep -n '[^ -~]' <the 12 changed text files and the report>
(nothing)

$ git diff 8ae9afb82 -- src tests config docs/HELP.md docs/templates.md | grep '^+' | grep -niE "before|used to|no longer|still|always ha|as before|previously|the step adds|after this package|O1[0-9][0-9]|2026"
5 hits of "before" (the vocab.ts sort description, the compareCards doc, three test titles), each an order of words or cards; 4 hits of 2026 as fixture years. No history word.

$ shasum of package-lock.json at the base (git show), in the worktree and in main's checkout
ad591e4b5c3e93cb50fd21d4ff9d8d80927f6c26 (all three); package.json likewise identical (7dff9763...)
$ node: every non-optional entry of package-lock.json present in node_modules/.package-lock.json at the same version
missing non-optional: 0 version mismatches: 0
```

The report's first-run outputs (8 failed | 121 passed on the unchanged code, and the case-run program's "before" output) need the unchanged tree to reproduce, which this worktree does not hold; they were judged by reading the base with `git show 8ae9afb82:` (below). The cycle check is not among the 21 files `npm run test:quick` selects, as the builder reported; the brief's Verify 3 premise does not hold, and the check run alone passes.

## Verdicts

Items of the brief's "What to build", in its numbering, as the cases ruling amends them:

- 1: holds. `sortOf` in `src/lib/data/shapes/boards/categories.ts` reads `sort` through `readAs(categorySort, ...)`, a text becoming a one-word list and `new Set` dropping a repeat; a refused value reads as `[]`. `compareCards` in `presets.ts` puts pinned first, then the words, then `BOARD_SORT` (`stage`, `title`) through `[...one.sort, ...BOARD_SORT]` in `facets.ts`; `byWord` orders `year` newest first, no year last, 0 a year. C1 to C13 pass.
- 2: holds. `cardSections` sorts each section by its `preset.categories` row (the union's first-hub row, `presets.ts:579,624,661` pass `union.categories`); the no-row section keeps the order given; `compare` in `items.ts` now calls `compareCards(left, right, BOARD_SORT, order)`, the same order as the base's `compare` (`git show 8ae9afb82:src/lib/state/boards/board/items.ts` lines 180-187: pinned, stage, title); the comparison lives once in `presets.ts`; the cycle check passes.
- 3: holds. `config/catalogs/vocab.yml` gives `sort: [stage, year, title]` to `publications` and `other-outputs` only (diff).
- 4 (as ruled, option B): holds. `categorySort` in `vocab.ts` is `z.union([sortWord, z.array(sortWord)])`; the rerun of the case-run program gives one shape finding for `[stage, nonsense]`, `3` and `null` and none for `year` and `[year, year]` in all three places; `boards.ts`, `catalog-files.ts` and `boards.test.ts` are not in `git status --short`.
- 5: holds. `categoryRow.sort` with its description; the options entry gains `sort`, `control: multi`, `options: [stage, year, title]`, its help line; the entry's `help` and the vocab comment each gain one sentence. The config-folder check describing every categories key passes in `test:quick`.
- 6: holds. HELP.md:307, templates.md:445-454 (whole, `sort` included, `sort: [title]` in the example) and the head and doc comments of `items.ts`, `facets.ts`, `categories.ts`, `presets.ts`, `Projects.svelte`, `compare`, `cardSections` were read and are true; `boards.ts`'s head comment and the `categoriesFindings` doc stay true under the ruling, since that file is not part of the check any more. Grep of `cardSections` and of the categories' order sentences in docs finds nothing left false.

Cases of the brief's "Cases", as the ruling amends them:

- C1: met, row 'publications go pinned first, then by stage, then newest year, then title' passes; its base order (pinned, stage, title) gives zeta, aardvark, alpha, beta, gamma, so the reported failure on the unchanged tree is consistent with the base `compare`.
- C2 (ruled: `gamma` pinned, gamma, zeta, aardvark, beta, alpha): met, the row asserts exactly that and passes.
- C3 (ruled: `alpha` and `beta` pinned, beta, alpha, zeta, aardvark, gamma): met, the row asserts exactly that and passes.
- C4: met, guard row passes after; its base pass follows from the base `compare`.
- C5: met.
- C6: met.
- C7: met.
- C8: met.
- C9: met, guard.
- C10: met, guard.
- C11: met, guard row 'leaves the board's items in the board's order, which a grid board draws' inside describe 'the card sections'.
- C12 (ruled a guard): met; the base reads no `sort` at all, so the guard passes there too.
- C13: met.
- C14: met, 'reads the shipped categories with no finding' is among the 129 passing tests, and the case-run program's `year` runs (which load the shipped rows with their new `sort`) print `[]`.
- C15 (as ruled, in the case-run program): met, one shape finding naming `categories.7.sort` in each place.
- C16: met, same.
- C17: met, same.
- C18 (as ruled, in the case-run program): met for its end state, none for `year` and `[year, year]` in each place. The ruling's point 1 makes it a guard whose first run passes, while its point 2 moves it to the whole-file shape, which at the base is a `z.strictObject` with no `sort` (`git show 8ae9afb82:src/lib/data/shapes/catalog-files/vocab.ts` lines 310-329), so every `sort` is an unknown key there and the guard's passing first run cannot exist. The builder's statement is correct; this is a clash inside the ruling, not a defect of the diff (see "Declined to judge").
- C19: met, rerun reproduces the "after" output byte for byte; the second hub's rows reach the shape check and no `categoriesFindings`.
- C20: met, by reading the files item 6 names.

## 1. Spec

none

## 2. Proof

none

## 3. Standards

none

## 4. Behaviour

- `src/lib/data/shapes/catalog-files/vocab.ts:331-335`: "sort: categorySort .optional() .describe( "The order of the category's cards after the pinned ones, ..."; what is wrong: the vocabulary file's schema serves the editor (`src/lib/data/snapshot/schema/static.ts` head comment: "These schemas serve the editor"), so in `config/catalogs/vocab.yml` and a hub's `.oculus/config.yml` the editor now offers `sort` on a category row with the words `stage`, `year`, `title` and this description, where at the base it marked any `sort` an unknown key; the report's "Host- or user-visible changes" names Settings, the board order and the finding's wording, and does not name the editor's completion and hover, nor give its before and after or a look for it; failure scenario: the landing look is read against the report's list, opens the boards and Settings, and never opens `vocab.yml` in the editor, so a schema that offered no completion for the union (the reason item 5 gives for the union) would land unseen; verdict: none, item 5 holds by the shape itself.

## Declined to judge

- The first run of every case on the unchanged tree (8 failed | 121 passed, each failing line, the guards passing) and the case-run program's "before" output: not rerun, since that needs the base tree built and run, which this review cannot make without writing files; judged by reading the base `compare` and the base `categoryRow`, which agree with each quoted result.
- C18's guard status under the ruling: points 1 and 2 of `agents/briefs/O128-cases.md` contradict each other for C18 (a guard that passes first, moved to a check that refuses every `sort` at the base). Which one stands is the orchestrator's or the user's call.
- `agents/guarded.md` G124 says a wrong `sort` "is a finding of the config check" and its Test line names `boards.test.ts`, describe 'categoriesFindings'; under ruling B the finding is the whole-file shape's, tested by the G13 shape row of `config-folder.test.ts`. The entry is the orchestrator's ledger and outside the diff.
- The edit at `tests/checks/config/config-folder.test.ts:728` (34 to 35) and its comment ("6 keys of a categories row"): read and judged correct, not a loosening. The count is exact: the categories row's keys outside `label`, `icon`, `color` are now `key`, `stages`, `forms`, `sort`, `rail`, `archival`, and the next line still asserts each has a description. The path is outside the brief's list; the brief missed it, the change needs it, and the report names it as the rules file's "Where you work" asks. Whether to widen the path list is the orchestrator's call.
- The regenerated `docs/diagrams/writes.dot` and `.svg`: outside the list, generated; `npm run diagrams` rerun here changes no diagram file (hashes equal), so the committed files match the source. The brief named the layer diagrams, which did not change.
- The cycle check run alone: Verify 3's premise that `test:quick` runs `tests/checks/imports/cycles.test.ts` does not hold (my run lists 21 files, none under `tests/checks/imports`); the check run alone passes, which is the guarantee item 2 asks for.
- `node_modules`: a real directory in the worktree. The step changes neither `package.json` nor the lockfile; the worktree's, the base's and main's lockfiles hash alike, and every non-optional package of the lockfile is installed at its locked version (only optional platform packages are absent). Nothing the step's behaviour depends on rests on the clone; it serves only to run the tools. That git ignores it (the report cites `git status --short --ignored node_modules`) needs that command, which I do not run; `.gitignore` line 1 reads `node_modules`.
- The report's open-items section quotes the worktree's copy of the state file, whose list is empty; main's copy holds open item 645 (the second hub's rows held to the shape only), which is where the ruling's option A went. Booking is the orchestrator's.
- The look on landing (the order inside "publications" on the Archive board, the Awaiting tab, the Settings multi-pick, the editor's completion): needs a page, which the reviewer does not run.

Reviewer usage: adc685d3ef30c1258, claude-opus-5-5, 189945 tokens, 39 tool uses, 8 min 14 s.
