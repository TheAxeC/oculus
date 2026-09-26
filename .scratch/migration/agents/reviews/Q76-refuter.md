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
8. `npm run diagrams` twice. The md5 of `docs/diagrams/*` was `a721f2b76a0cd1b0b393c42d0c175c22` before the first run, after the first run and after the second run. My runs changed nothing in docs/diagrams. The six diagram files differ from c2e6dedc because the builder's run rewrote them.
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
   - `git show c2e6dedc:tools/oculus/tests/state/system/docs.test.ts | grep -c "^\s*it("` prints `11`: the file existed and drove the store through `createClientState`.
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
