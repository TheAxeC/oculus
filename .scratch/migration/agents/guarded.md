# What the tests guard

One entry per guarantee. A test exists only as the test of one entry, named under it by file and title. A new entry needs Axel's yes. Views have no entry: the look on TEST covers them.

## Never happens

- G1. A route that writes, runs or opens something refuses a request without the page's token.
  Code: `src/routes/api/` write, ops, open, git, deposit, terminal, commands, hpc, mail, calendar.
  Test: none named yet.
- G2. A path outside the configured roots is refused.
  Code: `src/routes/api/` fs, ops, open, source, search, history, project-files, file/[root].
  Test: none named yet.
- G3. `config/local.yml` is never served, read into a page or written.
  Code: the server modules that name it (`grep -rl local.yml src/lib/server`).
  Test: none named yet.
- G4. A provider callback with a wrong `state` is refused.
  Code: `src/routes/api/` calendar/callback, mail/callback.
  Test: none named yet.
- G5. Hub or feed text reaches HTML only through the sanitiser.
  Code: `src/lib/ui/html.ts`.
  Test: none named yet.
- G6. A git action that can lose work or move a branch needs `confirm: true`.
  Code: `CONFIRMED` in `src/lib/server/git/git-routes.ts` and `deposit-routes.ts`.
  Test: none named yet.
- G7. A value that reaches a command is passed as an argument, never put into a shell string.
  Code: `src/routes/api/` commands, hpc, open.
  Test: none named yet.

## Your work is not lost or misplaced

- G8. Each write kind changes only the file and key it names; the rest of that file stays byte-identical.
  Code: `src/lib/server/edit/writes.ts` and `writes/`.
  Test: none named yet.
- G9. Each write is logged, and its undo puts the file back.
  Code: `src/lib/server/core/changes.ts`, `src/lib/server/edit/writes/file-undo.ts`.
  Test: none named yet.
- G10. A file operation does what it names, and a delete goes to the Trash, never a permanent delete.
  Code: `src/routes/api/(files)/ops`.
  Test: none named yet.

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
