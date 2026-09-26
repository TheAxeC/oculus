Auditor E report: library audit of server/accounts, server/content, server/core, server/edit, server/files and data/

Not done: nothing inside the part was left out. Three things were not checked, and each is marked "not checked" where it comes up: whether Gmail garbles a raw UTF-8 Subject, whether TypeScript 6 compiles against zod 4, and the googleapis fetch-injection option.

## Enumeration

Command, run from tools/oculus: `find src/lib/server/accounts src/lib/server/content src/lib/server/core src/lib/server/edit src/lib/server/files src/lib/data -type f | sort`. It found **111 files, 22,835 lines** (`xargs wc -l`).

The same command in the X3b worktree (`.agents/worktrees/X3b/tools/oculus`) finds 104 files. X3b adds no file under this part. The worktree's base is older, so it lacks 7 files that main has (model-agents.ts, config/agents.ts, connect/actions.ts, loop.ts, rows.ts, setup.ts, core/words.ts); those were audited from main. Four files were read from X3b, as the brief requires:
- git-parse.ts: 315 lines in X3b, 86 on main
- git.ts: 792 lines in X3b, 495 on main
- model/index.ts: 429 lines in X3b
- model/model-sessions.ts: 646 lines in X3b

No file was changed. All packages were unpacked with `npm pack` under the scratchpad. Library facts come from `npm view <pkg> --json` (version, license, the release date of that version from `time[version]`, maintainers, engines, peers) and from the typings of the unpacked packages. None of the candidates has peer dependencies, except valibot (typescript >=5, met by typescript ^6.0.3) and fdir (picomatch). Node here is 24.21.0 (`node -v`).

## C1. OAuth authorization code with PKCE, and token refresh (calendar and mail)

**What oculus has**
- `server/accounts/connect/oauth.ts` (280 lines):
  - The Google and Entra endpoints as data.
  - The scopes for each connector and provider.
  - The PKCE verifier and S256 challenge (node:crypto).
  - A `ConnectStates` map of pending states: taken once, 10-minute expiry, timingSafeEqual.
  - The consent URL, with Google's `access_type=offline&prompt=consent`.
  - The code exchange and the refresh, which keeps a rotated refresh token.
  - An error line of HTTP status plus the provider's code, never the body.
  - The fetcher is injected so tests open nothing.
- `store.ts` (244 lines): the credential files, mode 0600. This is domain logic.

**Candidates**
- **arctic 3.7.0**: MIT, released 2025-05-21, pilcrowonpaper, 3 deps (@oslojs).
  - It has `Google(clientId, secret, redirect)` and `MicrosoftEntraId(tenant, clientId, secret|null, redirect)`, with `createAuthorizationURL(state, verifier, scopes)`, `validateAuthorizationCode`, `refreshAccessToken` and `generateState` / `generateCodeVerifier`.
  - It covers the endpoints, the consent URL, PKCE and both token calls. Google's offline/consent parameters are appended to the returned URL by hand.
  - `dist/request.js` calls the global `fetch`, so the injected Fetcher is lost; tests would stub globalThis.
  - `OAuth2RequestError` carries the OAuth code but no HTTP status.
  - It does not cover the state map.
- **oauth4webapi 3.8.8**: MIT, released 2026-09-05, panva, 0 deps.
  - It exports `customFetch` (an injectable fetch), `calculatePKCECodeChallenge`, `authorizationCodeGrantRequest`, `refreshTokenGrantRequest`, `processRefreshTokenResponse` and `validateAuthResponse`.
  - It covers PKCE, the grants and the response checks. The endpoints stay as data (or discovery), and the state map stays.
- **openid-client 6.8.8**: MIT, released 2026-09-05, panva. It is a higher layer on oauth4webapi, built around discovery. Not otherwise examined.
- **google-auth-library 11.1.0** (Apache-2.0, released 2026-09-16, node >=22) and **@azure/msal-node 7.0.0** (MIT, released 2026-09-23): one library per provider, two token caches and two error models, and each wants to own the refresh token.

**Estimate**
- arctic or oauth4webapi would remove about 90 to 120 lines (the endpoint helpers, challengeOf, consentUrl, post, exchangeCode, accessToken).
- About 160 lines would stay: scopes, callback paths, the state map, the refusal line and the keep-rotated-token hook.
- Server only, so no layer or theme concern.

**Options**
1. Keep. The code is short, fully tested with an injected fetcher, and matches the "no body in errors" rule exactly.
2. oauth4webapi. Keeps fetch injection and is spec-audited. Cost: its API is low level, so the saving is modest.
3. arctic. Shortest glue. Cost: it loses fetch injection and the HTTP status in errors, so every connector test changes.

**Recommendation:** keep. The largest saving (arctic) costs the injected fetch and the status in the error line, both of which DESIGN's "no token, secret or body logged" rule relies on. oauth4webapi fits, but it would remove under 100 lines.

## C2. Provider REST readers (Google Calendar, Gmail, Microsoft Graph)

**What oculus has:** about 900 lines.
- `connect/api.ts` (110 lines): getJson, postJson, rowsOf, PAGE_MAX, a refusal line without the body.
- `calendar/google.ts` (118) and `calendar/microsoft.ts` (122): paging with nextPageToken and @odata.nextLink, selected calendars, event edges.
- `mail/google.ts` (191) and `mail/microsoft.ts` (277): signal queries, metadata-only thread reads, reply, archive.

There is no iCalendar parsing and no IMAP. Recurrence is expanded by the providers (`singleEvents=true`, `calendarView`).

**Candidates**
- **@googleapis/calendar 20.0.1** and **@googleapis/gmail 22.0.1**: Apache-2.0, released 2026-09-24, node >=22. They cover typed calls and paging. Whether a fetch can be injected through gaxios is not checked.
- **@microsoft/microsoft-graph-client 3.0.7**: MIT, last released 2023-09-19. Its successor **@microsoft/msgraph-sdk** is at 1.0.0-preview.90 (2026-09-16), still preview.

**Estimate:** about 150 lines of paging and parameter building would go. The field mapping to CalendarEvent and PlateThread, the plate rules and the redaction of errors stay.

**Options**
1. Keep.
2. The Google SDKs only, which leaves two styles of reader.
3. Both SDKs. Cost: Graph's is unmaintained or preview.

**Recommendation:** keep. The Microsoft side has no maintained stable SDK, and the Google SDKs would replace thin fetch calls while adding their own error bodies, which then have to be redacted.

## C3. MIME message for the Gmail reply (finding)

`mail/google.ts` `rawMessage` (lines 128-151) builds RFC 2822 by hand. It writes `Subject:` and `To:` raw, with no RFC 2047 encoding, and a UTF-8 body with no Content-Transfer-Encoding.

**Candidate: nodemailer 10.0.10** (MIT-0, released 2026-09-14, andris, 0 deps, node >=20). Its `MailComposer` (`dist/cjs/mail-composer`), run in the scratchpad, produced `Subject: =?UTF-8?Q?Re=3A_Link=C3=B6ping_rapport?=` with `Content-Transfer-Encoding: base64`, and threaded `In-Reply-To` and `References`.

Whether Gmail garbles a raw UTF-8 Subject is not checked. The hand builder is not standards-conformant for a non-ASCII subject or display name, which a Dutch or Swedish correspondent's name will produce.

mimetext 3.0.28 (MIT, released 2026-01-28, 4 deps) is an alternative.

**Estimate:** removes about 20 lines; the glue stays at about 10.

**Options**
1. Keep, and add RFC 2047 encoding and a transfer encoding by hand.
2. nodemailer's MailComposer.

**Recommendation:** nodemailer MailComposer. It is the established encoder, and it ends a correctness defect rather than moving it.

## C4. Atomic writes and locks

**What oculus has:** `core/json.ts` (133 lines).
- `writeAtomic`: a temporary file in the same folder, the existing mode kept, a rename, cleanup on failure. No fsync.
- `chained`: an in-process write queue.
- No cross-process lock in this part.

**Finding: the tree's own atomic writer is used only partly.** Seven writers call a plain `writeFileSync` on a file the reader owns:
- `edit/writes/entries.ts:47`
- `edit/writes/manifest.ts:200, 295, 296`
- `edit/writes/rail.ts:106`
- `edit/writes/deck.ts:98`
- `edit/writes/audit-mute.ts:84`
- `edit/feeds.ts:245`
- `accounts/mail/triage.ts:83`

Source: `grep -rn "writeFileSync"` over the part. A crash mid-write leaves a truncated project.yml or a truncated config file.

**Candidates**
- **write-file-atomic 8.0.0**: ISC, released 2026-05-08, npm org, 1 dep, engines `^22.22.2 || ^24.15.0 || >=26`, which node 24.21.0 meets. It covers the temporary file, the rename, keeping mode and owner, fsync by default, and serialising concurrent writes to one path.
- **proper-lockfile 4.1.2**: MIT, last released 2021-01-25. It is not needed here: no cross-process lock exists in this part.

**Estimate:** removes about 45 lines of writeAtomic. `chained` and the JSON helpers stay.

**Options**
1. Keep writeAtomic and route the seven writers through `writeTextAtomic`.
2. write-file-atomic everywhere. Gains fsync.

**Recommendation:** write-file-atomic, with the seven writers moved onto it. It removes the hand writer, adds the missing fsync, and one call covers every write.

## C5. YAML edits that keep comments and layout

**What oculus has:** 2,318 lines (`wc -l` over yaml-edit.ts, list-edit.ts, deck-edit.ts, entry-edit/*.ts, connect/rows.ts).
- They use `yaml`'s `parseDocument` node ranges to splice bytes: replace a value, insert a key or list row, remove lines.
- They then re-parse and compare the result with the intended value.
- Readers use: manifest form fields, collection entries, subtasks, host status, deck and rail lists, audit mutes, account rows.

**Candidates**
- **yaml 2.9.0** (already a dependency). Its docs (eemeli.org/yaml) say the CST "retains every character of the input, including whitespace", and that `Document#toString()` re-serialises and normalises spacing. So a Document round trip cannot replace the splicing.
  - A probe in the scratchpad: `CST.setScalarValue` then `CST.stringify` turned `key:   old   # keep` into `key:   "new: value"   # keep`, with alignment and comment kept.
  - The CST has no helper for inserting a key or a list item; tokens would be built by hand.
- **yawn-yaml 3.0.0**: MIT, released 2026-01-16, built on yaml.
- **yaml-diff-patch 2.0.0**: MIT, last released 2022-08-24.

**Finding: yaml used partly.** In `yaml-edit.ts`, `keyLines`, `mapLines`, `listLines` and `renderBlockMap` (lines 206-251), plus `entry-edit/render.ts`, render block maps and lists by hand. `yaml.stringify(value, { indent: 2, lineWidth: 0 })` followed by a re-indent covers them. Scalars already go through `stringify` (renderScalar).

**Estimate:** about 40 to 60 lines. Adopting CST.setScalarValue for scalar replacement alone would remove about 60 to 100 lines, but a second editing mechanism would sit beside the splice code, which insertions still need.

**Options**
1. Keep as is.
2. Keep the splicing, and render blocks with `yaml.stringify`.
3. Move the scalar replacement to the CST.
4. Adopt yawn-yaml or yaml-diff-patch. No candidate matches the byte-for-byte promise plus the verify-by-reparse.

**Recommendation:** option 2. The byte-splicing is needed: no library, and not yaml's Document, keeps hand layout byte for byte. The block renderer is the one part yaml already provides.

## C6. Runtime shape validation of untyped input

**What oculus has:** hand narrowing across about 940 lines, plus parts of validate.ts, agents.ts, triage.ts, mail/routes.ts and store.ts.
- `edit/writes/bodies.ts` (351): one parse function per write kind, a hand discriminated union.
- `sources/config/local.ts` (343): throws a message naming the file and key.
- `sources/config/settings.ts` (166).
- `helpers/guards.ts` (79).
- `snapshot/validate.ts` checkKeys, checkType and checkShapes (about 130 lines).

All messages come from `config/text` keys, as spec.md requires.

**Candidates**
- **zod 4.6.5**: MIT, released 2026-09-13, colinhacks, 0 deps. Whether TypeScript 6 compiles against it is not checked.
- **valibot 1.5.0**: MIT, released 2026-09-09, 0 deps, peer typescript >=5, met.
- **ajv 8.20.0**: MIT, released 2026-04-24, 4 deps. It needs JSON Schema; `manifest-schema.yml` is a form schema, so a generator would be needed, plus ajv-errors for wording.

Zod and valibot cover discriminated unions (bodies.ts), defaults (local and settings), issue paths (file and key), and custom messages, which can be catalog keys through an error map. Both run on the client as well, so layer 1's shared rules can use them. They do not cover the cross-reference checks (ids resolve, vocabularies, people and funders), which stay.

**Estimate:** removes about 400 to 550 lines. The glue that maps an issue to a catalog key stays at about 60 lines.

**Options**
1. Keep.
2. zod.
3. valibot. Same coverage, smaller API.
4. ajv, with generated schemas. More moving parts.

**Recommendation:** zod. It is the most established, has no dependencies, is typed from the schema, and covers every hand parser listed. The model/ types stay the facade (`satisfies z.ZodType<T>`), so no view's imports change.

## C7. Markdown rendering (marked already a dependency)

**What oculus has:** `content/docs.ts` `renderMarkdown` (about 35 lines). It overrides marked's image renderer to rewrite relative sources to `/api/file/...` and escapes attributes by hand (`attribute`, lines 225-232). Sanitising happens on the page (ui/html.ts, outside this part).

**Finding: marked used partly.** A scratchpad probe with `new Marked({ walkTokens(t) { if (t.type === 'image') t.href = ... } })` kept marked's own image renderer and produced `alt="a &quot;q&quot; &lt;b&gt;" title="ti&quot;tle"`. The override and `attribute()` (about 25 lines) can go.

`connect/actions.ts` `escaped()` (lines 91-99) is a second hand HTML escaper for the callback page. It stays unless the two are joined.

**Recommendation:** use walkTokens and drop the renderer override. No new library.

## C8. ETag and 304

`docs.ts` `fileTag` and `answer`: a strong tag of size and mtime, compared exactly with If-None-Match, about 15 lines.

**Candidates:** etag 1.8.1 and fresh 0.5.2 (jshttp, MIT, both last released 2017-09). They add weak tags and If-None-Match lists, which the page never sends.

**Recommendation:** keep. The page sends back the one tag it received, and the libraries add no feature oculus uses.

## C9. Path containment (in-house duplication)

`inside()` or an equivalent `startsWith(root + sep)` is written 13 times (`grep -rn "function inside\|startsWith(.*sep)"`):
- latex.ts:89, docs.ts:118, images.ts:285, open.ts:91, project-files.ts:101, fs.ts:359, files.ts:76
- feeds.ts:54, writes/entries.ts:71, writes/subtasks.ts:188 and :208, writes/manifest.ts:130 and :246, fs/notes.ts:59

**Candidate: is-path-inside 4.0.0** (MIT, last released 2021-05-03, sindresorhus). It is the same three lines.

`images.ts:298` `sameOrigin(headers)` accepts a request with no Origin. `core/auth.ts:38` `sameOrigin(request, host)` refuses one. That is two rules under one name.

**Recommendation:** keep the code, with one exported `inside` in server/core replacing the copies. The library adds nothing over three lines. The two `sameOrigin` rules need reconciling or distinct names.

## C10. Image dimensions and EXIF orientation

**What oculus has:** `content/images.ts` lines 84-280 (about 195 lines). It parses JPEG, PNG and WebP headers from a few hundred bytes, with EXIF orientation for JPEG and for PNG `eXIf`.

**Candidates**
- **image-size 2.0.4**: MIT, released 2026-09-14, netroy, 0 deps, node >=18. `ISize.orientation` is computed in `types/jpg.js` only, and PNG eXIf is not read (`grep -rln orientation dist`). `imageSizeFromFile` reads up to 512 KB (`MaxInputSize = 512 * 1024`).
- **probe-image-size 7.4.0**: MIT, released 2026-08-15, 3 deps.

**Estimate:** removes about 150 lines. The PNG eXIf orientation (about 25 lines) and the quarter-turn swap stay.

**Options**
1. Keep. Few bytes read per file.
2. image-size, reading up to 512 KB per picture on a wall listing.

**Recommendation:** image-size. It removes most of the parser. The added read per picture is disk I/O on a listing, not bundle size; if Axel weighs the listing time, keeping is the alternative.

## C11. MIME types

**What oculus has**
- `files/files.ts` TYPES: 15 extensions, with `application/octet-stream` for anything else.
- `images.ts` TYPES: 4 extensions.

A manual under a root that ships `.mjs`, `.ico`, `.ttf`, `.otf`, `.avif`, `.mp4`, `.csv` or `.wasm` gets octet-stream. A module script served that way is refused by the browser's strict MIME check.

**Candidates**
- **mime 4.1.0**: MIT, released 2025-09-12, broofa, 0 deps.
- **mime-types 3.0.2**: MIT, released 2025-11-20, jshttp.

**Recommendation:** mime, with the charset suffix kept for text types. It removes the table (about 20 lines) and serves every asset a manual can carry.

## C12. Deep equality (built-in duplicated)

`yaml-edit.ts:119` `deepEqual`, `core/changes.ts:101` `same` and `deck-edit.ts:39` `same` are three recursive comparisons of plain JSON or YAML data, with key order ignored. Node's `util.isDeepStrictEqual` covers this on the server (all three are server side).

**Recommendation:** use `isDeepStrictEqual`. It removes about 40 lines; no library needed.

## C13. Git reader and output parsing (X3b copies)

**What oculus has:** git.ts (792 lines) and git-parse.ts (315 lines).
- One `spawnSync` call site with `--no-optional-locks`, list arguments and a 5 s timeout.
- An exact allow-list of about 20 argument vectors, enforced by a test that records every argv.
- Parsers for porcelain v1 -z, numstat -z, the log and graph formats, for-each-ref, stash reflog, worktree porcelain, name-status -z, blame --porcelain and `diff -U0` hunk heads.

**Candidates**
- **simple-git 4.0.2**: MIT, released 2026-09-26, 5 deps.
  - It builds its own argv: status is `status --porcelain -b -u --null`, where oculus uses `--untracked-files=normal`.
  - It has no blame and no worktree parser (grep of dist/index.mjs), and it is async while the callers are sync.
  - The argv allow-list test and DESIGN's exact vectors would no longer hold.
- **isomorphic-git 1.42.2**: MIT, released 2026-09-11, 11 deps. A reimplementation. Its API (index.d.ts) has no blame, no worktree and no check-ignore of stdin names, and it exports writing functions that the read-only module forbids.
- **nodegit 0.27.0**: MIT, last released 2020-07-28, native build.
- **parse-git-diff 0.0.20** (released 2026-02-14) and **parse-diff 0.12.0** (released 2026-04-17): would replace only `parseLineMarks` (about 20 lines).

**Recommendation:** keep. No candidate runs exactly the allow-listed read-only vectors, and blame and worktree parsing are missing from all of them.

## C14. Text or binary sniff

**What oculus has:** `data/helpers/text-kind.ts` (74 lines), a hand UTF-8 validator with the cut-sequence rule, used by the page and by `files/source.ts`.

**Candidates**
- Built-in `new TextDecoder('utf-8', { fatal: true }).decode(window, { stream: cut })` plus a NUL scan covers the same rule. It runs in both the browser and node, so layer 1 stays client-safe.
- isbinaryfile 6.0.0 (MIT, released 2025-12-05, node >= 24): a different heuristic, and node only.

**Recommendation:** TextDecoder. It removes about 45 lines with no dependency.

## C15. Front matter

**What oculus has:** `data/sources/docs.ts` `splitFrontmatter` and `readFrontmatter` (about 45 lines): a regex split and yaml parse, with a catalog-worded finding.

**Candidates**
- gray-matter 4.0.3: MIT, last released 2021-04-24, depends on js-yaml ^3.
- front-matter 4.0.2: last released 2020-05-29.

**Recommendation:** keep. Both candidates are unmaintained and bring a second YAML parser beside `yaml`.

## Checked and already fully used

- `@vscode/ripgrep`: `files/search.ts` runs `rg --json` and folds the stream (data/helpers/search.ts:103).
- `yaml` `LineCounter`: used for line-numbered refusals in config/agents.ts.

## Domain logic, no library covers it (one line each)

- Connector accounts, poll cadence, consent actions and setup (connect/actions, loop, setup): oculus's own account model and write chain.
- Calendar and mail pollers and routes, the mail plate rules, triage notes: portfolio behaviour.
- The audit scan (content/audit*): the hub's own rules.
- LaTeX main-file detection and log parsing (content/latex.ts): `npm view` found none of latex-log-parser, @overleaf/latex-log-parser, texlog-parser or latex-log-parser-ts, and `npm search` gave nothing relevant.
- Picture wall, wallpaper and diagram serving: routes over C9, C10 and C11.
- Origin and token gate (core/auth.ts); change log (core/changes.ts); catalog wording (core/words.ts).
- Channel hub with latest-only backpressure (core/channels.ts, files-channel.ts): DESIGN's protocol.
- Single-file stat poll (core/file-poll.ts): chokidar 5.0.0 (released 2025-11-25) in polling mode would do one stat per tick, but not on a caller-held clock, which the tests need.
- The write endpoint, the undo table, writers for manifest, entries, subtasks, deck, rail, mutes and feeds: the domain over C5.
- File browser listing, workspaces, bookmarks, notes, roots, the macOS `open -R` / `open -b` handling with Finder alias checks, the project file walk (25 lines of readdirSync; fdir and tinyglobby save nothing): domain.
- Snapshot composition, normalise, validate (cross-references), validate-themes, indexing: DESIGN's wire model.
- Source readers (manifests, registries, collections, career, feeds, present, config merge with duplicate-key findings, catalogs, rail, themes, folder): the hub's own files.
- Shared layer-1 rules (deck, editor, finding-text, opens-in-program, tasks, worktrees, search query, account naming, leads, chat) and dates.ts (10 lines of built-ins).
- model/*: type declarations only.

## Coverage table (111 files; C = capability section above, D = domain logic)

| File | Capability |
|---|---|
| src/lib/data/accounts/calendar.ts | D account rules |
| src/lib/data/accounts/chat.ts | D account rules |
| src/lib/data/accounts/connect.ts | D connector naming rules + C6 |
| src/lib/data/accounts/leads.ts | D account rules |
| src/lib/data/accounts/mail.ts | D account rules |
| src/lib/data/helpers/dates.ts | D local date (built-ins) |
| src/lib/data/helpers/deck.ts | D shared rule |
| src/lib/data/helpers/editor.ts | D shared rule |
| src/lib/data/helpers/finding-text.ts | D shared rule |
| src/lib/data/helpers/guards.ts | C6 type guards |
| src/lib/data/helpers/opens-in-program.ts | D shared rule |
| src/lib/data/helpers/search.ts | D ripgrep query rules |
| src/lib/data/helpers/tasks.ts | D shared rule |
| src/lib/data/helpers/text-kind.ts | C14 UTF-8 text sniff |
| src/lib/data/helpers/worktrees.ts | D shared rule |
| src/lib/data/index.ts | D snapshot composition |
| src/lib/data/model/index.ts (X3b) | D model types |
| src/lib/data/model/model-agents.ts | D model types |
| src/lib/data/model/model-calendar.ts | D model types |
| src/lib/data/model/model-collections.ts | D model types |
| src/lib/data/model/model-connect.ts | D model types |
| src/lib/data/model/model-entities.ts | D model types |
| src/lib/data/model/model-mail.ts | D model types |
| src/lib/data/model/model-search.ts | D model types |
| src/lib/data/model/model-sessions.ts (X3b) | D model types |
| src/lib/data/snapshot/indexing.ts | D snapshot rules |
| src/lib/data/snapshot/normalise.ts | D snapshot rules |
| src/lib/data/snapshot/validate-themes.ts | D snapshot rules |
| src/lib/data/snapshot/validate.ts | D integrity rules + C6 shape checks |
| src/lib/data/sources/career.ts | D source reader |
| src/lib/data/sources/collections.ts | D source reader |
| src/lib/data/sources/config.ts | D source reader |
| src/lib/data/sources/config/agents.ts | D agent catalog + C6 |
| src/lib/data/sources/config/catalogs.ts | D source reader |
| src/lib/data/sources/config/folder.ts | D source reader |
| src/lib/data/sources/config/local.ts | C6 local.yml validation |
| src/lib/data/sources/config/merge.ts | D config merge with duplicate-key findings |
| src/lib/data/sources/config/rail.ts | D source reader |
| src/lib/data/sources/config/settings.ts | C6 typed settings readers |
| src/lib/data/sources/config/themes.ts | D source reader |
| src/lib/data/sources/docs.ts | C15 front matter split |
| src/lib/data/sources/feeds.ts | D source reader |
| src/lib/data/sources/manifests.ts | D source reader |
| src/lib/data/sources/present.ts | D deck slides (uses C15) |
| src/lib/data/sources/registries.ts | D source reader |
| src/lib/server/accounts/calendar/api.ts | C2 provider REST (shared types) |
| src/lib/server/accounts/calendar/google.ts | C2 provider REST (calendar) |
| src/lib/server/accounts/calendar/microsoft.ts | C2 provider REST (calendar) |
| src/lib/server/accounts/calendar/poll.ts | D calendar poller |
| src/lib/server/accounts/calendar/routes.ts | D calendar routes |
| src/lib/server/accounts/connect/actions.ts | D connector actions (+ hand HTML escaper, C7) |
| src/lib/server/accounts/connect/api.ts | C2 provider REST |
| src/lib/server/accounts/connect/loop.ts | D connector poll cadence |
| src/lib/server/accounts/connect/oauth.ts | C1 OAuth PKCE and refresh |
| src/lib/server/accounts/connect/rows.ts | C5 YAML byte-level edit |
| src/lib/server/accounts/connect/setup.ts | D connector setup |
| src/lib/server/accounts/connect/store.ts | C1 credential files + C4 user |
| src/lib/server/accounts/mail/google.ts | C2 provider REST + C3 MIME building |
| src/lib/server/accounts/mail/microsoft.ts | C2 provider REST (mail) |
| src/lib/server/accounts/mail/plate.ts | D mail plate rules |
| src/lib/server/accounts/mail/poll.ts | D mail poller |
| src/lib/server/accounts/mail/routes.ts | D mail routes + C6 |
| src/lib/server/accounts/mail/triage.ts | D triage notes + C6 + C4 (non-atomic write) |
| src/lib/server/content/audit.ts | D audit scan |
| src/lib/server/content/audit/projects.ts | D audit scan |
| src/lib/server/content/audit/publications.ts | D audit scan |
| src/lib/server/content/audit/rules.ts | D audit scan |
| src/lib/server/content/diagrams.ts | D diagram serving + C9 |
| src/lib/server/content/docs.ts | C7 Markdown render + C8 ETag + C9 |
| src/lib/server/content/images.ts | C10 image size/orientation + C11 MIME + C9 |
| src/lib/server/content/latex.ts | D LaTeX mains and log parse (no library found) |
| src/lib/server/content/memories.ts | D picture wall (uses C10) |
| src/lib/server/content/wallpaper.ts | D wallpaper (uses C10) |
| src/lib/server/core/auth.ts | D origin and token gate (C9 note on sameOrigin) |
| src/lib/server/core/changes.ts | D change log + C12 deep equality |
| src/lib/server/core/channels.ts | D channel hub |
| src/lib/server/core/file-poll.ts | D single-file stat poll |
| src/lib/server/core/git-parse.ts (X3b) | C13 git output parsing |
| src/lib/server/core/git.ts (X3b) | C13 git reader |
| src/lib/server/core/json.ts | C4 atomic writes + write chain |
| src/lib/server/core/words.ts | D catalog wording |
| src/lib/server/edit/deck-edit.ts | C5 YAML edit + C12 |
| src/lib/server/edit/entry-edit/entries.ts | C5 YAML edit |
| src/lib/server/edit/entry-edit/host-status.ts | C5 YAML edit |
| src/lib/server/edit/entry-edit/index.ts | C5 YAML edit |
| src/lib/server/edit/entry-edit/lines.ts | C5 YAML edit |
| src/lib/server/edit/entry-edit/render.ts | C5 YAML edit (hand block renderer) |
| src/lib/server/edit/entry-edit/subtasks.ts | C5 YAML edit |
| src/lib/server/edit/feeds.ts | D feed reads and edits (uses C5) + C4 (non-atomic write) |
| src/lib/server/edit/list-edit.ts | C5 YAML edit |
| src/lib/server/edit/writes.ts | D write endpoint |
| src/lib/server/edit/writes/audit-mute.ts | D writer (uses C5) + C4 (non-atomic write) |
| src/lib/server/edit/writes/bodies.ts | C6 request body validation |
| src/lib/server/edit/writes/deck.ts | D writer (uses C5) + C4 (non-atomic write) |
| src/lib/server/edit/writes/entries.ts | D writer (uses C5) + C4 (non-atomic write) |
| src/lib/server/edit/writes/manifest.ts | D writer (uses C5) + C4 (non-atomic write) |
| src/lib/server/edit/writes/rail.ts | D writer (uses C5) + C4 (non-atomic write) |
| src/lib/server/edit/writes/subtasks.ts | D subtask writer (uses C5) |
| src/lib/server/edit/writes/undo.ts | D undo table |
| src/lib/server/edit/yaml-edit.ts | C5 YAML edit + C12 deep equality |
| src/lib/server/files/files-channel.ts | D channel merge policy |
| src/lib/server/files/files.ts | C11 MIME table + C9 + D roots |
| src/lib/server/files/fs.ts | D file browser listing and workspaces + C9 |
| src/lib/server/files/fs/bookmarks.ts | D bookmarks file |
| src/lib/server/files/fs/notes.ts | D scratch notes + C9 |
| src/lib/server/files/open.ts | D macOS open/reveal + C9 |
| src/lib/server/files/project-files.ts | D project file walk + C9 |
| src/lib/server/files/roots.ts | D roots fold |
| src/lib/server/files/search-routes.ts | D search endpoint |
| src/lib/server/files/search.ts | D ripgrep runner (dependency used fully) |
| src/lib/server/files/source.ts | D source write + C14 user |
