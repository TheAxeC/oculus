Everything in the brief is done. Nothing was run (no test, verify list, build or npm command) and no git command was used for the sweep; the checks below are file listings, greps and line counts.

## 1. Entries G1 to G27

The G10 wording is the reworded one from the coordinator's ruling (Move to Trash, and Delete for good with a kept copy).

- G1: `tests/server/files/picker.test.ts`, "refuses a request without the token with a 403, before it runs anything".
- G2: `tests/server/files/ops.test.ts`, "refuses a path that climbs out, a root not served and an empty root key (case 5)".
- G3: `tests/server/edit/config-value.test.ts`, "refuses local.yml before any file is read".
- G4: `tests/server/accounts/connect/oauth.test.ts`, "answers 400 and writes nothing for a state this process did not mint".
- G5: none in my folders.
- G6: none in my folders (the refusals without `confirm` are in `tests/routes/git/`).
- G7: `tests/server/machine/commands/placeholders.test.ts`, "creates nothing, for each line, each selection and each shell" (slow-tagged).
- G8: `tests/server/edit/writes.test.ts`, "writes the changed field and nothing else".
- G9: `tests/server/core/changes.test.ts`, "records one manifest field with the value it had and the value written" (the logged half; the undo half has no test in my folders).
- G10, Move to Trash: `tests/server/files/ops.test.ts`, "trashes each item once, in order, by its absolute path and with `glob: false` (case 11)".
- G10, Delete for good: `tests/server/files/ops.test.ts`, "removes each item for good (case 14)". No test in `tests/server/` shows the copy kept in the file history: `grep -rnE "deletes\.json|stampKept|kept copy|keeps a copy|up to 5"` over the original `tests/server/` finds only `history-fixture.ts`, so case 14 is the fallback the ruling names. The kept-copy cases are in `tests/routes/files/file-undo.test.ts`.
- G11: `tests/server/root/dev-server.test.ts`, "serves a style module asked for before its component as compiled CSS, and again after it, and leaves no process on stop" (slow-tagged; starts `npm run dev` on a copy of the engine without its local.yml).
- G12: none in my folders.
- G13: none in my folders (`root/context/context-push.test.ts` keeps the settings in force on a refused value; it does not use a default).
- G14: none in my folders.
- G15: none in my folders.
- G16 to G27: none in my folders (their tests are under `tests/checks/`).

## 2. Counts

| | Before | After |
|---|---|---|
| Test files (`find tests/server -name '*.test.ts' \| wc -l`) | 139 | 8 |
| `.ts` files (`find tests/server -name '*.ts' \| wc -l`) | 161 | 15 |
| Lines (`find tests/server -name '*.ts' \| xargs cat \| wc -l`) | 47,452 | 1,197 |
| `it(` or `test(` matches (`grep -rhoE '\b(it\|test)(\.each\|\.skip\|\.only)?\(' tests/server \| wc -l`) | 2,150 | 11 |
| Files tagged slow (`grep -rl '@module-tag slow' tests/server`) | 27 | 1 (`root/dev-server.test.ts`) |

The 11 matches after are 10 test cases plus one `.test(css)` regex call at `tests/server/root/dev-server.test.ts:153`. The 10 cases: picker 1, ops 3, config-value 1, oauth 1, placeholders 1, writes 1, changes 1, dev-server 1. The "before" figure by the same command also includes such non-case matches; the number of real test cases before was not counted.

Kept test files (8): `accounts/connect/oauth.test.ts`, `core/changes.test.ts`, `edit/config-value.test.ts`, `edit/writes.test.ts`, `files/ops.test.ts`, `files/picker.test.ts`, `machine/commands/placeholders.test.ts`, `root/dev-server.test.ts`.

Deleted: 131 test files and 15 helper files (`accounts/calendar/ics-fixture.ts`, `accounts/calendar/poll-fixture.ts`, `accounts/mail/fixture.ts`, `core/git/git-gates.ts`, `git/allowed.ts`, `git/deletions.ts`, `git/page.ts`, `machine/hpc/poll-fixture.ts`, `machine/pty/tmux-fixture.ts`, `machine/pty/tmux-server.ts`, `root/process/server-fixture.ts`, `root/watch/portfolio/start.ts`, `root/watch/probe.ts`, `root/watch/repos.ts`, `sessions/stores/transcript-fixture.ts`). The folders left empty are removed (`find tests/server | sort` lists only the 8 tests and 7 helpers).

## 3. Helpers kept because a file outside `tests/server/` imports them

Found with `grep -rnE "from '[^']*tests/server/|from '(\.\./)+server/" tests utils vite.config.ts`.

- `machine/line-counts.ts`: `tests/state/system/lines.test.ts`, `tests/views/system/status.test.ts`, `tests/routes/machine/lines.test.ts`.
- `edit/writes-fixture.ts`: `tests/routes/edit/side-project-writes.test.ts` (also kept `edit/writes.test.ts`).
- `root/context-fixture.ts`: `tests/routes/sessions/transcript.test.ts`, `tests/routes/sessions/hook.test.ts`, `tests/routes/sessions/terminal-fixture.ts`, `tests/routes/machine/hpc.test.ts`, `tests/routes/git/deposit.test.ts`, `tests/routes/git/git.test.ts`.
- `machine/commands/commands-fixture.ts`: `tests/routes/machine/commands.test.ts`.
- `files/history-fixture.ts`: `tests/routes/files/history.test.ts`, `tests/routes/files/file-undo.test.ts`.
- `files/ops-fixture.ts`: `tests/routes/files/file-undo.test.ts`, `tests/routes/replace/preview.test.ts`, `tests/routes/replace/replace-fixture.ts` (also kept `files/ops.test.ts`).
- `git/refs/repo.ts`: `tests/routes/git/untracked.test.ts`, `tests/routes/git/refs.test.ts`.

Kept tests of this step import `tests/routes/edit/write-fixture.ts` (`changes.test.ts`, `config-value.test.ts`) and `tests/fixtures/` helpers, which the routes sweep and the fixtures owner must keep.

Inside the kept helper files, exports that no kept test and no outside file imports are deleted: `context-fixture.ts` (`driver`, `clusters`, `portfolioOf`, `inertConfig`, `configWith`, `blockWith`, `inertHpc`, `inertDependencies`), `commands-fixture.ts` (`TaskPane`, `taskTmux`), `writes-fixture.ts` (`tasksPath`, `TASKS`, `VENUES`, `CAREER`, `wider`, `tasksOf`, `venuesOf`, `TYPED`, `typed`), `ops-fixture.ts` (`INSENSITIVE`). Their now-unused imports are deleted with them.

## 4. Changes that are not a deletion

Only removals of characters inside lines:
- Trailing commas removed from import lists after the last listed name (`edit/writes.test.ts`, `files/ops.test.ts`).
- `files/ops.test.ts` header: the clause pointing at the deleted `ops-paste.test.ts` is removed with its line.
- `edit/writes.test.ts` header: the sentence pointing at `coerce.test.ts` and `writes-collection.test.ts` is removed.
- `edit/config-value.test.ts` header: ", the render itself (tests/server/edit/yaml/block-edit.test.ts)" is removed.
- `machine/commands/placeholders.test.ts` header: the pointer to the deleted `task.test.ts` is removed.
- `root/context-fixture.ts` header: the clause about the inert configuration and dependencies is removed and "fixture," became "fixture.".
- `core/changes.test.ts` header: the sentence naming `logHolding` is removed.

## 5. Header comments that still describe deleted tests in part

These header comments mix kept and deleted subjects on the same lines, so under the line rule they stay: `files/picker.test.ts` lines 1-3 (list of outcomes), `accounts/connect/oauth.test.ts` lines 1-2 (consent URL and the two other callbacks), `machine/commands/placeholders.test.ts` lines 2-3 ("The first describe reads the filled lines as text; the second..."), `root/dev-server.test.ts` lines 1-3 (the SSR path), `edit/writes.test.ts` lines 1-2, `files/ops.test.ts` lines 1-4, `edit/config-value.test.ts` lines 1-2 and `core/changes.test.ts` line 1. Rewording them is a text change beyond a deletion; the orchestrator decides whether to have them reworded.

## Open item for the orchestrator

G10 and G2 both point at `files/ops.test.ts`, which now holds three tests (G2, G10 Trash, G10 Delete for good). If the routes sweep keeps a test for G2 or G10, the two are settled at landing, keeping one.
