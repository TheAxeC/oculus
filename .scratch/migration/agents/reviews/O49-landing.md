# O49 landing

Position: plan migration (cockpit to oculus), step O49 (an "Open View" submenu in the tab strip's and the empty pane's right-click menus), landed 2026-10-22. Next: close O57's review findings and /land O57; /spec O51; O54's brief; O53 after O57.

## Open items

- 243: which type flags the stage words that were chips carry (O61).
- 244: which spelling each vocabulary pair keeps (O61).

## Not done

- The look did not open the menu on an empty pane's body (C2), on a float's strip (C8) or on a locked pane (C9), and covered only the theme in force.

## The check of Steps 1

The runner's agent listing showed one agent running, O57's reviewer (a46362af9cc54a265); none of O49's builder (a33eecffdfbceb611), brief check (ab729638069c01a99) or reviewers (af0803206f26587d0, a06d0d28ac2eac6e4) was running.

## What landed

From base 374eeaa2, the range replayed in the gate worktree `.agents/worktrees/gate` and then on main, the two staged diffs equal under `cmp`. The strip's right-click menu and the empty pane's menu hold "Open View" after New Text File; its submenu lists the rail pages in the rail's order and then Float, each a submenu of its listed views, apps' views included. A pick opens the view as a tab of that pane; a unique view held by a page or float carries that page's label or "Floating pane" as its hint and is shown where it is held. The item and its picks live in `src/lib/shell/panes/strip/open-view.svelte.ts`; `opening.ts` answers the holding host beside `heldInstance`. `docs/HELP.md` names twelve unique views and has an Open View bullet; `docs/apps.md` lines 87 and 263 were changed under round 1's brief.

## Fixes at landing

- Round 1 R1: `docs/HELP.md:76` "then a Float section with the views of the floats." became "then Float with the float's views (Live HPC, Usage, Workbenches)."

## What was found

The review (`agents/reviews/O49-refuter.md`) with one repair round and a run over it; every finding is closed under its Closed heading. The builder's first report did not pass its bar (the hand-back of C13, then the repair round).

## The look

On TEST: the strip's right-click menu holds Open View after New Text File; its submenu lists Focus, Projects, Incoming, Sessions, Explorer, Academic Life, Pillars, Registries, Literature, Present, Apps, Help, System and Float (C1). Explorer lists Files with no hint; a pick of Files opened a second Files tab in that pane, active (C3); it was closed after. System lists Settings, Pages, Status, Findings, Audit, History and Processes with the hint "System"; a pick of Settings showed the System page with its Settings tab active, and TEST's pane kept its seven tabs (C5). Float lists Live HPC, Usage and Workbenches with the hint "Floating pane" (C6). Defects: none.

## Verification in the gate

```
$ npm run diagrams && npm run test:quick
test:quick: 13 changed file(s), from git since HEAD
test:quick: 21 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.8 s)
ok      eslint (17.5 s)
ok      svelte-check (23.5 s): 1792687552355 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (36.0 s): Duration  16.51s (transform 7.56s, setup 0ms, import 9.98s, tests 6.31s, environment 0ms)
ok      vitest (51.0 s): Duration  31.47s (transform 74.19s, setup 0ms, import 109.49s, tests 1.20s, environment 197ms)
ok      vitest checks (52.3 s): Duration  32.57s (transform 26.22s, setup 0ms, import 33.20s, tests 38.93s, environment 2ms)
test:quick: 55.2 s; every command passed
```

The verify list was not changed. A/B: none, `bench: []`.

## Agents

- Builder a33eecffdfbceb611, claude-opus-5-5: 172788 tokens, 44 tool uses, 5 min 13 s (hand-back of C13); round 0 build 235300 tokens, 69 tool uses, 8 min 31 s; round 1 270708 tokens, 20 tool uses, 2 min 59 s.
- Brief check ab729638069c01a99, claude-opus-5-5: 215648 tokens, 83 tool uses, 9 min 38 s.
- Reviewer af0803206f26587d0, claude-opus-5-5: 183702 tokens, 57 tool uses, 8 min 48 s.
- Reviewer over round 1 a06d0d28ac2eac6e4, claude-opus-5-5: 177883 tokens, 41 tool uses, 4 min 52 s.
