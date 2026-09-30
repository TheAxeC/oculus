# Step E3 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/E3, base 1c95c890)

This report cites pages by section and code by `file:line`. DESIGN.md line numbers are the worktree's. The section is still lines 236 to 327, and the file is 418 lines in both the base copy and the worktree.

## Verification (rerun by the reviewer)

```
$ git status --short            (from tools/oculus in the worktree)
 M DESIGN.md
?? .scratch/migration/agents/reviews/E3-report.md

$ git diff 1c95c890 --stat
 tools/oculus/DESIGN.md | 18 +++++++++---------
 1 file changed, 9 insertions(+), 9 deletions(-)
 (the changed lines are 260, 264, 266, 307, 311, 313, 315, 325 and 327, all inside the section)

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
diagrams exit=0   (afterwards git status shows no other tracked change)

$ PATH=...:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test
 Test Files  350 passed | 19 skipped (369)
      Tests  5347 passed | 559 skipped (5906)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790796113430 COMPLETED 2474 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
checks exit=0

Verify 2: LC_ALL=C grep -n '[^ -~]' DESIGN.md
  printed nothing, exit 1
Verify 3a: awk ... 'NR>=236 && NR<e' DESIGN.md | grep -n 'storeFile\|storeBytes\|storeVersion\|app-store\|wss\|engine'
  hits at section-relative lines 7, 25, 27, 29, 49, 76, 78, 80, 90, which are DESIGN.md 242, 260, 262, 264, 284, 311, 313, 315, 325. Each hit was read against items 1 to 6 (verdicts below).
Verify 3b: grep -n 'does not admit\|measures both\|`store` is the parsed\|key, store, storeFile\|may name any root shown in the file browser, and' DESIGN.md
  printed nothing, exit 1
Verify 4: grep -rn --exclude=local.yml -w 'store\|...\|closed_paths' src tests config HELP.md README.md DESIGN.md | wc -l
  2000 (system /usr/bin/grep gives the same count)
  storeBytes|storeVersion|closed_paths outside DESIGN.md: nothing (exit 1)
  app-store outside DESIGN.md: nothing (exit 1)
  wss: src/lib/server/root/socket.ts:82, 93, 97, 136, 137 (the server's WebSocketServer)
  engine, files outside DESIGN.md: 144 (the report says 145)
  HELP.md and README.md hits: HELP.md:111, 162, 216, 244, 246, 260, 292 and README.md:9, 11. None states the open-file rule, the apps row or the apps store.
  DESIGN.md hits outside the section: 87, 128, 176, 194, 222, 364-413. None concerns the apps store, the row or open({ file }).
  appsStore|getStore|setStore|onStore|apps.store_max|app-data in src tests config: 7 lines (vite-plugin.ts:51 and the six SelectionStore lines), as the report says.
Verify 5: src/lib/server/core/channels.ts:103-110 is `publish(channel, payload)`, which builds one message and delivers it to each subscriber of the channel (lines 106-108). It says what the citation claims.
  src/lib/server/files/source.ts:103 is `const path = url.searchParams.get('path') ?? '';`, as the report quotes.
Verify 6: diff of lines 1-235 against the base: d1=0. Diff from '## Relationship to the cockpit' to the end: d2=0.

Report evidence rerun:
  config/sources.yml:100 is `{ key: game-engine, dir: ~/workspace/game-engine }`: reproduced.
  src/lib/server/files/files.ts:227 ENGINE_ROOT and 246-256 withFixed: reproduced.
  orchestrator-state.md open items: "None.": reproduced.
  src/hooks.server.ts:41-47: refused() applies sameOrigin to every /api/ path whatever the method, so the premise of line 311 ("the origin rule and refused() apply") holds.
  sha256 of the empty input begins e3b0c44298fc1c14, and 300 KB at 1024 bytes is 307200: both hold.

Reviewer probe, read-only, for Spec 3:
  node -e realpathSync('<worktree>/TOOLS/OCULUS/CONFIG')         -> <worktree>/TOOLS/OCULUS/CONFIG
  node -e realpathSync.native(same)                             -> <worktree>/tools/oculus/config
  node -e fs/promises realpath(same)                            -> <worktree>/tools/oculus/config
  ls -d <worktree>/TOOLS/OCULUS/CONFIG                          -> exists (the volume is case-insensitive)
  grep -rn realpath src: the tree uses realpathSync from node:fs (src/lib/server/core/paths.ts:31, src/lib/server/files/open.ts:204,211)
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. Line 264 has the row `{ ..., key, storeBytes, storeVersion, storeFile }` and both definitions. It also covers a store path that is a folder or cannot be read, the version from `<size>:<modification time in ms>` above the limit, the empty file (`e3b0c44298fc1c14`), the reason clause with `channels.ts:103-110`, and the reread list ending "the store file's size and version (read, not parsed)". Line 311 has "(256; a KB in this section is 1024 bytes)". Minor wording under Standards 6.
- 2: violated in one clause, Spec 1. Line 311 replaces the brief's refetch condition ("the latest pushed version differs from the answered one") with "a push that arrived after it began carries a version other than the one answered", and the case was not handed back first. Every other rule of the item is on line 311: the route, `{ version, value }`, 400, 404 and 405, `encodeURIComponent`, any held row, not one of the write routes, under `/api/`, getStore's single shared fetch, one fetch per page per app, no fetch without a mounted frame, the answered version held, onStore with no call to a closed tab, 404 giving `missing`, and the equal write. Line 313 carries the equal write too. Spec 2 and Standards 3 and 6 are related.
- 3: holds. Line 266: "The rows carry no store value, so the first frame carries none, and a tab reads its store when it mounts, through `getStore()`."
- 4: holds by the item's text. Line 315 has `engine` excepted for machine apps and closed for every app with the local.yml reason, keys compared exactly, the engine's config folder by real path whichever root names it, and `closed_paths` with its reason, its form and `[secrets]`. Line 327 lists `closed_paths` with its default. The rule it states can be bypassed on this machine by letter case (Spec 3). Its config key's malformed entries are unstated (Standards 4).
- 5: holds by the item's text. Line 315 has the whole segment rule for every app, the eight examples, the exact string with `%2Eenv`, the real-path reapplication with the link examples, `notes.v2.md`, and the order. The order omits the root-app check (Standards 2), and the text names no server step that can see a real path (Spec 4).
- 6: holds. Line 260 reads "A `wss:` origin is refused." Line 325 lists three measurements and "states the results". Line 262 is unchanged.
- 7: holds. Lines 307, 311 and 313 are corrected. No sentence of the section still puts the store in the row or the push, lets a machine app name `engine`, or claims `connect-src` does not admit `wss:` (Verify 3). Line 307 and line 311 now state the 404 rule in two ways (Standards 3).
- 8: holds. The report gives rows 18, 23, 32, 36 and 42 in the table's form with the section's current lines. Row 18's added clause is incomplete (Standards 6).

Cases of the brief's "Cases":

- 1: met. Line 264's row carries no store value, so a push's size does not depend on the store's size.
- 2: met. Line 311: "fetches once per loaded oculus page, whatever the number of tabs, and a floating pane and a popped-out window drawn by the same page share that fetch", then onStore in every tab.
- 3: met. Line 311 compares JSON values with keys in any order, writes nothing, records nothing and leaves `storeVersion` unchanged, and "nothing reaches the page".
- 4: met. Line 311: "the frame cannot call it ...; only the page calls it". Line 325 covers `connect-src`.
- 5: met. Line 264 gives the size-and-mtime version for an oversize file, and line 311 gives value null for a file over `apps.store_max_kb`. 307200 follows from line 311's KB.
- 6: met. Line 266.
- 7: met. Line 315: `engine` rejects `closed` for every app.
- 8: met. Line 315: `hub` is a shown root and the path passes every check.
- 9: met. Line 315 lists `.env`, `a/.git/config` and `.oculus/...` as dot-led, so each is `closed`.
- 10: met. The segment rule runs first on the given path, before existence.
- 11: met. The rule holds "a machine app and a root app alike".
- 12: met. `notes.v2.md` is named as not dot-led.
- 13: met. The key `engine` gives `closed` for every app.
- 14: met. Line 260 gives no reason, and line 262 keeps `connect_shape`.
- 15: met. Line 325.
- 16: met. d1=0 and d2=0.
- 17: met. The exact string is checked and nothing is decoded, so the file is looked up under its literal name and gives `missing` when absent.
- 18: met. `a//b`, `/etc/hosts`, `a/./b` and the empty path are named, and a backslash is covered by "anywhere".
- 19: met. The rule is reapplied to the real path, and an outside target gives `closed` whether or not it exists. The real path of a missing file is defined.
- 20: met. The segment rule is first in the order.
- 21: met as the case is written. Letter case is not in the case; Spec 3 shows `TOOLS/OCULUS/CONFIG/local.yml` opening.
- 31: met. The given path and the real path are compared segment by segment, and the examples are in the text.
- 32: met. `closed_paths` and the engine-folder rule are separate sentences.
- 22: met under the builder's wording. See Spec 1 for the brief's wording.
- 23: met. Under the builder's wording any push in flight that differs drops the answer, so there is one further fetch.
- 24: met. Line 311 (404 leaves nothing, calls nothing, getStore rejects `missing`) and line 307.
- 25: met. Line 311 gives the 400, 404 and 405 answers and `encodeURIComponent` with the decoded compare.
- 26: met. Line 311 gives no onStore to a closed tab and keeps the answer. The mount comparison finds the version equal, so there is no fetch.
- 27: met. "two tabs asking at once sharing that one fetch".
- 28: met. "An app with no mounted frame is not fetched until a frame mounts".
- 29: met. Line 264 covers the folder, the unreadable file and the oversize version, and line 311 gives value null.
- 30: met. Line 264.

The builder's own decisions, each judged:

1. The refetch wording. It is right about the brief. As written, the brief's rule fetches again and again in case 22 until the push of v2 arrives, and the report says exactly that at its line 50. Its own wording ends in every order of events I traced: the push during the flight or after it, v1 to v2 to v1, pushes caused by other apps. It was taken without the hand-back the brief requires (Spec 1).
2. Comparing versions at mount. The comparison is needed and sound, but for another reason than the report gives. Without it, after a push arrives while no frame is mounted, getStore() "answers from the held value", which is stale. The report's reason is an app that relies on onStore alone. The section does not guarantee that app anything, since "a bridge not yet connected ... gets no call". The text is correct; only the report's justification is off.
3. The equal-write exception for a file that holds no value: sound, and consistent with line 313.
4. The real path of a missing file and of a dangling link: sound and needed for case 19. See Spec 3 and Spec 4.
5. Where KB is defined: as the brief says.
6. The rewording of line 327: sound.
7. Line 307's `missing`: sound in content, but worded differently from line 311 (Standards 3).

## 1. Spec

- DESIGN.md:311: "When a fetch settles and a push that arrived after it began carries a version other than the one answered, the answer is dropped and the page fetches once more". What is wrong: this replaces the brief's "when it settles and the latest pushed version differs from the answered one, the page fetches once more". The brief's Cases section says "A case the brief's rules get wrong is handed back before any text changes"; the builder changed the text and reported afterwards (report line 3 and "Judgment calls" 1). The builder's diagnosis is correct. Its wording also differs from the natural fix, "the latest push", because any differing push in flight drops the answer. Failure scenario: pushes v2 and then v3 arrive during a fetch that answers v3. The builder's rule drops a correct v3, since v2 differs, and fetches v3 again. That fetch is wasted, and the rule is one the orchestrator never approved. The orchestrator has to rule between "a push that arrived after it began" and "the latest push that arrived after it began". Verdict: item 2 violated.
- DESIGN.md:311: "The page holds, for each app it has fetched, the version and value of the last answer" ... "the answer is dropped" ... "After a fetch the page calls `onStore(value)` in every tab of the app". What is wrong: taken literally, "the last answer" and "After a fetch" include a dropped answer. The section never says whether a dropped answer is held, calls onStore, or settles a waiting getStore(). Failure scenario: a builder holds the dropped v1 and calls onStore(v1), then onStore(v2) after the refetch. Every tab redraws with a stale value first, and a getStore() waiting on the first fetch resolves with the stale value. No verdict: the brief's own "After a fetch" carries the same looseness.
- DESIGN.md:315: "A file whose real path lies inside the real path of the engine's config folder rejects `closed` ..." and "A file whose path under its root, given or real, starts with a folder that the list `closed_paths` names ..., compared segment by segment". What is wrong: this machine's volume is case-insensitive (`ls -d .../TOOLS/OCULUS/CONFIG` exists). The tree resolves real paths with `realpathSync` (src/lib/server/core/paths.ts:31, src/lib/server/files/open.ts:204), and my probe shows it keeps the case the caller typed; only `realpathSync.native` returns the case on disk. The section says neither which real path is meant nor how case compares. Failure scenario: a machine app calls `open({ file: { root: 'hub', path: 'TOOLS/OCULUS/CONFIG/local.yml' } })`. The given path passes the segment rule and `closed_paths`, the key is not `engine`, and `hub` is shown. The real path `.../research-hub/TOOLS/OCULUS/CONFIG/local.yml` is not `inside` `.../tools/oculus/config` by the string comparison of src/lib/server/core/paths.ts:15-19, and the file exists, so local.yml opens in a source tab. `SECRETS/a.txt` passes the default `closed_paths` the same way. This defeats Z107 (b2)'s "whichever root names it". No item verdict, since the brief's text does not name case; the defect is inside the ruling's aim.
- DESIGN.md:315 against DESIGN.md:323: "The bridge's `open` reaches the page's own tab opener" and "the checks on the real path, each `closed` ...; then whether the file exists". Line 323 says "The file route tests the real path, which the page cannot see through a link". What is wrong: the page cannot perform the real-path checks or the existence check, and the section names no server step that performs them for `open`. The only server route the paragraph mentions is the source route. Its GET answers `{ ok, readonly }` or 404/403 (src/lib/server/files/source.ts:100-113, `handleSourceInfo`), knows nothing of apps, `closed_paths` or the engine-folder rule, and returns no real path. Failure scenario: a builder applies the rules in the page's bridge handler to the given path, the only one the page has. Then `creds/key`, with `creds` pointing at `.secrets`, opens, and so does `cfg/local.yml` with `cfg` pointing at `tools/oculus/config`. The other way to build it is a new route or query parameter, which is a wire shape nobody has ruled on. No item verdict (items 4 and 5 hold by their text). The orchestrator decides whether naming this step is a text fix or a shape for Axel.
- E3-report.md, "Shapes named in this step" and "Sentences removed or reworded": the shapes table has S1 to S13. What is wrong: two forms the section now states and no ruling names are missing from it: "a KB in this section is 1024 bytes" (line 311, brief decision 8) and the version comparison when a frame mounts (line 311, the builder's decision 2). The removed-or-reworded list also omits line 307's reworded `missing`, which the report does list under item 7. Failure scenario: at landing Axel reads the shapes table as the list of what to rule on, and does not see the unit definition or the mount-time fetch. No verdict.

## 2. Proof

- None. Every command the report quotes reproduced; its values are in the Verification block. The one mismatch is the report's "145 files" for `engine` outside DESIGN.md, where I count 144. No decision rests on that number, so it is not a finding.

## 3. Standards

- E3-report.md line 220 against line 136: "One read-only `git diff --stat` command ran inside the worktree" and "`git diff` was not run". What is wrong: spec.md, "Where you work", says "You never run a git command"; the builder ran one. The report then contradicts itself about it. Failure scenario: an orchestrator reading only the per-item section (line 136) believes no git command ran and books the step's process as clean. No verdict.
- DESIGN.md:315: "The checks run in this order ...: the segment rule and `closed_paths` on the given path; the key `engine`; whether the root is shown (`missing`); the checks on the real path ...; then whether the file exists". The same line earlier says: "A root app may name only its own root in `file`, and any other root rejects `closed` for it, whether or not the file browser shows that root". What is wrong: the order is presented as the whole list of checks and leaves out the root-app check. That check has to come before "whether the root is shown", or the earlier sentence is false. Failure scenario: a builder follows the list and puts the root-app check after the shown-root check. A root app naming a root the file browser does not show then gets `missing` where line 315 says `closed`, and the answer tells the app which root keys are configured. No verdict (the brief's order had the same gap).
- DESIGN.md:307 against DESIGN.md:311: "`missing` (an `open` target that is not there, or the store of an app removed since the last push of `apps`)" against "A 404 (the app removed or refused since the push) ... a `getStore()` waiting on it rejects `missing`". What is wrong: one rule is stated twice, in two ways: "removed" against "removed or refused", and "since the last push" against "since the push". Failure scenario: a builder of the refusal words works from line 307 and leaves a refused app's 404 out of `missing`. Or they read "since the last push" and treat a 404 that arrives after the removal push has already landed as something else. No verdict.
- DESIGN.md:315 and 327: "`closed_paths` is a key of the `apps:` block in `config/behavior.yml` (below), a list of folder paths each relative to a root ... compared segment by segment, `[secrets]` by default". What is wrong: spec.md, "What every package obeys", says "Every id or key a package introduces is exercised empty, duplicated, and colliding with a configured or reserved key". The section does not say what an empty entry, a leading or trailing `/`, a `..` or dot-led entry, a duplicate or a value that is not a list does. `config/behavior.yml` has no `apps:` block yet (`grep -n '^apps:'` exits 1). Failure scenario: the reader writes `closed_paths: [secrets/]` or `[/secrets]`. Compared segment by segment, those entries have an empty segment, so no path that passes the segment rule can match them, and `secrets/a.txt` opens while the config reads as closing it. No verdict.
- DESIGN.md:264 and 311, prose: "(read, not parsed)" and "The page holds the version the GET answered, not the pushed one". What is wrong: both are the negation-contrast construction the prose rules ban. Both come from the brief's own words, and the brief says "A design ruling ... never exempts the text". Line 311 also uses three names for one request: "fetches", "the GET" and "the page then reads the value". Line 264 writes "hexadecimal" where line 282 writes "hex". Line 315 calls the root `engine`'s folder "the engine's config folder", while line 242 calls the same folder "oculus's own `config/` folder". Failure scenario: a reader cannot tell whether "the GET" and "a fetch" are two requests, or whether "the engine's config folder" is the root `engine`. No verdict.
- DESIGN.md:311, DESIGN.md:264 and E3-report.md row 18, imprecise sentences. Line 311: "reaches the page as a new `storeBytes` and `storeVersion` in the app's row". A rewrite of equal length keeps `storeBytes`, and the page compares `storeVersion` only. Line 264: "so a file placed by hand costs the watcher one stat". The brief's "a hand-placed large file" lost "large", and a hand-placed file within the limit is hashed whole. Report row 18: "the page reads one app's store ... when that app's `storeVersion` differs from the version the page holds" leaves out "and a frame of the app is mounted". Failure scenario: a builder also triggers fetches on `storeBytes` (harmless), or reads that no hand-placed store is ever hashed. A reader of E2's table believes a push fetches for apps with no frame. No verdict.

## 4. Behaviour

- None. This is a text step and the section remains an unbuilt proposal. The report's "Shapes named" table lists the reader-visible forms the section adds, with the two omissions under Spec 5.

## Declined to judge

- What Chrome does with `connect-src https://host` for `wss://host`, and with WebRTC, DNS prefetch and the download link. The section leaves these to the build step, and only a measurement in Chrome can settle them.
- The code hits of Verify 4's 2000 lines in src, tests and config, which I did not read one by one. They concern a section with no code yet. I read every hit in HELP.md, README.md and DESIGN.md outside the section, and none is made false.
- Rows 20 and 34 of E2's table ("the handler writes by rename and reads back"; "A write of the value the store file already holds changes nothing and calls nothing"). This step restated both rules, but the brief's item 8 does not list the rows. Neither row is false; whether they are re-carried at landing is the orchestrator's call.
- The report's statement that `cmp DESIGN.md <base>` printed nothing before the first edit. It describes a state before the edit, and no rerun can reproduce it. Verify 6 and my sentence diff show that only lines 260 to 327 changed.
- Whether the build should use `realpathSync.native` or a case-folded comparison to close Spec 3. That is a design choice for the orchestrator or Axel; the finding stands either way.

Usage: reviewer ac1301d307cfb017c, served claude-opus-5-5; 205,911 tokens, 30 tool uses, 14.7 min (from its completion notice)
