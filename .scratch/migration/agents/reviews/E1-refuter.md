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
