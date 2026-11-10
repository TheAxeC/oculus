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

## Repair round 1, refuted

### O183 refuter report over repair round 1: a running agent's terminal takes the whole height in the Live view

Summary: every item of the round holds, and so does every item and case of the brief over the whole diff since 04ffd50a4. There are no blocking findings. Two minor Proof findings are below: P1 is a stale line citation in the report, and P2 is a miscount of selector weights whose conclusion still holds. There are no Spec, Standards or Behaviour findings. My rerun confirms that the Transcript box's field and its line render at the same size as on main. I changed nothing in the repository or the ledger. The one file I wrote is the unused-exports output, in my session scratchpad, used for the comparison.

Inputs read, in order:
- spec.md
- briefs/O183.md
- briefs/O183-round-1.md
- reviews/O183-refuter.md
- plan.md:1735 (the O183 line) and plan.md:3725 ("Open item 750 ... (a)")
- the round's delta
- the base and current SteerBox.svelte, TextArea.svelte:85-140, src/lib/ui/theme/field.css (whole), TranscriptBody.svelte:30-60 and :395-470, and grid-keys.ts
- the builder's report, read last. `diff` of the main-checkout copy against the worktree copy printed nothing (exit 0).

### The round's delta

- files.txt lists layer-views.dot, layer-views.svg and TerminalGrid.svelte.
  - `diff -u` of the snapshot against the worktree prints nothing for the two diagram files.
  - For TerminalGrid.svelte it prints one hunk, "@@ -1,16 +1,15 @@". That hunk drops the clause "a session is steered from under the Transcript view's turns (transcript/TranscriptBody.svelte)" and rewraps the paragraph.
- The six paths files.txt does not list come from `git diff 04ffd50a4`:
  - SteerBox.svelte (+6 -10)
  - TranscriptBody.svelte (+1 -1, `small` dropped at :419)
  - terminal.yml:106 (+1 -1)
  - SessionTools.svelte:3-4 (+2 -2)
  - terminal-tabs.ts:51 (+1 -1)
  - tab-session.svelte.ts:84 (+1 -1)
- `git status --short` lists nine modified tracked files and three untracked ledger files (O183-round-1.md, O183-refuter.md, O183-report.md).

### Checks run (from /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O183)

1. `npm run diagrams`: run.
   - First I ran `staleFiles()` of utils/diagrams/diagrams.mjs in memory, which writes nothing. It printed `[]`.
   - Then `npm run diagrams` ran. Afterwards `git status --short` printed the same nine M lines and three ?? lines as before, so it changed no tracked file.
2. `env -u TMPDIR npm run test:quick`, run once with node v24.21.0 on PATH, printed:
   - "test:quick: 12 changed file(s), from git since HEAD"
   - "test:quick: 17 test file(s)"
   - "ok prettier (3.1 s): All matched files use Prettier code style!"
   - "ok ASCII gate (3.4 s)"
   - "ok svelte-kit sync (6.2 s)"
   - "ok eslint (6.4 s)"
   - "ok svelte-check (24.9 s): ... COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS"
   - "ok vitest (63.0 s)"
   - "ok vitest checks (110.8 s)"
   - "test:quick: 117.3 s; every command passed"
3. The brief's grep, `grep -rn -i -E "SteerBox|steer box|prompt box" src tests config docs README.md --exclude=local.yml`, printed 13 lines:
   - composer.ts:428, place.ts:283, review-comment.ts:43, dragging.svelte.ts:6
   - SteerBox.svelte:2
   - TranscriptBody.svelte:46, :48, :54, :81 and :419
   - Composer.svelte:20, TaskBlock.svelte:4, composer.yml:1
   - `grep -c` of the same pattern over TerminalGrid.svelte prints 0.
4. The round's `small` grep, `grep -rn -E "\bsmall\b" SteerBox.svelte TranscriptBody.svelte`, printed one line, "TranscriptBody.svelte:407: small". That is the `small` of the older-turns retry ToolButton (:404-408), not a prop or class of SteerBox. The grep passes as the round defines it.
5. `sh utils/unused-exports.sh` printed 335 lines, as does ../O183-base/unused-exports.txt. `diff` of the two printed nothing (exit 0).
6. The ASCII perl check of spec.md:103 over the nine changed tracked files and O183-report.md printed nothing (exit 0).

### Commands the report's round section quotes, rerun

- **test:quick counts (12 changed files, 17 test files) and its last line:** reproduce. My timing was 117.3 s against the report's 146.4 s; no decision rests on it.
- **The brief's grep at 13 hits with 0 in TerminalGrid.svelte:** reproduces.
- **The `small` grep with its one ToolButton hit:** reproduces.
- **Unused exports and the ASCII check:** reproduce.
- **`git diff --numstat`:** reproduces every row of the file table: TerminalGrid +11 -17, SteerBox +6 -10, five files at +1 -1, SessionTools +2 -2.
- **`grep -rn "<SteerBox" src` has one caller:** reproduces, TranscriptBody.svelte:419.
- **`grep -rn -E "terminal_lock_tip|boxes and|take no typing" tests`:** reproduces. Its one hit is html-sites.test.ts:44.
- **`grep -rn -i -E "boxes" src config docs README.md --exclude=local.yml`:** reproduces. Among the lines about the lock, the only remaining hit is docs/HELP.md:257. Its text is "Lock this tab keeps the tab's boxes and grids from taking typing ...", which the report names for the orchestrator, as spec.md:72 and round item 3 say.
- **The `yaml.safe_load` of terminal.yml:** prints "yaml ok".
- **Line widths:**
  - TerminalGrid.svelte:2-12 measure 92 98 100 96 100 99 99 99 97 94 14. In each line the next word would pass 100 columns; for example, 94+1+"user's." is 102.
  - SessionTools.svelte:2-4 measure 95 98 97.
  - SteerBox.svelte:8-9 measure 97 77.
  - All reproduce.
- **History words over the added lines:** one hit, TerminalGrid "asked about before it is sent". That is the base's own sentence. Reproduces.
- **field.css:12-19 and TextArea's font-size only at `.area.tree` :124:** reproduce. `grep -n` gives `.oculus-field {` at :12 and `font-size: var(--fs-md)` at :19.
- **B2's `SteerBox.svelte:44` on the base (`usable`) and B1's `:92-117` (TextArea at :92, Stop ToolButton at :104, Send ToolButton at :111-117):** reproduce from `git show 04ffd50a4:...`.
- **B2's "TerminalGrid.svelte:323, term.onData":** does not reproduce. See P1.
- **S4, the git commands the builder ran:** not verifiable from here. See Declined.

### Is the Transcript box's size the same as on main

Yes. I compiled the base and current SteerBox.svelte with the tree's svelte 5.57.1 (`svelte/compiler`, `css: "external"`, output to stdout only).

Base CSS:

```
.elsewhere.svelte-1ht4wce { ... font-size: var(--fs-md); }
.small.svelte-1ht4wce .elsewhere:where(.svelte-1ht4wce),
.small.svelte-1ht4wce .oculus-field { font-size: var(--fs-sm); }
```

Current CSS:

```
.elsewhere.svelte-1ht4wce { ... font-size: var(--fs-sm); }
.steer.svelte-1ht4wce .oculus-field { font-size: var(--fs-sm); }
```

- **The field:** the base rule and the new rule both weigh (0,3,0), and both sit at the same place in the same stylesheet.
  - field.css's `.oculus-field { font: inherit; font-size: var(--fs-md) }` weighs (0,1,0).
  - field.css's other `.oculus-field` rules (`body.rice`, `:disabled`, `[aria-invalid]`, `:focus-visible`) set no font-size.
  - TextArea's scoped `.area`, `.area.bare` and `.area.grow` set none either, and `.area.tree` is not used, since SteerBox passes no `size`.
  - The only other rule reaching `.oculus-field` from outside is SessionSections.svelte:153, `.sections :global(.oculus-field)`, which weighs (0,3,0) on both base and now. So the order against it is also unchanged.
  - The textarea is at `--fs-sm` on main and now.
- **The line:** on the base, `.small ... .elsewhere:where(...)` (0,2,0) overrode `.elsewhere` (0,2,0) by order, which gives `--fs-sm`. Now `.elsewhere` itself is `--fs-sm`. No rule outside SteerBox names `.elsewhere`, `.steer` or `data-steer`: the grep over src `*.svelte`/`*.css` finds only unrelated function names and comments.

### Findings

### Spec

None.
- Round item 1 removes exactly the clause S1 named, and the head comment now names no other component.
- The two files outside the round's list, terminal-tabs.ts:51 ("Whether the tab's boxes and grids take no typing.") and tab-session.svelte.ts:84 ("Whether the tab's boxes and grids are read-only; ..."), carry the same plural sentence that item 3 changes. spec.md:72 requires the change to reach every hit, so widening to them is required, not beyond the finding. The report names both with that reason (spec.md:35).
- No other "box and grid" sentence about the lock is left except docs/HELP.md:257. I grepped `every box|box and (every |its )?grid|box or grid|its box`. model-machine.ts:492 ("the keys of the box and grid") and session-link.ts:2 ("its box") are singular and still true.

### Proof

**P1 (minor). A stale line citation in B2.**
- Place: O183-report.md:275, "Escape typed at the grid still reaches the agent through xterm (`TerminalGrid.svelte:323`, `term.onData`)".
- What is wrong: after the round's rewrap, which is one line shorter, `term.onData` is at :322 (`const typed = term.onData((data: string) => sendInput(wanted, data));`) and :323 is `term.onBell`. spec.md:14 asks that every `file:line` be taken after the last change.
- The claim itself holds. grid-keys.ts holds back only palette, debug and find keys, so Escape with the find bar closed reaches `onData`.
- Failure scenario: the orchestrator checks the B2 claim at the cited line, lands on the bell handler, and either doubts a true claim or books the wrong line.

**P2 (minor, no decision changes). Selector weights miscounted.**
- Place: O183-report.md:240, "That selector compiles to a scoped class plus `.oculus-field`, two classes ... and `body.rice .oculus-field` (one class and one element)".
- What is wrong: the compiled selectors `.small.svelte-1ht4wce .oculus-field` and `.steer.svelte-1ht4wce .oculus-field` are three classes each. `body.rice .oculus-field` is two classes and one element.
- The conclusion survives the correct counts: (0,3,0) beats field.css's (0,1,0), and the rice rule sets no font-size.
- Failure scenario: a reader who reuses the report's arithmetic for another override inside a `body.rice` rule would compare (0,2,0) against (0,1,1). The real values are (0,3,0) and (0,2,1). The ranking happens to agree here but need not elsewhere.

### Standards

None.
- No check was removed in place of a fix. Removing the `small` path is the fix St1 asked for, and the size it carried moved onto the base rules.
- The SteerBox head comment (:7-9) states the one size and the reason the round gave.
- Every changed comment is rewrapped, all files are ASCII, and no history words were added.
- Sizes: TerminalGrid.svelte 509 lines, SteerBox.svelte 191 (`wc -l`).
- No unused export was added.

### Behaviour

None new.
- The one visible change of the round is the Lock tooltip, "its boxes and its grids" becoming "its box and its grids". The report lists it with its before, its after and the look.
- B1 (the three lost tab stops) and B2 (the unlinked agent loses its Send and Stop, and Escape at the grid still interrupts the turn) are now stated as the first review asked.

### Verdicts for the whole diff since 04ffd50a4

What to build:
1. **TerminalGrid draws no SteerBox: holds.** The import, the `agent` derived and the `{#if agent} <SteerBox .../> {/if}` block are gone (`git diff 04ffd50a4`), and the grep in the file counts 0.
2. **Head comment and prop comment: holds.**
   - :3-4: "The grid takes the whole height of its box whatever runs in it, a shell, Claude or Codex, and each is typed into at the grid."
   - :9-10: "While the tab is locked the grid is read-only: it takes no typing, paste or drop."
   - :104: "Whether the tab is locked, which leaves this grid read-only."
   - The unasked clause (S1) is gone.
3. **The Transcript view keeps its box unchanged: holds.** SteerBox.svelte and TranscriptBody.svelte:419 now change, but only by removing `small`, and the compiled sizes of the field and the line are the same as on main. TranscriptBody's condition `record !== null && agent === ''` and the other props are unchanged.

Cases. Each is met by reading the markup. The on-screen part of each goes to the look at landing.
- **Live terminal running Claude: met by reading.** `.grid` is the only flow child of `.half`.
- **Live terminal running Codex: met by reading,** the same as Claude.
- **Live shell terminal: met.** Its path is unchanged.
- **Split of an agent and a shell: met by reading.**
- **By-hand pane running an agent: met by reading.** `fits` is false, so no resize is sent, and no box is drawn.
- **Foreign terminal on Live: met by reading.** Live draws no line, and the Transcript box keeps its "elsewhere" line at the same size.
- **Agent started in, or exiting from, a shell terminal: met by reading.** Nothing in TerminalGrid reads `kind` (the `grep -n kind` of the file has no hit).
- **Agent the page cannot link yet: met by reading.** No box is drawn in the tab. The loss of Send and Stop is now stated (B2).
- **Transcript view of a live session: met by reading.** The box is drawn with Send and Stop, at the same sizes as on main.
- **Transcript view of an ended session: met by reading.** The ended line is drawn at `--fs-sm`, as on main.
- **Locked tab on Live: met by reading.** `disableStdin` and the lock guards are unchanged, and no locked line is drawn.

Round items:
1. **The head comment's clause on steering (S1): holds.**
2. **SteerBox has one size (St1): holds.** The prop, its default, `class:small` and the `.small` rules are gone, `.elsewhere` and `.steer :global(.oculus-field)` are at `--fs-sm`, the head comment is rewritten, and TranscriptBody drops `small`. The size is identical, as shown above.
3. **The lock's sentences (St2): holds.** terminal.yml:106 and SessionTools.svelte:3-4 are reworded, the same sentence is carried to terminal-tabs.ts:51 and tab-session.svelte.ts:84, and docs/HELP.md:257 is named and not edited.
4. **The report (B1, B2, S2, S4): holds, with P1 and P2 on its text.**
   - B1 and B2 are stated.
   - S2 holds: the diagram files stay in the diff, and `staleFiles()` returns `[]`.
   - S4 is stated by the builder but is not verifiable by me.

### Declined to judge

- **S4, the git commands the builder ran in the round:** I have no record of the builder's commands, so the report's statement that it ran only `git status --short` and `git diff --numstat` is not verified.
- **On-screen states, all for the orchestrator's look at landing:**
  - an agent's grid reaching `.terminal`'s 4px 6px 6px inset, with no empty band under the input line of Claude or Codex;
  - equal bottom lines in a split of an agent and a shell;
  - a by-hand agent pane scrolling inside the taller grid;
  - no jump of the grid when an agent starts in, or quits from, a shell terminal;
  - Tab from a Live agent grid leaving the terminal body without stopping on a text box, Stop or Send;
  - a locked Live agent tab taking no typing, paste or drop, with no locked line;
  - the Transcript box's text and its line at the same size as on main, for a live session and an ended one (proved here by the compiled CSS, not by a look);
  - the Lock tooltip's new words.
- **Whether tests/checks/diagrams/diagrams.test.ts was among the 17 test files test:quick ran:** I did not print the file list. The in-memory `staleFiles()` run, which is that test's first case, returned `[]`.

Usage: a5028306cd31add3e, claude-opus-5-5, 142863 tokens, 35 tool uses, 447 s

## Closed

- First run, S1, St1, St2, B1, B2: closed in repair round 1, each holding in the review over the round.
- S2: no defect; the two diagram files land with the step, written by `npm run diagrams`.
- S3: G146 in `agents/guarded.md:436` reworded by the orchestrator at landing to name the agent link the Transcript box follows.
- S4: recorded; the git grep only read and printed nothing.
- `docs/HELP.md:257`: named to Axel at landing with the words "the tab's box and grids".
- Round 1, P1 and P2: fixed in the report at landing (`term.onData` at `TerminalGrid.svelte:322`; the selector weights (0,3,0) and (0,2,1)).
