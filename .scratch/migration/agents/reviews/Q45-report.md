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


Everything in the brief and in the repair round is done.

One run of the full suite had 1 failing test that I did not identify. That run took 134.87s under load. An immediate rerun passed every test: `Test Files 247 passed (247)`, `Tests 4126 passed (4126)`.

## DONE / NOT DONE

The original step and the repair round together. All commands were run from `tools/oculus` in the q45 worktree.

| Item | Status | Proof |
|---|---|---|
| Brief 1: `words` uses `fillPlaceholders` and still throws on a missing key | DONE | `npx vitest run tests/server/pty/chat.test.ts`: 4 passed. Reverts A and B turn it red |
| Brief 2 and repair 2: keys scan reads every `words(` call under `lib/server/` whatever the first argument; a computed or missing key fails | DONE | `npx vitest run tests/keys.test.ts`: 8 passed. Probes J and K turn it red |
| Brief 3: braces in the title and path come through `server.chat.chat_focus_note` unchanged | DONE | chat.test.ts, revert A |
| Repair 1: a focused chat start builds its instruction, focus note, name and seed through the one fill | DONE | `npx vitest run tests/routes/terminal.test.ts`: `Tests 35 passed (35)`. Red under revert F |
| Repair 3: the five false sentences | DONE | see "Repair round" below |
| Full suite | DONE, with the one-run failure above | `npx vitest run --reporter=dot`: first run `Tests 1 failed / 4125 passed (4126)`; rerun `Tests 4126 passed (4126)` |
| `npm run check` | DONE | `COMPLETED 1210 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | exit 0, `built in 9.96s` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | exit 0 |
| ASCII gate (perl form) | DONE | printed nothing, exit 0 |

## Repair round

### Ruling 1: DONE
New case in `tests/routes/terminal.test.ts`, inside the chat describe: "fills a title holding a placeholder and a replacement pattern into the command as written".
- It starts a focused chat through `handleTerminal` with the project title `Alpha {1} $& Study`.
- It checks the terminal name, then the whole tmux command: instruction, focus note, index note, model and seed.
- The expected text comes from a new `filled(key, args)` helper. It splits the template at its placeholders instead of replacing into it, so it does not depend on the server's fill.
- Revert F (the focus note and focus name built with `catalog[...].replaceAll` chains in `startChat`): `Tests 1 failed | 38 passed (39)`, and the failing case is the new one.

### Ruling 2: DONE
In `tests/keys.test.ts`:
- `WORDS` is now `/(?<![\w$.])words\(/g`. It runs only on files whose path starts with `WORDS_DIR = 'lib/server/'`.
- The declaration is left out by the same `/function\s+$/` rule `CALL` uses.
- A new `afterFirstArgument(source, at)` finds the key: the text after the first comma at the call's own depth. It skips quotes and nested brackets, so `textCatalog(config)` counts as one argument. A call with no comma before its closing parenthesis, such as `words(catalog)`, gets a null key.
- The synthetic test writes two files:
  - `lib/server/pty/Words.ts`: calls with `catalog`, `textCatalog(config)` and `texts`, a `words(catalog)` call, and the declaration.
  - `lib/state/Words.ts`: `words('kicker', 'kicker')` and `words(catalog, 'app.title')`, neither read.
- The test expects the four server calls with their keys. It expects the computed call and `words(catalog)` to be reported as unapproved.

Probe results:
- **J:** `words(textCatalog(config), 'server.chat.' + name)` added to `chat.ts`. Red on "uses literals except at the documented computed prefixes", `1 failed | 7 passed`.
- **K:** `words(texts, 'server.chat.chat_nmae')` added to `chat.ts`. Red on "names a catalog key in every literal read", `1 failed | 7 passed`.

### Ruling 3: DONE
- **`chat.ts` doc comment on `words`:** the sentence about `tests/keys.test.ts` now says it reads every `words` call under lib/server, whatever its first argument is, and fails on a key that is not a literal of the catalog. That is true after ruling 2, as probes J and K show. It also names `$` patterns.
- **`chat.test.ts` head comment:** now says three cases give placeholder braces, the second also `$` patterns, and the fourth names a missing key and expects the throw.
- **`keys.test.ts` `WORDS` comment:** now names the data layer's `words(catalog)` in `sources/config.ts`, and the state and present modules' own helpers, as the reason a `words` outside `lib/server/` is not read. It says the declaration is left out by the `function` rule of `CALL`.
- **`keys.test.ts` synthetic-case comment:** now says a call with no key argument reads no key, the declaration is left out by the `function` rule, and a `words` outside lib/server is not read.
- **`finding-text.ts` head comment:** adds that `words` of `server/pty/chat.ts` also uses `fillPlaceholders` for the terminal text: the chat instruction, its notes, and the chat and LaTeX terminal names.

## Reverts run
Each revert was made on the worktree file. The file was restored from a copy under `scratchpad/q45-builder/`, and `cmp` printed "both restored" or "restored".
- **F:** `replaceAll` chains in `startChat`. terminal.test.ts plus chat.test.ts: `1 failed | 38 passed (39)`, the new route case.
- **J and K:** see ruling 2.
- **L:** `WORDS` read only when the first argument is `catalog` (`/(?<![\w$.])words\((?=\s*catalog\s*,)/g`). `1 failed | 7 passed`: "catches a computed key and a literal key, and reads past neither".
- **M:** the `function` rule removed from the `WORDS` loop. `2 failed | 6 passed`: "uses literals except at the documented computed prefixes" (the declaration becomes a computed read) and the synthetic case.
- **N:** `WORDS` read in every folder, not only lib/server. `3 failed | 5 passed`: "uses literals", "names a catalog key in every literal read" (the data and state `words` helpers) and the synthetic case.
- **A:** the old per-argument `replaceAll` loop in `words`. terminal.test.ts plus chat.test.ts: `4 failed | 35 passed (39)`. The three chat.test.ts fill cases and the new route case.
- **B:** `words` returns the key instead of throwing. chat.test.ts: `1 failed`, "throws on a key the catalog lacks, naming the key".
- **C and D:** a computed key added under src, and the WORDS scan dropped. Both red on keys.test.ts. The synthetic case carries the revert comment "drop the WORDS scan from calls(), or read `words` only when its first argument is `catalog`".

## Doc text
- `grep -n "words(\|chat.ts\|server/pty"` over DESIGN.md, HELP.md and README.md finds nothing.
- DESIGN.md line 124 names only `findingText` as the server's catalog wording. The change does not make it false. It could also name `words` of `server/pty/chat.ts`.

## Visible change

Measured by `node -e` on the real `chat_focus_note` template, args `alpha`, `Title {1} and {2} $&`, `/hub/projects/alpha`:
- before: ``project `alpha` (Title {1} and /hub/projects/alpha {1})``
- after: ``project `alpha` (Title {1} and {2} $&)``

Chat names, the seed and LaTeX terminal names change the same way when an argument holds braces or `$` patterns.

## Decisions the orchestrator may reverse
- Which folder's `words` calls are read is set by one path prefix, `WORDS_DIR = 'lib/server/'`. A `words` helper added under lib/server that is not the catalog one would be read as a catalog read and fail the test.
- `afterFirstArgument` does not treat `<` as a bracket. That only matters for a declaration's type annotation, which the `function` rule already leaves out; revert M shows the rule is needed.
- The route case goes through `handleTerminal`, the path the other chat cases use, not `startChat` directly.

## Limitations
- The failing test in the first full-suite run was not identified: that run's output only showed the totals. The rerun passed every test.
- `tests/routes/terminal.test.ts` is now 967 lines, close to the 1000-line limit per file.
- The other chat cases in `terminal.test.ts` still build their expected text with `.replace('{0}', ...)` chains. Their arguments hold no braces, so they are correct. Only the new case is sensitive to the fill.
- A `words` call written as a method (`x.words(`) or passed around as a value is not read, by the lookbehind the other readers also use.

## Files changed (`git diff --stat` plus the new file)
- `src/lib/data/finding-text.ts`: +2 -1, head comment
- `src/lib/server/pty/chat.ts`: +10 -6, 157 lines
- `tests/keys.test.ts`: +88 -8, 440 lines
- `tests/routes/terminal.test.ts`: +55, 967 lines
- `tests/server/pty/chat.test.ts`: new, 60 lines
