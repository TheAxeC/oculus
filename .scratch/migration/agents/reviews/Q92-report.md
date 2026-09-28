# Q92 report: the Inbox card, the Calendar on @event-calendar/core, the published calendar link

Everything in the brief is done.

## Open items of the state file (verbatim, read from the main checkout's tools/oculus/.scratch/migration/orchestrator-state.md)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

None.

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

Verify, `sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` from the worktree's tools/oculus, exit 0. The lines it printed (the size table of the build left out):

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
| src/lib/server/accounts/calendar/poll.ts | 223 | 286 |
| src/lib/server/accounts/calendar/routes.ts | 72 | 73 |
| src/lib/server/accounts/connect/actions.ts | 306 | 318 |
| src/lib/server/accounts/connect/loop.ts | 204 | 207 |
| src/lib/server/accounts/connect/rows.ts | 215 | 215 |
| src/lib/server/accounts/connect/store.ts | 244 | 267 |
| src/lib/server/accounts/mail/google.ts | 191 | 193 |
| src/lib/server/accounts/mail/microsoft.ts | 277 | 279 |
| src/lib/server/accounts/mail/poll.ts | 286 | 286 |
| src/lib/server/root/context.ts | 429 | 434 |
| src/lib/state/client/entities.svelte.ts | 103 | 103 |
| src/lib/state/feeds/inbox.ts | 146 | 167 |
| src/lib/state/life/accounts.svelte.ts | 229 | 266 |
| src/lib/state/life/accounts.ts | 44 | 46 |
| src/lib/state/life/calendar.svelte.ts | 71 | 69 |
| src/lib/state/life/calendar.ts | 69 | 147 |
| src/lib/ui/display/hues.ts | new | 10 |
| src/lib/ui/frame/Card.svelte | 225 | 233 |
| src/lib/views/feeds/inbox/Inbox.svelte | 247 | 251 |
| src/lib/views/feeds/inbox/InboxCard.svelte | 287 | 321 |
| src/lib/views/personal/calendar/Agenda.svelte | 123 | deleted |
| src/lib/views/personal/calendar/Calendar.svelte | 133 | 319 |
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
| tests/server/accounts/calendar/poll.test.ts | 635 | 777 |
| tests/server/accounts/connect/accounts.test.ts | 460 | 549 |
| tests/server/accounts/connect/loop.test.ts | 152 | 152 |
| tests/server/accounts/mail/plate.test.ts | 397 | 445 |
| tests/server/root/context.test.ts | 430 | 430 |
| tests/state/feeds/inbox.test.ts | 121 | 142 |
| tests/state/life/accounts-store.test.ts | 327 | 375 |
| tests/state/life/calendar-store.test.ts | 160 | 158 |
| tests/state/life/calendar.test.ts | 114 | 188 |
| tests/views/feeds/inbox.test.ts | 340 | 449 |
| tests/views/personal/calendar.test.ts | 316 | 382 |
| tests/views/system/help.test.ts | 335 | 342 |
| tests/views/whole/type-scale.test.ts | 345 | 344 |
| config/behavior.yml | 163 | 163 |
| config/text/views/personal/account-setup.yml | 87 | 93 |
| config/text/views/personal/calendar.yml | 30 | 44 |
| HELP.md | 294 | 294 |
| DESIGN.md | 320 | 320 |
| package.json | 51 | 54 |
| docs/diagrams layer-server, layer-state, layer-views, layers (.dot and .svg) | | import counts only, from `npm run diagrams` |

"Before" is the main checkout's copy read at report time (`diff -rq` of the two trees shows only this step's files differ). config/text/views/feeds/inbox.yml is unchanged: the card needed no new key.

### Paths outside the brief's list, and why

- src/lib/data/model/index.ts: exports `AccountProvider` and `AccountRow`, the row type both connectors now share.
- src/lib/server/accounts/connect/rows.ts, loop.ts, mail/poll.ts: the row and loop types take `AccountRow` (loop generic over the row type) so an ics row passes through the shared loop and row edit without a cast.
- src/lib/server/root/context.ts: hands the poller the two catalog sentences (`calendar.ics_no_link`, `calendar.ics_failed`), read as `textCatalog(config)['...']` like `notify.stop`.
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
- `grep -rn ENTITIES src tests`: only src/lib/state/life/present.ts:61, :117 (see findings).

### Judgment calls

- The toolbar is oculus's own: Previous, Today, Next as `ToolButton`s, the period title, and the four views as a `Segment`, driving the library through its `prev`, `next`, `gotoDate` calls and its `view` option; the library's `headerToolbar` is empty and its strip hidden. Reason: the spec's rule that every control a reader presses is a ui primitive, never a raw `<button>`, and the library's toolbar draws raw buttons. Previous and Next are disabled, with a tooltip naming the window's first or last day, once the period beyond lies wholly outside `validRange` (the library reads the range's last day as inside it); Today is disabled with "Today is in view." while today is shown.
- The library's component type declares no instance calls, so the bound handle is held as `unknown` and read through one typed accessor, `calls()` (Calendar.svelte:81).
- The library's `height` option prints a function into `style` in a server render, so the height, 600px, is set in the view's CSS instead. Also chosen: `firstDay: 1` (Monday), `scrollTime: '07:00:00'`, `nowIndicator`, 24-hour `eventTimeFormat` and `slotLabelFormat` (oculus's clock is 24-hour, `format.ts` `clock`), and `allDayContent` and `noEventsContent` from the catalog.
- Theming: `--ec-bg-color` and the popup are `--panel`; text `--ink-txt` (the colour rule wants a text token); borders `--line`; secondary text (hours, day headings) `--muted-txt`; today `--chip`; highlight, default event and the active button `--accent-bg` and `--on-accent-bg`; the now line `--accent`; the grey scale `--ec-color-50..400` mapped to `--panel`, `--card`, `--chip`, `--line`, `--muted-txt`; `color-scheme: inherit` in place of the library's `light`. Each account's events are `var(--c-<hue>)` with `var(--on-c-<hue>)`.
- `calendarEvents(events, accounts, hues)` takes the hues as a third argument: state may not import ui, and `HUES` lives under ui as the brief asks. The view passes `HUES`. An event's account is found by the longest account key its id starts with.
- A timed event is handed to the library as a `Date`, since the library reads a `Z` or missing offset as a wall clock; an all-day event keeps its date string.
- The ICS reader resolves a TZID through the file's own VTIMEZONE via the parsed tree (`Component.getTimeZoneByID`), and registers nothing in ical.js's process-wide `TimezoneService`. The brief says "registered"; the effect it asks for (a Windows zone name read by the file's own rules) holds and is tested, and two accounts cannot overwrite each other's zone of the same name. A floating time is published without an offset and read in the page's zone. A series is stepped at most 40000 occurrences to reach the window.
- The link field is a `TextInput` with `secret`, drawn as dots and kept from autofill, since the link is the key to the calendar. The Add button reads "Add" for a published link and "Add and connect" otherwise.
- `add(kind, provider, label, url = '')`; the url is sent only for `ics`; an ics Add waits on no provider setup.
- `accounts.refused_provider` now reads "Pick one of the providers offered." since the calendar offers three.
- Removed catalog keys with no reader left: `calendar.agenda_empty`, `calendar.cancelled`, `calendar.tentative`, `calendar.open_event`. `calendar.today` now reads "Today" (a button label). New keys: calendar `ics_failed`, `ics_no_link`, `next_day|week|month`, `prev_day|week|month`, `no_events`, `no_earlier`, `no_later`, `provider_ics`, `today_shown`, `view`, `view_day|week|month|list`; accounts `add_go_link`, `add_link`, `add_link_hint`, `provider_ics`, `refused_link`, `remove_confirm_link`.
- The provider control on the Inbox card is a compact `ToolButton` (glyph `launch`) that calls `window.open(thread.url, '_blank', 'noopener,noreferrer')`, the brief's second option; Draft reply is a compact `ToolButton` (glyph `draft`) that keeps `active` and `expanded`.
- Caret ranges for `ical.js ^2.2.1` and `entities ^8.1.0`, as for the other dependencies.

## User-visible changes, before and after

- Inbox card. Before: the title was the whole From line through inline Markdown, so an address became a `mailto:` link; the subject muted under it through Markdown; the snippet raw (`&quot;` showed); kind and account tags on every card; a full-width "Draft reply" button and a full-width "open at the provider" link under the text. After: the title is the display name as text, the address smaller and muted after it, the whole From line in a tooltip over the name (the address alone when there is no name); the subject in the text colour at weight 600 as plain characters; the snippet decoded and cut after two lines with an ellipsis; the kind tag only in the Triaged section; the account tag only with more than one mail account; Draft reply and the provider as icon controls on the row beside Archive and Triaged; the draft editor opens under the text.
- Inbox layout. Before: a grid of as many 340px columns as fit. After: one column, top to bottom.
- Calendar. Before: an agenda list grouped by day over 1 day back and 14 ahead. After: the library's calendar over 31 days back and 62 ahead with Day (time grid of one day), Week (time grid, the default), Month (day grid) and List (the week's events as a list); the toolbar above it holds Previous and Next (named for the view's period), Today, the period's title and the four views; the view is kept per instance; each account's events in its own hue; a click on an event with a link opens it at its provider.
- Add form. Before: Google and Microsoft. After, in the Calendar only: Google, Microsoft and Published link; choosing Published link shows a Link field under the label with the hint "The address the calendar is published at, starting https:// or webcal://. It is kept in this machine's calendar folder and never shown again." The Inbox's Add form still offers two.
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

- Not verified in a browser: the four views drawn with events, the theming under each theme, the toolbar's disabling, the click on an event, and the period title (it comes from `datesSet`, which runs only in the browser, so a server render draws an empty title). The brief's verification is the unit suite, type check, lint, format, build and the orchestrator's look.
- The period title is the library's `Intl` range text, which puts an en dash between the first and last date of a week. It is output of the browser's formatter, not source text, so the ASCII gate does not see it.
- What the agenda drew and the library views do not: the calendar name, the location, and the tentative mark. A tentative event is drawn like a confirmed one; a cancelled event is left out, as the brief says.
- The ICS fetch has no timeout, as the Google and Microsoft reads have none; a published link that never answers holds that account's round.
- src/lib/state/life/present.ts:61-117 decodes entities with its own table in `plainTitle` (the deck titles). `entities`' `decodeHTML` covers it. It is the Present view's code, outside this step's concern, so it is reported here and not changed.
- The ics row keeps the account's last good events on a failed read as the other providers do; while it is in error the events shown are from the last good read.
