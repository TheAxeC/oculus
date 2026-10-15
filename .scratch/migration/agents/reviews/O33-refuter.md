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
