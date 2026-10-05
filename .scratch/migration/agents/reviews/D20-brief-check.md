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
