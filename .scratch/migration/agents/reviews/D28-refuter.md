# Step D28 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D28, base 2441e0b53)

A page this report cites (the rules file, a standard, a skill's text) is named with its section. A finding in code or in a tree document keeps its `file:line`.

Summary: every command on the verify list passes. Most of the code holds up when read. The open findings:

- The brief's 6.2 is violated: `Source.svelte` was kept at 519 lines by shortening its head comment instead of splitting the file.
- Four `DESIGN.md` sentences the brief named were left false or not rewritten (:121, :125, :455, :550). Three comments describing `locals.config` were also left false, in `app.d.ts` and the route head comments.
- An unmounted tab saved under autosave does not draw the `source.format_failed` line (2.2).
- The option descriptions are not the VS Code sentences the brief named (2.1, 3.1).
- The `hooks.server.ts` config cache is module-level mutable state (spec.md "No globals"). It was made under the brief's not-reproduced branch, where the brief does not authorize a fix.
- 17 new tests are not named in any guarded entry the report proposes, and G11 gets a second test for one unit.
- Four smaller behaviour defects are listed in section 4.

## Verification (rerun by the reviewer)

```
$ cd tools/oculus && PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh /Users/axelfaes/.claude-work/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
test:quick: 108 changed file(s), from git since HEAD
ok      ASCII gate (0.5 s)
ok      prettier (1.4 s)
ok      svelte-kit sync (1.9 s)
ok      eslint (1.6 s)
ok      svelte-check (5.1 s): ... 432 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (19.7 s)
test:quick: 20.3 s (limit 45.0 s); every command passed
checks: 1 commands passed            (exit 0)

checks.sh takes exactly one argument, so the reviewer's base was passed directly:
$ npm run test:quick -- --base 2441e0b53
test:quick: 108 changed file(s), from git since 2441e0b53 ... every command passed (20.3 s), exit 0

Item 2: npx vitest run <the 10 new/changed test files> tests/routes/files/history.test.ts tests/checks/config/config.test.ts tests/checks/source/keys.test.ts tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts
 Test Files  14 passed (14)
      Tests  161 passed (161)

Item 3: the spec.md perl ASCII gate over src tests config (local.yml excluded): no output, exit 0

Item 4: sh utils/unused-exports.sh in the worktree and in the main checkout (src there = base), then diff:
166c166
< src/lib/state/sessions/source.svelte.ts: sourceInfoUrl, loadHeadFile, loadSourceReadonly
---
> src/lib/state/sessions/source/draft.ts: sourceInfoUrl
(both files 371 lines; the only change is the moved path, as the report says)

Item 5: ls | wc -l: state/sessions 10, sessions/source 4, views/sources/source 9, source/save 9, data/helpers/files 8, data/prose 9, server/files/fs 10, tests/server/files 10, tests/data/helpers/files 2 (also server/core 9, tests/state/sessions 5)
wc -l against the base: Diff.svelte 499 -> 520 (component limit 520), Source.svelte 519 -> 519, ui/controls/editor/Editor.svelte 513 -> 517, PaneView.svelte 510 -> 512; no changed file over its limit

Item 6: grep -rn "sessions/source.svelte" src tests: no output (exit 1)
Item 7: isBinaryFile used only at fs/replace.ts:156, fs/ops.ts:754, machine/lsp/library/read.ts:53; the save path does not call it

Item 9 (the report's failing lines), rerun on the builder's unchanged-tree copy $S/old:
$ cd $S/old && npx vitest run tests/routes/files/source.test.ts tests/routes/files/history.test.ts tests/routes/replace/lsp-edit.test.ts tests/server/root/hooks-server.test.ts tests/state/workbench/navigation/pages.test.ts
Failed Tests 16: history.test.ts:90; source.test.ts:123, :137, :155, :169, :183, :193, :217 (two rows), :230, :242; lsp-edit.test.ts:179 (NUL row); hooks-server.test.ts:76 ("expected "loadConfig" to be called 1 times, but got 2 times"); pages.test.ts:72 and :85 ("TypeError: ui.registerSaveBeforeClose is not a function") and a third pages row
(every line matches the report except pages.test.ts, where the report says :64)

Item 10: the history words of spec.md ("What every package obeys", the first rule) over every added comment line and test title (git diff 2441e0b53 -- src tests, plus the new files whole): 33 hits, all of "before", "still" or "no longer" describing order or state at run time ("before the write", "is still in flight", "a base the file no longer holds"); none is history. The report's own grep used a different word list (it leaves out before, still and always).

Commands the report quotes, rerun:
$ npm run test:checks
 FAIL tests/checks/config/integrity.test.ts > the real hub > validates with no findings
 FAIL tests/checks/config/integrity.test.ts > the real hub > reads the portfolio deck with every named deck found
 Test Files  1 failed | 16 passed (17)
      Tests  2 failed | 241 passed (243)
(the same as the report; cause: git config core.sparseCheckout = true and git ls-files -t deck prints "S deck/closing.md", so deck/ is outside the sparse worktree; not D28's)

$ npx vitest run $(cat /tmp/d28tests.txt) tests/server/root tests/routes/files tests/routes/replace tests/server/files tests/state tests/shell
 Test Files  40 passed (40)
      Tests  285 passed (285)       (the report says 283)

$ git status --short -uall . | grep -c zz-probe    -> 0
$ git status --short -uall . | wc -l               -> 108 (107 under tools/oculus plus the report)

loadConfig and the new stamp, timed in memory (node --input-type=module importing src/lib/data/sources/config.ts, 8 runs, no file written):
loadConfig ms [109.7,70.3,68.2,66.5,65.8,68.2,65.3,63.5]
stamp ms [1.91,1.37,1.9,1.87,1.94,2.06,1.84,1.76]
(agrees with the report's 72 to 131 ms)

The probe outputs the report cites were read, not rerun: $S/new-server-probe.txt, new-diff-probe.txt, new-rules-probe.txt, c28.txt and c36.txt hold the PROBE lines the report quotes. Rerunning them needs the probe files copied into tests/, and the dev-server timings need a server; this review changes no file and starts no server.
```

## Verdicts

Items of the brief's "What to build":

- 1.1: holds. `draft.ts` has `base` and `disk` in `draftShape` with `catch` defaults; `loadSource` uses `readCappedBytes` and `digestOf`, which `readHash` also calls (`fs-transport.ts:432`, `:445`).
- 1.2: violated in its docs (Spec 3, Spec 4). The code holds:
  - the channel name and payload;
  - the re-resolve at every tick;
  - the `stat:` signature over `TEXT_LIMIT`;
  - the bounds of 200 and 1,000;
  - the `unsubscribe` message, `forget`, and the socket wiring.
- 1.3: holds. The base compare, the second stat and the history copy made from the compared bytes are in place, the answer carries `hash`, `create` works, and saves are serialized. Behaviour 1 (an uncaught stat) and Behaviour 2 (a rejected save jams the queue) apply.
- 1.4: holds as read; the drawing is the look's. `DiskNote.svelte` and the conflict compare are in place, `diffActs` is false, and the gone fact reaches `PaneView`.
- 1.5: holds. `source.svelte.ts:441-470` reads the disk; on a 404 it takes `saved` and keeps `gone`; on a failed read it keeps the tab and says why.
- 2.1: violated (Spec 5).
- 2.2: violated (Spec 2, Spec 6). The rest of 2.2 holds: eligibility, the timers on the handed clock, blur and page blur, the key change, the close, the refusal block and `saved`.
- 3.1: violated (Spec 5). The keys, `LanguageRecord`, `readRecord` and `layered` hold (`editor.ts:28-29`, `:133`).
- 3.2: holds (`save-text.ts`, and its table test).
- 3.3: holds. The order in `performSave` is trim, then format, then `endText`, then send. `keep` is passed only for an automatic save. Cmd+S, the palette, Open Editors, the LaTeX save-all (`context.ts:421`) and untitled saves go through `saveSourceDraft`.
- 3.4: holds as read (`editsBetween`, `rewrite`). The caret and the undo are the look's.
- 4: holds. `isWholeText` covers `handleSource` and `lsp-edit` (NUL anywhere), the BOM is kept, `create` writes no BOM, `isBinaryFile` keeps its three callers, `source.binary` is reworded, and the page sets `notText`.
- 5: the empty pane holds. The 4 to 6 s and the 300 ms bound are not verifiable here (Declined). The `hooks.server.ts` change is Spec 7, Standards 1 and Behaviour 3.
- 6.1: holds.
- 6.2: violated (Spec 1).
- 6.3: holds, with one key the brief did not list, `save_folder` (Spec 8).
- 6.4: violated (Spec 3, Spec 4, Behaviour 3's comments).

Cases:

- 1: partial, look half. State half met by source.test.ts 'takes the new text into a clean tab, with its edits, and keeps no unsaved mark'. Caret and scroll are the look's.
- 2: partial, look half. 'keeps the typed text of a dirty tab and marks it changed'. The line is the look's.
- 3: partial, look half. Route 'refuses a save whose base differs...' and state 'refuses the save of a changed file...'. The three buttons are the look's.
- 4: partial, look half. Probe c4, read: id `unsaved@tab-1:hub:a.md`, the title, `diffActs` false. `Diff.svelte` wires the right side to `editSourceDraft`.
- 5: met on state and route ('writes the tab text over the file with no base...', 'writes over whatever is there when the body carries no base'). The line going is the look's.
- 6: partial, look half ('takes the file as the disk holds it now when the reader reverts').
- 7: met (route 'writes a save whose base the file holds and answers the hash...'; state 'draws no change for the message of the tab own save...').
- 8: partial, look half ('follows one channel for two tabs over one file...').
- 9: met (route test with an injected `stat` whose second answer differs).
- 10: partial, look half ('marks a tab gone when the file is deleted, keeps its text, and a save makes the file again'). The struck label is the look's.
- 11: partial. Probe c11 only. Read: `sourceDirty` is false for a clean tab, so no question is asked. The mark is the look's.
- 12: met. The route row 'gone/new.md' gives 404; `answered` leaves the text.
- 13: met by probe c13 (read, not rerun). The code resolves the real path and writes the target.
- 14: met (the existing 403 route test, and the open-files null row). Proof 3 qualifies that row's title.
- 15: met ('never polls or publishes a name out of the roots...').
- 16: met ('closes the poll when the last socket drops the name...').
- 17: partial. Probe c17 only (Restore sends no base; the dirty tab becomes `changed`). That matches the code.
- 18: partial, look half. Revert test; probe c18.
- 19: met. 20: met. 24: met. 25: met. 27: met. 29: met. 30: met. 35: met. 44: met. 45: met. 46: met. 55: met. 56: met. 57: met. Each by the tests the report names, which I read and which pass in the rerun.
- 21: partial. The delay-0 test is met. The 50-copy bound has no run; `keepBytes` keeps the unchanged prune `slice(0, -SAVES_KEPT)` (`history.ts`). Settleable without a browser by repeating `handleSource` 51 times over a history folder.
- 22: partial, look half. 'saves a tab when its editor loses focus...' and 'saves every tab holding unsaved text when the page loses focus'. The Files press, the frame press and Cmd+Tab are the look's.
- 23: partial. The autosave close table and the pages.test.ts rows are met for the stores. The strip's `askAndClose` wiring has no run (Proof 2). The dialog is the look's.
- 26: partial, look half ('from off to after_delay saves the tabs that hold unsaved text at once').
- 28: partial. Probe c28 shows the `saved` callback. The build is the look's.
- 31: met by reading `performSave`, which trims or ends the text only when the rule is on, and by probe c31 (defaults false).
- 32: met by probe c32 (read) and `layered` in `editor.ts:133`.
- 33: partial. `trimText` keep rows are met. The caret place reaching `kept` is the look's.
- 34: not verifiable as built. The shape of the edits is settleable without a browser: a state test asserting the edits record a trimming save hands the editor. The caret, scroll and one Cmd+Z need the DOM.
- 36: met. Probe c36 (read), and the order in `performSave`.
- 37: partial. The route refusal is met. The open half (`notText` at load, `draft.ts`) has no run, and the drawing is the look's.
- 38: partial. Same as 37. Not in the look list, and settleable by a state test loading a NUL file through the fake server.
- 39: partial, look half (route BOM test).
- 40: met. 41: met. 42: met (lsp-edit table; probe c42).
- 43: not verifiable here (Declined). Server cost rerun above.
- 47: partial. Server half is probe c47 only, with no test. The page half has no run. Settleable without a browser: an open-files row over a file larger than `TEXT_LIMIT` with read permission removed (a non-null `stat:` payload proves no read), and a disk client test with a truncated draft and two messages.
- 48: met. 'publishes null at the tick its root stops being served...'; the null reaches `gone` through the same `hear` path the deleted-file test runs; probe c48 for the 403.
- 49: partial, look half (probe c49).
- 50: partial. The reconnect half has no run. Settleable without a browser: a state test whose stub socket re-sends the subscription and a fresh hash, with a dirty and a clean tab.
- 51: partial. The autosave refusal test is generic, and the `behavior.yml` half has no run. Settleable without a browser by a route run of `handleSource` over a half-typed `behavior.yml`, plus `loadConfig`'s findings.
- 52: partial, look half (probe c4 round trip).
- 53: partial, look half ('follows a file renamed under the tab...').
- 54: partial. The server half is met ('makes a file that is not there... refuses a folder in its place'). The tab-gone half has no run: `answered` sets `disk: 'gone'` on the folder refusal, and `hashNow` publishes null for a directory. Settleable by a state test over the fake server answering `folder`.
- 58: partial. Read: `Pages.svelte`, `PagesReset.svelte`, `OpenEditors.svelte` through `editor-closing.ts:27`, and `ActivityRail.svelte` await `saveBeforeClose`. The dialog is the look's.

Could a run without a browser have settled the halves the builder did not run?

- Cases 21, 47, 51 and 54: yes, as described in each case above.
- Case 34: the edit shape, yes; caret, scroll and undo, no.
- Cases 37, 38 and 50: the state halves, yes.
- H3 of item 5: yes, the brief names its falsifier as a client test with stub reads.

What genuinely needs the DOM: caret, scroll, focus events, struck labels, dialogs, and the on-screen timing of case 43.

## 1. Spec

- Spec 1. `src/lib/views/sources/source/Source.svelte:25-77`. The head comment drops these facts:
  - "since its root is a repository's own directory and not a served root";
  - "which the next single click replaces";
  - "an alert for a refusal, a status for Submit's progress";
  - "which opens what the file is when it is back as something other than text";
  - "with no root or path";
  - "of the current workspace";
  - "so typing into a CRLF file is kept in CRLF";
  - "handed back as one";
  - "(source-gutter.svelte.ts)".

  What is wrong: the file stays at 519 lines (it was 519 at the base) because the comment was shortened. Brief 6.2 says Source.svelte "is split by responsibility before anything is added". spec.md "What every package obeys" says "comments are not shortened and code is not compacted". Failure scenario: a reader of the head comment no longer learns why a HEAD tab has no preview, that CRLF is kept, or where the gutter lives. The next step that adds to Source.svelte has 1 line of room. Verdict: 6.2 violated.

- Spec 2. `src/lib/state/sessions/source/autosave.svelte.ts:99`: `format: format ? source.formatOf(id) : undefined`. What is wrong: an `on_focus_change` save of an unmounted tab with `format_on_save` on saves unformatted with no line. Brief 2.2 says "an unmounted tab saves unformatted with the existing `source.format_failed` line". Failure scenario: a Python tab in a background pane is saved on page blur. It is written unformatted, and nothing tells the reader. Verdict: 2.2 violated.

- Spec 3. `DESIGN.md:121`: "The socket accepts nothing from the page except subscriptions and, from a socket whose subscription carried the write token ..., terminal input, the frames of an `lsp:<language>` channel and a `jump` message". What is wrong: the socket now accepts `{type:'unsubscribe'}` (`socket.ts`, `parseUnsubscription`), from any socket. Brief 1.2 says DESIGN.md:121 says so. Failure scenario: a reader auditing what the socket takes from a page misses a message kind. Verdict: 1.2 and 6.4 violated.

- Spec 4. Three DESIGN.md places.
  - `DESIGN.md:125` (Watchers) is unchanged. The brief (1.2, 6.4) asks it to gain the open-file poll and why it polls; the poll is described at :455 and :510 instead.
  - `DESIGN.md:455` still says "its two timers only move a clock", which is false now that `autosave.svelte.ts` sets timers through `context.ts`. The brief (6.4) names :455 for the autosave timer.
  - `DESIGN.md:550` still ends "so a tab holding any of them asks before it closes", which is false for a source tab under `on_focus_change`. Brief 2.2 names it to be rewritten. :564 was rewritten.

  Failure scenario: a reader of DESIGN.md believes the page runs no timer but a clock's, and that every dirty tab asks on close. Verdict: 2.2 and 6.4 violated.

- Spec 5. `config/catalogs/options.yml:496-522`. The descriptions are the builder's own words.
  - `editor.autosave` reads "When a source tab with unsaved text is saved without a press of Save, VS Code's files.autoSave. off saves only when asked. ...".
  - `editor.final_newline` reads "Whether a save ends the text with one line ending and takes off the empty lines after the last line that holds a character, ...".

  What is wrong: brief 2.1 asks for VS Code's 16454, 16453 and 16455 (autosave), and 16406 (the delay). Brief 3.1 asks for 16501 (trim) and the exact sentence "When enabled, a save ends a last line of text with one line ending and takes off the empty lines after the last line that holds any character." The two record fields at :~524 are worded differently again. Failure scenario: the Settings view shows wording that is not VS Code's where the brief fixed VS Code's. Verdict: 2.1 and 3.1 violated.

- Spec 6. `config/catalogs/options.yml` against `DESIGN.md:550`: covered by Spec 4.

- Spec 7. `src/hooks.server.ts:9-36` (`configStamp`, `parsed`, `parsedConfig`). What is wrong: brief 5 says that when the wait does not reproduce, "the part is the empty pane above". It allows a fix in `hooks.server.ts` only for "a cause proved".
  - The report says the 4 to 6 s did not reproduce (section 3).
  - H2 was only "not falsified" (loadConfig 72 to 165 ms; my rerun 63 to 110 ms).
  - H3 and H5 were not tested.

  The change is therefore a fix the brief did not call for in this branch. It is a cross-cutting change to how every route reads the configuration. Failure scenario: see Standards 1 and Behaviour 3. Verdict: item 5 partial. Keeping the change is the orchestrator's call.

- Spec 8. `config/text/views/sources/source.yml:87`: `save_folder: "Failed to save '{0}': A folder is where this file was, so nothing was written."`. What is wrong: a user-visible sentence the brief's 6.3 list does not name. Case 54 asks for "the 409 sentence that a folder is there" without wording it. Failure scenario: none in behaviour. It is a new catalog string for Axel to see at the look. Verdict: none.

## 2. Proof

- Proof 1. Report section 5: "`tests/state/workbench/navigation/pages.test.ts:64`: `TypeError: ui.registerSaveBeforeClose is not a function` (three rows)". The rerun on `$S/old` prints the failures at `pages.test.ts:72` and `:85`. The report's 40-file run says "Tests 283 passed"; the rerun prints 285. Failure scenario: the orchestrator copies a wrong failing line into the ledger. Verdict: none.

- Proof 2. `tests/state/workbench/navigation/pages.test.ts`, describe 'what a close asks once the tabs the autosave mode saves were saved'. What is wrong: the three rows drive `ui.saveBeforeClose` with a stub saver, then `closeAsk`. They would pass with the `await saveBeforeClose(ids)` taken out of the real close paths (`close-question.svelte.ts:49`, `editor-closing.ts:27`, `Pages.svelte`, `PagesReset.svelte`, `ActivityRail.svelte`). So case 23's close itself is proved only by reading. `tests/shell/panes/strip/tab-menu.test.ts` already runs `askAndClose` rows in the unit suite, so a row there would cover the strip. Failure scenario: a later change drops the await in one close path, and every test stays green. Verdict: case 23 partial.

- Proof 3. `tests/server/files/open-files.test.ts:92`: 'publishes null for a file replaced by a link out of every root and reads nothing of its target'. What is wrong: the test asserts only `{ hash: null }`. An implementation that read the target and then published null passes it. The title claims more than the assertion shows. Failure scenario: a reader trusts the title for G2's "never reads outside". Verdict: none, since the code (`hashNow` re-resolves before any read) holds when read.

- Proof 4. `tests/server/root/hooks-server.test.ts:59-84`: `utimesSync(file, new Date(), new Date(Date.now() + 5000))` after a same-size rewrite (`'one: 1\n'` to `'one: 2\n'`). What is wrong: the test moves the mtime 5 s forward. It does not exercise the hazard the cache has, a same-size write within one timestamp tick. Failure scenario: see Behaviour 3. Verdict: none.

- Proof 5. `tests/state/sessions/source-server.ts:126-127`: `for (let turn = 0; turn < 6; turn++) await new Promise((resolve) => setTimeout(resolve, 0));`. What is wrong: `settled()` waits a fixed number of turns, not a signal. spec.md "What every package obeys" says "A test waits on a signal (an event, a promise, a fake clock), never on a fixed sleep". It is used for negative assertions too ('saves nothing for a blur under off'). Failure scenario: a save chain that grows past six turns makes a positive row assert before the save lands, or makes a negative row pass vacuously. Verdict: none.

## 3. Standards

- Standards 1. `src/hooks.server.ts:26`: `const parsed = new Map<string, { stamp: string; read: ReturnType<typeof loadConfig> }>();`. What is wrong: module-level mutable state. spec.md "What every package obeys" says: "No globals. ... no module-level mutable state ...; a dependency is passed in (a context object ...) ... A package that adds one is not landed." The server context made in `context.ts` is where a per-server cache belongs. `grep` of `src/lib/server` and `hooks.server.ts` for module-level `new Map` or `let` finds only this one mutable instance. Failure scenario: in dev, a hooks module reloaded by Vite gets a fresh Map while the server context lives on. Two test files that share an engine path share the cache. Verdict: item 5 partial.

- Standards 2. Tests not named in any guarded entry: the report's "Doc text" (section 10) omits these titles.
  - `tests/server/files/open-files.test.ts`: 'takes no name that does not start with source:', 'polls 200 names for one socket and 1,000 over the server, and no more', 'publishes the hash of the file at the first tick, and again only when the file changes', 'closes the poll when the last socket drops the name, and hands the next one a fresh hash'.
  - `tests/state/sessions/source-disk.client.test.ts`: all four titles.
  - `tests/state/sessions/source.test.ts`: 'moves nothing for a message that carries the hash the tab read', 'writes the tab text over the file with no base when the reader overwrites', 'takes the file as the disk holds it now when the reader reverts', 'marks a tab gone when the file is deleted, keeps its text, and a save makes the file again', 'draws no change for the message of the tab own save, even ahead of the answer', 'shows the new text in a draft restored with no unsaved text', 'shows the Save of a draft restored with no base as the conflict, without a request'.
  - `tests/routes/files/source.test.ts`: 'writes over whatever is there when the body carries no base', 'makes a file that is not there when its folder is in the root, and refuses a folder in its place'.

  That is 17 tests. What is wrong: spec.md "What every package obeys" says "A test exists only as the test of one entry of `agents/guarded.md`, and `agents/guarded.md` names it there by file and title". It also says "An entry keeps one test per unit it covers ..., written as a table where a unit has several outcomes". G8 and G58 now hold several separate tests of `source.ts`. G11 gains a second test of `hooks.server.ts` beside 'reads it once for a page...', and the new test is about a cache rather than G11's guarantee ("The server starts on a clean checkout"). Failure scenario: tests that no entry names, which the next cleanup cannot attribute. Verdict: none on an item. It is the orchestrator's choice to name them, fold them into tables or drop them.

## 4. Behaviour

- Behaviour 1. `src/lib/server/files/source.ts:325` and `:336`: `const before = stat(real);` and `if (!sameStamp(before, stat(real))) return changed('base', 'changed');`. What is wrong: neither stat is guarded. A file unlinked between the first `statSync` (:311) and either call makes `statSync` throw ENOENT out of `handleSource`, and the route answers a 500 instead of the 409 `changed` the race calls for. Failure scenario: another program deletes and recreates the file (not a rename) while a save is between the read and the second stat. The save fails with a server error, not the conflict line. Verdict: case 9 met for the tested race. This is a gap for the delete race.

- Behaviour 2. `src/lib/state/sessions/source/source.svelte.ts:535-540`: `const run = (queued.get(id) ?? Promise.resolve(true)).then(() => performSave(...)); queued.set(id, run); void run.then(() => { if (queued.get(id) === run) queued.delete(id); });`. What is wrong: if `performSave` rejects, the `then` cleanup never runs. `queued` keeps a rejected promise, every later save of that tab chains onto it and rejects without running, and the rejection is unhandled. No current callee was found to throw: the language format catches (`ui/controls/editor/kit/lsp/client.ts:631-636`), and the post goes through `writes.send`. So this is latent. Failure scenario: any future throw in `rules`, `kept`, `rewrite` or a format leaves the tab unable to save until the page reloads. Verdict: none.

- Behaviour 3. The config cache in `src/hooks.server.ts:9-36`, and the comments it makes false. What is wrong:
  - Each call of `locals.config()` stamps the folder again (about 1.4 to 2.1 ms, rerun above). Two calls in one request can therefore return two different parses: the title and the load function, or the roots and the catalog of `source/+server.ts`.
  - A stat error that persists, such as a dangling link or an unreadable entry under `config/`, makes the stamp the constant `'unreadable'`. After one parse under it, no write is seen until the error clears.
  - A same-size rewrite within one timestamp tick is missed. This machine's volume is APFS (`mount` prints `apfs`), whose nanosecond times make that unlikely there.
  - A write inside a subfolder of `config/` is seen, because the listing is recursive.
  - These comments are now false:
    - `src/app.d.ts:17-20`: "The configuration as the disk holds it, read at the first call of this request and held for the rest of it";
    - `src/routes/api/(files)/source/+server.ts:6`: "The configuration is the request's own read";
    - `src/routes/api/(files)/fs/+server.ts:8`: "one request reads the configuration once".

  spec.md "What every package obeys" says a head comment the change makes false is a defect of the change. Failure scenario: a reader trusts `app.d.ts` and assumes one consistent config per request, or an unreadable entry in `config/` silently freezes the configuration. Verdict: item 5 partial, 6.4 violated.

- Behaviour 4. `src/lib/views/sources/repositories/diff/Diff.svelte:122`: `` `${held.id}${previewKey(held.replace)}${diskHash(held.root, held.path) ?? ''}` ``. What is wrong: the disk hash enters the read key of every diff pane over a file a source tab holds, not only the conflict compare. A staged or HEAD diff is read again on every change of the file, the tab's own saves included. "A read that changes nothing keeps what is drawn", so the cost is extra reads, not a wrong drawing. The report does not state this. Failure scenario: with `after_delay` at 0 and a Changes diff open on the same file, each keystroke's save triggers a diff read. Verdict: none.

- Behaviour 5. `src/lib/state/sessions/source/disk.svelte.ts:101`: `if (draft.truncated) { if (readFor.get(id) === hash) return; readFor.set(id, hash); }`. What is wrong: a truncated draft's `base` is the hash of its capped bytes, which never equals the server's `stat:` message. So the first message after every open rereads the 2 MB capped part once. This is by design for case 47's append, but it also happens with no change. Failure scenario: each open of a 3 MB file reads 2 MB twice. Verdict: none.

## Declined to judge

- Case 43's on-screen time and the 300 ms bound on TEST, and the on-screen halves of cases 1 to 6, 8, 10, 11, 18, 22, 23, 26, 33, 34, 37, 39, 49, 50, 52, 53 and 58. These are the look's, and I ran no browser and no server.
- The builder's dev-server timings (435 ms before, about 15 ms after) and its probes c3 to c54. I read their saved output but did not rerun them: rerunning needs probe files placed in the tree or a server started, and this review changes no file.
- Whether to keep the `hooks.server.ts` cache under the not-reproduced branch (Spec 7). That is the orchestrator's call, or Axel's.
- How to dispose of the 17 tests not named in any entry (Standards 2). The ledger and guarded.md are the orchestrator's.
- The 22 paths outside the write list, judged:
  - `src/hooks.server.ts`: see Spec 7.
  - `src/lib/data/helpers/files/address.ts` and `src/lib/data/model/index.ts`: the channel name and the `Unsubscription` type, shared by the page and the server.
  - `src/lib/server/core/file-poll.ts`: the per-tick path that the re-resolve needs.
  - `src/lib/state/client/writes.svelte.ts` and `src/lib/state/shared/stores/shapes.ts`: the `hash` in the answer.
  - `src/lib/state/system/machine/debug/debug.svelte.ts` and `src/lib/views/sources/source/save/untitled-save.ts`: they follow `saveDraft`'s new return type.
  - `src/lib/state/workbench/navigation/editor-text.ts`: holds `saveRulesOf`, since state may not import views.
  - `src/lib/state/workbench/navigation/pages.ts`, `src/lib/views/system/workbench/PagesReset.svelte`, `src/lib/views/sources/files/sections/OpenEditors.svelte` and `src/lib/shell/rail/ActivityRail.svelte`: they carry "every close of a file tab" from brief 2.2.
  - `src/lib/ui/controls/editor/diff/DiffEditor.svelte` and `src/lib/views/sources/repositories/diff/DiffSection.svelte`: the editable right side of the conflict compare.
  - The tests and fixtures: `tests/data/sources/config/wrong-settings.ts`, `tests/routes/files/history.test.ts`, `tests/routes/replace/lsp-edit.test.ts`, `tests/server/root/context-fixture.ts`, `tests/server/root/hooks-server.test.ts`, `tests/state/sessions/source-disk.client.test.ts` and `tests/state/sessions/source-server.ts`.

  Each is reached by the work and none is a separate concern, so I raise none as a finding apart from `hooks.server.ts`.
- `stat:` signature, `unsubscribe` message, channel bounds: judged and holding; no finding.
  - `stat:` is the hash of `ino:size:mtimeMs:ctimeMs`, over `TEXT_LIMIT`, with no read.
  - The `unsubscribe` message acts only on the sender's own sink and only on `source:` names.
  - The bounds: 200 per socket and 1,000 per server, joining an existing poll is allowed past the server bound, and a refused name is left out of the hub subscription.

Reviewer usage: a8d21c562b6b3a8c6, claude-opus-5-5, 239,746 tokens, 145 tool uses, 22.6 min.
