# What the tests guard

One entry per guarantee. An entry keeps one test per unit it covers: each API route, write kind, config reader, parser, client store or other file its text and its Code line name, written as a table where a unit has several outcomes. A test exists only as the test of one entry, named under it by file and title, or by file and describe where one table covers several units. A new entry needs Axel's yes. Views have no entry: the look on TEST covers them.

## Never happens

- G1. A route that writes, runs or opens something refuses a request without the page's token.
  Code: `src/routes/api/` write, ops, open, git, deposit, terminal, commands, hpc, mail, calendar.
  Test: write: `tests/server/core/auth.test.ts`, 'refuses a write that carries no token'; the token guard behind mail, calendar, connect, usage and hpc: same file, 'refuses an empty process token, a missing one and a wrong one, in the route shape'; ops: `tests/server/files/ops.test.ts`, 'refuses a request without the token, and one that is no operation (case 25)'; terminal: `tests/server/machine/pty/channel.test.ts`, 'refuses input from a socket that carried no token'; mail: `tests/server/accounts/mail/routes.test.ts`, 'refuses a request with no write token'; calendar: `tests/server/accounts/connect/oauth.test.ts`, 'refuses a request with no write token'; folder picker: `tests/server/files/picker.test.ts`, 'refuses a request without the token with a 403, before it runs anything'; usage refresh: `tests/server/machine/usage/refresh.test.ts`, 'refreshes exactly the requested account behind the write token'; connect setup: `tests/server/accounts/connect/accounts.test.ts`, 'saves a half behind the token, reads every account again, and answers no field of it'.
- G2. A path outside the configured roots is refused.
  Code: `src/routes/api/` fs, ops, open, source, search, history, project-files, file/[root].
  Test: fs: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; search: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'.
- G3. The content of `config/local.yml` is never served, read into a page or written.
  Code: the server modules that name it (`grep -rl local.yml src/lib/server`).
  Test: paste and upload: `tests/server/files/ops-paste.test.ts`, 'refuses every change to the file and to the folders holding it (case 24)'; untracked trash: `tests/server/git/untracked/trash.test.ts`, 'refuses a local.yml beside an engine root, which the Files view never touches'; config-value writer: `tests/server/edit/config-value.test.ts`, 'refuses local.yml before any file is read'; config-key writer: `tests/server/edit/config-key.test.ts`, 'refuses the machine's own file without reading it'.
- G4. A provider callback with a wrong `state` is refused.
  Code: `src/routes/api/` calendar/callback, mail/callback.
  Test: mail callback: `tests/server/accounts/mail/routes.test.ts`, 'writes nothing for a state this process never minted'; calendar callback: `tests/server/accounts/connect/oauth.test.ts`, 'answers 400 and writes nothing for a state this process did not mint'.
- G5. Hub or feed text reaches HTML only through the sanitiser.
  Code: `src/lib/ui/html.ts`.
  Test: `tests/ui/html.test.ts`, 'is the sanitiser over the inline renderer, so no field reaches a card around it'.
- G6. A git action that can lose work or move a branch needs `confirm: true`. Each action of the `CONFIRMED` lists is a unit.
  Code: `CONFIRMED` in `src/lib/server/git/git-routes.ts` and `deposit-routes.ts`.
  Test: none named yet.
- G7. A value that reaches a command is passed as an argument, never put into a shell string.
  Code: `src/routes/api/` commands, hpc, open.
  Test: commands: `tests/server/machine/commands/placeholders.test.ts`, 'creates nothing, for each line, each selection and each shell'; hpc: `tests/server/machine/hpc/actions.test.ts`, 'accepts only the decided id shape and safe absolute paths'; open: `tests/server/files/open-bin.test.ts`, 'refuses anything but an https address, and runs no program for it'.

## Your work is not lost or misplaced

- G8. Each write kind changes only the file and key it names; the rest of that file stays byte-identical. A write whose base the file no longer holds is refused with the sentence that the file changed since it was read.
  Code: `src/lib/server/edit/writes.ts` and `writes/`, `src/lib/server/edit/writes/config/config-value.ts`.
  Test: `tests/server/edit/writes.test.ts`, 'writes the changed field and nothing else', 'ticks and reopens a line of a manifest', 'sets a status of the vocabulary and refuses one outside it', 'appends a new entry rendered from the file schema', 'scaffolds an idea folder with a manifest and a README'; `tests/server/edit/writes-collection.test.ts`, 'sets a field of the entry the id names', 'writes the entries in the order the identity values name', 'takes one entry out of its file, by the id the reader gave it'; `tests/server/edit/feeds.test.ts`, 'adds a dated LinkedIn idea with a safe slug and numbered collision suffix', 'promotes an idea past 01-A and moves its same-basename sidecar', 'adds a lead in schema order with date and status defaults', 'uses each feed identity and allows only its field', 'deletes leads and refuses deletion from the other feeds'; `tests/server/sessions/overrides.test.ts`, 'keeps the keys it was not given, and the entries of other sessions'; `tests/server/edit/deck-edit.test.ts`, 'replaces a list in place and keeps every comment around it'; `tests/server/edit/config-key.test.ts`, 'replaces the value and keeps every other byte, the comment on its line included'; `tests/server/edit/config-value.test.ts`, 'adds one item, removes one and swaps two, and keeps every other line', 'refuses a base the file no longer holds, with the sentence that it changed since it was read'.
- G9. Each write is logged, and its undo puts the file back. A file save keeps a copy of the text it replaces in the file history, and writes through a temporary file and an atomic rename, so a save cut short leaves the old file whole.
  Code: `src/lib/server/core/changes.ts`, `src/lib/server/edit/writes/file-undo.ts`, `src/routes/api/(files)/source`, `src/lib/server/files/fs/history.ts`.
  Test: `tests/server/core/changes.test.ts`, 'records one manifest field with the value it had and the value written', 'records a collection entry field, a new entry, a reorder and a deletion', 'records a subtask ticked, a subtask added and a subtask taken out', 'records a career host, a session override and a feed field', 'records the deck's two lists as the file held them and as it holds them now', 'records a scaffolded idea with no way back'; `tests/server/edit/yaml/yaml-edit-removed.test.ts`, 'gives back every shape a clear takes text out in'; `tests/server/core/json.test.ts`, 'is left as it was, the old content with it, by a write under a file'.
- G10. A file operation does what it names: Move to Trash sends the item to the Trash, and Delete for good first keeps a copy of a file up to 5 MB in the file history. A paste or a move with Replace sends the replaced item to the Trash first, and moves nothing when the Trash fails.
  Code: `src/routes/api/(files)/ops`, `src/lib/server/files/fs/ops.ts`, `src/lib/server/files/fs/file-changes.ts`.
  Test: `tests/server/files/ops.test.ts`, 'trashes each item once, in order, by its absolute path and with `glob: false` (case 11)'; `tests/server/files/ops-paste.test.ts`, 'refuses a move onto a taken name, and with replace sends the old item to the trash first (case 16)', 'moves nothing when the trash fails on a replace (case 16)', 'refuses a replace over a folder, and sends a replaced file to the trash first (case 22)', 'answers trash_failed for a replace the trash could not take, and writes nothing'.

- G28. An unsaved edit survives a tab switch and a reload, and closing a tab, pane or page that holds one asks first: in a form, the manifest editor, the file editor and the review comment box. Closing a Terminal tab whose terminals run asks first, and a move, a split or a reload stops none of them. A page that detaches stops the delivery and leaves the tmux session running.
  Code: `src/lib/state/forms/`, `src/lib/state/sessions/source.svelte.ts`, `src/lib/state/sources/repositories/review-comment.ts`, `src/lib/shell/panes/strip/close-question.svelte.ts`, `src/lib/state/client/context.ts`, `src/lib/state/sessions/terminal/terminal-tabs.ts`, `src/lib/server/machine/pty/channel.ts`.
  Test: close question, unsaved text: `tests/shell/panes/strip/tab-menu.test.ts`, 'asks before Close Others closes a tab holding unsaved text, naming it, and No closes nothing'; close question, a running terminal: same file, 'asks about the terminal running a program among the tabs an item closes'.; form: `tests/state/forms/form-drafts.test.ts`, 'keeps a typed value and reads it back by instance and form', 'reads the drafts back out of the storage the ui store saved them to', 'registers the client own drafts with the close guard'; manifest editor: `tests/state/forms/manifest-draft.test.ts`, 'keeps an edit per instance and reports it unsaved while it differs', 'reads the edits back out of the storage the ui store saved them to', 'registers the client's own manifest draft with the close guard'; file editor: `tests/state/sessions/source.test.ts`, 'keeps the typed text when it is opened again', 'is unsaved once the reader types, which is what closing it asks about'; review comment box: `tests/state/sources/repositories/diff/comment-draft.client.test.ts`, 'closes keeping the text, and drops the text on Cancel'; close question for a tab, a pane, a page and a running terminal: `tests/state/workbench/navigation/pages.test.ts`, 'keeps the unsaved question for one tab holding unsaved text', 'asks one question over a pane with unsaved text and a busy terminal, the text first', 'lists every instance of every pane of a page, in the tree's own order', 'asks the busy question over one tab, naming the terminal and its program'; terminals: `tests/state/client/terminal/terminal-close.test.ts`, 'names a terminal running a program, and not an idle shell', 'ends no terminal when it moves to another pane, to another page, or is split', 'ends no terminal when the layout is loaded again'.; page detach: `tests/server/machine/pty/channel.test.ts`, 'stops the delivery and leaves the tmux session alone'.
- G33. Each git action does to the repository only what it names: stage changes only the paths named, discard reverts only the files named, a branch action moves only the branch named, a stash drop removes only the stash named.
  Code: `ACTIONS` in `src/lib/server/git/git-routes.ts` (each action but `suggest` is a unit), `git-write.ts`, `git-refs.ts`, `git-index.ts`, `git-remote.ts`.
  Test: `tests/server/git/git-write.test.ts`: stage and unstage 'stages a path, takes it back out, and leaves the worktree alone', discard 'discards a tracked change', commit 'commits a multi-line message holding quotes and backticks', push 'pushes to the upstream once there is one', createBranch 'creates one and checks it out', switchBranch 'switches to another branch', createWorktree 'makes one under the repository worktrees folder, on a branch of its name', merge 'leaves a conflicted merge in progress and names what conflicted', removeWorktree 'removes a worktree that is clean, and its branch with it'; `tests/server/git/git-ops.test.ts`: stagePatch and unstagePatch 'stages one hunk of two, and unstages it again', revertPatch 'reverts one hunk in the worktree and leaves the other', stageAll, unstageAll and discardAll 'stages every tracked change, every untracked path, unstages all and discards all', pull 'pulls the repository's own way, rebasing where the repository says so', fetch 'fetches the remote branches and takes away the ones the remote dropped', sync 'syncs: pulls, then pushes what the branch holds', publish 'publishes a branch to a remote of its own, and refuses one that has an upstream', abortMerge 'aborts a merge, and a rebase, and says when neither is in progress', continueRebase 'carries a rebase on once its conflict is resolved, and not before', resolve 'writes the result over a conflicted path and stages it, and commits the merge', markResolved 'marks each deletion conflict resolved, leaving no unmerged entry, and keeps a held file', acceptDeletion 'takes the deletion of a DD, a DU and a UD path: gone from the index and the worktree', stash 'stashes the tracked changes, every change, or what is staged, each with its message', stashApply, stashPop and stashDrop 'applies, pops and drops a stash by its name', createTag and deleteTag 'makes a plain tag and an annotated one at HEAD, and deletes one', pushTags 'pushes every tag to the remote'; trashUntracked `tests/server/git/untracked/trash.test.ts`, 'moves an untracked file to the Trash by its real path'; ignore `tests/server/git/untracked/ignore.test.ts`, 'appends a path relative to the root, made when the file is missing'; cherryPick `tests/server/git/refs/cherry-pick.test.ts`, 'makes a new commit on the checked-out branch with the commit message'; checkoutDetached `tests/server/git/refs/detached.test.ts`, 'detaches HEAD at a hash on a clean tree'; deleteBranch and deleteBranchAnyway `tests/server/git/refs/delete-branch.test.ts`, 'deletes a branch that is merged', 'deletes a branch git calls not fully merged on Delete Anyway'.
- G34. An HPC action touches only the job it names: cancel cancels only that job id, log reads only that job's log, and an id or a path that fails `validId` or `safePath` never reaches the remote command.
  Code: `cancel` and `log` in `src/lib/server/machine/hpc/actions.ts`, `src/lib/server/machine/hpc/routes.ts`.
  Test: `tests/server/machine/hpc/actions.test.ts`: cancel 'refuses a bad cancel without calling the runner'; log 'feeds the remembered path to the remote script on the first press'.
- G35. A terminal operation acts only on the terminal it names, and ends only what it says it ends.
  Code: the operations of `src/lib/server/machine/pty/routes.ts` that start or end a process or send it input, each a unit: start, recover, task, latex, command, rerun, restart, chat, compose, steer, interrupt, fork, stop, clear, resume; `tmux.ts`, `sessions.ts`, `channel.ts`.
  Test: `tests/server/machine/pty/sessions.test.ts`: start 'refuses a cwd that is not an absolute existing directory', stop 'starts, lists, feeds, resizes, captures and stops a terminal', steer and interrupt 'steers with the text as bytes, then Enter, and interrupts with Escape', resume 'starts a resumed terminal in the session directory, with the resume as its command'; compose `tests/server/machine/pty/compose.test.ts`, 'runs the agent with its picks, `--` and the prompt as one last word'; `tests/server/machine/commands/run.test.ts`: command 'is one terminal named after the command, running the whole chain', rerun 'respawns the same line in the same terminal after it ended', restart 'respawns the line once the confirmation was given'; `tmux.ts`: `tests/server/machine/pty/tmux.test.ts`, 'keeps two panes apart while their output interleaves'.
- G29. A saved layout of an earlier version is read into the current one with every page and tab kept.
  Code: `src/lib/state/workbench/layout/saved/`.
  Test: `tests/state/workbench/layout/saved/layout-saved.test.ts`, 'migrates every page, and reads which one was current'.
- G30. A deposit commit is refused while the secret scan finds a secret in it.
  Code: `src/lib/server/git/deposit.ts`.
  Test: `tests/server/git/deposit.test.ts`, 'finds a secret and refuses the commit while it stands'.
- G31. A record file that does not read is never overwritten by the next save; the save is refused with the reason. The saved commands and the approvals files do this; the workspaces file, the session overrides file and the saved layout are brought to it by step Q117.
  Code: `src/lib/server/machine/commands/saved.ts`, `src/lib/server/machine/approvals/approvals.ts`, `src/lib/server/files/fs.ts`, `src/lib/server/sessions/overrides.ts`, `src/lib/state/workbench/layout/saved/`.
  Test: approvals: `tests/server/machine/approvals/approvals.test.ts`, 'reads a file that is not JSON as empty and refuses a write over it, leaving it'.

## It starts, and configuration is checked

- G11. The server starts on a clean checkout with the shipped configuration.
  Code: `src/hooks.server.ts`.
  Test: `tests/server/root/hooks-server.test.ts`, 'reads it once for a page, whose title and load function share the read'.
- G12. Every shipped config file and catalog reads with no finding.
  Code: `config/`, `config/catalogs/`.
  Test: rail list of `layout.yml`: `tests/state/workbench/navigation/rail.test.ts`, 'finds nothing wrong with the shipped rail list'.
- G13. A wrong config value is refused with a finding that names the key, and its default is used.
  Code: the config readers under `src/lib/data/sources/config/`.
  Test: none named yet.
- G14. The real hub builds with no findings, read only.
  Code: `src/lib/data/index.ts`.
  Test: none named yet.
- G15. A manifest with a broken field still shows its project, with a finding.
  Code: `src/lib/data/snapshot/`.
  Test: none named yet.
- G32. What the hub shows is what its files say: each parser of the hub's files reads a well-formed file into the values the file holds (manifests, registries, collections, career, feeds, docs, present, the snapshot built from them).
  Code: `src/lib/data/sources/`, `src/lib/data/snapshot/`, `src/lib/data/model/`.
  Test: none named yet.

## The repository's rules, checked by a machine

Each entry is one tree check under `tests/checks/`, kept because a rule in `agents/spec.md` or `DESIGN.md` asks for it.

- G16. The import graph keeps the layer boundaries of DESIGN.md. Test: `tests/checks/tree/boundaries.test.ts`.
- G17. Inside a layer, a module imports only its own folder or a folder below. Test: `tests/checks/imports/order.test.ts`.
- G18. No module imports itself through a chain at run time. Test: `tests/checks/imports/cycles.test.ts`.
- G19. No module under `src` augments a module of the tree. Test: `tests/checks/imports/augments.test.ts`.
- G20. A source file stays within the size line, 880 lines and 520 for a component. Test: `tests/checks/tree/size.test.ts`.
- G21. A rule, a parser or a fold is written once. Test: `tests/checks/tree/duplication.test.ts`.
- G22. A comment carries no history. Test: `tests/checks/source/history.test.ts`.
- G23. Every comment line ends by the hundredth column. Test: `tests/checks/source/comment-width.test.ts`.
- G24. Every catalog key has a reader and every reader names a key. Test: `tests/checks/source/keys.test.ts`.
- G25. The committed diagrams match the source they are drawn from. Test: `tests/checks/diagrams/diagrams.test.ts`.
- G26. Every text-on-background pair the tokens declare is readable under every theme. Test: `tests/checks/look/contrast.test.ts`.
- G27. The Claude status-line script keeps its input and prints the usage line. Test: `tests/checks/utils/claude-usage.test.ts`.

Held under the entries above: `tests/checks/config/integrity.test.ts` (G14), `tests/checks/config/config-folder.test.ts` and `tests/checks/config/config.test.ts` (G12, G13), `tests/checks/source/html-sites.test.ts` (G5).
