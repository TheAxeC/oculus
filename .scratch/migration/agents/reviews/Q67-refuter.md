# Step Q67 refuter report (on .agents/worktrees/Q67, base d52afada)

## Verification (rerun by the reviewer)
All commands were run from `.agents/worktrees/Q67/tools/oculus`.
- `npx vitest run --reporter=dot` printed `Test Files  1 failed | 318 passed (319)` and `Tests  4 failed | 4959 passed (4963)`. The 4 failures are all in `tests/views/system/help.test.ts`: account-setup view id, `p1-p9`, letter `p`, `open_bin`. This matches the report. Brief item 1 (every case passes) does not hold.
- `npm run check` printed `COMPLETED 1420 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run build` exited 0.
- `npm run format:check` printed `All matched files use Prettier code style!`.
- `npm run lint` exited 0.
- The ASCII gate (spec.md form) printed nothing.
- `sh bin/size-check.sh` and `sh bin/folder-check.sh` both exited 0.
- `npm run diagrams` run twice: the sha of `git diff d52afada -- docs/diagrams` was `737f9f41...` before, after the first run and after the second. No difference.
- `npx playwright test` (whole suite, after build, once 8792 and the lock were free) printed `391 passed (6.9m)`. This matches the report.
- `node bin/revert-check.mjs` over the 25 changed or added unit test files printed `161 reverts, 0 unproven, 151 unchecked`. This matches the report's unit row.
- `ls -d $TMPDIR/oculus-* | wc -l` was 3 before and 3 after. Other runs held entries throughout (`oculus-browser-*`, `oculus-browser.lock`, `oculus-revert-*`), so nothing leaked could be attributed to this step either way.
- A probe of `rows.ts` through `npx tsx` on a scratchpad script (no repository file written) produced the rows.ts findings in section 1.

## 1. Spec
- **Data loss in the Remove edit.** `src/lib/server/accounts/connect/rows.ts:131-136`: removing the last row of a block list replaces everything from the key's end to the list's end with `: []`.
  - This drops a comment on the key's own line and every comment line inside the list.
  - Probe input: `calendars: # my calendars\n  # the work one\n  - { provider: google, label: work } # uni\nport: 8790\n`. Removing `google-work` yields `calendars: []\nport: 8790\n`.
  - The brief item 5 asks for a comment-preserving removal, and the head comment at `rows.ts:5-7` says "everything else is copied through untouched". `verified()` compares only values, so it passes this.
  - No test covers a comment beside the key or inside the list when the last row goes.
- **New config key `open_bin` (a reserved decision, taken).** Code at `src/lib/data/sources/config/local.ts:59-64, 102, 256-261`, `src/lib/server/files/open.ts:275-288`, `src/lib/server/root/context.ts:352`.
  - It is a user-visible key that no item names. The brief asked for "the opener stubbed, as the existing tests do"; the builder added a production key so the served test run can record addresses.
  - The report lists it as judgment call 1, but it is baked into the code and causes one of the four red help.test cases. Axel's ruling is needed.
- **Personal group gets its own chord (a reserved decision, taken).** `config/layout.yml:33` gives Personal chord `p` and glyph `memories`. Memories and Calendar move off `v` digits to `p1`/`p2`, and Personal's documents follow them. The sheet row is added in `config/text/app.yml:12`.
  - The step is forced by the tree's rule: a group with more than four entries is reached only by its own chord (`config/layout.yml:25`).
  - The letter, the glyph and the keyboard move are still a user-visible key chord that nothing names. It is reported (judgment 4) and causes two of the four red help.test cases. Axel's ruling is needed.
- **Brief item 2 text is incomplete.** The admin sentence `accounts.microsoft_admin` in `config/text/views/personal/account-setup.yml:46` omits the brief's "and that the consent screen then says so".
- **Paths written outside the brief's list:**
  - `src/lib/server/core/auth.ts`, `src/lib/server/machine/hpc/routes.ts`, `src/lib/server/machine/usage/routes.ts` (the `gatedBody` fold).
  - `src/lib/server/files/open.ts`, `src/lib/state/client/context.ts`, `src/lib/ui/forms/TextInput.svelte` (a new `secret` prop on a ui primitive), `src/lib/data/sources/config.ts`, `src/lib/data/model/index.ts`.
  - `config/layout.yml`, `config/text/app.yml`, `docs/diagrams/*`.
  - All of these are listed in the report. The `ui/` primitive change and the hpc/usage route refactor are items no brief line asks for.
- **Premise check.** Premises 4 (`oauth.ts:217`, `store.ts:102-119`) and 7 (the HELP.md grep prints nothing at base) were checked and reproduce. No wrong premise was found.

## 2. Proof
- **The write chain is untested.** Brief items 1 and 3 require writing behind the write chain, but no case exercises it for the Add, the Remove or the Save.
  - `grep -n chain tests/server/accounts/connect/*.ts tests/server/root/context.test.ts` prints nothing.
  - The revert cited for "the Save goes through the write chain" is `setup.ts:76 => delete`, which deletes the write itself. Replacing `chained(target.writes, ...)` with a direct call at `actions.ts:192`, `actions.ts:228` or `setup.ts:76` leaves every case green (inference from the test list; not run).
  - The spec requires an asynchronous path to be exercised in flight and superseded; two Adds in flight is not.
- **`open_bin` is exercised by no unit case.** Not tested: the empty string, a non-string, the refusal message at `local.ts:258`, the context choosing `addressOpener` (`context.ts:352`), or `addressOpener` refusing a non-https address.
  - The spec requires a new key to be exercised empty and colliding.
  - `grep -rn "open_bin\|openBin\|addressOpener" tests` shows only the browser helpers.
- **The setup-first Add flow is not proven in the browser suite.** Brief item 3's last sentence (Add with no half opens the setup page, and the account is added after Save) is covered only by the node store test with a stubbed `open`, not by any browser spec. The spec says a press or effect is proven in the browser suite.
- **Browser case order dependence.** `tests/browser/views/accounts/accounts.spec.ts:94-100` first asserts `accounts.not_ready`. That fails if the Google half already exists: on a retry, or when another case ran first. The head comment at `accounts.spec.ts:6-7` claims "any one of them runs alone". It holds only for the first run in file order.
- **Boundaries allowlist widened.** `tests/checks/tree/boundaries.test.ts:106` adds `data/accounts/connect` to the state row's allowed imports. It follows the precedent of `data/accounts/calendar`/`mail` and carries a reason. Reported as judgment 9.
- **`allow-duplication.txt`** only had stale lines removed, which is a tightening. Nothing was added.
- **Browser specs not revert-checked by the reviewer.** The report's browser row (`7 reverts, 0 unproven`) was not rerun.

## 3. Standards
- **DRY: a third copy of the write-chain idiom.** `src/lib/server/accounts/connect/actions.ts:129-136` (`chained`) copies what `src/lib/server/core/changes.ts:224-231` and `src/lib/server/files/fs.ts:561-569` already hold. It is placed in a connector module rather than in `core/`, and neither existing site reuses it.
- **DRY: a third copy of the client POST.** `src/lib/state/life/accounts.svelte.ts:95-107` (`post`) is a third copy of the POST-with-token pattern in `calendar.svelte.ts` and `inbox.svelte.ts`.
- **Hard-wrapped comment line.** `tests/checks/tree/boundaries.test.ts:34` is a single short line (`` // `data/helpers/dates`, ``) left by the edit.
- **Catalog key misnamed.** `config/text/views/personal/calendar.yml:13` `calendar.no_accounts` now holds the head's state word `not configured`. It is read as `unconfigured` at `Calendar.svelte` `headWords()`, while the Inbox reads `inbox.unconfigured`. The key name no longer says what it holds.
- **DESIGN.md:300 made false.** It says "the calendar and mail links go through `macOpenAddress`". With `open_bin` set they go through `addressOpener(open_bin)`. The report's Doc text gives no replacement for DESIGN.md:300.
- **Selector change not reported.** The browser selector `data-mail-account` became `data-account` in the Inbox, and `tests/browser/views/accounts/inbox.spec.ts:23` was changed with it. The spec requires the report to say so, and it does not.
- **Rules broken by the builder, both disclosed:** two read-only git commands (`git check-ignore`, `git status --porcelain`) against spec.md's "You never run a git command".

## 4. Behaviour
- **Remove deletes an account's own client half, unstated.** For a legacy account file that carries its own `client_id`/`client_secret`, Remove deletes that half with the token (`store.ts` `removeAccountFile`). The confirm text (`accounts.remove_confirm`: "Its token file is deleted; the provider stays set up") and the report do not say this.
- **Provider naming differs between the Inbox and the setup page.** In the Inbox, a row needing setup reads "Outlook is not set up on this machine yet." / "Set up Outlook" (from `inbox.provider_microsoft`). The setup page it opens names the section "Microsoft (Outlook calendar and mail)" and says "Saved. Microsoft is set up." The report states only that the Inbox keeps Gmail/Outlook.
- **Keyboard move without before and after.** Memories and Calendar are no longer reached by `v12`/`v13` but by `p1`/`p2`, with Account setup at `p3` and the two Personal documents at `p4`/`p5`. The report states the chord but not the old digits.
- **`data-account` collision.** The Calendar and the Inbox now both carry `data-account="<provider>-<label>"`, so an account of the same key in both views has the same attribute on one page. Before, the Inbox used `data-mail-account`. This is not stated.
- **Errors escape unhandled.** An Add/Remove/Connect/Save whose answer is not JSON, or whose fetch fails, rejects inside `post` (`accounts.svelte.ts:101`). The presses call it through `void`, so the reader sees no sentence and the rejection is unhandled. This is not stated.

## Not checked
- `node bin/revert-check.mjs` on the three browser specs.
- Whether the Google and Entra console URLs in `account-setup.yml:27-31, 48` still resolve to the pages named.
- A live Connect against a real provider.
- Races between an Add and a whole-text save of `local.yml` from the source tab, which does not use the write chain (brief premise 2).

Reviewer usage: tokens not measured; about 50 tool uses; about 75 minutes, mostly waiting for port 8792 and the revert-check run.

## Repair round 1, refuted

All commands were run from `.agents/worktrees/Q67/tools/oculus`.

**Verification commands and their summary lines, verbatim:**
- `npx vitest run --reporter=dot`: `Test Files  2 failed | 319 passed (321)` / `Tests  5 failed | 4978 passed (4983)`.
  - Four of the five are the expected tests/views/system/help.test.ts cases: view id, sheet keys, group letter, machine-local keys.
  - The fifth was `tests/server/root/watch/bookmarks.test.ts > publishes once for a burst of writes...` (`expected ... length of 1 but got 2`). That file is not in the diff. Run alone it printed `Tests  4 passed (4)`, so it is load timing and not a finding.
- `npm run check`: `COMPLETED 1424 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: `build exit 0`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: `lint exit 0`
- ASCII gate (the rules file's perl line): no output, `ascii exit 0`
- `sh bin/size-check.sh`: `size exit 0`. `sh bin/folder-check.sh`: `folder exit 0`
- `npm run diagrams` twice: the sha of `git diff d52afada -- docs/diagrams` was `3cd788ff...` before, after the first run and after the second.
- `npx playwright test`, after the build, with port 8792 free: `393 passed (7.0m)`, `pw exit 0`.
- Revert-check over the unit files of items 1, 2, 5 and 12 (`node bin/revert-check.mjs` with rows.test.ts, accounts.test.ts, accounts-store.test.ts, account-setup.test.ts, remove-account.test.ts, calendar/poll.test.ts and mail/poll.test.ts): `74 reverts, 0 unproven, 18 unchecked`. The 18 unchecked are older poll cases that name no revert.
- Revert-check over `tests/browser/views/accounts/accounts.spec.ts`:
  - First run: `7 reverts, 4 unproven, 0 unchecked`. Red: `accounts.svelte.ts:192` (item 7), `AccountList.svelte:153`, `calendar/poll.ts:167` (item 12). The 4 unproven are "the case did not run".
  - Second run: `7 reverts, 6 unproven, 0 unchecked`. All 6 unproven are "the case did not run". Port 8792 was held by another worktree's revert copy (pid 71099, `oculus-revert-yUQIAy/src/server.ts`).
- `ls -d $TMPDIR/oculus-* | wc -l`: 2 before and 2 after. Every entry was another run's `oculus-revert-*` folder, and the names changed between the two counts.

**Closures read and reproduced:**
- Item 1: a probe of `rows.ts:151-152` through `npx tsx`, over a comment beside the key, comment lines inside the list, a trailing comment line, a block-map row and no final newline, keeps every comment except the row's own.
- Items 3, 4, 6, 9, 10, 11 and 13: read at the lines the report cites, and they hold.
  - Item 6: the context's opener choice is at `context.ts:352`, `open-bin.test.ts:12-34` covers the empty and non-string values and the non-https refusal, and the DESIGN.md:300 line is in the Doc text.
  - Item 13: `setupName` is used at AccountList.svelte:108 and :139.
- Item 14: boundaries.test.ts:33-40 reads as one rejoined paragraph.
- Item 15: the premise-wrong claim holds, since `catalogue.ts:155` keys only `at < 9`.

**Findings:**
- `src/lib/state/feeds/inbox.svelte.ts:57-60` with `src/lib/views/feeds/inbox/InboxCard.svelte:99` (Behaviour). Item 4 moved the Inbox store onto `postCommand`. When a triage, reply or archive gets no answer or a non-JSON answer, the store returns the helper's code as `error`, and the card then reads "Refused: unreachable" or "Refused: unreadable".
  - That is an internal code in a user-facing sentence, not the catalog sentence item 5 asked for. `accounts.svelte.ts` maps these two codes to `accounts.unreachable` and `accounts.unreadable`; the Inbox store does not.
  - The Calendar store's `refresh` and `openEvent` (`calendar.svelte.ts:42`) drop the failure without a sentence.
  - No case covers either path.
- `src/lib/server/accounts/connect/rows.ts:110-111` (Spec, brief item 3: the Add keeps the file's comments). An Add into an empty flow list replaces the whole bracket range, so a comment inside the brackets is lost.
  - Probe: removing the last row of `calendars: [ # c\n  { provider: google, label: work } ] # k\n` gives `calendars: [ # c\n   ] # k\n`. Adding the row back gives `calendars: [{ provider: google, label: work }] # k\n`, and `# c` is gone.
  - Every Remove of a last row now writes a flow `[]`, so the next Add always takes this branch. No test covers a comment inside the brackets.
- `tests/browser/helpers/hub.ts:166-171` `removeServedHomeFile` (Standards, the rules file's temporary-directory rule). It asserts only that the path is inside `servedHomeDir()`, never that the home is inside `tmpdir()`.
  - `writeConnectorFile` at :119-121 asserts both.
  - The round report's row 8 says "both check that the path is inside the run's temp before they write", which the code does not bear out for the deleting helper. That helper deletes `.oculus/connect/google.json` at the start and end of every accounts.spec case.

## Not checked
- The browser reverts `setup.ts:56`, `HalfForm.svelte:35`, `actions.ts:211` and `store.ts:169` did not run in either revert-check pass, because port 8792 was held by another worktree's run. Those reverts are outside items 1, 2, 5 and 12. The item 12 browser revert (`calendar/poll.ts:167`) came out red in the first pass.
- Each accounts.spec case run alone (the builder's item 8 output) was not rerun. The whole file ran green inside the full Playwright run.
- Whether the console URLs in account-setup.yml resolve to the pages they name.
- A live Connect against a real provider.

Reviewer usage: tokens not measured; about 35 tool uses; about 45 minutes, most of it the vitest, Playwright and revert-check runs.

## Closed (the orchestrator's disposition of every finding above, added 2026-09-28 from the round message, `Q67-report.md` and `Q67-landing.md`)

First review:
- Remove drops comments (`rows.ts:131-136`): round item 1.
- `open_bin`: ruled by Axel 2026-09-26, option (a) (plan.md, Q67's Step 0), unit cases in round item 6.
- The Personal group's chord: ruled by Axel 2026-09-26, option (a), `p`.
- The Microsoft admin sentence: round item 9.
- The write chain untested: round item 2.
- `open_bin` untested: round item 6. DESIGN.md:300 made false: round item 6 (Doc text, applied at landing).
- Setup-first Add not proven: round item 7. Browser case order: round item 8.
- DRY, the chain: round item 3. DRY, the client POST: round item 4.
- The hard-wrapped comment line: round item 14. The misnamed catalog key: round item 10.
- The selector change not reported, and the `data-account` collision: round item 11, the before and after in round item 15.
- The builder's two read-only git commands: the round message repeated the ban; none in the round.
- Remove deletes an account's own client half: round item 12. Provider naming: round item 13. The keyboard move: round item 15.
- Errors escape unhandled: round item 5.
- Premise check, the `allow-duplication.txt` removals, the reviewer's own unrun browser reverts: no finding.
- Paths written outside the brief's list (the `secret` prop on `ui/forms/TextInput.svelte`, the `gatedBody` fold into the hpc and usage routes): no round item and no disposition in the landing. Raised as Z16 and Z17, withdrawn by the orchestrator and accepted as landed (see the state file's closed items).
- The boundaries allowlist widened (`tests/checks/tree/boundaries.test.ts:106`, `data/accounts/connect` allowed to state): no round item and no disposition in the landing. Raised as Z16 and Z17, withdrawn by the orchestrator and accepted as landed (see the state file's closed items).

Repair round 1, refuted:
- The Inbox and Calendar failure sentences: fixed at landing (`Q67-landing.md`, Fixed at landing, first bullet).
- An Add into an emptied flow list drops a comment inside the brackets: fixed at landing, second bullet.
- `removeServedHomeFile` does not check the home is inside the temporary directory: fixed at landing, third bullet.
