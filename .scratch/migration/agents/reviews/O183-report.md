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

## Repair round 1

Everything in the round is done. Two files beyond the ones the round names were changed for item 3, `src/lib/state/sessions/terminal/terminal-tabs.ts:51` and `src/lib/views/sessions/terminal/transcript/tab-session.svelte.ts:84`. They carry the same plural sentence about the lock ("the tab's boxes and grids"), and `agents/spec.md:72` asks for a change to reach every hit.

### DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1. The head comment's clause on steering removed, paragraph rewrapped (S1) | DONE | `diff` of `TerminalGrid.svelte` against `../O183-base` (below); line widths 92, 98, 100, 96, 100, 99, 99, 99, 97, 94, 14, and no line's next word fits within 100 |
| 2. SteerBox has one size (St1) | DONE | `diff` of `SteerBox.svelte` and `TranscriptBody.svelte` (below); `grep -rn -E "\bsmall\b" src/lib/views/shared/sessions/SteerBox.svelte src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte` prints one line, `TranscriptBody.svelte:407: small`, which is the `small` prop of the `ToolButton` of the older-turns retry (`:406-408`) and not of SteerBox |
| 3. The lock's sentences name one box (St2) | DONE | `diff` of `terminal.yml`, `SessionTools.svelte`, `terminal-tabs.ts`, `tab-session.svelte.ts` (below); `docs/HELP.md:257` is not edited and is named below |
| 4. The report: B1, B2, S2, S4 | DONE | the sections below |
| Verify: `npm run diagrams`, then `env -u TMPDIR npm run test:quick` once | DONE | diagrams exit 0, no further diagram change; `test:quick` exit 0, last line `test:quick: 146.4 s; every command passed` |
| Verify: the brief's grep | DONE | 13 hits, the same 13 as in the step; 0 in `TerminalGrid.svelte` (`grep -c` prints 0) |
| Verify: unused exports | DONE | `diff ../O183-base/unused-exports.txt <output of sh utils/unused-exports.sh>` printed nothing, exit 0 |
| Verify: the ASCII check of `agents/spec.md:103` over every file changed | DONE | printed nothing, exit 0 |

The `test:quick` lines as printed:

```
test:quick: 12 changed file(s), from git since HEAD
test:quick: 17 test file(s)
        tests/routes/sessions/terminal.test.ts: named for a changed file
        tests/state/sessions/terminal/reading-tab.test.ts: imports at depth 1
        tests/checks/tree/boundaries.test.ts: imports at depth 2
        tests/state/sessions/terminal/ending.client.test.ts: imports at depth 2
        tests/state/sessions/terminal/show-focus.client.test.ts: imports at depth 2
        tests/state/workbench/layout/folder-opener.test.ts: imports at depth 2
ok      prettier (12.8 s): All matched files use Prettier code style!
ok      ASCII gate (13.6 s)
ok      svelte-kit sync (18.8 s): See https://rolldown.rs/reference/InputOptions.checks#plugintimings for more details.
ok      eslint (38.5 s)
ok      svelte-check (44.7 s): 1794302665784 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (83.0 s): Duration  36.22s (transform 51.64s, setup 0ms, import 77.71s, tests 697ms, environment 2.93s)
ok      vitest checks (124.1 s): Duration  77.22s (transform 33.34s, setup 0ms, import 68.69s, tests 179.80s, environment 3ms)
test:quick: 146.4 s; every command passed
```

The 12 changed files are the nine tracked files below plus the three ledger files the round added (`O183-round-1.md`, `O183-refuter.md` and this report). The verify list ran once in this round, and no whole-suite command ran. The round adds or changes no test. `grep -rn -E "terminal_lock_tip|boxes and|take no typing" tests` finds no test on the lock's wording; its one hit is an unrelated diagram sentence in `tests/checks/source/html-sites.test.ts:44`.

### 1. The head comment (S1)

```
<     // terminal panel draws one: xterm.js over the `pty:` channel, with the steer box under it only
<     // when Claude or Codex runs in it (a shell is typed into at the grid, which then takes the
<     // whole height). A split tab draws two of these side by side, so everything one grid holds (the
...
>     // terminal panel draws one: xterm.js over the `pty:` channel. The grid takes the whole height
>     // of its box whatever runs in it, a shell, Claude or Codex, and each is typed into at the grid.
>     // A split tab draws two of these side by side, so everything one grid holds (the mount, the
>     // subscription, the resize, the bell, the paste question and the file drop) is this component's
>     // own. A paste of several lines is asked about before it is sent, since each line would run; a
>     // file dropped from the Files view types its quoted path; a bell is reported to the tab, which
>     // marks the terminal's row. While the tab is locked the grid is read-only: it takes no typing,
>     // paste or drop. A by-hand terminal is drawn at the size of its pane from the terminals list
>     // and scrolls inside the grid, and the grid sends no resize, since the pane's size is the
>     // user's.
```

The comment now names no other component. The whole paragraph is rewrapped greedily at 100 columns, so the last line holds the one word `user's.`.

### 2. SteerBox has one size (St1)

```
SteerBox.svelte
8,10c8,9
<     // ended, each with a line of its own. Its text box and that line are at the body's `--fs-md`,
<     // or at `--fs-sm` with `small`, in a view whose text is `--fs-sm` (a Terminal tab's transcript
<     // body).
>     // ended, each with a line of its own. Its text box and that line are at `--fs-sm`, since the
>     // box sits in a Terminal tab's transcript body, whose text is `--fs-sm`.
27,28d25
<         /** Whether the text box and the line under it are at `--fs-sm`. */
<         small?: boolean;
31c28
<     let { terminal, locked = false, ended = false, small = false }: Props = $props();
>     let { terminal, locked = false, ended = false }: Props = $props();
89c86
< <div class="steer" class:small data-steer>
> <div class="steer" data-steer>
174c171
<         font-size: var(--fs-md);
>         font-size: var(--fs-sm);
177,178c174
<     .small .elsewhere,
<     .small :global(.oculus-field) {
>     .steer :global(.oculus-field) {

TranscriptBody.svelte
419c419
<         <SteerBox terminal={terminalOfSession(record)} {locked} ended={!record.live} small />
>         <SteerBox terminal={terminalOfSession(record)} {locked} ended={!record.live} />
```

On the base, the field's size under `.small` came from `.small :global(.oculus-field) { font-size: var(--fs-sm) }`. That selector compiles to `.small.svelte-1ht4wce .oculus-field`, three classes, (0,3,0), so it overrides `src/lib/ui/theme/field.css:12-19` (`.oculus-field { font-size: var(--fs-md) }`, one class, (0,1,0)); `body.rice .oculus-field` weighs (0,2,1) and sets no font-size. The new `.steer :global(.oculus-field)` has the same three-class weight and the same place in the same stylesheet, so the field keeps `--fs-sm`. `TextArea.svelte` sets no `font-size` on `.area` or `.area.bare` (`grep -n font-size` finds only `.area.tree` at `:124`). `.elsewhere` is at `--fs-sm`, which is what `.small .elsewhere` gave it. `grep -rn "<SteerBox" src` finds one caller, `TranscriptBody.svelte:419`.

### 3. The lock's sentences (St2)

```
config/text/views/sessions/terminal.yml
106c106
<         terminal_lock_tip: 'Lock this tab: its boxes and its grids take no typing until it is unlocked'
>         terminal_lock_tip: 'Lock this tab: its box and its grids take no typing until it is unlocked'

SessionTools.svelte
3,4c3,4
<     // TerminalActions.svelte: Lock, drawn while a terminal with a session shows, which leaves every
<     // box and grid of the tab read-only, and Jump to the last turn while Transcript shows.
>     // TerminalActions.svelte: Lock, drawn while a terminal with a session shows, which leaves the
>     // box and every grid of the tab read-only, and Jump to the last turn while Transcript shows.

terminal-tabs.ts
51c51
<     /** Whether the tab's boxes and grids take no typing. */
>     /** Whether the tab's box and grids take no typing. */

tab-session.svelte.ts
84c84
<         /** Whether the tab's boxes and grids are read-only; a lock binds a tab's own terminals. */
>         /** Whether the tab's box and grids are read-only; a lock binds a tab's own terminals. */
```

The places were found with `grep -rn -i -E "boxes" src config docs README.md --exclude=local.yml`, filtered to lines that name a grid, the lock, steering or a terminal. The other hits (`Surface.svelte:21`, `html.ts:175`, `card-layout.ts:36`, `Panel.svelte:17`, `slide-layout.ts:246`) are about other things. The YAML still parses: `python3 -c "import yaml; yaml.safe_load(open('config/text/views/sessions/terminal.yml'))"` printed `yaml ok`, and that command only reads. `SessionTools.svelte:2-4` measures 95, 98 and 97 columns.

`docs/HELP.md:257` is not edited, for the orchestrator. It reads "- Lock this tab keeps the tab's boxes and grids from taking typing until it is unlocked, and holds after a reload." The words that would match the tooltip are "the tab's box and grids".

### 4. The report (B1, B2, S2, S4)

- **B1, the lost tab stops.** On the base, Live under an agent's grid held three tab stops, in order: the text box (`TextArea`), Stop and Send (`SteerBox.svelte:92-117`). After the change Live holds none of them, and Tab from the grid moves focus to the next focusable element past the terminal body. Look: on a Live tab of a running Claude or Codex, press Tab from the grid; focus leaves the terminal body without stopping on a text box, Stop or Send.
- **B2, an agent terminal the page cannot link yet.** On the base, the Live grid drew `SteerBox` with `terminal` from `terminalById(id)`, which was neither null nor foreign, so `usable` was true (`SteerBox.svelte:44` on the base). The box offered a working text box, Send and Stop, which steered the terminal by its id. After the change no box is drawn anywhere in the tab, because the tab has no Transcript switch. This case loses its Send and Stop. Escape typed at the grid still reaches the agent through xterm (`TerminalGrid.svelte:322`, `term.onData`) and interrupts the turn. The brief's case accepts the loss. The step's before-and-after line, which listed the unlinked case among the read-only lines, is corrected here.
- **S2, the diagrams.** `docs/diagrams/layer-views.dot` and `docs/diagrams/layer-views.svg` stay in the diff. `npm run diagrams` writes them because the grid's `SteerBox` import is gone: the edge `views/sessions to views/shared` counts 20 imports instead of 21. The round's run of `npm run diagrams` changed them no further (`git status --short` lists the same two files before and after it).
- **S4, git commands.** The only git commands this round ran are `git status --short` and `git diff --numstat`.

### Files changed (`diff -rq` against `../O183-base` over `config src tests utils`, `git diff --numstat` for the lines)

| Path | Lines | In the brief's or the round's list |
| --- | --- | --- |
| `src/lib/views/sessions/terminal/grid/TerminalGrid.svelte` | +11 -17 | yes |
| `src/lib/views/shared/sessions/SteerBox.svelte` | +6 -10 | yes (round item 2) |
| `src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte` | +1 -1 | yes (round item 2) |
| `config/text/views/sessions/terminal.yml` | +1 -1 | yes (round item 3) |
| `src/lib/views/sessions/terminal/bar/SessionTools.svelte` | +2 -2 | yes (round item 3) |
| `src/lib/state/sessions/terminal/terminal-tabs.ts` | +1 -1 | no: the same lock sentence as item 3, carried per `agents/spec.md:72` |
| `src/lib/views/sessions/terminal/transcript/tab-session.svelte.ts` | +1 -1 | no: the same lock sentence as item 3, carried per `agents/spec.md:72` |
| `docs/diagrams/layer-views.dot` | +1 -1 | no: written by `npm run diagrams` (S2) |
| `docs/diagrams/layer-views.svg` | +1 -1 | no: written by `npm run diagrams` (S2) |
| `.scratch/migration/agents/reviews/O183-report.md` | this section | yes |

### Greps and re-reads

- **History words** over every comment and catalog line the round changed (`SteerBox.svelte:8-9`, `SessionTools.svelte:2-4`, `terminal-tabs.ts:51`, `tab-session.svelte.ts:84`, `TerminalGrid.svelte:2-12` and `:104`, `terminal.yml:106`): one hit, "asked about before it is sent". That is the base's own sentence about when the paste question is asked, so it is not history.
- **Re-read and rewritten:**
  - `SteerBox.svelte` head comment `:2-9`.
  - `TerminalGrid.svelte` head comment `:2-12`.
  - `SessionTools.svelte:2-4`.
  - the doc comments at `terminal-tabs.ts:51` and `tab-session.svelte.ts:84`.
- **Re-read and still true:**
  - `TranscriptBody.svelte:46-49`, whose head comment names no size.
  - `TranscriptBody.svelte:81`, "the prompt box read-only".
  - `config/text/views/sessions/composer.yml:1`.
- **Ids and asynchronous paths:** the round introduces no id or key. Removing the `small` prop changes no asynchronous path in SteerBox.

### Judgment calls (each reversible)

- The two doc comments at `terminal-tabs.ts:51` and `tab-session.svelte.ts:84` are reworded like the tooltip, as named above.
- The SessionTools sentence reads "which leaves the box and every grid of the tab read-only".

### User-visible changes, before and after

- **The Lock tooltip on a Terminal tab's header:** before, "Lock this tab: its boxes and its grids take no typing until it is unlocked"; after, "Lock this tab: its box and its grids take no typing until it is unlocked". Look: hover Lock on a tab whose terminal has a session.
- **The Transcript box:** no change. The text box and the line under it stay at `--fs-sm`, as with `small` on the base. Look: on a Transcript tab of a live session and of an ended one, the box's text and its line are the same size as on main.
- **Live, tab order under an agent's grid:** the three stops of B1 are gone.
- **Live, an agent the page cannot link yet:** the usable box with Send and Stop of B2 is gone, and no box is left in the tab.
