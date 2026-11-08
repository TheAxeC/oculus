# O169 report

NOT DONE: two pieces need paths outside the write list, so they are handed back. (1) Item 3's setting label: `src/lib/state/forms/referrers.ts:20` imports `titleOf` from `state/system/config/rows.ts`. The folder order check refuses that import, and `npm run test:quick` is red on that one line. The fix is to move `titleOf` and its `wordOf` from `src/lib/state/system/config/rows.ts` into a folder at or below `state/forms` (for example `data/helpers`), and to change the imports in `rows.ts`, `src/lib/state/system/config/other-rows/app-rows.ts` and `referrers.ts`. None of the three files that change is on the write list. (2) Item 5 makes a doc comment outside the write list false: `src/lib/data/model/machine/model-machine.ts:304-308` says "an engine's own text (tmux's, a validator's) never reaches the page". It needs the same rewording that `refusal.ts`, `routes.ts`, `tmux.ts` and `terminal-words.ts` got. Everything else in the brief is done.

## Open items of the state file (verbatim)

None.

## The cases' first run (unchanged tree)

Each case-run program lives in the scratchpad (`.../scratchpad/cases/`) and takes the tree as its one argument. The base copy has no `package.json` or `node_modules`, so these first runs were made on the worktree before any change.

- C1, `node cases/c1.ts <worktree>` (`seedFacts` over a fixture workspace of two hubs, `hub` the primary and `lab` the second, planted in a temporary folder):
  ```
  primary hub, card (hub:tasks): refused task-unknown
  second hub, card (lab:tasks): refused task-unknown
  primary hub, ticker (tasks): started, seed first line "Task: Write the report"
  second hub, ticker (tasks): started, seed first line "Task: Order the parts"
  removed task, card (hub:tasks): refused task-unknown
  removed task, ticker (tasks): refused task-unknown
  ```
  By reading, `sameTask` (`opening.svelte.ts:235`) compared `a.collection === b.collection`, so `hub:tasks` and `tasks` named two tasks.
- C2, `node cases/c2.ts <worktree>` (`fetchFailureOf` with the shipped rows, and the reason cut by run.ts `short`):
  ```
  ssh line then fatal: line "Could not read from remote repository."
  two ssh lines then fatal: line "Could not read from remote repository."
  fatal line only: line "Could not read from remote repository."
  a row matches: line "git@github.com: Permission denied (publickey)." kind "Git key refused"
  ```
- C3, by reading: `SubmitBox.svelte:24-27` drew one `others` button per cluster, the picked one as "{0} (picked)". `referrers.ts:117-123` gave a setting the label `slurm.resource`, so the ask read "Referred to by slurm.resource. ..." and the tag read "The setting slurm.resource". Project referrers used `projectLabel`.
- C4, `node cases/c4.ts <worktree>` (fetch stubbed): `oculus: ... sent ["GET /api/cpp?repo=oculus"]` and `gone: ... sent ["GET /api/cpp?repo=gone"]`. Then `node cases/c4-server.ts <worktree> <worktree> oculus <worktree>`, which runs `repositoryOf`: `oculus: {"error":"repo must be an absolute path"}`.
- C5, `node cases/c5.ts <worktree>` (`handleTerminal` with the tmux runner stubbed; the TmuxSilence cases use stand-in binaries, `/usr/bin/false` and a sleep script):
  ```
  new terminal, tmux says "socket path too long": 400 {"error":"terminal-ended"}
  new terminal, tmux says "server exited unexpectedly.": 400 {"error":"terminal-ended"}
  new terminal, tmux timed out (TmuxSilence): 400 {"error":"terminal-ended"}
  new terminal, tmux failed saying nothing (TmuxSilence): 400 {"error":"terminal-ended"}
  steer of a terminal that ended, tmux fails: 400 {"error":"terminal-ended"}
  resize of an unlisted id: 400 {"error":"terminal-ended"}
  ```
  `npx vitest run tests/routes/sessions/terminal-actions.test.ts`: `Tests  38 passed (38)`.
- C6, `grep -n "^        host_" config/text/views/system/machine/hpc.yml`: lines 49 to 55 all ended with no full stop, and 49, 50, 52, 53 and 55 opened in lower case, for example `50: host_no_cluster: the settings of this hub name no cluster (slurm.resource in .oculus/config.yml)`.
- C7, by reading: `Cluster.svelte:130-132` drew `resolution` (with `hpc.resolution_error` on a failure) whatever the status, and `:135-146` drew the error box. A failed resolution therefore showed both.
- C8, by reading: `marksShape` (`fs-transport.ts:227-234`) was `z.object({ hub, project, home })`, so zod stripped `git`, `reposOf` found none, and Repository was not offered.

The first runs agree with the brief's account of every case. No case showed the brief's rules giving a wrong result.

## DONE / NOT DONE

| Item | State | Proof (run after the last change) |
| --- | --- | --- |
| 1. Start Agent on a task that exists | DONE | `node cases/c1.ts`: `primary hub, card (hub:tasks): started ...`, `second hub, card (lab:tasks): started ...`, both ticker rows started, both removed rows `refused task-unknown`. `sameTask` compares `collectionKey(a) === collectionKey(b)`, which takes the id's hub off the collection (`splitHubId(ref.collection, [addressOfId(ref.id).hub]).id`). That is checked by reading: the function is private to a rune module and no case-run reaches it. |
| 2. ssh's cause beside git's line | DONE | `node cases/c2.ts`: `line "ssh: Could not resolve hostname git.example: nodename nor servname provided, or not known. Could not read from remote repository."`; with two ssh lines the last is used; `fatal line only: line "Could not read from remote repository."`; `a row matches: ... kind "Git key refused"`. |
| 3a. Submit box pick as a select | DONE | Checked by reading and by `svelte-check ... 0 ERRORS 0 WARNINGS` in the final `test:quick`. Proof on screen: the look (see below). |
| 3b. The delete ask names the setting by its Settings label | NOT DONE (red check) | `node cases/c3.ts`: `Referred to by Alpha, Project beta, Slurm: Resource. ...` and `Named by tag: The setting Slurm: Resource`. The behaviour holds. The final `test:quick` is red on `"state/forms/referrers.ts:20 imports state/system/config/rows.ts (state/system, above state/forms)"`. The fix needs paths outside the write list (first line). |
| 4. Compile database rows send the absolute folder | DONE | `node cases/c4.ts`: `oculus: repo "/Users/axelfaes/workspace/oculus"; sent ["GET /api/cpp?repo=%2FUsers%2Faxelfaes%2Fworkspace%2Foculus","POST /api/cpp {\"repo\":\"/Users/axelfaes/workspace/oculus\",...}"]`; `gone: no call; said "The folder of gone does not exist."; sent []`. `node cases/c4-server.ts`: a path is taken (`{"repo":".../migration-O169"}`) and a bare key is refused (`{"error":"repo must be an absolute path"}`). |
| 5. A new terminal whose tmux call fails says why | DONE, except the comment named in the first line | `node cases/c5.ts`: `drawn: The terminal did not start: socket path too long.`, `drawn: The terminal did not start: server exited unexpectedly.`, `drawn: The terminal did not start: tmux did not answer within 0.2 s.`, `drawn: The terminal did not start: tmux failed without saying why.`, steer and resize `drawn: The terminal has ended.`. No answer printed `(CARRIES THE CALL)`. `npx vitest run tests/routes/sessions/terminal-actions.test.ts`: `Tests  38 passed (38)`, no test edited. |
| 6. Host lines with a capital and a full stop | DONE | `grep -n "^        host_" config/text/views/system/machine/hpc.yml`: lines 49 to 55, quoted under "User-visible changes". |
| 7. A cluster's failure drawn once | DONE | Checked by reading (`Cluster.svelte`: `failed` is the status test the box uses, and `resolution` is '' for an `error` resolution while `failed`). Proof on screen: the look. |
| 8. Repository scope offered | DONE | Checked by reading: `marksShape` now reads `git` (and the other FolderMarks keys), and `reposOf` reads `ground.folders` (the workspace folders alone). Proof on screen: the look. |
| Verify 1: `npm run diagrams`, then `npm run test:quick` | RED on one line | The last lines: `ok prettier`, `ok ASCII gate`, `ok eslint`, `ok svelte-check (17.3 s): ... 0 ERRORS 0 WARNINGS`, `ok vitest (190.1 s)`, `FAILED vitest checks` (`Tests  1 failed | 90 passed (91)`, the referrers order line), `ok vitest slow (269.3 s)`, `test:quick: 273.3 s; failed: vitest checks`. |
| Verify 2: ASCII gate over the changed files | DONE | It printed nothing (`ascii exit 0`). |
| Verify 3: terminal-actions passes unchanged | DONE | `Tests  38 passed (38)`. |
| Verify 4: unused exports | DONE | `diff O169-base/unused-exports.txt <now>`: no difference, so the step adds no line. |
| Verify 5: list items and sentence length | DONE | See "Prose read". |

Verify-list runs: three. The first was stopped before it finished, because a rename (`failedWords` to `tmuxFailureWords`) followed it. The second finished red on lines in changed files: the folder order of `Confirm.svelte` and `referrers.ts`, the comment width of `Confirm.svelte:20`, and the module-level `Set` in `refusal.ts`. After those fixes, each check file was rerun alone, then the list ran a third time with the result above. The red lines of the second run in files the step does not change passed when rerun alone: `tests/state/sources/clone-after.test.ts` (`Tests 11 passed`), `tests/data/hubs/workspace-projects.test.ts` (`Tests 5 passed`), `tests/routes/git/credentials.test.ts` (`Tests 8 passed`), `tests/data/hubs/self.test.ts` (`Tests 17 passed`) and `tests/server/root/watch/deck-folders.test.ts` (`Tests 11 passed`). The step ran no whole-suite command.

## Files (from `diff -rq` against the base copy, plus the generated diagrams)

| File | Lines now | Changed (+/-) | On the write list |
| --- | --- | --- | --- |
| src/lib/server/machine/runs/seeds/task-start.ts | 128 | +15 -3 | yes |
| src/lib/state/sessions/terminal/composer/opening.svelte.ts | 253 | +12 -1 | yes |
| src/lib/server/core/git/state.ts | 482 | +15 -2 | yes |
| src/lib/views/sources/source/actions/SubmitBox.svelte | 47 | +24 -9 | yes |
| src/lib/ui/controls/confirm/Confirm.svelte | 210 | +22 -6 | yes |
| config/text/views/sources/source.yml | 239 | +1 -1 | yes |
| src/lib/state/forms/referrers.ts | 131 | +7 -1 | yes |
| src/lib/shell/keys/rows/approve/CppRows.svelte | 190 | +22 -4 | yes |
| src/lib/state/system/machine/lsp/clangd/cpp-form.ts | 185 | +18 -1 | yes |
| config/text/app.yml | 338 | +1 | yes |
| src/lib/server/machine/pty/refusal.ts | 98 | +41 -11 | yes |
| src/lib/server/machine/pty/routes.ts | 524 | +12 -7 | yes |
| src/lib/server/machine/pty/tmux.ts | 543 | +18 -2 | yes |
| src/lib/state/shared/answers/terminal-words.ts | 102 | +6 -3 | yes |
| config/text/views/sessions/terminal.yml | 131 | +1 | yes |
| config/text/views/system/machine/hpc.yml | 126 | +7 -7 | yes |
| src/lib/views/system/machine/hpc/Cluster.svelte | 221 | +23 -15 | yes |
| src/lib/state/sources/fs-transport.ts | 585 | +11 -4 | yes |
| docs/diagrams/layer-state.dot/.svg, layer-views.dot/.svg, layers.dot/.svg | generated | by `npm run diagrams` | yes (generated) |
| .scratch/migration/agents/reviews/O169-report.md | this file | | yes |

These files on the write list are unchanged: `task-seed.ts`, which needs nothing once `seedFacts` passes the bare key; `NamedBy.svelte`, which already draws the referrer's label inside "The setting {0}"; and `ScopeBar.svelte`, whose `kinds` already follows `scopeOfKind`. No test file and no allow list changed: `git diff --stat -- tests` printed nothing.

## Judgment calls the brief left open (each reversible)

1. `Confirm.svelte` takes the pick as a snippet (`pick?: Snippet`) drawn above the buttons, and `SubmitBox.svelte` draws `Select.svelte` inside it. The brief has Confirm import Select. That import breaks the ui folder order (`ui/forms` sits above `ui/controls`); the check reported `Confirm.svelte:26 imports ui/forms/choice/Select.svelte (ui/forms, above ui/controls)`. The dialog keeps one shape, and the select is the Select primitive.
2. "With one cluster, it is chosen" is read as: a box with one cluster picked shows it chosen. The other reading is that a box offering exactly one cluster picks it at the start. That needs `submit-job.svelte.ts` `press()` (outside the write list) to pick `choices.clusters[0]` when `choices.picked` is null and the list holds one cluster. Not built.
3. The empty choice of the select is drawn only while no cluster is picked, with empty words, and a change to it picks nothing. Without that, picking the blank choice after a cluster would leave the select and the box out of step. The select's accessible name is a new line, `source.submit_cluster: Cluster`. The orphan line `source.submit_picked` is removed.
4. The terminal-starting actions include `fork` beside the brief's seven. `forkSession` starts a new terminal through `startTerminal` (`routes.ts:242-266`), and its tmux failure answered "The terminal has ended." in the same way.
5. In item 2, ssh's line is cut with run.ts `short` and then given its full stop, so the stop is never cut off. `reason` is used as the caller gives it, since it is already the cut line git's failures are said by. When `reason` is the same text as the cut ssh line (a stream with no `fatal:` line), it is not said twice. When `reason` is empty, the ssh sentence stands alone.
6. In item 4, a root key that the served list does not hold also sends nothing and says "The folder of {0} does not exist.", the same as a root whose `real` is ''. The folder sent is `real` when the answer carries it, else `dir`, which the server has already expanded (`folders.ts:56-57`).
7. In item 6, lines 51 (`host_not_cluster`) and 54 (`host_unknown`) also get a full stop. Both are in the range 49 to 55 and are drawn alone as a sentence. Both open with `{0}`, a key, which keeps its own case.
8. In item 8, `marksShape` reads every FolderMarks key (`state`, `git`, `inGit`, `configured` beside `hub`, `project`, `home`) where the brief named only `git`. The same stripping also kept a workspace folder's make offer (`heldOffer` to `offerAlong` to `makeOffer`) from seeing `git` and `configured`. The shape now reads what the server sends; see the next section for what changes on screen.
9. The case-run programs stub `$state` on `globalThis` inside the scratchpad programs only, so the rune modules on `cpp-form.ts`'s import path load under Node. Nothing in the step's diff does this.

## User-visible changes (before and after; the look on landing)

- Start Agent on a task card (the Tasks collection view, or an entry page of a task in the primary hub and in a second hub): before, "That task is no longer in the hub, so nothing was started."; after, the composer opens with the task's seed. Starting the same task from the focus ticker also opens. A task removed from its file still says the refusal.
- The status bar's sync item tip after a failed fetch over ssh to an unknown host: before, "The last fetch failed: Could not read from remote repository."; after, "The last fetch failed: ssh: Could not resolve hostname <host>: <reason>. Could not read from remote repository."
- The Submit Job box (Submit Job on a .slurm tab, a hub with two clusters): before, one button per cluster between Cancel and Submit, the picked one reading "<name> (picked)"; after, one select labelled "Cluster" above Cancel and Submit. With no cluster picked the select shows a blank choice and Submit is off. With a cluster picked the select shows it, and the blank choice is gone. Changing the select asks for that cluster's plan, as a button press did. Stop at the box; no real submit.
- The delete ask of a cluster entry named by `slurm.resource` (the Resources view, Delete on that entry): before, "Referred to by slurm.resource. ..."; after, "Referred to by Slurm: Resource. ...". The entry page's "Named by" tag: before "The setting slurm.resource", after "The setting Slurm: Resource". Projects named by their `compute` are listed by short name or title, as before.
- The compile database list (the command palette on a C or C++ tab whose served root is written with `~`): before, "repo must be an absolute path" and no Add or Edit rows; after, the rows of `.oculus/cpp.yml` with Add and Edit. A root whose folder is missing says "The folder of <root> does not exist."
- A new terminal whose tmux call fails (the tab's bar): before, "The terminal has ended."; after, "The terminal did not start: <tmux's first line>." or, for a timeout, "The terminal did not start: tmux did not answer within <n> s.". A terminal that ended, and a resize or rename of an unlisted id, still say "The terminal has ended."
- Live HPC with a hub that names no cluster: before, "the settings of this hub name no cluster (slurm.resource in .oculus/config.yml)"; after, "The settings of this hub name no cluster (slurm.resource in .oculus/config.yml).". The same capital and full stop apply to the other host lines (49 to 55) wherever a cluster has no host: the cluster's error box, the Submit refusal and Account setup.
- Live HPC, a cluster whose `ssh -G` failed and whose poll failed: before, the grey line "ssh -G could not read the connection: ..." above the red box; after, the red box alone. A cluster whose resolution succeeded and whose poll failed keeps the grey line and the box.
- The Settings view's scope picker (a workspace whose folders include a git repository, such as the hub and the oculus repository): before, no Repository kind; after, Repository is offered and lists those workspace folders. A repository nested inside a workspace folder is not listed.
- The explorer's make menu on a workspace folder's own row (not asked for by the brief; it follows from item 8's shape): a folder that is already a git repository no longer offers Make Folder a Git Repository, and one that already holds every repository file no longer offers Add Repository Configuration..., matching the server's own offer.

## Wrong or impossible in the brief

- "No case of this step falls under an entry's code" does not hold for the files changed. `agents/guarded.md` names `task-start.ts` (G38), `referrers.ts` (G32), the start-to-resume operations of `pty/routes.ts` and `tmux.ts` (G35; `routes.ts` also G85), the folder shape of `fs-transport.ts` (G109) and `cppFields` and `cppChanges` of `cpp-form.ts` (G8). Every test of these entries that the changed files reach ran in `test:quick` and passed, `vitest` and `vitest slow` both ok. The tests named here ran alone too: `tests/state/forms/referrers.test.ts`, `tests/routes/sessions/compose.test.ts` and `tests/routes/sessions/terminal-actions.test.ts`, `Tests 74 passed (74)`. No case needs a new entry, and no test was written or edited.
- The brief's write list cannot hold item 3's label without breaking the state folder order, and item 5 makes `model-machine.ts:304-308` false. Both are in the first line.
- Item 3 has Confirm draw the select through Select.svelte. A ui/controls file importing ui/forms breaks the ui folder order, so the snippet form above is used.

## Limitations and sharp edges

- The grey resolution line is dropped whenever the resolution failed and the box is drawn, whether or not the box's text repeats the `ssh -G` error. A resolution error that differs from the poll's failure is not shown while the box is up.
- tmux's first line reaches the page unshortened. A very long tmux sentence makes a long bar line.
- `collectionKey` in `opening.svelte.ts` reads the id's hub by its first colon (`addressOfId`), which holds because a hub name holds no colon (`hub-names.ts:63-66`).
- An id or key the step adds: the catalogue keys `source.submit_cluster`, `app.palette.cpp_no_folder` and `sessions.refused_terminal_not_started_cause`. Each is unique in its group (grep above), and none is empty or collides with a configured key. The names array of `terminal-not-started` is empty when tmux's line is empty. The asynchronous paths in CppRows (read and write) say the missing-folder line and return before any request.

## Prose read (verify 5)

The new catalogue lines are sentences with a capital and a full stop ("The folder of {0} does not exist.", "The terminal did not start: {0}.", the seven host lines), except `submit_cluster: Cluster`, which is a control's name and not a sentence. No new list item was added. The longest new comment sentence, in `refusal.ts`'s head ("A failed tmux call of an action that starts a terminal is ..."), runs to about 40 words; it names the action, the word, the name it carries and how the page quotes it, which is one rule.

## Greps

- History words over the added lines (`git diff -U0 -- src config | grep '^+' | grep -inE "before|used to|no longer|still|..."`) found four hits, each judged present-tense wording, not history: `refusal.ts` "still there: a terminal tmux no longer has" (the terminal's state at the request, kept from the comment as it was); `task-start.ts` "the hub's name before it" (place in the text); `Confirm.svelte` "before the confirm" (order in the dialog); `Cluster.svelte` "empty before `ssh -G` answered" (kept from the comment as it was).
- Names changed or added, over src, tests, config and docs: `submit_picked` and `(picked)` have no hits left. `refusalFor` has its one caller, updated. `tmuxFailureWords`, `cppRepo`, `submit_cluster`, `cpp_no_folder` and `refused_terminal_not_started_cause` each have a definition and a reader. `RepoItems.svelte` keeps a local function of its own named `failedWords`, which is why the tmux helper is named `tmuxFailureWords`.
- Head comments and doc comments re-read: rewritten in `task-start.ts` (`seedFacts`), `state.ts` (`fetchFailureOf`), `Confirm.svelte`, `SubmitBox.svelte`, `referrers.ts` (`Referrer.label`), `CppRows.svelte`, `cpp-form.ts`, `refusal.ts` (head, `TmuxFailed`, `refusalFor`), `routes.ts` (head, `wrapped`), `tmux.ts` (`run`), `terminal-words.ts`, `Cluster.svelte` (head, `resolution`) and `fs-transport.ts` (`marksShape`). Still true: `task-seed.ts`, `submit-job.svelte.ts`, `NamedBy.svelte`, `scope.ts`, `place.ts` (`FsRoot`), `docs/apps.md:424` (`fetchFailure`) and `docs/HELP.md:546`. False and outside the write list: `model-machine.ts:304-308` (first line).

# Round 1

Not as the round asks: (1) ruling 1's new file is `src/lib/state/shared/words/key-titles.ts`, not the ruled `src/lib/data/helpers/key-titles.ts`, because `src/lib/data/helpers` already holds ten items (`ls src/lib/data/helpers | wc -l` printed 10) and an eleventh breaks `utils/folder-check.sh` and spec.md's ten-item rule; this is a departure from a ruling for the orchestrator to keep or reverse, and the path is outside both write lists. (2) In the one `npm run test:quick -- --base 32585f1f1` after the last change, `vitest` and `vitest slow` printed FAILED, on time limits only, in `website-files.test.ts`, `zenodo.test.ts` and `hub-portfolio.test.ts`; each of those files passes run alone (below). (3) `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O169.md .agents/worktrees/O169-base`, as the round writes it, exits 2 with `git does not know the base: .agents/worktrees/O169-base`; the same command with the base commit `32585f1f1` is quoted below. Every ruling is otherwise built.

## Rulings

1. **Setting label and folder order.** `titleOf` and `wordOf` (both exported) live in `src/lib/state/shared/words/key-titles.ts:7-20`, a new 20-line file whose head says what it holds and why it sits below every state folder. `rows.ts` has no copy and no re-export: it imports both (`rows.ts:50`), and `sectionOf` uses `wordOf` (`rows.ts:215`). `app-rows.ts:15` and `referrers.ts:20` import `titleOf` from the new file. Placement: state/shared is the last folder of the state order, so state/system and state/forms may both import it; `state/shared/words` held 9 items and now holds 10, and its files are the small conversions to words that views share (`format.ts`, `text.ts`), which is the concern of a key path's title. Check: after `npm run diagrams`, `grep -n "state/forms to folder state/system" docs/diagrams/layer-state.dot` prints nothing (exit 1); the `vitest checks` line of `test:quick` is `ok`; `sh utils/folder-check.sh` exits 0. The grep of the names over the state layer:
   ```
   src/lib/state/forms/referrers.ts:20:import { titleOf } from '../shared/words/key-titles.ts';
   src/lib/state/shared/words/key-titles.ts:7:export function wordOf(segment: string): string {
   src/lib/state/shared/words/key-titles.ts:16:export function titleOf(path: string): string {
   src/lib/state/system/config/rows.ts:50:import { titleOf, wordOf } from '../../shared/words/key-titles.ts';
   src/lib/state/system/config/other-rows/app-rows.ts:15:import { titleOf } from '../../../shared/words/key-titles.ts';
   ```
   (plus the call sites `rows.ts:215, 289, 481, 533`, `app-rows.ts:78`, `referrers.ts:128`). `grep -rn "titleOf\|wordOf" docs README.md` prints nothing.
2. **`TERMINAL_REFUSALS` comment.** `model-machine.ts:303-310` now says the page says the catalog's sentence for each name, that for `terminal-not-started` that sentence carries the first line of tmux's own error as its cause (the one name the server sends with it), and that a call tmux said nothing in is named in the catalog's words, so Node's account of the call never reaches the page. Check: read against `terminal-words.ts:35-38`, `refusal.ts:101` and `tmux.ts:90-96`, and the C5 rows below.
3. **One cluster is chosen.** `submit-job.svelte.ts:207-209`: `const lone = choices.clusters.length === 1 ? choices.clusters[0].resource : null; const first = choices.picked ?? lone; if (first !== null) await pick(first);`. The head comment (`:5-7`) says the one cluster of a list that holds one is picked at the start and its plan asked for at once. Check: C3's second part below, `one cluster, no server pick: picked: utwente | empty choice drawn: no | Submit off: false`, plan asked for `utwente`.
4. **Confirm names the snippet shape.** `Confirm.svelte:17-21`: "a pick (`pick`), an optional snippet drawn above the buttons, which the caller fills with ui/forms/choice/Select.svelte, so the choices are the options of one select; the caller fills it because ui/forms sits above this folder in the import order." Check: read.
5. **Negation contrast removed.** The "and not as one button each" clause is gone; the sentence ends "so the choices are the options of one select" (`Confirm.svelte:19-20`). Check: `grep -n "and not as" src/lib/ui/controls/confirm/Confirm.svelte` prints nothing.
6. **Focus and tab order.** Confirm's `focus` takes a third value, `pick` (`Confirm.svelte:58-62`); `opened()` (`:92-99`) puts the keyboard on the first control Tab reaches in the pick (`focusFirstQuietly` of ui/frame/quiet-focus.ts, on the `.pick` element bound at `:113`) and otherwise does what it did (`no` when `focus === 'cancel'` or `refused`, else `yes`). SubmitBox passes `focus={box.picked === null ? 'pick' : 'confirm'}` (`SubmitBox.svelte:36`), and its head comment (`:9-12`) says where the keyboard goes. User-visible change:

   | | Tab order | Focus at open, no cluster picked | Focus at open, a cluster picked |
   | --- | --- | --- | --- |
   | Before the step | Cancel, the cluster buttons, Submit | Cancel (Submit off) | Cancel (Submit off while the plan is read) |
   | After this round | the select, Cancel, Submit | the select | Cancel (Submit off while the plan is read), as before |

   A cluster is picked at open when the server picks one or when the list holds one (ruling 3), so a one-cluster box opens on Cancel and Submit turns on once the plan is read; the keyboard does not move when the plan arrives. Check: read; a press and a focus need a DOM, so the proof on screen is the look (spec.md line 67).
7. **A failure after a composed terminal started.** `composeSession` (`routes.ts:277-335`) takes the list the catch of `handleTerminal` reads (`() => listTerminals(plain)`, `routes.ts:479`) and wraps the typed prompt: `try { if (composed.keys.trim() !== '') await steerTerminal(id, composed.keys, options); } catch (error) { if (error instanceof TmuxFailed) return await heldRefusal(id, list); throw error; } finally { options.refresh?.(); }` (`:325-332`), with `id` the new terminal's id. `heldRefusal` (`refusal.ts:79-86`) answers `terminal-failed` while the list holds the id and `terminal-ended` when it does not, and `refusalFor` uses it for every other failed tmux call (`refusal.ts:103`). `STARTS` still holds `fork` (`refusal.ts:55-64`). The refusal.ts head comment (`:8-12`) and the `composeSession` doc (`routes.ts:279-282`) say so. A refusal a check makes during the steer (`TerminalRefused`, a validator's Error) passes on unchanged, and the list is refreshed in every case, since the terminal exists. Check: C9 below. The other start actions were read for a tmux call after a successful start: `start`, `chat`, `resume`, `fork`, `latex` and `command` make none after `startTerminal`; the `respawnTerminal` of a kept task terminal is reached through `rerun` and `restart`, which are not start actions.
8. **`FsRoot`.** `cppRepo(roots: readonly Pick<FsRoot, 'key' | 'dir' | 'real'>[], key: string)` (`cpp-form.ts:148-151`), with `import type { FsRoot } from '../../../../sources/explorer/view/place.ts';` (`:23`); `ServedFolder` is gone. `place.ts` is not changed. The greps:
   ```
   $ grep -rn 'ServedFolder\|FsRoot' src/lib/state/system/machine/lsp/clangd/cpp-form.ts src/lib/shell/keys/rows/approve/CppRows.svelte
   src/lib/state/system/machine/lsp/clangd/cpp-form.ts:23:import type { FsRoot } from '../../../../sources/explorer/view/place.ts';
   src/lib/state/system/machine/lsp/clangd/cpp-form.ts:149:    roots: readonly Pick<FsRoot, 'key' | 'dir' | 'real'>[],
   $ grep -rn 'ServedFolder' src tests docs README.md
   (nothing, exit 1)
   $ grep -rn 'export type FsRoot' src
   src/lib/state/sources/explorer/view/place.ts:58:export type FsRoot = {
   ```
   The `Pick` form is used because `cppRepo` reads those three fields alone. Check: `svelte-check ... 0 ERRORS 0 WARNINGS` in `test:quick`; C4 below.
9. **Case-run programs quoted.** Each source is quoted whole under "Case-run programs", with its full path, and each output under "Cases after the round".

## Cases after the round

All run with `node <program> /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O169` from the cases folder, after the last change of the round.

- C1, `c1.ts`:
  ```
  primary hub, card (hub:tasks): started, seed first line "Task: Write the report"
  second hub, card (lab:tasks): started, seed first line "Task: Order the parts"
  primary hub, ticker (tasks): started, seed first line "Task: Write the report"
  second hub, ticker (tasks): started, seed first line "Task: Order the parts"
  removed task, card (hub:tasks): refused task-unknown
  removed task, ticker (tasks): refused task-unknown
  ```
- C2, `c2.ts`:
  ```
  ssh line then fatal: line "ssh: Could not resolve hostname git.example: nodename nor servname provided, or not known. Could not read from remote repository."
  two ssh lines then fatal: line "ssh: connect to host b port 22: Connection refused. Could not read from remote repository."
  fatal line only: line "Could not read from remote repository."
  a row matches: line "git@github.com: Permission denied (publickey)." kind "Git key refused"
  ```
- C3, `c3.ts` (the label, then the Submit box's opening state):
  ```
  named by slurm.resource and two projects: Referred to by Alpha, Project beta, Slurm: Resource. The references stay in their files and show as findings.
      Named by tag: The setting Slurm: Resource
  named by two projects alone: Referred to by Alpha, Project beta. The references stay in their files and show as findings.
  one cluster, no server pick:
      picked: utwente | empty choice drawn: no | Submit off: false
      question: Copy the code of Alpha to UT and submit code/run.slurm?
      plans asked for: utwente
  two clusters, no server pick:
      picked: (none) | empty choice drawn: yes | Submit off: true
      question: Pick the cluster to submit code/run.slurm to.
      plans asked for: (none)
  two clusters, server picks vsc:
      picked: vsc | empty choice drawn: no | Submit off: false
      question: Copy the code of Alpha to VSC and submit code/run.slurm?
      plans asked for: vsc
  ```
  "empty choice drawn" is computed as SubmitBox.svelte computes `empty` (`box.picked === null`).
- C4, `c4.ts`, then `c4-server.ts <worktree> <worktree> oculus <worktree>`:
  ```
  oculus: repo "/Users/axelfaes/workspace/oculus"; sent ["GET /api/cpp?repo=%2FUsers%2Faxelfaes%2Fworkspace%2Foculus","POST /api/cpp {\"repo\":\"/Users/axelfaes/workspace/oculus\",\"at\":null,\"changes\":{\"name\":\"x\"}}"]
  gone: no call; said "The folder of gone does not exist."; sent []
  oculus: {"error":"repo must be an absolute path"}
  /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O169: {"repo":"/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O169"}
  ```
- C5 and C9, `c5.ts` (the temporary folder and the random terminal id of the control row replaced by placeholders here):
  ```
  new terminal, tmux says "socket path too long": 400 {"error":"terminal-not-started","names":["socket path too long"]}
      drawn: The terminal did not start: socket path too long.
  new terminal, tmux says "server exited unexpectedly.": 400 {"error":"terminal-not-started","names":["server exited unexpectedly"]}
      drawn: The terminal did not start: server exited unexpectedly.
  new terminal, tmux timed out (TmuxSilence): 400 {"error":"terminal-not-started","names":["tmux did not answer within 0.2 s"]}
      drawn: The terminal did not start: tmux did not answer within 0.2 s.
  new terminal, tmux failed saying nothing (TmuxSilence): 400 {"error":"terminal-not-started","names":["tmux failed without saying why"]}
      drawn: The terminal did not start: tmux failed without saying why.
  steer of a terminal that ended, tmux fails: 400 {"error":"terminal-ended"}
      drawn: The terminal has ended.
  resize of an unlisted id: 400 {"error":"terminal-ended"}
      drawn: The terminal has ended.
  C9 compose started, typed keys fail, terminal still listed: 400 {"error":"terminal-failed"}
      drawn: The terminal could not do that.
  C9 compose started, typed keys fail, terminal gone from the list: 400 {"error":"terminal-ended"}
      drawn: The terminal has ended.
  C9 control: compose started, no prompt to type: 200 {"ok":true,"terminal":{"resumes":null,"task":false,"exit":null,"job":null,"foreign":false,"agent":null,"id":"<new id>","name":"<new id>","title":"","icon":"","color":"","kind":"shell","app":"","cwd":"<temporary folder>","command":"bash","pid":4242,"created":"2023-11-14T22:13:20.000Z","attached":false}}
  ```
  No row carries the call. The C9 rows run against the base copy (`node c5.ts /Users/axelfaes/workspace/oculus/.agents/worktrees/O169-base`) both answered `{"error":"terminal-ended"}`, because the catch asked the list for `message.id`, which a compose request does not carry.
- C6, `grep -n "^        host_" config/text/views/system/machine/hpc.yml`:
  ```
  49:        host_none: The cluster {0} has no host.
  50:        host_no_cluster: The settings of this hub name no cluster (slurm.resource in .oculus/config.yml).
  51:        host_not_cluster: '{0} is not a cluster.'
  52:        host_not_read: The resources registry is not read yet.
  53:        host_not_listed: '{0} is not a cluster of slurm.resource in .oculus/config.yml.'
  54:        host_unknown: '{0} names no resource.'
  55:        host_unusable: The host of the cluster {0} is not a usable ssh alias, DNS name or address.
  ```

## Verify, run once after the last change

- `npm run diagrams`: exit 0.
- `npm run test:quick -- --base 32585f1f1` (exit 1), the lines as printed:
  ```
  ok      prettier (1.2 s): All matched files use Prettier code style!
  ok      ASCII gate (1.2 s)
  ok      svelte-kit sync (3.2 s)
  ok      eslint (20.7 s)
  ok      svelte-check (21.0 s): 1794091135793 COMPLETED 589 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  FAILED  vitest (193.6 s)
  ok      vitest checks (216.4 s): Duration  191.88s (transform 91.54s, setup 0ms, import 160.43s, tests 427.26s, environment 4ms)
  FAILED  vitest slow (290.1 s)
  ```
  `vitest`: `Test Files  2 failed | 137 passed | 35 skipped (174)`, `Tests  1 failed | 1978 passed | 462 skipped (2441)`; the failures are `tests/data/hubs/website-files.test.ts` (`Hook timed out in 10000ms` in its `beforeAll`) and one case of `tests/routes/git/zenodo.test.ts` (`Test timed out in 5000ms`). `vitest slow`: three cases of `tests/data/hubs/hub-portfolio.test.ts`, each `Test timed out in 20000ms`. Run alone after it: `npx vitest run tests/data/hubs/website-files.test.ts tests/routes/git/zenodo.test.ts tests/data/hubs/hub-portfolio.test.ts tests/data/hubs/workspace-projects.test.ts tests/state/sources/clone-after.test.ts` printed `Test Files  5 passed (5)`, `Tests  124 passed (124)`, and `npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout 20000` printed `Test Files  1 passed (1)`, `Tests  16 passed (16)`. None of these files is changed by the step; they reach its files at import depth 2. The time limits are not loosened.
- The ASCII gate of the brief over the 31 changed files (the list from `git status --short`, `.scratch` left out): prints nothing.
- `sh utils/unused-exports.sh` (exit 0) compared with `.agents/worktrees/O169-base/unused-exports.txt`: `diff` prints nothing, so no line is added.
- `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O169.md .agents/worktrees/O169-base`: `git does not know the base: .agents/worktrees/O169-base`, exit 2. With the base commit, `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O169.md 32585f1f1`:
  ```
  .scratch/migration/agents/briefs/O169-round1.md
  docs/diagrams/layer-state.dot
  docs/diagrams/layer-state.svg
  docs/diagrams/layer-ui.dot
  docs/diagrams/layer-ui.svg
  docs/diagrams/layer-views.dot
  docs/diagrams/layer-views.svg
  docs/diagrams/layers.dot
  docs/diagrams/layers.svg
  src/lib/data/model/machine/model-machine.ts
  src/lib/state/shared/words/key-titles.ts
  src/lib/state/system/config/other-rows/app-rows.ts
  src/lib/state/system/config/rows.ts
  src/lib/views/sources/source/actions/submit-job.svelte.ts
  ```
  The round file is the orchestrator's. The `docs/diagrams` paths are the brief's `docs/diagrams/*.dot` and `*.svg`, which the script does not read as a pattern. `model-machine.ts`, `app-rows.ts`, `rows.ts` and `submit-job.svelte.ts` are the round's list. `src/lib/state/shared/words/key-titles.ts` is outside both lists: the departure of ruling 1.
- `sh utils/folder-check.sh`: exit 0.
- Related tests while working: `npx vitest run tests/state/forms/referrers.test.ts tests/state/system/settings tests/state/system/apps/contributions.test.ts tests/state/system/entry-forms.test.ts tests/routes/sessions/terminal.test.ts tests/routes/sessions/terminal-actions.test.ts tests/routes/sessions/terminal-edit.test.ts tests/server/machine/pty/agent-pane.test.ts tests/state/workbench/options-pages.test.ts tests/state/system/config/sparse-card.test.ts`: `Test Files  18 passed (18)`, `Tests  299 passed (299)`. No test was written or edited.

## Decisions for the orchestrator

- Ruling 1's place, `state/shared/words/key-titles.ts` in place of `data/helpers/key-titles.ts` (the reason is in the first line). The other way that keeps the folder rule is to split `src/lib/data/helpers` into folders named for what they hold, which moves files many importers name and is outside the step's part.
- Confirm's `focus` prop takes `pick`, an internal prop value of a primitive; SubmitBox is its one caller with that value.

## Files of the round, with line counts (`wc -l`)

| File | Lines | Round 1 change |
| --- | --- | --- |
| `src/lib/state/shared/words/key-titles.ts` | 20 | new, ruling 1 (outside both lists) |
| `src/lib/state/system/config/rows.ts` | 586 | ruling 1 |
| `src/lib/state/system/config/other-rows/app-rows.ts` | 91 | ruling 1 |
| `src/lib/state/forms/referrers.ts` | 131 | ruling 1 |
| `src/lib/data/model/machine/model-machine.ts` | 848 | ruling 2 |
| `src/lib/views/sources/source/actions/submit-job.svelte.ts` | 242 | ruling 3 |
| `src/lib/ui/controls/confirm/Confirm.svelte` | 221 | rulings 4, 5, 6 |
| `src/lib/views/sources/source/actions/SubmitBox.svelte` | 50 | ruling 6 |
| `src/lib/server/machine/pty/routes.ts` | 538 | ruling 7 |
| `src/lib/server/machine/pty/refusal.ts` | 106 | ruling 7 |
| `src/lib/state/system/machine/lsp/clangd/cpp-form.ts` | 186 | ruling 8 |
| `docs/diagrams/layer-state.dot`, `layer-ui.dot`, `layers.dot`, `layer-views.dot` and their `.svg` | 173, 143, 101, 179 | `npm run diagrams` |

The step's other files are unchanged by the round. The svelte and TypeScript files stay under their limits (520 and 880).

## Head comments and doc comments re-read in the round

Rewritten: `key-titles.ts` (new head), `model-machine.ts` (`TERMINAL_REFUSALS`), `submit-job.svelte.ts` (head), `Confirm.svelte` (head, `focus`, `opened`), `SubmitBox.svelte` (head), `routes.ts` (`composeSession`), `refusal.ts` (head, `heldRefusal`). Still true: `rows.ts` (head, `sectionOf`), `app-rows.ts` (head), `referrers.ts` (`Referrer.label`), `routes.ts` (head), `terminal-words.ts` (head), `cpp-form.ts` (head, `cppRepo`), `place.ts` (`FsRoot`), `docs/HELP.md:546`. `grep -rn -i "terminal-not-started\|did not start\|submit box\|one cluster\|Confirm.svelte" docs README.md` finds only `docs/HELP.md:546`, which stays true.

## Case-run programs

### /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases/c1.ts

```ts
// Case-run program for C1: seedFacts over a fixture workspace of two hubs in a temporary folder.
// Usage: node c1.ts <tree>. Prints one line per case; writes only under the temporary folder.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tree = process.argv[2];
const { seedFacts } = await import(join(tree, 'src/lib/server/machine/runs/seeds/task-start.ts'));
const { loadConfig } = await import(join(tree, 'src/lib/data/sources/config.ts'));
const { rootsOf } = await import(join(tree, 'src/lib/server/files/workspace/folders.ts'));
const engine = tree;

const top = mkdtempSync(join(tmpdir(), 'o169-c1-'));
const TASKS = (key: string, title: string) =>
    [
        'title: Tasks',
        'schema:',
        '  - { field: key, type: text, primary_key: true, required: true }',
        '  - { field: title, type: text, display: 1, required: true }',
        '  - { field: status, type: select, options: [todo, done] }',
        'entries:',
        `  - { key: ${key}, title: "${title}", status: todo }`,
        ''
    ].join('\n');
function plant(name: string, key: string, title: string): string {
    const dir = join(top, name);
    mkdirSync(join(dir, '.oculus', 'data', 'academic'), { recursive: true });
    writeFileSync(join(dir, '.oculus', 'config.yml'), '{}\n');
    writeFileSync(join(dir, '.oculus', 'data', 'academic', 'tasks.yml'), TASKS(key, title));
    return dir;
}
const hubDir = plant('hub', 'write-report', 'Write the report');
const labDir = plant('lab', 'order-parts', 'Order the parts');
const folders = [
    { name: 'hub', path: hubDir, dir: hubDir, real: hubDir, hub: true },
    { name: 'lab', path: labDir, dir: labDir, real: labDir, hub: true }
];
const open = {
    file: null,
    name: '',
    hub: '',
    folders,
    primary: 'hub',
    primaryDir: hubDir,
    hubs: folders.map((one) => ({ name: one.name, dir: one.dir })),
    roots: rootsOf(folders),
    findings: [],
    unreadable: null,
    recent: [],
    available: [],
    stateFile: join(top, 'state.yml'),
    stateFolder: top
};
const source = {
    open,
    merged: loadConfig(engine, { hub: hubDir }).config,
    settings: (dir: string) => loadConfig(engine, { hub: dir })
};
function tryRef(label: string, ref: { id: string; collection?: string }): void {
    try {
        const facts = seedFacts(ref, source);
        console.log(`${label}: started, seed first line "${facts.seed.split('\n')[0]}"`);
    } catch (error) {
        const word = (error as { word?: string }).word ?? String(error);
        console.log(`${label}: refused ${word}`);
    }
}
tryRef('primary hub, card (hub:tasks)', { id: 'hub:write-report', collection: 'hub:tasks' });
tryRef('second hub, card (lab:tasks)', { id: 'lab:order-parts', collection: 'lab:tasks' });
tryRef('primary hub, ticker (tasks)', { id: 'hub:write-report', collection: 'tasks' });
tryRef('second hub, ticker (tasks)', { id: 'lab:order-parts', collection: 'tasks' });
writeFileSync(join(hubDir, '.oculus', 'data', 'academic', 'tasks.yml'), TASKS('other', 'Other'));
tryRef('removed task, card (hub:tasks)', { id: 'hub:write-report', collection: 'hub:tasks' });
tryRef('removed task, ticker (tasks)', { id: 'hub:write-report', collection: 'tasks' });
rmSync(top, { recursive: true, force: true });
```

### /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases/c2.ts

```ts
// Case-run program for C2: fetchFailureOf over four error streams, with the shipped rows and git's
// reason as run.ts makes it (`short`, the cut every git failure line gets). Usage: node c2.ts <tree>.
import { join } from 'node:path';

const tree = process.argv[2];
const { fetchFailureOf } = await import(join(tree, 'src/lib/server/core/git/state.ts'));
const { short } = await import(join(tree, 'src/lib/server/core/git/run.ts'));
const { loadConfig, failureRows } = await import(join(tree, 'src/lib/data/sources/config.ts'));
const rows = failureRows(loadConfig(tree).config);
const at = new Date('2026-11-07T00:00:00Z');
const fatal = 'fatal: Could not read from remote repository.';
const reason = (stream: string) =>
    short(stream.split('\n').findLast((line) => line.startsWith('fatal: ')) ?? stream);
const cases: [string, string][] = [
    [
        'ssh line then fatal',
        `ssh: Could not resolve hostname git.example: nodename nor servname provided, or not known\n${fatal}\n`
    ],
    ['two ssh lines then fatal', `ssh: connect to host a port 22: Operation timed out\nssh: connect to host b port 22: Connection refused\n${fatal}\n`],
    ['fatal line only', `${fatal}\n`],
    ['a row matches', `git@github.com: Permission denied (publickey).\n${fatal}\n`]
];
for (const [label, stream] of cases) {
    const failure = fetchFailureOf(stream, reason(stream), rows, at);
    console.log(`${label}: line "${failure.line}"${failure.kind === undefined ? '' : ` kind "${failure.kind}"`}`);
}
```

### /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases/c3.ts

```ts
// Case-run program for C3. Part one, the delete ask's words: referrersOf over a synthetic snapshot
// of one cluster resource named by slurm.resource and by two projects' compute, and the ask's
// detail filled from the catalogue as DeleteAsk.svelte fills it. Part two, the Submit box's opening
// state: createSubmitJob with its server calls stubbed, pressed once for a list of one cluster and
// no server pick, a list of two and no server pick, and a list of two with a server pick; it prints
// the cluster picked, whether the select draws its empty choice (SubmitBox.svelte draws it while
// nothing is picked), whether Submit is off, the box's question and which plans were asked for.
// A resolve hook maps `$lib/` to the tree's src/lib and adds `.ts` to a path given without it, as
// Vite does for the page. Usage: node c3.ts <tree>.
import { register } from 'node:module';
import { join } from 'node:path';
const tree = process.argv[2];
const hook = `
import { pathToFileURL } from 'node:url';
let lib = '';
export function initialize(data) { lib = data.lib; }
export async function resolve(specifier, context, next) {
    const spec = specifier.startsWith('$lib/') ? pathToFileURL(lib + specifier.slice(4)).href : specifier;
    try {
        return await next(spec, context);
    } catch (error) {
        if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
        return next(spec + '.ts', context);
    }
}`;
register(`data:text/javascript,${encodeURIComponent(hook)}`, {
    data: { lib: join(tree, 'src/lib') }
});
(globalThis as Record<string, unknown>).$state = (value: unknown) => value;
const { referrersOf } = await import(join(tree, 'src/lib/state/forms/referrers.ts'));
const { loadConfig, textCatalog } = await import(join(tree, 'src/lib/data/sources/config.ts'));
const catalog = textCatalog(loadConfig(tree).config) as Record<string, string>;
const project = (id: string, short: string, title: string, resourceIds: string[]) => ({
    id, root: 'hub', short, title, resourceIds,
    pillarIds: [], domainIds: [], datasetIds: [], fundingIds: [], lead: [], collaborators: [],
    supervisors: [], waitingOn: [], venueId: ''
});
const snapshot = {
    entities: {
        collections: { 'hub:resources': { id: 'hub:resources', registry: 'resources', entries: [] } },
        resources: { 'hub:utwente': { id: 'hub:utwente', root: 'hub', name: 'UT', kind: 'cluster' } },
        projects: {
            'hub:a': project('hub:a', 'Alpha', 'Project alpha', ['hub:utwente']),
            'hub:b': project('hub:b', '', 'Project beta', ['hub:utwente'])
        },
        people: {}, funding: {}
    }
};
const fill = (key: string, value: string) => catalog[key].replace('{0}', value);
for (const [label, config] of [
    ['named by slurm.resource and two projects', { slurm: { resource: ['utwente'] } }],
    ['named by two projects alone', { slurm: { resource: [] } }]
] as const) {
    const named = referrersOf(snapshot, config, 'resources', 'hub:utwente', 'hub');
    console.log(`${label}: ${fill('entry_form.delete_used', named.map((one: { label: string }) => one.label).join(', '))}`);
    for (const one of named.filter((x: { kind: string }) => x.kind === 'setting')) {
        console.log(`    Named by tag: ${fill('entry_form.referrer_setting', one.label)}`);
    }
}

const { setCatalog } = await import(join(tree, 'src/lib/state/shared/words/text.ts'));
setCatalog(catalog);
const { createSubmitJob } = await import(
    join(tree, 'src/lib/views/sources/source/actions/submit-job.svelte.ts')
);
type Cluster = { resource: string; name: string };
const plan = (resource: string) => ({
    root: 'hub', path: 'code/run.slurm', project: 'Alpha', resource, host: `${resource}-login`,
    source: '/work/alpha/code/', target: `${resource}-login:/home/alpha/`, files: 3, bytes: 2048,
    digest: 'd', rsync: ['-a', '/work/alpha/code/', `${resource}-login:/home/alpha/`],
    remote: 'cd /home/alpha && sbatch --parsable run.slurm',
    scratch: { named: true, unread: [] }
});
for (const [label, clusters, picked] of [
    ['one cluster, no server pick', [{ resource: 'utwente', name: 'UT' }], null],
    ['two clusters, no server pick', [{ resource: 'utwente', name: 'UT' }, { resource: 'vsc', name: 'VSC' }], null],
    ['two clusters, server picks vsc', [{ resource: 'utwente', name: 'UT' }, { resource: 'vsc', name: 'VSC' }], 'vsc']
] as [string, Cluster[], string | null][]) {
    const asked: string[] = [];
    const flow = createSubmitJob({
        root: () => 'hub',
        path: () => 'code/run.slurm',
        roots: () => [{ key: 'hub' }],
        onDisk: () => true,
        unsaved: () => false,
        save: async () => {},
        said: () => {},
        hpc: {
            submitChoices: async () => ({ clusters, picked }),
            planSubmit: async (_root: string, _path: string, resource: string) => {
                asked.push(resource);
                return { plan: plan(resource) };
            },
            submitJob: async () => ({ job: '1' })
        },
        openView: () => {}
    });
    await flow.press();
    const box = flow.box;
    console.log(`${label}:`);
    console.log(`    picked: ${box.picked ?? '(none)'} | empty choice drawn: ${box.picked === null ? 'yes' : 'no'} | Submit off: ${box.off}`);
    console.log(`    question: ${box.message}`);
    console.log(`    plans asked for: ${asked.length === 0 ? '(none)' : asked.join(', ')}`);
}
```

### /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases/c4.ts

```ts
// Case-run program for C4: what the compile database rows send for a served root, the read and the
// write, with fetch stubbed to record each request and answer as the server would. The rows' own
// steps are taken in their order: the root key turned into a folder by cpp-form.ts `cppRepo` when
// the tree has it (the key itself when it has not, as CppRows.svelte sent it), then readCppFile and
// writeCppEntry with that folder. Usage: node c4.ts <tree>.
import { join } from 'node:path';
import { homedir } from 'node:os';

const tree = process.argv[2];
// The rune modules on the import path read $state, which only Svelte's compiler gives; a plain
// value stands in for it here, since nothing in this run is reactive.
(globalThis as Record<string, unknown>).$state = (value: unknown) => value;
const form = await import(join(tree, 'src/lib/state/system/machine/lsp/clangd/cpp-form.ts'));
const { loadConfig, textCatalog } = await import(join(tree, 'src/lib/data/sources/config.ts'));
const catalog = textCatalog(loadConfig(tree).config) as Record<string, string>;
const sent: string[] = [];
globalThis.fetch = (async (url: string, init?: { body?: string }) => {
    sent.push(init?.body === undefined ? `GET ${url}` : `POST ${url} ${init.body}`);
    return new Response(JSON.stringify({ fields: [], entries: [] }), { status: 200 });
}) as typeof fetch;
const writes = { writeToken: () => 'token', renewToken: async () => {} };
const roots = [
    { key: 'oculus', dir: join(homedir(), 'workspace/oculus'), real: join(homedir(), 'workspace/oculus') },
    { key: 'gone', dir: join(homedir(), 'workspace/gone'), real: '' }
];
for (const root of roots) {
    sent.length = 0;
    const repo: string | null =
        typeof form.cppRepo === 'function' ? form.cppRepo(roots, root.key) : root.key;
    if (repo === null) {
        const line = (catalog['app.palette.cpp_no_folder'] ?? '(no line)').replace('{0}', root.key);
        console.log(`${root.key}: no call; said "${line}"; sent ${JSON.stringify(sent)}`);
        continue;
    }
    await form.readCppFile(repo);
    await form.writeCppEntry(writes, repo, null, null, { name: 'x' }).catch(() => null);
    console.log(`${root.key}: repo ${JSON.stringify(repo)}; sent ${JSON.stringify(sent)}`);
}
```

### /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases/c4-server.ts

```ts
// Case-run program for C4, the server half: what repositoryOf answers for each repo the rows send,
// with the served roots as given. Usage: node c4-server.ts <tree> <served root> <repo>...
import { join } from 'node:path';
const [tree, served, ...repos] = process.argv.slice(2);
const { repositoryOf } = await import(join(tree, 'src/lib/server/machine/runs/commands/repo.ts'));
for (const repo of repos) console.log(`${repo}: ${JSON.stringify(repositoryOf(repo, [served]))}`);
```

### /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases/c5.ts

```ts
// Case-run program for C5 and C9: POST /api/terminal through handleTerminal with the tmux runner
// stubbed. In the C5 rows a start's `new-session` fails as the case says; every list call answers
// no terminal. The TmuxSilence cases call tmux.ts `run` with a stand-in binary from this folder
// (`false` for a call that fails with nothing on stderr, a script that sleeps for one killed at its
// timeout), so no tmux runs. In the C9 rows a compose's `new-session` succeeds, the list answers
// the new session (for every list call, or only for the one the start makes), and every other
// call, the typed prompt's send-keys among them, fails. Prints the answer's status and body; never
// the error's own message.
// Usage: node c5.ts <tree>.
import { mkdtempSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tree = process.argv[2];
const { handleTerminal } = await import(join(tree, 'src/lib/server/machine/pty/routes.ts'));
const { run } = await import(join(tree, 'src/lib/server/machine/pty/tmux.ts'));
const { loadConfig, localDefaults } = await import(join(tree, 'src/lib/data/sources/config.ts'));
const { gitCredentials } = await import(join(tree, 'src/lib/server/core/git/credentials.ts'));

const scratch = mkdtempSync(join(tmpdir(), 'o169-c5-'));
const sleeper = join(scratch, 'sleeper');
writeFileSync(sleeper, '#!/bin/sh\nsleep 5\n');
chmodSync(sleeper, 0o755);
const TOKEN = 'the-write-token-of-this-run';
const open = {
    file: null,
    name: '',
    hub: '',
    folders: [],
    primary: null,
    primaryDir: null,
    hubs: [],
    roots: [],
    findings: [],
    unreadable: null,
    recent: [],
    available: [],
    stateFile: join(scratch, 'state.yml'),
    stateFolder: scratch
};
const config = loadConfig(tree).config;
const { textCatalog } = await import(join(tree, 'src/lib/data/sources/config.ts'));
const catalog = textCatalog(config) as Record<string, string>;
type Runner = (args: string[]) => Promise<string>;
type Fail = (args: string[]) => Promise<string>;
function base(runner: Runner) {
    return {
        engine: tree,
        openFor: () => open,
        localFor: () => localDefaults(),
        hubSettings: (dir: string) => loadConfig(tree, { hub: dir }),
        credentials: gitCredentials(() => []),
        configFor: () => config,
        rootsFor: () => [scratch],
        run: runner
    };
}
function options(fail: Fail) {
    return base((args: string[]) => {
        if (args[0] === 'new-session' || args[0] === 'resize-window' || args[0] === 'send-keys') {
            return fail(args);
        }
        return Promise.resolve('');
    });
}
// The C9 runner: `new-session` succeeds and its session is remembered; the first `listedFor` list
// calls answer that session as one row of LIST_FORMAT; every other call fails as tmux would on a
// pane it cannot reach.
function composed(listedFor: number) {
    let session = '';
    let lists = 0;
    return base((args: string[]) => {
        if (args[0] === 'new-session') {
            session = args[args.indexOf('-s') + 1];
            return Promise.resolve('');
        }
        if (args[0] === 'list-sessions') {
            lists += 1;
            if (session === '' || lists > listedFor) return Promise.resolve('');
            const row = [session, '1700000000', '0', 'bash', '4242', scratch];
            return Promise.resolve(`${[...row, '', '', '', '', '', '', '0', '', '', '4241'].join('\t')}\n`);
        }
        return Promise.reject(new Error("can't find pane: %0"));
    });
}
function post(body: unknown): Request {
    return new Request('http://127.0.0.1:8791/api/terminal', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'sec-fetch-site': 'same-origin',
            'x-oculus-token': TOKEN
        },
        body: JSON.stringify(body)
    });
}
async function report(label: string, answer: Response): Promise<void> {
    const text = await answer.text();
    const leaks = text.includes('new-session') || text.includes('Command failed');
    console.log(`${label}: ${answer.status} ${text}${leaks ? ' (CARRIES THE CALL)' : ''}`);
    // The sentence the catalogue gives the answer, filled as the page fills it: the word's line,
    // and for terminal-not-started with a name the line that quotes it.
    const said = JSON.parse(text) as { error?: string; names?: string[] };
    if (said.error === undefined) return;
    const key =
        said.error === 'terminal-not-started' && (said.names?.[0] ?? '') !== ''
            ? 'sessions.refused_terminal_not_started_cause'
            : `sessions.refused_${said.error.replaceAll('-', '_')}`;
    const line = catalog[key] ?? `(no line ${key})`;
    console.log(`    drawn: ${line.replace('{0}', said.names?.[0] ?? '')}`);
}
const start = { action: 'start', kind: 'shell', cwd: scratch, cols: 80, rows: 24 };
const ID = 'a1b2c3-claude';
const cases: [string, unknown, Fail][] = [
    ['new terminal, tmux says "socket path too long"', start, () => Promise.reject(new Error('socket path too long'))],
    ['new terminal, tmux says "server exited unexpectedly."', start, () => Promise.reject(new Error('server exited unexpectedly.'))],
    ['new terminal, tmux timed out (TmuxSilence)', start, (args) => run(args, { binary: sleeper }, 200)],
    ['new terminal, tmux failed saying nothing (TmuxSilence)', start, (args) => run(args, { binary: '/usr/bin/false' })],
    ['steer of a terminal that ended, tmux fails', { action: 'steer', id: ID, text: 'ls' }, () => Promise.reject(new Error("can't find session"))],
    ['resize of an unlisted id', { action: 'resize', id: ID, cols: 80, rows: 24 }, () => Promise.reject(new Error("can't find session"))]
];
for (const [label, body, fail] of cases) {
    await report(label, await handleTerminal(post(body), TOKEN, options(fail)));
}
const compose = { action: 'compose', agent: 'shell', cwd: scratch, prompt: 'make test', cols: 80, rows: 24 };
await report(
    'C9 compose started, typed keys fail, terminal still listed',
    await handleTerminal(post(compose), TOKEN, composed(Number.POSITIVE_INFINITY))
);
await report(
    'C9 compose started, typed keys fail, terminal gone from the list',
    await handleTerminal(post(compose), TOKEN, composed(1))
);
await report(
    'C9 control: compose started, no prompt to type',
    await handleTerminal(post({ ...compose, prompt: '' }), TOKEN, composed(Number.POSITIVE_INFINITY))
);
rmSync(scratch, { recursive: true, force: true });
```
