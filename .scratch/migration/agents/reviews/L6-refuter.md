# Step L6 refuter report (on .agents/worktrees/L6, base 90c55cd2)

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

## Repair round 1, refuted

```
ls -d $TMPDIR/oculus-* | wc -l   (before)                         7015
npx vitest run --reporter=dot                                      Test Files  296 passed (296) / Tests  4709 passed (4709)
npm run check                                                      COMPLETED 1359 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run build                                                      build=0
npm run format:check                                               All matched files use Prettier code style!
npm run lint                                                       lint=0
LC_ALL=C grep -rna '[^ -~]' src tests | wc -l                      0
spec.md perl ASCII gate over src tests bin config | wc -l          0
sh bin/size-check.sh ; sh bin/folder-check.sh                      size=0 ; folder=0
npx playwright test (whole suite, 8792 free)                       373 passed (7.3m); the one "✘" line is files-forms.spec.ts:631, a test.fail() case counted as passed
node bin/revert-check.mjs status.test.ts notice-sources.test.ts status-bar.test.ts
                                                                   41 reverts, 0 unproven, 0 unchecked (status.test 14 red, notice-sources 15 red incl. the idle case's :46 and :189, status-bar 12 red incl. glyphs.yml:157 and :40)
node bin/revert-check.mjs tests/browser/shell/settings.spec.ts     10 reverts, 0 unproven, 0 unchecked (StatusBar.svelte:110, +page.svelte:119, status.ts:199 all red)
Own Playwright look (scratch config, 1400x700, mocha, source tab over a CRLF+tab .py):
  ITEMS host "[h] YQ530VVFGK", branch "[Y] main", findings "/!\ 5", hpc "[:] 1 running, 1 pending", usage "(%) down", server "(s) up" | caret "[I] Ln 1, Col 1", indent ">> Tab Size: 4", encoding "[u] UTF-8", line_ending "<- CRLF", language "{} Python", sessions "[R] 0", unsaved "[s] 0", bell "(n)"
  FINDINGS item 5, Findings view rows 5, aria-label "5 findings"; the click opens the Findings tab (screenshot findings-mocha.png)
ls -d $TMPDIR/oculus-* | wc -l   (after)                          7015

Report's quoted evidence, compared:
  "Tests 4709 passed (4709)"                         reproduced
  "COMPLETED 1359 FILES 0 ERRORS 0 WARNINGS"         reproduced
  "373 passed (7.7m)"                                373 passed (7.3m), reproduced
  "settings.spec 10 reverts, 0 unproven, 0 unchecked" reproduced
  "status.test 14 reverts, 0 unproven, 0 unchecked"  reproduced (14 status.test lines inside the 41 batch)
  "41-revert batch" over notice-sources, status-bar, status.test   reproduced, now with no non-red line
  "7015 before, 7015 after"                          reproduced
  "status.ts 252 to 265 lines"                       wc -l prints 264
  "notice-sources.ts 233 to 252 lines"               wc -l prints 252
```

### Spec
- None. Ruling 1: `findingsCount` (status.ts:195-200) wired at +page.svelte:119, StatusBar.svelte:110 opens `findings`, words `'{0} findings'` / `'... Open Findings.'`, `item_findings: Findings`; no "audit" left in `src/lib/shell/status`, `state/workbench/navigation` or statusbar.yml (grep). Ruling 2: `waitOf` (notice-sources.ts:44-47) posts both hooks with `notice_permission` / `notice_idle`; `waitsOnReader` is unchanged, and `waitingCount` still counts 1 of a permission+idle pair (the case asserts it). Ruling 3: caret `[I]`, and every new stand-in carries no `|`. Ruling 4: the report's "Before and after" now names the findings item, Do Not Disturb across reloads, the confirm and `:language`.
- config/catalogs/glyphs.yml:40 (`branch: "|-"` to `"[Y]"`): the change reaches past the bar. The only other users are `Branches.svelte:72` (each branch row of the Repositories view) and `:95` (the new-branch row), found by grep. The reach is needed: `status-bar RepoItems.svelte:36` uses the same `branch` glyph, and icon mode draws `git-branch` for both (icons.yml:39). A bar-only glyph would give one concept two stand-ins. The Repositories rows change from `|-` to `[Y]` only under terminal themes, and nothing in tests asserts `|-` (grep). The report states the change as judgment call 7.

### Proof
- None. No check was removed. settings.spec swaps the Audit tab assertion for the Findings tab and adds a directive, and the waiting-predicate case keeps the `auth_success`/null rows and the count assertion. The new browser case compares the item to the row count and is red under the wiring revert. In the served demo all 5 findings come from the config channel (screenshot), so the browser case cannot see the snapshot half. The node case `findingsCount({ findings: [1, 2] }, { findings: [3] }) === 3` covers that half.

### Standards
- None. The round's lines over 100 columns are revert directives and test-name strings that Prettier keeps; no src or comment line exceeds 100. `notice_input` has no remaining reader or key (grep). The new test resets `setGlyphMode('icon')` in `finally`, as tests/ui/theme.test.ts and tests/ui/controls/glyph.test.ts do.

### Behaviour
- tools/oculus/.scratch/migration/agents/reviews/L6-report.md, round "Before and after": the branch stand-in's reach into the Repositories view (branch rows and the new-branch row show `[Y]` instead of `|-` under mocha and the other terminal themes) is stated in item 3 and judgment call 7 but not in the before-and-after list the TEST-page look is read against. That list names only the bar's `[Y]`.
- Mocha bar screenshot (bar-mocha.png): no item reads as a separator. `[I] Ln 1, Col 1` and `[Y] main` are bracketed like `[h]`, `[u]` and `[R]`.
- Pre-existing from the first run, not changed by this round, noted only: `server: "(s)"` duplicates `timing: "(s)"`, `behind: "v"` duplicates `disclosure`, `indent: ">>"` duplicates `goto`, and `clear_all: "[c]"` duplicates `copy` in glyphs.yml.

### Not checked
- The Repositories view under a terminal theme on screen (read from Branches.svelte:72/:95 only).
- The screenshots under vscode-dark-modern and light, and with the centre open (only mocha with a source tab was taken this run).
- The look on the TEST page in Axel's Chrome (the orchestrator's).
- The claim that tests/checks/diagrams failed before `bin/diagrams.mjs` was rerun. The regenerated channels.dot adds a solid `"ch portfolio" -> "routes/+page"` beside the dashed one. That is the generator's output, and the diagrams check passes in the vitest run above.

Reviewer usage: not measured by a command (about 75k tokens in context), 25 tool uses, 19 minutes.

## Closed

The first run's findings, closed in repair round 1 (`agents/reviews/L6-report.md`, "# Repair round 1"):

- Spec 1, Proof 1 and Behaviour 1, the findings item counting the audit and opening Audit: it counts the Findings view's own list and opens Findings (`findingsCount`, status.ts:195-200), with a node case and a browser case red under the wiring's revert; the brief's premise, which cited the audit's count, was corrected before the round.
- Spec, the full-width bar: kept; it follows the plan line's "drawn like VS Code's", and the landing report puts it to Axel.
- Spec, idle prompts not posted: the brief had narrowed Axel's ruling; the brief now asks for both hooks, and both post, each in its own words (`waitOf`, notice-sources.ts:44-47), `waitingCount` and the title unchanged.
- Spec, `:language`, and Behaviour, Do Not Disturb across reloads and the confirm before a branch switch or push: stated as judgment calls and in the before and after.
- Behaviour, the caret's `|` under mocha: `[I]`, and the branch `[Y]`; a case fails on any status stand-in holding `|` or made of strokes only.

The run over repair round 1, closed at landing on 2026-09-24:

- Spec, the branch stand-in reaching the Repositories view's branch rows: needed, since the bar and the view draw one glyph for one concept; stated here and in the landing report's before and after.
- Behaviour, that reach missing from the round's before-and-after list: carried into the landing report.
- Behaviour, four new stand-ins that repeat older ones (`server` and `timing` `(s)`, `behind` and `disclosure` `v`, `indent` and `goto` `>>`, `clear_all` and `copy` `[c]`): no change; the vocabulary already holds 32 such repeated groups, and no rule or check asks a stand-in to be unique.
