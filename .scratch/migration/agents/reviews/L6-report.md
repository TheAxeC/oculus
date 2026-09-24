Everything in the brief is done. Two items go to the orchestrator for a ruling: the Findings/Audit contradiction in the brief (see "Brief wrong or impossible") and the full-width bar (judgment call 1).

Open items of the state file, verbatim: none at this brief's writing. There are two new ones to book: (a) the findings item's count and target, (b) the bar under the rail. Both are below.

## DONE / NOT DONE

| Row | State | Proof |
|---|---|---|
| 22 px bar, 12 px items, fixed at every text scale | DONE | bar.spec "the bar is 22 px high ... at the largest text scale too" (textScale 1.6), red under tokens.css:87 and ToolButton.svelte:235 |
| Left group / right group | DONE | bar.spec order case, red under StatusBar.svelte:101 and :188 deleted; status-bar.test "draws the left group and the right group" |
| Host | DONE | name via os.hostname on `ConfigPayload.host`, tooltip `http://127.0.0.1:<port>`, opens Status; settings.spec "each status bar item opens its view", context.test, portfolio.test (red under portfolio.ts:297) |
| Branch + picker | DONE | repo-items.spec switches a fixture repo to `draft` after the confirm; `.git/HEAD` is read back |
| Sync + push | DONE | repo-items.spec pushes 1 commit to a bare upstream (refs compared). In step, it opens Repositories. status-bar.test pushes only when behind is 0 |
| Findings | DONE (see ruling) | the audit openCount, opening the Audit view; settings.spec |
| Bell, centre, toasts, DND | DONE | notices.spec: toast count, 8 s life (>7000 ms elapsed), toast and centre 8 px in from the bar's right end, over the bar, Clear, Clear All, Escape returns focus to the bell, DND keeps the entry and survives a reload |
| Ln/Col, go to line | DONE | source-items.spec: the caret item opens the palette on `:`, `:4` + Enter moves the caret (selectionStart checked), "(3 selected)" |
| Indentation + conversion | DONE | source-items.spec: CRLF+tab fixture, convert to spaces/tabs, unsaved until Save, on disk after. Tab inserts the chosen unit; Escape then Tab moves on |
| Encoding | DONE | "UTF-8" with the tooltip; source-items.spec |
| Line endings + conversion | DONE | source-items.spec LF<->CRLF round trip on disk; typing into a CRLF file keeps CRLF |
| Language mode | DONE | `:language` searchable list of all 19 (Plain Text first), recolours, kept after reload; source-items.spec |
| Right-click hide | DONE | bar.spec: 15 checked items, hidden after reload, `statusHidden` in `oculus.ui.v1` |
| Existing five items kept | DONE | server, usage, HPC, live sessions, unsaved, each icon + short words + tooltip; settings.spec |
| Source 1: rail refusal | DONE | notices.spec: no `.refusal`, no alert in the nav, a toast with role alert and an Open Settings action |
| Source 2: waiting session | DONE | notice-sources.test (once, not again, not on the first message, re-ask is new, Open shows session-detail) |
| Source 3: update task run moved | DONE | notice-sources.test; Open shows radar/leads/linkedin/inbox |
| Source 4: HPC job newly in `recent` | DONE | notice-sources.test (finished vs failed by state+exit, failed polls between, first poll is the baseline) |
| Source 5: write refused or failed | DONE | notice-sources.test (400/409 refused, 200 with a refused field, network failure, timeout, once after the 403 retry, `said` suppresses it); notices.spec in Chrome |

Checks, run from the worktree:
1. `npx vitest run --reporter=dot`: `Test Files  296 passed (296)` / `Tests  4706 passed (4706)`. In an earlier baseline run, 2 timing cases in tests/server/watch/sessions.test.ts failed under load. Rerun alone: `Tests  15 passed (15)`. The final run is fully green.
2. `npm run check`: `COMPLETED 1359 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
3. `npm run build`: build=0
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: exit 0
6. `LC_ALL=C grep -rna '[^ -~]' src tests`: 0 lines. The spec's perl gate: 0 lines.
7. `sh bin/size-check.sh` and `sh bin/folder-check.sh`: both exit 0.
8. `npx playwright test` (final run): `372 passed (12.3m)`.
   - The one `✘` line (files-forms.spec.ts:631) is a `test.fail()` case and is counted as passed.
   - In an earlier full run, unsaved-forms.spec.ts:406 failed once with load average 38: the socket was still "waiting" at boot. Rerun alone twice, it passed (`2 passed`). In the final run it passed.
9. `node bin/revert-check.mjs` over every added or changed test file:
   - node files: 126 reverts; the unproven and GREEN ones were fixed, then rerun per file (editor-text 10/0 unproven, palette 3/0, workbench 11/0, ui+portfolio 7/0, keys+boundaries rerun red).
   - browser files: 97 reverts. The 2 non-red (bar.spec order GREEN, unsaved-forms:345 stale) were fixed and rerun: bar.spec `7 reverts, 0 unproven, 0 unchecked`, bar+unsaved-forms 19 reverts, the only non-red being the order case, which was then fixed.
   - "unchecked" lines are cases that existed before this step with no directive. A script comparing case bodies against main found no new or changed case without a directive after my additions, except the generation.test fixture, which only adds `host` to a payload.
10. `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before, 7015 after. Q68 was running beside me; one partial copy of mine, left by a revert-check run I stopped, was removed by hand.
11. Screenshots at 1400x700 under the three themes, with a source tab active and a 4-char selection, with a toast, and with the centre open. They match the table (host, branch, findings, HPC, usage, server | Ln/Col (n selected), Tab Size, UTF-8, CRLF, Python, sessions, unsaved, bell); under mocha the terminal stand-ins are drawn without brackets. Scratchpad `l6b/`: `bar-{vscode-dark-modern,light,mocha}.png`, `toast-*.png`, `centre-*.png`.

## Files (lines)
Added: shell/status/{Bell 106, NoticeCentre 165, NoticeEntry 93, RepoItems 129, SourceItems 179, Toast 59, status-items.ts 79}; state/workbench/navigation/{editor-status.svelte.ts 105, editor-text.ts 112, notice-sources.ts 233, notices.svelte.ts 97}; config/text/statusbar.yml 111; tests/browser/status/{bar 179, notices 203, repo-items 110, source-items 230, status.ts 72}; tests/state/workbench/navigation/{editor-status 69, editor-text 100, notice-sources 347, notices 82}.

Changed: StatusBar 226, Workbench 382, Palette 387, ActivityRail 302, +page 217, status.ts 252, palette.ts 242, ui.svelte.ts 397, context.ts (client) 270, entities 106, selectors 491, writes 569, sessions/source 351, repositories 144, Source 286, Editor 410, model.ts 419, server/core/context.ts 371, portfolio.ts 398, server.ts 72, tokens.css 152, ToolButton 339, Menu 192, MenuOpener 206, Tooltip 327, on-body.ts 16, glyphs.yml 165, icons.yml 164, workbench.yml 48, docs/diagrams/{channels,layers}.{dot,svg}, plus the test files listed by `diff -rq`.

Paths widened beyond the brief, and why:
- `ui/controls/ToolButton`, `ui/menu/{Menu,MenuOpener,Tooltip}`, `ui/frame/on-body.ts`: the status look, and tooltips and lists that rise above the bar.
- `server/core/context.ts`, `server.ts`: the port for the host address, and the `LISTEN_HOST` constant.
- `state/client/{context,entities,selectors}`: wiring, the `afterReceive` hook, and one shared waiting predicate.
- `state/sessions/source.svelte.ts`: language and indent in instance state.
- `state/sources/repositories.svelte.ts`: push, and switch answering whether git did it.
- `docs/diagrams`: generated.

## First run: kept and rewritten
Kept: the bar, the groups, the source items, the editor status store, editor-text rules, the palette `:<n>` and `:language`, the notices store, Bell/Centre/Toast, the repo items, ui store hiding and DND, the host on the config payload, and the tests for all of these.

Rewritten, because they did not meet the brief:
- notice-sources.ts
  - HPC posted jobs leaving the queue; the brief asks for jobs newly in `recent`, finished or failed by state+exit.
  - Update Open opened the tray; the brief asks for that feed's view.
  - Events were compared to the previous message only; they are now held in a seen-set, so a state that comes back is never told again.
  - Idle prompts were posted; the rule is now the waiting count's own predicate (`waitsOnReader`), shared with `selectors.waitingCount`.
- writes.svelte.ts: only non-2xx answers posted. Now network and timeout failures post too, as do 2xx answers with a refused field, once, after the 403 retry (`exchange` + `tell`, `onUnwritten`).
- Tests: stale revert directives repointed in writes.test, keys.test, boundaries.test, workbench.test, unsaved-forms.spec; `@REFUSED@` replaced; the GREEN cases tightened; new directives for the palette, portfolio and ui cases.
- Added: the toast duration and geometry assertions, and the full-width bar case.

## Judgment calls (reversible)
1. The bar now spans the whole window under the rail (Workbench `.body` row over the bar), as VS Code draws it; before this it sat right of the rail. This is user-visible.
2. The waiting notification uses the permission-prompt rule the title count uses; idle prompts are not posted.
3. HPC finished means `COMPLETED` with exit `0:0` or empty; anything else is failed, CANCELLED included.
4. Write failures with no answer are worded "A write got no answer: ...", apart from refusals.
5. The go-to-line and language list live in the palette; encoding is a one-choice list.
6. `detectIndent`'s redundant `spaced === 0` guard was removed; the behaviour is the same.

## Before and after (for the TEST-page look)
- Any page: the bar was one run of words at 13.5 px beside the rail. Now it is 22 px across the full width with icon items in two groups and a bell at the right.
- A source tab: the Ln/Col, Tab Size, UTF-8, CRLF and language items appear.
- A rail Hide that the server refuses: the fixed red line is gone; a toast appears and the bell counts it.
- Right-clicking the bar lists the items to hide.

## Brief wrong or impossible
The table asks for "the audit findings count ... opening the Findings view", but the count it cites (`rail-badges:157`, `audit.openCount`) is the Audit view's; the `findings` view lists build and config findings. I kept count and target matched: the audit count opens Audit. The alternative is the Findings view's own list length opening Findings. This needs a ruling.

## Limitations
- The scratchpad is shared: my early `rc-node.txt`, `first.diff`, `changed-src.txt` and `directive-tests.txt` sit at its top level and may have overwritten orchestrator files of the same names. Everything later is in `l6b/`.
- Under a load average near 38, one unsaved-forms case timed out once at boot. It passed alone and in the final run.

## Doc text
DESIGN.md:149 now: "...and a status bar along the foot, drawn from words the page hands in; one tree of panes..."
Replace with: "...and a status bar along the foot under both, drawn as VS Code's (see the status bar decision below); one tree of panes..."

DESIGN.md:267 now: "- Tab moves the focus ... A bare Tab or Shift+Tab reaches no binding of the shell: ..."
Append after the first sentence: "The one exception is the source tab's editor, where Tab inserts one step of the tab's indentation; Escape and then Tab moves the focus on, so the keyboard is never held there."

DESIGN.md new bullet after 288:
"- The status bar and notifications, drawn as VS Code's. `shell/status/StatusBar.svelte` runs the window's whole width under the rail, 22 px high (`--status-height`) with 12 px items (`--status-text`), both fixed at every text scale. Every item is a status `ToolButton` or `Menu` with an icon, short words and a tooltip. The left group is host, branch, sync, findings, HPC, usage and server; the right group is the source tab's caret, indentation, encoding, line ending and language, then live sessions, unsaved tabs, and the bell last (`shell/status/status-items.ts`). The host is the server's `os.hostname()` on the `config` channel's `ConfigPayload.host`, with its address. Branch and sync are the repository holding the active tab's file (`repoStatus`), or the hub's; the branch picker switches through `switchBranch`, and sync pushes through `push` only when ahead and not behind, otherwise it opens Repositories. The source view publishes its caret, indent, ending and language to `state/workbench/navigation/editor-status.svelte.ts`, keyed by instance, and performs what the bar asks. Language and indent choices are kept in the tab's instance state. A right-click lists the items; the hidden set and Do Not Disturb are kept in the ui store. Notifications are `state/workbench/navigation/notices.svelte.ts`: toasts show 8 s over the bar's right end, the centre lists them newest first with Clear, Clear All and Do Not Disturb. Five sources post, each once per event (`notice-sources.ts`): a refused rail write, a session newly waiting on a permission prompt, an update task whose run date moved, a Live HPC job newly in `recent`, and any write refused or unanswered (`writes.onUnwritten`)."

HELP.md:66 now: "Tab and Shift-Tab are the browser's: they move the focus between the controls on the page, as they do everywhere, and reach no binding of this table."
Replace that sentence with: "Tab and Shift-Tab are the browser's: they move the focus between the controls on the page and reach no binding of this table, except in the source tab's editor, where Tab inserts one step of indentation and Escape then Tab moves on."

HELP.md:68 now: "Cmd-K opens the palette. ... before its title."
Append: "A colon starts a command: `:` and a line number moves the source tab on screen to that line, and `:language` lists every language the highlighter knows, narrowed by what follows, to repaint the tab."

HELP.md:72 now: "The status bar along the bottom reads the server connection (`server: up`, `down` or `waiting`), ... and is not pressable at 0."
Replace with: "The status bar runs along the bottom under the rail. On the left: the machine oculus runs on (opens Status), the branch of the repository holding the active tab's file (a list of its branches to switch to), how far it is behind and ahead of its upstream (pushes when only ahead, otherwise opens Repositories), the audit findings, the Live HPC poll, the usage refreshers and the server connection. On the right, for a source tab: the line and column (opens the palette on `:`), the indentation (switch spaces or tabs and width, or convert the text), UTF-8, the line ending (convert it), and the language (a searchable list). Then the live sessions, the unsaved tabs (shows the first; not pressable at 0) and the bell. A right-click on the bar hides or shows any item. The bell counts unread notifications and opens the notification centre, with Clear, Clear All and Do Not Disturb; a new notification shows as a toast for eight seconds. Notifications come from a refused rail change, a session waiting on a permission, an update task that ran, a Live HPC job that ended, and a write that was refused or got no answer."

# Repair round 1

Everything in the brief is done. For Axel at landing: the full-width bar (your ruling: it goes to him) and the branch stand-in change, which reaches beyond the bar (ruling 3).

1. Findings item. The item now counts the Findings view's own list and opens Findings.
   - `findingsCount(portfolio(), config())` in status.ts:189-200, wired at +page.svelte:119. StatusBar.svelte:110 opens `findings`.
   - Words changed: `findings_name: '{0} findings'`, `findings_tip: '{0} findings in the hub and the configuration. Open Findings.'`. Comments in status.ts and StatusBar updated.
   - settings.spec now asserts the Findings tab, with a new directive at StatusBar.svelte:110 (`openView('audit')`).
   - New browser case: the bar's number equals the Findings view's row count, and that count is above 0. It is red when the page's wiring is reverted (+page.svelte:119 `findings: 0,`) and when the config half is dropped (status.ts:199).
   - New node case in status.test for the count.
   - Proof: `node bin/revert-check.mjs tests/browser/shell/settings.spec.ts` gives `10 reverts, 0 unproven, 0 unchecked`. `node bin/revert-check.mjs tests/state/workbench/navigation/status.test.ts` gives `14 reverts, 0 unproven, 0 unchecked`.
2. Waiting source. Both hooks now post, each worded as what it waits for.
   - `waitOf(hook)` returns `'permission'` or `'idle'` (notice-sources.ts:44-47). The words are `notice_permission: '{0} is waiting for you to answer a permission prompt.'` and `notice_idle: '{0} finished its turn and is waiting for your input.'`.
   - `waitingCount` and the window title still use `waitsOnReader`, which is permission only.
   - New cases:
     - an idle session is told once, told again after a later turn, and Open shows it; red under notice-sources.ts:46 `return null;` and :189 (wording).
     - the kinds are read correctly and the count is still 1; red under :33.
   - Proof: the revert-check batch over notice-sources.test, status-bar.test and status.test gave 41 reverts. Its only non-red lines were status.test's stale directives, since repointed and proven above (14/0/0). Every notice-sources case, the new idle one included, was red.
3. Terminal stand-ins.
   - `caret: "|"` is now `"[I]"`.
   - `branch: "|-"` is now `"[Y]"`. The branch glyph is not new, but the reviewer saw it read as a divider in the bar too. This changes its stand-in everywhere under terminal themes, the Repositories view included.
   - The other new stand-ins contain no `|` and are not made of strokes only: `[h] (s) (%) ^ v >> [u] <- {} (n) (N) (z) [c]`.
   - New case in status-bar.test: renders the bar in ascii mode and asserts no drawn stand-in contains `|` or is only strokes (`[-_:./\\]+`). It is red under glyphs.yml:157 (`caret: "|"`) and :40 (`branch: "|-"`); it was in the 41-revert batch with no non-red line for this file.
4. The report is updated below.

Other fixes this round:
- `node bin/diagrams.mjs` was rerun, since the page's channel imports changed. Without it, tests/checks/diagrams failed once in the run before.
- The status.ts directives were shifted by the new function and are repointed: 216, 224, 229-231, 236, 258-263.

## Verification, after the round
- `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before, 7015 after.
- `npx vitest run --reporter=dot`: `Test Files  296 passed (296)` / `Tests  4709 passed (4709)`.
- `npm run check`: `COMPLETED 1359 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run build`: exit 0. `npm run format:check`: `All matched files use Prettier code style!`. `npm run lint`: exit 0.
- `LC_ALL=C grep -rna '[^ -~]' src tests`: 0 lines. The spec's perl gate over src tests bin config: 0 lines.
- `sh bin/size-check.sh`, `sh bin/folder-check.sh`: both exit 0.
- `npx playwright test` (whole suite): `373 passed (7.7m)`. The one `✘` line, files-forms.spec.ts:631, is a `test.fail()` case and is counted in the passes.
- revert-check over every test file changed this round: settings.spec gave 10/0/0 and status.test 14/0/0. notice-sources.test and status-bar.test were in the 41-revert batch, whose only non-red lines were the status.test ones fixed above.
- revert-check over all earlier files: the numbers in the first report, which the reviewer reproduced (129 node / 98 browser, 0 unproven).

## DONE / NOT DONE
Every row of the first report stands. These rows changed:
- Findings: DONE. It counts the Findings view's list and opens Findings. Proof: settings.spec cases and status.test above.
- Source 2, waiting session: DONE. Permission prompts and idle prompts post, each once per event.
- Terminal stand-ins: DONE.

## Files changed this round
- src/routes/+page.svelte, src/lib/state/workbench/navigation/status.ts (252 to 265 lines), src/lib/shell/status/StatusBar.svelte
- src/lib/state/workbench/navigation/notice-sources.ts (233 to 252 lines)
- config/text/statusbar.yml, config/catalogs/glyphs.yml, docs/diagrams/*
- tests/browser/shell/settings.spec.ts, tests/state/workbench/navigation/{status,notice-sources}.test.ts, tests/shell/status/status-bar.test.ts

## Judgment calls (reversible)
1. The bar spans the whole window under the rail. It goes to Axel.
2. HPC "finished" means COMPLETED with exit `0:0` or empty; anything else is reported as failed.
3. A write that got no answer is worded apart from a refused one.
4. Do Not Disturb is kept across reloads in the UI store (`oculus.ui.v1`, `statusQuiet`), beside the hidden items. The ruling covered per-browser persistence for the hidden items only.
5. A branch switch or a push from the bar goes through the same Confirm dialog the Repositories view asks before git runs.
6. Go to line and the language list are the palette. `:language` is a new palette command, offered only while a source tab is on screen. Encoding is a one-choice list.
7. The branch stand-in is now `[Y]` everywhere under terminal themes (ruling 3).

## Before and after (for the look on the TEST page)
- **Any page, the bar.** Before: one run of words at 13.5 px, right of the rail. After: 22 px across the whole width, with icon items in two groups and the bell at the right.
- **Findings item.** Before the round: it showed the audit's open count and opened Audit. After: it shows the number of rows in the Findings view (the snapshot's and the config's findings) and opens the Findings view. Press it and the number should match the rows listed.
- **Do Not Disturb.** Turn it on in the centre and reload: the bell keeps its quiet face and new notifications show no toast. They are still listed in the centre.
- **Branch and sync.** Pick another branch from the branch item, or press sync when only ahead: a confirm dialog asks before git switches or pushes.
- **`:language` in the palette.** With a source tab on screen, the language item or `:language` lists every language; typing narrows the list and Enter repaints the tab. Without a source tab it says there is none.
- **A source tab.** The Ln/Col, Tab Size, UTF-8, CRLF and language items appear. Under mocha the caret draws `[I]` and the branch `[Y]`, neither reading as a divider.
- **A refused rail Hide.** No fixed red line; a toast appears and the bell counts it.
- **A session going idle after its turn.** A notification: "<title> finished its turn and is waiting for your input."

## Doc text
- DESIGN.md:149, DESIGN.md:267, HELP.md:66 and HELP.md:68: as in the first report.
- DESIGN.md new bullet: as in the first report, with two corrections:
  - "the findings" becomes "the findings item, the count of the Findings view's list (the snapshot's findings and the config channel's), opening the Findings view as VS Code's Problems count opens Problems".
  - the waiting source becomes "a session that starts waiting on a permission prompt or goes idle after its turn (`permission_prompt`, `idle_prompt`), each worded as what it waits for".
- HELP.md:72: as in the first report, with two corrections:
  - "the audit findings" becomes "the findings the Findings view lists (opens it)".
  - the last sentence becomes "Notifications come from a refused rail change, a session waiting on a permission prompt or waiting for input after its turn, an update task that ran, a Live HPC job that ended, and a write that was refused or got no answer."

## Limitations
- `waitingCount` and the window title still count permission prompts only, as ruled. An idle session posts a notification but does not count in the title.
- Scratchpad files from the first run's early commands may have overwritten orchestrator files of the same names; all later files are in `l6b/`.
