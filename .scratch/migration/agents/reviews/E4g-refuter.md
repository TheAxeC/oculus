E4g review. Verdict: the step is not ready to land as it stands. Brief item 1 (the guide) is violated in parts: some of its statements are not borne out by the code, three code defects are written up as if they were intended behaviour, and the report wrongly opens with "Everything in the brief is done". Brief items 2 to 5 hold. Both runs were redone: `npm run test:quick` and my own scratch oculus on port 8823. The scratch oculus is stopped: `lsof` on 8823 and 9333 prints nothing, and `git status --short` in the worktree matches what the builder left.

**Open items** (state file `orchestrator-state.md:203`): the list is empty. Read in the worktree, the report quoted it at `:130`.

## Verdict per item of "What to build"

1. `docs/apps.md`, the guide: **violated in part.**
   - Parts 1 to 5, 7 and 8 hold, apart from the findings under Behaviour.
   - Part 6 is short of the brief. The brief asks for each channel's payload "the fields an app uses, each with its type". Lines 190-202 give top-level key names with no types. The report admits it under its "Anything wrong" item 7: "not verified".
   - Part 9 holds, apart from the policy sentence at line 348 (see Behaviour).
   - Part 10 holds as files, but step 9 leaves a test entry in the reader's real hub (see Behaviour).
   - Part 11 is short of the brief. "How to read a refusal in the browser console" is not explained: line 603 only says errors go to the frame's console.
2. HELP.md Apps sentence (`HELP.md:220`): holds.
3. `docs:` entry (`config/layout.yml:176`): holds. It parses, and the Views catalogue showed "Apps guide h7" in my scratch run.
4. Help page tab: holds. The pane now ends with `... label: "Apps guide" } }, memories]`. The change to the arrangement is judged below.
5. Lines the entry made false: holds.
   - `HELP.md:21` names the Apps guide.
   - `HELP.md:82` and `config/text/app.yml:12` say `h1-h7`. My run showed the catalogue's Help group going up to h7.
   - `DESIGN.md:79` has the tree line.

**The `config/layout.yml` Help arrangement change** (`:93`, beyond the brief's "line 98"): justified, and it should stay.
- On the base, the arrangement was a `split` with one child and `sizes: [0.6, 0.4]`.
- `readSplit` reports "a split holds 1 children, two is the least" and a sizes/children count mismatch (`src/lib/state/workbench/layout/saved/saved.ts:241-243`, `:255-256`).
- `parseArrangement` therefore returns null (`src/lib/state/workbench/navigation/arrangement.ts:79-83`), and `railPageViews` falls back to `[]` (`pages.ts:221-222`).
- So on main the Help page could not be built from its arrangement, and the brief's tab could not show without this fix. The builder's "Help button opened nothing" before-state was not re-run by me.
- One pane rather than a restored two-pane split is a user-visible shape the brief does not name. The builder reported it, so it is the orchestrator's to reverse. I recommend keeping one pane, since nothing names what a second pane held.
- No test parses the shipped arrangements (`grep -rn parseArrangement tests` prints nothing). That is how a broken arrangement passed `tests/checks/config` on the base. A check for this needs Axel's approval of a guarded entry.

## Verdict per case

1. **Met.** The `KEYS`, `TITLE_MAX`, `DESCRIPTION_MAX`, `DEFAULT_ENTRY` and `BRIDGE` values in `manifest.ts:23-46` match the table at guide lines 94-104.
2. **Met, with one exception.** All nine methods and three handlers have entries. `getState` is listed with refusals "none", while line 181 documents a rejection; see Spec.
3. **Partial.**
   - Every `REFUSED` word, `not_json`, `refused:` and `failed:` is in the table.
   - The server's reasons are a self-declared subset (line 292, "Reasons the example ... and the hub's collections give"). Missing from it are the store reasons `unwritable`, `outside`, `too_large` and `readback` (`app-store.ts:55,60,80`, `writes.ts:616`) and the feed/LinkedIn 404 sentences (`writes.ts:489-524`).
   - Line 290's `failed:<status>` row omits `setStore`, which the method table at line 171 lists.
4. **Met.** Nine keys and defaults match `config/behavior.yml:202-222`.
5. **Met.** Locations match `watch/apps.ts:92-97` and `store.ts:23-30`.
6. **Met.** Approval, Keep approved, `app.yml` change and Revoke match DESIGN.md "Approval" / "Keeping" and `ApprovalPanel.svelte:85-91`.
7. **Met.** The `{ file }` order at lines 259-264 matches `methods.ts:313-331` and `open.ts:96-131`.
8. **Met.** The body table matches `bodies.ts:151-274`. `CONFIRMED_WRITES` and `undo: 'none'` are both covered.
9. **Met, by reading and by my server run; the builder's scan script was not rerun.**
   - Running the builder's `bin/scan.ts` was refused by the permission classifier ("Code from External"), so its `findings: []` output is not reproduced by me.
   - The guide's fenced blocks equal the builder's example files byte for byte (my python block extraction).
   - My scratch oculus, built from files I extracted from the guide itself, offered both apps (catalogue "APPS Hello v1 Task demo v2"), which happens only with no refusing finding.
   - Method arguments, channels, kinds, bodies against `newEntryShape`/`deleteEntryShape`, listed views, absence of inline script and modal calls, and file extensions all hold by reading.
10. **Met.**
    - `npm run test:quick`: "every command passed". It was over its time limit at 155.3 s; the machine is loaded.
    - `npx vitest run tests/checks/config`: "Test Files 3 passed (3)", "Tests 59 passed (59)".
11. **Partial.** Several statements are not borne out by the code; see Behaviour.
12. **Met.**
    - `LC_ALL=C grep -n '[^ -~]' docs/apps.md` prints nothing (exit 1).
    - The dash/ellipsis grep hits only lines 482 and 502 (JS spread inside code).
    - The history-word grep hits only ordering uses of "before" (lines 40, 150, 180, 183, 268, 591) and "now" (line 86).
    - No hard wraps (awk check).
13. **Met, in my own scratch run.** This was HOME, hub, apps folder and engine under my scratchpad on port 8823, plus headless Chrome with a fresh profile driven over CDP.
    - The panel text is as in step 1, except for the store path (see Behaviour).
    - The app reads "2 entries in tasks; an entry is named by its title."
    - The store file holds `{"notes":["first note"]}`.
    - `changes.jsonl` has `app-store` 0 to 24, then `new-entry`, then `delete-entry`, with the tasks file byte-equal to the original afterwards.
    - The URL question shows `https://example.org/`.
    - The refusals list holds `open view: missing`, `open file: closed`, `read inbox: not_declared` and `open url: declined`.
    - History shows "entry removed / Undo", "entry added / Undo" and "app store ... Before 0 bytes After 24 bytes". Undo on "entry removed" said "Task demo 1791281117385 / entries is back." and the task was back in tasks.yml.
    - The delete-Cancel `declined` was not captured cleanly by my timing; the builder's saved log shows it.
14. **Met.** The catalogue's h7 comes from my run. The Help page tab list is from the builder's saved `first/case14.txt`. The text lines were checked by reading.

## Findings

### Spec
1. **The guide writes three code defects up as intended behaviour, so it turns false the day they are fixed.**
   - (a) `docs/apps.md:181`, "A list or map saved with `setState` is accepted, and reading it back with `getState` rejects with a `DataCloneError`", and the row at `:597`. Cause: `apps.svelte.ts:286`, `getState: () => appTab(deps.ui.instanceState(options.instance)).value`, returns a `$state` proxy without the `$state.snapshot` that `held` uses at `:280`.
   - (b) `:576` quotes the defective question text "...asking you first.:". The cause is `apps.write.*` ending in a period and being fed into `confirm_write: 'The app {0} asks to {1}: {2}'`, giving "asks to Delete ...", with a capital D, and ".:".
   - (c) `:252`, "`terminal` is listed, so it opens a Terminal tab", while DESIGN.md says `terminal` rejects `closed`. The code agrees with the guide, since `Terminal.svelte:4-10` has no `listed: false`.
   - (d) `:268` and step 8 order the example around a question drawn in a hidden tab.
   - Each should be fixed in code, at landing or as a booked step, and the guide reworded. As written, the guide is a stated limit instead of a fixed defect.
2. **The report's first line, "Everything in the brief is done", is false.** The brief's item 1.6 payload types are not given. The report's own item 7 says the payload tables were "not verified".

### Proof
1. **The case 13 log is quoted selectively.** The builder's `first/example-run9.txt` prints "## history rows []" and "## history undo controls []", which the report leaves out, while guide steps 3 and 9 claim History rows. My run shows those rows do exist, so the omission did not hide a defect. It still left the History claims unproved in the report.
2. **Verify item 4 asks for the runs of cases 9 and 13 "quoted whole".** Case 9 is given as a summary line, and case 13 as "Quoted lines". The case 14 outputs (`"h2":11`, the catalogue text) went to stdout and are in no saved file (`grep -rl '"h2":11'` over the builder's scratch prints nothing).
3. **Verify item 5 is not done per sentence.** It asks that each place departing from the sentence and list-item rules be named; judgment call 5 is one general paragraph.
4. **The history-word grep was incomplete.** The report says "used to", "previously" and "as before" were "not verified". My `grep -n -i -w -E` over all the words of `spec.md` shows none, so the outcome is clean.

### Standards
1. `docs/apps.md:295`: "`no collection nonesuch`" is a literal where a placeholder is meant. It should be `no collection <name>`, as the other reasons on that line are written.
2. `docs/apps.md:11`: "A machine app ... may be offered every channel" contradicts `:204`, which says no app can read `apps`, `processes` or `pty:`.

### Behaviour
1. **`docs/apps.md:124`: "Open the app's folder | Shows the folder in the Files view".**
   - `showFolder` (`apps.svelte.ts:406-411`) posts a notice when no served root holds the folder.
   - My run, pressing it for a machine app outside the roots, showed: "The folder of this app, <R>/apps/task-demo, is inside no root the file browser shows."
   - With the default `~/.oculus/apps`, this is what Axel gets.
2. **`docs/apps.md:580`, step 9: "Undo on `entry removed` puts the task back in the file".**
   - Read as a step, this leaves "Task demo <n>" in Axel's real `tasks/tasks.yml`. My run: after Undo, `grep -c "Task demo"` printed 1.
   - That breaks Decision 3 ("leaves the hub's data as it found it"). The step should describe the rows and not invite the Undo, or tell him to delete again after it.
3. **`docs/apps.md:179`: "a class instance ... give `not_json`".**
   - Values cross the bridge by postMessage structured clone, which drops a plain object's prototype. A class instance therefore arrives as a plain object and passes `plainJson`.
   - This is from reading the structured-clone rule; it was not run.
4. **`docs/apps.md:157`: `onTheme` is "when the theme or the wallpaper setting changes".**
   - `AppFrame.svelte:104-114` also fires it on the CRT overlay and text-size changes.
   - The effect also reruns, sending the unchanged theme, when the view is drawn again.
5. **`docs/apps.md:348`: "Load anything from an address outside the app's own folder except `data:` images, the shared bridge files and the origins in `connects`. Scripts, styles, images, fonts, media and fetches are all covered."**
   - This reads as if images or scripts may come from a `connects` origin. `appPolicy` (`address.ts:93-98`) puts `connects` in `connect-src` only; `img-src` is `<base> data:` and `script-src` is `<base> <shared>`.
   - Failure: an `<img src>` from an origin in `connects` is blocked.
6. **`docs/apps.md:592`: "The page shows its first text and never changes | an inline `<script>` does not run".**
   - An app whose script is all inline never calls `connect`. After `connect_timeout_s` the tab replaces the page with "The app did not answer in time." (`AppFrame.svelte:209-214`). The row describes a symptom that only a mixed app shows, and it contradicts the row at `:591`.
7. **`docs/apps.md:572`: the panel line is quoted as "Keep its own data in ~/.oculus/app-data/task-demo.json."** The panel prints the absolute `row.storeFile`; my run showed `<R>/home/.oculus/app-data/task-demo.json`.
8. **`docs/apps.md:132`** names `~/.oculus/approvals.json` without the `approvals` key that moves it (DESIGN.md "Approval"). This is minor.
9. **`docs/apps.md:199`**, the inbox row, omits `snippet`, the provider's message preview text (`model-mail.ts:97-100`). That is message content an approving reader should know a machine app receives.

## Declined to judge
- The builder's own case 9 scan script: running it was refused by the permission classifier. I did not work around it; case 9 is judged by reading and by my server run.
- "The Help rail button opened nothing on a fresh profile" before the change: judged from the parsing code only, not run on the base.
- Whether append-then-delete leaves Axel's real `tasks/tasks.yml` byte-identical (the guide's "the file is as it was"): verified only on a scratch fixture, never on the real file.
- `DESIGN.md:83`, "every group has a chord", is false for the `apps` group. That sentence predates this step and is outside its write list; it is noted for the orchestrator.
- The `getState` `DataCloneError` itself was not re-run by me. It rests on the builder's run and on reading `apps.svelte.ts:286` against `:280`.

## Files
- Worktree: `/Users/axelfaes/workspace/research-hub/.agents/worktrees/E4g/tools/oculus/docs/apps.md`, `HELP.md`, `DESIGN.md`, `config/layout.yml`, `config/text/app.yml`
- Report: `/Users/axelfaes/workspace/research-hub/.agents/worktrees/E4g/tools/oculus/.scratch/migration/agents/reviews/E4g-report.md`
- My scratch run: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/rv-e4g/`

Usage: agent id unknown; model claude-opus-5-5; tokens not known to me; about 75 tool uses; about 40 minutes (not measured).
## Closed

- Spec 1 (a) to (d): sent to the builder in repair round 1 as code fixes inside the widened path list: `getState` through `$state.snapshot`, the `apps.write` words and the question text, the asking app's tab selected when its question is drawn, DESIGN.md's `terminal` sentence matched to the code; the guide describes the fixed behaviour.
- Spec 2, Proof 1 to 4, Standards 1 and 2, Behaviour 1 to 9, items 1.6 and 1.11, case 3: sent in repair round 1.
- The Help arrangement as one pane: kept (the orchestrator's ruling on the reviewer's recommendation); a check that parses every shipped arrangement needs a guarded entry, raised to Axel as open item Z645.
- Declined, `DESIGN.md:83`: folded into Q125's item 10.

## Repair round 1, refuted

Verdict: round 1 closes every finding it was sent. The two parts the builder lists as not done are not findings: the guide's claims about them hold when read against the source. The three code defects are fixed in code, the guide describes the fixed behaviour, and the checks are green. One new Behaviour finding comes from the round's own fix: the asking app's tab is now selected in its pane, but oculus does not switch to the page that holds that tab. Two documents claim more than that. The other findings are minor proof and standards points in the report. Nothing here needs another builder round; the orchestrator can do each at landing.

Open items: the state file's open-items list is empty on main (`orchestrator-state.md:219`, heading followed by its one explanatory sentence and nothing else).

### 1. The brief's "Verify before you report", rerun from the worktree's `tools/oculus`

- **Item 1, `npm run test:quick`:** passes.
  - Output: `ok ASCII gate (1.8 s)`, `ok prettier (2.2 s): All matched files use Prettier code style!`, `ok svelte-kit sync`, `ok eslint`, `ok vitest (71.9 s)`, `ok svelte-check (66.2 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `test:quick: 98.1 s (limit 45.0 s); every command passed`, `test:quick: over the time limit`, `exit 0`.
  - It prints that it does not cover `tests/checks`. I ran those separately:
    - `npx vitest run tests/checks/config tests/checks/source/keys.test.ts tests/state/system/apps --reporter=dot --testTimeout=120000`: `Test Files 6 passed (6)`, `Tests 126 passed (126)`. This includes the catalog key check over the new `apps.ask.*` keys.
    - `npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts`: `Tests 5 passed (5)`.
- **Item 2, `LC_ALL=C grep -n '[^ -~]' docs/apps.md`:** prints nothing, `exit 1`. The same grep with `-c` prints 0 for every other changed file: `DESIGN.md`, `HELP.md`, `config/layout.yml`, `config/text/app.yml`, `config/text/findings.yml`, `config/text/views/apps/apps.yml`, `apps.svelte.ts`, `methods.ts` and `words.ts`.
- **Item 3, `grep -n -- ' - \| -- \|\.\.\.' docs/apps.md`:** seven hits.
  - `:721` (`...notes.map(`) and `:741` (`[...notes, text]`) are JavaScript spread inside the `js` block.
  - `:812` to `:816` are the nested list markers (`   - `) of example step 1, not dashes.
  - No prose dash.
- **Item 4, the runs of cases 9 and 13:** not rerun. My rules forbid a dev server and a browser.
  - Case 9: I summed the bytes of the guide's fenced blocks with a python read of `docs/apps.md`. It gives `hello bytes 451 files 3` and `task-demo bytes 5820 files 4`, the same `bytes: 451` and `bytes: 5820` the builder's `scanApps` output quotes. So the scan ran over the guide's files.
  - The saved run files the report cites (`$S/r1/*.txt`) are not on disk. `ls` of the scratchpad shows no `r1`, and `find /private/tmp/claude-502 -name case13-whole.txt` prints nothing; they were most likely cleared by the machine restart.
  - `lsof -nP -iTCP:8797 -sTCP:LISTEN` prints nothing (`exit 1`).
- **Item 5, sentence length:**
  - My word count over prose sentences and table cells (an awk count) finds the same places the report names under Standards 3. My count also flags `:186` and `:583`, at 26 words each, and lists 15 cells where the report's text says 14. Neither difference is one a decision rests on.
  - No hard wrap: an awk check of consecutive prose lines outside code, tables and lists prints nothing.
  - History words: `grep -n -i -w -E "before|used to|no longer|still|always has been|always had|as before|previously" docs/apps.md` hits only `:40`, `:157`, `:187`, `:190`, `:473`, `:826` and `:837`. Each uses "before" for an order of events or for History's Before column, not for an earlier version of the tool.

### 2. The closures the builder claims

- **Spec 1(a), `getState`:** closed by a code fix. `apps.svelte.ts:293` is now `getState: () => $state.snapshot(appTab(deps.ui.instanceState(options.instance)).value)`. That is the call `held` uses at `:291`, and it strips the Svelte proxy that made the structured clone throw. The guide's `DataCloneError` rows are gone and `:175` and `:188` describe the copy. I did not rerun the browser call. The fix is the right one by reading, and `appTab` gives `null` when nothing is saved (`instance.ts:27`).
- **Spec 1(b), question words:**
  - Closed by a code fix. The new group `apps.ask.<kind>` holds five lower-case verb phrases (`apps.yml:58-63`). `askWords` is in `words.ts:72-75`, and `methods.ts:267` uses it in place of `writeWords`.
  - `confirm_write: 'The app {0} asks to {1}: {2}'` therefore gives "asks to delete an entry of a collection: {...}" with one colon.
  - The approval panel keeps `writeWords` (`ApprovalPanel.svelte:16,62`), so panel sentences are unchanged.
  - The guide at `:433` matches.
- **Spec 1(c), `terminal`:** closed by correcting DESIGN.md to the code (`DESIGN.md:330`: "so `terminal`, which is listed, opens a Terminal tab"). The guide `:457` agrees.
- **Spec 1(d), the hidden tab:**
  - Closed for a tab hidden in its own pane. `showFirst` calls `deps.layout.activateInstance(instance)` before drawing the question (`apps.svelte.ts:168-169`).
  - The fix does not reach a tab on a page that is not on screen. See Behaviour 1.
- **Spec 2, payload types:** closed. Part 6 now has one subsection per channel with field types.
  - I read `GitState` (`model-sessions.ts:589-629`), `HpcPayload` (`:711-731`), `SessionsPayload` (`:224-233`), `ConfigPayload` (`index.ts:237-243`), `AuditFinding`, `AuditKind` and `AuditPayload` (`index.ts:287-307`) against guide `:283-323`, `:297`, `:301` and `:357`. They match.
  - The report's first line no longer says everything is done.
- **Proof 1:** closed. The case 13 quote in the report holds the History rows. I could not check it against the saved file, which is gone.
- **Proof 2:** closed in the report's text. The case 9, 13 and 14 outputs are quoted in blocks, but the saved files are gone (item 4).
- **Proof 3:** closed. Each departure is named with its reason.
- **Proof 4:** closed. My grep agrees with the report.
- **Standards 1:** closed. `no collection <name>` is at `:505`, and `:860` keeps `nonesuch` as a quoted example of an answer body, which is correct there.
- **Standards 2:** closed. `:11` says "every channel an app can read (part 6)".
- **Behaviour 1, Open the app's folder:** closed. `:130` quotes `apps.folder_unshown` exactly (`apps.yml:15`, posted by `showFolder` at `apps.svelte.ts:413-419`).
- **Behaviour 2:** closed. Step 9 (`:826`) now undoes both rows and ends with the file as it was. The run's quote shows `## tasks.yml equals the original` / `true`.
- **Behaviour 3:** closed. `:186` says a class instance passes as a map of its own fields. `:187`, the `TRANSMISSION_FAILED` path, matches `node_modules/penpal/dist/penpal.mjs:246`.
- **Behaviour 4, `onTheme`:** closed by reading. `:164` matches the effect at `AppFrame.svelte:104-114` (theme, wallpaper, crt and text size, rerun on mount) and `themeChanged` at `apps.svelte.ts:385-387`.
- **Behaviour 5, policy:** closed by reading. `:581` matches `appPolicy` at `address.ts:89-101` line by line: `img-src ${base} data:`, `script-src ${base} ${shared}`, `style-src ${base} 'unsafe-inline'`, `connect-src` with `connects`, and `form-action 'none'`.
- **Behaviour 6, inline script:** closed by reading. `:837` covers the all-inline case through `run.failed` drawing `apps.load_failed` (`AppFrame.svelte:209-213`). `:838` covers the mixed case.
- **Behaviour 7, panel path:** closed (`:816`, `<home>` explained).
- **Behaviour 8, approvals key:** closed (`:139`).
- **Behaviour 9, `snippet`:** closed (`:335` and `:341`).
- **Case 3:** closed.
  - Every reason in the table at `:501-519` is printed by the server, checked with `grep -rn -F` over `src/lib/server`, `src/routes` and `config/text`: `writes.ts:356,371,400,414,428,453,474,489,502,516,524,573`, `writes/entries.ts:258,380,396,408,440`, `entry-edit/entries.ts:72` and `app-store.ts:55,80`.
  - The `failed:<status>` row (`:495`) names `setStore`.
- **Item 1.11:** closed. Part 11 has a five-step console section (`:848-861`).

No closure was made by removing or loosening a check. `diff` of `tests` is empty: `git diff 31068a9de --stat` lists no test file.

### 3. The judgment calls and the stated not-done parts

- **A. Panel and finding words for `inbox`, `calendar` and `sessions` (`apps.yml:35-37`, `findings.yml:212-214`, `DESIGN.md:327`):** not a finding. The old words told a reader approving the app less than the app receives:
  - `snippet: string` at `model-mail.ts:100`;
  - `location?` and `link?` at `model-calendar.ts:74,78`, and no attendee field in `src/lib/data/model` (`grep -rn attendee` prints nothing);
  - session timelines.

  Correcting them is a fix of a defect in delivered work. `grep -rn "subjects and senders\|titles and attendees\|attendees"` over `src tests config HELP.md DESIGN.md README.md docs/apps.md` prints nothing. The report lists the change under visible changes. It is beyond the misses the round was sent, which is the orchestrator's to weigh.
- **B. The word group `apps.ask.<kind>`:** not a finding. The other way, lower-casing and trimming `apps.write.<kind>` in code, would derive text from a catalog sentence. DESIGN.md's Words paragraph (`:342`) names the new keys, and the key check passes.
- **C. `activateInstance` added to `AppsDeps.layout`:** not a finding as a shape.
  - The only caller of `createApps` passes the whole layout store (`context.ts:470-480`), which exports `activateInstance` (`layout.svelte.ts:794`). svelte-check prints 0 errors.
  - The call selects the tab only within its page or float (`instances.ts:169-175`). See Behaviour 1.
- **D. `DESIGN.md:83` left false:** not a finding for this step. It is booked in `agents/briefs/Q125.md:46` (item 10: "`DESIGN.md:83`'s 'every group has a chord' (false for the `apps` group, ...").
- **Not run: the `onTheme` triggers, the policy sentence and the inline-script row.** Not a finding. Case 11 asks for each claim to be read against its code, which I did (Section 2, Behaviour 4 to 6); no case asks for a browser run of these. Listing them on the "Not done" line overstates what is open.
- **Payload tables read from the model types, not compared by a script:** not a finding. The brief asks for them to be read from `src/lib/data/model/`. My spot reading (Spec 2 above) agrees.
- **Five sentences and 14 cells over 25 words:** not a finding. `.agents/plan.yaml:8` has `standards: []`, so no standards page sets a 25-word limit. Each place is named with its reason, and each holds an exact condition or quoted text.

### 4. Verdicts on the whole diff

What to build:

1. `docs/apps.md`: **holds**, apart from Behaviour 1 (`:825`).
2. HELP.md Apps sentence (`HELP.md:220`): **holds**.
3. `docs:` entry (`config/layout.yml:176`): **holds**.
4. Help page tab (`config/layout.yml:93`, one pane, as ruled): **holds**.
5. Lines the entry made false (`HELP.md:21`, `:82`, `config/text/app.yml:12`, `DESIGN.md:79`): **holds**.

Cases:

1. **Met.** `manifest.ts:23-46` gives nine `KEYS`, `BRIDGE = 1`, `TITLE_MAX = 40`, `DESCRIPTION_MAX = 200` and `DEFAULT_ENTRY = 'index.html'`; guide `:94-104` matches.
2. **Met.** All nine methods and three handlers are listed. `getState` answers a copy and has no refusal, as the code does after the fix.
3. **Met** (Section 2, case 3).
4. **Met.** `config/behavior.yml:202-222` against guide `:559-569`.
5. **Met.**
6. **Met.**
7. **Met.** The DESIGN.md `terminal` sentence now matches the code.
8. **Met.**
9. **Met by reading and by the byte sums.** The `scanApps` run itself is not reproduced by me.
10. **Met.** The config checks pass (above).
11. **Partial.** Behaviour 1 is the one claim not borne out.
12. **Met.**
13. **Not verifiable by me.** A browser and a dev server are forbidden to me, and the saved files are gone. The report's quotes are consistent with the code where I read it.
14. **Met by reading.** The catalogue h7 and the tab list rest on the builder's quote.

### 5. Findings

#### Spec

None.

#### Proof

1. **The report's DONE table, row 1, gives the heading lines from before the round's last edit.**
   - Place: `E4g-report.md:36`.
   - Hunk: "at lines 5, 15, 38, 90, 122, 147, 460, 534, 552, 574, 809 (before the Project table was added; the file is 861 lines)".
   - `grep -n "^## " docs/apps.md` prints 5, 15, 38, 90, 122, 147, 481, 555, 573, 595 and 830.
   - What is wrong: `agents/spec.md:14` requires every `file:line` to be taken after the last change.
   - Failure: a reader following `:460` to part 7 lands in the Writes table.
2. **The report does not quote the rename grep and the re-read list that `agents/spec.md:66` asks for after the round's code changes.**
   - Changes: `AppsDeps.layout` gains a member, and `methods.ts` moves from `writeWords` to `askWords`.
   - My grep finds nothing left to carry: `createApps(` has one caller, `context.ts:470`, which passes the layout store; `writeWords` still has its reader at `ApprovalPanel.svelte:62`. The omission hides no defect.
   - Failure: the check that would catch a missed caller is not on record for the landing.
3. **The cited run files are no longer on disk.** `$S/r1/case13-whole.txt`, `state2-run.txt`, `hidden-run.txt` and `folder-run.txt` are gone (`find` prints nothing), so the report's quotes cannot be compared with their source. The likely cause is the machine restart, not the builder.

#### Standards

1. **The report's file list does not mark the paths outside the write list with their reasons** (`agents/spec.md:34`).
   - Place: `E4g-report.md:61`. The paths are `config/text/findings.yml`, `config/text/views/apps/apps.yml`, `src/lib/state/system/apps/{apps.svelte.ts,methods.ts,words.ts}`, `docs/diagrams/channels.{dot,svg}` and DESIGN.md beyond `:79-80`.
   - The round's widening covers the code files and the `apps.write` words; `findings.yml` and the `read.*` words rest only on judgment call A.
   - Failure: the landing reads the file list without knowing which paths the brief never named.

#### Behaviour

1. **A question from an app whose tab is on a page that is not on screen is still not seen, while DESIGN.md and the guide now say it is.**
   - Places:
     - `apps.svelte.ts:168-169`: `deps.layout.activateInstance(instance);`
     - `DESIGN.md:330`: "the tab is selected in its pane when a question is shown so the reader sees it".
     - `docs/apps.md:825`: "A question the app asks while its tab is hidden brings the tab forward."
   - What is wrong:
     - `activateInstance` (`instances.ts:169-175`) makes the tab active in the tree of the page or float that holds it. It does not switch the page on screen.
     - `StatusBar.svelte:75-80` (`openUnsaved`) shows a tab on another page by calling `switchPage(found.page)` before `activateInstance`.
     - An app's frame keeps running while its page is not on screen: `tab-frames.svelte.ts:12-14`, "going out of sight with its pane or its page, ends none of them".
   - Failure: an app on the Apps page sends a `delete-entry` from its `onChannel` handler while the reader is on the Projects page. The question is drawn in a tab on a page not shown, the call never settles, and nothing tells the reader. Part 11's row at `:843` names the symptom, but `:825` and DESIGN.md say the opposite.
   - Fix at landing, one of:
     - (a) also switch to the holding page, as `openUnsaved` does. This is user-visible (a page jump an app can trigger), so it is a shape for the orchestrator.
     - (b) narrow the two sentences to "selected in its pane" and state the off-page case.

### Declined to judge

- The browser runs behind cases 13 and 14, the `getState` list read-back, the hidden-tab run and the console run: my rules forbid a dev server and a browser, and the saved outputs are gone.
- Whether example steps 5 and 9 leave Axel's real `tasks/tasks.yml` byte-identical: checked only on the builder's scratch fixture, as before.
- `unwritable` at guide `:516` says "the store file's folder cannot be written". `writeAppStore` also answers it when no base or no apps settings are held (`app-store.ts:52`). The wording is close and I did not judge it a defect.

Files: guide `/Users/axelfaes/workspace/research-hub/.agents/worktrees/E4g/tools/oculus/docs/apps.md`; builder report `/Users/axelfaes/workspace/research-hub/.agents/worktrees/E4g/tools/oculus/.scratch/migration/agents/reviews/E4g-report.md`; code `/Users/axelfaes/workspace/research-hub/.agents/worktrees/E4g/tools/oculus/src/lib/state/system/apps/apps.svelte.ts`.

Usage: agent id not known to me; model claude-opus-5-5; tokens not known to me; about 45 tool uses; time not measured.

### Closed (round 1 was the last round)

- Behaviour 1: fixed at landing under Z647 (automode): a question shown for an app on a page not on screen switches to that page first, as `openUnsaved` does, so DESIGN.md:330 and docs/apps.md:825 become true; (b) narrowing the sentences was the lazy option.
- Proof 1: the landing report gives the guide's part headings at the lines `grep -n "^## " docs/apps.md` prints at landing.
- Proof 2: the rename grep and the re-read list are run at landing and quoted in the landing report.
- Proof 3: closed, the run files were lost with the machine restart; cases 13 and 14 are looked at on TEST at landing.
- Standards 1: the landing report lists the paths outside the write list with their reasons.
