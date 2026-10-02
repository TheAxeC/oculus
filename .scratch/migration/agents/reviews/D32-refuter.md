# Step D32 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D32, base bdc0ac53)

Pages are cited by section; code is cited by file:line under the worktree's `tools/oculus/` unless stated. I changed nothing. The only git I ran was `git diff bdc0ac53` and `git status --short`, from inside the worktree.

## Verification (rerun by the reviewer)

```
$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md   (run from the worktree's tools/oculus)
$ npm test                     Test Files  478 passed | 24 skipped (502); Tests  12294 passed | 637 skipped (12931)
$ npm run test:checks          Test Files  30 passed | 2 skipped (32); Tests  461 passed | 9 skipped (470)
$ npm run check                COMPLETED 3106 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build                ok
$ npm run format:check         All matched files use Prettier code style!
$ npm run lint                 clean
$ ! LC_ALL=C grep -rna '[^ -~]' src tests    clean
checks: 7 commands passed      (exit 0)
```

This run covers the report's admission that `npm test` was not run on the final tree: it passes on the final tree.

Commands the report quotes, rerun:
- Item 20 grep, `grep -rn 'String(response.status)\|HTTP \${' src/lib/state src/lib/views src/lib/ui`: no output, exit 1. Matches the report.
- `sh utils/unused-exports.sh`: exit 0. A direct knip run of the same command exits 1. `cmp` of the two outputs: EQUAL. The output is 348 lines (the report says 353; no decision rests on that number). It holds `codeThemeIds`, `languageNamed` and `hostZone`, and nothing for `FILE_FIELDS` or `searchArgs`. The only flagged exports in the step's modules were already flagged at base (`file-ops.ts` MAX_NAME_LENGTH; `history.ts` DELETE_MAX_BYTES and others).
- Case 33, in a scratch copy. With no node_modules the script prints "node_modules is not here; run npm install in ..." and exits 2. With an empty node_modules it prints "knip is not installed ..." and exits 2.
- `node utils/outside-paths.mjs <main-checkout brief> bdc0ac53` from the worktree root: exit 0, 22 paths, the same as the report. See Behaviour 1 for why that list is incomplete.
- previewUrl length for 500, 1000, 1500 and 2000 hits in one file: 4996, 9997, 15497 and 20997 characters, against node's `http.maxHeaderSize` of 16384. This reproduces D32-1 (booked as Z285).
- How ripgrep numbers groups, on `abc(` with `(a)(?:b)(?P<n>c)[(]`: `<1=a><2=c><n=c>`, so a named group also gets a number. The numbering holds under `-w`.
- VS Code comparison (my harness `scratchpad/vsharness.mjs`, which runs VS Code's `ReplacePattern` and `buildReplaceStringWithCasePreserved` logic as written in VS Code): `replacementOf` was compared on 1428 inputs and gave 0 differences. There were 52 further inputs where VS Code's own code throws, for example `\u` placed past the end of a group.

## Verdicts

Items of "What to build":
- 1 The replace row: holds.
- 2 The preview in the results: **violated**, in its last sentence (Spec 3).
- 3 One hit per match: holds (`charactersBefore`, `hitOf`/`hitsOf`, and the truncation check uses `matched_lines`).
- 4 Replace, Dismiss, per hit and per file: holds.
- 5 Replace All: holds in behaviour. Where the result sentence is shown differs from the brief (Spec 4, minor).
- 6 The replace text read as VS Code reads it: holds (the harness above). The page HELP.md describes it wrongly (Standards 5).
- 7 The write: holds.
- 8 The undo and the redo: holds.
- 9 Open tabs: holds.
- 10 Replace Preview: holds. Its GET address fails past about 1500 hits (Z285, booked for the repair round).
- 11 Words, keys, pages: holds, with Standards 5 on HELP.md.
- 12: holds.
- 13 N1: holds (`seedConfig` returns early on a failed `payloadShapes.config`).
- 14 N2, 15 N3, 16 N4, 18 N6: hold, as audits whose existing tests pass unchanged.
- 17 N5: holds.
- 19 N7: holds.
- 20: holds. Spec 2 records the `pattern` reason against Z265.
- 21 `outside-paths.mjs`: holds as briefed. Behaviour 1 shows the brief's token rule makes its output incomplete.
- 22 `unused-exports.sh`: holds.
- 23: holds (the test, and the statement of what has no test).
- 24: holds (the orphan comment in `server/files/search.ts` is removed). The same kind of defect is added in a test (Standards 1).

Cases:
- 1 to 14: met.
- 15: met in the tests. The pane re-read on a second preview is left to the look on TEST.
- 16 to 19: met.
- 20: **partial**. The replace post and the search run are tested for in flight, closed and superseded. The Replace Preview read (`Diff.svelte` load through `readKey`) has no such test (Spec 5).
- 21: met in behaviour. The brief's expected text is wrong (Spec 6).
- 22 to 26: met.
- 27 to 31: not verifiable here (the look on TEST).
- 32: met (passes in `test:checks`).
- 33: met (my run above).
- 34: met (my `cmp` above).

## 1. Spec

1. `tests/state/sources/search/search.test.ts` (899 lines), moved from `tests/state/sources/search.test.ts`. What is wrong: brief "Where you work", tests line (D32.md:187), says "no file added to or moved out of `tests/state/sources/`", and the file was moved into a new subfolder. The size cap forced it (549 + 350 lines would pass 900), the folder count stays within 10, and report section 6 states the move. Failure scenario: none at runtime; the brief's path list does not match the tree. Verdict: low; the orchestrator rules on accepting the move.

2. `src/lib/server/files/search-routes.ts:54`: `: { error: 'pattern', reason: outcome.error };`, with `config/text/views/sources/search.yml:35` `refused_pattern: 'The pattern could not be read: {0}'` and `src/lib/state/sources/search/search.svelte.ts:74` `if (refused === 'pattern') return t('search.refused_pattern', reason);`. What is wrong: Z265 (plan.md:896) says "a refusal's own text reaches the reader only as a catalog word". Here ripgrep's own message text goes into the sentence. The report does not list this as a judgment call. Failure scenario: a regex error shows the reader ripgrep's raw English one-line message inside the catalog sentence, which Z265 rules out; or, if the reason is meant to be kept, Z265 needs a stated exception. Verdict: a ruling for the orchestrator or Axel. Keeping the reason is the more useful behaviour for a regex typo; it needs an explicit exception to Z265.

3. `src/lib/state/sources/search/hits.ts:140`: `const regex = settings.ran?.regex ?? false;`. What is wrong: brief item 2 (D32.md:54) says "A hit whose groups the run did not report (a run made before regex mode was on) shows the struck match without a replacement until the next run." The build computes the replacement in the mode of the last run. After a literal run, turning regex on still previews, and Replace still writes, the replace text literally, because a replace is made over the `ran` query (`search.ts:13`). The preview and the write agree with each other, but the behaviour differs from the brief, and report section 12 ("differences from the brief") says "None". Failure scenario: the user runs `foo` literally, turns on regex, types `[$1]` and sees `[$1]` previewed as the literal replacement. Pressing Replace writes `[$1]` into the file, where the brief's design shows no replacement until the search runs again. Verdict: violated and unreported. The orchestrator rules on which behaviour stands.

4. `src/lib/views/sources/search/Search.svelte:92,261-264`: `const said = $derived(replaceSaid(instance.id));` ... `{#if said !== null}` ... `class="said"`. What is wrong: brief item 5 says "After it lands the count line says 'Replaced {n} occurrences across {m} files ...'". The sentence is shown in a separate paragraph above the results, and the count line keeps counting what is left. Failure scenario: none functional; the sentence is shown in a place the brief did not name. Verdict: minor, unreported.

5. Case 20: the Replace Preview read (`views/sources/repositories/Diff.svelte` load through `readKey`, `state/sources/repositories/replace-preview.ts`). What is wrong: the spec requires each case to have a test, or a statement of why it cannot occur. The report admits that no test covers the preview read in flight, closed or superseded. Failure scenario: a regression where a stale preview response overwrites a newer one (two previews pressed quickly) passes the suite. Verdict: partial.

6. `tests/data/helpers/replace.test.ts:55-57`: `expect(replaceTemplate('(a)(?:b)(?P<n>c)[(]', true)).toBe('0${0}1${1}2${2}n${n}'`. What is wrong: brief case 21 (D32.md:125) expects "three groups (0, 1, `n`)". The code and the test give four keys (0, 1, 2, n), which is correct for ripgrep: my probe shows `<1=a><2=c><n=c>`, so the named group also has number 2. The report says no case was wrong and does not note this difference. Failure scenario: none in the code; the brief's case text is wrong. Verdict: correct the brief.

## 2. Proof

1. Brief verify 4 asks for each new test's failing assertion line on the unchanged tree. On the unchanged tree, 11 test files only fail to load (a module is missing), so no assertion line is shown for any test in them: `tests/data/helpers/replace.test.ts`, `tests/data/helpers/search.test.ts`, `tests/routes/replace/ops-replace.test.ts`, `tests/server/files/search.test.ts`, `tests/state/sessions/agents.test.ts`, `tests/state/sessions/latex.test.ts`, `tests/state/sources/repositories/diff/diff-view.test.ts`, `tests/state/sources/search/hits.test.ts`, `tests/state/sources/search/search.test.ts`, `tests/state/system/docs.test.ts` and `tests/views/sources/search.test.ts`. What is wrong: the cases these files keep from base (the fold cases, the query arguments) never had a passing run on the unchanged tree, although they could run there with the import path pointed at the old module. A load failure does not show that each new assertion fails without the change. Failure scenario: a new assertion that also holds on base, and so tests nothing, cannot be told apart from one that does test the change. Verdict: send back for per-test failing lines, at least for the new cases in `search.test.ts`, `hits.test.ts` and `server/files/search.test.ts`.

2. The report's appendices (first-run output, the per-test tables) sit in /tmp files and are not in the report. A later reader of `agents/reviews/D32-report.md` cannot check them once /tmp is cleared. Verdict: low; copy them into the report, or into a file under `reviews/`.

## 3. Standards

1. `tests/data/helpers/replace.test.ts:17-19`: `/** The groups of a match of \`pattern\` in \`text\`, the way ripgrep reports them through the template. */`, directly followed by another doc comment. What is wrong: an orphan doc comment attached to nothing, the defect kind item 24 exists to remove. Failure scenario: the reader takes the first comment as describing the next declaration. Verdict: remove or attach it.

2. Exports the step added that nothing outside their own file imports. The spec principle is: grep each added export, and remove or make local one with no importer.
   - `ReplaceOptions` (`data/helpers/search/replace.ts`) and `MatchQuery` (`data/helpers/search/query.ts`).
   - `SearchChord` (`state/sources/search/keys.ts`), `Previews` (`search.svelte.ts`) and `ReplaceCount` (`words.ts`).
   - `ReadScope` and `ReplaceRequest` (`server/files/fs/replace.ts`).
   - `PreviewFile` and `PreviewSettings` (`state/sources/repositories/replace-preview.ts`).
   - `BoxKeys` (`views/sources/search/box-keys.ts`), imported only by a test.
   - `MatchData` and `RipgrepLine` (`server/files/search.ts`; `RipgrepLine` was local at base).
   - `Say` (`state/shared/answers/answers.ts`).
   - `ResultRow`, exported from both `hits.ts` and `keys.ts`.

   What is wrong: the report used knip's output as proof, and knip does not report a type that another export references. Failure scenario: the public surface of these modules grows with names nothing uses, which the principle forbids. Verdict: make these local, or name each importer.

3. `tests/state/sources/search/search.test.ts`: 899 lines against `tests/checks/tree/size.test.ts:28` `const LINES = 900;`. `tests/state/sources/fs/fs.test.ts` grew to 892 lines. What is wrong: spec.md:45 says "A file within 20 lines of its cap is split". Failure scenario: the next case added to either file fails the size check, inside an unrelated step. Verdict: split both by concern.

4. Paths outside the brief's path list that the report does not mark with a reason: `state/client/context.ts`, `state/sources/explorer/follow.ts`, `state/sources/explorer/acts/undo.ts`, `tests/state/sources/repositories/diff/diff-view.test.ts` and `tests/state/shared/instance-state-sources.test.ts`. Also the UI primitives `ui/controls/text/Search.svelte` and `ui/forms/TextInput.svelte` (a bindable `input` and an `onkey` hook) are changed, and the report should give their reason. What is wrong: spec "Where you work" asks for a reason on each path outside the list. Verdict: add the reasons; the changes themselves look needed.

5. `HELP.md:176`: "In regular-expression mode `$1` to `$99` and `$<name>` are the groups of the pattern, `$0` and `$&` the whole match, `$$` a dollar sign". What is wrong: VS Code's parser turns substitution on only for `$0`, `` $` ``, `$'` and `$1`-`$9`, and the port does the same. So `$<name>`, `$&` and `$$` work only when such a reference also appears in the text. My run of `replacementOf` with groups `{0:'ab',1:'a',2:'b',n:'a'}` printed `"$<n>" => "$<n>"`, `"$&" => "$&"`, `"$$" => "$$"`, but `"[$<n>]$1" => "[a]a"` and `"$$ $1" => "$ a"`. The harness's VS Code code gives the same, so the behaviour is faithful and the page is wrong. Failure scenario: a user follows HELP.md, replaces with `$<name>` alone, and the literal text `$<name>` is written into every file. Verdict: correct HELP.md to say these forms take effect only alongside a numbered reference, as in VS Code.

6. `src/lib/state/sources/search/search.ts:11-13`: "an answer saved before hits carried it reads as no answer", and the `hasFormerHit` doc at :99, "a hit of the form before hits carried their place in the line". What is wrong: both describe the data by comparing it with an earlier state of the code, which the no-history rule for comments discourages. Verdict: low; state the shape ("a hit without `at` reads as no answer").

7. `DESIGN.md` still says "`GET /api/ops` with `preview=1`" and "answers 400 with ripgrep's own one-line reason". The first changes under Z285 in the repair round, and the second is tied to Spec 2. Verdict: update with those rulings.

## 4. Behaviour

1. `utils/outside-paths.mjs` (`entriesOf`) takes prose tokens of the brief's path section as path entries, as the brief's token rule says to: `state/`, `data/helpers/`, `tests/state/sources/` (twice) and `tests/server/files/`. The entry `state/` covers every path that holds `/state/`. With these prose tokens removed, these paths are outside the list:
   - `state/client/context.ts`, `state/shared/answers/answers.ts`, `state/sources/explorer/acts/undo.ts` and `state/sources/explorer/follow.ts`.
   - `state/sources/search/{hits,keys,search.svelte,search,walk,words}.ts`.
   - `tests/state/sources/search/*`, which is the forbidden move (Spec 1).
   - `tests/state/sources/repositories/diff/diff-view.test.ts` and `tests/state/shared/instance-state-sources.test.ts`.
   - The item-20 tests, which the brief's prose allows.

   What is wrong: on its first real use the script prints 22 paths and misses about ten source paths plus the forbidden test folder. Failure scenario: the landing and the reviewer trust the script's list and miss changes made outside the path list. Verdict: the cause is the brief's rule, so it needs a ruling (for example, count only a token that starts a bullet or is in backticks at the start of an entry). The script itself does what its brief says.

2. The Replace Preview GET fails with HTTP 431 past about 1500 hits in one file (my lengths above). It is booked as Z285 and built in the repair round. Verdict: open until that round lands.

3. The regex-mode preview of Spec 3. After a literal run with regex then turned on, the preview and the write both use the replace text literally. Verdict: as Spec 3.

## Declined to judge

- Cases 27 to 31 and every DOM behaviour (row focus, the struck-through drawing, the replace box history, the pane update on a second preview): these need the look on TEST.
- Whether Cmd+Shift+F and Cmd+Shift+H reach the page in Chrome on macOS, or are taken by the browser first.
- Whether Z265's general effect is acceptable: refusals from terminals, deposit, latex, agents and sources now show the generic "The server refused the request (HTTP n)." instead of the server's reason. Report section 10 states it; it is Axel's call.
- The preview GET checks no token while the search route requires one. The existing compare GET has none either, so I note it and do not judge it.
- VS Code runs the regex again on the match text alone, which can differ from running it on the whole line for an anchored pattern (`^`, lookbehind). The port uses the groups ripgrep reports on the whole line. I did not test the difference.
- The `ask` catch shows the engine's `error.message`; it does the same at base.
- No A/B comparison or second build was needed.

Reviewer usage: not measured precisely. About 470k tokens in this session after the context was compacted, plus the session before compaction, whose count I do not have. Tool uses and minutes were not counted.

Usage (completion notice): claude-opus-5-5, 107,087 tokens, 103 tool uses, 15.9 min.

## Repair round 1, refuted

Reviewer a0129346811f03d66 at ordo-high, served claude-opus-5-5; 309,013 tokens, 86 tool uses, 28.7 min (its completion notice). Worktree `.agents/worktrees/D32`, base bdc0ac53. The reviewer changed nothing; its only git commands were `git diff bdc0ac53` (with `--name-only --no-renames`) and `git status --short`, from inside the worktree.

The round's delta: 59 files, those modified after 2026-10-02 17:14 (`find . -newer <stamp>` from the worktree root, without node_modules, .svelte-kit, build/ and .git): the report; `DESIGN.md`, `HELP.md`; 18 diagram files (the layer-data, layer-shell and layer-ui pairs byte-identical to the base); 20 source files (`src/lib/data/file-ops.ts`, `src/lib/data/helpers/search/{query,replace}.ts`, `src/lib/server/files/fs/{ops,replace}.ts`, `src/lib/server/files/search.ts`, `src/lib/state/shared/answers/answers.ts`, `src/lib/state/sources/repositories/{answers,replace-preview,repositories}.ts`, `src/lib/state/sources/search/{hits,keys,search.svelte,search,words}.ts`, `src/lib/views/sources/repositories/diff/Diff.svelte`, `src/lib/views/sources/search/{box-keys.ts,Results.svelte,Search.svelte}`, `src/routes/api/(files)/ops/+server.ts`); 18 test files (`tests/checks/tree/allow-duplication.txt`, `tests/checks/utils/outside-paths.test.ts`, `tests/data/helpers/replace.test.ts`, `tests/routes/replace/{preview.test,replace-fixture}.ts`, `tests/state/sources/fs/{fs-files.test,fs-fixture,fs-notes.test,fs.test}.ts`, `tests/state/sources/repositories/diff/{diff-read,diff-view}.test.ts`, `tests/state/sources/search/{endpoint.test,replace.test,search-fixture,search.test}.ts`, `tests/views/sources/search.test.ts`, `tests/views/whole/type-scale.test.ts`); `utils/outside-paths.mjs`.

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (from tools/oculus of the worktree, 18:59:54 to 19:24:48, load average 23.60 at start)
$ npm test
 Test Files  483 passed | 24 skipped (507)
      Tests  12313 passed | 637 skipped (12950)
$ npm run test:checks
 Test Files  30 passed | 2 skipped (32)
      Tests  466 passed | 9 skipped (475)
$ npm run check
1790961408475 COMPLETED 3113 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

$ sh utils/unused-exports.sh   -> exit 0; "Unused exports (238)", "Unused exported types (108)", 348 lines
$ npx knip --production --include exports,types --reporter compact --no-progress   -> exit 1; cmp with the script's output: EQUAL
  codeThemeIds 1, languageNamed 2, hostZone 1 hits; FILE_FIELDS, searchArgs, the 14 names of ruling 9, DiffRequest, previewRequest, groupAnswer, diffReader: 0 hits each
$ grep -rn 'String(response.status)\|HTTP \${' src/lib/state src/lib/views src/lib/ui   -> no output, exit 1
$ the spec's perl ASCII gate over src tests config utils (find ! -name local.yml)   -> no output
$ node r1rev32/size.mts   (the starting tree's previewUrl, 2000 hits, from a node http server)
address length 21821 status 431
$ node r1rev32/outside.mjs   (over main's D32 brief)
changed 144 wide entries 65 strict entries 53
outside (wide) 61
Test titles of tests/state/sources/{search,fs}/ at the round's start and now: 158 and 162; none present at start is missing now.
```

### Verdicts (whole diff since the base)

Items: 1 holds. 2 holds as ruling 3 reshapes it (`toggleMode`, `search.svelte.ts:192-197`; `replace.test.ts:284-324`); the in-flight window is finding 9. 3 holds. 4 holds. 5 holds for Replace All; finding 8 covers the sentence after a single Replace. 6 holds. 7 holds. 8 holds. 9 holds. 10 holds (a POST with the token, `ops.ts:195`, `:682`, `:777`; the GET branch gone; `preview.test.ts:132`, `:147`); its head comments are finding 4. 11 holds (`HELP.md:176`, `DESIGN.md:130`, `:393`). 12 holds (`HELP.md:170`). 13 to 19 hold. 20 holds. 21 holds with the builder's justified deviation from ruling 15 (finding 10); a residual prose entry is finding 11. 22 holds. 23 holds; its D32 block is finding 3. 24 holds.

Cases: 1 to 19 met. 20 met at the state layer (`diff-read.test.ts:97`, `:108`, `:117`; `replace.test.ts`); Diff.svelte's `reader.close()` at `:392` has no unit test, component-local state only, no finding. 21 met in behaviour (four keys 0, 1, 2 and n, not "three groups"). 22 to 26 met. 27 to 31 not verifiable here (the look on TEST). 32 met. 33 met as carried. 34 met.

### Findings

No closure was made by removing a check; the one allow-list edit removes the stale `allow-duplication.txt` entry `duplication.test.ts:597-606` requires gone. Rulings 1 to 14 are closed as claimed, except:

1. Proof. `tests/routes/replace/preview.test.ts:132` posts a body to `handleOps` and never forms an address; on the starting tree it fails with `TypeError: previewRequest is not a function`, never with 431. The 431 was shown only by a throwaway test no longer on disk; the reviewer's own run reproduces it (`address length 21821 status 431`). Failure scenario: a later change that again carries the hits in an address keeps this test green. Ruling 1's test clause partly met.
2. Proof. `tests/state/sources/fs/fs-fixture.ts:16`, `:19`: `export let client` and `export let asked`, file-scope mutables rebound by `storeHooks()`'s `beforeEach` and read through live bindings (the starting tree had them inside a `describe` body). Failure scenario: a file reading `client` at collection time gets `undefined`. No verdict.
3. Standards. `tests/checks/utils/outside-paths.test.ts:207-210` names step D32 in a test title and reads the ledger's `briefs/D32.md` at collection time. Failure scenario: an edit of the D32 brief's path list turns `npm run test:checks` red for the next step, and archiving the ledger makes the file throw at collection. Item 23, minor; fix: the D32 bullets copied in as a synthetic section, the step id dropped from the title.
4. Standards. `src/lib/server/files/fs/replace.ts:3` and `:359` still say GET /api/ops `preview`; ruling 1 made it a POST. Item 10, minor.
5. Standards. `src/lib/state/sources/search/hits.ts:136-137`: "a run made before regex mode was on" is false; `replacementFor` returns null only for a regex run whose hit carries no `groups`. No verdict.
6. Standards. `src/lib/state/sources/search/search.ts:80`: "from the first" compares with an earlier form, as ruling 13 removed elsewhere. No verdict.
7. Standards. `src/lib/state/sources/search/keys.ts:57`: `export type RowKind` has no importer outside `keys.ts`. No verdict.
8. Behaviour. `search.svelte.ts:360-369` and `Results.svelte:138-146`: the "Replaced ..." sentence takes the count line's place after every replace (a single Replace, a file's Replace All) and stays until the next run; Dismiss does not clear it. VS Code shows it only from `SearchView.replaceAll` (searchView.ts:812-845) and writes the count back on any later change (`:791-794`, `:2057-2068`). `DESIGN.md:130` says "what a Replace All said", `Search.svelte:35-36` "what a replace came to". Failure scenario: after one Replace of 40 hits the count line keeps "Replaced 1 occurrence across 1 file with 'bar'." and the number of hits left is not shown. Item 5, partial.
9. Behaviour. `search.svelte.ts:196`, `:230`: a toggle turned while a run is in flight flips the chip, but `runSearch` returns at once, so nothing runs again and the answer lands under the old toggles; `HELP.md:170` is false in that window. Failure scenario: a literal `foo` in flight, regex turned on, `[$1]` typed: the rows preview and Replace writes `[$1]` literally. No test covers a toggle during a run. Item 2 and ruling 3, partial in that window.
10. Spec, the builder's deviation on ruling 15, judged: `utils/outside-paths.mjs:56-95` takes every backticked token outside parentheses; the literal reading would misprint 12 listed paths of the D32 brief (brief lines 181, 184, 187) as outside. The build stands; the ruling's text is what should be corrected. Item 21 holds.
11. Behaviour. `utils/outside-paths.mjs:82-95` over brief line 158 takes the prose word `data/helpers/` as an entry, which covers every `/data/helpers/` path; today it hides nothing (`outside (wide) 61`). Failure scenario: a change to `src/lib/data/helpers/worktrees.ts` under this brief would print nothing. Low, no verdict.

For the record: the builder ran `git -C . status` and `git -C /nonexistent status` against the no-git rule; nothing in the tree depends on them. The round's file list leaves out 10 changed source files and the diagrams, each ruling 9's `export` removal, ruling 13's comment or the `RowKind` rename; no decision rests on the list.

### Declined to judge

- Cases 27 to 31 and every DOM behaviour: the look on TEST.
- Appendix R1-B's per-case base runs: one cited line spot-checked (`search.test.ts:259`), the base-tree runs not rerun.
- The worktree's `D32-report.md` (1624 lines) lacks the "Repair round 1" section main's copy (1685 lines) has; which copy lands is the orchestrator's call.
- The origin rule on the preview POST in `src/hooks.server.ts`: not read this round.
- Whether the adapter's request body limit bounds the preview POST for tens of thousands of hits: not checked; `search.max_hits` caps the hits a tab holds.
