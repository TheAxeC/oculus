# Q77c refutation (claude:opus, read-only, sampled)

Verification, run once each from `.agents/worktrees/Q77c/tools/oculus` (`git status --short` there prints nothing; the step is commit 85eff0c1):

1. `npx vitest run tests/checks/bin tests/checks/source/comment-width.test.ts --reporter=dot` -> `Test Files  9 passed (9)` / `Tests  76 passed (76)`
2. `npm run check` -> `COMPLETED 1509 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
3. `npm run format:check` -> `All matched files use Prettier code style!`
4. `npm run lint` -> `lint exit 0`
5. ASCII gate (the perl form in the rules file) -> no output
6. `sh bin/size-check.sh` -> `size exit 0`; `sh bin/folder-check.sh` -> `folder exit 0`
7. `node bin/migrations/revert-anchors.mjs --check` -> `0 directives converted in 0 files written, 0 refused`, exit 0
8. `grep -rhE "// revert: [^ ]+:[0-9]" tests | wc -l` -> `0`
9. `node bin/revert-check.mjs tests/checks/bin/revert-check.test.ts tests/checks/bin/revert-anchors.test.ts` -> `34 reverts, 0 unproven, 0 unchecked`. All 34 lines are `red`: 29 in revert-check.test.ts and 5 in revert-anchors.test.ts. The run took 2:24.

## Spec

None. Every item of "What to build" is in the diff:
- `DIRECTIVE`, `NUMBERED`, `parseDirective`, `resolveAnchor`, `spelled` and `located` are at bin/revert-check.mjs:101-204. `directives()` at :232 carries `problem`. `checkOne` at :535 prints `unproven`.
- The converter imports `parseDirective`, `resolveAnchor` and `spelled` from bin/revert-check.mjs (revert-anchors.mjs:34). It does not copy the resolver.
- The head comment is at bin/revert-check.mjs:4-22.
- Both test files hold the cases the brief lists.

Brief premises I reproduced:
- 1743 directive lines in 235 files at the base, from `git grep -hE "// revert: " b1770828 -- tests | wc -l` and the `-l` form. One of the 1743 is the template string at tests/checks/source/comment-width.test.ts:80, which is not a directive.
- The base bin/revert-check.mjs is 545 lines.

The five brief cases are byte-identical to the brief. I read each one with `sed -n` at loop.test.ts:99, rail.spec.ts:463, primitives.test.ts:165, rail.test.ts:78 and duplication.test.ts:330.

Two edits reach past the directive lines, and the report states both:
- revert-check.test.ts renames the old "file or line the tree does not hold" case to "...or whose range runs backwards".
- Its expectation becomes `lines 2-1 of 4`, because the new form cannot name line 99.

## Proof

- **The "not a JSON string" message has no test.** bin/revert-check.mjs:147-153 (`anchorOf`'s `catch { return null; }`) and :167-168 (`names ${match[1]} by a text that is not a JSON string`) add a new user-visible message. `grep -rn "not a JSON string" tests/checks/bin` finds nothing. I probed the parser directly: `// revert: a.ts "x\q" => y` gives `{"problem":"names a.ts by a text that is not a JSON string"}`. No test covers it, so a revert of that branch would stay green. The report lists it only as decision 3.
- **Converter paths without a test.** No test in revert-anchors.test.ts reaches these refusals:
  - `rewrite` "the target is not in the tree" (revert-anchors.mjs:91-92)
  - `lines ${first}-${last} of ${lines.length}` (:95-96)
  - "no unique line at or above it" (:100)
  - the `--root` usage error, exit 2 (:157-162)

  The brief did not require these cases, so this is a note, not a miss against the brief.
- **The report's claims reproduce:**
  - "1754 directives, 0 with a problem": `directives()` over every tests file holding `revert:` printed `236 1754 0 0` (files, directives, problems, first===0).
  - "16 ranges, 9 with an offset, 86 offsets": a parse of the swept files gave `{ n: 1749, r: 16, ro: 9, o: 86 }`.
  - `wc -l` gives 660 / 182 / 830 / 127, against a base of 545 and 730.
  - The cited line numbers match `grep -n`, except `checkOne`, which the report puts at :536; it is at :535, and :536 is its first line.

## Standards

- bin/revert-check.mjs:10-11: `The text is a JSON string, so a line holding a quote, a backslash or `=>` is written with JSON escapes.` This is false for `=>`. `JSON.stringify` does not escape `=>`. The quoting is what keeps a `=>` inside the text from being read as the start of the replacement, and :104-105 says that correctly. The same wording is in the brief's item 1. Minor.
- Nothing else:
  - No history in the new comments.
  - The ASCII gate is clean.
  - Every file is under 900 lines (revert-check.test.ts is 830).
  - The folder and size checks pass.
  - A grep for `revert:` across `src`, `config`, `HELP.md`, `DESIGN.md` and `README.md` finds only UI strings and `git-index.ts:42 revert: ['--reverse']`, so no document states the old form.
  - The other two mentions of `revert-check` (accounts.spec.ts:99 and type-scale.test.ts:335) do not describe the directive form.

## Behaviour

- None unstated. The visible changes, all in the report:
  - `unproven  <file>:<line> names <path> "<text>", which matches <n> lines`
  - `... which runs to line <n> of <len>`
  - `... names a line number; convert it`
  - the converter's `refused` line and exit 1.
- Observation, not introduced by this step: a line that starts like a directive but does not parse is not treated as a directive at all, and nothing reports it. Two examples: unquoted text, `// revert: a.ts x => y`, and a malformed offset `+y`. Such a line is only surfaced when it leaves its case with no directive (`unchecked`). The old numbered form behaved the same way.

## Sample for item 2 (sweep faithfulness)

I checked all 1742 converted directives, not a sample. A script in the scratchpad (`faith.mjs`, `rc.mjs`) did this for each test file in `git diff b1770828 --name-only -- tests`:
1. Read the old directive lines from `git show b1770828:<file>` and the new ones from the worktree.
2. Paired them in order. For revert-check.test.ts it skipped the 7 new cases that precede the old ones.
3. Parsed each new line with the worktree's `parseDirective` and checked that target and replacement are unchanged, and that the text before `revert:` is unchanged.
4. Resolved the anchors with the worktree's `resolveAnchor` against the target as it stands now.
5. Compared the trimmed text of the resolved line or range with the trimmed text of the old numbered line or range in `git show b1770828:<target>`.

Results:
- **1720 of 1720 match** in the 234 swept files. Those include 85 directives with an offset and 15 ranges.
- **22 of 22 match** in tests/checks/bin/revert-check.test.ts naming bin/revert-check.mjs. Examples:
  - `:504->619`, `:539->654`, `:220->329`, `:204->313`, `:418->527` (twice)
  - the range `:65-84->75-94`, whose whole 20-line range text is equal
  - `:289->398`, `:294->403`, `:300->409`
- **0 mismatches.**

`git diff b1770828 -U0` over the 234 swept files changes no line other than `// revert:` lines, and the removed count equals the added count (1720). The numstat shows no file with unequal counts.

Named sample, all OK:
- the five brief cases (loop.test.ts:99, rail.spec.ts:463, primitives.test.ts:165 `+2`, rail.test.ts:78 `+1`, duplication.test.ts:330 range)
- cited-lines.test.ts, 8 directives, including the escaped regex line at bin/cited-lines.mjs:85
- dispatch-note-race.test.ts, the range `179-195` written as `.. "rmSync(breaker, { force: true });" +1`
- dispatch-note.test.ts, 21 directives (`pid,`, `return [];`, `linkSync(own, lock);`, and the `src/lib/server/sessions/stores/dispatches.ts:165` one)
- EntryCard.svelte `+1`, Diff.svelte `+1`, TreeItem.svelte `+2`, fs.svelte.ts `+5`, Gutter.svelte `+2`, open.ts `+2`
- MenuList.svelte range `"(rise" .. ": '') +"`
- Memories.svelte range with `+1`
- allow-negatives.ts `+1`
- bin/diagrams/graphs.mjs `+1`

## What I did not check

- The whole unit suite, the browser suite, and the revert check over the whole tree. I resolved every directive with `directives()`, but ran the reverts only for the two files in item 9.
- Whether each converted directive's revert still turns its case red outside those two files. Faithful anchors resolve to the same text, but I did not run those cases.
- The report's claim that the converter ran while bin/revert-check.mjs still had its old numbering. I checked only the end result (22/22 match).
- Performance of `directives()` now reading the target file once per directive.

## Closed

- Proof 1, no test for "not a JSON string": fixed at landing, new case "calls a directive whose quoted text is not a JSON string unproven" in `tests/checks/bin/revert-check.test.ts`, red under its revert.
- Proof 2, the converter's refusal paths and its usage untested: fixed at landing, two new cases in `tests/checks/bin/revert-anchors.test.ts` (a target outside the tree, lines past its end, a line with no unique line above; `--root` without a folder), each red under its revert.
- Standards 1, the head comment said `=>` is written with a JSON escape: fixed at landing, `bin/revert-check.mjs:10-12` now says a quote or a backslash is escaped and a `=>` inside the quotes is never read as the replacement's start.
- Behaviour, a line that starts like a directive but does not parse is not reported: not introduced by this step, the numbered form behaved the same; no change.
