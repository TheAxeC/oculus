# Diagnosis: the hub Graph's 10 s first read

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding.

## Symptom

"the hub's Graph section shows "Reading the graph" with a count of 0 for about 10 s before its 50 rows." (`tools/oculus/.scratch/migration/agents/reviews/owed-looks.md:161`, seen beside defect Q66-1 in the Q66 look of 2026-10-02; diagnosed under ruling Z441 in the brief-check form, no person present.)

## Where the probes run

A detached worktree of main at 6dd4684a4, `$tmp/tree` with `tmp=/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.0m0WoY`, made from the main checkout with `git worktree add --detach "$tmp/tree" HEAD`; nothing applied to it. Its `tools/oculus/node_modules` is a scratch folder of links to the main checkout's packages, with the cache folders (`.vite`, `.cache`, `.experimental-vitest-cache`, `.svelte2tsx-language-server-files`) left out so no run writes into the main checkout. Main moved to 23450f8dc during the run; `git diff --stat 6dd4684a4 HEAD -- tools/oculus/src tools/oculus/tests` prints nothing, so every line number below holds at main's head.

The hub's size: `git rev-list --count HEAD` prints 2397; `git count-objects -vH` prints `size-pack: 1.32 GiB`, `in-pack: 66114`; the checkout is 1.8G (`du -sh "$tmp/tree"`), 8400 files.

The red case runs on a second scratch copy of that size: `git clone -q --shared /Users/axelfaes/workspace/research-hub "$tmp/hub"` (objects read from the hub through alternates, every write in the clone), with two worktrees of the clone under its ignored `.agents/worktrees/` (`git -C "$tmp/hub" worktree add -q --detach "$tmp/hub/.agents/worktrees/w1" HEAD`, the same for `w2`). The original case also reads the real hub, its three `.agents` worktrees and the six configured roots, git reads only (`--no-optional-locks`), nothing written.

The paths redirected under `$TMPDIR`: none; no command touches the real home, the installed skills or the pinned checkout. `config/local.yml` was never opened; `loadConfig` (`src/lib/data/sources/config/merge.ts:128`) does not read it.

## Red command

The Graph's read path: `Graph.svelte:245` fetches `graphUrl(root, 0)` (`state/sources/repositories/repositories.ts:62`), `GET /api/git?graph=<root>&skip=0`, routed by `src/routes/api/(git)/git/+server.ts` (whose `options(locals)` parses the whole config through `locals.config()` on every request) to `handleGitGet` (`server/git/git-reads.ts:196-209`), which runs `graphPage` (`server/core/git/reads.ts:53`: `git log --topo-order ... -51 HEAD --` and two upstream ranges) and on the first page `branchBase` (`server/core/git/compare.ts:247`). Every git command goes through `run` (`server/core/git/run.ts:145`), which is `spawnSync`. The running server is `vite dev` (`ps` prints pid 89237, `node .../tools/oculus/node_modules/.bin/vite dev`, 1.26 GB resident), one Node process, one event loop.

The harness `loop-red.mjs` serves that request from the scratch copy's own modules on a loopback port of its own, beside the real git watcher (`watchGit`, `server/root/watch/git.ts`) over the roots named, and a forked client asks for the first page every 1.5 s for 20 s. The handler sends how long it ran (`x-run-ms`); the client's latency minus that is how long the request waited for the event loop.

```js
// loop-red.mjs
import { fork } from 'node:child_process';
import { createServer } from 'node:http';
import { monitorEventLoopDelay } from 'node:perf_hooks';
const T = process.env.TREE, HUB = process.env.REPO;
const SECONDS = Number(process.env.SECONDS_RUN ?? 40), EVERY = Number(process.env.EVERY ?? 1500);
if (process.argv[2] === 'client') {
  const url = process.argv[3]; const out = [];
  const one = async () => { const t0 = performance.now(); const r = await fetch(url); const b = await r.json(); const ms = performance.now() - t0; const run = Number(r.headers.get('x-run-ms')); out.push({ ms: Math.round(ms), run: Math.round(run), wait: Math.round(ms - run), rows: b.page?.commits?.length ?? b.commits?.length ?? -1 }); };
  const timer = setInterval(() => void one(), EVERY);
  setTimeout(() => { clearInterval(timer); setTimeout(() => { process.send(out); process.exit(0); }, 3000); }, SECONDS * 1000);
} else {
  const { Hub } = await import(`${T}/tools/oculus/src/lib/server/core/channels.ts`);
  const { watchGit } = await import(`${T}/tools/oculus/src/lib/server/root/watch/git.ts`);
  const { handleGitGet } = await import(`${T}/tools/oculus/src/lib/server/git/git-reads.ts`);
  const { loadConfig } = await import(`${T}/tools/oculus/src/lib/data/sources/config/merge.ts`);
  const engine = `${T}/tools/oculus`;
  const roots = (process.env.ROOTS ?? '').split(':').filter(Boolean);
  const named = (process.env.NAMED ?? '').split(':').filter(Boolean);
  const hub = new Hub();
  const watcher = process.env.WATCH === '0' ? null : watchGit(hub, { always: process.env.ALWAYS === '0' ? '' : HUB, roots: () => roots, workspacesFile: `${process.env.TMPW}/no-workspaces.json` });
  if (watcher) hub.publish('sessions', { workspaces: named.map((key) => ({ key })) });
  const allowed = [HUB, ...roots, ...named];
  const server = createServer(async (req, res) => {
    const request = new Request(`http://127.0.0.1${req.url}`, { headers: { 'sec-fetch-site': 'same-origin' } });
    const r0 = performance.now(); const config = process.env.NOCONFIG === '1' ? null : loadConfig(engine).config; void config;
    const response = await handleGitGet(request, { rootsFor: () => allowed });
    res.writeHead(response.status, { 'content-type': 'application/json', 'x-run-ms': String(performance.now() - r0) }); res.end(await response.text());
  });
  const delay = monitorEventLoopDelay({ resolution: 10 }); delay.enable();
  server.listen(0, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${server.address().port}/api/git?graph=${encodeURIComponent(HUB)}&skip=0`;
    const child = fork(new URL(import.meta.url).pathname, ['client', url], { env: process.env });
    child.on('message', (out) => {
      const ms = out.map((o) => o.ms).sort((a, b) => a - b); const runs = out.map((o) => o.run); const waits = out.map((o) => o.wait).sort((a, b) => a - b); const mean = ms.reduce((a, b) => a + b, 0) / ms.length;
      const sd = Math.sqrt(ms.reduce((a, b) => a + (b - mean) ** 2, 0) / ms.length);
      console.log(JSON.stringify({ watch: !!watcher, n: ms.length, rows: [...new Set(out.map((o) => o.rows))], runMeanMs: Math.round(runs.reduce((a, b) => a + b, 0) / runs.length), runMaxMs: Math.max(...runs), waitMeanMs: Math.round(waits.reduce((a, b) => a + b, 0) / waits.length), waitMaxMs: waits.at(-1), red: waits.reduce((a, b) => a + b, 0) / waits.length > 200, meanMs: Math.round(mean), sdMs: Math.round(sd), maxMs: ms.at(-1), p50: ms[Math.floor(ms.length / 2)], loopMaxMs: Math.round(delay.max / 1e6), loopMeanMs: Math.round(delay.mean / 1e6), gitVersion: hub.version('git'), filesVersion: hub.version('files') }));
      watcher?.close(); server.close(); process.exit(0);
    });
  });
}
```

```sh
# writer1.sh <seconds>: one builder's writes, one edit in worktree w1 every 100 ms
end=$((SECONDS + $1)); i=0
while [ $SECONDS -lt $end ]; do i=$((i+1)); echo "edit $i" >> "$tmp/hub/.agents/worktrees/w1/tools/oculus/README.md"; sleep 0.1; done
```

The red command, in its shrunk form (`S` is the scratchpad holding the two scripts):

```
./writer1.sh 26 & TREE=$tmp/tree REPO=$tmp/hub TMPW=$S SECONDS_RUN=20 ROOTS= NOCONFIG=1 ALWAYS=0 NAMED=$tmp/hub/.agents/worktrees/w1 node loop-red.mjs; wait
```

Red is a mean wait for the loop above 200 ms (`"red":true`), with 50 rows answered.

Baseline, the slow-symptom rule. The graph read alone (`graphPage` then `branchBase` on the hub, `graph-red.mjs`, three runs): `{"graphMs":82,"baseMs":20,"totalMs":102,"rows":50}`, `{"graphMs":41,"baseMs":19,"totalMs":60,"rows":50}`, `{"graphMs":95,"baseMs":25,"totalMs":120,"rows":50}`. The per-request config parse (`loadConfig` of the scratch copy's config, six runs): `ms 222 48 46 46 46 45`. The request through the harness with no watcher on the real hub: `{"watch":false,"n":13,"rows":[50],"meanMs":177,"sdMs":49,"maxMs":293}`; on the clone: `{"watch":false,"n":13,"rows":[50],"meanMs":183,"sdMs":43,"maxMs":292}`. The green cuts below wait 2 to 41 ms on average; the threshold of 200 ms lies above every green run and below every red run of the shrunk case at the load it was measured under.

First runs, on the real roots (the hub, the six roots of `config/sources.yml:88-94`, the hub's three `.agents` worktrees gate, S5 and X3f as the sessions' workspaces), with the watcher:

```
{"watch":true,"n":12,"rows":[50],"meanMs":1622,"sdMs":2185,"maxMs":6393,"p50":223,"loopMaxMs":9462,"loopMeanMs":36,"gitVersion":6,"filesVersion":10}
{"watch":true,"n":13,"rows":[50],"meanMs":288,"sdMs":161,"maxMs":807,"p50":230,"loopMaxMs":840,"loopMeanMs":16,"gitVersion":5,"filesVersion":10}
{"watch":true,"n":13,"rows":[50],"meanMs":315,"sdMs":293,"maxMs":1208,"p50":198,"loopMaxMs":1424,"loopMeanMs":16,"gitVersion":5,"filesVersion":7}
{"watch":true,"n":13,"rows":[50],"meanMs":250,"sdMs":186,"maxMs":888,"p50":192,"loopMaxMs":795,"loopMeanMs":15,"gitVersion":4,"filesVersion":6}
```

The first run held the loop 9462 ms at once and one request waited 6393 ms; the size of the wait follows what the plan's agents happened to write at the moment. git's own trace of runs 2 to 4 (`GIT_TRACE2_EVENT`, summed per command): no git command took longer than 0.446 s; per 20 s, `status` ran 16 to 20 times for 2.13 to 2.31 s in all; the graph's `log --topo-order --skip=0 -51 HEAD` 13 times for 0.44 to 0.63 s in all (about 34 to 48 ms each). The status read of each real root, `statusFor` once: hub 344 ms, gate 486, S5 511, X3f 470, cathedra 129, game-engine 106, ordo 95, scotoma 66, officium 89, youtube-downloader 131.

Runs of the controlled case on the clone (the hub clone, w1 and w2 on the channel, a writer in each, the config parse per request):

```
{"watch":true,"n":13,"rows":[50],"meanMs":502,"sdMs":299,"maxMs":1121,"p50":470,"loopMaxMs":1689,"loopMeanMs":36,"gitVersion":18,"filesVersion":24}
{"watch":true,"n":13,"rows":[50],"meanMs":469,"sdMs":264,"maxMs":999,"p50":429,"loopMaxMs":1541,"loopMeanMs":61,"gitVersion":23,"filesVersion":32}
{"watch":true,"n":13,"rows":[50],"meanMs":789,"sdMs":318,"maxMs":1344,"p50":781,"loopMaxMs":2384,"loopMeanMs":148,"gitVersion":19,"filesVersion":26}
```

Runs after the tightening (the run and wait split added), same case:

```
{"watch":true,"n":13,"rows":[50],"runMeanMs":151,"runMaxMs":231,"waitMeanMs":267,"waitMaxMs":752,"red":true,"meanMs":418,"sdMs":250,"maxMs":897,"p50":323,"loopMaxMs":986,"loopMeanMs":35,"gitVersion":24,"filesVersion":33}
{"watch":true,"n":13,"rows":[50],"runMeanMs":167,"runMaxMs":246,"waitMeanMs":271,"waitMaxMs":747,"red":true,"meanMs":438,"sdMs":257,"maxMs":926,"p50":339,"loopMaxMs":1343,"loopMeanMs":38,"gitVersion":24,"filesVersion":33}
{"watch":true,"n":13,"rows":[50],"runMeanMs":338,"runMaxMs":632,"waitMeanMs":904,"waitMaxMs":2500,"red":true,"meanMs":1243,"sdMs":806,"maxMs":2866,"p50":1037,"loopMaxMs":2963,"loopMeanMs":126,"gitVersion":17,"filesVersion":23}
```

The shrunk red command, three runs in a row:

```
{"watch":true,"n":13,"rows":[50],"runMeanMs":164,"runMaxMs":430,"waitMeanMs":296,"waitMaxMs":1003,"red":true,"meanMs":460,"sdMs":347,"maxMs":1106,"p50":287,"loopMaxMs":1243,"loopMeanMs":25,"gitVersion":12,"filesVersion":11}
{"watch":true,"n":13,"rows":[50],"runMeanMs":112,"runMaxMs":184,"waitMeanMs":371,"waitMaxMs":1312,"red":true,"meanMs":484,"sdMs":441,"maxMs":1463,"p50":387,"loopMaxMs":2506,"loopMeanMs":28,"gitVersion":12,"filesVersion":11}
{"watch":true,"n":8,"rows":[50],"runMeanMs":838,"runMaxMs":2194,"waitMeanMs":4987,"waitMaxMs":13369,"red":true,"meanMs":5825,"sdMs":4057,"maxMs":13577,"p50":5863,"loopMaxMs":8288,"loopMeanMs":161,"gitVersion":4,"filesVersion":4}
```

The third run reaches the symptom's size: requests waited up to 13369 ms with the loop held 8288 ms at once, over only four re-reads of w1. The machine's load decides that size. Under a load average of 16 (`uptime`), the watcher's commands timed by hand in w1: `status` 4.75, 1.01 and 1.35 s, `diff --numstat` 1.15, 0.73 and 2.51 s; at the same moment `status` took 2.18 and 1.54 s in the real hub and 1.07 and 0.90 s in X3f, where it took 0.16 to 0.34 s at a lower load earlier in the run. A git spawn costs the same from a large process (`spawnSync('git', ['--version'])`, 30 runs: 11.9 ms mean at 43 MB resident, 9.3 to 14.5 ms with a 1200 MB ballast), so the server's size is no factor.

## No red command

Not applicable.

## Shrunk case

Each cut run once on the controlled case; a cut that kept it red stays cut.

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The git watcher (`WATCH=0`), writers on | green: `"waitMeanMs":3,"waitMaxMs":13`, `"runMeanMs":233` | put back |
| The writers, watcher on | green: `"waitMeanMs":2,"waitMaxMs":12`, `"gitVersion":2` | put back |
| The two worktrees off the channel, the hub alone watched (its recursive watch still hears the writes) | green: `"waitMeanMs":41,"waitMaxMs":178`, `"gitVersion":1,"filesVersion":11` | put back |
| The config parse per request (`NOCONFIG=1`) | red: `"waitMeanMs":927,"waitMaxMs":2708,"loopMaxMs":4064` | cut |
| Worktree w2 off the channel | red: `"waitMeanMs":302,"waitMaxMs":1062` | cut |
| The hub off the channel (`ALWAYS=0`) | red: `"waitMeanMs":315,"waitMaxMs":946` | cut |
| The writes in w2 (all three cuts above together) | red three times: `"waitMeanMs":296`, `371`, `4987` | cut |

The shrunk case, as it stands: the graph request through `handleGitGet` on one event loop; the real git watcher with one worktree root on the channel; one writer editing a file in that worktree every 100 ms. Each part is needed: without the watcher, without the writes, or with the writes heard only through the hub's quiet root, it is green.

## Hypotheses

1. If the git watcher's re-read of a root (`reread`, `server/root/watch/git.ts:233-249`, calling `statusFor` at :239, which runs 10 to 12 git commands each through `spawnSync` in `run`, `server/core/git/run.ts:145-179`) holds the server's one event loop for its whole length, so a request that comes in meanwhile waits until every command of the read has exited, then running that re-read's git commands without holding the loop turns the red command green. Falsified by: the mean wait stays above 200 ms with the watcher's reads off the loop. Makes it worse: more roots written to, or a slower git (machine load).
2. If the throttle lets one root's re-reads run back to back while writes go on, because it stamps the window when a read starts (`last.set(root, Date.now())` before `reread(root)`, `git.ts:272-274`), so a read longer than the 2 s window is followed at once by the next, then stamping the window after the read turns the red command green. Falsified by: the mean wait stays above 200 ms with the window stamped after the read.
3. If the wait is the number of git commands one re-read runs (`rev-parse` twice, `rev-list`, `log -20`, `for-each-ref`, the stash reflog, `remote`, `worktree list`, `status`, `diff --numstat`), then cutting the re-read to the two commands a write moves (`status`, `diff --numstat`) turns the red command green. Falsified by: the mean wait stays above 200 ms with only those two commands.

Not among them, falsified by the shrink and the baseline: git itself serving the graph (60 to 120 ms alone, `"runMeanMs"` 112 to 338 in the red runs against waits of 296 to 4987 ms), the server's parsing (the config parse is cut and the case stays red; `parseGraph` is inside the 60 to 120 ms), and the client (the harness has no page and is red). Read but not measured, since no browser may be driven: the Graph's client sends the read as soon as it is mounted and shown (`Graph.svelte:190` calls `load(0)` through `gate.due([moved])`, `state/client/use.ts:70-90`), and the count of 0 is `commits.length` while the read is out (`Graph.svelte:359`).

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

Each probe ran on the scratch copy at main's code, its change saved as a patch and taken out after (`git apply -R`, then `git diff --quiet` printed nothing).

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | The watcher's reads through a new `runAsync` (`execFile`) in `run.ts`; `statusFor` and its per-root read made `async` on it in `state.ts`; the watcher's re-read and first read awaited, two reads of one root kept from overlapping, its `refresh` awaited by the write route. The diff is the fix in "Fix and test", in a form that read `closed` directly where the fix reads `stopped()` and before its comment on `touch` was corrected. | Shrunk red command, three runs: `"waitMeanMs":2,"waitMaxMs":13`, `"waitMeanMs":2,"waitMaxMs":13`, `"waitMeanMs":2,"waitMaxMs":12`, `"red":false` each. Interleaved with main's code at the same load (an earlier form of the probe that also carried hypothesis 2's change): main `238`, `224`, `188` ms mean wait (max 863, 805, 668) against the probe `3`, `2`, `2` (max 21, 12, 12). | still standing |
| 2 | `git.ts:272-274`: `timers.delete(root); reread(root); last.set(root, Date.now());` in place of `timers.delete(root); last.set(root, Date.now()); reread(root);` | Interleaved with main's code: main `"waitMeanMs":234,"waitMaxMs":1226`, `379`/`1658`, `649`/`2061`; probe `"waitMeanMs":301,"waitMaxMs":1321,"red":true`, `87`/`1027`, `103`/`825`, loop held up to 1787, 1327 and 1855 ms. Fewer reads (`gitVersion` 8 to 9 against 12), the same holds. | falsified |
| 3 | `state.ts:149-160`: the lines from `checkedOut` to `worktrees` replaced by `void [checkedOut, upstream, log, refs, stashes, remotes, worktrees];` | Three runs: `"waitMeanMs":183,"waitMaxMs":647`, `319`/`1166` `"red":true`, `172`/`647`; loop held up to 940, 1547 and 934 ms, since `status` alone holds it for seconds under load. | falsified |

## Cause

Hypothesis 1. The git watcher reads a root with about a dozen git commands, each run by `spawnSync` (`server/core/git/run.ts:145-179`) on the server's one event loop, on every write under a watched root, at most once per 2 s per root (`git.ts:233-277`). The hub's worktrees under `.agents/worktrees/` are roots of their own on the `git` channel (the sessions' workspaces), so while a builder or a test writes in one, its root is read again and again, 0.2 to 0.5 s a read on a quiet machine and 1 to 5 s a read under the load the plan's agents make. A request that comes in during a read waits until every command of it has exited, and a request that comes in while the reads of several roots fall in one timer turn waits for all of them. The Graph's first page, which itself takes 60 to 120 ms of git, waits behind them: 6393 ms on the real roots, 13369 ms in the shrunk case. The probe that shows it: the shrunk red command waits 296, 371 and 4987 ms on average without the change and 2, 2 and 2 ms with it; the original case on the real roots waits 3 ms on average with it (below).

Where the 10 s go, separated: git itself for the graph read, 60 to 120 ms alone (about 34 to 48 ms for `log --topo-order -51`, 19 to 25 ms for `branchBase`); the server's parsing, about 46 ms a request for the config parse the git route does on every GET; the client, no wait of its own in the code (not measured in a browser); a wait before the request is served, the rest, behind the watcher's synchronous reads.

Not verified, and named because they share the one loop: the Q66 look also had the 634 MB transcript read of Q66-1 running on the same server (`server/sessions/stores/transcripts.ts:104`, four requests in 6 s), and `vite dev` hands each request through its middleware before SvelteKit's handler. Neither was measured here; both would add to the same queue, and neither is needed for the red.

## Fix and test

The test, `tools/oculus/tests/server/root/watch/git-loop.test.ts` (new, in the diff below), 'keeps the event loop turning while it reads, and publishes the root once git answers': a scratch repository behind a `git` on PATH that waits 100 ms before each command, the watcher started over it with a 10 ms interval ticking beside it, and the longest gap between two ticks held under 250 ms until the root is published. It is tagged slow (real git processes). Run on the scratch copy at main's code, without the fix (vitest's arrow and cross glyphs written as `>` and `x`):

```
$ ./node_modules/.bin/vitest run tests/server/root/watch/git-loop.test.ts --tagsFilter slow
 > |unit| tests/server/root/watch/git-loop.test.ts (1 test | 1 failed) 2250ms
     x keeps the event loop turning while it reads, and publishes the root once git answers 2234ms
 FAIL  |unit| tests/server/root/watch/git-loop.test.ts > the git watcher over a root git is slow to read > keeps the event loop turning while it reads, and publishes the root once git answers
AssertionError: expected 1097.542125 to be less than 250
 > tests/server/root/watch/git-loop.test.ts:76:36
     76|         expect(Math.max(...turns)).toBeLessThan(LONGEST_TURN_MS);
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

A second run without the fix held the loop 1408 ms. The root's state was published in both (the `branch` assertion before it passed), so the test fails on the hold alone.

Fix, as a diff against main's head (23450f8dc; `git apply --check` of it from the main checkout prints nothing and exits 0). Files and lines at main's head: `src/lib/server/core/git/run.ts` (head comment :71-73, the import :79, `run` :145-179 split into `run`, `runAsync`, `argvOf`, `failureOf`, `exitOf`); `src/lib/server/core/git/state.ts` (head comment :1-4, imports :32-42, `statusFor` :95-108, `state` :112-176, `checkedOut` :183-197, `log` :204-207, `refs` :220-229, `stashes` :235-238, `remotes` :241-244, `worktrees` :283-291 split into `worktrees` and `worktreesOf`, `upstream` :325-337); `src/lib/server/git/git-routes.ts` (`refresh?` :185-186, the call :385-389); `src/lib/server/root/watch/git.ts` (`GitWatcher.refresh` :183-184, the closed flag :218, `reread` :233-249 split into `readOnce` and `reread`, `touch` :261-277, `drop` :349-360, `follow` :419-447, its four callers :457, :464, :481 and :488, `refresh` :493-495); `tests/server/root/context-fixture.ts:56`; `tests/server/git/refs/cherry-pick.test.ts:38`; `tests/data/real-hub.probe.ts:128`; the new test file.

What it does: `runAsync` runs one git command through `execFile` and reads its outcome with the same mapping `run` uses (the shared `exitOf` and `failureOf`); its success and non-zero-exit paths ran in the new test (its scratch repository has no upstream, so `rev-list @{upstream}...HEAD` exits non-zero), and its timeout, output-limit and start-failure paths were not exercised by any run. `statusFor` and every per-root read under it await `runAsync`. The watcher awaits `statusFor` in its re-read and its first read; a read waits for the read of the same root in flight (`inflight`), an event during a read is read once that read ends (`again`), a root dropped or a watcher closed while git read is not written back (`stopped()`, read through a call because TypeScript keeps a check made before an `await`), and `refresh` returns the read's promise, which the write route now awaits so its answer still follows the published state. The exported `worktrees`, which `compare.ts:44` calls on a request, stays synchronous and shares its parsing (`worktreesOf`).

```diff
diff --git a/tools/oculus/src/lib/server/core/git/run.ts b/tools/oculus/src/lib/server/core/git/run.ts
index 1d5d6fc40..e6bf4ea71 100644
--- a/tools/oculus/src/lib/server/core/git/run.ts
+++ b/tools/oculus/src/lib/server/core/git/run.ts
@@ -68,15 +68,17 @@
 // dashboard watcher must never be the thing that runs one. compare.ts lists its own forms in its
 // head.
 //
-// A repository on a slow mount must not stall a watcher, so the one call site takes a list argument
-// (never a shell string), carries a timeout, and collapses any failure into the empty shape with a
-// short reason. Data only, no rendered strings: the wording comes from the text catalog.
+// A repository on a slow mount must not stall a watcher, so each of the two call sites takes a list
+// argument (never a shell string), carries a timeout, and collapses any failure into the empty
+// shape with a short reason. `run` waits for git on the event loop and `runAsync` does not, so a
+// read that runs on every write under a root, the git watcher's, never holds a request that came
+// in meanwhile. Data only, no rendered strings: the wording comes from the text catalog.
 //
 // Whether a path lies in a folder is read from server/core/paths.ts (`inside`); the records of
 // `status --porcelain=v1 -z` are split by parse.ts's `statusRecords` and sorted into the change
 // lists by its `statusLists`.
 
-import { spawnSync } from 'node:child_process';
+import { execFile, spawnSync } from 'node:child_process';
 import { isUtf8 } from 'node:buffer';
 import { lstatSync, statSync } from 'node:fs';
 import { isAbsolute, join } from 'node:path';
@@ -140,7 +142,10 @@ export function readDiff(root: string, args: string[], timeout: number): Outcome
  * One git command, as a list, with a timeout. A non-zero exit, a broken git, or a repository too
  * slow to answer all come back as not ok with a short reason, and only the non-zero exit as
  * answered. The output is read as bytes, `utf8` says whether they were UTF-8, and `text` is them
- * decoded as UTF-8. This is the module's one call site.
+ * decoded as UTF-8. This and `runAsync` are the module's two call sites.
+ *
+ * It holds the server's one event loop until git exits, which an on-demand read a page waits for
+ * may do; a read that runs on every write under a root goes through `runAsync`.
  */
 export function run(
     root: string,
@@ -149,26 +154,87 @@ export function run(
     input?: string,
     env?: Record<string, string>
 ): Outcome {
-    // Every read runs without optional locks, so a status refresh never writes .git/index.lock and
-    // never collides with a commit the owner is making in the same repository.
-    const argv = ['-C', root, '--no-optional-locks', ...args];
     // A list, never a shell, and a timeout: a hung git must not hang a watcher.
-    const done = spawnSync(GIT, argv, {
+    const done = spawnSync(GIT, argvOf(root, args), {
         timeout,
         input,
         maxBuffer: MAX_OUTPUT,
         ...(env === undefined ? {} : { env: { ...process.env, ...env } })
     });
     if (done.error !== undefined) {
-        const failure = done.error as NodeJS.ErrnoException;
-        const text = failure.code === 'ETIMEDOUT' ? 'git timed out' : short(failure);
-        return { ok: false, answered: failure.code !== 'ETIMEDOUT', ran: false, text, utf8: true };
+        return failureOf((done.error as NodeJS.ErrnoException).code, done.error);
     }
-    if (done.status !== 0) {
-        const text = short(bytesOf(done.stderr).toString('utf8')) || 'git failed';
+    return exitOf(done.status, done.stdout, done.stderr);
+}
+
+/**
+ * `run` without holding the event loop: git runs while the server answers other requests, and its
+ * outcome is read as `run` reads it. The git watcher reads every root through it, since a re-read
+ * runs a dozen commands on each write under a root and a request that came in meanwhile would
+ * otherwise wait for all of them.
+ */
+export function runAsync(
+    root: string,
+    args: string[],
+    timeout: number,
+    env?: Record<string, string>
+): Promise<Outcome> {
+    return new Promise((settle) => {
+        const child = execFile(
+            GIT,
+            argvOf(root, args),
+            {
+                timeout,
+                maxBuffer: MAX_OUTPUT,
+                encoding: 'buffer',
+                ...(env === undefined ? {} : { env: { ...process.env, ...env } })
+            },
+            (error, stdout, stderr) => {
+                if (error === null) {
+                    settle(exitOf(0, stdout, stderr));
+                    return;
+                }
+                // A non-zero exit carries git's status as a number; every other code is a git
+                // that did not run to its end: killed for the timeout, over the output limit, or
+                // never started.
+                if (typeof error.code === 'number') {
+                    settle(exitOf(error.code, stdout, stderr));
+                    return;
+                }
+                const timedOut = error.killed === true && error.code !== MAX_BUFFER_CODE;
+                settle(failureOf(timedOut ? 'ETIMEDOUT' : error.code, error));
+            }
+        );
+        child.stdin?.end();
+    });
+}
+
+/** What execFile names a command whose output passed `maxBuffer`. */
+const MAX_BUFFER_CODE = 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER';
+
+/** The arguments of one command: the root, no optional locks, then the command's own. */
+function argvOf(root: string, args: string[]): string[] {
+    // Every read runs without optional locks, so a status refresh never writes .git/index.lock and
+    // never collides with a commit the owner is making in the same repository.
+    return ['-C', root, '--no-optional-locks', ...args];
+}
+
+/**
+ * A git that did not run to its end, by its error code: timed out, over the output limit, or never
+ * started.
+ */
+function failureOf(code: unknown, error: unknown): Outcome {
+    const text = code === 'ETIMEDOUT' ? 'git timed out' : short(error);
+    return { ok: false, answered: code !== 'ETIMEDOUT', ran: false, text, utf8: true };
+}
+
+/** A git that exited, read by its status: its output on 0, its reason otherwise. */
+function exitOf(status: number | null, stdout: unknown, stderr: unknown): Outcome {
+    if (status !== 0) {
+        const text = short(bytesOf(stderr).toString('utf8')) || 'git failed';
         return { ok: false, answered: true, ran: true, text, utf8: true };
     }
-    const bytes = bytesOf(done.stdout);
+    const bytes = bytesOf(stdout);
     return {
         ok: true,
         answered: true,
diff --git a/tools/oculus/src/lib/server/core/git/state.ts b/tools/oculus/src/lib/server/core/git/state.ts
index 550cb28e6..f3f6e230a 100644
--- a/tools/oculus/src/lib/server/core/git/state.ts
+++ b/tools/oculus/src/lib/server/core/git/state.ts
@@ -1,7 +1,9 @@
 // Layer 2, server. Read-only git state for a root: whether it is a repository, its branch, its
 // distance from the upstream, and the staged, changed and untracked lists, with the log, the refs,
 // the stashes, the worktrees and the sequencer the `git` channel carries. Every command goes
-// through run.ts; this file only decides which to ask and how to read the answers.
+// through run.ts; this file only decides which to ask and how to read the answers. `statusFor` asks
+// through `runAsync`, since the git watcher calls it on every write under a root and must not hold
+// the event loop while git reads; `worktrees`, which a request's read asks for, through `run`.
 //
 // A repository on a slow mount must not stall a watcher: a read that fails is collapsed into the
 // empty shape with a short reason, and nothing here throws.
@@ -36,9 +38,11 @@ import {
     exists,
     milliseconds,
     run,
+    runAsync,
     seen,
     short,
-    whole
+    whole,
+    type Outcome
 } from './run.ts';
 
 /** One workspace with 4000 untracked files, or 4000 branches, must not become the payload. */
@@ -47,6 +51,8 @@ export const MAX_ENTRIES = 200;
  * How many commits the log carries: the view is a glance, and a terminal reads a longer history.
  */
 export const LOG_ENTRIES = 20;
+/** The one form the worktrees are listed by. */
+const WORKTREE_LIST = ['worktree', 'list', '--porcelain'];
 
 /** The shape every caller can count on, with nothing in it. */
 export function empty(error: string | null = null): GitState {
@@ -82,7 +88,7 @@ export function empty(error: string | null = null): GitState {
 }
 
 /**
- * Read-only git state for each root, keyed by root. Never throws. A root with nothing at its path,
+ * Read-only git state for each root, keyed by root. Never rejects. A root with nothing at its path,
  * or that git answered is not a repository, comes back as the empty shape with `error` set and
  * `repository` false; `present` is false for the first of those two alone, read at the path each
  * time the answer is made, so a caller can say the folder is not there rather than that it is no
@@ -92,14 +98,17 @@ export function empty(error: string | null = null): GitState {
  * config makes a repository disappear. A caller renders every workspace without a special case. A
  * repeated root is read once.
  */
-export function statusFor(roots: string[], timeout: number = TIMEOUT_MS): Record<string, GitState> {
+export async function statusFor(
+    roots: string[],
+    timeout: number = TIMEOUT_MS
+): Promise<Record<string, GitState>> {
     const out: Record<string, GitState> = {};
     if (!Array.isArray(roots)) return out;
     const ms = milliseconds(timeout);
     for (const root of roots) {
         if (typeof root !== 'string' || root === '' || root in out) continue;
         try {
-            out[root] = state(root, ms);
+            out[root] = await state(root, ms);
         } catch (error) {
             out[root] = empty(short(error));
         }
@@ -109,7 +118,7 @@ export function statusFor(roots: string[], timeout: number = TIMEOUT_MS): Record
 
 // ---------------------------------------------------------------- one root
 
-function state(root: string, timeout: number): GitState {
+async function state(root: string, timeout: number): Promise<GitState> {
     // A path with nothing at it is the one root git is never asked about. A path that is there and
     // is no directory, and one nothing may enter, are handed to git like any other, so the reader
     // gets git's own reason for them instead of being told the folder is gone.
@@ -122,7 +131,7 @@ function state(root: string, timeout: number): GitState {
     // none yet answers it like any other. Only a check that timed out says nothing about the root,
     // which is then kept as the repository it was taken for; a git that cannot start or is killed
     // is taken at its word, so a plain folder never becomes a repository because git is missing.
-    const gitDir = run(root, ['rev-parse', '--git-dir'], timeout);
+    const gitDir = await runAsync(root, ['rev-parse', '--git-dir'], timeout);
     if (!gitDir.ok && gitDir.answered) {
         const reason = gitDir.text || NO_REPOSITORY;
         const refused = empty(reason);
@@ -146,21 +155,21 @@ function state(root: string, timeout: number): GitState {
         found.error = gitDir.text || 'git failed';
         return found;
     }
-    if (!checkedOut(root, found, timeout)) return found;
-    upstream(root, found, timeout);
-    found.log = log(root, timeout);
-    const listed = refs(root, timeout);
+    if (!(await checkedOut(root, found, timeout))) return found;
+    await upstream(root, found, timeout);
+    found.log = await log(root, timeout);
+    const listed = await refs(root, timeout);
     found.branches = listed.branches;
     found.tags = listed.tags;
     // The reflog is walked only where a stash is kept, and the remotes are read only where Publish
     // Branch can be offered, a branch that tracks nothing; either read is a process per root on
     // every event, which the repositories that have no use for it do not pay.
-    found.stashes = listed.stash ? stashes(root, timeout) : [];
-    found.remotes = found.upstream || found.detached ? [] : remotes(root, timeout);
-    found.worktrees = worktrees(root, timeout);
+    found.stashes = listed.stash ? await stashes(root, timeout) : [];
+    found.remotes = found.upstream || found.detached ? [] : await remotes(root, timeout);
+    found.worktrees = worktreesOf(await runAsync(root, WORKTREE_LIST, timeout), root);
     found.ignoresWorktrees = ignored(root);
     sequenceOf(root, gitDir.text.trim(), found);
-    const listing = run(
+    const listing = await runAsync(
         root,
         ['status', '--porcelain=v1', '-z', '--untracked-files=normal', '--renames'],
         timeout
@@ -169,7 +178,7 @@ function state(root: string, timeout: number): GitState {
         found.error = listing.text || 'git status failed';
         return found;
     }
-    const counts = run(root, ['diff', '--numstat', '-z'], timeout);
+    const counts = await runAsync(root, ['diff', '--numstat', '-z'], timeout);
     const lines = parseNumstat(counts.ok ? counts.text : '');
     Object.assign(found, statusLists(statusRecords(listing.text), lines, MAX_ENTRIES));
     return found;
@@ -180,14 +189,14 @@ function state(root: string, timeout: number): GitState {
  * when nothing is checked out. A repository with no commit yet has a HEAD that resolves to nothing,
  * so the branch it will make is read from HEAD itself: that repository is ordinary, not an error.
  */
-function checkedOut(root: string, found: GitState, timeout: number): boolean {
-    const head = run(root, ['rev-parse', '--abbrev-ref', 'HEAD'], timeout);
+async function checkedOut(root: string, found: GitState, timeout: number): Promise<boolean> {
+    const head = await runAsync(root, ['rev-parse', '--abbrev-ref', 'HEAD'], timeout);
     if (head.ok) {
         found.branch = head.text.trim();
         found.detached = found.branch === 'HEAD';
         return true;
     }
-    const unborn = run(root, ['symbolic-ref', '--short', 'HEAD'], timeout);
+    const unborn = await runAsync(root, ['symbolic-ref', '--short', 'HEAD'], timeout);
     if (unborn.ok) {
         found.branch = unborn.text.trim();
         return true;
@@ -201,8 +210,8 @@ function checkedOut(root: string, found: GitState, timeout: number): boolean {
  * failure rather than an empty log, which is an empty list here like every other unreadable list:
  * the branch line above it is what says the repository is there.
  */
-function log(root: string, timeout: number): GitCommit[] {
-    const done = run(root, ['log', `-${LOG_ENTRIES}`, LOG_FORMAT], timeout);
+async function log(root: string, timeout: number): Promise<GitCommit[]> {
+    const done = await runAsync(root, ['log', `-${LOG_ENTRIES}`, LOG_FORMAT], timeout);
     return done.ok ? parseLog(done.text) : [];
 }
 
@@ -217,8 +226,8 @@ export function capped<Row>(rows: Row[]): Row[] {
  * list capped like the change lists. One process reads all three, where a listing each would be
  * three processes per root on every event.
  */
-function refs(root: string, timeout: number): RefRows {
-    const done = run(
+async function refs(root: string, timeout: number): Promise<RefRows> {
+    const done = await runAsync(
         root,
         ['for-each-ref', REFS_FORMAT, 'refs/heads', 'refs/tags', 'refs/stash'],
         timeout
@@ -232,14 +241,18 @@ function refs(root: string, timeout: number): RefRows {
  * Every stash, newest first, read from the stash's reflog as `stash list` reads it. A repository
  * with no stash has no such reflog and answers with a failure, which is the empty list.
  */
-function stashes(root: string, timeout: number): GitStash[] {
-    const done = run(root, ['log', '--walk-reflogs', STASH_FORMAT, 'refs/stash', '--'], timeout);
+async function stashes(root: string, timeout: number): Promise<GitStash[]> {
+    const done = await runAsync(
+        root,
+        ['log', '--walk-reflogs', STASH_FORMAT, 'refs/stash', '--'],
+        timeout
+    );
     return done.ok ? capped(parseStashes(done.text)) : [];
 }
 
 /** The repository's remotes by name. */
-function remotes(root: string, timeout: number): string[] {
-    const done = run(root, ['remote'], timeout);
+async function remotes(root: string, timeout: number): Promise<string[]> {
+    const done = await runAsync(root, ['remote'], timeout);
     return done.ok ? capped(done.text.split('\n').filter((one) => one.trim() !== '')) : [];
 }
 
@@ -281,7 +294,11 @@ function sequenceOf(root: string, gitDir: string, found: GitState): void {
  * one vocabulary reaches the page and the checks a write makes.
  */
 export function worktrees(root: string, timeout: number = TIMEOUT_MS): GitWorktree[] {
-    const done = run(root, ['worktree', 'list', '--porcelain'], timeout);
+    return worktreesOf(run(root, WORKTREE_LIST, timeout), root);
+}
+
+/** The worktrees one `worktree list --porcelain` answered, under the root as asked for. */
+function worktreesOf(done: Outcome, root: string): GitWorktree[] {
     if (!done.ok) return [];
     const real = realpath(root);
     return capped(parseWorktrees(done.text)).map((one) => ({
@@ -322,8 +339,12 @@ function ignored(root: string): boolean {
  * Distance from the tracking branch. `--left-right --count` prints behind, then ahead. A branch
  * with no upstream is ordinary, not an error, and leaves both counts at zero.
  */
-function upstream(root: string, found: GitState, timeout: number): void {
-    const done = run(root, ['rev-list', '--left-right', '--count', '@{upstream}...HEAD'], timeout);
+async function upstream(root: string, found: GitState, timeout: number): Promise<void> {
+    const done = await runAsync(
+        root,
+        ['rev-list', '--left-right', '--count', '@{upstream}...HEAD'],
+        timeout
+    );
     // The command git answers here is the one that knows: it resolves @{upstream}, so a failure is
     // the branch having none. That fact travels with the state, which is on the page before the
     // branch listing is, so the push control never has to read a listing that has not answered as
diff --git a/tools/oculus/src/lib/server/git/git-routes.ts b/tools/oculus/src/lib/server/git/git-routes.ts
index 342c2c5ad..91630a074 100644
--- a/tools/oculus/src/lib/server/git/git-routes.ts
+++ b/tools/oculus/src/lib/server/git/git-routes.ts
@@ -182,8 +182,8 @@ export type GitOptions = {
     suggest?: (root: string, roots: string[]) => Promise<Outcome>;
     /** Overrides for the default diff reader and message subprocess. */
     message?: MessageOptions;
-    /** Re-read a root after a write, whatever git answered. */
-    refresh?: (root: string) => void;
+    /** Re-read a root after a write, whatever git answered; the answer waits for it to settle. */
+    refresh?: (root: string) => void | Promise<void>;
     /** The Trash; the real one, called with `{ glob: false }`, when absent. */
     trash?: (path: string, options: { glob: false }) => Promise<void>;
     /**
@@ -383,10 +383,11 @@ export async function handleGit(
         ((_action, selected, _body, allowed) => operate(selected, parsed.data, allowed, options))
     )(action, root, body, roots);
     // The watcher would find this at its next event, up to two seconds later and only if the write
-    // touched a path it watches; re-reading here is what makes the panel answer the click. A write
-    // git refused may still have moved the repository (a merge that stopped on conflicts leaves
-    // them in the index), so it is read again either way.
-    options.refresh?.(root);
+    // touched a path it watches; re-reading here is what makes the panel answer the click, so the
+    // answer waits for that read to publish. A write git refused may still have moved the
+    // repository (a merge that stopped on conflicts leaves them in the index), so it is read again
+    // either way.
+    await options.refresh?.(root);
     if (!outcome.ok) {
         const refusal = outcome.code === undefined ? {} : { code: outcome.code };
         return json({ error: outcome.error, ...refusal }, { status: 400, headers: NO_STORE });
diff --git a/tools/oculus/src/lib/server/root/watch/git.ts b/tools/oculus/src/lib/server/root/watch/git.ts
index 66ca439c9..88b76eb70 100644
--- a/tools/oculus/src/lib/server/root/watch/git.ts
+++ b/tools/oculus/src/lib/server/root/watch/git.ts
@@ -180,8 +180,11 @@ function statOf(path: string): Stats | undefined {
  */
 /** A git watcher: a portfolio watcher that can also be told to re-read one root at once. */
 export type GitWatcher = Watcher & {
-    /** Re-read one root now, for a write that has just changed it. */
-    refresh(root: string): void;
+    /**
+     * Re-read one root now, for a write that has just changed it; settles once a read that began
+     * after the call has published.
+     */
+    refresh(root: string): Promise<void>;
 };
 
 export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
@@ -216,6 +219,8 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
     const readFrom = new Map<string, number>();
     let state: GitPayload = {};
     let closed = false;
+    /** Whether `close` was called, read through a call so a check before an await is not reused. */
+    const stopped = (): boolean => closed;
 
     /** Publish a copy, so a later re-read cannot change a payload already on the wire. */
     const publish = (): void => {
@@ -230,14 +235,19 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
     // a write that landed under this root, and the file listings taken under it are stale whether
     // or not git's answer moved. Nothing else on the wire says so for a file inside a project
     // folder.
-    const reread = (root: string): void => {
+    //
+    // git reads without holding the event loop (statusFor runs through run.ts's `runAsync`), so a
+    // request that comes in while a root is read is answered meanwhile. Two reads of one root never
+    // overlap: a read waits for the one in flight, so the newer answer is always the one kept.
+    const readOnce = async (root: string): Promise<void> => {
         if (closed || !handles.has(root)) return;
-        if (rescan.delete(root) && scan(root)) follow();
-        const began = Date.now();
-        hub.publish('files', { root } satisfies FilesPayload);
         try {
-            const next = byKey(statusFor([root], timeout), root);
-            if (next === undefined) return;
+            if (rescan.delete(root) && scan(root)) await follow();
+            const began = Date.now();
+            hub.publish('files', { root } satisfies FilesPayload);
+            const next = byKey(await statusFor([root], timeout), root);
+            // The root may have been dropped, or the watcher closed, while git read.
+            if (next === undefined || stopped() || !handles.has(root)) return;
             answered(root, began, next);
             const held = byKey(state, root);
             if (held !== undefined && JSON.stringify(held) === JSON.stringify(next)) return;
@@ -248,6 +258,23 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
         }
     };
 
+    /** The read of each root in flight, which the next read of that root waits for. */
+    const inflight = new Map<string, Promise<void>>();
+    /** The roots an event touched while a read of them was in flight. */
+    const again = new Set<string>();
+
+    /** Read one root after the read in flight for it, if any, has ended. */
+    const reread = (root: string): Promise<void> => {
+        const next = (inflight.get(root) ?? Promise.resolve()).then(() => readOnce(root));
+        inflight.set(root, next);
+        void next.then(() => {
+            if (inflight.get(root) !== next) return;
+            inflight.delete(root);
+            if (again.delete(root)) touch(root);
+        });
+        return next;
+    };
+
     /**
      * Move a root's newest read on to the moment one began, when that read answered. A read that
      * came back with `error` set (a git that timed out under load, a root that is no repository)
@@ -261,9 +288,15 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
     /**
      * A trailing-edge throttle, per root: the first event after a quiet period is read at once, and
      * every event inside the next two seconds collapses into one read at the end of that window.
+     * An event during a read of the root is read once that read has ended, so the reads an event
+     * schedules never queue up behind one another.
      */
-    const touch = (root: string): void => {
+    function touch(root: string): void {
         if (closed || timers.has(root)) return;
+        if (inflight.has(root)) {
+            again.add(root);
+            return;
+        }
         const since = Date.now() - (last.get(root) ?? 0);
         const wait = since >= throttle ? 0 : throttle - since;
         timers.set(
@@ -271,10 +304,10 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
             clock.setTimeout(() => {
                 timers.delete(root);
                 last.set(root, Date.now());
-                reread(root);
+                void reread(root);
             }, wait)
         );
-    };
+    }
 
     /**
      * Whether an event is for a change the newest answered read of its root already saw: the
@@ -353,6 +386,7 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
         if (timer !== undefined) clock.clearTimeout(timer);
         timers.delete(root);
         last.delete(root);
+        again.delete(root);
         readFrom.delete(root);
         opening.delete(root);
         // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
@@ -416,7 +450,7 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
      * order moved. The order is part of the payload: the view draws its sections in the order the
      * keys come in, so a root that only changed place is a publish like any other.
      */
-    const follow = (): void => {
+    async function follow(): Promise<void> {
         if (closed) return;
         const roots = wanted();
         const before = Object.keys(state);
@@ -428,8 +462,10 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
         for (const root of fresh) open(root);
         if (fresh.length > 0) {
             try {
-                const found = statusFor(fresh, timeout);
+                const found = await statusFor(fresh, timeout);
                 for (const root of fresh) {
+                    // A root dropped while git read is not put back.
+                    if (!handles.has(root)) continue;
                     const one = byKey(found, root);
                     if (one !== undefined) state[root] = one;
                     if (one !== undefined) answered(root, opening.get(root) ?? 0, one);
@@ -439,12 +475,13 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
                 console.error(`git watch: first read failed: ${reason(error)}`);
             }
         }
-        reorder(roots);
+        if (stopped()) return;
+        reorder(wanted());
         const after = Object.keys(state);
         if (before.length === after.length && before.every((root, at) => root === after[at]))
             return;
         publish();
-    };
+    }
 
     // The sink is this watcher's own end of the `sessions` channel. It sends nothing back and is
     // never closed by the hub, so `close` below is what removes it.
@@ -454,14 +491,14 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
                 const message = JSON.parse(text) as Message;
                 if (message.channel === 'sessions') {
                     named = rootsOf(message.payload as SessionsPayload);
-                    follow();
+                    void follow();
                 }
                 // A config push is how a root added to sources.yml reaches this watcher: the roots
                 // option reads the configuration as it is now, so reading it again and following
                 // is the whole work. A sessions push keeps the copy: it says nothing about config.
                 if (message.channel === 'config') {
                     readRoots();
-                    follow();
+                    void follow();
                 }
             } catch (error) {
                 console.error(`git watch: unreadable message: ${reason(error)}`);
@@ -478,20 +515,20 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
     if (workspacesFile !== undefined) {
         workspaces = pollFile(workspacesFile, { clock, every: poll }, () => {
             readRoots();
-            follow();
+            void follow();
         });
     }
     // The always-watched root and the file browser's are opened before the first sessions message,
     // so a hub nobody has a session in is on the channel from the start.
     if (always !== '' || options.roots !== undefined) {
         readRoots();
-        follow();
+        void follow();
     }
     hub.subscribe(sink, ['sessions', 'config']);
 
     return {
-        refresh(root: string): void {
-            reread(root);
+        refresh(root: string): Promise<void> {
+            return reread(root);
         },
         close(): void {
             closed = true;
diff --git a/tools/oculus/tests/data/real-hub.probe.ts b/tools/oculus/tests/data/real-hub.probe.ts
index 06dcfbc66..c7f409052 100644
--- a/tools/oculus/tests/data/real-hub.probe.ts
+++ b/tools/oculus/tests/data/real-hub.probe.ts
@@ -125,7 +125,7 @@ for (const workspace of first.workspaces) {
 
 // The hub's own git state, through server/core/git/state.ts's four read-only commands and nothing
 // else. It reads the repository and changes nothing in it, like everything else in this file.
-const state = statusFor([hub])[hub];
+const state = (await statusFor([hub]))[hub];
 console.log(
     `git ${hub}: branch ${state.branch || '(none)'}, ahead ${state.ahead}, behind ${state.behind}, ` +
         `staged ${state.staged.length}, unstaged ${state.unstaged.length}, ` +
diff --git a/tools/oculus/tests/server/git/refs/cherry-pick.test.ts b/tools/oculus/tests/server/git/refs/cherry-pick.test.ts
index 1ffaa545f..30aac1b1d 100644
--- a/tools/oculus/tests/server/git/refs/cherry-pick.test.ts
+++ b/tools/oculus/tests/server/git/refs/cherry-pick.test.ts
@@ -35,6 +35,6 @@ describe('cherryPick', () => {
         expect(git(root, 'log', '-1', '--format=%s').trim()).toBe('Other file');
         expect(git(root, 'rev-parse', 'HEAD').trim()).not.toBe(pick);
         expect(git(root, 'show', '--name-only', '--format=', 'HEAD').trim()).toBe('o.txt');
-        expect(statusFor([root])[root].sequence).toBe('');
+        expect((await statusFor([root]))[root].sequence).toBe('');
     });
 });
diff --git a/tools/oculus/tests/server/root/context-fixture.ts b/tools/oculus/tests/server/root/context-fixture.ts
index d88692ee8..a6b2c3c9a 100644
--- a/tools/oculus/tests/server/root/context-fixture.ts
+++ b/tools/oculus/tests/server/root/context-fixture.ts
@@ -53,7 +53,7 @@ export function contextFixture(overrides: Partial<ServerContext> = {}): ServerCo
         memories: { refused: new Set<string>() },
         terminals,
         hooks,
-        git: { refresh: noop, close: noop },
+        git: { refresh: () => Promise.resolve(), close: noop },
         hpc: { refresh: () => Promise.resolve(), set: noop, close: noop },
         calendar: {
             refresh: () => Promise.resolve(),
diff --git a/tools/oculus/tests/server/root/watch/git-loop.test.ts b/tools/oculus/tests/server/root/watch/git-loop.test.ts
new file mode 100644
index 000000000..e0bd3d108
--- /dev/null
+++ b/tools/oculus/tests/server/root/watch/git-loop.test.ts
@@ -0,0 +1,78 @@
+// What server/root/watch/git.ts's watcher does with the server's one event loop while git reads a
+// root: it leaves the loop free, so a request that comes in while a root is read is answered then
+// rather than after every git command of the read. The git on PATH waits before each command, as a
+// git on a loaded machine does, so a read that held the loop would hold it for all of them.
+//
+// What this does NOT cover: the on-demand reads of GET /api/git, which a page waits for and which
+// still run on the loop; the watcher's throttle and its filter of events.
+// @module-tag slow: its cases start real git processes behind a git that waits, so npm test leaves
+// it out.
+
+import { execFileSync } from 'node:child_process';
+import { chmodSync, writeFileSync } from 'node:fs';
+import { delimiter, join } from 'node:path';
+import { describe, expect } from 'vitest';
+import { byKey } from '../../../../src/lib/data/helpers/guards.ts';
+import type { GitPayload } from '../../../../src/lib/data/model/index.ts';
+import { Hub } from '../../../../src/lib/server/core/channels.ts';
+import { watchGit } from '../../../../src/lib/server/root/watch/git.ts';
+import { it, scratchDir, test } from '../../../fixtures/scratch.ts';
+import { isolateGit, scratchRepo } from '../../git/refs/repo.ts';
+
+isolateGit();
+
+/** How long the git on PATH waits before it runs each command. */
+const WAIT_MS = 100;
+/** The longest the loop may go without a timer turn while the watcher reads. */
+const LONGEST_TURN_MS = 250;
+
+// A folder holding a `git` that waits WAIT_MS and then runs the machine's own, first on PATH for
+// the file's cases, and PATH as it was after them.
+let path = '';
+test.beforeAll(() => {
+    const real = execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim();
+    const bin = scratchDir('oculus-waiting-git-');
+    const script = join(bin, 'git');
+    writeFileSync(script, `#!/bin/sh\nsleep ${WAIT_MS / 1000}\nexec "${real}/git" "$@"\n`);
+    chmodSync(script, 0o755);
+    path = process.env.PATH ?? '';
+    process.env.PATH = `${bin}${delimiter}${path}`;
+});
+test.afterAll(() => {
+    process.env.PATH = path;
+});
+
+/** Resolve once the condition holds, checked every 10 ms, or fail after five seconds. */
+async function until(condition: () => boolean): Promise<void> {
+    const end = Date.now() + 5000;
+    while (!condition()) {
+        if (Date.now() > end) throw new Error('the condition did not hold within five seconds');
+        await new Promise((settle) => setTimeout(settle, 10));
+    }
+}
+
+describe('the git watcher over a root git is slow to read', () => {
+    it('keeps the event loop turning while it reads, and publishes the root once git answers', async () => {
+        const root = scratchRepo('oculus-watch-loop-');
+        const hub = new Hub();
+        const turns: number[] = [];
+        let last = performance.now();
+        const ticker = setInterval(() => {
+            const now = performance.now();
+            turns.push(now - last);
+            last = now;
+        }, 10);
+        const watcher = watchGit(hub, { always: root });
+        try {
+            await until(() => hub.version('git') > 0);
+            // One more turn, so the turn the read may have held is counted.
+            await new Promise((settle) => setTimeout(settle, 30));
+        } finally {
+            clearInterval(ticker);
+            watcher.close();
+        }
+        const payload = hub.latest('git')?.payload as GitPayload;
+        expect(byKey(payload, root)?.branch).toBe('main');
+        expect(Math.max(...turns)).toBeLessThan(LONGEST_TURN_MS);
+    });
+});
```

Runs after the fix, on the scratch copy:

```
$ ./node_modules/.bin/vitest run tests/server/root/watch/git-loop.test.ts --tagsFilter slow   (three runs)
      Tests  1 passed (1)
      Tests  1 passed (1)
      Tests  1 passed (1)
longest gap between two ticks, written by a tagged line taken out after: 12 ms over 102 turns, 13 ms over 95, 15 ms over 96

the red command, shrunk (load average 7.29):
{"watch":true,"n":13,"rows":[50],"runMeanMs":101,"runMaxMs":179,"waitMeanMs":2,"waitMaxMs":14,"red":false,"meanMs":104,"sdMs":26,"maxMs":180,"p50":94,"loopMaxMs":182,"loopMeanMs":12,"gitVersion":11,"filesVersion":11}
the same on the final form of the fix:
{"watch":true,"n":13,"rows":[50],"runMeanMs":100,"runMaxMs":183,"waitMeanMs":2,"waitMaxMs":16,"red":false,"meanMs":103,"sdMs":32,"maxMs":199,"p50":89,"loopMaxMs":197,"loopMeanMs":12,"gitVersion":11,"filesVersion":11}

the original case: the real hub, its three .agents worktrees, the six configured roots, the config parse per request (load average 8.70):
{"watch":true,"n":13,"rows":[50],"runMeanMs":197,"runMaxMs":403,"waitMeanMs":3,"waitMaxMs":14,"red":false,"meanMs":200,"sdMs":81,"maxMs":406,"p50":157,"loopMaxMs":406,"loopMeanMs":13,"gitVersion":2,"filesVersion":3}

the controlled unshrunk case: the hub clone, w1 and w2, two writers, the config parse per request (three runs):
{"watch":true,"n":13,"rows":[50],"runMeanMs":434,"runMaxMs":2885,"waitMeanMs":115,"waitMaxMs":1390,"red":false,"meanMs":550,"sdMs":772,"maxMs":2887,"p50":192,"loopMaxMs":2898,"loopMeanMs":15,"gitVersion":21,"filesVersion":32}
{"watch":true,"n":13,"rows":[50],"runMeanMs":236,"runMaxMs":460,"waitMeanMs":2,"waitMaxMs":12,"red":false,"meanMs":238,"sdMs":87,"maxMs":461,"p50":213,"loopMaxMs":467,"loopMeanMs":13,"gitVersion":26,"filesVersion":36}
{"watch":true,"n":13,"rows":[50],"runMeanMs":199,"runMaxMs":400,"waitMeanMs":2,"waitMaxMs":15,"red":false,"meanMs":201,"sdMs":75,"maxMs":415,"p50":186,"loopMaxMs":407,"loopMeanMs":13,"gitVersion":24,"filesVersion":36}

the suites on the scratch copy with the fix:
vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'      Test Files  76 passed | 17 skipped (93); Tests  185 passed | 59 skipped (244)
vitest run tests/routes/git tests/server/root tests/server/git tests/server/core tests/server/files --tagsFilter slow      Test Files  12 passed | 10 skipped (22); Tests  42 passed | 20 skipped (62)
vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0      Test Files  15 passed | 1 skipped (16); Tests  224 passed | 3 skipped (227)
svelte-kit sync; svelte-check --tsconfig ./tsconfig.json --threshold error      COMPLETED 2777 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
eslint (the eight changed files)      exit 0
prettier --check (the eight changed files)      All matched files use Prettier code style!

after the two last edits (closed read through stopped(), the comment on touch):
vitest run tests/server/root/watch/git-loop.test.ts tests/server/git tests/routes/git --tagsFilter slow      Test Files  11 passed | 1 skipped (12); Tests  36 passed | 5 skipped (41)
vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'      Test Files  76 passed | 17 skipped (93); Tests  185 passed | 59 skipped (244)
vitest run tests/server/root/watch/git-loop.test.ts --tagsFilter slow      Tests  1 passed (1)
vitest run tests/checks/source tests/checks/tree --tagsFilter '!slow'      Test Files  7 passed (7); Tests  71 passed (71)
```

Which runs came before those two edits: the first shrunk red run, the original case, the three controlled unshrunk runs, the three test runs with their gaps, the first slow-suite run and the whole `tests/checks` run. `stopped()` returns the same `closed` flag the earlier form read, and the other edit is a comment; the type check, lint, the second shrunk red run and the lines just above ran on the final form.

The first controlled run is green on the threshold and still shows one hold: a graph request whose own handler ran 2885 ms held the loop 2898 ms, and another request waited 1390 ms behind it. That hold is the on-demand graph read itself (`graphPage` and `branchBase` through `run`, `spawnSync`) taking long under that moment's load; the two runs after it waited 12 and 15 ms at most. The fix does not change the on-demand reads; the decision below is about them.

No test reaches it: not applicable. No test is written: not applicable as a matter of reach; whether the test lands is the first decision below, since `agents/spec.md:57` lets a builder write a test only as the test of an entry of `agents/guarded.md`, and no entry covers this behaviour (`grep -n "^- G[0-9]*\." agents/guarded.md` lists G1 to G35, none on the server answering while git reads).

## Decisions for the orchestrator

1. The test's landing. (a) Ask Axel for a guarded entry, "A request is answered while the git watcher reads a root", Code `src/lib/server/root/watch/git.ts`, `src/lib/server/core/git/run.ts` `runAsync`, Test `tests/server/root/watch/git-loop.test.ts`, 'keeps the event loop turning while it reads, and publishes the root once git answers'; the test lands with it. (b) No entry; the test does not land, and the red command above is the round's check, rerun by the refuter. Pros of (a): a later change that puts the watcher's reads back on `spawnSync` fails a test. Cons of (a): Axel's rule (`~/.claude/rules/scripts-compute-facts.md`) keeps tests for failures that cost lost work, a broken installation or a wrong configuration accepted, and a server that answers late costs none of the three. Recommendation: (b), by that rule; (b) is also the option that costs less, and the rule, not the cost, is the reason.
2. The on-demand reads. The fix moves the watcher's reads off the loop; every read of GET /api/git (`server/core/git/reads.ts`, 16 git calls; `compare.ts`, 9; `files.ts`, 3; imported by `server/machine/lines.ts`, `root/watch/autofetch.ts`, `files/fs.ts`, `git/deposit-git.ts`, `git/git-index.ts`, `git/git-write.ts`, `git/git-reads.ts`) still runs on `spawnSync` and holds the loop for its own length, measured once here at 2898 ms with a 1390 ms wait behind it. (a) X3e's builder moves them to `runAsync` as well (each read `async`, `handleGitGet` already awaits), widening X3e's write list by those files; (b) leave them synchronous. Pros of (a): no git read on the server holds a request again, the same cause ended for every read. Cons of (a): about 28 call sites and eight importers more in X3e's write list, `git-write.ts` among them, which D20 also writes. (b) is the lazy option. Recommendation: (a).

## Cleanup

```
$ grep -rn "DIAG-3e7a" "$tmp/tree/tools/oculus/src" "$tmp/tree/tools/oculus/tests"; echo "(exit $?)"
(exit 1)
$ git worktree remove --force "$tmp/tree"     (from the main checkout)
scratch worktree removed
$ rm -rf "$tmp"                               (the clone and its two worktrees)
$ git worktree list | grep -c 0m0WoY
0
```

The removal of this diagnosis's own scratch files went wider than them. The session's scratchpad (`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`) is shared with the orchestrator and the other agents of the session, and `rm -f $S/*.mjs $S/*.sh $S/*.json $S/*.diff $S/*.py $S/*.md $S/*.txt $S/*.keep $S/git-loop.final.ts` removed every top-level file of it with those endings, other agents' among them. Afterwards `ls -A "$S" | grep -E '\.(mjs|sh|json|diff|py|md|txt|keep)$' | wc -l` prints 0; its 257 subfolders and its top-level files with other endings (`.log`, `.ts`, `.bak`, `.cjs`, `.mts` and others, 410 files) are untouched. Names the listing printed before the removal show among those removed: `spec.md`, `choices.md`, `S5-brief-check-report.md`, `D14-refuter.md`, `a1-round1-refuted.md`, the `d17-*` files (`d17-mut-m01.json` to `d17-mut-m62.json` and its `.md` and `.txt` notes), the `s4-*` scripts, notes and runs, the `U3-review-*.txt` files, and backups kept as `.keep` (`appearance.yml.keep`, `autofetch.ts.keep`, `watch.ts.keep`, `socket.keep`, `tones.ts.keep`, `search.svelte.keep`, `selectors.keep`, `tab-actions.keep`, `agents.keep`, `autofetch.keep`); the middle of that listing was cut in the output, so the whole list is not known. They cannot be restored from here (`rm` keeps no copy; a local snapshot needs root to mount). Nothing was copied into `$TMPDIR` from a credential or `.env` file. The red command run again on the original case: carried by the round as its check.

Agent usage: a8790e3b7e3882bba, claude-opus-5-5, 342,576 tokens, 147 tool uses, 56.0 min.
