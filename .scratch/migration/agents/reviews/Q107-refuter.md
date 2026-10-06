# Step Q107 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q107, base b7a5618a)

## Verification (rerun by the reviewer)

```
$ npm run diagrams            (from tools/oculus, Node v24.21.0 first on PATH)
exit=0; shasum over docs/diagrams/* before and after: a3d7614c285cf40a26dab89073013a0b391e2942 both times (byte-identical to the builder's tree)

$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
exit=0
$ npm test
 Test Files  352 passed | 19 skipped (371)
      Tests  5388 passed | 559 skipped (5947)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

$ npx vitest run tests/state/sessions tests/state/client/terminal tests/views/sessions tests/server/machine/pty tests/ui/menu
 Test Files  37 passed (37)
      Tests  544 passed (544)
(same as the report)

$ ASCII gate of spec.md over src tests config DESIGN.md HELP.md and the probe (bin does not exist: "ls: bin: No such file or directory")
prints nothing, exit 0

$ name grep (grep -rcF --exclude=local.yml over src tests config HELP.md DESIGN.md README.md) for unownedTerminals, terminalLabel, attachable, attachTerminal, attachedOf, menu_attach, NO_SERVER_CONFIRMS, stopFollowing, takeSaved, endedTerminals, closeEnded
per-file counts identical to the report's section 5; README.md names none.

Case 2, base channel.ts (the diff reverse-applied on a scratch copy under $TMPDIR, plus the two exported constants the test imports):
$ npx vitest run tests/server/machine/pty/channel-list.test.ts tests/server/machine/pty/channel.test.ts
     x never replace a newer list with the answer of an older read
     x changes nothing and tells nobody
     x leaves no timer behind when it closes while a no-server answer waits to be confirmed
     x is not an empty list while a further read lists the terminals again
     x is the empty list once the confirming reads say it too
     x is given up on when a newer read has listed the terminals meanwhile
     x is the first list when nothing was listed before, once it is confirmed
      Tests  7 failed | 27 passed (34)
(same 7 as the report)

Case 15, layout store with the listener removed (scratch copy):
$ npx vitest run tests/state/workbench/layout/saved/layout-shared.test.ts
     x keep a Terminal tab one of them added when the other saves a change, and after a reload
     x show the page the save names when the page shown is gone from it
     x take the save of another tab while still waiting for the rail to choose their first page
     x follow the newest window when loaded again, and not the one before it
      Tests  4 failed | 4 passed (8)
(same 4 as the report)

Probe, on a scratch copy of the worktree's tools/oculus under $TMPDIR (own node_modules clone, hub root inside the copy), port 8797, default scratch $TMPDIR/q107s; printenv TMUX exit=1 and lsof -iTCP:8797 -sTCP:LISTEN exit=1 before:
$ node .scratch/migration/agents/reviews/Q107-probe.mjs            (final tree, all scenarios)
green save / reload 1 lists / reconnect 3 lists, 0 answered (socket closed, dev server restarted)
green restart, reconnect, burst (62 running), noserver (4 running), ended (killed terminal answered), usage (reload 0 lists, reconnect 2), oddcwd, oddname, both shapes each
RESULT: green, exit 0
$ node ... noserver ended            (base channel.ts), twice
RED noserver / page shape reload: 2 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)
RED noserver / page shape reconnect: 4 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)
green ended / both shapes; the killed terminal was answered
RESULT: RED, exit=1   (both runs)
$ node ... noserver                  (final channel.ts), twice
green noserver / reload 2 lists / reconnect 4 lists, 0 answered; RESULT: green, exit=0 (both runs)
$ probe copy with the noserver outage 2000 ms instead of 400 ms (probe line 305), final channel.ts
RED noserver / page shape reload: 2 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)
RED noserver / page shape reconnect: 4 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)
RESULT: RED, exit=1

After every run and at the end: lsof -iTCP:8797 -sTCP:LISTEN exit=1; ls $TMPDIR/q107s "No such file or directory"; pgrep -fl q107s exit 1; my scratch copies and temp files removed (ls $TMPDIR | grep -ci q107 -> 0); git status --short in the worktree: 33 lines, the same set as at the start.
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. The probe is kept at `.scratch/migration/agents/reviews/Q107-probe.mjs` (identical in the worktree and in main's ledger, `cmp`), isolated by port 8797, `HOME` and `TMUX_TMPDIR` on the server process only, `-S` on every tmux call; `noserver` is RED on the base in both page shapes (reproduced twice); the layout path is red in the unit suite (reproduced, 4 of 8).
- 2: violated for the list path, Spec 1 and Proof 1: the fix ends the false empty list only when tmux is unreachable for less than about 0.6 s; the layout path (Z115 (a)) holds (`storage.ts` `follow`, `layout.svelte.ts` `takeSaved`, `+page.svelte:210`; mutants of following, of keeping `current` and of writing back each fail a test).
- 3: holds. `unownedTerminals` (`terminal-lists.ts`), `attachable`/`attachTerminal` (`terminals.svelte.ts:399-417`), `kindsMenu`/`emptyListMenu`/`attachedOf` (`terminal-list.ts`), `sessions.menu_attach`, wired in `Terminal.svelte` and `TerminalList.svelte`; the test weakness is Proof 2.
- 4: holds. The report's `lsof`/`ls` quotes; my reruns of the probe stopped their server, killed their own socket's server and removed `$TMPDIR/q107s`.
- 5: holds for `DESIGN.md:361` and `HELP.md:127`; the added `HELP.md:146` sentence overstates what is shared, Behaviour 1.

Cases of the brief's "Cases":

- 1: met. The probe on the base answers the two running shells as ended after `noserver`, twice in my runs; every other event green.
- 2: met. 7 of `channel-list.test.ts` fail on the literal base `channel.ts`; 4 of `layout-shared.test.ts` fail without the listener.
- 3: met. Probe `ended` green on base and final (my runs); the store test passes.
- 4: met. Existing store test passes.
- 5: met. Existing store test passes.
- 6: met. `terminals.test.ts` "the terminals no Terminal tab owns".
- 7: met. `terminal-menu.test.ts` "Attach to Session".
- 8: partial. The test passes with `attachTerminal` changed to join the first Terminal tab of any page, so it does not show the tab the menu was opened in is the one joined; the code does it by reading (`terminals.svelte.ts:412`). Proof 2.
- 9: met. Store test gives `composing: false` with the terminal owned and shown; the typed text is `Composer.svelte`'s own state and goes when it unmounts (read).
- 10: met. Removing the latest-list check fails 3 tests (scratch mutant).
- 11: partial. Same as case 8: the test's asked tab is also the first Terminal tab in page order. Proof 2.
- 12: met. `menu-words.test.ts` passes with the new argument and names.
- 13: met. Report section 9; my own runs left the port free and the folder gone.
- 14: partial. Both page shapes are green for the probe's 400 ms outage; with a 2 s outage the final tree ends both running shells in both shapes. Spec 1.
- 15: met. `layout-shared.test.ts`, red without the listener.
- 16: met. `channel-list.test.ts` "never replace a newer list with the answer of an older read"; the Attach test "does not offer a terminal started here and not listed yet".
- 17: partial. Met for an outage shorter than `NO_SERVER_CONFIRMS * NO_SERVER_CONFIRM_MS`; unmet for a longer one (2 s run above). Spec 1.
- 18: met. Probe `usage` green; the reload shape records 0 lists after the event, since the filtered list does not move.
- 19: met. Foreign mutant fails 2 tests.
- 20: met. Duplicate labels give two ids; Attach, Join and Profile parsers do not read each other's ids.
- 21: met. `terminalLabel` test.

## 1. Spec

- `src/lib/server/machine/pty/channel.ts:65-66` and `#read` (`:371-390`): `export const NO_SERVER_CONFIRMS = 2; export const NO_SERVER_CONFIRM_MS = 300;` ... `if (confirmed >= NO_SERVER_CONFIRMS) { this.#take(turn, []); return; }`. What is wrong: item 2 asks that "no `sessions` message leaves out a terminal tmux still runs", and case 17 that a read failing as `noServer` while sessions run ends no running terminal. The fix accepts the empty list after three "no server" answers 0.6 s apart, so the defect remains for any unreachability longer than 0.6 s. My rerun of the builder's own probe with the socket away for 2000 ms instead of 400 ms, on the final tree: "RED noserver / page shape reload: ... answers 2 terminal(s) tmux still lists (4 running)", in both shapes. In that run a page is attached, so the channel holds a live control client (`channel.ts:247-249` `live()`; a control client goes not-alive when its process exits, `tmux.ts:250-256`), which is proof the tmux server runs while `list-sessions` says "no server". The report's section 8 sentence "no code can tell the two apart from `list-sessions` alone" is true of `list-sessions` only; the channel has that other fact, and the driver's `run` always spawns a new CLI client (`channel.ts:223`) rather than asking through the open control client. Failure scenario: tmux's socket file is gone or refused for 1 s or more while four terminals run and a page is attached; the server publishes `terminals: []`, every page ends all four, and every Terminal tab owning only them closes: the Z99 sighting, on the fixed tree. Verdict: item 2 violated (list path); cases 14 and 17 partial.
- Files outside the brief's path list, each judged (not findings): `layout.svelte.ts` and `routes/+page.svelte` are where the Z115 (a) fix lies, named in the report; `TerminalRows.svelte` takes the shared `terminalLabel` with no visible change; `terminal-lists.ts`, `workbench-shape.ts`, `TerminalFontTools.svelte` and the `TerminalListProps` move keep `terminals.svelte.ts` (885), `Terminal.svelte` (528) and `TerminalList.svelte` (505) under the 900 and 540 lines of `tests/checks/tree/size.test.ts:28-29`, each with a head comment; the move of `layout-saved.test.ts` into `saved/` changes only its three import paths (diffed); `type-scale.test.ts` lists the new component; `sessions.test.ts` follows the moved expression in an existing audit; `docs/diagrams` are what `npm run diagrams` produces (byte-identical on my run); `layout-fixture.ts` and `layout.test.ts` update a path in a comment; `DESIGN.md:154` and `HELP.md:146` document the Z115 behaviour, which a public change needs. For the orchestrator's merge judgment: the dispatch block's `shared_paths` names only `DESIGN.md:361` and `HELP.md:127` for Q107; Q107 also writes `DESIGN.md:154` and `HELP.md:146`, which touch none of Q106's lines (DESIGN 218 and 402, HELP 90 and 296).

## 2. Proof

- `.scratch/migration/agents/reviews/Q107-probe.mjs:305` (the `noserver` scenario): `renameSync(SOCKET, away); ... await sleep(400); renameSync(away, SOCKET);`. What is wrong: the red command's outage (400 ms) lies inside the fix's confirmation span (2 x 300 ms), so "green x3 after the fix" shows only that outages shorter than the span heal. It would not fail if the risk the step exists for, a list read failing as "no server" while sessions run, lasted longer; the same event at 2000 ms is RED on the final tree (verification block). The decision resting on it: item 2 and cases 14 and 17 are reported DONE on this green. Failure scenario: the orchestrator lands the step on "probe noserver green x3", and a restart-time or cleanup-time loss of the socket of a second or more closes every Terminal tab as before. Verdict: item 2 violated; cases 14 and 17 partial (with Spec 1).
- `tests/state/client/terminal/terminal-tabs.test.ts`, describe "attaching a terminal no tab owns", the cases "puts the chosen terminal at the end of the tab, shows it in the row and activates the tab; no other tab changes" and "joins the tab it is chosen from, and not a Terminal tab of another page". What is wrong: in both, the tab the terminal is attached from is also the first Terminal tab in page order, so they pass with the behaviour taken out. Mutant on a scratch copy, `terminals.svelte.ts:412` `const target = terminalTabs().find((one) => one.id === tab);` replaced by the first Terminal tab: `npx vitest run tests/state/client/terminal tests/state/sessions tests/views/sessions tests/ui/menu` gives "Tests 450 passed (450)". Failure scenario: a later change makes Attach join the page's first Terminal tab (or `showTerminal`'s target) instead of the tab whose menu was used; a page with two Terminal tabs puts the terminal in the other one, and no test fails. Verdict: cases 8 and 11 partial.

## 3. Standards

- `tests/server/machine/pty/channel-list.test.ts:10-11`: "What this does NOT cover: a real tmux server failing to be reached, which is // .scratch/migration/agents/reviews/Q107-probe.mjs against a dev server of its own". What is wrong: a code comment naming a step id and a ledger file, against `agents/spec.md` "What every package obeys" ("A comment naming a package id (O17, Q14, D19c) or a date is a defect") and its no-history rule; the ledger is not part of the product tree and is archived when the plan closes. Failure scenario: a reader of the test after the plan closes follows the pointer to a file that is no longer there, or reads it as a record of which step wrote the test.

## 4. Behaviour

- `HELP.md:146` (`pages` row): "The browser tabs of one server share the pages: a page, tab or Terminal tab added or changed in one shows in the others at once"; and `DESIGN.md:154`, whose unchanged sentence beside the new one still says "`layout` and `ui` persist to `localStorage` under one versioned key". What is wrong: only `oculus.layout.v1` (`storage.ts:18`) is followed. Per-tab state lives in the ui store's `instances` under a second key, `oculus.ui.v1` (`ui.svelte.ts:25`, read at `:299-340`, written whole at `:363`), which no browser tab follows (read, not run). So a tab's instance state (a Terminal tab's composer record, a Files view's typed forms, selections and filters) changed in one browser tab does not show in the other, and whichever browser tab writes the ui key last overwrites the other's records. The report's "User-visible changes" row for a second browser tab does not state this, and the HELP sentence says "changed ... shows in the others". Failure scenario: browser tab A opens a Terminal tab and picks a workspace and account in its composer; browser tab B then changes the theme, writing `oculus.ui.v1` without A's record; the dev server restarts and reloads A: the Terminal tab is there (the Z99 fix holds, since a tab's terminals live in the pages) but its composer record is gone, while the Pages row told the reader tabs are shared.

## Declined to judge

- Whether Z99's 16:15 sighting had this cause (a "no server" read) or another; the report says it is not established, and neither a read nor a rerun can settle it.
- Whether the ui store's per-tab state should also follow other browser tabs: Z115 (a) rules "the arrangement", and whether that covers `oculus.ui.v1` is the user's call; Behaviour 1 covers only what the text says.
- Whether the builder wrote the report and probe into main's ledger itself or the orchestrator copied them; I checked only that both probe copies are identical.
- The look of the Attach to Session submenu, its keyboard path and a second browser tab taking a save: DOM behaviour, for the look at landing (`agents/spec.md`).
- Side effects of my own commands, stated so they are not mistaken for the builder's: `npm run diagrams` and `checks.sh` ran in the worktree (diagrams byte-identical; build output, `.svelte-kit` and vitest caches are git-ignored; `git status --short` unchanged); one failed probe start before I cloned `node_modules` wrote Vite's dependency cache in the worktree's `node_modules/.vite` (git-ignored); each of my six probe server starts ran the Live HPC poller's read-only queries, which the brief accepts.

Reviewer usage: tokens not visible to me; about 50 tool uses; about 35 minutes.

Usage: reviewer ad54a4d0f4137b7ba, served claude-opus-5-5; 259,978 tokens, 59 tool uses, 22.2 min (from its completion notice)

## Repair round 1, refuted

The round closes all four rulings and the five findings of the first review, and my reruns reproduce every closure. Two things are still open:

- **The no-control-client case is still RED.** When no control client runs, a "no server" read still ends the running terminals. I reran `noserverhidden` and it is RED in both page shapes. Ruling 1 only asked for this run to be reported. The reason the report gives for leaving it RED does not hold up: tmux's server pid can tell the two cases apart (Proof 1).
- **One new branch has no test.** The new branch in the ui store that writes every record when the stored value is unreadable passes the whole test file with the branch taken out (Proof 2).

The report's first line still says "Everything in the brief is done" (Standards 1).

### Verification (rerun from tools/oculus in the worktree, Node v24.21.0 first on PATH)

```
$ npm run diagrams
exit=0; shasum over docs/diagrams/* before and after: 207118c0d0f534f2a9f015054502302fc7f5a6d5 both times

$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
exit=0 (751 lines; the $ lines and result lines, build asset lines left out)
$ npm test
 Test Files  353 passed | 19 skipped (372)
      Tests  5401 passed | 559 skipped (5960)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

$ npx vitest run tests/state/sessions tests/state/client/terminal tests/views/sessions tests/server/machine/pty tests/ui/menu tests/state/workbench --reporter=dot
 Test Files  65 passed (65)
      Tests  1156 passed (1156)            (same as the report)

$ ASCII gate of spec.md over src tests config, plus DESIGN.md HELP.md and the probe and the report
prints nothing, exit 0

$ sh utils/folder-check.sh   exit 0
$ git status --short | wc -l   38     $ git diff b7a5618a | shasum   e3cbf0efca9a246778e4924855ef432c8499ac17 (before and after my review)
```

### How I identified the round's delta

1. **Timestamps.** I ran `stat` over every path in `git diff b7a5618a --name-only` plus the untracked files. The round was sent at 00:10. These paths were modified after it:
   - `tests/server/machine/pty/channel-list.test.ts` (00:13)
   - the probe (00:16)
   - `tests/state/client/terminal/terminal-tabs.test.ts` (00:17)
   - `src/lib/state/sessions/terminals.svelte.ts` (00:17)
   - `src/lib/state/shared/stores/storage-events.ts` (new, 00:19)
   - `src/lib/state/workbench/layout/saved/storage.ts`, `src/routes/+page.svelte`, `DESIGN.md`, `HELP.md` (00:19)
   - `src/lib/server/machine/pty/channel.ts` (00:37)
   - `tests/state/workbench/ui-shared.test.ts` (new) and `src/lib/state/workbench/ui.svelte.ts` (00:42)
   - the six diagram files (00:42)
   - the report (00:46)
2. **The five new paths.** Going from 33 to 38 paths adds:
   - `ui.svelte.ts`
   - `storage-events.ts`
   - `ui-shared.test.ts`
   - `layer-state.dot` and `layer-state.svg`. Their only hunk is `state/workbench to state/shared` going from 14 to 16, and the two new imports of `followKey` make that change.
3. **`terminals.svelte.ts` is unchanged in content.** Its 00:17 timestamp comes from the ruling-2 mutant copy being put back. It is still 885 lines, and `attachTerminal`'s `find` sits at `:412`, where the first review cited it.
4. **Pre-round `channel.ts`.** I rebuilt it as the final file with the `live()` guard at `:383` removed. That matches the first review's quote: `if (confirmed >= NO_SERVER_CONFIRMS) { this.#take(turn, []); return; }`.
5. **Caveat on the shasum.** `git diff b7a5618a | shasum` covers tracked files only, and nine of the 38 paths are untracked. So the round-base shasum never covered `storage-events.ts`, `ui-shared.test.ts`, `channel-list.test.ts` or the probe.

### Closures

**First review's findings**

- **Spec 1 (confirmation span): closed where a control client runs; open where none does.**
  - The fix adds the `live()` guard at `channel.ts:383`. It keeps `NO_SERVER_CONFIRMS` and does not remove a check.
  - Probe `noserver` (2000 ms): green on the final tree in both shapes (my default run). RED on the pre-round `channel.ts`: "RED noserver / page shape reload: 2 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)", and the same in the reconnect shape, exit=1.
  - `noserverhidden`: RED on the final tree, reproduced (Spec 1 and Proof 1 below).
- **Proof 1 (400 ms outage): closed.**
  - `noserver` now runs at 2000 ms, and `noserver400` keeps the 400 ms run. Both are green on the final tree in both shapes.
  - 2000 ms is RED on the pre-round tree and 400 ms is green there, which matches the report.
- **Proof 2 (attach target): closed.** I ran the two mutants on a scratch copy with `npx vitest run tests/state/client/terminal tests/state/sessions tests/views/sessions tests/ui/menu`:
  - `terminalTabs()[0]` fails both tests: "Tests 2 failed | 448 passed (450)".
  - The page-on-screen's Terminal tab (`pageTab(terminalTabs(), workbench.currentPage())`) fails the case-8 test: "1 failed | 449 passed". The case-11 test passes it.
  - Ruling 2 asked for "a page with two Terminal tabs" in both tests. The case-11 test uses a second page holding one Terminal tab, so only case 8 catches the current-page mutant. Together the two tests bind the behaviour, so this is a note, not a finding.
- **Standards 1 (test head): closed.** `grep -n "scratch\|Q107\|probe" tests/server/machine/pty/channel-list.test.ts` prints nothing. The head at `:12-14` names what is not covered without a ledger path.
- **Behaviour 1 (`oculus.ui.v1` shared): closed.**
  - `save` now merges (`mergedInstances`, `ui.svelte.ts:414`), and the store follows the key (`takeSavedInstances`, `:433`, through `followKey`).
  - `HELP.md:146` and `DESIGN.md:154` now say that the arrangement and each tab's own state are shared, and the appearance is not.
  - With the base `ui.svelte.ts` in a scratch copy, `ui-shared.test.ts` gives "Tests 8 failed | 2 passed (10)". That matches the report's 8 of 9: the refused-write case passes on the base.

**The four rulings**

- **Ruling 1: done as ruled.**
  - Tests (a), (b) and (c) are at `channel-list.test.ts:272,284,293`.
  - Removing the `live()` guard fails (a) only: "Tests 1 failed | 36 passed (37)", together with `channel.test.ts`. That matches the report's first run. (b) and (c) pin the behaviour that stays.
  - The doc comment of `#read` states both cases.
  - The hidden-tab run was made and reported verbatim, as ruled, and I reproduced it RED. The reason the round gives for it standing is Proof 1.
- **Ruling 2: done.** See Proof 2 above.
- **Ruling 3: done.** See Standards 1 above.
- **Ruling 4: done.**
  - `ui-shared.test.ts` has 10 cases. My mutants:
    - `synced` set before the write: 1 failed.
    - Every saved record kept: 3 failed.
    - This tab's records written whole: 2 failed.
  - Beyond the ruling: `storage.ts` `follow` now calls the shared `followKey`, and `+page.svelte` wires both `stopFollowing` calls. It is the same listener in one place, and `layout-shared.test.ts` passes. It stays inside the ruling's concern.

**The builder's two changes from ruling 4 as written**

- **"Writes every record when the storage holds nothing readable": sound.**
  - Read literally ("the saved records with this store's changed records laid over them"), the ruling would drop this tab's unchanged records whenever the stored value is unreadable. That is the loss Z128 exists to end.
  - With the branch removed, my scratch test (a tab holds `a`, the stored value turns unreadable, the tab saves `b`) gives "expected { b: 2 } to deeply equal { a: 1, b: 2 }".
  - No test binds it: Proof 2.
- **"`synced` updated only after a successful write": sound, and bound by the refused-write test.**

**The hidden-tab RED:** consistent with ruling 1, which asked only for the result. Judged against the brief, it leaves item 2 and cases 14 and 17 short (Spec 1).

### Verdicts, whole diff since b7a5618a

**Items of "What to build"**

- **1: holds.**
  - The probe is kept at the ledger path. The worktree and main-ledger copies are identical (`cmp`).
  - It is isolated by port 8797, `HOME` and `TMUX_TMPDIR`, with `-S` on every tmux call.
  - My default run was green on every scenario. Pre-round `noserver` was RED.
  - The layout path is red without the listener (first review, unchanged since).
- **2: violated, narrower than in the first review.**
  - With a control client live, a "no server" answer no longer ends terminals, whatever the outage length (probe `noserver` 2000 ms green).
  - With no control client, the empty list is still published after 0.6 s while tmux runs (`noserverhidden` RED, both shapes; Spec 1).
  - The layout path and the ui store hold (mutants above).
- **3: holds.** The attach target is now bound by tests (mutants above).
- **4: holds.**
  - After my three probe runs: `lsof -iTCP:8797 -sTCP:LISTEN` exit 1; `ls ${TMPDIR}q107s` "No such file or directory"; `pgrep -fl q107` exit 1.
- **5: holds.**
  - `DESIGN.md:361` states the control-client rule and Attach to Session.
  - `HELP.md:127` states Attach to Session.
  - `HELP.md:146` and `DESIGN.md:154` state what is shared.
  - Name grep for `followKey`, `takeSavedInstances`, `mergedInstances`, `savedHeld`, `stopFollowing`, `loadUi` and `NO_SERVER_CONFIRMS`: the per-file counts match the report. No doc sentence found false.

**Cases**

| Case | Verdict | Evidence |
|---|---|---|
| 1 | met | The probe on the pre-round tree is RED at `noserver`. |
| 2 | met | 1 of `channel-list.test.ts` fails without the guard; 8 of `ui-shared.test.ts` fail on the base `ui.svelte.ts`; the layout test is red without the listener (first review). |
| 3 | met | Probe `ended` green in both shapes. |
| 4 | met | Store test passes. |
| 5 | met | Store test passes. |
| 6 | met | `terminals.test.ts`. |
| 7 | met | `terminal-menu.test.ts`. |
| 8 | met | Both target mutants fail it. |
| 9 | met | Store test passes. |
| 10 | met | Store tests pass. |
| 11 | met | The `terminalTabs()[0]` mutant fails it; the current-page mutant is caught by case 8. |
| 12 | met | `menu-words.test.ts` passes. |
| 13 | met | The report's quotes, and my own cleanup lines. |
| 14 | partial | Both page shapes are green for `noserver` and `noserver400`; both are RED for `noserverhidden`. |
| 15 | met | Layout test is red without the listener. |
| 16 | met | Tests pass. |
| 17 | partial | Met while a control client runs; unmet with none (`noserverhidden` RED). |
| 18 | met | Probe `usage` green. |
| 19 | met | Tests pass. |
| 20 | met | Tests pass. |
| 21 | met | Tests pass. |

### 1. Spec

- **`src/lib/server/machine/pty/channel.ts:382-385`**:
  ```
  if (confirmed >= NO_SERVER_CONFIRMS) {
      if (!this.#driver.live()) this.#take(turn, []);
      return;
  }
  ```
  - **What is wrong.** With no control client, three "no server" answers 0.6 s apart still publish `terminals: []` while tmux runs. Item 2 asks that no `sessions` message leave out a terminal tmux still runs, and case 17 asks that such a read end no running terminal.
  - **Reproduced.** `node .scratch/migration/agents/reviews/Q107-probe.mjs noserverhidden` on a scratch copy of the final tree printed:
    ```
    RED noserverhidden / page shape reload: 1 lists, endedTerminals answers 2 terminal(s) tmux still lists (2 running)
    RED noserverhidden / page shape reconnect: 3 lists, endedTerminals answers 2 terminal(s) tmux still lists (2 running)
    RESULT: RED
    ```
    with exit=1.
  - **A fix is possible inside the step.** A fact that separates a running tmux from an exited one exists without a control client (Proof 1).
  - **Failure scenarios.**
    - Every Terminal tab has been off screen (another tab active, or another page) for more than `IDLE_MS`, so no control client runs. The tmux socket is then unreachable for 0.6 s or more at an idle poll tick. The server publishes the empty list, and every page takes every terminal out of its tabs and closes the tabs left with none.
    - The same happens right after a dev-server restart: the new `Terminals` has no control client, its constructor calls `refresh()`, and with the socket unreachable at that moment `[]` becomes the first list.
  - **Verdict:** item 2 violated; cases 14 and 17 partial.
  - **Context.** Ruling 1 asked only that this run be reported. The builder did that, so the round broke no ruling. The gap is between the whole diff and the brief.

### 2. Proof

- **`Q107-report.md:949`**: "No control client runs then, so nothing in the process says tmux runs, and a tmux that exited normally answers the same words."
  - **What is wrong.** This does not reproduce. tmux answers its server pid in the same list read (`#{pid}`), and that process outlives a lost socket. On my own private socket (`${TMPDIR}q107rv/s`, killed and removed afterwards):
    - `tmux -S $SOCK list-sessions -F '#{pid}'` printed `23542`, and `ps` showed `23542 tmux`.
    - With the socket file moved away, `list-sessions` said "error connecting to ... (No such file or directory)" while `kill -0 23542` succeeded ("pid alive while socket away").
    - After `kill-server`, `kill -0` exit=1.
  - **Decision resting on it.** The report leaves `noserverhidden` RED as "the case that remains", on the ground that no fact tells the two cases apart.
  - **Failure scenario.** The orchestrator lands the step taking the remaining RED as unfixable. The closing seen in Z99 stays reachable in the idle shape of Spec 1.
  - **Verdict:** item 2 violated; cases 14 and 17 partial.
- **`src/lib/state/workbench/ui.svelte.ts:416`**: `if (held === null) return mine;`, which the report lists as a change from the ruling.
  - **What is wrong.** No test fails without the branch. With it removed, `npx vitest run tests/state/workbench/ui-shared.test.ts` still gives 10 of 10 passed. The case "save their own records when the stored value cannot be read" loads with an empty storage, so `synced` is empty and every record counts as changed either way. My scratch case (a tab holds `a`, the stored value turns unreadable, the tab saves `b`) passes with the branch and fails without it: "expected { b: 2 } to deeply equal { a: 1, b: 2 }".
  - **Failure scenario.** A later edit drops or changes the branch. A browser tab whose stored ui value is unreadable (another version's envelope, a corrupted write) then writes only its newly changed records, and every other record it holds is lost from the storage. No test fails.
  - **Verdict:** a test that would pass with its behaviour removed. Ruling 4 is otherwise closed.

### 3. Standards

- **`Q107-report.md:1`**: "Everything in the brief is done."
  - **What is wrong.** `agents/spec.md` "Report" requires the first line to name anything NOT done. The round's own section (`:949`) says a case the brief covers (case 17, no control client) "is RED and stands". The report's first line was not updated.
  - **Failure scenario.** A reader who reads the head of the report takes item 2 and case 17 as done.
  - **Verdict:** case 17 partial; item 2 violated, as in Spec 1.

### 4. Behaviour

None. The report's "User-visible changes" table has a before and after for each change, and I found no user-visible change it leaves out. Among the changes it states:
- the last list stands while tmux is unreachable and a page is attached;
- the list is read again only at the next change tmux reports;
- the no-page case is unchanged and RED;
- browser tabs share the view records, the appearance stays each tab's own, and the last write wins;
- the new wording of `HELP.md:146`.

### Declined to judge

- **What caused the Z99 sighting.** The report says it is not established, and neither a read nor a rerun can settle it.
- **Whether pid reuse makes a pid check unsafe.** Proof 1 shows only that the fact exists. Whether it is the right fix, or whether a socket-path check, SIGUSR1 or another design fits better, is the builder's and the orchestrator's call.
- **Browser behaviour.** Whether a view that writes its record from an effect could make two browser tabs ping-pong their records through `takeSavedInstances`, and how a composer or form looks when another tab's record arrives while the reader types, are DOM behaviour for the look at landing (`agents/spec.md:56`).
- **Wording of `HELP.md:146`.** It says each browser tab "keeps its own appearance". After a reload a tab reads whichever tab saved last, and that was already so before this step. Whether the sentence needs "until reloaded" is a wording judgement.
- **A refused write followed by another tab's save.** Records whose write was refused are replaced by `takeSavedInstances` when another tab's save arrives before this tab's next save. The storage quota is shared by the origin, so a refused write in one tab likely means one in both. I did not run this.
- **Side effects of my own commands**, listed so they are not taken for the builder's:
  - In the worktree: `npm run diagrams` (diagram hash unchanged) and `checks.sh` (build output, `.svelte-kit` and vitest caches are git-ignored). Status is still 38 lines and the shasum is unchanged.
  - My first mutant runs used a copy whose `node_modules` was a symlink to the worktree's, so vitest may have written a cache into the worktree's `node_modules/.vite` (git-ignored).
  - The probe runs used an APFS clone of `node_modules`, with the copy's `config/local.yml` deleted unread so that its hub defaulted to inside the copy. All scratch copies are removed.
  - I wrote the checks output to `checks.txt` in the session scratchpad. A file of that name was already there and may have been the orchestrator's, so it now holds my run.
  - Each of my three probe server starts ran the Live HPC poller's read-only queries, which the brief accepts.
  - Every tmux command I ran named my own socket or the probe's.

### Usage

Reviewer a498a23d465b6bf60, served claude-opus-5-5 (the transcript's message.model): 209,457 tokens, 47 tool uses, 18.8 min (its completion notice).

## Repair round 2, refuted

Three things stay open after this round. None of them needs another round, and each fix fits at landing.

- **Odd first row (Spec 1).** `serverPid` reads field 11 of the list's first row. If that row's folder holds a tab or a newline, or its name option holds a newline, no pid is kept. Then a "no server" read with no control client ends every running terminal again. On a real tmux list, `serverPid` answered null for all three shapes.
- **Stale guard untested (Proof 1).** Nothing tests the guard that stops a superseded read from setting the kept pid.
- **Slow-only test (Proof 2).** The `ps` half of `tmuxRuns` is the ruling's guard against a reused pid. It is tested only in a file tagged slow, which `npm test` and `test:checks` leave out.
- **Doc comment (Standards 1).** The comment on `LIST_FORMAT` contradicts itself.

Every closure the round claims reproduces. `noserverhidden` is green on the final tree and RED without the pid guard, and the default run is green. I found no check removed to close a finding. `isTmuxCommand` accepting `tmux:` goes beyond the ruling's words but stays within its concern (judged under Closures).

### Verification (rerun from tools/oculus in the worktree, Node v24.21.0 first on PATH)

```
$ printenv CLAUDE_CODE_EFFORT_LEVEL   exit=1
$ printenv TMUX                       exit=1

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
exit=0; cat docs/diagrams/* | shasum before and after: 47da03971864d0c5c8dabe0a87735da6e33acf63 both times

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
exit=0 (762 lines; the $ lines and result lines, build asset lines left out)
$ npm test
 Test Files  353 passed | 19 skipped (372)
      Tests  5409 passed | 561 skipped (5970)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
(same as the report)

$ npx vitest run tests/state/sessions tests/state/client/terminal tests/views/sessions tests/server/machine/pty tests/ui/menu tests/state/workbench --reporter=dot
 Test Files  65 passed (65)
      Tests  1166 passed (1166)            (same as the report)

$ npx vitest run tests/server/machine/pty/sessions.test.ts tests/server/machine/pty/tmux.test.ts tests/server/machine/pty/channel-list.test.ts tests/routes/sessions/terminal-edit.test.ts tests/state/workbench/ui-shared.test.ts tests/server/root
 Test Files  21 passed (21)
      Tests  280 passed (280)

$ spec.md's perl ASCII gate over src tests config (! -name local.yml), plus DESIGN.md HELP.md, the probe and the report
prints nothing, exit 0
$ sh utils/folder-check.sh   exit 0

$ name grep (grep -rcF --exclude=local.yml over src tests config HELP.md DESIGN.md README.md)
serverPid: sessions.ts 2, channel.ts 4, sessions.test.ts 8
serverRuns: channel.ts 4, channel.test.ts 1, channel-list.test.ts 1, context-fixture.ts 1, context.test.ts 1
tmuxRuns: channel.ts 2, tmux.ts 1, sessions.test.ts 5
isTmuxCommand: tmux.ts 2, tmux.test.ts 5
SERVER_FIELD: sessions.ts 2 | serverKeptRuns: channel.ts 2 | LIST_FORMAT: sessions.ts 3, terminal-edit.test.ts 3
(same files as the report; README.md names none)

Probe, on a scratch copy of the worktree's tools/oculus under ${TMPDIR}q7c (config/local.yml excluded from the copy and never read, node_modules an APFS clone, .svelte-kit copied), Q107_PORT=8813, Q107_SCRATCH=${TMPDIR}q7s; printenv TMUX exit=1 and lsof -iTCP:8813 -sTCP:LISTEN exit=1 before each run:

$ node .scratch/migration/agents/reviews/Q107-probe.mjs            (final tree), exit=0
green save / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green save / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
    the socket of the open client closed, so the dev server restarted
green restart / reload 1 / reconnect 3, 0 answered (2 running)
green reconnect / reload 1 / reconnect 3, 0 answered (2 running)
green burst / reload 7 / reconnect 9, 0 answered (62 running)
green noserver / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
green noserver / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
    while the socket is away (2000 ms) tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
green noserver400 / reload 2 / reconnect 4, 0 answered (4 running)
green ended / both shapes, 0 answered (1 running); the killed terminal was answered
green usage / reload 0 / reconnect 2, 0 answered (2 running)
green oddcwd / reload 1 / reconnect 3, 0 answered (3 running)
green oddname / reload 1 / reconnect 3, 0 answered (3 running)
RESULT: green

$ node .scratch/migration/agents/reviews/Q107-probe.mjs noserverhidden            (final tree), exit=0
green noserverhidden / page shape reload: 0 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green noserverhidden / page shape reconnect: 2 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
    while the socket is away tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
RESULT: green

$ same, channel.ts:402-403 replaced in the copy by `if (!this.#driver.live()) this.#take(turn, []);` (the round's pid guard taken out), exit=1
RED noserverhidden / page shape reload: 1 lists, endedTerminals answers 2 terminal(s) tmux still lists (2 running)
    answered 4d96b7-shell at list 0; that list held []
    answered c468db-shell at list 0; that list held []
RED noserverhidden / page shape reconnect: 3 lists, endedTerminals answers 2 terminal(s) tmux still lists (2 running)
    answered 4d96b7-shell at list 2; that list held []
    answered c468db-shell at list 2; that list held []
RESULT: RED
$ npx vitest run tests/server/machine/pty/channel-list.test.ts   (same mutant)
 FAIL ... is never the empty list while the server that last listed is a running tmux
 FAIL ... is the empty list after the confirming reads when that server does not run
 FAIL ... asks about the server of the list read last, not of an earlier one
      Tests  3 failed | 16 passed (19)            (same 3 as the report)

After each probe run: lsof -iTCP:8813 -sTCP:LISTEN exit=1; ls ${TMPDIR}q7s "No such file or directory".

Mutants on the scratch copy, each restored and cmp-checked against the worktree:
- ui.svelte.ts:416-417 as `const saved = held === null ? {} : instancesOf(held);` -> ui-shared.test.ts "Tests 1 failed | 10 passed (11)", "write every record they hold when the stored value becomes unreadable after a save": "expected { b: 2 } to deeply equal { a: 1, b: 2 }"
- ui.svelte.ts:416 line removed (the report's form) -> "Failed Tests 11", TypeError: Cannot read properties of null (reading 'instances')   (same as the report)
- channel.ts:410 `this.#serverPid = serverPid(text);` without the stale guard -> npx vitest run tests/server/machine/pty tests/server/root: "Tests 294 passed (294)"
- tmux.ts:108 `resolve(true)` (no ps check) -> npx vitest run tests/server/machine/pty tests/server/root --tagsFilter '!slow': "Tests 240 passed | 54 skipped (294)"; sessions.test.ts alone: "FAIL tells a tmux server that runs from one that exited, with its socket file present or not", "Tests 1 failed | 20 passed (21)"
- terminals.svelte.ts:412 `const target = terminalTabs()[0];` -> "Tests 2 failed | 448 passed (450)"
- storage.ts:89 `return () => {};` -> tests/state/workbench "Tests 4 failed | 606 passed (610)"

serverPid over real lists (a scratch vitest file in the copy, own socket ${TMPDIR}q7o/s, killed and removed):
plain "oculus-zzzzzz-shell\t...\t/private/var/.../tools/oculus\t\t\t\t\t\t60420\n" -> 60420
newline cwd first "oculus-aaaaaa-shell\t...\t/private/var/.../q7o/odd\nfolder\t\t\t\t\t\t60420\noculus-zzzzzz-shell\t...\t60420\n" -> null [ 'aaaaaa-shell', 'zzzzzz-shell' ]
tab cwd first "oculus-aaaaab-shell\t...\t/private/var/.../q7o/tab\tfolder\t\t\t\t\t\t60420\noculus-zzzzzz-shell\t...\t60420\n" -> null [ 'aaaaab-shell', 'zzzzzz-shell' ]
newline name first "oculus-aaaaac-shell\t...\t/private/var/.../tools/oculus\ttwo\nlines\t\t\t\t\t60420\noculus-zzzzzz-shell\t...\t60420\n" -> null [ 'aaaaac-shell', 'zzzzzz-shell' ]

ps on macOS for a tmux server on my own socket: `ps -o comm= -p 64002` printed "tmux"; kill -0 after kill-server exit=1.

At the end: ls $TMPDIR | grep -c '^q7' -> 0; pgrep -fl 'q7s|q7o|q7p|q7c' exit=1; lsof -iTCP:8813 -sTCP:LISTEN exit=1; git status --short | wc -l 45; git diff b7a5618a | shasum 94a34f7aa0d5694a10b4ece5cdcd4989a819ad38 (same as at my start).
```

### The round's delta, as I identified it

- **Seven new paths.** `git status --short` went from 38 to 45 paths:
  - `src/lib/server/machine/pty/sessions.ts`
  - `src/lib/server/machine/pty/tmux.ts`
  - `tests/server/machine/pty/sessions.test.ts`
  - `tests/server/machine/pty/tmux.test.ts`
  - `tests/routes/sessions/terminal-edit.test.ts`
  - `tests/server/root/context-fixture.ts`
  - `tests/server/root/context.test.ts`
- **Changed after the round was sent (01:08), by `stat`:**
  - `channel.ts` (01:27)
  - `channel-list.test.ts` (01:08:53)
  - `channel.test.ts` (01:13)
  - `DESIGN.md` (01:13)
  - `ui-shared.test.ts` (01:12)
  - `ui.svelte.ts` (01:12). The report says this is the ruling-2 mutant put back, and the line the round 1 review quoted is still at `:416`.
- **Unchanged since before the round:** `terminals.svelte.ts`, `HELP.md`, the probe and the layout files (mtimes 00:16 to 00:19).
- **Test changes read.** The round's changes to existing tests only add `serverRuns` to the fake drivers. The one exception is `terminal-edit.test.ts:369`, which gains the `#{pid}` field. No assertion was loosened and no check was removed.

### Closures

- **Ruling 1: closed as ruled, with Spec 1 and the two Proof findings left.**
  - The pid is read (`sessions.ts:85`, `serverPid` `:290`) and kept (`channel.ts:410`).
  - It is asked through the driver (`serverRuns`, `channel.ts:167`, `:264`) with `kill -0` plus `ps` (`tmux.ts:94-112`).
  - The guard sits at `channel.ts:402`, and the doc comment of `#read` gives the three cases.
  - Tests (d), (e) and (f) are present, plus a case for a failing driver answer and one for "the latest pid".
  - `noserverhidden` is green on the final tree and RED without the guard, both reproduced above. The default run is green.
- **The addition beyond the ruling (`isTmuxCommand` accepting `tmux:` and a title): sound, and within the finding's concern.**
  - On Linux, tmux renames its processes through `prctl(PR_SET_NAME)` to "tmux: server". I did not verify this on a Linux host; it comes from tmux's compat `setproctitle`. Without the addition, the ruling's check could never hold on Linux.
  - On macOS, `ps -o comm=` printed "tmux" (above).
  - It also accepts "tmux: client". A kept pid is always a server pid, so that would matter only if the pid were reused by a tmux client. I raise nothing on it.
- **Ruling 2: closed.**
  - The new case `ui-shared.test.ts:106` fails on its own assertion under a mutant that treats an unreadable value as an empty saved map ("expected { b: 2 } to deeply equal { a: 1, b: 2 }").
  - The report's own form, with the line removed, fails all 11 cases through a TypeError. That shows a crash, and the specific binding is what my mutant shows.
- **Ruling 3: closed as ruled.** The first line says "Everything in the brief is done." Both probe runs the ruling names are green in my reruns. Spec 1 was not known to the builder.

### Verdicts, whole diff since b7a5618a

**Items of "What to build"**

- **1: holds.**
  - The probe is at the ledger path, identical in the worktree and main's ledger (`cmp` exit 0).
  - It is isolated by port, `HOME`, `TMUX_TMPDIR` and `-S`.
  - The list path is RED on the tree before each fix (`noserver` in the earlier reviews, `noserverhidden` above).
  - The layout path is red without the listener (4 failed).
- **2: violated, narrowly (Spec 1).**
  - With a control client, a kept running-tmux pid, or an outage shorter than the confirmations, no running terminal is ended (probe green in every scenario).
  - A list whose first row holds a tab or newline keeps no pid, so the no-client outage ends the running terminals again.
  - The layout path and the ui store hold (mutants above).
  - The no-pid-at-start limit is ruling 1 (f): see Declined to judge.
- **3: holds.** The attach-target mutant fails 2 tests. The code is unchanged since round 1.
- **4: holds.** The report quotes `lsof` and `ls`, and my runs left port 8813 free and the scratch folder gone.
- **5: violated, narrowly (Standards 1).**
  - `DESIGN.md:361` states the running-tmux check and Attach to Session.
  - `HELP.md:127` states Attach to Session.
  - `HELP.md:146` and `DESIGN.md:154` state what is shared.
  - The doc comment of the changed `LIST_FORMAT` now contradicts itself.

**Cases**

| Case | Verdict | Evidence |
|---|---|---|
| 1 | met | Probe RED before the fixes (`noserverhidden` without the guard, above), green after. |
| 2 | met | 3 `channel-list` tests fail without the guard; 4 layout tests fail without the listener; 1 `ui-shared` case fails under the null-as-empty mutant. |
| 3 | met | Probe `ended` green in both shapes. |
| 4 | met | Store tests pass (1166 run). |
| 5 | met | Store tests pass. |
| 6 | met | `terminals.test.ts` passes. |
| 7 | met | `terminal-menu.test.ts` passes. |
| 8 | met | The target mutant fails it. |
| 9 | met | Store test passes. |
| 10 | met | Store tests pass. |
| 11 | met | The target mutant fails it. |
| 12 | met | `menu-words.test.ts` passes. |
| 13 | met | Report quotes and my cleanup lines. |
| 14 | met | Every probe event, `noserverhidden` included, is green in both page shapes. |
| 15 | met | Red without the listener. |
| 16 | met | `channel-list` out-of-order tests pass; the pid kept from a superseded read is untested (Proof 1). |
| 17 | partial | Met with a control client or a kept pid. Unmet when the list's first row holds a tab or newline and no control client runs (Spec 1). |
| 18 | met | Probe `usage` green. |
| 19 | met | Tests pass. |
| 20 | met | Tests pass. |
| 21 | met | Tests pass. |

### 1. Spec

- **`src/lib/server/machine/pty/sessions.ts:283-294`**:
  ```
  const SERVER_FIELD = 11;
  ...
  const row = text.split('\n').find((line) => line !== '');
  const field = row?.split('\t')[SERVER_FIELD];
  ```
  - **What is wrong.** Ruling 1 says the channel keeps the pid of its last list read that succeeded. `serverPid` takes field 11 of the first physical line.
    - A tab in the first row's folder shifts the fields.
    - A newline in its folder or name option cuts the row.
    - In each case the read succeeds, `parseTerminals` still lists every terminal, and `channel.ts:410` sets the kept pid to null.
    - Real tmux lists on my own socket gave null for a tab folder, a newline folder and a newline name. The pid 60420 was still the last field of the text each time.
    - The probe's own `oddcwd` and `oddname` scenarios treat these rows as real inputs.
    - The test at `sessions.test.ts:463` is titled "reads the tmux server pid from the last field of any row of the list". Its rows have exactly 12 fields, so it cannot tell field 11 from the last field.
  - **Fix.** Read the last tab field of the last non-empty line, which is always the pid. Add a test with a tab and a newline in the first row. Both are small and fit at landing.
  - **Failure scenario.**
    1. A shell in a Terminal tab `cd`s into a folder whose name holds a tab, and its session sorts first.
    2. Every Terminal tab has been off screen for longer than `IDLE_MS`.
    3. The socket is unreachable across an idle poll tick.
    4. The channel holds no pid, so it takes `[]` after the confirmations. Every page ends the running terminals and closes the tabs left with none.
  - **Verdict:** item 2 violated (narrowly); case 17 partial.

### 2. Proof

- **`src/lib/server/machine/pty/channel.ts:410`**: `if (!this.#stale(turn)) this.#serverPid = serverPid(text);`
  - **What is wrong.** No test binds the stale guard. With it removed, `npx vitest run tests/server/machine/pty tests/server/root` gives "Tests 294 passed (294)".
    - `agents/spec.md`, "What every package obeys", requires every asynchronous path to be exercised "superseded by a later one".
    - The `channel-list` case "asks about the server of the list read last" resolves the reads in order, so it does not cover a superseded one.
  - **Failure scenario.**
    1. Tmux server A exits and B starts while A's slow list read is in flight.
    2. B's read is taken, then A's read answers late. Without the guard, A's pid would be kept.
    3. With B's socket unreachable and no control client, the channel asks about A, which has exited, and publishes `[]` over B's running terminals.
    4. A later edit that drops the guard fails no test.
- **`src/lib/server/machine/pty/tmux.ts:108`**: `resolve(error === null && isTmuxCommand(stdout));`
  - **What is wrong.** Ruling 1 requires that a pid the system gave to another process is not tmux. The only test of that half is `sessions.test.ts:487`, `expect(await tmuxRuns(process.pid)).toBe(false)`, in a file tagged `// @module-tag slow`.
    - `agents/spec.md` says a slow file is left out of both `npm test` and `test:checks`, "the tests ... and nothing else".
    - With the `ps` check replaced by `resolve(true)`, the unit suite's filter gives "Tests 240 passed | 54 skipped (294)".
    - The assertion needs no tmux, and it fits in `tmux.test.ts`, which the suite runs.
  - **Failure scenario.**
    1. A later change drops the `ps` half, and `checks.sh` stays green.
    2. Tmux exits after its last terminal is killed, and the system gives its pid to another process.
    3. The channel then never takes the empty list, and the ended terminals stay listed and their tabs stay open for as long as that process lives.

### 3. Standards

- **`src/lib/server/machine/pty/sessions.ts:68-71`**: "and the last three the title, icon and colour the reader gave, ... The last is the pid of the tmux server that answered".
  - **What is wrong.** With `#{pid}` appended, the last three fields are icon, colour and pid. The unchanged first sentence is now false, and it contradicts the added one. `agents/spec.md` says "A sentence in a document or a head comment that the change makes false is a defect of the change", and item 5 asks for every such sentence to be corrected.
  - **Failure scenario.** A reader counts fields from the end as the comment says, puts the title at the wrong index in a new parser, and reads the icon as the title.
  - **Verdict:** item 5 violated (narrowly).

### 4. Behaviour

None. The round's "User-visible changes" table gives a before and after for each change:
- tmux unreachable with no page attached;
- tmux really exited;
- a fresh server with tmux unreachable at its first list;
- the unreadable stored ui value.

I found no user-visible change of the round that it leaves out.

### Declined to judge

- **No kept pid at start (ruling 1 (f)).** A dev server that has just started (for example after a save of `channel.ts`, the Z99 context) keeps no pid. A confirmed "no server" answer to its first list is then the empty list, and a restored page ends every terminal its tabs hold. The report states this as a limit, and ruling 1 (f) asks for this behaviour. Whether it is acceptable against item 2's "no `sessions` message leaves out a terminal tmux still runs" is the orchestrator's or the user's call.
- **`tmux: server` on Linux.** Not run on a Linux host. My judgment rests on tmux's `setproctitle` compat code, not on a run.
- **Browser behaviour.** The look of Attach to Session and live following between two browser tabs are DOM behaviour, for the look at landing.
- **Cause of the Z99 sighting.** Not established, and neither a read nor a rerun can settle it.
- **Side effects of my own commands**, stated so they are not taken for the builder's:
  - In the worktree: `npm run diagrams` (diagram hash unchanged) and `checks.sh` (build output, `.svelte-kit` and vitest caches are git-ignored). Status is still 45 lines and the shasum is unchanged.
  - The probe and the mutants ran only in `${TMPDIR}q7c`, now removed. That copy was made without `config/local.yml`, which was never read.
  - Each of my three probe server starts ran the Live HPC poller's read-only queries, which the brief accepts.
  - Every tmux command I ran named my own socket (`${TMPDIR}q7o/s`, `${TMPDIR}q7p/s`) or the probe's (`${TMPDIR}q7s`). All are killed and removed.
  - The checks output file is in my session scratchpad (`checks-r2.txt`).

Reviewer usage: tokens not visible to me; about 37 tool uses; about 30 minutes.

## Closed

The four findings of the run over repair round 2, each small and inside the brief, fixed on main at landing:

- Spec 1 (`serverPid` read field 11 of the first row): `serverPid` reads the last tab field of the last non-empty line, which is always the pid of the last row. The test "is found when the first row holds a tab or a newline in its folder or its title" (`tests/server/machine/pty/channel-list.test.ts`) failed on the unfixed code ("expected null to be 60420") and passes after. The pure `serverPid` cases moved from the slow `sessions.test.ts` into `channel-list.test.ts`, which `npm test` runs.
- Proof 1 (the stale guard on the kept pid untested): the case "keeps the server of a newer list when an older read answers after it" fails with the guard taken out of `channel.ts:410` ("expected [ 9003 ] to deeply equal [ 9002 ]") and passes with it.
- Proof 2 (the `ps` half of `tmuxRuns` tested only in a slow file): `tests/server/machine/pty/tmux.test.ts` gains "is not a running tmux for a live process that runs another command, or for no pid", which fails with the `ps` check replaced by `resolve(true)` ("expected true to be false") and passes with it.
- Standards 1 (the `LIST_FORMAT` comment contradicted itself): it now names the ninth to the eleventh fields as title, icon and colour and the twelfth and last as the pid.

Declined to judge, ruling 1 (f): a dev server that has just started keeps no pid, so a confirmed "no server" answer to its first list is the empty list. That is what round 2's ruling 1 (f) asks; it stays as ruled and is named in the landing report.
