# Brief check of O123

**Verdict: the brief is not ready to dispatch.** Six findings stop it from landing as written (B1 to B6). Fourteen more are changes to the brief (C1 to C14). Three need a choice by the user (U1 to U3). I changed no file and ran no test or page.

Main moved during the check from 9fdbbb4ec to 36808fc74. `git diff --stat 9fdbbb4ec HEAD` shows only `.scratch` files, so the brief's tree premises stand. Rulings 633, 634 and 635 are open items in `plan.md`, at lines 3443 to 3445 of the file. 633 and 634 are about O121 and O122. Only 635 binds this step.

## Findings that need a choice by the user

**U1. A pinned Terminal tab does not stand when its last terminal ends (a premise found wrong).** The case says "as a pinned tab does now".
- `closeEnded` in `src/lib/state/sessions/terminal/terminal-lists.ts:96` runs `if (left && transcript === null && !held.composing) workbench.close(...)`.
- `grep -n pinned` over `terminal-lists.ts`, `terminal-host.ts` and `terminals.svelte.ts` prints nothing (exit 1). `closeInstance` (`tabs/instances.ts:313`) reads no pin.
- `tests/state/sessions/terminal/reading-tab.test.ts`, row 'on Live closes', asserts the close.
- `moveInto` closes the tab the same way, so Open in its own pane can close it too.
- The cost: the bottom pane loses Terminal. The next press has no sibling, so `workbench.open` lands in the active pane, which is the left pane, over the list.

Options:
- (a) A pinned Terminal tab stands on every page and shows its composer. This takes `terminal-lists.ts`, `workbench-shape.ts`, `terminal-host.ts` (the tab shape has no `pinned`) and a row of `reading-tab.test.ts`. Recommended: it is the only option that keeps the line's "bottom pane holding Terminal" true. It does change pinned Terminal tabs on every page.
- (b) The tab closes, and a new one is sent to the pane that held it. This adds a placement rule for one view.
- (c) Rewrite the case to accept the close. This is the lazy option: the next press covers the list.

**U2. Twelve entries in a chord that reaches nine.** `keyOf` (`navigation/catalogue.ts:247-255`) gives no key past the ninth.
- Today: s1 Files, s2 Repositories, s3 Search, s4 References, s5 Notes Graph, s6 LaTeX, s7 Debug, s8 Debug Console, s9 Problems; m1 Sessions, m2 Terminal, m3 Session.
- With item 5: s1 Files, s2 Repositories, s3 Sessions, s4 Search, s5 LaTeX, s6 Terminal, s7 Problems, s8 References, s9 Debug. Debug Console, Notes Graph and Session have no key, and seven keys move.
- Decision 5 does not say this.

Options:
- (a) Keep the order, with Session placed after Notes Graph, and name the three keys lost in the decision. Recommended.
- (b) Reorder which three lose a key.
- (c) Digits past nine. This is a new key shape beyond the line.

**U3. A requirement beyond the line: item 8's status bar sentence and its case.** The line says nothing of the status bar.
- `openView('session-list')` (`StatusBar.svelte:359`) and `layout.openView('problems')` (`context.ts:303`) open on the page in front. Neither view is `unique`, so from Focus they open a new tab on Focus, as they do now.
- If "on the Explorer" means going to that page, `context.ts` and a page switch must join the paths.

Recommendation: read the case as "while on the Explorer", with no code change. Going to the Explorer is the larger job and is not in ruling 635.

Other items beyond the line, each following from it: item 7, the group order of item 5, and decision 1. None needs a ruling unless the orchestrator wants one.

## Changes to the brief that stop it landing (B)

**B1. `SessionSections.svelte` cannot live in `session-detail/`.**
- `tests/checks/tree/boundaries.test.ts:28-36` makes each `views/<group>/<name>/` private, with `views/shared/**` open to every view. `session-list/` importing from `session-detail/` is a violation.
- `git ls-files src/lib/views/sessions/session-detail | wc -l` prints 10, so the new file is the eleventh item against `spec.md:49`.
- The file and its parts need a shared home: for example `src/lib/views/shared/sessions/sections/`, holding `SessionSections`, `SessionSection`, `session-sections.ts`, `AgentRows`, `ChangesRepo`, `ChangesRepository`, `ChangesTouched`, `DetailsBody`, `SharedMark`, `TimelineTurns`.
- `git ls-files src/lib/views/shared/sessions | wc -l` prints 8, so they need the subfolder.
- All of these join the write list. Nothing outside the folder imports them (the cross-view grep over `src/lib/views` prints nothing).

**B2. `NotesGraph.svelte` is not on the write list.** Its `order: 4` must follow the Debug Console (`order: 7`) under item 5. The list names Search, References, Problems, LaTeX and the debug views only.

**B3. `layout.yml` line 34 is outside the ranges 1-30, 41-99.** It reads "as the sessions page's Files tab follows ... `state: { follow: true }`". Verify 3 prints it on the tree today, so verify 3 cannot print nothing without an edit outside the list.

**B4. Verify 3 is a command the builder may not run.** `spec.md:33` allows `git status`, `git diff` and `git show` only. Use `grep -rn -i ... --exclude=local.yml`. It also leaves out `README.md`, while item 9 says "anywhere". Its pattern misses HELP line 143 ("m Sessions").

**B5. Item 1 contradicts a case.** Item 1 says "With no session followed, the sections are not drawn and the list stands alone". The case "No session and no terminal" draws Customizations. Item 1 should name the four session sections and say that Customizations stays.

**B6. The case "A project card's session link: opens the Session tab in the documents pane" is false, and the step does not change that place.**
- `CardSessions.pick` (`CardSessions.svelte:44-52`) calls `sessionTab`. With no such tab it calls `openBeside`, which passes `document: false` to `openInto` and splits a pane to the right.
- On a page holding a `session-list` tab (the Explorer, a workbench) it activates that tab and opens no Session tab.
- Rewrite the case to those two results.

## Check 1: Names

Commands:
- `git grep -n -i -E "sessions (page|tab|rail|group)|sessions' page|page's group|sessions list" -- src`
- `git grep -n "session-list"` and `"session-detail"` over `src tests config docs README.md utils bin` with `':!config/local.yml'`
- `git grep -n "'sessions'\|\"sessions\""`
- `grep -n -E '`[a-z][0-9]`|`m`|chord' docs/HELP.md`
- `grep -rn -w share`, `grep -rn -w keeps`

Hits outside "Paths this step writes":

| Hit | False after the change? |
|---|---|
| `README.md:16`, `:25` "Sessions page" | Yes. Not named on the list by path |
| `docs/HELP.md:85` workbench Left/Right | Yes. Outside the line ranges |
| `docs/HELP.md:143` `m1-m3`, `s1-s8`, `m Sessions` | Yes. Outside the ranges |
| `docs/HELP.md:455` "in a list limited to a folder each session opens its own" | Yes, under item 7. Outside the ranges and inside O122's lines 455-462 |
| `docs/HELP.md:341`, `:473` | No |
| `config/defaults/layout.yml:34` | Yes (B3) |
| `src/lib/views/sources/notes-graph/NotesGraph.svelte` | Comment true, order must change (B2) |
| `src/lib/views/sources/repositories/Repositories.svelte:66` "added to the view's rail badge" | Yes, under item 8. Should say the view's count |
| `src/lib/state/workbench/layout/open/opening.ts:62` | Yes for a workbench with a Terminal tab |
| `src/lib/ui/controls/RowButton.svelte:5` | Yes if the rows become `TreeItem`s |
| `src/lib/views/shared/card/card.ts:54-69`, `CardSessions.svelte:50`, `context.ts:703`, `PickSession.svelte:31`, `limit.ts:3`, `FolderLine.svelte:4`, `counts.ts:35` | No |
| `config/options/layout.yml:340`, `config/text/statusbar.yml:94-95`, heads of `config/text/views/sessions/*.yml` | No |
| `docs/palette.md:41-42` | No. Written from the registry; labels unchanged |
| `tests/data/sources/config/workspace-layer.test.ts:74` | Goes red; covered by "the tests that name" |
| `tests/state/workbench/layout/folder-opener.test.ts:90` | Depends on Deposit's place (C8) |
| `tests/state/sessions/terminal/reading-tab.test.ts`, 'on Live closes' | Needs a pinned row under U1(a); not covered by the brief's wording |
| `tests/checks/config/config-folder.test.ts:442`, `layout-saved.test.ts:107`, `arrangements.test.ts` | No (reads the rail from the config, a fixture, and the pinning rule the brief obeys) |
| `src/routes/+page.svelte:296`, `groups.ts:123` and the other quoted `'sessions'` hits in `src` and `tests` | Channel names and settings words, unrelated |

The chord `m` has no reader by name. Chords come from `rail:` through `railOrder`. Its only literal places are `layout.yml:13` and `HELP.md:143`.

## Check 2: The step line

| Part of the line | Where it is in the brief |
|---|---|
| Sessions tab built like Repositories | Item 1 |
| List above, Details, Changes, Timeline, Agents under it | Items 1, 2 |
| Customizations a section | Item 1 |
| Rows of the Files look | Item 3 |
| Rail page and chord deleted | Item 5 |
| Saved layout changed once | Line 37 only, with no statement of what it changes (C10) |
| Explorer and workbench: editor over a bottom pane | Item 6 |
| Rail draws only `session-list`'s amber count | Item 8 |
| `repositories`, `problems` keep tab counts | Item 8 |
| Ruling 635 "both terminal lists kept" | Item 3 keeps the list's rows. The Terminal tab's own list is untouched by the paths |

Every part has a requirement. The saved layout part has one sentence and no content.

## Check 3: Premises

Reread from the files listed, with these commands:
- `sed` of the named lines
- `grep -n 'rail\|pages\|counts' .oculus/workspaces/research-hub.yml` prints nothing
- `grep -n '^counts\|^rail' .oculus/config.yml` prints nothing

| Claim | Result |
|---|---|
| `layout.yml` lines 13, 41-60, 85-99, 195-212, 318-324 | Holds |
| Rail badge sum and tone; `SessionList.svelte:16`; `Inbox.svelte:15` | Holds |
| The three views register `group: 'sessions'` | Holds |
| `SessionList` contents, 40 px rows | Holds |
| `SessionDetail` sections, `SessionList.svelte:246,343`, `CardSessions.svelte:50`, `context.ts:703` | Holds |
| `Repositories` one scrolling pane, the section frame folder | Holds |
| `followedSession` | Holds, and omits that `shown` is written only by `keepShown` (C2) |
| `open-session.ts` passes by a Terminal tab | Holds, for a session with no terminal only |
| `tree.ts:396` | Holds, with "and keeps no kind" |
| `opening.svelte.ts:30,109` "is the same rule for New" | **False.** `targetTab` (lines 111-118) already uses the page's Terminal tab first. `documents` applies only with none, so item 7 needs no change there for the list's New |
| `startOf` has no `terminal` case | Holds |
| `debug.svelte.ts:296` "shown where it is" | Holds on the same page only. No such view is `unique`, so from another page it opens there |
| Hub names no `rail:` or `pages:` | Holds |
| HELP lines 49-58, 225-260 | Holds |
| O122 "changes none of them" | Holds for code, but HELP 455 now overlaps once widened |
| O124 "on the `views` arrangement and the `findings` and `audit` rows" | **Incomplete.** O124's list also has line 307, the one-line `counts` comment that item 9 rewrites (C1) |
| Base copy | Not made yet: `ls -d .agents/worktrees/O123-base` says no such file. It is made after this check |

## Check 4: Cases against the rules

| Case | Result |
|---|---|
| Explorer, new page | Consistent |
| 200 sessions | Consistent |
| Press on a session | Consistent, except a terminal owned by another page's tab: `showIn` switches page |
| Closing, reordering, reload | Consistent. Names no tab; it should name both |
| A file opened | Consistent with `landingFor` |
| Timeline and Agents rows | Consistent given a Terminal tab. Without one, `openSession` lands in the left pane |
| Project card | **Inconsistent**, and asks about a place the step does not change (B6) |
| A workbench | Consistent. "New" is ambiguous (C3) |
| Last terminal ends | **Inconsistent** (U1) |
| Badge 2 in amber, 37 on the tab | Consistent. Nothing on the Explorer has a `badgeGlyph`; only `Linkedin.svelte` does |
| Status bar items | Ambiguous, and problems' path is off the list (U3) |
| Debug start | Consistent on the Explorer and a workbench |
| Find All References | Consistent on those pages (`lsp.ts:398` `openView`) |
| Narrow tab, rename | Consistent |
| Wallpaper | Consistent. Files and the list are both `tinted` with no `share` |
| No session and no terminal | **Inconsistent** with item 1 (B5) |

## Check 5: The question

| Thing | Could pass without the goal? | Reason |
|---|---|---|
| Explorer, new page | Yes | A new page proves the arrangement. A saved page takes `giveViews` (C10) |
| 200 sessions | Yes | No case states a row's height |
| Press | Yes | Passes with a terminal this page owns; another page's is untested |
| Closing, reordering | Yes | Could be seen on the Session tab alone |
| A file opened | No | `landingFor` takes the empty top pane |
| Timeline, Agents | Yes | "As they do now" holds while covering the list with no Terminal tab |
| Project card | Yes | Can only pass by a different result than it states |
| Workbench | Yes | The list's New passes while `n` goes to the hub (C3) |
| Last terminal | No | It fails as written (U1) |
| Badge | No | |
| Status bar | Yes | Passes on the Explorer alone |
| Debug start, References | No for the bottom pane on those pages | |
| Narrow, rename, wallpaper | No | |
| No session | Yes | One of two contradicting texts passes |
| Step line's check | Not applicable | The line names none |
| Verify 1 | Yes | Views have no test, so it proves config parses and types hold |
| Verify 2, 4 | Yes | They do not concern the goal |
| Verify 3 | Yes | Narrow pattern, no README |
| Verify 5 | Yes | It is a read of prose |
| Item 1 | Yes | Passes with a Tab stop per row (C5) |
| Item 2 | Yes | No check on both owners |
| Item 3 | Yes | Row contents left open (C4) |
| Item 4 | Yes | "As now" keeps `pick`'s Session tab unless item 7 is read with it (C6) |
| Item 5 | No, once B2 and U2 are settled | |
| Item 6 | No for the cases | "Is the documents pane" is marked only on a workbench; the Explorer relies on the empty-pane step |
| Item 7 | Yes | C3 |
| Item 8 | Yes for the status bar; no for the badge | |
| Item 9 | Yes | Verify 3 |

The real gate is the look at landing, which the brief says. Its rows need to name the saved page as well as a new page.

## Check 6: Implied inputs

Each item gives the input, what the code does now, and the expected result the brief should state.

**C2 Reload.** `keepShown` is called from `SessionPicker` and `Files`, and the list has neither a picker nor a call. After a reload `selected()` is null and `shown` was never written, so the sections go. Expected: the tab calls `keepShown` and shows what it showed.

**C3 New on a workbench.** `n` calls `composeIn` and the tab's menu calls `composeInTab`. Both reach `showComposer`. With no terminal `folderOf` is null, so `freshComposer` sets the hub and discards what `startOf` seeded. Expected: both start in the folder. This takes `terminals.svelte.ts` or a page folder read.

**C4 Row contents left open.**
- Session rows: the pin mark, the input `Tag` with `entry.hook?.message`, the amber left edge.
- Terminal rows: kind glyph and `Tag`, cwd, stamp, Stop and its armed words.
- The `GroupHead` heads inside the fold.

Expected: each is named as kept or moved to the hover words.

**C5 Keyboard (`TreeView`).** Each section is one stop. `RowButton` rows in `GroupHead` are one stop per row, so 200 stops come before the first section. Expected: the list is one `TreeView` as `RepoList` is, arrows scroll the row into the fold, Alt+Up acts only on section heads, and a letter typed in the rename field stays in the field. `TreeItem` has `onpressagain` for the double press.

**C6 A press on a workbench with a Terminal tab.** `pick` must stop opening `session-detail`. Item 7 does not say so.

**C7 Terminal rows, resume and fork.** Each calls `select(<terminal id>)`. `grouped()` holds sessions only (`selectors.svelte.ts:610`), and `sessionFor` gives null because the selection shadows `shown`, so the sections vanish. Expected: the sections follow `sessionOfTerminal`, and a by-hand terminal leaves the list alone.

**C8 Deposit's place.** Item 6 gives none, and `folder-opener.test.ts:90` asserts it follows Repositories. Expected: state it. After Repositories keeps the test true.

**C9 `session-detail`'s place in the group.** It is not in item 5's order. Expected: after Notes Graph (U2).

**C10 What the saved layout change does.** Stated nowhere.
- At load `giveViews` adds what the Explorer page lacks: `terminal` lands beside `latex` in the left pane, and `debug-console` beside `references` (`saved/views.ts:23-33`, `before` is the arrangement's previous view).
- Saved workbenches are left in the old shape and use the `documents` path.
- A saved page with key `sessions` does not break the page list: `buttonOf` gives null, the row draws its key, and it has no Reset.
- **Reset all pages would remove that page and end the terminals its tab owns** (`resetPlan` `removed`; the head comment of `terminals.svelte.ts`). The change therefore needs to be a data edit that leaves running agents alone. By reading, those terminals then join a tab through `showIn`; not run.
- Expected: the brief or the state file names the Explorer page, the Sessions page, each saved workbench and `Page.views`.

**C11 Row menu and notice press.** `SessionList.svelte:343` and `context.ts:703` open `session-detail` with no `document`, so on the Explorer the tab lands in the active pane, over the list. Expected: state whether they land in the top pane. `SessionList.svelte` is on the list, `context.ts` is not.

**C12 Files following a session.** The only shipped `follow: true` tab goes with the page. The Files toolbar keeps the control. Expected: name it as a decision.

**C13 Terminals of other pages.** Workbenches now own terminals, so `showIn` switches page more often. Expected: state "as now".

**C14 Glossary.** `git ls-files | grep -i glossary` prints nothing, so the report part "each term of `docs/glossary.md`" cannot be done. O122 and O124 carry the same line.

**C1 Merge with O124.** Line 307 is one line that both steps edit, and O123's `layout.yml` range covers 320-321. Landing one of them needs a by-hand merge of that comment. HELP line 52 also names Audit and Findings, and O124's list does not hold it.

Inputs checked with no defect:
- `Pane` `share` is `'editor' | 'terminal'`, set at `Terminal.svelte:366` and `Merge.svelte:175`. The move does not touch it, and the list passes none, as Files does.
- `landing.ts` with a nested split: `panes` and `paneAt` walk paths, so the empty top pane is found. A Terminal tab is a tool view and is not `received`, so the bottom pane takes no document.
- `folder-opener.ts`: `tabsOf`, `restate` and `markDocuments` walk the tree. The `views` arrangement already nests a `col` split. `markDocuments` marks the top pane.
- Two `session-list` tabs keep sections apart: state is by `instance.id`, folds go through `useInstance`, and `createListDrag` marks a type per list, so a drag between them is no drop. The selection is shared, as designed.

Paths the Read list needs beyond those named above: `terminal-lists.ts`, `selection.svelte.ts`, `composer.ts`, `ui/tree/TreeView.svelte`, `ui/tree/item-props.ts`.

## Check 7: ADRs

`ls docs/adr` prints `ls: docs/adr: No such file or directory`. The brief's line 5 holds.

## Check 8: Dictated text

Command: `grep -n -E "sizes: \[0\.6, 0\.4\]|A tab says how much|rail: false|tone: 'amber'|Explorer's group order|every command passed|LC_ALL=C grep|git grep -n|git diff --stat|change only by|No script is written|This step adds no test|Page cases are proved|No ADR folder|A design ruling decides|ten rows|40% of the height|Do not write there|stops there" .scratch/migration/agents/briefs/O123.md`

| Line | Text | Result |
|---|---|---|
| 5, 7 | No ADR folder; a design ruling decides | Holds |
| 23 | Do not write there | Holds |
| 31 | The group order | Holds as text; lacks Session (C9) |
| 32 | `sizes: [0.6, 0.4]` | Holds |
| 34 | "A tab says how much is in the view; the rail says only what needs the reader now." | Holds; ruling 635's words |
| 34 | `rail: false`, `tone: 'amber'` | Holds |
| 41 | Page cases by the look | Holds (`spec.md:65`) |
| 44, 98 | Ten rows | Holds |
| 61 | "This step adds no test" | Holds under `spec.md:60`, but the permitted edits name only arrangement, order or count, and U1(a) needs a row |
| 63 | The builder stops | Holds (`spec.md:7`) |
| 90, 92 | Diagrams, no script | Holds |
| 99 | 40% | Holds |
| 127 | `every command passed` | Holds |
| 128 | ASCII grep | Holds; `spec.md:103` replaces the form |
| 129 | `git grep` | **Breaks `spec.md:33`** (B4) |
| 130 | `git diff --stat` | Holds |
| 141 | `docs/glossary.md` | **The file does not exist** (C14) |

## Declined to judge

- Whether ten rows, 40% or the group order are the right values. Those are the brief's decisions.
- Whether keeping `session-detail` is right.
- How anything looks. Nothing ran on a page, and no case was run.
- O124's own brief, beyond its overlap with this one.
- Whether by-hand merging of line 307 is simple. That judgment belongs to the orchestrator's `shared_paths`.

Next: the orchestrator rewrites the brief with B1 to B6 and C1 to C14, and brings U1 to U3 to the user as open items.

## Usage

afb7b4f6cc7cbec97, claude-opus-5-5, 332174 tokens, 59 tool uses, 12 min 34 s

## Closed

- U1: ruling 636 (a), item 7's second paragraph, a case, a test row and the paths. U2: ruling 636 (a), item 5, decision 5. U3: ruling 636 (a), item 8 and the case read "while on the Explorer".
- B1: item 2 names `views/shared/sessions/sections/`, paths widened. B2: NotesGraph on the list. B3: the layout range is 1-99. B4: Verify 3 uses `grep -r`, reaches `README.md` and "m Sessions". B5: item 1 keeps Customizations. B6: the project card case removed, since this step does not change that place.
- C1: the premise on O124 names its lines; shared_paths in the entry. C2, C7: item 1. C3: item 7, `terminals.svelte.ts` on the list. C4: item 3. C5: item 1, a case. C6: item 4, a case. C8: item 6, decision 7. C9: item 5. C10: the paragraph after item 9, a case. C11: item 6, decision 8, `context.ts` on the list. C12: item 6, decision 6. C13: item 4. C14: the report's terms part.
- Premise false on `opening.svelte.ts:30,109`: corrected. HELP 85, 143, 455, `README.md`, `Repositories.svelte:66`, `opening.ts:62`, `RowButton.svelte:5`, `layout.yml:34`: item 9 and the paths.
- Dictated lines added and held: the group order sentence of item 5, the three path names, Verify 3.
