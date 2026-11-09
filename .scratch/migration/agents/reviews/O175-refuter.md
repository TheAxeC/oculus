Review of step O175. Two findings ask for a code or comment change (Behaviour 1, Standards 1), and Spec 1 is a departure from the brief for the orchestrator to rule on. C1 to C6 and all four verify checks reproduce.

## Verification lines, verbatim

Run from the worktree root, `PATH` with node v24.21.0 first, `GIT_CEILING_DIRECTORIES` set to `.agents/scratch` of the worktree.

1. `env -u TMPDIR npm run test:quick`:
```
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      ASCII gate (1.8 s)
ok      svelte-kit sync (3.7 s)
ok      eslint (4.2 s)
ok      svelte-check (13.7 s): 1794222353279 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (33.7 s): Duration  17.62s (transform 28.61s, setup 0ms, import 48.85s, tests 2.14s, environment 295ms)
ok      vitest slow (39.8 s): Duration  23.48s (transform 12.15s, setup 0ms, import 16.00s, tests 7.28s, environment 1ms)
ok      vitest checks (58.9 s): Duration  42.63s (transform 14.39s, setup 0ms, import 31.00s, tests 92.94s, environment 3ms)
test:quick: 62.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source, tests/checks/tree and
            tests/checks/imports, which run for any change under src, tests or
            utils; the build, the lint of unchanged files
```
The report's run printed 78.4 s. No decision rests on the time.

2. ASCII gate, the `perl` command of `agents/spec.md`: it printed only `find: bin: No such file or directory`, and `ls bin` printed `ls: bin: No such file or directory`. That is what the report says.

3. C1 to C6, by the report's program, copied unchanged except for an absolute import path to `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o175-cases.mjs`, outside the worktree (`node --no-warnings`):
```
C1 frames=[["j1","j2","j3","j4"],["j5","j6","j7","j8"],["j9","j10"]] perFrame=[4,4,2]
C2 frames=[["slow"],["a","b"]]
C3 frames=[["twice","after"]]
C4 frames=[["first","behind"]]
C5 frames=[["self","other"],["third","self"]] frameLeftPending=false
C6 frames=[["before","throws","after"]] consoleError=["boom"]
```
These match the report line for line. An extra run of mine for a job asked while the queue is idle, after a drop emptied it and after a drain, printed:
```
idle frameAfterDrop=false A=[["two"]] B=[["three"]]
```

4. `sh utils/unused-exports.sh | diff - .../O175-base/unused-exports.txt` printed nothing.

Other commands the report quotes, compared:
- `LC_ALL=C grep -n '[^ -~]'` over the six files: no line, `grep exit 1`.
- `wc -l`: 94, 516, 82, 221, 285, 768, as reported. `Slide.svelte` at 516 is under 520.
- `awk 'length($0)>100'` over comment lines: nothing.
- `git show 266bf0c0e:src/lib/views/academic/present/screen/layout-turns.ts`: `fatal: path ... exists on disk, but not in '266bf0c0e'`, so the module is absent on the base as the first run says.
- `grep -n` over `Present.svelte` and `Presenter.svelte`: `:429`, `:119`, `:131` pass no `turns`. The show and print routes draw `Slide` with no `turns`.
- `grep -rn 'holdTall\|markOf' src`: as reported.
- `src/lib/themes/slide.css:59`: `box-shadow: inset 0 0 0 1px var(--line);`.
- History words over the added comment lines and `layout-turns.ts`: the same five hits the report lists, each a statement of order in the moment.
- The Open items section of the state file holds the report's quoted sentence and no entry.
- `git status --short`: five modified files, the new module and the report, and this review left it the same.
- `.agents/scratch` is absent, so the case program was removed.

`npm run diagrams` was not run; see "Declined to judge".

## Verdict per item of "What to build"

1. Tile work takes turns: holds. `layout-turns.ts:39-81`: closure state only, `TURNS` is an immutable Symbol. An idle ask starts (`schedule`, confirmed by my extra run). At least one job runs per frame. A throw is caught and logged. Hidden-tab behaviour holds by reading, since the handle stays and the jobs stay in the Set.
2. Only tiles use it: holds. Every layout path goes through `turns.ask` or `askLayout` (`Slide.svelte:331`, `:348`, `:388`, `:392`). Only `Tile.svelte:148` sets the prop. With no `turns`, the microtask path is unchanged.
3. Slide mounted at its turn: holds. `flushSync(fn)` runs `fn` and flushes the batch before returning (`node_modules/svelte/src/internal/client/reactivity/batch.js:1033-1060`), so the mount's cost falls inside `job()` and before `now() - started`.
4. Containment: holds. The rule is as named. `.room` already has `overflow: hidden` at the full size of `.shot` (`Stage.svelte:105-115`), and a too tall slide scrolls inside `.frame`, so paint containment clips nothing that was not already clipped, a Too tall slide included.
5. A waiting slide: holds. `.waiting` is unchanged, and `pressed` does not depend on `mounted`.
6. A tile not yet laid out writes no measure: violated in part, Behaviour 1. The first layout is held correctly, and a tile destroyed while waiting writes nothing. A tile waiting for a later layout does write a measure, which goes against "a waiting tile carries no Too tall mark and no Findings row".
7. Repeats collapse: holds (C3, Set).
8. A queue entry that goes away is dropped: holds. Teardowns at `Tile.svelte:106` and `Slide.svelte:337`; the queue lives in the Overview's instance and the last drop cancels the frame.
9. Every tile drawn and measured: holds by reading; no code path skips a tile.
10. tooTall: holds. Every write to `tall` goes through `holdTall` (`present.svelte.ts:447-448`, callers `:495`, `:524`, `:536`), which updates the cell under the same key `Tile.svelte:110` reads, so the mark appears and disappears for the right tile. `tallFindings` still reads `tall.values()`, so the Findings view's source is unchanged. Reads of the cell are tracked: `proxy.js:186` uses `source`, and only `state` pushes to the reaction's own sources (`sources.js:99-105`).
11. Comments: violated in one sentence, Standards 1. The rest hold.

## Verdict per case

- C1 met. C2 met. C3 met. C4 met. C5 met. C6 met.
- C7 not verifiable: needs the portfolio deck in the Overview with a `PerformanceObserver` for long tasks, and a reload.
- C8 not verifiable: needs a scratch deck with a slide known too tall, read while tiles wait and after the queue empties.
- C9 not verifiable: needs a theme switch with the Overview open. The look should also watch for the false marks of Behaviour 1.
- C10 not verifiable: needs another deck chosen while tiles arrive.

## Spec

**Spec 1. A waiting job asked again keeps its place, where the brief's decision 2 says it goes to the back.**
- Place: `src/lib/views/academic/present/screen/layout-turns.ts:70-73`.
- Hunk: `ask(job) { waiting.add(job); schedule(); }`
- What is wrong: decision 2 reads "a job asked again goes to the back". Item 7 (not queued twice) is compatible with that, since delete-then-add also queues once. `Set.add` keeps the original place. The builder chose this and lists it as judgment call 1, so it is disclosed, but the brief had decided the point. The orchestrator rules whether the departure stands.
- Failure scenario: tile 3's layout is waiting and its image loads. By the brief the job moves behind tile 110; in the code it stays third. No wrong picture results, only a different order from the one the brief decided.

No other spec finding: no dependency added, no script beyond the case program, the write list is kept, and each case has its first run in the report.

## Proof

None.

## Standards

**Standards 1. A sentence in the `Framed.svelte` head comment is false for a tile waiting on a later layout.**
- Place: `src/lib/views/academic/present/screen/Framed.svelte:20-21`.
- Hunk: `A tile waiting its turn therefore writes no measure`
- What is wrong: `report` holds a measure only while `laidOf !== drawing` (`:55`). Once a slide has been laid out, a tile waiting on a font, probe or image layout writes every measure at once.
- Failure scenario: the one in Behaviour 1; a maintainer reading this sentence believes no waiting tile can write. Fixing Behaviour 1 makes the sentence true.

## Behaviour

**Behaviour 1. After a text size, theme or font change, a laid-out tile can show a false Too tall mark and Findings row until its re-layout turn.**
- Place: `src/lib/views/academic/present/screen/Framed.svelte:54-57`, with `Slide.svelte:388` and `:392`.
- Hunk: `if (turns !== undefined && laidOf !== drawing) held = { over, of: drawing }; else measured(deck, row, over);`
- What is wrong: item 2 sends those layouts through the queue, but the measure gate covers only the first layout of a `drawing`. The Stage's observer (`Stage.svelte:79-81`) still reports as soon as the slide's box changes, and `laidOf === drawing`, so the measure goes straight to the store while the layout that would correct it is waiting.
- Failure scenario:
  - Take a 110-tile Overview fully laid out, then raise the text size or switch to a rice theme, which rescales the slide's design sizes (`src/lib/themes/slide.css:101`).
  - A slide near its limit at its old `--slide-fit` runs past the frame. `measured` calls `holdTall`, so the tile shows the Too tall chip and Findings gains a row.
  - Both stay until that tile's job runs. Layouts of that weight run about one per frame at an 8 ms budget, so the last tiles wait for most of the drain. That duration is a judgment from reading, not measured.
  - On the base the layout ran inside the probe's observer callback (the removed `layOutSlide();`), so the corrected measure followed within a frame at most.
- Not stated by the report: its limitations section names only a body change with the same `drawing`. The row "Font load or theme change with the Overview open" gives no before and after for the marks or Findings. The look needs this row to know what to watch at C9.

## Declined to judge

- C7 to C10 and the real cost of a layout: no page may be opened here.
- Whether `contain: layout paint style` without size containment reduces forced-layout cost as the head comment of `Tile.svelte` says. The brief names this shape, and only the look's long-task numbers settle it.
- The pre-layout measure that `settled` writes on the first layout, which item 6 asks for. By reading, the Stage's observer corrects it in the same frame whenever layout changes the `.slide` box, and if the box does not change the held value is right. The order against paint is not observable without a page.
- `npm run diagrams`, the command the report ran before the list: not run, because it writes `.dot` and `.svg` files (`utils/diagrams/diagrams.mjs:204-205`) and this review changes nothing. The list passed without it.
- A grep of mine named the `config` folder without excluding `config/local.yml`, which my instructions forbid, and I stopped it. `config/local.yml` does not exist in this worktree (a name-only test), so nothing of it was read.

Usage: adb90dccc11ae0293, claude-opus-5-5, 177393 tokens, 29 tool uses, 1144 s

## Closed

- Spec 1: left as built. The brief's decision 2 is read as a job asked again after it has run; a job still waiting keeps its place, so that tiles keep arriving top to bottom.
- Standards 1 and Behaviour 1: repair round 1.

# Repair round 1, refuted

Review of repair round 1 of step O175. No finding in any of the four headings. Both findings the round was sent are closed by reading, and verify items 1 to 4 reproduce. C7 to C10 are still owed at the look.

## Verification lines, verbatim

Run from the worktree root, node v24.21.0 first on `PATH`, `TMPDIR` unset, `GIT_CEILING_DIRECTORIES` set to the worktree's `.agents/scratch`.

1. `npm run test:quick`:
```
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      ASCII gate (1.4 s)
ok      svelte-kit sync (3.2 s)
ok      eslint (2.7 s)
ok      svelte-check (10.9 s): 1794222723839 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (30.3 s): Duration  17.51s (transform 29.82s, setup 0ms, import 50.65s, tests 2.42s, environment 251ms)
ok      vitest slow (36.2 s): Duration  23.24s (transform 13.01s, setup 0ms, import 16.80s, tests 6.29s, environment 0ms)
ok      vitest checks (55.6 s): Duration  42.53s (transform 12.97s, setup 0ms, import 28.92s, tests 90.97s, environment 3ms)
test:quick: 58.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source, tests/checks/tree and
            tests/checks/imports, which run for any change under src, tests or
            utils; the build, the lint of unchanged files
```

2. ASCII gate, the `perl` command of `agents/spec.md`:
```
find: bin: No such file or directory
perl exit 0
ls: bin: No such file or directory
```
No file line was printed. The `find` line is the absence of a `bin` folder, which the report also says.

3. C1 to C6, by the report's program with an absolute import, at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o175-round1-cases.mjs` (`node --no-warnings`):
```
C1 frames=[["j1","j2","j3","j4"],["j5","j6","j7","j8"],["j9","j10"]] perFrame=[4,4,2]
C2 frames=[["slow"],["a","b"]]
C3 frames=[["twice","after"]]
C4 frames=[["first","behind"]]
C5 frames=[["self","other"],["third","self"]] frameLeftPending=false
C6 frames=[["before","throws","after"]] consoleError=["boom"]
```

4. `sh utils/unused-exports.sh | diff - /Users/axelfaes/workspace/oculus/.agents/worktrees/O175-base/unused-exports.txt`: printed nothing, `diff exit 0`.

Other commands the round's report quotes, compared:
- `grep -rn 'laidOf' src tests`: no line, exit 1.
- `wc -l`: `layout-turns.ts` 94, `Slide.svelte` 516, `Framed.svelte` 98, `Tile.svelte` 221, `Overview.svelte` 285, `present.svelte.ts` 768, as reported.
- `LC_ALL=C grep -n '[^ -~]'` over `Framed.svelte`: no line, exit 1.
- History words over the comment lines of `Framed.svelte`: no line, exit 1.
- `awk 'length($0)>100'` over `Framed.svelte`: nothing.
- Greedy-wrap check over `Framed.svelte:17-24`: no line short; lengths 97 98 96 100 99 95 93 71.
- `git status --short` printed the five modified source files, the new module, the report and the orchestrator's two files. It was the same after every command I ran.
- `diff -u` of each path of `files.txt` against the snapshot: only `src/lib/views/academic/present/screen/Framed.svelte` differs, as the report says. No path is changed outside `files.txt` except the three `.scratch` files.

`npm run diagrams` was not run; see "Declined to judge".

## Verdict per item of "What to build", whole diff since 266bf0c0e

1. Tile work takes turns: holds. `layout-turns.ts:39-81` has closure state only, and `TURNS` is an immutable Symbol. C1, C2, C4, C5 and C6 reproduce. Hidden-tab behaviour holds by reading: jobs stay in the Set and frames resume.
2. Only tiles use it: holds. The layout paths go through `askLayout` or `turns.ask` (`Slide.svelte:331`, `:348`, `:388`, `:392`). `Tile.svelte:148` alone sets the prop. The print page (`routes/present/print/+page.svelte:195`) draws `Slide` with `onlaid` and no `turns`.
3. Slide mounted at its turn: holds. `Tile.svelte:100-105`, flushed inside the job.
4. Containment: holds. `Tile.svelte:213`.
5. A waiting slide: holds. `.waiting` is unchanged, and `pressed` does not depend on `mounted`.
6. A tile not yet laid out writes no measure: holds, closing the part the first review found violated. `Framed.svelte:70-73` and `:76-82`. Every layout path passes through `watched.ask` (`:61-64`), so `asked` covers every trigger. Reasoning for the first layout and the probe change is under Behaviour.
7. Repeats collapse: holds (C3, Set).
8. A queue entry that goes away is dropped: holds. Teardowns at `Tile.svelte:106` and `Slide.svelte:337`; a queue left with no job cancels its frame.
9. Every tile drawn and measured: holds by reading; no path skips a tile. A tile hidden when its job runs is laid out when shown again (see Behaviour).
10. `tooTall`: holds. `present.svelte.ts:429-451` and `:584`. The round did not touch it, and the first review's reading stands against the same text (`diff` printed nothing for this file).
11. Comments: holds, closing the first review's Standards 1. The head comment of `Framed.svelte:17-24` now says what `report` and `settled` do. The head comments of `Slide.svelte:35-39`, `Tile.svelte:2-17` and `Overview.svelte` say what the code does.

## Verdict per case

- C1 met. C2 met. C3 met. C4 met. C5 met. C6 met.
- C7 not verifiable. Settled by the portfolio deck in the Overview with a `PerformanceObserver` for long tasks, and again after a reload with the Overview open.
- C8 not verifiable. Settled by a scratch deck with a slide known too tall: read the tile and Findings while tiles wait and after the queue empties.
- C9 not verifiable. Settled by switching the theme with the Overview open: the page keeps answering, every tile ends laid out in the new theme, and no tile gains or loses a mark or Findings row until its own layout has run.
- C10 not verifiable. Settled by choosing another deck while tiles arrive.

## Spec

None. Over the delta: only `Framed.svelte` changed, on the write list. The way `Slide.svelte` tells `Framed.svelte` of an ask was left to the builder by the round's brief. Spec 1 of the first review was ruled "left as built" and is unchanged.

## Proof

None. Every closure the report claims reproduces by the rerun above or by reading, including its six numbered cases of what the code does.

## Standards

None.

## Behaviour

None. The points named for this review, each read and without a finding:

- **A check removed rather than fixed.** The round removes `laidOf !== drawing`. What it guarded is still guarded. A change of `row` re-runs the effect at `Slide.svelte:343`, which asks at `:348` and sets `asked`. A `drawing` that changes while a measure is held is covered by the `of` tag at `Framed.svelte:71` and `:80`.
- **`asked` set on an ask whose job is then dropped and asked again.** The only drop sites are teardowns (`Slide.svelte:337`, `Tile.svelte:106`). `Slide.svelte:337` depends only on `turns`, so it runs at destroy, when `asked` no longer matters. The same reasoning covers a `watched` that never changes (next point).
- **`watched` being a new object.** It is one object for the life of a `Framed`. `turns` comes from a plain `const` in `Tile.svelte:88`, so the derived has no signal dependencies, and `node_modules/svelte/src/internal/client/reactivity/deriveds.js:414-417` says "deriveds without dependencies should never be recomputed". The two effects in `Slide.svelte` that read `turns` therefore never re-run for it. If it did change, `:337` would drop and `:348` would re-ask, losing no job.
- **A hidden slide, an early return.** `layOutSlide` returning at `Slide.svelte:173-174` leaves `asked` true, but the next show re-asks. At zero width `sizeOf` returns null (`:369-375`), so the probe's observer sets `seen = null` (`:382-384`), and when the slide is drawn again `:386` passes and `:388` asks. A tile mounted while hidden starts with `seen` null and takes the same path. So measures are held only while hidden, when the Stage reports nothing anyway (`Stage.svelte:70`).
- **A thrown layout.** `asked` stays true and held measures stay unwritten until that tile's next completed layout, and only for that tile. That is what item 6 and the round's brief ask for a layout that has not run. `grep -n throw` over `slide-layout.ts` and `drawn-slide.ts` prints nothing, so only a child's render error reaches it.
- **A change of `drawing` while a measure is held.** Effects run in creation order (`batch.js:493-515` traverses the tree in order), and `Slide`'s user effects are created before `Stage`'s (`context.js:197-207`, `pop`). So the ask comes first and the new observer fires after it. A measure of the old `drawing` is dropped at `:80`, and the new observer's first report supplies the new one.
- **Order of the probe's observer and the Stage's.** The closure of Behaviour 1 rests on this order for a text size or theme change. The probe's `ResizeObserver` is constructed before the Stage's, for the same creation-order reason, and observers are notified in construction order under the ResizeObserver specification (from the specification, not run). So `asked` is set before the Stage's callback runs in the same delivery.
- **An ask during the slide's own job.** The report says no path reaches it. By reading that holds: the effects flushed inside the job do not re-run the effect at `Slide.svelte:343`, and image, font and observer events arrive in other tasks.

## Declined to judge

- C7 to C10, and the real cost of a layout: no page may be opened here.
- The order of `document.fonts` `loadingdone` against the Stage's observer, for a font that loads after the queue has emptied and does not move the probe by `PROBE_DRIFT` (a heading font, for example).
  - If the observer runs first, the measure reaches the store with `asked` false, then `loadingdone` asks, and a false mark can stay until that tile's turn.
  - The round's rule is literally met, since no layout had been asked yet.
  - The order is the browser's and I have not observed it. The look would settle it by watching marks while such a font loads on a fully laid-out Overview.
- Whether `contain: layout paint style` without size containment reduces the forced-layout cost: only the look's long-task numbers settle it.
- `npm run diagrams`: not run, because it writes `.dot` and `.svg` files into the worktree. The report says it ran it before the list, and the list passed here without it.
- How many times the builder ran the list in this round: the report says once, and nothing here can check that.

Usage: a57800376f8d13f5b, claude-opus-5-5, 159360 tokens, 24 tool uses, 452 s
