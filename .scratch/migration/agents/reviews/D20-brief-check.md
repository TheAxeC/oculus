# Brief check of D20, plan oculus/migration. Head read: 40cc596ff ("Book D45's choices and start D45, X3f and D20"), one bookkeeping commit past 8077dd556. It changes only ledger files: `git show --stat 40cc596ff` lists choices.md, orchestrator-history.md, orchestrator-state.md, plan.md and queue.md.

**Verdict: the brief does not exist yet, so it cannot be dispatched.** `agents/briefs/D20.md` is 20 lines (`wc -l`). Its heading is "# Brief: D20 (to be written at dispatch)". Its last commit is a8373e751 ("Carry D20's booked widenings into its brief file"), and the working copy is unchanged (`git status --short` is clean).

It holds only the booked plan line, A2's line and the five widenings. It has none of these sections: "What to build", "What is on the tree", "Paths this step writes", the cases, the verification list, the report shape, the libraries checked, the base copy, the worktree and the port.

queue.md says otherwise. The commit's diff at line 105 shows queue.md said "D20 ... brief ready" before this commit, and line 88 now says "brief check running". Neither matches the file.

The widenings Z307, Z312 and Z313 each say "D20's /spec finds the cause read-only and writes it into the brief". No cause is written. Each check below reports what can be judged from the stub, plus the premises re-run at head, so /spec can write the brief.

## Names

1. `startChat`, which the stub says "gains a seed argument". Found with `git grep -n "startChat\|chatCommand\|seed_focus\|seed_portfolio"`. Hits outside `server/machine/pty/chat.ts`:
   - `server/machine/pty/routes.ts:34,566`
   - `state/sessions/terminals.svelte.ts:124,506,780`
   - `shell/rail/UpdateTray.svelte:31,105,157`
   - `views/shared/card/ProjectCard.svelte:51,281`
   - `tests/routes/sessions/terminal-actions.test.ts:329`
   - `config/text/server.yml:13-15`

   An optional seed makes none of them false. There is no write list to compare against.
2. Neither DESIGN.md nor HELP.md names `startChat` or `chat.ts`. A repository-wide `git grep -l "startChat\|server/pty/chat\|state/terminals.svelte"` finds them only in other ledger briefs and reviews. HELP.md:25 (the tray's Chat control) stays true.
3. `TIMEOUT_MS` (Z312) is defined six times: `git grep -n "TIMEOUT_MS ="`. The widening means only `server/git/git-write.ts:89`. `server/git/deposit-git.ts:36` (10000, and the deposit runs `commit -F` at :206) is a second commit path with the same limit, and the widening does not name it.
4. No `config/` grep was needed beyond `config/text/server.yml`, `config/sources.yml`, `config/layout.yml` and `config/catalogs/agents.yml`. Every config grep carried `--exclude=local.yml`.

## The step line

`grep -n "^- D20 " plan.md` gives line 519, with widenings at 520-525. With no "What to build" section, no part of the line maps to an item:

1. A task row's control starts a chat terminal seeded with the task's text: no item.
2. Seeded with the task's project: no item.
3. The terminal named after the task: no item.
4. A2, Claude or Codex in a fresh worktree from the Repositories view: no item.
5. Step 0, approval before a seeded agent runs (Z195): no item.
6. Z289, a transcript above Node's string limit read in pieces, with the later read asking from its offset: no item.
7. Z297, an armed Kill drawn armed, and the Terminal tab drawing the shell starting instead of the composer: no item.
8. Z307, the grid's scrollback, and a Terminal tab staying in the layout: no item, no cause written.
9. Z312, the Graph pill menus: no item, no cause written. A commit past 10 s, and a failed command's reason: no item.
10. Z313, the Sessions New button: no item, no cause written.

## Premises (re-run at head)

1. Stub path `state/terminals.svelte.ts` has moved. It is now `src/lib/state/sessions/terminals.svelte.ts`; `startChat` is at :506-512 (`git grep -n startChat`).
2. Stub path `server/pty/chat.ts` has moved. It is now `src/lib/server/machine/pty/chat.ts`; `startChat` is at :74.
3. The seed already exists, which matters for the mechanism. `chatCommand` (chat.ts:53-71) passes a positional seed from the catalog (`server.chat.seed_focus` / `seed_portfolio`, chat.ts:103-105). It also passes `--disallowedTools Bash,Edit,Write,WebFetch,WebSearch` (chat.ts:65-66). An agent started through `startChat` cannot edit or run anything.

   Axel's ruling at plan.md:662 says D20 starts the interactive `claude` with a permission mode picked at start, the normal mode preselected, and a skipping mode confirmed at each start.

   The composer route already exists and carries those picks: `compose` (server/machine/pty/compose.ts; routes.ts:570-571; `config/catalogs/agents.yml:28-42` has `--permission-mode` with default `manual` and `bypassPermissions`). The composer has no confirmation for a skipping mode: `grep -rln -i bypass src config --exclude=local.yml` finds only `agents.ts` and `agents.yml`.

   The stub's mechanism ("startChat gains a seed argument, chat.ts takes the seed text") contradicts ruling 662. The brief must take the composer.
4. "The Focus board's task lanes" is wrong. The lanes are project cards: `grep -n -i task src/lib/views/boards/focus/lanes/*.svelte` prints nothing. The Focus board's task lines are the tasks section: `views/boards/focus/Tasks.svelte`, whose rows and buttons come from `views/boards/focus/rows.ts` (`actionsFor` at :86). Dated task lines are the command center's rows, drawn by the same `rows.ts`.
5. The "Tasks collection" exists (`config/sources.yml:60`; `Collection.svelte:14`, placement `tasks`). It draws generic `EntryCard.svelte` cards, not rows. The head comment at EntryCard.svelte:7-10 says "Nothing here knows what a scheme or an event is". A tasks-only control needs a registration-level opt-in.
6. "Its project when it names one": the tasks schema has no project field (`tasks/tasks.yml:6-13`: title, status, deadline, kind, note, tags, followup). The link runs the other way: a project names the entry (EntryCard's cross-links).
7. "Q11's Ask" holds: `ask()` is at `views/shared/card/ProjectCard.svelte:279-287`.
8. `DESIGN.md:150` has moved to `DESIGN.md:153` (`grep -n "seeded with a task" DESIGN.md`).
9. "D17.md item 3" is wrong. D17's item 3 is Placeholders; the approval store is item 4 (`grep -n approv agents/briefs/D17.md`, line 42). D17 has landed (`git log -1 76bdcd8c`: "Add project commands").

   The store is `server/machine/approvals/approvals.ts` (`isApproved` :92, `approveTexts` :113), and it writes only `command:` keys (:44-46). DESIGN.md:328 puts the seeded agent under kind `command`. The only approve wire is `POST /api/commands {action:'approve', repo, texts}` (commands/routes.ts:103), which is tied to a repository.
10. Z289 holds unmoved: `foldFrom` at `server/sessions/stores/transcripts.ts:79`, with `toString` at :104 and the `catch` answering 0 at :117-118.
11. Z297 Kill: cited `TerminalList.svelte:344-357`; now the Kill `ToolButton` is at :353-366, with `pressed={arming === row.terminal}` at :363.

    Cause, read-only: `ui/controls/ToolButton.svelte` sets `aria-pressed` (:193) and has no style for it. `grep -n aria-pressed` finds only :193, and the only state style is `.active` (:458).

    Size problem: ToolButton.svelte is 539 lines (`wc -l`). The size test refuses 540 (`tests/checks/tree/size.test.ts:29`), and `utils/size-allow.txt` has no entry for it. Any line added there fails G20, so the brief must split it.
12. Z297 composer during New Terminal: cited `terminals.svelte.ts:722-729`; now `running` is at :723-725 and `runningOf` at :728.
13. Z307 Terminal tab drop:
    - Cited `terminal-lists.ts:17-27`; now `endedTerminals` is documented at :21-27, code :28-38.
    - Cited `terminals.svelte.ts:292-306`; the `sessions` handler is now :263-284, calling `closeEnded` at :279.
    - No scrollback cause is written. The server side has `SCROLLBACK_LINES` in `server/machine/pty/channel.ts:337`.
14. Z312 pill menu:
    - Cited `CommitRow.svelte:13-14`; the sentence is now at :12-14.
    - Lead for the cause, not verified on screen: `refKind` (`views/sources/repositories/menus/graph-menu.ts:62-65`) returns `'none'` for the checked-out branch. `refMenu` (:130-131) then answers `[]` and CommitRow draws the pill with no menu of its own (CommitRow :112-121), so the right-click reaches the commit's menu. That matches "idle, the look-branch pill opened the commit's menu" if `look-branch` was checked out.
    - During a write, `busy` empties both `refMenu` and the commit's checkout and tag items (:83-86); whether `commitMenu` then answers nothing is not verified.
15. Z312 timeout:
    - Cited `git-write.ts:92`; `TIMEOUT_MS` is now :89.
    - Cited `:627-628`; the commit's run is now :623 (`commitWith`).
    - Cause of "no reason", verified with a probe: `run` tests `failure.code === 'ETIMEDOUT'` (git-write.ts:142). An async `execFile` timeout has `code: null`. Command: `node -e "require('child_process').execFile('sleep',['3'],{timeout:200,...},(e)=>...)"` printed `{"code":null,"killed":true,"signal":"SIGTERM","message":"Command failed: sleep 3\n","stderr":""}`.
    - So the reason falls to `failure.message`, "Command failed: ...". The same test sits in `deposit-git.ts:149`.
    - `core/git/run.ts:164` uses `spawnSync`, where the code is `ETIMEDOUT` (`execFileSync` probe printed `ETIMEDOUT SIGTERM`), so it is correct.
16. Z313 holds as to place: the New button is at `views/sessions/session-list/SessionList.svelte:222-229`, with `onclick={newSession}`. That calls `composeIn()`, the same function the `n` key reaches (`shell/keys/workbench-keys.svelte.ts:196`, `terminals.svelte.ts:376-385`). The code paths agree, so the cause is in the DOM: the toolbar is `overflow` (:221), in `ui/frame/toolbar/Toolbar.svelte`. Not found here; owed by /spec.
17. A2: `createWorktree` exists (`Repositories.svelte:316-321`, `refs/Worktrees.svelte`, and the G33 unit). Repositories.svelte is 480 lines, so a control there needs care against the 520 line.
18. Other sizes near the line (`wc -l`):
    - EntryCard.svelte 502 (limit 520)
    - ProjectCard.svelte 496
    - TerminalList.svelte 492
    - terminals.svelte.ts 815 (limit 880)
    - git-write.ts 800
    - routes.ts 628

## Cases and checks

1. There are no cases and no verification list, so there is nothing to read against spec.md or guarded.md.
2. What the brief must settle against guarded.md:
   - **Units already guarded.** G35 covers `chat` and `compose` (tests in `tests/routes/sessions/terminal-actions.test.ts` and `compose.test.ts`). G33 covers commit and `createWorktree`. G31 covers approvals. G1 covers the terminal route's token.
   - **Behaviours with no entry.** "a seeded agent runs only after approval" (D17's own `isApproved` gate in `commands/run.ts:91` has none either), "a transcript above the string limit folds in pieces", and "a timed-out or failed git command says why". `grep -n -i approv guarded.md` finds only G31; `grep -n -i "transcript\|foldFrom" guarded.md` finds nothing.
   - **Consequence.** Under spec.md, a step that needs a new entry stops and asks Axel. The brief must either place each under an existing entry or raise the entry as an open item before dispatch.
3. Fixtures and processes:
   - A hook running longer than 10 s, and a transcript above 512 MB, both need a real process or a big file. Each is a slow test, or a fake runner and a synthetic piece size.
   - No real Claude or Codex may start: the compose tests already use a fake argv runner.
   - Any tmux test must use `-L` or a private `-S` socket.

## The question (could it pass without the goal being reached?)

1. **Seeded start through `startChat`.** Yes: it passes with an agent that cannot touch the task (`--disallowedTools`, chat.ts:65-66), against ruling 662.
2. **Project seeding.** Yes: it can pass by starting every task in the hub root, since tasks name no project. The brief must define the project source.
3. **Approval.** Yes: it can pass with the approval keyed by the title alone, so a changed note or subtask runs without asking. The approved text must be the whole prompt plus folder plus agent.
4. **Z289.** Yes: it can pass by folding in pieces while still answering offset 0 on an error, so the client keeps asking from 0. The case must assert a non-zero offset and a later request from it.
5. **Z297 Kill.** Yes: it can pass with a style under one theme. The standing demand says the look covers every theme.
6. **Z307 tab.** Yes: it can pass by never closing a Terminal tab, which breaks closing an ended terminal's tab. Both directions need a case.
7. **Z312 timeout.** Yes: it can pass by raising 10 s to 60 s, while VS Code has no limit, and by fixing only git-write.ts and leaving deposit-git.ts:149.
8. **Z312 pills.** Yes: it can pass for non-current branches only (the `refKind` `'none'` lead).
9. **Z313.** Yes: it can pass on a wide pane and fail when the toolbar overflows.
10. **A2.** Yes: it can pass by opening the composer in the repository root rather than the new worktree's folder.

## Implied inputs

1. **The task's text.**
   - Unstated: title alone, or title, note and open subtasks.
   - For a Focus subtask line, the `do` text and its holder.
   - Expected: one dictated prompt template.
2. **The project.**
   - A project subtask line: that project's folder.
   - A task entry named by exactly one project: that folder.
   - Several projects, or none: the hub root.
3. **Status.** Expected: the control shows on `todo` and `doing` only, not on `done` or `dropped`.
4. **Edge input.**
   - Empty or whitespace title: no control, or a refusal.
   - Over 80 characters: the name cut at 80, as chat.ts:115 does.
   - Over `PROMPT_MAX` (compose.ts): a refusal.
   - Control characters: passed as one argument, as compose does.
5. **Approval.**
   - Text changed after approval: asks again.
   - Pressed twice: one entry.
   - An approvals file that does not read: refused, under G31.
6. **Start in flight.**
   - Tab closed meanwhile: ended and refused, as `composeTerminal` does.
   - Hub root not yet known: waits, as `hubReady` does.
7. **A2.**
   - Name already taken: the existing refusal.
   - Repository whose .gitignore does not hold the worktrees folder: the Worktrees.svelte warning.
   - Detached HEAD, a dirty tree, Claude against Codex, an account choice.
8. **Z289.**
   - A line across a piece boundary, and a multi-byte character across one.
   - One line larger than a piece.
   - A file growing during the read.
   - An offset beyond the size (answers 0).
9. **Z312 timeout and reason.**
   - A commit hook over 10 s.
   - A failed command with empty stderr and stdout.
   - A push past 60 s (`PUSH_TIMEOUT_MS`).
   - The deposit commit.
10. **Z307.**
    - A `sessions` list that misses a running terminal once (a tmux list race), then names it again.
    - A reload.
11. **Z312 pills.** The current-branch pill, a remote pill, a tag pill, each idle and busy.
12. **Z313.** The pane narrow enough that New goes into the toolbar's overflow.

## ADRs

`ls tools/oculus/docs` prints only `diagrams`. `grep -rn "^\s*adr"` over `.agents/plan.yaml`, plan.md and orchestrator-state.md prints nothing. There are no ADRs.

## Dictated text

1. The stub dictates no line to be written. No catalog string, comment or doc sentence is given. Nothing to grep; holds.
2. Lines the brief will have to dictate, and does not yet:
   - the control's label and tooltip (catalog keys)
   - the prompt template
   - the terminal name
   - the approval question and label
   - the skipping-mode confirmation (ruling 662)
   - the timeout reason
   - the A2 control's words
   - the HELP.md and DESIGN.md sentences for the task control and A2

## User-visible choices nothing names

1. **Mechanism of the start.**
   - (a) The composer, prefilled with the task prompt in the project's folder, with ruling 662's picks and a confirm for a skipping mode.
     - Pros: matches ruling 662; the reader sees and edits the text; the argv is already safe.
     - Cons: one more press.
   - (b) `startChat` with a seed.
     - Pros: one press.
     - Cons: a read-only chat that cannot do the task; contradicts ruling 662.
   - Recommend (a). Lazy option: (b).
2. **Where the control sits.**
   - (a) A row action in `rows.ts` for task entries and subtask lines, plus a tasks-only opt-in in the collection's registration (`Collection.svelte` placements) for `EntryCard`.
   - (b) A per-collection config key in `sources.yml`.
     - Pros: the reader can turn it on for other collections.
     - Cons: a new config key.
   - (c) A right-click item only.
     - Cons: hidden.
   - Recommend (a). Lazy option: the Focus rows only, leaving the collection.
3. **The approved text and its wire.**
   - (a) A `command:` key over `JSON.stringify({cwd, agent, prompt})`, approved through a new `approve` action on `/api/terminal`.
   - (b) Reuse `POST /api/commands` with `repo` set to the folder.
     - Cons: misnames a task as a repository command.
   - Recommend (a), and book it as a wire shape for Axel. Lazy option: key by the title.
4. **The terminal name.** The task title cut at 80 characters, against "Task: <title>" through a catalog key. Recommend the catalog key.
5. **A2's control.**
   - (a) A "New Worktree with Agent" action in the Worktrees section header, which asks the name, makes the worktree and opens the composer there.
   - (b) "Start Claude here" and "Start Codex here" on each worktree row's menu.
   - Recommend both, since a row already has its shell. Lazy option: (b) alone, which leaves "fresh worktree" to two separate steps.
6. **The commit's limit.**
   - (a) None, as VS Code.
   - (b) A config key.
   - Recommend (a), with the reason text "git timed out" kept for the others. Lazy option: raise the constant.

## Libraries

1. The stub records no library check, while `.agents/plan.yaml` sets `libraries: check`. The section is missing.
2. Candidates found with `npm view`:
   - For the piecewise transcript read: `split2` 4.2.0, `ndjson` 2.0.0, `stream-json` 3.7.0. Node's own `readline` is the built-in alternative. `foldFrom` is synchronous, so a stream library changes its shape.
   - For the timeout reason: `execa` 10.0.1, which has a `timedOut` flag. Node's `killed` and `signal` fields already answer it.
   - None is required. The brief must record the check and the choice.

## Shared paths with the steps in flight

D20 has no write list. From the stub and the widenings it will write at least:
- `server/machine/pty/{chat,compose,routes}.ts`
- `server/machine/approvals/approvals.ts`
- `server/sessions/stores/transcripts.ts`
- `server/git/git-write.ts`, possibly `deposit-git.ts`
- `state/sessions/terminals.svelte.ts`, `state/sessions/terminal/terminal-lists.ts`
- `ui/controls/ToolButton.svelte` and its split
- `views/sessions/terminal/TerminalList.svelte`, `Composer.svelte`
- `views/sessions/session-list/SessionList.svelte`, possibly `ui/frame/toolbar/Toolbar.svelte`
- `views/sources/repositories/graph/CommitRow.svelte`, `menus/graph-menu.ts`, `Repositories.svelte`, `refs/Worktrees.svelte`, `menus/repo-menu.ts`
- `views/boards/focus/rows.ts`, `Tasks.svelte`
- `views/boards/collection/{Collection,EntryCard}.svelte`
- catalogs under `config/text/`
- HELP.md, DESIGN.md, `docs/diagrams/`

1. **X3f** (`X3f.md` write list; `X3f-round1.md` items 1-8).
   - Shared: HELP.md, DESIGN.md and `docs/diagrams/`.
   - Possibly shared: `state/workbench/layout.svelte.ts`, if the Z307 tab fix lands there.
   - X3f gives no line ranges for HELP.md or DESIGN.md.
   - Simple only if D20's brief names its HELP and DESIGN line ranges and keeps the tab fix in `terminal-lists.ts` and `terminals.svelte.ts`; the diagrams are regenerated at landing.
2. **S5 with Q119** (`S5.md`, `Q119.md`).
   - Q119 writes `chat.ts` lines 9 and 79, `compose.ts` lines 34 and 233, and `routes.ts` lines 28, 203, 311, 353 and 429.
   - S5 writes `config/text/server.yml` whole (its edits are at `server.config_key` and `server.config_value`, :19 on), plus HELP.md, DESIGN.md and diagrams.
   - routes.ts: D20's chat and compose actions are at :565-571, far from Q119's lines. Simple.
   - chat.ts: line 79 is five lines below `startChat`'s signature at :74. Under option 1(a), chat.ts need not change. If D20 edits :74-80, the merge is not simple, so D20 names the lines or waits for S5.
   - compose.ts: line 233 is near where a skipping-mode check would go. Not verified simple until the brief names its lines.
   - server.yml: new D20 keys under `server.chat` (:8-15), or a new group, are separate hunks. Simple.

## Declined to judge

1. The causes of the Claude grid's scrollback (Z307), the Terminal tab dropping (Z307) and the New button (Z313). They need the running page or a deeper read, and are /spec's to find. The two leads given above (the pill's `refKind`, and the timeout `code`) are leads to confirm, not findings.
2. Whether `commitMenu` answers an empty list while busy. Not run.

Usage: ordo-high on claude-opus-5-5 (a6ba40bc4b321b9e6), 187,390 tokens, 83 tool uses, 9.7 min.

### Closed

Each finding by section and number, with where `agents/briefs/D20.md` closes it. "Held" means the brief leaves the part out because its cause was not found read-only; the orchestrator holds it with the ways tried.

Names
1. `startChat` and its callers are not changed: the start goes through the composer ("The plan line and the rulings", ruling 662 bullet; Decisions 1).
2. No HELP or DESIGN line names `startChat`; the lines the step does touch are listed under "What is on the tree" (the documents bullet) and "What to build" 9.
3. Both commit paths are in: `git-write.ts` and `deposit-git.ts` ("What is on the tree", the git bullet; "What to build" 7.1 to 7.3; cases 45 to 48).
4. Every `config/` grep in the brief carries `--exclude=local.yml` ("Read" 16).

The step line
1. The task control: "What to build" 1.1 and 1.2.
2. The project: 1.3, the folder rule.
3. The terminal named after the task: 1.3, the name.
4. A2: "What to build" 2.
5. Step 0, the approval: 1.4 and 1.7; cases 12 to 18.
6. Z289: "What to build" 8; cases 29 to 36.
7. Z297: "What to build" 3 and 4; cases 37 to 41.
8. Z307 scrollback: "What to build" 5, with its cause and probe. The Terminal tab dropping: held.
9. Z312 pills idle: "What to build" 6, with its cause and probe. The pill while busy: held (the pure menus are quoted in case 44). Commit past 10 s and the reason: "What to build" 7.
10. Z313: held.

Premises
1 and 2. The moved paths are used at head throughout ("What is on the tree").
3. The mechanism is the composer (ruling 662 bullet; Decisions 1); the confirmation is "What to build" 1.5.
4. The Focus task lines are `Tasks.svelte` and `CommandCenter.svelte` through `rows.ts` (1.1).
5. The Tasks collection card gets a tasks-only `extra` action (1.2).
6. The project comes from a manifest's folder or an entry's single `related` project (1.3; cases 2 and 6).
7. Q11's Ask stays as it is (Decisions 1).
8. `DESIGN.md:153` is cited.
9. D17's store, item 4, on main; the approval wire is a new `approve-seed` action on `/api/terminal` (1.4).
10. Z289 lines confirmed at head ("What is on the tree", transcripts bullet).
11. Kill lines at :353-366 and :363; the style and the ToolButton split are "What to build" 3.1 and 3.2.
12. The starting tab: "What to build" 4, from the store's own starting set.
13. Z307 tab: held. The scrollback cause is written ("What to build" 5).
14. Pills: cause confirmed by probe and the Q88 look ("What to build" 6). Busy: held.
15. Timeout lines and cause: "What to build" 7 and its probe; `run.ts:156` left as it is.
16. Z313: held.
17. A2 against `Repositories.svelte` (480 lines): the new controls sit in `Worktrees.svelte` and `repo-menu.ts` ("What to build" 2).
18. Sizes: ToolButton split (3.2), Terminal.svelte below 520 through `TerminalStart.svelte` (4.2), EntryCard at or under 520 (1.2), terminals.svelte.ts at or under 880 with a named move if needed (1.8); verify 3 names each.

Cases and checks
1. "Cases" holds 52 cases (1 to 50, with 7a and 28a) and "Verify before you report" its list.
2. Guarded: only case 22 is a test (G13's row); the seeded-agent approval, the confirmation of a skipping mode, the transcript read in pieces and a failed git command's reason have no entry and go to Axel as four proposed entries; the builder writes no test for them and checks them by quoted runs ("Cases", the bullets after the cases).
3. Fixtures: the 25 s and 35 s hooks in scratch repositories, a 600 MB generated transcript, a piece size parameter, the fake compose runner, tmux only with `-L` or `-S` (cases 29 to 35, 45, 48; "What it must do").

The question
1. Composer, never `startChat` (ruling 662 bullet).
2. The folder rule and cases 2 and 6.
3. The approval text is agent, real folder and whole seed (1.4; cases 12 to 14, 17).
4. Case 35 asserts the offset equal to the size and a later read from it.
5. Case 37 covers the default palette, 16 palettes, `rice` and `crt`.
6. Z307 tab: held.
7. Commit, merge, cherry-pick, rebase continue and the deposit commit run with no limit; both modules use the classifier (7.1, 7.3; cases 45 to 48).
8. The checked-out branch gets its own menu (6.1; case 44).
9. Z313: held.
10. The composer opens in the new worktree's folder (2.1; case 24).

Implied inputs
1. The seed lines are dictated (1.3, 9).
2. The folder rule (1.3).
3. Only a non-terminal status carries the control (1.2; case 5).
4. Empty text (1.3; case 7a), 80 characters (case 7), `PROMPT_MAX` (case 8), control characters (case 7).
5. Changed text, twice, unreadable file (cases 9, 15, 16, 17).
6. Tab closed, hub root unknown, second `composeAt` ("What it must do"; cases 40, 41).
7. Name taken, `.gitignore`, detached HEAD, uncommitted changes, both agents, the account picker (cases 24 to 28a).
8. Piece boundary, multi-byte, long line, growing file, offset beyond size (cases 29 to 33).
9. Hook over 10 s, silent failure, push limit, deposit commit (cases 45, 46, 50, 48).
10. Z307 tab: held.
11. Pills idle and busy (case 44; the page while busy held).
12. Z313: held.

ADRs: none; stated in the brief's opening paragraph.

Dictated text
1. Holds.
2. Every key's words are under "What to build" 9; HELP.md and DESIGN.md lines are named with what each must say, and the sentences are the builder's, read at review.

User-visible choices nothing names
1. Mechanism: settled by ruling 662 (Decisions 1).
2. Where the control sits: choice C1 (1.1, 1.2).
3. The approved text and wire: choice C2 (1.4).
4. Terminal name: choice C3 ("Task: {0}").
5. A2: choice C4 (both the new-worktree row's controls and the row menu).
6. The commit's limit: choice C5 (none for the hook-running commands, with a reason for every failure).
In addition the brief raises C6 (renderer variable scope), C7 (current-branch pill), C8 (which modes confirm, and the `confirm` key), C9 (libraries) and C10 (the seed read-only with the reader's words appended).

Libraries
1 and 2. "Libraries checked": each candidate with version, licence, maintainer, last publish and engines; recommendation none (C9).

Shared paths
X3f, S5 and Q119: "Paths this step writes" gives line ranges at head and judges each merge simple; `chat.ts` and `layout.svelte.ts` are not written; Q119's routes.ts lines at head are 29, 225, 324, 361, 433.

Declined to judge
1. Z307 scrollback: found and written. Z307 tab and Z313: held.
2. `commitMenu` while busy: run; it answers four items (case 44).

## The check over the full brief (`agents/briefs/D20.md`, 329 lines, committed at 6bf3a1795)

Main's head is 6bf3a1795, not 94bb9b3a8. The only commit since then is the plan booking. `git diff --stat 94bb9b3a8 HEAD -- tools/oculus/src tools/oculus/config tools/oculus/tests tools/oculus/utils tools/oculus/HELP.md tools/oculus/DESIGN.md` prints nothing. `git diff --stat 40cc596ff 94bb9b3a8 -- <same>` also prints nothing, so the brief's base claim holds. The base copy `.agents/worktrees/D20-base` and the worktree `D20` do not exist yet (`ls .agents/worktrees`). That is expected before preparation.

### Names

1. `startArgs` has a caller outside the write list: `server/machine/usage/refresh.ts:96` (`grep -rn "envArgs\|startArgs" src`).
   - Item 5.1 says "every terminal it starts", so the usage refresh's own `claude` start would also get `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1` and switch to the classic renderer.
   - refresh.ts reads the screen with `capture-pane -p`. It looks for the prompt in the last 8 lines (`hasPrompt`, `PROMPT_TAIL_LINES`) and for "current week" (`sheetShown`).
   - No case, look or document line covers this. S5 also writes refresh.ts.
   - The brief has to either leave usage starts out (a `joined` option, or the constant applied only to the composer, start and pty routes) or add a case or look of a usage refresh after the change.
2. `ShellStarter` (`state/shared/stores/shell.ts:15`) is used by `openShell(deps, ...)` at `views/shared/explorer/tree/menu/row-menu.ts:438`.
   - The `deps` passed there carry only `startTerminal` and `showTerminal` (row-menu.ts:352-353, :372-373).
   - If item 1.8 adds `composeAt` to `ShellStarter` as a required member, row-menu.ts fails the type check. row-menu.ts is outside the write list, and X3f writes it.
   - The brief should require the second option it already names ("a type beside it"): a separate type that the repositories store takes. It should not leave "ShellStarter or" open.
3. `RefKind` also names a different type in `server/core/git/compare.ts:50` (`'branch' | 'remote' | 'tag'`). Adding `current` to graph-menu's `RefKind` does not make compare.ts false. Verify 7's `refKind` grep will hit it, so the report should mark that hit as unrelated.
4. `ETIMEDOUT` / "timed out" hits outside the write list stay true:
   - `server/core/git/run.ts:164` (spawnSync). The probe `spawnSync(..., {timeout:200})` printed `ETIMEDOUT SIGTERM`.
   - `server/root/watch/autofetch.ts:77`, `server/files/search.ts:52` and `core/git/files.ts:24,48`.
5. `createWorktree` has hits in `git-write.ts:480`, `git-routes.ts:31,91,150,301`, `tests/server/git/git-write.test.ts:18,151` and `tests/routes/git/git.test.ts:92`. These are the server function, which the step does not change. Only the store's signature (`repositories.svelte.ts:116`, `:428`) and the view caller (`Repositories.svelte:316-321`, `:435`) change, and both are in the write list.
6. Other names checked:
   - `Composer.svelte` and `AttachPicker.svelte` are imported only by `Terminal.svelte:54` and `Composer.svelte:23`.
   - `Segment.svelte` and `segment-items` are imported by the four views named. `ToolButton.svelte:7` mentions `Segment.svelte` in a comment, which stays true after the move.
   - `foldFrom` (`turns.ts:6,25,145`; `transcripts.ts:142`), `ComposeStart` (`agents.svelte.ts:26`, `model/index.ts:498`) and `worktreeMenu`/`worktreePick` (`Worktrees.svelte:33,152`): no hit outside the write list becomes false.
   - No `config/` grep in the brief lacks `--exclude=local.yml`.

### The step line

Every part maps to an item:
- The task control: 1.1 and 1.2.
- Seeded with text and project: 1.3 to 1.7.
- "As Q11's Ask does": replaced by ruling 662 (Decisions 1).
- A2: item 2.
- Z195: 1.4 and 1.7.
- Z289: 8.
- Z297: 3 and 4.
- Z307 scrollback: 5. Z307's dropping tab is in Z515.
- Z312: idle pill 6, commit limit and reason 7. The busy pill is in Z515.
- Z313: in Z515.

1. Z126 (`plan.md:834`, `:580`) says A2 was folded into D20 "its line kept whole in `agents/briefs/D20.md`". The brief quotes only the D20 line (`grep -n A2 D20.md` finds :69, :166, :264, none of them A2's own line). A2's line, from `git log -p -S"- A2 "` at 17cd844b0, is: "A2 a session in a new worktree: Claude or Codex started in a fresh worktree of a repository from the Repositories view (Axel 2026-09-23, from the same comparison; with D20; brief at dispatch)". It should be quoted under "The plan line and the rulings".
2. Case 23 needs "the Sessions view's New" to open the composer and ask the confirmation. Z313 (New opens nothing) is held out of the brief (:16, Z515 (2)), so case 23's second half cannot pass while Z313 is unfixed. Either drop that half or tie it to Z515's outcome.

### Premises

I reran the "What is on the tree" commands at head.
- Every `wc -l` matches: 244, 628, 80, 312, 330, 424, 815, 524, 139, 254, 151, 261, 420, 502, 207, 492, 539, 240, 239, 800, 315, 395, 218, 291, 142, 233, 480, 493, 99, 33, 64, 96.
- Every line reference I checked holds:
  - compose.ts :60, :152-183, :205-215.
  - routes.ts :279, :516, :570.
  - model-sessions.ts :288 region.
  - approvals.ts :44-46, :92, :113.
  - terminals.svelte.ts :376, :392, :401, :414, :538, :636, :661, :665, :679.
  - terminal-tabs.ts :64-66, :210-226.
  - Terminal.svelte :404-407, :429-434, :517-523.
  - ToolButton.svelte :193 (the only `aria-pressed`), :301-314.
  - graph-menu.ts :56, :62-65, :130-145.
  - CommitRow.svelte :11-13, :140-150.
  - git-write.ts :89, :94, :124-160, :142.
  - deposit-git.ts :36, :149, :205-206.
  - run.ts :156.
  - parse.ts :626-632.
  - writes.svelte.ts :439, :455, :484-547.
  - behavior.yml:146 is 30.
  - transcripts.ts :79-122.
  - turns.ts :136-151.
  - transcript-routes.ts :20, :78, :127-137.
  - cache.ts :32.
  - sessions.ts :45, :323-330, :469-482, :523-555.
  - repo-menu.ts :61-70, :73-78.
  - Repositories.svelte :316-324.
  - repositories.svelte.ts :428-431.
  - derive.ts :236-237.
  - contrast.test.ts :63.
  - The 16 palettes plus `rice` and `crt`.
  - Folder counts: `views/sessions/terminal` 10, `ui/controls` 10, `state/sessions/terminal` 10, `server/machine` 7.
  - `tasks/tasks.yml` has 3 entries and `grep -c related:` prints 0. The only manifest with `subtasks:` is `projects/active/eeg-saad-challenge/project.yml`, with "Register" (2026-09-20) and "Blind test submission ..." (2026-12-08).

I reran the probes under `$TMPDIR/d20bc2`. Each was copied from `$TMPDIR/d20brief`, and the pill probe was rebuilt on head's `graph-menu.ts`.
- `pressed.mjs` printed the same 13 bare pressed ToolButtons.
- `timeout.cjs` printed `timeout: {"code":null,"killed":true,"signal":"SIGTERM",...}`, `exit 1, no output: {"code":1,"killed":false,"signal":null,...}`, `killed by a signal: {"code":null,"killed":false,"signal":"SIGKILL",...}` and `maxBuffer: {"code":"ERR_CHILD_PROCESS_STDIO_MAXBUFFER",...}`.
- `xt/probe.cjs` printed `normal buffer, 57 lines: buffer=normal length=57 baseY=47` and `fullscreen (?1049h ?1000h ?1006h), 57 lines: buffer=alternate length=10 baseY=0 rows=10 mouse=vt200`.
- A byte scan of `~/.local/share/claude/versions/2.1.289` found `function s(){return a.CLAUDE_CODE_NO_FLICKER===!1||a.CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN}` and the binary's own text "CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1 forces that any time".
- A scratch repository whose pre-commit hook is `exit 1` printed `rc=1 stderr=[] stdout=[]`, so case 46's premise holds.

Premise findings:
1. :29 says the approve wire is `POST /api/commands {action:'approve', repo, texts}`. The field is `chain`: `commands/routes.ts:49-51` has `chain: z.array(z.object({ folder, run }))`, and :101 has `chainText(repo, action.chain)`.
   - That route also runs `approveTexts` inside `chained(options.writes, ...)` (:102) and answers a failure with 409.
   - The terminal route's options have no `writes` (`routes/api/(sessions)/terminal/+server.ts:15-42`). `approveTexts` is synchronous, so two calls cannot interleave inside the process. Even so, the brief should say that `approve-seed` runs outside the write chain, or carry `writes` into the terminal route. The terminal route's `+server.ts` would then join the write list.
2. :25 says the renderer probe used `@xterm/headless`. `xt/probe.cjs` loads `@xterm/xterm/lib/xterm.js` with browser shims. The printed results are unaffected.
3. :39 says "a git write the server lets run for 25 s or more is said as given up at 30 s". The figure is 30 s or more.
4. Decisions 5 says "the composer is the one start path that passes a permission mode". This is false. The update tasks pass `--dangerously-skip-permissions` when `tasks.skip_permissions` is true (`data/helpers/run/tasks.ts:17-22`, used by `pty/routes.ts:26`; `config/behavior.yml:91` is `false`), behind the tray's own confirmation (`shell/rail/UpdateTray.svelte`). The decision's conclusion still stands; its stated reason needs rewording.
5. The ruling is called "Ruling 662" while it sits at `plan.md:663` (`grep -n "permission mode" plan.md`). Name it by its date, 2026-09-16 17:32, so no line number is used as its name.

### Cases and checks against spec.md and guarded.md

1. Several page-level cases are neither in the look list nor runnable by a builder:
   - The brief says the step starts no server (:23), and the builder opens no browser.
   - "Seen only on screen" lists only 37 to 41, 43, 44 and the composer's panels.
   - These cases are page behaviours: 1 to 5 (the Focus buttons, the composer opening with its seed), 9's composer half, 10, 11's page half, 19, 20, 23, and 24 to 28a (Create with Claude or Codex, the worktree menu, the composer opening).
   - Under :213 ("checked by a run the report quotes") the builder can check only their pure parts.
   - The brief should split each case into its quoted run (for example `actionsFor` over a ticker line, `seed` over a fixture hub, the store's `composeAt` over a fake post) and its look half, and list the look halves.
2. Case 48's expected words contradict its own setup.
   - It expects "gh did not finish within 120 seconds" with "the limit made small through the option for the run". Item 7.1 makes the detail "the limit in seconds", so a small limit prints a small number.
   - "Through the `gh` option" is a `GhRun` (`deposit.ts:147`, :202) that replaces `gh()` whole, so `execute` (deposit-git.ts:137-159) and the classifier are never exercised.
   - The case must call `execute` through a fake `gh` executable (for example on PATH) with a small limit, and expect that limit's number. As written, nothing shows that `deposit-git.ts` uses the classifier.
3. Case 47 says "the words as the catalog gives them" for "a stderr line 'fatal: not a git repository'". The catalog gives no words for git's own reason, and `shortReason` drops `fatal: ` (parse.ts:630). The expected line ("not a git repository") should be stated.
4. Tests:
   - Only case 22 is a test, a G13 row. That holds with spec.md:57, and Z514 holds the four proposed entries.
   - The step changes G35's compose unit (`tests/routes/sessions/compose.test.ts`, 'starts the agent with its picks and the prompt as one argument, in the workspace'). That test posts `picks: { model, effort }` (compose.test.ts:104), so `mode` stays `manual` and the test stays green. The brief should still name it under spec.md:57 ("runs that entry's test"), together with G6, G33 (`tests/server/git/git-write.test.ts`) and G31 (`approvals.test.ts`).
5. Fixtures, processes and tmux:
   - Synthetic fixtures, the fake runner, and tmux only with `-L` or `-S`: holds ("What it must do").
   - The brief does not say that a tmux server a case starts with `-L` is killed after it. The compose cases use the fake runner, so none is expected; one sentence would close it.
   - The fake `gh` and the hooks end on their own (25 s, 35 s, killed at the limit).
6. Cases 1 to 3 read the real hub through the seed builder in a quoted run, not a test. spec.md:37 limits real-hub reads to four tests. A read-only quoted run is not banned, but the brief should say it is read-only and not a test.

### The question (could it pass without the goal being reached)

1. Case 36: "the export of a small fixture: byte-identical to the unchanged tree's" can pass on a fixture without the parts streaming changes.
   - `transcriptMarkdown` ends with `.replace(/\n{3,}/g, '\n\n').trimEnd()` over the whole string (transcript-routes.ts:118-121). A per-turn stream must reproduce a collapse that crosses turn boundaries, and the final trim.
   - The fixture must hold an assistant turn ending in blank lines followed by a user turn, a turn with leading line feeds, a tool turn between said turns, and a last turn ending in white space. Otherwise byte identity is not shown.
2. Case 48: see Cases 2. The deposit classifier is unexercised.
3. Case 40 (the starting line before the portfolio arrives) is a look case that is hard to stage on TEST. As written it can be recorded without being seen. The look should say how the state is reached, or the store's `startingIn` should be checked by a quoted run over a store whose portfolio has not arrived.
4. Case 42 shows only that the variable is passed. Case 43 (the look) is what shows the scrollback, and it is in the look list. Holds.
5. Case 35 checks the server. The page's `tail` (`state/sessions/transcript.svelte.ts:117-137`) already asks from the held offset, so a correct offset is enough. Holds. The look on the 634 MB log is conditional on the log still existing ("if it is still on disk"). If the log is gone, Z289's "draws its turns" is only server-checked; the look should then use case 35's 600 MB file through a session record.
6. Case 21 and item 1.5 check "picks include such a value". See Implied inputs 1: with a catalog default carrying `confirm`, the check passes while a skipping mode starts unconfirmed.
7. Item 4 and cases 39 to 41: the starting mark clears "when `startFor` answers". See Implied inputs 3: a path exists where it never clears.
8. Cases 12 to 17 run on the fake runner and the real approvals module, so they cannot pass without the approval logic. Holds.

### Implied inputs the brief misses (each with its expected result)

1. A catalog whose default value carries `confirm: true`, for example a reader setting Codex `approval` default to `never`, and a `compose` request with no pick for that list.
   - `choiceArgs` uses `list.default` when the pick is absent (`agents.ts:254`).
   - Expected: `needs-confirm`, and the composer's confirmation asked.
   - The check must run over the resolved values, not over `request.picks`.
2. `confirm: 'yes'` (case 22) reads with a finding, and G13 says "its default is used". The brief does not say what that default is.
   - If absent means false, a mistyped `confirm` on `bypassPermissions` silently removes the confirmation.
   - Expected: a value that is not a boolean reads as `true` (asks), which is the direction `data/helpers/run/tasks.ts:7-12` calls the one that matters. Alternatively the brief names false and says why.
   - This is a user-visible choice; see that section.
3. `startInTab` returns before `startFor` in two paths: `target === null` and `folder === ''` after `hubReady()` (terminals.svelte.ts:663, :666-668).
   - The rule "clears it when `startFor` answers" leaves the tab drawing "Starting Shell..." forever when the portfolio arrives naming no hub folder.
   - Expected: the mark clears on every return of `startInTab`, and the tab says `sessions.terminal_no_folder`.
4. A seeded composer whose agent is switched to Shell.
   - `compose` turns a shell start's prompt into keys typed into the shell (compose.ts:164), and `composeSession` types them with Enter (routes.ts:302).
   - The hub's seed, which is untrusted by spec.md:67, would run line by line as shell commands once approved.
   - Expected: a task seeds only Claude or Codex. Either the Shell choice is hidden while a task is attached, or `compose` with `task` and `agent: 'shell'` is refused.
5. A seed close to `PROMPT_MAX` plus typed words. Expected: the combined prompt over 100,000 answers `task-too-long` (or a named word), not the generic `bad-terminal` that `compose`'s thrown Error gives (refusal.ts:66-67).
6. A commit hook that never ends, for example a hook waiting on a terminal pinentry.
   - After items 7.3 and 7.4 neither the server nor the page has a limit, so the repository stays busy ("Working") with no way out but a server restart.
   - Expected: the brief says what the reader can do (a Cancel that ends oculus's own child, as VS Code's progress allows) or states this as a named consequence of choice C5 for Axel.
7. Hooks on the commands that keep their limits:
   - push runs `pre-push` (60 s, `PUSH_TIMEOUT_MS`).
   - `switch` (git-write.ts:701) and `worktree add` (:740) run `post-checkout` (10 s).
   - pull runs `post-merge` (60 s).
   - Item 7.3's own reason ("they run the repository's hooks") applies to these too. Expected: either they also run with no limit, or the brief says why they differ. A 90 s `pre-push` test hook fails at 60 s.
8. The Focus call site has no folder. `composeAt(cwd, agent, task?)` (1.6) needs a `cwd`, but a Focus line or a Tasks card knows only the task reference; the folder comes from `seed` (1.4).
   - Expected: the signature says what a task call passes, for example `composeAt({ task })` or `composeAt(cwd, agent)` plus `composeTask(task, agent)`.
   - The brief also does not say which agent the Focus button and the card pass. Case 1 implies Claude.
9. A subtask's key is its list index (`subtaskValues` keys by `item.key`; `subtaskPath` uses `Number(key)` for a list, entry-edit/subtasks.ts:109-118). Removing a subtask above the chosen one between opening and Start shifts the index.
   - Expected: `task-changed` with the next subtask's text shown, which the reader must notice and approve again. Either a case states this, or the reference carries the subtask's `do` so a shifted index answers `task-unknown`.
   - Case 7a's "the subtask's key stands for the text" then gives "Task: 2", which should be said.
10. A block-style subtask (`- do: X` on its own lines). The Focus board lists it, since the ticker reads parsed YAML, but `subtaskValue` reads only flow-map lines (`flowLine`, entry-edit/subtasks.ts:122-123).
    - Expected: the seed resolves it, or `task-unknown` is said with a sentence that is not "no longer in the hub".
    - The real hub holds only flow-style subtasks (grep over `projects`, `side-projects`, `funding`, `tasks`), so this is a fixture case.
11. A funding scheme's subtask. Its scheme has a folder (`link:`), and the folder rule sends it to the hub root. Expected: hub root, stated as a case.
12. A task title with an astral character (emoji) at characters 79 and 80 of the name. Expected: the 80-character cut does not split a surrogate pair.
13. Reload with a seeded composer open. `ComposerRecord.task` is kept in the tab's saved instance state.
    - Expected: the composer shows the saved seed, and Start rebuilds it (`task-changed` when stale).
    - A seed of up to 100,000 characters per tab enters the saved layout. The brief should say whether the seed itself is saved or only the reference, with the seed fetched again on load.
14. The landing look's Approve and Start writes an entry into Axel's real `~/.oculus/approvals.json` and starts a real Claude on a real task. Expected: the look names whether that entry is removed after and how the agent is ended.

### ADRs

None. `ls tools/oculus/docs` prints `diagrams`. `.agents/plan.yaml` has `standards: []` and no `adr` key (`grep -n "standards\|adr" .agents/plan.yaml`).

### Dictated text

Dictated lines (`grep -n` over the brief): :62 (the approval text), :89 (the variable), :121-130 (the catalog words).
- :62 holds; it matches DESIGN.md:328's pattern.
- :89 holds.

Findings:
1. :124 `server.git.timed_out`, `too_much_output`, `signal` and `exit_status` all open with `{0}` = `git` or `gh`, so the sentence starts lowercase.
   - X3e's D5 (`agents/briefs/X3e.md:142`) rules that every sentence of the same `server.git` group starts with a capital, and that "a sentence that opens with a placeholder takes a capitalised word for it from the catalog".
   - X3e also defines `server.git.timed_out` itself (X3e.md:144).
   - These are two rules for one group and one key. See Shared paths 3.
2. :127 `composer.approve_detail`: "This text comes from the hub, not from this box." is a negation contrast, which spec.md:20 bans for prose and which is an AI-tell by the hub rules. Suggested: "This text comes from the hub's task."
3. :121 `project.action.agent_tip`: "start an agent on this task, in its folder". The control opens the composer and starts nothing until Start (case 24's "nothing starts until Start"; :122's card tip says "Open the composer ..."). Two words are used for one action, and one of them is wrong. The tip should say that it opens the composer.
4. :125 `composer.confirm_skip_detail` uses only `{1}`. The brief should say it is called with (agent, label), as `confirm_skip` is.
5. :125 and :128 (`refused_needs_confirm`) say the mode "lets the agent act without asking". For `acceptEdits` (Claude's own words: "auto-approve file edits and common file commands") and `auto` ("a reviewer model screens actions") this is broader than the mode. It holds loosely. A per-value sentence would be exact.
6. :268 (Decisions 8) "rather than offered and refused" is a contrast construction in the brief's own prose. It is minor and not text the builder writes.
7. The other lines hold. The catalog style matches the siblings: lowercase Focus labels and tips beside `add_subtask_tip`, titles with no full stop in `composer.yml`, details ending in a full stop as `tag_delete_detail` does, `refused_*` ending in a full stop as in `terminal.yml:45-56`. Every key is new where the brief adds it (`grep -rn --exclude=local.yml "^ *<key>:" config/text` finds none of them). The `kind_*` keys exist in `terminal.yml:16-21`.

### User-visible choices nothing names

1. `approve-seed` answers `{ error: <English> }` on `/api/terminal`. Case 16 shows `approvals.json ... : <path>`.
   - `routes.ts:18-20` and `refusal.ts:1-8` state that this route answers only a word of `TERMINAL_REFUSALS` plus names, so no server English reaches the page.
   - This is a wire-shape departure the brief takes without a ruling, and it would make routes.ts's head comment false.
   - Option: a word (`approvals-unwritable`) with the file's path and reason as names, worded by the catalog.
2. The direction a wrong `confirm` reads in (Implied inputs 2).
3. Whether a seeded composer may start a Shell (Implied inputs 4).
4. Whether the seed text is kept in the saved layout (`ComposerRecord.task`, Implied inputs 13).
5. The commands with hooks that keep a limit (Implied inputs 7). Z513 rules the list "commit, merge, cherry-pick, rebase continue, the deposit commit", but not on the basis that push, switch, worktree add and pull also run hooks.
6. No way to end a git write that never answers (Implied inputs 6).
7. A funding scheme's subtask going to the hub root (Implied inputs 11). Z513 does not name the folder rule.

### Shared paths

1. X3f (`X3f-round2.md:148`; worktree `git -C .agents/worktrees/X3f diff HEAD`, base ec4c6f577, 95 changed or added paths): the brief's list of X3f lines is incomplete.
   - The worktree's diff also changes DESIGN.md :305, :324, :334 and :417, HELP.md :159 and :161, and inserts one line after HELP.md:85 (the Cmd+S row).
   - DESIGN.md :328 (D20) has 3 unchanged lines to X3f's :324 and 5 to :334: simple.
   - Every HELP.md pair has unchanged lines between: simple. After X3f lands, D20's HELP.md line numbers after 85 shift by one.
   - The only other shared path is `docs/diagrams/`. X3f's `ui/controls/editor/*` changes add no item to `ui/controls/`.
   - `git diff -U0 ec4c6f577 HEAD -- HELP.md DESIGN.md` shows only single-line replacements.
2. S5 with Q119 (worktree base 6005baee6, 109 paths):
   - compose.ts :34 and :233. routes.ts :28, :203, :311, :353 and :429 at its base, which are :29, :225, :324, :361 and :433 at head (`grep -n loadLocalOrDefaults`).
   - server.yml: insertions at :29, :31 and :52 in `config_key` and `config_value`. D20 adds after `fork` and `latex`.
   - HELP.md :154, :157, :261, :274. DESIGN.md :85, :408.
   - Each is simple against D20's ranges, as the brief says.
   - S5 also writes `server/machine/usage/refresh.ts`, which D20's `startArgs` change reaches by behaviour (Names 1). This is not a merge conflict.
3. X3e (waits; its brief is `agents/briefs/X3e.md`): the D20 brief does not mention X3e. X3e's own brief says (X3e.md:479) "Not simple; D20's brief is written against this one's D5 and D7". The overlaps:
   - `git-write.ts` `run` (:124-160): X3e moves 'git timed out' and 'git failed' (:143, :147) into the catalog; D20 replaces them with the classifier.
   - `deposit-git.ts` `execute`.
   - `git-routes.ts` :389-392 and `deposit-routes.ts` :205: both change how the error is worded.
   - `config/text/server.yml`: both create a `server.git` group at the same place, between :62 and :63, and both define `timed_out`.
   - `Worktrees.svelte`: X3e's `onenter` on the New worktree input at :212 sits inside D20's :203-220 controls. Not simple.
   - `CommitRow.svelte`: X3e's D7 pills at :75-83 and its head pill (D9). D20 changes the head comment at :11-13 and the pill menu at :140-150.
   - `graph-menu.ts`, `repositories.svelte.ts`, `Repositories.svelte`, `repositories.yml` and `tests/server/git/git-write.test.ts`.
   - `core/git/run.ts` (X3e D5) is a file D20 says needs no change.
   - The brief should name X3e, state the landing order (D20 first, X3e re-based on the classifier and D20's `server.git` keys, or the reverse), and write D20's `server.git` sentences to X3e's D5 rule, or record the choice between the two rules for Axel.
4. D45 (queued, not asked about): it writes `server.yml` :63-64 (`latex`), where D20 adds `task` right after. That is adjacent, so not simple, for whichever of them lands second.

### Declined to judge

1. Whether the classic renderer changes what the usage refresh's `capture-pane -p` sees (prompt detection, the "current week" sheet). Settling it needs a real Claude started, which this check may not do.
2. Whether VS Code puts a time limit on push, switch or pull, or offers a cancel on a commit whose hook hangs. VS Code's source was not read here.
3. The memory and time cost of case 35's first read and of the export of a 600 MB transcript. Nothing was measured; the brief already asks for the quote.
4. Whether `approve-seed` outside the write chain can race the commands route's approve. `approveTexts` is synchronous (approvals.ts:113-139), so within one process I found no interleaving. No concurrent run was made.

Agent usage: aba2fdc1ad025072b, claude-opus-5-5, 317,222 tokens, 96 tool uses, 15.5 min.

### Closed (the check over the full brief)

Each finding of "The check over the full brief" by heading and number, with where `agents/briefs/D20.md` closes it.

Names
1. `startArgs`'s caller in `refresh.ts:96`: by Z519 the variable rides a `Joined` field that only `startTerminal` passes, so the usage refresh's Claude starts without it and `refresh.ts` is left as it is ("What to build" 5.1; "What is on the tree", the Claude grid bullet; case 42 checks both; Decisions 7; the Z519 bullet).
2. `ShellStarter`: unchanged; `shell.ts` gains `WorktreeStarter` (`ShellStarter` with `composeAt`), which `createRepositories` takes, and `openShell` and `row-menu.ts` stay as they are ("What to build" 1.8; the worktrees bullet names `row-menu.ts:438`, :352-353, :372-373).
3. `RefKind` in `compare.ts:50`: named as a different type left as it is (the graph bullet) and listed among the hits verify 7 marks 'still true' (the last bullet of "What is on the tree"; verify 7 adds `RefKind`).
4. The `ETIMEDOUT` and "timed out" hits outside the write list (`core/git/run.ts:164-165`, `autofetch.ts:77`, `search.ts:52`, `core/git/files.ts:24`, :48): listed as staying true in the last bullet of "What is on the tree".
5. `createWorktree`'s server hits: listed there as the unchanged server function; verify 7 greps `createWorktree`.
6. Holds; the imports of `Composer.svelte` and `AttachPicker.svelte` now cite `Terminal.svelte:54` and `Composer.svelte:23`.

The step line
1. A2's line is quoted whole as the second bullet of "The plan line and the rulings", with Z126's `plan.md:580`.
2. Case 23's New half is tied to Z515 (2) and stated as owed (case 23; the Z313 bullet; "The look"; "Report").

Premises
1. The approve wire is `{action:'approve', repo, chain}` (`commands/routes.ts:49-51`, :100-104, inside `chained(options.writes, ...)`, 409 on failure); `approve-seed` runs outside the write chain, since `approveTexts` is synchronous and the terminal route's options carry no `writes` (the approvals bullet; the route options in the composer bullet; "What to build" 1.4).
2. The renderer probe loads `@xterm/xterm/lib/xterm.js` with browser shims ("What to build" 5, the cause paragraph).
3. 30 s or more (the bullet on `writes.timeout_seconds`).
4. Decisions 5 is reworded: the composer is the one start path where the reader picks a permission mode, and the update tasks' `--dangerously-skip-permissions` has its own confirmation in `UpdateTray.svelte`.
5. The ruling is named "the ruling of 2026-09-16 17:32" everywhere (`grep -c "662"` over the brief prints 0).

Cases and checks against spec.md and guarded.md
1. Each page-level case is split into its Run and Look halves (cases 1, 2, 5, 9, 10, 11, 19, 20, 23, 24 to 28a, 54, 56, 63), and the look halves are listed under "The look".
2. Case 48 calls `gh(['--version'], 2000)` of `deposit-git.ts` with a fake `gh` (`exec sleep 30`) first on PATH, and expects "The gh command did not finish within 2 seconds, so it was stopped".
3. Case 47 gives every expected line, git's own reasons as "not a git repository" and "nothing to commit, working tree clean".
4. G35, G6, G33 and G31 are named with their test files, each run alone and quoted ("Kept as tests, and the tests that run unchanged"; verify 6).
5. A tmux server a case or a test starts with `-L` or `-S` is killed after it, and the report quotes that none is left (the last bullet of "Kept as tests"; "What it must do").
6. The real-hub reads of cases 1 to 5 are read-only quoted runs and no test (the opening paragraph of "Cases").

The question (could it pass without the goal being reached)
1. Case 36's fixture holds the cross-turn blank lines, leading line feeds, blank lines inside a user turn, tool turns between said turns and first and last, and a last turn ending in white space, compared with `cmp` against the base copy's `transcriptMarkdown`; item 8.3 says the stream carries the owed line feeds into the next turn and writes the trimmed end once.
2. See Cases and checks 2 (case 48).
3. Case 40 is a quoted run over the store with a held `hubReady` promise; its drawing is seen at case 39's look.
4. Holds (cases 42 and 43).
5. The look's fallback for Z289: case 35's 600 MB file regenerated with the report's generator under the scratch server's HOME when the 634 MB log is gone ("The look", the Z289 bullet; case 35).
6. The confirmation is checked over the resolved values, on the server and in the composer ("What to build" 1.5; cases 51 and 52).
7. The starting mark is cleared on every return of `startInTab` through one `try`/`finally` ("What to build" 4.1; cases 41 and 53).
8. Holds.

Implied inputs the brief misses
1. A default carrying `confirm`: case 51 (`needs-confirm`, the confirmation asked), item 1.5.
2. A wrong `confirm` reads as true with a finding (Z519): item 1.5, cases 22 and 52.
3. The portfolio naming no hub folder: case 53, item 4.1.
4. Shell with a task: `task-needs-agent` and the composer offering Claude and Codex only (Z519): items 1.4 and 1.7, case 54.
5. Seed plus typed words over `PROMPT_MAX`: `task-too-long` (item 1.4, its sentence reworded), case 55.
6. A hook that never ends: Cancel (Z519), item 7.4, case 56.
7. Push, pull, switch and worktree add run with no limit (Z519), with the deposit's switch and push by the same rule: item 7.3, case 57.
8. `composeAt({ task })` for a task call, Claude by default and Codex offered: items 1.1, 1.2, 1.6, 1.7, case 58.
9. The reference carries the subtask's `do`, so a shifted index answers `task-unknown`: items 1.1 and 1.3, case 59; the empty `do` gives "Task: 2" in case 7a.
10. A block-style subtask resolves from the parsed list: item 1.3, case 60.
11. A funding scheme's subtask starts in the scheme's `link:` folder (Z519): item 1.3, case 61.
12. No split surrogate pair: item 1.3, case 62.
13. The saved layout keeps the reference and the seed is fetched again (Z519): item 1.6, case 63.
14. The look approves a scratch task only, removes its entry through the approvals module's own reading and writing on a copy first, never edits Axel's file by hand, ends the agent it started, and runs on a server with HOME under a scratch folder when the real file would be written ("The look", the approval bullet; case 64).

ADRs: none; the brief's opening paragraph says so.

Dictated text
1. The `server.git` sentences follow X3e's D5 rule by Z519: capitalised, no full stop, the program's word from `server.git.program_git` and `program_gh` (item 7.2; the words of item 9; cases 46, 47, 48, 50).
2. `composer.approve_detail` reads "This text comes from the hub's task. ..." (item 9).
3. `project.action.agent_tip` reads "open the composer seeded with this task, in its folder" (item 9).
4. Every detail sentence is called with (agent, label) (item 1.5; item 9).
5. Per-mode sentences in Claude's and Codex's own words for `acceptEdits`, `auto`, `bypassPermissions`, `danger-full-access` and `never`, picked by a table in `composer.ts`, with `confirm_skip_detail` for any other value; `refused_needs_confirm` says the mode asks for a confirmation at each start (items 1.5 and 9; Codex's words in the composer bullet of "What is on the tree"; Decisions 10).
6. Decisions 8 reads "drawn disabled with their reason (choice C7)".
7. Holds.

User-visible choices nothing names
1 to 7. Settled by Z519, each written into the brief: 1, `approvals-unwritable` with the path as its name (item 1.4, case 16, Decisions 11); 2, a wrong `confirm` reads as true (item 1.5); 3, a task seeds Claude or Codex only (items 1.4, 1.7); 4, the saved layout keeps the reference (item 1.6); 5, the hook-running commands with no limit (item 7.3); 6, Cancel (item 7.4); 7, a scheme's subtask in its `link:` folder (item 1.3).

Shared paths
1. X3f's DESIGN lines :305, :324, :334, :391, :395, :417, :422, :427 and HELP lines :49-50, the line inserted after :85, :102, :120, :159, :161, :167, :247 are listed, with the one-line shift of D20's HELP lines after 85 once X3f lands.
2. Holds; `refresh.ts` is named as S5's and left by D20.
3. X3e is named with its overlaps; D20 lands first and X3e is re-based on its classifier, `running.ts` and `server.git` keys (Z519).
4. D45's `server.yml:63-64` adjacency is noted, and with it D45's `routes.ts:380-520` and `:545-560`, which overlap D20's `:516-628`: whichever lands second is re-based.

Declined to judge
1. Settled by Z519: the usage refresh's Claude keeps its renderer (item 5.1).
2. Settled by Z519: the hook-running commands run with no limit and a write offers Cancel (items 7.3, 7.4).
3. Case 35 quotes the time and peak memory of the first read.
4. Item 1.4 states that `approve-seed` runs outside the write chain and why.

Agent usage of the closing: a8fd060ce54f0ef7c, claude-opus-5-5, 293,050 tokens, 87 tool uses, 19.5 min.
