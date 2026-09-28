# Q79a repair round 1 (sent 2026-09-28)

The round starts at the worktree commit `5ce7a0ec` (the step's work as you left it, committed by the orchestrator). The findings are those of `agents/reviews/Q79a-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q79a/tools/oculus` and nowhere else, run no git command of any kind in any checkout, and write under `.scratch/` only your report. Never open, print or grep `config/local.yml` in any checkout. The rules file and the brief still hold.

## Rulings on what stays

- The guard in `handle`, its route-id matching, `{ error: 'forbidden' }` as its 403 (item 2 of the brief names that answer), and the two callbacks passed unchecked.
- `bin/diagrams/writes.mjs` and `tests/checks/diagrams/diagrams.test.ts` (needed by item 1), and `tokenedBody` (the duplication check asked for it).
- The replacement of the brief's `json()` case by `gatedBody`'s two answers, since no hand `{ error: 'origin' }` answer is left to test; the report names it under the cases as a case changed, with the reason.
- The hook admitting `Sec-Fetch-Site: same-origin` with a foreign `Origin` (200, was 403), and refusing `cross-site` with no `Origin` (403, was 200): the one rule decides both. The report states both with before and after.

## Change

1. The brief's decision 1 is reversed. It was taken on a count of three token-free GET routes that change; the tree has fifteen (`/api/connect`, `/api/docs`, `/api/latex`, `/api/changes`, `/api/file/...`, `/api/fs`, `/api/project-files`, `/api/source`, `/api/deposit`, `/api/git`, `/api/lines`, `/api/agents`, `/api/terminal`, `/api/customizations`, `/api/transcript`), among them one that serves a file's bytes, and the reason "every browser sends one of the two" does not hold for a browser without Fetch Metadata or a host that is not potentially trustworthy. So the one rule refuses a request with neither `Origin` nor `Sec-Fetch-Site`, as `core/auth.ts`'s `sameOrigin` did on the base, and every route keeps the answer it gave such a request on the base:
   - `sameOrigin(headers, host)`: `if (origin === null) return false;`.
   - Beside `UNGUARDED` in `src/hooks.server.ts`, one second list names the API paths that admit a request with neither header, with the reason, and holds exactly the routes that admitted it on the base: `/api/hook` (the Claude Code hook's `curl`, `root/hooks.ts` on the base), and `/api/memories`, `/api/wallpaper` and `/api/diagrams/[name]` (the picture routes, whose `images.ts` rule on the base read "a request that names none is the command line's"). For those paths a request with neither header reaches the route; any header present is judged by the one rule.
   - Cases through `handle`: `GET /api/file/[root]/[...path]` and `GET /api/lines` with neither header answer 403 and never reach `resolve`; `POST /api/hook` and `GET /api/wallpaper` with neither header reach `resolve`; `GET /api/wallpaper` with `Sec-Fetch-Site: cross-site` and no `Origin` answers 403. The `sameOrigin` case "neither header is admitted" becomes "neither header is refused".
   - `DESIGN.md`'s "Auth" section, the head comment of `core/auth.ts`, the comment on `sameOrigin` and the guard's comments state the rule so: neither header refused, the second list and its reason, and no claim that every browser sends one of the two.
2. The callbacks through `handle`. Cases with the real route ids (`/api/(accounts)/calendar/callback` and the mail one) and `Sec-Fetch-Site: cross-site`: each reaches `resolve`. Dropping either path from `UNGUARDED` turns its case red.
3. `tests/routes/sessions/hook.test.ts:52` "answers 200 for a same-origin Origin" goes: the route no longer reads `Origin`, and the guard's cases cover it.
4. `audit-mute.ts:48` and `rail.ts:72` compare with `isDeepStrictEqual` (their values carry no optional field). `connect/rows.ts:178` keeps its JSON comparison with a comment saying why (a row's optional field may be set to `undefined`, which JSON drops).
5. `migrate-joint-work.mjs` stringifies with `flowCollectionPadding: false`, so a list reads `tags: [federated]` as the hand-kept files do and the head comment of `fileText` holds. Its case checks that line in the output.
6. Comments the diff made false, each rewritten to what the code does now: `src/routes/api/(files)/search/+server.ts:6-7`, `src/lib/server/files/roots.ts:13`, `src/lib/server/git/git-routes.ts:5` and `git/deposit-routes.ts:5` (the guard in `handle`, not "every request under /api/ is same-origin only").
7. `unconfirmed` moves out of `core/auth.ts` into the git route side, one module the two git route modules share (a new small module under `server/git/`, or exported from `git-routes.ts` and imported by `deposit-routes.ts`), so `core/auth.ts` holds only the origin rule and the token, as its head comment says.
8. One token-then-JSON reader. `gatedBody` is `tokenedBody` plus its map check, and `files/fs.ts`'s `handleFsWrite` uses one of the two in place of its own lines. Every route answers each refusal with the status and body it gave on the base (brief item 1), through `tokenedBody`'s refusal parameters where the words differ.

## Report corrections

9. Under "Reader-visible changes", with the before and after: the 403 body of an origin refusal on every route, listed by route as the reviewer's Behaviour section lists them, now `{"error":"forbidden"}` with a JSON content type; and item 1's result, that every route answers a request with neither header as it did on the base.
10. The "Judgment calls" reason for the JSON comparisons says what item 4 leaves.
11. The "Files, lines before and after" table goes: the orchestrator quotes `git diff <base> --stat` at landing.
12. For each new or changed case, quote its failure with the change it guards undone, then put the file back.

## Tests

Run only the test files you change while working, then `npm run check`, `npm run format:check`, `npm run lint` and `npm run diagrams` (the diagrams follow the moved function). Do not run the full verify list: the orchestrator runs it on main at landing.

Rewrite the report at `.agents/worktrees/Q79a/tools/oculus/.scratch/migration/agents/reviews/Q79a-report.md` with these items, in the brief's shape, its first section the open items as the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` lists them when you finish.
