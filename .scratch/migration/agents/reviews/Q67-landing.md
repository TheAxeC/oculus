# Q67 landing

## Open items

None. Booked, no ruling needed: 3 (Q72, O33, O32).

## NOT DONE

Nothing of Q67's brief. Not looked at: a live Connect against a real provider (no client half exists on this machine), and whether the console links of `config/text/views/personal/account-setup.yml` resolve to the pages they name.

## What landed

Q67, assisted account setup, one commit on main (the commit that carries this file). Rulings applied: the Personal group's chord `p` (Memories `p1`, Calendar `p2`, Account setup `p3`, the two Personal documents `p4` and `p5`) and `open_bin` in `local.yml`.

- Add account and Remove in the Calendar and the Inbox, writing the `calendars:` and `mail:` lists of `config/local.yml` with its comments kept, the lists read again live by the routes and the pollers (`server/root/watch/local.ts`).
- The Account setup view, one section per provider, whose Save writes the provider's client half to `~/.oculus/connect/google.json` or `microsoft.json` for every calendar and mail account of it.
- One shared set of account components under `views/shared/accounts/` and one poll loop (`server/accounts/connect/loop.ts`) for both pollers.

## Fixed at landing

- The Inbox store says a refused command, one no answer came back for and one whose answer was not JSON in catalog sentences (`state/feeds/inbox.svelte.ts` `refusal`), and the Inbox's Refresh says its failure; the Calendar store's Refresh and event open answer the same sentences and the Calendar view draws them in a said line (`state/life/calendar.svelte.ts`, `views/personal/calendar/Calendar.svelte`, `calendar.refused` in the catalog). Cases: `tests/state/feeds/inbox-store.test.ts`, three new cases in `tests/state/life/calendar-store.test.ts`.
- An Add into a flow list its last Remove emptied keeps a comment inside the brackets (`server/accounts/connect/rows.ts:111`), with a case in `tests/server/accounts/connect/rows.test.ts`.
- `removeServedHomeFile` in `tests/browser/helpers/hub.ts` asserts the served home is inside the temporary directory before it deletes, as `writeConnectorFile` does.
- Q67's Doc text applied to `HELP.md` (the `p1-p9` row, the Inbox, Calendar, Account setup and `local.yml` rows, the `local.yml` paragraph, the `~/.oculus/connect` sentence, the Inbox account sentence and a Calendar accounts paragraph) and `DESIGN.md` (the Calendar and Mail paragraphs, the Personal chord, the provider halves and the account actions, the shared connector modules, a new bullet on live account reading and `open_bin`, the opener sentence); the Config view's `desc_local` sentence changed to match the `local.yml` row, which `help.test.ts` checks.
- The `add` icon the Doc text proposed is not added: the Add control keeps `expand`, as the Memories wall's Add does.

## Verification on main, after the fixes

- `npx vitest run --reporter=dot`: `Tests  4990 passed (4990)`
- `npm run check`: `COMPLETED 1425 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run format:check`: `All matched files use Prettier code style!`; `npm run lint`: exit 0
- the ASCII perl gate: 0 lines; `sh bin/size-check.sh` and `sh bin/folder-check.sh`: exit 0
- `npm run diagrams` twice: the diff hash of `docs/diagrams` the same before and after both runs (`f268cd83...`)
- `npm run build`: exit 0; `npx playwright test`: `393 passed (6.8m)`
- `node bin/revert-check.mjs` over `inbox-store.test.ts`, `calendar-store.test.ts` and `rows.test.ts`: `24 reverts, 0 unproven, 6 unchecked` (the 6 name no revert: the success-path and reader cases).
- `ls -d $TMPDIR/oculus-*`: `oculus-browser-mvNSX4` and `oculus-browser.lock`, which X3b's builder's own browser run holds; none of this landing's.

## The look

On the TEST page of the dev server on 8790, under the light theme (Q67 changes no theme): the Views catalogue's Personal group with `p1` to `p5`; `p3` opened Account setup with both providers "not set up", the steps, the console links, the scopes and the redirect addresses on port 8790, and the Google Save form; `p2` opened the Calendar, "not configured", with Add account in the head and on the empty page, and the Add form (provider, label, its hint, Add and connect, Cancel) opened and cancelled; the Inbox from the catalogue with the same head and empty page. Nothing was saved or added. The three tabs were closed afterwards and the page left on Config, as found.

## Next

S2 lands next (its ruling came in on 2026-09-26), then X3a is specced into the freed slot; X3b's builder is still running.
