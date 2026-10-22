# Brief check of O64 (brief `.scratch/migration/agents/briefs/O64.md`, main at 5a88d90c)

The brief cannot be dispatched as written. Four findings change what the builder can do:
- **Brief line 47 breaks the rules file.** It sends the builder to run its own dev server and read the DOM by a browser script or a screenshot. `spec.md:64` says "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says". `spec.md:65` says a behaviour that needs a DOM is seen at the look on landing.
- **Item 4's folded state has no path in the write list.** `TreeSection.svelte` has no snippet for its head's name. The only routes left are a measurement (`spec.md:87`: "a reader-visible behaviour is state, not a DOM side effect") or a file the brief does not list.
- **Item 4 asks for two things that cannot both hold.** It wants the line to keep "its hover words" and also "the pointer passed through".
- **The brief does not name the base copy or the base's `unused-exports.txt`.** `spec.md:33` and `:87` need both.

## Names

Commands, each run from `~/workspace/oculus` across `src tests docs config README.md .scratch/migration/agents/guarded.md`, with `--exclude=local.yml`:
- `grep -rn --exclude=local.yml -- "<name>" ...` for `ConnectorHead`, `data-repo-running`, `RUNNING_WORDS`, `running_suggest`, `suggest_pending`, `data-repo-row` and `repo-running`.
- `grep -rln -- "<name>" tests` for `refreshing`, `usage-refresh`, `inbox.svelte`, `calendar.svelte`, `repositories.svelte`, `running_`, `CommitBox`, `RepoList`, `repo/Repo`, `Repo.svelte`, `progressbar`, `ConnectorHead`, `createInbox`, `createCalendar` and `busyWords`.

**Does any test read `data-repo-running`, the header bar of `Repo.svelte`, or the Progress inside it?** No.
- `data-repo-running` has one hit, `Repo.svelte:267`.
- The tests grep prints nothing for every one of those names.
- Nothing under `utils/` or `docs/diagrams` names the line: `grep -rn 'data-repo-running\|repo-running\|data-repo-row\|\.running\b' utils docs/diagrams` prints nothing.

Hits outside "Paths this step writes":
- `src/lib/views/shared/forms/accounts/AccountActions.svelte:6` says "its refresh are in the pane's bar (ConnectorHead.svelte)". Still true.
- `src/lib/views/boards/deposit/Deposit.svelte:336` and `config/text/views/boards/deposit.yml:62` hold `deposit.suggest_pending`. This is a different key, so it is not affected.
- `src/lib/shell/status/RepoItems.svelte:123` (through `src/routes/+page.svelte:234`) calls `repositories.running`. It keeps only `SYNC_ACTIONS` (`RepoItems.svelte:119`, `['push', 'pull', 'fetch', 'sync', 'publish']`), so adding `suggest` to `RUNNING_WORDS` does not turn the status bar's sync glyph. Not made false.
- Callers of `busyWords` (`grep -rn 'busyWords' src`) change what they show during a suggestion, from "Working" to "Writing the commit message...":
  - `ChangesRepo.svelte:99` (the Session view's message line), fed by `ChangesRepository.svelte:167`;
  - `FolderRow.svelte:86,99,111`;
  - `GraphActions.svelte:57,67,76,86`;
  - inside the write list, `RepoList.svelte:192-195` and `CommitBox.svelte:83,191,208`.

  No sentence about them becomes false, but the brief does not name these hover words as a visible change. The report's before-and-after section needs them.
- `docs/HELP.md:483` ("The button in the field writes a message from the staged diff.") and `docs/HELP.md:256` (the Calendar table row) are outside the write list. Both stay true.
- `.scratch/migration/agents/guarded.md`: the brief's own grep (`grep -n "ConnectorHead\|usage-refresh\|refreshing\|RUNNING_WORDS\|RepoList\|Repo.svelte" ...`) prints nothing. A wider grep prints:
  - G101 at `guarded.md:285`, `followPrepared` "used by `CommitBox.svelte`";
  - G104 at `guarded.md:294`, `openHead` and `openIndex` in `src/lib/state/sources/repositories/repositories.svelte.ts`.

  The step changes neither unit, so no entry's test is owed. The premise about this grep is wrong (see Premises).

Sentences inside the write list that the change makes false and that "What to build" does not name. `spec.md:70` covers them, but the brief should list them:
- `Usage.svelte:359-361`, the `.act` comment: "At rest it is not drawn and takes no room". This is false for a press that is waiting. Item 2 names only `:27-29`.
- `Repo.svelte:407-408`, the `.head` comment: "The header holds the moving line, which lies over its foot". The `position: relative` it explains may have no other reason to stay. Item 4 says "its CSS" without naming this rule.
- `RepoList.svelte:285`: "The row's own box, so its moving line is laid along the row's foot". This is false if the line moves into the name.
- `inbox.svelte.ts:5-7`: "The only state of this store's own is which threads have a write in flight". Item 1's "each store's head comment says so" covers it loosely.
- `ConnectorHead.svelte:2-4`: "the one explicit refresh". Item 1 names it.

Name collisions: `refreshing` is already a field of `Read<T>` (`state/shared/stores/shapes.ts:461`) and a refresher state (`model-sessions.ts:721`). The new `refreshing(): boolean` on `InboxStore` and `CalendarStore` collides with neither type.

## The step line

Step line (`plan.md:705`), part by part:
1. "Refresh on the Inbox ... shows that it is running": item 1, plus C1, C3 and C4.
2. "... and Usage views": item 2, plus C5 to C7.
3. "generating a commit message shows that it is running": item 3, plus C8.
4. "the moving bar of a running git command is drawn only under the Repositories header, just under the selected repository's name": item 4, plus C9 to C11.
5. "rather than across the view": item 4's removal of `Repo.svelte`'s line, plus C9.

Item 5 (the help) serves `spec.md:70`. The Calendar in items 1 and 5 goes beyond the line (decision 1).

Every part of the line has a requirement. Two places where the brief reads the line, both recorded as decisions as `spec.md:18` asks:
- C11 and decision 3 draw the line under the repository the action runs on, which may not be "the selected repository".
- Decision 4 adds the folded head.

## Premises

The brief says "read on main at 5a88d90c". `git log -1 --format=%h` gives 5a88d90c.

Premises that hold:
- `Glyph.svelte:27-28` (prop) and `:77-92` (animation, reduce-motion), by `sed -n`.
- `ToolButton.svelte:17`, `:109` and `:52` (`grep -n turning`, `sed -n`).
- `Inbox.svelte:121-127` and `Calendar.svelte:196-200`.
- `grep -rln ConnectorHead src` gives three files, as the brief says.
- `inbox.svelte.ts:48,96`; `calendar.svelte.ts:26,66`.
- `mail/routes.ts:139-141`; `calendar/routes.ts:47-49`; `mail/poll.ts:305` (`refresh: () => loop.run(true)`).
- `Usage.svelte:197-207`, `:27-29` and `:362-369`.
- `usage-refresh.svelte.ts:38-90`; `usage/routes.ts:21`; `refresh.ts:325-329`.
- `Card.svelte:114-133`.
- `CommitBox.svelte:175-185`; `changes.yml:71` ("Reading the staged diff").
- `repositories.svelte.ts:274` (`running`) and `:448-456` (`suggest`).
- `RepoMessage.svelte:28-39`.
- `RepoList.svelte:264-268` and `:290-297`.
- `Repositories.svelte:408-421`.
- `docs/HELP.md:305`, `:310` and `:485` say what the brief quotes.
- Every `wc -l` count matches (380, 310, 309, 450, 632, 116, 101, 433, 289).
- `ls docs/adr` gives "No such file or directory".

Premises that are off:
- `ConnectorHead.svelte:79` is `:78`. `cat -n` shows line 78 as `<ToolButton label={words.refresh} onclick={onrefresh} />` and line 79 as `<p class="meta">`.
- `RUNNING_WORDS` "(`:60-74`)": the doc comment is `:55-58` and the const runs from 60 to 74. This holds.
- `running()` "(`:274-281`)": `grep -n 'function running'` gives 274, so this holds.
- `RepoList.svelte` head comment "`:17-20`": the sentence about the line is `:18-21`. Line 17 is about the disabled controls.
- `Repo.svelte` "`:265-270`": the `{#if running !== null}` block is `:266-270` (`grep -n` gives 266 and 267).
- `Repo.svelte` "`.bar` at `:419`": it is `:420`.
- `Repo.svelte` head comment "`:16-19`": the sentence ends on `:20`.
- "an icon-only button draws its label nowhere" is incomplete. `ToolButton.svelte` sets `aria-label={named ? label : undefined}` with `named` true for icon-only, so "Reading the staged diff" is the button's accessible name while it runs. The hover words are `title={t('git.suggest')}`, "Suggest".
- "The commit box is also drawn by the Session view's Changes (`ChangesRepository.svelte`)": the box is drawn by `ChangesRepo.svelte:78` (`<CommitBox {root} git={state} />`). `ChangesRepository.svelte` draws `ChangesRepo`.
- Tests premise (brief line 17): the brief's grep "prints only G-entries naming `CommitBox.svelte` ... line 285". The command prints nothing, since the pattern has no `CommitBox`. The brief also leaves out G104 (`guarded.md:294`), which names `repositories.svelte.ts`. The conclusion (no test owed) still holds.
- Not checkable from the tree: the Chrome reading on TEST (brief line 14, "measure 0 by 0 at rest"). See "Declined to judge".

What the brief does not state but the builder meets:
- `src/lib/ui/tree/TreeItem.svelte` is 540 lines (`wc -l`). The size check is `COMPONENT = 540` (`tests/checks/tree/size.test.ts:30`) and `grep TreeItem utils/size-allow.txt` prints nothing, so TreeItem cannot grow.
- The row's name can be replaced through TreeItem's existing `words` snippet (`TreeItem.svelte:155-156`, `item-props.ts:96`). That is the one route to "as wide as the name" inside `RepoList.svelte` with no measurement, and the brief does not name it.
- `TreeSection.svelte` (99 lines) passes no `words` to its head's TreeItem (`TreeSection.svelte:60-75`). It draws its children only while open (`:76`).

## Cases and checks

Inconsistent with the rules file:
- **Brief line 47.** "on the builder's own dev server over the demo fixture hub ... with the DOM read by a script in the browser or a screenshot" breaks `spec.md:64` and `:65`. Line 45 has the same problem: "The builder's first task ... the first run of every case above on the unchanged tree" can only be a reading.

  Every case C1 to C13 needs a DOM: a press, a hover, a focus or a class. So each must be checked by reading the code path, and its DONE row must name the look on landing, with the view, the state to put it in and what should be seen.
- **Verify item 1.** "each output piped through the filter the rules file names": `spec.md` names no filter (`grep -n -i filter .scratch/migration/agents/spec.md` prints nothing). Earlier briefs say "each output read by its own exit" (`briefs/O58.md:101`, `briefs/O51.md:138`).
- **Verify item 4.** "the standards pages' rules on list items and sentence length": the one standards page, `spec.md`, has no such rules (`grep -n -i 'sentence length\|list item' spec.md` prints nothing).
- **The verify list misses two checks `spec.md` requires.**
  - `sh utils/unused-exports.sh` against the base's lines (`spec.md:87`). The brief names no base copy and no base `unused-exports.txt`, which `spec.md:33` needs; O51 names both (`briefs/O51.md:23`, `:144`).
  - The history-word grep of added comments (`spec.md:44`) and the name grep (`spec.md:70`). The rules file still binds the builder to these, but the report shape (brief lines 109-118) leaves them out.
- **Report location.** The brief has the builder write `.scratch/migration/agents/reviews/O64-report.md` and lists it under "Paths this step writes". `spec.md:36` says "You never edit anything under `.scratch/`." Earlier briefs do the same but add "in the worktree" (`briefs/O58.md:115`); O64 does not say it.

Cases that ask the builder to check a place the step does not change: none. C8 and C13 read `RepoMessage.svelte`, which is unchanged, but what it shows depends on `RUNNING_WORDS`, which the step changes.

## The question

Could each case pass without the goal being reached?
- **C1, C2, C4:** yes, as run. The demo fixture has no mail or calendar account, and `accountLoop.run` returns `Promise.resolve()` when `accounts.length === 0` (`connect/loop.ts`). The route answers at once, so no run can see "while the route has not answered", and these cases reduce to a reading.
- **C3:** no. With C1 it pins that only a press turns the glyph.
- **C5:** no. It names the pointer and the focus leaving.
- **C6, C7:** no.
- **C8:** yes, for the Session view. It names no view, so a pass in the Repositories view alone leaves the Session view's commit box (item 3's last sentence) unchecked.
- **C9:** no. It counts lines and names the width.
- **C10:** yes. "lies under the section's head" passes with a line across the whole head, while item 4 asks for a line "under the word Repositories".
- **C11:** no.
- **C12:** yes, partly. "every glyph and line of C1 to C11 is drawn still" does not cover C8's suggest glyph separately, though C8 falls within "C1 to C11".
- **C13:** no.

The step line's check, and each item:
- **Item 1:** a builder could hold the press in ConnectorHead's own `$state`. Decision 2 is in "Decisions", not in item 1's text, and no case catches it: two Inbox views, or Inbox and Calendar side by side.
- **Item 2:** no.
- **Item 3:** yes, partly. The button's accessible name stays "Reading the staged diff" while the line and the message line say "Writing the commit message...", so one running action carries two sentences. The brief does not say which the button takes.
- **Item 4:** yes, in two ways.
  - The folded state has no means in the write list (see Names and Premises), so a builder could meet it only by measuring, a DOM side effect `spec.md:87` rules out, or by a path outside the list.
  - "its hover words ... the pointer passed through" cannot both hold. `RepoList.svelte:296` sets `pointer-events: none` and has no `title`. The hover words exist only on `Repo.svelte:267`'s `.bar`, which does not pass the pointer through.
- **Item 5:** the Calendar has no help bullet. "said also for the Calendar where its line is" points at nothing (`grep -n Calendar docs/HELP.md` gives only `:52` and the table row `:256`), so only the "once for both" form is open.

## Implied inputs

Inputs the step implies but "Cases" leaves out, each with its expected result:
1. **An Inbox or Calendar refresh whose route refuses, or a server that cannot be reached.** The glyph stops at the answer, and the said line shows `inbox.refused`, `calendar.refused` or `accounts.unreachable`, as today. Missing; C7 covers only Usage. A wrong answer is a glyph turning for good.
2. **Inbox and Calendar both open, one Refresh pressed.** Only that view's glyph turns. Missing. This catches a press held in `ConnectorHead` or in the shared `accounts.svelte.ts`.
3. **One Inbox view open in two panes, or a view closed and reopened while a press waits.** Both turn, and the reopened view turns until the answer (decision 2). Missing.
4. **A press that lands while a timed round runs.** The route answers only after the in-flight round and one follow-up round (`connect/loop.ts`, `queued`), and the glyph turns through both. Missing; cheap to read.
5. **Inbox or Calendar unconfigured (no accounts).** The route answers at once (`run` returns `Promise.resolve()`), the glyph stops at once, and no error shows. Missing; low cost.
6. **A suggestion that is refused** (no `commit_message_account`, `claude` not found). The glyph stops, the line goes, and the message line says the refusal, as today. Missing.
7. **The commit box in the Session view.** The spark glyph turns, `ChangesRepo.svelte:99` says "Writing the commit message...", and no Cancel shows (`ChangesRepository.svelte:182` gives `oncancel` only when not suggesting). Missing.
8. **A suggestion pressed while both the Repositories view and the Session view show the same root.** Both commit boxes turn (`suggesting` is per root). Missing; low cost.
9. **A repository whose name is cut when the row is narrow.** The line is as wide as the visible, cut name, never laid over the Branch, Sync or Publish controls or past the row. Missing. Item 4 does not say whether "the width of the name's text" means the whole text or the part drawn.
10. **The Repositories section scrolled out of sight while an action runs.** The line scrolls with it, and the message line at the pane's foot still says the words. Missing; it should at least be said as the end state, since the header line that is removed scrolled the same way.
11. **A root that is not readable.** Not applicable: such a row has no Branch or Sync controls (`RepoList.svelte:190`) and runs no action.
12. **A second press of the same control while one waits.**
    - Inbox: C4.
    - Usage: the existing count.
    - Suggest: disabled (`CommitBox.svelte:182`).

    Nothing missing.

## ADRs

`ls docs/adr` gives "ls: docs/adr: No such file or directory". There is no ADR folder.

## Dictated text

- `git.running_suggest: Writing the commit message...`. Found by `grep -n 'Writing the commit message' .scratch/migration/agents/briefs/O64.md`, which gives lines 25, 27, 38 and 80.
  - **Holds** against `spec.md:21` (ASCII, no em dash, no "not X but Y") and `spec.md:50` (a new key joins its group where the group already is: the `git:` group at `changes.yml:3`, where the `running_` keys are lines 15-26).
  - It follows the shape of `running_commit: Committing...` and the other `running_` keys.
  - In alphabetical order it falls between `running_stash_pop` (`:25`) and `running_sync` (`:26`).
  - The rules file has no rule on synonyms, so the second name for one action (`git.suggest_pending`, "Reading the staged diff", on the button) breaks no rule. It is listed under The question as a gap the brief leaves open.
- Item 5's help sentences are paraphrases, not dictated words. **Holds**, apart from the Calendar bullet that does not exist (see The question).
- `LC_ALL=C grep -c '[^ -~]' .scratch/migration/agents/briefs/O64.md` gives 0. The brief is ASCII.

## Declined to judge

- The Chrome measurement on TEST ("the three `Refresh now` buttons of the Usage float measure 0 by 0 at rest", brief line 14). My launch prompt forbids ports 8787 and 8790, and nothing is running elsewhere. The CSS chain (`Usage.svelte:362-369`, `Card.svelte:114-133`) is consistent with it.
- Whether a CSS-only line under the word Repositories in the folded head is buildable without a change to `TreeSection.svelte`. I checked that `TreeSection` has no snippet for its head's name. I did not design or try the alternatives, since this agent changes nothing.
- Path overlap with the other briefs in flight (O54, O61, O65). The launch prompt did not ask for it. A grep of `briefs/O61.md` and `briefs/O65.md` for O64's paths found `docs/HELP.md` in both: O61 at the lines that name project words, O65 at `:115-124` and `:155-172`. Neither overlaps `:305-310` or `:485`.

Usage: a807f5f7c26db7f22, claude-opus-5-5, 192674 tokens, 55 tool uses, 7 min 16 s

## Closed

Each finding is closed by a change to `agents/briefs/O64.md`:

1. Brief line 47 against `spec.md:64` and `:65`: the Cases section now says every case is checked by reading the code path, with the lines quoted, and each case's report row names the look on landing with the view, the state and what should be seen. The dev server, the browser script and the screenshot are gone, and "first run" became "first reading".
2. Item 4's folded state had no path: `src/lib/ui/tree/TreeSection.svelte` joins "Paths this step writes" and gains an optional `words` snippet handed to its head's `TreeItem`. The row's name is drawn through `TreeItem`'s existing `words` snippet, so no measurement is taken and `TreeItem.svelte` (540 lines, at its limit) is not changed. Decision 7 records it, and "What is on the tree" states the TreeSection, TreeItem and size facts.
3. Hover words against the pointer passed through: item 4 now keeps what `RepoList`'s line has today, its words as its accessible name, no hover words, the pointer passed through.
4. Base copy and base `unused-exports.txt`: "What is on the tree" names `.agents/worktrees/migration-O64-base/` with `unused-exports.txt`, and verify item 4 compares against it.
5. The readers of `busyWords` and the status bar's `SYNC_ACTIONS`: named under "What is on the tree", in item 3, and in the report's before-and-after line.
6. The sentences the change makes false (`Usage.svelte:359-361`, `Repo.svelte:407-408`, `RepoList.svelte:285`, `inbox.svelte.ts:5-7`, `ConnectorHead.svelte:2-4`) and the ones still true (`AccountActions.svelte:6`, `HELP.md:256`, `:483`) are listed under "What is on the tree"; items 2 and 4 name the comments they rewrite.
7. Premise line numbers corrected: `ConnectorHead.svelte:78`, `RepoList.svelte:18-21`, `Repo.svelte:266-270`, `.bar` at `:420`, `Repo.svelte:16-20`. The tests premise now quotes the grep that prints nothing and the wider grep with G101 and G104. The suggest control's accessible name and hover words are stated, and the Session view's box is placed at `ChangesRepo.svelte:78`.
8. Item 3's two sentences for one action: the control's accessible name while running is `git.running_suggest`, and `git.suggest_pending` is removed with its one reader (decision 6). C8 names both views and the accessible name.
9. Item 1's press held in `ConnectorHead`: item 1's text now says the presses live in the store, never in `ConnectorHead`, with the refusal behaviour; C15 and C16 check it.
10. C10 passing with a line across the head: C10 now says under the word Repositories, as wide as that word, not across the head.
11. C12 and the suggest glyph: C12 now names it.
12. Item 5's Calendar bullet that does not exist: item 5 now says once for both in the Inbox bullet.
13. Implied inputs 1 to 10 are cases C14 to C22 (1 is C14, 2 is C15, 3 is C16, 4 is C17, 5 is C18, 6 is C19, 7 is within C8, 8 is C20, 9 is C21, 10 is C22). Inputs 11 and 12 need nothing, as the report says.
14. Verify item 1's filter: now "each output read by its own exit". Verify item 4's standards rules that do not exist: replaced by the `unused-exports.sh` compare (`spec.md:87`), the history-word grep (`spec.md:44`) and the name grep with the comment list (`spec.md:70`).
15. Report location: the report path now says "in the worktree", in "Paths this step writes" and in "Report".
16. The dictated key holds; decision 5 places it between `running_stash_pop` and `running_sync`.
