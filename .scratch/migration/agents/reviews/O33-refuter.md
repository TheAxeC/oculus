# Step O33 refuter report (on .agents/worktrees/O33, base b80e3a9cd)

Pages are cited by section, code by file:line. Paths without a prefix are under `tools/oculus/` of the worktree; hub paths are named from the worktree root. The text keeps to the rules file's character set: ASCII, no glyphs. No file was changed. The only git commands run were `git diff b80e3a9cd`, `git status --short` and `git show b80e3a9cd:<path>`.

## Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base b80e3a9cd            (from tools/oculus, exit 0)
test:quick: 190 changed file(s), from git since b80e3a9cd
test:quick: 214 test file(s), 10 essential
ok ASCII gate (0.7 s)
ok svelte-kit sync (2.5 s)
ok prettier (4.7 s): All matched files use Prettier code style!
ok eslint (39.9 s)
ok svelte-check (47.0 s): 1792099835199 COMPLETED 510 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok vitest (83.8 s): Duration 76.47s
test:quick: 84.6 s (limit 45.0 s); every command passed
test:quick: over the time limit
not covered: tests outside the selection, tests/checks, slow tests, build, lint of unchanged files

$ sh utils/unused-exports.sh, compared with .agents/worktrees/O33-base/unused-exports.txt
base 357 lines, now 356. Added: src/lib/data/snapshot/normalise.ts (collectionKeys), src/lib/data/sources/config.ts (collectionKeys re-export), src/lib/data/sources/documents/templates.ts: templateBlock. Removed: escapeAppleScript, notify, ExecFile, recoveryCommand, TEXT_KEY (merge.ts).

$ LC_ALL=C perl -ne '<the spec.md:100 gate>' $(find src tests bin config -type f ! -name local.yml) | wc -l
0

$ OCULUS_TEST_HUB=/Users/axelfaes/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts tests/checks/config/config-folder.test.ts --reporter=dot
Test Files  2 passed (2)
Tests  39 passed (39)

$ env -u OCULUS_TEST_HUB npx vitest run tests/checks/config/integrity.test.ts tests/checks/config/config-folder.test.ts tests/data/real-hub.probe.ts
Test Files  2 passed (2)
Tests  31 passed | 8 skipped (39)
(no skip line anywhere in the output)

$ env -u OCULUS_TEST_HUB npx vitest run tests/checks/config/integrity.test.ts --reporter=verbose
stderr | tests/checks/config/integrity.test.ts
integrity: the cases over a real hub skipped, since OCULUS_TEST_HUB is not set
Tests  7 passed | 7 skipped (14)

$ OCULUS_TEST_HUB=$TMPDIR/o33-nothub npx vitest run <the same two files>      (exit 1)
Failed Tests 8
Error: OCULUS_TEST_HUB names /var/folders/.../o33-nothub, which is no hub: it holds no .oculus/config.yml

$ npx vitest run tests/server/machine/lsp/servers.test.ts --testTimeout 20000
Test Files  1 passed (1)
Tests  7 passed (7)

$ npx vitest run tests/checks/config/config.test.ts
Test Files  1 passed (1)
Tests  35 passed (35)

$ (release archives unpacked under $TMPDIR/o33-rel) grep -rl "/Users/axelfaes/workspace/research-hub" per archive | wc -l
== mac 0   == x64 0   == arm 0

$ diff -rq src|config|docs $TMPDIR/o33-rel/mac/oculus.app/Contents/Resources/app/...
src: no difference; config (local.yml excluded): no difference
docs: docs/diagrams/layer-state.dot, layer-state.svg, layers.dot, layers.svg, writes.dot, writes.svg differ
```

## Verdicts

What to build:

- Part 1 (phase A share: hub CLAUDE.md, README.md, CONTEXT.md name `~/workspace/oculus` and how to start it): holds (`README.md:3,22`, `CLAUDE.md` Repo conventions bullet, `CONTEXT.md:3`). The repository, `gh`, plan.yaml split: not applicable (phase C).
- Part 2(a) four task files: holds. Read whole against `.agents/skills/research-cockpit/SKILL.md` sections 5, 6, 7, 10, `litwatch-runbook.md` and `position-leads-readme.md`: profile, motifs, prompts, Gmail queries, honesty rule kept; `scout.md:63` states the dated `meta.log` line holding `scout`, which `SCOUT_RUN` (`src/lib/data/sources/documents/feeds.ts:32`) reads.
- Part 2(b) task command and tray: holds (`src/lib/server/machine/runs/schedules/task.ts:48-63,94-96`, `UpdateTray.svelte` uses `schedule.offered()`, `feeds.ts` refresh filtered by offered).
- Part 2(c) templates of the four task files in `docs/templates.md`: violated (Spec 1).
- Part 2(d) `/research-cockpit <kind>` texts reworded: holds for the listed files (focus.yml:65-67, feeds headers).
- Part 2(e)(f)(g) hub lines, tiers into hub README: holds (`README.md:26-56`).
- Part 2, README names the last commit holding `tools/cockpit` (decision 10): violated (Spec 2).
- Part 2, ROADMAP move and `.agents/plan.yaml:5`: holds (byte-identical move; plan.yaml diff).
- Part 2, hub glyph list names oculus's surfaces: holds (`README.md:64-68`).
- Part 3 Linux branches, picker, opener, shell, packager, first-run: holds (G7, G42, G73, G85 rows pass in test:quick).
- Part 3 keyring on Linux (G76): not applicable; the brief's premise is wrong (Accounts view does not use the keyring), as the builder's report says.
- Part 3 notify removal: holds (`grep notify|osascript` over hooks.ts, stores/hooks.ts, behavior.yml, options.yml prints nothing; no `notify` in hub `.oculus/config.yml`).
- Part 3 Lima run: not applicable (phase C).
- Part 4 README quickstart: holds (`README.md:1-12`).
- Part 5 `OCULUS_TEST_HUB` and demo-hub cases: holds, with the skip line only partly visible (Proof 4).
- Part 5 scripts find the git root, texts say oculus is its own repository: holds (`tests/tiers/quick.mjs` `repositoryRoot`, essential.txt).
- Part 5 `docs/data-map.md`, hub lines into hub README, links followed, hub DATA-MAP removed: holds (diff of the two pages read; `README.md:6-12`; no `DATA-MAP` link left).
- Part 5 Make Folder a Hub and Make Folder a Project: holds by reading (`src/lib/server/files/project/make.ts:63-153`), unproven (Proof 1).
- Part 5 left-out collection views: holds by reading (`src/lib/state/workbench/layout/tabs/left-out.ts`), the look's.
- Part 6 `docs/figures`: holds for the move and the image paths; the generator no longer reproduces one committed figure (Behaviour 1).
- Part 7 `recover_command`, lint lists to the hub, deposit: holds (`pty/routes.ts` recoverDataset; `HUB_LIST`; `grep -rn tools/deposit src` 0).
- Part 8 `.gitignore`: holds (`cat .gitignore`).
- Part 9 `app:release`: holds (`src/desktop/release.ts`; three archives in `release/`, 0 checkout paths).
- Part 10 Literature scroll and MultiSelect over 12: holds by reading (`FieldFilters.svelte`, `collection.ts` `FILTER_CHIPS_MOST = 12`, `Pane.svelte` `.viewbar` max-height 50%).
- Part 11 title bar strip in the app only: holds by reading (`src/lib/shell/Workbench.svelte` `stripped = client.desktop !== undefined`, `FloatWindow.svelte`).
- Part 12 (i) follow mark, (ii) record stamps: holds (G86 7 rows, G87 8 rows pass; `stamps.ts` read whole).
- Part 13 Session view text at `--fs-sm`: holds by reading (SessionDetail.svelte, ChangesRepo.svelte, Transcript.svelte diffs).
- Part 14 PDF page: holds by reading (`apps.ts` `openPage`, `methods.ts`, `reach/open.ts`, `File.svelte` effect), unproven for its rows (Proof 2).
- Part 15 Focus page: order holds by reading (`Focus.svelte:151-197`); the rest is the look's.
- Folded Step 0, `servers.ts` real path: holds (servers.test.ts 7 passed).

Cases:

- A1: met (sentence rows in run.test.ts and terminal-actions.test.ts pass; the tray half by reading `schedule.svelte.ts` `offered`).
- A2: partial. The four files hold what A2 asks; the refusal of a task with no file is in `task.ts:94-96` with no test row and no quoted run.
- A3: met (open-program.test.ts rows, in test:quick).
- A4: met (picker.test.ts rows).
- A5: met (platform-steps.test.ts).
- A6: met by reading (no `osascript` in src).
- A7: partial. `config.test.ts:416` shows the shipped behavior.yml gives no finding (35 passed); no run or row shows a behavior.yml holding `notify:` giving the unknown-key finding.
- A8: partial. Only the `'mimic-iv'` row runs; `a b`, `a'b`, two hubs, a command with no `{key}` and the absent control have no row and no quoted run.
- A9: partial (by reading only).
- A10: partial (by reading only).
- A11: not verifiable here (the look).
- A12: partial. The thresholds hold by reading; the 400-entry scroll is the look's.
- A13: met by reading; the drawn result is the look's.
- A14: partial. `openPage` (`apps.ts:200-204`) refuses 0, 2.5, '3', -1 and a `.md`; `A.PDF` passes; no row or run proves any of it.
- A15: met.
- A16: met.
- A17: partial (Proof 4).
- A18: partial. The three archives exist and hold no checkout path; their `docs/diagrams` differ from the final tree; starting the apps and Lima are the orchestrator's.
- A19 (phase A form): met with the brief's one miss. The hits are the phase B skill files, `.agents/plan.yaml:12` (`worktree_paths`, phase B), the `feeds/position-leads.yml` meta.log lines, and `.oculus/workspaces/research-hub.yml:12` (phase C, not named by A19).
- A20: met.
- A21: not applicable (wrong premise).
- A22: met (no hub tool path in src or config; part 8 lines present; all nine `figures/` images exist; no `DATA-MAP` link).
- A23: not verifiable here (the look).
- A24: not verifiable here (the look).
- A25: not verifiable here (the look).
- A26: not verifiable here (the look).
- A27: met by reading for the order and the no-career case; folding is the look's.

## 1. Spec

**Spec 1: the four task-file templates of part 2(c) are not built.** Brief part 2(c): "`docs/templates.md` holds a template of each of the four files, written for any person, with no content of Axel's." `/usr/bin/grep -n -i "litwatch|scout|inbox|linkedin|tasks/" docs/templates.md` finds only line 87 (`linkedin_dir`), 159 (mail accounts), 225 (`runs: { task: litwatch }`), 881 and 912 (the feed files). The page has no heading or block for `.oculus/tasks/<task>.md`. Ruling O33 builder (plan.md:2043) puts "the hub task files and texts of part 2" in phase A. The report's first line says "Everything in phase A of the brief is built, parts 1 to 15", and its DONE table marks part 2 DONE. Failure: a person making a new hub with Make Folder a Hub gets no task files and no template to copy, so the Update tray offers nothing (`app.tasks.no_files`), and the line points at a file shape that no document shows. Verdict: violated.

**Spec 2: the hub README names a commit that is not the last one holding the cockpit.** `README.md:12`: "The research cockpit that oculus replaced is kept by git alone: commit `b80e3a9cd` is the last that holds its folder, `cockpit/` under `tools/`." Phase A deletes nothing under `tools/cockpit` (only ROADMAP.md moves), so the O33 landing commit and every commit up to phase B also hold it. The sentence is false from the moment it lands. The builder's own open item 10 (O33-report.md:16) says "The orchestrator writes the id at phase B", which contradicts the text already written. Failure: someone who restores the cockpit from `b80e3a9cd` gets a tree that lacks any cockpit change landed after it. Verdict: violated. Fix: leave the id out until phase B, or write it at phase B.

**Spec 3: hub lint globs the brief did not ask for, misdescribed in the report.** `.oculus/config.yml:84-85` add `'.scratch/migration/plan.md'` and `'.scratch/migration/agents/guarded.md'` beside the carried `tools/oculus/...` pair (82-83). The base lists only the latter (`git show b80e3a9cd:tools/oculus/config/behavior.yml`, lines 207-208). Lint settings are one merged setting applied to every root (`src/lib/data/sources/config/settings.ts:601`, `writing.ts:50`), so the new globs already skip any workspace root's `.scratch/migration/plan.md`. Open item 8 (O33-report.md:14) describes only the `tools/oculus` lines. Verdict: minor. The addition is undisclosed, and the decision on it is the orchestrator's.

**Spec 4: cockpit mentions in hub files outside the write list.** `side-projects/research-hub/project.yml:6`, `registries/boilerplate.yml:2`, `tools/present/README.md:5,18,38,41`, `tools/present/build.py:13` and `tools/present/deck_config.py:1` still name the cockpit (`/usr/bin/grep -n -i cockpit`). The brief's "What is on the tree" does not list them. The builder booked them as open item 9 and did not edit outside its paths. Verdict: brief gap, booked; widening the path list is the orchestrator's decision.

## 2. Proof

**Proof 1: the new write route has no test.** `src/routes/api/(files)/folders/make/+server.ts` and `src/lib/server/files/project/make.ts:117-153` write files under a served root. G1's text covers any "route that writes, runs or opens something" (guarded.md:7), and G2's covers "a path outside the folders of the workspace" (guarded.md:10). Spec.md:58 says an entry keeps one test per API route its text covers. No file under `tests/` names `folders/make`, `handleMake` or `project/make` (`/usr/bin/grep -rln`). A9 and A10 are "by reading" (O33-report.md:75). Open item 6 hands the question back instead of writing the rows the existing entries already require. The token refusal, `outside`, `not-offered`, `exists` and the exclusive create have no run. Verdict: unmet.

**Proof 2: the page key of `open` has no rows.** The new inputs give a `closed` outcome: page 0, 2.5, '3', -1, `page` on `a.md`, and a repeated `page` query in `handleOpenGet`. G49's tables (`methods.test.ts` "refuses an open target or a write by the page's own checks before any request", `app-open.test.ts`, guarded.md:36) gained none of them. `methods.test.ts` changed only its mocks and one expected call to `['hub', 'README.md', null]`, and `app-open.test.ts` is unchanged (`git diff --stat`). Spec.md:58 asks for one row per input that gives a different outcome. Verdict: unmet.

**Proof 3: cases checked by reading where the brief asks for a quoted run.** The brief's Cases section says: "Every other case of a code step is checked by a run the report quotes, and no test is kept for it." The report gives no after-run for A1 (tray half), A2 (refusal), A7 (second half), A8 (four of five rows), A9, A10, A11, A12 and A14. It marks them "by reading", "test:quick" or "the look" (O33-report.md:63-75). Verdict: partial proof for those cases.

**Proof 4: the skip line is not seen in a normal run.** `tests/checks/config/integrity.test.ts:57` and `config-folder.test.ts:544` print the line with `console.warn`. The default reporter of `npm run test:checks` and `npx vitest run` showed no such line in my run ("Tests 31 passed | 8 skipped (39)"). Only `--reporter=verbose` printed it. A17 asks that the real-hub cases print one skip line when unset. Failure: a run with the variable forgotten shows 8 skipped and no reason. Verdict: partial.

**Proof 5: the report's guarded table mislabels the servers row.** O33-report.md:90 lists `servers.test.ts` under G76. G76 is "A secret's value never leaves the keyring" (guarded.md:52). The brief places the row under guarded.md:27, which is G7's Test line. The new row title "names a node_modules that is a link by its real path, ..." is named in no guarded entry (`/usr/bin/grep -c` gives 0). The orchestrator adds that name. Verdict: report error.

**Proof 6: the archives are not wholly the final tree.** O33-report.md:108 says the archives were "Built from the final tree". `diff -rq` of the unpacked macOS app against the worktree shows six `docs/diagrams` files differ (layer-state, layers, writes, each .dot and .svg). `src` and `config` are identical. `find ... -newer release/oculus-0.1.0-darwin-arm64.zip` lists only `docs/diagrams` files. Verdict: minor. The shipped diagrams are stale, and phase C rebuilds the Release anyway.

**Proof 7: the builder's rule lapses (its own list, O33-report.md:467-473, confirmed where checkable).** test:quick ran over the 45 s limit both times (96.9 s and 85.6 s; my run took 84.6 s over 190 changed files). Whole-suite-like `npx vitest run tests/data tests/routes ...` commands ran, which spec.md:25 makes a finding of the review. The check, lint, unused-exports and diagrams runs exceeded their counts. `src/lib/state/sessions/terminals.svelte.ts` changed after the last test:quick; my test:quick over all changed files, that file included, passed. One-line edits were made with `sed -i` and `perl -0pi`. Verdict: findings against the step's process. None of them changed an outcome I could find.

## 3. Standards

**Standards 1: an export kept for a test only.** `src/lib/data/sources/documents/templates.ts:34` `export function templateBlock`. Its only reader outside the file is `tests/checks/config/template-keys.ts`. Spec.md:86 says an export "with no importer outside its own file and its tests is removed or made local". The report keeps it so the test uses the same reader (O33-report.md:455). That is a deliberate exception the rule does not allow. `collectionKeys` is not a finding: `utils/diagrams/palette.mjs:69` imports it, a real reader the script does not see. Verdict: violated (minor).

**Standards 2: a paragraph left without its reason.** `docs/RESEARCH-APPROACH.md:57` still opens "The layout underneath is deliberate in one specific way. `ideas/`, `active/` and `manuscripts/` are flat ... while `archive/` and `coauthor/` are nested". The removed sentence ("The live tiers stay flat because a folder there with no `project.yml` surfaces as a flagged ghost card ...") was the reason. The removal is correct, since oculus reports no such folder (`src/lib/data/sources/manifests.ts:396`). But "deliberate in one specific way" now names no way. Verdict: minor.

**Standards 3: two hub README statements disagree on where a manifest lives.** `README.md:60` says Make Folder a Project "writes the folder's manifest". That file is `.oculus/project.yml` (`make.ts:39,99`). `README.md:28-32` and the tier table say a project's top level holds `project.yml`. The scanner reads both (`manifests.ts:80-88`), so nothing breaks, but a project made by the control does not match the layout the same page states. Verdict: minor.

## 4. Behaviour

**Behaviour 1: the figure generator no longer reproduces its committed figure.** `docs/figures/gen_figures.py:395-400` now reads `config/catalogs/vocab.yml` from `$OCULUS_DIR`, else `~/workspace/oculus`. Line 467 writes `"archive_categories: " + ", ".join(cats)` into the lifecycle figure. Oculus's list (`tools/oculus/config/catalogs/vocab.yml:200`) ends `..., software, finished, archived`. The committed `docs/figures/project-lifecycle.svg:56` reads `archive_categories: published, submitted, in-prep, abandoned, nogo, dropped, disproved, tech-report, software`. Rerunning the generator therefore changes a committed figure. The chip colours it uses are the same in both vocabularies (compared key by key). Until phase C makes `~/workspace/oculus`, the script also exits unless `OCULUS_DIR` is set. Neither fact is in the report, which says only that it "reads oculus's vocabulary through `OCULUS_DIR`". Failure: the next regeneration silently rewrites the lifecycle figure, or fails on a machine without oculus at that path. Verdict: defect (low).

Leads from the orchestrator, examined:

- The README last-commit sentence: confirmed (Spec 2).
- `writing_skip` with both globs: confirmed (Spec 3).
- `watchSchedules` capturing `options.hub()` once: refuted. `local.ts` lists `schedules` among the workspace-dependent watchers, and `context.ts:841-843` calls `reloadLocal` on a primary move, which rebuilds that watcher.
- `followMark`, one tail per agent tab per message: refuted as a defect. The marks are keyed by session and agent and compared by record identity, which is what the brief and G86 ask; the 7 rows pass.
- `focus-lanes.ts` importing `labelOf` from `focus.ts`: no cycle. `focus.ts` imports nothing from `focus-lanes.ts` (`grep ^import`).
- The deleted terminal case "starts the named shell in the home folder while the workspace has no primary hub": not a lost guarded row. G35 names only the recover row, which stays. A recover now always runs in its dataset's hub, and the report discloses this as a judgment call.
- `make.ts` writing under the token and root with no test: confirmed (Proof 1).
- ROADMAP moved: confirmed byte-identical.
- `gen_figures.py` reading oculus's vocabulary: confirmed (Behaviour 1).
- `summaryOf` cutting at " - ": confirmed (`career.ts:83`). It is disclosed as open item 12, and the brief's own example "Next: FWO Senior" needs that cut on this hub's milestone.
- Builder rule lapses: confirmed (Proof 7).

## Declined to judge

- Every drawn result is the orchestrator's look on TEST: A11, the Literature scroll of A12, A13's drawn strip, A23 to A27, part 13's sizes in the themes, and the hub dialog of Make Folder a Hub.
- Starting either app, Gatekeeper on the unsigned macOS app, and the Lima run of the Linux arm64 archive (A18's last half): the orchestrator's by the brief.
- Whether a `~/.oculus/config.yml` exists, which `make.ts` `inHub` (64-69) would treat as a hub above every folder in the home folder. The limits forbid touching `~/.oculus`; not verified.
- Phases B and C, the new repository, the Release and the A19 after-phase-C form.
- The hub README, CLAUDE.md and CONTEXT.md saying oculus is its own repository while `tools/oculus` is still in the hub: the brief asks for that text in phase A.

Reviewer usage: a1b12a5347e0657cb, claude-opus-5-5, 286,616 tokens, 168 tool uses, 29.8 min.

## Repair round 1, refuted

No file was changed. The only git commands run were `git diff b80e3a9cd` (with `--name-only` and path limits), `git status --short` and `git grep` over the worktree's tracked files. The probes below are scripts in `$TMPDIR/o33r1-probe/`. They import the worktree's modules and write only under `$TMPDIR`.

```
$ npm run test:quick -- --base b80e3a9cd                      (from tools/oculus, Node v24.21.0, exit 0)
        tests/checks/config/config-folder.test.ts: changed, run by npm run test:checks
        tests/checks/config/integrity.test.ts: changed, run by npm run test:checks
        tests/checks/source/keys.test.ts: changed, run by npm run test:checks
        tests/server/machine/lsp/servers.test.ts: changed, run by npm run test:slow
ok      ASCII gate (0.7 s)
ok      prettier (2.5 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.6 s)
ok      eslint (8.0 s)
ok      svelte-check (6.2 s): 1792105031514 COMPLETED 510 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (53.6 s): Duration  47.37s (transform 49.29s, setup 0ms, import 77.67s, tests 101.69s, environment 1.98s)
test:quick: 54.5 s (limit 45.0 s); every command passed
test:quick: over the time limit

$ LC_ALL=C perl -ne '<the gate of agents/spec.md>' $(find src tests config -type f ! -name local.yml) | wc -l
0                                                              (bin/ does not exist in tools/oculus)

$ sh utils/unused-exports.sh  vs  .agents/worktrees/O33-base/unused-exports.txt
< Unused exports (241)            > Unused exports (240)
added only: collectionKeys (normalise.ts, config.ts re-export), read by utils/diagrams/palette.mjs
removed: TEXT_KEY (merge.ts), escapeAppleScript, notify, recoveryCommand, ExecFile

$ npx vitest run tests/checks/source/keys.test.ts --reporter=dot
 Test Files  1 passed (1)      Tests  8 passed (8)

$ npx vitest run tests/routes/hubs/make.test.ts --reporter=verbose
 Test Files  1 passed (1)      Tests  13 passed (13)

$ OCULUS_TEST_HUB=/Users/axelfaes/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts tests/checks/config/config-folder.test.ts --reporter=dot
 Test Files  2 passed (2)      Tests  39 passed (39)

$ env -u OCULUS_TEST_HUB npx vitest run <the same two files> --reporter=default     (exit 0)
stderr | tests/checks/config/integrity.test.ts
integrity: the cases over a real hub skipped, since OCULUS_TEST_HUB is not set
stderr | tests/checks/config/config-folder.test.ts
config-folder: the cases over a real hub skipped, since OCULUS_TEST_HUB is not set
 Test Files  2 passed (2)      Tests  31 passed | 8 skipped (39)

$ npx vitest run tests/state/system/apps/methods.test.ts tests/routes/apps/app-open.test.ts --reporter=verbose
 every page row of the round report's list passes, "a page given twice, answered 400" among them
 Test Files  2 passed (2)      Tests  126 passed (126)

$ npx vitest run tests/checks/config/templates.test.ts tests/checks/config/config.test.ts --reporter=dot
 Test Files  2 passed (2)      Tests  40 passed (40)

$ git diff --stat b80e3a9cd -- tools/oculus/tests/checks/config/template-keys.ts
(nothing: byte-identical to the base, item 9)

$ npx prettier --check <config-folder, integrity, make.test, make.ts, platform.ts, lines.ts, keys.test>
All matched files use Prettier code style!

$ OCULUS_DIR=$PWD/tools/oculus PYTHONDONTWRITEBYTECODE=1 python3 -c '<import gen_figures; compare each of the nine bodies with docs/figures/<name>>'
agent-verdict-axis.svg True ... plan-loop.svg True               (all nine True; nothing written)

$ node probe.ts (make.ts over planted folders, own change log, own home)
1 hub {"status":200,"body":{"ok":true,"written":[".oculus/config.yml",".oculus/data/venues.yml"]}}
1 log {"field":"create","after":["<ws>/f/.oculus/config.yml:file","<ws>/f/.oculus/data:dir"]}     (.oculus held other.txt before the make)
2 project {"status":500,"body":{"error":"failed","written":""}}
2 log {"field":"create","after":["<ws>/g/.oculus:link"]}                                          (.oculus was a dangling link before the make)
3 home=<base>/home/ under {"hub":true,"project":true} itself {"hub":false,"project":false}
3 home=<base>/homelink under {"hub":true,"project":true} itself {"hub":false,"project":false}
3 home=<base>/homelink/ under {"hub":true,"project":true} itself {"hub":false,"project":false}

$ node lines.ts (countLines over a $TMPDIR folder with no repository: shipped entries, node_modules, .scratch, docs/diagrams, tests/, a link)
{"total":{"files":5,"blank":0,"comment":1,"code":5,"todo":1}}

$ node words.ts (platformText over the shipped catalog)
darwin ["Reveal in Finder","Finder could not show it: {0}","Reveal in Finder","Finder could not show it: {0}","show the project folder in Finder","The folder could not be shown in Finder: {0}"]
linux | wsl | null ["Open Containing Folder","The file manager could not open its folder: {0}","Open Containing Folder","The file manager could not open its folder: {0}","open the project folder in the file manager","The file manager could not open the folder: {0}"]
(no key MISSING from the catalog)

$ node a7.ts (behaviorFindings, shipped config/ and a $TMPDIR copy with notify: appended)
shipped [] total 0
with notify [{"key":"notify","message":"key notify is not a key this file takes"}] total 1

$ git grep -n -E "tools/cockpit|/research-cockpit|remove-unicode|project-new|research-hub/tools/oculus" -- ':!tools/oculus/.scratch'   (outside tools/cockpit and feeds/position-leads.yml)
.agents/plan.yaml (1), .agents/skills/{project-cleanup,project-new,remove-unicode,research-cockpit}/..., .oculus/workspaces/research-hub.yml (1)
$ git grep -n -i cockpit -- ':!tools/oculus/.scratch' ':!tools/cockpit' ':!.agents/skills' | wc -l
35   (.agents/plan.yaml:12, README.md:12, 33 feeds/position-leads.yml meta.log lines)
$ /usr/bin/grep -rn -i cockpit .oculus/tasks docs/figures tools/oculus/{src,config,docs,tests,utils,README.md,HELP.md}
(nothing)
```

### Verdicts

What to build, for the whole diff since the base:

- Part 1, the phase A share: holds. The round did not touch it. The repository, `gh` and the plan.yaml split are not applicable here, since they are phase C.
- Part 2(a), the four task files: holds. The round did not change them.
- Part 2(b), the task command and the tray: holds. `app.yml` `no_files` now names the Templates tab.
- Part 2(c), the task-file templates: holds. `docs/templates.md:240-384` has "## Update tasks" with four `### .oculus/tasks/<task>.md` blocks, `<...>` placeholders and nothing of Axel's. The table row `tasks/<task>.md` is at :20. templates.test and config.test pass (40 passed). The `## ...` lines inside the fences are not headings to `[TOC]`, which reads marked's heading list.
- Part 2(d), the texts that named `/research-cockpit`: holds.
- Part 2(e)(f)(g), the hub lines and the tiers: holds. Item 11's README lines are at :28, :53 and :60.
- Part 2, decision 10: violated, and the round brief left it to the orchestrator. `README.md:12` still names `b80e3a9cd` as the last commit that holds the cockpit. The orchestrator writes the id at phase B.
- Part 2, the cockpit wording outside the first path list (item 2): holds. The grep above finds no "cockpit" outside the phase B and phase C paths, `README.md:12` and the meta.log lines.
- Part 2, ROADMAP: holds. The round did not touch it.
- Part 3, Linux and WSL2: holds. Item 14 gives the reveal words per platform, and the words.ts probe above shows them.
- Part 3, notify removed: holds. A7 is reproduced by the a7.ts probe.
- Part 3, the keyring: not applicable (the first review found the premise wrong).
- Part 3, the Lima run: not applicable (phase C).
- Part 4, the README quickstart: holds. Item 16 adds the Linux default `--out` at `README.md:22`.
- Part 5, `OCULUS_TEST_HUB` and the demo hub: holds. The runs with the variable set and unset are above.
- Part 5, the scripts and the texts: holds. The round did not touch them.
- Part 5, the data map: holds.
- Part 5, Make Folder a Hub and Make Folder a Project: hold, with three exceptions:
  - The undo of a failed make can trash a dangling link that was there before the make (Behaviour 1).
  - `HELP.md:489` contradicts :488 (Spec 1).
  - The offers were widened without being raised as a decision (Spec 2).
- Part 5, collection views left out: holds by reading. Seeing it is the look's.
- Part 6, the figures: holds. All nine regenerated bodies equal the files (item 12).
- Part 7, `recover_command`: holds.
- Part 8, `.gitignore`: holds.
- Part 9, `app:release`: holds. `release.ts` now reads `SHIPPED_SOURCES`, so the archives in `release/` are from before the round. Phase C rebuilds them.
- Part 10, the Literature view: holds by reading. The scroll is the look's.
- Part 11, the title bar strip: holds by reading. The round did not touch it.
- Part 12, the Sessions view defects: holds. The round did not touch them; test:quick passes.
- Part 13, the Session view text size: holds by reading. The round did not touch it.
- Part 14, a PDF opened at a page: holds. The G49 rows pass (126 passed).
- Part 15, the Focus page: the order holds by reading. The rest is the look's.
- Folded Step 0 items: hold.

Items of the round brief:

- 1: holds (see part 2(c)).
- 2: holds. The `tools/present` README claims were read against `deck_config.py` `catalog` and `build.py` `slide`, and they agree.
- 3: holds. `make.test.ts` has 13 rows, all passing, covering every row the item asks for.
- 4: holds for the home stop. `make.ts:92` reads `for (let dir = folder; dir !== home; ...)`, with `home` set to `realPath(home) ?? home` at :188. The probe shows that a home given with a trailing slash, through a link, or both, stops the walk. The offer changes that came with it are Spec 2.
- 5: holds (both tables, 126 passed).
- 6: partial.
  - A7 is reproduced by my probe.
  - A9, A10 and A14 hold by the rows of items 3 and 5.
  - The A1 tray half, A2, A8 and A12 rest on the builder's scratch runs, which were deleted; I did not run them again.
  - A8's `a'b` is spelled `'a'"'"'b'` by `shellWord`, where the brief wrote `'a'\''b'`. Both are one shell word holding the key.
- 7: holds in substance. The default reporter prints the reason through the stderr line (run above). The new name suffix shows only under `--reporter=verbose`, as the report says.
- 8: holds. The report places the servers row under G7.
- 9: holds. `templateBlock` is local, and template-keys.ts is identical to the base.
- 10: holds. The audit claim was read at `audit/projects.ts:298-305,356-365`.
- 11: holds.
- 12: holds. `research-programme.svg` changed too (counts 47, 13 and 7), and the report says so.
- 13: partial (Spec 1, Proof 2, Behaviour 1).
- 14: holds. The comments in the Repositories files still say Finder (Standards 2).
- 15: holds (the lines.ts probe above). The fallback also covers a failing git (Behaviour 2).
- 16: holds. `defaultOut` is exported with no importer (Standards 1).

Cases:

- A1: met. The sentence rows pass in test:quick. The tray half rests on the builder's quoted run, which I did not repeat.
- A2: met by the builder's quoted run (not run again by me).
- A3 to A5: met. The rows run in test:quick, which passes.
- A6: met by reading.
- A7: met (a7.ts probe).
- A8: met by the builder's quoted runs (not run again by me), spelled as noted under item 6.
- A9: met (`make.test.ts` rows).
- A10: met (`make.test.ts` rows).
- A11: not verifiable here. It needs the look.
- A12: met for the thresholds by the builder's quoted run. The 400-entry scroll is the look's.
- A13: met by reading. The look settles what is drawn.
- A14: met (126 passed).
- A15: met. The round did not touch it.
- A16: met (in test:quick).
- A17: met (the default reporter run above).
- A18: partial. The archives come from before the round, and starting them is the orchestrator's (phase C).
- A19, phase A form: met. Only the phase B skill files, `.agents/plan.yaml:12`, `.oculus/workspaces/research-hub.yml` (phase C) and the meta.log lines remain.
- A20: met. The round did not change `hubOf`; the first review's run stands.
- A21: not applicable.
- A22: met.
- A23 to A26: not verifiable here. They need the look.
- A27: met by reading for the order. Folding is the look's.

### Findings

#### 1. Spec

- Spec 1. `tools/oculus/HELP.md:488-489`:

  ```
  - Neither is offered on the home folder, whose `.oculus` folder is oculus's own. History undoes a make, as it does New File, by moving what the make wrote to the Trash.
  - A make is not in the change log: History does not undo it, and the files it wrote are deleted from the Files view.
  ```

  - What is wrong: item 13 added :488, but the old :489 was left in place, so the manual states both. The round report's item 13 cites `HELP.md:488` as the place that says so.
  - Failure scenario: a reader of the Hubs and projects section is told on consecutive lines that History does and does not undo a make.
  - Verdict: item 13 partial.

- Spec 2. `make.ts:110-114`:

  ```
  const project = existsSync(join(folder, OWN_MANIFEST)) || existsSync(join(folder, MANIFEST));
  const closed = folder === home || project;
  ... hub: !closed && !inHub(folder, home),
      project: !closed && !existsSync(join(folder, HUB_FILE)),
  ```

  - What is wrong: item 4 asked only for the home stop. Two other offers changed with it:
    - A folder holding `project.yml` is no longer offered Make Folder a Hub.
    - A hub folder is no longer offered Make Folder a Project. The brief's part 5 offers it on any folder "that holds neither `.oculus/project.yml` nor a `project.yml`", and that includes a hub.
  - Both changes are correct behaviour: `manifests.ts:81` returns no project for a hub folder. So a project made in a hub would never be read, and a hub made of a project folder would hide the project.
  - They are written into HELP, DESIGN and the item 4 text. They are not listed among the round's "New decision for the orchestrator", as `agents/spec.md` "No silent design decisions" asks for a departure from the brief.
  - Failure scenario: the orchestrator reads the decision list, misses that a hub folder lost a control the brief granted, and books the brief's shape.
  - Verdict: none on an item. This is a disclosure gap.

#### 2. Proof

- Proof 1. `tests/routes/hubs/make.test.ts:127` uses `])('$name', ...`.
  - What is wrong: vitest prints these titles with quotes (`'an empty folder offers both controls'` in the verbose run). The report's "Row titles for guarded.md" lists them without the quotes, and the round asked for "the exact row titles".
  - Failure scenario: a G1 or G2 Test line copied from the report names a title no test has.
  - Verdict: minor.
- Proof 2. Item 13 has no kept row for the undo of a make.
  - What is wrong: G9 ("Each write is logged, and its undo puts the file back"; Code `changes.ts`, `file-undo.ts`) covers every write kind, and `agents/spec.md` "A test exists only as the test of one entry" asks for one row per write kind. The make's record is held by `make.test.ts` (`after: [{ path: <f>/.oculus, kind: 'dir' }]`). Its undo was shown only in a scratch run that was deleted afterwards.
  - The case the orchestrator asked about, a make into a `.oculus/` that already holds files, has no row. My probe shows it records only `.oculus/config.yml` and `.oculus/data`, which is right.
  - Failure scenario: the dangling-link case of Behaviour 1 passes every kept test.
  - Verdict: item 13 partial. The orchestrator decides whether the row is G9's.

#### 3. Standards

- Standards 1. `src/desktop/package.ts:83`:

  ```
  export function defaultOut(platform: AppPlatform, home: string = homedir()): string {
  ```

  - What is wrong: nothing outside the file imports it (`/usr/bin/grep -rn defaultOut src tests utils` finds only :83 and :179). Knip does not list it because package.ts is an entry file. `agents/spec.md` "The principles every package is judged on" says such an export "is removed or made local". It is the same rule as item 9.
  - Failure scenario: a reader takes it for an API another module uses.
  - Verdict: minor.
- Standards 2. Comments made false by item 14:
  - `src/lib/views/sources/repositories/RepoList.svelte:23-24` ("Reveal in Finder (for a folder that is there)") and :73 ("A repository's folder revealed in Finder.").
  - `src/lib/views/sources/repositories/Repositories.svelte:53-54` ("reveals its folder in Finder ... A reveal Finder refused is said").
  - `src/lib/views/sources/repositories/menus/repo-menu.ts:2-3` ("Reveal in Finder").
  - `src/lib/shell/panes/strip/tab-menu.ts:95` ("Reveal in Finder").

  - What is wrong: on Linux the item reads Open Containing Folder and the file manager answers. `agents/spec.md` "What every package obeys" says a head comment the change makes false is a defect. The builder rewrote the same sentence in tab-menu.ts:3, row-menu.ts:9, ProjectCard.svelte:6 and writes.svelte.ts:338, but not in these.
  - Failure scenario: a maintainer reading the Repositories view is told the reveal is Finder's on every platform.
  - Verdict: minor.
- Standards 3. Process lapses, all disclosed in the report's "Rule lapses this round":
  - Three catalog files were edited by a `python3` replace script, where the round asks for the editor tools.
  - One `git diff --stat` was run in the main checkout. `agents/spec.md` "Where you work" says a builder runs no git command.
  - `npx vitest run tests/checks/source tests/checks/imports tests/checks/tree tests/checks/diagrams` was run over four folders, which the round names a finding.
  - Failure scenario: none of these changed an outcome. My test:quick and the scoped runs pass on the final tree, and the test:quick that was red on prettier at hand-back is green now.
  - Verdict: process findings.
- The COMPUTED_PREFIXES entry, `tests/checks/source/keys.test.ts:388-401` (`file: 'lib/data/places/platform.ts', start: 'text[other]', keys: () => ... platformText(named, 'linux') ...`), is not a loosening:
  - Its keys are computed by running `platformText` itself. If the function stopped reading a `_linux` key, that key would become an orphan and the "has a reader for every catalog key" case would fail. It exempts exactly the six `_linux` keys (words.ts probe).
  - Its `file` and `start` fields match no call, since platform.ts has no `t(`. So `documented()` never uses them and they are inert.
  - The left-hand keys of `FINDER_WORDS` (`platform.ts:62-69`) are held to the catalog by no check. All six exist today (probe: none MISSING).
  - Verdict: none.

#### 4. Behaviour

- Behaviour 1. `make.ts:123-131` (`newPaths`, `!existsSync(join(folder, ...segments.slice(0, at + 1)))`), :211 (`existsSync(join(folder, file))`) and :229 (`await recordMake(target.changes, made);`, which runs after a failure too).
  - What is wrong: `existsSync` follows a link, so a dangling link at `.oculus`, or at any path the make writes, reads as absent. The path is then counted as made, `mkdirSync` or the `wx` create fails, and `recordMake` stamps the link with `lstat` as created. Probe row 2 shows `{"field":"create","after":["<ws>/g/.oculus:link"]}` after a 500 `failed` with nothing written.
  - History's undo of a `create` record trashes every `after` path whose stamp still holds (`edit/writes/file-undo.ts:206-212`). So an undo of that failed make moves the user's pre-existing `.oculus` link to the Trash.
  - This answers the orchestrator's question. For a real `.oculus/` folder that already holds files, nothing that existed before is recorded (probe row 1), and a folder the make created is refused by undo once anything is added to it (`file-changes.ts` folder stamp, `holds`). For a dangling link, yes, it can be trashed.
  - Failure scenario: a project folder whose `.oculus` is a link into a drive that is not mounted. Make Folder a Project answers failed, and History offers an undo that trashes the link.
  - Verdict: item 13 violated in that case, low. The fix is an `lstat`-based existence test in `newPaths` and the `taken` check, or recording only the paths the make itself created.
- Behaviour 2. `src/lib/server/machine/lines.ts:284-287`:

  ```
  const tracked = await trackedFiles(engine, text);
  if (tracked.ok && tracked.value.length > 0) return tracked.value;
  return shippedFiles(engine);
  ```

  - What is wrong: the walk replaces git's list on any git failure, not only in a folder that is no repository. Examples are git missing from PATH and a safe.directory refusal.
  - At the base such a checkout showed "git could not list the tracked files: ...". Now it shows counts silently, without `tests/`, `utils/` or anything else outside `SHIPPED_SOURCES` (lines.ts probe: `tests/t.ts` not counted).
  - Item 15 and Z922 ask for the walk "when git gives no list (a release app's folder is no repository)".
  - Failure scenario: a checkout where git fails shows a smaller line count with no sign that git failed.
  - Verdict: item 15 holds for the release case. This is a low defect for a checkout.

### Declined to judge

- The drawn results are the orchestrator's look on TEST: A11, the 400-entry scroll of A12, A13, A23 to A27, the Make Folder dialog, and Open Containing Folder drawn on a Linux machine.
- I did not repeat the round report's deleted scratch runs for A1 (tray half), A2, A8, A12 and the undo of a make through POST /api/write. The verdicts above say so where they rest on them.
- Whether the undo of a make should be a G9 row, and whether the widened offers stand: the orchestrator's decisions.
- Starting either app, the Lima run, phases B and C, and the release archives, which phase C rebuilds.
- Whether `~/.oculus/config.yml` exists: the limits forbid touching `~/.oculus`. The home stop makes the answer irrelevant to the offer.

Reviewer usage: af442d914d96690a2, claude-opus-5-5, 309,541 tokens, 95 tool uses, 14.6 min.
