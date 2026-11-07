# Brief check of O169 (connections and their failures said in full), oculus main at 56a1fff1ec37a6087f12a257198942226d364912

Summary of what the orchestrator must act on before dispatch:
- Five fixes need files that are not in the brief's write list: `pty/routes.ts`, `model-machine.ts`, `Confirm.svelte`, `fs-transport.ts` and `NamedBy.svelte` (F1.1 to F1.5).
- Every case marked "a test" except C6 conflicts with the rules file's test rule. The rule allows a test only under an entry of `guarded.md`, and most of these modules have no entry (F4.1).
- Reading the code already settles C1 and C8: the defect is the collection key for C1 and the client's marks shape for C8. As written, the C8 test passes on the unchanged tree (F3.2, F3.6, F5.8).
- Item 5 as worded can put execFile's command line on the page. That line can hold the `-e` credential pairs (F6.5).

## 1. Names

Command: `git grep -n -F "<name>" -- src tests config docs README.md ':!config/local.yml'` for each of: `no longer in the hub`, `fetchFailureOf`, `last fetch failed`, `submit_picked`, `(picked)`, `delete_used`, `Referred to by`, `readCppFile`, `writeCppEntry`, `TmuxFailed`, `terminal has ended`, `terminal-ended`, `did not start`, `host_no_cluster`, `resolution_error`, `scope_repo`, `marks.git`. Further reads: `grep -rn 'referrersOf' src`, `grep -rn "terminal-not-started\|TmuxFailed\|refusalFor" src tests`, `sed -n 1,120p src/lib/ui/controls/confirm/Confirm.svelte`, `sed -n 227,257p src/lib/state/sources/fs-transport.ts`.

- F1.1 `src/lib/server/machine/pty/routes.ts:139-141` (not in the write list). Its doc comment reads "tmux's own failure, whose text never reaches the page". Item 5 makes this false.
  - The only call of `refusalFor` is `routes.ts:516`: `return refusalFor(error, message.id, () => listTerminals(plain));`. It passes no action (see F3.4), so item 5 needs this file.
  - `routes.ts:153` is where `TmuxFailed` is built.
- F1.2 `src/lib/data/model/machine/model-machine.ts:309-320` holds `TERMINAL_REFUSALS` (not in the write list). A new refusal word for item 5 must be added there.
  - A word `terminal-not-started` already exists:
    - declared at `model-machine.ts:317`;
    - catalog line at `terminal.yml:75`: `refused_terminal_not_started: The terminal did not start.`;
    - thrown at `sessions.ts:662` and at `src/lib/server/machine/apps/tools/run/tasks.ts:532` (not in the write list), both with no names;
    - asserted at `tests/routes/sessions/terminal-actions.test.ts:497-500`.
  - If that word is reused with `{0}`, the two throwers that pass no names draw an empty `{0}`. The brief neither names this word nor says whether to reuse it.
- F1.3 `src/lib/views/shared/forms/entry/card/NamedBy.svelte:33-36` (not in the write list). It draws a setting referrer's `label` inside `entry_form.referrer_setting` ("The setting {0}", `entry-form.yml:23`). `Entry.svelte:163-172` also calls `referrersOf`.
  - If item 3 changes the setting label inside `referrers.ts:119-123`, the entry page's "Named by" tag changes as well. That visible change is not named in the brief.
  - `projectLabel` (`referrers.ts:32-37`, the short name first, then the title) serves every registry. Item 3 says "the projects' titles", so a change there would also change the delete ask of pillars, domains, venues, datasets, funding and people.
- F1.4 `src/lib/ui/controls/confirm/Confirm.svelte:25-55` (not in the write list). Its props are message, detail, option, others, discard, confirm and cancel. It has no place for a select, so item 3 cannot be built inside `SubmitBox.svelte` alone. Either that shared primitive changes or the box becomes another dialog.
  - The select primitive exists at `src/lib/ui/forms/choice/Select.svelte`.
- F1.5 `src/lib/state/sources/fs-transport.ts:227-234` (not in the write list) holds `marksShape`. This is where item 8's mark is lost (F3.6). `guarded.md` G69 names `readRoots` in this file.
- F1.6 `src/lib/server/machine/pty/tmux.ts:96-100` says tmux's stderr "is what the terminal endpoint reports back to the page". That is false on the tree today and item 5 makes it true. The report should list it as rewritten or still true.
- No hit in `docs/` or `README.md` is made false: `docs/HELP.md:309`, `:546` and `docs/apps.md:421` stay true.

## 2. The step line

The step line is `plan.md:1727` (`grep -n '^- O169' .scratch/migration/plan.md`).

- "Start Agent on a task that exists starts it ..." maps to item 1.
- "a git fetch whose failure matches no row shows ssh's cause line ..." maps to item 2.
- "the Submit Job box draws its cluster pick as a pick" maps to item 3, first half.
- "the delete ask of a cluster entry names projects, never the bare key `slurm.resource`" maps to item 3, second half.
- "the compile database list reaches the cpp.yml Add and Edit ..." maps to item 4.
- "a new terminal whose tmux call fails says why ..." maps to item 5.
- "Live HPC's no-cluster line ..." maps to item 6.
- "the cluster's failure text is drawn once, in the error box" maps to item 7.
- "the Settings view offers the Repository scope ..." maps to item 8.

Every part has a requirement. Two items go beyond the line:

- F2.1 Item 3 asks for "the projects' titles". The line asks only that projects are named. Today they are already named, by short name first (`referrers.ts:32-37`, `:124`). Switching to titles is a change the line does not ask for (F1.3).
- F2.2 Item 7's second clause ("drawn only when the box is not") also hides the successful resolution line (`hpc.resolution`, "ssh connects to {0} as {1} ...", `Cluster.svelte:90-91`) whenever the poll fails for another cause, such as Slurm down. The line asks only that the failure text is not drawn twice.

## 3. Premises

Commands: `git show HEAD:.scratch/migration/plan.md | grep -n '^- O169\|^- Look flaws'`, plus `cat -n` or `sed -n` of every cited file and range.

- F3.1 The plan line numbers are off by one. The brief says `plan.md:1726` and `:3646`. On HEAD and on the working copy, O169 is at 1727 and "Look flaws" at 3647. Line 1726 is O168's "Step 0" bullet.
- F3.2 Premise 1. The entry id that reaches `hostOf` is already bare: `task-start.ts:55` passes `taskSeed({ ...ref, id: named.id }, ...)`.
  - Only the collection key mismatches. `readCollection` calls `collectionFile`, which finds `config.collections.find((one) => one.key === key)` (`src/lib/server/files/fs/collections.ts:46`, also `:100`). `folderOf` does the same (`task-seed.ts:134`).
  - So reading settles C1: the card sends `collection.id`, which `merge.ts:230` sets to `hubId(own, one.id)`.
  - The brief misses a second sender of the same reference, the focus ticker. Its `taskRef` (`src/lib/views/boards/focus/rows.ts:180-196`) sends the bare collection key (`ticker-lines.ts:34-38`; `focus.ts:565` uses `bareId`). Any fix must keep the ticker working.
  - Minor offsets: `hostOf` is at `:82-107` and the unknown answer at `:165-168`.
- F3.3 Premise 3. `source.yml:215-216` are `submit_not_slurm` and `submit_outside`. "(picked)" is `submit_picked` at `:219`, after `submit_pick` at `:218` (`grep -n 'submit_pick' config/text/views/sources/source.yml`).
  - The brief says every referrer is named by key and field. That holds only for the setting referrer: projects that name the resource in `compute` are already listed by `projectLabel` (`referrers.ts:124`).
- F3.4 Premise 5. `TmuxFailed` already carries tmux's text. `tmux.ts:121-126` rejects with stderr, and `routes.ts:153` wraps it with `new TmuxFailed(error.message)`. The text is dropped at `refusal.ts:62-64`.
  - `refusalFor` cannot tell a terminal that never started from one that ran and ended by asking the list, because neither is listed. It needs the action, which `routes.ts:516` does not pass.
  - The existing word `terminal-not-started` is not mentioned (F1.2).
- F3.5 Premise 6. `host_no_cluster` is also read at `connections.ts:201`.
  - Siblings with the same flaw are drawn in the same error box: `hpc.yml:49` `host_none`, `:52` `host_not_read`, `:53` `host_not_listed`, `:55` `host_unusable`. `Cluster.svelte:75` returns `hint` alone while there is no host.
- F3.6 Premise 8. Reading settles where the mark is lost. The server sends `marks` with `git` (`src/lib/server/files/fs.ts:415-424`, `folderMarks` at `make.ts:166`). The client's `marksShape` (`fs-transport.ts:227-234`) is `z.object({ hub, project, home })`, so zod strips `git`, and `reposOf` (`scope.ts:61-62`) sees none.
  - `make.ts`, `scope.ts` and `ScopeBar.svelte:55-70` are not where the mark is lost, and `fs-transport.ts` is not in the write list.
- F3.7 Premise 2. `gitsReason` is private (`parse.ts:747`, no export) and serves every git failure (`parse.ts:835`), so changing it would change every failure line.
  - `fetchFailureOf` receives the raw error stream (`state.ts:164-186`), so the join can be made there alone.
  - Today no test reaches `fetchFailureOf` (`git grep -n fetchFailureOf -- tests` prints nothing).
- These hold as stated: `merge.ts:228-230`; `hub-names.ts:46`; `behavior.yml:98`; `parse.ts:724-729`; `autofetch.ts:222-237`; `git-routes.ts:252-259`; `repositories.yml:89`; `status.ts:372-375`; `RepoItems.svelte:148-149`; `DeleteAsk.svelte:53-55`; `entry-form.yml:15`; `ChoiceRows.svelte:158` (at `src/lib/shell/keys/rows/approve/`); `cpp-form.ts:140-142`; `repo.ts:15-16`; `lsp.ts:499-510`; `terminal.yml:71`, `:73`; `terminal-words.ts:28-29`, `:62-63`; `hpc.yml:50`, `:109`, `:120`; `Hpc.svelte:59-60`; `Cluster.svelte:73-92`, `:130-146`, `:170`; `ScopeBar.svelte:61-66`; `scope.ts:73-79`; `Settings.svelte:147-151`.
- No `docs/adr` (`ls docs/adr`: "No such file or directory").
- The only overlaps with O167's write list are `ScopeBar.svelte` (the ranges are disjoint) and nothing else. O151 shares no path, and neither brief writes the files of F1.1 to F1.5 (per-path `grep -c` over `O151.md` and `O167.md`, all 0).

## 4. Cases and checks

- F4.1 Brief line 47 conflicts with `spec.md:60`. That rule allows a test only as the test of an entry of `agents/guarded.md`; a step that needs a new entry stops and asks Axel. `guarded.md:3` says "Views have no entry". Entries found by an `awk` map of `guarded.md` with `grep -F` per module:
  - C1 (`task-seed.ts`, `task-start.ts`): only G38, which covers seed approval, not finding a task.
  - C2 (`fetchFailureOf`, `gitsReason`): no entry. G41 covers `classifyFailure` and `failureLine` only.
  - C3: `referrers.ts` is in G32's code list. The box is a view, so it has no entry.
  - C4: `cpp-form.ts` has no entry. G8 covers the server's `cpp-write.ts` and the route.
  - C5: `refusalFor` and `refusal.ts` have no entry.
  - C7: `Cluster.svelte` is a view, so it has no entry.
  - C8: `scopeOfKind` is under G96. `folderMarks` and `marksShape` have no entry.
  - The brief neither maps the cases to entries nor tells the builder to stop for new ones.
- F4.2 C3 "a test ... of the box" and its "Submit submits to the chosen one" need a press. `spec.md:65` and `:67` route a behaviour that needs a DOM to the look on landing. C7's markup test is a view test with no entry.
- F4.3 C2 asks for a test of `gitsReason`. The function is private, so testing it requires an export with no caller outside tests (`spec.md:89`).
- F4.4 C5 accepts either of two results ("'The terminal has ended.' or today's `terminal-failed`"). A case with two acceptable results does not fix the expected result.
- F4.5 C8 checks `make.ts` and `scopeOfKind`, but the mark is lost in `fs-transport.ts` (F3.6), which the brief does not let the step change.
- F4.6 Verify item 2 uses the `grep '[^ -~]'` form. `spec.md:103` replaces it with the perl ASCII gate. The brief also omits `npm run diagrams` before the list and the `utils/unused-exports.sh` base comparison. `spec.md` governs on all three.

## 5. The question (could each check pass without the goal being reached?)

- F5.1 C1: yes, if the test builds `{ collection: 'lab:tasks' }` by hand, or if the fixture's primary hub has the empty name, where `hubId` returns the bare key. It must take the reference from `taskCardActions` over a merged collection and use a named hub. It also needs a ticker reference (bare collection) to keep starting.
- F5.2 C2: no for `fetchFailureOf` as specified. However, a test only of `gitsReason` could pass while the status bar's line is unchanged, because the line is built in `fetchFailureOf`.
- F5.3 C3 referrers: no. The box: a string render cannot show a select being changed, so the rule routes it to the look.
- F5.4 C4: yes, if the test hands `readCppFile` an absolute path. The conversion happens in its caller, `CppRows.svelte`, which is a component. The brief should place the conversion in `cpp-form.ts`, where a test reaches it, and use the root's expanded path (F6.4).
- F5.5 C5: a `refusalFor` test with a hand-made `TmuxFailed('socket path too long')` passes without proving a start reaches it with the action needed (F3.4).
- F5.6 C6: no.
- F5.7 C7: yes, if the test renders with `resolution` undefined.
- F5.8 C8: yes. `scopeOfKind` with a hand-built `marks: { git: true }` and `folderMarks` both pass on the unchanged tree. Only a test through `workspacesAnswer` and its `folderShape` would fail.
- Items: items 1 to 7 cannot pass as worded once built. Item 8's "(the folders the Repositories view lists)" differs from "workspace folders": the view lists repositories nested within `repository_scan_depth` (`src/lib/server/files/roots.ts:40-50`). Those cannot be scope roots.

## 6. Implied inputs

- F6.1 Item 1, a reference from the focus ticker (bare collection, hub-prefixed id). Expected: it still starts, and `sameTask` (`opening.svelte.ts:235`) treats a card reference and a ticker reference for one task as the same task.
- F6.2 Item 2:
  - A fetch ended by its time limit whose stream holds an ssh line, where `reason` is the catalog sentence. Expected: unstated.
  - Two `ssh: ` lines. Expected: which one is shown is unstated.
  - The width used to cut the lines is unnamed.
- F6.3 Item 3:
  - The box opening with no cluster picked (`submit-job.svelte.ts:5-6`). Expected: the select shows no choice and Submit stays off.
  - One cluster only.
  - A picked cluster whose plan is refused (`box.off`).
- F6.4 Item 4, a workspace folder written with `~`. `FsRoot.dir` keeps it (the server applies `expandHome(one.dir)` at `roots.ts:31-32` and `uris.ts:76`), so `dir` sent as is again answers "repo must be an absolute path". Expected: the expanded or real path is sent. A missing folder has `real: ''`; expected: a refusal sentence.
- F6.5 Item 5, a tmux call that timed out or wrote nothing (`TmuxSilence`, `tmux.ts:119-126`). Its message is execFile's "Command failed: tmux ..." with the full argument list, which includes the `-e` pairs from `options.credentials.env()` (`sessions.ts:557`, `:654`). Taking its first line would show credentials on the page. Expected: the catalog words of `silenceWords` (`tmux.ts:76-82`).
  - Further unstated inputs:
    - the actions that count as a new terminal (start, task, compose, chat, command, latex, resume);
    - tmux text ending in a full stop, which gives "..";
    - a resize or rename of an unlisted id, which must keep `terminal-ended` (`terminal-actions.test.ts:487-495`).
- F6.6 Item 7, a poll that fails while `ssh -G` succeeded. Expected: unstated (F2.2).
- F6.7 Item 8, a repository nested in a workspace folder, which the Repositories view lists. Expected: not offered as a scope, but the brief's parenthetical implies it is.
- Checked: cluster cases and the desktop app add nothing beyond these.

## 7. ADRs

`docs/adr` does not exist (`ls docs/adr`: "No such file or directory"), so the step touches no ADR.

## 8. Dictated text

`grep -n 'did not start: {0}\|The settings of this hub name no cluster\|joined by " "' .scratch/migration/agents/briefs/O169.md` finds lines 26, 29, 30 and 86.

- Line 30, "The settings of this hub name no cluster (slurm.resource in .oculus/config.yml).": holds.
- Lines 29 and 86, "The terminal did not start: {0}.": the words hold, but there are three problems.
  - The words duplicate `refused_terminal_not_started` (`terminal.yml:75`) and the word's name is not given. `spec.md:18` treats a vocabulary value as a user-visible shape to be named.
  - It gives ".." for tmux text that ends in a full stop.
  - `spec.md:51` ("An error from the engine ... is mapped to a catalog line before it is shown") is met only in that the text sits inside a catalog line. `refusal.ts:1-2` ("never the text of an engine") becomes false and must be rewritten.
- Line 26, the join by " ". Breaks the Conventions sentence rule (brief line 101, a full stop for a sentence). Because `shortReason` drops `fatal: ` and ssh's line has no full stop, the tip reads "The last fetch failed: ssh: Could not resolve hostname git.example: nodename nor servname provided, or not known Could not read from remote repository.", two clauses run together with no boundary.

## Declined to judge

- Whether the worktree path, base copy and port, which this brief does not name (`spec.md:32-33` expects them), are added by the dispatch prompt.
- Whether `resolution.error` and the poll's ssh hint are always the same text (item 7's "same cause"). Settling it needs a run against a cluster, which this check may not make.

Agent usage: a606a2ddc903c57e5, claude-opus-5-5, 219750 tokens, 87 tool uses, 10.5 min.

## Closed

Every finding is closed by a change to the brief; none needs a ruling.

- F1.1, F3.4: `routes.ts` added to the write list; item 5 passes the action from `routes.ts:516` and makes the comment at `:139-141` true.
- F1.2: item 5 reuses the existing word `terminal-not-started` with a name and a new catalogue line beside `refused_terminal_not_started`; the throwers with no names keep the plain line; `model-machine.ts` needs no change (Decision 3).
- F1.3, F2.1, F3.3: item 3 changes only the setting referrer's label and keeps `projectLabel`; `NamedBy.svelte` added to the write list and the "Named by" change named; `DeleteAsk.svelte` left the write list.
- F1.4: item 3 gives `Confirm.svelte` an optional select; added to the write list (Decision 2).
- F1.5, F3.6, F4.5, F5.8: item 8 fixes `marksShape` in `fs-transport.ts` (added); `make.ts` and `scope.ts` left the write list.
- F1.6: `tmux.ts` added; item 5 makes its comment true.
- F2.2, F6.6: item 7 drops the grey line only when the resolution failed and the box is drawn; a resolution that succeeded keeps its line.
- F3.1: line numbers corrected (1727, 3647).
- F3.2, F5.1, F6.1: item 1 has the server find the collection by its bare key from either form and `sameTask` treat both references as one task; `opening.svelte.ts` added; `task-card.ts` left the write list; C1 covers the ticker.
- F3.5: item 6 covers `hpc.yml:49-55`, the four siblings included.
- F3.7, F4.3, F5.2: item 2 makes the join in `fetchFailureOf` only; `parse.ts` left the write list.
- F4.1, F4.2: no case falls under an entry's code; every case is checked by reading, a case-run program or the look; no test is written and no entry is needed.
- F4.4: C5 fixes one expected result per input.
- F4.6: verify 1 runs `npm run diagrams`, verify 2 is the perl gate, verify 4 compares `unused-exports.sh` with the base copy; the worktree and the base copy are named.
- F5.4, F6.4: item 4 places the conversion in `cpp-form.ts`, uses the expanded path, and says a missing folder with a new catalogue line in `config/text/app.yml` (added; Decision 5).
- F5.5: C5 checks `refusalFor` with the action, through a case-run program.
- F5.7: C7 is checked by reading and the look for both states.
- F6.2: item 2 takes the last `ssh: ` line, cut as `shortReason` cuts; a timeout's catalogue sentence is git's line and the ssh line, when present, comes first.
- F6.3: item 3 states no cluster picked, one cluster and a refused plan.
- F6.5: item 5 gives `silenceWords` for a `TmuxSilence`, so execFile's command line and its credential pairs never reach the page; the actions that start a terminal are listed; tmux's full stop is dropped before one is added; a resize or rename keeps `terminal-ended`.
- F6.7: item 8 and C8 say a nested repository is no scope root.
- Dictated text: "The terminal did not start: {0}." is a catalogue line beside the existing word, with the ".." case closed and the engine-text reading stated (Decision 3); the join by " " is replaced by two sentences; "The settings of this hub name no cluster (slurm.resource in .oculus/config.yml)." holds; the new line "The folder of {0} does not exist." holds the rules file's prose rule (`grep -n 'does not exist' briefs/O169.md`).
