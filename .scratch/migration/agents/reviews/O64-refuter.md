# O64, refuted

Verification lines

- `export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npm run diagrams && npm run test:quick -- --base 4c89702d` (run from the worktree root; tail of the output):
```
ok      prettier (21.8 s): All matched files use Prettier code style!
ok      ASCII gate (23.4 s)
ok      svelte-kit sync (55.9 s)
ok      eslint (178.4 s)
ok      vitest slow (204.4 s): Duration  135.92s (transform 63.88s, setup 0ms, import 159.52s, tests 70.54s, environment 1ms)
ok      svelte-check (229.7 s): 1792700012169 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (238.4 s): Duration  170.73s (transform 17.37s, setup 0ms, import 38.67s, tests 130.09s, environment 1ms)
ok      vitest (248.1 s): Duration  180.57s (transform 443.65s, setup 0ms, import 626.90s, tests 22.26s, environment 4.38s)
test:quick: 311.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```
  `git status --short` after `npm run diagrams`: the same 21 modified paths and 2 untracked ledger files as before the run (the four `docs/diagrams` files unchanged in status).
- `LC_ALL=C grep -n '[^ -~]'` over the 17 modified non-svg files and the builder's report: nothing printed, exit 1.
- The spec.md perl ASCII gate over `src tests bin config` (`! -name local.yml`), piped to `wc -l`: `0` (with `bfs: error: bin: No such file or directory.`; the worktree has no `bin`).
- `sh utils/unused-exports.sh > <scratch>/ue.txt; diff ../migration-O64-base/unused-exports.txt <scratch>/ue.txt`: nothing printed, `diff exit 0` (the base list is 343 lines).
- `wc -l` of the changed files: changes.yml 116, repositories.yml 337, HELP.md 549, RepoItems.svelte 286, inbox.svelte.ts 120, calendar.svelte.ts 91, repositories.svelte.ts 637, status.ts 605, TreeSection.svelte 112, Inbox.svelte 290, Calendar.svelte 434, CommitBox.svelte 316, ConnectorHead.svelte 124, RepoList.svelte 359, Repo.svelte 427, Usage.svelte 387, +page.svelte 330. All within 520 (components) and 880 (source). The figures match the report's file table.
- History-word grep over the added comment lines of `git diff 4c89702d -- src config docs/HELP.md`: three hits, `RepoItems.svelte` "still under the system's reduce-motion setting", `TreeSection.svelte` "closed before a tab switch", `RepoList.svelte` "drawn still under the system's reduce-motion setting". None is history ("still" means motionless; "before a tab switch" is the unchanged sentence rewrapped). Same three as the report.
- Name greps across `src tests config docs README.md` (`--exclude=local.yml`, `docs/diagrams` dropped): `suggest_pending` gives only `Deposit.svelte:336` and `deposit.yml:62` (the `deposit.` group's own key); `running_suggest` gives `repositories.svelte.ts:75`, `CommitBox.svelte:182`, `changes.yml:26`; `row_running` gives `RepoList.svelte:156`, `repositories.yml:123`; `data-repo-row`, `data-repo-running` and `repo-running` give no hit; `.bar` gives no hit under `src/lib/views/sources` (the hits in tests/docs are Card's `.bar` and `notes.bar`); `running(` readers of the repositories store are `RepoItems.svelte:127`, `RepoList.svelte:144`, `+page.svelte:234` and `repositories.svelte.ts:479`; the new `refreshing` readers match the report's row.
- Rerun of the report's evidence commands: `diff -q` of `Card.svelte` against the base copy gives exit 0. `grep -n 'Progress\|running\|\.bar' Repo.svelte` prints nothing (exit 1). `diff -rq` of the base copy's `tests` and `utils` against the worktree's prints nothing. `npx eslint repositories.svelte.ts RepoList.svelte` gives exit 0. `npx prettier --check` on the same two files: "All matched files use Prettier code style!". Every claim reproduces.

Verdicts on items

1. Inbox and Calendar Refresh: holds. `ConnectorHead.svelte:86` `<ToolButton label={words.refresh} glyph="refresh" turning={refreshing} onclick={onrefresh} />`. The button is neither compact nor bare, so `iconOnly` is false (`ToolButton.svelte:52`) and the label stays drawn. Each store counts its presses: `let pressed = $state(0)`, raised before the `await` and lowered in `finally`, `refreshing: () => pressed > 0` (inbox.svelte.ts, calendar.svelte.ts). There is one store each per client (`context.ts:440-441`). The head comments of both stores and of `ConnectorHead` say it. The Calendar's Refresh is inside the brief: item 1 and decision 1 name it.
2. Usage Refresh: holds. `Usage.svelte:199` `class:held={refreshing(account.label)}` and `.act.held { display: inline-flex; }`. Specificity 0,2,0 beats `.act`'s `display: var(--card-at-rest, ...)`. Card.svelte is unchanged (diff -q exit 0). The head comment and the `.act` comment are rewritten.
3. Suggested commit message: holds. `RUNNING_WORDS` has `suggest: () => t('git.running_suggest')`. `CommitBox.svelte:182` and `:185` carry the label and `turning={suggesting}`. `git.suggest_pending` is removed and the key is placed between `running_stash_pop` and `running_sync`.
4. One git line under the name: holds. It is drawn through `TreeItem`'s `words` (TreeItem.svelte is unchanged; it was 540 on the base). The `Repo.svelte` line, `.bar`, `.head`, the `Progress` import, `running` and `selectors` are removed. `TreeSection` gains `words` and `name`. The folded head is drawn through `folded`. The ruling's accessible name is built through `accessibleName` and `repositories.row_running`.
5. Help: holds. Lines 305, 310 and 485 are rewritten as the item asks, and no other help line changed.
6. Ruling, status bar sync item: holds. `running(roots, among?)` skips actions outside `among` and continues to later roots, and `RepoItems.svelte:127` reads `git.running(repo.root, SYNC_ACTIONS)`.
   - The changes to `status.ts` (the `StatusGit.running` signature and its doc) and to `+page.svelte` (passing `among` through) are outside the write list. The ruling allowed "a filter argument to `running`", and that shape cannot reach the store without both files: `RepoItems` sees only `StatusGit`, and `StatusGit.running(root)` already resolves every root of the repository.
   - The report names both paths in its first line. They are judged a consequence of the ruling, so they get no finding. The orchestrator adds them to the booked paths.
   - Under "the item walking the roots itself", `RepoItems` would have reached `useState()` stores past the page's `StatusGit` seam (its head comment says the page hands those reads in), so the filter shape was the better one.

Verdicts on cases

- C1: met by reading. The glyph is bound to `pressed > 0`, raised at the press and lowered in `finally` after the route's answer. Look: Inbox, press Refresh now; the glyph turns until the answer.
- C2: met by reading, through the same `ConnectorHead` and the calendar store's own count. Look: Calendar, the same press.
- C3: met. No store method runs on a timed poll, so `pressed` stays 0.
- C4: met. The count goes 2, then 1 (still turning), then 0.
- C5: met by reading (the specificity of `.act.held`). Look: Usage, press Refresh, move the pointer and the focus off the card; the control stays drawn and turning until the answer, then is not drawn.
- C6: met. `held` is false with no press, and `.act` falls back to `--card-at-rest`.
- C7: met. The refusal path in `usage-refresh.svelte.ts` is unchanged, and `finally` clears `held` and `turning`.
- C8: met by reading. The spark turns, its `aria-label` is "Writing the commit message...", `busyWords` gives the words, and Cancel stays hidden (`RepoMessage.svelte:30`). The row's accessible name is "<name>, Writing the commit message...". In the Session view's Changes there is no Repositories list, so no line is drawn there, on the base or now; only the glyph and the words apply in that view. Look: both views, with staged changes, press Suggest.
- C9: met by reading. `Repo.svelte` has no `Progress` (grep exit 1), and the one line is inside `.named`. Look: the width under the name.
- C10: met by reading. `folded` is non-null only while `collapsed` holds `repos`, and is drawn through `TreeSection`'s `words`. Look: fold Repositories and run a fetch.
- C11: met. Each row reads `runningOn(root)` for its own repository.
- C12: met by reading. `Glyph.svelte` and `Progress.svelte` are unchanged, and their reduce-motion rules apply. Look: Reduce motion on.
- C13: met. `unstage` is not in `RUNNING_WORDS`.
- C14: met. `postCommand` answers with no throw (the builder's read), and `finally` runs on every path.
- C15: met. The two stores are separate objects (`context.ts:440-441`).
- C16: met. There is one store per client, and the count lives in the store.
- C17: met. The count holds until the route answers, whatever the loop does inside the route.
- C18: met. An immediate answer lowers the count at once.
- C19: met. `send`'s `finally` clears `acting` (`repositories.svelte.ts:333-335`) and `suggest`'s `finally` clears `suggesting` (`:459-461`).
- C20: met. Both commit boxes read the store's `suggesting(root)`.
- C21: not verifiable here. By reading, `.named` is the width of TreeItem's shrinking `.name` (`min-width: 0`), and the actions lie outside `.main`. The look settles it: narrow the Repositories pane during a fetch; the line ends at the drawn part of the name.
- C22: met. The line is inside the row, and `RepoMessage` is unchanged.
- C23: met by reading. With `among = SYNC_ACTIONS`, a `suggest` on an earlier root is skipped (`continue` past a non-member) and a `fetch` on a later root is returned. Look: a worktree fetching while Suggest runs on the main folder.

Spec

S1. Brief, "What is on the tree", fourth bullet: the premise "`grep -rn 'data-repo-running\|repo-running\|data-repo-row\|\.running\b' utils docs/diagrams tests` prints nothing" does not reproduce. On the base copy (`utils tests`) and on the worktree (`utils docs/diagrams tests`) it prints 28 lines, for example `tests/server/machine/runs/lint/eslint-life.test.ts:80: expect(lint.eslint.running()).toHaveLength(1);` and `tests/server/machine/hpc/submit.test.ts:240: expect(deps.submits.running.size).toBe(0);`. All 28 are unrelated `.running` members; the narrower grep without `\.running\b` prints 0. The conclusion the brief draws (nothing reads the attribute or the CSS class) holds, so no work is wrong. Failure scenario: a reader rerunning the brief's check sees 28 hits and either mistrusts the premise or spends time ruling each one out.

Proof

P1. Report, "Verify 6, names": the brief's verify item 6 asks for the grep "quoted". The report gives a summary table instead of the output. My rerun of the same greps agrees with every row of the table, so no decision rests on a wrong figure. Failure scenario: the orchestrator cannot check the grep from the report alone and has to rerun it.

Standards

T1. `RepoList.svelte:173-179`, the `named` snippet:
```
<span class="named"
    >{text}{#if running !== null}<span class="running"
            ><Progress percent={null} label={running.words} /></span
        >{/if}</span
>
```
`Progress.svelte` renders `<div class="track" role="progressbar">`. Through `TreeItem`'s `words`, that `div` now lies inside `<span>` elements inside `<button class="main">` (`TreeItem.svelte:211-233`). A `div` (flow content) inside a `button` and a `span` (both phrasing content only) breaks the HTML content model. On the base the line was a `div` inside the `li`, which is valid. The ruling chose to keep `Progress` inside the button, so the placement is ruled; the element type was not. No spec.md line names HTML validity, so this is raised for the orchestrator's judgment and is not counted as a rule break. Failure scenario: an audit of the Repositories view reports invalid nesting on every repository row while a git action runs.

T2. `RepoList.svelte:233-236` and the next lines: the new `{#snippet words()}` given to a repository row's `TreeItem` sits beside the existing `{#snippet actions(reach: number)}`, which declares `{@const words = working ? repositories.busyWords(root) : ''}`. Inside `actions`, `words` is a string that shadows the snippet `words`, so one block of children uses one name for two different things. The snippet's name is fixed by `TreeItem`'s prop, so the `@const` is the one that could be renamed. Failure scenario: a maintainer reading `actions` takes `words` for the name snippet, or the other way round; svelte-check would catch a wrong render, so the cost is readability only.

Behaviour

none. Every host- or user-visible change found in the diff is stated in the report with its before and after: the Refresh glyph on Inbox and Calendar; the Usage control held drawn; the turning spark and its accessible name; the `busyWords` readers; one line under the name, none on the header, and the header's hover words gone; the row and head accessible names; the status bar sync item; the help lines; the terminal palette.

Declined to judge

- The brief's TEST reading that the Usage `Refresh now` buttons measure 0 by 0 at rest: it needs a page.
- Whether a browser exposes the `progressbar` inside the row's button, and whether a screen reader speaks the changed `aria-label` of a focused `treeitem`: it needs a page and a screen reader.
- Whether `.named`'s `line-height: calc(var(--tree-row) * var(--text-scale, 1))` places the words exactly where flex centring placed them, in a repository row and in the heading row: the look on landing.
- How many times the builder ran the verify list, and whether any whole-suite command was run: settled only by the builder's transcript.
- Whether the regenerated `docs/diagrams/*.svg` differ from the base beyond the edge counts in the `.dot` diffs (291 and 1037): settled by `git diff 4c89702d -- docs/diagrams/layer-views.svg docs/diagrams/layers.svg`, not read in full.
- The builder's claim that `ConnectorHead.svelte:2-4` ("the one explicit refresh") stays true, contrary to the brief: on reading it stays true, since Refresh is still the bar's one explicit refresh; the brief's listing of it is the orchestrator's to correct.

Usage: a33ea399d56edb98b, claude-opus-5-5, 185824 tokens, 47 tool uses, 15 min 17 s

## Repair round 1, refuted

Usage: aabffa79636343fa8, claude-opus-5-5, 166633 tokens, 36 tool uses, 4 min 56 s.

Verification (from `.agents/worktrees/migration-O64`): `npm run diagrams && npm run test:quick -- --base 4c89702d` ended "test:quick: 50.2 s; every command passed" (prettier, ASCII gate, svelte-kit sync, eslint, svelte-check 536 files 0 errors 0 warnings, vitest slow, vitest, vitest checks); the perl ASCII gate over src, tests and config printed 0 lines; `LC_ALL=C grep -n '[^ -~]'` over the changed paths printed nothing; `wc -l`: Progress.svelte 78, RepoList.svelte 363; `git diff 4c89702d --numstat`: Progress.svelte 5 2, RepoList.svelte 71 17; `sh utils/unused-exports.sh` against the base list: diff exit 0; the history-word grep over the lines the round added: no hit.

Verdicts for the whole diff since 4c89702d: items 1 to 5 hold; the cases ruling's items and its status-bar ruling hold; C1 to C20, C22 and C23 met (C1, C2, C8 to C11 and C23 by reading, with the look named for each); C21 not verifiable here, settled by the look (narrow the Repositories pane during a fetch).

Round findings:
- T1 closed: `Progress.svelte:22-32` is a `span` with `display: block` (`:36`), role, label and `aria-value*` unchanged; inside the row's button it sits in `TreeItem.svelte`'s `<span class="name">` (`:155-156`); its four users (`NoticeEntry.svelte:47`, `Literature.svelte:217`, `Results.svelte:135`, `RepoList.svelte:176`) each place it as a flex item, which draws the same; no stylesheet or test outside targets the track.
- T2 closed: `RepoList.svelte:240-242` declares `busyWords`, used at `:245`, `:256` and `:278`; `grep -n "? words"` exits 1.
- P1 closed: the seven quoted greps rerun give the same lines (sorted diff exit 0).

Spec: none. Proof: none (no test changed). Behaviour: none.

Standards:
- T3. `O64-report.md`, "Files": no row for `src/lib/ui/display/meters/Progress.svelte` (`spec.md:35`, every changed path in the table). Failure scenario: the landing books its paths from the table and leaves out a primitive four views share.
- T4. `O64-report.md`, C12: "`Progress.svelte:62-68` ... are unchanged"; after round 1 the file is changed and its reduce-motion rule is at `:65-71` (`spec.md:14`). Failure scenario: a reader opens `:62-68` and finds the keyframes.
- T5. `O64-report.md`, T2 block: lines `243` and `254` quoted for the uses, which are at `:245` and `:256`, and the `@const` at `:240-242` (`spec.md:14`). Failure scenario: a reader jumps to `:243` and lands on an opening tag.

Declined to judge: whether the four users draw the bar pixel for pixel as on main (the look at landing: a notice with progress, a Literature search, a running Search, the Repositories row during a fetch); whether a validator accepts `role="progressbar"` inside a `button` (no validator installed; by the HTML content model the span is phrasing content, not interactive); how many times the builder ran the verify list in the round (only its transcript settles it).

### Closed

- T3, T4, T5: fixed at landing in the report, in the main ledger's `agents/reviews/O64-report.md` (the Progress.svelte row added to "Files", C12's sentence rewritten to `:65-71`, the T2 block's lines set to `240-242`, `245`, `256`); small and inside the brief, never sent back (`refute_after_repair: yes`).
- S1 of the first review: closed with no work: the brief's grep was wider than its claim, and its conclusion holds (the narrower grep prints 0), so nothing built rests on it.
- T1, T2 and P1 of the first review: closed in repair round 1, as above.
