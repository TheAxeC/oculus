# O114, repair round 1

Paths widen to the files each ruling names. Run first on the current tree where a test is new. Scoped test files while working (`agents/spec.md:26`: never a suite by another name); the full list once after the last change: `npm run diagrams && npm run docs:palette && npm run test:quick`. Append to `.scratch/migration/agents/reviews/O114-report.md` in your worktree under "Repair round 1", with each ruling's result and the failing line of each new test from before its fix.

1. A pane absent from the last list (S1), and a pane's size (B2). `AgentWatch`'s tick lists the panes anew, one tmux call, and compares that list with the last answer over id, agent, cols and rows, so a new pane, a new tmux session and a pane resized each start one refresh within a tick, with or without a live control client. Tests: a pane missing from the last list, and a pane's size changed, each publish once.

2. The attach of a by-hand id (S2). A by-hand id's control client attaches with `-E`, so tmux's `update-environment` is not applied to a session oculus did not start. An oculus terminal attaches as today. Test: on a private `-S` socket, `show-environment` of a by-hand session is equal before and after the attach.

3. A shared pane (S3). `list-panes -a` prints a pane once per session holding its window; the listing folds rows by pane id, so one pane is one terminal. Test: `%0` under `work` and `view2` gives one row.

4. The steer check (B1). Replace the comparison with the login shell's name. Ask tmux for the pane's `#{pane_tty}`, ask `ps -t <tty> -o pgid=,tpgid=,command=`, and type only when a process whose `pgid` equals its `tpgid` runs an agent by `agents.ts`'s rule. Otherwise the refusal `no-agent`, nothing typed. So a quit agent, a suspended agent and any shell, login or not, type nothing. The `ps` goes through an argument list, no shell, in `processes/ps.ts`. Tests: foreground zsh, foreground bash under a zsh login, a suspended claude: refused. A foreground claude with tmux word `2.1.316`: typed. HELP's sentence stays true.

5. Close (P2). A test over `runningOf` and `endTerminals`: closing a tab that owns a by-hand terminal asks nothing, stops nothing and says nothing.

6. Exports (ST1). `SessionAsk` and `openSessionIn` stop being exported; the test goes through `createSessionOpening`.

7. Sentences (ST2). Make true: `folds.ts:270-271`, `SteerBox.svelte:4-5,20`, `SessionList.svelte:22`, `Terminal.svelte:30`. Grep `did not start` and `oculus started` across `src`, `docs` and `config` (with `--exclude=local.yml`), and fix any other the step makes false.

8. The report (S4, P1, ST3). In the appended section: for each case 1 to 13, what the unchanged tree gives, by reading `git show 9b96a1b78:<path>` or the base copy, each pass or fail with the reason; and what the code does for each asynchronous path in flight, after close and when superseded, for `AgentWatch`'s tick, the wait in `#attach` and the steer check followed by the typing, as `agents/spec.md:73` asks.

S5 is a breach of `agents/spec.md:26`, recorded; do not run `tests/checks` whole again. The rules of your first prompt stand: no git command that changes state, no page, no private-socket breach, no breakage testing, no script the brief does not build.
