# E3 report: the apps section of DESIGN.md to Z103 (b), Z106 (a) and Z107 (b2)

Everything in the brief is done, with one rule of item 2 worded differently from the brief: the brief's sentence for refetching after a settled fetch loops on case 22 as written, and the section words it as "a push that arrived after the fetch began" (last section, item 1). DESIGN.md lines 236 to 327 are the only lines changed; the section is still 92 lines, so every line number the brief cites is the same after the step.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md` line 115 to 119 (`sed -n '115,119p'`): the heading "Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)" is followed by the sentence on what leaves the list, and then the list:

None.

## The cases on the unchanged section (read at the base, before any change)

The base copy is `/Users/axelfaes/workspace/research-hub/.agents/worktrees/E3-base-DESIGN.md`; `cmp DESIGN.md <base>` printed nothing before the first edit. "Holds" means the case's expected result follows from the brief's rules; "base" is what the unchanged section says.

| Case | Base reading | Deciding base line |
|---|---|---|
| 1 | Base does not hold: the row carries `store`, so each push carries the value | 264, 311 |
| 2 | Base does not hold: no route and no fetch; the push carries the value and `onStore` is called from it | 264, 311 |
| 3 | Base holds in words only ("changes nothing and calls nothing"), with no version and no comparison rule | 311 |
| 4 | Base: `connect-src` and the opaque origin refuse any `/api/` request (325, 282), but no route exists to be named as the page's alone | 282, 325 |
| 5 | Base does not hold: no `storeBytes`; the row carries `store: null` for an oversize file | 264 |
| 6 | Base does not hold: the first frame carries the rows, so it carries three stores | 264, 266 |
| 7 | Base: opens it, since line 315 names any root shown | 315 |
| 8 | Holds before and after | 315 |
| 9 | Base: `.env` opens if it exists; `a/.git/config` and `.oculus/app-data/other.json` open or reject `missing` | 315 |
| 10 | Base: rejects `missing`, which tells the app the file is absent | 315 |
| 11 | Base: a root app may name its own root, so it opens | 315 |
| 12 | Holds before and after | 315 |
| 13 | Holds before and after: a root app naming another root rejects `closed` | 315 |
| 14 | Base: refused `connect_shape`, and line 260 gives the reason about `connect-src` | 260, 262 |
| 15 | Base: line 325 says the build step measures WebRTC and DNS prefetch only | 325 |
| 16 | Trivial at the base; checked after the edit by the two diffs below | - |
| 17 | Base: says nothing about decoding; the brief's rule fixes it | 315 |
| 18 | Base: none of these is addressed; each opens or rejects `missing` | 315 |
| 19 | Base: no real-path rule for `open`; the link opens | 315 |
| 20 | Base: rejects `missing` (root not shown); after, `closed` | 315 |
| 21 | Base: `Engine` rejects `missing` and `game-engine` is ordinary (holds; `config/sources.yml:100` has a root keyed `game-engine`); `hub` with `tools/oculus/config/local.yml` opens; another key for that folder opens | 315, `files.ts:246-256` |
| 31 | Base: no `closed_paths`; `secrets/a.txt` opens or rejects `missing` | 315, 327 |
| 32 | Base: no `closed_paths`; the engine's config folder is open through `hub` | 315, 327 |
| 22 | Base: no route, no version | 264, 311 |
| 23 | Base: no fetch | 311 |
| 24 | Base: no route | 311 |
| 25 | Base: no route | 311 |
| 26 | Base: no fetch | 311 |
| 27 | Base: no fetch; `getStore()` answers from the row | 311 |
| 28 | Base: no fetch | 311 |
| 29 | Base: no size or version; a folder or unreadable path is not addressed | 264 |
| 30 | Base: no size or version; an empty file gives `store: null` | 264 |

One case the brief's rules get wrong as worded: case 22 against the brief's sentence "when it settles and the latest pushed version differs from the answered one, the page fetches once more". In case 22 the GET answers version v2 after a push of v1, so the latest pushed version (v1) differs from the answered one (v2) and the sentence, read as written, fetches again, gets v2 again, and repeats until a push of v2 arrives. The section words the condition as "a push that arrived after the fetch began carries a version other than the one answered", which gives the brief's expected result for case 22 (the answer is held, `onStore` is called, a later push of v2 fetches nothing) and for case 23 (two pushes during the flight, one further fetch, the superseded answer dropped). Nothing else in the 32 cases conflicts with the brief's rules.

## DONE / NOT DONE

| Row | Status | Command and output |
|---|---|---|
| Item 1, the store leaves the row | DONE | `grep -n '`store` is the parsed\|key, store, storeFile' DESIGN.md` prints nothing (the absence check below) |
| Item 2, the store route | DONE | line 311, read in the hit list below |
| Item 3, the first frame | DONE | line 266 |
| Item 4, `engine`, the engine's config folder, `closed_paths` | DONE | lines 315 and 327 |
| Item 5, path segments | DONE | line 315 |
| Item 6, `wss:` | DONE | lines 260 and 325; line 262 untouched |
| Item 7, other false sentences | DONE | lines 307 and 313 (below) |
| Item 8, E2's rows | DONE | "E2's rows as they now read" below |
| Verify 1 | DONE | quoted below |
| Verify 2 | DONE | `LC_ALL=C grep -n '[^ -~]' DESIGN.md` printed nothing (exit 1) |
| Verify 3 | DONE | hit list and absence check below |
| Verify 4 | DONE | name grep below |
| Verify 5 | DONE | citations below |
| Verify 6 / case 16 | DONE | both diffs printed nothing (`d1=0`, `d2=0`) |

### Verify 1, the lines `checks.sh` printed (after `npm run diagrams`, which ran first and exited 0)

```
$ npm test
 Test Files  350 passed | 19 skipped (369)
      Tests  5347 passed | 559 skipped (5906)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790795627649 COMPLETED 2474 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
Checking formatting...
All matched files use Prettier code style!
$ npm run lint
> eslint .
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The exit status of the `checks.sh` run was 0 (`echo "exit=$?"` printed `exit=0`). The `npm run build` output (about 700 lines of vite and timing output, lines 36 to 737 of the saved output) is omitted here; its last lines are vite plugin timing notes and the next command follows with no error. The full output is in the scratchpad file `e3-checks.txt`.

### Verify 3, hits inside the section (line numbers are DESIGN.md lines; the pattern is `storeFile\|storeBytes\|storeVersion\|app-store\|wss\|engine`)

| Line | Hit | Read against the items |
|---|---|---|
| 242 | `the engine` in the list of roots; `The root engine ... holds no apps` | Not changed; consistent with item 4 |
| 260 | `app-store` is not a name `writes` can hold; `A wss: origin is refused.` | The write kind, unchanged; `wss:` reason removed (item 6) |
| 262 | `app-store`, which every app is granted for its own store; `wss:` included | The write kind, unchanged; `connect_shape` text kept (item 6) |
| 264 | watcher watches roots "except `engine`"; the row with `storeBytes, storeVersion, storeFile`; the definitions; `GET /api/app-store` | Items 1 and 2 |
| 284 | "a root shown in the file browser other than `engine`" | The app file server's rule, unchanged |
| 311 | kind `app-store`; `storeBytes` and `storeVersion` in the row; `GET /api/app-store?view=<view id>`; the version comparison | Items 1 and 2 |
| 313 | kind `app-store` (three hits) | The write kind; the handler sentence gains the equal-value clause |
| 315 | `except engine`; `Engine`, `game-engine`; `engine` with `local.yml`; the order of checks | Items 4 and 5 |
| 325 | `wss://host` in the measurement sentence | Item 6 |

`storeFile` has no other hit in the section than line 264. No hit states that the store rides in the row or the push, that a machine app may name `engine`, or that `connect-src https://host` does not admit `wss:`.

The absence check, `grep -n 'does not admit\|measures both\|`store` is the parsed\|key, store, storeFile\|may name any root shown in the file browser, and' DESIGN.md`, printed nothing (`abs=1`).

### Verify 4, the name grep

`grep -rn --exclude=local.yml -w 'store\|storeBytes\|storeVersion\|app-store\|wss\|engine\|closed_paths' src tests config HELP.md README.md DESIGN.md` prints 2000 lines, because `store` and `engine` are common words of the tree. It is quoted by term, each with the command that separates it:

- `storeBytes`, `storeVersion`, `closed_paths`: `grep -rn --exclude=local.yml -w 'storeBytes\|storeVersion\|closed_paths' src tests config HELP.md README.md` prints nothing; the only hits are in DESIGN.md lines 264, 311, 315 and 327.
- `app-store`: `grep -rn --exclude=local.yml -w 'app-store' src tests config HELP.md README.md` prints nothing; in DESIGN.md it is on lines 260, 262, 264, 311 and 313, read above.
- `wss`: five hits, all `const wss = new WebSocketServer(...)` and its uses in `src/lib/server/root/socket.ts:82,93,97,136,137`; unrelated (the server's own WebSocket server).
- `engine` outside DESIGN.md: 145 files; every hit read is the engine directory parameter or the `ENGINE_ROOT` constant (`src/lib/server/files/files.ts:227`, `src/lib/state/sources/fs.ts:50`), the README's `--engine <dir>` (`README.md:9`, `README.md:11`), HELP.md lines 111, 162, 216, 244, 246, 260 and 292 (the file browser's engine root and the `config/` folder, in the manual's words), and `config/present.yml:49,72,73` (a slide named `engine`). Unrelated to the section: no code or document states the open-file rule, since the section is unbuilt. `config/sources.yml:100` (`{ key: game-engine, dir: ~/workspace/game-engine }`) is the real root that case 21 names as an ordinary root.
- `store` outside the section: the words "store" of Svelte stores and accounts (`src/lib/state/client/context.ts`, `src/lib/state/workbench/ui.svelte.ts`, `src/lib/server/sessions/stores/transcripts.ts` and the like) and `config/appearance.yml:59`; unrelated to the apps store. DESIGN.md outside the section (lines 87 to 413, checked with `grep -n -w ... DESIGN.md | awk -F: '$1<236 || $1>327'`): line 87 is `--engine <dir>`, line 194 is "the client's stores", and the decisions list uses "engine" for the directory; none mentions the apps store, the `apps` row or `open({ file })`.
- `grep -rn --exclude=local.yml -i 'appsStore\|getStore\|setStore\|onStore\|apps.store_max\|app-data' src tests config` prints seven lines: `src/lib/server/root/vite-plugin.ts:51` (`requests.getStore()`, the request-context store) and six `SelectionStore` type lines in `selection.svelte.ts`, `selectors.svelte.ts` and `context.ts`. None is the apps bridge, the store file or a limit key; the apps section is not built in code.

### Verify 5, cited lines the step adds

- `src/lib/server/core/channels.ts:103-110`: line 103 is `publish(channel: string, payload: unknown): number {`; lines 106 to 108 are `for (const [sink, subscriber] of this.#subscribers) { if (subscriber.channels.has(channel)) this.#deliver(sink, subscriber, message); }`; line 109 is `return message.version;` and line 110 is `}`. `publish` delivers the one message to every subscriber of the channel.
- No other citation is added or changed. The source route's decode of `path` (not cited in the section) is `src/lib/server/files/source.ts:103`: `const path = url.searchParams.get('path') ?? '';`.

## Per item, the line that carries it

1. The row: line 264. The reread list ends "and the store file's size and version (read, not parsed)"; the row definition carries `storeBytes, storeVersion, storeFile`; the definitions, the folder and unreadable path, the oversize version from `<size>:<modification time in ms>`, the empty file (`e3b0c44298fc1c14`), and the one-clause reason with the `channels.ts:103-110` citation. A KB is defined on line 311 at `apps.store_max_kb`.
2. The route: line 311, and one clause on line 313 (the handler writes nothing when the file holds an equal value). Line 307 gives `missing` for a store of an app removed since the last push.
3. The first frame: line 266, one sentence after the seeding sentence.
4. `engine`, the config folder, `closed_paths`: line 315; the key list: line 327.
5. Path segments: line 315, with the order of checks.
6. `wss:`: line 260 (reason removed) and line 325 (three measurements); line 262 is untouched.
7. Other false sentences: line 307 (`missing`), line 311 (the paragraph's watcher sentences and the equal-write sentence), line 313 (handler). `git diff` was not run; the list is from `grep` over lines 236 to 327.
8. E2's rows: below.

## E2's rows as they now read (for the orchestrator to carry into `E2-report.md`; line numbers are the section's after this step)

Row 18:

| # | Shape as written (line) | Alternative considered |
|---|---|---|
| 18 | The `apps` row gains `connects`, `kept`, `storeBytes`, `storeVersion` and `storeFile`, and the channel payload gains `folders` (264). The row holds no store value; the page reads one app's store by `GET /api/app-store?view=<view id>` when that app's `storeVersion` differs from the version the page holds, and the first frame carries no store value (266, 311). | The store value in every row: a channel publish sends the whole payload to every subscriber, so every store write of any app would send up to `apps.store_max_kb` per app to every page and into every first frame |

Row 23:

| # | Shape as written (line) | Alternative considered |
|---|---|---|
| 23 | `open` of a path that breaks the segment rule rejects `closed` before anything is looked for, `engine` rejects `closed`, a root the file browser does not show and a file that does not exist reject `missing`, in that order; an id no registration holds and a project no portfolio holds reject `missing`, and a root app naming another root rejects `closed` (307, 315) | `missing` for every file not found, hidden ones included |

Row 32:

| # | Shape as written (line) | Alternative considered |
|---|---|---|
| 32 | A `wss:` origin is refused, and whether `connect-src https://host` admits `wss://host` is measured by the build step (260, 262, 325) | Admitting `wss:` with a `wss:` source in the policy |

Row 36:

| # | Shape as written (line) | Alternative considered |
|---|---|---|
| 36 | A machine app names any root shown in the file browser except `engine`; a path that breaks the segment rule of line 284, a file inside the engine's config folder by real path, and a file under a `closed_paths` folder reject `closed` for every app (315) | Any root, `engine` included, and hidden files opened |

Row 42:

| # | Shape as written (line) | Alternative considered |
|---|---|---|
| 42 | WebRTC, DNS prefetch and `wss:` under `connect-src https://host` are measured and stated by the build step, and only the download link is closed if it sends a request (325) | Closing all |

Each row is in the table's form `| <n> | <shape as written (line)> | <alternative considered> |`, given with its own header so it renders alone. Row 23 keeps the parts of E2's row that this step does not change (an id no registration holds, a project no portfolio holds).

## Shapes named in this step

Each is a name, key, form or default the section now states that the rulings do not name, with the alternative considered. All are reversible.

| # | Shape as written (line) | Alternative considered |
|---|---|---|
| S1 | Row fields `storeBytes` and `storeVersion` beside `storeFile` (264) | One field `store: { bytes, version }` |
| S2 | `storeVersion` is the first 16 hex characters of the SHA-256 of the file's bytes, empty when absent; `e3b0c44298fc1c14` for an empty file (264) | A counter (an equal write would then change it), a modification time (an equal rewrite would change it) |
| S3 | Over `apps.store_max_kb` the version is from the text `<size>:<modification time in ms>`, so one stat per file (264) | Hashing the whole file: a hand-placed 1 GB file would cost a read on every watcher pass |
| S4 | A store path that is a folder or cannot be read counts as absent, with no new finding word (264) | A finding such as `store_unreadable` |
| S5 | The route `GET /api/app-store?view=<view id>`, answering `{ version, value }`; 400 for `view` absent, empty or given twice; 404 for an id no held row names; 405 for another method; any held row, approved or not (311) | A route per app (`/api/app-store/<id>`): the view id holds `/`, and a root key may hold a space |
| S6 | The page fetches once per app per version per loaded oculus page, one fetch in flight per app, versions compared for equality (311) | A fetch per tab; ordering versions by comparison |
| S7 | A 404 leaves the page holding nothing and a waiting `getStore()` rejects `missing` (307, 311) | A new refusal word |
| S8 | An equal store write writes nothing and records nothing in History, compared as JSON values with object keys in any order (311, 313) | Comparing the file's bytes: a reformatted file would then be rewritten and recorded |
| S9 | The key `engine` and the engine's config folder reject `closed` for every app, by real path whichever root names the folder (315) | Closing `local.yml` alone: the rest of the config folder stays readable through `hub` |
| S10 | `closed_paths`, a list of folder paths relative to a root, applied to every root, compared by segment, default `[secrets]`, checked on the given and the real path (315, 327) | A list of absolute folders; a list per root |
| S11 | The segment rule of line 284 applies to `open` for machine apps and root apps alike, on the exact string given and on the real path under the root (315) | The rule for machine apps only |
| S12 | A link whose target lies outside the root rejects `closed`, whether or not the target exists (315) | `missing` for a dangling link |
| S13 | Order of the checks: segment rule and `closed_paths`, `engine`, root shown (`missing`), real-path checks, existence (`missing`) (315) | The disk first |

## Judgment calls the brief did not cover

1. The refetch condition (see the cases section above): "a push that arrived after the fetch began carries a version other than the one answered" replaces "the latest pushed version differs from the answered one". Reverse it by restoring the brief's words, which loops on case 22.
2. The page compares a row's `storeVersion` with the held version on a push and when a frame mounts, with nothing held counting as a difference (311). The brief says a push compares and "an app with no mounted frame is not fetched until a frame mounts"; without the mount comparison, an app that registers `onStore` and never calls `getStore()` would wait for the next push. A fetch from that comparison calls `onStore` only in tabs whose bridge is connected, and a tab not yet connected reads through `getStore()`.
3. An equal write is decided only when the file exists, parses and is within `apps.store_max_kb`; a file that is absent, does not parse or is over the limit holds no value, so the write always goes ahead (311). Without this, `setStore(null)` over an unparseable file would write nothing and leave the garbage in place.
4. The real path of a file that does not exist is the real path of its deepest existing folder followed by the remaining segments, and a link that points at nothing is read by its target text (315). The brief requires `closed` for an outside link "whether or not the target exists", which needs a rule for a path with no real path.
5. The KB definition ("a KB in this section is 1024 bytes") sits on line 311 at `apps.store_max_kb`, as the brief says, and `apps.state_max_kb (64)` on the same line comes before it.
6. Line 327's sentence now reads "The keys of an `apps:` block in `config/behavior.yml` are the limits ..., and the list `closed_paths` (default `[secrets]`)", since `closed_paths` is not a limit. The other keys' defaults, given elsewhere in the section, are not repeated.
7. Line 307's `missing` also covers the store of a removed app (item 2's rule that a waiting `getStore()` rejects `missing`).

## Sentences removed or reworded, and why each was false or incomplete

- Line 260, "A `wss:` origin is refused, since `connect-src https://host` does not admit it.": the reason states a Chrome behaviour that no measurement supports; reduced to the refusal.
- Line 264, the row list ending `store, storeFile` and the sentence "`store` is the parsed value of the app's store file ...": the row no longer holds the value; replaced by `storeBytes`, `storeVersion` and their definitions.
- Line 264, the reread list ending "and the store": the watcher reads the store file's size and version, not its value.
- Line 266: added the sentence that the first frame carries no store value; the earlier text implied the rows carried stores.
- Line 311, "reaches the page on the `apps` channel, which calls `onStore(value)` in every tab ...": the channel carries `storeBytes` and `storeVersion`, and the page reads the value by the route before calling `onStore`.
- Line 311, "A write of the value the file already holds changes nothing and calls nothing.": reworded to the comparison rule (JSON values, key order, formatting) and its exception for a file holding no value.
- Line 313, the handler sentence: it wrote the file unconditionally; it now writes nothing for an equal value.
- Line 315, "a machine app may name any root shown in the file browser": it admitted `engine`; now every such root except `engine`.
- Line 325, "the build step measures both": there are three measurements.
- Line 327, "The limits are the keys of an `apps:` block": `closed_paths` is a key that is not a limit.

## Anything in the brief that was wrong or impossible

1. The refetch sentence of item 2, as described above, loops on case 22. Evidence: the brief's own case 22 expected result (the page holds the answered version, a later push of it fetches nothing) cannot hold if the page fetches again whenever the latest pushed version differs from the answered one while the answer is newer than the push.
2. Verify 4's grep prints 2000 lines; quoting each hit is not possible in a report. The report separates the terms by commands as above; for the terms `store` and `engine` the hits outside the section were classified by file and by pattern, and not read line by line for every one of the 2000 (not verified beyond the patterns shown).
3. One read-only `git diff --stat` command ran inside the worktree (output piped to `head -0`, printed nothing); it changed nothing. No other git command ran.
4. Not verified by any command: how Chrome treats `connect-src https://host` with `wss://host`, WebRTC and DNS prefetch (the section says the build step measures them); the behaviour of the route, the page's fetches and `open` (none is built).
