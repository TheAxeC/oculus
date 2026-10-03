# D18 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); D18, the Processes view, landed; 227 of the 248 package lines of `plan.md` are ticked (`sed -n 5,454p plan.md | grep -c '^- '` and `grep -c '^- ✅'`). Next: D32 with Z308 and its look (cases 27 to 31).

## Open items (verbatim)

- Z276 (2026-10-02, at Axel's question whether O34 covers the task "A second person in the hub" in `tasks/tasks.yml`): it does not. O34 reads the signed-in person in one place, which is the base that task needs; the task's three parts (a Focus board per person, a private-or-shared marker per field and document with private as the default, the group views of shared deadlines, who waits on whom and the meeting rotation) are in no step, and D10 waits on a second person too. Options: (a) one new step O36 after O34 with those three parts, so the plan ends with the hub usable by your group; (b) leave the task in `tasks/tasks.yml` until someone else works in the hub, as its note says, and open a step then. For (a): the remote server is built with several users in mind and the privacy marker is cheapest to add before anything is shared. Against (a): it builds for people who are not using the hub yet. Recommended (b): the task's own condition is not met, and O34 already leaves the one place a person is read. (b) is also the cheaper option, chosen because the condition is unmet, not because it costs less.
- Z274 (2026-10-02, Axel's word that oculus is now a full IDE rather than a dashboard): a new name for oculus. Where the name lives, counted on main: 122 files under `tools/oculus/src` and 1054 occurrences across its `src`, `tests` and `config`; 40 references to the `~/.oculus` folder; the `.oculus/project.yml` manifests the other repositories carry; five browser-storage keys (`oculus.ui.v1`, `oculus.layout.v1`, `oculus.layout.previous`, `oculus.carry.v1`, `oculus.diff.addComment`); and 1241 files of the hub outside `tools/oculus` that name it (the skills, rules, memory and manifests among them). Options for when: (a) the rename done in O33, as part of the move into its own repository: the repository, the package, the folder, the source, the docs and the hub's references take the new name at once; the first-run check moves `~/.oculus` and each repository's `.oculus/` folder and carries the five browser-storage keys over once, so nothing Axel saved is lost. For: the repository is created then anyway, so its name is chosen once; no step in flight conflicts with it. Against: the old name stays on screen until the last step. (b) the rename as a step of its own now. For: the new name is in use sooner. Against: it touches nearly every file five steps in flight also touch, so each of them meets conflicts at landing, and it needs a ruling for a new step. (c) keep the name oculus. For: no work. Against: the name no longer says what the tool is, which is Axel's reason for asking. Names, in the style of the other repositories (cathedra, ordo, officium, scotoma): scriptorium (the room where manuscripts were written and copied, fitting a tool for writing papers and code); officina (a workshop; close to officium in sound); fabrica (a workshop where things are made). Recommended (a) with scriptorium. (c) is the lazy option.
- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line). Count at 2026-10-02 13:05: 1 of 10 (X3a, landed 11:49). Nothing is asked of Axel until the count reaches 10.
- Z314 (2026-10-03, the owed look Q81): a Confirm drawn over the update tray. Taking it needs `tasks.skip_permissions` on in `config/behavior.yml` for the look and back off after; the permission classifier refused that edit, so it waits on Axel. Options: (a) Axel allows the edit for the look, which is reverted and checked with `git diff --exit-code -- tools/oculus/config`; (b) Axel takes the point himself on TEST; (c) the point is dropped from the look. Recommendation: (a), since the look then runs as every other look does and leaves no write behind.
- Z315 (2026-10-03, the owed look Q79c): the Live HPC jobs table and a job's log. The cluster was unreachable from this machine (`ssh: connect to host hpc-head1.ewi.utwente.nl port 22: Operation timed out`), which needs the UT network or EduVPN, Axel's account. Options: (a) Axel connects EduVPN and the look is taken then; (b) the point is dropped from the look. Recommendation: (a).

## Not done

Nothing inside the brief. `bench: []`, so no A/B. The failure line of the view when `ps` cannot be read was not provoked on the real machine; it is covered by the view's tests.

## The check of Steps 1

ListAgents at 02:53 listed no subagent, only two idle peer sessions (ordo-01, research-hub-d8). D18's builders and both reviewers were not listed.

## What landed

From base 47a41fa4, 98 paths staged on main (5939 insertions, 1496 deletions; `git diff --cached --shortstat`), the six landing-fix files among them.

- The Processes view: oculus's own processes (the trees under every pane of its terminal sessions) and the local processes matching `processes: { patterns: [...] }` in `config/behavior.yml`, read from one `ps -axo pid=,ppid=,pcpu=,rss=,lstart=,command=` run oculus starts itself (Z257 (b)); `systeminformation` removed; columns PID, Parent, User, Started, CPU, Memory, Command and Folder; the head line counting projects in flight and agents running; the watcher reading every ten seconds while a page is connected (Z244 (b)).
- The System view texts moved under `config/text/views/system/machine/` (`hpc.yml`, `usage.yml`, the new `processes.yml`), `HELP.md`, `DESIGN.md` and the regenerated diagrams.

## Verification on main

`npm run build` alone first (exit 0), then from `tools/oculus`:

```
$ npm test
 Test Files  515 passed | 24 skipped (539)
      Tests  12864 passed | 640 skipped (13504)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  446 passed | 9 skipped (455)
$ npm run check
COMPLETED 3165 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## Fixes at landing

The five findings of the run over repair round 1, each small and inside the brief (the refuter report's Closed heading), checked on main's staged and working copies (`grep -n ended ps.ts watch.ts`, `git show :tools/oculus/README.md | sed -n 13p`, `grep -c "prints more than 32 MB" DESIGN.md`):

1. R1: `ReadFailure` carries `ended`, which `ps.ts` resolves on the child's `close` or `error`; `watch.ts` awaits it, so no `ps` starts while a killed one has not closed. The case "starts no second child while a killed one has not closed, and one at the tick after it closed" fails with `await ended;` taken out of `watch.ts`.
2. R2: `README.md:13` back to the base line ("and `cloc`").
3. R3: `state/system/machine/processes.ts` re-exports only `ProcessRow`.
4. R4: the `server/machine/pty/sessions.ts` head comment is one paragraph.
5. R5: `DESIGN.md`'s failure list names "prints more than 32 MB, fails while its output is read".

## The look (TEST, localhost:8790, tab 812136282)

- Light theme, taken 2026-10-02 (`owed-looks.md`).
- Dark theme (vscode dark modern), 2026-10-03 02:47 to 02:50: the head line "0 projects in flight, 3 agents running"; the group row "test" and its rows with PID, Parent, User and Started; the table scrolls sideways in its 222 px pane (scroll width 1235); "Read at 02:47" moved to "Read at 02:48" with the rows re-read; a press on PID sorts ascending, a second press descending (`aria-sort`, and the PID order of the rows); no console error from the view (the Memories `watchShown` TypeError in the console is Q79c-look-1, booked into X3c). The Stop control was not pressed. The sort left PID descending, then ascending, on TEST's Processes tab.

## Agents' usage

- Brief check: claude-sonnet-5-5, 264,980 tokens, 82 tool uses, 12.3 min.
- Builder a85f423d94391e52c and its continuations (claude-sonnet-5-5): to the report 306 tool uses, 112.7 min (from its transcript; no completion notice reached the session); round 1, continuation ae13a804ea6129ba4: 184,748 tokens, 168 tool uses, 72.1 min. Two earlier continuations were stopped by Axel and their usage is not reported.
- Reviewer a4303ec6fd987a4dd (claude-opus-5-5), first run: 311,920 tokens, 68 tool uses, 23.8 min.
- Reviewer a3efaf2aa6b2dee81 (claude-opus-5-5), over round 1: 290,469 tokens, 84 tool uses, 14.0 min.
- The builder's first report did not pass its bar (items 2 and 3 violated); one repair round; five fixes at landing (R1 to R5).
