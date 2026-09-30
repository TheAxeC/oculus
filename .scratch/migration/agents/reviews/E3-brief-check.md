E3 brief check (read-only; main at e8f4c010, `git log --oneline -1` printed `e8f4c010 Land Q110: ...`)

Limits note, first: while grepping names for check 1 I ran `grep -rn ... config/` without excluding `config/local.yml`, so grep scanned that file's bytes. The output was piped through `grep -v 'config/local.yml'`, so no line of it was printed, and every later grep used `--exclude=local.yml`. I also ran one `git -C /Users/axelfaes/workspace/research-hub check-ignore -v tools/oculus/config/local.yml`, which is read-only but is outside the allowed `git log/show/status`. It printed `tools/oculus/.gitignore:4:config/local.yml`, which is a line of the .gitignore file and no secret. Nothing else went near the limits: no browser, no port, no localhost, no environment, nothing under `~/.oculus`.

## 1. Names

Command: `grep -rn --exclude=local.yml -- "<name>" DESIGN.md HELP.md README.md config/ src/ .scratch/migration/plan.md .scratch/migration/orchestrator-state.md`, run once per name.
- `storeBytes` and `storeVersion`: no hits.
- `storeFile`: DESIGN.md:264 only.
- `app-store`: DESIGN.md:260, 262, 311, 313 only.
- `dot-led`: DESIGN.md:284, plan.md:385 and 588, state file line 142.
- `wss`: DESIGN.md:260 and 262. The other hits are the unrelated variable `wss` in src/lib/server/root/socket.ts:82, 93, 97, 136 and 137.
- `connect-src https://host`: DESIGN.md:260 only.
- Apps names in HELP.md and README.md (`grep -n -i 'app-data|apps_dir|app\.yml|getStore|onStore|\.oculus/apps'`): nothing.
- The same in config and src: only src/lib/server/root/vite-plugin.ts:51 `requests.getStore()`, which is AsyncLocalStorage and unrelated.
- Outside the section in DESIGN.md (`awk 'NR<236 || NR>327' DESIGN.md | grep -i -E '\bapps?\b|app:|penpal|approvals'`): nothing about the apps feature.

So outside DESIGN.md 236-327 and E2-report.md, the change makes nothing false.

Findings:

1. Row 23 of E2's table is made false and is not among item 8's four rows. Evidence: `grep -n 'file that does not exist' .scratch/migration/agents/reviews/E2-report.md` prints line 197: "| 23 | `open` of ... a root the file browser does not show and of a file that does not exist rejects `missing`; a root app naming another root rejects `closed` (313) |". After E3, `.ssh/none` rejects `closed` even though it does not exist, and `engine` rejects `closed`. Z106's own count ("The other 38 rows: no change", state file line 142) missed it. Change: item 8 carries row 23 as a fifth row, with the dot-led and `engine` exceptions and the order in which the checks are made. The Report section's "E2's rows as they now read" names five rows.

2. The watcher paragraph still reads the store's value, and item 7's test does not catch it. The store sentences in the section (`grep -o` over lines 236-327) are at lines 264, 266, 311, 313 and 325. Taking each place the check asked about:
   - First frame (266): item 3 reaches it.
   - Line 311, "reaches the page on the `apps` channel, which calls `onStore(value)`": item 2 reaches it.
   - Bridge paragraph (300, 307): names `getStore` and `onStore` but does not say where the value comes from. Nothing there is false.
   - History's undo (313): "puts the value before back through the store's writer". It does not read the row. Nothing there is false.
   - Line 325, "the store only through `getStore` and `setStore`": still true.
   - Line 264, "rereads every app on a change: the manifest, the walk ..., the content hash, whether the approvals file holds it ..., and the store". This means parsing the value. Item 7's test is sentences that "state the store rides in the row or in the push", and this sentence says neither, so a builder can leave it.

   Change: item 1 also rewrites that reread list to "the store file's size and version (read, not parsed)".

3. `app-store` would name both a write kind and a route. A reader can trip on it, because:
   - Line 313 lists "The other thirteen write routes ... closed to apps" by name.
   - `app-store` is a write kind sent to `POST /api/write` (lines 311 and 313).
   - A route directory named `app-store` invites a POST handler.

   Change: the brief says the route answers GET only (any other method 405) and writes nothing. It also says the section always writes the route in full as `GET /api/app-store` and never as bare `app-store`, and adds one clause that it is not a write route, so the count of thirteen is unaffected. If Axel prefers, the route could be named apart from the kind (for example `/api/app-store-read`), but the brief's name is workable with those clauses.

4. Excluding `engine` by key does not keep `config/local.yml` off screen, and the brief's item 4 gives a reason that says it does. This is a premise found wrong, and it is Axel's to rule.
   - Z103 (b)'s "For" (state file line 143) reads "no app can bring config/local.yml or any engine file into view". Item 4 has the section say `engine` rejects `closed` "since it is oculus's own `config/` folder and holds `local.yml`".
   - The hub root reaches the same file: `ls /Users/axelfaes/workspace/research-hub` shows `projects`, `registries` and `tools`, which are the folders `config/sources.yml` scans; `tools/oculus/.gitignore:4` is `config/local.yml`; and `resolveRootFileResult` (src/lib/server/files/files.ts:80-92, 101-125) checks only that the file is inside the root, not whether git ignores it. So `open({ file: { root: 'hub', path: 'tools/oculus/config/local.yml' } })` has no dot-led segment and is not refused by any rule in the brief. Not verified: which folder `local.yml`'s `hub` key names (the file is not to be read).
   - Two more routes to the same file. `withFixed` lets `sources.yml` claim the key `engine` for another folder ("unless the config names that key itself, in which case the config's entry stands", files.ts:246-256). And a saved workspace root can name the engine folder under another key.

   Change: the brief should not write "holds `local.yml`" as the protection's reason while the protection does not hold. Raise to Axel with these options:
   - (a) A file whose real path lies inside the real path of the engine's config folder (`configDir(engine)`) rejects `closed`, whichever root names it. Recommended: it reaches the ruling's stated aim with the same word and no new vocabulary.
   - (b) (a), plus a file git ignores rejects `closed`.
   - (c) The key rule alone, as literally ruled. This is the lazy option.

   A related observation for Axel, outside the rulings: `ls -ld /Users/axelfaes/workspace/research-hub/secrets` shows a folder `secrets` at the hub root, which the dot-led rule does not cover (I did not read its contents).

## 2. The step line

Mapping, from `grep -n '^- E3 ' plan.md` (line 385), plan.md:587-588 and state file lines 142-143:
- "row 36 every root but `engine`" (Z103 (b)): item 4, and item 8's row 36.
- "the `apps` row carrying size and version" (Z106 (1)): item 1, and item 8's row 18.
- "one store fetched by a GET route ... when that app's version changes" (Z106 (1)): item 2.
- "`open({ file })` refusing a dot-led path segment as `closed`", including "or learn whether one exists" (Z106 (2)): item 5 and decision 6.
- "the `wss:` question left to the build step's Chrome measurements", including "row 32's reason ... rests on it" and "the section states the result" (Z106 (3)): item 6, and item 8's rows 32 and 42.
- "`DESIGN.md` and `agents/reviews/E2-report.md`": items 1-7, and item 8 carried by the orchestrator at landing.

Every part has an item.

Findings:

1. Z106 (2) says "the rule the app file server already applies". That rule (line 284) is "no segment that is empty, `.`, `..` or dot-led and holds no backslash or NUL after decoding". Item 5 states only the dot-led part, then says "It is the segment rule the app file server applies (line 284), named as that rule". Those two readings disagree, so the section will too. Change: item 5 says outright whether `open`'s path check is the whole line-284 rule (recommended: empty, `.`, `..`, dot-led, backslash and NUL all reject `closed`, which also closes an absolute path through its leading empty segment) or only its dot-led part, and names only what it applies.

2. The step line names E2-report.md, but the brief routes it through landing and omits row 23 (see check 1, finding 1).

## 3. Premises

Every quoted sentence and every line number holds.
- `grep -n '^## ' DESIGN.md` prints 236 `## Apps added while oculus runs` and 329 `## Relationship to the cockpit`.
- A per-line phrase grep (`sed -n "<n>p" DESIGN.md | grep -o ...`) found each quoted phrase on its cited line:
  - 260: "since `connect-src https://host` does not admit it"
  - 262: "`wss:` included"
  - 264: "store, storeFile }" and "except `engine`"
  - 266: "apps: { rows, findings, folders, version }"
  - 282: "which `sameOrigin` refuses"
  - 284: "other than `engine`" and "dot-led and holds no backslash or NUL after decoding"
  - 311: "store_max_kb` (256)"
  - 313: "writes_per_min` (30) writes pass per frame per minute, `setStore` included"
  - 315: "a machine app may name any root shown in the file browser, and a root the file browser does not show rejects `missing` for it"
  - 325: "measures both in Chrome, and this section then states the measurements"
- `sed -n '103,110p' src/lib/server/core/channels.ts` is `publish(...)` building one `message` and calling `#deliver` for each subscriber of the channel. It matches. (Z106 cited 103-134; the brief's 103-110 is the tighter and correct range.)
- `src/routes/api/(files)/source/+server.ts:21` is `export const GET: RequestHandler = ...`. It matches.
- `src/hooks.server.ts:41-48`: `refused()` judges every method on a route under `/api/` with `sameOrigin`. It matches.
- `sed -n '160,220p'` of E2-report.md puts row 18 at 192, row 32 at 206, row 36 at 210 and row 42 at 216. They match.
- `ls docs/adr` gives "No such file or directory". It matches.

Finding:

1. The Premises bullet for line 313 credits it with "`apps.store_max_kb` 256". Line 313 says only "a 256 KB store"; the key and its value are on line 311. This is minor. Change: cite 311 for the key.

## 4. Cases and checks

- Case 4 holds under the section's own rules. The frame's document is at `<origin>/apps/<name>/<key>/...`, so `/api/app-store` resolves to `<origin>/api/app-store`. That is outside `connect-src <base> <connects>` (line 289), and line 260 bars `connects` from oculus's own port. A request that got through anyway carries `Origin: null` and `Sec-Fetch-Site: cross-site`, which `refused()` refuses (hooks.server.ts:41-48 and 67, which answers 403 `forbidden`), as line 325 already says of "any `/api/` route".
- Case 5's arithmetic holds only in 1024-byte kilobytes: 300 x 1024 = 307200. The section never defines KB. The tree uses 1024 (src/lib/state/boards/board/stats.ts:134 is `bytes / 1024`).

Findings:

1. Case 5: have item 1 or item 2 state "KB is 1024 bytes", so the 307200 and the limit are decidable from the section.

2. Case 3 is true only if an unstated rule holds.
   - Item 2 and decision 2 say an equal write "leaves the bytes and so the version unchanged". Line 313 says the handler "writes the file by rename, reads it back". It does not say an equal value is skipped.
   - A store file holding the same value in other bytes breaks case 3: hand-indented JSON, or other key order. `setStore(v)` would rewrite the bytes, the version would change, and the page would fetch and call `onStore`. That contradicts "changes nothing and calls nothing".
   - Change: item 2 states the rule. The handler compares the value sent with the parsed value the file holds and, when they are equal, writes nothing, records nothing and answers success. Add a case for a reformatted file.

3. Case 2 says "the page fetches ... once" across "two windows". The window model is unbuilt:
   - `grep -rn -i -E 'popped|pop-out|popout|window\.open|documentPictureInPicture' src/lib` finds no pop-out mechanism.
   - DESIGN.md:294 names "a popped-out window" without saying whether it shares the page's script.
   - Two oculus pages (two browser tabs) each hold their own socket and fetch once each.

   Change: say "once per loaded oculus page". A floating pane, and a popped-out window drawn by the same page, share that page's fetch.

4. Case 16 and Verify 5 cannot be run by a builder who runs no git command (spec.md:32). No base copy exists: `ls /Users/axelfaes/workspace/research-hub/.agents/worktrees/` prints `U2 X3d X3d-base`. Change: the orchestrator stages a base copy of DESIGN.md at e8f4c010 at a named path, and the brief gives the literal commands:
   - `diff <(sed -n '1,235p' <base>) <(sed -n '1,235p' DESIGN.md)`
   - `diff <(sed -n '/^## Relationship to the cockpit/,$p' <base>) <(sed -n '/^## Relationship to the cockpit/,$p' DESIGN.md)`

5. Verify 3 can mislead.
   - It greps the whole file. Today's hits are at lines 87, 128, 242, 260, 262, 264, 284, 311, 313, 373, 381, 386, 387, 389 and 392, from `grep -n 'storeFile\|storeBytes\|storeVersion\|app-store\|wss\|engine' DESIGN.md | cut -d: -f1`. Eight of those are outside the section.
   - Inside the section, `engine` hits at 242 ("the engine"), 264, 284 and 313 ("an engine file") are not about `open`.
   - The grep shows only that new words are present. It cannot show that the false sentences are gone, because none of them contains a pattern word: "`store` is the parsed value", "does not admit it", "measures both", "a machine app may name any root shown in the file browser, and", "A file that does not exist rejects `missing`".

   Change: restrict it with `awk 'NR>=236 && NR<[line of ## Relationship]'`, and add absence commands that must print nothing, for example:
   - `grep -n 'does not admit\|measures both\|`store` is the parsed\|key, store, storeFile' DESIGN.md`
   - A grep for the old sentence of line 315 without the exceptions.

6. spec.md:57 requires that "After changing a name ... grep it across `src`, `tests`, `config`, `HELP.md`, `DESIGN.md` and `README.md` ... and quote that grep in the report". Verify 3 covers DESIGN.md only. Change: add that grep, over `store`, `storeBytes`, `storeVersion`, `app-store`, `wss` and `engine`, with `--exclude=local.yml` for config.

7. spec.md:58 requires every key a package introduces to be exercised "empty, duplicated, and colliding", and every asynchronous path "in flight, after close, and superseded". No case exercises the new `view` query key, or the new fetch, in those ways. Change: add the cases in check 6, marked "must add".

8. spec.md:88 says the perl ASCII form replaces `grep '[^ -~]'` "wherever a brief ... names it". That form's `find src tests bin config` does not include DESIGN.md, so Verify 2's grep is the right check for this file (it prints nothing today: `LC_ALL=C grep -n '[^ -~]' DESIGN.md`). Change: one clause in Verify 2 saying why the grep form is kept, so the refuter does not raise it.

9. tests/checks/source/history.test.ts:21 reads DESIGN.md whole for plan ids, including the `E[0-9]` family, and for dates. That test is the machine check of the brief's "no history" convention, and it runs in Verify 1's `npm run test:checks` (package.json:13). This is a note only. The brief can name the test beside the convention.

## 5. The question (could it pass without the goal being reached?)

The goal: the section states what Z103 (b) and Z106 (a) decided, with no sentence left that contradicts them, so that a builder could build the apps feature from it.

- Step line: yes. Every named part can be done while E2's row 23 stays false (check 1, finding 1) and while `local.yml` stays reachable through `hub` (check 1, finding 4).
- Item 1: yes. The row definition changes while line 264's reread list still parses the store (check 1, finding 2). It also leaves the version unspecified for a file that is a directory or unreadable, or far over the limit.
- Item 2: yes, on two counts:
  - It gives no rule for an answer superseded by a later request, a fetch in flight when a push arrives, a fetch failing (404, 403, network), a tab closing mid-fetch, or `getStore` while a fetch is in flight. Store versions are hashes and have no order, so a builder has to invent the ordering.
  - The "changes nothing" claim rests on unstated handler behaviour (check 4, finding 2).
- Item 3: no. It is one clause and case 6 checks it.
- Item 4: yes. The text can match Z103 (b) literally while the aim the ruling was chosen for, no app putting `local.yml` on screen, is not reached (check 1, finding 4).
- Item 5: yes. "Dot-led" and "the segment rule of line 284" differ (check 2, finding 1). And a link inside a root that points at a dot folder passes a check made on the given path.
- Item 6: no. The sentence and the three measurements are specific, and case 14 and case 15 check them.
- Item 7: yes. Its only proof is reading, and Verify 3 cannot show absence (check 4, finding 5).
- Item 8: yes. Four rows are carried while row 23 stays false.
- Cases 1, 7-15: no. Each names one input and its outcome, and each reading was checked against the base: 1 against 264; 7 against 242 and 315; 8 against 315; 9, 10, 11 and 12 against 315; 13 against 315 ("any other root rejects `closed`"); 14 against 262; 15 against 325.
- Case 2: yes. "Once" is undefined across pages (check 4, finding 3).
- Case 3: yes. It passes on a file that JSON.stringify wrote and fails on a reformatted one (check 4, finding 2).
- Case 4: no.
- Case 5: no, once KB is defined.
- Case 6: no.
- Case 16: it cannot run as written (check 4, finding 4).

## 6. Implied inputs

Each input is given with the result the section should state. The brief must add the ones marked "must add".

1. `open` path `%2Eenv` (must add). `open` gets a string over the bridge, not a URL, so nothing is decoded. `%2Eenv` is a literal name that does not start with a dot, so it is checked and then resolved as that literal name. The section states that the check runs on the exact string the source route resolves, and that the page passes it URL-encoded (URLSearchParams), so the server's decoded path equals the checked one.

2. A path with a backslash, `a//b`, a leading `/`, NUL, `.` or an empty path (must add). This follows check 2, finding 1. Recommended: all reject `closed`, as the whole line-284 rule. Today an absolute path reaches `resolveRootPath`'s `outside` (files.ts:106-125), for which the section gives no word.

3. A link inside a root that points at a dot folder inside the root, for example `hub/creds -> hub/.secrets`, opened as `open({root:'hub', path:'creds/key'})` (must add). The given path has no dot-led segment, and the real path is inside the root (files.ts:110-125), so it opens. Expected: `closed`, with the segment rule also applied to the part of the real path under the root's real path.

4. A link inside a root that points outside it, for example to `~/.ssh` (must add). `resolveRootPath` answers `outside`, and for a missing target it walks up and answers `missing` or `outside` (files.ts:112-122). Expected: `closed`, whether or not the target exists.

5. Root key `Engine`, or `game-engine` (a configured key, `config/sources.yml:100`) (must add). Keys compare exactly (files.ts:254-255, 274). `Engine` rejects `missing` unless a root holds that key, and `game-engine` is an ordinary root. Also: `sources.yml` claiming the key `engine` for another folder (files.ts:246-256), and the engine folder reached through `hub` or through another key. Expected: per Axel's ruling on check 1, finding 4. Recommended: closed by the real path of the engine's config folder.

6. The order of the checks for a machine app naming a root not shown, with a path of `.env` (must add). Recommended: the segment rule first, then `engine`, then root shown (`missing`), then existence (`missing`), so the answer to a hidden path never depends on the disk or the roots.

7. The store file changes between the push and the GET (must add). The GET answers the newer `{ version, value }`. The page holds the answered version, not the pushed one, and calls `onStore` with the answered value. A later push carrying that same version fetches nothing.

8. Two pushes arrive while a fetch is in flight (must add). At most one fetch per app is in flight per page. When it settles, if the latest pushed version differs from the answered one, the page fetches once more. An answer from a superseded request is dropped, and never ordered by comparing hashes.

9. The GET for an app that is not approved (must add). The brief must state whether a held row answers whatever its approval (recommended, since only the page calls the route and the page would ask only for a mounted, approved app) or answers 404 unless approved.

10. The GET for an app removed or refused since the push (must add). It answers 404. The page holds nothing and calls nothing, and a `getStore()` waiting on that request rejects with a named word. Recommended: `missing`, which is already in the vocabulary at line 307.

11. The `view` key empty, absent, duplicated (`?view=a&view=b`), a built-in id (`?view=venues`), or a root app id holding `/` and a space unencoded (must add). Expected:
    - Absent or empty: 400 (or 404, stated).
    - Duplicated: the first value, or refused (stated).
    - A built-in id: 404.
    - A root app id: the page sends `encodeURIComponent(view id)`, and the route compares the decoded value with the held rows' view ids.

12. A tab closed, or a frame remounted, while its fetch is in flight (must add). The answer is kept for the page, `onStore` is not called on a destroyed bridge, and a remounted frame gets the held value through `getStore()`.

13. Two tabs calling `getStore()` at once when the page holds nothing for the app (must add). They share one fetch.

14. A push that changes the version of an app with no mounted frame in the page (must add). Recommended: no fetch until a frame mounts.

15. A store path that is a folder, unreadable, or 1 GB placed by hand (must add). `storeBytes` and `storeVersion` must be stated for each: absent-like (0 and the empty string), or a finding. The brief must also say whether the watcher hashes a file over `apps.store_max_kb` in full or derives its version from size and modification time, since hashing every byte of a huge file on each change is the watcher's cost.

16. An empty store file (0 bytes), which is present (worth adding). `storeBytes: 0` and version `e3b0c44298fc1c14`, with value `null` since it does not parse. It is distinguished from an absent file by the version.

17. A setStore of an equal value when the file's bytes differ (must add). See check 4, finding 2.

## 7. ADRs

None.
- `ls /Users/axelfaes/workspace/research-hub/tools/oculus/docs/adr` and `ls /Users/axelfaes/workspace/research-hub/docs/adr` both print "No such file or directory". `tools/oculus/docs` holds only `diagrams`.
- `grep -n -i 'adr' /Users/axelfaes/workspace/research-hub/.agents/plan.yaml` exited 1 with no output.
- The state file's configuration block (lines 6-25) has no `adr` key.

## Declined to judge

- Whether Axel wants option (a), (b) or (c) of check 1, finding 4. It changes what the section promises about `local.yml`, so it is his ruling. The brief should not settle it silently.
- Whether the `secrets` folder at the hub root holds credentials. I did not read it. Only `ls -ld` was run, which shows a directory.
- Which folder `local.yml`'s `hub` key names. That needs reading the forbidden file. The evidence for research-hub is `config/sources.yml`'s scan dirs, and the `ls` showing `projects/`, `registries/` and `tools/` there.
- Chrome's actual treatment of `wss://host` under `connect-src https://host`. That is the build step's measurement by ruling.

Usage: 177,191 tokens, 44 tool uses, 8.9 min (536,361 ms), served claude-opus-5-5.
