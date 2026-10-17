# O41 report: motion for the actions the reader waits on, the rail's number as a sum, the clone finding that counts worktrees

Everything in the brief is done. Every behaviour only a page shows (cases 11 to 22, the rail's colour, the moving lines and the turning glyphs) is read from the code below and is for the look on landing; no page was run.

## Open items of the state file, verbatim

From `tools/oculus/.scratch/migration/orchestrator-state.md` lines 171 to 173:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

The list holds no entry.

## The cases' first run

### Cases 1 to 10 (the rail button's badge)

Command, on the base copy: `OCULUS_ROOT=<base>/tools/oculus node --no-warnings --import ./register.mjs before.ts` in the scratch folder `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/rail/` (a loader that maps `$lib/` to the tree and compiles `.svelte.ts` with Svelte's `compileModule`). `before.ts` runs the base `firstBadge` over the badges the base `RailPages.svelte` hands it (each view's badge as the base `badgeOf` builds it, an empty one left out), and prints the button's hover words with `ui.page_shortcut` and `ui.page_badge_tip` as the base `tip()` builds them. Output, `before.out`:

```
case 1: number="55" glyph="" tone=null tip="Projects, key 2 (active: 20 | idea: 35)"
case 2: number="3" glyph="" tone="violet" tip="Academic Life, key 6 (Funding 3)"
case 3: number="4" glyph="" tone="red" tip="Incoming, key 3 (Inbox 4)"
case 4: number="7" glyph="" tone="amber" tip="Incoming, key 3 (Position Leads 7)"
case 5: number="12" glyph="" tone=null tip="Explorer, key 5 (Repositories 12)"
case 5, both 0: number=null glyph=null tone=null tip="Explorer, key 5"
case 6: number="5" glyph="" tone=null tip="System (Audit 5)"
case 7: number=null glyph=null tone=null tip="Sessions, key 4"
case 8: number="55" glyph="" tone=null tip="Projects, key 2 (active: 20 | idea: 35)"
case 9: number="3" glyph="" tone=null tip="Explorer, key 5 (running: 1 | pending: 2)"
case 10 green+amber: number="1" glyph="" tone="green" tip="Academic Life, key 6 (Education & Service 1)"
case 10 with red: number="1" glyph="" tone="green" tip="Incoming, key 3 (Education & Service 1)"
case 10 no tone: number="1" glyph="" tone=null tip="Explorer, key 5 (Repositories 1)"
```

The `tone` printed is the tone the first badge carries; the base `.badge` rule (`RailPages.svelte:238-268` at the base) draws every badge in the accent whatever that tone is. Case 6 and case 7 on the base: Findings, Processes and the Session list register no badge, so they add nothing.

### Cases 11 to 22 (readings on the base)

- 11 (commit): `state.busy: string[]` keeps only that a root is busy, not which action (`repositories.svelte.ts:221-230` at the base); `Repo.svelte:383`, `RepoList.svelte:202,213,235`, `CommitBox.svelte:90,198,215` say `t('git.busy')` "Working"; nothing draws a `Progress` or a turning glyph (`grep -rn "Progress\|turning" src/lib/views/sources/repositories` at the base prints nothing).
- 12 (push from the status bar): `RepoItems.svelte:216-219` at the base draws the `behind` and `ahead` glyphs with the counts and never turns; its title is the sync words, never "Pushing...".
- 13 (push through another root): the status bar item reads nothing of the repositories store (`RepoItems.svelte` at the base has no reader of a write in flight).
- 14 (publish with two remotes): the `Menu` with the `publish` glyph is drawn whatever runs (`RepoItems.svelte:233-245` at the base).
- 15 (stage of one file): says "Working", no line (as 11).
- 16 (pull and fetch on two repositories): both say "Working"; a second send on a busy root returns at `repositories.svelte.ts:249-251` at the base, changing nothing.
- 17 (searches): `Results.svelte:130-131` and `Literature.svelte:221-222` at the base draw an `Empty` only; nothing moves.
- 18 (Submit Job): `BarActions.svelte:137` at the base `waiting={submitting}`, no `turning`, no hover words of its own; `submit.busy` is true in both phases.
- 19 (Usage refresh): `usage-refresh.svelte.ts:48-70` at the base keeps no state of a press in flight; `Usage.svelte:189-197` has no `turning`.
- 20 (update task and Run now): `UpdateTray.svelte:155-160` at the base carries no glyph; `ScheduleList.svelte:126-131` has one shared `busy` and no glyph.
- 21 (Clone): `clone.svelte.ts` at the base posts only the done line or the refusal; `ProjectCard.svelte:254-257` says "Cloning..." with no turning glyph; `CardAction` has no `turning`.
- 22 (tab closed during a push): the base has no reader of the action in flight, so nothing turns anywhere.

### Cases 23 to 31 (guarded tests)

Base copy, the two files as they stand there: `npx vitest run tests/data/sources/manifests.test.ts tests/state/sources/clone.test.ts` printed `Test Files 2 passed (2)` and `Tests 66 passed (66)`.

The new and changed rows exist only in the worktree, so their first run ran in the worktree while its `src/` was the base's (checked with `diff -rq <base>/src src`, which printed nothing), with `npx vitest run tests/data/sources/manifests tests/state/sources/clone.test.ts --reporter verbose`, saved at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/first-run.txt`: `Test Files 3 failed (3)`, `Tests 11 failed | 63 passed (74)`. The failing rows and their messages:

```
x clone.test.ts > cloning the repository of a project > opens the panel at the folder of the project, clones into the pick and asks what to do
  -> expected [ { message: 'Cloned Tool' } ] to deeply equal [ Array(2) ]
x clone.test.ts > cloning the repository of a project > opens the panel again when the server holds files back, naming them, and clones into the next pick
  -> expected [ Array(2) ] to deeply equal [ { ...(2) }, { ...(2) }, { ...(2) }, ...(1) ]
x clone.test.ts > cloning the repository of a project > says the server's sentence when it refuses for another reason, ends and is free again
  -> expected [ { ...(2) } ] to deeply equal [ { ...(2) }, { ...(2) } ]
x clone.test.ts > cloning a repository of the account > opens the panel at the home folder, clones into the pick and asks what to do   (case 31)
  -> expected [ { message: 'Cloned Tool' } ] to deeply equal [ Array(2) ]
x clone.test.ts > cloning a repository of the account > says git's sentence of a refused clone and asks nothing
  -> expected [] to deeply equal [ +0 ]
x clones.test.ts > the clones of a project > is the main checkout alone for a hub listed with two linked worktrees of its own, with no finding   (case 23)
  -> expected [ ...(3) ] to deeply equal [ Array(1) ]
x clones.test.ts > the clones of a project > is the two folders a project is cloned in when one of them has a linked worktree listed too, with the finding naming those two   (case 24)
  -> expected [ ...(3) ] to deeply equal [ ...(2) ]
x clones.test.ts > the clones of a project > is the main checkout listed after its own worktree, at the place of the worktree among the clones   (case 25)
  -> expected [ ...(3) ] to deeply equal [ ...(2) ]
x clones.test.ts > the clones of a project > is one clone for a worktree whose .git names the main checkout by another spelling of its path   (case 26)
  -> expected [ ...(2) ] to deeply equal [ Array(1) ]
x clones.test.ts > the clones of a project > is the first of two linked worktrees listed when no listed folder holds their main checkout   (case 27)
  -> expected [ ...(2) ] to deeply equal [ Array(1) ]
x manifests.test.ts > the scan and the manifest's own tier and type > reads 'two scan folders, one a linked worktr...'   (case 30)
  -> expected [ 'early' ] to deeply equal [ 'late' ]
```

Passing on that run: case 28 'is the one linked worktree listed when no listed folder holds its main checkout' and case 29 'is a submodule listed beside its parent as a clone of its own, and no folder whose .git names a git folder that is gone', and every row the base already had.

## Items

### Item 1: which git action runs

- Change: `src/lib/state/sources/repositories/repositories.svelte.ts`. `state.busy: string[]` became `state.acting: Record<root, action name>` (line 255 onward), set at the send (line 303) and cleared in its `finally` (line 323). `busy(root)` is `Object.hasOwn(state.acting, root)` (line 266), so it answers as before. New readers: `running(roots)` (line 269) answers `{ action, words }` for the first of the roots whose action says words of its own, else null; `busyWords(root)` (line 469) is the action's words or `t('git.busy')`. The words are `RUNNING_WORDS` (line 60), one literal `t('git.running_*')` read per action, so the orphan-key check finds each key. `git.running_*` keys added beside `busy` in `config/text/views/sessions/changes.yml` (lines 15 to 26), the words of Decision 1. A refused send (root busy) returns at line 302 before `acting` is touched. The state is the page's store only, so a reload holds none and a closed tab leaves it to the other places.
- A repository's roots together: new selector `repositoryRoots(root)` in `src/lib/state/client/selectors.svelte.ts:651`, the roots of the `repositories('all')` group holding the root (the roots with one `GitState.top`), else the root alone. Views pass `repositories.running(selectors.repositoryRoots(root))`.
- Before: base keeps no action (case 11 reading). After: read above; the runs of case 11 to 16 are at the look.
- Look: start a commit on a repository with hooks that take a few seconds; while it runs, every place below says "Committing...".

### Item 2: the Source Control view and the repository's row

- `Repo.svelte` was at 517 lines and grows, so it is split by concern: the view moved into `src/lib/views/sources/repositories/repo/Repo.svelte` (471 lines) and its foot message line into `repo/RepoMessage.svelte` (102 lines), a folder of its own because `repositories/` already held 10 items. `Repositories.svelte:84` imports `./repo/Repo.svelte`; the head comments that named `views/sources/repositories/Repo.svelte` (`graph/Graph.svelte:2`, `refs/Tags.svelte:2`, `refs/Branches.svelte:2`, `refs/Stashes.svelte:2`, `refs/section.ts:2`, `Repositories.svelte:32,504`) name the new path.
- The moving line: `repo/Repo.svelte:252-258`, a `Progress percent={null}` named and titled with `running.words`, in a zero-height block at the section's top whose line sits in the 6px gap under the repository's row, so no row moves when it shows (rules `.running` and `.bar`).
- The busy line says `repositories.busyWords(root)` (`repo/RepoMessage.svelte:29`); Cancel is unchanged.
- The row: `RepoList.svelte:173` reads `running` for the row's repository and draws a `Progress` along the row's foot (`RepoList.svelte:278-282`, absolute in the row, `pointer-events: none`); the Branch, Sync and Publish titles say `words` while the row's root is busy (`RepoList.svelte:206`).
- `CommitBox.svelte:90,198,215` only: `repositories.busyWords(root)` in place of `t('git.busy')`; no line drawn there. `changes/FolderRow.svelte:86,99,111` and `graph/GraphActions.svelte:57,67,76,86`: the same.
- Outside the brief's list: the Session view's Changes panel said "Working" beside the same commit box (`session-detail/ChangesRepo.svelte:96` at the base; the brief's grep left it out). `ChangesRepo.svelte` takes a new prop `busyWords` (line 27, drawn at line 99) and `ChangesRepository.svelte:167` passes `repositories.busyWords(workspace)`, so the panel and its commit box say the same words.
- An action outside Decision 1 (stage, discard, a tag) has no `RUNNING_WORDS` entry: `running` answers null (no line) and `busyWords` answers "Working".
- Look: Repositories view, a repository with an upstream; press Push and confirm: a moving line under the row of the repository and along the row's foot, "Pushing..." on the foot message line beside Cancel, the commit box's buttons titled "Pushing..."; Stage on a file: "Working" and no line. With the system's reduce-motion on, the lines are drawn whole at half opacity and still (`Progress.svelte` rule).

### Item 3: the status bar's git item

- `StatusGit` gains `running: (root) => RunningAction | null` (`src/lib/state/workbench/navigation/status.ts`, the type imported from the repositories store; `NO_GIT.running` answers null). `src/routes/+page.svelte:241` implements it as `repositories.running(repositoryRoots(root))`. The shell reads no store of its own for it.
- `src/lib/shell/status/RepoItems.svelte`: `syncing` (lines 118 to 124) is the running action when it is push, pull, fetch, sync or publish. The sync item draws `<Glyph name="sync" turning />` before the two counts in place of the `behind` and `ahead` glyphs, the counts kept, its title the action's words (lines 214 to 234). While publish runs, the Publish item, for one remote or several, is one status `ToolButton` with the `sync` glyph turning, the words as its title, `inert` (lines 236 to 247); after the answer the item is drawn as before.
- Files outside the write list: `status.ts` and `+page.svelte`, since the shell may not read the repositories store.
- Look: cases 12 to 14 and 22: push from the status bar's sync item (glyph turns, hover "Pushing..."); push from the Repositories view on a root whose repository the status bar follows through another root (turns too); Publish on a branch with two remotes (one turning button "Publishing the branch...", the menu back after the answer); close the Source Control tab while a push runs (the item keeps turning).

### Item 4: Clone

- `src/lib/state/sources/clone/clone.svelte.ts`: `notices` is `Pick<NoticeSink, 'post' | 'remove'>`; new `sent(words, body)` (line 108) posts `words` with `progress: { percent: null, cancel: null }`, awaits the clone post and removes the notice in `finally` (line 113); both clones send through it with `t('app.clone.running', title)` and `t('app.clone.running', repo.name)` (lines 124 and 152), then post the done line or the refusal as before. Removing a notice the reader already cleared is a filter that matches nothing (`notices.svelte.ts:127`), and the store never posts the running notice again. `app.clone.running: Cloning {0}...` added to `config/text/app.yml` line 15. `context.ts` is unchanged (it hands the whole sink).
- `CardAction` gains `turning?: boolean` (`src/lib/views/shared/card/CardActions.svelte:13`), passed to the row's `ToolButton` (line 169) and to the More menu's item (line 191). The menu item needed it too: `MenuItem` gains `turning?: boolean` (`src/lib/ui/menu/menu-items.ts`) and `MenuList.svelte:82` passes it to the item's `Glyph`; both files are outside the write list. `ProjectCard.svelte:257` sets `turning: cloning(item.id)`.
- G80 test (`tests/state/sources/clone.test.ts`): the fake sink records `{ message, tone?, moving? }` (moving when `progress.percent` is null), `post` answers its index and `remove` records the id. No title changed. Rows whose assertions changed (titles as they stand, unchanged): 'opens the panel at the folder of the project, clones into the pick and asks what to do'; 'opens the panel again when the server holds files back, naming them, and clones into the next pick'; "says the server's sentence when it refuses for another reason, ends and is free again"; 'opens the panel at the home folder, clones into the pick and asks what to do' (case 31); "says git's sentence of a refused clone and asks nothing". Each now asserts the running notice with its moving line, its removal, and the done line or refusal.
- Look: case 21: Clone on a project card: a notice "Cloning <title>..." with a moving line until the answer, then "Cloned <title>"; the Clone control's glyph turns in the row and in More. `:clone` of a repository: "Cloning <name>...". Dismiss the running notice: it does not come back, the done line still comes.

### Item 5: the searches

- `src/lib/views/sources/search/Results.svelte:133-137`: while `running`, a `Progress percent={null}` named `t('search.running')` above the Empty, which stays. `Search.svelte` is unchanged (the brief preferred `Results.svelte`).
- `src/lib/views/feeds/literature/Literature.svelte:205-209`: while `run.running()`, a `Progress` named `t('literature.searching')` at the top of the results, above the papers already answered; the Empty at line 230 stays.
- Look: case 17: a search in the Search view and one in the Literature search each draw a moving line until their answer.

### Item 6: Submit Job

- `src/lib/views/sources/source/actions/submit-job.svelte.ts`: `busy` became `running: string` (the type member and the getter): `t('source.submit_planning')` from the press until the plan question or a refusal (line 115, cleared at line 129), `t('source.submit_running')` from the yes until the outcome (line 98, cleared at line 109), the empty string otherwise. `submit_planning: Preparing the job...` added beside `submit_running` in `config/text/views/sources/source.yml`. `Source.svelte:452` passes `submitting={submit.running}` (the one line). `BarActions.svelte:51` types `submitting: string`; the button (lines 139 to 145) takes `title`, `turning` and `waiting` from it.
- Look: case 18: a `.slurm` file: the glyph turns with hover "Preparing the job..." until the plan question, is still while it is open, and turns with "Copying the code and submitting the job..." from the yes until the outcome.

### Item 7: a Usage refresh

- `src/lib/state/system/machine/usage/usage-refresh.svelte.ts`: a count per account of presses waiting for their answer (`hold`, line 53; in at line 67, out in the `finally` at line 81); `refreshing(label)` (line 94). `Usage.svelte:199` passes `turning={refreshing(account.label)}`. The refresher's cadence goes through no press and holds nothing.
- Look: case 19: Refresh on a Claude account card turns its glyph until that press answers; the other account's cadence refresh turns nothing.

### Item 8: an update task or a scheduled run started by hand

- `src/lib/shell/rail/UpdateTray.svelte:160-161`: the task button takes `glyph="sync"` and `turning` while `running === task.kind`, no glyph at rest; `running` clears when `startTask` answers (lines 84 to 94), before the terminal is shown or the refusal said.
- `src/lib/shell/rail/ScheduleList.svelte`: `starting` (line 35) holds the key of the row whose Run now was pressed, set and cleared around the press by `runNow` (lines 50 to 58); that row's Run now draws `glyph="sync"` turning and is not compact while it starts (lines 142 to 144), so its words show beside the glyph. The shared `busy` disables the other controls as before.
- Look: case 20: press an update task: its button draws the turning sync glyph until the terminal is shown or the refusal said; Run now on one schedule row: only that row's Run now turns.

### Item 9: what a view gives the rail

- `Registration.railPart?: (state: BadgeClient) => RailPart` in `src/lib/state/workbench/navigation/registry.ts` beside the badge hooks; `RailPart = { count: number; tone?: string }` in `rail-badges.svelte.ts`. `BadgeClient` gains `processes: Pick<ProcessesStore, 'count'>` and the rail badges' new count members. No tab's drawing changes except item 11's three new counts.

### Item 10: which views give what

- Rail-badges store (`src/lib/state/workbench/rail-badges/rail-badges.svelte.ts`) answers numbers from the same state the tabs read: `boardPart(view, cell)` (the cell of `boardCells(view)` with that label, its count and colour), `collectionCount`, `inboxCount`, `applicationsCount`, `auditCount`, `problemsCount`, `repositoriesCount`, `findingsCount`, `sessionInputCount`; the badge words of the tabs are built on them (`applicationsBadge`, `repositoriesBadge`, `collectionBadge` now format these counts).
- Registrations: `Projects.svelte` `RAIL_CELLS` gives Projects `active`, Coauthor `in progress`, Personal `building`; Archive and Software no hook. `Collection.svelte` spreads `collectionRailPart(id)` from the new `src/lib/views/boards/collection/rail-part.ts` (Applications its active count, green; Funding, Education, Joint Work and Tasks their `nav_live` count with `collectionBadgeTone`; others nothing); the hook lives in its own file because `Collection.svelte` would otherwise reach 524 lines. `Inbox.svelte` (red), `Repositories.svelte`, `Problems.svelte`, `Audit.svelte`, `Findings.svelte`, `SessionList.svelte` (no tone) give their counts. Leads, Processes, Calendar, Hpc, LinkedIn and apps give none.

### Item 11: three new tab counts

- Findings: `badge` and `railPart` from `railBadges.findingsCount()`, which is `findingsCount(entities.portfolio(), entities.config(), entities.apps())` of `status.ts`, the count the status bar's item reads (`+page.svelte:213` passes `{ findings: appFindings() }`, which is `entities.apps()?.findings`, the same list).
- Session list: `sessionInputCount()`: the session rows of `entities.sessions().workspaces` (`sessionRows` of `folds.ts`) with `needsInput(row) && !row.hidden`, each id once. `hidden` is the list's archived mark (`SessionList.svelte:142-143`). A list limited to a folder carries the same count (Decision 6).
- Processes: new `count()` in `src/lib/state/system/machine/processes/processes.svelte.ts` (outside the write list): 0 before the first read and for a read with no rows; otherwise each group's pane process when its pid is above 0 (the row `ProcessTable.svelte:88` draws), the group's other rows and the matched rows, the rows of the last good read included after a failed one. `Processes.svelte` registers `badge` only.
- Zero draws nothing: each badge is `countText(...)`, empty at 0.

### Item 12: the rail button's number, hover words and tone

- `firstBadge` is replaced by `railBadge(views)` in `src/lib/shell/rail/rail.ts`: `RailView = { label, part, badge }`, the part's type read from `Registration['railPart']` (the shell may not import the rail-badges store, `tests/checks/tree/boundaries.test.ts`). Sum of the parts above 0; hover words each part as `t('views.badge_title', label, count)` joined by `t('ui.page_badge_separator')` (new key `', '` beside `page_badge_tip` in `config/text/ui.yml`); tone by `urgentTone`: red, amber, green, then the first other tone, else none. A sum of 0: the first view whose badge is a mark and no count, with its own title and tone; else null. `RailPages.svelte` `badgeFor` builds the views from `railPageViews` (each view once) with `registrationLabel`, `railPart` and `badgeOf`, and calls it.
- After, command `OCULUS_ROOT=<worktree>/tools/oculus node --no-warnings --import ./register.mjs after.ts` in the same scratch folder (`after.ts` runs `railBadge` over the same pages; the collection parts come from `collectionRailPart`; case 6's findings and processes counts and case 7's count come from the stores, `createRailBadges(...).findingsCount()`, `createProcesses(...).count()` and `sessionInputCount()`, over fake payloads), run twice with the same output (`after.out`, `after2.out`):

```
case 1: number="25" glyph="" tone="green" tip="Projects, key 2 (Projects 20, Coauthor 2, Personal 3)"
case 2: number="10" glyph="" tone="green" tip="Academic Life, key 6 (Funding 3, Education & Service 1, Applications 2, Joint work 4)"
case 3: number="4" glyph="" tone="red" tip="Incoming, key 3 (Inbox 4)"
case 4: number="" glyph="bang" tone="red" tip="Incoming, key 3 (LinkedIn post overdue)"
case 5: number="15" glyph="" tone=null tip="Explorer, key 5 (Repositories 12, Problems 3)"
case 5, both 0: number=null glyph=null tone=null tip="Explorer, key 5"
case 6 counts: findingsCount=9 processes.count=4
case 6: number="14" glyph="" tone=null tip="System (Findings 9, Audit 5)"
case 7 count: sessionInputCount=1
case 7: number="1" glyph="" tone=null tip="Sessions, key 4 (Sessions 1)"
case 8: number="20" glyph="" tone="green" tip="Projects, key 2 (Projects 20)"
case 9: number=null glyph=null tone=null tip="Explorer, key 5"
case 10 green+amber: number="3" glyph="" tone="amber" tip="Academic Life, key 6 (Education & Service 1, Tasks 2)"
case 10 with red: number="4" glyph="" tone="red" tip="Incoming, key 3 (Education & Service 1, Tasks 2, Inbox 1)"
case 10 no tone: number="2" glyph="" tone=null tip="Explorer, key 5 (Repositories 1, Problems 1)"
```

- Case 8 is one entry because `railPageViews` (`pages.ts:224-229`) gives each view once; the run shows the function counts the entry it is handed once.
- What the runs do not cover: the parts of Projects, Coauthor, Personal, Inbox, Repositories, Problems and Audit are written into the harness by the registration's rule, not read from the registrations, which live in `.svelte` modules the harness does not compile.

### Item 13: the badge's colour

- `RailPages.svelte`: the badge takes `style={badgeStyle(badge.tone)}`, `--rail-badge-bg: var(--c-<tone>); --rail-badge-fg: var(--on-c-<tone>)`, and the `.badge` rule draws `background: var(--rail-badge-bg, var(--accent)); color: var(--rail-badge-fg, var(--on-accent))`, the token pair `TabFace.svelte:86` uses. The rule's comment, the head comment of `RailPages.svelte` and of `rail.ts` say what is drawn.
- Look: Projects page with active projects: a green badge with the sum; Incoming with unread inbox threads: red; Explorer: accent; hover each to read the parts.

### Item 14: readers of the git folder

- `src/lib/data/sources/origin.ts`: `GitFolder = { real, main }` and `gitFolderOf(dir)` (line 59): `gitConfigDir(dir)` (after `gitdir:` and `commondir`) resolved with `realpathSync`, `main` when that folder is `<dir>/.git`; null when there is no `.git` or the folder it names is gone. File reads only.

### Item 15: clones counted by their git folder

- `repositoryStandIns(folders)` (`origin.ts:75`): for each folder, the index of the main checkout among the folders with the same real git folder, else the first of them; a folder with none stands for itself. `listedClones` in `src/lib/data/sources/clones.ts:25` emits each group once, at its first member's place, naming the stand-in; `placeClones` reads it. A submodule's git folder is its own (`.git/modules/x`, no `commondir`), so it stays a repository of its own; a gone git folder gives null and stands for itself, read as before (no origin).
- G32 rows (in `tests/data/sources/manifests/clones.test.ts`, describe 'the clones of a project'), new: 'is the main checkout alone for a hub listed with two linked worktrees of its own, with no finding' (23); 'is the two folders a project is cloned in when one of them has a linked worktree listed too, with the finding naming those two' (24); 'is the main checkout listed after its own worktree, at the place of the worktree among the clones' (25); 'is one clone for a worktree whose .git names the main checkout by another spelling of its path' (26); 'is the first of two linked worktrees listed when no listed folder holds their main checkout' (27); 'is the one linked worktree listed when no listed folder holds its main checkout' (28); 'is a submodule listed beside its parent as a clone of its own, and no folder whose .git names a git folder that is gone' (29). Existing row 'lists two clones in the order the repositories are listed, with one finding on the project naming both' keeps its title; its finding assertion is written through the file's helper `urlFindings(snapshot)` and `clonedTwice(...dirs)`, the same value.
- G32's test file is moved and split: `tests/data/sources/manifests.test.ts` (831 lines at the base, and `tests/data/sources/` held 10 items) became the folder `tests/data/sources/manifests/` with `manifests.test.ts` (748 lines, the base rows and case 30) and `clones.test.ts` (240 lines, the describes 'the address of a repository', 'the origin of a folder' and 'the clones of a project', moved whole from the base lines 721 to 831). `agents/guarded.md`'s G32 entry names the old path; the orchestrator changes it at landing.

### Item 16: every other reader of the repositories list

- `settle` in `src/lib/data/sources/manifests.ts` (lines 285 to 320): changed. A scanned folder that is a linked worktree of another scanned folder's repository was read as a project of its own, or left out as a clone of the first found (case 30 failed: `expected [ 'early' ] to deeply equal [ 'late' ]`). Now `standIns` (line 302) groups the scanned folders by git folder: only the stand-in (the main checkout when scanned) is read (line 317), and `cloneOf` skips folders of the same repository (line 307). Case 30 row in describe "the scan and the manifest's own tier and type", table entry at `manifests/manifests.test.ts:488`: name 'two scan folders, one a linked worktree of the repository of the other, as one project read from the main checkout'.
- The search route (`src/routes/api/(files)/search/+server.ts:22`, `handleSearch` in `src/lib/server/files/search/search-routes.ts:43-44,73`): each listed repository is searched with its own ignore rules; a linked worktree is a checkout with files of its own, so searching it under its own rules is right. No change.
- `src/lib/server/git/clone/exclude.ts`: a worktree inside a hub is a folder the hub's git would record as an embedded repository, so its exclude line is right. No change.
- `src/lib/server/root/watch/repos/nested.ts`: lists every folder holding a `.git`; the miscount was in `placeClones` reading that list, now fixed there. No change.
- Autofetch (`src/lib/server/root/watch/autofetch.ts:177-192`): groups the roots by `worktrees[0].path`, one fetch per repository. No change.
- The Repositories list, the status bar's item and the Repositories count on its tab and in the rail follow `repositoryGroups` (`src/lib/state/sources/repositories/repositories.ts:505-545`), which drops a linked worktree of a listed repository (DESIGN.md "One Repositories list"). No change.
- `context.ts:402,594`: hand the list to the search route and the clone finding; nothing of their own to change.

### Item 17: docs

- `HELP.md`: the rail sentence (line 41) says the sum, the views that give a count, the tooltip, the tone order and the mark; the Source Control section gains one bullet after the Cancel sentence on the moving line, the words and the status bar's glyph; "Searching the files" gains one bullet on the moving line in both searches; the Live HPC bullet says Submit Job's glyph turns in both phases; the Usage bullet says Refresh turns; the update tray bullet says a pressed task and Run now turn.
- `DESIGN.md`: the Shell paragraph (line 179) states the rail's sum and tone; a new paragraph after the `Registration` paragraph (line 338) states `railPart`, the sum and which views give a part; the Clone bullet states the rule of item 15 and `settle`; the "One Repositories list" bullet says the clone finding follows the worktree rule.
- `npm run diagrams` rewrote `docs/diagrams/channels.dot` and `.svg` (the rail-badges store now reads the `apps`, `config` and `sessions` channels: three new edges `"ch apps"`, `"ch config"`, `"ch sessions"` `-> "state/workbench/rail-badges/rail-badges"`), and also `layer-state`, `layer-views` and `layers` (`.dot` and `.svg`), where only the import counts and positions changed (for example `"views to state"` 1275 to 1280). Those three pairs are outside the write list; they are what the command writes after the new imports.

## DONE / NOT DONE

| Check | Command | Output | State |
| --- | --- | --- | --- |
| Diagrams | `npm run diagrams` | exit 0, run twice (after the last change the second time) | DONE |
| Quick tier | `npm run test:quick -- <the 67 changed paths>` | run twice; second run: `ok ASCII gate`, `ok prettier`, `ok svelte-kit sync`, `ok svelte-check (6.1 s): ... 514 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok eslint (19.5 s)`, `ok vitest (29.6 s)`, `test:quick: 31.6 s (limit 45.0 s); every command passed` | DONE |
| ASCII gate | the spec's perl form over the 67 touched files | printed nothing | DONE |
| Sizes | `wc -l` over the touched files | largest component `Source.svelte` 517, `Repositories.svelte` 517, `ProjectCard.svelte` 518, `Graph.svelte` 519 (519 at the base); largest source `selectors.svelte.ts` 734; tests `manifests.test.ts` 748 | DONE |
| Guarded tests, base | `npx vitest run tests/data/sources/manifests.test.ts tests/state/sources/clone.test.ts` in the base copy | `Test Files 2 passed (2)`, `Tests 66 passed (66)` | DONE |
| Guarded tests, first run | as above in the worktree, src identical to the base | `Tests 11 failed / 63 passed (74)`; failing: cases 23 to 27, 30, 31 and the four other changed G80 rows | DONE |
| Guarded tests, after | `npx vitest run tests/data/sources/manifests tests/state/sources/clone.test.ts --reporter verbose` | `Test Files 3 passed (3)`, `Tests 74 passed (74)` | DONE |
| Cases 1 to 10 | `before.ts` on the base, `after.ts` on the worktree | quoted above | DONE |
| Unused exports | `sh utils/unused-exports.sh` against the base's `unused-exports.txt` | one difference: `needsInput` left the list of `folds.ts` (it now has an importer); no new unused export | DONE |
| Tree checks touched by this step | `npx vitest run tests/checks/source/keys.test.ts tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/tree/duplication.test.ts tests/checks/imports/cycles.test.ts tests/checks/imports/order.test.ts tests/checks/diagrams/diagrams.test.ts` | after the last change: `Test Files 9 passed (9)`, `Tests 120 passed (120)` | DONE |

The first quick run was 75.6 s (over its 45 s limit, every command passed); the tree checks' first run failed `boundaries.test.ts` on `shell/rail/rail.ts imports state/workbench/rail-badges/rail-badges.svelte`, which the shape now read through `Registration['railPart']` ends; the second runs above are after that change. What the quick tier does not cover, as it prints: tests outside the selection, the rest of tests/checks, the slow tests, the build and the lint of unchanged files.

## Files, from `diff -rq` against the base copy

Changed (line count now):

```
DESIGN.md 761 | HELP.md 505
config/text/app.yml 321 | config/text/ui.yml 155 | config/text/views/sessions/changes.yml 116 | config/text/views/sources/source.yml 230
docs/diagrams/channels.dot, channels.svg, layer-state.dot, layer-state.svg, layer-views.dot, layer-views.svg, layers.dot, layers.svg (written by npm run diagrams)
src/lib/data/sources/clones.ts 76 | manifests.ts 450 | origin.ts 126
src/lib/shell/rail/rail.ts 159 | RailPages.svelte 309 | ScheduleList.svelte 237 | UpdateTray.svelte 281
src/lib/shell/status/RepoItems.svelte 286
src/lib/state/client/selectors.svelte.ts 734
src/lib/state/sources/clone/clone.svelte.ts 174
src/lib/state/sources/repositories/repositories.svelte.ts 623
src/lib/state/system/machine/processes/processes.svelte.ts 88
src/lib/state/system/machine/usage/usage-refresh.svelte.ts 97
src/lib/state/workbench/navigation/registry.ts 267 | status.ts 602
src/lib/state/workbench/rail-badges/rail-badges.svelte.ts 360
src/lib/ui/menu/menu-items.ts 176 | MenuList.svelte 384
src/lib/views/boards/collection/Collection.svelte 506
src/lib/views/boards/projects/Projects.svelte 406
src/lib/views/feeds/inbox/Inbox.svelte 276 | literature/Literature.svelte 294
src/lib/views/sessions/session-detail/ChangesRepo.svelte 166 | ChangesRepository.svelte 216
src/lib/views/sessions/session-list/SessionList.svelte 387
src/lib/views/shared/card/CardActions.svelte 224 | project/ProjectCard.svelte 518
src/lib/views/shared/changes/CommitBox.svelte 316
src/lib/views/sources/repositories/RepoList.svelte 323 | Repositories.svelte 517
src/lib/views/sources/repositories/changes/FolderRow.svelte 123
src/lib/views/sources/repositories/graph/Graph.svelte 519 | GraphActions.svelte 97
src/lib/views/sources/repositories/refs/Branches.svelte 153 | Stashes.svelte 100 | Tags.svelte 84 | section.ts 15
src/lib/views/sources/search/Problems.svelte 447 | Results.svelte 338
src/lib/views/sources/source/Source.svelte 517 | actions/BarActions.svelte 160 | actions/submit-job.svelte.ts 149
src/lib/views/system/audit/Audit.svelte 347 | findings/Findings.svelte 126
src/lib/views/system/machine/processes/Processes.svelte 128 | usage/Usage.svelte 374
src/routes/+page.svelte 330
tests/state/sources/clone.test.ts 244
```

New: `src/lib/views/boards/collection/rail-part.ts` 25, `src/lib/views/sources/repositories/repo/Repo.svelte` 471 (moved from `repositories/Repo.svelte`), `repo/RepoMessage.svelte` 102, `tests/data/sources/manifests/manifests.test.ts` 748 (moved from `tests/data/sources/manifests.test.ts`), `tests/data/sources/manifests/clones.test.ts` 240.

Removed at their old place: `src/lib/views/sources/repositories/Repo.svelte`, `tests/data/sources/manifests.test.ts` (both moved with `mv`).

Outside the write list, with the item and the reason: `src/lib/state/workbench/navigation/status.ts` and `src/routes/+page.svelte` (item 3, the shell reads the action through the page); `src/lib/ui/menu/menu-items.ts` and `MenuList.svelte` (item 4, the More menu's Clone entry turns); `src/lib/views/sessions/session-detail/ChangesRepo.svelte` and `ChangesRepository.svelte` (item 2, the Session view's Changes panel said "Working" beside the shared commit box); `src/lib/state/system/machine/processes/processes.svelte.ts` (item 11, the Processes count); `src/lib/views/sources/repositories/Repositories.svelte` import line and the head comments of `graph/Graph.svelte`, `refs/Branches.svelte`, `refs/Stashes.svelte`, `refs/Tags.svelte`, `refs/section.ts` (the split of `Repo.svelte`; `Repositories.svelte` is in the list for its registration); `src/lib/views/boards/collection/rail-part.ts` (item 10, a split so `Collection.svelte` stays under 520); the `docs/diagrams` layer files (item 17, what `npm run diagrams` writes). Of the six files shared with O40: `Search.svelte` and `context.ts` unchanged; `CommitBox.svelte` lines 90, 198, 215 only; `submit-job.svelte.ts` (item 6); `config/text/ui.yml` one key beside `page_badge_tip`; `HELP.md` and `DESIGN.md` the sentences listed under item 17.

## Judgment calls the brief left open

- The collections that give the rail a part are the four the brief names, as a list in `rail-part.ts`, and not every collection with a `nav_live` rule. On the shipped `config/layout.yml` (lines 281 to 285) the two are the same four; a hub adding a `nav_live` rule for another collection gets a tab count and no rail part. Choosing the rule-based form would be a config key that silently changes the rail, which the brief's list rules out.
- The moving line of the Source Control view lies in the gap between the repository's row and the view's first control, taking no room, so the view's rows do not move when it shows; "under its header" is read as under the repository's row, the view's head since the row carries the branch and path.
- The row's moving line takes no pointer, so its hover words are the controls' titles ("Pushing..." on Branch, Sync, Publish while the row's root runs the action); a row whose action runs through another root of the repository shows the line and keeps its controls' own titles, since those controls are disabled only for their own root, as before.
- While publish runs, the status bar's Publish button is `inert` (takes no press, drawn at full strength), as a status item that runs no command is drawn; the sync item stays pressable while its action runs, as before, and a second send on the busy root is refused by the store.
- The Processes count leaves out a group's pane process when the table draws no row for it (pid 0, `ProcessTable.svelte:88`), and counts nothing while the read has no rows (the table is not drawn, `Processes.svelte:83`). App hosts above the table are not counted: they come from another channel.
- The Session list's count counts each session id once, in case a session is filed under two areas.
- The Run now that starts turns and shows its words (it drops `compact` while it starts), since a compact `ToolButton` with a glyph draws the glyph alone.
- The Clone sentence of `HELP.md` (line 496) is left as it is: item 17 does not name it, and the brief keeps the changes to `HELP.md`, which O40 shares, to the sentences it names. It says nothing of the running notice. The sentence to add at landing, if the orchestrator wants HELP to describe it: "While it runs, a notice with a moving line says the clone is running."

## User-visible changes, before and after

- Rail button badge: before, the count of the first counting view in the accent; after, the sum of the parts in the most urgent tone, the tooltip naming each part, a mark only when the sum is 0 (cases 1 to 10 above).
- Findings, Session list and Processes tabs: before, no count; after, a count (zero draws nothing).
- Source Control view, Repositories row, commit box, folder rows, graph actions, Session view's Changes panel: before, "Working" for every write, nothing moves; after, the action's words for the actions of Decision 1 and a moving line in the view and along the row.
- Status bar sync item: before, behind and ahead glyphs always; after, a turning sync glyph and the action's words while push, pull, fetch, sync or publish runs; Publish item: one turning button while publish runs.
- Clone: before, a done line or a refusal only; after, a running notice with a moving line from the pick to the answer, and the card's Clone glyph turns.
- Search view and Literature search: before, an Empty while running; after, a moving line above it.
- Submit Job: before, disabled while busy; after, its glyph turns with "Preparing the job..." and then "Copying the code and submitting the job...".
- Usage Refresh: before, nothing while the press runs; after, the glyph turns until the answer.
- Update tray task button and Run now: before, no glyph; after, a turning sync glyph until the start is answered.
- Clone finding: before, a hub listed with its own worktrees was "cloned" in three folders and raised `cloned_twice`; after, the hub alone and no finding. The scan: a project folder that is a linked worktree of another scanned folder's repository is one project, read from the main checkout.

## Anything in the brief that was wrong or impossible

- FolderRow's path: the brief names `src/lib/views/shared/changes/FolderRow.svelte`; the file is `src/lib/views/sources/repositories/changes/FolderRow.svelte` (`find src -name FolderRow.svelte`).
- The brief's grep of `git.busy` readers left out `src/lib/views/sessions/session-detail/ChangesRepo.svelte:96` (`grep -rn "git\.busy" src` at the base lists it); it is changed (item 2).
- `Repo.svelte` could not grow in its folder: it was at 517 lines and `views/sources/repositories/` held 10 items (`ls src/lib/views/sources/repositories | wc -l` printed 10), so the split needed a folder; it is `repo/`.
- G32's test file could not take the new rows in place: 831 lines at the base and its folder at 10 items; it is split into `tests/data/sources/manifests/` as above, and `agents/guarded.md`'s G32 path needs the orchestrator's change at landing. The brief's verify command `npx vitest run tests/data/sources/manifests.test.ts ...` therefore ran as `tests/data/sources/manifests` in the worktree.
- The first run of the new and changed guarded rows could not run in the base copy, which does not hold them; it ran in the worktree with `src/` identical to the base, as stated above.

## How many times the verify list ran

Twice: `npm run test:quick` twice, `npm run diagrams` twice and the targeted tree checks twice, the second run of each after the last change. The guarded tests ran once more while this report was written (`npx vitest run tests/data/sources/manifests tests/state/sources/clone.test.ts`: `Test Files 3 passed (3)`, `Tests 74 passed (74)`), and `diff after.out after2.out` printed nothing.
