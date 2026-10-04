# What the tests guard

One entry per guarantee. An entry keeps one test per unit it covers: each API route, write kind, config reader, parser, client store or other file its text and its Code line name, written as a table where a unit has several outcomes. A test exists only as the test of one entry, named under it by file and title, or by file and describe where one table covers several units. A new entry needs Axel's yes. Views have no entry: the look on TEST covers them.

## Never happens

- G1. A route that writes, runs or opens something refuses a request without the page's token.
  Code: `src/routes/api/` write, ops, open, git, deposit, terminal, commands, hpc, mail, calendar.
  Test: none named yet.
- G2. A path outside the configured roots is refused.
  Code: `src/routes/api/` fs, ops, open, source, search, history, project-files, file/[root].
  Test: none named yet.
- G3. The content of `config/local.yml` is never served, read into a page or written.
  Code: the server modules that name it (`grep -rl local.yml src/lib/server`).
  Test: none named yet.
- G4. A provider callback with a wrong `state` is refused.
  Code: `src/routes/api/` calendar/callback, mail/callback.
  Test: none named yet.
- G5. Hub or feed text reaches HTML only through the sanitiser.
  Code: `src/lib/ui/html.ts`.
  Test: `tests/ui/html.test.ts`, 'is the sanitiser over the inline renderer, so no field reaches a card around it'.
- G6. A git action that can lose work or move a branch needs `confirm: true`. Each action of the `CONFIRMED` lists is a unit.
  Code: `CONFIRMED` in `src/lib/server/git/git-routes.ts` and `deposit-routes.ts`.
  Test: none named yet.
- G7. A value that reaches a command is passed as an argument, never put into a shell string.
  Code: `src/routes/api/` commands, hpc, open.
  Test: none named yet.

## Your work is not lost or misplaced

- G8. Each write kind changes only the file and key it names; the rest of that file stays byte-identical. A write whose base the file no longer holds is refused with the sentence that the file changed since it was read.
  Code: `src/lib/server/edit/writes.ts` and `writes/`, `src/lib/server/edit/writes/config/config-value.ts`.
  Test: none named yet.
- G9. Each write is logged, and its undo puts the file back. A file save keeps a copy of the text it replaces in the file history, and writes through a temporary file and an atomic rename, so a save cut short leaves the old file whole.
  Code: `src/lib/server/core/changes.ts`, `src/lib/server/edit/writes/file-undo.ts`, `src/routes/api/(files)/source`, `src/lib/server/files/fs/history.ts`.
  Test: none named yet.
- G10. A file operation does what it names: Move to Trash sends the item to the Trash, and Delete for good first keeps a copy of a file up to 5 MB in the file history. A paste or a move with Replace sends the replaced item to the Trash first, and moves nothing when the Trash fails.
  Code: `src/routes/api/(files)/ops`, `src/lib/server/files/fs/ops.ts`, `src/lib/server/files/fs/file-changes.ts`.
  Test: none named yet.

- G28. An unsaved edit survives a tab switch and a reload, and closing a tab, pane or page that holds one asks first: in a form, the manifest editor, the file editor and the review comment box. Closing a Terminal tab whose terminals run asks first, and a move, a split or a reload stops none of them. A page that detaches stops the delivery and leaves the tmux session running.
  Code: `src/lib/state/forms/`, `src/lib/state/sessions/source.svelte.ts`, `src/lib/state/sources/repositories/review-comment.ts`, `src/lib/shell/panes/strip/close-question.svelte.ts`, `src/lib/state/client/context.ts`, `src/lib/state/sessions/terminal/terminal-tabs.ts`, `src/lib/server/machine/pty/channel.ts`.
  Test: close question, unsaved text: `tests/shell/panes/strip/tab-menu.test.ts`, 'asks before Close Others closes a tab holding unsaved text, naming it, and No closes nothing'; close question, a running terminal: same file, 'asks about the terminal running a program among the tabs an item closes'.
- G33. Each git action does to the repository only what it names: stage changes only the paths named, discard reverts only the files named, a branch action moves only the branch named, a stash drop removes only the stash named.
  Code: `ACTIONS` in `src/lib/server/git/git-routes.ts` (each action but `suggest` is a unit), `git-write.ts`, `git-refs.ts`, `git-index.ts`, `git-remote.ts`.
  Test: none named yet.
- G34. An HPC action touches only the job it names: cancel cancels only that job id, log reads only that job's log, and an id or a path that fails `validId` or `safePath` never reaches the remote command.
  Code: `cancel` and `log` in `src/lib/server/machine/hpc/actions.ts`, `src/lib/server/machine/hpc/routes.ts`.
  Test: none named yet.
- G35. A terminal operation acts only on the terminal it names, and ends only what it says it ends.
  Code: the operations of `src/lib/server/machine/pty/routes.ts` that start or end a process or send it input, each a unit: start, recover, task, latex, command, rerun, restart, chat, compose, steer, interrupt, fork, stop, clear, resume; `tmux.ts`, `sessions.ts`, `channel.ts`.
  Test: none named yet.
- G29. A saved layout of an earlier version is read into the current one with every page and tab kept.
  Code: `src/lib/state/workbench/layout/saved/`.
  Test: none named yet.
- G30. A deposit commit is refused while the secret scan finds a secret in it.
  Code: `src/lib/server/git/deposit.ts`.
  Test: none named yet.
- G31. A record file that does not read is never overwritten by the next save; the save is refused with the reason. The saved commands and the approvals files do this; the workspaces file, the session overrides file and the saved layout are brought to it by step Q117.
  Code: `src/lib/server/machine/commands/saved.ts`, `src/lib/server/machine/approvals/approvals.ts`, `src/lib/server/files/fs.ts`, `src/lib/server/sessions/overrides.ts`, `src/lib/state/workbench/layout/saved/`.
  Test: none named yet; Q117 writes the tests of the three it changes.

## It starts, and configuration is checked

- G11. The server starts on a clean checkout with the shipped configuration.
  Code: `src/hooks.server.ts`.
  Test: none named yet.
- G12. Every shipped config file and catalog reads with no finding.
  Code: `config/`, `config/catalogs/`.
  Test: none named yet.
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
