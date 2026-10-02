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
