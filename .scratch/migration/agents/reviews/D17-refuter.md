# D17 refutation (project commands), round 0

## Verification lines, verbatim

`cd /Users/axelfaes/workspace/research-hub/.agents/worktrees/D17/tools/oculus && PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` (load average 10.94 at the start, 9 min 21 s wall). The full log is 776 lines, most of it `vite build` chunk tables. These are the command headers and result lines:

```
$ npm test
fatal: Needed a single revision
 Test Files  517 passed | 24 skipped (541)
      Tests  12813 passed | 639 skipped (13452)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  446 passed | 9 skipped (455)
$ npm run check
1790966903088 COMPLETED 3174 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
✓ built in 25.77s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit 0
```

The `fatal: Needed a single revision` line is stderr from some test's git call; it did not fail a test.

The report's own evidence, rerun in the same form:
- `npx vitest run tests/server/machine/pty/task.test.ts tests/server/machine/pty/sessions.test.ts` (both on the private `-S` socket the fixture makes) printed `Test Files  2 passed (2)` and `Tests  27 passed (27)`, exit 0. This matches the report.
- `wc -l src/lib/state/sessions/terminals.svelte.ts src/lib/server/machine/pty/routes.ts src/lib/server/machine/pty/sessions.ts` printed 898, 567, 655. This matches the report.
- `sh utils/folder-check.sh` exited 0. This matches the report.
- Judgment call 3 says `state/sessions` may not import `state/workbench`. This reproduces: `tests/checks/imports/order.ts:59-63` lists `state/workbench` above `state/sessions`.
- The 84 mutation runs and the first runs on the unchanged tree were not rerun. No decision of mine rests on them.

## Item verdicts ("What to build")

1. **Command sources: violated, on naming only.** Reading, zod schemas, the order, the findings, `cwd` containment and the found commands all hold (`commands/files.ts`, `saved.ts`, `found.ts`, `list.ts`). The brief names the found presets `cmake: <n>`. The code names build presets `cmake build: <n>` and test presets `ctest: <n>` (found.ts:107-115), and the report does not list this as a decision. See Spec 4.
2. **One shell quoting: holds.** There is one definition, `pty/shell-word.ts:10`. `routes.ts`, `chat.ts` and `refresh.ts` import it, and `grep -rn "function shellWord" src` finds only that file.
3. **Placeholders: holds.** `commands/placeholders.ts`. `Source.svelte` publishes the file and the selection through `editor-status`.
4. **Approvals: violated.** The file shape, the key, writing by rename, reading back and refusing over a bad file all hold. Two parts do not:
   - The 0700 folder is only made when the module creates the folder (approvals.ts:104). See Behaviour 4.
   - Each text of a chain is hashed separately (run.ts:85-88, approvals.ts:50-52). A changed chain whose texts were each approved before therefore does not ask again, against "so a changed `cwd`, line or chain asks again". See Spec 6.
5. **Routes: holds.** `commands/routes.ts`, `routes/api/commands/+server.ts`, the token, the write chain, the change log, zod bodies, and 400 before any read.
6. **The run: holds.** For plain commands the line form is exactly the brief's (chain.test.ts:66-72). There are two additions no item asks for, Spec 5 and Spec 7.
7. **Task terminal and result: holds.** `remain-on-exit` and `@oculus_task` are set in the same invocation (sessions.ts `taskArgs`). `task`, `exit` and `job` come before `#{pid}`. Polling happens while a task runs. The check and cross, Rerun and Restart, and the close rules are built.
8. **Errors made clickable: violated.** Diagnostics come only from output a mounted grid receives (D17-A, disclosed). Z298 (a) closed it, and the repair is not in the diff. Relative paths in a chain also resolve against the wrong folder (Behaviour 2).
9. **Default build and test keys: holds.** `shell/keys/keys.ts:93-102`, `workbench-keys.svelte.ts`, `commands.svelte.ts:545-566`, and the HELP.md key rows.
10. **Where they are drawn: violated.**
    - The project card does not use the one commands component: no overflow beyond five, no Add Command..., no per-command menu (Spec 2).
    - On all three surfaces, a name held by two sources breaks rendering (Behaviour 1).
    - The form is drawn by the shell (Spec 3).
11. **Client store: holds.** `state/sessions/terminal/commands.svelte.ts`, with the async cases tested. `terminals.svelte.ts` is 898 lines (Standards 5).
12. **Docs: violated.** HELP.md misstates the preset names (Standards 1). DESIGN.md:151 and HELP.md misstate when approval is asked again (Standards 2). options.yml states a folder mode that does not hold (Standards 3).

## Case verdicts

1. Met: sources.test.ts:32-99.
2. Met: sources.test.ts:106-128.
3. Met: sources.test.ts:145-217.
4. Met at the server: sources.test.ts:220-268. At the view, the same data breaks rendering (Behaviour 1), and no case reaches it.
5. Met: found.test.ts:24-118, every expected line and nothing else.
6. Met: placeholders.test.ts:15-79.
7. Partial. Every assertion holds, but "mode 0600 in a 0700 folder" is checked only for a folder the module creates (approvals.test.ts:69-80). On a folder that already exists the mode is left as it is, and `stat -f '%Lp' ~/.oculus` prints 755. What would settle it: a case that pre-creates the folder at 0755 and expects 0700 after an approve, or a ruling that the approvals file gets a folder of its own.
8. Met: chain.test.ts:66-80 and run.test.ts:160-210.
9. Met: task.test.ts, including 20 real-tmux runs on a private socket, all passing.
10. Met: run.test.ts:260-308.
11. Met: channel.test.ts, "the list poll while a task terminal runs".
12. Met: terminal-close.test.ts, three cases.
13. Met for output that is fed to `note`: commands.test.ts:241-375. It is not met for a task terminal no pane shows (D17-A).
14. Met: keys.test.ts, workbench-keys.test.ts, and commands.test.ts:420-458.
15. Met: tests/routes/commands.test.ts:107-156, with `node:child_process` mocked to record any start.
16. Met: commands.test.ts:69-197.
17. Met as string renders: tests/views/shared/commands/commands.test.ts:56-89.

## Spec

1. **Item 8, the diagnostics, is partial (D17-A).** In commands.svelte.ts:505, `note(id, text, scrollback)` is called only from `views/sessions/terminal/grid/TerminalGrid.svelte:373`, inside the grid's pty subscription. Failure: a build fails while its Terminal tab is in the background, and `commandDiagnostics()` is empty for it, so D33's Problems view lists nothing. Ruling Z298 (a), a `capture` action of the terminal route read once when a task ends, is not built. The report discloses this as NOT DONE. Verdict: item 8.

2. **The card does not use the one commands component.** ProjectCard.svelte:228-237:
   ```
   for (const command of repo === '' ? [] : (commands(repo)?.commands ?? [])) {
       rows.push({ id: `command:${command.name}`, label: command.name, ...
   ```
   Item 10 says "One commands component ... on the project card (`CardActions.svelte`, ...)". The card instead mixes commands into its general action strip. It has no Add Command..., no Edit, Delete or Open File menu, and no findings mark, and its overflow goes by width rather than "beyond five". ProjectCard.svelte is outside the write list; the report discloses this (judgment call 5). Failure: a reader on a Projects board cannot add or edit a command from the card, as item 10 describes. Verdict: item 10.

3. **The form is drawn by the shell, in `shell/keys/CommandForm.svelte`.** `CommandAsk.svelte` and `Workbench.svelte` (`<CommandAsk />`) carry it there, and all three are outside the write list. CommandAsk in the shell has a reason in the tree: a default key can ask for approval with no bar mounted. The form is only ever opened from the bar, and `shell/keys/` holds keys, not forms. The spec says "a new file goes where its concern already lives". The report's reason (judgment call 1) is that `tests/views/whole/tinted.test.ts` refuses a wall surface under a tinted view. Its head comment supports that. It is the orchestrator's call whether this stands. Verdict: item 10.

4. **The found preset names depart from the brief and are not reported.** found.ts:107-115:
   ```
   ['cmake', 'configurePresets', ...], ['cmake build', 'buildPresets', ...], ['ctest', 'testPresets', ...]
   ```
   The brief says "named `cmake: <n>`". The departure avoids a real collision: a configure preset and a build preset both named `default` would otherwise be one repeated name, and the second would be dropped by `seen` (found.ts:75). But it is a user-visible name that no judgment call lists. Verdict: item 1.

5. **An unreported change to the run line.** chain.ts:60-65:
   ```
   const NEEDS_GROUP = /[;&|#\n]|\\\s*$/;
   ... return NEEDS_GROUP.test(run) ? `{ ${run}\n}` : run;
   ```
   No item asks for this. It serves item 6's stated aim ("a failure stops the chain") and is tested. It is not in the report's judgment calls, and its trailing-backslash branch is wrong (Behaviour 3). Verdict: item 6.

6. **Approval of a chain.** Brief item 4 says "each command of the chain as `<cwd>\t<run>`, one per line, so a changed `cwd`, line or chain asks again". run.ts:85-88 checks each command's text on its own:
   ```
   .map((command) => commandText(repo, command))
   .filter((text, at, all) => all.indexOf(text) === at && !isApproved(approvals, text));
   ```
   Failure: `build` and `test` are approved by running each once. `.oculus/commands.yml` is then edited so that `test` gets `depends_on: [build]`, and pressing test runs the new chain with no question. The same happens when a dependency is removed. The brief's two sentences ("one per line" and "asks once, listing every unapproved text") pull against each other, and the builder took the per-text reading without listing it as a judgment call. Verdict: item 4.

7. **A wire field no item names.** run.ts:55 and :74 accept `source: 'file'|'saved'|'found'` on the `command` action. No client sends it: the only `action: 'command'` body is commands.svelte.ts:377, and it has no `source`. No test sends it either. Item 6's shape is `{ action: 'command', repo, name, context, cols, rows }`. Failure: this dead branch is the only means the server has to pick the second of two same-named commands, and nothing reaches it (Behaviour 1). Verdict: item 6.

8. **Paths outside the write list, all disclosed.** `data/model/model-commands.ts` and `index.ts`, `state/sessions/folds.ts`, `terminal-marks.ts`, `pty-io.ts`, `state/sources/repositories/file-git.ts`, `ui/controls/editor/Editor.svelte`, `views/sources/source/Editor.svelte`, `repositories/diff/Diff.svelte`, `files/tree/control/picks.svelte.ts`, `server/root/watch/local.ts`, `pty/edit.ts`, `shell/Workbench.svelte`, `ProjectCard.svelte`, `boundaries.test.ts`, `type-scale.test.ts`, `client-state.test.ts`, and the new test helpers. Each is listed in the report's "wrong or impossible" section. No verdict on its own.

9. **Premises.** The brief says "the project card's actions are `views/shared/card/CardActions.svelte`". The action list is built in ProjectCard.svelte; CardActions only draws it (`CardActions.svelte:152`). The report states this. The other premises reproduce from the diff's context lines and the base counts: `terminals.svelte.ts` at the base has 887 lines, read with `git show 201a8fcb:...`.

10. **ADRs.** There is no `docs/adr` folder, so none applies. The DESIGN.md passages (Processes `:151`, Approval `:326`) are taken up in Spec 6, Standards 2 and Behaviour 4.

## Proof

1. **No case puts a name held by two sources through any view or menu.** spec.md:66 requires every key to be exercised duplicated. Case 4 is server-only. The three surfaces key their each-blocks by name (Behaviour 1), and no test would show the error. String rendering does not run the client-side key check either. Verdict: item 10.

2. **The folder-mode case cannot fail for the real default.** approvals.test.ts:72 asserts `statSync(join(home, '.oculus')).mode & 0o777` is `0o700` only after the module created the folder. Removing the 0700 enforcement for an existing folder would leave the suite green, and there is no such enforcement now. Verdict: item 4 and case 7.

3. **No test of a changed `depends_on` asking again.** run.test.ts:122-142 covers a changed line and a changed folder only, so Spec 6 passes the suite. Verdict: item 4.

4. **A predicate widened, disclosed with its before and after.** boundaries.test.ts:313:
   ```
   const SHELL_STORES = [
   +    'commands',
   ```
   The brief puts the keys in `shell/keys/keys.ts`, so the shell needs this store, and the widening follows from item 9. It is recorded here as a widened predicate, not as a defect. The comment above it names only the keys (Standards 8).

5. **A wall-clock wait.** task.test.ts:170-176 polls every 50 ms up to a 15 s deadline (`await new Promise((resolve) => setTimeout(resolve, 50))`). spec.md:63 says "never on a fixed sleep or a wall-clock margin". A real tmux server sends no event the test could wait on, so this may be the only possible form. It belongs on the orchestrator's list.

6. **The server's `source` branch has no test** (Spec 7).

## Standards

1. **HELP.md states preset names the code does not use.** The Project commands passage says the presets are "named `cmake: <preset>`". Code: found.ts:107-115 (`cmake build: `, `ctest: `). Failure: a reader looks for `cmake: default` to run the build preset and finds `cmake build: default`. spec.md:65 says a sentence the change makes false is a defect. Verdict: item 12.

2. **DESIGN.md:151 and HELP.md state an approval rule the code does not follow.** DESIGN.md:151: "over the text of the command's whole chain ... so a changed line, a changed folder or a changed `depends_on` asks again". HELP.md: "a changed line, folder or dependency asks again". Both are false per Spec 6. Verdict: item 12.

3. **options.yml states a folder mode that does not hold.** The `approvals` description says "Without it the file is ~/.oculus/approvals.json, mode 0600 in a folder of mode 0700". On this machine `~/.oculus` is 0755 (`stat`), and approvals.ts:104 does not change an existing folder. Verdict: item 12.

4. **A comment line ends short inside a sentence.** editor-status.svelte.ts:4-7:
   ```
   // may be written, the file it shows and the text selected in it and, while its blame is on, the
   // caret line's blame, keyed by its instance, and
   // takes its entry away when it unmounts. ...
   ```
   spec.md:43 requires an edited comment to be rewrapped as a whole paragraph.

5. **`terminals.svelte.ts` is 898 lines, against the 900-line check** (`tests/checks/tree/size.test.ts:28`). spec.md:45 says "A file within 20 lines of its cap is split". The step grew the file from 887. Failure: the next step that adds three lines to this file goes red on size.

6. **Exports with no importer outside their own file and its tests.** In sessions.ts: `jobOption`, `parseJob`, `respawnArgs`, `TASK_OPTION`. In commands/files.ts: `COMMANDS_FILE`, `folderOf`. Each was checked with a `grep -rlw` over `src` and `tests`. spec.md:82 says such an export is removed or made local.

7. **The commands.json writes do not read themselves back.** In saved.ts:82-84, `write()` is `writeTextAtomic(...)` with no re-read, used by `saveCommand` and `removeCommand`. spec.md:67: "A write that edits a file's text re-parses its own result and refuses when the reparse is not what was asked." The approvals writer does read back (approvals.ts:107).

8. **The boundaries.test.ts comment is incomplete.** It names only "the default build and test keys" as the reason the shell takes `commands`. `CommandAsk.svelte` and `CommandForm.svelte` take it too.

There is no non-ASCII and no comment over 100 columns in the changed files: a per-file awk over every changed and new file under `src` and `tests` printed nothing. There are no history words in the comments the step added: the `still` hits all describe a line that is running.

## Behaviour

1. **A name held by two sources breaks the commands bar, the card strip and the Files submenu.**
   - Where: CommandBar.svelte:102 `{#each bar as command (command.name)}`. ProjectCard.svelte:229 `id: \`command:${command.name}\``, drawn by CardActions.svelte:152 `{#each inline as action (action.id)}`. row-menu.ts `id: \`${RUN_PREFIX}${command.name}\``, drawn by MenuList.svelte:205 `(item.id)`.
   - Why it throws: Svelte 5.57.1's each block throws on a duplicate key in production as well as in dev (`node_modules/svelte/src/internal/client/dom/blocks/each.js:355-361`, which calls `e.each_key_duplicate('', '', '')` when `length > keys.size`).
   - How it happens: the server lists both entries by design (sources.test.ts:246-268). The form does not refuse a name the file already holds, since saved.ts only replaces within the saved list.
   - Failure: a reader adds a saved command `build` through Add Command... in a repository whose `.oculus/commands.yml` has `build`. The Repositories view's repository body, that project's card and the Files right-click menu then throw while rendering.
   - Separately, `press(repo, command.name)` (CommandBar.svelte:61, ProjectCard.svelte:234, picks.svelte.ts:87) sends no `source`. The server resolves to the first command of that name, so the saved `build` button runs the file's `build` and asks approval for the file's text.
   - Not stated in the report. Verdict: item 10.

2. **Error paths in a chain resolve against the root command's folder.**
   ```
   const named = queries.peek<CommandsAnswer>(keyOf(job.repo)).data?.commands;
   return named?.find((one) => one.name === job.name)?.cwd ?? job.repo;
   ```
   (commands.svelte.ts:470-475.) Failure: `test` (cwd `sub`) depends on `build` (cwd the repository). `build` prints `src/a.c:3: error: x`, which `note` resolves as `<repo>/sub/src/a.c`. `errorFile` then finds no file, so there is no link, and the diagnostic carries the wrong path. The chain line prints `printf '%s\n' <name>` before each command, a marker the store could use to track the current command. Item 8 says "resolved from the command's `cwd`". Not stated in the report. Verdict: item 8.

3. **The trailing-backslash branch of the run grouping makes the whole chain a syntax error.** Probe in the scratchpad: `sh -c "$(printf '{ echo a \\\n}')"` printed `sh: -c: line 2: syntax error: unexpected end of file`, exit 2. The backslash-newline joins `}` onto the command, so the group never closes. Failure: a command ending in `\` makes every command of its chain fail to start, where the comment at chain.ts:54-59 says the group keeps a line's effects inside it. There is no test. Verdict: item 6, through Spec 5.

4. **The approvals file lands in a 0755 folder on this machine.** Default path `~/.oculus/approvals.json`; `stat -f '%Lp' ~/.oculus` printed `755`. Before the step there was no file. After it, a 0600 file sits in a 0755 folder, against DESIGN.md:326 and options.yml. The report says "mode 0600 in a 0700 folder" without this condition. Verdict: item 4.

5. **The Files view fetches commands for every repository row the tree draws.** picks.svelte.ts:68-75 watches each repository folder in `deps.rows()`, so each one is a `GET /api/commands` that reads its files. This is host-visible load. The report's before/after list does not state it.

6. **The `source` field on the `command` action.** It is a wire shape the report's list of new route shapes does not name (Spec 7).

7. **Hazards of the brief's own rules, for the orchestrator to raise; these are not builder defects.**
   - (a) The approval key is the text alone, with the folder relative to the repository and no repository in the hash (approvals.ts:50-52, as brief item 4 and DESIGN.md:326 prescribe). Approving `.\tmake 'all'` in one repository therefore approves `make 'all'` in every repository, whose Makefile may do anything.
   - (b) Each placeholder value is one single-quoted `shellWord`. A run line that puts it inside double quotes, as VS Code's own task examples do (`echo "${selectedText}"`), still lets `$(...)` in a selection run. The value becomes `"'$(...)'"`, and command substitution works inside double quotes.

Reported by the builder and confirmed: the tmux list format, `Terminal.task`, `exit` and `job`, the two keys, the new route and actions, the files written, the faster poll, and the check and cross marks.

The builder's disclosures:
- The `pkill -f "vitest run"` may have stopped another agent's vitest run.
- The two read-only git commands changed no state.
- Nothing in the worktree depends on any of these: my own run of the full list from this worktree is green, and the scratch folders named are under the builder's session scratchpad, which nothing in the diff references.

## Declined to judge

- The browser look at TEST is the orchestrator's: the form's fields, Save and Escape; the approval and Restart dialogs; the xterm link drawn and clicked; the check and cross in colour on the strip, row and bar; the bar's placement in Repositories; Cmd+Shift+B and Cmd+Alt+T in Chrome on macOS. Behaviour 1 is best confirmed there by saving a command whose name `.oculus/commands.yml` already holds.
- I did not rerun the 84 mutation runs or the first runs on the unchanged tree. No verdict rests on their counts.
- Whether the form's placement in `shell/keys/` (Spec 3) and the card's mixed controls (Spec 2) should stand is the orchestrator's call. I report the departure from the brief's named shape.
- Disclosure: besides `git diff 201a8fcb` and `git status --short`, I ran `git show 201a8fcb:<path>` twice, both read-only: the base line count of `terminals.svelte.ts` and the base copy of `tests/routes/sessions/terminal-fixture.ts`. I also ran two `sh -c` probes in my scratchpad, and `stat` on `~/.oculus` for its mode only. I did not read `local.yml`, did not touch ports 8787 or 8790, and started or killed no process.

## Usage

Opus 5.5 reviewer, about 305,000 tokens (budget counter 15,000,000 at the start, about 14,695,000 at the end), about 75 tool uses. Minutes were not measured.

## Repair round 1, refuted

Summary: the verify list is green and the slow tmux tests pass. 17 of the 21 rulings are closed. Rulings 1 and 20 are closed in part, each with a behaviour defect I reproduced on a scratch copy. Rulings 14 and 21 are closed for what they name, but the round left new or remaining instances of the same defect.

## Verification lines, verbatim

`cd /Users/axelfaes/workspace/research-hub/.agents/worktrees/D17/tools/oculus && PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`. It ran from 22:40:56 to 22:47:56 and exited 0. The load average was 3.94 at the start. These are the command headers and the result lines of the log:

```
$ npm test
fatal: Needed a single revision
 Test Files  523 passed | 24 skipped (547)
      Tests  12882 passed | 639 skipped (13521)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  446 passed | 9 skipped (455)
$ npm run check
1790973894766 COMPLETED 3185 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
✓ built in 8.11s
✓ built in 19.83s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

No test timed out, so nothing had to be rerun alone.

The slow tmux tests: `npx vitest run tests/server/machine/pty/task.test.ts tests/server/machine/pty/sessions.test.ts` printed `Test Files  2 passed (2)` and `Tests  29 passed (29)`. This matches the report.

The report's other evidence, rerun in the same form:
- `wc -l` printed 862 (`terminals.svelte.ts`), 570 (`pty/routes.ts`), 673 (`pty/sessions.ts`) and 695 (`commands.svelte.ts`). This matches the report.
- `sh utils/folder-check.sh` exited 0.
- `ls | wc -l` printed 10 for `data/helpers`, 10 for `state/sessions/terminal`, 10 for `views/shared`, 6 for `shell/keys`, 2 for `shell/commands` and 9 for `tests/server/machine/pty`.
- The spec.md ASCII gate (perl) printed nothing. The only stderr line was `bfs: error: bin: No such file or directory.`, because the tree has no `bin`.
- The export greps of ruling 14 reproduce. `grep -nE "^export (const|function) (jobOption|parseJob|respawnArgs|TASK_OPTION|COMMANDS_FILE|folderOf)"` over the two files prints nothing.
- No stale names remain. `grep -rn --exclude=local.yml "helpers/tasks\|helpers/commands-chain\|shell/keys/Command\|commandText" src tests config HELP.md DESIGN.md README.md docs` prints nothing.
- The round's tests fail without their change. I turned off each change on a scratch copy (`$SCRATCH/copy/oculus`, an rsync of the worktree without `config/local.yml`, node_modules linked) and ran its test files:

| Change turned off | Result | Failing test |
|---|---|---|
| r5, the blank line before `}` | 2 failed | `closes the group of a line that ends in a backslash, ...`, `runs the command after one with a ;, a # or a trailing backslash ...` |
| r9, `privateFolder` call | 1 failed | `makes a folder that stood with looser permissions private ...` |
| r19, repository in `chainText` | 2 failed | `asks in a repository for a chain approved only in another one`, and the approvals case |
| r15, saved read-back | 1 failed | `refuses a save whose read-back is not what was written ...` |
| r7b, `source` made optional | 1 failed | `is required: a press without one is refused ...` |
| r20, refusal at run | 1 failed | its case |
| r20, refusal at save | 1 failed | its case |
| r17, folder of the printing command | 3 failed | its cases |
| r7d, held-name refusal | 2 failed | its cases |
| r1, capture of unlisted terminal refused | 1 failed | `refuses a name oculus does not list ...` |

- The `untrack` in `watch` is needed. Removing it on the scratch copy made `commands-keys.client.test.ts` and `card-commands.client.test.ts` fail: `Tests  6 failed | 1 passed (7)`, with every mounting case failing. This reproduces the report's `effect_update_depth_exceeded` claim.
- Not rerun: the report's quotes of each test failing on the pre-round base copy (that copy is in the builder's scratchpad), and the 84 mutation runs of round 0. No verdict below rests on them.

## Item verdicts (whole diff since 201a8fcb)

1. **Command sources: holds.** The found preset names `cmake: <n>`, `cmake build: <n>` and `ctest: <n>` are now a stated decision (Z301 (2)), and HELP.md says the three names.
2. **One shell quoting: holds.** There is one `shellWord`, in `pty/shell-word.ts`.
3. **Placeholders: holds as the brief names them.** The quoted-placeholder guard the round added is partial; see Behaviour 2.
4. **Approvals: holds.** The chain is one entry, keyed with the repository's real path. The text is JSON, a departure from the brief's `<cwd>\t<run>` lines that the report states with its reason (judged under Spec 1). Each write makes the folder 0700. One hazard remains (Behaviour 3).
5. **Routes: holds.** `approve` now carries `chain: [{ folder, run }]` instead of item 5's `texts`. The report names it among the new wire shapes.
6. **The run: holds.** `source` is required and a press without it gets 400. The grouping is a stated decision.
7. **Task terminal and its result: holds.** The task mark carries the source.
8. **Errors made clickable and diagnostics: holds in part.** A task terminal that a grid fed and then stopped showing keeps only the early diagnostics (Behaviour 1). A chain's folders are known only while the repository's list is held (Behaviour 4).
9. **Default build and test keys: holds.**
10. **Where they are drawn: holds.** The card mounts `CommandBar`. Every each-block and id is keyed `<source>:<name>`. The form is in `shell/commands/` (Z301 (1)).
11. **Client store: holds.** `terminals.svelte.ts` is 862 lines.
12. **Docs: holds, with one unclear sentence in HELP.md** (Standards 3).

## Case verdicts

1. Met.
2. Met.
3. Met.
4. Met at the server, and now on the views through mounted components (`commands-keys.client.test.ts`, `card-commands.client.test.ts`, `run-command-keys.client.test.ts`).
5. Met.
6. Met. The round adds the quoted-placeholder refusal, which is partial (Behaviour 2).
7. Met. A 0755 folder becomes 0700 and the file is 0600. The other-owner branch is untested (Proof 2).
8. Met. The real `sh -c` cases for `\`, `;` and `#` pass.
9. Met: the real-tmux cases on the private `-S` socket, 29 passed.
10. Met.
11. Met.
12. Met.
13. Met for output a grid feeds and for a terminal no grid ever fed. Not met for a terminal a grid fed and then stopped showing (Behaviour 1).
14. Met.
15. Met.
16. Met.
17. Met: string renders, plus the mounted bar.

## Ruling verdicts (D17-round1.md)

1. **Closed in part.**
   - Built: the `capture` action, refused before any `capture-pane` for a name oculus does not list, on the socket arguments through `options.run ?? run` (`sessions.ts` `paneOutput`), with the catalog sentence `server.commands.capture_unlisted`. One capture per run, keyed by pid.
   - Not right: the "not read twice" rule is "a grid ever fed this terminal" (`commands.svelte.ts` `readEnded`: `if (!(one.id in outputs.byId)) void capture(...)`), where the ruling says "a mounted grid". Every press shows its terminal, so `byId` is always set for a pressed command. A grid that then stops showing the terminal leaves later errors unread (Behaviour 1).
   - The ruling's test is split: the store half uses a fetch stub and the real-tmux half reads `paneOutput` only. No single test goes from a real pane to a diagnostic.
2. **Closed.** `ProjectCard.svelte:362-364` mounts `CommandBar`. The card tests assert five buttons, the overflow and `data-command-add`. No card test asserts the per-command menu; it is the same component, tested through `commandMenu` (minor).
3. **Closed.** Both files are moved, `order.ts` gained `shell/commands`, and the `SHELL_STORES` comment was updated. The `order.ts` edit is misdescribed in the report (Proof 3).
4. **Closed.** HELP.md says the three names; listed as a decision.
5. **Closed.** `chain.ts:20-23` adds the blank line after a line ending in `\`. Real `sh -c` tests exist, and the mutation fails them.
6. **Closed.** One entry for the whole chain, and the dialog lists every line. The tests for gained and removed dependencies fail without the change. The JSON form is a decision of the builder's (Spec 1).
7. **Closed.**
   - (a) Keys are `<source>:<name>` on the bar, the overflow, the Manage items and the Files submenu.
   - (b) 400 without `source`, and the mutation fails the test.
   - (c) The source word is drawn beside a shared name.
   - (d) The held-name refusal, and the mutation fails 2 tests.
8. **Closed.** Real components are mounted over `tests/ui/frame/fake-dom.ts`, with the bits-ui leaves stubbed (disclosed).
9. **Closed.** It fails without the change. The owner check works: my probe with a mocked `process.getuid` left a 0755 folder at 755. No suite test covers it, though one is possible (Proof 2). Separate hazard: Behaviour 3.
10. **Closed.** A `pane-died` hook signals `wait-for -S died` on the private server. Every call in `watchEnds` carries `-S server.socket` (`tmux-fixture.ts:55`).
11. **Closed.**
12. **Closed.** The comment is rewrapped.
13. **Closed, with a departure from the named part.** The ruling named the result marks or the poll. The builder moved the pre-existing `closeEnded` and `moveInto` instead, for the stated reason that the step added 11 lines. The file is 862 lines. `terminal-lists.ts`, until now a set of pure functions, now holds two functions that write to the workbench they are handed. Its head comment says so. The orchestrator decides whether this stands.
14. **Closed for the six named exports.** The round adds a new export of the same kind, and three others remain (Standards 2).
15. **Closed.** A byte-for-byte read-back compare. It fails without the change.
16. **Closed.**
17. **Closed while the repository's list is held.** It fails without the change. Behaviour 4 is a dependency from before the round that this ruling builds on.
18. **Closed.** `menuOf` loads once when a row menu opens.
19. **Closed.** It fails without the change.
20. **Closed in part.** The named tests pass and fail without the change, but a quoted placeholder still passes the guard (Behaviour 2).
21. **Closed for the round's table.** The report's older section "Changes a reader or the host sees" still says the card draws a control per command (Proof 1).

## Spec

1. **Approval text as JSON, a departure from the brief's and ruling 6's `<cwd>\t<run>` lines.**
   - Place: `approvals.ts:65-67`: `return JSON.stringify({ repo, chain: lines.map((line) => [line.folder, line.run]) }, null, 1);`
   - The report states it as a decision with a reason (a tab or line break inside a field). It is listed under the heading "Z301 decisions and the other choices of the round". Z301 rules the repository in the key and the one-text chain; it does not rule the JSON form, which is the builder's.
   - DESIGN.md's Processes paragraph describes the content: the path and the `[cwd, run]` pairs, with `chainText` named. The Approval paragraph says the hash covers "the repository's real path and the lines of its whole chain". HELP.md says the same in plain words.
   - Neither document gives the exact serialization (key order, one-space indent). A reader can recompute the hash only from `chainText`.
   - Old approvals: entries written under round 0's per-line text never match the new key, so they ask again. The report does not say so. No approvals file existed before D17 and the step is not landed, so this matters only if a TEST look ran round-0 code.
   - Verdict: item 4. The orchestrator decides whether the JSON form stands.

2. **The builder ran a git command in the round.** Disclosed in the report: "one `git -C /dev/null status` was run by mistake; it failed and touched no repository". The round brief says "Run no git command, not even `git status`", and spec.md:32 says the same. No effect on the tree. This is a process breach on record, with no verdict on an item.

## Proof

1. **The report holds a stale before-and-after sentence.**
   - Place: `D17-report.md:565`: "a project card whose folder is a repository draws a control per command".
   - Since ruling 2 the card draws the `CommandBar`. The round's table (line 144) is right, but this older section is what the TEST look is read against.
   - Failure: the orchestrator looks for one control per command on the card and finds a bar with Add Command and the overflow.
   - Verdict: ruling 21.
2. **`privateFolder`'s owner check has no test, though one is possible.**
   - The report gives the reason as "no test has a second user".
   - My probe wrapped `approveTexts` in `vi.spyOn(process, 'getuid').mockReturnValue(real + 4242)` over a 0755 folder. It printed `{"done":{"ok":true},"folder":"755","file":"600"}`. The branch is testable without a second user.
   - Without such a test, dropping the `found.uid ===` condition leaves the suite green.
   - Verdict: ruling 9.
3. **An allow-list edit is missing from "Every edit to an existing assertion".**
   - Place: `tests/checks/imports/order.ts:80`: `shell: ['shell', 'shell/rail', 'shell/status', 'shell/panes', 'shell/keys', 'shell/commands'],`
   - The report names `order.ts` only as "(import paths)" in its list of paths outside the brief's write list. spec.md:58 requires each predicate and allow-list edit with its before and after.
   - Verdict: ruling 3.
4. **The capture test for ruling 1 is split into a stubbed half and a real-tmux half.** See ruling 1 above. Minor.

## Standards

1. **Head comments not rewrapped as a whole paragraph** (spec.md:43).
   - `server/machine/commands/routes.ts:8` ends at column 46 in the middle of a sentence:
     ```
     // is refused for a name the repository's file or the commands found in it already hold, and for a
     // line with a placeholder inside quotes. Both
     // name a repository, and a `repo` that is relative, ...
     ```
   - "Both" now follows a sentence about save refusals, so it no longer reads as "the GET and the POST".
   - `ProjectCard.svelte:10` ends at column 86 at the end of a sentence, and the next line's "The card's" would fit after it (minor).
   - Verdict: rulings 7 and 20 (these comments came with those changes).
2. **Exports with no importer outside their own file and its tests** (spec.md:82). Each was checked with `grep -rlw <name> src tests`:
   - `outputArgs` (`pty/sessions.ts:571`), added in this round and used only inside `sessions.ts`.
   - `readApprovals` and approvals' `commandKey` (`approvals.ts:44,91`), imported only by `approvals.test.ts`.
   - `sourceWords` (`views/shared/commands/commands.ts:56`), imported only by `commands-menu.test.ts`.
   - Verdict: ruling 14 (same class).
3. **An unclear sentence in HELP.md.** `## Project commands` says: "each button, menu item and key names its source beside the name (`build (file)`, `build (saved)`)". The default keys name nothing. "key" is either wrong or the internal each-block key.
   - Failure: a reader looks for the source next to Cmd+Shift+B.
   - Verdict: item 12.
4. **Minor test title.** `tests/shell/commands/command-ask.test.ts:55` reads "draws the form no longer once it is closed". "no longer" is on spec.md:42's list of history wording for test titles. Here it describes a state change within the test, not code history.

## Behaviour

1. **A task terminal that a grid fed and then stopped showing is never captured, so the errors printed afterwards are lost.**
   - Place: `state/sessions/terminal/commands.svelte.ts` `readEnded`:
     ```
     looked.set(one.id, one.pid);
     if (!(one.id in outputs.byId)) void capture(one.id, one.pid);
     ```
   - `outputs.byId[id]` is set by the first chunk any grid feeds, and nothing removes it when that grid unsubscribes. A press always shows and selects its terminal (`adopt`), so a pressed command always has an entry.
   - A Terminal tab's grid unsubscribes when the tab is switched to another terminal (`TerminalGrid.svelte:385-390`, `close` calls `unsubscribePty(wanted)`). Background tabs stay mounted (`TabView.svelte:2-9`), so that is not the case at issue.
   - Failure: the reader presses build, then picks another terminal in the same tab's list while it builds. The build then fails. `commandDiagnostics()` holds only what was printed before the switch, and no capture is made.
   - Probe on the scratch copy (`probe-capture.test.ts`): `note(ID, 'build\r\n', true)` while running, then the list reports `exit: 1`, with a capture holding `src/a.c:3: error: ...`. It printed `{"captures":0,"diagnostics":[]}` and `AssertionError: expected [] to deeply equal [ 'printed after the grid let go' ]`.
   - The capture is read as scrollback, which replaces what is held, so capturing whenever no grid is subscribed at the end would not count anything twice.
   - Verdict: ruling 1, item 8, case 13.

2. **The quoted-placeholder guard can be bypassed, and `$(...)` in a selection runs.**
   - Place: `server/machine/commands/placeholders.ts:36-39` skips the character after a backslash outside single quotes:
     ```
     if (char === '\\' && quote !== "'") {
         at += 1;
         continue;
     }
     ```
   - `fillPlaceholders` (`:84`) still replaces `${name}` there, because the scanner and the filler disagree about what a placeholder is.
   - Probe on the scratch copy: `quotedPlaceholder`, then `fillPlaceholders` with the selection `$(touch <scratch>/...)`, then `/bin/sh -c` on the line:
     - `echo "\${selectedText}"`: `quoted: null`, the line is `echo "\'$(touch <scratch>/probe/.../dq-escaped)'"`, `created: true`. The command substitution ran inside double quotes.
     - `echo \${selectedText}` with the selection `; touch <scratch>/bare-injected #`: `quoted: null`, the line is `echo \'; touch <scratch>/bare-injected #'`, `created: true`. The escaped quote frees the value.
     - `true # it's` + newline + `echo '${selectedText}'`: `quoted: null`, `created: true`. The apostrophe in the comment flips the scanner's quote state, so a single-quoted placeholder on the next line counts as bare. The value then sits outside quotes and `$(...)` runs.
     - The opposite case: `true # don't` + newline + `echo ${selectedText}` is refused. That is a false refusal, harmless in direction.
     - `$'${selectedText}'` is refused correctly.
   - Failure: a repository's `.oculus/commands.yml` holds `run: echo "\${selectedText}"`. The reader approves that text, selects text holding `$(...)` and presses. The selection runs as a command.
   - Verdict: ruling 20, item 3.

3. **Each approvals write makes whatever folder holds the configured file mode 0700, the home folder included.**
   - Place: `approvals.ts:105-110` (`privateFolder`), called from `:131`.
   - The ruling's reason is that the folder "holds oculus's own state". That is true of the default `~/.oculus`, not of any folder the `approvals` key can name.
   - Probe: `approveTexts(join(home, 'approvals.json'), ['x'])` over a 0755 scratch "home" printed `{"home":"700"}`.
   - Failure: with `approvals: ~/approvals.json` in `local.yml`, the first approval makes the user's home folder 0700. Any other user or service reading the home loses access, as does a folder shared with a group.
   - `options.yml` describes the chmod only for the default path. HELP.md and DESIGN.md state it in general.
   - Verdict: ruling 9 (Z301 (3)); the orchestrator decides the scope.

4. **Error folders are known only while the repository's command list is held.**
   - Place: `commands.svelte.ts` `chainOf`:
     ```
     const listed = queries.peek<CommandsAnswer>(keyOf(job.repo)).data?.commands;
     ... if (listed === undefined || source === undefined) return null;
     ```
   - With `folderOf` falling back to `?? job.repo`, every error resolves from the repository root once the list is forgotten. The list is forgotten when the last bar watching it unmounts (`watch`'s release calls `queries.forget`) or after a page reload before any bar mounts.
   - The test `reads a plain command from its own folder, and a list not read yet from the root` covers only a command whose folder is the root.
   - Failure: the reader presses `test` (folder `sub`) in the Repositories view and closes that view while it runs. `src/b.c:4: error` then resolves to `<repo>/src/b.c`, so there is no link and the path is wrong.
   - This predates the round (round 0's `folderOf` had it too); ruling 17 builds on it. Carrying the chain's folders in the `@oculus_task` mark would make it self-contained.
   - Also minor: the marker match `line === chain[started].name` advances on any output line that equals the next command's name.
   - Verdict: item 8.

5. **The `untrack` change in `watch`, which no ruling names: justified.**
   - Without it, an effect that reads and writes `watching[repo]` re-runs itself. On the scratch copy, every mounting case of the two client test files fails (`Tests  6 failed | 1 passed (7)`).
   - It fixes a defect that mounting the real components (ruling 8) exposed, it reaches no further than `watch`, and the report states it.
   - No finding.

6. **The moves to `data/helpers/run/` and `shell/commands/`: no finding.**
   - `data/helpers/tasks.ts`, which predates the step, moved with `chain.ts` because the folder would have held eleven items.
   - Every importer is updated (the grep above prints nothing stale).
   - The boundaries state row allows `data/helpers/run/tasks` and `data/helpers/run/chain`. Its comment gives the reason for each: two readers, the server and the page.
   - DESIGN.md's state row and update-task bullet are updated.
   - `npm run test:checks` passes.

## Declined to judge

- The browser look at TEST is the orchestrator's: the card's bar placement and that it is always shown (the old controls were shown under the pointer), the source word beside a shared name, the form's refusal sentences, the approval dialog listing every line with its folder, the Files menu filling in when the commands arrive, and the 0700 change on the real `~/.oculus`. I did not stat `~/.oculus`.
- I did not rerun the report's quotes of each test failing on the pre-round base copy, or round 0's mutation table.
- Whether ruling 13's substitution (moving pre-existing functions) and the JSON approval text stand is the orchestrator's call.

What I ran: `git diff 201a8fcb` and `git status --short` only, both read-only. Scratch probes ran in my scratchpad copy only; I made no edits in the worktree (no file under its `src` or `tests` is newer than my checks log). I did not read `local.yml`, did not touch ports 8787 or 8790, did not run tmux myself (the fixture's tests use their own `-S` socket), and started or killed no process outside the vitest runs.

## Usage

Opus 5.5 reviewer, about 287,000 tokens (budget counter 15,000,000 at the start, about 14,713,000 at the end), about 50 tool uses. Minutes were not measured.
