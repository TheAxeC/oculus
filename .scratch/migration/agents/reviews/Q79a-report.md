# Q79a report

NOT done: the verify list's single run did not end with `verify: 6 commands passed`. It stopped red on its first command, `npm test`, with six cases timing out at the 5 s limit while the machine's load average was 12.65 to 14.75 (`uptime`, taken just after the run) from the concurrent Q79c builder. The five commands the runner did not reach were run by hand afterwards and each exits 0. Everything else in the brief is built.

## Open items (verbatim from the main checkout's orchestrator-state.md, lines 105 to 120, read only)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z40, what the Terminal view is (raised 2026-09-28, from Axel's look: "the side panel thingy for terminals are also kind of different panels? Maybe this is just a design mismatch?"). Seen on TEST: every terminal is a tab of its own (`8e90e6-shell`, `6bcd37-shell`), and every Terminal tab also draws a list of all terminals on its right (`views/sessions/terminal/TerminalList.svelte`, from two terminals on, `terminal-list.ts:72`); New terminal in the right pane opened its start form as a new tab in the left pane. So one terminal is both a tab somewhere and a row in each Terminal tab's list: two ways to the same thing, mixing VS Code's terminal panel (one panel, a list of terminals on its right, New terminal adds a row) with VS Code's terminal in the editor area (a tab per terminal, no list). Options:
  - (a) The panel: one Terminal tab holds every terminal; its list switches the terminal the tab shows; New terminal adds a row to this tab and shows it; Split divides this tab's body between two terminals, as VS Code's split does; a terminal is no longer a tab of its own, and the pin goes. Pros: one place for terminals, as Q89 set out to draw VS Code's terminal panel. Cons: two terminals side by side in different panes of a page are no longer possible outside Split.
  - (b) The editor tab: every terminal is a tab of its own, the list goes, New terminal opens a tab in the pane it was pressed in. Pros: panes place terminals freely. Cons: no list of terminals beside them; the Sessions view is the overview.
  - (c) Keep both. This is the lazy option.
  - Recommended (a): it is what Q89 was for, and the tab-per-terminal is the part that doubles it.
- Z41, typed `;` and Return lost or late in a terminal (raised 2026-09-28, from the look of Axel's report). Through the Chrome tool on TEST, `echo x;echo y` arrived as `echo xecho y`, every `;` of a longer line was dropped, and a Return ran its line tens of seconds late. The server keeps one terminal's input in order (`server/machine/pty/channel.ts:370-377`) and a quoted `;` passes a scratch tmux control client whole (`a;b;c;;d` arrived as sent), so no cause is found, and the tool's synthetic key events may be the cause. What would settle it: Axel types `echo a;b` and Return by hand in a shell on the TEST page. If `;` is lost by hand too, the cause is found by reading xterm's key handling for that key and booked into Q99.

- Z42, the Calendar's sticky strips over a wallpaper (raised 2026-09-28, from Q92's landing look). Over a wallpaper theme the week and day views' header row and the list view's date headings stay put while the rows scroll under them, and those rows show through them (seen under tokyo night on TEST: the hour label 06:00 behind the day headings, "Leerlabo violet 10" behind "Tuesday, September 29, 2026"). Two checks decide what may paint there: `tests/ui/colours.test.ts` allows a colour mix only as `background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent)`, and `tests/views/whole/tinted.test.ts` counts that same declaration as a surface of the view's own, which a view that asks the pane for its tint may not have. The Calendar asks for the tint, since its cells paint nothing. So the strips are transparent with the wallpaper blur (2 px), which does not hide text. The library draws the header and the rows in one scrolling grid (`.ec-main`, `overflow: auto`, the header `position: sticky` over subgrid rows), so the rows cannot be moved out from under the header without breaking the columns. Options:
  - (a) `tinted.test.ts` lets a sticky strip carry the pane's wall mix: a rule whose selector names only strips that stay in place over scrolling content is not counted as a surface of the view's own. The strips then cover the rows as they do under a plain theme, one step darker than the pane. Recommended: it is the one option that ends the show-through, and the tint rule's purpose (text never straight on the picture, one translucent layer per surface) still holds.
  - (b) The Calendar stops asking for the tint and paints its own surfaces with the wall mix: the head rows, the grid box and the footer, with the strips over the grid box. More rules, and the strips still double over the grid box as in (a).
  - (c) Keep the strips transparent with the blur, the rows readable under them (the lazy option).

## The cases' first run (against the unchanged tree, before any source change)

- tests/server/root/hooks-server.test.ts, "the origin guard on /api/": the foreign-Origin 403 case and the cross-site request with no Origin were red; the same-origin, `none`, own-host, neither-header and callback cases were green. The encoded-address case (`/%61pi/fs` with an evil Origin gives 403) was red.
- tests/server/root/hooks-server.test.ts, "the configuration a route reads": both cases red (the search caps after a `max_hits` edit, and the mail callback words after an `inbox.yml` edit).
- tests/server/core/auth.test.ts: the three `sameOrigin` cases, the gatedBody case "reads the body of a write with neither origin header that carries the token", and the JSON-answer shape case were red; "refuses a write with neither origin header and no token" was green.
- The sameValue cases (now in tests/server/edit/yaml-edit.test.ts), the new text-kind cases, the refresh.test.ts escape cases and the first new server-args case: green on the unchanged tree. They hold rules the change must keep, so green first is their purpose.
- tests/checks/bin/migrate-joint-work.test.ts, "writes a note holding a line break, a colon and a quote so it reads back unchanged": red.

Cases written after the source change, so never run against the unchanged tree; what turns each red is in the Verify section below: tokenedBody and unconfirmed (auth.test.ts), the typed-argument case (server-args.test.ts), readArgs (cited-lines.test.ts), the command-line case (migrate-joint-work.test.ts), rootsOf (rename-pillar.test.ts), the handed-back refusal (diagrams.test.ts), and the engine-without-configuration case (deposit.test.ts).

## What to build, one row per item

| # | Built at | Proof |
|---|---|---|
| 1 | Every server answer is kit `json(body, { status, headers })`; the local helpers are gone, and `actions.ts`'s exported json among them. `src/lib/server/machine/lines.ts:301` (was `Response.json`) is the same. | `grep -rn "new Response(JSON.stringify" src \| wc -l` prints 0; `grep -rn "application/json" src/lib/server src/routes src/hooks.server.ts` prints only `connect/api.ts:79` (an outbound request) and `files.ts:53` (a file type) |
| 2 | `sameOrigin(headers, host)` at `src/lib/server/core/auth.ts:46`; the guard at `src/hooks.server.ts:55` (`refused` at :32, `routePath` at :22, `UNGUARDED` at :15 with its reason); DESIGN.md "Auth" at :146; auth.ts head comment :1-17 | `grep -rn "sameOrigin(" src \| grep -v "export function"` prints only `src/hooks.server.ts:36: return !sameOrigin(headers, headers.get('host') ?? '');` |
| 3 | Routes read `locals.config().config`; modules take it as an argument; `ServerContext.config` removed from the type and the literal (`src/lib/server/root/context.ts`); DESIGN.md :232 states the rule | `grep -rn "locals.server.config" src \| wc -l` prints 0; `grep -rn "loadConfig(" src` prints hooks.server.ts:61 (the `locals.config` read itself), context.ts:205 (start read, comment :202-204), context.ts:283 (git watcher's roots, comment :276-279), watch/portfolio.ts:289 (comment :287-288), merge.ts:109 (the definition) |
| 4 | `isDeepStrictEqual` in yaml-edit.ts (:16, sameValue, both verifiers), deck-edit.ts:51-52, entry-edit/entries.ts and entry-edit/lines.ts; `deepEqual` and `same` removed | `grep -rn "deepEqual\b" src` prints nothing; sameValue's null rule kept and tested |
| 5 | `src/lib/data/helpers/text-kind.ts:36` | `grep -n "AFTER\|sequenceLength\|follows" src/lib/data/helpers/text-kind.ts` prints nothing; the text-kind tests pass unchanged |
| 6 | `src/lib/server/root/args.ts:44` (`tokens: true`, `strict: false`), `bin/cited-lines.mjs:40`, `bin/migrations/migrate-joint-work.mjs:452`, `bin/migrations/rename-program-to-pillar.ts:92` | server-args.test.ts 13 passed, every earlier case unchanged |
| 7 | `src/lib/server/machine/usage/refresh.ts:106,120,125` (`stripVTControlCharacters`), :146 (`delay` from node:timers/promises); the eslint-disable line went with the regex | `npx vitest run tests/server/machine/usage` 47 passed |
| 8 | `bin/migrations/migrate-joint-work.mjs:322` `fileText`, :338 `stringify(doc, ...)`; `quoted`, `line` and the four `*Block` builders removed | Old and new scripts over one scratch hub: parsed output deep-equal and key order equal for people.yml, organisations.yml and joint-work.yml (`node -e` compare printed `true true true` three times); the second-run byte check in the test passes |

### Verify, as the brief lists it

1. `sh /Users/axelfaes/.claude/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, run once from tools/oculus in the worktree, printed:
   ```
   RED: npm test
   exit status: 1
   ...
    Test Files  5 failed | 339 passed (344)
         Tests  6 failed | 5411 passed (5417)
   ```
   The six are `Error: Test timed out in 5000ms.`: tests/server/git/git-ops.test.ts "routes each action to its own operation with its own fields", tests/checks/imports/cycles.test.ts "names the modules of a planted cycle in order...", tests/checks/imports/augments.test.ts "is named for a block that adds to a module of a folder above its own", tests/checks/tree/boundaries.test.ts "catches a shell file reading a store the shell may not read", and two of tests/server/core/git.test.ts's "read only" cases.
   - git-ops.test.ts is a file this step touched (its `engine:` became `config:`); alone it gives `Tests 37 passed (37)` (`npx vitest run tests/server/git/git-ops.test.ts`).
   - cycles, augments, boundaries and core/git.test.ts: untouched files, timeouts under load.
   - The runner stops at the first red command, so these were run by hand after it, each read by its own exit: `npm run check` 0 (`COMPLETED 1445 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`), `npm run build` 0, `npm run format:check` 0 (`All matched files use Prettier code style!`), `npm run lint` 0, `! LC_ALL=C grep -rna '[^ -~]' src tests` 0.
2. `grep -rn "new Response(JSON.stringify" src | wc -l` prints `0`.
3. `grep -rn "sameOrigin(" src | grep -v "export function"` prints only `src/hooks.server.ts:36:    return !sameOrigin(headers, headers.get('host') ?? '');`.
4. `grep -rn "locals.server.config" src | wc -l` prints `0`; the `loadConfig(` reads left are in row 3 above, each with its comment.
5. `npm run diagrams` exits 0 (`exit 0` printed after it). The committed diagrams match the source: tests/checks/diagrams 68 passed.
6. The code change whose undoing turns each new case red:
   - Origin guard cases (hooks-server.test.ts): the `if (refused(event)) return json(...)` line at hooks.server.ts:55. The foreign-Origin and cross-site cases were red on the unchanged tree. The encoded case goes red when `routePath` judges `event.url.pathname` instead of the route id: that mutation gave `Tests 1 failed | 13 passed`.
   - Configuration cases (hooks-server.test.ts): `locals.config().config` in `routes/api/(files)/search/+server.ts` and in the mail callback route. Both were red on the unchanged tree.
   - sameOrigin cases (auth.test.ts): the new rule at auth.ts:46. The three were red against the old `sameOrigin(request, host)`, which refused a request with no Origin.
   - gatedBody token case: the origin check removed from gatedBody. It was red on the unchanged tree.
   - JSON-answer shape case: red on the unchanged tree, where gatedBody answered the origin refusal first. It pins that kit `json()` gives the status, body and content type a hand-built answer did. Undoing kit `json()` back to a hand-built Response does not turn it red, since the two are meant to be equal.
   - tokenedBody and unconfirmed cases: the two functions at auth.ts:79 and :99, and the words and headers they answer.
   - sameValue cases: sameValue's absent-equals-null line at yaml-edit.ts. The swap to isDeepStrictEqual is not what they catch, since the old deepEqual passes them too.
   - text-kind cases: `{ stream: cut }` at text-kind.ts:36. Changing it to `{ stream: false }` gave `Tests 3 failed | 8 passed`.
   - refresh.test.ts escape cases: `stripVTControlCharacters` at refresh.ts:106. Reading the raw screen gave `Tests 1 failed | 25 passed`.
   - server-args typed-argument case: `argv[token.index]` in args.ts. Naming `token.rawName` instead gave `1 failed | 12 passed` (`-abc` would be named `-a`).
   - cited-lines readArgs cases: the strict `parseArgs` at cited-lines.mjs:40. The old readArgs, run with node over the main checkout's file, returns `{"root":null,"report":"--bogus"}` and `{"root":"/s","report":"--root=/r"}`, which the cases refuse.
   - migrate-joint-work note case: `fileText`'s `stringify`. It was red on the unchanged tree.
   - migrate-joint-work command-line case: the strict `parseArgs` at :452. The old `options()` took `--bogus` and `--self-key` with nothing after it as a run, exit 0.
   - rename rootsOf case: `rootsOf` at rename-program-to-pillar.ts:90.
   - The diagram's handed-back refusal case: the `instanceof Response` branch of `refusals()` in bin/diagrams/writes.mjs. Disabling it gave `Tests 3 failed | 44 passed`.
   - deposit engine-without-configuration case: `hubTarget`'s requirement of both engine and config in deposit.ts.

## Files, lines before and after

- Before is the base this worktree started from. For 110 files that is the main checkout's copy, which equals the Q79c worktree's.
- The main checkout's working tree carries another package's uncommitted, staged edits: calendar, connect, mail, context.ts, DESIGN.md and the layer diagrams. The Q79c builder is editing docs.ts and docs.test.ts. For the ten files where all three copies differ, the base taken is the copy nearer to this worktree's, whichever of main and Q79c that is. No git command reads the base exactly.
- Measured with `wc -l` and `diff | grep -c '^<'` / `'^>'` per file.
- src: 12093 before, 12067 after. 941 lines removed, 915 added.
- bin: 1259 before, 1360 after. 108 removed, 209 added. The two parseArgs readers, the typed JSDoc of cited-lines.mjs, the migration's `fileText` and the diagram's second refusal form are the growth.
- tests: 14831 before, 15128 after. 490 removed, 653 added.
- docs and DESIGN.md: 956 before, 959 after.
- All 120 files: 29139 before, 29514 after. 1559 lines removed and 1800 added in all. tests/server/core/auth.test.ts (new) is counted as 0 before.

| File | Before | After | Removed | Added |
|---|---|---|---|---|
| bin/cited-lines.mjs | 165 | 190 | 12 | 37 |
| bin/diagrams/writes.mjs | 516 | 556 | 9 | 49 |
| bin/migrations/migrate-joint-work.mjs | 470 | 491 | 85 | 106 |
| bin/migrations/rename-program-to-pillar.ts | 108 | 123 | 2 | 17 |
| DESIGN.md | 320 | 322 | 2 | 4 |
| docs/diagrams/layer-server.dot | 149 | 149 | 7 | 7 |
| docs/diagrams/layer-state.dot | 158 | 158 | 1 | 1 |
| docs/diagrams/layer-views.dot | 139 | 139 | 2 | 2 |
| docs/diagrams/layers.dot | 75 | 75 | 6 | 6 |
| docs/diagrams/writes.dot | 115 | 116 | 2 | 3 |
| src/hooks.server.ts | 41 | 79 | 1 | 39 |
| src/lib/data/helpers/text-kind.ts | 74 | 41 | 50 | 17 |
| src/lib/server/accounts/calendar/routes.ts | 72 | 73 | 10 | 11 |
| src/lib/server/accounts/connect/actions.ts | 306 | 306 | 16 | 16 |
| src/lib/server/accounts/connect/setup.ts | 83 | 79 | 16 | 12 |
| src/lib/server/accounts/mail/routes.ts | 177 | 178 | 19 | 20 |
| src/lib/server/content/diagrams.ts | 60 | 58 | 4 | 2 |
| src/lib/server/content/docs.ts | 466 | 473 | 22 | 29 |
| src/lib/server/content/images.ts | 362 | 346 | 21 | 5 |
| src/lib/server/content/latex.ts | 357 | 351 | 17 | 11 |
| src/lib/server/content/memories.ts | 191 | 175 | 46 | 30 |
| src/lib/server/content/wallpaper.ts | 109 | 108 | 15 | 14 |
| src/lib/server/core/auth.ts | 89 | 128 | 24 | 63 |
| src/lib/server/core/changes.ts | 248 | 239 | 11 | 2 |
| src/lib/server/edit/deck-edit.ts | 73 | 69 | 7 | 3 |
| src/lib/server/edit/entry-edit/entries.ts | 308 | 309 | 6 | 7 |
| src/lib/server/edit/entry-edit/lines.ts | 377 | 377 | 2 | 2 |
| src/lib/server/edit/writes.ts | 533 | 546 | 64 | 77 |
| src/lib/server/edit/writes/subtasks.ts | 252 | 257 | 8 | 13 |
| src/lib/server/edit/writes/undo.ts | 303 | 303 | 2 | 2 |
| src/lib/server/edit/yaml-edit.ts | 734 | 722 | 17 | 5 |
| src/lib/server/files/files.ts | 311 | 291 | 25 | 5 |
| src/lib/server/files/fs.ts | 562 | 565 | 42 | 45 |
| src/lib/server/files/open.ts | 374 | 362 | 25 | 13 |
| src/lib/server/files/project-files.ts | 214 | 207 | 24 | 17 |
| src/lib/server/files/search-routes.ts | 64 | 64 | 16 | 16 |
| src/lib/server/files/source.ts | 163 | 149 | 36 | 22 |
| src/lib/server/git/deposit-routes.ts | 204 | 213 | 48 | 57 |
| src/lib/server/git/deposit.ts | 802 | 806 | 3 | 7 |
| src/lib/server/git/git-reads.ts | 154 | 148 | 22 | 16 |
| src/lib/server/git/git-routes.ts | 300 | 287 | 42 | 29 |
| src/lib/server/machine/hpc/routes.ts | 32 | 31 | 8 | 7 |
| src/lib/server/machine/lines.ts | 306 | 302 | 8 | 4 |
| src/lib/server/machine/pty/chat.ts | 127 | 127 | 4 | 4 |
| src/lib/server/machine/pty/compose.ts | 237 | 230 | 11 | 4 |
| src/lib/server/machine/pty/routes.ts | 490 | 518 | 64 | 92 |
| src/lib/server/machine/usage/refresh.ts | 342 | 335 | 13 | 6 |
| src/lib/server/machine/usage/routes.ts | 25 | 24 | 8 | 7 |
| src/lib/server/root/args.ts | 66 | 66 | 12 | 12 |
| src/lib/server/root/context.ts | 429 | 430 | 2 | 3 |
| src/lib/server/root/hooks.ts | 271 | 261 | 28 | 18 |
| src/lib/server/root/watch/portfolio.ts | 403 | 405 | 0 | 2 |
| src/lib/server/sessions/stores/customizations.ts | 455 | 455 | 16 | 16 |
| src/lib/server/sessions/transcript-routes.ts | 143 | 137 | 14 | 8 |
| src/routes/api/(accounts)/calendar/callback/+server.ts | 24 | 26 | 4 | 6 |
| src/routes/api/(accounts)/mail/+server.ts | 34 | 34 | 1 | 1 |
| src/routes/api/(accounts)/mail/callback/+server.ts | 24 | 26 | 4 | 6 |
| src/routes/api/(docs)/diagrams/[name]/+server.ts | 9 | 9 | 2 | 2 |
| src/routes/api/(docs)/docs/+server.ts | 20 | 20 | 1 | 1 |
| src/routes/api/(docs)/memories/+server.ts | 15 | 19 | 4 | 8 |
| src/routes/api/(docs)/wallpaper/+server.ts | 12 | 11 | 3 | 2 |
| src/routes/api/(files)/file/[root]/[...path]/+server.ts | 21 | 22 | 11 | 12 |
| src/routes/api/(files)/fs/+server.ts | 39 | 41 | 18 | 20 |
| src/routes/api/(files)/open/+server.ts | 20 | 22 | 7 | 9 |
| src/routes/api/(files)/project-files/+server.ts | 8 | 8 | 1 | 1 |
| src/routes/api/(files)/search/+server.ts | 21 | 22 | 3 | 4 |
| src/routes/api/(files)/source/+server.ts | 17 | 25 | 4 | 12 |
| src/routes/api/(git)/changes/+server.ts | 14 | 17 | 1 | 4 |
| src/routes/api/(git)/deposit/+server.ts | 20 | 24 | 6 | 10 |
| src/routes/api/(git)/git/+server.ts | 21 | 23 | 8 | 10 |
| src/routes/api/(machine)/hpc/+server.ts | 16 | 16 | 1 | 1 |
| src/routes/api/(machine)/lines/+server.ts | 10 | 10 | 3 | 3 |
| src/routes/api/(sessions)/hook/+server.ts | 17 | 17 | 2 | 2 |
| src/routes/api/(sessions)/terminal/+server.ts | 28 | 26 | 6 | 4 |
| src/routes/api/write/+server.ts | 14 | 19 | 2 | 7 |
| tests/checks/bin/cited-lines.test.ts | 127 | 148 | 0 | 21 |
| tests/checks/bin/migrate-joint-work.test.ts | 149 | 188 | 0 | 39 |
| tests/checks/bin/rename-pillar.test.ts | 103 | 114 | 0 | 11 |
| tests/checks/diagrams/diagrams.test.ts | 838 | 862 | 1 | 25 |
| tests/checks/tree/allow-duplication.txt | 672 | 662 | 10 | 0 |
| tests/data/helpers/text-kind.test.ts | 93 | 118 | 0 | 25 |
| tests/routes/docs/diagrams.test.ts | 106 | 93 | 19 | 6 |
| tests/routes/docs/docs.test.ts | 466 | 446 | 20 | 0 |
| tests/routes/docs/memories.test.ts | 357 | 333 | 44 | 20 |
| tests/routes/docs/wallpaper.test.ts | 191 | 174 | 38 | 21 |
| tests/routes/edit/audit-mute.test.ts | 246 | 248 | 0 | 2 |
| tests/routes/edit/write-fixture.ts | 233 | 248 | 4 | 19 |
| tests/routes/edit/write.test.ts | 706 | 697 | 11 | 2 |
| tests/routes/files/file.test.ts | 318 | 293 | 56 | 31 |
| tests/routes/files/fs.test.ts | 449 | 422 | 28 | 1 |
| tests/routes/files/open.test.ts | 522 | 523 | 2 | 3 |
| tests/routes/files/project-files.test.ts | 99 | 90 | 9 | 0 |
| tests/routes/files/search.test.ts | 224 | 214 | 10 | 0 |
| tests/routes/files/source.test.ts | 374 | 368 | 12 | 6 |
| tests/routes/git/changes.test.ts | 120 | 110 | 13 | 3 |
| tests/routes/git/git.test.ts | 580 | 542 | 41 | 3 |
| tests/routes/machine/hpc.test.ts | 42 | 41 | 9 | 8 |
| tests/routes/machine/lines.test.ts | 43 | 36 | 14 | 7 |
| tests/routes/sessions/hook.test.ts | 93 | 85 | 8 | 0 |
| tests/routes/sessions/latex.test.ts | 106 | 99 | 12 | 5 |
| tests/routes/sessions/terminal-actions.test.ts | 622 | 599 | 33 | 10 |
| tests/routes/sessions/terminal-fixture.ts | 190 | 201 | 1 | 12 |
| tests/routes/sessions/terminal.test.ts | 271 | 301 | 8 | 38 |
| tests/routes/sessions/transcript.test.ts | 209 | 201 | 8 | 0 |
| tests/server/accounts/connect/oauth.test.ts | 370 | 360 | 11 | 1 |
| tests/server/accounts/mail/routes.test.ts | 379 | 369 | 11 | 1 |
| tests/server/core/changes.test.ts | 512 | 503 | 15 | 6 |
| tests/server/edit/writes.test.ts | 491 | 504 | 4 | 17 |
| tests/server/edit/yaml-edit.test.ts | 525 | 547 | 1 | 23 |
| tests/server/git/deposit.test.ts | 646 | 654 | 4 | 12 |
| tests/server/git/git-ops.test.ts | 792 | 792 | 2 | 2 |
| tests/server/machine/pty/compose.test.ts | 363 | 359 | 6 | 2 |
| tests/server/machine/usage/refresh.test.ts | 541 | 539 | 13 | 11 |
| tests/server/root/context-fixture.ts | 105 | 104 | 2 | 1 |
| tests/server/root/hooks-server.test.ts | 92 | 315 | 2 | 225 |
| tests/server/root/server-args.test.ts | 115 | 137 | 0 | 22 |
| tests/server/root/watch/portfolio.test.ts | 895 | 898 | 0 | 3 |
| tests/server/sessions/stores/customizations.test.ts | 248 | 249 | 4 | 5 |
| tests/views/system/history.test.ts | 208 | 208 | 4 | 4 |
| tests/server/core/auth.test.ts | 0 | 134 | 0 | 134 |

## Judgment calls

- The guard judges the route Kit matched (`event.route.id`, `(group)` segments stripped), not `event.url.pathname`. Kit decodes the path before matching, so `/%61pi/fs` reaches the fs route while its raw path does not start with `/api/`. A request that matches no route has a null id and is not judged. Kit answers such a request 404 itself.
- The brief's JSON-answer case was to compare the `{ error: 'origin' }` answer of changes.ts. Item 2 removes that answer, so the case compares gatedBody's surviving 403 and 400 answers.
- Per-route origin cases in 19 route and server test files were removed or narrowed to what the route still decides. The guard's own cases in hooks-server.test.ts replace them.
- terminal-actions.test.ts's case "the caller hands it no config" was removed, since `configFor` is now required and has no fallback.
- files.ts's `roots()`, which had no caller in src in main either, was removed. file.test.ts builds the roots with `rootsFrom(configuredRootsOf(...), loadLocalOrDefaults(...).hub, engine)`.
- WriteTarget gained `career: CareerRules` (`careerRules(merged)` in subtasks.ts), so writeHost and undo take the career rules from the request's configuration rather than reading the disk.
- DepositOptions gained `config`. `hubTarget` refuses an engine without one, and knownIds takes it.
- GitOptions' `engine` became `config`, since the commit-message suggestion was the only reader of it.
- A `NO_STORE = { 'cache-control': 'no-store' }` constant is used per file where answers carried that header.
- Kit's `json()` sets `content-type: application/json` and a `content-length`.
- The token-then-JSON refusal and the confirm refusal were copied across seven route modules. tests/checks/tree/duplication.test.ts flagged them once item 1 lined their windows up. They were folded into `tokenedBody` and `unconfirmed` in core/auth.ts instead of being listed. Ten stale entries left tests/checks/tree/allow-duplication.txt.
- The two write-target builders of tests/routes/edit/write-fixture.ts and tests/server/core/changes.test.ts were folded into `targetOver` for the same reason.
- The diagram's refusal reader (bin/diagrams/writes.mjs) read the old status-first `json(4xx, ...)`. It now reads a 4xx `status` in kit's options argument, and the `instanceof Response` hand-back of `tokenedBody`. The write diagram now labels writes.ts's refusal edge to auth.ts `tokenedBody`, where it said `hasToken, sameOrigin`.
- The mail and calendar callback routes read the configuration once into `config`. `textCatalog(locals.config().config)[...]` is not a form tests/checks/source/keys.test.ts reads as a catalog key reader.
- The text sniff is stricter at the window's edge. The old loop accepted any lead byte cut at the window when the file went on. The decoder in stream mode still refuses a cut sequence whose bytes so far are already invalid, for example `0xE0 0x80`.
- The migration writes flow lists with the yaml library's padding (`[ "a", "b" ]`), and tags and related ids now double-quoted. Keys, order and values are unchanged. An empty entry list is written `entries: []` where it was `entries:` with nothing, which read back as null.
- The migration and cited-lines.mjs refuse a flag they do not know, and a string flag with nothing after it, with their usage and exit 2. Before, the migration read such a word as the hub and cited-lines read it as the report. The migration's usage line and head comment now list `--self-role` and `--self-affiliation`.
- rename-program-to-pillar.ts refuses any flag with its usage. A word after `--` is a root.
- Three JSON-string comparisons were left as they are: `rail.ts:77`, `audit-mute.ts:52` and `connect/rows.ts:178`. The side they build may carry optional fields set to undefined, which JSON drops and `isDeepStrictEqual` does not, so the swap could refuse a valid edit. The publish dedupes in `config-seed.ts`, `watch/git.ts` and `watch/sessions.ts` compare what goes on the wire, which is JSON.
- The sameValue cases went into tests/server/edit/yaml-edit.test.ts, where yaml-edit's concern lives, rather than a new file.
- tests/views/system/history.test.ts's upstream-refusal case now uses the token refusal's sentence. The guard's refusal is the word `forbidden`, which the page would show inside `history.refused`. It is only reachable from another origin, never from the page itself.

## Host-visible changes, before and after

After: the built server (`npm run build`, then `HOME=<scratch> node src/server.ts --engine <scratch engine>`), port 8796, over a scratch engine (config/ copied without local.yml, a scratch local.yml with every state path under scratch, no accounts, an unreachable hpc_host) and a scratch hub. It was stopped with `kill`, and a curl afterwards got no connection (`000`). Before: the main checkout's code, read (not run), with the first-run cases above.

| Request | Before | After (curl on the build) |
|---|---|---|
| `GET /api/changes`, no headers | 403 `{"error":"origin"}` (auth.ts's old sameOrigin refused a request with no Origin) | 200 `{"changes":[],"page":50}` |
| `GET /api/fs`, no headers | 403 (fs.ts's own check) | 200, the workspaces |
| `GET /api/git?root=<hub>`, no headers | 403 (git-reads.ts's own check) | 400 `not a git repository`: the route answered |
| `GET /api/changes`, `Origin: http://evil.example` | 403 `{"error":"origin"}` | 403 `{"error":"forbidden"}` |
| `GET /%61pi/changes`, evil Origin | 403 from the route's own check | 403 `{"error":"forbidden"}` from the guard |
| `GET /api/changes`, `Sec-Fetch-Site: cross-site`, no Origin | 403 | 403 `{"error":"forbidden"}` |
| `GET /api/changes`, `Sec-Fetch-Site: same-origin` + evil Origin | 200 | 200 |
| `GET /api/changes`, `Origin: http://localhost:1234` | 200 | 200 |
| `GET /api/calendar/callback?state=nope`, provider Origin, cross-site | 400 page (no origin check) | 400 page "That link was not recognised. Press Connect again in the Calendar view." |
| `GET /api/mail/callback?state=nope`, provider Origin, cross-site | 400 page | 400 page, the Inbox sentence |
| `POST /api/hook`, no headers | 200 `{"ok":true}` | 200 `{"ok":true}` |
| `POST /api/hook`, evil Origin | 403 `{"error":"the request did not come from this machine"}` | 403 `{"error":"forbidden"}` |
| `POST /api/hook`, `Sec-Fetch-Site: cross-site`, no Origin | 200 (hooks.ts checked Origin only) | 403 by the rule at auth.ts:50 (not curled) |
| `POST /api/hook`, `Sec-Fetch-Site: same-origin` + evil Origin | 403 | admitted by the rule at auth.ts:48 (not curled) |
| Search after `behavior.yml` `search.max_hits` 500 to 1, no restart | still 3 hits: the cap came from `locals.server.config`, read at start | `total: 1, truncated: True`; edited back to 500, `total: 3, truncated: False`, same pid 27944 |
| Mail callback after `inbox.yml` `callback_bad` edited, no restart | the start copy's sentence | `<p>Edited on disk while the server ran.</p>` |

The same per-request read now reaches the hpc, mail, fs, open, source, file, deposit, git, terminal, hook, write, changes, docs, project-files, memories and wallpaper routes, and hooks-server.test.ts covers the first two cases. Only search and the mail callback were curled.

## Limitations and notes for landing

- The verify run is red on timeouts only. At load 12 to 15 it needs a second run once the concurrent builder is done.
- Merge overlap with work in flight: the main checkout's staged edits touch context.ts, calendar/routes.ts, connect/actions.ts, DESIGN.md and the layer diagrams, which this step also edits. Q79c's brief names docs.ts and docs.test.ts, which this step edits too, for the json form and the origin cases. The cherry-pick may conflict in those files.
- The spec rule that every id is exercised empty, duplicated and colliding: the ids here are the two unguarded paths, a fixed list, and the command-line flags. Their empty and repeated forms are cased (`--engine=`, two `--engine`, two `--root`).
- No dependency added. The node built-ins and yaml's own `stringify`/`Document` do the work.
