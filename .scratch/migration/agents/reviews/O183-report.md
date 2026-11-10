# O183 report: a running agent's terminal takes the whole height in the Live view

Everything in the brief is done.

One premise of the brief does not reproduce, and it changes no code of the step: the brief says G146 (`.scratch/migration/agents/guarded.md:436`, "a terminal's kind, its box and a steer follow it") "stays true, since the kind still decides the Transcript box". The Transcript box does not read the terminal's kind: `TranscriptBody.svelte:418` draws it on `record !== null && agent === ''`, where `agent` is the subagent id prop, and finds its terminal by `sessionTerminal` (`src/lib/state/sessions/terminal/session/session-link.ts:41-55`: resumes id, pid, agent pid, Codex link). `grep -rn "\.kind" src/lib/views/sessions/terminal/transcript/ src/lib/state/sessions/terminal/session/` prints only `row.kind` hits of the turn rows, and no terminal kind. After this step no view draws a box from a terminal's kind, so the words "its box" in G146 name nothing on the client. G146's code and test are server code (`agents.ts`, `pty/panes/`) and are unchanged; the entry's wording is the orchestrator's to change, since the ledger is outside my write list.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1. `TerminalGrid.svelte` draws no `SteerBox`: block, `agent` derived and import removed | DONE | `diff` of the file against `../O183-base` shows `52d52 < import SteerBox ...`, `199,200d198 < ... const agent = $derived(...)`, `478,480d475 < {#if agent} <SteerBox {terminal} {locked} /> {/if}` |
| 2. Head comment and prop comment say what is true | DONE | same `diff`: `3,12c3,13` (head comment) and `105c105` now `/** Whether the tab is locked, which leaves this grid read-only. */` |
| 3. The Transcript view keeps its box unchanged | DONE | `diff -rq` over `config src tests utils` against `../O183-base` lists only `TerminalGrid.svelte`; `TranscriptBody.svelte:418-420` and `SteerBox.svelte` are unchanged |
| Verify 1: `npm run diagrams`, then `npm run test:quick` once with `TMPDIR` unset | DONE | `npm run diagrams` exit 0; `env -u TMPDIR npm run test:quick` exit 0, last lines: `ok      vitest checks (68.5 s): Duration  54.78s (transform 28.56s, setup 0ms, import 53.99s, tests 114.54s, environment 3ms)` and `test:quick: 72.3 s; every command passed` |
| Verify 2: `grep -rn -i -E "SteerBox\|steer box\|prompt box" src tests config docs README.md --exclude=local.yml` | DONE | 13 hits, none in `TerminalGrid.svelte` (`grep -n -i -E ... TerminalGrid.svelte` exit 1); each hit judged below |
| Verify 3: `sh utils/unused-exports.sh` compared with `../O183-base/unused-exports.txt` | DONE | `diff ../O183-base/unused-exports.txt <output>` printed nothing, exit 0 (335 lines both) |
| Verify 4: ASCII check of `agents/spec.md` over the changed file | DONE | `LC_ALL=C perl -ne '...' src/lib/views/sessions/terminal/grid/TerminalGrid.svelte` printed nothing, exit 0 |

The lines of the `test:quick` run, as printed:

```
test:quick: 3 changed file(s), from git since HEAD
test:quick: 12 test file(s)
ok      prettier (1.5 s): All matched files use Prettier code style!
ok      ASCII gate (1.6 s)
ok      svelte-kit sync (3.6 s)
ok      eslint (12.8 s)
ok      svelte-check (37.9 s): 1794301655603 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (68.5 s): Duration  54.78s (transform 28.56s, setup 0ms, import 53.99s, tests 114.54s, environment 3ms)
test:quick: 72.3 s; every command passed
```

The verify list ran once; no whole-suite command ran. The 12 test files it ran are the checks under `tests/checks/imports`, `tests/checks/source` and `tests/checks/tree` (comment width, history and size among them). The step adds or changes no test.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:189-197`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)







An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry.

## The cases' first run, on the unchanged tree (by reading)

- Live terminal running Claude: `agent` is `terminal !== null && terminal.kind !== 'shell'` (`:199-200`), true for kind `claude`, so `SteerBox` is drawn under the grid (`:478-480`). Its `.steer` is `flex: none; padding-top: 6px` (`SteerBox.svelte:130-134`) with a two-row `TextArea` and a foot of Stop and Send, so the `flex: 1 1 auto` grid (`:504-509`) ends above the box. The ResizeObserver (`:373-382`) sends the shorter height, so the agent's input line sits above the box. Result: the box is there, as the brief says of today.
- Live terminal running Codex: the same, kind `codex`.
- Live shell terminal: kind `shell`, `agent` false, no box; `.grid` is the only flow child of `.half` (ContextMenu's `.context` is `display: contents`, `ContextMenu.svelte:233-236`; FloatingBar is `position: absolute`, `FloatingBar.svelte:26-28`), so it fills `.half` down to `.terminal`'s `4px 6px 6px` inset (`Terminal.svelte:463-469`). Result: fills the body.
- Split tab with an agent and a shell: each `.side` holds one `.half` of `height: 100%`; the agent's half draws the box and its grid ends above it, the shell's grid reaches the inset. Result: the two grids end at different heights.
- By-hand pane running an agent: `byHandRow` gives it kind `agent.tool` (`src/lib/server/machine/pty/panes/listing.ts:106`), so the box is drawn; `fits` is false, `resized()` returns at `:207`, `grid.resize(byHand...)` at `:283` keeps its size and `.grid.pane` scrolls (`overflow: auto`, `:512-514`). Result: box drawn under the scrolling pane, no resize sent.
- Foreign terminal on Live: a foreign agent pane carries an agent kind (`listing.ts:106`), so the box is drawn with `terminal.foreign === true`, `usable` false (`SteerBox.svelte:44`) and the `composer.elsewhere` line (`:47-50`, `:120-121`). Result: the line is drawn on Live.
- Agent started in a shell terminal, or an agent that exits: `withAgents` (`src/lib/server/machine/processes/agents.ts:83-90`) turns a `-shell` terminal's kind into the agent's tool while one runs and back to `shell` after, so `agent` flips, the box mounts or unmounts, the grid's height changes and the ResizeObserver sends a resize. Result: the height and the pty size change with the kind.
- Running agent whose session the page cannot link yet: no Transcript switch, so the body draws the grids (`Terminal.svelte:378-400`), and the Live grid draws the box for the agent kind. Result: a box on Live.
- Transcript view of a live session: `TranscriptBody.svelte:418-420` draws `SteerBox` with `ended={!record.live}` false, `usable` when the session's terminal is found and the tab unlocked. Result: box with Send and Stop.
- Transcript view of an ended session: `ended` true; with no terminal found `usable` is false and `refusal` is `composer.ended` (`SteerBox.svelte:47-50`). Result: the ended line.
- Locked tab on Live: `grid.options.disableStdin = locked` (`:282`), paste refused at `:214`, `:258`, `:330`, drop at `:265`; the Live box for an agent shows the `composer.locked` line. Result: grid takes no input, and the box's locked line is drawn on Live.

No case is one the brief's rules get wrong.

## Each case after the change (by reading; proof is the look at landing)

- Live terminal running Claude: no `SteerBox` in `TerminalGrid.svelte`; `.grid` is the only flow child of `.half`, so it reaches `.terminal`'s inset as a shell grid does; the ResizeObserver sends the full height and the agent draws its input line on the last rows. Look: Terminal tab on Live with Claude running; the grid reaches the bottom inset, no text box, Stop or Send under it, no empty band under Claude's input line.
- Live terminal running Codex: the same. Look: the same with Codex.
- Live shell terminal: unchanged markup path; fills the body. Look: a shell tab looks as on main.
- Split tab with an agent and a shell: both halves hold only their grid, so both reach the inset. Look: a split of an agent and a shell; both grids end at the same bottom line.
- By-hand pane running an agent: keeps `byHand` size (`:281`), sends no resize (`:205`), scrolls in the taller `.grid.pane`, draws no box. Look: a by-hand agent pane on Live; it scrolls, no box.
- Foreign terminal on Live: no box, so no `composer.elsewhere` line on Live; on Transcript, `sessionTerminal` filters foreign terminals (`session-link.ts:47`), so the box finds none and says `composer.elsewhere`. Look: a foreign agent terminal on Live shows only its grid; on Transcript the box says it cannot be typed into from here.
- Agent started in a shell terminal, or an agent that exits: no element of the grid depends on the kind, so the height holds and no ResizeObserver callback follows from the change of kind. Look: start `claude` in a shell terminal and quit it; the grid does not jump.
- Running agent with no session link: no switch, no Transcript body, no box on Live, so no box in the tab; typing goes into xterm (`:323`). Look: a fresh agent before its session is linked; only the grid.
- Transcript view of a live session: `TranscriptBody.svelte` unchanged; box with Send and Stop. Look: Transcript of a live session.
- Transcript view of an ended session: unchanged; the ended line. Look: Transcript of an ended session.
- Locked tab on Live: `:280` (`disableStdin`), `:212`, `:256`, `:263`, `:328` unchanged; no box, so no locked line on Live. Look: lock a Live agent tab; typing, paste and a file drop do nothing, and no locked line is drawn.

## Files changed (`diff -rq` against `../O183-base` over `config src tests utils`, and `git status --short` for the rest)

| Path | Lines (`git diff --numstat`) | In the write list |
| --- | --- | --- |
| `src/lib/views/sessions/terminal/grid/TerminalGrid.svelte` (510 lines) | +12 -17 | yes |
| `docs/diagrams/layer-views.dot` | +1 -1 | no: written by `npm run diagrams`, which the verify list runs first; the edge `views/sessions to views/shared` counts 20 imports in place of 21, since the grid's `SteerBox` import is gone |
| `docs/diagrams/layer-views.svg` | +1 -1 | no: the same diagram's render |
| `.scratch/migration/agents/reviews/O183-report.md` | this file | yes |

The base copy holds `config`, `src`, `tests` and `utils` only, so the `docs/diagrams` files come from `git status --short`.

## Greps and re-reads

The brief's grep, its 13 hits judged:

- `TranscriptBody.svelte:46`, `:48`, `:54`, `:81`, `:419` and `SteerBox.svelte:2`: the Transcript box and its own component, which stay.
- `composer.ts:428`, `place.ts:283`, `dragging.svelte.ts:6`, `Composer.svelte:20`, `TaskBlock.svelte:4`: the composer's prompt box.
- `review-comment.ts:43` ("An agent's prompt box reads these first characters..."): the agent program's own input line, still true.
- `config/text/views/sessions/composer.yml:1` ("the prompt box that steers a running one"): still true of the Transcript box.

History words over the comment lines changed (`TerminalGrid.svelte:2-13`, `:105`), `grep -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O[0-9]+|20[0-9][0-9]-"`: one hit, `:8` "before it is sent, since each line would run", which says when the paste question is asked and compares with no earlier state; the words are the base's own.

Comment width: the head comment's lines measure 92, 98, 100, 66, 90, 94, 99, 97, 99, 99, 96, 60 columns, and no line's next word fits within 100 (line 5 ends at 66 because the next word, `(transcript/TranscriptBody.svelte).`, is 35 characters); `tests/checks/source/comment-width.test.ts` passed in the run above.

Re-read after the change:

- `TerminalGrid.svelte` head comment `:2-13`: rewritten.
- `TerminalGrid.svelte:105` prop comment: rewritten.
- `TerminalGrid.svelte:199` (`fits`) and `:506` (the `.grid.pane` comment): still true.
- `TranscriptBody.svelte:46-49`: still true.
- `SteerBox.svelte:2-10`: still true (it is the box under the Transcript's session; its lock, foreign and ended lines stay).
- `config/text/views/sessions/composer.yml:1`: still true.
- `docs/HELP.md:257` and `config/text/views/sessions/terminal.yml:106` ("boxes and grids"): still true, since the lock covers the Transcript box.
- `Terminal.svelte` head comment: names no box under the grid (`grep -n -i "steer\|box"` finds only `box-sizing`), still true.
- `.scratch/migration/agents/guarded.md:436` G146: see the first section.

Ids and asynchronous paths: the step introduces no id or key. `SteerBox`'s `send` and `stop` are no longer mounted under a Live grid, so a send in flight can no longer be torn down by a change of kind on Live; on Transcript nothing changed. `locked`, `terminal` and `splits` keep their readers (`svelte-check`: 0 errors, 0 warnings).

## Judgment calls (each reversible)

- The head comment adds one clause that says where a session is steered from now, "a session is steered from under the Transcript view's turns (transcript/TranscriptBody.svelte)", so a reader of the grid finds the box. The brief's item 2 asks only for the whole height and the read-only lock; the clause can go.
- The lock sentence reads "While the tab is locked the grid is read-only: it takes no typing, paste or drop."
- The diagrams that `npm run diagrams` rewrote are kept in the diff, since the committed diagrams must match the source the verify list checks.

## User-visible changes, before and after

- Terminal tab, Live, a terminal running Claude or Codex (by-hand and foreign panes included): before, a two-row text box with Stop and Send (or a read-only line for a foreign, locked or unlinked case) under the grid, the grid ending above it; after, no box and no line, the grid reaching the tab's bottom inset as a shell grid does, the agent's input line on the grid's last rows.
- Terminal tab, Live, split of an agent and a shell: before, the agent's grid ended higher than the shell's; after, both end at the same bottom line.
- Terminal tab, Live, an agent starting in or quitting a shell terminal: before, the grid shrank or grew and the pty was resized as the box came and went; after, the grid's height holds.
- Terminal tab, Live, locked agent tab: before, the box's locked line under the grid; after, no line; the grid still takes no typing, paste or drop.
- Terminal tab, Transcript: no change.

## Anything in the brief that was wrong

- The G146 premise in the first section: the Transcript box is decided by the session link, not by the terminal's kind.
- The brief's write list does not name `docs/diagrams/layer-views.dot` and `.svg`, which `npm run diagrams` rewrites because of this step's import removal.

## Limitations and sharp edges

- Every case is checked by reading only; the Live height and the absence of an empty band under an agent's input line are for the look at landing.
- One read-only `git grep -n -E "SteerBox|data-steer" -- tests` was run to confirm the brief's statement; `git grep` is outside the three git read commands `agents/spec.md:33` allows. It changed nothing and printed nothing (exit 1).
- The suite's fixture folders went to the system's temporary folder during `test:quick`, which the suite cleans itself; `.agents/scratch/` is removed.
