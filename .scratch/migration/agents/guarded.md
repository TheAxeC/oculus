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
