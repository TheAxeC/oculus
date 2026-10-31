Brief check of O108, on main at 8e334774d. Nothing was changed: `git status --short` lists the same four .scratch paths before and after. Ports 8787 and 8790 were not touched, and `npm run app:package` was not run, for the reason in F1.

Findings to fix before dispatch: F1, F2, F3, F4, F5, F6, F7, F10. The others are smaller.

## Names

Command: `grep -rn -I -E 'app:package|desktop/package|package\.ts|writeStub|finishSteps|defaultOut' . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.svelte-kit --exclude-dir=.scratch --exclude-dir=.agents --exclude-dir=release --exclude=local.yml --exclude=package-lock.json`

Every hit is in a write-list path:
- package.json:27
- tests/server/desktop/platform-steps.test.ts:3, 10, 13, 18, 44
- tests/server/desktop/script-args.test.ts:1, 2, 8
- src/desktop/release.ts:3, 42
- src/desktop/package.ts (11 lines)

No hit in docs, config, utils, eslint.config.js, tsconfig.json, vite.config.ts or .prettierignore. `build`, `build-app` and `.svelte-kit-app` were inside this grep and gave no hit.

Tree rows under tests/checks: `grep -rn 'desktop' tests/checks` finds no row naming a src/desktop file. boundaries.test.ts:216 and the layer-rows.ts comments name the `desktop` group or the desktop host. tests/checks/config/config-folder.test.ts:293 is the catalog `desktop.yml`.

Hits outside the write list, wider grep:
- F10. `.scratch/migration/agents/guarded.md:299` (G85's Code line) names `src/desktop/package.ts`. It is a live rule file, and the change makes it false. The brief's exclusion of .scratch hides it, and the builder may not edit it. The O108 line says "every mention", so the brief should book this edit for the orchestrator at landing: replace the path with `src/desktop/release-steps.ts`.
- `.agents/plan.yaml` is inside the brief's exclusion of `.agents`. `grep -n` on it finds no hit.
- `.scratch/migration/agents/spec.md` has no hit.
- `.scratch/migration/orchestrator-state.md:936, 945...` (log lines), `.scratch/migration/choices.md:226, 231, 326`, plan.md and the briefs and reviews stay true as history. The change does not make them false. Not checked: the full list of .scratch hits (my listing was cut at 40 files), so the only live ledger files checked are guarded.md, spec.md, the state file, queue.md and choices.md.
- Hub and memory: `grep -rIl -E 'app:package|desktop/package\.ts'` over ~/workspace/research-hub (leaving out projects, side-projects, funding, feeds), ~/workspace/ordo and the memory folder gives no hit. `ls ~/Library/LaunchAgents | grep -i oculus` gives no hit.

## The step line

Plan.md has no Goal section: `grep -n '^#'` gives Steps, Could run in parallel, Rulings, Agents, Blocked. The goal read here is the O108 line (plan.md:1589) plus ruling 612 (plan.md:3377).

| Part of the line | Requirement of "What to build" |
| `npm run app:package` goes | package.json bullet |
| `src/desktop/package.ts` goes | package.ts bullet |
| with every mention of them | release.ts and the two test bullets; guarded.md:299 has none (F10) |
| `npm run app:release` stays the one way | opening paragraph, release-steps.ts |
| ~/Applications/oculus.app replaced | the orchestrator's at landing, per the brief; see F15 |
| `npm run app` stays | opening paragraph; no case checks it (F14) |

Ruling 612's reason is "a launcher that runs the checkout under an app icon is a defect". The launcher-only branch in app.ts (F3) serves that launcher and maps to no requirement.

F15. The replacement has already happened on disk, during this check. My first read showed `main.cjs` holding `import("file:///Users/axelfaes/workspace/oculus/src/desktop/main.ts");`. A later read shows no main.cjs, package.json version 1.0.0 with main `src/desktop/main.ts`, and files dated Oct 31 20:47. Process 26871, started 21:31:09, ran a script on that bundle with this session's scratchpad path in it. It has since exited. The brief still says "at landing", so the brief or the state file should say what is true. The installed app holds an inert `src/desktop/package.ts`, as the v1.0.0 zip does (`git rev-parse v1.0.0^{commit}` equals HEAD; `unzip -l` shows the file). The line names that zip, so this agrees with the line.

## Premises

Reran each command of "What is on the tree".

Holds:
- `grep -n '"app' package.json`: lines 26, 27, 28 as stated.
- The reference grep: package.json:27, release.ts:3 and :42, platform-steps.test.ts:3 and :13, script-args.test.ts:1, :2 and :8, as stated.
- release.ts:32-42 imports the named helpers and types.
- finishSteps is called at platform-steps.test.ts:18 and :44.
- docs/HELP.md:13 and README.md:79 read as stated and stay true.
- `ls docs/adr`: No such file or directory.
- Decision 1: release.ts:148 is an unguarded `await main(...)`.

Wrong:
- F2. `grep -rn -iE 'isPackaged|packaged app' src/desktop src/lib/server/root` is reported as "no hit outside the two scripts". It prints src/desktop/app.ts:91, :342, :360, src/desktop/server/build.ts:6, src/lib/server/root/process/start/first-run.ts:176 and package.ts:152. release.ts has no hit. The narrower claim holds: `app.isPackaged` is true for launcher and release alike, so no code tells them apart. Those lines stay true. The brief should state the hits, and F3 follows from them.
- F4. The description of package.ts omits two things the helpers need: the exported type `Step` (package.ts:44, used by iconSteps, archiveStep, signSteps, runSteps) and the constant `checkout` (package.ts:47, used by electronVersion at :83). "What to build" says "the helpers release.ts imports, and only those, with NAME as the helpers need it", which read literally leaves both behind. Name them. `Step` has no importer outside the file: `grep` finds only package.ts, plus an unrelated local `Step` in tests/server/desktop/window-file.test.ts.

## Cases and checks

- F1, serious. The brief orders "the first run of every case above on the unchanged tree". Case 1 on the unchanged tree really runs package.ts. package.ts:188 takes `defaultOut('darwin')`, which is ~/Applications. :215 runs `rmSync` on ~/Applications/oculus.app. :100 writes a stub importing the worktree's main.ts. That replaces the real app with a launcher pointing at a worktree that is later deleted. It breaks the brief's own "touches nothing outside its worktree, ~/Applications above all" and, after F15, destroys the installed 1.0.0 app. The expected result (npm says the script is missing) is also not the unchanged-tree result. Fix: say that this case's first run is `grep -n '"app:package"' package.json` and that the script is never run on the unchanged tree. Also add `grep`, no `npm run app:package`, to the brief's "never" list.
- F6. Case 6 says "each row kept", and "What to build" says "the `finishSteps` rows go". Verify 4 says "the rows kept". The rows at platform-steps.test.ts:18 and :44-57 cannot be kept. Reword case 6 to "the rows that do not call finishSteps kept, and the macOS and Linux programs checked through iconSteps, signSteps and archiveStep", and dictate the Linux row: `archiveStep('linux', '/apps/oculus-linux-arm64', '/apps/oculus-linux-arm64.tar.gz')` with today's expected args, since nothing else covers archiveStep on Linux.
- F7. Verify 4 asks that each changed test run on the unchanged tree. A test importing `release-steps.ts` cannot load there, since the file does not exist. Say that this run uses the import of `package.ts`, or scope it to the rewritten rows that way.
- F5. The Verify list drops what spec.md requires and the brief says it does not change:
  - `npm run test:quick` once after the last change. O107's brief has it as Verify 1 at briefs/O107.md:106; O108's has no such line.
  - `npm run diagrams` right before it. The brief's "Generated diagrams are left to the landing" contradicts that.
  - `sh utils/unused-exports.sh` compared with the base, "which the brief names". The brief names no base.
  - The history-word grep of comments and titles.
  Add them. Base unused-exports output on this tree: 337 lines, headed "Unused exports (227)" and "Unused exported types (108)", with no line naming desktop. Prediction: `Step` becomes a new line once the file is no script entry, and spec.md makes it local. The diagrams should not change, in my judgment: docs/diagrams/layers.dot draws src/desktop as one node, and package.ts imports nothing from src/lib.
- F11. `grep -c` gives 0 for `platform-steps` and 0 for `script-args` in guarded.md. G85's Test line names no file, and no entry names `scriptArgs`. spec.md says a test exists only as an entry's test, named by file and title. This is already so on the base. It matters here because the brief rewrites both files. Decide before dispatch: name both on G85 at landing if G85 covers them, or bring a new entry for script-args to Axel.
- Cases 3 and 4: run on main, they print `Error: there is no oculus app for the platform nosuch` and `Error: unknown argument --platfrom`. Consistent with the rules file.
- Case 1's wording: `npm run app:nosuch` prints `npm error Missing script: "app:nosuch"`.
- `npx vitest run` of the three files in Verify 2: 3 files, 22 tests passed on main.
- Folder limit: src/desktop holds ten direct items and keeps ten. Size is not an issue.
- No case checks a place the step does not change.
- The write list's report path under .scratch matches O107's form (briefs/O107.md:77).

## The question

- Case 1: can pass with package.ts still there and another launcher script. It proves the script line alone is gone. Case 2 covers the file.
- Case 2: can pass with launcher code kept under other names. The regex holds neither `main.cjs` nor `startedAsProgram`. Add `main\.cjs`, and `startedAsProgram` over src/desktop only, since first-run.ts:268 has its own.
- Cases 3 and 4: pass only if release.ts loads its new import, which is what they are worth. They say nothing about the launcher.
- Case 5: F8. It can pass with the app wrong. `oculus-linux-x64/LICENSE` is Electron's file: `tar -tzf` shows it in the 0.1.0 archive, made before shipped.ts listed LICENSE at 8e334774d, and the app's own is under resources/app. Check `oculus-linux-x64/resources/app/src/desktop/release-steps.ts` listed and `.../package.ts` not listed.
- F9. Nothing runs the macOS path after the move: signSteps and darwin iconSteps run in no case, only as data in a test, and macOS is the app the ruling installs. Add a case `npm run app:release -- --platform darwin --arch arm64` with `unzip -l` for release-steps.ts. Its output lands in the worktree's release/ (release.ts:49, :130), so the zip on main is safe.
- Case 6: can pass with release.ts dropping `signSteps` or running steps in another order. The order lives in release.ts `main`, which no test reaches. Before the step finishSteps was tested, and it served app:package alone, so nothing that covers release.ts is lost.
- Verify 1 to 4: prove formatting and rows, and say nothing of the goal.
- F14. No item checks `npm run app` stays. Add `grep -n '"app"' package.json` to the cases.
- The whole brief can pass with ~/Applications/oculus.app still the launcher, since that part has no check. The landing needs one, for example `test ! -e ~/Applications/oculus.app/Contents/Resources/app/main.cjs` plus a start of the app. Not verified: that the installed app starts and opens the hub.
- F13. "its output byte for byte in the same places" cannot hold for the archive, since the app ships src/ (shipped.ts) and src/desktop changes. Say the same paths and the same printed lines.

## Implied inputs

- F3. `src/desktop/app.ts:353-357` and `config/text/desktop.yml:11` (`desktop.dialog.not_built`: "Run npm run app from the checkout once, then start the app again"). `grep -rn not_built` gives these two lines, no test, no guarded entry. From reading:
  - `npm run app` builds first and exits on a failed build (:342-352).
  - The release ships build-app (`unzip -l` lists build-app/handler.js).
  - So only the launcher reached this branch, and after the step it is dead code telling a release user about a checkout they do not have.
  - Expected: widen the write list to src/desktop/app.ts and config/text/desktop.yml, remove the branch and the key, and leave `appHandler` where it is, as :267 uses it.
  - Decision for the orchestrator, in my judgment remove: a bundle with no handler can only be a damaged one, and the sentence would be wrong there too. Keeping it is the lazy option.
- `app.isPackaged` uses: :91 argv, :342 build, :360 login environment. Each applies to the release unchanged. server/build.ts:6 stays true.
- First-run checks: no launcher dependence. The `stub` hits in first-run.ts:45, :177, :193 are Apple's Command Line Tools git. `packageLacks` reads the engine's lock; the zip lists node_modules/.package-lock.json and package-lock.json. Expected: no change.
- .gitignore: no launcher line. `release/` stays for app:release. Expected: no change.
- Hard-coded file lists: none names package.ts. SHIPPED_SOURCES lists `src` whole. Expected: no change. The new file ships in the next release.
- Engine folder: under the launcher it was the checkout, under the release it is the bundle. Machine values come from the hub's `.oculus/local.yml` (config/local.ts:544) and `~/.oculus` (app.ts:139), so the engine folder holds none of them. `ls config` shows no config/local.yml. A grep for writes naming engine or checkout finds none; the grep is a direct-pattern one, so a write through a variable is not ruled out. credentials.ts:150 reads engine and execPath at each call and stores nothing.
- F12. After the deletions, no caller uses the defaults `platform = process.platform` and `arch = process.arch` (package.ts:70, :76): release.ts:80-81 passes both, and no test calls them. "Moved unchanged" keeps two dead defaults and "on this machine" in their comments. Have the brief drop them and reword.
- `NAME` and `checkout` stay in both release.ts and release-steps.ts. Internal and no worse than today, so no change needed.
- Not verified: that `npm ci` and the Electron download of case 5 work under a builder's sandbox. By the archive times on main each build takes 3 to 5 minutes.

## ADRs

`ls docs/adr`: No such file or directory. `grep -n -i adr .agents/plan.yaml`: no hit. The brief's statement holds, and no ADR touches the step.

## Dictated text

The brief dictates no comment or user-facing line; head comments are described and never quoted. The two refusal strings are expected output and exist as stated: `grep -n` finds package.ts:58 `unknown argument ${name}` and :72 `there is no oculus app for the platform ${platform}`. Holds, and they move unchanged. One caution: the brief's "no longer names" is the brief's prose, and spec.md bans that phrase in a comment.

## Declined to judge

- Whether the v1.0.0 archive should be rebuilt without the inert package.ts: the line names that zip, so it stays Axel's and the orchestrator's.
- Whether G85's wording "the packager makes" should change, beyond its Code line.
- Whether the installed app works with Axel's hub, which needs a start and a look.

Usage: a0fc607785681fa26, claude-opus-5-5, 166795 tokens, 21 tool uses, 7.5 minutes

## Closed

F1 case 1's first run is a grep, and the brief forbids the script on the unchanged tree. F2 premise rewritten. F3 `app.ts` and `desktop.yml` added to the paths, the branch and key go. F4 `Step` and `checkout` named. F5 `npm run diagrams`, `npm run test:quick`, `utils/unused-exports.sh` and the history grep added. F6 case and Linux row rewritten. F7 first run through the `package.ts` import. F8 case checks `release-steps.ts` under `resources/app`. F9 darwin build case added. F10 and F11 `guarded.md` G85 is the orchestrator's at landing. F12 the two defaults go. F13 wording changed. F14 `npm run app` case added. F15 the brief says the app is already replaced.
