# Step D11 brief check (on main at c204afbbc)

This is the report of the fresh agent run under the `spec` skill's "Steps / The brief check", on `agents/briefs/D11.md`, the working copy (430 lines). Main moved while the check ran. `git log --oneline ec4c6f577..HEAD` prints `b68058ce4 Land X3f, ...` and `c204afbbc Send D37's repair round 1`. Every premise below is read at c204afbbc unless a line says otherwise.

I ran probes against `~/workspace/cathedra/bin/debug/rite_dap`. They used the orchestrator's `scratchpad/dap/probe.mjs` and `probe2.mjs` plus two small variants of mine, `scratchpad/briefcheck-D11/hover.mjs` and `finish.mjs`. Afterwards `pgrep -fl rite_dap` exits 1. No repository file was changed: `git status --short` lists only the orchestrator's own D11.md, X3e.md and X3e-brief-check.md.

## 1. Names

- **`data/model/model-processes.ts`, renamed `model-machine.ts`.** Command: `git grep -n "model-processes" -- . ':!config/local.yml'`, run from tools/oculus.
  - Outside the ledger it hits only `src/lib/data/model/index.ts:500`, which is in the paths. There is no hit outside the paths.
- **`Editor.svelte` `breakpoints` prop type and `breakpointDecorations(lines)`.** Command: `git grep -n "breakpoint" -- src tests config`.
  - It hits only `ui/controls/editor/Editor.svelte:47,98-99,137,175,204,364-370`, `gutter/gutter.ts:4,169-171` and `gutter/marks.css:2,38-42`, all in the paths. There is no hit outside the paths.
- **`nameProblem` and `folderOf` exported, and the shared YAML-list reader split out of `readCommandsFile`.** Command: `git grep -n "readCommandsFile"`.
  - `src/lib/server/machine/commands/list.ts:10,20` is outside the paths. The signature is kept, so it stays true.
- **`registerCollections` skipping a built-in id.**
  - `src/routes/+page.svelte:35,68,92`: the call sites are unchanged, so they stay true.
  - `tests/checks/config/config-folder.test.ts:485,530` and `tests/checks/source/keys.test.ts:38`: they stay true, since no configured key collides. A `python3` read of `config/sources.yml` lists the collections as data, venues, pillars, domains, statements, funding, events, education, applications, joint-work, tasks and code.
  - `DESIGN.md:279` cites "`routes/views.ts:68-80`" as the lines of `registerCollections`. The guard moves those lines, and DESIGN.md:279 is outside the write list. That citation becomes stale.
- **`s1-s3`.** Command: `git grep -n "s1-s3"`. It hits `HELP.md:69` and `config/text/app.yml:12`, both in the paths. For the clash with H3 on app.yml:12, see "Paths shared with the steps in flight" below.
- **`LEFT_ITEMS` and the `debug` status id.** There is no hit outside `shell/status/status-items.ts:14,30,33`.
- **The `rite_dap_bin` local key: the prose that lists every local key.**
  - `DESIGN.md:245` lists, key by key, what a change of `local.yml` rebuilds ("`claude_bin` the usage refresh and the usage watcher; `open_bin` the opener; ..."). With the new key that list is incomplete. The line is outside the write list (DESIGN.md 114, 153, 328, 358-431), and the dictated options sentence "A change is read again at once." rests on it.
  - `config/catalogs/options.yml`, the `approvals` entry just above `claude_bin` (line 707), says "the texts of the project commands a reader approved". Debug launch texts will be kept in the same file, so the sentence becomes incomplete. The write list covers options.yml lines 709-712 only.
- **The `debug-console` merge.** The head comment at `src/lib/server/core/channels.ts:12-17` names the channels that register a merge (`pty:` and `files`), so a third makes it incomplete. The brief lists `channels.ts:12-17` among the head comments to mark, but `channels.ts` is not in "Paths this step writes".
- **The new dependency.** Section "Libraries checked" says "the builder adds it as a dependency". Neither `tools/oculus/package.json` nor `package-lock.json` is in "Paths this step writes".
- **`server.debug.*` sentences in `config/text/views/system/machine/debug.yml` (D11.md:127).**
  - `grep -rn "^    server:" config/text/views` prints nothing. Every `server.*` key lives in `config/text/server.yml`, D17's `server.commands.*` included (server.yml:15-22).
  - spec.md "What every package obeys" says "a new key joins its group where that group already is, and a group is never declared in two". Declaring `server` in a view fragment is the first such case.

**Paths shared with the steps in flight.** Command: `awk` over each brief's "Paths this step writes", plus `diff -u` of D37's built files against D37-base.

- **X3f.** Landed at b68058ce4 (`git log`), so there is no merge. D11's base must be at or after it (see Premises).
- **D37 (repair round 1).**
  - `state/sessions/terminal/commands.svelte.ts`: D37's built diff adds a head-comment paragraph at :31-32 and `ranCommand` after `record()` at :527, and edits `note`, `readEnded` and `commandDiagnostics`. D11 changes `settle` and `answer` (:469-520) and the store's type and return object. The hunks are separate, so the merge is simple. The exception is if D11 rewrites the head paragraph D37 extends; then that paragraph is merged by hand.
  - `state/client/context.ts`: D37's built diff leaves it unchanged, and D11 adds beside the commands store (:408-430). Simple.
  - HELP.md, DESIGN.md and `docs/diagrams`: D37 names no lines. The diagrams are regenerated.
- **S5.**
  - `server/root/context.ts`: S5 works at :303-310. D11 works at the interface (:105-180), the hub (:286-296) and `close` (:471-490). Simple.
  - `config/catalogs/options.yml` is **not simple**. S5 gives every local.yml entry a `section:` (S5.md:308: claude_bin and open_bin under "Programs"), which edits the very entries at :709-712 that D11 inserts `rite_dap_bin` after. Those are adjacent hunks. It is also an order dependency: after S5, D11's new entry needs `section: Programs`.
  - HELP.md: S5 changes 154, 157, 261 and 274; D11 changes 276 and 282. One unchanged line separates 274 and 276. Simple.
  - DESIGN.md: S5 changes 85 and 408. 408 is inside D11's 358-431 range. Simple if D11's new decision entry is not placed beside 408.
- **H3.**
  - `config/text/app.yml` line 12 is **not simple**. It is one physical line of 1,683 characters (`awk 'NR==12{print length}'`). H3 rewrites `h1-h5` to `h1-h6` in it (H3.md:154). D11 rewrites `s1-s3` and adds the F-key rows in it. That is a git conflict on the same line, merged by hand at landing.
  - HELP.md: H3 changes 19 and 74 (the h1-h5 row). D11 changes 69 and inserts new rows inside 54-95. Simple only if D11's rows are not placed beside 74.
- **D42.**
  - `data/model/index.ts`: D42 adds `GitFileCommit` beside `GitCommit` (:425), and D11 changes :500. Simple.
  - HELP.md, DESIGN.md and diagrams: no lines named.
- **X3e (queued, brief prepared).** All of these merge simply:
  - `server/root/context.ts`: X3e at :282 and :353-358.
  - `options.yml`: X3e changes the sources.yml entry.
  - `glyphs.yml` and `icons.yml`: X3e adds `head`. Simple if the alphabetical places differ.
  - `config/text/app.yml`: X3e changes the `palette:` group, not line 12.
  - `Source.svelte`: X3e changes the load effect; D11 changes the Editor props.

Findings:
- N1. The write list lacks `package.json` and `package-lock.json`, which the dependency `@vscode/debugprotocol` needs.
- N2. The write list lacks `src/lib/server/core/channels.ts`, whose head comment (:12-17) the new merge makes incomplete.
- N3. `DESIGN.md:245` is made incomplete by `rite_dap_bin` and is outside the write list. The brief does not say that the session reads `local.riteDapBin` at each launch, which is what makes "A change is read again at once" true.
- N4. The `approvals` description in `options.yml` (line 707) is made incomplete by the debug-launch texts, and it is outside the write list.
- N5. `DESIGN.md:279`'s citation of `routes/views.ts:68-80` goes stale with the guard, and the line is outside the write list.
- N6. `server.debug.*` is declared in a view fragment while the `server` group lives in `config/text/server.yml`. That is against spec.md's catalog-group rule, and against the D17 precedent.
- N7. `options.yml` with S5 is not a simple merge: adjacent hunks at the claude_bin and open_bin entries, and a `section:` key the new entry needs after S5.
- N8. `config/text/app.yml:12` with H3 is not a simple merge: the same physical line.

## 2. The step line

The step line is plan.md:478 at c204afbbc.

- "a Debug Adapter Protocol client over cathedra's `rite_dap`": section 3 (`wire.ts`, `session.ts`) and section 2 (the adapter key).
- "breakpoints": sections 6, 7 (Breakpoints) and 8.
- "stepping": section 4 (the actions), section 7 (the toolbar) and section 9 (the keys).
- "variables": section 3 (the published state) and section 7 (Variables).
- "the console": section 5 and section 7 (Console).
- "launch configurations in a repository's `.oculus/launch.yml`, no form (Z92 (1) (a))": sections 1, 4, 6 and 7 (the picker).
- The widening at plan.md:479:
  - "console uses the terminal's font and wraps": section 7 Console and section 11.
  - "editor takes the focus on a break": section 6.
  - "no compounds and no server-ready action": section 11.
- Step 0 at plan.md:480: D17 is ticked at plan.md:508.
- Z447 to Z450 (plan.md:1163-1166) are served in substance by section 2 (`rite_dap_bin`), section 3 (hand-written `wire.ts` on the LA17 types), section 6 (localStorage `oculus.debug.v1`) and section 6 (`before` by the `depends_on` rule).

Findings:
- S1. Decision 20 (D11.md:341-345) still reads as open. It says: "Four choices are the user's and went to the orchestrator as open items with this brief; the brief is written with the recommendation of each, which automode takes unless the ruling differs, in which case the brief is amended before dispatch". The four are ruled as Z447 (a), Z448 (a), Z449 (a) and Z450 (a), at plan.md:1163-1166.
- S2. "Libraries checked" (D11.md:350) ends "Not taken (open item O2)." It should cite Z448, and the section should record Z448 as the ruling for the transport capability.
- S3. "What is on the tree" (D11.md:12) lists the rulings the step rests on without Z447 to Z450 (or Z191). Sections 2, 3 and 6 cite none of Z447, Z448, Z449 or Z450 beside the choice each one fixes.
- S4. Z447 records a consequence the brief does not carry: "a live debug look on TEST then needs Axel to set the key in his local.yml, since `rite_dap` is not on PATH". Neither the report's "before and after" nor anything about the look says so. Agents never edit `local.yml`.
- S5. Decision 19 says the fixed choices for the `debug.*` settings "are those of section 11". `Z74-inventory.md` 4j rows with no fixed choice written in section 11 or anywhere else in the brief:
  - `closeReadonlyTabsOnEnd`
  - `console.closeOnEnd`
  - `console.collapseIdenticalLines`
  - `console.acceptSuggestionOnEnter` and `console.historySuggestions`
  - `focusWindowOnBreak`
  - `gutterMiddleClickAction`
  - `hideLauncherWhileDebugging`
  - `openExplorerOnEnd`
  - `showBreakpointsInOverviewRuler`
  - `showInlineBreakpointCandidates`
  - `showVariableTypes`
  - `internalConsoleOptions`, beyond "opened at a session's start"

  The Settings ruling (plan.md:742) asks every other behaviour to be one fixed choice written in DESIGN.md or HELP.md.

## 3. Premises

The base:

- `git diff --name-only 6005baee6 HEAD -- tools/oculus` lists X3f's landing: 41 code, config, diagram and document files. The brief's "read on main at 6005baee6" and its base copy (`git archive 6005baee6`) are stale. The following D11 premises changed:
  - `views/sources/source/Source.svelte` is 508 lines (`git show HEAD:... | wc -l`); the brief says 502. `language` is at :203 (brief :199), `extension` at :208 (brief :203-209), and the `<Editor` mount at :443-466 (brief :437-461).
  - `views/sources/source/Editor.svelte` is 267 lines (brief 266).
  - `views/sources/source` holds 9 tracked items (`git ls-tree --name-only HEAD`); the brief says 10.
  - Every plan.md line number the brief cites has moved (`grep -n` on plan.md):

    | The brief cites | At c204afbbc |
    |---|---|
    | 474 | 478 |
    | 475 | 479 |
    | 476 | 480 |
    | 504 | 508 |
    | 650 | 654 |
    | 738 | 742 |
    | 753 | 757 |
    | 755 | 759 |
    | 758 | 762 |

    Z447 to Z450 are at 1163-1166.
  - X3f's HELP.md changes (49, 120, 159, 161, 167) and DESIGN.md changes (305 to 427) are single-line replacements (`git diff -U0`), so the HELP and DESIGN line numbers the brief cites still hold.

Facts that match (each by `wc -l`, `grep -n` or `sed -n` on the file named):

- `docs/adr` is absent ("No such file or directory"), and `tools/oculus/docs` holds only `diagrams`.
- `git grep -n "rite_dap\|launch.yml\|'debug'" -- src tests config` exits 1. The `find ~/workspace -maxdepth 4` for launch.yml and commands.yml prints nothing.
- The adapter:
  - `bin/debug/rite_dap` is 10,426,376 bytes, and `bin/release/rite_dap` is executable.
  - `which rite_dap` exits 1, and `--version` prints `rite 0.0.0`.
  - The `main.cpp:60-96` and `:80-95` behaviour holds.
  - At `debug_dap.cpp`: `:198` holds `cmdLaunch {}`, `:373` holds the pause refusal, `:375-384` holds `disconnect` and `terminate` continuing the script, and `:391-410` holds the request table. `:516-517` holds the stop's pump loop.
  - The events grep shows only initialized, output, stopped, continued and terminated.
- The probe reruns printed the brief's lines 17 to 27 for:
  - the capabilities;
  - "pending: the module is not loaded yet";
  - the stopped bodies with `hitBreakpointIds`;
  - the frames;
  - scopes 1 and 1048577;
  - the `a`, `b` and Module variables;
  - `(+ a b)` giving `"3"` and `nope` giving the error;
  - `next` to line 9;
  - the finished console line;
  - exit 0;
  - the missing, `bad` and `err` stderr lines, each with exit 0.
- cathedra's `.vscode/launch.json` and `tasks.json` match the brief.
- `listCommands('/Users/axelfaes/workspace/cathedra')`, run with node v24.21.0, prints the four found `cmake` commands and `[]`.
- The D17 files: `files.ts` (241 lines; `nameProblem` :70-77, `folderOf` :84-102, `collect` :130-187, `readCommandsFile` :198-241), `placeholders.ts` (104 lines; `NAMES` :22-30, `valueOf` :37-57, `fillPlaceholders` :71-104), `resolve.ts:5-7`, `approvals.ts` (139 lines; `chainText` :66-68), `commands.svelte.ts` (719 lines; `settle` :469-482, `press` :484-491, `answer` :505-520), `model-sessions.ts:325-328`, `terminals.svelte.ts:274-293`, and `CommandAsk.svelte` (50 lines) mounted at `Workbench.svelte:349` (431 lines).
- The editor: `Editor.svelte` (496 lines; :98-99, :108, :116, :118, :175, :204, :285, :364-370), `marks.css:36-50` (a 10px `var(--c-red)` dot) and `types.ts:84-88`.
- `channels.ts` (200 lines; merge :12-17), `auth.ts:69` (`hasToken`), `commands/routes.ts:16` (`tokenedBody`), `+page.svelte:177-190`, `model-processes.ts` (40 lines), `index.ts:500`, `shapes.ts:36,64`, `payloads.ts:63`, `entities.svelte.ts:94`.
- `context.ts` (732 lines; :106-180, :471-490), `local.ts` (376 lines; :137, :282-283), `options.yml:709-712`, `status-items.ts:14`, `StatusBar.svelte` (226 lines), `derive.ts:212-215` with `ratio` at :89, `DropLayer.svelte:116`, `keys.ts` (228 lines; `defaultCommand` :95), `workbench-keys.svelte.ts:181,192-193`.
- `views.ts:46-49,68-82`, `registry.ts:169-171`, `normalise.ts:82-89`, `guarded.md` G1 :7-9, G7 :25-27, G13 :71-73.
- The parity rows `vscode-parity.md:43,136-146` and the Z74 Cut rows at 1687-1688.
- The folder counts in the brief, apart from the two noted in Findings.
- The libraries:
  - `npm view @vscode/debugprotocol`: 1.68.0, MIT, typings `./lib/debugProtocol`, 135,006 bytes, released 2024-10-03.
  - `npm pack @vscode/debugadapter-testsupport@1.68.0`: `protocolClient.js` is 98 lines, `JSON.parse(body)` is at :82, and `protocolClient.d.ts:14` declares `protected connect`.
  - `node-debugprotocol-client` is 0.5.1, modified 2022-11-13.
  - `vscode-jsonrpc` is 9.0.3, modified 2026-09-25.
  - All twelve lucide icons exist under `node_modules/lucide-static/icons`.

Findings:
- P1. The base (6005baee6) and every X3f-moved premise listed above. The worktree and base copy are cut at main's head after X3f, so these numbers need updating.
- P2. Small premise errors:
  - `tests/server/machine` holds 6 items (`git ls-tree --name-only HEAD`); the brief says 8.
  - `LOCAL_KEYS` is at `local.ts:108-127`; the brief says `:112-129`.
  - The capabilities are at `debug_dap.cpp:182-191`; the brief says `:182-190`.
  - `probe.mjs` is 38 lines (`wc -l`); the brief says "40-line".
  - `grep -n -i "debug\|command" README.md` prints lines 9, 15 and 36 (the word "command"); the brief says it "names neither". The conclusion "still true" holds.
- P3. The brief's account of cathedra's extension is false. D11.md:28 says it "takes `program` as `${file}` when absent", and Decision 4 rests on "as cathedra's VS Code extension does".
  - `utils/vscode-rite/extension.js:50-59` fills `program` from the active editor only when there is no launch configuration at all (`!config.type && !config.request && !config.name`).
  - A configuration without `program` is refused, at :61-63: "rite: this launch configuration has no `program` (a .rite file)."
  - Decision 4's reason does not hold. Its option (b), `program` required, is what that extension does for a named configuration.
- P4. Add Configuration "written through the file write route the source tab saves through" (section 7) cannot create the file.
  - `src/lib/server/files/source.ts:157-161` answers 404 "the file is not there" for a missing path, and its head comment at :3 says it "resolves its existing file".
  - Creating `.oculus/launch.yml`, and `.oculus/` when it is absent, needs another route, for example the ops `create` op (`src/lib/data/file-ops.ts:113`).
- P5. The no-repository launch contradicts the route's repository check.
  - Sections 4 and 6 say "the file's own folder when no repository holds it".
  - POST `/api/debug`'s `repo` goes through `repositoryOf` (`commands/repo.ts:11-27`), which refuses a folder that is neither a served root nor holds `.git` ("repo is not a served root or a git repository").
- P6. An adapter fact the brief omits: a failed `evaluate` of an undefined name adds that name to the frame's Module scope as `<undefined>`.
  - `hover.mjs` evaluated `probe`, `defn`, `println`, `let`, `add` and `+` at line 8. Module then read `add = <closure>`, `x = 1`, `probe = <undefined>`, `defn = <undefined>` and `let = <undefined>`.
  - `probe2.mjs` showed `nope = <undefined>` in Module after evaluating `nope`.
  - A hover over a comment word or a special form, a watch on `nope` (case 45), or a console line therefore changes what Variables shows (cases 36 and 37).
- P7. `finishFrame` outside a game frame acts as `continue`. ADR 0073's debug frame is an ECS frame, not a call frame. `finish.mjs`, with breakpoints at 3 and 9, printed `FINISH true` at `add` line 3 and then stopped at line 9 with `hitBreakpointIds [2]`.

## 4. Cases and checks

- Cases 5 to 20, 21 to 24, 25 to 28, 30, 32 to 35, 37 to 40, 42, 43, 46 to 48, 50 to 57, 59 to 61 and 63 to 69 are consistent with the rules file and the standards.
- Case 31 is inconsistent with the tree, and with G13 as the code behaves.
  - `checkLocal` (`local.ts:368-376`) answers the sentence. `loadLocal` throws on the first bad key (`filledAt`, :163-172), and `loadLocalOrDefaults` then uses every default (:349-359).
  - No per-key "default `rite_dap` used" exists. This is the clash open item Z443 (Q119) names for `settings.ts`, here for `local.ts`.
  - The case's checkable result is the row sentence `local.yml: rite_dap_bin must be a non-empty string`, as the `hpc_host` row of `local.test.ts` reads.
- Case 2 names a sentence ("Open a .rite file to debug") and a surface ("the status bar says") that no section of "What to build" gives. The tree's precedent for a refused key press is `notices.post(t('commands.no_file'), { tone: 'warning' })` (`commands.svelte.ts:668-671`).
- Case 49 ("F5 while running: nothing") contradicts section 9 ("F5 starts, or continues while paused"). Read by section 9, F5 while running gives section 3's refusal sentence.
- Case 3: section 4's "the page asks and posts `approve` ... and launches again" leaves open whether the second launch runs `before` again. The case expects one run.
- Case 62 ("Keys while a Confirm is open: nothing") is undetermined. Section 9 has the keys answer only under no overlay, so under an overlay the browser default runs; F5 reloads the page in Chrome off macOS. The brief does not say the keys are swallowed.
- The tests. The G7 test (`tests/server/machine/debug/session.test.ts`) is not said to inject the spawn.
  - If it starts a real process it must be tagged slow (spec.md "What every package obeys": "one that cannot (a real process, a timer, a network wait) is tagged slow"; README.md:15).
  - `npm test` and `test:quick` then do not run it, and the brief's verify item 4 does not say how it is run.
- Verify item 3 uses `LC_ALL=C grep -n '[^ -~]'`. spec.md "The ASCII gate" says the perl check replaces the grep form wherever a brief names it.
- Verify item 5 asks quoted runs of cases 1 to 69. spec.md "What every package obeys" says "A behaviour that needs a DOM (a press, a focus, an effect) is seen at the look on landing". Cases 1, 2, 36 (the focus and the execution line), 44, 51, 52 and 58 to 62 are such behaviours, and the brief names none of them as proved by the look.

Findings: case 31; case 2; case 49 against section 9; case 3's second `before`; case 62's browser default; the G7 test's real-or-injected spawn and slow tag; verify item 3's character-set check; verify item 5 without the look routing.

## 5. The question

"The goal" here is: a reader debugs a `.rite` program from oculus as from VS Code's Run and Debug.

- Verify item 5 (the quoted runs of cases 1 to 69): yes. Runs at the store and route level can pass while the Debug view, the gutter dots, the execution line and the focus are never drawn.
- Case 41 (Finish Frame): yes. On `a.rite`, `finishFrame` and `continue` behave alike (P7), so the case passes with Finish Frame wired to `continue`.
- The landing look: yes. Without `rite_dap_bin` in Axel's `local.yml` (Z447), the look sees the views idle and a launch ending in ENOENT, never a pause.
- Case 53: yes. It checks the server's held console only. A subscribed page's appends across the 10,000-line cap are untested, and `start`'s meaning there is unspecified.
- Cases 36 and 37: no, they could not pass without the goal. Their fixed Module lists may fail for the adapter reason in P6.
- The G1, G7 and G13 tests: no. Each fails with its guard removed, as verify item 4 states. The G13 row is subject to case 31's correction.
- Verify item 7 (contrast) and cases 21 to 24 (approval texts and hashes): no.
- Cases 5 to 16 (the launch file reader): no.
- Cases 17 to 20 (launch-time fill and argv): no.

Findings: verify item 5; case 41; the look under Z447; case 53.

## 6. Implied inputs

This is a code step. These inputs are implied but missing from "Cases":

- I1. A configuration with `program: ${file}` and a `.md` tab on screen. Expected: refused with the sentence naming the path, by section 4's `.rite` rule.
- I2. `cwd: ${workspaceFolder}`, the value cathedra's own `.vscode/launch.json` uses. Expected: unstated. Under `folderOf` it is the finding "must be a folder of the repository that exists".
- I3. A field of the wrong type (`program: 5`, `cwd: [a]`, `before: 3`, `name: 7`) and an entry that is not a map. Expected: one finding per field as `typeProblems` words them ("must be text", "must be a map of the fields").
- I4. `before: ""` and a `before` holding a tab. Expected: a finding at `configurations[n].before`.
- I5. A `.rite` file under a served root that no git repository holds. The expected result contradicts the repository check (P5).
- I6. POST bodies with:
  - a breakpoint path that is relative, or under no served root;
  - lines 0, negative, fractional, or an unbounded list;
  - an unknown `frame` id;
  - an empty `evaluate` expression.

  Expected: a 400 or the adapter's refusal, unstated.
- I7. A cancel at the `before` command's approval (case 29), and a refused `before` press (a chain error, a placeholder with no value).
  - `press` answers `false` for both an asked approval and a refusal (`commands.svelte.ts:484-491` with `settle` :469-482), and `answer(false)` returns with no event (:505-508).
  - The only new hook, `afterStart`, never fires, so the waiting launch is never released. The next F5 then answers "A launch is waiting on <name>".
  - Expected: the launch dropped at the cancel and at the refusal, through a named mechanism.
- I8. The `before` task terminal closed or killed before its line exits, so it leaves the list with no `exit`. Expected: the waiting launch dropped with a sentence.
- I9. The relaunch after the launch's approval: whether `before` runs again (case 3).
- I10. Console appends across the 10,000-line cap with a page subscribed. It is unstated whether `start` is absolute or an index into the current buffer.
- I11. A hover, watch or console evaluate of an undefined word. Expected: a choice about the `<undefined>` Module entries it creates (P6).
- I12. The F5, F9, F10 and F11 keys with an overlay open or the focus where the handler does not answer. Expected: swallowed, or the browser default stated.
- I13. Add Configuration in a repository with no `.oculus/` folder (every scratch repository). Expected: folder and file created, but through a route that can do it (P4).
- I14. An unsaved `.rite` tab whose save is refused as `readonly`, `binary` or `truncated`.
  - Case 61 covers only the changed-on-disk refusal.
  - `saveSourceDraft` (`state/sessions/source.svelte.ts:414-458`) answers `void` and writes the refusal into the draft.
  - The brief should name that the debug store reads `sourceDraft(id).failed` and `message` after the save.

Findings: I1 to I14.

## 7. ADRs

- `.agents/plan.yaml` has no `adr` key, so the folder is `docs/adr`. `ls /Users/axelfaes/workspace/research-hub/docs/adr` prints "No such file or directory". There is no record.
- cathedra's ADR 0070 and ADR 0073 govern the adapter, not oculus. The brief names them as such.

Findings: none.

## 8. Dictated text

| Line | Text | Verdict |
|---|---|---|
| 70 (`grep -n "is not a key of a launch"`) | "is not a key of a launch configuration: name, program, cwd and before are" | holds |
| 76 (`grep -n "The rite debug adapter that"`) | the `options.yml` description | holds as prose; "A change is read again at once." is true only with N3 closed |
| 82 (`grep -n "is not JSON"`) | "rite_dap sent a message that is not JSON" | holds |
| 83 (`grep -n "could not be started"`) | "rite_dap could not be started: <error>. Set rite_dap_bin in config/local.yml to the adapter's path." and "rite_dap ended with signal <name>" | hold |
| 86 (`grep -n "A debug session is running"`) | "A debug session is running: stop it first" | holds |
| 87 | `rite_dap <program> (pid <pid>)` | holds |
| 95 (`grep -n "No debug session is paused"`) | "No debug session is paused" | holds |
| 98 (`grep -n "launch.yml lists no configuration"`) | "launch.yml lists no configuration that reads; its findings are in the Debug view" | holds; "reads" follows the house usage |
| 112 (`grep -n "ended with exit code"`) | "The command <name> ended with exit code <n>.", "before names <name>, which is not a command of this repository", "A launch is waiting on <name>", "Debug Anyway", "Show Errors", "Abort" | hold |
| 121 (`grep -n "Paused on breakpoint"`) | "Paused on breakpoint", "Paused after a step", "Running", "Ended: <sentence>" | hold |
| 123 (`grep -n "not available"`) | "not available" | holds |
| 138 (`grep -n "Run the debug configuration"`) | "Run the debug configuration <name>?", "Approve and Debug", "Cancel", "Stop rite_dap <program> (pid <pid>)?", "Stop" | hold |
| 139 | "Debug" | holds |
| 159 (`grep -n "Open a .rite file to debug"`) | "Open a .rite file to debug" | holds as prose; its surface is the case 2 finding |
| 162 (`grep -n "not one above it"`) | "must be a .rite file inside the repository, not one above it" | breaks spec.md "The working rules that bind every package", prose: "no 'not X but Y' construction (state the thing directly)" |
| 174 | "No value for ${file}: open a file in a source tab first" | holds; the existing `server.yml:20` sentence |
| 260 (`grep -n "starts the adapter with the program"`) | 'refuses a request without the write token' and 'starts the adapter with the program as one argument and no shell' | hold; no history words |
| 394 | "Debug", "Debug Console", "Run the open file", "Add Configuration", "Finish Frame", "Debug Anyway", "Show Errors", "Abort", "Approve and Debug" | hold |

The line-162 sentence follows the precedent of `folderOf`'s "must be a folder inside the repository, not one above it" (`files.ts:92`), which shares the construction.

Findings: D11.md:162's sentence breaks the spec's prose rule against "not X but Y".

## Declined to judge

- Whether a launch with no `.oculus/launch.yml` may run with no approval question (section 4). This is the user's call.
  - `DESIGN.md:153` names "a debug launch" among the processes that need approval, with no qualification. Z92 says "A launch runs after the approval DESIGN.md's Processes rule already requires".
  - What is certain: the brief takes this choice in section 4 without an entry under "Decisions taken", and the DESIGN.md:153 rewrite must state it.
- How to treat the adapter's `<undefined>` Module entries (P6): filter them in the client, hover only names a scope holds, or a cathedra fix. This is a design choice, and cathedra is read-only here.
- Whether `server.debug.*` in a view fragment breaks the catalog-group rule (N6). It depends on what "group" means: `views.*` already spans many files, and `server.*` does not.
- Whether F9 to F11 reach the page on macOS, where they are system shortcuts. A read cannot settle it.

Agent usage: ordo-high on claude-opus-5-5 (a0e68a55e2b7c6f81), 338,752 tokens, 125 tool uses, 18.5 min.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- <left for the session>
