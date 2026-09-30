Everything in the brief is done.

Outside the section, nothing is made false while the section is unbuilt. Two sentences will need an exception in the build step that writes the store: DESIGN.md:140 ("the value the file held and the value written") and DESIGN.md:360 ("the value on either side of each write") describe a change record that holds both values, and a store write's record holds the sizes with the values under `~/.oculus/app-data/.undo/` (DESIGN.md:311). They describe the code as it is, so they are left as they are; the section states the difference at line 311.

# E2 report, the apps section of DESIGN.md rewritten to Axel's rulings

## Open items of the state file (`tools/oculus/.scratch/migration/orchestrator-state.md` in this worktree, section "Open items", lines 104 and 106, verbatim)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z97, the looks are stuck: the Chrome window the looks run in is minimised (raised 2026-09-30 15:50; Axel asked for an open item whenever the looks are stuck). A new tab on `http://localhost:8790/` opens in the window of the Claude tab group; in it `document.visibilityState` reads "hidden", `window.outerWidth` by `outerHeight` reads 149 by 81 at `screenY` 982 (a window in the Dock), and a `requestAnimationFrame` loop ran 3 frames in 1.5 s, each forced by a screenshot. A still screenshot draws, so a view that paints once can be read; nothing that runs on animation frames can be looked at: Q86c's drag, D13c's repaint in place, D13b's Monaco diff and merge editor, Q102's terminals. Q103's look also needs the cluster, which the status bar shows as unreachable (UT network or EduVPN). U2's audit waits on the same window, since the views drawn by Monaco, xterm, the Map and the virtual lists would be audited from frames that did not run. What ends it: the Chrome window of the Claude tab group restored from the Dock and left on screen, not covered by another window, and EduVPN up for Q103. There is one way to end it and no choice to make; the looks and the audit are taken on the next turn after Axel says the window is up.

## The cases' first reading, on the unchanged section (DESIGN.md lines 234-312 at the base)

Read against the section as it stands, with `grep -c` counts over lines 234-312 of the base file: "root app" 0, "machine app" 0, "connects" 0 (the one hit is "reconnects"), "app-store" 0, "getStore" 0, "setStore" 0, "onStore" 0, "Keep approved" 0, "editing_mark" 0, "opens_per_min" 0, "store_max_kb" 0, "folder_outside" 0, "connect_shape" 0; "allow-downloads" 1 (the never list, base line 284); ".oculus/apps" 1 (the `~/.oculus/apps` default of `apps_dir`, base line 240).

| Case | Result on the base section |
|---|---|
| 1 | Not met. Only `<apps_dir>/notes` is read; the two roots' folders are not. One view id (`app:<name>`, base line 263), one address form (base line 274), one approval entry keyed by `name` (base line 305). |
| 2 | Not met. Nothing distinguishes a root app. A machine app declaring `inbox` is refused `channel_closed` (base line 299 closes `inbox`), where the ruling offers it. |
| 3 | Half met. The machine app gets `git` whole (base line 299) as ruled; a root app has no meaning. |
| 4 | Met. `apps` and `pty:<id>` are closed (base line 299), so a manifest naming either gets `channel_closed`. |
| 5 | Not met. Only `getState` and `setState` exist (base line 301). |
| 6 | Not met. `too_large` exists for `setState` alone; there is no store to name. |
| 7 | Not met. `connects` is an unknown key, so any value gives `key_unknown` (base line 255); `connect-src` is `<base>` alone (base line 281). |
| 8 | Half met. A changed machine app loses its approval and shows `apps.changed` (base line 272); the panel does not list origins, and a root app does not exist. |
| 9 | Not met. `allow-downloads` is in the list of tokens never present (base line 284) and the frame is `sandbox="allow-scripts"` (base line 286). |
| 10 | Not met. The bridge has no `open` (base line 297). |
| 11 | Not met. Every change asks again (base line 272); there is no keep control. |
| 12 | Not met. Only a file inside `apps_dir` opens as source text (base line 307). |
| 13 | Half met. A removed machine app's tab draws the unknown view and returns with the folder (base line 272); a root's removal is not covered. |
| 14 | Not met. No root part exists in the address or the view id. |
| 15 | Not met. `repeated` covers a second app folder resolving to a real path under `apps_dir` only (base line 240). |
| 16 | Not met. As 15: no root is read, so no order among roots exists. |
| 17 | Made by the sentence comparison below (the sentences of the base absent from the new section, and why). |
| 18 | The base has no sentence that contradicts another. It states five choices otherwise than the rulings do: C1 (one folder), C8 (`inbox`, `calendar`, `sessions`, `usage` closed to all), C11 (no store), C30 (Document rule for `apps_dir` alone) and C29 (the base says "claims nothing for WebRTC or DNS prefetch", which is option (a); the ruling is as recommended, and the recommended option is (b), the build step measures both in Chrome and the section then states what was measured). Also the N-rulings (downloads, `connects`, `open`, keep approved, part of `git` and `files`). |
| 19 | Not met. The hub is not read as a root; the engine is not read either, so the engine half holds trivially. |
| 20 | Not met. No `open`, no `missing`, no `opens_per_min`. |
| 21 | Not met. `writes: [app-store]` is refused `write_unknown` (a name in neither set); there is no `getStore`. |
| 22 | Not met. `connects` is `key_unknown`. |
| 23 | Not met. No keeping exists. |
| 24 | Not met for the root app. A machine app declaring `files` is called for every notice, the bookmarks notice included (base line 299), which is the ruled behaviour for a machine app. |
| 25 | Not met. A machine app's tab is keyed by name alone; no root exists. |
| 26 | Not met. Only `apps_dir` may itself be a link (base line 240). |
| 27 | Not met. Three machine apps titled "Notes" all read "Notes" (`words: row.title`, base line 266). |

Whether the brief's own rules give a wrong result for any case: none does. Checks made while reading, each against the tree of the worktree: the `git` channel is keyed by `expandHome(one.dir)` of every root but `engine` (`src/lib/server/files/roots.ts:45-49`, `src/lib/data/model/model-sessions.ts:544`), so "the one entry of its root's folder" of item 22 exists as the brief says; the `files` notice carries a folder path in `root` (`src/lib/server/root/watch/git.ts:207`), not a root key, so "a notice naming its root" of item 22 compares folders; `terminal` is the only view of item 18's refusal list that is listed (`document`, `file`, `source` and `project` carry `listed: false`, `grep -rn "listed: false" src`), so the refusal list and the rule "admits the views the catalogue lists" agree.


## DONE / NOT DONE

| Row | Status | Command that proves it, and its output |
|---|---|---|
| The section `## Apps added while oculus runs` rewritten (DESIGN.md lines 234 to 326; base 234 to 312) | DONE | `sed -n 234,326p DESIGN.md`; `grep -n "^## " DESIGN.md` prints `234:## Apps added while oculus runs` and `327:## Relationship to the cockpit` |
| Nothing else in DESIGN.md changed | DONE | `diff <(sed -n 1,233p base) <(sed -n 1,233p DESIGN.md)` printed no difference, and `diff <(sed -n '313,$p' base) <(sed -n '327,$p' DESIGN.md)` printed no difference (base = the copy of DESIGN.md taken before the first edit) |
| ASCII only | DONE | `LC_ALL=C grep -n '[^ -~]' DESIGN.md` prints nothing (exit 1) |
| No history, no date, no person's name in the section | DONE | `sed -n 234,326p DESIGN.md` searched for ` was `, ` were `, `used to`, `changed from`, a `YYYY-MM-DD` date and the plan-id families of `tests/checks/source/history.test.ts` (a python re-run of that test's expression over DESIGN.md) printed no hit; `tests/checks/source/history.test.ts` passed in `npm run test:checks` below |
| One line per paragraph, no spaced hyphen, no em or en dash | DONE | a python scan of lines 234 to 326 for `' - '`, `'--'`, a leading or trailing space and an odd number of backticks printed nothing; `LC_ALL=C grep` above shows no non-ASCII character |
| Every code citation checked against the worktree | DONE | Appendix below: each cited line's text, from a python read of the files |
| `npm run diagrams`, then the list | DONE | output below: `checks: 7 commands passed`, `exit=0` |
| Report | DONE | this file |

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams` ended `diagrams-exit=0`; it rewrote every file of `docs/diagrams/`. I ran no git command, so whether any byte of those files differs from the committed ones is not verified; the generator reads `src` and the section changes none of it.

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, first 40 lines, then the last lines (the lines between are the SvelteKit build log). One earlier run of the list on the same text stopped at `tests/server/root/watch/bookmarks.test.ts`, a timing test of a file this step does not change; `npx vitest run tests/server/root/watch/bookmarks.test.ts` passed alone (5 tests), and the list was then run once more and ended as quoted:

```
$ npm test

> oculus@0.0.1 test
> vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'


 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/E2/tools/oculus


 Test Files  348 passed | 19 skipped (367)
      Tests  5303 passed | 557 skipped (5860)
   Start at  16:34:16
   Duration  200.38s (transform 59.00s, setup 0ms, import 485.34s, tests 216.88s, environment 90ms)

$ npm run test:checks

> oculus@0.0.1 test:checks
> vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0


 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/E2/tools/oculus


 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
   Start at  16:37:43
   Duration  81.53s (transform 41.63s, setup 0ms, import 131.02s, tests 121.79s, environment 7ms)

$ npm run check

> oculus@0.0.1 check
> svelte-kit sync && svelte-check --tsconfig ./tsconfig.json

1790779170471 START "/Users/axelfaes/workspace/research-hub/.agents/worktrees/E2/tools/oculus"
1790779170482 COMPLETED 2377 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build

> oculus@0.0.1 build
> vite build

....
  - vite-plugin-sveltekit-compile buildStart (11%, 3.5s, 1 call)
  - vite-plugin-svelte:compile transform (6%, 1.9s, 519 calls)
Additional hook time came from the hooks below and from hooks under 1s.
3 hooks are listed without a time. Their calls overlapped, so the time inside one call includes work from other calls. To find their cost, profile the build with `node --cpu-prof`:
  - vite-plugin-sveltekit-guard resolveId (7112 calls)
  - vite:worker load (5 calls)
  - vite:asset load (3 calls)
See https://rolldown.rs/reference/InputOptions.checks#plugintimings for more details.

$ npm run format:check

> oculus@0.0.1 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
$ npm run lint

> oculus@0.0.1 lint
> eslint .

$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit=0

```

The `exit=0` line is the exit status of the script, appended by the command that captured the output.

## Per item of "What to build": the paragraph that carries it (lines of `tools/oculus/DESIGN.md` after the rewrite)

| Item | Paragraph (line, run-in label) |
|---|---|
| 1 Two kinds of app | 238 (opening: the two places, the two names); 240 "Where an app lives" (both folders, the hub, `engine`, links, order); the kind's differences sit in 262, 266, 278, 294 to 313, 319 |
| 2 Identity | 242 "How an app is named" (view ids, addresses, `@` and `/` against the name pattern, the percent-encoding, titles); 262 (row gains `root`); 280 (HMAC input `<view id>:<hash>`); 284 (`<base>` for both kinds) |
| 3 Approval keyed by folder | 315 "Approval" (`folder` in the entry, removal by folder, `revoke` by view id, `POST /api/approve` carrying `view`, per machine and by content, a pulled root app asks) |
| 4 Document view rule | 321 "Reading an app's files" |
| 5 Watcher | 262 "How oculus finds it while running"; 278 (tabs of a root app whose root leaves Files) |
| 6 What a root app sees | 307 ("Open to every app": the hub channels whole; `git` and `files` as the part of the root, defined from `GitPayload` and `FilesPayload`) |
| 7 The channels | 307 (`inbox`, `calendar`, `sessions`, `usage` machine app only; `apps` and `pty:<id>` closed to all; `apps.read.<channel>`); 260 (`channel_closed`); 325 (`apps.read.<channel>`, `findings.apps.carries.<channel>`) |
| 8 The store | 309 "What an app keeps"; 311 "How it writes" (`app-store`, the body, the record, `.undo`); 325 (`store_max_kb`) |
| 9 Outside addresses | 258 (`connects` form); 260 (`connect_shape`, `list_repeated`); 284 (`connect-src <base> <connects>`); 317 (panel lists them); 323 (the boundary sentence) |
| 10 Downloads | 284 (policy line and the token list); 292 (`sandbox="allow-scripts allow-downloads"`); 290 (what a download is for) |
| 11 The `open` method | 313 "Opening things in oculus"; 294 to 305 (the method in the list and the code example) |
| 12 Approval while written | 319 "Keeping a machine app approved while it is written"; 266 (the strip mark in the registration) |
| 13 Everything made false | every paragraph of 236 to 325; the sentence comparison below lists what left |
| 14 Nothing else in DESIGN.md | lines 1 to 233 and 327 to 416 compared with the base file: `diff` of lines 1-233 and of base 313-end against new 327-end printed no difference |
| 15 Hub and engine | 240 |
| 16 Per folder in the hash | 315 |
| 17 What names an app everywhere | 242 |
| 18 `open` against the closed route | 313 (the last sentences; the closed routes stay in 311) |
| 19 The store, completed | 309 and 311 |
| 20 `connects`, completed | 258 and 260 |
| 21 Downloads, what is not claimed | 323 (last sentences) |
| 22 `git` and `files` exactly | 307 |
| 23 Keep approved and the manifest | 319 |
| 24 A root's apps folder that is a link | 240 |
| 25 A root key that comes to name another folder | 278 |
| 26 Telling apps apart | 242 (titles and the folder path); 266 (`words`); 317 (panel) |
| 27 Every paragraph the above touches | the paragraphs named in the brief, 262 "How oculus finds it", 264 "The first frame", 266 "The view and the catalogue", 278 "When an app is added, changed or removed", 292 "The frame" are all rewritten |


## Shapes named in this step (each reversible; Axel reads them at the landing)

Decisions 1 to 17 of the brief, as the section states them:

| # | Shape as written (line) | Alternative considered |
|---|---|---|
| 1 | View id `app:<root key>/<name>`; address `/apps/@<root key>/<name>/<key>/<path>`; the five real cases in the brief hold (242) | A colon (`app:<root key>:<name>`): a root key may hold `:`, so the split would need the name from the right anyway; `/` splits on the last `/`, which a name never holds |
| 2 | Bridge `getStore`, `setStore`, `onStore`; write kind `app-store`; folder `app-data`; key `store_max_kb` (256) (309, 311, 325) | A kind named `store`; a folder named `store` |
| 3 | `connects:` entries: an origin, `https:` only except `http:` to `localhost` and `127.0.0.1` (258, 260) | Any scheme the reader lists; the reader-visible cost is `wss:` and `http:` to a LAN host, both refused |
| 4 | `open` targets `{ view }`, `{ project }`, `{ file: { root, path } }` (313) | One `{ target: string }` form |
| 5 | "machine app", "root app" (238), settled by the rulings | none |
| 6 | Keep approved held in the server's memory until the process ends (319) | A file beside `approvals.json` (refused by the ruling) |
| 7 | Approval entry field `folder`; hash over the real folder path; `POST /api/approve` carrying `view` (315) | Keeping `name` and adding `folder`: an entry would then be found by two fields |
| 8 | Row field `root`; view id in `x-oculus-app` and the change record; finding key `apps[<view id without "app:">]` (242, 262) | Two headers (root, name) |
| 9 | No `writes:` entry for a store; `app-store` in `writes` refused `write_closed`; `getStore` answers `null`; `onStore` for every change from anywhere; the write limit shared; the record holds sizes with the values under `~/.oculus/app-data/.undo/` (309, 311) | An entry `app-store` in `writes:` like the other kinds |
| 10 | A root app names only its own root in `file`; `open` needs no manifest entry; `{ view }` admits the listed views except `terminal`; `apps.opens_per_min` (30) (313, 325) | A manifest key `opens:` |
| 11 | `findings.apps.connect_shape` and the forms it refuses (260) | One finding per form |
| 12 | Catalog keys `apps.keep_approved`, `apps.editing_mark`; a manifest change ends the keeping (319) | Keeping across a manifest change (refused by item 23) |
| 13 | The root `engine` holds no apps (240) | Reading `config/.oculus/apps/` |
| 14 | `findings.apps.folder_outside`; the order Files shows the roots settles one folder reached twice (240) | Neither root gets it |
| 15 | A root app's tab keeps the real folder and draws the unknown view when the key names another (278) | Closing the tab |
| 16 | A root app's title followed by the root's key in parentheses (242, 266) | A prefix (`cathedra: Notes`) |
| 17 | What a root app gets on `git` and `files` (307) | Every entry under the root's folder for `git` |

Shapes the section states that neither the rulings nor the brief name, each chosen because a builder needs it, each with the alternative considered:

| # | Shape as written (line) | Alternative considered |
|---|---|---|
| 18 | The `apps` row gains `connects`, `kept`, `store` and `storeFile`, and the channel payload gains `folders` (262). The store value rides in the row, so `getStore()` and `onStore` are answered from the pushed row. | A `GET` route that returns one store: no store value in every push and in the first frame (up to `apps.store_max_kb` per app), at the price of a route and a second fetch after each notice |
| 19 | `onStore` is called in the tab that wrote as well (309) | Calling only the other tabs: the writing tab would then hold its own value and every other value would arrive by another path |
| 20 | The body of an `app-store` write is `{ store: <value> }`; the handler writes by rename and reads back (311) | A body carrying the app's view id: an app could then name another app's store |
| 21 | `.undo/<time>.json` holds the values before and after, named by the record's `at`, deleted when the record leaves `changes.keep`; a record whose file is gone answers `nothing` (311) | Keeping only the value before, as the brief says: the undo could not check that the store still holds what the write left |
| 22 | Refusal words `missing` and `refused:<reason>` (294 to 305) | `refused` alone, as the brief words it; the reason is the word the route answers in `error`, never an errno text that carries a path |
| 23 | `open` of an id no registration holds, of a project no portfolio holds, of a root no Files shows and of a file that does not exist rejects `missing`; a root app naming another root rejects `closed` (313) | `closed` for every refusal |
| 24 | `POST /api/approve` carries `keep: true`; the keeping holds the manifest hash approved with it (319) | A second action `keep` |
| 25 | The strip mark while kept is the glyph `edit` with the words `apps.editing_mark`, and `Registration.badgeMark` accepts a function of the badge client (266, 319) | A second registration field |
| 26 | The Document rule is held twice: the page tests the file's folder and path against `folders` and opens the source tab; the file route answers a file of an apps folder as `text/plain` with `nosniff` (321) | The page test alone, which a link inside a root that points into an apps folder defeats since the page does not see real paths |
| 27 | Finding keys `apps[<root key>/]` for a whole apps folder; the folder's name in place of an invalid name in a finding key; sentences of `channel_closed` carry the reason from `findings.apps.carries.<channel>` (240, 242, 260) | The reason from `apps.read.<channel>`, which lives in another catalog file the server's finding text does not read |
| 28 | Catalog words `apps.read_root.git`, `apps.read_root.files`, `apps.connects`, `apps.connects_none`, `apps.store_machine`, `apps.store_root`, `apps.refused_open` (325) | Reusing `apps.read.git` for both kinds: the panel of a root app would say its reach is every repository |
| 29 | The watcher reads `browserRoots`, polls the workspaces file with `pollFile`, watches the store folders non-recursively, and one two-second timer looks again at every missing folder (262) | Its own copy of the root list (the file `roots.ts` says no caller holds one) |
| 30 | The catalogue order: machine apps by name, then each root's apps by name in the order Files shows the roots (266) | All apps sorted by view id |
| 31 | `http:` to a local address on oculus's own port is `connect_shape`; `https:` to it is not (260) | Refusing both schemes |
| 32 | A `wss:` origin is refused (258) | Admitting it with a `wss:` source in the policy |
| 33 | `approvals.json` stays at `"version": 1` (315) | Version 2 for the field rename: the file is not built yet, so no file of version 1 holds an `app` entry |


## Every sentence removed or reworded, and why it was false (base line numbers; the new text has each replacement)

Not a sentence removed because it was wrong at the time: each is made false by a ruling, by an item of the brief, or by a citation that no longer names the line it claims.

| Base sentence (start) | Why false now |
|---|---|
| 236 "...awaiting a ruling ... once it is ruled and built" | The section is ruled. |
| 238 "...that the reader puts in a folder on this machine" | A root's `.oculus/apps/` is also a place (C1 ruling). |
| 240 "`apps_dir` ... names the folder"; "An app is a direct subfolder `<apps_dir>/<name>/`"; "a file directly in `apps_dir`" | `apps_dir` is the machine apps' folder only; root apps have their own folder. |
| 240 "keyed `apps[<folder>]`" (and the same in 257) | Keys carry the root for a root app (item 17). |
| 240 "a second folder resolving to a real path already listed is `findings.apps.repeated`" | Now spans the machine's folder and the roots, in an order. |
| 255 "`reads` and `writes` ... of names from the open sets below" | The open channels differ by kind and `app-store` is not declarable. |
| 257 `channel_closed` / `write_closed` / "Two folders whose manifests claim one name" | Closed set differs by kind; `app-store` is refused in `writes`; the name clash is within one apps folder. |
| 259 handles, "When `apps_dir` does not exist ...", `{ rows, findings }`, the row shape | The watcher follows roots, stores; rows gain fields; `folders` is published. |
| 261 `apps: { rows, findings, version }`; "`app:notes`" only; `writes.svelte.ts:387` | The payload gains `folders`; a root app's id; the citation names 420-421 (the `invalidateAll` import and call). |
| 263 "An app's view id is `app:<name>`" | Root apps carry the root. |
| 265-268 registration | `id`, `words`, `badgeGlyph`, `badgeMark` follow the kinds and the keeping. |
| 268 "`holding the manifest's literal title`" and "`order` is the app's place in the names sorted" | The title carries the root's key; the order spans roots. |
| 272 "A changed app keeps its id and its tab; its hash differs ..." | A machine app kept approved is an exception; root apps and roots leaving Files are added. |
| 274 address `/apps/<name>/<key>/<path>`; HMAC over `app:<name>:<hash>` | The address and the input name the root. |
| 276 "`<name>` ... names an app of the held state that is approved"; "the check `server/content/diagrams.ts` makes" | The root part and the kept state enter; `diagrams.ts:46` compares `dirname(real) !== folder`, and the separator comparison is `inside` in `server/core/paths.ts:15-19`. |
| 278-282 policy line, `<base>`, "`allow-downloads` ... never in the directive" | N3 (b) and N4 (b). |
| 286 `sandbox="allow-scripts"` | N4 (b). |
| 292-297 code example, method list, `read` payload, words, notices | `getStore`, `setStore`, `onStore`, `open`; a root app's copy; `missing`, `refused`, `apps.refused_open`. |
| 299 "Open to apps: ..." and `model-sessions.ts:534`; "Closed: ... `inbox`, `calendar`, `sessions`, `usage`" | C8 (e) and N1 (a); the `files` payload is at `model-sessions.ts:555` and the `git` payload at `:544`. |
| 301 "The tab's instance state ..." alone | Each app also has a store (C11 with N2 (c)). |
| 303 header `x-oculus-app: <name>`; "the app's name"; open kinds; `server/edit/writes.ts:80-88`; `opening.ts:59-66`; the limit sentence | The view id names the app; `app-store` joins; the bookmarks resolution is `server/edit/writes/entries.ts:68` and `server/edit/writes.ts:84-85`; the bookmark's `.html` branch is `opening.ts:62-70`; the write limit covers `setStore`. |
| 305 `"name": "<app name>"`; hash over "its name"; "removes every `app` entry whose `name` is the app's"; `{ action: 'approve', name, hash }`; "serves ... only while the app's hash is in the file" | Approval is keyed by folder (C1 ruling; items 3 and 16); the keeping serves without an entry. |
| 307 panel list, and the Document rule for `apps_dir` alone | The panel gains origins, the store location and the folder path; the rule covers every apps folder. |
| 309 "No file outside its folder"; "Requests: ... `data:` images"; "no popup, download, form"; "No other app: an opaque origin and a key nobody else holds"; the boundary sentence "claims nothing for WebRTC or DNS prefetch" | The store, `connects`, downloads; C29 is ruled as recommended, and the recommended option is that the build step measures and the section then states what was measured. |
| 311 word list; "The finding sentences are ... named above"; the `apps:` limits | New keys. |


## Anything in the brief that was wrong or impossible

Nothing was impossible. Points where the brief and the tree disagree, each settled in the text:

- The brief names two stale citations. Three more are stale: `server/edit/writes.ts:80-88` (lines 84-85 hold the sentence about `bookmarks`, and `collectionFile` at `server/edit/writes/entries.ts:68` does the resolution), `views/sources/files/opening.ts:59-66` (`openBookmark` is lines 62 to 72 and its `.html` branch 67 to 70), and the claim that `server/content/diagrams.ts` compares "with a separator" (`diagrams.ts:46` compares `dirname(real) !== folder`; the separator comparison is `inside` at `server/core/paths.ts:15-19`). All are corrected.
- The brief says the base section holds the recommended option of every choice. It holds option (a) of C29 ("claims nothing for WebRTC or DNS prefetch"); the recommended option is (b) and the ruling is as recommended, so the new text says the build step measures WebRTC, DNS prefetch and a download link in Chrome and the section then states the measurements (`grep -n "claims nothing" ` on the base section finds the sentence).
- Item 8 says a change by one tab reaches "the others", item 19 says every tab. The section follows item 19 (the writing tab hears its own write) and lists it as shape 19.
- Item 19 keeps only the value before for the undo. `undoChange` refuses unless the address still holds the value the write left (`src/lib/server/edit/writes/undo.ts:180-184`), and the record holds sizes, so the undo needs the value after too; `.undo/<time>.json` holds both (shape 21).
- Item 22 says a notice "naming its root". `FilesPayload.root` is a folder path (`src/lib/server/root/watch/git.ts:207`), and `GitPayload` is keyed by the folders `repositoryRoots` returns (`src/lib/server/files/roots.ts:45-49`), so both comparisons are on the root's folder. A repository below the root's folder has its own `git` entry and its own notices, and is not the root app's; the section says so.
- Item 12 names the counterpart mark as a word. `Registration.badgeMark` is a fixed key (`src/lib/state/workbench/navigation/registry.ts:102`), so the section makes it accept a function, as `badgeGlyph` does (shape 25).
- Item 17's finding key `apps[<view id without "app:">]` needs a name, and a folder whose manifest is invalid has none; the section uses the folder's name (shape 27).
- Item 18 lists `document`, `terminal`, `file`, `source` and `project` as refused. Four of them are already unlisted (`grep -rn "listed: false" src/lib/views` finds `Document`, `File`, `Source` and `Project`), so the rule "only a listed view" refuses them and `terminal`, the one listed view of the five, is named beside it.

## Appendix: the cited line of every `file:line` citation of the section

Each entry is the text of the cited line, read from the worktree by a python script on the final file; ranges list every line.

```
config/layout.yml:24
    24: # The view catalogue's groups, in the order the Views view lists them: every group is one rail page, keyed by 
src/lib/server/files/roots.ts:25-36
    25: export function browserRoots(target: RootsTarget): Root[] {
    26: const fixed = rootsFrom(
    27: configuredRootsOf(target.config, target.engine),
    28: target.local.hub,
    29: target.engine
    30: );
    31: const saved = readSaved(
    32: target.local.workspaces ?? defaultWorkspacesPath(),
    33: fixed.map((one) => one.key)
    34: );
    35: return [...fixed, ...addedRoots(fixed, saved)];
    36: }
src/lib/server/files/roots.ts:45-49
    45: export function repositoryRoots(target: RootsTarget): string[] {
    46: return browserRoots(target)
    47: .filter((one) => one.key !== ENGINE_ROOT)
    48: .map((one) => expandHome(one.dir));
    49: }
src/lib/server/files/fs.ts:222-233
    222: export function workspaceRoots(fixed: Root[], saved: Saved, name: string): ShownRoot[] {
    223: const shown: ShownRoot[] = fixed.map((one) => ({ ...one, fixed: true }));
    224: for (const one of rootsOf(saved, name)) {
    225: if (shown.some((held) => held.key === one.key)) continue;
    226: shown.push({ ...one, fixed: false });
    227: }
    228: // The hub is in every workspace, so "no root" means no root beside it.
    229: if (shown.every((one) => one.key === HUB_ROOT)) {
    230: shown.push({ key: DEFAULT_ROOT.key, dir: expandHome(DEFAULT_ROOT.dir), fixed: true });
    231: }
    232: return shown;
    233: }
src/lib/server/root/watch/git.ts:427
    427: workspaces = pollFile(workspacesFile, { clock, every: poll }, () => {
src/lib/server/root/watch/git.ts:207
    207: hub.publish('files', { root } satisfies FilesPayload);
src/lib/server/root/watch/bookmarks.ts:66
    66: hub.publish('files', { root: '', bookmarks: true } satisfies FilesPayload);
src/routes/+page.svelte:73-75
    73: $effect(() => {
    74: setToken(data.token);
    75: });
src/routes/+page.server.ts:26-27
    26: // nowhere else. invalidateAll() runs this load again, which is how a page that met a 403 gets the
    27: // token a restarted server minted.
src/lib/state/client/writes.svelte.ts:420-421
    420: const { invalidateAll } = await import('$app/navigation');
    421: await invalidateAll();
src/lib/state/client/socket.svelte.ts:155-160
    155: // The seed's bound names a version of the hub the page was built against. A reconnect
    156: // may reach a restarted server, whose hub numbers its pushes from the start again, so
    157: // after the first open every push is taken.
    158: if (opened) {
    159: seededThrough = -1;
    160: entities.reconnected();
src/routes/views.ts:53-65
    53: export function registerCollections(registry: RegistryStore, keys: string[]): void {
    54: for (const unknownModule of Object.values(viewModules)) {
    55: const module = unknownModule as ViewModule;
    56: if (typeof module.registration !== 'function') continue;
    57: const wanted = definitions(module.registration, keys);
    58: const ids = new Set(wanted.map((registration) => registration.id));
    59: for (const registration of registry.views()) {
    60: if (registration.component !== module.default) continue;
    61: if (!ids.has(registration.id)) registry.unregisterView(registration.id);
    62: }
    63: registry.registerComponent(module.default, wanted);
    64: }
    65: }
src/lib/state/workbench/navigation/registry.ts:86-91
    86: /**
    87: * Whether the view catalogue lists the view. Every view is listed unless it says otherwise; one
    88: * that is only ever opened for something (a project's editor, a project, a document) says
    89: * `false`, since opened bare it can only report that it was opened for nothing.
    90: */
    91: listed?: boolean;
src/lib/state/workbench/navigation/registry.ts:102
    102: badgeMark?: string;
src/lib/server/core/auth.ts:29-38
    29: export function allowedOrigin(origin: string | undefined): boolean {
    30: if (origin === undefined || origin === '') return false;
    31: let url: URL;
    32: try {
    33: url = new URL(origin);
    34: } catch {
    35: return false;
    36: }
    37: return url.hostname === '127.0.0.1' || url.hostname === 'localhost';
    38: }
src/lib/server/core/paths.ts:15-19
    15: export function inside(path: string, dir: string): boolean {
    16: const full = resolve(path);
    17: const root = resolve(dir);
    18: return full === root || full.startsWith(root + sep);
    19: }
src/lib/views/sources/document/Document.svelte:134-141
    134: <iframe
    135: class="frame"
    136: {title}
    137: {src}
    138: sandbox="allow-same-origin allow-scripts"
    139: bind:this={frame}
    140: onload={loaded}
    141: ></iframe>
src/lib/views/sources/document/Document.svelte:108
    108: frame?.contentDocument?.addEventListener('contextmenu', inFrame);
src/lib/views/sources/document/Document.svelte:118
    118: window.open(src, '_blank', 'noopener');
src/lib/views/sources/document/Document.svelte:138
    138: sandbox="allow-same-origin allow-scripts"
src/lib/shell/Workbench.svelte:250-251
    250: <svelte:window
    251: onkeydown={keyboard.keys}
src/lib/data/model/index.ts:228
    228: host: HostInfo;
src/lib/data/model/model-sessions.ts:544
    544: export type GitPayload = Record<string, GitState>;
src/lib/data/model/model-sessions.ts:555
    555: export type FilesPayload = { root: string; bookmarks?: boolean };
src/lib/server/edit/writes/entries.ts:68
    68: if (own !== undefined && key === BOOKMARKS) {
src/lib/server/edit/writes.ts:84-85
    84: * `bookmarks` is a collection of the reader's own that lives outside the hub, so the four entry
    85: * writes are given it and resolve the key `bookmarks` to that file rather than to a hub one.
src/lib/views/sources/files/opening.ts:62-70
    62: export function openBookmark(opener: Opener, entry: Entry): void {
    63: const root = entry.fields.root;
    64: const path = entry.fields.path;
    65: if (typeof root !== 'string' || typeof path !== 'string') return;
    66: const mark = { label: entry.title, root, path };
    67: if (typeOfFile(path).kind === 'html') {
    68: opener.openView('document', documentState(mark));
    69: return;
    70: }
src/lib/views/sources/files/opening.ts:47-72
    47: export async function openRow(opener: Opener, row: TreeRow, preview: boolean): Promise<void> {
    48: const type = await opener.readFileKind(row.root, row.path);
    49: const tab = tabOf(type.kind, row);
    50: const id = opener.openView(tab.view, tab.state, undefined, { preview });
    51: if (!preview) opener.keepPreview(id);
    52: }
    53: 
    54: /** Open one file in the view that can show it, in a new pane beside the one being read. */
    55: export async function openRowBeside(opener: BesideOpener, row: TreeRow): Promise<void> {
    56: const type = await opener.readFileKind(row.root, row.path);
    57: const tab = tabOf(type.kind, row);
    58: opener.openBeside(tab.view, tab.state);
    59: }
    60: 
    61: /** Open the file one bookmark names, under the label the reader gave it. */
    62: export function openBookmark(opener: Opener, entry: Entry): void {
    63: const root = entry.fields.root;
    64: const path = entry.fields.path;
    65: if (typeof root !== 'string' || typeof path !== 'string') return;
    66: const mark = { label: entry.title, root, path };
    67: if (typeOfFile(path).kind === 'html') {
    68: opener.openView('document', documentState(mark));
    69: return;
    70: }
    71: opener.openView('file', { root, path, label: entry.title });
    72: }
src/lib/server/edit/writes/deck.ts:1-4
    1: // Layer 2, server. The deck's saved selection and slide order, written into config/present.yml.
    2: //
    3: // It is the one write that touches an engine file rather than the hub: the deck is oculus's
    4: // configuration, not the researcher's data. The file and the `deck:` map it holds are both on the
src/lib/server/edit/writes/undo.ts:181
    181: if (change.undo === 'none') return { error: 'nothing' };
src/lib/server/edit/writes/manifest.ts:314
    314: undo: 'none'
src/lib/server/edit/feeds.ts:253
    253: undo: 'none'
src/lib/server/edit/feeds.ts:306
    306: undo: 'none'
src/lib/state/sessions/source.svelte.ts:325-326
    325: if (answer.error === 'binary') {
    326: updateDraft(id, { message: t('source.binary') });
penpal@8.0.1 dist/penpal.mjs (npm pack into the scratchpad; not installed in the worktree):
    15: const serializeError = (error) => ({
    16: name: error.name,
    17: message: error.message,
    18: stack: error.stack,
    19: penpalCode: error instanceof PenpalError ? error.code : void 0
    20: });
    88: const createErrorReplyMessage = (channel, callId, error) => ({
    89: namespace: namespace_default,
    90: channel,
    91: type: "REPLY",
    92: callId,
    93: isError: true,
    94: ...error instanceof Error ? {
    95: value: serializeError(error),
    96: isSerializedErrorInstance: true
    97: } : { value: error }
```
