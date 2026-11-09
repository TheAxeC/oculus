Everything in the brief is done

C7 to C10 are the orchestrator's look, as the brief assigns them, and their rows below name the look.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md`, section `## Open items`:

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

The section holds no entry.

## The cases' first run, on the unchanged tree

C1 to C6 had no module to call there: `ls src/lib/views/academic/present/screen/layout-turns.ts` printed `No such file or directory` before any change. C7 to C10 need a page, which a builder does not run (`agents/spec.md`). No case of the first run showed a rule of the brief to be wrong, so the step did not stop there.

The tree's premises reproduced on reading: `Slide.svelte:321-335`, `:161-314`, `:368-369`, `:357-366`, `:316-319`, `:83-84`, `:313`; `Stage.svelte:61-83`; `present.svelte.ts:495`; `Overview.svelte:203-211`; `Tile.svelte:110-112`. `grep -rn Framed` over `src` lists `Present.svelte:429` and `Presenter.svelte:119,131`, the three other users the brief names, with `git grep` replaced because `agents/spec.md` does not let a builder run it.

## DONE / NOT DONE

| Item | State | Command and last line printed |
|---|---|---|
| Verify 1, the list | DONE | `npm run diagrams` then `npm run test:quick` with `TMPDIR` unset: `test:quick: 78.4 s; every command passed` |
| Verify 2, ASCII gate | DONE | the `perl` command of `agents/spec.md`: no file line printed; `find` printed only `find: bin: No such file or directory`, since this repository has no `bin` folder (`ls bin`) |
| Verify 3, C1 to C6 | DONE | `node --no-warnings .agents/scratch/cases.mjs`, output below |
| Verify 4, unused exports | DONE | `sh utils/unused-exports.sh \| diff - .../O175-base/unused-exports.txt`: no line starting with `<` (`grep -c '^<'` printed `0`; `diff` printed nothing) |
| Non-ASCII in the touched files | DONE | `LC_ALL=C grep -n '[^ -~]'` over the six files: no line, exit 1 |
| 1 Tile work takes turns | DONE | `screen/layout-turns.ts`; C1, C2, C4, C6 below. A hidden tab: the page's `requestAnimationFrame` stops and the jobs stay in the Set until it is shown (`layout-turns.ts:39-81`, read); seen at the look only if the orchestrator hides the tab |
| 2 Only tiles use it | DONE | `grep -rn 'layoutTurns\|LayoutTurns'` shows `Tile.svelte:88` as the one reader and `Framed`/`Slide` passing the prop; `Present.svelte:429`, `Presenter.svelte:119,131` pass none. `askLayout` covers the image, probe and font paths (`Slide.svelte`), the first layout is `turns.ask` in the effect, and with no `turns` the microtask path is the same code. Look on landing, C7 |
| 3 Slide mounted at its turn | DONE | `Tile.svelte:{#if mounted}` with `mount` flushed by `flushSync` inside the job. Look on landing, C7 |
| 4 Containment | DONE | `Tile.svelte` `.shot { contain: layout paint style; }`. The frame's line is `box-shadow: inset 0 0 0 1px` (`src/lib/themes/slide.css:59`), so paint containment clips nothing. Look on landing, C7 |
| 5 Waiting slide as before layout | DONE | `.waiting` unchanged in `Slide.svelte`; `pressed` on the tile unchanged. Look on landing, C7, C8 |
| 6 No measure before layout | DONE | `Framed.svelte` `report` and `settled`. Look on landing, C8 |
| 7 Repeats collapse | DONE | C3 below; a Set of jobs |
| 8 A job that goes away is dropped | DONE | C4 below; `Tile.svelte` and `Slide.svelte` effect teardowns call `drop`, and a queue with no job cancels its frame. Look on landing, C10 |
| 9 Every tile drawn and measured | DONE | no tile is skipped by any code path of the queue (read); look on landing, C7 and C8 |
| 10 Store writes stay cheap | DONE | section "What item 10 changed" below; look on landing, C8 |
| 11 Comments | DONE | head comments of `Slide.svelte`, `Framed.svelte`, `Tile.svelte`, `Overview.svelte` rewritten; comment lines all at or under 100 columns (`awk 'length($0)>100'` over comment lines of the six files printed nothing) |
| C7 | look on landing | Present, the portfolio deck in the Overview: tiles arrive top to bottom, scrolling and pressing work, `PerformanceObserver` for long tasks shows none over about 100 ms apart from the first draw under about 500 ms; again after a reload with the Overview open |
| C8 | look on landing | scratch deck with a slide known too tall, reload with the Overview open: no mark and no Findings row on a waiting tile; after the queue empties the mark and its row are there |
| C9 | look on landing | Overview open, switch the theme: the page keeps answering, every tile ends laid out in the new theme |
| C10 | look on landing | Overview arriving, choose another deck: the first deck's tiles stop, the new deck's arrive |

The verify list ran once. No whole-suite command ran. This step adds or changes no test, and edits no existing assertion, allow list or predicate.

### C1 to C6, as printed, after the last change

```
C1 frames=[["j1","j2","j3","j4"],["j5","j6","j7","j8"],["j9","j10"]] perFrame=[4,4,2]
C2 frames=[["slow"],["a","b"]]
C3 frames=[["twice","after"]]
C4 frames=[["first","behind"]]
C5 frames=[["self","other"],["third","self"]] frameLeftPending=false
C6 frames=[["before","throws","after"]] consoleError=["boom"]
```

C1 budget 4 ms, jobs of 1 ms; C2 budget 4, the first job 50 ms; C3 one job asked twice; C4 the middle job dropped; C5 budget 2, a job that asks again during its first run; C6 the middle job throws.

The case-run program, `.agents/scratch/cases.mjs`, removed before this report:

```js
// Prints the result of C1 to C6: the queue of layout-turns.ts with a fake frame source and clock.
import { createLayoutTurns } from '../../src/lib/views/academic/present/screen/layout-turns.ts';

function rig(budget) {
    let clock = 0;
    let pending = null;
    let handles = 0;
    const turns = createLayoutTurns({
        frames: {
            request: (run) => {
                pending = run;
                handles += 1;
                return handles;
            },
            cancel: () => {
                pending = null;
            }
        },
        now: () => clock,
        budget
    });
    const job = (name, ms, log, body) => () => {
        clock += ms;
        log.push(name);
        body?.();
    };
    /** Runs frames until none is pending; each frame's jobs are one array of the result. */
    const drain = (log) => {
        const frames = [];
        while (pending !== null) {
            const run = pending;
            pending = null;
            log.length = 0;
            run();
            frames.push([...log]);
        }
        return frames;
    };
    return { turns, job, drain, pendingFrame: () => pending !== null };
}

function show(name, frames, extra = '') {
    console.log(`${name} frames=${JSON.stringify(frames)}${extra}`);
}

{
    const log = [];
    const r = rig(4);
    for (let n = 1; n <= 10; n += 1) r.turns.ask(r.job(`j${n}`, 1, log));
    const frames = r.drain(log);
    show('C1', frames, ` perFrame=${JSON.stringify(frames.map((f) => f.length))}`);
}
{
    const log = [];
    const r = rig(4);
    r.turns.ask(r.job('slow', 50, log));
    r.turns.ask(r.job('a', 1, log));
    r.turns.ask(r.job('b', 1, log));
    show('C2', r.drain(log));
}
{
    const log = [];
    const r = rig(4);
    const twice = r.job('twice', 1, log);
    r.turns.ask(twice);
    r.turns.ask(twice);
    r.turns.ask(r.job('after', 1, log));
    show('C3', r.drain(log));
}
{
    const log = [];
    const r = rig(4);
    const gone = r.job('cancelled', 1, log);
    r.turns.ask(r.job('first', 1, log));
    r.turns.ask(gone);
    r.turns.ask(r.job('behind', 1, log));
    r.turns.drop(gone);
    show('C4', r.drain(log));
}
{
    const log = [];
    const r = rig(2);
    let again = true;
    const self = r.job('self', 1, log, () => {
        if (!again) return;
        again = false;
        r.turns.ask(self);
    });
    r.turns.ask(self);
    r.turns.ask(r.job('other', 1, log));
    r.turns.ask(r.job('third', 1, log));
    const frames = r.drain(log);
    show('C5', frames, ` frameLeftPending=${r.pendingFrame()}`);
}
{
    const log = [];
    const r = rig(4);
    const logged = [];
    const real = console.error;
    console.error = (error) => logged.push(error.message);
    r.turns.ask(r.job('before', 1, log));
    r.turns.ask(
        r.job('throws', 1, log, () => {
            throw new Error('boom');
        })
    );
    r.turns.ask(r.job('after', 1, log));
    const frames = r.drain(log);
    console.error = real;
    show('C6', frames, ` consoleError=${JSON.stringify(logged)}`);
}
```

## Files

`git status --short` lists exactly these six; every one is on the brief's write list, with this report the seventh. The base copy holds only `unused-exports.txt`, so the file table comes from `git status --short` and `wc -l`.

| File | Lines after |
|---|---|
| `src/lib/views/academic/present/screen/layout-turns.ts` (new) | 94 |
| `src/lib/views/academic/present/Slide.svelte` | 516 (limit 520) |
| `src/lib/views/academic/present/screen/Framed.svelte` | 98 |
| `src/lib/views/academic/present/arrange/Tile.svelte` | 221 |
| `src/lib/views/academic/present/arrange/Overview.svelte` | 285 |
| `src/lib/state/life/present.svelte.ts` | 768 |

## Judgment calls the brief left open, each reversible

1. A job asked again while still waiting keeps its place; a job asked again once its turn has come (during or after its run) goes to the back. The brief's decision 2 says "a job asked again goes to the back" and item 7 says a waiting slide is not queued twice; C5 is the first reading. Moving a waiting job to the back would let every late-loading image push its tile behind the others and break top-to-bottom arrival.
2. All tiles' mount jobs run before any layout job: mounts are asked at the first draw in deck order, and a slide asks for its first layout when it mounts, so its layout goes to the back of the queue behind every tile's mount. Tiles then appear in two passes: frames first, top to bottom, then laid-out slides, top to bottom.
3. `Tile.svelte` also holds its Too tall mark until its slide has been laid out (`laid`, set through a new `onlaid` prop on `Framed`). Item 6's rule covers what a tile writes; this covers what a waiting tile shows when the store already holds the slide's finding from an earlier layout (a reopened Overview, the Present pane having measured it), so C8's "a waiting tile shows no Too tall mark" holds in that state too. Taking it out would show a mark from an earlier measure on a tile that has not yet laid out.
4. `Framed.svelte` tags a held measure with its `drawing`: a measure held for an older `drawing` (a tile reused for another deck's slide of the same key, a retitled slide) is discarded at `settled` instead of written under the new one.
5. The queue has `ask` and `drop` and no stop: a queue left with no job cancels its frame, and an Overview's tiles drop their jobs when they go, so nothing is held for the Overview itself to stop.
6. The budget constant is `TURN_BUDGET = 8` in `Overview.svelte` (decision 1), and the context functions `provideLayoutTurns` and `layoutTurns` sit in `layout-turns.ts`, the shape of `ui/frame/card/card-room.ts`.
7. Helper grep before writing: `grep -rn 'layoutTurns\|LayoutTurns\|createLayoutTurns' src tests` hit only this step's own lines, and no helper for a per-frame queue exists among the files that use `requestAnimationFrame` (`grep -rln requestAnimationFrame src`). `grep -rn 'holdTall\|markOf' src tests` hit no other helper of `tall`; the other `markOf`s are unrelated functions local to their own modules (`characters.ts`, `terminal-marks.ts`, `decorations.ts`).

## Every host- or user-visible change

| View and state | Before | After |
|---|---|---|
| Overview opening, any deck | Page unresponsive until every slide is laid out, then all tiles at once | Empty 16:9 tile shapes with place, title and menu at once; then each tile's frame, then its slide, in deck order, top to bottom, with scrolling and presses working meanwhile |
| A waiting tile | No such state | Empty shot until its turn, no Too tall mark, no new Findings row; pressing it shows the slide |
| Font load, text size or theme change with the Overview open | Every tile lays out in one task, and its measure follows within a frame | Every tile lays out on the queue, at most one per tile for repeats; a tile's mark and Findings row stay as they were until its layout has run, then follow the new measure |
| Too tall mark on a tile, once laid out | Reacts as the store changes | Same; written by a tile only after layout, and re-running only that tile |
| Present pane, presenter screen, audience window, print page | | No change: `turns` absent; `onlaid` of the print page unchanged |

Docs read for the behaviour, each still true: `Stage.svelte` head comment; `docs/decks.md:103`, `:133`; `docs/HELP.md:469`; the doc comments of `measured`, `drawing`, `tooTall` in `PresentStore` (`present.svelte.ts:172-188`). Rewritten: the four head comments of item 11. `grep -n -i 'too tall'` over `docs/*.md` and `README.md` finds nothing to change.

The asynchronous paths: a job in flight when its tile goes runs to its end and leaves nothing waiting; a job not yet run when its tile goes is dropped; a frame pending when the queue empties is cancelled; a later layout ask of a waiting slide collapses into the one already waiting.

## What item 10 changed

`tooTall` (`present.svelte.ts:584`) no longer reads the `SvelteMap`. A plain `Map` named `marks` (`present.svelte.ts:429`) holds one `$state` cell per slide a tile's mark has read, holding that slide's message or the empty string. `markOf` (`:437`) makes a cell at its first read with `$state({ message: untrack(() => tall.get(key)?.message ?? '') })`, and `holdTall` (`:446`) is the one writer of `tall`, used by `measured` and `prune`, and updates the cell of the key if one exists. A tile's `tall` derived now subscribes to its own cell alone, so a mark gained or lost by another tile does not run it again. `tallFindings` keeps reading `tall.values()` and re-derives on every real change, as before, since it does list every finding. The first read inside a derived is tracked, because `proxy()` makes its property sources with `source` and only `state()` puts a source in `current_sources` (`node_modules/svelte/src/internal/client/proxy.js:186`, `reactivity/sources.js:99-105`). The cell's run at the landing look is C8.

## Limitations and sharp edges

- `marks` keeps one small object per slide key a tile's mark has read for the life of the store, and frees none, since a live mark may hold it. It is bounded by the slides the page has drawn.
- A tile waiting on the Overview shows no mark, but the Findings row of a measure from an earlier layout of that slide stays in Findings, since that measure was real.
- A single job longer than the budget still blocks for its own length: the time budget is checked between jobs, by item 1's rule. A job over about 100 ms is C7's finding to see.
- The look on landing is the only proof of items 2 to 6, 8 and 9 and of C7 to C10; the unit runs do not reach a page. The check `grep` for history words over the added comment lines and `layout-turns.ts` printed five hits, each a statement of order in the moment, none a comparison with an earlier state of the code: "before which the tile carries no mark", "the Stage measures of it before that", "null before the first", "this slide is still waiting for its layout", "dropped before its turn".

## Anything in the brief that was wrong or impossible

Nothing was impossible. One literal difference: the spec's ASCII gate names `bin`, which this repository does not have, so `find` prints `find: bin: No such file or directory`, and the command prints nothing else (`ls bin` shows the absence). The gate of the verify list passed (`ok ASCII gate`).

## Repair round 1

Both findings of `agents/briefs/O175-round-1.md` are done. `Framed.svelte` is the only source file this round changes.

### Finding 1, a tile waiting on a later layout writes no measure

`Framed.svelte` no longer compares `drawing` to tell whether a measure may be written. It hands the slide the queue through a wrapper, `watched`, whose `ask` notes the ask and passes it on, so `Slide.svelte` needs no change and every trigger is covered, since all of them go through `turns.ask`:

```ts
const watched = $derived.by((): LayoutTurns | undefined => {
    const queue = turns;
    if (queue === undefined) return undefined;
    return {
        ask: (job) => {
            asked = true;
            queue.ask(job);
        },
        drop: (job) => queue.drop(job)
    };
});

function report(over: number): void {
    if (asked) held = { over, of: drawing };
    else measured(deck, row, over);
}
```

`settled` (the slide's `onlaid`) sets `asked = false` and writes the latest kept measure, when it was taken of what the Stage now draws.

What the code does in each case, by reading; the page's proof is the look at C8 and C9:

- A layout asked by the first mount, a change of the slide, a font load, a probe change (text size, theme) or an image's load or failure: from that ask until the layout has run, measures are kept and nothing reaches the store, so the tile's earlier mark and Findings row stay as they were.
- That layout has run: the latest kept measure of the current `drawing` is written, and later measures go straight to the store. The Stage's observer corrects a kept measure the layout made out of date whenever the layout changed the slide's box.
- A tile destroyed while waiting: nothing is written.
- A slide with no `turns`: `watched` is undefined, the slide never asks it, `asked` stays false and `report` writes at once as it did.
- A layout job that returns early because the slide is not drawn (a hidden pane): `onlaid` is not told, so measures stay held until the layout that runs when the slide is drawn again.
- An ask arriving while that slide's own layout job runs would be cleared by that job's `onlaid`. No path reaches this: an ask comes from an effect flushed outside the job, or from an event in another task, and the job's own changes start no ask (`Slide.svelte`, the head comment's "the search's own changes start no search"); read, not run.

`grep -n 'laidOf' -r src tests` prints nothing. The internal name `watched` is a local of `Framed.svelte`.

For the look at C9: while tiles wait on a theme or text size change, no tile gains or loses a mark or a Findings row until its own layout has run.

### Finding 2, the head comments

Rewritten: the last paragraph of the head comment of `Framed.svelte`, which now says a measure is kept from any ask until that layout has run. Read and still true: the head comment of `Slide.svelte` (a slide given `turns` waits on that queue for every layout) and the doc comments of its `onlaid` and `turns` props; the head comment of `Tile.svelte`.

### Verify lines, after the last change of the round

The verify list ran once in this round, with `TMPDIR` unset, after `npm run diagrams`. No whole-suite command ran. This round adds or changes no test.

| Check | Output as printed |
|---|---|
| 1 `npm run test:quick` | `test:quick: 59.3 s; every command passed` |
| 2 ASCII gate, the `perl` command | only `find: bin: No such file or directory`; `LC_ALL=C grep -n '[^ -~]'` over `Framed.svelte` printed nothing, exit 1 |
| 3 C1 to C6, the program quoted above, restored to `.agents/scratch/cases.mjs` for this run and removed after it | the six lines below |
| 4 `sh utils/unused-exports.sh \| diff - .../O175-base/unused-exports.txt` | no output, `diff exit=0` |

```
C1 frames=[["j1","j2","j3","j4"],["j5","j6","j7","j8"],["j9","j10"]] perFrame=[4,4,2]
C2 frames=[["slow"],["a","b"]]
C3 frames=[["twice","after"]]
C4 frames=[["first","behind"]]
C5 frames=[["self","other"],["third","self"]] frameLeftPending=false
C6 frames=[["before","throws","after"]] consoleError=["boom"]
```

`grep -n -E` for the history words over the comment lines of `Framed.svelte` printed nothing. `wc -l`: `Framed.svelte` 98, the other five files as in the table above. `git status --short` lists the same six source paths, this report, and the orchestrator's `O175-round-1.md` and `O175-refuter.md`, which this round did not write.
