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
