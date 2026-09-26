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
