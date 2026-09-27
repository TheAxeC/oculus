# Q77d refuter

Verification lines, verbatim, run from the worktree's tools/oculus (load averages from `uptime` shown where taken)

Part 1 V1 `npx vitest run tests/checks/bin/dispatch-note.test.ts tests/checks/bin/dispatch-note-race.test.ts --reporter=verbose` (load 2.28 before, 4.23 after):
` ✓ ... > the launch note writer > waits for a lock a live writer holds, and takes it only once that writer lets it go 364ms`
` Test Files  2 passed (2)` / `Tests  20 passed (20)` / `Duration  7.12s (transform 85ms, setup 0ms, import 182ms, tests 6.65s, environment 0ms)`

`npm run check`: `COMPLETED 1508 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
`npm run format:check`: `All matched files use Prettier code style!`
`npm run lint`: `lint exit 0`
ASCII gate (the rules file's perl command): no output, `ascii gate exit 0`
(The tree is the same for all four parts, so these four ran once.)

git-ops alone, `npx vitest run tests/server/git/git-ops.test.ts`:
`14:30 up 1 day, 16:36, 1 user, load averages: 4.06 3.68 3.65`
`Tests  37 passed (37)` / `Duration  20.31s (transform 145ms, setup 0ms, import 1.81s, tests 18.40s, environment 0ms)`
`14:30 ... load averages: 4.84 3.88 3.72`

Part 2 V1 `npx vitest run tests/server/git/git-ops.test.ts tests/checks/diagrams --reporter=verbose` (load 5.30 before, 6.53 after):
`Test Files  3 passed (3)` / `Tests  100 passed (100)` / `Duration  19.73s`. Case durations summed per file from that log: git-ops 37 cases 17126 ms, diagrams.test.ts 46 cases 14289 ms, readable.test.ts 17 cases 7996 ms.

Part 3 V1, portfolio.test.ts `--reporter=dot`, five runs: `Tests  32 passed (32)` each time; Durations 9.29s, 9.88s, 9.22s, 9.65s, 8.43s (load 4.12, 3.42, 2.89, 2.90, 2.61 before each).
Part 3 V2 `npx vitest run tests/checks/bin/dispatch-note.test.ts --reporter=verbose`: `Tests  19 passed (19)` / `Duration  6.65s`; the launch recipe case `3135ms`.

Part 4 V1 `npx vitest run tests/server/root/dev-server.test.ts --reporter=verbose` (load 2.61 before):
` ✓ ... serves a style module asked for before its component as compiled CSS, and again after it, and leaves no process on stop 5387ms`
` ✓ ... loads a style module asked for before its component as compiled CSS on the SSR path 1608ms`
`Tests  2 passed (2)` / `Duration  7.65s`
Part 4 V2 `node bin/revert-check.mjs tests/server/root/dev-server.test.ts`: `red` for both cases `(revert vite.config.ts:15)`, `2 reverts, 0 unproven, 0 unchecked`, exit 0.

Revert sample. I applied each revert by hand in a scratch copy of the worktree (scratchpad/tree, node_modules linked) and ran the one case with `-t`. The copy was restored after each run, checked with `diff -rq`:
- `bin/dispatch-note.mjs:166 => return true;`, the new dispatch-note case: `× ... takes it only once that writer lets it go 354ms`, `AssertionError: expected 1 to be +0` (the child exited 1).
- `bin/diagrams/diagrams.mjs:170 => if (!existsSync(path)) stale.push(file);` (the moved directive), "are named stale, every one at once...": `×` red.
- `bin/diagrams/source.mjs:160` ellipse revert, "are what the source gives now" (reads the memo): `×` red.
- `bin/diagrams/graphs.mjs:277 => const box = to;`, readable "...in the overview and the layer diagrams" (memo): `×` red.
- `bin/diagrams/writes.mjs:428 => const tail = '';`, readable "...in the write diagram" (memo): `×` red.
- `vite.config.ts:15 => delete`, dev-server first case: `×`, `AssertionError: expected true to be false`.
- I also used the real `revert-check` tool on dev-server.test.ts, as quoted above.

## 1. Spec

- **Part 4's premise does not reproduce.** The brief says that polling `/` compiled the layout first, so the case no longer asked for the style module before its component. I checked this in the scratch copy: I restored the old `started()` (the diff for dev-server.test.ts applied in reverse, polling `/` every 250 ms) and deleted `vite.config.ts:15`. The first case was still red, `❯ tests/server/root/dev-server.test.ts:208:34` `AssertionError: expected true to be false`. Line 208 is the first `expect(raw(css)).toBe(false);`, so the style module's first answer was raw even after `/` had rendered. The old case already asked for the style module before its client component was compiled, and the change to `/@vite/client` is a speed change only. The builder's report states no premise error for Part 4.
- **Memo instead of the brief's `beforeAll`** (tests/checks/diagrams/diagrams.test.ts:47-53, readable.test.ts:191-197):
  - Its stated reason did not reproduce in one run. In the scratch copy I replaced the memo in diagrams.test.ts with a file-level `beforeAll(async () => { engineAll = await generate(ENGINE); })`, applied `bin/diagrams/diagrams.mjs:113 => delete` and ran `-t "carries its own grey"` at load 2.63. The case ran and was red (`× carries its own grey ... 8ms`), not skipped. The report says which cases were skipped varied between runs; that is consistent with a load-dependent hook timeout, but not shown.
  - The memo does keep "generate runs once per file for the engine". A temporary log in the scratch copy's `generate` recorded 1 engine call from diagrams.test.ts, 1 engine call from readable.test.ts, and 1 call for the `oculus-diagrams-tree-*` copy from diagrams.test.ts (63 of 63 passed).
  - The memo also spares a single `-t` run of a case that reads no engine drawing the ~6 s generation, which a file-level `beforeAll` would charge.
  - It remains a substitute for a named shape, and the report flags it as a decision.
- **Part 2 target missed.** git-ops.test.ts is not under 12 s alone: 20.31 s at load about 4. I timed the new per-case setup on a synthetic template of the same shape (scratchpad/gitops: 109 files, bare remote plus seed, repo and other). `cpSync` took 35.1 ms per copy and the three `git remote set-url` calls took 121.4 ms per case. That is about 160 ms per case, about 6 s over 37 cases, so most of the remaining time is in the case bodies. This supports the report's NOT DONE row and its account.
- No change was found that no item asks for.

## 2. Proof

- **The report's Part 1 section contradicts the delivered tree.** It says "I changed one file" and "The file-level `vi.setConfig({ testTimeout: 600000 })` at line 33 is unchanged", and it offers a "Decision for you" to keep 600000. The diff removes that line and its comment and gives only the launch recipe case `35_000` (dispatch-note.test.ts:440-441), which is what Part 3 asked for. The end state is correct; the Part 1 text is stale and should not be relayed.
- **Template copy independence (git-ops.test.ts:136-162): holds.** In a synthetic copy made with node `cpSync(..., { recursive: true })` and followed by `set-url` on the three clones, `grep -rl <template path> <copy>` found nothing (exit 1). `find <copy> -type l` found no symlinks. `cloneAs` is called only in `beforeAll` (lines 141, 146, 147), and every case gets a fresh `dir`, `remote`, `repo` and `other`.
- **The new dispatch-note case goes red under `return true;`**, with the child exiting 1, as the brief states.
- **dev-server's first case does ask for the style module before anything compiled the layout** (red under `vite.config.ts:15 => delete`). As shown under Spec, the old poll of `/` did so too.
- **Portfolio negative waits `sleep(150)`.** No revert proves these cases. Under debounce 20, a relevant write (`registries/venues.yml`) produced its rebuild in 42, 47, 42, 43, 44 and 43 ms over six runs (instrumented scratch copy, load about 3). So 150 ms keeps about a 3x margin at that load; under heavier load, a late rebuild would be missed (a false green), not flagged red. I also tried to exercise the "ignores a file written under a project code folder" case by reverting portfolio.ts:108 to `if (false) return false;`. The case stayed green (`✓ 433ms`), so that probe does not exercise the wait, probably because `namedByConfig` filters the file anyway.
- Durations in the report differ from mine; the likely cause is load, not a false claim:

| Measurement | Report | Mine |
|---|---|---|
| git-ops alone | 19.11 s | 20.31 s |
| Part 2 V1 wall time | 27.28 s | 19.73 s |
| dev-server first case | 10362 ms | 5387 ms |
| Portfolio runs | 8.95-9.71 s | 8.43-9.88 s |

## 3. Standards

- **A comment made false by the diff.** At tests/server/root/dev-server.test.ts:120-124 the new doc comment says:
  ```
  * ... The
  * root page is not asked for, since rendering it compiles the layout before the case asks for the
  * layout's style module.
  ```
  My check under Spec shows that rendering `/` does not make the style module's first answer compiled: it is still raw without the style-first plugin. The stated reason is not true as a description of behaviour.
- **Minor: comment placement.** In the launch recipe case, the comment naming the waits sits as the last line of the body (dispatch-note.test.ts:440, `// The two waits above are bounded at 10 s for the id file and 20 s for the exit file.`), directly above `}, 35_000);`. It is not beside the timeout option itself. Not a rule breach.
- **Stale comments: none found.** I grepped `600000|600_000|testTimeout|many writer|150 rounds|3600|staleFiles|quiet(|started(|@vite/client|sleep(500)|sleep(150)` across .ts, .mjs and .md files outside node_modules and .scratch. That found no stale reference to the removed 150-round case or the file-level timeout. The staleFiles mentions at diagrams.mjs:25 and diagrams.test.ts:3 are still accurate, and the `quiet()` doc comment names no step length.
- Non-ASCII: none (ASCII gate empty). History in comments: none found.

## 4. Behaviour

- Under load, the portfolio negative checks can now miss a spurious rebuild slower than 150 ms (a false green). The report does not state this.
- dev-server's `started()` now returns once `/@vite/client` answers, before the app has rendered a page. The case's later requests passed in my run. The report does not mention that the case no longer confirms the root page renders before it asks for the style module.
- git-ops leaves its template folder to `sweepScratch` (`afterAll(sweepScratch)`, line 45); the file's own `afterAll` removes only the last case's `dir`. Harmless, not stated.

## Not checked

- The whole of `revert-check` over dispatch-note.test.ts, git-ops.test.ts, diagrams.test.ts, readable.test.ts and portfolio.test.ts. Only the named sample was proven, by hand with `-t` in a scratch copy.
- git-ops durations against the base commit (I did not run the base tree), and an idle-machine timing.
- Repeated runs of the new dispatch-note case or of the reverted cases (one run each).
- The builder's claim that a `beforeAll` gives skipped cases under the real `revert-check` at high load.
- The browser suite and the whole unit suite (excluded by the brief).

## Closed

- Spec, Part 4's premise does not reproduce (polling `/` did not compile the style module before the case asked for it): the brief's premise was wrong; the change to `/@vite/client` stands as a speed change. The comment it made false (`dev-server.test.ts:120-124`) is corrected at landing to say why the client script is polled.
- Spec, the memo instead of the brief's `beforeAll`: accepted; the review showed one engine generation per file and that a single `-t` run of a case reading no engine drawing skips the generation. The builder's stated reason did not reproduce in one run and is not relied on.
- Spec, git-ops not under 12 s alone: the setup now costs about 160 ms per case (the review's timing), the rest is the cases' own git work; measured again on main at landing with the whole suite.
- Proof, the report's Part 1 text is stale on the file-level timeout: the tree matches Part 3 (the timeout removed, the launch recipe case given 35 s); stated in the landing report.
- Proof and Behaviour, the portfolio negative checks' `sleep(150)` can miss a rebuild slower than 150 ms under heavy load: written into Q72's list in `plan.md` (a barrier write that must rebuild, waited for, in place of each fixed negative wait), under Axel's rule that a step ends at its rounds.
- Standards, the comment placement in the launch recipe case: left; not a rule breach.
- Behaviour, `started()` no longer waits for the root page and the template folder is left to `sweepScratch`: stated in the landing report; neither changes what a case asserts.
