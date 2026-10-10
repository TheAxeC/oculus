# Review of D58 (worktree `.agents/worktrees/D58`, base 6511e8ce1)

Nothing was edited in the repository or the worktree; scratch files under `$TMPDIR/d58rev` were removed. No server, page or Electron was started. The only git run: `git diff 6511e8ce1` and `git status --short`, from inside the worktree.

## Verification lines (from `tools/oculus` in the worktree)

Check 1, the read-only diagram staleness check: `stale: []`

Check 1, `npm run test:quick`:
```
test:quick: 25 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (2.0 s)
ok      eslint (1.6 s)
ok      svelte-check (6.0 s): 1791616214847 COMPLETED 455 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (14.1 s): Duration  10.43s (transform 20.58s, setup 0ms, import 30.71s, tests 7.65s, environment 143ms)
test:quick: 14.6 s (limit 45.0 s); every command passed
```
Check 2, `npx vitest run tests/routes/docs/docs.test.ts --reporter=verbose`:
```
 ✓ |unit| tests/routes/docs/docs.test.ts > the engine read of the docs route > serves a Markdown file of the engine and refuses a path that leaves the engine, a link out of it and a file of another kind 243ms
 Test Files  1 passed (1)
      Tests  1 passed (1)
```
The same file on a scratch copy of the base tree: `AssertionError: an engine inside the hub: expected 404 to be 200 // Object.is equality`, `Test Files  1 failed (1)`.

Check 3: `Test Files  4 passed (4)`, `Tests  36 passed (36)`.
Check 3b: `LC_ALL=C grep -n '[^ -~]'` over every changed path plus the new test printed nothing (`3b exit 1`); the perl ASCII gate over `src tests bin config`, `perl gate exit 0`.
Check 3c: `folder-check exit 0`; `unused diff exit 0` (365 lines, identical); `wc -l`: docs.ts 781, docs.svelte.ts 358, Doc.svelte 310, Markdown.svelte 293, doc-link.ts 112, jump.ts 128, RenderedMarkdown.svelte 130, Help.svelte 97, catalogue.ts 326, pages.ts 605, paths.ts 109, config/layout.yml 182, doc.yml 19, HELP.md 454, DESIGN.md 592, docs/DATA-MAP.md 594, .oculus/config/layout.yml 12, docs.test.ts 146.
Check 4: the test fails on the base copy and passes after; each row, read, would fail with its check taken out.
Check 5: the new HELP.md bullets (25-27, 390), the two DATA-MAP cells and DESIGN.md:493 read; one sentence false (Standards 2).

## Reruns of the report's evidence

- Cases 2, 3, 4, 10 on this hub: match field for field (`engine=docs/apps.md 200 ... "engine":true,"engineAt":"tools/oculus"`; `manual=1 ... "path":"HELP.md","manual":"HELP.md","engine":true`; `hub=docs/DATA-MAP.md ... "manual":"tools/oculus/HELP.md","engine":false`; `engine=DESIGN.md` 14 parts, html 279272, as `hub=tools/oculus/DESIGN.md`). The manual's html is 149719 against the report's 149459 (taken before its last HELP.md edit; no decision rests on it).
- Base tree: `engine=docs/apps.md 404 {"error":"not a document this route serves: "}`.
- Case 5, engine outside a scratch hub: all nine inputs 404 with the report's messages.
- Case 1's route half over a demo copy: `engine=docs/apps.md 200 ... "engineAt":""`, first heading `Building an oculus app`.
- `openingOf` on a scratch copy: every quoted row reproduced; one unquoted row wrong (Spec 1).

## Verdicts per item

1. Holds (the real path is not checked for dot or `node_modules` segments: Standards 2).
2. Holds (`manualInHub` departs from "as now" only for an engine whose real path lies outside the hub; judgment 4).
3. Violated in part: the strip label and the window title of an unlabelled engine tab read "Hub document", and `fileOfTab` returning null removes the breadcrumb and tab-menu file items (Spec 2).
4. Violated for one input: a hub-space link that climbs out of the hub opens a tab (Spec 1).
5. Holds.
6. Holds by reading.
7. Holds.
8. Holds for the lines named; DESIGN.md:493 false (Standards 2).
9. Holds; the Doc text's current lines match `guarded.md` 10-12 byte for byte; the new G2 sentence is false for one input (Standards 2).

## Verdicts per case

1. Not verifiable (page); route half met; reading draws the guide. Settled by the look over a demo copy.
2. Met. 3. Met. 4. Met. 5. Met.
6. Not verifiable; probe gives `{"kind":"engine","path":"docs/apps.md"}` and `{"kind":"help"}`; with the guide tab closed the new tab's strip name is "Hub document". Settled by the look with the engine outside the hub.
7. Not verifiable; reading and probe give one tab and the Help view for `tools/oculus/HELP.md`. Settled by the look on this hub.
8. Not verifiable; reading gives the restate to `engine:docs/apps.md`. Settled by the look and a read of the saved layout.
9. Met. 10. Met.
11. Not verifiable; reading gives one tab. Settled by the look on a scratch hub whose layer lists the guide.

## Spec

1. `src/lib/views/shared/prose/doc-link.ts:96` `if (!doc.engine) return inHub(link.path, doc.manual, engineAt);`: `docLinkOf` no longer empties a climbing target and the hub branch never checks `climbsOut`. Failure: `docs/DATA-MAP.md` linking `../../x.md` gives `{"kind":"hub","path":"../x.md"}`, and a doc tab drawing "../x.md is not in the documents list"; at the base nothing opened. Breaks item 4's "any other target opens as now"; makes `openingOf`'s doc comment (doc-link.ts:87) and `Markdown.svelte:22-23` false.
2. `src/lib/state/workbench/navigation/pages.ts:461` `return doc === null || doc.engine === true ? null : ...`: the guide tab on this hub loses the breadcrumb (`strip/tab-crumbs.ts:38`), the tab menu's Copy Path, Copy Relative Path, Reveal, Show in Files, Open Timeline, Add Bookmark and Open in Program (`tab-menu.ts:114-146` through `tab-menu-state.svelte.ts:70,123`), the file icon (`shownFileOfTab`, pages.ts:479) and hover path (`shownTabPath`), its Open Editors row (`open-editors.ts:59`) and the Timeline following it (`Timeline.svelte:88`). Item 3 asks for the file actions at `<engineAt>/<path>`. The page's served roots already hold the engine's config folder (`engineRoot`, `server/files/files.ts:362-363`) beside the hub root, so callers holding `roots()` could place an engine tab without changing the saved state. Also the strip label (`strip-tab.ts:40-47`) and window title (`workbench-title.ts:14-19`) read "Hub document" for an unlabelled engine tab, where item 3 asks for the path's last name.
3. Paths outside the write list: `paths.ts` (`hasHiddenSegment`, needed and named: accepted); `pages.ts` (Spec 2).

No added dependency; no reserved decision taken; every case has a first run; premises spot-checked hold.

## Proof

1. The test does not cover a link inside the engine into a dot or `node_modules` folder (Standards 2).
2. `fileOfTab`'s null stands where item 3 asked for the file actions (Spec 2).

## Standards

1. `jump.ts:7-8` splits `doc-link.ts` across two comment lines (spec.md:43).
2. `docs.ts:592-600`: the segment rule reads only the name; the real path is checked for being inside the folder but not for dot or `node_modules` segments. A scratch engine with `docs/hid.md -> ../.scratch/x.md` and `docs/nm.md -> ../node_modules/y/r.md` answered both 200. DESIGN.md:493 and the Doc text's G2 sentence (Z769 (a)) are false for this input. Fix: `hasHiddenSegment(at)` after the real-path check, and a test row.
3. The comments made false by Spec 1 (doc-link.ts:87, Markdown.svelte:22-23).
4. The builder ran `git -C . diff --stat -- .oculus 2>/dev/null | head -0` (spec.md:32) and read two main-checkout files with `diff`; both disclosed.
5. Minor: `catalogue.ts`'s head comment (1-8) does not mention the engine path rules it now holds; `Doc.svelte`'s registration comment (2-3) and `doc.yml:16` (`doc: Hub document`) now also name engine tabs.
6. `tests/routes/docs/docs.test.ts:7` ("Nothing outside the temporary directory is read or written") is false: `loadConfig(engineDir())` reads the engine's `config/`.

## Behaviour

1. The guide tab on this hub loses the file items listed in Spec 2; the report names only the breadcrumb, the bookmark and Open in Program.
2. `Doc.svelte:129-155`: every hub document tab asks for the manual first and starts its own read only after that answer, serially. Measured over `handleDocs`: `manual=1 200 28.4 ms 152421 bytes` cold, 12.8 ms and 6.5 ms warm, against `hub=docs/DATA-MAP.md 200 12.1 ms 106611 bytes`. The report states the wait, not that the reads are serial.
3. A hub document's link above the hub opens an unlisted tab (Spec 1); not in the report.
4. The report's case 6 before and after is inaccurate: with the shipped arrangement the link activates the open guide tab, which keeps "Apps guide"; a new tab (after the guide tab is closed) is named "Hub document" in the strip and window title, `apps.md` only in the pane title.
5. An engine document reached through a link inside the engine is answered under the target's path (`engine=docs/hid.md` answered `"path":".scratch/x.md"`); stated in the report.

## Declined to judge

1. The page behaviour of cases 1, 6, 7, 8 and 11 on screen: no page may be run here.
2. Whether `becomeEngine` mis-closes a tab with the same engine document in several floats at once: reading gives one surviving tab and no loop; only a look would settle it.
3. The `.svg` diffs: not read; the staleness check covers them.
4. Whether the page's roots carry configured or real directories.
5. The `engineAt` of an engine configured through a link inside the hub to a folder outside it (probe gave `tools/oc`): the brief's shape.

Usage: a5069412810f7d98c, claude-opus-5-5, 243,734 tokens, 67 tool uses, 12.5 min.
