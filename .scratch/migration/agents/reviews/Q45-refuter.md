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
