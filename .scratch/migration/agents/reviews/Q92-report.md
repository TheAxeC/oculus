# Q92 report: the Inbox card, the Calendar on @event-calendar/core, the published calendar link

Everything in the brief and in repair round 1 (`agents/briefs/Q92-round1-sent.md`) is done. Round 1 ran the changed test files and `npm run check`, `npm run format:check` and `npm run lint`, as the round message says; the full verify list was not run in round 1, and the quoted verify run below is the one at the round's start commit.

## Open items of the state file (verbatim, read from the main checkout's tools/oculus/.scratch/migration/orchestrator-state.md)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

None.

## Repair round 1

| Item | State | Where | Proof |
| --- | --- | --- | --- |
| 1 `timedFetcher` beside `Fetcher`, `READ_TIMEOUT_MS` 30000, `AbortSignal.timeout` joined with the caller's signal by `AbortSignal.any` | DONE | connect/oauth.ts:30, :33, :50 | the timeout cases below |
| 1 the limit covers the body too; the two JSON reads rethrow it | DONE | oauth.ts:50 (body stream), :272 (token post); connect/api.ts:40 (`parsed`) | calendar poll case "answer arrives with no body" |
| 1 calendar poller wraps its fetcher, `readTimeoutMs` option, the sentence in `pollAccount` and `pollLink` | DONE | calendar/poll.ts:125, :129, :221, :276 | tests/server/accounts/calendar/poll.test.ts |
| 1 mail poller the same, `words: MailWords` added to `MailOptions` | DONE | mail/poll.ts:119, :242 | tests/server/accounts/mail/poll.test.ts |
| 1 catalog sentence `accounts.timed_out: 'The provider did not answer within {0} s.'`, handed to both pollers | DONE | config/text/views/personal/account-setup.yml; server/root/context.ts:317, :330 | the timeout cases compare against the catalog's sentence |
| 2 `--ec-bg-color: transparent` (every day cell, the grid, the side, the column heads and the empty list paint with it); today keeps `--chip`; events keep their account colour | DONE | Calendar.svelte:309 | view audit case |
| 3 fixed 600px gone; `.calendar` a full-height column, `.grid { flex: 1; min-height: 0 }`; library `height: '100%'` | DONE | Calendar.svelte:258-270; state/life/calendar.ts `calendarOptions` | view audit case; options case |
| 4 `eventTooltip` (time range or all day, calendar, location, tentative, joined by ` \| `), carried in `extendedProps.tooltip`, set as `title` in `eventDidMount`; `calendar.tentative` restored, `calendar.time_range: '{0} to {1}'` added | DONE | state/life/calendar.ts:155, :168; Calendar.svelte:180 | tests/state/life/calendar.test.ts, five tooltip cases |
| 5 `calendarOptions(payload, view, words, hues)`; `calendarRange` answers null for an `updated` that does not parse; the view spreads the result and adds only `datesSet`, `eventClick`, `eventDidMount` | DONE | state/life/calendar.ts:200, :216; Calendar.svelte:167 | four options cases, one range case |
| 5 footer case reads the window from the shipped behavior.yml through `loadConfig` and `calendarSettings` | DONE | tests/views/personal/calendar.test.ts | its failure with 1 and 14 below |
| 6 `plainTitle` through `decodeHTML`, `ENTITIES` table removed | DONE | state/life/present.ts:15, :104 | tests/state/life/present.test.ts; `grep -rn ENTITIES src tests` prints nothing (exit 1) |
| docs | DONE | HELP.md:137 (Calendar row: tooltip, fill, 30 s), :244 (Inbox: 30 s); DESIGN.md:134 (timeout, `calendarOptions`, surfaces, tooltip), :136 (mail timeout) | `npx prettier --check HELP.md DESIGN.md` passes; `LC_ALL=C grep -c '[^ -~]'` gives 0 for both |
| diagrams | DONE | layer-server, layer-state, layers (.dot, .svg) | `npm run diagrams`; import counts only |

Runs of round 1, from the worktree's tools/oculus:

```
npx vitest run tests/server/accounts/calendar/poll.test.ts tests/server/accounts/mail/poll.test.ts tests/state/life/calendar.test.ts tests/state/life/present.test.ts tests/views/personal/calendar.test.ts
 Test Files  5 passed (5)
      Tests  115 passed (115)
npx vitest run tests/server/accounts        (oauth.ts and api.ts changed; their own tests)
 Test Files  13 passed (13)
      Tests  145 passed (145)
npm run check
COMPLETED 1463 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run format:check
All matched files use Prettier code style!
npm run lint
exit 0
```

### Each new case, failing with the change it guards undone (each file put back after; `find . -name "*.mutbak" -not -path "./node_modules/*"` prints nothing)

Timeout, calendar. `calendar/poll.ts:125` back to `(options.fetcher ?? fetch)`:

```
FAIL gives an account whose provider never answers the timeout sentence and reads the next 5008ms
FAIL gives a link that never answers the timeout sentence, never the link 5003ms
Error: Test timed out in 5000ms.
```

The sentence undone (`timedOut` answering the thrown message):

```
FAIL gives an account whose provider never answers the timeout sentence and reads the next
FAIL gives the timeout sentence to an account whose answer arrives with no body
FAIL gives a link that never answers the timeout sentence, never the link
Expected: "The provider did not answer within 0.05 s."
Received: "no answer within 50 ms"
```

The body limit undone (`timedFetcher` returning the provider's response as it came), and separately the rethrow in `api.ts` `parsed` undone:

```
FAIL gives the timeout sentence to an account whose answer arrives with no body
Expected: "The provider did not answer within 0.05 s."
Received: "google: 200 unreadable answer"
```

Timeout, mail. `mail/poll.ts:119` back to `(options.fetcher ?? fetch)`; the Gmail account after the hanging Outlook one is never read and the case's two-second wait fails:

```
FAIL gives an account whose provider never answers the timeout sentence and reads the next 2204ms
AssertionError: expected false to be true
```

The mail sentence undone (`reason(error)`):

```
Expected: "The provider did not answer within 0.05 s."
Received: "no answer within 50 ms"
```

Tooltip, one part undone at a time:

```
FAIL says a timed event its time range, its calendar and its location
Expected: "09:00 to 09:15 | Work | Room 1"
Received: "09:00 to 09:15 | Work"
FAIL marks a tentative event tentative, last
Expected: "14:00 to 15:00 | Work | tentative"
Received: "14:00 to 15:00 | Work"
FAIL says an all-day event with no location all day and its calendar      (all-day branch removed)
Expected: "all day | Holidays"
Received: "2031-03-02 01:00 to 2031-03-03 01:00 | Holidays"
FAIL puts the date in front of both ends of an event that ends on another day
Expected: "2031-03-02 23:00 to 2031-03-03 01:00 | Work"
Received: "23:00 to 01:00 | Work"
FAIL is what calendarEvents carries in the extended properties the library mounts   (tooltip: '')
```

Range and options:

```
NaN check removed from calendarRange:
FAIL are unbounded for a payload that names no moment it was read at
AssertionError: expected { start: 'NaN-NaN-NaN', ...(1) } to be null
FAIL carry no dates to page between for a payload that names no moment it was read at
AssertionError: expected true to be false
validRange left out of calendarOptions:
FAIL bound the dates to the window read from updated, daysBack and daysAhead
AssertionError: expected undefined to deeply equal { start: '2031-01-30', ...(1) }
the end computed from 14 in place of daysAhead:
-   "end": "2031-05-03",
+   "end": "2031-03-16",
the view fixed to timeGridWeek:
FAIL carry the view the instance keeps
Expected: "timeGridDay"
Received: "timeGridWeek"
height '600px':
FAIL carry the payload's events, the catalog's words and the pane's height
Expected: "100%"
Received: "600px"
```

Footer from the shipped config, `config/behavior.yml` set back to `days_back: 1`, `days_ahead: 14`:

```
FAIL says the calendar window the shipped behaviour file sets, 31 days back and 62 ahead
AssertionError: expected [ 1, 14 ] to deeply equal [ 31, 62 ]
```

View audit ("audits that the library's box takes the pane's height and paints no surface of its own"), one rule undone at a time:

```
--ec-bg-color: var(--panel):   expected '\n    .grid :global(.ec) {...' to match /--ec-bg-color: transparent;/
height: 600px on .ec:          expected '\n    .grid :global(.ec) {...' not to match /\n\s*height:/
.grid rule removed:            expected -1 to be greater than -1
.calendar height removed:      expected '\n    .calendar {...' to match /\n\s*height: 100%;/
```

The audit reads the style block because the page is drawn in the browser only (`src/routes/+layout.ts:2`, `export const ssr = false`) and the library's server render prints its `height` option into `style` as the text of a function; the height the library is handed is guarded by the options case above.

`plainTitle`, `decodeHTML` removed from the call:

```
FAIL strips the markup and the escapes a deck title is written with
Expected: "Questions & collaborations welcome"
Received: "Questions &amp; collaborations welcome"
FAIL decodes a named, a no-break and a numeric escape, the no-break space folded to a plain one
Expected: "Tom & Jerry's deck"
Received: "Tom&nbsp;&amp;&nbsp;Jerry&#39;s deck"
```

The removed table gave the same output on that case (a `node -e` run of the old function and the new one: `["Tom & Jerry's deck","Tom & Jerry's deck"]`), so the case holds the output unchanged across the swap.

## The server-render check of @event-calendar/core

Before any code change, `@event-calendar/core` 5.15.0 was installed and its `Calendar` rendered with `svelte/server` `render()` in a throwaway test, as the view tests render a view. It renders: the markup holds `<div class="ec ec-time-grid ec-week-view" role="table">` and the toolbar. The throwaway test is deleted. Effects do not run in a server render, so events, `datesSet` and the greying of dates outside `validRange` are not in that markup; the window is tested through `calendarRange`, which is what the view hands the library.

## The cases' first run (unchanged tree, tests written first)

Command: `npx vitest run` over the twelve case files. Result: `Test Files  10 failed | 2 passed (12)`, `Tests  38 failed | 158 passed (196)`. Each new case and its first failure:

- tests/server/accounts/calendar/ics.test.ts (whole file): `Error: Cannot find module '../../../../src/lib/server/accounts/calendar/ics.ts'`
- calendar-config, reads a published calendar link as a row of the provider ics: `calendars[0].provider must be google or microsoft`
- calendar-config, throws "calendars[0].provider must be google, microsoft or ics": `expected [Function] to throw error including 'local.yml: calendars[0].provider must...' but got '...'`
- state inbox, the three senderParts cases: `TypeError: senderParts is not a function`
- accounts-store, posts the link with the label to the calendar endpoint: `expected 'Pick Google or Microsoft.' to be ''`
- accounts-store, refuses a missing link and one of another scheme: `Error: text key not in the text catalog (config/text/): accounts.refused_link`
- accounts-store, says the server's link refusal in the same words: same error as above
- state calendar, the two parseCalendarState cases: `TypeError: parseCalendarState is not a function`
- state calendar, the five calendarEvents cases: `TypeError: calendarEvents is not a function`
- state calendar, the validRange case (2031-03-02T12:00Z, 31 back, 62 ahead, 2031-01-30 to 2031-05-03): `TypeError: calendarRange is not a function`
- view inbox, draws one card with its note, its snippet, its age and its two controls: `expected '<div data-inbox="google-work-reply">...' to contain '**Ada**'`
- view inbox, titles a card with the sender's display name: `expected '<div data-inbox="google-work-sparcly"...' not to contain 'mailto:'`
- view inbox, titles a card whose From line has no display name: `expected '<h3 class="title ...' not to contain 'mailto:'`
- view inbox, draws the subject as the characters it holds: `expected '<div data-inbox="google-work-marked">...' to match /<p class="subject[^"]*">\*Review\* .../`
- view inbox, draws the kind tag on a triaged card alone: `expected true to be false`
- view inbox, draws the account tag only while more than one mail account is configured: `expected true to be false`
- view inbox, puts Draft reply and the provider control on the control row: `expected 'class="meta ...' to match /<button[^>]*class="tool[^"]*compact.../`
- view inbox, audits that the cards are one column: `expected '\n display: grid;\n gri...' not to contain 'auto-fill'`
- view calendar, week view for an empty state: `to match /class="ec ec-time-grid ec-week-view"/`
- view calendar, month view for `{ view: 'dayGridMonth' }`: `to match /class="ec ec-day-grid ec-month-view"/`
- view calendar, week view for the retired `agenda`: `to match /class="ec ec-time-grid ec-week-view"/`
- view calendar, audits that the agenda partial is gone: `expected true to be false`
- view calendar, carries the retry cadence and the failure tone (now expects the calendar drawn): `to contain 'class="ec '`
- view calendar, the Add form offers a third provider with a link field: `expected [ 'Google', 'Microsoft' ] to deeply equal [ 'Google', 'Microsoft', undefined ]`
- view calendar, names an ics account "Published link" and draws no Connect: `to contain '>undefined</span>'`
- poll, publishes the events inside the window, in their own zone, the series expanded: `expected [] to include 'https://secret.example/cal.ics'`
- poll, says a failed read in a fixed sentence naming the label, and never the link: `expected 'not-connected' to be 'error'`
- poll, is not connected, with the fixed sentence, while its file holds no link: `expected { provider: 'ics', ...(4) } to deeply equal { provider: 'ics', ...(4) }`
- plate, the Gmail snippet `the paper &quot;Manifest-Assisted Retrieval&quot; &amp; more&nbsp;now`: `expected [ Array(1) ] to deeply equal [ Array(1) ]`
- plate, the Microsoft preview with entities: same
- accounts (connect), writes its row with no link, keeps the link at 0600, starts no consent: `expected 400 to be 200`
- accounts (connect), refuses a missing link and ftp://x with link: `expected { error: 'provider' } to deeply equal { error: 'link' }`

Cases that passed on the unchanged tree, as the brief's wording asks of them (each guards behaviour that must survive the change): help, the alternative text with `&amp;` and `&#39;` ("as today"); mail-config, a `mail:` ics row throws naming google or microsoft; the view footer reading "Read-only over 31 days back and 62 days ahead." (the fixture payload carries 31 and 62); the mail Add form offers two providers; accounts (connect), an ics Add on the mail endpoint answers `provider`, and the Remove deletes the row and `ics-work.json`.

Written after the first run and never run against the unchanged tree: tests/data/accounts/connect.test.ts "takes a published link on a calendar and refuses it on the mail" (the unchanged `accountRefusal` takes no kind, so it would not compile there), and in the week-view case the assertions on the Previous week, Next week and Today buttons and on the absence of the library's own toolbar buttons, which follow from the toolbar decision below.

No case of the brief was found wrong by its own rules.

## What to build

| Item | State | Where | Proof |
| --- | --- | --- | --- |
| 1 Inbox card: sender title, address, tooltip, `senderParts` | DONE | state/feeds/inbox.ts:124; InboxCard.svelte:147 | tests/state/feeds/inbox.test.ts, tests/views/feeds/inbox.test.ts |
| 1 subject plain, weight 600 | DONE | InboxCard.svelte:214 | tests/views/feeds/inbox.test.ts |
| 1 snippet decoded on the server, clamped to two lines | DONE | mail/google.ts:105, mail/microsoft.ts:219, InboxCard.svelte:298 | tests/server/accounts/mail/plate.test.ts |
| 1 kind tag on a triaged card, account tag with two accounts | DONE | InboxCard.svelte:156, :159; Inbox.svelte:126 | tests/views/feeds/inbox.test.ts |
| 1 Draft reply and provider as compact controls on the row | DONE | InboxCard.svelte:170, :179 | tests/views/feeds/inbox.test.ts |
| 1 one column | DONE | Inbox.svelte:242 | tests/views/feeds/inbox.test.ts |
| 2 manual.ts through `decodeHTML` | DONE | views/system/help/manual.ts:28 | tests/views/system/help.test.ts |
| 3 package.json | DONE | `@event-calendar/core ^5.15.0`, `svelte ^5.57.0`, `ical.js ^2.2.1`, `entities ^8.1.0`; lock updated by npm install | `npm run build` in verify |
| 3 Calendar on the library, four views, week default, view in instance state | DONE | Calendar.svelte:152, :236; state/life/calendar.ts:72 | tests/views/personal/calendar.test.ts, tests/state/life/calendar.test.ts |
| 3 `calendarEvents`, hues by account place, `HUES` shared | DONE | state/life/calendar.ts:97; ui/display/hues.ts:10; Lanes.svelte:8 | tests/state/life/calendar.test.ts |
| 3 event click opens a linked event | DONE | Calendar.svelte:172 | code read only; the click runs in the browser (see problems) |
| 3 paging stops at the window | DONE | state/life/calendar.ts:132; Calendar.svelte:156 | tests/state/life/calendar.test.ts |
| 3 `--ec-*` themed from tokens | DONE | Calendar.svelte:280-305 | tests/ui/colours.test.ts in the suite; the look is not verified here |
| 3 Agenda.svelte, `dayGroups`, `days()` deleted | DONE | files gone; `remainingToday` kept for the badge | tests/views/personal/calendar.test.ts audit case |
| 3 behavior.yml 31 and 62, "the calendar window" | DONE | config/behavior.yml:92-96 | tests/data/sources/calendar-config.test.ts |
| 4 `CalendarProvider`, calendar guard, `accountRefusal(kind, ...)` | DONE | model-calendar.ts:23; data/accounts/connect.ts:39, :50, :82 | tests/data/accounts/connect.test.ts |
| 4 local.ts accepts ics under `calendars:` only | DONE | data/sources/config/local.ts:271-272 | calendar-config and mail-config tests |
| 4 Add and Remove of an ics row | DONE | connect/actions.ts:191, :205, :225; connect/store.ts:243, :253 | tests/server/accounts/connect/accounts.test.ts |
| 4 Poll of an ics account | DONE | calendar/ics.ts:43, :125, :188; calendar/poll.ts:188, :241 | tests/server/accounts/calendar/poll.test.ts, ics.test.ts |
| 4 the page: Add form, account row, store | DONE | AddAccount.svelte:55, :75, :86; AccountList.svelte:54, :117; accounts.svelte.ts:86, :172 | tests/views/personal/calendar.test.ts, tests/state/life/accounts-store.test.ts |
| 5 docs and comments made false corrected | DONE | HELP.md:119, :137, :244, :246; DESIGN.md:134, :298; comments listed below | the greps below |

Verify at the round's start commit (not re-run in round 1), `sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` from the worktree's tools/oculus, exit 0. The lines it printed (the size table of the build left out):

```
> oculus@0.0.1 test
> vitest run
 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q92/tools/oculus
 Test Files  340 passed (340)
      Tests  5366 passed (5366)
> oculus@0.0.1 check
> svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
1790612559941 COMPLETED 1463 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
> oculus@0.0.1 build
> vite build
[check mark] built in 1.45s
(!) Some chunks are larger than 500 kB after minification.
[check mark] built in 6.75s
> Using @sveltejs/adapter-node
  [check mark] done
> oculus@0.0.1 format:check
> prettier --check .
All matched files use Prettier code style!
> oculus@0.0.1 lint
> eslint .
verify: 6 commands passed
```

The build prints a check mark before "built in" and "done"; it is written "[check mark]" above so the report stays ASCII.

The test run also prints `Rebasing (1/1)error: could not apply ae8e69e... Main` and git hints; they come from the deposit tests' own temporary repositories under /var/folders, not from this worktree. verify.sh was run twice: the first run failed five checks on files of this step (comment width, the colour rule's text tokens, dates in a fixture comment, an audit name, reasons above absence assertions); those were fixed and the second run is the one quoted.

The ASCII gate from the spec (`LC_ALL=C perl -ne '...' $(find src tests bin config -type f ! -name local.yml)`) prints nothing. `sh bin/folder-check.sh` exits 0.

`grep -rn "console" src/lib/server/accounts/calendar/ics.ts` prints nothing (exit 1). The one console line of the calendar poller is `poll.ts:162 console.log(\`calendar publish: ${status}\`)`, which prints the payload status word alone.

## Files, line counts before (main checkout) and after

| File | Before | After |
| --- | --- | --- |
| src/lib/data/accounts/calendar.ts | 17 | 40 |
| src/lib/data/accounts/connect.ts | 105 | 139 |
| src/lib/data/model/index.ts | 449 | 451 |
| src/lib/data/model/model-calendar.ts | 93 | 93 |
| src/lib/data/model/model-connect.ts | 34 | 48 |
| src/lib/data/sources/config/local.ts | 343 | 357 |
| src/lib/data/sources/config/settings.ts | 166 | 166 |
| src/lib/server/accounts/calendar/api.ts | 28 | 28 |
| src/lib/server/accounts/calendar/ics.ts | new | 197 |
| src/lib/server/accounts/calendar/poll.ts | 223 | 300 |
| src/lib/server/accounts/calendar/routes.ts | 72 | 73 |
| src/lib/server/accounts/connect/actions.ts | 306 | 318 |
| src/lib/server/accounts/connect/api.ts | 110 | 114 |
| src/lib/server/accounts/connect/loop.ts | 204 | 207 |
| src/lib/server/accounts/connect/oauth.ts | 280 | 340 |
| src/lib/server/accounts/connect/rows.ts | 215 | 215 |
| src/lib/server/accounts/connect/store.ts | 244 | 267 |
| src/lib/server/accounts/mail/google.ts | 191 | 193 |
| src/lib/server/accounts/mail/microsoft.ts | 277 | 279 |
| src/lib/server/accounts/mail/poll.ts | 286 | 298 |
| src/lib/server/root/context.ts | 429 | 436 |
| src/lib/state/client/entities.svelte.ts | 103 | 103 |
| src/lib/state/feeds/inbox.ts | 146 | 167 |
| src/lib/state/life/accounts.svelte.ts | 229 | 266 |
| src/lib/state/life/accounts.ts | 44 | 46 |
| src/lib/state/life/calendar.svelte.ts | 71 | 69 |
| src/lib/state/life/calendar.ts | 69 | 251 |
| src/lib/state/life/present.ts | 407 | 393 |
| src/lib/ui/display/hues.ts | new | 10 |
| src/lib/ui/frame/Card.svelte | 225 | 233 |
| src/lib/views/feeds/inbox/Inbox.svelte | 247 | 251 |
| src/lib/views/feeds/inbox/InboxCard.svelte | 287 | 321 |
| src/lib/views/personal/calendar/Agenda.svelte | 123 | deleted |
| src/lib/views/personal/calendar/Calendar.svelte | 133 | 410 |
| src/lib/views/shared/accounts/AccountList.svelte | 200 | 206 |
| src/lib/views/shared/accounts/AddAccount.svelte | 99 | 139 |
| src/lib/views/shared/accounts/RemoveAccount.svelte | 33 | 41 |
| src/lib/views/sources/repositories/graph/Lanes.svelte | 71 | 69 |
| src/lib/views/system/help/manual.ts | 62 | 57 |
| src/routes/api/(accounts)/calendar/+server.ts | 31 | 32 |
| tests/data/accounts/connect.test.ts | 52 | 57 |
| tests/data/sources/calendar-config.test.ts | 132 | 138 |
| tests/data/sources/mail-config.test.ts | 135 | 139 |
| tests/server/accounts/calendar/ics-fixture.ts | new | 71 |
| tests/server/accounts/calendar/ics.test.ts | new | 58 |
| tests/server/accounts/calendar/poll.test.ts | 635 | 896 |
| tests/server/accounts/connect/accounts.test.ts | 460 | 549 |
| tests/server/accounts/connect/loop.test.ts | 152 | 152 |
| tests/server/accounts/mail/plate.test.ts | 397 | 445 |
| tests/server/accounts/mail/poll.test.ts | 473 | 522 |
| tests/server/root/context.test.ts | 430 | 430 |
| tests/state/feeds/inbox.test.ts | 121 | 142 |
| tests/state/life/accounts-store.test.ts | 327 | 375 |
| tests/state/life/calendar-store.test.ts | 160 | 158 |
| tests/state/life/calendar.test.ts | 114 | 295 |
| tests/state/life/present.test.ts | 533 | 539 |
| tests/views/feeds/inbox.test.ts | 340 | 449 |
| tests/views/personal/calendar.test.ts | 316 | 411 |
| tests/views/system/help.test.ts | 335 | 342 |
| tests/views/whole/type-scale.test.ts | 345 | 344 |
| config/behavior.yml | 163 | 163 |
| config/text/views/personal/account-setup.yml | 87 | 94 |
| config/text/views/personal/calendar.yml | 30 | 46 |
| HELP.md | 294 | 294 |
| DESIGN.md | 320 | 320 |
| package.json | 51 | 54 |
| docs/diagrams layer-server, layer-state, layer-views, layers (.dot and .svg) | | import counts only, from `npm run diagrams`, run again after round 1 |

"Before" is the main checkout's copy read at report time (`diff -rq` of the two trees shows only this step's files differ). config/text/views/feeds/inbox.yml is unchanged: the card needed no new key.

### Paths outside the brief's list, and why

- src/lib/data/model/index.ts: exports `AccountProvider` and `AccountRow`, the row type both connectors now share.
- src/lib/server/accounts/connect/rows.ts, loop.ts, mail/poll.ts: the row and loop types take `AccountRow` (loop generic over the row type) so an ics row passes through the shared loop and row edit without a cast.
- src/lib/server/root/context.ts: hands the calendar poller its three catalog sentences (`calendar.ics_no_link`, `calendar.ics_failed`, `accounts.timed_out`) and the mail poller `accounts.timed_out`, read as `textCatalog(config)['...']` like `notify.stop`.
- src/lib/server/accounts/connect/api.ts (round 1): `parsed` rethrows a `ReadTimeout`, so a body the limit cut off is said as a timeout rather than as an unreadable answer.
- src/lib/state/life/present.ts and its test (round 1, item 6).
- src/lib/ui/frame/Card.svelte: an optional `heading` snippet, so the Inbox card can draw its name, address and tooltip inside the heading; the primitive stays domain-free.
- src/lib/views/shared/accounts/RemoveAccount.svelte: an ics Remove says the file keeping its link goes (new key `accounts.remove_confirm_link`), where the old question spoke of a token file.
- Comments made false by the step: data/sources/config/settings.ts:48, :50; server/accounts/calendar/api.ts:13, :24; state/client/entities.svelte.ts:90; server/accounts/calendar/routes.ts head; routes/api/(accounts)/calendar/+server.ts head (both said the page never sends an address).
- tests/data/accounts/connect.test.ts, tests/server/accounts/connect/loop.test.ts, tests/server/root/context.test.ts: the signature and type changes above.
- tests/server/accounts/calendar/ics-fixture.ts: the one ICS text the poll cases and the reader cases share; the brief named one new test file there, and this is its fixture.
- `HUES` sits in src/lib/ui/display/hues.ts rather than src/lib/ui/ itself, since src/lib/ui already holds 10 items and the folder rule caps it there.

### Renames grepped (src, tests, config, HELP.md, DESIGN.md, README.md)

- `grep -rn -i agenda`: only tests/state/life/calendar.test.ts:101 and tests/views/personal/calendar.test.ts:221-226, the cases about the retired view name and the deleted file.
- `grep -rn -i 'google or microsoft'`: local.ts:278 (the `mail:` error, correct) and tests/data/sources/mail-config.test.ts:91, :95.
- `grep -rn 'Google and Microsoft calendars'`: DESIGN.md:134, :298 and HELP.md:137, each now followed by the published link.
- `grep -rn days_back`: poll.ts:84, api.ts:13, settings.ts:70, config/behavior.yml:95, DESIGN.md:134, :298, and test fixtures that set their own window.
- `grep -n inlineMarkdown InboxCard.svelte`: :28 and :218, the triage note's `what` line, which is Markdown written by the triage skill; sender and subject no longer go through it.
- `grep -rn ENTITIES src tests`: prints nothing (exit 1).

### Judgment calls

- The toolbar is oculus's own: Previous, Today, Next as `ToolButton`s, the period title, and the four views as a `Segment`, driving the library through its `prev`, `next`, `gotoDate` calls and its `view` option; the library's `headerToolbar` is empty and its strip hidden. Reason: the spec's rule that every control a reader presses is a ui primitive, never a raw `<button>`, and the library's toolbar draws raw buttons. Previous and Next are disabled, with a tooltip naming the window's first or last day, once the period beyond lies wholly outside `validRange` (the library reads the range's last day as inside it); Today is disabled with "Today is in view." while today is shown.
- The library's component type declares no instance calls, so the bound handle is held as `unknown` and read through one typed accessor, `calls()` (Calendar.svelte:81).
- The library is handed `height: '100%'` and fills `.grid`, which takes what the rows above it and the footer leave of the pane. `.calendar` has `min-height: 480px`, so a pane too short to leave the grid a usable height scrolls the pane rather than squeezing the calendar to nothing; above that height there is one scroll bar, the time grid's. Also chosen: `firstDay: 1` (Monday), `scrollTime: '07:00:00'`, `nowIndicator`, 24-hour `eventTimeFormat` and `slotLabelFormat` (oculus's clock is 24-hour, `format.ts` `clock`), and `allDayContent` and `noEventsContent` from the catalog.
- Theming: `--ec-bg-color` is `transparent`, so the pane's surface shows through every cell, the grid, the side column and the column heads: `--panel` under a plain theme, the tinted pane over the wallpaper under `body.wall`. The strips that stay in place while the grid scrolls, the header row and a list view's date headings, are painted with `--panel` (the pane's colour, so they do not show as a strip) and under `body.wall` with the pane's own `color-mix(--panel, --wall-panel)` and blur, so rows scrolled beneath them do not show through; a list date heading keeps today's chip over that surface. The more-events popup stays `--panel`, and under `body.wall` is drawn as the Tooltip bubble is (`--wall-popover` and blur). The library hides parts of its time-grid lines under stripes of the background colour (half-hour lines dotted, the side's lines cut to a tick, the last line under the cell border); a transparent background hides nothing, so `.ec-time-grid .ec-body .ec-day` and `.ec-sidebar` redraw those lines in only the parts that show (a solid hour line, a one-pixel dot every two pixels on the half hour via a `conic-gradient` tile, the side's ticks 0.375rem wide at its edge) and the day cell's bottom border is transparent so the last hour line stands for it. Otherwise: text `--ink-txt` (the colour rule wants a text token); borders `--line`; secondary text (hours, day headings) `--muted-txt`; today `--chip`; highlight, default event and the active button `--accent-bg` and `--on-accent-bg`; the now line `--accent`; the grey scale `--ec-color-50..400` mapped to `--panel`, `--card`, `--chip`, `--line`, `--muted-txt`; `color-scheme: inherit` in place of the library's `light`. Each account's events are `var(--c-<hue>)` with `var(--on-c-<hue>)`.
- `calendarEvents(events, accounts, hues, words)` takes the hues as a third argument (state may not import ui, and `HUES` lives under ui as the brief asks) and the words for the tooltip as a fourth. For the same reason `calendarOptions` takes the hues as a fourth argument after the payload, the view and the words the round names. The view passes `HUES`. An event's account is found by the longest account key its id starts with.
- A timed event is handed to the library as a `Date`, since the library reads a `Z` or missing offset as a wall clock; an all-day event keeps its date string.
- The ICS reader resolves a TZID through the file's own VTIMEZONE via the parsed tree (`Component.getTimeZoneByID`), and registers nothing in ical.js's process-wide `TimezoneService`. The brief says "registered"; the effect it asks for (a Windows zone name read by the file's own rules) holds and is tested, and two accounts cannot overwrite each other's zone of the same name. A floating time is published without an offset and read in the page's zone. A series is stepped at most 40000 occurrences to reach the window.
- An event's tooltip gives a time as the page's own 24-hour hour and minute, with the date (`YYYY-MM-DD`) in front of both ends when the event ends on another day.
- The link field is a `TextInput` with `secret`, drawn as dots and kept from autofill, since the link is the key to the calendar. The Add button reads "Add" for a published link and "Add and connect" otherwise.
- `add(kind, provider, label, url = '')`; the url is sent only for `ics`; an ics Add waits on no provider setup.
- `accounts.refused_provider` now reads "Pick one of the providers offered." since the calendar offers three.
- Removed catalog keys with no reader left: `calendar.agenda_empty`, `calendar.cancelled`, `calendar.open_event`. `calendar.tentative` ("tentative") is kept for the tooltip. Round 1 added `calendar.time_range` (`'{0} to {1}'`) and `accounts.timed_out` (`'The provider did not answer within {0} s.'`), the seconds filled from the limit in force. `calendar.today` now reads "Today" (a button label). New keys: calendar `ics_failed`, `ics_no_link`, `next_day|week|month`, `prev_day|week|month`, `no_events`, `no_earlier`, `no_later`, `provider_ics`, `today_shown`, `view`, `view_day|week|month|list`; accounts `add_go_link`, `add_link`, `add_link_hint`, `provider_ics`, `refused_link`, `remove_confirm_link`.
- The provider control on the Inbox card is a compact `ToolButton` (glyph `launch`) that calls `window.open(thread.url, '_blank', 'noopener,noreferrer')`, the brief's second option; Draft reply is a compact `ToolButton` (glyph `draft`) that keeps `active` and `expanded`.
- Caret ranges for `ical.js ^2.2.1` and `entities ^8.1.0`, as for the other dependencies.

## User-visible changes, before and after

- Inbox card. Before: the title was the whole From line through inline Markdown, so an address became a `mailto:` link; the subject muted under it through Markdown; the snippet raw (`&quot;` showed); kind and account tags on every card; a full-width "Draft reply" button and a full-width "open at the provider" link under the text. After: the title is the display name as text, the address smaller and muted after it, the whole From line in a tooltip over the name (the address alone when there is no name); the subject in the text colour at weight 600 as plain characters; the snippet decoded and cut after two lines with an ellipsis; the kind tag only in the Triaged section; the account tag only with more than one mail account; Draft reply and the provider as icon controls on the row beside Archive and Triaged; the draft editor opens under the text.
- Inbox layout. Before: a grid of as many 340px columns as fit. After: one column, top to bottom.
- Calendar. Before: an agenda list grouped by day over 1 day back and 14 ahead. After: the library's calendar over 31 days back and 62 ahead with Day (time grid of one day), Week (time grid, the default), Month (day grid) and List (the week's events as a list); the toolbar above it holds Previous and Next (named for the view's period), Today, the period's title and the four views; the view is kept per instance; each account's events in its own hue; a click on an event with a link opens it at its provider.
- Add form. Before: Google and Microsoft. After, in the Calendar only: Google, Microsoft and Published link; choosing Published link shows a Link field under the label with the hint "The address the calendar is published at, starting https:// or webcal://. It is kept in this machine's calendar folder and never shown again." The Inbox's Add form still offers two.
- Calendar event details. Before (the agenda): each event's row showed its calendar name, its location, and a tentative mark. After: the grid and list show the title and time; the calendar name, the location when there is one, and the word "tentative" for a tentative event are in the event's tooltip, after its time range or "all day", joined by " | ", for example `09:00 to 09:15 | Work | Room 1`.
- Inbox provider control. Before: a link to the thread at the provider, which a middle-click opened in a new tab and whose address the browser's context menu could copy. After: a compact icon button that opens the thread in a new tab (`window.open(thread.url, '_blank', 'noopener,noreferrer')`); it has no address, so there is no middle-click and no "Copy link" on it.
- Calendar period title. Before: the agenda had no period title. After: the title above the grid is the library's `Intl` range text for the period shown; for a week the browser's formatter joins the first and last date with an en dash set between thin spaces (not verified in a browser in this round). oculus's source holds none of those characters.
- Calendar height. Before: the calendar was a fixed 600px, with the pane scrolling around it. After: it fills the pane below the head, the account rows and the toolbar, down to the footer, and the time grid scrolls inside itself with one scroll bar; in a pane shorter than 480px for the whole view the pane scrolls instead.
- Calendar over a wallpaper. Before: every cell painted `--panel`, an opaque block over the picture. After: the cells and the grid are transparent, so the tinted pane and the wallpaper show through; today's column keeps its chip, each event its account's colour, and the header row the pane's tint and blur.
- An account whose provider or published link does not answer. Before: its read waited without end and held the round, so the accounts after it were not read. After: after 30 s its row is in error with "The provider did not answer within 30 s.", its last good events kept, and the round reads the next account; the same for a mail account.
- An ics account's row. Its provider reads "Published link"; it has no Connect control; its state word is connected after a good read, not connected with "No link is kept for this published calendar. Remove it and add it again with its link." when its file has no link, and error with "The published calendar <label> could not be read. Check that its link still opens in a browser." when a read fails. Its Remove asks "Remove the published calendar <label>? The file that keeps its link is deleted."

## For each new test, the change whose undoing turns it red

- senderParts cases: removing `senderParts` from state/feeds/inbox.ts, or its unquoting of a quoted name.
- Inbox card title cases: putting `titleHtml={inlineMarkdown(...)}` back on the Card, or dropping the `heading` snippet's `span.address` and `Tooltip`.
- Subject case: drawing the subject through `{@html inlineMarkdown(...)}` again.
- Kind-tag case: drawing the kind `Tag` outside `{#if note.triaged}`. Account-tag case: drawing the account `Tag` outside `{#if accountTag}`, or Inbox.svelte passing `true`.
- Control-row case: moving Draft reply or the provider control out of the `meta` snippet, or back to a `p.provider` link.
- One-column audit: `grid-template-columns: repeat(auto-fill, ...)` back on `.cards`.
- The rewritten "draws one card" case: the sender drawn through Markdown again (`<strong>Ada</strong>`).
- Snippet cases (Gmail, Microsoft): removing `decodeHTML` in google.ts or microsoft.ts.
- parseCalendarState cases: a view not in `CALENDAR_VIEWS` kept, or a default other than `timeGridWeek`.
- calendarEvents cases: dropping the hue lookup, the cancelled filter, the date-string pass-through for all-day, the `Date` for a timed start, or `extendedProps.link`.
- The round 1 cases: quoted with their failures in the Repair round 1 section.
- calendarRange case: a window computed from anything but `updated`, `daysBack` and `daysAhead`.
- Calendar view week, month and agenda cases: not passing `held.view` as the library's `view`, or `parseCalendarState` not mapping `agenda` to the week; the toolbar assertions fail when the buttons are drawn by the library again.
- Agenda audit: Agenda.svelte restored.
- Retry-cadence case: the calendar drawn only while connected.
- Add form cases: `PROVIDERS` in place of `PROVIDERS_OF[kind]`, or the Link field not drawn for `ics`.
- ics row case: `AccountList.svelte` not naming `ics` or drawing Connect without `signsIn(row)`.
- calendar-config cases: `connectAccounts` for `calendars:` accepting only `isProvider`, or its sentence not naming ics. connect.test.ts ics case: `PROVIDERS_OF.mail` including ics, or `calendar` not.
- accounts (connect) Add cases: `addRow` checking `providerReady` for ics, not refusing a bad link with `link`, writing no `ics-<label>.json`, or starting a consent.
- poll cases: the ics branch removed from `pollAccount`, `webcal` not read as https, the error hint taken from the thrown message (it then carries `secret.example`), or the empty-file branch missing.
- ics.test.ts cases: `icsAddress`, the label fallback of `calendarName`, `publishedLink`'s scheme rule, the per-occurrence id suffix, or the throw on a text that is not a calendar.
- accounts-store cases: `add` sending no url, waiting on setup for ics, not checking the link before sending, or no `link` case in `refusalWords`.
- The help audit guards `decodeHTML` in `attribute()`; removing it turns it red.

## Problems and limitations, in full

- Not verified in a browser: the four views drawn with events, the theming under each theme, the toolbar's disabling, the click on an event, the period title (it comes from `datesSet`, which runs only in the browser, so a server render draws an empty title), and from round 1 the tooltip on hover (`eventDidMount` runs only in the browser), the transparent cells over a wallpaper, the header row's surface over scrolled rows, the redrawn hour, half-hour and tick lines, and the fill of the pane. The brief's verification is the unit suite, type check, lint, format, build and the orchestrator's look.
- Over a wallpaper the header row and a list view's date headings carry the pane's tint a second time over the pane's own, so they read slightly more opaque than the grid below them; that is what keeps the rows scrolled beneath them from showing through.
- `plainTitle` now decodes every named HTML entity (`&mdash;` becomes the dash, where the old table left it as written) and reads names with their HTML case (`&Nbsp;` stays as written, where the old table read it case-blind), from the `node -e` comparison above; the six names the table held give the same output.
- The source-check test files (comment width, colour rule, key checker, type scale, ASCII gate) were not run in round 1, as the round message limits the runs; the round's own files were scanned by hand for comment lines over 100 columns and for non-ASCII (none), and no font-size rule was added, so the type-scale entry is unchanged.
- A tentative event is drawn in the grid like a confirmed one; the word is in its tooltip. A cancelled event is left out, as the brief says.
- The ics row keeps the account's last good events on a failed read as the other providers do; while it is in error the events shown are from the last good read.
