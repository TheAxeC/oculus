# D37 builder report, repair round 1

## NOT done, not verified

All 11 items of the round are done; none is partial. What is not verified, in those words:

- Item 11 has no test: Editor.svelte cannot be mounted in the client runtime (see item 11), so the proof is the fix, a reproduction of the mechanism in the client runtime that fails without it, and the look. The behaviour on screen (Cmd+Z after Format Document on a preview tab, the focus after the keep) is not verified in a browser; this builder runs none.
- Item 2: the up-to-date build whose latexmk exits before the list read (the refuter's scenario 1) and the push that arrives while the request is out (scenario 2) are covered by the page's code and, for the server half, by a test (`channel.test.ts`); the page's half has no test (no guarded entry covers `latex.svelte.ts`), so its proof is the look at case 15 with a kept, up-to-date build terminal.
- The look cases (11 to 17, 19 to 22, 24 to 30, 32 of the brief) need a browser; none was taken. Case 32 (a float) is not verified: an asker in a float names no pane of the page tree, so the preview lands as for any asker outside the tree.
- The wiring of `replaceHits` in `search.svelte.ts` (re-read hits put in place, focus, preview moved on) has no test: no guarded entry covers it. Its pure parts were run in a probe (output below).
- The new tests in `channel.test.ts` and the changed assertion in `ops-replace.test.ts` are cases of G35 and G3 entries' test files; no guarded entry names these behaviours (the pane process in the list signature, the `edited` mark), so they need a line in `agents/guarded.md`, which is the orchestrator's.

## Open items of the state file (verbatim)

`tools/oculus/.scratch/migration/orchestrator-state.md` (main checkout), section "Open items", line 193:

```
- None.
```

## The cases' first run, on the unchanged tree

Method: the cases the G35 tests cover (15, 18, 33, 35) by the red run of those tests on the base source; cases 1, 8 and 10 by a probe over the base server modules with real ripgrep, run before any change (its script is `probe/first.mts`); every other case by reading the base code. No case was found wrong under the brief's rules, so the builder did not stop.

| Case | Result on the unchanged tree |
|---|---|
| 1 | Replace on the first hit writes `zz x qzlook`. The page then keeps the second hit at `at: 9` (`search.svelte.ts:374`, `without(...)` removes only the written hits), and a Replace on it is refused. Probe: second replace at the old place answers `{"ok":false,"error":"changed","done":[],"failed":"hub/a.txt"}`. |
| 2 | The preview request after the first Replace carries the stale `at: 9`; the server leaves a named match that is no longer there unreplaced, so the preview draws no replacement for it. By reading `replace.ts` `previewReplace`. |
| 3 | Search `a`, replace `aa`, file `a b`: the written file's hits are dropped from the list; the new matches are not listed. By reading `without`. |
| 4 | The file leaves the list and the focus moves with `rowAfter`. Holds. |
| 5 | A dismissed hit is in no list, so it cannot return; the other hits keep stale places. Holds apart from the stale places of case 1. |
| 6 | Every written file leaves the list; none is read again. |
| 7 | A refused answer drops the `done` files' hits, none is read again; the refused file keeps its hits. |
| 8 | Probe over `runSearch` with one root timed out and one answering: `truncated: true`. The count line shows the cap note. Wrong cause: `search.ts:390-402` sets `truncated` on a timeout. |
| 9 | The cap note and the capped sentence follow `truncated`. Holds. |
| 10 | Probe: the failed root is named in `failed` with ripgrep's text (`rg: boom`); the page says `search.failed_roots` ("No answer from {0}.") with the root names only, no reason, no timeout kind. |
| 11 | Reading `opening.ts` `openBeside` and `landing.ts`: the landing has no asker, so the preview can land in the Search tab's own pane. |
| 12 | Lands in the documents pane. Holds. |
| 13 | The second preview lands in the pane of the first. Holds. |
| 14 | Lands via `openBeside` with no asker. Holds. |
| 15 | Red run (`builds one main file with latexmk in the manuscript folder`: `expected undefined to deeply equal [ 'set-option', '-t', ... ]`) and reading base `sessions.ts`: the build is a plain shell session with no kept pane (no `remain-on-exit`), the name option is set by a later tmux call after `new-session`, so a latexmk that exits at once can end the session first. |
| 16 | The terminal shows output while it runs; when latexmk ends the session is gone and the output with it. The mark is `listed` (id present), so it ends when the id leaves the list. |
| 17 | The mark ends when the terminal leaves the list; same code as 16. |
| 18 | Red run (`a resize of a terminal tmux no longer has`: `expected { Object (error) } to deeply equal { error: 'terminal-ended' }`): the refusal carries tmux's raw text, and by reading base `terminals.svelte.ts` a refused resize is said nowhere. |
| 19 | `finish` calls `queries.fetch`, which returns what is held when it is fresh, so the folder read after the build can come from the held state (`latex.svelte.ts:346-433`). |
| 20 | The folder state is held and not marked on opening; the view shows the held mains. |
| 21 | The `files` message does not mark a LaTeX state. |
| 22 | No request, as no message marks anything. Holds. |
| 23 | The button says "1 problems" (`problem_counts`, `latex.yml:29`, `Main.svelte:152`). |
| 24 | `menuOf` reads only the project commands; a folder never expanded holds no listing, so the menu has no Open LaTeX. |
| 25 | No Open LaTeX. Holds. |
| 26 | Open LaTeX on a `.tex` file. Holds. |
| 27 | `latex-widget.ts:117` sets `max-width:100%` on an image added before it loads, so the box is sized around an empty image. |
| 28 | Same cause as 27; the cap `max-height:300px` holds. |
| 29 | The box is added before the load; a path that does not load leaves an empty box. |
| 30 | The box is added at once; no wait exists to cancel. |
| 31 | By reading the base `startLatex` (`routes.ts`): it starts a plain shell terminal with no `task` mark, so the terminal is no task terminal and Run Again, which the page offers only on a task terminal, is not offered on it. |
| 32 | Not verified (see above). Base code: the landing has no asker at all. |
| 33 | Each build of a main starts a new terminal: the new test `builds again in the terminal it kept` fails on the base source with `expected '9b1fb6-shell' to be '2ec833-shell'`. |
| 34 | By reading the base `commands.svelte.ts`: diagnostics are read from every terminal with a task mark; the base build has none, so the error shows once, at the log's marker. After the change the build is a task terminal, and `ranCommand` keeps it out of the diagnostics. |
| 35 | Red run (`a fork of an id that is no session`): the route answers `{ error: 'id is not a session id' }`, a text of the server's own, shown as it is. |

The red run of the G35 tests on the unchanged tree (`g35-red.txt`, repeated below on a scratch copy of the base source with the changed tests) failed 11 tests.

## The 11 items of this round

### Item 1. A dismissed hit on a line the write changed comes back

Changed: `server/files/fs/replace.ts` `rereadFile` marks a re-read hit `was.edited` when the write changed text on that hit's line before or after its match (`written(regions, start, end)`); `data/file-ops.ts` (`RereadHit`) and `state/sources/search/search.ts` (`rereadHitShape`) carry the mark; `state/sources/search/hits.ts` `applyRereads` keeps a dismissed hit out only when `was` is set and not `edited`, and drops the record of one that is listed again. The focus still follows an edited hit (`moved` is set for it).

Run, the probe case `qzlook x qzlook` (first hit replaced, second dismissed), `node probe/lines.mts` and `node probe/page.mts` over the worktree:

```
{"ok":true,"paths":["hub/a.txt"],"rereads":[{"root":"hub","path":"a.txt","hits":[{"line":1,"column":6,"length":6,"text":"zz x qzlook","at":5,"was":{"line":1,"at":9,"edited":true}},{"line":2,...,"was":{"line":2,"at":6}},{"line":3,...,"was":{"line":3,"at":0}}]}]}
edited line, dismissed hit listed again [[5]] []
other line, dismissed hit stays out [[[1,5]]] [{"root":"hub","path":"a.txt","line":2,"at":6,"length":6}]
```

The first line shows `edited: true` on the hit of the changed line only. The second shows the dismissed hit of an edited line listed again with its record dropped. The third shows a dismissed hit on an untouched line staying out with its record kept.

Check that fails without the fix: `tests/routes/replace/ops-replace.test.ts` `replaces the second of two matches on one line and leaves the first` now expects `was: { line: 1, at: 0, edited: true }`. On a scratch copy of the worktree with the `edited` mark removed from `rereadFile` it prints `- "edited": true,` under `- Expected` and `Tests  1 failed | 3 passed (4)`. The page half (`applyRereads`) has no guarded test; its proof is the probe above.

### Item 2. A build first seen already ended ends at once

Changed, page: `state/sessions/latex.svelte.ts` `run()`: when the start answer's `terminal` carries a numeric `exit` the build is ended through `finish`; when the answer shows no exit and the build was not yet marked running, `confirm` reads the list fresh, so a push skipped while `one.terminal` was null is read again once the answer has set it.

Changed, server: a kept build run again that ends before the next poll with the same status gave an unchanged list signature and so no push. `server/machine/pty/channel.ts` `#took` now includes the pane's process id in the signature, so that run is a change the pages are told of. `channel.ts` is outside the write list because no code of the write list can make the server push that change.

Check that fails without the fix: `tests/server/machine/pty/channel.test.ts`, new test `changes when a task terminal ends with the status it had, in a process run again`. On the unchanged `channel.ts` it printed `AssertionError: expected 1 to be 2 // Object.is equality`; with the change `channel.test.ts` prints `Tests  3 passed (3)`. The page half has no guarded test. Cases 15 and 17 are for the look: a kept, up-to-date build terminal, then Build.

### Item 3. Paths outside the write list

The section "Files outside the write list" below names `refusal.ts` with its reason and does not list the files the write list holds.

### Item 4. The DONE table

Rewritten below; each row quotes the last line of the run that proves it or names the look and the cases.

### Item 5. Empty, duplicated and colliding cases, and the async cases

The section of that name below.

### Item 6. Texts made false

- `DESIGN.md:151` reads that a refusal of the terminal route, a project command's actions included, is a word of `TERMINAL_REFUSALS` with the names its sentence is about, said by `terminalSentence` of `state/shared/answers/terminal-words.ts`.
- `HELP.md:33` and `DESIGN.md:378`: a tool view that asks for a tab (the Search view's Replace Preview) is never landed in; its pane is taken out of every step, and when no other pane takes the tab a new pane is split off to the right of it.
- `src/lib/server/machine/pty/edit.ts` head: an ended terminal (`terminal-ended`) or a session oculus did not start (`not-ours`) is refused with that word of `TERMINAL_REFUSALS`.
- Other hits found by grep and fixed: the `StartRequest` comment in `sessions.ts` ("refuses a bad one as `bad-terminal`"); the Search paragraph of `DESIGN.md` says `edited`; `DESIGN.md:372` names `terminal-not-started` and says the sessions list is republished on a change of the pane's process (`#took`).
- The grep over `src tests config HELP.md DESIGN.md README.md --exclude=local.yml` for `command-unknown|terminal-not-started|bad-terminal|name must be a command name|the terminal did not start` was read hit by hit: each remaining hit is code that names the word, or a test; no text describes the earlier behaviour.

### Item 7. Comment paragraphs

Rewrapped as one paragraph at 100 columns: `latex.svelte.ts` (head comment, `Build`, `settle`), `latex-widget.ts`, `row-menu.ts`, and the paragraphs the step edited in `landing.ts`, `commands.svelte.ts`, `hits.ts`, `search.svelte.ts`, `file-ops.ts`, `replace.ts`, `search.ts`, `routes.ts`, `sessions.ts`. `npx prettier --check src` passed and `tests/checks/source/comment-width.test.ts` passed earlier in this round after the rewrap; the last full run's vitest line is below.

### Item 8. The LaTeX action's root refusal, and a start that was not listed

Before and after, from `tests/routes/sessions/terminal-actions.test.ts`:

| Request | Before | After |
|---|---|---|
| `latex` action, root nothing serves | `bad-terminal`, "The terminal request was not valid." | `outside`, "It is not inside a served root." (`files.refused_outside`); a folder that is gone says `missing`, "It is not there any more." |
| `start` whose session is not listed afterwards (`sessions.ts:624`) | `terminal-ended`, "The terminal has ended." | `terminal-not-started`, "The terminal did not start." (`sessions.refused_terminal_not_started` in `config/text/views/sessions/terminal.yml`) |

Changed: `routes.ts` `latexFolder` returns `refusal(found.error)`; `refusal.ts` `Word` gains `'outside' | 'missing'`; `sessions.ts` `startTerminal` throws `TerminalRefused('terminal-not-started')`; `data/model/model-sessions.ts` `TERMINAL_REFUSALS` gains the word; `state/shared/answers/terminal-words.ts` maps it. Failing lines on the tree before the change, the two new rows of `terminal-actions.test.ts`: `AssertionError: expected { error: 'terminal-ended' } to deeply equal { error: 'terminal-not-started' }` and `AssertionError: expected { error: 'bad-terminal' } to deeply equal { error: 'outside' }`. After: `terminal-actions.test.ts       Tests  13 passed (13)`.

### Item 9. An empty command name

Before: `run.ts` refused an empty or non-string name with `command-unknown` and no name, which the page said as " is not a command of this repository." After: `bad-terminal`, "The terminal request was not valid." Test: `tests/server/machine/commands/run.test.ts`, new `a command action that names no command` (an empty name, a number, no name). Failing line before: `AssertionError: expected { error: 'command-unknown' } to deeply equal { error: 'bad-terminal' }` (3 cases). After: `run.test.ts       Tests  6 passed (6)`.

### Item 10. The cost of the re-read

`probe/cost.mts` calls `replaceFiles` (the route's function) with real ripgrep on a scratch tree of 200 files, each with one match, Replace All, five runs per tree, milliseconds. The base copy has no `node_modules`, so the base was run as a scratch copy of the base `src` (`diff -rq` of the copy against the base `src` printed nothing), beside the worktree. Two sessions of five runs:

```
base      1954 1721 1745 1849 1695  mean 1793 sd 107 min 1695 max 1954
worktree  2765 2868 3136 2633 2730  mean 2827 sd 192 min 2633 max 3136
base      1791 1600 1659 1710 1708  mean 1693 sd  71 min 1600 max 1791
worktree  2473 2350 3015 2708 2490  mean 2607 sd 262 min 2350 max 3015
```

The worktree took 1.58 and 1.54 times the base, about 5 ms more per file (the extra read and match pass per written file). That is under twice the base, so it is not a finding by the brief's threshold. A Replace All over 200 files takes about one more second. Two earlier worktree-only sessions gave means of 2722 (sd 73) and 2857 (sd 346).

### Item 11. Format Document's undo

Changed: `src/lib/ui/controls/editor/Editor.svelte` (added to the write list by this item):

```ts
const named = $derived(name);
const filed = $derived(path);
// the model effect:
const uri = modelUri(loaded.monaco, named, filed);
```

Keeping a preview tab replaces the instance object with a same-id copy. `name` and `path` reach the component as members of that object, so the effect re-ran and made the model again, which drops the undo stack. With the two deriveds the effect runs only when the name or the path changes. The other effects of `Editor.svelte` were read; the only object-member prop passed from `views/sources/source/Editor.svelte` to the primitive is `model={instance}`, and `root` and `path` in `Source.svelte` are deriveds over `instance.state`, so nothing else needed the change.

No test reaches it. A `*.client.test.ts` that mounts `Editor.svelte` fails in the client runtime before the effect runs: `ReferenceError: window is not defined` (`scratchpad/ed/tests/probe/mount.client.test.ts`, run in this turn). The component needs a DOM for Monaco's container, `tests/ui/frame/client-runtime.ts` provides none, and a fake kit cannot stand in for the DOM the component itself touches. What is in place instead is a reproduction of the mechanism in the client runtime (`scratchpad/ed/tests/probe/shape.svelte.ts`: a getter prop over `holder.instance.id`, the instance replaced by a same-id copy, an effect that counts its runs). It is not in the tree because it exercises Svelte, not `Editor.svelte`. Its run in this turn:

```
x without   AssertionError: expected { before: 1, after: 2 } to deeply equal { before: 1, after: 1 }
ok with     (the effect reading the $derived)
Tests  2 failed | 1 passed (3)      [the second failure is the mount, above]
```

Whether the editor keeps its input across the keep (step Q120, focus after a double click): by reading, the model effect no longer tears down at the keep, so Monaco's focused input is not disposed with it. Not verified in a browser. The look: open a file as a preview tab, run Format Document, double-click the tab to keep it, press Cmd+Z (it must undo the format), then type (the caret must still take the keys).

## Files outside the write list

- `src/lib/server/machine/pty/refusal.ts` (new): the module every terminal refusal passes through (`TerminalRefused`, `TmuxFailed`, `refusal`, `refusalFor`, the `Word` type), so the route files, `sessions.ts`, `edit.ts` and `run.ts` say one word set. `server/machine/pty` holds 10 files, the limit.
- `src/lib/server/machine/pty/channel.ts`: the pane's process id in the list signature (item 2); its test is in `channel.test.ts`.
- `src/lib/server/machine/commands/resolve.ts`, `placeholders.ts`: their refusals were sentences of the server's catalog; they return words and names now, and `config/text/server.yml` lost the five `commands` keys they used.
- `src/lib/data/model/index.ts`, `src/lib/state/sessions/terminal/terminal-payloads.ts`: the `latex` job source and the `TERMINAL_REFUSALS` export; `terminal-payloads.ts` accepts `latex`, without which the page would drop the row.
- `src/lib/views/sessions/session-list/SessionList.svelte`, `session-detail/SessionDetail.svelte`: they say the catalog sentence of a refusal word.
- `src/lib/ui/controls/editor/Editor.svelte`: item 11, added by the brief.

## Empty, duplicated and colliding cases, and the async cases

`TERMINAL_REFUSALS` (`data/model/model-sessions.ts`, 18 words):

- Duplicated and colliding words: `node probe/words.mts` printed `in more than one set: []` over `OPS_REFUSALS`, `LATEX_REFUSALS` and `TERMINAL_REFUSALS`, and no set holds a word twice. `refusal.ts` `Word` adds `outside` and `missing` from `OPS_REFUSALS` on purpose; the page says them through `answers.ts`, which checks the file words before the LaTeX and terminal words.
- Empty: `terminalSentence(word, [])` takes `first` and `second` as `''`. The words that print names (`command-unknown`, the dependency words, `no-file`, `no-selection`, `nul-value`) get names from `resolve.ts` and `placeholders.ts`, which always send at least one; an empty command name is `bad-terminal` (item 9), so `command-unknown` never prints without a name. A word an older server sends that is not in `TERMINAL_REFUSALS` gives null from `terminalWord`, and the page says its generic failure.
- Catalog keys: a scan of `config/text/**/*.yml` in this turn printed `[]` for keys held in more than one file, and `sessions.refused_terminal_not_started` exists once. `resume_unknown` and `resume_live` are in `session-detail.yml`, the others of `terminal-words.ts` in `terminal.yml`.

`dismissed` (`state/sources/search/search.ts` `dismissed: rowsShape(dismissedShape).catch([])`, `hits.ts`):

- Empty: a missing or malformed list is `[]`, and `applyRereads` with an empty list keeps every re-read hit.
- Duplicated: two records for one place are both matched by `find`, which takes the first; the record is dropped once, and the second names a place no hit holds. `dismissedOf` makes two records only for two hits at one `(line, at)`, which a search does not produce.
- Colliding: a moved dismissed hit (its record moves to the place it has now) and a new hit at the old place are told apart by `was`: a hit without `was` is new and is listed. An `edited` hit at a dismissed place is listed again and its record is dropped (item 1).

`rereads` (`replace.ts`, `search.ts` `rereadsOf`):

- Empty: a replace that wrote nothing answers `rereads: []`, and the page then treats every written file as unread and takes its hits out (`unread` in `replaceHits`). A refused replace carries the rereads of the files already done (`replace.ts:443`).
- Cap: a file with more than `REREAD_MAX = 2000` hits is a failed re-read (`replace.ts:385`), which the row says as "Search again to see this file's hits."
- Duplicated: a file is re-read once per file written (`replace.ts:447`).

The `latex` job source: `ranCommand` (`commands.svelte.ts:528`) is false for a task whose `job.source` is `latex`, so a build's output is never read for command diagnostics; a task with no job is still a command. The source enum of `terminal-payloads.ts` holds `latex`, so a row with it is kept.

Async cases:

- The row menu's listing read landing after the menu closed (`views/shared/explorer/tree/control/picks.svelte.ts` `menuOf`): the answer sets `listingRead` and calls `rebuild()`, which only splices the closed menu's own `items` array; nothing is opened or shown, and a failed read (`answer.error !== ''`) returns before any change.
- The picture `decode()` superseded (`ui/controls/editor/kit/latex/latex-widget.ts` `show`): `mine = turn` is taken before the `await`, and every `hide()` moves `turn`; an answer whose `mine !== turn` returns before it sets `held` or adds the widget, so a picture decoded after the pointer moved on draws nothing. A picture that fails to decode gives `null` and no box.
- A re-read answer after the tab closed (`state/sources/search/search.svelte.ts:382`): `if (!open(id)) return none` right after the `await` of the route, so a tab closed while the replace was out sets no state and moves no focus. A new run since the request (`runs.get(id) !== generation`) drops the re-read in the same function (`current`).
- The build `confirm` of item 2 acts only while `building.get(key) === mine`, so a read that lands after a newer build replaced it changes nothing.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 (S1) replace reads written files' hits | DONE | `tests/routes/replace/ops-replace.test.ts       Tests  4 passed (4)`; `probe/first.mts` case 1 prints the hit with `"was":{"line":1,"at":9,"edited":true}` |
| 2 (S2) only the cap truncates, root reasons | DONE | `probe/first.mts` case8/10 prints `{"truncated":false,"total":1,"failed":[{"root":"claude","why":"timed-out",...},{"root":"gone","why":"failed","reason":"rg: boom"}]}`; `tests/server/files/search.test.ts       Tests  1 passed (1)` |
| 3 (S3) preview beside the Search view | DONE, look not taken | looks: cases 11 to 14 (the Search view in a pane, a split, a float); `npm run check` printed `COMPLETED 2774 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 4 (L1) build as task terminal, every refusal a word | DONE | `tests/routes/sessions/terminal-actions.test.ts       Tests  13 passed (13)` |
| 5 (L2) read after a build | DONE, look not taken | look: case 16 |
| 6 (L3) read on opening and on a change | DONE, look not taken | looks: cases 19 to 22 |
| 7 (L5) singular | DONE, look not taken | look: case 24 (`1 problem`, `1 error, 1 warning`) |
| 8 (L6) Open LaTeX on a never-expanded folder | DONE, look not taken | looks: cases 25 to 27 |
| 9 (L7) picture | DONE, look not taken | looks: cases 28 to 30 |
| 10 Docs | DONE | `LC_ALL=C grep -c '[^ -~]' HELP.md DESIGN.md` printed `HELP.md:0` and `DESIGN.md:0`; the greps of item 6 |
| Round 1, items 1 to 10 | DONE | the check named under each item |
| Round 1, item 11 | The change is DONE; no test reaches it | the mechanism run under item 11; the look named there |

### Verify list

Full-list runs after the last change: 2. The state file's verify list holds one command, `npm run test:quick`, and `npm run diagrams` ran before each. The first full run ended with `checks: failed with exit 1: npm run test:quick` because svelte-check reported `routes.ts 424:46 Argument of type '"outside" | "missing"' is not assignable to parameter of type 'Word'`. The `Word` type in `refusal.ts` now holds both words, `npm run check` printed `COMPLETED 2774 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `npm run test:quick` alone passed, and the full list ran once more. The second run printed:

```
$ npm run test:quick
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (1.9 s)
ok      eslint (1.8 s)
ok      svelte-check (7.2 s): 1791157259962 COMPLETED 355 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (13.9 s): Duration  11.17s (transform 20.63s, setup 0ms, import 32.75s, tests 10.71s, environment 65ms)
test:quick: 14.5 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
checks: 1 commands passed
```

Guarded test files, each run alone with `npx vitest run <file>` after the last code change (`scratchpad/guarded-run2.txt`; `grep -c failed` over it printed 0):

```
tests/routes/files/file-undo.test.ts       Tests  9 passed (9)
tests/routes/files/file.test.ts       Tests  1 passed (1)
tests/routes/files/history.test.ts       Tests  3 passed (3)
tests/routes/files/open.test.ts       Tests  2 passed (2)
tests/routes/files/project-files.test.ts       Tests  1 passed (1)
tests/routes/files/source.test.ts       Tests  3 passed (3)
tests/routes/replace/ops-replace.test.ts       Tests  4 passed (4)
tests/routes/sessions/compose.test.ts       Tests  4 passed (4)
tests/routes/sessions/latex.test.ts       Tests  1 passed (1)
tests/routes/sessions/terminal-actions.test.ts       Tests  13 passed (13)
tests/routes/sessions/terminal-edit.test.ts       Tests  1 passed (1)
tests/routes/sessions/terminal.test.ts       Tests  4 passed (4)
tests/server/edit/config-key.test.ts       Tests  2 passed (2)
tests/server/edit/config-value.test.ts       Tests  3 passed (3)
tests/server/files/fs.test.ts       Tests  1 passed (1)
tests/server/files/ops-paste.test.ts       Tests  5 passed (5)
tests/server/files/ops.test.ts       Tests  3 passed (3)
tests/server/files/search.test.ts       Tests  1 passed (1)
tests/server/git/untracked/trash.test.ts       Tests  2 passed (2)
tests/server/machine/commands/placeholders.test.ts       Tests  4 passed (4)
tests/server/machine/commands/run.test.ts       Tests  6 passed (6)
tests/server/machine/pty/channel.test.ts       Tests  3 passed (3)
tests/server/machine/pty/sessions.test.ts       Tests  1 passed (1)
tests/server/machine/pty/tmux.test.ts       Tests  1 passed (1)
tests/shell/panes/strip/tab-menu.test.ts       Tests  2 passed (2)
tests/state/client/terminal/terminal-close.test.ts       Tests  3 passed (3)
tests/state/forms/form-drafts.test.ts       Tests  3 passed (3)
tests/state/forms/manifest-draft.test.ts       Tests  3 passed (3)
tests/state/sessions/source.test.ts       Tests  2 passed (2)
tests/state/sources/repositories/diff/comment-draft.client.test.ts       Tests  1 passed (1)
```

The ASCII check over `src tests config` (excluding `local.yml`) printed nothing. `sh utils/unused-exports.sh` against `D37-base/unused-exports.txt`: `diff` printed `unused: no difference`.

## Files (diff -rq against the base copy; line counts base -> now)

```
69 ->       64  config/text/server.yml
      50 ->       55  config/text/views/academic/latex.yml
      80 ->       96  config/text/views/sessions/terminal.yml
      90 ->       92  config/text/views/sources/search.yml
     313 ->      329  src/lib/data/file-ops.ts
     511 ->      518  src/lib/data/model/index.ts
      58 ->       65  src/lib/data/model/model-search.ts
     802 ->      835  src/lib/data/model/model-sessions.ts
     379 ->      473  src/lib/server/files/fs/replace.ts
     493 ->      492  src/lib/server/files/search.ts
     104 ->      102  src/lib/server/machine/commands/placeholders.ts
      46 ->       51  src/lib/server/machine/commands/resolve.ts
     177 ->      169  src/lib/server/machine/commands/run.ts
     672 ->      675  src/lib/server/machine/pty/channel.ts
     158 ->      159  src/lib/server/machine/pty/edit.ts
     611 ->      628  src/lib/server/machine/pty/routes.ts
     762 ->      790  src/lib/server/machine/pty/sessions.ts
     744 ->      809  src/lib/state/sessions/latex.svelte.ts
     719 ->      726  src/lib/state/sessions/terminal/commands.svelte.ts
     197 ->      195  src/lib/state/sessions/terminal/pty/pty-io.ts
      68 ->       68  src/lib/state/sessions/terminal/terminal-payloads.ts
     819 ->      815  src/lib/state/sessions/terminals.svelte.ts
     135 ->      143  src/lib/state/shared/answers/answers.ts
     616 ->      636  src/lib/state/sources/explorer/ops.svelte.ts
     476 ->      479  src/lib/state/sources/repositories/repositories.svelte.ts
     181 ->      292  src/lib/state/sources/search/hits.ts
     458 ->      491  src/lib/state/sources/search/search.svelte.ts
     251 ->      299  src/lib/state/sources/search/search.ts
      67 ->       74  src/lib/state/workbench/layout/open/landing.ts
     299 ->      319  src/lib/state/workbench/layout/open/opening.ts
     496 ->      503  src/lib/ui/controls/editor/Editor.svelte
     222 ->      234  src/lib/ui/controls/editor/kit/latex/latex-widget.ts
     500 ->      499  src/lib/views/sessions/session-detail/SessionDetail.svelte
     319 ->      319  src/lib/views/sessions/session-list/SessionList.svelte
     189 ->      205  src/lib/views/shared/explorer/tree/control/picks.svelte.ts
     496 ->      499  src/lib/views/shared/explorer/tree/menu/row-menu.ts
     206 ->      212  src/lib/views/shared/latex/Main.svelte
      37 ->       47  src/lib/views/shared/latex/Rows.svelte
     322 ->      329  src/lib/views/sources/search/Results.svelte
     118 ->      140  tests/routes/replace/ops-replace.test.ts
     172 ->      173  tests/routes/sessions/compose.test.ts
     218 ->      339  tests/routes/sessions/terminal-actions.test.ts
     190 ->      210  tests/routes/sessions/terminal-fixture.ts
     146 ->      151  tests/routes/sessions/terminal.test.ts
     111 ->      106  tests/server/machine/commands/placeholders.test.ts
     155 ->      167  tests/server/machine/commands/run.test.ts
     143 ->      183  tests/server/machine/pty/channel.test.ts
new -> 68  src/lib/server/machine/pty/refusal.ts
new -> 55  src/lib/state/shared/answers/terminal-words.ts
```

Limits: largest source files `model-sessions.ts` 835 and `terminals.svelte.ts` 815 (limit 880); largest components `Editor.svelte` 503 and `SessionDetail.svelte` 499 (limit 520); `server/machine/pty` holds 10 files (limit 10). `HELP.md` is 348 lines and `DESIGN.md` 435 lines in the worktree.

## Judgment calls

1. A kept LaTeX build that is still running is answered unchanged by the server (nothing restarts); one that has ended is run again with `respawn-pane -k` in that terminal, with the command built now.
2. The page's `building` means a terminal seen listed with `exit === null`; a push that shows an old `exit` is settled by the fresh `readListed` in `confirm`.
3. A write's re-read is capped at `REREAD_MAX = 2000` hits per file; a file with more is reported as a failed re-read, so its row says "Search again to see this file's hits."
4. A validator error of the terminal route (a field of the wrong type) is the word `bad-terminal`; its field text no longer reaches the page. The sentences of the route no longer carry field detail.
5. A failed tmux call is `terminal-ended` when the terminal is no longer listed and `terminal-failed` when it still is.
6. `latex.problem_counts` is `'{0}, {1}'`, built from `error_one`/`errors_many` and `warning_one`/`warnings_many`; the disclosure label is `problem` when the total is 1.
7. A `files` message with no root marks nothing; a gap, or a root list not yet read, marks every held LaTeX state (brief change 10).
8. `Rows.svelte` carries one `eslint-disable-next-line @typescript-eslint/no-unused-expressions` (the read of `folder` is the effect's dependency), as `TreeView.svelte` and `TreeItem.svelte` carry theirs.

## Host- and user-visible changes (before -> after)

- Search, after a Replace: the hits left in a written file keep the old line and place and the next Replace is refused `changed` -> they are read from the file as written; each keeps what the reader dismissed unless the write changed its line; a failed read shows "Search again to see this file's hits".
- Search, a root that ran out of time: the cap note shows and the root is named with the others as "No answer from {roots}." -> no cap note; one line per failed root: "{root} ran out of time." or "No answer from {root}: ripgrep could not search it."
- Replace Preview: may land in the Search tab's own pane -> lands outside it (a new pane to its right when no other pane takes it).
- LaTeX build and clean: a plain shell terminal that vanishes with latexmk -> a task terminal that stays with its output and exit status, rerun in place by the next build of that main; a build first seen already ended ends at once.
- Terminal route refusals: tmux's or a validator's text -> a catalog sentence; a LaTeX build in a root nothing serves says "It is not inside a served root."; a start not listed says "The terminal did not start."; an empty command name says "The terminal request was not valid."
- LaTeX view: the folder state is read again on opening and on a `files` message under its root, and the read after a build reaches the server.
- Problems button: "1 problems" -> "1 problem"; counts "1 error, 1 warning".
- Row menu of a never-expanded folder: no Open LaTeX -> Open LaTeX when the folder holds a `.tex` file.
- Picture hover: an empty box -> the picture within 458 by 300 px; no box when it does not load.
- Format Document in a preview tab, then keeping the tab: the undo stack was lost -> kept (look not taken).

## Still true / rewritten

Rewritten: `HELP.md` (the LaTeX paragraph: terminals stay, `1 problem`, folder read on opening and on change, hover picture; the Search paragraph: hits after a Replace, failed roots lines, preview placement), `DESIGN.md` (Search paragraph: `failed` with `why`, `rereads`, preview landing; the pty bridge paragraph: refusal words, options in the `new-session` invocation; the LaTeX paragraph: task terminal, end of a build, reads on opening and on change); head comments of `search.svelte.ts`, `hits.ts`, `search.ts` (state), `file-ops.ts`, `replace.ts`, `latex.svelte.ts`, `landing.ts`, `opening.ts`, `routes.ts` (pty), `refusal.ts`, `answers.ts`, `commands.svelte.ts`, `latex-widget.ts`, `picks.svelte.ts`; the doc comment of `runSearch` and the comments of `row-menu.ts`; the doc comments of `TerminalJob`, `Terminal.task`, `Terminal.job` and `StartRequest.task`.

Read and left as they were (still true): the head comments of `server/files/search.ts`, `Results.svelte` and `Main.svelte`, and the `HELP.md` paragraph on the replace text rules.

The stale-phrase grep over `src tests HELP.md README.md DESIGN.md` for "left the (terminals) list" and "server's own sentence": the matches that described the old behaviour (`latex.svelte.ts` `Stop waiting once the terminal has ended`, `sessions.ts` task doc comment, `terminals.svelte.ts` refusal doc comment, `model-sessions.ts` task comments) were rewritten; the remaining matches are about tooltips, mail and a view's account list.

## Brief items that were wrong or impossible

- Case 34 has no guarded entry, so it has no test; its proof is `ranCommand` in `commands.svelte.ts` and the look.
- Item 11's test cannot be written as the brief describes (see item 11).
- `HELP.md` and `DESIGN.md` are absent from the base copy, so their line counts have no base column.

## Tests added or changed

Added in the first round (G35, `tests/routes/sessions/terminal-actions.test.ts`): `builds again in the terminal it kept, and cleans in another` and the `POST /api/terminal, a refusal` table; their failing lines on the unchanged tree are in the first-run section above.

Added in this round:

- `terminal-actions.test.ts`, two rows of the refusal table: a start whose session was not listed (`terminal-not-started`) and a `latex` action in a root nothing serves (`outside`); failing lines under item 8.
- `tests/server/machine/commands/run.test.ts`, `a command action that names no command` (3 cases); failing line under item 9.
- `tests/server/machine/pty/channel.test.ts`, `changes when a task terminal ends with the status it had, in a process run again`; failing line under item 2.

Changed existing assertions (before -> after): the first round's changes to `terminal-actions.test.ts`, `terminal.test.ts`, `compose.test.ts`, `terminal-fixture.ts` and `placeholders.test.ts` stand (the `started[...]` reads became `lineOf(started)`, the `CATALOG` argument was removed). In this round `ops-replace.test.ts` `replaces the second of two matches on one line and leaves the first`: `was: { line: 1, at: 0 }` -> `was: { line: 1, at: 0, edited: true }`, because the first hit's line holds the replaced second match. No assertion was loosened.

## History-word grep on added comments and test titles

`grep -inE '\b(previously|formerly|used to|no longer|instead of|reverted|legacy|old |fixed|bug|regress|originally|until recently)\b'` over the added lines of the src, tests and config diff: the matches are the ordinary words "before", "again", "was" and "no longer" in sentences about the data (for example "the place it had before the write", "a terminal tmux no longer has"); none says when a line was written, what was tried or what bug came before it.

## Grep quote after renames

`grep -rnE "resumeRefusal|failed_roots|COMMAND_ACTIONS|capture_unlisted|server\.commands\.(no_file|no_selection|nul|source)" src tests config HELP.md DESIGN.md --exclude=local.yml` prints nothing (exit status 1). `configFor` still appears in the route options of `terminal`, `commands` and `chat`; only `CommandRunOptions.configFor` was removed.

