# Step Q107 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q107, base dcef00c9)

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
