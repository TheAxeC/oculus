Everything in the brief is done.

One thing the brief asks about is not established, and the report says so in section 4: none of the events the brief lists as the suspected cause of the Z99 sighting (the dev server loading `channel.ts` again, a restart, a reconnect, a burst of starts, the usage session) made the page end a running terminal on the unchanged tree. The one list event that did is tmux answering "no server" or "error connecting" for a moment. Whether that is what Z99 saw is not known; it is a cause that produces the same sighting, it is fixed, and the layout path (ruled Z115 (a)) is fixed too.

## 1. Open items (state file, `## Open items`, verbatim)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z113 (raised 2026-09-30 21:40, step Q106 "Close pane on a pane of two or more tabs closes it after Confirm", its diagnosis, `agents/reviews/Q106-diagnosis.md`). The cause is found: `Modal.svelte:69-71` gives focus back to the control that had it from inside an effect's cleanup, the control's focus handler (PaneView's `entered`, `PaneView.svelte:139-142`) runs inside that teardown, and there Svelte 5.57.1 answers every `$state` read with the value from before the flush's first write, so `activateInstance` writes the tree from before the close back. The palette has the same defect (Cmd+K, then Deposit: the choice is undone). The fix gives the focus back one microtask later, and only while nothing else holds it (`giveBackQuietly` in `quiet-focus.ts`). A rule clash stands on the test: `agents/spec.md:56` says "A behaviour that needs a DOM (a press, a focus, an effect) is seen at the look on landing. The unit suite renders to a string", and the `diagnose` skill (Steps 16) gives a defect whose failure costs something a test where it occurs. That test exists only in a second vitest project, `client`, which loads Svelte's client runtime with no DOM library (`tests/ui/frame/client-runtime.ts`, a stubbed `document` and `HTMLElement`) for files named `*.client.test.ts`; its five cases fail 4 of 5 without the fix and pass 5 of 5 with it, and the other 370 test files are collected as before.
  - (a) Keep the `client` project and the test in Q106, and `spec.md:56` gains the sentence that an effect's timing (a teardown, a flush) is tested in a `*.client.test.ts` file, other DOM behaviour still at the look. For: the defect, which already has two shapes (the pane and the palette), cannot return unseen; the project reaches what no other test can. Against: a second test environment and a changed `vite.config.ts` to keep up; a stubbed DOM that a later case may need to widen.
  - (b) The fix with no test; the look on landing checks the pane close and the palette. For: the suite keeps one environment and `spec.md:56` stands. Against: nothing stops a later dialog or effect from bringing the same stale write back; the look sees it only when someone closes a pane on the way.
  - Recommendation: (a), since the defect sits in an effect's teardown, which only this project reaches, and it has already appeared in two places. (b) is the lazy option.
- Z115 (raised 2026-09-30 22:16, step Q107 "a Terminal tab never closes while its terminals run", its brief check, `agents/reviews/Q107-brief-check.md` section 2). What the tree shows: the page saves its whole workbench, every page, under one localStorage key, `oculus.layout.v1` (`src/lib/state/workbench/layout/saved/storage.ts:14`), on every layout change (`savePages` in `layout.svelte.ts`), and nothing listens for another browser tab's writes (`grep -rn "addEventListener('storage'" src` prints nothing). With two browser tabs of one server open (yours and the TEST tab, for example), a layout change in one saves a workbench without the Terminal tab the other added, and the reload Vite makes after a restart (`client.mjs:1031-1036`) restores that. That is a Terminal tab gone while tmux lists its terminals, as Z99 saw. Q107's builder reproduces this path in the unit suite beside the `sessions` list path and fixes whichever is red; the fix of this path changes how two browser tabs share one workbench, which is yours to rule. The builder builds everything else meanwhile.
  - (a) Every browser tab follows the saved workbench: the layout store listens for the `storage` event and takes the workbench another browser tab saved; the page each browser tab shows (`current`) is kept per browser tab. For: one workbench, as the single key already means; nothing one tab adds is lost to the other or to a reload. Against: a change in one browser tab rearranges the other's panes live.
  - (b) A save merges by page: a browser tab re-reads the stored workbench and writes back only the pages it changed. For: each tab keeps its own view until it reloads. Against: two tabs changing the same page still overwrite each other; each tab holds a diverging copy in memory until reload; more code.
  - (c) One saved workbench per browser tab (a tab id in the key). For: no tab touches another. Against: a new browser tab starts from the default workbench, not yours; the saved workbenches pile up.
  - (d) Nothing built for this path. Against: a Terminal tab (or any tab) added in one browser tab is lost whenever the other saves; the closing Z99 saw can recur. This is the lazy option.
  - Recommendation: (a), since the workbench is already one saved value and (a) makes every browser tab agree with it instead of overwriting it.
- Z116 (raised 2026-09-30 22:16, step Q107, its brief check, `agents/reviews/Q107-brief-check.md` "Item 3 against the existing code"). Z99 (a) rules that a Terminal tab offers the running terminals no tab owns, and names no place, words or label; the brief takes them as reversible decisions, and the builder builds them now; a different ruling is fixed at Q107's landing. The Sessions view already lists such terminals and takes one in on a press (`TerminalRows.svelte:2-6`, `HELP.md:125`).
  - (a) A submenu "Attach to Session" (VS Code's command name) in the Terminal bar's kinds dropdown and in the terminal list's empty-area menu, beside New Terminal, like Join Terminals; each entry labelled as the Sessions row labels it (title, or name when the title is empty); the chosen terminal joins this tab at the end and is shown alone, as the Sessions view's press shows it. For: reachable from inside the tab where the terminals went missing; same words as VS Code; same label and placement rule the Sessions view already uses. Against: two menus grow by one item.
  - (b) As (a), but the chosen terminal is shown beside the terminals on screen, as Join Terminals does. For: nothing on screen is hidden. Against: a narrow pane splits further with every pick.
  - (c) No menu item; the Sessions view's list stays the only offer. Against: Z99 (a) asks for the offer in the Terminal tab; this is the lazy option.
  - Recommendation: (a).

Z115 has been ruled (a) by the orchestrator's message and is built (sections 6 and 7). Z116 is built as the brief states it (Attach to Session in the bar's kinds dropdown and the list's empty-area menu, labelled as the Sessions row labels it, joined at the end and shown alone); a different ruling is fixed at landing.

## 2. The cases' first run on the unchanged tree

How each row was run. The source under `src/` was unchanged when the new tests and the probe first ran. Cases 1, 14, 17 and 18, and the tmux half of 3, were run on the probe (`node .scratch/migration/agents/reviews/Q107-probe.mjs`, output in section 3). The cases that are tests were run as `npx vitest run tests/state/sessions/terminals.test.ts tests/state/client/terminal/terminal-tabs.test.ts tests/views/sessions/terminal-menu.test.ts tests/ui/menu/menu-words.test.ts` with the new tests in place; the tests that failed, verbatim from that run:

```
FAIL tests/views/sessions/terminal-menu.test.ts > Attach to Session > audits that the kinds dropdown and the list empty area menu each hold a submenu of the unowned terminals, in the order handed
FAIL tests/views/sessions/terminal-menu.test.ts > Attach to Session > audits that the submenu sits after the kinds and the prompt in the dropdown, and after New Terminal in the empty area menu
FAIL tests/views/sessions/terminal-menu.test.ts > Attach to Session > audits that two terminals of one label are two entries with different pick ids
FAIL tests/views/sessions/terminal-menu.test.ts > Attach to Session > audits that an Attach pick is not read as a Join or a Profile pick, and theirs are not read as an Attach pick
FAIL tests/views/sessions/terminal-menu.test.ts > Attach to Session > audits that the list item, an empty pick and another item name no terminal
FAIL tests/ui/menu/menu-words.test.ts > the words of every right-click menu > audits that words every label through t, but for the names it was handed
FAIL tests/ui/menu/menu-words.test.ts > the words of every right-click menu > audits that passes each name from data through exactly as it was handed
FAIL tests/state/client/terminal/terminal-tabs.test.ts > attaching a terminal no tab owns > offers the listed terminals no Terminal tab on any page owns, in list order
FAIL tests/state/client/terminal/terminal-tabs.test.ts > attaching a terminal no tab owns > does not offer a terminal started here and not listed yet, nor once it is listed and its tab owns it
FAIL tests/state/client/terminal/terminal-tabs.test.ts > attaching a terminal no tab owns > puts the chosen terminal at the end of the tab, shows it in the row and activates the tab; no other tab changes
FAIL tests/state/client/terminal/terminal-tabs.test.ts > attaching a terminal no tab owns > takes a tab composing alone out of its composer: the tab owns the terminal and shows it
FAIL tests/state/client/terminal/terminal-tabs.test.ts > attaching a terminal no tab owns > changes nothing for a terminal the latest list no longer names
FAIL tests/state/client/terminal/terminal-tabs.test.ts > attaching a terminal no tab owns > changes nothing for a terminal another Terminal tab took after the menu was opened
FAIL tests/state/client/terminal/terminal-tabs.test.ts > attaching a terminal no tab owns > changes nothing for a tab no page holds, an id that is not a terminal, or a foreign terminal
FAIL tests/state/client/terminal/terminal-tabs.test.ts > attaching a terminal no tab owns > joins the tab it is chosen from, and not a Terminal tab of another page
FAIL tests/state/sessions/terminals.test.ts > the terminals no Terminal tab owns > are the listed ones no tab on any page owns, in list order
FAIL tests/state/sessions/terminals.test.ts > the terminals no Terminal tab owns > are none while no list has been heard
FAIL tests/state/sessions/terminals.test.ts > the terminals no Terminal tab owns > leave out a terminal a tab owns that the list does not name, and count none the list lacks
FAIL tests/state/sessions/terminals.test.ts > the terminals no Terminal tab owns > leave out a foreign terminal, as Join Terminals does
FAIL tests/state/sessions/terminals.test.ts > a terminal's label > is its title when it has been renamed, and its name when the title is empty
```

```
 Test Files  4 failed (4)
      Tests  20 failed | 72 passed (92)
```

The server-side cases were run against a copy of `src/lib/server/machine/pty/channel.ts` whose `refresh()` is the read without a turn and without confirmation (`run(listArgs())`, then `#took(parseTerminals(text))`, and `#took([])` on a "no server" message), as the brief describes the base at `channel.ts:333-345`; `npx vitest run tests/server/machine/pty/channel-list.test.ts tests/server/machine/pty/channel.test.ts`:

```
     FAIL never replace a newer list with the answer of an older read 7ms
     FAIL changes nothing and tells nobody 1ms
     FAIL leaves no timer behind when it closes while a no-server answer waits to be confirmed 0ms
     FAIL is not an empty list while a further read lists the terminals again 1ms
     FAIL is the empty list once the confirming reads say it too 0ms
     FAIL is given up on when a newer read has listed the terminals meanwhile 1ms
     FAIL is the first list when nothing was listed before, once it is confirmed 0ms
------- Failed Tests 7 -------
 Test Files  1 failed | 1 passed (2)
      Tests  7 failed | 27 passed (34)
```

The layout case was run with the store's `storage.follow(source, takeSaved)` call replaced by a no-op, which is the base's behaviour (nothing listens for another browser tab's write); `npx vitest run tests/state/workbench/layout/saved/layout-shared.test.ts`:

```
     FAIL keep a Terminal tab one of them added when the other saves a change, and after a reload 8ms
     FAIL show the page the save names when the page shown is gone from it 3ms
     FAIL take the save of another tab while still waiting for the rail to choose their first page 1ms
     FAIL follow the newest window when loaded again, and not the one before it 0ms
------- Failed Tests 4 -------
 FAIL  tests/state/workbench/layout/saved/layout-shared.test.ts > two browser tabs of one server > keep a Terminal tab one of them added when the other saves a change, and after a reload
 FAIL  tests/state/workbench/layout/saved/layout-shared.test.ts > two browser tabs of one server > show the page the save names when the page shown is gone from it
 FAIL  tests/state/workbench/layout/saved/layout-shared.test.ts > two browser tabs of one server > take the save of another tab while still waiting for the rail to choose their first page
 FAIL  tests/state/workbench/layout/saved/layout-shared.test.ts > two browser tabs of one server > follow the newest window when loaded again, and not the one before it
 Test Files  1 failed (1)
      Tests  4 failed | 4 passed (8)
```

| Case | First run on the unchanged tree |
|---|---|
| 1 | Probe, all scenarios: RED for `noserver` only, in both page shapes, both shells answered as ended. `save`, `restart`, `reconnect`, `burst`, `usage`, `oddcwd`, `oddname` and `ended` were green. Three runs in section 3. |
| 2 | `channel-list.test.ts` fails 7 of its 11 cases on the base `refresh()` (list above); `layout-shared.test.ts` fails 4 of its 8 on the base layout store (list above). |
| 3 | Passes on the base: `terminal-tabs.test.ts` "a terminal that ended > leaves the tab that owned it, and a tab owning only it closes, on a page not on screen too" (a tab owning A and B keeps B when A ends); probe `ended` green, the killed terminal answered and the other not. |
| 4 | Passes on the base: the same test (a tab owning only A closes when A leaves the list; the reader is not composing). |
| 5 | Passes on the base: "a terminal that ended > leaves a tab the reader is composing in open, its composer alone and its record kept". |
| 6 | Fails on the base (the function does not exist): the 4 cases of "the terminals no Terminal tab owns" in `terminals.test.ts`. |
| 7 | Fails on the base: 5 of the 6 cases of "Attach to Session" in `terminal-menu.test.ts`; the sixth ("drawn only while a terminal can be attached, and the menus are as before without it") passes, since on the base no menu has the item. |
| 8 | Fails on the base: "puts the chosen terminal at the end of the tab, shows it in the row and activates the tab; no other tab changes". |
| 9 | Fails on the base: "takes a tab composing alone out of its composer: the tab owns the terminal and shows it". |
| 10 | Fails on the base: "changes nothing for a terminal the latest list no longer names" and "changes nothing for a terminal another Terminal tab took after the menu was opened". |
| 11 | Fails on the base: "joins the tab it is chosen from, and not a Terminal tab of another page". |
| 12 | Base: `menu-words.test.ts` fails 2 of 3 (the two that call the builders with the new argument), "asks t only for keys the catalog holds" passes. |
| 13 | Run after cleanup, section 9. |
| 14 | The two pure cases "end none of the terminals a list keeps, after a reload / after a reconnect" pass on the base, since `endedTerminals` is unchanged; the list path in both shapes is the probe's `noserver`, RED on the base. |
| 15 | RED on the base: 4 of 8 cases of `layout-shared.test.ts`, among them "keep a Terminal tab one of them added when the other saves a change, and after a reload". |
| 16 | Passes on the base: "does not reach a tab owning a terminal started here and not listed yet" and "leave out a terminal started here that no message has listed yet". Fails on the base: `channel-list.test.ts` "never replace a newer list with the answer of an older read", and the Attach case "does not offer a terminal started here and not listed yet". |
| 17 | RED on the base: probe `noserver`, and `channel-list.test.ts` "is not an empty list while a further read lists the terminals again". |
| 18 | Green on the base: probe `usage`, 0 terminals answered. |
| 19 | Fails on the base: "leave out a foreign terminal, as Join Terminals does" in `terminals.test.ts` and, in `terminal-tabs.test.ts`, "changes nothing for a tab no page holds, an id that is not a terminal, or a foreign terminal". |
| 20 | Fails on the base: "two terminals of one label are two entries with different pick ids" and "an Attach pick is not read as a Join or a Profile pick, and theirs are not read as an Attach pick". |
| 21 | Fails on the base: "a terminal's label > is its title when it has been renamed, and its name when the title is empty". |

No case had an expected result that the brief's rules get wrong.

## 3. The red commands, three runs each

The probe (whole, in section 4) is run from `tools/oculus` of the worktree:

```
node .scratch/migration/agents/reviews/Q107-probe.mjs [--list] [name ...]
```

It starts a dev server of its own on port 8797 with `HOME` and `TMUX_TMPDIR` set on that one process to folders under `$TMPDIR/q107s`, and stops it, kills its own tmux socket's server and removes the scratch folder when it ends. The red command is `node .scratch/migration/agents/reviews/Q107-probe.mjs noserver`.

Base, run 1 (all scenarios, `node .scratch/migration/agents/reviews/Q107-probe.mjs`):

```
green save / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green save / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
    the socket of the open client closed, so the dev server restarted
green restart / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green restart / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green reconnect / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green reconnect / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green burst / page shape reload: 6 lists, endedTerminals answers 0 terminal(s) tmux still lists (62 running)
green burst / page shape reconnect: 8 lists, endedTerminals answers 0 terminal(s) tmux still lists (62 running)
RED noserver / page shape reload: 3 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)
    answered 70037e-shell at list 1; that list held []
    answered bc3ceb-shell at list 1; that list held []
RED noserver / page shape reconnect: 5 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)
    answered 70037e-shell at list 3; that list held []
    answered bc3ceb-shell at list 3; that list held []
    while the socket is away tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
green usage / page shape reload: 0 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green usage / page shape reconnect: 2 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green oddcwd / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (3 running)
green oddcwd / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (3 running)
green oddname / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (3 running)
green oddname / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (3 running)
RESULT: RED
exit=1
```

Base, run 2 (`noserver`):

```
RED noserver / page shape reload: 2 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)
    answered 2ef5b1-shell at list 0; that list held []
    answered fec21f-shell at list 0; that list held []
RED noserver / page shape reconnect: 4 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)
    answered 2ef5b1-shell at list 2; that list held []
    answered fec21f-shell at list 2; that list held []
    while the socket is away tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
RESULT: RED
exit=1
```

Base, run 3 (`noserver`):

```
RED noserver / page shape reload: 2 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)
    answered e4e269-shell at list 0; that list held []
    answered fbace7-shell at list 0; that list held []
RED noserver / page shape reconnect: 4 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)
    answered e4e269-shell at list 2; that list held []
    answered fbace7-shell at list 2; that list held []
    while the socket is away tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
RESULT: RED
exit=1
```

After the fix, on the final tree, run 1 (all scenarios):

```
green save / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green save / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
    the socket of the open client closed, so the dev server restarted
green restart / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green restart / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green reconnect / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green reconnect / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green burst / page shape reload: 6 lists, endedTerminals answers 0 terminal(s) tmux still lists (62 running)
green burst / page shape reconnect: 8 lists, endedTerminals answers 0 terminal(s) tmux still lists (62 running)
green noserver / page shape reload: 2 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
green noserver / page shape reconnect: 4 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
    while the socket is away tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
green ended / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (1 running); the killed terminal was answered
green ended / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (1 running); the killed terminal was answered
green usage / page shape reload: 0 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green usage / page shape reconnect: 2 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green oddcwd / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (3 running)
green oddcwd / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (3 running)
green oddname / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (3 running)
green oddname / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (3 running)
RESULT: green
exit=0
```

After the fix, run 2 (`noserver`):

```
green noserver / page shape reload: 2 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
green noserver / page shape reconnect: 4 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
    while the socket is away tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
RESULT: green
exit=0
```

After the fix, run 3 (`noserver`):

```
green noserver / page shape reload: 2 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
green noserver / page shape reconnect: 4 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
    while the socket is away tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
RESULT: green
exit=0
```
## 4. The cause

**List path (the `sessions` payload).** `Terminals.refresh()` of `src/lib/server/machine/pty/channel.ts` took one `list-sessions` answer as the truth: a message tmux refuses with "no server running on" or "error connecting to ... (No such file or directory)" (`noServer`, `channel.ts:591`) made the list `[]`, and it did so on a single answer although tmux gives that answer for a moment while its socket is unreachable and the sessions still run. The `sessions` payload then carried `[]`, `endedTerminals` answered every terminal the page knew, and `closeEnded` took them out of their tabs and closed the tabs. Reads also ran without a turn, so an older reply resolving after a newer one put the older list back, and a reply that arrived after `close()` was applied.

The probe shows it: `node .scratch/migration/agents/reviews/Q107-probe.mjs noserver` opens its own tmux control client, moves the socket file away for 400 ms, and makes the server read the list while the path is gone (the line "while the socket is away tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)" is tmux's own answer in that window). On the base the server published `[]` and `endedTerminals` answered both running shells in both page shapes, three runs out of three (section 3). After the fix the same command is green three runs out of three: the server reads again 300 ms later, finds the terminals, and publishes no empty list.

The fix is in `channel.ts`: `refresh()` (`:356`) gives each read a turn, `#read` (`:371`) reads a "no server" answer again `NO_SERVER_CONFIRMS` (2) times, `NO_SERVER_CONFIRM_MS` (300) ms apart, and takes `[]` only when every read said it; `#take` (`:397`) drops an answer that a read started later has replaced or that arrives after `close()` (`#stale`, `:392`); `#pause` (`:404`) is woken by `close()` so no timer outlives the channels. Any other failure still keeps the last list. The place is the cause: `closeEnded` and `endedTerminals` are unchanged, since they act correctly on a list that is right.

**What the probe did not reproduce.** The events the brief names as the suspected origin of the Z99 sighting were each run on the unchanged tree and each left every running terminal listed: `save` (the file rewritten with its own bytes; the dev server restarted, as "the socket of the open client closed, so the dev server restarted" says), `restart`, `reconnect`, `burst` (6 busy loops, 6 rounds of 10 concurrent starts, 62 sessions running), `usage` (the usage session's start and kill), `oddcwd` (a newline in a working directory) and `oddname` (a newline in `@oculus_name`). So which event made tmux unreachable at 16:15 is not known; the fixed read is correct for any cause that makes a single read fail as "no server", and the sighting is not shown to be that cause. A tmux that has exited is indistinguishable from one that is unreachable for longer than the two confirming reads (0.6 s); that case is taken as the empty list, as before.

**Layout path (Z115 (a)).** The workbench of every page is one localStorage value (`LAYOUT_KEY` = `oculus.layout.v1`, `src/lib/state/workbench/layout/saved/storage.ts:18`) and no code listened for another browser tab's write, so a save from the second browser tab overwrote the Terminal tab the first had added. `layout-shared.test.ts` with the listener removed fails 4 of 8 cases, among them "keep a Terminal tab one of them added when the other saves a change, and after a reload" (section 2). The fix: `follow` (`storage.ts:87`) listens for the `storage` event of `LAYOUT_KEY` on a window; the layout store's `takeSaved` (`src/lib/state/workbench/layout.svelte.ts:301`) re-reads the saved pages and takes them at once, keeps the page the tab shows (else the saved current page), and writes nothing back; `loadLayout(held, source)` (`:321`) follows one window, `stopFollowing` (`:627`) ends it; `src/routes/+page.svelte:210` passes `window` and calls `stopFollowing` on unmount.

The probe script, whole:

```
// Q107 probe: does a `sessions` list ever leave out a terminal tmux still runs, and does the page's
// `endedTerminals` then answer it as ended?
//
// Run from tools/oculus (any checkout or worktree that holds this file):
//
//     PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH node .scratch/migration/agents/reviews/Q107-probe.mjs [--list] [name ...]
//
// It starts its own dev server on Q107_PORT (default 8797) with HOME and TMUX_TMPDIR set on that one
// process to folders of Q107_SCRATCH (default ${TMPDIR}q107s), so the server's ~/.oculus and its
// tmux server are its own. Every tmux command names that socket with -S. It refuses to run when
// TMUX is set, when the port is taken, or when the socket path would pass the 104 bytes a unix
// socket holds. It stops its server, kills the tmux server of its own socket and removes the
// scratch folder when it ends, unless Q107_KEEP=1.
//
// Each scenario makes one event happen with shells running and a client subscribed to `sessions`,
// records every payload, and feeds the recorded lists to `endedTerminals` in the two shapes the page
// gives them: after a reload (first list, `held` every terminal the restored tabs hold, `seen`
// empty) and after a reconnect without a reload (`seen` carried over from the earlier lists). A
// scenario is RED when endedTerminals answers a terminal that tmux still lists. The exit code is 1
// when any scenario ran RED.

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import net from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const here = dirname(fileURLToPath(import.meta.url));
const oculus = resolve(here, '../../../..');
const PORT = Number(process.env.Q107_PORT ?? 8797);
const SCRATCH = process.env.Q107_SCRATCH ?? `${process.env.TMPDIR ?? '/tmp/'}q107s`.replace('//', '/');
const HOME_DIR = join(SCRATCH, 'h');
const TMUX_DIR = join(SCRATCH, 'tm');
const UID = process.getuid();
const SOCKET = join(TMUX_DIR, `tmux-${UID}`, 'default');
const ORIGIN = `http://127.0.0.1:${PORT}`;
const CHANNEL_FILE = join(oculus, 'src/lib/server/machine/pty/channel.ts');
const log = (...parts) => console.log(...parts);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

if (PORT === 8787 || PORT === 8790) throw new Error(`port ${PORT} belongs to the user`);
if (process.env.TMUX !== undefined) throw new Error('TMUX is set: this probe must not run inside tmux');
if (Buffer.byteLength(SOCKET) >= 100) throw new Error(`socket path too long: ${SOCKET}`);

function tmux(...args) {
    return spawnSync('tmux', ['-S', SOCKET, ...args], { encoding: 'utf8' });
}

/** The oculus terminals tmux lists on the probe's socket. */
function tmuxTerminals() {
    const out = tmux('list-sessions', '-F', '#{session_name}');
    if (out.status !== 0) return [];
    return out.stdout
        .split('\n')
        .filter((name) => name.startsWith('oculus-') && !name.startsWith('oculus-usage-'))
        .map((name) => name.slice('oculus-'.length));
}

function killTerminals() {
    for (const id of tmuxTerminals()) tmux('kill-session', '-t', `oculus-${id}`);
}

async function portFree() {
    return new Promise((done) => {
        const probe = net.connect({ port: PORT, host: '127.0.0.1' });
        probe.on('connect', () => {
            probe.destroy();
            done(false);
        });
        probe.on('error', () => done(true));
    });
}

let server = null;
let serverLog = '';

async function startServer() {
    if (!(await portFree())) throw new Error(`port ${PORT} is in use`);
    mkdirSync(HOME_DIR, { recursive: true });
    mkdirSync(TMUX_DIR, { recursive: true });
    const vite = join(oculus, 'node_modules/vite/bin/vite.js');
    server = spawn(process.execPath, [vite, 'dev', '--port', String(PORT), '--strictPort'], {
        cwd: oculus,
        env: { ...process.env, HOME: HOME_DIR, TMUX_TMPDIR: TMUX_DIR },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true
    });
    serverLog = '';
    server.stdout.on('data', (chunk) => (serverLog += chunk));
    server.stderr.on('data', (chunk) => (serverLog += chunk));
    const gone = new Promise((done) => server.once('exit', done));
    server.exited = gone;
    for (let waited = 0; waited < 90000; waited += 500) {
        try {
            const reply = await fetch(`${ORIGIN}/`);
            if (reply.status === 200) return;
        } catch {
            // not listening yet
        }
        await sleep(500);
    }
    throw new Error(`server did not answer in 90 s\n${serverLog}`);
}

/** Stop the probe's own server: its process group only. */
async function stopServer() {
    if (server === null) return;
    const current = server;
    server = null;
    try {
        process.kill(-current.pid, 'SIGTERM');
    } catch {
        // already gone
    }
    await Promise.race([current.exited, sleep(8000)]);
    try {
        process.kill(-current.pid, 'SIGKILL');
    } catch {
        // already gone
    }
    for (let waited = 0; waited < 10000 && !(await portFree()); waited += 250) await sleep(250);
}

async function restartServer() {
    await stopServer();
    await startServer();
}

async function token() {
    const reply = await fetch(`${ORIGIN}/__data.json`);
    const body = await reply.json();
    const data = body.nodes.find((node) => node && node.type === 'data').data;
    return data[data[0].token];
}

async function post(tokenText, body) {
    const reply = await fetch(`${ORIGIN}/api/terminal`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN, 'x-oculus-token': tokenText },
        body: JSON.stringify(body)
    });
    return { status: reply.status, json: await reply.json() };
}

/** Start a shell terminal the way the page does and answer its id. */
async function startShell(tokenText, name) {
    const reply = await post(tokenText, { action: 'start', kind: 'shell', cwd: SCRATCH, cols: 80, rows: 24, name });
    if (!reply.json.ok) throw new Error(`start refused: ${JSON.stringify(reply.json)}`);
    return reply.json.terminal.id;
}

/** A client subscribed to `sessions`, recording every payload with the time it came. */
function client() {
    const records = [];
    const socket = new WebSocket(`ws://127.0.0.1:${PORT}/ws`, { headers: { Origin: ORIGIN } });
    const opened = new Promise((done, fail) => {
        socket.once('open', () => {
            socket.send(JSON.stringify({ type: 'subscribe', channels: ['sessions'] }));
            done();
        });
        socket.once('error', fail);
    });
    socket.on('message', (data) => {
        const message = JSON.parse(String(data));
        if (message.channel !== 'sessions') return;
        const list = message.payload?.terminals;
        records.push({
            at: Date.now(),
            ids: Array.isArray(list) ? list.map((one) => one.id) : null
        });
    });
    return { records, opened, socket, close: () => socket.terminate() };
}

/** Wait until the last recorded list holds every id (or the time runs out). */
async function listed(recorder, ids, ms = 15000) {
    for (let waited = 0; waited < ms; waited += 200) {
        const last = [...recorder.records].reverse().find((one) => one.ids !== null);
        if (last && ids.every((id) => last.ids.includes(id))) return true;
        await sleep(200);
    }
    return false;
}

// The page's own function, loaded through Vite as the page loads it.
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

async function loadEnded() {
    const vite = await createServer({
        root: oculus,
        configFile: false,
        appType: 'custom',
        logLevel: 'error',
        server: { middlewareMode: true, hmr: false, watch: null },
        optimizeDeps: { noDiscovery: true, include: [] },
        plugins: [svelte({ compilerOptions: { runes: true } })]
    });
    const module = await vite.ssrLoadModule('/src/lib/state/sessions/terminals.svelte.ts');
    return { ended: module.endedTerminals, close: () => vite.close() };
}

/**
 * The terminals endedTerminals answers over a run of lists, as the page calls it: `first` for the
 * first list heard, `held` the terminals its tabs hold then, `seen` grown by every list.
 */
function answers(ended, lists, held) {
    const seen = new Set();
    const out = [];
    lists.forEach((now, at) => {
        const gone = ended(seen, now, at === 0, at === 0 ? held : []);
        for (const id of gone) out.push({ id, list: at, now });
        for (const id of now) seen.add(id);
    });
    return out;
}

/** Judge one recorded run in the two page shapes. */
function judge(ended, before, after, initial, running, killed) {
    const beforeLists = before.records.filter((one) => one.ids !== null).map((one) => one.ids);
    const afterLists = after.records.filter((one) => one.ids !== null).map((one) => one.ids);
    const shapes = {
        // The page reloaded: its next list is a first list, and its restored tabs hold every terminal.
        reload: answers(ended, afterLists, initial),
        // The page kept running: its `seen` carries the lists heard before the event.
        reconnect: answers(ended, [...beforeLists, ...afterLists], [])
    };
    const report = {};
    for (const [shape, found] of Object.entries(shapes)) {
        const wrong = found.filter((one) => running.includes(one.id));
        const missed = killed !== undefined && !found.some((one) => one.id === killed);
        report[shape] = { wrong, missed, killed, lists: shape === 'reload' ? afterLists.length : beforeLists.length + afterLists.length };
    }
    return report;
}

const scenarios = {
    // The dev server loads channel.ts again after a save: the file is rewritten with its own bytes.
    async save(ctx) {
        const held = ctx.recorder;
        const closed = new Promise((done) => held.socket.once('close', () => done(true)));
        writeFileSync(CHANNEL_FILE, readFileSync(CHANNEL_FILE));
        const restarted = await Promise.race([closed, sleep(20000).then(() => false)]);
        ctx.note = `the socket of the open client ${restarted ? 'closed, so the dev server restarted' : 'stayed open, so the dev server did not restart'}`;
        await waitServerBack();
        return {};
    },
    // The server is stopped and started again.
    async restart() {
        await restartServer();
        return {};
    },
    // The socket closes and opens again; the server stays.
    async reconnect() {
        return {};
    },
    // A start that fires refresh() calls in a burst, with the machine loaded so replies can cross.
    async burst(ctx) {
        const load = [];
        for (let n = 0; n < 6; n += 1) {
            load.push(spawn(process.execPath, ['-e', 'for(;;){}'], { stdio: 'ignore' }));
        }
        try {
            const extra = [];
            for (let round = 0; round < 6; round += 1) {
                const made = await Promise.all(
                    Array.from({ length: 10 }, (_, n) => startShell(ctx.token, `burst-${round}-${n}`).catch(() => null))
                );
                extra.push(...made.filter((id) => id !== null));
                await sleep(1200);
            }
            ctx.started.push(...extra);
        } finally {
            for (const child of load) child.kill('SIGKILL');
        }
        return { keepRecording: true };
    },
    // One list read fails as "no server" while sessions run. A page is attached to a terminal, so the
    // server holds a control client; the probe holds one of its own, opened before the socket file is
    // moved away for 400 ms. A session created through the probe's connection (which needs no socket
    // path) makes the server's control client report `%sessions-changed`, and the server reads the
    // list by path while the path is gone. The socket is then given back and a second session is
    // created, which is the next read.
    async noserver(ctx) {
        const page = new WebSocket(`ws://127.0.0.1:${PORT}/ws`, { headers: { Origin: ORIGIN } });
        await new Promise((done, fail) => {
            page.once('open', () => {
                page.send(JSON.stringify({ type: 'subscribe', channels: [`pty:${ctx.started[0]}`], token: ctx.token }));
                done();
            });
            page.once('error', fail);
        });
        await sleep(2500);
        const mine = spawn('tmux', ['-S', SOCKET, '-C', 'attach-session', '-t', `oculus-${ctx.started[1]}`], {
            stdio: ['pipe', 'pipe', 'ignore']
        });
        await sleep(1000);
        const away = `${SOCKET}.away`;
        renameSync(SOCKET, away);
        const probe = tmux('list-sessions');
        ctx.note = `while the socket is away tmux says: ${probe.stderr.trim().replace(SCRATCH, '<scratch>')}`;
        mine.stdin.write('new-session -d -s oculus-f1e2d3-shell\n');
        ctx.started.push('f1e2d3-shell');
        await sleep(400);
        renameSync(away, SOCKET);
        await sleep(1500);
        tmux('new-session', '-d', '-s', 'oculus-f1e2d4-shell');
        ctx.started.push('f1e2d4-shell');
        await sleep(3500);
        mine.kill();
        page.terminate();
        return { keepRecording: true };
    },
    // A terminal that really ends: its tmux session is killed on the probe's socket while the page is
    // attached to the other one, so the server's control client reports the change at once. The
    // killed terminal must be answered as ended and the other one must not.
    async ended(ctx) {
        const page = new WebSocket(`ws://127.0.0.1:${PORT}/ws`, { headers: { Origin: ORIGIN } });
        await new Promise((done, fail) => {
            page.once('open', () => {
                page.send(JSON.stringify({ type: 'subscribe', channels: [`pty:${ctx.started[1]}`], token: ctx.token }));
                done();
            });
            page.once('error', fail);
        });
        await sleep(2500);
        tmux('kill-session', '-t', `oculus-${ctx.started[0]}`);
        await sleep(4000);
        page.terminate();
        return { keepRecording: true, killed: ctx.started[0] };
    },
    // The usage refresh's session starts and is killed beside the terminals.
    async usage(ctx) {
        tmux('new-session', '-d', '-s', 'oculus-usage-probe', '-x', '80', '-y', '24');
        await sleep(2500);
        tmux('kill-session', '-t', 'oculus-usage-probe');
        await sleep(3500);
        return { keepRecording: true };
    },
    // A running terminal whose shell sits in a folder named with a newline, which the list format
    // (tab separated, one row per line) would split in two; a refresh follows.
    async oddcwd(ctx) {
        const folder = join(SCRATCH, 'odd\nfolder');
        mkdirSync(folder, { recursive: true });
        tmux('send-keys', '-t', `oculus-${ctx.started[0]}`, `cd "$(printf 'odd\\nfolder')" && pwd`, 'Enter');
        await sleep(1500);
        ctx.started.push(await startShell(ctx.token, 'refresh'));
        await sleep(3000);
        return { keepRecording: true };
    },
    // A running terminal whose name option holds a newline (the endpoint refuses one, tmux does not).
    async oddname(ctx) {
        tmux('set-option', '-t', `oculus-${ctx.started[0]}`, '@oculus_name', 'two\nlines');
        ctx.started.push(await startShell(ctx.token, 'refresh'));
        await sleep(3000);
        return { keepRecording: true };
    }
};

async function waitServerBack() {
    // Vite restarts its own server on a save of a file the config imports; the old socket closes
    // first, then the port answers again.
    await sleep(2000);
    for (let waited = 0; waited < 90000; waited += 500) {
        try {
            const reply = await fetch(`${ORIGIN}/`);
            if (reply.status === 200) return;
        } catch {
            // restarting
        }
        await sleep(500);
    }
    throw new Error('the server did not come back after the save');
}

async function run(name, ended) {
    killTerminals();
    const tokenText = await token();
    const recorder = client();
    await recorder.opened;
    const started = [await startShell(tokenText, 'one'), await startShell(tokenText, 'two')];
    if (!(await listed(recorder, started))) throw new Error('the two shells were never listed');
    const initial = [...started];
    const ctx = { token: tokenText, started, recorder, note: '' };
    const count = recorder.records.length;
    const result = await scenarios[name](ctx);
    let after;
    if (result.keepRecording) {
        after = { records: recorder.records.slice(count) };
        recorder.close();
    } else {
        // A new connection after the event, as the page makes one.
        recorder.close();
        const tokenAgain = await token();
        ctx.token = tokenAgain;
        const fresh = client();
        await fresh.opened;
        await listed(fresh, started, 30000);
        await sleep(6000);
        after = { records: fresh.records };
        fresh.close();
    }
    const running = tmuxTerminals().filter((id) => ctx.started.includes(id));
    const before = { records: recorder.records.slice(0, count) };
    const report = judge(ended, before, after, initial, running, result.killed);
    return { name, report, running, note: ctx.note };
}

const only = process.argv.slice(2).filter((one) => !one.startsWith('--'));
if (process.argv.includes('--list')) {
    log(Object.keys(scenarios).join('\n'));
    process.exit(0);
}

let red = false;
const loader = await loadEnded();
try {
    await startServer();
    for (const name of only.length > 0 ? only : Object.keys(scenarios)) {
        const { report, running, note } = await run(name, loader.ended);
        for (const [shape, { wrong, missed, killed, lists }] of Object.entries(report)) {
            const bad = wrong.length > 0 || missed;
            const verdict = bad ? 'RED' : 'green';
            if (bad) red = true;
            const ends = killed === undefined ? '' : `; the killed terminal ${missed ? 'was NOT' : 'was'} answered`;
            log(`${verdict} ${name} / page shape ${shape}: ${lists} lists, endedTerminals answers ${wrong.length} terminal(s) tmux still lists (${running.length} running)${ends}`);
            for (const one of wrong) log(`    answered ${one.id} at list ${one.list}; that list held [${one.now.join(', ')}]`);
        }
        if (note !== '') log(`    ${note}`);
    }
} finally {
    await stopServer();
    await loader.close();
    tmux('kill-server');
    if (process.env.Q107_KEEP !== '1') rmSync(SCRATCH, { recursive: true, force: true });
}
log(red ? 'RESULT: RED' : 'RESULT: green');
process.exit(red ? 1 : 0);
```


## 5. DONE / NOT DONE

Everything below is DONE. Nothing is NOT DONE.

| Item | State | Command that proves it |
|---|---|---|
| 1 Reproduced on a server of its own (port 8797, own tmux socket, own `HOME`) | DONE | `node .scratch/migration/agents/reviews/Q107-probe.mjs` (section 3); `printenv TMUX` exit 1 and `lsof -iTCP:8797 -sTCP:LISTEN` empty before each series |
| 1 Layout path in the unit suite | DONE, red on the base | `npx vitest run tests/state/workbench/layout/saved/layout-shared.test.ts` (section 2) |
| 2 List path fixed at its place | DONE | `channel.ts:356-410`; `tests/server/machine/pty/channel-list.test.ts` (11 cases, 7 fail on the base `refresh()`); probe `noserver` green x3 |
| 2 Layout path fixed (Z115 (a)) | DONE | `storage.ts:87`, `layout.svelte.ts:301,321,627`, `+page.svelte:210`; `layout-shared.test.ts` 8 of 8 pass, 4 fail without the listener |
| 3 Attach to Session | DONE | `unownedTerminals` (`terminal-lists.ts:35`), `attachable` and `attachTerminal` (`terminals.svelte.ts:400,410`), `kindsMenu` and `emptyListMenu` (`terminal-list.ts:447,466`), `attachedOf` (`:487`), `sessions.menu_attach` (`config/text/views/sessions/terminal.yml:23`); `terminal-tabs.test.ts` "attaching a terminal no tab owns" (8), `terminal-menu.test.ts` "Attach to Session" (6), `terminals.test.ts` (unowned 4, label 1), `menu-words.test.ts` |
| 4 Server stopped, socket killed, scratch removed | DONE | the commands quoted in section 9 |
| 5 Docs | DONE | `DESIGN.md:154` (browser tabs share the pages), `DESIGN.md:361` (no-server confirmation, Attach to Session), `HELP.md:127` (the arrow's menu, the list menu, Attach to Session), `HELP.md:146` (the `pages` row) |
| Cases 1 to 21 | DONE | section 2 (base) and the vitest run below (after) |

`npm run diagrams` exit 0; `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` exit 0, its lines:

```
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
```

`npx vitest run tests/state/sessions tests/state/client/terminal tests/views/sessions tests/server/machine/pty tests/ui/menu` exit 0:

```
 Test Files  37 passed (37)
      Tests  544 passed (544)
```

The ASCII gate, from `tools/oculus`, `LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests config -type f ! -name local.yml)`, prints nothing. The spec's command names `bin` as well; `tools/oculus` has no `bin` folder (`find` says "bin: No such file or directory"), so it is run over `src tests config`.

The name grep (spec.md), every name this step adds or changes, matches per file across `src`, `tests`, `config` (`--exclude=local.yml`), `HELP.md`, `DESIGN.md` and `README.md`; `README.md` names none of them:

```
grep -rnF --exclude=local.yml -- 'unownedTerminals' src tests config HELP.md DESIGN.md README.md  (matches per file)
       1 DESIGN.md
       1 src/lib/state/sessions/terminal/terminal-lists.ts
       3 src/lib/state/sessions/terminals.svelte.ts
       8 tests/state/sessions/terminals.test.ts
grep -rnF --exclude=local.yml -- 'terminalLabel' src tests config HELP.md DESIGN.md README.md  (matches per file)
       1 DESIGN.md
       1 src/lib/state/sessions/terminal/terminal-lists.ts
       1 src/lib/state/sessions/terminals.svelte.ts
       2 src/lib/views/sessions/session-list/TerminalRows.svelte
       3 src/lib/views/sessions/terminal/Terminal.svelte
       3 tests/state/sessions/terminals.test.ts
       1 tests/views/sessions/sessions.test.ts
grep -rnF --exclude=local.yml -- 'attachable' src tests config HELP.md DESIGN.md README.md  (matches per file)
       5 src/lib/state/sessions/terminals.svelte.ts
       5 src/lib/views/sessions/terminal/Terminal.svelte
       2 src/lib/views/sessions/terminal/TerminalList.svelte
       8 src/lib/views/sessions/terminal/terminal-list.ts
       1 tests/state/client/terminal/terminal-tabs.test.ts
grep -rnF --exclude=local.yml -- 'attachTerminal' src tests config HELP.md DESIGN.md README.md  (matches per file)
       1 DESIGN.md
       4 src/lib/state/sessions/terminals.svelte.ts
       2 src/lib/views/sessions/terminal/Terminal.svelte
       2 src/lib/views/sessions/terminal/TerminalList.svelte
       8 tests/state/client/terminal/terminal-tabs.test.ts
grep -rnF --exclude=local.yml -- 'attachedOf' src tests config HELP.md DESIGN.md README.md  (matches per file)
       2 src/lib/views/sessions/terminal/Terminal.svelte
       2 src/lib/views/sessions/terminal/TerminalList.svelte
       1 src/lib/views/sessions/terminal/terminal-list.ts
       8 tests/views/sessions/terminal-menu.test.ts
grep -rnF --exclude=local.yml -- 'Attachable' src tests config HELP.md DESIGN.md README.md  (matches per file)
       6 src/lib/views/sessions/terminal/terminal-list.ts
grep -rnF --exclude=local.yml -- 'kindsMenu' src tests config HELP.md DESIGN.md README.md  (matches per file)
       1 DESIGN.md
       2 src/lib/views/sessions/terminal/Terminal.svelte
       1 src/lib/views/sessions/terminal/terminal-list.ts
       3 tests/ui/menu/menu-words.test.ts
       4 tests/views/sessions/terminal-menu.test.ts
grep -rnF --exclude=local.yml -- 'emptyListMenu' src tests config HELP.md DESIGN.md README.md  (matches per file)
       1 DESIGN.md
       2 src/lib/views/sessions/terminal/TerminalList.svelte
       1 src/lib/views/sessions/terminal/terminal-list.ts
       3 tests/ui/menu/menu-words.test.ts
      10 tests/views/sessions/terminal-menu.test.ts
grep -rnF --exclude=local.yml -- 'menu_attach' src tests config HELP.md DESIGN.md README.md  (matches per file)
       1 config/text/views/sessions/terminal.yml
       1 src/lib/views/sessions/terminal/terminal-list.ts
       6 tests/views/sessions/terminal-menu.test.ts
grep -rnF --exclude=local.yml -- 'NO_SERVER_CONFIRMS' src tests config HELP.md DESIGN.md README.md  (matches per file)
       1 DESIGN.md
       3 src/lib/server/machine/pty/channel.ts
       7 tests/server/machine/pty/channel-list.test.ts
       2 tests/server/machine/pty/channel.test.ts
grep -rnF --exclude=local.yml -- 'NO_SERVER_CONFIRM_MS' src tests config HELP.md DESIGN.md README.md  (matches per file)
       1 DESIGN.md
       2 src/lib/server/machine/pty/channel.ts
       7 tests/server/machine/pty/channel-list.test.ts
       2 tests/server/machine/pty/channel.test.ts
grep -rnF --exclude=local.yml -- 'stopFollowing' src tests config HELP.md DESIGN.md README.md  (matches per file)
       2 src/lib/state/workbench/layout.svelte.ts
       2 src/routes/+page.svelte
       1 tests/state/workbench/layout/saved/layout-shared.test.ts
grep -rnF --exclude=local.yml -- 'loadLayout' src tests config HELP.md DESIGN.md README.md  (matches per file)
       6 src/lib/state/workbench/layout.svelte.ts
       1 src/lib/state/workbench/layout/saved/storage.ts
       2 src/routes/+page.svelte
       3 tests/shell/keys/palette-open.test.ts
       3 tests/shell/keys/palette.test.ts
       2 tests/shell/keys/workbench-keys.test.ts
       1 tests/shell/rail/rail.test.ts
       1 tests/shell/status/status-bar.test.ts
       3 tests/state/client/terminal/terminal-close.test.ts
       1 tests/state/client/terminal/terminal-start.test.ts
       1 tests/state/client/terminal/terminal-tabs.test.ts
       2 tests/state/forms/form-drafts.test.ts
       1 tests/state/sessions/terminals.test.ts
       1 tests/state/sources/explorer.test.ts
       2 tests/state/sources/fs.test.ts
       1 tests/state/workbench/layout/layout-close.test.ts
       1 tests/state/workbench/layout/layout-fixture.ts
      30 tests/state/workbench/layout/layout-store.test.ts
       1 tests/state/workbench/layout/nested.test.ts
      21 tests/state/workbench/layout/pages.test.ts
       4 tests/state/workbench/layout/saved/layout-shared.test.ts
      16 tests/state/workbench/navigation/arrangement.test.ts
       1 tests/state/workbench/navigation/notice-sources.test.ts
       3 tests/views/feeds/linkedin.test.ts
       3 tests/views/feeds/radar.test.ts
       2 tests/views/shared/links/source-button.test.ts
       2 tests/views/system/workbench/pages.test.ts
grep -rnF --exclude=local.yml -- 'takeSaved' src tests config HELP.md DESIGN.md README.md  (matches per file)
       1 DESIGN.md
       2 src/lib/state/workbench/layout.svelte.ts
       1 src/lib/state/workbench/layout/saved/storage.ts
grep -rnF --exclude=local.yml -- 'follow(' src tests config HELP.md DESIGN.md README.md  (matches per file)
       4 src/lib/server/root/watch/git.ts
       3 src/lib/state/sessions/transcript.svelte.ts
       3 src/lib/state/workbench/layout.svelte.ts
       1 src/lib/state/workbench/layout/saved/storage.ts
       1 src/lib/views/sessions/transcript/Transcript.svelte
      10 tests/state/sessions/transcript.test.ts
grep -rnF --exclude=local.yml -- 'TerminalFontTools' src tests config HELP.md DESIGN.md README.md  (matches per file)
       3 src/lib/views/sessions/terminal/Terminal.svelte
       1 tests/views/whole/type-scale.test.ts
grep -rnF --exclude=local.yml -- 'TerminalListProps' src tests config HELP.md DESIGN.md README.md  (matches per file)
       2 src/lib/views/sessions/terminal/TerminalList.svelte
       1 src/lib/views/sessions/terminal/terminal-list.ts
grep -rnF --exclude=local.yml -- 'workbench-shape' src tests config HELP.md DESIGN.md README.md  (matches per file)
       2 src/lib/state/sessions/terminals.svelte.ts
grep -rnF --exclude=local.yml -- 'terminal-lists' src tests config HELP.md DESIGN.md README.md  (matches per file)
       1 DESIGN.md
       2 src/lib/state/sessions/terminals.svelte.ts
grep -rnF --exclude=local.yml -- 'endedTerminals' src tests config HELP.md DESIGN.md README.md  (matches per file)
       1 DESIGN.md
       1 src/lib/state/sessions/terminal/terminal-lists.ts
       3 src/lib/state/sessions/terminals.svelte.ts
       8 tests/state/sessions/terminals.test.ts
grep -rnF --exclude=local.yml -- 'closeEnded' src tests config HELP.md DESIGN.md README.md  (matches per file)
       2 src/lib/state/sessions/terminals.svelte.ts
       1 tests/state/client/terminal/terminal-close.test.ts
grep -rnF --exclude=local.yml -- 'refresh(' src tests config HELP.md DESIGN.md README.md  (matches per file)
       1 src/lib/server/accounts/calendar/poll.ts
       1 src/lib/server/accounts/calendar/routes.ts
       1 src/lib/server/accounts/connect/actions.ts
       1 src/lib/server/accounts/connect/setup.ts
       1 src/lib/server/accounts/mail/poll.ts
       3 src/lib/server/accounts/mail/routes.ts
       4 src/lib/server/machine/hpc/poll.ts
       2 src/lib/server/machine/hpc/routes.ts
       4 src/lib/server/machine/pty/channel.ts
       2 src/lib/server/machine/usage/refresh.ts
       1 src/lib/server/machine/usage/routes.ts
       3 src/lib/server/machine/usage/watch.ts
       1 src/lib/server/root/context.ts
       2 src/lib/server/root/watch/git.ts
       1 src/lib/state/feeds/feeds.ts
       2 src/lib/state/sources/fs.svelte.ts
       1 src/lib/views/boards/focus/CommandCenter.svelte
       1 src/lib/views/feeds/inbox/Inbox.svelte
       1 src/lib/views/personal/calendar/Calendar.svelte
       1 src/lib/views/system/config/Config.svelte
       1 src/lib/views/system/hpc/Hpc.svelte
       1 src/routes/api/(accounts)/calendar/+server.ts
       1 src/routes/api/(accounts)/calendar/callback/+server.ts
       1 src/routes/api/(accounts)/connect/+server.ts
       1 src/routes/api/(accounts)/mail/+server.ts
       1 src/routes/api/(accounts)/mail/callback/+server.ts
       1 src/routes/api/(git)/git/+server.ts
       1 src/routes/api/(machine)/hpc/+server.ts
       1 src/routes/api/(machine)/usage/refresh/+server.ts
       1 src/routes/api/(sessions)/terminal/+server.ts
       1 tests/routes/git/git.test.ts
       1 tests/routes/machine/hpc.test.ts
      21 tests/server/accounts/calendar/poll.test.ts
       1 tests/server/accounts/connect/oauth.test.ts
       2 tests/server/accounts/mail/poll.test.ts
      11 tests/server/machine/hpc/poll.test.ts
       2 tests/server/machine/hpc/ssh.test.ts
       8 tests/server/machine/pty/channel-list.test.ts
       4 tests/server/machine/pty/channel.test.ts
       8 tests/server/machine/usage/refresh.test.ts
       4 tests/server/machine/usage/usage.test.ts
       1 tests/server/root/context.test.ts
       1 tests/server/root/watch/git.test.ts
       3 tests/state/boards/focus.test.ts
       1 tests/state/feeds/inbox-store.test.ts
       4 tests/state/life/calendar-store.test.ts
       4 tests/state/sources/fs.test.ts
       1 tests/views/system/config.test.ts
```

What the green results do not cover: no browser was opened, so the look of the Attach to Session submenu, the keyboard path through it and the second browser tab taking a save are for the look at landing (spec.md:56). The probe drives a real tmux and a real dev server, but tmux becoming unreachable is made by moving the socket file, which is one way it happens, not the only one. The confirming reads are tested with the fake clock in `channel-list.test.ts`.

## 6. User-visible changes

| Change | Before | After |
|---|---|---|
| A moment of tmux refusing connections | One "no server running" or "error connecting" answer made the terminal list empty; every page closed its Terminal tabs and the terminals no longer showed, while tmux still ran them. | The empty list is taken only when the read and the 2 reads after it (300 ms apart) all say it. A slow or missing answer keeps the last list. An older reply never replaces a newer list. A tmux that really exited reads as empty about 0.6 s later than before. |
| A second browser tab of one server | A layout change in one browser tab saved its workbench over the other's; a Terminal tab (or any tab) the other had added was lost at the next save or reload. | Every browser tab takes the pages another browser tab saves at once; each keeps showing its own page. Two browser tabs that change the pages in the same moment still end with the last write. |
| Attach to Session | A Terminal tab offered no way to take in a running terminal no tab owns; the Sessions view's list was the only way. | The bar's kinds dropdown (after With a Prompt) and the list's empty-area menu (after New Terminal With Profile) show Attach to Session while at least one such terminal exists. Its entries are the terminals no Terminal tab owns, by the title the Sessions view shows (the name when the title is empty), in list order. A pick puts the terminal at the end of this tab, shows it alone, and shows the tab; a tab that was composing drops the composer. A terminal that ended or that another tab took meanwhile changes nothing. |
| Labels | The Sessions view and the Terminal tab each worked out a terminal's label. | One helper (`terminalLabel`) gives both the same label; nothing visible changes. |

## 7. Shapes named in this step

- Catalog key `sessions.menu_attach` = "Attach to Session" (`config/text/views/sessions/terminal.yml:23`).
- Menu ids: the submenu's id is `attach`, each entry's id is `attach:<terminal id>`; `attachedOf(id)` answers the terminal id or null. They are separate from the `join:` and `profile:` prefixes.
- Exported constants `NO_SERVER_CONFIRMS = 2` and `NO_SERVER_CONFIRM_MS = 300` (`channel.ts:65,66`).
- Store additions: `attachable(): Terminal[]` and `attachTerminal(tab, id)` on the terminals store; pure `unownedTerminals(list, tabs)` and `terminalLabel(terminal)` in `src/lib/state/sessions/terminal/terminal-lists.ts`, re-exported from `terminals.svelte.ts` with `endedTerminals`.
- Layout store: `loadLayout(storage?, source?)` takes a second parameter (the window to follow), `stopFollowing()` is new, and `LayoutStorage.follow(source, changed)` is new.
- Types `Attachable` and `TerminalListProps` (`terminal-list.ts`).
- New files: `src/lib/state/sessions/terminal/terminal-lists.ts`, `src/lib/state/sessions/terminal/workbench-shape.ts` (the `TerminalTab` and `TerminalTabs` types moved out of `terminals.svelte.ts`, re-exported there), `src/lib/views/sessions/terminal/TerminalFontTools.svelte` (the three font buttons of the bar, moved out of `Terminal.svelte`), `tests/server/machine/pty/channel-list.test.ts`, `tests/state/workbench/layout/saved/layout-shared.test.ts`. `layout-saved.test.ts` moved into `tests/state/workbench/layout/saved/` with it.
- Internal decisions, all reversible: the count and delay of the confirming reads; `Attachable` as the menu's entry type; the window passed to `loadLayout`.

## 8. Anything in the brief that was wrong, impossible or imprecise

- **Case 1's premise.** The brief lists the events of item 1 as possible origins of the closing. Only the list read failing as "no server" turned red; the file save, the restart, the reconnect, the burst of starts and the usage session did not (section 3). The step's fix is for the event that turned red; the origin of the Z99 sighting is not established (section 4).
- **Case 17** holds for a read that fails while tmux is briefly unreachable, which the confirming reads heal. A "no server" that lasts longer than the confirming reads is indistinguishable from a tmux that exited and is taken as the empty list; no code can tell the two apart from `list-sessions` alone.
- **Case 9.** The text typed in the composer is local state of `Composer.svelte` (`let prompt = $state('')`, `:66`) and goes when the component unmounts; `attachTerminal` changes only the tab's state (`restate`), so the composer record in the instance state is left as it is, and the store-level test asserts the tab owns and shows the terminal with `composing: false`. That the typed text is gone is for the look.
- **The path list.** Files outside it were written, each for a stated reason. `src/lib/views/sessions/session-list/TerminalRows.svelte`: its label uses `terminalLabel`. `src/lib/state/workbench/layout.svelte.ts`, `layout/saved/storage.ts` and `src/routes/+page.svelte`: the layout fix (`+page.svelte` is where the window is passed). `terminal-lists.ts`, `workbench-shape.ts`, `TerminalFontTools.svelte` and the `TerminalListProps` type: `terminals.svelte.ts` would be 954 lines, `Terminal.svelte` 552 and `TerminalList.svelte` 553 against the 900 and 540 lines of `tests/checks/tree/size.test.ts`, and the allow list `utils/size-allow.txt` holds no entry (a listing would have been the lazy option). `tests/state/workbench/layout/saved/`: the folder held 11 items against the limit of 10 of `utils/folder-check.sh`. `tests/views/whole/type-scale.test.ts`: lists every view file. `docs/diagrams/`: regenerated by `npm run diagrams`, since the views layer imports more. Comment lines of `layout-fixture.ts` and `layout.test.ts`: they name the moved test file.
- **Last write wins.** Z115 (a) makes browser tabs follow each other's saves; two saves made in the same moment still end with the later one. That is a property of one key with no merge, and (b) of the open item would have been the merge.
- **`listTerminals`** (`src/lib/server/machine/pty/sessions.ts:284`) still answers `[]` on any failure. It serves `GET /api/terminal` and the edit and chat routes (`routes.ts:122`, `edit.ts:49`, `chat.ts:50`), not the `sessions` payload, so it cannot close a tab; it is unchanged.
- **The spec's ASCII command** names a `bin` folder that `tools/oculus` does not have (section 5).

## 9. Cleanup

```
$ lsof -iTCP:8797 -sTCP:LISTEN
(exit 1)
$ ls $TMPDIR/q107s
ls: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/q107s: No such file or directory
(exit 1)
$ ls $TMPDIR | grep q107
(exit 1)
```

The probe ends each run by stopping its server, running `tmux -S <its socket> kill-server` on its own socket, and removing `$TMPDIR/q107s`; the listing above is after the last run. No other socket was named in any tmux command.

## Repair round 1

Nothing in the four rulings is left undone. One case the rulings did not cover is RED and stands: with no page attached and the socket unreachable for longer than the confirming reads at an idle poll tick, the server still publishes the empty list (the hidden-tab run in ruling 1, quoted verbatim). No control client runs then, so nothing in the process says tmux runs, and a tmux that exited normally answers the same words.

Sections 4, 6 and 8 above are amended by this section where they say the confirming reads alone end the false empty list, and where they say "no code can tell the two apart from `list-sessions` alone": a running control client is the second fact, and the pages share the ui store's instance records as well as the pages.

### Ruling 1: a "no server" read while a control client runs

Change: `#read` of `src/lib/server/machine/pty/channel.ts:375` still reads a "no server" answer again `NO_SERVER_CONFIRMS` times, `NO_SERVER_CONFIRM_MS` apart, and at the last answer takes the empty list only `if (!this.#driver.live())` (`:383`); with a control client running it gives the read up and the last list stands. The doc comment of `#read` says both cases and why (a control client's process ends with the tmux server, `tmux.ts` sets `alive = false` on its `exit` and `error`). The decision is at the last answer, so a control client that stops during the confirming reads leaves the empty list (the brief's case (c)), and one that runs at the end keeps the list (case (a)).

Tests, `tests/server/machine/pty/channel-list.test.ts:250`, "a no-server answer while a control client runs", on the fake driver whose `live()` the case sets:
- (a) `:272` "is never the empty list, however long every read says it: the last list stands": live true, every read answering "no server" in both wordings, four times the confirmation span: no empty list published, the list stays `[A]`.
- (b) `:284` "is the empty list again once the control client has stopped, after the confirming reads".
- (c) `:293` "is the empty list when the control client stops during the confirming reads".

First run on the tree before the change, `npx vitest run tests/server/machine/pty/channel-list.test.ts`: (a) fails, (b) and (c) pass (they pin the behaviour that stays):

```
FAIL is never the empty list, however long every read says it: the last list stands 7ms
FAIL  tests/server/machine/pty/channel-list.test.ts > a no-server answer while a control client runs > is never the empty list, however long every read says it: the last list stands
AssertionError: expected [] to deeply equal [ 'a1b2c3-shell' ]
Test Files  1 failed (1)
Tests  1 failed | 13 passed (14)
```
Probe: `noserver` runs with the socket away for 2000 ms (`Q107-probe.mjs:317`, through `attachedOutage` at `:239`), `noserver400` keeps the 400 ms run (`:321`); the two use separate session names so one invocation can hold both. `noserverhidden` (`:329`) is new and runs only when named.

Before this round's change (tree of the report above), `node .scratch/migration/agents/reviews/Q107-probe.mjs noserver noserver400`:

```
RED noserver / page shape reload: 2 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)
    answered 447126-shell at list 0; that list held []
    answered 49e604-shell at list 0; that list held []
RED noserver / page shape reconnect: 4 lists, endedTerminals answers 2 terminal(s) tmux still lists (4 running)
    answered 447126-shell at list 2; that list held []
    answered 49e604-shell at list 2; that list held []
    while the socket is away (2000 ms) tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
green noserver400 / page shape reload: 2 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
green noserver400 / page shape reconnect: 4 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
    while the socket is away (400 ms) tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
RESULT: RED
exit=1
```

After, final tree, `node .scratch/migration/agents/reviews/Q107-probe.mjs noserver`:

```
green noserver / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
green noserver / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
    while the socket is away (2000 ms) tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
RESULT: green
exit=0
```

After, final tree, `node .scratch/migration/agents/reviews/Q107-probe.mjs noserver400`:

```
green noserver400 / page shape reload: 2 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
green noserver400 / page shape reconnect: 4 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
    while the socket is away (400 ms) tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
RESULT: green
exit=0
```

After, final tree, the whole default run (`node .scratch/migration/agents/reviews/Q107-probe.mjs`):

```
green save / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green save / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
    the socket of the open client closed, so the dev server restarted
green restart / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green restart / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green reconnect / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green reconnect / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green burst / page shape reload: 6 lists, endedTerminals answers 0 terminal(s) tmux still lists (62 running)
green burst / page shape reconnect: 8 lists, endedTerminals answers 0 terminal(s) tmux still lists (62 running)
green noserver / page shape reload: 2 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
green noserver / page shape reconnect: 4 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
    while the socket is away (2000 ms) tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
green noserver400 / page shape reload: 2 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
green noserver400 / page shape reconnect: 4 lists, endedTerminals answers 0 terminal(s) tmux still lists (4 running)
    while the socket is away (400 ms) tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
green ended / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (1 running); the killed terminal was answered
green ended / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (1 running); the killed terminal was answered
green usage / page shape reload: 0 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green usage / page shape reconnect: 2 lists, endedTerminals answers 0 terminal(s) tmux still lists (2 running)
green oddcwd / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (3 running)
green oddcwd / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (3 running)
green oddname / page shape reload: 1 lists, endedTerminals answers 0 terminal(s) tmux still lists (3 running)
green oddname / page shape reconnect: 3 lists, endedTerminals answers 0 terminal(s) tmux still lists (3 running)
RESULT: green
exit=0
```

The hidden-tab run, `node .scratch/migration/agents/reviews/Q107-probe.mjs noserverhidden`, verbatim: the page attached to a terminal is gone for longer than `IDLE_MS`, so no control client is live, and the socket is away for 2000 ms across the second idle poll tick:

```
RED noserverhidden / page shape reload: 1 lists, endedTerminals answers 2 terminal(s) tmux still lists (2 running)
    answered 6b2122-shell at list 0; that list held []
    answered 3f06ee-shell at list 0; that list held []
RED noserverhidden / page shape reconnect: 3 lists, endedTerminals answers 2 terminal(s) tmux still lists (2 running)
    answered 3f06ee-shell at list 2; that list held []
    answered 6b2122-shell at list 2; that list held []
    while the socket is away tmux says: error connecting to <scratch>/tm/tmux-502/default (No such file or directory)
RESULT: RED
exit=1
```

This is the case that remains. The server reads the list at the idle poll with no control client, three "no server" answers follow within 0.6 s, and the empty list is published while two shells run. It is the case the ruling expected to be RED; the run was not made on the tree before this round.
### Ruling 2: Attach joins the tab it is chosen from

Change: two tests of `tests/state/client/terminal/terminal-tabs.test.ts`, "attaching a terminal no tab owns":
- `:350` "puts the chosen terminal at the end of the tab it is chosen from, the second Terminal tab of the page, shows it in the row and activates the tab; no other tab changes": the page holds a first Terminal tab owning C and a second owning A and B; D is attached from the second; it joins the second (`[A, B, D]`, shown alone, activated) and the first is byte-identical.
- `:431` "joins the tab it is chosen from, the only Terminal tab of the second page, and not the first Terminal tab of the first page": page one holds a tab owning A, page two a tab owning C; D is attached from the page-two tab and joins it (`[C, D]`), the page-one tab stays `[A]`.

First run on the tree before this round (the behaviour is already right, so both pass), `npx vitest run tests/state/client/terminal/terminal-tabs.test.ts`:

```
Test Files  1 passed (1)
Tests  36 passed (36)
```

Both failing on a scratch copy of `src/lib/state/sessions/terminals.svelte.ts` where `:412` reads `const target = terminalTabs()[0];` (the first Terminal tab of any page) in place of `terminalTabs().find((one) => one.id === tab)`, same command:

```
FAIL puts the chosen terminal at the end of the tab it is chosen from, the second Terminal tab of the page, shows it in the row and activates the tab; no other tab changes 5ms
FAIL joins the tab it is chosen from, the only Terminal tab of the second page, and not the first Terminal tab of the first page 1ms
FAIL  tests/state/client/terminal/terminal-tabs.test.ts > attaching a terminal no tab owns > puts the chosen terminal at the end of the tab it is chosen from, the second Terminal tab of the page, shows it in the row and activates the tab; no other tab changes
AssertionError: expected { ...(7) } to match object { terminals: [ ...(3) ], ...(3) }
FAIL  tests/state/client/terminal/terminal-tabs.test.ts > attaching a terminal no tab owns > joins the tab it is chosen from, the only Terminal tab of the second page, and not the first Terminal tab of the first page
AssertionError: expected [ 'c3c3c3-claude' ] to deeply equal [ 'c3c3c3-claude', 'd4d4d4-shell' ]
Test Files  1 failed (1)
Tests  2 failed | 34 passed (36)
```

The file is byte-identical to its state before the copy (`cmp`), and `:412` reads the `find` again.
### Ruling 3: the test head

`tests/server/machine/pty/channel-list.test.ts:1-14` says "What this does NOT cover: a real tmux server failing to be reached, which no unit test can make happen, and the page closing a Terminal tab on an empty list, which is tests/state/client/terminal/terminal-tabs.test.ts." It names no ledger file and no step; it also says the stub's control client is live or not as the case says. `grep -n "scratch\|Q107\|probe" tests/server/machine/pty/channel-list.test.ts` prints nothing.
### Ruling 4: what browser tabs share

Change, `src/lib/state/workbench/ui.svelte.ts`:
- `save` (`:442`) writes `mergedInstances` (`:414`): the records the storage holds, with the records this tab changed or added (compared by JSON text with `synced`, `:173`, the records as last read or written) laid over them, and the ones this tab removed taken out. Where the storage holds nothing readable every record this tab holds is written. `synced` is updated only after the write succeeds, so a refused write leaves the records to be written at the next save.
- `loadUi(storage, source)` (`:317`) follows the window through `followKey` and `takeSavedInstances` (`:433`) takes the saved `instances` into `store.current.instances` while theme, CRT, wallpaper, icons, text scale, terminal font, code theme and the status bar items stay the tab's own; it writes nothing back. `stopFollowing` (`:526`) ends it. `savedHeld` (`:368`) is the one reader of the saved envelope, used by `loadUi`, the merge and the follow.
- `followKey` (`src/lib/state/shared/stores/storage-events.ts:8`) is the listener of the `storage` event for one key; `follow` of `src/lib/state/workbench/layout/saved/storage.ts:89` now calls it for `LAYOUT_KEY`.
- `src/routes/+page.svelte:209-214` passes `window` to `loadUi` and stops the follow on unmount.

Tests, the new `tests/state/workbench/ui-shared.test.ts` (10 cases, two stores on one fake storage and an `EventTarget` for each window):
- both records kept after both save, and the merged record visible in the tab that saves last;
- a record both held and one tab changed kept next to another tab's new record;
- a record removed in one tab stays removed after the other saves, and is gone from that tab;
- a record a tab removed itself is removed from the storage;
- an unreadable stored value: the tab writes its own records;
- a storage event gives this tab the other's record and leaves its theme; a record the other removed is dropped; nothing is written back; another key, no value, an unparseable value change nothing; no follow without a window, after `stopFollowing`, or for the older of two windows;
- a refused write keeps the records in memory and writes them again at the next save.

First run on the tree before this round's change (the new cases of the first nine that need the merge or the follow), `npx vitest run tests/state/workbench/ui-shared.test.ts`:

```
FAIL keep the record each one changed when both have saved 9ms
FAIL keep the change of a record both held when the other saves another record later 1ms
FAIL do not bring back a record the other removed, and drop it in the tab that saves 1ms
FAIL remove the record they removed themselves 1ms
FAIL takes the records the other saved and keeps its own appearance 1ms
FAIL drops a record the other removed 0ms
FAIL writes nothing back, and hears no other key, no value and no value that parses 0ms
FAIL follows nothing when loaded without a window, after it stops following, or on a second load for the older window 0ms
FAIL  tests/state/workbench/ui-shared.test.ts > two browser tabs saving the state their views remember > keep the record each one changed when both have saved
AssertionError: expected { b: { draft: 'text' } } to deeply equal { a: { filter: 'active' }, ...(1) }
FAIL  tests/state/workbench/ui-shared.test.ts > two browser tabs saving the state their views remember > keep the change of a record both held when the other saves another record later
AssertionError: expected { a: 1, b: 3 } to deeply equal { a: 2, b: 3 }
FAIL  tests/state/workbench/ui-shared.test.ts > two browser tabs saving the state their views remember > do not bring back a record the other removed, and drop it in the tab that saves
AssertionError: expected { x: 'gone', y: 'kept', a: 1 } to deeply equal { y: 'kept', a: 1 }
FAIL  tests/state/workbench/ui-shared.test.ts > two browser tabs saving the state their views remember > remove the record they removed themselves
AssertionError: expected {} to deeply equal { b: 2 }
FAIL  tests/state/workbench/ui-shared.test.ts > a browser tab told that another one saved > takes the records the other saved and keeps its own appearance
AssertionError: expected undefined to deeply equal { draft: 'text' }
FAIL  tests/state/workbench/ui-shared.test.ts > a browser tab told that another one saved > drops a record the other removed
AssertionError: expected 1 to be undefined // Object.is equality
FAIL  tests/state/workbench/ui-shared.test.ts > a browser tab told that another one saved > writes nothing back, and hears no other key, no value and no value that parses
AssertionError: expected undefined to be 1 // Object.is equality
FAIL  tests/state/workbench/ui-shared.test.ts > a browser tab told that another one saved > follows nothing when loaded without a window, after it stops following, or on a second load for the older window
TypeError: stopped.ui.stopFollowing is not a function
Test Files  1 failed (1)
Tests  8 failed | 1 passed (9)
```

The refused-write case was added after the change and was not run on the tree before it; it fails on a scratch copy of `ui.svelte.ts` where `synced` is updated before the write (the file is restored byte-identical, `cmp`):

```
FAIL keeps every record it holds in memory and writes them again at the next save 3ms
FAIL  tests/state/workbench/ui-shared.test.ts > a browser tab whose storage refuses a write > keeps every record it holds in memory and writes them again at the next save
AssertionError: expected { a: 1, c: 3 } to deeply equal { a: 1, b: 2, c: 3 }
Test Files  1 failed (1)
Tests  1 failed | 9 passed (10)
```

`HELP.md:146` (the `pages` row) and `DESIGN.md:154` say what is shared: the arrangement and each tab's own state, with the appearance each browser tab's own; `DESIGN.md:361` says that the empty list needs no control client running.
### Verification

`npm run diagrams` exit 0. `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` exit 0:

```
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
```

`npx vitest run tests/state/sessions tests/state/client/terminal tests/views/sessions tests/server/machine/pty tests/ui/menu tests/state/workbench` exit 0:

```
 Test Files  65 passed (65)
      Tests  1156 passed (1156)
```

The ASCII gate over `src tests config` prints nothing (exit 0). The name grep of the new names (matches per file, `--exclude=local.yml`, `src tests config HELP.md DESIGN.md README.md`):

```
== followKey
   1 DESIGN.md
   1 src/lib/state/shared/stores/storage-events.ts
   2 src/lib/state/workbench/layout/saved/storage.ts
   2 src/lib/state/workbench/ui.svelte.ts
== takeSavedInstances
   1 DESIGN.md
   3 src/lib/state/workbench/ui.svelte.ts
== mergedInstances
   1 DESIGN.md
   2 src/lib/state/workbench/ui.svelte.ts
== savedHeld
   4 src/lib/state/workbench/ui.svelte.ts
== stopFollowing
   2 src/lib/state/workbench/layout.svelte.ts
   3 src/lib/state/workbench/ui.svelte.ts
   4 src/routes/+page.svelte
   1 tests/state/workbench/layout/saved/layout-shared.test.ts
   1 tests/state/workbench/ui-shared.test.ts
== storage-events
   1 DESIGN.md
   1 src/lib/state/workbench/layout/saved/storage.ts
   1 src/lib/state/workbench/ui.svelte.ts
== noserver400
== noserverhidden
```

After the last probe run: `lsof -iTCP:8797 -sTCP:LISTEN` exit 1, `ls $TMPDIR/q107s` "No such file or directory".

What the green results do not cover: no browser was opened, so a second browser tab taking the ui records at once, and the Terminal tab's composer surviving a reload, are for the look at landing. The probe moves the socket file, which is one way tmux becomes unreachable.

### User-visible changes

| Change | Before | After |
|---|---|---|
| tmux unreachable while a page is attached to a terminal | After 0.6 s the list was published empty and the pages ended their terminals. | The last list stands however long it lasts; it is read again at the next change tmux reports. |
| tmux unreachable with no page attached to a terminal | The empty list after 0.6 s at an idle poll tick. | The same: the hidden-tab run above is RED. |
| Two browser tabs and a view's own state (a Terminal tab's composer record, a view's forms and filters) | Each tab wrote the whole record set, so one tab's save dropped the records the other wrote, and the other tab never saw them. | A save keeps the records another tab saved, and each tab takes the other's records when it saves; theme, CRT, wallpaper, icons, text size, terminal font, code theme and status bar stay each browser tab's own. Two tabs changing the same record at once end with the last write. |
| `HELP.md:146` `pages` row | Said pages, tabs and Terminal tabs are shared. | Says the arrangement and each tab's own state are shared, and the appearance is not. |
