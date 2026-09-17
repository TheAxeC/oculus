# Step Q45 refuter report (on .agents/worktrees/q45, base 76930aa3)

## Verification (rerun by the reviewer)

All commands were run from `tools/oculus` in the worktree. The worktree is unchanged afterwards: `git status --short` shows the same three paths as before.

| Command | Result |
|---|---|
| `npx vitest run --reporter=dot` | `Test Files 1 failed / 246 passed (247)`, `Tests 1 failed / 4124 passed (4125)`. The failure was `tests/server/hpc/ssh.test.ts > rejects a command that never returns at the budget...` (`Matcher did not succeed in time`), a timing test; I was cloning the tree at the same time. Rerun alone: `Tests 5 passed (5)` |
| `npm run check` | `COMPLETED 1210 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | exit 0, no output |
| `npm run format:check` | `All matched files use Prettier code style!` |
| ASCII gate (perl form) | printed nothing, exit 0 |
| `npm run build` | exit 0, `built in 5.94s` |

The builder's before and after example (args `alpha`, `Title {1} and {2} $&`, `/hub/projects/alpha`) reproduces exactly through the real catalog, run in my copy.

## 1. Spec

- **Item 1:** met. `src/lib/server/pty/chat.ts:54` returns `fillPlaceholders(template, args)`, and the throw is kept at line 53. `routes.ts:224` already calls `words`, so leaving it unchanged is correct.
- **Premise 1 (the brief's test arguments are not red under the old loop):** confirmed wrong. My probe `tests/probe/q45-brief-args.test.ts` used the brief's case: title `Title {1}`, path `/hub/projects/{0}/alpha`. It passed under the new code, and still passed with the base `chat.ts` put back. The old loop only refills a placeholder number higher than the argument's own position, and it reads `$` patterns. The builder's replacement cases cover both, and turn red under the old loop (revert A). They meet item 3.
- **Premise 2 (the computed-key check already held):** confirmed. With the base `keys.test.ts` rebuilt from the diff and a `words(catalog, 'server.chat.' + name)` call added to `chat.ts`, "uses literals except at the documented computed prefixes" fails. Without the added call, the base file gives `Tests 8 passed`. The builder's alternative meets item 2 as written, since `documented()` (`tests/keys.test.ts:217-221`) would approve a `words` entry added to `COMPUTED_PREFIXES`, the documented list.
- **Finding, `tests/keys.test.ts:47`:** `WORDS = /(?<![\w$.])words\(\s*catalog\s*,/g` reads a `words` call only when its first argument is spelled `catalog`. Probes:
  - J: `words(textCatalog(config), 'server.chat.' + name)` added to `chat.ts` leaves keys.test.ts green (`Tests 8 passed`).
  - K: `words(texts, 'server.chat.chat_nmae')` (a misspelt literal key) also leaves it green.
  - So item 2 ("a computed key passed to `words` fails it") and the missing-key guard both hold only for that argument spelling. No such call exists in the tree today. The builder listed this as a limitation, but it leaves the chat.ts comment below false.

## 2. Proof

Reverts were run in `scratchpad/q45-review/copy`, and each file was restored with a `cmp` check.

- **A.** Base `chat.ts` (the per-argument `replaceAll` loop): chat.test.ts `3 failed / 1 passed`. The three fill cases are red.
- **B.** `words` returns the key instead of throwing: `1 failed`, "throws on a key the catalog lacks, naming the key".
- **C.** Computed `words` key added to `chat.ts`: keys.test.ts red on "uses literals except at the documented computed prefixes". The same result holds on the base keys test.
- **D.** WORDS scan dropped from `calls()`: red on "has a reader for every catalog key" and "catches a computed key and a literal key, and reads past neither".
- **E (my addition).** WORDS widened to `/(?<![\w$.])words\(/g`: 4 red, including the synthetic case. So the new negative fixtures (`words(catalog)`, `words('kicker', 'kicker')`) are load-bearing.
- **G (my addition).** `fillPlaceholders` itself turned into a per-argument `replaceAll` loop: chat.test.ts 3 red.
- **H (my addition).** `words` loops from the last argument down with a function replacer: 3 red.
- **Green under a revert that should turn it red (F).** In `startChat` (`chat.ts:127` and `:135`), I built the focus note and the focus name with `catalog[...].replaceAll(...)` chains and left `words` untouched. `tests/server/pty/chat.test.ts` and `tests/routes/terminal.test.ts` together: `Tests 38 passed (38)`. The new tests cover `words` alone, and nothing proves the chat start flow uses it.
- **Chat start flow in `tests/routes/terminal.test.ts`:** `34 passed` under the new fill, and `34 passed` under the base loop too. Its expectations are built with `.replace('{0}', ...)` chains at lines 777, 785-792, 805, 827, 850 and 858. Its arguments hold no braces or `$`, so the flow is neutral to this change and would not catch a regression in it. The file is outside the builder's paths.
- **Not covered:** a placeholder with no argument filled as empty in `words` (mutation I) stays green in chat.test.ts. The rule is covered for `fillPlaceholders` in `tests/data/finding-text.test.ts:23`, and the brief does not ask for it on `words`.

## 3. Standards

- **`src/lib/server/pty/chat.ts:43-45`:** "a missing one is a fault of the code, which tests/keys.test.ts guards statically". This is false for any call whose catalog argument is not named `catalog` (probes J and K above).
- **`tests/server/pty/chat.test.ts:3-4`:** "each case gives them braces and replacement patterns and expects them in the sentence exactly as written". This is false:
  - the cases at lines 29 and 43 hold no `$` pattern;
  - the case at line 51 holds neither braces in arguments nor a pattern, and expects a throw;
  - only the case at line 36 holds replacement patterns.
- **`tests/keys.test.ts:43-44`:** "since the client's own `words` helpers take other arguments". The one other `words(catalog)` call is `src/lib/data/sources/config.ts:530`, which is data layer, not client. It takes the catalog, and is left unread only because no comma follows `catalog`.
- **`tests/keys.test.ts:340-341`:** "a helper of the same name that takes anything else, or its own declaration, is not [read]". The same inaccuracy applies to `words(catalog)`. Also, the declaration is skipped only because its first parameter carries a type annotation (`catalog:` is not followed by `,`). WORDS has no `function\s+$` exclusion like the one `CALL` gets at line 159.
- **`src/lib/data/finding-text.ts:1-4`:** the head comment says "The words a finding is written in" and lists sources readers, validate.ts, server/audit.ts and `t()` as its users. `server/pty/chat.ts` now imports `fillPlaceholders` from it to fill terminal names and the chat instruction, which are not findings.
  - The list is not worded as exhaustive, so no sentence is strictly false. But the module's stated identity no longer covers its users.
  - The file is outside the builder's paths, and the brief named this import. Carrying it (a clause in the head comment, or a neutral home for `fillPlaceholders`) is the orchestrator's.
- **Layer boundaries:** a server module importing `data/finding-text.ts` is allowed. `tests/boundaries.test.ts` lists `data/finding-text` as a pure helper, and passed in the full suite.
- **`DESIGN.md:124` and `:334`:** not made false by the change. Line 124 already omitted the server's `words`.
- **History in comments:** none. No package id, date or reverted attempt in the added comments.
- **Non-ASCII:** the gate printed nothing.
- **File sizes:** `chat.ts` 156 lines, `keys.test.ts` 391, `chat.test.ts` 59.

## 4. Behaviour

Run through the real catalog (`textCatalog(loadConfig(engineDir()).config)`) with the base loop against the new `words`, by the probe `copy/tests/probe/q45-behaviour.test.ts`. For the long instruction, only the backticked parts are shown.

- **`server.chat.chat_focus_note`**, args `alpha-{1}`, `Title {2} $& $' {0}`, `/hub/projects/a{1}$$`
  - before: ``project `alpha-Title /hub/projects/a{1}$ {1} ` ( ... ). Your working directory is the project's own folder ` (absolute); read its files for depth. {0}). ...`` (the template's own tail is spliced in by `$'`)
  - after: ``project `alpha-{1}` ... folder `/hub/projects/a{1}$$` ``
- **`server.chat.chat_instruction`**, args `/Users/x/hub-{1}$&`, `/Users/x/hub-{1}$&/p`
  - before: hub root `` `/Users/x/hub-/Users/x/hub-{1}{1}/p{0}` ``, working directory `` `/Users/x/hub-{1}{1}/p` ``
  - after: `` `/Users/x/hub-{1}$&` `` and `` `/Users/x/hub-{1}$&/p` ``
- **`server.chat.chat_index_note`**, arg `/state/chat/claude-$&-{0}.md`
  - before: `...file /state/chat/claude-{0}-{0}.md; ...`
  - after: `...file /state/chat/claude-$&-{0}.md; ...`
- **`server.chat.chat_name_focus`** (chat name), arg `Study {0} $$ $&`
  - before: `Study {0} $ {0}`
  - after: `Study {0} $$ $&`
- **`server.chat.chat_name`**, arg `3`: `Chat 3` before and after.
- **`server.chat.seed_focus`**, arg `{0} $' done`
  - before: `Ask about {0} : methods, results, what's next... done: methods, results, what's next...`
  - after: `Ask about {0} $' done: methods, results, what's next...`
- **`server.latex.name`** (LaTeX terminal name), args `build`, `a-{2}`, `main-$&{1}.tex`
  - before: `latex build a-main-{2}{1}.tex/main-{2}{1}.tex`
  - after: `latex build a-{2}/main-$&{1}.tex`
- **Not run end to end:** the same text through the route with a stub tmux; only the fill was checked there. `startChat` reaches every one of these strings through `words` alone (`chat.ts:67`, `127-138`, `routes.ts:224`), read, not run.

## Not checked

- The browser suite; the step touches no markup.
- `HELP.md` and `README.md` beyond the grep for `words(`, `chat.ts`, `server/pty` and `fillPlaceholders`, which found nothing relevant.
- A `words` call with a template literal key; by reading `LITERAL` at keys.test.ts:83 it gives a null key and would be caught, but not run.

Reviewer usage: about 27 tool uses, about 17 minutes.


## Repair round 1, refuted
```
All commands run from tools/oculus in .agents/worktrees/q45. git status --short is the same five paths before and after.
npx vitest run --reporter=dot (run 1)   Test Files 247 passed (247) | Tests 4126 passed (4126) | Duration 51.01s
npx vitest run --reporter=dot (run 2)   Test Files 247 passed (247) | Tests 4126 passed (4126) | Duration 105.00s
  Neither run failed, so the builder's unidentified one-run failure was not reproduced.
npx vitest run tests/routes/terminal.test.ts tests/keys.test.ts tests/server/pty/chat.test.ts   Test Files 3 passed (3) | Tests 47 passed (47)
npm run check        COMPLETED 1210 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint         exit 0, no eslint output
npm run format:check All matched files use Prettier code style!
ASCII gate (perl)    printed nothing, exit 0
npm run build        exit 0, built in 8.27s

Reverts and probes, each run in scratchpad/q45-review2/copy with the files restored from the worktree after each run and checked with cmp.
Copy baseline (the three test files): 47 passed.
A  per-argument replaceAll loop put back in words: 4 failed | 35 passed (39): the three chat.test.ts fill cases and the new route case
B  words returns the key instead of throwing: 1 failed | 3 passed, "throws on a key the catalog lacks, naming the key"
F  startChat builds the focus note and focus name with replaceAll chains using string replacements: 1 failed | 38 passed (39), the new route case
F2 startChat builds the focus note, focus name and seed_focus with a per-argument replaceAll loop that uses a function replacer: 35 passed (35)
F3 revert F, with the route case title changed to 'Alpha {1} Study' (no $&): 35 passed (35)
F4 title 'Alpha {2} $& Study' under revert F2 (focus note only): 1 failed | 34 passed, the new route case; the same title with no revert: 35 passed
J  words(textCatalog(config), 'server.chat.' + name) appended to chat.ts: 1 failed | 7 passed, "uses literals except at the documented computed prefixes"
K  words(texts, 'server.chat.chat_nmae') appended to chat.ts: 1 failed | 7 passed, "names a catalog key in every literal read"
L  WORDS reads only when the first argument is catalog: 1 failed | 7 passed, the synthetic case
M  function rule removed from the WORDS loop: 2 failed | 6 passed
N  WORDS read in every folder: 3 failed | 5 passed
W1 WORDS_DIR = 'lib/server/pty/': 8 passed (8)
P1 words(texts as Record<string, string>, 'server.chat.chat_name', 1) appended to chat.ts: 1 failed | 7 passed, "uses literals except at the documented computed prefixes"
P2b String(words(pick(/[(]/), 'server.chat.' + name), 'server.chat.chat_name') appended to chat.ts: 8 passed (8)
P2c the same call with the outer argument changed to 'server.chat.chat_nmae': 1 failed, "names a catalog key in every literal read" (the outer argument is read as the words key)
P3 function words(line: string) plus words(line) appended to server/mail/triage.ts: 1 failed | 7 passed, "uses literals except at the documented computed prefixes"
P4 words(catalog, `server.chat.chat_name`, 1), a template literal with no interpolation: 1 failed, "uses literals" (read as a computed key)
P5 words(pathFor('a//b'), 'server.chat.' + name) followed by a line String(1, 'server.chat.chat_name'): 1 failed, "uses literals"
P6 words(catalog /* it's the catalog, */, 'server.chat.chat_nmae'): 1 failed, "names a catalog key in every literal read"
```
- Closures that reproduce: ruling 1 (revert F red), ruling 2 (J, K, L, M, N red), rulings 3 and 4 (the five sentences read true against the tree, every verification command green). Reverts A and B from the first round still turn tests red. No fix goes beyond its ruling. The delta touches only finding-text.ts's head comment, chat.ts's doc comment, keys.test.ts and one route case with its `filled` helper in terminal.test.ts, all inside the widened paths.
- tests/routes/terminal.test.ts:833: ruling 1's case, "fills a title holding a placeholder and a replacement pattern into the command as written". Only the `$&` in the title can turn it red. The `{1}` does nothing: it is the highest placeholder the title can take in both chat_focus_note (title is argument 1) and chat_name_focus, so no later argument refills it. F3 (revert F without `$&`) stays green. F2 is a startChat that bypasses words and refills later placeholders in an argument, which is the brief's named defect. It stays green too. A title holding `{2}` turns F2 red (F4). So the case proves that the chat start does not read `$` patterns. It does not prove that the start fills each placeholder once. Proof.
- tests/keys.test.ts:52 and :380: the scope of the WORDS scan. chat.ts:45 and the WORDS comment both say it covers everything under lib/server, but the only test fixture sits in lib/server/pty/. Narrowing WORDS_DIR to 'lib/server/pty/' leaves the whole keys test green (W1). No revert checks the claimed scope beyond pty. Proof.
- tests/keys.test.ts:59-79 (`afterFirstArgument`): the scanner can read past its own call and pass a computed key. It counts brackets inside a regex literal. In P2b, `words(pick(/[(]/), 'server.chat.' + name)` is nested in a call whose next argument is a literal key. The scan takes that outer literal as the words key, and the keys test stays green with a computed key in the tree. P2c confirms the outer literal is what gets read. So chat.ts:45-46 ("fails on a key that is not a literal of the catalog") is false for that shape. No such call exists today. Comments are stripped before the scan: a comment holding an apostrophe and a comma is handled (P6), and a `//` inside a string fails loudly (P5). Proof.
- The builder's report, "Decisions the orchestrator may reverse", says that `afterFirstArgument` not treating `<` as a bracket "only matters for a declaration's type annotation". P1 does not reproduce this. A type assertion or generic in a call's first argument (`words(texts as Record<string, string>, 'server.chat.chat_name', 1)`) is split at the comma inside `<...>`, read as a computed key, and fails "uses literals" even though the key is a valid literal. The failure is loud, but the report's sentence is false. Proof.
- tests/keys.test.ts:52: a `words` helper under lib/server that is not the catalog one fails "uses literals except at the documented computed prefixes" (P3). The failure is loud, the builder disclosed it, and it follows ruling 2's wording ("every words( call under server/"). A template literal key with no interpolation is read as computed (P4), the same way LITERAL treats the other readers. Neither is beyond the ruling. Noted only.
- tests/routes/terminal.test.ts: this round takes the file from 912 to 967 lines (the base line count comes from the diff reversed onto the worktree file) and does not split it. spec.md, "What every package obeys": "One source file under 1000 lines. A file approaching it is split by concern." Standards.
- Behaviour: none beyond the first run's section. The round changes only comments and tests outside chat.ts's fill.

Reviewer usage: about 30 tool uses, about 22 minutes (18:26 to 18:48). Most of the time went to the two full-suite runs and the probes.

## Closed

- The first review's findings: closed by the round's four rulings, reproduced by the run over the round (F, J, K, L, M, N red).
- The route case proving only the `$` half (a title holding `{1}` cannot be refilled): a fix at landing gives the title `Alpha {1} {2} $& Study`, which the run over the round showed red under a fill that refills later placeholders (its F4).
- The WORDS scan's scope beyond `lib/server/pty/` unproven: a fix at landing adds a `lib/server/mail/Words.ts` fixture to the synthetic case; red with `WORDS_DIR` narrowed to `lib/server/pty/` (1 failed), green restored.
- The argument split not knowing a regular expression literal or a type argument (probes P1, P2b): the `words` doc comment in `server/pty/chat.ts` now names both limits; no such call exists in the tree.
- `tests/routes/terminal.test.ts` at 967 lines: under the 1000-line rule, noted; a split by concern when it next grows.
- A `words` helper under `lib/server` that is not the catalog one failing loudly, and a template literal key read as computed: follow the ruling, noted.

After the fixes, in the worktree: `npx vitest run tests/routes/terminal.test.ts tests/keys.test.ts tests/server/pty/chat.test.ts` 47 passed; `npm run lint`; `npm run check` 0 errors; `prettier --check` on the three files.
