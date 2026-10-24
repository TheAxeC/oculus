# Refutation of O66

O66 review: all four items hold and all eleven cases are met. There is one Standards finding: the builder ran the quick verify list three times, one more run than spec.md allows. I made no edit and ran no git command that changes state. My scratch case-run folders under `$TMPDIR` are deleted (`ls` of each: "No such file or directory").

Verification lines (from the worktree root `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O66`; each output went to a file and was read with its own exit status)

1. `npm run test:quick -- --base 5b866adf` (the state file's verify note: "a reviewer adds `-- --base <base>`"), run once, exit 0:
```
test:quick: 11 changed file(s), from git since 5b866adf
test:quick: 8 test file(s)
ok      ASCII gate (0.6 s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      svelte-kit sync (13.7 s)
ok      vitest (13.3 s): Duration  6.73s (transform 11.75s, setup 0ms, import 14.92s, tests 3.32s, environment 2ms)
ok      eslint (15.4 s)
ok      svelte-check (18.2 s): 1792861623197 COMPLETED 538 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 32.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```
2. Character-set check. `printf '%s\0' <the 10 changed files + .scratch/migration/agents/reviews/O66-report.md> | xargs -0 env LC_ALL=C grep -n '[^ -~]'` printed nothing: `charset exit 1`. spec.md's perl gate over the six source and config files printed nothing: `perl gate exit 0`.
3. `grep -n "CHIPS\|ROWS" src/lib/views/system/gallery/Gallery.svelte` printed nothing: `check3 exit 1`.
4. `grep -n "slice(0," src/lib/views/system/gallery/Gallery.svelte`:
```
99:    const leading = $derived(rows.slice(0, 3));
195:                        {#each chips.slice(0, 2) as chip (chip.key)}
```
5. `grep -n "msg_no_venue" config/text/views/system/audit.yml`:
```
42:        msg_no_venue: at the stage {0}, which carries a venue, but no venue
```
6. `sh utils/unused-exports.sh` (exit 0): 343 lines. The base's `unused-exports.txt` also has 343 lines. `diff` of the two printed nothing (`diff exit 0`), so the step added no line.
7. Comments: `git diff 5b866adf -U0 -- src config | grep '^+' | grep -E '//|\*|<!--|#' | grep -iE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"` prints one line: `+ * rather than throwing: a half-read config still renders a page.` That is the old sentence of `setVocab`'s comment, rewrapped, and "still" there means "even so". I read every added comment line (`git diff 5b866adf -U0 -- src | grep '^+' | grep -E '^\+\s*(//|\*|/\*\*|<!--)'`) against spec.md. None carries history, a package id or non-ASCII. `awk 'length > 100 && !/eslint-disable/'` over the four changed source files printed nothing (`awk exit 0`). The `legendRows` sentence "A row that is not a map ... left out" matches the code: `legendRowShape` is a `z.object`, and `readAs` gives null when it refuses.

Builder's quoted commands, rerun in the same form
- `npx vitest run tests/routes/docs/audit.test.ts tests/state/boards/board/board-rules.test.ts tests/state/boards/board/hub-facets.test.ts tests/checks/tree/boundaries.test.ts tests/checks/source/keys.test.ts`, exit 0: `Test Files  5 passed (5)`, `Tests  107 passed (107)`. Matches the report.
- `npx vitest run tests/checks/source/keys.test.ts tests/checks/config/config-folder.test.ts`, exit 0: `Test Files  2 passed (2)`, `Tests  39 passed | 2 skipped (41)`. Matches.
- Reuse grep `grep -rn "stageLabel\|stage_label\|stageLabels" src tests` over the base copy printed nothing (exit 1). Matches.
- `grep -rn "legendRows\|legendLists\|legend\.\|byKey(legend" src tests` outside `tones.ts` names `src/lib/ui/controls/editor/kit/lsp/semantic.ts:57,61,91` and `src/lib/server/machine/lsp/held/held.ts:128` (both an LSP token legend), plus the Gallery's new `legendLists` lines 57 and 79. This matches the report's pre-change reading.
- Name grep `grep -rn "chipsByTone\|chipKeys\|legendLists\|LegendList" src tests docs README.md config --exclude=local.yml` (`docs/diagrams` filtered out) names only `tones.ts:38,46,279,288,307`, `facets.ts:12,105` and `Gallery.svelte:53,55,57,58,71,79,87,91`. Matches.
- Group keys `grep -rn "group_stages\|group_forms\|group_chips" src config tests --exclude=local.yml` gives `Gallery.svelte:72-74` and `gallery.yml:26-28`. Matches.
- File line counts (`wc -l`): tones.ts 318, Gallery.svelte 363, gallery.yml 42, audit.yml 75, rules.ts 376, projects.ts 542. Matches the report's table. `diff -rq` against the base copy over `src`, `config`, `tests` and `utils` lists only the four source files and the two text files; `tests` and `utils` are unchanged, so `FROZEN` is unchanged.
- The report's signature `2d217e014818` for scope `projects/p`: my `signatureOf('projects/p', 'venue', 'data', 'audit.msg_no_venue', [])` printed `SIG projects/p: 2d217e014818`.

My case-run program for cases 5 to 11 lived in `$TMPDIR/o66-review-cases`, with a vitest config (svelte plugin, root the worktree) and two copies of one program: one importing from the worktree, one from the base copy `O66-base`. Each loaded the config with `loadConfig(<its own root>)`; neither folder holds a `local.yml`. Command: `npx vitest run --config $S/vc.mts --reporter=verbose`, exit 0, `Tests  2 passed (2)`. Lines printed:
```
[new] case 5: [{"list":"stages","keys":["a","b"]}]
[new] case 6 shipped first: [{"list":"stages","keys":["nascent",...,"stopped"]},{"list":"forms","keys":["journal",...,"tech-report"]},{"list":"chips","keys":["blocked",...,"ai-tells"]}]
[new] case 6 second: [{"list":"forms","keys":["f1"]},{"list":"chips","keys":["c1"]}]
[new] case 6 chipKeys: ["f1","c1"]
[new] case 7 lists: [{"list":"stages","keys":["x"]},{"list":"chips","keys":["x"]}]
[new] case 7 chipKeys: ["x"]
[new] case 7 byTone: [{"tone":"red","key":"x","count":1}]
[new] case 7 label,glyph: ["CX","pin"]
[new] case 8: [{"list":"stages","keys":["t"]},{"list":"forms","keys":["poster"]}]
[new] case 8 chipKeys: ["t","poster"]
[new] case 9 chipKeys: [25,["nascent","scoping","de-risking","exploring","in-prep","building","submit-ready","submitted","revision","published","released","failed","stopped","journal","conference","thesis","abstract","poster","tech-report","blocked","parked","results-in","admin-prep","numbers-to-run","ai-tells"]]
[new] shipped byTone: [["violet","nascent (concept)",1],["cyan","scoping (lit-check and framing)",1],["green","de-risking (feasibility experiment)",2],["honey","exploring",1],["gold","in preparation",1],["brass","building",1],["orange","submit-ready",1],["sky","submitted / under review",1],["amber","major revision (back with the authors)",1],["teal","released",1],["red","failed (no-go or disproved)",1],["grey","stopped (dropped or abandoned)",13]]
[new] sig key no arg: "b54dd1f2f431"
[new] case 10 in-prep: [["at the stage in preparation, which carries a venue, but no venue","b54dd1f2f431"]]
[new] case 10 submit-ready: [["at the stage submit-ready, which carries a venue, but no venue","b54dd1f2f431"]]
[new] case 10 submitted: [["at the stage submitted / under review, which carries a venue, but no venue","b54dd1f2f431"]]
[new] case 10 revision: [["at the stage major revision (back with the authors), which carries a venue, but no venue","b54dd1f2f431"]]
[new] case 10 published: [["at the stage published, which carries a venue, but no venue","b54dd1f2f431"]]
[new] case 10 building: []
[new] case 10 stopped: []
[new] case 10 published with venue: []
[new] case 11 wip: [["at the stage wip, which carries a venue, but no venue","b54dd1f2f431"]]
[new] case 11 wip empty label: [["at the stage wip, which carries a venue, but no venue","b54dd1f2f431"]]
[base] case 5: "no legendLists export"   (and the same for cases 6, 7 lists, 8 and the shipped lists)
[base] case 9 chipKeys: [25,[...same 25 words in the same order...]]
[base] shipped byTone: [...identical 12 rows...]
[base] case 10 in-prep|submit-ready|submitted|revision|published: [["published/submitted but no venue (no venue renders on the card)","b54dd1f2f431"]]
[base] case 10 building: []   stopped: []   published with venue: []
[base] case 11 wip: [["published/submitted but no venue (no venue renders on the card)","b54dd1f2f431"]]
```
(`...` stands for word lists printed in full in the run; they are identical to the case 9 line.) The signature is the same at the base and in the worktree for every placed stage. The base copy has no `legendLists`, which matches the builder's first run.

## Verdicts

Items
1. Word helpers keep each word's list (`tones.ts`): holds. The lists live in the existing `legend` binding, now of type `Installed`, `{ words, lists }` (tones.ts:44-53), and no module-level `let` was added (`tests` unchanged in `diff -rq`, and the boundaries test passed in the 107-test run). `legendLists()` (tones.ts:288-291) reads `configGeneration()` and returns copies. `chipKeys`, `chipLabel`, `chipTone`, `chipGlyphName` and `chipsByTone` behave the same (cases 7 and 9, worktree and base identical). `facets.ts` is unchanged, and the comment above `legendLists()` says what it returns.
2. The Gallery draws every word: holds. `CHIPS` and `ROWS` are gone (check 3). The Chips section draws one group per `legendLists()` row, headed by the literals `t('gallery.group_*')` (Gallery.svelte:71-84, 226-236). Each `h4` is `--fs-xs`, weight 600, no colour (:333-337), and `h3` is unchanged. The Tags section draws the same groups (:245-249). The table draws every hue (:90-96). The first card, the toned card, the Meters and the Ticker read the first words and the first three rows, and `most` is taken over `leading` (:99, :126). The fills match the base: the base's `most` over 8 rows is 2 and the new `most` over 3 rows is 2 (counts from the byTone line). The head comment (:24-27) says what the Gallery draws now.
3. `gallery.yml`: holds. `group_chips`, `group_forms` and `group_stages` are in alphabetical place (:26-28), and `col_chip: Word` and `col_count: Words` (:11-12).
4. The no-venue finding names the stage: holds. `audit.yml:42` matches ruling 317 (a) word for word, and it is the only line changed in that file (diff). `AuditRules.stageLabel` is built by `stageLabelOf(config)` in `auditRules` beside `placedStages` (rules.ts:148-156, 188), with a comment. projects.ts:221-223 passes the label and `signed: []`. The signature is unchanged (case run).

Cases
1. Met by reading. `legendLists()` under the shipped vocabulary gives 13, 6 and 6 words, `stopped`, `journal` and `ai-tells` among them, and each group draws an outline row and a filled row under Both (:228-235). The look on TEST is still owed at landing.
2. Met by reading: the same three groups as tags, 25 in all (:245-249). Look owed.
3. Met by reading and by the case run's byTone line: 12 rows in the stated order, green "de-risking (feasibility experiment)" 2, grey "stopped (dropped or abandoned)" 13. Column headings are Word and Words. Look owed.
4. Met by reading: `shown` (:117-123) keeps a row whose tone or label holds `grey`. Only the tone `grey` does, and no label in the byTone line contains "grey". Look owed.
5. Met (case run). The Gallery half by reading: there is no empty group, so there is no Forms or Chips heading.
6. Met (case run): only the second config's lists are returned.
7. Met (case run): `x` is in both rows, listed once by `chipKeys`, counted once by `chipsByTone`, and drawn with the later list's label and glyph (`["CX","pin"]`). The Gallery half by reading: `sample('x')` in both groups.
8. Met (case run): `__proto__` and the non-map rows `journal: true` and `k: true` are left out, and an empty `chips` gives no row.
9. Met (case run): 25 words in the same order as at the base.
10. Met (case run): the five sentences are as stated, the signature equals the base's, and `building` gives no finding.
11. Met (case run): "at the stage wip, ..." both with no label and with an empty label.

## Spec
none. The four `docs/diagrams` files outside the write list change one edge count each (47 to 48, 519 to 520). That fits the one new import of `data/shapes/shapes.ts` in `rules.ts`. spec.md "Token discipline" runs `npm run diagrams` before each run of the list, and the report names these paths and the reason. The new export `type LegendList` is not named by the brief. It is an internal detail with one importer (the Gallery) and adds no line to the unused-exports list.

## Proof
none. `LISTS` (tones.ts:35) is a module-level `as const` tuple that is never written and not exported, so it is no file-scope mutable binding. `FROZEN` is unchanged.

## Standards
1. spec.md "Token discipline": the verify list ran one time more than the rule allows. The place is `O66-report.md`, "Runs of the verify list and whole-suite commands":
   > `npm run diagrams && npm run test:quick` ran three times. The first was red on svelte-check ... the second run was green. The third ran after the last change, which rewrote two comments (the Gallery head comment and the comment over `signed: []`) after the second run
   The rule allows one run after the last change, plus one more after a red in a changed file is fixed and that file is rerun alone. The second run came before the builder's last change, so a third full run, with its diagrams pass, was needed. The report also names no lone rerun of the red file after the fix. The rule calls this a finding of the review. The cost is about 22 s plus a diagrams pass on a shared machine where several suites run at once; the result is unaffected.

## Behaviour
none. The report states before and after for the Chips and Tags sections (headings and counts), the table (rows 8 to 12, the column headings, the search `grey`), the Meters, the Ticker, the cards, and the finding's text with its unchanged signature. The headings are `h4` elements, so the accessibility outline gains three level-4 headings per section; the report names the `<h4>` under "Judgment calls" 1.

## Declined to judge
- The svelte-check error that the report gives as the reason `Sample` sits in the module script ("Cannot find name 'Sample'", and "a type declared in the instance script is not in scope for a top-level snippet's parameter"). Reproducing it means moving the type in a code copy with its own toolchain, which I did not do. The general wording is wider than the tree bears out: `src/lib/views/boards/focus/CommandCenterView.svelte:21` declares `RowGroup` in the instance script, and its top-level snippet `kindGroups` at :127 names it. That snippet reads instance state (`onpick`, `view.kept`). The Gallery's `chipRow` and `tagRow` read none, so the narrower comment at Gallery.svelte:12-15 may well be true; this run does not settle it.
- The "filter the rules file names": spec.md names no output filter (`grep -n -i 'filter\|pipe' agents/spec.md` printed nothing). I followed the state file's Verification paragraph instead: output to a file, exit status read on its own.
- Cases 1 to 4 on screen: they need a DOM. They are the landing look on TEST, and I opened no browser.
- Whether the diagrams are exactly what `npm run diagrams` gives: running it writes files in the worktree. I read the change as one new server-to-data import.
- Whether the worktree's HEAD is 5b866adf: that needs `git rev-parse HEAD`. `test:quick` printed "11 changed file(s), from git since 5b866adf", which agrees with `git status --short`.

Usage: aad03c28171695846, claude-opus-5-5, 187739 tokens, 52 tool uses, 8 min 49 s

## Closed

- Standards 1 (the verify list ran three times, one more than `spec.md` "Token discipline" allows): the extra run changed no file and no result, so no change to the step closes it; it is named in the booking at landing, and no repair round is sent.
