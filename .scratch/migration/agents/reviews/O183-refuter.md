# O183 refuter report: a running agent's terminal takes the whole height in the Live view

Summary: all three "What to build" items hold. By reading the markup, every case is met. The on-screen part of each case is left to the look at landing. The verify checks I ran pass (quoted below). There are no blocking findings. There are three minor Spec findings (S1, S3, S4; S2 is a note with no defect), one Standards finding the orchestrator must rule on (St1, a clash between brief:17 and spec.md:89), two minor Standards findings (St2, St3), and two minor Behaviour findings (B1, B2). I changed nothing.

Inputs read, in order: .scratch/migration/agents/spec.md, briefs/O183.md, the plan's O183 line (plan.md:1735) and its ruling (plan.md:3725, "Open item 750 ... (a)"), the diff in the worktree (via `git diff 04ffd50a4` and `git status --short`), the whole of TerminalGrid.svelte, SteerBox.svelte, TranscriptBody.svelte:40-60 and :405-425, session-link.ts, open-session.ts:95-140, agents.ts:77-90, guarded.md:436, then the builder's report last. The report in the main checkout is identical to the worktree copy (`diff` printed nothing).

ADRs: `ls /Users/axelfaes/workspace/oculus/docs/adr` prints "No such file or directory". No ADR applies.

## Checks run (from /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O183)

1. `npm run diagrams`: I did not run it, as instructed (see Declined). The two diagram files are judged by reading under S2.
   - `env -u TMPDIR npm run test:quick`, with node v24.21.0 on PATH, printed:
     - "test:quick: 4 changed file(s), from git since HEAD" (the fourth file is the untracked report)
     - "test:quick: 12 test file(s)"
     - "ok prettier (1.4 s): All matched files use Prettier code style!"
     - "ok ASCII gate (1.5 s)"
     - "ok eslint (2.6 s)"
     - "ok svelte-check (11.5 s): ... COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS"
     - "ok vitest checks (80.6 s)"
     - "test:quick: 83.9 s; every command passed"
   - The 12 files are those under tests/checks/imports, source and tree. tests/checks/diagrams/diagrams.test.ts (G25) was not among them.
2. `grep -rn -i -E "SteerBox|steer box|prompt box" src tests config docs README.md --exclude=local.yml` printed 13 lines:
   - composer.ts:428, place.ts:283, review-comment.ts:43, dragging.svelte.ts:6, SteerBox.svelte:2, TranscriptBody.svelte:46, :48, :54, :81 and :419, Composer.svelte:20, TaskBlock.svelte:4, composer.yml:1.
   - None is in TerminalGrid.svelte. The same grep over that file alone exits 1.
3. `sh utils/unused-exports.sh` printed 335 lines, as does ../O183-base/unused-exports.txt. `diff` of the two printed nothing (exit 0).
4. The ASCII perl check of spec.md:103 over TerminalGrid.svelte, layer-views.dot and the report printed nothing (exit 0). `LC_ALL=C grep -n '[^ -~]' docs/diagrams/layer-views.svg` printed nothing.

## Commands the report quotes, rerun

- **`diff` of TerminalGrid.svelte against ../O183-base:** reproduces. The hunk headers are "3,12c3,13", "52d52", "105c105", "199,200d198" and "478,480d475".
- **`diff -rq` over config, src, tests and utils:** reproduces for src: only TerminalGrid.svelte differs. My run also prints "Only in config/options: local.yml". That is an ignored machine file, not part of the step, and `git status --short` does not list it. No decision rests on it.
- **Line counts, +12 -17:** reproduce from `git diff 04ffd50a4 --stat`: 3 files, 14 insertions and 19 deletions, of which the two diagram files are +1 -1 each.
- **13 grep hits and 335 unused-export lines:** both reproduce.
- **`grep -rn "\.kind" src/lib/views/sessions/terminal/transcript/ src/lib/state/sessions/terminal/session/`:** reproduces. It prints only `row.kind` hits in reader-place.ts, turn-rows.ts, TurnList.svelte and TurnRun.svelte, and no terminal kind.
- **History-word grep over TerminalGrid.svelte lines 2-13 and 105:** one hit, ":8 before it is sent". That is base text about when the paste question is asked, not history. Reproduces.
- **Comment widths of lines 2-13:** "92 98 100 66 90 94 99 97 99 99 96 60". Reproduces. Line 5 is short because the next token, "(transcript/TranscriptBody.svelte).", is 35 characters, and 66+1+35 > 100.
- **`grep -n -i 'steer\|box'` on Terminal.svelte:** only ":468 box-sizing: border-box;". Reproduces.
- **Open items:** the worktree copy of orchestrator-state.md:189 heads an empty list. Reproduces.
- **Base line citations:** reproduce. SteerBox import :52, `agent` :200, `<SteerBox {terminal} {locked} />` :479, `.grid.pane overflow: auto` :513, Terminal.svelte padding :467, listing.ts:106 `kind: agent.tool`.
- **Line citations after the change:** all reproduce. :280 disableStdin, :281 byHand, :205 resized return, :212, :256 and :263 lock guards, :323 onData, :328 holdPastes.

## Verdicts on "What to build"

1. **The grid draws no SteerBox: holds.** The import (base :52), the `agent` derived (base :199-200) and the `{#if agent} <SteerBox .../> {/if}` block (base :478-480) are removed. The grep for SteerBox in the file exits 1. svelte-check reports 0 errors and 0 warnings, so nothing reads the removed `agent`.
2. **Head comment and prop comment: holds, with S1 noted.**
   - Lines 3-4 now say "The grid takes the whole height of its box whatever runs in it, a shell, Claude or Codex".
   - Lines 10-11 say "While the tab is locked the grid is read-only: it takes no typing, paste or drop."
   - Line 105 says "Whether the tab is locked, which leaves this grid read-only."
   - One clause the brief did not ask for was added; see S1.
3. **The Transcript view keeps its box unchanged: holds.** `diff -rq` over src lists only TerminalGrid.svelte. TranscriptBody.svelte:418-420 still draws `<SteerBox terminal={terminalOfSession(record)} {locked} ended={!record.live} small />` under `{#if record !== null && agent === ''}`.

## Verdicts on the cases

The markup settles whether a box is drawn. The height, the absence of an empty band and the absence of a jump can only be seen on screen, so each of those parts is settled by the orchestrator's look at landing.

- **Live terminal running Claude: met by reading.** `.half` (:489-497) holds `.grid` (flex: 1 1 auto, :499-504), ContextMenu (display: contents) and the absolutely placed FindBar. No element remains under the grid, and the ResizeObserver (:371-380) measures the full `.grid`. The bottom inset and "no empty band" are for the landing look.
- **Live terminal running Codex: met by reading,** the same as Claude.
- **Live shell terminal: met.** This markup path is unchanged.
- **Split tab with an agent and a shell: met by reading.** Each half holds only its grid. Equal bottom lines are for the look.
- **By-hand pane running an agent: met by reading.** `fits` is false, so `resized()` returns at :205. `grid.resize(byHand)` runs at :281, `.grid.pane` scrolls (:507-509), and no box is drawn.
- **Foreign terminal on Live: met by reading.** Live draws no box and no line. On Transcript, `sessionTerminal` drops foreign terminals (session-link.ts:47), so `terminal` is null and SteerBox shows `composer.elsewhere` (SteerBox.svelte:44-50).
- **Agent started in a shell terminal, or an agent that exits: met by reading.** No element of TerminalGrid reads `terminal.kind` any more (`grep -n kind` of the file shows none in the markup). A change of kind therefore changes nothing in the grid's box. The ShowSwitch that can appear in the bar when a session links is outside this file; see Declined.
- **Running agent the page cannot link yet: met by reading.** `tabSession().target` is null, so there is no switch and `reading` is false (tab-session.svelte.ts:31-35 and :70). Terminal.svelte:378-400 draws the grids, which hold no box.
- **Transcript view of a live session: met.** The code is unchanged.
- **Transcript view of an ended session: met.** The code is unchanged.
- **Locked tab on Live: met by reading.** `disableStdin = locked` (:280) and the guards at :212, :256, :263 and :328 remain. The box's locked line is no longer drawn on Live.

The report records a first run of every case on the unchanged tree (report lines 53-67), so no case lacks one.

## Findings

### Spec

**S1 (minor). An unasked clause in the head comment.** At TerminalGrid.svelte:4-6: "and each is typed into at the grid; a session is steered from under the Transcript view's turns (transcript/TranscriptBody.svelte)".
- Brief item 2 asks only for the whole height and the read-only lock. The builder lists this clause as a reversible judgment call.
- The clause states another component's behaviour in the grid's head comment. TranscriptBody.svelte:46-49 already states it.
- As written it reads as the place a session is steered from. A session is also steered from a review comment in the Changes diff (DiffSection.svelte:201-215 calls `steerTerminal`; review-comment.ts:107).
- Failure scenario: a reader who changes steering trusts this comment as the map of steer paths and misses the review-comment path. Also, if the Transcript box moves, this sentence goes false, and a grep for "SteerBox" does not find it. My judgment is that it is not false today; dropping the clause or narrowing it to a plain pointer is the orchestrator's choice.

**S2 (note, no defect). The two diagram files outside the brief's write list.** docs/diagrams/layer-views.dot:33 and layer-views.svg:239 change the label of the "views/sessions to views/shared" edge from "21" to "20".
- My count of `from '$lib/views/shared/...'` imports under src/lib/views/sessions is 21 on the base copy and 20 in the worktree, so the label is right.
- The svg changes only the text of a label with the same number of digits; its polygon geometry is unchanged.
- spec.md:26 has the diagrams regenerated before the verify list, and spec.md:35 has an out-of-list path named with its reason. The report names both files with the reason.
- The gap is in the brief's write list (brief:45-48), not in the builder's work. Whether the files are byte-exact against `npm run diagrams` is G25's test at landing.

**S3 (minor, ledger text, not code). The G146 premise: neither reading reproduces whole.** The text is guarded.md:436: "a terminal's kind, its box and a steer follow it".
- The brief (brief:18) says the entry "stays true, since the kind still decides the Transcript box". That does not reproduce. TranscriptBody.svelte:418 draws the box on `record !== null && agent === ''`, where `agent` is the subagent-id prop (:79-80), and no terminal kind is read there (the `.kind` grep above).
- The builder concludes that "its box" now "names nothing on the client". That does not reproduce either. session-link.ts:52, `all.find((one) => pid !== null && one.agent?.pid === pid)`, picks the terminal the Transcript box steers by the `agent` that `withAgents` reads from the process table (agents.ts:83-90, `{ ...terminal, agent, kind: ... }`).
- So, for an agent typed into a shell terminal, whether the Transcript box finds a terminal (Send and Stop usable, or the "elsewhere" line) still follows the pane's agent. It follows it through client code that G146's Code line does not name.
- Failure scenario: acting on the report, the orchestrator strikes "its box" from G146 as dead and loses the statement that the session box follows the pane's agent. Acting on the brief, it keeps a wrong reason ("the kind decides").
- The entry needs a rewording that names the agent link, which is the orchestrator's text. No code change follows.

**S4 (minor, process). A git command outside the three allowed.** The report's line 143 states that the builder ran `git grep -n -E "SteerBox|data-steer" -- tests`. spec.md:33 allows the builder only `git status`, `git diff` and `git show`. It was read-only and disclosed. Its result reproduces with `grep -rn -E "data-steer|\.steer\b|steer-elsewhere" src tests` (no hit in tests) and with the SteerBox grep above (no hit in tests).

### Proof

- No test was added or changed. The report says so in one line (report:33), as spec.md:69 asks.
- No threshold was widened, there is no fallback, and there is no unquoted "seen failing first".
- The `diff -rq` path list omits the ignored config/options/local.yml line. No decision rests on it, so it is not a finding.
- The before-state error is under B2.

### Standards

**St1 (needs the orchestrator's ruling). SteerBox's `small` path is left with no caller.** The places are SteerBox.svelte:27-30 (`small?: boolean`, `small = false`), :89 (`class:small`), :171-180 (`.elsewhere { ... font-size: var(--fs-md); }` and the `.small` override), and the head comment :8-10 ("Its text box and that line are at the body's `--fs-md`, or at `--fs-sm` with `small`").
- After this step the only caller is TranscriptBody.svelte:419, which always passes `small`. The `--fs-md` branch, which TerminalGrid's Live box used, is reached by no caller.
- That breaks spec.md:89 (YAGNI; nothing built for a need the plan does not name).
- Brief:17 says "SteerBox.svelte itself does not change", so this is a clash between the brief and spec.md:89, not a builder miss.
- Failure scenario: a reader of SteerBox believes there are two sizes in use and keeps or styles the dead `--fs-md` path. The head comment describes a default no view draws.
- unused-exports.sh does not see props, so check 3 cannot catch this.
- Note: the `locked = false` default was already unused on the base, because both base callers passed `locked`, so it is not this step's.

**St2 (minor). Plural "boxes" now names at most one box.** The places are config/text/views/sessions/terminal.yml:106, "its boxes and its grids take no typing", and SessionTools.svelte:3-4, "every box and grid of the tab". docs/HELP.md:257 says the same, but it is not raised, per spec.md:72.
- After the step a tab draws at most one box (the Transcript box of its one session) and Live draws none.
- The sentences are not false read generically. The brief judged them true, and the report lists terminal.yml:106 as still true.
- Failure scenario: a reader of the Lock tooltip on a split Live tab of two agents expects one box under each grid. My judgment is that this is a wording point the orchestrator may leave.

Everything else checked under Standards holds:
- Non-ASCII: none.
- Size: 510 lines, at or under 520.
- Comment rewrap: holds per spec.md:45.
- History words: only the base's "before it is sent".
- Unused code in TerminalGrid: no import left without a reader. `locked` is read at :212, :256, :263, :280 and :328; `terminal` at :198, :281 and :446.
- Style rules: the base styles (base :493-515) held no rule for the box, so none was left behind.
- `data-steer` and `.steer`: no selector refers to them outside SteerBox.
- Every sentence the SteerBox and Live greps found, other than St2, is still true: composer.yml:1, TranscriptBody.svelte:46-49 and :81, SteerBox.svelte:2-7, and README.md, which says nothing about the box.
- No public surface changed.

### Behaviour

**B1 (minor). Lost tab stops are not stated.** The report's before/after section (report:127-133) does not state that Live loses three tab stops under an agent's grid: the TextArea, Stop and Send. spec.md:61 counts focus and tab stops as visible. The look at landing should note that on Live, after the grid, the next focusable element is no longer a text box.

**B2 (minor). Before-state misstated for an unlinked agent.** Report:129 says the base drew "a read-only line for a foreign, locked or unlinked case" under the grid.
- For an unlinked own agent terminal on the base, SteerBox got `terminal` from `terminalById(id)`, which is not null and not foreign. `usable` was therefore true (SteerBox.svelte:44), and the box offered working Send and Stop, which steered the terminal by id.
- The report's own first-run case (report:62) says "a box on Live", which contradicts line 129.
- Failure scenario: at the look, the orchestrator compares main against "a read-only line" and finds a usable box. It may also miss that this case loses its only Send and Stop, since such a tab has no Transcript switch (pressing Escape at the grid still interrupts). The brief's case accepts the loss; only the stated before is wrong.

## Declined to judge

- **`git grep`:** the builder's `git grep -n -E "SteerBox|data-steer" -- tests` is not one of my three git commands. I checked its claim with `grep -rn` instead (S4).
- **`npm run diagrams`:** not run, as instructed. Whether layer-views.dot and .svg are byte-exact against the generator is left to tests/checks/diagrams/diagrams.test.ts (G25) at landing. That test was not among the 12 files test:quick ran.
- **On-screen states, all left to the orchestrator's look at landing:**
  - an agent's grid reaching `.terminal`'s 4px 6px 6px inset;
  - no empty band under the input line of Claude or Codex after the full-height resize;
  - equal bottom lines in a split of an agent and a shell;
  - a by-hand agent pane scrolling inside the taller grid;
  - no jump of the grid when `claude` starts in, or quits from, a shell terminal (this includes whether the ShowSwitch appearing in TerminalBar when the session links changes the body's height, which is outside TerminalGrid.svelte);
  - a foreign agent terminal on Live showing only its grid, and on Transcript showing the "elsewhere" line;
  - a locked Live agent tab taking no typing, paste or drop, with no locked line.
- **Typing into a foreign terminal's grid on Live:** whether keys reach the pane depends on whether channel.ts:591-595 attaches it. That is outside the step's change and is not verified here.

Usage: a099bdd2e603b13e4, claude-opus-5-5, 150126 tokens, 44 tool uses, 474 s
