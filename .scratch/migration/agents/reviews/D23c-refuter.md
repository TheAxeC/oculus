# Step D23c refuter report (on .agents/worktrees/D23c, base 951b61e3)

Saved from the reviewer's final message (af53f7cfd7795c93a, claude-opus-5-5, 323,026 tokens, 109 tool uses, 18.8 min). A page this report cites (the rules file, a standard, a skill's text) is named with its section; a finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
# from tools/oculus in the worktree
$ npm run test:quick -- --base 951b61e3
test:quick: 62 changed file(s), from git since 951b61e3
test:quick: 99 test file(s), 10 essential
ok      ASCII gate (0.3 s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.9 s)
ok      eslint (16.9 s)
ok      svelte-check (17.6 s): 1791331405561 COMPLETED 400 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (26.4 s): Duration  22.49s (transform 48.30s, setup 0ms, import 59.24s, tests 24.48s, environment 119ms)
test:quick: 26.8 s (limit 45.0 s); every command passed

# npm run diagrams was not run: it writes files. The in-memory staleness check stands in for it:
$ npx vitest run tests/checks/diagrams --testTimeout 0 --hookTimeout 0
 Test Files  1 passed (1)
      Tests  46 passed (46)

# ASCII gate of the rules file over src tests config; then over DESIGN.md docs/files-and-search.md docs/views.md
(printed nothing) exit 0
(printed nothing) exit 0

$ sh utils/folder-check.sh
folder exit 0

# guarded tests the brief names (G2 lsp rows, G28 source.test.ts, G29 layout-saved)
$ npx vitest run tests/server/machine/lsp tests/state/sessions/source.test.ts tests/state/workbench/layout/saved/layout-saved.test.ts --reporter=dot
 Test Files  9 passed (9)
      Tests  115 passed (115)

# new tests on the unchanged tree: a scratch copy of the builder's base copy (diff -rq against the worktree lists only the step's files), with library.test.ts, uris.test.ts and lsp-fixture.ts copied in
$ npx vitest run tests/server/machine/lsp/library.test.ts tests/server/machine/lsp/uris.test.ts
 Test Files  2 failed (2)
      Tests  25 failed | 34 passed (59)
(the 25 failing titles are the 21 library.test.ts rows and the 4 uris.test.ts rows the report names)

# tree checks, as the report quotes them, in parts
$ npx vitest run tests/checks/imports tests/checks/look tests/checks/source tests/checks/utils tests/checks/tree --testTimeout 0 --hookTimeout 0
 Test Files  12 passed (12)
      Tests  126 passed (126)
$ npx vitest run tests/checks/config --testTimeout 0 --hookTimeout 0
 FAIL tests/checks/config/integrity.test.ts > the real hub > validates with no findings
 FAIL tests/checks/config/integrity.test.ts > the real hub > reads the portfolio deck with every named deck found
 Test Files  1 failed | 3 passed (4)
      Tests  2 failed | 69 passed (71)
(126 + 71 + 46 = 243, 2 failed: the report's "2 failed | 241 passed (243)" reproduces; the two are in a file the step does not change)

# unused exports: base copy against worktree
$ diff refute-ue-base.txt ue-wt.txt
diff exit 0

# the report's probes, node run.mjs <case> from the builder's d23c folder, against a scratch oculus:
# lsof -iTCP:8795 printed nothing first; 8790 held pid 53745 before, while up and after;
# HOME=<scratch>/refute-d23c-home npx vite dev --port 8795 --strictPort; stopped by its pids; 8795 then 0 lines
== case1
case 1 F12 on idlelib: [{"uri":"oculus-lib:///86969598-527f-42b1-ac76-f786b581689c/__init__.py","range":{"start":{"line":0,"character":0},"end":{"line":0,"character":0}}}]
case 1 read: {"firstLine":"\"\"\"The idlelib package implements the Idle application.","bytes":396}
no file:// path in any frame: true
== case4py
hover on main in the library tab: {"kind":"plaintext","value":"(function) def main() -> None"}
F12 on pyshell inside the library tab: [{"uri":"oculus-lib:///dc57f7c1-4ecc-4db5-810b-198a12edd85d/pyshell.py",...}]
second tab differs from the first: true
second read: {"firstLine":"#! /usr/bin/env python3","bytes":62484}
rename answer as the relay passes it (the editor offers none: read-only): null
no file:// path in any frame: true
== case12
case 12 same server twice: one token: true
case 12 two servers: two tokens: true
read of the hub token claiming the game-engine root (12c): {"code":"unknown"}
== link
case 12e LocationLink: [{"uri":"oculus-lib:///2f264502-e08a-4391-9b31-d8a271ec4886/__init__.py",...}]
== refusals
case 5 read of a token no answer gave: {"code":"unknown"}
case 6 read of that token on another page: {"code":"unknown"}
case 9 hover naming a library address the page was not given: {"code":-32602,"message":"the document is not open"}
case 9 hover naming a token of another page: {"code":-32602,"message":"the document is not open"}
== reconnect
hover before restart: "{\"kind\":\"plaintext\",\"value\":\"(function) def main() -> None\"}"
12g hover after a server restart (new server): "{\"kind\":\"plaintext\",\"value\":\"(function) def main() -> None\"}"
12g read of the old address on a new socket: {"code":"unknown"}
== case14
case 14 definition: [{"uri":"oculus-file:///hub/tools/present/deck_config.py","range":{"start":{"line":41,"character":4},"end":{"line":41,"character":11}}}]
case 14 references: ["oculus-file:///hub/tools/present/deck_config.py:42:5","oculus-file:///hub/tools/present/build.py:24:25","oculus-file:///hub/tools/present/build.py:313:26"]
== case2
line 47: "const std::string key(m_worlds.worldKeyAt(slot));"
case 2 definition at string: [{"range":{"end":{"character":12,"line":44},"start":{"character":6,"line":44}},"uri":"oculus-lib:///85ff1674-d898-493f-be6e-e0612afac73f/string.h"}]
case 2 read (the peek reads this): {"firstLine":"//===----------------------------------------------------------------------===//","bytes":2833}
12c on the c channel: {"code":"unknown"}
12c with the root of another root key: {"code":"unknown"}
hover in the library tab (clangd answers): "{\"kind\":\"plaintext\",\"value\":\"class basic_string\\nprovided by <string>..."
no file:// path in any frame: true
== cppfiles
include 1: ["oculus-lib:///7e5aeb47-.../y.h"]  include 2: []  include 3: [".../50%2525.h"]  include 4: [".../z.h"]  include 5: the token of include 1
12a the dot folder include is dropped: true
12d /var and /private/var spellings give one token: true
12f % in the name: title and read: {"name":"50%.h","read":{"firstLine":"int pct_value = 3;","bytes":19}}
12a binary file named: read: {"code":"binary"}
no file:// path in any frame: true

$ node tab.cjs
line 5, no column: {"line":5,"column":0}
line 5, column 7: {"line":5,"column":7}
line 5, column -3: {"line":5,"column":0}
line 5, column "x": {"line":5,"column":0}
line 5, column NaN: {"line":5,"column":0}
line 5, column Infinity: {"line":5,"column":0}
column 7, no line: {"line":0,"column":0}
```

Every probe line the report quotes reproduces, tokens aside (fresh UUIDs per run).

## Verdicts

Items of the brief's "What to build", in its numbering:

- Part 1, 1: holds. `library/pages.ts` `libraryAddresses`, `library/address.ts`; probes case1, case2, case12 give `oculus-lib:///<uuid>/<name>` and one token for a path named twice.
- Part 1, 2: holds. `Library` is a field of `Page` (`held/held.ts`), made per page in `relay.ts`; a token stores real path, root, language and server (`library/tokens.ts`); probe "12g read of the old address on a new socket: unknown".
- Part 1, 3: holds. Only `asked !== undefined` mints (`pages.ts:42-54`); `toPage` drops `arguments` and `changes` holders it cannot turn (`uris.ts`); table rows on notifications and `applyEdit`; every probe prints "no file:// path in any frame: true".
- Part 1, 3a: holds. Key is server, root, language, real path (`tokens.ts` `keyOf`); "two servers: two tokens: true"; 12f probe.
- Part 1, 3b: holds as ruled by D23c-cases items 2 and 3. `rules.ts` `mintable` covers the dot rule with the pyright prefix exception, `closed_paths` and withheld folders. Rows pass; the cppfiles probe drops the dot-folder include.
- Part 1, 4: holds. `library/read.ts`, `wire.ts`, `model-processes.ts`; every refusal code has a row; probes for cases 5, 6, 12c.
- Part 1, 5: holds. `toServer` takes a `library` resolver and `held/documents.ts` `openingTarget` opens a library document on the naming server. Probe hover inside the library tab, before and after `restart`.
- Part 1, 6: holds for what a run can show (probes case1, case2, case4py). Tab drawing, peek drawing and C++ highlighting are left to the look.
- Part 1, 7: holds by reading. `lockedWords` gives `library_locked` with `writable={lock.words === ''}`. Save, Revert and wrap are listed only while `editing`. Monaco refuses `executeEdits`, rename and code actions on a read-only editor (`codeEditorWidget.js:941`, `rename.js:306`, `codeActionModel.js:176`). `library-tab.svelte.ts` shows `library_gone`. Drawing is left to the look.
- Part 1, 8: holds. DESIGN.md lines 123, 510, 522, 571 and 572, `uris.ts` head comment, `docs/files-and-search.md` 71 (and 17) and `docs/views.md` 69 all state the rule. Standards 3 covers a stale name in `relay.ts`.
- Part 1, 9: holds. The report's "Hand-over for agents/guarded.md" gives the G2 sentence, the G2 Code and Test lines and the G3 lines.
- Part 2, 1: holds. `status/tab-state.ts` `openedAt`; `tab.cjs` run above.
- Part 2, 2: holds. `sourceTabState(..., column)`, `openSourceFile`/`openLibraryFile`/`openReference` (`source-file.ts`), `LspServices.open(target, line, column)` and `readFile(target)`; the behaviour of the column on other openers is Behaviour 1.
- Part 2, 3: holds by reading. `commands.ts:25-42` `word`; `Editor.svelte` keys `placed` on `"line:column"`.
- Part 2, 4: holds as ruled by D23c-cases item 6 (`word` beside `goto`). `PaneView.svelte` and `Palette.svelte` are unchanged.
- Part 2, 5: violated. See Spec 1 (Z676).
- Part 2, 6: holds. `References.svelte` `open` and `again` call `openReference` with `one.start + 1`.
- Part 2, 7: holds for the clamp (`commands.ts:26-30`, the clamp `goto` uses). The selection made after the clamp is case 21's finding.

Cases of the brief's "Cases" (case 1 as D23c-cases item 1 rules it):

- 1: met for the protocol (probe case1: library address, read of `idlelib/__init__.py`). The tab is left to the look.
- 2: met (probe case2; clangd names `string.h`, so the language comes from the token's `cpp`). Highlighting is left to the look.
- 3: met by reading (`peeks.ts:56` reads `services.readFile(target)`, which for a library target is `lsp.readLibrary`) and by the case2 read. Peek drawing is left to the look.
- 4: met (probe case4py: hover, a second token for `pyshell.py`; clangd hover in case2; read-only by reading). Typing and rename are left to the look.
- 5: met (probe refusals). 6: met (probe refusals).
- 7: met (row 'answers not_file for a file removed since the answer'; `library_not_file` via `library-tab.svelte.ts` `refusal`).
- 8: partial. The relay refusal is met (row 'answers too_large ...'). The tab sentence cannot be reached on the go-to-definition path; see Behaviour 3.
- 9: met (probe refusals; row 'refuses a message whole ...').
- 10: met (row 'drops from a notification ...').
- 11: met (probe case14, unchanged address).
- 12: met (probe case12; row 'gives the same address ...').
- 12a: met (rows; cppfiles probe, the binary file answers `binary`; in-root `config`/`secrets` row per D23c-cases item 3).
- 12b: met (uris rows; probes).
- 12c: met (probes case12, case2; rows).
- 12d: partial. The `/var` and `/private/var` half is met. The symlink half is Proof 1.
- 12e: met for the address (probe link). `targetSelectionRange` reaching `services.open` was checked by reading `hosts.ts`.
- 12f: met (cppfiles probe). 12g: met (probe reconnect; `lsp.svelte.ts` `forgetLibraries` on every status change that is not open, by reading).
- 13: met by reading (`gone` when `lsp.library(address)` is null; `openReference` opens a library row as a library tab).
- 14: met (probe case14: definition at 42:5, the `word` command selects `catalog`, by reading). Left to the look.
- 15: met by reading (`opening.ts` restates an open tab; `placed` keyed by line and column).
- 16: partial. The name is selected, but the focus does not move into the editor; see Spec 1.
- 17: met by reading (`range: null` rows keep `goto`). 18: met by reading. 19: met (both files unchanged in the diff).
- 19a: met by reading (`hosts.ts` still returns false after `services.open`). Left to the look.
- 20: met (`tab.cjs`).
- 21: partial. See Spec 2.

## 1. Spec

- Spec 1. `src/lib/views/sources/files/sections/Outline.svelte:211` and `src/lib/views/sources/source/language/lsp.ts:468-479`: `else if (row.range !== null) ask(tab.id, { kind: 'select', range: row.range });` reaches `select`, which calls `editor.setSelection(selected); editor.revealRangeInCenterIfOutsideViewport(selected);` and no `focus()`. An Outline press no longer moves keyboard focus into the editor, where the `goto` it replaced called `made.focus()` (`commands.ts`). Ruling Z676 says `select` takes an optional focus flag and the Outline sets it; the flag is not built. Failure scenario: the reader presses a function in the Outline of a Python tab and types; the keys go to the Outline tree. Verdict: Part 2 item 5 violated, case 16 partial.
- Spec 2. `src/lib/ui/controls/editor/commands.ts:25-42`: `const column = Math.min(Math.max(1, Math.floor(command.column)), held.getLineMaxColumn(line)); const word = held.getWordAtPosition({ lineNumber: line, column });`. After the clamp to the line's end, Monaco's `getWordAtText` returns the word that ends at that position, so a line that ends in an identifier gets that identifier selected. Case 21 asks for the caret at the line's end. Failure scenario: a saved tab state `{ line: 3, column: 200 }` on a line `x = compute_total` selects `compute_total` instead of putting the caret after it. Verdict: case 21 partial.
- Spec 3. The report's "The files" section: `src/lib/state/system/machine/lsp/references.ts`, `references.svelte.ts`, `src/lib/ui/controls/editor/commands.ts`, `types.ts` and `docs/diagrams/*.dot|svg` lie outside the brief's write list and outside D23c-cases' additions; the report does not mark them with their reasons. Each is needed (`word` by D23c-cases item 6, the References state by Part 2 item 6 and Part 1 item 7, the diagrams by `npm run diagrams`). No verdict.

## 2. Proof

- Proof 1. Case 12d: "`node run.mjs cppfiles`; table row 'answers moved for a path whose folder is a link to another folder now'". The case's input is a token minted for a symlink whose link is retargeted afterwards; the row's input is a real folder replaced by a link after the token is minted. `realOfFileUri` resolves a server's path before minting (`src/lib/server/machine/lsp/uris.ts:163`), so a token minted for a link stores the link's target, and retargeting the link changes nothing the read checks (`read.ts:44-46`). The read then succeeds with the text of the file the link named when the token was minted, where the case expects a refusal. No other file is read, but neither the row nor a probe covers the case's input. Failure scenario: a server names `/opt/sdk/include/current/foo.h`, `current` linking to `v1`; the link moves to `v2`; the library tab reads `v1/foo.h`. Verdict: case 12d partial.

## 3. Standards

- Standards 1. `src/lib/views/sources/source/Source.svelte:47-68` (head comment): text removed from the base (the Submit plan sentence, the status bar paragraph, the blame details), against the rules file's "comments are not shortened and code is not compacted to stay under it" and the brief's "nothing is compacted"; the file is at exactly 520. Most facts moved to the modules that hold the code; two clauses are gone everywhere: "in the Repositories view's graph" and "(the tab's Alt+Z choice among them)". Failure scenario: a maintainer reading `Source.svelte` to learn where a blame press goes finds "as source-gutter.svelte.ts says", and the gutter's head comment says only "opens its commit".
- Standards 2. `src/lib/views/sources/files/sections/Outline.svelte:14`: a short line ends inside a sentence, against the rule that an edited comment is rewrapped as a whole paragraph at 100 columns.
- Standards 3. `src/lib/server/machine/lsp/relay.ts:7` "(held.ts)" and `:20` "(the file watchers become watch.ts's)": both files moved to `held/held.ts` and `held/watch.ts`; a name change is carried to every comment that names it.
- Standards 4. `src/lib/server/machine/lsp/library/read.ts:9-10` against `:50-51`: the head comment lists `binary` before `too_large`, while the code checks `found.size > TEXT_LIMIT` first. Failure scenario: a binary file over 2 MB answers `too_large`, while the comment says it answers `binary`.
- Standards 5. The report's tree-check row cites `git sparse-checkout list`, a git command a builder may not run. No product effect.
- Standards 6. The report's "History words in changed files" row does not use the rules file's word list nor quote the grep. The reviewer's grep of the added comments and titles finds "no longer", "still" and "before", each describing runtime state, not history; none is a defect, but the report gives no judgment.

## 4. Behaviour

- Behaviour 1. `src/lib/ui/controls/editor/kit/lsp/hosts.ts:138` ("services.open(target, 1, 1);") and `hosts.ts:122-126` (column `1` when Monaco passes no position): before the step a link press or a positionless open went to line 1 with nothing selected; now column 1 reaches the tab and the file's first word is selected. No item asks for it, and the report does not state it. Failure scenario: a press on a document link to a Python file whose first line is `import os` opens the tab with `import` selected.
- Behaviour 2. `src/lib/views/sources/source/language/lsp.ts:457`: F4 and Shift+F4 through the latest References result now open each location with the word selected, where they went to the line before; the report names only the References press.
- Behaviour 3. `src/lib/ui/controls/editor/kit/lsp/peeks.ts:57` with `transport.ts` `#modelFor`, and `language/lsp.ts:218`: a go to definition into a library file the read refuses (`too_large`, `binary`) gets no peek model, so the location is dropped before any tab opens; F12 does nothing and says nothing, and a References search drops such a file too. Failure scenario: F12 on a symbol defined in a 3 MB generated header outside every root does nothing. Verdict: case 8 partial.
- Behaviour 4. `References.svelte` `pickFile`/`pickLine` and `references.ts` `copyText`: Copy Path and Copy All on a library row copy the file's name with its line, not a path (Decision 1, the page holds no machine path); the report does not state it.

## Declined to judge

- Everything a drawn editor decides: cases 1 to 4 in the tab, 13, 14 to 19a on screen, 21 on screen, the read-only note under dark and light, focus and selection rendering (the landing look on TEST).
- The probe first runs on the unchanged tree: read from the builder's saved base outputs, which agree with the report; not rerun.
- `npm run diagrams` as the brief writes it (it writes files); the in-memory staleness check stands in.
- The wording of the G2 and G3 lines in `agents/guarded.md`, which the orchestrator writes at landing.
- A pyright interpreter whose `sys.prefix` is the home folder would put `~/.ssh` under the dot-rule exception (`rules.ts:69`); not exercised; the orchestrator's call.

Reviewer usage: af53f7cfd7795c93a, claude-opus-5-5, 323,026 tokens, 109 tool uses, 18.8 min.
