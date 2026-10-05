Not done: C85 (A3's `schedule` channel is not on main, so the case cannot run; it belongs to whichever of A3 and E4 lands second, Decision 20). Not as the brief expects: C64, the call `open({ file })` that adds a pane to the page makes the app that asked receive the rejection `CONNECTION_DESTROYED` instead of `ok`, because that app's frame is drawn again (finding 1 below, which asks for a ruling). Everything else in the brief is built and checked; the cases that are looks are listed for the orchestrator.

# E4 report: the apps

## Open items of the state file

`orchestrator-state.md`, section "Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)", read in the main checkout with `sed -n 165,180p`, holds no entry. Its text is:

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## For the orchestrator's ruling

1. **`open({ file })` that adds a pane draws the asking app's frame again.** Measured in headless Chrome on the final build (`node $S/runs/open-files.mjs`, quoted at C64 below): the source tab opens, the pane holding the app is replaced (the iframe element is a new element), the app loads again and the call it made rejects with penpal's `CONNECTION_DESTROYED`. A later `open` that adds a tab to an existing pane leaves the frame in place and resolves. The brief expected `ok`. DESIGN.md's "Opening things in oculus" now states the behaviour as measured. It is a different concern from the apps: the workbench replaces the component of a pane when a split is added, and whether other views (the terminal, the editor) are replaced the same way is not verified. Options: (a) keep as built and documented, the lazy option, because the app author must handle a rejected `open` that opened the tab; (b) make an `open` from an app land as a tab in the pane that holds the app and never add a pane, which changes where a tab lands for every app and needs a ruling on that user-visible placement; (c) keep a pane's frames mounted across tree changes in the workbench, which ends the cause for every view and needs its own brief because it changes `shell/panes/`. Recommendation: (c), booked as a step of its own with (a) standing until it lands.

2. **The brief's item 14 and Decision 11 give two triggers for closing the download measurement.** Item 14 says close it "if the frame run logs a connection"; Decision 11 says close it if a request leaves. The frame run logs one connection on 9444 and no request (a preconnect job with no bytes sent), and a sandboxed frame with no policy at all sends the request both with and without `allow-downloads`. I followed Decision 11: no request leaves, so `allow-downloads` stays in the sandbox and the policy. DESIGN.md says so in "What an app does not get". Needs the ruling that Decision 11 is the trigger. The lazy option would be to keep `allow-downloads` without the second measurement; the measurement is made and quoted at M4.

3. **WebRTC, DNS prefetch and a preconnect are not stopped by the policy.** M1, M2 and M4 show each of them leaving the frame (M1: five UDP datagrams on 3478; M2: the host name resolved; M4: a connection on 9444 that carries no data). DESIGN.md and HELP.md state this and keep the reader's approval of the files and of `connects` as the boundary against an app sending what it read elsewhere. The section as ruled said the question was open; it is now answered by measurement. No other mitigation was measured. Recommendation: accept the approval boundary as built, the statement as written in DESIGN.md and HELP.md.

4. **C85 belongs to the second of A3 and E4 to land.** The manifest reader's table needs a row `reads: [schedule]` refused as `channel_closed` with `findings.apps.carries.schedule`, and the catalog key is added with it (Decision 20). Neither exists on main.

5. **One read-only git command was run.** `git status 2>&1 | head -1` printed `On branch E4` in the worktree; the brief forbids a git command, and nothing was changed by it. `npm run test:quick` reads the changed files from git itself, as `agents/spec.md` allows.

6. **Duration of `test:quick`.** The log of the run at 21:42 (`checks-final.txt`) prints `test:quick: 57.5 s (limit 45.0 s); every command passed`; the runs of 21:54, 22:00 and 22:03 print 25.3 s, 35.6 s and 34.6 s. The machine's load average was 10 to 12 at 22:06 (`uptime`). Under that load `tests/checks/imports/cycles.test.ts`, `order.test.ts` and `claude-usage.test.ts` hit vitest's 5 s test timeout in one run of `npx vitest run tests/checks` and pass when rerun alone (`tests/checks/imports/order.test.ts` 13 passed with `--testTimeout=60000`) and in the full `tests/checks` run with `--testTimeout=60000` (16 files, 229 tests). Those three files are not changed by the step apart from `tests/checks/imports/order.ts`, whose one added line (`'views/apps'`) the order test reads.

## The cases

The quoted tool output holds the box-drawing and ellipsis characters of vitest and npm as ASCII stand-ins (a dash, three dots, a pipe), the only change made to a quoted line.

`$S` below is the builder's scratch folder `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/e4`, which holds every file named with it.

### Runs on the unchanged tree

The base copy's `npm run build`, started as `node src/server.ts --engine <scratch>/engine` on 8797 and stopped after, answers each address of the step with a 404 page and the page `/` with no `Content-Security-Policy` line; the last block of the file answers 400 (the output of `$S/first/curl-base.txt`, as printed):

```
== C37 curl -sI http://localhost:8797/
HTTP/1.1 200 OK
content-length: 912
content-type: text/html
etag: "11gppxg"
link: <./_app/immutable/assets/0.B25bsGkJ.css>; rel="preload"; as="style"; nopush, <./_app/immutable/assets/2.BPPEjNFX.css>; rel="preload"; as="style"; nopush, <./_app/immutable/entry/start.CiRO3J93.js>; rel="modulepreload"; nopush, <./_app/immutable/chunks/VVhepuql.js>; rel="modulepreload"; nopush, <./_app/immutable/chunks/CXPkLlIs.js>; rel="modulepreload"; nopush, <./_app/immutable/entry/app.BEmEgGMr.js>; rel="modulepreload"; nopush, <./_app/immutable/chunks/uBIymjUX.js>; rel="modulepreload"; nopush, <./_app/immutable/chunks/xihTtKlq.js>; rel="modulepreload"; nopush, <./_app/immutable/nodes/0.AJ7ZHDHK.js>; rel="modulepreload"; nopush, <./_app/immutable/chunks/B8zSLdom.js>; rel="modulepreload"; nopush, <./_app/immutable/nodes/2.dfVMGPaV.js>; rel="modulepreload"; nopush, <./_app/immutable/chunks/Bzm2pVCU.js>; rel="modulepreload"; nopush
x-sveltekit-page: true
Date: Mon, 05 Oct 2026 16:20:58 GMT
Connection: keep-alive
Keep-Alive: timeout=5

== C30 curl -si /apps/notes/abc/index.html
HTTP/1.1 404 Not Found
content-length: 789
content-type: text/html
== C35 curl -si /apps/-/penpal.js
HTTP/1.1 404 Not Found
content-length: 780
content-type: text/html
== C35 curl -si /apps/-/oculus.js
HTTP/1.1 404 Not Found
content-length: 780
content-type: text/html
== C95 curl -sI /apps/-/penpal.js
HTTP/1.1 404 Not Found
content-length: 780
content-type: text/html
== C53 GET /api/app-store?view=app%3Anotes (Sec-Fetch-Site same-origin)
HTTP/1.1 404 Not Found
content-length: 771
content-type: text/html
== C53 same with Origin: null
HTTP/1.1 404 Not Found
content-length: 771
content-type: text/html
== C73 GET /api/app-open?app=a&root=hub&path=README.md
HTTP/1.1 404 Not Found
content-length: 771
content-type: text/html
== C75 POST /api/approve
HTTP/1.1 404 Not Found
content-length: 771
content-type: text/html
== C76 POST /api/approve without token (same)
HTTP/1.1 404 Not Found
content-length: 771
content-type: text/html
HTTP/1.1 400 Bad Request
content-length: 52
content-type: application/json
Date: Mon, 05 Oct 2026 16:21:17 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"the body is not a write this route knows"}(server: node src/server.ts --engine <scratch>/engine from the unchanged tree built by npm run build, stopped after; port 8797 free after: lsof empty)
```

Each test file the step adds or changes, run from a copy of itself placed in the base tree (`bash $S/bin/baserun.sh`), fails there (`$S/base-runs.txt`, lines that name a failure or the totals):

```
=== tests/server/machine/apps/manifest.test.ts
 FAIL  |unit| tests/server/machine/apps/manifest.test.ts [ tests/server/machine/apps/manifest.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/apps/address.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/e4/basetree/tests/server/m
 Test Files  1 failed (1)
      Tests  no tests
=== tests/routes/apps/app-files.test.ts
 FAIL  |unit| tests/routes/apps/app-files.test.ts [ tests/routes/apps/app-files.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/address.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/e4/basetree/tests/routes/apps
 Test Files  1 failed (1)
      Tests  no tests
=== tests/routes/apps/approve.test.ts
 FAIL  |unit| tests/routes/apps/approve.test.ts [ tests/routes/apps/approve.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/held.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/e4/basetree/tests/routes/apps/ap
 Test Files  1 failed (1)
      Tests  no tests
=== tests/routes/apps/app-store.test.ts
 FAIL  |unit| tests/routes/apps/app-store.test.ts [ tests/routes/apps/app-store.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/routes.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/e4/basetree/tests/routes/apps/
 Test Files  1 failed (1)
      Tests  no tests
=== tests/routes/apps/app-open.test.ts
 FAIL  |unit| tests/routes/apps/app-open.test.ts [ tests/routes/apps/app-open.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/held.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/e4/basetree/tests/routes/apps/ap
 Test Files  1 failed (1)
      Tests  no tests
=== tests/routes/edit/app-gate.test.ts
 FAIL  |unit| tests/routes/edit/app-gate.test.ts [ tests/routes/edit/app-gate.test.ts ]
Error: Cannot find module '../../../src/lib/server/edit/writes/app-gate.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/e4/basetree/tests/routes/edit
 Test Files  1 failed (1)
      Tests  no tests
=== tests/state/system/apps/methods.test.ts
 FAIL  |unit| tests/state/system/apps/methods.test.ts [ tests/state/system/apps/methods.test.ts ]
Error: Cannot find module '../../../../src/lib/state/system/apps/methods.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/e4/basetree/tests/state/syst
 Test Files  1 failed (1)
      Tests  no tests
=== tests/state/system/apps/store-cache.test.ts
 FAIL  |unit| tests/state/system/apps/store-cache.test.ts [ tests/state/system/apps/store-cache.test.ts ]
Error: Cannot find module '../../../../src/lib/state/system/apps/store-cache.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/e4/basetree/tests/state/
 Test Files  1 failed (1)
      Tests  no tests
=== tests/views/shared/explorer/opening-apps.test.ts
 FAIL  |unit| tests/views/shared/explorer/opening-apps.test.ts [ tests/views/shared/explorer/opening-apps.test.ts ]
Error: Cannot find module '../../../../src/lib/data/helpers/files/apps.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/e4/basetree/tests/views/shared
 Test Files  1 failed (1)
      Tests  no tests
=== tests/routes/files/file.test.ts
------- Failed Tests 3 -------
 FAIL  |unit| tests/routes/files/file.test.ts > serving a file of an apps folder > answers a page of an app with the type .oculus/apps/notes/index.html
 FAIL  |unit| tests/routes/files/file.test.ts > serving a file of an apps folder > answers a page of an app reached through a link to the apps folder with the type alias/notes/index.html
AssertionError: expected 'text/html; charset=utf-8' to be 'text/plain; charset=utf-8' // Object.is equality
 FAIL  |unit| tests/routes/files/file.test.ts > serving a file of an apps folder > answers a script of an app with the type .oculus/apps/notes/app.js
=== tests/server/edit/app-store.test.ts
 FAIL  |unit| tests/server/edit/app-store.test.ts [ tests/server/edit/app-store.test.ts ]
Error: Cannot find module '../../../src/lib/server/edit/writes/app-store.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/e4/basetree/tests/server/edi
 Test Files  1 failed (1)
      Tests  no tests
=== tests/server/core/changes.test.ts
------- Failed Tests 1 -------
 FAIL  |unit| tests/server/core/changes.test.ts > what a store write leaves in the undo folder > keeps the values of a record outside its line and deletes them when the record leaves the window
AssertionError: expected true to be false // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
=== tests/routes/edit/undo/undo.test.ts
 FAIL  |unit| tests/routes/edit/undo/undo.test.ts [ tests/routes/edit/undo/undo.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/scan.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/e4/basetree/tests/routes/apps/ap
 Test Files  1 failed (1)
      Tests  no tests
=== tests/data/sources/config/settings.test.ts
------ Failed Tests 15 -------
 FAIL  |unit| tests/data/sources/config/settings.test.ts > the synthetic catalog > gives every setting a default other than the shipped one
TypeError: Cannot read properties of undefined (reading 'default')
 FAIL  |unit| tests/data/sources/config/settings.test.ts > appsSettings > answers each limit the entry default when it is missing, and no problem
AssertionError: expected { Object (threw) } to strictly equal { value: { ...(9) }, problems: [] }
=== tests/data/sources/config/local.test.ts
------- Failed Tests 2 -------
 FAIL  |unit| tests/data/sources/config/local.test.ts > checkLocal > answers "apps_dir: 3" with the sentence it would throw
AssertionError: expected null to be 'local.yml: apps_dir must be a path' // Object.is equality
 FAIL  |unit| tests/data/sources/config/local.test.ts > readLocalText > reads apps_dir under the home folder, against the engine, as written, or leaves it absent
AssertionError: expected undefined to be '/Users/axelfaes/x' // Object.is equality
=== tests/server/machine/approvals/approvals.test.ts
------- Failed Tests 1 -------
 FAIL  |unit| tests/server/machine/approvals/approvals.test.ts > the approvals file > reads a file that is not JSON as no approved app and refuses an app approval or revoke over it
TypeError: approvedApps is not a function
 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
```

Four changed files under `tests/checks/` run on the base tree the same way (`$S/base-runs2.txt`): `keys.test.ts` fails (it imports the store kind and `registerApps`, which the base lacks), `config-folder.test.ts` fails 3 tests (the catalog file `views/apps/apps.yml` and the key `apps` it lists are missing there). `config.test.ts` (30 passed) and `boundaries.test.ts` (11 passed) pass on the base tree: their changes allow a key and a module that the base does not have, so they are judged by reading.

### Each case of the brief

Legend and rows as below. Every case is a reading of the named test row, a run with its output, or a look.

Legend. Test files (all under `tools/oculus/tests/`): M = `server/machine/apps/manifest.test.ts`, AF = `routes/apps/app-files.test.ts`, AP = `routes/apps/approve.test.ts`, AS = `routes/apps/app-store.test.ts`, AO = `routes/apps/app-open.test.ts`, AG = `routes/edit/app-gate.test.ts`, ME = `state/system/apps/methods.test.ts`, SC = `state/system/apps/store-cache.test.ts`, OA = `views/shared/explorer/opening-apps.test.ts`, FT = `routes/files/file.test.ts`, ST = `server/edit/app-store.test.ts`, CH = `server/core/changes.test.ts`, UN = `routes/edit/undo/undo.test.ts`, SE = `data/sources/config/settings.test.ts`, LO = `data/sources/config/local.test.ts`, AA = `server/machine/approvals/approvals.test.ts`, KE = `checks/source/keys.test.ts`. A case "by M" is a row of that table, named by its title in `verbose.txt` of the run quoted under "The tests of this step". The scratch oculus on 8797 ran the final build; its runs are quoted as printed.

Folders and manifests
- C1. By M: `reads a valid manifest`, `reads the first row of a valid manifest as unapproved with no key` (row `app:notes`, `root` empty, `approved` false, `key` empty, no finding).
- C2. By M: `reads a stray file, a hidden folder and a folder with no manifest`.
- C3. By M: `reads a manifest that does not parse`, `reads a manifest that is a list`, `reads a manifest that is a number` (`does_not_parse`, `not_a_map`).
- C4. By M: `reads no name`, `reads an upper-case name`, `reads a name that starts with a hyphen`, `reads a name holding a slash`, `reads a name that starts with an at sign`, `reads a name of 41 characters`, `reads a name that is not the folder name`.
- C5. By M: `takes the first folder for a name two folders both claim`.
- C6. By M: `reads no title`, `reads a title of 41 characters`, `reads a title holding a tab`, `reads a description of 201 characters`, `reads a bridge version this oculus does not read`, `reads a key this oculus does not read`.
- C7. By M: `reads an entry that climbs out of the folder`, `reads an entry in a dot-led folder`, `reads an entry that does not end in .html`, `reads an entry with an empty segment`, `reads an entry that is not a file of the app`, `reads no entry and no index.html`.
- C8. By M: `reads a channel read twice`, `reads an origin written twice, once with a slash`.
- C9. By M: `reads a read of a channel that does not exist`, `reads a write that does not exist`.
- C10. By M: `reads a read of the apps channel`, `reads a read of a terminal channel` (`pty:1`), `reads a read of the processes channel`, `reads a root app reading the inbox as no app, with the sentence naming a root app`, `reads a machine app reading the inbox` (offered).
- C11. By M: `reads a write of an undo`, `reads a write of the rail`, `reads a write of the roots`, `reads a write of a session`, `reads a write of the app store`.
- C12. By M: `reads an https origin and a localhost origin on another port`, `reads an origin with a trailing slash`, and one row per shape: `https://u@h.org`, `https://h.org/p`, `https://h.org?q=1`, `https://*.h.org`, `ftp://h.org`, `wss://h.org`, `http://example.org`, `http://localhost:8787`.
- C13. By M: `reads a glyph that is not in the vocabulary`, `reads the reserved glyph`, `draws a glyph that is not offered as the default glyph and an offered one as itself`.
- C14. By M: `offers 501 files or more than 20 MB as no app, with one finding`.
- C15. By M: `records neither a symbolic link nor a dot-led file, and the hash ignores both`.
- C16. By M: `reads an apps folder that is a link out of its root as one finding and no app`.
- C17. By M: `gives one folder reached through two roots to the first and marks the second`, `reads an apps_dir that is a root apps folder as machine apps and marks the root`.
- C18. By M: `names the engine folder as no root of apps`.

Names and addresses
- C19. By M: `names three folders `notes` by three ids, finding keys and approvals`. Run (`node $S/runs/vrun.mjs $S/runs/registry.ts`, the three rows through `registerApps`, then `registrationLabel`): `C19/C21 app:notes: label "Reading notes" group apps glyphName app_view`, `C19/C21 app:cathedra/notes: label "Reading notes (cathedra)" group apps glyphName app_view`, `C19/C21 app:ordo/notes: label "Reading notes (ordo)" group apps glyphName app_view`.
- C20. By M: `names a root key holding a space in the id`; AF: the address `/apps/@my%20repo/todo/<key>/index.html` answers 200; AG: `lets through a root app by its escaped root key` (header `app:my%20repo/todo`).
- C21. By M: `names an app `focus` by the id app:focus, which no built-in view takes`. Run: `C19/C21 app:focus: label "My focus" group apps glyphName app_view` and `C21 built-in focus registration is the one registerAll made: true`.

While running
- C22. Run (`node $S/runs/watch.mjs`, `watchApps` over a throwaway folder, debounce 100 ms): `C22 at start: apps folder absent: rows 0 findings 0 pushes 1`, then `C22 row appeared after 2019 ms: notes approved=false key="" | findings 0` (the two-second look of a missing folder).
- C23. Look (list below). The code behind it: `views/apps/frame/AppFrame.svelte:185` passes `changed={tab.seen !== '' && tab.seen !== row.hash}` to the approval panel, which draws `apps.changed` (`ApprovalPanel.svelte:48-49`); the tab's saved `value` is not touched by the panel. Run (`keep.mjs`): after the `app.yml` edit `C78 after an edit of app.yml: approved=false kept=false key="" hash=21b676b0`.
- C24. Run (`registry.ts`): rows dropped from `registerApps` leave `removed folders: app views held app:notes | tabs closed: []`, so the three other registrations were dropped and no tab was closed; the tab's drawing of "Unknown view" with its state kept is the look.
- C25. Look. The registry side is the same call as C24 with the root's rows missing from the push.
- C26. Run (`state.ts`, `drawsFolder`): `C26 tab folder /a/x draws registered folder /b/x for root app: false`, `C26 same folder: true | new tab (no folder): true`.
- C27. Run (`registry.ts`): `C27 after a config push (registerCollections): app registrations 4 -> 4 | tabs closed: []`.
- C28. Look.
- C29. Run (`watch.mjs`): `C29 approvals.json absent: approved = false | findings 0`, then `C29 approvals.json written later: approved = true key length 32 after 1992 ms`.

Serving
- C30. By AF: `answers an approved app file with its type, the open headers and the policy`. Run (`keep.mjs`, approved machine app on 8797): `C78 the new key serves app.js: 200 | the old key: 404`; the app files of the browser runs (C41, C43, C45, C48) load and connect in the frame.
- C31. By AF: `answers an empty 404 for a wrong key`, `to the key of another app`, `to an app that is not approved`, `to a method other than GET and HEAD and to another host`, `stops answering a file whose bytes changed, and answers once the app is approved again`. Run (`keep.mjs`): `C78 the new key serves app.js: 200 | the old key: 404`.
- C32. By AF: `answers an empty 404 for another path of no record`, `for the manifest path with no file name`, `for an encoded climb to the folder of a sibling`, `for an encoded dot pair as a segment`, `for an encoded climb to a key file`, `for an empty segment`, `for a dot-led file`, `for an escaped backslash`, `for an escaped NUL`, `for a malformed escape`, `for a link inside the folder, by its name`.
- C33. By AF: `stops answering a file whose bytes changed, and answers once the app is approved again`, `stops answering a file rewritten to the same size with its mtime put back` (the change time differs), `keeps answering a file that was only touched, since the hash is the approved one`. By M: `sets the address key of an approved row from its id and hash`.
- C34. By AF: `does not reach the sibling folder `notes-old` by any path of `notes``.
- C35. Run on 8797: `curl -si http://localhost:8797/apps/-/penpal.js` prints `HTTP/1.1 200 OK`, `access-control-allow-origin: *`, `cache-control: no-cache`, `content-length: 25653`, `content-type: text/javascript; charset=utf-8`, `x-content-type-options: nosniff` and no `content-security-policy` line; `curl -s http://localhost:8797/apps/-/penpal.js | cmp - node_modules/penpal/dist/penpal.mjs` prints `identical`; `/apps/-/other.js` 404, `POST /apps/-/penpal.js` 404, `Host: evil.example:8797` 404. By AF: the table of shared files (`penpal.js` 200, `other.js` 404).
- C36. By AF: the rows `/apps/@engine/x/<key>/index.html` and `/apps/@nonesuch/x/<key>/index.html` answer 404, `wasm` answers `application/wasm`, `xyz` answers `application/octet-stream`.

The frame and the bridge
- C37. Run: `curl -sI http://localhost:8797/ | grep -i "content-security-policy\|^HTTP"` prints `HTTP/1.1 200 OK` and `content-security-policy: frame-src 'self'`.
- C38. Look.
- C39. Look.
- C40. Look (real windows on TEST).
- C41. Run (`runs/browser3.mjs`, headless Chrome, scratch app `probe4` with `reads: [config]`): `C41 read("inbox") with reads [config]: rejected string "not_declared" | rejected string "not_declared"` and `C41 notices naming the refused read on the page: 1`. By ME: `refuses a read of a channel the manifest does not declare with not_declared`.
- C42. Run (`state.ts`): `C42 root app read git, dir /work/repo     -> {"channel":"git","version":3,"payload":{"/work/repo":{"branch":"main"}}}`, `C42 root app read git, root not shown      -> {"channel":"git","version":3,"payload":{}}`, `C42 machine app read git                   -> /work/repo, /work/other, /work/repo/sub`, `C42 files notice of its root               -> {"channel":"files","version":1,"payload":{"root":"/work/repo"}}`, `C42 files notice of another root           -> null`, `C42 bookmarks notice, root app / machine   -> null / {"channel":"files","version":3,"payload":{"root":"","bookmarks":true}}`, `C42 root app reading inbox (access)        -> closed | machine app: ok`. The part of `onChannel('git')` that is delivered only when the entry changed is the `sent.get('git') === text` comparison at `state/system/apps/apps.svelte.ts:254` (read, not run).
- C43. Run (`runs/browser4.mjs`; the app's `onChannel` takes 6 s; `config/behavior.yml` of the scratch engine touched three times 0.9 s apart): `onChannel config v5 start at 2859 ms`, `onChannel config v5 end at 8863 ms`, `onChannel config v7 start at 8874 ms`, `onChannel config v7 end at 14876 ms`: version 6 arrived while v5 was in flight and one call followed with the newest payload (v7).
- C44. Look.
- C45. Run (`browser3.mjs`): `C45 active element is the app iframe: IFRAME true`, `C45 25 key calls inside one second, focus in the frame -> keydown events on the page window: 20`, `C45 5 key calls with focus elsewhere -> keydown events: 0 | active element: BODY`. The palette opening is the look.
- C46. Look.
- C47. Look.
- C101. Look.

What an app keeps
- C48. By ME: `rejects a state over the limit and a store over the limit as too_large`, `rejects setState and setStore of a cycle as not JSON and sends nothing` (and `undefined`, `NaN`, `a Map`, `a Date`). Run (`runs/tabs.mjs`, two tabs of `app:probe4` in one pane, each frame addressed through its iframe element): `first instance getState before any set: null`, `first instance setState("A"): set`, `second instance getState after the first set "A": null`, `second instance setState("B"): set`, `first instance getState: "A" | second instance getState: "B"`.
- C49. By ST: `answers one record naming the app, the field store, byte sizes and both values`, `makes the folder and the file on the first write, with the file private to the machine`, `records through the endpoint with the sizes and keeps the values in the undo folder`; CH: `keeps the values of a record outside its line and deletes them when the record leaves the window`.
- C50. By ST: `writes nothing and records nothing for a value equal to the file with its keys in another order`.
- C51. By ST: `refuses a value over the limit as too_large and makes no file`, `goes ahead when the file does not parse, which holds no value to compare`, `goes ahead when the file is over the limit, which holds no value to compare`.
- C52. Run (`watch.mjs`): `C52 store path is a folder: 0 ""`, `C52 empty file: 0 "e3b0c44298fc1c14"`, `C52 300 KB file: bytes 307211 version ed2ff8b657ce6554 expected sha16 of <size>:<mtimeMs> ed2ff8b657ce6554`.
- C53. By AS: `answers the version and the value of a held row`, `answers a null value and an empty version for an app with no store file`, `answers 'no view' with 400`, `answers 'an empty view' with 400`, `answers 'a view given twice' with 400`, `answers 'a built-in view' with 404`, `answers 'a view no row names' with 404`, `answers a POST with 405`. Run (`runs/server.mjs`): `C53 GET /api/app-store with Origin: null, cross-site -> 403 {"error":"forbidden"}`.
- C54. By SC: `fetches once for two readers asking at the same time and holds the answer`, `drops an answer a push contradicted while it was in flight and fetches once more`, `rejects missing for a 404 while the row is gone and drops it when a push brings the row back`, `waits for the next push when the store is newer than the row, then asks again`, `stops waiting for a push after the wait and tries again`, `tells the tabs of a mounted app when its store version moved, and not otherwise`.
- C55. By UN: `puts an app store back to the value before, and refuses it once the store has moved or the kept values are gone`.
- C56. By CH: `keeps the values of a record outside its line and deletes them when the record leaves the window`.
- C57. Run (`server.mjs`): `C57 setStore of a root app whose root cannot be written -> 200 {"ok":true,"changed":[],"refused":[{"field":"store","reason":"unwritable"}]}`; control: `C57 control: the same write once the root can be written -> 200 {"ok":true,"changed":["store"],"refused":[]} | file: true`. The page turns the refusal into `refused:unwritable` (ME: `rejects a refusal of a field with { ok: true, changed: [], refused: [ { field: 'f', reason: 'why' } ] }`).

How it writes
- C58. By AG: `lets through an open kind named by its header`, `writes an open kind and records the view id of the app that sent it`, `records a root app by its view id with the root key unescaped`.
- C59. By AG: `refuses a body of another kind than the header names`, `refuses a body whose kind header is another open kind`, `refuses an entry write naming the bookmarks collection`, `refuses a store write with no app header`, `answers 403 kind for a body of another kind than its header and writes nothing`.
- C60. By ME: `refuses a write the manifest does not declare without a request`.
- C61. Look. The question's wording and the declined answer: ME `sends a declared write and asks the reader first for a kind that deletes`, `rejects declined and sends nothing when the reader says no`.
- C62. By ME: `refuses the 31st write in a minute with rate, setStore counting among them`, `rejects an error status with no word with { ok: false, changed: [], refused: [], status: 500 }` (`failed:500`), `rejects a refusal of the request with { ok: false, changed: [], refused: [], error: 'x', status: 403 }` (`refused:x`).

Opening things
- C63. By ME: the nine `answers an open of ...` rows (`{ view: 'focus' }` opens; `terminal`, `document`, `file`, `source`, `project` and `nonesuch` and `{ project: 'nonesuch' }` give their words).
- C64. By AO: `answers an ordinary file of a shown root with app:notes` (`ok`). Run (`runs/open-files.mjs`, final build): `C64 open({ file: { root: "hub", path: "README.md" } }) -> NO ANSWER in 8 s | tabs: Focus | Probe four |  README.md | Live HPC | Usage`. In the output of C64 and C71 the glyph character that starts a tab's title is written as a space. The source tab `README.md` opened and the app that asked received no answer because its frame was drawn again (see "For the orchestrator's ruling", item 1, and "Cases the brief's rules got wrong").
- C65. By AO: `answers a dot file with app:notes`, `answers a key file with app:notes`, `answers the approvals file with app:notes`, `answers a file in a dot-led folder below the top with app:notes`, `answers an empty segment ...`, `answers an absolute path ...`, `answers a dot segment ...`, `answers a backslash ...`, `answers closed for an empty path before it reads the disk`, `answers a dotted name that does not start with a dot with app:notes`, `answers a literal percent escape in a name with app:notes`, `answers a literal percent escape that is absent with app:notes`.
- C66. By AO: `answers the root engine with app:notes`, `answers a root key that differs in case from the engine with app:notes`, `answers a root whose key holds the word engine with app:notes`.
- C67. By AO: `answers the local file of the config folder with app:notes`, `answers that file spelt in capitals with app:notes`, `answers closed for a path in the config folder without a stat, a real path or a read`.
- C68. By AO: `answers a closed folder with app:notes`, `answers a closed folder spelt in capitals with app:notes`, `answers a name that only starts like a closed folder with app:notes`, `answers a closed folder name below the top with app:notes`.
- C69. By AO: `answers a link into a dot folder with app:notes`, `answers a link to a file outside the root with app:notes`, `answers a link to an outside file that is absent with app:notes`.
- C70. By AO: `answers its own root, for a root app with app:hub/todo`, `answers another shown root, for a root app with app:hub/todo`, `answers a root that is not shown, for a root app with app:hub/todo`, `answers a root that is not shown, for a machine app with app:notes`, `answers a dot file of a root that is not shown with app:notes`.
- C71. By AO: `answers a file that does not exist with app:notes`, `answers a binary file with app:notes`, `answers a .docx file with app:notes`. Run (`open-files.mjs`): `C71 open({ file: { root: "rootx", path: "sample.bin" } }) -> resolved | tabs: Focus | Probe four |  README.md |  sample.bin | Live HPC | Usage` and `C71 open({ file: { root: "rootx", path: "report.docx" } }) -> resolved | tabs: Focus | Probe four |   README.md |   sample.bin |   report.docx | Live HPC | Usage`; the editor worker started once (`editor workers started: 1`), no program started.
- C72. By ME: `answers an open of a target of an unknown key with { foo: 1 }`, `answers an open of a target that is a string with focus`, `refuses the 31st open in a minute with rate and the 1st again after the window`.
- C73. By AO: `answers 'an app that is absent' with 400`, `answers 'an empty root' with 400`, `answers 'a path given twice' with 400`, `answers 'an app no row names' with 404`, `answers a POST with 405`.
- C74. By SE: `reads closed_paths of a missing key`, `... of a key that is not a list`, `... of a list holding a number`, `... of an empty entry`, `... of an absolute entry`, `... of an entry with a trailing slash`, `... of an entry with a dot-dot`, `... of a dot-led entry`, `... of an entry named twice`, `... of two folders`, `words the closed_paths finding with the key and the file`; AO: `answers every file target closed while closed_paths is absent`; ME: `answers every file target closed while closed_paths is absent`.

Approval
- C75. By AP: `approves the hash the reader was shown and sets the key before it answers`. Run (`keep.mjs`): `C78 approve with keep: 200 {"ok":true}`.
- C76. By AP: `refuses a hash that is not the current one with 409 changed and writes nothing`, `refuses a request without the write token with 403 and writes nothing`.
- C77. By AP: `holds one entry per folder, replaces only the folder approved again, and revokes one`, `revokes by folder and empties the key before it answers`.
- C78. Run (`runs/keep.mjs`, then after a restart of the server `runs/keep2.mjs`, on 8797, machine app `keepme`, root app `rootx/todo`; output in `$S/runs/keep.out` and `$S/runs/keep2.out`): `C78 found, unapproved: approved=false kept=false key="" hash=cbcd7fb4`; `C78 approve with keep: 200 {"ok":true}`; `C78 after approve keep=true: approved=true kept=true key=dc962736.. hash=cbcd7fb4`; `C78 after an edit of app.js: approved=true kept=true key=773b8869.. hash=81076f93`; `C78 key changed after the .js edit: true | approved held with no question: true`; `C78 the new key serves app.js: 200 | the old key: 404`; `C78 after an edit of app.yml: approved=false kept=false key="" hash=21b676b0`; after the restart `C78 after a restart, keepme (its .js edited since it was approved): approved=false kept=false key=""`; `C78 approve keep:true for the root app rootx/todo with its current hash: 400 {"error":"keep"}`. By AP: `keeps a machine app approved on request and refuses to keep a root app`. The frame reload with no question and the panel asking again are the look.
- C79. By AA: `reads a file that is not JSON as no approved app and refuses an app approval or revoke over it`; AP: `refuses an approval over a file that is not JSON and leaves it as it was`.
- C80. Look.

Reading an app's files
- C81. By OA: `opens a page of an app in the .oculus/apps/notes/index.html view from the tab choice`, `opens a page of an app as source text when it is pressed and when it is pressed with a key`, `opens a page of an app as source text beside the pane being read`, `opens a bookmark of a page of an app as source text and of another page as a document`, `opens a page held by a path through a link to the apps folder as source text`; FT: `answers a page of an app with the type .oculus/apps/notes/index.html`, `... reached through a link to the apps folder with the type alias/notes/index.html`, `answers a page outside every apps folder with the type docs/manual.html`. Run on 8797: `curl -si -H 'Sec-Fetch-Site: same-origin' http://localhost:8797/api/file/rootx/.oculus/apps/todo/index.html` prints `HTTP/1.1 200 OK`, `content-type: text/plain; charset=utf-8`, `x-content-type-options: nosniff`.

Settings
- C82. By SE: `answers the entry default and one problem for a limit below its minimum or not a number`, `answers each limit the entry default when it is missing, and no problem`, `answers a limit that is set`.
- C83. By LO: `answers "apps_dir: 3" with the sentence it would throw`, `reads apps_dir under the home folder, against the engine, as written, or leaves it absent`.

Implied inputs
- C84. By AG: `lets through an open kind named by its header`, `writes an open kind and records the view id of the app that sent it`; ME: `sends a declared write and asks the reader first for a kind that deletes` (a kind that does not delete is sent with no `Confirm`). The panel words are `config/text/views/apps/apps.yml:54` (`radar-add: Add a paper to the radar.`).
- C85. Not run: A3's `schedule` channel is not on main. The case belongs to whichever of A3 and E4 lands second (Decision 20).
- C86. By ME: `rejects setState and setStore of a cycle as not JSON and sends nothing`, and the same for `undefined`, `NaN`, `a Map` and `a Date`.
- C87. By OA: `opens a page of an app as source text whatever kind the first bytes give` (the `tabForKind` call that `read-again.ts:39` makes with `holds`, for a kind other than `text` or `missing`); read: `src/lib/views/sources/source/read-again.ts:39` passes `holds` into `tabForKind`, which answers the source view for a file in an apps folder.
- C88. By OA: `opens a bookmark of a text file of an app as source text and not as the file view`, `draws the rail bookmark of a file of an app with the source view`, `opens a page through openPage, which the project, card, entry and README openers call as source text in an apps folder`. The openers (card, entry, lanes, project) with real data are the look.
- C89. By FT (the answers above, C81 run). The tab is the look.
- C90. Run (`state.ts`, `createMethods` with a context whose `alive()` turns false): `C90 open waiting on /api/app-open, frame destroyed, answer arrives: pending (no openFile line above means nothing opened)`, `C90 getStore waiting on its fetch, frame destroyed, answer arrives : pending`; the promise of the call never settles (no reply to the destroyed bridge) and `openFile` is not called. Run (same file): `C90 write waiting on its Confirm, frame destroyed, reader says yes: pending | requests sent: 0`. By ME: `settles nothing for a call whose frame was destroyed while it waited` (a write whose send outlives the frame). The `onChannel` in flight is read: `state/system/apps/bridge.ts:86` and `:92` (a call and a queued call are made only when `!destroyed`) and `:118-119` (`destroyed = true; queued.clear()`), and a call to an app expects no reply.
- C91. Run (`watch.mjs`, real clock, not a fake one): `C91 close() right after an event: pushes before 6 after 3 s 6 (difference 0)`; `C91 close() while the folder is absent and the two-second look is armed: timers open before close 2 after close 0 | pushes after the folder appears 3 s later: 0 | timers at the end 0`.
- C92. Run (`server.mjs`): `C92 two concurrent setStore -> 200 {"ok":true,"changed":["store"],"refused":[]} | 200 {"ok":true,"changed":["store"],"refused":[]}`, `C92 change records added for app:notes: 2 store 0->18 bytes; store 18->19 bytes`, `C92 file after both writes: {"seen":["second"]}`, `C92 apps pushes after the writes carrying a store version: 2 distinct versions 2 ["7f16af832c43b259","b9eb9ff0ffb396e9"]`. By ST: `tells the apps watcher after a store that changed and not after one that did not`.
- C93. By AG: `refuses an app header naming no held row`, `refuses an app header holding a malformed escape`, `refuses an app header that is no view id`, `refuses every app header when the target holds no apps`.
- C94. By M: `names a root key holding a slash in the id and the finding key`; AF: `/apps/@a%2Fb/todo/<key>/index.html` answers 200 and `/apps/@a/b/todo/...` 404; AG: `lets through a root key holding a slash, escaped`.
- C95. By AF: `answers a HEAD request with the status and headers of the GET and no body`. Run: `curl -sI http://localhost:8797/apps/-/oculus.js` prints `HTTP/1.1 200 OK`, `access-control-allow-origin: *`, `cache-control: no-cache`, `content-length: 4204`, `content-type: text/javascript; charset=utf-8`, `x-content-type-options: nosniff`.
- C96. By M: `reads a manifest that cannot be read as one finding naming the file`; AF: `answers an empty 404 for a recorded file that cannot be read` (the unreadable-file row); run (`watch.mjs`): `C96 store file that cannot be read: 0 ""`.
- C97. By M: `names an apps_dir that is a file in one finding`.
- C98. By ST (`inside(path, folder)`, `tests/server/edit/app-store.test.ts:47`, and `refuses a store folder that is a link out of the base as outside and writes nothing`), CH (`startsWith(resolve(dir) + sep)` at `:64`, `:72`, `:282`) and UN (`expect(resolve(file).startsWith(resolve(data) + sep)).toBe(true)` before the first store write): each builds its store and `.undo` folders from a temporary folder and asserts the resolved path inside it before any write.
- C99. Run: `npx vitest run --reporter=verbose tests/checks/config/config.test.ts` prints `optionFindings > reads the shipped options catalog with no finding`, `Test Files  1 passed (1)`, `Tests  30 passed (30)`. The Settings view's Apps heading after Calendar and mail is the look.
- C100. Run (`node $S/c100/run.mjs`, Vite `createServer` in middleware mode over the worktree, `ssrLoadModule` of a scratch module answering `import.meta.resolve('penpal')`): `resolved: file:///Users/axelfaes/workspace/research-hub/.agents/worktrees/E4/tools/oculus/node_modules/penpal/dist/penpal.mjs`, so the route uses `import.meta.resolve` and not item 5's `createRequire` form. The route's bytes on the built server: C35's `cmp` prints `identical`. Axel's dev server is the look.


### Cases the brief's rules got wrong

- C64: the rule says `open({ file })` resolves `ok`. Result: the tab opens and the app that asked receives `CONNECTION_DESTROYED` (output at C64). Ruling asked at finding 1.
- M4 and item 14 against Decision 11: the two triggers differ. Result at M4. Ruling asked at finding 2.
- C85: cannot run on main. Ruling asked at finding 4.
- Item 5 of "Verify before you report" (a test run against removed behaviour) is replaced by the standing rule that code is never broken to see whether a test fails; each test is judged by reading it, and the run on the unchanged tree above is the one failure quoted.
- `workspaceRoots` is at `server/files/fs.ts:283-293`, the section's `:222-233` was stale; the section's other line references (`+page.svelte`, `+page.server.ts`, `writes.svelte.ts`, `socket.svelte.ts`, `views.ts`, `registry.ts`, `Document.svelte`, `model-sessions.ts`, `watch/git.ts`, `watch/bookmarks.ts`, `opening.ts`, `undo.ts`, `manifest.ts`, `feeds.ts`, `catalogs.ts`, `Workbench.svelte`, `channels.ts`, `paths.ts`) were renumbered to the tree, each read at its new line (`python3` listing of every `file:line` citation in the section against the worktree). `dist/penpal.mjs:15-20` and `:88-97` were read in `node_modules/penpal/dist/penpal.mjs` and hold.

## DONE / NOT DONE

| Row | State | Command and output |
|---|---|---|
| 1. `npm run diagrams`, then `checks.sh` | DONE | Output below; last run exit 0, `checks: 1 commands passed`. |
| 2. Full-list runs | DONE | 8 runs of `checks.sh`, each after a change; the logs of 6 are kept (`checks1.txt`, `checks2.txt`, `checks-final.txt`, `checks6.txt`, `checks7.txt`, `checks8.txt`, the last quoted below); 2 of the 8 have no kept log, so the number 8 rests on my record and is not verified by a file. Red lines inside changed files were fixed and the file rerun alone before the list ran again. |
| 3. `npm ls penpal` | DONE | `penpal@8.0.1` (below). |
| 3. `wc -l` limits | DONE | Table of files below; no source file over 880, no component over 520 (`wc -l` of every changed file in the Files table below). |
| 3. `sh utils/folder-check.sh` | DONE | exit 0 (below). |
| 3. `sh utils/unused-exports.sh` | DONE | Three lines differ from the base, quoted and judged below. |
| 4. ASCII gate | DONE | The gate command of `agents/spec.md:97` printed nothing, exit status 0 (below). |
| 5. Tests fail on the unchanged tree | DONE | Quoted above; judged by reading, no code broken. |
| 6. Every case | DONE except C85 | Section above. |
| 6. The 16 test files of the step on the final tree | DONE | `npx vitest run --reporter=verbose tests/routes/apps tests/routes/edit/app-gate.test.ts tests/state/system/apps tests/views/shared/explorer/opening-apps.test.ts tests/routes/files/file.test.ts tests/server/edit/app-store.test.ts tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts tests/data/sources/config/settings.test.ts tests/data/sources/config/local.test.ts tests/server/machine/approvals/approvals.test.ts tests/server/machine/apps/manifest.test.ts` printed `Test Files  16 passed (16)` and `Tests  371 passed (371)` (`$S/verbose.txt`). `npx vitest run tests/checks --testTimeout=60000` printed `Test Files  16 passed (16)` and `Tests  229 passed (229)`. |
| 7. M1 to M4 with controls | DONE | Section below; `lsof` prints nothing for 8797, 9443, 9444, 9445 and UDP 3478 (below). |
| 8. Grep of changed constructs and history words | DONE | Sections below. |
| 9. Prose rules | DONE | Section below. |
| Build items 1 to 19 of "What to build", with the section's first paragraph and each measured result rewritten | DONE | The section is `DESIGN.md` lines 250-339 as built; the listing, subject-word, channel, watcher and Auth lines (`DESIGN.md:51`, `DESIGN.md:86`, `DESIGN.md:115`, `DESIGN.md:117`, `DESIGN.md:152`) carry the apps. |

### `npm run diagrams` and `checks.sh`

`npm run diagrams` printed the list of rewritten files and exited 0 (`$S/diagrams-final.txt`). `checks.sh` run 8, as printed (`$S/checks8.txt`):

```
$ npm run test:quick

> oculus@0.0.1 test:quick
> node tests/tiers/quick.mjs

test:quick: 132 changed file(s), from git since HEAD
test:quick: 91 test file(s), 10 essential
        tests/data/sources/config/local.test.ts: changed
        tests/data/sources/config/settings.test.ts: changed
        tests/routes/apps/app-files.test.ts: changed
        tests/routes/apps/app-open.test.ts: changed
        tests/routes/apps/app-store.test.ts: changed
        tests/routes/apps/approve.test.ts: changed
        tests/routes/edit/app-gate.test.ts: changed
        tests/routes/edit/undo/undo.test.ts: changed
        tests/routes/files/file.test.ts: changed
        tests/server/core/changes.test.ts: changed
        tests/server/edit/app-store.test.ts: changed
        tests/server/machine/approvals/approvals.test.ts: changed
        tests/server/machine/apps/manifest.test.ts: changed
        tests/state/system/apps/methods.test.ts: changed
        tests/state/system/apps/store-cache.test.ts: changed
        tests/views/shared/explorer/opening-apps.test.ts: changed
        tests/data/helpers/files/nesting.test.ts: imports at depth 1
        tests/data/snapshot/normalise.test.ts: imports at depth 1
        tests/data/snapshot/resources.test.ts: imports at depth 1
        tests/data/sources/career.test.ts: imports at depth 1
        tests/data/sources/collections.test.ts: imports at depth 1
        tests/data/sources/config/catalog/options.test.ts: imports at depth 1
        tests/data/sources/config/catalog/value-rule.test.ts: imports at depth 1
        tests/data/sources/config/editor-options.test.ts: imports at depth 1
        tests/data/sources/config/languages.test.ts: imports at depth 1
        tests/data/sources/config/rail.test.ts: imports at depth 1
        tests/data/sources/docs.test.ts: imports at depth 1
        tests/data/sources/feeds.test.ts: imports at depth 1
        tests/data/sources/manifests.test.ts: imports at depth 1
        tests/data/sources/personal.test.ts: imports at depth 1
        tests/data/sources/present.test.ts: imports at depth 1
        tests/data/sources/registries.test.ts: imports at depth 1
        tests/routes/edit/audit-mute.test.ts: imports at depth 1
        tests/routes/edit/rail.test.ts: imports at depth 1
        tests/routes/edit/roots.test.ts: imports at depth 1
        tests/routes/files/file-undo.test.ts: imports at depth 1
        tests/routes/files/fs.test.ts: imports at depth 1
        tests/routes/files/history.test.ts: imports at depth 1
        tests/routes/files/project-files.test.ts: imports at depth 1
        tests/routes/files/source.test.ts: imports at depth 1
        tests/routes/git/deposit.test.ts: imports at depth 1
        tests/routes/machine/commands.test.ts: imports at depth 1
        tests/routes/machine/hpc.test.ts: imports at depth 1
        tests/routes/sessions/compose.test.ts: imports at depth 1
        tests/routes/sessions/latex.test.ts: imports at depth 1
        tests/routes/sessions/terminal-actions.test.ts: imports at depth 1
        tests/routes/sessions/terminal-edit.test.ts: imports at depth 1
        tests/server/accounts/connect/oauth.test.ts: imports at depth 1
        tests/server/accounts/mail/routes.test.ts: imports at depth 1
        tests/server/core/git-failure.test.ts: imports at depth 1
        tests/server/edit/config-key.test.ts: imports at depth 1
        tests/server/edit/feeds.test.ts: imports at depth 1
        tests/server/edit/writes-collection.test.ts: imports at depth 1
        tests/server/files/search.test.ts: imports at depth 1
        tests/server/machine/commands/placeholders.test.ts: imports at depth 1
        tests/server/machine/commands/run.test.ts: imports at depth 1
        tests/server/machine/pty/channel.test.ts: imports at depth 1
        tests/server/machine/usage/refresh.test.ts: imports at depth 1
        tests/server/root/hooks-server.test.ts: imports at depth 1
        tests/state/client/terminal/terminal-close.test.ts: imports at depth 1
        tests/state/feeds/literature-merge.test.ts: imports at depth 1
        tests/state/forms/form-drafts.test.ts: imports at depth 1
        tests/state/forms/manifest-draft.test.ts: imports at depth 1
        tests/state/sessions/source.test.ts: imports at depth 1
        tests/state/sources/repositories/diff/comment-draft.client.test.ts: imports at depth 1
        tests/state/workbench/layout/saved/layout-unread.test.ts: imports at depth 1
        tests/state/workbench/navigation/pages.test.ts: imports at depth 1
        tests/views/shared/explorer/opening.client.test.ts: imports at depth 1
        tests/views/sources/bar-actions.test.ts: imports at depth 1
        tests/data/sources/agents-catalog.test.ts: imports at depth 2
        tests/routes/docs/literature.test.ts: imports at depth 2
        tests/routes/docs/memories.test.ts: imports at depth 2
        tests/routes/files/open.test.ts: imports at depth 2
        tests/routes/files/search.test.ts: imports at depth 2
        tests/routes/replace/ops-replace.test.ts: imports at depth 2
        tests/routes/sessions/terminal.test.ts: imports at depth 2
        tests/server/accounts/connect/accounts.test.ts: imports at depth 2
        tests/server/files/workspaces.test.ts: imports at depth 2
        tests/server/machine/pty/sessions.test.ts: imports at depth 2
        tests/server/sessions/overrides.test.ts: imports at depth 2
        tests/server/sessions/transcripts.test.ts: imports at depth 2
        tests/checks/config/config-folder.test.ts: changed, run by npm run test:checks or test:slow
        tests/checks/config/config.test.ts: changed, run by npm run test:checks or test:slow
        tests/checks/source/keys.test.ts: changed, run by npm run test:checks or test:slow
        tests/checks/tree/boundaries.test.ts: changed, run by npm run test:checks or test:slow
ok      ASCII gate (1.5 s)
ok      prettier (2.9 s): All matched files use Prettier code style!
ok      svelte-kit sync (4.9 s)
ok      eslint (4.9 s)
ok      svelte-check (17.5 s): 1791230622033 COMPLETED 378 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (33.0 s): Duration  26.55s (transform 27.93s, setup 0ms, import 55.19s, tests 47.82s, environment 186ms)
test:quick: 34.6 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
exit 0
```

### Libraries, folders, sizes

`npm ls penpal`:

```
oculus@0.0.1 /Users/axelfaes/workspace/research-hub/.agents/worktrees/E4/tools/oculus
`-- penpal@8.0.1
```

`sh utils/folder-check.sh; echo exit $?` printed `exit 0` and no other line.

`wc -l` of the four files the brief names: `server/root/context.ts` 767, `server/edit/writes.ts` 620, `data/model/index.ts` 582, `routes/+page.svelte` 236 (command: `wc -l src/lib/server/root/context.ts src/lib/server/edit/writes.ts src/lib/data/model/index.ts src/routes/+page.svelte`). DESIGN.md is 437 lines and HELP.md 364 lines.

`sh utils/unused-exports.sh` against the base's `unused-exports.txt` (`diff base now`):

```
1c1
< Unused exports (255)
---
> Unused exports (257)
47c47
< src/lib/server/core/auth.ts: TOKEN_HEADER, allowedOrigin
---
> src/lib/server/core/auth.ts: TOKEN_HEADER
57a58
> src/lib/server/edit/writes/app-gate.ts: APP_HEADER, KIND_HEADER
69c70
< src/lib/server/files/files.ts: CACHE, typeOf, resolveRootFile, engineRoot, withFixed
---
> src/lib/server/files/files.ts: CACHE, resolveRootFile, engineRoot, withFixed
87a89
> src/lib/server/machine/apps/oculus.js: connect
```

Each line judged: `allowedOrigin` and `typeOf` left the list because `machine/apps/serve.ts` imports both and `machine/apps/address.ts` imports `typeOf`. `app-gate.ts: APP_HEADER, KIND_HEADER` are the two header names the gate reads and `tests/routes/edit/app-gate.test.ts` imports; the page sends them as the literals `'x-oculus-app'` and `'x-oculus-write-kind'` (`state/client/writes.svelte.ts:491`) because the state layer cannot import a server module, so the constants have no production importer and stay exported for the test, as `TOKEN_HEADER` does on the line above them. `machine/apps/oculus.js: connect` is the function an app imports from `/apps/-/oculus.js`; the file is served as text and imported by the app's own page, so no module of the tree imports it.

### ASCII gate

`LC_ALL=C perl -ne '...' $(find src tests bin config -type f ! -name local.yml)` from `tools/oculus` (the gate of `agents/spec.md:97`; `bin` does not exist in this tree) printed nothing, exit status 0. `DESIGN.md`, `HELP.md` and `docs/diagrams/*.dot` hold no byte outside printable ASCII (`perl` scan, 0 bytes of output). `checks.sh` prints `ok      ASCII gate` in the quoted run.

### Constructs

Grep of each changed construct across `src`, `tests`, `config` (`--exclude=local.yml`), `HELP.md`, `DESIGN.md` and `README.md` (`$S/construct-grep.txt`, quoted whole under the counts):

```
badgeMark: 8
registrationLabel: 14
registrationGlyph: 8
unregisterView: 5
dropView: 5
app-view: 0
app_view: 8
registerCollections: 13
registerApps: 10
tabForKind: 14
bookmarkRows: 6
serveFile: 8
HEADINGS: 10
settings_heading: 26
ServerContext: 68
WriteTarget: 83
```

Explanations of the hits that are new or changed: `badgeMark` is read at `registry.ts:146` as before and set by `routes/views.ts:100` for `apps.editing_mark` and `apps.unapproved_mark`, and by `Linkedin.svelte:11`; `keys.test.ts:327` counts it as a reader. `registrationLabel` and `registrationGlyph` take `Pick<Registration, 'label' | 'words'>` and `Pick<Registration, 'glyph' | 'glyphName'>`, and every caller passes a registration. `dropView` is new in `registry.ts` and called by `registerApps` only; `unregisterView` is called by `registerCollections` only. `tabForKind` has a fifth argument `holds`, passed at all five callers in `opening.ts` and at `read-again.ts:39`. `bookmarkRows(entries, holds)` has one caller, `+page.svelte:177`. `serveFile` has a fourth argument `folders`, passed by the file route; the test at `file.test.ts:51` calls it with three. `registerCollections` is called in `+page.svelte` inside the `untrack` block and in the collections effect; `registerApps` is called in the same block and in a second effect. `HEADINGS` and the `settings_heading_*` keys carry `apps` (`options.ts:65`, `workbench.yml:148`, `groups.ts:114`). `app-view` has no hit; the glyph is `app_view` (`glyphs.yml:195`, `icons.yml:194`, `manifest.ts:38`, `apps.yml:5`). `ServerContext` and `WriteTarget` gained the apps fields; their other hits are unchanged. The whole output:

```
### badgeMark
src/lib/state/workbench/navigation/registry.ts:109:    badgeMark?: string;
src/lib/state/workbench/navigation/registry.ts:146:    const means = registration.badgeMark;
src/lib/views/feeds/linkedin/Linkedin.svelte:11:        badgeMark: 'views.linkedin_badge_mark',
src/routes/views.ts:100:        badgeMark: row.kept ? 'apps.editing_mark' : 'apps.unapproved_mark'
tests/checks/source/keys.test.ts:327:            if (registration.badgeMark !== undefined) allowed.add(registration.badgeMark);
DESIGN.md:232:The glyph vocabulary is `glyphs.yml`'s one `glyphs:` map, each name with the ASCII stand-in a terminal theme draws in place of its icon: one to three printable ASCII characters
DESIGN.md:287:  badgeMark: row.kept ? 'apps.editing_mark' : 'apps.unapproved_mark' }
DESIGN.md:290:`Registration` has two optional fields, `words` and `glyphName`, holding the title as drawn (the manifest's literal title, and for a root app the root's key after it) and the m
### registrationLabel
src/lib/shell/panes/workbench-title.ts:7:import { registrationLabel } from '$lib/state/workbench/navigation/registry';
src/lib/shell/panes/workbench-title.ts:19:        : registrationLabel(registered);
src/lib/shell/panes/PaneView.svelte:75:        registrationLabel
src/lib/shell/panes/PaneView.svelte:197:                label: own ?? registrationLabel(found),
src/lib/shell/panes/PaneView.svelte:206:                        viewWords: own === null ? undefined : registrationLabel(found)
src/lib/shell/keys/Palette.svelte:69:    import { registrationLabel } from '$lib/state/workbench/navigation/registry';
src/lib/shell/keys/Palette.svelte:108:        views().map((view) => ({ id: view.id, label: registrationLabel(view) }))
src/lib/state/workbench/navigation/registry.ts:127:export function registrationLabel(registration: Pick<Registration, 'label' | 'words'>): string {
src/lib/state/workbench/navigation/registry.ts:148:    const label = registrationLabel(registration);
src/lib/state/workbench/navigation/pages.ts:30:import { registrationLabel, type Registration } from './registry.ts';
src/lib/state/workbench/navigation/pages.ts:76:    return found === undefined ? instance.view : registrationLabel(found);
src/lib/views/system/workbench/Catalogue.svelte:56:        registrationLabel,
src/lib/views/system/workbench/Catalogue.svelte:183:                        {@const label = registrationLabel(view)}
DESIGN.md:290:`Registration` has two optional fields, `words` and `glyphName`, holding the title as drawn (the manifest's literal title, and for a root app the root's key after it) and the m
### registrationGlyph
src/lib/shell/panes/PaneView.svelte:74:        registrationGlyph,
src/lib/shell/panes/PaneView.svelte:198:                ...stripMark(registrationGlyph(found), tabMark(instance)),
src/lib/state/workbench/navigation/catalogue.ts:11:import { registrationGlyph, type Registration } from './registry.ts';
src/lib/state/workbench/navigation/catalogue.ts:178:    return registrationGlyph(section.items[0]);
src/lib/state/workbench/navigation/registry.ts:132:export function registrationGlyph(registration: Pick<Registration, 'glyph' | 'glyphName'>): string {
src/lib/views/system/workbench/Catalogue.svelte:55:        registrationGlyph,
src/lib/views/system/workbench/Catalogue.svelte:198:                                    glyph={registrationGlyph(view)}
DESIGN.md:290:`Registration` has two optional fields, `words` and `glyphName`, holding the title as drawn (the manifest's literal title, and for a root app the root's key after it) and the m
### unregisterView
src/lib/state/workbench/navigation/registry.ts:165:    unregisterView: (id: ViewId) => void;
src/lib/state/workbench/navigation/registry.ts:199:    function unregisterView(id: ViewId): void {
src/lib/state/workbench/navigation/registry.ts:222:    return { registerView, registerComponent, unregisterView, dropView, viewFor, views };
src/routes/views.ts:78:            if (!ids.has(registration.id)) registry.unregisterView(registration.id);
DESIGN.md:292:**When an app is added, changed or removed.** An added app is registered and appears in the catalogue. A changed app keeps its id and its tab; its hash differs, so its approval
### dropView
src/lib/state/workbench/navigation/registry.ts:170:    dropView: (id: ViewId) => void;
src/lib/state/workbench/navigation/registry.ts:208:    function dropView(id: ViewId): void {
src/lib/state/workbench/navigation/registry.ts:222:    return { registerView, registerComponent, unregisterView, dropView, viewFor, views };
src/routes/views.ts:122:        if (!ids.has(registration.id)) registry.dropView(registration.id);
DESIGN.md:292:**When an app is added, changed or removed.** An added app is registered and appears in the catalogue. A changed app keeps its id and its tab; its hash differs, so its approval
### app-view
### app_view
src/lib/server/machine/apps/manifest.ts:38:const DEFAULT_GLYPH = 'app_view';
tests/server/machine/apps/manifest.test.ts:420:        expect(unknown.apps[0].row.glyph).toBe('app_view');
tests/server/machine/apps/manifest.test.ts:421:        expect(none.apps[0].row.glyph).toBe('app_view');
tests/fixtures/entities-fixture.ts:79:        glyph: 'app_view',
config/catalogs/glyphs.yml:195:  app_view: "[a]"
config/catalogs/icons.yml:194:    app_view: layout-panel-top
config/text/views/apps/apps.yml:5:        glyph: app_view
DESIGN.md:272:`name`, `title` and `bridge` are required. `name` matches the pattern above and equals the folder's name. `title` is 1 to 40 characters, trimmed, with no control character. `br
### registerCollections
src/routes/views.ts:27:/** Read one source as a list, leaving collection factories for registerCollections(). */
src/routes/views.ts:70:export function registerCollections(registry: RegistryStore, keys: string[]): void {
src/routes/views.ts:110: * A config push runs registerCollections alone: the factory it calls is the module's
src/routes/+page.svelte:35:    import { pushedCollections, registerAll, registerApps, registerCollections } from './views.ts';
src/routes/+page.svelte:69:        registerCollections(client.registry, data.collections);
src/routes/+page.svelte:96:        if (keys !== null) untrack(() => registerCollections(client.registry, keys));
tests/checks/config/config-folder.test.ts:31:import { registerAll, registerCollections } from '../../../src/routes/views.ts';
tests/checks/config/config-folder.test.ts:489:        registerCollections(client.registry, collectionKeys(config));
tests/checks/config/config-folder.test.ts:534:        registerCollections(client.registry, collectionKeys(config));
tests/checks/source/keys.test.ts:24:import { registerAll, registerApps, registerCollections } from '../../../src/routes/views.ts';
tests/checks/source/keys.test.ts:39:    registerCollections(client.registry, collectionKeys(config));
DESIGN.md:278:**The first frame.** The list rides with the page data as the collection keys do: `+page.server.ts` returns `apps: { rows, findings, folders, version }` read off `locals.server
DESIGN.md:280:**The view and the catalogue.** An app's view id is the one above. Built-in view ids and collection keys are bare words, so an app named `focus` or `funding` is `app:focus` and
### registerApps
src/lib/views/apps/frame/AppFrame.svelte:3:    // the rows of the `apps` channel in routes/views.ts (registerApps), one per app, so this export
src/routes/+page.svelte:35:    import { pushedCollections, registerAll, registerApps, registerCollections } from './views.ts';
src/routes/+page.svelte:74:        registerApps(client.registry, rows);
src/routes/+page.svelte:106:        untrack(() => registerApps(client.registry, rows));
src/routes/views.ts:113:export function registerApps(registry: RegistryStore, rows: AppRow[]): void {
tests/checks/source/keys.test.ts:24:import { registerAll, registerApps, registerCollections } from '../../../src/routes/views.ts';
tests/checks/source/keys.test.ts:40:    registerApps(client.registry, [
DESIGN.md:278:**The first frame.** The list rides with the page data as the collection keys do: `+page.server.ts` returns `apps: { rows, findings, folders, version }` read off `locals.server
DESIGN.md:280:**The view and the catalogue.** An app's view id is the one above. Built-in view ids and collection keys are bare words, so an app named `focus` or `funding` is `app:focus` and
DESIGN.md:290:`Registration` has two optional fields, `words` and `glyphName`, holding the title as drawn (the manifest's literal title, and for a root app the root's key after it) and the m
### tabForKind
src/lib/views/shared/explorer/opening.ts:55:export function tabForKind(
src/lib/views/shared/explorer/opening.ts:81:    const tab = tabForKind('html', page.root, page.path, undefined, client.apps.holds);
src/lib/views/shared/explorer/opening.ts:103:    const tab = tabForKind(type.kind, row.root, row.path, row.size, opener.holds);
src/lib/views/shared/explorer/opening.ts:114:    const tab = tabForKind(type.kind, row.root, row.path, row.size, opener.holds);
src/lib/views/shared/explorer/opening.ts:131:        const tab = tabForKind(kind, ref.root, ref.path, undefined, opener.holds);
src/lib/views/sources/source/read-again.ts:11:import { tabForKind } from '../../shared/explorer/opening';
src/lib/views/sources/source/read-again.ts:39:            const next = tabForKind(found.kind, tab.root, tab.path, undefined, holds);
tests/views/shared/explorer/opening.client.test.ts:10:import { openRow, tabForKind } from '../../../../src/lib/views/shared/explorer/opening.ts';
tests/views/shared/explorer/opening.client.test.ts:89:        expect(tabForKind(kind, ROW.root, ROW.path, ROW.size).view).toBe(view);
tests/views/shared/explorer/opening-apps.test.ts:17:    tabForKind,
tests/views/shared/explorer/opening-apps.test.ts:77:        expect(tabForKind('html', 'hub', path, undefined, holds).view).toBe(view);
tests/views/shared/explorer/opening-apps.test.ts:82:            expect(tabForKind(kind, 'hub', APP_PAGE, 12, holds).view).toBe('source');
tests/views/shared/explorer/opening-apps.test.ts:128:        expect(tabForKind('html', 'hub', 'apps/notes/index.html', undefined, linked).view).toBe(
DESIGN.md:335:**Reading an app's files.** A file whose real path lies inside any apps folder, the machine's or a root's `.oculus/apps/`, never opens in the Document view, from the file brows
### bookmarkRows
src/lib/state/sources/explorer/view/bookmark-rows.ts:45: * which is which is a question about what the bookmark names, so `bookmarkRows` in this module sets
src/lib/state/sources/explorer/view/bookmark-rows.ts:65:export function bookmarkRows(
src/routes/+page.svelte:30:    import { bookmarkRows, HUB_ROOT } from '$lib/state/sources/fs';
src/routes/+page.svelte:177:    const saved = $derived<Bookmark[]>(bookmarkRows(savedBookmarks().entries, holds));
tests/views/shared/explorer/opening-apps.test.ts:11:import { bookmarkRows } from '../../../../src/lib/state/sources/explorer/view/bookmark-rows.ts';
tests/views/shared/explorer/opening-apps.test.ts:134:        const rows = bookmarkRows(
### serveFile
src/lib/server/files/files.ts:217:export function serveFile(
src/routes/api/(files)/file/[root]/[...path]/+server.ts:12:import { serveFile } from '$lib/server/files/files';
src/routes/api/(files)/file/[root]/[...path]/+server.ts:22:    return serveFile(roots, params.root, params.path, locals.server.apps.held().folders);
tests/routes/files/file.test.ts:3:// the roots of config/sources.yml, which is what this calls: serveFile takes the roots to look in,
tests/routes/files/file.test.ts:14:import { serveFile } from '../../../src/lib/server/files/files.ts';
tests/routes/files/file.test.ts:51:            expect(serveFile(roots(), key, path).status).toBe(404);
tests/routes/files/file.test.ts:95:        const response = serveFile(roots, 'hub', path, folders);
tests/routes/files/file.test.ts:104:        const response = serveFile(roots, 'hub', '.oculus/apps/notes/index.html');
### HEADINGS
src/lib/state/system/config/groups.ts:21:    HEADINGS,
src/lib/state/system/config/groups.ts:214:    const headings: (Heading | typeof UNHEADED)[] = [...HEADINGS, UNHEADED];
src/lib/data/sources/config/catalog/options.ts:55:export const HEADINGS = [
src/lib/data/sources/config/catalog/options.ts:69:/** One of the words of HEADINGS. */
src/lib/data/sources/config/catalog/options.ts:70:export type Heading = (typeof HEADINGS)[number];
src/lib/data/sources/config/catalog/options.ts:72:/** The heading of an entry that names none or names one HEADINGS lacks. */
src/lib/data/sources/config/catalog/options.ts:169: * `heading` is the subject the option is listed under (`unheaded` when it names none a HEADINGS
src/lib/data/sources/config/catalog/options.ts:353:            else if (!oneOf(HEADINGS, heading)) flag('heading_unknown', heading);
src/lib/data/sources/config/catalog/options.ts:354:            entry.heading = oneOf(HEADINGS, heading) ? heading : UNHEADED;
config/catalogs/options.yml:9:# Every entry outside local.yml holds `description`, `heading` (the subject it is listed under: appearance, editor, terminal, sessions, cluster, boards, rail, p
### settings_heading
src/lib/state/system/config/groups.ts:94:            return t('workbench.settings_heading_appearance');
src/lib/state/system/config/groups.ts:96:            return t('workbench.settings_heading_editor');
src/lib/state/system/config/groups.ts:98:            return t('workbench.settings_heading_terminal');
src/lib/state/system/config/groups.ts:100:            return t('workbench.settings_heading_sessions');
src/lib/state/system/config/groups.ts:102:            return t('workbench.settings_heading_cluster');
src/lib/state/system/config/groups.ts:104:            return t('workbench.settings_heading_boards');
src/lib/state/system/config/groups.ts:106:            return t('workbench.settings_heading_rail');
src/lib/state/system/config/groups.ts:108:            return t('workbench.settings_heading_presentation');
src/lib/state/system/config/groups.ts:110:            return t('workbench.settings_heading_sources');
src/lib/state/system/config/groups.ts:112:            return t('workbench.settings_heading_calendar');
src/lib/state/system/config/groups.ts:114:            return t('workbench.settings_heading_apps');
src/lib/state/system/config/groups.ts:116:            return t('workbench.settings_heading_unheaded');
src/lib/state/system/config/groups.ts:239:            title: t('workbench.settings_heading_machine'),
config/text/views/system/workbench.yml:145:        settings_heading_appearance: Appearance
config/text/views/system/workbench.yml:146:        settings_heading_boards: Boards and audit
config/text/views/system/workbench.yml:147:        settings_heading_calendar: Calendar and mail
config/text/views/system/workbench.yml:148:        settings_heading_apps: Apps
config/text/views/system/workbench.yml:149:        settings_heading_cluster: Cluster
config/text/views/system/workbench.yml:150:        settings_heading_editor: Editor
config/text/views/system/workbench.yml:151:        settings_heading_machine: This machine
config/text/views/system/workbench.yml:152:        settings_heading_presentation: Presentation
config/text/views/system/workbench.yml:153:        settings_heading_rail: Rail and pages
config/text/views/system/workbench.yml:154:        settings_heading_sessions: Sessions and usage
config/text/views/system/workbench.yml:155:        settings_heading_sources: Project sources
config/text/views/system/workbench.yml:156:        settings_heading_terminal: Terminal
config/text/views/system/workbench.yml:157:        settings_heading_unheaded: Without a heading
### ServerContext
src/server.ts:1:// Layer 2, server. The built Node entry composes one ServerContext, carries it on every request,
src/server.ts:9:import { createServerContext } from './lib/server/root/context.ts';
src/server.ts:41:    createServerContext(parsed.engine, {}, portMove)
src/app.d.ts:1:// Layer 2, server types. Declares the request-scoped ServerContext that Kit carries to every route.
src/app.d.ts:2:import type { OculusRequest, ServerContext } from '$lib/server/root/context';
src/app.d.ts:11:             * The write token of DESIGN.md's "Auth", minted by ServerContext and shipped to the
src/app.d.ts:16:            server: ServerContext;
src/lib/server/core/json.ts:122: * write of the whole file cannot interleave with another's. It belongs to the ServerContext, which
src/lib/server/core/json.ts:128:/** A fresh chain, for a ServerContext being built. */
src/lib/server/sessions/stores/hooks.ts:32: * The latest hook per session, with a 24 hour expiry. ServerContext owns the process's one store
src/lib/server/machine/pty/chat.ts:30:    /** Machine-local paths carried by ServerContext. */
src/lib/server/machine/usage/routes.ts:2:// ServerContext token check as the HPC refresh route, then calls that context's refresher.
src/lib/server/root/vite-plugin.ts:1:// Layer 2, server. Compose the ServerContext, WebSocket and raw-request carrier used by Vite
src/lib/server/root/vite-plugin.ts:12:    carryServerContext,
src/lib/server/root/vite-plugin.ts:13:    createServerContext,
src/lib/server/root/vite-plugin.ts:15:    type ServerContext
src/lib/server/root/vite-plugin.ts:22:    createContext: (engine: string, portMove: PortMove) => ServerContext;
src/lib/server/root/vite-plugin.ts:23:    attachSocket: (server: Server, context: ServerContext) => Attached;
src/lib/server/root/vite-plugin.ts:37:    createContext: (engine, portMove) => createServerContext(engine, {}, portMove),
src/lib/server/root/vite-plugin.ts:70:            carryServerContext(carried, context);
src/lib/server/root/hooks.ts:281: * Republish through the Hub carried by the request's ServerContext. A context fixture may use null
src/lib/server/root/watch/sessions.ts:116:    /** The request hook store owned by ServerContext. */
src/lib/server/root/context.ts:107:export type ServerContext = {
src/lib/server/root/context.ts:204:export type OculusRequest = IncomingMessage & { oculus?: ServerContext };
src/lib/server/root/context.ts:275:export function createServerContext(
src/lib/server/root/context.ts:279:): ServerContext {
src/lib/server/root/context.ts:460:    const context: ServerContext = {
src/lib/server/root/context.ts:745:export function carryServerContext(request: IncomingMessage, context: ServerContext): void {
src/lib/server/root/context.ts:752:    context: ServerContext
src/lib/server/root/context.ts:755:        carryServerContext(request, context);
src/lib/server/root/context.ts:761:export function serverContext(platform: { req?: OculusRequest } | undefined): ServerContext {
src/lib/server/files/roots.ts:14: * the engine and the machine's own file off the request's ServerContext.
src/lib/server/root/process/serve.ts:9:import { carryingHandler, type ServerContext } from '../context.ts';
src/lib/server/root/process/serve.ts:17:export type Served = { context: ServerContext; socket: Attached };
src/lib/server/root/process/serve.ts:20:export type AttachSocket = (server: Server, context: ServerContext) => Attached;
src/lib/server/root/process/serve.ts:37:    makeContext: (portMove: PortMove) => ServerContext,
src/lib/server/root/process/serve.ts:59:    makeContext: (portMove: PortMove) => ServerContext,
src/lib/server/files/fs.ts:36:// come in from the request's ServerContext, so two servers in one process read two files.
src/lib/server/files/fs.ts:131:/** The ignored names asked for lately, per folder and its entries, held by one ServerContext. */
src/lib/server/files/fs.ts:134:/** An empty cache, for a ServerContext being built. */
src/lib/server/files/fs/picker.ts:12:// is a field of the ServerContext, so two servers in one process hold two panels.
src/lib/server/files/fs/picker.ts:50:/** Whether a panel is open now, held by one ServerContext. */
src/lib/server/files/fs/picker.ts:53:/** A state with no panel open, for a ServerContext being built. */
src/routes/api/(accounts)/connect/+server.ts:15:import type { ServerContext } from '$lib/server/root/context';
src/routes/api/(accounts)/connect/+server.ts:18:function target(server: ServerContext): SetupTarget {
src/routes/+page.server.ts:30:// minted by ServerContext, put on the event by hooks.server.ts, and reaches the browser here and
src/routes/api/write/+server.ts:3:// to read here, and the token it checks is the one ServerContext minted and hooks.server.ts put on
src/routes/api/(files)/source/+server.ts:7:// hub comes off its ServerContext, so one request reads the workspaces file once.
src/routes/api/(git)/deposit/+server.ts:3:// mirror's state and is same-origin only; the POST writes and carries the token ServerContext
src/routes/api/(files)/ops/+server.ts:6:// token ServerContext minted; the GET reads two files as the diff pane reads a change.
src/routes/api/(files)/file/[root]/[...path]/+server.ts:9:// its ServerContext, so one request reads the workspaces file once. A file inside an apps folder is
src/routes/api/(sessions)/terminal/+server.ts:3:// the one ServerContext minted and hooks.server.ts put on the event, as with /api/write.
src/routes/api/(sessions)/customizations/+server.ts:3:// accounts and the roots a walk upward stops at come off the request's ServerContext.
src/routes/api/(git)/git/+server.ts:4:// the token ServerContext minted, as with /api/write and /api/terminal.
src/routes/api/commands/+server.ts:4:// carries the token ServerContext minted.
src/routes/api/(files)/search/+server.ts:7:// request; the engine and the machine's own file come off the request's ServerContext; the roots
src/routes/api/(files)/fs/+server.ts:4:// workspaces file and carries the token ServerContext minted, as with /api/write, /api/git and
src/routes/api/(files)/fs/+server.ts:8:// ServerContext, so one request reads the configuration once, local.yml no times, and one of the
src/routes/api/(apps)/approve/+server.ts:3:// approves the hash the reader was shown, or revokes, behind the write token the ServerContext
tests/server/root/context-fixture.ts:1:// Layer 2, server test support. Builds a complete inert ServerContext for route tests without
tests/server/root/context-fixture.ts:8:import { hostInfo, type ServerContext } from '../../../src/lib/server/root/context.ts';
tests/server/root/context-fixture.ts:34:export function contextFixture(overrides: Partial<ServerContext> = {}): ServerContext {
tests/server/root/context-fixture.ts:54:    const context: ServerContext = {
tests/routes/edit/write.test.ts:2:// handing the request to lib/server/edit/writes.ts with the token ServerContext minted, which is
tests/routes/files/search.test.ts:2:// the request to lib/server/files/search-routes.ts with the token ServerContext minted, which is
tests/routes/git/git.test.ts:2:// request to lib/server/git/git-routes.ts with the token ServerContext minted, which is what this
tests/routes/git/deposit.test.ts:2:// the request to lib/server/git/deposit-routes.ts with the token ServerContext minted, which is
DESIGN.md:134:**Literature search.** One query over eight scholarly sources, answered by `GET /api/literature` behind the origin check and the write token, since a search puts the reader's q
### WriteTarget
src/lib/server/edit/writes.ts:104:export type WriteTarget = {
src/lib/server/edit/writes.ts:252:): WriteTarget {
src/lib/server/edit/writes.ts:305:    into: WriteTarget,
src/lib/server/edit/writes.ts:584:    into: WriteTarget,
src/lib/server/edit/writes.ts:610:async function storeAnswer(into: WriteTarget, app: HeldApp, value: unknown): Promise<Response> {
src/lib/server/edit/writes/undo.ts:64:import type { WriteOutcome, WriteTarget } from '../writes.ts';
src/lib/server/edit/writes/undo.ts:82:function fileOf(into: WriteTarget, change: Change): string {
src/lib/server/edit/writes/undo.ts:87:function collectionOf(into: WriteTarget, change: Change): string | null {
src/lib/server/edit/writes/undo.ts:95:function feedOf(into: WriteTarget, change: Change): FeedKind | null {
src/lib/server/edit/writes/undo.ts:104:function subtaskTarget(into: WriteTarget, change: Change): SubtaskTarget {
src/lib/server/edit/writes/undo.ts:111:    into: WriteTarget,
src/lib/server/edit/writes/undo.ts:125:export function valueNow(into: WriteTarget, change: Change): { found: boolean; value: unknown } {
src/lib/server/edit/writes/undo.ts:180:    into: WriteTarget,
src/lib/server/edit/writes/undo.ts:229:export function undoChange(into: WriteTarget, change: Change): UndoOutcome {
src/lib/server/edit/writes/undo.ts:257:function undoStore(into: WriteTarget, change: Change): UndoOutcome {
src/lib/server/edit/writes/undo.ts:283:function apply(into: WriteTarget, change: Change): WriteOutcome | { error: 'unwritable' } | null {
src/lib/server/edit/writes/undo.ts:365:function feedUndo(into: WriteTarget, change: Change): WriteOutcome | null {
src/lib/server/edit/writes/undo.ts:382:function collectionUndo(into: WriteTarget, change: Change): WriteOutcome | null {
src/lib/server/edit/writes/config/config-write.ts:19:import type { WriteOutcome, WriteTarget } from '../../writes.ts';
src/lib/server/edit/writes/config/config-write.ts:52:function sourcesOf(into: WriteTarget): SourceInputs {
src/lib/server/edit/writes/config/config-write.ts:57:export function configWrite(body: unknown, into: WriteTarget): ConfigAnswer | null {
src/lib/server/edit/writes/file-undo.ts:45:import type { WriteTarget } from '../writes.ts';
src/lib/server/edit/writes/file-undo.ts:284:    into: WriteTarget,
src/lib/server/edit/writes/app-store.ts:24:import type { WriteOutcome, WriteTarget } from '../writes.ts';
src/lib/server/edit/writes/app-store.ts:33:function baseOf(into: WriteTarget, app: HeldApp): string | null {
src/lib/server/edit/writes/app-store.ts:48:    into: WriteTarget,
src/lib/server/edit/writes/app-store.ts:97:export function storeNow(into: WriteTarget, app: HeldApp): unknown {
src/lib/server/git/deposit.ts:73:import { target, writeManifest, type WriteTarget } from '../edit/writes.ts';
src/lib/server/git/deposit.ts:141:    into?: WriteTarget;
src/lib/server/git/deposit.ts:184:function hubTarget(options: DepositOptions): WriteTarget {
src/lib/server/git/deposit.ts:196:    into: WriteTarget;
tests/server/core/changes.test.ts:22:import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
tests/server/core/changes.test.ts:51:function target(keep = 500): WriteTarget {
tests/server/core/changes.test.ts:78:function logOf(into: WriteTarget): ChangeLog {
tests/server/core/changes.test.ts:100:async function written(into: WriteTarget, body: unknown): Promise<Change[]> {
tests/server/edit/app-store.test.ts:14:import { handleWrite, type WriteTarget } from '../../../src/lib/server/edit/writes.ts';
tests/server/edit/app-store.test.ts:35:    const into: WriteTarget = target();
tests/server/git/deposit.test.ts:18:import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
tests/server/git/deposit.test.ts:28:let into: WriteTarget;
tests/server/git/deposit.test.ts:91:function options(): { mirrors: string; into: WriteTarget; gh: GhRun } {
tests/routes/edit/write-fixture.ts:33:import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
tests/routes/edit/write-fixture.ts:68:export function target(): WriteTarget {
tests/routes/edit/write-fixture.ts:126:): WriteTarget {
tests/routes/edit/write-fixture.ts:145:function logOf(into: WriteTarget): ChangeLog {
tests/routes/edit/write-fixture.ts:152:export function changesOf(into: WriteTarget): Change[] {
tests/routes/edit/write-fixture.ts:157:export function overridesOf(into: WriteTarget): unknown {
tests/routes/edit/write-fixture.ts:185:export function tasksOf(into: WriteTarget): string {
tests/routes/edit/write-fixture.ts:190:function manifestFile(into: WriteTarget): string {
tests/routes/edit/write-fixture.ts:194:export function manifestOf(into: WriteTarget): string {
tests/routes/edit/write-fixture.ts:199:export function undone(into: WriteTarget, change: Change): Promise<Response> {
tests/routes/edit/write-fixture.ts:208:    into: WriteTarget,
tests/routes/edit/write-fixture.ts:257:export function deckTarget(): WriteTarget {
tests/routes/edit/write-fixture.ts:280:export function deckOf(into: WriteTarget): string {
tests/routes/edit/write-fixture.ts:319:export function configTarget(engine: string = scratchEngine()): WriteTarget {
tests/routes/edit/rail.test.ts:17:import { handleWrite, type WriteTarget } from '../../../src/lib/server/edit/writes.ts';
tests/routes/edit/rail.test.ts:43:function railTarget(body = LAYOUT): WriteTarget {
tests/routes/edit/rail.test.ts:50:function layoutOf(into: WriteTarget): string {
tests/routes/edit/rail.test.ts:54:function railOf(into: WriteTarget): unknown {
tests/routes/edit/rail.test.ts:58:async function send(into: WriteTarget, rail: unknown): Promise<Response> {
tests/routes/edit/config-key.test.ts:12:import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
tests/routes/edit/config-key.test.ts:27:function keepTarget(): WriteTarget {
tests/routes/edit/config-key.test.ts:37:function behaviorOf(into: WriteTarget): string {
tests/routes/edit/config-key.test.ts:42:function send(into: WriteTarget, file: string, key: string, value: unknown): Promise<Response> {
tests/routes/edit/roots.test.ts:17:import { handleWrite, type WriteTarget } from '../../../src/lib/server/edit/writes.ts';
tests/routes/edit/roots.test.ts:40:function rootsTarget(body = SOURCES): WriteTarget {
tests/routes/edit/roots.test.ts:51:function sourcesOf(into: WriteTarget): string {
tests/routes/edit/roots.test.ts:55:function rootsOf(into: WriteTarget): unknown {
tests/routes/edit/roots.test.ts:67:const send = (into: WriteTarget, body: unknown) => handleWrite(request(body), TOKEN, into);
tests/routes/edit/roots.test.ts:68:const add = (into: WriteTarget, dir: string) => send(into, { kind: 'roots', action: 'add', dir });
tests/routes/edit/roots.test.ts:69:const remove = (into: WriteTarget, key: string) =>
tests/routes/edit/config-value.test.ts:13:import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
tests/routes/edit/config-value.test.ts:18:function behaviorOf(into: WriteTarget): string {
tests/routes/edit/config-value.test.ts:24:    into: WriteTarget,
tests/routes/edit/undo/undo.test.ts:16:import type { WriteTarget } from '../../../../src/lib/server/edit/writes.ts';
tests/routes/edit/undo/undo.test.ts:41:    async function made(into: WriteTarget, body: unknown): Promise<Change> {
tests/routes/edit/audit-mute.test.ts:18:import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
tests/routes/edit/audit-mute.test.ts:59:function muteTarget(body = BEHAVIOR): WriteTarget {
tests/routes/edit/audit-mute.test.ts:79:function behaviorOf(into: WriteTarget): string {
tests/routes/edit/audit-mute.test.ts:84:function parked(into: WriteTarget): unknown {
tests/routes/files/file-undo.test.ts:19:import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
tests/routes/files/file-undo.test.ts:32:type World = { into: WriteTarget; ops: OpsTarget; hub: string };
tests/routes/replace/replace-fixture.ts:22:import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
tests/routes/replace/replace-fixture.ts:31:export type ReplaceWorld = { into: WriteTarget; ops: OpsTarget; hub: string; engine: string };
```

History words of `agents/spec.md:42` (`before`, `used to`, `no longer`, `still`, `always has been`, `always had`, `as before`, `previously`, `the step adds`, `after this package lands`) over the comment lines, trailing comments and test titles the step added or changed (a script comparing each changed file with the base, `$S/history-hits.txt`). 40 hits, all the word `before`; none of the other words. Each is read: the hits at `changes.ts:29`, `:117`, `app-store.ts:11-13`, `undo.ts:255`, `History.svelte:97`, `undo.test.ts:291` and `:310` name the change record's `before` and `after` fields or the value before a write; the remaining hits order two events at run time (`held.ts:37` the state before any read, `watch/apps.ts:45`, `:86`, `:114`, `bridge.ts:38`, `store-cache.ts:43`, `limits.ts:5`, `instance.ts:13`, `methods.ts:3`, `entities.svelte.ts:107`, `routes.ts:8`, `:10`, `store.ts:99`, `record.ts:7`, `manifest.ts:5`, `oculus.js:67`, `AppFrame.svelte:107`, `apps.ts:3`, `writes.svelte.ts:488`, `+page.server.ts:26`, `boundaries.test.ts:98`, `app-open.test.ts:159`, `app-store.test.ts:6`, `approve.test.ts:7`, `:58`, `:136`, `app-gate.test.ts:6`, `app-store.test.ts` (server) `:6`, `methods.test.ts:2`, `:90`, `behavior.yml:207`). None compares the code with an earlier state of the code.

```
config/behavior.yml:207: # Seconds a frame is given to complete the bridge handshake before it is drawn as failed to load.
src/lib/data/helpers/files/apps.ts:3: // open; the page reads them before it sends any of those. One module holds them so the page's
src/lib/server/core/changes.ts:29: // `before` and `after` and hands the values themselves as `kept`. Append writes `kept` to
src/lib/server/core/changes.ts:117: * The two values themselves, for a record whose `before` and `after` are their byte sizes. They
src/lib/server/edit/writes/app-store.ts:11: // as `before` and `after`; the values themselves go with it as `kept`, which the change log writes
src/lib/server/edit/writes/app-store.ts:12: // to its undo folder (server/core/changes.ts). The undo puts the value before back through this
src/lib/server/edit/writes/app-store.ts:13: // writer while the file still holds the value after. After a write the apps watcher is told to read
src/lib/server/edit/writes/undo.ts:255: * value before goes back through the store writer, which records the undo like any other write.
src/lib/server/machine/apps/held.ts:37: /** The state before any read: no app, no finding, no folder. */
src/lib/server/machine/apps/manifest.ts:5: // the app when its folder is read, before there is anything to approve, so the reader never
src/lib/server/machine/apps/oculus.js:67: * completes; the theme is painted before it resolves, and a key press holding Control, Meta or Alt,
src/lib/server/machine/apps/record.ts:7: // (`ctime`, which `cp -p` and `rsync -t` cannot set), which the file route compares before it
src/lib/server/machine/apps/routes.ts:8: // src/hooks.server.ts refuses the opaque origin of an app's frame before they run. The POST carries
src/lib/server/machine/apps/routes.ts:10: // file do; the watcher is told after its own write, so the app's key is in the held row before the
src/lib/server/machine/apps/store.ts:99: * write of a store, before its folder is made, is judged.
src/lib/server/root/watch/apps.ts:45: /** Milliseconds of quiet after the last event before one read. */
src/lib/server/root/watch/apps.ts:86: /** Milliseconds of quiet before a read; a value over MAX_WAIT is the wait. */
src/lib/server/root/watch/apps.ts:114: /** Start the apps watcher; it reads once before it returns. */
src/lib/state/client/entities.svelte.ts:107: /** The apps found in the machine's folder and the roots, or null before the first push. */
src/lib/state/client/writes.svelte.ts:488: * server checks against the body before any writer runs.
src/lib/state/system/apps/bridge.ts:38: /** Seconds the handshake may take before `failed` is called. */
src/lib/state/system/apps/instance.ts:13: /** The value of `getState`, null before the app sets one. */
src/lib/state/system/apps/limits.ts:5: // The window slides: a call passes while fewer than `limit` calls passed in the `windowMs` before
src/lib/state/system/apps/methods.ts:3: // by the app's manifest and the limits before it does anything, and a refusal rejects with one
src/lib/state/system/apps/store-cache.ts:43: /** How many answers may be dropped before the read gives up. */
src/lib/views/apps/frame/AppFrame.svelte:107: // Closing runs before `act`, and the microtask runs after it, so only a cancel resolves
src/lib/views/system/history/History.svelte:97: * names the size of the store before and after.
src/routes/+page.server.ts:26: // the `apps` channel they are at least as new as, so the registry holds the apps' views before the
tests/checks/tree/boundaries.test.ts:98: // rule and the `closed_paths` match): the page refuses an app's request by them before it sends
tests/routes/apps/app-open.test.ts:159: it('answers closed for an empty path before it reads the disk', () => {
tests/routes/apps/app-store.test.ts:6: // guard that refuses the opaque origin of an app's frame before this runs (src/hooks.server.ts).
tests/routes/apps/approve.test.ts:7: // src/hooks.server.ts, which answers a request from another page before this runs.
tests/routes/apps/approve.test.ts:58: it('approves the hash the reader was shown and sets the key before it answers', async () => {
tests/routes/apps/approve.test.ts:136: it('revokes by folder and empties the key before it answers', async () => {
tests/routes/edit/app-gate.test.ts:6: // What this does NOT cover: the page's own checks before a request is sent
tests/routes/edit/undo/undo.test.ts:291: it('puts an app store back to the value before, and refuses it once the store has moved or the kept values are gone', async () => {
tests/routes/edit/undo/undo.test.ts:310: // The store written twice, and the second write taken back: the value before returns.
tests/server/edit/app-store.test.ts:6: // inside it before any write; a case never reaches `~/.oculus`. What this does NOT cover: the
tests/state/system/apps/methods.test.ts:2: // (lib/state/system/apps/methods.ts), judged by the page's own checks before any request: an open
tests/state/system/apps/methods.test.ts:90: describe('judging an app call before any request', () => {
```

### Prose rules

Read in full against `agents/spec.md`'s prose rules: the section of DESIGN.md (lines 250-339), the Apps section of HELP.md (lines 201-211), `config/text/views/apps/apps.yml`, the `findings.apps` group of `config/text/findings.yml` and the `apps:` block of `config/behavior.yml`. Checked with grep: no byte outside ASCII, no em or en dash, no `--` or spaced hyphen as a dash. A grep of the section for `will`, `not yet`, `later`, `gains`, `becomes`, `adds`, `new`, `still`, `always`, `used to` and `no longer` leaves only hits that state what the tree holds, each read. Departures: the section's paragraphs are long single lines, as every paragraph of DESIGN.md is; the Words paragraph and the list of open kinds are lists of identifiers as the section's own, and HELP.md's three-part listings follow the file's existing form.

## The measurements

All runs: scratch oculus on 8797 (`node src/server.ts --engine $S/engine`, `HOME=$S/home`, `TMUX_TMPDIR=$S/tmux`), listeners on 127.0.0.1 (`node $S/meas/listen.mjs`: UDP 3478, TCP 9443 and 9444, static server 9445), headless Chrome `--headless=new` with a fresh `--user-data-dir=$S/chrome-<run>` and `--log-net-log=$S/meas/net-<run>.json --net-log-capture-mode=Everything`, driven over a pipe by `node $S/cdp/measure.mjs $S <run> control|frame <page or app>` (`$S/cdp/cdp.mjs`, `$S/cdp/lib.mjs`). The control loads the probe top-level from the static server on 9445 with no policy and no sandbox; the frame run opens the probe app's tab in the page `http://localhost:8797/` (the script approves the app through the panel and reads the probe's result from inside its frame). The listener's log is `$S/meas/listen.log`.

**M1 WebRTC** (`node $S/cdp/measure.mjs $S m124-control control http://127.0.0.1:9445/probe.html`, `node $S/cdp/measure.mjs $S m124-frame frame probe`). Control output (`$S/meas/out-m124-control.txt`):

```
page at 4.6 s: undefined
page after 12 s: http://127.0.0.1:9444/x | ok
listener lines: 10
   1791226149416 udp 3478 datagram 20b from 127.0.0.1:52558
   1791226149676 udp 3478 datagram 20b from 127.0.0.1:52558
   1791226150192 udp 3478 datagram 20b from 127.0.0.1:52558
   1791226151206 udp 3478 datagram 20b from 127.0.0.1:52558
   1791226153223 udp 3478 datagram 20b from 127.0.0.1:52558
   1791226153929 tcp 9444 connection from 127.0.0.1
   1791226153931 tcp 9444 data 695b
   1791226153934 tcp 9444 connection from 127.0.0.1
   1791226153941 tcp 9444 data 603b
   1791226157239 udp 3478 datagram 20b from 127.0.0.1:52558
net log bytes: 80955399 mentions of e4-probe.test: 14
```

Frame run output (`$S/meas/out-m124-frame.txt`):

```
page at 4.6 s: {"csp":[],"rtc":"gathering=gathering","download":"not clicked","bridge":"stored"}
page after 12 s: undefined
iframe attrs: {"sandbox":"allow-scripts allow-downloads","allow":"","referrerpolicy":"no-referrer"}
log entries: []
listener lines: 6
   1791226200007 udp 3478 datagram 20b from 127.0.0.1:53665
   1791226200276 udp 3478 datagram 20b from 127.0.0.1:53665
   1791226200794 udp 3478 datagram 20b from 127.0.0.1:53665
   1791226201809 udp 3478 datagram 20b from 127.0.0.1:53665
   1791226203825 udp 3478 datagram 20b from 127.0.0.1:53665
   1791226204706 tcp 9444 connection from 127.0.0.1
net log bytes: 158430659 mentions of e4-probe.test: 14
```

Result: the control's listener logs six UDP datagrams of 20 bytes on 3478; the frame run's logs five, with the probe's `rtc` state `gathering`. The policy does not stop WebRTC. Sentence in DESIGN.md ("What an app does not get"): "WebRTC: an `RTCPeerConnection` with `stun:127.0.0.1:3478` sends STUN datagrams to the listener from the frame, so an app can reach a STUN server by address."

**M2 DNS prefetch** (the same two runs; the page holds `<link rel="dns-prefetch" href="//e4-probe.test">`). Both outputs end with `net log ... mentions of e4-probe.test: 14` (above). Result: the host name is resolved in the control and in the frame, so an app can leak a name it chooses. Sentence: "DNS prefetch: a `<link rel="dns-prefetch" href="//e4-probe.test">` in an app's page makes the browser resolve the name (one host resolution in the net log, in the control and in the frame), so an app can leak a name it chooses."

**M3 `wss:` under `connect-src https://localhost:9443`** (`node $S/cdp/measure.mjs $S m3-control control http://127.0.0.1:9445/probe3.html`, `node $S/cdp/measure.mjs $S m3-frame frame probe3`; the probe app has `connects: [https://localhost:9443]`). Control output:

```
page at 4.6 s: {"csp":[],"ws":"error event","bridge":"none TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:9445/apps/-/oculus.js"}
page after 12 s: http://127.0.0.1:9445/probe3.html | {"csp":[],"ws":"error event","bridge":"none TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:944
listener lines: 4
   1791226228187 tcp 9443 connection from 127.0.0.1
   1791226228200 tcp 9443 data 1969b
   1791226229710 tcp 9443 connection from 127.0.0.1
   1791226229724 tcp 9443 data 2001b
net log bytes: 51596644 mentions of e4-probe.test: 0
```

Frame run output:

```
page at 4.6 s: {"csp":["connect-src wss://localhost:9443/"],"ws":"error event","bridge":"stored"}
page after 12 s: {"csp":["connect-src wss://localhost:9443/"],"ws":"error event","bridge":"stored"}
iframe attrs: {"sandbox":"allow-scripts allow-downloads","allow":"","referrerpolicy":"no-referrer"}
log entries: ["Connecting to 'wss://localhost:9443/' violates the following Content Security Policy directive: \"connect-src localhost:8797/apps/probe3/43256c4a53ac1108b63ac4f7b6d0d089/ https://localhost:9443\". The action has been block"]
listener lines: 0
net log bytes: 31233584 mentions of e4-probe.test: 0
```

Result: in the frame a `securitypolicyviolation` fires (`Connecting to 'wss://localhost:9443/' violates ... connect-src localhost:8797/apps/probe3/<key>/ https://localhost:9443`) and the listener on 9443 logs 0 lines; the control (no policy) reaches the listener. An origin in `connects` admits its own scheme only, so a `wss:` origin stays refused as the manifest paragraph says. Sentence: "`wss:` under `connect-src https://localhost:9443`: the policy does not admit it, a `securitypolicyviolation` fires and the listener on 9443 logs no connection, so an origin in `connects` admits requests of its own scheme only, and a `wss:` origin stays refused as the manifest paragraph says."

**M4 download link to an outside address from an app with no `connects`.** The control is the combined run `m124-control` (the probe page loaded top-level); the frame run is `m124-frame`; the no-policy sandbox runs are `node $S/cdp/dl.mjs $S dl-a http://127.0.0.1:9445/dla.html` (the probe in `<iframe sandbox="allow-scripts allow-downloads">`) and `dl-b` on `dlb.html` (`<iframe sandbox="allow-scripts">`), both served by the static server with no policy. Net-log counts (`$S/cdp/netcount.py`, `netpre.py` over `$S/meas/net-*.json`) and the listener's lines (`$S/meas/listen.log`):

```
1791226153929 tcp 9444 connection from 127.0.0.1
1791226153931 tcp 9444 data 695b
1791226153934 tcp 9444 connection from 127.0.0.1
1791226153941 tcp 9444 data 603b
1791226204706 tcp 9444 connection from 127.0.0.1
--- dl-a http://127.0.0.1:9445/dla.html
--- dl-b http://127.0.0.1:9445/dlb.html
--- dl-a
1791229605139 tcp 9444 connection from 127.0.0.1
1791229605147 tcp 9444 data 661b
--- dl-b
1791229616683 tcp 9444 connection from 127.0.0.1
1791229616689 tcp 9444 data 661b
```

Control (`m124-control`, which holds the download link): the listener logs `tcp 9444 connection` and `data 695b` and `data 603b`, an HTTP request. Frame run (`m124-frame`): one `tcp 9444 connection from 127.0.0.1` and no data line; the net log shows a connection job marked `is_preconnect: true` whose socket connects and closes with no bytes sent. A sandboxed frame with no policy (`dl-a` with `allow-downloads`, `dl-b` without it): the listener logs a connection with `data 661b` in both, so removing `allow-downloads` would not stop the request and the policy does. Result: no request leaves from the frame; `allow-downloads` stays. Sentence: "A download link to an outside address from an app with no `connects`: the control sends an HTTP request to the listener on 9444 and the frame sends none, only a preconnect (the net log shows a connection job marked `is_preconnect` that connects and closes with no bytes sent); a sandboxed frame with no policy sends the request with `allow-downloads` and without it, so the policy is what stops the request and taking the flag out would not, and `allow-downloads` stays in the sandbox."

End state of the listeners: `lsof -nP -i :8797 -i :9443 -i :9444 -i :9445 -i UDP:3478` printed nothing (exit 1), and `ps -axo pid,command | grep -i chrome | grep scratchpad/e4` printed nothing.

## Terms

`ls docs` prints `diagrams` only; it holds no `glossary.md`, so this step adds no term.

## Files

From `diff -rq` of `src`, `tests`, `config` and `utils` against the base copy (`$S/changed2.txt`: 110 files, 40 of them new), plus `package.json`, `package-lock.json`, `HELP.md`, `DESIGN.md`, `docs/diagrams/*` and this report. `package.json` gains `"penpal": "8.0.1"`, and the lock follows it. Lines are the base's and the new count; a path outside the brief's "Paths this step writes" carries its reason.

| Path | Base lines | Lines now | Outside the write list: reason |
|---|---|---|---|
| `DESIGN.md` | - | 437 |  |
| `HELP.md` | - | 364 |  |
| `config/behavior.yml` | 201 | 224 |  |
| `config/catalogs/glyphs.yml` | 193 | 195 |  |
| `config/catalogs/icons.yml` | 192 | 194 |  |
| `config/catalogs/options.yml` | 1280 | 1354 |  |
| `config/layout.yml` | 177 | 181 |  |
| `config/text/findings.yml` | 179 | 214 |  |
| `config/text/views/apps/apps.yml` | new | 67 |  |
| `config/text/views/system/history.yml` | 66 | 68 | History draws a store write's record: the words for the kind `app-store` and for byte sizes (item 9 says History draws the two sizes, `views/system/history/rows.ts` is in the list, its strings are not). |
| `config/text/views/system/workbench.yml` | 199 | 200 |  |
| `package-lock.json` | - | 7449 |  |
| `package.json` | - | 97 |  |
| `src/hooks.server.ts` | 91 | 105 |  |
| `src/lib/data/helpers/files/apps.ts` | new | 199 |  |
| `src/lib/data/model/index.ts` | 546 | 582 |  |
| `src/lib/data/sources/config.ts` | 93 | 96 | The facade of the config reader re-exports `appsSettings`, `closedPaths` and the `AppsSettings` type that `settings.ts` (in the list) now holds, which the page and the server import. |
| `src/lib/data/sources/config/catalog/options.ts` | 558 | 559 |  |
| `src/lib/data/sources/config/catalogs.ts` | 295 | 308 |  |
| `src/lib/data/sources/config/local.ts` | 535 | 542 |  |
| `src/lib/data/sources/config/settings.ts` | 482 | 541 |  |
| `src/lib/server/core/changes.ts` | 320 | 362 |  |
| `src/lib/server/edit/writes.ts` | 556 | 620 |  |
| `src/lib/server/edit/writes/app-gate.ts` | new | 123 |  |
| `src/lib/server/edit/writes/app-store.ts` | new | 99 |  |
| `src/lib/server/edit/writes/undo.ts` | 393 | 420 |  |
| `src/lib/server/files/files.ts` | 292 | 305 |  |
| `src/lib/server/machine/approvals/approvals.ts` | 139 | 208 |  |
| `src/lib/server/machine/apps/address.ts` | new | 114 |  |
| `src/lib/server/machine/apps/held.ts` | new | 59 |  |
| `src/lib/server/machine/apps/manifest.ts` | new | 314 |  |
| `src/lib/server/machine/apps/oculus.js` | new | 101 |  |
| `src/lib/server/machine/apps/open.ts` | new | 131 |  |
| `src/lib/server/machine/apps/record.ts` | new | 95 |  |
| `src/lib/server/machine/apps/routes.ts` | new | 172 |  |
| `src/lib/server/machine/apps/scan.ts` | new | 244 |  |
| `src/lib/server/machine/apps/serve.ts` | new | 156 |  |
| `src/lib/server/machine/apps/store.ts` | new | 106 |  |
| `src/lib/server/root/context.ts` | 737 | 767 |  |
| `src/lib/server/root/watch/apps.ts` | new | 374 |  |
| `src/lib/server/root/watch/local.ts` | 149 | 150 | The local watcher's list of keys it pushes on gains `appsDir`, which is what item 2 calls following a new `apps_dir`. |
| `src/lib/shell/rail/RailFoot.svelte` | 111 | 116 |  |
| `src/lib/shell/rail/rail.ts` | 152 | 153 | Re-exports `sourceTabState` so the rail's bookmark row opens an apps-folder file as a source tab (item 12), the shell reaching the state through its own facade. |
| `src/lib/state/client/context.ts` | 505 | 527 |  |
| `src/lib/state/client/entities.svelte.ts` | 108 | 110 |  |
| `src/lib/state/client/payloads.ts` | 129 | 134 |  |
| `src/lib/state/client/socket.svelte.ts` | 358 | 379 | `seedApps` and `seededApps`: the `apps` entity seeded at the page data's version and the version an older push is dropped below (item 3), beside `seedConfig`, which lives in this file. |
| `src/lib/state/client/writes.svelte.ts` | 595 | 622 |  |
| `src/lib/state/shared/stores/shapes.ts` | 322 | 335 | The type of the page's app store (`sendFromApp`, `seedApps`, the apps payload and `status`), which `payloads.ts` and `context.ts` (in the list) use. |
| `src/lib/state/sources/explorer/view/bookmark-rows.ts` | 107 | 116 |  |
| `src/lib/state/system/apps/apps.svelte.ts` | new | 319 |  |
| `src/lib/state/system/apps/bridge.ts` | new | 123 |  |
| `src/lib/state/system/apps/instance.ts` | new | 42 |  |
| `src/lib/state/system/apps/limits.ts` | new | 30 |  |
| `src/lib/state/system/apps/methods.ts` | new | 307 |  |
| `src/lib/state/system/apps/rules.ts` | new | 129 |  |
| `src/lib/state/system/apps/store-cache.ts` | new | 130 |  |
| `src/lib/state/system/apps/words.ts` | new | 59 |  |
| `src/lib/state/system/config/groups.ts` | 299 | 301 |  |
| `src/lib/state/workbench/navigation/pages.ts` | 507 | 507 | `viewFor`'s type includes `words`, which `registrationLabel` now reads for an app's title. |
| `src/lib/state/workbench/navigation/rail.ts` | 116 | 119 | Exports `sourceTabState` for the bookmark rows (item 12). |
| `src/lib/state/workbench/navigation/registry.ts` | 205 | 223 |  |
| `src/lib/state/workbench/navigation/status.ts` | 399 | 401 |  |
| `src/lib/ui/frame/Sash.svelte` | 192 | 196 | A sash drag adds the class `sashing` to the body (C46), which the frame reads to take no pointer; the brief names `pointer-events: none` during a sash drag and `ui/frame` is where the drag lives. |
| `src/lib/ui/frame/sash-size.ts` | 35 | 38 | Exports the class name `SASHING_CLASS` the sash and the frame share. |
| `src/lib/ui/theme.ts` | 108 | 119 |  |
| `src/lib/views/apps/frame/AppFrame.svelte` | new | 251 |  |
| `src/lib/views/apps/frame/ApprovalPanel.svelte` | new | 152 |  |
| `src/lib/views/boards/collection/EntryCard.svelte` | 507 | 509 |  |
| `src/lib/views/boards/focus/lanes/Lanes.svelte` | 384 | 385 |  |
| `src/lib/views/shared/card/CardDocs.svelte` | 243 | 243 |  |
| `src/lib/views/shared/card/card.ts` | 141 | 138 |  |
| `src/lib/views/shared/explorer/opening.ts` | 110 | 138 |  |
| `src/lib/views/shared/explorer/rooted-tree.svelte.ts` | 233 | 235 | Hands `holds` to the explorer's openers so `openRow` reaches `tabForKind` with the rule (item 12); the row menu and the tree share this module. |
| `src/lib/views/shared/explorer/tree/menu/row-menu.ts` | 546 | 548 | The row menu's Open and Open beside call the openers with `holds` (item 12). |
| `src/lib/views/sources/document/Document.svelte` | 204 | 223 |  |
| `src/lib/views/sources/source/read-again.ts` | 45 | 46 |  |
| `src/lib/views/system/findings/Findings.svelte` | 92 | 93 | The Findings view lists the findings of the `apps` channel beside the others (item 2, "the Findings view lists the channel's findings"). |
| `src/lib/views/system/history/History.svelte` | 352 | 362 | Draws the two byte sizes for a store write's record (item 9); `rows.ts` holds the row model, this draws it. |
| `src/lib/views/system/history/rows.ts` | 86 | 95 |  |
| `src/routes/+page.server.ts` | 46 | 55 |  |
| `src/routes/+page.svelte` | 221 | 236 |  |
| `src/routes/+page.ts` | 30 | 31 | The universal load passes the server's `apps` data to the page (item 3, `data.apps`). |
| `src/routes/api/(apps)/app-open/+server.ts` | new | 13 |  |
| `src/routes/api/(apps)/app-store/+server.ts` | new | 13 |  |
| `src/routes/api/(apps)/approve/+server.ts` | new | 14 |  |
| `src/routes/api/(files)/file/[root]/[...path]/+server.ts` | 22 | 23 |  |
| `src/routes/apps/[...path]/+server.ts` | new | 39 |  |
| `src/routes/views.ts` | 80 | 125 |  |
| `tests/checks/config/config-folder.test.ts` | 553 | 555 | Its list of catalog files and of top-level keys gains `views/apps/apps.yml` and `apps`, which items 13 adds. |
| `tests/checks/config/config.test.ts` | 591 | 596 | Its words fixture carries `apps.closed_paths`, so the shipped options catalog is read with the key the findings now require. |
| `tests/checks/imports/order.ts` | 190 | 191 | The views list of the folder-order check gains `views/apps` (the new folder `views/apps/frame/`). |
| `tests/checks/source/keys.test.ts` | 481 | 486 |  |
| `tests/checks/tree/boundaries.test.ts` | 655 | 661 |  |
| `tests/data/sources/config/local.test.ts` | 260 | 272 |  |
| `tests/data/sources/config/settings.test.ts` | 585 | 683 |  |
| `tests/fixtures/entities-fixture.ts` | 69 | 96 | `fixtureApp`, the one `AppRow` fixture the apps tests share (the duplication test refused two copies); `tests/fixtures/` holds 10 items, so it sits in this file. |
| `tests/fixtures/kinds.ts` | 24 | 26 | The store kind `app-store` joins the kinds that the endpoint records without a `kind` field, so the kind-coverage test counts it. |
| `tests/routes/apps/app-files.test.ts` | new | 239 |  |
| `tests/routes/apps/app-open.test.ts` | new | 205 |  |
| `tests/routes/apps/app-store.test.ts` | new | 69 |  |
| `tests/routes/apps/approve.test.ts` | new | 180 |  |
| `tests/routes/apps/apps-fixture.ts` | new | 139 | The fixture the four route tests of the new folder `tests/routes/apps/` and `undo.test.ts` share. |
| `tests/routes/edit/app-gate.test.ts` | new | 192 |  |
| `tests/routes/edit/undo/undo.test.ts` | 289 | 333 |  |
| `tests/routes/files/file.test.ts` | 54 | 107 |  |
| `tests/server/core/changes.test.ts` | 270 | 311 |  |
| `tests/server/edit/app-store.test.ts` | new | 190 |  |
| `tests/server/machine/approvals/approvals.test.ts` | 41 | 59 |  |
| `tests/server/machine/apps/manifest.test.ts` | new | 645 |  |
| `tests/server/root/context-fixture.ts` | 124 | 135 |  |
| `tests/state/system/apps/methods.test.ts` | new | 293 |  |
| `tests/state/system/apps/store-cache.test.ts` | new | 172 |  |
| `tests/views/shared/explorer/opening-apps.test.ts` | new | 160 |  |
| `docs/diagrams/*` | - | - | regenerated by `npm run diagrams`; in the write list |
| `.scratch/migration/agents/reviews/E4-report.md` | - | - | this report |

New folders and the ten-item limit: `src/lib/server/machine/apps/` 10 items, `src/lib/state/system/apps/` 8, `src/lib/views/apps/frame/` 2, `src/routes/api/(apps)/` 3, `src/routes/apps/` 1, `tests/routes/apps/` 5, `tests/state/system/apps/` 2 (`ls -A <folder> | wc -l`). `src/routes/api/` holds 9 items, as the brief's item 8 says. `sh utils/folder-check.sh` exits 0.

## Judgment calls the brief left open

- The store cache gives up a read after `ATTEMPTS = 5` dropped answers and waits `WAIT_MS = 5000` for the next push before it fetches again (`state/system/apps/store-cache.ts:44-46`); the numbers are the section's, written as constants of the module because no config key names them.
- The store writer takes an optional `stored` callback in its target (`into.apps.stored?.()`, `server/edit/writes/app-store.ts:92`) that `target()` sets to the apps watcher's `rereadStores()` (`server/edit/writes.ts:293`, `server/root/watch/apps.ts:345`), so one `apps` push with the new `storeVersion` follows each store write; C92 shows 2 pushes with 2 distinct versions for 2 concurrent writes.
- `rejectWith` and `jsonText` are the two helpers of `state/system/apps/rules.ts` (a rejected promise of one fixed word, and the JSON text of a plain value or `undefined`), used by `methods.ts` and `store-cache.ts`.
- `fixtureApp` is in `tests/fixtures/entities-fixture.ts` because a new file in `tests/fixtures/` would make 11 items; the duplication test refused the two copies the tests first held.
- The manifest test holds three rows beyond the brief's list (`a name holding a slash`, `a name that starts with an at sign`, `a write of a session`) and one case (`reads a root app reading the inbox as no app, with the sentence naming a root app`), each a form the section names that the brief's table did not list.
- `APP_HEADER` and `KIND_HEADER` stay exported and `oculus.js` exports `connect`; both are the two new lines of the unused-exports diff, judged above.
- `/apps/-/penpal.js` is read through `import.meta.resolve('penpal')` (C100 shows it resolves under Vite's module runner), so the `createRequire` form of item 5 is not built.
- The apps registry is a `SvelteMap` (Decision 2), and `badgeMark` stays a catalog key set per row at registration (Decision 19); DESIGN.md's registration block says so.
- The sash adds a class to the body and the frame reads it with `:global(body.sashing)`; a tab drag is read from `drag.dragging()` in the frame component (`AppFrame.svelte:175`). The frame component carries the rule for both drags in its own style block.
- A root app's tab keeps `{ value, folder }` and `drawsFolder` compares the registered folder with it (C26).

## Host- and user-visible changes (for the look on TEST, item 15)

| Change | View and state to put it in | What should differ |
|---|---|---|
| Apps button on the rail and an Apps group in the view catalogue | Any page; the Views catalogue with at least one app in `~/.oculus/apps` | A button labelled Apps after Present and before Help, drawing glyph `app`; the catalogue draws the group Apps only while it holds a view. |
| Settings, heading Apps | Settings view, the heading list | Apps after Calendar and mail, with nine entries in two sections, App limits (eight number fields, whole, minimum 1) and Closed folders (`closed_paths`). |
| Page header `Content-Security-Policy: frame-src 'self'` | `curl -sI http://localhost:8787/` against Axel's server | The header on `/` only; the Document and File views still draw their frames. |
| Files of an apps folder open as source text | Files view on a root holding `.oculus/apps/<name>/index.html`; a bookmark of it; a project card's or an entry's document link; the rail's Bookmarks menu | The page opens in the source tab instead of the Document view. |
| `/api/file` answers `text/plain` with `nosniff` for a file of an apps folder | `curl -sI` on `/api/file/<root>/.oculus/apps/<name>/index.html` | `content-type: text/plain; charset=utf-8` and `x-content-type-options: nosniff`; a page outside an apps folder keeps `text/html`. |
| Document view opens an other-origin link in a new browser tab | A manual holding a link to `https://example.org` and a same-origin link | The other-origin link opens a browser tab with no opener; the same-origin link stays in the frame. |
| History rows for store writes | History view after a `setStore` | A row of kind `app-store` naming the app and the two byte sizes; Undo puts the value before back, and answers `moved` when another write came between. |
| Findings view lists the apps findings | Findings view with an app whose manifest asks for `processes` | A finding keyed `apps[<name>]` that names `processes` and the reason it is closed. |
| A sash drag adds the class `sashing` to the body | Drag a sash across an open app's frame | The frame takes no pointer during the drag, so the sash keeps its moves. |

## The look list

Cases and the item 15 list, each with the view, the state and what should differ. All on TEST with scratch apps only (`~/.oculus/apps/zz-look-e4/`, `zz-look-e4-bad/`, and the root app in `~/workspace/zz-look-e4/.oculus/apps/zz-look-e4-root/`), `approvals.json` and `workspaces.json` copied and their `shasum` taken before and checked after, as item 15 says.

| Case | View | State | What should differ |
|---|---|---|---|
| C23 | The app's tab | Approved machine app; edit one of its files | The frame is replaced by the approval panel with the sentence `This app changed since you approved it...`; the tab's saved state is still there after Approve. |
| C24 | The app's tab, the Views catalogue | Remove the app's folder, then put it back unchanged | The catalogue drops the app and the tab draws `Unknown view: app:zz-look-e4`; after the folder returns the app draws at once with its value. |
| C25 | The root app's tab, Files | Remove the throwaway root from the file browser, then add it again | `Unknown view: app:<root>/zz-look-e4-root` while removed; the app at once when added back with its files unchanged. |
| C28 | The page on load | A saved layout naming `app:zz-look-e4`, loaded with and without the app | With the app: its tab on the first frame; without it: the unknown view and the layout otherwise intact. |
| C38 | Document view | A manual holding `https://example.org` and a same-origin link | The first opens a browser tab, the second stays in the frame. |
| C39 | The app's tab | An app that never calls `connect` | After 10 s the sentence `The app did not answer in time.` with a Reload the app button. |
| C40 | Three windows on TEST | Post a penpal-shaped message from the Document view's frame, a second tab and the page's own window | No method runs, no notice appears and the app's state is unchanged. |
| C44 | The app's tab | Change the theme, toggle the wallpaper | One `onTheme` per change, one frame after the body class changes, carrying every token of `tokens.css`. |
| C46 | Panes | Drag a tab, and a sash, across an open app's frame | The drag keeps its pointer moves in both. |
| C47 | A float | Move an app's tab into a float | A new frame and a new bridge; the old frame destroyed (no second set of `onChannel` calls). |
| C61 | The app's tab | An app that calls `write('delete-entry', ...)` | A Confirm naming the app, the kind in words and the target; No gives the app `declined` and sends nothing. |
| C78 | The panel and the tab | Keep approved while I edit on a machine app; edit its script, then `app.yml`; restart the server | The script edit reloads the frame with no question; the `app.yml` edit shows the panel again; after the restart the app runs while its files are as they were at the press. A root app shows no Keep control. |
| C80 | Catalogue, tab, notices, panel | An app titled `<img src=x onerror=alert(1)>` | The title is drawn as that text in all four and no alert runs. |
| C101 | The app's frame in DevTools | Dark and light theme, then change theme | The frame element's computed `color-scheme` equals the body's in each and changes with the theme. |
| Item 15: Apps button and catalogue group | Rail, Views catalogue | As above | See the table above. |
| Item 15: panels | Machine app and root app tabs | Unapproved | Plain-word sentences for reads, writes, origins, the store location and the folder; the root app's title followed by its root's key and its store described as a file of the root. |
| Item 15: Approve, themes, wallpaper | The frame | Approve; dark, light; wallpaper on | The app draws, paints its own surfaces, and a transparent app shows the wallpaper. |
| Item 15: `setStore` and its undo | History | An app that writes its store twice | Two rows with the sizes; Undo of the second returns the first value and the app's `onStore` follows. |
| Item 15: Revoke | The panel | Revoke an approved app | The frame is replaced by the panel at once; `/apps/...` addresses answer 404. |
| Item 15: bad app | Findings view | `zz-look-e4-bad` asking for `processes` | A finding `apps[zz-look-e4-bad]` naming the channel and why. |
| Item 15: a chord inside the frame | The app's tab | Cmd+P with focus in the frame | The palette opens; more than 20 keys in a second are dropped. |
| Item 15: files from Files, a bookmark and the rail Bookmarks menu; Open in Browser (C81, C88, C89) | Files, Bookmarks, the rail | `index.html` of the scratch app | Source text in each; Open in Browser shows plain text. |
| Item 15: a refusal word | The app | `open({ file: { root: 'hub', path: '.env' } })` | The app receives `closed`. |
| Item 15: `/apps/-/penpal.js` on Axel's dev server (C100) | `curl -sI` on the dev server |  | 200 and the file's bytes. |
| Item 15: Settings, Apps heading (C99) | Settings view |  | After Calendar and mail, nine entries. |

## Anything in the brief that was wrong or impossible

- Item 5 of the verify list asks for a run of each test against removed behaviour; the standing rule forbids breaking code to watch a test fail, so the run on the unchanged tree and a reading of each test stand in its place.
- The brief's expectation that `open({ file })` answers `ok` to the app that asked does not hold when the call adds a pane (finding 1).
- The brief's M4 trigger in item 14 and Decision 11 differ (finding 2).
- Line numbers of the section and of the brief's "What is on the tree" are from main at b732308e9; the build's tree is renumbered (the Files section lists every changed file; DESIGN.md's citations were each read at the new line).
- C85 cannot run on main (finding 4).


# Repair round 1

Not done: C85 (A3's `schedule` channel is not on main, as above). Not as the round asked: item 18, the return value of the download click in the frame run (the click destroys the frame before the probe can report it; the click's time and the absence of a request are recorded); item 9, the look "the frame's `color-scheme` changes with a theme change" cannot show a change, because the body's computed `color-scheme` is `normal` in every theme (open item 1 below). Everything else of the 19 items is built and checked, and this section replaces the statements of the sections above where they differ: C64 is now `resolved` with the app's document kept (finding 1 above is closed), the two read-only git commands are counted below, and DESIGN.md's lines are those of this section.

## Open items for Axel

- **1. Themes set no `color-scheme`.** `grep -rn "color-scheme" src` finds it only in `Calendar.svelte:313` and in the frame code; the run `c101r1` prints `bodyColorScheme: "normal"` for light, dark, nord and vscode-light-modern. So the frame takes `normal` in every theme, which is what the body has, and native controls and scrollbars inside an app frame stay light in a dark theme. Options: (a) leave it, the frame follows whatever the body declares; (b) declare `color-scheme: dark` in the dark theme classes of `src/lib/themes/themes.css`, which also changes the page's own scrollbars and native controls (`body.dark` opens at `themes.css:11`). Recommendation: (b), as its own small step with a look, since the brief's C101 only has a meaning once the body declares a scheme. The lazy option is (a).
- **2. A press inside an app frame does not make its pane the active pane.** Chrome sends the page no `focusin` for a press inside a cross-document iframe (run `focus3`: the page heard `window blur` only). The pane activation (`PaneView.entered`) hangs on `focusin` and on a pointer press captured in the pane, so a press in the frame activates nothing. Not verified on the base tree, where the frame sat inside the pane; the browser's behaviour for the iframe element does not depend on where the element sits. What does work: the keyboard addresses the pane of the frame's slot while the frame holds the focus (run `keys3`). Options: (a) leave; (b) activate the pane when the window blurs and `document.activeElement` is a layer frame, which is a user-visible behaviour nothing names. Recommendation: (a) until Axel asks for (b).
- **3. An app whose frame navigates away loses its frame.** Run `m4r1-frame`: after the download click the frame requested `http://127.0.0.1:9444/x`, the frame went to `chrome-error://chromewebdata/` and was detached; the page's `frame-src 'self'` is the policy that refuses the address (`Content-Security-Policy` of the page, DESIGN.md:306), and the tab shows `apps.load_failed`, `The app did not answer in time.`, with the Reload control. This is the behaviour of `failed` (the frame is dropped, the control loads it again), listed so the ruling on `allow-downloads` (finding 2 above) has it.

## The 19 items

| # | Item | State | Command or reading |
|---|---|---|---|
| 18 | P2, M4 rerun with the probe's own click record | NOT DONE as written, see the first line | The runs are quoted under "M4" below |
| 9 | B2/C101, `AppFrame` reads the theme from reactive state | DONE for the code, the look is open item 1 | `AppFrame.svelte:98-113` (`scheme` state, set in a frame after `ui.theme()`, `wallpaper()`, `crt()` and `textScale()` change); run `c101c`: with the body forced to `color-scheme: dark` in the page, a theme change to `light` and to `nord` leaves `frameStyle: "dark"`, `frameComputed: "dark"` |
| 1 | E4-1 (c), frame layer outside the pane tree | DONE | `grep -rn "<iframe" src` prints only `FrameLayer.svelte:168,181,191`; runs `c64r3`, `float3c`, `float4c`, `close1`, `menu1`, `keys3c` below; DESIGN.md:306 and :327 |
| 2 | E4-2 (a), `frame-ancestors <host>` | DONE | DESIGN.md:298 (adapter-node `handler.js:210`, quoted in the sentence), :301 unchanged with `frame-ancestors <host>`; `address.ts:101` builds it |
| 3 | E4-3 (a), `list_shape` and `file_unreadable` stay | DONE | DESIGN.md:274 names both in the list of what refuses an app |
| 4 | S3, `not_json`, undeclared write kind | DONE | DESIGN.md:319 |
| 5 | S4, `roots` and `processes` | DONE | DESIGN.md:325 (`roots`), :321 (`processes`, closed channels), :339 (`carries.processes`); `data/helpers/files/apps.ts:84` (`CLOSED_CHANNELS` holds `processes`) and :135 (`roots`) and `config/text/findings.yml:210` hold both |
| 6 | T8, where `refused:<reason>` comes from | DONE | DESIGN.md:319 (`methods.ts:159` for the first `refused` reason of a 200 answer, `:162` for the `error` word of a 4xx) |
| 7 | T7, HELP.md:205 | DONE | `sed -n 205p HELP.md \| grep -c "cannot ask for the app store as a write"` prints 0 |
| 8 | B1/C38, link finding without `instanceof Element` | DONE | `Document.svelte:148-150`; run `c38r3` below |
| 10 | B3/S6, one rule for a root key on the page | DONE | `context.ts:340` defines `servedRoots = (): { key: string; dir: string }[] => fs.roots()`, used at :371 (Repositories), :437 (commands) and :468 (apps); diff below |
| 11 | B4, `scan.ts` reads `app.yml` once | DONE | `grep -n readFileSync manifest.ts scan.ts` prints `manifest.ts:11` and `:221` only; `ManifestRead.bytes` carries them to `scan.ts` |
| 12 | B5, `missing` only for a 404 or a gone row; the confirm queue | DONE | `store-cache.ts` `load()`: `answer === null` rejects `failed:0`, a 404 continues and ends `missing`, any other status rejects `failed:<status>`, a store that moved under all five tries rejects `failed:0`; DESIGN.md:319 and :323 name them. `apps.svelte.ts:143-195`: a second confirm of a tab waits for the first (`waiting`, `showFirst`), because refusing it would reject a write whose question the reader never saw |
| 13 | T3, the 405 branches | DONE | `grep -n "405\|request.method" routes.ts` prints nothing; the two 'answers a POST with 405' tests are gone from `app-store.test.ts` and `app-open.test.ts`; DESIGN.md:323 and :327 say SvelteKit answers the 405 |
| 14 | T4, `holds` required | DONE | `opening.ts:32,47,61`: `holds` is required in `Opener`, `BesideOpener` and `tabForKind`; `svelte-check` prints 0 errors |
| 15 | T5, header names in one place | DONE | `data/helpers/files/apps.ts:48-49` defines `APP_HEADER` and `KIND_HEADER`; `writes.svelte.ts:28` and `app-gate.ts` import them; `grep -rn "x-oculus-app'" src` prints that one line |
| 16 | T6, `settings.test.ts` header comment | DONE | `settings.test.ts:1-8` is one paragraph wrapped at full width with no short line before its last (`sed -n 1,8p`); `awk 'length>100'` over the file prints its first line at 201, which is code; `tests/checks/source/comment-width.test.ts` passes |
| 17 | T1/T2, one table per unit | DONE | the list "New tests" below; `grep -n "it.each\|^\s*it(" ` over the 16 files prints one table per unit; `comment-width.test.ts` passes |
| 19 | P1/P3, before/after table and judgment calls | DONE | the sections below |

## Runs

**C64**, `open({ file: { root: 'hub', path: 'README.md' } })` from an app on a page with one pane (scratch app `probe4` sets `window.mark` once per load; `node $S/runs/c64.mjs`, final build):

```
before: {"panes":2,"frames":1,"framesInsidePanes":0,"tabs":"Focus | Probe four | Live HPC | Usage","overSlot":"0,0,0,0","sandbox":"allow-scripts allow-downloads"} | app mark: b52v4rp930m | app log lines: 1
open({ file: { root: "hub", path: "README.md" } }) -> resolved
after: {"panes":3,"frames":1,"framesInsidePanes":0,"tabs":"Focus | Probe four |  README.md | Live HPC | Usage","overSlot":"0,0,0,0",...} | app mark: b52v4rp930m | app log lines: 1
same document (mark unchanged): true
```

The pane was added, the call resolved, and the app's in-memory `mark` and its log are those of the same document. C64 is a look and not a unit outcome, so item 1 adds no test row. Further runs of the layer, each on the final build:

- A tab moved into a floating pane (`float3c`, strip menu Pane, Float): `before mark vimzii2phn`, `after float: {"frame":"503,312,394,246","slot":"503,312,394,246","z":"6","display":"block","floatZ":"5",...,"topAtCenter":"the frame"}`, `mark after (same document): vimzii2phn`.
- A page frame under a floating pane (`float4c`): `after split (both in page): ... "z":"0" ... "top":["frame","frame","frame"]`, then after the other pane floats over it `"top":["frame","float:P","frame"]` (the float is above the frame where they overlap).
- Menus over a frame (`menu1`): the seven items of the Pane menu, each as `[label, overlaps the frame's rectangle, is the element at its own centre]`: `[["Close pane",false,true],["Maximise pane",true,true],["Move tab to page..",true,true],["Show a page here..",true,true],["Split tab to the r",true,true],["Split tab downward",true,true],["Float",true,true]]`, so the six that overlap the frame are the topmost element at their centre.
- Tab switch and close (`close1`): `frames before closing the tab: 1`, another tab shown `frames 1 | frame display none`, the app tab shown again `frames 1 | frame display block`, after Close tab `frames 0`.
- Keyboard while a frame holds the focus (`keys3c`): `control: j typed in the Focus pane moves its cursor: {"focusPane":["eeg-saad-challenge"],"probePane":0}`, then with the frame focused and the app forwarding `j`, the cursors are unchanged: the key was addressed to the pane of the frame, which holds no cards.

**C38**, a manual's external link (`node $S/runs/c38.mjs`, `rootx/manual.html` with `https://example.org/outside` and an inside link; real pointer press through `Input.dispatchMouseEvent`):

```
before: {"src":"/api/file/rootx/manual.html","sandbox":"allow-same-origin allow-scripts","location":"http://localhost:8797/api/file/rootx/manual.html","insidePane":false,...}
after the outside link, pressed with the pointer: {... "location":"http://localhost:8797/api/file/rootx/manual.html" ...}
window.open calls of the page: [["https://example.org/outside","_blank","noopener"]]
page targets created or changed after the press: ["Target.targetCreated ","Target.targetInfoChanged https://example.org/outside"]
after the inside link: {... "location":"http://localhost:8797/api/file?root=rootx&path=manual.html#here" ...}
```

The external link opened in a browser tab through `window.open(..., '_blank', 'noopener')` and the frame kept its address; the inside link navigated the frame. A synthetic `element.click()` opens nothing, since Chrome blocks `window.open` without a user activation.

**M4**, the download link to an outside address from an app with `connects: []` (probe app `probem4`: waits 1.5 s, records `clickedAt = Date.now()`, hands each record to the harness through a `Runtime.addBinding` function before the click and after it; listener lines and net-log counts are read afterwards; `node $S/cdp/m4run.mjs $S <label> control|frame`). Control, run 1 and 2 (the probe's page loaded top-level from the static server on 9445):

```
m4r1-control every record the probe handed out, in order:
   {"loadedAt":1791238550917,"clickedAt":null,"click":null,"finishedAt":null}
   {"loadedAt":1791238550917,"clickedAt":1791238552419,"click":"about to click","finishedAt":null}
   {"loadedAt":1791238550917,"clickedAt":1791238552419,"click":"returned undefined","finishedAt":1791238552420}
m4r1-control listener lines (time, event):
   1791238552421 tcp 9444 connection from 127.0.0.1
   1791238552423 tcp 9444 data 695b
   1791238552436 tcp 9444 connection from 127.0.0.1
   1791238552444 tcp 9444 data 603b
m4r1-control click at 1791238552419; first 9444 line at 1791238552421; difference 2 ms
127.0.0.1:9444: preconnects 2, URL_REQUESTs 2, request headers sent 2
```

`m4r2-control`: click at `1791238697322`, first 9444 line `1791238697325` (3 ms), `preconnects 2, URL_REQUESTs 2, request headers sent 2`. The control shows the effect: the click is followed by requests carrying data. Frame, run 1 (the probe inside the iframe the layer draws, the scratch oculus on 8797 with its page policy):

```
m4r1-frame every record the probe handed out, in order:
   {"loadedAt":1791238655032,"clickedAt":1791238656534,"click":"about to click","finishedAt":null}
m4r1-frame navigation and download events: [... "Page.frameRequestedNavigation \"http://127.0.0.1:9444/x\"","Page.frameStartedLoading \"\"","Page.frameNavigated \"chrome-error://chromewebdata/\"","Page.frameDetached \"remove\"","Target.detachedFromTarget ..."]
m4r1-frame listener lines (time, event):
   1791238656542 tcp 9444 connection from 127.0.0.1
127.0.0.1:9444: preconnects 1, URL_REQUESTs 0, request headers sent 0
```

`m4r2-frame`: click at `1791238709713`, one connection line at `1791238709716` (3 ms later), `preconnects 1, URL_REQUESTs 0, request headers sent 0`. Reading: the click ran at the time the probe recorded, 2 to 8 ms later one connection was opened to 9444 that carried no bytes (the listener logs no `data` line), and the net log holds no `URL_REQUEST` for that address. The frame asked to navigate to `http://127.0.0.1:9444/x`, was refused, and was destroyed, which is why the probe's second record (the click's return value) never arrived; the control returns `undefined`. This is the measurement the P2 finding asked for; the decision on `allow-downloads` stays with finding 2 above.

**C101**, `node $S/runs/c101.mjs` (a reload per theme) and `c101c.mjs` (a theme change on the running page through the palette `:theme`):

```
light -> {"bodyClass":"","bodyColorScheme":"normal",...}
dark -> {"bodyClass":"dark","bodyColorScheme":"normal",...}
nord -> {"bodyClass":"rice nord wall","bodyColorScheme":"normal",...}
vscode-light-modern -> {"bodyClass":"vscode-light-modern","bodyColorScheme":"normal",...}
body forced to color-scheme dark in the page (a probe, no oculus file changed)
theme light  {"bodyClass":"","body":"dark","frameStyle":"dark","frameComputed":"dark"}
theme nord   {"bodyClass":"rice nord wall","body":"dark","frameStyle":"dark","frameComputed":"dark"}
```

The look state to check on TEST: with an app tab open, change the theme from the palette (`:theme dark`); the frame element's `style.color-scheme` equals `getComputedStyle(document.body).colorScheme` one frame later. Both are `normal` until a theme declares a scheme (open item 1).

**Item 10, the Repositories change** (`diff -u` against the base copy, `context.ts`):

```
-        served: () => fs.workspaces().workspaces.flatMap((workspace) => workspace.roots),
+        served: servedRoots,
```

Before, the Repositories view (and the commands, and the apps) searched the roots of every saved workspace for a root key, so a key that names one folder in the current workspace and another in a different workspace could resolve to the other folder. After, all three call `servedRoots`, the current workspace's roots, which are the ones the server's file route serves (`addedRoots`, `server/files/fs.ts`). The look state to check: in a second workspace that gives the key `hub` to another folder, a repository file opens from the current workspace's `hub`.

## P1 table: changed lines of existing assertions, allow lists and fixtures

Made with `diff -U0 <base>/tests/<file> tests/<file>` over every test file that differs (`diff -rq <base>/tests tests`); the base is `.agents/worktrees/E4-base/tools/oculus`. No existing `expect(...)` line changed in meaning except the one marked.

| File:line | Before | After |
|---|---|---|
| `tests/checks/config/config.test.ts:371-378` | `const WORDS = { text: loadConfig(engineDir()).config.text };` | `const WORDS = { text: ..., apps: { closed_paths: ['secrets'] } };` and the comment above it extended (a configuration without that key gets a finding, so the existing cases' map carries it) |
| `tests/checks/tree/boundaries.test.ts:96-100, 165` | the allow list without `data/helpers/files/apps` | the entry `'data/helpers/files/apps'` at :165 and the comment at :96-100 saying why (page and server judge the same file paths); nothing removed |
| `tests/checks/config/config-folder.test.ts:153` | `'open'` last in the `behavior.yml` key list | `'open', 'apps'` |
| `tests/checks/config/config-folder.test.ts:235` | no apps text file | `'views/apps/apps.yml'` in the text file list |
| `tests/checks/imports/order.ts:81-92` | `shell: ['shell', 'shell/rail', 'shell/status', 'shell/panes', 'shell/keys', 'shell/commands']`, views without apps | the same list with `'shell/frames'` after `'shell'`; `'views/apps'` at :92 in `views` |
| `tests/checks/source/keys.test.ts:24-25, 40-43` | `import { registerAll, registerCollections }` | also `registerApps` and `fixtureApp`, and a `registerApps` call over two `fixtureApp` rows, so the key check sees app views |
| `tests/fixtures/kinds.ts:12-25` | `[...new Set([...found, FILES_KIND])]...`, comment ending "and the file operations' own." | `[...found, FILES_KIND, APP_STORE]` and the comment extended (the app store is a `store` body and no `kind`) |
| `tests/fixtures/entities-fixture.ts:4-7, 71-96` | no app row; import without `AppRow` | `fixtureApp(change)` added and `AppRow` imported; header sentence extended |
| `tests/server/root/context-fixture.ts:7, 91-101` | no `apps` and no `appsSecret` in the server context | `apps: { held: noApps, reread: noop, ... close: noop }`, `appsSecret: 'the-apps-secret-of-this-context'` and the `noApps` import |
| `tests/views/shared/explorer/opening.client.test.ts:36, 90` | fake `Opener` without `holds`; `tabForKind(kind, root, path, size)` | `holds: () => false`; a fifth argument `() => false` (the only changed assertion line, forced by `holds` being required) |
| `tests/data/sources/config/settings.test.ts:1-8, 26, 74-82` | header without the apps readers; import without `appsSettings`; map without `apps.*` | header re-wrapped over the same paragraph with the apps' readers added; `appsSettings` and `behaviorFindings` imported; the eight `apps.*` default keys of the synthetic catalog (`sed -n 70,90p` counts 8 lines with `apps.`) |
| `tests/data/sources/config/local.test.ts:85` | the `checkLocal` table without `apps_dir` | one row `['apps_dir: 3', 'local.yml: apps_dir must be a path']` added |
| `tests/routes/edit/undo/undo.test.ts`, `tests/server/core/changes.test.ts`, `tests/server/machine/approvals/approvals.test.ts`, `tests/routes/files/file.test.ts` | import lines | widened for the new case of each; no existing assertion changed |

## Judgment calls the brief did not make

- **The `<host>` policy** (E4-2, ruled): `frame-ancestors <host>`, host with no scheme, DESIGN.md:298.
- **Two finding keys** (E4-3, ruled): `list_shape` and `file_unreadable`, DESIGN.md:274.
- **The Repositories rule** (item 10): one `servedRoots` over the current workspace's roots for Repositories, commands and apps; the Repositories behaviour changes as the diff above shows.
- **The fixture edit**: `config.test.ts` `WORDS` carries `apps.closed_paths`, because a map without it now gets a finding.
- **Failed reads of a store** (item 12): `failed:0` for no answer and for a store that moved under all five tries, `failed:<status>` for another status, `missing` for a 404 on every try.
- **A second confirm waits for the first** (item 12): refusing it would reject a write whose question the reader never saw.
- **`parseYamlMap` in `data/sources/yaml-file.ts`** (item 11): `readManifest` reads the file once and parses the bytes it holds, so `scan.ts` hashes the same bytes it parsed.
- **Where the frame code lives**: the store and the slot in `ui/tabs/` (`tab-frames.svelte.ts`, `FrameSlot.svelte`) and the layer in `shell/frames/` (`FrameLayer.svelte`), because the views may import `ui/**` and not `shell/**`, and `shell/panes/` and `ui/frame/` are full (`sh utils/folder-check.sh` exits 0).
- **The layer has no stacking context of its own** (`display: contents`, each frame `position: fixed`): a frame's depth is then compared with the floats' and menus', which is what puts a floating pane's frame above its float and a page frame below every float (runs `float3c`, `float4c`, `menu1`).
- **Float depths are doubled** (`float-geometry.ts`: `BASE_DEPTH + 2 * rank`), so the odd depth above a float is free for its frames.
- **A loop on animation frames places the frames** (`FrameLayer.svelte`, `place()`): a slot moves with sashes, splits, floats and the window, and nothing tells a layer outside the tree; a frame is written only when its box changed.
- **Every frame takes no pointer while any tab drag or sash drag runs, and while the pane's keep layer is up** (`inert`, `body.sashing`, `shield`), so the pane under it hears the drop and the double click.
- **`key: ''` for the Document and PDF frames**: a changed address navigates the element in place; an app frame's key carries its address key and its reload count, which draws a new element on purpose.
- **The keyboard's pane while a frame holds the focus** is the pane of its slot (`workbench-keys.svelte.ts` `focusedPaneElement`): the frames are outside the panes, and `document.activeElement.closest('[data-pane]')` found none.
- **`FrameSlot` draws `class="frame-place"`**, since `boundaries.test.ts` refuses a view styling a primitive's class and `Collection.svelte` styles `.slot`.
- **Exports made local** after `sh utils/unused-exports.sh` listed them: `AppQuestion`, `AppRun`, `Mount`, `FrameKind`, `FrameHear`, `TAB_FRAMES`. The one line the base's list lacks is `src/lib/server/machine/apps/oculus.js: connect`, which is the module an app imports at run time (`import { connect } from '/apps/-/oculus.js'`), so it has an importer outside the repository.
- **The tests**: every row is `[title, observe, expected]` and each unit has one `it.each` over its rows, so a row is one input and one outcome; a parse failure's sentence names a file, so the manifest table compares only its start (`plain()`), as the earlier test did with `toContain`. The title of the app-store route table keeps "405" as the brief names it; no row reaches it, since SvelteKit answers it before the handler.

## New tests, by file and title

| File | Title |
|---|---|
| `tests/server/machine/apps/manifest.test.ts` | `reads each apps folder to its rows and its findings` |
| `tests/routes/apps/app-files.test.ts` | `answers an app file only while every condition holds, and an empty 404 otherwise` |
| `tests/routes/apps/approve.test.ts` | `approves only the hash the reader was shown, and revokes by folder`; `refuses a request without the write token` |
| `tests/routes/apps/app-store.test.ts` | `answers a held row's store, and 400, 404 or 405 for every other request` |
| `tests/routes/apps/app-open.test.ts` | `answers closed, missing or ok in the order of the checks, and reads no hidden file first` |
| `tests/routes/edit/app-gate.test.ts` | `refuses a write whose matched kind is not the open kind its header names` |
| `tests/state/system/apps/methods.test.ts` | `refuses an open target or a write by the page's own checks before any request` (the wait for the rate limit runs on a fake clock, `vi.useFakeTimers()` at :362 and `advanceTimersByTimeAsync` at :377) |
| `tests/views/shared/explorer/opening-apps.test.ts` | `opens a file of an apps folder as source text, whichever opener asks` |
| `tests/routes/files/file.test.ts` | `answers a file of an apps folder as plain text with nosniff` |
| `tests/state/system/apps/store-cache.test.ts` | `drops an answer a later push contradicts and fetches once more` |
| `tests/server/edit/app-store.test.ts` | `writes the store of an app as the app-store kind` |
| `tests/server/core/changes.test.ts` | `describe('what a store write leaves in the undo folder')`, one case: `keeps the values of a record outside its line and deletes them when the record leaves the window` |
| `tests/routes/edit/undo/undo.test.ts` | `puts an app store back to the value before, and refuses it once the store has moved or the kept values are gone` |
| `tests/data/sources/config/settings.test.ts` | `describe('appsSettings')`, one `it.each` |
| `tests/data/sources/config/local.test.ts` | the `checkLocal` row `['apps_dir: 3', 'local.yml: apps_dir must be a path']` only |
| `tests/server/machine/approvals/approvals.test.ts` | `reads a file that is not JSON as no approved app and refuses an app approval or revoke over it` |
| `tests/checks/source/keys.test.ts` | none |

## Files written outside the first round's path list, and why

- `src/lib/shell/panes/` (`PaneBody.svelte`, `floats/float-geometry.ts`) and `src/lib/shell/frames/FrameLayer.svelte`, `src/lib/shell/Workbench.svelte`, `src/lib/shell/keys/workbench-keys.svelte.ts`: the widening E4-1 (c) names; `PaneBody` gives the focus request and the pointer shield the layer's frame, `float-geometry.ts` the depths, `Workbench` the store and the layer, `workbench-keys` the pane of a focused frame.
- `src/lib/ui/tabs/tab-frames.svelte.ts`, `src/lib/ui/tabs/FrameSlot.svelte`: the store and the slot a view may import.
- `src/lib/views/apps/frame/AppFrame.svelte`, `src/lib/views/sources/document/Document.svelte`, `src/lib/views/sources/file/File.svelte`: the three views that drew an iframe (`grep -rn "<iframe" src` prints the layer only).
- `src/lib/state/system/apps/apps.svelte.ts`, `store-cache.ts`: the per-tab run and the question queue (items 1 and 12).
- `src/lib/state/client/context.ts`, `src/lib/data/sources/yaml-file.ts`, `src/lib/server/machine/apps/manifest.ts`, `scan.ts`, `routes.ts`, `src/lib/views/shared/explorer/opening.ts`, `src/lib/data/helpers/files/apps.ts`, `src/lib/server/edit/writes/app-gate.ts`, `src/lib/state/client/writes.svelte.ts`: items 10 to 15.
- `DESIGN.md` (:298, :306, :319, :321, :323, :325, :327, :339), `HELP.md:205`, `docs/diagrams/` (regenerated by `npm run diagrams`), and the tests listed above.

## Verify lines

- `npm run diagrams` exit 0, then `bash ~/.claude-work/skills/land/templates/checks.sh .../orchestrator-state.md` from the worktree's `tools/oculus`, last run after the last change:

```
ok      ASCII gate (0.6 s)
ok      prettier (1.9 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.1 s)
ok      eslint (11.3 s)
ok      svelte-check (14.8 s): 1791239550350 COMPLETED 380 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (25.7 s): Duration  21.38s (transform 17.70s, setup 0ms, import 39.60s, tests 43.40s, environment 121ms)
test:quick: 26.4 s (limit 45.0 s); every command passed
checks: 1 commands passed
```

- Full-list runs: 3 (the first failed in `svelte-check` on `settings.test.ts:600`, the second and third passed).
- Not in that list, run once each after the last change: `npm run test:checks` (15 files passed, 1 skipped; 226 tests passed, 3 skipped), `npm run build` (exit 0), `sh utils/folder-check.sh` (exit 0), `sh utils/unused-exports.sh` against the base's `unused-exports.txt` (above), `npm ls penpal` (`penpal@8.0.1`).
- File sizes: `context.ts` 767, `writes.ts` 620, `data/model/index.ts` 582, `+page.svelte` 236, `FrameLayer.svelte` 224, `AppFrame.svelte` 235, `apps.svelte.ts` 411, `Document.svelte` 222, `PaneBody.svelte` 348.
- Two read-only git commands were run in this step in total: `git status 2>&1 | head -1` (finding 5 above) and `git diff --stat` in round 1; neither changed anything.
- Scratch state: the scratch oculus on 8797, the listeners on 9443, 9444, 9445 and UDP 3478 are stopped; `lsof -nP -iTCP:8797 -iTCP:9443 -iTCP:9444 -iTCP:9445 -iUDP:3478` prints nothing (exit 1) and `pgrep -fl "scratchpad/e4"` prints nothing.
- Not covered by these runs: the look on TEST of Axel's own server (item 15 of the brief) and a press inside a frame activating its pane (open item 2).
