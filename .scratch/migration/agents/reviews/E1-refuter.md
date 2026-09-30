# Refutation of E1

Verification lines. `npm run diagrams` was run first and then checks.sh, from the E1 worktree's tools/oculus. Exit status 0. After the run, `git status --short` shows only `M DESIGN.md` and `?? .scratch/migration/agents/reviews/E1-report.md`.
```
$ npm test
 Test Files  339 passed | 19 skipped (358)
      Tests  5149 passed | 557 skipped (5706)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
The brief's gate and the commands the report quotes, each rerun:
- `LC_ALL=C grep -n '[^ -~]' DESIGN.md` printed nothing (exit 1).
- `grep -n '^## Apps\|^## Relationship\|^## Hot reload' DESIGN.md` printed 222, 234 and 313. `wc -l DESIGN.md` gives 402.
- `npx vitest run tests/checks/source/history.test.ts`: 3 passed.
- `git diff 9023d17d --stat`: DESIGN.md only, 79 insertions and 0 deletions.
- The report's open items match the base state file's "Open items" section exactly (`diff` of the two extracts is empty). They are not the main checkout's current list, where Z72 has since been ruled; that is expected.
- `grep -rn "\.views()" src` reproduces the single hit at views.ts:59.

## Verdicts, brief "What to build"
- 1, where an app lives: met.
- 1, how oculus finds it while running: partial. The registration mechanism collides with `registerCollections` (B1), and the new `apps` group breaks layout.yml's rule that every group is one rail page (S4).
- 1, served and isolated: partial. The origin check and the `<origin>` value are ambiguous (S6). The "no network beyond the policy" claim is not established (P1).
- 1, what it may read: partial. The `files` channel is described wrongly (S5), and the `apps` channel is not ruled open or closed (S7).
- 1, how it writes: partial. `deck` is misclassified (S1), and "recorded and undoable" is false for three open kinds (S2).
- 1, approval: met, with a gap in the file's shape (S8).
- 1, what an app does not get: partial (P1, B2).
- 1, words: met.
- 1, no plan id, date or session: met (history test passes).
- 2, Decisions taken and Still undecided unchanged: met (0 deletions in the diff).
- 3, the report: partial. All required choices are present, but two of them rest on wrong premises (9, 17). The list of sentences the build would make false is incomplete (P4). Some user-visible shapes are not listed (St4).

## Verdicts, cases
Cases 1 to 8, 10 to 14, 16 to 18 and 20 hold as text.
- Case 9 holds as text, but the design would close the tab anyway through `registerCollections` (B1).
- Case 15 holds for the first frame, but is broken at the first config push (B1).
- Case 19 holds as text; the key forwarding has no focus check (B2).

## The four additions beyond the brief
- **Per-app key in the address.** No brief item needs it; the brief only asked the section to say that another page can read an app's files. It closes that leak, and it is listed as choice 4, so no decision was taken silently.
- **Page policy `frame-src 'self'`.** No item asks for it. It closes a way for an app to send data out by navigating its own frame. It is page-wide, is listed as choice 7, and changes an existing view (B4).
- **Write-kind enforcement on the parser branch.** It is needed for the brief's own rule to hold. The page cannot tell which parser a body will match, because writes.ts:239-494 tries the parsers in order. Listed as choice 16.
- **`host` open to apps.** Inside the brief, since it rules every kind. It is correct: `writeHost` resolves under the hub (writes/subtasks.ts:215-216).

## Spec
- **S1, `deck` misclassified.** DESIGN.md:303 opens `deck` among kinds "which edit the hub's own data". deck.ts:1-4 says it writes `config/present.yml`, "the one write that touches an engine file rather than the hub". That is the same class as `rail` and `audit-mute`, which the section closes for editing config. Report choice 9 says "deck rewrites a PRESENT.md", which is wrong. The four entry kinds also write the machine's bookmarks file outside the hub (writes.ts:84-85). Failure: Axel rules on choice 9 believing `deck` edits hub data, and an approved app then rewrites oculus's deck configuration.
- **S2, "undoable" is false for three open kinds.** DESIGN.md:303 says "the other open kinds are recorded and undoable and send without asking", and report choice 9 says "undo covers every open write". In fact these are recorded with `undo: 'none'`, which `undoChange` answers `nothing` (undo.ts:181):
  - `new-idea` (writes/manifest.ts:314)
  - `linkedin-idea` (feeds.ts:253)
  - `linkedin-post` (feeds.ts:306, which moves files)

  Failure: an app creates idea folders under the hub, or moves LinkedIn files, with no confirmation and no way back. Choices 9 and 17 rest on the false premise.
- **B1 (listed here because the spec text causes it), factory collision.** DESIGN.md:263 has `registerApps` find "the module that exports the app factory". views.ts:53-65 treats every module whose `registration` is a function as a collection factory. Failure: a builder exports `registration = (rows) => ...` from AppFrame.svelte. On the next config push, `registerCollections` calls it with collection-key strings and registers `app:undefined`. It then calls `unregisterView` (registry.ts:187-190, which closes the tabs) for every real app. The section must name how the two factories are told apart.
- **S4, the `apps` group has no rail page.** DESIGN.md:270 adds `apps` to `nav_groups` with no rail page. config/layout.yml:24 says "every group is one rail page, keyed by the page's arrangement key". This is not listed as a sentence made false, and the section gives no arrangement or rail entry.
- **S5, the `files` channel is described wrongly.** DESIGN.md:299 says the open channels carry "the reader's bookmarks and workspaces". The `files` payload is `{ root: string; bookmarks?: boolean }` (model-sessions.ts:534; published at watch/git.ts:207 and watch/bookmarks.ts:66), which is a change notice only. Failure: Axel rules on choice 8 on a wrong picture, and `apps.read.files` gets words that promise data the channel does not carry.
- **S6, the origin check is ambiguous.** DESIGN.md:276 says "the request's own origin names this machine (`allowedOrigin`)", and :278 says "`<origin>` is the request's origin". A module script or fetch from the opaque frame sends `Origin: null`, which `allowedOrigin` refuses (auth.ts:29-38). A navigation sends no Origin at all. Failure: a builder reads the Origin header, every app's module scripts get 404, and the policy says `frame-ancestors null`. The text must say the URL's origin, taken from Host.
- **S7, the `apps` channel is not ruled.** DESIGN.md:299 rules neither open nor closed for `apps`, the channel the section itself adds, which carries every approved app's key. Under :257, `reads: [apps]` gets `channel_unknown`, "a channel oculus does not have". Low.
- **S8, the approval file cannot find an app by name.** In DESIGN.md:305 the shape `{ "<kind>:<sha256>": { "label", "at" } }` has no field holding the app's name, yet "Approving an app removes its earlier entries" and `revoke { name }` both look entries up by name. Low.

## Proof
- **P1, the containment claim is contradicted.** The report says the section "does not claim containment". DESIGN.md:309 says "No network beyond the policy above: its own files and `data:` images" and "The isolation is what stops an app reaching oculus and sending requests anywhere but to its own files". WebRTC and DNS prefetch outside the policy are unverified by the report's own account. Failure: Axel approves apps believing an approved app cannot send what it reads off the machine.
- **P2, penpal errors carry more than name and message.** The report (citing dist/penpal.mjs:15-29) and DESIGN.md:297 say penpal carries only an error's name and message. penpal.mjs:15-20 also serialises `stack` and `penpalCode`, so the page's stack trace reaches the app. Low.
- **P3, the list of sentences made false is incomplete.** Missing from it:
  - registry.ts:9-14 (head comment: registration words "are catalog keys rather than words")
  - registry.ts:182-186 (the reason a removed view's tab closes)
  - config/layout.yml:24
  - HELP.md:224, :230 and :234 (the `layout.yml` description and the `local.yml` keys)
  - DESIGN.md:140 (the change record gains the app's name)
  - DESIGN.md:402 (the native window is still "undecided", while :286 treats the Electron window as given)
- **P4, the reload after a restart is misdescribed.** DESIGN.md:261 says "the load that runs again after a server restart". The load reruns only through `invalidateAll` after a 403 (+page.server.ts:26-27, writes.svelte.ts:387). New keys after a restart arrive by the socket, which takes every push after a reconnect (socket.svelte.ts:155-160). Low.
- **P5, the key handler's location is wrong.** DESIGN.md:309 says the page dispatches the forwarded key "on the workbench root, where the shell's key handler listens". The handler is on `svelte:window` (Workbench.svelte:250-251). Low.
- The report marks penpal's `timeout` as not verified. The source confirms it is a handshake timeout (penpal.mjs:334-335), so there is no defect, only an understated claim.

## Standards
- **St1.** DESIGN.md:309, last sentence: "The isolation is what stops ...; what the reader's approval of the files covers is the rest." This is a summarising flourish, and it overclaims (P1).
- **St2.** DESIGN.md:236 says "awaiting the reader's ruling". In DESIGN.md "the reader" is oculus's user; the ruling is the design owner's. One name is used for two roles.
- **St3.** DESIGN.md:247: the example `description: Lists the venues and files a note under an entry.` is not a sentence.
- **St4, user-visible shapes not among the 24 choices:**
  - the `apps` channel's name and row shape (:259)
  - the bridge's refusal words `not_declared`, `closed`, `too_large`, `rate`, `declined`, `failed:<status>` (:297)
  - "The Electron window keeps Node integration off" (:286)

  Otherwise the text is ASCII, one line per paragraph, has no history words (the "later" and "before" hits are about versions and pushes), and has no em dashes.

## The 24 choices
- **7:** the cons leave out B4.
- **8:** rests on the wrong `files` description (S5).
- **9 and 17:** rest on false premises (S1, S2).
- **14:** the shape gap (S8).
- **1:** the lazy option named (a hardcoded path) is not one of the options offered.
- **2:** calling "ignore unknown keys" the lazy option is weak, since it costs about the same as refusing them.
- The rest hold on the evidence I read.

## Behaviour
- **B2, forwarded keys are accepted at any time.** DESIGN.md:309 has the page accept `key(init)` at any moment, with no check that the frame holds focus and no rate limit. Failure: an app calls `key({key:'Escape'})` every second. While the reader types in NewIdeaForm (NewIdeaForm.svelte:35-36) or QuickAdd (QuickAdd.svelte:55-56), the form closes on the window-level Escape and the typed text is lost. `key({key:'k', metaKey:true})` opens the palette (workbench-keys.svelte.ts:93) on demand.
- **B3, the watcher.** DESIGN.md:259 has the apps watcher watch the folder holding approvals.json, which is `~/.oculus`, and reread and rehash every app on any change there. That includes changes.jsonl on every write and the session caches, with apps up to 20 MB each (not measured). A linked app folder outside `apps_dir`'s real path is not under the recursive watch, so an edit there is never seen, and the size and mtime check (:276) answers 404 until some unrelated event causes a reread.
- **B4, `frame-src 'self'` changes the Document view.** The page-wide policy (:286) also governs Document.svelte's frame (:134-141). A same-frame link to an external site in a manual stops loading, which it does today.
- **B5, size and mtime stand in for the content hash.** DESIGN.md:276 serves by comparing size and mtime. A file rewritten with its size and mtime kept (`cp -p`, `rsync -t`) is served under the old content-keyed approval until the debounced reread. Low.

## Declined to judge
These rest on browser behaviour that cannot be run here: I may not start a server or use the running one on 8787 or 8790, and no browser or CSP specification source is available locally.
- whether the parent's `frame-src` governs a child frame's own navigations
- whether the `sandbox` directive in a CSP header makes a directly visited document opaque
- whether `'self'` matches in an opaque document
- whether path-based `script-src` sources are enforced in an opaque document
- whether CSP governs WebRTC or DNS prefetch
- whether Chrome's PDF viewer loads under `frame-src 'self'`
- Electron's frame isolation (O30 is not built)

Whether coauthors' commit subjects on the `git` channel count as "another person's words" is a ruling for Axel. What I could settle from penpal 8.0.1's source (unpacked into my scratch folder, same sha1 as the builder's tarball): `allowedOrigins: ['*']` is required for an opaque child (penpal.mjs:580-583), the `source` check at :597 is the guard, and the child's default is `window.origin` (:516).

## Usage
About 45 tool calls in this session. Tokens and time were not measured from inside the session.

## Repair round 1, refuted

The run of a fresh reviewer (claude-opus-5-5) over repair round 1, saved 2026-09-30 as it reported.

### Verification lines

These were run from the E1 worktree's `tools/oculus`. `npm run diagrams` ran first and exited 0. `checks.sh` then exited 0 and printed:
```
$ npm test
 Test Files  339 passed | 19 skipped (358)
      Tests  5149 passed | 557 skipped (5706)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
Other checks:
- `LC_ALL=C grep -n '[^ -~]' DESIGN.md` printed nothing (exit 1).
- `git status --short` shows `M DESIGN.md` and `?? .scratch/migration/agents/reviews/E1-report.md`, and nothing else after the diagrams run.
- `git diff 9023d17d --stat` shows DESIGN.md only, with 79 insertions.
- The section is at 234-312, `## Relationship to the cockpit` is at 313, and the file has 402 lines.

### The 20 items

- **S1: closed.** DESIGN.md:303 closes `deck` and names the bookmarks reach.
  - `writes/deck.ts:1-4` reads "the one write that touches an engine file".
  - `writes.ts:80-87`, the comment "resolve the key `bookmarks` to that file". `writes.ts:212` sets `bookmarks: local.bookmarks ?? defaultBookmarksPath()`, and `into.bookmarks` is used at 288, 331, 345 and 359.
  - See Spec F3 for what the recommendation does with this.
- **S2: closed.** :303 says the three kinds cannot be undone, and each asks every time.
  - `undo.ts:181` reads `if (change.undo === 'none') return { error: 'nothing' }`.
  - `manifest.ts:314` is in `createIdea`, `feeds.ts:253` in `addLinkedinIdea` and `feeds.ts:306` in `markLinkedinPosted`.
  - `grep -rn "undo: '" src/lib/server/edit` counts exactly 3 `'none'`.
- **B1: closed.** :263 names the export `appRegistration`.
  - `views.ts:55` has `if (typeof module.registration !== 'function') continue;`.
  - `views.ts:31` has `registerModules` skipping a module with no `registration`, so neither path touches the app factory.
- **S4: closed.** :270 gives the rail button and the arrangement `apps` with `view: []`.
  - Confirmed against `config/layout.yml:24` and against :44, the `view: []` empty-pane rule.
  - Spec F6 has a low note.
- **S5: closed.** :299 matches the tree.
  - `model-sessions.ts:534` has `FilesPayload = { root: string; bookmarks?: boolean }`.
  - `watch/git.ts:207` has `publish('files', { root })`, and `watch/bookmarks.ts:66` has `{ root: '', bookmarks: true }`.
- **S6: closed.** :276 and :278 take the URL origin from Host. Both halves hold:
  - `auth.ts:29-38` refuses a hostname other than 127.0.0.1 or localhost.
  - adapter-node's `handler.js:17,101,208-221` uses `origin || get_origin(req.headers)`, which is Host while `ORIGIN` is unset.
  - `grep -rn ORIGIN src utils config tests package.json vite.config.ts` finds no setting.
  - Standards F9 has a low note.
- **S7: closed.** :299 opens its closed list with "Closed: `apps`, which carries every approved app's key". Standards F10 has a low note.
- **S8: closed.** :305 gives the entry `name`, and approval and `revoke` both use it.
- **P1: closed for the claim it named.** "No network beyond the policy" is gone from :309. What replaced it is a new finding (Spec F4).
- **P2: not closed.** :297 says "an error rebuilt from the name `Error` and the one-word message alone, and no stack or code of the page reaches the app".
  - A `new Error(word)` built in the page carries the page's own V8 stack.
  - penpal sends it: `createErrorReplyMessage` (penpal.mjs:88-97) calls `serializeError(error)` whenever the value is an `instanceof Error`, and `serializeError` (15-20) copies `stack`.
  - The mechanism stated does not deliver the guarantee stated. See Proof F7.
- **P3: closed.** The seven added entries are at report:156-162, and each line was checked:
  - `registry.ts:9-14` head comment and `registry.ts:182-186`.
  - `layout.yml:24`.
  - HELP.md:224, :230 and :234.
  - Base DESIGN.md:140, and DESIGN.md:402, the native window.
  - Proof F8 has a numbering note.
- **P4: closed.** :261 cites lines that all check out:
  - `+page.server.ts:26-27`, "invalidateAll() runs this load again".
  - `writes.svelte.ts:387-388`.
  - `socket.svelte.ts:155-160`, "after the first open every push is taken".
  - Proof F11 has a low note.
- **P5: closed.** :309 cites `Workbench.svelte:250-251`, which is `<svelte:window onkeydown={keyboard.keys}`. The handler's `typingIn(event.target)` treats a `window` target as not typing (workbench-keys.svelte.ts:418-424).
- **St1: not closed.** The removed flourish is back in other words at the end of :309: "so the reader's approval of the app's files is what the rest rests on".
- **St2: closed.** :236 now reads "awaiting a ruling".
- **St3: closed.** :247 now reads "It lists the venues and files a note under an entry."
- **St4: closed.** Choices 26, 27, 28 and 29 are at report:136-139.
- **Choices 1, 2 and 7: closed as asked.**
  - 1r offers the lazy option (d).
  - 2r names (d) as the lazy option.
  - 7r's cons now include the Document view.
  - 7r leaves out a better option (Spec F2).
- **B2: closed.** :309 accepts `key` only while `document.activeElement` is that app's iframe, at most 20 a second. Choice 20r matches. Standards F12 has a low note on the rate.
- **B3: closed.** :259 watches `approvals.json` by its path and each linked app folder at its real path, and never `~/.oculus` as a whole. Behaviour F13 has a low note.
- **B4: closed as disclosure.** :286 names the Document view's frame (`Document.svelte:134-141`, with `sandbox="allow-same-origin allow-scripts"` at 138), and 7r gives option (c). The regression is still recommended; see Spec F2.
- **B5: closed.** :276 and :259 record and compare size, mtime and ctime, and hash the app again when any of them differs.

### Verdicts over the whole diff since 9023d17d

### What to build
- 1, where an app lives: met (:240).
- 1, how oculus finds it while running: met (:259-272), with low notes F6 and F11.
- 1, served and isolated: partial.
  - The request rules refuse the shared files that :274 says are public (F1).
  - The approval panel opens an unapproved app's HTML same-origin (F5).
- 1, what it may read: met (:288-299). Low note F14.
- 1, how it writes: partial. The recommendation keeps the bookmarks file writable by apps and states it as a limit (F3).
- 1, approval: partial. The approval panel's file-browser control defeats "an app runs only after the reader approved it" (F5).
- 1, what an app does not get: partial.
  - It holds an open question (F4).
  - The page's stack reaches the app (F7).
  - The Document view hands an app same-origin (F5).
- 1, words: met (:311).
- 1, no plan id, date or session: met. The history test is inside `test:checks`, which passed.
- 2, Decisions taken and Still undecided unchanged: met (79 insertions, 0 deletions).
- 3, the report: partial.
  - 7r and 9r leave out the better option (F2, F3).
  - The false-sentence list mixes numberings (F8).
  - The key rate is outside choice 18 and the `apps:` keys (F12).

### Cases
- 1 to 11 and 13 to 20: met as text.
- 11: the browser behaviour is not verifiable here.
- 12: partial. The `/apps/` address is refused as the case asks. The same files are served same-origin by the file browser's Document view before approval (F5).

### Spec
- **F1, the shared files are refused by the section's own request rules.**
  - :274 says: "`/apps/-/penpal.js` ... and `/apps/-/oculus.js` ... public and served with the same headers."
  - :276 says: "A request is answered only when every one of these holds ... `<name>` matches the pattern and names an app of the held state that is approved; `<key>` equals the app's current key; ... the path is a file of the app's recorded list".
  - `-` cannot match the name pattern, which :257 relies on. The shared paths have no key and are in no app's recorded list.
  - The CSP at :278 also defines `<base>` from `<name>/<key>`, which a shared file does not have.
  - Failure scenario: a builder follows :276 literally. `/apps/-/oculus.js` answers 404, `connect` never completes, and every app draws `apps.load_failed`. Alternatively, the builder invents an unwritten exception to the only guard list the route has.
- **F2, choice 7r leaves out the option that avoids a regression.**
  - 7r and :286 say: "a link inside a manual that leaves for an outside site in the same frame stops loading, where it loads today", with "Recommend (a). Lazy: (b)."
  - The Document view already reaches into its same-origin frame: `Document.svelte:108` has `frame?.contentDocument?.addEventListener('contextmenu', inFrame)`, and :118 has `window.open(src, '_blank', 'noopener')`.
  - So a missing option (d) is feasible: send `frame-src 'self'` and have the Document view open an outbound link with `window.open`.
  - (a) states a regression of an existing view as a cost instead of designing it away. That is the spec's "a limit stated instead of a defect fixed".
  - Failure scenario: Axel rules (a), and the cathedra and game-engine manuals lose their outside links for every reader, including readers with no app.
- **F3, choice 9r keeps apps able to write the reader's bookmarks, and the bookmarks feed the Document view.**
  - :303 says: "an app allowed one of them can edit the reader's bookmarks by naming that key; the change record names the file."
  - 9r offers only "the four entry kinds closed" against "as chosen".
  - A third option costs one rule: refuse the collection key `bookmarks` for a write that carries `x-oculus-app`.
  - This matters because `openBookmark` (`views/sources/files/opening.ts:59-66`) opens an `.html` bookmark in the Document view, whose frame is `allow-same-origin allow-scripts`.
  - Failure scenario: an app allowed `entry` adds a bookmark naming an `.html` file under a served root, for example its own folder when `apps_dir` sits in the hub (choice 1r (b)). The reader opens the bookmark from the rail, and that file runs with oculus's origin, reads the token through `window.parent` and can call every `/api/` route.
- **F4, an open question inside DESIGN.md.**
  - :309 says: "Whether the policy also governs WebRTC and DNS prefetch has not been checked, so the reader's approval of the app's files is what the rest rests on."
  - The brief says "no open question inside DESIGN.md (the open choices go into the report)".
  - This is a named risk left as a statement of not knowing. The section neither rules it (for example, that approval is the only boundary against an app sending what it read off the machine, stated as the rule) nor closes it.
  - Failure scenario: once the section is ruled and built, the agreement rule makes a sentence of not knowing part of the design. The build step has no rule to build or test against.
- **F6, low: the group glyph.** `config/layout.yml:24` says: "`glyph` is the group heading's glyph name, one no view of the group carries".
  - :270 gives the `apps` group the glyph `app`.
  - :255 lets a manifest's `glyph` be any name in `glyphs.yml`, so `glyph: app` is accepted.
  - :255 also leaves the value of `apps.glyph` unstated.
  - Failure scenario: an app's entry draws the heading's glyph, which the layout rule forbids.

### Proof
- **F7, P2's fix does not remove the stack.**
  - :297 says the error is "rebuilt from the name `Error` and the one-word message alone, and no stack or code of the page reaches the app".
  - penpal.mjs:94-96 sends `serializeError(error)` for any `Error`, and :18 copies `stack: error.stack`. A freshly constructed `Error` has the page's stack.
  - Only a rejected non-Error value (sent as `{ value: error }`, :96), or an error whose `stack` was cleared, carries no stack.
  - Failure scenario: the builder writes `throw new Error('closed')`, and the app receives the page's module URLs and function names in `err.stack`.
- **F8, low: mixed line numbers in the false-sentence list.**
  - report:145 says "Line numbers are those of the file before this section".
  - report:162 cites `DESIGN.md:402`, which is the new file's number; the base line is 323.
  - Failure scenario: the build step's brief looks up base line 402, which does not exist in a 323-line file.
- **F11, low: the reloaded page data has no named consumer.**
  - :261 says the `invalidateAll` reload "replaces the rows and keys with the page data".
  - The first-frame call is in the untracked block, which does not rerun (`+page.svelte:64-69`). The token has its own `$effect(() => setToken(data.token))` at :73-75, but the section names no effect that reads `data.apps`.
  - Failure scenario: the build step follows :261, and after a 403 reload the rows from the page data are never applied, until a push arrives.

### Standards
- **St1 recurs at :309:** "so the reader's approval of the app's files is what the rest rests on". This is a summarising close in the shape the first refutation flagged.
- **F9, low: a clause attached to the wrong subject at :276.** The text reads "... and a navigation sends none, which also stops a rebound host name".
  - The rebound host name is stopped by checking the Host-derived origin. It is not stopped by a navigation sending no `Origin`.
  - Failure scenario: a reader credits the wrong mechanism, and a later edit keeps the Origin-header reading.
- **F10, low: two lists of closed names that differ.**
  - :257 lists `undo`, `rail`, `pty:<id>`, `inbox`, `calendar`, `sessions` and `usage` as refused at read.
  - The closed sets at :299 and :303 also hold `apps`, `audit-mute`, `session` and `deck`.
- **F12, low: a limit without a config key.** "at most 20 calls a second" (:309) is a literal. The other limits are keys of `apps:` in `behavior.yml`: :311 lists `connect_timeout_s`, `state_max_kb`, `writes_per_min`, `max_files` and `max_mb`.
  - spec.md says a value with a config key is read from config.
  - Choice 18 (report:114) does not list the rate.
- **Low: negation-contrast.**
  - :303 has "an engine file and not the hub's data".
  - :278 has "checked as above and never the `Origin` header".
- Otherwise the new text is ASCII and one line per paragraph, with no history words (`history.test.ts` passes inside `test:checks`) and no em dashes.

### Behaviour
- **F5, the approval panel hands an unapproved app oculus's origin.**
  - :307 says: "a control that opens the app's folder in the file browser so the reader can read the files".
  - In the file browser, one click on an `.html` row opens it in the Document view: `opening.ts:31-37` routes `kind === 'html'` to `view: 'document'`, and `file-type.ts:54` has `PAGES = ['.html', '.htm']`.
  - The Document view draws with `sandbox="allow-same-origin allow-scripts"` (`Document.svelte:138`). Its own head comment (lines 24-27) says "Same-origin means the frame is not walled off from this page's origin, so it could reach the page through window.parent".
  - Failure scenario: the reader presses the control to read an unapproved app's files and clicks `index.html`. The app's page runs same-origin before approval, reads the write token and calls any `/api/` route. That defeats :305, :309's "Not the write token ... Not the page's DOM", and case 12.
  - The section must say how the file browser and the Document view treat `apps_dir`, for example opening an app's `.html` as source text and never in the Document view.
- **F13, low: an absent approvals file.** :259 watches `approvals.json` "by its path". The section says nothing for the file being absent, which is the case until the first approval, and `fs.watch` on a missing path throws ENOENT.
  - It gives the two-second re-look only for `apps_dir`.
  - Failure scenario: the watcher fails to start on a fresh machine, or never sees an external edit to the file once it is created.
- **F14, low: the `config` channel carries the machine's host.** :299 describes it as "the configuration".
  - `ConfigPayload` (`data/model/index.ts:224-230`) also carries `host: HostInfo { name, address }`, which `portfolio.ts:329` publishes.
  - Failure scenario: Axel rules `config` open without knowing that every app with `reads: [config]` receives the machine's name and address.

### Declined to judge
No browser or server may be run here: ports 8787 and 8790 are off limits, and no browser specification source is available locally. So these are not judged:
- whether a CSP `sandbox` directive makes a directly visited document opaque;
- whether the parent's `frame-src` governs a sandboxed child's own navigations;
- whether `'self'` or path sources match in an opaque document;
- whether CSP governs WebRTC or DNS prefetch;
- whether Chrome's PDF viewer loads under `frame-src 'self'`;
- whether a synthetic `keydown` dispatched on `window` reaches every chord the handler owns;
- Electron's subframe isolation (not built).

Whether coauthors' commit subjects on `git` count as another person's words is Axel's ruling (choice 29).

### Usage
About 40 tool calls. Tokens and time were not measured from inside the session.
