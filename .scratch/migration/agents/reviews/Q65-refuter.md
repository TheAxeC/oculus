## Verification (run from `.agents/worktrees/Q65/tools/oculus`)

- `npx vitest run --reporter=dot`: `Test Files  276 passed (276)`, `Tests  4474 passed (4474)`
- `npm run check`: `COMPLETED 1291 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0
- `npm run build`: exit 0
- `npm run format:check`: `All matched files use Prettier code style!`, exit 0
- `npm run lint`: exit 0
- The ASCII gate (the perl line from the brief): printed nothing, exit 0
- `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0. `wc -l`: `885 src/lib/state/sources/fs.svelte.ts`, `536 src/lib/views/sources/files/Files.svelte`
- `npm run build`, then the whole browser suite `npx playwright test` (8792 was free: `lsof -iTCP:8792 -sTCP:LISTEN` printed nothing): `306 passed (8.4m)`
- `node bin/revert-check.mjs` over the 14 node test files this step changes or adds: `49 reverts, 0 unproven, 248 unchecked`
- `node bin/revert-check.mjs` over the 13 browser specs this step changes or adds: `45 reverts, 0 unproven, 80 unchecked`. All 10 cases in kept-tabs.spec.ts and session-tabs.spec.ts, and the 4 new cases in files-sections.spec.ts and source.spec.ts, are red under their reverts.
- `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before, 7015 after
- Extra probe for item 3: a scratch copy of the engine, started through its own `npm run dev` (which is now `vite dev --force`):
  - Style module requested first: `style first: 200 raw= true ... len= 1307`
  - The same request after the component was requested: `style after component: 200 raw= true ... len= 1307`
  - A fresh server, component requested first: `component first, then style: 200 raw= false ... len= 944`
- Extra probe for item 4, a scratch Playwright spec run against the worktree's build (`[role=alertdialog]` is a confirm dialog):
  - Confirm left open, then Ctrl+1: `alertdialog in DOM 1 visible false`
  - Then Ctrl+]: `selected tab after Ctrl+] [ ' Page 1  ', 'Status' ] before [ ' Page 1  ', 'Status' ]`, so the tab did not move
  - Control case with no confirm open: Ctrl+] moved the tab from Files to Status

## Spec

- **Item 3 does not meet the scope Axel ruled.** His ruling (answer 3, and the Q65 line "3 (the diagnosis)") asks for three things. None is met:
  - **Diagnosis in Chrome.** The page kept open in Chrome with the console captured until it blanks. Not done: the report tried fresh servers and restarted servers, not a capture on the long-running server until the blank happens.
  - **The cause fixed.** Not fixed. The only failure reproduced is a style module requested before its component. With the step's fix in place, `npm run dev` still serves the raw `.svelte` text for that request (probe: `raw= true len= 1307`). The raw text keeps being served after the component is compiled (`style after component: ... raw= true`). The cause is `node_modules/@sveltejs/vite-plugin-svelte/src/plugins/load-compiled-css.js:43-75`: the plugin reads the CSS from the compiled component's module info, finds none, logs `failed to load virtual css module`, and returns nothing, so vite serves the raw file and caches it.
  - **A check that fails while it recurs.** Not built. `tests/server/core/dev-server.test.ts` requests the component first ("The layout module is asked for before its style module"), which is the one order that does not fail. It is named an audit.
  - **What would meet the scope:**
    - A case that requests the style module first, which is red on this tree. It should cover the SSR path SvelteKit uses for the page's inline `<style>` as well as the client path.
    - A fix that turns that case green. For example, a plugin in `vite.config.ts` whose `load` for `?svelte&type=style` first loads the parent component (`this.load({ id: filename })`), or a plugin version that does the same.
    - The Chrome capture on the live server.
  - The brief already narrowed the ruling to `--force` plus an audit test. That narrowing is itself a departure from the ruling.
- **A premise in the brief is not reproduced.** Brief line 12 says a server started with `vite dev --force` "served compiled CSS". Under the style-first order it does not: the probe served the raw file at exactly the 1,307 characters the brief measured on the broken page. `--force` made no difference to the one failure that reproduces.
- **Item 7, `src/lib/views/sessions/*`.** "Every open of Transcript and of Session names its session" holds for:
  - `SessionList.svelte:102` and `:106`
  - `SessionDetail.svelte:182`
  - `CardSessions.svelte:59`

  A rail or palette open of Transcript or Session still carries no state and shares one tab. The report states this for Terminal only (judgment call 3), not for Transcript and Session.
- **Widened paths.**
  - Justified: `shell/keys/key-dom.ts`, `QuickAdd.svelte`, `NewIdeaForm.svelte` (hidden views must not take keys), `CardSessions.svelte` (item 7), the four comment files, the test helpers.
  - The allow-list edits are covered under Proof.
  - Two places the widening needed to reach and did not: `src/lib/shell/keys/workbench-keys.svelte.ts:69` and `:124` (see Behaviour), and `src/lib/state/forms/form-drafts.svelte.ts:245` (see Standards).
- **The Files toggles' wire shape** is `hidden=1` / `ignored=1` as ruled (`fs-transport.ts:101-102`, `fs.ts` `shownOf`). No substitute mechanism.

## Proof

- **`tests/views/system/usage.test.ts`, "renders the refreshing refresher state while a refresh runs, and only then".** A new case with no revert directive, not named an audit (revert-check prints it `unchecked`). It asserts an absence, `expect(healthy).not.toContain('refreshing')`.
- **`tests/views/sources/source.test.ts`, "draws the highlight mirror and the editable textarea, and no control row of its own".** Changed by this step, `unchecked`, not named an audit. It is a node string render asserting that something is absent.
- **`tests/server/core/dev-server.test.ts`.**
  - `expect(css).toContain('scrollbar-width')` does not tell raw from compiled: the raw 1,307-character answer contains `scrollbar-width` too (probe: `raw= true scrollbar-width= true`). Only the `<script` check separates them.
  - Because the case requests the component first, it cannot fail on the reproduced defect.
- **Tab-switch cases whose premise the step removed.** These cases were written to show that state survives the component being destroyed on a switch. The component is no longer destroyed, so a draft or form state held only in component state would now pass them too. The step changed `toHaveCount(0)` to `toBeHidden()` and left the cases otherwise as they were. The cases that switch tabs and never reload:
  - `files-forms.spec.ts`:
    - "the root form is open with its typed folder after a tab switch"
    - "a refused root comes back with its form and its refusal after a tab switch"
    - "the bookmark form's outcome line comes back after a tab switch"
    - "a root added while the tab is switched away..."
    - "a bookmark added while the tab is switched away..."
  - `unsaved-forms.spec.ts`:
    - "text typed into a card's edit form is there, in the open form, after a tab switch"
    - "an edit typed into the manifest editor is there after a tab switch"
    - "an add form whose tab was switched away before its answer still writes the entry it added"
    - "the Venues add form is kept across a tab switch..."
  - `source.spec.ts`: "...an unsaved edit survives a tab switch"
  - `helpers/forms.ts` `switchAndBack`

  Most of their reverts are prose "Revert:" lines, which revert-check does not run. That these reverts would now stay green is from reading the code, not from a run. They need a reload or a tab close in place of the switch to prove what their names claim.
- **Allow lists (each checked).**
  - The three `d731d44fc2e5` entries are removed correctly: the shared head is now `sections/Section.svelte`.
  - The re-recorded `33b85f55f7fb` entry is the same pair and the same 8 closing lines (`Bookmarks.svelte:114-121`, `Notes.svelte:110-117`), with `</TreeSection>` now `</Section>`.
  - The 3 `allow-negatives.ts` removals only tighten the list.
  - The directive at `duplication.test.ts:266` (`:122`) points at the line that was `:125` at base.
  - None of these is a finding.
- **Report counts that do not reproduce.**
  - Judgment call 9 says `fs.svelte.ts` is "now 883" lines. `wc -l` gives 885.
  - The report says the whole browser suite was not run over the final tree. It passes: 306 passed.
- **Overlap with O31:** only `tests/checks/tree/allow-duplication.txt` and `tests/checks/tree/duplication.test.ts` (an intersection of both worktrees' changed paths). No other shared path.

## Standards

- **`src/lib/state/forms/form-drafts.svelte.ts:245-246`, false now:** "the component that drew the form is gone the moment its tab is switched, and the request is not." The step rewrote this file's head comment and left this one.
- **`DESIGN.md:114`.** The design says the Git read-only forms sit in one module, with "one subprocess call site", and a test holds them to exact vectors. `src/lib/server/files/fs/ignored.ts:45` adds a tenth read-only form, `spawn('git', ['-C', dir, 'check-ignore', '--stdin', '-z'])`, outside `server/git/`. The module's vector test does not cover it. The report proposes amending the design sentence ("Doc text"). Following the design would route the form through `server/git/git.ts`'s call site and its test.
- **`src/lib/server/files/fs/ignored.ts:14-15`:** a comment hard-wrapped short mid-paragraph ("already tracks. The run is given a list argument, never a shell" / "string").
- ASCII, size and folder limits: none.

## Behaviour

- **A confirm left open in a hidden tab blocks the workbench keys (measured).**
  - `workbench-keys.svelte.ts:69` and `:124` read `document.querySelector('[role="alertdialog"]')` over the whole document.
  - Ctrl+digit switches tabs before that gate (`keys.ts:92-94`). A `Confirm` open in a Files tab therefore stays in the DOM, hidden, after Ctrl+1.
  - While it stays, every held key is dead in every pane: Ctrl+] did not cycle (probe above), and the control case with no confirm open did cycle.
  - Before the change the tab switch unmounted the view and its confirm. This is inferred from base `PaneView.svelte:353`; the probe was not run on a base build.
  - Every view with a `Confirm` is exposed: Files, Notes, EntryForm, Changes, Repositories, Deposit, Jobs, Gallery, InboxCard, LeadCard.
- **Map labels (from reading, not run).** `src/lib/views/structure/map/Graph.svelte:119-124` measures label boxes on a node or text-size change with no ResizeObserver. In a hidden Map tab those boxes read as 0, and "an unmeasured label ... overlaps nothing", so labels may draw overlapped when the tab is shown again.
- **Cost of hidden views, not measured beyond memory.**
  - A hidden Transcript keeps following its session.
  - A hidden Terminal keeps its pty stream.
  - A hidden Files tab re-reads its expanded folders on each round, and every default listing now spawns one `git check-ignore` per folder.
  - The report gives heap, DOM and listener counts only (I did not re-measure them). CPU and network are not stated.
- **Reader-visible changes the "before and after" section leaves out:**
  - Starting a terminal no longer moves the rail's selection. It was `select(answer.id)`, and is now `restateInstance(owner, { session, label })` at `Terminal.svelte:224`. This is in judgment call 3 only.
  - The stale refresher line now reads `ok, figures fetched at ...` where it read `running, figures fetched at ...` (`usage.yml`). This is in judgment call 5 only.
  - The Files removal confirm (`removing`) and any other open confirm or form now survive a tab switch.
- **Refresher line (from reading).** A healthy line's `next` is `lastRefresh + usage_refresh_min` with no clamp against the current time. A refresher still healthy but late shows a `next` time in the past (`Usage.svelte:171-178`). Not run.

## Not checked

- The memory measurement of item 4 (not re-measured).
- A look on the TEST page in Axel's Chrome.
- The Confirm probe against a build of the base tree.
- The Map label case in a browser.
- Whether the style-first order is what the live 8790 server hit.
- `DESIGN.md` and `HELP.md` "Doc text" lines beyond `DESIGN.md:114`.

My runs also wrote `vitest.txt` into the shared scratchpad's root before I moved my outputs to `scratchpad/q65-refute/`. That folder also holds the two probes (`devprobe.mjs`, `probe/`).

## Usage

About 190k tokens of context and about 60 tool calls.

# Repair round 1, refuted

## Verification (run from the worktree's `tools/oculus`)

- `npx vitest run --reporter=dot`: `Test Files  276 passed (276)`, `Tests  4475 passed (4475)`, exit 0
- `npm run check`: `COMPLETED 1291 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0
- `npm run build`: exit 0
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- ASCII gate (the perl line): printed nothing, exit 0
- `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0
- `npm run build`, then `npx playwright test` (8792 was free: `lsof -iTCP:8792 -sTCP:LISTEN` printed nothing): `308 passed (6.8m)`, exit 0. The one printed failure is `files-forms.spec.ts:633`, which carries `test.fail()` at `:636` and carried it at base (`:635`).
- `node bin/revert-check.mjs` over the 8 node files this round changes (dev-server, ignored, server fs, git, workbench-keys, usage, source, type-scale): `20 reverts, 0 unproven, 123 unchecked`. Both dev-server cases are red under `vite.config.ts:15`. `git.ts:145` and `:217` are red. Every new usage and source case is red.
- `node bin/revert-check.mjs` over kept-tabs, files-forms, unsaved-forms, source.spec and map.spec: `37 reverts, 0 unproven, 22 unchecked`. Every case this round changed is red under its directive, including the hidden-confirm case (`workbench-keys.svelte.ts:239`), the hidden-Map case (`labels.ts:81`) and the seven reload cases (`ui.svelte.ts:252`).
- `npx vitest run tests/server/git/git.test.ts -t "audits that nothing"`: `AssertionError: expected 0 to be greater than 0`, `1 failed | 39 skipped`. The same with `-t "ran every command without optional locks"` gives the same failure.
- `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before, 7015 after
- Paths changed both by this step and by main since `fbe3c308` (`git diff fbe3c308 main --name-only`, intersected with this step's changed and untracked paths):
  - `tests/checks/tree/allow-duplication.txt`
  - `tests/checks/tree/duplication.test.ts`

  The directive at `duplication.test.ts:266` was `allow-duplication.txt:125` at base. This step makes it `:122` (three entries out) and main makes it `:124` (one entry out), so after the merge it must read `:121`. The doc text's line numbers have also moved on main: `DESIGN.md:114` is now `:115` and `HELP.md:191` is now `:193`.

## Spec

- Checked, no finding: `src/lib/server/core/style-first.ts`.
  - **No request loop (from reading).** The Svelte plugin's load for a style id awaits `transformRequest(component)`. On the client, the component's import analysis pre-transforms its style import, but the component transform does not await that pre-transform. Vite also hands back the pending request for a URL already in flight. So nothing waits on itself, and the red-then-green client case shows the server answers.
  - **Both environments are covered.** The client path and the SSR path each have a case, and both are red under `vite.config.ts:15 => delete`. The SSR probe's id `?inline&svelte&type=style&lang.css` is the one SvelteKit builds (`node_modules/@sveltejs/kit/src/exports/vite/dev/index.js:245-249`).
  - **Build.** `BuildEnvironment` declares no `transformRequest` (`node_modules/vite/dist/node/index.d.ts`), so `load` returns null there. Preview runs no `load`.

## Proof

- **`tests/server/git/git.test.ts:750`, "audits that nothing but those commands ran over this whole file, the pinned five as their vectors".**
  - **Why it fails alone.** It asserts over `ran`, which the `vi.mock` of `node:child_process` (`:143-173`) fills only while earlier cases in the file call the module. Under `-t` those cases are skipped, `ran` is empty, and `expect(ran.length).toBeGreaterThan(0)` fails.
  - **The whole-file run.** There it holds for the right reason: `used` must equal `ALLOWED`, which now includes `check-ignore`, and the new case at `:698` runs `ignoredIn`.
  - **The rename closes nothing.** Renaming the case to an audit relabels a gate that a revert does turn red in a whole-file run. It also leaves the prose `Revert:` lines above it (`:742-744`) in contradiction with the new comment below them: "no run of it alone can prove a revert".
  - **What would make it hold alone.** The case, or a `beforeAll` in its `describe`, drives every read of the module itself over a fixture repository: `statusFor`, the log, branch and worktree reads, and `ignoredIn`. It then checks the vectors that run recorded. With that, `// revert: src/lib/server/git/git.ts:217 => const unborn = run(root, ['symbolic-ref', 'HEAD'], timeout);` turns it red alone, and it carries a directive rather than the audit name.
  - **The same defect, not changed this round.** "ran every command without optional locks, so a read writes no index lock" (`:736`) fails alone the same way (run above).

## Standards

- **`src/lib/server/files/fs.ts:14-15`, a false sentence in a head comment.** The comment says:

  ```
  // nobody reads; every entry git ignores is left out unless it carries `ignored=1`, read by
  // server/git/git.ts's ignoredIn, the one module that runs git.
  ```

  Three other modules run git: `src/lib/server/git/git-write.ts:79`, `src/lib/server/git/deposit-git.ts:137` and `src/lib/server/git/git-message.ts:86` each call `execFile` on git. `git.ts` is the one module of read-only git forms.

## Behaviour

- **The synchronous `check-ignore` in the listing path (from reading; not measured by me, since this brief allowed me no git command beyond `diff` and `status`).**
  - **How it runs.** `listShown` (`fs.ts:307-320`) calls `ignoredIn` (`git.ts:137-149`), which runs `spawnSync` through `run()` (`git.ts:404`) on the server's event loop. That is one run per listed folder per request.
  - **How often.** The builder measured that a hidden Files tab re-reads every open folder on every write that moves the store's round. A write therefore costs (open folders) x (Files tabs ever shown) git processes, run back to back. While each one runs, the whole server stops: HTTP, the socket and the watchers.
  - **The worst case.** On a mount where git hangs, each run waits the full 5 s, so one write stalls the server for N x T x 5 s.
  - **Against DESIGN.md.** `DESIGN.md:114` accepts one call site with a five-second timeout. The git reads it describes run from the watcher, which re-reads a root "no more often than every two seconds" (`src/lib/server/watch/git.ts:2-4`). The listing path has no such throttle and grows with tabs, hidden ones included.
  - **The report's wording.** "The same as the other git reads" in the report is therefore not accurate.
  - **What would close it.** A hidden Files tab defers its re-read until it is shown, and ignored names are kept per folder until that folder's watch fires, or both. A measurement of the event-loop stall under many folders and several tabs would show the size.
- **Ruling 9 is partly open: a running Terminal in a hidden tab is not measured.**
  - **Not a defect in the tree.** The served layer puts a failing `tmux` on PATH on purpose (`tests/browser/helpers/serve.ts:179-199`: "browser layer: this run has no tmux"). This step changes nothing under `src/lib/server/machine` (`git diff fbe3c308 --stat -- src/lib/server/machine` prints nothing). The 400 the builder saw is raised by the unchanged `startTerminal` check (`src/lib/server/machine/pty/sessions.ts:312-315`) and points to the builder's scratch tmux setup.
  - **The measurement can still be taken.** It can be run on a development server in an engine copy with a real tmux, as `tests/server/core/dev-server.test.ts` builds one. From reading `Terminal.svelte:273-289`, a hidden Terminal keeps `subscribePty` writing to xterm, and its ResizeObserver still fires `resized()` when the tab hides.
- **A confirm shown again after a switch (from reading, not run).**
  - `Confirm.svelte:39-41` focuses Yes only when the dialog mounts, and handles Escape only from the `.ground` it wraps (`:48-53`, `:74`).
  - A confirm left open in a hidden tab keeps no focus. When its tab is shown again, `dialogShown()` holds the workbench keys, but Escape reaches the dialog only after the reader clicks into it.
  - Before this step the switch unmounted the confirm, so this state did not exist. The report's before-and-after (item 10) names the confirm surviving a switch, but not its focus.
- Checked, no finding: `onShown` (`labels.ts:73-86`) with `Graph.svelte:129-130`, and the round's before-and-after lines for the terminal start and the stale refresher.

## Not checked

- The event-loop stall of `check-ignore` under many folders and tabs. I ran no git command beyond `diff` and `status`.
- The confirm-focus case in a browser.
- A look on the TEST page in Axel's Chrome.
- The builder's item 9 table (not re-measured).
- Whether the merged `allow-duplication.txt` still matches every entry naming `SessionDetail.svelte` and `Agents.svelte`. Main (O31) moved `Agents.svelte`, and this step moved `SessionDetail.svelte`; each side passes alone.

## Usage

About 115k tokens of context and about 45 tool calls.

## Closed

The first run's findings, closed in repair round 1 (`agents/reviews/Q65-report.md`, "# Repair round 1") unless named otherwise:

- Spec, item 3 short of the ruled scope, and the brief's premise about `vite dev --force`: `src/lib/server/core/style-first.ts` serves a component's stylesheet compiled whichever the page asks for first; two cases in `tests/server/core/dev-server.test.ts` (client and SSR) are red under `vite.config.ts:15 => delete`, and `--force` is dropped.
- Spec, item 7, every in-view open of Transcript and Session naming its session: stated with the rail and palette opens in the round's item 11.
- Spec, the widened paths: each needed once views stay mounted; listed in the report's judgment calls.
- Proof, the two cases with no directive (`usage.test.ts`, `source.test.ts`): each carries a directive and is red under it.
- Proof, the dev-server cases: rewritten under item 1.
- Proof, the tab-switch cases whose premise the step removed: cases that claim state lives in the instance now reload, red under `ui.svelte.ts:252 => delete`; cases whose claim is the switch keep it, each red under its own directive.
- Proof, the report counts: re-run in the round and at landing.
- Standards, `form-drafts.svelte.ts:245-246`: rewritten.
- Standards, `DESIGN.md:114`, a tenth git form outside the git module: `check-ignore --stdin -z` runs through `server/git/git.ts`'s one call site, pinned in `git.test.ts`; the Doc text at landing names the form.
- Standards, the hard-wrapped comment in `fs/ignored.ts`: the file is gone.
- Behaviour, a confirm in a hidden tab blocking the workbench keys: `dialogShown()` counts only a confirm outside a hidden tab; the case is red under `workbench-keys.svelte.ts:239`.
- Behaviour, Map labels measured while hidden: measured again when the drawing comes back to a size; the case is red under its revert (now `src/lib/ui/shown.ts:14`).
- Behaviour, the cost of hidden views: measured in the round's item 9; whether a hidden tab should pause its work is the open item in `orchestrator-state.md`.
- Behaviour, the reader-visible changes and the refresher line: stated with before and after in the round's item 10.

The run over repair round 1, closed at landing on 2026-09-23:

- Proof, the two gates of `tests/server/git/git.test.ts` that failed alone: both call `everyRead()`, which runs the status of a repository with an upstream and of one with no commit yet and the ignored names of a folder, so each holds alone (`npx vitest run tests/server/git/git.test.ts -t "optional locks|nothing but those"`: 2 passed). The whole-file gate is renamed "ran nothing but those commands over this file, the pinned five as their vectors" and carries directives in place of the audit name: red under `git.ts:217` and `git.ts:243`; the lock gate is red under `git.ts:402`. `node bin/revert-check.mjs tests/server/git/git.test.ts`: 6 reverts, 0 unproven. The contradicting prose is removed.
- Standards, `src/lib/server/files/fs.ts:14-15`: the head comment now says `server/git/git.ts` is the module of the read-only git forms this server runs.
- Behaviour, the synchronous `check-ignore` in the listing path: `cachedIgnored` (`src/lib/server/files/fs.ts`) answers a folder listed again with the same entries within two seconds from the answer before, held in the server context, so the runs no longer grow with the number of Files tabs; the case "asks once for one folder listed twice in a moment..." in `tests/server/files/ignored.test.ts` is red under `fs.ts:136 => delete`. One run over the hub measured a mean of 8.7 ms and a maximum of 12.9 ms. A git that hangs waits the module's five-second timeout, as every read of that module does under `DESIGN.md`'s "Git". Whether a hidden tab pauses its work is the open item in `orchestrator-state.md`.
- Behaviour, a running Terminal in a hidden tab not measured: the served layer has no tmux by design; the open item on hidden tabs names it as not measured.
- Behaviour, a confirm shown again after a switch: `Confirm.svelte` focuses its confirm again when the dialog comes back to a size (`onShown`, moved to `src/lib/ui/shown.ts` so a primitive can use it); the case "a confirm left open in a hidden tab takes the keyboard again when its tab shows" in `tests/browser/workbench/kept-tabs.spec.ts` presses Escape after the switch back and is red under `Confirm.svelte:48 => delete`. `node bin/revert-check.mjs` over kept-tabs and map specs: 9 reverts, 0 unproven.
- The merge with main (`allow-duplication.txt`, the directive at `duplication.test.ts:266`, the Doc text line numbers): done at landing.
