NOT DONE: nothing of the 13 rulings of round 2 is left undone, with two limits. (1) The marker a chain prints before each command is the command's bare name, so a command whose own output holds a line equal to the next command's name moves the diagnostics to the next command's folder early; a unique marker changes the text the terminal shows, a user-visible shape no ruling names, and is raised as D17-B below, not built. (2) `tests/server/machine/pty/task.test.ts` `captures all the text of an ended pane, a wrapped line joined, and its pid changes on a respawn` timed out (`Test timed out in 30000ms`) in runs made beside other vitest runs, here and on the unchanged pre-round-2 tree (four copies of the file started at once there: three passed, one timed out); no ruling touches it, its cause is not found, and it passed in both `checks.sh` runs and in four runs in a row of the file alone. Rulings 5, 6, 7, 9, 10, 11, 12 and 13 change a text, an export list, a title or a comment, so no test fails without them; each entry under "Repair round 2" shows its end state with a command. Not covered by any test: the pointer-driven parts of the bar, the form and the menus, and the real widgets (the client tests stub them); the list is under "Not covered by a test".

# D17 report, project commands

## Open items

The state file's open items, copied with `sed -n 177,180p tools/oculus/.scratch/migration/orchestrator-state.md` at the time of writing (the four entries of `## Open items` on lines 177-180):

- Z280 (2026-10-02, D14's /spec): a LaTeX formatter on this machine. D14 builds Format Document for `.tex` files (Z278) through `tex-fmt`, which is not installed (`command -v tex-fmt` prints nothing; Homebrew offers 0.5.7, MIT). `latexindent` is installed (`/usr/local/texlive/2025/bin/universal-darwin/latexindent`) but stops at once with `Can't locate File/HomeDir.pm in @INC` (TeX Live 2025's script needs a Perl module macOS lacks). What VS Code does (read 2026-10-02 19:30): VS Code itself has no LaTeX formatter (its built-in `latex` extension contributes only `languages` and `grammars`); LaTeX Workshop 10.19.0, installed here, formats through the setting `latex-workshop.formatting.latex` with the choices `none`, `latexindent`, `tex-fmt` and `badness` (the last added in 10.19.0 of 2026-09-17, run as `badness format --stdin-filepath <file> -`; not installed here and not in Homebrew), default `none`, each program found on PATH by default (`latex-workshop.formatting.latexindent.path`, `latex-workshop.formatting.tex-fmt.path`, `latex-workshop.formatting.badness.path`); your VS Code settings set none of these keys, so Format Document on a `.tex` file in your VS Code today changes nothing. Options: (a) I run `brew install tex-fmt` now and D14 stays as briefed, tex-fmt only. For: one command, a single binary, fast; Format Document works at once. Against: one more program on your machine; no choice of formatter, unlike VS Code. (b) I install the Perl module for `latexindent` (`cpan File::HomeDir`, into your user Perl) and D14 is built against `latexindent`. For: the formatter most LaTeX users know, with its own settings files. Against: a Perl module install outside Homebrew. (c) VS Code's shape: a setting for the LaTeX formatter with the choices none, latexindent, tex-fmt and badness, default none as LaTeX Workshop, each program's path a setting too; D14 builds the three programs behind it (added to D14 as a ruling in its repair round, since its builder is building tex-fmt now), and I install tex-fmt so one choice works here. For: the same choice and default as your VS Code with LaTeX Workshop. Against: four new settings keys in the config, the choice and a path per program (a shape you approve with this option); with the default none Format Document does nothing until you pick a program, as in your VS Code today; latexindent still fails here without (b)'s module. (d) neither: Format Document stays unusable here, the lazy option. Recommended (c) with tex-fmt installed: it matches VS Code and leaves the choice of program to you. D14 is built and tested with a stand-in program either way.
- Z276 (2026-10-02, at Axel's question whether O34 covers the task "A second person in the hub" in `tasks/tasks.yml`): it does not. O34 reads the signed-in person in one place, which is the base that task needs; the task's three parts (a Focus board per person, a private-or-shared marker per field and document with private as the default, the group views of shared deadlines, who waits on whom and the meeting rotation) are in no step, and D10 waits on a second person too. Options: (a) one new step O36 after O34 with those three parts, so the plan ends with the hub usable by your group; (b) leave the task in `tasks/tasks.yml` until someone else works in the hub, as its note says, and open a step then. For (a): the remote server is built with several users in mind and the privacy marker is cheapest to add before anything is shared. Against (a): it builds for people who are not using the hub yet. Recommended (b): the task's own condition is not met, and O34 already leaves the one place a person is read. (b) is also the cheaper option, chosen because the condition is unmet, not because it costs less.
- Z274 (2026-10-02, Axel's word that oculus is now a full IDE rather than a dashboard): a new name for oculus. Where the name lives, counted on main: 122 files under `tools/oculus/src` and 1054 occurrences across its `src`, `tests` and `config`; 40 references to the `~/.oculus` folder; the `.oculus/project.yml` manifests the other repositories carry; five browser-storage keys (`oculus.ui.v1`, `oculus.layout.v1`, `oculus.layout.previous`, `oculus.carry.v1`, `oculus.diff.addComment`); and 1241 files of the hub outside `tools/oculus` that name it (the skills, rules, memory and manifests among them). Options for when: (a) the rename done in O33, as part of the move into its own repository: the repository, the package, the folder, the source, the docs and the hub's references take the new name at once; the first-run check moves `~/.oculus` and each repository's `.oculus/` folder and carries the five browser-storage keys over once, so nothing Axel saved is lost. For: the repository is created then anyway, so its name is chosen once; no step in flight conflicts with it. Against: the old name stays on screen until the last step. (b) the rename as a step of its own now. For: the new name is in use sooner. Against: it touches nearly every file five steps in flight also touch, so each of them meets conflicts at landing, and it needs a ruling for a new step. (c) keep the name oculus. For: no work. Against: the name no longer says what the tool is, which is Axel's reason for asking. Names, in the style of the other repositories (cathedra, ordo, officium, scotoma): scriptorium (the room where manuscripts were written and copied, fitting a tool for writing papers and code); officina (a workshop; close to officium in sound); fabrica (a workshop where things are made). Recommended (a) with scriptorium. (c) is the lazy option.
- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line). Count at 2026-10-02 13:05: 1 of 10 (X3a, landed 11:49). Nothing is asked of Axel until the count reaches 10.

Raised by this step: D17-B (the chain's printed marker, "Raised by round 2" below). D17-A (diagnostics of a task terminal no pane shows) was ruled as Z298 (a) and is built (Repair round 1, ruling 1); the choices of the repair round are ruled as Z301 and listed under "Z301 decisions and the other choices of the round".

## Repair round 1

The 21 rulings of `agents/briefs/D17-round1.md`. "Base" below is a copy of the tree as it stood before the round (`d17r1-base` in the session scratchpad, node_modules linked) with this round's final test files copied over it, run with `npx vitest run <files>`; each quoted line is what that run printed for the test (the ellipsis vitest prints inside an object is written `...`). Two setup lines of `tests/server/machine/commands/run.test.ts` were adapted on the base so the file loads there: the import path of the chain module (the base's file is `data/helpers/commands-chain.ts`) and the helper that approves a chain (`approveChainOf` calls the base's `commandText` once for each command). A test that passes on the base is a guard and is named as one.

Rulings 4, 10, 12, 13, 14 and 16 change a text, a size or an export list, or replace a wait, and no test of them fails without the change; each has the command that shows the end state in its entry. Every other ruling has a test that fails on the base.

### 1. The `capture` action and the store's one read

- Changed: the terminal route takes `{ action: 'capture', id }` (`server/machine/pty/routes.ts:495`, `captureTask` in `server/machine/commands/run.ts:153`), answers `{ ok: true, id, output }` from `capture-pane -p -J -S -` (the whole pane, a wrapped line joined), and refuses an id that is not a listed terminal with `server.commands.capture_unlisted` before any tmux call (`makes no tmux call at all for a name that is no terminal id`). The commands store (`state/sessions/terminal/commands.svelte.ts:612-636`, `readEnded` and `capture`) asks once for each run (the pane's pid) of a task terminal the list shows with an exit, unless a grid is subscribed to the terminal at that moment (round 2, ruling 2). The answer is dropped when the terminal left the list, when its line was started again while the capture was out, and when a grid subscribed meanwhile; a refusal or an unreachable server leaves no diagnostics. DESIGN.md's pty bridge bullet and HELP.md's diagnostics sentence say so.
- Tests: `tests/state/sessions/terminal/commands-output.test.ts` (`a task that ends in a terminal no pane shows`, 7 cases), `tests/server/machine/commands/run.test.ts` (`Capture`, 3 cases), `tests/server/machine/pty/task.test.ts` (`captures all the text of an ended pane, a wrapped line joined, and its pid changes on a respawn`, real tmux on the private socket).
- Fails on the base: `commands-output.test.ts` `asks the server once for the captured output and holds its diagnostics`: `AssertionError: expected [] to deeply equal [ { action: 'capture', ...(1) } ]`; `asks once however many lists name the ended run`: `expected [] to have a length of 1 but got +0`; `holds nothing of a capture whose line was started again while it was out`: `TypeError: gates[1] is not a function`; `run.test.ts` `answers all the text of a listed terminal pane`: `AssertionError: expected { Object (error) } to deeply equal { ok: true, id: 'eb43c2-shell', ...(1) }`; `refuses a name oculus does not list`: `expected false to be true`; `task.test.ts`: `TypeError: paneOutput is not a function`.

### 2. The project card draws the commands through `CommandBar`

- Changed: `views/shared/card/ProjectCard.svelte:363` mounts `<CommandBar {repo} />` for a card whose folder is a repository; the control list the card built for itself is gone. `CardActions.svelte` draws no command now and is unchanged.
- Tests: `tests/views/boards/project.test.ts` (`draws the command bar on the card, one button for each command`, `draws five buttons and the overflow menu for seven commands, as the bar does elsewhere`), `tests/views/shared/card/card-commands.client.test.ts` (the real `ProjectCard` mounted with the real `CommandBar`).
- Fails on the base: `project.test.ts`: `AssertionError: expected '<!--[--><section class="pane svelte-b...' to contain 'data-command-bar'` and `expected +0 to be 5`; `card-commands.client.test.ts` `audits that both commands mount on the bar, each with its source beside the name`: `Svelte error: effect_update_depth_exceeded`. Its other case, `audits that no bar mounts for a folder the git channel does not carry as a repository`, passes on the base (guard).

### 3. `CommandForm.svelte` and `CommandAsk.svelte` in `shell/commands/`

- Changed: both files moved from `src/lib/shell/keys/` to `src/lib/shell/commands/`; `Workbench.svelte` imports from there; the test moved to `tests/shell/commands/command-ask.test.ts`; the comment above `SHELL_STORES` in `tests/checks/tree/boundaries.test.ts:310-316` names the folder. `CommandAsk.svelte` no longer imports the store: it takes the chain lines as `{ folder, run }` objects. Listed as a Z301 decision below.
- Test: `tests/shell/commands/command-ask.test.ts`; `npm run test:checks` (boundaries, order) passes.
- Fails on the base: `Error: Cannot find module '../../../src/lib/shell/commands/CommandAsk.svelte'`.

### 4. Found preset names

- Changed: HELP.md (`## Project commands`) names `cmake: <n>`, `cmake build: <n>` and `ctest: <n>`. The code is unchanged. Listed as a Z301 decision below.
- Proof: `tests/server/machine/commands/found.test.ts:38-42` holds the three names and passes on the base and now; `grep -n "cmake build:" HELP.md` prints the sentence. No test fails without the HELP.md change.

### 5. Run grouping, and a run line ending in a backslash

- Changed: `server/machine/commands/chain.ts:20-24` (`lineOf`) keeps the group: a run line that holds `;`, `&`, `|`, `#` or a line break, or ends in a backslash, is run as `{ <run>\n}`, and a line ending in a backslash is followed by an empty line before the `}` (a backslash before a line break joins the brace onto the command). Listed as a Z301 decision with its reason below.
- Tests: `tests/server/machine/commands/chain.test.ts` `closes the group of a line that ends in a backslash, so the next command still runs` and `runs the command after one with a ;, a # or a trailing backslash only when it succeeded` run the joined line with a real `sh -c` for `\`, `;` and `#`.
- Fails on the base: `AssertionError: expected 'sh: -c: line 2: syntax error: unexpec...' to be ''` and `AssertionError: echo ok \: expected 2 to be +0`.

### 6. The chain approved as one `command` entry

- Changed: `server/machine/approvals/approvals.ts:53-67` (`chainLines`, `chainText`): one entry for the whole chain, its text JSON of the repository's real path and the `[folder, run]` pairs in run order (a tab or a line break inside a field cannot read as a boundary). `run.ts` answers `{ approve: [{ folder, run }, ...] }` with every line; `POST /api/commands` `approve` takes `chain: [{ folder, run }]` and writes one entry (`routes.ts:105`); `CommandAsk.svelte` lists every line with its folder.
- Tests: `run.test.ts` `asks for the whole chain, one line for each command in run order, and starts nothing`, `asks for the whole chain although each of its commands was approved alone`, `asks again when the command that was approved alone gains a dependency`, `asks again when a dependency of an approved chain is removed`, `asks again when the line changed`, `asks again when only the folder changed`; `runs once the chain is approved, and does not ask again for the unchanged chain` (guard on the base); `approvals.test.ts` (`the text a chain is approved by`, 4 cases); `routes.test.ts` `approves the chain it is given as one entry, once however often, and starts no process`; `tests/shell/commands/command-ask.test.ts` (the dialog lists every line).
- Fails on the base: `expected { approve: [ '.\tmake', ...(1) ] } to deeply equal { approve: [ ...(2) ] }`; `expected { approve: [ 'sub\tmake test' ] } to deeply equal { approve: [ ...(2) ] }` (build and test approved one by one, then the chain asks); `asks again when the command that was approved alone gains a dependency` and `... a dependency of an approved chain is removed`: `expected { ok: true, terminal: { ...(16) } } to deeply equal { approve: [ ...(2) ] }`; `asks again when the line changed`: `expected { approve: [ '.\tmake -j4' ] } to deeply equal { approve: [ { folder: '.', ...(1) } ] }`; `approvals.test.ts`: `TypeError: chainText is not a function`.

### 7. A name held by two sources

- (a) Keys: `views/shared/commands/commands.ts` `commandKey(command)` is `<source>:<name>`, used by the each-blocks of `CommandBar.svelte`, the overflow menu ids and the Manage items (`edit:saved:deploy`), and `views/sources/files/tree/menu/row-menu.ts` (`run-command:<source>:<name>`). A pick is read back as `{ action, source, name }` with `pickOf`, whatever the name holds.
- (b) Server: the `command` action requires `source` (`file`, `saved` or `found`); without one the answer is 400 with `server.commands.source`; the server resolves the command by source and name (`run.ts:81-83`), and `TerminalJob` / the task mark carry the source. Every press in the bar, the overflow menu, the default keys and the Files menu sends it; Rerun and Restart respawn the pane's own line and resolve nothing.
- (c) Display: a name two commands hold is drawn as `name (file)` / `name (saved)` through the words `named` and `word_file`, `word_saved`, `word_found` of `config/text/views/shared/commands.yml`; a name one command holds is drawn alone.
- (d) Form: `server/machine/commands/routes.ts:70-77` (`saveRefusal`) refuses a saved name that the repository file or a found command holds, with `server.commands.held_file` / `held_found`, writing nothing; the form shows the sentence.
- Tests: `tests/views/shared/commands/commands-menu.test.ts` (keys, labels, overflow ids, picks), `tests/views/sources/files/menu/files-menu.test.ts` (`audits that a name two sources hold is two items, each with its source in its label`), `tests/routes/commands.test.ts` (`refuses a saved name that the repository file already holds, writing nothing`, `... that a command found in the repository holds ...`, `saves again a name that only the saved list holds`), `run.test.ts` (`the source a press names`).
- Fails on the base: `TypeError: commandKey is not a function`; `expected [ 'run:build', 'run:deploy' ] to deeply equal [ Array(2) ]`; `expected [ 'run-command:build', ...(1) ] to deeply equal [ 'run-command:file:build', ...(1) ]`; `routes.test.ts`: `AssertionError: expected 200 to be 400` for both held names.

### 8. The duplicate-name tests mount the real components

- Changed: `tests/ui/frame/fake-dom.ts` is a minimal DOM (`installDom()`, `removeDom()`) the client project's runtime lacks, so Svelte's keyed-each check runs. `commands-keys.client.test.ts` mounts the real `CommandBar`, `card-commands.client.test.ts` the real `ProjectCard` with the real `CommandBar`, `run-command-keys.client.test.ts` the real Files `MenuList`; `picks-commands.client.test.ts` mounts the Files picks. The five cases of `commands-keys.client.test.ts` are `audits that both commands mount, each with its source beside the name`, `audits that a press sends the source of the button pressed`, `audits that the pair after the fifth button is two overflow items under distinct ids`, `audits that a name only one source holds is drawn without its source` and `audits that the list is held while the bar is mounted and let go when it unmounts`; the case of `run-command-keys.client.test.ts` is `audits that each source mounts as one item, and a pick of one carries its source`. The bits-ui components (`ToolButton`, `ContextMenu`, `Menu`, `Tag`, `AskConfirm`, and the card's `Card`, `Chip`, `Glyph`, `CardActions`, `CardDetails`, `CardLinks`, `CardSessions`, `Clamp`, `Subtasks`) are replaced by stubs with `vi.mock`, so layout, focus and the real menu widgets are not exercised.
- Mounting found a defect in the store that string renders could not: `watch` read the count it writes inside an effect, so mounting any bar threw `effect_update_depth_exceeded`. `watch` now reads and writes that count untracked (`commands.svelte.ts` `watch`).
- Fails on the base: `Svelte error: each_key_duplicate` (`commands-keys.client.test.ts` three cases, `run-command-keys.client.test.ts`) and `Svelte error: effect_update_depth_exceeded` (`card-commands.client.test.ts`, two cases of `commands-keys.client.test.ts`). All titles start with `audits that`.

### 9. The approvals folder is made 0700

- Changed: `approvals.ts` `privateFolder`: each write to the default approvals file makes its folder mode 0700 when looser and owned by the current user, and leaves a folder another user owns as it is; a file the `approvals` key names elsewhere leaves its folder as it is (round 2, ruling 4); the file stays 0600. `config/catalogs/options.yml` (`approvals`), DESIGN.md's Approval paragraph and HELP.md say it. Host-visible: the brief gives `~/.oculus` as 0755 on this host before the round; after the first approval it is 0700 (not measured here: the tests run with HOME in scratch and `~/.oculus` was not read).
- Test: `approvals.test.ts` `makes a folder that stood with looser permissions private when it writes in it` (a 0755 folder becomes 0700) and `makes a file that stood with looser permissions private when it writes it` (0600).
- Fails on the base: `AssertionError: expected 493 to be 448`.

### 10. The tmux end wait in `task.test.ts`

- Changed: the sleep-and-look loop is replaced by an event: `tests/server/machine/pty/tmux-fixture.ts` `watchEnds` sets a global `pane-died` hook that runs `wait-for -S died`, and `task.test.ts` waits with `tmux wait-for died` (`until`, `task.test.ts:184-190`). An event exists, so no poll remains and no deadline of a poll is needed.
- Proof: `npx vitest run tests/server/machine/pty/task.test.ts tests/server/machine/pty/sessions.test.ts` on the private socket: `Test Files  2 passed (2)`, `Tests  29 passed (29)`. No test fails without this change.

### 11. A test of the server's `source` choice

- Test: `run.test.ts` `runs the saved command of a name the file also holds, and asks for the file one`, `refuses a source that holds no command of that name`, `is required: a press without one is refused with the sentence for it and starts nothing`, `records the source in the mark of the task terminal`; `task.test.ts` `records the source of the command in the mark and lists it back` (real tmux).
- Fails on the base: `expected { approve: [ '.\tmake from-file' ] } to deeply equal { approve: [ { folder: '.', ...(1) } ] }`; `expected 200 to be 400`; `expected { ...(2) } to deeply equal { ...(3) }`; `task.test.ts`: `AssertionError: expected { repo: '/r', name: 'build' } to deeply equal { repo: '/r', name: 'build', ...(1) }`.

### 12. `editor-status.svelte.ts` header

- Changed: the header comment (`state/workbench/navigation/editor-status.svelte.ts:4-7`) is one paragraph wrapped at the hundredth column. Proof: `npm run test:checks` (`comment-width`) passes; no test fails without it.

### 13. `terminals.svelte.ts` under its cap

- Changed: `closeEnded` and `moveInto` moved to `state/sessions/terminal/terminal-lists.ts`; the file ends at 875 lines (`wc -l src/lib/state/sessions/terminals.svelte.ts` prints 875), 25 under its 900 cap. The brief names the result marks or the poll as the part to move; the step's own additions to this file are 11 lines, so the moved part is two self-contained functions the file already held.
- Proof: `wc -l` of the three files: 875, 570 (`pty/routes.ts`) and 677 (`pty/sessions.ts`). No test fails without it.

### 14. Exports removed

- Changed: `export` removed from `jobOption`, `parseJob`, `respawnArgs`, `TASK_OPTION` (`pty/sessions.ts:66,192,203,525`) and `COMMANDS_FILE`, `folderOf` (`commands/files.ts:25,84`). `grep -rlE "\b(jobOption|parseJob|respawnArgs|TASK_OPTION)\b" src tests` prints `src/lib/server/machine/pty/sessions.ts` only, and `grep -rlE "\bCOMMANDS_FILE\b" src tests` prints `src/lib/server/machine/commands/files.ts` only; no test imported them. `folderOf` is also the name of a function in `server/content/images.ts` and `state/client/selectors.svelte.ts`; those are other functions.
- Proof: `npm run check` and `npm test` pass. No test fails without it.

### 15. `saved.ts` writes read their result back

- Changed: `server/machine/commands/saved.ts:82-90`: the map is written whole, private, then read and parsed; a result that is not what was asked throws, and the route answers 409 with the reason.
- Test: `tests/routes/commands.test.ts` `refuses a save whose read-back is not what was written, answering the reason`.
- Fails on the base: `AssertionError: expected 200 to be 409`.

### 16. The `SHELL_STORES` comment

- Changed: `tests/checks/tree/boundaries.test.ts:310-316` names the keys, `CommandAsk.svelte` and `CommandForm.svelte`. Proof: `sed -n 310,317p tests/checks/tree/boundaries.test.ts`. No test fails without it.

### 17. Chain-aware cwd for diagnostics

- Changed: the store follows the `printf '%s\n' <name>` marker each chain command prints (`commands.svelte.ts:572-604` `note`, `chainOf` at :519): the path an error line names is read from the folder of the command that printed it, the chain being the one the task terminal's mark carries (round 2, ruling 3), output before the first marker from the pressed command's folder; `errorFile` (:552-566) tries the pressed command's folder, then the folders of the commands it ran first. The scrollback replacing the output starts again from the first command.
- Tests: `commands-output.test.ts` `the diagnostics of a chain` (4 cases, among them `test` with cwd `sub` depending on `build` with the repository as cwd) and `the file an error line names, in a chain`.
- Fails on the base: `expected [ 'sub/src/a.c', 'sub/src/b.c' ] to deeply equal [ 'src/a.c', 'sub/src/b.c' ]`; `expected null to deeply equal { repo: '/work/repo', path: 'src/a.c' }`.

### 18. The Files view asks when a menu opens

- Changed: the effect of `views/sources/files/tree/control/picks.svelte.ts` that watched every repository row the tree drew is gone; `menuOf` (:155-185) loads the repository's commands when the row menu opens on a repository, once, and puts the Run Command items into the menu it was asked for; a row that is no repository asks nothing; an answer that arrives after a second menu opened goes to the menu it was asked for. On the base the tree watched each repository row, so a view reading a list was answered by a GET for each.
- Tests: `picks-commands.client.test.ts` (5 cases): `audits that three repository rows drawn ask for none of their commands, and hold none` (draws three repository rows, then reads each one's list in an effect and expects no `GET /api/commands`), `audits that the menu of a row asks for its repository once, and gains its Run Command items`, `audits that the menu of a row that is no repository asks for nothing` (passes on the base: a guard), `audits that each menu gets the answer asked for it when a second menu opened first`, `audits that a late answer lands in the items of the menu it was asked for, closed or not`.
- Fails on the base: `AssertionError: expected [ ...(3) ] to deeply equal []`; `AssertionError: expected [] to have a length of 1 but got +0`; `TypeError: answers[two] is not a function`; `TypeError: answers[commandsAsked(...)[0]] is not a function`. The first case also fails on the final tree with the base's watch effect added back to `picks.svelte.ts` in a scratch copy: `AssertionError: expected [ ...(3) ] to deeply equal []`.

### 19. The repository in the approval key

- Changed: `chainText(repo, lines)` (item 6) includes the repository's real path (`repositoryOf` resolves it, `server/machine/commands/repo.ts`). DESIGN.md's Approval paragraph and HELP.md (`Approval.`) say the key is over the repository's path and the chain's lines.
- Tests: `run.test.ts` `asks in a repository for a chain approved only in another one`; `approvals.test.ts` `differs for another repository, another folder, another line and another order`.
- Fails on the base: `expected { ok: true, terminal: { ...(16) } } to deeply equal { approve: [ { folder: '.', ...(1) } ] }`; `TypeError: chainText is not a function`.

### 20. A placeholder inside quotes is refused

- Changed: `server/machine/commands/placeholders.ts` `unsafePlaceholder(run)` finds a placeholder that is not bare (round 2, ruling 1 replaced the first scanner, `quotedPlaceholder`, by one tokenizer shared with the filler). `run.ts:88` refuses at run and `routes.ts:76` at save, with `server.commands.quoted`, `.escaped` or `.commented` naming the command and the placeholder; the form shows the sentence. HELP.md says placeholders are written bare.
- Tests: `placeholders.test.ts` (`unsafePlaceholder`); `run.test.ts` `refuses a placeholder inside quotes, naming it and the command, and starts no process` (`echo "${selectedText}"` and `echo '${file}'`, no process); `runs a bare placeholder as one word, so a selection holding $(...) runs nothing` (selection `$(touch x)` creates nothing; a guard, it passes on the base); `routes.test.ts` `refuses a line with a placeholder inside quotes, naming it, writing nothing`.
- Fails on the base of round 1: `TypeError: quotedPlaceholder is not a function`; `AssertionError: expected 200 to be 400`.

### 21. This table

The table of host- and user-visible changes of the round follows.

### What a reader or the host sees, before and after this round

| Where | Before the round | After the round |
|---|---|---|
| Project card | a control per command built in `ProjectCard.svelte` | the same bar as the Repositories view: five buttons, an overflow menu, the add control |
| A name two sources hold | one button, the press could run the other source's command | two buttons, each drawn `name (file)` / `name (saved)` / `name (found)`, each press carries its source |
| The form | saved a name the file or a found command held; accepted a placeholder in quotes | refuses both with a sentence in the form, and a save whose read-back differs |
| Approval of a chain | one entry for each command, listed one by one | one entry for the whole chain, the dialog lists every line with its folder |
| Approval key | the lines of the command | the repository's real path and the lines (`JSON.stringify({ repo, chain: [[folder, run], ...] }, null, 1)`); the same text in another repository asks again, and approvals given before this text ask again |
| `~/.oculus` | 0755 on this host (the brief) | 0700 after the next write to the default approvals file, the file 0600; a file the `approvals` key names elsewhere leaves its folder as it is |
| A placeholder inside quotes, after a backslash or in a comment | filled there | refused at save and at run, naming it; placeholders are written bare |
| Files view | the tree watched every repository row it drew, so a view reading a repository's list was answered by a `GET /api/commands` for each | the tree watches none; a repository's commands are asked for when its row menu opens, one request |
| A task terminal no pane shows, or one a pane let go of before it ended | no diagnostics | one capture when it ends, diagnostics from it |
| An error path in a chain | read from the folder of the command pressed | read from the folder of the command that printed it, the folders being those the task terminal's mark carries |
| Wire | the `command` action took a name | it requires `source`; a new `capture` action; `approve` carries `{ folder, run }` lines |

### New wire shapes

```
POST /api/terminal  { action: 'command', repo, name, source: 'file' | 'saved' | 'found', context?, cols?, rows? }
  -> 200 { ok: true, terminal } | 200 { approve: [{ folder, run }, ...] } | 400 { error }   (400 without source)
POST /api/terminal  { action: 'capture', id }
  -> 200 { ok: true, id, output } | 400 { error }                                           (unlisted id, no tmux call)
POST /api/commands  { action: 'approve', repo, chain: [{ folder, run }, ...] }              -> 200 { ok: true } | 409 { error }
tmux user option @oculus_task = { "repo": ..., "name": ..., "source"?: 'file' | 'saved' | 'found', "chain"?: [{ "name": ..., "cwd": ... }, ...] }
Terminal.job = { repo, name, source?, chain?: { name: string; cwd: string }[] }
approval entry  command:<sha256 of JSON { repo, chain: [[folder, run], ...] }>
```

### Z301 decisions and the other choices of the round

- The form lives in `shell/commands/` (ruling 3), the drawing owner being the shell, for the reason in "Judgment calls" 1.
- Found preset names `cmake: <n>`, `cmake build: <n>`, `ctest: <n>`: they keep a configure and a build preset of one name apart (ruling 4).
- Run grouping `{ run; }` is kept: a run line may be a list of statements (`a; b`), and the group makes `&&` after it test the whole list, not its last statement; a line ending in `\` is followed by a line break before `}` (ruling 5).
- Approvals folder mode 0700, only for a folder owned by the current user and only for the default approvals path (rulings 9 and round 2, 4).
- The approval text is JSON `{ repo, chain: [[folder, run], ...] }`, not the brief's `<cwd>\t<run>` lines: a tab or line break inside a folder or a line would read as a boundary, and the repository path has no place in that shape (rulings 6 and 19).
- A placeholder in quotes is refused at save and at run (ruling 20).
- `source` and the chain (each command's name and folder) are recorded in the task mark and in `TerminalJob`: Rerun and Restart resolve the same command (ruling 7) and the store reads the folders of a chain's errors from the mark (round 2, ruling 3).
- `resolveChain` is in `data/helpers/run/chain.ts` and `tasks.ts` moved beside it to `data/helpers/run/tasks.ts`: `src/lib/data/helpers` held eleven items (`sh utils/folder-check.sh` refuses more than ten). Only the server imports the chain since round 2 (ruling 3), and the state row of the boundaries test lists `data/helpers/run/tasks` alone.
- `closeEnded` and `moveInto` moved to `terminal-lists.ts` (ruling 13).
- `watchEnds` replaces the poll in `task.test.ts` (ruling 10).
- `tests/ui/frame/fake-dom.ts` is a test fixture of this round (ruling 8).

## Repair round 2

The 13 rulings of `agents/briefs/D17-round2.md`. "Base" below is a copy of the tree as it stood before this round (`d17r2-base` in the session scratchpad, node_modules linked) with this round's final test files copied over it, run with `npx vitest run <the test files of rulings 1 to 4>` (output kept in the session scratchpad as `d17r2-base-run.txt`: `Test Files  9 failed | 7 passed (16)`, `Tests  33 failed | 379 passed (412)`); each quoted line is what that run printed for the test. A test that passes on the base is a guard and is named as one. Rulings 5, 6, 7, 9, 10, 11, 12 and 13 change a text, an export list, a title or a comment, so no test of them fails without the change; each has the command that shows its end state.

### Round 2, ruling 1: one tokenizer for the scanner and the filler

- Changed: `server/machine/commands/placeholders.ts` reads a run line once (`placeholdersOf`, :55) tracking single quotes, double quotes, `$'...'`, a backslash outside single quotes and a `#` that starts a comment at the start of a word (to the end of the line), and gives every `${name}` with where it stands: `bare`, `quoted`, `escaped` or `comment`. `fillPlaceholders` (:149) replaces only the bare ones through those positions. `unsafePlaceholder` (:97) returns the first placeholder that is not bare and `unsafeSentence` (:107) words it with `server.commands.quoted`, `.escaped` or `.commented` (`config/text/server.yml`). `run.ts:88` refuses at run and `routes.ts:76` at save, with no process started; the form shows the sentence. `quotedPlaceholder` is gone (`grep -rl quotedPlaceholder src tests config HELP.md DESIGN.md README.md` prints nothing). HELP.md says placeholders are written bare, outside quotes, a backslash and a comment.
- Tests: `placeholders.test.ts` (`unsafePlaceholder`, 9 cases; `the filler and the scanner read a line the same way`, 2 cases); `run.test.ts` `refuses a placeholder after a backslash, in a comment or in $'...', and starts no process` (selections `$(touch <scratch>/x)` and `; touch <scratch>/y #`, lines `echo "${selectedText}"`, `echo \${selectedText}`, `true # it's` then `echo '${selectedText}'`, and `$'${selectedText}'`; each refused with 400, no tmux call, and nothing created), `runs a bare placeholder after a comment that holds an apostrophe, the value as one word` (`true # don't` then `echo ${selectedText}`: the started line is run through real `/bin/sh -c`, the placeholder is filled with the selection as one word, and neither `x` nor `y` is created); `tests/routes/commands.test.ts` `refuses a line with a placeholder after a backslash or in a comment, naming it, writing nothing`.
- Fails on the base: `TypeError: unsafePlaceholder is not a function` (9 cases); `AssertionError: expected 200 to be 400 // Object.is equality` (`run.test.ts` and `routes` refusal cases); `fills only the bare placeholders, through the positions the scanner found`: `AssertionError: expected { Object (line) } to deeply equal { Object (line) }` (the base filled the placeholder in the comment); `runs a bare placeholder after a comment that holds an apostrophe, the value as one word`: `AssertionError: expected undefined to be true`.

### Round 2, ruling 2: the capture after a grid lets go

- Changed: `terminals.svelte.ts` counts the calls of `subscribePty` that still read each terminal (`reading`, :800, a call's release counts once) and exposes `subscribed(id)` (:855). `commands.svelte.ts:612` `readEnded` captures an ended task terminal once for each run (the pane's pid) unless `terminals.subscribed(id)` holds at that moment; `capture` (:626) drops its answer when the line started again, the terminal went, or a grid subscribed while the capture was out, and otherwise feeds it to `note` as scrollback, which replaces what was held. A terminal a grid only fed earlier and let go of before the end is captured.
- Tests: `commands-output.test.ts` `asks once for a terminal whose pane let go before it ended, and reads what came after` (`note` while running, `subscribePty` released, the task ends with an error printed after: one capture request, both diagnostics read), `asks for a terminal one of two panes still reads only when both let go`, `does not ask for a terminal a pane still reads when it ends, and keeps what it read` and `does not replace the output a pane fed while the capture was out` (guards, they pass on the base); `terminals.test.ts` `says a terminal is read while a call of subscribePty holds it, until the last lets go`; and the end-to-end case `tests/state/sessions/terminal/commands-pane.test.ts` `reads the diagnostics printed after the grid let go, each from the folder of its command`: a real pane on the private tmux socket prints `build`, `src/a.c:3: error: boom`, waits for a gate file, prints `test`, `src/b.c:4: error: bad` and fails; the store reads the pane while it runs (`subscribePty` and `note`), the grid lets go, the line ends, the store asks `/api/terminal` (answered by the server's own `captureTask` over `paneOutput`), and `commandDiagnostics()` yields `src/a.c:3 boom` and `sub/src/b.c:4 bad` with one capture request.
- Fails on the base: `asks once for a terminal whose pane let go before it ended`: `AssertionError: expected [] to deeply equal [ { action: 'capture', ...(1) } ]`; `asks for a terminal one of two panes still reads only when both let go`: `expected [ { url: '/api/terminal', ...(2) } ] to deeply equal []`; `terminals.test.ts`: `TypeError: subscribed is not a function`; `commands-pane.test.ts`: `AssertionError: expected [ [ 'src/a.c', 3, 'boom' ] ] to deeply equal [ [ 'src/a.c', 3, 'boom' ], ...(1) ]`.

### Round 2, ruling 3: the chain's folders come from the task terminal's mark

- Changed: the mark `@oculus_task` carries the chain in run order, `chain: [{ name, cwd }, ...]` (`run.ts:109` writes it, `pty/sessions.ts:200` `jobShape` reads it and drops a chain of another shape, `TerminalJob.chain` in `model-sessions.ts`, the `job` shape of `terminal-payloads.ts`). The store's `chainOf(id)` (:519) is `record(id)?.job?.chain ?? null`; it no longer asks the repository's command list, so a list forgotten or changed after the run changes nothing. `note` advances to the next command only when a complete line equals that command's printed name exactly (`line === chain[started].name`); output before the first name is read from the folder of the command pressed (the last command of the chain); a mark with no chain reads from the repository. Nothing in `src/lib/state` or `src/lib/views` imports `data/helpers/run/chain.ts` now (`grep -rln "helpers/run/chain" src` prints `server/machine/commands/{run,list,chain}.ts`), so `data/helpers/run/chain` left the state row of `tests/checks/tree/boundaries.test.ts` and the state row of DESIGN.md, and the head comment of `chain.ts` and the boundaries comment no longer say the page resolves a chain.
- Tests: `commands-output.test.ts` `the diagnostics of a chain` (`test`, folder `sub`, depends on `build`; the terminal's mark carries the chain): `reads the path an error names from the folder of the command that printed it`, `reads the folders from the mark when the repository list was never read`, `reads the folders from the mark when the list now holds the commands elsewhere` (a seeded list that puts both commands in other folders), `follows the commands across chunks and across a line split in two`, `moves to the next command only on a line that is exactly its name` (`building build`, `rebuild`, ` build`, `test failed` do not advance; `build` and `test` do), `starts again from the first command when the scrollback replaces the output`, `reads output printed before the first command name from the folder of the command pressed`, `reads a plain command from its own folder`, `reads a mark that names no chain from the repository` (a guard), and `the file an error line names, in a chain`; `commands.test.ts` `names the cwd the mark lists the command with as the folder a relative file is resolved from`; `run.test.ts` `records the source and the chain, each command with its folder, in the mark of the task terminal` and `records a chain in run order with the folder of each command`; `task.test.ts` `reads a running task, an ended one and a terminal that is none` (a mark with a chain gives it back, a chain of another shape is dropped) and the real-tmux `records the chain, each command with its folder, and lists it back`; the end-to-end case of ruling 2 reads both folders from a real pane's mark.
- Fails on the base: `reads the folders from the mark when the repository list was never read`: `AssertionError: expected [ 'src/a.c', 'src/b.c' ] to deeply equal [ 'src/a.c', 'sub/src/b.c' ]`; `reads the folders from the mark when the list now holds the commands elsewhere`: `expected [ 'y/src/a.c', 'y/src/b.c' ] to deeply equal [ 'src/a.c', 'sub/src/b.c' ]`; `reads output printed before the first command name from the folder of the command pressed`: `expected [ 'src/c.c' ] to deeply equal [ 'sub/src/c.c' ]`; `commands.test.ts`: `expected '/work/repo' to be '/work/repo/sub'`; `run.test.ts`: `expected { ...(3) } to deeply equal { ...(4) }`; `task.test.ts`: `expected { repo: '/r', name: 'build' } to deeply equal { repo: '/r', name: 'build', ...(1) }`.
- Limit, unfixed: the marker is the command's bare name on a line of its own. A command whose own output has a line equal to the next command's name moves the chain to that command early, so the diagnostics after that line are read from the next command's folder. A unique marker (a per-run token in the printed line) changes the text the terminal shows, a user-visible shape no ruling names; it is raised below as D17-B and not built. The exact-line guard tests pin the matching that is built; no test asserts the limit.

### Round 2, ruling 4: the folder mode only for the default approvals path

- Changed: `approvals.ts:134` runs `privateFolder` only when the file is `defaultApprovalsPath()`; a file the `approvals` key names elsewhere leaves its folder's mode as it is (the file itself is 0600 in both cases). The doc comment of `privateFolder` states the scope.
- Tests: `approvals.test.ts` `makes a folder that stood with looser permissions private when it writes in it` (the default path, a 0755 folder becomes 0700; passes on the base), `leaves the folder of a file the approvals key names elsewhere as it stands` (a 0755 `shared/` and a 0755 home stay 0755, the file 0600), `leaves a default folder another user owns as it stands` (`process.getuid` mocked to another user, the 0755 default folder stays 0755; passes on the base, a guard of the owner check).
- Fails on the base: `leaves the folder of a file the approvals key names elsewhere as it stands`: `AssertionError: expected 448 to be 493 // Object.is equality`.

### Round 2, ruling 5: the approval text in DESIGN.md and HELP.md

- Changed: the DESIGN.md Approval paragraph states the exact text hashed, `JSON.stringify({ repo, chain: [[folder, run], ...] }, null, 1)`, what each field is, the key `command:<sha256 of that text>`, and that the folder is made 0700 only for the default path. HELP.md's `Approval.` paragraph says approvals given before this text ask again, and that a file elsewhere leaves its folder as it is. `config/catalogs/options.yml` (`approvals`) says the same. Proof: `grep -n "JSON.stringify({ repo, chain" DESIGN.md`, `grep -n "ask again" HELP.md`. No test fails without it.

### Round 2, ruling 6: the report says the card draws the commands bar

- Changed: "Changes a reader or the host sees, before and after" below says the project card draws the commands bar (Add Command, five buttons, overflow beyond five), not a control per command; the older sentence that said a control per command is replaced. Proof: `grep -n "commands bar" tools/oculus/.scratch/migration/agents/reviews/D17-report.md`. `ProjectCard.svelte:12-14` says the same.

### Round 2, ruling 7: the `order.ts:80` edit

- Listed under "Every edit to an existing assertion": `tests/checks/imports/order.ts:80`, before `shell: ['shell', 'shell/rail', 'shell/status', 'shell/panes', 'shell/keys'],`, after `shell: ['shell', 'shell/rail', 'shell/status', 'shell/panes', 'shell/keys', 'shell/commands'],`. Proof: `sed -n 80p tests/checks/imports/order.ts`. The file is in "Files this step added or changed".

### Round 2, ruling 8: the end-to-end test

- Covered by the end-to-end case of ruling 2 (`commands-pane.test.ts`, a real pane on the private socket through `captureTask` and the store to the diagnostics). Fails on the base with the quoted `expected [ [ 'src/a.c', 3, 'boom' ] ] to deeply equal ...`.

### Round 2, ruling 9: comments as whole paragraphs

- Changed: the head comments of `server/machine/commands/routes.ts` (:1-12) and `ProjectCard.svelte` (:2-14) are whole paragraphs of at most 100 columns, and "Both" is "The GET and the POST both name a repository". Proof: `npm run test:checks` (`comment-width`) passes; `sed -n 1,12p src/lib/server/machine/commands/routes.ts`.

### Round 2, ruling 10: exports removed

- Changed: `outputArgs` (`pty/sessions.ts:575`), `readApprovals` and `commandKey` (`approvals.ts:92,45`) and `sourceWords` (`views/shared/commands/commands.ts`) are not exported. Proof: `grep -rlE "\boutputArgs\b" src tests` prints `src/lib/server/machine/pty/sessions.ts`; `readApprovals` prints `approvals.ts`; `sourceWords` prints `views/shared/commands/commands.ts`; the other `commandKey` (`views/shared/commands/commands.ts:32`) is a different, exported function. `approvals.test.ts` reaches the key and the entries through `approveTexts` and `isApproved` with two local helpers (`keyOf`, `entries`); `commands-menu.test.ts` reaches the source words through `commandTip`. No test fails without it.

### Round 2, ruling 11: HELP.md's source sentence

- Changed: HELP.md says each button and each menu item names its source beside the name, and that the default keys run the default build or test of the repository and name no source. Proof: `grep -n "names its source beside the name" HELP.md`.

### Round 2, ruling 12: a title without "no longer"

- Changed: `tests/shell/commands/command-ask.test.ts:55` reads `draws no form once it is closed`. Proof: `sed -n 55p tests/shell/commands/command-ask.test.ts`.

### Round 2, ruling 13: the head comment of `terminal-lists.ts`

- Changed: it says the file holds two functions that write to the workbench they are handed, `closeEnded` and `moveInto`, and that the others are pure. Proof: `sed -n 1,12p src/lib/state/sessions/terminal/terminal-lists.ts`.

### New wire shape of round 2

```
tmux user option @oculus_task = { "repo": ..., "name": ..., "source"?: 'file' | 'saved' | 'found', "chain"?: [{ "name": ..., "cwd": ... }, ...] }
Terminal.job = { repo, name, source?, chain?: { name: string; cwd: string }[] }
approval text   JSON.stringify({ repo, chain: [[folder, run], ...] }, null, 1)   (key command:<sha256 of the text>)
```

`chain` lists the commands the press runs in run order, each with the folder it runs in; a mark that carries none (a terminal made before this shape) is read from the repository.

### Raised by round 2

- D17-B (for a ruling): the chain's printed marker is the command's bare name. A command whose own output holds a line equal to the next command's name moves the diagnostics to the next command's folder early. Options: (a) keep the bare name (built; the exact-line match is the guard); (b) print a per-run token with the name, for example `printf '%s\n' '<token> <name>'`, which no command output reproduces and which each name line of a chain's terminal then shows. Recommendation: (b). The lazy option is (a), which is built. It changes the text a chain's terminal shows, so it is the reader's to rule on.

## Verify after the round's last change

Run from `tools/oculus` in the worktree after `npm run diagrams`: `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`. The lines it printed that matter:

```
$ npm test
 Test Files  524 passed | 24 skipped (548)
      Tests  12903 passed | 639 skipped (13542)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  446 passed | 9 skipped (455)
$ npm run check
1790977256266 COMPLETED 3186 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Number of full-list runs this round: 2, both ended `checks: 7 commands passed`. `npm run diagrams` ran before them (it regenerated the `.dot` and `.svg` files, which `tests/checks/diagrams` compares byte for byte).

`npm test` carries `--tagsFilter '!slow'`, so the slow files `tests/server/machine/pty/task.test.ts` and `sessions.test.ts` did not run in it; `npx vitest run tests/server/machine/pty/task.test.ts tests/server/machine/pty/sessions.test.ts` ran both on a private tmux socket: `Test Files  2 passed (2)`, `Tests  30 passed (30)`. The new real-pane case `tests/state/sessions/terminal/commands-pane.test.ts` runs in `npm test` (it starts a private tmux server, as `task.test.ts` does) and passed in both full runs.

Other checks, each run after the last change:

- `wc -l src/lib/state/sessions/terminals.svelte.ts src/lib/server/machine/pty/routes.ts src/lib/server/machine/pty/sessions.ts` printed 875, 570 and 677.
- `sh utils/folder-check.sh` exit 0. `ls -1 <folder> | wc -l` prints 10 for `src/lib/data/helpers`, 10 for `src/lib/state/sessions/terminal`, 10 for `src/lib/views/shared`, 9 for `src/lib/server/machine/commands`, 6 for `src/lib/shell/keys`, 2 for `src/lib/shell/commands`, 9 for `tests/server/machine/pty`, 9 for `tests/state/sessions/terminal`, 8 for `tests/views/sources/files/menu`, 4 for `tests/views/shared/commands`.
- `LC_ALL=C grep -rna '[^ -~]' src tests | wc -l` prints 0 (it is the last command of the list).
- The base run of rulings 1 to 4: `Test Files  9 failed | 7 passed (16)`, `Tests  33 failed | 379 passed (412)`, from `npx vitest run` of the test files of those rulings over `d17r2-base` (the pre-round-2 sources, this round's test files); of the 33, one is the `task.test.ts` respawn timeout of the first line of this report and the others are the tests named in the entries of "Repair round 2".

## First run on the unchanged tree

Before any change, the cases of the brief were written as tests and run on the tree as it stood (`d17-base` copy of `tools/oculus` with node_modules linked, `npx vitest run <the case files>`). Result: `Test Files  14 failed (14)`, `Tests  14 failed | 122 passed (136)`. Nine suites failed to load (`Failed Suites 9`: `tests/routes/commands.test.ts`, `tests/server/machine/approvals/approvals.test.ts`, `tests/server/machine/commands/{chain,found,placeholders,run,sources}.test.ts`, `tests/state/sessions/terminal/commands.test.ts`, `tests/views/shared/commands/commands.test.ts`), each with `Cannot find module` for the module the step adds; the other failures were assertions: three in `tests/shell/keys/keys.test.ts`, one in `workbench-keys.test.ts`, one in `channel.test.ts` (poll while a task terminal runs), six in `task.test.ts` (start argv, `LIST_FORMAT`, the row read, and the three real-tmux cases), three in `terminal-close.test.ts`. No rule of the brief gave a wrong result on that run, so the step went on.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 command sources (`.oculus/commands.yml`, `commands.json`, found) | DONE | `tests/server/machine/commands/sources.test.ts`, `found.test.ts`; mutations m01-m12 |
| 2 one shell quoting | DONE | `pty/shell-word.ts`; `routes.ts`, `chat.ts`, `usage/refresh.ts` import it (grep below); the quoted lines asserted in `chain.test.ts` and `run.test.ts` |
| 3 placeholders | DONE, a placeholder inside quotes, after a backslash or in a comment refused (ruling 20, round 2 ruling 1) | `placeholders.test.ts`, `run.test.ts`, `routes.test.ts`; mutations m13-m15 |
| 4 approvals | DONE, one entry for a chain, repository in the key, default approvals folder 0700 (rulings 6, 9, 19, round 2 ruling 4) | `approvals.test.ts`, `run.test.ts`, `routes.test.ts`; mutations m16-m20 |
| 5 routes | DONE | `tests/routes/commands.test.ts`; mutations m27-m29, m77, m78 |
| 6 the run | DONE, source required (ruling 7) | `chain.test.ts`, `run.test.ts`; mutations m21-m26 |
| 7 task terminal, result, Rerun, Restart | DONE | `task.test.ts` (real tmux on a private socket), `channel.test.ts`, `terminal-close.test.ts`, `terminal-marks.test.ts`, `terminal-menu.test.ts`, `terminal-style.test.ts`; mutations m30-m45 |
| 8 errors made clickable, diagnostics | DONE, for a terminal no pane shows or one a pane let go of (ruling 1, round 2 ruling 2) and per command of a chain from the task terminal's mark (ruling 17, round 2 ruling 3) | `commands.test.ts` "the diagnostics of a task terminal", "the file an error line names"; `commands-output.test.ts`; `run.test.ts` `Capture`; `task.test.ts` real tmux capture; mutations m46-m50, m84 |
| 9 default build and test keys | DONE | `keys.test.ts`, `workbench-keys.test.ts`, `commands.test.ts` "the default build and test"; mutations m51-m55, m76 |
| 10 where they are drawn | DONE: the bar on the card and in the Repositories view, the form in `shell/commands/` | `commands.test.ts` (view), `commands-menu.test.ts`, `commands-keys.client.test.ts`, `card-commands.client.test.ts`, `project.test.ts`, `repositories.test.ts`, `files-menu.test.ts`, `picks-commands.client.test.ts`, `command-ask.test.ts`; mutations m56-m63, m79-m83 |
| 11 client store | DONE | `tests/state/sessions/terminal/commands.test.ts`, `commands-output.test.ts`; mutations m64-m75 |
| 12 docs | DONE | `DESIGN.md` Processes paragraph, Approval paragraph and pty bridge bullet; `HELP.md` key rows, terminal row, `## Project commands`, `local.yml` paragraph; `config/catalogs/options.yml` `approvals` |
| Repair round 1, rulings 1 to 21 | DONE | the section "Repair round 1" |
| Repair round 2, rulings 1 to 13 | DONE; the marker's uniqueness is raised as D17-B | the section "Repair round 2"; `sh ~/.claude/skills/land/templates/checks.sh ...` printed `checks: 7 commands passed` |

## The new and changed tests on the unchanged tree, in their final form

This list is the step's first run, before the round: its paths are those of that run (the round moved `shell/keys/CommandAsk.svelte` and `CommandForm.svelte` to `shell/commands/`); the round's own lines are in "Repair round 1".

Each line is a test of a file this step added or changed, run with `npx vitest run <files>` over the base copy holding the final test files (`d17-base`); the line is where it fails there.

- tests/routes/commands.test.ts: every test of the file fails, the file does not load (missing module /src/lib/server/machine/commands/routes.ts)
- tests/routes/sessions/terminal-edit.test.ts: reads them as title, icon and color, empty when the line carries none: fails at tests/routes/sessions/terminal-edit.test.ts:370
- tests/shell/keys/command-ask.test.ts: every test of the file fails, the file does not load (missing module ../../../src/lib/shell/keys/CommandAsk.svelte)
- tests/shell/keys/keys.test.ts: routes Cmd+Shift+B to the default build and Cmd+Alt+T to the default test: fails at tests/shell/keys/keys.test.ts:326
- tests/shell/keys/keys.test.ts: takes Ctrl in place of Cmd off macOS, and Cmd not at all there: fails at tests/shell/keys/keys.test.ts:342
- tests/shell/keys/keys.test.ts: answers while a field is typed in, and under no overlay: fails at tests/shell/keys/keys.test.ts:356
- tests/shell/keys/workbench-keys.test.ts: asks for the default build on Cmd+Shift+B and the default test on Cmd+Alt+T, once each: fails at tests/shell/keys/workbench-keys.test.ts:580
- tests/state/client/client-state.test.ts: holds one instance of every store it names: fails at tests/state/client/client-state.test.ts:62
- tests/state/client/client-state.test.ts: gives two clients separate stores: fails at tests/state/client/client-state.test.ts:69
- tests/state/client/client-state.test.ts: audit: replaces exactly the eleven stores handed the query client and no other: fails at tests/state/client/client-state.test.ts:151
- tests/state/sessions/folds.test.ts: titles a shell by its running command and describes it by its folder: fails at tests/state/sessions/folds.test.ts:348
- tests/state/sessions/folds.test.ts: carries whether a terminal is a task terminal and its exit code into the row: fails at tests/state/sessions/folds.test.ts:367
- tests/views/boards/project.test.ts: draws one control for each command on the card: fails at tests/views/boards/project.test.ts:183
- tests/views/boards/project.test.ts: draws none when the folder is no repository the git channel carries: fails at tests/views/boards/project.test.ts:183
- tests/views/sessions/terminal-menu.test.ts: audits that the task state is null for a shell, running with no exit and ended with one: fails at tests/views/sessions/terminal-menu.test.ts:352
- tests/views/sessions/terminal-menu.test.ts: audits that a running task offers Restart and an ended one Rerun then Restart in the grid menu: fails at tests/views/sessions/terminal-menu.test.ts:363
- tests/views/sessions/terminal-menu.test.ts: audits that a running task offers Restart and an ended one Rerun then Restart in the row menu: fails at tests/views/sessions/terminal-menu.test.ts:379
- tests/views/sessions/terminal-menu.test.ts: audits that the Rerun and Restart picks reach their own handler with the terminal: fails at tests/views/sessions/terminal-menu.test.ts:404
- tests/views/sessions/terminal-style.test.ts: draws a green check on its row once its line ended with 0 and a red cross for any other exit: fails at tests/views/sessions/terminal-style.test.ts:151
- tests/views/sessions/terminal-style.test.ts: draws the result on the bar of a tab showing the one task terminal: fails at tests/views/sessions/terminal-style.test.ts:170
- tests/views/sessions/terminal-style.test.ts: offers Rerun and Restart on the bar once the line ended, and Restart alone while it runs: fails at tests/views/sessions/terminal-style.test.ts:178
- tests/views/whole/type-scale.test.ts: lists every view file in the audit: fails at tests/views/whole/type-scale.test.ts:370
- tests/views/whole/type-scale.test.ts: sets every local role in shared/commands/CommandBar.svelte: fails at tests/views/whole/type-scale.test.ts:22
- tests/data/sources/config/local.test.ts: reads approvals starting with ~/ as under the home folder: fails at tests/data/sources/config/local.test.ts:226
- tests/data/sources/config/local.test.ts: reads approvals as ~ alone as the home folder: fails at tests/data/sources/config/local.test.ts:231
- tests/data/sources/config/local.test.ts: keeps approvals without ~/ as absolute or under the engine folder: fails at tests/data/sources/config/local.test.ts:236
- tests/server/machine/approvals/approvals.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/server/machine/approvals/approvals.ts)
- tests/server/machine/commands/chain.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/server/machine/commands/chain.ts)
- tests/server/machine/commands/found.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/server/machine/commands/list.ts)
- tests/server/machine/commands/placeholders.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/server/machine/commands/placeholders.ts)
- tests/server/machine/commands/run.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/server/machine/approvals/approvals.ts)
- tests/server/machine/commands/sources.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/server/machine/commands/list.ts)
- tests/server/machine/pty/task.test.ts: sets remain-on-exit and marks the session in the same invocation as new-session: fails at tests/server/machine/pty/task.test.ts:57
- tests/server/machine/pty/task.test.ts: ends with the pid of the server, after the fields of a task: fails at tests/server/machine/pty/task.test.ts:121
- tests/server/machine/pty/task.test.ts: reads a running task, an ended one and a terminal that is none: fails at tests/server/machine/pty/task.test.ts:148
- tests/server/machine/pty/task.test.ts: keeps the session of a line that failed, with its status, in every one of 20 runs: fails at Error: no server running on /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-task-XUqNL2/server.sock
- tests/server/machine/pty/task.test.ts: lists a running line with no exit and a passing one with exit 0: fails at tests/server/machine/pty/task.test.ts:175
- tests/server/machine/pty/task.test.ts: runs a chain line whose later commands wait for the earlier ones: fails at tests/server/machine/pty/task.test.ts:175
- tests/state/client/terminal/terminal-close.test.ts: asks nothing about a line that ended, and is stopped when its tab closes: fails at tests/state/client/terminal/terminal-close.test.ts:353
- tests/state/client/terminal/terminal-close.test.ts: asks about a line that runs, whatever program the pane names: fails at tests/state/client/terminal/terminal-close.test.ts:368
- tests/state/client/terminal/terminal-close.test.ts: asks about the running terminals of a tab that also holds an ended task terminal: fails at tests/state/client/terminal/terminal-close.test.ts:377
- tests/state/sessions/terminal/commands.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/state/sessions/terminal/commands.svelte.ts)
- tests/state/sessions/terminal/pty-io.test.ts: hands on the command texts a run asked to have approved: fails at tests/state/sessions/terminal/pty-io.test.ts:86
- tests/state/sessions/terminal/pty-io.test.ts: hands on the process a Restart asked to have confirmed: fails at tests/state/sessions/terminal/pty-io.test.ts:97
- tests/state/sessions/terminal/pty-io.test.ts: names a terminal `always` picks even when the server says it is not busy: fails at tests/state/sessions/terminal/pty-io.test.ts:157
- tests/state/sessions/terminal/terminal-marks.test.ts: is a green check for an exit code of zero and a red cross for any other: fails at tests/state/sessions/terminal/terminal-marks.test.ts:101
- tests/state/sessions/terminal/terminal-marks.test.ts: is empty while the line runs and for a terminal that is no task terminal: fails at tests/state/sessions/terminal/terminal-marks.test.ts:107
- tests/state/sessions/terminal/terminal-marks.test.ts: replaces the icon and the colour on the strip and on the row once the line ended: fails at tests/state/sessions/terminal/terminal-marks.test.ts:113
- tests/state/sessions/terminal/terminal-marks.test.ts: keeps the icon and the colour of the terminal while its line runs: fails at tests/state/sessions/terminal/terminal-marks.test.ts:121
- tests/state/sessions/terminal/terminal-marks.test.ts: draws the kind glyph and no token for a shell with no icon and no colour: fails at tests/state/sessions/terminal/terminal-marks.test.ts:126
- tests/views/shared/commands/commands-menu.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/views/shared/commands/commands.ts)
- tests/views/shared/commands/commands.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/views/shared/commands/CommandBar.svelte)
- tests/views/sources/repositories/repositories.test.ts: draws the commands of the repository above its commit box, and no bar for one with none read: fails at tests/views/sources/repositories/repositories.test.ts:314
- tests/views/sources/files/menu/files-menu.test.ts: audits that a folder and a root with commands offer a Run Command submenu of them, after Find: fails at tests/views/sources/files/menu/files-menu.test.ts:341
- tests/views/sources/files/menu/files-menu.test.ts: audits that a pick runs the command of the repository whose absolute path the row has: fails at tests/views/sources/files/menu/files-menu.test.ts:381
- tests/checks/config/config-folder.test.ts: reads one catalog file per owner and no legacy catalog file: fails at tests/checks/config/config-folder.test.ts:401
- tests/checks/config/config-folder.test.ts: reads each file on its own and finds its own keys there and nowhere else: fails at tests/checks/config/config-folder.test.ts:704
- tests/server/machine/pty/channel.test.ts: runs at the fast rate with no page attached, and at the slow rate once none runs: fails at tests/server/machine/pty/channel.test.ts:416

Tests of this step that pass on the unchanged tree, because they assert that nothing happens there and nothing happens there:

- `tests/views/sources/files/menu/files-menu.test.ts`: audits that a folder or a root with no commands, and a file, offer no Run Command.
- `tests/views/sessions/terminal-style.test.ts`: keeps the kind glyph on the row of a task whose line runs; offers neither on the bar of a terminal that is no task terminal.
- `tests/server/machine/pty/task.test.ts`: starts a terminal that is not a task with neither.
- `tests/server/machine/pty/channel.test.ts`: stays at the slow rate for a list with no task terminal.
- `tests/state/sessions/terminal/pty-io.test.ts`: reads an approve list holding a number, and a confirm that is a number, as no question.
- `tests/checks/tree/boundaries.test.ts`: passes there; its only edit is one entry in a list of allowed names.

## Each behavior removed on a scratch copy

This table was made on the tree before the round. The round moved files (`shell/keys/Command*.svelte` to `shell/commands/`) and edited the store, the server run and the views, so the line numbers and some paths in it are those of that tree; the round's evidence is the failing lines in "Repair round 1".

For each behavior the step adds, the line of source that does it was removed or turned off in a private copy of the final tree (`rsync` of `tools/oculus` without `node_modules`, `config/local.yml` and `.scratch`, node_modules linked, its own `.vite` cache), and the test files that cover it were run. 84 behaviors; every one fails at least one test, and every mutated copy compiled (a test file that fails to load would have been listed as a FILE ERROR; none is). Columns: id, behavior, file under `src/lib/`, result, first failing line.

| id | behavior | file | result | first failing line |
|---|---|---|---|---|
| m01 | a cwd that is a link leading out of the repository is refused | server/machine/commands/files.ts | 1 failing | tests/server/machine/commands/sources.test.ts:120 |
| m02 | an absolute cwd is refused | server/machine/commands/files.ts | 1 failing | tests/server/machine/commands/sources.test.ts:122 |
| m03 | a cwd that climbs out with .. is refused | server/machine/commands/files.ts | 1 failing | tests/server/machine/commands/sources.test.ts:122 |
| m04 | a name over NAME_MAX is refused | server/machine/commands/files.ts | 1 failing | tests/server/machine/commands/sources.test.ts:160 |
| m05 | a name repeated within one source is left out | server/machine/commands/files.ts | 1 failing | tests/server/machine/commands/sources.test.ts:178 |
| m06 | a second default of one kind is ignored | server/machine/commands/files.ts | 1 failing | tests/server/machine/commands/sources.test.ts:195 |
| m07 | the file of the repository is listed before the saved commands | server/machine/commands/list.ts | 1 failing | tests/server/machine/commands/sources.test.ts:261 |
| m08 | saved commands are read per repository | server/machine/commands/saved.ts | 1 failing | tests/server/machine/commands/sources.test.ts:231 |
| m09 | a Makefile line that begins := is not a target | server/machine/commands/found.ts | 2 failing | tests/server/machine/commands/found.test.ts:79 |
| m10 | a hidden preset is left out | server/machine/commands/found.ts | 2 failing | tests/server/machine/commands/found.test.ts:37 |
| m11 | pnpm-lock.yaml selects pnpm | server/machine/commands/found.ts | 2 failing | tests/server/machine/commands/found.test.ts:52 |
| m12 | a found name is one quoted shell word | server/machine/commands/found.ts | 4 failing | tests/server/machine/commands/found.test.ts:79 |
| m13 | a value is one quoted shell word | server/machine/commands/placeholders.ts | 5 failing | tests/server/machine/commands/placeholders.test.ts:18 |
| m14 | a placeholder with no value refuses the run | server/machine/commands/placeholders.ts | 1 failing | tests/server/machine/commands/placeholders.test.ts:52 |
| m15 | any other ${...} is left as written | server/machine/commands/placeholders.ts | 1 failing | tests/server/machine/commands/placeholders.test.ts:75 |
| m16 | a text is approved by its folder as well as its line | server/machine/approvals/approvals.ts | 3 failing | tests/server/machine/commands/run.test.ts:101 |
| m17 | a file that is not JSON refuses the write over it | server/machine/approvals/approvals.ts | 1 failing | tests/server/machine/approvals/approvals.test.ts:113 |
| m18 | the approvals file is mode 0600 | server/machine/approvals/approvals.ts | 1 failing | tests/server/machine/approvals/approvals.test.ts:87 |
| m19 | a text already approved is not added twice | server/machine/approvals/approvals.ts | 1 failing | tests/server/machine/approvals/approvals.test.ts:66 |
| m20 | a command saved through the form needs no approval | server/machine/commands/run.ts | 2 failing | tests/server/machine/commands/run.test.ts:147 |
| m21 | a command that is not approved asks and starts nothing | server/machine/commands/run.ts | 5 failing | tests/server/machine/commands/run.test.ts:101 |
| m22 | a cycle is refused | server/machine/commands/chain.ts | 1 failing | s-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchp] |
| m23 | a command depending on itself is refused with its own sentence | server/machine/commands/chain.ts | 1 failing | tests/server/machine/commands/chain.test.ts:44 |
| m24 | a failed command stops the chain | server/machine/commands/chain.ts | 3 failing | tests/server/machine/commands/chain.test.ts:71 |
| m25 | a name is one quoted shell word | server/machine/commands/chain.ts | 2 failing | tests/server/machine/commands/chain.test.ts:71 |
| m26 | each command of a chain runs once | server/machine/commands/chain.ts | 1 failing | tests/server/machine/commands/chain.test.ts:30 |
| m27 | a relative repo is refused | server/machine/commands/repo.ts | 1 failing | tests/routes/commands.test.ts:130 |
| m28 | a repo under no served root is refused | server/machine/commands/repo.ts | 1 failing | tests/routes/commands.test.ts:118 |
| m29 | a POST needs the write token | server/machine/commands/routes.ts | 1 failing | tests/routes/commands.test.ts:154 |
| m30 | remain-on-exit is set in the invocation that starts the session | server/machine/pty/sessions.ts | 4 failing | tests/server/machine/pty/task.test.ts:57 |
| m31 | the task mark is a tmux user option | server/machine/pty/sessions.ts | 4 failing | tests/server/machine/pty/task.test.ts:60 |
| m32 | an ended line reports its exit status | server/machine/pty/sessions.ts | 4 failing | tests/server/machine/pty/task.test.ts:153 |
| m33 | #{pid} stays the last field of the list format | server/machine/pty/sessions.ts | 5 failing | tests/server/machine/pty/sessions.test.ts:452 |
| m34 | a line that runs refuses Rerun | server/machine/commands/run.ts | 1 failing | tests/server/machine/commands/run.test.ts:264 |
| m35 | Restart of a running line asks for a confirmation first | server/machine/commands/run.ts | 1 failing | tests/server/machine/commands/run.test.ts:292 |
| m36 | Rerun respawns the pane with -k | server/machine/pty/sessions.ts | 2 failing | tests/server/machine/commands/run.test.ts:273 |
| m37 | a running task terminal is polled at POLL_MS with no page attached | server/machine/pty/channel.ts | 1 failing | tests/server/machine/pty/channel.test.ts:421 |
| m38 | an ended task terminal does not count as running | state/sessions/terminals.svelte.ts | 2 failing | tests/state/client/terminal/terminal-close.test.ts:353 |
| m39 | a running task terminal counts as busy whatever program the pane names | state/sessions/terminals.svelte.ts | 1 failing | tests/state/client/terminal/terminal-close.test.ts:368 |
| m40 | a task terminal whose line ended shows its result | state/sessions/terminal/terminal-marks.ts | 4 failing | tests/views/sessions/terminal-style.test.ts:151 |
| m41 | an exit of 0 is a check and any other a cross | state/sessions/terminal/terminal-marks.ts | 4 failing | tests/views/sessions/terminal-style.test.ts:151 |
| m42 | Rerun is offered once the line ended | views/sessions/terminal/terminal-list.ts | 2 failing | tests/views/sessions/terminal-menu.test.ts:363 |
| m43 | a pick of Restart reaches the restart handler | views/sessions/terminal/terminal-list.ts | 1 failing | tests/views/sessions/terminal-menu.test.ts:406 |
| m44 | Rerun is drawn on the bar only for an ended task | views/sessions/terminal/bar/TerminalActions.svelte | 1 failing | tests/views/sessions/terminal-style.test.ts:183 |
| m45 | a task terminal carries its exit into the choice rows | state/sessions/folds.ts | 1 failing | tests/state/sessions/folds.test.ts:367 |
| m46 | the severity is read in any letter case | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:262 |
| m47 | a line matched in a task terminal is a diagnostic with the command as source | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:327 |
| m48 | a rerun replaces the diagnostics | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:370 |
| m49 | a file that does not exist under the repository is not a link | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:652 |
| m50 | only a task terminal keeps diagnostics | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:380 |
| m51 | Cmd+Shift+B is the default build | shell/keys/keys.ts | 4 failing | tests/shell/keys/keys.test.ts:326 |
| m52 | Cmd+Alt+T is the default test | shell/keys/keys.ts | 2 failing | tests/shell/keys/keys.test.ts:331 |
| m53 | Ctrl replaces Cmd off macOS | shell/keys/keys.ts | 1 failing | tests/shell/keys/keys.test.ts:342 |
| m54 | with no file on screen the key says so and runs nothing | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:439 |
| m55 | with no default the key says so and runs nothing | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:449 |
| m56 | an overflow menu holds the commands beyond five | views/shared/commands/commands.ts | 1 failing | tests/views/shared/commands/commands.test.ts:68 |
| m57 | a repository with no commands draws only the add control | views/shared/commands/CommandBar.svelte | 4 failing | tests/views/shared/commands/commands.test.ts:58 |
| m58 | a saved command has Edit and Delete | views/shared/commands/commands.ts | 2 failing | tests/views/shared/commands/commands-menu.test.ts:59 |
| m59 | a file command opens its entry file | views/shared/commands/commands.ts | 2 failing | tests/views/shared/commands/commands-menu.test.ts:63 |
| m60 | a project card draws a control for each command | views/shared/card/ProjectCard.svelte | 1 failing | tests/views/boards/project.test.ts:189 |
| m61 | a repository header draws its commands above the commit box | views/sources/repositories/Repo.svelte | 1 failing | tests/views/sources/repositories/repositories.test.ts:322 |
| m62 | a folder that is a repository offers Run Command | views/sources/files/tree/menu/row-menu.ts | 1 failing | tests/views/sources/files/menu/files-menu.test.ts:341 |
| m63 | a pick of a command runs it in the repository of the row | views/sources/files/tree/menu/row-menu.ts | 1 failing | tests/views/sources/files/menu/files-menu.test.ts:381 |
| m64 | the list of a repository is asked once and held | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:157 |
| m65 | a save reads the list again | state/sessions/terminal/commands.svelte.ts | 4 failing | tests/state/sessions/terminal/commands.test.ts:102 |
| m66 | a files message for a folder holding the repository reads it again | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:128 |
| m67 | a read answered after its last view released it changes nothing | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:174 |
| m68 | the later of two reads wins | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:189 |
| m69 | the question of an earlier press never replaces the later one | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:542 |
| m70 | a refused approval does not run the command | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:525 |
| m71 | a started terminal is shown and selected | state/sessions/terminal/commands.svelte.ts | 2 failing | tests/state/sessions/terminal/commands.test.ts:513 |
| m72 | Restart asks for a confirmation naming the process | state/sessions/terminal/commands.svelte.ts | 3 failing | tests/state/sessions/terminal/commands.test.ts:578 |
| m73 | a run asked to have texts approved hands them on | state/sessions/terminal/pty-io.ts | 7 failing | tests/state/sessions/terminal/commands.test.ts:203 |
| m74 | a terminal named by always is listed as busy | state/sessions/terminal/pty-io.ts | 2 failing | tests/state/client/terminal/terminal-close.test.ts:368 |
| m75 | the client object holds the commands store | state/client/context.ts | 2 failing | tests/state/client/client-state.test.ts:62 |
| m76 | the shell may take the commands store out of the client object | tests/checks/tree/boundaries.test.ts | 3 failing | tests/checks/tree/boundaries.test.ts:442 |
| m77 | a remove keeps the other repositories | server/machine/commands/saved.ts | 1 failing | tests/routes/commands.test.ts:296 |
| m78 | a remove of the last command drops the repository | server/machine/commands/saved.ts | 1 failing | tests/routes/commands.test.ts:266 |
| m79 | openForm holds the repository and the command | state/sessions/terminal/commands.svelte.ts | 2 failing | tests/state/sessions/terminal/commands.test.ts:304 |
| m80 | closeForm closes the form | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:306 |
| m81 | the shell draws the form while the store holds it | shell/keys/CommandAsk.svelte | 2 failing | tests/shell/keys/command-ask.test.ts:38 |
| m82 | the shell hands the form the command being edited | shell/keys/CommandAsk.svelte | 1 failing | tests/shell/keys/command-ask.test.ts:47 |
| m83 | the form of an edit is headed Edit | shell/keys/CommandForm.svelte | 1 failing | tests/shell/keys/command-ask.test.ts:47 |
| m84 | a column is read from an error line | state/sessions/terminal/commands.svelte.ts | 2 failing | tests/state/sessions/terminal/commands.test.ts:242 |

## Async paths and the tests that drive them

Each path has a test in flight (the answer not yet back), after close (its view or terminal gone before the answer) and superseded (a later call answered first).

- The list read of a repository (`commands.svelte.ts` `commands`/`watch`): `asks once however often it is read, and holds the answer`; `changes nothing when a read is answered after its last view released it`; `keeps the later of two reads when the earlier answers last`; `asks for no repository that no view watches`.
- A save and a remove: `reads again only once a save has been answered` (in flight); `reads nothing after a save that is answered once its last view released the list` (after close); `keeps the list the later read gave when two saves are answered in the other order` (superseded).
- A press and its question: `holds the question while the run is in flight and not before`; `keeps the question of the later press when the answer of the earlier one arrives last` and `shows the terminal of an earlier press whose answer arrives after a later one` (superseded); `does nothing for a yes when no question is held` (after close); Restart: `keeps the Restart question of the later press when the answer of the earlier one arrives last`, `posts the Restart confirmation of a terminal that left the list meanwhile and says its refusal` (after close).
- The capture of an ended task terminal (`commands-output.test.ts`): `asks once however many lists name the ended run` (in flight); `holds nothing when the terminal left the list while the capture was out` (after close); `holds nothing of a capture whose line was started again while it was out` and `does not replace the output a pane fed while the capture was out` (a pane subscribed meanwhile; superseded); `asks once for a terminal whose pane let go before it ended, and reads what came after` and `asks for a terminal one of two panes still reads only when both let go` (the reader count, in flight).
- The commands asked for when a Files menu opens (`picks-commands.client.test.ts`): `audits that the menu of a row asks for its repository once, and gains its Run Command items` (in flight); `audits that a late answer lands in the items of the menu it was asked for, closed or not` (after close); `audits that each menu gets the answer asked for it when a second menu opened first` (superseded).
- The file an error line names (`errorFile`): `is null for a terminal that is no task terminal or has left the list` (after close).
- Diagnostics: `replaces them on a rerun, and holds one entry for output replayed twice` (a scrollback that replaces what was read); `holds none for a terminal that is not a task terminal or has ended and left the list`.
- The server saves: `keeps every save of requests in flight together, in the order they came` (`tests/routes/commands.test.ts`).
- The pty channel's poll: `the list poll while a task terminal runs` in `channel.test.ts` (fast rate with no page attached, slow once none runs).
- Closing a tab over a task terminal: `stops a terminal that ended during the read no more than once, and never twice` and the three task cases in `terminal-close.test.ts`.

## Files this step added or changed, with line counts

```
  432 DESIGN.md
  337 HELP.md
  655 config/catalogs/options.yml
   70 config/text/app.yml
   49 config/text/server.yml
   53 config/text/views/shared/commands.yml
   14 src/lib/data/accounts/chat.ts
   46 src/lib/data/helpers/run/chain.ts
   22 src/lib/data/helpers/run/tasks.ts
  510 src/lib/data/model/index.ts
   72 src/lib/data/model/model-commands.ts
  730 src/lib/data/model/model-sessions.ts
  376 src/lib/data/sources/config/local.ts
  145 src/lib/server/machine/approvals/approvals.ts
   37 src/lib/server/machine/commands/chain.ts
  241 src/lib/server/machine/commands/files.ts
  188 src/lib/server/machine/commands/found.ts
   27 src/lib/server/machine/commands/list.ts
  170 src/lib/server/machine/commands/placeholders.ts
   28 src/lib/server/machine/commands/repo.ts
  149 src/lib/server/machine/commands/routes.ts
  172 src/lib/server/machine/commands/run.ts
  158 src/lib/server/machine/commands/saved.ts
  672 src/lib/server/machine/pty/channel.ts
  123 src/lib/server/machine/pty/chat.ts
  158 src/lib/server/machine/pty/edit.ts
  570 src/lib/server/machine/pty/routes.ts
  677 src/lib/server/machine/pty/sessions.ts
   12 src/lib/server/machine/pty/shell-word.ts
  384 src/lib/server/machine/usage/refresh.ts
  148 src/lib/server/root/watch/local.ts
  430 src/lib/shell/Workbench.svelte
   50 src/lib/shell/commands/CommandAsk.svelte
  195 src/lib/shell/commands/CommandForm.svelte
  208 src/lib/shell/keys/keys.ts
  435 src/lib/shell/keys/workbench-keys.svelte.ts
  455 src/lib/state/client/context.ts
  327 src/lib/state/sessions/folds.ts
  705 src/lib/state/sessions/terminal/commands.svelte.ts
  151 src/lib/state/sessions/terminal/pty-io.ts
  112 src/lib/state/sessions/terminal/terminal-lists.ts
   99 src/lib/state/sessions/terminal/terminal-marks.ts
   67 src/lib/state/sessions/terminal/terminal-payloads.ts
   39 src/lib/state/sessions/terminal/workbench-shape.ts
  875 src/lib/state/sessions/terminals.svelte.ts
  211 src/lib/state/sources/repositories/file-git.ts
  143 src/lib/state/workbench/navigation/editor-status.svelte.ts
  526 src/lib/ui/controls/editor/Editor.svelte
  524 src/lib/views/sessions/terminal/Terminal.svelte
  492 src/lib/views/sessions/terminal/TerminalList.svelte
  103 src/lib/views/sessions/terminal/TerminalTitle.svelte
  104 src/lib/views/sessions/terminal/bar/TerminalActions.svelte
  515 src/lib/views/sessions/terminal/grid/TerminalGrid.svelte
  730 src/lib/views/sessions/terminal/terminal-list.ts
  497 src/lib/views/shared/card/ProjectCard.svelte
  170 src/lib/views/shared/commands/CommandBar.svelte
  137 src/lib/views/shared/commands/commands.ts
  200 src/lib/views/sources/files/tree/control/picks.svelte.ts
  397 src/lib/views/sources/files/tree/menu/row-menu.ts
  357 src/lib/views/sources/repositories/Repo.svelte
  512 src/lib/views/sources/repositories/diff/Diff.svelte
  222 src/lib/views/sources/source/Editor.svelte
  508 src/lib/views/sources/source/Source.svelte
   37 src/routes/api/(sessions)/terminal/+server.ts
   35 src/routes/api/commands/+server.ts
  711 tests/checks/config/config-folder.test.ts
  189 tests/checks/imports/order.ts
  639 tests/checks/tree/boundaries.test.ts
   70 tests/data/helpers/run/chain.test.ts
  240 tests/data/sources/config/local.test.ts
  182 tests/fixtures/sessions-fixture.ts
  452 tests/routes/commands.test.ts
  595 tests/routes/sessions/terminal-actions.test.ts
  445 tests/routes/sessions/terminal-edit.test.ts
  223 tests/server/machine/approvals/approvals.test.ts
  124 tests/server/machine/commands/chain.test.ts
  163 tests/server/machine/commands/commands-fixture.ts
  134 tests/server/machine/commands/found.test.ts
  175 tests/server/machine/commands/placeholders.test.ts
  568 tests/server/machine/commands/run.test.ts
  280 tests/server/machine/commands/sources.test.ts
  828 tests/server/machine/pty/channel.test.ts
  470 tests/server/machine/pty/sessions.test.ts
  343 tests/server/machine/pty/task.test.ts
   62 tests/server/machine/pty/tmux-fixture.ts
  697 tests/server/root/watch/sessions.test.ts
   78 tests/shell/commands/command-ask.test.ts
  378 tests/shell/keys/keys.test.ts
  146 tests/shell/keys/palette-open.test.ts
  384 tests/shell/keys/palette.test.ts
  600 tests/shell/keys/workbench-keys.test.ts
  297 tests/shell/status/status-bar.test.ts
  193 tests/state/client/client-state.test.ts
  379 tests/state/client/terminal/terminal-close.test.ts
  443 tests/state/client/terminal/terminal-start.test.ts
  567 tests/state/client/terminal/terminal-tabs.test.ts
  461 tests/state/sessions/folds.test.ts
   90 tests/state/sessions/terminal/commands-fixture.ts
  365 tests/state/sessions/terminal/commands-output.test.ts
  131 tests/state/sessions/terminal/commands-pane.test.ts
  742 tests/state/sessions/terminal/commands.test.ts
  534 tests/state/sessions/terminal/composer.test.ts
  174 tests/state/sessions/terminal/pty-io.test.ts
  128 tests/state/sessions/terminal/terminal-marks.test.ts
  867 tests/state/sessions/terminals.test.ts
   97 tests/state/workbench/navigation/editor-status.test.ts
  256 tests/ui/frame/fake-dom.ts
  593 tests/views/boards/project.test.ts
  559 tests/views/sessions/terminal-menu.test.ts
  195 tests/views/sessions/terminal-style.test.ts
   99 tests/views/shared/card/card-commands.client.test.ts
   36 tests/views/shared/commands/commands-fixture.ts
  136 tests/views/shared/commands/commands-keys.client.test.ts
  178 tests/views/shared/commands/commands-menu.test.ts
  114 tests/views/shared/commands/commands.test.ts
  652 tests/views/sources/files/menu/files-menu.test.ts
  162 tests/views/sources/files/menu/picks-commands.client.test.ts
   19 tests/views/sources/files/menu/picks-root.svelte.ts
   94 tests/views/sources/files/menu/run-command-keys.client.test.ts
  845 tests/views/sources/repositories/repositories.test.ts
  399 tests/views/whole/type-scale.test.ts
```

Moved in the round: `data/helpers/commands-chain.ts` to `src/lib/data/helpers/run/chain.ts` and `data/helpers/tasks.ts` to `src/lib/data/helpers/run/tasks.ts`; `src/lib/shell/keys/CommandAsk.svelte` and `CommandForm.svelte` to `src/lib/shell/commands/`; `tests/shell/keys/command-ask.test.ts` to `tests/shell/commands/`; `tests/data/helpers/commands-chain.test.ts` to `tests/data/helpers/run/chain.test.ts`. `ls` of the old paths prints `No such file or directory` for each.

`docs/diagrams/` holds the regenerated `channels`, `layers` and `layer-{data,server,shell,state,ui,views}` `.dot` and `.svg` files and `writes` (`npm run diagrams`). `package.json` is unchanged. `README.md` is unchanged and still true.

## Judgment calls

1. The form that saves a command is drawn by the shell, not by the commands bar. `src/lib/shell/commands/CommandForm.svelte` is drawn by `CommandAsk.svelte` while the store's `forming()` holds a repository and a command; the bar opens it with `openForm(repo, draft)` and Add with `openForm(repo, null)`. The form is a modal box with its own surface over the wallpaper, and `tests/views/whole/tinted.test.ts` refuses a surface of its own anywhere under a view that asks for the tint (the Repositories view asks and renders the bar). The other ways: a new primitive (`ui/forms` and `ui/frame` already hold ten items each), or loosening that test, which I did not do. Reversible: the form file and three store members.
2. `tests/checks/tree/boundaries.test.ts` `SHELL_STORES` gained `'commands'` (the file is outside the brief's path list): the default build and test keys run a command through the store, and `CommandAsk.svelte` and `CommandForm.svelte` read it; the comment above it names all three.
3. The commands store takes `notices` and `onScreen` as small structural types it declares, and imports no module of `state/workbench`: `tests/checks/imports/order.test.ts` refuses an import from `state/workbench` into `state/sessions`.
4. "The status bar says which" (item 9) is a warning notice (`notices.post(..., { tone: 'warning' })`), shown by the status folder's toast and bell.
5. The card draws the repository's commands through `CommandBar` (ruling 2); `CardActions.svelte` draws no command and is unchanged.
6. `tests/server/machine/pty/tmux-fixture.ts` (new) holds the tmux presence check, the private server's directory, socket and clean-up, and `watchEnds`; `tests/checks/tree/duplication.test.ts` refused the copy in `sessions.test.ts` and `task.test.ts`. `sessions.test.ts` setup moved there; no assertion in it changed.
7. `found.test.ts`, `sources.test.ts`, `approvals.test.ts` and `tests/routes/commands.test.ts` import `it` from `tests/fixtures/scratch.ts`, as `tests/checks/tree/scratch.test.ts` requires of a file that takes scratch directories through a fixture.
8. The pure-function cases of `commands-menu.test.ts` and every case of the client view tests are titled "audits that ...", as `tests/checks/tree/audits.test.ts` requires of a case under `tests/views` that never calls `render`.
9. The reasons above each absence assertion in `commands.test.ts` (view), `project.test.ts`, `terminal-style.test.ts` and `repositories.test.ts` are required by `tests/checks/tree/negatives.test.ts`.
10. The client view tests mount real components over `tests/ui/frame/fake-dom.ts`, a minimal DOM written for them: it has nodes, text, comments, fragments, attributes and element lookup, and no layout, focus, events or styles. The bits-ui and leaf components named in ruling 8 are stubs, so what the tests prove is the keys, the sent source, the effects and the fetches, not the widgets.
11. `resolveChain` and the task argv rule are in `src/lib/data/helpers/run/`: `src/lib/data/helpers` held eleven items before the move and `sh utils/folder-check.sh` refuses more than ten. Only the server imports `resolveChain` now (`grep -rln "helpers/run/chain" src`); the page reads the chain from the task terminal's mark.

## Changes a reader or the host sees, before and after

- Keys: Cmd+Shift+B and Cmd+Alt+T (Ctrl off macOS) were unbound; they run the default build and test of the repository holding the source tab on screen, or say which of file, repository and default is missing.
- A terminal that ended left the list; a task terminal stays, with a green check (exit 0) or a red cross on its strip, row and bar, until it is closed. Closing a tab or pane over an ended task terminal asks nothing; over a running one it asks. Its row and grid menus gain Rerun (ended) and Restart (confirmation naming the process while it runs).
- The Repositories header draws a bar of the repository's commands above the commit box; a project card whose folder is a repository draws the commands bar (Add Command, five buttons, an overflow menu beyond five), not a control per command; the Files row menu of a root or a repository folder gains Run Command.
- The tmux list format gains `#{@oculus_task}`, `#{pane_dead}` and `#{pane_dead_status}` before `#{pid}`; `Terminal` gains `task`, `exit` and `job`.
- A new route `/api/commands` (`GET` list; `POST` save, remove, approve) and the terminal route's actions `command`, `rerun`, `restart`; the refusal that lists the actions names `command`.
- Files: `.oculus/commands.yml` (read), `~/.oculus/commands.json` (written by the form), the approvals file named by the new `approvals` key of `local.yml` (default `~/.oculus/approvals.json`, mode 0600 in a 0700 folder; catalogued in `config/catalogs/options.yml`), new words in `config/text/views/shared/commands.yml` and `config/text/app.yml`.
- The pty channel polls the list at `POLL_MS` while a task terminal runs, with no page attached.
- A task terminal's mark `@oculus_task` carries `chain: [{ name, cwd }, ...]`; the page reads the folders of a chain's errors from it, and a terminal a grid let go of before its line ended gets its diagnostics from one capture. A placeholder after a backslash or in a comment is refused like one in quotes. The approvals folder is made 0700 only when the approvals file is at its default place; the approval text is `JSON.stringify({ repo, chain: [[folder, run], ...] }, null, 1)` and approvals given before it ask again.

## Anything in the brief that was wrong or impossible

- "Then, from the worktree's root, ... checks.sh tools/oculus/.scratch/migration/orchestrator-state.md": the first command of the list, `npm test`, fails there with `npm error path .../D17/package.json ... ENOENT`; the list runs from `tools/oculus`.
- Item 10 names `CardActions.svelte` for the card's controls; the action list was built in `ProjectCard.svelte`, and the round's ruling 2 is met there (judgment call 5).
- The path list omits files the step had to change, each widened rather than booked: tests `tests/checks/tree/boundaries.test.ts`, `tests/views/whole/type-scale.test.ts`, `tests/state/client/client-state.test.ts`, `tests/server/machine/pty/tmux-fixture.ts` (new), `tests/shell/commands/command-ask.test.ts` (new), and the four files of judgment call 7; source `src/lib/data/model/index.ts` (exports the new types), `state/sessions/folds.ts` (the list row carries `task` and `exit`), `state/sessions/terminal/terminal-marks.ts` (the result marks), `state/sources/repositories/file-git.ts` (`wholePath` exported), `shell/Workbench.svelte` (mounts `CommandAsk`, hands the default-key action), `shell/commands/CommandAsk.svelte` and `CommandForm.svelte` (new), `ui/controls/editor/Editor.svelte`, `views/sources/source/Editor.svelte` and `views/sources/repositories/diff/Diff.svelte` (the selected text and the file an editor publishes), `views/sources/files/tree/control/picks.svelte.ts` (the Run Command pick), `server/root/watch/local.ts` (`approvals` joins the list of the machine's own keys the context holds), `server/machine/pty/edit.ts` (`tmuxValue` moved out of it); and in the round `config/text/server.yml` (the `server.commands.*` sentences), `data/accounts/chat.ts`, `tests/checks/imports/order.ts` and `tests/routes/sessions/terminal-actions.test.ts` (import paths), `tests/ui/frame/fake-dom.ts`.
- Round ruling 13 names the result marks or the poll as the part of `terminals.svelte.ts` to move. The step's own additions to that file are 11 lines, so no self-contained part of them is large enough; the part moved is `closeEnded` and `moveInto`, two functions the file already held, to `state/sessions/terminal/terminal-lists.ts`. The file ends 25 lines under its cap (875 lines, round 2 added the reader count `subscribed`).
- The refuter's finding behind ruling 18 reads `picks.svelte.ts` as a `GET /api/commands` for each repository row drawn. The base's effect only counted a watcher on each; a GET follows when a view reads that repository's list. The three-row test therefore reads each list in an effect after drawing, which makes the base fail with three requests; the change removes the watcher, so a list is asked for only when a menu opens.

## Every edit to an existing assertion, before and after

- `tests/routes/sessions/terminal-edit.test.ts` (`LIST_FORMAT`): before, the expected field list ended `..., '#{pid}'`; after, `'#{@oculus_task}'`, `'#{pane_dead}'`, `'#{pane_dead_status}'` come before `'#{pid}'` (brief item 7).
- `tests/state/sessions/folds.test.ts`: the expected shell row gained `task: false, exit: null`.
- Fixture literals building a full `Terminal` gained `task: false, exit: null, job: null` in `tests/fixtures/sessions-fixture.ts`, `tests/server/root/watch/sessions.test.ts`, `tests/state/client/terminal/terminal-start.test.ts`, `terminal-tabs.test.ts`, `tests/state/sessions/terminal/composer.test.ts`, `terminal-marks.test.ts`, `tests/state/sessions/terminals.test.ts`, `folds.test.ts`.
- `EditorStatus` literals gained `file: ''` and `selection: ''` in `tests/shell/status/status-bar.test.ts`, `tests/shell/keys/palette-open.test.ts`, `palette.test.ts`, `tests/state/workbench/navigation/editor-status.test.ts`.
- `tests/checks/config/config-folder.test.ts`: `CATALOG_FILES` gained `'views/shared/commands.yml'`.
- `tests/checks/tree/boundaries.test.ts`: `SHELL_STORES` gained `'commands'` and its comment names the three shell users; the state row lists `data/helpers/run/tasks` (round 2 took `data/helpers/run/chain` out of the row and out of the comment above it, since no state module imports it).
- `tests/checks/imports/order.ts:80`: before `shell: ['shell', 'shell/rail', 'shell/status', 'shell/panes', 'shell/keys'],`, after `shell: ['shell', 'shell/rail', 'shell/status', 'shell/panes', 'shell/keys', 'shell/commands'],` (the shell folder that holds `CommandAsk.svelte` and `CommandForm.svelte` has an import order slot; `tests/checks/imports/order.test.ts` passes on it).
- Round 2, `tests/state/sessions/terminal/commands-output.test.ts`: `does not ask for a terminal a pane fed to note, and keeps what the pane read` became `does not ask for a terminal a pane still reads when it ends, and keeps what it read` (the pane is a `subscribePty` call held, not a `note` made), `does not replace the output a pane fed while the capture was out` subscribes a pane while the capture is out, the chain cases build the terminal's mark with its chain in place of seeding the repository's list, and `reads a plain command from its own folder` and `reads a mark that names no chain from the repository` replace the case for a list not read yet; `commands.test.ts` `names the cwd the command is listed with ...` reads the cwd from the mark. `tests/server/machine/commands/run.test.ts` `records the source in the mark of the task terminal` expects `chain` in the mark. `tests/server/machine/approvals/approvals.test.ts` no longer imports `commandKey` and `readApprovals`. `tests/views/shared/commands/commands-menu.test.ts` reads the source words through `commandTip`. `tests/shell/commands/command-ask.test.ts:55` is retitled.
- `tests/state/client/client-state.test.ts`: `STORES` gained `'commands'`; the list of stores handed the query client gained `'commands'` and its test title reads "eleven" where it read "ten".
- `tests/views/whole/type-scale.test.ts`: the audited views gained `'shared/commands/CommandBar.svelte': ''`.
- `tests/data/sources/config/local.test.ts`: three cases added for the `approvals` key.
- `tests/server/machine/pty/sessions.test.ts`: setup replaced by the shared fixture (no assertion changed); `rmSync` import dropped.
- Consequences of the round's rulings: the `approve` lists in `tests/state/sessions/terminal/pty-io.test.ts`, `commands.test.ts`, `tests/server/machine/commands/run.test.ts` and `tests/routes/commands.test.ts` are `{ folder, run }` lines in place of the old text of each command; every press in `commands.test.ts`, `files-menu.test.ts` and `commands-menu.test.ts` carries a source; the ids of the Run Command items read `run-command:<source>:<name>` and the Manage items `edit:<source>:<name>`; the card cases of `tests/views/boards/project.test.ts` assert `data-command-bar` and five buttons with the overflow menu for seven commands in place of one control for each command; `tests/shell/commands/command-ask.test.ts` expects the dialog to list every line of a chain.
- `tests/state/client/terminal/terminal-close.test.ts`, `tests/shell/keys/keys.test.ts`, `workbench-keys.test.ts`, `tests/views/sessions/terminal-menu.test.ts`, `terminal-style.test.ts`, `tests/views/sources/repositories/repositories.test.ts`, `tests/server/machine/pty/channel.test.ts`: cases added; no existing assertion changed.

## Grep of the changed names across src, tests, config, HELP.md, DESIGN.md, README.md

`grep -rlE --exclude=local.yml '<name>' src tests config HELP.md DESIGN.md README.md | wc -l`; files per name: `commandDiagnostics` 4, `CommandForming` 1, `CommandAsking` 1, `openForm` 5, `closeForm` 4, `errorMatch` 3, `taskStateOf` 5, `TaskState` 2, `LIST_FORMAT` 3, `shellWord` 8, `@oculus_task` 7, `pane_dead_status` 3, `commands.json` 8, `commands.yml` 13, `approvals.json` 9, `CommandBar` 6, `CommandAsk` 5, `runDefault` 5, `pressRerun` 3, `pressRestart` 3, `chainLines` 4, `chainText` 7, `quotedPlaceholder` 0, `unsafePlaceholder` 4, `unsafeSentence` 3, `commandKey` 5, `commandLabel` 4, `captureTask` 4, `paneOutput` 4, `readEnded` 1, `subscribed` 18, `watchEnds` 3, `closeEnded` 3, `moveInto` 2, `data/helpers/run` 13. `shellWord` is in `pty/shell-word.ts`, imported by `pty/chat.ts`, `pty/routes.ts`, `usage/refresh.ts`, `commands/found.ts`, `commands/placeholders.ts`, `commands/chain.ts`, and named in `tests/routes/sessions/terminal-fixture.ts`; no file holds a second copy. `LIST_FORMAT` is in `pty/sessions.ts`, `task.test.ts` and `terminal-edit.test.ts`. `CommandForm` is named only by `CommandAsk.svelte` and its own file. The old paths `helpers/commands-chain`, `helpers/tasks.ts`, `shell/keys/Command` and the helper `commandText` appear in no file of `src tests config HELP.md DESIGN.md README.md` (each grep prints nothing).

## Comments and docs re-read

- `DESIGN.md` Processes paragraph: the chain approved as one entry, its JSON text over the repository's path and the lines. `DESIGN.md` Approval paragraph: the text hashed, `JSON.stringify({ repo, chain: [[folder, run], ...] }, null, 1)`, the command key over it, and the approvals folder made 0700 by a write to the default file when looser and owned by the user. `DESIGN.md` pty bridge bullet: a task terminal stays, polled at `POLL_MS` while its line runs, `@oculus_task` holds the repository, the name, the source and the chain, and the `capture` action reads an ended terminal's pane. `DESIGN.md` state row: `data/helpers/run/tasks`.
- `server/machine/pty/channel.ts` head comments: the poll while a task runs.
- `HELP.md`: key rows, terminal row and `## Project commands`: the three preset names, the source drawn beside a shared name and the form's refusals, the card's bar, the Files Run Command submenu read when the menu opens, placeholders written bare and refused inside quotes, the chain approval listing every line with the repository's path in the key, the folder made 0700 for the default approvals file only, approvals given before the current text asking again, the source named beside the name on each button and menu item with the default keys naming none, and diagnostics read from a pane's captured text with chain paths read from the printing command's folder; `local.yml` paragraph (`approvals`).
- `config/catalogs/options.yml`: the `approvals` description says a write to the default file makes the folder 0700 when looser and a file elsewhere leaves its folder.
- `src/lib/data/helpers/run/chain.ts`, `tests/checks/tree/boundaries.test.ts` (the comment above the state row), `ProjectCard.svelte`, `server/machine/commands/routes.ts`, `terminal-lists.ts`, `placeholders.ts`, `commands.svelte.ts` and `terminals.svelte.ts` head and doc comments: each says what the code does now.
- `README.md`: still true.

## Not covered by a test

- The bar's Add press and the menu's Edit pick reaching `openForm` (the store and the shell's drawing of the form are tested; the click is not).
- The form's fields, Save, the server's refusal shown in it, and Escape closing it.
- The approval and Restart confirmations as buttons (the store holds the question, `CommandAsk.svelte` lists every line of a chain in a test, and `Confirm` is drawn; the buttons are not pressed in a test).
- The xterm link provider drawing an error as a link and a click opening the file; the menus' opening by a pointer.
- `Source.svelte` publishing the selection and `Editor.svelte`'s `onselect` (the placeholders read what the store is handed).
- The ownership check of `privateFolder` with a real second user: the test mocks `process.getuid`.
- The grid itself calling `subscribePty` and `note`: the cases call them as the grid does, a mounted grid needs a DOM.
- A command whose own output holds a line equal to a later command's name in a chain (D17-B).
- The real bits-ui widgets, layout and focus under the client view tests: they run over `tests/ui/frame/fake-dom.ts` with those components stubbed (judgment call 10).
- `~/.oculus` as it stands on this host: the tests set HOME to a scratch folder, so the mode change from 0755 to 0700 is shown on a scratch folder only.

## Disclosures

- Two read-only git commands were run early in the step (`git -C ../.. diff --stat` and a `git status --short` piped to `head -0`). In the round one `git -C /dev/null status` was run by mistake; it failed and touched no repository.
- `pkill -f "vitest run"` was run once to stop this step's own mutation shards; it may have ended a vitest run of another builder on the machine.
- `mkdir -p /tmp/x; rmdir /tmp/x` was run once; `/tmp/x` already existed holding files, `rmdir` refused, nothing was removed.
- Scratch folders under the session scratchpad (`unchanged/`, `d17-*`, `d17r1-base`, `d17r1-mut`) were written during the step and the round; nothing in the worktree or on the main checkout refers to them.
- The first `npm test` of the round, run beside two other builders' vitest runs, timed out one case in a file the round did not touch: `tests/server/edit/config-key.test.ts` `refuses what is not a finite number for a number option` (`Error: Test timed out in 5000ms.`). `npx vitest run tests/server/edit/config-key.test.ts` alone prints `Tests  61 passed (61)`, and the case passed in both `checks.sh` runs. A landing's verify run under load can meet the same timeout.
- The base-run quotes in "Repair round 1" were taken on a copy of the pre-round tree with the round's test files; the two setup lines adapted in its `run.test.ts` are named at the head of that section.
- The base-run quotes in "Repair round 2" were taken on a copy of the pre-round-2 tree (`d17r2-base`) with the round's final test files copied over it; no setup line was adapted.
- `npm test` run on its own once, and `npx vitest run tests/server/machine/pty` once of three runs, met `Test timed out in 30000ms` in `task.test.ts` `captures all the text of an ended pane, a wrapped line joined, and its pid changes on a respawn`, a case no ruling touches, while another builder's vitest runs were on the machine. Four copies of that file started at once on the unchanged pre-round-2 tree gave three passes and the same timeout once; the file alone passed four runs in a row on the final tree, and `checks.sh` passed twice. The cause is not found (not verified); the wait is the `pane-died` event of `watchEnds`.
