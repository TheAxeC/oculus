# Step Q45 builder report

Everything in the brief is done. One premise in the brief was wrong, and one item already held before this step. Both are explained under "Brief premises found wrong" below.

## DONE / NOT DONE

All commands were run from `tools/oculus` in the q45 worktree.

| Item | Status | Proof (command and output) |
|---|---|---|
| 1. `words` uses `fillPlaceholders` and still throws on a missing key | DONE | `npx vitest run tests/server/pty/chat.test.ts`: `Tests 4 passed (4)` |
| 2. Keys test still reads `words(catalog, ...)`, and a computed `words` key fails it | DONE | `npx vitest run tests/keys.test.ts`: 12 passed together with chat.test.ts. The computed-key revert (C below) turns it red |
| 3. Fill test: braces in the title and path come through `server.chat.chat_focus_note` unchanged | DONE | new `tests/server/pty/chat.test.ts`. Reverts A and B below turn it red |
| Tests 1 to 3, each revert named and run | DONE | see "Reverts run" |
| Full suite | DONE | `npx vitest run --reporter=dot`: `Test Files 247 passed (247)`, `Tests 4125 passed (4125)` |
| `npm run check` | DONE | `COMPLETED 1210 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | exit 0, `built in 8.58s` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | exit 0, no output from eslint |
| ASCII gate (the perl form) | DONE | printed nothing, exit 0. `LC_ALL=C grep -n '[^ -~]'` on the three touched files also printed nothing (exit 1) |

## Reverts run

Each revert was made on the worktree file, then the file was put back from a copy under the scratchpad (`cmp` printed "both restored").
- **A.** Old per-argument `replaceAll` loop put back in `words`. `tests/server/pty/chat.test.ts` goes red on 3 cases:
  - "keeps a title holding {1} and {2} and a folder holding {0} in the focus note as written"
  - "fills no argument into another argument, and reads no replacement pattern in one"
  - "keeps the braces of a project id and a main file in a LaTeX terminal name"
- **B.** `words` returns the key instead of throwing. Red: "throws on a key the catalog lacks, naming the key".
- **C.** A call `return words(catalog, 'server.chat.' + name);` appended to `chat.ts`. `tests/keys.test.ts` goes red on "uses literals except at the documented computed prefixes" with `+ "lib/server/pty/chat.ts: words(catalog, 'server.chat.' + name);"`.
- **D.** The `WORDS` scan skipped in `calls()`. Red: "catches a computed key and a literal key, and reads past neither" and "has a reader for every catalog key".

Each changed or new test carries its revert in a `// Revert:` comment.

## Brief premises found wrong
1. **Test 1's arguments are not red under the old code.** The brief's exact case (title holding `{1}`, path holding `{0}`) passes with the old `replaceAll` loop. The old loop never goes back to a placeholder number it has already filled, so neither argument gets filled again. I ran it: with those arguments under revert A, that case stayed green and only the other two failed. The old loop breaks in two other situations:
   - an argument holds a later placeholder: a title holding `{2}` gets the path written into it;
   - an argument holds a `replaceAll` replacement pattern, such as `$&`, `$'` or `$$`.

   The item-3 test therefore uses a title holding `{1}` and `{2}` with a folder holding `{0}`. A second case covers an id holding `{1}` and replacement patterns.
2. **Item 2 already held before this step.** Before any edit, adding `words(catalog, 'server.chat.' + name)` to `chat.ts` already failed "uses literals except at the documented computed prefixes". The existing `unapproved()` check sends every non-literal `words` key to `COMPUTED_PREFIXES`, and no entry there is a `words` call. That is the documented list, empty for `words` today.
   - I did not add a separate `COMPUTED_WORDS_KEYS` list. It would be a second copy of the same rule, and a computed key would fail two tests.
   - What I added: the synthetic scanner test now covers `words` calls, a revert comment, and a corrected `WORDS` head comment. The old comment said "task-name"; the real second caller is the LaTeX terminal name at `routes.ts:224`.

## Decisions the orchestrator may reverse
- The fill tests are in a new file, `tests/server/pty/chat.test.ts`, and test `words` directly against the engine's real catalog. The full chat start flow is tested in `tests/routes/terminal.test.ts`, which is outside my paths.
- The expected sentence is built by splitting the template at its placeholders, after asserting they appear once each in order `{0}`, `{1}`, `{2}`. This avoids tying the test to the catalog's wording.
- The synthetic keys test also checks that `words(catalog)` with one argument, `words('kicker', 'kicker')` and the function declaration are not read. The first two shapes exist in the tree:
  - `data/sources/config.ts:530`: `words(catalog)`
  - `state/present.ts:153`: `words('kicker', 'kicker')`
- `routes.ts` needed no change.

## Visible change

Run with node on the real `chat_focus_note` template, args `alpha`, `Title {1} and {2} $&`, `/hub/projects/alpha`:
- before: ``... project `alpha` (Title {1} and /hub/projects/alpha {1}). ...``
- after: ``... project `alpha` (Title {1} and {2} $&). ...``

The chat and LaTeX terminal names (`chat_name_focus`, `server.latex.name`) change the same way when a title, id or main-file name holds braces or `$` patterns.

## Doc text
- `grep -n "words(\|chat.ts\|server/pty"` over DESIGN.md, HELP.md and README.md finds nothing. The `words` hits in DESIGN.md are about vocabulary words.
- DESIGN.md line 124 says server strings go through `findingText`, and does not mention the chat and LaTeX `words`. That was already true before this step and the change does not make the line false. It could name `words` of `server/pty/chat.ts` as the server's fill for its own terminal text, which uses the same `fillPlaceholders`.

## Limitations
- `WORDS` only reads calls whose first argument is literally named `catalog`, because client code has its own `words` helpers. A call like `words(textCatalog(config), 'server.' + x)` would be read by no scan, so neither the literal check nor the computed-key check would see it. `FINDING_CALL` has the same blind spot for a catalog argument written with parentheses. No such call exists in the tree today.
- The chat tests in `tests/routes/terminal.test.ts` build their expected strings with chained `.replace('{0}', ...)`. Their arguments hold no braces, so they are unaffected. The file is outside my paths and was not touched.
- The finding-text.ts head comment names only `t()` as the other user of `fillPlaceholders`. It is not false, but it no longer lists every caller. The file was outside my paths.

## Files changed
- `tools/oculus/src/lib/server/pty/chat.ts`: +9 -6 in the diff (import, doc comment, fill)
- `tools/oculus/tests/keys.test.ts`: +33 -2 in the diff (WORDS comment, two revert comments, the `Words.ts` fixture and its expected rows)
- `tools/oculus/tests/server/pty/chat.test.ts`: new, 59 lines
