# O64 builder report

Everything in the brief is done. Two paths outside the write list are changed because the ruling's status bar fix needs them: `src/lib/state/workbench/navigation/status.ts` and `src/routes/+page.svelte` (see "Files"). Every behaviour that only a page shows is proved by reading, with the look on landing named; no page was run (`spec.md:64`).

## Open items of the state file (verbatim)

`orchestrator-state.md`, section "Open items", holds no entry; its whole text is:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first reading (unchanged tree, base 4c89702d, read before any change)

Each case was read through its code path on the base, with the lines quoted. Each case also names the look on landing on TEST.

- C1.
  - Read: `Inbox.svelte:121-127` draws `ConnectorHead`. Its button `ConnectorHead.svelte:78` (`<ToolButton label={words.refresh} onclick={onrefresh} />`) has no `glyph` and no `turning`. The press calls `inbox.svelte.ts:96` and waits on `/api/mail`, which answers after `await target.refresh()` (`mail/routes.ts:139-141`, `mail/poll.ts:305` `loop.run(true)`).
  - Result: no glyph, and nothing shows the wait.
  - Look: Inbox, press Refresh now; the refresh glyph beside the words turns until the answer.
- C2.
  - Read: `Calendar.svelte:196-200` draws the same head. `calendar.svelte.ts:66` posts, and `calendar/routes.ts:47-49` answers after `calendar/poll.ts:319` `loop.run(true)`.
  - Result: no glyph.
  - Look: Calendar, the same as C1.
- C3.
  - Read: a timed poll (`connect/loop.ts:121`) only publishes, and no client store method sees it.
  - Result: nothing turns.
  - Look: Inbox open across a timed poll with no press; the glyph stays still.
- C4.
  - Read: each press is its own `command` promise (`inbox.svelte.ts:67-71`), with no count.
  - Result: nothing turns.
  - Look: press twice; the glyph turns until the second answer.
- C5.
  - Read: the control is in `<span class="act">` (`Usage.svelte:198-206`, `turning={refreshing(account.label)}` at `:203`). `.act { display: var(--card-at-rest, inline-flex); }` (`:362-363`), and `Card.svelte:114-133` sets `--card-at-rest: none` at rest.
  - Result: the control is not drawn once the pointer and the focus leave the card.
  - Look: Usage, press Refresh, move the pointer and the focus away; the control stays drawn and turning until the answer, then is not drawn.
- C6.
  - Read: with no press, `refreshing` is false (`usage-refresh.svelte.ts:94`).
  - Result: not drawn at rest, drawn under the pointer.
  - Look: an account nobody pressed is the same as on main.
- C7.
  - Read: a 404 `account not found` gives `usage.refusal_not_found` (`usage-refresh.svelte.ts:29-30`, `:77`), and the `finally` lowers the count (`:80-82`).
  - Result: the turn stops and the refusal shows.
  - Look: read only; TEST has no unknown label to press.
- C8.
  - Read: `CommitBox.svelte:176-184` has `glyph="spark"`, `compact bare` and no `turning`. Its label is `git.suggest_pending` while `suggesting` (`:177`), and that label is only the accessible name (`ToolButton.svelte:52`, `:93`). `suggest` (`repositories.svelte.ts:448-456`) sets `acting[root] = 'suggest'` (`:308`). `RUNNING_WORDS` (`:60-74`) has no `suggest`, so `running` (`:274-281`) returns null and `busyWords` (`:474`) says "Working". Cancel is hidden while suggesting (`RepoMessage.svelte:30`).
  - Result: the glyph is still, the accessible name is "Reading the staged diff", no line is drawn, and the message line says "Working".
  - Look: see the result table.
- C9.
  - Read: `RepoList.svelte:264-268` draws a line across the row (`:290-297`, `left: 0; right: 0`). `Repo.svelte:266-270` draws one across the header (`.bar`, `:420-426`).
  - Result: two lines, one of them across the header.
- C10.
  - Read: the rows are drawn only while the section is open (`TreeSection.svelte:76`).
  - Result: the section draws no line; only the header line shows.
- C11.
  - Read: `RepoList.svelte:159` reads each row's own repository; `Repo.svelte:133` reads the shown repository's.
  - Result: a line across that repository's row, and none on the header.
- C12.
  - Read: `Glyph.svelte:89-92` stops the turn; `Progress.svelte:62-68` draws the bar full width, still, at half opacity.
  - Result: everything drawn still.
- C13.
  - Read: `unstage` is not in `RUNNING_WORDS`.
  - Result: no line, and the message line says "Working".
- C14.
  - Read: `postCommand` never throws and answers `failed: 'unreachable'` (`writes.svelte.ts:200-233`). The stores map that to `inbox.refused`, `calendar.refused` or `accounts.unreachable` (`inbox.svelte.ts:31-37`, `calendar.svelte.ts:44-52`).
  - Result: no glyph; the said line shows the refusal.
- C15.
  - Read: the inbox and calendar stores are separate objects (`context.ts:440-441`).
  - Result: nothing turns.
- C16.
  - Read: there is one inbox store per client (`context.ts:441`), read through `useState()`.
  - Result: nothing turns.
- C17.
  - Read: in `loop.ts:157-174`, a `run(true)` during a round returns `queued`, which resolves after the follow-up round; the route awaits it.
  - Result: the route answers after both rounds.
- C18.
  - Read: `loop.ts:160` resolves at once when there is no account, and the route answers `{ status: 'ok' }`.
  - Result: an immediate ok and no error.
- C19.
  - Read: `send` says the error (`repositories.svelte.ts:320`) and clears `acting` (`:328-330`); the `finally` clears `suggesting` (`:455`).
  - Result: the refusal is said; there is no turn or line to stop.
- C20.
  - Read: both commit boxes read the one store's `suggesting(root)` (`:480`).
  - Result: both are disabled, and neither turns.
- C21.
  - Read: the row's line is `left: 0; right: 0` (`RepoList.svelte:290-297`).
  - Result: the line is as wide as the row and runs under the controls.
- C22.
  - Read: the row's line is in the row, so it scrolls with the list. The message line is sticky at the pane's foot (`RepoMessage.svelte:57-69`).
  - Result: as the case says.
- C23 (added by the ruling).
  - Read: `RepoItems.svelte:122-125` reads `git.running(repo.root)`, the first root of the repository whose action has words, and keeps it only when it is in `SYNC_ACTIONS`. On the base, `suggest` has no words, so it is passed over and a fetch on another root is found.
  - Result: the sync item turns.
  - The case breaks once `suggest` has words while the read stays the same, so the ruling's fix is built.

### The case handed back, and the ruling

- **C8, with item 4's line in C9 to C11.**
  - Rule 1 (item 4 and Decision 7): the line is drawn through `TreeItem`'s `words` snippet.
  - Rule 2 (item 4): the line keeps its words as its accessible name.
  - Result: the snippet renders inside `<button class="main" aria-label={name ?? label}>` (`TreeItem.svelte:211-233`) for both the repository row (`onclick`, `RepoList.svelte:187` on the base) and the section head (`TreeSection.svelte:71`). WAI-ARIA 1.2 gives the button role presentational children, so the progressbar's role and name are not exposed. What a browser actually exposes was not checked, since no page was run.
- **Ruling (`agents/briefs/O64-cases.md`), option (a):**
  - The line stays inside the name's box.
  - While an action runs, the row's existing `TreeItem` `name` prop carries "<name>, <words>" through the new key `repositories.row_running: '{0}, {1}'`.
  - `TreeSection` gains an optional `name` for the folded head.
  - `config/text/views/sources/repositories.yml` joins the write list.
  - The status bar's sync item looks for a running action among `SYNC_ACTIONS` over every root of the repository (`RepoItems.svelte` joins the write list, with C23).
  - The terminal palette's still glyph is not changed; it is named under the visible changes.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1 Inbox and Calendar Refresh | DONE | `inbox.svelte.ts:64` `let pressed = $state(0)`, `:96`/`:100` raised and lowered in `try`/`finally`, `:114` `refreshing: () => pressed > 0`; the same at `calendar.svelte.ts:44`, `:72`, `:76`, `:87`; `ConnectorHead.svelte:86` `<ToolButton label={words.refresh} glyph="refresh" turning={refreshing} onclick={onrefresh} />`; `Inbox.svelte:125` and `Calendar.svelte:199` `refreshing={refreshing()}`. Final list run: `ok svelte-check (23.5 s): ... 0 ERRORS 0 WARNINGS` |
| 2 Usage Refresh held drawn | DONE | `Usage.svelte:199` `<span class="act" class:held={refreshing(account.label)}>`, `:374-376` `.act.held { display: inline-flex; }`; `Card.svelte` unchanged (`diff -q` against the base copy prints nothing) |
| 3 Suggest turns, words, key | DONE | `changes.yml:26` `running_suggest: Writing the commit message...` (between `running_stash_pop` and `running_sync`), `suggest_pending` removed from `git:`; `repositories.svelte.ts:75` `suggest: () => t('git.running_suggest')`; `CommitBox.svelte:182` `label={suggesting ? t('git.running_suggest') : t('git.suggest')}`, `:185` `turning={suggesting}` |
| 4 One git line under the name | DONE | `RepoList.svelte:173-179` the `named` snippet (name text plus `<span class="running"><Progress percent={null} .../></span>`), `:193-196` and `:233-236` handed as `words` to the section head and to each row, `:186` and `:215` the accessible names, `:331-347` `.named`/`.running` CSS; `Repo.svelte` line, `.bar`, `.head` rule, `Progress` import, `running` and `selectors` removed; `TreeSection.svelte:73-74` passes `{name}` and `{words}` to its head |
| Ruling: status bar sync item (C23) | DONE | `repositories.svelte.ts:278-286` `running(roots, among?)`; `status.ts` `running: (root: string, among?: readonly string[])`; `+page.svelte:234` `running: (root, among) => repositories.running(rootsOfRepository(root), among)`; `RepoItems.svelte:127` `const syncing = $derived(git.running(repo.root, SYNC_ACTIONS));` |
| 5 Help | DONE | `docs/HELP.md:305`, `:310`, `:485` rewritten (quoted under the visible changes) |
| Verify 1 `npm run diagrams && npm run test:quick` | DONE | Final run: `test:quick: 56.7 s; every command passed` (lines quoted below) |
| Verify 2 cases C1 to C23 | DONE | The result table below |
| Verify 3 `wc -l` | DONE | The largest component is `RepoList.svelte` at 359 (limit 520); the largest source file is `repositories.svelte.ts` at 637 (limit 880) |
| Verify 4 unused exports | DONE | `sh utils/unused-exports.sh` against `migration-O64-base/unused-exports.txt`: `diff` exit 0, no line added |
| Verify 5 history words | DONE | Quoted below |
| Verify 6 name grep | DONE | Quoted below |
| ASCII | DONE | `LC_ALL=C grep -n '[^ -~]'` over the 17 touched files: exit 1, nothing printed. The gate's `perl` form over `src tests config`: 0 lines. The list's line: `ok ASCII gate (0.8 s)` |

The final run of the list (the second run), as printed:

```
test:quick: 22 changed file(s), from git since HEAD
test:quick: 14 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (16.0 s)
ok      svelte-check (23.5 s): 1792699243781 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (41.3 s): Duration  29.83s (transform 12.10s, setup 0ms, import 37.34s, tests 18.67s, environment 1ms)
ok      vitest (48.7 s): Duration  37.55s (transform 81.60s, setup 0ms, import 120.97s, tests 4.41s, environment 673ms)
ok      vitest checks (54.4 s): Duration  43.16s (transform 3.91s, setup 0ms, import 11.85s, tests 31.00s, environment 0ms)
test:quick: 56.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```

**Runs of the list.** The list ran twice, each run preceded by `npm run diagrams`.
- The first run failed on eslint only, with three errors in files this step changed:
  - `repositories.svelte.ts 283:17 no-unnecessary-condition`
  - `RepoList.svelte 194:30` and `233:46 no-confusing-void-expression`
- After the fix, `npx eslint` on those two files alone exited 0, and `npx prettier --check` on them passed.
- The second run passed every command.
- No whole-suite command was run.

**Tests.** The step adds and changes no test, and none needed changing. No test file and no allow list differ from the base copy (`diff -rq` over `tests` and `utils` printed nothing).

### Case results after the change (read, with the look on landing)

- C1, C2. ConnectorHead draws `glyph="refresh"` with `turning={refreshing}` (`:86`). The button is not `compact` or `bare`, so `iconOnly` is false and the label stays drawn beside the glyph (`ToolButton.svelte:52`, `:117-122`). `refreshing` is `pressed > 0` from the press (`inbox.svelte.ts:96`) to the `finally` (`:100`), which runs once the route answers. Look: Inbox and Calendar, press Refresh now; the glyph turns until the answer.
- C3. A timed poll calls no store method, so `pressed` stays 0. Look: the glyph stays still across a timed poll.
- C4. Two presses make `pressed` 2. The first answer lowers it to 1, so it is still above 0, and the second answer lowers it to 0. Look: two quick presses.
- C5. `.act.held { display: inline-flex; }` (`Usage.svelte:374-376`) outranks `.act`'s `var(--card-at-rest, ...)` by specificity while `refreshing(label)` is true. The class goes when the store lowers the count (`usage-refresh.svelte.ts:81`). Look: press, then move the pointer and the focus away; the control stays drawn and turning, then is not drawn after the answer.
- C6. With no press, `held` is false and `.act` follows `--card-at-rest` as on main. Look: an account nobody pressed is the same as on main.
- C7. The refusal path is unchanged; the `finally` lowers the count, so `held` and `turning` go and `refreshRefusal` shows the words. Look: read only.
- C8.
  - While suggesting, the spark turns (`CommitBox.svelte:185`) and its `aria-label` is "Writing the commit message..." (`:182`).
  - `running` now finds `suggest` in `RUNNING_WORDS` (`repositories.svelte.ts:75`), so the row draws the line inside its name.
  - The row's accessible name is "<name>, Writing the commit message..." (`RepoList.svelte:155-157`, `:215`).
  - `RepoMessage.svelte:29` says the words through `busyWords`, and Cancel stays hidden (`:30`).
  - The Session view's Changes draws the same `CommitBox` (`ChangesRepo.svelte:78`), and `ChangesRepo.svelte:99` says the same words.
  - After the answer `acting` and `suggesting` clear and the message is set (`:452-455`).
  - Look: Repositories view and the Session view's Changes, staged changes, press the spark: it turns; a line runs under the repository's name; the message line says "Writing the commit message..." with no Cancel. After the answer the box holds the message and nothing moves.
- C9.
  - Only `RepoList` draws a line. `Repo.svelte` has no `Progress`, `.bar` or `running` (grep of `Progress\|running\|\.bar` in `Repo.svelte` prints nothing).
  - The line sits in `.named`, a block of the row's height (`line-height: calc(var(--tree-row) * var(--text-scale, 1))`, `RepoList.svelte:331-337`). That block is the only content of `TreeItem`'s `.name` span, so the line at `bottom: 0` lies on the row's foot, as wide as the name's box.
  - Look: commit, push or fetch; one line, under the name only, and none on the header.
- C10.
  - While `collapsed` holds `repos`, `folded` is the first listed repository's running action (`RepoList.svelte:148-152`). The head draws `named('Repositories', folded)` through `TreeSection`'s `words`, so the line is under the word only, and the head's name is "Repositories, <words>".
  - While the section is open, `folded` is null, so the head draws no line.
  - Look: fold Repositories and run a fetch; the line is under the word Repositories, as wide as that word.
- C11. Each row reads `runningOn(root)` (`:202`), so the line is on the row of the repository the action runs on. Look: sync the other repository from the status bar; its row draws the line, and the selected row draws none.
- C12. `Progress.svelte:62-68` and `Glyph.svelte:89-92` are unchanged, so everything is drawn still and the line is still drawn. Look: Reduce motion on.
- C13. `unstage` has no words: no line, and "Working". Look: unstage a file.
- C14. `postCommand` never throws, and the `finally` runs on a refusal and on `unreachable`, so the turn stops at the answer and `said` shows the same words as on main. Look: read only.
- C15. `refreshing` is per store, and the Inbox's and the Calendar's are separate objects. Look: with both open, press the Inbox's; only its glyph turns.
- C16. One store per client, so every Inbox view reads the same `pressed`, a reopened one included. Look: two Inbox panes, then close and reopen one during a press.
- C17. The route awaits `queued`, so `pressed` holds through both rounds. Look: read only.
- C18. The route answers at once, so the `finally` lowers the count at once and `answer.ok` leaves `said` empty. Look: an Inbox with no account.
- C19. `acting` clears, so the line goes. `suggesting` clears, so the turn stops. The outcome shows the refusal. Look: an account with no `commit_message_account`.
- C20. Both boxes read the one `suggesting(root)`, so both turn. Look: the same root in both views.
- C21.
  - `.name` has `min-width: 0` and shrinks before the yielding controls, which give way first (`yielding={readable}`).
  - `.named` is a block whose width is `.name`'s, cut with `overflow: hidden; text-overflow: ellipsis`.
  - The line is `left: 0; right: 0` of `.named`, so it is as wide as the part of the name drawn and never under Branch, Sync or Publish.
  - Look: narrow the pane during a fetch.
- C22. The line is inside the row, so it scrolls with the list; the message line is sticky and unchanged. Look: scroll the list away during a fetch.
- C23.
  - `RepoItems.svelte:127` asks `git.running(repo.root, SYNC_ACTIONS)`.
  - `running` skips an action outside `among` and goes on to the next root (`repositories.svelte.ts:282-283`), so a suggestion on one root does not hide a fetch on another.
  - Look: a worktree of the repository fetching while Suggest runs on the main folder; the sync item turns.

### Verify 5, history words

The grep was run over the added lines (`diff` of each changed file against the base copy, `^>`), kept to comment lines, for `before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands`. It printed:

```
RepoItems.svelte: >     // still under the system's reduce-motion setting. The page says which of those actions runs
TreeSection.svelte: >     // closed before a tab switch is closed after it. The caller may draw the head's name itself,
RepoList.svelte: >     // the pointer through to the row and is drawn still under the system's reduce-motion setting.
```

None is history:
- The RepoItems line is "still" meaning motionless, in the existing sentence rewrapped.
- The TreeSection line is the existing sentence about a tab switch, rewrapped with the new sentence.
- The RepoList line is "drawn still", meaning motionless.

### Verify 6, names

The grep ran across `src tests config docs README.md` with `--exclude=local.yml`; output under `docs/diagrams` was dropped. The rows below summarise the output.

| Name | Where it appears now |
| --- | --- |
| `suggest_pending` | `Deposit.svelte:336` and `deposit.yml:62`. That is the `deposit.` group's own key and a different catalog line, so it is left alone. No `git.suggest_pending` remains. |
| `data-repo-running`, `data-repo-row` | No hit. |
| `running_suggest` | `repositories.svelte.ts:75`, `CommitBox.svelte:182`, `changes.yml:26`. |
| `row_running` | `RepoList.svelte:156`, `repositories.yml:123`. |
| `refreshing` | The new readers are `inbox.svelte.ts:53,114`, `calendar.svelte.ts:33,87`, `ConnectorHead.svelte:6,35,43,86`, `Inbox.svelte:62,125`, `Calendar.svelte:67,199` and `Usage.svelte:199`. The other hits are other concepts (`queries`, `lines`, the usage refresher's state). |
| `.running` class in the Repositories views | `RepoList.svelte:175`, `:339` only. |
| `TreeSection` `words` and `name` | No mention in `docs` or `README.md`. |

Head comments, doc comments and help lines:

| Text | Verdict |
| --- | --- |
| `Usage.svelte:27-29` | Rewritten. |
| `.act` comment | Rewritten. |
| `Repo.svelte:16-20` | Rewritten. |
| `.head` comment | Removed with its rule. |
| `RepoList.svelte:18-21` | Rewritten as its own paragraph. |
| Row comment `:285` | Removed with `[data-repo-row]`; the `.named` comment says where the line lies. |
| `inbox.svelte.ts:5-7` | Rewritten. |
| `calendar.svelte.ts` head | A paragraph added. |
| `ConnectorHead.svelte:2-4` | Still true ("the one explicit refresh" holds); a paragraph about the turning glyph added. |
| `CommitBox.svelte` head | A paragraph added. |
| `TreeSection.svelte` head | A sentence added. |
| `RepoItems.svelte` head | Rewritten and rewrapped. |
| `status.ts` `StatusGit` doc | Rewritten. |
| `RUNNING_WORDS` doc and the `running` doc in `repositories.svelte.ts` | Rewritten. |
| `docs/HELP.md:305`, `:310`, `:485` | Rewritten. |
| `AccountActions.svelte:6`, `docs/HELP.md:256` and `:483` | Still true. |

## Files

Made from `diff -rq` of `src tests utils config` against `migration-O64-base`; the line counts are `wc -l` after the last change.

| File | Lines | +/- | In the write list |
| --- | --- | --- | --- |
| `src/lib/shell/status/RepoItems.svelte` | 286 | +14 -12 | yes (ruling) |
| `src/lib/state/feeds/inbox.svelte.ts` | 120 | +23 -4 | yes |
| `src/lib/state/life/calendar.svelte.ts` | 91 | +23 -1 | yes |
| `src/lib/state/sources/repositories/repositories.svelte.ts` | 637 | +11 -6 | yes |
| `src/lib/state/workbench/navigation/status.ts` | 605 | +3 -2 | no: `StatusGit.running` gains `among` so the sync item can ask for its actions alone (the ruling's fix) |
| `src/lib/ui/tree/TreeSection.svelte` | 112 | +14 -1 | yes |
| `src/lib/views/feeds/inbox/Inbox.svelte` | 290 | +2 -1 | yes |
| `src/lib/views/personal/calendar/Calendar.svelte` | 434 | +2 -1 | yes |
| `src/lib/views/shared/changes/CommitBox.svelte` | 316 | +7 -1 | yes |
| `src/lib/views/shared/forms/accounts/ConnectorHead.svelte` | 124 | +9 -1 | yes |
| `src/lib/views/sources/repositories/RepoList.svelte` | 359 | +63 -13 | yes |
| `src/lib/views/sources/repositories/repo/Repo.svelte` | 427 | +5 -28 | yes |
| `src/lib/views/system/machine/usage/Usage.svelte` | 387 | +10 -3 | yes |
| `src/routes/+page.svelte` | 330 | +1 -1 | no: the page's `StatusGit` passes `among` to the store (the ruling's fix) |
| `config/text/views/sessions/changes.yml` | 116 | +1 -1 | yes |
| `config/text/views/sources/repositories.yml` | 337 | +1 -0 | yes (ruling) |
| `docs/HELP.md` | 549 | lines 305, 310, 485 | yes |
| `docs/diagrams/` | | as `npm run diagrams` writes it | yes |
| `.scratch/migration/agents/reviews/O64-report.md` | | this report | yes |

`docs/diagrams/` was regenerated before each run of the list. Whether its files differ from the base was not checked, because the base copy holds no `docs/`. `Repo.svelte` no longer imports `Progress`, which can move one edge of the views-layer diagram.

## Judgment calls the brief left open (each reversible)

1. **The status bar's read** takes a filter argument: `running(roots, among?)` on the store, carried through `StatusGit.running(root, among?)` and the page.
   - The rule for which action counts stays in the store's one loop.
   - The other shape (the item walking the roots itself) would have left `git.running` without a reader.
   - This widened the paths by `status.ts` and `+page.svelte`.
2. **The name's box is the row's height.** `.named` is a block with `line-height` equal to the row height, so the line at the box's foot lies on the row's foot.
   - The words are centred on the row's line as the row's flex centring placed them.
   - The ellipsis moves from `TreeItem`'s `.name` to `.named`, the box that now holds the words, with the same `overflow: hidden; text-overflow: ellipsis`.
3. **Every repository row and the section head always draw their name through `words`**, not only while an action runs, so a row's box does not change shape when a line appears.
4. **The folded head shows the first listed repository's running action** (`roots.map(runningOn).find(...)`), with that action's words.
5. **Usage held state:** the class `held` on `.act` with `.act.held { display: inline-flex; }`.
6. **Attributes and classes removed.**
   - The `li`'s `data-repo-row` attribute and its `position: relative` rule are removed. They existed only to place the old line, and nothing reads them.
   - `Repo.svelte`'s header `div` loses the class `head`, whose one rule placed the old line; the `div` keeps its `title`.
7. **Suggest stays disabled while it turns**, as on main, so the turning spark is drawn at the disabled half opacity.

## Visible changes, before and after

1. **Inbox and Calendar Refresh now.**
   - Before: the words only.
   - After: the refresh glyph before the words, turning from a press until its answer, in every view of that connector.
   - Look: Inbox and Calendar, press Refresh now.
2. **Usage Refresh.**
   - Before: not drawn at rest even while it turned.
   - After: drawn and turning on its card while a press waits, whatever the pointer and the focus do, then back to the at-rest rule.
   - Look: Usage, press Refresh and move away.
3. **Suggest control.**
   - Before: a still spark with accessible name "Reading the staged diff".
   - After: a turning spark with accessible name "Writing the commit message...". Its hover words stay "Suggest".
4. **`busyWords` readers during a suggestion.** Each changes from "Working" to "Writing the commit message...":
   - `CommitBox.svelte:83` (the commit choices' hover words), `:191`, `:208`
   - `FolderRow.svelte:86,99,111`
   - `GraphActions.svelte:57,67,76,86`
   - `RepoList.svelte` Branch, Sync and Publish hover words
   - `ChangesRepo.svelte:99` (the Session view's message line)
   - `RepoMessage.svelte:29` (the pane's message line)
5. **Git moving line.**
   - Before: two lines, one across the repository's row and one across the header row, the header one with the words as hover words.
   - After: one line under the repository's name in the list, as wide as the name drawn, with no hover words; none on the header. While the section is folded, the line is under the word Repositories.
   - Look: Repositories view, fetch with the section open, then folded, then in a narrow pane.
6. **Accessible names.**
   - Before: a repository row's name was its label.
   - After: while an action with words runs, it is "<name>, <words>", for example "oculus, Fetching...". While folded and running, the section head's name is "Repositories, <words>".
   - The row is a `treeitem` whose `aria-label` changes while it holds the focus. Whether a screen reader speaks the change was not checked.
7. **Status bar sync item.**
   - Before: it did not turn for a push, pull, fetch, sync or publish on one root while an action with words of another kind ran on an earlier root of the same repository.
   - After: it turns.
8. **Help.**
   - `:305` adds "Refresh now, here and on the Calendar, turns its glyph until that refresh answers."
   - `:310` adds ", and stays shown on its card, turning, until then."
   - `:485` now opens: "While a commit, push, pull, fetch, sync, publish, checkout, merge or stash runs, or a commit message is written, a moving line is drawn under the repository's name in the Repositories list (under the section's head while the list is folded), and the repository's view says what runs ("Committing...", "Pushing...", "Writing the commit message..."); the Suggest glyph turns while the message is written. The status bar's sync item ..." The rest is unchanged.
9. **Terminal palette with icons off (unchanged, per the ruling).** A glyph is drawn as its ASCII stand-in, and only an `svg` turns (`Glyph.svelte:78`). Under that palette, neither the new Refresh glyph nor the spark turns, as for the Usage Refresh on main. The moving line is drawn there.

## Wrong or impossible in the brief

- **Accessible name of the line.** Rule 1 and rule 2 of item 4 cannot both hold; this was handed back and ruled (above).
- **`ConnectorHead.svelte:2-4`.** The brief lists "the one explicit refresh" as a sentence the change makes false. It is still true, since Refresh is still the bar's one explicit refresh. The head comment gained a paragraph about the turning glyph instead.
- **`RepoMessage.svelte:2-7`** (outside the write list). It says a write in flight is said "with Cancel". A suggestion has no Cancel (`:30`), on main as now; it now says words of its own and still has no Cancel. The sentence was already short of the suggestion before this step. It is not changed, because the file is outside the write list.

## Limitations and sharp edges

- **No browser look was taken.** Every visible result above rests on reading the code. In particular, that `.named`'s `line-height` centres the words exactly where the flex centring put them is a reading; the look on landing checks it, in the row and in the folded head.
- **The folded head names only one running action.** When several repositories run actions with words, it shows the first listed one's words.
- **Two clients see different turning states.** The pending presses are per client, so a second browser tab does not turn its Refresh for a press made in the first. The brief scopes this to "every view of the page".
