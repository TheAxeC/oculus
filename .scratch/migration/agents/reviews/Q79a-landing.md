# Q79a landing

Roadmap entry oculus/migration (the move of the cockpit into oculus). Plan step Q79a: the server half of the library audit's section D. Next: Q99's repair round 1, then Q100 and Q101.

## Open items

- None.

## Agents stopped

`ListAgents` before the worktree's commit listed no agent of the step (only the peer session ordo-2b).

## NOT DONE

- A write from the page (a save, an add) was not exercised on screen during the look; the page's writes are covered by the route cases in the verify run.

## What landed

- `@sveltejs/kit`'s `json()` in place of the hand-built JSON responses, and `tokenedBody` and `gatedBody` as the one token-then-JSON reader, `files/fs.ts`'s write included.
- One `/api/` origin guard in `hooks.server.ts` `handle`, judged on the route Kit matched, answering `{ error: 'forbidden' }` with 403. `UNGUARDED` passes the two account callbacks. `HEADERLESS` lets a request naming neither header reach `/api/hook`, `/api/memories`, `/api/wallpaper` and `/api/diagrams/[name]`, the routes that admitted one on the base. `sameOrigin` lives in `core/auth.ts` alone and refuses a request with neither header. `unconfirmed` moved to `git-routes.ts`.
- Config read one way; `isDeepStrictEqual` in `audit-mute.ts` and `rail.ts`; `TextDecoder`, `util.parseArgs`, `stripVTControlCharacters`, `timers/promises`; `yaml` `stringify` in `migrate-joint-work.mjs`.
- Behaviour, before and after: an origin refusal answers `{"error":"forbidden"}` as JSON on every route; a request naming neither header gets the answer it got on the base; the picture routes now admit `Sec-Fetch-Site: same-origin` or `none` with a foreign Origin, and an Origin naming the request's own host (the base refused both with an empty 403), and refuse an empty `Origin:` (admitted on the base).

## Fixes at landing

- The merge with Q92's `connect/actions.ts`: Q92's ics rows kept and written in `json(body, { status })`; its last `json(200, ...)` call converted. The diagrams regenerated with `npm run diagrams`.
- The migration writes a tag plain, `tags: [federated]`, as `network/joint-work.yml` does; its head comment made true; the case checks that line. With the fix removed, four cases of `migrate-joint-work.test.ts` fail.
- `handle` cases for `/api/(docs)/memories` and `/api/(docs)/diagrams/[name]` with neither header. Each fails with its path dropped from `HEADERLESS` ("AssertionError: /api/(docs)/memories: expected false to be true", and the same for diagrams).
- The titles of `hook.test.ts:46`, `write.test.ts:123` and `lines.test.ts:17`, and the comment of `root/hooks.ts:9-10`, made true.

## Report corrections

- The builder report's open items copy said "None" while Z43 was open.
- Its claim that curl drops an empty header is wrong: `curl -H 'Origin;'` sends one.

## Verification on main

```
Test Files  346 passed (346)
     Tests  5506 passed (5506)
COMPLETED 1481 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
verify: 6 commands passed
```

No `bench:` line, so no A/B.

## The look on TEST

After a reload, every `/api/` request the page made answered 200: `/api/fs` with the bookmarks and the engine listings, the ten config files under `/api/file/engine/`, the README preview under `/api/file/hub/`, and `/api/lines`. The Config cards and the file preview drew. `/api/diagrams/writes.svg` fetched from the page answered 200.

## Next

Q99 gets its repair round 1 from its review. Then `/spec` Q100 and Q101.
