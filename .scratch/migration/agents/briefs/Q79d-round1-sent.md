# Q79d repair round 1 (sent 2026-09-29)

The round starts at the worktree commit named in the dispatch entry (the step's work as you left it, committed by the orchestrator). The findings are those of `agents/reviews/Q79d-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q79d/tools/oculus` and nowhere else, run no git command of any kind in any checkout or folder (read-only ones and a scratch `git init` included), start no tmux session on the default server, run no browser test and write under `.scratch/` only your report. Never open, print or grep `config/local.yml` in any checkout. The rules file and the brief still hold.

The `data/helpers/files/` folder, with `paths.ts`, `text-kind.ts`, `opens-in-program.ts` and their tests moved into it, is accepted: the folder limit of `size.test.ts` refuses the path the ruling named. Leave it as it is.

## Change

1. **A folder of `/` keeps main's containment on the server.** `server/core/paths.ts` `inside` and `below` test `full.startsWith(root + sep)` (with `full === root` for `inside`), as every copy on main did, so a folder of `/` holds only itself and nothing below it; the head comment says so in one sentence. `sessions/group.ts` `within` keeps main's rule for itself, where a base ending in the separator holds every path below it: `base === sep ? path.startsWith(sep) : inside(path, base)`, after its empty-string guard.
   - Case (paths.test.ts): `inside('/Users/x', '/')` is false, `inside('/', '/')` is true, `below('/x', '/')` is false. The existing `below('/x', '/')` true expectation changes to false.
   - Case (group.test.ts): a session whose area is under a configured root of `/` is still grouped under it, as on main.
2. **A served root or repository of `/` joins its paths without a doubled slash.** `data/helpers/files/paths.ts` gains `joinPath(dir: string, path: string): string`: `'/' + path` when `trimSlash(dir)` is `/`, else `` `${trimSlash(dir)}/${path}` ``, and `trimSlash(dir)` for an empty `path`. `file-git.ts` `wholePath` and `tabOfFile`'s target, and `status.ts` `repoStatus`'s target, build through it.
   - Case (paths.test.ts): `joinPath('/', 'work/a.txt')` is `/work/a.txt`; `joinPath('/r/', 'a')` is `/r/a`; `joinPath('/r', '')` is `/r`.
   - Case (file-git.test.ts): with `served = [{ key: 'disk', dir: '/' }]` and repositories `['/work/repo']`, `repoOfFile(served, { root: 'disk', path: 'work/repo/a.txt' }, repositories)` is `{ root: '/work/repo', path: 'a.txt' }`.
   - Case (status test): `repoStatus` for a tab on a served root of `/` finds the repository holding the file.
3. **`isMap` means the guard in every file.** `server/edit/list-edit.ts:20`, `server/edit/entry-edit/host-status.ts:4` and `data/sources/config/agents.ts:12` import the yaml library's node test as `isYamlMap`, with the head comment line the other five files carry; every call in them is renamed. `state/boards/collection.ts` `isFieldMap` (`:167`) goes, its two callers (`:173`, `:639`) read `isMap` of `data/helpers/guards.ts`. The step's audit grep in `tests/server/core/paths.test.ts` also finds `import { isMap` from `'yaml'` (a pattern `import \{[^}]*\bisMap\b[^}]*\} from 'yaml'`), with no match expected.
4. **Tests that pin what the brief kept.** Each new case is red under the revert named:
   - `repoOfFile` leaves out a repository whose folder is the file itself: a tab file that is `/work/repo` with repositories `['/work', '/work/repo']` gives `{ root: '/work', path: 'repo' }` (red under `const holders = repositories;`). The same for `tabOfFile` over its served roots (red under its filter removed).
   - `group.ts`: a session with an empty cwd is grouped in no area of the workspace (red with the empty-string guard of `within` removed).
   - `customizations.ts` `upward`: a workspace that is itself a root lists that root's folder once (red with `inside` changed to `below`).
   - `compose.ts` `accountOfPath`: a path equal to an account's folder names no account; a path below it names it (red with `below` changed to `inside`).
   - `repoStatus` and `repoOfFile` with a repository key of `''`: nothing holds the file (red with `pathUnder`'s empty-folder guard removed).
5. **`state/system/deposit.svelte.ts:16`** reads "One path `git status --porcelain=v1 -z` reported, with git's own two letters", as its server twin does.

## Report corrections

6. Section 7.4 is replaced: the Sessions list does not change (its caller guards the empty folder at `selectors.svelte.ts:454`). What changes: in the source tab's gutter and blame and in the status bar's branch item, a repository key or served root of `''` held every absolute path before and holds nothing after.
7. Under the user-visible changes, with before and after:
   - A folder whose name starts with two dots (`/a/..b`) is now inside `/a` for the composer's image check and account lookup and for the Customizations walk; before it was refused.
   - The stash control with mode `staged`, when the only change is a worktree rename or copy: before the stash went ahead; after it is refused with "there is nothing here for that stash to take".
   - A served root of `/`: repository lookups on the page work as on main (item 2), and the server's containment of `/` is as on main (item 1).
8. The report's first section is the open items as the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` lists them when you finish.
9. For each new or changed case, quote its failure with the change it guards undone, then put the file back.

## Tests

Run only the test files you change while working, then the verify list once at the end: `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null` from `tools/oculus` in the worktree, and quote the lines it prints. A failure that is only a timeout under load and passes when its file runs alone is named as such and not fixed.

Rewrite the report at `.agents/worktrees/Q79d/tools/oculus/.scratch/migration/agents/reviews/Q79d-report.md` with these items, in the brief's shape.
