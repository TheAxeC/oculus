Everything in the brief is done. Cases 8, 13, 14, 19 and 20 are the orchestrator's looks, and their state before and after is given below by reading. The step writes eleven files and one new fixture outside the brief's path list, each named under "Files outside the path list" with the reason.

# O195 report: no hub's settings in oculus's defaults

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:175-189`, read with `sed -n 175,189p`: the section "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)" holds no entry. Its closing line is: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## Cases: first run on the unchanged tree, then the run after the change

Cases 1 to 7, 11 and 15 ran in the scratch case program `.agents/scratch/cases.case.ts`, which is removed now. It ran through vitest with a scratch config, because `feeds.ts` imports a rune module that plain node cannot load. It built each set of offered tasks with `updateTasks` and `offeredTasks` from YAML rows over scratch hubs that hold `.oculus/tasks/<task>.md`. Each line gives the reader (`feed`), then the hub and task, then the days.

| Case | Unchanged tree (first run) | After the change |
| --- | --- | --- |
| 1, 40 days | `["litwatch h/litwatch days=40"]` | `["radar h/litwatch days=40"]` |
| 1, 20 days | `["litwatch h/litwatch days=20"]` (the shipped threshold 14) | `[]` |
| 2, 1 / 20 / 40 / 400 days | `[]` / `days=20` / `days=40` / `days=400` | `[]` at every age |
| 3, no meta.last_run | `["litwatch h/litwatch days=null"]` | `["radar h/litwatch days=null"]` |
| 4, never run / 8 days | `[]` / `["scout h/scout days=8"]` | `[]` / `["scout h/scout days=8"]` |
| 5, 2 then 5 | `["inbox a/inbox days=3"]` | `["inbox a/inbox days=3"]` |
| 5, none then 2 | `["inbox a/inbox days=3"]` | `["inbox b/inbox days=3"]` |
| 5, none then none | `["inbox a/inbox days=3"]` | `[]` |
| 6, -1 / 1.5 / soon | `{"rows":[{"task":"litwatch"}],"problems":[]}` | `{"rows":[],"problems":["update_tasks[0].stale_days: field"]}` |
| 6, 31 / 0 / absent | the row read, no field | `nudgeAfterDays` 31 / 0 / null |
| 7 | `findings: []` | `["settings.focus.refresh_stale_days: focus.refresh_stale_days is not an option; it is not applied"]` |
| 11 | `{"folder":"","files":{"site":"_data/website.yml",...}}`, website findings `[]` | `{"folder":"","files":{"site":"","cv":"","papers":"","industry":""}}`, website findings `[]` |
| 15 | scan: the seven shipped rules; projects `["a"]`; four "scan directory does not exist" findings | scan `[]`; projects `[]`; findings `[]` |

On the unchanged tree, the default thresholds were litwatch 14, inbox 2 and scout 7. That is why the 20-day row of case 1 nudged.

The problem kinds of case 6 are asserted by the rows of `hub-rows.test.ts`: `range` for -1, `whole` for 1.5 and `number` for soon. Those rows failed on the unchanged code (11 failed rows in `.agents/scratch/unchanged-new-tests.txt`: the rows had no `nudgeAfterDays` and the bad rows were read) and pass in the last round.

The other cases:

- **9.** `website-files.test.ts`, `website.test.ts`, `audit.test.ts`, `website-watch.test.ts`, `cv-fields.test.ts` and `paper-fields.test.ts` now set the four paths and the header in the fixture's own `website:` block. Each was run on the unchanged code with the new fixtures: audit 41 passed, website 25 passed, website-watch 1 passed, cv-fields 23 passed, paper-fields 18 passed. All of them pass in the last round.
- **10 and 12.** These are the changed G139 rows of `website-files.test.ts`. On the unchanged code, with the new rows, they failed (2 failed, 61 passed): expected four `''`, received `_data/website.yml` and the others. They pass after the change.
- **11.** A hub with no folder still gives no website finding: `publications()` returns early on an empty `website.folder` (the quoted run above).
- **13, by reading.** The tip reads `setting.files`. With the hub lines below written, the research hub sets the four paths and today's header. Without them, the tip says `The setting website.files.site is not set, so the website is not written.` This is the orchestrator's look.
- **14.** The demo hub's `scan:` lists the six folders of the shipped list that it holds. The tests that build over it (decks, deck-globs, the demo-copy tests) pass in the last round. `npm run docs:shots` was not run.
- **15.** The quoted run above.
- **16.** Every test hub that read projects through the shipped scan now sets its own (see "Scan fixtures"). The 18 files of that set pass on a scratch copy of the unchanged tree with the new fixtures laid over it (18 files, 333 passed), and in the last round. `orderHub` gives its five side-projects projects: `decks.test.ts` and `deck-globs.test.ts` pass.
- **17.** Quoted run of `loadConfig(engineDir())` after the change: shipped incoming `[[{"view":"inbox","pinned":true},{"view":"leads","pinned":true}],[{"view":"calendar","pinned":true}]]`. On the unchanged tree the first pane also held `{ view: linkedin, pinned: true }` (`sed -n '/^  incoming:/,/^  [a-z]/p'` of the base copy's layout.yml). `arrangements.test.ts` (G54) passes.
- **18.** Quoted run of a workspace file holding the hub line's `incoming` arrangement beside `docs`. The arrangements read are `docs,incoming,focus,projects,explorer,...`, and incoming's first pane is `[inbox, leads, linkedin]`, with findings `[]`.
- **19, by reading the write path.** `stale_days` is a number field with `min: 0`, `whole: true` and `empty: true`. A typed `-1` is refused by `numberProblem` (range) and `1.5` by `whole`. For a cleared box, `fromText` returns undefined for empty text on a number control, `withField` then removes the field from the row, and `writtenField` writes nothing for a blank. So the key comes off the row, and no change to the Settings write was needed. This is the orchestrator's look on a scratch hub.
- **20, by reading the unchanged tree.** In `detail-facts.ts:127-131`, `sessionFacts` gives title, cwd, branch, kind and so on, with no id row. After the change, `fact('id', t('sessions.f_id'), session.id)` stands right after the title fact. `session.id` is the `SessionRecord` id, the transcript's or rollout's id. This is the orchestrator's look.

## DONE / NOT DONE

| Item | State | Command and output as printed |
| --- | --- | --- |
| 1. The brief's test files and every file given a scan (35 files) | DONE | `nice -n 10 npx vitest run --maxWorkers 4 --reporter dot $(cat final.txt)`: ` Test Files  35 passed (35)` / `      Tests  701 passed \| 2 skipped (703)` / `vitest exit 0` |
| 2. prettier over the 48 changed files | DONE | `npx prettier --check $(cat changed.txt)`: `All matched files use Prettier code style!` / `prettier exit 0` |
| 2. eslint over the changed .ts and .svelte files | DONE | `npx eslint $(grep '\.ts$\|\.svelte$\|\.js$' changed.txt)`: no output, `eslint exit 0` |
| 3. ASCII gate of the rules file over the changed files of src, tests, config and docs | DONE | `LC_ALL=C perl -ne '...' $(grep "^src\|^tests\|^config\|^docs" changed.txt)`: prints nothing, `ascii exit 0` |
| 4. `npm run check` | DONE | `1795713907334 COMPLETED 4691 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 5. `sh utils/unused-exports.sh` against the base list | DONE | `diff`: `1c1` `< Unused exports (226)` `---` `> Unused exports (225)` `137d136` `< src/lib/state/feeds/feeds.ts: FEEDS, staleAfter`: one entry fewer and none new |
| 6. The greps | DONE | see "Greps" below |
| 7. Tests before and after | DONE | the cases table and the run counts below |
| 8. Sentence-form read of each new sentence | DONE | see "Doc and comment re-read" |
| `npm run diagrams` before the last round | DONE | `diagrams exit 0`; it rewrote `docs/diagrams/layers.dot`, `layers.svg`, `layer-state.dot` and `layer-state.svg` (one label each: "state to data" 585 to 583, from the two imports `feeds.ts` drops) |

Runs of a test list:

| Run | Tree | Files |
| --- | --- | --- |
| base-run | unchanged tree, the brief's list | 20 |
| single-file runs of the changed website and hub-rows tests on the unchanged code | unchanged code | 8 |
| after1 | changed tree, the census of 69 candidate files | 69 |
| after2 | the 15 red files of after1, after their scan fixes | 15 |
| after3 | manifests plus a wider census of 72 files | 73 |
| after4 | config-value.test.ts alone, after its fix | 1 |
| base-tree-run | scratch copy of the unchanged tree with the new scan fixtures | 18 (one earlier start ran no test: the copy lacked `config/options/local.yml`) |
| alone runs | debug-adapters, tasks, terminals-tmux, debug/channel; stopped before agent-pane at the coordinator's word | 4 |
| last round | changed tree | 35 |

- **Last round.** It ran once. After it, `npm run check` was red in `tests/routes/sessions/latex-approvals.test.ts` (5 type errors from the narrower type of `BASE_CHAT_CONFIG`), and unused-exports listed `numericSetting`. Both were fixed (`terminal-fixture.ts` types the value `Record<string, unknown>`, and `guards.ts` drops `numericSetting`, which nothing uses). prettier, eslint, the ASCII gate, `npm run check` and unused-exports were then rerun once; their lines in the table are from that rerun. No test file was red, so no vitest file ran again.
- **Whole-suite commands.** None ran (`npm run test:quick`, `npm test`, `npm run test:checks`, `npm run test:landing`, or `npx vitest run` with no file).
- **Load and TMPDIR.** The runs before the last round used `taskpolicy -b nice -n 19`, `--testTimeout 120000 --hookTimeout 240000` and `TMPDIR` set to `.agents/scratch/tmp`, under a load average of about 8. The last round ran with TMPDIR unset, at `nice -n 10`, with 4 workers.

Files the step does not change that were red in after3, each with its first error line (the landing's `npm run test:quick` runs them):

- `tests/server/machine/apps/tools/debug-adapters.test.ts`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/tasks.test.ts`: `Error: error connecting to /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O195/.agents/scratch/tmp/oculus-apptask-aXwdXa/server.sock (File name too long)`
- `tests/server/machine/apps/tools/terminals/terminals-tmux.test.ts`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/debug/channel.test.ts`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/pty/agent-pane.test.ts`: `Error: the processes could not be read: status`, then `error connecting to .../agent-paned6xwOq/server.sock (File name too long)`

## Files with line counts

Lines now, and lines added and removed against the base copy (`diff`; `git diff --numstat` for docs/templates.md):

| File | Lines | Change |
| --- | --- | --- |
| config/defaults/behavior.yml | 1041 | +7 -13 |
| config/defaults/layout.yml | 333 | +0 -1 |
| config/defaults/sources.yml | 139 | +4 -11 |
| config/options/behavior.yml | 2171 | +6 -22 |
| config/options/sources.yml | 275 | +9 -3 |
| config/text/server.yml | 647 | +1 -1 |
| config/text/views/academic/career.yml | 46 | +1 -0 |
| config/text/views/boards/focus.yml | 149 | +2 -2 |
| config/text/views/sessions/session-detail.yml | 45 | +1 -0 |
| config/text/views/system/workbench.yml | 322 | +1 -1 |
| docs/templates.md | 2230 | +16 -12 |
| docs/diagrams/layers.dot, layers.svg, layer-state.dot, layer-state.svg | | +1 -1 each (`npm run diagrams`) |
| src/lib/data/helpers/guards.ts | 107 | +0 -10 |
| src/lib/data/model/machine/model-tasks.ts | 40 | +5 -2 |
| src/lib/data/sources/config/settings/hub-rows.ts | 270 | +10 -4 |
| src/lib/server/machine/runs/schedules/task.ts | 229 | +1 -0 |
| src/lib/state/feeds/feeds.ts | 150 | +26 -37 |
| src/lib/state/sessions/source/website.svelte.ts | 236 | +7 -3 |
| src/lib/views/boards/focus/CommandCenter.svelte | 338 | +3 -5 |
| src/lib/views/shared/sessions/sections/details/detail-facts.ts | 270 | +1 -0 |
| tests/data/hubs/website-files.test.ts | 854 | +47 -24 |
| tests/data/hubs/workspace-findings.test.ts | 48 | +1 -1 |
| tests/data/snapshot/cluster-folder.test.ts | 77 | +2 -1 |
| tests/data/snapshot/reference-hub.ts | 392 | +3 -1 |
| tests/data/snapshot/relation-shapes.test.ts | 159 | +3 -3 |
| tests/data/snapshot/resources.test.ts | 101 | +2 -1 |
| tests/data/snapshot/schema-rules.test.ts | 817 | +6 -1 |
| tests/data/snapshot/tier-stage.test.ts | 62 | +2 -1 |
| tests/data/sources/config/catalog/options.test.ts | 312 | +1 -1 |
| tests/data/sources/config/layers/hub-vocab.test.ts | 551 | +2 -1 |
| tests/data/sources/config/settings/hub-rows.test.ts | 343 | +33 -0 |
| tests/data/sources/manifests/clones.test.ts | 247 | +7 -1 |
| tests/data/sources/manifests/manifests.test.ts | 782 | +7 -4 |
| tests/fixtures/hubs/deck-hub.ts | 434 | +17 -5 |
| tests/fixtures/hubs/demo/.oculus/config.yml | 51 | +11 -1 |
| tests/fixtures/hubs/demo/README.md | 7 | +1 -1 |
| tests/fixtures/hubs/hub-scan.ts (new) | 20 | +20 |
| tests/fixtures/hubs/website-hub.ts | 632 | +28 -13 |
| tests/routes/docs/audit.test.ts | 818 | +10 -10 |
| tests/routes/sessions/terminal-chat.test.ts | 372 | +12 -12 |
| tests/routes/sessions/terminal-fixture.ts | 387 | +10 -4 |
| tests/routes/sessions/website.test.ts | 504 | +22 -12 |
| tests/server/edit/config-value.test.ts | 530 | +5 -1 |
| tests/server/root/watch/deck-folders.test.ts | 453 | +13 -4 |
| tests/server/root/watch/website-watch.test.ts | 148 | +4 -1 |
| tests/state/forms/choices.test.ts | 213 | +3 -2 |
| tests/state/sessions/source/website-store.test.ts | 159 | +50 -24 |
| tests/state/system/schedule-lines.test.ts | 305 | +1 -0 |
| tests/state/workbench/navigation/notice-sources.test.ts | 67 | +1 -0 |

## Files outside the path list, each with the reason

- `config/text/views/academic/career.yml` (new key `website_no_path`) and `src/lib/state/sessions/source/website.svelte.ts` (`off()`). With empty paths, the Career tip would read "Write ,  and  ..." and the button would be on, and the server would then refuse the press. `off()` now returns `The setting {0} is not set, so the website is not written.` for the first empty path of `website.files`, in the order the server's refusal takes. This is the orchestrator's to reverse.
- `config/text/server.yml:105`. `not_task_name`'s example `such as litwatch` named the research hub's task; it now says `such as weekly-digest`.
- `src/lib/data/helpers/guards.ts`. `numericSetting` had no caller once `staleAfter` went (unused-exports listed it), so it is removed.
- `tests/fixtures/hubs/demo/README.md`. Its sentence on the demo `.oculus/config.yml` now names `scan:`.
- `tests/fixtures/hubs/hub-scan.ts` (new). It holds the scan rules the test hubs set as their own (`HUB_SCAN`, and `HUB_SCAN_LINES` for a settings file), which are the seven rules that shipped before. A test hub given them reads exactly the projects and findings it read before.
- `tests/server/edit/config-value.test.ts:474`. The stale-base row sent `base: []` as a base the merge does not give, and `[]` is now the merge. The base is `[{ dir: 'gone' }]`, and the assertion is unchanged.
- `docs/diagrams/*`. Rewritten by `npm run diagrams`.

## Scan fixtures: every test hub that read projects through the shipped scan

The set was found by running the census (after1, then after3 over a wider grep of test files that build a hub). The red files fixed:

- `tests/data/snapshot/cluster-folder.test.ts`, `relation-shapes.test.ts`, `resources.test.ts`, `schema-rules.test.ts` and `tier-stage.test.ts`: `portfolioConfigFrom({ ...LOADED, scan: HUB_SCAN })`. `relation-shapes`' planted hub file also starts with `HUB_SCAN_LINES`.
- `tests/data/snapshot/reference-hub.ts` (`CONFIG`), which `references.test.ts`, `rename.test.ts` and `tests/server/machine/lsp/adapters/hub-keys.test.ts` read.
- `tests/data/sources/config/layers/hub-vocab.test.ts`: the planted hub file starts with `HUB_SCAN_LINES`.
- `tests/data/sources/manifests/clones.test.ts`: `{ ...MERGED, scan: HUB_SCAN }`.
- `tests/data/sources/manifests/manifests.test.ts`:
  - `read()` takes `row.scan ?? HUB_SCAN`;
  - `joinedWith` reads `HUB_SCAN`;
  - the second hub of a row gets `HUB_SCAN_LINES`.
- `tests/state/forms/choices.test.ts`: `settings()` starts with `HUB_SCAN_LINES`.
- `tests/routes/sessions/terminal-fixture.ts` and `terminal-chat.test.ts`:
  - `BASE_CHAT_CONFIG` holds `scan: HUB_SCAN`;
  - `chatWorld` writes `HUB_SCAN_LINES` before each hub's settings;
  - the twelve `settings: '{}\n'` rows are `settings: ''`.
- `tests/server/root/watch/deck-folders.test.ts`: it replaces the demo copy's `scan:` block (a regex, with a throw when the block is missing) instead of appending a second `scan:` key, which the demo's new block would make a duplicate.
- `tests/fixtures/hubs/deck-hub.ts` (`orderHub`, `ORDER_SCAN` after `projects/ideas`) and `tests/data/hubs/workspace-findings.test.ts` (`scan:\n  - { dir: side-projects }\n`), as the brief names.

## Edits to existing assertions (diff against the base copy)

- `options.test.ts:230`:
  - `-        expect(groups['behavior.yml']).toHaveProperty(['focus.refresh_stale_days']);`
  - `+        expect(groups['behavior.yml']).toHaveProperty(['website.files']);`
- `website-files.test.ts`, the header row: the literal `"# Generated by oculus from the research hub. ..."` becomes `` `# ${HEADER}` `` (the fixture's own constant).
- `website-files.test.ts`, case 10: `toEqual(SHIPPED)` twice becomes `toEqual(none)` twice, plus `expect(badPaths(site, read.files).at(0)).toEqual({ key: 'website.files.site', value: '' })`.
- `website-files.test.ts`, case 12: `{ ...SHIPPED, cv: 'data/cv.yml' }` becomes `{ site: '', cv: 'data/cv.yml', papers: '', industry: '' }`.
- `website-files.test.ts`, the other rows: `SHIPPED` becomes `PATHS` (`siteFiles('', PATHS)`), and the literal `'_data/website.yml'` becomes `SITE_PATH`. There is one new row, 'a hub that sets the four paths of website.files reads them' (`toEqual(PATHS)`).
- `website.test.ts`: `toEqual(['_data/publications.yml'])` becomes `toEqual([PAPERS_PATH])`.
- `hub-rows.test.ts`: the `row()` helper and two literal rows gain `nudgeAfterDays: null`. Five new rows: 31, 0, `range`, `whole`, `number`.
- `website-store.test.ts`:
  - The TIPS row 'the shipped paths and no command' is removed, since no paths ship. The no-command tip is still asserted by 'a path of website.files.cv and no command'.
  - The UNSAVED row 'a shipped path' is renamed 'a path of the four the hub sets'.
  - New `it('is the sentence of the first empty path while website.files sets none or leaves one empty')`, asserting `t('career.website_no_path', 'website.files.site')` for `off()` and `tip()`, and `website.files.papers` for `{ papers: '' }`.
- `schedule-lines.test.ts` and `notice-sources.test.ts`: the HubTask literals gain `nudgeAfterDays: null`.

## Changed G139 rows: new titles

- 'a hub that sets no website.files reads four empty paths, and Write the website and the audit stop at the first, naming it' (case 10)
- 'a hub that sets one key of website.files reads it, and the others empty' (case 12)
- 'a hub that sets the four paths of website.files reads them' (new)
- The WATCHED row 'the four shipped paths' is now 'the four paths the hub sets'.

## Judgment calls

- **The inbox line.** It belongs to the first offered inbox task that sets `stale_days`, and uses that task's value (brief decision 7). In case 5's "none then 2" row, the line moves from hub a's task to hub b's.
- **`RefreshItem.feed`.** It is typed `LastRun` (`radar`, `scout` or `inbox`). The strip's row id becomes `refresh:radar:<n>`. That id is an index of the view only and is never stored (`git grep "refresh:" -- src` finds no other reader).
- **`HUB_SCAN`.** It is one shared fixture rather than one copied list per test, so every test hub that read the shipped rules reads the same rules, in one place.
- **The website-store fix.** It is a change to the product, made so that no test asserts the "Write ,  and" tip. It is named above for the orchestrator to keep or reverse.

## Visible changes, before and after, for the look

- **Focus refresh strip (CommandCenter).**
  - Before: rows from `focus.refresh_stale_days` (litwatch 14, inbox 2, scout 7, the research hub's workspace litwatch 31), each line labelled with the key `refresh_litwatch_plain`.
  - After: rows from each task's `stale_days`, labelled with `refresh_radar_plain`, whose text is the same, `'{0}: {1} | run {0} from the Update tray'`.
  - With the hub lines written (31, 7, 2), the research hub shows the same lines as before (case 8). Without them it shows none.
- **Settings view, `update_tasks` row form.** It gains a `stale_days` number box. The Thresholds and horizons section of Boards loses its three `refresh_stale_days` entries, and the `focus` group text no longer mentions feeds.
- **Career view, Write the website.**
  - Before: the tip named the shipped paths, whatever the hub set.
  - After: with any path of `website.files` empty, the button is off, with `The setting website.files.<key> is not set, so the website is not written.`
  - With the hub lines written, the tip and the file header are as today (case 13).
- **Incoming page.**
  - Before: the first pane held Inbox, Position Leads and LinkedIn.
  - After: Inbox and Position Leads, with Calendar in the second pane.
  - With the hub line, the research hub keeps LinkedIn (cases 17 and 18).
- **Projects.** A hub with no `scan:` has no projects. The research hub sets its own `scan:` (config.yml:7-21), so nothing changes for it. The demo hub now sets six rules (case 14, `npm run docs:shots` at the look).
- **Sessions, Details, Session group (case 20).**
  - Before: title, folder, branch, kind, and the rest.
  - After: title, then `id` with the session's id (for the transcript `be0ac0d7-a551-4911-a072-9f76e1bbe399.jsonl`, the value `be0ac0d7-a551-4911-a072-9f76e1bbe399`), then folder and the rest. This applies on the Sessions view's Details and on a Session tab.

## Hub lines

### `~/workspace/research-hub/.oculus/config.yml`

Current, as `grep -n` prints them:

```
29:# The update tasks the update tray offers for this hub, in the tray's order: a row's task names its file, .oculus/tasks/<task>.md, its label and note are what the tray's row shows, its view is the view a notice of its run opens, and last_run says where the tray reads its last run from.
31:  - { task: litwatch, label: Lit Watch, note: "new-paper radar (web | minutes)", view: radar, last_run: radar }
32:  - { task: scout, label: Scout, note: "academic openings (web | minutes)", view: leads, last_run: scout }
34:  - { task: inbox, label: Inbox, note: Gmail triage over the private mailbox, view: inbox, last_run: inbox }
141:  cv: python _scripts/cv_pdf_generator.py --save --quiet
```

Replacements:

```
# The update tasks the update tray offers for this hub, in the tray's order: a row's task names its file, .oculus/tasks/<task>.md, its label and note are what the tray's row shows, its view is the view a notice of its run opens, last_run says where the tray reads its last run from, and stale_days how many days after that run the Focus board's refresh strip nudges to run it again.
  - { task: litwatch, label: Lit Watch, note: "new-paper radar (web | minutes)", view: radar, last_run: radar, stale_days: 31 }
  - { task: scout, label: Scout, note: "academic openings (web | minutes)", view: leads, last_run: scout, stale_days: 7 }
  - { task: inbox, label: Inbox, note: Gmail triage over the private mailbox, view: inbox, last_run: inbox, stale_days: 2 }
```

Line 33 (linkedin) stays as it is. After line 141, inside `website:`, add:

```
  file_header: "Generated by oculus from the research hub. Change the hub's files and write the website again."
  files:
    site: _data/website.yml
    cv: _data/data.yml
    papers: _data/publications.yml
    industry: _data/industry.yml
```

At the end of the website comment at line 67, add: "`file_header` is the comment line each written file opens with, and `files` the website's four files, each a path relative to its folder."

The values 31, 7 and 2 are what the hub reads today. A run of `loadConfig` on the unchanged tree over a workspace whose `settings:` holds `focus: { refresh_stale_days: { litwatch: 31 } }` gave `{"litwatch":31,"inbox":2,"scout":7}`, findings `[]`.

### `~/workspace/research-hub/.oculus/workspaces/research-hub.yml`

Current, as `grep -n` prints them:

```
62:  focus:
63:    refresh_stale_days: { litwatch: 31 }
```

Remove lines 62 and 63. After line 61 (the last row of `arrangements.docs`), add:

```
    # The Incoming page: Inbox, Position Leads and LinkedIn in the first pane, Calendar in the second.
    incoming:
      root:
        kind: split
        dir: row
        sizes: [0.6, 0.4]
        children:
          - kind: pane
            view:
              - { view: inbox, pinned: true }
              - { view: leads, pinned: true }
              - { view: linkedin, pinned: true }
          - kind: pane
            view:
              - { view: calendar, pinned: true }
```

`grep -rn "refresh_stale_days\|incoming:" workspaces/` finds no other workspace file that sets these keys.

## Greps (verify item 6)

- **6a, over src, config, docs and README.md.** `git grep -n "refresh_stale_days\|staleAfter\|_data/website.yml\|_data/data.yml\|_data/publications.yml\|_data/industry.yml\|from the research hub" -- src config docs README.md ':!config/local.yml'` prints nothing (exit 1).
- **6a, over tests.** It prints only lines where a test or fixture sets its own hub's values:
  - `website-hub.ts:32,35,38,41,53`;
  - `audit.test.ts:386-389`;
  - `website.test.ts:60,63,66,69`;
  - `website-watch.test.ts:36,39`;
  - `website-store.test.ts:26-29`, and `:74`, `:81`, `:131`, which are the expected tip arguments and held path built from that test's own paths.
- **6b, litwatch.** `git grep -n "litwatch" -- src config/defaults config/options config/text ':!config/local.yml'` prints only glyph lines: `config/text/views/boards/focus.yml:66 radar_glyph: litwatch`, `config/text/views/feeds/radar.yml:27 radar_glyph: litwatch`, `LiteratureCard.svelte:117,120,125,128,187,195`, and `Radar.svelte:146,201`.
- **6c, project folders.** The folder grep prints the commented example `docs/templates.md:48-54` and these lines that are no default:
  - `config/options/behavior.yml:66` (the help's example path `projects/archive/published`);
  - `docs/templates.md:59` (the `new_project_dir` example);
  - `docs/templates.md:418` (the folder conventions example);
  - `docs/templates.md:1058` (a task prompt's example);
  - `src/lib/data/model/model-entities.ts:75,98` (doc examples);
  - `src/lib/server/git/clone/exclude.ts:8` (a comment's example).
- **6d.** `sed -n '/^  incoming:/,/^  [a-z]/p' config/defaults/layout.yml | grep -c linkedin` prints `0`.

## History-word grep and name-change grep

- **History words.** A grep of the lines this step adds (`diff -ru` against the base copy over src, tests, config and docs) for was, were, used to, no longer, anymore, previously, formerly, now, renamed, replaced, removed, before, old, legacy, step names and reverted gives four hits, none of them history:
  - `now`, the parameter of `refresh`;
  - "stops before it is sent";
  - "how long before a manifest counts as stale";
  - "the Command Center's".

  The added test titles were read: 'not the one at the path it replaces' names the setting's path, not an earlier form.
- **Name changes.** `git grep -n "litwatch_glyph\|refresh_litwatch_plain\|FEEDS\b\|staleAfter\|numericSetting" -- src tests config ':!config/local.yml'` finds no `litwatch_glyph`, `refresh_litwatch_plain`, `staleAfter` or `numericSetting`. Its `FEEDS` hits are other constants of the same word: `hub-rows.ts:36` (the feed registries `leads` and `radar`), `PAGE_FEEDS` of `page-entry.ts` and `palette.ts`, `NO_FEEDS` of the entity fixtures, and a local `FEEDS` of `page-entry.test.ts`. None of them is the removed export of `feeds.ts`.

## Doc and comment re-read

Each new sentence was read in its file:

- `config/defaults/sources.yml`: the head comment, the `scan:` comment and the `update_tasks` comment.
- `config/defaults/behavior.yml`: the head comment and the website comment.
- `config/options/sources.yml`: the `scan` help, the `update_tasks` help, the `last_run` help and the new `stale_days` help.
- `config/options/behavior.yml`: the four path helps, `file_header`, and the `focus` group line.
- `config/text/views/system/workbench.yml` `desc_behavior`.
- `docs/templates.md`: scan, `update_tasks` and website.
- The doc comments of `feeds.ts` (`RefreshItem`, `refresh`), `hub-rows.ts`, `model-tasks.ts` and the head comment of `website.svelte.ts`.
- The demo config and README; `hub-scan.ts`; `deck-hub.ts`; `deck-folders.test.ts`; `terminal-fixture.ts`; `choices.test.ts`; `reference-hub.ts`; `schema-rules.test.ts`.

`docs/HELP.md:104` ("the nudges to refresh a stale feed") and `docs/data-map.md:132` and `:67` stay true and were left as they are.

## Anything in the brief that was wrong

- **The path list was short.** The change needs the files under "Files outside the path list".
- **The scan census.** The brief names the scan-reading test hubs only as a class, and that class turned out to be 18 files. Among them, `deck-folders.test.ts` appended a second `scan:` key to a demo copy, which the demo's new `scan:` makes a duplicate key.
- **config-value.test.ts.** Its stale-base row used the shipped `[]` as a base the merge does not give, and that is no longer true.

Nothing else in the brief was found wrong.
