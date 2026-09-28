# Q92 repair round 1 (sent 2026-09-28)

The round starts at the worktree commit `abe17f5f` (the step's work as you left it, committed by the orchestrator). The findings are those of `agents/reviews/Q92-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q92/tools/oculus` and nowhere else, run no git command of any kind in any checkout, and write under `.scratch/` only your report. Never open, print or grep `config/local.yml` in any checkout, and fetch no calendar address. The rules file and the brief still hold.

## Rulings on what stays

- `calendarEvents(events, accounts, hues)` stays: state may not import `ui/`, so the hues are handed in.
- The time zones resolved through the parsed tree (`Component.getTimeZoneByID`), with nothing registered globally, stay.
- The provider control on the Inbox card stays a `ToolButton` that opens `thread.url` in a new tab, as the brief allowed.
- The paths beyond the brief's list stay, each necessary as the reviewer found.

## Change

1. A read that never answers stops no round. Every request the calendar round and the mail round make (the published link's fetch, each provider's API read, each token refresh) carries a timeout: one helper beside the `Fetcher` type in `server/accounts/connect/oauth.ts` wraps a fetcher so every call gets `AbortSignal.timeout(READ_TIMEOUT_MS)` (30 s; combined with a signal the caller passes, through `AbortSignal.any`), and `calendar/poll.ts:122` and the mail poll's equivalent use it. A timed-out read answers that account's error in a catalog sentence, for example "the provider did not answer within 30 s", and the round goes on to the next account. Cases: a fetcher that answers only when its signal aborts, with the timeout set to 50 ms through the options, gives the account its timeout error, and the next account in the round is still read; the same for a mail account.
2. The calendar under a wallpaper. The library's surfaces take the pane's surface: `--ec-bg-color` (and any other `--ec-*` background the library paints a cell or the grid with) is `transparent`, so the pane's own background shows, opaque under a plain theme and the wallpaper under `body.wall`. Today's column keeps `--chip`; an event keeps its account colour.
3. The calendar fills its pane. The fixed `height: 600px` rule goes. The view is a column at the pane's full height, the library's box `flex: 1; min-height: 0`, and the library is given `height: '100%'`, so the time grid scrolls inside itself with one scroll bar, whatever the pane's height.
4. What the views dropped comes back as each event's tooltip. `calendarEvents` puts a `tooltip` into `extendedProps`, made by a pure function in `state/life/calendar.ts`: the event's time range (or "all day"), its calendar name, its location when it has one, and the catalog word for tentative when the event is tentative (the key `calendar.tentative` restored), joined by ` | `. The library's `eventDidMount` sets the element's `title` to it. Cases: a timed event with a location, an all-day event with no location, a tentative event.
5. Proof. The options the view hands the library come from one pure function in `state/life/calendar.ts` (`calendarOptions`, taking the payload, the chosen view and the words), tested for `validRange` from `updated`, `daysBack` and `daysAhead`, for the view, and for no `validRange` when the payload has no `updated`. `Calendar.svelte` passes its result, adding only the callbacks. The footer case reads the window from the shipped `config/behavior.yml` through the config loader, so putting 1 and 14 back fails it.
6. `plainTitle` in `src/lib/state/life/present.ts:61-117` decodes through `entities`' `decodeHTML` in place of its own table (spec.md: a parser exists once and is reused); the output is unchanged, since a no-break space is folded by the same whitespace replace. Its tests pass, with a case holding `&amp;`, `&nbsp;` and `&#39;`. The path joins the step's list.

## Report corrections

7. The before and after, in "User-visible changes", of: the calendar name, the location and the tentative mark (now in the tooltip); the provider control's loss of a middle-click and a copied link; the period title as `Intl` draws it (an en dash and thin spaces, from the library); the calendar's height (was a fixed 600 px, now the pane's); the calendar over a wallpaper.
8. For each new case, quote its failure with the change it guards undone, then put the file back.

## Tests

Run only the test files you change while working, then `npm run check`, `npm run format:check` and `npm run lint`. Do not run the full verify list: the orchestrator runs it on main at landing.

Rewrite the report at `.agents/worktrees/Q92/tools/oculus/.scratch/migration/agents/reviews/Q92-report.md` with these items, in the brief's shape, its first section the open items as the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` lists them when you finish.
