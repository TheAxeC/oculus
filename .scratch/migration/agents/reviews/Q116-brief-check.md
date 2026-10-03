# Brief check of Q116 (oculus/migration), read on main at 780125bf9

## Names

Commands:
- `git grep -n -e 'lines_help' -e 'LineCounts' -- . ':!tools/oculus/.scratch' ':!tools/oculus/config/local.yml'`
- `git grep -n -w 'drawn' -- tools/oculus/src/lib/views/system/status tools/oculus/tests/views/system tools/oculus/tests/state/system`
- `git grep -n -i -e 'line counts' -e 'line count' -e 'lines of code' -- tools/oculus ':!tools/oculus/.scratch' ':!tools/oculus/config/local.yml'`

Hits outside the write list:

1. `tools/oculus/tests/views/system/status.test.ts` (it imports LineCounts at :10 and renders it at :119). This is the main finding of the check: the change makes two of its assertions false, and the brief's write list leaves the file out. Its fixture `COUNT` (`tests/server/machine/line-counts.ts:30-41`) holds a folder `src/lib/x`, so after item 2 `drawn` adds a `src/` row before it.
   - `status.test.ts:128-135`, `expect(rows(body)).toEqual([...six rows...])`, goes red. A seventh row `src/|1|1|0|4|0|5` appears before `src/lib/x|1|1|0|4|0|5`.
   - `status.test.ts:181`, `expect(rows(body)).toHaveLength(6)`, goes red because the table has 7 rows.
   - `status.test.ts:3`, the head comment "draws one row per folder with that folder's languages under it and the total last", is made incomplete.
   - The assertions at :145-146 (`class="language` 3*7, `class="total` 7) stay true, since the new row has kind `folder`.
   - Why it matters: verify item 1 (`checks.sh`, `npm test`) cannot pass inside "Paths this step writes", and the brief says "The step writes these paths and nothing else". The file belongs in the write list, with the two assertions updated and reported before and after under spec.md:59. Updated, the :128-135 assertion also checks item 2 in the suite (the row, its place and its sums) and the "total unchanged" case (the Total row `4|21|5|1,238|1|1,264`). The brief currently leaves both to reading and the look.
2. `tools/oculus/src/lib/views/system/status/LineCounts.svelte:48`, the doc comment of `drawn`: "Every folder, each followed by its languages, and the total last." The change makes it false. The brief names only the head comment (`:1-9`). Under spec.md:66 it should name this one too.
3. `tools/oculus/src/lib/state/system/lines.svelte.ts:1-12`, the head comment. It describes only the store and `readCount`. Item 1 adds a pure sum function the comment does not mention. The brief's Conventions say "the head comment of each changed file stays true" in general but name only LineCounts.
4. `tools/oculus/tests/state/system/lines.test.ts:1-5`, the head comment: "The line count store: it asks ... and holds an answer whose shape is wrong as a failed read". Item 5's test makes it incomplete.
5. Still true after the change (no action needed):
   - `src/lib/views/system/status/Status.svelte:14-16` ("then the line counts of oculus's own files (LineCounts.svelte)")
   - `README.md:5`
   - `src/lib/server/machine/lines.ts:1-16`
   - `src/routes/api/(machine)/lines/+server.ts:1-4`
   - `src/lib/state/client/context.ts:157`
   - `tests/views/whole/type-scale.test.ts:264`, which maps LineCounts to `h3=fs-md | .said=fs-sm`. It stays true as long as no new class or font size is added, and item 2 adds none.
   - `src/lib/server/core/git/parse.ts:246` (`type LineCounts`) is an unrelated name.
6. `lines_help` has one reader, `LineCounts.svelte:83`. `status.test.ts:127` reads its value from the catalog, so new text keeps it true.
7. HELP.md's Status row: `grep -n '| \`status\` |' HELP.md` prints `137:`. No test or other doc quotes its text. `grep -n -i -e 'per folder' -e 'by folder' -e 'api/lines' -e 'machine/lines' DESIGN.md README.md HELP.md` finds only HELP.md:137, so DESIGN.md does not describe the line count.

## The step line

`grep -n "^- Q116" plan.md` prints line 227. Z357 is at `plan.md:1035`.

| Part of the step line | Item that covers it |
|---|---|
| "the Status view's Lines of code also gives the count of everything under `src/`" | items 1 and 2 |
| "at every depth" | item 1 (`src` or a `src/` prefix), plus the premise that `folderOf` puts every `src/` file in such a row |
| "one row for `src/` beside the per-folder rows" | item 2 |
| "files, blank, comment, code and TODO lines summed over every counted file under `src/`" | item 1 (five sums); item 2's `row()` adds the Lines column |

- Items 3 and 4 come from spec.md:66, and item 5 from the test rule. None of the three is in the step line, and they need not be.
- No part of the step line lacks an item.
- The step line names no check of its own.

## Premises

Recount by the `folderOf` rule:

```
git ls-files | grep -v -e '^.scratch/' -e '^docs/diagrams/' -e '^package-lock.json$' | awk -F/ '{ if (NF==1) f=""; else if ($1!="src") f=$1; else if ($2=="lib" && NF>=4) f="src/lib/" $3; else if ($2=="routes") f="src/routes"; else f="src"; c[f]++ } END {...}' | sort
```

It printed `src 6`, `src/lib/assets 1`, `src/lib/data 66`, `src/lib/server 181`, `src/lib/shell 38`, `src/lib/state 207`, `src/lib/themes 5`, `src/lib/ui 101`, `src/lib/views 289`, `src/routes 38`. The other rows were `(top) 10`, `assets 28`, `config 69`, `demo 41`, `tests 726`, `utils 19`. The ten `src` rows sum to 932, and `git ls-files src | wc -l` prints 932. Both match the brief.

- **The six files of the `src` row.** `git ls-files src | awk -F/ 'NF==2 || (NF==3 && $2=="lib")'` prints `src/app.d.ts`, `src/app.html`, `src/hooks.server.ts`, `src/lib/highlight-languages.d.ts`, `src/lib/write-file-atomic.d.ts`, `src/server.ts`. This matches.
- **The `folderOf` rule** (`lines.ts:66-73`, read in full) is as the brief describes it. The server test already guards it: `tests/server/machine/lines.test.ts:49-62`.
- **Skipping a file with no language.** The behaviour is as described. Every extension under `src` is one cloc knows:
  - `git ls-files src | sed ... | uniq -c` prints css 3, html 1, svelte 312, svg 1, ts 615.
  - `grep -n "'svelte'" -e "'svg'" node_modules/cloc/lib/cloc` prints `9498: 'svelte' => 'Svelte'` and `9501: 'svg' => 'SVG'` (cloc 2.06).
  - So 932 is also the counted figure, assuming cloc reads every file. This was not verified by running cloc.
- **Line numbers that are off.** The behaviour each one cites holds; only the numbers are wrong.
  1. `lines.ts:281` is cited as the skip. Line 281 is `const folder = folderOf(path);`. `grep -n 'if (file === undefined) continue'` prints `274:`.
  2. `folderOf` is cited at `lines.ts:62-69`, and in the read list as `:56-69`. The doc comment is at 61-65 and the function at 66-73 (`grep -n 'export function folderOf'` prints `66:`). The read range `:56-69` stops before the function's last four lines, which hold the `src/lib/<x>`, `src/routes` and `src` branches the premise rests on.
  3. `countLines` is cited at `lines.ts:249-301`. It runs 249-294, and `handleLines` starts at 300.
  4. The catalog keys are cited at `status.yml:20-35`. `grep -n 'lines_' status.yml` prints them at 13-34. `lines_help` at `:27` is correct.
  5. `drawn` is cited at `LineCounts.svelte:47-60`. It is at 48-61: doc comment at 48, function at 49-61.
- **Premises that hold exactly:**
  - `index.ts`: `LineTally` at 280, `FolderLines` at 295, `LineCount` at 301. The brief's 279-301 covers them.
  - `readCount` at `lines.svelte.ts:74`.
  - Line counts from `wc -l`: lines.svelte.ts 141, LineCounts.svelte 168, lines.test.ts 404.
  - `HELP.md:137`.
  - Rows in path order: `folders()` sorts with `<` at `lines.ts:241`.
- **A missing premise.** The brief does not cite `tests/server/machine/line-counts.ts`, the shared `COUNT` fixture and the `folder()`/`tally()` helpers. Item 5's table rows should reuse those helpers under spec.md:83, and the fixture is what turns `status.test.ts` red (Names 1). Read list item 6 points at `lines.test.ts` for "the fixtures", but the helpers live in this file. It and `tests/views/system/status.test.ts` should join the read list.

## Cases and checks

1. **Real-tree case (case 1) against the test rule (spec.md:57).** Taken as rows of one table, the cases are mostly consistent with the rule. Two rows give the same outcome as another row:
   - "No row under src" and "An empty rows list" both give null, so they are one outcome in two inputs.
   - "A row named `src` alone" catches no defect the real-tree row (which contains `src`) does not already catch.

   The rule says "the inputs that give different outcomes as rows of one table; never one test per variation of the same outcome". Possible changes: fold the two null rows into one, and drop the `src`-alone row. The TODO-only row catches a dropped field only if the real-tree row's fixture lacks distinct non-zero values per field. If the real-tree row gives each field a distinct non-zero value, the TODO-only row is redundant too. Low severity.
2. **Markup cases checked "by reading the code and on the page"** (brief line 38: the null case, the total and the key). This is consistent with spec.md:57 and :61. However:
   - The null case and the `src/`-named-folder key case cannot be produced on the TEST page, because oculus's own tree always has `src` rows. For those two the proof is reading alone.
   - The existing `status.test.ts` already renders `drawn`, and it goes red anyway (Names 1). Updating its expected rows is a required edit, and it also exercises item 2 and the total case. The brief's "No test of the markup ... its place in the table" sits awkwardly beside an existing markup test that must be edited. The brief should say how to edit it: keep the test, add the `src/` row to its expected rows, set the length to 7, and report the assertion edits.
3. **Case 7's wording "as before".** It is fine in a brief. If it were copied into a test title or comment, it would break spec.md:42. No test is asked for that case, so this is low severity.
4. **Spec.md:48 and the label `src/`.** Spec.md:48 says every user-facing string comes from the catalog and that a literal string a reader sees is a defect. Neither item 2 nor Decision 2 says where the text `src/` comes from. The top-level row takes its label from the catalog (`t('status.lines_top')`). A literal `'src/'`, or `${SRC}/` in the component, can be read as a literal string a reader sees. A reviewer could then raise it as a Standards finding against an under-specified brief. The brief should state the source: either a catalog key with its reader, or the label built from item 1's constant as a path, the same way folder rows show their path from data.
5. **Spec.md:83 (a rule exists once, reuse helpers).** The five-field sum is now written in three places:
   - the server's `add` and `folders` (`lines.ts:121-127`, `:229-233`);
   - the test helper `tally`;
   - the new client function.

   The client cannot import `lib/server`, so a shared helper would need a place in `src/lib/data`, which is outside the write list. Decision 1 is stated and reversible. Low severity.
6. **Items checked and found consistent with the rules file:**
   - The single table test, the mutation run (verify 3), and the first run on the unchanged tree (spec.md:62-63).
   - The key check (spec.md:67): Table keys rows with `{#each shown as row (cellText(row[rowKey]))}` (`Table.svelte:67`), so a duplicate key breaks the view and the case is warranted.
   - The ASCII and verify list: the state file's `verify:` lists 7 commands, the last `! LC_ALL=C grep -rna '[^ -~]' src tests`, which matches "checks: 7 commands passed".

## The question: could it pass without the goal being reached?

1. **The step line.** It names no check, so the brief's verify list is the only check.
2. **Item 1, and the item 5 test.** Yes, it could. The function can be correct and tested while no row is drawn, because item 2 is not covered by any test the brief asks for. Only the look would catch a missing or misplaced row. If `status.test.ts:128-135` is updated with the `src/` row (Names 1), the suite catches it.
3. **Item 2.** It could pass the brief's verify list only through the look. As the brief stands, a builder who left item 2 undone would find `status.test.ts` green, since the fixture's rows are unchanged without the new row. This is the gap Names 1 closes.
4. **Items 3 and 4.** They are text. Reading is the only check, and none is possible by machine under the scripts rule. They could pass with a sentence that misstates the sum. The reviewer reads them.
5. **Item 5.** The mutation run (`startsWith('src')` makes `srcx` fail) and the unchanged-tree failure close the "passes with the behaviour removed" path for the prefix rule. A dropped field is caught only if a row has distinct per-field values. The TODO-only row covers the TODO field alone.
6. **Case 1 (real tree, 932).** As a fixture of frozen numbers it could pass while the server's `folderOf` later stops putting a `src/` file in a `src`-prefixed row. The server test `tests/server/machine/lines.test.ts:49-62` guards that mapping, so the premise has its own test.
7. **Case 7 (total) and case 8 (key).** As written, they rest on reading only. Updating the existing view test would turn case 7 into a suite check.
8. **"What it must do", "directly above the `src` row".** It could be met while the row does not head the rows it sums; see Implied inputs 6.

## Implied inputs

1. **A cloc answer whose rows omit a `src` folder** (every file in it lacked a language). The sum covers the rows sent and agrees with the server's `total`. The `src/` row's Files is below `git ls-files src | wc -l`. The brief's "every counted file" is consistent with this; no case states it.
2. **Count again that changes the rows.** `rows` is `$derived` from `held.count` (`LineCounts.svelte:63`), so the `src/` row is recomputed from the new count. While refreshing, `lines()` returns the old count (`lines.svelte.ts:133`), so the old `src/` row shows until the answer arrives.
3. **Count again that fails.** The old count is kept (`lines.svelte.ts:108-112`), so the old `src/` row stays under the failure sentence. This is consistent with the existing behaviour and not stated.
4. **A row under `src` with zero files.** The server never sends one: a row exists only for a counted file (`lines.ts:281-286`). `readCount` would accept one from a crafted answer. Item 1 then gives a tally of zeros, not null, and the view draws a `src/` row of zeros. The brief's null rule implies this but no case states it.
5. **An answer with a `src` row only.** The `src/` row equals the `src` row and two identical rows are drawn. Case 2 covers the sum; the doubled look is not stated.
6. **A top-level folder whose name starts `src` followed by a character below `/`** (`src-old`, `src.bak`, `src+x`). The rows sort by `<` (`lines.ts:241`), and `-` (0x2D) and `.` (0x2E) sort before `/` (0x2F). The order is then `src`, `src-old`, `src/lib/...`. The `src/` row placed before `src` heads a group with an unsummed row inside it, contrary to item 2's "so it heads the rows it sums". Case 3 tests only the sum, not the place.
   - With no `src` row, the order is `src-old`, then the `src/` row, then `src/lib/...`, which is fine.
   - Today's tree has no such folder: the recount above shows only assets, config, demo, src, tests, utils and the top level. A row named `srcx` sorts after `src/...`, since `x` is above `/`.
7. **A folder literally named `src/` in a crafted answer.** It is summed, because it starts with `src/`. Case 8 requires its key to stay distinct. So the new row's key cannot be `folder:src/`.
8. **Two rows with the same folder name** (crafted answer only). It would be summed twice. The Table already breaks on the duplicate `folder:` key, independent of this step. Out of scope.
9. **The new sentence in `lines_help`.** It goes into a plain YAML scalar (`status.yml:27`, unquoted). A sentence containing `: ` breaks the parse. Not stated; `npm test`'s catalog load would catch it.

## ADRs

- `ls tools/oculus/docs` prints `diagrams` only.
- `git ls-files | grep -i -e 'adr' -e '/[0-9][0-9][0-9][0-9]-[^/]*\.md$'` prints nothing.
- The hub's `docs/` holds `AGENT-APPROACH.md`, `HPC-UTwente-howto.md` and `RESEARCH-APPROACH.md`, none of them a decision record.
- `.agents/plan.yaml` has `standards: []` for oculus, and the state file has `standards: [tools/oculus/.scratch/migration/agents/spec.md]`.

No ADR exists, so none touches the step.

## Declined to judge

1. **Whether cloc gives every `src` file a language on this tree.** Not verified by running cloc, since the task says to run no suite or build. The extension map in cloc 2.06 covers all five extensions present.
2. **Whether the in-flight X3c and D25 steps touch HELP.md near line 137.** Their briefs name other HELP.md lines (X3c :113, D25 :89-100, :150, :261), and neither names `status.yml`, `lines.svelte.ts` or `status.test.ts`. Whether the merge stays simple is the orchestrator's judgment.
3. **The test rule's view of the existing `status.test.ts` markup assertions.** Z354/T1 may delete them as markup the look covers. That is T1's call, not this step's. For Q116 they exist and go red.

## Usage

Agent a140c1b34c9e9dff9 (ordo-high), served claude-opus-5-5: 141,851 tokens, 31 tool uses, 4.8 min.