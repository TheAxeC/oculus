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

The recheck of the brief's premises after S5 and D37 landed (27 premises corrected in `agents/briefs/D11.md`): ordo-high on claude-opus-5-5 (a19c3aa50c4a82888), 163,037 tokens, 196 tool uses, 27.7 min.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

Names:
- N1: "Paths this step writes" gains `tools/oculus/package.json` (`"@vscode/debugprotocol": "1.68.0"` in `devDependencies`) and `tools/oculus/package-lock.json` (as `npm install --save-dev --save-exact @vscode/debugprotocol@1.68.0` writes it); "Libraries checked" names the entry and the two files.
- N2: the write list gains `src/lib/server/core/channels.ts` lines 12-17, and section 10 has the head comment name `debug-console` beside `pty:` and `files` with what its merge does.
- N3: the write list gains `DESIGN.md` line 245; section 2 says the session reads `locals.server.local.riteDapBin` afresh at each launch and dictates the clause DESIGN.md:245 gains; "What is on the tree" lists DESIGN.md:245 among the paragraphs to mark.
- N4: the write list's `options.yml` range becomes lines 707-712; section 2 dictates the `approvals` entry's new first sentence naming debug launches.
- N5: the write list gains `DESIGN.md` line 279; section 10 has its `routes/views.ts:68-80` citation follow `registerCollections`; "What is on the tree" lists it.
- N6: section 7 puts the `server.debug.*` sentences in `config/text/server.yml`, a `debug:` group after `commands:`, and the page's keys alone in `debug.yml`; the write list gains `config/text/server.yml`; case 65 covers the new group.
- N7: a new "Shared paths" section says D11 is prepared once S5 and H3 have landed (Z455) and that the line numbers of `options.yml`, `app.yml:12`, HELP.md and DESIGN.md are read again at preparation; section 2 gives the `rite_dap_bin` entry S5's `section: Programs` (`S5.md:308`, no `heading:` per `S5.md:89`), the write-list line says so.
- N8: "Shared paths" says D11 edits `config/text/app.yml` line 12 as H3 leaves it; the write-list line says so.

The step line:
- S1: Decision 20 cites Z447 to Z450 as ruled, each (a), with the choice each fixes.
- S2: "Libraries checked" says `@vscode/debugadapter-testsupport` is not taken as ruled by Z448 (`plan.md:1165`); the O2 wording is gone.
- S3: "What is on the tree" gains a bullet listing Z447 to Z450 and Z454 to Z457 with where each applies; sections 2 (Z447), 3 (Z448), 6 (Z449, Z450) cite them beside the choice they fix.
- S4: a new section "The look" says the live debug look needs `rite_dap_bin` set in `config/local.yml`, which only Axel sets, that the orchestrator raises it at landing, and that no agent opens or edits `local.yml`; by Z467 it lists the real cases the look exercises (`a.rite`, `frame.rite`, cathedra's `utils/example.rite`, a run to its end, a file that does not read, a launch with `before`).
- S5: section 11 gives each listed 4j row a fixed choice for HELP.md, VS Code's default unless the brief already said otherwise (`closeReadonlyTabsOnEnd`, `console.closeOnEnd`, `console.collapseIdenticalLines`, `console.acceptSuggestionOnEnter`, `console.historySuggestions`, `focusWindowOnBreak`, `gutterMiddleClickAction`, `hideLauncherWhileDebugging`, `openExplorerOnEnd`, `showBreakpointsInOverviewRuler`, `showInlineBreakpointCandidates`, `showVariableTypes`, `internalConsoleOptions`); sections 6, 7 and 9 build the ones that are behaviour (`window.focus()` on a break, the history list, Enter, the collapsed lines, Start shown, middle click), and cases 84 and 85 check two of them.

Premises:
- P1: "What is on the tree" is read on main at 3dccf6a8c, the head after X3f was taken back out of main (`git log --oneline -1`); its first bullet says D11 is prepared once S5 and H3 have landed, the worktree and base copy cut at main's head after both, and every number read again then; the base copy line takes `<base>` written at preparation. With X3f off main the X3f-moved premises are as the brief had them at 6005baee6 and are now cited from 3dccf6a8c: Source.svelte 502 lines, `language` at :199, `extension` at :204-210, the mount at :437-459; sources `Editor.svelte` 266; `views/sources/source` 10 items (`git ls-tree --name-only 3dccf6a8c <folder>/ | wc -l`). Every `plan.md` line is the one `grep -n` prints at 3dccf6a8c, named by its ruling (478, 479, 480, 508, 656, 744, 759, 761, 764, 911, 1165-1168, 1173-1176, 1187); "What it must do" and the write list name 3dccf6a8c. The Z74 inventory ranges are `:1149-1188` and `:1687-1688`. "Shared paths" names X3f, back with its builder (Z465), with the lines its saved patch changes in Source.svelte, sources `Editor.svelte`, HELP.md and DESIGN.md, each apart from D11's.
- P2: `tests/server/machine` 6 (counted with `git ls-tree --name-only 3dccf6a8c <folder>/ | wc -l`, the command now named); `LOCAL_KEYS` at `local.ts:108-127`; capabilities at `debug_dap.cpp:182-191`; `probe.mjs` 38 lines; the README line says the grep prints 9, 15 and 36, none about project commands or debugging.
- P3: "What is on the tree" states the extension's real behaviour (`extension.js:50-59` and `:61-63`); section 1 makes `program` required in a named configuration with the finding "is required: name the .rite file to run, or ${file} for the file on screen"; Decision 4 is rewritten to that; case 70 added.
- P4: section 7's Add Configuration creates `.oculus/` and `launch.yml` through the file operations store's `create({ root, path }, '.oculus/launch.yml', false)` (`state/sources/explorer/ops.svelte.ts:369-378`), the `/api/ops` `create` op of `data/file-ops.ts:113` (`createItem`, `server/files/fs/ops.ts:394-416`), then writes the text through `/api/source` and reads it back; "What is on the tree" records the create op and why the source route cannot create; read item 19 added; case 79 added.
- P5: sections 4 and 6 take `repo` as `repositoryOf` decides: the deepest git repository under a served root, else the served root, so a `.rite` file under a served root with no repository launches from that root; one under neither is refused with "<path> is under no root the file browser serves, so it cannot be debugged"; "What is on the tree" records `repositoryOf`; cases 19 and 75.
- P6: "What is on the tree" records the `<undefined>` Module entries; sections 7 and 8 apply Z457 (a): the hover evaluates only a word a scope of the selected frame holds, a watch and a console line evaluate as typed, Variables shows what the adapter answers.
- P7: "What is on the tree" records that `finishFrame` acts as `continue` outside a debug frame and quotes `frame.rite`, a program with a debug frame of two rows, whose probe run (`scratchpad/dap/frame/step.mjs`) printed two stops with `continue` and one with `finishFrame`; case 41 is rewritten onto it.

Cases and checks:
- Case 31: its expected result is the finding `local.yml: rite_dap_bin must be a non-empty string`, as the `hpc_host` row reads; the per-key default is named as the work Z454 gave Q119, which Z468 folded into S5, so it lands with S5 before D11 is prepared, and no row of D11 asserts it.
- Case 2: section 6 has Start post the warning notice "Open a .rite file to debug" as `commands.svelte.ts:668-671` posts `commands.no_file`; the case expects that notice; "What is on the tree" records the precedent.
- Case 49: rewritten: a launch from the picker and by F5 while running gives "A debug session is running: stop it first"; section 3 says the refusal holds whichever surface asked, and section 9 says F5 gives it.
- Case 3: section 4 says the relaunch after the approval does not run `before` again; case 3 expects one task terminal.
- Case 62: section 9 says a debug key the handler answers is swallowed, that the seven keys are swallowed whenever a session is starting, running or paused or a `.rite` tab has the focus, overlay open or not, and do nothing under an overlay; case 62 is rewritten to that.
- The G7 test: section 3 gives the session holder an injected `spawn`; the tests paragraph says the G7 test runs on a recording fake in `npm test`, and that a real-process test, if any, is tagged slow and run by `npx vitest run`; verify item 4 says how each is run.
- Verify item 3: replaced by spec.md's perl ASCII gate, byte for byte (compared with `diff` of the two `grep -o` extracts, which printed nothing).
- Verify item 5: it covers cases 1 to 85 and routes the DOM parts of cases 1, 2, 36, 44, 51, 52, 58, 59, 60, 61, 62 and the new 79, 82, 84, 85 to the look by name, their non-DOM parts staying quoted runs.

The question:
- Verify item 5: closed by the look routing above.
- Case 41: closed by P7.
- The look under Z447: closed by S4.
- Case 53: section 5 makes `start` an absolute line number and says how a page subscribed across the cap drops its oldest lines and the dropped count; case 53 asks `first` 2,000 from the GET, and case 81 checks a subscribed page.

Implied inputs:
- I1: case 71, refused with "Only a .rite file that exists can be debugged: <path>" (section 4).
- I2: section 1 says `cwd` takes no placeholder, as a command's does; case 72 expects `folderOf`'s "must be a folder of the repository that exists".
- I3: section 1 has wrong types found as `typeProblems` finds them, with its sentence table passed in; case 73.
- I4: section 1 checks `before` by `nameProblem`; case 74.
- I5: closed by P5; case 75.
- I6: section 4 dictates the field checks and their sentences (path, lines, 10,000 per path, empty expression, unknown frame), each a 400 `{ error }` as `refuse` answers; case 76.
- I7: the commands store gains `afterPress(listener)` with outcomes `started`, `refused` and `dropped`, the store keeping the press each question belongs to; the debug store drops a waiting launch at a cancel ("The launch is dropped: the command <name> was not approved") and at a refusal ("The launch is dropped: the command <name> did not start"); case 29 extended, case 77 added.
- I8: section 6 drops a waiting launch whose terminal leaves the `sessions` list with `exit` null, with "The launch is dropped: the terminal of <name> closed before the command ended"; case 78.
- I9: closed with case 3 above.
- I10: closed with case 53 above.
- I11: closed by P6 (Z457); case 82.
- I12: closed with case 62 above.
- I13: closed by P4; case 79.
- I14: section 6 has the store keep the text it sent to `saveSourceDraft` and read `sourceDraft(id)` after, a draft whose `saved` is not that text stopping the launch with its `message`; "What is on the tree" records why `failed` alone does not tell; case 80.

Dictated text:
- D11.md:162 (case 5): the program findings are dictated without the construction; case 5 now expects "leads above the repository; name a .rite file inside it".

Declined to judge:
- The default configuration's approval: Z456 applied in section 4, decision 21 and the DESIGN.md:153 line of section 11; cases 1, 75 and 83.
- The `<undefined>` Module entries: Z457 applied (P6).
- `server.debug.*` in a view fragment: closed by N6.
- F9 to F11 on macOS: "The look" has the look press F9, F10 and F11 on macOS and say whether each reached the page.

Dictated lines added or rewritten after the check, each read against spec.md's prose rules (plain, ASCII, no em dash, no "not X but Y", no history) and the hub's YAML and Markdown rules; each holds:
- `grep -n "is required: name the .rite file"`, `grep -n "must be a path relative to the repository"`, `grep -n "leads above the repository; name"`, `grep -n "must name a file of the repository that exists"`, `grep -n "\"must name a .rite file\""`, `grep -n "may hold only the placeholders"`: the six program findings. Holds.
- `grep -n "must not hold a tab, a line break"` and `grep -n "must be a map of the fields"`: the existing `nameProblem` and `typeProblems` sentences, quoted. Holds.
- `grep -n "rite_dap_bin:$"`: the `options.yml` entry, description as the check held it plus `section: Programs`; `yaml.safe_load` of it parses. Holds.
- `grep -n "texts of the project commands and debug launches"`: the `approvals` sentence. Holds.
- `grep -n "nothing, since the debug session reads it"`: the DESIGN.md:245 clause. Holds.
- `grep -n "path must be an absolute path"`, `grep -n "lines must be whole numbers"`, `grep -n "lines must hold at most"`, `grep -n "Type an expression to evaluate"`, `grep -n "in this pause"`: the route's field refusals. Holds.
- `grep -n "Only a .rite file that exists"` and `grep -n "is under no root the file browser serves"`: the launch refusals. Holds.
- `grep -n "Open a .rite file to debug"`: the Start notice. Holds.
- `grep -n "The launch is dropped"`: the three waiting-launch sentences. Holds.
- `grep -n "Debug the open file"`: the default configuration's question, the picker name of the created entry, and the convention list. Holds.
- `grep -n "program: \${file}$"`: the three-line YAML Add Configuration writes; `yaml.safe_load` gives `{'configurations': [{'name': 'Debug the open file', 'program': '${file}'}]}`. Holds.
- `grep -n "(def-trait P"`: the `frame.rite` program quoted for case 41, a code block of rite, read whole; its probe run is quoted above. Holds.

The brief after these changes: 541 lines (`wc -l`), no character outside printable ASCII (`LC_ALL=C grep -c '[^ -~]'` prints 0), no inline spaced hyphen (`grep -n "[^ ] - \|[^ ] -- "` prints nothing).
