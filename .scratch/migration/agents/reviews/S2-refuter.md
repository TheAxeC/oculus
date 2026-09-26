# Step S2 refuter report (on .agents/worktrees/S2, base 0249f8f9)

## Verification (rerun by the reviewer)
All commands were run from the worktree's tools/oculus.
- `npx vitest run --reporter=dot`: `Test Files 1 failed | 319 passed (320)`, `Tests 1 failed | 5023 passed (5024)`. The one failure is `tests/views/system/help.test.ts:255`, where `n` is missing from HELP.md. This matches the report.
- `npm run check`: `COMPLETED 1429 FILES 0 ERRORS 0 WARNINGS`.
- `npm run build`: exit 0.
- `npm run format:check`: clean.
- `npm run lint`: exit 0.
- ASCII perl gate: printed nothing.
- `size-check`: 0. `folder-check`: 0.
- `npm run diagrams` run twice: the content hash of `docs/diagrams/*` is `3629e641...` before, after run 1 and after run 2.
- Browser suite:
  - The step's specs (sessions/, session-tabs, tasks, latex, changes, repositories, sanitise): `49 passed (1.1m)`.
  - The whole suite: `394 passed (6.1m)`.
- revert-check, unit files (26 files, in three batches): 47 + 100 + 40 = `187 reverts, 0 unproven`, and 19 + 0 + 266 = 285 unchecked. This matches the report.
- revert-check, browser specs. Each file was retried whenever another run held port 8792, and every directive came back red at least once:
  - composer: 2 of 2, over 6 tries
  - session-list: 2 of 2
  - sessions-page: 4 of 4
  - tasks: 2
  - latex: 1
  - agents: 3
  - session-tabs: 12, over 3 tries with disjoint unproven sets
  - repositories: 2 red, 10 unchecked
- Check 11:
  - The TMPDIR `oculus-*` count was 1 before; after my runs only other builders' `oculus-revert-*` directories were left, and after the full suite there were none.
  - `tmux ls | grep -c oculus-` was 0 before and 0 after.
  - `ps` showed no tmux process after my runs.
  - The worktree still has 85 modified and 32 untracked entries; nothing new was added.

## 1. Spec
1. **Brief decision 1 is not done and not reported.** The brief says the composer shows the chosen workspace's branch read-only. `grep -n branch src/lib/views/sessions/terminal/Composer.svelte src/lib/views/shared/sessions/WorkspacePicker.svelte` prints nothing.
2. **Item 7 is built in a different form.**
   - The brief says the Files view "roots it at the pane's session's workspace (as Changes follows the selection or its pinned session)".
   - `Files.svelte:167-172` follows `selected()` only, with no pinned session.
   - `fs.ts` `followView` draws the whole root that holds the workspace, opened down to it (`roots: [found.root]` plus `followRevealed`). It is not rooted at the workspace.
   - The test `sessions-page.spec.ts:91` asserts `hub:projects` inside the hub root, which is the substitute shape.
3. **Item 6: items outside a served root open in a new view, and one report duty is missing.**
   - `Customizations.svelte` opens an item outside a served root in a new `customization` view (`CustomizationView.svelte:6`), not in a source tab. The report lists the view id as a decision but not the reason the brief's shape could not be built (an account folder is served by no root). That reason is a premise of the brief found wrong.
   - The brief requires the report to name the files looked in for Tools. The report does not.
   - Tools are counted from settings `permissions` rules (`customizations.ts:326-349`), a reading the report does not state.
   - The browser case covers only the viewer path. The source-tab path of `open()` has no browser case.
4. **Item 8: the report's claim does not hold.** It says "SessionPicker.svelte (new) is in the toolbar of every session view". Terminal.svelte does not import it (`grep "import .*SessionPicker" src` lists Transcript, Timeline, SessionDetail and Agents only). Changes (held by X3b) is not named as the exception either.
5. **Item 4, the disabled box.** For a selected session running outside oculus, the Terminal view draws a new-session composer under a sentence (`Terminal.svelte:361-367`), not the disabled steer box the brief asks for. The disabled box appears only in Transcript, and in Terminal only for a `foreign` terminal.
6. **Item 9, the look.**
   - Only the workspace headers are measured under every theme (`sessions-page.spec.ts:159-183`). Rows and the composer are measured in the default theme only, and the Customizations section is not measured at all.
   - "Legible" is asserted as alpha > 0 (`:181`), which any non-transparent colour passes.
7. **Verify item 9, the account.** The brief asks the spec to check that the argv carries the chosen model, effort, mode and account. `composer.spec.ts:83-84` asserts only model and effort with the default mode. The account (`env -u` or `-e CLAUDE_CONFIG_DIR`) is not asserted in any browser case: the stand-in records argv, not the environment.
8. **A field the brief said to report was worked around instead.** The brief says a field a session record needs is reported, since X3b holds `model-sessions.ts`. Instead:
   - The diff adds side types `ListedSession = GroupedSession & { top?: boolean }` and `SizedAgent = SessionAgent & { tokens?: number }` (`model-agents.ts:109,115`).
   - It reads them by casts: `folds.ts` `isTop` uses `(row as ListedSession).top`, and `agentTokens` uses `(agent as SizedAgent).tokens`.
   - The report does not name either field as needed in `model-sessions.ts`.
9. **Test files in X3b's area were edited.**
   - `tests/browser/views/changes.spec.ts:92-97`: the `showChanges` helper was rewritten. The report flags this one.
   - `tests/browser/sources/repositories.spec.ts:7-8, 16, 25, 191-193` was also edited, and the report lists it under modified tests without flagging it as shared with X3b.
10. **User-visible shapes the report does not list:**
    - `top` as a new key in `~/.oculus/sessions.json` (`overrides.ts:3-4, 21-22`). The report names only a "row-menu key".
    - The POST `/api/terminal` actions `compose`, `steer`, `interrupt` and `fork` (`routes.ts:433-453`).
    - `format=markdown` on GET `/api/transcript` (`transcript-routes.ts:57`).
    - The instance-state fields `composer` (`composer.ts:34`), `custom` (`composer.ts:217`), and `states` / `agents` / `query` (`folds.ts` `listFilterOf`).
    - The drag type `application/x-oculus-file` (`fs.ts` `FILE_DRAG`).
11. **Archive now applies to live sessions, and a comment is now false.**
    - `session-list.ts:31-35` offers Archive on every row. The base offered dismiss on ended rows only (base `SessionWorkspace.svelte` `{#if !entry.live}` around the hide button).
    - `overrides.ts:6-7`, "a dismissal hides a session that has ended and nothing else", is now false.
    - Neither is in the report.
12. **A change no item asks for, reported as a fix of a defect the base did not have.**
    - The Confirm was extracted into `tree/RemoveRoot.svelte`.
    - The report calls it "A defect fix in RemoveRoot.svelte: the confirm cleared `root` before calling onremove, so no root was ever removed".
    - The base `Files.svelte` read the key first (`const key = removing; removing = ''; void remove(key);`), so the defect did not exist in the base. The claim is false.

## 2. Proof
1. **The prompt never passes through a shell (confirmed).**
   - `tmux.ts` `run()` uses `execFile` with a list.
   - `startArgs` (`sessions.ts:299-314`) puts `--` and then the argv words as separate arguments to `new-session`. tmux 3.7c runs a command of more than one word directly, and a one-word command through `sh -c`.
   - `compose.ts:182` always appends `'--', prompt`, so any start with a prompt is at least 3 words.
   - The browser case asserts the argv byte for byte and that the marker file was never created, and its revert is red.
   - Residual case: an argv of exactly one word still goes through `sh -c`. This happens with a non-default account, a catalog edited so every list passes nothing, and an empty prompt, which leaves `[claudeBin]` alone. No prompt is involved, but `claude_bin` is then read by a shell. Not stated.
2. **A head comment is now false.** `sessions.ts:6-8` says "Nothing on the page reaches a command line here ... what the page typed goes out only through `send-keys -l`". The composer's prompt now reaches the command line as an argv word, and the `env` names and values come from the start request (`-e`). `sessions.ts:1-2`, "the four commands that start, resize, stop and capture one", omits steer and interrupt.
3. **A changed test case names no revert.** `repositories.spec.ts:171` ("makes a worktree, lists it, and takes it away again") gained assertions at `:191-193` and has no revert directive. revert-check lists it as `unchecked`. The report's "repositories 85 and 106" are directives of other cases (`:133` and `:385`) that this step did not change.
4. **Exemptions added to pass checks:**
   - `tests/checks/tree/allow-duplication.txt` adds two lines: `changes.test.ts` against the new `views-fixture.ts` (`4a0a2db8c231`, `0edfb98461da`).
   - `tests/ui/wall.test.ts` adds two SOLID exemptions, Composer `.box` and SteerBox `.box`.
   - Both are exemptions that make a check pass, which the brief's conventions forbid. The report does not mention either.
5. **A fallback and a duplicated helper.**
   - `transcript-routes.ts` `words()` falls back to the raw key when the catalog lacks it, and the route falls back to an empty catalog (`catalogFor?.() ?? {}`). That writes keys into the exported file instead of failing.
   - It duplicates `words()` of `pty/chat.ts`, which `routes.ts` already imports: the same helper exists twice.
6. **Check 11 cannot see the run's own tmux server.**
   - `tmux ls` asks the default server only.
   - `serve.ts` ends the run's server on `exit` and in `removeOnExit`. A run killed by SIGKILL leaves a tmux server on a socket whose directory is then deleted, so it is unreachable.
   - The report does not state this hazard, and the check the report quotes would not catch it. Nothing was left over after my runs (`ps` showed no tmux process).
7. **The relative time never updates.** `SessionList.svelte:75` sets `const now = Date.now()` once at mount, so "Xm ago" stays frozen for as long as the view is open. No test exercises it.

## 3. Standards
1. **Raw control.** `SessionWorkspace.svelte:125` draws a raw `<button class="pick">` in rewritten markup. The rules file requires every control a reader presses to be a `ui/` primitive.
2. **HELP.md sentences the change makes false, which the Doc text does not give:**
   - `HELP.md:103`, "live ones first": the list now orders pinned, then needs-input, then newest, and hides archived rows.
   - `HELP.md:105`: a new Terminal tab "starts a terminal of its own", but it now shows the composer and steer box.
   - `HELP.md:89` (files) omits the follow toggle.
   - The Doc text gives only the `n` row.
3. **A catalog string is now wrong.** `config/text/views/sessions/session-list.yml` keeps `dismiss_failed: could not save that dismissal`, and `SessionList.svelte:179` shows it for an archive failure.

## 4. Behaviour
1. **The default agent changed, and the report does not state it.** The composer's default agent is Claude (`composer.ts:39`); the base start form defaulted to Shell (base `Terminal.svelte` `let kind = $state('shell')`).
2. **Resume changed for the default account, stated without before and after.** Resume and fork of a default-account session now run under `env -u CLAUDE_CONFIG_DIR` or `env -u CODEX_HOME` (`routes.ts` `sessionAccount`). Before, they inherited whatever the tmux server's environment held. The report lists this as a decision only.
3. **Archive can now hide live sessions** (section 1 item 11). This is not in the report's before and after.
4. **The browser suite now runs a real tmux on its own socket.**
   - What makes it safe: the `serve.ts` wrapper execs the machine's tmux with `-S <run>/tmux.sock` ahead of `"$@"`, and production code passes no `-S` (`grep socket src/lib/server` shows only the test option). `endServedTerminals` goes through the same wrapper.
   - What I observed: no default-server session before or after, and no tmux process after the runs.
   - Also host-visible, and not stated in the report: the suite now runs a real `zsh` and executes a typed command (`echo`) under the run's HOME.
   - The SIGKILL hazard is in section 2 item 6.

## Not checked
- Whether the real `claude` and `codex` accept `--` before the prompt, and the Codex `model_reasoning_effort` values. The report marks both not verified.
- The on-screen look in Axel's Chrome.
- The codex image `-i` path end to end in a browser.
- Unit-test coverage of the parser findings per line, beyond revert-check going red.

Reviewer usage: about 90k tokens, 60 tool uses, 85 minutes.

## Repair round 1, refuted

Commands rerun from the worktree's tools/oculus, with summary lines verbatim:
- c1 `npx vitest run --reporter=dot`: `Test Files  1 failed | 319 passed (320)`, `Tests  1 failed | 5042 passed (5043)`. The only failure is the expected one: `tests/views/system/help.test.ts > the manual itself > holds every key of the sheet in its table` (`expected [ 'n' ] to deeply equal []`).
- c2 `npm run check`: `COMPLETED 1431 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- c3 `npm run build`: `build exit 0`
- c4 `npm run format:check`: `All matched files use Prettier code style!`
- c5 `npm run lint`: `lint exit 0`
- c6 ASCII perl gate: printed nothing, `ascii exit 0`
- c7: `size 0`, `folder 0`
- c8 `npm run diagrams` twice: `first 34b1a9f44a31cfd9d9a15b74e05e2fc5e1d95c84`, `second 34b1a9f44a31cfd9d9a15b74e05e2fc5e1d95c84`. The hash before either run was the same.
- c9 build, then `npx playwright test`: `399 passed (6.3m)`, `playwright exit 0`
- Revert checks:
  - Unit files (follow.test, session-list.test, compose.test, routes/sessions/transcript.test): `52 reverts, 0 unproven, 5 unchecked`. The 5 unchecked are base cases of transcript.test that this step did not change.
  - Browser (sessions-page.spec, composer.spec): `16 reverts, 0 unproven, 0 unchecked`.
  - Every revert the round report claims for items 2, 6, 7, 11, 13 and 16 came back red.
- c11: `BEFORE tmp=0 tmux=0 sock=0` and `AFTER tmp=0 tmux=0 sock=0`, where sock is `ps -axo command | grep -c "[t]mux.*-S $TMPDIR/oculus-browser-"`. After the revert runs the counts were still 0/0/0. The worktree holds 112 modified and 34 untracked entries, and my runs did not change them.

Closures checked and found to hold:
- Item 2: `followView` makes the workspace folder the head row, and the rows above it are gone. The browser case asserts `hub:page-spec` as the head, no `hub:` row, the pin holding, and the unpin going back to the selection.
- Item 13: the composer's start is always an array, and `vector()` puts `env` in front of a one-word command. The string commands that remain are the base's own (chat, task, latex, redownload).
- Item 15: allow-duplication.txt only loses lines. wall.test.ts adds no SOLID key. The two `.pick:hover, .hide:hover` keys are renamed to `.row:hover` for the rewritten markup, with the same count and reason.
- Item 16: `words()` exists once and throws on a missing key, and the route refuses an export when no catalog is handed to it.
- Item 17: `endLeftoverTmux` only runs `tmux -S <dir>/tmux.sock kill-server`. It does so for a socket file inside a `$TMPDIR/oculus-browser-*` directory, and never without `-S`. The server's environment does not pass `TMUX`, so the user's default tmux server cannot be reached.
- Items 11, 12, 18, 19 and 21 hold on read.

Findings:
- **Standards: HELP.md:89, :103 and :105 (the round report's Doc text, item 20).** Each of these three lines is a table row: `| files | Files | ... |`, `| session-list | Sessions | ... |` and `| terminal | Terminal | ... |`. The Doc text says "Replace :89 with", and likewise for :103 and :105, but each replacement is a bare prose sentence with no cells. Applied as written, it would delete the `files`, `session-list` and `terminal` rows of the view table, including the whole long description in the `files` row. The brief asks for "the current line as `grep -n` prints it and its replacement", and the Doc text quotes none of the current lines.
- **Proof: sessions-page.spec.ts, item 6.**
  - The contrast case turns the wallpaper off (`wallpaper(page, false)`) before it measures anything, and turns it back on at the end. The wallpaper is on by default.
  - Item 15's closure makes the Composer `.box` and SteerBox `.box` `background: transparent` under `body.wall` (Composer.svelte:409-411, SteerBox.svelte:163-165). So the surface the composer's words actually sit on by default is never measured under any theme.
  - `inked()` only measures elements that have their own text nodes. The prompt box's placeholder is therefore never measured, and neither is any SVG glyph.
- **Proof: Menu.svelte and MenuOpener.svelte `inherit` (item 6's "the menu glyph through Menu `inherit`").**
  - The fix is `.opener.bare.inherit { color: inherit; }`, set by `SessionWorkspace.svelte:170`.
  - No case names a revert of it. The contrast case cannot see the glyph, because it is an SVG with no text node.
  - The claimed defect fix to this new ui prop is therefore not proven.
- **Behaviour: Tree.svelte `rootActions`, reached through item 2's head row.**
  - In follow mode the head row is the workspace folder (named, for example, `page-spec`), but its actions are still the root's.
  - Its Collapse-all collapses the whole enclosing root.
  - Its Remove-root, drawn for any root that is not fixed, removes the whole enclosing root rather than anything named by the row it sits on. The control's title names the root key.
  - This case is not reported and not tested.
- **Proof: round report "Correction to the first report (item 12)".** It says "Files.svelte is 540 lines, the .svelte limit, which is the same count as the base". `git show 0249f8f9:tools/oculus/src/lib/views/sources/files/Files.svelte | wc -l` prints 531. The file now sits exactly at the 540 limit that `bin/size-check.sh:29` enforces.
- **Standards: pty/sessions.ts:8-9, head comment (item 14).**
  - It says a composer start carries "the account as one `-e NAME=folder` pair".
  - For the default account no `-e` pair is passed. Instead `env -u CLAUDE_CONFIG_DIR` or `env -u CODEX_HOME` leads the argv (compose.ts:128-131).
  - The sentence is false for the default case.
- **Standards: overrides.ts `setFlag(sessionId, flag, hidden, path)`.** The parameter that now sets any flag, `top` included, is still named `hidden`.

## Not checked
- The on-screen look in Axel's Chrome.
- Whether the real `claude` and `codex` CLIs accept `--` before the prompt, and the Codex `model_reasoning_effort` values.
- The browser revert directives of the other specs this round changed (session-list.spec, session-tabs.spec, repositories.spec, files.spec and the remapped ones). Only sessions-page.spec and composer.spec were rerun.
- The round-0 eslint-disable lines (the three `no-control-regex` in sessions.ts, compose.ts and agents.ts, and the one `no-dynamic-delete` in overrides.ts), weighed against the no-exemption rule. These predate this round.

Reviewer usage: about 75k tokens, 45 tool uses, 40 minutes.

## Closed

- The first run's findings: closed by the repair round, each closure read and reproduced by the run over the round above.
- HELP.md :89, :103 and :105: fixed at landing, the three table rows keep their `files`, `session-list` and `terminal` cells with the new text in them.
- sessions-page.spec contrast case: fixed at landing, `inked()` measures words, an empty field's placeholder and each top-level SVG glyph, composited over the wallpaper's dimmed range (black and the dimmed white) under every rice theme with the wallpaper on, and over the plain ground under every theme with it off; 4.5:1 for text and 3:1 for a glyph.
- Menu and MenuOpener `inherit`: fixed at landing, the contrast case names the revert `MenuOpener.svelte:138 => delete` and it comes back red.
- Tree.svelte `rootActions` in follow mode: fixed at landing, the head row's Collapse-all closes the folders under the workspace folder (`collapseRoot(expanded, root, from)`), its title names the folder, and Remove is not drawn for a followed root (`fixedRootKeys(roots, following)`); unit cases in `explorer.test.ts` and `fs-shape.test.ts`, a browser assertion in the follow case.
- Files.svelte size: fixed at landing, 538 lines under the 540 limit.
- pty/sessions.ts head comment: fixed at landing, it names `env -u NAME` for the default account.
- overrides.ts `setFlag`: fixed at landing, the parameter is `on`, and a `without()` helper replaces the two `no-dynamic-delete` exemptions of that function.
- Not checked by the round, checked at landing: the real `claude` (2.1.283) takes `--` before a prompt (`claude -p --no-session-persistence --model claude-haiku-4-5-20251001 -- "mcp: reply with the single word OK"` printed `OK`), and `codex` (0.155.1) takes the word after `--` as its prompt (`codex -- --help` went on to `Error: stdin is not a terminal` instead of printing help).
