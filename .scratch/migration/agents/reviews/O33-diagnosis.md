# Diagnosis: a hidden Transcript tab hits effect_update_depth_exceeded on each write of its session's file

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. No quoted output below held a secret. In every quoted vitest output, vitest's pass and fail marks are written `PASS` and `FAIL`, its arrow `->` and its ellipsis `...`, so the record stays ASCII. A diagnosis of the same step later is appended below under its own heading at the level of the title above.

Diagnosis agent: af9bf8786db8217ac, claude-opus-5-5, 121,563 tokens, 135 tool uses, 55.9 min (both diagnoses).

## Symptom

Part (12) of step O33, `tools/oculus/.scratch/migration/plan.md` line 495, first half, word for word: "a hidden Transcript tab hits Svelte's `effect_update_depth_exceeded` each time its session's file is written (the effect in `Transcript.svelte` through `follow`, `refetch`, `deferRefetch` and `invalidate` of `state/client/queries/queries.svelte.ts`)". The part ends "each cause found by a red run first (ruling Z902)". The look that found it is `agents/reviews/owed-looks.md` line 30; its captured stack, `$TMPDIR/q72look/transcript-loop.txt` lines 17-27, runs `bump` <- `invalidate` <- `deferRefetch` <- `refetch` <- `follow` <- `scoped` <- `$effect (Transcript.svelte:221:3)`, then `Svelte error: effect_update_depth_exceeded`. The same look opened an agent row's Transcript tab (owed-looks.md line 29: "An agent row (probe-max) opened a Transcript tab of the agent's own transcript").

## Where the probes run

A scratch detached worktree `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.tbjn5m/tree` at HEAD 69252f5d9 ("Land Q72, the architecture re-read and its carried fixes"), made from the main checkout with `git worktree add --detach`, nothing applied, `node_modules` from `npm ci` in `tools/oculus`. The final fix, the final test and their runs under "Fix and test" ran in a second scratch worktree at the same commit, `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.PY7hry/tree`, made the same way. The paths redirected under `$TMPDIR`: `HOME` set to `<scratch>/home` for every vitest run, since `vite.config.ts` reads `~/.oculus` through `defaultStateFolder()` to pick its port. No server was started, no port was opened, no file of the main checkout was changed.

## Red command

The real `Transcript.svelte` mounted under jsdom in vitest's `client` project (the file names `// @vitest-environment jsdom`), over the real `createQueries()` and `createTranscripts()`, the tab's copy of the store made by `scopedStore(queries, store, () => shown.get())` as `state/client/use.ts` `provideTabState` makes it, `fetch` stubbed with a turn, the stores the view reads beside the transcripts stubbed, and the view wrapped in `bits-ui`'s `Tooltip.Provider`. The instance's state is `{ agent: 'a1' }` (a tab opened from an agent row) and the record's agent row reads `status: 'running'`. The case mounts the tab shown, waits for its first read to land, hides it (`shown.set(false)`), then hands a new record of the session twice (`record.set(structuredClone(after)); flushSync()`), which is what a sessions message does when the session's file is written. Each write is caught when it throws or logs `effect_update_depth_exceeded`, and the functions on the logged trace are printed.

```
HOME=$tmp/home npx vitest run --project client tests/state/sessions/transcript-mounted.client.test.ts --reporter verbose --silent=false -t 'a running agent'
```

The test's assertion is `expect(loops).toEqual([])`, `loops` holding each write that hit the error; the printed line per write is `DIAG-7e31 write <n>: <effect_update_depth_exceeded | no loop> | trace through: <the functions of follow, refetch, deferRefetch, invalidate, bump found on the logged stack>`.

Runs, with the output of each quoted (the file's second case, the session's own transcript, ran beside it in these three runs):

```
== run 1
DIAG-7e31 write 1: no loop | trace through:
DIAG-7e31 write 2: no loop | trace through:
DIAG-7e31 write 1: effect_update_depth_exceeded | trace through: follow refetch deferRefetch invalidate bump
DIAG-7e31 write 2: effect_update_depth_exceeded | trace through: follow refetch deferRefetch invalidate bump
 PASS |client| tests/state/sessions/transcript-mounted.client.test.ts > the mounted Transcript view, hidden, takes a write of its session file without an update loop > 'the session\'s own transcript' 141ms
 FAIL |client| tests/state/sessions/transcript-mounted.client.test.ts > the mounted Transcript view, hidden, takes a write of its session file without an update loop > 'a running agent of the session' 7783ms
   -> expected [ 'write 1', 'write 2' ] to deeply equal []
      Tests  1 failed | 1 passed (2)
== run 2
DIAG-7e31 write 1: no loop | trace through:
DIAG-7e31 write 2: no loop | trace through:
DIAG-7e31 write 1: effect_update_depth_exceeded | trace through: follow refetch deferRefetch invalidate bump
DIAG-7e31 write 2: effect_update_depth_exceeded | trace through: follow refetch deferRefetch invalidate bump
 PASS ... 'the session\'s own transcript' 146ms
 FAIL ... 'a running agent of the session' 8035ms
   -> expected [ 'write 1', 'write 2' ] to deeply equal []
      Tests  1 failed | 1 passed (2)
== run 3
DIAG-7e31 write 1: no loop | trace through:
DIAG-7e31 write 2: no loop | trace through:
DIAG-7e31 write 1: effect_update_depth_exceeded | trace through: follow refetch deferRefetch invalidate bump
DIAG-7e31 write 2: effect_update_depth_exceeded | trace through: follow refetch deferRefetch invalidate bump
 PASS ... 'the session\'s own transcript' 135ms
 FAIL ... 'a running agent of the session' 8386ms
   -> expected [ 'write 1', 'write 2' ] to deeply equal []
      Tests  1 failed | 1 passed (2)
```

Red on three runs in a row. The same red came first from a harness without a DOM (`tests/state/sessions/transcript-hidden.client.test.ts`, the view's script copied into a `.svelte.ts` helper and run in an effect root): its agent case printed `DIAG-7e31 thrown: effect_update_depth_exceeded console.error calls: 1` and failed on each of three runs, its own-transcript case passed on each.

Parts of the reported symptom, with whether the red command catches each:

| Part of the symptom | Caught by the red command | Lines read, for a part not caught | Reproduced |
|---|---|---|---|
| "a hidden Transcript tab hits Svelte's `effect_update_depth_exceeded`" | yes for a tab of a running subagent: `expect(loops).toEqual([])` red, `loops` = `['write 1', 'write 2']`; no for a tab of the session's own transcript, whose case is green | `transcript.svelte.ts:197` `if (marks[slot] === mark) return;` with the own tab's mark `record?.lastActivity` (`Transcript.svelte:95`): a rerun of the effect for the same message hands the same lastActivity, so `follow` returns before `refetch` and nothing is written | yes for an agent tab; the own tab is not reproduced, for the reason in the column before |
| "each time its session's file is written" | yes: two writes in one case, each red (`write 1`, `write 2`) | not applicable | yes, caught |
| "(the effect in `Transcript.svelte` through `follow`, `refetch`, `deferRefetch` and `invalidate` ...)" | shown, not asserted: every red run prints `trace through: follow refetch deferRefetch invalidate bump` from the logged stack | not applicable | yes, the same chain as the look's `transcript-loop.txt` lines 17-25 |

Runs after the tightening (the case cut to the agent case alone through `-t`, `fetch` and `ResizeObserver` stubbed, `HOME` under `$TMPDIR`; the time of a red run is Svelte's own 1000 effect runs with its dev traces, about 4 s per write, and cannot be cut while the symptom is that loop):

```
$ red.sh   (the command above)
DIAG-7e31 write 1: effect_update_depth_exceeded | trace through: follow refetch deferRefetch invalidate bump
DIAG-7e31 write 2: effect_update_depth_exceeded | trace through: follow refetch deferRefetch invalidate bump
 FAIL |client| tests/state/sessions/transcript-mounted.client.test.ts > ... > 'a running agent of the session' 8444ms
   -> expected [ 'write 1', 'write 2' ] to deeply equal []
      Tests  1 failed | 1 skipped (2)
```

## No red command

not applicable

## Shrunk case

The cuts ran on the view's script without its markup, in an effect root (`tests/state/sessions/transcript-shrink.client.test.ts` over `transcript-cut.svelte.ts`, a copy of `Transcript.svelte`'s script with each part switchable); each row is one cut of the whole case, the cumulative rows marked.

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| the markup, the child components and the DOM (the harness instead of the mounted view) | red: `DIAG-7e31 whole case: RED effect_update_depth_exceeded` | cut |
| the `showing` effect | red: `cut: the showing effect: RED effect_update_depth_exceeded` | cut |
| the count effect (the third effect) | not separable: with it cut nothing reads `held`, `turnsFor` never runs and no first read is made (`expected "vi.fn()" to be called 1 times, but got 0 times`); covered by the next two rows | see below |
| the shown phase (the tab hidden from its start) | green: `cut: the shown phase (hidden from the start): GREEN no loop` | put back as "an answer held for the key", see the next row |
| the fetch and the `turnsFor` read, with the answer held up front by `queries.hold` instead | red: `cut: the fetch and the turnsFor read (answer held up front): RED effect_update_depth_exceeded` | cut |
| the hide (the tab stays shown) | green: `cut: the hide (tab stays shown): GREEN no loop` | put back |
| the write of the session file (no new record) | green: `cut: the write of the session file: GREEN no loop` | put back |
| the agent running (row status `completed`) | green: `cut: the agent running (status completed): GREEN no loop` | put back |
| cumulative shrunk case: held answer, the follow effect only, hidden, running, one write | red: `shrunk: held answer, follow effect only, hidden, running, one write: RED effect_update_depth_exceeded` | kept |
| shrunk, cut: the held answer | green: `shrunk, cut: the held answer: GREEN no loop` | put back |
| shrunk, cut: the write | green: `shrunk, cut: the write: GREEN no loop` | put back |
| shrunk, cut: the agent running | green: `shrunk, cut: the agent running: GREEN no loop` | put back |
| shrunk, cut: the hidden scope (shown) | green: `shrunk, cut: the hidden scope (shown): GREEN no loop` | put back |

The shrunk case, as it stands: an answer held for the agent's query key; the first effect of `Transcript.svelte` alone (the one that calls `follow`), for a tab whose saved state pins an agent; the tab's copy of the store reading the tab as hidden; the agent's row in the record reading `running`; one new record of the session handed after the first run. Each one is needed for the red.

## Hypotheses

1. If the agent tab's follow mark is a counter that moves on every run of the effect (`Transcript.svelte:99` `` `running ${beat++}` ``, `let beat = 0` at `:85`), so that a rerun the effect makes for any reason hands `follow` a new mark and passes its check at `transcript.svelte.ts:197`, while `follow` reads the query's tick (`queries.peek` at `transcript.svelte.ts:200`, `track` at `queries.svelte.ts:90-91`) and the hidden refetch writes it (`deferRefetch` `:241-245` calls `invalidate(key, true)`, which bumps the tick at `:134`, `bump` at `:78-79`), then making the mark move only when a new record arrives turns the red command green. Falsified by: the red command still red with the mark moving once per record.
2. If `follow` subscribing its calling effect to the tick through `queries.peek` (`transcript.svelte.ts:200`) is what makes the write wake the effect, then reading that peek untracked turns the red command green. Falsified by: the red command still red with the peek untracked.
3. If the hidden refetch wakes the readers on every call even when the key is already marked (`queries.svelte.ts:244-245`, `else if (client.getQueryState(key) !== undefined) invalidate(key, true)`), then marking and waking only a key not yet marked turns the red command green. Falsified by: the red command still red with that change.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | `Transcript.svelte`: after `let beat = 0;` add `let beaten: unknown = null;`; in the effect replace ``const mark = row?.status === 'running' ? `running ${beat++}` : ...`` with `if (record !== beaten) { beaten = record; beat += 1; }` and ``const mark = row?.status === 'running' ? `running ${beat}` : ...`` (the counter moves once per record, per tab) | red command: `DIAG-7e31 write 1: no loop`, `write 2: no loop`, `PASS ... 'a running agent of the session' 124ms`. Other inputs: every row right except `late second tab, both hidden at the write`: `DIAG-7e31 other input: effect_update_depth_exceeded, fetches before the write: 3, in 300 ms after it: 0`, `FAIL ... -> expected true to be false` | still standing; its change broke the other input "a second tab of the same running agent opened after a message, both hidden", where the two tabs' counters differ and `follow`'s one mark per transcript (`marks[slot]`) is set to each tab's count in turn |
| 1, again, as Steps 15 says | the mark of a running agent is the record itself and `follow` compares marks by identity: `Transcript.svelte` drops `beat` and reads `const mark = row?.status === 'running' ? record : ...`; `transcript.svelte.ts` types the mark `unknown` (`follow: (id: string, mark: unknown, agent?: string) => void`, `const marks: Record<string, unknown>`, `const mark = given ?? ''`). The diff is the "Fix" below, without the comment lines | red command: `DIAG-7e31 write 1: no loop`, `write 2: no loop`, `PASS ... 'a running agent of the session' 120ms`, `Tests 1 passed`. Every other input right (table below) | still standing, every other input right |
| 2 | `transcript.svelte.ts`: `import { untrack } from 'svelte';` and line 200 `if (untrack(() => queries.peek<TurnsState>(key).data) === undefined \|\| !inBrowser()) return;` | `DIAG-7e31 write 1: effect_update_depth_exceeded \| trace through: follow refetch deferRefetch invalidate bump`, `write 2` the same, `FAIL ... 8321ms -> expected [ 'write 1', 'write 2' ] to deeply equal []` | falsified (the effect still reads the tick: `bump` reads `ticks[hash]` before writing it, `queries.svelte.ts:79`, inside the same call) |
| 3 | `queries.svelte.ts:244`: `} else if (client.getQueryState(key)?.isInvalidated === false) {` | red command: `write 1: no loop`, `write 2: no loop`, `PASS ... 125ms`. Other inputs: `agent running, shown`, `two tabs both shown`, `two tabs, one hidden`, `hidden, then shown`: each `fetches ... in 300 ms after it: 50` (the cap); `agent running, a second tab` and `late second tab, both hidden`: `fetches before the write: 51` | still standing for the hidden form only; it leaves five inputs that are part of the defect wrong, each with a request chain that does not end |

No probe added logging. The tag `DIAG-7e31` was on the red command's and the harnesses' result lines only. Each probe's change was undone after its run and `git status --short -- tools/oculus/src` printed nothing before the next probe.

## Cause

The cause is at `tools/oculus/src/lib/views/sessions/transcript/Transcript.svelte:99` (with `let beat = 0;` at `:85`): the mark an agent tab hands `follow` while its subagent runs is `` `running ${beat++}` ``, a counter that moves on every run of the effect and is held per tab. The rule it breaks, at the kind of value: a follow mark is a value of the sessions message: the same message gives the same mark in every tab and on every run of the effect, and the mark moves only when a new message arrives.

The effect runs again whenever the query tick it reads changes: `follow` reads the tick through `queries.peek` (`transcript.svelte.ts:200`, `track` at `queries.svelte.ts:90-91`), and the refetch it makes writes the tick (`queries.svelte.ts:134`, `bump` at `:78-79`). With a mark that moves on every run, each run passes `follow`'s check at `transcript.svelte.ts:197` and asks again. Hidden, the refetch is `deferRefetch` with nothing out (`queries.svelte.ts:241-245`), which marks the key and bumps the tick at once, so the effect reruns in the same flush until Svelte stops it at 1000 runs: the reported symptom. Shown, the refetch schedules a request; when it lands the query cache's events bump the tick, the effect reruns with a new mark and asks `again`, so a shown tab of a running agent asks for the agent's file without end after one message (50 requests, the stub's cap, in the runs below). Two tabs of the same agent that have seen different numbers of runs set `follow`'s one mark per transcript (`marks[slot]`, `transcript.svelte.ts:166`) to two different values in turn, so even a counter moved once per record loops.

The probe that shows it: the second probe of hypothesis 1 (the record itself as the mark, compared by identity); the red command is green with it and red without it. Hypothesis 3's change also turns the red command green, and is set aside as Steps 15 says: it names what the hidden form of the input gets wrong and leaves the five other inputs below wrong.

Places of the defect the fix covers: `Transcript.svelte:85` and `:99` (the mark), and `transcript.svelte.ts:88-95` (`TranscriptsStore.follow`'s type), `:166` (the marks record's type) and `:194-197` (the mark compared), which carry a mark that is not a string. Each other input and each place written as not fixed: none.

## Operation and other inputs

The operation that goes wrong: the derivation of the follow mark of an agent tab, `Transcript.svelte:99`, `` const mark = row?.status === 'running' ? `running ${beat++}` : `ended ${row?.ended ?? ''}`; ``.

The rule, stated at the kind of value: a follow mark is a value of the sessions message: the same message gives the same mark in every tab and on every run of the effect, and the mark moves only when a new message arrives.

Places of the defect:

1. `Transcript.svelte:99` with `:85`: the mark of a running agent moves on every run of the effect and differs between tabs.
2. none further: `follow` is called from `Transcript.svelte:95` and `:100` alone (`grep -rn '\.follow(\|follow:'` over `src` and `tests` found no other caller), and the own tab's mark at `:95` is `record?.lastActivity`, a value of the message. `transcript.svelte.ts:88-95`, `:166` and `:194-197` change type only, to carry the record as a mark.

Right result for every input below: no `effect_update_depth_exceeded`; a shown tab asks once per new message, a hidden tab asks nothing, and a tab shown again asks once. Each was run on the real view mounted as in the red command, the request count taken once the count stood still (`tests/state/sessions/transcript-others.client.test.ts`, then the test below).

| Other input | Why it reaches a place of the defect | Right result | Place at which it is wrong | Result on the tree without the fix | Result with the change of the probe that shows the cause | Class | Result after the fix |
|---|---|---|---|---|---|---|---|
| the session's own transcript tab, hidden, a write | `Transcript.svelte:94-96` hands `follow` the record's lastActivity | no loop, 0 requests after the write | none | right: `no update loop, fetches before the write: 1, in 300 ms after it: 0` | right, the same line | not part of the defect | right |
| an agent tab of an agent that ended, hidden, a write | `:99` hands `` `ended ${row?.ended}` `` | no loop, 0 requests | none | right: `no update loop, fetches before the write: 1, in 300 ms after it: 0` | right | not part of the defect | right |
| one agent tab of a running agent, shown, a write | `:99` | 1 request | place 1 | wrong: `no update loop, fetches before the write: 1, in 300 ms after it: 50` (the cap) | right: `in 300 ms after it: 1` | part of the defect | right: `{ before: 1, after: 1 }` |
| two tabs of the running agent, both shown | `:99`, one mark per transcript | 1 request | place 1 | wrong: `in 300 ms after it: 50` | right: `1` | part of the defect | right |
| two tabs, one hidden one shown | `:99` | 1 request | place 1 | wrong: `in 300 ms after it: 50` | right: `1` | part of the defect | right |
| one tab hidden at the write, shown after it | `:99`; showing reruns the effect | no loop, 1 request | place 1 | wrong: `effect_update_depth_exceeded, ... in 300 ms after it: 0` | right: `no update loop, ... 1` | part of the defect | right |
| a second tab of the running agent opened after one message, both shown | `:99`, the two tabs having seen different numbers of runs | 2 requests before the measured message, 1 after | place 1 | wrong: `fetches before the write: 51` | right: `before the write: 2, in 300 ms after it: 1` | part of the defect | right: `{ before: 2, after: 1 }` |
| the same, both hidden | `:99` | 2 before, 0 after, no loop | place 1 | wrong: `fetches before the write: 51` (the chain of the first message reached the cap) | right: `before the write: 2, in 300 ms after it: 0` | part of the defect | right: `{ before: 2, after: 0 }` |

## Fix and test

The failure costs something under the rules file's reading only once `agents/guarded.md` holds an entry for it: `agents/spec.md` says "A test exists only as the test of one entry of `agents/guarded.md`" and "A step that needs a new entry stops and asks Axel for it", and `guarded.md` line 3 says "Views have no entry: the look on TEST covers them". No entry covers the Transcript view or the transcripts store (`grep -n -i 'transcript' agents/guarded.md` names G40, G78 and G84, all server-side). The test below was written as this skill's Steps 16 asks, for a defect whose failure (a page that runs an effect 1000 times per message and, shown, sends requests without end) costs something; whether it is kept is the session's question to Axel (see "For the session" at the end of the record). The test mounts a view under jsdom inside a `*.client.test.ts` file through `// @vitest-environment jsdom`, which no file of the tree does today (`grep -rln 'vitest-environment' tests` printed nothing).

Test, run on the tree without the fix:

```
HOME=$tmp/home npx vitest run --project client tests/views/sessions/transcript/transcript-follow.client.test.ts --reporter verbose
 FAIL |client| ... > a running agent tab: 'one tab, hidden' 4040ms
   -> expected [ 'effect_update_depth_exceeded' ] to deeply equal []
 FAIL |client| ... > a running agent tab: 'one tab, shown' 50ms
   -> expected { before: 1, after: 50 } to deeply equal { before: 1, after: 1 }
 FAIL |client| ... > a running agent tab: 'one tab, hidden, then shown' 4037ms
   -> expected [ 'effect_update_depth_exceeded' ] to deeply equal []
 FAIL |client| ... > a running agent tab: 'two tabs, both shown' 51ms
   -> expected { before: 1, after: 50 } to deeply equal { before: 1, after: 1 }
 FAIL |client| ... > a running agent tab: 'two tabs, one hidden' 50ms
   -> expected { before: 1, after: 50 } to deeply equal { before: 1, after: 1 }
 FAIL |client| ... > a running agent tab: 'a tab opened late, both shown' 75ms
   -> expected { before: 51, after: +0 } to deeply equal { before: 2, after: 1 }
 FAIL |client| ... > a running agent tab: 'a tab opened late, both hidden' 76ms
   -> expected { before: 51, after: +0 } to deeply equal { before: 2, after: +0 }
      Tests  7 failed (7)
```

Places the fix covers: `Transcript.svelte:85` (the counter removed) and `:99` (the mark of a running agent is the record object, which the sessions channel hands anew with each message and every tab of the session reads as the same object: `selectors.svelte.ts:466-471` `grouped()` pushes the payload's own session objects and `sessionFor` at `:498-501` returns one of them); `transcript.svelte.ts` `TranscriptsStore.follow`'s type, the `marks` record's type and `follow`'s parameter, so the mark is compared by identity; the comments that described the counter rewritten.

Fix:

```diff
diff --git a/tools/oculus/src/lib/state/sessions/transcript.svelte.ts b/tools/oculus/src/lib/state/sessions/transcript.svelte.ts
index 517a0f824..c8ec2e0cd 100644
--- a/tools/oculus/src/lib/state/sessions/transcript.svelte.ts
+++ b/tools/oculus/src/lib/state/sessions/transcript.svelte.ts
@@ -90,7 +90,7 @@ const NO_BODY = { turns: [], offset: undefined, results: {} };
  */
 export type TranscriptsStore = {
     turnsFor: (id: string, agent?: string) => TurnsState;
-    follow: (id: string, lastActivity: string | null, agent?: string) => void;
+    follow: (id: string, mark: unknown, agent?: string) => void;
     showing: (id: string, agent?: string) => () => void;
     forget: (id: string, agent?: string) => void;
     hold: (id: string, turns: Turn[], offset?: number) => void;
@@ -162,8 +162,8 @@ async function tail(id: string, agent: string, held: TurnsState | undefined): Pr
 }
 
 export function createTranscripts(queries: Queries): TranscriptsStore {
-    /** The lastActivity each session was last asked at. */
-    const marks: Record<string, string | undefined> = {};
+    /** The mark each transcript was last asked at. */
+    const marks: Record<string, unknown> = {};
 
     /**
      * The turns of one session. The first call for a session asks the server for the whole file;
@@ -183,16 +183,19 @@ export function createTranscripts(queries: Queries): TranscriptsStore {
 
     /**
      * Read what has been appended since the last read, when the record says there is something.
-     * Called from the view's effect with the record's lastActivity: the first call for a session
-     * only notes the stamp, since the read turnsFor() scheduled already carries everything written
-     * up to it. A stamp that moves while a request is out asks again when it lands. A hidden tab
-     * only marks the turns, and asks once when it is shown.
+     * Called from the view's effect with a mark of the sessions message: the record's lastActivity
+     * for a session's own transcript, the record itself while a subagent runs. A mark is compared
+     * by identity, so the same message gives the same mark to every tab and every run of the
+     * effect. The first call for a session only notes the mark, since the read turnsFor()
+     * scheduled already carries everything written up to it. A mark that moves while a request is
+     * out asks again when it lands. A hidden tab only marks the turns, and asks once when it is
+     * shown.
      */
-    function follow(id: string, lastActivity: string | null, agent = ''): void {
+    function follow(id: string, given: unknown, agent = ''): void {
         if (id === '') return;
         const slot = slotOf(id, agent);
         const key = keyOf(id, agent);
-        const mark = lastActivity ?? '';
+        const mark = given ?? '';
         const first = marks[slot] === undefined;
         if (marks[slot] === mark) return;
         marks[slot] = mark;
diff --git a/tools/oculus/src/lib/views/sessions/transcript/Transcript.svelte b/tools/oculus/src/lib/views/sessions/transcript/Transcript.svelte
index 6382caf9c..f66dde5bd 100644
--- a/tools/oculus/src/lib/views/sessions/transcript/Transcript.svelte
+++ b/tools/oculus/src/lib/views/sessions/transcript/Transcript.svelte
@@ -81,13 +81,11 @@
     /** Pixels from the foot that still count as reading the newest turn. */
     const SLACK = 40;
 
-    /** How many sessions messages this tab has seen while its subagent runs. */
-    let beat = 0;
-
     // The record is read here, so this re-runs at each sessions message. A session's tab asks for
     // the tail when its lastActivity moves. A subagent's file grows while that stamp stands still,
-    // so an agent's tab hands a mark that moves at each message while the agent runs and once more
-    // when it ends.
+    // so while the agent runs an agent's tab hands the record itself, which the sessions channel
+    // hands anew with each message and every tab of the session reads as the same object, and once
+    // it ends the end it reports.
     $effect(() => {
         const id = sessionId;
         if (id === '') return;
@@ -96,7 +94,7 @@
             return;
         }
         const row = record?.agents.find((one) => one.id === agent);
-        const mark = row?.status === 'running' ? `running ${beat++}` : `ended ${row?.ended ?? ''}`;
+        const mark = row?.status === 'running' ? record : `ended ${row?.ended ?? ''}`;
         follow(id, mark, agent);
     });
 
```

For `premise`, the test's source as written, since `/spec` carries it into the brief after the scratch copy is removed. `tests/views/sessions/transcript/TranscriptHost.svelte`:

```svelte
<script lang="ts">
    // Layer 4, test helper. The Transcript view inside the tooltip provider the page root gives
    // every view, so a client case can mount it as a tab draws it.
    import { Tooltip } from 'bits-ui';
    import Transcript from '../../../../src/lib/views/sessions/transcript/Transcript.svelte';
    import type { ViewProps } from '../../../../src/lib/state/workbench/navigation/registry';

    let { instance }: ViewProps = $props();
</script>

<Tooltip.Provider>
    <Transcript {instance} />
</Tooltip.Provider>
```

`tests/views/sessions/transcript/transcript-follow.client.test.ts` (prettier and eslint clean in the scratch copy):

```ts
// @vitest-environment jsdom
// Layer 3, view tests. The Transcript view mounted as a tab draws it, over the real transcripts
// store and query client, while the sessions channel hands a new record of the session. A tab of a
// running subagent asks for the agent's file once per sessions message whether one tab or two show
// it, asks nothing while it is hidden and once when it is shown, and never runs its effect into
// Svelte's update loop. The stores the view reads beside the transcripts are stubs, the server's
// answer is a stub of `fetch`, and the text catalog answers every key with the key itself.

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, expect, it, vi } from 'vitest';
import {
    createQueries,
    scopedStore
} from '../../../../src/lib/state/client/queries/queries.svelte.ts';
import { STATE_KEY } from '../../../../src/lib/state/client/use.ts';
import { createTranscripts } from '../../../../src/lib/state/sessions/transcript.svelte.ts';
import { setCatalog, setGlyphs, setIcons } from '../../../../src/lib/state/shared/words/text.ts';
import { TIP_KEY, createTipIds } from '../../../../src/lib/ui/menu/tip-ids.ts';
import { cell } from '../../../ui/frame/rooted.svelte.ts';
import TranscriptHost from './TranscriptHost.svelte';

afterEach(() => vi.unstubAllGlobals());

/** Every key answers itself, as an own property, so `t()` and `glyph()` never throw. */
const KEYS = new Proxy(
    {},
    {
        get: (_target, key) => String(key),
        getOwnPropertyDescriptor: (_target, key) => ({
            value: String(key),
            configurable: true,
            enumerable: true,
            writable: true
        })
    }
) as Record<string, string>;
setCatalog(KEYS);
setGlyphs(KEYS);
setIcons(new Proxy({}, { get: () => '' }));

const TURN = {
    at: '2026-10-15T10:00:00Z',
    role: 'user',
    text: 'hi',
    html: '',
    cut: false,
    tool: null
};

/** Past this many requests the stub never answers, so a chain of requests that does not end stops. */
const CAP = 50;

type Record_ = {
    id: string;
    lastActivity: string | null;
    agents: { id: string; status: string }[];
};

/** A record of the session as one sessions message hands it: a new object each time. */
function message(): Record_ {
    return { id: 's1', lastActivity: 't0', agents: [{ id: 'a1', status: 'running' }] };
}

/** How each tab of a case stands at the write: shown, hidden, or hidden and shown after it. */
type Stand = 'shown' | 'hidden' | 'shown after';

type Row = { name: string; tabs: Stand[]; late: boolean; before: number; after: number };

// `before` is the requests made before the measured message, `after` those it makes. A tab opened
// late is opened after one more message, so its tab and the first have seen different counts of
// messages.
const ROWS: Row[] = [
    { name: 'one tab, hidden', tabs: ['hidden'], late: false, before: 1, after: 0 },
    { name: 'one tab, shown', tabs: ['shown'], late: false, before: 1, after: 1 },
    {
        name: 'one tab, hidden, then shown',
        tabs: ['shown after'],
        late: false,
        before: 1,
        after: 1
    },
    { name: 'two tabs, both shown', tabs: ['shown', 'shown'], late: false, before: 1, after: 1 },
    { name: 'two tabs, one hidden', tabs: ['hidden', 'shown'], late: false, before: 1, after: 1 },
    {
        name: 'a tab opened late, both shown',
        tabs: ['shown', 'shown'],
        late: true,
        before: 2,
        after: 1
    },
    {
        name: 'a tab opened late, both hidden',
        tabs: ['hidden', 'hidden'],
        late: true,
        before: 2,
        after: 0
    }
];

/** Yield to the event loop until the request count stands still for ten turns. */
async function settle(count: () => number): Promise<void> {
    let still = 0;
    let last = count();
    while (still < 10) {
        await new Promise((done) => setTimeout(done, 0));
        flushSync();
        still = count() === last ? still + 1 : 0;
        last = count();
    }
}

it.each(ROWS)(
    'a running agent tab: $name',
    async ({ tabs, late, before, after }) => {
        vi.stubGlobal(
            'ResizeObserver',
            class {
                observe = (): undefined => undefined;
                unobserve = (): undefined => undefined;
                disconnect = (): undefined => undefined;
            }
        );
        let offset = 10;
        const fetched = vi.fn(async (): Promise<Response> => {
            if (fetched.mock.calls.length > CAP) return new Promise<Response>(() => undefined);
            offset += 10;
            return new Response(JSON.stringify({ turns: [TURN], offset, results: {} }), {
                status: 200
            });
        });
        vi.stubGlobal('fetch', fetched);
        const loops: string[] = [];
        const logged = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
            const text = args
                .map((one) => (one instanceof Error ? one.message : String(one)))
                .join(' ');
            if (text.includes('effect_update_depth_exceeded')) loops.push(text.split('\n')[0]);
        });
        const queries = createQueries();
        const store = createTranscripts(queries);
        const record = cell<Record_ | null>(message());
        const open = (stand: Stand, at: number) => {
            const shown = cell(true);
            const client = {
                selectors: { sessionFor: () => record.get(), sessionsByWorkspace: () => [] },
                layout: {
                    instanceLayoutState: () => undefined,
                    pinInstance: () => undefined,
                    unpinInstance: () => undefined
                },
                selection: { select: () => undefined },
                terminals: { terminalOfSession: () => null },
                transcripts: scopedStore(queries, store, () => shown.get())
            };
            const target = document.createElement('div');
            document.body.append(target);
            const view = mount(TranscriptHost, {
                target,
                props: {
                    instance: { id: `i${at}`, view: 'transcript', state: { agent: 'a1' } }
                } as never,
                context: new Map<unknown, unknown>([
                    [STATE_KEY, client],
                    [TIP_KEY, createTipIds()]
                ])
            });
            return { view, shown, stand };
        };
        const write = (): void => {
            try {
                record.set(message());
                flushSync();
            } catch (error) {
                loops.push(error instanceof Error ? error.message.split('\n')[0] : String(error));
            }
        };
        const count = (): number => fetched.mock.calls.length;
        const open_ = tabs.slice(0, late ? 1 : tabs.length).map(open);
        flushSync();
        await settle(count);
        if (late) {
            write();
            await settle(count);
            open_.push(open(tabs[1], 1));
            flushSync();
            await settle(count);
        }
        const made = count();
        for (const tab of open_) tab.shown.set(tab.stand === 'shown');
        flushSync();
        write();
        for (const tab of open_) if (tab.stand === 'shown after') tab.shown.set(true);
        flushSync();
        await settle(count);
        logged.mockRestore();
        for (const tab of open_) void unmount(tab.view);
        expect(loops).toEqual([]);
        expect({ before: made, after: count() - made }).toEqual({ before, after });
    },
    30000
);
```

The test's limit of 30 s is for its run on the tree without the fix, where a hidden row takes about 4 s in Svelte's 1000 runs; with the fix each row runs in under 100 ms.

Runs after the fix:

```
HOME=$tmp/home npx vitest run --project client tests/views/sessions/transcript/transcript-follow.client.test.ts --reporter verbose
 PASS |client| ... > a running agent tab: 'one tab, hidden' 96ms
 PASS |client| ... > a running agent tab: 'one tab, shown' 35ms
 PASS |client| ... > a running agent tab: 'one tab, hidden, then shown' 33ms
 PASS |client| ... > a running agent tab: 'two tabs, both shown' 39ms
 PASS |client| ... > a running agent tab: 'two tabs, one hidden' 37ms
 PASS |client| ... > a running agent tab: 'a tab opened late, both shown' 65ms
 PASS |client| ... > a running agent tab: 'a tab opened late, both hidden' 63ms
      Tests  7 passed (7)

red command (transcript-mounted.client.test.ts, the agent case):
DIAG-7e31 write 1: no loop | trace through:
DIAG-7e31 write 2: no loop | trace through:
 PASS |client| ... > 'a running agent of the session' 118ms
      Tests  1 passed | 1 skipped (2)

the original, unshrunk case (the same file, both cases):
 PASS |client| ... > 'the session\'s own transcript' 146ms
 PASS |client| ... > 'a running agent of the session' 58ms
      Tests  2 passed (2)

the red command on each other input (transcript-others.client.test.ts, each row alone):
== own transcript, hidden          PASS  no update loop, fetches before the write: 1, in 300 ms after it: 0
== agent ended, hidden             PASS  no update loop, ... 1, ... 0
== agent running, shown            PASS  no update loop, ... 1, ... 1
== two tabs both shown             PASS  no update loop, ... 1, ... 1
== two tabs, one hidden            PASS  no update loop, ... 1, ... 1
== hidden, then shown              PASS  no update loop, ... 1, ... 1
== agent running, a second tab     PASS  no update loop, ... 2, ... 1
== late second tab, both hidden    PASS  no update loop, ... 2, ... 0

npx svelte-check --tsconfig ./tsconfig.json --threshold error
COMPLETED 4056 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npx eslint (the four changed source files and the two test files): no output
npx prettier --check (the same files): All matched files use Prettier code style!
```

No test reaches it: not applicable. No test is written: not applicable.

## Cleanup

```
grep -rn 'DIAG-7e31' <scratch>/tree --exclude-dir=node_modules --exclude=local.yml
```

After the throwaway test files were removed, the grep over each scratch tree printed only three lines of the committed `tools/oculus/.scratch/migration/agents/reviews/D77-diagnosis.md` (lines 205, 463, 622), which an earlier diagnosis wrote with the same tag; `grep -rn 'DIAG-7e31' <scratch>/tree/tools/oculus/src <scratch>/tree/tools/oculus/tests` printed nothing (exit 1). The tag was not unique to this diagnosis; no line of this run carries it outside the scratch copies, which are gone. Both scratch worktrees were removed with `git worktree remove --force` from the main checkout (`git worktree list | grep -c diagnose` prints 0) and their folders deleted. The red command is carried by the brief as its check: the test above, whose row 'one tab, hidden' is the red command's case.

# Diagnosis: an agent row of a finished background agent reads running with a duration of days

Diagnosis agent: af9bf8786db8217ac, claude-opus-5-5, 121,563 tokens, 135 tool uses, 55.9 min (both diagnoses).

## Symptom

Part (12) of step O33, `tools/oculus/.scratch/migration/plan.md` line 495, second half, word for word: "an agent row of a background agent its session reports finished reads running with a duration such as \"22502m 33s\"". The part ends "each cause found by a red run first (ruling Z902)". The look that found it, `agents/reviews/owed-looks.md` line 31: "The agent rows of an ended session whose transcript reports each background agent finished read \"running | 22502m 33s\"". The look's scratch home held "four Claude transcripts with background agents" (line 26); how they were put there is not written in the record.

## Where the probes run

The same scratch detached worktree as the first diagnosis, `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.tbjn5m/tree` at 69252f5d9, nothing applied (the first diagnosis's fix touches only client files, `Transcript.svelte` and `transcript.svelte.ts`, and was in that tree while this diagnosis's runs on the tree without its own fix were taken; no file this diagnosis reads imports either). The final fix and test runs under "Fix and test" ran in the second scratch worktree at the same commit, `diagnose.PY7hry/tree`. The paths redirected under `$TMPDIR`: `HOME` as in the first diagnosis. Every transcript is a synthetic one written by the test into a `scratchDir` under the system temporary folder; no real Claude transcript was read.

## Red command

A Claude session in a scratch folder, folded by `readSession` (`server/sessions/stores/transcripts.ts:201-217`) as the sessions watcher folds it. The session ran 15.6 days before now: a human turn at minute 0, an `Agent` call with `run_in_background: true` at minute 1, its launch answer (`toolUseResult: { isAsync: true, status: 'async_launched', agentId: 'abg1' }`) at minute 1, and a user message holding the completion notice (`<\task-notification>` with `<task-id>abg1</task-id>`, `<tool-use-id>toolu_bg</tool-use-id>`, `<status>completed</status>`) at minute 20. The agent's own transcript `<session>/subagents/agent-abg1.jsonl` holds records at minutes 1 and 19. Both files are written by the test, so their modification time is now. The test asserts the row's status, its end, and the span `AgentRows.svelte:79-85` `meta()` draws (computed with the same `seconds` from `state/shared/words/format.ts`).

```
HOME=$tmp/home npx vitest run --project unit tests/server/sessions/background-finished.test.ts --reporter verbose --silent=false
```

with the assertion

```ts
expect({ status: agent?.status, ended: agent?.ended, drawn }).toEqual({ status: 'done', ended: at(20), drawn: '19m 0s' });
```

Runs, with the output of each quoted:

```
== run 1
DIAG-7e31 agent row: {"status":"running","started":"2026-09-30T02:41:18.320Z","ended":null,"drawn":"22463m 0s"}
 FAIL |unit| tests/server/sessions/background-finished.test.ts > reads a background agent its session reports finished as ended at the notice 12ms
   -> expected { Object (status, ended, ...) } to deeply equal { status: 'done', ...(2) }
      Tests  1 failed (1)
== run 2
DIAG-7e31 agent row: {"status":"running","started":"2026-09-30T02:41:22.274Z","ended":null,"drawn":"22463m 0s"}
 FAIL ... 13ms
   -> expected { Object (status, ended, ...) } to deeply equal { status: 'done', ...(2) }
      Tests  1 failed (1)
== run 3
DIAG-7e31 agent row: {"status":"running","started":"2026-09-30T02:41:26.269Z","ended":null,"drawn":"22463m 0s"}
 FAIL ... 13ms
   -> expected { Object (status, ended, ...) } to deeply equal { status: 'done', ...(2) }
      Tests  1 failed (1)
```

Parts of the reported symptom, with whether the red command catches each:

| Part of the symptom | Caught by the red command | Lines read, for a part not caught | Reproduced |
|---|---|---|---|
| "an agent row of a background agent its session reports finished reads running" | yes: `status` received `running`, expected `done`; `ended` received `null` | not applicable | yes, caught |
| "with a duration such as \"22502m 33s\"" | yes: `drawn` received `22463m 0s` (minutes from the start 15.6 days ago to now; the look's 22502 minutes is the same span for its own session's age), expected `19m 0s` | not applicable | yes, caught |

Runs after the tightening: the age is relative to `Date.now()` in the test, the files are under `scratchDir`, no network; the command runs in about 13 ms. The three runs above are after the tightening (the first form asserted status and end alone and printed the counted minutes; its three runs read `"status":"running" ... "countedMinutes":22463` and failed the same way).

## No red command

not applicable

## Shrunk case

`tests/server/sessions/background-shrink.test.ts`, one row per cut of the whole case, then the cumulative rows. Its assertion is `expect(agent?.status).toBe('done')`, so red is a row reading `running`.

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| the age (the session one hour ago instead of 15.6 days) | red: `cut: the age (one hour ago): status running, ended null` | cut |
| the human turn | red: `cut: the human turns: status running, ended null` | cut |
| the launch answer's structured field (the agent id in its text alone) | red: `cut: the launch answer's structured field: status running, ended null` | cut |
| `run_in_background` on the call | red: `cut: run_in_background on the call: status running, ended null` | cut alone; put back in the cumulative case, see the last row |
| the notice's `<tool-use-id>` (the `<task-id>` alone) | red: `cut: the notice's tool-use-id (task-id alone): status running, ended null` | cut |
| the agent's own transcript | green: `cut: the agent's own transcript: status done, ended 2026-09-30T03:00:49.871Z` | put back |
| the agent file's modification time after the notice (set to a minute before the notice) | green: `cut: the agent file's write after the notice (written before it): status done, ended 2026-09-30T03:00:49.874Z` | put back |
| the agent file's modification time 4 s after the notice | green: `the agent file's write 4 s after the notice: status done, ...` | boundary: put back |
| the agent file's modification time 6 s after the notice | red: `the agent file's write 6 s after the notice: status running, ended null` | boundary: any time past notice + 5 s is enough |
| cumulative: age, human turn, structured field, tool-use-id cut together | red: `cumulative: age, human, structured field, tool-use-id cut: status running, ended null` | kept |
| cumulative, and `run_in_background` cut too | green: `cumulative, and run_in_background cut too: status done, ended 2026-10-15T16:06:03.375Z` (nothing marks the call a background launch, and the answer ends it) | put back |

The shrunk case, as it stands: an `Agent` call with `run_in_background`, its launch answer naming the agent id `abg1` in its text, a completion notice naming `<task-id>abg1</task-id>` with `<status>completed</status>`, and the agent's own transcript file whose modification time is more than 5 s after the notice's timestamp while none of its records is stamped after the notice. Each one is needed for the red.

## Hypotheses

1. If `settleBackground` (`server/sessions/stores/background.ts:132-150`) decides that an agent a notice ended was resumed by comparing its own transcript's modification time (`modified(agentFile(...))` at `:136`, `statSync(path).mtimeMs` at `:107-113`) with the notice's recorded timestamp (`:139`), so that a file whose modification time moved with no new record reads as resumed, then reading the latest timestamp the agent's records carry in place of the modification time turns the red command green. Falsified by: the red command still red with that change.
2. If `RESUMED_AFTER_MS` (`background.ts:119`, 5000) is too small a margin between the agent's last write and its notice, then raising it (to a day) turns the red command green. Falsified by: the red command still red with the margin at a day.

Fewer than three: the shrink falsified the others that were live. The notice is matched and applied (the row reads `done` with the agent file written before the notice, and with no agent file), so a hypothesis that `takeNotices` (`:88-103`) misses the notice is falsified; the boundary between 4 s (green) and 6 s (red) after the notice sits exactly at the 5 s margin, so a hypothesis that the notice's stamp is parsed wrong is falsified.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | in `settleBackground`'s notice branch, `const wrote = agentId === '' ? null : lastStamp(agentFile(acc.path, acc.id, agentId)); if (wrote !== null && wrote > ended + RESUMED_AFTER_MS) {` in place of `if (own !== null && own > ended + RESUMED_AFTER_MS) {`, with a probe-only `lastStamp(path)` that read the whole file and took the latest `"timestamp"` of its lines (`readFileSync` added to the import) | `DIAG-7e31 agent row: {"status":"done","started":"2026-09-30T02:43:14.679Z","ended":"2026-09-30T03:02:14.679Z","drawn":"19m 0s"}`, `PASS ... 12ms`, `Tests 1 passed (1)` | still standing; it broke no other input. Two other inputs that are part of the defect stayed wrong with it (rows d and f below), which are the further places |
| 2 | `background.ts:119`: `const RESUMED_AFTER_MS = 24 * 60 * 60 * 1000;` | `DIAG-7e31 agent row: {"status":"running","started":"2026-09-30T02:42:56.470Z","ended":null,"drawn":"22463m 0s"}`, `FAIL ... 15ms` | falsified |

No probe added logging. Each probe's change was undone after its run (`git show HEAD:<path> > <path>` in the scratch copy) and `git status --short -- tools/oculus/src/lib/server` printed nothing before the next probe.

## Cause

The cause is at `tools/oculus/src/lib/server/sessions/stores/background.ts:136` and `:139`: `settleBackground` reads when a background subagent last worked from its own transcript's file modification time (`modified()` at `:107-113`, `statSync(path).mtimeMs`) and compares it with the notice's recorded timestamp, so an agent's file whose modification time is later than its notice by more than 5 s reads as resumed: the row is put back to `running` with `ended` null, and `AgentRows.svelte:82` counts it from its start to now. The rule it breaks, at the kind of value: when a background subagent last worked is the timestamp its latest record carries (its own transcript's, or the session's when it has none), never a file's modification time, which a copy, a restore or a sync moves while no record is written.

Places of the defect the fix covers: `background.ts:136` with `:139` (the resume check), `:145-148` (the running branch: `last = own ?? sessionModified`, the idle test and `agent.ended = new Date(last)`), and the session file's modification time handed in as `sessionModified` at `stores/transcripts.ts:214` and `:264`. The probe that shows it: hypothesis 1's change, green with it and red without it. Each other input and each place written as not fixed: none.

Whether a transcript on Axel's machine that was never copied, restored or synced reaches this is not verified: the red needs an agent file modified more than 5 s after its notice with no record after it, and the look's own transcripts sat in a scratch home whose filling the look's record does not describe.

## Operation and other inputs

The operation that goes wrong: the comparison at `background.ts:139`, `own > ended + RESUMED_AFTER_MS`, with `own` from `modified(agentFile(...))` at `:136`.

The rule, stated at the kind of value: when a background subagent last worked is the timestamp its latest record carries (its own transcript's, or the session's when it has none), never a file's modification time.

Places of the defect:

1. `background.ts:136` and `:139`: the resume check reads the agent file's modification time.
2. `background.ts:145-148`: for an agent no notice ended, `last = own ?? sessionModified` is a modification time, so a copied file reads `running` for IDLE_AFTER_SECONDS (30 minutes, `record.ts:24`) after the copy and then `done` with `ended` at the copy's time.
3. `stores/transcripts.ts:214` and `:264`: the session file's modification time handed to `settleBackground` as `sessionModified`, the fallback of place 2 for an agent with no own transcript.

Not a place: `fold.ts:365` (`claudeState`) reads the session file's modification time for the session's own state guess, which `registry.ts` overrules; its value is the session's state, not when a subagent last worked. Not run.

| Other input | Why it reaches a place of the defect | Right result | Place at which it is wrong | Result on the tree without the fix | Result with the change of the probe that shows the cause | Class | Result after the fix |
|---|---|---|---|---|---|---|---|
| b: a notice, then a resume (agent records at minutes 1, 19 and 40, file modified at 40) | place 1 | running, ended null | none | right: `got {"status":"running","ended":null}` | right | not part of the defect | right |
| c: a notice, the agent file untouched since (records 1 and 19, file modified at 19) | place 1 | done, ended at the notice (minute 20) | none | right: `got {"status":"done","ended":...07:27:12.320Z}`, right the same | right | not part of the defect | right |
| d: no notice, the agent file copied (records 1 and 19, file modified now) | place 2 | done, ended at minute 19 | place 2 | wrong: `got {"status":"running","ended":null}` | wrong: `got {"status":"running","ended":null}` | part of the defect | right: `got {"status":"done","ended":"2026-10-15T07:27:59.739Z"}`, right the same |
| e: no notice, the agent writing now (last record a minute ago) | place 2 | running | none | right: `got {"status":"running","ended":null}` | right | not part of the defect | right |
| f: no notice, no own transcript, the session file copied (session's last record at minute 19, file modified now) | places 2 and 3 | done, ended at minute 19 | places 2 and 3 | wrong: `got {"status":"running","ended":null}` | wrong: the same | part of the defect | right: `got {"status":"done","ended":"2026-10-15T07:27:59.750Z"}`, right the same |
| g: no notice, no own transcript, the session writing now | places 2 and 3 | running | none | right | right | not part of the defect | right |
| h: no notice, the agent file copied, each record over 64 KiB with multibyte text (the tail reader's long-line path) | place 2 | done, ended at minute 19 | place 2 | wrong: `got {"status":"running","ended":null}` | not run | part of the defect | right: `got {"status":"done","ended":"2026-10-15T07:28:36.808Z"}`, right the same |

## Fix and test

The failure costs something only once `agents/guarded.md` holds an entry for it, as the first diagnosis says: no entry covers `server/sessions/stores/background.ts` (`grep -n -i 'background.ts\|record.ts\|agent' agents/guarded.md` names no entry for the agents' status). The test below is written as Steps 16 asks; whether it is kept is the session's question to Axel.

Test, run on the tree without the fix:

```
HOME=$tmp/home npx vitest run --project unit tests/server/sessions/background-agents.test.ts --reporter verbose
 FAIL |unit| ... > reads a background agent of a copied session as ended: 'a notice, and its own transcript' 11ms
   -> expected { status: 'running', ended: null } to deeply equal { status: 'done', ...(1) }
 FAIL |unit| ... > reads a background agent of a copied session as ended: 'no notice, and its own transcript' 4ms
   -> expected { status: 'running', ended: null } to deeply equal { status: 'done', ...(1) }
 FAIL |unit| ... > reads a background agent of a copied session as ended: 'no notice and no own transcript' 3ms
   -> expected { status: 'running', ended: null } to deeply equal { status: 'done', ...(1) }
      Tests  3 failed (3)
```

Places the fix covers: one change every place shares, a helper `lastStamp(path)` that reads the stamp of a transcript's latest stamped record from the file's end, 64 KiB at a time, carrying a cut line as bytes; `settleBackground` reads `own` through it (place 1 and place 2) and takes the session's latest record stamp, `acc.lastActivity` (set at `record.ts:229` from each record's timestamp), in place of `sessionModified` (place 3), so its parameter and both callers' argument go. `modified()` has no caller left and is removed. The head comment, the `RESUMED_AFTER_MS` comment and `settleBackground`'s doc comment are rewritten to say records, not writes.

Fix:

```diff
diff --git a/tools/oculus/src/lib/server/sessions/stores/background.ts b/tools/oculus/src/lib/server/sessions/stores/background.ts
index 0a0145348..d350d0827 100644
--- a/tools/oculus/src/lib/server/sessions/stores/background.ts
+++ b/tools/oculus/src/lib/server/sessions/stores/background.ts
@@ -8,21 +8,26 @@
 // session carries its completion notice (a `<\task-notification>`, in a user message, or in the
 // attachment of a queued command when the session was busy, naming the call's `<tool-use-id>`,
 // or its agent id as the `<task-id>`, with the `<status>` it ended in), and without one it is
-// running while its own transcript still grows and done once that has been still for
-// IDLE_AFTER_SECONDS, the time after which a session reads idle. A subagent whose transcript is not
-// found is judged by the session's own file the same way.
+// running while the latest record of its own transcript is within IDLE_AFTER_SECONDS of now, the
+// time after which a session reads idle, and done at that record once it is older. A subagent
+// whose transcript is not found is judged by the latest record of the session's own transcript the
+// same way.
+//
+// When a subagent last worked is the timestamp its latest record carries, never a file's
+// modification time: a copy, a restore or a sync moves that time while no record is written, and a
+// transcript days old would read as running again.
 //
 // A notice fires each time the agent stops, so a subagent resumed after its notice is ended again
 // by the next one: the row reads what the latest notice says. `completed` reads done and `killed`,
 // an agent stopped before it finished, reads stopped; any other status reads error. Between a
-// resume and its next notice the subagent writes its own transcript again, later than the notice
-// that ended it, and that write puts the row back to running.
+// resume and its next notice the subagent writes records into its own transcript again, stamped
+// later than the notice that ended it, and those records put the row back to running.
 
-import { existsSync, statSync } from 'node:fs';
+import { closeSync, existsSync, openSync, readSync, statSync } from 'node:fs';
 import { dirname, join } from 'node:path';
 import { z } from 'zod';
 import type { SessionRecord } from '../../../data/model/index.ts';
-import { IDLE_AFTER_SECONDS, textShape, type Acc } from '../record.ts';
+import { IDLE_AFTER_SECONDS, stampShape, textShape, type Acc } from '../record.ts';
 
 /** How a launch notice names the subagent, when the answer carries no structured field for it. */
 const AGENT_ID = /agentId:\s*([A-Za-z0-9_-]+)/;
@@ -103,37 +108,94 @@ export function takeNotices(acc: Acc, text: string, stamp: string | null): void
     }
 }
 
-/** A file's modification time in milliseconds, or null when it cannot be read. */
-function modified(path: string): number | null {
+/** How much of a transcript's end is read at a time while looking for its latest record. */
+const TAIL_BYTES = 64 * 1024;
+
+/** One record of a transcript, as far as its stamp goes. */
+const stampedShape = z.object({ timestamp: stampShape }).catch({ timestamp: null });
+
+/** The stamp of one line of a transcript, in milliseconds, or null for a line that carries none. */
+function stampOfLine(line: string): number | null {
+    let raw: unknown;
     try {
-        return statSync(path).mtimeMs;
+        raw = JSON.parse(line);
+    } catch {
+        return null;
+    }
+    const stamp = stampedShape.parse(raw).timestamp;
+    const time = stamp === null ? NaN : Date.parse(stamp);
+    return Number.isNaN(time) ? null : time;
+}
+
+/**
+ * The stamp of a transcript's latest record that carries one, in milliseconds, or null when the
+ * file cannot be read or no record carries one. Records are appended in time order, so the file is
+ * read from its end, a piece at a time, and only as far back as the last stamped record; a line cut
+ * by the start of a piece is read whole with the next piece.
+ */
+function lastStamp(path: string): number | null {
+    let fd: number;
+    try {
+        fd = openSync(path, 'r');
+    } catch {
+        return null;
+    }
+    try {
+        let end = statSync(path).size;
+        // The bytes before the first new line of the piece read last, which belong to a line that
+        // starts in the piece before it; kept as bytes, so a character cut in two is joined first.
+        let carry = Buffer.alloc(0);
+        while (end > 0) {
+            const start = Math.max(0, end - TAIL_BYTES);
+            const piece = Buffer.alloc(end - start);
+            readSync(fd, piece, 0, piece.length, start);
+            const bytes = Buffer.concat([piece, carry]);
+            // At the start of the file every byte belongs to a whole line; before it, a piece with
+            // no new line is the middle of one line, read whole once its start is reached.
+            const cut = start === 0 ? -1 : bytes.indexOf(0x0a);
+            end = start;
+            if (start > 0 && cut === -1) {
+                carry = bytes;
+                continue;
+            }
+            carry = cut === -1 ? Buffer.alloc(0) : bytes.subarray(0, cut);
+            const lines = bytes
+                .subarray(cut + 1)
+                .toString('utf8')
+                .split('\n');
+            for (let at = lines.length - 1; at >= 0; at -= 1) {
+                const time = stampOfLine(lines[at]);
+                if (time !== null) return time;
+            }
+        }
+        return null;
     } catch {
         return null;
+    } finally {
+        closeSync(fd);
     }
 }
 
 /**
- * How much later than the notice that ended it a subagent's own transcript must be written to read
- * as resumed: the notice follows the subagent's last write, and a file system's times are coarse.
+ * How much later than the notice that ended it a subagent's latest record must be stamped to read
+ * as resumed: the notice follows the subagent's last record, so a record stamped within a few
+ * seconds of it is that last record and not a resume.
  */
 const RESUMED_AFTER_MS = 5000;
 
 /**
  * Settle, on a finished record, every background subagent: one no completion notice ended is
- * running while its own transcript (or, without one, the session's file) was written within
- * IDLE_AFTER_SECONDS of `now`, done otherwise, ended at that last write; one a notice ended whose
- * own transcript was written after that notice has been resumed, and is running again.
+ * running while the latest record of its own transcript (or, without one, of the session's) is
+ * stamped within IDLE_AFTER_SECONDS of `now`, done otherwise, ended at that record; one a notice
+ * ended whose own transcript holds a record stamped after that notice has been resumed, and is
+ * running again.
  */
-export function settleBackground(
-    acc: Acc,
-    record: SessionRecord,
-    sessionModified: number | null,
-    now: number
-): void {
+export function settleBackground(acc: Acc, record: SessionRecord, now: number): void {
+    const session = acc.lastActivity === null ? NaN : Date.parse(acc.lastActivity);
     for (const [id, agentId] of Object.entries(acc.background)) {
         const agent = record.agents.find((one) => one.id === id);
         if (agent === undefined) continue;
-        const own = agentId === '' ? null : modified(agentFile(acc.path, acc.id, agentId));
+        const own = agentId === '' ? null : lastStamp(agentFile(acc.path, acc.id, agentId));
         if (agent.status !== 'running') {
             const ended = agent.ended === null ? NaN : Date.parse(agent.ended);
             if (own !== null && own > ended + RESUMED_AFTER_MS) {
@@ -142,7 +204,7 @@ export function settleBackground(
             }
             continue;
         }
-        const last = own ?? sessionModified;
+        const last = own ?? (Number.isNaN(session) ? null : session);
         if (last === null || now - last <= IDLE_AFTER_SECONDS * 1000) continue;
         agent.status = 'done';
         agent.ended = new Date(last).toISOString();
diff --git a/tools/oculus/src/lib/server/sessions/stores/transcripts.ts b/tools/oculus/src/lib/server/sessions/stores/transcripts.ts
index 9008f4b1e..62163e86d 100644
--- a/tools/oculus/src/lib/server/sessions/stores/transcripts.ts
+++ b/tools/oculus/src/lib/server/sessions/stores/transcripts.ts
@@ -211,7 +211,7 @@ export function readSession(path: string, store: string | null = null): SessionR
     }
     const now = Date.now();
     const record = finish(acc, stateOf(acc, mtimeMs, now));
-    settleBackground(acc, record, mtimeMs, now);
+    settleBackground(acc, record, now);
     settleAgentFiles(acc, record);
     return record;
 }
@@ -261,7 +261,7 @@ function session(
         acc
     };
     const record = finish(acc, stateOf(acc, found.mtimeMs, now));
-    settleBackground(acc, record, found.mtimeMs, now);
+    settleBackground(acc, record, now);
     settleAgentFiles(acc, record);
     return { record, entry, usage: startedByUsage(acc) };
 }
```

For `premise`, the test's source as written. `tests/server/sessions/background-agents.test.ts` (prettier and eslint clean in the scratch copy):

```ts
// Layer 2, server tests. When a background subagent last worked is read from the timestamps its
// records carry, so a transcript whose file was copied, restored or synced (its modification time
// now, its records days old) folds as it did before the copy. A Claude session in a scratch folder
// is folded by readSession as the sessions watcher folds it, with each file's modification time
// set to now after it is written.

import { mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { readSession } from '../../../src/lib/server/sessions/stores/transcripts.ts';

const SESSION = 'b2c4a7e0-0000-4000-8000-0000000000ad';
const MINUTE = 60 * 1000;
/** The session ran fifteen and a half days before the fold. */
const AGE = 15.6 * 24 * 60;

type Row = {
    name: string;
    /** Whether the session's transcript carries the agent's completion notice, at minute 20. */
    notice: boolean;
    /** The minutes of the agent's own records; none for an agent with no own transcript. */
    agent: number[];
    /** The minute of the session's last record. */
    last: number;
    /** The minute the row reads as ended at. */
    ended: number;
};

const ROWS: Row[] = [
    { name: 'a notice, and its own transcript', notice: true, agent: [1, 19], last: 20, ended: 20 },
    {
        name: 'no notice, and its own transcript',
        notice: false,
        agent: [1, 19],
        last: 2,
        ended: 19
    },
    { name: 'no notice and no own transcript', notice: false, agent: [], last: 19, ended: 19 }
];

it.each(ROWS)('reads a background agent of a copied session as ended: $name', (row) => {
    const t0 = Date.now() - AGE * MINUTE;
    const at = (minute: number) => new Date(t0 + minute * MINUTE).toISOString();
    const user = (content: unknown, minute: number, extra: Record<string, unknown> = {}) =>
        JSON.stringify({
            type: 'user',
            timestamp: at(minute),
            message: { role: 'user', content },
            ...extra
        });
    const store = scratchDir('oculus-background-agents-');
    const subagents = join(store, SESSION, 'subagents');
    mkdirSync(subagents, { recursive: true });
    const path = join(store, `${SESSION}.jsonl`);
    const notice =
        '<\task-notification>\n<task-id>abg1</task-id>\n<tool-use-id>toolu_bg</tool-use-id>\n' +
        '<status>completed</status>\n<result>done</result>\n<\/task-notification>';
    const lines = [
        JSON.stringify({
            type: 'assistant',
            timestamp: at(1),
            message: {
                role: 'assistant',
                content: [
                    {
                        type: 'tool_use',
                        id: 'toolu_bg',
                        name: 'Agent',
                        input: { description: 'probe', run_in_background: true }
                    }
                ]
            }
        }),
        user([{ type: 'tool_result', tool_use_id: 'toolu_bg', content: 'launched' }], 1, {
            toolUseResult: { isAsync: true, status: 'async_launched', agentId: 'abg1' }
        }),
        ...(row.notice ? [user(notice, 20)] : []),
        user('the session goes on', row.last)
    ];
    writeFileSync(path, `${lines.join('\n')}\n`);
    if (row.agent.length > 0) {
        const file = join(subagents, 'agent-abg1.jsonl');
        writeFileSync(
            file,
            `${row.agent.map((minute) => user('the agent works', minute)).join('\n')}\n`
        );
    }
    const now = Date.now() / 1000;
    utimesSync(path, now, now);
    if (row.agent.length > 0) utimesSync(join(subagents, 'agent-abg1.jsonl'), now, now);
    const agent = readSession(path).agents.find((one) => one.id === 'toolu_bg');
    expect({ status: agent?.status, ended: agent?.ended }).toEqual({
        status: 'done',
        ended: at(row.ended)
    });
});
```

Runs after the fix:

```
HOME=$tmp/home npx vitest run --project unit tests/server/sessions/background-agents.test.ts --reporter verbose
 PASS |unit| ... 'a notice, and its own transcript' 11ms
 PASS |unit| ... 'no notice, and its own transcript' 6ms
 PASS |unit| ... 'no notice and no own transcript' 3ms
      Tests  3 passed (3)

red command (background-finished.test.ts):
DIAG-7e31 agent row: {"status":"done","started":"2026-09-30T02:45:56.056Z","ended":"2026-09-30T03:04:56.056Z","drawn":"19m 0s"}
 PASS |unit| ... reads a background agent its session reports finished as ended at the notice 12ms
      Tests  1 passed (1)

the original, unshrunk case and every cut (background-shrink.test.ts):
DIAG-7e31 whole case: status done, ended 2026-09-30T03:05:03.569Z
... (every cut row: status done)
      Tests  12 passed (12)

the red command on each other input (background-others.test.ts):
b  got {"status":"running","ended":null}, right {"status":"running","ended":null}
c  got {"status":"done","ended":"2026-10-15T07:28:59.733Z"}, right the same
d  got {"status":"done","ended":"2026-10-15T07:27:59.739Z"}, right the same
e  got {"status":"running","ended":null}, right the same
f  got {"status":"done","ended":"2026-10-15T07:27:59.750Z"}, right the same
g  got {"status":"running","ended":null}, right the same
h  got {"status":"done","ended":"2026-10-15T07:28:36.808Z"}, right the same
      Tests  6 passed (6)   (h ran alone: Tests 1 passed | 6 skipped (7))

the session tests that import the changed files:
HOME=$tmp/home npx vitest run --project unit tests/server/sessions/
 Test Files  5 passed (5)
      Tests  29 passed (29)

npx svelte-check --tsconfig ./tsconfig.json --threshold error
COMPLETED 4056 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```

No test reaches it: not applicable. No test is written: not applicable.

## Cleanup

As in the first diagnosis: the grep of `DIAG-7e31` over `src` and `tests` of each scratch tree printed nothing; over the whole tree it printed only the three committed lines of `agents/reviews/D77-diagnosis.md`, a record of an earlier diagnosis that used the same tag. Both scratch worktrees removed with `git worktree remove --force` from the main checkout, their folders deleted (`ls $TMPDIR | grep -c '^diagnose\.'` prints 0, `git worktree list | grep -c diagnose` prints 0). The red command is carried by the brief as its check: row 'a notice, and its own transcript' of the test above is the red command's case.

# For the session

These are not part of either diagnosis's steps; they are what the session needs to decide before the brief carries the two tests.

1. Rule clash between this skill and the plan's rules file. The skill's Steps 16 asks for a test of a defect whose failure costs something. `agents/spec.md` says "A test exists only as the test of one entry of `agents/guarded.md`" and "A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled", and `agents/guarded.md` line 3 says "Views have no entry: the look on TEST covers them". Neither test has an entry. The first test is also a view test run under jsdom inside a `*.client.test.ts` file, where `agents/spec.md` puts an effect's timing in a `*.client.test.ts` file with no DOM and "every other behaviour that needs a DOM" with the look. Options: (a) Axel adds two entries (the agent tab's request count and update loop, the background agents' status from record stamps), and the brief carries both tests; (b) only the server test gets an entry, and the view's defect is held by the look on TEST (an agent tab of a running agent, hidden and shown, with no console error and one request per message in the network log); (c) neither, both held by looks. Recommendation: (a), since the first defect is invisible to a look while the page is idle (it shows only as console errors and a request chain) and the second needs a transcript whose file time was moved, which a look on Axel's own hub does not set up. The lazy option is (c): it costs no entries and leaves both defects with no check that would catch their return.
2. The first defect is wider than the part's text: a shown tab of a running agent sends requests without end after one sessions message (rows 'one tab, shown', 'two tabs, both shown', 'two tabs, one hidden', 'a tab opened late, both shown' of the first test, 50 requests to the stub's cap). The same fix ends it.
3. The second fix reads up to the last 64 KiB of each background agent's transcript on every fold of its session (each sessions scan and each `readSession`), where the code before read one `stat`. Not measured on Axel's transcripts.
4. Nothing of the main checkout was changed by this diagnosis. The record is also saved at `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/O33-diagnosis.md` (1033 lines, ASCII-only by `LC_ALL=C grep -n '[^ -~<tab>]'`, which printed nothing).
