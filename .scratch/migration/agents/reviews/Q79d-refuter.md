# Step Q79d refuter report (reviewer a0f9a49e067ffa141, on .agents/worktrees/Q79d, base 7487fbce)

## Verification

`uptime` before the run: `0:10  up 3 days,  2:16, 1 user, load averages: 5.32 6.67 6.34`

`sh ~/.claude/skills/land/templates/verify.sh .../orchestrator-state.md </dev/null`, run once from tools/oculus in the worktree with node v24.21.0 on PATH, printed:

```
All matched files use Prettier code style!
...
verify: 6 commands passed
exit 0
```

Only the tail was captured, so the test-count lines of `npm test` were not kept. `verify: 6 commands passed` is the one status line verify.sh prints itself (verify.sh:241).

`uptime` after the run: `0:13  up 3 days,  2:19, 1 user, load averages: 6.74 7.69 6.92`

## 1. Spec

1. The client helpers are at a path the ruling does not name. The brief (item 4, decision 1) and the ruling in Q79d-cases.md name `data/helpers/paths`. The diff puts the file at `src/lib/data/helpers/files/paths.ts` and moves `text-kind.ts`, `opens-in-program.ts` and their two tests into `files/`, which widens the step's paths to `settings.ts`, `source.ts`, `fs.svelte.ts`, `open.ts`, `open-fixture.ts` and `open-program.test.ts`. The report gives the reason as its judgment call 1 (`size.test.ts` refused an eleventh item in `data/helpers`). No ruling accepts it.
   - Each moved file is byte-identical to its base except its import lines.
   - `grep -rn 'text-kind\|opens-in-program' src tests config bin docs | grep -v 'helpers/files/'` prints nothing. Over `DESIGN.md`, `HELP.md` and `README.md` the same grep finds only `DESIGN.md:169` and `:305`, both naming the new `files/` ids. The regenerated `docs/diagrams` match a fresh `npm run diagrams` in a scratch copy (`diff -rq` printed nothing).
2. The ruling says the rename makes `isMap` mean the guard everywhere; three files outside the step still import the yaml library's node test unaliased as `isMap`: `src/lib/server/edit/list-edit.ts:20`, `src/lib/server/edit/entry-edit/host-status.ts:4`, `src/lib/data/sources/config/agents.ts:12`. The five files the step touches use the two names correctly (`grep -n 'isMap\b\|isYamlMap'` over each).
3. The brief's premise of seven copies is incomplete: `src/lib/state/boards/collection.ts:167` `function isFieldMap(value: unknown): value is Record<string, unknown>` has the body of `isMap` under another name, and the step leaves it.

## 2. Proof

Every revert ran on a scratch copy with node_modules symlinked. The report's reverts reproduce: inside without the separator, below admitting the folder (both forms), realPath not following links, the audit rename, statusRecords (index column only, and old path not stepped over), deposit without `-z`, nameOf, trimSlash of the root, pathUnder (empty guard, and prefix without a slash), deepestHolding first-wins, repoStatus first-only, ago (largest ignored, and future read as now), and elide. The localDate signature revert gives `COMPLETED 1487 FILES 14 ERRORS`. The deposit case's first run reproduces (`- "path": "a b.txt"` / `+ "path": "\"a b.txt\""`).

1. Report section 7.4 names a change that does not happen and misses the ones that do. `selectors.svelte.ts`'s only caller guards the empty folder first (`:454` `if (folder === '') return [];`). The empty-folder rule does change `file-git.ts` `repoOfFile` and `tabOfFile` (the old `under('', target)` returned `target.slice(1)` for any absolute target) and `status.ts` `repoStatus` (the old `root.replace(/\/+$/, '')` of `''` made `startsWith('/')` true for every target). `rootHolding` already skipped an empty base.
2. Brief item 4, "`repoOfFile` keeps excluding a file that is the repository's own folder": no test pins it. `const holders = repositories;` leaves `file-git.test.ts` and `follow.test.ts` at `Tests  18 passed (18)`; the same revert on `tabOfFile` stays green.
3. Brief item 2, "`group.ts` keeps its empty-string guard": removing `if (!path || !base) return false;` from `within` leaves `group.test.ts` at `Tests  25 passed (25)`.
4. Brief decision 3, `customizations.ts` admits the folder itself: `inside` changed to `below` in `upward` leaves `customizations.test.ts` at `Tests  18 passed (18)`.
5. `compose.ts` `accountOfPath`: `below` changed to `inside` leaves `compose.test.ts` at `14 passed`. The images check is pinned.

## 3. Standards

1. `src/lib/state/system/deposit.svelte.ts:16` still reads "One path `git status --porcelain=v1` reported", while its server twin at `deposit.ts:102` names `--porcelain=v1 -z`. Minor.
2. Clean: the ASCII gate; sizes (largest changed `.ts` 881, 812, 808; no component over 540; `data/helpers` 9 items, `tests/server/core` 7); no history in added comments; the ruled grep prints exactly its four lines.

## 4. Behaviour

1. A folder of `/` now holds everything at every former `startsWith(root + sep)` site, and the report does not say so. `server/core/paths.ts` uses `root.endsWith(sep) ? root : root + sep`; on main every copy tested `startsWith(resolve(dir) + sep)`, which for `/` is `'//'` and holds nothing below the root. Node probe: `["/Users/x","/"] old inside false new inside true | old below false new below true`. Sites: `files.ts` `resolveRootPath`, `fs.ts` `listDir`'s link filter, `open.ts:211`, `core/git.ts` `pathInside`, `git-write.ts` `permitted`, `deposit-git.ts` `underMirrors`, the `edit/writes/*` checks, `notes.ts`, `feeds.ts`, `images.ts`, `latex.ts`, `docs.ts`, `project-files.ts`, `audit/projects.ts`, `deposit.ts` `dropGone`. Before, a Files root added as `/` served nothing below itself and a workspace of `/` in `allowedRoots` permitted git writes only at `/` itself; after, both reach the whole disk. `compose.ts`, `customizations.ts` and `group.ts` are unchanged here.
2. A served root of `/` now breaks the page's repository lookups: `trimSlash('/')` stays `/`, so `${trimSlash(dir)}/${path}` builds `//work/...` in `file-git.ts` `wholePath` and `status.ts` `repoStatus`. Probe with `served = [{ key: 'disk', dir: '/' }]` and repository `/work/repo`: `repoOfFile(...) = null`, where main finds `/work/repo` with path `a.txt`. `tabOfFile` and `rootHolding` still answer correctly.
3. `compose.ts` and `customizations.ts`, moving from `relative` to the prefix test, now admit a child whose name starts with two dots (`/a/..b` inside `/a`: old false, new true). `..` is still refused. `git-refs.ts` `holds` with mode `staged`: when the status holds only a worktree rename or copy, main read the old-path field as a record and counted it as staged, so the stash went ahead; now the stash is refused with "there is nothing here for that stash to take". Read from the diff, not run. The other callers keep their results.
4. `pathUnder`'s empty-folder change is visible in `repoOfFile`, `tabOfFile` and `repoStatus`, not in the Sessions list; its before and after is not stated for those callers.
5. The builder's git use leaves no trace in the worktree's git metadata beyond the preparation (`.git/worktrees/Q79d/logs/HEAD`: creation 22:03:46 and `reset: moving to HEAD` 22:04:04). The scratchpad `git init` cannot be seen from here.

## Not checked

- The test-count lines of the verify run's `npm test`.
- A first scratch-copy run of 11 test files showed `1 failed` at 21 s cold; the rerun gave `133 passed`. Not investigated.
- Behaviour 1 and 2 on screen.
- The ruled grep case beyond rerunning it.
- `pathInside` on `'.'`, and `trimSlash` / `pathUnder` on Windows-style paths.

The reviewer ran `git -C /dev/null` once while building a probe; it failed and did nothing, and it is outside the two allowed commands.

Reviewer usage: about 62 tool uses, 256k tokens, 15 minutes (00:09:54 to 00:23:30).
