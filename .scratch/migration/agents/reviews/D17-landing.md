# D17 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); D17, project commands, landed. Next: X3c, the tab strip as VS Code's, through /spec with its brief closed, and Q91, the project view and its editor, dispatched; D32b and D14b after Q91, X3e once Q91 has landed, at most three in flight.

## Open items (verbatim)

- Z276 (2026-10-02, at Axel's question whether O34 covers the task "A second person in the hub" in `tasks/tasks.yml`): it does not. O34 reads the signed-in person in one place, which is the base that task needs; the task's three parts (a Focus board per person, a private-or-shared marker per field and document with private as the default, the group views of shared deadlines, who waits on whom and the meeting rotation) are in no step, and D10 waits on a second person too. Options: (a) one new step O36 after O34 with those three parts, so the plan ends with the hub usable by your group; (b) leave the task in `tasks/tasks.yml` until someone else works in the hub, as its note says, and open a step then. For (a): the remote server is built with several users in mind and the privacy marker is cheapest to add before anything is shared. Against (a): it builds for people who are not using the hub yet. Recommended (b): the task's own condition is not met, and O34 already leaves the one place a person is read. (b) is also the cheaper option, chosen because the condition is unmet, not because it costs less.
- Z274 (2026-10-02, Axel's word that oculus is now a full IDE rather than a dashboard): a new name for oculus. Where the name lives, counted on main: 122 files under `tools/oculus/src` and 1054 occurrences across its `src`, `tests` and `config`; 40 references to the `~/.oculus` folder; the `.oculus/project.yml` manifests the other repositories carry; five browser-storage keys (`oculus.ui.v1`, `oculus.layout.v1`, `oculus.layout.previous`, `oculus.carry.v1`, `oculus.diff.addComment`); and 1241 files of the hub outside `tools/oculus` that name it (the skills, rules, memory and manifests among them). Options for when: (a) the rename done in O33, as part of the move into its own repository: the repository, the package, the folder, the source, the docs and the hub's references take the new name at once; the first-run check moves `~/.oculus` and each repository's `.oculus/` folder and carries the five browser-storage keys over once, so nothing Axel saved is lost. For: the repository is created then anyway, so its name is chosen once; no step in flight conflicts with it. Against: the old name stays on screen until the last step. (b) the rename as a step of its own now. For: the new name is in use sooner. Against: it touches nearly every file five steps in flight also touch, so each of them meets conflicts at landing, and it needs a ruling for a new step. (c) keep the name oculus. For: no work. Against: the name no longer says what the tool is, which is Axel's reason for asking. Names, in the style of the other repositories (cathedra, ordo, officium, scotoma): scriptorium (the room where manuscripts were written and copied, fitting a tool for writing papers and code); officina (a workshop; close to officium in sound); fabrica (a workshop where things are made). Recommended (a) with scriptorium. (c) is the lazy option.
- Z314 (2026-10-03, the owed look Q81): a Confirm drawn over the update tray. Taking it needs `tasks.skip_permissions` on in `config/behavior.yml` for the look and back off after; the permission classifier refused that edit, so it waits on Axel. Options: (a) Axel allows the edit for the look, which is reverted and checked with `git diff --exit-code -- tools/oculus/config`; (b) Axel takes the point himself on TEST; (c) the point is dropped from the look. Recommendation: (a), since the look then runs as every other look does and leaves no write behind.
- Z315 (2026-10-03, the owed look Q79c): the Live HPC jobs table and a job's log. The cluster was unreachable from this machine (`ssh: connect to host hpc-head1.ewi.utwente.nl port 22: Operation timed out`), which needs the UT network or EduVPN, Axel's account. Options: (a) Axel connects EduVPN and the look is taken then; (b) the point is dropped from the look. Recommendation: (a).
- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line). Count at 2026-10-02 13:05: 1 of 10 (X3a, landed 11:49). Nothing is asked of Axel until the count reaches 10.

## Not done

The project card's commands bar was not seen in the look: no project folder on TEST is its own repository, so no card draws one. Its render is covered by `tests/views/shared/commands/commands.test.ts`. `bench: []`, so no A/B.

## The check of Steps 1

ListAgents at 07:44 listed no subagent, only two idle peer sessions (ordo-01, research-hub-d8). D17's builder `accbb967b61d158c2` and its reviewers `a5d2a98fbce79b67d`, `aab445504abc4c493` and `aac6d2d803eda3e82` were not listed.

## What landed

From base a238de92, on main with the merge and the landing fixes: 139 files, 10911 insertions, 1380 deletions (`git diff --cached --shortstat` before the commit).

- A repository's commands from `.oculus/commands.yml` (`{ name, run, cwd?, depends_on?, default? }`), from the form saving to `~/.oculus/commands.json` keyed by the repository's path, and found in CMake presets, `package.json` scripts and Makefile targets (`server/machine/commands/`).
- A run behind approval of the chain's exact text and folders, in the shared `approvals.json` (`server/machine/approvals/approvals.ts`); the chain in one task terminal, each command preceded by a marker line holding a per-run token and its name (Z304).
- Placeholders as environment variables: each placeholder in a line becomes `${OCULUS_ARG_<n>+"$OCULUS_ARG_<n>"}`, its value set with tmux's `new-session -e` (Z305 (a), Z320).
- Task terminals that stay after their line ends, with a check or cross on the tab and the row, Rerun, Restart behind a confirmation naming the process, and the errors of their output as links and as diagnostics in D14's shape, each resolved from its command's folder.
- The commands bar in the Repositories view and on the project card, the Files menu's Run Command submenu, the form (add, Edit, Delete), Open File at Entry, Cmd+Shift+B and Cmd+Alt+T.
- `HELP.md`, `DESIGN.md`, the text catalogs and the regenerated diagrams.

## Verification on main

`npm run build` alone first (exit 0), then from `tools/oculus`:

```
$ npm test
 Test Files  563 passed | 24 skipped (587)
      Tests  13912 passed | 640 skipped (14552)
$ npm run test:checks
 Test Files  31 passed | 2 skipped (33)
      Tests  471 passed | 9 skipped (480)
$ npm run check
COMPLETED 3301 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## The merge with main

D18, D32, D14 and S4 landed after D17's base, and the cherry-pick met them in 23 paths, resolved on main. `servedRootsFor` is split from the roots the file browser serves. Four folders went over ten items and were regrouped: `pty-*.ts` into `state/sessions/terminal/pty/`, `model-commands.ts` folded into `model-sessions.ts`, `views/shared/commands/*` into `views/shared/sessions/`, and `tests/routes/commands.test.ts` into `tests/routes/machine/`.

## Fixes at landing

The findings of the run over repair round 2 (`agents/reviews/D17-refuter.md`, "Closed"), the merge's consequences and two defects of the look, each small and inside the brief:

1. `tests/server/machine/pty/sessions.test.ts` given `server.dir`.
2. Z305 (a), built as Z320: `server/machine/commands/placeholders.ts` rewritten; the tokenizer and its refusals at save and run removed; the values in the task's environment. `placeholders.test.ts` runs 21 lines by 7 selections through `/bin/sh`, `bash` and `zsh`, creating nothing, and checks the value arrives whole bare, double-quoted, in a here-doc and in `$(...)`. The ruled literal `"$OCULUS_ARG_<n>"` split `"<${selectedText}>"`, seen failing before the change.
3. Z304: the chain marker `<token> <name>`, 12 hex characters minted per start; the store moves on only a line ending in its marker. `commands-output.test.ts`: 7 cases fail against the bare-name match.
4. Proof 1 and 2, Standards 1 to 4: the stale doc and comment lines (HELP.md, DESIGN.md, `pty/sessions.ts`, `run.ts`, `routes.ts`).
5. Proof 3: the real-pane test waits on a tmux `wait-for` signal from the pane line; 5 of 5 runs passed.
6. Standards 5: `resolveChain` moved to `server/machine/commands/resolve.ts`, the marker helper at `data/helpers/run/marker.ts` with its boundaries row.
7. Standards 6: the placeholder refusals from the server catalog (`server.commands.no_file`, `no_selection`, `nul`).
8. Z321: the refusals of the terminal route's `command`, `rerun`, `restart` and `capture` actions show the server's sentence (`pty/pty-io.ts`, `COMMAND_ACTIONS`); four store tests failed after the merge without it.
9. The four folder regroupings above.
10. The scratch-folder, catalog-key, comment-width and lint findings of `test:checks` and `npm run lint`.
11. From the look, Z322: a press on the bar put the Repositories view on screen, so a run found no source tab and refused every placeholder but `${workspaceFolder}`. A run now reads the source tab on screen, or else the source tab whose editor had the focus last (`editorStatus.focus` on `focusin` in `Source.svelte`, forgotten with the tab). The default keys keep the active source tab. `commands.test.ts` "posts the context of the source tab focused last when the tab on screen is another view" failed without the fix (no `context` in the body) and passes with it.
12. From the look, Z323: a task terminal's row was titled `cd`; it is titled by its command (`terminalChoices`, `state/sessions/folds.ts`), a reader's title still winning. `folds.test.ts` "titles a task terminal by its command, unless the reader gave it a title" failed without the fix (`vim` in place of `build`) and passes with it.

## The look (TEST, localhost:8790, tab 812136282)

Dark theme, 2026-10-03 07:00 to 07:35. D17 changes no theme. Before it: `changes.jsonl` f3d06124 (37 lines), `workspaces.json` 1bf5d57a, 3 history entries, `sources.yml` e64fae65, `~/.oculus` 0755 with no `approvals.json` or `commands.json`.

A throwaway repository `~/workspace/zz-look-d17` was added to the roots in `sources.yml`. Its `.oculus/commands.yml` held:

- `build`, the default build;
- `test`, the default test, with `cwd: sub` and `depends_on: [build]`;
- `say`, which is `printf '[%s]\n' ${selectedText}`;
- `quoted`, which is `printf '<%s>\n' "${selectedText}" "${file}"`;
- `lint`, `fmt` and `docs`;
- `wait`, which is `sleep 120`, added later.

A `package.json` script and a Makefile target were added later as well. Commands were approved and run only in that repository.

Seen working:
- The Repositories view's bar: five buttons, then More with the rest, Edit or Open, and, after the files message, `npm: hello` and `make: greet`.
- A file command's menu: Open File at Entry.
- The approval question for `test`, listing both lines with `(in sub)`.
- The chain's terminal printing `4856b71791dd build` and `4856b71791dd test` before each command, with the cross on the tab and the row.
- The error links: `src/a.c:1:5` opened `src/a.c`, and `src/b.c:1:5` opened `sub/src/b.c`, the only `b.c` in the repository.
- A missing selection, said as "No value for ${selectedText}: select text in a source tab first".
- `say` and `quoted` with line 3 of `notes.txt` selected (106 characters, holding `$(touch .../x)` and `; touch .../y #`): each ended with the check and created nothing (`ls -A` of the repository after each). `say`'s output ends in `#`, a line break and `]`, the whole selection as one argument.
- `make: greet` run from More, and again from the Files row menu's Run Command submenu, which lists all ten commands.
- Rerun on the ended `test`. Restart on the running `wait`, behind "Stop sleep and run it again?", which printed a new marker line.
- Cmd+Shift+B in `notes.txt` asking for `build`. Cmd+Alt+T running the approved `test` chain with no question and the cross.
- Add Command... saving `hi` (`commands.json` and one change-log line), its Edit form filled, and Delete behind "Delete the command hi?" (`commands.json` back to `{}`). The form's help sentence names where the placeholders come from.

Two defects were found and fixed at landing (Z322 and Z323, above). Once both were fixed, `say` and `quoted` ran with the selection, and the rows read `test`, `say`, `quoted`, `make: greet` and `wait`.

Seen, and not D17's: the terminal grid drawn about three columns wide beside the Terminal tab's list in a narrow pane; a row's trash button kills only on its second press, as its tooltip says.

Not seen: the project card's bar (see Not done).

Cleanup:
- Every task terminal the look started was killed on TEST, and `ps` shows no `zz-look-d17`, `OCULUS_ARG` or `sleep 120` process.
- The Files tab and the three source tabs the look opened are closed.
- `sources.yml` was restored from its copy: e64fae65, and `git diff --exit-code -- config/sources.yml` is clean.
- `changes.jsonl` is back at f3d06124 (37 lines) and `workspaces.json` at 1bf5d57a, with 3 history entries.
- `approvals.json` and `commands.json` are removed, and `~/.oculus` is back at 0755.
- The repository is deleted.

## Agents' usage

- Brief check (claude-sonnet-5-5): 232,904 tokens, 79 tool uses, 11.6 min.
- Builder `accbb967b61d158c2` (claude-sonnet-5-5, ordo-high): 349,641 tokens, 725 tool uses, 243.5 min; round 1 261,646 tokens, 427 tool uses, 96.0 min; round 2 216,123 tokens, 127 tool uses, 45.6 min.
- Reviewer `a5d2a98fbce79b67d` (claude-opus-5-5, ordo-high), first run: 315,842 tokens, 81 tool uses, 20.6 min.
- Reviewer `aab445504abc4c493` (claude-opus-5-5, ordo-high), over round 1: 295,489 tokens, 62 tool uses, 20.9 min.
- Reviewer `aac6d2d803eda3e82` (claude-opus-5-5, ordo-high), over round 2: 295,136 tokens, 80 tool uses, 21.3 min.
- The builder's first report did not pass its bar; two repair rounds, the second under the cap exception; twelve fixes at landing.
