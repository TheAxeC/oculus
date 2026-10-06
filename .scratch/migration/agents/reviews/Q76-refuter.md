# Q76 refuter

## Verification

All commands were run from /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q76/tools/oculus.

1. `npx vitest run --reporter=dot`, run three times.
   - Run 1 (15:25): `Test Files  3 failed | 327 passed (330)` / `Tests  3 failed | 5149 passed (5152)`. The failing cases were not captured.
   - Run 3 (15:30): `Test Files  330 passed (330)` / `Tests  5152 passed (5152)`.
   - Run 4 (16:00): `Test Files  330 passed (330)` / `Tests  5152 passed (5152)`.
   - Run 2's tail was filtered and is not quoted.
2. `npm run check`: `COMPLETED 1458 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
3. `npm run build`: `build exit 0`
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: `lint exit 0`
6. ASCII gate of spec.md, piped to `wc -l`: `0`
7. `sh bin/size-check.sh`: `size exit 0`. `sh bin/folder-check.sh`: `folder exit 0`
8. `npm run diagrams` twice. The md5 of `docs/diagrams/*` was `a721f2b76a0cd1b0b393c42d0c175c22` before the first run, after the first run and after the second run. My runs changed nothing in docs/diagrams. The six diagram files differ from 77855d47 because the builder's run rewrote them.
9. After `npm run build` and the port wait (free 3x):
   - `npx playwright test tests/browser/workbench/system.spec.ts`: `15 passed (22.1s)`
   - The whole suite, `npx playwright test --reporter=dot`: `410 passed (7.4m)`
10. `node bin/revert-check.mjs` over the five node files (docs.test.ts, routes/docs.test.ts, views/sources/doc.test.ts, catalogue.test.ts, views/system/help.test.ts): `95 reverts, 0 unproven, 9 unchecked`. All 9 unchecked are pre-existing help.test.ts cases.
11. `node bin/revert-check.mjs tests/browser/workbench/system.spec.ts`, on a port free 3x in a row: `11 reverts, 0 unproven, 5 unchecked` (exit 1, from the unchecked cases).
    - It gave 0 unproven on the first attempt, and no case printed "did not run".
    - The three new cases are red with their reverts: docs.svelte.ts:153, Doc.svelte:65 and Doc.svelte:84.
    - The 5 unchecked are pre-existing cases, among them "a hub document opens from its group in the catalogue".
    - This contradicts the report's claim that no clean run could be had. The cause was the shared port, not the tests.
12. `ls -d $TMPDIR/oculus-* | wc -l`: `0` before, `0` after.
13. `git status --short`: 18 modified files and no untracked files, the same list before and after my runs.

## Spec

1. The report's claim that tree fact 6 was wrong reproduces.
   - `git show 77855d47:tools/oculus/tests/state/system/docs.test.ts | grep -c "^\s*it("` prints `11`: the file existed and drove the store through `createClientState`.
   - `grep createDocs` over tests prints nothing because that file never names the function.
   - The brief's premise was wrong. The builder rewrote the file (now 19 cases), which item 5 covers.
2. The wire shape `file` (docs.ts:92-96, :162, :167) is a user-visible shape the brief did not name.
   - The report states it as judgment call 1, but it is not yet booked as an open item in the ledger or state file. Spec, "reported means booked", requires that.
   - On need: the store can only match a `files` root against an absolute path, and the manual's path is known only to the server. So the field is needed, or an equivalent server-side root key.
   - On leaks: the page already receives the absolute hub root in every `files` payload and the `git` payload, and every manifest's absolute path in the snapshot (`project.file`, used at Project.svelte:104). `file` adds only the engine directory's absolute path (the manual) and a hub path under a root the page already knows. No new kind of data. The route checks `escapes()` before it resolves `file`, so a climbing path never gets one.
3. The docs/diagrams/*.dot/.svg changes are outside the brief's path list. They come from verification item 8 plus the new config-channel import in Doc.svelte, and the report names them. No finding beyond that.
4. `tests/checks/tree/allow-duplication.txt`: the 3 removed entries are demanded, not loosening. `tests/checks/tree/duplication.test.ts:366`, "holds the lists to pairs that still share, so a repaired copy takes its entry with it", fails on a stale entry.

## Proof

1. The duplicate collision of the restated tab id is not exercised.
   - Doc.svelte:65: `restateInstance(instance.id, { ...held(instance.state), ...docState(entry) });`
   - Spec, "Every id or key a package introduces is exercised empty, duplicated, and colliding", asks for the case where a stale tab is restated to `id: entry.path` while another open doc tab already holds that path.
   - That case is absent, and the report calls it a "sharp edge" instead of fixing it. The result is two tabs with the same `stateId` (layout/instance.ts:92,111), so `openView` finds only the first.
   - Fix: in the effect, when another instance of view `doc` already holds `stateId === entry.path`, close this instance (or activate the other) instead of restating. Add a browser case seeding both tabs.
2. The first full node run printed `3 failed`, and the builder's report records `2 failed` once. The later runs passed, and the failing names were not captured, so nothing ties them to this diff. Not verified either way.

## Standards

1. The "Doc text" for DESIGN.md:275 is incomplete and leaves one existing sentence false.
   - The appended text says the store asks again "only after a `files` message whose root holds its file, or a gap". It omits the third rule, docs.svelte.ts:164, `if (file === undefined || file === '') return true;`: an answer that named no file is re-asked on every rooted message.
   - DESIGN.md:275 keeps "opened by the unlisted `doc` view over `api/docs`, one instance per path". The duplicate-restate edge of Proof 1 makes that false until Proof 1 is fixed.
   - Fix: add the third rule to the replacement line. Keep "one instance per path" only once the restate refuses a second instance.
2. Report counts:
   - Check 10 for the browser file: see Verification 11. A clean `0 unproven` run was obtainable.
   - Check 10 for the node files: the report's "87 reverts" plus "37 reverts" counts catalogue.test.ts in both groups. The single run over the five files gives `95 reverts, 0 unproven, 9 unchecked`.
   - Neither is a code defect, but the report's first line qualifies a check that passes.
3. Grep of the removed and changed names across src, tests, config, HELP.md, DESIGN.md and README.md:
   - `invalidate`: remains only in latex.svelte.ts, files.svelte.ts and fs.svelte.ts, which are other stores.
   - `docState`: Workbench.svelte:158 and Catalogue.svelte:230 are unchanged and still correct.
   - `doc.failed`: two arguments at its only use, Doc.svelte:89.
   - `PENDING`: in docs.svelte.ts it is returned only at :153.
   - No head comment the diff makes false. The store's head comment (docs.svelte.ts:11-26) matches the code.
   - No non-ASCII, no history comment, no package id in a comment.

## Behaviour

1. An error on a re-read replaces a drawn document, including a transient failure.
   - docs.svelte.ts, catch branch: `keep(key, { ...PENDING, error: reason, loading: false });`
   - A fetch rejection during a re-read (dev server restart, network blip) turns a drawn document into "The document X could not be read: Failed to fetch". It stays so until a later `files` message concerning it.
   - This is judgment call 6 in the report, but the "Before and after" section does not list it. It is not the loading state, so item 1's letter holds, but the reader loses a correct document to a transport error.
   - Fix: in the catch, when `held[key]` holds a document with no error, keep it and leave the mark unconsumed, so the next message re-asks.
2. The manual is now re-read only on a message whose root holds the engine directory.
   - `repositoryRoots` excludes the engine root (src/lib/server/files/roots.ts:44-48). Where the engine is not under the hub (the browser suite's own setup: the hub is a temp copy, the engine the worktree), an edit to HELP.md is never re-read until a version gap or a reload.
   - Before: any `files` message re-read it. The brief's item 3 permits this, but the report does not state it.
   - Under Axel's layout the engine (tools/oculus) lies under the hub root, so hub messages cover it.
3. `holds()` (docs.svelte.ts:58-63) compares strings from two different sources.
   - The server builds the file path with `resolve(join(local.hub, ...))` (docs.ts:156). The watcher's root is `expandHome(dir)` (roots.ts:47), which is not normalised.
   - `holds()` strips only trailing separators. A `local.hub` with a `.`, `..` or doubled slash would stop documents from ever re-reading on writes, except on gaps.
   - Not verified against a real local.yml; the browser case passes with the suite's hub. Fix: normalise the root with `resolve` in `holds`, or answer the file relative to a named root.
4. Busy builder:
   - Every write under `.agents/worktrees/` is a hub-root message. It re-asks every drawn hub document, the manual (under Axel's layout) and every drawn project document, since project folders are under the hub.
   - The browser case writes under `notes/` in the served hub, which is the same root, and proves both things asked for: 3 re-reads, all `304`, no appearance of "Reading the document..." (a MutationObserver over body text catches even one frame), and the `data-kept` heading node kept. Its revert turned it red in my run.
   - Not measured for a write under `.agents/worktrees/` itself, and the request rate per drawn document was not measured.
5. `data-path` on the doc view box now carries the followed entry's path rather than the tab's saved path (Doc.svelte:80).
   - The report's "before and after" section does not list this.
   - `grep -rn data-path tests/browser` shows no selector on the doc view, so nothing breaks.
6. An unlisted tab now asks the server nothing even when its file exists (judgment call 5).
   - Before: a tab left open after its entry was removed from `docs:` still drew the file.
   - After: it draws `doc.unlisted`.
   - The report states this only as a judgment call, not in its before and after section.
7. Help and Project, the two other readers of the store:
   - Help.svelte:43-44 derives `parts` from `shown`, and on a 304 or equal answer the held object stays the same, so `splitManual` does not re-run.
   - Project.svelte:78 reads `docFor(id, chosen)` the same way.
   - No test covers either view under a re-read in a browser. The node test covers only the manual-survives rule, with a stub file outside the hub.

## Not checked

- The names of the 3 failures in the first full vitest run.
- The HELP.md and DESIGN.md text as it would read after landing. I read only the lines the report quotes and DESIGN.md:107 and :275.
- The look on the TEST page in Axel's Chrome.
- The real `~/.oculus/local.yml` hub path form (Behaviour 3).
- The duplicate-tab edge at runtime; I did not seed it.
- Request volume under an actual running builder.

## Usage

Wall time about 42 minutes (15:23 to 16:05 CEST). Most of it went to the three node suite runs, the full browser suite (7.4 min) and the two revert-check runs (about 12 min and 3.5 min).

## Repair round 1, refuted

### Verification

All commands were run from /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q76/tools/oculus.

1. `npx vitest run --reporter=dot`, one run, started 17:20: `Test Files  330 passed (330)` / `Tests  5158 passed (5158)`. No FAIL line.
2. `npm run check`: `COMPLETED 1458 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
3. `npm run build`: `build exit 0`
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: `lint exit 0`
6. The ASCII gate of spec.md:85, piped to `wc -l`: `0`
7. `sh bin/size-check.sh`: `size exit 0`. `sh bin/folder-check.sh`: `folder exit 0`
8. `npm run diagrams` twice. `cat docs/diagrams/* | md5` gave `309bec94ddb098c47a7aa92bb23a9788` before the first run, after the first run and after the second run. Both runs exited 0.
9. `npm run build`, then the port wait (`free=3 polls=3`), then `npx playwright test tests/browser/workbench/system.spec.ts`: `16 passed (32.7s)`. It ran on the first attempt, and no case printed "did not run".
10. `node bin/revert-check.mjs` over tests/state/system/docs.test.ts, tests/routes/docs/docs.test.ts, tests/views/sources/doc.test.ts, tests/state/workbench/navigation/catalogue.test.ts and tests/views/system/help.test.ts: `101 reverts, 0 unproven, 9 unchecked`, exit 0.
    - All 9 unchecked cases are pre-existing help.test.ts cases.
    - The output has 0 "did not run" lines.
    - This run passed the tool's 600 s foreground limit, and the harness moved it to the background by itself. I waited for it in a foreground loop that read its output file. I started no background shell myself.
11. After the port wait (`free=3 polls=3`), `node bin/revert-check.mjs tests/browser/workbench/system.spec.ts`: `12 reverts, 0 unproven, 5 unchecked`. It ran on the first attempt. The new cases are red under their reverts:
    - "a hub document keeps its drawn heading while writes under the hub are read": docs.svelte.ts:168
    - "follows the entry carrying its label": Doc.svelte:69
    - "names the path it asked for": Doc.svelte:104
    - "closes into that tab": Doc.svelte:67
    - The 5 unchecked cases are pre-existing ones.
12. `ls -d $TMPDIR/oculus-* | wc -l`: `0` before and `0` after.
13. `git status --short`: the same 18 modified files before and after my runs, and no untracked file.

### Closures

1. Colliding tab: reproduced, with Proof 1 below.
   - Doc.svelte:64-86 closes the stale tab into the other tab.
   - The browser case is green, and it is red under its revert (Doc.svelte:67), per check 11.
   - The effect cannot loop:
     - After the restate, `path` equals the entry's path, so `followDoc` returns `moved: false` and the effect returns at :66.
     - After the close, the component unmounts.
     - A restate on an id no page holds changes nothing (instances.ts:92-96), so no dependency moves.
   - It cannot close the wrong tab: it closes only `instance.id`, and `openElsewhere` skips `instance.id` (:82).
   - It does not fire before the config lands: when `pushed === null`, `followed` is null and the effect returns (:57, :66).
   - A hidden tab that was never shown is not mounted (PaneView.svelte:127 keeps only the active tab or tabs already seen), so it does not act until it is shown. The report states this as a sharp edge.
2. Transport failure: reproduced, with Proof 2 and Behaviour 1 below.
   - docs.svelte.ts:255-256 returns before `askedAt[key]` is set when a drawn document with no error is held.
   - An HTTP error answer with a JSON body replaces the drawn document (:237-243).
   - Both store cases are green and red under their reverts, per check 10.
   - No request storm, by reading the code, not by a run:
     - Each of the three readers calls the store only inside a `$derived` whose dependencies are the key's `held` and `marks` entries plus primitives: Doc.svelte:62, Help.svelte:43, Project.svelte:78 (`id`, `chosen`).
     - A failed re-read writes neither `held` nor `marks`, and `finally` re-asks only when `marks[key]` moved (:266).
     - So a permanently failing fetch costs one request per concerning `files` message, plus one per re-evaluation for another reason. For Doc.svelte, that is a push on the config channel.
3. `holds()` normalising: reproduced, with Proof 3 below.
   - `segments()` (docs.svelte.ts:68-76) resolves an empty segment, `.` and `..` as a string operation.
   - The four cases are red under their reverts.
   - A root of `/` gives `segments('/') = []`, so it holds every non-empty file, which is correct.
   - A root below the filesystem top (`/..`) pops on an empty list and stays `[]`, which is also correct.
4. The DESIGN.md:275 Doc text names the third rule: reproduced. The report's replacement text contains "after any message that names a root when its answer named no file", which matches `concerns()` at :179. See Standards 1 for a different sentence of the same text.
5. Before and after entries: reproduced. Entries 7 to 11 of the report's "Before and after" section cover data-path (7), the unlisted tab (8), the manual root (9), the transport failure (10) and the busy builder (11).
6. Report counts from one run: reproduced.
   - The node revert-check gives `101 reverts, 0 unproven, 9 unchecked` and the browser one `12 reverts, 0 unproven, 5 unchecked`, both equal to the report.
   - The browser spec gives `16 passed`, the same count as the report.
   - vitest gives `5158 passed (5158)`, equal to the report.
7. Three full vitest runs: not reproduced in full. I ran one full run, which passed with no FAIL line and the same count as the report. The builder's other two runs are not re-run by me.

### Spec

none

### Proof

1. tests/browser/workbench/system.spec.ts:528-548 and Doc.svelte:74, the activation half of the collision fix is not proven.
   - The line: `activateInstance(open);`
   - The case seeds the tabs in the order `status-tab`, `doc-current`, `doc-tab`, with `doc-tab` active (bootWithDocTab, :419-447). Closing the active last tab settles the pane onto its neighbour, which is `doc-current`. The heading and the single tab would therefore likely still be asserted with :74 deleted.
   - Not run: I edit nothing.
   - The branch where the other tab is on another page, the `pages()` loop of `openElsewhere` (:79-86), is not exercised by any case.
   - Fix:
     - Seed `doc-current` first and `status-tab` between it and `doc-tab`, so the neighbour is the Status tab. Assert that `doc-current` is the active tab, and give the case a revert directive for :74.
     - Add a case with `doc-current` on a second page.
2. tests/state/system/docs.test.ts:430-454, the "mark stays unconsumed" half of ruling 2 is not asserted.
   - The second request in the case follows a fresh `wrote(HUB)`, which marks the key again. A variant that consumed the mark (`askedAt[key] = mark; return;` at :256) would therefore stay green.
   - Fix: after the rejected fetch, call `hubDocument(...)` again with no write, `settle()`, and assert a second request was made. Give that assertion a directive that sets `askedAt[key] = mark` before the return at :256.
3. docs.svelte.ts:70, `path.split(/[/\\]/)` splits on a backslash as well, and no case covers it.
   - Replacing the pattern with `'/'` keeps every case green, by reading the four cases (:471-491), which use forward slashes only.
   - A root of `/` has no case either.
   - Fix: a case with backslash-separated root and file, and a case `holds('/', '/a/x.md') === true`, each with a directive.

### Standards

1. Doc.svelte:32-33 and the report's DESIGN.md:275 Doc text say something false for a tab on another page.
   - Doc.svelte:32-33: `when another tab already holds that path, this one is closed and that one shown`
   - The DESIGN.md:275 text: `is closed and that tab shown`
   - `activateInstance` (instances.ts:131-137) makes the tab active within the page holding it and records it in `attention.touchPane`. It does not switch the page on screen. `attention.touched()` (attention.ts:82-91) falls back to the current page, and the report's own judgment call says "The page on screen is not switched to it".
   - So for a tab on another page, "shown" is false.
   - Fix: "that one made the active tab of its page" in both places. HELP.md's "closes into the tab already showing that entry" can stay.
2. docs.svelte.ts:252-254, the comment `A request that never reached the server (a restart, a dropped connection) says nothing about the file` does not cover every way into the catch.
   - The catch is also reached when `response.json()` (:229) throws on an answer whose body is not JSON. That request did reach the server, so the comment is false for that path. See Behaviour 1.
   - Fix: parse the body in its own try, so the outer catch holds only fetch rejections, or reword the comment to match.

### Behaviour

1. docs.svelte.ts:227-229 and :251-256, an HTTP error whose body is not JSON keeps the drawn document. Ruling 2 says it replaces it.
   - The hunk:
     ```
     askedAt[key] = mark;
     if (response.status === NOT_MODIFIED && held[key] !== undefined) return;
     const body = (await response.json()) as { ... };
     ```
   - A 5xx whose body is HTML or empty (a proxy, a crash page) throws at :229. The catch then returns at :256 because a drawn document is held.
   - The error is never shown. The mark was already consumed at :227, so nothing asks again until the next concerning message. `tags[key]` keeps the old tag.
   - The same holds for a 200 whose body is not JSON.
   - Not reproduced by a run.
   - Fix: read the body in its own try. On a parse failure, use `String(response.status)` as the error, taking the `!response.ok` branch.

### Not checked

- The builder's second and third full vitest runs. I ran one.
- Whether deleting Doc.svelte:74 or changing :70 actually keeps the named cases green (Proof 1 and 3). This is reasoned from the seeded layout and the case inputs, since I edit nothing.
- A Windows path at runtime, and drive-letter case (`C:` vs `c:`). `segments()` compares segments case-sensitively.
- The whole browser suite (Axel's ruling: it runs on main at landing).
- The look on the TEST page in Axel's Chrome.
- The DESIGN.md and HELP.md text as it will read after landing. I read only the report's replacement lines.
- Request volume under a running builder.

### Usage

Wall time about 29 minutes (17:19 to 17:48): the full vitest run took about 3 min, the node revert-check about 23 min wall time including the wait, and the browser revert-check about 5 min.

## Closed

First review (sent in repair round 1):
- Proof 1, the colliding restate: closed in the round (`Doc.svelte` closes the stale tab into the one holding the path), and at landing the activation proven by two browser cases (below).
- Standards 1, the DESIGN.md:275 text: closed in the round's Doc text, applied at landing.
- Behaviour 1, a transport failure replacing a drawn document: closed in the round.
- Behaviour 2, the manual re-read only for its own root: stated in the round report's before and after (c).
- Behaviour 3, `holds()` not normalising: closed in the round.
- Behaviour 5 and 6, `data-path` and the unlisted tab: stated in the round report's before and after (a) and (b).
- Spec 2, the `file` field: ruled by Axel, keep.
- Standards 2, report counts: closed by the round report's single-run lines.

Round 1 refutation, fixed at landing on main:
- Proof 1: `bootWithDocTab` takes `statusSecond` and `other`; the collision case puts the Status tab between the two document tabs and asserts the remaining tab is selected; a new case holds the other tab on a second page and asserts the saved layout makes it that page's active tab. Both name `Doc.svelte:75 => delete`, red in `node bin/revert-check.mjs tests/browser/workbench/system.spec.ts` on main.
- Proof 2: the transport-failure case asserts a call with no write asks again, named `docs.svelte.ts:263 => ... { askedAt[key] = mark; return; }`, red on main.
- Proof 3: cases for a backslash path (`docs.svelte.ts:73 => path.split('/')`) and the root `/` (`:87 => base.length > 0 && ...`), red on main.
- Standards 1: `Doc.svelte:32-34` and the DESIGN.md:275 text say the other tab is made the active tab of its page.
- Standards 2 and Behaviour 1: the body is read in its own `try` (`readBody`, `docs.svelte.ts:277-284`), so an answer whose body is not JSON replaces what is held with its status and the outer `catch` holds only requests that never reached the server; a case with a 502 HTML body, named `docs.svelte.ts:282 => throw error;`, red on main.
