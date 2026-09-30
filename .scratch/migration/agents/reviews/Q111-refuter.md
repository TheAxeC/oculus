# Step Q111 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q111, base 34d6a249)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

All of these ran from `tools/oculus` in the worktree, in the foreground. `npm run diagrams` ran first and changed no tracked file: `git status --short` before and after lists the same thirteen paths, none under `docs/diagrams`. The verify list below is `checks.sh` over the main checkout's state file. It printed 751 lines, and every line of it is quoted except the build's asset table and the plugin-timing notes (output lines 37 to 737).

```
$ npm test
 Test Files  352 passed | 19 skipped (371)
      Tests  5408 passed | 559 skipped (5967)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790799437688 COMPLETED 2476 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
(!) Some chunks are larger than 500 kB after minification. ... (asset table elided)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
> eslint .
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
(exit 0)
```

The commands the report quotes as evidence, rerun in the same form:

```
$ npx vitest run tests/routes/edit tests/server/edit --reporter=dot
 Test Files  13 passed (13)
      Tests  365 passed (365)
$ npx vitest run tests/routes/edit/undo-removed.test.ts
 Test Files  1 passed (1)
      Tests  35 passed (35)
$ npx vitest run tests/server/edit/yaml-edit-removed.test.ts
 Test Files  1 passed (1)
      Tests  26 passed (26)
$ npx vitest run --tagsFilter '!slow' tests/server/edit/yaml-edit.test.ts
 Test Files  1 skipped (1)
      Tests  53 skipped (53)
$ grep -n 'module-tag' tests/server/edit/yaml-edit.test.ts
12:// @module-tag slow: its cases time out or fail on a loaded machine, so npm test leaves it out.
$ grep -n 'still shared' tests/checks/tree/duplication.test.ts
597:    it('holds the lists to clones that are still shared, so a repaired copy takes its entry with it', () => {
$ sed -n 184p src/lib/server/edit/writes/undo.ts ; sed -n 415p src/lib/server/edit/writes/manifest.ts ; grep -o 'writes/undo.ts:[0-9]*\|writes/manifest.ts:[0-9]*' DESIGN.md
    if (change.undo === 'none') return { error: 'nothing' };
                undo: 'none'
writes/undo.ts:184
writes/manifest.ts:415
$ grep -rnE 'insertRemoved|RemovedText|SetFieldsResult' src tests config --exclude=local.yml HELP.md DESIGN.md README.md
  (hits only in yaml-edit.ts, writes/manifest.ts, core/changes.ts and the two new test files; insertRemoved defined yaml-edit.ts:834, used manifest.ts:204; SetFieldsResult yaml-edit.ts:69; RemovedText changes.ts:45, the record key changes.ts:84)
$ LC_ALL=C grep -c '[^ -~]' DESIGN.md HELP.md
HELP.md:0
DESIGN.md:0
$ LC_ALL=C perl -ne '...spec.md ASCII gate...' $(find src tests bin config -type f ! -name local.yml)
  (prints nothing)
```

The "cases on the unchanged tree" claims were rerun. The reviewer copied `tools/oculus` into the session scratchpad, reversed the step's `src` diff there with `patch -R` (worktree untouched) and ran the two new test files over the unchanged source:

```
$ npx vitest run tests/routes/edit/undo-removed.test.ts tests/server/edit/yaml-edit-removed.test.ts --reporter=verbose   (unchanged src)
 Test Files  2 failed (2)
      Tests  44 failed | 17 passed (61)
```

These 17 pass on the unchanged source: case 10, case 13, the ten case 14 variants, the two case 26 tests, the two "keeps nothing" tests of case 16, and "refuses to write over a field edited since". Every other test fails. This matches the report's first-run table.

The report cites `changes.ts:83` for the record key, which is at `changes.ts:84`. No decision rests on that line number.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds.
  - `setFields` answers `SetFieldsResult` (yaml-edit.ts:69, 712), and `EditResult` is unchanged.
  - Each removal is taken from its own splice (`spliced`, and `points.set` at yaml-edit.ts:753-755 when `length === 0 && to > from`).
  - The point is carried through later splices by `moved` (yaml-edit.ts:675-683).
  - `next` is computed by `lineFrom` after the final check (yaml-edit.ts:771-777).
  - A write that is refused or not verified answers `removed: {}`.
  - The tests "moves a point by the change in length of an edit above it" and "moves a point to the start of a later removal that holds it" pass here and fail on the unchanged source.
- 2: holds.
  - `RemovedText` with per-key doc comments (changes.ts:41-60) and `removed?` on `ChangeRecord` (changes.ts:80-84).
  - `writeManifest` puts it only on the records of fields with an entry (manifest.ts:305-316).
  - The log shape is unchanged.
- 3: holds, by reading.
  - `back` is read only for `reading === 'record'` and one field.
  - Every check runs in the loop before `putBack`: not found, `insideHub`, schema name or group, `unwritable`.
  - `insertRemoved` repeats `READ_ONLY` through `settable`.
  - The order of places in `placesOf` (yaml-edit.ts:805-826) is: the places of `next` by distance, the earlier at equal distance, a line start required for whole-line text and no index inside a surrogate pair; then the remaining line starts, only for whole-line text.
  - When no place passes, the undo falls to today's value write, or to the group refusal.
  - The write goes through `writeTextAtomic`, and the undo's own record carries no `removed`.
  - The tests of this item are weaker than the code: see Proof 1, 2 and 3.
- 4: holds. "puts the removal back again when the undo itself is undone" passes, and the second clear's record equals the first's `removed`.
- 5: violated in one part, Standards 1. The three doc sentences are present at DESIGN.md:140, DESIGN.md:376 and HELP.md:254, and DESIGN.md:313 was corrected to 184 and 415. The new head comment of yaml-edit.ts describes `insertRemoved` without its fallback to line starts.

Cases of the brief's "Cases":

- 1: met, "gives a title back with its quotes and its comment" (`toBe(TITLED)`).
- 2: met, "gives a status line back as the only child of its map".
- 3: met, "gives a block list back in the block style".
- 4: met, "gives a group cleared whole back" (200 and the text).
- 5: met, "gives a key of a flow map back inside its line".
- 6: met, "gives two fields of one write back in either order of the undos".
- 7: met, "gives two neighbouring fields back exactly when the upper one is undone first". The lower-first text `...short: s\ntitle: T\nnext: go\n` is asserted and quoted in the report.
- 8: met, "finds the place again after a line above it was rewritten", both lengths.
- 9: met, "finds the place again after the same write changed a field above it", both key orders.
- 10: met, "writes the value into the map that has come back when no place keeps one status".
- 11: met, "puts the lines at the nearest line start when the line that followed was edited". The text is quoted in the report.
- 12: met, "puts the lines before the occurrence of the following line nearest where they stood". The expected text distinguishes the two `# --` places.
- 13: met, "appends the value as before when the record has no removed lines".
- 14: met. The ten variants undo as today with no throw. The test cannot tell an ignored `removed` from one that was tried and failed to fit: Proof 2.
- 15: met, as for item 4.
- 16: met, the three tests of "what a change record keeps of a removed field".
- 17: met, "finds the place again when the record stood past the end of the file" (offset 99999).
- 18: met, the six shapes and the two-field write in yaml-edit-removed.test.ts:39-101, with the brief's offsets.
- 19: met, "answers the source unchanged when no place keeps the document right".
- 20: met, "keeps a key added at the end of the file since".
- 21: met, by reading.
  - `src/lib/state/sessions/changes.svelte.ts:19-31` declares no `removed`.
  - `History.svelte` draws `before` and `after` through `sides(row)` (lines 75-78, used at 142-143) and the control from `row.undo` (line 132).
  - `readChanges` returns each parsed line whole (changes.ts, `parseLine`).
- 22: met, the pure and route CRLF tests (`{ offset: 11, text: 'title: T\r\n', next: 'next: go\r' }` and the bytes back).
- 23: met, the pure and route no-final-line-break tests.
- 24: met, "gives a block scalar back with the line breaks it keeps", both `|+` and `|` (whose `next` is empty).
- 25: met, "gives back a list of maps cleared by an empty list, and a map cleared by an empty map".
- 26: met. `tier`, `id`, `paths`, `nosuch` and `type` are refused as today, with the file unchanged. The test's `removed` can never fit, so it does not prove the checks run first: Proof 1.
- 27: met, "gives a title with a letter outside ASCII back".
- 28: met, "counts the offset in UTF-16 code units, past a character outside the BMP" and "never tries an index between the two halves of a surrogate pair". The second discriminates: `next: '\ude00'` is refused.

The deviations the report names were checked, and each holds on its evidence:

- The pure cases are in a new untagged file, because `yaml-edit.test.ts:12` carries `@module-tag slow` and `--tagsFilter '!slow'` skips all 53 of its tests.
- The helpers `hold`, `wrote`, `undone` and `recorded` moved to `write-fixture.ts` so the two route files share them, as the brief allows.
- The line removed from `allow-duplication.txt` is required: `duplication.test.ts:597` fails on a held pair that is no longer a clone. The step's `spliced(...)` return in `replaceValue` ended that clone. Removing the line narrows the allow list, which is the opposite of an exemption.
- The two `removed: {}` assertions in `yaml-edit.test.ts:353,365` follow from the new result type.

## 1. Spec

None.

## 2. Proof

- `tests/routes/edit/undo-removed.test.ts:297-317`: `const removed = { offset: 0, text: 'x: 1\n', next: '' };` with `'refuses a record of a field no write may set, whatever removed says'`.
  - What is wrong: case 26 and item 3 exist to prove that the schema checks run before any insertion. `x: 1\n` can never pass the parse check for any of these fields, so the insertion would fail and fall to today's refusal even if it ran first.
  - The reviewer showed this on a scratch copy. It added an early `insertRemoved` call before the loop's checks in `writeManifest`. With that change the test still passes (`Tests 11 passed` together with the case 14 tests). A probe record for `nosuch` with a fitting `removed` (`text: 'nosuch: x\n'`) answers `NOSUCH 200 false`: the file is written. The worktree's code answers `NOSUCH 400 true`.
  - Failure scenario: a later refactor moves the insertion ahead of the schema checks. A hand-edited or stale log line for `nosuch`, or a `keymap` field such as `paths`, then writes into a tracked `project.yml`, and this test stays green.
  - The fix is a `removed` whose text fits, for example `nosuch: x\n` before the first line, and `paths:\n  doc: a.md\n` for `paths`.
  - Verdict: case 26 stays met on its stated result. The finding is against the test.
- `tests/routes/edit/undo-removed.test.ts:258-279`: `['a negative offset', { offset: -1, text: 'x', next: '' }]`, `['empty text', ...]`, `['a fractional offset', { offset: 3.5, text: 'x', next: '' }]`.
  - What is wrong: with `text: 'x'` nothing can fit anywhere, so each of these undoes as today whether `removedOf` rejects the value or not.
  - The reviewer showed this on a scratch copy. It loosened `removedOf` (manifest.ts:183-189) to accept any numeric offset and an empty text. All ten variants still pass.
  - A probe with `{ offset: -1, text: 'title: "A title"\n', next: '' }` shows the behaviour the validation decides. The worktree's code appends `title: A title` as item 3 says. The loosened code puts `title: "A title"` back.
  - Failure scenario: the offset or empty-text validation is dropped or broken, a malformed log line is then used as if well-formed, and the suite stays green.
  - The fix is a text that fits the file in each variant, as in the probe.
  - Verdict: case 14 stays met on its stated result.
- `tests/server/edit/yaml-edit-removed.test.ts:218-222`: `it('tries the earlier of two places at the same distance', ...)` with `const text = 'a: 1\n# --\n# --\n'; const removed = { offset: 10, ... }`.
  - What is wrong: the places of `# --` are 5 and 10, at distances 5 and 0 from the offset, so there is no tie. The test proves nearness, as the test above it already does.
  - The reviewer reversed the tie-break in `placesOf` (yaml-edit.ts:823, `|| one - other` to `|| other - one`) on a scratch copy. All 26 pure tests still pass.
  - On a real tie (`'a: 1\n# --\nx: 2\n# --\n'`, offset 10, places 5 and 15), the worktree's code gives `a: 1\nb: 2\n# --\nx: 2\n# --\n` (the earlier place). The reversed code gives `...x: 2\nb: 2\n# --\n`.
  - Failure scenario: the tie rule item 3 fixes regresses, and a reader who trusts the test name believes it is covered.
  - Verdict: none. The tie rule is in item 3's text, and no numbered case covers it.
- The report's first-run table, and the tests that are not cases.
  - Covered: "keeps the comma before a later key of a flow map", "moves a point by the change in length...", "moves a point to the start of a later removal...", "reports nothing for a field that was replaced or added", "reports only the fields that were written", "reports nothing for a manifest that does not parse", "reports nothing when the result did not verify...", "tries the place of the following line nearest...", "falls to the nearest line start...", "refuses the fields a write never sets...", "does not insert a key the file already holds", and the route test "refuses to write over a field edited since".
  - What is wrong: these have no first-run row of their own. The pure ones are folded into "case 18 ... fail: Cannot read properties of undefined", which is not the failure several of them give.
  - The reviewer's own run on the unchanged source (above) shows each pure one failing, and the route one passing, since that behaviour is preserved. So the claim holds, but the report does not show it.
  - Failure scenario: a reader of the report cannot tell from it which tests were seen failing first.
  - Verdict: none.

## 3. Standards

- `src/lib/server/edit/yaml-edit.ts:13-17`: "insertRemoved puts them back at the place of that line which keeps the document what the earlier value says it was, under the same check."
  - The same wording is in `tests/server/edit/yaml-edit-removed.test.ts:1-4`.
  - What is wrong: `insertRemoved` also tries every other line start for whole-line text when no place of `next` passes (`placesOf`, yaml-edit.ts:821-825). A head comment the change wrote therefore describes only half the function. The brief's item 5 asks the head comments to be true, and spec.md's "What every package obeys" says a sentence the change makes false is a defect.
  - Failure scenario: a maintainer reads the head, believes a line whose following line was edited is never placed elsewhere, and is surprised when case 11's text comes back at a different line start.
  - Verdict: item 5 violated in this part.
- `tests/routes/edit/undo-removed.test.ts:3`, `:250` and `:272`: "is undone by writing the value, as before", "appends the value as before when the record has no removed lines", "writes the value as before when removed is ...".
  - What is wrong: "as before" refers to what the code did before this change. spec.md's "What every package obeys" says a comment says what and why, never an earlier state. It should read "as a record without it", or "by writing the value".
  - Failure scenario: once the step is history, a reader cannot tell what "before" means.
  - Verdict: none.
- `DESIGN.md:140`, `DESIGN.md:376` and `HELP.md:254`: "when the following text is gone, the text goes back at the nearest line start that gives the right values, and only when none does does the value come back as a new line".
  - What is wrong: this is false for a removal from inside a line (a flow map's key, case 5). For such text `placesOf` tries no line start (yaml-edit.ts:821 `whole ? ... : []`). When its `next` is gone, the undo falls straight to the value write, which reorders the flow map (`status: { chips: [a, b], line: x }`) and adds no new line.
  - The sentence follows the brief's item 5 wording, so the correction is a clause for partial-line text, made at landing or through the brief's author.
  - Failure scenario: a reader expects a cleared flow-map key whose neighbour was edited to come back at a line start. It comes back rewritten into the map.
  - Verdict: none (the brief's text).

## 4. Behaviour

None. The report states the History undo change with its before and after. It names the new key in `~/.oculus/changes.jsonl` under "Shapes named in this step". It notes that `GET /api/changes` carries `removed` and does not draw it (case 21).

## Declined to judge

- The look at History on TEST: it is the orchestrator's at landing, and the reviewer starts no server.
- The report's "User-visible changes" names "a quick-add or a link removal" as sources of a clear. The reviewer did not trace those two write paths to `writeManifest`.
- The cost of an undo on a large manifest, one parse per place tried, most for an empty `next` over partial text, where every line end is a place. The report says it is not measured, and no command here measures it.
- Whether the change log should hold the full text of a large cleared block (an `abstract`) twice, in `before` and in `removed.text`. This is a shape Z110 (c) ruled, so it is the user's call.
- Whether `yaml-edit.ts` at 857 lines should already move `placesOf` and `insertRemoved` into their own module. It is under the 1000-line limit, and the brief leaves the split to judgment.
- The mutation probes and base runs above ran on copies of `tools/oculus` in the session scratchpad, with the worktree's `node_modules` linked, and the copies were removed after. The worktree and the main checkout were not changed: `git status --short` lists the same thirteen paths before and after the review.

Reviewer usage: tokens not measured by the reviewer (the runner's completion notice holds them); about 50 tool uses; minutes not measured.

Model: claude-opus-5-5 (Opus 5.5)


Usage: reviewer a540291c88c1458ad, served claude-opus-5-5; 230,315 tokens, 51 tool uses, 17.6 min (from its completion notice)
