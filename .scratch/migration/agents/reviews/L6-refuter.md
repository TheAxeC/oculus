# Step L6 refuter report (on .agents/worktrees/L6, base 7319fa60)

## Verification (rerun by the reviewer)
```
ls -d $TMPDIR/oculus-* | wc -l                      (before)  7015
npx vitest run --reporter=dot                       Test Files  296 passed (296) / Tests  4706 passed (4706)
npm run check                                       COMPLETED 1359 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run build                                       exit 0
npm run format:check                                All matched files use Prettier code style!
npm run lint                                        exit 0
LC_ALL=C grep -rna '[^ -~]' src tests               (nothing)
spec.md perl ASCII gate over src tests bin config   (nothing)
sh bin/size-check.sh ; sh bin/folder-check.sh       exit 0 ; exit 0
npx playwright test (whole suite)                   1 failed, 371 passed (9.3m); the failure is tests/browser/boards/board.spec.ts:39 "Test timeout of 30000ms exceeded while setting up "context"" (browser.newContext, before any page code ran)
npx playwright test tests/browser/boards/board.spec.ts (rerun alone)   5 passed (10.6s)
node bin/revert-check.mjs <node test files changed, 4 batches>   20+33+38+38 = 129 reverts, 0 unproven; unchecked lines are cases older than this step
node bin/revert-check.mjs <browser specs changed, 6 batches>     7+9+7+19+29+27 = 98 reverts, 0 unproven, 0 unchecked in tests/browser/status/*
ls -d $TMPDIR/oculus-* | wc -l                      (after)   7015
Screenshots (own scratch config, 1400x700, source tab over a CRLF+tab .py file, then the centre open): vscode-dark-modern, light, mocha. Measured under mocha: bar x 0, width 1400 = viewport, height 22; every item 22 px high, 12px font.
Report's quoted evidence, compared:
  "Tests 4706 passed (4706)"                  reproduced
  "372 passed (12.3m)"                        371 + 1 infra timeout that passes alone; same total
  "node files: 126 reverts"                   129 now (report's number predates its own fixes)
  "browser files: 97 reverts"                 98 now
  "bar.spec 7 reverts, 0 unproven, 0 unchecked"   reproduced
  "15 checked items"                          LEFT_ITEMS 7 + RIGHT_ITEMS 8 = 15, reproduced
  "7015 before, 7015 after"                   reproduced
```
## 1. Spec
- src/routes/+page.svelte:119 (`findings: openCount()`), src/lib/shell/status/StatusBar.svelte:110 (`onclick={() => openView('audit')}`), config/text/statusbar.yml `findings_name: '{0} audit findings'`, `findings_tip: '... Open Audit.'`, src/lib/state/workbench/navigation/status.ts:3 and :72 ("the audit findings"): the findings item counts `audit.openCount()` and opens the Audit view. The corrected brief's row asks for the Findings view's own list, `[...(portfolio()?.findings ?? []), ...(config()?.findings ?? [])]` (`src/lib/views/system/findings/Findings.svelte:31`), opening the Findings view (`id: 'findings'`, Findings.svelte:5). The report marks this row DONE and opens with "Everything in the brief is done". Its "Doc text" for HELP.md:72 ("the audit findings") and the DESIGN bullet carry the same wrong target.
- The full-width bar (Workbench.svelte `.body` row over `<StatusBar>`, `.workbench` now `flex-direction: column`): no ruling covers it, and it is not a reserved decision in the brief's list. It follows the plan line "drawn like VS Code's", and VS Code's status bar runs under the activity bar. The report states it as judgment call 1 with before and after. Acceptable as reported. It still has to be booked for Axel, as the report asks.
- Idle prompts not posted (notice-sources.ts:32, `waitsOnReader` = permission_prompt only): this matches the brief's row 2, which ties the event to `waitingCount`'s count. The tree's own words agree: config/text/server.yml calls permission_prompt "waiting on you" and idle_prompt "idle". Axel's ruling says "waiting for input", which the brief narrowed. That narrowing is the brief's, not the builder's.
- Paths widened, each checked for need: `ui/controls/ToolButton`, `ui/menu/{Menu,MenuOpener,Tooltip}` (the `status` look and the `above` placement are used by every bar item and list), `ui/frame/on-body.ts` (head comment only), `server/core/context.ts` + `server.ts` (`hostInfo(local.port)`, `LISTEN_HOST`), `state/client/{context,entities,selectors}` (wiring, `afterReceive`, shared predicate), `state/sessions/source.svelte.ts` (language/indent in the draft), `state/sources/repositories.svelte.ts` (`push`, boolean answers), `docs/diagrams/*` (regenerated). Each is needed. `config/text/views/system/workbench.yml` falls under `config/text/`.
- `:language` is a new palette command (palette.ts:238, `available: source`), a vocabulary the brief does not name. The brief asked for "a searchable list", and the report states the palette route as judgment call 5. Reported, not silent.
## 2. Proof
- tests/browser/shell/settings.spec.ts:149-153: asserts that the findings item opens the Audit tab (`t('views.audit')`). Under the corrected brief this encodes the defect above. No case proves the findings count is the Findings view's list: status.test.ts:135 only passes a given `findings: 4` through, and the page's `openCount()` wiring has no case.
- Notification sources: each of the five posts once per event and not again for the same state. notice-sources.test.ts runs this through a real client (`client.entities.receive` / `createWrites`). It covers sessions (first message silent, re-ask new, repeat silent), HPC (failed polls between, finished vs failed), feeds and the inbox `notesRun`, and writes (refused, 2xx with a refused field, network, timeout, once after the 403 retry, `said`). The rail refusal is covered in notices.spec. Every directive was red on rerun (13/13 in that file). None found.
- No widened threshold or wait. The toast case bounds 7000 ms < life < 10 s (notices.spec.ts:91-93) and is red under Toast.svelte:23. No file-scope mutable (grep of added top-level `let`/mutable `const` in src: none).
## 3. Standards
- None found beyond the stale findings wording in section 1. Head comments that the change touches were updated (ActivityRail, on-body, Workbench, repositories, entities, writes). A grep for `refusal line`, `REFUSAL_MS`, `.refusal`, `status_socket`, `unsaved tabs:` and `live sessions:` across src, tests, config and the docs finds no stale hit. No history in comments. No added src line over 100 columns except a lint-disable. Largest touched: src 569 lines (writes.svelte.ts), tests 897 (portfolio.test.ts, under 900).
- Doc text coverage checked: DESIGN.md:149, :267, HELP.md:66, :68, :72 are the lines the change makes false, and the report gives each one. DESIGN.md:158 (the shell row) already names `state/workbench/navigation`, so it stays true. The findings wording in the proposed HELP/DESIGN text must follow the fix.
## 4. Behaviour
- The findings item shows the audit's open count and opens Audit. After the fix, the number a reader sees and the view it opens both change. The report's "Before and after" does not list the findings item at all.
- Do Not Disturb persists across reloads in `oculus.ui.v1` (`statusQuiet`). The ruling fixed per-browser persistence for the hidden items only. The report mentions this in a DONE row but not as a judgment call.
- Branch switch and push now go through a Confirm dialog before git runs (RepoItems.svelte:51-74). The DONE table says "after the confirm", but "Before and after" does not.
- Screenshots set against VS Code, row by row. 22 px bar with 12 px items: holds under all three themes. Left group: host (hostname), branch, findings, HPC, usage, server. Right group: Ln/Col, Tab Size, UTF-8, CRLF, Python, sessions, unsaved (disabled at 0), bell last. The sync item is absent in the served fixture (no upstream), as specified. The centre opens over the bar's right end with Clear All, Do Not Disturb, Hide and "No new notifications". Under mocha the stand-ins draw unbracketed: the caret item reads "| Ln 1, Col 1" and the branch "|- main", so the caret's "|" reads as a separator between items. This is cosmetic and not in the report.
## Not checked
- The toast timer being reset when a Toast's `notice` prop changes identity (Toast.svelte:21-25) was not exercised. Reading the code, only `markRead` remaps every notice, and it runs only when the centre opens, which settles every toast anyway.
- The look on the TEST page in Axel's Chrome (the orchestrator's look).
- Whether the builder's early scratchpad files overwrote orchestrator files of the same names (named in the report's Limitations).

Reviewer usage: not measured by a command (about 60k tokens in context), 75 tool uses, 56 minutes.
