# Step E3 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/E3, base 192431a7)

This report cites pages by section and code by `file:line`. DESIGN.md line numbers are the worktree's. The section is still lines 236 to 327, and the file is 418 lines in both the base copy and the worktree.

## Verification (rerun by the reviewer)

```
$ git status --short            (from tools/oculus in the worktree)
 M DESIGN.md
?? .scratch/migration/agents/reviews/E3-report.md

$ git diff 192431a7 --stat
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

## Repair round 1, refuted

Reviewer of E3's repair round 1, on /Users/axelfaes/workspace/research-hub/.agents/worktrees/E3 (code under tools/oculus), base 192431a7. DESIGN.md line numbers are the worktree's. The file is still 418 lines, and the section is still lines 236 to 327.

How I found the round's changes: nothing on disk holds the round base (`ls` of `agents/reviews`, `agents/briefs` and `.agents/worktrees` shows only E3.md, E3-round1.md, E3-refuter.md, E3-report.md, E3-brief-check.md, the worktree E3 and E3-base-DESIGN.md). So I ran `grep -c -F` on the repaired DESIGN.md for each first-run sentence that the first refuter report quotes. Every quote the round was sent to change now prints 0: "a push that arrived after it began carries", "the version and value of the last answer.", "After a fetch the page calls", "(read, not parsed)", "The page holds the version the GET answered, not the pushed one", "the page then reads the value", "hexadecimal", "reaches the page as a new `storeBytes` and `storeVersion`", "so a file placed by hand costs the watcher one stat", "or the store of an app removed since the last push" and "A 404 (the app removed or refused since the push)". "the engine's config folder" prints 1, and that one hit is DESIGN.md:392, outside the section. The quotes of lines the round did not touch still print 1: line 260 "A `wss:` origin is refused." and line 266 "The rows carry no store value, so the first frame carries none, ...". This supports the builder's claim that the round changed only lines 264, 307, 311, 315 and 327. For line 313, the first report quotes no first-run text, so whether the round left it unchanged is not verified.

```
$ git status --short            (from tools/oculus in the worktree)
 M DESIGN.md
?? .scratch/migration/agents/reviews/E3-report.md
$ git diff 192431a7 --stat
 tools/oculus/DESIGN.md | 18 +++++++++---------
 1 file changed, 9 insertions(+), 9 deletions(-)

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
diagrams exit=0   (git status --short afterwards: the same two lines as above)

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test
 Test Files  350 passed | 19 skipped (369)
      Tests  5347 passed | 559 skipped (5906)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790797685058 COMPLETED 2474 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
checks exit=0

$ LC_ALL=C grep -n '[^ -~]' DESIGN.md
(nothing printed) nonascii exit=1
$ LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/E3-report.md
(nothing printed)

Case 16: diff of lines 1-235 against the base copy: d1=0; diff from '## Relationship to the cockpit' to the end: d2=0
Absence check (Verify 3b): printed nothing, abs=1
Verify 3a hits, section-relative: 7 25 27 29 49 76 78 80 90 (DESIGN.md 242, 260, 262, 264, 284, 311, 313, 315, 325)
Verify 4: grep -rn --exclude=local.yml -w 'store\|storeBytes\|storeVersion\|app-store\|wss\|engine\|closed_paths' src tests config HELP.md README.md DESIGN.md | wc -l  ->  2000
          grep -rn --exclude=local.yml -w 'storeBytes\|storeVersion\|closed_paths\|app-store' src tests config HELP.md README.md  ->  nothing, exit=1

The round report's evidence, rerun:
$ sed -n 31p src/lib/server/core/paths.ts          ->          return realpathSync(path);
$ grep -n 'export function behaviorFindings' src/lib/data/sources/config/catalogs.ts
152:export function behaviorFindings(engine: string, config: Record<string, unknown>): Finding[] {
  (each finding it pushes is { file, key, message }: file = join(configDir(engine), 'behavior.yml'), key a dotted key such as 'chat.skip_permissions', message from findings.config.<name>; its callers are src/lib/server/root/context.ts:236 and src/lib/server/root/watch/portfolio.ts:327, so the findings reach the config channel)
$ grep -n '^apps:' config/behavior.yml             ->  nothing, apps_block_exit=1
$ wc -l DESIGN.md                                  ->  418

Reviewer probe for ruling 3, read-only, node v24.21.0, from the worktree root:
/TOOLS/OCULUS/CONFIG | realpathSync: /TOOLS/OCULUS/CONFIG | native: /tools/oculus/config
/tools/oculus/config | realpathSync: /tools/oculus/config | native: /tools/oculus/config
native on a missing file throws ENOENT
$ ls -d secrets SECRETS     ->  secrets / SECRETS   (the volume folds letter case)
```

The round's names, grepped across DESIGN.md, HELP.md, README.md and src with `grep -rn --exclude=local.yml -F`:
- "oculus's own `config/` folder": DESIGN.md:242 and 315 only.
- "the engine's config folder": HELP.md:162, DESIGN.md:392, and in src compose.ts:43,68, local.ts:24, files.ts:230,248,260, config-files.ts:4, merge.ts:1 and Config.svelte:15,21. All of these are outside the section. Each names the same folder in the tree's older words, and none states an apps rule.
- `realpathSync.native`, `closed_paths`: DESIGN.md only (315, and 327 for `closed_paths`).
- `behaviorFindings`: DESIGN.md:315 and its definition and three callers in src.
- "hexadecimal", "since the push", "not parsed", "not the pushed": no hits.
- "since the last push": DESIGN.md:307 and 311.
- `storeBytes`: DESIGN.md:264 only.
- "the GET": only src comments about unrelated routes (wallpaper.ts:3, files.ts:3, deposit.ts:151,518).

None of these hits in HELP.md, README.md, src, or DESIGN.md outside the section is made false by the round.

### Verdicts

These cover the whole diff since the base. Items of the brief's "What to build":

- 1: holds. Line 264 has the row `{ ..., key, storeBytes, storeVersion, storeFile }`, "16 hex characters" twice, the folder or unreadable path counted as absent, "so a hand-placed file over that limit costs the watcher one stat", the empty file `e3b0c44298fc1c14`, the `channels.ts:103-110` clause, and the reread list ending "the store file's size and version (computed without parsing the file)". Line 311 has "(256; a KB in this section is 1024 bytes)".
- 2: holds. Line 311 carries the route and every rule of the item. The refetch rule is in ruling 1's words, which replace the brief's. The dropped answer follows ruling 2. The 404 rule is stated once. The request is named "a fetch" throughout. Two orders of events are not covered by the text (Findings 1).
- 3: holds. Line 266.
- 4: holds. Line 315 closes `engine` for every app and closes oculus's own `config/` folder by real path, now defined by `fs.realpathSync.native` with both of the ruling's examples. It gives `closed_paths` its reason, form and default, and says what a malformed value does. Line 327 lists the key. Findings 2, 3, 4 and 5 are related.
- 5: holds. Line 315 states the whole segment rule for every app, with its examples, the exact string and the reapplication to the real path. The order is: the segment rule and `closed_paths` on the given path; the key `engine`; for a root app, a root other than its own (`closed`); whether the root is shown (`missing`); the real-path checks; existence. Finding 2 concerns the order's stated purpose.
- 6: holds. Line 260: "A `wss:` origin is refused." Line 325 names three measurements and "states the results". Line 262 is unchanged.
- 7: holds. Verify 3b prints nothing. No sentence of the section still puts the store in the row or in a push, lets a machine app name `engine`, or claims what `connect-src https://host` admits.
- 8: holds by the item's text. Rows 18, 23, 32, 36 and 42 are in the table's form, and rows 20 and 34 (ruling 11) keep E2's alternatives. Row 23 and row 36 do not follow the round's rulings 6 and 9 (Findings 7).

Cases of the brief's "Cases":

- 1: met (264, no store value in the row).
- 2: met (311, "once per loaded oculus page", onStore in every tab).
- 3: met (311 and 313: an equal JSON value writes nothing, the version is unchanged, nothing reaches the page).
- 4: met (311: "the frame cannot call it ...; only the page calls it").
- 5: met (264 for the oversize version; 311 for `value: null` and the KB, which gives 307200).
- 6: met (266).
- 7: met (315).
- 8: met (315).
- 9: met (315, dot-led segments).
- 10: met (the given-path segment rule runs first).
- 11: met ("a machine app and a root app alike").
- 12: met (`notes.v2.md` named).
- 13: met (`engine` rejects `closed` for every app).
- 14: met (260 gives no reason; 262 is kept).
- 15: met (325).
- 16: met (d1=0, d2=0).
- 17: met (exact string, nothing decoded).
- 18: met (`a//b`, `/etc/hosts`, `a/./b` and the empty path named; a backslash "anywhere").
- 19: met (the real path under the root is checked again; an outside target gives `closed` whether it exists or not; a missing file's and a dangling link's real paths are defined).
- 20: met (the segment rule comes first).
- 21: met, now also for `TOOLS/OCULUS/CONFIG/local.yml` through `realpathSync.native`.
- 31: met (`secrets/a.txt` closed whether or not it exists; `secrets-notes.md` and `a/secrets/b` not closed by it; the link `s -> secrets` resolves by real path, and for a missing `s/a.txt` the deepest existing folder `s` resolves to `secrets`).
- 32: met (`[]` is a list of strings, so nothing is closed by it; the config-folder sentence is separate).
- 22: met under ruling 1. Push v1, then the fetch answers v2. If a push of v2 arrives during the flight, the latest push equals the answer and the answer is held. If no push arrives during the flight, the answer is held. Either way the page holds v2, and a later push of v2 fetches nothing.
- 23: met when the answer predates the latest push: it is dropped, and exactly one further fetch follows. When the answer already carries the latest push's version, the ruled text holds it with no further fetch. That is ruling 1's decision, not a defect.
- 24: met as written (311: the page holds nothing, calls nothing, and a waiting getStore() rejects `missing`). Findings 1 covers the order in which the app comes back during the flight.
- 25: met (311).
- 26: met (311: no call to a closed tab; the answer is kept; the mount comparison finds the version equal).
- 27: met.
- 28: met.
- 29: met (264 and 311).
- 30: met (264).

The eleven rulings, closure by closure:

1. Closed. Line 311: "When a fetch settles and the latest push that arrived after it began carries a version other than the one answered, the answer is dropped and the page fetches once more; a push that arrived before the fetch began is not compared". I traced every order of events. With no push during the flight, the answer is held. With one push during the flight, the answer is held when it matches that push, and otherwise dropped with one more fetch. With several pushes during the flight, only the latest is compared, so v2 then v3 with an answer of v3 is held, which closes the first report's wasted-fetch scenario. A push before the fetch began is not compared, so case 22 ends. Every refetch needs a push during the previous flight, so the loop always ends. The report states the hand-back sentence the ruling asks for, in its first line and in its "Repair round 1" section.
2. Closed. Line 311: "A dropped answer is not held and calls no `onStore`, and a `getStore()` waiting on the dropped fetch settles with the answer of the fetch that replaces it". "the last answer not dropped" and "After a fetch whose answer is held" carry it through. Findings 1 covers the orders it does not reach.
3. Closed as ruled. Line 315 has the definition, the `paths.ts:31` parenthetical (reproduced), and both examples. My probe confirms that `realpathSync.native` returns `/tools/oculus/config` for `/TOOLS/OCULUS/CONFIG`. A missing file's real path is the deepest existing folder's real path followed by the remaining segments: `SECRETS/missing.txt` on a root that holds `secrets/` resolves to `secrets/missing.txt` and is closed. Findings 2 and 3 cover what the ruling's placement and scope leave.
4. Closed. The report has S14 and S15, line 307 under "Sentences removed or reworded", and judgment call 2's corrected reason.
5. Closed. Report line 136: "One read-only `git diff --stat` ran (last section, item 3)".
6. Closed (line 315, quoted above).
7. Closed. Lines 307 and 311 both say "removed or refused since the last push of `apps`". The 404 page rule appears once, on line 311.
8. Closed in content. The finding carries the file and the key `apps.closed_paths`, modelled on `behaviorFindings`, which I verified at catalogs.ts:152 as the tree's `{ file, key, message }` finding for behavior.yml on the config channel. A value that is not a list falls back to the default, a bad entry is left out, and a duplicate applies once. The sentence "no `apps:` block" is true (`grep -n '^apps:'` exit 1). The builder's added clause "the default applies while the key or the block is absent" goes beyond the ruling (Findings 4).
9. Closed. The phrases "(computed without parsing the file)", "which can be newer than the pushed one", "a fetch" throughout line 311, "hex", and "oculus's own `config/` folder" twice on 315 are all in place. No negation-contrast remains in the reworded sentences. Findings 6 names one leftover second name, on line 264.
10. Closed (311, 264, and report row 18).
11. Closed (report rows 20 and 34, with E2's alternatives kept verbatim, as `grep -n '^| 20 \|^| 34 ' E2-report.md` shows).

### Findings

1. **Spec.** DESIGN.md:311: "When a fetch settles and the latest push that arrived after it began carries a version other than the one answered, the answer is dropped and the page fetches once more" against "A 404 (the app removed or refused since the last push of `apps`) leaves the page holding nothing for the app and calls nothing, and a `getStore()` waiting on it rejects `missing`" and "An app with no mounted frame is not fetched until a frame mounts".
   - What is wrong: two orders of events get two readings.
     - (a) A fetch is in flight, the app is removed, and it is then added again before the fetch settles. The fetch answers 404, and the latest push carries a version. A 404 answers no version, so the drop rule says "dropped, fetch once more", and the waiting getStore() settles with the refetch. The 404 sentence says the page holds nothing and the waiting getStore() rejects `missing`.
     - (b) The answer is dropped after every frame of the app has closed during the flight. "fetches once more" contradicts "not fetched until a frame mounts".
   - Failure scenario: in (a), a builder following the 404 sentence rejects `missing` to a tab whose app is present again, and the tab shows a failure for an app that exists. In (b), one builder refetches for an app with no frame and another does not. The text does not decide either.
   - The fix is one clause each: whether a 404 is subject to the drop rule, and whether the refetch waits for a mounted frame. Verdict: none, since item 2 holds by its text.
2. **Spec.** DESIGN.md:315: "The checks run in this order, so that the answer for a hidden path never depends on the disk or on which roots are shown: the segment rule and `closed_paths` on the given path; ..." together with "the real-path checks compare that path, so ... `SECRETS/a.txt` rejects `closed` under the default `closed_paths`".
   - What is wrong: on a volume that folds letter case (this one: `ls -d SECRETS` resolves), the given-path `closed_paths` check compares case-sensitively and misses `SECRETS/x`. Only the real-path check catches it, and only when `secrets/` exists. When `secrets/` exists, the deepest existing folder `SECRETS` resolves to `secrets`, and the answer is `closed`. When it does not exist, the answer is `missing`. So the answer for that hidden path depends on the disk, which contradicts the sentence's stated purpose and Z106 (2)'s aim that an app not "learn whether one exists".
   - Failure scenario: a machine app calls `open({ file: { root: 'hub', path: 'SECRETS/probe' } })` on each root. `closed` tells it that the root holds a `secrets/` folder, and `missing` tells it that the root does not. The lower-case `secrets/probe` gives `closed` on every root.
   - Fix options, for the orchestrator or Axel: compare `closed_paths` on the given path without regard to letter case (always, or on a volume that folds case), or weaken the sentence's claim. Verdict: none; the ruling's two examples hold.
3. **Spec.** DESIGN.md:315: "A real path is the path as the disk stores it, letter case included, as Node's `fs.realpathSync.native` gives it ...".
   - What is wrong: the definition sits in the `open` paragraph. The section uses "real path" before and after it, on lines 242, 264 (the watcher's `folders`, "the app's real folder path"), 284, 317 and 323. Line 323 ("The file route tests the real path, ... and answers a file of an apps folder as `text/plain`") has the same letter-case gap that ruling 3 closed for `open`: the tree's file route resolves with `realpathSync` (`src/lib/server/files/open.ts:204,211`), which keeps the typed case (probe above).
   - Failure scenario: a manual in a cloned root links to `.OCULUS/APPS/evil/index.html`. A builder of line 323 who reads the definition as local to `open` reuses `open.ts`'s `realpathSync`. The typed-case path is then not `inside` the apps folder held in `folders`, so the file is served as HTML and the unapproved app's page runs in the Document view with oculus's origin, which line 323 exists to prevent.
   - The fix at landing is small: define the term once where it first appears (line 242), or say "throughout this section". Verdict: none. Ruling 3 named line 315, and the builder followed it.
4. **Standards.** DESIGN.md:315: "the default `[secrets]` applies; ... `config/behavior.yml` has no `apps:` block until the build step adds it, and the default applies while the key or the block is absent". DESIGN.md:327: "(default `[secrets]`, which also applies while the key or the block is absent), read by `appsSettings` beside `mailSettings`".
   - What is wrong: agents/spec.md, "What every package obeys", says "A value that has a config key ... is never hardcoded beside it as a fallback; the default lives in the config file". The text puts `[secrets]` in code as a fallback, in two places.
     - The fallback for a value that is not a list is ruling 8's own wording. That part is a clash between the ruling and spec.md, and it goes to Axel as the hub's rule on rule clashes says.
     - The fallback for an absent key or block is the builder's addition. Ruling 8 asked only to "say that `config/behavior.yml` has no `apps:` block yet".
   - Line 327 also keeps "read by `appsSettings` beside `mailSettings`". `mailSettings` (src/lib/data/sources/config/settings.ts:125-138) requires every key and throws, so the block now has two reading regimes and says so nowhere.
   - Failure scenario: the build step's builder either follows spec.md, adds `closed_paths: [secrets]` to behavior.yml and has `appsSettings` report a missing key, which contradicts the section, or follows the section and writes `?? ['secrets']`, which the build step's review then flags under spec.md. Either way the builder meets a contradiction that nobody ruled on.
   - Verdict: none.
5. **Spec.** DESIGN.md:315 and 327: the malformed-`closed_paths` finding has no sentence key.
   - What is wrong: line 327 names every word and finding key the section adds ("The finding sentences are in `config/text/findings.yml` under `findings.apps` with the keys named above"). The new finding, modelled on `behaviorFindings` (whose messages are `findings.config.<name>`), is under neither and is unnamed. The report's round section says "its sentence key under `findings.config` is left to the build step", which is a catalog key left open.
   - Failure scenario: the build step invents the key, and the section's claim to list every key it adds is false.
   - Verdict: none.
6. **Standards.** DESIGN.md:264: "the page reads a value with `GET /api/app-store` (below)".
   - What is wrong: line 311 now names this request "a fetch" throughout (ruling 9). Line 264, text from the first run, still describes it as the page reading a value with the route, which breaks the one-name rule of the brief's Conventions. This is minor.
   - Failure scenario: a reader takes the watcher paragraph's "reads a value" and line 311's "a fetch" for two mechanisms.
   - Verdict: none.
7. **Standards.** E3-report.md lines 103, 130, 151, 163, 199 and 203 describe the section as it was before the round:
   - line 130: "The reread list ends "and the store file's size and version (read, not parsed)"". The section now says "(computed without parsing the file)".
   - line 103: "311 | ... `storeBytes` and `storeVersion` in the row". Line 311 now names only `storeVersion`.
   - line 203: "S13 | Order of the checks: segment rule and `closed_paths`, `engine`, root shown (`missing`), real-path checks, existence (`missing`)". The root-app check from ruling 6 is missing.
   - lines 163 and 199 (row 36 and S9): "the engine's config folder". Ruling 9 renamed it "oculus's own `config/` folder" in the section.
   - line 151: row 23 lists the order "..., in that order" without the root-app check or `closed_paths`.

   What is wrong: rows 23 and 36 are the text the orchestrator carries into `E2-report.md` at landing, and S13 is what Axel reads at landing as the shape to rule on. Failure scenario: E2's table then states an order of checks that has the same gap ruling 6 closed in the section, and Axel rules on an S13 that is not the order the section states. Fix at landing: rows 23 and 36 and S13 in the section's words. Verdict: none. Item 8 holds by the brief's row texts, which predate ruling 6.

Proof: none. Every count and line the round report quotes reproduced. The claim that no git command ran in the round, and the claim that line 313 was unchanged in the round, cannot be reproduced after the fact, and no decision rests on either.

Behaviour: none. This is a text step, and the section remains an unbuilt proposal.

### Declined to judge

- Spec 4 of the first report (which server step runs the real-path and existence checks of `open({ file })`) waits on Z112 by the round's instruction and is not raised here. Findings 2 and 3 hold whichever option Z112 takes.
- Whether line 313 changed in the round: no snapshot of the round base exists, and the first report quotes no first-run text of that line.
- The 2000 lines of Verify 4 in src, tests and config, which I did not read one by one. I read the hits of every name the round added or changed (listed above), and none states an apps rule.
- Whether ruling 8's fallback in code or spec.md's rule should give way (Findings 4). That is Axel's to rule on as a clash.
- How Chrome treats `wss://host` under `connect-src https://host`, WebRTC, DNS prefetch and the download link: only the build step's measurement in Chrome settles these.

Reviewer usage: about 36 tool uses; tokens and minutes are in the runner's completion notice.


Usage: reviewer abc7e9011cf0039bd, served claude-opus-5-5; 186,912 tokens, 41 tool uses, 11.6 min (from its completion notice)
