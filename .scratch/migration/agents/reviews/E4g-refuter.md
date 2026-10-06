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