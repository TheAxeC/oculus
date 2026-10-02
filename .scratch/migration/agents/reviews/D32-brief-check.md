# Step D32 brief check (on main at 247f7c52; tree identical to 3a308a8f outside the ledger)

This report covers the brief at `tools/oculus/.scratch/migration/agents/briefs/D32.md`. `git show --stat 247f7c52` shows that the only commit since the brief's base (3a308a8f) changed ledger files and nothing else: `D18-round1.md`, `M3-report.md`, `choices.md`, `orchestrator-state.md`, `plan.md`. Every premise was rerun on the tree, which is the same as at 3a308a8f.

## 1. Names

- `SavedCopy`, and the history kind `'save' | 'delete'` that item 8 widens to `replace`. Command: `grep -rlw SavedCopy src tests` and `grep -rn "'save' | 'delete'\|z.enum(\['save', 'delete'\])" src/lib`. Hits outside the paths:
  - `src/lib/state/sources/explorer/sections/timeline.ts:12` (`kind: 'save' | 'delete'`) and `:16`.
  - `src/lib/state/sources/explorer/sections/timeline-reads.ts:29` (`kind: z.enum(['save', 'delete'])`). `copiesOf` reads copies through `survivorsShape(copyShape)`, so a `replace` copy is dropped silently and the Timeline never lists it.
  - The change makes all of these false, and item 8 ("The Timeline lists the `replace` copy with its own word") cannot be met without them.
  - The test of these readers, `tests/state/sources/explorer/sections/sections.test.ts`, is also outside the paths.
- `data/helpers/search`, which the brief moves into a folder, and the new `data/` replace and preserve-case functions that the page calls. Command: `grep -rn "helpers/search" src tests config utils HELP.md DESIGN.md`.
  - `tests/checks/tree/boundaries.test.ts:149` lists `'data/helpers/search'` as an exact module id in the state row's allow list. The test's head comment (`:31-66`) explains each entry.
  - `DESIGN.md:171` (the layer table) lists `data/helpers/search` among the modules `state/` may import.
  - A new module under `data/` that the page imports, or a move to `data/helpers/search/<file>`, makes both false and turns the boundary test red. Neither file is in the paths, and the spec requires an edit to an allow list to be reported with its before and after.
- `SearchHit` (gains `at` and `replacement`). Command: `grep -rlw SearchHit src tests`.
  - `src/lib/data/model/index.ts` is a re-export, and the change leaves it true.
  - `src/lib/views/sources/search/Results.svelte:90` keys rows by `` `${hit.line}:${hit.column}` ``. That key goes false under one hit per match (see 6).
- New partials and style changes in `views/sources/search/`. `tests/views/whole/type-scale.test.ts:98-100` holds one row per Search component (`'sources/search/Results.svelte': '.count=fs-sm | .row=fs-md | .line=fs-sm'`). New partials and new type rules need rows there. The file is not in the paths, and A1 writes it too.
- `readAnswer` (item 20 rewords it). Command: `grep -rlw readAnswer src tests`.
  - `src/lib/state/sources/files.svelte.ts:115` calls it. That caller needs no code change, but its test does: `tests/state/sources/files.test.ts:303`, `:312` and `:320` assert `error: '404'`, `'503'` and `'200'`, which the change makes false.
  - `files.test.ts` is not a test of any of the 14 files, so "the existing tests of the 14 files of item 20" does not cover it. (`tests/state/sources/fs/fs-answers.test.ts:232,239` tests `fs.svelte.ts` and is covered.)
- `DESIGN.md:130`, the **Search.** paragraph. It says "One subprocess call site, list arguments only, ..." and "The answer is the hits grouped by file, each line cut to a window round its match". Item 3 (one hit per match) and item 7 (a ripgrep run in `fs/replace.ts`) change both claims, and the head comment of `server/files/search.ts:7` ("This module has one subprocess call site") goes false unless `replace.ts` reuses `runRipgrep`. `DESIGN.md:130` is not in the paths; only `:140` and the ops line (`:393`) are.
- The undo tests. `grep -rln "undoFiles\|file-undo" tests` prints `tests/routes/files/file-undo.test.ts` and `tests/state/sources/explorer/acts/undo.test.ts`. The paths name `tests/server/edit/ (the undo)`, which holds no undo test. `tests/routes/files` is full at 10 items.
- `HistoryKind`, `OPS_REFUSALS`, `OpsRefusal`, `DiffSubject`. The only hits outside the paths are `repositories.svelte.ts` and `Worktrees.svelte` (for `DiffSubject`), which a new optional field leaves true. The Files view's refusal words are in `views/sources/files/tree/menu/row-ops.ts`, inside the paths.

Findings:
- `timeline.ts`, `timeline-reads.ts` and their test `sections.test.ts` are left out.
- `tests/checks/tree/boundaries.test.ts` (the list at `:136-158` and the head comment) and `DESIGN.md:171` are left out.
- `tests/views/whole/type-scale.test.ts` is left out.
- `tests/state/sources/files.test.ts` is left out.
- `DESIGN.md:130` and the head comment of `server/files/search.ts` are left out.
- The undo tests live in `tests/routes/files/file-undo.test.ts`, not in `tests/server/edit/`, and their folder is full.

## 2. The step line

- "a replace field": item 1.
- "replace one hit, one file or all": items 4 and 5.
- "each write through oculus's write chain and its change log (Z84 (a))": items 7 and 8, plus the History words in item 8.
- "the seven state-layer answers Z154 accepted judged one by one": items 13 to 19.
- "the search's "HTTP 200" error a sentence": items 17 and 20.
- "two scripts under `utils/`": items 21 to 23.
- The Settings ruling (ripgrep's order, no smart-case key, the ignore, hidden and skip rules, read-only by mode, said in HELP.md): item 12, with item 11's sentence on locked files. `HELP.md:158` and `:166` already carry the mode and skip rules.

Findings: none.

## 3. Premises

Rerun, and matching what the brief says:
- `wc -l` of every file in the first bullet: 135, 112, 193, 134, 149, 230, 48, 417, 66, 23, 42. Also `changes.ts` 296, `ops.ts` 700, `file-undo.ts` 245, `repositories.ts` 857.
- ripgrep 15.0.0. `rg --json -r 'X$0' --regexp 'f(o)o' -i .` printed the submatches with `"replacement":{"text":"Xfoo"}` and `XFoo`, and `--passthru -r '[$1]'` printed `[o] bar [o]` and `[o] baz`, both exactly as the brief quotes. Extra probes:
  - `-F -r '$1'` gives an empty replacement and `-F -r '$$1'` gives `$1`, which confirms the `$$` rule.
  - `-r ''` gives an empty replacement.
  - On `é foo foo`, the submatch starts are bytes 3 and 7.
  - A newline and U+E000 pass through the replacement unchanged.
  - `-w -r '[$1]'` numbers groups as written.
  - `$1a|${1}a` gives `|fa`.
- `grep -rn 'String(response.status)\|HTTP \${' src/lib/state src/lib/views src/lib/ui` prints 29 lines in 14 files, the same list. A wider grep found one more form, `src/lib/views/shared/prose/prose-menu.ts:121` (`throw new Error(String(answer.status))`), but its catch discards the text, so no reader sees it.
- knip: `npx -y knip@6.39.0 --production --include exports,types --reporter compact --no-progress` exits 1 and prints "Unused exports (241)" and "Unused exported types (110)". The five cases of Decision 4 are in its output, and `grep -rlw` gives exactly the importers the brief names. `npm view knip time` gives 6.39.0 released 2026-09-30, licence ISC.
- `git ls-files utils` lists 8 items, and `tests/checks/utils` holds 4. Folder counts: the six folders the brief calls full hold 10 each; `server/files/fs` 6, `tests/data/helpers` 6, `tests/views/sources` 10.
- `grep -rln "\.receive(" tests | wc -l` prints 36.
- Matching lines: `history.ts:56` `HistoryKind`; `history.ts:123` `keepCopy`; `file-changes.ts:82` `keepCopy(history, real, 'delete')`; `file-undo.ts:80` `fieldShape`; `rows.ts:62` `history.file_upload`; `repositories.ts:215-216` `compareUrl` and `savedUrl`; `source.svelte.ts:197` and `:222` (`readIn === LIFETIME`); `explorer/ops.svelte.ts:237-244` `unsaved`; `search.ts:75`, `:106`, `:136`.
- HELP.md: `:115` is the search row, `:158` the mode sentence, `:162-170` "Searching the files". `DESIGN.md:140` is the change-log paragraph.
- `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" twice.

Differing:
- `src/lib/data/file-ops.ts`, from `grep -n`:
  - `OpsRefusal` is `:37`, with `OPS_REFUSALS` at `:54-69`.
  - `OpsRequest` is `:75-96`; the brief says `:67-90`.
  - `OpsAnswer` is `:101-103`; the brief says `:96-98`.
  - `FILE_FIELDS` is `:201-209`; the brief says `:197-205`.
  - `FileStamp` is `:220-226`; the brief says `:216-226`.
- The orphan doc comment in `server/files/search.ts` is at `:183-186` ("A number of any value, as ripgrep's counts and offsets are read..."). Item 24 and the premise say `:205-209`, where the `ripgrepLineShape` code now sits.
- `isReadonly` is `source.ts:42`; the brief says `:41`.
- On N1, the brief says the socket checks the payload at `:338`. The schema check is `socket.svelte.ts:331`; `:338` is the `receive`. The brief also calls the `config` payload at `:315` "a payload it built". `seedConfig` receives it from `routes/+page.svelte:69` (`data.seed.payload`), the server's seed, so the socket does not build it.
- On N3, the brief gives the reason "the panel calls `state.plan.files.map`". No such call exists: `grep -rn "plan.files" src/lib/views` prints nothing. The panel reads `plan?.changes.length` (`Deposit.svelte:158`) and `one.files.length` with `#each one.files` (`:250-252`). These throw on a partial state in the same way, so the judgment holds; only the quoted call is wrong.
- `plan.md` after 247f7c52: Z258 and Z259 are at `:874-875`; the brief says `:873-874`.
- Steps in flight. Comparing the "Paths this step writes" of `A1.md`, `Q88c.md`, `D18.md` and `M3.md` shows shared files the brief's last bullet does not name:
  - D18 writes `state/client/entities.svelte.ts` (and `payloads.ts`), which N1 changes.
  - Q88c writes `config/text/` including `ui.yml`, where item 20 adds two keys.
  - Q88c writes `HELP.md` line 113, which this step's paths also claim (113-115). That is the same line, so the merge is not simple.
  - Q88c writes tests under `tests/server/files/` and `tests/state/sources/`. Both folders are full, and both steps would split them.
  - A1 adds a field to `DiffSubject` and `heldDiffShape` as well as `sideOf`, and writes `tests/views/whole/type-scale.test.ts`.
  - The brief's sentence "Each is lines in other places of those files, except `sideOf` ... and the lockfile" is false for these.

Findings: the file-ops.ts line numbers, the search.ts comment location, the N1 and N3 wording, the plan.md line numbers, and the incomplete list of shared paths with D18, Q88c and A1, all as above.

## 4. Cases and checks

- Case 22 and Verify 3 ("the five exports of Decision 4 are in its output") contradict two rules.
  - The rules file's principles say that every export the step adds or leaves without a caller, if nothing outside its own file and tests imports it, is removed or made local.
  - The brief's own Report section asks for "every export with no importer outside its own file and its tests made local or removed".
  - Two of the five, `FILE_FIELDS` (`data/file-ops.ts`, where item 7 adds `replace`) and `searchArgs` (`data/helpers/search.ts`, where item 6 adds `--replace` and which the step may move), are in files this step changes.
  - A builder who follows the rule makes them local, or uses `FILE_FIELDS` in `file-undo.ts`'s `fieldShape` instead of the second copy at `:80`, which DRY asks for. Either removes them from knip's output and turns Verify 3 red.
- Case 2 (`$&!` gives `foo!`, `$$` gives `$`) and item 6 ("VS Code's syntax") disagree with VS Code's own code; see the section "VS Code's replace" below. The rules file says a difference from VS Code must be listed in the brief before the build, and the brief does not list this one.
- Case 5 and item 6's Preserve Case rules are not VS Code's `buildReplaceStringWithCasePreserved`, which the brief names; see "VS Code's replace". The case values given happen to agree with VS Code.
- Case 17's last row (`403 { error: 'denied' }` shows `denied`). It follows Z259 (a body's own `error` text is kept), but the rules file's catalog rule says an error from the engine is mapped to a catalog line before it is shown. The search route's own refusal texts are English literals in `search-routes.ts:29-35`, `:51`. Raised under "Declined to judge" as a ruling question; it is not a defect of the brief.
- Case 21 and item 21. Item 21 says "Builders do not run it, since it runs git". Case 21 is a test the builder must write and run first on the unchanged tree, and the test runs the script, which runs git in a scratch repository. That is allowed in the same way as the existing git tests under `npm test`, but the brief should say so: as worded, the builder is told both to run the case and not to run git.
- Case 16 first half (a frame whose payload fails its schema is not held) already has tests at `tests/state/client/config-seed.test.ts:102-150` (`drops %s`). Only the seed check is new. The brief should say which half is new, so the first run and the "fails on the unchanged tree" demand of Verify 4 apply to the right half.
- Every other case is consistent with the rules file.

Findings: Case 22 and Verify 3 against the export rule; Case 2 and Case 5 against "VS Code's" with no listed difference; Case 21 against item 21's sentence; Case 16 not saying which half is new.

## 5. The question

- Case 22 and Verify 3: yes, these could pass without the goal. A wrapper that prints a saved knip output, or any knip run, prints the five names whether or not the script computes Z253's rule. It checks knip, not the wrapper.
- Verify 2 (the grep prints nothing): yes. Renaming the variable (`const status = response.status; ... String(status)`) or writing `` `${code}` `` empties the grep while the error stays a bare number. Case 20 is the check that proves the sentences, and it only requires a test "where the file has a test for its failed read already".
- Case 19 (the existing tests of N2, N3, N4 and N6 pass unchanged): yes, trivially, but that is what a "kept" judgment means. It is acceptable as an audit, and it should be labelled one.
- Item 2 (the preview drawn struck through, then the replacement): yes, if it is proven only by a string render or by `hitParts`. It is a DOM behaviour for the look, and the brief should name the look as its proof.
- Items 4 and 10 (keys on a focused row, a press opening the preview): yes for the unit suite, which renders to a string. They are seen at the look only. The brief should say so in Verify. Today the Search view has no key handling (`grep -rn keydown src/lib/views/sources/search` prints nothing), so "as the Files view's are" (`tree/control/keyed.ts`) is new work, not a change to existing handling.
- Cases 1, 3, 4, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18 and 21: no. Each asserts a concrete written result or a concrete refusal.
- Case 9: half and half. "Left out before the request and named" needs a state test of the request built. "A clean tab shows the new text" needs the re-read, which nothing does today (`source.svelte.ts` has no re-read path, and `loadSourceDraft` returns early at `:222`).

Findings: Case 22 and Verify 3, Verify 2, and the proof of items 2, 4 and 10 left unstated.

## 6. Implied inputs

This is a code step. These implied inputs are missing from "Cases", each with the result it should have:

1. **Two matches on one line longer than `HIT_WIDTH` (240).** Each hit is cut around its own match by `trimAround`, so both can get the same `column`. `Results.svelte:90` keys rows `${hit.line}:${hit.column}`, which then duplicates the key. Expected: two rows, keyed by `at`.
2. **A forged request that names the same hit twice, names a file twice, or has empty `items` or empty `hits`.** Expected: refused (`not-an-action`), or duplicates removed before the splice. A file is never spliced twice at one offset.
3. **A replace request whose query `refusalOf` refuses** (empty `q`, over `MAX_QUERY`, `under` outside), **or whose per-file ripgrep run fails** (a pattern ripgrep rejects, exit 2) **or times out.** No refusal word is named for these. The route's POST also needs the search timeout (`searchSettings(config).timeoutS`), which `ops/+server.ts` does not read today; its path annotation says only "(the preview branch)". Expected: a named refusal word, and nothing written.
4. **A file over the copy limit of the new `replace` kind, and how many copies are kept.**
   - `keepCopy` picks `SAVE_MAX_BYTES` only for `'save'` (`history.ts:133`), so a `replace` copy would get the 5 MB delete limit.
   - Only `'save'` copies are pruned per file (`:147`), and only `'delete'` copies are pruned through the index (`:154`). `replace` copies would grow without bound.
   - Expected: a stated limit and a stated pruning rule. A file whose copy is not kept is refused (or replaced without undo, stated), so an undo is never promised without a copy.
5. **The undo of the undo.** `file-undo.ts` records an undo as the operation that reverses it (`:20-21`, `finish`). The brief does not say which field the undo of a `replace` records, or whether it keeps a copy of the replaced text so that Shift+Cmd+Z re-applies it. Expected: a stated field and kept copy, and a case for redo.
6. **An undo of a replace while a source tab holds the file.** Expected: a clean tab reads the file again, and a tab with unsaved text keeps it, as after a replace (item 9 covers only the replace).
7. **A CRLF file.** Expected: the replacement goes in at the byte offsets, and `\r\n` elsewhere is kept. Also state what `\n` in the replace text writes in a CRLF file.
8. **A replace text that holds U+E000 or U+E001.** Also:
   - Stacked modifiers (`\u\L$1`, which VS Code applies one character at a time).
   - A modifier before `$&`, `$0`, `$<name>` or literal text. VS Code writes these literally as `\U`, because its case-ops pattern matches only `\$[0-9]+`.
   - Expected: each stated, with the private markers never reaching a file.
9. **`` $` `` and `$'` in regex mode.** VS Code passes them to JavaScript's replace, which reads them as the text before and after the match in the line; ripgrep has no equivalent. Also `$10` with fewer than ten groups, and `${name}` of an absent group. Expected: each stated.
10. **Preserve Case on matches the brief's rules miss.** Expected per VS Code:
    - `FooBar` with `baz` gives `Baz`: the first letter is upper whatever the rest.
    - `fOO` with `Baz` gives `baz`: a first letter lower lowers the replacement's first letter.
    - A match holding both `-` and `_` falls through to the whole-string rules.
    - An empty match gives the replacement as typed.
11. **A non-start terminal action answering 200 `{ ok: true, id: 't1' }` (stop, resize, rename) and one answering `{ ok: true }` with no id.** `postTerminal` (`pty-io.ts:72`) serves all 15 actions of `terminals.svelte.ts:487-759`. Item 19 speaks only of "a start answer". Expected: the first stays ok, and the second is stated (every server answer carries an id: `routes.ts:178-547`).
12. **Replace Preview after a Dismiss.** The preview route carries the query, not the dismissed hits, so it would show replacements for hits the reader dismissed. VS Code's preview leaves removed matches out. Expected: the preview leaves dismissed hits unreplaced.
13. **A second Replace Preview of the same file with a changed replace text or query.** `diffState` activates the existing pane (same id). Expected: the pane takes the new query and reads again.
14. **Replace Preview on a binary file, a file over `TEXT_LIMIT`, or a file holding a marker.** Expected: the refusals `handleCompare`'s `side` gives (`binary`, `too_large`) or `marker`.
15. **Replace (one hit) on a file whose tab holds unsaved text.** Expected: nothing written, and the outcome names the file.
16. **The asynchronous triple for the replace post and the preview read** (in flight, tab closed, superseded by a later one), as the rules file requires. Also Replace All pressed twice while the first is in flight. Expected: one request at a time, and an answer for a closed tab not written into another tab.
17. **`utils/outside-paths.mjs` on a renamed or deleted file.**
    - `git diff --name-only <base>` applies rename detection by default and prints only the new name, so the old path drops out. Expected: `--no-renames`, so both paths are judged.
    - A changed path with a space or a non-ASCII letter is printed quoted (`core.quotePath`). Expected: read with `-z`, and the path printed as is.
18. **`outside-paths.mjs` suffix matching that covers too much.** Under the item 21 rule, a token `HELP.md` covers `tools/cockpit/HELP.md`, and a token `` `data/helpers/` `` inside prose (D32's own section has one) covers every file under any `.../data/helpers/`. Expected: a stated rule, with a case for a same-named file in another folder.
19. **`utils/unused-exports.sh` with `node_modules` missing, or knip absent.** Expected: exit 2 with knip's or the shell's message. With findings (knip exit 1): exit 0.

Findings: inputs 1 to 19 are missing from "Cases".

## 7. ADRs

- `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both, and the configuration block in `orchestrator-state.md` has no `adr:` key. No record exists.

Findings: none.

## VS Code's replace, against the brief's description

These are from VS Code's source on main, fetched with `curl` from raw.githubusercontent.com: `src/vs/base/common/search.ts`, `src/vs/workbench/services/search/common/replace.ts`, `contrib/search/browser/searchActionsRemoveReplace.ts`, `replaceService.ts`.

**Wrong in the brief:**
- **Preserve Case** (`buildReplaceStringWithCasePreserved`). VS Code first tests `-` and `_`, and the per-part rule applies only when exactly one of the two separators is in both strings with equal part counts. Then:
  - all upper gives upper;
  - all lower gives lower;
  - a first character that is upper gives the replacement's first letter upper (the rest is not tested);
  - a first character that is lower gives the replacement's first letter lower;
  - otherwise the replacement as typed.

  The brief's "first letter upper and the rest lower" is wrong, and the brief misses the lower-first rule.
- **When Preserve Case applies.** VS Code applies it to the replace pattern before group substitution (`buildReplaceString`, then `text.replace`). The brief's "applied after" differs for `$1` patterns: `Foo` with `$1bar` gives `obar` in VS Code. The brief's order is arguably better, but it is a difference to list.
- **The syntax.** VS Code's `parseReplaceString` converts `\\`, `\n`, `\t` and `$0`, and sets `hasParameters` only for `$0`-`$99`, `` $` `` and `$'`. Without one of those, `getReplaceString` returns the text literally, so `$&`, `$$` and `$<name>` on their own are written as typed. The brief's reading (`$&` gives the match, `$$` gives `$`) is JavaScript's, and it is a difference to list.
- **Case modifiers** apply only to `$` followed by digits, stacked one character at a time (`\u\L$1`).
- **Dismiss key.** It is Delete off macOS and Cmd+Backspace on macOS, on a hit, a file or a folder row. The brief gives Delete only.
- **Preview title.** It is "{0} <two-headed arrow> {1} (Replace Preview)" (`replaceService.ts:146`). The brief has "{name} (Replace Preview)"; an ASCII form of the arrow is needed.

**Missing from the brief:**
- Replace (a hit) and Replace All (a file) are offered only while the replace row is shown (`ReplaceActiveKey`). The brief does not say this.
- Cmd+Shift+1 also runs Replace All on a focused file row (`ReplaceAllInFileActionId`). The brief gives it for hits only.
- Replace All in a folder: a root heading in a multi-root search (`ReplaceAllInFolderActionId`).
- After a Replace or a Dismiss, focus moves to the next element, and after a Replace the next match opens in its preview (`searchActionsRemoveReplace.ts:119-138`, `:289-318`).
- VS Code replaces into a file open with unsaved text and saves it (`replaceService.ts:116-133`). The brief's item 9 leaves such files out, which is a difference to list.
- The live preview: VS Code recomputes it on the page as the replace text is typed. The brief's preview waits for the next run, which is a difference to list.
- Cmd+Shift+H (Replace in Files) and the replace box's history (Up and Down) are absent. Oculus has no Cmd+Shift+F and no query history either, so these may be out of the step's scope, but the brief does not say so.

Findings: each item under "Wrong in the brief" and "Missing from the brief". The rules file asks the brief to list every difference before the build.

## Declined to judge

- Whether the brief's JavaScript-like `$&` and `$$` reading should replace VS Code's literal reading. That is a user-visible choice, the user's to rule; the brief should raise it or list it.
- Whether a refusal body's own English text (`denied`, the search route's literals) may be shown, against the catalog rule. That is a ruling question between Z259 (a) and the rules file.
- The N1 claim of "the 600 kB portfolio" parsed on every render. No measurement was taken.
- Whether knip's production mode reports exports used only by `utils/` or `bin/` scripts (`utils/` imports `src/lib/data/snapshot/validate.ts` and `server/edit/yaml-edit.ts`) as unused, against the approved rule. Not run.
- Everything that needs a DOM (the preview's look, the focus moves, the keys). That belongs to the look on TEST.

Agent usage: 287991 tokens, 100 tool uses, 881464 ms (completion notice); served model claude-opus-5-5, read from the agent record.

## Closed (the session's change to the brief for every finding above, made before the preparation commit)

- 1 Names: closed. The Timeline readers and `sections.test.ts`, `boundaries.test.ts` with `DESIGN.md:171`, `type-scale.test.ts`, `files.test.ts`, `DESIGN.md:130` with the head comment of `server/files/search.ts` are in the premises and the paths; `replace.ts` calls `runRipgrep`, so the one call site stays; the undo tests go to the new `tests/routes/replace/`; rows are keyed by `line` and `at` (item 3, case 16).
- 3 Premises: closed. The line numbers of `file-ops.ts`, `search.ts`, `source.ts`, `plan.md` and the N1 and N3 wording are corrected; the shared paths with D18, Q88c and A1 are listed in full; this step writes `HELP.md` line 115 and not 113, and adds no file to and moves none out of `tests/server/files/` or `tests/state/sources/`.
- 4 Cases and checks: closed. Case 34 and Verify 3 name the three exports outside the step's files, with `FILE_FIELDS` and `searchArgs` leaving the output by the export rule; cases 2 to 5 follow VS Code's source (Z264); item 21 says the builder runs the script only through its own test; case 22 names the new half of N1.
- 5 The question: closed. Case 34 compares the wrapper's output with a direct knip run; Verify 2 requires case 26's test per file; case 25 is labelled an audit; cases 27 to 31 are the look's, with item 4's key handling stated as new work.
- 6 Implied inputs 1 to 19: closed as cases 16 to 21, 24, 32 and 33 and the item text they test: item 3 (keys), item 7 (refusals `bad-query`, `not-an-action`, `search-failed`, `too_large`, the timeout, CRLF), item 8 (the copy limit and pruning, the redo), item 9 (the undo and a single Replace on a file with unsaved text), item 6 (markers in the text, stacked operations, `` $` ``, `$'`, `$10`, `$<name>`), item 10 (dismissed hits, a second preview, the refusals), item 19 (the other 14 actions), item 21 (`--no-renames`, `-z`, the token rule), item 22 (exit 2).
- VS Code's replace: closed by Z264 (`plan.md:882`): item 6 ports `ReplacePattern` and `buildReplaceStringWithCasePreserved` read from VS Code's source; item 4 offers Replace only with the row shown, Cmd+Shift+1 on a file row, Cmd+Backspace on macOS, the focus moves and the next preview; item 10's title has `<->`; item 1 adds Cmd+Shift+F, Cmd+Shift+H and the two boxes' history; item 2's preview is live. The two differences kept are listed under item 11 with their reasons.
- Declined to judge, the refusal's own text: closed by Z265 (`plan.md:883`), item 20 and case 23.

