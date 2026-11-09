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
