# Step Q92 refuter report (on .agents/worktrees/Q92, base 09e58eb1)

## Verification (rerun by the reviewer)

```
$ sh /Users/axelfaes/.claude/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
RED: npm test
exit status: 1
 FAIL  tests/server/core/git.test.ts > the log, the branches and the worktrees > cuts every list it publishes at the cap
AssertionError: expected +0 to be 200
 FAIL  tests/server/git/git-ops.test.ts > through the endpoint, with the real operations > routes each action to its own operation with its own fields
Error: Test timed out in 5000ms.
 Test Files  2 failed | 338 passed (340)
      Tests  2 failed | 5364 passed (5366)
exit 1

(verify.sh stops at the first RED; the rest run by hand in its order)
$ npx vitest run tests/server/core/git.test.ts tests/server/git/git-ops.test.ts
  first run: Test Files 1 failed | 1 passed (2); second run: no FAIL line (both pass)
$ npm run check      -> exit 0, COMPLETED 1463 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build      -> exit 0
$ npm run format:check -> exit 0, All matched files use Prettier code style!
$ npm run lint       -> exit 0
$ LC_ALL=C grep -rna '[^ -~]' src tests -> prints nothing (exit 1)
$ spec.md ASCII perl gate over src tests bin config -> prints nothing (exit 0)
$ sh bin/folder-check.sh -> exit 0
$ find src tests config bin -type f | xargs wc -l | sort -rn | sed -n 2,4p -> 898, 896, 896 (nothing over 1000)
$ grep -rn "console" src/lib/server/accounts/calendar/ics.ts -> prints nothing (exit 1)
$ grep -rni agenda src config HELP.md DESIGN.md README.md tests docs/diagrams/*.dot
  -> only tests/state/life/calendar.test.ts:101 and tests/views/personal/calendar.test.ts:221-226 (matches the report)
$ grep -rn "agenda_empty|calendar.cancelled|calendar.tentative|open_event" src config HELP.md DESIGN.md README.md tests
  -> no reader of the removed keys
$ grep -rn ENTITIES src -> src/lib/state/life/present.ts:61, :117 only (matches the report)
$ git diff 09e58eb1 -- package-lock.json | grep '^+ *"node_modules/' -> @event-calendar/core, entities, ical.js only
$ npm ls -> @event-calendar/core@5.15.0, entities@8.1.0, ical.js@2.2.1, svelte@5.57.1
```

The two red tests are in `tests/server/core/git.test.ts` and `tests/server/git/git-ops.test.ts`. The step does not touch either file, and both pass when run again on their own. By spec.md:65 they do not count against the step. Because of them, my run of the suite does not reproduce the report's `Test Files 340 passed (340)`. Everything else in the verify list matches the report.

To check the report's claims about repeating events (spec.md:58 edge cases), I ran `readIcsText` through `node --experimental-strip-types` on a scratch script. The results:
- A COUNT=3 series that lies wholly inside the window gives 3 occurrences.
- An UNTIL series gives every day up to and including UNTIL.
- A weekly all-day series keeps its date strings.
- A moved occurrence (RECURRENCE-ID) replaces the one it moves.
- A daily series from 1990 reaches the window.
- An event that starts before the window and ends inside it is kept.

## 1. Spec
- `src/lib/state/life/calendar.ts:97`: the function is `calendarEvents(events, accounts, hues)`, where the brief named `calendarEvents(events, accounts)`. The third argument is forced: state may not import `ui/` (DESIGN boundaries, spec.md:49), and the brief itself put `HUES` under `src/lib/ui/`. The report states the change. It is a shape change the orchestrator should accept or reverse.
- `src/lib/server/accounts/calendar/ics.ts:5-10`: the brief says the file's `VTIMEZONE` blocks are "registered". The code registers nothing. It resolves each TZID through the parsed tree: ical.js `Component.getTimeZoneByID`, reached from `node_modules/ical.js/dist/ical.js:995` and `:8440`. The effect the brief asks for is met, and the poll case tests it (`2031-06-11T09:00:00+02:00`). This also keeps spec.md:73 ("No globals"), which registering in `TimezoneService` would have broken. The report states it.
- `src/lib/state/life/present.ts:61-117` (`plainTitle`'s own entity table): Z35 (a), as ruled and booked (plan.md:433), names `manual.ts` alone, and `present.ts` is not in the brief's path list. Strictly, replacing it is outside the brief's scope.
  - spec.md:74 ("a parser ... exists once and is reused") argues for folding it in.
  - The fold is small: `plainTitle`'s `nbsp` maps to a plain space, and after `decodeHTML` the U+00A0 is collapsed by the same `\s+` replace, so the output is unchanged.
  - My read: it is not inside Z35 (a) as written. Folding it in at landing is a fix under the rules file's reuse principle rather than something the brief asked for.
- The paths outside the list (`data/model/index.ts`, `connect/rows.ts`, `connect/loop.ts` made generic, `mail/poll.ts`, `server/root/context.ts`, the `Card.svelte` `heading` snippet, `RemoveAccount.svelte`, the comment-only files, and the tests `connect.test.ts`, `loop.test.ts`, `context.test.ts`, `ics-fixture.ts`) are each named in the report with a reason. From the diff:
  - Each follows from `AccountRow` replacing `ConnectAccountConfig` for an `ics` row, from the catalog sentences the poller needs, or from the title needing two spans (Card's `title` is a string).
  - Each comment edit corrects a sentence the change made false.
  - I found no change that no item asks for.
- Dependencies: only the three named libraries, plus `svelte ^5.57.0`, were added (lock diff above).

## 2. Proof
- Brief case "The validRange given to the library ... starts 2031-01-30 and ends 2031-05-03": it is tested on the pure function `calendarRange` (`tests/state/life/calendar.test.ts:760-774`). The view's handing of `range` to `options.validRange` (`Calendar.svelte`, the `...(range === null ? {} : { validRange: range })` line) is not asserted. The report says a server render runs no effects. It does not say that the `options` prop reaching the library is unasserted.
- Brief case footer "Read-only over 31 days back and 62 days ahead." (`tests/views/personal/calendar.test.ts:268-272`): the case builds its payload with `daysBack: 31, daysAhead: 62`, so it stays green with `config/behavior.yml` put back to 1 and 14. The report says this case passed on the unchanged tree. The window itself is proved by `tests/data/sources/calendar-config.test.ts:114-120`, which reads the shipped config.
- Also green on the unchanged tree, as the report says: the mail Add form offering two providers, the mail endpoint refusing `ics`, the Remove of `ics-work`, the `mail:` ics row throwing, and the Help entity case. These guard behaviour that must survive; they do not prove the change.
- The first run of the brief's cases on the unchanged tree was not reproduced (see Not checked). The quoted failures are consistent with the tree: each test names a function, key or file that base 09e58eb1 lacks.

## 3. Standards
- None found.
  - HELP.md:119, :137, :244, :246 and DESIGN.md:134, :298 match the code as read.
  - Every changed name I grepped (agenda, `google or microsoft`, `Google and Microsoft calendars`, `days_back`, `ENTITIES`, the removed keys) has no stale hit.
  - The largest changed files are 321 lines (`InboxCard.svelte`) and 319 (`Calendar.svelte`).
  - Every `--ec-*` and hue token used resolves to a theme token: `--on-c-<hue>`, `--muted-txt`, `--ink-txt`, `--accent-bg` and `--on-accent-bg` are derived in `src/lib/themes/derive.ts:227-237`; `--c-<hue>`, `--panel`, `--card`, `--chip`, `--line` and `--accent` are in the theme CSS.
  - No new file carries history.

## 4. Behaviour
- **The ICS fetch has no timeout, and a hang stalls every calendar account, not only the ics one.** The report (line 264) says "a published link that never answers holds that account's round". But `accountLoop.poll` (`src/lib/server/accounts/connect/loop.ts:122-136`) reads the round's accounts one after another with `await options.read(...)`, and `run` queues every later round and every Refresh behind the round in flight (`:151-167`). So a hung fetch of a published link stops the Google and Microsoft calendar accounts too:
  - nothing is published again;
  - Refresh never answers;
  - this lasts until the process restarts.

  The Google and Microsoft reads share this risk. A published link is still the one case where the host is any third party. The risk is named, but narrower than it is (spec.md:17).
- **The views no longer show the calendar name, the location or the tentative mark.** A tentative event is now drawn like a confirmed one. The brief, and Z35 (c) as ruled, name only "its title, time and colour by account". The report states the loss under its problems (line 263) but leaves it out of the "User-visible changes, before and after" section. The look should confirm Axel accepts it.
- **The period title comes from `Intl.DateTimeFormat.formatRange`** (library `src/storage/derived.js:161`). `node -e` on formatRange printed "Mar 3, then U+2009, U+2013, U+2009, then 9, 2031" around the dash. That is an en dash and two thin spaces on screen. The report mentions the en dash only; this is not in any authored file, so the ASCII gate does not apply.
- **The calendar paints opaque `--panel` over a wallpaper theme.** `--ec-bg-color: var(--panel)` is set, and the library paints day cells with it (`styles/days.css:2-3`). Under `body.wall`, `.pane` is transparent (`Pane.svelte:56-58`), so the calendar grid would be a solid block over the picture where other views let it show through. Not in the report; not verified on screen.
- **The height is fixed at 600px** (`Calendar.svelte`, the `.grid :global(.ec)` rule), whatever the pane's height. It is stated in the report's judgment calls but not in its before/after section. In a pane shorter than the head plus 600px there would be two scroll bars; in a tall pane, empty space. Not verified on screen.
- **The Inbox provider control changed from an `<a href target=_blank>` to a `ToolButton` that calls `window.open`** (`InboxCard.svelte:139-141`). A middle-click, or copying the link, no longer works on it. The report names the mechanism but not this loss.

## Not checked
- The first run of the cases on the unchanged tree: I did not revert the tree to reproduce it.
- The claim in the comment at `src/lib/state/life/calendar.ts:12` and in the report that the library reads an ISO string ending in `Z` as a wall clock. The library README (`timeZone`, line 2790ff) says a string with an explicit offset is shifted, and does not say how `Z` is read.
- Whether `validRange`'s end is inclusive in the library, on which the `atEnd` rule (`Calendar.svelte`, `localDay(shown.end) > range.end`) relies.
- Anything that needs a browser: the four views with events, the theming under each theme, the toolbar's disabling, the event click, the period title.

Reviewer usage: 38 tool uses, about 30 minutes.
