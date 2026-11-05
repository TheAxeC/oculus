# O153 landing

Position: roadmap entry "migration" (the oculus migration plan), step O153, Deposit in every project card's menu, landed; next: O147's landing (the Present view's filter bar), then O148 (the Project facts strip).

Open items: none.

Check of Steps 1: the runner's agent listing (ListAgents) showed none of O153's agents (builder a37253d9779601394, brief check a1fe23ba35d510aa2, reviewer ae0872378d5f180de); the one agent listed was O147's reviewer over round 1.

NOT DONE: nothing.

What landed: the Deposit row is one of the project card's actions with no condition (`src/lib/views/shared/card/project/ProjectCard.svelte`), so every project card carries it in its menu: the Projects boards, the Person view, a Listing and the project page, personal projects' cards included (ruling 688). The `deposit` prop is removed and `views/boards/project/Project.svelte` no longer passes it. The head comments of both files and `docs/HELP.md:299` ("Copy Context, Deposit and Clone") say so. Fix at landing: `src/lib/views/boards/deposit/Deposit.svelte:75` names the card's call `openBeside` in place of `openView`.

Verification, in the gate worktree at main's head 52a01311e with the range and the fix (`.agents/worktrees/gate-O153.log`):

```
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      ASCII gate (1.6 s)
ok      svelte-kit sync (3.1 s)
ok      svelte-check (9.8 s): 1793918593783 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (10.3 s)
ok      vitest checks (39.0 s): Duration  27.76s (transform 12.01s, setup 0ms, import 24.39s, tests 34.34s, environment 2ms)
test:quick: 42.3 s; every command passed
```

`npm run diagrams && npm run docs:palette` changed no file. On main the same range with the fixed file copied; `cmp` of the two `git diff --cached --no-renames 52a01311e` printed SAME.

The look, on the scratch server on 8797: a Projects board card's right-click menu and its `...` menu end "Ask, Edit Manifest, Pin to Top, Copy Context, Deposit" (BTTN and BTTR-AF, no Clone row drawn); Shift+F10 on BTTR-AF's card opens the same menu; Deposit on BTTN opened the Deposit view beside the board for `research-hub:bttn-incident-af` ("There is no mirror yet"); BTTR-AF's project page and Liesbet M. Peeters' Person view each list Deposit once in the card's menu. Nothing was pressed in the Deposit view; the scratch `.oculus` folders equal their backups and the server is stopped. No A/B: the configuration names no `bench:`.

Found: the brief check's findings closed in the brief (`agents/reviews/O153-brief-check.md`, Closed); the review found nothing under its four headings (`agents/reviews/O153-refuter.md`). The builder's first report passed its bar; no repair round was sent.

Agents: builder a37253d9779601394 (claude-opus-5-5, 155302 tokens, 41 tool uses, 6 min 19 s); brief check a1fe23ba35d510aa2 (claude-opus-5-5, 167507 tokens, 39 tool uses, 7 min 11 s); reviewer ae0872378d5f180de (claude-opus-5-5, 156545 tokens, 47 tool uses, 8 min 3 s).

Next: O147 lands with its round-1 review's findings fixed at landing; then O148.
