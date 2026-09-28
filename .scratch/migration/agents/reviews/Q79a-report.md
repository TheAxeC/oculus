# Q79a report

Everything in the brief and in repair round 1 is done. The full verify list was not run in round 1; its brief says the orchestrator runs it on main at landing. The one run in round 0 stopped red on `npm test`: six cases timed out at 5 s while the load average was 12.65 to 14.75.

## Open items (verbatim from the main checkout's orchestrator-state.md, "## Open items", read only)

- None.

## The cases' first run (round 0, against the unchanged tree, before any source change)

- tests/server/root/hooks-server.test.ts, "the origin guard on /api/":
  - Red: the foreign-Origin 403 case, the cross-site-without-Origin case and the encoded-address case (`/%61pi/fs` with an evil Origin gives 403).
  - Green: the same-origin, `none`, own-host, neither-header hook and mail callback cases.
- tests/server/root/hooks-server.test.ts, "the configuration a route reads": both cases red (the search caps after a `max_hits` edit, and the mail callback words after an `inbox.yml` edit).
- tests/server/core/auth.test.ts:
  - Red: the `sameOrigin` own-host and same-site cases, the gatedBody token-carrying case and the JSON-answer shape case.
  - Green: the gatedBody no-token case.
- Green on the unchanged tree:
  - the sameValue cases (tests/server/edit/yaml-edit.test.ts)
  - the text-kind cases
  - the refresh.test.ts escape cases
  - the first new server-args case

  These cases hold rules the change must keep, so passing before the change is expected.
- tests/checks/bin/migrate-joint-work.test.ts, the note case: red.

The cases written after the change, whose failures with the change undone are quoted under Verify:
- the round 1 cases
- tokenedBody (auth.test.ts)
- the typed-argument case (server-args.test.ts)
- readArgs (cited-lines.test.ts)
- the command-line case (migrate-joint-work.test.ts)
- rootsOf (rename-pillar.test.ts)
- the handed-back refusal (diagrams.test.ts)
- the engine-without-configuration case (deposit.test.ts)

## What to build, one row per item (all DONE)

| # | Built at | Proof |
|---|---|---|
| 1 | Every server answer is kit `json(body, { status, headers })`; the local helpers are gone | `grep -rn "new Response(JSON.stringify" src \| wc -l` prints 0 |
| 2 | `sameOrigin(headers, host)` auth.ts:49; the guard `refused` hooks.server.ts:41, applied at :67; `UNGUARDED` :15; `HEADERLESS` :23; DESIGN.md "Auth" :146 | `grep -rn "sameOrigin(" src \| grep -v "export function"` prints only hooks.server.ts; the guard cases below |
| 3 | Routes read `locals.config().config`; `ServerContext.config` removed | `grep -rn "locals.server.config" src \| wc -l` prints 0 |
| 4 | `isDeepStrictEqual` in yaml-edit.ts, deck-edit.ts, entry-edit/entries.ts, entry-edit/lines.ts, and (round 1) audit-mute.ts:53 and rail.ts:78; rows.ts:178 keeps JSON with its reason at :178-179 | `grep -rn "deepEqual\b" src` prints nothing |
| 5 | text-kind.ts:36, `TextDecoder` with `fatal` and `stream` | text-kind tests pass |
| 6 | `parseArgs` in args.ts:44, cited-lines.mjs:40, migrate-joint-work.mjs, rename-program-to-pillar.ts:92 | server-args, cited-lines, migrate and rename cases pass |
| 7 | refresh.ts: `stripVTControlCharacters`, `delay` from node:timers/promises | usage tests pass (round 0: 47 passed) |
| 8 | migrate-joint-work.mjs `fileText`, yaml `Document` + `stringify` with `flowCollectionPadding: false` (:342) | migrate-joint-work.test.ts 6 passed |

## Round 1, one row per item (all DONE)

1. **A request with neither header is refused, outside the second list.**
   - auth.ts:53 is `if (origin === null) return false;`.
   - hooks.server.ts:17-23 holds `HEADERLESS = ['/api/hook', '/api/memories', '/api/wallpaper', '/api/diagrams/[name]']` with its reason. `refused` passes a request with neither header to one of those paths at :45-46; any header present goes to `sameOrigin`.
   - These state the rule: DESIGN.md "Auth" :146, the auth.ts head comment :1-19, the `sameOrigin` doc comment, and the guard's comments at hooks.server.ts:35-40 and :61-64. The claim that every browser sends one of the two headers is gone: `grep -rn "always sends one\|every browser sends" src DESIGN.md` prints only socket.ts:13, which is about the Origin a browser sends on a WebSocket upgrade.
   - Cases:
     - hooks-server.test.ts: "refuses a request with neither header to a route outside the four that admit one" (the file route and /api/lines give 403 `{error:'forbidden'}`, resolve not reached).
     - "lets the hook's curl through, which sends neither header" (POST).
     - "lets the command line's request for a picture through, which sends neither header" (GET /api/wallpaper).
     - "judges a picture request that carries a header by the one rule" (GET /api/wallpaper, cross-site, no Origin, gives 403).
     - auth.test.ts: "refuses a request with neither header".
2. **The callbacks through `handle`.** hooks-server.test.ts "lets a provider's redirect reach each callback" uses `/api/(accounts)/calendar/callback` and `/api/(accounts)/mail/callback` with `Sec-Fetch-Site: cross-site`, and each reaches resolve.
3. **The hook case went.** The case "answers 200 for a same-origin Origin" is gone from tests/routes/sessions/hook.test.ts.
4. **The JSON comparisons.**
   - audit-mute.ts:53 and rail.ts:78 use `isDeepStrictEqual` (import from node:util).
   - rows.ts:178-179 carries: "Compared as JSON text: a wanted row's optional field may be set to undefined, which the file cannot hold and JSON drops, so a deep comparison would call the two different."
   - The rail and audit-mute route tests and rows.test.ts pass (run below).
5. **Flow lists without padding.**
   - migrate-joint-work.mjs:342 sets `flowCollectionPadding: false`, and `fileText`'s head comment says so.
   - New case "writes a list inside an entry on one line with no padding inside its brackets" checks the line `    tags: ["federated"]` in joint-work.yml and `    affiliations: ["ku-leuven", "uz-leuven"]` in people.yml.
   - The strings stay double-quoted, as `fileText`'s head comment and `defaultStringType: 'QUOTE_DOUBLE'` state. So the line reads `tags: ["federated"]`, not the brief's `tags: [federated]`; the padding is the part item 5 changes.
6. **Comments.**
   - search/+server.ts:6-8: the configuration is `locals.config()` read at the request, and the engine and the machine's file come off the ServerContext.
   - roots.ts:13-16: the same.
   - git-routes.ts:5-8 and deposit-routes.ts:5-10: a request reaches the module only past the origin guard in `handle`. The deposit comment's "carries this application's own origin" also went, since the route no longer checks it.
7. **`unconfirmed` moved.**
   - It is now exported from git-routes.ts:99. deposit-routes.ts:19 imports it from './git-routes.ts'.
   - core/auth.ts no longer holds it (`grep -n unconfirmed src/lib/server/core/auth.ts` prints nothing).
   - server/git already holds 10 items, so the function did not go into a new module there.
   - Its two cases moved unchanged from auth.test.ts to the end of tests/routes/git/git.test.ts.
   - `npm run diagrams` regenerated docs/diagrams/writes.dot and writes.svg.
8. **One token-then-JSON reader.**
   - `RefusalShape` (auth.ts:78) gained `words?: { token?: string; json?: string }`.
   - `gatedBody` (auth.ts:110) is `tokenedBody(request, token, { words: { token: 'forbidden', json: 'bad body' } })` plus its map check.
   - fs.ts `handleFsWrite` (:549) is `tokenedBody(request, token, { headers: NO_STORE, words: { token: 'token', json: 'not-json' } })`, the words and no-store header its base answered with (main checkout fs.ts:548-553 and its `json` helper :363-367).
   - `grep -rn "hasToken(" src` prints only auth.ts and search-routes.ts:47, a GET that carries the token and no body.
   - New case: tokenedBody "answers each refusal in the route's own words when the shape names them".
   - Changed cases:
     - fs.test.ts's refusal case now checks the whole body and `cache-control: no-store`.
     - The JSON-answer case checks gatedBody's 400 for both a non-map body and an unparseable one.
     - The two gatedBody case names drop "with neither origin header", which the function no longer reads.

Items 9 to 12 are the sections below.

## Cases changed from the brief

- **The brief's `json()` case.** It was to compare changes.ts's `{ error: 'origin' }` answer with a hand-built one. That answer no longer exists: the guard answers every origin refusal. The case compares gatedBody's 403 `{error:'forbidden'}` and 400 `{error:'bad body'}` answers instead.
- **The sameOrigin case.** "admits a request with neither header" became "refuses a request with neither header".

## Reader-visible changes, before and after

**The 403 of an origin refusal.** Every route that refuses on origin now answers `{"error":"forbidden"}` with `content-type: application/json` (curl on the build: `content-type: application/json` on GET /api/changes with an evil Origin). Before, grouped by base body (main checkout, read only: `grep -rln "did not come from this page" src`, `grep -rn "error: 'origin'" src`, and the refusal lines of files.ts, the file route, diagrams.ts, wallpaper.ts, images.ts, lines.ts and setup.ts):

| Base body | Routes |
|---|---|
| `{"error":"origin"}` | fs, changes |
| `{"error":"the request did not come from this page"}` | docs, latex, write, open, source, search, deposit, git, terminal, transcript, customizations, agents, project-files, memories upload |
| `{"error":"the request did not come from this machine"}` | hook |
| empty body | the file route, memories listing and picture, wallpaper, diagrams |
| `{"error":"forbidden"}` (unchanged) | connect, lines, calendar, mail, hpc, usage/refresh |

**A request with neither header.** Every route answers it with the same outcome as on the base. Where the base refused it, the refusal body is now the one above. Curl on the build, port 8796, scratch engine and hub, no headers:

| Request | Before | After |
|---|---|---|
| GET connect, docs, latex, changes, file/hub/notes.txt, fs, project-files, source, deposit, git, lines, agents, terminal, customizations, transcript, search | 403 | 403 `{"error":"forbidden"}`, each of the 16 |
| POST /api/write, JSON body, no token | 403 | 403 `{"error":"forbidden"}` |
| POST /api/hook | 200 | 200 `{"ok":true}` |
| GET /api/memories | 200 | 200 `{"images":[]}` |
| GET /api/wallpaper | reaches the route | 404 from the route (no wallpaper set on the scratch engine) |
| GET /api/diagrams/layers.svg | reaches the route | 404 from the route |

**The hook and the pictures with a header** (the round's ruling, curled on the build):

| Request | Before | After |
|---|---|---|
| POST /api/hook, `Sec-Fetch-Site: same-origin`, evil Origin | 403 (hooks.ts refused any foreign Origin) | 200 `{"ok":true}` |
| POST /api/hook, `Sec-Fetch-Site: cross-site`, no Origin | 200 (hooks.ts read Origin only) | 403 `{"error":"forbidden"}` |
| POST /api/hook, evil Origin | 403 | 403 `{"error":"forbidden"}` |
| GET /api/wallpaper, `Sec-Fetch-Site: cross-site` | 403 empty | 403 `{"error":"forbidden"}` |
| GET /api/memories, evil Origin | 403 empty | 403 `{"error":"forbidden"}` |

**Other host checks** (curled on the build):
- GET /api/changes with `Sec-Fetch-Site: same-origin` gives 200 `{"changes":[],"page":50}`.
- Both callbacks with `Sec-Fetch-Site: cross-site` and `state=nope` give their 400 page.

Round 0's curls showed the configuration read per request:
- Search after `max_hits` went 500 to 1 with no restart: `total: 1, truncated: True`, then back to `total: 3`, with the same pid.
- The mail callback showed an `inbox.yml` sentence edited while the server ran.

**Not verified: a picture request with an empty `Origin:` header.** Reading images.ts:302 on the base, it was admitted. With the ruling that any header present is judged by the one rule, it is now refused, since `sameOrigin` sees an Origin that is neither allowed nor this host. No test covers it, and curl drops an empty header, so it was not curled.

## Judgment calls

- **Route matching.** The guard judges the route Kit matched (`event.route.id`, `(group)` segments stripped), not `event.url.pathname`, so `/%61pi/fs` is judged as /api/fs. A request that matches no route has a null id and Kit answers it 404.
- **JSON comparisons.**
  - audit-mute.ts and rail.ts compare with `isDeepStrictEqual`: their wanted values carry no optional field (`RailEntry` is three required strings, the mute list is strings).
  - connect/rows.ts:178 keeps its JSON-text comparison: a wanted row's optional field may be set to undefined, which JSON drops and `isDeepStrictEqual` does not.
  - The publish dedupes in config-seed.ts, watch/git.ts and watch/sessions.ts compare what goes on the wire, which is JSON.
- **`unconfirmed`'s home.** It is exported from git-routes.ts rather than a new module: server/git holds 10 items, the folder limit.
- **The migration's output.**
  - It writes strings double-quoted and flow lists without padding (`["ku-leuven", "uz-leuven"]`). Keys, order and values are unchanged.
  - An empty entry list is written `entries: []`. It was `entries:` with nothing after it, which read back as null.
- **Flags.** The migration and cited-lines.mjs refuse an unknown flag, and a string flag with nothing after it, with their usage and exit 2. rename-program-to-pillar.ts refuses any flag; a word after `--` is a root.
- **Removed per-route origin cases.** The per-route origin cases of 19 route and server test files were removed or narrowed to what the route still decides. The guard's cases in hooks-server.test.ts replace them.
- **A test fixture.** terminal-actions.test.ts's case "the caller hands it no config" went: `configFor` is required.
- **Types and options.**
  - files.ts's uncalled `roots()` was removed.
  - WriteTarget gained `career: CareerRules`.
  - DepositOptions gained `config`, and `hubTarget` refuses an engine without one.
  - GitOptions' `engine` became `config`.
- **Duplication.** The token-then-JSON and confirm refusals were folded into `tokenedBody` and `unconfirmed`, and the two write-target test builders into `targetOver`, once the duplication check flagged them. Ten stale entries left allow-duplication.txt.
- **The write diagram's refusal reader** (bin/diagrams/writes.mjs) reads a 4xx `status` in kit's options argument and the `instanceof Response` hand-back.
- **The two callback routes** read the configuration once into `config`, the form keys.test.ts reads as a catalog reader.
- **The text sniff** is stricter at the window's edge. A cut sequence whose bytes so far are already invalid is refused.
- **history.test.ts's upstream-refusal case** uses the token refusal's sentence, since the guard's `forbidden` is only reachable from another origin.

## Verify

Round 1 commands, run from tools/oculus in the worktree after `npm run format`:

- `npx vitest run tests/server/root/hooks-server.test.ts tests/server/core/auth.test.ts tests/routes/git/git.test.ts tests/routes/files/fs.test.ts tests/routes/sessions/hook.test.ts tests/checks/bin/migrate-joint-work.test.ts tests/routes/edit/rail.test.ts tests/routes/edit/audit-mute.test.ts tests/server/accounts/connect/rows.test.ts tests/routes/git/deposit.test.ts tests/checks/tree tests/checks/source tests/checks/diagrams` printed `Test Files  26 passed (26)`, `Tests  293 passed (293)`.
- `npx vitest run tests/server/machine/lines.test.ts tests/routes/git/changes.test.ts tests/routes/files/file.test.ts tests/routes/docs/docs.test.ts tests/routes/edit/write.test.ts` printed `Tests  138 passed (138)`.
- `npm run check`: `COMPLETED 1445 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run format:check`: `All matched files use Prettier code style!`.
- `npm run lint`: exit 0, no findings.
- `npm run diagrams`: exit 0.
- `sh bin/folder-check.sh`: exit 0.
- `LC_ALL=C grep -n '[^ -~]'` over the 18 files round 1 touched: no match (exit 1).
- `npm run build` exit 0, then the host curls above; the server was stopped with `kill` and a curl afterwards got `000`.

Each new or changed case of round 1, with the change it guards undone, then the file put back (a script that swaps one line, runs the test files and restores the file; `grep` afterwards shows every line back):

- auth.ts:53 back to `return site === null`:
  - `FAIL tests/server/core/auth.test.ts > sameOrigin > refuses a request with neither header`, `AssertionError: expected true to be false`
  - `FAIL tests/server/root/hooks-server.test.ts > the origin guard on /api/ > refuses a request with neither header to a route outside the four that admit one`, `AssertionError: /api/(files)/file/[root]/[...path]: expected true to be false`
- The HEADERLESS line removed:
  - `FAIL ... lets the hook's curl through, which sends neither header`, `expected false to be true`
  - `FAIL ... lets the command line's request for a picture through, which sends neither header`, `expected false to be true`
- `neither && HEADERLESS` made `neither || HEADERLESS`:
  - `FAIL ... refuses a request with neither header to a route outside the four that admit one`, `/api/(files)/file/[root]/[...path]: expected true to be false`
  - `FAIL ... judges a picture request that carries a header by the one rule`, `expected true to be false`
- `/api/calendar/callback` dropped from UNGUARDED: `FAIL ... lets a provider's redirect reach each callback`, `AssertionError: /api/(accounts)/calendar/callback: expected false to be true`
- `/api/mail/callback` dropped from UNGUARDED:
  - `FAIL ... lets a provider's redirect reach each callback`, `/api/(accounts)/mail/callback: expected false to be true`
  - `FAIL ... the configuration a route reads > is the disk as it is at the request, for the callback's words`, `expected 403 to be 400`
- tokenedBody ignoring `words.token`:
  - `FAIL tests/routes/files/fs.test.ts > ... refuses a missing token, a body that is not JSON, and an unknown action`, `expected { Object (error) } to deeply equal { error: 'token' }`
  - `FAIL tests/server/core/auth.test.ts > tokenedBody > answers each refusal in the route's own words when the shape names them`, same message
  - `FAIL ... a JSON answer > answers the status, body and content type a hand-built one did`
- fs.ts without `headers: NO_STORE`: `FAIL tests/routes/files/fs.test.ts > ... refuses a missing token, a body that is not JSON, and an unknown action`, `AssertionError: expected null to be 'no-store'`
- gatedBody without `json: 'bad body'`: `FAIL tests/server/core/auth.test.ts > a JSON answer > answers the status, body and content type a hand-built one did`
- `flowCollectionPadding: false` removed: `FAIL tests/checks/bin/migrate-joint-work.test.ts > ... writes a list inside an entry on one line with no padding inside its brackets`, `AssertionError: expected [ ...(35) ] to include '    tags: ["federated"]'`

The moved `unconfirmed` cases are unchanged in content. The isDeepStrictEqual swap in audit-mute.ts and rail.ts is covered by their route tests, which pass. No case goes red for it, since both comparisons give the same answer for these values.

Round 0's red-when-undone results for its cases, unchanged:
- The encoded-address case: routePath on `event.url.pathname` gave `1 failed`.
- text-kind: `{ stream: false }` gave `3 failed`.
- refresh: the raw screen gave `1 failed`.
- server-args: `token.rawName` gave `1 failed`.
- The diagram's `instanceof Response` branch disabled gave `3 failed`.

## Limitations and notes for landing

- **The full verify list** has not run clean on this worktree. Round 0's single run was red on six 5 s timeouts under a load average of 12 to 15. The orchestrator runs it on main at landing.
- **Merge overlap.** When round 0 was built, the main checkout's working tree carried another package's staged edits to context.ts, calendar/routes.ts, connect/actions.ts, DESIGN.md and the layer diagrams, and Q79c's brief names docs.ts and docs.test.ts. This step edits all of them, so the cherry-pick may conflict there. Not re-checked this round (no git command is allowed).
- **Dependencies.** None added: node built-ins and yaml's own `stringify`/`Document` do the work.
