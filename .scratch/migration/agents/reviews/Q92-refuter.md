# Step Q92 refuter report (on .agents/worktrees/Q92, base 8685afa6)

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
$ git diff 8685afa6 -- package-lock.json | grep '^+ *"node_modules/' -> @event-calendar/core, entities, ical.js only
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
- The first run of the brief's cases on the unchanged tree was not reproduced (see Not checked). The quoted failures are consistent with the tree: each test names a function, key or file that base 8685afa6 lacks.

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

## Repair round 1, refuted (worktree .agents/worktrees/Q92, round delta `git diff abe17f5f`, read against `git diff 8685afa6`)

```
$ export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH; sh /Users/axelfaes/.claude/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
RED: npm test
exit status: 1
 FAIL  tests/ui/colours.test.ts > the colour rule > holds in every component under ui, shell, views and routes
+   "lib/views/personal/calendar/Calendar.svelte: :global(body.wall) .grid :global(.ec-header), :global(body.wall) .grid :global(.ec-list .ec-day-head): background-color: color-mix(in srgb, var(--panel) var(--wall-panel), transparent) (raw colour)",
+   "lib/views/personal/calendar/Calendar.svelte: :global(body.wall) .grid :global(.ec-popup): background-color: color-mix(in srgb, var(--panel) var(--wall-popover), transparent) (raw colour)",
 Test Files  1 failed | 339 passed (340)
      Tests  1 failed | 5381 passed (5382)
(the same single failure on two runs; exit 1)

verify.sh stops at the first RED, so I ran the rest by hand, in its order:
$ npm run check          -> COMPLETED 1463 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS, exit 0
$ npm run build          -> exit 0
$ npm run format:check   -> All matched files use Prettier code style!
$ npm run lint           -> exit 0
$ ! LC_ALL=C grep -rna '[^ -~]' src tests -> prints nothing (grep exit 1)
$ the spec.md ASCII perl gate over src tests bin config -> prints nothing, exit 0

The report's quoted runs, rerun in the same form:
$ npx vitest run tests/server/accounts/calendar/poll.test.ts tests/server/accounts/mail/poll.test.ts tests/state/life/calendar.test.ts tests/state/life/present.test.ts tests/views/personal/calendar.test.ts
 Test Files  5 passed (5)
      Tests  115 passed (115)            (matches)
$ npx vitest run tests/server/accounts
 Test Files  13 passed (13)
      Tests  145 passed (145)            (matches)
$ grep -rn ENTITIES src tests            -> prints nothing, exit 1 (matches)
$ grep -rn "console" src/lib/server/accounts/calendar/ics.ts -> prints nothing, exit 1 (matches)
$ find . -name "*.mutbak" -not -path "./node_modules/*" -> prints nothing (matches)
$ node -e (the old plainTitle beside decodeHTML) on 'Tom&nbsp;&amp;&nbsp;Jerry&#39;s <em>deck</em>' -> both "Tom & Jerry's deck" (matches)
```

The "seen failing with the change undone" quotes (item 8) were not reproduced, because my brief forbids editing files. Each one fits the code as I read it.

### Spec

- `src/lib/views/personal/calendar/Calendar.svelte:259-264`, `.calendar { ... height: 100%; min-height: 480px; ... }`. Round item 3 asks for "one scroll bar, whatever the pane's height". The 480px floor goes beyond the item and brings back two scroll bars (the pane's and the time grid's) in any pane shorter than 480px. The report states this at lines 372 and 394, so it is not silent, but the item asked for something else. Also, `.grid` has `min-height: 0` and the account rows, the Add form and the footer all share that column. In a pane of about 480px with several account rows, nothing gives the grid a usable minimum height. This last point is inference and not verified in a browser. Either the orchestrator accepts the floor or it is removed at landing.
- The other reaches beyond the items, each judged:
  - The fourth `hues` argument on `calendarOptions`: forced by the round's own ruling that state may not import `ui/`. Within the round.
  - `calendar.time_range` (`'{0} to {1}'`): item 4's time range needs catalog words. Within the round.
  - `calendarRange` answering null for an `updated` that does not parse: this is what item 5's "no validRange when the payload has no `updated`" case needs. Its effect on the view is that the toolbar and grid are hidden while `range` is null (`Calendar.svelte:213`, `&& range`). The server never publishes that payload: `poll.ts:162` always writes `now().toISOString()`. Within the round.
  - The redrawn hour, half-hour and tick lines (`Calendar.svelte:797-845`): they follow from item 2. A transparent `--ec-bg-color` removes the background-colour stripes the library uses to dot or cut its gradient lines (`node_modules/@event-calendar/core/src/styles/days.css:17-40`, `sidebar.css:24-30`). Within the round.
  - The header row and list date-heading surfaces: they follow from items 2 and 3 together. `.ec-header` is `position: sticky` (library `styles/index.css:50-56`), so a transparent header would show the rows scrolled under it. Within the round, but see Standards: the wallpaper forms of these rules and of the popup rule break the colour rule.

### Proof

- `src/lib/views/personal/calendar/Calendar.svelte:180-183` (`eventDidMount` sets `info.el.title`): no test reaches it. Delete the callback and the suite stays green. The five tooltip cases test only the pure `eventTooltip` and its carriage in `extendedProps`. So item 4's claim that the tooltip is on the event rests on reading the code. The report says hover is not verified in a browser (line 427), but its round table marks item 4 DONE with only the state tests as proof.
- `Calendar.svelte:166-167` (`...calendarOptions(data, held.view, viewWords(), HUES)`): nothing asserts that the view passes `calendarOptions`' result through unchanged. Add `validRange: undefined` or `height: '600px'` after the spread and every test stays green: the options cases test the pure function, and the view audit reads only the CSS rules. The round's first refuter finding ("the `options` prop reaching the library is unasserted") therefore holds at the view level. It is closed only for the pure function.
- `tests/views/personal/calendar.test.ts:218` is titled "audits that the library's box ... paints no surface of its own". The same round paints the header row, the list date headings and the popup with `--panel` (`Calendar.svelte:778-795`), so the title says something false about the view it audits.
- The report's first line says "Everything in the brief and in repair round 1 ... is done". The verify list is red on a file of this round (below). The report says the colour test was not run in round 1 (line 430), but its round table has no row that is not DONE.

### Standards

- `src/lib/views/personal/calendar/Calendar.svelte:785-795`: two rules break the colour rule, `tests/ui/colours.test.ts:329-343` and `:422`:
  - `:global(body.wall) .grid :global(.ec-header), :global(body.wall) .grid :global(.ec-list .ec-day-head) { background-color: color-mix(in srgb, var(--panel) var(--wall-panel), transparent); ... }`
  - `:global(body.wall) .grid :global(.ec-popup) { background-color: color-mix(in srgb, var(--panel) var(--wall-popover), transparent); ... }`

  The rule allows the wallpaper `color-mix` only on the `background` property (`if (one.property === 'background' && wallMix(one.value)) continue;`), so both are reported as raw colour, and `npm test` is RED. For the popup, `background:` fixes it. For the list date heading, the shorthand would also reset the `background-image` that `:782-784` sets for today's chip, so the fix has to keep that layer: put the image in the same `background` shorthand, or order the rules so the image is set after.
- No other finding over the delta:
  - no history in any added comment (grep of the added lines for round, step ids, dates, "no longer", "previously": nothing);
  - ASCII gates clean;
  - the new catalog keys `accounts.timed_out`, `calendar.tentative` and `calendar.time_range` each have a reader (`server/root/context.ts:317`, `:330`; `Calendar.svelte:109-110`);
  - the largest changed files are within the limits (Calendar.svelte 410 lines, oauth.ts 340, poll.test.ts 896);
  - HELP.md:137, :244 and DESIGN.md:134, :136 match the code as read.

### Behaviour

- `src/lib/state/life/present.ts:104` (`plainTitle` through `decodeHTML`):
  - Named escapes without a semicolon are now decoded where the old table left them as written. `node -e` of the old function beside the new one: `'Q&amp A'` gives `"Q&amp A"` before and `"Q& A"` after; `'a &lt b'` gives `"a &lt b"` before and `"a < b"` after; `'R&D &copy 2026'` keeps `&copy` before and gives the copyright sign after.
  - A numeric escape past the Unicode range (`&#99999999;`) used to throw a RangeError from `String.fromCodePoint` out of `plainTitle`. Now it becomes U+FFFD.
  - Round item 6 said "the output is unchanged". The report corrects that for `&mdash;` and for letter case (line 429), but gives neither of these two changes with its before and after.
- The rest of the round's user-visible changes are stated in the report's before and after section (lines 391-396): the tooltip, the provider control, the period title, the height, the wallpaper, the 30 s timeout.

### Not checked

- Anything that needs a browser, counted neither as a pass nor as a finding:
  - the calendar over a wallpaper;
  - whether the height chain (`.pane` 100%, `.body` flex 1, `.calendar` 100%, `.grid` flex 1, library `height: '100%'`) actually gives the time grid a definite height and one scroll bar;
  - the tooltip on hover;
  - the redrawn grid lines and ticks;
  - the header's surface over scrolled rows;
  - the popup.
- The mutation quotes of item 8. Reproducing them needs file edits, which my brief forbids.
- The `AbortSignal.any` branch of `timedFetcher` (`oauth.ts:262-265`), where the caller passes its own signal. No caller in `src/lib/server/accounts` passes one (grep for `signal` outside oauth.ts finds none), and no case exercises it.
- Whether a legitimate read that takes longer than 30 s (a large published calendar on a slow link, a slow Graph page) occurs in practice. The limit covers the body too (`oauth.ts:273-294`).

Reviewer usage: 27 tool calls, about 25 minutes (two full verify runs of about 2 minutes each included).

## Closed

- First review: every finding was sent in repair round 1 and closed there, as the round's refutation reads.
- Round 1, Spec, `min-height: 480px`: kept at landing; the booking names the second scroll bar in a pane shorter than 480 px.
- Round 1, Proof, `eventDidMount` and the options passed through: not covered by a unit test; both seen in the look (25 events with their tooltip, the week, month and list views drawn by the options); named in the booking.
- Round 1, Proof, the view test's title: renamed at landing to "...takes the pane's height and paints its cells with no surface of their own".
- Round 1, Proof, the report's first line: the verify list is green on main after the landing fixes.
- Round 1, Standards, the two colour-rule breaks: fixed at landing, the strips transparent with the wallpaper blur and the popup on `--panel`, since `tinted.test.ts` refuses the `background:` wall mix in a view that asks for the tint. What that leaves under a wallpaper is raised as open item Z42.

- Round 1, Behaviour, `plainTitle` through `decodeHTML`: stated in the booking with its before and after (`Q&amp A` now `Q& A`; `&#99999999;` now U+FFFD where it threw).
- Round 1, Not checked, the browser points: taken in the landing look (the wallpaper, the height and one scroll bar in the grid, the tooltip, the grid lines, the header over scrolled rows, which is Z42).
