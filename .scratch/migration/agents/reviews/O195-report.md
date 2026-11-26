Everything in the brief and in repair round 1 is done. Cases 8, 13, 14, 17 to 20 are the orchestrator's looks, and their state before and after is given below by reading. The step writes eleven files outside the brief's path list, each named under "Files outside the path list" with the reason.

# O195 report: no hub's settings in oculus's defaults

## Open items of the state file, verbatim

`~/workspace/oculus/.scratch/migration/orchestrator-state.md:186`, read with `awk '/^## Open items/{p=1} /^## Closed items/{p=0} p'` at the moment of writing: the section "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)" holds no entry. Its closing line is: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## Repair round 1, item by item

| Item | State | Proof |
| --- | --- | --- |
| 1 (S1). `HUB_SCAN` and `HUB_SCAN_LINES` moved into `tests/fixtures/hubs/hub-build.ts`, `hub-scan.ts` deleted with `rm`, every import changed | DONE | `grep -rn "hub-scan" src tests config docs utils README.md --exclude=local.yml` prints nothing, `grep exit 1`; `ls tests/fixtures/hubs \| wc -l` prints `10`; `tests/checks/tree/size.test.ts` passes in the last round |
| 2 (P4). `HUB_SCAN` frozen, the array and each rule | DONE | `hub-build.ts:52-62`, `Object.freeze([...].map((rule: ScanRule) => Object.freeze(rule)))`, typed `readonly Readonly<ScanRule>[]`; `npm run check`: `COMPLETED 4690 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. No reader needed a copy: every reader passes it into a `Record<string, unknown>` (`portfolioConfigFrom(merged: Record<string, unknown>)`, `src/lib/data/index.ts:180-181`; `BASE_CHAT_CONFIG: Record<string, unknown>`, `terminal-fixture.ts:124`; `Row.scan?: unknown[]` with `row.scan ?? HUB_SCAN`, `manifests.test.ts:87`, `:616`). A write to a frozen object throws in an ES module, and the 36 files of the last round, which hold all eleven importers, pass |
| 3 (S2). The five comments rewrapped as whole paragraphs at 100 columns | DONE | `website.svelte.ts:6-16`, `choices.test.ts:66-69` (now a three-line doc comment), `feeds.ts:90-96`, `deck-folders.test.ts:82-85`, `terminal-fixture.ts:252-256`. A scan of the step's added comment lines (`git diff -U0 -- src tests`, lines over 100 columns) prints nothing; a scan for an added comment line under 80 columns, not ending in `.`, `:` or `;`, followed by another comment line of the same paragraph prints nothing |
| 4 (P1). The failing line on the unchanged tree of each added or changed test | DONE | "Failing lines on the unchanged tree" below |
| 5. Nothing else in the code changes | DONE | The round's changes are `hub-build.ts`, the deleted `hub-scan.ts`, eleven import lines, and the five comments; `website.svelte.ts` `off()` and `career.website_no_path` are as built |

## Failing lines on the unchanged tree (P1)

A copy of the base (`../migration-O195-base/`: src, tests, utils, config, which has no `config/local.yml`) was made at `.agents/scratch/base-tree/` with `package.json`, `vite.config.ts`, `tsconfig.json` and a `node_modules` symlink to the worktree's (the worktree has no `svelte.config.js`, so none was copied). The step's current `hub-rows.test.ts`, `website-files.test.ts`, `website-store.test.ts` and `tests/fixtures/hubs/website-hub.ts` were laid over it; `diff -rq` against the base then listed those four files and nothing else. The three test files ran there once: `unset TMPDIR; nice -n 10 npx vitest run --maxWorkers 4 --reporter verbose <the three>` gave `vitest exit 1`, ` Test Files  3 failed (3)`, `      Tests  14 failed | 99 passed (113)`. The copy was removed after.

`tests/data/sources/config/settings/hub-rows.test.ts`, describe 'updateTasks'. Every failure is at `hub-rows.test.ts:247`, `expect(read(value)).toStrictEqual({ value: rows, problems });`.

| Row | New or changed | Unchanged tree |
| --- | --- | --- |
| 'no key', 'a row with no last_run', 'a row with a last_run', 'two rows, read in their order', 'a task an earlier row took', 'a number' | changed (`nudgeAfterDays: null` in the expected rows) | fail: `AssertionError: expected { <ellipsis>(2) } to strictly equal { <ellipsis>(2) }`, the diff line `-       "nudgeAfterDays": null,` |
| 'a row with stale_days 31' | new | fail, the diff line `-       "nudgeAfterDays": 31,` |
| 'a row with stale_days 0' | new | fail, the diff line `-       "nudgeAfterDays": 0,` |
| 'a stale_days below 0' | new | fail: `AssertionError: expected { <ellipsis>(2) } to strictly equal { value: [], <ellipsis>(1) }`, expected `-     "update_tasks[0].stale_days: range",` and the row read: `+   "problems": [],` |
| 'a stale_days that is no whole number' | new | fail, expected `-     "update_tasks[0].stale_days: whole",`, received `+   "problems": [],` |
| 'a stale_days that is no number' | new | fail, expected `-     "update_tasks[0].stale_days: number",`, received `+   "problems": [],` |

The other rows of the describe ('an empty label', 'an empty note', 'an empty view', 'a last_run outside the four', 'an empty task', 'a task that climbs out', 'a task with a capital') expect no row, so they hold no `nudgeAfterDays` and are unchanged; they pass there.

`tests/data/hubs/website-files.test.ts`, describe 'the website files the hub gives':

| Row | New or changed | Unchanged tree |
| --- | --- | --- |
| 'a hub that sets no website.files reads four empty paths, and Write the website and the audit stop at the first, naming it' (case 10) | changed | fail at `website-files.test.ts:253`, `expect(websiteSettings(loadConfig(engineDir()).config).files).toEqual(none);`: `AssertionError: expected { site: '_data/website.yml', <ellipsis>(3) } to deeply equal { site: '', cv: '', papers: '', <ellipsis>(1) }` |
| 'a hub that sets one key of website.files reads it, and the others empty' (case 12) | changed | fail at `website-files.test.ts:270`, `expect(websiteSettings(loadConfig(engineDir(), { hub }).config).files).toEqual({`: `AssertionError: expected { site: '_data/website.yml', <ellipsis>(3) } to deeply equal { site: '', cv: 'data/cv.yml', <ellipsis>(2) }` |
| 'a hub that sets the four paths of website.files reads them' | new | passes: a test of preserved behaviour (a hub that sets its own four paths reads them) |
| 'each of the three files opens with the comment line saying it is generated' (`HEADER` in place of the literal), 'the files are named by the paths of website.files, in the order a write takes them' (`PATHS`), "a research line the website's file lacks is a finding naming the manifest and the word" (`SITE_PATH`), the WATCHED rows of 'the files the audit reads and the watcher hears' and 'are none while the setting names no folder' (`PATHS`) | changed (constants of the fixture) | pass: tests of preserved behaviour |

`tests/state/sessions/source/website-store.test.ts`:

| Row | New or changed | Unchanged tree |
| --- | --- | --- |
| 'the tip of Write the website' > 'is the sentence of the first empty path while website.files sets none or leaves one empty' | new | fail at `website-store.test.ts:96`, `expect(none.off()).toBe(t('career.website_no_path', 'website.files.site'));`: `Error: text key not in the text catalog (config/text/): career.website_no_path`. The throw comes from the expected value, since the base catalog lacks the key; the base `off()` (`../migration-O195-base/src/lib/state/sessions/source/website.svelte.ts:122-132`) has no check of `website.files` and returns null for such a hub |
| TIPS 'a path of website.files.cv and no command', 'a path of website.files.papers and a command' | changed (the paths given by `files` and `settingsOf`) | pass: tests of preserved behaviour |
| UNSAVED 'a path of the four the hub sets' (renamed from 'a shipped path'), 'a path website.files.papers names', 'a path written with a dot segment' | changed (the paths given by `files`) | pass: tests of preserved behaviour |

## Cases: first run on the unchanged tree, then the run after the change

Cases 1 to 7, 11 and 15 ran in the first build's scratch case program `.agents/scratch/cases.case.ts`, which is removed. It ran through vitest with a scratch config, because `feeds.ts` imports a rune module that plain node cannot load. It built each set of offered tasks with `updateTasks` and `offeredTasks` from YAML rows over scratch hubs that hold `.oculus/tasks/<task>.md`. Each line gives the reader (`feed`), then the hub and task, then the days.

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
| 6, -1 / 1.5 / soon | the row read, no problem | no row, and the problem `update_tasks[0].stale_days: range` / `update_tasks[0].stale_days: whole` / `update_tasks[0].stale_days: number`, as the rows 'a stale_days below 0', 'a stale_days that is no whole number' and 'a stale_days that is no number' of `hub-rows.test.ts` assert |
| 6, 31 / 0 / absent | the row read, no field | `nudgeAfterDays` 31 / 0 / null |
| 7 | `findings: []` | `["settings.focus.refresh_stale_days: focus.refresh_stale_days is not an option; it is not applied"]` |
| 11 | `{"folder":"","files":{"site":"_data/website.yml",...}}`, website findings `[]` | `{"folder":"","files":{"site":"","cv":"","papers":"","industry":""}}`, website findings `[]` |
| 15 | scan: the seven shipped rules; projects `["a"]`; four "scan directory does not exist" findings | scan `[]`; projects `[]`; findings `[]` |

On the unchanged tree, the default thresholds were litwatch 14, inbox 2 and scout 7. That is why the 20-day row of case 1 nudged. The rows of case 6 fail on the unchanged tree with the lines quoted under "Failing lines on the unchanged tree" and pass in the last round.

The other cases:

- **9.** `website-files.test.ts`, `website.test.ts`, `audit.test.ts`, `website-watch.test.ts`, `cv-fields.test.ts` and `paper-fields.test.ts` set the four paths and the header in the fixture's own `website:` block. Each was run on the unchanged code with the new fixtures in the first build: audit 41 passed, website 25 passed, website-watch 1 passed, cv-fields 23 passed, paper-fields 18 passed. All of them pass in the last round.
- **10 and 12.** The changed G139 rows of `website-files.test.ts`; their failing lines on the unchanged tree are quoted above. They pass in the last round.
- **11.** A hub with no folder gives no website finding: `publications()` returns early on an empty `website.folder` (`publications.ts:81`, the quoted run above).
- **13, by reading.** The tip reads `setting.files`. With the hub lines below written, the research hub sets the four paths and today's header. Without them, the tip says `The setting website.files.site is not set, so the website is not written.` This is the orchestrator's look.
- **14.** The demo hub's `scan:` lists the six folders of the shipped list that it holds. The tests that build over it (decks, deck-globs, the demo-copy tests) pass in the last round. `npm run docs:shots` was not run.
- **15.** The quoted run above.
- **16.** Every test hub that read projects through the shipped scan sets its own (see "Scan fixtures"). The 18 files of that set passed in the first build on a scratch copy of the unchanged tree with the new fixtures laid over it (18 files, 333 passed), and pass in the last round. `orderHub` gives its five side-projects projects: `decks.test.ts` and `deck-globs.test.ts` pass.
- **17.** Quoted run of `loadConfig(engineDir())` after the change: shipped incoming `[[{"view":"inbox","pinned":true},{"view":"leads","pinned":true}],[{"view":"calendar","pinned":true}]]`. On the unchanged tree the first pane also held `{ view: linkedin, pinned: true }`. `sed -n '/^  incoming:/,/^  [a-z]/p' config/defaults/layout.yml | grep -c linkedin` prints `0`. `arrangements.test.ts` (G54) passes.
- **18.** Quoted run of a workspace file holding the hub line's `incoming` arrangement beside `docs`: the arrangements read are `docs,incoming,focus,projects,explorer,...`, and incoming's first pane is `[inbox, leads, linkedin]`, with findings `[]`.
- **19, by reading the write path.** `stale_days` is a number field with `min: 0`, `whole: true` and `empty: true` (`config/options/sources.yml:179-184`). A typed `-1` is refused by `numberProblem` (range) and `1.5` by `whole`. For a cleared box, `fromText` returns undefined for empty text on a number control, `withField` then removes the field from the row, and `writtenField` writes nothing for a blank. So the key comes off the row, and no change to the Settings write was needed. This is the orchestrator's look on a scratch hub.
- **20, by reading.** On the unchanged tree `sessionFacts` gives title, cwd, branch, kind and so on, with no id row. After the change `fact('id', t('sessions.f_id'), session.id)` stands right after the title fact (`detail-facts.ts:130`). `session.id` is the `SessionRecord` id, the transcript's or rollout's id. This is the orchestrator's look.

## DONE / NOT DONE

| Item | State | Command and output as printed |
| --- | --- | --- |
| 1. The review's 35 test files plus `tests/checks/tree/size.test.ts` (36 files) | DONE | `unset TMPDIR; nice -n 10 npx vitest run --maxWorkers 4 --reporter dot <36 files>`: `vitest exit 0`, ` Test Files  36 passed (36)`, `      Tests  711 passed \| 2 skipped (713)` |
| 2. prettier over the 48 changed files (src, tests, config, docs/templates.md; the four diagram files have no parser) | DONE | `nice -n 10 npx prettier --check <48 files>`: `Checking formatting...`, `All matched files use Prettier code style!` (the exit status was not captured: the command piped into `tail` under zsh) |
| 2. eslint over the 35 changed .ts and .svelte files | DONE | `nice -n 10 npx eslint <35 files>`: no output, `eslint exit 0` |
| 3. ASCII gate of the rules file over the 48 changed files, and the plain form over the four diagram files | DONE | `LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' <48 files>`: prints nothing, `ascii exit 0`; over `docs/diagrams/*.svg` and `*.dot`: prints nothing, `diagrams ascii exit 0` |
| 4. `npm run check` | DONE | `check exit 0`, `1795715580329 COMPLETED 4690 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 5. `sh utils/unused-exports.sh` against the base list | DONE | `diff ../migration-O195-base/unused-exports.txt <the new list>`: `1c1`, `< Unused exports (226)`, `---`, `> Unused exports (225)`, `137d136`, `< src/lib/state/feeds/feeds.ts: FEEDS, staleAfter`. The step adds no line |
| Folder rule | DONE | `sh utils/tree/folder-check.sh`: `folder-check exit 0`; it counts tracked items (`git ls-files`), so the count of `tests/fixtures/hubs/` is also taken by `ls tests/fixtures/hubs \| wc -l`: `10` |
| 6. The greps | DONE | see "Greps" below, run after the round's last change |
| 7. Tests before and after | DONE | "Failing lines on the unchanged tree", the cases table and the run counts below |
| 8. Sentence-form read of each new sentence | DONE | see "Doc and comment re-read" |
| `npm run diagrams` before the last round | DONE in the first build | `diagrams exit 0`; it rewrote `docs/diagrams/layers.dot`, `layers.svg`, `layer-state.dot` and `layer-state.svg` (one label each: "state to data" 585 to 583, from the two imports `feeds.ts` drops). It was not run in this round: the round changes only comments under `src` (`website.svelte.ts`, `feeds.ts`), and the diagram tool reads the imports of `src` (`utils/diagrams/graphs.mjs`), so the committed diagrams stay as written; `tests/checks/diagrams/diagrams.test.ts` is not in the round's list and runs at landing |

### Runs of a test command

The first build, kept as it was:

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

Repair round 1:

| Run | Tree | Files | Times |
| --- | --- | --- | --- |
| vitest, unchanged-tree run of the three changed test files (item 4) | scratch copy of the base with the four step files laid over it | 3 | 1 |
| vitest, last round | changed tree | 36 | 1 |
| prettier | changed tree | 48 | 1 |
| eslint | changed tree | 35 | 1 |
| ASCII gate | changed tree | 48, and 4 diagram files | 1 each |
| `npm run check` | changed tree | | 1 |
| `sh utils/unused-exports.sh` | changed tree | | 1 |
| `sh utils/tree/folder-check.sh` | changed tree | | 1 |

No test file ran while working in this round. No whole-suite command ran in either build (`npm run test:quick`, `npm test`, `npm run test:checks`, `npm run test:landing`, `npm run test:slow`, `npm run docs:shots`, or `npx vitest run` with no file). This round's vitest runs used `TMPDIR` unset, `nice -n 10`, 4 workers; the last round used the dot reporter and the unchanged-tree run the verbose reporter, for the lines quoted above. `.agents/scratch/` is removed: `ls -a .agents` prints `.`, `..`, `plan.yaml`.

Files the step does not change that were red in the first build's after3, each with its first error line (the landing's `npm run test:quick` runs them; none was rerun):

- `tests/server/machine/apps/tools/debug-adapters.test.ts`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/apps/tools/tasks.test.ts`: `Error: error connecting to /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O195/.agents/scratch/tmp/oculus-apptask-aXwdXa/server.sock (File name too long)`
- `tests/server/machine/apps/tools/terminals/terminals-tmux.test.ts`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/debug/channel.test.ts`: `Error: Test timed out in 60000ms.`
- `tests/server/machine/pty/agent-pane.test.ts`: `Error: the processes could not be read: status`, then `error connecting to .../agent-paned6xwOq/server.sock (File name too long)`

## Files with line counts

Lines now, and lines added and removed against the base copy (`diff` per file; `git diff --numstat` for docs):

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
| docs/templates.md | | +16 -12 |
| docs/diagrams/layers.dot, layers.svg, layer-state.dot, layer-state.svg | | +1 -1 each (`npm run diagrams`) |
| src/lib/data/helpers/guards.ts | 107 | +0 -10 |
| src/lib/data/model/machine/model-tasks.ts | 40 | +5 -2 |
| src/lib/data/sources/config/settings/hub-rows.ts | 270 | +10 -4 |
| src/lib/server/machine/runs/schedules/task.ts | 229 | +1 -0 |
| src/lib/state/feeds/feeds.ts | 150 | +26 -37 |
| src/lib/state/sessions/source/website.svelte.ts | 237 | +14 -9 |
| src/lib/views/boards/focus/CommandCenter.svelte | 338 | +3 -5 |
| src/lib/views/shared/sessions/sections/details/detail-facts.ts | 270 | +1 -0 |
| tests/data/hubs/website-files.test.ts | 854 | +47 -24 |
| tests/data/hubs/workspace-findings.test.ts | 48 | +1 -1 |
| tests/data/snapshot/cluster-folder.test.ts | 76 | +2 -2 |
| tests/data/snapshot/reference-hub.ts | 392 | +3 -1 |
| tests/data/snapshot/relation-shapes.test.ts | 158 | +3 -4 |
| tests/data/snapshot/resources.test.ts | 100 | +2 -2 |
| tests/data/snapshot/schema-rules.test.ts | 816 | +6 -2 |
| tests/data/snapshot/tier-stage.test.ts | 61 | +2 -2 |
| tests/data/sources/config/catalog/options.test.ts | 312 | +1 -1 |
| tests/data/sources/config/layers/hub-vocab.test.ts | 550 | +2 -2 |
| tests/data/sources/config/settings/hub-rows.test.ts | 343 | +33 -0 |
| tests/data/sources/manifests/clones.test.ts | 246 | +7 -2 |
| tests/data/sources/manifests/manifests.test.ts | 781 | +7 -5 |
| tests/fixtures/hubs/deck-hub.ts | 434 | +17 -5 |
| tests/fixtures/hubs/demo/.oculus/config.yml | 51 | +11 -1 |
| tests/fixtures/hubs/demo/README.md | 7 | +1 -1 |
| tests/fixtures/hubs/hub-build.ts | 67 | +29 -2 |
| tests/fixtures/hubs/website-hub.ts | 632 | +28 -13 |
| tests/routes/docs/audit.test.ts | 818 | +10 -10 |
| tests/routes/sessions/terminal-chat.test.ts | 372 | +12 -12 |
| tests/routes/sessions/terminal-fixture.ts | 386 | +11 -6 |
| tests/routes/sessions/website.test.ts | 504 | +22 -12 |
| tests/server/edit/config-value.test.ts | 530 | +5 -1 |
| tests/server/root/watch/deck-folders.test.ts | 453 | +13 -4 |
| tests/server/root/watch/website-watch.test.ts | 148 | +4 -1 |
| tests/state/forms/choices.test.ts | 216 | +6 -2 |
| tests/state/sessions/source/website-store.test.ts | 159 | +50 -24 |
| tests/state/system/schedule-lines.test.ts | 305 | +1 -0 |
| tests/state/workbench/navigation/notice-sources.test.ts | 67 | +1 -0 |

`diff -rq` of src, tests, utils and config against the base copy lists these 47 files and no "Only in" line, so `tests/fixtures/hubs/hub-scan.ts` is gone and no file is new.

## Files outside the path list, each with the reason

- `config/text/views/academic/career.yml` (new key `website_no_path`) and `src/lib/state/sessions/source/website.svelte.ts` (`off()`). With empty paths, the Career tip would read "Write ,  and  ..." and the button would be on, and the server would then refuse the press. `off()` returns `The setting {0} is not set, so the website is not written.` for the first empty path of `website.files`, in the order the server's refusal takes. This is the orchestrator's to reverse (SP1).
- `config/text/server.yml:105`. `not_task_name`'s example `such as litwatch` named the research hub's task; it says `such as weekly-digest`.
- `src/lib/data/helpers/guards.ts`. `numericSetting` had no caller once `staleAfter` went (unused-exports listed it), so it is removed.
- `tests/fixtures/hubs/demo/README.md`. Its sentence on the demo `.oculus/config.yml` names `scan:`.
- `tests/fixtures/hubs/hub-build.ts`. It holds `HUB_SCAN` and `HUB_SCAN_LINES`, the scan rules the test hubs set as their own (the seven rules oculus shipped), beside `buildOneHub`, which the same tests use; a test hub given them reads exactly the projects and findings it read on the unchanged tree.
- The scan fixtures and tests under "Scan fixtures", which the brief names only as a class.
- `tests/server/edit/config-value.test.ts:474`. The stale-base row sent `base: []` as a base the merge does not give, and `[]` is the merge now. The base is `[{ dir: 'gone' }]`, and the assertion is unchanged.
- `docs/diagrams/*`. Rewritten by `npm run diagrams`.

## Scan fixtures: every test hub that read projects through the shipped scan

Each takes `HUB_SCAN` or `HUB_SCAN_LINES` from `tests/fixtures/hubs/hub-build.ts`:

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
- `tests/server/root/watch/deck-folders.test.ts`: it replaces the demo copy's `scan:` block (a regex, with a throw when the block is missing), since appending a second `scan:` key would duplicate the demo's own.
- `tests/fixtures/hubs/deck-hub.ts` (`orderHub`, `ORDER_SCAN` after `projects/ideas`) and `tests/data/hubs/workspace-findings.test.ts` (`scan:\n  - { dir: side-projects }\n`), as the brief names.

## Edits to existing assertions (diff against the base copy)

The round changes no assertion: its test edits are import lines and comments. The step's edits:

- `options.test.ts:230`:
  - `-        expect(groups['behavior.yml']).toHaveProperty(['focus.refresh_stale_days']);`
  - `+        expect(groups['behavior.yml']).toHaveProperty(['website.files']);`
- `website-files.test.ts`, the header row: the literal `"# Generated by oculus from the research hub. ..."` becomes `` `# ${HEADER}` `` (the fixture's own constant).
- `website-files.test.ts`, case 10: `toEqual(SHIPPED)` twice becomes `toEqual(none)` twice, plus `expect(badPaths(site, read.files).at(0)).toEqual({ key: 'website.files.site', value: '' })`.
- `website-files.test.ts`, case 12: `{ ...SHIPPED, cv: 'data/cv.yml' }` becomes `{ site: '', cv: 'data/cv.yml', papers: '', industry: '' }`.
- `website-files.test.ts`, the other rows: `SHIPPED` becomes `PATHS` (`siteFiles('', PATHS)`), and the literal `'_data/website.yml'` becomes `SITE_PATH`. One new row, 'a hub that sets the four paths of website.files reads them' (`toEqual(PATHS)`).
- `website.test.ts`: `toEqual(['_data/publications.yml'])` becomes `toEqual([PAPERS_PATH])`.
- `hub-rows.test.ts`: the `row()` helper and two literal rows gain `nudgeAfterDays: null`. Five new rows: 31, 0, `range`, `whole`, `number`.
- `website-store.test.ts`:
  - The TIPS row 'the shipped paths and no command' is removed, since no paths ship. The no-command tip is asserted by 'a path of website.files.cv and no command'.
  - The UNSAVED row 'a shipped path' is renamed 'a path of the four the hub sets'.
  - New `it('is the sentence of the first empty path while website.files sets none or leaves one empty')`, asserting `t('career.website_no_path', 'website.files.site')` for `off()` and `tip()`, and `website.files.papers` for `{ papers: '' }`.
- `schedule-lines.test.ts` and `notice-sources.test.ts`: the HubTask literals gain `nudgeAfterDays: null`.

## Changed guarded rows: new titles, for the orchestrator's edit of `agents/guarded.md`

- G139 (`guarded.md:225`, its Test line `:227`):
  - 'a hub that sets no website.files reads the four shipped paths, from the merged shipped defaults' is now 'a hub that sets no website.files reads four empty paths, and Write the website and the audit stop at the first, naming it' (case 10);
  - 'a hub that sets one key of website.files reads it, and the shipped value of the others' is now 'a hub that sets one key of website.files reads it, and the others empty' (case 12);
  - new: 'a hub that sets the four paths of website.files reads them';
  - the WATCHED row 'the four shipped paths' of 'the files the audit reads and the watcher hears' (G125's describe) is now 'the four paths the hub sets';
  - the entry's text "the shipped four read through the merged defaults where a hub sets none and one key alone leaving the others shipped" describes the old defaults: a hub that sets none reads four empty paths, and one key alone leaves the others empty.
- G140 (`guarded.md:228`, its Test line `:230`): 'writes the file website.files names and not the shipped one' is now 'writes the file website.files names and not the one at the path it replaces' (`tests/routes/sessions/website.test.ts:475`). G140's text (`guarded.md:228`) says a press is refused with `website-bad-path` while a path of `website.files` is empty; with SP1 the Career button and the audit's press are off before any press while a path is empty, with `career.website_no_path`, so the server's refusal of an empty path is reached only by a request the button does not send. The text and the new website-store row 'is the sentence of the first empty path while website.files sets none or leaves one empty' are the orchestrator's to bring together.
- G125 (`guarded.md:189`, its Test line `:191`): 'compare the file website.files names, and leave the shipped path alone' is now 'compare the file website.files names, and leave the path it replaces alone' (`tests/routes/docs/audit.test.ts:620`).

## Judgment calls

- **The inbox line.** It belongs to the first offered inbox task that sets `stale_days`, and uses that task's value (brief decision 7). In case 5's "none then 2" row, the line moves from hub a's task to hub b's.
- **`RefreshItem.feed`.** It is typed `LastRun` (`radar`, `scout` or `inbox`). The strip's row id becomes `refresh:radar:<n>`. That id is an index of the view only and is never stored (`grep -rn "refresh:" src` finds no other reader).
- **`HUB_SCAN`.** It is one shared fixture, frozen with each rule, in `hub-build.ts`, so every test hub that read the shipped rules reads the same rules from one place and no reader can change them for another test.
- **The website-store fix.** It is a change to the product, made so that no test asserts the "Write ,  and" tip. It is named above for the orchestrator to keep or reverse (SP1).

## Visible changes, before and after, for the look

- **Focus refresh strip (CommandCenter).**
  - Before: rows from `focus.refresh_stale_days` (litwatch 14, inbox 2, scout 7; the research hub's workspace sets litwatch 31), each line labelled with the key `refresh_litwatch_plain`.
  - After: rows from each task's `stale_days`, labelled with `refresh_radar_plain`, whose text is the same, `'{0}: {1} | run {0} from the Update tray'`.
  - With the hub lines written (31, 7, 2), the research hub shows the same lines as before (case 8). Without them it shows none.
  - A second hub of a workspace whose `update_tasks` rows set no `stale_days`: before, its radar, scout and inbox tasks were nudged after 14, 7 and 2 days (or the workspace's own `focus.refresh_stale_days` values, which applied to every hub of the workspace); after, they are never nudged (B2).
- **Settings view, `update_tasks` row form.** It gains a `stale_days` number box. The Thresholds and horizons section of Boards loses its three `refresh_stale_days` entries, and the `focus` group text no longer mentions feeds.
- **Settings view, a bad task name typed into a row's `task` field.** The refusal sentence, `server.config_key.not_task_name` (`config/text/server.yml:105`), reads before: "This option takes lowercase letters, digits and dashes starting with a letter, such as litwatch"; after: "This option takes lowercase letters, digits and dashes starting with a letter, such as weekly-digest" (B1).
- **Career view, Write the website.**
  - Before: the tip named the shipped paths, whatever the hub set.
  - After: with any path of `website.files` empty, the button is off, with `The setting website.files.<key> is not set, so the website is not written.`
  - With the hub lines written, the tip and the file header are as today (case 13).
- **Audit view, Website section, the Write the website press of a finding** (`src/lib/views/system/findings/AuditSection.svelte:166-167`, the fourth reader of `website.off()` beside `Career.svelte:124` and the store's own `tip()` and `write()`, `website.svelte.ts:141`, `:183`). With a path of `website.files` empty, its title would be the same `career.website_no_path` sentence and the press off. By reading this is unreachable: a hub with an empty path gets the audit's bad-path finding (`publications.ts:95-103`), which carries no press, and the finding that offers the press is raised only after `badPaths` finds none (SP2).
- **Incoming page.**
  - Before: the first pane held Inbox, Position Leads and LinkedIn.
  - After: Inbox and Position Leads, with Calendar in the second pane.
  - With the hub line, the research hub keeps LinkedIn (cases 17 and 18).
- **Projects.** A hub with no `scan:` has no projects. The research hub sets its own `scan:` (config.yml:7-21), so nothing changes for it. The demo hub sets six rules (case 14, `npm run docs:shots` at the look).
- **Sessions, Details, Session group (case 20).**
  - Before: title, folder, branch, kind, and the rest.
  - After: title, then `id` with the session's id (for the transcript `be0ac0d7-a551-4911-a072-9f76e1bbe399.jsonl`, the value `be0ac0d7-a551-4911-a072-9f76e1bbe399`), then folder and the rest, on the Sessions view's Details and on a Session tab.

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

## Greps (verify item 6), run after the round's last change

The builder runs no `git grep` (spec.md, "Where you work"), so each is `grep -rn` with `--exclude=local.yml`.

- **6a, over src, config, docs and README.md.** `grep -rn "refresh_stale_days\|staleAfter\|_data/website.yml\|_data/data.yml\|_data/publications.yml\|_data/industry.yml\|from the research hub" src config docs README.md --exclude=local.yml` prints nothing, `exit 1`.
- **6a, over tests.** It prints only lines where a test or fixture sets its own hub's values:
  - `website-hub.ts:32,35,38,41,53`;
  - `audit.test.ts:386-389`;
  - `website.test.ts:60,63,66,69`;
  - `website-watch.test.ts:36,39`;
  - `website-store.test.ts:26-29`, and `:74`, `:81`, `:131`, which are the expected tip arguments and the held path built from that test's own paths.
- **6b, litwatch.** `grep -rn "litwatch" src config/defaults config/options config/text --exclude=local.yml` prints only glyph lines: `config/text/views/boards/focus.yml:66` (`radar_glyph: litwatch`), `config/text/views/feeds/radar.yml:27`, `LiteratureCard.svelte:117,120,125,128,187,195`, and `Radar.svelte:146,201`.
- **6c, project folders.** The folder grep prints the commented example `docs/templates.md:48-54` and these lines that are no default:
  - `config/options/behavior.yml:66` (the help's example path `projects/archive/published`);
  - `docs/templates.md:59` (the `new_project_dir` example);
  - `docs/templates.md:418` (the folder conventions example);
  - `docs/templates.md:1058` (a task prompt's example);
  - `src/lib/data/model/model-entities.ts:75,98` (doc examples);
  - `src/lib/server/git/clone/exclude.ts:8` (a comment's example).
- **6d.** `sed -n '/^  incoming:/,/^  [a-z]/p' config/defaults/layout.yml | grep -c linkedin` prints `0`.

## History-word grep (S3)

`git diff -U0 -- src tests config docs ':!docs/diagrams' | grep '^+' | grep -v '^+++' | grep -niE "\b(before|used to|no longer|still|always|as before|previously|the step adds|after this package lands|anymore|formerly|legacy|reverted)\b|\b[OQDZG][0-9]{2,3}[a-z]?\b|20[0-9]{2}-[0-9]{2}"` covers every added line of the step (comments, test titles, catalog and option text) with the spec's whole list, `still` and `always` included (`always has been` and `always had` fall under `always`), package ids and dates. It gives five hits, none of them history:

- `config/defaults/behavior.yml:1`, "how long before a manifest counts as stale": a span of time.
- `config/text/views/system/workbench.yml` `desc_behavior`, "true asks before a delete to the Trash": an order of events.
- `src/lib/state/feeds/feeds.ts:96`, "a present file with no run date still nudges for": "even so", the radar nudging although it has no date.
- `src/lib/state/sessions/source/website.svelte.ts:11`, "is refused before it is sent": an order of events.
- `tests/state/sessions/source/website-store.test.ts:4`, "stops before it is sent": an order of events.

No added line holds `always`, a package id or a date.

## Name greps (S4)

The grep run before each new name, over the base copy's src and tests (`grep -rnw <name> src tests` in `../migration-O195-base`), with what was reused:

| Name | Base copy | Where it is now |
| --- | --- | --- |
| `HUB_SCAN` | `count: 0` | `tests/fixtures/hubs/hub-build.ts:52`, exported, eleven importers |
| `HUB_SCAN_LINES` | `count: 0` | `hub-build.ts:65`, exported |
| `PATHS` | `count: 2`, both a local `PATHS` of `tests/data/sources/config/settings/writing.test.ts:42`, `:46` (the three formatter paths of another setting, not the website's) | `website-hub.ts:44` (exported; it replaces the base's exported `SHIPPED` there), and file-local constants of `website-store.test.ts:25`, `website.test.ts:72` and `audit.test.ts:385` (the last replaces the base's local `SHIPPED` of `audit.test.ts:385`) |
| `HEADER` | `count: 0` | `website-hub.ts:52`, exported |
| `FILE_SETTINGS` | `count: 0` | `website-hub.ts:59`, file-local |
| `FILE_LINES` | `count: 0` | `website-watch.test.ts:39`, file-local |

For the scan rules, the base held no list of the seven shipped rules in tests: `grep -rn "dir: 'projects/ideas'\|dir: projects/ideas"` over the base's tests gives single rules or other lists (`writes-fixture.ts:43`, `hub-words.test.ts:224`, `board-new-project.test.ts:177`, `items.test.ts:32`, `workspace-projects.test.ts:38`, `scan.test.ts:32-65`), none of them the seven.

The empty, duplicate and collision cases of each new key, by `grep -rn <key> config src tests --exclude=local.yml` and by reading:

- **`stale_days`**, a field of a row of `update_tasks` (`config/options/sources.yml:179`). Absent: the row is read with `nudgeAfterDays: null` (`reader.ts:155` skips an absent field whose spec sets `empty`; `hub-rows.ts:175`). Empty (`stale_days:` with no value, YAML null): `reader.ts:155` skips only `undefined`, so `valueProblem` checks null and returns `{ kind: 'number' }` (`value-rule.ts:332`), and the row is refused like `soon`; this is by reading, no run. Duplicated: one field of that name among the row's fields (`task`, `label`, `note`, `view`, `last_run`, `stale_days`); a row that writes the key twice is a YAML question the parser answers, not verified. Collision: no other field of the row, and no config key, is named `stale_days`; the project field `staleDays` is a code name only, and the row's code name is `nudgeAfterDays`.
- **`career.website_no_path`** (`config/text/views/academic/career.yml:37`). Empty: its value is a sentence. Duplicated: one definition; its readers are `website.svelte.ts:135` and the test. Collision: no other key `website_no_path` in any group. Its argument is `website.files.<key>` from `Object.entries(setting.files)`, never empty.
- **`sessions.f_id`** (`config/text/views/sessions/session-detail.yml:23`). Empty: its value is `id`; a session whose id is empty draws no row, since `kept` drops a fact with an empty value (`detail-facts.ts:200`). Duplicated: one definition, one reader (`detail-facts.ts:130`). Collision: the fact key `'id'` is no other fact's key of `sessionFacts` (`title`, `cwd`, `branch`, `kind`, `status`, `pid`, `version`, `started`, `hook`).
- **`focus.command.radar_glyph`** (`config/text/views/boards/focus.yml:66`). Empty: its value is `litwatch`. Duplicated: one definition, one reader (`CommandCenter.svelte:155`). Collision: `views.radar_glyph` (`config/text/views/feeds/radar.yml:27`) shares the last segment and lies in another group, so the full keys differ.
- **`focus.command.refresh_radar_plain`** (`focus.yml:69`). Empty: its value is `'{0}: {1} | run {0} from the Update tray'`. Duplicated: one definition, one reader (`CommandCenter.svelte:261`). Collision: none.

The renamed names: `grep -rn "hub-scan" src tests config docs utils README.md --exclude=local.yml` prints nothing. The first build's grep `litwatch_glyph\|refresh_litwatch_plain\|FEEDS\b\|staleAfter\|numericSetting` found no `litwatch_glyph`, `refresh_litwatch_plain`, `staleAfter` or `numericSetting`; its `FEEDS` hits are other constants of the same word (`hub-rows.ts:36`, `PAGE_FEEDS` of `page-entry.ts` and `palette.ts`, `NO_FEEDS` of the entity fixtures, a local `FEEDS` of `page-entry.test.ts`), none of them the removed export of `feeds.ts`.

## Doc and comment re-read

Each new sentence was read in its file:

- `config/defaults/sources.yml`: the head comment, the `scan:` comment and the `update_tasks` comment.
- `config/defaults/behavior.yml`: the head comment and the website comment.
- `config/options/sources.yml`: the `scan` help, the `update_tasks` help, the `last_run` help and the `stale_days` help.
- `config/options/behavior.yml`: the four path helps, `file_header`, and the `focus` group line.
- `config/text/views/system/workbench.yml` `desc_behavior`.
- `docs/templates.md`: scan, `update_tasks` and website.
- The doc comments of `feeds.ts` (`RefreshItem`, `refresh`; `refresh` rewrapped this round, still true), `hub-rows.ts`, `model-tasks.ts`, and the head comment of `website.svelte.ts` (rewrapped this round, still true: it names the Career button and the audit finding's press, the two views that read `off()`).
- `tests/fixtures/hubs/hub-build.ts`: the head comment rewritten this round to name both concerns, the build of one hub and the scan rules a test hub sets as its own; the doc comment of `HUB_SCAN` says it is frozen.
- The demo config and README; `deck-hub.ts`; `deck-folders.test.ts` (rewrapped, still true); `terminal-fixture.ts` (`ChatFolder` rewrapped, still true); `choices.test.ts` (`settings` rewrapped, still true); `reference-hub.ts`; `schema-rules.test.ts`.

`docs/HELP.md:104` ("the nudges to refresh a stale feed") and `docs/data-map.md:132` and `:67` stay true and were left as they are.

## Limitations and sharp edges

- **The four website paths are written in five places in tests.** `website-hub.ts:44` exports `PATHS` (with `SITE_PATH` and the others), while `website-store.test.ts:25`, `website.test.ts:60-77` and `audit.test.ts:385-391` declare their own copy and `website-watch.test.ts:36-39` its own lines. On the base copy the values were already in three places (`website-hub.ts` `SHIPPED`, `audit.test.ts` `SHIPPED`, `website.test.ts`'s four constants); the step adds the local `PATHS` of `website-store.test.ts` and `website.test.ts`. `website-store.test.ts` already imports `FIELD_LINES` from `website-hub.ts`, so it could take `PATHS` from there too. The round says nothing else in the code changes, so it is left for the orchestrator.
- **Readers of `BASE_CHAT_CONFIG` outside the round's list** (`compose.test.ts`, `terminal-actions.test.ts`, `latex-approvals.test.ts`, `runs/commands/run.test.ts`, `pty/agent-pane.test.ts`) were not run. They receive the frozen `HUB_SCAN` by reference; a reader that wrote to `config.scan` would throw. By reading their input is unchanged, `npm run check` is green, and the landing's `npm run test:quick` runs them.
- **SP1, the off reason of Write the website**, is a product change outside the path list, kept as built, and makes G140's text on an empty path describe a refusal the button forestalls (see "Changed guarded rows").
- **The prettier exit status** of the last round was not captured; its output line is quoted.
- **Case 7's finding, cases 1 to 5, 11 and 15** rest on the first build's case program, which is removed; the reviewer judged them by reading.

## Anything in the brief that was wrong

- **The path list was short.** The change needs the files under "Files outside the path list".
- **The scan census.** The brief names the scan-reading test hubs only as a class, and that class is 18 files. Among them, `deck-folders.test.ts` appended a second `scan:` key to a demo copy, which the demo's own `scan:` makes a duplicate key.
- **config-value.test.ts.** Its stale-base row used the shipped `[]` as a base the merge does not give, which the empty shipped `scan:` makes the merge itself.

Nothing else in the brief was found wrong.
